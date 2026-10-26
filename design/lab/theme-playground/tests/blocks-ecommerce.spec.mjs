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
  { name: 'promo', file: 'promo.html', qs: '', h1: 0, blocks: 3 },
  // Parte B (puerto 4218): Product grid, Product overview, Quick view y Reviews
  { name: 'product-grid', file: 'product-grid.html', qs: '', h1: 0, blocks: 3 },
  // Product overview: una variante por carga (los ids de los apartados, anclas, no se repiten en una página)
  { name: 'product-overview 01', file: 'product-overview.html', qs: 'v=01', h1: 0, blocks: 1 },
  { name: 'product-overview 02', file: 'product-overview.html', qs: 'v=02', h1: 0, blocks: 1 },
  { name: 'product-overview 03', file: 'product-overview.html', qs: 'v=03', h1: 0, blocks: 1 },
  // Quick view: una tarjeta disparadora (GbProductCard01) y el diálogo cerrado por variante (el título del diálogo se pinta al abrir)
  { name: 'quick-view', file: 'quick-view.html', qs: '', h1: 0, blocks: 6 },
  { name: 'reviews', file: 'reviews.html', qs: '', h1: 0, blocks: 3 },
  // Parte C (puerto 4219): Cart (03 es el cajón cerrado: su <dialog> cuenta), Checkout, Order summary (03 es una línea sin
  // encabezado, role="group") y Order history
  { name: 'cart', file: 'cart.html', qs: '', h1: 0, blocks: 3 },
  { name: 'checkout', file: 'checkout.html', qs: '', h1: 0, blocks: 3 },
  { name: 'order-summary', file: 'order-summary.html', qs: '', h1: 0, blocks: 3 },
  { name: 'order-history', file: 'order-history.html', qs: '', h1: 0, blocks: 3 }
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
        const boxRing = [el.closest('.g-input__control'), el.closest('.g-input__row'), el.closest('.g-select__control'), el.closest('.g-textarea__control'), el.closest('.g-radio-group__option')].some((box) => { if (!box) return false; const c = getComputedStyle(box); return (c.outlineStyle !== 'none' && parseFloat(c.outlineWidth) > 0) || c.boxShadow !== 'none' })
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

// ---------- Verificación propia · parte B (product-grid.md, product-overview.md, quick-view.md, reviews.md) ----------

test('product-grid 01: tarjetas a la misma altura por fila a 1440 (#847) y una columna a 320', async ({ page }) => {
  await open(page, 'product-grid.html', 'v=01', { width: 1440, height: 900 })
  const items = page.locator('[data-gb="product-grid-01"] [role="list"] > [role="listitem"]')
  const rows = new Map()
  for (const it of await items.all()) {
    const b = await box(it.locator('.g-card').first())
    const k = Math.round(b.top)
    rows.set(k, [...(rows.get(k) || []), Math.round(b.bottom - b.top)])
  }
  expect(rows.size).toBeGreaterThan(1)
  for (const hs of rows.values()) expect(Math.max(...hs) - Math.min(...hs), hs.join(',')).toBeLessThanOrEqual(1)
  await page.setViewportSize({ width: 320, height: 640 })
  await settle(page)
  const lefts = new Set()
  for (const it of await items.all()) lefts.add(Math.round((await box(it)).left))
  expect(lefts.size).toBe(1)
  expect(await overflow(page)).toBe(false)
})

test('product-grid 02: las facetas al lado a 1440 y plegadas arriba a 390', async ({ page }) => {
  await open(page, 'product-grid.html', 'v=02', { width: 1440, height: 900 })
  const block = page.locator('[data-gb="product-grid-02"]')
  const facets = block.locator('[role="group"][aria-label="Filtrar"]')
  const results = block.locator('[role="list"]').last()
  let f = await box(facets)
  let r = await box(results)
  expect(f.right).toBeLessThanOrEqual(r.left + 1)
  await page.setViewportSize({ width: 390, height: 844 })
  await settle(page)
  f = await box(facets)
  r = await box(results)
  expect(f.bottom).toBeLessThanOrEqual(r.top + 1)
  // Plegadas: ningún botón de etiqueta a la vista hasta abrir la faceta
  await expect(facets.locator('.g-tag').first()).toBeHidden()
  await expect(facets).toContainText('Grana cochinilla')
})

test('product-grid: alternar una faceta emite update:filters y el refresco (keep) no mueve la rejilla (Δ0 del primer producto)', async ({ page }) => {
  await open(page, 'product-grid.html', 'v=01', { width: 1440, height: 900 })
  const block = page.locator('[data-gb="product-grid-01"]')
  await block.getByRole('button', { name: /^Añil/ }).click()
  expect(await page.evaluate(() => window.blockEvents.filter((e) => e[0] === 'update:filters').map((e) => e[2]))).toEqual([{ tinte: ['grana', 'anil'] }])
  const first = block.locator('[role="list"] > [role="listitem"]').first()
  const before = await box(first)
  await page.evaluate(() => { window.blockViews['01'].loading = true })
  await page.waitForTimeout(700)
  expect((await box(first)).top).toBe(before.top)
  await page.evaluate(() => { window.blockViews['01'].loading = false })
  await page.waitForTimeout(500)
  expect((await box(first)).top).toBe(before.top)
})

test('product-grid: la etiqueta de la faceta sale de labels.facetOption; con otra plantilla, su orden (#935)', async ({ page }) => {
  const errs = watchConsole(page)
  await open(page, 'product-grid.html', 'v=01', { width: 1440, height: 900 })
  const block = page.locator('[data-gb="product-grid-01"]')
  await expect(block.getByRole('button', { name: 'Grana cochinilla · 12' })).toHaveCount(1)
  await page.evaluate(async () => {
    const bank = await import('/packages/blocks/src/blocks/GbProductGrid/product-grid.bank.js')
    window.blockViews['01'].labels = { ...bank.LABELS, facetOption: '{count} in {label}' }
  })
  await expect(block.getByRole('button', { name: '12 in Grana cochinilla' })).toHaveCount(1)
  expect(await block.locator('.g-tag').evaluateAll((els) => els.filter((e) => e.textContent.includes(' · ')).length)).toBe(0)
  expect(errs).toEqual([])
})

test('product-grid: el vacío por filtros ofrece quitar justo un filtro (relax)', async ({ page }) => {
  await open(page, 'product-grid.html', 'v=03&estado=filtrado')
  const block = page.locator('[data-gb="product-grid-03"]')
  await expect(block).toContainText('Ningún textil con esos filtros')
  await block.getByRole('button', { name: /Quitar «Grana cochinilla»/ }).click()
  expect(await page.evaluate(() => window.blockEvents.filter((e) => e[0] === 'update:filters').map((e) => e[2]))).toEqual([{ talla: ['g'] }])
})

// PO-L1 (hallazgo para lima): el panel lleva varios controles y GAdaptiveLayout lo trata como bloque completo (línea propia):
// queda debajo de las fotos también a 1440. Pendiente hasta que el contrato diga cómo pedir «al lado» con API pública.
test.fixme('product-overview 01: el panel al lado de las fotos a 1440 y debajo a 390', async ({ page }) => {
  await open(page, 'product-overview.html', 'v=01', { width: 1440, height: 900 })
  const block = page.locator('[data-gb="product-overview-01"]')
  const gallery = block.locator('.g-gallery')
  const panel = block.locator('fieldset').first()
  let g = await box(gallery)
  let p = await box(panel)
  expect(g.right).toBeLessThanOrEqual(p.left + 1)
  await page.setViewportSize({ width: 390, height: 844 })
  await settle(page)
  g = await box(gallery)
  p = await box(panel)
  expect(g.bottom).toBeLessThanOrEqual(p.top + 1)
})

test('product-overview: los chips de talla en una línea a 320 sin desbordar', async ({ page }) => {
  await open(page, 'product-overview.html', 'v=02', { width: 320, height: 640 })
  const chips = page.locator('[data-gb="product-overview-02"] fieldset').first().locator('label')
  const tops = new Set()
  for (const c of await chips.all()) tops.add(Math.round((await box(c)).top))
  expect(tops.size).toBe(1)
  expect(await overflow(page)).toBe(false)
})

test('product-overview: elegir color no desplaza la página (Δ0 del panel) y la talla agotada se dice; «Añadir» sin talla lleva a la talla', async ({ page }) => {
  await open(page, 'product-overview.html', 'v=01', { width: 1440, height: 900 })
  const block = page.locator('[data-gb="product-overview-01"]')
  const add = block.getByRole('button', { name: 'Añadir al carrito' })
  await add.scrollIntoViewIfNeeded()
  const y0 = await page.evaluate(() => scrollY)
  const p0 = await box(add)
  await block.getByRole('radio', { name: 'Natural' }).check()
  await settle(page)
  expect(await page.evaluate(() => scrollY)).toBe(y0)
  expect((await box(add)).top).toBe(p0.top)
  await expect(block.getByRole('radio', { name: 'G, agotada' })).toBeDisabled()
  await add.click()
  await expect(block.getByRole('radio', { name: 'CH' })).toBeFocused()
  await expect(block).toContainText('Elige Talla')
  expect(await page.evaluate(() => window.blockEvents.filter((e) => e[0] === 'add'))).toEqual([])
})

test('quick-view: abrir desde la tarjeta, elegir talla, cerrar con Esc y el foco vuelve a esa tarjeta', async ({ page }) => {
  await open(page, 'quick-view.html', 'v=01', { width: 1440, height: 900 })
  const card = page.locator('#disparador-01 .g-card__primary, [data-gb="product-card-01"] .g-card__primary').first()
  await card.click()
  const dlg = page.locator('dialog[data-gb="quick-view-01"]')
  await expect(dlg).toBeVisible()
  await dlg.getByRole('radio', { name: 'M' }).check()
  await page.keyboard.press('Escape')
  await expect(dlg).toBeHidden()
  await expect(card).toBeFocused()
  const ev = await page.evaluate(() => window.blockEvents)
  expect(ev.filter((e) => e[0] === 'update:selection').pop()[2]).toEqual({ talla: 'm' })
  expect(ev.filter((e) => e[0] === 'update:open')).toEqual([['update:open', '01', false]])
})

test('quick-view 01: hoja inferior a 390 × 844 con «Añadir» a la vista sin tapar el campo enfocado', async ({ page }) => {
  await open(page, 'quick-view.html', 'v=01', { width: 390, height: 844 })
  await page.locator('[data-gb="product-card-01"] .g-card__primary').first().click()
  const dlg = page.locator('dialog[data-gb="quick-view-01"]')
  await expect(dlg).toBeVisible()
  const d = await box(dlg)
  expect(Math.round(d.bottom)).toBeGreaterThanOrEqual(843)
  const add = dlg.getByRole('button', { name: 'Añadir al carrito' })
  await add.scrollIntoViewIfNeeded()
  const a = await box(add)
  expect(a.bottom).toBeLessThanOrEqual(844)
  const q = dlg.getByRole('spinbutton')
  await q.focus()
  const f = await box(q)
  expect(f.bottom).toBeLessThanOrEqual(844)
  expect(f.top).toBeGreaterThanOrEqual(d.top)
})

test('quick-view 02: al borde final a 1440 y a pantalla completa a 390', async ({ page }) => {
  await open(page, 'quick-view.html', 'v=02', { width: 1440, height: 900 })
  await page.locator('[data-gb="product-card-01"] .g-card__primary').first().click()
  const dlg = page.locator('dialog[data-gb="quick-view-02"]')
  await expect(dlg).toBeVisible()
  await page.waitForTimeout(400)
  let d = await box(dlg)
  expect(Math.round(d.right)).toBeGreaterThanOrEqual(1439)
  expect(d.left).toBeGreaterThan(400)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.waitForTimeout(400)
  d = await box(dlg)
  expect(Math.round(d.left)).toBeLessThanOrEqual(1)
  expect(Math.round(d.right)).toBeGreaterThanOrEqual(389)
})

test('reviews 02: dos columnas a 1440 y una a 390; la distribución se lee como texto y sus barras no están en el árbol accesible', async ({ page }) => {
  await open(page, 'reviews.html', 'v=02', { width: 1440, height: 900 })
  const block = page.locator('[data-gb="reviews-02"]')
  const dist = block.getByRole('list', { name: 'Cómo se reparten' })
  const first = block.locator('figure').first()
  let a = await box(dist)
  let b = await box(first)
  expect(a.right).toBeLessThanOrEqual(b.left + 1)
  await expect(block.getByRole('progressbar')).toHaveCount(0)
  await expect(dist.getByRole('listitem')).toHaveCount(5)
  await page.setViewportSize({ width: 390, height: 844 })
  await settle(page)
  a = await box(dist)
  b = await box(first)
  expect(a.bottom).toBeLessThanOrEqual(b.top + 1)
})

test('reviews: la calificación y cada puntuación en palabras, sin estrellas', async ({ page }) => {
  await open(page, 'reviews.html', 'v=01')
  const block = page.locator('[data-gb="reviews-01"]')
  await expect(block).toContainText('4.6')
  await expect(block).toContainText('128 opiniones')
  await expect(block.locator('figure').first()).toContainText('5 de 5')
  await expect(block.locator('img')).toHaveCount(0)
})


// ---------- Verificación propia · parte C (Cart, Checkout, Order summary, Order history; puerto 4219) ----------

const boxC = (loc) => loc.evaluate((el) => { const r = el.getBoundingClientRect(); return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, width: r.width } })

// CR-L1 (hallazgo para lima): GAdaptiveLayout trata el hijo de las líneas (varios controles) como bloque completo y lo
// pone en fila entera: el resumen va debajo también a 1440. Se comprueba lo que hay; el lado a lado queda pendiente
test('cart 01: el resumen debajo de las líneas a 390 (a 1440, pendiente de CR-L1)', async ({ page }) => {
  await open(page, 'cart.html', 'v=01', { width: 390, height: 844 })
  const block = page.locator('[data-gb="cart-01"]')
  const summary = await boxC(block.locator('section.g-card'))
  const list = await boxC(block.locator('ul.g-stack').first())
  expect(summary.top).toBeGreaterThanOrEqual(list.bottom - 1)
})

test('cart: las líneas no desbordan a 320 con el nombre largo sin espacios', async ({ page }) => {
  await open(page, 'cart.html', 'v=02', { width: 320, height: 640 })
  const block = page.locator('[data-gb="cart-02"]')
  const b = await boxC(block)
  for (const li of await block.locator('ul.g-stack > li').all()) {
    const x = await boxC(li)
    expect(x.right).toBeLessThanOrEqual(b.right + 1)
  }
  expect(await overflow(page)).toBe(false)
})

test('cart 02: quitar deja la huella en su sitio con el foco en «Deshacer»; «Deshacer» devuelve la línea y el foco a su cantidad', async ({ page }) => {
  await open(page, 'cart.html', 'v=02')
  const block = page.locator('[data-gb="cart-02"]')
  await block.getByRole('button', { name: /^Quitar Mezcal espadín/ }).click()
  await expect(block.locator('ul.g-stack > li').first()).toContainText('Quitaste Mezcal espadín')
  await expect(page.locator(':focus')).toHaveText('Deshacer')
  await page.keyboard.press('Enter')
  await expect(block.locator('ul.g-stack > li').first()).not.toContainText('Quitaste')
  await expect(page.locator(':focus')).toHaveAttribute('role', 'spinbutton')
  expect(await page.evaluate(() => window.blockEvents.filter((e) => ['remove', 'restore'].includes(e[0])))).toEqual([['remove', '02', 'l1'], ['restore', '02', 'l1']])
  // La huella se va cuando foco y puntero salen
  await block.getByRole('button', { name: /^Quitar Jarro|^Quitar Rebozo/ }).first().click()
  await expect(page.locator(':focus')).toHaveText('Deshacer')
  await page.mouse.move(2, 2)
  await page.keyboard.press('Tab')
  await expect(block).not.toContainText('Quitaste')
})

test('cart 01: cambiar la cantidad emite change por gesto y el total de la línea rueda (con movimiento reducido, no)', async ({ page }) => {
  for (const reduced of [false, true]) {
    await page.emulateMedia({ reducedMotion: reduced ? 'reduce' : 'no-preference' })
    await open(page, 'cart.html', 'v=01')
    const line = page.locator('[data-gb="cart-01"] ul.g-stack > li').first()
    await line.getByRole('button', { name: 'Añadir una' }).click()
    await expect(line).toContainText('por 3 piezas')
    // Las cifras del total que ruedan (GPrice); los cambios de color del campo al pulsar no cuentan
    const running = await line.evaluate((el) => el.getAnimations({ subtree: true }).filter((a) => a.playState === 'running' && a.effect && a.effect.target && a.effect.target.closest && a.effect.target.closest('.g-price')).length)
    if (reduced) expect(running).toBe(0)
    else expect(running).toBeGreaterThan(0)
    expect(await page.evaluate(() => window.blockEvents.filter((e) => e[0] === 'change'))).toEqual([['change', '01', 'l1', 3]])
  }
})

test('cart 03: el cajón al borde a 1440 y a pantalla completa a 390; el foco vuelve al disparador', async ({ page }) => {
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    await page.setViewportSize({ width: w, height: h })
    await page.goto(`${BASE}cart.html?v=03`)
    await page.waitForSelector('html[data-ready="1"]')
    await page.locator('#abrir-carrito').click()
    const dialog = page.locator('dialog[data-gb="cart-03"]')
    await expect(dialog).toHaveAttribute('open', '')
    await settle(page)
    const b = await boxC(dialog)
    if (w === 390) expect(b.width).toBeGreaterThanOrEqual(389)
    else { expect(b.width).toBeLessThan(w / 2); expect(b.right).toBeGreaterThanOrEqual(w - 1) }
    // El cierre del cajón (Esc lo toma antes el campo de cantidad enfocado: deshace lo escrito, number-field.md)
    await dialog.getByRole('button', { name: 'Cerrar el carrito' }).click()
    await expect(dialog).not.toHaveAttribute('open', '')
    await expect(page.locator(':focus')).toHaveAttribute('id', 'abrir-carrito')
  }
})

test('checkout: el precio de cada forma de envío está en el nombre del radio; Intro envía el paso y avanza', async ({ page }) => {
  await open(page, 'checkout.html', 'v=01')
  const block = page.locator('[data-gb="checkout-01"]')
  await block.getByRole('textbox', { name: /Correo electrónico/ }).fill('ana@example.com')
  await page.keyboard.press('Enter')
  await expect(block.getByRole('textbox', { name: /Calle y número/ })).toBeFocused()
  await expect(block.getByRole('radio', { name: /Estándar.*de 3 a 5 días.*99/ })).toHaveCount(1)
  await expect(block.getByRole('radio', { name: /Recoger en el taller.*Gratis/ })).toHaveCount(1)
  await expect(block.getByRole('radio', { name: /No llega a tu código postal/ })).toBeDisabled()
  expect(await page.evaluate(() => window.blockEvents.filter((e) => e[0] === 'submit'))).toEqual([['submit', '01', 'contacto', false]])
  // Volver no borra
  await block.getByRole('button', { name: 'Atrás' }).click()
  await expect(block.getByRole('textbox', { name: /Correo electrónico/ })).toHaveValue('ana@example.com')
})

test('checkout 03 a 390 × 844: el campo enfocado nunca queda bajo el pie pegado (2.4.11)', async ({ page }) => {
  await open(page, 'checkout.html', 'v=03', { width: 390, height: 844 })
  const block = page.locator('[data-gb="checkout-03"]')
  await block.getByRole('textbox', { name: /Correo electrónico/ }).fill('ana@example.com')
  await page.keyboard.press('Enter')
  await expect(block.getByRole('textbox', { name: /Calle y número/ })).toBeFocused()
  const footer = block.locator('.g-form-actions')
  for (let i = 0; i < 8; i++) {
    const r = await page.evaluate(() => {
      const el = document.activeElement
      if (!el || !el.closest('[data-gb]')) return null
      const f = document.querySelector('[data-gb="checkout-03"] .g-form-actions')
      return { el: el.getBoundingClientRect().bottom, foot: f.getBoundingClientRect().top, inFoot: f.contains(el) }
    })
    if (r && !r.inFoot) expect(r.el, `campo #${i}`).toBeLessThanOrEqual(r.foot + 1)
    await page.keyboard.press('Tab')
  }
  expect(await footer.count()).toBe(1)
})

test('order-summary 01 en una columna de 360 sin desbordar; 03 en línea a 1440 y apilada a 390', async ({ page }) => {
  await open(page, 'order-summary.html', 'v=01', { width: 360, height: 800 })
  expect(await overflow(page)).toBe(false)
  const card = await boxC(page.locator('[data-gb="order-summary-01"]'))
  expect(card.right).toBeLessThanOrEqual(361)
  await open(page, 'order-summary.html', 'v=03', { width: 1440, height: 900 })
  const line = page.locator('[data-gb="order-summary-03"]')
  // Una línea: las piezas comparten franja vertical (centradas: sus tops difieren)
  const oneLine = async () => { const bs = await Promise.all((await line.locator('.g-adaptive-layout > *').all()).map((x) => boxC(x))); return Math.max(...bs.map((b) => b.top)) < Math.min(...bs.map((b) => b.bottom)) }
  expect(await oneLine()).toBe(true)
  for (const [w, h] of [[768, 900], [390, 844]]) {
    await page.setViewportSize({ width: w, height: h })
    await settle(page)
    expect(await overflow(page), `${w}`).toBe(false)
  }
  expect(await oneLine()).toBe(false)
})

test('order-summary 03: la leyenda de la moneda queda bajo la línea, sin desbordar, a 1440, 390 y 320 (EC-L1)', async ({ page }) => {
  for (const [w, h] of [[1440, 900], [390, 844], [320, 640]]) {
    await open(page, 'order-summary.html', 'v=03', { width: w, height: h })
    const block = page.locator('[data-gb="order-summary-03"]')
    const leg = await boxC(block.locator('[data-gb-legend]'))
    const line = await boxC(block.locator('.g-adaptive-layout'))
    const root = await boxC(block)
    expect(leg.top, `${w}`).toBeGreaterThanOrEqual(line.bottom - 1)
    expect(leg.right, `${w}`).toBeLessThanOrEqual(root.right + 1)
    expect(await overflow(page), `${w}`).toBe(false)
  }
})

test('order-history 01: tabla a 1440 y tarjetas de GTable a 390; 02 con el seguimiento sin desbordar a 320', async ({ page }) => {
  await open(page, 'order-history.html', 'v=01', { width: 1440, height: 900 })
  await expect(page.locator('[data-gb="order-history-01"] table')).toBeVisible()
  await expect(page.locator('[data-gb="order-history-01"]')).toContainText('Enviado')
  await page.setViewportSize({ width: 390, height: 844 })
  await settle(page)
  expect(await page.locator('[data-gb="order-history-01"] .g-table').evaluate((el) => el.className)).toMatch(/cards|is-cards/)
  await open(page, 'order-history.html', 'v=02', { width: 320, height: 640 })
  expect(await overflow(page)).toBe(false)
  const card = page.locator('[data-gb="order-history-02"] li', { hasText: 'BYA-2611-07' })
  const c = await boxC(card)
  const s = await boxC(card.locator('.g-stepper'))
  expect(s.right).toBeLessThanOrEqual(c.right + 1)
})

