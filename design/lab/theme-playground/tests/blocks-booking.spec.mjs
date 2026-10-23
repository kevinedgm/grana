// @grana/blocks/booking (dueño: bruno; design/contracts/blocks/_comun.md §20 «Playwright», search.md, offer-list.md,
// guest-form.md, confirmation.md): las variantes REALES (packages/blocks/dist/booking.js) con su banco único en
// packages/blocks/playground/booking/. Chromium (la pasada en Firefox y WebKit, una vez al cerrar el lote). Puerto propio:
//   GRANA_PW_PORT=4214 npx playwright test tests/blocks-booking.spec.mjs --project=chromium
import { test, expect } from '@playwright/test'

const BASE = '/packages/blocks/playground/booking/'
const PAGES = [
  { name: 'search', file: 'search.html', qs: '', h1: 0, blocks: 3 },
  { name: 'offer-list', file: 'offer-list.html', qs: '', h1: 0, blocks: 3 },
  // Guest form de uno en uno: tres formularios en la página repetirían los name de los campos
  { name: 'guest-form 01', file: 'guest-form.html', qs: 'v=01', h1: 0, blocks: 1 },
  { name: 'guest-form 02', file: 'guest-form.html', qs: 'v=02', h1: 0, blocks: 1 },
  { name: 'guest-form 03', file: 'guest-form.html', qs: 'v=03', h1: 0, blocks: 1 },
  { name: 'confirmation', file: 'confirmation.html', qs: '', h1: 0, blocks: 3 },
  // Parte B. De una en una donde las tres repetirían anclas (días, políticas, espacios y apartados)
  { name: 'itinerary 01', file: 'itinerary.html', qs: 'v=01', h1: 0, blocks: 1 },
  { name: 'itinerary 02', file: 'itinerary.html', qs: 'v=02', h1: 0, blocks: 1 },
  { name: 'itinerary 03', file: 'itinerary.html', qs: 'v=03', h1: 0, blocks: 1 },
  { name: 'location', file: 'location.html', qs: '', h1: 0, blocks: 3 },
  { name: 'policies 01', file: 'policies.html', qs: 'v=01', h1: 0, blocks: 1 },
  { name: 'policies 02', file: 'policies.html', qs: 'v=02', h1: 0, blocks: 1 },
  { name: 'policies 03', file: 'policies.html', qs: 'v=03', h1: 0, blocks: 1 },
  { name: 'offer-detail 01', file: 'offer-detail.html', qs: 'v=01', h1: 0, blocks: 1 },
  { name: 'offer-detail 02', file: 'offer-detail.html', qs: 'v=02', h1: 0, blocks: 1 },
  { name: 'offer-detail 03', file: 'offer-detail.html', qs: 'v=03', h1: 0, blocks: 1 },
  // Parte C. Menu de uno en uno: 01 y 03 repetirían los id de ancla de los tiempos
  { name: 'booking-summary', file: 'booking-summary.html', qs: '', h1: 0, blocks: 3 },
  { name: 'menu 01', file: 'menu.html', qs: 'v=01', h1: 0, blocks: 1 },
  { name: 'menu 02', file: 'menu.html', qs: 'v=02', h1: 0, blocks: 1 },
  { name: 'menu 03', file: 'menu.html', qs: 'v=03', h1: 0, blocks: 1 },
  { name: 'availability', file: 'availability.html', qs: '', h1: 0, blocks: 3 }
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

test('search: 02 pasa a compacto a 390 y vuelve a la fila a 1440', async ({ page }) => {
  await open(page, 'search.html', 'v=02', { width: 390, height: 844 })
  await expect(page.locator('[data-gb="search-02"] .g-booking-bar')).toHaveClass(/is-compact/)
  await page.setViewportSize({ width: 1440, height: 900 })
  await settle(page)
  await expect(page.locator('[data-gb="search-02"] .g-booking-bar')).not.toHaveClass(/is-compact/)
})

test('search 03: el muelle aparece al dejar atrás la consulta y el último botón no queda tapado (#757)', async ({ page }) => {
  await open(page, 'search.html', 'v=03&alto=1', { width: 390, height: 844 })
  const dock = page.locator('.g-booking-bar__dock')
  await expect(dock).not.toHaveClass(/is-shown/)
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
  await expect(dock).toHaveClass(/is-shown/)
  // Con el muelle a la vista crece la cola del documento: se baja otra vez hasta el final
  await settle(page)
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
  await settle(page)
  const [btn, d] = await Promise.all([page.locator('#pg-last').boundingBox(), dock.boundingBox()])
  expect(btn.y + btn.height).toBeLessThanOrEqual(d.y + 1)
  await page.evaluate(() => window.scrollTo(0, 0))
  await expect(dock).not.toHaveClass(/is-shown/)
})

test('search: la consulta se envía con su kind (submit tal cual de GBookingBar)', async ({ page }) => {
  await open(page, 'search.html', 'v=02')
  await page.locator('[data-gb="search-02"] button[type="submit"]').first().click()
  expect(await page.evaluate(() => window.blockEvents)).toEqual([['submit', '02', 'stay']])
})

test('receta del umbral: GbHero03 + GbSearch01 con un solo h1 y la consulta antes de las acciones del héroe', async ({ page }) => {
  const errs = watchConsole(page)
  await open(page, 'umbral.html', '')
  expect(await page.locator('h1').count()).toBe(1)
  const order = await page.evaluate(() => {
    const form = document.querySelector('[data-gb="search-01"] form')
    const act = document.querySelector('.g-hero__actions')
    return act ? Boolean(form.compareDocumentPosition(act) & Node.DOCUMENT_POSITION_FOLLOWING) : true
  })
  expect(order).toBe(true)
  for (const w of [390, 320]) {
    await page.setViewportSize({ width: w, height: 800 })
    await settle(page)
    expect(await overflow(page), `${w}px`).toBe(false)
  }
  expect(errs).toEqual([])
})

test('offer-list 01: tarjetas de una fila a la misma altura a 1440 y una columna a 320 (#847)', async ({ page }) => {
  await open(page, 'offer-list.html', 'v=01')
  const rows = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('[data-gb="offer-list-01"] [role="listitem"] > .g-card')].map((c) => c.getBoundingClientRect())
    const byTop = {}
    for (const r of cards) (byTop[Math.round(r.top)] ||= []).push(Math.round(r.height))
    return Object.values(byTop)
  })
  expect(rows[0].length).toBeGreaterThan(1)
  for (const r of rows) expect(Math.max(...r) - Math.min(...r)).toBeLessThanOrEqual(1)
  await page.setViewportSize({ width: 320, height: 640 })
  await settle(page)
  const lefts = await page.evaluate(() => new Set([...document.querySelectorAll('[data-gb="offer-list-01"] [role="listitem"]')].map((e) => Math.round(e.getBoundingClientRect().left))).size)
  expect(lefts).toBe(1)
})

test('offer-list 02: la foto al lado en ancho y arriba en estrecho', async ({ page }) => {
  await open(page, 'offer-list.html', 'v=02')
  const side = () => page.evaluate(() => {
    const card = document.querySelector('[data-gb="offer-list-02"] li.g-card')
    const img = card.querySelector('img').getBoundingClientRect()
    const h = card.querySelector('h3').getBoundingClientRect()
    return { beside: img.right <= h.left + 1, above: img.bottom <= h.top + 1 }
  })
  expect((await side()).beside).toBe(true)
  await page.setViewportSize({ width: 320, height: 640 })
  await settle(page)
  expect((await side()).above).toBe(true)
})

test('offer-list: el visor abre con las fotos de la oferta y el foco vuelve a su botón al cerrar', async ({ page }) => {
  await open(page, 'offer-list.html', 'v=01')
  const btn = page.getByRole('button', { name: 'Ver 3 fotos' })
  await btn.click()
  const dialog = page.locator('dialog[open]')
  await expect(dialog).toHaveCount(1)
  await expect(dialog).toContainText('Doble Patio')
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await expect(btn).toBeFocused()
  expect(await page.evaluate(() => window.blockEvents)).toEqual([['photos', '01', 'doble-patio']])
})

test('guest-form 03: a 390×844 el campo enfocado nunca queda bajo el pie pegado (2.4.11)', async ({ page }) => {
  await open(page, 'guest-form.html', 'v=03', { width: 390, height: 844 })
  const fields = ['nombre', 'apellidos', 'correo', 'telefono']
  for (const name of fields) {
    await page.locator(`[data-gb="guest-form-03"] input[name="${name}"]`).focus()
    await settle(page)
    const [f, bar] = await Promise.all([
      page.locator(`[data-gb="guest-form-03"] input[name="${name}"]`).boundingBox(),
      page.locator('[data-gb="guest-form-03"] .g-form-actions').boundingBox()
    ])
    expect(f.y + f.height, name).toBeLessThanOrEqual(bar.y + 1)
  }
})

test('guest-form 01: Tab recorre el formulario e Intro envía con todo escrito y la política marcada', async ({ page }) => {
  await open(page, 'guest-form.html', 'v=01&estado=full')
  await page.getByText('Acepto la política de cancelación').click()
  await expect(page.locator('[data-gb="guest-form-01"] input[name="politica"]')).toBeChecked()
  await page.locator('[data-gb="guest-form-01"] input[name="nombre"]').focus()
  await page.keyboard.press('Enter')
  await settle(page)
  const ev = await page.evaluate(() => window.blockEvents.filter((e) => e[0] === 'submit'))
  expect(ev).toHaveLength(1)
  expect(ev[0][2]).toMatchObject({ nombre: 'Rosa', correo: 'rosa@correo.mx' })
})

test('guest-form 02: «Siguiente» con el paso vacío no avanza y enfoca el primer campo con error', async ({ page }) => {
  await open(page, 'guest-form.html', 'v=02')
  await page.getByRole('button', { name: 'Siguiente' }).click()
  await settle(page)
  expect(await page.evaluate(() => document.activeElement.name)).toBe('nombre')
  expect(await page.evaluate(() => window.blockEvents.filter((e) => e[0] === 'update:step'))).toEqual([])
})

test('confirmation 03: entera dentro de 390×844 sin desplazar y sin desbordar a 320', async ({ page }) => {
  await open(page, 'confirmation.html', 'v=03', { width: 390, height: 844 })
  const b = await page.locator('[data-gb="confirmation-03"]').boundingBox()
  expect(b.y + b.height).toBeLessThanOrEqual(844)
  await page.setViewportSize({ width: 320, height: 640 })
  await settle(page)
  expect(await overflow(page)).toBe(false)
})

for (const dark of [false, true]) {
  test(`confirmation: la insignia del estado se lee (≥ 4.5:1) en ${dark ? 'oscuro' : 'claro'}`, async ({ page }) => {
    await open(page, 'confirmation.html', dark ? 'v=01&dark=1' : 'v=01')
    const ratio = await page.evaluate(() => {
      const el = [...document.querySelectorAll('[data-gb="confirmation-01"] *')].find((e) => e.children.length === 0 && e.textContent.trim() === 'Confirmada')
      const lum = (c) => { const [r, g, b] = c.match(/[\d.]+/g).slice(0, 3).map(Number).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }); return 0.2126 * r + 0.7152 * g + 0.0722 * b }
      let bgEl = el
      let bg = getComputedStyle(bgEl).backgroundColor
      while (bgEl && (bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent')) { bgEl = bgEl.parentElement; bg = bgEl ? getComputedStyle(bgEl).backgroundColor : 'rgb(255,255,255)' }
      const a = lum(getComputedStyle(el).color)
      const b = lum(bg)
      return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
    })
    expect(ratio).toBeGreaterThanOrEqual(4.5)
  })
}


// ---------- Verificación propia · parte B (itinerary.md, location.md, policies.md, offer-detail.md) ----------

for (const v of ['01', '02', '03']) {
  test(`itinerary ${v}: «ahora» por la hora del lugar con el reloj fijado (aria-current e insignia en texto)`, async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-11-14T09:30:00-06:00'))
    await open(page, 'itinerary.html', `v=${v}`)
    const cur = page.locator('[data-gb] [aria-current="time"]')
    await expect(cur).toHaveCount(1)
    await expect(cur).toContainText('Gran Plaza')
    await expect(page.locator('[data-gb]')).toContainText('Siguiente')
    if (v === '02') expect(await page.locator('[data-gb] [aria-expanded="true"]').count()).toBe(0) // no abre el día solo
  })
}

test('itinerary 01: la foto al lado en ancho y arriba a 320', async ({ page }) => {
  await open(page, 'itinerary.html', 'v=01')
  const side = () => page.evaluate(() => {
    const img = document.querySelector('[data-gb="itinerary-01"] li.g-card img')
    const card = img.closest('li.g-card')
    const t = card.querySelector('h4').getBoundingClientRect()
    const i = img.getBoundingClientRect()
    return { beside: i.right <= t.left + 1, above: i.bottom <= t.top + 1 }
  })
  expect((await side()).beside).toBe(true)
  await page.setViewportSize({ width: 320, height: 640 })
  await settle(page)
  expect((await side()).above).toBe(true)
})

test('itinerary 03: tabla en ancho y tarjetas en estrecho (GTable responsive)', async ({ page }) => {
  await open(page, 'itinerary.html', 'v=03')
  expect(await page.locator('[data-gb="itinerary-03"] .g-table--mode-table').count()).toBe(2)
  await page.setViewportSize({ width: 320, height: 640 })
  await settle(page)
  expect(await page.locator('[data-gb="itinerary-03"] .g-table--mode-cards').count()).toBe(2)
  expect(await overflow(page)).toBe(false)
})

test('location 02: dos columnas a 1440 y una a 390; la dirección no desborda a 320', async ({ page }) => {
  await open(page, 'location.html', 'v=02')
  const cols = () => page.evaluate(() => new Set([...document.querySelector('[data-gb="location-02"] .g-adaptive-layout').children].map((c) => Math.round(c.getBoundingClientRect().top))).size)
  expect(await cols()).toBe(1)
  await page.setViewportSize({ width: 390, height: 844 })
  await settle(page)
  expect(await cols()).toBe(2)
  await page.setViewportSize({ width: 320, height: 640 })
  await settle(page)
  const r = await page.evaluate(() => { const a = document.querySelector('[data-gb="location-02"] address'); return { sw: a.scrollWidth, cw: a.clientWidth } })
  expect(r.sw).toBeLessThanOrEqual(r.cw + 1)
  expect(await overflow(page)).toBe(false)
})

test('location: sin peticiones de red a terceros al cargar la página del banco', async ({ page }) => {
  const hosts = new Set()
  page.on('request', (r) => { const u = new URL(r.url()); if (/^https?:$/.test(u.protocol)) hosts.add(u.hostname) })
  await open(page, 'location.html', '')
  expect([...hosts]).toEqual(['localhost'])
})

test('policies 01: #cancelacion abre la política al cargar y la trae a la vista', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 640 })
  await page.goto(`${BASE}policies.html?v=01#cancelacion`)
  await page.waitForSelector('html[data-ready="1"] [data-gb]')
  await settle(page)
  const item = page.locator('#cancelacion')
  await expect(item.locator('[aria-expanded]').first()).toHaveAttribute('aria-expanded', 'true')
  await expect(item.getByText('Después de ese plazo')).toBeInViewport()
})

for (const v of ['02', '03']) {
  test(`policies ${v}: #mascotas lleva al sitio`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 640 })
    await page.goto(`${BASE}policies.html?v=${v}#mascotas`)
    await page.waitForSelector('html[data-ready="1"] [data-gb]')
    await settle(page)
    await page.evaluate(() => { location.hash = ''; location.hash = 'mascotas' })
    await settle(page)
    await expect(page.locator('#mascotas')).toBeInViewport()
  })
}

test('policies 03: en columnas a 1440 y una a 320', async ({ page }) => {
  await open(page, 'policies.html', 'v=03')
  const lefts = () => page.evaluate(() => new Set([...document.querySelectorAll('[data-gb="policies-03"] [role="listitem"]')].map((e) => Math.round(e.getBoundingClientRect().left))).size)
  expect(await lefts()).toBeGreaterThan(1)
  await page.setViewportSize({ width: 320, height: 640 })
  await settle(page)
  expect(await lefts()).toBe(1)
})

test('offer-detail 01: la ficha al lado del texto a 1440 y debajo a 390; un solo h2', async ({ page }) => {
  await open(page, 'offer-detail.html', 'v=01')
  expect(await page.locator('h2').count()).toBe(1)
  const tops = () => page.evaluate(() => [...document.querySelector('[data-gb="offer-detail-01"] .g-adaptive-layout').children].map((c) => Math.round(c.getBoundingClientRect().top)))
  const [a, b] = await tops()
  expect(a).toBe(b)
  await page.setViewportSize({ width: 390, height: 844 })
  await settle(page)
  const [c, d] = await tops()
  expect(d).toBeGreaterThan(c)
})

for (const v of ['01', '03']) {
  test(`offer-detail ${v}: «Ver el baño» lleva al espacio del baño en la galería`, async ({ page }) => {
    await open(page, 'offer-detail.html', `v=${v}`, { width: 390, height: 844 })
    await page.getByRole('link', { name: 'Ver el baño' }).click()
    await settle(page)
    expect(await page.evaluate(() => location.hash)).toBe('#fotos-bano')
    await expect(page.locator('#fotos-bano')).toBeInViewport()
  })
}

test('offer-detail 02: «Ver el baño» abre el visor en la primera foto del baño; la tira no desborda a 320', async ({ page }) => {
  await open(page, 'offer-detail.html', 'v=02', { width: 320, height: 640 })
  expect(await overflow(page)).toBe(false)
  await page.getByRole('button', { name: 'Ver el baño' }).click()
  const dialog = page.locator('dialog[open]')
  await expect(dialog).toHaveCount(1)
  await expect(dialog).toContainText('Regadera de piedra volcánica')
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
})

test('offer-detail: con consult, la consulta junto al precio y ningún «Reservar»', async ({ page }) => {
  const errs = watchConsole(page)
  await open(page, 'offer-detail.html', 'v=01&consult=1')
  await expect(page.locator('[data-gb="offer-detail-01"] [data-gb="search-01"]')).toHaveCount(1)
  await expect(page.getByRole('button', { name: 'Reservar esta suite' })).toHaveCount(0)
  expect(errs).toEqual([])
})

// ---------- Verificación propia · parte C (booking-summary.md, menu.md, availability.md) ----------

// GSummary layout="inline" ocupa la fila entera dentro de la GStack horizontal (hallazgo BS-L1 para lima): a 1440 la
// línea es la consulta y, debajo, el total, la garantía y la acción en una sola fila; a 320 se parte sin desbordar.
test('booking-summary 03: el total, la garantía y la acción en una fila a 1440; se parte a 320 sin desbordar', async ({ page }) => {
  await open(page, 'booking-summary.html', 'v=03')
  // Una fila: hay una línea horizontal que corta a todos (centrados en vertical, sus bordes no coinciden)
  const oneRow = () => page.evaluate(() => {
    const r = [...document.querySelector('[data-gb="booking-summary-03"]').children].filter((c) => !c.matches('.g-summary')).map((c) => c.getBoundingClientRect())
    return Math.max(...r.map((x) => x.top)) < Math.min(...r.map((x) => x.bottom))
  })
  expect(await oneRow()).toBe(true)
  await page.setViewportSize({ width: 320, height: 640 })
  await settle(page)
  expect(await overflow(page)).toBe(false)
  expect(await oneRow()).toBe(false)
})

test('booking-summary 01: en una columna de 360 px sin desbordar', async ({ page }) => {
  await open(page, 'booking-summary.html', 'v=01')
  await page.evaluate(() => { document.querySelector('.pg-stage').style.maxInlineSize = '360px' })
  await settle(page)
  const r = await page.evaluate(() => { const b = document.querySelector('[data-gb="booking-summary-01"]'); return { w: b.getBoundingClientRect().width, sw: b.scrollWidth, cw: b.clientWidth } })
  expect(r.w).toBeLessThanOrEqual(361)
  expect(r.sw).toBeLessThanOrEqual(r.cw + 1)
})

for (const reduce of [false, true]) {
  test(`booking-summary: el total que cambia ${reduce ? 'no rueda con movimiento reducido' : 'rueda (regla de GPrice)'}`, async ({ page }) => {
    if (reduce) await page.emulateMedia({ reducedMotion: 'reduce' })
    await open(page, 'booking-summary.html', 'v=01')
    // Se observa el DOM desde antes del cambio: la capa puede retirarse pronto con la máquina cargada
    const rolling = await page.evaluate(() => new Promise((r) => {
      const root = document.querySelector('[data-gb="booking-summary-01"]')
      let seen = false
      // Rueda = hay una animación en curso dentro del total (con reducido, la capa se retira en el acto sin animación)
      const anim = () => document.getAnimations().some((a) => a.playState === 'running' && a.effect && a.effect.target && root.contains(a.effect.target))
      const mo = new MutationObserver(() => { if (root.querySelector('.is-rolling') && anim()) seen = true })
      mo.observe(root, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] })
      window.blockViews['01'].totals = { total: { value: { amount: 5950, currency: 'MXN' }, label: 'por 3 noches' } }
      requestAnimationFrame(() => { if (anim()) seen = true })
      setTimeout(() => { mo.disconnect(); r(seen) }, 300)
    }))
    expect(rolling).toBe(!reduce)
    await expect(page.locator('[data-gb="booking-summary-01"]')).toContainText(/5[,.\u00a0\u202f]?950/)
  })
}

test('booking-summary: la garantía describe la acción principal', async ({ page }) => {
  await open(page, 'booking-summary.html', 'v=02')
  const d = await page.getByRole('link', { name: 'Continuar' }).getAttribute('aria-describedby')
  await expect(page.locator(`[id="${d}"]`)).toHaveText('Cancelación gratis hasta el 11 de noviembre.')
})

test('menu: cifras tabulares en los precios y dd sin la sangría del navegador (#863)', async ({ page }) => {
  await open(page, 'menu.html', 'v=01')
  const r = await page.evaluate(() => {
    const amt = document.querySelector('[data-gb="menu-01"] .g-price__amount')
    const dd = document.querySelector('[data-gb="menu-01"] dd')
    return { num: getComputedStyle(amt).fontVariantNumeric, dd: getComputedStyle(dd).marginInlineStart }
  })
  expect(r.num).toContain('tabular-nums')
  expect(r.dd).toBe('0px')
})

test('menu 02: el hash abre su pestaña al montar', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(`${BASE}menu.html?v=02#cena`)
  await page.waitForSelector('html[data-ready="1"] [data-gb]')
  await expect(page.getByRole('tab', { name: 'Cena' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.locator('[data-gb="menu-02"] [role="tabpanel"]:not([hidden])')).toContainText('Pesca del día')
})

test('availability: el nombre del día lleva su estado y su precio', async ({ page }) => {
  await open(page, 'availability.html', 'v=01')
  const label = await page.locator('[data-gb="availability-01"] .g-datepicker__day[data-date="2026-11-12"]').first().getAttribute('aria-label')
  expect(label).toMatch(/quedan pocas, 1[,.\u00a0\u202f]?850 pesos mexicanos, Quedan 2$/)
  expect(await page.locator('[data-gb="availability-01"] .g-datepicker__day[data-date="2026-11-20"]').first().getAttribute('aria-label')).toContain('lleno')
})

test('availability: el viernes lleno sirve de salida y no de llegada (#739)', async ({ page }) => {
  await open(page, 'availability.html', 'v=01')
  const day = (iso) => page.locator(`[data-gb="availability-01"] .g-datepicker__day[data-date="${iso}"]`).first()
  // Como llegada no hace nada
  await day('2026-11-20').click()
  expect(await page.evaluate(() => window.blockEvents.filter((e) => e[0] === 'select'))).toEqual([])
  // Como salida, sí
  await day('2026-11-18').click()
  await day('2026-11-20').click()
  expect(await page.evaluate(() => window.blockEvents.filter((e) => e[0] === 'select'))).toEqual([['select', '01', { start: '2026-11-18', end: '2026-11-20' }]])
})

// El contrato pide dos columnas a 1440; GAdaptiveLayout trata el calendario (una <table>) como bloque completo y lo pone
// en su propia fila (hallazgo AV-L1 para lima). Se comprueba lo que hay: el resumen debajo, sin desbordar, a 1440 y 390.
test('availability 03: el resumen va debajo del calendario (AV-L1) sin desbordar a 1440 y 390', async ({ page }) => {
  await open(page, 'availability.html', 'v=03')
  const below = () => page.evaluate(() => {
    const b = document.querySelector('[data-gb="availability-03"]')
    const a = b.querySelector('.g-datepicker').getBoundingClientRect()
    const c = b.querySelector('.g-adapt-standard').getBoundingClientRect()
    return c.top >= a.bottom - 1
  })
  expect(await below()).toBe(true)
  await page.setViewportSize({ width: 390, height: 844 })
  await settle(page)
  expect(await below()).toBe(true)
  expect(await overflow(page)).toBe(false)
})
