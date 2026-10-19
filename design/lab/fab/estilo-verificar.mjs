// Verificación de coco sobre el banco de GFab (design/lab/fab/estilo-banco.html), con el CSS real cargado en la capa
// grana.components y GBtn y GTooltip reales de dist/ como FAB, principal y cola.
// Mide: análisis estático del CSS (literales, respaldos, tokens que existen y tokens de color permitidos, sin brand, sin
// muelle ni rebote, keyframes g-fab-*, display solo bajo :popover-open, reducido/forzados/táctil); geometría (FAB 52 × 52,
// margen al borde, píldoras ≥ 40px y ≥ 44px con puntero grueso, semillas concéntricas con el FAB, sin solapes y dentro del
// visor, las cuatro primeras quietas de 6 a 15, panel dentro con el FAB fuera, C con la cola de 44px y el panel a space × 3,
// insignia en la esquina de dentro a 45°, se aparta con 24px visibles en las seis posiciones y en RTL, 320px sin
// desplazamiento horizontal, texto al 200 %); movimiento (salida desde el FAB: la semilla nace en el centro del FAB,
// escalonado fast × i / 8, salida corta, nada > 240ms, C con recorte y relleno de la cola en slow, reducido = solo
// fundidos); contraste en el tema por defecto, NisaNabani y los once generados, claro y oscuro, y dentro de la zona de
// marca; foco visible; forced-colors (Chromium); consola limpia. Velo táctil en cuatro piezas (#668): seis posiciones × LTR
// y RTL, el toque en el FAB llega al FAB y fuera de la ventana (también en la franja entre el FAB y su borde) es velo, las
// piezas cubren el visor menos la ventana sin solaparse, sin costuras (píxeles), con anchor="container" el visor entero.
// Acuse en el elemento (#669): en curso sin tachado ni aspecto de deshabilitada, fallo con el motivo en danger-text.
// Remates de #677 y #678: la fila armada conserva su ancho con --_armed-w (nada se mueve al armar); junta de C con una sola
// línea (reposo, hover y active, con marca pálida, RTL y forzados; contorno exterior entero); single y principal
// deshabilitadas con el aspecto de GBtn deshabilitado y contorno border-control (#686); --_minh exacto: la sombra de la pila no asoma
// por el lado lejano del panel que la cubre (lo del lado del FAB y la pila más ancha que el panel, medido como nota).
// Ejecutar desde la raíz del repo (requiere dist/):  GRANA_PW_PORT=4214 node design/lab/fab/estilo-verificar.mjs
// Opcional: --engines=chromium,firefox,webkit  --themes=all|base (por defecto: todos en Chromium, base en Firefox y WebKit)  --verbose
//   --dist=<carpeta> sirve /packages/vue/dist/ desde una copia (para no medir un dist/ a medio reconstruir por otro agente)
import http from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const pw = await import(new URL('../theme-playground/node_modules/playwright/index.mjs', import.meta.url))
const ROOT = fileURLToPath(new URL('../../../', import.meta.url))
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')).map(([k, v]) => [k, v ?? true]))
const ENGINES = (args.engines || 'chromium,firefox,webkit').split(',')
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const server = http.createServer(async (req, res) => {
  try {
    const u = decodeURIComponent(new URL(req.url, 'http://x').pathname)
    const p = args.dist && u.startsWith('/packages/vue/dist/') ? normalize(join(String(args.dist), u.slice(19))) : normalize(join(ROOT, u))
    if (!p.startsWith(ROOT) && !(args.dist && p.startsWith(normalize(String(args.dist))))) throw new Error('fuera')
    const body = await readFile(p)
    res.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream' }).end(body)
  } catch { res.writeHead(404).end() }
})
await new Promise((r) => server.listen(Number(process.env.GRANA_PW_PORT) || 4244, '127.0.0.1', r))
const BASE = `http://127.0.0.1:${server.address().port}/design/lab/fab/estilo-banco.html`

const GEN = ['amazon', 'apple', 'caracol-purpura', 'github', 'grana', 'linear', 'lustre', 'medium', 'notion', 'spotify', 'stripe']
let total = 0, failed = 0
const fails = [], notes = [], counts = {}
let ENG = 'estático'
const ok = (cond, msg) => { total++; counts[ENG] = (counts[ENG] || 0) + 1; if (!cond) { failed++; fails.push(msg) } }
const note = (s) => notes.push(s)
const mins = {}
const track = (k, v) => { if (!(k in mins) || v < mins[k].v) mins[k] = { v } }

/* ---------- 0 · Análisis estático del CSS ---------- */
{
  const raw = await readFile(join(ROOT, 'packages/vue/src/components/GFab/GFab.css'), 'utf8')
  const css = raw.replace(/\/\*[\s\S]*?\*\//g, '')
  ok(!/#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|lab|lch|hwb)\(/.test(css), 'CSS: color literal')
  ok([...css.matchAll(/color-mix\(([^;]*)\)/g)].every((m) => /currentColor/.test(m[1]) && !/#|\brgba?\(/.test(m[1])), 'CSS: color-mix que no parte de currentColor')
  const named = [...css.matchAll(/(?:color|background(?:-color)?|border[\w-]*|outline[\w-]*)\s*:[^;]*\b(CanvasText|Canvas|Highlight|ButtonText|GrayText|LinkText|red|blue|black|white|transparent)\b/g)].map((m) => m[1])
  ok(named.every((w) => ['CanvasText', 'Highlight', 'GrayText', 'LinkText', 'transparent'].includes(w)), 'CSS: color con nombre no permitido: ' + named)
  ok(!/ButtonFace/.test(css.replace(/@media \(forced-colors: active\) \{[\s\S]*?\n\}/g, '')), 'CSS: ButtonFace fuera de forced-colors')
  ok(!/var\(\s*--[\w-]+\s*,/.test(css), 'CSS: var() con valor de respaldo')
  ok(!/@layer/.test(css) && !/!important/.test(css), 'CSS: @layer o !important')
  const vars = [...css.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1])
  ok(vars.every((v) => v.startsWith('--g-') || v.startsWith('--_')), 'CSS: var() que no es --g-* ni --_*')
  const defaults = await readFile(join(ROOT, 'packages/vue/src/styles/defaults.css'), 'utf8')
  const defined = new Set([...defaults.matchAll(/(--g-[a-z0-9-]+)\s*:/g)].map((m) => m[1]))
  const missing = [...new Set(vars.filter((v) => v.startsWith('--g-') && !defined.has(v)))]
  ok(!missing.length, 'CSS: tokens que no existen en defaults.css: ' + missing)
  ok(!vars.some((v) => /^--g-color-(on-)?brand/.test(v)), 'CSS: lee --g-color-brand* (roles.test.js: primary)')
  // Tokens de color: los de tokens.md §47 (con los bordes -text de las insignias de #673) y primary (relleno de partida del
  // panel de C, en la lista de la zona §44.5). primary-text ya no: el contorno del FAB lo pinta GBtn solid (#672, #678)
  const allowed = ['--g-color-surface', '--g-color-surface-sunken', '--g-color-border', '--g-color-border-control', '--g-color-text', '--g-color-text-muted', '--g-color-text-subtle', '--g-color-danger-text', '--g-color-danger', '--g-color-on-danger', '--g-color-success', '--g-color-success-text', '--g-color-on-success', '--g-color-focus', '--g-surface-backdrop', '--g-color-primary', '--g-color-neutral-soft']
  const colors = [...new Set(vars.filter((v) => v.startsWith('--g-color') || v.startsWith('--g-surface')))]
  ok(colors.every((v) => allowed.includes(v)), 'CSS: tokens de color fuera de la lista: ' + colors.filter((v) => !allowed.includes(v)))
  note(`[estático] tokens de color leídos: ${colors.join(', ')}`)
  const own = new Set([...css.matchAll(/(--_[\w-]+)\s*:/g)].map((m) => m[1]))
  const strange = [...new Set(vars.filter((v) => v.startsWith('--_') && !own.has(v)))]
  ok(!strange.length, 'CSS: lee alias --_* que no declara: ' + strange)
  const px = [...css.matchAll(/(-?\d*\.?\d+)px/g)].map((m) => m[0])
  ok(px.every((p) => ['24px', '44px', '1px', '-1px'].includes(p)), 'CSS: medidas literales no permitidas: ' + px.filter((p) => !['24px', '44px', '1px', '-1px'].includes(p)))
  ok((css.match(/(?<!-)\b1px\b/g) || []).length === 4 && (css.match(/-1px/g) || []).length === 2, 'CSS: 1px / -1px solo en el patrón de texto oculto (g-fab__sr y la descripción de la pila)')
  ok(!/\d(?:rem|em|ch|vh|vw|vmin|vmax|dvh|svh)\b/.test(css), 'CSS: rem/em/ch/vh/vw literales')
  ok(!/\d(?:ms|s)\b/.test(css.replace(/@keyframes[\s\S]*?\}\s*\}/g, '')), 'CSS: duraciones literales')
  ok(!/ease-spring|ease-bounce/.test(css), 'CSS: --g-ease-spring o --g-ease-bounce (no aplican a menús ni paneles, #299, #655)')
  const kf = [...css.matchAll(/@keyframes\s+([\w-]+)/g)].map((m) => m[1])
  ok(kf.length === 1 && kf[0] === 'g-fab-spin', 'CSS: keyframes solo el giro g-fab-spin: ' + kf)
  ok(/@media \(prefers-reduced-motion: reduce\)/.test(css) && /@media \(prefers-reduced-motion: no-preference\)/.test(css) && /@media \(forced-colors: active\)/.test(css) && /@media \(pointer: coarse\)/.test(css), 'CSS: reducido, sin preferencia, forzados y táctil presentes')
  // display de listas y velo solo bajo :popover-open (#383)
  const blocks = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
  const bad = blocks.filter(([, sel, body]) => /\b(g-fab__list|g-fab__scrim)\b[^,]*$/m.test(sel.trim().split(',').pop()) && /(^|;|\s)display\s*:/.test(body) && !/:popover-open/.test(sel) && !/(>\s*li|\.g-fab__item|__find|__confirm|__icon|__desc|li\[hidden\]|::before|\.g-fab__group-title)/.test(sel))
  ok(!bad.length, 'CSS: display en lista o velo fuera de :popover-open: ' + bad.map((b) => b[1].trim()))
  // Transición fuera de las consultas de movimiento: ninguna (patrón único #299 (3))
  const outside = css.replace(/@media \(prefers-reduced-motion: (?:no-preference|reduce)\) \{[\s\S]*?\n\}/g, '')
  const outsideT = [...outside.replace(/@starting-style\s*\{[\s\S]*?\}\s*\}/g, '').matchAll(/([^{}]+)\{([^{}]*transition\s*:[^{}]*)\}/g)]
  ok(outsideT.length === 1 && /data-state="opening"/.test(outsideT[0][1]) && /transition: none;/.test(outsideT[0][2]), 'CSS: fuera de las consultas de movimiento solo «opening» sin transición: ' + outsideT.map((m) => m[1].trim()))
  const reduce = (css.match(/@media \(prefers-reduced-motion: reduce\) \{([\s\S]*?)\n\}/) || [])[1] || ''
  ok(!/transition:\s*none/.test(reduce) && !/translate\s+var|scale\s+var|rotate\s+var|clip-path\s+var/.test(reduce), 'CSS: reducido sin transition: none y sin transiciones de desplazamiento, escala, giro o recorte')
  // Selectores estructurales: solo sobre piezas de la librería (el par de confirmación); ninguno sobre hijos de la aplicación
  const structural = [...css.replace(/\{[^}]*\}/g, '{}').matchAll(/([^{}]*):(first-child|last-child|nth-child|nth-last-child|first-of-type|last-of-type)/g)].map((m) => m[1].trim().split(',').pop().trim() + ':' + m[2])
  ok(structural.every((s) => /g-fab__confirm >$|g-fab__main-group > \.g-btn$|g-fab__list--panel > li$/.test(s.replace(/:(first|last)-(child|of-type).*$/, '').replace(/:not\(.*$/, '').trim())), 'CSS: selector estructural fuera de las piezas propias: ' + structural)
  ok(!/\.g-fab__(trigger|tail)\b/.test(css), 'CSS: clases que el contrato no fija para el disparador')
  ok(!/clip-path\s*:\s*polygon|\bpath\(|\bshape\(/.test(raw), 'CSS: clip-path con polígono, path() o shape() (docs/contract/icons.md, check-icons.mjs)')
  // Velo (#668): cuatro piezas (el elemento, ::before, ::after y span.g-fab__scrim-part), sin transform/filter/contain/
  // will-change (su bloque contenedor es el visor) y sin --_x/--_y/--_w/--_h (el .vue no los escribe en el velo)
  const scrimBlocks = blocks.filter(([, sel]) => /g-fab__scrim/.test(sel) && !/forced-colors/.test(sel))
  ok(/\.g-fab__scrim::before/.test(css) && /\.g-fab__scrim::after/.test(css) && /\.g-fab__scrim > \.g-fab__scrim-part/.test(css), 'CSS: velo sin sus cuatro piezas')
  ok(scrimBlocks.every(([, , body]) => !/(^|;|\s)(transform|filter|contain|will-change|translate|scale|rotate)\s*:/.test(body)), 'CSS: transform, filter, contain o will-change en el velo')
  ok(scrimBlocks.every(([, , body]) => !/var\(--_(x|y|w|h)\)/.test(body)), 'CSS: el velo lee --_x/--_y/--_w/--_h')
  ok(/\(1 - 1 \/ sqrt\(2\)\) \/ 2/.test(css) && !/0\.1464/.test(css), 'CSS: el factor de la insignia escrito como (1 − 1/√2)/2 (#671)')
  // Acuse en el elemento (#669)
  ok(/\.g-fab__item\[aria-disabled="true"\]:not\(\[data-ack="busy"\]\) \.g-fab__label \{ text-decoration: line-through; \}/.test(css), 'CSS: el tachado excluye la acción en curso')
  ok(/\.g-fab__item\[data-ack="failed"\] \.g-fab__reason \{ color: var\(--g-color-danger-text\); \}/.test(css), 'CSS: el motivo del fallo en danger-text')
  // Par de confirmación: hijos directos (#671)
  ok(!/\.g-fab__confirm (?!>)[:.]/.test(css), 'CSS: el par de confirmación se selecciona como hijos directos de .g-fab__confirm')
  // #677: la fila armada lee --_armed-w como min-inline-size (sin respaldo; sin el dato, auto)
  ok(/\.g-fab__list li \{\s*--_armed-w: auto;\s*min-inline-size: var\(--_armed-w\);\s*\}/.test(css), 'CSS: el li de la fila armada aplica --_armed-w como min-inline-size (#677)')
  // #678: el contorno del FAB es de GBtn solid; GFab.css no lee primary-text ni pinta un anillo propio; junta con una sola línea
  ok(!/--g-color-primary-text/.test(css), 'CSS: GFab.css lee --g-color-primary-text (el contorno es de GBtn solid, #678)')
  const fabShadows = blocks.filter(([, sel]) => /\.g-fab > \.g-btn|\.g-fab__main-group(?! >)|\.g-fab__main\b/.test(sel)).map(([, , body]) => (body.match(/box-shadow\s*:\s*([^;]+)/) || [])[1]).filter(Boolean)
  ok(fabShadows.length && fabShadows.every((v) => /^var\(--g-shadow-[12]\)$|^none$/.test(v.trim())), 'CSS: el FAB y el grupo de C solo con su elevación (sin anillo de box-shadow, #678): ' + fabShadows)
  ok(/\.g-fab__main-group > \.g-btn:first-of-type:not\(:last-of-type\) \{[^}]*border-inline-end-color: transparent;/.test(css), 'CSS: junta de C: el borde final de la principal transparente (#678)')
  ok(/\.g-fab__main-group > \.g-btn:first-of-type:not\(:last-of-type\) \{ border-inline-end-color: ButtonFace; \}/.test(css), 'CSS: junta de C en forzados: el borde final de la principal en ButtonFace')
}

/* ---------- Utilidades del navegador ---------- */
const LIB = `
window.__c = (() => {
  const cv = document.createElement('canvas'); cv.width = cv.height = 1
  const cx = cv.getContext('2d', { willReadFrequently: true })
  const rgba = (s) => { cx.clearRect(0, 0, 1, 1); cx.fillStyle = '#000'; cx.fillStyle = s; cx.fillRect(0, 0, 1, 1); const d = cx.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255] }
  const over = (f, b) => [0, 1, 2].map((i) => f[i] * f[3] + b[i] * (1 - f[3])).concat(1)
  const lum = (c) => { const [r, g, b] = c.slice(0, 3).map((v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }); return 0.2126 * r + 0.7152 * g + 0.0722 * b }
  const cr = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) }
  const bgOf = (el) => { const stack = []; for (let n = el; n; n = n.parentElement) { const c = rgba(getComputedStyle(n).backgroundColor); if (c[3] > 0) stack.push(c); if (c[3] >= 1) break } let acc = [255, 255, 255, 1]; for (const c of stack.reverse()) acc = over(c, acc); return acc }
  const txt = (el, bgEl) => { const f = rgba(getComputedStyle(el).color); const b = bgOf(bgEl || el); return cr(over(f, b), b) }
  const tok = (el, name) => rgba(getComputedStyle(el).getPropertyValue(name).trim())
  return { rgba, over, cr, bgOf, txt, tok }
})()`

async function open(browser, q = '', vp = { width: 1000, height: 700 }, extra = {}) {
  const ctx = await browser.newContext({ viewport: vp, ...extra })
  const page = await ctx.newPage()
  const errs = []
  page.on('console', (m) => { if ((m.type() === 'error' || m.type() === 'warning') && !/favicon|404|downloadable font|Download the Vue Devtools|You are running a development build/.test(m.text())) errs.push(m.text()) })
  page.on('pageerror', (e) => errs.push(e.message))
  await page.goto(BASE + (q ? '?' + q : ''), { waitUntil: 'domcontentloaded', timeout: 90000 })
  await page.waitForFunction(() => window.__fabReady, null, { timeout: 90000 })
  await page.evaluate(() => document.fonts.ready)
  await page.evaluate(LIB)
  await page.waitForTimeout(q.includes('slow=1') ? 2500 : 550)
  return { ctx, page, errs }
}
const fabGeom = (page) => page.evaluate(() => {
  const root = document.querySelector('.g-fab'), b = (root.querySelector('.g-fab__main-group') || root.querySelector(':scope > button')).getBoundingClientRect()
  const lis = [...document.querySelectorAll('.g-fab__list--stack:popover-open > li')].map((li) => { const r = li.firstElementChild.getBoundingClientRect(); const ic = li.querySelector('.g-fab__icon'); const ir = ic ? ic.getBoundingClientRect() : null; return { l: r.left, r: r.right, t: r.top, b: r.bottom, w: r.width, h: r.height, id: li.firstElementChild.dataset.id || 'more', icx: ir ? ir.left + ir.width / 2 : null, icy: ir ? ir.top + ir.height / 2 : null } })
  return { fab: { l: b.left, r: b.right, t: b.top, b: b.bottom, w: b.width, h: b.height, cx: b.left + b.width / 2, cy: b.top + b.height / 2 }, lis, vw: document.documentElement.clientWidth, vh: innerHeight, sw: document.documentElement.scrollWidth }
})
const hit = (a, b, m = 0) => a.l < b.r - m && b.l < a.r - m && a.t < b.b - m && b.t < a.b - m

const POS = ['bottom-end', 'bottom-start', 'bottom-center', 'top-end', 'top-start', 'top-center']

for (const engine of ENGINES) {
  const browser = await pw[engine].launch()
  const E = `[${engine}]`
  ENG = engine

  /* ---------- 1 · Geometría de A en las seis posiciones, LTR y RTL ---------- */
  for (const rtl of [false, true]) for (const pos of POS) {
    const { ctx, page, errs } = await open(browser, `scene=a6&open=1&pos=${pos}${rtl ? '&rtl=1' : ''}`)
    const P = `${E}[${pos}${rtl ? '·rtl' : ''}]`
    const g = await fabGeom(page)
    ok(Math.abs(g.fab.w - 52) < 0.01 && Math.abs(g.fab.h - 52) < 0.01, `${P} FAB 52 × 52 (GBtn xl): ${g.fab.w} × ${g.fab.h}`)
    const top = pos.startsWith('top'), endPhys = (pos.endsWith('-end') && !rtl) || (pos.endsWith('-start') && rtl), center = pos.endsWith('-center')
    ok(top ? Math.abs(g.fab.t - 16) < 0.6 : Math.abs(g.vh - g.fab.b - 16) < 0.6, `${P} FAB a space × 4 de su borde de bloque: ${top ? g.fab.t : g.vh - g.fab.b}`)
    if (!center) ok(endPhys ? Math.abs(g.vw - g.fab.r - 16) < 0.6 : Math.abs(g.fab.l - 16) < 0.6, `${P} FAB a space × 4 de su borde en línea`)
    else ok(Math.abs(g.fab.cx - g.vw / 2) < 0.6, `${P} FAB centrado: ${g.fab.cx} vs ${g.vw / 2}`)
    ok(g.lis.length === 5, `${P} pila de 4 + cola: ${g.lis.length}`)
    ok(g.lis.every((p) => p.h >= 40 - 0.01), `${P} píldoras ≥ space × 10: ${g.lis.map((p) => p.h)}`)
    const boxes = g.lis.map((p) => ({ l: p.l, r: p.r, t: p.t, b: p.b }))
    ok(boxes.every((a, i) => boxes.every((b, j) => i === j || !hit(a, b, 0.5))) && boxes.every((a) => !hit(a, g.fab, 0.5)), `${P} píldoras sin solapes entre sí ni con el FAB`)
    ok(boxes.every((a) => a.l >= 8 && a.r <= g.vw - 8 && a.t >= 8 && a.b <= g.vh - 8), `${P} pila dentro del visor con margen ≥ 8px`)
    // Semillas concéntricas con el FAB (esquinas): extremo, semilla y FAB comparten eje
    if (!center) ok(g.lis.every((p) => Math.abs(p.icx - g.fab.cx) < 0.75), `${P} semillas en el eje del FAB: ${g.lis.map((p) => (p.icx - g.fab.cx).toFixed(2))}`)
    if (!center) ok(g.lis.every((p) => Math.abs((endPhys ? p.r - p.h / 2 : p.l + p.h / 2) - g.fab.cx) < 0.75), `${P} extremo redondo de cada píldora concéntrico con el FAB`)
    // La primera de items es la más cercana al FAB (la última del DOM si sube)
    const nearest = top ? g.lis[0] : g.lis[g.lis.length - 1]
    ok(nearest.id === 'sample', `${P} «Nueva muestra» pegada al FAB: ${nearest.id}`)
    // Insignia (acuse) en la esquina de dentro, sobre el borde del círculo a 45°
    await page.evaluate(() => window.__fab.setAck('busy')); await page.waitForTimeout(350)
    const bd = await page.evaluate(() => { const r = document.querySelector('.g-fab__badge').getBoundingClientRect(); return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, w: r.width, op: getComputedStyle(document.querySelector('.g-fab__badge')).opacity } })
    const dist = Math.hypot(bd.cx - g.fab.cx, bd.cy - g.fab.cy)
    ok(Math.abs(dist - 26) < 1.2 && bd.op === '1', `${P} insignia sobre el borde del FAB (r 26): ${dist.toFixed(2)} · opacidad ${bd.op}`)
    ok(top ? bd.cy > g.fab.cy : bd.cy < g.fab.cy, `${P} insignia del lado del contenido (bloque)`)
    if (!center) ok(endPhys ? bd.cx < g.fab.cx : bd.cx > g.fab.cx, `${P} insignia del lado del contenido (línea)`)
    // Se aparta: con la lista cerrada, 24px visibles en su borde; la insignia sigue a la vista
    await page.evaluate(() => window.__fab.close({ focus: false })); await page.waitForTimeout(350)
    await page.evaluate(() => window.__fab.tuck(true)); await page.waitForTimeout(450)
    const t = await page.evaluate(() => { const b = document.querySelector('.g-fab > button').getBoundingClientRect(); const bd = document.querySelector('.g-fab__badge').getBoundingClientRect(); return { l: b.left, r: b.right, t: b.top, b: b.bottom, bl: bd.left, br: bd.right, bt: bd.top, bb: bd.bottom, vw: document.documentElement.clientWidth, vh: innerHeight, sw: document.documentElement.scrollWidth } })
    const vis = center ? (top ? t.b : t.vh - t.t) : endPhys ? t.vw - t.l : t.r
    ok(Math.abs(vis - 24) < 0.6, `${P} apartado: ${vis.toFixed(2)}px visibles (24)`)
    ok(t.bl >= 0 && t.br <= t.vw && t.bt >= 0 && t.bb <= t.vh, `${P} apartado: la insignia sigue dentro del visor`)
    ok(t.sw <= t.vw, `${P} apartado sin desplazamiento horizontal: ${t.sw}`)
    ok(!errs.length, `${P} consola limpia: ${errs}`)
    await ctx.close()
  }

  /* ---------- 2 · Las cuatro primeras quietas de 6 a 15; panel de la cola; C ---------- */
  {
    const a = await open(browser, 'scene=a6&open=1'); const g6 = await fabGeom(a.page); await a.ctx.close()
    const b = await open(browser, 'scene=a15&open=1'); const g15 = await fabGeom(b.page)
    const first = (g) => g.lis.slice(-4)
    const d = Math.max(...first(g6).map((p, i) => Math.max(Math.abs(p.l - first(g15)[i].l), Math.abs(p.t - first(g15)[i].t), Math.abs(p.w - first(g15)[i].w))))
    ok(d <= 0.5, `${E} las cuatro primeras no se mueven de 6 a 15: Δ ${d.toFixed(2)}px`)
    await b.page.evaluate(() => window.__fab.openSub()); await b.page.waitForTimeout(450)
    const p = await b.page.evaluate(() => { const s = document.querySelector('#fab-more').getBoundingClientRect(), f = document.querySelector('.g-fab > button').getBoundingClientRect(), st = document.querySelector('.g-fab__list--stack').getBoundingClientRect(); const more = document.querySelector('.g-fab__item--more'); return { s: { l: s.left, r: s.right, t: s.top, b: s.bottom, w: s.width }, f: { l: f.left, r: f.right, t: f.top, b: f.bottom }, st: { t: st.top }, vw: innerWidth, vh: innerHeight, moreBorder: getComputedStyle(more).borderTopStyle, overflow: getComputedStyle(document.querySelector('#fab-more')).overflowY } })
    ok(p.s.l >= 8 && p.s.r <= p.vw - 8 && p.s.t >= 8 && p.s.b <= p.vh - 8, `${E} panel de la cola dentro del visor`)
    ok(!hit(p.s, p.f), `${E} el FAB queda fuera del panel`)
    ok(Math.abs(p.s.w - 320) < 0.6, `${E} panel de space × 80: ${p.s.w}`)
    ok(p.moreBorder === 'solid', `${E} cola expandida con contorno pleno: ${p.moreBorder}`)
    ok(p.overflow === 'auto', `${E} el panel desplaza: ${p.overflow}`)
    await b.ctx.close()
    const c = await open(browser, 'scene=c&open=1')
    const m = await c.page.evaluate(() => { const grp = document.querySelector('.g-fab__main-group').getBoundingClientRect(); const btns = [...document.querySelectorAll('.g-fab__main-group > button')].map((x) => x.getBoundingClientRect()); const ul = document.querySelector('#fab-menu').getBoundingClientRect(); const cs = getComputedStyle(btns.length && document.querySelectorAll('.g-fab__main-group > button')[0]); return { gh: grp.height, mainW: btns[0].width, tailW: btns[1].width, tailT: btns[1].top, tailL: btns[1].left, ulB: ul.bottom, ulT: ul.top, mainR: cs.borderTopRightRadius, seam: getComputedStyle(document.querySelectorAll('.g-fab__main-group > button')[1]).borderLeftColor, vh: innerHeight } })
    ok(Math.abs(m.gh - 52) < 0.01 && Math.abs(m.tailW - 44) < 0.01, `${E}[C] principal y cola de 52px de alto; cola de 44px: ${m.gh} · ${m.tailW}`)
    ok(m.mainR === '0px', `${E}[C] la principal cede su extremo final: ${m.mainR}`)
    ok(Math.abs(m.tailT - m.ulB - 12) < 0.6, `${E}[C] panel a space × 3 de la cola: ${m.tailT - m.ulB}`)
    ok(m.ulT >= 8, `${E}[C] panel dentro del visor`)
    ok(!/rgba\(0, 0, 0, 0\)/.test(m.seam), `${E}[C] costura visible entre principal y cola: ${m.seam}`)
    ok(!c.errs.length, `${E}[C] consola limpia: ${c.errs}`)
    await c.ctx.close()
  }

  /* ---------- 2b · Remates de #677 y #678 ---------- */
  {
    // Fila armada (#677): --_armed-w en su li; al armar nada se mueve (pila a 1000 y 320px, panel); al deshacer se retira
    for (const [q, vp] of [['scene=a3&open=1', { width: 1000, height: 700 }], ['scene=a3&open=1', { width: 320, height: 640 }], ['scene=panel&open=1', { width: 1000, height: 700 }]]) {
      const r = await open(browser, q, vp)
      const P = `${E}[armada·${q.replace(/scene=|&open=1/g, '')}·${vp.width}]`
      const geo = () => r.page.evaluate(() => [...document.querySelectorAll('.g-fab__list:popover-open li')].map((li) => { const b = li.getBoundingClientRect(); return { l: b.left, t: b.top, w: b.width, v: li.style.getPropertyValue('--_armed-w'), min: getComputedStyle(li).minInlineSize } }))
      const before = await geo()
      const pill = await r.page.evaluate(() => document.querySelector('.g-fab__list [data-id="purge"]').getBoundingClientRect().width)
      await r.page.evaluate(() => window.__fab.arm('purge')); await r.page.waitForTimeout(250)
      const armed = await geo()
      const row = armed.filter((x) => x.v)
      const d = Math.max(...before.map((x, i) => Math.max(Math.abs(x.l - armed[i].l), Math.abs(x.t - armed[i].t), Math.abs(x.w - armed[i].w))))
      ok(row.length === 1 && Math.abs(parseFloat(row[0].v) - pill) < 0.01 && Math.abs(parseFloat(row[0].min) - pill) < 0.01, `${P} --_armed-w en el li armado, aplicado como min-inline-size: ${JSON.stringify(row)} · píldora ${pill}`)
      ok(d <= 0.5, `${P} al armar no se mueve ninguna fila: Δ ${d.toFixed(2)}px`)
      await r.page.keyboard.press('Escape'); await r.page.waitForTimeout(250)
      const after = await geo()
      ok(after.every((x) => !x.v) && !(await r.page.evaluate(() => !!document.querySelector('.g-fab__confirm'))), `${P} al deshacer se retira --_armed-w`)
      ok(!r.errs.length, `${P} consola limpia: ${r.errs}`)
      await r.ctx.close()
    }
    // Junta de C (#678): una sola línea (la costura de la cola) en reposo, hover y active, con el tema por defecto y dos marcas
    // pálidas, también en RTL; el contorno exterior del grupo sigue entero
    for (const q of ['scene=c', 'scene=c&theme=lustre', 'scene=c&theme=spotify', 'scene=c&theme=lustre&rtl=1']) {
      const r = await open(browser, q, { width: 1000, height: 700 }, { deviceScaleFactor: 1 })
      const P = `${E}[junta·${q.replace(/scene=c&?|theme=/g, '') || 'defecto'}]`
      const read = () => r.page.evaluate(() => {
        const [m, t] = document.querySelectorAll('.g-fab__main-group > button'), a = getComputedStyle(m), c = getComputedStyle(t), rtl = getComputedStyle(m).direction === 'rtl'
        const edge = __c.tok(m, '--g-color-primary-text').join(), col = (s) => __c.rgba(s).join()
        const mEnd = rtl ? a.borderLeftColor : a.borderRightColor, mStart = rtl ? a.borderRightColor : a.borderLeftColor
        const tStart = rtl ? c.borderRightColor : c.borderLeftColor, tEnd = rtl ? c.borderLeftColor : c.borderRightColor
        return { mEndOff: __c.rgba(mEnd)[3] === 0, seam: __c.rgba(tStart)[3] > 0 && col(tStart) !== col(c.backgroundColor), outer: [a.borderTopColor, a.borderBottomColor, mStart, c.borderTopColor, c.borderBottomColor, tEnd].every((x) => col(x) === edge) }
      })
      const rest = await read()
      const mb = await r.page.locator('.g-fab__main').boundingBox()
      await r.page.mouse.move(mb.x + mb.width / 2, mb.y + mb.height / 2); await r.page.waitForTimeout(250)
      const hov = await read()
      await r.page.mouse.down(); await r.page.waitForTimeout(250)
      const act = await read()
      await r.page.mouse.up(); await r.page.mouse.move(5, 5); await r.page.waitForTimeout(300)
      ok(rest.mEndOff && hov.mEndOff && act.mEndOff, `${P} el borde final de la principal transparente en reposo, hover y active: ${rest.mEndOff} ${hov.mEndOff} ${act.mEndOff}`)
      ok(rest.seam && hov.seam && act.seam, `${P} la costura de la cola se ve en los tres estados`)
      ok(rest.outer && hov.outer && act.outer, `${P} contorno exterior del grupo entero en primary-text (de GBtn solid): ${rest.outer} ${hov.outer} ${act.outer}`)
      // Píxeles: a media altura, entre los dos rellenos solo hay una columna distinta (la costura)
      await r.page.addStyleTag({ content: '.g-tooltip{visibility:hidden!important}' })
      const j = await r.page.evaluate(() => { const [m, t] = document.querySelectorAll('.g-fab__main-group > button'); const a = m.getBoundingClientRect(), b = t.getBoundingClientRect(); const x = Math.round(getComputedStyle(m).direction === 'rtl' ? a.left : a.right); return { x, y: Math.round(a.top + a.height / 2), mFill: __c.rgba(getComputedStyle(m).backgroundColor), tFill: __c.rgba(getComputedStyle(t).backgroundColor) } })
      const png = (await r.page.screenshot({ clip: { x: j.x - 8, y: j.y, width: 16, height: 1 } })).toString('base64')
      const cols = await r.page.evaluate(async ({ png, j }) => {
        const img = new Image(); img.src = 'data:image/png;base64,' + png; await img.decode()
        const cv = document.createElement('canvas'); cv.width = img.width; cv.height = 1; const cx = cv.getContext('2d'); cx.drawImage(img, 0, 0)
        const d = cx.getImageData(0, 0, img.width, 1).data, near = (i, f) => Math.max(...[0, 1, 2].map((k) => Math.abs(d[i + k] - f[k]))) <= 3
        let n = 0; for (let x = 0; x < img.width; x++) { const i = x * 4; if (!near(i, j.mFill) && !near(i, j.tFill)) n++ } return n
      }, { png, j })
      ok(cols === 1, `${P} una sola línea en la junta (columnas distintas de los rellenos): ${cols}`)
      ok(!r.errs.length, `${P} consola limpia: ${r.errs}`)
      await r.ctx.close()
    }
    // Deshabilitadas (#686): single y principal de C con el aspecto de GBtn deshabilitado (neutral-soft, text-subtle) con
    // contorno border-control (≥ 3:1 frente a la página); single en shadow-1; cursor de no disponible; pasar y apretar no
    // cambian nada (ni escala). El grupo de C conserva su elevación (la cola sigue habilitada)
    const sOn = await open(browser, 'scene=single&theme=lustre')
    const on = await sOn.page.evaluate(() => ({ sh: getComputedStyle(document.querySelector('.g-fab > button')).boxShadow }))
    await sOn.ctx.close()
    for (const q of ['scene=single&off=1&theme=lustre', 'scene=single&off=1', 'scene=c&off=1&theme=lustre', 'scene=single&off=1&dark=1', 'scene=c&off=1&zone=1']) {
      const r = await open(browser, q)
      const P = `${E}[deshabilitada·${q.replace(/scene=|&off=1|theme=/g, '')}]`
      const read = () => r.page.evaluate(() => { const b = document.querySelector('.g-fab__main') || document.querySelector('.g-fab > button'), cs = getComputedStyle(b); const tk = (n) => __c.tok(b, n).join(), col = (x) => __c.rgba(x).join(); return { dis: b.getAttribute('aria-disabled'), bg: col(cs.backgroundColor) === tk('--g-color-neutral-soft'), fg: col(cs.color) === tk('--g-color-text-subtle'), edge: [cs.borderTopColor, cs.borderBottomColor].every((x) => col(x) === tk('--g-color-border-control')), raw: [cs.backgroundColor, cs.color, cs.borderTopColor, cs.transform].join(' / '), sh: cs.boxShadow, cur: cs.cursor, edgeCr: __c.cr(__c.rgba(cs.borderTopColor), __c.bgOf(document.querySelector('main'))) } })
      const v = await read()
      ok(v.dis === 'true' && v.bg && v.fg && v.edge && v.cur === 'not-allowed', `${P} neutral-soft, text-subtle, contorno border-control y cursor de no disponible: ${v.raw}`)
      ok(v.edgeCr >= 3, `${P} contorno ≥ 3:1 frente a la página: ${v.edgeCr.toFixed(2)}`)
      if (/single/.test(q)) ok(v.sh !== 'none' && v.sh !== on.sh, `${P} baja a shadow-1: ${v.sh}`)
      const bx = await r.page.locator('.g-fab__main, .g-fab > button').first().boundingBox()
      await r.page.mouse.move(bx.x + bx.width / 2, bx.y + bx.height / 2); await r.page.waitForTimeout(250)
      const hv = await read()
      await r.page.mouse.down(); await r.page.waitForTimeout(250)
      const ac = await read()
      await r.page.mouse.up(); await r.page.mouse.move(5, 5)
      ok(hv.raw === v.raw && ac.raw === v.raw, `${P} al pasar y al apretar no cambia nada (ni escala): ${hv.raw} · ${ac.raw}`)
      ok(!r.errs.length, `${P} consola limpia: ${r.errs}`)
      await r.ctx.close()
    }
    // --_minh exacto (#677): el panel que cubre la pila la tapa justa; por el lado lejano no asoma nada de la pila (sin
    // margen en el CSS); lo que asoma por el lado del FAB y la pila más ancha que el panel quedan como nota (preguntas 13 y 14)
    for (const [q, vp] of [['scene=a15&open=1&more=1', { width: 1000, height: 480 }], ['scene=a15&open=1&more=1&dark=1', { width: 1000, height: 480 }], ['scene=a15&open=1&more=1&pos=top-start&rtl=1', { width: 1000, height: 480 }], ['scene=a15&open=1&more=1', { width: 320, height: 480 }], ['scene=a15&open=1&more=1&long=1', { width: 1000, height: 480 }], ['scene=a15&open=1&more=1&long=1', { width: 320, height: 480 }]]) {
      const r = await open(browser, q, vp, { deviceScaleFactor: 1 })
      const P = `${E}[cubre·${q.replace(/scene=a15&open=1&more=1&?/, '') || 'a15'}·${vp.width}]`
      await r.page.addStyleTag({ content: '.g-tooltip{visibility:hidden!important}' }); await r.page.waitForTimeout(400)
      const g = await r.page.evaluate(() => { const s = document.querySelector('#fab-more'), st = document.querySelector('.g-fab__list--stack'); const a = s.getBoundingClientRect(), b = st.getBoundingClientRect(), up = document.querySelector('.g-fab').dataset.position.startsWith('bottom'); return { minh: parseFloat(s.style.getPropertyValue('--_minh')), sh: b.height, p: { l: a.left, t: a.top, r: a.right, b: a.bottom }, s: { l: b.left, t: b.top, r: b.right, b: b.bottom }, up } })
      ok(Math.abs(g.minh - g.sh) < 0.01, `${P} --_minh es el alto exacto de la pila: ${g.minh} vs ${g.sh}`)
      ok(g.p.t <= g.s.t + 0.5 && g.p.b >= g.s.b - 0.5, `${P} el panel cubre la pila en bloque: ${g.p.t}–${g.p.b} vs ${g.s.t}–${g.s.b}`)
      const a = (await r.page.screenshot()).toString('base64')
      await r.page.addStyleTag({ content: '.g-fab__list--stack{visibility:hidden!important}' }); await r.page.waitForTimeout(100)
      const b = (await r.page.screenshot()).toString('base64')
      const d = await r.page.evaluate(async ({ a, b, p, up }) => {
        const load = async (s) => { const i = new Image(); i.src = 'data:image/png;base64,' + s; await i.decode(); const c = document.createElement('canvas'); c.width = i.width; c.height = i.height; const x = c.getContext('2d'); x.drawImage(i, 0, 0); return x.getImageData(0, 0, c.width, c.height) }
        const A = await load(a), B = await load(b), w = { far: 0, near: 0, side: 0, max: 0, sideMax: 0 }
        for (let y = 0; y < A.height; y++) for (let x = 0; x < A.width; x++) {
          const i = (y * A.width + x) * 4, dd = Math.max(...[0, 1, 2].map((k) => Math.abs(A.data[i + k] - B.data[i + k]))); if (dd <= 1) continue
          if (y < p.t) up ? w.far++ : w.near++
          else if (y >= p.b) up ? w.near++ : w.far++
          else if (x < p.l || x >= p.r) { w.side++; w.sideMax = Math.max(w.sideMax, dd) }
          if (y < p.t || y >= p.b) w.max = Math.max(w.max, dd)
        }
        return w
      }, { a, b, p: g.p, up: g.up })
      ok(d.far === 0, `${P} por el lado lejano no asoma la pila (sin margen en min-block-size): ${d.far} px`)
      note(`${P} lado del FAB: ${d.near} px de sombra (Δ máx ${d.max}); por los lados: ${d.side} px (Δ máx ${d.sideMax}); pila ${(g.s.r - g.s.l).toFixed(0)} px, panel ${(g.p.r - g.p.l).toFixed(0)} px`)
      if (!/long/.test(q)) ok(d.sideMax <= 24, `${P} por los lados solo sombra (Δ ≤ 24): ${d.sideMax}`)
      ok(!r.errs.length, `${P} consola limpia: ${r.errs}`)
      await r.ctx.close()
    }
  }

  /* ---------- 3 · Táctil, 320px, texto al 200 % ---------- */
  {
    const touch = engine !== 'firefox' ? { hasTouch: true, isMobile: true } : {}
    const { ctx, page, errs } = await open(browser, 'scene=a6&open=1&coarse=1', { width: 390, height: 740 }, touch)
    const g = await fabGeom(page)
    ok(g.lis.every((p) => p.h >= 44 - 0.01), `${E}[táctil] píldoras ≥ 44px: ${g.lis.map((p) => p.h)}`)
    ok(g.lis.every((p) => Math.abs(p.icx - g.fab.cx) < 0.75), `${E}[táctil] semillas en el eje del FAB`)
    await ctx.close()
    ok(!errs.length, `${E}[táctil] consola limpia: ${errs}`)
    // Velo en cuatro piezas (#668), seis posiciones × LTR y RTL (y C, y anchor="container"): el toque en el FAB llega al
    // FAB; fuera de la ventana todo es velo, también la franja entre el FAB y su borde; las piezas teselan el visor menos
    // la ventana, sin solapes; la ventana es el disparador + ≤ space × 1 en px enteros
    const scrimCases = []
    for (const rtl of [false, true]) for (const pos of POS) scrimCases.push(`scene=a6&pos=${pos}${rtl ? '&rtl=1' : ''}`)
    scrimCases.push('scene=c', 'scene=c&pos=top-start&rtl=1', 'scene=a6&anchor=container', 'scene=a6&anchor=container&pos=top-center')
    for (const sq of scrimCases) {
      // Con anchor="container" el marco empieza más abajo: un visor más alto deja el FAB a la vista
      const t = await open(browser, `${sq}&open=1&coarse=1`, { width: 390, height: /container/.test(sq) ? 1200 : 740 }, { ...touch, deviceScaleFactor: 1 })
      const P = `${E}[velo·${sq.replace('scene=', '')}]`
      const v = await t.page.evaluate(() => {
        const sc = document.querySelector('.g-fab__scrim'), part = sc.querySelector(':scope > .g-fab__scrim-part')
        const trig = document.querySelector('.g-fab__main-group') || document.querySelector('.g-fab > button')
        const f = trig.getBoundingClientRect(), vw = document.documentElement.clientWidth, vh = innerHeight
        const space = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--g-space-1'))
        const num = (n) => parseFloat(sc.style.getPropertyValue(n))
        const hx = num('--_hole-x'), hy = num('--_hole-y'), hw = num('--_hole-w'), hh = num('--_hole-h')
        const at = (x, y) => document.elementFromPoint(Math.min(Math.max(x, 0), vw - 1), Math.min(Math.max(y, 0), vh - 1))
        const veil = (x, y) => !!at(x, y)?.closest('.g-fab__scrim')
        const onTrig = (x, y) => !!at(x, y)?.closest('.g-fab__main-group, .g-fab > button')
        const rect = (cs) => ({ l: parseFloat(cs.left), t: parseFloat(cs.top), w: parseFloat(cs.width), h: parseFloat(cs.height) })
        const pieces = [getComputedStyle(sc), getComputedStyle(sc, '::before'), getComputedStyle(sc, '::after'), getComputedStyle(part)].map(rect)
        const cx = f.left + f.width / 2, cy = f.top + f.height / 2
        const btns = [...document.querySelectorAll('.g-fab__main-group > button, .g-fab > button')].map((b) => b.getBoundingClientRect())
        // Puntos fuera de la ventana: a 1px de cada lado, en las cuatro esquinas, y la franja hasta los bordes del visor
        const outside = {
          above: veil(cx, hy - 1), below: veil(cx, hy + hh), start: veil(hx - 1, cy), end: veil(hx + hw, cy),
          tl: veil(hx - 1, hy - 1), tr: veil(hx + hw, hy - 1), bl: veil(hx - 1, hy + hh), br: veil(hx + hw, hy + hh),
          stripBlock: f.top > vh / 2 ? veil(cx, (hy + hh + vh) / 2) && veil(cx, vh - 1) : veil(cx, hy / 2) && veil(cx, 0),
          stripInline: (cx > vw / 2 ? veil((hx + hw + vw) / 2, cy) && veil(vw - 1, cy) : veil(hx / 2, cy) && veil(0, cy)) || (hx <= 0 || hx + hw >= vw),
          // Los puntos de la página que no están bajo una lista abierta (la lista va sobre el velo; en C estrecho el panel cubre casi todo)
          page: (() => { const lists = [...document.querySelectorAll('.g-fab__list:popover-open')].map((u) => u.getBoundingClientRect()); const free = [[20, 300], [vw - 20, 300], [vw / 2, vh / 2], [20, vh - 80], [vw - 20, 80], [20, 80], [vw - 20, vh - 80]].filter(([x, y]) => !lists.some((r) => x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) && !(x >= hx && x < hx + hw && y >= hy && y < hy + hh)); return free.every(([x, y]) => veil(x, y)) })(),
          far: veil(vw - 2, 2) && veil(1, vh - 2)
        }
        return {
          open: sc.matches(':popover-open'), op: parseFloat(getComputedStyle(sc).opacity), space, vw, vh,
          hole: { hx, hy, hw, hh }, ints: [hx, hy, hw, hh].every(Number.isInteger),
          ring: Math.max(f.left - hx, f.top - hy, hx + hw - f.right, hy + hh - f.bottom), ringMin: Math.min(f.left - hx, f.top - hy, hx + hw - f.right, hy + hh - f.bottom),
          trigHit: btns.every((b) => onTrig(b.left + b.width / 2, b.top + b.height / 2) && onTrig(b.left + b.width / 2, b.top + 1) && onTrig(b.left + b.width / 2, b.bottom - 1)),
          outside, pieces, bg: [getComputedStyle(sc), getComputedStyle(sc, '::before'), getComputedStyle(sc, '::after'), getComputedStyle(part)].map((c) => c.backgroundColor),
          xywh: ['--_x', '--_y', '--_w', '--_h'].map((n) => sc.style.getPropertyValue(n)).join('')
        }
      })
      ok(v.open && Math.abs(v.op - 0.5) < 0.01, `${P} velo abierto con opacidad 0,5: ${v.op}`)
      ok(v.ints, `${P} ventana en px enteros: ${JSON.stringify(v.hole)}`)
      ok(v.ringMin >= 0 && v.ring <= v.space + 1, `${P} ventana = disparador + anillo ≤ space × 1 (+ redondeo): ${v.ringMin.toFixed(2)}–${v.ring.toFixed(2)}`)
      ok(v.trigHit, `${P} el toque en el disparador (centro y bordes; en C, principal y cola) llega al disparador`)
      ok(Object.values(v.outside).every(Boolean), `${P} fuera de la ventana todo es velo, también la franja hasta el borde: ${JSON.stringify(v.outside)}`)
      ok(v.xywh === '', `${P} el velo no lleva --_x/--_y/--_w/--_h: ${v.xywh}`)
      // Teselado: área de las piezas = visor − ventana (dentro del visor) y sin solapes dos a dos
      const clip = (r) => ({ l: Math.max(0, r.l), t: Math.max(0, r.t), r: Math.min(v.vw, r.l + Math.max(0, r.w)), b: Math.min(v.vh, r.t + Math.max(0, r.h)) })
      const ps = v.pieces.map(clip), area = (r) => Math.max(0, r.r - r.l) * Math.max(0, r.b - r.t)
      const win = clip({ l: v.hole.hx, t: v.hole.hy, w: v.hole.hw, h: v.hole.hh })
      const sum = ps.reduce((a, r) => a + area(r), 0), expect = v.vw * v.vh - area(win)
      const inter = (a, b) => area({ l: Math.max(a.l, b.l), t: Math.max(a.t, b.t), r: Math.min(a.r, b.r), b: Math.min(a.b, b.b) })
      const overlap = ps.reduce((acc, a, i) => acc + ps.slice(i + 1).reduce((x, b) => x + inter(a, b), 0), 0) + ps.reduce((acc, r) => acc + inter(r, win), 0)
      ok(Math.abs(sum - expect) < 1 && overlap < 1, `${P} cuatro piezas que cubren el visor menos la ventana sin solaparse: ${sum} vs ${expect} · solape ${overlap}`)
      ok(new Set(v.bg).size === 1 && !/rgba\(0, 0, 0, 0\)/.test(v.bg[0]), `${P} las cuatro piezas pintan el mismo velo: ${v.bg}`)
      ok(!t.errs.length, `${P} consola limpia: ${t.errs}`)
      // Costuras (píxeles): con la página vacía, fuera de la ventana y de la sombra del FAB el velo es un solo color
      if (/pos=(bottom-end|top-start)(&|$)|scene=c$/.test(sq) || sq === 'scene=a6&pos=bottom-end') {
        await t.page.addStyleTag({ content: '.bar,#main,.g-fab__list,.g-tooltip{visibility:hidden!important}' })
        await t.page.waitForTimeout(80)
        const png = (await t.page.screenshot()).toString('base64')
        const seams = await t.page.evaluate(async ({ png, hole }) => {
          const img = new Image(); img.src = 'data:image/png;base64,' + png; await img.decode()
          const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height
          const cx = cv.getContext('2d', { willReadFrequently: true }); cx.drawImage(img, 0, 0)
          const d = cx.getImageData(0, 0, cv.width, cv.height).data, M = 32, seen = new Map()
          for (let y = 0; y < cv.height; y++) for (let x = 0; x < cv.width; x++) {
            if (x > hole.hx - M && x < hole.hx + hole.hw + M && y > hole.hy - M && y < hole.hy + hole.hh + M) continue
            const i = (y * cv.width + x) * 4, k = d[i] + ',' + d[i + 1] + ',' + d[i + 2]
            seen.set(k, (seen.get(k) || 0) + 1)
          }
          return [...seen.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4)
        }, { png, hole: v.hole })
        ok(seams.length === 1, `${P} sin costuras: un solo color de velo fuera de la ventana: ${JSON.stringify(seams)}`)
      }
      await t.ctx.close()
    }
    for (const q of ['scene=a6&open=1', 'scene=c&open=1', 'scene=a15&open=1&more=1', 'scene=a3&open=1&arm=purge']) {
      const r = await open(browser, q, { width: 320, height: 640 })
      const d = await r.page.evaluate(() => { const els = [...document.querySelectorAll('.g-fab__list:popover-open, .g-fab__list:popover-open > li, .g-fab__item, .g-fab__confirm')].map((e) => e.getBoundingClientRect()); return { sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, minL: Math.min(...els.map((r) => r.left)), maxR: Math.max(...els.map((r) => r.right)), clip: [...document.querySelectorAll('.g-fab__label, .g-fab__cancel, .g-fab__confirm-action')].filter((e) => e.getClientRects().length && e.scrollWidth > e.clientWidth + 1).length } })
      ok(d.sw <= d.cw && d.minL >= 0 && d.maxR <= d.cw, `${E}[320px · ${q}] sin desplazamiento horizontal y todo dentro: ${d.minL}–${d.maxR} de ${d.cw}`)
      ok(d.clip === 0, `${E}[320px · ${q}] ninguna etiqueta recortada: ${d.clip}`)
      await r.ctx.close()
    }
    // Texto al 200 % (1.4.4): los roles de texto al doble; nada se recorta y las píldoras crecen
    const big = await open(browser, 'scene=a6&open=1')
    await big.page.addStyleTag({ content: ':root{--g-text-body-sm-size:28px;--g-text-body-sm-line:40px;--g-text-caption-size:24px;--g-text-caption-line:32px;--g-text-body-size:32px;--g-text-body-line:44px}' })
    await big.page.evaluate(() => window.__fab.place()); await big.page.waitForTimeout(300)
    const bg2 = await big.page.evaluate(() => ({ clip: [...document.querySelectorAll('.g-fab__label')].filter((e) => e.scrollWidth > e.clientWidth + 1 || e.scrollHeight > e.clientHeight + 1).length, inside: [...document.querySelectorAll('.g-fab__list--stack > li > .g-fab__item')].every((b) => { const r = b.getBoundingClientRect(), l = b.querySelector('.g-fab__label').getBoundingClientRect(); return l.top >= r.top - 0.5 && l.bottom <= r.bottom + 0.5 && l.left >= r.left && l.right <= r.right }) }))
    ok(bg2.clip === 0 && bg2.inside, `${E}[texto 200 %] etiquetas enteras dentro de su píldora: recortadas ${bg2.clip}, dentro ${bg2.inside}`)
    await big.ctx.close()
  }

  /* ---------- 4 · Movimiento ---------- */
  {
    const { ctx, page } = await open(browser, 'scene=a6')
    await page.evaluate(() => window.__fab.open()); await page.waitForTimeout(450)
    const mv = await page.evaluate(() => {
      const lis = [...document.querySelectorAll('.g-fab__list--stack > li')]
      return lis.map((li) => { const cs = getComputedStyle(li); return { tp: cs.transitionProperty, td: cs.transitionDuration, dl: cs.transitionDelay, i: li.style.getPropertyValue('--_i'), tf: cs.transitionTimingFunction } })
    })
    ok(mv.every((m) => /translate/.test(m.tp) && /clip-path/.test(m.tp) && /opacity/.test(m.tp)), `${E}[mov] píldoras: translate, clip-path y opacidad: ${mv[0].tp}`)
    ok(mv.every((m) => m.td.replace(/\s/g, '') === '0.16s,0.16s,0.12s'), `${E}[mov] press, press, fast: ${mv[0].td}`)
    ok(mv.every((m) => Math.abs(parseFloat(m.dl) * 1000 - 120 * Number(m.i) / 8) < 0.6), `${E}[mov] escalonado fast × i / 8: ${mv.map((m) => m.i + ':' + m.dl).join(' ')}`)
    ok(mv.every((m) => !/linear\(/.test(m.tf) && /cubic-bezier\(0\.23, 1, 0\.32, 1\)/.test(m.tf)), `${E}[mov] --g-ease-out, sin muelle: ${mv[0].tf}`)
    // Nada supera 240ms (duración + retardo) en todo el componente
    const max = await page.evaluate(() => { const t = (v) => v.split(',').map((x) => parseFloat(x) * (x.trim().endsWith('ms') ? 1 : 1000)); let m = 0; for (const el of document.querySelectorAll('.g-fab, .g-fab *')) { const cs = getComputedStyle(el); const d = t(cs.transitionDuration), dl = t(cs.transitionDelay); d.forEach((x, i) => { m = Math.max(m, x + (dl[i % dl.length] || 0)) }) } return m })
    ok(max <= 240.5, `${E}[mov] nada supera 240ms: ${max}`)
    // La semilla nace en el centro del FAB: congelar el estado de partida y medir
    await page.evaluate(() => document.head.insertAdjacentHTML('beforeend', '<style id="frz">.g-fab__list--stack > li{transition:none!important}</style>'))
    const seed = await page.evaluate(() => {
      const ul = document.querySelector('.g-fab__list--stack'); ul.dataset.state = 'opening'
      const f = document.querySelector('.g-fab > button').getBoundingClientRect(), cx = f.left + f.width / 2, cy = f.top + f.height / 2
      const pill = parseFloat(getComputedStyle(document.querySelector('.g-fab')).getPropertyValue('--_pill')) || 40
      const out = [...ul.children].map((li) => { const r = li.getBoundingClientRect(); const cs = getComputedStyle(li); return { dx: r.right - r.height / 2 - cx, dy: r.top + r.height / 2 - cy, clip: cs.clipPath, op: cs.opacity, h: r.height } })
      ul.dataset.state = 'open'
      document.getElementById('frz').remove()
      return out
    })
    ok(seed.every((s) => Math.abs(s.dx) < 1 && Math.abs(s.dy) < 1), `${E}[mov] cada semilla parte del centro del FAB: ${seed.map((s) => s.dx.toFixed(1) + ',' + s.dy.toFixed(1)).join(' ')}`)
    ok(seed.every((s) => /^inset\(0px (0px|0%) 0px calc\(100% - 40px\) round/.test(s.clip) && s.op === '0'), `${E}[mov] parte recortada a la semilla del lado del FAB e invisible: ${seed[0].clip}`)
    // Iconos que se cruzan
    const gl = await page.evaluate(() => { const r = getComputedStyle(document.querySelector('.g-fab__glyph--rest')), o = getComputedStyle(document.querySelector('.g-fab__glyph--open')); return { r: r.rotate, ro: r.opacity, o: o.rotate, oo: o.opacity, td: o.transitionDuration } })
    ok(gl.r === '45deg' && gl.ro === '0' && (gl.o === '0deg' || gl.o === 'none') && gl.oo === '1', `${E}[mov] plus gira 45° y se va; la x llega: ${JSON.stringify(gl)}`)
    // Cierre: corto y sin escalonado
    await page.evaluate(() => { document.querySelector('.g-fab__list--stack').dataset.state = 'closing' })
    const cl = await page.evaluate(() => [...document.querySelectorAll('.g-fab__list--stack > li')].map((li) => { const cs = getComputedStyle(li); return cs.transitionDuration + '|' + cs.transitionDelay }))
    ok(cl.every((x) => /^0\.12s(,0\.12s)*\|0s(,0s)*$/.test(x.replace(/\s/g, ''))), `${E}[mov] salida fast sin escalonado: ${cl[0]}`)
    // Se aparta con press + ease-out
    const tk = await page.evaluate(() => { const cs = getComputedStyle(document.querySelector('.g-fab')); return cs.transitionProperty + '|' + cs.transitionDuration })
    ok(tk.replace(/\s/g, '') === 'translate|0.16s', `${E}[mov] se aparta: translate en press: ${tk}`)
    await ctx.close()
    // C: transformación de contenedor
    const c = await open(browser, 'scene=c')
    await c.page.evaluate(() => window.__fab.open()); await c.page.waitForTimeout(450)
    const cm = await c.page.evaluate(() => { const ul = document.querySelector('#fab-menu'); const cs = getComputedStyle(ul); const li = getComputedStyle(ul.children[1]); const open = { clip: cs.clipPath, bg: cs.backgroundColor, tp: cs.transitionProperty, td: cs.transitionDuration, liT: li.transitionDuration + '|' + li.transitionDelay }; document.head.insertAdjacentHTML('beforeend', '<style id="frz">.g-fab__list,.g-fab__list>li{transition:none!important}</style>'); ul.dataset.state = 'opening'; const o = getComputedStyle(ul); const from = { clip: o.clipPath, bg: o.backgroundColor, li: getComputedStyle(ul.children[1]).opacity, prim: getComputedStyle(ul).getPropertyValue('--g-color-primary') }; ul.dataset.state = 'open'; document.getElementById('frz').remove(); return { open, from } })
    ok(/inset\(-48px round 8px\)/.test(cm.open.clip), `${E}[mov·C] abierto: recorte ampliado (la sombra no se corta): ${cm.open.clip}`)
    ok(/inset\(\d/.test(cm.from.clip) && /round 999px/.test(cm.from.clip), `${E}[mov·C] parte del recorte de la cola: ${cm.from.clip}`)
    ok(cm.from.bg !== cm.open.bg && cm.from.li === '0', `${E}[mov·C] parte con el relleno de la cola y el contenido oculto: ${cm.from.bg} → ${cm.open.bg}`)
    ok(/clip-path/.test(cm.open.tp) && /background-color/.test(cm.open.tp) && /0\.24s/.test(cm.open.td), `${E}[mov·C] recorte y relleno en slow: ${cm.open.tp} · ${cm.open.td}`)
    ok(cm.open.liT.replace(/\s/g, '') === '0.12s|0.12s', `${E}[mov·C] el contenido entra en fast tras fast: ${cm.open.liT}`)
    await c.ctx.close()
    // Reducido
    const r = await open(browser, 'scene=a6&ack=busy', { width: 1000, height: 700 }, { reducedMotion: 'reduce' })
    await r.page.evaluate(() => window.__fab.open()); await r.page.waitForTimeout(400)
    const rd = await r.page.evaluate(() => { const li = document.querySelector('.g-fab__list--stack > li'); const ul = li.parentElement; const cs = getComputedStyle(li); const res = { tp: cs.transitionProperty, dl: cs.transitionDelay, clip: cs.clipPath }; ul.dataset.state = 'opening'; const o = getComputedStyle(li); res.oTr = o.translate; res.oClip = o.clipPath; ul.dataset.state = 'open'; const g = getComputedStyle(document.querySelector('.g-fab__glyph--rest')); const b = getComputedStyle(document.querySelector('.g-fab__badge')); const bsvg = getComputedStyle(document.querySelector('.g-fab__badge > svg')); const root = getComputedStyle(document.querySelector('.g-fab')); return { ...res, gRot: g.rotate, gTp: g.transitionProperty, bScale: b.scale, bAnim: bsvg.animationName, rootTp: root.transitionProperty } })
    ok(rd.tp === 'opacity' && rd.oTr === 'none' && rd.oClip === 'none' && rd.clip === 'none', `${E}[reducido] píldoras: solo fundido, sin desplazamiento ni recorte: ${rd.tp} · ${rd.oTr} · ${rd.oClip}`)
    ok(parseFloat(rd.dl) === 0, `${E}[reducido] sin escalonado: ${rd.dl}`)
    ok(rd.gRot === 'none' && rd.gTp === 'opacity', `${E}[reducido] iconos sin giro: ${rd.gRot} · ${rd.gTp}`)
    ok(rd.bScale === 'none' && rd.bAnim === 'none', `${E}[reducido] insignia sin escala y quieta: ${rd.bScale} · ${rd.bAnim}`)
    ok(!/translate/.test(rd.rootTp), `${E}[reducido] se aparta sin desplazarse (aparece en su sitio): ${rd.rootTp}`)
    await r.ctx.close()
    const rc = await open(browser, 'scene=c&open=1', { width: 1000, height: 700 }, { reducedMotion: 'reduce' })
    const rcm = await rc.page.evaluate(() => { const ul = document.querySelector('#fab-menu'); const tp = getComputedStyle(ul).transitionProperty; ul.style.transition = 'none'; ul.dataset.state = 'opening'; const o = getComputedStyle(ul); const i = document.createElement('i'); i.style.background = 'var(--g-color-surface)'; ul.appendChild(i); const surf = getComputedStyle(i).backgroundColor; i.remove(); const r = { clip: o.clipPath, bg: o.backgroundColor, surf, op: o.opacity, tp }; ul.dataset.state = 'open'; ul.style.transition = ''; return r })
    ok(rcm.clip === 'none' && rcm.op === '0' && rcm.tp === 'opacity' && rcm.bg === rcm.surf, `${E}[reducido·C] panel de C sin recorte ni relleno de la cola, solo fundido: ${JSON.stringify(rcm)}`)
    await rc.ctx.close()
  }

  /* ---------- 5 · Contraste: temas, claro y oscuro, zona ---------- */
  const themes = (args.themes === 'all' || (!args.themes && engine === 'chromium')) ? ['', 'nsa', ...GEN] : ['', 'nsa']
  const cases = []
  for (const th of themes) for (const dark of [false, true]) cases.push({ th, dark, zone: false })
  for (const th of ['', 'nsa']) for (const dark of [false, true]) cases.push({ th, dark, zone: true })
  for (const c of cases) {
    const q = [c.th && 'theme=' + c.th, c.dark && 'dark=1', c.zone && 'zone=1'].filter(Boolean).join('&')
    const name = `${E}[${c.th || 'defecto'}${c.dark ? '·oscuro' : '·claro'}${c.zone ? '·zona' : ''}]`
    const R = {}
    // Pila, cola, panel de la cola, acuse en curso
    {
      const { ctx, page } = await open(browser, `${q}&scene=a15&open=1&ack=busy`)
      Object.assign(R, await page.evaluate(() => {
        const $ = (s) => document.querySelector(s), $$ = (s) => [...document.querySelectorAll(s)]
        const fab = $('.g-fab > button'), page = $('main')
        const items = $$('.g-fab__list--stack .g-fab__item')
        const lab = Math.min(...items.map((b) => __c.txt(b.querySelector('.g-fab__label'), b)))
        const seed = Math.min(...items.filter((b) => b !== document.activeElement).map((b) => { const i = b.querySelector('.g-fab__icon'); return __c.txt(i, i) }))
        const act = document.activeElement.closest('.g-fab__item'), ai = act.querySelector('.g-fab__icon')
        const out = {
          pill: lab, seed, seedOn: __c.txt(ai, ai), actLabel: __c.txt(act.querySelector('.g-fab__label'), act),
          fabIcon: __c.txt(fab, fab), fabEdge: __c.cr(__c.tok(fab, '--g-color-primary-text'), __c.bgOf(page)), fabFill: __c.cr(__c.bgOf(fab), __c.bgOf(page)),
          more: __c.cr(__c.over(__c.rgba(getComputedStyle($('.g-fab__item--more')).borderTopColor), __c.bgOf(page)), __c.bgOf(page)),
          focus: __c.cr(__c.tok(fab, '--g-color-focus'), __c.bgOf(page)),
          badgeIcon: __c.txt($('.g-fab__badge'), $('.g-fab__badge')), badgeEdge: __c.cr(__c.rgba(getComputedStyle($('.g-fab__badge')).borderTopColor), __c.bgOf(page))
        }
        return out
      }))
      await page.evaluate(() => window.__fab.openSub()); await page.waitForTimeout(450)
      Object.assign(R, await page.evaluate(() => {
        const $ = (s) => document.querySelector(s), $$ = (s) => [...document.querySelectorAll(s)]
        const sub = $('#fab-more'), page = $('main')
        const sunk = __c.over(__c.tok(sub, '--g-color-surface-sunken'), __c.bgOf(sub))
        const labs = $$('#fab-more .g-fab__item:not([aria-disabled]) .g-fab__label')
        return {
          pLabel: Math.min(...labs.map((e) => __c.txt(e, sub))),
          pLabelHi: Math.min(...labs.map((e) => __c.cr(__c.over(__c.rgba(getComputedStyle(e).color), sunk), sunk))),
          pDesc: Math.min(...$$('#fab-more .g-fab__desc, #fab-more .g-fab__reason').map((e) => __c.txt(e, sub))),
          pDescHi: Math.min(...$$('#fab-more .g-fab__desc').map((e) => __c.cr(__c.over(__c.rgba(getComputedStyle(e).color), sunk), sunk))),
          pGroup: Math.min(...$$('#fab-more .g-fab__group-title').map((e) => __c.txt(e, sub))),
          pIcon: Math.min(...$$('#fab-more .g-fab__item:not([aria-disabled]):not(.g-fab__item--danger) .g-fab__icon').map((e) => __c.txt(e, sub))),
          pDanger: Math.min(...$$('#fab-more .g-fab__item--danger .g-fab__label').map((e) => __c.txt(e, sub))),
          pEdge: __c.cr(__c.rgba(getComputedStyle(sub).borderTopColor), __c.bgOf(page)),
          pFocus: __c.cr(__c.tok(sub, '--g-color-focus'), __c.bgOf(sub)),
          // En curso (#669): la etiqueta se lee como la de una disponible y el motivo («Exportando…») entero
          pBusy: __c.txt($('#fab-more [data-ack="busy"] .g-fab__label'), sub),
          pBusyReason: __c.txt($('#fab-more [data-ack="busy"] .g-fab__reason'), sub)
        }
      }))
      await page.evaluate(() => window.__fab.setAck('failed', 'csv')); await page.waitForTimeout(120)
      Object.assign(R, await page.evaluate(() => {
        const $ = (s) => document.querySelector(s), sub = $('#fab-more'), b = $('#fab-more [data-ack="failed"]'), rs = b.querySelector('.g-fab__reason')
        window.__fab.focusEl(b)
        const sunk = __c.over(__c.tok(sub, '--g-color-surface-sunken'), __c.bgOf(sub))
        return { pFail: __c.txt(rs, sub), pFailHi: __c.cr(__c.over(__c.rgba(getComputedStyle(rs).color), sunk), sunk) }
      }))
      await ctx.close()
    }
    // C con cabecera de búsqueda y acuse hecho en la principal
    {
      const { ctx, page } = await open(browser, `${q}&scene=c&open=1&find=exp&ack=done&ackmain=1`)
      Object.assign(R, await page.evaluate(() => {
        const $ = (s) => document.querySelector(s), ul = $('#fab-menu'), main = $('.g-fab__main'), page = $('main'), find = $('.g-fab__find')
        const qy = $('.g-fab__find-query')
        return { mainLabel: __c.txt(main, main), findQ: __c.txt(qy, qy), findCount: __c.txt($('.g-fab__find-count'), find), badgeDone: __c.txt($('.g-fab__badge'), $('.g-fab__badge')), mainEdge: __c.cr(__c.tok(main, '--g-color-primary-text'), __c.bgOf(page)) }
      }))
      await page.evaluate(() => window.__fab.setFind('')); await page.waitForTimeout(100)
      R.findHint = await page.evaluate(() => __c.txt(document.querySelector('.g-fab__find > span'), document.querySelector('.g-fab__find')))
      await page.evaluate(() => window.__fab.setFind('zzz', true)); await page.waitForTimeout(100)
      R.findNone = await page.evaluate(() => __c.txt(document.querySelector('.g-fab__find > span'), document.querySelector('.g-fab__find')))
      await ctx.close()
    }
    // Confirmación armada en la pila y acuse fallido
    {
      const { ctx, page } = await open(browser, `${q}&scene=a3&open=1&arm=purge&ack=failed&ackid=photo`)
      Object.assign(R, await page.evaluate(() => {
        const $ = (s) => document.querySelector(s), page = $('main')
        const fb = $('.g-fab__list--stack [data-ack="failed"]'), rs = fb.querySelector('.g-fab__reason')
        const sunk = __c.over(__c.tok(fb, '--g-color-surface-sunken'), __c.bgOf(fb))
        return { cancel: __c.txt($('.g-fab__cancel'), $('.g-fab__cancel')), confirm: __c.txt($('.g-fab__confirm-action'), $('.g-fab__confirm-action')), cancelEdge: __c.cr(__c.rgba(getComputedStyle($('.g-fab__cancel')).borderTopColor), __c.bgOf(page)), badgeFail: __c.txt($('.g-fab__badge'), $('.g-fab__badge')), sFail: __c.txt(rs, fb), sFailHi: __c.cr(__c.over(__c.rgba(getComputedStyle(rs).color), sunk), sunk) }
      }))
      await page.keyboard.press('Escape'); await page.waitForTimeout(250)
      R.danger = await page.evaluate(() => { const b = document.querySelector('.g-fab__item--danger'); return __c.txt(b.querySelector('.g-fab__label'), b) })
      await ctx.close()
    }
    const T = { pill: 4.5, actLabel: 4.5, pLabel: 4.5, pLabelHi: 4.5, pDesc: 4.5, pDescHi: 4.5, pGroup: 4.5, pDanger: 4.5, mainLabel: 4.5, findQ: 4.5, findCount: 4.5, findHint: 4.5, findNone: 4.5, cancel: 4.5, confirm: 4.5, danger: 4.5, pBusy: 4.5, pBusyReason: 4.5, pFail: 4.5, pFailHi: 4.5, sFail: 4.5, sFailHi: 4.5, seed: 3, seedOn: 3, fabIcon: 3, fabEdge: 3, more: 3, focus: 3, badgeIcon: 3, badgeEdge: 3, badgeDone: 3, badgeFail: 3, pIcon: 3, pEdge: 3, pFocus: 3, mainEdge: 3, cancelEdge: 3 }
    for (const [k, min] of Object.entries(T)) { ok(R[k] >= min, `${name} ${k} ${R[k] && R[k].toFixed(2)} < ${min}`); if (Number.isFinite(R[k])) track(k + (c.zone ? '·zona' : ''), R[k]) }
    if (args.verbose || c.zone || !c.th || c.th === 'nsa') note(`${name} ` + Object.keys(T).concat('fabFill').map((k) => `${k} ${R[k] && R[k].toFixed(2)}`).join(' · '))
    else note(`${name} fabFill ${R.fabFill.toFixed(2)} · fabEdge ${R.fabEdge.toFixed(2)}`)
  }

  /* ---------- 6 · Foco visible ---------- */
  {
    const { ctx, page } = await open(browser, 'scene=a15&open=1')
    await page.keyboard.press('ArrowDown'); await page.keyboard.press('ArrowUp'); await page.waitForTimeout(150)
    const f = await page.evaluate(() => { const b = document.activeElement; const cs = getComputedStyle(b); const li = b.parentElement; const clip = getComputedStyle(li).clipPath; return { cls: b.className, ow: cs.outlineWidth, os: cs.outlineStyle, oo: cs.outlineOffset, clip } })
    ok(/g-fab__item/.test(f.cls) && f.os === 'solid' && f.ow === '2px' && f.oo === '2px', `${E}[foco] anillo en la píldora: ${f.os} ${f.ow} offset ${f.oo}`)
    ok(/inset\(-24px round/.test(f.clip), `${E}[foco] el recorte de la fila abierta deja ver el anillo: ${f.clip}`)
    await page.evaluate(() => window.__fab.openSub()); await page.waitForTimeout(400)
    await page.keyboard.press('ArrowDown'); await page.waitForTimeout(150)
    const p = await page.evaluate(() => { const b = document.activeElement; const cs = getComputedStyle(b); const ul = b.closest('.g-fab__list'); return { ow: cs.outlineWidth, os: cs.outlineStyle, oo: cs.outlineOffset, hi: ul.classList.contains('has-highlight'), hiOp: getComputedStyle(ul, '::before').opacity } })
    ok(p.os === 'solid' && p.ow === '2px' && p.oo === '-2px', `${E}[foco] anillo interior en el panel: ${p.os} ${p.ow} ${p.oo}`)
    ok(p.hi && p.hiOp === '1', `${E}[foco] resaltado del panel visible: ${p.hiOp}`)
    await ctx.close()
  }

  /* ---------- 6b · Acuse en el elemento (#669) ---------- */
  {
    const look = (sel) => { const b = document.querySelector(sel); if (!b) return null; const l = b.querySelector('.g-fab__label'), r = b.querySelector('.g-fab__reason'), ic = b.querySelector('.g-fab__icon'); return { ack: b.dataset.ack || null, dis: b.getAttribute('aria-disabled'), color: getComputedStyle(b).color, deco: l && getComputedStyle(l).textDecorationLine, lcolor: l && getComputedStyle(l).color, icolor: ic && getComputedStyle(ic).color, cursor: getComputedStyle(b).cursor, reason: r ? r.textContent : null, rcolor: r && getComputedStyle(r).color, rshown: !!r && r.getClientRects().length > 0 } }
    const tokOf = (n) => { const i = document.createElement('i'); i.style.color = `var(${n})`; document.querySelector('.g-fab').appendChild(i); const c = getComputedStyle(i).color; i.remove(); return c }
    // Pila: «Tomar foto» en curso frente a «Dictar nota» en reposo; «Preferencias» deshabilitada (panel de a15)
    const a = await open(browser, 'scene=a6&open=1&ack=busy&ackid=photo')
    const busy = await a.page.evaluate(`(${look})('.g-fab__list--stack [data-id="photo"]')`), rest = await a.page.evaluate(`(${look})('.g-fab__list--stack [data-id="note"]')`)
    const rootAck = await a.page.evaluate(() => document.querySelector('.g-fab').dataset.ack)
    ok(rootAck === 'busy' && busy.ack === 'busy' && busy.dis === 'true', `${E}[acuse·pila] en curso: data-ack en la raíz y en el elemento, aria-disabled: ${rootAck} ${busy.ack} ${busy.dis}`)
    ok(busy.deco === 'none' && busy.lcolor === rest.lcolor && busy.icolor === rest.icolor, `${E}[acuse·pila] en curso sin tachar ni atenuar (como una disponible): ${busy.deco} · ${busy.lcolor} vs ${rest.lcolor}`)
    ok(busy.cursor === 'progress' && busy.rshown && busy.reason === 'Exportando…', `${E}[acuse·pila] en curso: cursor de progreso y motivo visible: ${busy.cursor} · ${busy.reason}`)
    ok(rest.ack === null, `${E}[acuse·pila] sin data-ack en reposo`)
    await a.page.evaluate(() => window.__fab.setAck('failed', 'photo')); await a.page.waitForTimeout(150)
    const fail = await a.page.evaluate(`(${look})('.g-fab__list--stack [data-id="photo"]')`), dt = await a.page.evaluate(`(${tokOf})('--g-color-danger-text')`)
    ok(fail.ack === 'failed' && fail.dis === null && fail.deco === 'none', `${E}[acuse·pila] fallida: data-ack, habilitada y sin tachar: ${fail.ack} ${fail.dis} ${fail.deco}`)
    ok(fail.rcolor === dt && fail.rshown && fail.reason === 'No se pudo exportar', `${E}[acuse·pila] el motivo del fallo en danger-text: ${fail.rcolor} vs ${dt}`)
    await a.page.evaluate(() => window.__fab.setAck('done', 'photo')); await a.page.waitForTimeout(150)
    const done = await a.page.evaluate(`(${look})('.g-fab__list--stack [data-id="photo"]')`)
    ok(done.ack === null && done.dis === null && done.reason === null, `${E}[acuse·pila] hecha: el elemento pierde data-ack y vuelve a reposo: ${JSON.stringify(done)}`)
    ok(!a.errs.length, `${E}[acuse] consola limpia: ${a.errs}`)
    await a.ctx.close()
    // Panel: en curso frente a deshabilitada
    const p = await open(browser, 'scene=panel&open=1&ack=busy&ackid=csv')
    const pb = await p.page.evaluate(`(${look})('#fab-menu [data-id="csv"]')`), pd = await p.page.evaluate(`(${look})('#fab-menu [data-id="prefs"]')`), pr = await p.page.evaluate(`(${look})('#fab-menu [data-id="print"]')`)
    ok(pb.dis === 'true' && pd.dis === 'true' && pb.deco === 'none' && pd.deco === 'line-through', `${E}[acuse·panel] en curso sin tachar; deshabilitada tachada: ${pb.deco} · ${pd.deco}`)
    ok(pb.lcolor === pr.lcolor && pb.color !== pd.color, `${E}[acuse·panel] en curso con el color de una disponible, no el de una deshabilitada: ${pb.lcolor} · ${pd.color}`)
    await p.ctx.close()
    // single y principal de C: el GBtn lleva data-ack; en curso conserva contorno y elevación (no se pinta como deshabilitado)
    const sg = await open(browser, 'scene=single'), sgRest = await sg.page.evaluate(() => getComputedStyle(document.querySelector('.g-fab > button')).boxShadow); await sg.ctx.close()
    const sb = await open(browser, 'scene=single&ack=busy&ackid=photo')
    const sbv = await sb.page.evaluate(() => { const b = document.querySelector('.g-fab > button'); return { ack: b.dataset.ack, dis: b.getAttribute('aria-disabled'), sh: getComputedStyle(b).boxShadow, op: getComputedStyle(b).opacity, cur: getComputedStyle(b).cursor } })
    ok(sbv.ack === 'busy' && sbv.dis === 'true' && sbv.sh === sgRest && sbv.op === '1' && sbv.cur === 'progress', `${E}[acuse·single] en curso: data-ack, aria-disabled, mismo contorno y elevación que en reposo: ${JSON.stringify(sbv)}`)
    await sb.ctx.close()
    const cm = await open(browser, 'scene=c&ack=busy&ackmain=1')
    const cmv = await cm.page.evaluate(() => { const b = document.querySelector('.g-fab__main'); return { ack: b.dataset.ack, cur: getComputedStyle(b).cursor, root: document.querySelector('.g-fab').dataset.ack } })
    ok(cmv.ack === 'busy' && cmv.root === 'busy' && cmv.cur === 'progress', `${E}[acuse·C] la principal en curso lleva data-ack: ${JSON.stringify(cmv)}`)
    await cm.ctx.close()
  }

  /* ---------- 7 · Colores forzados (Chromium) ---------- */
  if (engine === 'chromium') {
    const { ctx, page } = await open(browser, 'scene=a15&open=1&ack=busy', { width: 1000, height: 700 }, { forcedColors: 'active' })
    await page.evaluate(() => window.__fab.openSub()); await page.waitForTimeout(400)
    const f = await page.evaluate(() => { const ct = (() => { const e = document.createElement('i'); e.style.color = 'CanvasText'; document.body.appendChild(e); const c = getComputedStyle(e).color; e.remove(); return c })(); const g = (s) => getComputedStyle(document.querySelector(s)); return { ct, pill: g('.g-fab__list--stack .g-fab__item').borderTopColor, panel: g('#fab-more').borderTopColor, hi: getComputedStyle(document.querySelector('#fab-more'), '::before').display, badge: g('.g-fab__badge').borderTopColor, seed: g('.g-fab__list--stack .g-fab__icon').borderTopStyle, fabSh: g('.g-fab > button').boxShadow } })
    ok(f.pill === f.ct && f.panel === f.ct && f.badge === f.ct, `[chromium][forzados] bordes CanvasText en píldoras, panel e insignia: ${f.pill} ${f.panel} ${f.badge}`)
    ok(f.hi === 'none', `[chromium][forzados] sin capa de resaltado: ${f.hi}`)
    ok(f.seed === 'solid', `[chromium][forzados] semillas con contorno: ${f.seed}`)
    ok(f.fabSh === 'none', `[chromium][forzados] FAB sin sombra: ${f.fabSh}`)
    await ctx.close()
    const fv = await open(browser, 'scene=a6&open=1&coarse=1', { width: 390, height: 740 }, { forcedColors: 'active', hasTouch: true, isMobile: true })
    const fvv = await fv.page.evaluate(() => { const sc = document.querySelector('.g-fab__scrim'); const vh = innerHeight; const at = (x, y) => !!document.elementFromPoint(x, y)?.closest('.g-fab__scrim'); return { op: getComputedStyle(sc).opacity, top: at(20, 100), strip: at(document.documentElement.clientWidth - 40, vh - 2) } })
    ok(fvv.op === '0' && fvv.top && fvv.strip, `[chromium][forzados] velo transparente que sigue tragándose el toque (también en la franja del borde): ${JSON.stringify(fvv)}`)
    await fv.ctx.close()
  }
  await browser.close()
}
server.close()
console.log(notes.join('\n'))
console.log('\nMínimos medidos:\n' + Object.entries(mins).map(([k, v]) => `  ${k}: ${v.v.toFixed(2)}`).join('\n'))
console.log('\nPor motor: ' + Object.entries(counts).map(([k, v]) => `${k} ${v}`).join(' · '))
console.log(`\n${total - failed}/${total} comprobaciones correctas`)
if (fails.length) { console.log('FALLOS:\n' + fails.join('\n')); process.exitCode = 1 }
