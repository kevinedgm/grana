// Auditoría de coco (paso 5) de GFab sobre el COMPONENTE REAL: design/lab/fab/auditoria-banco.html con GFab de
// dist/fab.umd.js, GBtn/GTooltip/GIcon/GToaster/GDialog de dist/grana.umd.js, GStatusIsland de dist/status.umd.js,
// dist/grana.css y dist/fonts.css; la voz, en el playground (#sec-fab con ?fabanchor=viewport&speech=self).
// Qué mide: 0 · CSS fuente y publicado (tokens, respaldos, literales, curvas, #690, clases y datos de fab.md frente al CSS,
// al .vue y al meta.json, peso de la entrada); M · marcado real frente a «Anatomía»; 1 · contraste (defecto, el tema de la
// auditoría de @grana/cli y, en Chromium, los once de dark-color-presence/generated; claro y oscuro; zona de marca);
// 2 · áreas (≥ 24px, ≥ 44px con puntero grueso) y texto ≥ 12px; 3 · foco visible; 4 · comportamiento (abrir y cerrar por
// cada vía, la pila y la cola, Δ de las cuatro primeras, C con main y búsqueda, confirmación, acuse, se aparta, velo táctil,
// seis posiciones LTR y RTL, bordes con GToaster, la isla y la voz, GDialog modal); 5 · movimiento y reducido; 6 · reflujo a
// 320px y texto al 200 %; 7 · forced-colors (donde el motor lo emula); 8 · remates de #690 (deshabilitada) y #691 (panel que
// cubre la pila con una etiqueta larga). Consola limpia en cada página.
// Ejecutar desde la raíz del repo (requiere dist/):  GRANA_PW_PORT=4214 node design/lab/fab/auditoria-verificar.mjs
// Opcional: --engines=chromium,firefox,webkit  --themes=all|base (por defecto: todos en Chromium, base en Firefox y WebKit)
//   --only=0,m,1,2,3,4,5,6,7,8  --verbose  --dist=<carpeta> (sirve /packages/vue/dist/ desde una copia)
import http from 'node:http'
import { readFile } from 'node:fs/promises'
import { gzipSync } from 'node:zlib'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const pw = await import(new URL('../theme-playground/node_modules/playwright/index.mjs', import.meta.url))
const ROOT = fileURLToPath(new URL('../../../', import.meta.url))
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')).map(([k, v]) => [k, v ?? true]))
const DIST = args.dist ? String(args.dist) : join(ROOT, 'packages/vue/dist')
const ENGINES = (args.engines || 'chromium,firefox,webkit').split(',')
const ONLY = args.only ? new Set(String(args.only).split(',')) : null
const run = (n) => !ONLY || ONLY.has(String(n))
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const server = http.createServer(async (req, res) => {
  try {
    const u = decodeURIComponent(new URL(req.url, 'http://x').pathname)
    const p = args.dist && u.startsWith('/packages/vue/dist/') ? normalize(join(DIST, u.slice(19))) : normalize(join(ROOT, u))
    if (!p.startsWith(ROOT) && !(args.dist && p.startsWith(normalize(DIST)))) throw new Error('fuera')
    const body = await readFile(p)
    res.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream' }).end(body)
  } catch { try { if (!res.headersSent) res.writeHead(404); res.end() } catch {} }
})
await new Promise((r) => server.listen(Number(process.env.GRANA_PW_PORT) || 4214, '127.0.0.1', r))
const ORIGIN = `http://127.0.0.1:${server.address().port}`
const BASE = `${ORIGIN}/design/lab/fab/auditoria-banco.html`

const GEN = ['amazon', 'apple', 'caracol-purpura', 'github', 'grana', 'linear', 'lustre', 'medium', 'notion', 'spotify', 'stripe']
const POS = ['bottom-end', 'bottom-start', 'bottom-center', 'top-end', 'top-start', 'top-center']
let total = 0, failed = 0, ENG = 'estático'
const fails = [], notes = [], counts = {}, mins = {}
const ok = (cond, msg) => { total++; counts[ENG] = counts[ENG] || [0, 0]; counts[ENG][1]++; if (cond) counts[ENG][0]++; else { failed++; fails.push(msg) } if (args.verbose) console.log(cond ? '  ok ' : '  NO ', msg) }
const note = (s) => notes.push(s)
const track = (k, v) => { if (Number.isFinite(v) && (!(k in mins) || v < mins[k])) mins[k] = v }
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '')

/* ---------- 0 · CSS fuente y publicado, contrato, .vue y meta.json ---------- */
if (run(0)) {
  const raw = await readFile(join(ROOT, 'packages/vue/src/components/GFab/GFab.css'), 'utf8')
  const css = strip(raw)
  const vue = await readFile(join(ROOT, 'packages/vue/src/components/GFab/GFab.vue'), 'utf8')
  const contract = await readFile(join(ROOT, 'design/contracts/fab.md'), 'utf8')
  const defaults = await readFile(join(ROOT, 'packages/vue/src/styles/defaults.css'), 'utf8')
  const defined = new Set([...defaults.matchAll(/(--g-[a-z0-9-]+)\s*:/g)].map((m) => m[1]))
  ok(!/#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|lab|lch|hwb)\(/.test(css), 'GFab.css: color literal')
  ok([...css.matchAll(/color-mix\(([^;]*)\)/g)].every((m) => /currentColor/.test(m[1])), 'GFab.css: color-mix que no parte de currentColor')
  const sysColors = [...css.matchAll(/\b(CanvasText|Canvas|Highlight|ButtonText|ButtonFace|GrayText|LinkText)\b/g)].length
  const sysInForced = [...((css.match(/@media \(forced-colors: active\) \{[\s\S]*?\n\}/) || [''])[0]).matchAll(/\b(CanvasText|Canvas|Highlight|ButtonText|ButtonFace|GrayText|LinkText)\b/g)].length
  ok(sysColors === sysInForced, `GFab.css: color del sistema fuera de forced-colors (${sysColors} vs ${sysInForced})`)
  ok(!/var\(\s*--[\w-]+\s*,/.test(css), 'GFab.css: var() con valor de respaldo')
  ok(!/@layer/.test(css) && !/!important/.test(css), 'GFab.css: @layer o !important')
  const vars = [...css.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1])
  ok(vars.every((v) => v.startsWith('--g-') || v.startsWith('--_')), 'GFab.css: var() que no es --g-* ni --_*')
  const missing = [...new Set(vars.filter((v) => v.startsWith('--g-') && !defined.has(v)))]
  ok(!missing.length, 'GFab.css: tokens que no existen en defaults.css: ' + missing)
  ok(!vars.some((v) => /^--g-color-(on-)?brand/.test(v)), 'GFab.css: lee --g-color-brand* (roles.test.js)')
  // §47 (#690 añade neutral-soft; primary-text es de GBtn solid, #678)
  const allowed = ['--g-color-surface', '--g-color-surface-sunken', '--g-color-border', '--g-color-border-control', '--g-color-text', '--g-color-text-muted', '--g-color-text-subtle', '--g-color-danger-text', '--g-color-danger', '--g-color-on-danger', '--g-color-success', '--g-color-success-text', '--g-color-on-success', '--g-color-focus', '--g-surface-backdrop', '--g-color-primary', '--g-color-neutral-soft']
  const colors = [...new Set(vars.filter((v) => /^--g-(color|surface)/.test(v)))]
  ok(colors.every((v) => allowed.includes(v)), 'GFab.css: tokens de color fuera de tokens.md §47: ' + colors.filter((v) => !allowed.includes(v)))
  const tok47 = contract.slice(contract.indexOf('## Tokens consumidos'), contract.indexOf('## Clases y datos'))
  ok(colors.every((v) => tok47.includes(v)), 'fab.md «Tokens consumidos» no recoge: ' + colors.filter((v) => !tok47.includes(v)))
  const own = new Set([...css.matchAll(/(--_[\w-]+)\s*:/g)].map((m) => m[1]))
  ok([...new Set(vars.filter((v) => v.startsWith('--_') && !own.has(v)))].every((v) => /^--_(bg|fg|border)(-hover)?$/.test(v)), 'GFab.css: lee alias --_* que no declara')
  const px = [...css.matchAll(/(-?\d*\.?\d+)px/g)].map((m) => m[0])
  ok(px.every((p) => ['24px', '44px', '1px', '-1px', '0.5px'].includes(p)), 'GFab.css: medidas literales no permitidas: ' + px.filter((p) => !['24px', '44px', '1px', '-1px', '0.5px'].includes(p)))
  ok(!/\d(?:rem|em|ch|vh|vw|vmin|vmax|dvh|svh)\b/.test(css), 'GFab.css: rem/em/ch/vh/vw literales')
  ok(!/\d(?:ms|s)\b/.test(css.replace(/@keyframes[\s\S]*?\}\s*\}/g, '')), 'GFab.css: duraciones literales')
  ok(!/ease-spring|ease-bounce|cubic-bezier|steps\(/.test(css), 'GFab.css: muelle, rebote o curva propia (#299, #655)')
  ok(!/clip-path\s*:\s*polygon|\bpath\(|\bshape\(/.test(css), 'GFab.css: polígono, path() o shape() (icons.md §1)')
  const kf = [...css.matchAll(/@keyframes\s+([\w-]+)/g)].map((m) => m[1])
  ok(kf.length === 1 && kf[0] === 'g-fab-spin', 'GFab.css: keyframes ' + kf)
  // Movimiento: toda transición fuera de las consultas es la de «opening» (none)
  const outside = css.replace(/@media \(prefers-reduced-motion: (?:no-preference|reduce)\) \{[\s\S]*?\n\}/g, '').replace(/@starting-style\s*\{[\s\S]*?\}\s*\}/g, '')
  const outsideT = [...outside.matchAll(/([^{}]+)\{([^{}]*transition\s*:[^{}]*)\}/g)]
  ok(outsideT.length === 1 && /transition: none;/.test(outsideT[0][2]), 'GFab.css: transición fuera de las consultas de movimiento')
  const reduce = (css.match(/@media \(prefers-reduced-motion: reduce\) \{([\s\S]*?)\n\}/) || [])[1] || ''
  ok(!/translate\s+var|scale\s+var|rotate\s+var|clip-path\s+var/.test(reduce) && /animation: none/.test(reduce), 'GFab.css: reducido con transiciones de desplazamiento o con el giro de la insignia')
  // #690: deshabilitada no en curso con los alias de GBtn deshabilitado + border-control; sin escala; GrayText en forzados
  const dis = (css.match(/\.g-fab > \.g-btn:is\(\[aria-disabled="true"\], \.is-disabled, :disabled\):not\(\[data-ack="busy"\]\),\s*\.g-fab__main-group > \.g-fab__main\[aria-disabled="true"\]:not\(\[data-ack="busy"\]\) \{([^}]*)\}/) || [])[1] || ''
  ok(/--_bg: var\(--g-color-neutral-soft\)/.test(dis) && /--_fg: var\(--g-color-text-subtle\)/.test(dis) && /--_border: var\(--g-color-border-control\)/.test(dis) && /--_bg-hover: var\(--g-color-neutral-soft\)/.test(dis) && /--_fg-hover: var\(--g-color-text-subtle\)/.test(dis) && /--_border-hover: var\(--g-color-border-control\)/.test(dis) && /cursor: not-allowed/.test(dis), 'GFab.css: deshabilitada (#690) sin neutral-soft / text-subtle / border-control en reposo y al pasar')
  ok(/\.g-fab\.g-fab > \.g-btn\[aria-disabled="true"\]:not\(\[data-ack="busy"\]\):active,\s*\.g-fab__main-group > \.g-fab__main\.g-btn\[aria-disabled="true"\]:not\(\[data-ack="busy"\]\):active \{ transform: none; \}/.test(css), 'GFab.css: la deshabilitada sin escala al apretar (#690)')
  ok(/@media \(forced-colors: active\)[\s\S]*\.g-fab__item\[aria-disabled="true"\]:not\(\[data-ack="busy"\]\),\s*\.g-fab__list \.g-fab__item\[aria-disabled="true"\]:not\(\[data-ack="busy"\]\) \.g-fab__icon \{ color: GrayText; \}/.test(css), 'GFab.css: elemento deshabilitado (no en curso) e icono en GrayText en forzados, con la especificidad de las reglas de color')
  ok(/@media \(forced-colors: active\)[\s\S]*\.g-fab__main\[aria-disabled="true"\]:not\(\[data-ack="busy"\]\) \{\s*color: GrayText;\s*border-color: GrayText;/.test(css), 'GFab.css: deshabilitada en GrayText en forzados (#690)')
  // Clases y datos de fab.md frente al CSS y al .vue
  const table = contract.slice(contract.indexOf('## Clases y datos'), contract.indexOf('## Slots'))
  const names = [...new Set([...table.matchAll(/`(g-fab[\w-]*|is-[\w-]+|has-[\w-]+|--_[\w-]+|data-[\w-]+)`/g)].map((m) => m[1]))]
  const full = names.concat(['g-fab__glyph--rest', 'g-fab__glyph--open', 'g-fab__list--stack', 'g-fab__list--panel', 'g-fab__item--danger', 'g-fab__item--more', 'g-fab__label', 'g-fab__desc', 'g-fab__reason', 'g-fab__mark', 'g-fab__cancel', 'g-fab__confirm-action'])
  const inCss = (c) => c.startsWith('--_') ? css.includes(`var(${c})`) : c.startsWith('data-') ? css.includes(`[${c}`) : new RegExp('\\.' + c.replace(/-/g, '\\-') + '(?![\\w-])').test(css)
  // Sin regla a propósito: --_h (no se escribe en el velo), --_max/--_w/--_x/--_y del velo, data-anchor (el CSS lee data-anchor sí)
  const noRule = ['--_h']
  ok(full.filter((c) => !noRule.includes(c)).every(inCss), 'fab.md: clase o dato sin regla en GFab.css: ' + full.filter((c) => !noRule.includes(c) && !inCss(c)))
  const cssClasses = [...new Set([...css.matchAll(/\.(g-fab[\w-]*)/g)].map((m) => m[1]))]
  ok(cssClasses.every((c) => full.includes(c)), 'GFab.css: clases que fab.md no fija: ' + cssClasses.filter((c) => !full.includes(c)))
  const vueHas = (c) => c === 'is-coarse' || (c.startsWith('g-fab__list--') ? vue.includes('g-fab__list--${') : c.startsWith('data-') ? vue.includes(`'${c}'`) : c.startsWith('--_') ? vue.includes(`'${c}'`) || vue.includes(`${c}:`) || ['--_active-y', '--_active-h'].includes(c) : c === 'g-fab' ? /'g-fab'/.test(vue) : ['has-highlight', 'is-highlight-instant'].includes(c) || vue.includes(c))
  ok(full.filter((c) => c !== '--_h').every(vueHas), 'GFab.vue: no escribe ' + full.filter((c) => c !== '--_h' && !vueHas(c)))
  const meta = JSON.parse(await readFile(join(ROOT, 'packages/vue/src/components/GFab/GFab.meta.json'), 'utf8'))
  ok(meta.style === 'packages/vue/src/components/GFab/GFab.css', 'GFab.meta.json: style no apunta a GFab.css')
  // Publicado
  const dcss = await readFile(join(DIST, 'grana.css'), 'utf8')
  const layerAt = dcss.indexOf('@layer grana.components')
  ok(layerAt >= 0 && dcss.indexOf('.g-fab__item') > layerAt, 'dist: GFab.css fuera de @layer grana.components')
  ok(/g-fab__main\[aria-disabled=["]?true["]?\]:not\(\[data-ack=["]?busy["]?\]\)\{--_bg: ?var\(--g-color-neutral-soft\)/.test(dcss), 'dist: grana.css sin la deshabilitada de #690 (reconstruir)')
  ok(dcss.split('.g-fab').length >= css.split('.g-fab').length - 2, 'dist: grana.css no recoge GFab.css entero')
  ok(!/data:font/.test(dcss), 'dist: fuente incrustada')
  const gjs = await readFile(join(DIST, 'grana.js'), 'utf8'), fjs = await readFile(join(DIST, 'fab.js'))
  ok(!/name: "GFab"/.test(gjs) && /name: "GFab"/.test(fjs.toString()), 'dist: GFab solo en su entrada (#656)')
  const gz = gzipSync(fjs).length
  ok(gz <= 10496, `dist: fab.js ${gz} B gzip ≤ 10 496 (#676)`)
  note(`[estático] fab.js ${gz} B gzip; tokens de color: ${colors.join(', ')}`)
}

/* ---------- Utilidades del navegador ---------- */
const LIB = `
window.__c = (() => {
  const cv = document.createElement('canvas'); cv.width = cv.height = 1
  const cx = cv.getContext('2d', { willReadFrequently: true })
  const rgba = (s) => { if (!s || s === 'transparent') return [0, 0, 0, 0]; cx.clearRect(0, 0, 1, 1); cx.fillStyle = '#000'; cx.fillStyle = s; cx.fillRect(0, 0, 1, 1); const d = cx.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255] }
  const over = (f, b) => [0, 1, 2].map((i) => f[i] * f[3] + b[i] * (1 - f[3])).concat(1)
  const lum = (c) => { const [r, g, b] = c.slice(0, 3).map((v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }); return 0.2126 * r + 0.7152 * g + 0.0722 * b }
  const cr = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) }
  const bgOf = (el) => { const stack = []; for (let n = el; n; n = n.parentElement) { const c = rgba(getComputedStyle(n).backgroundColor); if (c[3] > 0) stack.push(c); if (c[3] >= 1) break } let acc = [255, 255, 255, 1]; for (const c of stack.reverse()) acc = over(c, acc); return acc }
  const txt = (el, bgEl) => { const f = rgba(getComputedStyle(el).color); const b = bgOf(bgEl || el); return cr(over(f, b), b) }
  const on = (fg, bg) => { const b = bgOf(bg); return cr(over(rgba(fg), b), b) }
  const tok = (el, name) => { const i = document.createElement('i'); i.style.color = 'var(' + name + ')'; el.appendChild(i); const c = rgba(getComputedStyle(i).color); i.remove(); return c }
  return { rgba, over, cr, bgOf, txt, on, tok }
})()`

async function open(browser, q = '', vp = { width: 1000, height: 700 }, extra = {}, url = BASE) {
  const ctx = await browser.newContext({ viewport: vp, ...extra })
  const page = await ctx.newPage()
  const errs = []
  page.on('console', (m) => { const t = m.text(); if ((m.type() === 'error' || (m.type() === 'warning' && /\[Grana|\[Vue warn\]/.test(t))) && !/favicon|Failed to load resource|404/.test(t)) errs.push(t) })
  page.on('pageerror', (e) => { if (!/ResizeObserver loop/.test(e.message)) errs.push(e.message) })
  await page.goto(url + (q ? '?' + q : ''), { waitUntil: 'domcontentloaded', timeout: 90000 })
  if (url === BASE) await page.waitForFunction(() => window.__ready && document.querySelector('.g-fab'), null, { timeout: 90000 })
  await page.evaluate(() => document.fonts.ready)
  await page.evaluate(LIB)
  await page.waitForTimeout(250)
  return { ctx, page, errs }
}
const settle = (p, ms = 320) => p.waitForTimeout(ms)
async function openFab(page, how = 'click') {
  if (how === 'click') await page.click('#fab-trigger')
  else { await page.focus('#fab-trigger'); await page.keyboard.press(how) }
  await page.waitForFunction(() => document.getElementById('fab').dataset.state === 'open', null, { timeout: 5000 })
  await settle(page)
}
async function openTail(page) { await page.click('#fab-tail'); await page.waitForFunction(() => document.querySelector('#fab-more')?.dataset.state === 'open', null, { timeout: 5000 }); await settle(page) }
const R = (p, sel) => p.evaluate((sel) => { const e = document.querySelector(sel); if (!e) return null; const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height } }, sel)
const hit = (a, b, m = 0) => a.l < b.r - m && b.l < a.r - m && a.t < b.b - m && b.t < a.b - m
// Selecciona una acción por su id con el plan dado y espera a que la lista se cierre
async function selectBy(page, id, plan) {
  if (plan) await page.evaluate(([id, p]) => { window.__b.plan[id] = p }, [id, plan])
  const inStack = await page.evaluate((id) => !!document.querySelector(`#fab-menu [data-key^="string:${id}:"]`), id)
  if (!inStack) await openTail(page)
  await page.click(`.g-fab__list [data-key^="string:${id}:"]`)
  await settle(page, 400)
}

for (const engine of ENGINES) {
  const browser = await pw[engine].launch()
  ENG = engine
  const E = `[${engine}]`
  const TAB = engine === 'webkit' ? 'Alt+Tab' : 'Tab'
  const touch = engine !== 'firefox' ? { hasTouch: true, isMobile: true } : {}

  /* ---------- M · Marcado real ---------- */
  if (run('m')) {
    const a = await open(browser, 'n=15&theme=audit')
    const closed = await a.page.evaluate(() => { const r = document.getElementById('fab'), t = document.getElementById('fab-trigger'); return { pos: r.dataset.position, anchor: r.dataset.anchor, app: r.dataset.appearance, st: r.dataset.state, hp: t.getAttribute('aria-haspopup'), ex: t.getAttribute('aria-expanded'), ctl: t.getAttribute('aria-controls'), glyphs: t.querySelectorAll('.g-fab__glyph--rest, .g-fab__glyph--open').length, gHidden: [...t.querySelectorAll('.g-fab__glyph')].every((g) => g.getAttribute('aria-hidden') === 'true'), badge: !!t.querySelector('.g-fab__badge[aria-hidden="true"]'), parent: t.parentElement === r && t.classList.contains('g-btn'), name: t.getAttribute('aria-labelledby') && document.getElementById(t.getAttribute('aria-labelledby'))?.textContent, list: (() => { const u = document.getElementById('fab-menu'); return u.getAttribute('role') + '|' + u.getAttribute('popover') + '|' + u.getAttribute('tabindex') + '|' + u.getAttribute('aria-labelledby') })(), scrim: (() => { const s = r.querySelector('.g-fab__scrim'); return s && s.getAttribute('popover') === 'manual' && s.getAttribute('aria-hidden') === 'true' && s.children.length === 1 && s.firstElementChild.classList.contains('g-fab__scrim-part') })(), reserve: r.style.getPropertyValue('--_reserve') } })
    ok(closed.pos === 'bottom-end' && closed.anchor === 'viewport' && closed.app === 'stack' && closed.st === 'closed', `${E}[marcado] raíz con data-position/anchor/appearance/state: ${JSON.stringify(closed).slice(0, 120)}`)
    ok(closed.hp === 'menu' && closed.ex === 'false' && closed.ctl === 'fab-menu' && closed.parent, `${E}[marcado] FAB: GBtn hijo directo, botón de menú con aria-expanded y aria-controls`)
    ok(closed.glyphs === 2 && closed.gHidden && closed.badge, `${E}[marcado] FAB con g-fab__glyph--rest/--open aria-hidden y g-fab__badge`)
    ok(closed.name === 'Crear y capturar', `${E}[marcado] el FAB se nombra por GTooltip con label: ${closed.name}`)
    ok(closed.list === 'menu|manual|-1|fab-trigger', `${E}[marcado] ul role=menu popover=manual tabindex=-1 aria-labelledby: ${closed.list}`)
    ok(closed.scrim, `${E}[marcado] velo div.g-fab__scrim popover manual aria-hidden con un span.g-fab__scrim-part`)
    ok(/px$/.test(closed.reserve), `${E}[marcado] --_reserve en línea con anchor viewport: ${closed.reserve}`)
    await openFab(a.page)
    const op = await a.page.evaluate(() => { const u = document.getElementById('fab-menu'); const lis = [...u.children]; const items = lis.map((li) => li.firstElementChild); const t = document.getElementById('fab-tail'); return { lisNone: lis.every((li) => li.getAttribute('role') === 'none'), mi: items.every((b) => b.getAttribute('role') === 'menuitem' && b.tagName === 'BUTTON'), last: items.at(-1).querySelector('.g-fab__label').textContent, first: items[0].id, tail: t && t.getAttribute('aria-haspopup') + '|' + t.getAttribute('aria-controls') + '|' + t.getAttribute('aria-expanded') + '|' + t.textContent, ex: document.getElementById('fab-trigger').getAttribute('aria-expanded'), roving: items.filter((b) => b.tabIndex === 0).length, focus: document.activeElement.querySelector('.g-fab__label')?.textContent, srDesc: (() => { const d = u.querySelector('.g-fab__desc'); return d && d.classList.contains('g-fab__sr') && d.getClientRects().length && d.getBoundingClientRect().width <= 1 })() } })
    ok(op.lisNone && op.mi, `${E}[marcado] li role=none > button role=menuitem`)
    ok(op.last === 'Nueva muestra' && op.first === 'fab-tail', `${E}[marcado] pila que sube: la primera de items es la última del DOM y la cola la primera: ${op.last} · ${op.first}`)
    ok(op.tail === 'menu|fab-more|false|Más acciones (11)', `${E}[marcado] cola con aria-haspopup, aria-controls, aria-expanded y su cuenta: ${op.tail}`)
    ok(op.ex === 'true' && op.roving === 1 && op.focus === 'Nueva muestra', `${E}[marcado] abierto: aria-expanded, una parada itinerante, foco en la primera por frecuencia: ${op.ex} ${op.roving} ${op.focus}`)
    ok(op.srDesc, `${E}[marcado] la descripción en la pila es texto oculto accesible (g-fab__sr)`)
    await openTail(a.page)
    const pn = await a.page.evaluate(() => { const u = document.getElementById('fab-more'); const gs = [...u.querySelectorAll('ul[role="group"]')]; return { lab: u.getAttribute('aria-labelledby'), groups: gs.length, named: gs.every((g) => { const t = document.getElementById(g.getAttribute('aria-labelledby')); return t && t.classList.contains('g-fab__group-title') && t.getAttribute('role') === 'presentation' && t.textContent }), desc: [...u.querySelectorAll('.g-fab__desc')].every((d) => !d.classList.contains('g-fab__sr') && d.getClientRects().length), dis: (() => { const b = u.querySelector('[data-key^="string:prefs:"]'); return b.getAttribute('aria-disabled') + '|' + document.getElementById(b.getAttribute('aria-describedby'))?.textContent })(), danger: !!u.querySelector('.g-fab__item--danger .g-fab__mark[aria-hidden="true"] svg'), exp: document.getElementById('fab-tail').classList.contains('is-expanded') } })
    ok(pn.lab === 'fab-tail' && pn.groups === 4 && pn.named, `${E}[marcado] panel de la cola nombrado por la cola, con grupos role=group nombrados por su título (role=presentation): ${pn.groups}`)
    ok(pn.desc && pn.dis === 'true|Solo para coordinación' && pn.danger && pn.exp, `${E}[marcado] panel: descripciones visibles, deshabilitada aria-disabled con motivo, marca de peligro, cola is-expanded: ${pn.dis}`)
    ok(!a.errs.length, `${E}[marcado] consola limpia: ${a.errs}`)
    await a.ctx.close()
    const c = await open(browser, 'main=1&n=15')
    const cm = await c.page.evaluate(() => { const g = document.querySelector('.g-fab__main-group'); const bs = [...g.querySelectorAll(':scope > button')]; return { root: document.getElementById('fab').dataset.appearance, role: g.getAttribute('role') + '|' + g.getAttribute('aria-label'), first: bs[0].classList.contains('g-fab__main') && bs[0].textContent.includes('Nueva muestra'), firstHp: bs[0].hasAttribute('aria-haspopup'), last: bs.at(-1).id + '|' + bs.at(-1).getAttribute('aria-haspopup'), glyphs: bs.at(-1).querySelectorAll('.g-fab__glyph--rest, .g-fab__glyph--open').length, badge: !!bs[0].querySelector('.g-fab__badge') } })
    ok(cm.root === 'main' && cm.role === 'group|Crear y capturar' && cm.first && !cm.firstHp && cm.last === 'fab-trigger|menu' && cm.glyphs === 2 && cm.badge, `${E}[marcado·C] grupo nombrado con la principal primero (etiqueta visible, insignia) y la cola botón de menú último: ${JSON.stringify(cm)}`)
    await openFab(c.page)
    const cf = await c.page.evaluate(() => { const f = document.querySelector('#fab-menu > li.g-fab__find'); return { find: !!f && f.getAttribute('aria-hidden') === 'true' && f.getAttribute('role') === 'none' && f.textContent, app: document.getElementById('fab-menu').dataset.appearance, noTextbox: !document.querySelector('.g-fab [role="textbox"], .g-fab input') } })
    ok(cf.find === 'Escribe para buscar' && cf.app === 'panel' && cf.noTextbox, `${E}[marcado·C] panel con la pista de búsqueda aria-hidden y sin textbox: ${JSON.stringify(cf)}`)
    await c.ctx.close()
    const s = await open(browser, 'n=1')
    const sg = await s.page.evaluate(() => { const r = document.getElementById('fab'), b = r.querySelector(':scope > button'); return r.dataset.appearance + '|' + b.hasAttribute('aria-haspopup') + '|' + b.hasAttribute('aria-expanded') + '|' + !!r.querySelector('.g-fab__list') + '|' + document.getElementById(b.getAttribute('aria-labelledby'))?.textContent })
    ok(sg === 'single|false|false|false|Nueva muestra', `${E}[marcado·single] el FAB es la acción, sin haspopup ni lista: ${sg}`)
    await s.ctx.close()
  }

  /* ---------- 1 · Contraste ---------- */
  if (run(1)) {
    const themes = (args.themes === 'all' || (!args.themes && engine === 'chromium')) ? ['', 'audit', ...GEN] : ['', 'audit']
    const cases = []
    for (const th of themes) for (const dark of [false, true]) cases.push({ th, dark, zone: false })
    for (const th of ['', 'audit']) for (const dark of [false, true]) cases.push({ th, dark, zone: true })
    for (const c of cases) {
      const q = [c.th && 'theme=' + c.th, c.dark && 'dark=1', c.zone && 'zone=1'].filter(Boolean).join('&')
      const name = `${E}[${c.th || 'defecto'}${c.dark ? '·oscuro' : '·claro'}${c.zone ? '·zona' : ''}]`
      const M = {}
      // A con 15: en curso (csv), fallo (photo), pila, cola, panel
      {
        const { ctx, page, errs } = await open(browser, `${q}&n=15`)
        await openFab(page); await selectBy(page, 'photo', 'failed')
        await openFab(page); await selectBy(page, 'csv', 'busy')
        await openFab(page)
        Object.assign(M, await page.evaluate(() => {
          const $ = (s) => document.querySelector(s), $$ = (s) => [...document.querySelectorAll(s)]
          const fab = $('#fab-trigger'), pg = $('main'), cs = getComputedStyle(fab)
          const items = $$('#fab-menu .g-fab__item')
          const act = document.activeElement.closest('.g-fab__item'), ai = act.querySelector('.g-fab__icon')
          const fb = $('#fab-menu [data-ack="failed"]'), rs = fb && fb.querySelector('.g-fab__reason')
          return {
            pill: Math.min(...items.map((b) => __c.txt(b.querySelector('.g-fab__label'), b))),
            seed: Math.min(...items.filter((b) => b !== act).map((b) => { const i = b.querySelector('.g-fab__icon'); return __c.txt(i, i) })),
            seedOn: __c.txt(ai, ai), actLabel: __c.txt(act.querySelector('.g-fab__label'), act),
            fabIcon: __c.txt(fab, fab), fabFill: __c.cr(__c.bgOf(fab), __c.bgOf(pg)),
            fabEdge: __c.cr(__c.over(__c.rgba(cs.borderTopColor), __c.bgOf(pg)), __c.bgOf(pg)),
            more: __c.cr(__c.over(__c.rgba(getComputedStyle($('#fab-tail')).borderTopColor), __c.bgOf(pg)), __c.bgOf(pg)),
            focus: __c.cr(__c.tok(fab, '--g-color-focus'), __c.bgOf(pg)),
            badgeBusy: __c.txt($('.g-fab__badge'), $('.g-fab__badge')), badgeEdge: __c.cr(__c.rgba(getComputedStyle($('.g-fab__badge')).borderTopColor), __c.bgOf(pg)),
            sFail: rs ? __c.txt(rs, fb) : 0
          }
        }))
        await openTail(page)
        Object.assign(M, await page.evaluate(() => {
          const $ = (s) => document.querySelector(s), $$ = (s) => [...document.querySelectorAll(s)]
          const sub = $('#fab-more'), pg = $('main')
          const sunk = __c.over(__c.tok(sub, '--g-color-surface-sunken'), __c.bgOf(sub))
          const labs = $$('#fab-more .g-fab__item:not([aria-disabled]) .g-fab__label')
          return {
            pLabel: Math.min(...labs.map((e) => __c.txt(e, sub))),
            pLabelHi: Math.min(...labs.map((e) => __c.cr(__c.over(__c.rgba(getComputedStyle(e).color), sunk), sunk))),
            pDesc: Math.min(...$$('#fab-more .g-fab__desc, #fab-more .g-fab__reason').map((e) => __c.txt(e, sub))),
            pGroup: Math.min(...$$('#fab-more .g-fab__group-title').map((e) => __c.txt(e, sub))),
            pIcon: Math.min(...$$('#fab-more .g-fab__item:not([aria-disabled]):not(.g-fab__item--danger) .g-fab__icon').map((e) => __c.txt(e, sub))),
            pDanger: Math.min(...$$('#fab-more .g-fab__item--danger .g-fab__label').map((e) => __c.txt(e, sub))),
            pEdge: __c.cr(__c.rgba(getComputedStyle(sub).borderTopColor), __c.bgOf(pg)),
            pFocus: __c.cr(__c.tok(sub, '--g-color-focus'), __c.bgOf(sub)),
            pBusy: __c.txt($('#fab-more [data-ack="busy"] .g-fab__label'), sub), pBusyReason: __c.txt($('#fab-more [data-ack="busy"] .g-fab__reason'), sub),
            pDisabled: __c.txt($('#fab-more [aria-disabled="true"]:not([data-ack]) .g-fab__reason'), sub)
          }
        }))
        ok(!errs.length, `${name} consola limpia: ${errs}`)
        await ctx.close()
      }
      // Hecho en la insignia; confirmación armada (pila con 3)
      {
        const { ctx, page } = await open(browser, `${q}&n=3`)
        await openFab(page); await selectBy(page, 'photo', 'done')
        M.badgeDone = await page.evaluate(() => __c.txt(document.querySelector('.g-fab__badge'), document.querySelector('.g-fab__badge')))
        M.badgeDoneEdge = await page.evaluate(() => __c.cr(__c.rgba(getComputedStyle(document.querySelector('.g-fab__badge')).borderTopColor), __c.bgOf(document.querySelector('main'))))
        await openFab(page)
        await page.click('.g-fab__list [data-key^="string:purge:"]'); await settle(page, 250)
        Object.assign(M, await page.evaluate(() => { const $ = (s) => document.querySelector(s), pg = $('main'); return { cancel: __c.txt($('.g-fab__cancel'), $('.g-fab__cancel')), confirm: __c.txt($('.g-fab__confirm-action'), $('.g-fab__confirm-action')), cancelEdge: __c.cr(__c.rgba(getComputedStyle($('.g-fab__cancel')).borderTopColor), __c.bgOf(pg)), confirmEdge: __c.cr(__c.rgba(getComputedStyle($('.g-fab__confirm-action')).borderTopColor), __c.bgOf(pg)) } }))
        await page.keyboard.press('Escape'); await settle(page, 200)
        M.danger = await page.evaluate(() => { const b = document.querySelector('.g-fab__item--danger'); return __c.txt(b.querySelector('.g-fab__label'), b) })
        await ctx.close()
      }
      // C: principal, pista, búsqueda y fallo en la principal
      {
        const { ctx, page } = await open(browser, `${q}&n=15&main=1`)
        M.mainLabel = await page.evaluate(() => __c.txt(document.querySelector('.g-fab__main'), document.querySelector('.g-fab__main')))
        M.mainEdge = await page.evaluate(() => __c.cr(__c.over(__c.rgba(getComputedStyle(document.querySelector('.g-fab__main')).borderTopColor), __c.bgOf(document.querySelector('main'))), __c.bgOf(document.querySelector('main'))))
        await openFab(page)
        M.findHint = await page.evaluate(() => __c.txt(document.querySelector('.g-fab__find > span'), document.querySelector('.g-fab__find')))
        await page.keyboard.type('exp'); await settle(page, 200)
        Object.assign(M, await page.evaluate(() => ({ findQ: __c.txt(document.querySelector('.g-fab__find-query'), document.querySelector('.g-fab__find-query')), findCount: __c.txt(document.querySelector('.g-fab__find-count'), document.querySelector('.g-fab__find')) })))
        await page.keyboard.type('zz'); await settle(page, 200)
        M.findNone = await page.evaluate(() => __c.txt(document.querySelector('.g-fab__find > span'), document.querySelector('.g-fab__find')))
        await ctx.close()
      }
      // Deshabilitada (#690): single y principal de C; el contorno frente a la página y el texto sobre neutral-soft
      {
        const { ctx, page } = await open(browser, `${q}&n=1&off=1`)
        Object.assign(M, await page.evaluate(() => { const b = document.querySelector('.g-fab > button'), cs = getComputedStyle(b), pg = __c.bgOf(document.querySelector('main')); return { offEdge: __c.cr(__c.over(__c.rgba(cs.borderTopColor), pg), pg), offText: __c.txt(b, b) } }))
        await ctx.close()
      }
      const T = { pill: 4.5, actLabel: 4.5, pLabel: 4.5, pLabelHi: 4.5, pDesc: 4.5, pGroup: 4.5, pDanger: 4.5, mainLabel: 4.5, findQ: 4.5, findCount: 4.5, findHint: 4.5, findNone: 4.5, cancel: 4.5, confirm: 4.5, danger: 4.5, pBusy: 4.5, pBusyReason: 4.5, pDisabled: 4.5, sFail: 4.5, seed: 3, seedOn: 3, fabIcon: 3, fabEdge: 3, more: 3, focus: 3, badgeBusy: 3, badgeEdge: 3, badgeDone: 3, badgeDoneEdge: 3, pIcon: 3, pEdge: 3, pFocus: 3, mainEdge: 3, cancelEdge: 3, confirmEdge: 3, offEdge: 3 }
      for (const [k, min] of Object.entries(T)) { ok(M[k] >= min, `${name} ${k} ${M[k] && M[k].toFixed(2)} ≥ ${min}`); track(k + (c.zone ? '·zona' : ''), M[k]) }
      track('fabFill (solo relleno)' + (c.zone ? '·zona' : ''), M.fabFill); track('offText (exento, 1.4.3)' + (c.zone ? '·zona' : ''), M.offText)
      if (args.verbose || !c.th || c.th === 'audit' || c.zone) note(`${name} ` + Object.keys(T).concat('fabFill', 'offText').map((k) => `${k} ${M[k] && M[k].toFixed(2)}`).join(' · '))
    }
  }

  /* ---------- 2 · Áreas y texto ≥ 12px ---------- */
  if (run(2)) {
    for (const [q, extra, min] of [['theme=audit&n=15', {}, 24], ['n=15', {}, 24], ['theme=audit&n=15&coarse=1', touch, 44], ['n=15&coarse=1', touch, 44]]) {
      const { ctx, page, errs } = await open(browser, q, { width: 1000, height: 760 }, extra)
      const P = `${E}[áreas·${q}]`
      const fab = await R(page, '#fab-trigger')
      ok(fab.w >= 44 && fab.h >= 44, `${P} FAB ≥ 44 × 44: ${fab.w.toFixed(1)} × ${fab.h.toFixed(1)}`)
      await openFab(page)
      const st = await page.evaluate(() => [...document.querySelectorAll('#fab-menu .g-fab__item')].map((b) => { const r = b.getBoundingClientRect(); return [r.width, r.height] }))
      ok(st.every(([w, h]) => w >= min - 0.01 && h >= min - 0.01), `${P} píldoras ≥ ${min}: ${st.map((x) => x.map((v) => v.toFixed(1)).join('×')).join(' ')}`)
      await openTail(page)
      const pn = await page.evaluate(() => [...document.querySelectorAll('#fab-more .g-fab__item')].map((b) => b.getBoundingClientRect().height))
      ok(pn.every((h) => h >= min - 0.01), `${P} filas del panel ≥ ${min}: ${Math.min(...pn).toFixed(1)}`)
      const small = await page.evaluate(() => [...document.querySelectorAll('.g-fab .g-fab__label, .g-fab .g-fab__desc:not(.g-fab__sr), .g-fab .g-fab__reason, .g-fab .g-fab__group-title, .g-fab__find')].filter((e) => e.getClientRects().length).map((e) => parseFloat(getComputedStyle(e).fontSize)))
      ok(small.every((s) => s >= 12), `${P} texto ≥ 12px: ${Math.min(...small)}`)
      track('texto mínimo (px)', Math.min(...small))
      await page.keyboard.press('Escape'); await page.keyboard.press('Escape'); await settle(page)
      ok(!errs.length, `${P} consola limpia: ${errs}`)
      await ctx.close()
      // Par de confirmación y C
      const p3 = await open(browser, q.replace('n=15', 'n=3'), { width: 1000, height: 760 }, extra)
      await openFab(p3.page); await p3.page.click('.g-fab__list [data-key^="string:purge:"]'); await settle(p3.page, 250)
      const pair = await p3.page.evaluate(() => [...document.querySelectorAll('.g-fab__cancel, .g-fab__confirm-action')].map((b) => { const r = b.getBoundingClientRect(); return [r.width, r.height] }))
      ok(pair.length === 2 && pair.every(([w, h]) => w >= min && h >= min), `${P} «Cancelar» y la confirmación ≥ ${min}: ${JSON.stringify(pair)}`)
      await p3.ctx.close()
      const pc = await open(browser, q + '&main=1', { width: 1000, height: 760 }, extra)
      const cc = await pc.page.evaluate(() => [...document.querySelectorAll('.g-fab__main-group > button')].map((b) => { const r = b.getBoundingClientRect(); return [r.width, r.height] }))
      ok(cc.every(([w, h]) => w >= 44 && h >= 44), `${P} principal y cola de C ≥ 44: ${JSON.stringify(cc)}`)
      await openFab(pc.page)
      const crow = await pc.page.evaluate(() => Math.min(...[...document.querySelectorAll('#fab-menu .g-fab__item')].map((b) => b.getBoundingClientRect().height)))
      ok(crow >= min - 0.01, `${P} filas del panel de C ≥ ${min}: ${crow}`)
      await pc.ctx.close()
    }
  }

  /* ---------- 3 · Foco visible ---------- */
  if (run(3)) {
    for (const q of ['n=15', 'theme=audit&n=15', 'theme=audit&n=15&dark=1', 'n=15&zone=1']) {
      const { ctx, page } = await open(browser, q)
      const P = `${E}[foco·${q}]`
      await page.focus('#field'); await page.keyboard.press(TAB); await page.keyboard.press(TAB); await settle(page, 150)
      // Del campo, Tab a «Última fila» y al FAB (el FAB va después en el DOM)
      const f = await page.evaluate(() => { const a = document.activeElement, cs = getComputedStyle(a), pg = __c.bgOf(document.querySelector('main')); return { id: a.id, os: cs.outlineStyle, ow: parseFloat(cs.outlineWidth), cr: __c.cr(__c.over(__c.rgba(cs.outlineColor), pg), pg), fv: a.matches(':focus-visible') } })
      ok(f.id === 'fab-trigger' && f.os === 'solid' && f.ow >= 2 && f.fv && f.cr >= 3, `${P} FAB con foco visible por teclado (≥ 2px, ≥ 3:1): ${JSON.stringify(f)}`)
      await page.keyboard.press('Enter'); await page.waitForFunction(() => document.getElementById('fab').dataset.state === 'open'); await settle(page)
      const it = await page.evaluate(() => { const a = document.activeElement, cs = getComputedStyle(a), pg = __c.bgOf(document.querySelector('main')); const clip = getComputedStyle(a.parentElement).clipPath; return { cls: a.className, os: cs.outlineStyle, ow: parseFloat(cs.outlineWidth), oo: parseFloat(cs.outlineOffset), cr: __c.cr(__c.over(__c.rgba(cs.outlineColor), pg), pg), clip } })
      ok(/g-fab__item/.test(it.cls) && it.os === 'solid' && it.ow >= 2 && it.cr >= 3 && it.oo > 0, `${P} píldora enfocada con anillo exterior ≥ 3:1: ${JSON.stringify(it)}`)
      // El recorte de la fila deja ver el anillo entero (clip con margen ≥ offset + grosor)
      const m = (/inset\((-?[\d.]+)px/.exec(it.clip) || [])[1]
      ok(m !== undefined && -parseFloat(m) >= it.oo + it.ow, `${P} el recorte de la fila no corta el anillo: ${it.clip}`)
      await page.keyboard.press('ArrowUp'); await page.keyboard.press('ArrowUp'); await page.keyboard.press('ArrowUp'); await page.keyboard.press('ArrowUp'); await settle(page, 150)
      const tl = await page.evaluate(() => document.activeElement.id)
      ok(tl === 'fab-tail', `${P} ↑ lleva a la cola: ${tl}`)
      await page.keyboard.press('Enter'); await settle(page)
      const pf = await page.evaluate(() => { const a = document.activeElement, cs = getComputedStyle(a), ul = a.closest('.g-fab__list'), bg = __c.bgOf(ul); return { inMore: !!a.closest('#fab-more'), os: cs.outlineStyle, ow: parseFloat(cs.outlineWidth), cr: __c.cr(__c.rgba(cs.outlineColor), bg), hi: ul.classList.contains('has-highlight') && getComputedStyle(ul, '::before').opacity === '1' } })
      ok(pf.inMore && pf.os === 'solid' && pf.ow >= 2 && pf.cr >= 3 && pf.hi, `${P} fila del panel con anillo interior ≥ 3:1 y resaltado: ${JSON.stringify(pf)}`)
      await ctx.close()
    }
    // C: principal y cola por teclado; par de confirmación
    const c = await open(browser, 'theme=audit&n=15&main=1')
    await c.page.focus('#field'); await c.page.keyboard.press(TAB); await c.page.keyboard.press(TAB); await settle(c.page, 150)
    const cm = await c.page.evaluate(() => { const a = document.activeElement, cs = getComputedStyle(a); return a.classList.contains('g-fab__main') && cs.outlineStyle === 'solid' && a.matches(':focus-visible') })
    await c.page.keyboard.press(TAB); await settle(c.page, 150)
    const ct = await c.page.evaluate(() => { const a = document.activeElement, cs = getComputedStyle(a); return a.id === 'fab-trigger' && cs.outlineStyle === 'solid' && a.matches(':focus-visible') })
    ok(cm && ct, `${E}[foco·C] principal y cola: dos paradas con foco visible: ${cm} ${ct}`)
    await c.ctx.close()
    const p = await open(browser, 'theme=audit&n=3')
    await openFab(p.page, 'Enter'); await p.page.keyboard.press('ArrowUp'); await p.page.keyboard.press('ArrowUp'); await settle(p.page, 120)
    await p.page.keyboard.press('Enter'); await settle(p.page, 200)
    const pr = await p.page.evaluate(() => { const a = document.activeElement, cs = getComputedStyle(a); return { cls: a.className, os: cs.outlineStyle, fv: a.matches(':focus-visible') } })
    ok(pr.cls === 'g-fab__cancel' && pr.os === 'solid' && pr.fv, `${E}[foco·par] con teclado, «Cancelar» con foco visible: ${JSON.stringify(pr)}`)
    await p.ctx.close()
  }

  /* ---------- 4 · Comportamiento ---------- */
  if (run(4)) {
    // Abrir y cerrar por cada vía
    {
      const { ctx, page, errs } = await open(browser, 'theme=audit&n=6')
      await openFab(page)
      ok(await page.evaluate(() => document.activeElement.querySelector('.g-fab__label')?.textContent === 'Nueva muestra'), `${E}[abrir] clic: foco en la primera por frecuencia`)
      await page.keyboard.press('Escape'); await settle(page)
      ok(await page.evaluate(() => document.getElementById('fab').dataset.state === 'closed' && document.activeElement.id === 'fab-trigger'), `${E}[cerrar] Esc: cerrado y el foco en el FAB`)
      await page.keyboard.press('ArrowDown'); await page.waitForFunction(() => document.getElementById('fab').dataset.state === 'open'); await settle(page)
      ok(await page.evaluate(() => document.activeElement.id === 'fab-tail'), `${E}[abrir] la flecha contraria abre en la más lejana`)
      await page.keyboard.press('Tab'); await settle(page)
      ok(await page.evaluate(() => document.getElementById('fab').dataset.state !== 'open'), `${E}[cerrar] Tab cierra`)
      await openFab(page, 'Enter')
      await page.mouse.click(300, 200); await settle(page)
      ok(await page.evaluate(() => document.getElementById('fab').dataset.state === 'closed'), `${E}[cerrar] clic fuera cierra (puntero fino)`)
      await openFab(page)
      await page.click('.g-fab__list [data-key^="string:note:"]'); await settle(page)
      const sel = await page.evaluate(() => ({ ev: window.__b.events.filter((e) => e.type === 'select').map((e) => e.id).join(), st: document.getElementById('fab').dataset.state, f: document.activeElement.id }))
      ok(sel.ev === 'note' && sel.st === 'closed' && sel.f === 'fab-trigger', `${E}[elegir] select, cierra y el foco al FAB: ${JSON.stringify(sel)}`)
      // Doble clic en el FAB: abre y el segundo clic no cierra
      await page.dblclick('#fab-trigger'); await settle(page)
      ok(await page.evaluate(() => document.getElementById('fab').dataset.state === 'open'), `${E}[gesto] doble clic en el FAB: queda abierto (#661)`)
      ok(!errs.length, `${E}[abrir] consola limpia: ${errs}`)
      await ctx.close()
    }
    // Las cuatro primeras quietas de 6 a 10 y 15 (con el tema de la auditoría)
    {
      const g = {}
      for (const n of [6, 10, 15]) {
        const { ctx, page } = await open(browser, `theme=audit&n=${n}`)
        await openFab(page)
        g[n] = await page.evaluate(() => [...document.querySelectorAll('#fab-menu > li')].slice(-4).map((li) => { const r = li.firstElementChild.getBoundingClientRect(); return [r.left, r.top, r.width] }))
        await ctx.close()
      }
      const d = Math.max(...[10, 15].flatMap((n) => g[n].flatMap((x, i) => x.map((v, j) => Math.abs(v - g[6][i][j])))))
      ok(d <= 0.5, `${E}[A] las cuatro primeras no se mueven de 6 a 10 y 15: Δ ${d.toFixed(2)}px`)
    }
    // Panel encima de la pila o cubriéndola; el FAB fuera del panel
    for (const [h, cover] of [[900, false], [480, true]]) {
      const { ctx, page } = await open(browser, 'theme=audit&n=15', { width: 1000, height: h })
      await openFab(page); await openTail(page)
      const v = await page.evaluate(() => { const s = document.getElementById('fab-more').getBoundingClientRect(), st = document.getElementById('fab-menu').getBoundingClientRect(), f = document.getElementById('fab-trigger').getBoundingClientRect(); return { s: { l: s.left, t: s.top, r: s.right, b: s.bottom }, st: { l: st.left, t: st.top, r: st.right, b: st.bottom }, f: { l: f.left, t: f.top, r: f.right, b: f.bottom }, minh: document.getElementById('fab-more').style.getPropertyValue('--_minh'), vw: innerWidth, vh: innerHeight } })
      ok(!hit(v.s, v.f) && v.s.t >= 8 && v.s.b <= v.vh - 8 && v.s.l >= 8 && v.s.r <= v.vw - 8, `${E}[panel·${h}] dentro del visor con el FAB fuera`)
      if (cover) ok(v.s.t <= v.st.t + 0.5 && v.s.b >= v.st.b - 0.5 && !!v.minh, `${E}[panel·${h}] cubre la pila con --_minh: ${v.minh}`)
      else ok(v.s.b <= v.st.t + 0.5 && !v.minh, `${E}[panel·${h}] encima de la pila, sin --_minh`)
      await ctx.close()
    }
    // C: la principal ejecuta a un toque; la cola abre el panel que filtra
    {
      const { ctx, page, errs } = await open(browser, 'theme=audit&n=15&main=1')
      await page.click('.g-fab__main'); await settle(page)
      ok(await page.evaluate(() => window.__b.events.some((e) => e.type === 'select' && e.id === 'sample') && document.getElementById('fab').dataset.state === 'closed'), `${E}[C] la principal ejecuta a un toque sin abrir nada`)
      await openFab(page)
      await page.keyboard.type('exp'); await settle(page, 200)
      const f = await page.evaluate(() => ({ vis: [...document.querySelectorAll('#fab-menu [role="menuitem"]')].filter((b) => !b.closest('[hidden]')).map((b) => b.querySelector('.g-fab__label').textContent), focus: document.activeElement.querySelector('.g-fab__label')?.textContent, q: document.querySelector('.g-fab__find-query')?.textContent, count: document.querySelector('.g-fab__find-count')?.textContent }))
      ok(f.vis.join() === 'Exportar CSV' && f.focus === 'Exportar CSV' && f.q === 'exp' && f.count === '1 acción', `${E}[C] escribir filtra sin campo: ${JSON.stringify(f)}`)
      await page.keyboard.press('Escape'); await settle(page, 150)
      ok(await page.evaluate(() => !document.querySelector('.g-fab__find-query') && document.getElementById('fab').dataset.state === 'open'), `${E}[C] Esc limpia lo escrito y no cierra`)
      await page.keyboard.press('Escape'); await settle(page)
      ok(await page.evaluate(() => document.getElementById('fab').dataset.state === 'closed' && document.activeElement.id === 'fab-trigger'), `${E}[C] la segunda Esc cierra y devuelve el foco a la cola`)
      ok(!errs.length, `${E}[C] consola limpia: ${errs}`)
      await ctx.close()
    }
    // Confirmación en el sitio: «Cancelar» bajo el puntero; doble clic no ejecuta; con teclado, una vez
    {
      const { ctx, page } = await open(browser, 'theme=audit&n=3')
      await openFab(page)
      const pb = await R(page, '.g-fab__list [data-key^="string:purge:"]')
      const before = await page.evaluate(() => [...document.querySelectorAll('#fab-menu > li')].map((li) => { const r = li.getBoundingClientRect(); return [r.left, r.top, r.width] }))
      await page.mouse.dblclick(pb.l + pb.w * 0.25, pb.t + pb.h / 2); await settle(page, 250)
      const st = await page.evaluate((pt) => ({ armed: !!document.querySelector('.g-fab__confirm'), focus: document.activeElement.className, under: document.elementFromPoint(pt[0], pt[1])?.className, ev: window.__b.events.filter((e) => e.type === 'select').length, li: [...document.querySelectorAll('#fab-menu > li')].map((li) => { const r = li.getBoundingClientRect(); return [r.left, r.top, r.width] }) }), [pb.l + pb.w * 0.25, pb.t + pb.h / 2])
      const d = Math.max(...before.flatMap((x, i) => x.map((v, j) => Math.abs(v - st.li[i][j]))))
      ok(st.armed && st.focus === 'g-fab__cancel' && st.under === 'g-fab__cancel' && st.ev === 0, `${E}[peligrosa] doble clic: se arma con «Cancelar» con el foco y bajo el puntero, sin ejecutar: ${JSON.stringify({ ...st, li: undefined })}`)
      ok(d <= 0.5, `${E}[peligrosa] armar no mueve ninguna fila: Δ ${d.toFixed(2)}px`)
      await page.keyboard.press('Escape'); await settle(page, 200)
      ok(await page.evaluate(() => !document.querySelector('.g-fab__confirm') && document.activeElement.dataset.key?.startsWith('string:purge:')), `${E}[peligrosa] Esc deshace y el foco vuelve a la fila`)
      await page.keyboard.press('Enter'); await settle(page, 150); await page.keyboard.press(engine === 'webkit' ? 'ArrowRight' : 'ArrowRight'); await page.keyboard.press('Enter'); await settle(page, 300)
      ok(await page.evaluate(() => window.__b.events.filter((e) => e.type === 'select' && e.id === 'purge').length === 1), `${E}[peligrosa] con teclado: Intro, → e Intro ejecutan una vez`)
      await ctx.close()
    }
    // Acuse: en curso → hecho (csv); fallo → reintento (photo)
    {
      const { ctx, page, errs } = await open(browser, 'theme=audit&n=6')
      await openFab(page); await page.click('.g-fab__list [data-key^="string:photo:"]'); await settle(page, 120)
      const busy = await page.evaluate(() => ({ root: document.getElementById('fab').dataset.ack, op: getComputedStyle(document.querySelector('.g-fab__badge')).opacity, anim: getComputedStyle(document.querySelector('.g-fab__badge > svg')).animationName }))
      ok(busy.root === 'busy' && parseFloat(busy.op) > 0.99 && busy.anim === 'g-fab-spin', `${E}[acuse] en curso: insignia visible que gira: ${JSON.stringify(busy)}`)
      await page.waitForFunction(() => document.getElementById('fab').dataset.ack === 'failed', null, { timeout: 3000 }); await settle(page, 200)
      await openFab(page)
      const fl = await page.evaluate(() => { const b = document.querySelector('#fab-menu [data-key^="string:photo:"]'), r = b.querySelector('.g-fab__reason'), i = document.createElement('i'); i.style.color = 'var(--g-color-danger-text)'; b.appendChild(i); const dt = getComputedStyle(i).color; i.remove(); return { ack: b.dataset.ack, dis: b.getAttribute('aria-disabled'), reason: r?.textContent, rc: r && getComputedStyle(r).color === dt, deco: getComputedStyle(b.querySelector('.g-fab__label')).textDecorationLine } })
      ok(fl.ack === 'failed' && fl.dis === null && fl.reason === 'Sin conexión' && fl.rc && fl.deco === 'none', `${E}[acuse] fallo: elemento habilitado con el motivo en danger-text: ${JSON.stringify(fl)}`)
      await page.evaluate(() => { window.__b.plan.photo = 'none' })
      await page.click('.g-fab__list [data-key^="string:photo:"]'); await settle(page, 100)
      ok(await page.evaluate(() => window.__b.events.filter((e) => e.type === 'select' && e.id === 'photo').at(-1).retry === true), `${E}[acuse] reintentar lleva retry`)
      await page.waitForTimeout(700)
      await page.evaluate(() => { window.__b.plan.note = 'ok:300' })
      await openFab(page); await page.click('.g-fab__list [data-key^="string:note:"]')
      await page.waitForFunction(() => document.getElementById('fab').dataset.ack === 'done', null, { timeout: 3000 })
      const dn = await page.evaluate(() => { const t = document.getElementById('fab-trigger'); const desc = (t.getAttribute('aria-describedby') || '').split(' ').map((id) => document.getElementById(id)?.textContent).join(' '); return { svg: !!document.querySelector('.g-fab__badge svg'), desc } })
      ok(dn.svg && /Hecho: note/.test(dn.desc), `${E}[acuse] hecho: insignia y el texto como descripción del FAB: ${JSON.stringify(dn)}`)
      ok(!errs.length, `${E}[acuse] consola limpia: ${errs}`)
      await ctx.close()
    }
    // Se aparta: foco en una fila que cruza el FAB → 24px visibles, ≤ 5 % y nunca el centro; el primer clic solo lo devuelve
    {
      const { ctx, page } = await open(browser, 'theme=audit&n=6', { width: 900, height: 700 })
      // Una fila de la página bajo el FAB: se desplaza hasta que su centro queda a la altura del centro del FAB
      const target = await page.evaluate(() => { const f = document.getElementById('fab-trigger').getBoundingClientRect(), a = document.getElementById('row12'), r = a.getBoundingClientRect(); window.scrollBy(0, r.top + r.height / 2 - (f.top + f.height / 2)); const q = a.getBoundingClientRect(); return q.top < f.bottom && q.bottom > f.top && q.right > f.left ? 'row12' : null })
      await page.focus('#' + target); await settle(page, 400)
      const t = await page.evaluate((id) => { const f = document.getElementById('fab-trigger').getBoundingClientRect(), a = document.getElementById(id).getBoundingClientRect(); const ix = Math.max(0, Math.min(f.right, a.right) - Math.max(f.left, a.left)) * Math.max(0, Math.min(f.bottom, a.bottom) - Math.max(f.top, a.top)); const cx = a.left + a.width / 2, cy = a.top + a.height / 2; return { tucked: document.getElementById('fab').classList.contains('is-tucked'), vis: document.documentElement.clientWidth - f.left, cover: ix / (a.width * a.height), center: cx >= f.left && cx <= f.right && cy >= f.top && cy <= f.bottom } }, target)
      ok(target && t.tucked && Math.abs(t.vis - 24) < 0.6 && t.cover <= 0.05 && !t.center, `${E}[se aparta] ${target}: 24px visibles, cubre ${(t.cover * 100).toFixed(1)} % y no el centro: ${JSON.stringify(t)}`)
      const fb = await R(page, '#fab-trigger')
      await page.mouse.click(fb.l + 12, fb.t + fb.h / 2); await settle(page, 400)
      ok(await page.evaluate(() => !document.getElementById('fab').classList.contains('is-tucked') && document.getElementById('fab').dataset.state === 'closed'), `${E}[se aparta] el primer clic solo lo devuelve (no abre)`)
      await ctx.close()
    }
    // Seis posiciones × LTR y RTL con el tema de la auditoría (space 4,5): margen, pila dentro, la primera pegada al FAB
    for (const rtl of [false, true]) for (const pos of POS) {
      const { ctx, page, errs } = await open(browser, `theme=audit&n=6&pos=${pos}${rtl ? '&rtl=1' : ''}`)
      const P = `${E}[${pos}${rtl ? '·rtl' : ''}]`
      await openFab(page)
      const g = await page.evaluate(() => { const f = document.getElementById('fab-trigger').getBoundingClientRect(), s = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--g-space-1')); const lis = [...document.querySelectorAll('#fab-menu > li')].map((li) => { const r = li.firstElementChild.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, lab: li.querySelector('.g-fab__label')?.textContent } }); return { f: { l: f.left, t: f.top, r: f.right, b: f.bottom, w: f.width }, s, lis, vw: document.documentElement.clientWidth, vh: innerHeight, sw: document.documentElement.scrollWidth } })
      const top = pos.startsWith('top'), center = pos.endsWith('center'), right = pos.endsWith('-end') !== rtl
      const m = g.s * 4
      ok(top ? Math.abs(g.f.t - m) < 0.6 : Math.abs(g.vh - g.f.b - m) < 0.6, `${P} FAB a space × 4 de su borde de bloque: ${(top ? g.f.t : g.vh - g.f.b).toFixed(2)} vs ${m}`)
      if (!center) ok(right ? Math.abs(g.vw - g.f.r - m) < 0.6 : Math.abs(g.f.l - m) < 0.6, `${P} FAB a space × 4 de su borde en línea (lógico)`)
      else ok(Math.abs((g.f.l + g.f.r) / 2 - g.vw / 2) < 0.6, `${P} FAB centrado`)
      ok(Math.abs(g.f.w - Math.max(24, Math.round(g.s * 13 * 2) / 2)) < 0.01, `${P} FAB del alto de GBtn xl en la rejilla de medio píxel: ${g.f.w}`)
      const nearest = top ? g.lis[0] : g.lis.at(-1)
      ok(nearest.lab === 'Nueva muestra', `${P} la primera pegada al FAB: ${nearest.lab}`)
      ok(g.lis.every((a) => a.l >= 8 && a.r <= g.vw - 8 && a.t >= 8 && a.b <= g.vh - 8) && g.lis.every((a, i) => g.lis.every((b, j) => i === j || !hit(a, b, 0.5))) && g.lis.every((a) => !hit(a, g.f, 0.5)), `${P} pila dentro del visor con margen ≥ 8px, sin solapes`)
      ok(g.sw <= g.vw, `${P} sin desplazamiento horizontal`)
      ok(!errs.length, `${P} consola limpia: ${errs}`)
      await ctx.close()
    }
    // Velo táctil (Chromium y WebKit con toque): tocar una fila bajo el velo no la sigue; cierra y el foco al FAB
    if (engine !== 'firefox') {
      for (const q of ['theme=audit&n=6&coarse=1', 'theme=audit&n=6&coarse=1&pos=top-start&rtl=1', 'theme=audit&n=15&main=1&coarse=1']) {
        const { ctx, page } = await open(browser, q, { width: 390, height: 760 }, { ...touch, deviceScaleFactor: 1 })
        await page.tap('#fab-trigger'); await page.waitForFunction(() => document.getElementById('fab').dataset.state === 'open'); await settle(page)
        const v = await page.evaluate(() => { const sc = document.querySelector('.g-fab__scrim'), n = (k) => parseFloat(sc.style.getPropertyValue(k)); const lists = [...document.querySelectorAll('.g-fab__list:popover-open')].map((u) => u.getBoundingClientRect()); const hx = n('--_hole-x'), hy = n('--_hole-y'), hw = n('--_hole-w'), hh = n('--_hole-h'); const pts = [[20, 120], [370, 400], [195, 740], [10, 700], [10, 750]].filter(([x, y]) => !lists.some((r) => x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) && !(x >= hx && x < hx + hw && y >= hy && y < hy + hh)); return { op: sc.matches(':popover-open') && getComputedStyle(sc).opacity, ints: ['--_hole-x', '--_hole-y', '--_hole-w', '--_hole-h'].every((k) => Number.isInteger(n(k))), pts, veil: pts.every(([x, y]) => !!document.elementFromPoint(x, y)?.closest('.g-fab__scrim')) } })
        ok(v.op === '0.5' && v.ints && v.veil, `${E}[velo·${q}] velo a 0,5 con ventana en px enteros que cubre lo de fuera: ${JSON.stringify(v)}`)
        ok(v.pts.length > 0, `${E}[velo·${q}] hay un punto de la página fuera de las listas`)
        const [x, y] = v.pts[0] || [10, 700]
        await page.touchscreen.tap(x, y); await settle(page, 400)
        const after = await page.evaluate(() => ({ hash: location.hash, st: document.getElementById('fab').dataset.state, f: document.activeElement.id }))
        ok(after.hash === '' && after.st === 'closed' && after.f === 'fab-trigger', `${E}[velo·${q}] el toque fuera cierra sin seguir el enlace y devuelve el foco: ${JSON.stringify(after)}`)
        await ctx.close()
      }
    }
    // Bordes compartidos: el aviso queda más allá del FAB (abajo) y la isla antes (arriba); un modal cierra la lista
    {
      const { ctx, page, errs } = await open(browser, 'theme=audit&n=6&toast=1')
      await settle(page, 500)
      const b = await page.evaluate(() => { const f = document.getElementById('fab-trigger').getBoundingClientRect(), t = document.querySelector('.g-toast')?.getBoundingClientRect(); return { f: { t: f.top, b: f.bottom, l: f.left, r: f.right }, t: t && { t: t.top, b: t.bottom, l: t.left, r: t.right } } })
      ok(b.t && b.t.b <= b.f.t + 0.5, `${E}[borde] GToaster abajo queda encima del FAB, sin solaparse: aviso ${b.t && b.t.b.toFixed(1)} · FAB ${b.f.t.toFixed(1)}`)
      await openFab(page)
      await page.evaluate(() => { window.__b.st.dialog = true }); await page.waitForFunction(() => document.querySelector('dialog[open]')); await settle(page, 400)
      const md = await page.evaluate(() => { const f = document.getElementById('fab-trigger').getBoundingClientRect(); const at = document.elementFromPoint(f.left + f.width / 2, f.top + f.height / 2); return { st: document.getElementById('fab').dataset.state, inDlg: !!document.activeElement.closest('dialog'), fabHit: !!at?.closest('.g-fab') } })
      ok(md.st !== 'open' && md.inDlg && !md.fabHit, `${E}[modal] un GDialog cierra la lista sin tocar el foco y el FAB queda bajo el fondo: ${JSON.stringify(md)}`)
      await page.keyboard.press('Escape'); await settle(page, 500)
      await openFab(page)
      ok(await page.evaluate(() => document.getElementById('fab').dataset.state === 'open'), `${E}[modal] cerrado el modal, el FAB vuelve a abrir`)
      ok(!errs.length, `${E}[borde] consola limpia: ${errs}`)
      await ctx.close()
      const s = await open(browser, 'theme=audit&n=6&pos=top-end&status=1&toast=1')
      await settle(s.page, 600)
      const st = await s.page.evaluate(() => { const f = document.getElementById('fab-trigger').getBoundingClientRect(), i = document.querySelector('.g-status-island')?.getBoundingClientRect(); return { f: f.top, fb: f.bottom, i: i && i.bottom, ih: i && i.height } })
      ok(st.i && st.ih > 0 && st.f >= st.i - 0.5, `${E}[borde] arriba, la isla va antes del FAB (más cerca del borde): isla ${st.i && st.i.toFixed(1)} · FAB ${st.f.toFixed(1)}`)
      await s.ctx.close()
    }
    // GPageHeader: abajo, en estrecho, el muelle va más cerca del borde que el FAB; arriba, el zócalo pegado va antes del FAB
    {
      const { ctx, page, errs } = await open(browser, 'theme=audit&n=6&ph=1', { width: 390, height: 760 })
      await page.evaluate(() => window.scrollTo(0, 900)); await settle(page, 700)
      const v = await page.evaluate(() => { const d = document.querySelector('#ph .g-page-header__dock'); const r = (e) => { const b = e.getBoundingClientRect(); return { t: b.top, b: b.bottom, l: b.left, r: b.right } }; return { docked: document.getElementById('ph').classList.contains('is-docked'), dock: d && !d.hidden ? r(d) : null, fab: r(document.getElementById('fab-trigger')) } })
      ok(v.docked && v.dock && v.fab.b <= v.dock.t + 0.5, `${E}[borde] estrecho: el muelle de GPageHeader más cerca del borde y el FAB encima, sin solaparse: muelle ${v.dock && v.dock.t.toFixed(1)} · FAB ${v.fab.b.toFixed(1)}`)
      await openFab(page)
      const ls = await page.evaluate(() => { const u = document.getElementById('fab-menu').getBoundingClientRect(), d = document.querySelector('#ph .g-page-header__dock').getBoundingClientRect(); return u.bottom <= d.top + 0.5 && u.top >= 0 })
      ok(ls, `${E}[borde] estrecho: la pila abierta no baja al muelle`)
      ok(!errs.length, `${E}[borde·muelle] consola limpia: ${errs}`)
      await ctx.close()
      const t = await open(browser, 'theme=audit&n=6&ph=1&pos=top-end', { width: 1000, height: 700 })
      await t.page.evaluate(() => window.scrollTo(0, 700)); await settle(t.page, 700)
      const w = await t.page.evaluate(() => { const h = document.getElementById('ph'), f = document.getElementById('fab-trigger').getBoundingClientRect(), b = h.getBoundingClientRect(); return { stuck: h.classList.contains('is-stuck'), hb: b.bottom, ft: f.top } })
      ok(w.stuck && w.ft >= w.hb - 0.5, `${E}[borde] arriba: el zócalo pegado va antes del FAB: zócalo ${w.hb.toFixed(1)} · FAB ${w.ft.toFixed(1)}`)
      await t.ctx.close()
    }
    // Voz (playground real, adaptador simulado): en estrecho la pill flota abajo; desde el borde, pill → FAB → aviso
    {
      const pg = await open(browser, 'fabanchor=viewport&speech=self&fab=6', { width: 360, height: 720 }, {}, `${ORIGIN}/packages/vue/playground/index.html`)
      await pg.page.waitForSelector('#fab', { timeout: 60000 }); await settle(pg.page, 400)
      await pg.page.evaluate(() => window.speech.start({ mode: 'conversation' }))
      const live = await pg.page.waitForFunction(() => /listening|speech|transcribing/.test(window.speech.state.status), null, { timeout: 20000 }).then(() => true, () => false)
      await pg.page.evaluate(() => { document.querySelector('.pg-bar').style.position = 'static'; window.scrollTo(0, document.body.scrollHeight) }); await settle(pg.page, 500)
      await pg.page.evaluate(() => window.toaster.show({ title: 'Guardado', duration: Infinity })); await settle(pg.page, 700)
      const v = await pg.page.evaluate(() => { const r = (s) => { const e = document.querySelector(s); if (!e || !e.getClientRects().length) return null; const b = e.getBoundingClientRect(); return { t: b.top, b: b.bottom, l: b.left, r: b.right } }; return { pill: r('.g-speech-host__float'), fab: r('#fab-trigger'), toast: r('.g-toast'), vh: innerHeight } })
      ok(live && v.pill && v.fab && v.toast, `${E}[voz] pill flotante, FAB y aviso en el borde de abajo: ${live} ${JSON.stringify(v)}`)
      if (v.pill && v.fab && v.toast) ok(v.pill.t >= v.fab.b - 0.5 && v.toast.b <= v.fab.t + 0.5 && !hit(v.pill, v.fab) && !hit(v.toast, v.fab), `${E}[voz] desde el borde: pill (${v.pill.t.toFixed(0)}–${v.pill.b.toFixed(0)}) → FAB (${v.fab.t.toFixed(0)}–${v.fab.b.toFixed(0)}) → aviso (…${v.toast.b.toFixed(0)}), sin solapes`)
      ok(!pg.errs.length, `${E}[voz] consola limpia: ${pg.errs}`)
      await pg.ctx.close()
    }
  }

  /* ---------- 5 · Movimiento y reducido ---------- */
  if (run(5)) {
    {
      const { ctx, page } = await open(browser, 'theme=audit&n=6')
      await openFab(page)
      const mv = await page.evaluate(() => { const ms = (v) => v.split(',').map((x) => parseFloat(x) * (x.trim().endsWith('ms') ? 1 : 1000)); const lis = [...document.querySelectorAll('#fab-menu > li')]; const root = getComputedStyle(document.documentElement); const tk = (n) => ms(root.getPropertyValue(n))[0]; let max = 0; for (const el of document.querySelectorAll('.g-fab, .g-fab *')) { const cs = getComputedStyle(el); const d = ms(cs.transitionDuration), dl = ms(cs.transitionDelay); d.forEach((x, i) => { max = Math.max(max, x + (dl[i % dl.length] || 0)) }) } return { li: lis.map((li) => { const cs = getComputedStyle(li); return { tp: cs.transitionProperty, td: ms(cs.transitionDuration), dl: ms(cs.transitionDelay)[0], i: Number(li.style.getPropertyValue('--_i')), tf: cs.transitionTimingFunction } }), fast: tk('--g-duration-fast'), press: tk('--g-duration-press'), ease: root.getPropertyValue('--g-ease-out').trim(), max } })
      ok(mv.li.every((m) => /translate/.test(m.tp) && /clip-path/.test(m.tp) && /opacity/.test(m.tp) && m.td[0] === mv.press && m.td[1] === mv.press && m.td[2] === mv.fast), `${E}[mov] píldoras: translate y recorte en press, opacidad en fast (tokens del tema): ${JSON.stringify(mv.li[0])}`)
      ok(mv.li.every((m) => Math.abs(m.dl - mv.fast * m.i / 8) < 0.6), `${E}[mov] escalonado fast × i / 8: ${mv.li.map((m) => m.i + ':' + m.dl).join(' ')}`)
      ok(mv.li.every((m) => !/linear\(/.test(m.tf)), `${E}[mov] sin muelle ni rebote: ${mv.li[0].tf}`)
      ok(mv.max <= 240.5, `${E}[mov] nada supera 240ms (tema de la auditoría): ${mv.max}`)
      // La semilla nace en el centro del FAB: en opening (sin transición) el centro de la semilla coincide con el del FAB
      const seed = await page.evaluate(() => { const ul = document.getElementById('fab-menu'); const f = document.getElementById('fab-trigger').getBoundingClientRect(); const cx = f.left + f.width / 2, cy = f.top + f.height / 2; ul.dataset.state = 'opening'; const out = [...ul.children].map((li) => { const i = li.querySelector('.g-fab__icon').getBoundingClientRect(); return { dx: i.left + i.width / 2 - cx, dy: i.top + i.height / 2 - cy, op: getComputedStyle(li).opacity } }); ul.dataset.state = 'open'; return out })
      ok(seed.every((s) => Math.abs(s.dx) < 1 && Math.abs(s.dy) < 1 && s.op === '0'), `${E}[mov] cada semilla parte del centro del FAB, invisible: ${seed.map((s) => s.dx.toFixed(1) + ',' + s.dy.toFixed(1)).join(' ')}`)
      const gl = await page.evaluate(() => { const r = getComputedStyle(document.querySelector('.g-fab__glyph--rest')), o = getComputedStyle(document.querySelector('.g-fab__glyph--open')); return r.rotate + '|' + r.opacity + '|' + o.rotate + '|' + o.opacity })
      ok(/^45deg\|0\|(0deg|none)\|1$/.test(gl), `${E}[mov] el + gira 45° y se va; la x llega: ${gl}`)
      await ctx.close()
    }
    {
      const { ctx, page } = await open(browser, 'theme=audit&n=6', { width: 1000, height: 700 }, { reducedMotion: 'reduce' })
      await openFab(page)
      const rd = await page.evaluate(() => { const ul = document.getElementById('fab-menu'), li = ul.firstElementChild, cs = getComputedStyle(li); const r = { tp: cs.transitionProperty, dl: cs.transitionDelay, clip: cs.clipPath }; ul.dataset.state = 'opening'; const o = getComputedStyle(li); r.oTr = o.translate; r.oClip = o.clipPath; ul.dataset.state = 'open'; r.root = getComputedStyle(document.getElementById('fab')).transitionProperty; r.glyph = getComputedStyle(document.querySelector('.g-fab__glyph--rest')).rotate; return r })
      ok(rd.tp === 'opacity' && parseFloat(rd.dl) === 0 && rd.clip === 'none' && rd.oTr === 'none' && rd.oClip === 'none' && rd.glyph === 'none' && !/translate/.test(rd.root), `${E}[reducido] solo fundido: sin escalonado, recorte, desplazamiento ni giro: ${JSON.stringify(rd)}`)
      await page.click('#fab-trigger'); await settle(page)
      await page.evaluate(() => { window.__b.plan.note = 'busy' })
      await openFab(page); await page.click('.g-fab__list [data-key^="string:note:"]'); await settle(page)
      const bd = await page.evaluate(() => ({ scale: getComputedStyle(document.querySelector('.g-fab__badge')).scale, anim: getComputedStyle(document.querySelector('.g-fab__badge > svg')).animationName }))
      ok(bd.scale === 'none' && bd.anim === 'none', `${E}[reducido] insignia en curso quieta y sin escala: ${JSON.stringify(bd)}`)
      await ctx.close()
      const c = await open(browser, 'theme=audit&n=15&main=1', { width: 1000, height: 700 }, { reducedMotion: 'reduce' })
      await openFab(c.page)
      const rc = await c.page.evaluate(() => { const ul = document.getElementById('fab-menu'); const tp = getComputedStyle(ul).transitionProperty; ul.style.transition = 'none'; ul.dataset.state = 'opening'; const o = getComputedStyle(ul); const r = { tp, clip: o.clipPath, op: o.opacity }; ul.dataset.state = 'open'; ul.style.transition = ''; return r })
      ok(rc.tp === 'opacity' && rc.clip === 'none' && rc.op === '0', `${E}[reducido·C] el panel de C solo se funde, sin recorte: ${JSON.stringify(rc)}`)
      await c.ctx.close()
    }
  }

  /* ---------- 6 · Reflujo a 320px y texto al 200 % ---------- */
  if (run(6)) {
    for (const [q, step] of [['theme=audit&n=6', 'open'], ['theme=audit&n=15', 'more'], ['theme=audit&n=15&main=1', 'open'], ['theme=audit&n=3', 'arm'], ['n=15&long=1', 'more']]) {
      const { ctx, page, errs } = await open(browser, q, { width: 320, height: 640 })
      await openFab(page)
      if (step === 'more') await openTail(page)
      if (step === 'arm') { await page.click('.g-fab__list [data-key^="string:purge:"]'); await settle(page, 250) }
      const d = await page.evaluate(() => { const els = [...document.querySelectorAll('.g-fab__list:popover-open, .g-fab__list:popover-open > li, .g-fab__list:popover-open .g-fab__item, .g-fab__confirm')].filter((e) => e.getClientRects().length).map((e) => e.getBoundingClientRect()); return { sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, minL: Math.min(...els.map((r) => r.left)), maxR: Math.max(...els.map((r) => r.right)), clip: [...document.querySelectorAll('.g-fab__label, .g-fab__cancel, .g-fab__confirm-action, .g-fab__desc:not(.g-fab__sr)')].filter((e) => e.getClientRects().length && (e.scrollWidth > e.clientWidth + 1)).length } })
      ok(d.sw <= d.cw && d.minL >= 0 && d.maxR <= d.cw, `${E}[320px·${q}·${step}] sin desplazamiento horizontal y todo dentro: ${d.minL.toFixed(1)}–${d.maxR.toFixed(1)} de ${d.cw}`)
      ok(d.clip === 0, `${E}[320px·${q}·${step}] ninguna etiqueta recortada: ${d.clip}`)
      ok(!errs.length, `${E}[320px·${q}] consola limpia: ${errs}`)
      await ctx.close()
    }
    for (const q of ['text=2&n=6', 'text=2&theme=audit&n=15', 'text=2&theme=audit&n=15&main=1']) {
      const { ctx, page } = await open(browser, q, { width: 1280, height: 900 })
      await openFab(page)
      if (/n=15&?/.test(q) && !/main/.test(q)) { const has = await page.$('#fab-tail'); if (has) await openTail(page) }
      const d = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, clip: [...document.querySelectorAll('.g-fab__label, .g-fab__desc:not(.g-fab__sr), .g-fab__group-title')].filter((e) => e.getClientRects().length && (e.scrollWidth > e.clientWidth + 1 || e.scrollHeight > e.clientHeight + 1)).length, inside: [...document.querySelectorAll('.g-fab__list:popover-open')].every((u) => { const r = u.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight }), fs: parseFloat(getComputedStyle(document.querySelector('.g-fab__label')).fontSize) }))
      ok(d.sw <= d.cw && d.clip === 0 && d.inside && d.fs >= 24, `${E}[texto 200 %·${q}] sin recortes, dentro del visor y sin desplazamiento horizontal: ${JSON.stringify(d)}`)
      await ctx.close()
    }
  }

  /* ---------- 7 · forced-colors ---------- */
  if (run(7)) {
    const probe = await open(browser, 'n=1', { width: 600, height: 400 }, { forcedColors: 'active' })
    const fc = await probe.page.evaluate(() => matchMedia('(forced-colors: active)').matches)
    await probe.ctx.close()
    if (!fc) note(`${E}[forzados] el motor no emula forced-colors: sin medir`)
    else {
      const { ctx, page } = await open(browser, 'theme=audit&n=15', { width: 1000, height: 700 }, { forcedColors: 'active' })
      await openFab(page); await openTail(page)
      const f = await page.evaluate(() => { const sys = (c) => { const e = document.createElement('i'); e.style.color = c; document.body.appendChild(e); const v = getComputedStyle(e).color; e.remove(); return v }; const g = (s, p) => getComputedStyle(document.querySelector(s), p); return { ct: sys('CanvasText'), gt: sys('GrayText'), pill: g('#fab-menu .g-fab__item:not(.g-fab__item--more)').borderTopColor, panel: g('#fab-more').borderTopColor, hi: g('#fab-more', '::before').display, seed: g('#fab-menu .g-fab__icon').borderTopStyle, fabSh: g('#fab-trigger').boxShadow, dis: g('#fab-more [aria-disabled="true"]').color, disIcon: g('#fab-more [aria-disabled="true"] .g-fab__icon').color } })
      ok(f.pill === f.ct && f.panel === f.ct && f.hi === 'none' && f.seed === 'solid' && f.fabSh === 'none' && f.dis === f.gt && f.disIcon === f.gt, `${E}[forzados] bordes CanvasText, sin resaltado, semillas con contorno, FAB sin sombra, deshabilitada GrayText: ${JSON.stringify(f)}`)
      await ctx.close()
      for (const q of ['theme=audit&n=1&off=1', 'theme=audit&n=6&main=1&off=1']) {
        const r = await open(browser, q, { width: 1000, height: 700 }, { forcedColors: 'active' })
        const v = await r.page.evaluate(() => { const sys = (c) => { const e = document.createElement('i'); e.style.color = c; document.body.appendChild(e); const v = getComputedStyle(e).color; e.remove(); return v }; const b = document.querySelector('.g-fab__main') || document.querySelector('.g-fab > button'), cs = getComputedStyle(b); const rtl = cs.direction === 'rtl'; return { gt: sys('GrayText'), bf: sys('ButtonFace'), c: cs.color, top: cs.borderTopColor, end: rtl ? cs.borderLeftColor : cs.borderRightColor, main: b.classList.contains('g-fab__main') } })
        const mb = await R(r.page, '.g-fab__main, .g-fab > button')
        await r.page.mouse.move(mb.l + mb.w / 2, mb.t + mb.h / 2); await settle(r.page, 200)
        const hov = await r.page.evaluate(() => getComputedStyle(document.querySelector('.g-fab__main') || document.querySelector('.g-fab > button')).borderTopColor)
        ok(v.c === v.gt && v.top === v.gt && hov === v.gt && (v.main ? v.end === v.bf : v.end === v.gt), `${E}[forzados·${q}] deshabilitada en GrayText, también al pasar; junta de C en ButtonFace: ${JSON.stringify({ ...v, hov })}`)
        await r.ctx.close()
      }
    }
  }

  /* ---------- 8 · Remates #690 y #691 ---------- */
  if (run(8)) {
    // #690: single y principal de C deshabilitadas (no en curso), claro, oscuro, zona y el tema de la auditoría
    for (const q of ['n=1&off=1', 'theme=audit&n=1&off=1', 'theme=audit&n=1&off=1&dark=1', 'n=1&off=1&zone=1', 'theme=audit&n=6&main=1&off=1', 'theme=audit&n=6&main=1&off=1&dark=1', 'n=6&main=1&off=1&zone=1', 'theme=lustre&n=1&off=1', 'theme=spotify&n=6&main=1&off=1']) {
      const { ctx, page, errs } = await open(browser, q, { width: 1000, height: 700 }, { deviceScaleFactor: 1 })
      const P = `${E}[#690·${q}]`
      await page.addStyleTag({ content: '.g-tooltip{visibility:hidden!important}' })
      const read = () => page.evaluate(() => { const b = document.querySelector('.g-fab__main') || document.querySelector('.g-fab > button'), cs = getComputedStyle(b); const tk = (n) => __c.tok(b.parentElement, n).join(); const col = (s) => __c.rgba(s).join(); return { dis: b.getAttribute('aria-disabled'), bg: col(cs.backgroundColor) === tk('--g-color-neutral-soft'), fg: col(cs.color) === tk('--g-color-text-subtle'), bd: [cs.borderTopColor, cs.borderBottomColor].every((x) => col(x) === tk('--g-color-border-control')), sh: cs.boxShadow, tf: cs.transform, cur: cs.cursor, raw: [cs.backgroundColor, cs.color, cs.borderTopColor].join(' / '), main: b.classList.contains('g-fab__main'), grpSh: getComputedStyle(b.parentElement).boxShadow } })
      const rest = await read()
      const sh1 = await page.evaluate(() => { const i = document.createElement('i'); i.style.boxShadow = 'var(--g-shadow-1)'; document.getElementById('fab').appendChild(i); const v = getComputedStyle(i).boxShadow; i.remove(); return v })
      const bb = await R(page, '.g-fab__main, .g-fab > button')
      await page.mouse.move(bb.l + bb.w / 2, bb.t + bb.h / 2); await settle(page, 250)
      const hov = await read()
      await page.mouse.down(); await settle(page, 250)
      const act = await read()
      await page.mouse.up(); await page.mouse.move(5, 5); await settle(page, 200)
      ok(rest.dis === 'true' && rest.bg && rest.fg && rest.bd && rest.cur === 'not-allowed', `${P} relleno neutral-soft, texto text-subtle, contorno border-control, cursor de no disponible: ${rest.raw}`)
      ok(rest.main ? rest.grpSh !== 'none' : rest.sh === sh1, `${P} ${rest.main ? 'el grupo de C conserva su elevación (la cola sigue habilitada)' : 'shadow-1'}: ${rest.main ? rest.grpSh : rest.sh}`)
      ok(hov.raw === rest.raw && act.raw === rest.raw && hov.bg && act.bd, `${P} al pasar y al apretar no cambia nada: ${hov.raw} · ${act.raw}`)
      ok(act.tf === 'none', `${P} sin escala al apretar: ${act.tf}`)
      ok(await page.evaluate(() => window.__b.events.every((e) => e.type !== 'select')), `${P} pulsarla no ejecuta`)
      // Junta de C con la principal deshabilitada y la cola habilitada: ¿hueco? píxeles de la página en la costura
      if (rest.main) {
        const j = await page.evaluate(() => { const [m, t] = document.querySelectorAll('.g-fab__main-group > button'); const a = m.getBoundingClientRect(), rtl = getComputedStyle(m).direction === 'rtl'; return { x: Math.round(rtl ? a.left : a.right), t: Math.floor(a.top), h: Math.ceil(a.height), page: __c.bgOf(document.querySelector('main')), bw: parseFloat(getComputedStyle(m).borderTopWidth) } })
        const png = (await page.screenshot({ clip: { x: j.x - 3, y: j.t - 1, width: 6, height: j.h + 2 } })).toString('base64')
        const gap = await page.evaluate(async ({ png, j }) => {
          const img = new Image(); img.src = 'data:image/png;base64,' + png; await img.decode()
          const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height; const cx = cv.getContext('2d'); cx.drawImage(img, 0, 0)
          const d = cx.getImageData(0, 0, img.width, img.height).data; let n = 0
          // Dentro de la caja del grupo (filas 1 … h), un píxel del color de la página en la costura sería un hueco
          for (let y = 1 + j.bw; y < img.height - 1 - j.bw; y++) for (let x = 0; x < img.width; x++) { const i = (y * img.width + x) * 4; if (Math.max(...[0, 1, 2].map((k) => Math.abs(d[i + k] - j.page[k]))) <= 2) n++ }
          return n
        }, { png, j })
        ok(gap === 0, `${P} junta: ningún píxel de la página entre la principal y la cola (no se lee como un hueco): ${gap}`)
        const edges = await page.evaluate(() => { const [m, t] = document.querySelectorAll('.g-fab__main-group > button'); const pg = __c.bgOf(document.querySelector('main')); const c1 = __c.over(__c.rgba(getComputedStyle(m).borderTopColor), pg), c2 = __c.over(__c.rgba(getComputedStyle(t).borderTopColor), pg); return { main: __c.cr(c1, pg), tail: __c.cr(c2, pg), between: __c.cr(c1, c2) } })
        note(`${P} junta: contorno de la principal ${edges.main.toFixed(2)}:1 y de la cola ${edges.tail.toFixed(2)}:1 frente a la página; entre ellos ${edges.between.toFixed(2)}:1`)
      }
      ok(!errs.length, `${P} consola limpia: ${errs}`)
      await ctx.close()
    }
    // En curso no se pinta como deshabilitada (#669): single con data-ack="busy"
    {
      const { ctx, page } = await open(browser, 'theme=audit&n=1')
      const restV = await page.evaluate(() => { const cs = getComputedStyle(document.querySelector('.g-fab > button')); return [cs.backgroundColor, cs.borderTopColor, cs.boxShadow].join(' / ') })
      await page.evaluate(() => { window.__b.plan.sample = 'busy' })
      await page.click('#fab-trigger'); await page.mouse.move(5, 5); await settle(page)
      const b = await page.evaluate(() => { const e = document.querySelector('.g-fab > button'), cs = getComputedStyle(e); return { ack: e.dataset.ack, dis: e.getAttribute('aria-disabled'), v: [cs.backgroundColor, cs.borderTopColor, cs.boxShadow].join(' / '), cur: cs.cursor } })
      ok(b.ack === 'busy' && b.dis === 'true' && b.v === restV && b.cur === 'progress', `${E}[#690·en curso] single en curso con el aspecto de la habilitada y cursor de progreso: ${JSON.stringify(b)}`)
      await ctx.close()
    }
    // #691: el panel que cubre la pila la contiene con una etiqueta larga, a 1000 y 320px, LTR y RTL; sin texto que asome
    for (const [q, vp] of [['n=15&long=1', { width: 1000, height: 480 }], ['n=15&long=1&rtl=1', { width: 1000, height: 480 }], ['theme=audit&n=15&long=1', { width: 1000, height: 480 }], ['n=15&long=1', { width: 320, height: 480 }], ['theme=audit&n=15&long=1&pos=top-start', { width: 1000, height: 480 }]]) {
      const { ctx, page, errs } = await open(browser, q, vp, { deviceScaleFactor: 1 })
      const P = `${E}[#691·${q}·${vp.width}]`
      await page.addStyleTag({ content: '.g-tooltip{visibility:hidden!important}' })
      await openFab(page); await openTail(page)
      const g = await page.evaluate(() => { const s = document.getElementById('fab-more').getBoundingClientRect(), st = document.getElementById('fab-menu').getBoundingClientRect(); return { p: { l: s.left, t: s.top, r: s.right, b: s.bottom }, s: { l: st.left, t: st.top, r: st.right, b: st.bottom }, minh: document.getElementById('fab-more').style.getPropertyValue('--_minh'), w: document.getElementById('fab-more').style.getPropertyValue('--_w'), vw: document.documentElement.clientWidth, sw: document.documentElement.scrollWidth } })
      ok(!!g.minh, `${P} el panel cubre la pila (--_minh): ${g.minh}`)
      ok(g.p.l <= g.s.l + 0.5 && g.p.r >= g.s.r - 0.5 && g.p.t <= g.s.t + 0.5 && g.p.b >= g.s.b - 0.5, `${P} el panel contiene a la pila en línea y en bloque: panel ${g.p.l.toFixed(1)}–${g.p.r.toFixed(1)} · pila ${g.s.l.toFixed(1)}–${g.s.r.toFixed(1)} (--_w ${g.w})`)
      ok(g.p.l >= 0 && g.p.r <= g.vw && g.sw <= g.vw, `${P} dentro del visor, sin desplazamiento horizontal`)
      const a = (await page.screenshot()).toString('base64')
      await page.addStyleTag({ content: '#fab-menu{visibility:hidden!important}' }); await settle(page, 100)
      const b = (await page.screenshot()).toString('base64')
      const d = await page.evaluate(async ({ a, b, p }) => {
        const load = async (s) => { const i = new Image(); i.src = 'data:image/png;base64,' + s; await i.decode(); const c = document.createElement('canvas'); c.width = i.width; c.height = i.height; const x = c.getContext('2d'); x.drawImage(i, 0, 0); return x.getImageData(0, 0, c.width, c.height) }
        const A = await load(a), B = await load(b); let side = 0, sideMax = 0
        for (let y = Math.max(0, Math.floor(p.t)); y < Math.min(A.height, Math.ceil(p.b)); y++) for (let x = 0; x < A.width; x++) {
          if (x >= p.l && x < p.r) continue
          const i = (y * A.width + x) * 4, dd = Math.max(...[0, 1, 2].map((k) => Math.abs(A.data[i + k] - B.data[i + k]))); if (dd > 1) { side++; sideMax = Math.max(sideMax, dd) }
        }
        return { side, sideMax }
      }, { a, b, p: g.p })
      ok(d.sideMax <= 24, `${P} por los lados del panel no asoma texto de la pila (solo sombra, Δ ≤ 24): ${d.side} px, Δ máx ${d.sideMax}`)
      ok(!errs.length, `${P} consola limpia: ${errs}`)
      await ctx.close()
    }
  }
  await browser.close()
}
server.close()
console.log(notes.join('\n'))
console.log('\nMínimos medidos:\n' + Object.entries(mins).map(([k, v]) => `  ${k}: ${v.toFixed(2)}`).join('\n'))
console.log('\nPor motor: ' + Object.entries(counts).map(([k, [a, b]]) => `${k} ${a}/${b}`).join(' · '))
console.log(`\n${total - failed}/${total} comprobaciones correctas`)
if (fails.length) { console.log('FALLOS:\n' + fails.join('\n')); process.exitCode = 1 }
