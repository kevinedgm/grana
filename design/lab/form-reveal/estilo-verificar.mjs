// Verificación de coco sobre el banco de GFormReveal (design/lab/form-reveal/estilo-banco.html), con el CSS real
// (GFormReveal.css dentro de grana.components) y los componentes reales de dist/.
// Mide: sin transición al cargar; cerrado sin hueco dentro de GFormLayout real (el margen negativo gana a
// `.g-form-layout > * { margin: 0 }`), en las tres densidades, RTL, 320 y el cuerpo de GFormSection; disparador Δ 0px en
// cada cuadro al abrir y al cerrar (LTR y RTL) y Δscroll 0; altura y opacidad intermedias; recortado mientras anima y
// overflow visible al asentarse; barra alineada con el borde de inicio de la pregunta (±1px; LTR, RTL, anidado, tres
// densidades) y fin igual al de las filas; sangría; aspecto de los controles sin «salto» a deshabilitado al cerrar
// (captura idéntica en el primer cuadro del cierre); contraste de la barra ≥ 3:1 en el tema por defecto claro y oscuro y
// en los once temas generados (claro y oscuro); movimiento reducido; forced-colors (Chromium); 320 sin desborde;
// --g-duration-slow = 240ms en GSidebar y GStepper; análisis estático del CSS; consola limpia.
// Ejecutar desde la raíz del repo (tras `npm run build`): node design/lab/form-reveal/estilo-verificar.mjs
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
const BASE = `http://127.0.0.1:${server.address().port}/design/lab/form-reveal/estilo-banco.html`

const GEN = ['amazon', 'apple', 'caracol-purpura', 'github', 'grana', 'linear', 'lustre', 'medium', 'notion', 'spotify', 'stripe']
const UIDS = ['default', 'comfortable', 'compact', 'rtl', 'n']
let total = 0, failed = 0
const fails = []
let ENGINE = 'static'
const ok = (cond, msg) => { total++; if (!cond) { failed++; fails.push(`[${ENGINE}] ${msg}`) } if (args.verbose) console.log(cond ? 'ok ' : 'NO ', ENGINE, msg) }
const near = (a, b, t = 1) => Math.abs(a - b) <= t

/* ---------- 0 · Análisis estático ---------- */
{
  const read = (f) => readFile(join(ROOT, f), 'utf8')
  const strip = (c) => c.replace(/\/\*[\s\S]*?\*\//g, '')
  const css = strip(await read('packages/vue/src/components/GFormReveal/GFormReveal.css'))
  ok(!/#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|lab|lch)\(/.test(css), 'CSS: color literal')
  ok(!/var\(\s*--[\w-]+\s*,/.test(css), 'CSS: var() con valor de respaldo')
  ok(!/@layer/.test(css), 'CSS: @layer en el archivo')
  ok(!/!important/.test(css), 'CSS: !important')
  ok(!/display:\s*none/.test(css), 'CSS: display: none (cerrado = visibility hidden, #278)')
  const vars = [...css.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1])
  ok(vars.every((v) => /^--(g|_)-/.test(v) || v.startsWith('--_')), 'CSS: var() que no es --g-* ni --_*')
  const badPx = [...css.matchAll(/(-?\d*\.?\d+)(px|ms|s|rem|em)\b/g)].map((m) => m[0]).filter((p) => p !== '0px' && p !== '0s')
  ok(!badPx.length, 'CSS: medidas o duraciones literales ' + badPx)
  ok(!/accent|brand|--g-color-active|--g-color-primary/.test(css), 'CSS: la barra no usa accent, brand, primary ni active (#280)')
  ok(/--g-color-border-control/.test(css), 'CSS: la barra usa --g-color-border-control')
  ok(/--g-duration-slow/.test(css) && /--g-duration-fast/.test(css), 'CSS: --g-duration-slow (altura) y --g-duration-fast (fundido)')
  ok(/--_reveal-gap:\s*0px/.test(css), 'CSS: --_reveal-gap: 0px neutro (#187)')
  ok(!/:hover/.test(css), 'CSS: sin :hover (no hay nada que señalar)')
  ok(/@media \(prefers-reduced-motion: reduce\)/.test(css) && /@media \(prefers-reduced-motion: no-preference\)/.test(css), 'CSS: bloques de movimiento')
  ok(/@media \(forced-colors: active\)/.test(css), 'CSS: bloque de forced-colors')
  ok(/border-inline-start:/.test(css) && /padding-inline-start:/.test(css) && !/border-left|padding-left|margin-left/.test(css), 'CSS: barra y sangría con propiedades lógicas')
  const defaults = await read('packages/vue/src/styles/defaults.css')
  const defined = new Set([...defaults.matchAll(/(--g-[a-z0-9-]+)\s*:/g)].map((m) => m[1]))
  const missing = [...new Set(vars.filter((v) => v.startsWith('--g-') && !defined.has(v)))]
  ok(!missing.length, 'CSS: tokens que no existen en defaults.css ' + missing)
  ok((defaults.match(/--g-duration-slow:/g) || []).length === 1 && /--g-duration-slow: calc\(var\(--g-duration-press\) \* 1\.5\);/.test(defaults), 'defaults.css: --g-duration-slow = calc(press × 1.5), una sola vez (no es de color)')
  for (const f of ['GSidebar/GSidebar.css', 'GStepper/GStepper.css']) {
    const c = strip(await read('packages/vue/src/components/' + f))
    ok(!/--_t-slow/.test(c) && /var\(--g-duration-slow\)/.test(c), `${f}: --_t-slow → var(--g-duration-slow)`)
  }
  // :disabled heredado del bloque: no se pinta bajo un GFormReveal cerrado (los que cambiaban el aspecto)
  const W = ':where(:not(.g-form-reveal:not(.is-open) *))'
  for (const [f, sel] of [['GBtn/GBtn.css', '.g-btn'], ['GCheckboxGroup/GCheckboxGroup.css', '.g-checkbox-group'], ['GFieldGroup/GFieldGroup.css', '.g-field-group'], ['GHelper/GHelper.css', '.g-helper__trigger']]) {
    const c = strip(await read('packages/vue/src/components/' + f))
    const raw = [...c.matchAll(new RegExp(sel.replace(/[.]/g, '\\.') + '(?:--[\\w-]+)?:disabled(?!' + W.replace(/[().:*]/g, '\\$&') + ')', 'g'))]
    ok(!raw.length, `${f}: todo ${sel}:disabled lleva ${W} (${raw.length} sin ella)`)
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
  // Normaliza cualquier color calculado (oklab/oklch en WebKit) a rgb pasando por un canvas
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
  window.__barContrast = () => [...document.querySelectorAll('.g-form-reveal.is-open > .g-form-reveal__body')].map((b) => {
    const bg = bgOf(b)
    return { id: b.parentElement.id, r: ratio(over(rgba(getComputedStyle(b).borderInlineStartColor), bg), bg), w: parseFloat(getComputedStyle(b).borderInlineStartWidth) }
  })
  window.__frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
  window.__set = async (uid, k, v) => { window.__models[uid][k] = v; await new Promise((r) => requestAnimationFrame(r)) }
  window.__st = (id) => { const el = document.getElementById(id); const cs = getComputedStyle(el); const body = el.firstElementChild
    return { inert: el.hasAttribute('inert'), disabled: body.disabled, vis: cs.visibility, op: +cs.opacity, h: el.getBoundingClientRect().height,
      mt: parseFloat(cs.marginBlockStart), ovf: getComputedStyle(body).overflowY, anim: el.classList.contains('is-animating'), open: el.classList.contains('is-open') } }
  // Pausa las transiciones de la raíz en una fracción de la de altura (o de la de opacidad si no hay altura)
  window.__at = (id, frac) => { const el = document.getElementById(id); const as = el.getAnimations()
    const live = as.filter((a) => a.playState !== 'finished' && a.playState !== 'idle'); const L = live.length ? live : as
    const main = [...L].reverse().find((a) => a.transitionProperty === 'grid-template-rows') || [...L].reverse().find((a) => a.transitionProperty === 'opacity')
    if (!main) return null; const t = main.effect.getComputedTiming(); const at = (t.delay || 0) + t.duration * frac
    L.forEach((a) => { a.pause(); a.currentTime = at }); return L.map((a) => a.transitionProperty) }
  window.__finishAll = () => document.getAnimations().forEach((a) => { try { a.finish() } catch {} })
  window.__track = (sel, ms) => new Promise((res) => {
    const el = document.querySelector(sel); const r0 = el.getBoundingClientRect(); const s0 = scrollY
    let dt = 0, dl = 0, ds = 0, n = 0; const t0 = performance.now()
    ;(function f() { const r = el.getBoundingClientRect(); dt = Math.max(dt, Math.abs(r.top - r0.top)); dl = Math.max(dl, Math.abs(r.left - r0.left)); ds = Math.max(ds, Math.abs(scrollY - s0)); n++
      if (performance.now() - t0 < ms) requestAnimationFrame(f); else res({ dt, dl, ds, n }) })()
  })
  // Pregunta de un bloque: el hermano anterior que no es otro bloque
  window.__question = (rv) => { let q = rv.previousElementSibling; while (q && q.classList.contains('g-form-reveal')) q = q.previousElementSibling; return q }
  window.__geom = (id) => {
    const rv = document.getElementById(id); const body = rv.firstElementChild; const q = __question(rv)
    const rtl = getComputedStyle(rv).direction === 'rtl'
    const rb = body.getBoundingClientRect(), rq = q.getBoundingClientRect()
    const first = body.firstElementChild.getBoundingClientRect(); const cs = getComputedStyle(body)
    const bar = parseFloat(cs.borderInlineStartWidth), ind = parseFloat(cs.paddingInlineStart)
    return { rtl, bar, ind, startBody: rtl ? rb.right : rb.left, startQ: rtl ? rq.right : rq.left, endBody: rtl ? rb.left : rb.right, endQ: rtl ? rq.left : rq.right,
      contentStart: rtl ? first.right : first.left, dir: rtl ? -1 : 1 }
  }
  window.__gap = (id) => { const rv = document.getElementById(id); const prev = rv.previousElementSibling; let next = rv.nextElementSibling
    while (next && next.classList.contains('g-form-reveal') && !next.classList.contains('is-open')) next = next.nextElementSibling
    return { dist: next ? next.getBoundingClientRect().top - prev.getBoundingClientRect().bottom : null, toRv: rv.getBoundingClientRect().top - prev.getBoundingClientRect().bottom,
      gap: parseFloat(getComputedStyle(rv.parentElement).rowGap) || 0, inline: rv.style.getPropertyValue('--_reveal-gap') } }
}

const open = async (b, opts = {}, q = '') => {
  const ctx = await b.newContext({ viewport: { width: 1400, height: 1000 }, ...opts })
  const p = await ctx.newPage()
  const errs = []
  p.on('console', (m) => { if (['error', 'warning'].includes(m.type())) errs.push(m.text()) })
  p.on('pageerror', (e) => errs.push(String(e)))
  await p.goto(BASE + q)
  await p.waitForFunction(() => window.__reveals && window.__reveals.size >= 16)
  await p.evaluate(PAGE_HELPERS)
  await p.evaluate(() => document.fonts.ready)
  await p.waitForTimeout(150)
  p.errs = errs
  return p
}
const settled = (p, id) => p.waitForFunction((i) => !window.__reveals.get(i).animating.value, id, { timeout: 4000 })
const openAll = async (p) => { await p.evaluate(() => __all(true)); await p.waitForTimeout(80); await p.evaluate(() => __finishAll()); await p.waitForTimeout(120) }

for (const engine of ENGINES) {
  ENGINE = engine
  const b = await pw[engine].launch()
  let p = await open(b)

  /* 1 · Carga y cerrado sin hueco */
  ok(await p.evaluate(() => document.getAnimations().filter((a) => a.effect?.target?.classList?.contains('g-form-reveal')).length) === 0, 'al cargar no corre ninguna transición de bloque (plan 012)')
  for (const id of [...UIDS.map((u) => u + '-rv'), 'sec-rv']) {
    const s = await p.evaluate((i) => __st(i), id)
    const g = await p.evaluate((i) => __gap(i), id)
    ok(s.inert && s.disabled && s.vis === 'hidden' && s.h === 0 && !s.open, `${id} cerrado: inert, disabled, hidden, altura 0 (${JSON.stringify(s)})`)
    ok((g.gap > 0 || id === 'sec-rv') && near(s.mt, -g.gap, 0.01), `${id} cerrado: margin-block-start = −row-gap del padre pese a margin: 0 de la pila (${s.mt} vs ${-g.gap})`)
    ok(near(g.dist, g.gap, 0.5), `${id} cerrado: pregunta → siguiente = una separación (${g.dist?.toFixed(2)} vs ${g.gap})`)
  }

  /* 2 · Abrir: Δ0 del disparador, intermedio, asentado */
  for (const uid of ['default', 'rtl']) {
    const id = uid + '-rv', q = `#${uid}-factura`
    const tr = p.evaluate((s) => __track(s, 500), q)
    await p.evaluate((u) => __set(u, 'factura', 'si'), uid)
    const t = await tr
    ok(t.dt === 0 && t.dl === 0 && t.ds === 0 && t.n > 5, `${uid} abrir: disparador Δ0 en cada cuadro y Δscroll 0 (${JSON.stringify(t)})`)
    await settled(p, id)
    const s = await p.evaluate((i) => __st(i), id)
    ok(s.open && !s.inert && !s.disabled && s.vis === 'visible' && s.op === 1 && s.h > 100 && s.mt === 0, `${uid} abierto: visible, opacidad 1, altura y margen 0 (${JSON.stringify(s)})`)
    ok(s.ovf === 'visible', `${uid} asentado: overflow visible (no recorta anillos de foco)`)
    const g = await p.evaluate((i) => __gap(i), id)
    ok(near(g.toRv, g.gap, 0.5), `${uid} abierto: pregunta → bloque = una separación (${g.toRv.toFixed(2)} vs ${g.gap})`)
    // Cerrar con Δ0
    const tr2 = p.evaluate((s) => __track(s, 500), q)
    await p.evaluate((u) => __set(u, 'factura', 'no'), uid)
    const t2 = await tr2
    ok(t2.dt === 0 && t2.dl === 0 && t2.ds === 0, `${uid} cerrar: disparador Δ0 en cada cuadro y Δscroll 0 (${JSON.stringify(t2)})`)
    await settled(p, id)
    const s2 = await p.evaluate((i) => __st(i), id)
    ok(s2.vis === 'hidden' && s2.h === 0 && s2.op === 0, `${uid} cerrado de nuevo: hidden, altura 0`)
  }
  // Intermedios (pausados)
  {
    const id = 'default-rv'
    const H = await (async () => { await p.evaluate(() => __set('default', 'factura', 'si')); await settled(p, id); const h = (await p.evaluate((i) => __st(i), id)).h; await p.evaluate(() => __set('default', 'factura', 'no')); await settled(p, id); return h })()
    await p.evaluate(() => __set('default', 'factura', 'si'))
    let props = await p.evaluate((i) => __at(i, 0.5), id)
    ok(props && props.includes('grid-template-rows') && props.some((x) => /^margin-(block-start|top)$/.test(x)) && props.includes('opacity'), `abrir: transiciones de altura, margen y opacidad (${props})`)
    let s = await p.evaluate((i) => __st(i), id)
    ok(s.h > 1 && s.h < H - 1 && s.anim && s.ovf === 'hidden' && !s.inert && !s.disabled, `abrir a la mitad: altura intermedia (${s.h.toFixed(1)} de ${H.toFixed(1)}), recortado, ya sin inert`)
    await p.evaluate((i) => __at(i, 0.75), id)
    s = await p.evaluate((i) => __st(i), id)
    ok(s.op > 0 && s.op < 1 && s.vis === 'visible', `abrir a 3/4: opacidad intermedia (${s.op}), el fundido termina con la altura`)
    await p.evaluate(() => __finishAll()); await settled(p, id)
    await p.evaluate(() => __set('default', 'factura', 'no'))
    await p.evaluate((i) => __at(i, 0.25), id)
    s = await p.evaluate((i) => __st(i), id)
    ok(s.op > 0 && s.op < 1 && s.vis === 'visible' && s.h > 1 && s.h < H - 1 && s.inert && s.disabled, `cerrar a 1/4: visible, opacidad (${s.op}) y altura (${s.h.toFixed(1)}) intermedias, inert y disabled en el acto`)
    await p.evaluate((i) => __at(i, 0.5), id)
    s = await p.evaluate((i) => __st(i), id)
    ok(s.vis === 'visible' && s.h > 1 && s.h < H - 1, `cerrar a la mitad: sigue visible con altura intermedia (${s.h.toFixed(1)})`)
    await p.evaluate(() => __finishAll()); await settled(p, id)
    // Interrupción: revierte desde la altura actual
    await p.evaluate(() => __set('default', 'factura', 'si'))
    await p.evaluate((i) => __at(i, 0.3), id)
    const h1 = (await p.evaluate((i) => __st(i), id)).h
    // En una sola tarea (con carga, entre dos idas y vueltas la apertura avanzaba y Firefox aún listaba la transición vieja)
    await p.evaluate(async (i) => { document.getElementById(i).getAnimations().forEach((a) => a.play()); window.__models.default.factura = 'no'
      await new Promise((r) => requestAnimationFrame(r)); __at(i, 0) }, id)
    const h2 = (await p.evaluate((i) => __st(i), id)).h
    ok(near(h1, h2, H * 0.08), `interrupción: el cierre parte de la altura actual (${h1.toFixed(1)} → ${h2.toFixed(1)})`)
    await p.evaluate(() => __finishAll()); await settled(p, id)
  }

  /* 3 · Barra y sangría (todo abierto) */
  await openAll(p)
  for (const uid of UIDS) {
    for (const id of [uid + '-rv', uid + '-rv-moral']) {
      const g = await p.evaluate((i) => __geom(i), id)
      const d = await p.evaluate((u) => window.__models[u] && document.getElementById(u + '-rv').className.match(/density-(\w+)/)[1], uid)
      ok(near(g.startBody, g.startQ), `${id} (${d}${g.rtl ? ', RTL' : ''}): la barra empieza en el borde de inicio de la pregunta (${g.startBody.toFixed(2)} vs ${g.startQ.toFixed(2)})`)
      ok(near(g.endBody, g.endQ), `${id}: el borde de fin es el de las filas (${g.endBody.toFixed(2)} vs ${g.endQ.toFixed(2)})`)
      ok(g.bar >= 1 && g.ind > g.bar, `${id}: barra (${g.bar}px) y sangría (${g.ind}px)`)
      ok(near((g.contentStart - g.startBody) * g.dir, g.bar + g.ind), `${id}: el contenido empieza tras barra + sangría (${((g.contentStart - g.startBody) * g.dir).toFixed(2)})`)
    }
  }
  {
    const ind = await p.evaluate(() => ['default', 'comfortable', 'compact'].map((u) => parseFloat(getComputedStyle(document.getElementById(u + '-rv').firstElementChild).paddingInlineStart)))
    ok(ind[0] > ind[1] && ind[1] > ind[2], `la sangría sigue a la densidad (${ind})`)
    const gaps = await p.evaluate(() => ['default', 'comfortable', 'compact'].map((u) => [parseFloat(getComputedStyle(document.getElementById(u + '-rv').firstElementChild).rowGap), parseFloat(getComputedStyle(document.getElementById(u + '-layout')).rowGap)]))
    ok(gaps.every(([a, c]) => near(a, c, 0.01)), `la pila del cuerpo separa como la de GFormLayout en cada densidad (${JSON.stringify(gaps)})`)
  }
  {
    const o = await p.evaluate(() => { const h = document.querySelector('.w320'); return { sw: h.scrollWidth, cw: h.clientWidth, doc: document.documentElement.scrollWidth - document.documentElement.clientWidth } })
    ok(o.sw <= o.cw && o.doc <= 0, `320 con dos niveles abiertos: sin desborde (${JSON.stringify(o)})`)
  }

  /* 4 · Sin «salto» a deshabilitado en el fundido de cierre (captura idéntica en el primer cuadro del cierre, con las
         transiciones propias de los controles ya terminadas y la raíz todavía a opacidad 1) */
  {
    const loc = p.locator('#default-rv')
    await p.evaluate(() => { document.activeElement && document.activeElement.blur(); window.scrollTo(0, 0) })
    const before = await loc.screenshot({ animations: 'allow' })
    const styleOf = () => p.evaluate(() => ['#default-envio', '#default-validar', '#default-domicilio'].map((s) => { const el = document.querySelector(s); const t = el.matches('fieldset') ? el.querySelector('legend') || el : el; const cs = getComputedStyle(t); return s + ':' + cs.color + '|' + cs.backgroundColor + '|' + cs.borderTopColor + '|' + cs.opacity }))
    const st0 = await styleOf()
    await p.evaluate(() => { window.__models.default.factura = 'no' })
    await p.evaluate(() => new Promise((r) => requestAnimationFrame(r)))
    await p.evaluate(() => { const root = document.getElementById('default-rv')
      document.getAnimations().forEach((a) => { if (a.effect?.target === root) { a.pause(); a.currentTime = 0 } else { try { a.finish() } catch {} } }) })
    const s = await p.evaluate(() => __st('default-rv'))
    const st1 = await styleOf()
    const after = await loc.screenshot({ animations: 'allow' })
    ok(s.disabled && s.inert && s.op === 1, `cierre, primer cuadro: disabled e inert ya puestos, opacidad 1 (${JSON.stringify(s)})`)
    ok(JSON.stringify(st0) === JSON.stringify(st1), `cierre: legend de GCheckboxGroup, GBtn y GFieldGroup sin cambio de aspecto (${st0} → ${st1})`)
    if (process.env.SHOTS) { const fs = await import('node:fs'); fs.writeFileSync(process.env.SHOTS + '/a-' + engine + '.png', before); fs.writeFileSync(process.env.SHOTS + '/b-' + engine + '.png', after) }
    const diff = await p.evaluate(async ([A, B]) => {
      const load = (s) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = 'data:image/png;base64,' + s })
      const get = (i) => { const c = document.createElement('canvas'); c.width = i.width; c.height = i.height; const x = c.getContext('2d'); x.drawImage(i, 0, 0); return x.getImageData(0, 0, i.width, i.height).data }
      const [a, b] = [await load(A), await load(B)]; if (a.width !== b.width || a.height !== b.height) return { size: false }
      const da = get(a), db = get(b); let n = 0, max = 0
      for (let i = 0; i < da.length; i += 4) { const d = Math.max(Math.abs(da[i] - db[i]), Math.abs(da[i + 1] - db[i + 1]), Math.abs(da[i + 2] - db[i + 2])); if (d) { n++; max = Math.max(max, d) } }
      return { size: true, n, max }
    }, [before.toString('base64'), after.toString('base64')])
    // Tolerancia 8/255 por canal: el suavizado del texto cambia al componer la raíz en su propia capa (opacidad animada);
    // el salto a deshabilitado medido antes del arreglo era de 84/255 (etiqueta del grupo) y de la caja del botón
    ok(diff.size && diff.max <= 8, `cierre: la captura del bloque es la del abierto, nada salta a gris (${JSON.stringify(diff)})`)
    await p.evaluate(() => __finishAll()); await settled(p, 'default-rv')
    // Un GBtn deshabilitado por su cuenta sigue pareciéndolo dentro de un bloque cerrado ([disabled] propio)
    const own = await p.evaluate(() => { const b = document.getElementById('default-validar'); b.setAttribute('disabled', ''); const c = getComputedStyle(b).cursor; b.removeAttribute('disabled'); return c })
    ok(own === 'not-allowed', `GBtn con disabled propio dentro de un bloque cerrado conserva su aspecto (${own})`)
  }

  /* 5 · Contraste de la barra ≥ 3:1: por defecto claro y oscuro, y los temas generados (claro y oscuro) */
  {
    const rows = []
    for (const theme of ['', ...GEN]) {
      for (const dark of [false, true]) {
        await p.evaluate(([t, d]) => new Promise((r) => { const l = document.getElementById('gen'); const href = t ? '../tema-oscuro/dark-color-presence/generated/' + t + '.css' : 'data:text/css,'
          document.documentElement.dataset.theme = d ? 'dark' : 'light'
          if (l.getAttribute('href') === href) return r(); l.onload = () => r(); l.onerror = () => r(); l.href = href; setTimeout(r, 1500) }), [theme, dark])
        await p.waitForTimeout(30)
        const c = await p.evaluate(() => __barContrast())
        const min = Math.min(...c.map((x) => x.r))
        rows.push(`${theme || 'defecto'}${dark ? ' oscuro' : ''}: ${min}`)
        ok(c.length >= 10 && min >= 3, `barra ≥ 3:1 sobre su fondo · ${theme || 'por defecto'} ${dark ? 'oscuro' : 'claro'} (mín. ${min})`)
      }
    }
    if (args.verbose || engine === ENGINES[0]) console.log(`[${engine}] contraste mínimo de la barra: ` + rows.join(' · '))
    await p.evaluate(() => { document.getElementById('gen').href = 'data:text/css,'; document.documentElement.dataset.theme = 'light' })
  }

  /* 6 · --g-duration-slow en GSidebar y GStepper: 240ms, como antes */
  {
    const d = await p.evaluate(() => ({ slow: getComputedStyle(document.getElementById('fx-slow')).transitionDuration, sub: getComputedStyle(document.getElementById('fx-sub')).transitionDuration, conn: getComputedStyle(document.getElementById('fx-conn')).transitionDuration }))
    ok(d.slow === '0.24s', `--g-duration-slow = 240ms (${d.slow})`)
    ok(d.sub.split(', ').filter((x) => x === '0.24s').length === 2, `GSidebar submenú: altura y margen a 240ms (${d.sub})`)
    ok(d.conn === '0.24s', `GStepper conector: 240ms (${d.conn})`)
  }
  ok(!p.errs.length, 'consola limpia: ' + p.errs.join(' | '))
  await p.context().close()

  /* 7 · Movimiento reducido */
  p = await open(b, { reducedMotion: 'reduce' })
  {
    const id = 'default-rv'
    await p.evaluate(() => __set('default', 'factura', 'si'))
    const props = await p.evaluate((i) => document.getElementById(i).getAnimations().map((a) => a.transitionProperty), id)
    const s = await p.evaluate((i) => __st(i), id)
    ok(!props.includes('grid-template-rows') && !props.some((x) => /^margin/.test(x)) && props.includes('opacity'), `reducido, abrir: sin altura ni margen, con fundido (${props})`)
    ok(s.h > 100 && s.mt === 0 && s.vis === 'visible', `reducido, abrir: altura final en el primer cuadro (${s.h.toFixed(1)})`)
    await settled(p, id)
    await p.evaluate(() => __set('default', 'factura', 'no'))
    await p.evaluate((i) => __at(i, 0.5), id)
    const c = await p.evaluate((i) => __st(i), id)
    ok(c.vis === 'visible' && c.op > 0 && c.op < 1 && c.inert, `reducido, cerrar: visible hasta que acaba el fundido (op ${c.op}, ${c.vis})`)
    await p.evaluate(() => __finishAll()); await settled(p, id)
    const e = await p.evaluate((i) => __st(i), id)
    ok(e.vis === 'hidden' && e.h === 0, 'reducido, cerrado: hidden y altura 0')
    const tr = p.evaluate(() => __track('#default-factura', 300))
    await p.evaluate(() => __set('default', 'factura', 'si'))
    const t = await tr
    ok(t.dt === 0 && t.ds === 0, `reducido: disparador Δ0 (${JSON.stringify(t)})`)
  }
  ok(!p.errs.length, 'consola limpia (reducido): ' + p.errs.join(' | '))
  await p.context().close()

  /* 8 · forced-colors (solo Chromium la emula) */
  if (engine === 'chromium') {
    p = await open(b, { forcedColors: 'active' })
    await openAll(p)
    const fc = await p.evaluate(() => ({ fc: matchMedia('(forced-colors: active)').matches, bars: __barContrast() }))
    ok(fc.fc && fc.bars.length >= 10 && fc.bars.every((x) => x.w >= 1 && x.r >= 3), `forced-colors: la barra es un borde visible ≥ 3:1 (${JSON.stringify(fc.bars.slice(0, 3))})`)
    const g = await p.evaluate(() => __geom('rtl-rv'))
    ok(near(g.startBody, g.startQ), 'forced-colors RTL: barra alineada con la pregunta')
    await p.context().close()
  }
  await b.close()
}
server.close()
console.log(`\nGFormReveal · estilo: ${total - failed}/${total}`)
if (fails.length) { console.log(fails.join('\n')); process.exitCode = 1 }
