// Verificación de coco sobre el banco de GAvatar (design/lab/avatar/estilo-banco.html), con el CSS real (GAvatar.css y los
// cinco anfitriones tocados, de src/ dentro de grana.components) y los componentes reales de dist/.
// Mide: análisis estático (sin literales ni respaldos, sin @layer, sin !important, propiedades lógicas, solo tokens que
// existen o la familia cat-K-soft / on-cat-K-soft, sin --g-radius-shape) en GAvatar.css y en las reglas nuevas de GCard,
// GTable, GMenu, GSelect y GBadge; lado = space × n exacto con space 4 y 5 (tres fuentes, cinco tamaños, dos formas); radio
// del square por tamaño; iniciales que caben sin recorte por tamaño y escritura, texto ≥ 12px; contraste de iniciales
// (≥ 4.5) e icono (≥ 3) en neutro y todas las categorías de los dos temas de la ronda, claro y oscuro, y el neutro en los
// once temas generados; imagen cargando → cargada → fallida sin salto de caja ni del texto vecino; fundido y asentamiento
// solo sin preferencia, nada con reduce; forced-colors (Chromium) con borde CanvasText sin cambio de tamaño; GCard lead sin
// doble forma y esqueleto intacto; GTable / GMenu / GSelect con el hueco a la caja del avatar, avatar entero y centrado;
// GBadge en el contorno a 45° (±1px) en LTR y RTL y en la esquina sobre square; 320px; consola limpia.
// Ejecutar desde la raíz del repo (tras `npm run build`): node design/lab/avatar/estilo-verificar.mjs
// Opcional: --engines=chromium,firefox,webkit (por defecto los tres)   --verbose
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
await new Promise((r) => server.listen(0, '127.0.0.1', r))
const BASE = `http://127.0.0.1:${server.address().port}/design/lab/avatar/estilo-banco.html`

const GEN = ['amazon', 'apple', 'caracol-purpura', 'github', 'grana', 'linear', 'lustre', 'medium', 'notion', 'spotify', 'stripe']
const UNITS = { xs: 5, sm: 6, md: 8, lg: 10, xl: 16 }
const SIZES = Object.keys(UNITS)
let total = 0, failed = 0
const fails = []
let ENGINE = 'static'
const ok = (cond, msg) => { total++; if (!cond) { failed++; fails.push(`[${ENGINE}] ${msg}`) } if (args.verbose) console.log(cond ? 'ok ' : 'NO ', ENGINE, msg) }
const near = (a, b, t = 0.51) => Math.abs(a - b) <= t
const info = []

/* ---------- 0 · Análisis estático ---------- */
{
  const read = (f) => readFile(join(ROOT, f), 'utf8')
  const strip = (c) => c.replace(/\/\*[\s\S]*?\*\//g, '')
  const defaults = await read('packages/vue/src/styles/defaults.css')
  const defined = new Set([...defaults.matchAll(/(--g-[a-z0-9-]+)\s*:/g)].map((m) => m[1]))
  const CAT_OK = /^--g-color-(?:cat-(?:[1-9]|1[0-2])-soft|on-cat-(?:[1-9]|1[0-2])-soft)$/
  const checkCss = (name, css, { cats = false } = {}) => {
    ok(!/#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|lab|lch)\(/.test(css), `${name}: color literal`)
    ok(!/var\(\s*--[\w-]+\s*,/.test(css), `${name}: var() con valor de respaldo`)
    ok(!/@layer/.test(css), `${name}: @layer`)
    ok(!/!important/.test(css), `${name}: !important`)
    const vars = [...css.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1])
    ok(vars.every((v) => v.startsWith('--g-') || v.startsWith('--_')), `${name}: var() que no es --g-* ni --_*`)
    const missing = [...new Set(vars.filter((v) => v.startsWith('--g-') && !defined.has(v) && !(cats && CAT_OK.test(v))))]
    ok(!missing.length, `${name}: tokens inexistentes ${missing}`)
    ok(!/--g-[a-z0-9-]+\s*:/.test(css), `${name}: declara tokens --g-*`)
    const badPx = [...css.matchAll(/(-?\d*\.?\d+)(px|ms|s|rem|em)\b/g)].map((m) => m[0]).filter((p) => !['24px', '44px', '0px', '1em'].includes(p))
    ok(!badPx.length, `${name}: medidas o duraciones literales ${badPx}`)
    ok(!/\b(?:left|right|top|bottom)\s*:|(?:margin|padding|border)-(?:left|right|top|bottom)\b|text-align:\s*(?:left|right)/.test(css), `${name}: solo propiedades lógicas`)
    ok(!/--g-radius-shape/.test(css), `${name}: no lee --g-radius-shape`)
    const hovers = (css.match(/:hover/g) || []).length
    ok(hovers === 0, `${name}: sin :hover (no interactivo / reglas nuevas)`)
  }
  const av = strip(await read('packages/vue/src/components/GAvatar/GAvatar.css'))
  checkCss('GAvatar.css', av, { cats: true })
  const cats = [...av.matchAll(/var\((--g-color-(?:on-)?cat-[a-z0-9-]+)/g)].map((m) => m[1])
  ok(cats.length === 24 && cats.every((v) => CAT_OK.test(v)), `GAvatar.css: lee solo cat-K-soft y on-cat-K-soft, K 1..12 (${cats.length})`)
  // Números sueltos: solo los de la escala (5 6 8 10 16), la proporción del icono (0.5), el asentamiento (1.06, 1) y 50%
  const nums = [...av.replace(/margin:\s*0;|data-cat="\d+"|cat-\d+-soft|grid-area:\s*1 \/ 1|inset:\s*0|opacity:\s*[01]|scale:\s*1;/g, '').matchAll(/(?<![\w-])(\d*\.?\d+)(%?)(?![\w-])/g)].map((m) => m[0])
  const allowed = new Set(['5', '6', '8', '10', '16', '0.5', '1.06', '2', '50%', '100%'])
  ok(nums.every((n) => allowed.has(n)), `GAvatar.css: números sueltos fuera de escala, proporción y geometría ${nums.filter((n) => !allowed.has(n))}`)
  ok(/@media \(prefers-reduced-motion: no-preference\)/.test(av) && /@media \(forced-colors: active\)/.test(av), 'GAvatar.css: bloques de movimiento y forced-colors')
  ok(/--g-duration-fast/.test(av) && /--g-ease-standard/.test(av) && /--g-border-width/.test(av), 'GAvatar.css: tokens de movimiento y borde del contrato')
  ok(!/display:\s*none/.test(av) && /visibility:\s*hidden/.test(av), 'GAvatar.css: el respaldo se oculta con visibility, nunca display: none')
  // Reglas nuevas de los anfitriones (bloques cuyo selector nombra .g-avatar o los alias nuevos)
  const blocks = (css, re) => [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter((m) => re.test(m[1])).map((m) => m[0]).join('\n')
  for (const [f, re] of [['GCard/GCard.css', /g-avatar/], ['GTable/GTable.css', /g-avatar/], ['GMenu/GMenu.css', /g-avatar|g-menu__icon/], ['GSelect/GSelect.css', /g-avatar/], ['GBadge/GBadge.css', /g-avatar/]]) {
    const b = blocks(strip(await read('packages/vue/src/components/' + f)), re)
    ok(b.length > 0, `${f}: hay reglas para .g-avatar`)
    checkCss(f + ' (reglas del avatar)', b)
    ok(/:has\(>/.test(b) || f === 'GMenu/GMenu.css', `${f}: el avatar se detecta como hijo directo (:has(> .g-avatar))`)
  }
  ok(/--_slot:\s*var\(--_mark\);/.test(strip(await read('packages/vue/src/components/GMenu/GMenu.css'))), 'GMenu.css: --_slot se declara en cada lista (un submenú no hereda el del padre)')
  const badge = strip(await read('packages/vue/src/components/GBadge/GBadge.css'))
  ok(/--_contour:\s*calc\(50% - 50% \/ sqrt\(2\)\)/.test(badge), 'GBadge.css: constante geométrica 1 − 1/√2 del radio, sin token')
}

/* ---------- Motores ---------- */
const SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="#777"/></svg>'
for (const engine of ENGINES) {
  ENGINE = engine
  const b = await pw[engine].launch()
  const errs = []
  const open = async (opts = {}, query = '') => {
    const ctx = await b.newContext({ viewport: { width: opts.width ?? 1280, height: 900 }, reducedMotion: opts.reducedMotion ?? 'no-preference' })
    const p = await ctx.newPage()
    p.on('console', (m) => {
      const t = m.text()
      if (m.type() === 'error' && /Failed to load resource|404|status of 404|avatar\.invalid/.test(t)) return
      if (/You are running a development build of Vue/.test(t)) return
      if (['error', 'warning'].includes(m.type())) errs.push(`${m.type()}: ${t.slice(0, 200)}`)
    })
    p.on('pageerror', (e) => errs.push(`pageerror: ${e}`))
    let release; const held = new Promise((res) => { release = res })
    p.releaseSlow = () => release()
    await p.route('**/avatar.invalid/lento.png', async (r) => { await held; await r.fulfill({ status: 200, contentType: 'image/svg+xml', body: SVG }) })
    await p.route('**/avatar.invalid/roto*.png', (r) => r.fulfill({ status: 404, contentType: 'text/plain', body: 'no' }))
    await p.goto(BASE + query, { waitUntil: 'domcontentloaded' }); await p.waitForFunction(() => document.querySelector('#app .g-avatar'))
    // WebKit no resuelve document.fonts.ready mientras una imagen diferida sigue pendiente: se cargan las caras a mano
    await p.evaluate(() => { const f = getComputedStyle(document.body).fontFamily; return Promise.race([Promise.all(['400', '500', '600'].map((w) => document.fonts.load(`${w} 16px ${f}`))), new Promise((r) => setTimeout(r, 3000))]) })
    await p.waitForTimeout(400)
    return p
  }
  const rect = (p, sel) => p.evaluate((s) => { const r = document.querySelector(s)?.getBoundingClientRect(); return r && { x: r.x, y: r.y, w: r.width, h: r.height } }, sel)

  let p = await open()

  // 1 · Lado = space × n (space 4 y 5), tres fuentes, dos formas; radio
  for (const shape of ['circle', 'square']) {
    await p.selectOption('#t-shape', shape); await p.waitForTimeout(250)
    const boxes = await p.evaluate(() => [...document.querySelectorAll('[data-test^="size"]')].map((a) => { const r = a.getBoundingClientRect(); const cs = getComputedStyle(a); return { t: a.dataset.test, w: r.width, h: r.height, rad: cs.borderTopLeftRadius } }))
    ok(boxes.length === 30, `${shape}: 30 avatares de escala (${boxes.length})`)
    for (const x of boxes) {
      const sp = x.t.startsWith('size5') ? 5 : 4, s = x.t.split('-').pop()
      const side = sp * UNITS[s]
      ok(near(x.w, side, 0.01) && near(x.h, side, 0.01), `${shape} ${x.t}: ${x.w}×${x.h} ≠ ${side}`)
    }
    const rads = Object.fromEntries(boxes.filter((x) => x.t.startsWith('size-ini')).map((x) => [x.t.split('-').pop(), x.rad]))
    if (shape === 'circle') ok(SIZES.every((s) => rads[s] === '50%'), `circle: radio 50% (${JSON.stringify(rads)})`)
    else {
      const tok = await p.evaluate(() => { const cs = getComputedStyle(document.documentElement); return ['xs', 'sm', 'md', 'lg'].map((k) => parseFloat(cs.getPropertyValue('--g-radius-' + k)) * (cs.getPropertyValue('--g-radius-' + k).includes('rem') ? 16 : 1)) })
      const exp = { xs: tok[0], sm: tok[0], md: tok[1], lg: tok[2], xl: tok[3] }
      ok(SIZES.every((s) => near(parseFloat(rads[s]), exp[s], 0.01)), `square: radio por tamaño xs/sm xs, md sm, lg md, xl lg (${JSON.stringify(rads)})`)
    }
  }
  await p.selectOption('#t-shape', 'circle'); await p.waitForTimeout(250)

  // 2 · Iniciales caben sin recorte; ≥ 12px
  for (const shape of ['circle', 'square']) {
    await p.selectOption('#t-shape', shape); await p.waitForTimeout(250)
    const fit = await p.evaluate((shape) => [...document.querySelectorAll('[data-fit]')].map((a) => {
      const sp = a.querySelector('.g-avatar__initials'); const cs = getComputedStyle(a); const fs = parseFloat(getComputedStyle(sp).fontSize)
      const rg = document.createRange(); rg.selectNodeContents(sp); const tr = rg.getBoundingClientRect(); const ar = a.getBoundingClientRect()
      const r = ar.width / 2, cap = 0.72 * fs
      const avail = shape === 'circle' ? 2 * Math.sqrt(r * r - (cap / 2) ** 2) - 2 : ar.width - 2
      return { t: a.dataset.fit, s: a.dataset.size, drawn: sp.textContent, w: tr.width, avail, fs, inside: tr.left >= ar.left - 0.01 && tr.right <= ar.right + 0.01, over: sp.scrollWidth > sp.clientWidth + 0.5, cyOff: Math.abs((tr.top + tr.height / 2) - (ar.top + ar.height / 2)) }
    }), shape)
    ok(fit.length === 45, `${shape}: 45 muestras de ajuste (${fit.length})`)
    for (const f of fit) {
      ok(f.w <= f.avail && f.inside && !f.over, `${shape} ${f.s} «${f.drawn}» (de «${f.t}»): ${f.w.toFixed(1)}px en ${f.avail.toFixed(1)}px`)
      ok(f.fs >= 12, `${shape} ${f.s}: texto ${f.fs}px < 12px`)
      ok(f.cyOff <= 1, `${shape} ${f.s} «${f.drawn}»: caja de texto centrada en vertical (Δ ${f.cyOff.toFixed(2)})`)
      if (['xs', 'sm'].includes(f.s)) ok([...new Intl.Segmenter().segment(f.drawn)].length === 1, `${f.s}: una letra («${f.drawn}»)`)
    }
    const worst = fit.filter((f) => !['xs', 'sm'].includes(f.s) && f.drawn.length > 1).map((f) => f.avail - f.w).sort((a, b) => a - b)[0]
    info.push(`${engine} ${shape}: aire mínimo de dos letras en md..xl ${worst?.toFixed(1)}px`)
  }
  await p.selectOption('#t-shape', 'circle'); await p.waitForTimeout(250)

  // 3 · Contraste (dos temas de la ronda: todas las categorías + neutro, claro y oscuro)
  const contrast = async (pg, label, onlyNeutral = false, maxCat = 12) => {
    const rows = await pg.evaluate(() => [...document.querySelectorAll('#col-light .g-avatar, #col-dark .g-avatar')].map((a) => {
      const cs = getComputedStyle(a); const ink = a.querySelector('svg') ? getComputedStyle(a.querySelector('svg')).color : getComputedStyle(a.querySelector('.g-avatar__initials')).color
      return { scheme: a.closest('[data-theme]').dataset.theme, t: a.dataset.test, icon: !!a.querySelector('svg'), bg: cs.backgroundColor, cr: window.__contrast(ink, cs.backgroundColor) }
    }))
    let min = 99, minAt = ''
    for (const r of rows) {
      if (onlyNeutral && !/neutral/.test(r.t)) continue
      const k = Number((r.t.match(/-(\d+)$/) || [])[1])
      if (k > maxCat) { ok(r.bg === 'rgba(0, 0, 0, 0)', `${label} ${r.scheme} ${r.t}: categoría que el tema no declara → sin relleno (límite documentado)`); continue }
      ok(r.bg !== 'rgba(0, 0, 0, 0)', `${label} ${r.scheme} ${r.t}: con relleno`)
      ok(r.cr >= (r.icon ? 3 : 4.5), `${label} ${r.scheme} ${r.t}: ${r.cr.toFixed(2)} < ${r.icon ? 3 : 4.5}`)
      if (r.cr < min) { min = r.cr; minAt = `${r.scheme} ${r.t}` }
    }
    return `${label} ${min.toFixed(2)} (${minAt})`
  }
  const cmin = [await contrast(p, 'cat12')]
  { const pm = await open({}, '?tema=marca'); cmin.push(await contrast(pm, 'marca+8', false, 8)); await pm.context().close() }
  info.push(`${engine} contraste mínimo: ${cmin.join(' · ')}`)
  // Neutro en los once temas generados
  const gmin = []
  for (const g of GEN) { const pg = await open({}, `?theme=${g}`); gmin.push(await contrast(pg, g, true)); await pg.context().close() }
  info.push(`${engine} neutro en temas generados: ${gmin.map((x) => x.split(' (')[0]).join(', ')}`)

  // Hash idéntico al contrato (vectores)
  const vec = await p.evaluate(() => ['a', 'Ana María López', '李小龙', 'محمد علي', 'Grana Labs', 'u_8f3a2c', 'Zoë'].map((k) => [4, 8, 12].map((n) => window.__avatarCategory(k, n))))
  ok(JSON.stringify(vec) === JSON.stringify([[4, 4, 4], [2, 2, 2], [1, 1, 1], [2, 6, 2], [3, 3, 11], [2, 2, 2], [3, 3, 11]]), `hash del banco = vectores del contrato (${JSON.stringify(vec)})`)

  // 4 · Imagen: estados sin salto
  await p.locator('#img-states').scrollIntoViewIfNeeded(); await p.waitForTimeout(200)
  const st = (t) => p.evaluate((x) => { const a = document.querySelector(`[data-test="${x}"]`); const n = document.querySelector(`[data-next="${x}"]`); const r = a.getBoundingClientRect(); const fb = a.querySelector(':scope > :not(img)'); const im = a.querySelector('img'); return { cls: a.className, w: r.width, h: r.height, nx: n?.getBoundingClientRect().x, img: !!im, imgOp: im ? getComputedStyle(im).opacity : null, fbVis: getComputedStyle(fb).visibility, fbKind: fb.tagName.toLowerCase() } }, t)
  const s0 = await st('img-slow')
  ok(/is-loading/.test(s0.cls) && s0.fbVis === 'visible' && s0.imgOp === '0', `cargando: respaldo visible, imagen invisible (${s0.cls}, ${s0.imgOp})`)
  p.releaseSlow(); await p.waitForTimeout(700)
  const s1 = await st('img-slow')
  ok(/is-loaded/.test(s1.cls) && s1.fbVis === 'hidden' && s1.imgOp === '1', `cargada: respaldo visibility hidden, imagen opaca (${s1.cls}, ${s1.fbVis}, ${s1.imgOp})`)
  ok(s0.w === s1.w && s0.h === s1.h && near(s0.nx, s1.nx, 0.01), `sin salto al cargar: ${s0.w}×${s0.h} → ${s1.w}×${s1.h}; texto ${s0.nx} → ${s1.nx}`)
  const okI = await st('img-ok'); const br = await st('img-broken'); const brn = await st('img-broken-noname')
  ok(/is-failed/.test(br.cls) && !br.img && br.fbVis === 'visible' && br.w === 40 && br.h === 40 && near(br.nx, okI.nx, 0.01), `fallida: sin <img>, iniciales, misma caja y texto (${br.cls}, ${br.w})`)
  ok(/is-failed/.test(brn.cls) && brn.fbKind === 'svg' && brn.w === 40 && near(brn.nx, okI.nx, 0.01), 'fallida sin nombre: icono, misma caja')
  const wide = await st('img-wide'); ok(wide.w === 40 && wide.h === 40 && await p.evaluate(() => getComputedStyle(document.querySelector('[data-test=img-wide] img')).objectFit === 'cover'), 'imagen 3:1: cover en 40×40')
  const w0 = await st('img-swap'); await p.click('#btn-swap'); await p.waitForTimeout(600); const w1 = await st('img-swap')
  ok(/is-loaded/.test(w1.cls) && w0.w === w1.w && w0.h === w1.h, 'cambio de src: vuelve a cargar sin salto')
  // Movimiento sin preferencia: fundido + asentamiento en la imagen, fundido del respaldo, transformación de forma
  const mo = await p.evaluate(() => { const a = document.querySelector('[data-test=img-ok]'); const im = a.querySelector('img'); const fb = a.querySelector(':scope > :not(img)'); const c = (e) => { const cs = getComputedStyle(e); return { p: cs.transitionProperty, d: cs.transitionDuration } }; return { img: c(im), fb: c(fb), root: c(a), scale: getComputedStyle(im).scale } })
  ok(/opacity/.test(mo.img.p) && /scale/.test(mo.img.p) && !/^0s(, 0s)*$/.test(mo.img.d) && mo.scale === '1', `sin preferencia: la imagen entra con fundido y asentamiento (${mo.img.p} ${mo.img.d}, scale ${mo.scale})`)
  ok(/opacity/.test(mo.fb.p) && /visibility/.test(mo.fb.p), `sin preferencia: el respaldo se desvanece (${mo.fb.p})`)
  ok(/border-radius/.test(mo.root.p), `sin preferencia: la forma se transforma (${mo.root.p})`)
  // Forma: el morfo termina en el radio correcto
  await p.selectOption('#t-shape', 'square'); await p.waitForTimeout(400)
  ok(await p.evaluate(() => getComputedStyle(document.querySelector('[data-test=img-ok]')).borderTopLeftRadius !== '50%'), 'square tras el morfo: radio de la escala')
  await p.selectOption('#t-shape', 'circle'); await p.waitForTimeout(400)

  // 5 · forced-colors (solo Chromium lo emula)
  if (engine === 'chromium') {
    const before = await p.evaluate(() => [...document.querySelectorAll('[data-test^="size-"], [data-test="card-ini"]')].map((a) => a.getBoundingClientRect().width))
    await p.emulateMedia({ forcedColors: 'active' }); await p.waitForTimeout(150)
    const fc = await p.evaluate(() => [...document.querySelectorAll('[data-test^="size-"], [data-test="card-ini"]')].map((a) => { const cs = getComputedStyle(a); return { s: cs.borderTopStyle, w: parseFloat(cs.borderTopWidth), c: cs.borderTopColor, box: a.getBoundingClientRect().width } }))
    ok(fc.every((x) => x.s === 'solid' && x.w >= 1 && x.c !== 'rgba(0, 0, 0, 0)'), `forced-colors: borde visible en todos (${JSON.stringify(fc[0])})`)
    ok(fc.every((x, i) => x.box === before[i]), 'forced-colors: el borde no cambia el tamaño')
    await p.emulateMedia({ forcedColors: 'none' }); await p.waitForTimeout(100)
  } else info.push(`${engine}: forced-colors no emulable`)

  // 6 · GCard lead
  const card = await p.evaluate(() => {
    const g = (id) => { const l = document.querySelector(`#${id} .g-card__lead`); const cs = getComputedStyle(l); const r = l.getBoundingClientRect(); const ch = l.firstElementChild?.getBoundingClientRect(); return { bw: cs.borderTopWidth, bg: cs.backgroundColor, rad: cs.borderTopLeftRadius, ov: cs.overflow, w: r.width, h: r.height, cw: ch?.width, ch: ch?.height, dx: ch ? (ch.x + ch.width / 2) - (r.x + r.width / 2) : null, dy: ch ? (ch.y + ch.height / 2) - (r.y + r.height / 2) : null, empty: !l.firstElementChild } }
    return { icon: g('card-icon'), ini: g('card-ini'), img: g('card-img'), sq: g('card-sq'), ld: g('card-loading'), ldi: g('card-loading-icon') }
  })
  for (const k of ['ini', 'img', 'sq']) {
    const c = card[k]
    ok(c.bw === '0px' && c.bg === 'rgba(0, 0, 0, 0)' && c.rad === '0px' && c.ov === 'visible', `GCard ${k}: lead sin borde, relleno, radio ni recorte (${c.bw}, ${c.bg}, ${c.rad}, ${c.ov})`)
    ok(near(c.w, 40, 0.01) && near(c.cw, 40, 0.01) && near(c.ch, 40, 0.01) && Math.abs(c.dx) < 0.01 && Math.abs(c.dy) < 0.01, `GCard ${k}: caja space × 10 = avatar lg, centrado (${c.w}, ${c.cw}×${c.ch})`)
  }
  ok(card.icon.bw === '1px' && card.icon.bg !== 'rgba(0, 0, 0, 0)' && card.icon.rad !== '0px' && near(card.icon.cw, 20, 0.01), `GCard con icono: marco intacto e icono space × 5 (${JSON.stringify(card.icon)})`)
  ok(JSON.stringify({ ...card.ld }) === JSON.stringify({ ...card.ldi }) && card.ld.bg !== 'rgba(0, 0, 0, 0)' && card.ld.rad !== '0px', `GCard cargando: esqueleto idéntico con y sin avatar (${card.ld.bg}, ${card.ld.rad})`)

  // 7 · GTable leading
  const tb = await p.evaluate(() => {
    const leads = [...document.querySelectorAll('#tbl .g-table__leading')].map((l) => { const cs = getComputedStyle(l); const r = l.getBoundingClientRect(); const a = l.querySelector('.g-avatar').getBoundingClientRect(); return { w: r.width, h: r.height, aw: a.width, ah: a.height, dx: a.x - r.x, dy: a.y - r.y, rad: cs.borderTopLeftRadius, ov: cs.overflow, bg: cs.backgroundColor, arad: getComputedStyle(l.querySelector('.g-avatar')).borderTopLeftRadius } })
    const text = (() => { const l = document.querySelector('#tbl-text .g-table__leading'); const cs = getComputedStyle(l); return { w: l.getBoundingClientRect().width, rad: cs.borderTopLeftRadius, ov: cs.overflow, bg: cs.backgroundColor } })()
    const rows = ['#tbl', '#tbl-text'].map((s) => [...document.querySelectorAll(`${s} tbody tr`)].map((r) => r.getBoundingClientRect().height))
    return { leads, text, rows }
  })
  ok(tb.leads.length === 3 && tb.leads.every((l) => near(l.w, 32, 0.01) && near(l.h, 32, 0.01) && near(l.aw, 32, 0.01) && Math.abs(l.dx) < 0.01 && Math.abs(l.dy) < 0.01), `GTable: hueco = avatar md = space × 8 (${tb.leads.map((l) => l.w).join(', ')})`)
  ok(tb.leads.every((l) => l.rad === '0px' && l.ov === 'visible' && l.bg === 'rgba(0, 0, 0, 0)'), 'GTable: el hueco con avatar pierde relleno, radio y recorte')
  ok(tb.leads[1].arad !== '50%' && parseFloat(tb.leads[1].arad) > 0, `GTable: un square se ve cuadrado (${tb.leads[1].arad})`)
  ok(near(tb.text.w, 32, 0.01) && tb.text.ov === 'hidden' && tb.text.bg !== 'rgba(0, 0, 0, 0)' && tb.text.rad !== '0px', `GTable: el leading de texto no cambia (${JSON.stringify(tb.text)})`)
  ok(tb.rows[0].every((h, i) => near(h, tb.rows[1][i], 0.01)), `GTable: misma altura de fila con avatar y con texto (${tb.rows[0]} / ${tb.rows[1]})`)

  // 8 · GSelect: valor y lista
  const selVal = await p.evaluate(() => ['sel-av-sm', 'sel-av-md', 'sel-av-lg', 'sel-av-xl', 'sel-av-s5'].map((id) => document.getElementById(id)).map((btn) => {
    const root = btn.closest('.g-select'); const plainId = btn.id.replace('sel-av-', 'sel-plain-'); const plain = document.getElementById(plainId)?.closest('.g-select')
    const val = root.querySelector('.g-select__value'); const hu = val.querySelector('.g-select__icon'); const a = hu.querySelector('.g-avatar')
    const ar = a.getBoundingClientRect(), hr = hu.getBoundingClientRect(), vr = val.getBoundingClientRect()
    const rg = document.createRange(); rg.setStartAfter(hu); rg.setEndAfter(val.lastChild); const tr = rg.getBoundingClientRect()
    const ctl = (r) => r.querySelector('.g-select__control').getBoundingClientRect().height
    const sp = parseFloat(getComputedStyle(root).getPropertyValue('--g-space-1'))
    return { id: btn.id, sp, aw: ar.width, hw: hr.width, hh: hr.height, inside: ar.top >= vr.top - 0.01 && ar.bottom <= vr.bottom + 0.01 && ar.left >= vr.left - 0.01, d: (ar.top + ar.height / 2) - (tr.top + tr.height / 2), h: ctl(root), hp: plain ? ctl(plain) : null }
  }))
  ok(selVal.length === 5, `GSelect: cinco controles con avatar (${selVal.length})`)
  for (const s of selVal) {
    ok(near(s.hw, s.sp * 5, 0.01) && near(s.hh, s.sp * 5, 0.01) && near(s.aw, s.sp * 5, 0.01), `GSelect ${s.id}: hueco = avatar = space × 5 (${s.hw}×${s.hh}, avatar ${s.aw})`)
    ok(s.inside, `GSelect ${s.id}: el avatar entero dentro del valor (sin recorte)`)
    ok(Math.abs(s.d) <= 0.5, `GSelect ${s.id}: avatar centrado en la línea de texto (Δ ${s.d.toFixed(2)})`)
    ok(near(s.h, s.hp, 0.01), `GSelect ${s.id}: alto del control sin cambio (${s.h} vs ${s.hp})`)
  }
  info.push(`${engine} GSelect Δ centro: ${selVal.map((s) => s.d.toFixed(2)).join(' ')}`)
  const optMeasure = async (id) => {
    await p.click(`#${id}`); await p.waitForTimeout(350)
    const r = await p.evaluate(() => [...document.querySelectorAll('.g-select__option')].filter((o) => o.offsetParent || o.getClientRects().length).map((o) => {
      const hu = o.querySelector('.g-select__icon'); const a = hu?.querySelector('.g-avatar'); const or = o.getBoundingClientRect()
      let d = null, hw = null
      if (a) { const ar = a.getBoundingClientRect(); const rg = document.createRange(); rg.setStartAfter(hu); const txt = [...o.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim()); rg.selectNode(txt); const tr = rg.getBoundingClientRect(); d = (ar.top + ar.height / 2) - (tr.top + tr.height / 2); hw = hu.getBoundingClientRect().width }
      return { h: or.height, d, hw }
    }))
    await p.keyboard.press('Escape'); await p.waitForTimeout(250)
    return r
  }
  const oa = await optMeasure('sel-av-md'); const op = await optMeasure('sel-plain-md')
  ok(oa.length === 3 && oa.every((o) => near(o.hw, 20, 0.01) && Math.abs(o.d) <= 0.5), `GSelect lista: hueco 20 y avatar centrado (${oa.map((o) => o.d?.toFixed(2)).join(' ')})`)
  ok(oa.length === op.length && oa.every((o, i) => near(o.h, op[i].h, 0.01)), `GSelect lista: alto de opción sin cambio (${oa.map((o) => o.h)} / ${op.map((o) => o.h)})`)

  // 9 · GMenu: huecos a space × 5 con avatar; menú solo de iconos sin cambio
  const menu = async (trigger) => {
    await p.click(`[data-test=${trigger}]`); await p.waitForTimeout(500)
    const r = await p.evaluate(() => [...document.querySelectorAll('.g-menu__list:popover-open [role=menuitem]')].map((i) => {
      const hu = i.querySelector('.g-menu__icon'); const lab = i.querySelector('.g-menu__label').getBoundingClientRect(); const ir = i.getBoundingClientRect()
      const hr = hu?.getBoundingClientRect(); const c = hu?.firstElementChild?.getBoundingClientRect()
      return { h: ir.height, hw: hr?.width, hh: hr?.height, cw: c?.width, dx: c ? (c.x + c.width / 2) - (hr.x + hr.width / 2) : null, dy: c ? (c.y + c.height / 2) - (hr.y + hr.height / 2) : null, lx: lab.x - ir.x, av: !!hu?.querySelector('.g-avatar') }
    }))
    await p.keyboard.press('Escape'); await p.waitForTimeout(300)
    return r
  }
  const mm = await menu('mn-trigger'); const mi = await menu('mn2-trigger')
  ok(mm.length === 4, `GMenu mixto: cuatro elementos (${mm.length})`)
  const withSlot = mm.filter((m) => m.hw != null)
  ok(withSlot.length === 3 && withSlot.every((m) => near(m.hw, 20, 0.01) && near(m.hh, 20, 0.01)), `GMenu mixto: todos los huecos no vacíos a space × 5 (${withSlot.map((m) => m.hw)})`)
  ok(withSlot.filter((m) => m.av).every((m) => near(m.cw, 20, 0.01) && Math.abs(m.dx) < 0.01 && Math.abs(m.dy) < 0.01), 'GMenu mixto: avatar entero en su hueco')
  ok(withSlot.filter((m) => !m.av).every((m) => near(m.cw, 18, 0.01) && Math.abs(m.dx) < 0.01 && Math.abs(m.dy) < 0.01), `GMenu mixto: el icono conserva su tamaño (18) centrado (${withSlot.filter((m) => !m.av).map((m) => m.cw)})`)
  ok(withSlot.every((m) => near(m.lx, withSlot[0].lx, 0.01)), `GMenu mixto: etiquetas alineadas (${withSlot.map((m) => m.lx)})`)
  ok(mm.every((m) => near(m.h, mi[0].h, 0.01)), `GMenu: alto del elemento sin cambio (${mm.map((m) => m.h)} vs ${mi[0]?.h})`)
  const miSlot = mi.filter((m) => m.hw != null)
  ok(miSlot.length === 2 && miSlot.every((m) => near(m.hw, 18, 0.01) && near(m.cw, 18, 0.01)), `GMenu solo iconos: hueco e icono sin cambio (18) (${miSlot.map((m) => m.hw)})`)

  // 10 · GBadge en el contorno a 45° (LTR y RTL); esquina en square
  const badge = () => p.evaluate(() => [...document.querySelectorAll('#status [data-pl]')].map((w) => {
    const an = w.classList.contains('g-badge-anchor') ? w : w.closest('.g-badge-anchor') ?? w.querySelector('.g-badge-anchor') ?? w
    const a = an.querySelector('.g-avatar').getBoundingClientRect(); const bd = an.querySelector(':scope > .g-badge').getBoundingClientRect()
    return { pl: w.dataset.pl, shape: w.dataset.shape, dx: (bd.x + bd.width / 2) - (a.x + a.width / 2), dy: (bd.y + bd.height / 2) - (a.y + a.height / 2), r: a.width / 2 }
  }))
  for (const dir of ['ltr', 'rtl']) {
    await p.selectOption('#t-dir', dir); await p.waitForTimeout(150)
    const bs = await badge()
    ok(bs.length === 7, `GBadge ${dir}: siete anclas (${bs.length})`)
    for (const x of bs) {
      const sx = (x.pl.endsWith('end') ? 1 : -1) * (dir === 'rtl' ? -1 : 1), sy = x.pl.startsWith('bottom') ? 1 : -1
      if (x.shape.startsWith('circle')) {
        ok(Math.abs(Math.hypot(x.dx, x.dy) - x.r) <= 1 && Math.abs(Math.abs(x.dx) - Math.abs(x.dy)) <= 1 && Math.sign(x.dx) === sx && Math.sign(x.dy) === sy,
          `GBadge ${dir} ${x.shape} ${x.pl}: centro en el contorno a 45° (|d| − r = ${(Math.hypot(x.dx, x.dy) - x.r).toFixed(2)}, dx ${x.dx.toFixed(2)}, dy ${x.dy.toFixed(2)})`)
      } else {
        ok(near(Math.abs(x.dx), x.r, 1) && near(Math.abs(x.dy), x.r, 1) && Math.sign(x.dx) === sx && Math.sign(x.dy) === sy, `GBadge ${dir} square: en la esquina (dx ${x.dx.toFixed(2)}, dy ${x.dy.toFixed(2)})`)
      }
    }
  }
  ok(await p.evaluate(() => document.querySelector('[data-test="size-ini-md"] .g-avatar__initials').textContent === 'AL' && document.querySelector('[data-test="size-ini-md"]').getBoundingClientRect().width === 32), 'RTL: el avatar no cambia y «AL» no se invierte')
  await p.selectOption('#t-dir', 'ltr')

  // 11 · Oscuro con el control de página (neutro)
  await p.selectOption('#t-scheme', 'dark'); await p.waitForTimeout(150)
  const dk = await p.evaluate(() => { const a = document.querySelector('[data-test="size-ini-md"]'); return window.__contrast(getComputedStyle(a).color, getComputedStyle(a).backgroundColor) })
  ok(dk >= 4.5, `neutro en oscuro: ${dk.toFixed(2)}`)
  await p.context().close()

  // 12 · Movimiento reducido: sin fundido, sin asentamiento, sin morfo
  const pr = await open({ reducedMotion: 'reduce' })
  const rm = await pr.evaluate(() => { const a = document.querySelector('[data-test=img-ok]'); const im = a.querySelector('img'); const fb = a.querySelector(':scope > :not(img)'); return [a, im, fb].map((e) => getComputedStyle(e).transitionDuration).concat(getComputedStyle(im).scale) })
  ok(rm.slice(0, 3).every((d) => /^0s(, 0s)*$/.test(d)) && rm[3] === 'none', `movimiento reducido: sin transiciones ni escala (${rm})`)
  pr.releaseSlow(); await pr.context().close()

  // 13 · 320px
  const p3 = await open({ width: 320 })
  const sw = await p3.evaluate(() => document.scrollingElement.scrollWidth)
  ok(sw <= 321, `320px: ancho de página ${sw}`)
  p3.releaseSlow(); await p3.context().close()

  ok(errs.length === 0, `consola: ${errs.slice(0, 5).join(' | ')}`)
  await b.close()
}
server.close()
for (const i of info) console.log('·', i)
for (const f of fails) console.log('FALLA', f)
console.log(`\nTOTAL ${total - failed}/${total}`)
process.exit(failed ? 1 : 0)
