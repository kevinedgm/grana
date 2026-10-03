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
    // Receta de bloqueo (#266): el cambio con el interruptor lo anuncia el interruptor; la región no lo repite
    await expect(page.locator('#anuncio')).toHaveText('')
    expect(await page.evaluate(editable)).toBeGreaterThan(10)
    expect(await page.evaluate(geom), `${browserName} editando`).toEqual([])
    // editable: el nombre es etiqueta + parte; el grupo es required (e1bb124), así que sin «(opcional)»
    await expect(page.getByRole('combobox', { name: 'Volumen del lote Unidad', exact: true })).toHaveValue('L')
    // Editar habilita Guardar; Cancelar revierte y vuelve a bloquear
    await expect(page.locator('#guardar')).toBeDisabled()
    await page.locator('input[name="vol-lote"]').fill('900')
    await expect(page.locator('#guardar')).toBeEnabled()
    await page.locator('#cancelar').click()
    await expect(page.locator('input[name="vol-lote"]')).toHaveValue('1200')
    // El bloqueo por otra acción (Cancelar) va a la región `status`, y el foco vuelve al interruptor
    await expect(page.locator('#anuncio')).toHaveText('Cambios descartados. Formulario bloqueado')
    await expect(page.locator('#permitir')).toBeFocused()
    await expect(page.locator('#guardar')).toBeDisabled()
    expect(await page.evaluate(editable)).toBe(0)
    // Esc cierra
    await page.keyboard.press('Escape')
    await expect(page.locator('dialog.g-dialog[open]')).toHaveCount(0)
    expect(errs, browserName).toEqual([])
  })
}

// Receta «bloqueo con interruptor» (form.md §8, #266): confirmación al volver a bloquear con cambios, foco, anuncios y envío.
test('bloqueo con interruptor: confirmar al volver a bloquear con cambios, foco al interruptor y un solo anuncio', async ({ page, browserName }) => {
  const errs = []
  page.on('pageerror', (e) => errs.push(`pageerror: ${e.message}`))
  page.on('console', (m) => { if (m.type() === 'error' && !/favicon/.test(m.text())) errs.push(`console: ${m.text()}`) })
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto(`${PAGE}&theme=light`)
  await expect(page.locator('dialog.g-dialog[open]').first()).toBeVisible()
  // Bloqueado: los valores siguen en el envío (readonly, no disabled) y el botón de envío va deshabilitado
  await expect(page.locator('#guardar')).toBeDisabled()
  expect(await page.evaluate(() => [...document.querySelectorAll('#muestra input[name]')].filter((i) => i.disabled).length), 'ningún campo disabled').toBe(0)
  expect(await page.evaluate(() => new FormData(document.getElementById('muestra')).get('vol-lote')), `${browserName}: el valor sigue en FormData`).toBe('1200')
  // Desbloquear no mueve el foco al formulario ni marca dirty (el interruptor está fuera del <form>)
  await page.locator('#permitir').check()
  await expect(page.locator('#guardar')).toBeDisabled()
  // Con cambios, apagar el interruptor pide confirmación y el interruptor sigue encendido hasta confirmar
  await page.locator('input[name="vol-lote"]').fill('900')
  await page.locator('#permitir').click()
  await expect(page.getByRole('alertdialog', { name: '¿Descartar los cambios?' })).toBeVisible()
  await expect(page.locator('#permitir')).toBeChecked()
  await page.locator('#seguir').click()
  await expect(page.locator('input[name="vol-lote"]')).toHaveValue('900')
  await page.locator('#permitir').click()
  await page.locator('#descartar').click()
  await expect(page.locator('input[name="vol-lote"]')).toHaveValue('1200')
  await expect(page.locator('#permitir')).not.toBeChecked()
  await expect(page.locator('#permitir')).toBeFocused()
  await expect(page.locator('#anuncio')).toHaveText('Cambios descartados. Formulario bloqueado')
  // Guardar: bloquea, el foco vuelve al interruptor y el aviso (GToast) es el único anuncio
  await page.locator('#permitir').check()
  await page.locator('input[name="vol-lote"]').fill('950')
  await page.locator('#guardar').click()
  await expect(page.locator('#permitir')).not.toBeChecked()
  await expect(page.locator('#permitir')).toBeFocused()
  await expect(page.locator('#anuncio')).toHaveText('')
  await expect(page.locator('input[name="vol-lote"]')).toHaveValue('950')
  expect(errs, browserName).toEqual([])
})
