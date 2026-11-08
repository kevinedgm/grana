// GCombobox appearance="command" (design/contracts/combobox.md «Modo comando» · Verificación; #1056) sobre el COMPONENTE
// REAL (dist/combobox.umd.js) en el banco packages/vue/playground/sitio.html: lo abren el botón de búsqueda de GNavBar y
// Ctrl/⌘ K (los registra la aplicación). Puerto propio: GRANA_PW_PORT=4241.
import { test, expect } from '@playwright/test'

const PAGE = '/packages/vue/playground/sitio.html'

function watchConsole(page) {
  const errs = []
  page.on('pageerror', (e) => errs.push(`pageerror: ${e.message}`))
  page.on('console', (m) => {
    const t = m.text()
    if (m.type() === 'error' && !/favicon/.test(t)) errs.push(`console: ${t}`)
    else if (m.type() === 'warning' && /\[Vue warn\]|\[Grana /.test(t)) errs.push(`warning: ${t}`)
  })
  return errs
}
const settle = (p) => p.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 80)))))
async function open(page, { width = 1280, height = 800, qs = '?nav=0' } = {}) {
  await page.setViewportSize({ width, height })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const errs = watchConsole(page)
  await page.goto(`${PAGE}${qs}`)
  await page.waitForSelector('.g-nav-bar')
  await settle(page)
  return errs
}
const dialogOpen = (page) => page.evaluate(() => document.querySelector('#cmd dialog').open)

test.describe('GCombobox command · abrir, foco y superficie', () => {
  test('el botón abre con el foco en la búsqueda; Esc cierra sin select y devuelve el foco al botón', async ({ page }) => {
    const errs = await open(page)
    await page.locator('#search-btn').click()
    await settle(page)
    expect(await dialogOpen(page)).toBe(true)
    expect(await page.evaluate(() => document.activeElement.className)).toContain('g-combobox__search-field')
    await page.keyboard.type('props')
    await settle(page)
    await expect(page.locator('#cmd [role="option"]').first()).toBeVisible()
    await page.keyboard.press('Escape')
    await settle(page)
    expect(await dialogOpen(page)).toBe(false)
    expect(await page.evaluate(() => document.activeElement.id)).toBe('search-btn')
    expect(await page.evaluate(() => window.site.events.some((e) => e.startsWith('select')))).toBe(false)
    expect(errs).toEqual([])
  })

  test('Ctrl/⌘ K abre; la última búsqueda vuelve seleccionada; Intro elige (select) y cierra', async ({ page }) => {
    await open(page)
    await page.keyboard.press('ControlOrMeta+k')
    await settle(page)
    expect(await dialogOpen(page)).toBe(true)
    await page.keyboard.type('eventos')
    await settle(page)
    await page.keyboard.press('Escape')
    await settle(page)
    await page.keyboard.press('ControlOrMeta+k')
    await settle(page)
    expect(await page.evaluate(() => { const el = document.activeElement; return [el.value, el.selectionStart, el.selectionEnd] })).toEqual(['eventos', 0, 7])
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')
    await settle(page)
    expect(await dialogOpen(page)).toBe(false)
    expect(await page.evaluate(() => window.site.events.filter((e) => e.startsWith('select')))).toEqual([expect.stringMatching(/^select · s7/)])
  })

  test('foco atrapado: Tab no sale de la superficie y no elige', async ({ page }) => {
    await open(page)
    await page.locator('#search-btn').click()
    await settle(page)
    await page.keyboard.type('uso')
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('Tab')
      expect(await page.evaluate(() => Boolean(document.activeElement.closest('#cmd dialog')) || document.activeElement === document.body)).toBe(true)
    }
    expect(await dialogOpen(page)).toBe(true)
    expect(await page.evaluate(() => window.site.events.some((e) => e.startsWith('select')))).toBe(false)
  })

  test('la marca <mark> se pinta sobre el fragmento (description)', async ({ page }) => {
    await open(page)
    await page.locator('#search-btn').click()
    await page.keyboard.type('compo')
    await settle(page)
    expect(await page.locator('#cmd [role="option"] mark').count()).toBeGreaterThan(0)
  })

  test('el fondo cierra sin select', async ({ page }) => {
    await open(page)
    await page.locator('#search-btn').click()
    await settle(page)
    await page.mouse.click(5, 790)
    await settle(page)
    expect(await dialogOpen(page)).toBe(false)
    expect(await page.evaluate(() => window.site.events.some((e) => e.startsWith('select')))).toBe(false)
  })

  for (const w of [1280, 768, 375, 320]) {
    test(`${w}: la superficie arriba y dentro del visor`, async ({ page }) => {
      await open(page, { width: w })
      await page.locator('#search-btn').click()
      await page.keyboard.type('u')
      await settle(page)
      const b = await page.locator('#cmd dialog').boundingBox()
      expect(b.x).toBeGreaterThanOrEqual(-0.5)
      expect(b.x + b.width).toBeLessThanOrEqual(w + 0.5)
      expect(b.y).toBeLessThanOrEqual(w > 520 ? 65 : 1)
      const cls = await page.locator('#cmd dialog').getAttribute('class')
      expect(cls).toContain(w > 520 ? 'g-combobox-surface--command' : 'g-combobox-surface--sheet')
    })
  }
})

test.describe('GCombobox command · táctil', () => {
  test.use({ hasTouch: true })
  test('375: la hoja con opciones ≥ 44', async ({ page }) => {
    await open(page, { width: 375 })
    await page.locator('#search-btn').tap()
    await page.keyboard.type('u')
    await settle(page)
    const r = await page.locator('#cmd [role="option"]').first().boundingBox()
    expect(r.height).toBeGreaterThanOrEqual(44)
  })
})
