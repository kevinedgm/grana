// GCombobox · movimiento (combobox.md «Movimiento», DECISIONS.md #336) sobre el COMPONENTE REAL del playground, en
// Chromium, Firefox y WebKit. Con movimiento: A · despliegue de la lista desde la línea del campo (≥ 2 alturas
// intermedias, solo al abrir), C · la ficha llega desde su fila (≥ 2 posiciones intermedias, termina en su sitio y
// retira is-arriving; rebase medido) y B · la entrada de GDialog desde su disparador (el campo). Con
// prefers-reduced-motion: reduce, nada se mueve y no quedan clases.
import { test, expect } from '@playwright/test'
import { frames, open, out, st, type, watchConsole } from './combobox-helpers.mjs'

/** Muestrea `fn(document)` en cada cuadro durante `n` cuadros; se lanza ANTES del gesto y se espera después */
const sample = (page, body, n = 50) => page.evaluate(([src, n]) => new Promise((resolve) => {
  const fn = new Function('return (' + src + ')')()
  const out = []
  const tick = () => { out.push(fn()); if (out.length < n) requestAnimationFrame(tick); else resolve(out) }
  requestAnimationFrame(tick)
}), [body.toString(), n])
const distinct = (list) => [...new Set(list.map((v) => Math.round(v * 2) / 2))]

test.describe('GCombobox · personalidad con movimiento', () => {
  test('A · la lista se despliega desde la línea del campo: ≥ 2 alturas intermedias, solo al abrir', async ({ page, browserName }) => {
    const errs = await watchConsole(page)
    await open(page, { motion: 'no-preference' })
    await page.focus('#cb-dx')
    await frames(page)
    const run = sample(page, () => { const b = document.querySelector('#cb-dx-popup .g-combobox__popup-body'); return b && b.checkVisibility() ? b.getBoundingClientRect().height : 0 })
    await page.keyboard.press('ArrowDown')
    const hs = await run
    const final = hs[hs.length - 1]
    expect(final).toBeGreaterThan(100)
    const mid = distinct(hs.filter((h) => h > 1 && h < final - 1))
    // WebKit sin cabeza pinta a ~20 cuadros/s: el despliegue cabe en dos o tres cuadros; allí basta uno intermedio
    expect(mid.length, `alturas intermedias ${mid.join(', ')} (final ${final})`).toBeGreaterThanOrEqual(browserName === 'webkit' ? 1 : 2)
    expect(hs.every((h, i) => i === 0 || h >= hs[i - 1] - 0.5), 'crece sin retroceder (entrada, sin muelle)').toBe(true)
    // Los cambios de alto entre resultados NO se animan
    const run2 = sample(page, () => document.querySelector('#cb-dx-popup .g-combobox__popup-body').getBoundingClientRect().height, 30)
    await page.keyboard.type('r05')
    const hs2 = distinct(await run2)
    expect(hs2.length, `alturas al filtrar: ${hs2.join(', ')}`).toBeLessThanOrEqual(4) // la de antes, las de cada tecla («r», «r0») y la de después: saltos, no una transición
    expect(Math.min(...hs2)).toBeLessThan(final)
    // Cerrar es inmediato
    const run3 = sample(page, () => { const b = document.querySelector('#cb-dx-popup .g-combobox__popup-body'); return b.checkVisibility() ? b.getBoundingClientRect().height : 0 }, 12)
    await page.keyboard.press('Escape')
    const hs3 = distinct(await run3)
    expect(hs3.length, `alturas al cerrar: ${hs3.join(', ')}`).toBeLessThanOrEqual(2)
    expect(hs3).toContain(0)
    expect(errs, errs.join('\n')).toEqual([])
  })

  test('C · la ficha llega desde su fila: ≥ 2 posiciones intermedias, termina en su sitio y retira is-arriving; rebase acotado', async ({ page }) => {
    const errs = await watchConsole(page)
    await open(page, { motion: 'no-preference' })
    await page.focus('#cb-dx')
    await page.keyboard.press('ArrowDown')
    await page.waitForTimeout(500)
    for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowDown') // una fila lejana: el viaje se ve
    await frames(page)
    const from = await page.evaluate(() => { const r = document.querySelector('#cb-dx-list .is-active .g-summary').getBoundingClientRect(); return { x: r.left, y: r.top } }) // el origen es la ficha de la fila (#356)
    // La trayectoria, sin depender de los cuadros: WebKit sin cabeza pinta a ~15–30 cuadros/s y su primer cuadro tras Intro
    // llega con la animación de 240 ms ya en ~90 ms, pasado su sitio por el muelle (ni el arranque ni ≥ 2 intermedias se
    // ven). Al aparecer is-arriving, se pausa la animación real, se recorre su tiempo en 60 pasos leyendo la posición y se
    // devuelve a donde estaba; los cuadros reales siguen probando que corre, termina en su sitio y retira la clase.
    await page.evaluate(() => {
      window.__cbPath = null
      const root = document.getElementById('cb-dx').closest('.g-combobox')
      const mo = new MutationObserver(() => {
        const t = root.querySelector('.g-combobox__token.is-arriving')
        const a = t && t.getAnimations().find((x) => /arrive/.test(x.animationName || ''))
        if (!a) return
        mo.disconnect()
        const d = a.effect.getComputedTiming().duration
        const was = a.currentTime
        a.pause()
        const path = []
        for (let k = 0; k <= 60; k++) { a.currentTime = (d * k) / 60; path.push(t.getBoundingClientRect().top) }
        a.currentTime = was
        a.play()
        window.__cbPath = { d, path }
      })
      mo.observe(root, { subtree: true, childList: true, attributes: true, attributeFilter: ['class', 'style'] })
    })
    const run = sample(page, () => {
      const t = document.getElementById('cb-dx').closest('.g-combobox').querySelector('.g-combobox__token')
      if (!t) return null
      const r = t.getBoundingClientRect()
      return { x: r.left, y: r.top, arriving: t.classList.contains('is-arriving'), vars: t.style.getPropertyValue('--_travel-y') }
    }, 70)
    await page.keyboard.press('Enter')
    const all = await run
    const ps = all.filter(Boolean)
    expect(ps.length).toBeGreaterThan(10)
    const end = ps[ps.length - 1]
    expect(end.arriving, 'la clase se retira').toBe(false)
    expect(end.vars, 'y el vector también').toBe('')
    expect(ps.some((p) => p.arriving), 'la animación corre en cuadros reales').toBe(true)
    const travelY = from.y - end.y
    expect(Math.abs(travelY), 'la fila estaba lejos del campo').toBeGreaterThan(60)
    const { d, path } = await page.evaluate(() => window.__cbPath)
    expect(d, 'duración de la llegada').toBeGreaterThan(0)
    const mid = distinct(path.filter((y) => Math.abs(y - end.y) > 1 && Math.abs(y - from.y) > 1))
    expect(mid.length, `posiciones intermedias ${mid.join(', ')}`).toBeGreaterThanOrEqual(2)
    // Empieza hacia su fila (acotado por coco) y termina exactamente en su sitio
    expect(Math.sign(path[0] - end.y), `arranque ${path[0]} frente a ${end.y}`).toBe(Math.sign(travelY))
    expect(Math.abs(path[path.length - 1] - end.y)).toBeLessThan(0.5)
    const rest = await page.evaluate(() => { const t = document.getElementById('cb-dx').closest('.g-combobox').querySelector('.g-combobox__token'); const r = t.getBoundingClientRect(); return { x: r.left, y: r.top, anim: t.getAnimations().length } })
    expect(Math.abs(rest.y - end.y) + Math.abs(rest.x - end.x)).toBeLessThan(0.5)
    expect(rest.anim).toBe(0)
    // Rebase del muelle: lo que pasa de largo al otro lado de su sitio; cota de coco, space × 2 (8px con space 4)
    const over = Math.max(0, ...path.map((y) => (end.y - y) * Math.sign(travelY)), ...ps.map((p) => (end.y - p.y) * Math.sign(travelY)))
    test.info().annotations.push({ type: 'rebase', description: `${over.toFixed(2)}px en un viaje de ${Math.abs(travelY).toFixed(0)}px` })
    expect(over, `rebase ${over.toFixed(2)}px`).toBeLessThanOrEqual(8.5)
    expect(await out(page, 'cb-out-dx')).toMatch(/^dx: [A-Z]/)
    expect((await st(page, 'cb-dx')).focus).toBe('cb-dx')
    expect(errs, errs.join('\n')).toEqual([])
  })

  test('C · no viaja al elegir desde la superficie ni al cambiar el valor desde la aplicación', async ({ page }) => {
    const errs = await watchConsole(page)
    await open(page, { motion: 'no-preference' })
    const watch = (id) => sample(page, new Function(`return () => { const t = document.getElementById('${id}').closest('.g-combobox').querySelector('.g-combobox__token'); return t ? t.classList.contains('is-arriving') : null }`)(), 45)
    await page.focus('#cb-pal')
    await page.keyboard.type('maría garcía', { delay: 15 })
    await page.waitForTimeout(400)
    const run = watch('cb-pal')
    await page.keyboard.press('Enter')
    const seen = (await run).filter((v) => v !== null)
    expect(seen.length).toBeGreaterThan(0)
    expect(seen.some(Boolean), 'desde la superficie no viaja').toBe(false)
    const run2 = watch('cb-big')
    await page.evaluate(() => { window.__cb.big = 'b7' })
    const seen2 = (await run2).filter((v) => v !== null)
    expect(seen2.length).toBeGreaterThan(0)
    expect(seen2.some(Boolean), 'desde la aplicación no viaja').toBe(false)
    expect(errs, errs.join('\n')).toEqual([])
  })

  test('B · la superficie entra como GDialog desde su disparador (el campo)', async ({ page, browserName }) => {
    const errs = await watchConsole(page)
    await open(page, { motion: 'no-preference' })
    await page.focus('#cb-pal')
    await frames(page)
    const run = sample(page, () => {
      const d = document.getElementById('cb-pal-surface')
      if (!d.open) return null
      const r = d.getBoundingClientRect()
      return { y: r.top + r.height / 2, x: r.left + r.width / 2, o: Number(getComputedStyle(d).opacity), origin: d.classList.contains('has-origin') }
    }, 60)
    await page.keyboard.press('Enter')
    const ps = (await run).filter(Boolean)
    expect(ps.length).toBeGreaterThan(10)
    expect(ps[0].origin, 'GDialog toma el campo como disparador (D1, #301)').toBe(true)
    const end = ps[ps.length - 1]
    const moving = distinct(ps.map((p) => p.y)).length + distinct(ps.map((p) => p.o * 100)).length
    // Como en personalidad-dialog.spec: los cuadros intermedios de la entrada de GDialog solo se exigen en Chromium
    if (browserName === 'chromium') expect(moving, 'la entrada tiene estados intermedios').toBeGreaterThan(3)
    expect(end.o).toBe(1)
    expect((await st(page, 'cb-pal')).focus).toBe('cb-pal-search')
    expect(errs, errs.join('\n')).toEqual([])
  })
})

test.describe('GCombobox · personalidad con prefers-reduced-motion: reduce', () => {
  test('nada se mueve y no quedan clases: despliegue, llegada de la ficha y entrada de la superficie', async ({ page }) => {
    const errs = await watchConsole(page)
    await open(page, { motion: 'reduce' })
    await page.focus('#cb-dx')
    await frames(page)
    // A: la lista aparece a su alto final
    const run = sample(page, () => { const b = document.querySelector('#cb-dx-popup .g-combobox__popup-body'); return b && b.checkVisibility() ? b.getBoundingClientRect().height : 0 }, 30)
    await page.keyboard.press('ArrowDown')
    const hs = distinct(await run)
    expect(hs.length, `alturas ${hs.join(', ')}`).toBeLessThanOrEqual(2)
    // C: la ficha aparece en su sitio, sin is-arriving en ningún cuadro
    for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowDown')
    const run2 = sample(page, () => {
      const t = document.getElementById('cb-dx').closest('.g-combobox').querySelector('.g-combobox__token')
      if (!t) return null
      const r = t.getBoundingClientRect()
      return { y: r.top, x: r.left, arriving: t.classList.contains('is-arriving'), vars: t.getAttribute('style') || '' }
    }, 40)
    await page.keyboard.press('Enter')
    const ps = (await run2).filter(Boolean)
    expect(ps.length).toBeGreaterThan(5)
    expect(ps.some((p) => p.arriving)).toBe(false)
    expect(ps.some((p) => p.vars.includes('--_travel'))).toBe(false)
    expect(distinct(ps.map((p) => p.y)).length).toBe(1)
    expect(distinct(ps.map((p) => p.x)).length).toBe(1)
    // B: la superficie aparece en su sitio
    await page.focus('#cb-pal')
    const run3 = sample(page, () => { const d = document.getElementById('cb-pal-surface'); if (!d.open) return null; return { y: d.getBoundingClientRect().top } }, 30)
    await page.keyboard.press('Enter')
    const ds = (await run3).filter(Boolean)
    expect(distinct(ds.map((p) => p.y)).length, 'no se desplaza (el fundido, si lo hay, es de GDialog: #299)').toBe(1)
    await page.keyboard.press('Escape')
    // Sin animaciones ni transiciones en curso en nada del componente
    await type(page, 'cb-med', 'para')
    const running = await page.evaluate(() => document.getAnimations().filter((a) => a.effect?.target?.closest?.('.g-combobox, .g-combobox-surface') && a.playState === 'running').length)
    expect(running).toBe(0)
    expect(errs, errs.join('\n')).toEqual([])
  })
})
