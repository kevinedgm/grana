// GCombobox multiple · movimiento (design/contracts/combobox.md «Fase 2 · Movimiento», DECISIONS.md #427) sobre el
// COMPONENTE REAL del playground (#sec-combobox-multiple), en Chromium, Firefox y WebKit. Solo tras un gesto: las cifras
// ruedan (is-rolling), la casilla salta al marcar (is-ticking), B · el renglón nuevo crece (is-entering) y el rastro se
// pliega en la pasada siguiente (is-leaving), C · lo marcado viaja a la cesta (is-arriving + --_travel-x/y). Nada se
// anima al montar ni al abrir; con prefers-reduced-motion: reduce nada se desplaza, crece ni escala y no quedan clases.
// Porta el punto 17 de design/lab/combobox/r03/verificar.mjs (kiwi).
import { test, expect } from '@playwright/test'
import { watchConsole } from './combobox-helpers.mjs'

const PAGE = '/packages/vue/playground/index.html'
async function load(page, motion) {
  await page.emulateMedia({ reducedMotion: motion })
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.addInitScript(() => { window.__cbFast = true })
  await page.goto(PAGE)
  await page.waitForSelector('#cm-alg')
  await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' })
  await page.evaluate(() => document.fonts.ready)
}
/** Muestrea `fn()` en cada cuadro durante `n` cuadros; se lanza ANTES del gesto y se espera después */
const sample = (page, body, n = 40) => page.evaluate(([src, n]) => new Promise((resolve) => {
  const fn = new Function('return (' + src + ')')()
  const out = []
  const tick = () => { out.push(fn()); if (out.length < n) requestAnimationFrame(tick); else resolve(out) }
  requestAnimationFrame(tick)
}), [body.toString(), n])
const distinct = (list) => [...new Set(list.map((v) => Math.round(v * 2) / 2))]
const running = (page, sel) => page.evaluate((sel) => document.getAnimations().filter((a) => !(a instanceof CSSTransition) && a.playState === 'running' && a.effect?.target?.closest?.(sel)).map((a) => a.animationName || 'x'), sel)

test.describe('GCombobox multiple · personalidad con movimiento', () => {
  test('nada se anima al cargar ni al abrir (#336): ni cifras, ni casillas, ni renglones', async ({ page }) => {
    const errs = await watchConsole(page)
    await load(page, 'no-preference')
    await page.locator('#cm-big').scrollIntoViewIfNeeded()
    expect(await page.evaluate(() => document.querySelectorAll('.g-combobox--multiple :is(.is-rolling, .is-ticking, .is-entering, .is-leaving, .is-arriving)').length)).toBe(0)
    const run = sample(page, () => document.querySelectorAll('.g-combobox--multiple :is(.is-rolling, .is-ticking, .is-entering, .is-arriving), .g-combobox-surface :is(.is-rolling, .is-ticking, .is-arriving)').length, 20)
    await page.focus('#cm-big')
    await page.keyboard.press('ArrowDown')
    expect(Math.max(...(await run)), 'abrir no pone clases de movimiento').toBe(0)
    expect(await running(page, '.g-combobox--multiple'), 'ni animaciones (el despliegue de A es una transición de la Fase 1)').toEqual([])
    await page.keyboard.press('Escape')
    // La aplicación cambia el modelo: tampoco se anima
    const run2 = sample(page, () => document.querySelectorAll('.g-combobox--multiple :is(.is-rolling, .is-ticking, .is-entering, .is-arriving)').length, 20)
    await page.evaluate(() => { window.__cm.dx = ['E11.9', 'I10']; window.__cm.big = window.__cm.big.slice(0, 30) })
    expect(Math.max(...(await run2)), 'un cambio de la aplicación no se anima').toBe(0)
    expect(errs, errs.join('\n')).toEqual([])
  })

  test('marcar: la casilla salta (escala desde 0.4, con rebote) y la cifra de «Elegidas» rueda; se retiran las clases; desmarcar no salta', async ({ page, browserName }) => {
    const errs = await watchConsole(page)
    await load(page, 'no-preference')
    await page.locator('#cm-big').scrollIntoViewIfNeeded()
    await page.focus('#cm-big')
    await page.keyboard.press('ArrowDown')
    await page.waitForTimeout(400)
    for (let n = 0; n < 13; n++) await page.keyboard.press('ArrowDown') // pasa «Ver los 40»: la primera del catálogo
    const id = await page.evaluate(() => document.getElementById('cm-big').getAttribute('aria-activedescendant'))
    expect(id).toBe('cm-big-opt-0')
    const run = sample(page, () => {
      const b = document.querySelector('#cm-big-opt-0 .g-combobox__box')
      const svg = b && b.querySelector('svg')
      const n = document.querySelector('#cm-big-grp-chosen .g-combobox__num')
      return { tick: Boolean(b && b.classList.contains('is-ticking')), scale: svg ? Number((getComputedStyle(svg).scale || '1').split(' ')[0]) || 1 : 1, roll: Boolean(n && n.classList.contains('is-rolling')), ty: n ? new DOMMatrix(getComputedStyle(n).transform).m42 + (parseFloat((getComputedStyle(n).translate || '0 0').split(' ')[1]) || 0) : 0, num: n ? n.textContent : '' }
    }, 40)
    await page.keyboard.press('Enter')
    const fs = await run
    expect(fs.some((f) => f.tick), 'is-ticking mientras salta').toBe(true)
    const scales = distinct(fs.filter((f) => f.tick).map((f) => f.scale * 100))
    // WebKit sin cabeza (~20 cuadros/s, sin el cuadro del gesto) puede ver solo el final del salto: allí basta la clase
    if (browserName !== 'webkit') {
      expect(scales.length, `escalas intermedias ${scales.join(', ')}`).toBeGreaterThanOrEqual(2)
      expect(Math.min(...fs.filter((f) => f.tick).map((f) => f.scale)), 'empieza pequeña (0.4)').toBeLessThan(0.9)
    }
    expect(fs.some((f) => f.roll), 'is-rolling mientras rueda').toBe(true)
    expect(fs[fs.length - 1].num).toBe('41')
    await page.waitForTimeout(400)
    expect(await page.evaluate(() => document.querySelectorAll('#cm-big-list :is(.is-ticking, .is-rolling)').length), 'las clases se retiran al terminar').toBe(0)
    // Desmarcar: la marca se funde (sin salto)
    const run2 = sample(page, () => Boolean(document.querySelector('#cm-big-opt-0 .g-combobox__box.is-ticking')), 20)
    await page.keyboard.press('Enter')
    expect((await run2).some(Boolean), 'desmarcar no salta').toBe(false)
    expect(errs, errs.join('\n')).toEqual([])
  })

  test('B · el renglón nuevo crece desde la línea anterior y el rastro se pliega en la pasada siguiente (el nodo se retira)', async ({ page, browserName }) => {
    const errs = await watchConsole(page)
    await load(page, 'no-preference')
    await page.locator('#cm-dx').scrollIntoViewIfNeeded()
    await page.focus('#cm-dx')
    await page.keyboard.type('I10')
    await page.waitForTimeout(250)
    const run = sample(page, () => {
      const r = document.querySelectorAll('.g-combobox:has(#cm-dx) .g-combobox__row')[1]
      return r ? { h: r.getBoundingClientRect().height, entering: r.classList.contains('is-entering') } : null
    }, 40)
    await page.keyboard.press('Enter')
    const hs = (await run).filter(Boolean)
    expect(hs.some((x) => x.entering), 'is-entering').toBe(true)
    const final = hs[hs.length - 1].h
    expect(hs[hs.length - 1].entering, 'se retira al terminar').toBe(false)
    const mid = distinct(hs.map((x) => x.h).filter((h) => h > 0.5 && h < final - 0.5))
    // WebKit sin cabeza pinta a ~20 cuadros/s (menos con carga, y el cuadro del gesto se pierde): allí basta uno
    // intermedio al crecer y, en el pliegue (~240 ms), con ver is-leaving y que el nodo se retira
    const need = browserName === 'webkit' ? 1 : 2
    expect(mid.length, `alturas intermedias ${mid.join(', ')} (final ${final})`).toBeGreaterThanOrEqual(need)
    await page.keyboard.press('Escape')
    await page.locator('.g-combobox:has(#cm-dx) .g-combobox__row').first().locator('.g-combobox__remove').click()
    await page.waitForTimeout(300)
    expect(await page.locator('.g-combobox:has(#cm-dx) .g-combobox__row.is-trace').count()).toBe(1)
    await page.locator('#cm-f-folio').focus()
    await page.waitForTimeout(200)
    await page.focus('#cm-dx')
    const run2 = sample(page, () => {
      const t = document.querySelector('.g-combobox:has(#cm-dx) .g-combobox__row.is-trace')
      return t ? { h: t.getBoundingClientRect().height, leaving: t.classList.contains('is-leaving') } : { h: 0, leaving: false, gone: true }
    }, 40)
    await page.keyboard.type('j')
    const ts = await run2
    expect(ts.some((x) => x.leaving), 'is-leaving').toBe(true)
    expect(ts[ts.length - 1].gone, 'el nodo se retira al terminar').toBe(true)
    const t0 = ts[0].h
    const fold = distinct(ts.filter((x) => x.leaving).map((x) => x.h).filter((h) => h > 0.5 && h < t0 - 0.5))
    expect(fold.length, `alturas intermedias del pliegue ${fold.join(', ')}`).toBeGreaterThanOrEqual(browserName === 'webkit' ? 0 : 2)
    expect(errs, errs.join('\n')).toEqual([])
  })

  test('C · lo marcado viaja a la cesta: ≥ 2 posiciones intermedias, termina en su sitio y retira is-arriving y el vector', async ({ page, browserName }) => {
    const errs = await watchConsole(page)
    await load(page, 'no-preference')
    await page.locator('#cm-resp').scrollIntoViewIfNeeded()
    await page.focus('#cm-resp')
    await page.keyboard.press('Enter')
    await page.waitForTimeout(500)
    await page.keyboard.type('lucía')
    await page.waitForTimeout(250)
    const from = await page.evaluate(() => { const r = document.querySelector('#cm-resp-list .is-active .g-summary').getBoundingClientRect(); return { x: r.left, y: r.top } })
    const run = sample(page, () => {
      const r = document.querySelector('#cm-resp-surface .g-combobox__basket .g-combobox__row')
      if (!r) return null
      const s = r.querySelector('.g-summary').getBoundingClientRect()
      return { x: s.left, y: s.top, arriving: r.classList.contains('is-arriving'), vars: r.style.getPropertyValue('--_travel-x') }
    }, 50)
    await page.keyboard.press('Enter')
    const ps = (await run).filter(Boolean)
    expect(ps.length).toBeGreaterThan(10)
    expect(ps.some((p) => p.arriving), 'is-arriving mientras viaja').toBe(true)
    const end = ps[ps.length - 1]
    expect(end.arriving, 'la clase se retira').toBe(false)
    expect(end.vars, 'y el vector también').toBe('')
    const dx = from.x - end.x
    expect(Math.abs(dx), 'la fila está a un lado de la cesta').toBeGreaterThan(60)
    const mid = distinct(ps.map((p) => p.x).filter((x) => Math.abs(x - end.x) > 1 && Math.abs(x - from.x) > 1))
    expect(ps.some((p) => p.arriving && p.vars), 'el vector se escribe mientras viaja').toBe(true)
    // WebKit sin cabeza pierde el cuadro del gesto y pinta a ~20 cuadros/s: el viaje (240 ms, con muelle) cabe en uno o dos
    // cuadros, a veces ya en el rebase; allí basta con la clase, el vector y el final en su sitio
    if (browserName !== 'webkit') {
      expect(mid.length, `posiciones intermedias ${mid.join(', ')}`).toBeGreaterThanOrEqual(2)
      expect(ps.filter((p) => p.arriving).some((p) => Math.sign(p.x - end.x) === Math.sign(dx)), 'sale desde el lado de la fila').toBe(true)
    }
    expect(errs, errs.join('\n')).toEqual([])
  })
})

test.describe('GCombobox multiple · personalidad con prefers-reduced-motion: reduce', () => {
  test('nada se desplaza, crece ni escala y no quedan clases: marcar (A), renglón nuevo y pasada (B), cesta (C)', async ({ page }) => {
    const errs = await watchConsole(page)
    await load(page, 'reduce')
    const CLS = '.g-combobox--multiple :is(.is-rolling, .is-ticking, .is-entering, .is-leaving, .is-arriving), .g-combobox-surface :is(.is-rolling, .is-ticking, .is-arriving)'
    const watchCls = () => sample(page, new Function(`return () => document.querySelectorAll(${JSON.stringify(CLS)}).length`)(), 25)
    // A: marcar
    await page.locator('#cm-alg').scrollIntoViewIfNeeded()
    await page.focus('#cm-alg')
    await page.keyboard.type('ibu')
    await page.waitForTimeout(200)
    let run = watchCls()
    await page.keyboard.press('Enter')
    expect(Math.max(...(await run)), 'A: ninguna clase en ningún cuadro').toBe(0)
    expect(await running(page, '.g-combobox--multiple')).toEqual([])
    await page.keyboard.press('Escape')
    await page.keyboard.press('Escape')
    // B: renglón nuevo, quitar y pasada
    await page.focus('#cm-dx')
    await page.keyboard.type('I10')
    await page.waitForTimeout(200)
    run = watchCls()
    await page.keyboard.press('Enter')
    expect(Math.max(...(await run)), 'B: el renglón aparece sin crecer').toBe(0)
    await page.keyboard.press('Escape')
    await page.locator('.g-combobox:has(#cm-dx) .g-combobox__row').first().locator('.g-combobox__remove').click()
    await page.locator('#cm-f-folio').focus()
    await page.focus('#cm-dx')
    run = watchCls()
    await page.keyboard.type('j')
    expect(Math.max(...(await run)), 'B: el rastro se retira sin plegarse').toBe(0)
    expect(await page.locator('.g-combobox:has(#cm-dx) .g-combobox__row.is-trace').count()).toBe(0)
    await page.keyboard.press('Escape')
    await page.keyboard.press('Escape')
    // C: cesta
    await page.focus('#cm-resp')
    await page.keyboard.press('Enter')
    await page.waitForTimeout(300)
    await page.keyboard.type('lucía')
    await page.waitForTimeout(200)
    run = watchCls()
    await page.keyboard.press('Enter')
    expect(Math.max(...(await run)), 'C: el renglón aparece en su sitio').toBe(0)
    expect(await page.locator('#cm-resp-surface .g-combobox__basket .g-combobox__row').count()).toBe(1)
    expect(await running(page, '.g-combobox--multiple, .g-combobox-surface')).toEqual([])
    expect(errs, errs.join('\n')).toEqual([])
  })
})
