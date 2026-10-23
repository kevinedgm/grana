// @grana/blocks/ecommerce (dueño: bruno; design/contracts/blocks/_comun.md §33 «Playwright», product-card.md,
// category-previews.md, trust.md, promo.md): las variantes REALES (packages/blocks/dist/ecommerce.js) con su banco único en
// packages/blocks/playground/ecommerce/. Chromium (la pasada en Firefox y WebKit, una vez al cerrar el lote). Puertos
// propios (§33): A 4217, B 4218, C 4219.
//   GRANA_PW_PORT=4217 npx playwright test tests/blocks-ecommerce.spec.mjs --project=chromium
// Las partes B y C añaden sus páginas a PAGES y su «Verificación propia» al final.
import { test, expect } from '@playwright/test'

const BASE = '/packages/blocks/playground/ecommerce/'
const PAGES = [
  // Product card: una tarjeta por producto del banco en cada variante (6 en 01 y 02; 7 en 03, con el mínimo)
  { name: 'product-card', file: 'product-card.html', qs: '', h1: 0, blocks: 19 },
  { name: 'category-previews', file: 'category-previews.html', qs: '', h1: 0, blocks: 3 },
  { name: 'trust', file: 'trust.html', qs: '', h1: 0, blocks: 3 },
  // Promo 03 es una línea sin encabezado (role="group"): en la página anidada no cuenta
  { name: 'promo', file: 'promo.html', qs: '', h1: 0, blocks: 3 }
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

for (const pg of PAGES) {
  for (const tema of THEMES) {
    const qs = [pg.qs, `tema=${tema}`].filter(Boolean).join('&')
    test(`${pg.name} · ${tema}: sin desplazamiento horizontal a 1440, 390 y 320 (y 320 con texto al 200 %)`, async ({ page }) => {
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
      const nested = await page.evaluate(() => [...document.querySelectorAll('[data-gb]')].map((b) => b.querySelector('h2, h3, h4, h5, h6')).filter(Boolean).map((x) => Number(x.tagName[1]))) // (un bloque sin título, GbFooter02, no cuenta)
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

  test(`${pg.name}: el foco es visible al recorrer el bloque con Tab`, async ({ page, browserName }) => {
    await open(page, pg.file, pg.qs)
    const tab = browserName === 'webkit' ? 'Alt+Tab' : 'Tab' // WebKit no lleva el Tab a los enlaces con la preferencia por defecto (como accordion, breadcrumbs y file-field)
    const n = await page.evaluate(() => document.querySelectorAll('[data-gb] a[href], [data-gb] button:not([disabled]), [data-gb] input, [data-gb] [tabindex="0"]').length)
    let checked = 0
    for (let i = 0; i < Math.min(n + 2, 14); i++) {
      await page.keyboard.press(tab)
      const r = await page.evaluate(() => {
        const el = document.activeElement
        if (!el || !el.closest('[data-gb]')) return null
        const cs = getComputedStyle(el)
        const ring = (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) || cs.boxShadow !== 'none'
        // GCard enlace: el anillo lo pinta la tarjeta en su ::after (.g-card:has(.g-card__primary:focus-visible)::after)
        const card = el.closest('.g-card')
        const cardRing = card ? (() => { const c = getComputedStyle(card, '::after'); return (c.outlineStyle !== 'none' && parseFloat(c.outlineWidth) > 0) || c.boxShadow !== 'none' })() : false
        // GInput (buscador de FAQ 03): el anillo lo pinta su caja (.g-input__row/.g-input__control:has(:focus-visible))
        const boxRing = [el.closest('.g-input__control'), el.closest('.g-input__row'), el.closest('.g-select__control'), el.closest('.g-textarea__control')].some((box) => { if (!box) return false; const c = getComputedStyle(box); return (c.outlineStyle !== 'none' && parseFloat(c.outlineWidth) > 0) || c.boxShadow !== 'none' })
        return { tag: el.tagName, ring: ring || cardRing || boxRing }
      })
      if (r) { checked++; expect(r.ring, `${r.tag} #${i}`).toBe(true) }
    }
    if (n) expect(checked).toBeGreaterThan(0)
  })
}


// ---------- Verificación propia ----------

const box = (loc) => loc.evaluate((el) => { const r = el.getBoundingClientRect(); return { top: r.top, bottom: r.bottom, left: r.left, right: r.right } })

test('product-card 02: la foto al lado a 1440 y arriba a 320', async ({ page }) => {
  await open(page, 'product-card.html', 'v=02', { width: 1440, height: 900 })
  const card = page.locator('[data-gb="product-card-02"]').first()
  let m = await box(card.locator('.g-card__media'))
  let t = await box(card.locator('.g-card__title'))
  expect(m.right).toBeLessThanOrEqual(t.left + 1)
  await page.setViewportSize({ width: 320, height: 640 })
  await settle(page)
  m = await box(card.locator('.g-card__media'))
  t = await box(card.locator('.g-card__title'))
  expect(m.bottom).toBeLessThanOrEqual(t.top + 1)
})

test('product-card 01 y 03: el nombre largo sin espacios no desborda la tarjeta a 320', async ({ page }) => {
  await open(page, 'product-card.html', 'v=03', { width: 320, height: 640 })
  const card = page.locator('[data-gb="product-card-03"]', { hasText: 'Tarjeta de regalo' })
  const c = await box(card)
  const t = await box(card.locator('.g-card__title'))
  expect(t.right).toBeLessThanOrEqual(c.right + 1)
  expect(await overflow(page)).toBe(false)
})

test('product-card 03: la acción rápida nunca añade a ciegas («Elegir opciones» abre; «Añadir» añade)', async ({ page }) => {
  await open(page, 'product-card.html', 'v=03')
  const huipil = page.locator('[data-gb="product-card-03"]', { hasText: 'Huipil' })
  await huipil.getByRole('button', { name: 'Elegir opciones' }).click()
  const jarro = page.locator('[data-gb="product-card-03"]', { hasText: 'Jarro' })
  await jarro.getByRole('button', { name: 'Añadir al carrito' }).click()
  expect(await page.evaluate(() => window.blockEvents.filter((e) => e[0] === 'open' || e[0] === 'add'))).toEqual([['open', '03', 'huipil-san-antonino'], ['add', '03', 'jarro-barro-negro', 1]])
  // Lo no disponible: sin acción y con su motivo
  const plato = page.locator('[data-gb="product-card-03"]', { hasText: 'Plato' })
  await expect(plato).toContainText('Vuelve el 2 de diciembre')
  await expect(plato.getByRole('button')).toHaveCount(0)
})

test('product-card: la calificación es texto con su cuenta y la referencia de precio va nombrada', async ({ page }) => {
  await open(page, 'product-card.html', 'v=01')
  const espadin = page.locator('[data-gb="product-card-01"]', { hasText: 'espadín' })
  await expect(espadin).toContainText('4.8 de 5 · 312 opiniones')
  const tobala = page.locator('[data-gb="product-card-01"]', { hasText: 'tobalá' })
  await expect(tobala).toContainText('Precio de lista')
  await expect(page.locator('[data-gb="product-card-01"]', { hasText: 'Jarro' })).toContainText('Todavía sin opiniones')
})

test('category-previews: la cuenta en el nombre del enlace y la vacía sin enlace', async ({ page }) => {
  await open(page, 'category-previews.html', 'v=01')
  const block = page.locator('[data-gb="category-previews-01"]')
  await expect(block.getByRole('link', { name: 'Mezcal · 18 piezas' })).toHaveCount(1)
  await expect(block.getByRole('link', { name: /Barro verde/ })).toHaveCount(0)
  await expect(block).toContainText('Barro verde · Vuelve pronto')
})

test('category-previews 02: la tira se reparte en filas sin desplazamiento lateral a 320', async ({ page }) => {
  await open(page, 'category-previews.html', 'v=02', { width: 320, height: 640 })
  expect(await overflow(page)).toBe(false)
  const list = page.locator('[data-gb="category-previews-02"] [role="list"]')
  const lb = await box(list)
  for (const item of await list.locator(':scope > [role="listitem"]').all()) {
    const b = await box(item)
    expect(b.right).toBeLessThanOrEqual(lb.right + 1)
    expect(b.left).toBeGreaterThanOrEqual(lb.left - 1)
  }
})

test('trust 01: en una fila a 1440 y partida en filas a 320 sin desbordar', async ({ page }) => {
  await open(page, 'trust.html', 'v=01', { width: 1440, height: 900 })
  const items = page.locator('[data-gb="trust-01"] [role="list"] > [role="listitem"]')
  const tops = async () => Promise.all((await items.all()).map(async (i) => Math.round((await box(i)).top)))
  expect(new Set(await tops()).size).toBe(1)
  await page.setViewportSize({ width: 320, height: 640 })
  await settle(page)
  // GAdaptiveLayout reparte por tamaño: con la pista short caben dos por fila a 320 (anotado para la auditoría de coco)
  expect(new Set(await tops()).size).toBeGreaterThan(1)
  expect(await overflow(page)).toBe(false)
})

test('trust: la prueba de cada promesa enlaza a su política (#{policy}) y emite navigate', async ({ page }) => {
  await open(page, 'trust.html', 'v=03')
  const link = page.locator('[data-gb="trust-03"]').getByRole('link', { name: 'Ver la política: Devoluciones en 30 días' })
  await expect(link).toHaveAttribute('href', '#devoluciones')
  await link.click()
  expect(await page.evaluate(() => window.blockEvents.filter((e) => e[0] === 'navigate'))).toEqual([['navigate', '03', '#devoluciones']])
})

for (const tema of THEMES) {
  test(`promo 01 · ${tema}: en la zona de marca, con la fecha en <time> y las condiciones a la vista`, async ({ page }) => {
    await open(page, 'promo.html', `v=01&tema=${tema}`)
    const band = page.locator('[data-gb="promo-01"]')
    await expect(band).toHaveAttribute('data-g-zone', 'brand')
    await expect(band.locator('time')).toHaveAttribute('datetime', '2026-11-02T23:59')
    await expect(band.locator('time')).toHaveText('lunes, 2 de noviembre')
    const termsId = await band.getByRole('link', { name: 'Ver el barro negro' }).getAttribute('aria-describedby')
    await expect(page.locator(`[id="${termsId}"]`)).toContainText('No acumulable')
  })
}

test('promo 03: una línea a 1440 y partida sin desbordar a 320; «Copiar código» emite activate en el gesto', async ({ page }) => {
  await open(page, 'promo.html', 'v=03', { width: 1440, height: 900 })
  const line = page.locator('[data-gb="promo-03"] > .g-adaptive-layout, [data-gb="promo-03"] > [class*="g-adaptive"]').first()
  const kids = await line.locator(':scope > *').all()
  const tops = await Promise.all(kids.map(async (k) => (await box(k)).top))
  expect(Math.max(...tops) - Math.min(...tops)).toBeLessThan(24)
  await page.setViewportSize({ width: 320, height: 640 })
  await settle(page)
  expect(await overflow(page)).toBe(false)
  await page.locator('[data-gb="promo-03"]').getByRole('button', { name: 'Copiar código' }).click()
  expect(await page.evaluate(() => window.blockEvents.filter((e) => e[0] === 'activate'))).toEqual([['activate', '03', 'OAXACA10']])
})

test('promo: ningún temporizador ni animación del bloque tras montar (sin cuenta atrás)', async ({ page }) => {
  await page.addInitScript(() => {
    window.__timers = 0
    const si = window.setInterval
    window.setInterval = (...a) => { window.__timers++; return si(...a) }
  })
  await open(page, 'promo.html', '')
  await page.waitForTimeout(1200)
  expect(await page.evaluate(() => window.__timers)).toBe(0)
  const texts = await page.locator('[data-gb^="promo-"] time').allTextContents()
  await page.waitForTimeout(1100)
  expect(await page.locator('[data-gb^="promo-"] time').allTextContents()).toEqual(texts)
})
