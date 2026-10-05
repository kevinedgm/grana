// GBtn de solo icono (y de texto) dentro de un contenedor flex estrecho: no baja del mínimo de 24px de área táctil.
// Hallazgo L23 de kiwi (file-field/r02): xs de icono se encogía a 21,5px. Se monta el GBtn real del UMD (window.Grana).
import { test, expect } from '@playwright/test'

const PAGE = '/packages/vue/playground/index.html'

const measure = async (page, props, label) => {
  await page.goto(PAGE)
  await page.waitForSelector('.g-btn')
  return page.evaluate(({ props, label }) => {
    const host = document.createElement('div')
    host.id = 'flex-host'
    // Contenedor flex más estrecho que sus hijos: fuerza el encogimiento. El segundo hijo ocupa el espacio.
    host.style.cssText = 'display:flex;inline-size:60px;position:fixed;inset-block-start:0;inset-inline-start:0'
    const grow = document.createElement('span')
    grow.style.cssText = 'flex:none;inline-size:200px'
    const slot = document.createElement('span')
    slot.style.display = 'contents'
    host.append(grow, slot)
    document.body.appendChild(host)
    const { createApp, h } = window.Vue
    createApp({ render: () => h(window.Grana.GBtn, props, () => label) }).mount(slot)
    const b = host.querySelector('.g-btn')
    const r = b.getBoundingClientRect()
    return { w: r.width, h: r.height }
  }, { props, label })
}

test.describe('GBtn dentro de un contenedor flex estrecho', () => {
  test.beforeEach(({ browserName }) => { test.skip(browserName !== 'chromium', 'medición en Chromium') })
  for (const size of ['xs', 'sm', 'md', 'lg']) {
    test(`solo icono ${size}: ancho y alto >= 24px`, async ({ page }) => {
      const m = await measure(page, { icon: true, size, 'aria-label': 'Quitar' }, 'x')
      expect(m.w).toBeGreaterThanOrEqual(24)
      expect(m.h).toBeGreaterThanOrEqual(24)
    })
  }
  test('con texto: no baja de 24px de ancho', async ({ page }) => {
    const m = await measure(page, { size: 'xs' }, 'OK')
    expect(m.w).toBeGreaterThanOrEqual(24)
  })
})
