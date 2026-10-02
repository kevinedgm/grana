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
    for (const c of ['g-btn', 'g-input', 'g-select', 'g-checkbox', 'g-switch', 'g-dialog', 'g-calendar', 'g-datepicker', 'g-stepper', 'g-surface', 'g-helper', 'g-avatar-motion', 'g-widget', 'g-sidebar', 'g-tabs', 'g-card', 'g-toaster', 'g-divider']) {
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

  test('las tarjetas (GCard): enlace estirado, acciones internas, selección, teclado y medición propia', async ({ page, browserName }) => {
    const errors = []
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
    page.on('console', (m) => { if (m.type() === 'error' && !/favicon/.test(m.text())) errors.push(`console: ${m.text()}`) })
    await ready(page)
    const log = page.locator('#cd-log')
    const clickAt = async (loc) => { await loc.scrollIntoViewIfNeeded(); const b = await loc.boundingBox(); await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2) }
    // Enlace estirado: un clic en la descripción o en la media activa el enlace real del título (el router cancela con navigate)
    await clickAt(page.locator('#cd-media .g-card__description'))
    await expect(log).toHaveText('navigate: #articulo')
    await clickAt(page.locator('#cd-media .g-card__media'))
    await expect(log).toHaveText('navigate: #articulo')
    // Las acciones internas van por encima y no activan la principal
    await page.locator('#cd-edit').click()
    await expect(log).toHaveText('acción interna: editar')
    // Casilla explícita: selecciona sin navegar
    const entity = page.locator('#cd-entity')
    await entity.locator('.g-card__selectbox').click()
    await expect(entity).toHaveClass(/is-selected/)
    await expect(log).toHaveText('acción interna: editar')
    // Orden de foco: casilla → título → menú → acciones. WebKit en macOS no tabula a enlaces ni botones por defecto
    // (preferencia del sistema «Tab resalta cada elemento»): ahí el orden se comprueba en Chromium y Firefox.
    if (browserName !== 'webkit') {
      await entity.locator('.g-card__select').focus()
      const order = []
      for (let i = 0; i < 5; i++) { order.push(await page.evaluate(() => document.activeElement.className.split(' ')[0] || document.activeElement.tagName)); await page.keyboard.press('Tab') }
      expect(order).toEqual(['g-card__select', 'g-card__primary', 'g-card__menu', 'g-btn', 'g-btn'])
    }
    // Enter en el título navega; el menú abre en la capa superior y Esc devuelve el foco
    await entity.locator('.g-card__primary').focus()
    await page.keyboard.press('Enter')
    await expect(log).toHaveText('navigate: #atlas')
    await entity.locator('.g-card__menu').click()
    await expect(page.locator('.g-menu__list:popover-open')).toHaveCount(1)
    await page.keyboard.press('Escape')
    await expect(page.locator('.g-menu__list:popover-open')).toHaveCount(0)
    await expect(entity.locator('.g-card__menu')).toBeFocused()
    // Radios nativos: clic en la tarjeta y flechas
    await clickAt(page.locator('#cd-plan-basic .g-card__description'))
    await expect(page.locator('#cd-plan-basic')).toHaveClass(/is-selected/)
    // (Safari no enfoca un radio al pulsar su etiqueta: el foco se pone en el radio elegido, como al entrar con Tab)
    await page.locator('#cd-plan-basic input').focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.locator('#cd-plan-team')).toHaveClass(/is-selected/)
    await expect(page.locator('#cd-plan-basic')).not.toHaveClass(/is-selected/)
    // Medición por el ancho de la propia tarjeta
    await page.locator('#card-demo input[type="range"]').fill('300')
    await expect(page.locator('#cd-horizontal')).toHaveAttribute('data-size', 'narrow')
    await expect(page.locator('#cd-horizontal .g-card__more-toggle')).toBeVisible()
    await page.locator('#card-demo input[type="range"]').fill('900')
    await expect(page.locator('#cd-horizontal')).toHaveAttribute('data-size', 'wide')
    await expect(page.locator('#cd-horizontal')).toHaveAttribute('data-layout', 'row')
    expect(errors).toEqual([])
  })
  test('los avisos (GToaster): región viva previa, canales, no roba el foco, F8, Esc dentro del modal sin cerrarlo y traslado', async ({ page, browserName }) => {
    const errors = []
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
    page.on('console', (m) => { if (m.type() === 'error' && !/favicon/.test(m.text())) errors.push(`console: ${m.text()}`) })
    await ready(page)
    const root = page.locator('.g-toaster')
    // La región existe antes del primer aviso: popover abierto en body y dos canales vivos vacíos
    await expect(root).toHaveCount(1)
    expect(await root.evaluate((r) => ({ parent: r.parentElement.localName, open: r.matches(':popover-open') }))).toEqual({ parent: 'body', open: true })
    await expect(root.locator('.g-toaster__live[role="status"][aria-live="polite"]')).toHaveText('')
    await expect(root.locator('.g-toaster__live[role="alert"]')).toHaveText('')
    await expect(root.locator('section.g-toaster__region')).toBeHidden()
    // No roba el foco; el texto compuesto llega al canal cortés
    const field = page.locator('#ts-field')
    await field.scrollIntoViewIfNeeded()
    await field.focus()
    await page.evaluate(() => document.getElementById('ts-success').click())
    await expect(root.locator('.g-toaster__live[role="status"]')).toHaveText('Correcto: Cambios guardados.')
    await expect(field).toBeFocused()
    // Error con acción: canal enérgico; F8 va a la acción del más reciente y vuelve
    await page.evaluate(() => document.getElementById('ts-error').click())
    await expect(root.locator('.g-toaster__live[role="alert"]')).toHaveText('Error: No se pudo sincronizar. Revisa la conexión. Pulsa F8 para Reintentar.')
    await page.keyboard.press('F8')
    await expect(root.locator('.g-toast__action')).toBeFocused()
    await page.keyboard.press('F8')
    await expect(field).toBeFocused()
    await page.evaluate(() => window.toaster.clear())
    await expect(root.locator('.g-toast')).toHaveCount(0)
    // Modal: la región se traslada al <dialog>, sigue abierta y pulsable; Esc en el aviso no cierra el diálogo
    await page.evaluate(() => document.getElementById('ts-dialog').click())
    const dlg = page.locator('dialog.g-dialog[open]')
    await expect(dlg).toBeVisible()
    await dlg.locator('#ts-dlg-error').click()
    await expect(dlg.locator('.g-toaster .g-toast')).toHaveCount(1)
    expect(await root.evaluate((r) => r.matches(':popover-open'))).toBe(true)
    await page.keyboard.press('F8')
    await expect(dlg.locator('.g-toast__action')).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(page.locator('.g-toast[data-state="visible"]')).toHaveCount(0)
    await expect(dlg).toBeVisible()
    // Esc fuera de los avisos sí cierra el diálogo; la región vuelve a body y sigue abierta
    await dlg.locator('input').first().focus()
    await page.keyboard.press('Escape')
    await expect(page.locator('dialog.g-dialog[open]')).toHaveCount(0)
    await expect.poll(() => root.evaluate((r) => r.parentElement.localName + ':' + r.matches(':popover-open'))).toBe('body:true')
    // Cola: 6 → 3 visibles y texto de cola
    await page.evaluate(() => document.getElementById('ts-burst').click())
    await expect(root.locator('.g-toast')).toHaveCount(3)
    await expect(root.locator('.g-toaster__queued')).toHaveText('3 más en espera')
    await page.evaluate(() => window.toaster.clear())
    expect(errors, browserName).toEqual([])
  })

  test('los formularios (GForm): filas por ancho propio, momento de los errores, resumen con foco, pie fijo sin tapar el foco y consola limpia', async ({ page, browserName }) => {
    const errors = []
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
    page.on('console', (m) => { if (m.type() === 'error' && !/favicon/.test(m.text())) errors.push(`console: ${m.text()}`) })
    // Sin desplazamiento suave (html { scroll-behavior: smooth } del playground): con carga, WebKit seguía desplazando tras
    // enfocar el resumen y el clic en su enlace caía en otro sitio
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await ready(page)
    // Filas por ancho propio (no por el visor), form.md §4: Calle · Ext. · Int. en una línea a 960 y Calle sola a 360
    const recipe = page.locator('#fm-recipe')
    await recipe.scrollIntoViewIfNeeded()
    const row = page.locator('#fm-address .g-form-row').first()
    for (const [w, lines] of [[960, '1'], [360, '2']]) {
      await recipe.evaluate((el, w) => { el.style.inlineSize = `${w}px` }, w)
      await expect(row).toHaveAttribute('data-lines', lines)
    }
    expect(await row.evaluate((r) => [...r.children].map((c) => c.dataset.line))).toEqual(['0', '1', '1'])
    expect(await row.evaluate((r) => getComputedStyle(r).gridTemplateRows.split(' ').length)).toBe(7)
    // Momento: salir sin escribir no revela; escribir y salir revela; corregir lo quita
    const nombre = page.locator('#fm-short input[name="nombre"]')
    const msg = page.locator('#fm-short .g-input__message').first()
    await nombre.focus()
    await page.keyboard.press('Tab')
    await expect(msg).toHaveText('')
    await nombre.fill('A')
    await nombre.fill('')
    await page.keyboard.press('Tab')
    await expect(msg).toHaveText('Error: Escribe tu nombre')
    await expect(nombre).toHaveAttribute('aria-invalid', 'true')
    await nombre.fill('Ana')
    await expect(msg).toHaveText('')
    // «(opcional)» forma parte del nombre accesible
    await expect(page.getByRole('textbox', { name: 'Extensión (opcional)' }).first()).toBeVisible()
    // Envío con errores: revela todos y enfoca el primer inválido (sin resumen)
    await page.locator('#fm-short button[type="submit"]').click()
    await expect(page.locator('#fm-short input[name="apellido"]')).toBeFocused()
    await expect(page.locator('#fm-short .g-input-group__message')).toContainText('10 dígitos')
    await expect(page.locator('#fs-tel-num')).toHaveAttribute('aria-invalid', 'true')
    await expect(page.locator('#fs-tel-pais')).not.toHaveAttribute('aria-invalid', 'true')
    // Resumen: foco al enviar, enlace al campo con la etiqueta a la vista, sale al corregir
    await page.locator('#fm-medium button[value="save"]').click()
    const summary = page.locator('#fm-medium .g-error-summary')
    await expect(summary).toBeFocused()
    const links = summary.locator('.g-error-summary__link')
    const before = await links.count()
    expect(before).toBeGreaterThan(3)
    await links.first().click()
    await expect(page.locator('#fm-medium input[name="m-nombre"]')).toBeFocused()
    await page.keyboard.type('Ana')
    await expect(links).toHaveCount(before - 1)
    // Solo lectura: enfocable, sin marcas
    await expect(page.locator('#fm-view .g-input.is-readonly').first()).toBeVisible()
    await expect(page.locator('#fm-view [class*="__optional"]')).toHaveCount(0)
    // Pie fijo: Tab por todos los campos, ninguno queda debajo del pie
    await page.locator('#fm-sticky input').first().focus()
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
    let covered = 0
    for (let i = 0; i < 14; i++) {
      covered += await page.evaluate(() => {
        const t = document.activeElement
        const bar = document.querySelector('#fm-sticky .g-form-actions')
        if (!t || !t.closest('#fm-sticky') || bar.contains(t)) return 0
        return t.getBoundingClientRect().bottom > bar.getBoundingClientRect().top + 0.5 ? 1 : 0
      })
      await page.keyboard.press('Tab')
      await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
    }
    expect(covered, browserName).toBe(0)
    expect(await page.locator('#fm-sticky').evaluate((f) => f.style.getPropertyValue('--g-form-actions-size'))).toMatch(/px$/)
    expect(errors, browserName).toEqual([])
    // 320px en una página nueva cargada a ese ancho (sin errores, tampoco «ResizeObserver loop» en WebKit)
    const narrow = await page.context().newPage()
    narrow.on('pageerror', (e) => errors.push(`pageerror 320: ${e.message}`))
    narrow.on('console', (m) => { if (m.type() === 'error' && !/favicon/.test(m.text())) errors.push(`console 320: ${m.text()}`) })
    await narrow.setViewportSize({ width: 320, height: 800 })
    await ready(narrow)
    await narrow.locator('#fm-short').scrollIntoViewIfNeeded()
    await expect(narrow.locator('#fm-short .g-form-row').first()).toHaveAttribute('data-lines', '2')
    await expect(narrow.locator('#fm-short .g-form-actions')).toHaveAttribute('data-stacked', '')
    expect(await narrow.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    expect(await narrow.evaluate(() => [...document.querySelectorAll('#sec-form .g-input, #sec-form .g-select, #sec-form .g-input-group, #sec-form .g-field-group, #sec-form .g-form-actions')].filter((el) => !el.closest('#fm-recipe') && el.getBoundingClientRect().right > innerWidth + 0.5).length)).toBe(0)
    expect(errors, browserName).toEqual([])
  })

  test('el separador (GDivider): árbol de accesibilidad, sin foco, alto del vertical con GBtn reales, inset, RTL, texto largo y 320px', async ({ page, browserName }) => {
    const errors = []
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
    page.on('console', (m) => { if (m.type() === 'error' && !/favicon/.test(m.text())) errors.push(`console: ${m.text()}`) })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await ready(page)
    const demo = page.locator('#dv-demo')
    await demo.scrollIntoViewIfNeeded()
    // Árbol: 19 separators (10 hr y 9 verticales: 7 en filas de botones y 2 en la cuadrícula); con texto, ninguno y el texto presente; ninguno con nombre
    const seps = demo.getByRole('separator')
    await expect(seps).toHaveCount(19)
    for (const n of await seps.all()) expect(await n.getAttribute('aria-label')).toBeNull()
    expect(await demo.locator('[role="separator"]').evaluateAll((els) => els.every((e) => e.getAttribute('aria-orientation') === 'vertical' && e.tagName === 'DIV'))).toBe(true)
    await expect(demo.locator('[role="separator"]')).toHaveCount(9)
    const labeled = demo.locator('.g-divider--labeled')
    await expect(labeled).toHaveCount(6)
    expect(await labeled.evaluateAll((els) => els.every((e) => !e.hasAttribute('role') && e.tagName === 'DIV'))).toBe(true)
    const snap = await page.locator('#dv-labeled').ariaSnapshot()
    expect(snap).toContain('text: O bien')
    expect(snap).not.toContain('separator')
    expect(await page.locator('#dv-row-md').ariaSnapshot()).toMatch(/button "Compartir"[\s\S]*separator[\s\S]*button "Nuevo"[\s\S]*separator[\s\S]*button "Buscar"/)
    if (browserName === 'chromium') {
      // Árbol real del navegador (CDP): separators con su orientación, sin nombre; el texto como StaticText fuera de un separator
      const cdp = await page.context().newCDPSession(page)
      const { nodes } = await cdp.send('Accessibility.getFullAXTree')
      const sepNodes = nodes.filter((n) => !n.ignored && n.role && n.role.value === 'separator')
      const orient = (n) => (n.properties || []).find((p) => p.name === 'orientation')?.value.value
      expect(sepNodes.filter((n) => orient(n) === 'vertical').length).toBeGreaterThanOrEqual(9)
      expect(sepNodes.every((n) => !n.name || !n.name.value)).toBe(true)
      expect(nodes.some((n) => !n.ignored && n.role?.value === 'StaticText' && n.name?.value === 'O bien')).toBe(true)
    }
    // Nunca enfocable: Tab va de «Compartir» a «Nuevo» saltando el vertical (WebKit en macOS solo lleva el Tab a los
    // botones con Alt+Tab, como Safari con la preferencia por defecto)
    await page.locator('#dv-row-md').getByRole('button', { name: 'Compartir' }).focus()
    await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab')
    await expect(page.locator('#dv-row-md').getByRole('button', { name: 'Nuevo' })).toBeFocused()
    // Vertical: alto de la fila (alto del GBtn) − 2 × inset (8px por defecto), con align-items: center
    const rows = await page.evaluate(() => ['sm', 'md', 'lg'].map((sz) => {
      const row = document.getElementById(`dv-row-${sz}`)
      const h = (s) => row.querySelector(s).getBoundingClientRect().height
      const w = row.querySelector('.dv-full').getBoundingClientRect().width
      return [h('.g-btn'), h('.dv-in'), h('.dv-full'), w]
    }))
    expect(rows, browserName).toEqual([[28, 12, 28, 1], [36, 20, 36, 1], [44, 28, 44, 1]])
    // Inset: none ocupa la caja de contenido; both 8/8; start 8/0
    const ins = await page.evaluate(() => ['none', 'both', 'start'].map((k) => {
      const d = document.getElementById(`dv-inset-${k}`)
      const p = d.parentElement.getBoundingClientRect()
      const r = d.getBoundingClientRect()
      return [Math.round(r.left - p.left), Math.round(p.right - r.right)]
    }))
    expect(ins).toEqual([[0, 0], [8, 8], [8, 0]])
    // La lista anfitriona redefine --g-divider-inset: la línea empieza donde el texto (±1px), en default y compact
    const align = () => page.evaluate(() => {
      const d = document.querySelector('#dv-nav .g-divider').getBoundingClientRect()
      const t = document.querySelector('#dv-nav .dv-text').getBoundingClientRect()
      return Math.abs(d.left - t.left)
    })
    expect(await align()).toBeLessThanOrEqual(1)
    await page.locator('#dv-demo').getByLabel('Lista compacta').check()
    await expect(page.locator('#dv-nav')).toHaveAttribute('data-density', 'compact')
    expect(await align()).toBeLessThanOrEqual(1)
    // RTL: inset start a la derecha; texto centrado; vertical con el alto de su fila
    const rtl = await page.evaluate(() => {
      const d = document.querySelector('#dv-rtl .dv-rtl-start')
      const p = d.parentElement.getBoundingClientRect()
      const r = d.getBoundingClientRect()
      const lab = document.querySelector('#dv-rtl .g-divider--labeled')
      const lr = lab.getBoundingClientRect()
      const sr = lab.querySelector('.g-divider__label').getBoundingClientRect()
      const row = document.getElementById('dv-rtl-row')
      return { right: Math.round(p.right - r.right), left: Math.round(r.left - p.left), center: Math.abs((sr.left + sr.right) / 2 - (lr.left + lr.right) / 2), btn: row.querySelector('.g-btn').getBoundingClientRect().height, v: row.querySelector('.dv-in').getBoundingClientRect().height }
    })
    expect([rtl.right, rtl.left]).toEqual([8, 0])
    expect(rtl.center).toBeLessThanOrEqual(1)
    expect(rtl.v).toBe(rtl.btn - 16)
    // Texto largo a 200px: envuelve, no se recorta y cada línea conserva su mínimo (space × 4)
    const long = await page.evaluate(() => {
      const root = document.querySelector('#dv-long .g-divider')
      const span = root.querySelector('.g-divider__label')
      const gap = parseFloat(getComputedStyle(root).columnGap)
      const line = (root.getBoundingClientRect().width - span.getBoundingClientRect().width - 2 * gap) / 2
      return { lines: Math.round(span.getBoundingClientRect().height / parseFloat(getComputedStyle(span).lineHeight)), clipped: span.scrollWidth > span.clientWidth + 1, line }
    })
    expect(long.lines).toBeGreaterThan(1)
    expect(long.clipped).toBe(false)
    expect(long.line).toBeGreaterThanOrEqual(15.5)
    // Decorativo en GDialog: fuera del árbol
    await page.locator('#dv-open-dlg').click()
    const dlg = page.locator('dialog.g-dialog[open]')
    await expect(dlg.locator('#dv-dlg-body')).toBeVisible()
    await expect(dlg.locator('#dv-dlg-body hr.g-divider[aria-hidden="true"]')).toHaveCount(2)
    await expect(dlg.getByRole('separator')).toHaveCount(0)
    expect(await dlg.locator('#dv-dlg-body').ariaSnapshot()).not.toContain('separator')
    await page.keyboard.press('Escape')
    await expect(page.locator('dialog.g-dialog[open]')).toHaveCount(0)
    expect(errors, browserName).toEqual([])
    // 320px: sin desborde de página ni de ningún divider
    const narrow = await page.context().newPage()
    narrow.on('pageerror', (e) => errors.push(`pageerror 320: ${e.message}`))
    narrow.on('console', (m) => { if (m.type() === 'error' && !/favicon/.test(m.text())) errors.push(`console 320: ${m.text()}`) })
    await narrow.setViewportSize({ width: 320, height: 800 })
    await ready(narrow)
    await narrow.locator('#dv-demo').scrollIntoViewIfNeeded()
    expect(await narrow.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    expect(await narrow.evaluate(() => [...document.querySelectorAll('#dv-demo .g-divider, #dv-demo .dv-bar')].filter((el) => { const r = el.getBoundingClientRect(); return r.right > innerWidth + 0.5 || r.left < -0.5 }).length)).toBe(0)
    expect(errors, browserName).toEqual([])
  })

  test('los iconos (GIcon público): árbol de accesibilidad, 48px por clase, flip solo en RTL, registro (lock-open), items por nombre, lead y sin avisos', async ({ page, browserName }) => {
    const errors = []
    const warns = []
    // Avisos de desarrollo de Grana: el UMD los emite si existe process.env (NODE_ENV distinto de production)
    await page.addInitScript(() => { window.process = { env: { NODE_ENV: 'development' } } })
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
    page.on('console', (m) => {
      if (m.type() === 'error' && !/favicon/.test(m.text())) errors.push(`console: ${m.text()}`)
      if (m.type() === 'warning' && /\[Grana GIcon\]/.test(m.text())) warns.push(m.text())
    })
    await ready(page)
    await page.locator('#sec-icons').scrollIntoViewIfNeeded()
    // Decorativo: fuera del árbol; con label: img «Bloqueado»; el botón se llama por su aria-label
    const deco = await page.locator('#pg-ic-deco').ariaSnapshot()
    expect(deco).toContain('Formulario bloqueado')
    expect(deco).not.toContain('img')
    expect(await page.locator('#pg-ic-label').ariaSnapshot()).toContain('img "Bloqueado"')
    expect(await page.locator('#pg-ic-btn').ariaSnapshot()).toMatch(/^- button "Desbloquear"$/)
    const attrs = await page.locator('#pg-ic-label svg').evaluate((s) => ({ role: s.getAttribute('role'), hidden: s.getAttribute('aria-hidden'), focusable: s.getAttribute('focusable'), tab: s.getAttribute('tabindex') }))
    expect(attrs).toEqual({ role: 'img', hidden: null, focusable: 'false', tab: null })
    expect(await page.locator('#pg-ic-deco svg').getAttribute('aria-hidden')).toBe('true')
    // Tamaño: 1em del texto; la clase de la aplicación gana a :where(.g-icon) (48px); color = currentColor
    const size = await page.locator('#pg-ic-size svg').evaluate((s) => { const r = s.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height), getComputedStyle(s).stroke === getComputedStyle(s.parentElement).color] })
    expect(size).toEqual([48, 48, true])
    const fs = await page.locator('#pg-ic-deco').evaluate((el) => [Math.round(el.querySelector('svg').getBoundingClientRect().width), Math.round(parseFloat(getComputedStyle(el).fontSize))])
    expect(fs[0]).toBe(fs[1])
    // Registro de la aplicación: lock-open (no está en la librería) se dibuja con su trazo de lucide-static
    expect(await page.locator('#pg-ic-open svg').innerHTML()).toContain('M7 11V7a5 5 0 0 1 9.9-1')
    // flip-rtl: espejo solo con dirección efectiva RTL y solo con la clase
    const scale = (sel) => page.locator(`${sel} svg`).evaluate((s) => getComputedStyle(s).scale)
    expect(['none', '1']).toContain(await scale('#pg-ic-ltr'))
    expect(await scale('#pg-ic-rtl')).toBe('-1 1')
    expect(['none', '1']).toContain(await scale('#pg-ic-rtl-noflip'))
    // Items por nombre, sin slot: GTabs, GMenu y GSidebar dibujan GIcon en su hueco decorativo
    const tabIcons = page.locator('#pg-ic-tabs .g-tabs__icon[aria-hidden="true"] > svg.g-icon')
    await expect(tabIcons).toHaveCount(4)
    expect(await page.locator('#pg-ic-tabs [role="tab"]').first().ariaSnapshot()).toMatch(/tab "Perfil"/)
    await expect(page.locator('#pg-ic-sidebar .g-sidebar__icon[aria-hidden="true"] > svg.g-icon')).toHaveCount(3)
    await page.locator('#sec-icons').getByRole('button', { name: 'Acciones' }).click()
    await expect(page.locator('.g-menu__list:popover-open .g-menu__icon[aria-hidden="true"] > svg.g-icon')).toHaveCount(4)
    await page.keyboard.press('Escape')
    // Lead de GFormSection: primer hijo de __heading, decorativo; el encabezado se llama solo por su título
    const lead = page.locator('#pg-ic-section .g-form-section__heading > .g-form-section__lead:first-child')
    await expect(lead).toHaveAttribute('aria-hidden', 'true')
    expect(await lead.evaluate((l) => l.nextElementSibling.tagName)).toBe('H3')
    expect(await page.locator('#pg-ic-section .g-form-section__heading').ariaSnapshot()).toMatch(/heading "Acceso y seguridad" \[level=3\]/)
    if (browserName === 'chromium') {
      // Árbol real del navegador (CDP): un solo image con nombre en la sección «Decorativo y con nombre»
      const cdp = await page.context().newCDPSession(page)
      const { nodes } = await cdp.send('Accessibility.getFullAXTree')
      const imgs = nodes.filter((n) => !n.ignored && n.role && ['image', 'img'].includes(n.role.value) && n.name && n.name.value === 'Bloqueado')
      expect(imgs.length).toBe(1)
      const btn = nodes.find((n) => !n.ignored && n.role && n.role.value === 'button' && n.name && n.name.value === 'Desbloquear')
      expect(btn).toBeTruthy()
    }
    // RTL global: el espejo sigue la dirección efectiva
    await page.evaluate(() => { document.querySelector('#pg-ic-ltr').dir = 'rtl' })
    expect(await scale('#pg-ic-ltr')).toBe('-1 1')
    expect(warns, browserName).toEqual([])
    expect(errors, browserName).toEqual([])
  })
})
