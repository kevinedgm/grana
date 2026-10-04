// Verificación de coco sobre el banco de la isla de estado (design/lab/alert/estilo-banco.html), con el CSS real
// (GStatusIsland.css y GStatusMark.css de src/, dentro de grana.components) y los componentes reales de dist/.
// Mide: análisis estático (sin literales ni respaldos, sin @layer ni !important, propiedades lógicas, solo tokens que
// existen, sin brand, muelle solo dentro de @supports y con duration-slow); contraste de los CUATRO tipos (texto del
// resumen, insignia, anillo, título, descripción, temporizador, enlace, acciones en reposo y al pasar, detalle, «+N»,
// marca enlace y marca de texto) sobre la superficie inversa en el tema por defecto claro y oscuro y en los once temas
// generados (claro y oscuro; Chromium) — la isla nunca se tiñe de brand; punto ≥ 24px y ≥ 44px táctil; cambio de forma
// compacta → abierta → punto con valores intermedios y sobrepaso ≤ 4,5 % del cambio; toque con escala 0,86; reduce sin
// movimiento (solo fundidos); 9 condiciones: lista con desplazamiento propio y pie visible; marca cápsula y línea de texto
// alineadas con el texto vecino; hoja móvil a 375 y 320 sin desplazamiento horizontal; RTL; forced-colors (Chromium);
// foco visible (anillo exterior en la replegada, interior surface en la abierta); consola limpia.
// Ejecutar desde la raíz del repo (tras `npm run build`): node design/lab/alert/estilo-verificar.mjs
// Opcional: --engines=chromium,firefox,webkit (por defecto los tres)   --verbose   GRANA_PW_PORT (por defecto 4209)
import http from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const pw = await import(new URL('../theme-playground/node_modules/playwright/index.mjs', import.meta.url))
const ROOT = fileURLToPath(new URL('../../../', import.meta.url))
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')).map(([k, v]) => [k, v ?? true]))
const ENGINES = (args.engines || 'chromium,firefox,webkit').split(',')
const TYPES_MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const server = http.createServer(async (req, res) => {
  try {
    const p = normalize(join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname)))
    if (!p.startsWith(ROOT)) throw new Error('fuera')
    const body = await readFile(p)
    res.writeHead(200, { 'content-type': TYPES_MIME[extname(p)] || 'application/octet-stream' }).end(body)
  } catch { res.writeHead(404).end() }
})
await new Promise((r) => server.listen(Number(process.env.GRANA_PW_PORT || 4209), '127.0.0.1', r))
const BASE = `http://127.0.0.1:${server.address().port}/design/lab/alert/estilo-banco.html`

const GEN = ['amazon', 'apple', 'caracol-purpura', 'github', 'grana', 'linear', 'lustre', 'medium', 'notion', 'spotify', 'stripe']
const TYPES = ['error', 'warning', 'info', 'success']
let total = 0, failed = 0
const fails = [], info = []
let ENGINE = 'static'
const ok = (cond, msg) => { total++; if (!cond) { failed++; fails.push(`[${ENGINE}] ${msg}`) } if (args.verbose) console.log(cond ? 'ok ' : 'NO ', ENGINE, msg) }

/* ---------- 0 · Análisis estático ---------- */
{
  const read = (f) => readFile(join(ROOT, f), 'utf8')
  const strip = (c) => c.replace(/\/\*[\s\S]*?\*\//g, '')
  const defaults = await read('packages/vue/src/styles/defaults.css')
  const defined = new Set([...defaults.matchAll(/(--g-[a-z0-9-]+)\s*:/g)].map((m) => m[1]))
  for (const f of ['GStatusIsland/GStatusIsland.css', 'GStatusMark/GStatusMark.css']) {
    const css = strip(await read('packages/vue/src/components/' + f))
    const name = f.split('/')[1]
    ok(!/#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|lab|lch)\(/.test(css), `${name}: color literal`)
    ok(!/var\(\s*--[\w-]+\s*,/.test(css), `${name}: var() con valor de respaldo`)
    ok(!/@layer/.test(css) && !/!important/.test(css), `${name}: @layer o !important`)
    const vars = [...css.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1])
    ok(vars.every((v) => v.startsWith('--g-') || v.startsWith('--_')), `${name}: var() que no es --g-* ni --_*`)
    const missing = [...new Set(vars.filter((v) => v.startsWith('--g-') && !defined.has(v)))]
    ok(!missing.length, `${name}: tokens inexistentes ${missing}`)
    ok(!/--g-[a-z0-9-]+\s*:/.test(css), `${name}: declara tokens --g-*`)
    ok(!/--g-color-(?:on-)?brand/.test(css), `${name}: no lee brand (#325)`)
    const badPx = [...css.matchAll(/(-?\d*\.?\d+)(px|ms|s|rem|em|vw|vh)\b/g)].map((m) => m[0]).filter((p) => !['24px', '44px', '0px', '1px', '-1px'].includes(p))
    ok(!badPx.length, `${name}: medidas o duraciones literales ${badPx}`)
    // 1px solo dentro del patrón de texto oculto
    const onePx = css.replace(/inline-size:\s*1px;\s*block-size:\s*1px;\s*margin:\s*-1px;/g, '')
    ok(!/\b1px\b/.test(onePx), `${name}: 1px fuera del patrón de texto oculto`)
    // propiedades físicas: solo el left: 50% del área táctil (precedente de GBtn: centrado simétrico)
    const phys = css.replace(/left:\s*50%;/g, '')
    ok(!/(?<![-\w])(?:left|right|top|bottom)\s*:|(?:margin|padding|border)-(?:left|right|top|bottom)\b|text-align:\s*(?:left|right)/.test(phys), `${name}: solo propiedades lógicas`)
    ok(!/:hover/.test(css.replace(/@media \(hover: hover\) \{[^{}]*(\{[^{}]*\}[^{}]*)*\}/g, '')), `${name}: :hover solo dentro de @media (hover: hover)`)
    ok(/@media \(prefers-reduced-motion: reduce\)/.test(css) && /@media \(forced-colors: active\)/.test(css), `${name}: bloques reduce y forced-colors`)
    const kf = [...css.matchAll(/@keyframes\s+([\w-]+)/g)].map((m) => m[1])
    ok(kf.every((k) => k.startsWith('g-status')), `${name}: keyframes con prefijo g-status (${kf})`)
    // El muelle: solo dentro de @supports (linear()), siempre con duration-slow
    const outside = css.replace(/@supports \(transition-timing-function: linear\(0, 1\)\) \{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, '')
    ok(!/--g-ease-spring/.test(outside), `${name}: --g-ease-spring fuera de @supports`)
    const springUses = [...css.matchAll(/([\w-]+)\s+var\(--g-duration-(\w+)\)\s+var\(--g-ease-spring\)/g)]
    ok(springUses.every((m) => m[2] === 'slow'), `${name}: el muelle siempre con duration-slow`)
    ok(!/--g-ease-bounce/.test(css), `${name}: sin --g-ease-bounce`)
    if (name === 'GStatusIsland.css') {
      ok(springUses.map((m) => m[1]).sort().join() === 'block-size,border-radius,g-status-nudge,inline-size', `GStatusIsland.css: muelle solo en el cambio de forma y el toque (${springUses.map((m) => m[1])})`)
      ok(/@keyframes g-status-nudge \{\s*from \{ scale: 0\.86; \}/.test(css), 'GStatusIsland.css: toque desde 0.86')
      ok(/@starting-style \{\s*\.g-status-island\.is-ready \.g-status-island__shape \{\s*opacity: 0;\s*scale: 0\.86;/.test(css), 'GStatusIsland.css: nacer con fundido y 0.86, solo con is-ready')
      ok(/--_m: calc\(var\(--g-space-1\) \* 2\)/.test(css) && /--_row: max\(calc\(24px \+ var\(--g-border-width\) \* 2\), calc\(var\(--g-space-1\) \* 12\)\)/.test(css) && /--_dot: max\(calc\(24px \+ var\(--g-border-width\) \* 2\), calc\(var\(--g-space-1\) \* 8\)\)/.test(css) && /--_wide: calc\(var\(--g-space-1\) \* 104\)/.test(css), 'GStatusIsland.css: constantes de status.md (margen ×2, compacta ×12, abierta ×104)')
      ok(/background: var\(--g-color-text\);/.test(css) && /color: var\(--_ink\)/.test(css) && /--_ink: var\(--g-color-surface\)/.test(css), 'GStatusIsland.css: superficie inversa text/surface')
      // Toda transición o animación vive bajo is-ready (nada se anima al montar), salvo colores de estado
      const trans = [...css.matchAll(/([^{}]+)\{[^{}]*transition:\s*([^;]+);/g)].filter((m) => /inline-size|block-size|scale|translate|opacity/.test(m[2]))
      ok(trans.every((m) => /is-ready/.test(m[1])), `GStatusIsland.css: transiciones de forma solo bajo is-ready`)
    }
  }
}

/* ---------- Motores ---------- */
const lum = ([r, g, b]) => { const f = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) }
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05) }

// En la página: compone colores (con alfa) sobre su fondo con un canvas; devuelve sRGB 0..255
const PAGE_HELPERS = () => {
  const cv = document.createElement('canvas'); cv.width = cv.height = 1
  const x = cv.getContext('2d', { willReadFrequently: true })
  window.__mix = (layers) => {
    x.globalCompositeOperation = 'source-over'; x.fillStyle = '#ffffff'; x.fillRect(0, 0, 1, 1)
    for (const c of layers) { if (!c || !CSS.supports('color', c)) throw new Error('color ' + c); x.fillStyle = c; x.fillRect(0, 0, 1, 1) }
    const d = x.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2]]
  }
  window.__alpha = (c) => { x.clearRect(0, 0, 1, 1); x.fillStyle = c; x.fillRect(0, 0, 1, 1); return x.getImageData(0, 0, 1, 1).data[3] }
  // Pila de fondos desde el elemento hasta el primer fondo opaco (incluido)
  window.__bg = (el, extra = []) => {
    const stack = []
    for (let e = el; e; e = e.parentElement) {
      const c = getComputedStyle(e).backgroundColor
      const a = window.__alpha(c)
      if (a > 0) { stack.unshift(c); if (a === 255) break }
    }
    return window.__mix([...stack, ...extra])
  }
  window.__fg = (el, prop = 'color') => window.__mix([getComputedStyle(document.body).backgroundColor, getComputedStyle(el)[prop]])
}

async function contrastSweep(p, label, rows) {
  const data = await p.evaluate((TYPES) => {
    const out = []
    const add = (t, part, fg, bg, min) => out.push({ t, part, fg, bg, min })
    const S = window.bench.S
    for (const t of TYPES) {
      const open = document.querySelector(`[data-test="spec-${t}-open"]`)
      const shape = open.querySelector('.g-status-island__shape')
      const island = window.__bg(shape)
      add(t, 'isla = --g-color-text', window.__mix([getComputedStyle(document.documentElement).getPropertyValue('--g-color-text').trim()]), island, 'eq')
      const sum = open.querySelector('.g-status-island__summary')
      add(t, 'resumen: texto', window.__fg(open.querySelector('.g-status-island__text')), window.__bg(sum), 4.5)
      const sb = open.querySelector('.g-status-island__badge')
      add(t, 'resumen: icono de insignia', window.__fg(sb), window.__bg(sb), 3)
      if (t !== 'success') add(t, 'resumen: anillo de insignia', window.__fg(sb, 'borderTopColor'), island, 3)
      add(t, 'insignia (relleno) sobre la isla [info]', window.__bg(sb), island, 0)
      const li = open.querySelector('.g-status-item')
      const tile = window.__bg(li)
      for (const [sel, name] of [['.g-status-item__title', 'título'], ['.g-status-item__description', 'descripción'], ['.g-status-item__timer', 'temporizador'], ['.g-status-item__link', 'enlace']]) {
        const e = li.querySelector(sel); if (e) add(t, 'aviso: ' + name, window.__fg(e), tile, 4.5)
      }
      const ib = li.querySelector('.g-status-item__badge')
      add(t, 'aviso: icono de insignia', window.__fg(ib), window.__bg(ib), 3)
      if (t !== 'success') add(t, 'aviso: anillo de insignia', window.__fg(ib, 'borderTopColor'), tile, 3)
      for (const [sel, name, outline] of [['.g-status-item__action', 'acción', true], ['.g-status-item__origin', 'Ir a…', false], ['.g-status-item__details-toggle', 'detalle', false], ['.g-status-item__dismiss', 'descartar', false]]) {
        const e = li.querySelector(sel); if (!e) continue
        const cs = getComputedStyle(e)
        add(t, `aviso: ${name} (texto)`, window.__fg(e), tile, sel.includes('dismiss') ? 3 : 4.5)
        if (outline) add(t, `aviso: ${name} (borde)`, window.__fg(e, 'borderTopColor'), tile, 3)
        // Al pasar: los alias de hover del propio GBtn
        const hb = cs.getPropertyValue('--_bg-hover').trim(), hf = cs.getPropertyValue('--_fg-hover').trim()
        const hbg = window.__mix([window.__rgb(tile), hb])
        add(t, `aviso: ${name} al pasar`, window.__mix([window.__rgb(hbg), hf]), hbg, sel.includes('dismiss') ? 3 : 4.5)
      }
      const ack = open.querySelector('.g-status-island__ack')
      add(t, '«Entendido» (texto)', window.__fg(ack), window.__bg(ack), 4.5)
      add(t, '«Entendido» (borde)', window.__fg(ack, 'borderTopColor'), window.__bg(ack.parentElement), 3)
      const ring = getComputedStyle(shape).getPropertyValue('--_ring-color').trim()
      add(t, 'anillo de foco interior', window.__mix([ring]), island, 3)
      const det = li.querySelector('.g-status-item__details')
      if (det && !det.hidden) add(t, 'detalle técnico', window.__fg(det.querySelector('.g-status-item__details-text')), window.__bg(det), 4.5)
      // Marcas
      const ml = document.querySelector(`[data-test="mark-link-${t}"]`)
      add(t, 'marca enlace: texto', window.__fg(ml.querySelector('.g-status-mark__text')), window.__bg(ml), 4.5)
      const mlb = ml.querySelector('.g-status-mark__badge')
      add(t, 'marca enlace: icono', window.__fg(mlb), window.__bg(mlb), 3)
      if (t !== 'success') add(t, 'marca enlace: anillo', window.__fg(mlb, 'borderTopColor'), window.__bg(ml), 3)
      add(t, 'marca enlace = --g-color-text', window.__mix([getComputedStyle(document.documentElement).getPropertyValue('--g-color-text').trim()]), window.__bg(ml), 'eq')
      const mt = document.querySelector(`[data-test="mark-text-${t}"]`)
      add(t, 'marca de texto: texto', window.__fg(mt.querySelector('.g-status-mark__text')), window.__bg(mt), 4.5)
      const mtb = mt.querySelector('.g-status-mark__badge')
      add(t, 'marca de texto: icono', window.__fg(mtb), window.__bg(mt), 3)
      if (t !== 'success') add(t, 'marca de texto: anillo', window.__fg(mtb, 'borderTopColor'), window.__bg(mt), 3)
    }
    const more = document.querySelector('[data-test="live"] .g-status-island__more')
    if (more) out.push({ t: '-', part: '«+N»', fg: window.__fg(more), bg: window.__bg(more), min: 4.5 })
    const tm = document.querySelector('[data-test="spec-warning-compact"] .g-status-island__timer')
    out.push({ t: 'warning', part: 'resumen: temporizador', fg: window.__fg(tm), bg: window.__bg(tm), min: 4.5 })
    const brand = window.__mix([getComputedStyle(document.documentElement).getPropertyValue('--g-color-brand').trim()])
    out.push({ t: '-', part: 'brand (referencia)', fg: brand, bg: brand, min: 'brand' })
    return out
  }, TYPES)
  const brand = data.find((d) => d.min === 'brand').fg
  for (const d of data) {
    if (d.min === 'brand') continue
    if (d.min === 'eq') { ok(d.fg.every((v, i) => Math.abs(v - d.bg[i]) <= 1), `${label} ${d.t}: ${d.part} (${d.fg} vs ${d.bg})`); continue }
    const r = ratio(d.fg, d.bg)
    if (d.min === 0) { rows.push(`${label} ${d.t} ${d.part}: ${r.toFixed(2)}`); continue }
    ok(r >= d.min, `${label} ${d.t}: ${d.part} ${r.toFixed(2)} < ${d.min}`)
    rows.push(`${label} ${d.t} ${d.part}: ${r.toFixed(2)}`)
  }
  return { brand, island: data.find((d) => d.part === 'isla = --g-color-text').bg }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
for (const engine of ENGINES) {
  ENGINE = engine
  const b = await pw[engine].launch()
  const errs = []
  const open = async (query = '', opts = {}) => {
    const ctx = await b.newContext({ viewport: { width: opts.width ?? 1280, height: opts.height ?? 900 }, reducedMotion: opts.reducedMotion ?? 'no-preference', ...(opts.ctx || {}) })
    const p = await ctx.newPage()
    p.on('console', (m) => {
      const t = m.text()
      if (/Failed to load resource|404/.test(t) || /development build of Vue/.test(t)) return
      if (['error', 'warning'].includes(m.type())) errs.push(`${m.type()}: ${t.slice(0, 200)}`)
    })
    p.on('pageerror', (e) => errs.push(`pageerror: ${e}`))
    await p.goto(BASE + query, { waitUntil: 'domcontentloaded' })
    await p.waitForFunction(() => window.bench && document.querySelector('[data-test="live"] .g-status-island__shape'))
    await p.evaluate(() => Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 2500))]))
    await p.evaluate(PAGE_HELPERS)
    await p.evaluate(() => { window.__rgb = (a) => `rgb(${a.join(' ')})` })
    await p.waitForTimeout(350)
    return p
  }
  const set = (p, patch) => p.evaluate((x) => Object.assign(window.bench.S, x), patch).then(() => p.waitForTimeout(450))

  // 1 · Contraste: por defecto claro y oscuro en los tres motores; los once generados (claro y oscuro) en Chromium
  const themes = engine === 'chromium' ? ['', ...GEN] : ['']
  const rows = []
  for (const th of themes) for (const dark of [false, true]) {
    const p = await open(`?n=3${th ? '&theme=' + th : ''}${dark ? '&dark' : ''}`)
    await set(p, { details: true })
    const label = `${th || 'defecto'}${dark ? ' oscuro' : ' claro'}`
    const r = await contrastSweep(p, label, rows)
    if (th === 'spotify' || th === 'caracol-purpura') ok(ratio(r.brand, r.island) > 1.05, `${label}: la isla no se tiñe de brand (brand ${r.brand}, isla ${r.island})`)
    await p.context().close()
  }
  if (engine === 'chromium') {
    const worst = {}
    for (const r of rows) { const m = r.match(/^(.*?) (error|warning|info|success|-) (.*): ([\d.]+)$/); if (!m) continue; const k = m[3]; if (!worst[k] || +m[4] < worst[k].v) worst[k] = { v: +m[4], where: `${m[1]} ${m[2]}` } }
    for (const [k, v] of Object.entries(worst)) info.push(`contraste mínimo · ${k}: ${v.v.toFixed(2)} (${v.where})`)
    const def = rows.filter((r) => /^defecto claro (error|warning|info|success) (resumen: texto|resumen: icono de insignia|resumen: anillo de insignia|aviso: título|aviso: acción \(borde\)|marca enlace: texto|marca de texto: texto|marca de texto: icono)/.test(r))
    info.push('defecto claro: ' + def.map((r) => r.replace('defecto claro ', '')).join(' · '))
  }

  // 2 · Tamaños: compacta 48, punto 32 (≥ 24), abierta ×104; táctil ≥ 44
  {
    const p = await open('?n=3')
    const m = await p.evaluate(() => {
      const r = (s) => { const e = document.querySelector(s).getBoundingClientRect(); return { w: e.width, h: e.height } }
      return { compact: r('[data-test="spec-error-compact"] .g-status-island__shape'), dot: r('[data-test="spec-error-dot"] .g-status-island__shape'), dotSum: r('[data-test="spec-error-dot"] .g-status-island__summary'), open: r('[data-test="spec-error-open"] .g-status-island__shape'), badge: r('[data-test="spec-error-compact"] .g-status-island__badge'), dotBadge: r('[data-test="spec-error-dot"] .g-status-island__badge'), mark: r('[data-test="mark-link-error"]') }
    })
    ok(Math.abs(m.compact.h - 48) <= 0.5, `compacta: alto ${m.compact.h} (space × 12)`)
    ok(Math.abs(m.dot.w - 32) <= 0.5 && Math.abs(m.dot.h - 32) <= 0.5 && m.dotSum.w >= 24 && m.dotSum.h >= 24, `punto: ${m.dot.w}×${m.dot.h}, resumen ${m.dotSum.w}×${m.dotSum.h} (≥ 24)`)
    ok(Math.abs(m.open.w - 416) <= 1, `abierta: ancho ${m.open.w} (space × 104)`)
    ok(m.badge.w === 32 && m.dotBadge.w === 24, `insignia ${m.badge.w} / punto ${m.dotBadge.w}`)
    // concéntrica: el hueco al inicio = el de arriba
    const conc = await p.evaluate(() => { const s = document.querySelector('[data-test="spec-error-compact"] .g-status-island__shape').getBoundingClientRect(); const b = document.querySelector('[data-test="spec-error-compact"] .g-status-island__badge').getBoundingClientRect(); return [b.left - s.left, b.top - s.top, s.bottom - b.bottom] })
    ok(conc.every((v) => Math.abs(v - conc[0]) <= 0.5), `insignia concéntrica con el extremo de la píldora (${conc.map((v) => v.toFixed(1))})`)
    ok(m.mark.h >= 24, `marca enlace: alto ${m.mark.h} ≥ 24`)
    await p.context().close()
    const touch = await open('?n=3&form=dot', { ctx: engine === 'firefox' ? { hasTouch: true } : { hasTouch: true, isMobile: engine === 'chromium' } })
    const coarse = await touch.evaluate(() => matchMedia('(pointer: coarse)').matches)
    if (coarse) {
      const t = await touch.evaluate(() => {
        const r = (s) => { const e = document.querySelector(s).getBoundingClientRect(); return [e.width, e.height] }
        const mk = document.querySelector('[data-test="mark-link-error"]'); const a = getComputedStyle(mk, '::after')
        return { dot: r('[data-test="spec-error-dot"] .g-status-island__shape'), compact: r('[data-test="spec-error-compact"] .g-status-island__shape'), mark: [parseFloat(a.width), parseFloat(a.height)] }
      })
      ok(t.dot.every((v) => v >= 44) && t.compact[1] >= 44 && t.mark.every((v) => v >= 44), `táctil: punto ${t.dot}, compacta ${t.compact}, marca ${t.mark} (≥ 44)`)
    } else info.push(`${engine}: sin pointer: coarse emulable; táctil no medido aquí`)
    await touch.context().close()
  }

  // 3 · Cambio de forma: compacta → abierta → punto, con valores intermedios y sobrepaso acotado
  {
    const p = await open('?n=3&form=compact')
    const sample = (patch) => p.evaluate(async (patch) => {
      const sh = document.querySelector('[data-test="live"] .g-status-island__shape')
      const r0 = sh.getBoundingClientRect(); const fr = []
      Object.assign(window.bench.S, patch)
      const t0 = performance.now()
      await new Promise((res) => { const f = () => { const r = sh.getBoundingClientRect(); fr.push({ t: performance.now() - t0, w: r.width, h: r.height }); if (performance.now() - t0 < 700) requestAnimationFrame(f); else res() }; requestAnimationFrame(f) })
      const r1 = sh.getBoundingClientRect()
      const inner = sh.querySelector('.g-status-island__inner').getBoundingClientRect()
      const cs = getComputedStyle(sh)
      return { w0: r0.width, h0: r0.height, w1: r1.width, h1: r1.height, fr, inner: { w: inner.width, h: inner.height }, ease: cs.transitionTimingFunction, dur: cs.transitionDuration }
    }, patch)
    const check = (s, name) => {
      const mid = s.fr.filter((f) => f.h > Math.min(s.h0, s.h1) + 1 && f.h < Math.max(s.h0, s.h1) - 1)
      ok(mid.length >= 2, `${name}: valores intermedios de alto (${mid.length} cuadros)`)
      const dh = s.h1 - s.h0, dw = s.w1 - s.w0
      const overH = dh > 0 ? Math.max(...s.fr.map((f) => f.h)) - s.h1 : s.h1 - Math.min(...s.fr.map((f) => f.h))
      const overW = dw > 0 ? Math.max(...s.fr.map((f) => f.w)) - s.w1 : dw < 0 ? s.w1 - Math.min(...s.fr.map((f) => f.w)) : 0
      const pH = Math.abs(dh) ? overH / Math.abs(dh) : 0, pW = Math.abs(dw) > 4 ? overW / Math.abs(dw) : 0
      ok(pH <= 0.045 && pW <= 0.045, `${name}: sobrepaso ≤ 4,5 % (alto ${(pH * 100).toFixed(1)} %, ancho ${(pW * 100).toFixed(1)} %)`)
      const settled = s.fr.find((f) => Math.abs(f.h - s.h1) < 0.5 && Math.abs(f.w - s.w1) < 0.5 && s.fr.slice(s.fr.indexOf(f)).every((g) => Math.abs(g.h - s.h1) < 0.5))
      ok(settled && settled.t <= 330, `${name}: asienta en ${settled && settled.t.toFixed(0)}ms (duration-slow + cuadros)`)
      ok(Math.abs(s.w1 - s.inner.w - 2) <= 1.01 && Math.abs(s.h1 - s.inner.h - 2) <= 1.01, `${name}: la forma mide __inner + borde (${s.w1}×${s.h1} vs ${s.inner.w}×${s.inner.h})`)
      info.push(`${engine} ${name}: ${s.w0.toFixed(0)}×${s.h0.toFixed(0)} → ${s.w1.toFixed(0)}×${s.h1.toFixed(0)}, sobrepaso alto ${(pH * 100).toFixed(1)} %, asienta ${settled && settled.t.toFixed(0)}ms`)
      return s
    }
    const a = check(await sample({ form: 'open' }), 'compacta → abierta')
    ok(/linear\(/.test(a.ease) || engine !== 'chromium', `curva de forma = --g-ease-spring (${a.ease.slice(0, 40)}…)`)
    check(await sample({ form: 'dot' }), 'abierta → punto')
    check(await sample({ form: 'compact' }), 'punto → compacta')
    // Toque
    const n = await p.evaluate(async () => {
      window.bench.nudge()
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
      const a = document.getAnimations().find((x) => x.animationName === 'g-status-nudge')
      if (!a) return null
      const k = a.effect.getKeyframes(); const t = a.effect.getComputedTiming()
      return { from: k[0].scale, dur: t.duration, easing: t.easing || a.effect.getTiming().easing }
    })
    ok(n && String(n.from).trim() === '0.86' && Math.abs(n.dur - 240) <= 1, `toque: g-status-nudge desde ${n && n.from} en ${n && n.dur}ms`)
    await p.waitForTimeout(400)
    ok(await p.evaluate(() => !document.querySelector('[data-test="live"]').classList.contains('is-nudge')), 'toque: la clase se retira en animationend')
    // Reintentando: gira
    await set(p, { busy: true })
    ok(await p.evaluate(() => document.getAnimations().some((x) => x.animationName === 'g-status-spin')), 'reintentando: la insignia gira')
    await p.context().close()
  }

  // 4 · Movimiento reducido: sin cambio de tamaño animado, sin toque, sin giro, sin escala; solo fundidos
  {
    const p = await open('?n=3&form=compact', { reducedMotion: 'reduce' })
    const r = await p.evaluate(async () => {
      const sh = document.querySelector('[data-test="live"] .g-status-island__shape')
      window.bench.S.form = 'open'; window.bench.S.busy = true; window.bench.nudge()
      await new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(res))))
      const anims = document.getAnimations().filter((a) => a.playState === 'running').map((a) => a.animationName || a.transitionProperty)
      const inner = sh.querySelector('.g-status-island__inner').getBoundingClientRect(), s = sh.getBoundingClientRect()
      return { anims, jump: Math.abs(s.height - inner.height - 2) <= 1.01, scale: getComputedStyle(sh).scale }
    })
    ok(r.anims.every((a) => a === 'opacity'), `reduce: solo fundidos en curso (${r.anims.join(', ') || 'ninguna'})`)
    ok(r.jump, 'reduce: la forma salta a su tamaño (sin transición de tamaño)')
    await p.context().close()
  }

  // 5 · Más de 6 condiciones: la lista desplaza, el pie se ve, la isla cabe en el visor
  for (const h of [900, 600]) {
    const p = await open('?n=9&form=open', { height: h })
    const r = await p.evaluate(() => {
      const root = document.querySelector('[data-test="live"]'); const sh = root.querySelector('.g-status-island__shape')
      const list = root.querySelector('.g-status-island__list'); const foot = root.querySelector('.g-status-island__foot').getBoundingClientRect(); const s = sh.getBoundingClientRect()
      return { scrolls: list.scrollHeight > list.clientHeight + 1, items: list.children.length, footIn: foot.bottom <= s.bottom + 0.5 && foot.top >= s.top, bottom: s.bottom, vh: innerHeight, ob: getComputedStyle(list).overscrollBehaviorY }
    })
    ok(r.items === 9 && r.scrolls && r.footIn && r.bottom <= r.vh - 7.5 && r.ob === 'contain', `9 condiciones a ${h}px: desplaza ${r.scrolls}, pie visible ${r.footIn}, borde inferior ${r.bottom.toFixed(0)} / ${r.vh}`)
    await p.context().close()
  }

  // 6 · Marcas alineadas con el texto vecino
  {
    const p = await open('?n=3')
    const r = await p.evaluate(() => {
      const c = (e) => { const r = e.getBoundingClientRect(); return r.top + r.height / 2 }
      const firstLine = (p) => { const rg = document.createRange(); const tn = [...p.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim()); rg.setStart(tn, 0); rg.setEnd(tn, 1); return rg.getBoundingClientRect() }
      const btn = document.querySelector('#save .g-btn__label') || document.querySelector('#save')
      const links = [...document.querySelectorAll('[data-test^="mark-link-"]')].map((m) => Math.abs(c(m.querySelector('.g-status-mark__text')) - c(btn)))
      const para = document.querySelector('#para').getBoundingClientRect()
      const texts = [...document.querySelectorAll('[data-test^="mark-text-"]')].map((m) => {
        const b = m.querySelector('.g-status-mark__badge').getBoundingClientRect(); const p = m.querySelector('.g-status-mark__text'); const fl = firstLine(p)
        const act = m.querySelector('.g-status-mark__action')
        return { t: m.dataset.test, start: Math.abs(b.left - para.left), badgeVsLine: Math.abs((b.top + b.height / 2) - (fl.top + fl.height / 2)), act: act ? Math.abs(c(act) - (fl.top + fl.height / 2)) : 0, gap: fl.left - b.right }
      })
      const wrap = document.querySelector('[data-test="mark-text-warning"] .g-status-mark__text')
      return { links, texts }
    })
    ok(r.links.every((d) => d <= 1), `marca enlace: texto centrado con la etiqueta de «Guardar» (Δ ${r.links.map((d) => d.toFixed(1))})`)
    for (const t of r.texts) ok(t.start <= 0.5 && t.badgeVsLine <= 1 && t.act <= 1 && Math.abs(t.gap - 8) <= 0.6, `${t.t}: inicio Δ${t.start.toFixed(1)}, insignia vs 1.ª línea Δ${t.badgeVsLine.toFixed(1)}, acción Δ${t.act.toFixed(1)}, hueco ${t.gap.toFixed(1)}`)
    // Sangría francesa a 320: el texto partido sigue alineado consigo mismo
    await p.setViewportSize({ width: 320, height: 800 }); await p.waitForTimeout(300)
    const hang = await p.evaluate(() => {
      const p = document.querySelector('[data-test="mark-text-warning"] .g-status-mark__text'); const rects = [...(() => { const rg = document.createRange(); rg.selectNodeContents(p); return rg.getClientRects() })()]
      const lefts = [...new Set(rects.filter((r) => r.width > 2).map((r) => Math.round(r.left)))]
      const act = document.querySelector('[data-test="mark-text-action"]'); const a = act.querySelector('.g-status-mark__action').getBoundingClientRect(); const tx = act.querySelector('.g-status-mark__text').getBoundingClientRect()
      return { lines: rects.length, lefts, actLeft: a.left, txLeft: tx.left }
    })
    ok(Math.max(...hang.lefts) - Math.min(...hang.lefts) <= 1, `marca de texto partida en 320: todas las líneas empiezan igual (${hang.lefts})`)
    ok(Math.abs(hang.actLeft - hang.txLeft) <= 0.5, `marca con acción en 320: la acción baja alineada con el texto (Δ ${Math.abs(hang.actLeft - hang.txLeft).toFixed(1)})`)
    await p.context().close()
  }

  // 7 · Móvil: 375 y 320, hoja inferior, sin desplazamiento horizontal
  for (const w of [375, 320]) {
    const p = await open('?n=4', { width: w, height: 760 })
    await set(p, { sheet: true, details: true }); await p.waitForTimeout(450)
    const r = await p.evaluate(() => {
      const root = document.querySelector('[data-test="live"]'); const sh = root.querySelector('.g-status-island__shape').getBoundingClientRect()
      const d = document.querySelector('.g-status-sheet'); const dr = d.getBoundingClientRect()
      const pre = d.querySelector('.g-status-item__details-text')
      const items = [...d.querySelectorAll('.g-status-item')].map((li) => li.getBoundingClientRect()).every((x) => x.left >= dr.left && x.right <= dr.right + 0.5)
      return { mobile: root.hasAttribute('data-mobile'), form: root.dataset.form, sw: document.scrollingElement.scrollWidth, vw: innerWidth, sh: { l: sh.left, r: sh.right, t: sh.top }, open: d.open, dr: { l: dr.left, r: dr.right, b: dr.bottom }, vh: innerHeight, pre: pre ? pre.scrollWidth <= pre.clientWidth + 1 : null, items, pe: getComputedStyle(d).pointerEvents }
    })
    ok(r.mobile && r.open && Math.abs(r.dr.b - r.vh) <= 1 && Math.abs(r.dr.r - r.dr.l - r.vw) <= 1, `${w}px: hoja inferior a todo el ancho (${JSON.stringify(r.dr)})`)
    ok(r.sw <= r.vw && r.sh.l >= 7.5 && r.sh.r <= r.vw - 7.5 && r.sh.t >= 7.5, `${w}px: sin desplazamiento horizontal (${r.sw}/${r.vw}), isla dentro del margen`)
    ok(r.pre && r.items && r.pe === 'auto', `${w}px: detalle partido, avisos dentro de la hoja, la hoja recibe el puntero`)
    await p.context().close()
  }

  // 8 · RTL: insignia al inicio (derecha), marca de texto con sangría espejada
  {
    const p = await open('?n=3&rtl&form=open')
    const r = await p.evaluate(() => {
      const sh = document.querySelector('[data-test="live"] .g-status-island__shape').getBoundingClientRect()
      const b = document.querySelector('[data-test="live"] .g-status-island__summary .g-status-island__badge').getBoundingClientRect()
      const li = document.querySelector('[data-test="live"] .g-status-item'); const lb = li.querySelector('.g-status-item__badge').getBoundingClientRect(); const lt = li.querySelector('.g-status-item__title').getBoundingClientRect()
      const mt = document.querySelector('[data-test="mark-text-info"]'); const mb = mt.querySelector('.g-status-mark__badge').getBoundingClientRect(); const mp = mt.querySelector('.g-status-mark__text').getBoundingClientRect(); const para = document.querySelector('#para').getBoundingClientRect()
      const ml = document.querySelector('[data-test="mark-link-info"]'); const mlr = ml.getBoundingClientRect(); const mlb = ml.querySelector('.g-status-mark__badge').getBoundingClientRect()
      return { sum: sh.right - b.right, sumTop: b.top - sh.top, item: lb.left > lt.right, mark: Math.abs(mb.right - para.right), markGap: mb.left - mp.right, link: mlr.right - mlb.right, linkTop: mlb.top - mlr.top }
    })
    ok(Math.abs(r.sum - r.sumTop) <= 0.5 && r.item, `RTL: insignia del resumen al inicio y concéntrica (${r.sum.toFixed(1)} / ${r.sumTop.toFixed(1)}); aviso con insignia a la derecha`)
    ok(r.mark <= 0.5 && Math.abs(r.markGap - 8) <= 0.6 && Math.abs(r.link - r.linkTop) <= 0.5, `RTL: marca de texto al borde de inicio (Δ${r.mark.toFixed(1)}, hueco ${r.markGap.toFixed(1)}); cápsula concéntrica`)
    await p.context().close()
  }

  // 9 · Foco visible: replegada, anillo exterior (focus) en la forma; abierta, anillo interior surface en el resumen
  {
    const p = await open('?n=3&form=compact')
    await p.keyboard.press('Tab'); await p.keyboard.press('Shift+Tab')
    const r = await p.evaluate(async () => {
      const s = document.querySelector('[data-test="live"] .g-status-island__summary'); s.focus({ focusVisible: true })
      if (!s.matches(':focus-visible')) return null
      const sh = getComputedStyle(s.closest('.g-status-island__shape'))
      const a = { style: sh.outlineStyle, w: parseFloat(sh.outlineWidth), c: sh.outlineColor, focus: getComputedStyle(document.documentElement).getPropertyValue('--g-color-focus').trim() }
      window.bench.S.form = 'open'; await new Promise((r) => setTimeout(r, 400))
      const ss = getComputedStyle(s)
      return { a, b: { style: ss.outlineStyle, w: parseFloat(ss.outlineWidth), off: parseFloat(ss.outlineOffset), c: ss.outlineColor, sh: getComputedStyle(s.closest('.g-status-island__shape')).outlineStyle } }
    })
    if (r) {
      ok(r.a.style === 'solid' && r.a.w >= 2, `foco en la replegada: anillo exterior ${r.a.style} ${r.a.w}px ${r.a.c}`)
      ok(r.b.style === 'solid' && r.b.w >= 2 && r.b.off < 0 && r.b.sh === 'none', `foco en la abierta: anillo interior ${r.b.style} ${r.b.w}px offset ${r.b.off} ${r.b.c}`)
    } else info.push(`${engine}: :focus-visible programático no disponible; foco no medido aquí`)
    await p.context().close()
  }

  // 10 · forced-colors (Chromium): bordes CanvasText, forma del anillo intacta, sin cambio de tamaño
  if (engine === 'chromium') {
    const p0 = await open('?n=3')
    const size0 = await p0.evaluate(() => [...document.querySelectorAll('[data-test^="spec-"][data-test$="-compact"] .g-status-island__shape, [data-test^="mark-link-"]')].map((e) => e.getBoundingClientRect().width))
    await p0.context().close()
    const p = await open('?n=3', { ctx: { forcedColors: 'active' } })
    const r = await p.evaluate(() => {
      const sh = getComputedStyle(document.querySelector('[data-test="spec-warning-compact"] .g-status-island__shape'))
      const bw = getComputedStyle(document.querySelector('[data-test="spec-warning-compact"] .g-status-island__badge'))
      const bi = getComputedStyle(document.querySelector('[data-test="spec-info-compact"] .g-status-island__badge'))
      const ml = getComputedStyle(document.querySelector('[data-test="mark-link-error"]'))
      const sizes = [...document.querySelectorAll('[data-test^="spec-"][data-test$="-compact"] .g-status-island__shape, [data-test^="mark-link-"]')].map((e) => e.getBoundingClientRect().width)
      return { fc: matchMedia('(forced-colors: active)').matches, sh: sh.borderTopColor + ' ' + sh.borderTopStyle, warn: bw.borderTopStyle, info: bi.borderTopStyle, ml: ml.borderTopColor, sizes, canvas: getComputedStyle(document.body).color }
    })
    ok(r.fc && !/rgba\(0, 0, 0, 0\)/.test(r.sh) && /solid/.test(r.sh) && r.ml !== 'rgba(0, 0, 0, 0)', `forced-colors: borde visible en la isla (${r.sh}) y la marca (${r.ml})`)
    ok(r.warn === 'dashed' && r.info === 'dotted', `forced-colors: el anillo conserva su forma (warning ${r.warn}, info ${r.info})`)
    ok(r.sizes.every((v, i) => Math.abs(v - size0[i]) <= 0.5), 'forced-colors: sin cambio de tamaño')
    await p.context().close()
  }

  ok(errs.length === 0, `consola: ${errs.slice(0, 5).join(' | ')}`)
  await b.close()
}
server.close()
for (const i of info) console.log('·', i)
for (const f of fails) console.log('FALLA', f)
console.log(`\nTOTAL ${total - failed}/${total}`)
process.exit(failed ? 1 : 0)
