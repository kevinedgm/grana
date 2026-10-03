// Verificación de coco sobre el banco de GFormSection (design/lab/form-section/estilo-banco.html), con el CSS real
// (GFormSection.css de dist/ y de src/ dentro de grana.components) y los componentes reales de dist/.
// Mide: análisis estático (sin literales ni respaldos, sin @layer, sin !important, propiedades lógicas, hover en
// @media (hover: hover), tokens existentes, sin --g-divider-inset propio; :disabled heredado de una agregable que se quita
// excluido en GBtn, GCheckboxGroup, GFieldGroup y GHelper); sin transición al cargar; plegada y sin agregar sin hueco
// (margen = −gap propio, altura 0, hidden, inert); Δ0 del botón y del desplazamiento en cada cuadro al abrir y plegar (a
// media vista, pegado arriba, RTL, al lado) y al agregar; intermedios de altura y opacidad; is-instant sin transición;
// movimiento reducido; chevron (dirección en LTR y RTL, giro, sin transición reducido); tipografía del título igual a la de
// la fija; sangría del texto en collapsible; divider centrado ±0.5px con el ritmo 40/35/30 dentro y 40 fuera, sin línea en
// la primera, plegadas y abiertas; L9 a 320 (Fase 1 real y collapsible): título ≥ space × 40 y acciones abajo al inicio;
// al lado: 1 : 2, título alineado con la primera etiqueta (±1px); 320 sin desborde con todo abierto; readonly sin hueco;
// anillo de foco; objetivo del botón ≥ 24px (44px con puntero grueso); contraste de título, chevron, estado, resumen y
// descripción en el tema por defecto y los once generados, claro y oscuro; forced-colors (Chromium); consola limpia.
// Ejecutar desde la raíz del repo (tras `npm run build`): node design/lab/form-section/estilo-verificar.mjs
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
const BASE = `http://127.0.0.1:${server.address().port}/design/lab/form-section/estilo-banco.html`

const GEN = ['amazon', 'apple', 'caracol-purpura', 'github', 'grana', 'linear', 'lustre', 'medium', 'notion', 'spotify', 'stripe']
let total = 0, failed = 0
const fails = []
let ENGINE = 'static'
const ok = (cond, msg) => { total++; if (!cond) { failed++; fails.push(`[${ENGINE}] ${msg}`) } if (args.verbose) console.log(cond ? 'ok ' : 'NO ', ENGINE, msg) }
const near = (a, b, t = 1) => Math.abs(a - b) <= t
const info = []

/* ---------- 0 · Análisis estático ---------- */
{
  const read = (f) => readFile(join(ROOT, f), 'utf8')
  const strip = (c) => c.replace(/\/\*[\s\S]*?\*\//g, '')
  const css = strip(await read('packages/vue/src/components/GFormSection/GFormSection.css'))
  ok(!/#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|lab|lch)\(/.test(css), 'CSS: color literal')
  ok(!/var\(\s*--[\w-]+\s*,/.test(css), 'CSS: var() con valor de respaldo')
  ok(!/@layer/.test(css), 'CSS: @layer en el archivo')
  ok(!/!important/.test(css), 'CSS: !important')
  const vars = [...css.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1])
  ok(vars.every((v) => v.startsWith('--g-') || v.startsWith('--_')), 'CSS: var() que no es --g-* ni --_*')
  const badPx = [...css.matchAll(/(-?\d*\.?\d+)(px|ms|s|rem|em)\b/g)].map((m) => m[0]).filter((p) => !['24px', '44px', '0s'].includes(p))
  ok(!badPx.length, 'CSS: medidas o duraciones literales (solo 24px y 44px) ' + badPx)
  ok(!/\b(?:left|right)\s*:|(?:margin|padding|border)-(?:left|right|top|bottom)\b|text-align:\s*(?:left|right)/.test(css), 'CSS: solo propiedades lógicas')
  const hovers = [...css.matchAll(/:hover/g)].length
  const hoverBlock = (css.match(/@media \(hover: hover\) \{[\s\S]*?\n\}/) || [''])[0]
  ok(hovers > 0 && (hoverBlock.match(/:hover/g) || []).length === hovers, 'CSS: todo :hover dentro de @media (hover: hover)')
  ok(/@media \(prefers-reduced-motion: reduce\)/.test(css) && /@media \(prefers-reduced-motion: no-preference\)/.test(css), 'CSS: bloques de movimiento')
  ok(/@media \(forced-colors: active\)/.test(css) && /@media \(pointer: coarse\)/.test(css), 'CSS: forced-colors y pointer: coarse')
  ok(/--g-duration-slow/.test(css) && /--g-duration-fast/.test(css) && /--g-color-danger-text/.test(css), 'CSS: --g-duration-slow, --g-duration-fast y --g-color-danger-text (#291)')
  ok(!/--g-divider-inset/.test(css), 'CSS: no redefine ni lee --g-divider-inset (#290, mapa de anfitrionas vacío)')
  ok(!/accent|brand|--g-color-active|--g-color-primary/.test(css), 'CSS: sin accent, brand, primary ni active')
  ok(!/[a-z-]+:\s*-?\d*\.?\d+(?:fr)?\s*;/.test(css.replace(/--_d:\s*0?\.\d+;|--_d:\s*1;|grid-row:\s*[12];|grid-column:\s*[12];|opacity:\s*[01];|margin(?:-block-start)?:\s*0;|padding:\s*0;|border:\s*0;|min-(?:inline|block)-size:\s*0;|gap:\s*0 |inset-inline:\s*0;|grid-template-rows:\s*[01]fr;/g, '')), 'CSS: sin números sueltos fuera de densidad, rejilla, opacidad y reinicios')
  const defaults = await read('packages/vue/src/styles/defaults.css')
  const defined = new Set([...defaults.matchAll(/(--g-[a-z0-9-]+)\s*:/g)].map((m) => m[1]))
  const missing = [...new Set(vars.filter((v) => v.startsWith('--g-') && !defined.has(v)))]
  ok(!missing.length, 'CSS: tokens que no existen en defaults.css ' + missing)
  ok(!/--g-[a-z0-9-]+\s*:/.test(css), 'CSS: no declara tokens --g-* (#291: ninguno nuevo)')
  const A = ':where(:not(.g-form-section--mode-addable:not(.is-open) > .g-form-section__panel *))'
  const W = ':where(:not(.g-form-reveal:not(.is-open) *))'
  for (const [f, n] of [['GBtn/GBtn.css', 4], ['GCheckboxGroup/GCheckboxGroup.css', 2], ['GFieldGroup/GFieldGroup.css', 1], ['GHelper/GHelper.css', 1]]) {
    const c = strip(await read('packages/vue/src/components/' + f))
    ok(c.split(W + A).length - 1 === n && c.split(W).length - 1 === n, `${f}: los ${n} :disabled heredados excluyen también el panel de una agregable sin agregar`)
  }
}

/* ---------- Funciones de página ---------- */
const PAGE_HELPERS = () => {
  const parse = (s) => {
    let m = s.match(/rgba?\(([^)]+)\)/)
    if (m) { const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p[3] ?? 1] }
    m = s.match(/color\(srgb ([^)]+)\)/)
    if (m) { const p = m[1].split(/[\s/]+/).filter(Boolean).map(Number); return [p[0] * 255, p[1] * 255, p[2] * 255, p[3] ?? 1] }
    return null
  }
  const cv = document.createElement('canvas').getContext('2d', { willReadFrequently: true })
  const rgba = (s) => { const d = parse(s); if (d) return d; cv.clearRect(0, 0, 1, 1); cv.fillStyle = '#000'; cv.fillStyle = s; cv.fillRect(0, 0, 1, 1); const x = cv.getImageData(0, 0, 1, 1).data; return [x[0], x[1], x[2], x[3] / 255] }
  const over = (t, b) => { const a = t[3]; return [t[0] * a + b[0] * (1 - a), t[1] * a + b[1] * (1 - a), t[2] * a + b[2] * (1 - a), 1] }
  const bgOf = (el) => {
    const layers = []
    for (let n = el; n; n = n.parentElement) { const c = rgba(getComputedStyle(n).backgroundColor); if (c[3] > 0) { layers.push(c); if (c[3] >= 1) break } }
    let base = rgba(getComputedStyle(document.body).backgroundColor)
    if (base[3] < 1) base = over(base, [255, 255, 255, 1])
    for (let i = layers.length - 1; i >= 0; i--) base = over(layers[i], base)
    return base
  }
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]) }
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return +((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)).toFixed(2) }
  window.__ratio = (el) => { const bg = bgOf(el); return ratio(over(rgba(getComputedStyle(el).color), bg), bg) }
  window.__contrast = () => {
    const pick = (sel) => [...document.querySelectorAll(sel)].filter((e) => e.getClientRects().length && getComputedStyle(e).visibility === 'visible')
    const min = (sel) => Math.min(...pick(sel).map(__ratio))
    return { title: min('.g-form-section__toggle-text'), chevron: min('.g-form-section__chevron'), status: min('.g-form-section__status'),
      summary: min('.g-form-section__summary-text'), desc: min('.g-form-section__description'), n: pick('.g-form-section__status').length }
  }
  window.__S = (id) => window.__sections.get(id)
  window.__frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
  window.__st = (id) => { const sec = document.getElementById(id); const p = sec.querySelector(':scope > .g-form-section__panel'); const cs = getComputedStyle(p); const body = p.firstElementChild
    const head = sec.querySelector(':scope > .g-form-section__header, :scope > .g-form-section__add')
    return { inert: p.inert, disabled: body.disabled === true, vis: cs.visibility, op: +cs.opacity, h: p.getBoundingClientRect().height, mt: parseFloat(cs.marginBlockStart),
      gap: parseFloat(getComputedStyle(sec).rowGap), ovf: getComputedStyle(body).overflowY, anim: sec.classList.contains('is-animating'), open: sec.classList.contains('is-open'),
      secH: sec.getBoundingClientRect().height, headH: head ? head.getBoundingClientRect().height : 0 } }
  // Pausa las transiciones del panel en una fracción de la de altura (o de la de opacidad si no hay altura)
  window.__at = (id, frac) => { const el = document.getElementById(id).querySelector(':scope > .g-form-section__panel'); const as = el.getAnimations()
    const live = as.filter((a) => a.playState !== 'finished' && a.playState !== 'idle'); const L = live.length ? live : as
    const main = [...L].reverse().find((a) => a.transitionProperty === 'grid-template-rows') || [...L].reverse().find((a) => a.transitionProperty === 'opacity')
    if (!main) return null; const t = main.effect.getComputedTiming(); const at = (t.delay || 0) + t.duration * frac
    L.forEach((a) => { a.pause(); a.currentTime = at }); return L.map((a) => a.transitionProperty) }
  window.__finishAll = () => document.getAnimations().forEach((a) => { try { a.finish() } catch {} })
  window.__track = (sel, ms) => new Promise((res) => {
    const el = document.querySelector(sel); const r0 = el.getBoundingClientRect(); const s0 = scrollY
    let dt = 0, dl = 0, ds = 0, n = 0; const t0 = performance.now()
    ;(function f() { const r = el.isConnected ? el.getBoundingClientRect() : r0; dt = Math.max(dt, Math.abs(r.top - r0.top)); dl = Math.max(dl, Math.abs(r.left - r0.left)); ds = Math.max(ds, Math.abs(scrollY - s0)); n++
      if (performance.now() - t0 < ms) requestAnimationFrame(f); else res({ dt, dl, ds, n }) })()
  })
  // Lo de debajo de la sección: salto máximo entre dos cuadros (informativo)
  window.__jump = (sel, ms) => new Promise((res) => {
    const el = document.querySelector(sel); let prev = el.getBoundingClientRect().top, max = 0; const t0 = performance.now()
    ;(function f() { const t = el.getBoundingClientRect().top; max = Math.max(max, Math.abs(t - prev)); prev = t; if (performance.now() - t0 < ms) requestAnimationFrame(f); else res(max) })()
  })
  // Dirección de la punta del chevron (chevron-right apunta a +x): T·R·S de las propiedades individuales
  window.__dir = (id) => { const g = document.querySelector('#' + id + ' .g-form-section__chevron > .g-icon'); const cs = getComputedStyle(g)
    const r = cs.rotate === 'none' ? 0 : parseFloat(cs.rotate) * Math.PI / 180; const s = cs.scale === 'none' ? [1, 1] : cs.scale.split(' ').map(Number)
    const sx = s[0], v = [sx * 1, 0]; const x = v[0] * Math.cos(r) - v[1] * Math.sin(r), y = v[0] * Math.sin(r) + v[1] * Math.cos(r)
    return Math.abs(x) > Math.abs(y) ? (x > 0 ? 'right' : 'left') : (y > 0 ? 'down' : 'up') }
  // Valor resuelto de un token de longitud (los hay en calc()): ancho de una sonda
  window.__len = (tok) => { const d = document.createElement('div'); d.style.cssText = 'position:absolute;visibility:hidden;inline-size:var(' + tok + ')'; document.body.append(d); const w = d.getBoundingClientRect().width; d.remove(); return w }
  window.__rtl = (el) => getComputedStyle(el).direction === 'rtl'
  window.__start = (el) => { const r = el.getBoundingClientRect(); return __rtl(el) ? r.right : r.left }
}

const open = async (b, opts = {}, q = '') => {
  const ctx = await b.newContext({ viewport: { width: 1400, height: 1000 }, ...opts })
  const p = await ctx.newPage()
  const errs = []
  p.on('console', (m) => { if (['error', 'warning'].includes(m.type())) errs.push(m.text()) })
  p.on('pageerror', (e) => errs.push(String(e)))
  await p.goto(BASE + q)
  await p.waitForFunction(() => window.__sections && window.__sections.size >= 40)
  await p.evaluate(PAGE_HELPERS)
  await p.evaluate(() => document.fonts.ready)
  await p.waitForTimeout(250)
  p.errs = errs
  return p
}
const settled = (p, id) => p.waitForFunction((i) => !window.__sections.get(i).animating.value, id, { timeout: 4000 })
const allTo = async (p, v) => { await p.evaluate((x) => __all(x), v); await p.waitForTimeout(60); await p.evaluate(() => __finishAll()); await p.waitForTimeout(150) }
const COLLAPSIBLE = ['m-s2', 'm-s3', 'r-s2', 'r-s3', 's-s2', 's-s3', 't-s2', 'n-s2', 'ro-s2', 'dv-default-1', 'dv-out-1', 'dv-mix-3', 'l9-col']
const ADDABLE = ['m-s4', 'r-s4', 's-s4', 't-s4', 'n-s4', 'dv-mix-2']

for (const engine of ENGINES) {
  ENGINE = engine
  const b = await pw[engine].launch()
  let p = await open(b)

  /* 1 · Carga, plegada y sin agregar sin hueco */
  ok(await p.evaluate(() => document.getAnimations().filter((a) => a.effect?.target?.classList?.contains('g-form-section__panel')).length) === 0, 'al cargar no corre ninguna transición de panel (plan 012)')
  for (const id of [...COLLAPSIBLE, ...ADDABLE]) {
    const s = await p.evaluate((i) => __st(i), id)
    ok(s.inert && s.vis === 'hidden' && s.op === 0 && s.h === 0 && !s.open, `${id} cerrado: inert, hidden, altura 0 (${JSON.stringify(s)})`)
    if (id.startsWith('s-')) ok(s.mt === 0, `${id} al lado, cerrado: sin margen (el panel no va debajo del encabezado)`)
    else ok(near(s.mt, -s.gap, 0.01) && s.gap > 0, `${id} cerrado: margen = −gap propio (${s.mt} vs ${-s.gap})`)
    ok(near(s.secH, s.headH, 0.5), `${id} cerrado: la sección mide su encabezado, sin hueco (${s.secH.toFixed(2)} vs ${s.headH.toFixed(2)})`)
  }
  for (const id of ADDABLE) ok((await p.evaluate((i) => __st(i), id)).disabled, `${id} sin agregar: fieldset disabled`)
  {
    const g = await p.evaluate(() => { const a = document.getElementById('m-s2'), b = document.getElementById('m-s3'), f = document.getElementById('m-form')
      return { d: b.getBoundingClientRect().top - a.getBoundingClientRect().bottom, gap: parseFloat(getComputedStyle(f).rowGap) } })
    ok(near(g.d, g.gap, 0.5), `plegada → siguiente sección = el aire de sección del formulario (${g.d.toFixed(2)} vs ${g.gap})`)
  }

  /* 2 · Tipografía y sangría del texto (collapsible) */
  {
    const t = await p.evaluate(() => { const st = document.querySelector('#m-s1 .g-form-section__title'), col = document.querySelector('#m-s2 .g-form-section__title'), tg = col.querySelector('.g-form-section__toggle')
      const f = (e) => { const c = getComputedStyle(e); return [c.fontSize, c.fontWeight, c.lineHeight, c.letterSpacing, c.fontFamily, c.color].join('|') }
      return { st: f(st), tg: f(tg), txt: f(col.querySelector('.g-form-section__toggle-text')), hs: st.getBoundingClientRect().height, hc: col.getBoundingClientRect().height, tgH: tg.getBoundingClientRect().height,
        bg: getComputedStyle(tg).backgroundColor, border: getComputedStyle(tg).borderTopWidth, pad: getComputedStyle(tg).paddingTop } })
    ok(t.st === t.tg && t.st === t.txt, `el botón y su texto tienen la tipografía y el color del título de una fija (${t.st} | ${t.tg})`)
    ok(near(t.hs, t.hc, 0.01) && near(t.tgH, t.hc, 0.01), `título plegable de una línea = título fijo (${t.hc} vs ${t.hs}; botón ${t.tgH})`)
    ok(/rgba\(0, 0, 0, 0\)|transparent/.test(t.bg) && t.border === '0px' && t.pad === '0px', 'el botón no dibuja caja (sin fondo, borde ni relleno)')
    for (const id of ['m-s2', 'r-s2', 'm-s3', 'r-s3']) {
      const a = await p.evaluate((i) => { const s = document.getElementById(i); const chev = s.querySelector('.g-form-section__chevron'); const txt = s.querySelector('.g-form-section__toggle-text')
        const lead = s.querySelector('.g-form-section__toggle .g-form-section__lead'); const rtl = __rtl(s)
        const end = (e) => { const r = e.getBoundingClientRect(); return rtl ? r.left : r.right }
        const sp = parseFloat(getComputedStyle(s).getPropertyValue('--g-space-2'))
        const cr = chev.getBoundingClientRect(), ir = chev.firstElementChild.getBoundingClientRect(), tr = txt.getBoundingClientRect()
        return { rtl, after: (lead || txt) && __start(lead || txt), chevEnd: end(chev), sp, desc: s.querySelector(':scope > .g-form-section__header > .g-form-section__description') ? __start(s.querySelector(':scope > .g-form-section__header > .g-form-section__description')) : null, sum: __start(s.querySelector('.g-form-section__summary')),
          chevMid: cr.top + cr.height / 2, iconMid: ir.top + ir.height / 2, line1Mid: tr.top + parseFloat(getComputedStyle(txt).lineHeight) / 2, iconW: ir.width, fs: parseFloat(getComputedStyle(txt).fontSize) } }, id)
      const dir = a.rtl ? -1 : 1
      ok(near((a.after - a.chevEnd) * dir, a.sp, 0.5), `${id}: chevron → texto (o lead) = space-2 (${((a.after - a.chevEnd) * dir).toFixed(2)})`)
      ok((a.desc === null || near(a.desc, a.after, 0.5)) && near(a.sum, a.after, 0.5), `${id}${a.rtl ? ' (RTL)' : ''}: resumen y descripción alineados con el texto del título (${a.sum.toFixed(1)}, ${a.desc?.toFixed(1)} vs ${a.after.toFixed(1)})`)
      ok(near(a.iconMid, a.line1Mid, 0.75) && near(a.iconW, a.fs, 0.5), `${id}: chevron de 1em del título, centrado en su primera línea (${a.iconMid.toFixed(2)} vs ${a.line1Mid.toFixed(2)}; ${a.iconW})`)
    }
  }

  /* 3 · Chevron: dirección, giro y transición */
  {
    const d = await p.evaluate(() => ({ ltr: __dir('m-s2'), rtl: __dir('r-s2') }))
    ok(d.ltr === 'right' && d.rtl === 'left', `chevron plegado: apunta al texto (LTR ${d.ltr}, RTL ${d.rtl})`)
    await p.evaluate(() => { __S('m-s2').setOpen(true); __S('r-s2').setOpen(true) })
    await p.evaluate(() => new Promise((r) => requestAnimationFrame(r)))
    const tr = await p.evaluate(() => document.querySelector('#m-s2 .g-form-section__chevron > .g-icon').getAnimations().map((a) => [a.transitionProperty, a.effect.getComputedTiming().duration]))
    const fast = await p.evaluate(() => { const v = getComputedStyle(document.documentElement).getPropertyValue('--g-duration-fast').trim(); return /ms$/.test(v) ? parseFloat(v) : parseFloat(v) * 1000 })
    ok(tr.length === 1 && tr[0][0] === 'rotate' && near(tr[0][1], fast, 1), `chevron: gira con --g-duration-fast (${JSON.stringify(tr)})`)
    await p.evaluate(() => __finishAll()); await settled(p, 'm-s2'); await settled(p, 'r-s2')
    const o = await p.evaluate(() => ({ ltr: __dir('m-s2'), rtl: __dir('r-s2') }))
    ok(o.ltr === 'down' && o.rtl === 'down', `chevron abierto: abajo (LTR ${o.ltr}, RTL ${o.rtl})`)
    await p.evaluate(() => { __S('m-s2').setOpen(false); __S('r-s2').setOpen(false) }); await p.waitForTimeout(30); await p.evaluate(() => __finishAll())
    await settled(p, 'm-s2'); await settled(p, 'r-s2')
    const nested = await p.evaluate(() => __dir('n-s2'))
    ok(nested === 'right', 'el chevron de otra sección no gira (selector acotado a su encabezado)')
  }

  /* 4 · Δ0 del encabezado y del desplazamiento en cada cuadro (a media vista, pegado arriba, RTL, al lado) */
  for (const [id, where] of [['m-s2', 'center'], ['m-s3', 'start'], ['r-s2', 'center'], ['s-s2', 'center'], ['s-s3', 'start']]) {
    for (const v of [true, false]) {
      await p.evaluate(([i, w]) => document.getElementById(i).scrollIntoView({ block: w }), [id, where])
      await p.waitForTimeout(60)
      const sel = `#${id}-toggle`
      const tr = p.evaluate((s) => __track(s, 450), sel)
      await p.evaluate(([i, x]) => __S(i).setOpen(x), [id, v])
      const t = await tr
      ok(t.dt === 0 && t.dl === 0 && t.ds === 0 && t.n > 5, `${id} (${where}) ${v ? 'abrir' : 'plegar'}: botón Δ0 en cada cuadro y Δscroll 0 (${JSON.stringify(t)})`)
      await settled(p, id)
    }
  }
  // Agregar y quitar: el encabezado ocupa el sitio de «Agregar …» (Δ0 de la raíz)
  for (const id of ['m-s4', 's-s4']) {
    await p.evaluate((i) => document.getElementById(i).scrollIntoView({ block: 'center' }), id); await p.waitForTimeout(60)
    for (const v of [true, false]) {
      const tr = p.evaluate((s) => __track(s, 450), '#' + id)
      await p.evaluate(([i, x]) => __S(i).setAdded(x), [id, v])
      const t = await tr
      ok(t.dt === 0 && t.ds === 0, `${id} ${v ? 'agregar' : 'quitar'}: la sección Δ0 y Δscroll 0 (${JSON.stringify(t)})`)
      await settled(p, id)
      const a = await p.evaluate((i) => { const s = document.getElementById(i); const head = s.querySelector(':scope > .g-form-section__header, :scope > .g-form-section__add'); return near(s.getBoundingClientRect().top, head.getBoundingClientRect().top) ; function near(a, b) { return Math.abs(a - b) < 0.5 } }, id)
      ok(a, `${id}: el encabezado o «Agregar …» empieza en el borde superior de la sección`)
    }
  }
  // Informativo: la línea de estado aparece y desaparece en el acto (v-if): en el primer cuadro, lo de debajo se mueve su altura
  {
    const first = (v) => p.evaluate(async (x) => { document.getElementById('m-s2').scrollIntoView({ block: 'center' }); const nx = document.getElementById('m-s3'); const t0 = nx.getBoundingClientRect().top + scrollY; __S('m-s2').setOpen(x)
      await new Promise((r) => requestAnimationFrame(r)); const panel = document.querySelector('#m-s2 > .g-form-section__panel')
      panel.getAnimations().forEach((a) => { a.pause(); a.currentTime = 0 }); const d = nx.getBoundingClientRect().top + scrollY - t0; __finishAll(); return d }, v)
    const jo = await first(true); await settled(p, 'm-s2'); const jc = await first(false); await settled(p, 'm-s2')
    const sumH = await p.evaluate(() => { const e = document.querySelector('#m-s2 .g-form-section__summary'); return e.getBoundingClientRect().height + parseFloat(getComputedStyle(e).marginBlockStart) })
    info.push(`[${engine}] primer cuadro, sección siguiente: abrir ${jo.toFixed(1)}px, plegar ${jc.toFixed(1)}px (línea de estado ${sumH.toFixed(1)}px)`)
  }

  /* 5 · Intermedios (pausados) */
  {
    const id = 'm-s2'
    await p.evaluate(() => __S('m-s2').setOpen(true)); await p.waitForTimeout(30); await p.evaluate(() => __finishAll()); await settled(p, id)
    const H = (await p.evaluate((i) => __st(i), id)).h
    const so = await p.evaluate((i) => __st(i), id)
    ok(so.open && !so.inert && so.vis === 'visible' && so.op === 1 && so.mt === 0 && so.ovf === 'visible' && H > 80, `abierta y asentada: visible, margen 0, overflow visible (${JSON.stringify(so)})`)
    await p.evaluate(() => __S('m-s2').setOpen(false)); await settled(p, id)
    await p.evaluate(() => __S('m-s2').setOpen(true))
    const props = await p.evaluate((i) => __at(i, 0.5), id)
    ok(props && props.includes('grid-template-rows') && props.some((x) => /^margin-(block-start|top)$/.test(x)) && props.includes('opacity'), `abrir: altura, margen y opacidad (${props})`)
    let s = await p.evaluate((i) => __st(i), id)
    ok(s.h > 1 && s.h < H - 1 && s.anim && s.ovf === 'hidden' && !s.inert && s.mt < 0 && s.mt > -s.gap, `abrir a la mitad: altura (${s.h.toFixed(1)} de ${H.toFixed(1)}) y margen (${s.mt.toFixed(2)}) intermedios, recortado, sin inert`)
    await p.evaluate((i) => __at(i, 0.75), id)
    s = await p.evaluate((i) => __st(i), id)
    ok(s.op > 0 && s.op < 1 && s.vis === 'visible', `abrir a 3/4: opacidad intermedia (${s.op})`)
    await p.evaluate(() => __finishAll()); await settled(p, id)
    await p.evaluate(() => __S('m-s2').setOpen(false))
    await p.evaluate((i) => __at(i, 0.25), id)
    s = await p.evaluate((i) => __st(i), id)
    ok(s.op > 0 && s.op < 1 && s.vis === 'visible' && s.h > 1 && s.h < H - 1 && s.inert, `plegar a 1/4: visible, opacidad (${s.op}) y altura (${s.h.toFixed(1)}) intermedias, inert en el acto`)
    await p.evaluate(() => __finishAll()); await settled(p, id)
  }

  /* 6 · is-instant: abrir para llevar a un campo, sin transición, en un cuadro */
  {
    const id = 'm-s3'
    await p.evaluate(() => __S('m-s3').openNow())
    await p.evaluate(() => new Promise((r) => requestAnimationFrame(r)))
    const r = await p.evaluate(() => { const s = document.getElementById('m-s3'); return { inst: s.classList.contains('is-instant'), anims: s.querySelector('.g-form-section__panel').getAnimations().length + s.querySelector('.g-form-section__chevron > .g-icon').getAnimations().length, st: __st('m-s3'), dir: __dir('m-s3') } })
    ok(r.inst && r.anims === 0, `is-instant: sin transiciones de panel ni de chevron (${r.anims})`)
    ok(r.st.op === 1 && r.st.vis === 'visible' && r.st.mt === 0 && r.st.h > 40 && r.dir === 'down', `is-instant: abierta en el primer cuadro (${JSON.stringify(r.st)})`)
    await p.waitForTimeout(80)
    const after = await p.evaluate(() => ({ inst: document.getElementById('m-s3').classList.contains('is-instant'), n: document.getElementById('m-s3').querySelector('.g-form-section__panel').getAnimations().length }))
    ok(!after.inst && after.n === 0, 'is-instant se retira tras el primer pintado sin arrancar ninguna transición')
    await p.evaluate(() => __S('m-s3').setOpen(false)); await p.waitForTimeout(30); await p.evaluate(() => __finishAll()); await settled(p, id)
  }

  /* 7 · Quitar: nada salta a gris en el primer cuadro del fundido (el fieldset disabled ya está puesto) */
  {
    await p.evaluate(() => __S('m-s4').setAdded(true)); await p.waitForTimeout(30); await p.evaluate(() => __finishAll()); await settled(p, 'm-s4')
    const look = () => p.evaluate(() => { const b = document.getElementById('m-validar'); const c = getComputedStyle(b); return [c.color, c.backgroundColor, c.borderTopColor, c.cursor].join('|') })
    const before = await look()
    await p.evaluate(() => __S('m-s4').setAdded(false)); await p.evaluate(() => new Promise((r) => requestAnimationFrame(r)))
    await p.evaluate(() => { const panel = document.querySelector('#m-s4 > .g-form-section__panel'); document.getAnimations().forEach((a) => { if (a.effect?.target === panel) { a.pause(); a.currentTime = 0 } else { try { a.finish() } catch {} } }) })
    const s = await p.evaluate(() => __st('m-s4'))
    const after = await look()
    ok(s.disabled && s.inert && s.op === 1, `quitar, primer cuadro: disabled e inert ya puestos, opacidad 1 (${JSON.stringify(s)})`)
    ok(before === after, `quitar: el GBtn de dentro no cambia de aspecto durante el fundido (${before} → ${after})`)
    await p.evaluate(() => __finishAll()); await settled(p, 'm-s4')
  }

  /* 8 · divider: ritmo y centrado (plegadas, abiertas), sin línea en la primera */
  const checkDividers = async (label) => {
    const rows = await p.evaluate(() => {
      const out = []
      for (const host of ['dv-default', 'dv-comfortable', 'dv-compact', 'dv-out', 'dv-mix', 'm-form', 's-form']) {
        const secs = [...document.getElementById(host).querySelectorAll(':scope > .g-form-section')].filter((s) => !s.hidden)
        const sg = __len('--g-form-section-gap')
        secs.forEach((s, i) => {
          const hr = s.querySelector(':scope > .g-form-section__divider'); if (!hr) return
          const r = hr.getBoundingClientRect(); const cs = getComputedStyle(hr)
          if (i === 0) { out.push({ host, i, first: true, shown: cs.display !== 'none' && r.height > 0 }); return }
          const prev = secs[i - 1].getBoundingClientRect(), cur = s.getBoundingClientRect()
          out.push({ host, i, dist: cur.top - prev.bottom, mid: (cur.top + prev.bottom) / 2, line: r.top + r.height / 2, w: r.width, sw: cur.width, bw: parseFloat(cs.borderTopWidth),
            d: parseFloat(getComputedStyle(s).getPropertyValue('--_d')), sg, color: cs.borderTopColor, border: getComputedStyle(document.documentElement).getPropertyValue('--g-color-border').trim() })
        })
      }
      return out
    })
    for (const r of rows) {
      if (r.first) { ok(!r.shown, `${label} ${r.host}: la primera sección no dibuja línea`); continue }
      ok(near(r.dist, r.sg * r.d, 1), `${label} ${r.host} #${r.i}: separación = section-gap × densidad (${r.dist.toFixed(2)} vs ${r.sg * r.d})`)
      ok(near(r.line, r.mid, 0.5), `${label} ${r.host} #${r.i}: línea centrada en el hueco (${r.line.toFixed(2)} vs ${r.mid.toFixed(2)})`)
      ok(r.bw >= 1 && near(r.w, r.sw, 0.5), `${label} ${r.host} #${r.i}: línea visible a todo el ancho de la sección (${r.bw}px, ${r.w.toFixed(1)} de ${r.sw.toFixed(1)})`)
    }
    return rows
  }
  {
    const rows = await checkDividers('plegadas')
    const ds = ['dv-default', 'dv-comfortable', 'dv-compact', 'dv-out'].map((h) => rows.find((r) => r.host === h && r.i === 1)?.dist.toFixed(1))
    ok(ds.join('/') === '40.0/35.0/30.0/40.0', `ritmo con divider: 40/35/30 dentro y 40 fuera (${ds.join('/')})`)
    await allTo(p, true)
    await checkDividers('abiertas')
    await allTo(p, false)
  }

  /* 9 · L9 a 320: título ≥ space × 40; acciones abajo, al inicio, tras la descripción */
  {
    const r = await p.evaluate(() => ['l9-real', 'l9-col', 'l9w-real'].map((id) => { const s = document.getElementById(id); const sp = parseFloat(getComputedStyle(s).getPropertyValue('--g-space-1'))
      const t = s.querySelector('.g-form-section__heading'); const tt = s.querySelector('.g-form-section__toggle-text') || s.querySelector('.g-form-section__title'); const a = s.querySelector('.g-form-section__actions'); const d = s.querySelector(':scope > .g-form-section__header > .g-form-section__description')
      const sum = s.querySelector('.g-form-section__summary')
      return { id, below: s.classList.contains('is-actions-below'), tw: t.getBoundingClientRect().width, min: sp * 40, lines: Math.round(tt.getBoundingClientRect().height / parseFloat(getComputedStyle(tt).lineHeight)),
        aTop: a.getBoundingClientRect().top, dBottom: d.getBoundingClientRect().bottom, aStart: __start(a), first: __start(a.firstElementChild), dStart: __start(d), sumStart: sum ? __start(sum) : null } }))
    for (const x of r) {
      ok(x.tw >= x.min, `${x.id}: el título dispone de al menos space × 40 (${x.tw.toFixed(1)} ≥ ${x.min}; ${x.lines} línea(s))`)
      if (x.id === 'l9w-real') { ok(!x.below, `${x.id} (480): la acción cabe al lado, sin is-actions-below`); continue }
      ok(x.below && x.aTop >= x.dBottom - 0.5, `${x.id} (320): is-actions-below, acciones debajo de la descripción (${x.aTop.toFixed(1)} vs ${x.dBottom.toFixed(1)})`)
      ok(near(x.aStart, x.dStart, 0.5), `${x.id}: acciones al inicio, alineadas con la descripción (${x.aStart.toFixed(1)} vs ${x.dStart.toFixed(1)})`)
    }
    // Lo que había antes (sin is-actions-below), para el registro: el título se partía
    const pre = await p.evaluate(() => { const s = document.getElementById('l9-real'); s.classList.remove('is-actions-below'); const t = s.querySelector('.g-form-section__heading'); const w = t.getBoundingClientRect().width; s.classList.add('is-actions-below'); return w })
    info.push(`[${engine}] L9: título de la Fase 1 real a 320 sin is-actions-below = ${pre.toFixed(1)}px; con ella = ${r[0].tw.toFixed(1)}px`)
    ok(pre < r[0].min, `L9: sin is-actions-below el título quedaba por debajo de space × 40 (${pre.toFixed(1)}): la medida es necesaria`)
  }

  /* 10 · Al lado: 1 : 2, título alineado con la primera etiqueta (±1px) */
  {
    const side = await p.evaluate(() => ['s-s1', 's-s2', 's-s3', 's-s4', 't-s1', 't-s2'].map((id) => document.getElementById(id).classList.contains('is-header-side')))
    ok(side.join() === 'true,true,true,true,false,false', `is-header-side: 1100 al lado, 720 arriba (${side})`)
    const addW = await p.evaluate(() => { const s = document.getElementById('s-s4'); return [s.querySelector('.g-form-section__add').getBoundingClientRect().width, s.getBoundingClientRect().width] })
    ok(near(addW[0], addW[1], 0.5), `al lado, sin agregar: «Agregar …» ocupa el ancho entero (${addW.map((x) => x.toFixed(1))})`)
    for (const id of ['s-s2', 's-s3']) { const s = await p.evaluate((i) => __st(i), id); ok(near(s.secH, s.headH, 0.5) && s.h === 0, `${id} al lado plegada: la fila mide lo que el encabezado (${s.secH.toFixed(1)} vs ${s.headH.toFixed(1)})`) }
    await allTo(p, true)
    for (const id of ['s-s1', 's-s2', 's-s3', 's-s4']) {
      const a = await p.evaluate((i) => { const s = document.getElementById(i); const h = s.querySelector(':scope > .g-form-section__header'); const b = s.querySelector('.g-form-section__body')
        const lab = b.querySelector('label, legend'); const t = s.querySelector('.g-form-section__title')
        const sg = __len('--g-form-section-gap')
        return { t: t.getBoundingClientRect().top, l: lab.getBoundingClientRect().top, hw: h.getBoundingClientRect().width, bw: b.getBoundingClientRect().width, gap: b.getBoundingClientRect().left - h.getBoundingClientRect().right, sg } }, id)
      ok(near(a.t, a.l, 1), `${id} al lado: título alineado con la primera etiqueta (${a.t.toFixed(2)} vs ${a.l.toFixed(2)})`)
      ok(near(a.bw / a.hw, 2, 0.02) && near(a.gap, a.sg, 0.5), `${id} al lado: columnas 1 : 2 (${a.hw.toFixed(1)} : ${a.bw.toFixed(1)}) separadas por el aire de sección (${a.gap.toFixed(1)})`)
    }
    const acts = await p.evaluate(() => { const s = document.getElementById('s-s2'); const a = s.querySelector('.g-form-section__actions'); const d = s.querySelector(':scope > .g-form-section__header > .g-form-section__description'); return { a: __start(a), d: __start(d), top: a.getBoundingClientRect().top, bot: d.getBoundingClientRect().bottom } })
    ok(near(acts.a, acts.d, 0.5) && acts.top >= acts.bot, `al lado: acciones debajo de la descripción y alineadas con ella (${acts.a.toFixed(1)} vs ${acts.d.toFixed(1)})`)
  }

  /* 11 · 320 con todo abierto y agregado: sin desborde */
  {
    const o = await p.evaluate(() => { const h = document.getElementById('n-host'); const t = [...h.querySelectorAll('.g-form-section__heading')].map((e) => e.getBoundingClientRect().width)
      return { sw: h.scrollWidth, cw: h.clientWidth, doc: document.documentElement.scrollWidth - document.documentElement.clientWidth, minT: Math.min(...t) } })
    ok(o.sw <= o.cw && o.doc <= 0, `320 con todo abierto y agregado: sin desborde (${JSON.stringify(o)})`)
    const below = await p.evaluate(() => ['n-s1', 'n-s2', 'n-s4'].map((id) => document.getElementById(id).classList.contains('is-actions-below')))
    const tw = await p.evaluate(() => ['n-s1', 'n-s2', 'n-s4'].map((id) => document.querySelector('#' + id + ' .g-form-section__heading').getBoundingClientRect().width))
    ok(tw.every((w) => w >= 160), `320: títulos con acciones ≥ space × 40 (${tw.map((x) => x.toFixed(0))}; below ${below})`)
    await allTo(p, false)
  }

  /* 12 · readonly: la agregable sin agregar no se pinta ni deja hueco */
  {
    const r = await p.evaluate(() => { const s = document.getElementById('ro-s4'); const f = document.getElementById('ro-form'); const last = document.getElementById('ro-s3')
      return { hidden: s.hidden, disp: getComputedStyle(s).display, end: f.getBoundingClientRect().bottom - last.getBoundingClientRect().bottom } })
    ok(r.hidden && r.disp === 'none' && near(r.end, 0, 0.5), `readonly: agregable sin agregar hidden, sin hueco al final (${JSON.stringify(r)})`)
    const add = await p.evaluate(() => { const a = document.querySelector('#m-s4 .g-form-section__add'); const btn = a.querySelector('.g-btn'); const d = a.querySelector('.g-form-section__description'); const sp = parseFloat(getComputedStyle(a).getPropertyValue('--g-space-2'))
      return { bw: btn.getBoundingClientRect().width, aw: a.getBoundingClientRect().width, gap: d.getBoundingClientRect().top - btn.getBoundingClientRect().bottom, sp, bs: __start(btn), ds: __start(d) } })
    ok(add.bw < add.aw - 50 && near(add.gap, add.sp, 0.5) && near(add.bs, add.ds, 0.5), `«Agregar …» de su tamaño, descripción debajo a space-2 y alineada (${JSON.stringify(add)})`)
  }

  /* 13 · Foco y objetivo */
  {
    await p.evaluate(() => { document.getElementById('m-s2').scrollIntoView({ block: 'center' }); document.getElementById('m-correo').focus() })
    await p.keyboard.press(engine === 'webkit' ? 'Alt+Tab' : 'Tab')   // WebKit en macOS: Tab no pasa por botones sin Alt
    const f = await p.evaluate(() => { const a = document.activeElement; const c = getComputedStyle(a); return { id: a.id, fv: a.matches(':focus-visible'), w: parseFloat(c.outlineWidth), s: c.outlineStyle, col: c.outlineColor, off: c.outlineOffset } })
    ok(f.id === 'm-s2-toggle' && f.fv && f.w >= 2 && f.s === 'solid', `Tab lleva al botón del título con anillo visible (${JSON.stringify(f)})`)
    const t = await p.evaluate(() => { const h = document.getElementById('m-s1-title') || document.querySelector('#m-s4 .g-form-section__title'); return null })
    const hit = await p.evaluate(() => { const b = document.getElementById('m-s2-toggle'); const r = b.getBoundingClientRect(); const x = r.left + r.width / 2, y = r.top + r.height / 2
      const at = (dy) => document.elementFromPoint(x, y + dy); return { h: r.height, up: b.contains(at(-11.5)), down: b.contains(at(11.5)) } })
    ok(hit.h >= 24 && hit.up && hit.down, `objetivo del botón ≥ 24px (${JSON.stringify(hit)})`)
  }

  /* 14 · Contraste: título, chevron, estado, resumen y descripción (por defecto y once temas, claro y oscuro) */
  {
    const rows = []
    for (const theme of ['', ...GEN]) {
      for (const dark of [false, true]) {
        await p.evaluate(([t, d]) => new Promise((r) => { const l = document.getElementById('gen'); const href = t ? '../tema-oscuro/dark-color-presence/generated/' + t + '.css' : 'data:text/css,'
          document.documentElement.dataset.theme = d ? 'dark' : 'light'
          if (l.getAttribute('href') === href) return r(); l.onload = () => r(); l.onerror = () => r(); l.href = href; setTimeout(r, 1500) }), [theme, dark])
        await p.waitForTimeout(30)
        const c = await p.evaluate(() => __contrast())
        const name = `${theme || 'defecto'}${dark ? ' oscuro' : ''}`
        rows.push(`${name}: ${c.status}/${c.summary}`)
        ok(c.n >= 4 && c.title >= 4.5 && c.status >= 4.5 && c.summary >= 4.5 && c.desc >= 4.5, `texto ≥ 4.5:1 · ${name} (título ${c.title}, estado ${c.status}, resumen ${c.summary}, descripción ${c.desc})`)
        ok(c.chevron >= 3, `chevron ≥ 3:1 · ${name} (${c.chevron})`)
      }
    }
    if (args.verbose || engine === ENGINES[0]) info.push(`[${engine}] contraste mínimo estado/resumen: ` + rows.join(' · '))
    await p.evaluate(() => { document.getElementById('gen').href = 'data:text/css,'; document.documentElement.dataset.theme = 'light' })
  }
  ok(!p.errs.length, 'consola limpia: ' + p.errs.join(' | '))
  await p.context().close()

  /* 15 · Movimiento reducido */
  p = await open(b, { reducedMotion: 'reduce' })
  {
    const id = 'm-s2'
    await p.evaluate(() => __S('m-s2').setOpen(true)); await p.evaluate(() => new Promise((r) => requestAnimationFrame(r)))
    const props = await p.evaluate(() => ({ panel: document.querySelector('#m-s2 > .g-form-section__panel').getAnimations().map((a) => a.transitionProperty), chev: document.querySelector('#m-s2 .g-form-section__chevron > .g-icon').getAnimations().length }))
    const s = await p.evaluate((i) => __st(i), id)
    ok(!props.panel.includes('grid-template-rows') && !props.panel.some((x) => /^margin/.test(x)) && props.panel.includes('opacity'), `reducido, abrir: sin altura ni margen, con fundido (${props.panel})`)
    ok(props.chev === 0, 'reducido: el chevron gira sin transición')
    ok(s.h > 40 && s.mt === 0 && s.vis === 'visible', `reducido, abrir: altura final en el primer cuadro (${s.h.toFixed(1)})`)
    await settled(p, id)
    await p.evaluate(() => __S('m-s2').setOpen(false))
    await p.evaluate((i) => __at(i, 0.5), id)
    const c = await p.evaluate((i) => __st(i), id)
    ok(c.vis === 'visible' && c.op > 0 && c.op < 1 && c.inert, `reducido, plegar: visible hasta que acaba el fundido (op ${c.op}, ${c.vis})`)
    await p.evaluate(() => __finishAll()); await settled(p, id)
    const e = await p.evaluate((i) => __st(i), id)
    ok(e.vis === 'hidden' && e.h === 0, 'reducido, plegada: hidden y altura 0')
    await p.evaluate(() => document.getElementById('m-s2').scrollIntoView({ block: 'center' }))
    const tr = p.evaluate(() => __track('#m-s2-toggle', 300))
    await p.evaluate(() => __S('m-s2').setOpen(true))
    const t = await tr
    ok(t.dt === 0 && t.ds === 0, `reducido: botón Δ0 (${JSON.stringify(t)})`)
  }
  ok(!p.errs.length, 'consola limpia (reducido): ' + p.errs.join(' | '))
  await p.context().close()

  /* 16 · Puntero grueso: 44px sin mover el título */
  {
    const ctx = await b.newContext({ viewport: { width: 1400, height: 1000 }, hasTouch: engine !== 'firefox' })
    const q = await ctx.newPage(); await q.goto(BASE); await q.waitForFunction(() => window.__sections && window.__sections.size >= 40); await q.waitForTimeout(250)
    const coarse = await q.evaluate(() => matchMedia('(pointer: coarse)').matches)
    if (coarse) {
      const hit = await q.evaluate(() => { const b = document.getElementById('m-s2-toggle'); b.scrollIntoView({ block: 'center' }); const r = b.getBoundingClientRect(); const x = r.left + r.width / 2, y = r.top + r.height / 2
        const at = (dy) => document.elementFromPoint(x, y + dy); return { h: r.height, up: b.contains(at(-21.5)), down: b.contains(at(21.5)), out: !b.contains(at(-23)) } })
      ok(hit.h < 44 && hit.up && hit.down && hit.out, `pointer: coarse: objetivo de 44px sin cambiar la caja del título (${JSON.stringify(hit)})`)
    } else info.push(`[${engine}] pointer: coarse no emulado: sin medida de 44px`)
    await ctx.close()
  }

  /* 17 · forced-colors (solo Chromium la emula) */
  if (engine === 'chromium') {
    p = await open(b, { forcedColors: 'active' })
    await allTo(p, false)
    const fc = await p.evaluate(() => { const tg = document.getElementById('m-s2-toggle'); const ch = tg.querySelector('.g-form-section__chevron'); const svg = ch.firstElementChild
      const hr = document.querySelector('#m-s2 > .g-form-section__divider'); const st = document.querySelector('#m-s2 .g-form-section__status')
      return { fc: matchMedia('(forced-colors: active)').matches, chev: getComputedStyle(ch).color, tg: getComputedStyle(tg).color, stroke: getComputedStyle(svg.querySelector('path, polyline')).stroke,
        hrW: parseFloat(getComputedStyle(hr).borderTopWidth), hrDisp: getComputedStyle(hr).display, hrC: __ratio(Object.assign(hr, {})) , st: __ratio(st), dirR: __dir('r-s2') } })
    ok(fc.fc && fc.chev === fc.tg && fc.stroke === fc.chev, `forced-colors: el chevron es currentColor del botón (${fc.chev} · ${fc.tg} · ${fc.stroke})`)
    ok(fc.hrW >= 1 && fc.hrDisp === 'block', `forced-colors: la línea de divider es un borde visible (${fc.hrW}px)`)
    ok(fc.st >= 4.5 && fc.dirR === 'left', `forced-colors: estado legible (${fc.st}) y chevron espejado en RTL`)
    await p.evaluate(() => document.getElementById('m-correo').focus()); await p.keyboard.press('Tab')
    const ring = await p.evaluate(() => { const c = getComputedStyle(document.activeElement); return { id: document.activeElement.id, w: parseFloat(c.outlineWidth), s: c.outlineStyle } })
    ok(ring.id === 'm-s2-toggle' && ring.w >= 2 && ring.s === 'solid', `forced-colors: anillo visible en el botón (${JSON.stringify(ring)})`)
    ok(!p.errs.length, 'consola limpia (forced-colors): ' + p.errs.join(' | '))
    await p.context().close()
  }
  await b.close()
}
server.close()
if (info.length) console.log(info.join('\n'))
console.log(`\nGFormSection · estilo: ${total - failed}/${total}`)
if (fails.length) { console.log(fails.join('\n')); process.exitCode = 1 }
