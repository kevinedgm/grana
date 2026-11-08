// GPageIndex (design/contracts/page-index.md «Verificación · Playwright»; #1038 a #1040, #1042, #1047) sobre el COMPONENTE
// REAL (entrada @grana/vue/page-index por dist/page-index.umd.js) en el banco packages/vue/playground/page-index.html: dentro
// del slot `actions` de un GPageHeader real, con GMenu real y la lectura del documento. Un solo proceso por puerto:
// GRANA_PW_PORT=4233 (bruno del marco del sitio).
import { test, expect } from '@playwright/test'

const PAGE = '/packages/vue/playground/page-index.html'

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
async function open(page, { width = 1280, height = 900, motion = 'no-preference', qs = '' } = {}) {
  await page.emulateMedia({ reducedMotion: motion })
  await page.setViewportSize({ width, height })
  await page.goto(PAGE + qs)
  await page.waitForSelector('#pi .g-page-index__trigger')
  await page.evaluate(() => document.fonts.ready)
  await settle(page)
}
// La sección que dice la regla de api.md «Lugar actual» (línea = scroll-padding + tercio de lo visible; al final, la última visible)
const expected = (page) => page.evaluate(() => {
  const root = document.scrollingElement
  const pad = parseFloat(getComputedStyle(root).scrollPaddingBlockStart) || 0
  const h = document.documentElement.clientHeight
  const line = pad + (h - pad) / 3
  const end = root.scrollTop + root.clientHeight >= root.scrollHeight - 1
  const hs = [...document.querySelectorAll('.panel h2')]
  let at = null
  for (const x of hs) { const r = x.getBoundingClientRect(); if (r.top <= line || (end && r.top < h && r.bottom > pad)) at = x.id }
  return at
})
const current = (page) => page.evaluate(() => document.getElementById('current-out').textContent)
const trig = (page) => page.locator('#pi .g-page-index__trigger')

test.describe('GPageIndex · relay real', () => {
  test('anatomía: nav con nombre, botón de menú con el nombre «key + actual», alto de GBtn md y sin errores', async ({ page }) => {
    const errs = watchConsole(page)
    await open(page)
    await expect(page.getByRole('navigation', { name: 'En esta página' })).toHaveCount(1)
    await page.evaluate(() => document.getElementById('s3').scrollIntoView({ block: 'start' }))
    await settle(page)
    const cur = await current(page)
    const label = await page.evaluate((id) => document.getElementById(id).textContent, cur)
    await expect(page.getByRole('button', { name: `En esta página ${label}`, exact: true })).toHaveAttribute('aria-haspopup', 'menu')
    const [h, btn] = await page.evaluate(() => [document.querySelector('#pi .g-page-index__trigger'), document.getElementById('copy')].map((e) => e.getBoundingClientRect().height))
    expect(Math.abs(h - btn)).toBeLessThanOrEqual(0.5)
    expect(errs).toEqual([])
  })

  test('la actual sigue la línea de lectura: una sola y la correcta en cada sección; la última al final del documento', async ({ page }) => {
    await open(page)
    const ids = await page.evaluate(() => [...document.querySelectorAll('.panel h2')].map((h) => h.id))
    for (const id of ids) {
      await page.evaluate((x) => document.getElementById(x).scrollIntoView({ block: 'start' }), id)
      await settle(page)
      expect(await current(page)).toBe(await expected(page))
    }
    await page.evaluate(() => window.scrollTo(0, document.scrollingElement.scrollHeight))
    await settle(page)
    expect(await current(page)).toBe(ids.at(-1))
    await trig(page).click()
    await settle(page)
    await expect(page.locator('#pi [aria-current="location"]')).toHaveCount(1)
    await expect(page.locator('#pi [aria-current="location"]')).toHaveAttribute('href', `#${ids.at(-1)}`)
  })

  test('elegir: el foco va al destino (tabindex="-1"), el siguiente Tab sigue desde ahí y no se recorren las intermedias', async ({ page }) => {
    await open(page)
    await page.addStyleTag({ content: 'html{scroll-behavior:smooth}' })
    await page.evaluate(() => {
      window.seen = []
      new MutationObserver(() => window.seen.push(document.getElementById('current-out').textContent)).observe(document.getElementById('current-out'), { childList: true, characterData: true, subtree: true })
    })
    await trig(page).click()
    await page.locator('#pi .g-menu__item', { hasText: 'Tokens' }).click()
    await page.waitForFunction(() => document.activeElement?.id === 's9')
    await page.waitForTimeout(900)
    expect(await page.evaluate(() => document.getElementById('s9').getAttribute('tabindex'))).toBe('-1')
    expect(await page.evaluate(() => window.seen)).toEqual(['s9'])
    expect(await page.evaluate(() => location.hash)).toBe('#s9')
    expect(await page.evaluate(() => document.activeElement.id)).toBe('s9')
  })

  test('con el teclado: Intro abre, ↓ y Intro eligen; el foco acaba en la sección', async ({ page }) => {
    await open(page)
    await trig(page).focus()
    await page.keyboard.press('Enter')
    await settle(page)
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')
    await page.waitForFunction(() => document.activeElement?.id === 's3')
    await settle(page)
    expect(await current(page)).toBe('s3')
  })

  test('Δ0: el disparador no cambia de ancho al cambiar de sección', async ({ page }) => {
    await open(page)
    const widths = new Set()
    const ids = await page.evaluate(() => [...document.querySelectorAll('.panel h2')].map((h) => h.id))
    for (const id of ids) {
      await page.evaluate((x) => document.getElementById(x).scrollIntoView({ block: 'start' }), id)
      await settle(page)
      widths.add(await trig(page).evaluate((b) => b.getBoundingClientRect().width.toFixed(2)))
    }
    expect([...widths]).toHaveLength(1)
  })

  test('relevo en fases: out (con data-dir) → texto nuevo con in → reposo; ráfaga instantánea con is-burst', async ({ page }) => {
    await open(page)
    await page.evaluate(() => {
      const c = document.querySelector('#pi .g-page-index__current')
      window.trail = []
      new MutationObserver(() => window.trail.push([c.dataset.phase || '-', c.dataset.dir || '-', c.textContent, c.classList.contains('is-burst')]))
        .observe(c, { attributes: true, childList: true, characterData: true, subtree: true })
    })
    await page.waitForTimeout(700)
    await page.evaluate(() => document.getElementById('s5').scrollIntoView({ block: 'start' }))
    await page.waitForTimeout(700)
    const t = await page.evaluate(() => window.trail)
    const outs = t.filter((x) => x[0] === 'out')
    expect(outs.length).toBeGreaterThan(0)
    expect(outs[0][1]).toBe('down')
    const firstIn = t.findIndex((x) => x[0] === 'in')
    expect(firstIn).toBeGreaterThan(t.indexOf(outs[0]))
    expect(t.at(-1).slice(0, 2)).toEqual(['-', '-'])
    // Durante la salida el texto no cambia; con `in` ya es el nuevo
    expect(outs.every((x) => x[2] === outs[0][2])).toBe(true)
    // Ráfaga: dos cambios seguidos
    await page.evaluate(() => { window.trail = [] })
    await page.evaluate(() => document.getElementById('s7').scrollIntoView({ block: 'start' }))
    await page.waitForTimeout(120)
    await page.evaluate(() => document.getElementById('s9').scrollIntoView({ block: 'start' }))
    await page.waitForTimeout(200)
    const t2 = await page.evaluate(() => window.trail)
    expect(t2.some((x) => x[3] === true)).toBe(true)
  })

  test('movimiento reducido: la salida solo se funde (sin desplazamiento)', async ({ page }) => {
    await open(page, { motion: 'reduce' })
    await page.waitForTimeout(700)
    await page.evaluate(() => {
      const c = document.querySelector('#pi .g-page-index__current')
      window.tr = []
      new MutationObserver(() => { if (c.dataset.phase) window.tr.push([c.dataset.phase, getComputedStyle(c).translate]) }).observe(c, { attributes: true })
      document.getElementById('s6').scrollIntoView({ block: 'start' })
    })
    await page.waitForTimeout(700)
    const tr = await page.evaluate(() => window.tr)
    expect(tr.length).toBeGreaterThan(0)
    expect(tr.every((x) => x[1] === 'none')).toBe(true)
  })

  test('rendimiento: 200 secciones, tareas < 50 ms al desplazar', async ({ page }) => {
    await open(page, { qs: '?sections=200' })
    await page.evaluate(() => {
      window.long = []
      new PerformanceObserver((l) => { for (const e of l.getEntries()) window.long.push(e.duration) }).observe({ type: 'longtask', buffered: false })
    })
    for (let i = 0; i < 30; i++) {
      await page.mouse.wheel(0, 800)
      await page.waitForTimeout(30)
    }
    await settle(page)
    const long = await page.evaluate(() => window.long)
    expect(Math.max(0, ...long)).toBeLessThan(50)
    expect(await current(page)).toBe(await expected(page))
  })
})

test.describe('GPageIndex · táctil', () => {
  test.use({ hasTouch: true, isMobile: true })
  test('pointer: coarse → disparador y elementos de la lista ≥ 44 px', async ({ page, browserName }) => {
    test.skip(browserName === 'firefox', 'isMobile no existe en Firefox')
    await open(page, { width: 390, height: 844, qs: '?mode=drawer' })
    const h = await trig(page).evaluate((b) => b.getBoundingClientRect().height)
    expect(h).toBeGreaterThanOrEqual(44)
    await trig(page).tap()
    await settle(page)
    const hs = await page.locator('#pi .g-menu__item').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().height))
    expect(Math.min(...hs)).toBeGreaterThanOrEqual(43.99) // WebKit redondea a 43,99998 (subpíxel)
  })
})
