// GPrice, GPriceScope, GNumberField currency, GDatePicker dayDescription y GSlider con moneda (design/contracts/price.md
// «Verificación · Playwright»; #768 a #779) sobre los COMPONENTES REALES (dist/price.umd.js) en
// packages/vue/playground/price.html. El verificar.mjs de kiwi (design/lab/price/r01/) adaptado. Chromium, Firefox y WebKit.
// GRANA_PW_PORT=4208.
import { test, expect } from '@playwright/test'

const PAGE = '/packages/vue/playground/price.html'
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
const settle = (p, ms = 60) => p.evaluate((ms) => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, ms)))), ms)
async function open(page, qs = '', { width = 1280, height = 900 } = {}) {
  await page.setViewportSize({ width, height })
  await page.goto(PAGE + qs)
  await page.waitForFunction(() => window.__price && window.__price.ready)
  await page.evaluate(() => document.fonts.ready)
  await settle(page)
}
const overflow = (p) => p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)
const BIDI = /[‎‏؜]/

// Contraste WCAG de un elemento contra el primer fondo opaco de sus ancestros
const CONTRAST = () => {
  const rgb = (s) => (s.match(/[\d.]+/g) || []).map(Number)
  const lum = ([r, g, b]) => {
    const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
  }
  window.__ratio = (el) => {
    const fg = rgb(getComputedStyle(el).color)
    let n = el
    let bg = null
    while (n && n.nodeType === 1) {
      const c = rgb(getComputedStyle(n).backgroundColor)
      if (c.length >= 3 && (c.length < 4 || c[3] > 0.99)) { bg = c; break }
      n = n.parentElement
    }
    bg = bg || [255, 255, 255]
    const [a, b] = [lum(fg), lum(bg)].sort((x, y) => y - x)
    return (a + 0.05) / (b + 0.05)
  }
}

for (const c of ['base', 'A', 'B', 'C']) for (const lang of ['es-MX', 'en-US']) {
  test(`${c} · ${lang}: consola limpia (sin avisos de Grana ni de Vue) y sin desplazamiento a 1280 y 320`, async ({ page }) => {
    const errs = watchConsole(page)
    for (const w of [1280, 320]) {
      await open(page, `?c=${c}&lang=${lang}`, { width: w, height: 800 })
      expect(await overflow(page), `${w}`).toBe(false)
    }
    expect(errs).toEqual([])
  })
}

test('árbol accesible: el precio de la tarjeta solo dice la frase (sin «$» ni «MXN»), dentro del nombre de la tarjeta enlace', async ({ page }) => {
  await open(page, '?c=C')
  const price = page.locator('[data-room="patio"] .g-price')
  const snap = await price.ariaSnapshot()
  expect(snap).toContain('desde 1,850 pesos mexicanos por noche. Temporada alta: 2,300 pesos mexicanos. Ahorras 450 pesos mexicanos')
  expect(snap).not.toMatch(/\$|MXN/)
  expect(await price.locator('.g-price__visual').getAttribute('aria-hidden')).toBe('true')
  expect(await price.evaluate((el) => [...el.querySelectorAll('*')].some((x) => x.tabIndex >= 0))).toBe(false)
  // Gratis y A consultar: texto llano, una sola vez
  for (const [k, t] of [['free', 'Gratis'], ['on-request', 'Precio a consultar']]) {
    const s = await page.locator(`[data-case="${k}"] .g-price`).ariaSnapshot()
    expect(s.match(new RegExp(t, 'g'))).toHaveLength(1)
  }
})

test('C: la referencia encima del precio actual, sin tachar; base: tachado después', async ({ page }) => {
  await open(page, '?c=C')
  const box = (s) => page.locator(`[data-room="patio"] ${s}`).boundingBox()
  expect((await box('.g-price__compare')).y + 1).toBeLessThan((await box('.g-price__now')).y)
  expect(await page.locator('[data-room="patio"] s').count()).toBe(0)
  await open(page, '?c=base')
  expect(await page.locator('[data-room="patio"] s.g-price__compare .g-price__amount--compare').count()).toBe(1)
  expect(await page.locator('[data-room="patio"] .g-price__amount--compare').evaluate((el) => getComputedStyle(el).textDecorationLine)).toContain('line-through')
})

test('carta alineada: todas las cifras contra el mismo borde final; B sin códigos y con la leyenda primera', async ({ page }) => {
  await open(page, '?c=B')
  const ends = await page.locator('.pr-menu__price .g-price').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().right))
  expect(Math.max(...ends) - Math.min(...ends)).toBeLessThanOrEqual(1)
  const scope = page.locator('[data-scope="menu"]')
  expect(await scope.evaluate((el) => el.firstElementChild.className)).toBe('g-price-scope__legend')
  expect(await scope.locator('.g-price__code').count()).toBe(0)
  expect(await scope.locator('.g-price-scope__legend-text').textContent()).toBe('Precios en pesos mexicanos (MXN)')
  // El carrito: lo extranjero conserva su código
  expect((await page.locator('[data-scope="cart"] .g-price[data-currency="USD"] .g-price__symbol').first().textContent()).trim()).toMatch(/^USD/)
})

test('B: la vista cambia todas las tarjetas a la vez, con «aprox.»', async ({ page }) => {
  await open(page, '?c=B')
  await page.evaluate(() => { window.__price.view.value = 'USD' })
  await settle(page)
  const cur = await page.locator('[data-scope="cards"] .g-price').evaluateAll((els) => els.map((e) => e.dataset.currency))
  expect(cur).toEqual(['USD', 'USD', 'USD'])
  expect(await page.locator('[data-room="patio"] .g-price__approx').textContent()).toBe('aprox.')
  expect(await page.locator('[data-scope="cards"] .g-price-scope__legend-text').textContent()).toBe('Precios en dólares estadounidenses (USD)')
})

for (const dark of [false, true]) {
  test(`contraste ≥ 4.5:1 de todas las partes (${dark ? 'oscuro' : 'claro'})`, async ({ page }) => {
    await open(page, `?c=C${dark ? '&dark=1' : ''}`)
    await page.evaluate(CONTRAST)
    const sel = ['.g-price__number', '.g-price__code', '.g-price__lead', '.g-price__unit', '.g-price__compare-label', '.g-price__amount--compare', '.g-price__saving', '.g-price-scope__seal', '.g-price-scope__legend-text', '.g-price-scope__taxes', '.g-price--on-request']
    const out = await page.evaluate((sel) => sel.map((s) => [s, Math.min(...[...document.querySelectorAll(s)].filter((e) => e.getClientRects().length).map((e) => window.__ratio(e)))]), sel)
    for (const [s, r] of out) expect(r, s).toBeGreaterThanOrEqual(4.5)
  })
}

test('xs en el calendario: texto ≥ 12px; dayDescription en el nombre del día; la raíz con day-content', async ({ page }) => {
  await open(page, '?c=C')
  const sizes = await page.locator('[data-cal] .g-price, [data-cal] .g-price *').evaluateAll((els) => els.map((e) => parseFloat(getComputedStyle(e).fontSize)))
  expect(sizes.length).toBeGreaterThan(0)
  expect(Math.min(...sizes)).toBeGreaterThanOrEqual(12)
  expect(await page.locator('[data-cal] .g-datepicker').first().getAttribute('class')).toContain('g-datepicker--day-content')
  const today = await page.evaluate(() => new Date().toISOString().slice(0, 10))
  const label = await page.locator(`[data-cal] [data-date="${today}"]`).getAttribute('aria-label')
  expect(label).toMatch(/, (1,850|2,250) pesos mexicanos$/)
})

test('la página en inglés: frase y leyenda en inglés; MXN con «MX$» sin código', async ({ page }) => {
  await open(page, '?c=B&lang=en-US')
  expect(await page.locator('[data-room="patio"] .g-price__spoken').textContent()).toBe('from 1,850 Mexican pesos per night. High season: 2,300 Mexican pesos. You save 450 Mexican pesos')
  expect(await page.locator('[data-scope="menu"] .g-price-scope__legend-text').textContent()).toBe('Prices in Mexican pesos (MXN)')
  expect((await page.locator('[data-case="en-mxn"] .g-price__amount').textContent()).trim()).toBe('MX$1,850')
})

test('idiomas por ancestro: alemán, árabe (RTL, cifras arábigo-índicas, sin marcas bidi, flecha espejada), JPY y KWD', async ({ page }) => {
  await open(page, '?c=C')
  expect((await page.locator('[data-case="eur-de"] .g-price__now').textContent()).replace(/\s/g, ' ')).toBe('1.850 €')
  const ar = page.locator('[data-case="ar"] .g-price')
  const t = await ar.textContent()
  expect(t).toMatch(/١٬٨٥٠/)
  expect(t).not.toMatch(BIDI)
  expect(await ar.locator('.g-price__amount').first().getAttribute('dir')).toBe('ltr')
  expect(await ar.locator('.g-price__arrow').evaluate((el) => { const cs = getComputedStyle(el); return cs.transform !== 'none' || (cs.scale && cs.scale !== 'none') })).toBe(true)
  expect((await page.locator('[data-case="jpy"] .g-price__number').textContent())).toBe('12,800')
  expect((await page.locator('[data-case="kwd"] .g-price__number').textContent())).toBe('12.125')
  expect(await page.locator('[data-case="negative"] .g-price__minus').textContent()).toBe('−')
})

test('reflujo a 320: lead, unidad y referencia pasan de línea sin partir el importe (A, B, C)', async ({ page }) => {
  for (const c of ['A', 'B', 'C']) {
    await open(page, `?c=${c}`, { width: 320, height: 700 })
    expect(await overflow(page), c).toBe(false)
    const lines = await page.locator('.g-price__amount, .g-price__total-amount').evaluateAll((els) => els.filter((e) => e.getClientRects().length).map((e) => e.getClientRects().length))
    expect(Math.max(...lines), c).toBe(1)
  }
})

test('tabla de símbolos: el conjunto compartido de este motor está contenido en la de Grana', async ({ page }) => {
  await open(page, '?c=C')
  const missing = await page.evaluate(() => {
    const count = new Map()
    for (const c of Intl.supportedValuesOf('currency')) {
      try {
        const s = new Intl.NumberFormat('en', { style: 'currency', currency: c, currencyDisplay: 'narrowSymbol' }).formatToParts(1).find((p) => p.type === 'currency').value
        if (!/^[A-Z]{3}$/.test(s)) count.set(s, (count.get(s) || 0) + 1)
      } catch {}
    }
    const isShared = Grana.__shared['utils/currency.js'].isShared
    return [...count].filter(([, n]) => n > 1).map(([s]) => s).filter((s) => !isShared(s))
  })
  expect(missing).toEqual([])
})

test('campo de moneda: símbolo y código, nombre en la descripción, formato al salir, defectos 1 y 2', async ({ page, browserName }) => {
  await open(page, '?c=C')
  const main = page.locator('.g-number-field:has([data-field="main"])')
  const input = main.locator('input[role="spinbutton"]')
  expect(await input.getAttribute('inputmode')).toBe('decimal')
  expect(await page.locator('input[data-field="jpy"]').getAttribute('inputmode')).toBe('numeric')
  expect((await main.locator('.g-input__prefix').textContent()).trim()).toBe('$ MXN')
  expect((await page.locator('.g-number-field:has([data-field="de"]) .g-input__suffix').textContent()).trim()).toBe('€')
  const desc = await input.evaluate((el) => (el.getAttribute('aria-describedby') || '').split(' ').map((id) => document.getElementById(id)?.textContent).join(' | '))
  expect(desc).toContain('pesos mexicanos')
  expect(await input.getAttribute('aria-valuetext')).toBe('1,850.00')
  // Escribir sin miles y formatear al salir
  await input.click()
  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.type('2500.5')
  expect(await input.inputValue()).toBe('2500.5')
  await input.evaluate((el) => el.blur())
  await settle(page)
  expect(await input.inputValue()).toBe('2,500.50')
  expect(await main.locator('input[type="hidden"]').getAttribute('value')).toBe('2500.5')
  // Defecto 1: a JPY, el modelo y el oculto se redondean (2501)
  await page.evaluate(() => { window.__price.fieldCurrency.value = 'JPY' })
  await settle(page)
  expect(await page.evaluate(() => window.__price.fieldAmount.value)).toBe(2501)
  expect(await main.locator('input[type="hidden"]').getAttribute('value')).toBe('2501')
  expect(await input.inputValue()).toBe('2,501')
  // Defecto 2: pegar «$1,850.00 MXN» en MXN da 1850; «€50» no entra
  await page.evaluate(() => { window.__price.fieldCurrency.value = 'MXN' })
  await settle(page)
  const paste = (text) => input.evaluate((el, text) => {
    el.focus()
    el.select()
    const dt = new DataTransfer()
    dt.setData('text/plain', text)
    el.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }))
  }, text)
  // Firefox no admite clipboardData en un ClipboardEvent sintético (lo cubre Vitest); se mide en Chromium y WebKit
  if (browserName === 'firefox') return
  await paste('$1,850.00 MXN')
  await settle(page)
  expect(await page.evaluate(() => window.__price.fieldAmount.value), browserName).toBe(1850)
  await paste('€50')
  await settle(page)
  expect(await page.evaluate(() => window.__price.fieldAmount.value)).toBe(1850)
  await input.evaluate((el) => el.blur())
})

test('fila de moneda elegible: GSelect y GNumberField currency alineados a 1100 y 720 (Δ top ≤ 1px, misma altura)', async ({ page }) => {
  for (const w of [1100, 720]) {
    await open(page, '?c=C', { width: w, height: 900 })
    const a = await page.locator('.g-select:has([data-field-currency]) .g-select__control, [data-field-currency] .g-select__control, .g-select[data-field-currency] .g-select__control').first().boundingBox()
    const b = await page.locator('.g-number-field:has([data-field="main"]) .g-input__row').boundingBox()
    expect(Math.abs(a.y - b.y), `${w}`).toBeLessThanOrEqual(1)
    expect(Math.abs(a.height - b.height), `${w}`).toBeLessThanOrEqual(1)
  }
})

test('deslizador con moneda: píldora «$800» y aria-valuetext «800 pesos mexicanos»', async ({ page }) => {
  await open(page, '?c=C')
  const s = page.locator('.g-slider:has([data-field="slider"]), [data-field="slider"].g-slider').first()
  expect((await s.locator('.g-slider__pill-text').textContent()).trim()).toBe('$800')
  expect(await s.locator('input[type="range"]').getAttribute('aria-valuetext')).toBe('800 pesos mexicanos')
})
