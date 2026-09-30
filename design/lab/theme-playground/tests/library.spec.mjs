// Verificación entre navegadores (Chromium, Firefox y WebKit) del playground de la librería (packages/vue/playground).
// Sustituye en lo posible a «pruebas manuales en Firefox y Safari»: WebKit es el motor de Safari, pero NO es Safari (sin su sistema ni VoiceOver).
// Cubre lo más sensible a diferencias entre motores: popover, diálogo modal, listbox, :has, inert, transiciones y errores de consola.
import { test, expect } from '@playwright/test'

const PAGE = '/packages/vue/playground/index.html'
const ready = async (page) => { await page.goto(PAGE); await page.waitForSelector('.g-btn'); await page.waitForTimeout(600) }

test.describe('playground de la librería', () => {
  test('carga sin errores de consola ni de página y con todos los componentes', async ({ page }) => {
    const errors = []
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
    page.on('console', (m) => { if (m.type() === 'error' && !/favicon/.test(m.text())) errors.push(`console: ${m.text()}`) })
    await ready(page)
    for (const c of ['g-btn', 'g-input', 'g-select', 'g-checkbox', 'g-switch', 'g-dialog', 'g-calendar', 'g-datepicker', 'g-stepper', 'g-surface', 'g-helper', 'g-avatar-motion', 'g-widget', 'g-sidebar']) {
      expect(await page.locator(`[class*="${c}"]`).count(), c).toBeGreaterThan(0)
    }
    expect(errors).toEqual([])
  })

  test('el menú (popover) se abre con un clic, se recorre con flechas y se cierra con Esc', async ({ page }) => {
    await ready(page)
    const trigger = page.locator('button[aria-haspopup="menu"]').first()
    await trigger.scrollIntoViewIfNeeded()
    await trigger.click()
    const list = page.locator('.g-menu__list:popover-open').first()
    await expect(list).toBeVisible()
    await page.keyboard.press('ArrowDown')
    await expect(page.locator('.g-menu__item:focus').first()).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.locator('.g-menu__list:popover-open')).toHaveCount(0)
  })

  test('el diálogo modal se abre y se cierra con Esc (y deja inerte el resto)', async ({ page }) => {
    await ready(page)
    await page.getByRole('button', { name: 'Simple', exact: true }).click()
    const dlg = page.locator('dialog.g-dialog[open]').first()
    await expect(dlg).toBeVisible()
    expect(await dlg.evaluate((d) => d.matches(':modal'))).toBe(true)
    await page.keyboard.press('Escape')
    await expect(page.locator('dialog.g-dialog[open]')).toHaveCount(0)
  })

  test('el select (listbox) se abre, permite elegir una opción y cierra', async ({ page }) => {
    await ready(page)
    const combo = page.getByRole('combobox', { name: /País/ }).first()
    await combo.scrollIntoViewIfNeeded()
    await combo.click()
    const option = page.locator('.g-select__list:popover-open [role="option"]').first()
    await expect(option).toBeVisible()
    const label = (await option.textContent()).trim()
    await option.click()
    await expect(page.locator('.g-select__list:popover-open')).toHaveCount(0)
  })

  test('checkbox y switch cambian de estado con el ratón y con Espacio', async ({ page }) => {
    await ready(page)
    const chk = page.locator('input.g-checkbox__input:not(:disabled)').first()
    await chk.scrollIntoViewIfNeeded()
    const before = await chk.isChecked()
    await chk.click()
    expect(await chk.isChecked()).toBe(!before)
    const sw = page.locator('input.g-switch__input:not(:disabled)').first()
    await sw.scrollIntoViewIfNeeded()
    const sb = await sw.isChecked()
    await sw.focus()
    await page.keyboard.press('Space')
    expect(await sw.isChecked()).toBe(!sb)
  })

  test('el stepper avanza con el botón «Siguiente»', async ({ page }) => {
    await ready(page)
    const section = page.locator('h2', { hasText: 'Stepper' }).locator('xpath=following-sibling::div[1]')
    const next = section.getByRole('button', { name: 'Siguiente', exact: true })
    await next.scrollIntoViewIfNeeded()
    const before = await page.locator('[class*="g-stepper"][aria-current="step"], .g-stepper__hit[aria-current="step"]').first().textContent().catch(() => '')
    await next.click()
    await page.waitForTimeout(300)
    const after = await page.locator('[class*="g-stepper"][aria-current="step"], .g-stepper__hit[aria-current="step"]').first().textContent().catch(() => '')
    expect(after).not.toBe(before)
  })

  test('el ayudante contextual abre su contenido en la capa superior (popover) y se cierra con Esc', async ({ page }) => {
    await ready(page)
    const trig = page.getByRole('button', { name: 'Abrir ayuda' }).first()
    await trig.scrollIntoViewIfNeeded()
    await trig.click()
    await expect(page.locator('.g-helper__content:popover-open, [popover]:popover-open').first()).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.locator('.g-helper__content:popover-open')).toHaveCount(0)
  })

  test('el tema oscuro forzado aplica los tokens oscuros en el navegador', async ({ page }) => {
    await ready(page)
    await page.evaluate(() => { document.documentElement.dataset.theme = 'dark' })
    await page.waitForTimeout(300)
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
    expect(bg).toBe('rgb(20, 20, 20)')
    await page.evaluate(() => { document.documentElement.dataset.theme = 'light' })
    await page.waitForTimeout(300)
    expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe('rgb(255, 255, 255)')
  })

  test('las propiedades que usa la librería existen en el motor (popover, :has, dialog, container queries)', async ({ page }) => {
    await ready(page)
    const support = await page.evaluate(() => ({
      popover: typeof HTMLElement.prototype.showPopover === 'function',
      has: CSS.supports('selector(:has(a))'),
      dialog: typeof HTMLDialogElement !== 'undefined' && typeof HTMLDialogElement.prototype.showModal === 'function',
      container: CSS.supports('container-type: inline-size'),
      inert: 'inert' in HTMLElement.prototype,
      colorMix: CSS.supports('color: color-mix(in srgb, red, blue)')
    }))
    expect(support).toEqual({ popover: true, has: true, dialog: true, container: true, inert: true, colorMix: true })
  })
})
