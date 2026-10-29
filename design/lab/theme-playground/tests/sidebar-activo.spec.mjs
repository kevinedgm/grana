// GSidebar · el hover genérico no alcanza al item activo (hallazgo 1 de la integración real, NisaNabani): con 0,3,0 ganaba a
// `.is-active` y le quitaba su superficie; con un activo tematizado el texto quedaba sobre `border`, ilegible.
// Desde «una sola luz» (#957, #959) ningún enlace pinta fondo de hover: lo marca la luz de su lista, que pasa también por
// el activo sin tocar su marca. Un solo proceso por puerto: GRANA_PW_PORT=4208 (bruno).
import { test, expect } from '@playwright/test'
import { open, hover } from './visual-tip-helpers.mjs'

const LINK = (id) => `#sb-rail .g-sidebar__nav .g-sidebar__item > .g-sidebar__link[data-id="${id}"]`
const paint = (page, sel) => page.evaluate((s) => {
  const c = getComputedStyle(document.querySelector(s))
  return { bg: c.backgroundColor, color: c.color, shadow: c.boxShadow }
}, sel)

test.describe('GSidebar · hover y activo (hallazgo 1)', () => {
  test('el activo conserva fondo, tinta y contorno con el puntero encima; sobre un item no activo se enciende la luz de su lista', async ({ page }) => {
    await open(page, '#sb-rail-demo')
    await page.waitForTimeout(300)
    const active = LINK('home')
    const other = LINK('inbox')
    await expect(page.locator(active)).toHaveAttribute('aria-current', 'page')
    const a0 = await paint(page, active)
    const o0 = await paint(page, other)
    await hover(page, active)
    await page.waitForTimeout(400)
    expect(await paint(page, active)).toEqual(a0)
    await page.mouse.move(2, 2)
    await hover(page, other)
    await page.waitForTimeout(400)
    const o1 = await paint(page, other)
    expect(o1.bg, 'sin fondo propio (#959)').toBe(o0.bg)
    const lit = await page.evaluate((s) => {
      const list = document.querySelector(s).closest('.g-sidebar__list')
      return list.classList.contains('has-highlight') && +getComputedStyle(list.firstElementChild).opacity > 0.9
    }, other)
    expect(lit, 'la luz de la lista sobre el item').toBe(true)
  })
})
