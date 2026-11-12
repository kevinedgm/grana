// GNavBar (design/contracts/nav-bar.md «Verificación · Playwright»; #1053, #1055, #1057, #1059) sobre el COMPONENTE REAL
// (entrada @grana/vue/nav-bar por dist/nav-bar.umd.js) en el banco packages/vue/playground/sitio.html: dentro de la banda
// de un GAppShell real con header="pinned-wide" y un GSidebar real. Un solo proceso por puerto: GRANA_PW_PORT=4241 (bruno
// del sitio calcado). El rendimiento de P1 se exige solo con un worker: --workers=1.
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
const settle = (p) => p.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 60)))))
async function open(page, { width = 1280, height = 800, qs = '', motion = 'no-preference' } = {}) {
  await page.setViewportSize({ width, height })
  await page.emulateMedia({ reducedMotion: motion })
  const errs = watchConsole(page)
  await page.goto(`${PAGE}${qs}`)
  await page.waitForSelector('.g-nav-bar')
  await settle(page)
  return errs
}
const shown = (page, sel) => page.evaluate((s) => { const e = document.querySelector(s); return Boolean(e && e.getClientRects().length && e.getBoundingClientRect().width) }, sel)

test.describe('GNavBar · cortes del visor (N-L6)', () => {
  for (const [w, want] of [
    [1280, { list: true, actions: true, more: false, toggle: false }],
    [1024, { list: true, actions: false, more: true, toggle: false }],
    [768, { list: true, actions: false, more: true, toggle: false }],
    [375, { list: false, actions: false, more: false, toggle: true }],
    [320, { list: false, actions: false, more: false, toggle: true }]
  ]) {
    test(`${w}: lo que toca y sin desplazamiento horizontal`, async ({ page }) => {
      const errs = await open(page, { width: w })
      const got = {
        list: await shown(page, '.g-nav-bar__nav'),
        actions: await shown(page, '.g-nav-bar__actions'),
        more: await shown(page, '.g-nav-bar__more-btn'),
        toggle: await shown(page, '.g-nav-bar__toggle')
      }
      expect(got).toEqual(want)
      expect(await shown(page, '.g-nav-bar__search')).toBe(true)
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0)
      expect(errs).toEqual([])
    })
  }

  test('la marca no se pinta con un GSidebar expandido en el chasis; sin él, sí', async ({ page }) => {
    await open(page)
    expect(await shown(page, '.g-nav-bar__brand')).toBe(false)
    await open(page, { qs: '?nav=0' })
    expect(await shown(page, '.g-nav-bar__brand')).toBe(true)
  })
})

test.describe('GNavBar · P1 · una sola luz', () => {
  test('la luz sigue al puntero sin mover el foco, aparece sin viajar y el hover no pinta en accent', async ({ page }) => {
    await open(page, { qs: '?nav=0' })
    const links = page.locator('.g-nav-bar__link')
    const before = await page.evaluate(() => document.activeElement.tagName)
    const accent = await page.evaluate(() => getComputedStyle(document.querySelector('.g-nav-bar__link[aria-current]')).color)
    const restColor = await links.nth(0).evaluate((a) => getComputedStyle(a).color)
    await links.nth(0).hover()
    await settle(page)
    const list = page.locator('.g-nav-bar__list')
    await expect(list).toHaveClass(/has-highlight/)
    const first = await page.evaluate(() => {
      const h = document.querySelector('.g-nav-bar__highlight')
      return { x: parseFloat(h.style.getPropertyValue('--_highlight-x')), w: parseFloat(h.style.getPropertyValue('--_highlight-w')) }
    })
    const box0 = await links.nth(0).boundingBox()
    const lb = await list.boundingBox()
    expect(Math.abs(first.x - (box0.x - lb.x))).toBeLessThanOrEqual(1)
    expect(Math.abs(first.w - box0.width)).toBeLessThanOrEqual(1)
    // el hover de un enlace en reposo no pinta el color de la actual
    expect(await links.nth(0).evaluate((a) => getComputedStyle(a).color)).not.toBe(accent)
    expect(await links.nth(0).evaluate((a) => getComputedStyle(a).color)).toBe(restColor)
    await links.nth(3).hover()
    await settle(page)
    const x3 = await page.evaluate(() => parseFloat(document.querySelector('.g-nav-bar__highlight').style.getPropertyValue('--_highlight-x')))
    const box3 = await links.nth(3).boundingBox()
    expect(Math.abs(x3 - (box3.x - lb.x))).toBeLessThanOrEqual(1)
    expect(await page.evaluate(() => document.activeElement.tagName)).toBe(before)
    await page.mouse.move(5, 700)
    await settle(page)
    await expect(list).not.toHaveClass(/has-highlight/)
  })

  test('forced-colors: la luz no se pinta y la actual lleva subrayado', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'forced-colors solo se emula en Chromium')
    await page.emulateMedia({ forcedColors: 'active' })
    await open(page, { qs: '?nav=0' })
    await page.locator('.g-nav-bar__link').nth(0).hover()
    await settle(page)
    expect(await page.evaluate(() => getComputedStyle(document.querySelector('.g-nav-bar__highlight')).display)).toBe('none')
    expect(await page.evaluate(() => getComputedStyle(document.querySelector('.g-nav-bar__link[aria-current]')).textDecorationLine)).toContain('underline')
  })
})

test.describe('GNavBar · teclado', () => {
  test('Tab en orden: búsqueda → enlaces → acciones (1280), sin flechas', async ({ page, browserName }) => {
    const tab = browserName === 'webkit' ? 'Alt+Tab' : 'Tab' // WebKit no lleva el Tab a los enlaces con la preferencia por defecto
    await open(page, { qs: '?nav=0' })
    await page.locator('#brand').focus()
    const seq = []
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press(tab)
      seq.push(await page.evaluate(() => document.activeElement.id || document.activeElement.textContent.trim().slice(0, 12)))
    }
    expect(seq.slice(0, 9)).toEqual(['search-btn', 'Guía', 'Componentes', 'Blocks', 'Playground', 'Cambios', 'GitHub se ab', 'lang-bar', 'theme-bar'])
    await page.locator('.g-nav-bar__link').nth(1).focus()
    await page.keyboard.press('ArrowRight')
    expect(await page.evaluate(() => document.activeElement.textContent)).toBe('Componentes')
  })

  test('«…» (1024): Intro abre con aria-expanded, el contenido se recorre, Esc cierra y devuelve el foco', async ({ page, browserName }) => {
    const tab = browserName === 'webkit' ? 'Alt+Tab' : 'Tab'
    await open(page, { width: 1024, qs: '?nav=0' })
    const btn = page.locator('.g-nav-bar__more-btn')
    await btn.focus()
    await page.keyboard.press('Enter')
    await settle(page)
    await expect(btn).toHaveAttribute('aria-expanded', 'true')
    const panel = page.locator('.g-nav-bar__more-panel')
    await expect(panel).toBeVisible()
    const pb = await panel.boundingBox()
    expect(pb.x).toBeGreaterThanOrEqual(0)
    expect(pb.x + pb.width).toBeLessThanOrEqual(1024)
    await page.keyboard.press(tab)
    expect(await page.evaluate(() => document.activeElement.id)).toBe('lang-more')
    await page.keyboard.press('Escape')
    await settle(page)
    await expect(btn).toHaveAttribute('aria-expanded', 'false')
    expect(await page.evaluate(() => document.activeElement.className)).toContain('g-nav-bar__more-btn')
  })

  test('pantalla (375) con chasis: foco al primer enlace, lo de detrás inert, Tab no sale, la rueda no desplaza, Esc devuelve el foco', async ({ page, browserName }) => {
    const tab = browserName === 'webkit' ? 'Alt+Tab' : 'Tab'
    await open(page, { width: 375 })
    const btn = page.locator('.g-nav-bar__toggle')
    await btn.click()
    await settle(page)
    await expect(btn).toHaveAttribute('aria-expanded', 'true')
    expect(await page.evaluate(() => document.activeElement.textContent)).toBe('Guía')
    expect(await page.evaluate(() => [document.querySelector('.g-app-shell__frame').inert, document.querySelector('.g-app-shell').classList.contains('is-covered')])).toEqual([true, true])
    const screen = await page.locator('.g-nav-bar__screen').boundingBox()
    const band = await page.locator('.g-app-shell__header').boundingBox()
    expect(Math.abs(screen.y - (band.y + band.height))).toBeLessThanOrEqual(1)
    for (let i = 0; i < 14; i++) {
      await page.keyboard.press(tab)
      const inside = await page.evaluate(() => Boolean(document.activeElement.closest('.g-app-shell__header')))
      expect(inside).toBe(true)
    }
    const y0 = await page.evaluate(() => scrollY)
    await page.mouse.move(180, 700)
    await page.mouse.wheel(0, 600)
    await page.waitForTimeout(200)
    expect(await page.evaluate(() => scrollY)).toBe(y0)
    await page.keyboard.press('Escape')
    await settle(page)
    await expect(btn).toHaveAttribute('aria-expanded', 'false')
    expect(await page.evaluate(() => document.activeElement.className)).toContain('g-nav-bar__toggle')
    expect(await page.evaluate(() => document.querySelector('.g-app-shell__frame').inert)).toBe(false)
  })

  test('pantalla sin chasis: bucle hamburguesa ↔ pantalla y elegir un enlace cierra', async ({ page, browserName }) => {
    const tab = browserName === 'webkit' ? 'Alt+Tab' : 'Tab'
    await open(page, { width: 375, qs: '?shell=0' })
    const btn = page.locator('.g-nav-bar__toggle')
    await btn.click()
    await settle(page)
    const seen = new Set()
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press(tab)
      seen.add(await page.evaluate(() => (document.activeElement.closest('.g-nav-bar__screen') ? 'screen' : document.activeElement.classList.contains('g-nav-bar__toggle') ? 'toggle' : 'out')))
    }
    expect([...seen].sort()).toEqual(['screen', 'toggle'])
    await page.locator('.g-nav-bar__screen-link').nth(2).click()
    await settle(page)
    await expect(btn).toHaveAttribute('aria-expanded', 'false')
    expect(await page.evaluate(() => window.site.events.includes('navigate · blocks'))).toBe(true)
  })

  test('cruzar 48rem con la pantalla abierta la cierra', async ({ page }) => {
    await open(page, { width: 375 })
    await page.locator('.g-nav-bar__toggle').click()
    await settle(page)
    await page.setViewportSize({ width: 1024, height: 800 })
    await settle(page)
    expect(await page.evaluate(() => document.querySelector('.g-nav-bar__screen').hidden)).toBe(true)
    expect(await page.evaluate(() => document.querySelector('.g-app-shell').classList.contains('is-covered'))).toBe(false)
  })
})

test.describe('GNavBar · táctil', () => {
  test.use({ hasTouch: true })
  test('pointer: coarse: enlaces, «…», hamburguesa y filas de la pantalla ≥ 44', async ({ page }) => {
    await open(page, { width: 1024, qs: '?nav=0' })
    expect(await page.evaluate(() => matchMedia('(pointer: coarse)').matches)).toBe(true)
    for (const sel of ['.g-nav-bar__link', '.g-nav-bar__more-btn']) {
      const b = await page.locator(sel).first().boundingBox()
      expect(Math.min(b.width, b.height), sel).toBeGreaterThanOrEqual(44)
    }
    await page.setViewportSize({ width: 375, height: 800 })
    await settle(page)
    await page.locator('.g-nav-bar__toggle').tap()
    await settle(page)
    const t = await page.locator('.g-nav-bar__toggle').boundingBox()
    expect(Math.min(t.width, t.height)).toBeGreaterThanOrEqual(44)
    const r = await page.locator('.g-nav-bar__screen-link').first().boundingBox()
    expect(r.height).toBeGreaterThanOrEqual(44)
  })
})

test.describe('GNavBar · rendimiento de P1 (--workers=1)', () => {
  test('un cruce rápido de los seis enlaces: ninguna tarea ≥ 50 ms', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'longtask solo en Chromium')
    await open(page, { qs: '?nav=0' })
    await page.waitForTimeout(1000) // lo que queda de la carga no cuenta
    // La primera aparición de una luz cuesta ≈ 90 ms en Chromium sin pantalla, igual con la de GSidebar en page-index.html
    // (composición de la capa, «(program)» en el perfil, ningún JS de Grana): se calienta antes de medir el cruce
    await page.locator('.g-nav-bar__link').first().hover()
    await page.mouse.move(600, 500)
    await settle(page)
    await page.evaluate(() => { window.__long = []; new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__long.push(e.duration) }).observe({ type: 'longtask', buffered: false }) })
    const list = await page.locator('.g-nav-bar__list').boundingBox()
    for (let k = 0; k < 4; k++) {
      for (let x = list.x + 2; x < list.x + list.width - 2; x += 6) await page.mouse.move(x, list.y + list.height / 2)
      for (let x = list.x + list.width - 2; x > list.x + 2; x -= 6) await page.mouse.move(x, list.y + list.height / 2)
    }
    await settle(page)
    expect(await page.evaluate(() => window.__long.filter((d) => d >= 50))).toEqual([])
  })
})
