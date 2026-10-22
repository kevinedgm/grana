// @grana/blocks/marketing (dueño: bruno; design/contracts/blocks/_comun.md §8 «Playwright», hero.md, features.md, stats.md):
// las variantes REALES (packages/blocks/dist/marketing.js) con su banco único en packages/blocks/playground/marketing/.
// Chromium por defecto (la pasada en Firefox y WebKit, una vez al cerrar el lote). Puerto propio: GRANA_PW_PORT=4213.
//   GRANA_PW_PORT=4213 npx playwright test tests/blocks-marketing.spec.mjs --project=chromium
import { test, expect } from '@playwright/test'

const BASE = '/packages/blocks/playground/marketing/'
const PAGES = [
  { name: 'hero 01', file: 'hero.html', qs: 'v=01', h1: 1 },
  { name: 'hero 02', file: 'hero.html', qs: 'v=02', h1: 1 },
  { name: 'hero 03', file: 'hero.html', qs: 'v=03', h1: 1 },
  { name: 'features', file: 'features.html', qs: '', h1: 0, blocks: 3 },
  { name: 'stats', file: 'stats.html', qs: '', h1: 0, blocks: 3 }
]
const THEMES = ['defecto', 'rustico', 'lujo']

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
async function open(page, file, qs, { width = 1440, height = 900 } = {}) {
  await page.setViewportSize({ width, height })
  await page.goto(`${BASE}${file}${qs ? `?${qs}` : ''}`)
  await page.waitForSelector('html[data-ready="1"] [data-gb]')
  await page.evaluate(() => document.fonts.ready)
  await settle(page)
}
const overflow = (p) => p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)
const headings = (p) => p.evaluate(() => [...document.querySelectorAll('h1, h2, h3, h4, h5, h6')].map((h) => Number(h.tagName[1])))

// Hallazgo B-H1 (para coco, GHero.css): `.g-hero__lead` no parte una palabra larga sin espacios (sin overflow-wrap) y
// desborda a 390 y 320 px con el banco (§7 exige esa palabra). Mientras, el reflujo del héroe se marca como fallo esperado:
// cuando GHero.css lo corrija, la prueba «pasará sin esperarlo» y habrá que quitar la marca.
const HERO_LEAD_OVERFLOW = 'B-H1: .g-hero__lead sin overflow-wrap desborda con la palabra larga del banco (GHero.css, coco)'

for (const pg of PAGES) {
  for (const tema of THEMES) {
    const qs = [pg.qs, `tema=${tema}`].filter(Boolean).join('&')
    test(`${pg.name} · ${tema}: sin desplazamiento horizontal a 1440, 390 y 320 (y 320 con texto al 200 %)`, async ({ page }) => {
      test.fail(pg.file === 'hero.html', HERO_LEAD_OVERFLOW)
      await open(page, pg.file, qs)
      if (pg.blocks) expect(await page.locator('[data-gb]').count()).toBe(pg.blocks)
      for (const [w, h] of [[1440, 900], [390, 844], [320, 640]]) {
        await page.setViewportSize({ width: w, height: h })
        await settle(page)
        expect(await overflow(page), `${w}px`).toBe(false)
      }
      await open(page, pg.file, `${qs}&zoom=2`, { width: 320, height: 640 })
      expect(await overflow(page), '320px · 200 %').toBe(false)
    })
    test(`${pg.name} · ${tema}: consola limpia (sin errores, [Vue warn] ni [Grana …]) a 1440, 390 y 320`, async ({ page }) => {
      const errs = watchConsole(page)
      for (const [w, h] of [[1440, 900], [390, 844], [320, 640]]) await open(page, pg.file, qs, { width: w, height: h })
      expect(errs).toEqual([])
    })
  }

  test(`${pg.name}: ${pg.h1 ? 'un solo h1' : 'ningún h1'} y encabezados sin saltos (también anidado en una GSection)`, async ({ page }) => {
    await open(page, pg.file, pg.qs)
    const levels = await headings(page)
    expect(levels.filter((l) => l === 1)).toHaveLength(pg.h1)
    for (let i = 1; i < levels.length; i++) expect(levels[i], `${levels.join(',')}`).toBeLessThanOrEqual(levels[i - 1] + 1)
    if (!pg.h1) {
      await open(page, pg.file, `${pg.qs}&anidado=1`)
      const nested = await page.evaluate(() => [...document.querySelectorAll('[data-gb]')].map((b) => Number(b.querySelector('h2, h3, h4, h5, h6').tagName[1])))
      expect(nested.every((l) => l === 3)).toBe(true)
    }
  })

  test(`${pg.name}: oscuro con consola limpia; con movimiento reducido nada del bloque anima`, async ({ page }) => {
    const errs = watchConsole(page)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await open(page, pg.file, `${pg.qs}${pg.qs ? '&' : ''}dark=1`)
    expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe('dark')
    await page.waitForTimeout(400)
    const running = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running' && a.effect && a.effect.target && a.effect.target.closest && a.effect.target.closest('[data-gb]')).length)
    expect(running).toBe(0)
    expect(errs).toEqual([])
  })

  test(`${pg.name}: el foco es visible al recorrer el bloque con Tab`, async ({ page }) => {
    await open(page, pg.file, pg.qs)
    const n = await page.evaluate(() => document.querySelectorAll('[data-gb] a[href], [data-gb] button:not([disabled]), [data-gb] input, [data-gb] [tabindex="0"]').length)
    let checked = 0
    for (let i = 0; i < Math.min(n + 2, 14); i++) {
      await page.keyboard.press('Tab')
      const r = await page.evaluate(() => {
        const el = document.activeElement
        if (!el || !el.closest('[data-gb]')) return null
        const cs = getComputedStyle(el)
        const ring = (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) || cs.boxShadow !== 'none'
        // GCard enlace: el anillo lo pinta la tarjeta en su ::after (.g-card:has(.g-card__primary:focus-visible)::after)
        const card = el.closest('.g-card')
        const cardRing = card ? (() => { const c = getComputedStyle(card, '::after'); return (c.outlineStyle !== 'none' && parseFloat(c.outlineWidth) > 0) || c.boxShadow !== 'none' })() : false
        return { tag: el.tagName, ring: ring || cardRing }
      })
      if (r) { checked++; expect(r.ring, `${r.tag} #${i}`).toBe(true) }
    }
    if (n) expect(checked).toBeGreaterThan(0)
  })
}

for (const v of ['01', '03']) {
  test(`hero ${v}: la acción principal sin desplazar a 390×844`, async ({ page }) => {
    await open(page, 'hero.html', `v=${v}`, { width: 390, height: 844 })
    const b = await page.locator('.g-hero__actions .g-btn').first().boundingBox()
    expect(b.y + b.height).toBeLessThanOrEqual(844)
  })
}

test('hero: navigate con clic primario, la aplicación lo intercepta (preventDefault) y no navega', async ({ page }) => {
  await open(page, 'hero.html', 'v=01')
  await page.locator('.g-hero__actions a').first().click()
  expect(await page.evaluate(() => window.blockEvents)).toEqual([['navigate', '01', '#reservar']])
  expect(new URL(page.url()).hash).toBe('')
})

test('stats 02: banda de marca a sangre (g-bleed) con las cifras legibles en la zona', async ({ page }) => {
  await open(page, 'stats.html', '')
  const zone = page.locator('[data-gb="stats-02"]')
  expect(await zone.getAttribute('data-g-zone')).toBe('brand')
  const [zw, vw] = await page.evaluate(() => [document.querySelector('[data-gb="stats-02"]').getBoundingClientRect().width, document.documentElement.clientWidth])
  expect(Math.abs(zw - vw)).toBeLessThanOrEqual(1)
})
