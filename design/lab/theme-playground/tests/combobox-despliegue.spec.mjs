// GCombobox · A («el campo se abre») CON MOVIMIENTO: durante el despliegue (0fr → 1fr en --g-duration-slow) el panel mide
// menos de lo que medirá. Defecto de la Fase 1 visto al construir la Fase 2: abrir con ↓ desplazaba el panel contra ese
// alto pasajero (82 px en cb-dx) y la opción activa quedaba tapada por el campo. Los demás specs usan movimiento
// reducido y no lo ven. Aquí se mide cuadro a cuadro, sin reduced motion, la forma, el panel y la opción activa.
import { test, expect } from '@playwright/test'
import { open, watchConsole } from './combobox-helpers.mjs'

/** Graba cada cuadro desde antes de la tecla hasta pasado el despliegue. El despliegue se dilata (--g-duration-slow a
 *  1200 ms, tema sin capa) para que WebKit sin cabeza, que pinta cada 40 ms o más con carga, también lo muestree */
async function record(page, id) {
  await page.addStyleTag({ content: ':root { --g-duration-slow: 1200ms; }' })
  await page.evaluate((id) => {
    const i = document.getElementById(id)
    const slow = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--g-duration-slow')) || 300
    window.__frames = []
    const t0 = performance.now()
    const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return { top: b.top, bottom: b.bottom, h: b.height } }
    const tick = () => {
      const pop = document.getElementById(id + '-popup')
      const panel = pop && pop.matches(':popover-open') ? pop.querySelector('.g-combobox__panel') : null
      const act = i.getAttribute('aria-activedescendant')
      window.__frames.push({
        t: performance.now() - t0, ctl: r(i.closest('.g-input__control')), pop: panel ? r(pop) : null, panel: r(panel),
        st: panel ? panel.scrollTop : null, act: act ? r(document.getElementById(act)) : null, actId: act,
        up: i.closest('.g-combobox').classList.contains('is-up')
      })
      if (performance.now() - t0 < slow * 2 + 250) requestAnimationFrame(tick)
      else window.__done = true
    }
    window.__done = false
    requestAnimationFrame(tick)
  }, id)
  await page.keyboard.press('ArrowDown')
  await page.waitForFunction(() => window.__done, null, { timeout: 5000 })
  return page.evaluate(() => window.__frames)
}

/** Las comprobaciones de cada cuadro con panel y opción activa */
function check(frames, { first = true } = {}) {
  const shown = frames.filter((f) => f.panel && f.panel.h > 0 && f.act)
  expect(shown.length, 'cuadros con panel y opción activa').toBeGreaterThan(5)
  const heights = new Set(shown.map((f) => Math.round(f.panel.h)))
  expect(heights.size, 'el panel se despliega en varios cuadros (hay movimiento)').toBeGreaterThan(3)
  const up = shown[0].up
  const edge0 = up ? shown[0].pop.bottom : shown[0].pop.top
  const st0 = shown[0].st
  for (const [k, f] of shown.entries()) {
    const at = `cuadro ${k} (${Math.round(f.t)} ms)`
    expect(f.up, `${at}: el lado no cambia`).toBe(up)
    // La forma no se mueve: empieza en el borde superior de la caja (o termina en el inferior, is-up)
    expect(Math.abs((up ? f.pop.bottom : f.pop.top) - edge0), `${at}: la forma se movió`).toBeLessThan(1)
    expect(Math.abs((up ? f.pop.bottom - f.ctl.bottom : f.pop.top - f.ctl.top)), `${at}: forma pegada a la caja`).toBeLessThan(1)
    // El panel no se desplaza durante el despliegue (antes: 82 px en el primer cuadro)
    expect(f.st, `${at}: scrollTop del panel`).toBe(st0)
    if (first) expect(f.st, `${at}: con la primera activa el panel no se desplaza`).toBe(0)
    // La activa nunca queda bajo el campo ni fuera del panel por el lado del campo
    // (is-up: el panel crece hacia arriba desde el campo; la activa va pegada a su borde superior, nunca desplazada fuera)
    expect(f.act.top, `${at}: activa desplazada fuera del panel`).toBeGreaterThanOrEqual(f.panel.top - 0.5)
    if (!up) expect(f.act.top, `${at}: activa tapada por el campo`).toBeGreaterThanOrEqual(f.ctl.bottom - 1)
  }
  // Al terminar, la activa entera a la vista dentro del panel
  const last = shown[shown.length - 1]
  expect(last.act.top, 'final: activa dentro del panel (arriba)').toBeGreaterThanOrEqual(last.panel.top - 0.5)
  expect(last.act.bottom, 'final: activa dentro del panel (abajo)').toBeLessThanOrEqual(last.panel.bottom + 0.5)
}

test.describe('GCombobox · A · despliegue con movimiento', () => {
  for (const id of ['cb-dx', 'cb-big', 'cb-med']) {
    test(`${id}: abrir con ↓ no desplaza el panel ni tapa la activa con el campo`, async ({ page }) => {
      const errs = await watchConsole(page)
      await open(page, { motion: 'no-preference' })
      await page.locator('#' + id).scrollIntoViewIfNeeded()
      await page.focus('#' + id)
      check(await record(page, id))
      expect(errs, errs.join('\n')).toEqual([])
    })
  }

  test('is-up: abrir con ↓ junto al borde inferior del visor', async ({ page }) => {
    const errs = await watchConsole(page)
    await open(page, { motion: 'no-preference', height: 640 })
    await page.evaluate(() => { const r = document.getElementById('cb-dx').closest('.g-input__control').getBoundingClientRect(); scrollBy(0, r.bottom - innerHeight + 40) })
    await page.focus('#cb-dx')
    const frames = await record(page, 'cb-dx')
    expect(frames.find((f) => f.panel).up).toBe(true)
    check(frames)
    expect(errs, errs.join('\n')).toEqual([])
  })

  test('con una opción lejana elegida, al reabrir la activa sigue a la vista sin pasar bajo el campo', async ({ page }) => {
    const errs = await watchConsole(page)
    await open(page, { motion: 'no-preference' })
    await page.locator('#cb-big').scrollIntoViewIfNeeded()
    await page.focus('#cb-big')
    await page.keyboard.press('ArrowDown')
    await page.waitForTimeout(700)
    for (let k = 0; k < 14; k++) await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')
    await page.waitForTimeout(700)
    const frames = await record(page, 'cb-big')
    check(frames, { first: false })
    expect(errs, errs.join('\n')).toEqual([])
  })
})

test.describe('GCombobox multiple · A · despliegue con movimiento', () => {
  for (const id of ['cm-alg', 'cm-big']) {
    test(`${id}: abrir con ↓ no desplaza el panel ni tapa la activa con el campo`, async ({ page }) => {
      const errs = await watchConsole(page)
      await page.emulateMedia({ reducedMotion: 'no-preference' })
      await page.setViewportSize({ width: 1280, height: 900 })
      await page.addInitScript(() => { window.__cbFast = true })
      await page.goto('/packages/vue/playground/index.html?cm=A')
      await page.waitForSelector('#' + id)
      await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' })
      await page.evaluate(() => document.fonts.ready)
      await page.locator('#' + id).scrollIntoViewIfNeeded()
      await page.focus('#' + id)
      check(await record(page, id))
      expect(errs, errs.join('\n')).toEqual([])
    })
  }
})
