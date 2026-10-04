// GForm · el revelado por blur no mueve lo que se está pulsando (form.md «Momento de los errores», DECISIONS.md #326;
// hallazgo L7 de design/lab/alert/r01/). Sobre el COMPONENTE REAL del playground (formulario corto «Contacto», #fm-short).
// Defecto medido por kiwi: con un campo editado e inválido, pulsar «Enviar» hacía aparecer el mensaje del campo entre
// mousedown y mouseup; el botón se desplazaba bajo el puntero y el clic se perdía. Regla: desde el pointerdown hasta el
// pointerup el revelado se aplaza y se aplica después del click (WCAG 2.5.2). Este spec FALLA sin el arreglo.
import { test, expect } from '@playwright/test'

const PAGE = '/packages/vue/playground/index.html'

async function open(page) {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(PAGE)
  await page.waitForSelector('#fm-short')
  await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' })
  await page.evaluate(() => document.fonts.ready)
  await page.locator('#fm-short').scrollIntoViewIfNeeded()
  // Cuenta los envíos nativos del formulario (GForm siempre los cancela y emite submit o invalid)
  await page.evaluate(() => {
    window.__submits = 0
    document.getElementById('fm-short').addEventListener('submit', () => { window.__submits++ })
  })
}
const box = (page, sel) => page.evaluate((s) => {
  const r = document.querySelector(s).getBoundingClientRect()
  return [r.left, r.top, r.width, r.height].map((v) => Math.round(v * 100) / 100)
}, sel)
const SUBMIT = '#fm-short button[type="submit"]'
const message = (page) => page.locator('#fs-nombre-message')

// Deja «Nombre» editado e inválido con el foco dentro: escribe y borra (el error existe, aún sin revelar)
async function editInvalid(page) {
  await page.click('#fs-nombre')
  await page.fill('#fs-nombre', 'a')
  await page.fill('#fs-nombre', '')
  expect(await page.evaluate(() => document.activeElement.id)).toBe('fs-nombre')
  await expect(message(page)).toHaveText('')
}

test.describe('GForm · revelado por blur aplazado durante la pulsación (#326)', () => {
  test('mouse.down sobre «Enviar»: la caja del botón no cambia hasta mouse.up, el mensaje aparece después y el envío ocurre una vez', async ({ page }) => {
    await open(page)
    await editInvalid(page)
    await page.locator(SUBMIT).scrollIntoViewIfNeeded()
    const before = await box(page, SUBMIT)
    // Junto al borde superior del botón: sin el arreglo, el mensaje lo empuja hacia abajo y el puntero queda fuera
    const x = before[0] + before[2] / 2
    const y = before[1] + 3
    await page.mouse.move(x, y)
    await page.mouse.down()
    await page.waitForTimeout(120) // tiempo de sobra para que un revelado inmediato se pinte
    expect(await box(page, SUBMIT), 'el botón no se mueve entre apretar y soltar').toEqual(before)
    await expect(message(page), 'el mensaje no se pinta durante la pulsación').toHaveText('')
    expect(await page.evaluate(() => document.getElementById('fs-nombre').getAttribute('aria-invalid'))).toBeNull()
    await page.mouse.up()
    // El clic llegó al botón: un envío (y, como hay errores, GForm emite invalid y revela todos)
    await expect.poll(() => page.evaluate(() => window.__submits)).toBe(1)
    await expect(message(page)).toContainText('Escribe')
    await expect(page.locator('#fm-short-log')).toContainText('invalid')
    await page.waitForTimeout(100)
    expect(await page.evaluate(() => window.__submits), 'el envío ocurre una sola vez').toBe(1)
  })

  test('si el destino es otro control, el mensaje aparece al soltar (una tarea después del click)', async ({ page }) => {
    await open(page)
    await editInvalid(page)
    const b = await page.locator('#fs-com').boundingBox()
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2)
    await page.mouse.down()
    await page.waitForTimeout(120)
    await expect(message(page)).toHaveText('')
    await page.mouse.up()
    await expect(message(page)).toContainText('Escribe')
    expect(await page.evaluate(() => window.__submits)).toBe(0)
  })

  test('teclado: salir del campo con Tab revela en el acto (sin cambios)', async ({ page }) => {
    await open(page)
    await editInvalid(page)
    await page.keyboard.press('Tab')
    await expect(message(page)).toContainText('Escribe')
  })
})
