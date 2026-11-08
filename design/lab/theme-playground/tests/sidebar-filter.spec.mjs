// GSidebar · filtro del índice y código del item (design/contracts/sidebar.md §«Filtro del índice», §«Código del item»;
// #1035, #1036) sobre el COMPONENTE REAL en el banco packages/vue/playground/page-index.html. Rendimiento con 500 destinos
// (< 16 ms por tecla, --workers=1). Un solo proceso por puerto: GRANA_PW_PORT=4233 (bruno del marco del sitio).
import { test, expect } from '@playwright/test'

const PAGE = '/packages/vue/playground/page-index.html'
const settle = (p) => p.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 40)))))
async function open(page, { width = 1280, height = 900, qs = '' } = {}) {
  await page.setViewportSize({ width, height })
  await page.goto(PAGE + qs)
  await page.waitForSelector('.g-sidebar__filter-input, .g-sidebar__search', { state: 'attached' })
  await settle(page)
}
const field = (page) => page.locator('.g-sidebar__filter-input:visible')
const visible = (page) => page.evaluate(() => [...document.querySelectorAll('.g-sidebar__nav .g-sidebar__link')].filter((a) => !a.closest('[hidden]') && a.getClientRects().length).map((a) => a.dataset.id))

test.describe('GSidebar · filtro del índice', () => {
  test('«/» enfoca el campo (atajo de la aplicación con focusFilter), «24» deja solo el 24 e Intro lo activa', async ({ page }) => {
    const errs = []
    page.on('pageerror', (e) => errs.push(e.message))
    await open(page)
    await page.locator('body').click({ position: { x: 900, y: 600 } })
    await page.keyboard.press('/')
    await expect(field(page)).toBeFocused()
    await page.keyboard.type('24')
    await settle(page)
    expect(await visible(page)).toEqual(['c24'])
    await expect(page.locator('.g-sidebar__filter-count')).toHaveText('1 de 34 páginas')
    await page.keyboard.press('Enter')
    await settle(page)
    expect(await page.evaluate(() => window.pi.events.at(-1))).toBe('sidebar · c24')
    expect(errs).toEqual([])
  })

  test('el código va al principio del nombre accesible y se pinta en el asiento', async ({ page }) => {
    await open(page)
    await expect(page.getByRole('link', { name: '24 GSelect 3', exact: true })).toHaveCount(1)
    await expect(page.locator('[data-id="c24"] .g-sidebar__icon')).toHaveAttribute('data-code', '24')
  })

  test('texto sin acentos, grupos vacíos ocultos, ↓ a la lista y ↑ de vuelta, Esc vacía', async ({ page }) => {
    await open(page)
    await field(page).fill('TEMATIZACION')
    await settle(page)
    expect(await visible(page)).toEqual(['theme'])
    expect(await page.locator('.g-sidebar__group:not([hidden])').count()).toBe(1)
    await field(page).press('ArrowDown')
    await expect(page.locator('[data-id="theme"]')).toBeFocused()
    await page.keyboard.press('ArrowUp')
    await expect(field(page)).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(field(page)).toHaveValue('')
    await expect(field(page)).toBeFocused()
    expect((await visible(page)).length).toBeGreaterThan(30)
  })

  test('el campo no se mueve: la caja y el recuento miden lo mismo vacíos, con texto y sin coincidencias', async ({ page }) => {
    await open(page)
    const box = () => page.evaluate(() => {
      const b = document.querySelector('.g-sidebar__filter-box').getBoundingClientRect()
      const c = document.querySelector('.g-sidebar__filter-count').getBoundingClientRect()
      return [b.top, b.height, c.height].map((x) => x.toFixed(1)).join()
    })
    const a = await box()
    await field(page).fill('gc')
    await settle(page)
    const b = await box()
    await field(page).fill('zzz')
    await settle(page)
    expect([await box(), b]).toEqual([a, a])
    await expect(page.locator('.g-sidebar__filter-count')).toHaveClass(/is-empty/)
  })

  test('padres: un hijo que coincide abre su rama; al vaciar vuelve a cerrarse', async ({ page }) => {
    await open(page)
    await field(page).fill('facetas')
    await settle(page)
    expect(await visible(page)).toEqual(['rl', 'rl-facetas'])
    await expect(page.locator('[data-id="rl"]')).toHaveAttribute('aria-expanded', 'true')
    await field(page).fill('')
    await settle(page)
    await expect(page.locator('[data-id="rl"]')).toHaveAttribute('aria-expanded', 'false')
  })

  test('drawer: Esc con texto vacía y no cierra; vacío, cierra', async ({ page }) => {
    await open(page, { width: 600, qs: '?mode=drawer' })
    await page.keyboard.press('/')
    await expect(field(page)).toBeFocused()
    await page.keyboard.type('gb')
    await page.keyboard.press('Escape')
    await expect(field(page)).toHaveValue('')
    expect(await page.evaluate(() => document.querySelector('.g-sidebar__drawer').open)).toBe(true)
    await page.keyboard.press('Escape')
    await settle(page)
    expect(await page.evaluate(() => document.querySelector('.g-sidebar__drawer').open)).toBe(false)
  })

  test('riel: la consulta se conserva, el botón lleva is-filtering y, al activarlo, expande y enfoca el campo', async ({ page }) => {
    await open(page, { qs: '?mode=rail' })
    await page.evaluate(() => { window.piApp.query = 'gc' })
    await settle(page)
    const b = page.locator('.g-sidebar__search')
    await expect(b).toHaveClass(/is-filtering/)
    await expect(b).toHaveAccessibleName(/^Filtrar el índice\s?, 6 de 34 páginas$/)
    expect(await visible(page)).toEqual(['c5', 'c8', 'c15', 'c18', 'c25', 'c28'])
    await b.click()
    await settle(page)
    await expect(field(page)).toBeFocused()
    await expect(field(page)).toHaveValue('gc')
  })
})

test.describe('GSidebar · filtro · rendimiento', () => {
  // La compuerta es el trabajo de la tecla (filtrar + parchear el DOM, sin lecturas de caja). El estilo y la disposición del
  // navegador al volver a mostrar cientos de filas se registran aparte: dependen del CSS (hallazgo para coco)
  test('500 destinos: < 16 ms por tecla, sin desmontar', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'la compuerta de rendimiento es de Chromium (sidebar.md «Rendimiento»)')
    // Vue de producción (el banco carga la de desarrollo, mucho más lenta en cada render)
    await page.route('**/vue.global.js', (r) => r.continue({ url: r.request().url().replace('vue.global.js', 'vue.global.prod.js') }))
    await open(page, { qs: '?n=500' })
    const r = await page.evaluate(async () => {
      const input = document.querySelector('.g-sidebar__filter-input')
      const first = document.querySelector('.g-sidebar__nav .g-sidebar__item')
      const times = []
      const layout = []
      for (const q of ['g', 'gs', 'gse', 'gsel', 'gse', 'gs', 'g', '', '2', '24', '2', '', 'tok', '']) {
        const t0 = performance.now()
        input.value = q
        input.dispatchEvent(new Event('input', { bubbles: true }))
        await Vue.nextTick()
        const t1 = performance.now()
        void document.body.offsetHeight // estilo y disposición del navegador, aparte (se registran, no se exigen)
        times.push(t1 - t0)
        layout.push(performance.now() - t1)
        await new Promise((res) => requestAnimationFrame(() => setTimeout(res, 0)))
      }
      return { times, layout, same: first === document.querySelector('.g-sidebar__nav .g-sidebar__item'), total: document.querySelector('.g-sidebar__filter-count').textContent }
    })
    console.log('ms por tecla (JS + parche):', r.times.map((t) => t.toFixed(1)).join(' '))
    console.log('ms de estilo y disposición:', r.layout.map((t) => t.toFixed(1)).join(' '))
    expect(r.same).toBe(true)
    expect(r.total).toBe('504 de 504 páginas')
    expect(Math.max(...r.times)).toBeLessThan(16)
  })
})
