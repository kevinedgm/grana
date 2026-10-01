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
    for (const c of ['g-btn', 'g-input', 'g-select', 'g-checkbox', 'g-switch', 'g-dialog', 'g-calendar', 'g-datepicker', 'g-stepper', 'g-surface', 'g-helper', 'g-avatar-motion', 'g-widget', 'g-sidebar', 'g-tabs']) {
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

  test('las pestañas (GTabs): roles, flechas con foco, marca, «Más» (popover) y diálogo con cabecera fija', async ({ page }) => {
    const errors = []
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
    page.on('console', (m) => { if (m.type() === 'error' && !/favicon/.test(m.text())) errors.push(`console: ${m.text()}`) })
    await ready(page)
    const demo = page.locator('#tabs-demo')
    await demo.scrollIntoViewIfNeeded()
    const first = demo.locator('.g-tabs').first()
    await expect(first.locator('[role="tablist"]')).toHaveAttribute('aria-label', 'Cuenta')
    await expect(first).toHaveClass(/is-ready/)
    expect(await first.locator('.g-tabs__mark').evaluate((m) => m.getBoundingClientRect().width)).toBeGreaterThan(20)
    // El teclado: Tab entra en la activa; → activa y mueve el foco; End va a la última habilitada (Permisos está deshabilitada)
    await first.getByRole('tab', { name: /General/ }).focus()
    await page.keyboard.press('ArrowRight')
    await expect(first.getByRole('tab', { name: /Mensajes/ })).toBeFocused()
    await expect(first.getByRole('tab', { name: /Mensajes/ })).toHaveAttribute('aria-selected', 'true')
    await page.keyboard.press('End')
    await expect(first.getByRole('tab', { name: /Informe/ })).toBeFocused()
    await expect(first.locator('[role="tabpanel"]')).toHaveCount(6)
    await expect(first.locator('[role="tabpanel"]:not([hidden])')).toContainText('Informe')
    // «Más»: el menú vive en la capa superior y la elegida entra en la barra con el foco
    const more = demo.locator('.g-tabs--overflow-more').first()
    await more.scrollIntoViewIfNeeded()
    const btn = more.locator('.g-tabs__more')
    await expect(btn).toBeVisible()
    await btn.click()
    await expect(page.locator('.g-menu__list:popover-open [role="menuitemradio"]').first()).toBeVisible()
    await page.locator('.g-menu__list:popover-open [role="menuitemradio"]', { hasText: 'Etiquetas' }).click()
    await expect(more.getByRole('tab', { name: 'Etiquetas' })).toBeFocused()
    // Diálogo: la cabecera de pestañas no se desplaza con el cuerpo
    await demo.getByRole('button', { name: 'Diálogo con pestañas' }).click()
    const dlg = page.locator('dialog.g-dialog[open]')
    await expect(dlg.locator('.g-dialog__tabs [role="tablist"]')).toBeVisible()
    await page.waitForTimeout(500) // la entrada del diálogo termina
    const top = await dlg.locator('.g-dialog__tabs').evaluate((e) => e.getBoundingClientRect().top)
    await dlg.locator('.g-dialog__body').evaluate((b) => { b.scrollTop = 200 })
    expect(await dlg.locator('.g-dialog__tabs').evaluate((e) => e.getBoundingClientRect().top)).toBe(top)
    await dlg.getByRole('tab', { name: /Miembros/ }).focus()
    await page.keyboard.press('ArrowRight')
    await expect(dlg.getByRole('tab', { name: 'Facturación' })).toHaveAttribute('aria-selected', 'true')
    await expect(dlg.locator('[role="tabpanel"]:not([hidden])')).toContainText('Facturación')
    await page.keyboard.press('Escape')
    await expect(page.locator('dialog.g-dialog[open]')).toHaveCount(0)
    expect(errors).toEqual([])
  })
})
