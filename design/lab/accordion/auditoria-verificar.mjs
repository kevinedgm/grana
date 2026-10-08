// Auditoría de coco (paso 5) de GAccordion + GAccordionItem sobre el COMPONENTE REAL: design/lab/accordion/auditoria-banco.html
// con GAccordion/GAccordionItem de dist/grana.umd.js (paquete principal, #476), dist/grana.css y dist/fonts.css, y los
// vecinos reales (GSurface, GCard, GDialog, GSwitch, GBtn, GInput, GFormSection). Repite la batería de estilo-verificar.mjs
// sobre el real y añade lo que solo existe con él: marcado real frente al que espera el CSS, CSS publicado (capa y
// @property), contraste en 28 configuraciones (defecto, auditoría, propio y los once de dark-color-presence/generated, claro
// y oscuro), geometría también con el tema de la auditoría (texto 19, space 5, Georgia), A2 y Δ0 por cuadro con el motor real
// (utils/collapse.js), Δ0 en cadena (contenedor que no puede desplazarse más → el documento), cancelación al desplazar, #id
// del elemento al cargar (también reaplicado en load con una imagen que llega tarde) y en hashchange, ancla de dentro de un
// plegado, #:~:text=, lazy, impresión, movimiento reducido, sticky (pegado, fondo de anfitrionas, scroll-margin, Mayús+Tab y
// el ajuste de focusin para 2.4.11 en WebKit, cierre desde el pegado, GDialog), dos recetas de la aplicación (scroll-padding
// del documento + --g-accordion-sticky-top; h3 { margin } global sin capa), RTL, 320px, forced-colors (Chromium),
// GFormSection plegable con el motor compartido y consola limpia.
// Ejecutar desde la raíz del repo:  GRANA_PW_PORT=4214 node design/lab/accordion/auditoria-verificar.mjs
// Opcional: GRANA_DIST=<copia de dist/>  --engines=chromium,firefox,webkit  --themes=base  --verbose  --only=0,1,…
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
    // Imagen sin tamaño que llega tarde (?late=<ms>): mueve lo de debajo antes de load
    const slow = path.match(/^\/__slow\/(\d+)\.svg$/)
    if (slow) {
      await new Promise((r) => setTimeout(r, Number(slow[1])))
      res.writeHead(200, { 'content-type': 'image/svg+xml', 'cache-control': 'no-store' }).end('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200"><rect width="400" height="200" fill="#888"/></svg>')
      return
    }
    const p = DIST && path.startsWith('/packages/vue/dist/') ? join(DIST, path.slice('/packages/vue/dist/'.length)) : normalize(join(ROOT, path))
    if (!DIST && !p.startsWith(ROOT)) throw new Error('fuera')
    const body = await readFile(p)
    res.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream' }).end(body)
  } catch { res.writeHead(404).end() }
})
await new Promise((r) => server.listen(Number(process.env.GRANA_PW_PORT) || 4214, '127.0.0.1', r))
const BASE = `http://127.0.0.1:${server.address().port}/design/lab/accordion/auditoria-banco.html`

const GEN = ['amazon', 'apple', 'caracol-purpura', 'github', 'grana', 'linear', 'lustre', 'medium', 'notion', 'spotify', 'stripe']
let total = 0, failed = 0
const fails = [], notes = []
const counts = {}
const ok = (cond, msg, eng = 'estático') => { total++; counts[eng] = counts[eng] || [0, 0]; counts[eng][1]++; if (cond) counts[eng][0]++; else { failed++; fails.push(msg) } }
const note = (s) => notes.push(s)

/* ---------- 0 · Análisis estático del CSS fuente y del publicado ---------- */
if (run(0)) {
  const raw = await readFile(join(ROOT, 'packages/vue/src/components/GAccordion/GAccordion.css'), 'utf8')
  const css = raw.replace(/\/\*[\s\S]*?\*\//g, '')
  ok(!/#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|lab|lch|hwb|color|color-mix)\(/.test(css), 'CSS: color literal')
  const named = [...css.matchAll(/:\s*([A-Za-z]+)\s*;/g)].map((m) => m[1]).filter((w) => /^(ButtonText|GrayText|Canvas|CanvasText|Highlight|HighlightText|red|blue|black|white|gray|grey)$/.test(w))
  ok(named.every((w) => ['ButtonText', 'GrayText'].includes(w)), 'CSS: color con nombre fuera de los del sistema: ' + named)
  ok(!/var\(\s*--[\w-]+\s*,/.test(css), 'CSS: var() con valor de respaldo')
  ok(!/@layer/.test(css) && !/!important/.test(css), 'CSS: @layer o !important')
  const prop = css.match(/@property\s+(--[\w-]+)\s*\{([^}]*)\}/g) || []
  ok(prop.length === 1 && /@property --g-accordion-sticky-top \{\s*syntax: "<length>";\s*inherits: true;\s*initial-value: 0px;\s*\}/.test(prop[0]), 'CSS: @property --g-accordion-sticky-top (<length>, inherits, 0px)')
  const vars = [...css.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1])
  ok(vars.every((v) => v.startsWith('--g-') || v.startsWith('--_')), 'CSS: var() que no es --g-* ni --_*')
  const defaults = await readFile(join(ROOT, 'packages/vue/src/styles/defaults.css'), 'utf8')
  const defined = new Set([...defaults.matchAll(/(--g-[a-z0-9-]+)\s*:/g)].map((m) => m[1]))
  const missing = [...new Set(vars.filter((v) => v.startsWith('--g-') && !defined.has(v) && v !== '--g-accordion-sticky-top'))]
  ok(!missing.length, 'CSS: tokens que no existen en defaults.css ' + missing)
  ok(!defined.has('--g-accordion-sticky-top'), 'defaults.css: --g-accordion-sticky-top no es del tema (#484)')
  ok(!/--g-color-(on-)?brand(?![a-z])/.test(css), 'CSS: lee brand en vez de un rol')
  const own = new Set([...css.matchAll(/(--_[\w-]+)\s*:/g)].map((m) => m[1]))
  const OWN = ['--_scroll-pad', '--_sticky-bg', '--_accordion-on', '--_inset', '--_pad-start', '--_pad-end', '--_after', '--_t', '--_t-fade', '--_chev', '--_head-size']
  ok([...own].every((v) => OWN.includes(v)), 'CSS: alias propios fuera de la lista: ' + [...own].filter((v) => !OWN.includes(v)))
  ok(![...new Set(vars.filter((v) => v.startsWith('--_') && !own.has(v)))].length, 'CSS: lee alias --_* que no declara')
  const px = [...css.matchAll(/(-?\d*\.?\d+)px/g)].map((m) => m[0])
  ok(px.every((p) => p === '44px' || p === '0px') && px.filter((p) => p === '0px').length === 1, 'CSS: medidas literales no permitidas ' + px)
  const nums = [...css.matchAll(/\*\s*(-?\d*\.?\d+)\b(?!px|ms|%)/g)].map((m) => m[1])
  ok(nums.every((n) => ['-1', '0', '0.5', '-0.5'].includes(n)), 'CSS: factores fuera de −1, 0 y ±0,5: ' + nums)
  ok(!/@keyframes|animation\s*:/.test(css), 'CSS: keyframes o animation')
  // Receta (b), #515: la cabecera fija de la aplicación es de su scroll-padding; ni el botón ni la raíz llevan scroll-margin, y el
  // del contenido de un grupo sticky es solo --_head-size
  const sms = [...css.matchAll(/scroll-margin-block-start:\s*([^;]+);/g)].map((m) => m[1].trim())
  ok(sms.length === 1 && sms[0] === 'var(--_head-size)', 'CSS: único scroll-margin-block-start = var(--_head-size) (sin --g-accordion-sticky-top; #515): ' + sms)
  ok(!/scroll-margin[^;]*sticky-top/.test(css) && /\.g-accordion-item__toggle \{(?![^}]*scroll-margin)/.test(css), 'CSS: ni el botón ni la raíz con scroll-margin (#515)')
  ok(!/ease-spring|ease-bounce|cubic-bezier|steps\(/.test(css), 'CSS: muelle, rebote o curva propia (#299, #483)')
  ok(!/\bvisibility\s*:\s*hidden/.test(css.replace(/\.g-accordion-item\.is-open > \.g-accordion-item__peek \{[^}]*\}/, '')), 'CSS: visibility: hidden fuera del avance abierto (#480)')
  ok(/\.g-accordion \{[^}]*overflow-anchor: none/.test(css) && /\.g-accordion-item\.is-standalone \{[^}]*overflow-anchor: none/.test(css), 'CSS: overflow-anchor: none (#481)')
  const structural = [...css.replace(/\{[^}]*\}/g, '{}').matchAll(/>\s*(\*|:[\w-]+(?:\([^)]*\)*)?)/g)].map((m) => m[1]).filter((x) => !/^:is\(\.g-accordion-item__/.test(x) && !/^:nth-(last-)?child\(1 of (:not\(:where\(\.g-tooltip\)\)|\.g-accordion-item)/.test(x))
  ok(!structural.length, 'CSS: selector de hijos por estructura sin excluir .g-tooltip (#383): ' + structural)
  let ctx = [], pending = ''
  const motion = [], hov = []
  for (const t of css.split(/([{}])/)) {
    if (t === '{') { ctx.push(pending.trim()); pending = '' }
    else if (t === '}') { ctx.pop(); pending = '' }
    else {
      pending += t
      const m = t.match(/transition\s*:([^;]*)/)
      if (m && /translate|rotate|grid-template-rows|box-shadow/.test(m[1])) motion.push(ctx.join(' » '))
      if (ctx.length && /:hover/.test(ctx[ctx.length - 1]) && /:/.test(t)) hov.push(ctx.join(' » '))
    }
  }
  ok(motion.length >= 3 && motion.every((c) => /prefers-reduced-motion: no-preference/.test(c)), 'CSS: transición de movimiento fuera de no-preference')
  ok(hov.length >= 2 && hov.every((c) => /@media \(hover: hover\)/.test(c)), 'CSS: :hover fuera de @media (hover: hover)')
  // Publicado: dentro de grana.components, @property presente, marcado en grana.js, fuente sin incrustar
  const dcss = await readFile(join(DISTDIR, 'grana.css'), 'utf8')
  const djs = await readFile(join(DISTDIR, 'grana.js'), 'utf8')
  const layerAt = dcss.indexOf('@layer grana.components')
  const peekAt = dcss.indexOf('.g-accordion-item__peek')
  ok(layerAt >= 0 && peekAt > layerAt, 'dist: GAccordion fuera de @layer grana.components')
  ok(/@property --g-accordion-sticky-top/.test(dcss), 'dist: sin @property --g-accordion-sticky-top')
  ok(dcss.split('.g-accordion-item__peek').length - 1 === raw.replace(/\/\*[\s\S]*?\*\//g, '').split('.g-accordion-item__peek').length - 1, 'dist: grana.css no coincide con GAccordion.css (reconstruir)')
  ok(/g-accordion-item/.test(djs) && /GAccordionItem/.test(djs), 'dist: GAccordion fuera de grana.js')
  ok(!/data:font/.test(dcss), 'dist: fuente incrustada')
}

/* ---------- En la página ---------- */
const lib = () => {
  const parse = (s) => {
    let m = s.match(/rgba?\(([^)]+)\)/)
    if (m) { const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p[3] ?? 1] }
    m = s.match(/color\(srgb ([^)]+)\)/)
    if (m) { const p = m[1].split(/[\s/]+/).filter(Boolean).map(Number); return [p[0] * 255, p[1] * 255, p[2] * 255, p[3] ?? 1] }
    return [0, 0, 0, 0]
  }
  const over = (top, bot) => { const a = top[3]; return [top[0] * a + bot[0] * (1 - a), top[1] * a + bot[1] * (1 - a), top[2] * a + bot[2] * (1 - a), 1] }
  const bgOf = (el) => {
    const layers = []
    for (let n = el; n; n = n.parentElement) { const c = parse(getComputedStyle(n).backgroundColor); if (c[3] > 0) { layers.push(c); if (c[3] >= 1) break } }
    let base = parse(getComputedStyle(document.body).backgroundColor)
    if (base[3] < 1) base = [255, 255, 255, 1]
    for (let i = layers.length - 1; i >= 0; i--) base = over(layers[i], base)
    return base
  }
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]) }
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return +((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)).toFixed(2) }
  const tok = (n, el = document.body) => { const i = document.createElement('i'); i.style.color = `var(${n})`; el.append(i); const c = parse(getComputedStyle(i).color); i.remove(); return c }
  const fg = (el) => { const b = bgOf(el); return ratio(over(parse(getComputedStyle(el).color), b), b) }
  const firstChar = (el) => {
    const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (n.data.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP) })
    const n = w.nextNode(); if (!n) return null
    const i = n.data.search(/\S/); const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + 1)
    return r.getBoundingClientRect()
  }
  const same = (a, b) => a.every((v, i) => Math.abs(v - b[i]) <= (i === 3 ? 0.01 : 1.5))
  return { parse, over, bgOf, ratio, tok, fg, firstChar, same }
}

// Marcado real frente al que espera el CSS (accordion.md «Estructura accesible» y «Clases y datos»)
const markup = () => {
  const bad = []
  const ALLOWED = ['g-accordion-item', 'is-open', 'is-animating', 'is-instant', 'is-ready', 'is-disabled', 'is-standalone', 'has-peek', 'has-actions']
  const EXCL = ['excl', 'chain'], STICKY = ['pegado', 'h-page', 'h-card-acc', 'h-sunken-acc', 'h-inset-acc', 'h-flat-acc', 'h-tabs-acc', 'h-dialog-acc', 'h-dinset-acc']
  for (const g of document.querySelectorAll('.g-accordion')) {
    const want = ['g-accordion', ...(EXCL.includes(g.id) ? ['g-accordion--exclusive'] : []), ...(STICKY.includes(g.id) ? ['g-accordion--sticky'] : [])]
    if ([...g.classList].sort().join() !== want.sort().join()) bad.push(`${g.id}: clases del grupo ${g.className}`)
    if (g.hasAttribute('role')) bad.push(`${g.id}: el grupo tiene role`)
    for (let k = 0; k < g.style.length; k++) if (g.style[k] !== '--_scroll-pad') bad.push(`${g.id}: estilo ${g.style[k]}`)
  }
  for (const it of document.querySelectorAll('.g-accordion-item')) {
    const id = it.id
    const b = (m) => bad.push(`${id}: ${m}`)
    const cls = [...it.classList]
    if (!cls.every((c) => ALLOWED.includes(c))) b('clase fuera del contrato ' + cls)
    if (!it.classList.contains('is-ready') || it.classList.contains('is-animating') || it.classList.contains('is-instant')) b('en reposo sin is-ready o con is-animating/is-instant')
    const open = it.classList.contains('is-open')
    const nearG = it.parentElement.closest('.g-accordion'), nearI = it.parentElement.closest('.g-accordion-item')
    const isStd = !nearG || (nearI && nearG.contains(nearI))
    if (it.classList.contains('is-standalone') !== Boolean(isStd)) b('is-standalone mal')
    const kids = [...it.children]
    const [hd, ...rest] = kids
    if (!hd || !/^H[2-6]$/.test(hd.tagName) || !hd.classList.contains('g-accordion-item__heading')) { b('no empieza por hN.__heading'); continue }
    if (hd.tagName !== 'H3') b('nivel ' + hd.tagName)
    const order = rest.map((k) => k.className.replace('g-accordion-item__', ''))
    const expect = [...(it.classList.contains('has-actions') ? ['actions'] : []), ...(it.classList.contains('has-peek') ? ['peek'] : []), 'panel']
    if (order.join() !== expect.join()) b(`hijos ${order} ≠ ${expect}`)
    const btn = hd.children[0]
    if (hd.children.length !== 1 || btn.tagName !== 'BUTTON' || btn.type !== 'button' || !btn.classList.contains('g-accordion-item__toggle')) { b('hN sin un solo button.__toggle'); continue }
    if (btn.id !== id + '-toggle' || btn.getAttribute('aria-controls') !== id + '-content') b('id o aria-controls')
    if (btn.getAttribute('aria-expanded') !== String(open)) b('aria-expanded')
    if ((btn.getAttribute('aria-disabled') === 'true') !== it.classList.contains('is-disabled') || btn.disabled) b('aria-disabled')
    const desc = btn.getAttribute('aria-describedby')
    if (it.classList.contains('has-peek') && !open ? desc !== id + '-peek' : desc !== null) b('aria-describedby ' + desc)
    const bk = [...btn.children].map((k) => k.className.replace('g-accordion-item__', ''))
    if (!(bk.join() === 'title,chevron' || bk.join() === 'title,meta,chevron')) b('botón ' + bk)
    for (const s of btn.querySelectorAll('.g-accordion-item__title, .g-accordion-item__meta')) if (s.getAttribute('dir') !== 'auto') b('dir de título/meta')
    const ch = btn.querySelector('.g-accordion-item__chevron')
    if (ch.getAttribute('aria-hidden') !== 'true' || !ch.querySelector(':scope > svg.g-icon')) b('chevron sin aria-hidden o sin > svg.g-icon')
    const peek = it.querySelector(':scope > .g-accordion-item__peek')
    if (peek && (peek.id !== id + '-peek' || peek.getAttribute('dir') !== 'auto' || peek.hasAttribute('tabindex') || peek.hasAttribute('role'))) b('avance: id, dir, sin rol ni tabindex')
    const panel = it.querySelector(':scope > .g-accordion-item__panel')
    if (panel.hasAttribute('inert')) b('inert en reposo')
    const ct = panel.children[0]
    if (panel.children.length !== 1 || !ct.classList.contains('g-accordion-item__content') || ct.id !== id + '-content') { b('panel sin un __content'); continue }
    if (ct.children.length !== 1 || !ct.children[0].classList.contains('g-accordion-item__body')) b('__content sin un __body')
    if (open ? ct.hasAttribute('hidden') : ct.getAttribute('hidden') !== 'until-found') b('hidden ' + ct.getAttribute('hidden'))
    const group = isStd ? null : nearG
    const n = group ? [...group.querySelectorAll('.g-accordion-item')].filter((x) => x.parentElement.closest('.g-accordion') === group && !(x.parentElement.closest('.g-accordion-item') && group.contains(x.parentElement.closest('.g-accordion-item')))).length : 1
    const region = !group || group.classList.contains('g-accordion--exclusive') || n <= 6
    if ((ct.getAttribute('role') === 'region') !== region || (region && ct.getAttribute('aria-labelledby') !== id + '-toggle')) b(`region ${ct.getAttribute('role')} con ${n}`)
    for (let k = 0; k < it.style.length; k++) if (it.style[k] !== '--_head-size') b('estilo ' + it.style[k])
    const sticky = group && group.classList.contains('g-accordion--sticky')
    if ((it.style.getPropertyValue('--_head-size') !== '') !== Boolean(open && sticky)) b('--_head-size fuera de abierto+sticky')
  }
  return bad
}

async function open(browser, qs = '', opts = {}) {
  const ctx = await browser.newContext({ viewport: opts.viewport || { width: 1200, height: 900 }, reducedMotion: opts.reducedMotion || 'no-preference', forcedColors: opts.forcedColors || 'none', hasTouch: false })
  const page = await ctx.newPage()
  page.__errors = []
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') page.__errors.push(m.text()) })
  page.on('pageerror', (e) => page.__errors.push(e.message))
  await page.goto(BASE + (qs ? '?' + qs.replace(/^\?/, '') : '') + (opts.hash || ''), { waitUntil: opts.waitUntil || 'load' })
  await page.waitForFunction(() => window.__ready === true)
  await page.evaluate(() => document.fonts.ready)
  await page.addScriptTag({ content: `window.__lib = (${lib})()` })
  await page.waitForTimeout(80)
  return page
}
const rec = (page, setup, sampler, ms) => page.evaluate(([setup, sampler, ms]) => new Promise((res) => {
  const fn = new Function('return (' + sampler + ')')()
  const out = [{ t: -1, ...fn() }]
  new Function(setup)()
  const t0 = performance.now()
  const step = () => { out.push({ t: performance.now() - t0, ...fn() }); if (performance.now() - t0 < ms) requestAnimationFrame(step); else res(out) }
  requestAnimationFrame(step)
}), [setup, sampler.toString(), ms])

const themes = args.themes === 'base' ? ['', 'theme=auditoria'] : ['', 'theme=auditoria', 'theme=propio', ...GEN.map((g) => 'theme=' + g)]

for (const engine of ENGINES) {
  const browser = await pw[engine].launch()
  const E = `[${engine}]`
  const T = (c, m) => ok(c, `${E} ${m}`, engine)
  const errors = []
  const done = async (page) => { errors.push(...page.__errors); await page.context().close() }

  /* ---------- M · Marcado real ---------- */
  if (run('m')) for (const qs of ['', 'theme=auditoria&dark=1']) {
    const page = await open(browser, qs)
    const bad = await page.evaluate(markup)
    T(!bad.length, `marcado ${qs || 'defecto'}: ${bad.slice(0, 6).join(' | ')}`)
    await done(page)
  }

  /* ---------- 1 · Contraste en 28 configuraciones ---------- */
  if (run(1)) {
    const minT = { title: 99, meta: 99, peek: 99, chev: 99, dis: 99, body: 99, focus: 99, hostTitle: 99 }
    const per = {}
    for (const th of themes) for (const dark of [false, true]) {
      const qs = [th, dark ? 'dark=1' : ''].filter(Boolean).join('&')
      const page = await open(browser, qs)
      const r = await page.evaluate(() => {
        const L = window.__lib
        const q = (s) => document.querySelector(s)
        const chev = q('#f-cambiar .g-accordion-item__chevron')
        const cb = L.bgOf(chev)
        const focus = L.tok('--g-color-focus', q('#f-cambiar'))
        return {
          title: L.fg(q('#f-cambiar .g-accordion-item__title')), meta: L.fg(q('#f-historial .g-accordion-item__meta')), peek: L.fg(q('#f-cambiar-peek')),
          chev: L.ratio(L.over(L.parse(getComputedStyle(chev).color), cb), cb), dis: L.fg(q('#f-historial .g-accordion-item__title')),
          body: L.fg(q('#f-resultados-content p')), focus: L.ratio(focus, L.bgOf(q('#f-cambiar-toggle'))),
          hostTitle: Math.min(...['#h-card-a', '#h-sunken-a', '#h-inset-a', '#h-flat-a', '#h-tabs-a'].map((s) => L.fg(q(s + ' .g-accordion-item__title')))),
          hosts: ['#h-page-a', '#h-card-a', '#h-sunken-a', '#h-inset-a', '#h-flat-a', '#h-tabs-a'].map((s) => {
            const h = q(s + ' > .g-accordion-item__heading'); const host = q(s).closest('.g-accordion').parentElement
            return { s, ok: L.same(L.parse(getComputedStyle(h).backgroundColor), L.bgOf(host)), hb: getComputedStyle(h).backgroundColor, b: L.bgOf(host).map(Math.round).join(',') }
          })
        }
      })
      const tag = `${th.replace('theme=', '') || 'defecto'}${dark ? ' oscuro' : ''}`
      T(r.title >= 4.5, `${tag} título ${r.title}`)
      T(r.meta >= 4.5, `${tag} meta ${r.meta}`)
      T(r.peek >= 4.5, `${tag} avance ${r.peek}`)
      T(r.chev >= 3, `${tag} chevron ${r.chev}`)
      T(r.dis >= 4.5, `${tag} título deshabilitado ${r.dis}`)
      T(r.body >= 4.5, `${tag} contenido ${r.body}`)
      T(r.focus >= 3, `${tag} anillo de foco ${r.focus}`)
      T(r.hostTitle >= 4.5, `${tag} título en anfitrionas ${r.hostTitle}`)
      for (const h of r.hosts) T(h.ok, `${tag} fondo pegado ${h.s}: ${h.hb} ≠ ${h.b}`)
      for (const k of Object.keys(minT)) minT[k] = Math.min(minT[k], r[k])
      if (['defecto', 'defecto oscuro', 'auditoria', 'auditoria oscuro', 'propio', 'propio oscuro'].includes(tag)) per[tag] = r
      if (args.verbose) console.log(E, tag, JSON.stringify(r))
      await done(page)
    }
    for (const [k, r] of Object.entries(per)) note(`${E} contraste ${k}: título ${r.title} · meta ${r.meta} · avance ${r.peek} · chevron ${r.chev} · deshabilitado ${r.dis} · contenido ${r.body} · foco ${r.focus} · anfitrionas ${r.hostTitle}`)
    note(`${E} contraste mínimo en ${themes.length * 2}: título ${minT.title} · meta ${minT.meta} · avance ${minT.peek} · chevron ${minT.chev} · deshabilitado ${minT.dis} · contenido ${minT.body} · foco ${minT.focus} · anfitrionas ${minT.hostTitle}`)
  }

  /* ---------- 2 · Geometría (defecto, auditoría y propio con space 3) ---------- */
  if (run(2)) for (const qs of ['', 'theme=auditoria', 'theme=propio']) {
    const page = await open(browser, qs)
    const g = await page.evaluate(() => {
      const L = window.__lib
      const q = (s) => document.querySelector(s)
      const toggles = [...document.querySelectorAll('.g-accordion-item__toggle')].filter((b) => b.getClientRects().length && !b.closest('.g-dialog'))
      const fs = [...document.querySelectorAll('.g-accordion-item__title, .g-accordion-item__meta, .g-accordion-item__peek, .g-accordion-item__body p')].map((e) => parseFloat(getComputedStyle(e).fontSize))
      const t = q('#f-cambiar-toggle'), tr = t.getBoundingClientRect(), cs = getComputedStyle(t)
      const title = q('#f-cambiar .g-accordion-item__title').getBoundingClientRect()
      const line = parseFloat(getComputedStyle(q('#f-cambiar .g-accordion-item__title')).lineHeight)
      const chev = q('#f-cambiar .g-accordion-item__chevron > .g-icon').getBoundingClientRect()
      const ltitle = q('#f-largo .g-accordion-item__title').getBoundingClientRect(), lchev = q('#f-largo .g-accordion-item__chevron > .g-icon').getBoundingClientRect()
      const htitle = q('#f-historial .g-accordion-item__title').getBoundingClientRect(), hmeta = q('#f-historial .g-accordion-item__meta')
      const mcs = getComputedStyle(hmeta), mr = hmeta.getBoundingClientRect()
      const act = q('#s-reset').getBoundingClientRect(), stitle = q('#s-notif .g-accordion-item__title').getBoundingClientRect()
      const peek = q('#f-cambiar-peek'), pcs = getComputedStyle(peek)
      const sep = (s) => getComputedStyle(q(s)).borderBlockEndWidth
      return {
        minH: Math.min(...toggles.map((b) => b.getBoundingClientRect().height)), minFs: Math.min(...fs),
        ringIn: parseFloat(cs.outlineOffset) === -parseFloat(cs.outlineWidth) || cs.outlineOffset === '0px', ow: getComputedStyle(t).getPropertyValue('--g-focus-width'),
        inset: title.left - tr.left, chevDy: Math.abs((chev.top + chev.bottom) / 2 - (title.top + line / 2)), chevEnd: tr.right - chev.right,
        longChevDy: Math.abs((lchev.top + lchev.bottom) / 2 - (ltitle.top + line / 2)), longLines: Math.round(ltitle.height / line),
        metaDy: Math.abs((mr.top + parseFloat(mcs.lineHeight) / 2) - (htitle.top + line / 2)),
        actDy: Math.abs((act.top + act.bottom) / 2 - (stitle.top + line / 2)), actOver: Math.max(0, (act.height - line) / 2),
        peekH: peek.getBoundingClientRect().height, peekLine: parseFloat(pcs.lineHeight), peekClip: peek.scrollHeight > peek.clientHeight + 1 || peek.scrollWidth > peek.clientWidth,
        peekColor: L.same(L.parse(pcs.color), L.tok('--g-color-text-muted')),
        sepGroup: sep('#f-cambiar'), sepStandalone: sep('#suelto'), sepNestedLast: sep('#i2'), sepNestedFirst: sep('#i1'),
        cursorPeek: pcs.cursor, cursorDis: getComputedStyle(q('#f-historial-toggle')).cursor, cursorDisPeek: getComputedStyle(q('#f-historial-peek')).cursor,
        oa: [getComputedStyle(q('#faq')).overflowAnchor, getComputedStyle(q('#suelto')).overflowAnchor],
        panelVis: [...document.querySelectorAll('.g-accordion-item__panel, .g-accordion-item__content')].every((e) => getComputedStyle(e).visibility === 'visible'),
        headMargin: [...document.querySelectorAll('.g-accordion-item__heading')].every((h) => getComputedStyle(h).marginTop === '0px' && getComputedStyle(h).marginBottom === '0px'),
        titleFont: getComputedStyle(q('#f-cambiar .g-accordion-item__title')).fontFamily, line
      }
    })
    const tag = qs.replace('theme=', '') || 'defecto'
    T(g.minH >= 44, `${tag} botón ≥ 44px: ${g.minH}`)
    T(g.minFs >= 12, `${tag} texto ≥ 12px: ${g.minFs}`)
    T(g.ringIn, `${tag} anillo hacia dentro`)
    T(g.inset >= parseFloat(g.ow) + 0.5, `${tag} el anillo no pisa la letra: sangría ${g.inset} vs ${g.ow}`)
    T(g.chevDy <= 1 && g.longChevDy <= 1 && g.longLines >= 2, `${tag} chevron centrado en la primera línea: ${g.chevDy} · título de ${g.longLines} líneas ${g.longChevDy}`)
    T(g.chevEnd <= parseFloat(g.ow) + 4 + 0.5, `${tag} chevron al final del botón: ${g.chevEnd}`)
    T(g.metaDy <= 1, `${tag} meta centrado en la primera línea: ${g.metaDy}`)
    // Un control más alto que la línea del título baja la mitad de lo que sobra (límite del CSS, hallazgo 4)
    T(g.actDy <= 1 || Math.abs(g.actDy - g.actOver) <= 0.5, `${tag} acciones centradas en la línea del título: ${g.actDy} (exceso del control ${g.actOver})`)
    if (g.actOver > 0) note(`${E} HALLAZGO 4 · ${tag}: el botón de las acciones mide ${(g.actOver * 2 + g.line).toFixed(1)}px sobre una línea de título de ${g.line}px y queda ${g.actDy.toFixed(2)}px por debajo del centro`)
    T(Math.abs(g.peekH - g.peekLine) <= 0.5 && g.peekClip && g.peekColor, `${tag} avance de una línea recortada en text-muted: ${g.peekH}/${g.peekLine}`)
    T(parseFloat(g.sepGroup) > 0 && g.sepStandalone === '0px' && g.sepNestedLast === '0px' && parseFloat(g.sepNestedFirst) > 0, `${tag} separadores: grupo ${g.sepGroup} · suelto ${g.sepStandalone} · anidado último ${g.sepNestedLast}`)
    T(g.cursorPeek === 'pointer' && g.cursorDis === 'not-allowed' && g.cursorDisPeek === 'default', `${tag} cursores ${g.cursorPeek}/${g.cursorDis}/${g.cursorDisPeek}`)
    T(g.oa.every((v) => v === 'none'), `${tag} overflow-anchor ${g.oa}`)
    T(g.panelVis && g.headMargin, `${tag} sin visibility: hidden en panel/contenido; encabezados sin margen`)
    note(`${E} ${tag}: botón mínimo ${g.minH}px · sangría ${g.inset}px · chevron Δ ${g.chevDy.toFixed(2)} (2 líneas ${g.longChevDy.toFixed(2)}) · meta Δ ${g.metaDy.toFixed(2)} · acciones Δ ${g.actDy.toFixed(2)} · texto mínimo ${g.minFs}px`)
    await done(page)
  }

  /* ---------- 3 · 320px, RTL ---------- */
  if (run(3)) for (const qs of ['', 'theme=auditoria']) {
    const page = await open(browser, qs, { viewport: { width: 320, height: 800 } })
    const tag = qs.replace('theme=', '') || 'defecto'
    const r = await page.evaluate(() => {
      const q = (s) => document.querySelector(s)
      const w = q('#w320')
      const txt = (el) => [...el.childNodes].find((n) => n.nodeType === 3 && n.data.trim())
      const meta = txt(q('#n1 .g-accordion-item__meta'))
      const words = meta.data.split(' ').map((wd) => { const i = meta.data.indexOf(wd); const rg = document.createRange(); rg.setStart(meta, i); rg.setEnd(meta, i + wd.length); return new Set([...rg.getClientRects()].map((x) => Math.round(x.top))).size })
      return { doc: document.documentElement.scrollWidth - document.documentElement.clientWidth, box: [...document.querySelectorAll('.g-accordion-item')].filter((e) => !e.closest('.g-dialog')).every((e) => e.scrollWidth <= e.clientWidth + 1), metaWords: Math.max(...words), act: q('#n2 .g-accordion-item__actions').getBoundingClientRect().width / q('#n2').getBoundingClientRect().width, minH: Math.min(...[...w.querySelectorAll('.g-accordion-item__toggle')].map((b) => b.getBoundingClientRect().height)) }
    })
    T(r.doc <= 0 && r.box, `${tag} 320px sin desplazamiento horizontal (${r.doc})`)
    T(r.metaWords === 1, `${tag} 320px: el meta no parte palabras (${r.metaWords})`)
    T(r.act <= 0.36, `${tag} 320px: acciones ≤ un tercio (${r.act.toFixed(2)})`)
    T(r.minH >= 44, `${tag} 320px: botón ≥ 44 (${r.minH})`)
    const rtl = await page.evaluate(() => {
      const q = (s) => document.querySelector(s)
      const c1 = getComputedStyle(q('#r1 .g-accordion-item__chevron > .g-icon')), c2 = getComputedStyle(q('#r2 .g-accordion-item__chevron > .g-icon'))
      const t = q('#r1 .g-accordion-item__title').getBoundingClientRect(), ch = q('#r1 .g-accordion-item__chevron').getBoundingClientRect()
      const pk = q('#r1-peek').getBoundingClientRect(), tg = q('#r1-toggle').getBoundingClientRect(), tt = q('#r1 .g-accordion-item__title')
      return { s1: c1.scale, r2: c2.rotate, s2: c2.scale, chevLeft: ch.right <= t.left, peekRight: Math.abs(tg.right - pk.right) <= 1, titleRight: Math.abs(tg.right - t.right) <= 6, dir: tt.getAttribute('dir'), cdir: getComputedStyle(tt).direction }
    })
    T(rtl.s1 === '-1 1' && rtl.s2 === '-1 1' && rtl.r2 === '-90deg' && rtl.chevLeft && rtl.peekRight && rtl.titleRight && rtl.dir === 'auto' && rtl.cdir === 'rtl', `${tag} RTL: chevron espejado (${rtl.s1}), abierto ${rtl.r2}, al final lógico ${rtl.chevLeft}, título y avance al inicio ${rtl.titleRight}/${rtl.peekRight}`)
    // RTL con el teclado: ↓ va al siguiente (eje de bloque, no cambia en RTL)
    await page.focus('#r1-toggle'); await page.keyboard.press('ArrowDown')
    T(await page.evaluate(() => document.activeElement.id === 'r2-toggle'), `${tag} RTL: ↓ al encabezado siguiente`)
    await done(page)
  }

  /* ---------- 4 · Movimiento: nada al montar, A2, Δ0 (exclusive, cadena, cancelación), puntero ---------- */
  if (run(4)) {
    const page = await open(browser)
    const mount = await page.evaluate(() => document.getAnimations().filter((a) => a.effect && a.effect.target && a.effect.target.closest && a.effect.target.closest('.g-accordion-item') && !a.effect.target.closest('.g-accordion-item__body, .g-accordion-item__actions')).length)
    T(mount === 0, `nada animado al montar (${mount})`)
    const tr = await page.evaluate(() => {
      const q = (s) => document.querySelector(s)
      const p = getComputedStyle(q('#f-cambiar > .g-accordion-item__panel')), i = getComputedStyle(q('#f-cambiar .g-accordion-item__chevron > .g-icon'))
      return { p: p.transitionProperty + ' ' + p.transitionDuration + ' ' + p.transitionTimingFunction, i: i.transitionProperty + ' ' + i.transitionDuration }
    })
    T(/grid-template-rows/.test(tr.p) && /0\.24s/.test(tr.p) && /rotate/.test(tr.i) && /0\.12s/.test(tr.i), `rejilla en slow y giro en fast: ${tr.p} · ${tr.i}`)
    const sampler = (id) => `() => {
      const L = window.__lib, q = (s) => document.querySelector(s)
      const pk = q('#${id}-peek'), ct = q('#${id}-content'), p1 = ct.querySelector('p')
      const a = L.firstChar(pk), b = ct.hasAttribute('hidden') ? null : L.firstChar(p1)
      const cr = ct.getBoundingClientRect(), op = +getComputedStyle(pk).opacity
      const vis = getComputedStyle(pk).visibility === 'visible'
      const frac = b && b.height ? Math.max(0, Math.min(1, (Math.min(b.bottom, cr.bottom) - b.top) / b.height)) : 0
      return { dt: a && b ? Math.abs(a.top - b.top) : null, dl: a && b ? Math.abs(a.left - b.left) : null, op: vis ? op : 0, frac, h: cr.height, y: q('#${id} > .g-accordion-item__heading').getBoundingClientRect().top, anim: q('#${id}').classList.contains('is-animating'), inert: q('#${id} > .g-accordion-item__panel').hasAttribute('inert') }
    }`
    let worst = { open: 0, close: 0, pres: 1, hy: 0 }
    for (const id of ['f-cambiar', 'f-urgencias']) {
      await page.waitForTimeout(500)
      await page.evaluate((id) => { document.getElementById(id).scrollIntoView({ block: 'center' }) }, id)
      await page.waitForTimeout(60)
      const o = await rec(page, `document.getElementById('${id}-toggle').click()`, sampler(id), 420)
      await page.waitForTimeout(150)
      const c = await rec(page, `document.getElementById('${id}-toggle').click()`, sampler(id), 420)
      const dO = Math.max(...o.filter((f) => f.dt != null).map((f) => Math.max(f.dt, f.dl)))
      const dC = Math.max(...c.filter((f) => f.dt != null).map((f) => Math.max(f.dt, f.dl)))
      const half = o.find((f) => f.t >= 0 && f.op <= 0.5)
      const whole = !half || half.frac >= 0.999
      const presO = Math.min(...o.filter((f) => f.t >= 0).map((f) => Math.max(f.op, f.frac)))
      const presC = Math.min(...c.filter((f) => f.t >= 0).map((f) => Math.max(f.op, f.frac)))
      const hy = Math.max(...[...o, ...c].map((f) => Math.abs(f.y - o[0].y)))
      worst = { open: Math.max(worst.open, dO), close: Math.max(worst.close, dC), pres: Math.min(worst.pres, presO, presC), hy: Math.max(worst.hy, hy) }
      T(dO <= 1 && dC <= 1, `A2 ${id}: línea del avance y primera del contenido Δ ≤ 1px (abrir ${dO.toFixed(2)}, plegar ${dC.toFixed(2)})`)
      T(whole, `A2 ${id}: primera línea entera antes de la mitad del fundido (t ${half && half.t.toFixed(0)}ms)`)
      T(presO >= 0.9 && presC >= 0.6, `A2 ${id}: la línea nunca desaparece (abrir ${presO.toFixed(2)}, plegar ${presC.toFixed(2)})`)
      T(hy <= 1, `Δ0 ${id}: el encabezado tocado no se mueve al abrir ni al plegar (${hy.toFixed(2)})`)
      T(o.some((f) => f.anim) && c.some((f) => f.anim && f.inert) && !o.some((f) => f.inert), `${id}: is-animating al abrir y plegar; inert solo al plegar`)
      T(c[c.length - 1].h === 0 && !c[c.length - 1].anim && !c[c.length - 1].inert && (await page.getAttribute(`#${id}-content`, 'hidden')) === 'until-found', `${id} asienta plegado until-found, sin inert`)
    }
    note(`${E} A2: Δ máx abrir ${worst.open.toFixed(2)}px · plegar ${worst.close.toFixed(2)}px · presencia mínima ${worst.pres.toFixed(2)} · encabezado tocado ${worst.hy.toFixed(2)}px`)
    // Color del contenido: muted → text durante la altura
    await page.evaluate(() => document.getElementById('f-documentos').scrollIntoView({ block: 'center' }))
    const col = await rec(page, `document.getElementById('f-documentos-toggle').click()`, `() => { const L = window.__lib; const c = L.parse(getComputedStyle(document.querySelector('#f-documentos-content')).color); return { c: c.slice(0, 3).map(Math.round).join(',') } }`, 320)
    const cols = [...new Set(col.filter((f) => f.t >= 0).map((f) => f.c))]
    const tm = await page.evaluate(() => [window.__lib.tok('--g-color-text-muted'), window.__lib.tok('--g-color-text')].map((c) => c.slice(0, 3).map(Math.round).join(',')))
    T(col[0].c === tm[0] && col[col.length - 1].c === tm[1] && cols.length >= 4, `el contenido se enciende: ${col[0].c} → ${col[col.length - 1].c} en ${cols.length} pasos`)
    await page.click('#f-documentos-toggle'); await page.waitForTimeout(900) // fuera de la ventana de Δ0 (un desplazamiento por programa dentro de ella se compensa)
    // Δ0 en exclusive (el de arriba se cierra)
    const sc0 = await page.evaluate(() => { const h = document.querySelector('#e3 > .g-accordion-item__heading'); const t = h.getBoundingClientRect().top + scrollY - 500; window.scrollTo(0, t); return [t, scrollY, document.documentElement.scrollHeight, getComputedStyle(document.documentElement).overflow, getComputedStyle(document.body).overflow, document.activeElement && document.activeElement.id] })
    await page.waitForTimeout(80)
    const d0 = await rec(page, `document.getElementById('e3-toggle').click()`, `() => ({ y: document.querySelector('#e3 > .g-accordion-item__heading').getBoundingClientRect().top, sy: scrollY, c: document.getElementById('e1').className })`, 450)
    const dmax = Math.max(...d0.map((f) => Math.abs(f.y - d0[0].y)))
    if (args.verbose || dmax > 1) console.log(E, 'Δ0 exclusive', JSON.stringify(sc0), JSON.stringify(d0.slice(0, 3)))
    T(dmax <= 1, `Δ0 en exclusive: el encabezado tocado se mueve ${dmax.toFixed(2)}px como máximo`)
    // De vuelta: abrir e1 (el de abajo se cierra; no hace falta compensar)
    await page.waitForTimeout(700)
    const d1 = await rec(page, `document.getElementById('e1-toggle').click()`, `() => ({ y: document.querySelector('#e1 > .g-accordion-item__heading').getBoundingClientRect().top })`, 450)
    const dmax1 = Math.max(...d1.map((f) => Math.abs(f.y - d1[0].y)))
    T(dmax1 <= 1, `Δ0 en exclusive hacia arriba: ${dmax1.toFixed(2)}px`)
    // Cancelación: la rueda durante el movimiento detiene la compensación
    await page.waitForTimeout(700)
    await page.evaluate(() => { const h = document.querySelector('#e3 > .g-accordion-item__heading'); window.scrollTo(0, h.getBoundingClientRect().top + scrollY - 500) })
    await page.waitForTimeout(100)
    const can = await page.evaluate(() => new Promise((res) => {
      const h = document.querySelector('#e3 > .g-accordion-item__heading'), y0 = h.getBoundingClientRect().top
      document.getElementById('e3-toggle').click()
      requestAnimationFrame(() => requestAnimationFrame(() => {
        window.dispatchEvent(new WheelEvent('wheel', { deltaY: 1, bubbles: true }))
        const yW = h.getBoundingClientRect().top
        setTimeout(() => res({ moved: Math.abs(h.getBoundingClientRect().top - yW), y0 }), 420)
      }))
    }))
    T(can.moved > 20, `Δ0 se cancela con la rueda: el encabezado se mueve ${can.moved.toFixed(0)}px después`)
    note(`${E} Δ0 exclusive ${dmax.toFixed(2)}px (hacia arriba ${dmax1.toFixed(2)}px); tras la rueda, ${can.moved.toFixed(0)}px sin compensar`)
    // Δ0 en cadena: el contenedor está arriba del todo (no puede subir); compensa el documento
    await page.waitForTimeout(700)
    await page.evaluate(() => { const b = document.getElementById('chain-box'); b.scrollTop = 0; window.scrollTo(0, b.getBoundingClientRect().top + scrollY - 300) })
    await page.waitForTimeout(100)
    const ch = await rec(page, `document.getElementById('c2-toggle').click()`, `() => ({ y: document.querySelector('#c2 > .g-accordion-item__heading').getBoundingClientRect().top, st: document.getElementById('chain-box').scrollTop, sy: scrollY, ov: document.getElementById('chain-box').scrollHeight > document.getElementById('chain-box').clientHeight })`, 450)
    const chMax = Math.max(...ch.map((f) => Math.abs(f.y - ch[0].y)))
    const docMoved = ch[0].sy - ch[ch.length - 1].sy
    T(ch[0].ov && chMax <= 1 && docMoved > 50 && ch[ch.length - 1].st === 0, `Δ0 en cadena: ${chMax.toFixed(2)}px; el contenedor sigue en ${ch[ch.length - 1].st}, el documento sube ${docMoved.toFixed(0)}px`)
    note(`${E} Δ0 en cadena ${chMax.toFixed(2)}px (documento −${docMoved.toFixed(0)}px)`)
    // Clic en el avance abre; con selección de texto, no
    await page.waitForTimeout(700)
    await page.evaluate(() => document.getElementById('f-pago').scrollIntoView({ block: 'center' }))
    await page.evaluate(() => { const p = document.getElementById('f-pago-peek'); const r = document.createRange(); r.selectNodeContents(p); getSelection().removeAllRanges(); getSelection().addRange(r); p.click() })
    const selOpen = await page.evaluate(() => document.getElementById('f-pago').classList.contains('is-open'))
    await page.evaluate(() => getSelection().removeAllRanges())
    await page.click('#f-pago-peek'); await page.waitForTimeout(350)
    const peekOpen = await page.evaluate(() => document.getElementById('f-pago').classList.contains('is-open'))
    T(!selOpen && peekOpen, `avance: abre al clic (${peekOpen}), no tras una selección (${selOpen})`)
    await page.click('#f-pago-toggle'); await page.waitForTimeout(350)
    // Puntero: el chevron se asoma; también desde el avance
    const hov = async (sel) => { await page.hover(sel); await page.waitForTimeout(220) }
    const chevState = (id) => page.evaluate((id) => { const c = document.querySelector(`#${id} .g-accordion-item__chevron`), L = window.__lib; return { tr: getComputedStyle(c).translate, col: L.same(L.parse(getComputedStyle(c).color), L.tok('--g-color-text')), sep: L.same(L.parse(getComputedStyle(document.getElementById(id)).borderBlockEndColor), L.tok('--g-color-border-strong')) } }, id)
    await hov('#f-pago-toggle'); const h1 = await chevState('f-pago')
    await page.mouse.move(5, 300); await page.waitForTimeout(220); const h0 = await chevState('f-pago')
    await hov('#f-pago-peek'); const h2 = await chevState('f-pago')
    await page.evaluate(() => document.getElementById('f-resultados').scrollIntoView({ block: 'center' }))
    await hov('#f-resultados-toggle'); const h3 = await chevState('f-resultados')
    await hov('#f-historial-toggle'); const h4 = await chevState('f-historial')
    const two = await page.evaluate(() => { const i = document.createElement('i'); i.style.inlineSize = 'calc(var(--g-space-1) * 0.5)'; i.style.position = 'absolute'; document.body.append(i); const v = i.getBoundingClientRect().width; i.remove(); return v })
    const still = (v) => v === 'none' || v === '0px' || v === '0px 0px'
    T(h1.tr === `0px ${two}px` && h1.col && h1.sep, `puntero en el botón cerrado: chevron ${h1.tr}, línea fuerte ${h1.sep}`)
    T(still(h0.tr) && !h0.sep, `sin puntero: chevron quieto (${h0.tr})`)
    T(h2.tr === `0px ${two}px` && h2.col && h2.sep, `puntero en el avance: chevron ${h2.tr}`)
    T(h3.tr === `0px -${two}px` && h3.col && !h3.sep, `puntero en el abierto: chevron ${h3.tr}`)
    T(still(h4.tr) && !h4.col && !h4.sep, `deshabilitado sin respuesta al puntero (${h4.tr})`)
    // Deshabilitado: clic, Intro y avance no abren
    await page.click('#f-historial-toggle', { force: true }); await page.focus('#f-historial-toggle'); await page.keyboard.press('Enter'); await page.click('#f-historial-peek', { force: true }); await page.waitForTimeout(100)
    T(!(await page.evaluate(() => document.getElementById('f-historial').classList.contains('is-open'))), 'deshabilitado: no abre por clic, Intro ni avance')
    await done(page)
  }

  /* ---------- 5 · Movimiento reducido ---------- */
  if (run(5)) {
    const page = await open(browser, '', { reducedMotion: 'reduce' })
    const sampler = `() => { const q = (s) => document.querySelector(s); const p = q('#f-documentos > .g-accordion-item__panel'); const cs = getComputedStyle(p); return { h: p.getBoundingClientRect().height, op: +cs.opacity, anim: q('#f-documentos').classList.contains('is-animating'), tp: cs.transitionProperty, y: q('#f-documentos > .g-accordion-item__heading').getBoundingClientRect().top } }`
    await page.evaluate(() => document.getElementById('f-documentos').scrollIntoView({ block: 'center' }))
    const o = await rec(page, `document.getElementById('f-documentos-toggle').click()`, sampler, 360)
    await page.waitForTimeout(500)
    const c = await rec(page, `document.getElementById('f-documentos-toggle').click()`, sampler, 400)
    const full = o[o.length - 1].h
    T(!/grid-template-rows/.test(o[1].tp) && /opacity/.test(o[1].tp), `reduce: sin rejilla en la transición (${o[1].tp})`)
    T(o[1].h === full && o.filter((f) => f.t >= 0 && f.op > 0.05 && f.op < 0.95).length >= 2, `reduce, abrir: alto final en el primer cuadro y fundido (${o[1].h}/${full})`)
    const during = c.filter((f) => f.t >= 0 && f.anim)
    T(during.length >= 2 && during.every((f) => f.h === full) && during.some((f) => f.op > 0.05 && f.op < 0.95), `reduce, plegar: conserva el alto mientras se funde (${during.length} cuadros)`)
    T(c[c.length - 1].h === 0 && (await page.getAttribute('#f-documentos-content', 'hidden')) === 'until-found', `reduce: asienta plegado until-found`)
    T(Math.max(...[...o, ...c].map((f) => Math.abs(f.y - o[0].y))) <= 1, 'reduce: el encabezado no se mueve')
    const st = await page.evaluate(() => getComputedStyle(document.querySelector('#f-cambiar .g-accordion-item__chevron > .g-icon')).transitionDuration)
    T(/^0s$/.test(st), `reduce: el chevron gira sin transición (${st})`)
    await page.waitForTimeout(700)
    await page.evaluate(() => document.getElementById('f-pago').scrollIntoView({ block: 'center' }))
    await page.hover('#f-pago-toggle'); await page.waitForTimeout(200)
    const trn = await page.evaluate(() => getComputedStyle(document.querySelector('#f-pago .g-accordion-item__chevron')).translate)
    T(trn === 'none' || trn === '0px' || trn === '0px 0px', `reduce: el chevron no se inclina (${trn})`)
    // Δ0 en exclusive también con movimiento reducido
    await page.waitForTimeout(500)
    await page.evaluate(() => { const h = document.querySelector('#e3 > .g-accordion-item__heading'); window.scrollTo(0, h.getBoundingClientRect().top + scrollY - 500) })
    await page.waitForTimeout(80)
    const d0 = await rec(page, `document.getElementById('e3-toggle').click()`, `() => ({ y: document.querySelector('#e3 > .g-accordion-item__heading').getBoundingClientRect().top })`, 400)
    const dm = Math.max(...d0.map((f) => Math.abs(f.y - d0[0].y)))
    T(dm <= 1, `reduce: Δ0 en exclusive ${dm.toFixed(2)}px`)
    // GFormSection plegable con movimiento reducido: abre y asienta
    await page.evaluate(() => document.getElementById('fs').scrollIntoView({ block: 'center' }))
    await page.click('#fs .g-form-section__toggle'); await page.waitForTimeout(400)
    T(await page.evaluate(() => { const s = document.getElementById('fs'); return s.classList.contains('is-open') && !s.classList.contains('is-animating') }), 'reduce: GFormSection abre y asienta')
    await done(page)
  }

  /* ---------- 6 · Búsqueda, anclas, lazy, impresión ---------- */
  if (run(6)) {
    // #:~:text= abre lo plegado
    {
      const page = await open(browser, '', { hash: '#:~:text=' + encodeURIComponent('acta de nacimiento') })
      await page.waitForTimeout(300)
      const st = await page.evaluate(() => ({ open: document.getElementById('f-documentos').classList.contains('is-open'), hidden: document.getElementById('f-documentos-content').getAttribute('hidden'), top: document.getElementById('f-documentos-deep').getBoundingClientRect().top, vh: innerHeight }))
      T(st.open && st.hidden === null && st.top >= 0 && st.top < st.vh, `#:~:text= abre lo plegado y queda a la vista (${JSON.stringify(st)})`)
      await done(page)
    }
    // #id del elemento al cargar: abre sin animar, foco no se mueve. Receta (#515): con scroll-padding 48 de la aplicación (?pad=1)
    // el encabezado queda a 48 (la cabecera una sola vez); sin él, a 0 (es la cabecera de la aplicación)
    for (const [qs, want] of [['', 0], ['pad=1', 48], ['theme=auditoria', 0], ['theme=auditoria&pad=1', 48]]) {
      const page = await open(browser, qs, { hash: '#f-pago' })
      await page.waitForTimeout(300)
      const st = await page.evaluate(() => ({ open: document.getElementById('f-pago').classList.contains('is-open'), top: document.getElementById('f-pago-toggle').getBoundingClientRect().top, focus: document.activeElement === document.body }))
      T(st.open && Math.abs(st.top - want) <= 1 && st.focus, `${qs || 'defecto'} #f-pago al cargar: abierto ${st.open}, botón a ${st.top.toFixed(1)}px (${want}), foco sin mover ${st.focus}`)
      // hashchange
      await page.evaluate(() => { location.hash = '#f-cancelar' })
      await page.waitForTimeout(300)
      const hc = await page.evaluate(() => ({ open: document.getElementById('f-cancelar').classList.contains('is-open'), top: document.getElementById('f-cancelar-toggle').getBoundingClientRect().top, keep: document.getElementById('f-pago').classList.contains('is-open') }))
      T(hc.open && Math.abs(hc.top - want) <= 1 && hc.keep, `${qs || 'defecto'} hashchange #f-cancelar: abierto, a ${hc.top.toFixed(1)}px; el anterior sigue abierto`)
      await done(page)
    }
    // #id reaplicado en load: una imagen sin tamaño arriba llega 700 ms después de montar y empuja 200px
    for (const [qs, want] of [['late=700', 0], ['late=700&pad=1', 48]]) {
      const page = await open(browser, qs, { hash: '#f-pago' })
      await page.waitForTimeout(300)
      const st = await page.evaluate(() => ({ img: document.getElementById('late-img').getBoundingClientRect().height, top: document.getElementById('f-pago-toggle').getBoundingClientRect().top, open: document.getElementById('f-pago').classList.contains('is-open') }))
      T(st.img >= 199 && st.open && Math.abs(st.top - want) <= 1, `#id reaplicado en load (${qs}): imagen de ${st.img}px llegó tarde, botón a ${st.top.toFixed(1)}px (${want})`)
      note(`${E} #id con una imagen que llega tarde (200px), ${qs}: botón a ${st.top.toFixed(1)}px`)
      await done(page)
    }
    // Ancla de dentro de un plegado (beforematch): abre; sin receta queda bajo la cabecera de la aplicación, con ella a 48
    for (const qs of ['', 'pad=1']) {
      const page = await open(browser, qs, { hash: '#f-documentos-deep' })
      await page.waitForTimeout(300)
      const st = await page.evaluate(() => ({ open: document.getElementById('f-documentos').classList.contains('is-open'), top: document.getElementById('f-documentos-deep').getBoundingClientRect().top }))
      T(st.open && st.top >= -1 && (!qs || st.top >= 47) && st.top <= (qs ? 49 : 1), `${qs || 'sin receta'} #f-documentos-deep: abre (${st.open}), párrafo a ${st.top.toFixed(1)}px`)
      note(`${E} ancla de dentro (grupo sin sticky) ${qs || 'sin scroll-padding'}: párrafo a ${st.top.toFixed(1)}px`)
      await done(page)
    }
    // lazy: sin montar hasta abrir; no se desmonta al cerrar
    {
      const page = await open(browser)
      const a = await page.evaluate(() => !!document.getElementById('lz-body'))
      await page.evaluate(() => document.getElementById('lz').scrollIntoView({ block: 'center' }))
      await page.click('#lz-toggle'); await page.waitForTimeout(350)
      const b = await page.evaluate(() => !!document.getElementById('lz-body'))
      await page.click('#lz-toggle'); await page.waitForTimeout(350)
      const c = await page.evaluate(() => ({ there: !!document.getElementById('lz-body'), hidden: document.getElementById('lz-content').getAttribute('hidden') }))
      T(!a && b && c.there && c.hidden === 'until-found', `lazy: ${a} → ${b} → ${c.there} (${c.hidden})`)
      await done(page)
    }
    // Impresión: todo abierto, sin pegar, en text
    {
      const page = await open(browser)
      await page.emulateMedia({ media: 'print' })
      await page.waitForTimeout(400)
      const pr = await page.evaluate(() => {
        const items = [...document.querySelectorAll('.g-accordion-item')].filter((i) => !i.closest('.g-dialog') && i.id !== 'lz')
        return {
          zero: items.filter((i) => i.querySelector(':scope > .g-accordion-item__panel > .g-accordion-item__content').getBoundingClientRect().height < 1).map((i) => i.id),
          hide: [...document.querySelectorAll('.g-accordion-item__peek, .g-accordion-item__chevron, .g-accordion-item__actions')].every((e) => getComputedStyle(e).display === 'none'),
          stat: [...document.querySelectorAll('.g-accordion--sticky .g-accordion-item__heading')].every((e) => getComputedStyle(e).position === 'static'),
          color: (() => { const L = window.__lib; return L.same(L.parse(getComputedStyle(document.getElementById('f-cambiar-content')).color), L.tok('--g-color-text')) })(),
          brk: getComputedStyle(document.querySelector('#f-cambiar > .g-accordion-item__heading')).breakAfter,
          state: document.getElementById('f-cambiar').classList.contains('is-open')
        }
      })
      T(pr.zero.length === 0 && pr.hide && pr.stat && pr.color && pr.brk === 'avoid' && !pr.state, `impresión: todo abierto (${pr.zero}), sin avance/chevron/acciones ${pr.hide}, sin pegar ${pr.stat}, text ${pr.color}, break-after ${pr.brk}, estado intacto`)
      await done(page)
    }
  }

  /* ---------- 7 · sticky (defecto y auditoría) ---------- */
  // Con la receta (#515): scroll-padding-block-start 48 en el documento, la misma medida que --g-accordion-sticky-top
  if (run(7)) for (const qs of ['pad=1', 'theme=auditoria&pad=1']) {
    const page = await open(browser, qs)
    const tag = (qs.replace('&pad=1', '').replace('theme=', '').replace('pad=1', '') || 'defecto') + '+receta'
    await page.evaluate(() => document.getElementById('p2-name').scrollIntoView({ block: 'center' }))
    await page.waitForTimeout(250)
    const s = await page.evaluate(() => {
      const L = window.__lib, q = (s) => document.querySelector(s)
      const h = q('#p2 > .g-accordion-item__heading'), a = q('#p2 > .g-accordion-item__actions'), hr = h.getBoundingClientRect(), ar = a.getBoundingClientRect()
      const inp = q('#p2-name input') || q('#p2-name')
      const after = getComputedStyle(h, '::after')
      return {
        top: hr.top, atop: ar.top, abottom: ar.bottom, hbottom: hr.bottom, bg: L.same(L.parse(getComputedStyle(h).backgroundColor), L.bgOf(document.body)), abg: L.same(L.parse(getComputedStyle(a).backgroundColor), L.bgOf(document.body)),
        smBtn: getComputedStyle(q('#p2-toggle')).scrollMarginBlockStart, smIn: parseFloat(getComputedStyle(inp).scrollMarginBlockStart), head: hr.height,
        headVar: parseFloat(q('#p2').style.getPropertyValue('--_head-size')), lift: +after.opacity, support: CSS.supports('container-type: scroll-state'),
        smFaq: getComputedStyle(q('#f-cambiar-toggle')).scrollMarginBlockStart, pad: q('#pegado').style.getPropertyValue('--_scroll-pad')
      }
    })
    T(Math.abs(s.top - 48) <= 1 && Math.abs(s.atop - 48) <= 1 && Math.abs(s.abottom - s.hbottom) <= 1, `${tag} sticky: encabezado y acciones pegados a 48px (${s.top}, ${s.atop}) con el mismo alto`)
    T(s.bg && s.abg, `${tag} sticky: fondo opaco de la página en encabezado y acciones`)
    T(s.smBtn === '0px' && s.smFaq === '0px', `${tag} sin scroll-margin en el botón (${s.smBtn}, sin sticky ${s.smFaq}; #515)`)
    T(Math.abs(s.smIn - s.head) <= 1 && Math.abs(s.headVar - s.head) <= 0.5, `${tag} scroll-margin del contenido = solo el encabezado (${s.smIn} vs ${s.head}; --_head-size ${s.headVar})`)
    T(s.pad === '', `${tag} --_scroll-pad sin escribir con el documento (${s.pad})`)
    if (s.support) T(s.lift === 1, `${tag} se despega: línea y sombra con el encabezado pegado (${s.lift})`)
    else note(`${E} ${tag} sin container-type: scroll-state (la línea que se despega no aparece; fondo opaco)`)
    // Mayús+Tab dentro de un abierto: (a) control bajo la cabecera de la aplicación, (b) control que asoma bajo el pegado (WebKit)
    for (const [k, off] of [['bajo la cabecera', 20], ['asomando bajo el pegado', null]]) {
      await page.focus('#p2-phone')
      await page.evaluate((off) => {
        const i = document.querySelector('#p2-name input') || document.querySelector('#p2-name')
        const hb = document.querySelector('#p2 > .g-accordion-item__heading').getBoundingClientRect().bottom
        const target = off == null ? hb - 12 : off
        window.scrollBy(0, i.getBoundingClientRect().top - target)
      }, off)
      await page.waitForTimeout(120)
      const before = await page.evaluate(() => { const i = document.querySelector('#p2-name input') || document.querySelector('#p2-name'); const h = document.querySelector('#p2 > .g-accordion-item__heading').getBoundingClientRect(); const r = i.getBoundingClientRect(); return { top: r.top, bottom: r.bottom, hb: h.bottom } })
      await page.keyboard.press('Shift+Tab')
      await page.waitForTimeout(300)
      const ft = await page.evaluate(() => { const a = document.activeElement; const h = document.querySelector('#p2 > .g-accordion-item__heading').getBoundingClientRect(); return { id: a.id || a.closest('[id]').id, top: a.getBoundingClientRect().top, hb: h.bottom } })
      T(ft.top >= ft.hb - 0.5, `${tag} Mayús+Tab ${k}: el control queda entero bajo el pegado (${ft.top.toFixed(1)} ≥ ${ft.hb.toFixed(1)}; antes ${before.top.toFixed(1)}–${before.bottom.toFixed(1)})`)
      if (!qs) note(`${E} Mayús+Tab ${k}: de ${before.top.toFixed(1)}px a ${ft.top.toFixed(1)}px (encabezado hasta ${ft.hb.toFixed(1)}px)`)
    }
    // Ancla de dentro de un sticky (#p2-deep): bajo el encabezado pegado
    await page.evaluate(() => { location.hash = '#p2-deep' })
    await page.waitForTimeout(300)
    const deep = await page.evaluate(() => ({ top: document.getElementById('p2-deep').getBoundingClientRect().top, hb: document.querySelector('#p2 > .g-accordion-item__heading').getBoundingClientRect().bottom }))
    T(deep.top >= deep.hb - 0.5 && deep.top <= deep.hb + 1.5, `${tag} #p2-deep: justo bajo el encabezado pegado (${deep.top.toFixed(1)} / ${deep.hb.toFixed(1)})`)
    await page.evaluate(() => { history.replaceState(null, '', location.pathname + location.search) })
    // Cerrar desde el pegado: instantáneo, el encabezado no se mueve
    await page.evaluate(() => document.getElementById('p2-name').scrollIntoView({ block: 'center' }))
    await page.waitForTimeout(150)
    const cl = await rec(page, `document.getElementById('p2-toggle').click()`, `() => ({ y: document.querySelector('#p2 > .g-accordion-item__heading').getBoundingClientRect().top, inst: document.getElementById('p2').classList.contains('is-instant'), anim: document.getElementById('p2').classList.contains('is-animating') })`, 200)
    const dy = Math.max(...cl.map((f) => Math.abs(f.y - cl[0].y)))
    T(dy <= 1 && cl.some((f) => f.inst) && !cl.some((f) => f.anim), `${tag} cerrar desde el pegado: instantáneo y Δ ${dy.toFixed(2)}px`)
    await page.waitForTimeout(100)
    T(await page.evaluate(() => document.getElementById('p2-content').getAttribute('hidden') === 'until-found'), `${tag} cerrado desde el pegado asienta until-found`)
    // GDialog: pegado al borde del cuerpo, fondo del diálogo; Mayús+Tab dentro
    for (const [btn, id] of [['#open-dialog', 'h-dialog-a'], ['#open-dialog-inset', 'h-dinset-a']]) {
      // El diálogo anterior se cierra con animación: si el clic llega antes (WebKit), no abre; se reintenta una vez
      for (let k = 0; k < 2; k++) { await page.click(btn); if (await page.waitForSelector('#' + id, { state: 'visible', timeout: 3000 }).then(() => true, () => false)) break; await page.keyboard.press('Escape'); await page.waitForTimeout(500) }
      await page.waitForTimeout(400)
      if (!(await page.$('#' + id))) { T(false, `${tag} ${id}: el GDialog no se abrió`); await page.keyboard.press('Escape'); continue }
      const d = await page.evaluate((id) => {
        const L = window.__lib, item = document.getElementById(id), body = item.closest('.g-dialog__body'), h = item.querySelector(':scope > .g-accordion-item__heading'), g = item.closest('.g-accordion')
        body.scrollTop = 300
        return new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r({ top: h.getBoundingClientRect().top - body.getBoundingClientRect().top - parseFloat(getComputedStyle(body).borderTopWidth), v: getComputedStyle(item).getPropertyValue('--g-accordion-sticky-top').trim(), pad: g.style.getPropertyValue('--_scroll-pad'), bpad: getComputedStyle(body).paddingTop, bg: L.same(L.parse(getComputedStyle(h).backgroundColor), L.bgOf(body)), hb: getComputedStyle(h).backgroundColor, b: L.bgOf(body).map(Math.round).join(), sm: parseFloat(getComputedStyle(item.querySelector('.g-accordion-item__body p')).scrollMarginBlockStart), hh: h.getBoundingClientRect().height }))))
      }, id)
      T(Math.abs(d.top) <= 1 && d.v === '0px' && d.bg && d.pad === d.bpad, `${tag} ${id}: pegado al borde del cuerpo (${d.top.toFixed(1)}, ${d.v}, --_scroll-pad ${d.pad} = ${d.bpad}) con su fondo (${d.hb} / ${d.b})`)
      // --_head-size medido durante la entrada con escala del GDialog (getBoundingClientRect con transformación): hallazgo 1
      T(Math.abs(d.sm - d.hh) <= 3, `${tag} ${id}: scroll-margin del contenido ≈ encabezado (${d.sm} / ${d.hh})`)
      if (Math.abs(d.sm - d.hh) > 0.5) note(`${E} HALLAZGO 1 · ${tag} ${id}: --_head-size ${d.sm}px frente a un encabezado de ${d.hh}px (−${(d.hh - d.sm).toFixed(2)}px)`)
      await page.keyboard.press('Escape'); await page.waitForTimeout(350)
    }
    await done(page)
  }

  /* ---------- 7b · Recetas de la aplicación ---------- */
  if (run(7)) {
    // scroll-padding del documento con la misma medida que --g-accordion-sticky-top (receta del README)
    {
      const page = await open(browser, 'pad=1', { hash: '#f-pago' })
      await page.waitForTimeout(300)
      const a = await page.evaluate(() => document.getElementById('f-pago-toggle').getBoundingClientRect().top)
      await page.evaluate(() => { location.hash = '#p2-deep' })
      await page.waitForTimeout(300)
      const b = await page.evaluate(() => ({ top: document.getElementById('p2-deep').getBoundingClientRect().top, hb: document.querySelector('#p2 > .g-accordion-item__heading').getBoundingClientRect().bottom }))
      T(Math.abs(a - 48) <= 1 && Math.abs(b.top - b.hb) <= 1.5, `receta scroll-padding (#515): la cabecera una sola vez (#f-pago a ${a.toFixed(1)}, #p2-deep a ${b.top.toFixed(1)} justo bajo ${b.hb.toFixed(1)})`)
      note(`${E} receta (b) #515 · scroll-padding 48 + --g-accordion-sticky-top 48: #f-pago a ${a.toFixed(1)}px (antes 96), #p2-deep a ${b.top.toFixed(1)}px con el encabezado pegado hasta ${b.hb.toFixed(1)}px (hueco ${(b.top - b.hb).toFixed(1)}px, antes 48)`)
      await done(page)
    }
    // Estilo global de la aplicación sin capa: h3 { margin: 28px 0 }
    {
      const page = await open(browser, 'h3=1')
      const m = await page.evaluate(() => { const it = document.getElementById('f-cambiar'), h = it.querySelector(':scope > .g-accordion-item__heading'); return { off: h.getBoundingClientRect().top - it.getBoundingClientRect().top, mt: getComputedStyle(h).marginTop } })
      note(`${E} HALLAZGO 3 · h3 { margin: 28px 0 } sin capa en la aplicación: el encabezado baja ${m.off.toFixed(1)}px dentro del elemento (margen ${m.mt}); por #4 y #204, límite con receta`)
      await done(page)
    }
  }

  /* ---------- 8 · forced-colors (solo Chromium lo emula) ---------- */
  if (run(8) && engine === 'chromium') for (const qs of ['', 'theme=auditoria&dark=1']) {
    const page = await open(browser, qs, { forcedColors: 'active' })
    await page.focus('#f-cambiar-toggle'); await page.keyboard.press('ArrowDown'); await page.keyboard.press('ArrowUp')
    const f = await page.evaluate(() => {
      const q = (s) => document.querySelector(s)
      const t = getComputedStyle(q('#f-cambiar-toggle'))
      return { chev: getComputedStyle(q('#f-cambiar .g-accordion-item__chevron')).color, btn: t.color, ring: t.outlineStyle + ' ' + t.outlineWidth, dis: getComputedStyle(q('#f-historial .g-accordion-item__title')).color, sep: getComputedStyle(q('#f-cambiar')).borderBlockEndColor, sticky: getComputedStyle(q('#p2 > .g-accordion-item__heading')).backgroundColor, peek: getComputedStyle(q('#f-cambiar-peek')).color }
    })
    T(f.chev !== 'rgba(0, 0, 0, 0)' && !/^rgba\(.*, 0\)$/.test(f.sep) && !/^rgba\(.*, 0\)$/.test(f.sticky) && f.dis !== f.chev && /solid/.test(f.ring), `${qs || 'defecto'} forced-colors: chevron ${f.chev}, separador ${f.sep}, pegado ${f.sticky}, deshabilitado ${f.dis}, anillo ${f.ring}`)
    await done(page)
  }

  /* ---------- 9 · GFormSection plegable con el motor compartido ---------- */
  if (run(9)) {
    const page = await open(browser)
    await page.evaluate(() => document.getElementById('fs').scrollIntoView({ block: 'center' }))
    await page.waitForTimeout(100)
    const s0 = await page.evaluate(() => { const s = document.getElementById('fs'); const p = s.querySelector('.g-form-section__panel'); return { ready: s.classList.contains('is-ready'), open: s.classList.contains('is-open'), h: p.getBoundingClientRect().height, tp: getComputedStyle(p).transitionProperty, exp: s.querySelector('.g-form-section__toggle').getAttribute('aria-expanded') } })
    const sam = `() => { const s = document.getElementById('fs'), p = s.querySelector('.g-form-section__panel'); return { h: p.getBoundingClientRect().height, anim: s.classList.contains('is-animating'), open: s.classList.contains('is-open'), y: s.querySelector('.g-form-section__toggle').getBoundingClientRect().top } }`
    const o = await rec(page, `document.querySelector('#fs .g-form-section__toggle').click()`, sam, 420)
    await page.waitForTimeout(100)
    const focusIn = await page.evaluate(async () => { const i = document.querySelector('#fs-mail input') || document.getElementById('fs-mail'); i.focus(); return document.activeElement === i })
    const c = await rec(page, `document.querySelector('#fs .g-form-section__toggle').click()`, sam, 420)
    const mid = (r) => r.filter((f) => f.t >= 0 && f.h > 1 && f.h < r.reduce((m, x) => Math.max(m, x.h), 0) - 1).length
    T(s0.ready && !s0.open && s0.h === 0 && /grid-template-rows/.test(s0.tp) && s0.exp === 'false', `GFormSection: plegada al cargar con is-ready y la rejilla (${s0.tp})`)
    T(o.some((f) => f.anim) && mid(o) >= 3 && !o[o.length - 1].anim && o[o.length - 1].open && o[o.length - 1].h > 50, `GFormSection: abre animando (${mid(o)} cuadros intermedios) y asienta`)
    T(focusIn && c.some((f) => f.anim) && mid(c) >= 3 && c[c.length - 1].h === 0 && !c[c.length - 1].anim, `GFormSection: pliega animando (${mid(c)}) y asienta en 0`)
    T(await page.evaluate(() => document.activeElement && document.activeElement.classList.contains('g-form-section__toggle')), 'GFormSection: plegar con el foco dentro lo lleva al botón')
    await done(page)
  }

  T(!errors.length, `consola: ${[...new Set(errors)].slice(0, 5).join(' | ')}`)
  await browser.close()
}

server.close()
for (const n of notes) console.log('·', n)
for (const f of fails) console.log('✗', f)
for (const [k, [a, b]] of Object.entries(counts)) console.log(`  ${k}: ${a}/${b}`)
console.log(`\n${total - failed}/${total} comprobaciones`)
process.exit(failed ? 1 : 0)
