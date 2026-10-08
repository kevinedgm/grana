// Verificación de coco sobre el banco de GBreadcrumbs (design/lab/breadcrumbs/estilo-banco.html), con el CSS real cargado
// en la capa grana.components sobre dist/grana.css y la fuente servida. Mide: análisis estático del CSS (sin literales de
// color, sin respaldos, sin @layer/@property/!important, alias --_bc-* y datos del .vue, literales solo 24px/44px/1px del
// texto oculto, 20ch/3ch/8ch, 90deg/180deg y los pesos de #495; keyframes g-breadcrumbs-…; animación solo bajo
// prefers-reduced-motion; :hover solo en (hover: hover); muelle solo dentro de @supports y solo en el nivel que llega; sin
// selectores de hijos por estructura, #383; display de los paneles solo bajo :popover-open); contraste en 26 temas (por
// defecto, propio de @grana/cli y los once generados, claro y oscuro) de niveles, nivel sin página, pastilla recortada,
// actual, separador, puerta en reposo / al pasar / abierta, «Subir», divulgación, escalera, panel de una puerta y anillo
// de foco; etapas por ancho (seis de seis a 560 y 400px, step en lo estrecho), sin desbordar el nav en LTR y RTL; raíz
// nunca a medias; alto Δ0 entre etapas (fino y grueso); objetivos ≥ 24 (≥ 44 con puntero grueso); la puerta distinta del
// separador en reposo, al pasar y abierta (giro 90°, −90° en RTL); paneles en la capa superior dentro de una cabecera con
// overflow: hidden; despliegue por teclado sin transición de tamaño y con el anillo visible; escalera con sangría space × 4
// y retardos acotados; bajar (muelle) y subir (copia que no ocupa sitio); nada al montar ni al cambiar de etapa; movimiento
// reducido; recorte antes de is-ready; forced-colors (Chromium); zoom 200 % y 400 %; consola limpia.
// Ejecutar desde la raíz del repo:  GRANA_PW_PORT=4215 node design/lab/breadcrumbs/estilo-verificar.mjs
// Opcional: --engines=chromium,firefox,webkit  --verbose  --themes=quick (solo por defecto y propio)
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
await new Promise((r) => server.listen(Number(process.env.GRANA_PW_PORT) || 4215, '127.0.0.1', r))
const BASE = `http://127.0.0.1:${server.address().port}/design/lab/breadcrumbs/estilo-banco.html`

const GEN = ['amazon', 'apple', 'caracol-purpura', 'github', 'grana', 'linear', 'lustre', 'medium', 'notion', 'spotify', 'stripe']
let total = 0, failed = 0
const fails = []
const notes = []
const ok = (cond, msg) => { total++; if (!cond) { failed++; fails.push(msg) } }
const near = (a, b, t = 0.5) => Math.abs(a - b) <= t

/* ---------- 0 · Análisis estático del CSS ---------- */
{
  const raw = await readFile(join(ROOT, 'packages/vue/src/components/GBreadcrumbs/GBreadcrumbs.css'), 'utf8')
  const css = raw.replace(/\/\*[\s\S]*?\*\//g, '')
  ok(!/#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|lab|lch|color-mix)\(/.test(css), 'CSS: color literal o mezcla')
  ok(!/var\(\s*--[\w-]+\s*,/.test(css), 'CSS: var() con valor de respaldo')
  ok(!/@layer/.test(css) && !/@property/.test(css) && !/!important/.test(css), 'CSS: @layer, @property o !important')
  const vars = [...css.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1])
  ok(vars.every((v) => v.startsWith('--g-') || v.startsWith('--_')), 'CSS: var() que no es --g-* ni --_*')
  const defaults = await readFile(join(ROOT, 'packages/vue/src/styles/defaults.css'), 'utf8')
  const defined = new Set([...defaults.matchAll(/(--g-[a-z0-9-]+)\s*:/g)].map((m) => m[1]))
  const missing = [...new Set(vars.filter((v) => v.startsWith('--g-') && !defined.has(v)))]
  ok(!missing.length, 'CSS: tokens que no existen en defaults.css ' + missing)
  const own = new Set([...css.matchAll(/(--_[\w-]+)\s*:/g)].map((m) => m[1]))
  const fromVue = ['--_depth', '--_x', '--_y', '--_max']
  ok([...own].every((v) => v.startsWith('--_bc-')), 'CSS: alias propio sin prefijo --_bc-: ' + [...own].filter((v) => !v.startsWith('--_bc-')))
  const strange = [...new Set(vars.filter((v) => v.startsWith('--_') && !own.has(v) && !fromVue.includes(v)))]
  ok(!strange.length, 'CSS: alias --_* que no son propios ni datos del .vue: ' + strange)
  ok(fromVue.every((v) => vars.includes(v)), 'CSS: no lee --_depth, --_x, --_y y --_max del .vue')
  const px = [...css.matchAll(/(-?\d*\.?\d+)px\b/g)].map((m) => m[0])
  ok(px.every((p) => ['24px', '44px', '1px', '-1px'].includes(p)), 'CSS: medidas literales no permitidas ' + px.filter((p) => !['24px', '44px', '1px', '-1px'].includes(p)))
  const onePx = css.split('\n').filter((l) => /\b-?1px\b/.test(l)).map((l) => l.trim())
  ok(onePx.every((l) => /^(inline-size|block-size|margin): -?1px;$/.test(l)), 'CSS: 1px fuera del texto oculto: ' + onePx)
  const ch = [...css.matchAll(/(\d*\.?\d+)ch\b/g)].map((m) => m[0])
  ok(ch.length >= 3 && ch.every((c) => ['20ch', '3ch', '8ch'].includes(c)), 'CSS: ch fuera de 20ch, 3ch y 8ch (#501): ' + ch)
  const deg = [...css.matchAll(/(\d*\.?\d+)deg\b/g)].map((m) => m[0])
  ok(deg.every((d) => ['90deg', '180deg'].includes(d)), 'CSS: giros fuera de 90° y 180° (#500): ' + deg)
  const ks = [...css.matchAll(/--_bc-k:\s*(\d+)/g)].map((m) => m[1])
  ok(['100000', '30', '1', '0'].every((k) => ks.includes(k)) && ks.every((k) => ['100000', '30', '1', '0'].includes(k)), 'CSS: pesos de flex-shrink distintos de 100000 · 30 · 1 · 0: ' + ks)
  const mult = [...css.matchAll(/var\(--g-space-1\)\s*\*\s*\(?(-?[\d.]+)/g)].map((m) => m[1])
  const allowedMult = ['0.5', '1', '1.5', '2', '-1', '-2', '-3', '4', '6', '7', '8', '48', '56', '80', '90']
  ok(mult.every((n) => allowedMult.includes(n)), 'CSS: múltiplo de --g-space-1 no registrado en estilo.md: ' + mult.filter((n) => !allowedMult.includes(n)))
  const kf = [...css.matchAll(/@keyframes\s+([\w-]+)/g)].map((m) => m[1])
  ok(['g-breadcrumbs-enter', 'g-breadcrumbs-enter-fade', 'g-breadcrumbs-leave', 'g-breadcrumbs-stair'].every((k) => kf.includes(k)) && kf.every((k) => /^g-breadcrumbs-(enter|leave|stair)/.test(k)), 'CSS: keyframes ' + kf)
  ok(!/ease-bounce/.test(css), 'CSS: usa --g-ease-bounce')
  ok(!/cubic-bezier|steps\(|\blinear\b(?!\()/.test(css.replace(/@supports \(transition-timing-function: linear\(0, 1\)\)/g, '')), 'CSS: curva propia (cubic-bezier, steps o linear)')
  ok(!/>\s*\*/.test(css.replace(/\{[^}]*\}/g, '{}')), 'CSS: selector de hijos por estructura (#383)')
  let ctx = [], pending = ''
  const anim = [], hov = [], spring = [], panelDisplay = []
  for (const t of css.split(/([{}])/)) {
    if (t === '{') { ctx.push(pending.trim()); pending = '' }
    else if (t === '}') { ctx.pop(); pending = '' }
    else {
      pending += t
      const inKf = ctx.some((c) => /@keyframes/.test(c))
      if (/(^|;|\s)animation(-name)?\s*:/.test(t) && !inKf) anim.push(ctx.join(' » '))
      if (ctx.length && /:hover/.test(ctx[ctx.length - 1]) && /:/.test(t)) hov.push(ctx.join(' » '))
      if (/ease-spring/.test(t)) spring.push(ctx.join(' » '))
      if (ctx.length && /(^|;|\s)display\s*:/.test(t)) for (const sel of ctx[ctx.length - 1].split(',').map((x) => x.trim())) if (/__(panel|stairs)(:[\w-]+)*$/.test(sel)) panelDisplay.push(sel)
    }
  }
  ok(anim.length >= 4 && anim.every((c) => /@media \(prefers-reduced-motion: (no-preference|reduce)\)/.test(c)), 'CSS: animación fuera de prefers-reduced-motion: ' + anim.filter((c) => !/prefers-reduced-motion/.test(c)))
  ok(hov.length >= 5 && hov.every((c) => /@media \(hover: hover\)/.test(c)), 'CSS: :hover fuera de @media (hover: hover)')
  ok(spring.length === 1 && /no-preference\) » @supports \(transition-timing-function: linear\(0, 1\)\) » .*is-entering/.test(spring[0]), 'CSS: --g-ease-spring fuera del nivel que llega o sin @supports: ' + spring)
  ok(panelDisplay.every((s) => /:popover-open/.test(s)), 'CSS: display de un panel fuera de :popover-open: ' + panelDisplay)
  ok(/@media \(forced-colors: active\)/.test(css) && /@media \(pointer: coarse\)/.test(css), 'CSS: sin forced-colors o sin puntero grueso')
  ok(/:has\(> \.g-breadcrumbs__link:focus-visible\)/.test(css), 'CSS: despliegue por :has(> .g-breadcrumbs__link:focus-visible)')
  ok(/:not\(\.is-ready\) > \.g-breadcrumbs__list \{ overflow-x: clip; \}/.test(css), 'CSS: sin recorte de la fila hasta is-ready')
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
    if (base[3] < 1) base = [255, 255, 255, 1]
    for (let i = layers.length - 1; i >= 0; i--) base = over(layers[i], base)
    return base
  }
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]) }
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return +((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)).toFixed(2) }
  const tok = (n) => { const i = document.createElement('i'); i.style.color = 'var(' + n + ')'; document.querySelector('.host').append(i); const c = parse(getComputedStyle(i).color); i.remove(); return c }
  const px = (expr) => { const i = document.createElement('i'); i.style.inlineSize = expr; i.style.position = 'absolute'; document.querySelector('.g-breadcrumbs').append(i); const v = i.getBoundingClientRect().width; i.remove(); return v }
  const nav = (id) => document.getElementById(id)
  const C = (id) => window.__bc.get(id)
  const R = (el) => el.getBoundingClientRect()
  const dur = (n) => { const i = document.createElement('i'); i.style.transitionDuration = 'var(' + n + ')'; document.body.append(i); const v = parseFloat(getComputedStyle(i).transitionDuration) * 1000; i.remove(); return v }
  return { parse, over, bgOf, ratio, tok, px, nav, C, R, dur }
})()`

async function load(page, qs = '') {
  await page.goto(BASE + qs)
  await page.waitForSelector('html[data-ready="1"]')
  await page.evaluate(LIB)
}
const raf2 = (page) => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))

// Contraste de todas las piezas en el tema cargado
const contrast = async (page) => page.evaluate(async () => {
  const { parse, over, bgOf, ratio, tok, nav, C } = window.__lib
  const out = []
  const add = (k, fg, bg, min) => out.push({ k, r: ratio(over(fg, bg), bg), min })
  const col = (el) => parse(getComputedStyle(el).color)
  const wait = () => new Promise((r) => setTimeout(r, 450))
  for (const id of ['door', 'chip', 'bg720', 'p1100']) {
    const n = nav(id)
    for (const li of n.querySelectorAll('.g-breadcrumbs__list > .g-breadcrumbs__item')) {
      const a = li.querySelector('.g-breadcrumbs__link')
      const kind = li.classList.contains('is-current') ? 'actual' : li.hasAttribute('data-clipped') ? 'pastilla' : a.classList.contains('g-breadcrumbs__link--text') ? 'sin página' : 'nivel'
      add(`${id} ${kind}`, col(a), bgOf(a), 4.5)
      const sep = li.querySelector('.g-breadcrumbs__sep')
      if (sep) add(`${id} separador`, col(sep), bgOf(li), 3)
      const d = li.querySelector('.g-breadcrumbs__door')
      if (d) {
        add(`${id} puerta reposo: chevron/hueco`, col(d), bgOf(d), 3)
        add(`${id} puerta reposo: chevron/superficie`, col(d), bgOf(li), 3)
        out.push({ k: `${id} puerta reposo: hueco/superficie (no exigido)`, r: ratio(bgOf(d), bgOf(li)), min: 0 })
        add(`${id} puerta al pasar: marco/superficie`, tok('--g-color-border-control'), bgOf(li), 3)
        add(`${id} puerta al pasar: chevron/hueco`, tok('--g-color-text'), bgOf(d), 4.5)
      }
      add(`${id} foco/fondo`, tok('--g-color-focus'), bgOf(li), 3)
    }
  }
  // Al pasar por un nivel: text sobre el fondo
  add('nivel al pasar', tok('--g-color-text'), bgOf(nav('door')), 4.5)
  // Puerta abierta + su panel
  const c = C('door-open')
  const d = [...c.nav.querySelectorAll('.g-breadcrumbs__door')][2]
  d.click()
  await wait()
  add('puerta abierta: chevron/acento', col(d), bgOf(d), 4.5)
  const p = document.getElementById(d.getAttribute('aria-controls'))
  for (const a of p.querySelectorAll('.g-breadcrumbs__link')) add(`panel ${a.getAttribute('aria-current') ? 'de la ruta' : a.matches('.g-breadcrumbs__link--text') ? 'sin página' : 'enlace'}`, col(a), bgOf(a), 4.5)
  const here = p.querySelector('.g-breadcrumbs__here')
  add('panel check', col(here), bgOf(here), 3)
  add('panel al pasar', tok('--g-color-text'), over(tok('--g-color-neutral-soft'), bgOf(p)), 4.5)
  add('panel foco', tok('--g-color-focus'), bgOf(p), 3)
  c.close()
  // Puerta en el panel de inicio (con un hijo sin página)
  const d0 = C('door').nav.querySelector('.g-breadcrumbs__door')
  d0.click(); await wait()
  const p0 = document.getElementById(d0.getAttribute('aria-controls'))
  for (const a of p0.querySelectorAll('.g-breadcrumbs__link--text')) add('panel sin página', col(a), bgOf(a), 4.5)
  C('door').close()
  // Cara de B y escalera
  const f = C('face260')
  const up = f.nav.querySelector('.g-breadcrumbs__up'), tg = f.nav.querySelector('.g-breadcrumbs__toggle')
  add('subir', col(up), bgOf(up), 4.5)
  add('subir al pasar', tok('--g-color-on-neutral'), over(tok('--g-color-neutral-strong'), bgOf(f.nav)), 4.5)
  add('divulgación', col(tg), bgOf(tg), 4.5)
  add('divulgación al pasar: marco', tok('--g-color-on-accent-soft'), bgOf(tg), 3)
  tg.click(); await wait()
  const st = f.nav.querySelector('.g-breadcrumbs__stairs')
  for (const a of st.querySelectorAll('.g-breadcrumbs__link')) add(`escalera ${a.getAttribute('aria-current') ? 'actual' : a.matches('.g-breadcrumbs__link--text') ? 'sin página' : 'nivel'}`, col(a), bgOf(a), 4.5)
  const cur = st.querySelector('.is-current .g-breadcrumbs__link')
  add('escalera barra del actual', parse(getComputedStyle(cur).borderInlineStartColor), bgOf(st), 3)
  const g = st.querySelector('.g-breadcrumbs__stair + .g-breadcrumbs__stair')
  out.push({ k: 'escalera guía (estructura, no exigido)', r: ratio(over(parse(getComputedStyle(g, '::before').borderInlineStartColor), bgOf(st)), bgOf(st)), min: 0 })
  f.close()
  return out
})

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
  const mins = {}
  for (const [name, t] of themes) {
    for (const dark of [false, true]) {
      const qs = '?' + [t, dark ? 'dark=1' : ''].filter(Boolean).join('&')
      await load(page, qs)
      const rows = await contrast(page)
      const tag = `${name}${dark ? ' oscuro' : ' claro'}`
      for (const r of rows) {
        const key = r.k.replace(/^(door|chip|bg720|p1100) /, '')
        if (r.min) ok(r.r >= r.min, E(`${tag}: ${r.k} ${r.r} < ${r.min}`))
        mins[key] = Math.min(mins[key] ?? 99, r.r)
        if (name === 'por defecto' || name === 'propio') (mins['@' + tag] ||= {})[key] = Math.min(mins['@' + tag]?.[key] ?? 99, r.r)
      }
    }
  }
  if (engine === ENGINES[0]) notes.push('Contraste (mínimo en ' + themes.length * 2 + ' temas): ' + JSON.stringify(Object.fromEntries(Object.entries(mins).filter(([k]) => !k.startsWith('@')))))
  if (engine === ENGINES[0]) for (const k of Object.keys(mins).filter((k) => k.startsWith('@'))) notes.push(k + ': ' + JSON.stringify(mins[k]))

  /* ---------- 2 · Geometría, etapas y estados (por defecto claro, oscuro y propio) ---------- */
  for (const qs of ['', '?dark=1', '?theme=propio']) {
    await load(page, qs)
    await page.waitForTimeout(300)
    const T = (m) => E(`${qs || 'por defecto'}: ${m}`)
    const g = await page.evaluate(() => {
      const { nav, R, px, parse, tok } = window.__lib
      const o = {}
      for (const id of ['p1100', 'p720', 'p560', 'p480', 'p400', 'p320', 'p260', 'p240', 'd1100', 'd720', 'd560', 'd400', 'd320', 'rtl720', 'rtl320', 'rtl260', 'long', 'one', 'one-narrow', 'two', 'bg720', 'face-noup']) {
        const n = nav(id), r = R(n)
        const pieces = [...n.querySelectorAll('.g-breadcrumbs__list > .g-breadcrumbs__item, .g-breadcrumbs__face > *')]
        const out = pieces.filter((x) => { const q = R(x); return q.left < r.left - 0.5 || q.right > r.right + 0.5 })
        const root = n.querySelector('.g-breadcrumbs__item.is-root')
        const rl = root && root.querySelector('.g-breadcrumbs__label')
        const targets = [...n.querySelectorAll('.g-breadcrumbs__list a, .g-breadcrumbs__list button, .g-breadcrumbs__face a, .g-breadcrumbs__face button')].filter((x) => !x.closest('[popover]')).map((x) => R(x)).map((q) => Math.min(q.width, q.height))
        o[id] = { stage: n.dataset.stage, n: n.querySelectorAll('.g-breadcrumbs__list > .g-breadcrumbs__item').length, tab: [...n.querySelectorAll('.g-breadcrumbs__list a[href], .g-breadcrumbs__list button, .g-breadcrumbs__face a, .g-breadcrumbs__face button')].filter((x) => !x.closest('[popover]')).length, out: out.length, h: r.height, rootHalf: !!(rl && !root.classList.contains('is-icon') && rl.scrollWidth > rl.clientWidth + 1), minTarget: Math.min(...targets), ready: n.classList.contains('is-ready'), overflowX: getComputedStyle(n.querySelector('.g-breadcrumbs__list, .g-breadcrumbs__face')).overflowX }
      }
      o.forced = ['f-liquid', 'f-root-icon', 'f-shrink', 'f-step'].map((id) => R(nav(id)).height)
      o.hExpect = px('max(24px, calc(var(--g-space-1) * 7), var(--g-text-body-sm-line))')
      // Pastillas: fondo solo si recorta; actual de acento
      const chip = ['chip', 'p560', 'p720', 'd1100'].map(nav).find((n) => n.querySelector('.g-breadcrumbs__item[data-clipped]:not(.is-current)'))
      o.chips = [...chip.querySelectorAll('.g-breadcrumbs__list > .g-breadcrumbs__item')].map((li) => ({ clipped: li.hasAttribute('data-clipped'), cur: li.classList.contains('is-current'), icon: li.classList.contains('is-icon'), bg: getComputedStyle(li.querySelector('.g-breadcrumbs__link')).backgroundColor }))
      o.full = [...nav('p1100').querySelectorAll('.g-breadcrumbs__list > .g-breadcrumbs__item:not(.is-current)')].map((li) => getComputedStyle(li.querySelector('.g-breadcrumbs__link')).backgroundColor)
      o.tok = { ns: getComputedStyle(document.querySelector('.host')).getPropertyValue('--g-color-neutral-soft'), as: getComputedStyle(document.querySelector('.host')).getPropertyValue('--g-color-accent-soft') }
      const sw = (c) => { const i = document.createElement('i'); i.style.background = c; document.body.append(i); const v = getComputedStyle(i).backgroundColor; i.remove(); return v }
      o.nsBg = sw('var(--g-color-neutral-soft)'); o.asBg = sw('var(--g-color-accent-soft)')
      // Mínimo de una pastilla en medio a 560: ≥ 3ch de nombre a la vista
      const p560 = nav('p560')
      o.mid560 = [...p560.querySelectorAll('.is-mid, .is-parent')].map((li) => { const l = li.querySelector('.g-breadcrumbs__label'); const ch = px('3ch'); return l.clientWidth + 0.5 >= Math.min(ch, l.scrollWidth) - 1 })
      // Puerta frente al separador, en reposo
      const dn = nav('door'), door = dn.querySelector('.g-breadcrumbs__door'), sep = dn.querySelector('.g-breadcrumbs__sep')
      const ds = getComputedStyle(door), ss = getComputedStyle(sep)
      o.door = { bg: ds.backgroundColor, sepBg: ss.backgroundColor, color: ds.color, sepColor: ss.color, cursor: ds.cursor, sepCursor: ss.cursor, w: R(door).width, h: R(door).height, radius: ds.borderTopLeftRadius, muted: sw('var(--g-color-text-muted)'), subtle: sw('var(--g-color-text-subtle)') }
      // RTL: chevrons espejados y raíz a la derecha
      const rn = nav('rtl720')
      const rsep = rn.querySelector('.g-breadcrumbs__sep'), rdoor = rn.querySelector('.g-breadcrumbs__door .g-icon')
      const rr = R(rn.querySelector('.is-root')), rc = R(rn.querySelector('.is-current'))
      o.rtl = { sepScale: getComputedStyle(rsep).scale, doorScale: getComputedStyle(rdoor).scale, rootRight: rr.right > rc.right, ltrSepScale: getComputedStyle(nav('door').querySelector('.g-breadcrumbs__sep')).scale }
      return o
    })
    const H = g.hExpect
    for (const [id, v] of Object.entries(g)) {
      if (!v || typeof v !== 'object' || !('stage' in v)) continue
      ok(v.ready, T(`${id}: sin is-ready`))
      ok(v.out === 0, T(`${id}: ${v.out} piezas fuera del nav (${v.stage})`))
      ok(!v.rootHalf, T(`${id}: la raíz quedó a medias`))
      ok(v.minTarget >= 24 - 0.01, T(`${id}: objetivo < 24px (${v.minTarget})`))
      ok(near(v.h, H, 0.5), T(`${id}: alto ${v.h} ≠ ${H} (Δ0, ${v.stage})`))
      ok(v.overflowX === 'visible', T(`${id}: con is-ready la fila recorta (${v.overflowX})`))
    }
    for (const id of qs.includes('propio') ? ['p1100', 'p720'] : ['p1100', 'p720', 'p560', 'p480']) ok(g[id].stage === 'liquid' && g[id].n === 6, T(`${id}: ${g[id].stage} con ${g[id].n} niveles (se espera liquid, 6)`))
    if (!qs.includes('propio')) {
      for (const id of ['p560', 'p400']) ok(g[id].stage !== 'step' && g[id].n === 6 && g[id].tab === 5, T(`${id}: seis de seis en la fila y 5 enlaces en el Tab (${g[id].stage}, ${g[id].n}, ${g[id].tab})`))
      ok(['root-icon', 'shrink'].includes(g.p400.stage), T(`p400: ${g.p400.stage} (se espera root-icon o shrink)`))
    }
    for (const id of ['p260', 'p240', 'rtl260']) ok(g[id].stage === 'step' && g[id].tab === 2, T(`${id}: ${g[id].stage}, ${g[id].tab} paradas (se espera step con 2)`))
    ok(g['face-noup'].stage !== 'step' || g['face-noup'].tab === 1, T('face-noup: «Subir» sin antepasado con página'))
    ok(g.one.n === 1 && g['one-narrow'].out === 0, T('un nivel: no desborda a 120px'))
    ok(g.long.out === 0, T('nombres largos: desbordan'))
    ok(g.forced.every((h) => near(h, g.forced[0], 0.5)) && near(g.forced[0], H, 0.5), T(`etapas forzadas: altos ${g.forced} (Δ0)`))
    ok(g.mid560.every(Boolean), T('p560: una pastilla en medio con menos de 3ch de nombre a la vista'))
    ok(g.chips.some((c) => c.clipped && !c.cur) && g.chips.every((c) => c.cur ? c.bg === g.asBg : c.clipped ? c.bg === g.nsBg : c.icon || c.bg === 'rgba(0, 0, 0, 0)'), T('pastillas: fondo neutral-soft solo si recorta, accent-soft el actual ' + JSON.stringify(g.chips)))
    ok(g.full.every((b) => b === 'rgba(0, 0, 0, 0)'), T('a 1100px un nombre entero no lleva fondo'))
    ok(g.door.bg === g.nsBg && g.door.sepBg === 'rgba(0, 0, 0, 0)', T('puerta en reposo: hueco neutral-soft y separador sin fondo ' + JSON.stringify(g.door)))
    ok(g.door.color !== g.door.sepColor && g.door.color === g.door.muted && g.door.sepColor === g.door.subtle, T('puerta en reposo: text-muted frente al text-subtle del separador'))
    ok(g.door.cursor === 'pointer' && g.door.sepCursor !== 'pointer', T('puerta: cursor pointer; separador, no'))
    ok(g.door.w >= 24 && g.door.h >= 24 && near(g.door.w, g.door.h), T(`puerta: ${g.door.w}×${g.door.h} (≥ 24, redonda)`))
    ok(g.rtl.sepScale === '-1 1' && g.rtl.doorScale === '-1 1' && g.rtl.rootRight && g.rtl.ltrSepScale === 'none', T('RTL: chevrons espejados y raíz a la derecha ' + JSON.stringify(g.rtl)))

    /* Puerta al pasar, abierta y su panel en la capa superior (cabecera con overflow: hidden) */
    if (!qs) {
      const door = page.locator('#door .g-breadcrumbs__door').nth(1)
      await door.scrollIntoViewIfNeeded()
      await door.hover()
      await page.waitForTimeout(300)
      const hv = await door.evaluate((d) => ({ sh: getComputedStyle(d).boxShadow, c: getComputedStyle(d).color }))
      const bc = await page.evaluate(() => { const i = document.createElement('i'); i.style.color = 'var(--g-color-border-control)'; document.body.append(i); const v = getComputedStyle(i).color; i.remove(); return v })
      ok(hv.sh.includes(bc) && hv.sh.includes('inset'), T('puerta al pasar: marco interior border-control ' + hv.sh))
      await page.mouse.move(0, 0)
      for (const id of ['door', 'rtl720', 'hdr']) {
        const r = await page.evaluate(async (id) => {
          const { C, R, nav } = window.__lib
          const c = C(id)
          const d = c.nav.querySelector('.g-breadcrumbs__door')
          d.scrollIntoView({ block: 'center' })
          await new Promise((r) => setTimeout(r, 50))
          d.click()
          await new Promise((r) => setTimeout(r, 450))
          const p = document.getElementById(d.getAttribute('aria-controls'))
          const pr = R(p), dr = R(d)
          const hit = document.elementFromPoint(pr.left + pr.width / 2, pr.top + Math.min(pr.height / 2, 20))
          const sw = (v) => { const i = document.createElement('i'); i.style.background = v; document.body.append(i); const x = getComputedStyle(i).backgroundColor; i.remove(); return x }
          const out = { open: p.matches(':popover-open'), top: !!(hit && p.contains(hit)), below: pr.top >= dr.bottom - 0.5, side: p.dataset.side, bg: getComputedStyle(d).backgroundColor, as: sw('var(--g-color-accent-soft)'), rot: getComputedStyle(d.querySelector('.g-icon')).rotate, w: pr.width, wMin: window.__lib.px('calc(var(--g-space-1) * 48)'), surf: getComputedStyle(p).backgroundColor === sw('var(--g-color-surface)'), links: [...p.querySelectorAll('.g-breadcrumbs__link')].map((a) => R(a).height) }
          c.close()
          await new Promise((r) => setTimeout(r, 300))
          out.closed = !p.matches(':popover-open') && getComputedStyle(d.querySelector('.g-icon')).rotate
          return out
        }, id)
        ok(r.open && r.top && r.below && r.side === 'bottom', T(`${id}: panel abierto en la capa superior, debajo de la puerta ` + JSON.stringify(r)))
        ok(r.bg === r.as, T(`${id}: puerta abierta sin accent-soft`))
        ok(r.rot === (id === 'rtl720' ? '-90deg' : '90deg'), T(`${id}: giro de la puerta abierta ${r.rot}`))
        ok(r.w >= r.wMin - 0.5 && r.surf, T(`${id}: panel ${r.w}px (≥ space × 48) sobre surface`))
        ok(r.links.every((h) => h >= 24), T(`${id}: enlaces del panel < 24px`))
        ok(r.closed === 'none' || r.closed === '0deg', T(`${id}: al cerrar, la puerta vuelve (${r.closed})`))
      }

      /* Escalera: sangría space × 4 por nivel hacia el inicio lógico, barra del actual, guías, retardos acotados */
      for (const id of ['face260', 'rtl260']) {
        const s = await page.evaluate(async (id) => {
          const { C, R, px, parse } = window.__lib
          const c = C(id)
          const t = c.nav.querySelector('.g-breadcrumbs__toggle')
          t.scrollIntoView({ block: 'center' })
          await new Promise((r) => setTimeout(r, 50))
          t.click()
          await new Promise((r) => setTimeout(r, 20))
          const st = c.nav.querySelector('.g-breadcrumbs__stairs')
          const lis = [...st.querySelectorAll('.g-breadcrumbs__stair')]
          const delays = lis.map((li) => { const a = li.getAnimations()[0]; return a ? { name: a.animationName, delay: a.effect.getTiming().delay, dur: a.effect.getTiming().duration } : null })
          await new Promise((r) => setTimeout(r, 500))
          const rtl = getComputedStyle(c.nav).direction === 'rtl'
          const xs = lis.map((li) => { const a = R(li.querySelector('.g-breadcrumbs__link')); return rtl ? a.right : a.left })
          const step = px('calc(var(--g-space-1) * 4)')
          const cur = st.querySelector('.is-current .g-breadcrumbs__link')
          const sw = (v) => { const i = document.createElement('i'); i.style.color = v; document.body.append(i); const x = getComputedStyle(i).color; i.remove(); return x }
          const out = { xs, step, delays, bar: getComputedStyle(cur).borderInlineStartColor === sw('var(--g-color-accent-text)'), weight: getComputedStyle(cur).fontWeight, base: getComputedStyle(st.querySelector('.g-breadcrumbs__link')).fontWeight, guides: lis.slice(1).every((li) => getComputedStyle(li, '::before').content !== 'none'), rot: getComputedStyle(t.querySelector('.g-breadcrumbs__chevron')).rotate, fast: window.__lib.dur('--g-duration-fast'), wrap: getComputedStyle(st.querySelector('.g-breadcrumbs__label')).whiteSpace }
          c.close()
          return out
        }, id)
        const d = s.xs.slice(1).map((x, i) => (id.startsWith('rtl') ? s.xs[i] - x : x - s.xs[i]))
        ok(d.every((v) => near(v, s.step, 1)), T(`${id}: sangría por nivel ${d} ≠ ${s.step}`))
        ok(s.bar && +s.weight > +s.base, T(`${id}: escalón actual sin barra accent-text o sin peso`))
        ok(s.guides, T(`${id}: faltan las guías en L`))
        ok(s.rot === '180deg', T(`${id}: chevron de la divulgación ${s.rot}`))
        ok(s.wrap === 'normal', T(`${id}: los nombres de la escalera no se parten`))
        const want = (i) => (s.fast * Math.min(i, 4)) / 4
        ok(s.delays.every((x, i) => x && x.name === 'g-breadcrumbs-stair' && near(x.delay, want(i), 1)), T(`${id}: retardos de la escalera ${JSON.stringify(s.delays)}`))
      }

      /* Despliegue por teclado: la miga recortada se ve entera, sin animar el tamaño, con el anillo visible */
      const u = await page.evaluate(() => { const n = window.__lib.nav('p560'); n.scrollIntoView({ block: 'center' }); return [...n.querySelectorAll('.g-breadcrumbs__item.is-mid')].findIndex((li) => li.hasAttribute('data-clipped')) })
      ok(u >= 0, T('p560: ninguna miga recortada para desplegar'))
      await page.keyboard.press('Shift')
      await page.evaluate((u) => { const li = window.__lib.nav('p560').querySelectorAll('.g-breadcrumbs__item.is-mid')[u]; li.querySelector('a').focus() }, u)
      await raf2(page)
      const uf = await page.evaluate((u) => {
        const { nav, R } = window.__lib
        const n = nav('p560'), li = n.querySelectorAll('.g-breadcrumbs__item.is-mid')[u], a = li.querySelector('a'), l = li.querySelector('.g-breadcrumbs__label')
        const r = R(n)
        const others = [...n.querySelectorAll('.g-breadcrumbs__list > .g-breadcrumbs__item.is-mid')].filter((x) => x !== li)
        return { fv: a.matches(':focus-visible'), whole: l.scrollWidth <= l.clientWidth + 1 || (l.clientWidth >= l.scrollWidth * 0.9 && others.every((x) => Math.abs(R(x).width - parseFloat(getComputedStyle(x).minWidth)) < 0.5)), seen: l.clientWidth + '/' + l.scrollWidth, anims: n.getAnimations({ subtree: true }).filter((x) => !(x instanceof CSSTransition) || /width|flex|inline-size|max-inline-size/.test(x.transitionProperty)).length, outline: getComputedStyle(a).outlineStyle, ow: parseFloat(getComputedStyle(a).outlineWidth), out: [...n.querySelectorAll('.g-breadcrumbs__item')].filter((x) => R(x).right > r.right + 0.5 || R(x).left < r.left - 0.5).length, z: getComputedStyle(li).zIndex, clipList: getComputedStyle(n.querySelector('.g-breadcrumbs__list')).overflowX }
      }, u)
      ok(uf.fv && uf.whole, T('despliegue por foco: el nombre no se ve entero ' + JSON.stringify(uf)))
      if (!qs && engine === ENGINES[0]) notes.push('Despliegue por foco a 560px: «Laboratorio central» ' + uf.seen + 'px a la vista (peso 1 frente al 30 del padre)')
      ok(uf.anims === 0, T('despliegue por foco: anima el tamaño'))
      ok(uf.outline === 'solid' && uf.ow >= 2 && uf.clipList === 'visible' && uf.z === '2', T('despliegue por foco: anillo no visible o tapable ' + JSON.stringify(uf)))
      ok(uf.out === 0, T('despliegue por foco: desborda el nav'))
      await page.evaluate(() => document.activeElement.blur())

      /* Bajar y subir (SPA) */
      const mv = await page.evaluate(async () => {
        const { C, R } = window.__lib
        const c = C('spa')
        c.nav.scrollIntoView({ block: 'center' })
        const before = c.nav.getAnimations({ subtree: true }).filter((a) => !(a instanceof CSSTransition)).length
        c.push({ label: 'Lote 2026-0412', href: '#lote-0412' })
        const li = [...c.nav.querySelectorAll('.g-breadcrumbs__list > .g-breadcrumbs__item')].pop()
        const an = li.getAnimations().filter((a) => a.animationName)
        const enter = an.find((a) => a.animationName === 'g-breadcrumbs-enter')
        const fade = an.find((a) => a.animationName === 'g-breadcrumbs-enter-fade')
        const o = { before, entering: li.classList.contains('is-entering'), current: li.querySelector('[aria-current="page"]') !== null, names: an.map((a) => a.animationName), dE: enter && enter.effect.getTiming().duration, dF: fade && fade.effect.getTiming().duration, ease: enter && getComputedStyle(li).animationTimingFunction, z: getComputedStyle(li).zIndex }
        if (enter) { enter.pause(); enter.currentTime = 0; o.x0 = getComputedStyle(li).translate; enter.currentTime = enter.effect.getTiming().duration * 0.4; o.xMid = getComputedStyle(li).translate; enter.play() }
        await new Promise((r) => setTimeout(r, 600))
        o.after = li.classList.contains('is-entering')
        o.settled = getComputedStyle(li).translate
        // Subir: la copia saliente no ocupa sitio, recorta la fila y se recoge hacia el anterior
        const nBefore = c.nav.querySelectorAll('.g-breadcrumbs__list > .g-breadcrumbs__item').length
        c.pop()
        const copy = c.nav.querySelector('.g-breadcrumbs__item.is-leaving')
        o.copy = !!copy
        if (copy) {
          const a = copy.getAnimations().find((x) => x.animationName === 'g-breadcrumbs-leave')
          o.leave = a && a.effect.getTiming().duration
          o.copyW = R(copy).width
          o.copyInert = copy.inert && copy.getAttribute('aria-hidden') === 'true' && !copy.querySelector('[id]')
          o.listClip = getComputedStyle(copy.parentElement).overflowX
          o.copyPe = getComputedStyle(copy).pointerEvents
        }
        await new Promise((r) => setTimeout(r, 700))
        o.gone = !c.nav.querySelector('.is-leaving')
        o.nAfter = c.nav.querySelectorAll('.g-breadcrumbs__list > .g-breadcrumbs__item').length
        o.nBefore = nBefore
        o.press = window.__lib.dur('--g-duration-press')
        o.slow = window.__lib.dur('--g-duration-slow')
        o.space = window.__lib.px('var(--g-space-1)')
        return o
      })
      ok(mv.before === 0, T('al cargar hay animaciones en la fila (nada al montar)'))
      ok(mv.entering && mv.current && mv.names.includes('g-breadcrumbs-enter') && mv.names.includes('g-breadcrumbs-enter-fade'), T('bajar: sin las dos animaciones de entrada ' + JSON.stringify(mv)))
      ok(near(mv.dE, mv.slow, 1) && near(mv.dF, mv.press, 1), T(`bajar: duraciones ${mv.dE}/${mv.dF} (slow/press ${mv.slow}/${mv.press})`))
      ok(/linear\(/.test(mv.ease || ''), T(`bajar: el translate sin --g-ease-spring (${mv.ease})`))
      ok(mv.x0 === `${-3 * mv.space}px` || mv.x0 === `${-3 * mv.space}px 0px`, T(`bajar: parte de ${mv.x0} (se espera −space × 3)`))
      ok(mv.xMid !== mv.x0 && mv.xMid !== 'none', T(`bajar: sin posición intermedia (${mv.xMid})`))
      ok(mv.z === '0', T('bajar: el que llega no va detrás del anterior'))
      ok(mv.settled === 'none' || /^0px/.test(mv.settled), T(`bajar: no termina en su sitio (${mv.settled})`))
      ok(mv.copy && near(mv.leave, mv.press, 1) && mv.copyW === 0 && mv.copyInert && mv.listClip === 'clip' && mv.copyPe === 'none', T('subir: copia saliente ' + JSON.stringify(mv)))
      ok(mv.gone && mv.nAfter === mv.nBefore - 1, T('subir: la copia no se retira'))

      /* Cambio de etapa: nunca se anima */
      const sc = await page.evaluate(async () => {
        const { nav } = window.__lib
        const n = nav('p720')
        n.parentElement.parentElement.style.inlineSize = '300px'
        await new Promise((r) => setTimeout(r, 120))
        const s1 = n.dataset.stage
        const a = n.getAnimations({ subtree: true }).filter((x) => !(x instanceof CSSTransition) || !/color|background|box-shadow|opacity/.test(x.transitionProperty)).length
        n.parentElement.parentElement.style.inlineSize = '720px'
        await new Promise((r) => setTimeout(r, 120))
        return { s1, s2: n.dataset.stage, a, b: n.getAnimations({ subtree: true }).filter((x) => !(x instanceof CSSTransition) || !/color|background|box-shadow|opacity/.test(x.transitionProperty)).length }
      })
      ok(sc.s1 === 'step' && sc.s2 === 'liquid' && sc.a === 0 && sc.b === 0, T('cambio de etapa animado o no cambia ' + JSON.stringify(sc)))

      /* Antes de is-ready, la fila recorta en línea */
      const pre = await page.evaluate(() => { const n = window.__lib.nav('p1100'); n.classList.remove('is-ready'); const v = getComputedStyle(n.querySelector('.g-breadcrumbs__list')).overflowX; const t = getComputedStyle(n.querySelector('.g-breadcrumbs__link')).transitionDuration; n.classList.add('is-ready'); return { v, t } })
      ok(pre.v === 'clip' && /^0s/.test(pre.t), T('sin is-ready: la fila no recorta o hay transiciones ' + JSON.stringify(pre)))
    }
  }

  /* ---------- 3 · Movimiento reducido ---------- */
  {
    const c2 = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' })
    const p2 = await c2.newPage()
    await load(p2, '')
    const r = await p2.evaluate(async () => {
      const { C } = window.__lib
      const c = C('spa')
      c.push({ label: 'Lote 2026-0412', href: '#lote-0412' })
      const li = [...c.nav.querySelectorAll('.g-breadcrumbs__list > .g-breadcrumbs__item')].pop()
      const an = li.getAnimations().filter((a) => a.animationName)
      const o = { names: an.map((a) => a.animationName), dur: an[0] && an[0].effect.getTiming().duration, fast: window.__lib.dur('--g-duration-fast') }
      await new Promise((r) => setTimeout(r, 400))
      c.pop()
      o.copy = !!c.nav.querySelector('.is-leaving')
      const f = C('face260')
      f.nav.querySelector('.g-breadcrumbs__toggle').click()
      await new Promise((r) => setTimeout(r, 30))
      o.stairs = [...f.nav.querySelectorAll('.g-breadcrumbs__stair')].flatMap((li) => li.getAnimations()).length
      o.chev = getComputedStyle(f.nav.querySelector('.g-breadcrumbs__chevron')).transitionProperty
      f.close()
      const d = C('door').nav.querySelector('.g-breadcrumbs__door')
      d.click()
      await new Promise((r) => setTimeout(r, 30))
      o.doorRot = getComputedStyle(d.querySelector('.g-icon')).transitionProperty
      o.doorAnims = d.querySelector('.g-icon').getAnimations().length
      const p = document.getElementById(d.getAttribute('aria-controls'))
      o.panelT = p.getAnimations().map((a) => a.transitionProperty)
      C('door').close()
      return o
    })
    ok(r.names.length === 1 && r.names[0] === 'g-breadcrumbs-enter-fade' && near(r.dur, r.fast, 1), E('reducido: el que llega se desplaza o no funde en fast ' + JSON.stringify(r)))
    ok(!r.copy, E('reducido: hay copia saliente'))
    ok(r.stairs === 0, E('reducido: la escalera se anima'))
    ok(!/rotate/.test(r.chev) && !/rotate/.test(r.doorRot) && r.doorAnims === 0, E('reducido: los chevrons giran con transición'))
    ok(r.panelT.every((t) => !/translate/.test(t)), E('reducido: el panel se desplaza ' + r.panelT))
    await c2.close()
  }

  /* ---------- 4 · Puntero grueso (390px) y Δ0 ---------- */
  {
    const opts = engine === 'chromium' ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } : { viewport: { width: 390, height: 844 }, hasTouch: true }
    const c3 = await browser.newContext(opts)
    const p3 = await c3.newPage()
    await load(p3, '')
    await p3.evaluate(async () => { document.getElementById('s10').remove(); await new Promise((r) => setTimeout(r, 200)) })
    const coarse = await p3.evaluate(() => matchMedia('(pointer: coarse)').matches)
    if (!coarse) notes.push(`[${engine}] pointer: coarse no se emula; táctil sin medir`)
    else {
      const t = await p3.evaluate(async () => {
        const { nav, R } = window.__lib
        const o = { small: [], h: {}, out: 0 }
        for (const n of document.querySelectorAll('.g-breadcrumbs')) {
          for (const x of [...n.querySelectorAll('.g-breadcrumbs__list a, .g-breadcrumbs__list button, .g-breadcrumbs__face a, .g-breadcrumbs__face button')].filter((x) => !x.closest('[popover]'))) { const q = R(x); if (q.width < 44 - 0.01 || q.height < 44 - 0.01) o.small.push(n.id + ' ' + x.className + ' ' + q.width + '×' + q.height) }
          o.h[n.id] = R(n).height
          const r = R(n)
          o.out += [...n.querySelectorAll('.g-breadcrumbs__list > .g-breadcrumbs__item, .g-breadcrumbs__face > *')].filter((x) => R(x).right > r.right + 0.5 || R(x).left < r.left - 0.5).length
        }
        const f = window.__lib.C('face260')
        f.nav.querySelector('.g-breadcrumbs__toggle').click()
        await new Promise((r) => setTimeout(r, 450))
        o.stairs = [...f.nav.querySelectorAll('.g-breadcrumbs__stair .g-breadcrumbs__link')].map((a) => R(a).height)
        f.close()
        o.page = document.documentElement.scrollWidth <= innerWidth + 1
        return o
      })
      ok(!t.small.length, E('táctil: objetivos < 44: ' + t.small.slice(0, 6)))
      const hs = Object.entries(t.h).filter(([k]) => k !== 'hdr')
      ok(hs.every(([, h]) => near(h, 44, 0.5)), E('táctil: alto ≠ 44 (Δ0): ' + JSON.stringify(hs.filter(([, h]) => !near(h, 44, 0.5)))))
      ok(t.out === 0, E('táctil: piezas fuera del nav'))
      ok(t.stairs.every((h) => h >= 44 - 0.01), E('táctil: escalones < 44'))
      ok(t.page, E('táctil: la página desborda a 390px'))
    }
    await c3.close()
  }

  /* ---------- 5 · Zoom 200 % y 400 % (visor de 640 y 320px CSS) ---------- */
  for (const w of [640, 320]) {
    const c4 = await browser.newContext({ viewport: { width: w, height: 800 } })
    const p4 = await c4.newPage()
    await load(p4, '')
    await p4.evaluate(async () => { document.getElementById('s10').remove(); await new Promise((r) => setTimeout(r, 200)) })
    const z = await p4.evaluate(() => {
      const { R } = window.__lib
      let out = 0
      for (const n of document.querySelectorAll('.g-breadcrumbs')) { const r = R(n); out += [...n.querySelectorAll('.g-breadcrumbs__list > .g-breadcrumbs__item, .g-breadcrumbs__face > *')].filter((x) => R(x).right > r.right + 0.5 || R(x).left < r.left - 0.5).length }
      return { out, page: document.documentElement.scrollWidth <= innerWidth + 1, p1100: window.__lib.nav('p1100').dataset.stage }
    })
    ok(z.out === 0 && z.page, E(`zoom (${w}px): ${z.out} piezas fuera, página ${z.page ? 'sin' : 'con'} desborde`))
    if (w === 320) ok(z.p1100 === 'step', E(`zoom 400 %: la ruta de 1100 no pasa a step (${z.p1100})`))
    await c4.close()
  }

  /* ---------- 6 · forced-colors (Chromium) ---------- */
  if (engine === 'chromium') {
    const c5 = await browser.newContext({ viewport: { width: 1280, height: 900 }, forcedColors: 'active' })
    const p5 = await c5.newPage()
    await load(p5, '')
    const fc = await p5.evaluate(async () => {
      const { C } = window.__lib
      const n = C('door').nav
      const lab = n.querySelector('.is-current > .g-breadcrumbs__link .g-breadcrumbs__label')
      const d = n.querySelector('.g-breadcrumbs__door')
      const f = C('face260').nav
      const b = (el) => { const s = getComputedStyle(el); return s.borderTopStyle === 'solid' && parseFloat(s.borderTopWidth) >= 1 }
      const o = { cur: getComputedStyle(lab).textDecorationLine, door: b(d), up: b(f.querySelector('.g-breadcrumbs__up')), tg: b(f.querySelector('.g-breadcrumbs__toggle')), tgU: getComputedStyle(f.querySelector('.g-breadcrumbs__toggle .g-breadcrumbs__label')).textDecorationLine }
      d.click(); await new Promise((r) => setTimeout(r, 400))
      o.open = getComputedStyle(d).backgroundColor !== getComputedStyle(d.parentElement).backgroundColor
      const p = document.getElementById(d.getAttribute('aria-controls'))
      o.panel = b(p)
      C('door').close()
      f.querySelector('.g-breadcrumbs__toggle').click(); await new Promise((r) => setTimeout(r, 400))
      o.stairCur = getComputedStyle(f.querySelector('.g-breadcrumbs__stair.is-current .g-breadcrumbs__label')).textDecorationLine
      C('face260').close()
      return o
    })
    ok(fc.cur === 'underline' && fc.tgU === 'underline' && fc.stairCur === 'underline', E('forced-colors: el actual sin subrayar ' + JSON.stringify(fc)))
    ok(fc.door && fc.up && fc.tg, E('forced-colors: puerta, «Subir» o divulgación sin borde ' + JSON.stringify(fc)))
    ok(fc.open && fc.panel, E('forced-colors: puerta abierta indistinta o panel sin borde'))
    await c5.close()
  } else notes.push(`[${engine}] forced-colors sin medir (Playwright solo lo emula en Chromium)`)

  const own = errors.filter((e) => !/favicon/.test(e))
  ok(!own.length, E('consola: ' + own.slice(0, 3)))
  await browser.close()
}

server.close()
for (const n of notes) console.log('· ' + n)
if (failed) for (const f of fails.slice(0, args.verbose ? 400 : 40)) console.log('✗ ' + f)
console.log(`${total - failed}/${total} comprobaciones pasan`)
process.exit(failed ? 1 : 0)
