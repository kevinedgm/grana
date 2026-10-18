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
// marca; foco visible; forced-colors (Chromium); consola limpia.
// Ejecutar desde la raíz del repo (requiere dist/):  GRANA_PW_PORT=4244 node design/lab/fab/estilo-verificar.mjs
// Opcional: --engines=chromium,firefox,webkit  --themes=all|base (por defecto: todos en Chromium, base en Firefox y WebKit)  --verbose
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
    const p = normalize(join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname)))
    if (!p.startsWith(ROOT)) throw new Error('fuera')
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
  ok(!/var\(\s*--[\w-]+\s*,/.test(css), 'CSS: var() con valor de respaldo')
  ok(!/@layer/.test(css) && !/!important/.test(css), 'CSS: @layer o !important')
  const vars = [...css.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1])
  ok(vars.every((v) => v.startsWith('--g-') || v.startsWith('--_')), 'CSS: var() que no es --g-* ni --_*')
  const defaults = await readFile(join(ROOT, 'packages/vue/src/styles/defaults.css'), 'utf8')
  const defined = new Set([...defaults.matchAll(/(--g-[a-z0-9-]+)\s*:/g)].map((m) => m[1]))
  const missing = [...new Set(vars.filter((v) => v.startsWith('--g-') && !defined.has(v)))]
  ok(!missing.length, 'CSS: tokens que no existen en defaults.css: ' + missing)
  ok(!vars.some((v) => /^--g-color-(on-)?brand/.test(v)), 'CSS: lee --g-color-brand* (roles.test.js: primary)')
  // Tokens de color: los de tokens.md §47 más primary-text (contorno del FAB) y primary (relleno de partida del panel de C):
  // los dos están en la lista de la zona (§44.5); preguntas para lima en estilo.md
  const allowed = ['--g-color-surface', '--g-color-surface-sunken', '--g-color-border', '--g-color-border-control', '--g-color-text', '--g-color-text-muted', '--g-color-text-subtle', '--g-color-danger-text', '--g-color-danger', '--g-color-on-danger', '--g-color-success', '--g-color-on-success', '--g-color-focus', '--g-surface-backdrop', '--g-color-primary-text', '--g-color-primary']
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

  /* ---------- 3 · Táctil, 320px, texto al 200 % ---------- */
  {
    const touch = engine !== 'firefox' ? { hasTouch: true, isMobile: true } : {}
    const { ctx, page, errs } = await open(browser, 'scene=a6&open=1&coarse=1', { width: 390, height: 740 }, touch)
    const g = await fabGeom(page)
    ok(g.lis.every((p) => p.h >= 44 - 0.01), `${E}[táctil] píldoras ≥ 44px: ${g.lis.map((p) => p.h)}`)
    ok(g.lis.every((p) => Math.abs(p.icx - g.fab.cx) < 0.75), `${E}[táctil] semillas en el eje del FAB`)
    const s = await page.evaluate(() => { const sc = document.querySelector('.g-fab__scrim'); const f = document.querySelector('.g-fab > button').getBoundingClientRect(); const cs = getComputedStyle(sc); const at = (x, y) => document.elementFromPoint(x, y); return { open: sc.matches(':popover-open'), op: parseFloat(cs.opacity), fabHit: at(f.left + f.width / 2, f.top + f.height / 2)?.closest('.g-fab > button') !== null && at(f.left + f.width / 2, f.top + f.height / 2)?.closest('.g-fab__scrim') === null, edgeHit: at(f.left + 2, f.top + 2)?.closest('.g-fab__scrim') === null, pageHit: at(20, 200) === sc, cornerHole: at(f.left - 3, f.top - 3) === sc } })
    ok(s.open && Math.abs(s.op - 0.5) < 0.01, `${E}[táctil] velo abierto con opacidad 0,5: ${s.op}`)
    ok(s.fabHit, `${E}[táctil] el toque en el FAB llega al FAB (hueco en el velo)`)
    ok(s.pageHit, `${E}[táctil] el toque fuera cae en el velo`)
    ok(s.cornerHole, `${E}[táctil] el hueco tiene la forma del FAB (la esquina de su caja ampliada es velo)`)
    ok(!errs.length, `${E}[táctil] consola limpia: ${errs}`)
    await ctx.close()
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
          pFocus: __c.cr(__c.tok(sub, '--g-color-focus'), __c.bgOf(sub))
        }
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
      const { ctx, page } = await open(browser, `${q}&scene=a3&open=1&arm=purge&ack=failed`)
      Object.assign(R, await page.evaluate(() => {
        const $ = (s) => document.querySelector(s), page = $('main')
        return { cancel: __c.txt($('.g-fab__cancel'), $('.g-fab__cancel')), confirm: __c.txt($('.g-fab__confirm-action'), $('.g-fab__confirm-action')), cancelEdge: __c.cr(__c.rgba(getComputedStyle($('.g-fab__cancel')).borderTopColor), __c.bgOf(page)), badgeFail: __c.txt($('.g-fab__badge'), $('.g-fab__badge')) }
      }))
      await page.keyboard.press('Escape'); await page.waitForTimeout(250)
      R.danger = await page.evaluate(() => { const b = document.querySelector('.g-fab__item--danger'); return __c.txt(b.querySelector('.g-fab__label'), b) })
      await ctx.close()
    }
    const T = { pill: 4.5, actLabel: 4.5, pLabel: 4.5, pLabelHi: 4.5, pDesc: 4.5, pDescHi: 4.5, pGroup: 4.5, pDanger: 4.5, mainLabel: 4.5, findQ: 4.5, findCount: 4.5, findHint: 4.5, findNone: 4.5, cancel: 4.5, confirm: 4.5, danger: 4.5, seed: 3, seedOn: 3, fabIcon: 3, fabEdge: 3, more: 3, focus: 3, badgeIcon: 3, badgeEdge: 3, badgeDone: 3, badgeFail: 3, pIcon: 3, pEdge: 3, pFocus: 3, mainEdge: 3, cancelEdge: 3 }
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
  }
  await browser.close()
}
server.close()
console.log(notes.join('\n'))
console.log('\nMínimos medidos:\n' + Object.entries(mins).map(([k, v]) => `  ${k}: ${v.v.toFixed(2)}`).join('\n'))
console.log('\nPor motor: ' + Object.entries(counts).map(([k, v]) => `${k} ${v}`).join(' · '))
console.log(`\n${total - failed}/${total} comprobaciones correctas`)
if (fails.length) { console.log('FALLOS:\n' + fails.join('\n')); process.exitCode = 1 }
