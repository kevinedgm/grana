// GPageIndex appearance="list" y fold (design/contracts/page-index.md «Forma list» y «Verificación»; #1054) sobre el
// COMPONENTE REAL (dist/page-index.umd.js + la extensión dist/page-index-list.umd.js) en el banco
// packages/vue/playground/sitio.html: la columna derecha (≥ 80rem) y la plegada en una barra local pegada (< 80rem), dos
// instancias con el mismo v-model (PI-L5). Puerto propio: GRANA_PW_PORT=4241. El rendimiento, con --workers=1.
import { test, expect } from './vue-local.mjs'

const PAGE = '/packages/vue/playground/sitio.html'

function watchConsole(page) {
  const errs = []
  page.on('pageerror', (e) => errs.push(`pageerror: ${e.message}`))
  page.on('console', (m) => {
    const t = m.text()
    if (m.type() === 'error' && !/favicon/.test(t)) errs.push(`console: ${t}`)
    else if (m.type() === 'warning' && /\[Vue warn\]|\[Grana /.test(t)) errs.push(`warning: ${t}`)
  })
  return errs
}
const settle = (p) => p.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 80)))))
async function open(page, { width = 1280, height = 800, qs = '', motion = 'reduce' } = {}) {
  await page.setViewportSize({ width, height })
  await page.emulateMedia({ reducedMotion: motion })
  const errs = watchConsole(page)
  await page.goto(`${PAGE}${qs}`)
  await page.waitForSelector('#pi-list', { state: 'attached' })
  await settle(page)
  return errs
}
const current = (page, sel = '#pi-list') => page.evaluate((s) => [...document.querySelectorAll(`${s} [aria-current]`)].map((a) => a.textContent), sel)
async function scrollToSection(page, id) {
  await page.evaluate((i) => { const el = document.getElementById(i); scrollTo(0, el.getBoundingClientRect().top + scrollY - 90) }, id)
  await page.waitForTimeout(150)
  await settle(page)
}
// Centro del marcador frente al centro de la fila actual (en px de la página)
const markerOff = (page) => page.evaluate(() => {
  const m = document.querySelector('#pi-list .g-page-index__marker').getBoundingClientRect()
  const a = document.querySelector('#pi-list [aria-current]').getBoundingClientRect()
  return Math.abs((m.top + m.height / 2) - (a.top + a.height / 2))
})

test.describe('GPageIndex list · la columna (≥ 80rem)', () => {
  test('cuatro posiciones de lectura: una sola actual, marcador centrado (±1,5 px), sin avisos', async ({ page }) => {
    const errs = await open(page, { qs: '?sections=12' })
    for (const [id, label] of [['s2', 'Opciones'], ['s4a', 'Teclado · detalle'], ['s7', 'Eventos'], ['s10b', 'Tokens · casos límite con un título largo que no cabe']]) {
      await scrollToSection(page, id)
      expect(await current(page)).toEqual([label])
      await expect(page.locator('#pi-list')).toHaveClass(/has-current/)
      expect(await markerOff(page)).toBeLessThanOrEqual(1.5)
    }
    expect(errs).toEqual([])
  })

  test('al final, la última visible; elegir una del final se sostiene; la rueda reanuda la lectura', async ({ page }) => {
    await open(page, { qs: '?sections=12' })
    await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight))
    await page.waitForTimeout(150)
    await settle(page)
    const last = await current(page)
    expect(last).toHaveLength(1)
    await page.evaluate(() => scrollTo(0, 0))
    await settle(page)
    const link = page.locator('#pi-list .g-page-index__link', { hasText: 'Slots · detalle' })
    await link.scrollIntoViewIfNeeded()
    await link.click()
    await page.waitForTimeout(400)
    await settle(page)
    expect(await current(page)).toEqual(['Slots · detalle'])
    expect(await page.evaluate(() => document.activeElement.id)).toBe('s8a')
    await page.mouse.move(600, 400)
    await page.mouse.wheel(0, 900)
    await page.waitForTimeout(300)
    await settle(page)
    expect(await current(page)).not.toEqual(['Slots · detalle'])
  })

  test('PI-P1: la columna trae la actual a la vista sin mover la página; con el puntero encima se detiene', async ({ page }) => {
    await open(page, { qs: '?sections=30', height: 700 })
    const sc = '#pi-list .g-page-index__scroll'
    const inView = () => page.evaluate((s) => {
      const box = document.querySelector(s).getBoundingClientRect()
      const a = document.querySelector('#pi-list [aria-current]').getBoundingClientRect()
      return a.top >= box.top - 1 && a.bottom <= box.bottom + 1
    }, sc)
    for (const id of ['s12', 's20b', 's29']) {
      await scrollToSection(page, id)
      const y = await page.evaluate(() => scrollY)
      await page.waitForTimeout(200)
      await settle(page)
      expect(await inView()).toBe(true)
      expect(await page.evaluate(() => scrollY)).toBe(y)
    }
    // Con el puntero sobre la columna, la columna no se mueve sola
    await page.locator(sc).hover()
    const before = await page.evaluate((s) => document.querySelector(s).scrollTop, sc)
    await page.evaluate(() => { const el = document.getElementById('s3'); scrollTo(0, el.getBoundingClientRect().top + scrollY - 90) })
    await page.waitForTimeout(300)
    await settle(page)
    expect(await current(page)).toEqual(['Datos'])
    expect(await page.evaluate((s) => document.querySelector(s).scrollTop, sc)).toBe(before)
  })

  test('PI-L5: la plegada oculta no disputa la actual (mismo v-model)', async ({ page }) => {
    await open(page, { qs: '?sections=12' })
    await page.locator('#pi-list .g-page-index__link', { hasText: 'Props' }).first().click()
    await page.waitForTimeout(300)
    await settle(page)
    expect(await current(page)).toEqual(['Props'])
    expect(await current(page, '#pi-fold')).toEqual(['Props'])
  })
})

test.describe('GPageIndex list · plegada (< 80rem)', () => {
  for (const w of [1024, 375]) {
    test(`${w}: el panel dentro del visor, «Volver arriba» primero, elegir lleva el destino bajo lo pegado`, async ({ page }) => {
      const errs = await open(page, { width: w, qs: '?sections=12' })
      expect(await page.evaluate(() => document.querySelector('#pi-list').getClientRects().length)).toBe(0)
      const btn = page.locator('#pi-fold-fold')
      await btn.click()
      await expect(btn).toHaveAttribute('aria-expanded', 'true')
      const drop = await page.locator('#pi-fold-drop').boundingBox()
      expect(drop.x).toBeGreaterThanOrEqual(0)
      expect(drop.x + drop.width).toBeLessThanOrEqual(w + 0.5)
      expect(await page.evaluate(() => document.querySelector('#pi-fold-drop').firstElementChild.className)).toBe('g-page-index__top')
      await page.locator('#pi-fold .g-page-index__link', { hasText: 'Eventos' }).first().click()
      await page.waitForTimeout(400)
      await settle(page)
      await expect(btn).toHaveAttribute('aria-expanded', 'false')
      const t = await page.evaluate(() => document.getElementById('s7').getBoundingClientRect().top)
      const local = await page.locator('#local').boundingBox()
      expect(t).toBeGreaterThanOrEqual(local.y + local.height - 1)
      expect(await page.evaluate(() => document.activeElement.id)).toBe('s7')
      expect(errs).toEqual([])
    })
  }

  test('Esc cierra y devuelve el foco; «Volver arriba» sube y enfoca el h1', async ({ page, browserName }) => {
    await open(page, { width: 1024, qs: '?sections=12' })
    await page.evaluate(() => scrollTo(0, 2000))
    const btn = page.locator('#pi-fold-fold')
    await btn.focus()
    await page.keyboard.press('Enter')
    await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab') // WebKit no lleva el Tab a los enlaces
    await page.keyboard.press('Escape')
    await expect(btn).toHaveAttribute('aria-expanded', 'false')
    expect(await page.evaluate(() => document.activeElement.id)).toBe('pi-fold-fold')
    await page.keyboard.press('Enter')
    await page.locator('#pi-fold .g-page-index__top').click()
    await page.waitForTimeout(200)
    expect(await page.evaluate(() => scrollY)).toBe(0)
    expect(await page.evaluate(() => document.activeElement.id)).toBe('top-title')
  })
})

test.describe('GPageIndex list · táctil', () => {
  test.use({ hasTouch: true })
  test('pointer: coarse: botón de la plegada y filas ≥ 44', async ({ page }) => {
    await open(page, { width: 375 })
    const b = await page.locator('#pi-fold-fold').boundingBox()
    expect(b.height).toBeGreaterThanOrEqual(44)
    await page.locator('#pi-fold-fold').tap()
    const r = await page.locator('#pi-fold .g-page-index__link').first().boundingBox()
    expect(r.height).toBeGreaterThanOrEqual(44)
  })
})

test.describe('GPageIndex list · rendimiento (--workers=1)', () => {
  test('200 secciones: desplazar la página entera sin tareas ≥ 50 ms', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'longtask solo en Chromium')
    await open(page, { qs: '?sections=67', motion: 'no-preference' }) // 67 × 3 = 201 secciones
    await page.waitForTimeout(800)
    // La primera rueda cuesta ≈ 100 ms en Chromium sin pantalla con o sin la extensión (también con 3 secciones): se calienta
    await page.mouse.move(600, 400)
    await page.mouse.wheel(0, 10)
    await page.waitForTimeout(300)
    await page.evaluate(() => { window.__long = []; new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__long.push(e.duration) }).observe({ type: 'longtask', buffered: false }) })
    await page.mouse.move(600, 400)
    for (let i = 0; i < 40; i++) { await page.mouse.wheel(0, 700); await page.waitForTimeout(30) }
    await settle(page)
    expect(await page.evaluate(() => window.__long.filter((d) => d >= 50))).toEqual([])
  })
})
