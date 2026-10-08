// Verificación de coco sobre el banco de GEmpty, GLoadRegion y la carga de GTable (design/lab/empty-skeleton/estilo-banco.html),
// con el CSS real en la capa grana.components sobre los estilos FUENTE de Grana (defaults.css con --g-color-mold y GTable.css
// nuevos) y la fuente servida. Mide: análisis estático de los tres CSS (sin literales de color ni mezclas, sin respaldos, sin
// @layer/@property/keyframes/animation, !important solo en GLoadRegion y solo en reglas del molde, 0.72em como única
// constante en em de la región, transiciones solo de color, #383); --g-color-mold en los tres bloques de defaults.css;
// contraste en 26 temas (por defecto, propio de @grana/cli y los once generados, claro y oscuro): el tono del molde (≥ 1,3 y
// < 3 frente a surface, opaco), textos del vacío, cuenta, píldora, filo, marca de lo nuevo, espera larga, barras de fallo,
// lo conocido en el molde y la espera larga de GTable; lo de antes sin saturación (B) medido por píxeles; geometría (Δ0 del
// molde de lo último conocido y del revelado, molde invisible en el retraso, hojas con barra de 0.72em y sin tinta aunque
// la plantilla declare su color, medios ocultos, data-g-known con tinta, bordes en el tono, filo, píldora sobre el filo al
// final lógico, marca de lo nuevo al inicio lógico sin cambiar la caja, barra de fallo en flujo, espera larga sin mover
// nada, primer hueco = alto de un elemento, anatomía de fila que se parte sin consultas, salida debajo del texto);
// revelado (solo transiciones de color, sin desplazamiento, intermedio y final; reducido en --g-duration-fast);
// GTable (fila esqueleto = fila de una línea, barra en la caja de línea, tono, sin animaciones, retraso invisible, espera
// larga superpuesta sin mover nada, barra al final en columnas finales, barra de fallo, GEmpty en la celda); ninguna
// animación en curso; táctil a 390px (áreas de 44 sin solaparse, sin desborde); forced-colors (Chromium); RTL; consola.
// Ejecutar desde la raíz del repo:  GRANA_PW_PORT=4216 node design/lab/empty-skeleton/estilo-verificar.mjs
// Opcional: --engines=chromium,firefox,webkit  --themes=quick (solo por defecto y propio)
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
await new Promise((r) => server.listen(Number(process.env.GRANA_PW_PORT) || 4216, '127.0.0.1', r))
const BASE = `http://127.0.0.1:${server.address().port}/design/lab/empty-skeleton/estilo-banco.html`

const GEN = ['amazon', 'apple', 'caracol-purpura', 'github', 'grana', 'linear', 'lustre', 'medium', 'notion', 'spotify', 'stripe']
let total = 0, failed = 0
const fails = [], notes = []
const ok = (cond, msg) => { total++; if (!cond) { failed++; fails.push(msg) } }
const near = (a, b, t = 0.5) => Math.abs(a - b) <= t

/* ---------- 0 · Análisis estático ---------- */
{
  const read = async (p) => (await readFile(join(ROOT, p), 'utf8')).replace(/\/\*[\s\S]*?\*\//g, '')
  const files = {
    empty: await read('packages/vue/src/components/GEmpty/GEmpty.css'),
    region: await read('packages/vue/src/components/GLoadRegion/GLoadRegion.css'),
    table: await read('packages/vue/src/components/GTable/GTable.css')
  }
  const defaultsRaw = await readFile(join(ROOT, 'packages/vue/src/styles/defaults.css'), 'utf8')
  const defined = new Set([...defaultsRaw.matchAll(/(--g-[a-z0-9-]+)\s*:/g)].map((m) => m[1]))
  const mold = [...defaultsRaw.matchAll(/--g-color-mold:\s*([^;]+);/g)].map((m) => m[1].trim())
  ok(mold.length === 3 && mold.every((v) => v === 'color-mix(in srgb, var(--g-color-text) 18%, var(--g-color-surface))'), 'defaults.css: --g-color-mold no está en los tres bloques (claro, consulta oscura, [data-theme="dark"]) con la mezcla de §42: ' + mold)
  // Orden: cada declaración de mold va en un bloque que también declara text y surface
  for (const block of defaultsRaw.split(/\n(?=\S)/)) if (/--g-color-mold:/.test(block)) ok(/--g-color-text:/.test(block) && /--g-color-surface:/.test(block), 'defaults.css: --g-color-mold en un bloque sin text o surface')
  for (const [k, css] of Object.entries(files)) {
    const K = (m) => `CSS ${k}: ${m}`
    ok(!/#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|lab|lch|color-mix)\(/.test(css), K('color literal o mezcla'))
    ok(!/var\(\s*--[\w-]+\s*,/.test(css), K('var() con valor de respaldo'))
    ok(!/@layer|@property|@keyframes|(^|[;{\s])animation(-name)?\s*:/.test(css), K('@layer, @property, @keyframes o animation (#539: sin pulsos)'))
    const vars = [...css.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1])
    ok(vars.every((v) => v.startsWith('--g-') || v.startsWith('--_')), K('var() que no es --g-* ni --_*'))
    const missing = [...new Set(vars.filter((v) => v.startsWith('--g-') && !defined.has(v)))]
    ok(!missing.length, K('tokens que no existen en defaults.css ' + missing))
    if (k !== 'table') ok(!/\b(?:transform|translate|scale|rotate)\s*:/.test(css.replace(/translate:\s*0 -50%;/, '')), K('desplazamiento o escala (solo la píldora se centra sobre el filo)'))
  }
  ok(!/!important/.test(files.empty) && !/!important/.test(files.table), 'CSS: !important fuera de GLoadRegion')
  ok(!/g-table-pulse|surface-sunken\);\s*\}\s*@media \(prefers-reduced/.test(files.table), 'GTable: queda el pulso')
  ok(/\.g-table__skeleton \{[^}]*background: var\(--g-color-mold\)/.test(files.table) && /block-size: calc\(1lh - var\(--g-space-2\)\)/.test(files.table), 'GTable: el esqueleto no va en el tono del molde o fuera de la caja de línea')
  // !important: solo en reglas cuyos selectores llevan .is-mold
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
  const em = [...files.region.matchAll(/(\d*\.?\d+)em\b/g)].map((m) => m[0])
  ok(em.length >= 1 && em.every((e) => e === '0.72em'), 'GLoadRegion: medidas en em distintas de 0.72em: ' + em)
  ok([...files.empty.matchAll(/(\d*\.?\d+)em\b/g)].every((m) => m[0] === '1em'), 'GEmpty: medidas en em distintas de 1em')
  const pxOf = (css) => [...css.matchAll(/(-?\d*\.?\d+)px\b/g)].map((m) => m[0])
  ok(pxOf(files.region).length === 0, 'GLoadRegion: medidas en px ' + pxOf(files.region))
  ok(pxOf(files.empty).every((p) => ['1px', '-1px'].includes(p)), 'GEmpty: medidas en px fuera del texto oculto ' + pxOf(files.empty))
  ok(pxOf(files.table).every((p) => ['24px', '44px', '1px', '-1px'].includes(p)), 'GTable: medidas en px no permitidas ' + pxOf(files.table))
  const tr = [...files.region.matchAll(/transition(?:-property)?:\s*([^;]+);/g)].map((m) => m[1])
  const props = tr.flatMap((t) => t.split(',').map((x) => x.trim().split(/\s+/)[0]))
  ok(props.length && props.every((p) => ['color', 'text-decoration-color', 'background-color', 'border-color', 'outline-color', 'box-shadow', 'filter'].includes(p)), 'GLoadRegion: transición de una propiedad que no es de color: ' + props)
  ok(/prefers-reduced-motion: reduce\)[\s\S]*transition-duration: var\(--g-duration-fast\)/.test(files.region), 'GLoadRegion: sin revelado en --g-duration-fast con movimiento reducido')
  const universal = files.region.split(/[{}]/).filter((_, i) => i % 2 === 0).flatMap((s) => s.split(/,(?![^(]*\))/)).map((s) => s.trim()).filter((s) => /__body :where\(\*\)/.test(s) && !/forced/.test(s))
  ok(universal.every((s) => /:not\(:where\(\.g-tooltip, \.g-tooltip \*/.test(s) || /is-pending|forced-color-adjust/.test(s) || /::(before|after)$/.test(s) && /g-tooltip/.test(s)), 'GLoadRegion: regla sobre la plantilla sin excluir .g-tooltip (#383): ' + universal.filter((s) => !/g-tooltip/.test(s) && !/is-pending/.test(s)))
  ok(/@media \(forced-colors: active\)/.test(files.region) && /--_mold: GrayText/.test(files.region) && /forced-color-adjust: none/.test(files.region), 'GLoadRegion: forced-colors sin GrayText ni forced-color-adjust')
  ok(/@media \(forced-colors: active\)[\s\S]*\.g-table__skeleton \{\s*forced-color-adjust: none;\s*background: GrayText;/.test(files.table), 'GTable: forced-colors sin GrayText en el esqueleto')
  ok(/@media \(forced-colors: active\)[\s\S]*border-color: CanvasText/.test(files.empty), 'GEmpty: forced-colors sin CanvasText')
  ok(/min-block-size: var\(--_load-slot\)/.test(files.empty), 'GEmpty: no lee --_load-slot')
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
  const tok = (n, host) => { const i = document.createElement('i'); i.style.color = 'var(' + n + ')'; (host || document.querySelector('.host')).append(i); const c = parse(getComputedStyle(i).color); i.remove(); return c }
  const len = (expr, host) => { const i = document.createElement('i'); i.style.position = 'absolute'; i.style.inlineSize = expr; (host || document.querySelector('.host')).append(i); const v = i.getBoundingClientRect().width; i.remove(); return v }
  const dur = (n) => { const i = document.createElement('i'); i.style.transitionDuration = 'var(' + n + ')'; document.body.append(i); const v = parseFloat(getComputedStyle(i).transitionDuration) * 1000; i.remove(); return v }
  const R = (el) => el.getBoundingClientRect()
  const col = (el, p = 'color') => parse(getComputedStyle(el)[p])
  const B = window.XBench
  const reg = (id) => B.regions.get(id)
  const tab = (id) => B.tables.get(id)
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
  const raf2 = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
  return { parse, over, bgOf, ratio, tok, len, dur, R, col, B, reg, tab, sleep, raf2 }
})()`

async function load(page, qs = '') {
  await page.goto(BASE + qs)
  await page.waitForSelector('html[data-ready="1"]')
  await page.evaluate(LIB)
}

// Contraste de todas las piezas en el tema cargado
const contrast = (page) => page.evaluate(async () => {
  const { parse, over, bgOf, ratio, tok, col, reg, tab, sleep } = window.__lib
  const out = []
  const add = (k, fg, bg, min, max) => out.push({ k, r: ratio(over(fg, bg), bg), min, max })
  // Tono del molde: opaco, frente a surface (regla), bg y surface-sunken (informativo)
  const mold = tok('--g-color-mold'), surf = tok('--g-color-surface')
  out.push({ k: 'molde opaco (alfa)', r: mold[3], min: 1, max: 1.0001 })
  add('molde / surface', mold, surf, 1.3, 3)
  out.push({ k: 'molde / bg (informativo)', r: ratio(mold, over(tok('--g-color-bg'), [255, 255, 255, 1])), min: 0 })
  out.push({ k: 'molde / surface-sunken (informativo)', r: ratio(mold, over(tok('--g-color-surface-sunken'), [255, 255, 255, 1])), min: 0 })
  // GEmpty
  for (const e of document.querySelectorAll('#s1 .g-empty, #s2 .g-empty, #s3 .g-empty')) {
    const t = e.querySelector('.g-empty__title'); add('vacío: título', col(t), bgOf(t), 4.5)
    const d = e.querySelector('.g-empty__description'); if (d) add('vacío: descripción', col(d), bgOf(d), 4.5)
    const tr = e.querySelector('.g-empty__trace'); if (tr) add('vacío: traza', col(tr), bgOf(tr), 4.5)
    for (const c of e.querySelectorAll('.g-empty__count')) add('vacío: cuenta', col(c), bgOf(c), 4.5)
    for (const b of e.querySelectorAll('.g-btn')) add('vacío: botón ' + [...b.classList].find((x) => x.startsWith('g-btn--variant-')).slice(15), col(b), bgOf(b), 4.5)
    const ic = e.querySelector('.g-empty__icon')
    if (e.classList.contains('g-empty--cause-error')) add('vacío: icono de error (informativo ≥ 3)', col(ic), bgOf(ic), 3)
    out.push({ k: 'vacío: contorno discontinuo (decorativo)', r: ratio(over(col(e, 'borderTopColor'), bgOf(e)), bgOf(e)), min: 0 })
  }
  // Región: molde con lo conocido, píldora, filo, marca de lo nuevo, espera larga, barra de fallo
  const t5 = reg('r-tiles'); t5.slow(); await sleep(30)
  const known = t5.root.querySelector('[data-g-known] span'); add('molde: data-g-known', col(known), bgOf(known.closest('.tile-box')), 4.5)
  const slow = t5.root.querySelector('.g-load-region__slow'); add('espera larga', col(slow), bgOf(slow), 4.5)
  t5.idle()
  const r4 = reg('r-list'); r4.stale(); await sleep(200)
  const pill = r4.root.querySelector('.g-load-region__pill'); add('píldora «Actualizando»', col(pill), bgOf(pill), 4.5)
  const filo = parse(getComputedStyle(r4.root, '::before').backgroundColor); add('filo de B / surface', filo, bgOf(r4.root), 3)
  r4.arrive(window.XBench.REAL.list2); await sleep(200)
  const fr = r4.root.querySelector('[data-g-fresh]'); add('marca de lo nuevo / fondo de la fila', parse(getComputedStyle(fr, '::before').backgroundColor), bgOf(fr), 3)
  r4.failed()
  const fb = r4.root.querySelector('.g-load-region__failed')
  add('barra de fallo: texto', col(fb.querySelector('.g-load-region__failed-text')), bgOf(fb), 4.5)
  add('barra de fallo: icono (≥ 3)', col(fb.querySelector('.g-load-region__failed-icon')), bgOf(fb), 3)
  const rb = fb.querySelector('.g-btn'); add('barra de fallo: «Reintentar»', col(rb), bgOf(rb), 4.5)
  r4.S.prev = new Set(window.XBench.REAL.list.map((x) => x.id)); r4.S.known = window.XBench.REAL.list; r4.idle()
  // GTable
  const t9 = tab('t-load'); t9.slow()
  const ts = t9.root.querySelector('.g-table__slow'); add('tabla: espera larga', col(ts), bgOf(ts), 4.5)
  add('tabla: esqueleto / surface (≥ 1,3)', col(t9.root.querySelector('.g-table__skeleton'), 'backgroundColor'), bgOf(t9.root.querySelector('.g-table__skeleton').parentElement), 1.3, 3)
  t9.idle()
  const tf = tab('t-failed').root.querySelector('.g-table__failed')
  add('tabla: barra de fallo, texto', col(tf.querySelector('.g-table__failed-text')), bgOf(tf), 4.5)
  add('tabla: barra de fallo, icono (≥ 3)', col(tf.querySelector('.g-table__failed-icon')), bgOf(tf), 3)
  const tfb = tf.querySelector('.g-btn'); add('tabla: «Reintentar»', col(tfb), bgOf(tfb), 4.5)
  return out
})

// Lo de antes sin saturación: contraste por píxeles de muestras sólidas, en reposo y con is-stale
const PAIRS = [['--g-color-text', '--g-color-surface', 4.5], ['--g-color-text-muted', '--g-color-surface', 4.5], ['--g-color-accent-text', '--g-color-surface', 4.5], ['--g-color-on-neutral-soft', '--g-color-neutral-soft', 4.5], ['--g-color-on-accent-soft', '--g-color-accent-soft', 4.5], ['--g-color-text', '--g-color-neutral-soft', 4.5]]
async function staleContrast(page) {
  const toks = [...new Set(PAIRS.flat().filter((x) => typeof x === 'string'))]
  await page.evaluate((toks) => {
    const host = document.createElement('div'); host.className = 'host'; host.id = 'swhost'; document.querySelector('main').prepend(host)
    window.__sw = window.XBench.region(host, { id: 'r-sw', label: 'muestras', kind: 'swatch', sample: toks, items: toks, labels: {} })
  }, toks)
  const read = async () => {
    const buf = await page.locator('#r-sw').screenshot()
    return page.evaluate(async (b64) => {
      const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode()
      const c = document.createElement('canvas'); c.width = img.width; c.height = img.height
      const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0)
      const r0 = document.getElementById('r-sw').getBoundingClientRect(), k = img.width / r0.width
      const o = {}
      for (const s of document.querySelectorAll('#r-sw .sw')) { const r = s.getBoundingClientRect(); const d = x.getImageData(Math.round((r.left - r0.left + r.width / 2) * k), Math.round((r.top - r0.top + r.height / 2) * k), 1, 1).data; o[s.dataset.tok] = [d[0], d[1], d[2], 1] }
      return o
    }, buf.toString('base64'))
  }
  const before = await read()
  await page.evaluate(() => window.__sw.stale())
  await page.waitForTimeout(350)
  const after = await read()
  const rows = await page.evaluate(({ before, after, PAIRS }) => PAIRS.map(([a, b, min]) => ({ k: `${a.slice(10)} / ${b.slice(10)}`, before: window.__lib.ratio(before[a], before[b]), after: window.__lib.ratio(after[a], after[b]), min })), { before, after, PAIRS })
  await page.evaluate(() => { window.__sw.idle(); document.getElementById('swhost').remove() })
  return rows
}

for (const engine of ENGINES) {
  const browser = await pw[engine].launch()
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await ctx.newPage()
  const errors = []
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()) })
  page.on('pageerror', (e) => errors.push(String(e)))
  const E = (m) => `[${engine}] ${m}`

  /* ---------- 1 · Contraste en 26 temas ---------- */
  const themes = [['por defecto', ''], ['propio', 'theme=propio'], ...(args.themes === 'quick' ? [] : GEN.map((g) => [g, 'theme=' + g]))]
  const mins = {}, maxs = {}, staleMin = {}
  for (const [name, t] of themes) {
    for (const dark of [false, true]) {
      const qs = '?' + [t, dark ? 'dark=1' : ''].filter(Boolean).join('&')
      await load(page, qs)
      const tag = `${name}${dark ? ' oscuro' : ' claro'}`
      for (const r of await contrast(page)) {
        if (r.min) ok(r.r >= r.min && (r.max == null || r.r < r.max), E(`${tag}: ${r.k} ${r.r} fuera de [${r.min}, ${r.max ?? '∞'})`))
        mins[r.k] = Math.min(mins[r.k] ?? 99, r.r); maxs[r.k] = Math.max(maxs[r.k] ?? 0, r.r)
        if (name === 'por defecto') (mins['@' + tag] ||= {})[r.k] = Math.min(mins['@' + tag]?.[r.k] ?? 99, r.r)
      }
      for (const r of await staleContrast(page)) {
        ok(near(r.after, r.before, 0.05), E(`${tag}: lo de antes cambia de contraste al refrescar ${r.k} ${r.before} → ${r.after}`))
        staleMin[r.k] = Math.min(staleMin[r.k] ?? 99, r.after)
        staleMin[r.k + ' Δ'] = Math.max(staleMin[r.k + ' Δ'] ?? 0, +(r.before - r.after).toFixed(2))
      }
    }
  }
  if (engine === ENGINES[0]) {
    notes.push('Contraste, mínimo en ' + themes.length * 2 + ' temas: ' + JSON.stringify(mins, (k, v) => (k.startsWith('@') ? undefined : v)))
    notes.push('Molde / surface, máximo: ' + maxs['molde / surface'])
    for (const k of Object.keys(mins).filter((k) => k.startsWith('@'))) notes.push(k + ': ' + JSON.stringify(mins[k]))
    notes.push('B (píxeles), mínimo y pérdida máxima al refrescar: ' + JSON.stringify(staleMin))
  }

  /* ---------- 2 · Geometría y estados (por defecto claro, oscuro y propio) ---------- */
  for (const qs of ['', '?dark=1', '?theme=propio']) {
    await load(page, qs)
    const T = (m) => E(`${qs || 'por defecto'}: ${m}`)
    const g = await page.evaluate(async () => {
      const { R, col, len, tok, reg, tab, sleep, raf2, parse, dur } = window.__lib
      const o = {}
      const after = (id) => R(document.getElementById(id + 'after')).top
      // Δ0: molde de lo último conocido (replace) y primera carga con muestra, frente al contenido
      for (const [id, a] of [['r-list', 's4'], ['r-tiles', 's5'], ['r-detail', 's6']]) {
        const r = reg(id)
        r.idle(); await raf2()
        const h0 = R(r.root).height, y0 = after(a)
        const leaves0 = [...r.body.querySelectorAll('[data-g-key] *')].map((x) => [R(x).left, R(x).top, R(x).width])
        r.replace(); await raf2()
        const leaves1 = [...r.body.querySelectorAll('[data-g-key] *')].map((x) => [R(x).left, R(x).top, R(x).width])
        o[id + ' replace Δh'] = R(r.root).height - h0
        o[id + ' replace Δ debajo'] = after(a) - y0
        o[id + ' replace piezas movidas'] = leaves0.filter((p, i) => !leaves1[i] || p.some((v, j) => Math.abs(v - leaves1[i][j]) > 0.5)).length
        r.mold(); await raf2()
        o[id + ' muestra Δh'] = R(r.root).height - h0
        r.firstPending(); await raf2()
        o[id + ' retraso Δh'] = R(r.root).height - h0
        o[id + ' retraso visible'] = [...r.body.querySelectorAll('*')].filter((x) => getComputedStyle(x).visibility !== 'hidden').length
        r.slow(); await raf2()
        const sl = r.root.querySelector('.g-load-region__slow')
        o[id + ' espera Δh'] = R(r.root).height - h0
        o[id + ' espera al pie'] = Math.abs(R(sl).bottom - R(r.root).bottom)
        r.idle()
      }
      // Molde: hojas, tinta, medios, conocido, bordes
      const r4 = reg('r-list'); r4.mold(); await raf2()
      const title = r4.body.querySelector('.row-title'), main = r4.body.querySelector('.row-main'), av = r4.body.querySelector('.row-av')
      const cs = getComputedStyle(title)
      o.hojaBarra = cs.textDecorationLine
      o.hojaGrosor = parseFloat(cs.textDecorationThickness) / parseFloat(cs.fontSize)
      o.hojaTinta = parse(cs.color)[3]
      o.hojaColorBarra = cs.textDecorationColor
      o.molde = getComputedStyle(r4.root).getPropertyValue('--_mold').trim()
      o.toneProbe = (() => { const i = document.createElement('i'); i.style.color = 'var(--g-color-mold)'; r4.root.append(i); const c = getComputedStyle(i).color; i.remove(); return c })()
      o.contenedorBarra = getComputedStyle(main).textDecorationLine
      o.avFondo = parse(getComputedStyle(av).backgroundColor)[3]
      o.avBorde = getComputedStyle(av).borderTopColor
      o.inert = r4.body.inert && r4.body.getAttribute('aria-hidden') === 'true'
      o.enfocables = r4.body.querySelectorAll('a[href], button, input').length
      const r6 = reg('r-detail'); r6.mold(); await raf2()
      o.img = getComputedStyle(r6.body.querySelector('img')).visibility
      const r5 = reg('r-tiles'); r5.mold(); await raf2()
      const kn = r5.body.querySelector('[data-g-known]')
      o.conocidoColor = getComputedStyle(kn.querySelector('span')).color
      o.textMuted = (() => { const i = document.createElement('i'); i.style.color = 'var(--g-color-text-muted)'; r5.root.append(i); const c = getComputedStyle(i).color; i.remove(); return c })()
      o.conocidoBarra = getComputedStyle(kn.querySelector('span')).textDecorationLine
      o.conocidoIcono = getComputedStyle(kn.querySelector('svg')).visibility
      const tb = r5.body.querySelector('.tile-box')
      o.teselaBorde = getComputedStyle(tb).borderTopColor
      o.teselaSombra = getComputedStyle(tb).boxShadow
      const value = r5.body.querySelector('.tile-value')
      o.valorTinta = parse(getComputedStyle(value).color)[3]
      r4.idle(); r5.idle(); r6.idle()
      // Revelado: solo color, sin moverse, intermedio y final
      await raf2()
      const pos0 = [...r4.body.querySelectorAll('[data-g-key] *')].map((x) => [R(x).left, R(x).top])
      const p = r4.reveal()
      await p
      await sleep(60)
      const tt = r4.body.querySelector('.row-title')
      o.revMedio = parse(getComputedStyle(tt).color)[3]
      o.revBarraMedio = (() => { const v = getComputedStyle(tt).textDecorationColor, m = v.match(/\/\s*([\d.]+)\s*\)$/); return m ? +m[1] : /^rgba?\(/.test(v) ? parse(v)[3] : 1 })()
      const anims = document.getAnimations().filter((a) => r4.root.contains(a.effect.target))
      o.revTransiciones = [...new Set(anims.map((a) => a.transitionProperty || ('animación ' + a.animationName)))]
      o.revSoloTransiciones = anims.every((a) => a.constructor.name === 'CSSTransition')
      o.revDur = Math.max(...anims.map((a) => a.effect.getTiming().duration))
      o.slowTok = dur('--g-duration-slow'); o.fastTok = dur('--g-duration-fast')
      const pos1 = [...r4.body.querySelectorAll('[data-g-key] *')].map((x) => [R(x).left, R(x).top])
      o.revMovidas = pos0.filter((p, i) => !pos1[i] || Math.abs(p[0] - pos1[i][0]) > 0.5 || Math.abs(p[1] - pos1[i][1]) > 0.5).length
      await sleep(800)
      o.revFinal = parse(getComputedStyle(tt).color)[3]
      o.revBarraFinal = getComputedStyle(tt).textDecorationLine
      o.revClase = r4.root.classList.contains('is-revealing')
      o.animsAlFinal = document.getAnimations().filter((a) => r4.root.contains(a.effect.target)).length
      // B: filo, píldora, sin saturación, inerte
      r4.stale(); await sleep(200)
      const rr = R(r4.root), pill = r4.root.querySelector('.g-load-region__pill'), pr = R(pill)
      const be = getComputedStyle(r4.root, '::before')
      o.filoAlto = parseFloat(be.height); o.filoBorde = len('var(--g-border-width)') * 2
      o.filoArriba = parseFloat(be.top)
      o.pildoraSobreFilo = pr.top < rr.top && pr.bottom > rr.top
      o.pildoraFinal = Math.abs(rr.right - pr.right - len('var(--g-space-4)'))
      o.filtro = getComputedStyle(r4.body).filter
      o.staleInert = r4.body.inert
      o.staleCursor = getComputedStyle(r4.root).cursor
      r4.idle(); await raf2()
      o.pildoraFuera = !r4.root.querySelector('.g-load-region__pill') || getComputedStyle(r4.root.querySelector('.g-load-region__pill')).display === 'none'
      // Lo nuevo: marca al inicio lógico, la caja no cambia
      const sizes0 = [...r4.body.querySelectorAll('[data-g-key]')].map((x) => R(x).height)
      r4.arrive(window.XBench.REAL.list2); await raf2()
      const fr = r4.body.querySelector('[data-g-fresh]'), frb = getComputedStyle(fr, '::before')
      o.nuevaAncho = parseFloat(frb.width); o.nuevaEsperado = len('var(--g-border-width)') * 3
      o.nuevaInicio = parseFloat(frb.left)
      const a0 = R(fr); fr.removeAttribute('data-g-fresh'); const a1 = R(fr); fr.setAttribute('data-g-fresh', '')
      o.nuevaCaja = Math.abs(a0.height - a1.height) + Math.abs(a0.width - a1.width) + Math.abs(a0.top - a1.top)
      // Barra de fallo en flujo, antes del cuerpo; lo conocido usable
      const h0 = R(r4.root).height
      r4.failed(); await raf2()
      const fb = r4.root.querySelector('.g-load-region__failed')
      o.falloAntes = fb.nextElementSibling === r4.body && R(fb).bottom <= R(r4.body).top
      o.falloEmpuja = R(r4.root).height - h0 > 0
      o.falloUsable = !r4.body.inert
      r4.S.prev = new Set(window.XBench.REAL.list.map((x) => x.id)); r4.S.known = window.XBench.REAL.list; r4.idle()
      // Primer hueco dentro de la región
      const r7 = reg('r-empty'), em = r7.root.querySelector('.g-empty')
      o.huecoSlot = parseFloat(r7.root.style.getPropertyValue('--_load-slot'))
      o.huecoMin = parseFloat(getComputedStyle(em).minBlockSize)
      r7.empty({ cause: 'forbidden', title: 'Sin permiso' }); await raf2()
      const e7 = r7.root.querySelector('.g-empty')
      o.huecoAlto = R(e7).height
      e7.style.minBlockSize = '0px'; o.huecoContenido = R(e7).height; e7.style.minBlockSize = ''
      o.huecoSuelto = getComputedStyle(document.querySelector('#s1-none')).minBlockSize
      // Anatomía del vacío
      const wide = document.querySelector('#s1-error'), narrow = document.querySelector('#s1n-none')
      const ia = (e) => [R(e.querySelector('.g-empty__icon')), R(e.querySelector('.g-empty__text')), R(e.querySelector('.g-empty__actions'))]
      const [wi, wt, wa] = ia(wide), [ni, nt, na] = ia(narrow)
      o.anchoMismaLinea = wa.top < wt.bottom && wa.left >= wt.right - 0.5
      o.estrechoDebajo = na.top >= nt.bottom - 0.5
      o.hueco = [wi.width, wi.height, len('calc(var(--g-space-1) * 10)')]
      o.huecoRedondo = getComputedStyle(wide.querySelector('.g-empty__icon')).borderTopStyle
      o.cajaDiscontinua = getComputedStyle(wide).borderTopStyle
      o.huecoNoneVacio = document.querySelector('#s1-none .g-empty__icon').children.length
      for (const id of ['s2-exit', 's2n-exit']) {
        const e = document.getElementById(id), t = R(e.querySelector('.g-empty__text')), a = R(e.querySelector('.g-empty__actions'))
        o[id + ' debajo y alineada'] = a.top >= t.bottom - 0.5 && Math.abs(a.left - t.left) <= 0.5
        o[id + ' orden'] = [...e.querySelectorAll('.g-empty__actions .g-btn__label')].map((b) => b.firstChild.textContent).join(' | ')
      }
      o.cuentaTabular = getComputedStyle(document.querySelector('#s2-exit .g-empty__count')).fontVariantNumeric
      o.srOculto = R(document.querySelector('#s2-exit .g-empty__sr')).width <= 1
      // RTL
      const rtl = document.getElementById('s3-error')
      o.rtlHueco = R(rtl.querySelector('.g-empty__icon')).left > R(rtl.querySelector('.g-empty__text')).left
      const rx = document.getElementById('s3-exit'), rxt = R(rx.querySelector('.g-empty__text')), rxa = R(rx.querySelector('.g-empty__actions'))
      o.rtlSalida = Math.abs(rxa.right - rxt.right) <= 0.5
      const r8 = reg('r-rtl'), f8 = r8.body.querySelector('[data-g-fresh]')
      o.rtlNueva = Math.abs(parseFloat(getComputedStyle(f8, '::before').right))
      r8.stale(); await sleep(50)
      const p8 = R(r8.root.querySelector('.g-load-region__pill')), rr8 = R(r8.root)
      o.rtlPildora = Math.abs(p8.left - rr8.left - len('var(--g-space-4)'))
      r8.mold(); await raf2()
      o.rtlMolde = getComputedStyle(r8.body.querySelector('.row-title')).textDecorationLine
      r8.idle()
      // GTable
      const t9 = tab('t-load')
      t9.idle(); await raf2()
      const realRow = R(t9.root.querySelector('tbody tr')).height
      const hScroll0 = R(t9.root.querySelector('.g-table__scroll')).height, y9 = R(document.getElementById('s9after')).top
      t9.skeleton(); await raf2()
      const skRow = R(t9.root.querySelector('tbody tr')).height
      const sk = t9.root.querySelector('.g-table__skeleton'), skc = getComputedStyle(sk)
      o.tablaFila = [realRow, skRow]
      o.tablaBarra = [parseFloat(skc.height), parseFloat(getComputedStyle(sk.parentElement).lineHeight) - len('var(--g-space-2)')]
      o.tablaTono = skc.backgroundColor
      o.tablaΔ = [R(t9.root.querySelector('.g-table__scroll')).height - hScroll0, R(document.getElementById('s9after')).top - y9]
      await sleep(300)
      o.tablaAnims = t9.root.getAnimations ? document.getAnimations().filter((a) => t9.root.contains(a.effect.target)).length : 0
      const endCell = t9.root.querySelector('tbody td.g-table__cell--end'), endBar = endCell.querySelector('.g-table__skeleton')
      o.tablaFinal = Math.abs(R(endBar).right - (R(endCell).right - parseFloat(getComputedStyle(endCell).paddingRight)))
      t9.slow(); await raf2()
      const ts = t9.root.querySelector('.g-table__slow'), sc = t9.root.querySelector('.g-table__scroll')
      o.tablaEspera = [R(sc).height - hScroll0, Math.abs(R(ts).bottom - R(sc).bottom), R(document.getElementById('s9after')).top - y9]
      t9.firstPending(); await raf2()
      o.tablaRetraso = [...t9.root.querySelectorAll('tbody tr')].every((tr) => getComputedStyle(tr).visibility === 'hidden')
      t9.refreshPending(); await raf2()
      o.tablaRefrescoVisible = [...t9.root.querySelectorAll('tbody tr')].every((tr) => getComputedStyle(tr).visibility === 'visible')
      t9.idle()
      const tf = tab('t-failed').root
      o.tablaFallo = tf.querySelector('.g-table__failed').nextElementSibling.classList.contains('g-table__scroll')
      const te = tab('t-empty').root.querySelector('td.g-table__empty'), tec = getComputedStyle(te)
      o.tablaVacio = [tec.textAlign, parseFloat(tec.paddingLeft), Math.abs(R(te.querySelector('.g-empty')).left - R(te).left)]
      const mine = document.getAnimations().filter((a) => a.effect.target && a.effect.target.closest && a.effect.target.closest('.g-load-region, .g-table, .g-empty') && !a.effect.target.closest('.g-btn'))
      o.animsTotal = mine.filter((a) => a.playState === 'running').length
      o.infinitas = mine.filter((a) => a.effect.getTiming().iterations === Infinity).length
      o.btnSpin = document.getAnimations().filter((a) => a.effect.target.closest && a.effect.target.closest('.g-btn') && a.playState === 'running').length
      return o
    })
    for (const id of ['r-list', 'r-tiles', 'r-detail']) {
      ok(near(g[id + ' replace Δh'], 0), T(`${id}: el molde de lo último conocido cambia el alto ${g[id + ' replace Δh']}`))
      ok(near(g[id + ' replace Δ debajo'], 0), T(`${id}: lo de debajo se mueve con el molde ${g[id + ' replace Δ debajo']}`))
      ok(g[id + ' replace piezas movidas'] === 0, T(`${id}: ${g[id + ' replace piezas movidas']} piezas se mueven entre contenido y molde`))
      ok(near(g[id + ' retraso Δh'], g[id + ' muestra Δh']), T(`${id}: el retraso no reserva el sitio del molde`))
      ok(g[id + ' retraso visible'] === 0, T(`${id}: ${g[id + ' retraso visible']} piezas visibles dentro del retraso`))
      ok(near(g[id + ' espera Δh'], g[id + ' muestra Δh']) && near(g[id + ' espera al pie'], 0), T(`${id}: la espera larga mueve algo o no va al pie`))
      if (qs === '') notes.push(`[${engine}] ${id}: Δ alto de la primera carga con la muestra frente a los datos = ${g[id + ' muestra Δh'].toFixed(2)}px (depende de que la muestra tenga el tamaño de la respuesta)`)
    }
    ok(g.hojaBarra === 'line-through' && near(g.hojaGrosor, 0.72, 0.03), T(`hoja sin barra de 0.72em: ${g.hojaBarra} ${g.hojaGrosor}`))
    ok(g.hojaTinta === 0, T('la hoja del molde conserva tinta pese a la regla de la plantilla (sin !important)'))
    ok(g.hojaColorBarra === g.toneProbe, T(`barra fuera del tono del molde: ${g.hojaColorBarra} ≠ ${g.toneProbe}`))
    ok(g.contenedorBarra === 'none', T('un contenedor lleva barra (se propagaría)'))
    ok(g.avFondo === 0 && g.avBorde === g.toneProbe, T(`caja del molde con relleno o borde fuera del tono: ${g.avFondo} ${g.avBorde}`))
    ok(g.inert && g.enfocables >= 1, T('el molde no es inerte ni aria-hidden'))
    ok(g.img === 'hidden', T('la imagen se ve en el molde'))
    ok(g.conocidoColor === g.textMuted && g.conocidoBarra === 'none' && g.conocidoIcono === 'visible', T(`data-g-known pierde su tinta: ${g.conocidoColor} ${g.conocidoBarra} ${g.conocidoIcono}`))
    ok(g.teselaBorde === g.toneProbe && g.teselaSombra === 'none' && g.valorTinta === 0, T('tesela en molde: borde, sombra o tinta'))
    ok(g.revMedio > 0 && g.revMedio < 1 && g.revBarraMedio > 0 && g.revBarraMedio < 1, T(`revelado sin estado intermedio: tinta ${g.revMedio}, barra ${g.revBarraMedio}`))
    ok(g.revSoloTransiciones && g.revTransiciones.every((p) => ['color', 'text-decoration-color', 'background-color', 'border-color', 'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color', 'outline-color', 'box-shadow', 'filter'].includes(p)), T('revelado con algo que no es una transición de color: ' + g.revTransiciones))
    ok(near(g.revDur, g.slowTok, 1), T(`revelado de ${g.revDur}ms ≠ --g-duration-slow ${g.slowTok}`))
    ok(g.revMovidas === 0, T(`${g.revMovidas} piezas se mueven en el revelado`))
    ok(g.revFinal === 1 && g.revBarraFinal === 'none' && !g.revClase && g.animsAlFinal === 0, T(`el revelado no termina: ${g.revFinal} ${g.revBarraFinal} ${g.revClase} ${g.animsAlFinal}`))
    ok(near(g.filoAlto, g.filoBorde) && near(g.filoArriba, 0), T(`filo: ${g.filoAlto} ≠ ${g.filoBorde} o no arriba`))
    ok(g.pildoraSobreFilo && near(g.pildoraFinal, 0, 1), T(`píldora fuera del filo o del final lógico: ${g.pildoraSobreFilo} ${g.pildoraFinal}`))
    ok(g.filtro === 'none' && g.staleInert && g.staleCursor === 'progress', T(`B: filtro ${g.filtro} (lo de antes no cambia de color), inerte ${g.staleInert}, cursor ${g.staleCursor}`))
    ok(g.pildoraFuera, T('la píldora se ve fuera de is-stale'))
    ok(near(g.nuevaAncho, g.nuevaEsperado) && near(g.nuevaInicio, 0) && near(g.nuevaCaja, 0), T(`marca de lo nuevo: ancho ${g.nuevaAncho}/${g.nuevaEsperado}, inicio ${g.nuevaInicio}, caja Δ${g.nuevaCaja}`))
    ok(g.falloAntes && g.falloEmpuja && g.falloUsable, T('barra de fallo fuera de flujo, después del cuerpo o con lo conocido inerte'))
    ok(g.huecoSlot > 0 && near(g.huecoMin, g.huecoSlot, 0.5) && g.huecoAlto >= g.huecoSlot - 0.5 && (g.huecoAlto <= g.huecoSlot + 1 || g.huecoAlto <= g.huecoContenido + 1), T(`primer hueco ${g.huecoAlto} (mín. ${g.huecoMin}, contenido ${g.huecoContenido}) ≠ un elemento ${g.huecoSlot}`))
    ok(g.huecoSuelto === 'auto' || g.huecoSuelto === '0px', T('GEmpty suelto con alto mínimo: ' + g.huecoSuelto))
    ok(g.anchoMismaLinea && g.estrechoDebajo, T(`anatomía de fila: a lo ancho en la misma línea ${g.anchoMismaLinea}, estrecho debajo ${g.estrechoDebajo}`))
    ok(near(g.hueco[0], g.hueco[2]) && near(g.hueco[1], g.hueco[2]) && g.huecoRedondo === 'dashed' && g.cajaDiscontinua === 'dashed', T(`hueco del icono ${g.hueco} o sin discontinuo`))
    ok(g.huecoNoneVacio === 0, T('none con icono por defecto'))
    for (const id of ['s2-exit', 's2n-exit']) {
      ok(g[id + ' debajo y alineada'], T(`${id}: la salida no va debajo del texto, alineada con él`))
      ok(g[id + ' orden'] === 'Quitar «Hoy» | Quitar «Cerradas» | Quitar todos', T(`${id}: orden ${g[id + ' orden']}`))
    }
    ok(/tabular-nums/.test(g.cuentaTabular) && g.srOculto, T('cuenta sin cifras tabulares o __sr visible'))
    ok(g.rtlHueco && g.rtlSalida && near(g.rtlNueva, 0) && near(g.rtlPildora, 0, 1) && g.rtlMolde === 'line-through', T(`RTL: hueco ${g.rtlHueco}, salida ${g.rtlSalida}, nueva ${g.rtlNueva}, píldora ${g.rtlPildora}, molde ${g.rtlMolde}`))
    ok(near(g.tablaFila[0], g.tablaFila[1], 0.5), T(`GTable: fila esqueleto ${g.tablaFila[1]} ≠ fila de una línea ${g.tablaFila[0]}`))
    ok(near(g.tablaBarra[0], g.tablaBarra[1]), T(`GTable: barra ${g.tablaBarra[0]} ≠ 1lh − space × 2 ${g.tablaBarra[1]}`))
    ok(g.tablaTono === g.toneProbe, T(`GTable: esqueleto fuera del tono ${g.tablaTono}`))
    ok(near(g.tablaΔ[0], 0) && near(g.tablaΔ[1], 0), T(`GTable: el esqueleto con las filas que había mueve algo ${g.tablaΔ}`))
    ok(g.tablaAnims === 0, T(`GTable: ${g.tablaAnims} animaciones en el esqueleto`))
    ok(near(g.tablaFinal, 0, 1), T(`GTable: barra de una columna final no va al final (${g.tablaFinal})`))
    ok(near(g.tablaEspera[0], 0) && near(g.tablaEspera[1], 0) && near(g.tablaEspera[2], 0), T(`GTable: la espera larga mueve algo o no va al pie ${g.tablaEspera}`))
    ok(g.tablaRetraso && g.tablaRefrescoVisible, T('GTable: retraso de la primera carga visible o filas del refresco ocultas'))
    ok(g.tablaFallo, T('GTable: la barra de fallo no va antes del área desplazable'))
    ok(g.tablaVacio[0] === 'start' && near(g.tablaVacio[2], 0), T(`GTable: GEmpty en la celda ${g.tablaVacio}`))
    ok(g.animsTotal === 0 && g.infinitas === 0 && g.btnSpin === 0, T(`animaciones en curso ${g.animsTotal}, infinitas ${g.infinitas}, giros de GBtn en marcha ${g.btnSpin}`))
  }

  /* ---------- 3 · Movimiento reducido ---------- */
  {
    const c2 = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' })
    const p2 = await c2.newPage()
    await load(p2)
    const m = await p2.evaluate(async () => {
      const { reg, sleep, dur } = window.__lib
      const r = reg('r-list')
      await r.reveal(); await sleep(10)
      const a = document.getAnimations().filter((x) => r.root.contains(x.effect.target))
      return { n: a.length, d: Math.max(...a.map((x) => x.effect.getTiming().duration)), fast: dur('--g-duration-fast') }
    })
    ok(m.n > 0 && Math.abs(m.d - m.fast) <= 1, E(`reducido: revelado de ${m.d}ms ≠ --g-duration-fast ${m.fast} (${m.n} transiciones)`))
    await c2.close()
  }

  /* ---------- 4 · Táctil a 390px ---------- */
  {
    const opts = engine === 'chromium' ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } : { viewport: { width: 390, height: 844 }, hasTouch: true }
    const c3 = await browser.newContext(opts)
    const p3 = await c3.newPage()
    await load(p3)
    const coarse = await p3.evaluate(() => matchMedia('(pointer: coarse)').matches)
    if (!coarse) notes.push(`[${engine}] pointer: coarse no se emula; táctil sin medir`)
    else {
      const t = await p3.evaluate(async () => {
        const { reg, tab, raf2 } = window.__lib
        reg('r-tiles').failed(); await raf2()
        const areas = []
        for (const b of document.querySelectorAll('.g-empty .g-btn, .g-load-region__failed .g-btn, .g-table__failed .g-btn')) {
          const r = b.getBoundingClientRect(), a = getComputedStyle(b, '::after')
          const w = parseFloat(a.width), hh = parseFloat(a.height)
          areas.push({ b, box: { l: r.left + r.width / 2 - w / 2, r: r.left + r.width / 2 + w / 2, t: r.top + r.height / 2 - hh / 2, bo: r.top + r.height / 2 + hh / 2 }, min: Math.min(w, hh) })
        }
        let overlap = 0
        for (let i = 0; i < areas.length; i++) for (let j = i + 1; j < areas.length; j++) {
          const A = areas[i].box, Bx = areas[j].box
          if (A.l < Bx.r - 0.5 && Bx.l < A.r - 0.5 && A.t < Bx.bo - 0.5 && Bx.t < A.bo - 0.5) overlap++
        }
        return { n: areas.length, min: Math.min(...areas.map((a) => a.min)), overlap, sw: document.documentElement.scrollWidth, vw: innerWidth }
      })
      ok(t.n > 10 && t.min >= 44, E(`táctil: área mínima ${t.min} (${t.n} botones)`))
      ok(t.overlap === 0, E(`táctil: ${t.overlap} áreas de 44 se solapan`))
      ok(t.sw <= t.vw, E(`390px: la página desborda ${t.sw} > ${t.vw}`))
    }
    await c3.close()
  }

  /* ---------- 5 · Colores forzados (Chromium) ---------- */
  if (engine === 'chromium') {
    const c5 = await browser.newContext({ viewport: { width: 1280, height: 900 }, forcedColors: 'active' })
    const p5 = await c5.newPage()
    await load(p5)
    const f = await p5.evaluate(async () => {
      const { reg, tab, raf2, parse } = window.__lib
      const sys = (n) => { const i = document.createElement('i'); i.style.color = n; i.style.forcedColorAdjust = 'none'; document.body.append(i); const c = getComputedStyle(i).color; i.remove(); return c }
      const r4 = reg('r-list'); r4.mold(); await raf2()
      const t = r4.body.querySelector('.row-title'), cs0 = getComputedStyle(t), cs = { color: cs0.color, textDecorationColor: cs0.textDecorationColor }
      const r5 = reg('r-tiles'); r5.mold(); await raf2()
      const kn = getComputedStyle(r5.body.querySelector('[data-g-known] span')).color
      const tile = getComputedStyle(r5.body.querySelector('.tile-box')).borderTopColor
      const t9 = tab('t-load'); t9.skeleton(); await raf2()
      const sk = getComputedStyle(t9.root.querySelector('.g-table__skeleton')).backgroundColor
      r4.idle(); r4.stale(); await raf2()
      const filo = getComputedStyle(r4.root, '::before').backgroundColor
      const em = getComputedStyle(document.getElementById('s1-error')).borderTopColor
      const hole = getComputedStyle(document.querySelector('#s1-error .g-empty__icon')).borderTopColor
      return { tinta: parse(cs.color)[3], barra: cs.textDecorationColor, kn, tile, sk, filo, em, hole, Gray: sys('GrayText'), Canvas: sys('CanvasText'), High: sys('Highlight') }
    })
    ok(f.tinta === 0, E('forced-colors: la muestra del molde se pinta (se leería como dato)'))
    ok(f.barra === f.Gray && f.tile === f.Gray && f.sk === f.Gray, E(`forced-colors: molde o esqueleto fuera de GrayText ${f.barra} ${f.tile} ${f.sk} (${f.Gray})`))
    ok(f.kn === f.Canvas, E(`forced-colors: data-g-known ${f.kn} ≠ CanvasText`))
    ok(f.filo === f.High, E(`forced-colors: filo ${f.filo} ≠ Highlight`))
    ok(f.em === f.Canvas && f.hole === f.Canvas, E(`forced-colors: contorno del vacío ${f.em} ${f.hole}`))
    await c5.close()
  }

  ok(!errors.length, E('consola: ' + errors.slice(0, 3).join(' | ')))
  await browser.close()
}

server.close()
for (const n of notes) console.log('· ' + n)
if (fails.length) { console.log('\nFALLOS:'); for (const f of fails.slice(0, 80)) console.log('✗ ' + f) }
console.log(`\n${total - failed}/${total} comprobaciones`)
process.exit(failed ? 1 : 0)
