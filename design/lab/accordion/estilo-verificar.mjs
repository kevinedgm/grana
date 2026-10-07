// Verificación de coco sobre el banco de GAccordion (design/lab/accordion/estilo-banco.html), con el CSS real cargado en la
// capa grana.components y GSurface, GCard, GDialog, GSwitch, GBtn y GInput reales de dist/.
// Mide: análisis estático del CSS (sin literales de color ni de medida salvo 44px y el 0px de @property, sin respaldos, sin
// @layer ni !important, @property exacto, sin visibility: hidden en el panel ni en el contenido, sin keyframes ni muelle,
// movimiento solo con no-preference salvo fundidos, :hover solo con (hover: hover), #383, overflow-anchor, print y
// forced-colors); contraste de título, meta, avance, chevron, deshabilitado, contenido y foco en 26 temas (por defecto,
// propio de @grana/cli y los once generados de dark-color-presence, claro y oscuro) y en las anfitrionas; geometría
// (botón ≥ 44px también con space 3, texto ≥ 12px, foco hacia dentro sin pisar la letra, chevron y meta centrados en la
// primera línea, acciones en la línea del título, avance de una línea con puntos suspensivos, separadores, 320px sin
// desbordar y sin partir palabras del meta, RTL); A2 por cuadro al abrir y al plegar (Δ de la línea del avance y la primera
// del contenido, primera línea entera antes de la mitad del fundido, presencia de la línea), Δ0 en exclusive con
// overflow-anchor: none, nada animado al montar, el chevron que se asoma al pasar (botón y avance), movimiento reducido
// (sin rejilla ni giro ni inclinación; abrir y plegar con fundido, el plegado conserva el alto y asienta until-found),
// #:~:text= que encuentra lo plegado, impresión, sticky (pegado a --g-accordion-sticky-top, fondo de cada anfitriona,
// scroll-margin del botón y del contenido con --_head-size, Mayús+Tab que deja el control entero a la vista, cierre desde
// el pegado sin moverse, la línea que se despega con scroll-state, GDialog a 0), forced-colors (Chromium) y consola limpia.
// Ejecutar desde la raíz del repo (requiere dist/):  GRANA_PW_PORT=4214 node design/lab/accordion/estilo-verificar.mjs
// Opcional: GRANA_DIST=<copia de dist/>  --engines=chromium,firefox,webkit  --themes=all|base  --verbose
import http from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const pw = await import(new URL('../theme-playground/node_modules/playwright/index.mjs', import.meta.url))
const ROOT = fileURLToPath(new URL('../../../', import.meta.url))
const DIST = process.env.GRANA_DIST
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')).map(([k, v]) => [k, v ?? true]))
const ENGINES = (args.engines || 'chromium,firefox,webkit').split(',')
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
await new Promise((r) => server.listen(Number(process.env.GRANA_PW_PORT) || 4214, '127.0.0.1', r))
const BASE = `http://127.0.0.1:${server.address().port}/design/lab/accordion/estilo-banco.html`

const GEN = ['amazon', 'apple', 'caracol-purpura', 'github', 'grana', 'linear', 'lustre', 'medium', 'notion', 'spotify', 'stripe']
let total = 0, failed = 0
const fails = [], notes = []
const ok = (cond, msg) => { total++; if (!cond) { failed++; fails.push(msg) } }
const note = (s) => notes.push(s)

/* ---------- 0 · Análisis estático del CSS ---------- */
{
  const raw = await readFile(join(ROOT, 'packages/vue/src/components/GAccordion/GAccordion.css'), 'utf8')
  const css = raw.replace(/\/\*[\s\S]*?\*\//g, '')
  ok(!/#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|lab|lch|hwb|color)\(/.test(css), 'CSS: color literal')
  const named = [...css.matchAll(/:\s*([A-Za-z]+)\s*;/g)].map((m) => m[1]).filter((w) => /^(ButtonText|GrayText|Canvas|CanvasText|Highlight|HighlightText|red|blue|black|white|gray|grey)$/.test(w))
  ok(named.every((w) => ['ButtonText', 'GrayText'].includes(w)), 'CSS: color con nombre fuera de los del sistema: ' + named)
  ok(!/var\(\s*--[\w-]+\s*,/.test(css), 'CSS: var() con valor de respaldo')
  ok(!/@layer/.test(css) && !/!important/.test(css), 'CSS: @layer o !important')
  const prop = css.match(/@property\s+(--[\w-]+)\s*\{([^}]*)\}/g) || []
  ok(prop.length === 1 && /@property --g-accordion-sticky-top \{\s*syntax: "<length>";\s*inherits: true;\s*initial-value: 0px;\s*\}/.test(prop[0]), 'CSS: @property --g-accordion-sticky-top (<length>, inherits, 0px): ' + prop)
  const vars = [...css.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1])
  ok(vars.every((v) => v.startsWith('--g-') || v.startsWith('--_')), 'CSS: var() que no es --g-* ni --_*')
  const defaults = await readFile(join(ROOT, 'packages/vue/src/styles/defaults.css'), 'utf8')
  const defined = new Set([...defaults.matchAll(/(--g-[a-z0-9-]+)\s*:/g)].map((m) => m[1]))
  const missing = [...new Set(vars.filter((v) => v.startsWith('--g-') && !defined.has(v) && v !== '--g-accordion-sticky-top'))]
  ok(!missing.length, 'CSS: tokens que no existen en defaults.css ' + missing)
  ok(!defined.has('--g-accordion-sticky-top'), 'defaults.css: --g-accordion-sticky-top no es del tema (#484)')
  const own = new Set([...css.matchAll(/(--_[\w-]+)\s*:/g)].map((m) => m[1]))
  const OWN = ['--_scroll-pad', '--_sticky-bg', '--_accordion-on', '--_inset', '--_pad-start', '--_pad-end', '--_after', '--_t', '--_t-fade', '--_chev', '--_head-size']
  ok([...own].every((v) => OWN.includes(v)), 'CSS: alias propios fuera de la lista: ' + [...own].filter((v) => !OWN.includes(v)))
  const strange = [...new Set(vars.filter((v) => v.startsWith('--_') && !own.has(v)))]
  ok(!strange.length, 'CSS: lee alias --_* que no declara (de otro componente): ' + strange)
  const px = [...css.matchAll(/(-?\d*\.?\d+)px/g)].map((m) => m[0])
  ok(px.every((p) => p === '44px' || p === '0px') && px.filter((p) => p === '0px').length === 1, 'CSS: medidas literales no permitidas ' + px)
  const nums = [...css.matchAll(/\*\s*(-?\d*\.?\d+)\b(?!px|ms|%)/g)].map((m) => m[1])
  ok(nums.every((n) => ['-1', '0', '0.5', '-0.5'].includes(n)), 'CSS: factores fuera de −1, 0 y ±0,5 (§29.6): ' + nums)
  ok(!/@keyframes|animation\s*:/.test(css), 'CSS: keyframes o animation (todo son transiciones, #71)')
  ok(!/ease-spring|ease-bounce/.test(css), 'CSS: muelle o rebote (#299, #483: nunca en paneles)')
  ok(!/\bvisibility\s*:\s*hidden/.test(css.replace(/\.g-accordion-item\.is-open > \.g-accordion-item__peek \{[^}]*\}/, '')), 'CSS: visibility: hidden fuera del avance abierto (#480)')
  ok(/\.g-accordion \{[^}]*overflow-anchor: none/.test(css) && /\.g-accordion-item\.is-standalone \{[^}]*overflow-anchor: none/.test(css), 'CSS: overflow-anchor: none en el grupo y en el suelto (#481)')
  const structural = [...css.replace(/\{[^}]*\}/g, '{}').matchAll(/>\s*(\*|:[\w-]+(?:\([^)]*\)*)?)/g)].map((m) => m[1]).filter((x) => !/^:is\(\.g-accordion-item__/.test(x) && !/^:nth-(last-)?child\(1 of (:not\(:where\(\.g-tooltip\)\)|\.g-accordion-item)/.test(x))
  ok(!structural.length, 'CSS: selector de hijos por estructura sin excluir .g-tooltip (#383): ' + structural)
  // Contexto de cada declaración: movimiento (translate, rotate, grid-template-rows) solo con no-preference; :hover solo con (hover: hover)
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
  ok(motion.length >= 3 && motion.every((c) => /prefers-reduced-motion: no-preference/.test(c)), 'CSS: transición de movimiento fuera de no-preference: ' + motion.filter((c) => !/no-preference/.test(c)))
  ok(hov.length >= 2 && hov.every((c) => /@media \(hover: hover\)/.test(c)), 'CSS: :hover fuera de @media (hover: hover)')
  ok(/@media \(forced-colors: active\)/.test(css) && /@media print/.test(css) && /@media \(prefers-reduced-motion: reduce\)/.test(css), 'CSS: falta forced-colors, print o reduce')
  ok(/@supports \(container-type: scroll-state\)/.test(css), 'CSS: la línea que se despega no va como mejora progresiva')
  ok(/min-block-size: 44px/.test(css) && /scroll-margin-block-start: var\(--g-accordion-sticky-top\)/.test(css) && /calc\(var\(--g-accordion-sticky-top\) \+ var\(--_head-size\)\)/.test(css), 'CSS: 44px, scroll-margin del botón o del contenido')
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

async function open(browser, qs = '', opts = {}) {
  const ctx = await browser.newContext({ viewport: opts.viewport || { width: 1200, height: 900 }, reducedMotion: opts.reducedMotion || 'no-preference', forcedColors: opts.forcedColors || 'none', hasTouch: false })
  const page = await ctx.newPage()
  page.__errors = []
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') page.__errors.push(m.text()) })
  page.on('pageerror', (e) => page.__errors.push(e.message))
  await page.goto(BASE + (qs ? '?' + qs.replace(/^\?/, '') : '') + (opts.hash || ''))
  await page.waitForFunction(() => window.__ready === true)
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

const themes = args.themes === 'base' ? ['', 'theme=propio'] : ['', 'theme=propio', ...GEN.map((g) => 'theme=' + g)]

for (const engine of ENGINES) {
  const browser = await pw[engine].launch()
  const E = `[${engine}]`
  const errors = []

  /* ---------- 1 · Contraste en 26 temas ---------- */
  let minT = { title: 99, meta: 99, peek: 99, chev: 99, dis: 99, body: 99, focus: 99, hostTitle: 99 }
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
    const tag = `${E} ${th || 'defecto'}${dark ? ' oscuro' : ''}`
    ok(r.title >= 4.5, `${tag} título ${r.title}`)
    ok(r.meta >= 4.5, `${tag} meta ${r.meta}`)
    ok(r.peek >= 4.5, `${tag} avance ${r.peek}`)
    ok(r.chev >= 3, `${tag} chevron ${r.chev}`)
    ok(r.dis >= 4.5, `${tag} título deshabilitado ${r.dis}`)
    ok(r.body >= 4.5, `${tag} contenido ${r.body}`)
    ok(r.focus >= 3, `${tag} anillo de foco ${r.focus}`)
    ok(r.hostTitle >= 4.5, `${tag} título en anfitrionas ${r.hostTitle}`)
    for (const h of r.hosts) ok(h.ok, `${tag} fondo pegado ${h.s}: ${h.hb} ≠ ${h.b}`)
    for (const k of Object.keys(minT)) minT[k] = Math.min(minT[k], r[k])
    if (args.verbose) console.log(tag, JSON.stringify(r))
    errors.push(...page.__errors)
    await page.context().close()
  }
  note(`${E} contraste mínimo en ${themes.length * 2} temas: título ${minT.title} · meta ${minT.meta} · avance ${minT.peek} · chevron ${minT.chev} · deshabilitado ${minT.dis} · contenido ${minT.body} · foco ${minT.focus} · título en anfitrionas ${minT.hostTitle}`)

  /* ---------- 2 · Geometría (por defecto y propio con space 3) ---------- */
  for (const qs of ['', 'theme=propio']) {
    const page = await open(browser, qs)
    const g = await page.evaluate(() => {
      const L = window.__lib
      const q = (s) => document.querySelector(s)
      const toggles = [...document.querySelectorAll('.g-accordion-item__toggle')]
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
        actDy: Math.abs((act.top + act.bottom) / 2 - (stitle.top + line / 2)),
        peekH: peek.getBoundingClientRect().height, peekLine: parseFloat(pcs.lineHeight), peekClip: peek.scrollHeight > peek.clientHeight + 1 || peek.scrollWidth > peek.clientWidth,
        peekColor: L.same(L.parse(pcs.color), L.tok('--g-color-text-muted')),
        sepGroup: sep('#f-cambiar'), sepStandalone: sep('#suelto'), sepNestedLast: sep('#i2'), sepNestedFirst: sep('#i1'),
        cursorPeek: pcs.cursor, cursorDis: getComputedStyle(q('#f-historial-toggle')).cursor, cursorDisPeek: getComputedStyle(q('#f-historial-peek')).cursor,
        oa: [getComputedStyle(q('#faq')).overflowAnchor, getComputedStyle(q('#suelto')).overflowAnchor],
        panelVis: [...document.querySelectorAll('.g-accordion-item__panel, .g-accordion-item__content')].every((e) => getComputedStyle(e).visibility === 'visible'),
        closedHidden: q('#f-cambiar-content').getAttribute('hidden'), titleSize: parseFloat(getComputedStyle(q('#f-cambiar .g-accordion-item__title')).fontSize),
        titleTok: L.tok('--g-text-title-sm-size') && parseFloat(getComputedStyle(document.documentElement).fontSize) * parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--g-text-title-sm-size'))
      }
    })
    const tag = `${E} ${qs || 'defecto'}`
    ok(g.minH >= 44, `${tag} botón ≥ 44px: ${g.minH}`)
    ok(g.minFs >= 12, `${tag} texto ≥ 12px: ${g.minFs}`)
    ok(g.ringIn, `${tag} anillo hacia dentro`)
    ok(g.inset >= parseFloat(g.ow) + 0.5, `${tag} el anillo no pisa la letra: sangría ${g.inset} vs ${g.ow}`)
    ok(g.chevDy <= 1 && g.longChevDy <= 1 && g.longLines >= 2, `${tag} chevron centrado en la primera línea: ${g.chevDy} · título de ${g.longLines} líneas ${g.longChevDy}`)
    ok(g.chevEnd <= parseFloat(g.ow) + 4 + 0.5, `${tag} chevron al final del botón: ${g.chevEnd}`)
    ok(g.metaDy <= 1, `${tag} meta centrado en la primera línea: ${g.metaDy}`)
    ok(g.actDy <= 1, `${tag} acciones centradas en la línea del título: ${g.actDy}`)
    ok(Math.abs(g.peekH - g.peekLine) <= 0.5 && g.peekClip && g.peekColor, `${tag} avance de una línea recortada en text-muted: ${g.peekH}/${g.peekLine} ${g.peekClip} ${g.peekColor}`)
    ok(parseFloat(g.sepGroup) > 0 && g.sepStandalone === '0px' && g.sepNestedLast === '0px' && parseFloat(g.sepNestedFirst) > 0, `${tag} separadores: grupo ${g.sepGroup} · suelto ${g.sepStandalone} · anidado último ${g.sepNestedLast}`)
    ok(g.cursorPeek === 'pointer' && g.cursorDis === 'not-allowed' && g.cursorDisPeek === 'default', `${tag} cursores ${g.cursorPeek}/${g.cursorDis}/${g.cursorDisPeek}`)
    ok(g.oa.every((v) => v === 'none'), `${tag} overflow-anchor ${g.oa}`)
    ok(g.panelVis && g.closedHidden === 'until-found', `${tag} sin visibility: hidden en panel/contenido; plegado until-found (${g.closedHidden})`)
    if (!qs) note(`${E} botón mínimo ${g.minH}px (defecto) · sangría ${g.inset}px · chevron Δ ${g.chevDy.toFixed(2)} · meta Δ ${g.metaDy.toFixed(2)} · acciones Δ ${g.actDy.toFixed(2)}`)
    else note(`${E} botón mínimo ${g.minH}px con space 3 (propio)`)
    errors.push(...page.__errors)
    await page.context().close()
  }

  /* ---------- 3 · 320px, RTL ---------- */
  {
    const page = await open(browser, '', { viewport: { width: 320, height: 800 } })
    const r = await page.evaluate(() => {
      const q = (s) => document.querySelector(s)
      const w = q('#w320')
      const txt = (el) => [...el.childNodes].find((n) => n.nodeType === 3 && n.data.trim())
      const meta = txt(q('#n1 .g-accordion-item__meta'))
      const words = meta.data.split(' ').map((wd) => { const i = meta.data.indexOf(wd); const rg = document.createRange(); rg.setStart(meta, i); rg.setEnd(meta, i + wd.length); return new Set([...rg.getClientRects()].map((x) => Math.round(x.top))).size })
      const t = txt(q('#n2 .g-accordion-item__title'))
      const i = t.data.indexOf('Notificaciones'); const rg = document.createRange(); rg.setStart(t, i); rg.setEnd(t, i + 14)
      return { doc: document.documentElement.scrollWidth - document.documentElement.clientWidth, box: [...w.querySelectorAll('.g-accordion-item')].every((e) => e.scrollWidth <= e.clientWidth + 1), metaWords: Math.max(...words), notif: new Set([...rg.getClientRects()].map((x) => Math.round(x.top))).size, act: q('#n2 .g-accordion-item__actions').getBoundingClientRect().width / q('#n2').getBoundingClientRect().width }
    })
    ok(r.doc <= 0 && r.box, `${E} 320px sin desplazamiento horizontal (${r.doc})`)
    ok(r.metaWords === 1, `${E} 320px: el meta no parte palabras (${r.metaWords})`)
    ok(r.notif === 1, `${E} 320px con acciones: «Notificaciones» entera (${r.notif} líneas)`)
    ok(r.act <= 0.36, `${E} 320px: acciones ≤ un tercio (${r.act.toFixed(2)})`)
    const rtl = await page.evaluate(() => {
      const q = (s) => document.querySelector(s)
      const c1 = getComputedStyle(q('#r1 .g-accordion-item__chevron > .g-icon')), c2 = getComputedStyle(q('#r2 .g-accordion-item__chevron > .g-icon'))
      const t = q('#r1 .g-accordion-item__title').getBoundingClientRect(), ch = q('#r1 .g-accordion-item__chevron').getBoundingClientRect()
      const pk = q('#r1-peek').getBoundingClientRect(), tg = q('#r1-toggle').getBoundingClientRect()
      return { s1: c1.scale, r2: c2.rotate, s2: c2.scale, chevLeft: ch.right <= t.left, peekRight: Math.abs(tg.right - pk.right) <= 1, dir: q('#r1 .g-accordion-item__title').getAttribute('dir') }
    })
    ok(rtl.s1 === '-1 1' && rtl.s2 === '-1 1' && rtl.r2 === '-90deg' && rtl.chevLeft && rtl.peekRight && rtl.dir === 'auto', `${E} RTL: chevron espejado (${rtl.s1}), abierto ${rtl.r2}, al final lógico ${rtl.chevLeft}, avance al inicio ${rtl.peekRight}`)
    errors.push(...page.__errors)
    await page.context().close()
  }

  /* ---------- 4 · Movimiento: nada al montar, A2 por cuadro, Δ0, puntero ---------- */
  {
    const page = await open(browser)
    const mount = await page.evaluate(() => document.getAnimations().filter((a) => a.effect && a.effect.target && a.effect.target.closest && a.effect.target.closest('.g-accordion-item') && !a.effect.target.closest('.g-accordion-item__body, .g-accordion-item__actions')).length)
    ok(mount === 0, `${E} nada animado al montar (${mount})`)
    const tr = await page.evaluate(() => {
      const q = (s) => document.querySelector(s)
      const p = getComputedStyle(q('#f-cambiar > .g-accordion-item__panel')), i = getComputedStyle(q('#f-cambiar .g-accordion-item__chevron > .g-icon'))
      return { p: p.transitionProperty + ' ' + p.transitionDuration + ' ' + p.transitionTimingFunction, i: i.transitionProperty + ' ' + i.transitionDuration }
    })
    ok(/grid-template-rows/.test(tr.p) && /0\.24s/.test(tr.p) && /rotate/.test(tr.i) && /0\.12s/.test(tr.i), `${E} rejilla en slow y giro en fast: ${tr.p} · ${tr.i}`)
    // A2: abrir y plegar «¿Puedo cambiar…?» (dos párrafos) y «¿Atienden urgencias?» (uno de una línea)
    const sampler = (id) => `() => {
      const L = window.__lib, q = (s) => document.querySelector(s)
      const pk = q('#${id}-peek'), ct = q('#${id}-content'), p1 = ct.querySelector('p')
      const a = L.firstChar(pk), b = ct.hasAttribute('hidden') ? null : L.firstChar(p1)
      const cr = ct.getBoundingClientRect(), op = +getComputedStyle(pk).opacity
      const vis = getComputedStyle(pk).visibility === 'visible'
      const frac = b && b.height ? Math.max(0, Math.min(1, (Math.min(b.bottom, cr.bottom) - b.top) / b.height)) : 0
      return { dt: a && b ? Math.abs(a.top - b.top) : null, dl: a && b ? Math.abs(a.left - b.left) : null, op: vis ? op : 0, frac, h: cr.height }
    }`
    let worst = { open: 0, close: 0, pres: 1, wholeBeforeHalf: true }
    for (const id of ['f-cambiar', 'f-urgencias']) {
      await page.evaluate((id) => { document.getElementById(id).scrollIntoView({ block: 'center' }) }, id)
      await page.waitForTimeout(60)
      const o = await rec(page, `document.getElementById('${id}-toggle').click()`, sampler(id), 420)
      const c = await (async () => { await page.waitForTimeout(150); return rec(page, `document.getElementById('${id}-toggle').click()`, sampler(id), 420) })()
      const dO = Math.max(...o.filter((f) => f.dt != null).map((f) => Math.max(f.dt, f.dl)))
      const dC = Math.max(...c.filter((f) => f.dt != null).map((f) => Math.max(f.dt, f.dl)))
      const half = o.find((f) => f.t >= 0 && f.op <= 0.5)
      const whole = !half || half.frac >= 0.999
      const presO = Math.min(...o.filter((f) => f.t >= 0).map((f) => Math.max(f.op, f.frac)))
      const presC = Math.min(...c.filter((f) => f.t >= 0).map((f) => Math.max(f.op, f.frac)))
      worst = { open: Math.max(worst.open, dO), close: Math.max(worst.close, dC), pres: Math.min(worst.pres, presO, presC), wholeBeforeHalf: worst.wholeBeforeHalf && whole }
      ok(dO <= 1 && dC <= 1, `${E} A2 ${id}: línea del avance y primera del contenido Δ ≤ 1px (abrir ${dO.toFixed(2)}, plegar ${dC.toFixed(2)})`)
      ok(whole, `${E} A2 ${id}: primera línea entera antes de la mitad del fundido (t ${half && half.t.toFixed(0)}ms, ${half && half.frac})`)
      ok(presO >= 0.9 && presC >= 0.6, `${E} A2 ${id}: la línea nunca desaparece (abrir ${presO.toFixed(2)}, plegar ${presC.toFixed(2)})`)
      ok(c[c.length - 1].h === 0 && (await page.getAttribute(`#${id}-content`, 'hidden')) === 'until-found', `${E} ${id} asienta plegado until-found`)
      if (args.verbose) console.log(E, id, 'abrir', JSON.stringify(o.slice(0, 8)), 'plegar', JSON.stringify(c.slice(0, 10)))
    }
    note(`${E} A2: Δ máx abrir ${worst.open.toFixed(2)}px · plegar ${worst.close.toFixed(2)}px · presencia mínima de la línea ${worst.pres.toFixed(2)}`)
    // color del contenido: muted → text durante la altura
    const col = await rec(page, `document.getElementById('f-documentos-toggle').click()`, `() => { const L = window.__lib; const c = L.parse(getComputedStyle(document.querySelector('#f-documentos-content')).color); return { c: c.slice(0, 3).map(Math.round).join(',') } }`, 320)
    const cols = [...new Set(col.filter((f) => f.t >= 0).map((f) => f.c))]
    const tm = await page.evaluate(() => [window.__lib.tok('--g-color-text-muted'), window.__lib.tok('--g-color-text')].map((c) => c.slice(0, 3).map(Math.round).join(',')))
    ok(col[0].c === tm[0] && col[col.length - 1].c === tm[1] && cols.length >= 4, `${E} el contenido se enciende: ${col[0].c} → ${col[col.length - 1].c} en ${cols.length} pasos`)
    // Δ0 en exclusive
    await page.evaluate(() => { const h = document.querySelector('#e3 > .g-accordion-item__heading'); window.scrollTo(0, h.getBoundingClientRect().top + scrollY - 500) })
    await page.waitForTimeout(80)
    const d0 = await rec(page, `document.getElementById('e3-toggle').click()`, `() => ({ y: document.querySelector('#e3 > .g-accordion-item__heading').getBoundingClientRect().top })`, 450)
    const y0 = d0[0].y
    const dmax = Math.max(...d0.map((f) => Math.abs(f.y - y0)))
    ok(dmax <= 1, `${E} Δ0 en exclusive: el encabezado tocado se mueve ${dmax.toFixed(2)}px como máximo`)
    note(`${E} Δ0 exclusive ${dmax.toFixed(2)}px`)
    // Puntero: el chevron se asoma (cerrado: abajo; abierto: arriba) y la línea se marca; también desde el avance
    const hov = async (sel) => { await page.hover(sel); await page.waitForTimeout(220) }
    const chevState = (id) => page.evaluate((id) => { const c = document.querySelector(`#${id} .g-accordion-item__chevron`), L = window.__lib; return { tr: getComputedStyle(c).translate, col: L.same(L.parse(getComputedStyle(c).color), L.tok('--g-color-text')), sep: L.same(L.parse(getComputedStyle(document.getElementById(id)).borderBlockEndColor), L.tok('--g-color-border-strong')) } }, id)
    await page.evaluate(() => document.getElementById('f-pago').scrollIntoView({ block: 'center' }))
    await hov('#f-pago-toggle'); const h1 = await chevState('f-pago')
    await page.mouse.move(5, 5); await page.waitForTimeout(220); const h0 = await chevState('f-pago')
    await hov('#f-pago-peek'); const h2 = await chevState('f-pago')
    await page.evaluate(() => document.getElementById('f-resultados').scrollIntoView({ block: 'center' }))
    await hov('#f-resultados-toggle'); const h3 = await chevState('f-resultados')
    await hov('#f-historial-toggle'); const h4 = await chevState('f-historial')
    const two = await page.evaluate(() => { const i = document.createElement('i'); i.style.inlineSize = 'calc(var(--g-space-1) * 0.5)'; i.style.position = 'absolute'; document.body.append(i); const v = i.getBoundingClientRect().width; i.remove(); return v })
    ok(h1.tr === `0px ${two}px` && h1.col && h1.sep, `${E} puntero en el botón cerrado: chevron ${h1.tr}, text ${h1.col}, línea fuerte ${h1.sep}`)
    ok((h0.tr === 'none' || h0.tr === '0px' || h0.tr === '0px 0px') && !h0.sep, `${E} sin puntero: chevron quieto (${h0.tr})`)
    ok(h2.tr === `0px ${two}px` && h2.col && h2.sep, `${E} puntero en el avance: chevron ${h2.tr}, línea ${h2.sep}`)
    ok(h3.tr === `0px -${two}px` && h3.col && !h3.sep, `${E} puntero en el abierto: chevron ${h3.tr}, sin marcar la línea lejana`)
    ok((h4.tr === 'none' || h4.tr === '0px' || h4.tr === '0px 0px') && !h4.col && !h4.sep, `${E} deshabilitado sin respuesta al puntero (${h4.tr})`)
    errors.push(...page.__errors)
    await page.context().close()
  }

  /* ---------- 5 · Movimiento reducido ---------- */
  {
    const page = await open(browser, '', { reducedMotion: 'reduce' })
    const sampler = `() => { const q = (s) => document.querySelector(s); const p = q('#f-documentos > .g-accordion-item__panel'); const cs = getComputedStyle(p); return { h: p.getBoundingClientRect().height, op: +cs.opacity, anim: q('#f-documentos').classList.contains('is-animating'), tp: cs.transitionProperty } }`
    await page.evaluate(() => document.getElementById('f-documentos').scrollIntoView({ block: 'center' }))
    const o = await rec(page, `document.getElementById('f-documentos-toggle').click()`, sampler, 360)
    await page.waitForTimeout(100)
    const c = await rec(page, `document.getElementById('f-documentos-toggle').click()`, sampler, 400)
    const full = o[o.length - 1].h
    ok(!/grid-template-rows/.test(o[1].tp) && /opacity/.test(o[1].tp), `${E} reduce: sin rejilla en la transición (${o[1].tp})`)
    ok(o[1].h === full && o.filter((f) => f.t >= 0 && f.op > 0.05 && f.op < 0.95).length >= 2, `${E} reduce, abrir: alto final en el primer cuadro y fundido (${o[1].h}/${full})`)
    const during = c.filter((f) => f.t >= 0 && f.anim)
    ok(during.length >= 2 && during.every((f) => f.h === full) && during.some((f) => f.op > 0.05 && f.op < 0.95), `${E} reduce, plegar: conserva el alto mientras se funde (${during.length} cuadros)`)
    ok(c[c.length - 1].h === 0 && (await page.getAttribute('#f-documentos-content', 'hidden')) === 'until-found', `${E} reduce: asienta plegado until-found`)
    const st = await page.evaluate(() => { const i = getComputedStyle(document.querySelector('#f-cambiar .g-accordion-item__chevron > .g-icon')); return i.transitionDuration })
    ok(/^0s$/.test(st), `${E} reduce: el chevron gira sin transición (${st})`)
    await page.evaluate(() => document.getElementById('f-pago').scrollIntoView({ block: 'center' }))
    await page.hover('#f-pago-toggle'); await page.waitForTimeout(200)
    const tr = await page.evaluate(() => getComputedStyle(document.querySelector('#f-pago .g-accordion-item__chevron')).translate)
    ok(tr === 'none' || tr === '0px' || tr === '0px 0px', `${E} reduce: el chevron no se inclina (${tr})`)
    errors.push(...page.__errors)
    await page.context().close()
  }

  /* ---------- 6 · #:~:text= encuentra lo plegado; impresión ---------- */
  {
    const page = await open(browser, '', { hash: '#:~:text=' + encodeURIComponent('acta de nacimiento') })
    await page.waitForTimeout(300)
    const st = await page.evaluate(() => ({ open: document.getElementById('f-documentos').classList.contains('is-open'), hidden: document.getElementById('f-documentos-content').getAttribute('hidden') }))
    ok(st.open && st.hidden === null, `${E} #:~:text= abre lo plegado (${JSON.stringify(st)})`)
    await page.emulateMedia({ media: 'print' })
    await page.waitForTimeout(400) // la emulación cambia de pantalla a impresión en caliente y dispara las transiciones de color
    const pr = await page.evaluate(() => {
      const items = [...document.querySelectorAll('.g-accordion-item')]
      return {
        zero: items.filter((i) => i.querySelector(':scope > .g-accordion-item__panel > .g-accordion-item__content').getBoundingClientRect().height < 1).map((i) => i.id),
        hide: [...document.querySelectorAll('.g-accordion-item__peek, .g-accordion-item__chevron, .g-accordion-item__actions')].every((e) => getComputedStyle(e).display === 'none'),
        stat: [...document.querySelectorAll('.g-accordion--sticky .g-accordion-item__heading')].every((e) => getComputedStyle(e).position === 'static'),
        color: (() => { const L = window.__lib; return L.same(L.parse(getComputedStyle(document.getElementById('f-cambiar-content')).color), L.tok('--g-color-text')) })()
      }
    })
    ok(pr.zero.length === 0 && pr.hide && pr.stat && pr.color, `${E} impresión: todo abierto (${pr.zero}), sin avance/chevron/acciones ${pr.hide}, sin pegar ${pr.stat}, contenido en text ${pr.color}`)
    errors.push(...page.__errors)
    await page.context().close()
  }

  /* ---------- 7 · sticky ---------- */
  for (const qs of ['', 'theme=propio']) {
    const page = await open(browser, qs)
    const tag = `${E} ${qs || 'defecto'}`
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
        smFaq: getComputedStyle(q('#f-cambiar-toggle')).scrollMarginBlockStart
      }
    })
    ok(Math.abs(s.top - 48) <= 1 && Math.abs(s.atop - 48) <= 1 && Math.abs(s.abottom - s.hbottom) <= 1, `${tag} sticky: encabezado y acciones pegados a 48px (${s.top}, ${s.atop}) con el mismo alto`)
    ok(s.bg && s.abg, `${tag} sticky: fondo opaco de la página en encabezado y acciones`)
    ok(s.smBtn === '48px' && s.smFaq === '48px', `${tag} scroll-margin del botón = --g-accordion-sticky-top (${s.smBtn}, también sin sticky ${s.smFaq})`)
    ok(Math.abs(s.smIn - (48 + s.head)) <= 1 && Math.abs(s.headVar - s.head) <= 0.5, `${tag} scroll-margin del contenido = 48 + encabezado (${s.smIn} vs ${48 + s.head}; --_head-size ${s.headVar})`)
    if (s.support) ok(s.lift === 1, `${tag} se despega: línea y sombra con el encabezado pegado (${s.lift})`)
    else note(`${tag} sin container-type: scroll-state (la línea que se despega no aparece; fondo opaco)`)
    // Mayús+Tab dentro de un abierto: el control queda entero a la vista bajo el pegado
    await page.focus('#p2-phone')
    await page.evaluate(() => { const i = document.querySelector('#p2-name input') || document.querySelector('#p2-name'); window.scrollBy(0, i.getBoundingClientRect().top - 20) })
    await page.waitForTimeout(80)
    await page.keyboard.press('Shift+Tab')
    await page.waitForTimeout(250)
    const ft = await page.evaluate(() => { const a = document.activeElement; const h = document.querySelector('#p2 > .g-accordion-item__heading').getBoundingClientRect(); return { id: a.id || a.closest('[id]').id, top: a.getBoundingClientRect().top, hb: h.bottom } })
    ok(ft.top >= ft.hb - 0.5, `${tag} Mayús+Tab: el control enfocado queda entero bajo el encabezado pegado (${ft.top.toFixed(1)} ≥ ${ft.hb.toFixed(1)}, ${ft.id})`)
    // Cerrar desde el pegado: instantáneo y el encabezado no se mueve
    const cl = await rec(page, `document.getElementById('p2-toggle').click()`, `() => ({ y: document.querySelector('#p2 > .g-accordion-item__heading').getBoundingClientRect().top, inst: document.getElementById('p2').classList.contains('is-instant') })`, 200)
    const dy = Math.max(...cl.map((f) => Math.abs(f.y - cl[0].y)))
    ok(dy <= 1 && cl.some((f) => f.inst), `${tag} cerrar desde el pegado: instantáneo y Δ ${dy.toFixed(2)}px`)
    // GDialog: el pegado va al borde del cuerpo (--g-accordion-sticky-top a 0) con el fondo del diálogo
    for (const [btn, id] of [['#open-dialog', 'h-dialog-a'], ['#open-dialog-inset', 'h-dinset-a']]) {
      await page.click(btn); await page.waitForSelector('#' + id, { state: 'visible', timeout: 5000 }).catch(() => {}); await page.waitForTimeout(350)
      if (!(await page.$('#' + id))) { ok(false, `${tag} ${id}: el GDialog no se abrió`); await page.keyboard.press('Escape'); continue }
      const d = await page.evaluate((id) => {
        const L = window.__lib, item = document.getElementById(id), body = item.closest('.g-dialog__body'), h = item.querySelector(':scope > .g-accordion-item__heading')
        body.scrollTop = 300
        return new Promise((r) => requestAnimationFrame(() => r({ top: h.getBoundingClientRect().top - body.getBoundingClientRect().top - parseFloat(getComputedStyle(body).borderTopWidth), v: getComputedStyle(item).getPropertyValue('--g-accordion-sticky-top').trim(), bg: L.same(L.parse(getComputedStyle(h).backgroundColor), L.bgOf(body)), hb: getComputedStyle(h).backgroundColor, b: L.bgOf(body).map(Math.round).join() })))
      }, id)
      ok(Math.abs(d.top) <= 1 && d.v === '0px' && d.bg, `${tag} ${id}: pegado al borde del cuerpo (${d.top.toFixed(1)}, ${d.v}) con su fondo (${d.hb} / ${d.b})`)
      await page.keyboard.press('Escape'); await page.waitForTimeout(300)
    }
    errors.push(...page.__errors)
    await page.context().close()
  }

  /* ---------- 8 · forced-colors (solo Chromium lo emula) ---------- */
  if (engine === 'chromium') {
    const page = await open(browser, '', { forcedColors: 'active' })
    const f = await page.evaluate(() => {
      const q = (s) => document.querySelector(s)
      const btn = getComputedStyle(q('#f-cambiar-toggle')).color
      return { chev: getComputedStyle(q('#f-cambiar .g-accordion-item__chevron')).color, btn, dis: getComputedStyle(q('#f-historial .g-accordion-item__title')).color, sep: getComputedStyle(q('#f-cambiar')).borderBlockEndColor, sticky: getComputedStyle(q('#p2 > .g-accordion-item__heading')).backgroundColor }
    })
    ok(f.chev !== 'rgba(0, 0, 0, 0)' && !/^rgba\(.*, 0\)$/.test(f.sep) && !/^rgba\(.*, 0\)$/.test(f.sticky) && f.dis !== f.chev, `${E} forced-colors: chevron ${f.chev}, separador ${f.sep}, pegado ${f.sticky}, deshabilitado ${f.dis}`)
    errors.push(...page.__errors)
    await page.context().close()
  }

  ok(!errors.length, `${E} consola: ${[...new Set(errors)].slice(0, 5).join(' | ')}`)
  await browser.close()
}

server.close()
for (const n of notes) console.log('·', n)
for (const f of fails) console.log('✗', f)
console.log(`\n${total - failed}/${total} comprobaciones`)
process.exit(failed ? 1 : 0)
