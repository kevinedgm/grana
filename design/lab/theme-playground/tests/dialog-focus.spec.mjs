// Foco al abrir de GDialog sobre el COMPONENTE REAL del playground (design/contracts/dialog.md «Foco»;
// hallazgo L10 de design/lab/form-section/r01): autofocus → primer control del contenido → botón de cierre → el <dialog>.
import { test, expect } from '@playwright/test'

const PAGE = '/packages/vue/playground/index.html'
const active = (page) => page.evaluate(() => {
  const a = document.activeElement
  return a ? { tag: a.tagName, label: a.closest('.g-input')?.querySelector('label')?.textContent?.trim() || a.textContent?.trim().slice(0, 20), cls: a.className } : null
})

async function load(page) {
  await page.goto(PAGE)
  await page.waitForSelector('#sec-form, #fm-dlg-open')
  await page.evaluate(() => document.fonts.ready)
}

test.describe('GDialog · foco al abrir', () => {
  test('formulario sin autofocus: el foco cae en el primer campo, no en el <dialog>', async ({ page }) => {
    await load(page)
    await page.getByRole('button', { name: 'Formulario', exact: true }).click()
    await expect(page.locator('dialog[open]')).toHaveCount(1)
    await expect.poll(() => active(page).then((a) => a?.tag)).toBe('INPUT')
    expect((await active(page)).label).toContain('Nombre')
    // Segunda apertura: el contenido se vuelve a montar y el foco se repite
    await page.keyboard.press('Escape')
    await expect(page.locator('dialog[open]')).toHaveCount(0)
    await page.getByRole('button', { name: 'Formulario', exact: true }).click()
    await expect.poll(() => active(page).then((a) => a?.tag)).toBe('INPUT')
  })

  test('confirmación con autofocus en «Cancelar»: gana ese elemento', async ({ page }) => {
    await load(page)
    await page.getByRole('button', { name: 'Confirmación', exact: true }).click()
    await expect.poll(() => active(page).then((a) => a?.label)).toBe('Cancelar')
  })

  test('diálogo del formulario del sistema (#fm-dlg-open): el foco cae en «Nombre»', async ({ page }) => {
    await load(page)
    await page.locator('#fm-dlg-open').click()
    await expect.poll(() => active(page).then((a) => a?.tag)).toBe('INPUT')
    expect((await active(page)).label).toContain('Nombre')
  })

  test('diálogo simple con solo un botón en el pie: el foco cae en «Entendido», no en el cierre', async ({ page }) => {
    await load(page)
    await page.getByRole('button', { name: 'Simple', exact: true }).click()
    await expect.poll(() => active(page).then((a) => a?.label)).toBe('Entendido')
  })
})
