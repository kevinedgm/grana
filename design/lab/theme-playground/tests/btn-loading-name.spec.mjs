// GBtn en loading: el nombre accesible no cambia (design/contracts/btn.md). Defecto de kiwi (personalidad/r01/declaracion.md):
// `visibility: hidden` sobre .g-btn__label vaciaba el nombre en el árbol de accesibilidad de Chromium.
// Se monta el GBtn real del UMD (window.Grana) en la propia página. El árbol de accesibilidad vía CDP es solo de Chromium.
import { test, expect } from '@playwright/test'

const PAGE = '/packages/vue/playground/index.html'

const mount = async (page, props, label) => {
  await page.goto(PAGE)
  await page.waitForSelector('.g-btn')
  await page.evaluate(({ props, label }) => {
    const host = document.createElement('div')
    host.id = 'btn-name-host'
    document.body.appendChild(host)
    const { createApp, h } = window.Vue
    createApp({ render: () => h(window.Grana.GBtn, props, () => label) }).mount(host)
  }, { props, label })
  await page.waitForSelector('#btn-name-host .g-btn')
}

test.describe('GBtn loading: nombre accesible', () => {
  test.beforeEach(({ browserName }) => { test.skip(browserName !== 'chromium', 'árbol de accesibilidad por CDP: solo Chromium') })

  for (const [name, extra] of [['con loading', {}], ['con loading y loadingText', { loadingText: 'Enviando…' }]]) {
    test(`${name}: el botón conserva el nombre «Enviar informe» en el árbol de accesibilidad`, async ({ page }) => {
      await mount(page, { loading: true, ...extra }, 'Enviar informe')
      await expect(page.getByRole('button', { name: 'Enviar informe' })).toHaveCount(1)
      const client = await page.context().newCDPSession(page)
      const { nodes } = await client.send('Accessibility.getFullAXTree')
      const btn = nodes.find((n) => !n.ignored && n.role?.value === 'button' && n.name?.value === 'Enviar informe')
      expect(btn).toBeTruthy()
    })
  }

  test('con loading: la etiqueta no se ve, no recibe puntero, el ancho no cambia y el spinner sigue centrado', async ({ page }) => {
    await mount(page, { loading: false }, 'Enviar informe')
    const measure = () => page.evaluate(() => {
      const b = document.querySelector('#btn-name-host .g-btn')
      const l = b.querySelector('.g-btn__label')
      const s = b.querySelector('.g-btn__loader')
      const br = b.getBoundingClientRect(); const sr = s.getBoundingClientRect()
      const cs = getComputedStyle(l)
      return { w: br.width, h: br.height, dx: Math.abs((sr.left + sr.right) / 2 - (br.left + br.right) / 2), dy: Math.abs((sr.top + sr.bottom) / 2 - (br.top + br.bottom) / 2),
        vis: cs.visibility, op: cs.opacity, pe: cs.pointerEvents, us: cs.userSelect, loader: getComputedStyle(s).display, ariaHidden: l.closest('[aria-hidden="true"]') !== null, text: l.textContent }
    })
    const before = await measure()
    // Se vuelve a montar con loading: mismo botón, mismas medidas esperadas.
    await page.evaluate(() => { document.querySelector('#btn-name-host').remove() })
    await mount(page, { loading: true }, 'Enviar informe')
    const after = await measure()
    expect(after.w).toBeCloseTo(before.w, 1)
    expect(after.h).toBeCloseTo(before.h, 1)
    expect(after.loader).toBe('block')
    expect(after.dx).toBeLessThan(1)
    expect(after.dy).toBeLessThan(1)
    expect(after.op).toBe('0')
    expect(after.pe).toBe('none')
    expect(after.vis).toBe('visible')
    expect(after.ariaHidden).toBe(false)
    expect(after.text).toBe('Enviar informe')
  })

  test('forced-colors y reduced motion: la etiqueta sigue invisible y en el árbol accesible', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' })
    await mount(page, { loading: true }, 'Enviar informe')
    await expect(page.getByRole('button', { name: 'Enviar informe' })).toHaveCount(1)
    const op = await page.evaluate(() => getComputedStyle(document.querySelector('#btn-name-host .g-btn__label')).opacity)
    expect(op).toBe('0')
  })
})
