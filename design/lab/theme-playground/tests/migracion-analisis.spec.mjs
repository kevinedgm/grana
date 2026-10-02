// Verificación de la prueba de migración design/lab/migraciones/analisis/ (modal de Bootstrap reescrito con Grana),
// migrada a la API de formularios r02 (GFormLayout, GFormRow y GInputGroup para valor + unidad). Mismas comprobaciones
// que notas.md (antes manuales, solo Chromium), ahora en los tres motores: consola limpia, Esc cierra, cada línea de
// cada fila termina en el mismo borde y sus cajas comparten top (±1px), bloqueado = 0 controles editables, sin
// desborde, y el ciclo desbloquear → editar → cancelar.
import { test, expect } from '@playwright/test'

const PAGE = '/design/lab/migraciones/analisis/index.html?open=1'

const geom = () => {
  const out = []
  const BOX = ':scope > .g-input__row, :scope > .g-select__control, :scope > .g-textarea__control, :scope > .g-datepicker__field, :scope > .g-input-group__box'
  const name = (el) => el.querySelector('label, .g-datepicker__label')?.textContent.trim() || el.className.split(' ')[0]
  document.querySelectorAll('#muestra .g-form-layout').forEach((lay) => {
    const R = lay.getBoundingClientRect().right
    for (const c of lay.children) if (Math.abs(R - c.getBoundingClientRect().right) > 1) out.push(`hijo de layout fuera del borde: ${name(c)}`)
  })
  document.querySelectorAll('#muestra .g-form-row').forEach((row) => {
    if (!row.hasAttribute('data-lines')) out.push('fila sin medir')
    const R = row.getBoundingClientRect().right
    const lines = new Map()
    for (const c of row.children) { const k = c.dataset.line; if (!lines.has(k)) lines.set(k, []); lines.get(k).push(c) }
    for (const ks of lines.values()) {
      const end = Math.max(...ks.map((k) => k.getBoundingClientRect().right))
      if (Math.abs(end - R) > 1) out.push(`línea que no llega al borde: ${ks.map(name).join('|')}`)
      const tops = ks.map((k) => k.querySelector(BOX)?.getBoundingClientRect().top).filter((x) => x !== undefined)
      if (tops.length > 1 && Math.max(...tops) - Math.min(...tops) > 1) out.push(`cajas desalineadas: ${ks.map(name).join('|')}`)
    }
  })
  const body = document.querySelector('dialog[open] .g-dialog__body') || document.querySelector('dialog[open]')
  if (body && body.scrollWidth > body.clientWidth + 1) out.push('desborde del cuerpo del diálogo')
  if (document.documentElement.scrollWidth > innerWidth + 1) out.push('desborde de página')
  return out
}
// Controles con los que se puede escribir o elegir (bloqueado: ninguno)
const editable = () => [...document.querySelectorAll('#muestra input:not([type="hidden"]), #muestra textarea, #muestra select, #muestra button[aria-haspopup]')]
  .filter((el) => !el.disabled && !el.readOnly && el.getAttribute('aria-readonly') !== 'true').length

for (const [vw, scheme] of [[1280, 'light'], [1280, 'dark'], [390, 'light'], [390, 'dark']]) {
  test(`migración «Información de la muestra» a ${vw}px en ${scheme}: filas r02, bloqueo y consola limpia`, async ({ page, browserName }) => {
    const errs = []
    page.on('pageerror', (e) => errs.push(`pageerror: ${e.message}`))
    page.on('console', (m) => { if (m.type() === 'error' && !/favicon/.test(m.text())) errs.push(`console: ${m.text()}`) })
    await page.setViewportSize({ width: vw, height: 900 })
    await page.goto(`${PAGE}&theme=${scheme}`)
    const dlg = page.locator('dialog.g-dialog[open]').first()
    await expect(dlg).toBeVisible()
    await page.waitForSelector('#muestra .g-form-row[data-lines]')
    await page.evaluate(() => document.fonts.ready)
    await page.waitForTimeout(150)
    expect(await page.evaluate(geom), `${browserName} bloqueado`).toEqual([])
    expect(await page.evaluate(editable), 'bloqueado: 0 controles editables').toBe(0)
    // Valor + unidad como un solo campo: el selector en solo lectura se pinta como texto con la unidad elegida
    await expect(page.getByRole('textbox', { name: 'Volumen del lote Unidad', exact: true })).toHaveValue('L')
    // Desbloquear con el interruptor: los campos pasan a editables y las filas siguen alineadas
    await page.locator('#permitir').check()
    await expect(page.locator('#modo')).toHaveText(/Edición permitida/)
    expect(await page.evaluate(editable)).toBeGreaterThan(10)
    expect(await page.evaluate(geom), `${browserName} editando`).toEqual([])
    // editable: la marca «(opcional)» de la convención por defecto entra en el nombre (etiqueta + parte)
    await expect(page.getByRole('combobox', { name: 'Volumen del lote (opcional) Unidad', exact: true })).toHaveValue('L')
    // Editar habilita Guardar; Cancelar revierte y vuelve a bloquear
    await expect(page.locator('#guardar')).toBeDisabled()
    await page.locator('input[name="vol-lote"]').fill('900')
    await expect(page.locator('#guardar')).toBeEnabled()
    await page.locator('#cancelar').click()
    await expect(page.locator('input[name="vol-lote"]')).toHaveValue('1200')
    expect(await page.evaluate(editable)).toBe(0)
    // Esc cierra
    await page.keyboard.press('Escape')
    await expect(page.locator('dialog.g-dialog[open]')).toHaveCount(0)
    expect(errs, browserName).toEqual([])
  })
}
