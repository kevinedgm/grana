// Verificación de coco sobre el banco del tamaño del icono de GBtn (design/lab/btn/estilo-banco.html, #205), con el CSS real:
// icono en prepend/append (1.15em del texto), en solo icono (1.4em, sigue a size y no a density), alto del botón sin cambio
// por el icono, trazo sin tocar el borde en las 15 combinaciones size × density (también con el piso de 24px y borde de 2px),
// indicador de carga con el mismo tamaño que el icono al que sustituye y sin salto de ancho/alto, contraste del icono,
// área táctil (24px y 44px con puntero grueso), clase de la aplicación (gana en la capa sin capa), RTL y consola limpia.
// Ejecutar desde la raíz del repo: node design/lab/btn/estilo-verificar.mjs   (usa el Playwright de design/lab/theme-playground)
// Opcional: --engines=chromium,firefox,webkit
import http from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const pw = await import(new URL('../theme-playground/node_modules/playwright/index.mjs', import.meta.url))
const ROOT = fileURLToPath(new URL('../../../', import.meta.url))
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')).map(([k, v]) => [k, v ?? true]))
const ENGINES = (args.engines || 'chromium').split(',')
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const server = http.createServer(async (req, res) => {
  try {
    const p = normalize(join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname)))
    if (!p.startsWith(ROOT)) throw new Error('fuera')
    const body = await readFile(p)
    res.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream' }).end(body)
  } catch { if (!res.headersSent) res.writeHead(404).end() }
})
await new Promise((r) => server.listen(0, '127.0.0.1', r))
const BASE = `http://127.0.0.1:${server.address().port}/design/lab/btn/estilo-banco.html`

const SIZES = ['xs', 'sm', 'md', 'lg', 'xl'], DENS = ['default', 'comfortable', 'compact']
let total = 0, failed = 0
const fails = []
const ok = (cond, msg) => { total++; if (!cond) { failed++; fails.push(msg) } }
const near = (a, b, t = 0.6) => Math.abs(a - b) <= t
const table = []

const probe = () => {
  const px = parseFloat
  const R = (el) => el.getBoundingClientRect()
  const out = { cells: {}, colors: {}, app: null }
  const cv = document.createElement('canvas'); cv.width = cv.height = 1
  const ctx = cv.getContext('2d', { willReadFrequently: true })
  const rgba = (s) => { ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = '#000'; ctx.fillStyle = s; ctx.fillRect(0, 0, 1, 1); const d = ctx.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255] }
  const over = (t, b) => { const a = t[3]; return [t[0] * a + b[0] * (1 - a), t[1] * a + b[1] * (1 - a), t[2] * a + b[2] * (1 - a), 1] }
  const bgOf = (el) => { const layers = []; for (let n = el; n; n = n.parentElement) { const k = rgba(getComputedStyle(n).backgroundColor); if (k[3] > 0) { layers.push(k); if (k[3] >= 1) break } } let base = [255, 255, 255, 1]; for (let i = layers.length - 1; i >= 0; i--) base = over(layers[i], base); return base }
  const lum = (k) => { const f = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(k[0]) + 0.7152 * f(k[1]) + 0.0722 * f(k[2]) }
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) }
  for (const b of document.querySelectorAll('#matrix [data-case]')) {
    const cs = getComputedStyle(b); const bw = px(cs.borderTopWidth)
    const ic = b.querySelector('.g-btn__prepend > svg, .g-btn__append > svg, .g-btn__label > svg')
    const ld = b.querySelector('.g-btn__loader')
    const bb = R(b), ib = ic && R(ic)
    // El dibujo «circle» de Lucide ocupa de 1 a 23 de 24 (trazo incluido): 22/24 de la caja
    const glyph = ib ? ib.width * 22 / 24 : 0
    out.cells[b.dataset.case] = {
      w: bb.width, h: bb.height, fs: px(cs.fontSize), lh: px(cs.lineHeight), bw, hVar: null,
      iw: ib && ib.width, ih: ib && ib.height,
      // holgura entre el trazo y el borde interior, horizontal y vertical (sin contar el borde del botón)
      clearV: ib ? (bb.height - 2 * bw - glyph) / 2 : null,
      clearH: ib ? (b.classList.contains('g-btn--icon') ? (bb.width - 2 * bw - glyph) / 2 : null) : null,
      dcx: ib ? (ib.left + ib.width / 2) - (bb.left + bb.width / 2) : null,
      dcy: ib ? (ib.top + ib.height / 2) - (bb.top + bb.height / 2) : null,
      lw: ld && ld.getBoundingClientRect && px(getComputedStyle(ld).width), lh2: ld && px(getComputedStyle(ld).height), ldisp: ld && getComputedStyle(ld).display,
      // centro del loader (la rotación no mueve su centro)
      lcx: ld ? (R(ld).left + R(ld).width / 2) - (bb.left + bb.width / 2) : null,
      lcy: ld ? (R(ld).top + R(ld).height / 2) - (bb.top + bb.height / 2) : null,
      after: { w: px(getComputedStyle(b, '::after').width), h: px(getComputedStyle(b, '::after').height) },
      rtl: getComputedStyle(b).direction
    }
  }
  for (const b of document.querySelectorAll('#colors [data-case]')) {
    const cs = getComputedStyle(b); const bg = bgOf(b)
    const fgc = rgba(cs.color); const bgc = (() => { const k = rgba(cs.backgroundColor); return k[3] > 0 ? over(k, bgOf(b.parentElement)) : bgOf(b.parentElement) })()
    out.colors[b.dataset.case] = +ratio(over(fgc, bgc), bgc).toFixed(2)
  }
  const a = document.querySelector('[data-case="app-class"]'); const ai = a.querySelector('svg')
  out.app = { w: R(ai).width, h: R(ai).height }
  out.errs = window.__errs || []
  out.overflow = document.documentElement.scrollWidth - innerWidth
  return out
}

const check = (m, tag, { rtl = false, coarse = false, borderW = 1 } = {}) => {
  for (const s of SIZES) for (const d of DENS) {
    const C = (t, l) => m.cells[`${t}|${s}|${d}${l ? '|load' : ''}`]
    const [pre, app, icon, preL, iconL] = [C('pre'), C('app'), C('icon'), C('pre', 1), C('icon', 1)]
    const k = `${tag} · ${s}/${d}`
    // prepend / append: 1.15em del texto del botón
    ok(near(pre.iw, pre.fs * 1.15, 0.1) && near(pre.ih, pre.fs * 1.15, 0.1), `${k}: prepend ${pre.iw}px = 1.15 × ${pre.fs}`)
    ok(near(app.iw, app.fs * 1.15, 0.1) && near(app.ih, app.fs * 1.15, 0.1), `${k}: append ${app.iw}px = 1.15 × ${app.fs}`)
    ok(near(pre.dcy, 0, 0.6) && near(app.dcy, 0, 0.6), `${k}: icono de hueco centrado en vertical (${pre.dcy}, ${app.dcy})`)
    // solo icono: 1.4em, sigue a size
    ok(near(icon.iw, icon.fs * 1.4, 0.1) && near(icon.ih, icon.fs * 1.4, 0.1), `${k}: solo icono ${icon.iw}px = 1.4 × ${icon.fs}`)
    ok(icon.iw > pre.iw, `${k}: el solo icono (${icon.iw}) es mayor que el de prepend (${pre.iw})`)
    ok(near(icon.dcx, 0, 0.6) && near(icon.dcy, 0, 0.6), `${k}: solo icono centrado (${icon.dcx}, ${icon.dcy})`)
    // cabe sin tocar el borde: al menos 1.5px entre el trazo y el borde interior
    ok(icon.clearV >= 1.5 && icon.clearH >= 1.5, `${k}: el trazo del solo icono no toca el borde (holgura V ${icon.clearV.toFixed(2)}, H ${icon.clearH.toFixed(2)})`)
    // el icono no añade altura: alto = el del botón con texto en la misma combinación
    ok(near(icon.h, pre.h, 0.6), `${k}: alto del solo icono (${icon.h}) = alto del botón con prepend (${pre.h})`)
    ok(near(icon.w, icon.h, 0.6), `${k}: solo icono cuadrado (${icon.w}×${icon.h})`)
    ok(icon.h >= 24 - 0.01, `${k}: alto ≥ 24px (${icon.h})`)
    // el icono depende de size, no de density
    if (d !== 'default') { const ref = m.cells[`icon|${s}|default`]; ok(near(icon.iw, ref.iw, 0.01), `${k}: el icono no cambia con density (${icon.iw} vs ${ref.iw})`) }
    // loader: ocupa el lugar del icono, mismo tamaño, centrado y sin salto de caja
    ok(preL.ldisp === 'block' && near(preL.lw, pre.iw, 0.1) && near(preL.lh2, pre.ih, 0.1), `${k}: loader ${preL.lw}px = icono de prepend ${pre.iw}px`)
    ok(iconL.ldisp === 'block' && near(iconL.lw, icon.iw, 0.1) && near(iconL.lh2, icon.ih, 0.1), `${k}: loader solo icono ${iconL.lw}px = icono ${icon.iw}px`)
    ok(near(preL.lcx, 0, 0.6) && near(preL.lcy, 0, 0.6) && near(iconL.lcx, 0, 0.6) && near(iconL.lcy, 0, 0.6), `${k}: loader centrado`)
    ok(near(preL.w, pre.w, 0.01) && near(preL.h, pre.h, 0.01) && near(iconL.w, icon.w, 0.01) && near(iconL.h, icon.h, 0.01), `${k}: cargar no cambia la caja del botón`)
    // área táctil
    const want = coarse ? 44 : 24
    ok(icon.after.w >= want - 0.01 && icon.after.h >= want - 0.01, `${k}: área táctil ${icon.after.w}×${icon.after.h} ≥ ${want}`)
    if (rtl) ok(icon.rtl === 'rtl' && near(icon.dcx, 0, 0.6), `${k}: RTL, solo icono centrado`)
    table.push([tag, `${s}/${d}`, pre.fs, +pre.iw.toFixed(2), +icon.iw.toFixed(2), +icon.h.toFixed(2), +icon.clearV.toFixed(2), +preL.lw.toFixed(2), +iconL.lw.toFixed(2)])
  }
}

const scenarios = [
  ['defecto', '', {}],
  ['oscuro', 'dark=1', {}],
  ['prueba (borde 2px, space 5, píldora, serif)', 'test=1', { borderW: 2 }],
  ['RTL', 'rtl=1', { rtl: true }]
]
for (const engine of ENGINES) {
  const browser = await pw[engine].launch()
  const errors = []
  const hook = (page) => {
    page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) errors.push(m.text()) })
    page.on('pageerror', (e) => errors.push(String(e)))
    page.on('requestfailed', (r) => errors.push('red: ' + r.url()))
  }
  const E = engine
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  hook(page)
  for (const [name, qs, opts] of scenarios) {
    await page.goto(BASE + '?' + qs); await page.evaluate(() => document.fonts.ready)
    const m = await page.evaluate(probe)
    check(m, `${E} · ${name}`, opts)
    if (name === 'defecto') {
      const min = Math.min(...Object.values(m.colors)); ok(min >= 4.5, `${E}: contraste mínimo del icono ${min} ≥ 4.5 en 35 combinaciones`)
      ok(Object.keys(m.colors).length === 35, `${E}: 35 combinaciones de contraste`)
      ok(m.app.w === 48 && m.app.h === 48, `${E}: la clase de la aplicación gana al hueco, sin capa (${m.app.w}×${m.app.h})`)
      ok(m.overflow <= 0, `${E}: sin desplazamiento horizontal (${m.overflow})`)
      table.push([E + ' contraste mín.', '', '', '', '', '', '', min, ''])
    }
  }
  await page.close()
  // Puntero grueso: área táctil 44px (Chromium y WebKit emulan con hasTouch; Firefox no emula pointer: coarse)
  if (engine !== 'firefox') {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, hasTouch: true, isMobile: engine === 'chromium' })
    const p = await ctx.newPage(); hook(p)
    await p.goto(BASE); await p.evaluate(() => document.fonts.ready)
    const coarse = await p.evaluate(() => matchMedia('(pointer: coarse)').matches)
    const m = await p.evaluate(probe)
    if (coarse) check(m, `${E} · táctil`, { coarse: true })
    else ok(true, `${E}: pointer: coarse no emulable (omitido)`)
    await ctx.close()
  }
  ok(errors.length === 0, `${E}: consola limpia (${errors.join(' | ')})`)
  await browser.close()
}
server.close()

if (args.table) console.log(table.map((r) => r.join('\t')).join('\n'))
console.log(`${total - failed}/${total}`)
if (failed) { console.log(fails.slice(0, 60).map((f) => ' · ' + f).join('\n')); process.exit(1) }
