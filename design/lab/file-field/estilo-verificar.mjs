// Verificación de coco sobre el banco de GFileField (design/lab/file-field/estilo-banco.html), con el CSS real cargado en
// la capa grana.components y los vecinos reales de dist/ (GInput, GSummary, GBtn, GIcon, GForm, GFormLayout, GFormRow).
// Mide: análisis estático del CSS (sin literales, sin respaldos, sin @layer, solo --g-form-min como --g-*, keyframes
// g-file-field-land… y g-reject-file-field, sin muelle ni rebote, movimiento solo con no-preference, hover en (hover:
// hover)); Δ0 de top y alto de la caja vacía frente a GInput en una GFormRow (5 tamaños × 3 densidades) y la caja con un
// archivo; Δ0 de la ficha entre ready, queued, uploading, done, error y guardado (cinco tamaños), objetivos ≥ 24px y
// ≥ 44px con puntero grueso; contraste (cara, pista, estado, ficha en sus fondos, relleno de subida, frente de avance
// ≥ 3:1, filo de éxito, error, botones, aviso, mensajes, destino en sus cuatro apariencias) en claro, oscuro, Tema de
// prueba y los once temas generados (claro y oscuro) en Chromium, y en claro, oscuro y spotify (claro y oscuro) en
// Firefox y WebKit; destino (mayor que la caja, Δ0 al despertar, vecinos sin solape en compact, puntero solo si admite,
// cuatro apariencias distinguibles sin color, fundidos); foco visible ≥ 2px en la caja; RTL y 320px (sin desborde,
// frente de avance al final de la lectura); aterrizaje (≥ 2 escalas intermedias, termina en 1, sin rebase, clase
// retirada) y sacudida; movimiento reducido; forced-colors emulado (Chromium); --g-form-min medido y barrido de la
// fila; consola limpia.
// Ejecutar desde la raíz del repo (requiere dist/): GRANA_PW_PORT=4211 node design/lab/file-field/estilo-verificar.mjs
// Opcional: --engines=chromium,firefox,webkit (por defecto los tres)   --verbose
import http from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const pw = await import(new URL('../theme-playground/node_modules/playwright/index.mjs', import.meta.url))
const ROOT = fileURLToPath(new URL('../../../', import.meta.url))
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')).map(([k, v]) => [k, v ?? true]))
const ENGINES = (args.engines || 'chromium,firefox,webkit').split(',')
const DIST = process.env.GRANA_DIST // opcional: otra copia de dist/ (ruta relativa a la raíz), sin tocar la del repositorio
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const server = http.createServer(async (req, res) => {
  try {
    let path = decodeURIComponent(new URL(req.url, 'http://x').pathname)
    if (DIST) path = path.replace('/packages/vue/dist/', '/' + DIST.replace(/^\/|\/$/g, '') + '/')
    const p = normalize(join(ROOT, path))
    if (!p.startsWith(ROOT) && !(DIST && p.startsWith('/'))) throw new Error('fuera')
    const body = await readFile(p)
    res.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream' }).end(body)
  } catch { res.writeHead(404).end() }
})
await new Promise((r) => server.listen(Number(process.env.GRANA_PW_PORT) || 0, '127.0.0.1', r))
const BASE = `http://127.0.0.1:${server.address().port}/design/lab/file-field/estilo-banco.html`

const GEN = ['amazon', 'apple', 'caracol-purpura', 'github', 'grana', 'linear', 'lustre', 'medium', 'notion', 'spotify', 'stripe']
let total = 0, failed = 0
const fails = [], measures = {}
const ok = (cond, msg) => { total++; if (!cond) { failed++; fails.push(msg) } }
const note = (k, v) => { (measures[k] ??= []).push(v) }

/* ---------- 0 · Análisis estático del CSS ---------- */
{
  const raw = await readFile(join(ROOT, 'packages/vue/src/components/GFileField/GFileField.css'), 'utf8')
  const css = raw.replace(/\/\*[\s\S]*?\*\//g, '')
  ok(!/#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|lab|lch|color-mix)\(/.test(css), 'CSS: color literal o color-mix')
  ok(!/var\(\s*--[\w-]+\s*,/.test(css), 'CSS: var() con valor de respaldo')
  ok(!/@layer/.test(css), 'CSS: @layer en el archivo')
  ok(!/@property/.test(css), 'CSS: @property')
  ok(!/!important/.test(css), 'CSS: !important')
  const vars = [...css.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1])
  ok(vars.every((v) => v.startsWith('--g-') || v.startsWith('--_')), 'CSS: var() que no es --g-* ni --_*')
  const defaults = await readFile(join(ROOT, 'packages/vue/src/styles/defaults.css'), 'utf8')
  const defined = new Set([...defaults.matchAll(/(--g-[a-z0-9-]+)\s*:/g)].map((m) => m[1]))
  const missing = [...new Set(vars.filter((v) => v.startsWith('--g-') && !defined.has(v)))]
  ok(!missing.length, 'CSS: tokens que no existen en defaults.css ' + missing)
  const declaredG = [...css.matchAll(/(--g-[\w-]+)\s*:/g)].map((m) => m[1])
  ok(declaredG.length === 1 && declaredG[0] === '--g-form-min', 'CSS: declara propiedades --g-* distintas de --g-form-min: ' + declaredG)
  ok(/\.g-form-row > \.g-file-field \{\s*--g-form-min: 62;/.test(css), 'CSS: --g-form-min: 62 sobre .g-form-row > .g-file-field')
  const own = new Set([...css.matchAll(/(--_[\w-]+)\s*:/g)].map((m) => m[1]))
  const SHARED = ['--_bg', '--_border', '--_border-end', '--_units', '--_density', '--_px', '--_fs', '--_lh', '--_h', '--_radius']
  ok([...own].every((v) => v.startsWith('--_ff-') || SHARED.includes(v)), 'CSS: alias propio fuera de --_ff-* y los de GInput: ' + [...own])
  const strange = [...new Set(vars.filter((v) => v.startsWith('--_') && !own.has(v)))]
  ok(!strange.length, 'CSS: lee un alias --_* que no declara: ' + strange)
  const px = [...css.matchAll(/(-?\d*\.?\d+)px/g)].map((m) => m[0])
  ok(px.every((p) => ['24px', '44px', '1px', '-1px'].includes(p)), 'CSS: medidas literales no permitidas ' + px.filter((p) => !['24px', '44px', '1px', '-1px'].includes(p)))
  const onePx = css.split('\n').filter((l) => /\b-?1px\b/.test(l)).map((l) => l.trim())
  ok(onePx.every((l) => /^(inline-size|block-size|margin): -?1px;$/.test(l)), 'CSS: 1px fuera del texto oculto: ' + onePx)
  ok(!/\d(?:ch|em|rem|vw|vh|lh)\b/.test(css.replace(/-0\.125em/g, '')), 'CSS: unidad literal no permitida (ch, em, rem, vw, vh, lh)')
  const nums = [...css.matchAll(/[*/]\s*(-?\d*\.?\d+)\b(?!px|ms|%|fr|turn)/g)].map((m) => m[1])
  const NUMS = ['-1', '2', '0.75', '0.375', '24', '52', '90', '-0.5', '0.25', '6']
  ok(nums.every((n) => NUMS.includes(n)), 'CSS: factores no previstos: ' + [...new Set(nums.filter((n) => !NUMS.includes(n)))])
  const kf = [...css.matchAll(/@keyframes\s+([\w-]+)/g)].map((m) => m[1])
  ok(kf.length === 3 && ['g-file-field-land', 'g-file-field-land-fade', 'g-reject-file-field'].every((k) => kf.includes(k)), 'CSS: keyframes ' + kf)
  ok(/@keyframes g-file-field-land \{\s*from \{ opacity: 0; scale: 0\.86; \}\s*\}/.test(css), 'CSS: el aterrizaje no parte de 0.86 (§29.6)')
  ok(!/--g-ease-spring|--g-ease-bounce/.test(css), 'CSS: usa el muelle o el rebote (L24: sin usos nuevos)')
  ok(/g-file-field-land var\(--g-duration-press\) var\(--g-ease-out\)/.test(css), 'CSS: el aterrizaje no va con --g-duration-press y --g-ease-out')
  const trs = [...css.matchAll(/transition(?:-property)?\s*:([^;]+);/g)].map((m) => m[1])
  ok(!trs.some((t) => /\ball\b|inset|\btop\b|\bbottom\b|\bleft\b|padding|inline-size|block-size|width|height/.test(t)), 'CSS: transición de colocación o all')
  let ctx = [], pending = ''
  const anim = [], hov = [], moveTr = []
  for (const t of css.split(/([{}])/)) {
    if (t === '{') { ctx.push(pending.trim()); pending = '' }
    else if (t === '}') { ctx.pop(); pending = '' }
    else {
      pending = t
      const decls = t.split(';').map((d) => d.trim()).filter((d) => /^[\w-]+\s*:/.test(d))
      for (const d of decls) {
        const c = ctx.join(' » ')
        if (/^animation\s*:/.test(d)) anim.push([c, d])
        if (/^transition\s*:/.test(d) && /(rotate|translate|scale)/.test(d)) moveTr.push([c, d])
      }
      if (ctx.some((c) => /:hover/.test(c))) hov.push(ctx.join(' » '))
    }
  }
  ok(anim.every(([c, d]) => /prefers-reduced-motion: no-preference/.test(c) || (/prefers-reduced-motion: reduce/.test(c) && /g-file-field-land-fade/.test(d))), 'CSS: animation fuera de no-preference: ' + anim.map((x) => x.join(' ')))
  ok(moveTr.every(([c]) => /prefers-reduced-motion: no-preference/.test(c)), 'CSS: transición de movimiento fuera de no-preference: ' + moveTr.map((x) => x[0]))
  ok(hov.every((c) => /\(hover: hover\)/.test(c)), 'CSS: :hover fuera de (hover: hover): ' + hov)
}

/* ---------- Funciones de página ---------- */
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
    let base = parse(getComputedStyle(document.documentElement).backgroundColor)
    if (base[3] < 1) base = parse(getComputedStyle(document.body).backgroundColor)
    if (base[3] < 1) base = [255, 255, 255, 1]
    for (let i = layers.length - 1; i >= 0; i--) base = over(layers[i], base)
    return base
  }
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]) }
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return +((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)).toFixed(2) }
  const tok = (n, prop = 'color') => { const i = document.createElement('i'); i.style[prop] = `var(${n})`; document.body.append(i); const c = getComputedStyle(i)[prop]; i.remove(); return c }
  const px = (n) => { const i = document.createElement('i'); i.style.inlineSize = `var(${n})`; i.style.position = 'absolute'; document.body.append(i); const v = i.getBoundingClientRect().width; i.remove(); return v }
  const root = (c) => { const e = document.querySelector(`[data-case="${c}"]`); return (e && e.closest(".g-input, .g-file-field")) || e }
  const q = (c, s) => root(c).querySelector(s)
  const fg = (el) => parse(getComputedStyle(el).color)
  const pair = (k, el, min, bg) => { const b = bg || bgOf(el); return { k, r: ratio(over(fg(el), b), b), min } }
  const rect = (el) => { const r = el.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height } }
  return { parse, over, bgOf, ratio, tok, px, root, q, fg, pair, rect }
}
const L = `(${lib.toString()})()`

/* ---------- Navegador ---------- */
for (const engine of ENGINES) {
  const browser = await pw[engine].launch()
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 })
  const page = await ctx.newPage()
  const errors = []
  const watch = (p) => {
    p.on('console', (m) => { if (['error', 'warning'].includes(m.type()) && !/favicon|404/.test(m.text())) errors.push(m.text()) })
    p.on('pageerror', (e) => errors.push(e.message))
  }
  watch(page)
  const tag = (s) => `${engine} ${s}`
  const go = async (qs = '', p = page) => {
    await p.goto(BASE + qs)
    await p.waitForSelector('[data-ready]')
    await p.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
    if (/theme=|test=|dark=/.test(qs)) await p.waitForTimeout(300)
  }

  /* 1 · Contraste */
  const contrast = () => page.evaluate(`(() => { const { pair, q, root, bgOf, parse, ratio, rect } = ${L}
    const out = []
    const P = (k, el, min, bg) => { if (!el) { out.push({ k: k + ' (no está)', r: 0, min }); return } out.push(pair(k, el, min, bg)) }
    const G = (k, color, bg, min) => out.push({ k, r: ratio(parse(color), bg), min })
    P('cara (accent-text)', q('empty-md-default', '.g-file-field__action'), 4.5)
    P('pista en la caja', q('empty-md-default', '.g-file-field__add-hint'), 4.5)
    P('pista del pie', q('multi', '.g-file-field__hint'), 4.5)
    P('estado del pie', q('multi', '.g-file-field__status'), 4.5)
    const chip = (c, s) => q(c, '.g-file-field__chip[data-state="' + s + '"]' + (s === 'done' ? ':not([data-stored])' : ''))
    for (const c of ['multi', 'soft']) {
      const r = chip(c, 'ready'), cb = bgOf(r)
      P(c + ' · ficha: nombre', r.querySelector('.g-summary__title'), 4.5); P(c + ' · ficha: tamaño', r.querySelector('.g-summary__subtitle'), 4.5)
      P(c + ' · ficha: icono', r.querySelector('.g-summary__lead'), 3)
      G(c + ' · ficha: Quitar (icono)', getComputedStyle(r.querySelector('.g-file-field__remove')).color, cb, 3)
      const u = chip(c, 'uploading'), fill = u.querySelector('.g-progress__fill'), fb = parse(getComputedStyle(fill).backgroundColor), ub = bgOf(u)
      P(c + ' · subiendo: nombre sobre el relleno', u.querySelector('.g-summary__title'), 4.5, fb); P(c + ' · subiendo: tamaño sobre el relleno', u.querySelector('.g-summary__subtitle'), 4.5, fb)
      P(c + ' · subiendo: nombre sin relleno', u.querySelector('.g-summary__title'), 4.5, ub); P(c + ' · subiendo: tamaño sin relleno', u.querySelector('.g-summary__subtitle'), 4.5, ub)
      const fcs = getComputedStyle(fill), edge = getComputedStyle(u).direction === 'rtl' ? fcs.borderLeftColor : fcs.borderRightColor
      G(c + ' · frente de avance / relleno', edge, fb, 3); G(c + ' · frente de avance / ficha', edge, ub, 3)
      const d = chip(c, 'done'); G(c + ' · filo de éxito / ficha', getComputedStyle(d, '::after').backgroundColor, bgOf(d), 3)
      const e = chip(c, 'error'), eb = bgOf(e)
      P(c + ' · error: nombre', e.querySelector('.g-summary__title'), 4.5); P(c + ' · error: mensaje', e.querySelector('.g-summary__fact-value'), 4.5)
      G(c + ' · error: Reintentar (icono)', getComputedStyle(e.querySelector('.g-file-field__retry')).color, eb, 3)
      G(c + ' · error: Quitar (icono)', getComputedStyle(e.querySelector('.g-file-field__remove')).color, eb, 3)
    }
    const st = q('multi', '.g-file-field__chip[data-stored]'); P('guardado: nombre', st.querySelector('.g-summary__title'), 4.5)
    P('soft · cara', q('soft', '.g-file-field__action'), 4.5)
    P('solo lectura · cara', q('ro', '.g-file-field__action'), 4.5); P('solo lectura · ficha', q('ro', '.g-summary__title'), 4.5); P('solo lectura vacío · cara', q('ro-empty', '.g-file-field__action'), 4.5)
    P('lleno · cara', q('full', '.g-file-field__action'), 4.5)
    P('aviso: texto', q('notice', '.g-file-field__notice-list li'), 4.5); P('aviso: nombre', q('notice', '.g-file-field__notice-list strong'), 4.5)
    G('aviso: Descartar (icono)', getComputedStyle(q('notice', '.g-file-field__notice > .g-btn')).color, bgOf(q('notice', '.g-file-field__notice')), 3)
    P('mensaje: error', q('inv', '.g-file-field__message'), 4.5); P('mensaje: advertencia', q('warn', '.g-file-field__message'), 4.5); P('mensaje: válido', q('valid', '.g-file-field__message'), 4.5)
    const host = bgOf(root('multi').parentElement)
    G('borde de la caja', getComputedStyle(q('multi', '.g-file-field__box')).borderTopColor, host, 3)
    G('borde con error', getComputedStyle(q('inv', '.g-file-field__box')).borderTopColor, host, 3)
    G('color de foco / página', getComputedStyle(q('multi', '.g-file-field__box')).getPropertyValue('--g-color-focus').trim() ? (() => { const i = document.createElement('i'); i.style.color = 'var(--g-color-focus)'; document.body.append(i); const c = getComputedStyle(i).color; i.remove(); return c })() : 'rgb(0,0,0)', host, 3)
    const T = (c) => q(c, '.g-file-field__target')
    for (const [c, k] of [['t-ok', 'destino admite'], ['t-over', 'destino encima'], ['t-no', 'destino no admite'], ['t-overno', 'destino encima no admite'], ['t-full', 'destino lleno']]) {
      const t = T(c); P(k + ': texto', t.querySelector('.g-file-field__target-text'), 4.5)
      G(k + ': borde / página', getComputedStyle(t).borderTopColor, bgOf(root(c).closest('.host')), 3)
    }
    return out })()`)
  const worst = {}
  const THEMES = engine === 'chromium' ? [['defecto', ''], ['defecto', 'dark=1'], ['prueba', 'test=1'], ...GEN.flatMap((t) => [[t, `theme=${t}`], [t, `theme=${t}&dark=1`]])] : [['defecto', ''], ['defecto', 'dark=1'], ['spotify', 'theme=spotify'], ['spotify', 'theme=spotify&dark=1']]
  for (const [name, qs] of THEMES) {
    await go('?drag=1&' + qs)
    let m
    try { m = await contrast() } catch (e) { ok(false, tag(`${name} ${qs}: contraste no medible (${e.message.split('\n')[0]})`)); continue }
    const t = `${name} ${qs.includes('dark') ? 'oscuro' : 'claro'}`
    for (const c of m) ok(c.r >= c.min, tag(`${t}: ${c.k} ${c.r}:1 < ${c.min}`))
    for (const c of m) worst[c.k] = Math.min(worst[c.k] ?? 99, c.r)
  }
  note('contraste mínimo ' + engine, Object.entries(worst).map(([k, v]) => `${k} ${v}`).join(' · '))

  /* 2 · Δ0 en una GFormRow con GInput (vacío y con un archivo), por tamaño y densidad; ficha Δ0 entre estados */
  for (const qs of ['', 'test=1']) {
    await go('?' + qs)
    const rows = await page.evaluate(`(() => { const { root, q, rect, px } = ${L}; const out = []
      for (const d of ['default', 'comfortable', 'compact']) for (const s of ['xs', 'sm', 'md', 'lg', 'xl']) {
        const gi = root('in-' + s + '-' + d).querySelector('.g-input__control'), gl = root('in-' + s + '-' + d).querySelector('.g-input__label')
        const e = q('empty-' + s + '-' + d, '.g-file-field__box'), el = q('empty-' + s + '-' + d, '.g-file-field__label'), o = q('one-' + s + '-' + d, '.g-file-field__box')
        const chip = q('one-' + s + '-' + d, '.g-file-field__chip'), g1 = root('in1-' + s + '-' + d).querySelector('.g-input__control')
        out.push({ s, d, gi: rect(gi), gl: rect(gl), e: rect(e), el: rect(el), o: rect(o), g1: rect(g1), chip: rect(chip), bw: px('--g-border-width'), h: (() => { const i = document.createElement('i'); i.className = 'g-input g-input--size-' + s + ' g-input--density-' + d; i.style.position = 'absolute'; document.body.append(i); const t = document.createElement('i'); t.style.inlineSize = 'var(--_h)'; t.style.position = 'absolute'; i.append(t); const v = t.getBoundingClientRect().width; i.remove(); return v })() })
      } return out })()`)
    for (const r of rows) {
      const t = (x) => tag(`?${qs} ${r.s}/${r.d}: ${x}`)
      ok(Math.abs(r.e.t - r.gi.t) < 0.5 && Math.abs(r.e.h - r.gi.h) < 0.5, t(`caja vacía Δtop ${(r.e.t - r.gi.t).toFixed(2)} Δalto ${(r.e.h - r.gi.h).toFixed(2)}`))
      ok(Math.abs(r.el.t - r.gl.t) < 0.5, t(`etiqueta Δtop ${(r.el.t - r.gl.t).toFixed(2)}`))
      ok(Math.abs(r.o.t - r.g1.t) < 0.5, t(`caja con archivo Δtop ${(r.o.t - r.g1.t).toFixed(2)}`))
      const expect = Math.max(r.h, r.chip.h + 2 * r.bw) // la ficha mide al menos sus botones (auditoría, hallazgo 2)
      ok(Math.abs(r.o.h - expect) < 0.5, t(`caja con archivo ${r.o.h} ≠ ${expect} (alto de GInput ${r.h})`))
      ok(r.chip.h >= 24 - 0.01, t(`ficha ${r.chip.h} < 24`))
      if (Math.abs(r.o.h - r.h) > 0.01) note('caja con un archivo más alta que la de GInput (permitido: la ficha toca su piso de 24px); el GInput vecino se estira', `${engine} ?${qs} ${r.s}/${r.d} ${r.o.h} vs ${r.h.toFixed(2)} (GInput vecino ${r.g1.h})`)
    }
    note('Δ0 caja vacía y con un archivo frente a GInput', `${engine} ?${qs} ${rows.length} combinaciones`)
    const chips = await page.evaluate(`(() => { const { q } = ${L}; return ['xs', 'sm', 'md', 'lg', 'xl'].map((s) => ({ s, h: [...document.querySelectorAll('[data-case="states-' + s + '"] .g-file-field__chip')].map((c) => [c.dataset.state + (c.hasAttribute('data-stored') ? '*' : ''), c.getBoundingClientRect().height]),
      btn: [...document.querySelectorAll('[data-case="states-' + s + '"] .g-btn')].map((b) => { const r = b.getBoundingClientRect(); return [r.width, r.height] }) })) })()`)
    for (const c of chips) {
      const hs = c.h.map((x) => x[1])
      ok(c.h.length === 6 && Math.max(...hs) - Math.min(...hs) < 0.01, tag(`?${qs} ficha ${c.s}: Δ entre estados ${JSON.stringify(c.h)}`))
      ok(c.btn.every(([w, h]) => w >= 24 - 0.01 && h >= 24 - 0.01), tag(`?${qs} ficha ${c.s}: botón < 24px ${JSON.stringify(c.btn)}`))
    }
    note('alto de la ficha por tamaño (px)', `${engine} ?${qs} ` + chips.map((c) => `${c.s} ${c.h[0][1]}`).join(' · '))
  }

  /* 3 · Destino: Δ0 al despertar, mayor que la caja, vecinos sin solape, puntero, apariencias, fundidos */
  {
    await go('')
    const CASES = ['t-ok', 't-over', 't-no', 't-overno', 't-full']
    const snap = () => page.evaluate(`(() => { const { root, q, rect } = ${L}; const o = {}; for (const c of ${JSON.stringify(CASES)}.concat(['t-input'])) { const r = root(c); o[c] = { root: rect(r), box: rect(r.querySelector('.g-file-field__box, .g-input__control')), foot: rect(r.lastElementChild) } } return o })()`)
    const before = await snap()
    const asleep = await page.evaluate(`(() => { const { q } = ${L}; const t = q('t-ok', '.g-file-field__target'); const cs = getComputedStyle(t); return { op: cs.opacity, vis: cs.visibility, pe: cs.pointerEvents, dur: cs.transitionDuration } })()`)
    ok(asleep.op === '0' && asleep.vis === 'hidden' && asleep.pe === 'none', tag(`destino dormido visible o con puntero ${JSON.stringify(asleep)}`))
    await page.evaluate(() => { __ff.drag.value = 1 })
    await page.waitForTimeout(400)
    const after = await snap()
    for (const c of Object.keys(before)) for (const k of ['root', 'box', 'foot']) ok(['l', 't', 'w', 'h'].every((x) => Math.abs(before[c][k][x] - after[c][k][x]) < 0.01), tag(`despertar mueve ${c} ${k}`))
    const tg = await page.evaluate(`(() => { const { q, rect, parse, tok } = ${L}; const o = {}
      for (const c of ${JSON.stringify(CASES)}) { const t = q(c, '.g-file-field__target'), cs = getComputedStyle(t); o[c] = { t: rect(t), box: rect(q(c, '.g-file-field__box')), op: cs.opacity, pe: cs.pointerEvents, bs: cs.borderTopStyle, bc: parse(cs.borderTopColor), bg: parse(cs.backgroundColor), dur: cs.transitionDuration, soft: cs.backgroundColor === tok('--g-color-accent-soft', 'backgroundColor'), fill: cs.backgroundColor === tok('--g-color-accent', 'backgroundColor') } }
      return o })()`)
    for (const c of CASES) {
      const x = tg[c]
      ok(x.t.l < x.box.l && x.t.r > x.box.r && x.t.t < x.box.t && x.t.b > x.box.b, tag(`destino ${c} no es mayor que la caja`))
      ok(x.op === '1', tag(`destino ${c} no se ve (${x.op})`))
      ok(/\b0\.16s|160ms/.test(x.dur) || x.dur.split(',')[0].trim() === '0.16s', tag(`destino ${c} despierta sin --g-duration-press (${x.dur})`))
    }
    note('destino: sobresaliente (px) izquierda · arriba', `${engine} ${(tg['t-ok'].box.l - tg['t-ok'].t.l).toFixed(2)} · ${(tg['t-ok'].box.t - tg['t-ok'].t.t).toFixed(2)}`)
    const inter = (a, b) => !(a.r <= b.l || b.r <= a.l || a.b <= b.t || b.b <= a.t)
    ok(!inter(tg['t-ok'].t, tg['t-over'].t) && !inter(tg['t-over'].t, tg['t-no'].t) && !inter(tg['t-overno'].t, tg['t-full'].t), tag('destinos vecinos se solapan (compact)'))
    note('destino: separación entre vecinos en compact (px)', `${engine} ${(tg['t-over'].t.l - tg['t-ok'].t.r).toFixed(2)} · ${(tg['t-no'].t.l - tg['t-over'].t.r).toFixed(2)}`)
    ok(tg['t-ok'].pe === 'auto' && tg['t-over'].pe === 'auto' && tg['t-no'].pe === 'none' && tg['t-overno'].pe === 'none' && tg['t-full'].pe === 'none', tag('puntero del destino: solo con is-awake-ok'))
    // Forma, no solo color: admite = borde sólido + relleno suave; encima = borde sólido + relleno sólido accent (texto
    // on-accent); no admite / lleno / encima sin admitir = borde discontinuo sobre la superficie hundida
    const sig = (x) => `${x.bs}/${x.fill ? 'sólido' : x.soft ? 'suave' : 'apagado'}`
    ok(sig(tg['t-ok']) === 'solid/suave' && sig(tg['t-over']) === 'solid/sólido' && sig(tg['t-no']) === 'dashed/apagado' && sig(tg['t-full']) === 'dashed/apagado' && sig(tg['t-overno']) === 'dashed/apagado', tag(`apariencias del destino ${CASES.map((c) => sig(tg[c]))}`))
    await page.evaluate(() => { __ff.drag.value = 0 })
    await page.waitForTimeout(50)
    const sleep = await page.evaluate(`(() => { const { q } = ${L}; return getComputedStyle(q('t-ok', '.g-file-field__target')).transitionDuration })()`)
    ok(sleep.split(',')[0].trim() === '0.12s', tag(`dormir sin --g-duration-fast (${sleep})`))
  }

  /* 4 · Foco visible en la caja */
  {
    await go('')
    await page.keyboard.press('Shift')
    await page.evaluate(() => document.querySelector('[data-case="empty-md-default"] .g-file-field__input').focus())
    await page.waitForTimeout(300)
    const f = await page.evaluate(`(() => { const { q, px, parse } = ${L}; const i = q('empty-md-default', '.g-file-field__input'); const b = q('empty-md-default', '.g-file-field__box'); const cs = getComputedStyle(b)
      const t = document.createElement('i'); t.style.color = 'var(--g-color-focus)'; document.body.append(t); const fc = getComputedStyle(t).color; t.remove()
      return { fv: i.matches(':focus-visible'), style: cs.outlineStyle, w: parseFloat(cs.outlineWidth), c: cs.outlineColor, fc, fw: px('--g-focus-width') } })()`)
    ok(f.fv, tag('el control no queda en :focus-visible al enfocarlo tras una tecla'))
    ok(f.style === 'solid' && f.w >= 2 && Math.abs(f.w - f.fw) < 0.1 && f.c === f.fc, tag(`anillo de la caja ${JSON.stringify(f)}`))
  }

  /* 5 · RTL y 320px: sin desborde, frente de avance al final de la lectura */
  {
    await go('?drag=1')
    const n = await page.evaluate(`(() => { const { root, q, rect } = ${L}; const o = {}
      for (const c of ['w320-ltr', 'w320-rtl']) { const h = root(c), hr = rect(h); let worst = 0
        // Rectángulo visible: recortado por los ancestros con overflow distinto de visible (la ficha, el relleno de la barra)
        const vis = (el) => { let r = el.getBoundingClientRect(), l = r.left, rr = r.right; for (let n = el.parentElement; n && n !== h; n = n.parentElement) { const cs = getComputedStyle(n); if (cs.overflowX !== 'visible' || cs.clipPath !== 'none') { const b = n.getBoundingClientRect(); l = Math.max(l, b.left); rr = Math.min(rr, b.right) } } return { l, r: rr, w: r.width } }
        for (const el of h.querySelectorAll('*')) { if (getComputedStyle(el).clipPath !== 'none') continue; const r = vis(el); if (!r.w || r.r <= r.l) continue; worst = Math.max(worst, hr.l - r.l, r.r - hr.r) }
        o[c] = { worst, sw: h.scrollWidth, cw: h.clientWidth, doc: document.documentElement.scrollWidth, vw: innerWidth } }
      for (const c of ['n-ltr-one', 'n-rtl-one']) { const chip = q(c, '.g-file-field__chip'), fill = q(c, '.g-progress__fill'), cr = rect(chip), fr = rect(fill), cs = getComputedStyle(fill)
        o[c] = { lead: getComputedStyle(chip).direction === 'rtl' ? (cr.r - fr.l) / cr.w : (fr.r - cr.l) / cr.w, bl: cs.borderLeftWidth, br: cs.borderRightWidth } }
      return o })()`)
    for (const c of ['w320-ltr', 'w320-rtl']) ok(n[c].worst <= 0.5 && n[c].sw <= n[c].cw, tag(`${c}: desborde ${n[c].worst.toFixed(2)}px (scroll ${n[c].sw}/${n[c].cw})`))
    ok(n['w320-ltr'].doc <= n['w320-ltr'].vw, tag('la página desborda en horizontal'))
    for (const c of ['n-ltr-one', 'n-rtl-one']) ok(Math.abs(n[c].lead - 0.42) < 0.02, tag(`${c}: el relleno no llega al 42 % desde el inicio de la lectura (${n[c].lead.toFixed(3)})`))
    ok(parseFloat(n['n-ltr-one'].br) > 0 && parseFloat(n['n-ltr-one'].bl) === 0 && parseFloat(n['n-rtl-one'].bl) > 0 && parseFloat(n['n-rtl-one'].br) === 0, tag(`frente de avance en el lado equivocado ${JSON.stringify([n['n-ltr-one'], n['n-rtl-one']])}`))
  }

  /* 6 · Movimiento: aterrizaje (con ?slow=1, duraciones × 5, para muestrear en los tres motores), sacudida; reducido */
  {
    await go('?slow=1')
    await page.evaluate(() => document.querySelector('[data-case="multi"]').scrollIntoView({ block: 'center' }))
    const land = await page.evaluate(async () => {
      __ff.add('multi')
      await new Promise((r) => requestAnimationFrame(r))
      const li = [...document.querySelectorAll('[data-case="multi"] .g-file-field__chip')].at(-1)
      const name = getComputedStyle(li).animationName, origin = getComputedStyle(li).transformOrigin, w = li.getBoundingClientRect().width
      const sc = [], t0 = performance.now()
      while (performance.now() - t0 < 1100) { const s = getComputedStyle(li).scale; sc.push(s === 'none' ? 1 : parseFloat(s)); await new Promise((r) => requestAnimationFrame(r)) }
      return { name, origin, w, sc, cls: li.classList.contains('is-landing') }
    })
    const mid = land.sc.filter((s) => s > 0.86 + 1e-3 && s < 1 - 1e-3)
    ok(land.name === 'g-file-field-land', tag(`aterrizaje: animación ${land.name}`))
    ok(new Set(mid.map((s) => s.toFixed(3))).size >= 2, tag(`aterrizaje: escalas intermedias ${mid}`))
    ok(Math.max(...land.sc) <= 1 + 1e-6 && Math.abs(land.sc.at(-1) - 1) < 1e-6, tag(`aterrizaje: rebase o no termina en 1 (${Math.max(...land.sc)}, ${land.sc.at(-1)})`))
    ok(!land.cls, tag('aterrizaje: is-landing no se retiró'))
    ok(parseFloat(land.origin) > land.w - 1, tag(`aterrizaje: el origen no está al final de la lectura (${land.origin}, ancho ${land.w})`))
    note('aterrizaje: escalas', `${engine} ${land.sc.slice(0, 8).map((s) => s.toFixed(3)).join(' ')}`)
    const rej = await page.evaluate(async () => {
      const r = document.querySelector('[data-case="inv"]'); __ff.items.get('inv').reject()
      await new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(res)))
      const name = getComputedStyle(r.querySelector('.g-file-field__box')).animationName
      await new Promise((res) => setTimeout(res, 1500))
      return { name, cls: r.classList.contains('is-rejected') }
    })
    ok(rej.name === 'g-reject-file-field' && !rej.cls, tag(`sacudida ${JSON.stringify(rej)}`))
    // Reducido
    const rctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' })
    const rp = await rctx.newPage(); watch(rp)
    await go('', rp)
    const red = await rp.evaluate(async () => {
      __ff.add('multi'); await new Promise((r) => requestAnimationFrame(r))
      const li = [...document.querySelectorAll('[data-case="multi"] .g-file-field__chip')].at(-1)
      const name = getComputedStyle(li).animationName, sc = []
      for (let i = 0; i < 6; i++) { const s = getComputedStyle(li).scale; sc.push(s); await new Promise((r) => requestAnimationFrame(r)) }
      await new Promise((r) => setTimeout(r, 300))
      const box = document.querySelector('[data-case="inv"] .g-file-field__box'); __ff.items.get('inv').reject(); await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
      const msg = document.querySelector('[data-case="empty-md-default"] .g-file-field__message')
      return { name, sc, cls: li.classList.contains('is-landing'), rej: getComputedStyle(box).animationName, rejCls: document.querySelector('[data-case="inv"]').classList.contains('is-rejected'), msgT: getComputedStyle(msg).translate }
    })
    ok(red.name === 'g-file-field-land-fade' && red.sc.every((s) => s === 'none'), tag(`reducido: la ficha se escala (${red.name} ${red.sc})`))
    ok(!red.cls, tag('reducido: is-landing no se retiró'))
    ok(red.rej === 'none' && !red.rejCls, tag(`reducido: sacudida ${red.rej} ${red.rejCls}`))
    ok(red.msgT === 'none', tag(`reducido: el mensaje se desplaza (${red.msgT})`))
    await rctx.close()
  }

  /* 7 · Puntero grueso (Chromium con isMobile/hasTouch): caja ≥ 44px, botones de la ficha ≥ 44px */
  if (engine === 'chromium') {
    const tctx = await browser.newContext({ viewport: { width: 800, height: 900 }, hasTouch: true, isMobile: true })
    const tp = await tctx.newPage(); watch(tp)
    await go('', tp)
    const t = await tp.evaluate(`(() => { const { q, rect } = ${L}; return { coarse: matchMedia('(pointer: coarse)').matches, box: rect(q('empty-xs-compact', '.g-file-field__box')).h, chip: rect(q('states-xs', '.g-file-field__chip')).h,
      btn: [...document.querySelectorAll('[data-case="states-md"] .g-btn')].map((b) => { const r = b.getBoundingClientRect(); return Math.min(r.width, r.height) }) } })()`)
    ok(t.coarse, tag('táctil: (pointer: coarse) no aplica'))
    ok(t.box >= 44 && t.chip >= 44 && t.btn.every((x) => x >= 44 - 0.01), tag(`táctil < 44px ${JSON.stringify(t)}`))
    note('táctil (px)', `caja xs/compact ${t.box} · ficha ${t.chip} · botón mínimo ${Math.min(...t.btn)}`)
    await tctx.close()
  }

  /* 8 · forced-colors emulado */
  {
    const fctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
    const fp = await fctx.newPage(); watch(fp)
    let supported = true
    try { await fp.emulateMedia({ forcedColors: 'active' }) } catch { supported = false }
    if (supported) {
      await go('?drag=1', fp)
      const active = await fp.evaluate(() => matchMedia('(forced-colors: active)').matches)
      if (active) {
        await fp.keyboard.press('Shift')
        const fc = await fp.evaluate(`(() => { const { q, parse } = ${L}; const i = q('empty-md-default', '.g-file-field__input'); i.focus()
          const sys = (k) => { const e = document.createElement('i'); e.style.color = k; document.body.append(e); const c = getComputedStyle(e).color; e.remove(); return c }
          const up = q('multi', '.g-file-field__chip[data-state="uploading"]'), fill = up.querySelector('.g-progress__fill'), fcs = getComputedStyle(fill)
          const ov = getComputedStyle(q('t-over', '.g-file-field__target')), okT = getComputedStyle(q('t-ok', '.g-file-field__target')), no = getComputedStyle(q('t-no', '.g-file-field__target'))
          const done = q('multi', '.g-file-field__chip[data-state="done"]:not([data-stored])')
          return { hl: sys('Highlight'), ct: sys('CanvasText'), ring: getComputedStyle(q('empty-md-default', '.g-file-field__box')).outlineColor, ringW: parseFloat(getComputedStyle(q('empty-md-default', '.g-file-field__box')).outlineWidth),
            chipO: getComputedStyle(up).outlineStyle, chipOC: getComputedStyle(up).outlineColor, errO: getComputedStyle(q('multi', '.g-file-field__chip[data-state="error"]')).outlineStyle,
            fillBg: parse(fcs.backgroundColor)[3], fillEdge: fcs.borderRightColor, fillLine: fcs.borderBottomColor, fillLineW: parseFloat(fcs.borderBottomWidth),
            overBg: ov.backgroundColor, okB: okT.borderTopColor, noS: no.borderTopStyle, doneA: getComputedStyle(done, '::after').backgroundColor, title: getComputedStyle(up.querySelector('.g-summary__title')).color,
            canvas: (() => { const e = document.createElement('i'); e.style.backgroundColor = 'Canvas'; document.body.append(e); const c = getComputedStyle(e).backgroundColor; e.remove(); return c })(),
            tile: getComputedStyle(q('multi', '.g-file-field__chip[data-state="ready"] .g-summary__lead > .g-icon')).backgroundColor,
            under: getComputedStyle(q('t-over', '.g-file-field__add')).opacity } })()`)
        ok(fc.tile === fc.canvas, tag(`forced: tesela del icono ${fc.tile} ≠ Canvas ${fc.canvas}`))
        ok(fc.under === '0', tag(`forced: lo de debajo del destino despierto se ve (${fc.under})`))
        ok(fc.ring === fc.hl && fc.ringW >= 2, tag(`forced: anillo ${fc.ring}/${fc.hl}`))
        ok(fc.chipO === 'solid' && fc.chipOC === fc.ct && fc.errO === 'dashed', tag(`forced: contorno de la ficha ${fc.chipO} ${fc.chipOC} / error ${fc.errO}`))
        ok(fc.fillBg === 0 && fc.fillEdge === fc.hl && fc.fillLine === fc.hl && fc.fillLineW > 0, tag(`forced: progreso ${JSON.stringify(fc)}`))
        ok(fc.overBg === fc.hl && fc.okB === fc.hl && fc.noS === 'dashed', tag(`forced: destino ${fc.overBg} ${fc.okB} ${fc.noS}`))
        ok(fc.doneA === fc.ct, tag(`forced: filo de éxito ${fc.doneA}`))
        note('forced-colors', `${engine} medido`)
      } else note('forced-colors', `${engine}: la emulación no activa la consulta (no medido)`)
    } else note('forced-colors', `${engine}: emulación no admitida (no medido)`)
    await fctx.close()
  }

  /* 9 · --g-form-min: medida y barrido de la fila */
  {
    await go('')
    const m = await page.evaluate(`(() => { const { q, px, rect } = ${L}; const r = q('sw-ff', '.g-file-field__box'), list = q('sw-ff', '.g-file-field__list'), add = q('sw-ff', '.g-file-field__add'), cs = getComputedStyle(r)
      const need = parseFloat(cs.borderLeftWidth) + parseFloat(cs.borderRightWidth) + parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight) + px('--g-space-1') * 24 + parseFloat(cs.columnGap) + add.scrollWidth
      return { need, space: px('--g-space-1'), min: parseFloat(getComputedStyle(q('sw-ff', '.g-file-field__box').parentElement).getPropertyValue('--g-form-min')) } })()`)
    const measured = m.need / m.space
    note('--g-form-min medido (md, «Adjuntar archivo», ficha en su suelo)', `${engine} ${m.need.toFixed(1)}px = space × ${measured.toFixed(1)} (declarado ${m.min})`)
    ok(m.min >= Math.ceil(measured) && m.min - measured < 8, tag(`--g-form-min ${m.min} no cubre lo medido (${measured.toFixed(1)})`))
    let split = null, split2 = null, bad = []
    for (let w = 900; w >= 300; w -= 4) {
      const s = await page.evaluate(`(() => { const { q, root, rect } = ${L}; document.querySelector('[data-case="sweep-host"]').style.inlineSize = '${w}px'; return new Promise((res) => setTimeout(() => requestAnimationFrame(() => requestAnimationFrame(() => {
        const gi = rect(root('sw-in').querySelector('.g-input__control')), fb = rect(q('sw-ff', '.g-file-field__box')), add = rect(q('sw-ff', '.g-file-field__add')), chip = rect(q('sw-ff', '.g-file-field__chip'))
        const gi2 = rect(root('sw2-in').querySelector('.g-input__control')), fb2 = rect(q('sw2-ff', '.g-file-field__box'))
        res({ same: Math.abs(gi.t - fb.t) < 0.5, h: fb.h, gh: gi.h, oneLine: Math.abs(add.t + add.h / 2 - (chip.t + chip.h / 2)) < 1, same2: Math.abs(gi2.t - fb2.t) < 0.5, fw: fb.w }) })), 40)) })()`)
      if (s.same && (!s.oneLine || Math.abs(s.h - s.gh) > 0.5)) bad.push(w)
      if (!s.same && split === null) split = w
      if (!s.same2 && split2 === null) split2 = w
    }
    ok(!bad.length, tag(`mientras comparte línea con GInput, «Adjuntar archivo» baja de línea a ${bad.slice(0, 5)}`))
    ok(split !== null && split2 !== null && split2 > split, tag(`la fila no se parte o --g-form-min del consumidor no la parte antes (${split}, ${split2})`))
    note('barrido de la fila (px de la fila donde se parte)', `${engine} con 62: ${split} · con style 80: ${split2}`)
  }

  ok(!errors.length, tag('consola: ' + errors.slice(0, 5).join(' | ')))
  await browser.close()
}

server.close()
for (const [k, v] of Object.entries(measures)) console.log(`· ${k}\n    ${v.join('\n    ')}`)
if (fails.length) console.log('\nFALLOS:\n  ' + fails.slice(0, args.verbose ? 999 : 60).join('\n  '))
console.log(`\n${total - failed}/${total} comprobaciones`)
process.exit(failed ? 1 : 0)
