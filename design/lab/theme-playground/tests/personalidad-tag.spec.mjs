// Personalidad de GTagGroup (A «Huella», #466; B «Racimo», #467) sobre el COMPONENTE REAL del playground (#sec-tag), en
// Chromium, Firefox y WebKit: Δ0 en posición y ancho de todas las etiquetas al quitar (también con avatar, con la marca
// check pulsada y en un racimo), vista previa tachada al apuntar y al enfocar con teclado, foco a «Deshacer» tras un CLIC
// (WebKit no enfoca botones al pulsarlos), doble clic sobre la misma tapa (quita y deshace; la vecina sigue en su sitio),
// recogida al salir puntero y foco y al tocar fuera, settle emitido, recogida instantánea con movimiento reducido.
import { test, expect } from '@playwright/test'
import { PAGE, TAB, watchConsole, frames, hover } from './visual-tip-helpers.mjs'

async function open(page, target = '#tg-flow', { motion = 'no-preference', width = 1280 } = {}) {
  await page.emulateMedia({ reducedMotion: motion })
  await page.setViewportSize({ width, height: 900 })
  await page.goto(PAGE)
  await page.waitForSelector(`${target} .g-tag`)
  await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' })
  await page.evaluate(() => document.fonts.ready)
  await page.evaluate((s) => document.querySelector(s).scrollIntoView({ block: 'center' }), target)
  await page.mouse.move(2, 2)
  await frames(page)
}
const boxes = (page, sel) => page.evaluate((s) => [...document.querySelectorAll(`${s} .g-tag`)].map((t) => { const r = t.getBoundingClientRect(); return [r.x, r.y, r.width, r.height] }), sel)
const maxDelta = (a, b) => Math.max(...a.flatMap((r, i) => r.map((v, j) => Math.abs(v - b[i][j]))))
const ids = (page, sel) => page.evaluate((s) => [...document.querySelectorAll(`${s} [data-id]`)].map((x) => x.dataset.id), sel)
const events = (page) => page.evaluate(() => window.tgEvents.slice())

test.describe('GTagGroup · A «Huella» (#466)', () => {
  for (const [name, sel, id] of [
    ['flow', '#tg-flow', 'nue'],
    ['con avatar', '#tg-people', 'ana'],
    ['pulsada con check', '#tg-people', 'mia'],
    ['racimo', '#tg-facets', 'e1'],
    ['suelta en racimos', '#tg-facets', 'm1']
  ]) {
    test(`Δ0 en posición y ancho de todas las etiquetas al quitar (${name})`, async ({ page }) => {
      const errs = await watchConsole(page)
      await open(page, sel)
      const before = await boxes(page, sel)
      await page.click(`${sel} [data-id="${id}"] .g-tag__remove`)
      await frames(page)
      const after = await boxes(page, sel)
      expect(after.length).toBe(before.length)
      expect(maxDelta(before, after), JSON.stringify({ before, after })).toBeLessThanOrEqual(0.5)
      expect(await page.evaluate((s) => document.querySelector(s).classList.contains('is-ghost'), `${sel} [data-id="${id}"] .g-tag`)).toBe(true)
      expect(errs).toEqual([])
    })
  }

  test('foco a «Deshacer» tras un clic (también en WebKit) y huella fuera del árbol', async ({ page }) => {
    await open(page)
    await page.click('#tg-flow [data-id="lat"] .g-tag__remove')
    expect(await page.evaluate(() => document.activeElement.matches('#tg-flow [data-id="lat"] .g-tag__undo'))).toBe(true)
    const snap = await page.locator('#tg-flow [data-id="lat"]').ariaSnapshot()
    expect(snap).toMatch(/button "Deshacer: quitar Látex"/)
    expect(snap).not.toMatch(/text: Látex/)
    const look = await page.evaluate(() => {
      const t = document.querySelector('#tg-flow [data-id="lat"] .g-tag')
      return { dash: getComputedStyle(t).borderTopStyle, line: getComputedStyle(t.querySelector('.g-tag__text')).textDecorationLine }
    })
    expect(look).toEqual({ dash: 'dashed', line: 'line-through' })
  })

  test('doble clic sobre la misma tapa: quita y deshace; la vecina sigue en su sitio', async ({ page }) => {
    await open(page)
    const before = await boxes(page, '#tg-flow')
    await page.dblclick('#tg-flow [data-id="lat"] .g-tag__remove')
    await frames(page)
    expect(await ids(page, '#tg-flow')).toEqual(['pen', 'lat', 'nue', 'pol', 'asp', 'mar'])
    expect(await page.locator('#tg-flow .g-tag.is-ghost').count()).toBe(0)
    expect(maxDelta(before, await boxes(page, '#tg-flow'))).toBeLessThanOrEqual(0.5)
    const ev = (await events(page)).filter((e) => e.group === 'flow').map((e) => e.name)
    expect(ev).toEqual(['remove', 'restore'])
  })

  test('dos quitar seguidos con el ratón quieto quitan la que estaba bajo el puntero (nunca la vecina)', async ({ page }) => {
    await open(page)
    await hover(page, '#tg-flow [data-id="lat"] .g-tag__remove')
    await page.mouse.down(); await page.mouse.up()
    await frames(page)
    // El segundo clic en el mismo sitio cae en «Deshacer» de la misma etiqueta, no en «Quitar Nueces»
    await page.mouse.down(); await page.mouse.up()
    await frames(page)
    const removed = (await events(page)).filter((e) => e.name === 'remove' && e.group === 'flow').map((e) => e.id)
    expect(removed).toEqual(['lat'])
  })

  test('vista previa: apuntar o enfocar con teclado «Quitar» tacha su texto (sin animar)', async ({ page, browserName }) => {
    await open(page)
    const line = () => page.evaluate(() => getComputedStyle(document.querySelector('#tg-flow [data-id="pen"] .g-tag__text')).textDecorationLine)
    expect(await line()).toBe('none')
    await hover(page, '#tg-flow [data-id="pen"] .g-tag__remove')
    await expect.poll(line).toBe('line-through')
    await page.mouse.move(2, 2)
    await expect.poll(line).toBe('none')
    // Con teclado: Tab desde el botón anterior al grupo
    await page.focus('#tg-flow [data-id="pen"] .g-tag__remove')
    await page.keyboard.press(browserName === 'webkit' ? 'Alt+Shift+Tab' : 'Shift+Tab')
    await page.keyboard.press(TAB(browserName))
    expect(await page.evaluate(() => document.activeElement.matches('#tg-flow [data-id="pen"] .g-tag__remove'))).toBe(true)
    await expect.poll(line).toBe('line-through')
  })

  test('recogida: nada se recoge con el puntero dentro; al salir puntero y foco, todas a la vez, y settle', async ({ page }) => {
    await open(page)
    await page.click('#tg-flow [data-id="lat"] .g-tag__remove')
    await page.click('#tg-flow [data-id="pol"] .g-tag__remove')
    await hover(page, '#tg-flow [data-id="nue"] .g-tag')
    await page.focus('#tg-add') // el foco sale, pero el puntero sigue en el grupo
    await page.waitForTimeout(300)
    expect(await page.locator('#tg-flow .g-tag.is-ghost').count()).toBe(2)
    expect(await page.locator('#tg-flow .is-settling').count()).toBe(0)
    // Sale el puntero: se recogen (transición) y salen del DOM
    await page.mouse.move(2, 2)
    await expect.poll(() => ids(page, '#tg-flow'), { timeout: 3000 }).toEqual(['pen', 'nue', 'asp', 'mar'])
    const settle = (await events(page)).filter((e) => e.name === 'settle' && e.group === 'flow')
    expect(settle.map((e) => e.ids)).toEqual([['lat', 'pol']])
  })

  test('recogida al tocar fuera del grupo (pointerdown fuera con el foco fuera)', async ({ page }) => {
    await open(page)
    await page.click('#tg-flow [data-id="nue"] .g-tag__remove')
    await page.click('#sec-tag > h2') // fuera del grupo y de cualquier control
    await expect.poll(() => ids(page, '#tg-flow'), { timeout: 3000 }).toEqual(['pen', 'lat', 'pol', 'asp', 'mar'])
  })

  test('la recogida anima inline-size con --g-duration-fast; con movimiento reducido dura 0s y es inmediata', async ({ page }) => {
    await open(page)
    const dur = await page.evaluate(() => getComputedStyle(document.querySelector('#tg-flow .g-tag')).getPropertyValue('--g-duration-fast').trim())
    await page.click('#tg-flow [data-id="nue"] .g-tag__remove')
    const tr = await page.evaluate(() => { const cs = getComputedStyle(document.querySelector('#tg-flow [data-id="nue"] .g-tag')); return { p: cs.transitionProperty, d: cs.transitionDuration } })
    expect(tr.p).toMatch(/inline-size|width/)
    expect(dur).not.toBe('')
    // Movimiento reducido
    const p2 = await page.context().newPage()
    await open(p2, '#tg-flow', { motion: 'reduce' })
    await p2.click('#tg-flow [data-id="nue"] .g-tag__remove')
    const tr2 = await p2.evaluate(() => getComputedStyle(document.querySelector('#tg-flow [data-id="nue"] .g-tag')).transitionProperty)
    expect(tr2).not.toMatch(/inline-size|width/)
    await p2.focus('#tg-add')
    await p2.mouse.move(2, 2)
    await p2.evaluate(() => new Promise((r) => setTimeout(r, 30)))
    expect(await ids(p2, '#tg-flow')).toEqual(['pen', 'lat', 'pol', 'asp', 'mar'])
    await p2.close()
  })

  test('Deshacer devuelve la etiqueta a su sitio con el foco en su «Quitar»', async ({ page }) => {
    await open(page)
    await page.click('#tg-flow [data-id="nue"] .g-tag__remove')
    await page.click('#tg-flow [data-id="nue"] .g-tag__undo')
    expect(await page.evaluate(() => document.activeElement.matches('#tg-flow [data-id="nue"] .g-tag__remove'))).toBe(true)
    expect(await ids(page, '#tg-flow')).toEqual(['pen', 'lat', 'nue', 'pol', 'asp', 'mar'])
  })
})

test.describe('GTagGroup · B «Racimo» (#467)', () => {
  test('racimo: nombre de la faceta una vez, lomo de su categoría, valores sin relleno propio y el racimo mide 32', async ({ page }) => {
    await open(page, '#tg-facets')
    const r = await page.evaluate(() => {
      const f = document.querySelector('#tg-facets .g-tag-group__facet')
      const cs = getComputedStyle(f)
      const v = f.querySelector('.g-tag')
      return {
        name: f.querySelector('.g-tag-group__facet-name').textContent,
        names: document.querySelectorAll('#tg-facets .g-tag-group__facet-name').length,
        h: Math.round(f.getBoundingClientRect().height),
        spine: parseFloat(cs.borderLeftWidth) > parseFloat(cs.borderTopWidth),
        spineColor: cs.borderLeftColor !== cs.borderTopColor,
        plain: v.classList.contains('is-plain') && getComputedStyle(v).backgroundColor,
        cat: f.dataset.cat === v.dataset.cat
      }
    })
    expect(r.name).toBe('Estado')
    expect(r.names).toBe(3)
    expect(r.h).toBe(32)
    expect(r.spine && r.spineColor).toBe(true)
    expect(r.plain).toBe('rgba(0, 0, 0, 0)')
    expect(r.cat).toBe(true)
  })

  test('alternar en un racimo: la elegida lleva check y raya inferior; el grupo se nombra por la faceta', async ({ page }) => {
    await open(page, '#tg-facet-toggles')
    const sel = '#tg-facet-toggles [data-id="tc"]'
    await page.click(`${sel} button`)
    await expect(page.locator(`${sel} button`)).toHaveAttribute('aria-pressed', 'true')
    const look = await page.evaluate((s) => { const t = document.querySelector(`${s} .g-tag`); return { shadow: getComputedStyle(t).boxShadow, check: t.querySelector('.g-tag__check').getBoundingClientRect().width } }, sel)
    expect(look.shadow).toMatch(/inset/)
    await expect.poll(() => page.evaluate((s) => document.querySelector(`${s} .g-tag__check`).getBoundingClientRect().width, sel)).toBeGreaterThan(4)
    const ev = (await events(page)).filter((e) => e.group === 'facet-toggles')
    expect(ev.map((e) => [e.name, e.id, e.pressed])).toEqual([['toggle', 'tc', true]])
  })
})
