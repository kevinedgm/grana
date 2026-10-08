// Personalidad de GLoadRegion (#542) sobre el COMPONENTE REAL del playground (#sec-load-region), en Chromium, Firefox y
// WebKit: A «la tinta llega a su sitio» (revelado por color, sin desplazar ni escalar, que termina; fases is-mold →
// is-mold + is-revealing → nada, #545), «ninguna animación de carga pasa de 5 s» (#539), movimiento reducido (revelado en
// --g-duration-fast), tono del molde ≥ 1,3:1 en claro y oscuro con el tema por defecto y el de prueba (#538), y B «nada se
// borra»: lo nuevo con su marca al inicio lógico sin cambiar la caja (#536).
import { test, expect } from '@playwright/test'
import { openLR, frames, idle, loadAll, refreshList, running } from './load-region-helpers.mjs'

// Muestrea por cuadros, desde que el molde se ve hasta el reposo: clases y posición de las hojas de la primera fila
async function sampleReveal(page, sel) {
  return page.evaluate((s) => new Promise((resolve) => {
    const r = document.querySelector(s)
    const out = []
    const t0 = performance.now()
    const tick = () => {
      const leaves = [...r.querySelectorAll('.g-load-region__body [data-g-key]:first-child *')].filter((n) => !n.children.length)
      const title = r.querySelector('.lr-title')
      const cs = title ? getComputedStyle(title) : null
      out.push({
        t: Math.round(performance.now() - t0), cls: r.className,
        rects: leaves.map((n) => { const b = n.getBoundingClientRect(); return [Math.round(b.left * 10) / 10, Math.round(b.top * 10) / 10, Math.round(b.width * 10) / 10, Math.round(b.height * 10) / 10] }),
        tp: cs ? cs.transitionProperty : '', td: cs ? cs.transitionDuration : '', color: cs ? cs.color : '', transform: cs ? cs.transform : ''
      })
      if (r.getAttribute('aria-busy') === 'false' && !r.classList.contains('is-mold') && out.length > 3) return resolve(out)
      if (performance.now() - t0 > 12000) return resolve(out)
      requestAnimationFrame(tick)
    }
    tick()
  }), sel)
}

test.describe('GLoadRegion · A «la tinta llega a su sitio» (#535, #545)', () => {
  test('revelado: is-mold → is-mold + is-revealing → nada; solo color; ninguna hoja se mueve ni escala; termina', async ({ page }) => {
    await openLR(page)
    await loadAll(page, 900)
    await page.waitForFunction(() => { const r = document.querySelector('#lr-list'); return r.classList.contains('is-mold') && !r.classList.contains('is-pending') })
    const s = await sampleReveal(page, '#lr-list')
    const has = (x, c) => x.cls.split(/\s+/).includes(c)
    expect(s.some((x) => has(x, 'is-revealing') && !has(x, 'is-mold'))).toBe(false)
    const rev = s.filter((x) => has(x, 'is-revealing'))
    expect(rev.length).toBeGreaterThan(0)
    // Hubo un cuadro en molde con los datos reales antes del revelado (sin is-busy)
    const firstRev = s.indexOf(rev[0])
    expect(s.slice(0, firstRev).some((x) => has(x, 'is-mold') && !has(x, 'is-busy'))).toBe(true)
    // Durante el revelado, la transición es solo de color
    const tp = rev[0].tp.split(',').map((x) => x.trim())
    expect(tp.length).toBeGreaterThan(0)
    for (const p of tp) expect(['color', 'text-decoration-color', 'background-color', 'border-color', 'outline-color', 'box-shadow']).toContain(p)
    // Nada se desplaza ni escala: las hojas de la primera fila en el revelado y al final, en el mismo sitio
    const end = s[s.length - 1]
    expect(end.cls.trim()).toBe('g-load-region')
    for (const x of rev) {
      expect(x.transform).toBe('none')
      x.rects.forEach((r, i) => r.forEach((v, k) => expect(Math.abs(v - end.rects[i][k]), `hoja ${i}`).toBeLessThanOrEqual(0.5)))
    }
    // Termina: el revelado dura lo que la transición (--g-duration-slow) más un margen, no más de 1 s
    const dur = rev[rev.length - 1].t - rev[0].t
    expect(dur).toBeLessThan(1000)
    expect(end.tp).not.toMatch(/color/)
  })

  test('movimiento reducido: el revelado sigue siendo un fundido, en --g-duration-fast', async ({ page }) => {
    await openLR(page, { motion: 'reduce' })
    // Observador de clases (no por cuadros: con movimiento reducido el revelado dura ~200 ms y un cuadro lento lo saltaría)
    await page.evaluate(() => {
      const r = document.querySelector('#lr-list')
      window.__rev = []
      new MutationObserver(() => {
        if (r.classList.contains('is-revealing')) {
          const t = r.querySelector('.lr-title')
          window.__rev.push({ cls: r.className, td: t ? getComputedStyle(t).transitionDuration : '' })
        }
      }).observe(r, { attributes: true, attributeFilter: ['class'] })
    })
    await loadAll(page, 900)
    await idle(page)
    const fast = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--g-duration-fast').trim())
    const rev = await page.evaluate(() => window.__rev)
    expect(rev.length).toBeGreaterThan(0)
    expect(rev.every((x) => /is-mold/.test(x.cls))).toBe(true)
    const ms = (v) => (v.endsWith('ms') ? parseFloat(v) : parseFloat(v) * 1000)
    expect(ms(rev[0].td.split(',')[0].trim())).toBe(ms(fast))
  })
})

test.describe('GLoadRegion · quietud (#539)', () => {
  test('a los 5,2 s ninguna animación en curso en la sección (regiones, molde y tabla cargando)', async ({ page }) => {
    await openLR(page)
    await page.evaluate(() => { window.lrCtl.setLatency(6000); window.lrCtl.loadAll(); window.lrCtl.loadTable(6000, 'data') })
    await page.waitForTimeout(5200)
    expect(await page.evaluate(() => document.querySelector('#lr-list').classList.contains('is-slow'))).toBe(true)
    expect(await running(page, '#sec-load-region')).toEqual([])
    // Ningún keyframe infinito en curso (los giros de GBtn existen en reposo, pausados: no cuentan)
    const inf = await page.evaluate(() => { const sec = document.querySelector('#sec-load-region'); return document.getAnimations().filter((a) => a.playState === 'running' && a.effect && sec.contains(a.effect.target) && a.effect.getComputedTiming().iterations === Infinity).length })
    expect(inf).toBe(0)
  })
})

test.describe('GLoadRegion · tono del molde ≥ 1,3:1 (#538)', () => {
  for (const scheme of ['light', 'dark']) {
    for (const themed of [false, true]) {
      test(`${scheme} · ${themed ? 'tema de prueba' : 'tema por defecto'}`, async ({ page }) => {
        await openLR(page, { scheme })
        if (themed) {
          await page.getByRole('button', { name: /Tema de prueba/ }).click()
          await frames(page)
        }
        await loadAll(page, 6000)
        await page.waitForFunction(() => { const r = document.querySelector('#lr-list'); return r.classList.contains('is-mold') && !r.classList.contains('is-pending') })
        const r = await page.evaluate(() => {
          const leaf = document.querySelector('#lr-list .lr-title')
          return window.__ratio(window.__rgb(getComputedStyle(leaf).textDecorationColor), window.__bgOf(leaf))
        })
        expect(r).toBeGreaterThanOrEqual(1.3)
      })
    }
  }
})

test.describe('GLoadRegion · B «nada se borra» (#536)', () => {
  test('lo nuevo: marca al inicio lógico de border × 3 sin cambiar la caja, con «Nueva» como texto', async ({ page }) => {
    await openLR(page)
    await loadAll(page, 100)
    await idle(page)
    const w0 = await page.evaluate(() => document.querySelector('#lr-list [data-g-key="m9"]').getBoundingClientRect().width)
    await refreshList(page, 300)
    await idle(page)
    const st = await page.evaluate(() => {
      const n = document.querySelector('#lr-list [data-g-fresh]')
      const b = n.getBoundingClientRect()
      const m = getComputedStyle(n, '::before')
      const bw = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--g-border-width')) || 1
      return { key: n.getAttribute('data-g-key'), w: b.width, markW: parseFloat(m.width), markLeft: parseFloat(m.left), bw, text: n.querySelector('.g-badge')?.textContent.trim(), others: document.querySelectorAll('#lr-list [data-g-fresh]').length }
    })
    expect(st.key).toBe('m10')
    expect(st.others).toBe(1)
    expect(Math.abs(st.w - w0)).toBeLessThanOrEqual(0.5)
    expect(Math.abs(st.markW - st.bw * 3)).toBeLessThanOrEqual(0.5)
    expect(st.markLeft).toBe(0)
    expect(st.text).toBe('Nueva')
  })
})
