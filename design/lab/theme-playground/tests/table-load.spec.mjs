// La carga de GTable con el motor común (table.md «Carga, vacío y error con el motor común», #540; load-region.md #531 a
// #539) sobre el COMPONENTE REAL del playground (#lr-table en #sec-load-region), en Chromium, Firefox y WebKit: tiempos
// reales (retraso y mínimo), filas del esqueleto = filas a la vista y Δ0 al refrescar, sin pulso y 0 animaciones a 5,2 s
// con la espera larga, error con filas (barra) y sin filas (GEmpty), vacío con GEmpty, foco por rowKey, anuncios en su
// región (#265) y forced-colors en Chromium.
import { test, expect } from '@playwright/test'
import { openLR, watchConsole, frames, running, expectClean } from './load-region-helpers.mjs'

const T = '#lr-table'
const tableIdle = async (page, timeout = 15000) => {
  await page.waitForFunction((s) => document.querySelector(`${s} table`).getAttribute('aria-busy') === 'false', T, { timeout })
  await page.waitForTimeout(80)
}
const region = (page) => page.evaluate((s) => document.querySelector(`${s} > p.g-table__sr[aria-live]`).textContent, T)
const load = (page, ms, out = 'data') => page.evaluate(([ms, out]) => window.lrCtl.loadTable(ms, out), [ms, out])
// Muestra por cuadros: ¿hay esqueleto?, ¿dentro del retraso?
async function sample(page) {
  await page.evaluate((s) => {
    const root = document.querySelector(s)
    const out = (window.__tb = [])
    const t0 = performance.now()
    window.__tbStop = false
    const tick = () => {
      out.push({ t: Math.round(performance.now() - t0), sk: !!root.querySelector('tbody .g-table__skeleton'), pending: root.classList.contains('is-pending'), busy: root.querySelector('table').getAttribute('aria-busy') === 'true' })
      if (!window.__tbStop) requestAnimationFrame(tick)
    }
    tick()
  }, T)
  return () => page.evaluate(() => { window.__tbStop = true; return window.__tb })
}

test.describe('GTable · motor común: tiempos (#540)', () => {
  test('100 ms: el esqueleto nunca se ve (las filas siguen) ni se anuncia «cargando»; sí el recuento', async ({ page }) => {
    const errs = await watchConsole(page)
    await openLR(page, { target: '#lr-h-table' })
    const stop = await sample(page)
    await load(page, 100)
    await tableIdle(page)
    const s = await stop()
    expect(s.some((x) => x.sk && !x.pending)).toBe(false)
    expect(s.some((x) => x.busy)).toBe(true)
    expect(await region(page)).toBe('5 clientes')
    expectClean(errs)
  })

  test('250 ms: el esqueleto aparece hacia los 200 y las filas vuelven a los ≥ 600', async ({ page }) => {
    await openLR(page, { target: '#lr-h-table' })
    const stop = await sample(page)
    const t0 = await page.evaluate(() => performance.now())
    await load(page, 250)
    await tableIdle(page)
    const s = await stop()
    const first = s.find((x) => x.busy)
    const shown = s.find((x) => x.sk && !x.pending)
    const back = s.find((x) => x.t > shown.t && !x.sk)
    expect(shown.t - first.t).toBeGreaterThanOrEqual(170)
    expect(shown.t - first.t).toBeLessThan(400)
    expect(back.t - shown.t).toBeGreaterThanOrEqual(380)
    expect(t0).toBeGreaterThan(0)
  })
})

test.describe('GTable · el esqueleto (#540, #539)', () => {
  test('tantas filas esqueleto como había a la vista, quietas, y lo de debajo no se mueve (Δ0 al refrescar)', async ({ page }) => {
    await openLR(page, { target: '#lr-h-table' })
    const before = await page.evaluate((s) => ({ rows: document.querySelectorAll(`${s} tbody tr`).length, after: document.querySelector('#lr-table-after').getBoundingClientRect().top + scrollY }), T)
    await load(page, 1500)
    await page.waitForFunction((s) => { const r = document.querySelector(s); return !!r.querySelector('tbody .g-table__skeleton') && !r.classList.contains('is-pending') }, T)
    await frames(page)
    const st = await page.evaluate((s) => {
      const r = document.querySelector(s)
      const sk = [...r.querySelectorAll('.g-table__skeleton')]
      return {
        rows: r.querySelectorAll('tbody tr').length, hidden: [...r.querySelectorAll('tbody tr')].every((tr) => tr.getAttribute('aria-hidden') === 'true'),
        after: document.querySelector('#lr-table-after').getBoundingClientRect().top + scrollY,
        anim: sk.map((n) => getComputedStyle(n).animationName).filter((a) => a !== 'none'),
        inert: r.querySelector('tbody').inert, end: [...r.querySelectorAll('tbody tr:first-child td.g-table__cell--end')].length,
        tab: r.querySelector('table').getAttribute('tabindex'), cls: r.className
      }
    }, T)
    expect(st.rows).toBe(before.rows)
    expect(st.hidden).toBe(true)
    expect(Math.abs(st.after - before.after)).toBeLessThanOrEqual(1)
    expect(st.anim).toEqual([])
    expect(st.inert).toBe(true)
    expect(st.end).toBe(1)
    expect(st.tab).toBe('-1')
    expect(st.cls).toMatch(/is-loading/)
    expect(await running(page, T)).toEqual([])
    expect(await region(page)).toBe('Cargando clientes…')
    await tableIdle(page)
  })

  test('a los 5,2 s: is-slow, la línea al pie del área sin mover nada, un anuncio y ninguna animación', async ({ page }) => {
    await openLR(page, { target: '#lr-h-table' })
    const after0 = await page.evaluate(() => document.querySelector('#lr-table-after').getBoundingClientRect().top)
    await load(page, 6000)
    await page.waitForTimeout(5200)
    const st = await page.evaluate((s) => {
      const r = document.querySelector(s)
      const slow = r.querySelector('.g-table__scroll > p.g-table__slow')
      return { cls: r.className, last: slow === slow.parentElement.lastElementChild, text: slow.textContent, shown: getComputedStyle(slow).display !== 'none', after: document.querySelector('#lr-table-after').getBoundingClientRect().top }
    }, T)
    expect(st.cls).toMatch(/is-slow/)
    expect(st.last).toBe(true)
    expect(st.shown).toBe(true)
    expect(st.text).toBe('Sigue cargando clientes…')
    expect(Math.abs(st.after - after0)).toBeLessThanOrEqual(1)
    expect(await region(page)).toBe('Sigue cargando clientes…')
    expect(await running(page, T)).toEqual([])
    await tableIdle(page, 20000)
  })
})

test.describe('GTable · error, vacío y foco (#540, #327, #534)', () => {
  test('error con filas: se quedan, usables, con la barra antes del área; anuncia el fallo; announceError false calla', async ({ page }) => {
    await openLR(page, { target: '#lr-h-table' })
    await load(page, 300, 'error')
    await tableIdle(page)
    const st = await page.evaluate((s) => {
      const r = document.querySelector(s)
      const bar = r.querySelector(':scope > .g-table__failed')
      return {
        next: bar.nextElementSibling.className, icon: bar.querySelector('.g-table__failed-icon').getAttribute('aria-hidden'), text: bar.querySelector('p.g-table__failed-text').textContent,
        btn: bar.querySelector('.g-btn').className, cls: r.className, rows: r.querySelectorAll('tbody .g-table__row').length, inert: r.querySelector('tbody').inert
      }
    }, T)
    expect(st.next).toBe('g-table__scroll')
    expect(st.icon).toBe('true')
    expect(st.text).toBe('No se pudieron cargar los clientes.')
    expect(st.btn).toMatch(/g-btn--size-sm.*g-btn--variant-soft|g-btn--variant-soft.*g-btn--size-sm/)
    expect(st.btn).toMatch(/g-btn--color-neutral/)
    expect(st.cls).toMatch(/is-failed/)
    expect(st.rows).toBe(5)
    expect(st.inert).toBe(false)
    expect(await region(page)).toBe('No se pudieron cargar los clientes.')
    await page.uncheck('#lr-tb-announce')
    await load(page, 300, 'error')
    await tableIdle(page)
    expect(await region(page)).toBe('')
    expect(await page.locator(`${T} .g-table__failed`).count()).toBe(1)
  })

  test('sin filas: vacío con GEmpty (none) y fallo con GEmpty cause="error" cuyo «Reintentar» emite retry', async ({ page }) => {
    await openLR(page, { target: '#lr-h-table' })
    await load(page, 100, 'empty')
    await tableIdle(page)
    expect(await page.evaluate((s) => { const e = document.querySelector(`${s} td.g-table__empty > .g-empty`); return [e.className, e.querySelector('.g-empty__title').textContent] }, T))
      .toEqual(['g-empty g-empty--cause-none', 'Aún no hay clientes.'])
    expect(await region(page)).toBe('0 clientes')
    await load(page, 100, 'error')
    await tableIdle(page)
    const e = page.locator(`${T} td.g-table__empty > .g-empty.g-empty--cause-error`)
    await expect(e.locator('.g-empty__title')).toHaveText('No se pudieron cargar los clientes.')
    expect(await region(page)).toBe('No se pudieron cargar los clientes.')
    await e.locator('.g-btn').click()
    expect(await page.evaluate(() => window.lrEvents.at(-1))).toEqual({ name: 'retry', payload: 'table' })
    await tableIdle(page)
    expect(await page.locator(`${T} tbody .g-table__row`).count()).toBe(5)
  })

  test('foco: del <tbody> al <table> al empezar y, al llegar en otro orden, al mismo enlace de la misma fila (rowKey)', async ({ page }) => {
    await openLR(page, { target: '#lr-h-table' })
    await page.locator(`${T} a[href="#k1"]`).focus()
    await load(page, 900, 'reorder')
    await frames(page)
    expect(await page.evaluate((s) => document.activeElement === document.querySelector(`${s} table`), T)).toBe(true)
    await tableIdle(page)
    const a = await page.evaluate(() => [document.activeElement.tagName, document.activeElement.getAttribute('href'), [...document.activeElement.closest('tbody').rows].indexOf(document.activeElement.closest('tr'))])
    expect(a).toEqual(['A', '#k1', 0])
  })
})

test.describe('GTable · colores forzados (Chromium)', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'forced-colors solo se emula en Chromium')
  test('las barras del esqueleto en GrayText', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' })
    await openLR(page, { target: '#lr-h-table' })
    await load(page, 6000)
    await page.waitForFunction((s) => { const r = document.querySelector(s); return !!r.querySelector('.g-table__skeleton') && !r.classList.contains('is-pending') }, T)
    const st = await page.evaluate((s) => {
      const probe = document.createElement('span'); probe.style.color = 'GrayText'; document.body.append(probe)
      const gray = getComputedStyle(probe).color; probe.remove()
      return { gray, bg: getComputedStyle(document.querySelector(`${s} .g-table__skeleton`)).backgroundColor }
    }, T)
    expect(st.bg).toBe(st.gray)
  })
})
