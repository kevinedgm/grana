// GSidebar appearance="index" y grupos plegables (sidebar.md §«Apariencia `index`», §«Grupos plegables», §«La marca del
// actual»; #1060 a #1069) sobre el COMPONENTE REAL en packages/vue/playground/sidebar-index.html, con la extensión
// @grana/vue/sidebar-index y sin ella (?ext=0). Un proceso por puerto:
// GRANA_PW_PORT=4243 (bruno). El rendimiento con 500 destinos, solo con --workers=1.
import { test, expect } from '@playwright/test'

const PAGE = '/packages/vue/playground/sidebar-index.html'
const settle = (p, ms = 40) => p.evaluate((ms) => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, ms)))), ms)
async function open(page, { width = 1280, height = 900, qs = '' } = {}) {
  await page.setViewportSize({ width, height })
  await page.goto(PAGE + qs)
  await page.waitForSelector('.g-sidebar__nav', { state: 'attached' })
  await settle(page, 120)
}
const grp = (page, label) => page.locator('button.g-sidebar__group-title', { hasText: label })
// Centro de la marca y de su fila destino, en px de pantalla
const markVsRow = (page, sel) => page.evaluate((sel) => {
  const nav = [...document.querySelectorAll('.g-sidebar__nav')].find((n) => n.getClientRects().length)
  const m = nav.querySelector('.g-sidebar__mark').getBoundingClientRect()
  const r = nav.querySelector(sel).getBoundingClientRect()
  return { m: m.top + m.height / 2, r: r.top + r.height / 2, cls: nav.querySelector('.g-sidebar__mark').className }
}, sel)

test.describe('GSidebar · appearance="index"', () => {
  test('marca llena en el actual, hueca al plegar su grupo y de vuelta al desplegar; has-mark', async ({ page }) => {
    const errs = []
    page.on('pageerror', (e) => errs.push(e.message))
    await open(page)
    await expect(page.locator('.g-sidebar__nav')).toHaveClass(/has-mark/)
    let v = await markVsRow(page, '[aria-current="page"]')
    expect(v.cls).toContain('is-full')
    expect(Math.abs(v.m - v.r)).toBeLessThanOrEqual(1)
    await grp(page, 'Selección').click()
    await settle(page, 450)
    v = await markVsRow(page, '.g-sidebar__group.has-current > .g-sidebar__group-title')
    expect(v.cls).toContain('is-hollow')
    expect(Math.abs(v.m - v.r)).toBeLessThanOrEqual(1)
    await expect(grp(page, 'Selección')).toContainText('contiene la página actual')
    await grp(page, 'Selección').click()
    await settle(page, 450)
    v = await markVsRow(page, '[aria-current="page"]')
    expect(v.cls).toContain('is-full')
    expect(Math.abs(v.m - v.r)).toBeLessThanOrEqual(1)
    expect(errs).toEqual([])
  })

  test('la marca viaja al cambiar el actual: a mitad no está en el destino, al final ±1 px', async ({ page }) => {
    await open(page)
    await page.locator('[data-id="c3"]').click()
    await page.waitForTimeout(60)
    const mid = await markVsRow(page, '[data-id="c3"]')
    expect(Math.abs(mid.m - mid.r)).toBeGreaterThan(2)
    await settle(page, 450)
    const end = await markVsRow(page, '[data-id="c3"]')
    expect(Math.abs(end.m - end.r)).toBeLessThanOrEqual(1)
  })

  test('plegar un grupo de arriba: la marca se recoloca al asentar en la fila del actual', async ({ page }) => {
    await open(page)
    await grp(page, 'Estructura de página').click()
    await settle(page, 500)
    const v = await markVsRow(page, '[aria-current="page"]')
    expect(v.cls).toContain('is-full')
    expect(Math.abs(v.m - v.r)).toBeLessThanOrEqual(1)
  })

  test('plegar con clic, Intro y Espacio; hidden="until-found" en el envoltorio al asentar', async ({ page }) => {
    await open(page)
    const b = grp(page, 'Datos')
    await b.click()
    await settle(page, 450)
    await expect(b).toHaveAttribute('aria-expanded', 'false')
    const bid = await b.getAttribute('aria-controls')
    await expect(page.locator(`#${bid}`)).toHaveAttribute('hidden', 'until-found')
    await b.focus()
    await page.keyboard.press('Enter')
    await expect(b).toHaveAttribute('aria-expanded', 'true')
    await page.keyboard.press('Space')
    await expect(b).toHaveAttribute('aria-expanded', 'false')
  })

  test('↑ ↓ recorren los botones de grupo; Tab no para en la región (#570)', async ({ page }) => {
    await open(page)
    await page.locator('[data-id="theme"]').focus()
    await page.keyboard.press('ArrowDown')
    await expect(grp(page, 'Estructura de página')).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect(page.locator('[data-id="c1"]')).toBeFocused()
    await page.keyboard.press('ArrowUp')
    await page.keyboard.press('ArrowUp')
    await expect(page.locator('[data-id="theme"]')).toBeFocused()
    await page.locator('.g-sidebar__filter-input').focus()
    await page.keyboard.press('Tab')
    const tag = await page.evaluate(() => document.activeElement.className)
    expect(tag).not.toContain('g-sidebar__nav')
  })

  test('filtro: «/» enfoca, el grupo plegado se abre con aria-disabled y vuelve al vaciar; recuento oculto vacío', async ({ page }) => {
    await open(page)
    await grp(page, 'Acciones y navegación').click()
    await settle(page, 450)
    const count = page.locator('.g-sidebar__filter-count')
    const visibleCount = () => count.evaluate((n) => n.getBoundingClientRect().width > 2)
    expect(await visibleCount()).toBe(false)
    await page.locator('main').click()
    await page.keyboard.press('/')
    await expect(page.locator('.g-sidebar__filter-input')).toBeFocused()
    await page.keyboard.type('gtabs')
    await settle(page)
    await expect(grp(page, 'Acciones y navegación')).toHaveAttribute('aria-expanded', 'true')
    await expect(grp(page, 'Acciones y navegación')).toHaveAttribute('aria-disabled', 'true')
    expect(await visibleCount()).toBe(true)
    await page.keyboard.press('Escape')
    await settle(page)
    await expect(grp(page, 'Acciones y navegación')).toHaveAttribute('aria-expanded', 'false')
    expect(await page.evaluate(() => window.sbx.events.filter((e) => e.startsWith('closedGroups')).length)).toBe(1)
  })

  test('cajón: el actual a la vista al abrir; la raíz interna con la clase de apariencia', async ({ page }) => {
    await open(page, { width: 768, height: 700, qs: '?current=c70' })
    await page.locator('#menu').click()
    await settle(page)
    const inner = page.locator('.g-sidebar__drawer > .g-sidebar')
    await expect(inner).toHaveClass(/g-sidebar--appearance-index/)
    const vis = await page.evaluate(() => {
      const d = document.querySelector('.g-sidebar__drawer')
      const nav = d.querySelector('.g-sidebar__nav')
      const a = nav.querySelector('[aria-current="page"]').getBoundingClientRect()
      const n = nav.getBoundingClientRect()
      return a.top >= n.top && a.bottom <= n.bottom
    })
    expect(vis).toBe(true)
  })
})

test.describe('GSidebar · sin la extensión (#1069)', () => {
  test('index se pinta default; los grupos collapsible quedan fijos y abiertos (collapsed ignorado)', async ({ page }) => {
    const errs = []
    page.on('pageerror', (e) => errs.push(e.message))
    await open(page, { qs: '?ext=0&collapsed=g2' })
    await expect(page.locator('.g-sidebar').first()).toHaveClass(/g-sidebar--appearance-default/)
    expect(await page.locator('button.g-sidebar__group-title').count()).toBe(0)
    expect(await page.locator('.g-sidebar__mark').count()).toBe(0)
    await expect(page.locator('[data-id="c12"]')).toBeVisible()
    expect(errs).toEqual([])
  })
})

test.describe('GSidebar · index · rendimiento', () => {
  test('500 destinos: cambiar el actual y plegar sin tareas largas (< 50 ms)', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'PerformanceObserver longtask solo en Chromium')
    await open(page, { qs: '?n=500&current=c250' })
    // La primera interacción de la página cuesta ≈ 130 ms también sin index (medido en page-index.html?n=500): se calienta
    await page.locator('[data-id="c255"]').click()
    await settle(page, 450)
    await page.evaluate(() => { window.__lt = []; new PerformanceObserver((l) => window.__lt.push(...l.getEntries().map((e) => e.duration))).observe({ type: 'longtask', buffered: false }) })
    await page.locator('[data-id="c260"]').click()
    await settle(page, 450)
    await grp(page, 'Datos').click()
    await settle(page, 450)
    await grp(page, 'Datos').click()
    await settle(page, 450)
    const lt = await page.evaluate(() => window.__lt)
    expect(Math.max(0, ...lt)).toBeLessThan(50)
  })
})
