// Auditoría de coco (paso 5) de GSummary sobre el COMPONENTE REAL: el banco de bruno packages/vue/playground/summary.html
// (los mismos data-case que estilo-banco.html, con <g-summary> de dist/grana.umd.js y dist/grana.css tal como se publican).
// El tema se inyecta en el HTML ANTES de montar (enlace sin capa tras grana.css: gana a grana.defaults, como el de una
// aplicación), así la primera medida ya ve la fuente y el espaciado del tema.
// Temas: por defecto claro y oscuro; el de esta auditoría, auditoria-tema.css (@grana/cli desde auditoria-tema.json:
// brand #7A2E0E, accent #B4440F, neutros teñidos, radius 10, space 5, fontSize 17, Georgia) claro y oscuro; y los once
// de design/lab/tema-oscuro/dark-color-presence/generated/ claro y oscuro (Chromium; Firefox y WebKit: spotify oscuro).
// Mide:
// 0 · CSS: GSummary.css (sin literales de color, sin respaldos, solo --g-* existentes y --_su-*/--_lines; literales
//     previstos) y dist/grana.css (las reglas g-summary están en grana.components, keyframes, sin fuente incrustada).
// 1 · Barrido 160–720 (contrato, paso 20) con el tema por defecto y el de auditoría: sin desborde, nada cortado a medias,
//     identificador entero y ANCLADO (primero de la corriente, nunca data-clipped), «+N» = data-clipped, recortados =
//     final de la prioridad, data-terse antes de soltar, data-tight ⇒ datos fuera, el lector lo recibe todo, title solo
//     en lo cortado, estado solo con el nombre en 7ch, alto constante en row lines 2, inline Δ0, monotonía; 120 y 140
//     informativos (fuera del contrato). Punto (a) de bruno: código + icono a 120/140: el código entero o con elipsis
//     dentro de su caja (nunca cortado sin señal).
// 2 · Contraste (compuesto real): título, rótulo, compartido (is-same), caption de stack, código, marcador vacío y «+N»
//     sobre bg, surface y surface-sunken (≥ 4,5); sobre selection, informativo (lo reapunta el anfitrión); rótulo en la
//     opción seleccionada (surface-sunken del banco). Texto ≥ 12px. prefers-contrast: more (rótulo y compartido a muted).
// 3 · Pesos de B (lo único pesa, lo compartido se apaga, identificador y título en peso de título, coincidencia).
// 4 · Carga Δ0 (row lines 2, inline, row lines 4 al máximo) y paso de carga a datos; formas visibles.
// 5 · Entrada g-summary-enter (LTR) y -rtl: duración = --g-duration-slow del tema, desplazamiento = space × 3 desde el
//     inicio; nada al montar; con reduce, ni atributo ni animación.
// 6 · forced-colors emulado: filete y borde de «+N» CanvasText, caja del icono con contorno, formas GrayText, peso.
// 7 · Bidi con RTL real (árabe, hebreo, latino en RTL): orden rótulo/valor, filete al inicio (derecha), identidad a la
//     derecha, sin desplazamiento del anfitrión. Móvil 320 sin desplazamiento horizontal. Acción de stack: área ≥ 24px y
//     foco visible. Consola limpia.
// --perf: punto (b) de bruno: 500 fichas, maquetado forzado y devolución del observador con y sin contain/:has().
// Ejecutar desde la raíz (requiere `npm run build`): GRANA_PW_PORT=4209 node design/lab/summary/auditoria-verificar.mjs
// Opcional: --engines=chromium,firefox,webkit  --perf  --verbose. GRANA_DIST=<copia de dist> sirve una copia fija.
import http from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const pw = await import(new URL('../theme-playground/node_modules/playwright/index.mjs', import.meta.url))
const ROOT = fileURLToPath(new URL('../../../', import.meta.url))
const DIST = process.env.GRANA_DIST
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')).map(([k, v]) => [k, v ?? true]))
const ENGINES = (args.engines || 'chromium,firefox,webkit').split(',')
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const server = http.createServer(async (req, res) => {
  try {
    const path = decodeURIComponent(new URL(req.url, 'http://x').pathname)
    const p = DIST && path.startsWith('/packages/vue/dist/') ? join(DIST, path.slice('/packages/vue/dist/'.length)) : normalize(join(ROOT, path))
    if (!p.startsWith(ROOT) && !(DIST && p.startsWith(DIST))) throw new Error('fuera')
    res.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream' }).end(await readFile(p))
  } catch { if (!res.headersSent) res.writeHead(404).end() }
})
await new Promise((r) => server.listen(Number(process.env.GRANA_PW_PORT) || 4209, '127.0.0.1', r))
const ORIGIN = `http://127.0.0.1:${server.address().port}`
const PAGE = `${ORIGIN}/packages/vue/playground/summary.html`
const VUE = await readFile(join(ROOT, 'node_modules/vue/dist/vue.global.js'))
const HTML = await readFile(join(ROOT, 'packages/vue/playground/summary.html'), 'utf8')
const GEN = ['amazon', 'apple', 'caracol-purpura', 'github', 'grana', 'linear', 'lustre', 'medium', 'notion', 'spotify', 'stripe']
const THEME_HREF = (t) => t === 'auditoria' ? '/design/lab/summary/auditoria-tema.css' : t ? `/design/lab/tema-oscuro/dark-color-presence/generated/${t}.css` : ''

let total = 0, failed = 0
const fails = [], measures = {}
const ok = (cond, msg) => { total++; if (!cond) { failed++; fails.push(msg) } }
const note = (k, v) => { (measures[k] ??= []).push(v) }
const perEngine = {}

/* ---------- 0 · CSS fuente y dist ---------- */
{
  const raw = await readFile(join(ROOT, 'packages/vue/src/components/GSummary/GSummary.css'), 'utf8')
  const css = raw.replace(/\/\*[\s\S]*?\*\//g, '')
  ok(!/#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|lab|lch)\(/.test(css), 'CSS: color literal')
  ok(!/var\(\s*--[\w-]+\s*,/.test(css), 'CSS: var() con valor de respaldo')
  ok(!/@layer|@property|!important|@container/.test(css), 'CSS: @layer, @property, @container o !important')
  ok(!/@media[^{]*(?:width|height)/.test(css), 'CSS: @media por ancho')
  const vars = [...css.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1])
  ok(vars.every((v) => v.startsWith('--g-') || v.startsWith('--_su-') || v === '--_lines'), 'CSS: var() fuera de --g-*, --_su-* y --_lines')
  const defaults = await readFile(join(ROOT, 'packages/vue/src/styles/defaults.css'), 'utf8')
  const defined = new Set([...defaults.matchAll(/(--g-[a-z0-9-]+)\s*:/g)].map((m) => m[1]))
  const missing = [...new Set(vars.filter((v) => v.startsWith('--g-') && !defined.has(v)))]
  ok(!missing.length, 'CSS: tokens que no existen en defaults.css ' + missing)
  ok(![...css.matchAll(/(--g-[\w-]+)\s*:/g)].length, 'CSS: declara propiedades --g-*')
  const px = [...css.matchAll(/(-?\d*\.?\d+)px\b/g)].map((m) => m[0])
  ok(px.every((p) => ['1px', '-1px'].includes(p)), 'CSS: px no permitidos ' + px)
  const units = [...css.matchAll(/(\d*\.?\d+)(ch|lh|em|rem|vw|vh|%)\b/g)].map((m) => m[0])
  const U = ['7ch', '4ch', '1lh', '100%', '60%', '85%', '70%', '50%']
  ok(units.every((u) => U.includes(u)), 'CSS: unidades literales no previstas ' + units.filter((u) => !U.includes(u)))
  ok(!/visibility\s*:\s*hidden/.test(css), 'CSS: visibility:hidden')
  const none = [...css.matchAll(/([^{}]+)\{[^{}]*display:\s*none/g)].map((m) => m[1].trim())
  ok(none.length === 1 && none[0].split(',').every((s) => /g-summary__more/.test(s)), 'CSS: display:none fuera de «+N»')
  ok(!/font-weight:\s*\d/.test(css), 'CSS: peso numérico literal')
  ok(!/transition/.test(css), 'CSS: transiciones')
  const sys = css.split('@media (forced-colors: active)')
  ok(sys.length === 2 && !/\b(?:CanvasText|GrayText|Canvas|Highlight)\b/.test(sys[0]), 'CSS: colores de sistema fuera de forced-colors')
  const dist = await readFile(DIST ? join(DIST, 'grana.css') : join(ROOT, 'packages/vue/dist/grana.css'), 'utf8')
  const lay = dist.indexOf('@layer grana.components'), first = dist.indexOf('.g-summary')
  ok(first > lay && lay >= 0, 'dist: las reglas g-summary no están en grana.components')
  ok(/@keyframes g-summary-enter\b/.test(dist) && /@keyframes g-summary-enter-rtl\b/.test(dist), 'dist: keyframes de entrada')
  ok(!/data:font/.test(dist), 'dist: fuente incrustada')
  // Cada declaración de la fuente debe llegar al dist (el banco cargaba la fuente; el componente real, el dist)
  const sels = [...css.matchAll(/([^{}@]+)\{([^{}]*)\}/g)].map((m) => [m[1].trim().split(',')[0].trim(), m[2].trim()]).filter(([s]) => s.startsWith('.g-summary'))
  const flat = dist.replace(/\s+/g, '')
  const lost = sels.filter(([s, b]) => { const d = b.split(';').map((x) => x.trim()).filter(Boolean)[0]; return d && !flat.includes(d.replace(/\s+/g, '').replace(/0\.(\d)/g, '.$1')) && !flat.includes(d.replace(/\s+/g, '')) })
  ok(lost.length < 3, 'dist: declaraciones de GSummary.css que no llegaron al dist (¿dist sin reconstruir?): ' + lost.slice(0, 3).map((x) => x[0]))
}

/* ---------- Funciones de página ---------- */
function lib() {
  const parse = (s) => {
    let m = s.match(/rgba?\(([^)]+)\)/)
    if (m) { const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p[3] ?? 1] }
    m = s.match(/color\(srgb ([^)]+)\)/)
    if (m) { const p = m[1].split(/[\s/]+/).filter(Boolean).map(Number); return [p[0] * 255, p[1] * 255, p[2] * 255, p[3] ?? 1] }
    return [0, 0, 0, 0]
  }
  const over = (t, b) => { const a = t[3]; return [t[0] * a + b[0] * (1 - a), t[1] * a + b[1] * (1 - a), t[2] * a + b[2] * (1 - a), 1] }
  const bgOf = (el) => {
    const layers = []
    for (let n = el; n; n = n.parentElement) { const c = parse(getComputedStyle(n).backgroundColor); if (c[3] > 0) { layers.push(c); if (c[3] >= 1) break } }
    let base = parse(getComputedStyle(document.documentElement).backgroundColor); if (base[3] < 1) base = parse(getComputedStyle(document.body).backgroundColor); if (base[3] < 1) base = [255, 255, 255, 1]
    for (let i = layers.length - 1; i >= 0; i--) base = over(layers[i], base)
    return base
  }
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]) }
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return +((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)).toFixed(2) }
  const pair = (k, el, min) => el ? { k, r: ratio(over(parse(getComputedStyle(el).color), bgOf(el)), bgOf(el)), min, fs: parseFloat(getComputedStyle(el).fontSize) } : null
  return { parse, over, bgOf, ratio, pair }
}
const L = `(${lib.toString()})()`

// La sonda del barrido (la de summary.spec.mjs) más el identificador ANCLADO y el código del punto (a)
function probe(minId) {
  const out = []
  document.querySelectorAll('[data-case] .g-summary:not(.is-loading):not(.is-empty)').forEach((su, idx) => {
    const host = su.closest('[data-case]'), c = host.dataset.case
    if (c === 'surfaces' || c === 'loading' || c === 'perf') return
    const r = su.getBoundingClientRect(), it = { c, idx, w: r.width, h: r.height, bad: [], info: [] }
    const L = su.classList.contains('g-summary--layout-inline') ? 'inline' : su.classList.contains('g-summary--layout-stack') ? 'stack' : 'row'
    it.layout = L; it.multi = su.classList.contains('g-summary--multi')
    const pb = su.parentElement.getBoundingClientRect()
    if (r.right > pb.right + 0.5 || r.left < pb.left - 0.5) it.bad.push('la ficha sale de su anfitrión')
    const stage = host.closest('.stage') || host
    if (stage.scrollWidth > stage.clientWidth + 1 || host.scrollWidth > host.clientWidth + 1) it.bad.push('el anfitrión se desplaza en horizontal')
    const visIn = (e) => {
      const b = e.getBoundingClientRect(); if (!b.width || !b.height) return false
      for (let a = e.parentElement; a && a !== su.parentElement; a = a.parentElement) {
        const cs = getComputedStyle(a); if (cs.display === 'contents' || (cs.overflowX === 'visible' && cs.overflowY === 'visible')) continue
        const q = a.getBoundingClientRect(); if (b.left < q.left - 1 || b.right > q.right + 1 || b.top < q.top - 1 || b.bottom > q.bottom + 1) return false
      }
      return true
    }
    const hiddenSr = (e) => { for (let a = e; a && a !== su; a = a.parentElement) { const cs = getComputedStyle(a); if (cs.position === 'absolute' && cs.clipPath && cs.clipPath !== 'none') return true } return false }
    const clipped = (e) => !!e.closest('[data-clipped]')
    su.querySelectorAll('.g-summary__lead, .g-summary__code, .g-summary__title, .g-summary__status, .g-summary__fact, .g-summary__more, .g-summary__subtitle, .g-summary__action').forEach((e) => {
      const cs = getComputedStyle(e); if (cs.display === 'none' || e.hidden || hiddenSr(e) || clipped(e)) return
      const b = e.getBoundingClientRect(); if (!b.width) return
      if (e.matches('.g-summary__status') && b.top >= e.parentElement.getBoundingClientRect().bottom - 1) return
      const cross = Math.max(b.right - r.right, r.left - b.left)
      // Hallazgo 2 (ABIERTO, bruno): measure.js no ve un desborde del cuerpo de 1–2px (scrollWidth > clientWidth + 1, con
      // anchos redondeados): «+N» queda recortado ese tramo en inline. Se anota aparte; más de 2px sigue siendo defecto
      if (e.matches('.g-summary__more') && L === 'inline' && cross > 1 && cross <= 2) { it.open = `«+N» recortado ${cross.toFixed(1)}px (cuerpo ${su.querySelector('.g-summary__body').scrollWidth}/${su.querySelector('.g-summary__body').clientWidth})`; return }
      if (cross > 1) it.bad.push('cruza el borde: ' + e.className)
      if (e.matches('.g-summary__status')) return
      const ell = cs.textOverflow === 'ellipsis'
      if (!visIn(e) && !ell) it.bad.push((e.matches('.g-summary__fact') ? 'dato cortado a medias: ' : 'cortado sin elipsis: ') + e.className + ' «' + e.textContent.slice(0, 24) + '»')
      if (L === 'stack' && ell && e.scrollWidth > e.clientWidth + 1) it.bad.push('stack con elipsis: ' + e.className)
    })
    if (L === 'stack' && su.querySelector('[data-clipped]')) it.bad.push('stack recorta datos')
    const code = su.querySelector('.g-summary__code'), anc = su.querySelector('.g-summary__fact.is-anchor')
    const idEl = code || anc?.querySelector('.g-summary__fact-value')
    if (idEl && it.w >= minId) {
      const box = code || anc
      const whole = visIn(idEl) && box.scrollWidth <= box.clientWidth + 1 && (() => { const rg = document.createRange(); rg.selectNodeContents(idEl); const t = rg.getBoundingClientRect(), q = box.getBoundingClientRect(); return t.right <= q.right + 0.01 && t.left >= q.left - 0.01 })()
      if (!whole) {
        const rg = document.createRange(); rg.selectNodeContents(idEl); const need = rg.getBoundingClientRect().width
        const room = (code ? code.parentElement : anc.parentElement).getBoundingClientRect().width
        if (!(su.hasAttribute('data-tight') && need > room - 0.5 && box.title)) it.bad.push(`identificador no entero «${idEl.textContent}» (necesita ${need.toFixed(1)}, hay ${room.toFixed(1)})`)
        else it.idEllipsis = true
      }
    }
    // Identificador anclado: nunca recortado y primero de la corriente (inicio lógico)
    if (anc && L !== 'stack') {
      if (anc.hasAttribute('data-clipped')) it.bad.push('el identificador lleva data-clipped')
      const rtl = getComputedStyle(su).direction === 'rtl', ab = anc.getBoundingClientRect()
      const firstVisible = [...su.querySelectorAll('.g-summary__fact:not([data-clipped])')].filter((f) => !hiddenSr(f) && f.getBoundingClientRect().width).sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top || (rtl ? b.getBoundingClientRect().right - a.getBoundingClientRect().right : a.getBoundingClientRect().left - b.getBoundingClientRect().left))[0]
      if (firstVisible && firstVisible !== anc && L !== 'inline') it.bad.push('el identificador no es el primero de la corriente')
      const flow = su.querySelector('.g-summary__flow').getBoundingClientRect()
      if (L === 'row' && (rtl ? Math.abs(ab.right - flow.right) : Math.abs(ab.left - flow.left)) > 0.5) it.bad.push('el identificador no está anclado al inicio de la corriente')
    }
    // Punto (a): el código, entero o con su elipsis dentro de su caja (nunca cortado sin señal)
    if (code) {
      const rg = document.createRange(); rg.selectNodeContents(code); const t = rg.getBoundingClientRect(), q = code.getBoundingClientRect(), cs = getComputedStyle(code)
      const fits = t.right <= q.right + 0.5 && t.left >= q.left - 0.5 && visIn(code)
      it.code = fits ? 'entero' : cs.textOverflow === 'ellipsis' && visIn(code) ? 'elipsis' : `cortado ${Math.max(t.right - q.right, q.left - t.left, 0).toFixed(1)}px`
      if (!/entero|elipsis/.test(it.code)) (it.w >= minId ? it.bad : it.info).push('código ' + it.code)
    }
    const t = su.querySelector('.g-summary__title')
    if (t && t.getBoundingClientRect().width < 20 && it.w >= minId) it.bad.push('título < 20px')
    su.querySelectorAll('.g-summary__title, .g-summary__fact-label, .g-summary__fact-value, .g-summary__code, .g-summary__status, .g-summary__subtitle').forEach((e) => {
      for (let a = e; a && a !== su.parentElement; a = a.parentElement) {
        const cs = getComputedStyle(a)
        if (cs.display === 'none' || cs.visibility === 'hidden' || a.getAttribute('aria-hidden') === 'true') { it.bad.push('fuera del árbol accesible: ' + e.className); break }
      }
    })
    const facts = [...su.querySelectorAll('.g-summary__fact:not(.is-anchor)')], cl = facts.map((f) => f.hasAttribute('data-clipped'))
    const n = cl.filter(Boolean).length, more = su.querySelector('.g-summary__more'), tight = su.hasAttribute('data-tight'), terse = su.hasAttribute('data-terse')
    if (more) {
      const shown = more.hidden || getComputedStyle(more).display === 'none' ? 0 : parseInt(more.textContent.replace('+', ''), 10)
      if (!tight && shown !== n) it.bad.push(`+N dice ${shown} y hay ${n} recortados`)
      if (tight && shown) it.bad.push('+N visible en data-tight')
      it.more = shown
    }
    const first = cl.indexOf(true); if (first >= 0 && cl.slice(first).some((x) => !x)) it.bad.push('los recortados no son el final de la prioridad')
    if (n && facts.some((f) => f.classList.contains('is-bare')) && !terse && L !== 'stack') it.bad.push('dato recortado sin callar antes los rótulos bare')
    if (tight && !it.multi && n !== facts.length) it.bad.push('data-tight con datos a la vista')
    if (L === 'inline' && t && t.scrollWidth > t.clientWidth + 1 && n !== facts.length && !su.querySelector('.g-summary__code')) it.bad.push('inline: el título cede antes que los datos')
    su.querySelectorAll('[title]').forEach((e) => { if (e.scrollWidth <= e.clientWidth + 1 && !e.closest('.g-btn')) it.bad.push('title en una parte sin elipsis: ' + e.className) })
    const st = su.querySelector('.g-summary__status'), head = su.querySelector('.g-summary__head'), name = su.querySelector('.g-summary__name')
    if (st && L === 'row') {
      const sb = st.getBoundingClientRect(), hb = head.getBoundingClientRect(), stVisible = sb.top < hb.bottom - 1
      const p = document.createElement('span'); p.style.cssText = 'position:absolute;inline-size:7ch'; head.append(p); const ch7 = p.getBoundingClientRect().width; p.remove()
      if (stVisible && name.getBoundingClientRect().width < Math.min(ch7, hb.width) - 1) it.bad.push(`estado a la vista con el nombre en ${name.getBoundingClientRect().width.toFixed(1)} < 7ch ${ch7.toFixed(1)}`)
    }
    it.visible = facts.length - n + (anc ? 1 : 0); it.total = facts.length + (anc ? 1 : 0); it.tight = tight; it.terse = terse
    out.push(it)
  })
  const field = {}; ['sm', 'md', 'lg'].forEach((s) => { field[s] = [document.querySelector(`[data-case="ref-${s}"]`).getBoundingClientRect().height, document.querySelector(`[data-case="field-${s}"]`).getBoundingClientRect().height, document.querySelector(`[data-case="field-dx-${s}"]`).getBoundingClientRect().height] })
  return { items: out, field, docScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1 }
}

/* ---------- Navegador ---------- */
for (const engine of ENGINES) {
  const browser = await pw[engine].launch()
  const errors = []
  const tag = (s) => `${engine} ${s}`
  const t0 = total, f0 = failed
  const newPage = async ({ theme = '', reducedMotion = 'reduce', viewport = { width: 1280, height: 2400 }, forcedColors = 'none', contrast = 'no-preference' } = {}) => {
    const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1 })
    await ctx.route(/unpkg\.com\/vue/, (r) => r.fulfill({ body: VUE, contentType: 'text/javascript' }))
    await ctx.route(/\/playground\/summary\.html/, (r) => r.fulfill({ contentType: 'text/html; charset=utf-8', body: theme ? HTML.replace('<link rel="stylesheet" href="../dist/grana.css">', `$&\n<link rel="stylesheet" href="${THEME_HREF(theme)}">`) : HTML }))
    const page = await ctx.newPage()
    page.on('console', (m) => { if (m.type() === 'error' && !/favicon/.test(m.text())) errors.push(m.text()); if (m.type() === 'warning' && /\[Vue warn\]|\[Grana/.test(m.text())) errors.push(m.text()) })
    page.on('pageerror', (e) => { if (!/ResizeObserver loop/.test(e.message)) errors.push(e.message) })
    try { await page.emulateMedia({ reducedMotion, forcedColors, contrast }) } catch { await page.emulateMedia({ reducedMotion }) }
    return page
  }
  const frames = (p, n = 4) => p.evaluate((n) => new Promise((r) => { const f = (k) => k ? requestAnimationFrame(() => f(k - 1)) : setTimeout(r, 20); f(n) }), n)
  const go = async (p, qs = '') => { await p.goto(PAGE + qs); await p.waitForSelector('[data-ready]'); await p.evaluate(() => document.fonts.ready); await frames(p) }
  const setW = async (p, w) => { await p.evaluate((w) => window.__su.setW(w), w); await frames(p) }
  const close = (p) => p.context().close()

  /* 1 · Barrido (defecto y auditoría) */
  for (const theme of ['', 'auditoria']) {
    const th = theme || 'defecto'
    const page = await newPage({ theme })
    await go(page, '?w=360')
    const heights = new Map(), counts = {}
    let bad = 0
    for (let w = 120; w <= 720; w += 20) {
      await setW(page, w)
      const m = await page.evaluate(`(${probe.toString()})(160)`)
      for (const it of m.items) {
        total++
        for (const b of it.bad) { if (w >= 160) { ok(false, tag(`${th} ${w}px ${it.c}#${it.idx} (${it.layout}): ${b}`)); bad++ } else note(`fuera del contrato (${w}px, informativo)`, tag(`${th} ${it.c}#${it.idx}: ${b}`)) }
        if (it.open) note('hallazgo 2 (ABIERTO, bruno): desborde del cuerpo en inline no detectado', tag(`${th} ${w}px ${it.c}#${it.idx}: ${it.open}`))
        for (const b of it.info) note(`fuera del contrato (${w}px, informativo)`, tag(`${th} ${it.c}#${it.idx}: ${b}`))
        if (it.layout === 'row' && !it.multi && w >= 160) { const k = it.c + '#' + it.idx; (heights.get(k) || heights.set(k, []).get(k)).push(it.h) }
        if (it.code && it.c === 'opt-dx' && [120, 140, 160].includes(w)) note('punto (a): código + icono en la opción', tag(`${th} ${w}px «E11.9» ${it.code}`))
      }
      if (w >= 160) for (const s of ['sm', 'md', 'lg']) { const [ref, f, dx] = m.field[s]; ok(Math.abs(ref - f) < 0.5 && Math.abs(ref - dx) < 0.5, tag(`${th} ${w}px inline Δ0 campo ${s}: ${ref} / ${f} / ${dx}`)) }
      if (w >= 160) ok(!m.docScroll, tag(`${th} ${w}px: la página se desplaza en horizontal`))
      const opt = m.items.find((x) => x.c === 'opt'); if ([160, 240, 360, 520, 720].includes(w)) counts[w] = `${opt.visible}/${opt.total}${opt.terse ? 'r' : ''}${opt.tight ? 't' : ''}`
    }
    for (const [k, hs] of heights) ok(Math.max(...hs) - Math.min(...hs) < 0.5, tag(`${th} row lines 2 de alto variable ${k}: ${Math.min(...hs)}–${Math.max(...hs)}`))
    note('datos visibles en la primera opción 160/240/360/520/720 (r = rótulos callados, t = apretada)', tag(`${th} ` + Object.values(counts).join(' · ')))
    if (!theme) ok(/^1\/4/.test(counts[240]) && /^2\/4/.test(counts[360]) && /^4\/4/.test(counts[520]), tag('opción 240/360/520 ≠ 1/2/4 de 4: ' + JSON.stringify(counts)))
    const rowH = await page.evaluate(() => [...document.querySelectorAll('[data-case="sizes"] .g-summary')].map((s) => s.getBoundingClientRect().height).join('/'))
    note('alto row lines 2 xs/sm/md/lg/xl', tag(`${th} ${rowH}`))
    let prev = 0, mono = true
    for (let w = 160; w <= 720; w += 40) { await setW(page, w); const v = await page.evaluate(() => document.querySelector('[data-case="opt"] .g-summary').querySelectorAll('.g-summary__fact:not([data-clipped])').length); if (v < prev) mono = false; prev = v }
    ok(mono, tag(`${th}: la opción muestra menos datos al ensanchar`))
    note('barrido 160–720', tag(`${th}: ${bad} defectos`))
    await close(page)
  }

  /* 2 · Contraste y tamaño del texto */
  const contrastRun = async (p) => p.evaluate(`(() => { const { pair, parse, over, bgOf, ratio } = ${L}; const out = []
    document.querySelectorAll('[data-case="surfaces"] [data-bg]').forEach((host) => { const b = host.dataset.bg, min = b === 'selection' ? 0 : 4.5
      const [row, stack, empty] = host.querySelectorAll('.g-summary')
      const more = row.querySelector('.g-summary__more:not([hidden])')
      out.push(pair(b + ': título', row.querySelector('.g-summary__title'), min), pair(b + ': rótulo', row.querySelector('.g-summary__fact-label'), min),
        pair(b + ': valor compartido (is-same)', row.querySelector('.g-summary__fact.is-same:not(.is-anchor) .g-summary__fact-value') || stack.querySelector('.is-same .g-summary__fact-value'), min),
        pair(b + ': valor único (is-diff)', row.querySelector('.g-summary__fact.is-diff:not(.is-anchor) .g-summary__fact-value'), min),
        pair(b + ': rótulo stack (caption)', stack.querySelector('.g-summary__fact-label'), min), pair(b + ': código', stack.querySelector('.g-summary__code'), min),
        pair(b + ': secundaria stack', stack.querySelector('.g-summary__subtitle'), min), pair(b + ': marcador vacío', empty.querySelector('.g-summary__title'), min))
      if (more) out.push({ k: b + ': «+N»', r: ratio(parse(getComputedStyle(more).color), over(parse(getComputedStyle(more).backgroundColor), bgOf(host))), min: 4.5, fs: parseFloat(getComputedStyle(more).fontSize) })
    })
    const sel = document.querySelector('[data-case="opt"] [aria-selected="true"] .g-summary')
    out.push(pair('opción seleccionada (surface-sunken): rótulo', sel.querySelector('.g-summary__fact-label'), 4.5), pair('opción seleccionada (surface-sunken): compartido', sel.querySelector('.is-same:not(.is-anchor) .g-summary__fact-value'), 4.5))
    const sep = document.querySelector('[data-case="opt"] .g-summary__fact:not(.is-anchor)'); const sb = parse(getComputedStyle(sep, '::before').borderInlineStartColor)
    out.push({ k: 'filete / superficie (decorativo, informativo)', r: ratio(over(sb, bgOf(sep)), bgOf(sep)), min: 0 })
    return out.filter(Boolean) })()`)
  {
    const worst = {}, small = new Set()
    const THEMES = engine === 'chromium' ? ['', 'auditoria', ...GEN] : ['', 'auditoria', 'spotify']
    for (const theme of THEMES) for (const dark of [false, true]) {
      if (engine !== 'chromium' && theme === 'spotify' && !dark) continue
      const p = await newPage({ theme, viewport: { width: 1280, height: 1600 } })
      await go(p, '?w=360' + (dark ? '&dark=1' : ''))
      const m = await contrastRun(p), t = `${theme || 'defecto'} ${dark ? 'oscuro' : 'claro'}`
      ok(m.some((c) => c.k.endsWith('«+N»')), tag(`${t}: «+N» no visible en el caso de superficies`))
      for (const c of m) { ok(c.r >= c.min, tag(`${t}: ${c.k} ${c.r}:1 < ${c.min}`)); worst[c.k] = Math.min(worst[c.k] ?? 99, c.r); if (c.fs && c.fs < 12) small.add(`${c.k} ${c.fs}px`) }
      ok(!small.size, tag(`${t}: texto < 12px: ${[...small]}`))
      if (theme === 'auditoria') note('contraste con el tema de auditoría', tag(`${t}: ` + m.filter((c) => /rótulo$|is-same|«\+N»|código/.test(c.k)).map((c) => `${c.k} ${c.r}`).join(' · ')))
      await close(p)
    }
    note('contraste mínimo', tag(Object.entries(worst).map(([k, v]) => `${k} ${v}`).join(' · ')))
    // prefers-contrast: more (rótulo y compartido a text-muted)
    for (const theme of ['', 'auditoria']) {
      const p = await newPage({ theme, contrast: 'more', viewport: { width: 1280, height: 1600 } })
      await go(p, '?w=360')
      const active = await p.evaluate(() => matchMedia('(prefers-contrast: more)').matches)
      if (!active) { note('prefers-contrast: more', tag('no emulable')); await close(p); continue }
      const m = await contrastRun(p)
      const sel = m.filter((c) => /^selection: (rótulo|valor compartido)/.test(c.k)).map((c) => `${c.k.split(': ')[1]} ${c.r}`)
      const muted = await p.evaluate(() => { const i = document.createElement('i'); i.style.color = 'var(--g-color-text-muted)'; document.body.append(i); const v = getComputedStyle(i).color; i.remove(); const l = document.querySelector('[data-case="opt"] .g-summary__fact-label'); return getComputedStyle(l).color === v })
      ok(muted, tag(`${theme || 'defecto'} prefers-contrast: more: el rótulo no pasa a text-muted`))
      for (const c of m) if (c.min) ok(c.r >= c.min, tag(`${theme || 'defecto'} contraste más: ${c.k} ${c.r}`))
      note('prefers-contrast: more (sobre selection, informativo)', tag(`${theme || 'defecto'}: ${sel.join(' · ')}`))
      await close(p)
    }
  }

  /* 3 · Pesos de B */
  for (const theme of ['', 'auditoria']) {
    const p = await newPage({ theme })
    await go(p, '?w=520')
    const wt = await p.evaluate(() => { const fw = (s) => { const e = document.querySelector(s); return e ? Number(getComputedStyle(e).fontWeight) : 0 }
      const tok = (() => { const i = document.createElement('i'); i.style.fontWeight = 'var(--g-text-title-sm-weight)'; document.body.append(i); const v = Number(getComputedStyle(i).fontWeight); i.remove(); return v })()
      const mk = document.querySelector('[data-case="opt"] .g-summary__mark'), a = document.querySelector('[data-case="opt"] .is-anchor .g-summary__fact-value'), t = document.querySelector('[data-case="opt"] .g-summary__title')
      return { diff: fw('[data-case="opt"] .is-diff:not(.is-anchor) .g-summary__fact-value'), same: fw('[data-case="opt"] .is-same:not(.is-anchor) .g-summary__fact-value'), anchor: fw('[data-case="opt"] .is-anchor .g-summary__fact-value'), title: fw('[data-case="opt"] .g-summary__title'), tok,
        anchorColor: getComputedStyle(a).color === getComputedStyle(t).color, mark: mk ? [Number(getComputedStyle(mk).fontWeight), getComputedStyle(mk).textDecorationLine, getComputedStyle(mk).backgroundColor] : null } })
    const th = theme || 'defecto'
    ok(wt.diff === wt.tok && wt.diff > wt.same, tag(`${th}: único ${wt.diff} / compartido ${wt.same} / título ${wt.tok}`))
    ok(wt.anchor === wt.tok && wt.title === wt.tok && wt.anchorColor, tag(`${th}: identificador ${wt.anchor} o se apaga`))
    ok(wt.mark && wt.mark[0] === wt.tok && wt.mark[1].includes('underline') && /rgba\(0, 0, 0, 0\)|transparent/.test(wt.mark[2]), tag(`${th}: coincidencia ${wt.mark}`))
    await close(p)
  }

  /* 4 · Carga Δ0 y de carga a datos */
  for (const theme of ['', 'auditoria']) {
    const th = theme || 'defecto'
    const p = await newPage({ theme })
    await go(p, '?w=360')
    for (const w of [240, 360, 520]) {
      await setW(p, w)
      const c = await p.evaluate(`(() => { const { parse, over, bgOf, ratio } = ${L}; const H = (k) => [...document.querySelectorAll('[data-pair="' + k + '"]')].map((e) => (e.querySelector('.g-summary') || e).getBoundingClientRect().height)
        const r4 = document.querySelectorAll('[data-pair="row4"] .g-summary'); const head = r4[0].querySelector('.g-summary__head').getBoundingClientRect().height
        const lh = parseFloat(getComputedStyle(r4[0].querySelector('.g-summary__data')).lineHeight), gap = parseFloat(getComputedStyle(r4[0].querySelector('.g-summary__flow')).rowGap)
        const bones = [...document.querySelectorAll('.is-loading .g-summary__bone')].map((b) => ratio(over(parse(getComputedStyle(b).backgroundColor), bgOf(b.parentElement)), bgOf(b.parentElement)))
        return { row2: H('row2'), inline: H('inline').length ? [...document.querySelectorAll('[data-pair="inline"]')].map((e) => e.getBoundingClientRect().height) : [], row4: [r4[1].getBoundingClientRect().height, head + 3 * lh + 2 * gap], bones: Math.min(...bones) } })()`)
      ok(Math.abs(c.row2[0] - c.row2[1]) < 0.5, tag(`${th} ${w}px carga row lines 2 Δ ${c.row2}`))
      ok(Math.abs(c.inline[0] - c.inline[1]) < 0.5, tag(`${th} ${w}px carga inline Δ ${c.inline}`))
      ok(Math.abs(c.row4[0] - c.row4[1]) < 0.5, tag(`${th} ${w}px carga row lines 4 ${c.row4}`))
      ok(c.bones >= 1.15, tag(`${th} ${w}px formas de carga ${c.bones}:1`))
      if (w === 360) note('carga: forma/fondo mínimo', tag(`${th} ${c.bones}:1`))
    }
    await setW(p, 300)
    const before = await p.evaluate(() => document.querySelector('[data-test="swap"]').getBoundingClientRect().height)
    await p.click('#t-load'); await frames(p)
    const after = await p.evaluate(() => { const s = document.querySelector('[data-test="swap"]'); return { h: s.getBoundingClientRect().height, more: s.querySelector('.g-summary__more')?.hidden, enter: s.querySelectorAll('[data-enter]').length } })
    ok(Math.abs(after.h - before) < 0.5 && after.enter === 0, tag(`${th}: de carga a datos ${before} → ${after.h}, entradas ${after.enter}`))
    await close(p)
  }

  /* 5 · Entrada y movimiento reducido (tema de auditoría: space 5 ⇒ 15px) */
  for (const theme of ['', 'auditoria']) {
    const th = theme || 'defecto'
    const p = await newPage({ theme, reducedMotion: 'no-preference' })
    await go(p, '?w=360')
    ok(!(await p.evaluate(() => document.querySelectorAll('[data-enter]').length)), tag(`${th}: data-enter al montar`))
    const tok = await p.evaluate(() => { const i = document.createElement('i'); i.style.cssText = 'transition-duration: var(--g-duration-slow); inline-size: calc(var(--g-space-1) * 3)'; document.body.append(i); const cs = getComputedStyle(i); const v = { dur: parseFloat(cs.transitionDuration) * (cs.transitionDuration.endsWith('ms') ? 1 : 1000), dx: parseFloat(cs.inlineSize) }; i.remove(); return v })
    const run = async (sel) => {
      await setW(p, 190); await p.waitForTimeout(300)
      await p.evaluate((sel) => { const su = document.querySelector(sel); const log = window.__log = { names: new Set(), samples: [], seen: 0, dur: 0 }
        const mo = new MutationObserver((ms) => ms.forEach((m) => { const f = m.target; if (!f.hasAttribute('data-enter')) return; log.seen++
          const an = f.getAnimations().find((x) => x.animationName?.startsWith('g-summary-enter')); if (!an) return; log.names.add(an.animationName)
          if (log.samples.length) return
          const d = an.effect.getComputedTiming().duration; log.dur = d; an.pause()
          for (const k of [0, 0.25, 0.5]) { an.currentTime = d * k; const cs = getComputedStyle(f); log.samples.push([+parseFloat(cs.opacity).toFixed(2), cs.translate]) }
          an.play() }))
        mo.observe(su, { subtree: true, attributes: true, attributeFilter: ['data-enter'] }); log.mo = mo }, sel)
      await setW(p, 560); await p.waitForTimeout(1400)
      return p.evaluate((sel) => { const l = window.__log; l.mo.disconnect(); return { names: [...l.names], seen: l.seen, dur: l.dur, samples: l.samples, left: document.querySelectorAll(sel + ' [data-enter]').length } }, sel)
    }
    for (const [sel, name, sign] of [['[data-case="opt"] .g-summary', 'g-summary-enter', -1], ['[data-case="rtl-opt"] .g-summary', 'g-summary-enter-rtl', 1]]) {
      const r = await run(sel)
      const x0 = r.samples[0] ? parseFloat(r.samples[0][1]) : NaN
      ok(r.seen > 0 && r.left === 0 && r.names.length === 1 && r.names[0] === name, tag(`${th} entrada ${name}: ${JSON.stringify(r)}`))
      ok(r.samples.length === 3 && r.samples[0][0] === 0 && r.samples[1][0] > 0 && r.samples[1][0] < 1 && r.samples[2][0] > r.samples[1][0], tag(`${th} ${name}: opacidad ${JSON.stringify(r.samples)}`))
      ok(Math.sign(x0) === sign && Math.abs(Math.abs(x0) - tok.dx) < 0.5 && Math.abs(parseFloat(r.samples[2][1])) < Math.abs(x0), tag(`${th} ${name}: desplazamiento ${x0} ≠ ${sign * tok.dx}`))
      ok(Math.abs(r.dur - tok.dur) < 1, tag(`${th} ${name}: duración ${r.dur} ≠ --g-duration-slow ${tok.dur}`))
      note('entrada: duración, desplazamiento inicial y muestras 0/25/50 %', tag(`${th} ${name} ${r.dur}ms ${x0}px ${JSON.stringify(r.samples.map((s) => s[0]))}`))
    }
    await close(p)
    const q = await newPage({ theme, reducedMotion: 'reduce' })
    await go(q, '?w=360'); await setW(q, 190); await q.waitForTimeout(200)
    await q.evaluate(() => { window.__n = 0; const t = () => { window.__n += document.querySelectorAll('[data-enter]').length; if (!window.__stop) requestAnimationFrame(t) }; requestAnimationFrame(t) })
    await setW(q, 560); await q.waitForTimeout(500)
    const n = await q.evaluate(() => { window.__stop = true; const f = document.querySelector('[data-case="opt"] .g-summary__fact:not(.is-anchor)'); f.setAttribute('data-enter', ''); const a = getComputedStyle(f).animationName; f.removeAttribute('data-enter'); return { n: window.__n, a } })
    ok(n.n === 0 && n.a === 'none', tag(`${th} reduce: data-enter ${n.n}, animación ${n.a}`))
    await close(q)
  }

  /* 6 · forced-colors emulado */
  for (const theme of ['', 'auditoria']) {
    const th = theme || 'defecto'
    const p = await newPage({ theme, forcedColors: 'active' })
    await go(p, '?w=360')
    const f = await p.evaluate(() => { const sys = (c, prop = 'color') => { const i = document.createElement('i'); i.style[prop] = c; document.body.append(i); const v = getComputedStyle(i)[prop]; i.remove(); return v }
      const fact = document.querySelector('[data-case="opt"] .g-summary__fact:not(.is-anchor)'), more = document.querySelector('[data-case="surfaces"] .g-summary__more:not([hidden])'), bone = document.querySelector('.is-loading .g-summary__bone'), icon = document.querySelector('[data-case="opt-dx"] .g-summary__lead > .g-icon')
      const fw = (s) => Number(getComputedStyle(document.querySelector(s)).fontWeight)
      const red = document.createElement('i'); red.style.color = 'rgb(255, 0, 0)'; document.body.append(red); const forcing = getComputedStyle(red).color !== 'rgb(255, 0, 0)'; red.remove()
      return { active: matchMedia('(forced-colors: active)').matches, forcing, sep: getComputedStyle(fact, '::before').borderInlineStartColor, ct: sys('CanvasText'), more: more && getComputedStyle(more).borderTopColor, moreText: more && getComputedStyle(more).color, bone: getComputedStyle(bone).backgroundColor, gt: sys('GrayText', 'backgroundColor'), canvas: sys('Canvas', 'backgroundColor'),
        icon: icon ? [getComputedStyle(icon).outlineStyle, getComputedStyle(icon).outlineColor] : null,
        diff: fw('[data-case="opt"] .is-diff:not(.is-anchor) .g-summary__fact-value'), same: fw('[data-case="opt"] .is-same:not(.is-anchor) .g-summary__fact-value'), mark: getComputedStyle(document.querySelector('[data-case="opt"] .g-summary__mark')).textDecorationLine } })
    if (!f.active) { note('forced-colors', tag(`${th}: emulación no disponible`)); await close(p); continue }
    ok(f.sep === f.ct, tag(`${th} forced-colors: filete ${f.sep} ≠ CanvasText ${f.ct}`))
    ok(f.more === f.ct && (!f.forcing || f.moreText === f.ct), tag(`${th} forced-colors: «+N» borde ${f.more} texto ${f.moreText}`))
    ok(f.bone === f.gt && f.bone !== f.canvas, tag(`${th} forced-colors: forma ${f.bone} ≠ GrayText`))
    ok(f.icon && f.icon[0] === 'solid' && f.icon[1] === f.ct, tag(`${th} forced-colors: caja del icono sin contorno ${f.icon}`))
    ok(f.diff > f.same && f.mark.includes('underline'), tag(`${th} forced-colors: peso ${f.diff}/${f.same} o coincidencia sin subrayado`))
    note('forced-colors', tag(`${th}${f.forcing ? '' : ' (el motor solo emula la consulta; no fuerza los colores del autor)'}: filete y «+N» CanvasText, caja del icono con contorno, formas GrayText, peso ${f.diff}/${f.same}, coincidencia subrayada`))
    await close(p)
  }

  /* 7 · Bidi, móvil 320 y acción de stack */
  for (const theme of ['', 'auditoria']) {
    const th = theme || 'defecto'
    const p = await newPage({ theme })
    await go(p, '?w=360')
    for (const w of [160, 240, 360, 520]) {
      await setW(p, w)
      const b = await p.evaluate(() => {
        const lat = document.querySelector('[data-case="rtl-latin"] .is-anchor'); const l = lat.querySelector('.g-summary__fact-label').getBoundingClientRect(), v = lat.querySelector('.g-summary__fact-value').getBoundingClientRect()
        const ar = document.querySelector('[data-case="rtl-opt"] .is-anchor'); const al = ar.querySelector('.g-summary__fact-label').getBoundingClientRect(), av = ar.querySelector('.g-summary__fact-value').getBoundingClientRect()
        const scroll = [...document.querySelectorAll('[dir="rtl"]')].some((s) => s.scrollWidth > s.clientWidth + 1 || [...s.querySelectorAll('.lb, .fld, .pv')].some((x) => x.scrollWidth > x.clientWidth + 1))
        const su = document.querySelector('[data-case="rtl-opt"] .g-summary'), lead = su.querySelector('.g-summary__lead').getBoundingClientRect(), body = su.querySelector('.g-summary__body').getBoundingClientRect()
        const f = su.querySelector('.g-summary__fact:not(.is-anchor):not([data-clipped])'), fb = f && getComputedStyle(f, '::before')
        const fl = document.querySelector('[data-case="opt"] .g-summary__fact:not(.is-anchor):not([data-clipped])'), fbl = fl && getComputedStyle(fl, '::before')
        return { latinOrder: l.left > v.left || lat.closest('[data-tight]') != null, arOrder: al.left > av.left || ar.closest('[data-tight]') != null, scroll,
          leadRight: lead.left >= body.right - 0.5, sepRtl: fb ? parseFloat(fb.borderRightWidth) > 0 && parseFloat(fb.borderLeftWidth) === 0 : null, sepLtr: fbl ? parseFloat(fbl.borderLeftWidth) > 0 && parseFloat(fbl.borderRightWidth) === 0 : null,
          dirs: [...document.querySelectorAll('[data-case^="rtl"] :is(.g-summary__title, .g-summary__fact-label, .g-summary__fact-value, .g-summary__subtitle)')].every((e) => e.getAttribute('dir') === 'auto') }
      })
      ok(b.latinOrder && b.arOrder, tag(`${th} ${w}px RTL: el rótulo no va antes (a la derecha) del valor`))
      ok(!b.scroll, tag(`${th} ${w}px RTL: el anfitrión se desplaza`))
      ok(b.leadRight, tag(`${th} ${w}px RTL: la identidad no está a la derecha`))
      ok(b.sepRtl !== false && b.sepLtr !== false, tag(`${th} ${w}px: filete al lado equivocado (RTL ${b.sepRtl}, LTR ${b.sepLtr})`))
      ok(b.dirs, tag(`${th}: dir="auto" ausente`))
    }
    // Acción de stack: área ≥ 24px y foco visible por teclado
    const a = await p.evaluate(() => { const btn = document.querySelector('[data-case="preview"] .g-summary__action .g-btn'); const r = btn.getBoundingClientRect(); return { w: r.width, h: r.height } })
    ok(a.w >= 24 && a.h >= 24, tag(`${th}: acción de stack ${a.w}×${a.h} < 24`))
    await p.focus('[data-case="preview"] .g-summary__action .g-btn'); await p.keyboard.press('Shift+Tab'); await p.keyboard.press('Tab')
    const fo = await p.evaluate(() => { const btn = document.activeElement; const cs = getComputedStyle(btn); return { isBtn: btn.matches('.g-btn'), outline: cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0 || cs.boxShadow !== 'none' } })
    ok(!fo.isBtn || fo.outline, tag(`${th}: la acción de stack sin foco visible`))
    note('acción de stack (GBtn sm)', tag(`${th}: ${a.w.toFixed(0)}×${a.h.toFixed(0)}px, foco ${fo.isBtn ? (fo.outline ? 'visible' : 'NO visible') : 'no alcanzado con Tab (WebKit sin acceso total por teclado)'}`))
    await close(p)
    const m = await newPage({ theme, viewport: { width: 320, height: 2400 } })
    await go(m, '?w=320')
    const s = await m.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    ok(s <= 1, tag(`${th} móvil 320: desplazamiento horizontal ${s}px`))
    await close(m)
  }

  /* --perf · punto (b): 500 fichas; del cambio de ancho a la devolución del observador, con y sin contain / :has(), y
     cambiando el ancho como el banco (propiedad --pw heredada por las 500 fichas) o como un redimensionado real
     (grid-template-columns en el contenedor, sin tocar el estilo heredado) */
  if (args.perf) {
    const res = []
    for (const mode of ['--pw heredada', 'grid directo']) for (const variant of ['base', 'sin :has()', 'sin contain', 'sin CSS de GSummary']) {
      const p = await newPage({ viewport: { width: 1280, height: 900 } })
      await go(p, '?w=360&n=500')
      await p.evaluate(async ([variant, mode]) => {
        const kill = (pred) => { const walk = (list, owner) => { for (let i = list.length - 1; i >= 0; i--) { const r = list[i]; if (r.cssRules && !r.selectorText) walk(r.cssRules, r); else if (r.selectorText && pred(r.selectorText)) owner.deleteRule(i) } }; for (const s of document.styleSheets) { try { walk(s.cssRules, s) } catch {} } }
        if (/:has/.test(variant)) kill((s) => /g-summary/.test(s) && /:has\(/.test(s))
        if (/CSS de/.test(variant)) kill((s) => /g-summary/.test(s))
        if (/contain/.test(variant)) document.head.insertAdjacentHTML('beforeend', '<style>.g-summary{contain:none}</style>')
        if (/directo/.test(mode)) window.__su.setPw = (v) => { document.querySelector('.perf').style.gridTemplateColumns = 'repeat(auto-fill, minmax(' + v + 'px, 1fr))' }
        document.querySelector('.perf').scrollIntoView()
        window.__roT = 0
        new ResizeObserver(() => { window.__roT = performance.now() }).observe(document.querySelector('.perf > .g-summary'))
        await new Promise((r) => setTimeout(r, 500))
      }, [variant, mode])
      const ro = []
      for (let k = 0; k < 2; k++) for (const [w, back] of [[180, 260], [320, 200], [220, 300]]) {
        ro.push(await p.evaluate((w) => new Promise((resolve) => { const t0 = performance.now(); window.__su.setPw(w)
          const tick = () => { if (window.__roT > t0) resolve(window.__roT - t0); else if (performance.now() - t0 > 4000) resolve(-1); else setTimeout(tick, 5) }; setTimeout(tick, 5) }), w))
        await p.waitForTimeout(700)
        await p.evaluate((v) => { window.__su.setPw(v); document.body.offsetHeight }, back); await p.waitForTimeout(700)
      }
      const med = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)].toFixed(0)
      res.push(`${mode} · ${variant}: ${med(ro)} ms`)
      await close(p)
    }
    note('punto (b): 500 fichas, del cambio de ancho a la devolución del observador (mediana de 6)', tag(res.join(' | ')))
  }

  ok(!errors.length, tag('consola: ' + [...new Set(errors)].slice(0, 3).join(' | ')))
  perEngine[engine] = `${total - t0 - (failed - f0)}/${total - t0}`
  await browser.close()
}
server.close()

console.log(`\nGSummary · auditoría (componente real): ${total - failed}/${total} comprobaciones · ${Object.entries(perEngine).map(([k, v]) => `${k} ${v}`).join(' · ')}`)
for (const [k, v] of Object.entries(measures)) { console.log('· ' + k); [...new Set(v)].slice(0, args.verbose ? 400 : 40).forEach((x) => console.log('    ' + x)) }
if (fails.length) { console.log('\nFallos:'); [...new Set(fails)].slice(0, args.verbose ? 400 : 60).forEach((f) => console.log('  ✗ ' + f)) }
process.exit(failed ? 1 : 0)
