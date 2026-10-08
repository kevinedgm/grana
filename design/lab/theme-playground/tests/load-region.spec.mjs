// GLoadRegion sobre el COMPONENTE REAL del playground (packages/vue/playground, #sec-load-region), en Chromium, Firefox y
// WebKit. Puntos de navegador de design/contracts/load-region.md «Verificación» (DECISIONS.md #529 a #549), con
// design/lab/empty-skeleton/r01/verificar.mjs (kiwi) como base: tiempos reales (100/250/900/6000 ms), Δ0 (lista, teselas
// y ficha en texto libre; molde de lo último conocido con el mismo alto), anuncios y fusión en el canal de página, canal
// dentro de un GDialog modal, foco por clave, refresco keep (filo, píldora, inerte, cursor y contraste sin cambio), error
// que conserva, RTL, forced-colors (Chromium), 390 px con puntero grueso y consola limpia. La personalidad (revelado,
// 0 animaciones a 5,2 s, movimiento reducido, tono, lo nuevo) va en personalidad-load-region.spec.mjs.
import { test, expect } from '@playwright/test'
import { openLR, watchConsole, frames, trace, idle, loadAll, refreshList, live, top, running, btnAreas, expectClean } from './load-region-helpers.mjs'

const busyOf = (v) => /\bis-busy\b/.test(v || '')
const pendingOf = (v) => /\bis-pending\b/.test(v || '')
// Primer instante a la vista (ocupada y fuera del retraso) y fin (deja de estar ocupada), relativos al inicio
function phases(tr) {
  const start = tr.find((x) => busyOf(x.v))
  const shown = tr.find((x) => busyOf(x.v) && !pendingOf(x.v))
  const end = start ? tr.find((x) => x.t > start.t && !busyOf(x.v)) : null
  return { start: start?.t, shown: shown ? shown.t - start.t : null, end: end ? end.t - start.t : null }
}

test.describe('GLoadRegion · tiempos reales (#532)', () => {
  test('100 ms: el molde nunca se ve ni se anuncia el inicio; sí el fin', async ({ page }) => {
    const errs = await watchConsole(page)
    await openLR(page)
    const stop = await trace(page, '#lr-list')
    await loadAll(page, 100)
    await idle(page)
    const ph = phases(await stop())
    expect(ph.shown).toBe(null)
    const said = await live(page)
    expect(said.join(' | ')).not.toMatch(/Cargando muestras/)
    expect(said.join(' | ')).toMatch(/3 muestras\./)
    expectClean(errs)
  })

  test('250 ms: aparece hacia los 200 y llega a los ≥ 600 (mínimo de 400 a la vista)', async ({ page }) => {
    await openLR(page)
    const stop = await trace(page, '#lr-list')
    await loadAll(page, 250)
    await idle(page)
    const ph = phases(await stop())
    expect(ph.shown).toBeGreaterThanOrEqual(170)
    expect(ph.shown).toBeLessThan(400)
    expect(ph.end - ph.shown).toBeGreaterThanOrEqual(380)
    expect(await live(page)).toContain('Cargando muestras. Cargando el lote. Cargando el panel.')
  })

  test('900 ms: a la vista desde los 200 y llega con los datos', async ({ page }) => {
    await openLR(page)
    const stop = await trace(page, '#lr-list')
    await loadAll(page, 900)
    await idle(page)
    const ph = phases(await stop())
    expect(ph.shown).toBeLessThan(400)
    expect(ph.end).toBeGreaterThanOrEqual(850) // la traza ve el inicio tras el primer render
    expect(await page.locator('#lr-list .lr-row').count()).toBe(3)
  })

  test('6000 ms: a los 5 s texto visible, un anuncio y ninguna animación en curso', async ({ page }) => {
    await openLR(page)
    await loadAll(page, 6000)
    await page.waitForTimeout(5200)
    const st = await page.evaluate(() => {
      const r = document.querySelector('#lr-list')
      const slow = r.querySelector(':scope > .g-load-region__slow')
      const b = slow.getBoundingClientRect()
      return { cls: r.className, slow: slow.textContent, visible: getComputedStyle(slow).display !== 'none' && b.height > 0, busy: r.getAttribute('aria-busy') }
    })
    expect(st.cls).toMatch(/is-slow/)
    expect(st.visible).toBe(true)
    expect(st.slow).toBe('Sigue cargando muestras…')
    expect(st.busy).toBe('true')
    expect((await live(page)).filter((t) => /Sigue cargando muestras/.test(t))).toHaveLength(1)
    expect(await running(page, '#sec-load-region')).toEqual([])
    await idle(page, '#lr-list', 20000)
  })
})

test.describe('GLoadRegion · Δ0 (#535)', () => {
  test('primera carga: la lista, las teselas y la ficha en texto libre no mueven lo de debajo al llegar', async ({ page }) => {
    await openLR(page)
    await loadAll(page, 900)
    await page.waitForFunction(() => { const r = document.querySelector('#lr-list'); return r.classList.contains('is-mold') && !r.classList.contains('is-pending') })
    await page.waitForFunction(() => ['#lr-detail', '#lr-t1'].every((s) => !document.querySelector(s).classList.contains('is-pending')))
    const before = { list: await top(page, '#lr-list-after'), dash: await top(page, '#lr-dash-after'), detail: await top(page, '#lr-detail-after') }
    for (const s of ['#lr-list', '#lr-detail', '#lr-t1', '#lr-t2', '#lr-t3']) await idle(page, s)
    const after = { list: await top(page, '#lr-list-after'), dash: await top(page, '#lr-dash-after'), detail: await top(page, '#lr-detail-after') }
    for (const k of Object.keys(before)) expect(Math.abs(after[k] - before[k]), k).toBeLessThanOrEqual(1)
  })

  test('replace: el molde de lo último conocido mide exactamente lo mismo', async ({ page }) => {
    await openLR(page)
    await loadAll(page, 100)
    await idle(page)
    const h0 = await page.evaluate(() => document.querySelector('#lr-list').getBoundingClientRect().height)
    await page.selectOption('#lr-refresh-mode', 'replace')
    await refreshList(page, 900)
    await page.waitForFunction(() => { const r = document.querySelector('#lr-list'); return r.classList.contains('is-mold') && !r.classList.contains('is-pending') })
    const st = await page.evaluate(() => {
      const r = document.querySelector('#lr-list')
      return { h: r.getBoundingClientRect().height, hidden: r.querySelector('.g-load-region__body').getAttribute('aria-hidden'), inert: r.querySelector('.g-load-region__body').inert, pill: !!r.querySelector('.g-load-region__pill') }
    })
    expect(Math.abs(st.h - h0)).toBeLessThanOrEqual(0.5)
    expect(st.hidden).toBe('true')
    expect(st.inert).toBe(true)
    expect(st.pill).toBe(false)
    await idle(page)
  })
})

test.describe('GLoadRegion · lo último conocido (B, #536, #544)', () => {
  test('keep: lo de antes sigue, inerte, con filo, píldora, cursor progress y el mismo contraste (por píxeles)', async ({ page }) => {
    await openLR(page)
    await loadAll(page, 100)
    await idle(page)
    await frames(page)
    const row = page.locator('#lr-list .lr-row').nth(1)
    const shot0 = await row.screenshot()
    await refreshList(page, 1500)
    await page.waitForFunction(() => document.querySelector('#lr-list').classList.contains('is-stale'))
    await page.mouse.move(2, 2)
    await frames(page)
    const st = await page.evaluate(() => {
      const r = document.querySelector('#lr-list')
      const body = r.querySelector('.g-load-region__body')
      const pill = r.querySelector('.g-load-region__pill')
      const edge = getComputedStyle(r, '::before')
      const bw = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--g-border-width')) || 1
      return {
        inert: body.inert, hidden: body.getAttribute('aria-hidden'), filter: getComputedStyle(body).filter,
        cursor: getComputedStyle(r).cursor, edgeH: parseFloat(edge.height), bw,
        pill: pill && { text: pill.textContent, hidden: pill.getAttribute('aria-hidden'), visible: pill.getBoundingClientRect().width > 0, icon: !!pill.querySelector('svg') },
        rows: r.querySelectorAll('.lr-row').length
      }
    })
    expect(st.inert).toBe(true)
    expect(st.hidden).toBe(null)
    expect(st.filter).toBe('none')
    expect(st.cursor).toBe('progress')
    expect(Math.abs(st.edgeH - st.bw * 2)).toBeLessThanOrEqual(0.5)
    expect(st.pill).toEqual({ text: 'Actualizando', hidden: 'true', visible: true, icon: true })
    expect(st.rows).toBe(3)
    const shot1 = await row.screenshot()
    expect(Buffer.compare(shot0, shot1)).toBe(0)
    await idle(page)
    // Lo nuevo llega marcado, con texto, y el anuncio lo cuenta
    const fresh = await page.evaluate(() => [...document.querySelectorAll('#lr-list [data-g-fresh]')].map((n) => [n.getAttribute('data-g-key'), n.querySelector('.g-badge')?.textContent.trim()]))
    expect(fresh).toEqual([['m10', 'Nueva']])
    expect(await live(page)).toContain('4 muestras, 1 nueva.')
  })

  test('error con contenido: lo conocido se queda, usable, con la barra antes del cuerpo y se anuncia', async ({ page }) => {
    await openLR(page)
    await loadAll(page, 100)
    await idle(page)
    await refreshList(page, 300, 'error')
    await page.waitForFunction(() => document.querySelector('#lr-list').classList.contains('is-failed'))
    await page.waitForTimeout(100)
    const st = await page.evaluate(() => {
      const r = document.querySelector('#lr-list')
      const bar = r.querySelector(':scope > .g-load-region__failed')
      return {
        next: bar.nextElementSibling.className, icon: bar.querySelector('.g-load-region__failed-icon').getAttribute('aria-hidden'),
        text: bar.querySelector('.g-load-region__failed-text').textContent, btn: bar.querySelector('.g-btn').className,
        inert: r.querySelector('.g-load-region__body').inert, rows: r.querySelectorAll('.lr-row').length
      }
    })
    expect(st.next).toBe('g-load-region__body')
    expect(st.icon).toBe('true')
    expect(st.text).toBe('No se pudo actualizar. Lo que ves es lo último que llegó.')
    expect(st.btn).toMatch(/g-btn--size-sm/)
    expect(st.btn).toMatch(/g-btn--variant-soft/)
    expect(st.btn).toMatch(/g-btn--color-neutral/)
    expect(st.inert).toBe(false)
    expect(st.rows).toBe(3)
    expect(await live(page)).toContain('No se pudo actualizar. Lo que ves es lo último que llegó.')
    // «Reintentar» por teclado: la barra se va con el foco dentro → raíz (nunca body), y allí sigue al llegar
    await page.evaluate(() => window.lrCtl.setLatency(900))
    await page.locator('#lr-list .g-load-region__failed .g-btn').focus()
    await page.keyboard.press('Enter')
    await frames(page)
    expect(await page.evaluate(() => document.activeElement.id)).toBe('lr-list')
    await idle(page)
    expect(await page.evaluate(() => document.activeElement.id)).toBe('lr-list')
  })
})

test.describe('GLoadRegion · anuncios (#533)', () => {
  test('fusión: tres regiones que se ven a la vez dicen una frase; las teselas no hablan (grupo)', async ({ page }) => {
    await openLR(page)
    await loadAll(page, 900)
    for (const s of ['#lr-list', '#lr-detail', '#lr-t3']) await idle(page, s)
    await page.waitForTimeout(150)
    const said = await live(page)
    expect(said[0]).toBe('Cargando muestras. Cargando el lote. Cargando el panel.')
    expect(said).toContain('Panel actualizado.')
    expect(said.join(' | ')).not.toMatch(/(^|\| )(Cargando\.|Cargada\.)/)
    expect(said.some((t) => /3 muestras\./.test(t))).toBe(true)
    expect(await page.evaluate(() => document.querySelectorAll('.g-load-live').length)).toBe(1)
    const ch = await page.evaluate(() => { const n = document.querySelector('.g-load-live'); return [n.parentElement.tagName, n.getAttribute('aria-live'), n.getAttribute('aria-atomic'), !!n.closest('[aria-busy="true"]')] })
    expect(ch).toEqual(['BODY', 'polite', 'true', false])
  })

  test('el canal se traslada al GDialog modal abierto y vuelve a body al cerrarlo', async ({ page }) => {
    const errs = await watchConsole(page)
    await openLR(page, { target: '#lr-open-dialog' })
    await page.evaluate(() => { window.lrCtl.setLatency(900); window.lrLive.length = 0 })
    await page.click('#lr-open-dialog')
    await page.waitForFunction(() => document.querySelector('.g-load-live')?.closest('dialog[open]'))
    await idle(page, '#lr-dlg-region')
    await page.waitForTimeout(120)
    const said = await live(page)
    expect(said).toContain('Cargando el historial.')
    expect(said).toContain('3 movimientos.')
    await page.keyboard.press('Escape')
    await page.waitForFunction(() => document.querySelector('.g-load-live')?.parentElement === document.body)
    expectClean(errs)
  })
})

test.describe('GLoadRegion · foco (#534)', () => {
  test('dentro: pasa a la raíz al empezar y vuelve al mismo enlace por clave al llegar; nunca body', async ({ page }) => {
    await openLR(page)
    await loadAll(page, 100)
    await idle(page)
    await page.locator('#lr-list [data-g-key="m8"] a').focus()
    await refreshList(page, 900)
    await frames(page)
    expect(await page.evaluate(() => document.activeElement.id)).toBe('lr-list')
    await idle(page)
    const a = await page.evaluate(() => [document.activeElement.tagName, document.activeElement.closest('[data-g-key]')?.getAttribute('data-g-key')])
    expect(a).toEqual(['A', 'm8'])
  })

  test('fuera: «Refrescar la lista» conserva el foco', async ({ page }) => {
    await openLR(page)
    await loadAll(page, 100)
    await idle(page)
    await page.evaluate(() => window.lrCtl.setLatency(900))
    await page.locator('#lr-go-refresh').focus()
    await page.keyboard.press('Enter')
    await idle(page)
    expect(await page.evaluate(() => document.activeElement.id)).toBe('lr-go-refresh')
  })

  test('el molde no tiene enfocables alcanzables (inert) y la raíz es un group con nombre', async ({ page }) => {
    await openLR(page)
    await loadAll(page, 6000)
    await page.waitForFunction(() => document.querySelector('#lr-list').classList.contains('is-mold'))
    const st = await page.evaluate(() => {
      const r = document.querySelector('#lr-list')
      const links = [...r.querySelectorAll('a')]
      links[0]?.focus()
      return { inert: r.querySelector('.g-load-region__body').inert, focused: document.activeElement === links[0], role: r.getAttribute('role'), by: r.getAttribute('aria-labelledby'), tab: r.getAttribute('tabindex') }
    })
    expect(st).toEqual({ inert: true, focused: false, role: 'group', by: 'lr-h-list', tab: '-1' })
    const snap = await page.locator('#lr-list').ariaSnapshot()
    expect(snap).not.toMatch(/Tipo · Nombre Apellido/)
  })
})

test.describe('GLoadRegion · RTL', () => {
  test('el molde hereda la dirección y la píldora va al final lógico', async ({ page }) => {
    await openLR(page, { target: '#lr-rtl-panel' })
    await page.evaluate(() => window.lrCtl.setLatency(900))
    await page.click('#lr-rtl-load')
    await page.waitForFunction(() => { const r = document.querySelector('#lr-rtl'); return r.classList.contains('is-mold') && !r.classList.contains('is-pending') })
    const st = await page.evaluate(() => {
      const leaf = document.querySelector('#lr-rtl .lr-title')
      const cs = getComputedStyle(leaf)
      const row = document.querySelector('#lr-rtl .lr-row').getBoundingClientRect()
      const av = document.querySelector('#lr-rtl .lr-av').getBoundingClientRect()
      return { dir: cs.direction, deco: cs.textDecorationLine, avRight: Math.round(row.right - av.right) }
    })
    expect(st.dir).toBe('rtl')
    expect(st.deco).toBe('line-through')
    expect(st.avRight).toBeLessThan(40) // el avatar del molde al inicio lógico (derecha)
    await idle(page, '#lr-rtl')
  })
})

test.describe('GLoadRegion · colores forzados (Chromium)', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'forced-colors solo se emula en Chromium')
  test('el molde en GrayText y la muestra sin tinta (no se lee como dato)', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' })
    await openLR(page)
    await loadAll(page, 6000)
    await page.waitForFunction(() => { const r = document.querySelector('#lr-list'); return r.classList.contains('is-mold') && !r.classList.contains('is-pending') })
    const st = await page.evaluate(() => {
      const probe = document.createElement('span'); probe.style.color = 'GrayText'; document.body.append(probe)
      const gray = getComputedStyle(probe).color; probe.remove()
      const leaf = document.querySelector('#lr-list .lr-title')
      const cs = getComputedStyle(leaf)
      return { gray, deco: cs.textDecorationColor, color: cs.color, line: cs.textDecorationLine }
    })
    expect(st.line).toBe('line-through')
    expect(st.deco).toBe(st.gray)
    expect(st.color).toMatch(/rgba\(0, 0, 0, 0\)|transparent/)
  })
})

test.describe('GLoadRegion · 390 px con puntero grueso', () => {
  test.skip(({ browserName }) => browserName === 'firefox', 'Firefox: sin puntero grueso en Playwright')
  test.use({ hasTouch: true, isMobile: true })
  test('«Reintentar» de la barra ≥ 44 × 44 y sin áreas solapadas; sin desborde', async ({ page }) => {
    await openLR(page, { width: 390, height: 844 })
    expect(await page.evaluate(() => matchMedia('(pointer: coarse)').matches)).toBe(true)
    await loadAll(page, 100)
    await idle(page)
    await refreshList(page, 100, 'error')
    await page.waitForFunction(() => document.querySelector('#lr-list').classList.contains('is-failed'))
    const a = await btnAreas(page, '#lr-list')
    expect(a.list.length).toBeGreaterThan(0)
    for (const b of a.list) { expect(b.w, b.text).toBeGreaterThanOrEqual(44); expect(b.h, b.text).toBeGreaterThanOrEqual(44) }
    expect(a.overlap).toEqual([])
    expect(await page.evaluate(() => document.querySelector('#lr-list').scrollWidth <= document.querySelector('#lr-list').clientWidth + 1)).toBe(true)
  })
})
