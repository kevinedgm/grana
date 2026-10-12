// Auditoría de coco (paso 5) de GEmpty, GLoadRegion y la carga de GTable sobre los COMPONENTES REALES:
// design/lab/empty-skeleton/auditoria-banco.html con GEmpty, GTable, GBtn, GBadge, GAvatar, GDialog de dist/grana.umd.js y
// GLoadRegion de dist/load-region.umd.js, con dist/grana.css + dist/fonts.css. Mide lo que el banco de estilo no podía:
// los tiempos reales del motor (100/250/900/6000 ms: retraso 200, mínimo 400, espera larga 5000), el molde invisible del
// retraso, Δ0 en molde y revelado (lista con GAvatar y GBadge, teselas, ficha en texto libre; replace con 0 piezas movidas),
// el revelado (solo color, cuánto dura, reducido), B (filo, píldora, «Nueva», contraste sin cambio, fallo que conserva),
// las cuatro causas de GEmpty y la salida con cuentas, el primer hueco = un elemento, el foco por clave y nunca en <body>,
// los anuncios (≤ 3 por carga, fusión, grupo, diálogo modal), GTable (retraso, mínimo, slow, error con y sin filas, vacío
// con GEmpty, foco por rowKey, fila compuesta), contraste en 28 configuraciones (por defecto, auditoría de @grana/cli,
// propio del estilo y los once de dark-color-presence/generated, claro y oscuro), RTL, 44px táctil, 320px, forced-colors
// (Chromium) y consola limpia.
// Ejecutar desde la raíz del repo:
//   GRANA_DIST=<copia de packages/vue/dist> GRANA_PW_PORT=4216 node design/lab/empty-skeleton/auditoria-verificar.mjs
// Opcional: --engines=chromium,firefox,webkit  --themes=quick (solo por defecto y auditoría)  --only=0,1,…
import http from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const pw = await import(new URL('../theme-playground/node_modules/playwright/index.mjs', import.meta.url))
const ROOT = fileURLToPath(new URL('../../../', import.meta.url))
const DIST = process.env.GRANA_DIST
const DISTDIR = DIST || join(ROOT, 'packages/vue/dist')
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')).map(([k, v]) => [k, v ?? true]))
const ENGINES = (args.engines || 'chromium,firefox,webkit').split(',')
const ONLY = args.only ? new Set(String(args.only).split(',')) : null
const run = (n) => !ONLY || ONLY.has(String(n))
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const server = http.createServer(async (req, res) => {
  try {
    const path = decodeURIComponent(new URL(req.url, 'http://x').pathname)
    const p = DIST && path.startsWith('/packages/vue/dist/') ? join(DIST, path.slice('/packages/vue/dist/'.length)) : normalize(join(ROOT, path))
    if (!DIST && !p.startsWith(ROOT)) throw new Error('fuera')
    const body = await readFile(p)
    res.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream' }).end(body)
  } catch { res.writeHead(404).end() }
})
await new Promise((r) => server.listen(Number(process.env.GRANA_PW_PORT) || 4216, '127.0.0.1', r))
const BASE = `http://127.0.0.1:${server.address().port}/design/lab/empty-skeleton/auditoria-banco.html`

const GEN = ['amazon', 'apple', 'caracol-purpura', 'github', 'grana', 'linear', 'lustre', 'medium', 'notion', 'spotify', 'stripe']
const THEMES = args.themes === 'quick' ? ['', 'auditoria'] : ['', 'auditoria', 'propio', ...GEN]
let total = 0, failed = 0
const fails = [], notes = [], counts = {}, data = {}
const ok = (cond, msg, eng = 'estático') => { total++; counts[eng] = counts[eng] || [0, 0]; counts[eng][1]++; if (cond) counts[eng][0]++; else { failed++; fails.push(msg) } }
const near = (a, b, t = 0.5) => Math.abs(a - b) <= t

/* ---------- 0 · Estático: CSS fuente y publicado ---------- */
if (run(0)) {
  const read = async (p) => (await readFile(join(ROOT, p), 'utf8')).replace(/\/\*[\s\S]*?\*\//g, '')
  const files = {
    empty: await read('packages/vue/src/components/GEmpty/GEmpty.css'),
    region: await read('packages/vue/src/components/GLoadRegion/GLoadRegion.css'),
    table: await read('packages/vue/src/components/GTable/GTable.css')
  }
  const defaults = await readFile(join(ROOT, 'packages/vue/src/styles/defaults.css'), 'utf8')
  const defined = new Set([...defaults.matchAll(/(--g-[a-z0-9-]+)\s*:/g)].map((m) => m[1]))
  for (const [k, css] of Object.entries(files)) {
    const K = (m) => `CSS ${k}: ${m}`
    ok(!/#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|lab|lch|color-mix)\(/.test(css), K('color literal o mezcla'))
    ok(!/var\(\s*--[\w-]+\s*,/.test(css), K('var() con valor de respaldo'))
    ok(!/@layer|@property|@keyframes|(^|[;{\s])animation(-name)?\s*:/.test(css), K('@layer, @property, @keyframes o animation'))
    const vars = [...css.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1])
    ok(vars.every((v) => v.startsWith('--g-') || v.startsWith('--_')), K('var() que no es --g-* ni --_*'))
    const missing = [...new Set(vars.filter((v) => v.startsWith('--g-') && !defined.has(v)))]
    ok(!missing.length, K('tokens que no existen en defaults.css ' + missing))
    ok(!/--g-[\w-]+\s*:/.test(css), K('declara un token del tema'))
  }
  const pxOf = (css) => [...css.matchAll(/(-?\d*\.?\d+)px\b/g)].map((m) => m[0])
  const srOnly = (css) => css.split('\n').filter((l) => /\b-?1px\b/.test(l)).every((l) => /^\s*(inline-size|block-size|margin): -?1px;$/.test(l))
  ok(pxOf(files.region).every((p) => ['1px', '-1px'].includes(p)) && srOnly(files.region), 'GLoadRegion: px fuera del texto oculto del canal ' + pxOf(files.region))
  ok(pxOf(files.empty).every((p) => ['1px', '-1px', '24px', '44px'].includes(p)) && srOnly(files.empty), 'GEmpty: px fuera del texto oculto y del área táctil ' + pxOf(files.empty))
  ok(!/!important/.test(files.empty) && !/!important/.test(files.table), 'CSS: !important fuera de GLoadRegion')
  {
    let ctx = [], pending = ''
    const bad = []
    for (const t of files.region.split(/([{}])/)) {
      if (t === '{') { ctx.push(pending.trim()); pending = '' }
      else if (t === '}') { ctx.pop(); pending = '' }
      else { pending += t; if (/!important/.test(t) && ctx.length) for (const sel of ctx[ctx.length - 1].split(/,(?![^(]*\))/)) if (!/\.is-mold/.test(sel)) bad.push(sel.trim()) }
    }
    ok(!bad.length, 'GLoadRegion: !important fuera del molde: ' + bad)
  }
  ok(/@media \(pointer: coarse\) \{\s*\.g-empty__actions \{ gap: max\(var\(--g-space-4\), calc\(44px - 24px\)\) var\(--g-space-2\); \}/.test(files.empty), 'GEmpty: con puntero grueso, la separación de filas no garantiza 44 − 24 (hallazgo 5)')
  ok(/\.g-load-live \{[^}]*clip-path: inset\(50%\)/.test(files.region), 'GLoadRegion: sin regla para el canal .g-load-live (hallazgo 1)')
  ok(/\.g-load-region__slow \{[^}]*inset-inline-start: var\(--g-space-2\);[^}]*inset-block-end: var\(--g-space-2\)/.test(files.region), 'GLoadRegion: la espera larga sigue siendo una banda de lado a lado (hallazgo 4)')
  ok(/padding: calc\(var\(--g-space-3\) - var\(--g-border-width\)\) var\(--g-space-4\)/.test(files.empty) && /\.g-empty__text \{[^}]*gap: 0;/.test(files.empty), 'GEmpty: el relleno no descuenta el borde o queda hueco entre líneas (hallazgo 3)')
  // Publicado
  const dcss = await readFile(join(DISTDIR, 'grana.css'), 'utf8')
  const djs = await readFile(join(DISTDIR, 'grana.js'), 'utf8')
  const dlr = await readFile(join(DISTDIR, 'load-region.js'), 'utf8')
  const layer = dcss.indexOf('@layer grana.components')
  ok(layer >= 0 && ['.g-empty__count', '.g-load-region__pill', '.g-load-live', '.g-load-region__slow', '.g-table__skeleton'].every((c) => dcss.indexOf(c) > layer), 'dist/grana.css: reglas fuera de la capa grana.components o ausentes')
  ok(!/data:font/.test(dcss), 'dist/grana.css: fuente incrustada')
  ok(/inset-inline-start:\s*var\(--g-space-2\)/.test(dcss.slice(dcss.indexOf('.g-load-region__slow'))), 'dist/grana.css: no lleva el arreglo de la espera larga')
  ok(!/GLoadRegion/.test(djs) && /GEmpty/.test(djs), 'dist: GLoadRegion en grana.js o GEmpty fuera del principal (#530)')
  ok(!/g-empty__/.test(dlr), 'dist/load-region.js: lleva una copia de GEmpty (#530)')
}

/* ---------- Utilidades en la página ---------- */
const LIB = `window.__lib = (() => {
  const parse = (s) => {
    let m = s.match(/rgba?\\(([^)]+)\\)/)
    if (m) { const p = m[1].split(/[\\s,/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p[3] ?? 1] }
    m = s.match(/color\\(srgb ([^)]+)\\)/)
    if (m) { const p = m[1].split(/[\\s/]+/).filter(Boolean).map(Number); return [p[0] * 255, p[1] * 255, p[2] * 255, p[3] ?? 1] }
    return [0, 0, 0, 0]
  }
  const over = (top, bot) => { const a = top[3]; return [top[0] * a + bot[0] * (1 - a), top[1] * a + bot[1] * (1 - a), top[2] * a + bot[2] * (1 - a), 1] }
  const bgOf = (el) => {
    const layers = []
    for (let n = el; n; n = n.parentElement) { const c = parse(getComputedStyle(n).backgroundColor); if (c[3] > 0) { layers.push(c); if (c[3] >= 1) break } }
    let base = parse(getComputedStyle(document.documentElement).backgroundColor)
    if (base[3] < 1) base = parse(getComputedStyle(document.body).backgroundColor)
    for (let i = layers.length - 1; i >= 0; i--) base = over(layers[i], base)
    return base
  }
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]) }
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return +((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)).toFixed(2) }
  const tok = (n) => { const i = document.createElement('i'); i.style.color = 'var(' + n + ')'; document.querySelector('.host').append(i); const c = parse(getComputedStyle(i).color); i.remove(); return c }
  const len = (expr) => { const i = document.createElement('i'); i.style.position = 'absolute'; i.style.inlineSize = expr; document.querySelector('.host').append(i); const v = i.getBoundingClientRect().width; i.remove(); return v }
  const dur = (n) => { const i = document.createElement('i'); i.style.transitionDuration = 'var(' + n + ')'; document.body.append(i); const v = parseFloat(getComputedStyle(i).transitionDuration) * 1000; i.remove(); return v }
  const R = (el) => el.getBoundingClientRect()
  const col = (el, p = 'color') => parse(getComputedStyle(el)[p])
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
  const raf2 = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
  const $ = (s) => document.querySelector(s)
  const until = async (fn, ms = 8000) => { const t = performance.now(); while (performance.now() - t < ms) { if (fn()) return true; await new Promise((r) => requestAnimationFrame(r)) } return false }
  // Línea de tiempo de una raíz: cada cambio de clases (y de foco) con su instante desde t0
  const timeline = (sel) => {
    const el = $(sel), t0 = performance.now(), log = [], focus = []
    let last = '', stop = false
    const tick = () => {
      const c = el.className, t = performance.now() - t0
      if (c !== last) { log.push({ t, c }); last = c }
      const a = document.activeElement
      focus.push(a === document.body || !a ? 'body' : a === el ? 'root' : el.contains(a) ? 'inside' : 'out')
      if (!stop) requestAnimationFrame(tick)
    }
    tick()
    const first = (pred) => (log.find((x) => pred(x.c.split(' '))) || {}).t
    const arrive = () => { const i = log.findIndex((x) => x.c.split(' ').includes('is-busy')); const j = i < 0 ? -1 : log.findIndex((x, k) => k > i && !x.c.split(' ').includes('is-busy')); return j < 0 ? undefined : log[j].t }
    return { log, focus, end: () => { stop = true }, first, arrive }
  }
  const settle = async (el, ms = 8000) => {
    await sleep(60)
    await until(() => !el.classList.contains('is-busy') && !el.classList.contains('is-mold') && !el.classList.contains('is-loading') && !el.querySelector('.g-table__skeleton'), ms)
    await sleep(150)
  }
  const anims = (root) => document.getAnimations().filter((a) => a.effect && a.effect.target && root.contains(a.effect.target) && a.playState === 'running')
  const live = () => window.__live.map((x) => x.text)
  const clearLive = () => { window.__live.length = 0; window.__tlive.length = 0 }
  return { parse, over, bgOf, ratio, tok, len, dur, R, col, sleep, raf2, $, until, timeline, anims, live, clearLive, settle }
})()`

async function load(page, qs = '') {
  await page.goto(BASE + qs)
  await page.waitForSelector('html[data-ready="1"]', { timeout: 20000 })
  await page.evaluate(LIB)
}
const consoleOf = (page, errors, tag) => {
  page.on('console', (m) => { if ((m.type() === 'error' || m.type() === 'warning') && !/development build|production build/.test(m.text())) errors.push(`${tag}: ${m.text().slice(0, 160)}`) })
  page.on('pageerror', (e) => errors.push(`${tag}: ${e.message}`))
}

/* ---------- Contraste en el tema cargado (una carga por página: B a la vista, espera larga, molde, fallo) ---------- */
const contrast = (page) => page.evaluate(async () => {
  const { parse, over, bgOf, ratio, tok, col, sleep, $, until } = window.__lib
  const A = window.A
  const out = []
  const add = (k, fg, bg, min, max) => out.push({ k, r: ratio(over(fg, bg), bg), min, max })
  // Tono del molde
  const mold = tok('--g-color-mold'), surf = tok('--g-color-surface')
  out.push({ k: 'molde opaco (alfa)', r: mold[3], min: 1, max: 1.0001 })
  add('molde / surface', mold, surf, 1.3, 3)
  // GEmpty sueltos (sobre surface)
  for (const e of document.querySelectorAll('#empties .g-empty, #e-rtl')) {
    const t = e.querySelector('.g-empty__title'); add('vacío: título', col(t), bgOf(t), 4.5)
    const d = e.querySelector('.g-empty__description'); if (d) add('vacío: descripción', col(d), bgOf(d), 4.5)
    const tr = e.querySelector('.g-empty__trace'); if (tr) add('vacío: traza', col(tr), bgOf(tr), 4.5)
    for (const c of e.querySelectorAll('.g-empty__count')) add('vacío: cuenta', col(c), bgOf(c), 4.5)
    for (const b of e.querySelectorAll('.g-btn')) {
      const v = [...b.classList].find((x) => x.startsWith('g-btn--variant-')).slice(15), c = [...b.classList].find((x) => x.startsWith('g-btn--color-')).slice(13)
      add(`vacío: botón ${v} ${c}`, col(b), bgOf(b), 4.5)
    }
    const ic = e.querySelector('.g-empty__icon')
    if (e.classList.contains('g-empty--cause-error')) add('vacío: icono de error (≥ 3)', col(ic), bgOf(ic), 3)
    out.push({ k: 'vacío: contorno discontinuo (decorativo)', r: ratio(over(col(e, 'borderTopColor'), bgOf(e)), bgOf(e)), min: 0 })
  }
  for (const id of ['b-outline-brand', 'b-ghost-neutral', 'b-ghost-brand']) { const b = $('#' + id); add('#555: ' + id.slice(2), col(b), bgOf(b), 4.5) }
  // Arranque de las fases: lista en B 6 s, teselas en molde 6 s (primera carga), tabla compuesta 6 s, fallo de la ficha y de la tabla, lo nuevo en RTL
  const titleBefore = getComputedStyle($('#r-list .row-title')).color
  A.s.withNew = true
  A.refresh('list', 6000, 'data')
  for (const t of ['t1', 't2', 't3']) A.s.tiles[t].items = null
  await sleep(30)
  A.refreshTiles(6000)
  A.tableComp(6000)
  A.refresh('detail', 300, 'error')
  A.table(300, 'error')
  A.refresh('rtl', 300)
  await sleep(700)
  const fr = $('#r-rtl [data-g-fresh]')
  if (fr) add('marca de lo nuevo / fondo de la fila', parse(getComputedStyle(fr, '::before').backgroundColor), bgOf(fr), 3)
  else out.push({ k: 'marca de lo nuevo (no apareció)', r: 0, min: 1 })
  const fb = $('#r-detail .g-load-region__failed')
  if (fb) {
    add('barra de fallo: texto', col(fb.querySelector('.g-load-region__failed-text')), bgOf(fb), 4.5)
    add('barra de fallo: icono (≥ 3)', col(fb.querySelector('.g-load-region__failed-icon')), bgOf(fb), 3)
    const rb = fb.querySelector('.g-btn'); add('barra de fallo: «Reintentar»', col(rb), bgOf(rb), 4.5)
  } else out.push({ k: 'barra de fallo (no apareció)', r: 0, min: 1 })
  const tf = $('#t-main .g-table__failed')
  if (tf) {
    add('tabla: barra de fallo, texto', col(tf.querySelector('.g-table__failed-text')), bgOf(tf), 4.5)
    add('tabla: barra de fallo, icono (≥ 3)', col(tf.querySelector('.g-table__failed-icon')), bgOf(tf), 3)
    const tfb = tf.querySelector('.g-btn'); add('tabla: «Reintentar»', col(tfb), bgOf(tfb), 4.5)
  } else out.push({ k: 'tabla: barra de fallo (no apareció)', r: 0, min: 1 })
  // B a la vista
  const r = $('#r-list')
  const pill = r.querySelector('.g-load-region__pill')
  if (pill) add('píldora «Actualizando»', col(pill), bgOf(pill), 4.5)
  else out.push({ k: 'píldora (no apareció)', r: 0, min: 1 })
  add('filo de B / surface', parse(getComputedStyle(r, '::before').backgroundColor), bgOf(r), 3)
  const tDuring = $('#r-list .row-title'), cs = getComputedStyle(tDuring)
  out.push({ k: 'B: lo de antes conserva su color (Δ)', r: cs.color === titleBefore && cs.filter === 'none' && cs.opacity === '1' ? 0 : 1, min: 0, max: 0 })
  // Molde de la tesela con lo conocido
  const known = $('#r-t3 [data-g-known] span')
  add('molde: data-g-known', col(known), bgOf(known.closest('.tile')), 4.5)
  // Espera larga
  await until(() => r.classList.contains('is-slow') && $('#r-t3').classList.contains('is-slow') && $('#t-comp').classList.contains('is-slow'), 6000)
  await sleep(50)
  const sl = r.querySelector('.g-load-region__slow'); add('espera larga (lista)', col(sl), bgOf(sl), 4.5)
  const st = $('#r-t3 .g-load-region__slow'); add('espera larga (tesela)', col(st), bgOf(st), 4.5)
  out.push({ k: 'espera larga: borde de la ficha (informativo)', r: ratio(over(col(st, 'borderTopColor'), bgOf(st)), bgOf(st)), min: 0 })
  const ts = $('#t-comp .g-table__slow'); add('tabla: espera larga', col(ts), bgOf(ts), 4.5)
  const sk = $('#t-comp .g-table__skeleton'); add('tabla: esqueleto / surface', col(sk, 'backgroundColor'), bgOf(sk.parentElement), 1.3, 3)
  return out
})

for (const engine of ENGINES) {
  const E = (m) => `[${engine}] ${m}`
  const ck = (c, m) => ok(c, E(m), engine)
  const browser = await pw[engine].launch()
  const errors = []
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await ctx.newPage()
  consoleOf(page, errors, 'auditoría')
  await load(page, '?theme=auditoria')
  const ev = (fn, arg) => page.evaluate(fn, arg)

  /* ---------- 1 · Marcado real frente al que espera el CSS ---------- */
  if (run(1)) {
    const m = await ev(() => {
      const { $, R } = window.__lib
      const r = $('#r-list')
      const lives = document.querySelectorAll('.g-load-live')
      const lv = lives[0], cs = lv && getComputedStyle(lv)
      const btns = (id) => [...document.querySelectorAll(id + ' .g-empty__actions .g-btn')].map((b) => ({ text: b.querySelector('.g-btn__label').textContent, relax: b.classList.contains('g-empty__relax'), v: [...b.classList].find((x) => x.startsWith('g-btn--variant-')), c: [...b.classList].find((x) => x.startsWith('g-btn--color-')), count: b.querySelector('.g-empty__count')?.getAttribute('aria-hidden'), sr: b.querySelector('.g-empty__sr')?.textContent }))
      const ef = $('#e-filtered')
      return {
        role: r.getAttribute('role'), lb: r.getAttribute('aria-labelledby'), tab: r.getAttribute('tabindex'), busy: r.getAttribute('aria-busy'),
        cls: r.className, body: !!r.querySelector(':scope > .g-load-region__body'), slowDisp: getComputedStyle(r.querySelector(':scope > .g-load-region__slow')).display, pill: !!r.querySelector('.g-load-region__pill'),
        keys: [...r.querySelectorAll('[data-g-key]')].map((n) => n.getAttribute('data-g-key')),
        lives: lives.length, lvParent: lv && lv.parentElement.tagName, lvAttrs: lv && [lv.getAttribute('aria-live'), lv.getAttribute('aria-atomic')], lvBox: lv && [R(lv).width, R(lv).height], lvClip: cs && cs.clipPath, lvInline: lv && lv.getAttribute('style'),
        ef: { cls: ef.className, icon: ef.querySelector('.g-empty__icon').getAttribute('aria-hidden'), iconSvg: !!ef.querySelector('.g-empty__icon svg'), title: ef.querySelector('.g-empty__title').tagName + ef.querySelector('.g-empty__title').getAttribute('dir'), trace: ef.querySelector('.g-empty__trace').textContent, role: ef.getAttribute('role'), tabindex: ef.getAttribute('tabindex'), btns: btns('#e-filtered') },
        only: btns('#e-only'), long: btns('#e-long'),
        fb: $('#e-forbidden .g-empty__title').tagName, none: [$('#e-none').className, !!$('#e-none .g-empty__icon svg')], err: [$('#e-error').className, !!$('#e-error .g-empty__icon svg')],
        minAuto: [...document.querySelectorAll('#empties .g-empty')].map((e) => getComputedStyle(e).minBlockSize)
      }
    })
    ck(m.role === 'group' && m.lb === 'h-list' && m.tab === '-1' && m.busy === 'false', `raíz: role/labelledby/tabindex/aria-busy ${m.role} ${m.lb} ${m.tab} ${m.busy}`)
    ck(m.cls === 'g-load-region' && m.body && m.slowDisp === 'none' && !m.pill, `reposo: clases ${m.cls}, espera larga ${m.slowDisp}, píldora ${m.pill}`)
    ck(m.keys.join() === 'm7,m8,m9,m10', 'data-g-key por itemAttrs: ' + m.keys)
    ck(m.lives === 1 && m.lvParent === 'BODY' && m.lvAttrs.join() === 'polite,true', `canal de página: ${m.lives} nodos, en ${m.lvParent}, ${m.lvAttrs}`)
    ck(m.lvBox[0] <= 1 && m.lvBox[1] <= 1 && /inset\(50%\)/.test(m.lvClip), `canal de página visible ${m.lvBox} ${m.lvClip}`)
    data.lvInline = m.lvInline
    ck(/is-exit/.test(m.ef.cls) && m.ef.icon === 'true' && m.ef.iconSvg && m.ef.title === 'Pauto' && m.ef.role === null && m.ef.tabindex === null, 'GEmpty filtrado: marcado ' + JSON.stringify(m.ef).slice(0, 200))
    ck(m.ef.trace === 'Antes había 14; con Hoy, Cerradas y Urgentes, ninguna.', 'GEmpty: traza ' + m.ef.trace)
    const eb = m.ef.btns
    ck(eb.length === 3 && eb[0].text.startsWith('Quitar «Hoy»') && eb[1].text.startsWith('Quitar «Cerradas»') && eb[0].relax && eb[1].relax && !eb[2].relax && eb[2].text === 'Quitar todos', 'salida: orden de más a menos y «Quitar todos» ' + JSON.stringify(eb.map((b) => b.text)))
    ck(eb[0].count === 'true' && eb[0].sr === ' 12 vuelven' && eb[0].v === 'g-btn--variant-outline' && eb[2].v === 'g-btn--variant-ghost', 'salida: cuenta aria-hidden, __sr con espacio, outline/ghost ' + JSON.stringify(eb[0]))
    data.btnColors = { relax: eb[0].c, clear: eb[2].c, only: m.only.map((b) => b.v + ' ' + b.c) }
    ck(m.only.length === 1 && m.only[0].text === 'Quitar todos' && m.only[0].v === 'g-btn--variant-outline', 'sin cuentas: solo «Quitar todos» outline ' + JSON.stringify(m.only))
    ck(m.fb === 'H4' && /cause-none/.test(m.none[0]) && m.none[1] && /cause-error/.test(m.err[0]) && m.err[1], 'causas: forbidden h4, none con el icono del slot, error con circle-alert')
    ck(m.minAuto.every((v) => v === 'auto' || v === '0px'), 'GEmpty suelto con mínimo ' + m.minAuto)
    for (const name of ['Quitar «Hoy» 12 vuelven', 'Quitar «Cerradas» 2 vuelven']) ck(await page.getByRole('button', { name, exact: true }).count() === 1, 'nombre accesible del botón de la salida: ' + name)
  }

  /* ---------- 2 · Tiempos reales del motor (100/250/900/6000 ms) ---------- */
  if (run(2)) {
    const T = await ev(async () => {
      const { timeline, until, sleep, live, clearLive, $, anims, R } = window.__lib
      const A = window.A, out = {}
      for (const ms of [100, 250, 900]) {
        clearLive(); A.s.list.items = null
        await sleep(30)
        const tl = timeline('#r-list')
        A.refresh('list', ms, 'data')
        await sleep(30)
        const pendingVisible = [...$('#r-list .g-load-region__body').querySelectorAll('*')].filter((n) => getComputedStyle(n).visibility !== 'hidden').length
        await until(() => !$('#r-list').classList.contains('is-busy') && !$('#r-list').classList.contains('is-mold'), 4000)
        await sleep(120); tl.end()
        out[ms] = {
          shown: tl.first((c) => c.includes('is-busy') && !c.includes('is-pending')),
          arrive: tl.arrive(),
          revealOn: tl.first((c) => c.includes('is-revealing')),
          revealOff: (() => { const i = tl.log.findIndex((x) => x.c.includes('is-revealing')); return i >= 0 && tl.log[i + 1] ? tl.log[i + 1].t : null })(),
          orphan: tl.log.some((x) => x.c.includes('is-revealing') && !x.c.includes('is-mold')),
          pendingMold: (() => { const b = tl.log.find((x) => x.c.includes('is-busy')); return Boolean(b && b.c.includes('is-pending') && b.c.includes('is-mold')) })(),
          pendingVisible, live: live(), log: tl.log.map((x) => Math.round(x.t) + ':' + x.c.replace('g-load-region', '').trim()).join(' | ')
        }
      }
      // 6000 ms: refresco keep (lo conocido a la vista); a los 5 s, texto visible y ninguna animación en curso
      clearLive()
      const r = $('#r-list'), h0 = R(r).height, a0 = R($('#r-list-after')).top
      const tl = timeline('#r-list')
      let ref = null
      const tRef = performance.now()
      setTimeout(() => { ref = performance.now() - tRef }, 5000) // reloj de referencia: lo que tarda un setTimeout de 5 s en este motor
      A.refresh('list', 6000, 'data')
      await until(() => r.classList.contains('is-slow'), 7000)
      const slowAt = performance.now()
      await sleep(200)
      const sl = r.querySelector('.g-load-region__slow'), rr = R(r), rs = R(sl)
      out.slow = { ref, slow: tl.first((c) => c.includes('is-slow')), stale: tl.first((c) => c.includes('is-stale')), anims: anims(r).length, h: R(r).height - h0, after: R($('#r-list-after')).top - a0, inside: rs.left >= rr.left && rs.right <= rr.right && rs.bottom <= rr.bottom && rs.top >= rr.top, gap: [rs.left - rr.left, rr.bottom - rs.bottom], disp: getComputedStyle(sl).display }
      await window.__lib.settle(r); tl.end()
      out.slow.arrive = tl.arrive()
      out.slow.live = live()
      void slowAt
      return out
    })
    data.times = T
    const sp = (await ev(() => window.__lib.len('var(--g-space-2)')))
    const slowDur = await ev(() => window.__lib.dur('--g-duration-slow'))
    // 100 ms: nada visible, nada anunciado al empezar
    ck(T[100].shown === undefined && T[100].revealOn === undefined && T[100].pendingMold && T[100].pendingVisible === 0, `100 ms: se vio la carga o el molde no era invisible (${T[100].log}; visibles ${T[100].pendingVisible})`)
    ck(T[100].arrive >= 95 && T[100].arrive <= 220, `100 ms: llegada a ${T[100].arrive}`)
    ck(T[100].live.join('|') === '4 muestras.', '100 ms: anuncios ' + T[100].live)
    // 250 ms: se ve a los 200 y se queda 400
    ck(T[250].shown >= 190 && T[250].shown <= 290, `250 ms: visible a ${T[250].shown}`)
    ck(T[250].arrive >= T[250].shown + 390 && T[250].arrive <= T[250].shown + 520, `250 ms: mínimo de 400 incumplido (visible ${T[250].shown}, llegada ${T[250].arrive})`)
    ck(T[250].live.join('|') === 'Cargando muestras.|4 muestras.', '250 ms: anuncios ' + T[250].live)
    // 900 ms
    ck(T[900].shown >= 190 && T[900].shown <= 290 && T[900].arrive >= 895 && T[900].arrive <= 1010, `900 ms: visible ${T[900].shown}, llegada ${T[900].arrive}`)
    for (const ms of [250, 900]) {
      const d = T[ms].revealOff - T[ms].revealOn
      ck(T[ms].revealOn >= T[ms].arrive && d >= slowDur - 30 && d <= slowDur + 80 + 70, `${ms} ms: revelado de ${Math.round(d)} ms (≈ ${slowDur} + margen)`)
      ck(!T[ms].orphan, `${ms} ms: is-revealing sin is-mold`)
    }
    data.revealDur = Math.round(T[900].revealOff - T[900].revealOn)
    // 6000 ms
    const S = T.slow
    ck(S.stale >= 190 && S.stale <= 290 && S.slow >= 4990 && S.slow - S.ref <= 80, `6000 ms: B a ${S.stale}, espera larga a ${S.slow} (un setTimeout de 5 s del motor: ${S.ref})`)
    data.slowAt = data.slowAt || {}; data.slowAt[engine] = [Math.round(S.slow), Math.round(S.ref), Math.round(S.arrive)]
    ck(S.anims === 0, `a los 5 s quedan ${S.anims} animaciones en curso en la región`)
    ck(near(S.h, 0) && near(S.after, 0), `espera larga: mueve la región ${S.h} o lo de debajo ${S.after}`)
    ck(S.disp !== 'none' && S.inside && near(S.gap[0], sp, 1) && near(S.gap[1], sp, 1), `espera larga: ficha fuera de la región o sin su margen ${S.gap} (${sp})`)
    ck(S.arrive >= 5995 && S.arrive <= Math.max(6150, S.ref + 1150), '6000 ms: llegada a ' + S.arrive)
    ck(S.live.join('|') === 'Cargando muestras.|Sigue cargando muestras…|4 muestras.', '6000 ms: tres anuncios ' + S.live)
  }

  /* ---------- 3 · Δ0: molde, retraso invisible, revelado (auditoría y por defecto) ---------- */
  if (run(3)) {
    for (const th of ['auditoria', '']) {
      if (th === '') await load(page, '')
      const D = await ev(async () => {
        const { sleep, until, $, R, parse, anims } = window.__lib
        const A = window.A, out = {}
        const box = (sel) => ({ h: R($(sel)).height, after: R($(sel + '-after')).top })
        const rects = (sel) => [...$(sel + ' .g-load-region__body').querySelectorAll('*')].map((n) => { const r = R(n); return [r.left, r.top, r.width, r.height] })
        const diff = (a, b) => (a.length !== b.length ? 999 : Math.max(0, ...a.map((x, i) => Math.max(...x.map((v, j) => Math.abs(v - b[i][j]))))))
        // Primera carga de la lista (muestra de 4 → 4 reales), teselas y ficha
        const b0 = { list: box('#r-list'), dash: box('#r-dash'), detail: box('#r-detail') }
        await A.first(900)
        await until(() => $('#r-list').classList.contains('is-pending'), 1000)
        const pend = { list: box('#r-list'), vis: [...$('#r-list .g-load-region__body').querySelectorAll('*')].filter((n) => getComputedStyle(n).visibility !== 'hidden').length }
        await until(() => ['#r-list', '#r-detail', '#r-t1'].every((x) => $(x).classList.contains('is-mold') && !$(x).classList.contains('is-pending')), 1500)
        await sleep(50)
        const m = { list: box('#r-list'), dash: box('#r-dash'), detail: box('#r-detail') }
        const leaf = $('#r-list .row-title'), lcs = getComputedStyle(leaf)
        const av = $('#r-list .g-avatar'), avs = getComputedStyle(av)
        const badge = $('#r-list .row-status'), bcs = getComputedStyle(badge)
        out.mold = {
          ink: parse(lcs.color)[3], deco: lcs.textDecorationLine, thick: parseFloat(lcs.textDecorationThickness) / parseFloat(lcs.fontSize), decoColor: lcs.textDecorationColor, mold: getComputedStyle($('#r-list')).getPropertyValue('--_mold'),
          avBg: parse(avs.backgroundColor)[3], avHidden: [...av.querySelectorAll('img, svg')].every((n) => getComputedStyle(n).visibility === 'hidden'),
          badgeBg: parse(bcs.backgroundColor)[3], badgeInk: parse(bcs.color)[3],
          known: parse(getComputedStyle($('#r-t1 [data-g-known] span')).color)[3], knownDeco: getComputedStyle($('#r-t1 [data-g-known] span')).textDecorationLine,
          knownIcon: getComputedStyle($('#r-t1 [data-g-known] svg')).visibility,
          tileShadow: getComputedStyle($('#r-t1 .tile')).boxShadow,
          aria: $('#r-list .g-load-region__body').getAttribute('aria-hidden'), inert: $('#r-list .g-load-region__body').hasAttribute('inert'),
          focusables: [...$('#r-list .g-load-region__body').querySelectorAll('a, button')].filter((n) => !n.closest('[inert]')).length
        }
        await until(() => ['#r-list', '#r-detail', '#r-t3'].every((s) => !$(s).classList.contains('is-mold')), 4000)
        await sleep(150)
        const f = { list: box('#r-list'), dash: box('#r-dash'), detail: box('#r-detail') }
        out.first = { b0, pend, m, f, anims: anims($('#r-list')).length + anims($('#r-dash')).length }
        // replace: el molde de lo último conocido y su revelado, pieza a pieza
        A.s.refresh = 'replace'
        await sleep(30)
        const before = { list: rects('#r-list'), detail: rects('#r-detail') }
        A.refresh('list', 900, 'data'); A.refresh('detail', 900, 'data')
        await sleep(400)
        const inMold = { list: rects('#r-list'), detail: rects('#r-detail'), cls: $('#r-list').className }
        await until(() => $('#r-list').classList.contains('is-revealing'), 1500)
        await sleep(60)
        const mid = { list: rects('#r-list'), ink: parse(getComputedStyle($('#r-list .row-title')).color)[3], deco: parse(getComputedStyle($('#r-list .row-title')).textDecorationColor)[3], tr: [...new Set(anims($('#r-list')).map((a) => a.transitionProperty || a.animationName))] }
        await until(() => !$('#r-list').classList.contains('is-mold'), 2000)
        const leftAtEnd = anims($('#r-list')).length, tEnd = performance.now()
        await until(() => anims($('#r-list')).length === 0, 1000)
        const tail = Math.round(performance.now() - tEnd)
        await sleep(120)
        const after = { list: rects('#r-list'), detail: rects('#r-detail') }
        out.replace = { mold: diff(before.list, inMold.list), moldDetail: diff(before.detail, inMold.detail), mid: diff(before.list, mid.list), end: diff(before.list, after.list), endDetail: diff(before.detail, after.detail), cls: inMold.cls, midInk: mid.ink, midDeco: mid.deco, tr: mid.tr, finalInk: parse(getComputedStyle($('#r-list .row-title')).color)[3], anims: anims($('#r-list')).length, leftAtEnd, tail }
        A.s.refresh = 'keep'
        return out
      })
      const tag = th || 'por defecto'
      data['delta-' + tag] = D
      const { b0, pend, m, f } = D.first
      ck(near(pend.list.h, b0.list.h) && near(pend.list.after, b0.list.after) && pend.vis === 0, `${tag}: retraso de la primera carga: alto ${pend.list.h - b0.list.h}, debajo ${pend.list.after - b0.list.after}, piezas visibles ${pend.vis}`)
      ck(near(m.list.h, f.list.h) && near(m.list.after, f.list.after), `${tag}: lista molde → datos Δ ${m.list.h - f.list.h}`)
      ck(near(m.dash.h, f.dash.h) && near(m.dash.after, f.dash.after), `${tag}: teselas molde → datos Δ ${m.dash.h - f.dash.h}`)
      data['detailFirst-' + tag] = Math.round((f.detail.h - m.detail.h) * 10) / 10
      const M = D.mold
      ck(M.ink === 0 && M.deco === 'line-through' && near(M.thick, 0.72, 0.02), `${tag}: hoja del molde ${M.ink} ${M.deco} ${M.thick}`)
      ck(M.avBg === 0 && M.avHidden && M.badgeBg === 0 && M.badgeInk === 0, `${tag}: GAvatar/GBadge dentro del molde con tinta ${JSON.stringify(M)}`)
      ck(M.known === 1 && M.knownDeco === 'none' && M.knownIcon === 'visible' && M.tileShadow === 'none', `${tag}: data-g-known ${M.known} ${M.knownDeco} ${M.knownIcon}, sombra ${M.tileShadow}`)
      ck(M.aria === 'true' && M.inert && M.focusables === 0, `${tag}: molde con foco o sin aria-hidden/inert`)
      ck(D.first.anims === 0, `${tag}: animaciones tras la primera carga ${D.first.anims}`)
      const R_ = D.replace
      ck(/is-mold/.test(R_.cls) && R_.mold <= 0.5 && R_.moldDetail <= 0.5, `${tag}: replace: el molde de lo último conocido mueve piezas (lista ${R_.mold}, ficha ${R_.moldDetail})`)
      ck(R_.mid <= 0.5 && R_.end <= 0.5 && R_.endDetail <= 0.5, `${tag}: revelado: piezas movidas ${R_.mid} / ${R_.end} / ${R_.endDetail}`)
      ck(R_.midInk > 0 && R_.midInk < 1 && R_.tr.length > 0 && R_.tr.every((p) => ['color', 'text-decoration-color', 'background-color', 'border-color', 'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color', 'outline-color', 'box-shadow', 'border-block-start-color', 'border-block-end-color', 'border-inline-start-color', 'border-inline-end-color'].includes(p)), `${tag}: revelado intermedio ${R_.midInk} con transiciones ${R_.tr}`)
      ck(R_.finalInk === 1 && R_.anims === 0 && R_.tail <= 400, `${tag}: revelado no termina en tinta plena o deja animaciones (${R_.anims}, cola ${R_.tail} ms)`)
      ck(R_.leftAtEnd === 0, `${tag}: hallazgo 8: al quitar is-revealing siguen ${R_.leftAtEnd} transiciones de color durante ${R_.tail} ms (el revelado terminó con el primer transitionend)`)
    }
    // Hallazgo 6: items null y loading true en el mismo ciclo (lo natural al cambiar de entidad)
    const st = await ev(async () => { const { sleep, $, settle } = window.__lib; window.A.sameTick(900); await sleep(400); const c = $('#r-list').className, aria = $('#r-list .g-load-region__body').getAttribute('aria-hidden'); await settle($('#r-list')); return { c, aria } })
    data.sameTick = st
    ck(/is-mold/.test(st.c) && !/is-stale/.test(st.c) && st.aria === 'true', `hallazgo 6: items null y loading true en el mismo ciclo debe dar el molde de la muestra (A), no un refresco B con lo anterior → «${st.c.replace('g-load-region ', '')}»`)
    await load(page, '?theme=auditoria')
  }

  /* ---------- 4 · B: lo último conocido, «Nueva», fallo que conserva ---------- */
  if (run(4)) {
    const B = await ev(async () => {
      const { sleep, until, $, R, len, clearLive, live } = window.__lib
      const A = window.A, r = $('#r-list'), out = {}
      clearLive()
      const t0 = getComputedStyle($('#r-list .row-title')).color
      A.s.withNew = true
      A.refresh('list', 900, 'data')
      await sleep(80)
      out.pend = { inert: $('#r-list .g-load-region__body').hasAttribute('inert'), busy: r.getAttribute('aria-busy'), stale: r.classList.contains('is-stale'), cursor: getComputedStyle(r).cursor }
      await sleep(250)
      const rr = R(r), pill = r.querySelector('.g-load-region__pill'), pr = R(pill), fb = getComputedStyle(r, '::before')
      out.on = { stale: r.classList.contains('is-stale'), filoH: parseFloat(fb.height), bw: len('var(--g-border-width)'), s4: len('var(--g-space-4)'), pillMid: (pr.top + pr.bottom) / 2 - rr.top, pillEnd: rr.right - pr.right, pillHidden: pill.getAttribute('aria-hidden'), pillText: pill.textContent.trim(), color: getComputedStyle($('#r-list .row-title')).color === t0, filter: getComputedStyle($('#r-list .g-load-region__body')).filter }
      const heights0 = [...r.querySelectorAll('.row')].map((n) => R(n).height)
      await window.__lib.settle(r)
      const fresh = [...r.querySelectorAll('[data-g-fresh]')]
      const fr = fresh[0], fcs = fr && getComputedStyle(fr, '::before')
      out.arrive = { fresh: fresh.map((n) => n.getAttribute('data-g-key')), mW: fcs && parseFloat(fcs.width), mLeft: fr && (R(fr).left + parseFloat(fcs.left)) - R(fr).left, badge: fr && fr.querySelector('.g-badge')?.textContent, heights: [...r.querySelectorAll('.row')].map((n) => R(n).height), h0: heights0, live: live() }
      // Fallo con lo conocido: se queda, usable, con la barra antes del cuerpo
      clearLive()
      const bodyTop0 = R($('#r-list .g-load-region__body')).top
      A.refresh('list', 300, 'error')
      await window.__lib.settle(r)
      const bar = r.querySelector(':scope > .g-load-region__failed')
      out.fail = { cls: r.classList.contains('is-failed'), first: r.firstElementChild === bar, rows: r.querySelectorAll('.row').length, inert: $('#r-list .g-load-region__body').hasAttribute('inert'), push: R($('#r-list .g-load-region__body')).top - bodyTop0, barH: bar && R(bar).height, live: live(), fresh: r.querySelectorAll('[data-g-fresh]').length }
      A.refresh('list', 900, 'data')
      await sleep(400)
      out.fail.duringNext = !!r.querySelector('.g-load-region__failed')
      await window.__lib.settle(r)
      A.s.withNew = false
      A.refresh('list', 100, 'data'); await sleep(300)
      return out
    })
    data.B = B
    ck(B.pend.inert && B.pend.busy === 'true' && !B.pend.stale && B.pend.cursor === 'progress', `B: dentro del retraso, inerte ${B.pend.inert}, aria-busy ${B.pend.busy}, is-stale ${B.pend.stale}, cursor ${B.pend.cursor}`)
    ck(B.on.stale && near(B.on.filoH, B.on.bw * 2), `B: filo de ${B.on.filoH} (2 × ${B.on.bw})`)
    ck(near(B.on.pillMid, 0, 1) && near(B.on.pillEnd, B.on.s4, 1) && B.on.pillHidden === 'true' && B.on.pillText === 'Actualizando', `B: píldora centro ${B.on.pillMid}, fin ${B.on.pillEnd}`)
    ck(B.on.color && B.on.filter === 'none', 'B: lo de antes cambia de color o lleva filtro')
    ck(B.arrive.fresh.join() === 'm11' && near(B.arrive.mW, B.on.bw * 3) && near(B.arrive.mLeft, 0) && B.arrive.badge === 'Nueva', `«Nueva»: ${JSON.stringify(B.arrive).slice(0, 200)}`)
    ck(B.arrive.heights.every((x) => near(x, B.arrive.heights[1])), 'lo nuevo cambia la caja de la fila: ' + B.arrive.heights)
    ck(B.arrive.live.join('|') === 'Cargando muestras.|5 muestras, 1 nueva.', 'B: anuncios ' + B.arrive.live)
    ck(B.fail.cls && B.fail.first && B.fail.rows === 5 && !B.fail.inert, `fallo: conserva ${B.fail.rows}, barra primera ${B.fail.first}, inerte ${B.fail.inert}`)
    ck(B.fail.live.join('|') === 'Cargando muestras.|No se pudo actualizar. Lo que ves es lo último que llegó.', 'fallo: anuncios ' + B.fail.live)
    ck(!B.fail.duringNext, 'la barra de fallo se pinta durante la siguiente carga')
    data.failPush = [Math.round(B.fail.push * 10) / 10, Math.round(B.fail.barH * 10) / 10]
  }

  /* ---------- 5 · GEmpty en la región: cuatro causas, primer hueco, salida con cuentas, foco ---------- */
  if (run(5)) {
    const G = await ev(async () => {
      const { sleep, until, $, R, clearLive, live } = window.__lib
      const A = window.A, r = $('#r-list'), out = {}
      const slot = () => parseFloat(r.style.getPropertyValue('--_load-slot'))
      const rowH = R(r.querySelector('[data-g-key]')).height
      for (const out_ of ['none', 'forbidden', 'error']) {
        clearLive()
        A.refresh('list', 250, out_)
        await window.__lib.settle(r)
        const e = r.querySelector('.g-empty')
        out[out_] = { id: e && e.id, h: e && R(e).height, min: e && parseFloat(getComputedStyle(e).minBlockSize), slot: slot(), rowH, live: live() }
      }
      // Por filtro: la salida con cuentas; se quita un filtro con el teclado
      clearLive()
      A.setFilters(['urg', 'closed'])
      A.refresh('list', 250, 'data')
      await window.__lib.settle(r)
      const e = $('#le-filtered')
      const txt = R(e.querySelector('.g-empty__text')), act = R(e.querySelector('.g-empty__actions'))
      out.filtered = { live: live(), trace: e.querySelector('.g-empty__trace').textContent, btns: [...e.querySelectorAll('.g-btn')].map((b) => b.textContent.trim()), alignStart: act.left - txt.left, below: act.top - txt.bottom }
      return out
    })
    data.G = G
    for (const [k, title] of [['none', 'Aún no hay muestras'], ['forbidden', 'No tienes permiso para ver estas muestras'], ['error', 'No se pudieron cargar las muestras']]) {
      const g = G[k]
      ck(g.id === 'le-' + k, `vacío ${k}: no se pintó (${g.id})`)
      ck(near(g.slot, g.rowH, 0.6) && near(g.min, g.slot, 0.6), `vacío ${k}: --_load-slot ${g.slot} ≠ fila ${g.rowH} o mínimo ${g.min}`)
      ck(g.live.join('|') === 'Cargando muestras.|' + title, `vacío ${k}: anuncios ${g.live}`)
    }
    // Primer hueco (hallazgo 3): título + descripción (+ acciones en la fila) = un elemento
    ck(near(G.none.h, G.none.slot, 0.6) && near(G.forbidden.h, G.forbidden.slot, 0.6) && near(G.error.h, G.error.slot, 0.6), `primer hueco: ${G.none.h} / ${G.forbidden.h} / ${G.error.h} frente a un elemento de ${G.none.slot}`)
    ck(G.filtered.live.join('|') === 'Cargando muestras.|Ninguna muestra con estos filtros', 'filtrado: anuncios ' + G.filtered.live)
    ck(G.filtered.trace === 'Antes había 4; con Urgentes y Cerradas, ninguna.', 'filtrado: traza ' + G.filtered.trace)
    ck(G.filtered.btns.length === 2 && G.filtered.btns[0].startsWith('Quitar «Cerradas»2') && G.filtered.btns[1] === 'Quitar todos', 'filtrado: salida ' + G.filtered.btns)
    ck(near(G.filtered.alignStart, 0) && G.filtered.below >= 0, `filtrado: salida no va debajo del texto y alineada (${G.filtered.alignStart}, ${G.filtered.below})`)
    // Quitar «Cerradas» con el teclado: el vacío se va con el foco dentro → la región lo recoge, nunca body
    await page.keyboard.press('Shift')
    await page.locator('#le-filtered .g-empty__relax').focus()
    await page.keyboard.press('Enter')
    const f = await ev(async () => {
      const { raf2, $ } = window.__lib
      const seen = []
      for (let i = 0; i < 6; i++) { await raf2(); const a = document.activeElement; seen.push(a === document.body ? 'body' : a.id || a.className) }
      return { seen, rows: $('#r-list').querySelectorAll('.row').length, ev: window.__ev.at(-1), ring: getComputedStyle($('#r-list')).outlineStyle }
    })
    ck(f.ev.name === 'relax' && f.ev.payload === 'closed', 'relax: evento ' + JSON.stringify(f.ev))
    ck(f.seen.every((x) => x === 'r-list') && f.rows === 2, `relax por teclado: foco ${f.seen} (filas ${f.rows})`)
    data.relaxRing = data.relaxRing || {}; data.relaxRing[engine] = f.ring
    ck(f.ring === 'solid', 'raíz que recoge el foco del vacío sin anillo: ' + f.ring)
    await ev(async () => { window.A.setFilters([]); window.A.refresh('list', 100, 'data'); await window.__lib.sleep(300) })
  }

  /* ---------- 6 · Foco por clave, nunca en body; «Reintentar» por teclado ---------- */
  if (run(6)) {
    await page.keyboard.press('Shift')
    await page.locator('#r-list [data-g-key="m8"] a').focus()
    const F = await ev(async () => {
      const { sleep, until, $, timeline } = window.__lib
      const A = window.A, r = $('#r-list')
      const tl = timeline('#r-list')
      A.refresh('list', 900, 'data')
      await sleep(60)
      const during = document.activeElement === r, ring = getComputedStyle(r).outlineStyle
      await window.__lib.settle(r); tl.end()
      const a = document.activeElement
      return { during, ring, back: a.closest('[data-g-key]')?.getAttribute('data-g-key') + ':' + a.tagName, body: tl.focus.includes('body'), focus: [...new Set(tl.focus)] }
    })
    ck(F.during && F.back === 'm8:A' && !F.body, `foco por clave: durante ${F.during}, vuelve a ${F.back}, pasó por body ${F.body} (${F.focus})`)
    data.focusRing = data.focusRing || {}; data.focusRing[engine] = F.ring
    ck(F.ring === 'solid', 'foco por programa en la raíz tras teclado sin anillo: ' + F.ring)
    // Reintentar por teclado en la barra de fallo
    await ev(async () => { const { until, sleep, $ } = window.__lib; window.A.refresh('list', 300, 'error'); await until(() => $('#r-list .g-load-region__failed'), 3000); await sleep(100) })
    await page.locator('#r-list .g-load-region__failed .g-btn').focus()
    await page.keyboard.press('Enter')
    const Rt = await ev(async () => {
      const { sleep, until, $, timeline } = window.__lib
      const r = $('#r-list'), tl = timeline('#r-list')
      await sleep(80)
      const during = document.activeElement === r
      await window.__lib.settle(r); tl.end()
      return { during, after: document.activeElement === r, body: tl.focus.includes('body'), ev: window.__ev.at(-1) }
    })
    ck(Rt.ev.name === 'retry' && Rt.during && Rt.after && !Rt.body, `«Reintentar» por teclado: raíz durante ${Rt.during}, después ${Rt.after}, body ${Rt.body}`)
    // La carga nunca roba el foco: «Refrescar la lista» lo conserva
    await page.locator('#go-refresh').focus()
    const keep = await ev(async () => { const { sleep, until, $ } = window.__lib; window.A.s.lat = 900; $('#go-refresh').click(); await sleep(300); const a1 = document.activeElement.id; await until(() => !$('#r-list').classList.contains('is-busy'), 3000); await sleep(100); return [a1, document.activeElement.id] })
    ck(keep.every((x) => x === 'go-refresh'), 'la carga roba el foco: ' + keep)
  }

  /* ---------- 7 · Anuncios: fusión, grupo, ≤ 3 por carga, diálogo modal ---------- */
  if (run(7)) {
    const An = await ev(async () => {
      const { sleep, until, $, clearLive } = window.__lib
      const A = window.A, out = {}
      clearLive()
      A.first(100)
      await sleep(700)
      out.fast = window.__live.map((x) => x.text)
      clearLive()
      A.first(900)
      await sleep(2400)
      out.slow = window.__live.map((x) => ({ t: x.t, text: x.text }))
      clearLive()
      A.openDialog()
      await sleep(1500)
      out.dlg = window.__live.map((x) => ({ text: x.text, inDialog: x.inDialog }))
      out.dlgParent = document.querySelector('.g-load-live').parentElement.tagName
      document.querySelector('dialog[open]').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
      A.s.dlgOpen = false
      await sleep(400)
      out.after = [document.querySelector('.g-load-live').parentElement.tagName, document.querySelectorAll('.g-load-live').length]
      return out
    })
    data.An = An
    ck(!An.fast.some((t) => /Cargando/.test(t)), '100 ms: se anunció el inicio: ' + An.fast)
    const s0 = An.slow[0]
    ck(s0 && ['Cargando muestras.', 'Cargando el lote.', 'جار التحميل.', 'Cargando el panel.'].every((x) => s0.text.includes(x)) && s0.t >= 0, 'fusión: el inicio de cuatro regiones no sale en una escritura: ' + JSON.stringify(An.slow[0]))
    const all = An.slow.map((x) => x.text).join(' ')
    ck(!/Cargada\.|Cargando\. /.test(all) && (all.match(/Panel actualizado\./g) || []).length === 1, 'grupo: hablan las teselas o el grupo repite: ' + all)
    ck(['4 muestras.', 'Lote cargado.', '2 عينات.'].every((x) => all.includes(x)), 'fin de cada región: ' + all)
    ck(An.slow.length <= 6, 'escrituras de una primera carga de seis regiones: ' + An.slow.length)
    ck(An.dlg.some((x) => x.text === 'Cargando el historial.' && x.inDialog) && An.dlg.some((x) => x.text === '3 movimientos.' && x.inDialog) && An.dlgParent === 'DIALOG', 'diálogo: el canal no se trasladó ' + JSON.stringify(An.dlg))
    ck(An.after[0] === 'BODY' && An.after[1] === 1, 'diálogo cerrado: el canal no vuelve a body ' + An.after)
  }

  /* ---------- 8 · GTable con el motor común ---------- */
  if (run(8)) {
    const Tb = await ev(async () => {
      const { sleep, until, $, R, timeline, anims } = window.__lib
      const A = window.A, root = $('#t-main .g-table') || $('#t-main'), out = {}
      const g = $('#t-main').classList.contains('g-table') ? $('#t-main') : $('#t-main .g-table')
      const sk = () => g.querySelectorAll('.g-table__skeleton').length
      const rowsH = () => [...g.querySelectorAll('tbody tr')].map((n) => R(n).height)
      window.__tlive.length = 0
      const h0 = R(g).height, after0 = R($('#t-main-after')).top, realH = rowsH()
      // 150 ms: las filas siguen a la vista e inertes; no se ve el esqueleto ni se anuncia el inicio
      const srNode = g.querySelector(':scope > .g-table__sr[aria-live]')
      let muts = 0
      const mo = new MutationObserver((l) => { muts += l.length })
      mo.observe(srNode, { subtree: true, childList: true, characterData: true })
      A.table(150, 'data')
      let sawSk = false
      await sleep(60)
      out.fast = { inert: g.querySelector('tbody').hasAttribute('inert'), rows: g.querySelectorAll('tbody tr').length, busy: g.querySelector('table').getAttribute('aria-busy') }
      const t0 = performance.now(); while (performance.now() - t0 < 400) { if (sk() && getComputedStyle(g.querySelector('tbody tr')).visibility !== 'hidden') sawSk = true; await new Promise((r) => requestAnimationFrame(r)) }
      out.fast.sawSk = sawSk; out.fast.live = window.__tlive.map((x) => x.text); out.fast.muts = muts; out.fast.text = srNode.textContent; mo.disconnect()
      // 250 ms: se ve a los 200 y se queda 400; el esqueleto con tantas filas como había, del alto de la fila
      window.__tlive.length = 0
      const tl = { t0: performance.now(), on: null, off: null }
      A.table(250, 'data')
      while (performance.now() - tl.t0 < 1500) {
        const vis = sk() > 0 && getComputedStyle(g.querySelector('tbody tr')).visibility !== 'hidden'
        if (vis && tl.on === null) { tl.on = performance.now() - tl.t0; out.sk = { n: sk(), h: rowsH(), tableH: R(g).height - h0, after: R($('#t-main-after')).top - after0, anims: anims(g).length } }
        if (!vis && tl.on !== null && tl.off === null) tl.off = performance.now() - tl.t0
        await new Promise((r) => requestAnimationFrame(r))
      }
      out.min = tl; out.minLive = window.__tlive.map((x) => x.text); out.realH = realH
      // 6000 ms: espera larga al pie sin mover nada
      window.__tlive.length = 0
      A.table(6000, 'data')
      await until(() => g.classList.contains('is-slow'), 7000); await sleep(100)
      const ts = g.querySelector('.g-table__slow')
      out.slow = { disp: getComputedStyle(ts).display, h: R(g).height - h0, after: R($('#t-main-after')).top - after0, anims: anims(g).length }
      await until(() => !g.classList.contains('is-loading') && !g.querySelector('.g-table__skeleton'), 3000); await sleep(150)
      out.slow.live = window.__tlive.map((x) => x.text)
      // Error con filas: barra antes del área, filas usables; con announceError false, sin anuncio
      for (const ann of [true, false]) {
        A.s.tb.announceError = ann
        window.__tlive.length = 0
        A.table(300, 'error')
        await sleep(50)
        await until(() => !g.classList.contains('is-loading') && !g.querySelector('.g-table__skeleton') && g.querySelector('.g-table__failed'), 3000); await sleep(150)
        const fb = g.querySelector('.g-table__failed')
        out['err' + ann] = { before: fb.nextElementSibling && fb.nextElementSibling.classList.contains('g-table__scroll'), rows: g.querySelectorAll('tbody tr.g-table__row').length, inert: g.querySelector('tbody').hasAttribute('inert'), live: window.__tlive.map((x) => x.text) }
      }
      A.s.tb.announceError = true
      // Vacío con GEmpty; error sin filas con GEmpty cause="error"
      A.table(100, 'empty'); await sleep(400)
      const ee = g.querySelector('td.g-table__empty > .g-empty')
      out.empty = ee && { cls: ee.className, title: ee.querySelector('.g-empty__title').textContent, min: getComputedStyle(ee).minBlockSize, td: getComputedStyle(ee.parentElement).textAlign }
      A.table(300, 'error'); await until(() => g.querySelector('td.g-table__empty .g-empty--cause-error'), 3000); await sleep(100)
      const er = g.querySelector('td.g-table__empty .g-empty--cause-error')
      out.emptyErr = er && { btn: er.querySelector('.g-btn')?.textContent.trim(), bar: !!g.querySelector('.g-table__failed') }
      A.table(100, 'data'); await sleep(400)
      // Fila compuesta con avatar frente a su esqueleto (límite #543)
      const c = $('#t-comp').classList.contains('g-table') ? $('#t-comp') : $('#t-comp .g-table')
      const ch = R(c.querySelector('tbody tr')).height
      A.tableComp(900); await sleep(400)
      out.comp = [ch, R(c.querySelector('tbody tr')).height]
      await sleep(900)
      return out
    })
    data.Tb = Tb
    ck(Tb.fast.inert && Tb.fast.rows === 5 && Tb.fast.busy === 'true' && !Tb.fast.sawSk, `tabla 150 ms: filas inertes ${Tb.fast.inert} (${Tb.fast.rows}), esqueleto visto ${Tb.fast.sawSk}`)
    // Hallazgo 7: una recarga que no se ve y acaba con el mismo recuento no cambia el texto de la región viva de la tabla
    ck(Tb.fast.muts > 0, `hallazgo 7: GTable, recarga de 150 ms con el mismo recuento: la región viva no cambia («${Tb.fast.text}», ${Tb.fast.muts} mutaciones) y no se anuncia el final`)
    ck(Tb.fast.live.join('|') === '5 clientes', 'tabla 150 ms: anuncios ' + Tb.fast.live)
    ck(Tb.min.on >= 185 && Tb.min.on <= 300 && Tb.min.off - Tb.min.on >= 390, `tabla 250 ms: esqueleto de ${Math.round(Tb.min.on)} a ${Math.round(Tb.min.off)}`)
    ck(Tb.sk && Tb.sk.n === 15 && Tb.sk.h.length === 5 && Tb.sk.h.every((x, i) => near(x, Tb.realH[i], 0.6)), `tabla: esqueleto ${Tb.sk && Tb.sk.n} barras, filas ${Tb.sk && Tb.sk.h} frente a ${Tb.realH}`)
    ck(Tb.sk && near(Tb.sk.tableH, 0, 0.6) && near(Tb.sk.after, 0, 0.6) && Tb.sk.anims === 0, `tabla: el esqueleto mueve ${Tb.sk && Tb.sk.tableH} / ${Tb.sk && Tb.sk.after} o anima (${Tb.sk && Tb.sk.anims})`)
    ck(Tb.minLive.join('|') === 'Cargando clientes…|5 clientes', 'tabla 250 ms: anuncios ' + Tb.minLive)
    ck(Tb.slow.disp !== 'none' && near(Tb.slow.h, 0, 0.6) && near(Tb.slow.after, 0, 0.6) && Tb.slow.anims === 0, `tabla 6 s: ${JSON.stringify(Tb.slow)}`)
    ck(Tb.slow.live.join('|') === 'Cargando clientes…|Sigue cargando clientes…|5 clientes', 'tabla 6 s: anuncios ' + Tb.slow.live)
    ck(Tb.errtrue.before && Tb.errtrue.rows === 5 && !Tb.errtrue.inert && Tb.errtrue.live.at(-1) === 'No se pudieron cargar los clientes.', 'tabla: error con filas ' + JSON.stringify(Tb.errtrue))
    ck(!Tb.errfalse.live.includes('No se pudieron cargar los clientes.'), 'tabla: announceError false anuncia el fallo ' + Tb.errfalse.live)
    ck(Tb.empty && /cause-none/.test(Tb.empty.cls) && Tb.empty.title === 'Aún no hay clientes.' && /auto|0px/.test(Tb.empty.min) && Tb.empty.td === 'start', 'tabla: vacío con GEmpty ' + JSON.stringify(Tb.empty))
    ck(Tb.emptyErr && Tb.emptyErr.btn === 'Reintentar' && !Tb.emptyErr.bar, 'tabla: error sin filas ' + JSON.stringify(Tb.emptyErr))
    data.comp = Tb.comp
    // Foco por rowKey
    await page.keyboard.press('Shift')
    await page.locator('#t-main tbody tr:nth-child(3) input[type=checkbox]').focus()
    const tf = await ev(async () => {
      const { sleep, until, $ } = window.__lib
      const g = $('#t-main').classList.contains('g-table') ? $('#t-main') : $('#t-main .g-table')
      const label0 = document.activeElement.getAttribute('aria-label')
      window.A.table(900, 'reorder')
      await sleep(100)
      const during = document.activeElement === g.querySelector('table')
      let body = false
      const t = performance.now(); while (performance.now() - t < 1500) { if (document.activeElement === document.body) body = true; await new Promise((r) => requestAnimationFrame(r)) }
      return { label0, during, back: document.activeElement.getAttribute('aria-label'), body, ring: getComputedStyle(g.querySelector('table')).outlineStyle }
    })
    ck(tf.during && tf.back === tf.label0 && !tf.body, `tabla: foco por rowKey ${JSON.stringify(tf)}`)
  }

  /* ---------- 9 · Contraste en 28 configuraciones (páginas en paralelo) ---------- */
  if (run(9)) {
    const configs = THEMES.flatMap((t) => [[t, false], [t, true]])
    const results = {}
    for (let i = 0; i < configs.length; i += 7) {
      await Promise.all(configs.slice(i, i + 7).map(async ([t, dark]) => {
        const p = await ctx.newPage()
        consoleOf(p, errors, `contraste ${t || 'defecto'}${dark ? ' oscuro' : ''}`)
        await load(p, `?manual=1&theme=${t}${dark ? '&dark=1' : ''}`)
        await p.evaluate(async () => { const A = window.A; A.first(100); A.table(100); A.tableComp(100); await window.__lib.sleep(500) })
        results[`${t || 'defecto'}${dark ? ' oscuro' : ' claro'}`] = await contrast(p)
        await p.close()
      }))
    }
    const mins = {}
    for (const [cfg, list] of Object.entries(results)) for (const x of list) {
      ck(x.r >= x.min && (x.max === undefined || x.r <= x.max), `contraste ${cfg}: ${x.k} = ${x.r} (exigido ${x.min}${x.max !== undefined ? '–' + x.max : ''})`)
      const m = (mins[x.k] = mins[x.k] || { min: Infinity, cfg: {} })
      if (x.r < m.min) m.min = x.r
      if (/^(defecto|auditoria|propio) /.test(cfg)) m.cfg[cfg] = Math.min(m.cfg[cfg] ?? Infinity, x.r)
    }
    data.contrast = data.contrast || {}
    data.contrast[engine] = mins
  }

  /* ---------- 10 · Movimiento reducido ---------- */
  if (run(10)) {
    const c2 = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' })
    const p2 = await c2.newPage()
    consoleOf(p2, errors, 'reducido')
    await load(p2, '?theme=auditoria')
    const m = await p2.evaluate(async () => {
      const { sleep, until, $, anims, dur, timeline } = window.__lib
      const r = $('#r-list'), tl = timeline('#r-list')
      window.A.s.list.items = null
      await sleep(30)
      window.A.refresh('list', 900, 'data')
      await until(() => r.classList.contains('is-revealing'), 3000)
      await sleep(10)
      const a = anims(r)
      const d = Math.max(...a.map((x) => x.effect.getTiming().duration))
      await until(() => !r.classList.contains('is-mold'), 2000)
      const leftAtEnd = anims(r).length
      await until(() => anims(r).length === 0, 1000); await sleep(50); tl.end()
      const on = tl.first((c) => c.includes('is-revealing')), i = tl.log.findIndex((x) => x.c.includes('is-revealing'))
      return { n: a.length, d, fast: dur('--g-duration-fast'), span: tl.log[i + 1].t - on, left: anims(r).length, leftAtEnd }
    })
    data.reduced = m
    ck(m.n > 0 && near(m.d, m.fast, 1) && m.span <= m.fast + 80 + 70 && m.left === 0, `reducido: revelado de ${m.d} ms (fast ${m.fast}), dura ${Math.round(m.span)} ms`)
    await c2.close()
  }

  /* ---------- 11 · RTL ---------- */
  if (run(11)) {
    const Rt = await ev(async () => {
      const { sleep, until, $, R, len } = window.__lib
      const A = window.A, r = $('#r-rtl'), out = {}
      A.s.withNew = true
      A.refresh('rtl', 900)
      await sleep(400)
      const rr = R(r), pr = R(r.querySelector('.g-load-region__pill'))
      out.pill = pr.left - rr.left
      out.s4 = len('var(--g-space-4)')
      await window.__lib.settle(r)
      const fr = r.querySelector('[data-g-fresh]'), fcs = getComputedStyle(fr, '::before')
      out.mark = R(fr).right - (R(fr).left + parseFloat(fcs.left) + parseFloat(fcs.width))
      A.s.rtl.items = null
      await sleep(30)
      A.refresh('rtl', 900)
      await sleep(400)
      const t = r.querySelector('.row-title'), cs = getComputedStyle(t)
      out.mold = [cs.textDecorationLine, cs.direction]
      await until(() => !r.classList.contains('is-mold'), 3000)
      const e = $('#e-rtl'), ic = R(e.querySelector('.g-empty__icon')), tx = R(e.querySelector('.g-empty__text')), ac = R(e.querySelector('.g-empty__actions'))
      out.empty = { iconRight: ic.left > tx.right - 1, align: tx.right - ac.right }
      A.s.withNew = false
      return out
    })
    ck(near(Rt.pill, Rt.s4, 1), `RTL: píldora a ${Rt.pill} del inicio físico (≈ ${Rt.s4})`)
    ck(near(Rt.mark, 0), `RTL: la marca de lo nuevo no va al inicio lógico (derecha): ${Rt.mark}`)
    ck(Rt.mold[0] === 'line-through' && Rt.mold[1] === 'rtl', 'RTL: molde ' + Rt.mold)
    ck(Rt.empty.iconRight && near(Rt.empty.align, 0), 'RTL: vacío ' + JSON.stringify(Rt.empty))
  }

  /* ---------- 12 · Táctil a 390px y 320px ---------- */
  if (run(12)) {
    const opts = engine === 'chromium' ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } : { viewport: { width: 390, height: 844 }, hasTouch: true }
    for (const th of ['', 'auditoria']) {
      const c3 = await browser.newContext(opts)
      const p3 = await c3.newPage()
      consoleOf(p3, errors, 'táctil')
      await load(p3, '?theme=' + th)
      const coarse = await p3.evaluate(() => matchMedia('(pointer: coarse)').matches)
      if (!coarse) { notes.push(`[${engine}] pointer: coarse no se emula; táctil sin medir`); await c3.close(); break }
      const t = await p3.evaluate(async () => {
        const { sleep, until, $ } = window.__lib
        window.A.refresh('detail', 300, 'error'); window.A.table(300, 'error')
        await until(() => $('#r-detail .g-load-region__failed') && $('#t-main .g-table__failed'), 3000); await sleep(100)
        const areas = []
        for (const b of document.querySelectorAll('.g-empty .g-btn, .g-load-region__failed .g-btn, .g-table__failed .g-btn')) {
          const r = b.getBoundingClientRect(), a = getComputedStyle(b, '::after')
          const w = parseFloat(a.width), hh = parseFloat(a.height)
          areas.push({ name: (b.closest('[id]')?.id || '') + ':' + b.textContent.trim().slice(0, 14) + ':' + Math.round(r.height), box: { l: r.left + r.width / 2 - w / 2, r: r.left + r.width / 2 + w / 2, t: r.top + r.height / 2 - hh / 2, bo: r.top + r.height / 2 + hh / 2 }, min: Math.min(w, hh) })
        }
        let overlap = 0
        const pairs = []
        for (let i = 0; i < areas.length; i++) for (let j = i + 1; j < areas.length; j++) {
          const A = areas[i].box, B = areas[j].box
          if (A.l < B.r - 0.5 && B.l < A.r - 0.5 && A.t < B.bo - 0.5 && B.t < A.bo - 0.5) { overlap++; pairs.push(areas[i].name + ' × ' + areas[j].name + ' ' + Math.round(Math.min(A.bo - B.t, B.bo - A.t))) }
        }
        return { n: areas.length, min: Math.min(...areas.map((a) => a.min)), overlap, pairs, sw: document.documentElement.scrollWidth, vw: innerWidth }
      })
      ck(t.n >= 12 && t.min >= 44, `táctil ${th || 'defecto'}: área mínima ${t.min} (${t.n} botones)`)
      ck(t.overlap === 0, `táctil ${th || 'defecto'}: ${t.overlap} áreas de 44 se solapan: ${t.pairs.join(' | ')}`)
      ck(t.sw <= t.vw, `390px ${th || 'defecto'}: la página desborda ${t.sw} > ${t.vw}`)
      await c3.close()
    }
    // 320px (zoom 400 % de 1280): nada sale de su vacío ni de la página
    for (const th of ['', 'auditoria']) {
      const c4 = await browser.newContext({ viewport: { width: 320, height: 700 } })
      const p4 = await c4.newPage()
      consoleOf(p4, errors, '320px')
      await load(p4, '?theme=' + th)
      const z = await p4.evaluate(() => {
        let out = 0
        for (const e of document.querySelectorAll('.g-empty')) { const r = e.getBoundingClientRect(); for (const n of e.querySelectorAll('*')) { const x = n.getBoundingClientRect(); if (x.width && (x.left < r.left - 0.5 || x.right > r.right + 0.5) && !n.classList.contains('g-empty__sr') && !n.closest('.g-empty__sr')) out++ } }
        return { out, sw: document.documentElement.scrollWidth, vw: innerWidth }
      })
      ck(z.out === 0 && z.sw <= z.vw, `320px ${th || 'defecto'}: ${z.out} piezas fuera de su vacío, página ${z.sw}/${z.vw}`)
      await c4.close()
    }
  }

  /* ---------- 13 · Colores forzados (Chromium) ---------- */
  if (run(13) && engine === 'chromium') {
    const c5 = await browser.newContext({ viewport: { width: 1280, height: 900 }, forcedColors: 'active' })
    const p5 = await c5.newPage()
    consoleOf(p5, errors, 'forced-colors')
    await load(p5, '?manual=1')
    const f = await p5.evaluate(async () => {
      const { sleep, $ } = window.__lib
      const sys = (n) => { const i = document.createElement('i'); i.style.color = n; i.style.forcedColorAdjust = 'none'; document.body.append(i); const c = getComputedStyle(i).color; i.remove(); return c }
      const A = window.A
      A.first(6000); A.tableComp(6000)
      await sleep(400)
      const t = getComputedStyle($('#r-list .row-title'))
      const out = { tinta: window.__lib.parse(t.color)[3], barra: t.textDecorationColor, kn: getComputedStyle($('#r-t1 [data-g-known] span')).color, tile: getComputedStyle($('#r-t1 .tile')).borderTopColor, sk: getComputedStyle($('#t-comp .g-table__skeleton')).backgroundColor }
      out.em = getComputedStyle($('#e-error')).borderTopColor
      out.hole = getComputedStyle($('#e-error .g-empty__icon')).borderTopColor
      await sleep(5000)
      const sl = $('#r-list .g-load-region__slow')
      out.slowBorder = getComputedStyle(sl).borderTopColor; out.slowText = getComputedStyle(sl).color
      // B a la vista (filo)
      await sleep(1200)
      A.refresh('list', 900, 'data'); await sleep(350)
      out.filo = getComputedStyle($('#r-list'), '::before').backgroundColor
      Object.assign(out, { Gray: sys('GrayText'), Canvas: sys('CanvasText'), High: sys('Highlight') })
      return out
    })
    const C = (m) => ok(m[0], E(m[1]), engine)
    C([f.tinta === 0, 'forced-colors: la muestra del molde se pinta (se leería como dato)'])
    C([f.barra === f.Gray && f.tile === f.Gray && f.sk === f.Gray, `forced-colors: molde o esqueleto fuera de GrayText ${f.barra} ${f.tile} ${f.sk}`])
    C([f.kn === f.Canvas, `forced-colors: data-g-known ${f.kn}`])
    C([f.filo === f.High, `forced-colors: filo ${f.filo}`])
    C([f.em === f.Canvas && f.hole === f.Canvas, `forced-colors: contorno del vacío ${f.em} ${f.hole}`])
    C([f.slowBorder === f.Canvas && f.slowText === f.Canvas, `forced-colors: ficha de la espera larga ${f.slowBorder} ${f.slowText}`])
    await c5.close()
  }

  ck(!errors.length, 'consola: ' + errors.slice(0, 4).join(' | '))
  if (errors.length) notes.push(`[${engine}] consola: ${errors.slice(0, 6).join(' | ')}`)
  await browser.close()
}

server.close()
if (args.verbose || process.env.GRANA_AUDIT_DATA) console.log(JSON.stringify(data, null, 1))
console.log('canal: estilo en línea =', JSON.stringify(data.lvInline ?? null), '· colores de la salida', JSON.stringify(data.btnColors ?? null))
console.log('anillo de la raíz con el foco por programa (carga / quitar un filtro):', JSON.stringify(data.focusRing ?? null), JSON.stringify(data.relaxRing ?? null))
console.log('espera larga (is-slow / setTimeout de referencia / llegada):', JSON.stringify(data.slowAt ?? null))
console.log('ficha, primera carga (muestra → datos) Δ px:', data['detailFirst-auditoria'], '/', data['detailFirst-por defecto'], '· revelado', data.revealDur, 'ms · tabla compuesta (fila / esqueleto):', JSON.stringify(data.comp ?? null), '· barra de fallo empuja', JSON.stringify(data.failPush ?? null))
if (data.contrast) for (const [eng, mins] of Object.entries(data.contrast)) {
  console.log(`\nContraste mínimo (${eng}):`)
  for (const [k, v] of Object.entries(mins)) console.log(`  ${k}: ${v.min}  ·  ${Object.entries(v.cfg).map(([c, r]) => c + ' ' + r).join(', ')}`)
}
for (const n of notes) console.log('· ' + n)
if (fails.length) { console.log('\nFALLOS:'); for (const f of fails.slice(0, 80)) console.log('✗ ' + f) }
for (const [eng, [a, b]] of Object.entries(counts)) console.log(`${eng}: ${a}/${b}`)
console.log(`\n${total - failed}/${total} comprobaciones`)
process.exit(failed ? 1 : 0)
