// GDialog apilado sobre el COMPONENTE REAL (dist/) en la página que reproduce los fallos medidos por kiwi:
// design/lab/dialog/r02/index.html?c=hoy (cinco GDialog anidados, cada uno con su GForm). Hallazgos L1 a L4 de
// design/lab/dialog/r02/declaracion.md: GForm cortado por el diálogo, Esc mantenida, un solo fondo (is-stacked), fondo
// que no cierra desde el nivel 2.
import { test, expect } from '@playwright/test'

const PAGE = '/design/lab/dialog/r02/index.html?c=hoy'
const openLevels = (page) => page.evaluate(() => window.__r02.today.hoy.filter(Boolean).length)

async function openFive(page) {
  await page.goto(PAGE)
  await page.waitForSelector('#hoy-open')
  await page.click('#hoy-open')
  await expect(page.locator('#hoy-d1[open]')).toHaveCount(1)
  for (const i of [1, 2, 3, 4]) {
    await page.click('#hoy-b' + i)
    await expect(page.locator(`#hoy-d${i + 1}[open]`)).toHaveCount(1)
  }
  await expect.poll(() => openLevels(page)).toBe(5)
}

test.describe('GDialog apilado (r02, hoy)', () => {
  test('L3: is-stacked en los niveles 2 a 5, nunca en el 1; se recalcula al cerrar niveles', async ({ page }) => {
    await openFive(page)
    const stacked = () => page.evaluate(() => [1, 2, 3, 4, 5].map((i) => document.getElementById('hoy-d' + i).classList.contains('is-stacked')))
    expect(await stacked()).toEqual([false, true, true, true, true])
    await page.keyboard.press('Escape')
    await expect.poll(() => openLevels(page)).toBe(4)
    // El que salió conserva la suya durante la salida; los abiertos no cambian
    expect((await stacked()).slice(0, 4)).toEqual([false, true, true, true])
    await page.click('#hoy-b4')
    await expect.poll(() => openLevels(page)).toBe(5)
    expect(await stacked()).toEqual([false, true, true, true, true])
  })

  test('L1: el GForm del nivel 5 es un <form> propio; su botón envía solo ese formulario', async ({ page }) => {
    await openFive(page)
    await page.fill('#hoy-cat', 'Reactivos')
    const owner = await page.evaluate(() => {
      const b = document.getElementById('hoy-save5')
      return { tag: document.getElementById('hoy-f5').tagName, owner: b.form && b.form.id }
    })
    expect(owner).toEqual({ tag: 'FORM', owner: 'hoy-f5' })
    await page.click('#hoy-save5')
    await expect.poll(() => page.evaluate(() => window.__r02.today.subs.categoria)).toBe(1)
    const t = await page.evaluate(() => ({ subs: { ...window.__r02.today.subs }, inval: { ...window.__r02.today.inval } }))
    expect(t.subs.ingreso).toBe(0)
    expect(t.subs.partida).toBe(0)
    expect(t.subs.producto).toBe(0)
    expect(Object.values(t.inval).every((n) => n === 0)).toBe(true)
  })

  test('L2: la Esc mantenida baja un solo nivel', async ({ page }) => {
    await openFive(page)
    await page.keyboard.down('Escape')
    for (let i = 0; i < 6; i++) await page.keyboard.down('Escape') // repeat: true
    await page.keyboard.up('Escape')
    await page.waitForTimeout(400)
    expect(await openLevels(page)).toBe(4)
    // Una pulsación nueva sí baja otro
    await page.keyboard.press('Escape')
    await expect.poll(() => openLevels(page)).toBe(3)
  })

  test('L4: con otro modal debajo, el clic en el fondo no cierra; en el nivel 1 sí', async ({ page }) => {
    await openFive(page)
    await page.mouse.click(4, 4)
    await page.waitForTimeout(300)
    expect(await openLevels(page)).toBe(5)
    await page.evaluate(() => { const h = window.__r02.today.hoy; h.splice(1, 4, false, false, false, false) })
    await expect.poll(() => openLevels(page)).toBe(1)
    await page.waitForTimeout(400)
    expect(await page.evaluate(() => document.getElementById('hoy-d1').classList.contains('is-stacked'))).toBe(false)
    await page.mouse.click(4, 4)
    await expect.poll(() => openLevels(page)).toBe(0)
  })
})
