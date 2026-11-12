// GAppShell header="pinned-wide", barra local y cover() (design/contracts/app-shell.md «Verificación», #1055) sobre el
// COMPONENTE REAL (dist/app-shell.umd.js) en el banco packages/vue/playground/sitio.html (la barra local de 48 px se declara
// en :root por debajo de 80rem, como el sitio). Puerto propio: GRANA_PW_PORT=4241.
import { test, expect } from './vue-local.mjs'

const PAGE = '/packages/vue/playground/sitio.html'
const settle = (p) => p.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 80)))))
async function open(page, { width = 1280, height = 800, qs = '?sections=12' } = {}) {
  await page.setViewportSize({ width, height })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const errs = []
  page.on('pageerror', (e) => errs.push(e.message))
  page.on('console', (m) => { if (m.type() === 'warning' && /\[Grana /.test(m.text())) errs.push(m.text()) })
  await page.goto(`${PAGE}${qs}`)
  await page.waitForSelector('.g-app-shell')
  await settle(page)
  return errs
}
const shellTop = (page) => page.evaluate(() => parseFloat(getComputedStyle(document.querySelector('.g-app-shell')).getPropertyValue('--g-app-shell-top')))
const edge = (page) => page.evaluate(() => window.site.edge.edgeReserve('top'))

test.describe('GAppShell pinned-wide (#1055)', () => {
  for (const w of [1280, 1024]) {
    test(`${w}: banda pegada; --g-app-shell-top = banda; el borde publicado suma la barra local`, async ({ page }) => {
      const errs = await open(page, { width: w })
      await page.evaluate(() => scrollTo(0, 900))
      await settle(page)
      const band = await page.locator('.g-app-shell__header').boundingBox()
      expect(band.y).toBe(0)
      expect(await shellTop(page)).toBe(64)
      expect(await edge(page)).toBe(w >= 1280 ? 64 : 64 + 48)
      expect(errs).toEqual([])
    })
  }
  for (const w of [900, 768, 375]) {
    test(`${w}: la banda se va con la página; la cifra vale 0; el borde, solo la barra local`, async ({ page }) => {
      const errs = await open(page, { width: w })
      await page.evaluate(() => scrollTo(0, 900))
      await settle(page)
      const band = await page.locator('.g-app-shell__header').boundingBox()
      expect(band.y).toBeLessThan(0)
      expect(await shellTop(page)).toBe(0)
      expect(await edge(page)).toBe(48)
      const local = await page.locator('#local').boundingBox()
      expect(local.y).toBe(0)
      expect(errs).toEqual([])
    })
  }

  test('1024: un ancla queda bajo la barra local (Δ ≤ 1 px)', async ({ page }) => {
    await open(page, { width: 1024 })
    await page.evaluate(() => { location.hash = '#s5' })
    await page.waitForTimeout(200)
    await settle(page)
    const t = await page.evaluate(() => document.getElementById('s5').getBoundingClientRect().top)
    // El scroll-padding del chasis: banda + barra local + su base (S1)
    const base = await page.evaluate(() => parseFloat(getComputedStyle(document.querySelector('.g-app-shell')).getPropertyValue('--_app-shell-base')) || 0)
    expect(Math.abs(t - (64 + 48 + base))).toBeLessThanOrEqual(1)
  })

  test('800 × 400: presupuesto del cuarto con banda + barra local: la banda se despega', async ({ page }) => {
    await open(page, { width: 800, height: 400 })
    // Por debajo de 60rem pinned-wide ya va en el flujo; el presupuesto se comprueba en ancho con un visor bajo
    await page.setViewportSize({ width: 1024, height: 400 })
    await settle(page)
    expect(await shellTop(page)).toBe(0)
  })
})
