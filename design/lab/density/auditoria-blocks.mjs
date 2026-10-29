// Auditoría visual de los blocks que aprietan por llevar GCard density="compact" (density.md §3.5 y criterio 18).
// Mide el MISMO banco de blocks (packages/blocks/playground) con el dist/ de la base (BASE) y con el actual, y compara por
// bloque: alto de la raíz, cuerpo de letra mínimo, controles más pequeños (alto y ancho) y la lista de cambios.
// Uso: python3 -m http.server 4209 -d . & ; BASE=/ruta/a/base/packages/vue/dist node design/lab/density/auditoria-blocks.mjs
// Solo Chromium. Puntero fino a 1280 y grueso (teléfono 390) con isMobile + hasTouch.
import { chromium } from 'playwright'
import { readFileSync, existsSync } from 'node:fs'
const ORIGIN = process.env.ORIGIN || 'http://localhost:4209'
const BASE = process.env.BASE
if (!BASE) throw new Error('falta BASE (dist/ de la base)')
const CASES = [
  ['ecommerce/product-card.html', '03', 'GbProductCard03'], ['booking/confirmation.html', '03', 'GbConfirmation03'],
  ['ecommerce/cart.html', '01', 'GbCart 01'], ['ecommerce/cart.html', '02', 'GbCart 02'], ['ecommerce/cart.html', '03', 'GbCart 03'],
  ['booking/offer-list.html', '03', 'GbOfferList03'], ['ecommerce/order-history.html', '03', 'GbOrderHistory03'],
  ['ecommerce/trust.html', '01', 'GbTrust01'], ['ecommerce/category-previews.html', '02', 'GbCategoryPreviews02'],
  ['ecommerce/category-previews.html', '03', 'GbCategoryPreviews03']
]
const MEASURE = () => {
  const root = document.querySelector('[data-gb]') || document.querySelector('#app')
  const els = [...root.querySelectorAll('*:not(svg):not(svg *)')]
  let minFont = 99; let minFontEl = ''
  const ctl = []
  for (const el of els) {
    const cs = getComputedStyle(el); const b = el.getBoundingClientRect()
    if (cs.display === 'none' || cs.visibility === 'hidden' || !b.width || !b.height) continue
    const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())
    if (own) { const f = parseFloat(cs.fontSize); if (f < minFont) { minFont = f; minFontEl = el.tagName + '.' + String(el.className).split(' ')[0] + ':' + el.textContent.trim().slice(0, 18) } }
    if (el.matches('button, input, select, textarea, [role="button"], [role="spinbutton"]') || (el.matches('a[href]') && cs.display !== 'inline')) {
      if (el.matches('input[type=hidden]')) continue
      ctl.push({ n: el.tagName + '.' + String(el.className).split(' ')[0] + ':' + (el.textContent.trim() || el.getAttribute('aria-label') || '').slice(0, 14), h: Math.round(b.height * 100) / 100, w: Math.round(b.width * 100) / 100 })
    }
  }
  const rb = root.getBoundingClientRect()
  return { height: Math.round(rb.height * 10) / 10, minFont, minFontEl, ctl, n: ctl.length }
}
const browser = await chromium.launch()
async function run (path, v, dist, phone) {
  const ctx = await browser.newContext(phone ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } : { viewport: { width: 1280, height: 900 } })
  const p = await ctx.newPage()
  const errs = []; p.on('pageerror', (e) => errs.push(String(e)))
  if (dist) await p.route('**/packages/vue/dist/**', (rt) => {
    const f = dist + '/' + new URL(rt.request().url()).pathname.split('/packages/vue/dist/')[1]
    if (!existsSync(f)) return rt.fulfill({ status: 404, body: '' })
    rt.fulfill({ body: readFileSync(f), contentType: f.endsWith('.css') ? 'text/css' : f.endsWith('.woff2') ? 'font/woff2' : 'text/javascript' })
  })
  await p.goto(`${ORIGIN}/packages/blocks/playground/${path}?v=${v}`)
  await p.waitForSelector('[data-gb]', { timeout: 8000 }).catch(() => {}); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(1200)
  const r = await p.evaluate(MEASURE)
  if (!r.n) r.sinDatos = true
  const coarse = await p.evaluate(() => matchMedia('(pointer: coarse)').matches)
  await ctx.close(); return { ...r, errs, coarse }
}
const sm = (a) => a.length ? `${Math.min(...a.map((c) => c.h))}x${Math.min(...a.map((c) => c.w))}` : '-'
for (const phone of [false, true]) {
  console.log(`\n=== ${phone ? 'teléfono 390 (puntero grueso)' : 'escritorio 1280 (puntero fino)'} ===`)
  for (const [path, v, name] of CASES) {
    const a = await run(path, v, BASE, phone); const b = await run(path, v, null, phone)
    const minH = (r) => r.ctl.length ? Math.min(...r.ctl.map((c) => c.h)) : null
    const small = b.ctl.filter((c) => c.h < (phone ? 44 : 24) - 0.01 || c.w < (phone ? 44 : 24) - 0.01).slice(0, 4).map((c) => `${c.n} ${c.w}x${c.h}`)
    console.log(`${a.sinDatos || b.sinDatos ? '(SIN DATOS: dialogo cerrado o no montó) ' : ''}${name.padEnd(22)} alto ${a.height}→${b.height} | letra mín ${a.minFont}→${b.minFont} | ctl ${a.n}→${b.n} alto mín ${minH(a)}→${minH(b)} (${sm(a.ctl)}→${sm(b.ctl)}) | errs ${a.errs.length + b.errs.length}${small.length ? ' | <mín: ' + small.join('; ') : ''}${b.minFont < 12 ? ' | LETRA<12: ' + b.minFontEl : ''}`)
  }
}
await browser.close()
