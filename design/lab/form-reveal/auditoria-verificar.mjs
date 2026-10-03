// Auditoría de coco (paso 5) de GFormReveal sobre el COMPONENTE REAL: GFormReveal.vue + dist/grana.css en el playground
// (packages/vue/playground, formulario #fr-form: «¿Requiere factura?» → fiscal con Física/Moral anidado, y «¿Tiene
// alergias?» directo en el cuerpo de una GFormSection). Más una página de carga con 40 bloques montados con la UMD real.
// Temas: defecto claro y oscuro, el de la auditoría de radio-group (@grana/cli: brand #0B1F4D, radius 0, shape pill) claro
// y oscuro, el «Tema de prueba» del playground claro y oscuro, y los once generados de dark-color-presence (claro y oscuro,
// solo contraste de la barra).
// Comprueba: marcado real frente al que espera el CSS (raíz div + fieldset role=none único hijo, inert/disabled, clases,
// --_reveal-gap en px y 0px en el cuerpo de GFormSection, is-ready ≥ 2 cuadros tras montar, is-animating y su fin por
// transitionend y por el temporizador con movimiento reducido); cerrado sin hueco (GFormLayout, cuerpo de un bloque,
// cuerpo de GFormSection); disparador Δ0 y Δscroll 0 con clic real al abrir y al cerrar (LTR y RTL); intermedios; barra
// alineada con el inicio de la pregunta ±1px y fin igual al de las filas (tres densidades, LTR y RTL, 320); contraste de
// la barra ≥ 3:1; fundido de cierre sin salto a gris con los controles reales de dentro; movimiento reducido;
// forced-colors (Chromium); bloque grande cerrado con la página al final; varios bloques a la vez y 40 bloques;
// GRadioGroup __label-text (#282) sin cambio visual en LTR y bien ordenado en RTL; dist/grana.css sin literales ni
// respaldos en las reglas de g-form-reveal; consola limpia.
// Ejecutar desde la raíz del repo con dist/ reconstruido: node design/lab/form-reveal/auditoria-verificar.mjs
// Opcional: --engines=chromium   --verbose
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
    let p = normalize(join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname)))
    if (!p.startsWith(ROOT)) throw new Error('fuera')
    if (p.endsWith('/')) p += 'index.html'
    const body = await readFile(p)
    res.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream' }).end(body)
  } catch { if (!res.headersSent) res.writeHead(404).end() }
})
await new Promise((r) => server.listen(0, '127.0.0.1', r))
const ORIGIN = `http://127.0.0.1:${server.address().port}`
const PLAY = ORIGIN + '/packages/vue/playground/index.html'
const VUE = await readFile(join(ROOT, 'node_modules/vue/dist/vue.global.js'), 'utf8')
const AUDIT_CSS = await readFile(join(ROOT, 'design/lab/radio-group/auditoria-tema.css'), 'utf8')
const GEN = ['amazon', 'apple', 'caracol-purpura', 'github', 'grana', 'linear', 'lustre', 'medium', 'notion', 'spotify', 'stripe']
const GEN_CSS = Object.fromEntries(await Promise.all(GEN.map(async (g) => [g, await readFile(join(ROOT, `design/lab/tema-oscuro/dark-color-presence/generated/${g}.css`), 'utf8')])))

let total = 0, failed = 0
const fails = []
let ENGINE = 'static'
const ok = (cond, msg) => { total++; if (!cond) { failed++; fails.push(`[${ENGINE}] ${msg}`) } if (args.verbose) console.log(cond ? 'ok ' : 'NO ', ENGINE, msg) }
const near = (a, b, t = 1) => Math.abs(a - b) <= t
// Posiciones distintas estrictamente entre la inicial y la final (> 1px de las dos): un salto de un cuadro da 0. El tamaño del
// paso depende de la cadencia de cuadros del motor (WebKit sin pantalla pinta cada ~40ms) y de --g-ease-out (quint)
const inter = (tops) => { const a = tops[0], z = tops[tops.length - 1]; return new Set(tops.filter((v) => Math.abs(v - a) > 1 && Math.abs(v - z) > 1)).size }
const info = []
const note = (m) => info.push(`[${ENGINE}] ${m}`)

/* ---------- 0 · CSS publicado (dist/grana.css): reglas de g-form-reveal sin literales ni respaldos ---------- */
{
  const dist = await readFile(join(ROOT, 'packages/vue/dist/grana.css'), 'utf8')
  ok(dist.includes('g-form-reveal__body'), 'dist: falta g-form-reveal__body')
  const css = dist.replace(/\/\*[\s\S]*?\*\//g, '')
  const rules = []
  const stack = []
  for (let i = 0, buf = ''; i < css.length; i++) {
    const ch = css[i]
    if (ch === '{') { stack.push(buf.trim()); buf = '' }
    else if (ch === '}') { const s = stack.pop(); if (/g-form-reveal(?![\w-])|g-form-reveal__|g-form-reveal--/.test(s)) rules.push({ sel: s, body: buf }); buf = '' }
    else buf += ch
  }
  const own = rules.filter((r) => /\.g-form-reveal/.test(r.sel) && !/:where\(:not\(\.g-form-reveal:not\(\.is-open\) \*\)\)/.test(r.sel))
  ok(own.length >= 8, `dist: reglas de g-form-reveal (${own.length})`)
  for (const r of own) {
    const b = r.body.replace(/CanvasText/g, '')
    ok(!/#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|lab|lch)\(/.test(b), `dist ${r.sel}: color literal`)
    ok(!/var\(\s*--[\w-]+\s*,/.test(b), `dist ${r.sel}: var() con respaldo`)
    const lit = [...b.matchAll(/(-?\d*\.?\d+)(px|ms|s|rem|em)\b/g)].map((m) => m[0]).filter((x) => x !== '0px' && x !== '0s')
    ok(!lit.length, `dist ${r.sel}: literales ${lit}`)
    ok(!/!important/.test(b), `dist ${r.sel}: !important`)
  }
  ok(/@layer grana\.components[\s\S]*\.g-form-reveal/.test(css), 'dist: GFormReveal.css dentro de la capa grana.components')
}

/* ---------- Funciones de página (playground) ---------- */
const INIT = () => {
  // Cuadros desde el principio + nacimiento y is-ready de cada bloque (plan 012: nada de transición al montar)
  window.__frames = 0
  const tick = () => { window.__frames++; requestAnimationFrame(tick) }
  requestAnimationFrame(tick)
  window.__born = new Map(); window.__readyAt = new Map(); window.__bornReady = new Map()
  new MutationObserver((ms) => {
    for (const m of ms) {
      if (m.type === 'childList') for (const n of m.addedNodes) {
        if (n.nodeType !== 1) continue
        for (const el of [n, ...n.querySelectorAll('.g-form-reveal')]) if (el.classList.contains('g-form-reveal') && !window.__born.has(el)) { window.__born.set(el, window.__frames); window.__bornReady.set(el, el.classList.contains('is-ready')) }
      } else if (m.target.classList?.contains('g-form-reveal') && m.target.classList.contains('is-ready') && !window.__readyAt.has(m.target)) window.__readyAt.set(m.target, window.__frames)
    }
  }).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] })
}
const HELPERS = () => {
  document.documentElement.style.scrollBehavior = 'auto'
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
    if (base[3] < 1) base = over(base, rgba(getComputedStyle(document.documentElement).backgroundColor))
    if (base[3] < 1) base = over(base, [255, 255, 255, 1])
    for (let i = layers.length - 1; i >= 0; i--) base = over(layers[i], base)
    return base
  }
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]) }
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return +((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)).toFixed(2) }
  window.__barContrast = () => [...document.querySelectorAll('#fr-form .g-form-reveal.is-open > .g-form-reveal__body')].map((b) => {
    const bg = bgOf(b)
    return { id: b.parentElement.id, r: ratio(over(rgba(getComputedStyle(b).borderInlineStartColor), bg), bg), w: parseFloat(getComputedStyle(b).borderInlineStartWidth), c: getComputedStyle(b).borderInlineStartColor }
  })
  window.__app = () => document.getElementById('app').__vue_app__._instance.proxy
  window.__fm = () => window.__app().fm
  window.__set = async (o) => { Object.assign(window.__fm().r, o); await Vue.nextTick() }
  window.__frame = (n = 2) => new Promise((r) => { const f = () => (--n > 0 ? requestAnimationFrame(f) : r()); requestAnimationFrame(f) })
  window.__finishAll = () => document.getAnimations().forEach((a) => { try { a.finish() } catch {} })
  window.__st = (id) => { const el = document.getElementById(id); const cs = getComputedStyle(el); const body = el.firstElementChild
    return { inert: el.hasAttribute('inert'), disabled: body.disabled, vis: cs.visibility, op: +cs.opacity, h: +el.getBoundingClientRect().height.toFixed(2),
      mt: parseFloat(cs.marginBlockStart), ovf: getComputedStyle(body).overflowY, anim: el.classList.contains('is-animating'), open: el.classList.contains('is-open'), ready: el.classList.contains('is-ready') } }
  window.__pause = (id, frac) => { const el = document.getElementById(id); const as = el.getAnimations()
    const main = as.find((a) => a.transitionProperty === 'grid-template-rows') || as.find((a) => a.transitionProperty === 'opacity')
    if (!main) return null; const t = main.effect.getComputedTiming(); const at = (t.delay || 0) + t.duration * frac
    as.forEach((a) => { a.pause(); a.currentTime = at }); return as.map((a) => a.transitionProperty) }
  window.__track = (sel, ms) => new Promise((res) => {
    const el = document.querySelector(sel); const r0 = el.getBoundingClientRect(); const s0 = scrollY
    let dt = 0, dl = 0, ds = 0, n = 0, step = 0, prev = r0.top; const tops = []; const t0 = performance.now()
    ;(function f() { const r = el.getBoundingClientRect(); dt = Math.max(dt, Math.abs(r.top - r0.top)); dl = Math.max(dl, Math.abs(r.left - r0.left)); ds = Math.max(ds, Math.abs(scrollY - s0)); step = Math.max(step, Math.abs(r.top - prev)); prev = r.top; tops.push(+r.top.toFixed(1)); n++
      if (performance.now() - t0 < ms) requestAnimationFrame(f); else res({ dt, dl, ds, n, step, final: +(r.top - r0.top).toFixed(2), tops }) })()
  })
  window.__question = (rv) => { let q = rv.previousElementSibling; while (q && q.classList.contains('g-form-reveal')) q = q.previousElementSibling; return q }
  window.__geom = (id) => {
    const rv = document.getElementById(id); const body = rv.firstElementChild; const q = window.__question(rv)
    const rtl = getComputedStyle(rv).direction === 'rtl'
    const rb = body.getBoundingClientRect(), rq = q.getBoundingClientRect()
    const first = body.firstElementChild.getBoundingClientRect(); const cs = getComputedStyle(body)
    return { rtl, bar: parseFloat(cs.borderInlineStartWidth), ind: parseFloat(cs.paddingInlineStart), gapBody: parseFloat(cs.rowGap),
      startBody: rtl ? rb.right : rb.left, startQ: rtl ? rq.right : rq.left, endBody: rtl ? rb.left : rb.right, endQ: rtl ? rq.left : rq.right,
      contentStart: rtl ? first.right : first.left, dir: rtl ? -1 : 1 }
  }
  // Pregunta → siguiente hermano visible (saltando bloques cerrados), y pregunta → bloque
  window.__gap = (id) => { const rv = document.getElementById(id); const q = window.__question(rv); let next = rv.nextElementSibling
    while (next && next.classList.contains('g-form-reveal') && !next.classList.contains('is-open')) next = next.nextElementSibling
    const pr = rv.parentElement
    return { dist: next ? +(next.getBoundingClientRect().top - q.getBoundingClientRect().bottom).toFixed(2) : null,
      toParentEnd: +(pr.getBoundingClientRect().bottom - parseFloat(getComputedStyle(pr).paddingBlockEnd) - parseFloat(getComputedStyle(pr).borderBlockEndWidth) - q.getBoundingClientRect().bottom).toFixed(2),
      toRv: +(rv.getBoundingClientRect().top - q.getBoundingClientRect().bottom).toFixed(2),
      gap: parseFloat(getComputedStyle(pr).rowGap) || 0, inline: rv.style.getPropertyValue('--_reveal-gap') } }
  window.__frame0 = () => document.getElementById('fr-form').closest('[data-frame]')
}

const settle = (p) => p.evaluate(() => new Promise((r) => { let n = 4; const f = () => (--n ? requestAnimationFrame(f) : setTimeout(r, 30)); requestAnimationFrame(f) }))
const settled = (p, ids) => p.waitForFunction((is) => is.every((i) => !document.getElementById(i).classList.contains('is-animating')), [].concat(ids), { timeout: 4000 })
const ALL = ['fr-rv-factura', 'fr-rv-fisica', 'fr-rv-moral', 'fr-rv-alergias']
const setNow = async (p, o) => { await p.evaluate((x) => window.__set(x), o); await p.evaluate(() => { window.__finishAll() }); await settled(p, ALL); await settle(p) }
const setTheme = (p, css, dark) => p.evaluate(([c, d]) => { document.getElementById('theme').textContent = c; document.documentElement.dataset.theme = d ? 'dark' : 'light' }, [css, dark]).then(() => settle(p))

async function openPlay(browser, { reduced = false, forced = false, width = 1280, height = 900 } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, reducedMotion: reduced ? 'reduce' : 'no-preference', ...(forced ? { forcedColors: 'active' } : {}) })
  const p = await ctx.newPage()
  p.errs = []
  p.on('console', (m) => { const t = m.text(); if (['error', 'warning'].includes(m.type()) && !/ResizeObserver loop|favicon/.test(t)) p.errs.push(t) })
  p.on('pageerror', (e) => { if (!/ResizeObserver loop/.test(e.message)) p.errs.push(String(e)) })
  await p.route('https://unpkg.com/vue@3/dist/vue.global.js', (r) => r.fulfill({ status: 200, contentType: 'text/javascript', body: VUE }))
  await p.addInitScript(INIT)
  await p.goto(PLAY)
  await p.waitForSelector('#fr-rv-factura.is-ready')
  await p.evaluate(() => document.fonts.ready)
  await p.evaluate(HELPERS)
  await p.evaluate(() => document.getElementById('fr-form').scrollIntoView({ block: 'start' }))
  await settle(p)
  return p
}

for (const engine of ENGINES) {
  ENGINE = engine
  const browser = await pw[engine].launch()
  let p = await openPlay(browser)

  /* 1 · Marcado real frente al que espera el CSS */
  {
    const m = await p.evaluate(() => [...document.querySelectorAll('#fr-form .g-form-reveal')].map((el) => ({
      id: el.id, tag: el.tagName, role: el.getAttribute('role'), cls: [...el.classList], kids: el.children.length, body: el.firstElementChild?.tagName,
      bodyCls: el.firstElementChild?.className, bodyRole: el.firstElementChild?.getAttribute('role'), legend: !!el.firstElementChild?.querySelector(':scope > legend'),
      disabled: el.firstElementChild?.disabled, inert: el.hasAttribute('inert'), gap: el.style.getPropertyValue('--_reveal-gap'), pgap: getComputedStyle(el.parentElement).rowGap,
      born: window.__born.get(el), ready: window.__readyAt.get(el), bornReady: window.__bornReady.get(el) })))
    ok(m.length === 4, `marcado: 4 bloques en #fr-form (${m.length})`)
    for (const b of m) {
      const open = b.cls.includes('is-open')
      ok(b.tag === 'DIV' && !b.role && b.kids === 1 && b.body === 'FIELDSET' && b.bodyCls === 'g-form-reveal__body' && b.bodyRole === 'none' && !b.legend, `marcado ${b.id}: div sin rol > fieldset.g-form-reveal__body[role=none] único hijo, sin legend (${JSON.stringify(b)})`)
      ok(b.cls.includes('g-form-reveal') && b.cls.some((c) => /^g-form-reveal--density-(default|comfortable|compact)$/.test(c)) && b.cls.includes('is-ready') && !b.cls.includes('is-animating'), `marcado ${b.id}: clases ${b.cls}`)
      ok(open ? !b.inert && !b.disabled : b.inert && b.disabled, `marcado ${b.id}: inert y disabled según is-open (open ${open}, inert ${b.inert}, disabled ${b.disabled})`)
      const expect = /px$/.test(b.pgap) ? b.pgap : '0px'
      ok(/^-?[\d.]+px$/.test(b.gap) && b.gap === expect, `marcado ${b.id}: --_reveal-gap en px = row-gap del padre (${b.gap} vs ${b.pgap})`)
      ok(b.born !== undefined && b.ready !== undefined && b.ready - b.born >= 2 && b.bornReady === false, `marcado ${b.id}: is-ready ausente al nacer y puesto ≥ 2 cuadros después (nace ${b.born}, listo ${b.ready})`)
    }
    ok(m.find((b) => b.id === 'fr-rv-alergias')?.gap === '0px', 'marcado: --_reveal-gap 0px en el cuerpo de GFormSection (row-gap normal)')
    ok(await p.evaluate(() => document.getAnimations().filter((a) => a.effect?.target?.classList?.contains('g-form-reveal')).length) === 0, 'al cargar no corre ninguna transición de bloque')
  }

  /* 2 · Cerrado sin hueco (GFormLayout, cuerpo de un bloque, cuerpo de GFormSection), tres densidades */
  for (const d of ['default', 'comfortable', 'compact']) {
    await p.selectOption('#fm-bench-density', d)
    await setNow(p, { factura: 'si', persona: 'moral', alergias: 'no' })
    let g = await p.evaluate(() => window.__gap('fr-rv-fisica'))
    let s = await p.evaluate(() => window.__st('fr-rv-fisica'))
    ok(near(s.mt, -g.gap, 0.01) && s.h === 0 && s.vis === 'hidden', `${d} Física cerrada dentro del bloque: margen −row-gap, altura 0 (${s.mt} / ${g.gap})`)
    ok(near(g.dist, g.gap, 0.5), `${d} Tipo de persona → Moral (Física cerrada en medio) = una separación (${g.dist} vs ${g.gap})`)
    await setNow(p, { persona: '' })
    g = await p.evaluate(() => window.__gap('fr-rv-moral'))
    ok(near(g.dist, g.gap, 0.5), `${d} Tipo de persona → fila RFC con Física y Moral cerradas = una separación (${g.dist} vs ${g.gap})`)
    await setNow(p, { factura: 'no' })
    g = await p.evaluate(() => window.__gap('fr-rv-factura'))
    ok(g.gap > 0 && near(g.dist, g.gap, 0.5), `${d} GFormLayout: ¿Requiere factura? → Observaciones con el bloque cerrado = una separación (${g.dist} vs ${g.gap})`)
    const lay = await p.evaluate(() => [parseFloat(getComputedStyle(document.getElementById('fr-layout')).rowGap), window.__st('fr-rv-factura').mt])
    ok(near(lay[1], -lay[0], 0.01), `${d} GFormLayout: el margen negativo gana a .g-form-layout > * { margin: 0 } (${lay})`)
    g = await p.evaluate(() => window.__gap('fr-rv-alergias'))
    ok(g.inline === '0px' && near(g.toParentEnd, 0, 0.5), `${d} cuerpo de GFormSection: bloque cerrado no añade nada (${JSON.stringify(g)})`)
    // Abierto: separación del cuerpo = la de GFormLayout en esa densidad; sangría por densidad
    await setNow(p, { factura: 'si', persona: 'moral', alergias: 'si' })
    const geo = await p.evaluate(() => ({ f: window.__geom('fr-rv-factura'), lay: parseFloat(getComputedStyle(document.getElementById('fr-layout')).rowGap) }))
    ok(near(geo.f.gapBody, geo.lay, 0.01), `${d} el cuerpo separa como GFormLayout (${geo.f.gapBody} vs ${geo.lay})`)
    ok(near(geo.f.ind, { default: 16, comfortable: 14, compact: 12 }[d], 0.01) && near(geo.f.bar, 2, 0.01), `${d} barra 2px y sangría space-4 × densidad (${geo.f.bar} / ${geo.f.ind})`)
    g = await p.evaluate(() => window.__gap('fr-rv-factura'))
    ok(near(g.toRv, g.gap, 0.5), `${d} abierto: pregunta → bloque = una separación (${g.toRv} vs ${g.gap})`)
  }
  await p.selectOption('#fm-bench-density', 'default')

  /* 3 · Barra: alineación (LTR y RTL, tres densidades) y contraste en los temas de la auditoría */
  const THEMES = [['defecto', '', false], ['defecto oscuro', '', true], ['auditoría', AUDIT_CSS, false], ['auditoría oscuro', AUDIT_CSS, true], ['prueba', 'PRUEBA', false], ['prueba oscuro', 'PRUEBA', true]]
  const contrastRows = []
  for (const [name, css, dark] of THEMES) {
    if (css === 'PRUEBA') { await p.evaluate(() => window.__app().pgSetThemed(true)); await p.evaluate((d) => { document.documentElement.dataset.theme = d ? 'dark' : 'light' }, dark); await settle(p) }
    else { await p.evaluate(() => window.__app().pgSetThemed(false)); await setTheme(p, css, dark) }
    for (const pair of [{ persona: 'moral' }, { persona: 'fisica' }]) {
      await setNow(p, { factura: 'si', alergias: 'si', ...pair })
      const c = await p.evaluate(() => window.__barContrast())
      const min = Math.min(...c.map((x) => x.r))
      ok(c.length === 3 && min >= 3 && c.every((x) => near(x.w, 2, 0.01)), `${name} (${pair.persona}): barra 2px ≥ 3:1 (${JSON.stringify(c.map((x) => [x.id, x.r]))})`)
      contrastRows.push(`${name}: ${min}`)
    }
    for (const dir of ['ltr', 'rtl']) {
      await p.evaluate((d) => { window.__frame0().dir = d }, dir)
      for (const d of ['default', 'comfortable', 'compact']) {
        await p.selectOption('#fm-bench-density', d)
        await setNow(p, { persona: 'moral' })
        for (const id of ['fr-rv-factura', 'fr-rv-moral', 'fr-rv-alergias']) {
          const g = await p.evaluate((i) => window.__geom(i), id)
          const tag = `${name} ${dir} ${d} ${id}`
          ok(g.rtl === (dir === 'rtl'), `${tag}: dirección`)
          ok(near(g.startBody, g.startQ), `${tag}: la barra empieza en el inicio de la pregunta (${g.startBody.toFixed(2)} vs ${g.startQ.toFixed(2)})`)
          ok(near(g.endBody, g.endQ), `${tag}: el fin es el de las filas (${g.endBody.toFixed(2)} vs ${g.endQ.toFixed(2)})`)
          ok(near((g.contentStart - g.startBody) * g.dir, g.bar + g.ind), `${tag}: contenido tras barra + sangría (${((g.contentStart - g.startBody) * g.dir).toFixed(2)} vs ${g.bar + g.ind})`)
        }
      }
      await p.selectOption('#fm-bench-density', 'default')
    }
    await p.evaluate(() => { window.__frame0().dir = '' })
  }
  await p.evaluate(() => window.__app().pgSetThemed(false))
  for (const g of GEN) for (const dark of [false, true]) {
    await setTheme(p, GEN_CSS[g], dark)
    const c = await p.evaluate(() => window.__barContrast())
    const min = Math.min(...c.map((x) => x.r))
    ok(c.length === 3 && min >= 3, `${g}${dark ? ' oscuro' : ''}: barra ≥ 3:1 (mín. ${min})`)
    contrastRows.push(`${g}${dark ? ' oscuro' : ''}: ${min}`)
  }
  await setTheme(p, '', false)
  if (engine === ENGINES[0] || args.verbose) note('contraste mínimo de la barra: ' + contrastRows.filter((_, i) => i % 2 === 0 || i >= 12).join(' · '))

  /* 3b · 320px con los dos niveles abiertos: sin desborde, barras alineadas */
  for (const w of ['480', '360', '320']) {
    await p.selectOption('#fm-bench-w', w)
    await setNow(p, { factura: 'si', persona: 'moral', alergias: 'si' })
    const o = await p.evaluate(() => { const f = window.__frame0(); const out = [...f.querySelectorAll('.g-form-reveal.is-open *')].filter((e) => e.getClientRects().length && getComputedStyle(e).visibility === 'visible' && !e.closest('[popover]:not(:popover-open), .g-datepicker__pop')).filter((e) => e.getBoundingClientRect().right > f.getBoundingClientRect().right + 1 || e.getBoundingClientRect().left < f.getBoundingClientRect().left - 1).map((e) => e.className).slice(0, 4)
      return { sw: f.scrollWidth, cw: f.clientWidth, out, g: window.__geom('fr-rv-moral') } })
    ok(o.sw <= o.cw && !o.out.length, `${w}px con dos niveles abiertos: sin desborde (${o.sw}/${o.cw} ${o.out})`)
    ok(near(o.g.startBody, o.g.startQ) && near(o.g.endBody, o.g.endQ), `${w}px: barra anidada alineada`)
  }
  await p.selectOption('#fm-bench-w', '')
  await setNow(p, { factura: 'si', persona: 'moral', alergias: 'no' })

  /* 4 · Movimiento con clic real: Δ0 del disparador y del scroll, is-animating y su fin por transitionend */
  for (const dir of ['ltr', 'rtl']) {
    await p.evaluate((d) => { window.__frame0().dir = d; document.getElementById('fr-factura').scrollIntoView({ block: 'center' }) }, dir)
    await settle(p)
    for (const [ans, opening] of [['No', false], ['Sí', true]]) {
      const tr = p.evaluate(() => window.__track('#fr-factura', 520))
      const t0 = Date.now()
      await p.locator('#fr-factura .g-radio-group__option', { hasText: ans }).click()
      const anim = await p.evaluate(() => window.__st('fr-rv-factura'))
      const t = await tr
      ok(t.dt === 0 && t.dl === 0 && t.ds === 0 && t.n > 5, `${dir} ${opening ? 'abrir' : 'cerrar'} con clic: disparador Δ0 y Δscroll 0 en cada cuadro (${JSON.stringify({ ...t, tops: undefined })})`)
      ok(anim.anim && anim.open === opening, `${dir} ${opening ? 'abrir' : 'cerrar'}: is-animating durante la transición (${JSON.stringify(anim)})`)
      await settled(p, 'fr-rv-factura')
      const ms = Date.now() - t0
      const s = await p.evaluate(() => window.__st('fr-rv-factura'))
      ok(!s.anim && (opening ? s.vis === 'visible' && s.op === 1 && s.ovf === 'visible' && s.mt === 0 : s.vis === 'hidden' && s.h === 0 && s.op === 0), `${dir} ${opening ? 'abierto' : 'cerrado'} asentado (${JSON.stringify(s)}, ${ms}ms)`)
    }
    // El foco no salta al cerrar con el foco fuera; al cerrar con el foco dentro va a la opción elegida (sin mover nada)
    await p.locator('#fr-curp, #fr-razon').first().focus().catch(() => {})
    await p.locator('#fr-razon').focus()
    const tr = p.evaluate(() => window.__track('#fr-factura', 450))
    await p.evaluate(() => window.__set({ factura: 'no' }))
    const t = await tr
    const a = await p.evaluate(() => { const e = document.activeElement; return { id: e.id, checked: e.checked, inBlock: !!e.closest('#fr-rv-factura') } })
    ok(!a.inBlock && a.checked && t.dt === 0 && t.ds === 0, `${dir} cerrar con el foco dentro: foco a la opción elegida, Δ0 (${JSON.stringify(a)})`)
    await settled(p, 'fr-rv-factura')
    await setNow(p, { factura: 'si' })
  }
  await p.evaluate(() => { window.__frame0().dir = '' })

  /* 5 · Intermedios (pausados) */
  {
    const id = 'fr-rv-factura'
    const H = (await p.evaluate((i) => window.__st(i), id)).h
    await setNow(p, { factura: 'no' })
    await p.evaluate(() => window.__set({ factura: 'si' }))
    const props = await p.evaluate((i) => window.__pause(i, 0.5), id)
    ok(props && props.includes('grid-template-rows') && props.some((x) => /^margin-(block-start|top)$/.test(x)) && props.includes('opacity'), `abrir: altura, margen y opacidad (${props})`)
    let s = await p.evaluate((i) => window.__st(i), id)
    ok(s.h > 1 && s.h < H - 1 && s.anim && s.ovf === 'hidden' && !s.inert && !s.disabled, `abrir a la mitad: altura intermedia (${s.h} de ${H}), recortado, sin inert`)
    await p.evaluate((i) => window.__pause(i, 0.75), id)
    s = await p.evaluate((i) => window.__st(i), id)
    ok(s.op > 0 && s.op < 1 && s.vis === 'visible', `abrir a 3/4: opacidad intermedia (${s.op})`)
    await p.evaluate(() => window.__finishAll()); await settled(p, id)
    await p.evaluate(() => window.__set({ factura: 'no' }))
    await p.evaluate((i) => window.__pause(i, 0.25), id)
    s = await p.evaluate((i) => window.__st(i), id)
    ok(s.op > 0 && s.op < 1 && s.vis === 'visible' && s.h > 1 && s.h < H - 1 && s.inert && s.disabled, `cerrar a 1/4: visible, opacidad ${s.op} y altura ${s.h} intermedias, inert y disabled`)
    await p.evaluate(() => window.__finishAll()); await settled(p, id)
    await setNow(p, { factura: 'si', persona: 'moral' })
  }

  /* 6 · Fundido de cierre sin salto a gris con los controles reales (GRadioGroup, GInput, GDatePicker, GSelect, GCheckboxGroup) */
  for (const [name, css, dark] of [['defecto', '', false], ['defecto oscuro', '', true], ['auditoría', AUDIT_CSS, false]]) {
    await setTheme(p, css, dark)
    await setNow(p, { factura: 'si', persona: 'moral' })
    await p.evaluate(() => { document.activeElement?.blur(); document.getElementById('fr-factura').scrollIntoView({ block: 'start' }) })
    await settle(p)
    const loc = p.locator('#fr-rv-factura')
    const SEL = ['#fr-persona legend', '#fr-persona .g-radio-group__option', '#fr-razon input', '#fr-constitucion .g-datepicker__field', '#fr-regimen .g-select__button', '#fr-envio legend', '#fr-envio .g-checkbox__box, #fr-envio .g-checkbox input', '#fr-rfc .g-input__label']
    const styleOf = () => p.evaluate((sels) => sels.map((s) => { const el = document.querySelector(s); if (!el) return s + ':—'; const cs = getComputedStyle(el); return s + ':' + cs.color + '|' + cs.backgroundColor + '|' + cs.borderTopColor + '|' + cs.opacity }), SEL)
    const st0 = await styleOf()
    const before = await loc.screenshot({ animations: 'allow' })
    await p.evaluate(() => { window.__fm().r.factura = 'no' })
    await p.evaluate(() => new Promise((r) => requestAnimationFrame(r)))
    await p.evaluate(() => { const root = document.getElementById('fr-rv-factura')
      document.getAnimations().forEach((a) => { if (a.effect?.target === root) { a.pause(); a.currentTime = 0 } else { try { a.finish() } catch {} } }) })
    const s = await p.evaluate(() => window.__st('fr-rv-factura'))
    const st1 = await styleOf()
    const after = await loc.screenshot({ animations: 'allow' })
    ok(s.disabled && s.inert && s.op === 1, `${name} cierre, primer cuadro: disabled e inert puestos, opacidad 1 (${JSON.stringify(s)})`)
    const changed = st0.filter((x, i) => x !== st1[i])
    ok(!changed.length, `${name} cierre: los controles reales no cambian de aspecto (${changed.map((x, i) => x + ' → ' + st1[st0.indexOf(x)]).join(' ; ')})`)
    const diff = await p.evaluate(async ([A, B]) => {
      const load = (s) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = 'data:image/png;base64,' + s })
      const get = (i) => { const c = document.createElement('canvas'); c.width = i.width; c.height = i.height; const x = c.getContext('2d'); x.drawImage(i, 0, 0); return x.getImageData(0, 0, i.width, i.height).data }
      const [a, b] = [await load(A), await load(B)]; if (a.width !== b.width || a.height !== b.height) return { size: false, a: [a.width, a.height], b: [b.width, b.height] }
      const da = get(a), db = get(b); let n = 0, max = 0
      for (let i = 0; i < da.length; i += 4) { const d = Math.max(Math.abs(da[i] - db[i]), Math.abs(da[i + 1] - db[i + 1]), Math.abs(da[i + 2] - db[i + 2])); if (d) { n++; max = Math.max(max, d) } }
      return { size: true, n, max }
    }, [before.toString('base64'), after.toString('base64')])
    ok(diff.size && diff.max <= 8, `${name} cierre: captura del bloque igual a la del abierto, nada salta a gris (${JSON.stringify(diff)})`)
    await p.evaluate(() => window.__finishAll()); await settled(p, 'fr-rv-factura')
  }
  await setTheme(p, '', false)
  await setNow(p, { factura: 'si', persona: 'moral', alergias: 'no' })

  /* 7 · Antecedentes: bloque directo en el cuerpo de GFormSection (juicio visual; ver auditoria.md, hallazgo 1) */
  {
    await setNow(p, { alergias: 'si' })
    const g = await p.evaluate(() => { const q = document.getElementById('fr-alergias'); const rv = document.getElementById('fr-rv-alergias')
      const opt = q.querySelector('.g-radio-group__options').getBoundingClientRect(); const lab = rv.querySelector('label, .g-textarea__label').getBoundingClientRect()
      return { toRv: +(rv.getBoundingClientRect().top - q.getBoundingClientRect().bottom).toFixed(2), optToLabel: +(lab.top - opt.bottom).toFixed(2), lay: parseFloat(getComputedStyle(document.getElementById('fr-layout')).rowGap) } })
    ok(g.toRv === 0, `Antecedentes: pregunta → bloque = 0 (lo que dice el contrato con row-gap normal) (${JSON.stringify(g)})`)
    note(`Antecedentes: pregunta → bloque ${g.toRv}px (en GFormLayout ${g.lay}px); opciones → etiqueta «¿A qué?» ${g.optToLabel}px`)
    await setNow(p, { alergias: 'no' })
  }

  /* 8 · Varios bloques a la vez (todos cerrados → todos abiertos → todos cerrados en la misma tarea) */
  {
    await setNow(p, { factura: 'no', persona: '', alergias: 'no' })
    await p.evaluate(() => document.getElementById('fr-factura').scrollIntoView({ block: 'start' }))
    await settle(p)
    for (const [o, open] of [[{ factura: 'si', persona: 'fisica', alergias: 'si' }, true], [{ factura: 'no', persona: '', alergias: 'no' }, false], [{ factura: 'si', persona: 'moral', alergias: 'si' }, true]]) {
      const tr = p.evaluate(() => window.__track('#fr-factura', 450))
      const tr2 = p.evaluate(() => window.__track('#fr-alergias', 450))
      await p.evaluate((x) => window.__set(x), o)
      const [t, t2] = [await tr, await tr2]
      await settled(p, ALL)
      const st = await p.evaluate((ids) => ids.map((i) => window.__st(i)), ALL)
      const want = open ? { 'fr-rv-factura': true, 'fr-rv-fisica': o.persona === 'fisica', 'fr-rv-moral': o.persona === 'moral', 'fr-rv-alergias': true } : {}
      ok(t.dt === 0 && t.ds === 0, `varios a la vez (${open ? 'abrir' : 'cerrar'}): disparador Δ0 y Δscroll 0 (${JSON.stringify({ ...t, tops: undefined })})`)
      // La pregunta de abajo se desplaza (lo de arriba crece o encoge) de forma continua: sin saltos de un cuadro
      const mid = inter(t2.tops)
      ok(t2.dt > 50 && mid >= 2, `varios a la vez (${open ? 'abrir' : 'cerrar'}): lo de abajo se mueve de forma continua, con posiciones intermedias (total ${t2.dt.toFixed(0)}px, ${mid} intermedias en ${t2.n} cuadros)`)
      ok(st.every((s, i) => !s.anim && s.open === Boolean(want[ALL[i]]) && (s.open ? s.vis === 'visible' && s.op === 1 : s.vis === 'hidden' && s.h === 0)), `varios a la vez: todos asentados en su estado (${JSON.stringify(st.map((s) => [s.open, s.vis, s.h, s.anim]))})`)
    }
  }

  /* 9 · Bloque grande cerrado con la página desplazada hasta el final */
  {
    await setNow(p, { factura: 'si', persona: 'moral', alergias: 'no' })
    await p.setViewportSize({ width: 1280, height: 1100 })
    // Todo lo que sigue al formulario se oculta: el formulario queda al final del documento
    await p.evaluate(() => { let n = document.getElementById('fr-form').closest('[data-frame]')
      while (n && n !== document.body) { let s = n.nextElementSibling; while (s) { if (s.tagName !== 'SCRIPT') s.style.display = 'none'; s = s.nextElementSibling } n = n.parentElement }
      document.body.style.paddingBottom = '0' })
    await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
    await settle(p)
    const pre = await p.evaluate(() => ({ max: document.documentElement.scrollHeight - innerHeight, y: scrollY, top: document.getElementById('fr-factura').getBoundingClientRect().top, H: document.getElementById('fr-rv-factura').getBoundingClientRect().height }))
    ok(near(pre.y, pre.max, 1) && pre.top > 0 && pre.top < 1100, `final de página: desplazado al máximo con la pregunta visible (${JSON.stringify(pre)})`)
    const tr = p.evaluate(() => window.__track('#fr-factura', 520))
    await p.locator('#fr-factura .g-radio-group__option', { hasText: 'No' }).click()
    const t = await tr
    await settled(p, 'fr-rv-factura')
    const post = await p.evaluate(() => ({ y: scrollY, top: document.getElementById('fr-factura').getBoundingClientRect().top }))
    // Sin contenido debajo el navegador recorta el scroll: el disparador baja lo que encoge la página, pero en continuo
    const steps = t.tops.slice(1).map((v, i) => Math.abs(v - t.tops[i]))
    ok(post.top > 0 && post.top < 1100, `final de página, cerrar: el disparador sigue visible (${post.top.toFixed(1)})`)
    ok(inter(t.tops) >= 2, `final de página, cerrar: sin salto de un cuadro, con posiciones intermedias (total ${t.dt.toFixed(1)}px, ${inter(t.tops)} intermedias, paso máx. ${Math.max(...steps).toFixed(1)}px, ${t.n} cuadros)`)
    note(`final de página, cerrar el bloque de ${pre.H.toFixed(0)}px: el disparador baja ${t.final}px (scroll ${pre.y.toFixed(0)} → ${post.y.toFixed(0)}), paso máx. por cuadro ${Math.max(...steps).toFixed(1)}px en ${t.n} cuadros`)
    const tr2 = p.evaluate(() => window.__track('#fr-factura', 520))
    await p.locator('#fr-factura .g-radio-group__option', { hasText: 'Sí' }).click()
    const t2 = await tr2
    await settled(p, 'fr-rv-factura')
    ok(t2.dt === 0 && t2.ds === 0, `final de página, abrir: disparador Δ0 y Δscroll 0 (${JSON.stringify({ ...t2, tops: undefined })})`)
  }
  ok(!p.errs.length, `consola (playground): ${[...new Set(p.errs)].slice(0, 5).join(' | ')}`)
  await p.context().close()

  /* 10 · Movimiento reducido: solo fundido; is-animating lo retira el temporizador de respaldo */
  p = await openPlay(browser, { reduced: true })
  {
    const id = 'fr-rv-factura'
    await p.evaluate(() => document.getElementById('fr-factura').scrollIntoView({ block: 'center' }))
    for (const [ans, opening] of [['No', false], ['Sí', true]]) {
      const tr = p.evaluate(() => window.__track('#fr-factura', 400))
      // Las transiciones que arrancan se recogen con transitionrun (un clic puede tardar más que el fundido en WebKit)
      const t0 = await p.evaluate((i) => { window.__runs = []; const el = document.getElementById(i); el.ontransitionrun = (e) => { if (e.target === el) window.__runs.push(e.propertyName) }; return performance.now() }, id)
      await p.locator('#fr-factura .g-radio-group__option', { hasText: ans }).click()
      await p.waitForFunction(() => window.__runs.length > 0, null, { timeout: 2000 }).catch(() => {})
      const s = await p.evaluate((i) => ({ ...window.__st(i), at: performance.now() }), id)
      const early = s.at - t0 < 100 // el clic de Playwright puede tardar más que el fundido: solo entonces se mira el primer cuadro
      const props = await p.evaluate(() => window.__runs)
      ok(!props.includes('grid-template-rows') && !props.some((x) => /^margin/.test(x)) && props.includes('opacity'), `reducido ${opening ? 'abrir' : 'cerrar'}: sin altura ni margen, con fundido (${props})`)
      ok((opening ? s.h > 100 && s.mt === 0 && s.vis === 'visible' : s.inert) && (!early || s.anim && s.vis === 'visible'), `reducido ${opening ? 'abrir' : 'cerrar'}: ${opening ? 'altura final en el primer cuadro' : 'visible hasta que acaba el fundido'} (${JSON.stringify(s)})`)
      const end = await p.waitForFunction((i) => !document.getElementById(i).classList.contains('is-animating') && performance.now(), id, { timeout: 3000 }).then((h) => h.jsonValue())
      const ms = end - t0
      const t = await tr
      note(`reducido ${opening ? 'abrir' : 'cerrar'}: is-animating se retira a los ${ms.toFixed(0)}ms (temporizador: 120 + 50ms)`)
      ok(ms >= 120 && ms < 600, `reducido ${opening ? 'abrir' : 'cerrar'}: is-animating lo retira el temporizador (fundido 120ms + 50ms; medido ${ms.toFixed(0)}ms)`)
      ok(t.dt === 0 && t.ds === 0, `reducido ${opening ? 'abrir' : 'cerrar'}: disparador Δ0 (${JSON.stringify({ ...t, tops: undefined })})`)
      const e = await p.evaluate((i) => window.__st(i), id)
      ok(opening ? e.op === 1 && e.ovf === 'visible' : e.vis === 'hidden' && e.h === 0, `reducido ${opening ? 'abierto' : 'cerrado'} asentado (${JSON.stringify(e)})`)
    }
  }
  ok(!p.errs.length, `consola (reducido): ${[...new Set(p.errs)].slice(0, 5).join(' | ')}`)
  await p.context().close()

  /* 11 · forced-colors (solo Chromium la emula) */
  if (engine === 'chromium') {
    p = await openPlay(browser, { forced: true })
    await setNow(p, { factura: 'si', persona: 'moral', alergias: 'si' })
    const fc = await p.evaluate(() => ({ fc: matchMedia('(forced-colors: active)').matches, bars: window.__barContrast(), canvasText: (() => { const s = document.createElement('span'); s.style.color = 'CanvasText'; document.body.append(s); const c = getComputedStyle(s).color; s.remove(); return c })() }))
    ok(fc.fc && fc.bars.length === 3 && fc.bars.every((x) => x.w >= 1 && x.r >= 3 && x.c === fc.canvasText), `forced-colors: barra = CanvasText, ≥ 3:1 (${JSON.stringify(fc)})`)
    for (const dir of ['ltr', 'rtl']) {
      await p.evaluate((d) => { window.__frame0().dir = d }, dir)
      await settle(p)
      for (const id of ['fr-rv-factura', 'fr-rv-moral']) { const g = await p.evaluate((i) => window.__geom(i), id); ok(near(g.startBody, g.startQ) && near(g.endBody, g.endQ), `forced-colors ${dir} ${id}: barra alineada`) }
    }
    await p.evaluate(() => { window.__frame0().dir = '' })
    await setNow(p, { persona: 'fisica' })
    const hidden = await p.evaluate(() => window.__st('fr-rv-moral'))
    ok(hidden.vis === 'hidden' && hidden.h === 0, 'forced-colors: cerrado invisible y sin altura')
    ok(!p.errs.length, `consola (forced-colors): ${p.errs.join(' | ')}`)
    await p.context().close()
  }

  /* 12 · GRadioGroup __label-text (#282): LTR igual que sin la envoltura; RTL bien ordenado */
  p = await openPlay(browser, { reduced: true })
  {
    await setNow(p, { factura: 'si', persona: 'moral', alergias: 'si' })
    const IDS = ['fr-factura', 'fr-persona', 'fr-alergias', 'fm-primera', 'rg-segmented', 'rg-rtl']
    const present = await p.evaluate((ids) => ids.filter((i) => document.querySelector(`#${i} > .g-radio-group__label > .g-radio-group__label-text[dir="auto"]`)), IDS)
    ok(present.length === IDS.length, `__label-text con dir=auto como primer hijo de la etiqueta (${present})`)
    const css = await p.evaluate(() => { const t = document.querySelector('#fr-factura .g-radio-group__label-text'); const l = t.parentElement; const a = getComputedStyle(t), b = getComputedStyle(l)
      return { display: a.display, same: ['font-family', 'font-size', 'font-weight', 'line-height', 'color', 'letter-spacing'].every((k) => a.getPropertyValue(k) === b.getPropertyValue(k)) } })
    ok(css.display === 'inline' && css.same, `__label-text: en línea y hereda la tipografía de la etiqueta (${JSON.stringify(css)})`)
    // Captura de cada etiqueta con la envoltura y sin ella (el DOM de antes de #282): igual en LTR
    for (const [name, th, dark] of [['defecto', '', false], ['auditoría oscuro', AUDIT_CSS, true]]) {
      await setTheme(p, th, dark)
      for (const id of IDS.filter((i) => i !== 'rg-rtl')) {
        await p.locator('#' + id).scrollIntoViewIfNeeded()
        const box = await p.evaluate((i) => { const r = document.querySelector(`#${i} > .g-radio-group__label`).getBoundingClientRect(); return { w: r.width, h: r.height } }, id)
        const a = await p.locator(`#${id} > .g-radio-group__label`).screenshot()
        const restore = await p.evaluate((i) => { const t = document.querySelector(`#${i} .g-radio-group__label-text`); const frag = document.createDocumentFragment(); const kids = [...t.childNodes]; kids.forEach((k) => frag.append(k)); const parent = t.parentNode; const next = t.nextSibling; t.remove(); parent.insertBefore(frag, next); window.__restore = () => { kids.forEach((k) => t.append(k)); parent.insertBefore(t, parent.firstChild) }; return true }, id)
        const box2 = await p.evaluate((i) => { const r = document.querySelector(`#${i} > .g-radio-group__label`).getBoundingClientRect(); return { w: r.width, h: r.height } }, id)
        const b = await p.locator(`#${id} > .g-radio-group__label`).screenshot()
        await p.evaluate(() => window.__restore())
        ok(restore && near(box.w, box2.w, 0.01) && near(box.h, box2.h, 0.01) && a.equals(b), `${name} ${id}: la etiqueta se ve igual que sin __label-text (${JSON.stringify([box, box2])}, captura ${a.equals(b) ? 'idéntica' : 'distinta'})`)
      }
    }
    await setTheme(p, '', false)
    // RTL: el texto español no se invierte («¿» antes que «?» de izquierda a derecha); la etiqueta al inicio (derecha) y la marca después
    await p.evaluate(() => { window.__frame0().dir = 'rtl' })
    await settle(p)
    for (const id of ['fr-factura', 'fr-alergias']) {
      const r = await p.evaluate((i) => {
        const lab = document.querySelector(`#${i} > .g-radio-group__label`); const t = lab.querySelector('.g-radio-group__label-text'); const w = document.createTreeWalker(t, NodeFilter.SHOW_TEXT); let node; while ((node = w.nextNode()) && !node.textContent.includes('¿'));
        const txt = node.textContent; const rect = (k) => { const rg = document.createRange(); rg.setStart(node, k); rg.setEnd(node, k + 1); return rg.getBoundingClientRect() }
        const first = rect(txt.indexOf('¿')), last = rect(txt.lastIndexOf('?'))
        const opt0 = lab.querySelector('.g-radio-group__optional'); const opt = opt0 && opt0.getBoundingClientRect(); const tr = t.getBoundingClientRect(); const lr = lab.getBoundingClientRect(); const pad = parseFloat(getComputedStyle(lab).paddingRight)
        const firstOpt = document.querySelector(`#${i} .g-radio-group__option`).getBoundingClientRect()
        return { dir: getComputedStyle(t).direction, inv: first.left < last.left, textRight: tr.right, labRight: lr.right - pad, optLeftOfText: opt ? opt.right <= tr.left + 0.5 : null, opt: opt && [opt.left, opt.right, opt0.getClientRects().length], tl: tr.left, html: lab.innerHTML, optRight: firstOpt.right }
      }, id)
      ok(r.dir === 'ltr' && r.inv, `RTL ${id}: el texto «¿…?» se lee de izquierda a derecha (${JSON.stringify(r)})`)
      ok(near(r.textRight, r.labRight, 1) && near(r.textRight, r.optRight, 1), `RTL ${id}: la etiqueta empieza a la derecha, alineada con la primera opción (${r.textRight.toFixed(1)} / ${r.labRight.toFixed(1)} / ${r.optRight.toFixed(1)})`)
      if (r.optLeftOfText !== null) ok(r.optLeftOfText, `RTL ${id}: «(opcional)» después del texto (a su izquierda) ${JSON.stringify(r)}`)
    }
    const ar = await p.evaluate(() => { const t = document.querySelector('#rg-rtl .g-radio-group__label-text'); return getComputedStyle(t).direction })
    ok(ar === 'rtl', `RTL árabe (rg-rtl): dir=auto resuelve rtl (${ar})`)
    await p.evaluate(() => { window.__frame0().dir = '' })
  }
  ok(!p.errs.length, `consola (etiquetas): ${[...new Set(p.errs)].slice(0, 5).join(' | ')}`)
  await p.context().close()

  /* 13 · 40 bloques con la UMD real (Vue + dist/grana.umd.js): todos a la vez sin desorden ni cuadros largos */
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
    const q = await ctx.newPage()
    const errs = []
    q.on('console', (m) => { if (['error', 'warning'].includes(m.type()) && !/ResizeObserver loop/.test(m.text())) errs.push(m.text()) })
    q.on('pageerror', (e) => errs.push(String(e)))
    await q.route(ORIGIN + '/__stress.html', (r) => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: `<!doctype html><html lang="es"><head><meta charset="utf-8"><link rel="stylesheet" href="/packages/vue/dist/grana.css"><link rel="stylesheet" href="/packages/vue/dist/fonts.css"><style>body{margin:0;padding:16px;background:var(--g-color-bg);color:var(--g-color-text);font-family:var(--g-font-ui)}</style></head><body><div id="app"></div><script src="/node_modules/vue/dist/vue.global.prod.js"></script><script src="/packages/vue/dist/grana.umd.js"></script><script>
      const { createApp, reactive, h } = Vue
      const st = reactive({ on: false })
      window.__st40 = st
      createApp({ render: () => h(Grana.GForm, { 'aria-label': 'Carga' }, () => h(Grana.GFormLayout, null, () => Array.from({ length: 40 }, (_, i) => [
        h(Grana.GSwitch, { label: 'Pregunta ' + i, name: 'q' + i, modelValue: st.on }),
        h(Grana.GFormReveal, { when: st.on, class: 'rv40' }, () => [h(Grana.GInput, { label: 'Campo ' + i, name: 'c' + i }), h(Grana.GFormReveal, { when: st.on && i % 2 === 0 }, () => h(Grana.GInput, { label: 'Anidado ' + i, name: 'n' + i }))])
      ]).flat())) }).mount('#app')
      document.documentElement.dataset.ready = ''
    </script></body></html>` }))
    await q.goto(ORIGIN + '/__stress.html')
    await q.waitForSelector('html[data-ready]')
    await q.waitForFunction(() => document.querySelectorAll('.g-form-reveal.is-ready').length === 80)
    const run = (on) => q.evaluate((v) => new Promise((res) => {
      const top = document.querySelector('.g-switch, .g-form-layout > *').getBoundingClientRect().top
      let last = performance.now(), worst = 0, n = 0
      window.__st40.on = v
      const t0 = performance.now()
      ;(function f() { const now = performance.now(); worst = Math.max(worst, now - last); last = now; n++
        if (document.querySelectorAll('.g-form-reveal.is-animating').length === 0 && now - t0 > 50) res({ worst: +worst.toFixed(1), n, ms: +(now - t0).toFixed(0), dTop: document.querySelector('.g-switch, .g-form-layout > *').getBoundingClientRect().top - top,
          open: document.querySelectorAll('.g-form-reveal.is-open').length, hidden: [...document.querySelectorAll('.g-form-reveal:not(.is-open)')].every((e) => getComputedStyle(e).visibility === 'hidden' && e.getBoundingClientRect().height === 0) })
        else if (now - t0 > 3000) res({ timeout: true, animating: document.querySelectorAll('.g-form-reveal.is-animating').length })
        else requestAnimationFrame(f) })()
    }), on)
    const a = await run(true)
    const b = await run(false)
    ok(!a.timeout && a.open === 60 && a.dTop === 0, `40 bloques (+20 anidados) abriendo a la vez: todos asentados, el primero no se mueve (${JSON.stringify(a)})`)
    ok(!b.timeout && b.open === 0 && b.hidden, `40 bloques cerrando a la vez: todos cerrados sin altura (${JSON.stringify(b)})`)
    note(`40 bloques + 20 anidados: abrir ${a.ms}ms (cuadro más largo ${a.worst}ms), cerrar ${b.ms}ms (cuadro más largo ${b.worst}ms)`)
    ok(!errs.length, `consola (40 bloques): ${errs.slice(0, 4).join(' | ')}`)
    await ctx.close()
  }
  await browser.close()
}
server.close()
console.log(info.join('\n'))
console.log(`\nGFormReveal · auditoría (componente real): ${total - failed}/${total}`)
if (fails.length) { console.log(fails.join('\n')); process.exitCode = 1 }
