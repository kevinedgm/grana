// Común de las auditorías de coco (paso 5) de GHero, GGallery/GGalleryViewer y GBookingBar/GPartyField sobre el
// COMPONENTE REAL (dist/*.umd.js en packages/vue/playground/{hero,gallery,booking}.html). Servidor propio en el puerto
// GRANA_PW_PORT (4244 por defecto), Vue servido desde node_modules (sin red), tema del CLI inyectado en el <head> antes de
// montar (no después: la barra mide su fila al montar), consola vigilada, colores normalizados con canvas y contraste WCAG.
import http from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

export const ROOT = fileURLToPath(new URL('../../../', import.meta.url))
export const pw = await import(new URL('../theme-playground/node_modules/playwright/index.mjs', import.meta.url))
export const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')).map(([k, v]) => [k, v ?? true]))
export const ENGINES = (args.engines || 'chromium,firefox,webkit').split(',')
const V = !!args.verbose

const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
let server
export async function serve () {
  server = http.createServer(async (req, res) => {
    try {
      const p = normalize(join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname)))
      if (!p.startsWith(ROOT)) throw new Error('fuera')
      res.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream' }).end(await readFile(p))
    } catch { if (!res.headersSent) res.writeHead(404).end() }
  })
  await new Promise((r) => server.listen(Number(process.env.GRANA_PW_PORT) || 4244, '127.0.0.1', r))
  return `http://127.0.0.1:${server.address().port}/packages/vue/playground/`
}
export const stop = () => server && server.close()

const VUE = await readFile(join(ROOT, 'node_modules/vue/dist/vue.global.js'), 'utf8')
// Temas: los tres del CLI de coco (estilo-temas) y los generados (Dark Color Presence)
export const THEME = {
  defecto: null,
  terracota: 'design/lab/hero/estilo-temas/terracota.css',
  anil: 'design/lab/hero/estilo-temas/anil.css',
  palida: 'design/lab/hero/estilo-temas/palida.css',
  ...Object.fromEntries(['amazon', 'apple', 'caracol-purpura', 'github', 'linear', 'lustre', 'notion', 'spotify', 'stripe'].map((n) => [n, `design/lab/tema-oscuro/dark-color-presence/generated/${n}.css`]))
}
const themeCss = {}
const cssOf = async (t) => (THEME[t] ? (themeCss[t] ??= await readFile(join(ROOT, THEME[t]), 'utf8')) : '')

let total = 0, failed = 0
const fails = [], notes = []
export const ok = (cond, msg, info = '') => { total++; if (!cond) { failed++; fails.push(msg + (info !== '' ? ' · ' + info : '')) } else if (V) console.log('ok   ' + msg + (info !== '' ? ' · ' + info : '')) }
export const note = (s) => { notes.push(s); if (V) console.log('nota ' + s) }
export function report (label) {
  console.log(notes.map((n) => '  · ' + n).join('\n'))
  console.log(`\n${label}: ${total - failed}/${total} correctas`)
  if (failed) { console.log(fails.map((f) => '  ✗ ' + f).join('\n')); process.exitCode = 1 }
}

// En la página: color normalizado (canvas), fondo opaco efectivo, contraste WCAG
export const HELPERS = () => {
  const cv = document.createElement('canvas'); cv.width = cv.height = 1
  const cx = cv.getContext('2d', { willReadFrequently: true })
  const rgba = (c) => { cx.clearRect(0, 0, 1, 1); cx.fillStyle = '#000'; cx.fillStyle = c; cx.fillRect(0, 0, 1, 1); const d = cx.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255] }
  const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) }
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return +((x + 0.05) / (y + 0.05)).toFixed(2) }
  const over = (t, b) => [t[0] * t[3] + b[0] * (1 - t[3]), t[1] * t[3] + b[1] * (1 - t[3]), t[2] * t[3] + b[2] * (1 - t[3]), 1]
  const bgOf = (el) => {
    const layers = []
    for (let e = el; e; e = e.parentElement) { const c = rgba(getComputedStyle(e).backgroundColor); if (c[3] > 0) { layers.push(c); if (c[3] > 0.99) break } }
    let base = rgba(getComputedStyle(document.body).backgroundColor); if (base[3] < 1) base = [255, 255, 255, 1]
    for (let i = layers.length - 1; i >= 0; i--) base = over(layers[i], base)
    return base
  }
  const col = (el, prop = 'color', pe = null) => { const bg = bgOf(el); return over(rgba(getComputedStyle(el, pe)[prop]), bg) }
  window.__c = {
    rgba, ratio, bgOf, over, lum,
    text: (el) => ratio(col(el), bgOf(el)),
    line: (el, prop, pe = null) => ratio(col(el, prop, pe), bgOf(el)),
    pair: (a, b) => ratio(rgba(a), rgba(b))
  }
}
export const settle = (p, ms = 60) => p.evaluate((ms) => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, ms)))), ms)

// Abre una página del playground real con tema, oscuro, RTL, movimiento reducido, colores forzados, puntero grueso…
export async function opener (b, BASE, eng) {
  return async function open (page, { theme = 'defecto', dark = false, vw = 1280, vh = 900, rm = false, fc = false, coarse = false, qs = '', dpr = 1 } = {}) {
    const ctx = await b.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: dpr, reducedMotion: rm ? 'reduce' : 'no-preference', forcedColors: fc ? 'active' : 'none', colorScheme: dark ? 'dark' : 'light', hasTouch: coarse, isMobile: coarse && eng !== 'firefox' })
    const p = await ctx.newPage()
    const errs = []
    p.on('console', (m) => { const t = m.text(); if ((m.type() === 'error' && !/no-existe|favicon|404/.test(t)) || (m.type() === 'warning' && /\[Vue warn\]|\[Grana /.test(t))) errs.push(t) })
    p.on('pageerror', (e) => errs.push(String(e)))
    await p.route(/unpkg\.com\/vue/, (r) => r.fulfill({ body: VUE, contentType: 'text/javascript' }))
    const css = await cssOf(theme)
    const pg = page.replace(/\?.*$/, '')
    await p.route(new RegExp(`playground/${pg.replace('.', '\\.')}`), async (r) => {
      const res = await r.fetch()
      let t = await res.text()
      if (css) t = t.replace('</head>', `<style id="tema">${css}</style></head>`)
      r.fulfill({ response: res, body: t })
    })
    const q = [page.includes('?') ? page.split('?')[1] : '', dark ? 'dark=1' : '', qs].filter(Boolean).join('&')
    await p.goto(BASE + pg + (q ? '?' + q : ''))
    await p.evaluate(() => document.fonts.ready)
    await p.evaluate(HELPERS)
    await settle(p, 150)
    p.__errs = errs; p.__ctx = ctx
    return p
  }
}
export const overflowX = (p) => p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)
export const rect = (p, sel) => p.evaluate((s) => { const e = typeof s === 'string' ? document.querySelector(s) : null; if (!e) return null; const r = e.getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top, b: r.bottom, w: r.width, h: r.height } }, sel)
export const inter = (a, b) => a && b && a.l < b.r - 0.5 && b.l < a.r - 0.5 && a.t < b.b - 0.5 && b.t < a.b - 0.5

// Análisis estático de un CSS de componente y de su .vue
export async function staticCheck (cssPath, vuePaths = []) {
  const raw = await readFile(join(ROOT, cssPath), 'utf8')
  const css = raw.replace(/\/\*[\s\S]*?\*\//g, '')
  // Colores de sistema de forced-colors fuera; literales de color fuera
  ok(!/#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|lab|lch|hwb|color-mix)\(/.test(css), `${cssPath}: sin color literal`)
  ok(!/var\(\s*--[\w-]+\s*,/.test(css), `${cssPath}: var() sin respaldo`)
  ok(!/@layer/.test(css) && !/!important/.test(css), `${cssPath}: sin @layer ni !important`)
  const vars = [...new Set([...css.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1]))]
  ok(vars.every((v) => v.startsWith('--g-') || v.startsWith('--_')), `${cssPath}: solo --g-* y --_*`, vars.filter((v) => !v.startsWith('--g-') && !v.startsWith('--_')).join(','))
  // Colores de sistema solo dentro de forced-colors
  const outside = css.replace(/@media \(forced-colors: active\)\s*\{[\s\S]*?\n\}/g, '')
  ok(!/\b(Canvas|CanvasText|ButtonText|Highlight|GrayText|LinkText)\b/.test(outside), `${cssPath}: colores de sistema solo en forced-colors`)
  for (const v of vuePaths) {
    const src = await readFile(join(ROOT, v), 'utf8')
    ok(!/<style/i.test(src), `${v}: sin <style>`)
  }
  return css
}
