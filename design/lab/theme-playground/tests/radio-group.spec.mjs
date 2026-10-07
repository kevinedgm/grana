// GRadioGroup sobre el COMPONENTE REAL del playground (packages/vue/playground, #sec-radio y #sec-form), en Chromium,
// Firefox y WebKit. Port de design/lab/radio-group/r01/verificar.mjs (kiwi) y de los puntos de navegador del contrato
// (design/contracts/radio-group.md «Verificación»; DECISIONS.md #267 a #273). La distribución en GFormRow (mismo top ±1px,
// la fila se parte antes de apilar) está en form-distribution.spec.mjs (#184).
import { test, expect } from '@playwright/test'

const PAGE = '/packages/vue/playground/index.html'

async function watchConsole(page) {
  const errs = []
  page.on('pageerror', (e) => { if (!/ResizeObserver loop/.test(e.message)) errs.push(`pageerror: ${e.message}`) })
  page.on('console', (m) => {
    const t = m.text()
    if (m.type() === 'error' && !/favicon/.test(t)) errs.push(`console: ${t}`)
    else if (m.type() === 'warning' && /\[Vue warn\]|\[Grana GRadioGroup/.test(t)) errs.push(`warning: ${t}`)
  })
  return errs
}
async function open(page, width = 1280) {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width, height: 900 })
  await page.goto(PAGE)
  await page.waitForSelector('#rg-segmented .g-radio-group__options')
  await page.evaluate(() => document.fonts.ready)
  await page.locator('#sec-radio').scrollIntoViewIfNeeded()
}
const settle = (page) => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 30)))))
const checkedOf = (page, name) => page.evaluate((n) => document.querySelector(`input[name="${n}"]:checked`)?.value ?? null, name)
const active = (page) => page.evaluate(() => { const a = document.activeElement; return a?.type === 'radio' ? `${a.name}=${a.value}${a.checked ? '*' : ''}` : a?.id || a?.tagName })

test.describe('GRadioGroup · componente real (radio-group.md)', () => {
  test('teclado nativo: Tab entra una vez, flechas mueven y eligen, saltan la deshabilitada; Espacio elige', async ({ page, browserName }) => {
    const errs = await watchConsole(page)
    await open(page)
    // WebKit (macOS) no lleva Tab a los radios sin «Acceso total por teclado» (#272): se entra con focus()
    if (browserName !== 'webkit') {
      await page.locator('#rg-inline input').last().focus()
      await page.keyboard.press('Tab')
      expect(await active(page), 'Tab desde el grupo anterior entra en la primera opción sin selección').toBe('rg-sexo=F')
    } else {
      await page.locator('#rg-segmented-0').focus()
    }
    await page.keyboard.press('Space')
    expect(await checkedOf(page, 'rg-sexo')).toBe('F')
    await page.keyboard.press('ArrowRight')
    expect(await checkedOf(page, 'rg-sexo')).toBe('M')
    await page.keyboard.press('ArrowDown')
    expect(await checkedOf(page, 'rg-sexo')).toBe('X')
    expect(await page.locator('#rg-log').textContent()).toContain('sexo=X')
    if (browserName !== 'webkit') {
      await page.keyboard.press('ArrowRight')
      expect(await checkedOf(page, 'rg-sexo'), 'envuelve a la primera').toBe('F')
      await page.keyboard.press('Tab')
      expect(await active(page), 'Tab sale del grupo al siguiente').toMatch(/^rg-frecuencia=/)
      await page.keyboard.press('Shift+Tab')
      expect(await active(page), 'Shift+Tab vuelve a la elegida').toBe('rg-sexo=F*')
    }
    expect(await page.locator('input[name="rg-sexo"]:checked').count()).toBe(1)
    // Opción deshabilitada: las flechas la saltan (Presencial → En línea → Presencial, nunca Por teléfono)
    await page.locator('#rg-list-1').focus()
    await page.keyboard.press('ArrowDown')
    expect(await checkedOf(page, 'rg-modalidad')).not.toBe('tel')
    // Tipos originales en el modelo (Boolean y Number)
    await page.locator('label[for="rg-inline-0"]').click()
    await page.locator('label[for="rg-card-2"]').click()
    const log = await page.locator('#rg-log').textContent()
    expect(log).toContain('fuma=true (boolean)')
    expect(log).toContain('plan=3 (number)')
    expect(errs, browserName).toEqual([])
  })

  test('solo lectura: flechas, Espacio y clic no cambian la elegida ni el foco; enfocable y dentro de FormData', async ({ page, browserName }) => {
    const errs = await watchConsole(page)
    await open(page)
    await page.locator('#rg-ro-1').focus()
    for (const k of ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Space']) await page.keyboard.press(k)
    expect(await active(page)).toBe('rg-ro=M*')
    await page.locator('label[for="rg-ro-2"]').click()
    await page.locator('label[for="rg-ro-list-1"]').click()
    expect(await checkedOf(page, 'rg-ro')).toBe('M')
    expect(await checkedOf(page, 'rg-ro-list')).toBe('presencial')
    // Radios habilitados (enfocables): solo «Por teléfono», que es una opción deshabilitada, lleva disabled
    expect(await page.evaluate(() => [...document.querySelectorAll('[name=rg-ro],[name=rg-ro-list]')].filter((r) => r.disabled).map((r) => r.value))).toEqual(['tel'])
    const fd = await page.evaluate(() => Object.fromEntries(new FormData(document.getElementById('rg-states'))))
    expect(fd['rg-ro']).toBe('M')
    expect(fd['rg-ro-list']).toBe('presencial')
    expect('rg-dis' in fd, 'grupo deshabilitado fuera de FormData').toBe(false)
    expect('rg-ninguna' in fd, 'sin selección: el grupo no aparece').toBe(false)
    expect(await page.evaluate(() => [...document.querySelectorAll('[name=rg-dis]')].every((r) => r.matches(':disabled'))), 'fieldset disabled en cascada').toBe(true)
    expect(errs, browserName).toEqual([])
  })

  test('semántica: radiogroup con nombre en las cinco apariencias, estados en el grupo y nunca en los radios', async ({ page, browserName }) => {
    await open(page)
    const sem = await page.evaluate(() => [...document.querySelectorAll('#sec-radio .g-radio-group')].map((g) => ({
      id: g.id,
      tag: g.tagName,
      app: [...g.classList].find((c) => c.startsWith('g-radio-group--appearance-')).slice(26),
      role: g.getAttribute('role'),
      named: Boolean(document.getElementById(g.getAttribute('aria-labelledby'))?.textContent.trim()),
      names: new Set([...g.querySelectorAll('input')].map((r) => r.name)).size,
      nativeReq: g.querySelectorAll('input[required]').length,
      onRadios: g.querySelectorAll('input[aria-invalid], input[aria-required], input[aria-readonly]').length,
      iconsHidden: [...g.querySelectorAll('.g-radio-group__icon')].every((i) => i.getAttribute('aria-hidden') === 'true'),
      direct: [...g.querySelectorAll('.g-radio-group__input')].every((i) => i.parentElement.matches('label.g-radio-group__option'))
    })))
    expect(sem.length).toBeGreaterThanOrEqual(14)
    for (const s of sem) {
      expect(s.role === 'radiogroup' && s.named, `${s.id}: radiogroup con nombre visible`).toBe(true)
      expect(s.tag, `${s.id}: raíz para ${s.app}`).toBe(['inline', 'segmented'].includes(s.app) ? 'DIV' : 'FIELDSET')
      expect(s.names, `${s.id}: name común`).toBe(1)
      expect(s.nativeReq + s.onRadios, `${s.id}: sin required nativo ni estados en los radios`).toBe(0)
      expect(s.iconsHidden && s.direct, `${s.id}: iconos aria-hidden y radio hijo directo de su label`).toBe(true)
    }
    await expect(page.locator('#rg-segmented')).toHaveAttribute('aria-required', 'true')
    await expect(page.locator('#rg-err')).toHaveAttribute('aria-invalid', 'true')
    await expect(page.locator('#rg-ro')).toHaveAttribute('aria-readonly', 'true')
    // Nombres accesibles reales (los tres motores): radios por su etiqueta, también en solo icono
    await expect(page.getByRole('radiogroup', { name: 'Modalidad de consulta' })).toHaveCount(1)
    await expect(page.getByRole('radio', { name: 'En línea' }).first()).toHaveAttribute('id', 'rg-list-1')
    await expect(page.locator('#rg-icon').getByRole('radio', { name: 'Gráfica', exact: true })).toHaveAttribute('id', 'rg-icon-1')
    await expect(page.locator('#rg-list-1')).toHaveAccessibleDescription('Videollamada; el enlace llega por correo.')
    if (browserName === 'chromium') {
      const cdp = await page.context().newCDPSession(page)
      const { nodes } = await cdp.send('Accessibility.getFullAXTree')
      const prop = (n, k) => (n.properties || []).find((x) => x.name === k)?.value.value
      const groups = nodes.filter((n) => !n.ignored && n.role?.value === 'radiogroup')
      expect(groups.length, 'AX: radiogroup por grupo (también fieldset)').toBeGreaterThanOrEqual(sem.length)
      expect(groups.every((g) => g.name?.value), 'AX: todos con nombre').toBe(true)
      expect(prop(groups.find((g) => g.name?.value.startsWith('¿Alergias')), 'invalid')).toBe('true')
      const radios = nodes.filter((n) => !n.ignored && n.role?.value === 'radio')
      expect(radios.every((r) => r.name?.value), 'AX: todos los radios con nombre').toBe(true)
      expect(radios.every((r) => prop(r, 'invalid') !== 'true'), 'AX: ningún radio inválido antes de tiempo').toBe(true)
    }
  })

  test('geometría: opciones ≥ 24×24, textos sin recortar, segmentos iguales, apilado por su ancho y RTL espejado', async ({ page, browserName }) => {
    const errs = await watchConsole(page)
    await open(page)
    const r = await page.evaluate(() => {
      const out = { small: [], trunc: [], unequal: [] }
      document.querySelectorAll('#sec-radio .g-radio-group__option').forEach((o) => { const b = o.getBoundingClientRect(); if (b.width && (b.width < 24 || b.height < 24)) out.small.push(`${o.textContent.trim()} ${b.width.toFixed(0)}×${b.height.toFixed(0)}`) })
      document.querySelectorAll('#sec-radio .g-radio-group__option-label, #sec-radio .g-radio-group__description, #sec-radio .g-radio-group__label').forEach((t) => { if (!t.closest('.is-icon-only') && t.scrollWidth > t.clientWidth + 1 && getComputedStyle(t).display !== 'inline') out.trunc.push(t.textContent) })
      for (const id of ['rg-segmented', 'rg-ro', 'rg-icon', 'rg-rtl']) {
        const ws = [...document.querySelectorAll(`#${id} .g-radio-group__option`)].map((o) => o.getBoundingClientRect().width)
        if (Math.max(...ws) - Math.min(...ws) > 1) out.unequal.push(`${id}: ${ws.map((w) => w.toFixed(1))}`)
      }
      const stack = document.getElementById('rg-stack')
      const tops = [...stack.querySelectorAll('.g-radio-group__option')].map((o) => o.getBoundingClientRect().top)
      out.stacked = stack.classList.contains('is-stacked') && tops.every((t, i) => i === 0 || t > tops[i - 1])
      out.oneLine = ['rg-segmented', 'rg-ro', 'rg-icon', 'rg-rtl'].every((id) => !document.getElementById(id).classList.contains('is-stacked'))
      const rtl = [...document.querySelectorAll('#rg-rtl .g-radio-group__option')].map((x) => x.getBoundingClientRect().left)
      out.rtl = rtl[0] > rtl[1] && rtl[1] > rtl[2]
      out.pageOverflow = document.documentElement.scrollWidth > document.documentElement.clientWidth
      return out
    })
    expect(r.small, 'opciones ≥ 24×24').toEqual([])
    expect(r.trunc, 'textos sin recortar').toEqual([])
    expect(r.unequal, 'segmentos iguales').toEqual([])
    expect(r.stacked, 'Lado dominante (4 opciones en 220px) se apila en orden').toBe(true)
    expect(r.oneLine, 'los segmentados anchos siguen en una línea').toBe(true)
    expect(r.rtl, 'RTL: la primera opción a la derecha').toBe(true)
    expect(r.pageOverflow).toBe(false)
    // El apilado sigue al ancho propio, en los dos sentidos y sin oscilar
    await page.evaluate(() => { document.querySelector('#rg-stack').parentElement.style.maxInlineSize = '640px' })
    await settle(page)
    await expect(page.locator('#rg-stack')).not.toHaveClass(/is-stacked/)
    await page.evaluate(() => { document.querySelector('#rg-stack').parentElement.style.maxInlineSize = '220px' })
    await settle(page)
    await expect(page.locator('#rg-stack')).toHaveClass(/is-stacked/)
    // --measure solo durante la medida
    expect(await page.locator('.g-radio-group--measure').count()).toBe(0)
    // RTL: flecha izquierda desde la primera va a la siguiente (Chromium y Firefox; WebKit no invierte, #272)
    if (browserName !== 'webkit') {
      await page.locator('#rg-rtl-0').focus()
      await page.keyboard.press('ArrowLeft')
      expect(await checkedOf(page, 'rg-rtl')).toBe('m')
    }
    expect(errs, browserName).toEqual([])
  })

  test('en el formulario: Sexo es un GRadioGroup segmentado que GForm revela al cambiar y que GErrorSummary enlaza', async ({ page, browserName }) => {
    const errs = await watchConsole(page)
    await open(page)
    const sexo = page.locator('#fm-sexo')
    await expect(sexo).toHaveAttribute('role', 'radiogroup')
    await expect(sexo).toHaveClass(/g-radio-group--appearance-segmented/)
    await expect(sexo).toHaveAttribute('aria-required', 'true')
    await expect(sexo.locator('input[required]')).toHaveCount(0)
    await page.locator('#fm-medium').evaluate((f) => f.requestSubmit())
    await settle(page)
    await expect(sexo).toHaveAttribute('aria-invalid', 'true')
    const link = page.locator('#fm-medium .g-error-summary__link', { hasText: 'Elige una opción' }).first()
    await expect(link).toHaveAttribute('href', '#fm-sexo-0')
    await link.click()
    await expect(page.locator('#fm-sexo-0')).toBeFocused()
    await page.locator('label[for="fm-sexo-1"]').click()
    await settle(page)
    await expect(sexo).not.toHaveAttribute('aria-invalid', 'true')
    expect(await page.evaluate(() => new FormData(document.getElementById('fm-medium')).get('m-sexo'))).toBe('m')
    expect(errs, browserName).toEqual([])
  })

  test('movimiento: el relleno del segmento tiene transición; con movimiento reducido, sin crecer el punto', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto(PAGE)
    await page.waitForSelector('#rg-segmented')
    const dur = await page.evaluate(() => getComputedStyle(document.querySelector('#rg-segmented .g-radio-group__option')).transitionDuration)
    expect(dur.split(',').some((d) => parseFloat(d) > 0), `transición (${dur})`).toBe(true)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const props = await page.evaluate(() => getComputedStyle(document.querySelector('#rg-list .g-radio-group__input')).transitionProperty)
    expect(props, 'sin box-shadow (punto) con movimiento reducido').not.toMatch(/box-shadow/)
  })

  test('táctil (pointer: coarse) y forced-colors (Chromium)', async ({ browser, browserName }) => {
    test.skip(browserName !== 'chromium', 'puntero grueso y colores forzados: Playwright solo los emula en Chromium')
    const ctx = await browser.newContext({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } })
    const t = await ctx.newPage()
    await t.goto(PAGE)
    await t.waitForSelector('#rg-segmented')
    expect(await t.evaluate(() => matchMedia('(pointer: coarse)').matches)).toBe(true)
    const small = await t.evaluate(() => [...document.querySelectorAll('#sec-radio .g-radio-group__option, #fm-sexo .g-radio-group__option, #fm-primera .g-radio-group__option')].filter((o) => { const b = o.getBoundingClientRect(); return b.width && (b.height < 44 || b.width < 44) }).map((o) => `${o.textContent.trim()} ${o.getBoundingClientRect().width.toFixed(0)}×${o.getBoundingClientRect().height.toFixed(0)}`))
    expect(small, 'opciones ≥ 44×44').toEqual([])
    await ctx.close()
    const f = await browser.newPage()
    await f.goto(PAGE)
    await f.waitForSelector('#rg-segmented')
    await f.emulateMedia({ forcedColors: 'active' })
    const fc = await f.evaluate(() => {
      const [a, b] = [...document.querySelectorAll('#rg-ro .g-radio-group__option')]
      const c = [...document.querySelectorAll('#rg-icon .g-radio-group__option')]
      return { a: getComputedStyle(c[0]).backgroundColor, b: getComputedStyle(c[1]).backgroundColor, frame: getComputedStyle(document.querySelector('#rg-segmented .g-radio-group__options'), '::after').outlineStyle, ro: [getComputedStyle(a).outlineStyle, getComputedStyle(b).outlineStyle] }
    })
    expect(fc.a, 'forced-colors: segmento elegido distinto').not.toBe(fc.b)
    expect(fc.frame, 'forced-colors: marco del segmentado visible').not.toBe('none')
    await f.close()
  })
  test('etiqueta del grupo en RTL: el texto en __label-text con dir="auto" no se invierte; la etiqueta sigue al inicio (#282)', async ({ page, browserName }) => {
    const errs = await watchConsole(page)
    await open(page)
    await page.evaluate(() => document.getElementById('fr-form').closest('[data-frame]').setAttribute('dir', 'rtl'))
    const r = await page.evaluate(() => {
      const lab = document.querySelector('#fr-factura .g-radio-group__label')
      const txt = lab.querySelector(':scope > .g-radio-group__label-text')
      const L = lab.getBoundingClientRect(); const T = txt.getBoundingClientRect()
      return { dir: txt.getAttribute('dir'), labDir: lab.getAttribute('dir'), cdir: getComputedStyle(txt).direction, blockDir: getComputedStyle(lab).direction, endGap: L.right - T.right, text: txt.textContent }
    })
    expect(r.dir).toBe('auto')
    expect(r.labDir, 'sin dir en __label').toBeNull()
    expect(r.cdir, 'texto en español aislado como LTR').toBe('ltr')
    expect(r.blockDir, 'el bloque sigue al contenedor').toBe('rtl')
    expect(Math.abs(r.endGap), `etiqueta alineada al inicio (derecha) en RTL (${r.endGap})`).toBeLessThanOrEqual(1)
    expect(r.text).toBe('¿Requiere factura?')
    expect(errs, browserName).toEqual([])
  })
})
