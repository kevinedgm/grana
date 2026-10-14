// GSidebar · el hover genérico no alcanza al item activo (hallazgo 1 de la integración real, NisaNabani): con 0,3,0 ganaba a
// `.is-active` y le quitaba su superficie; con un activo tematizado el texto quedaba sobre `border`, ilegible.
// Un solo proceso por puerto: GRANA_PW_PORT=4208 (bruno).
import { test, expect } from '@playwright/test'
import { open, hover } from './visual-tip-helpers.mjs'

const LINK = (id) => `#sb-rail .g-sidebar__nav .g-sidebar__item > .g-sidebar__link[data-id="${id}"]`
const paint = (page, sel) => page.evaluate((s) => {
  const c = getComputedStyle(document.querySelector(s))
  return { bg: c.backgroundColor, color: c.color, shadow: c.boxShadow }
}, sel)

test.describe('GSidebar · hover y activo (hallazgo 1)', () => {
  test('el activo conserva fondo, tinta y contorno con el puntero encima; un item no activo sí cambia', async ({ page }) => {
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
    expect(o1.bg).not.toBe(o0.bg)
    expect(o1.bg).not.toBe(a0.bg)
  })
})
