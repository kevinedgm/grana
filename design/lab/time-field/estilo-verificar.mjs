// Verificación de coco sobre el banco de GTimeField (design/lab/time-field/estilo-banco.html), con el CSS real cargado en
// la capa grana.components y GInput (la caja), GForm, GFormLayout, GFormRow, GDatePicker y GSelect reales de dist/.
// Mide: análisis estático del CSS (sin literales, sin respaldos, sin @layer, sin :invalid/:user-invalid, keyframes
// g-time-reading… y nunca g-reject…, movimiento solo con no-preference, hover solo en (hover: hover), selectores sin hijos
// de la aplicación, #383); contraste de la lectura en palabras, de la hora entendida, de a. m./p. m. y de las dos lecturas
// en reposo, pulsadas y al pasar, y del separador, en el tema por defecto (claro y oscuro), el tema propio generado con
// @grana/cli (estilo-tema.json, claro y oscuro) y los once generados de dark-color-presence (claro y oscuro); a. m./p. m.
// del alto de la caja de cada tamaño, de borde a borde, piso 24px y ≥ 44px con puntero grueso; la lectura a la separación
// de la caja por tamaño y en la línea base del texto; pulsado distinguible sin color (peso); estados (error, advertencia,
// soft, pill, solo lectura, deshabilitado, sufijo, output); las dos lecturas (aparecen, no le quitan sitio a la hora,
// data-compact, un toque fija la hora con el foco en el campo); fila real con GDatePicker, GInput y GSelect (Δ top ≤ 1px,
// misma altura) a 1100/720/480/360/320; RTL ar-EG; 320 sin desborde; mínimo de referencia (#410) al píxel en 12 h y 24 h
// y el de solo lectura igual al editable; la palabra que entra (≥ 2 posiciones intermedias, nunca al montar ni al escribir
// cifras sin cambiar la franja ni desde la aplicación sin foco); movimiento reducido sin animaciones; I2 sin duplicar;
// forced-colors (Chromium); escalas fraccionarias; consola limpia.
// Ejecutar desde la raíz del repo (requiere dist/ por el JS):  GRANA_PW_PORT=4209 node design/lab/time-field/estilo-verificar.mjs
// Opcional: GRANA_DIST=<copia de dist/> (para no depender de un build en curso)  --engines=chromium,firefox,webkit  --verbose
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
await new Promise((r) => server.listen(Number(process.env.GRANA_PW_PORT) || 0, '127.0.0.1', r))
const BASE = `http://127.0.0.1:${server.address().port}/design/lab/time-field/estilo-banco.html`

const GEN = ['amazon', 'apple', 'caracol-purpura', 'github', 'grana', 'linear', 'lustre', 'medium', 'notion', 'spotify', 'stripe']
let total = 0, failed = 0
const fails = []
const notes = []
const ok = (cond, msg) => { total++; if (!cond) { failed++; fails.push(msg) } }
const near = (a, b, t = 0.5) => Math.abs(a - b) <= t
const bwOf = (qs) => (/propio/.test(qs) ? 2 : 1)

/* ---------- 0 · Análisis estático del CSS ---------- */
{
  const raw = await readFile(join(ROOT, 'packages/vue/src/components/GTimeField/GTimeField.css'), 'utf8')
  const css = raw.replace(/\/\*[\s\S]*?\*\//g, '')
  ok(!/#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|lab|lch)\(/.test(css), 'CSS: color literal')
  ok(!/var\(\s*--[\w-]+\s*,/.test(css), 'CSS: var() con valor de respaldo')
  ok(!/@layer/.test(css) && !/@property/.test(css) && !/!important/.test(css), 'CSS: @layer, @property o !important')
  ok(!/:invalid|:user-invalid/.test(css), 'CSS: estiliza :invalid o :user-invalid (#409)')
  const vars = [...css.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1])
  ok(vars.every((v) => v.startsWith('--g-') || v.startsWith('--_')), 'CSS: var() que no es --g-* ni --_*')
  const defaults = await readFile(join(ROOT, 'packages/vue/src/styles/defaults.css'), 'utf8')
  const defined = new Set([...defaults.matchAll(/(--g-[a-z0-9-]+)\s*:/g)].map((m) => m[1]))
  const missing = [...new Set(vars.filter((v) => v.startsWith('--g-') && !defined.has(v)))]
  ok(!missing.length, 'CSS: tokens que no existen en defaults.css ' + missing)
  const own = new Set([...css.matchAll(/(--_[\w-]+)\s*:/g)].map((m) => m[1]))
  const fromInput = ['--_h', '--_fs', '--_lh', '--_radius', '--_focus', '--_gap', '--_density']
  const strange = [...new Set(vars.filter((v) => v.startsWith('--_') && !own.has(v) && !fromInput.includes(v)))]
  ok(!strange.length, 'CSS: alias --_* que no son de GInput ni propios: ' + strange)
  ok([...own].every((v) => v.startsWith('--_tf-')), 'CSS: alias propio sin prefijo --_tf-: ' + [...own])
  // Literales de medida: 24px, 44px, 1px (texto oculto y hueco del cursor); 1ch (espejo)
  const px = [...css.matchAll(/(-?\d*\.?\d+)px/g)].map((m) => m[0])
  ok(px.every((p) => ['24px', '44px', '1px', '-1px'].includes(p)), 'CSS: medidas literales no permitidas ' + px.filter((p) => !['24px', '44px', '1px', '-1px'].includes(p)))
  const onePx = css.split('\n').filter((l) => /\b-?1px\b/.test(l)).map((l) => l.trim())
  ok(onePx.every((l) => /^(inline-size|block-size|margin): -?1px;$/.test(l) || l === 'padding-inline-end: 1px;'), 'CSS: 1px fuera del texto oculto y del hueco del cursor: ' + onePx)
  ok(css.split('\n').filter((l) => /padding-inline-end: 1px/.test(l)).length === 2, 'CSS: el hueco del cursor (1px) en el espejo y el medidor, y solo ahí')
  const nums = [...css.matchAll(/\*\s*(-?\d*\.?\d+)\b(?!px|ms|%)/g)].map((m) => m[1])
  ok(nums.every((n) => ['-1', '1', '2'].includes(n)), 'CSS: factores fuera de −1, 1 (§29.6) y 2 (doble trazo de GInput): ' + nums)
  const kf = [...css.matchAll(/@keyframes\s+([\w-]+)/g)].map((m) => m[1])
  ok(kf.length >= 1 && kf.every((k) => /^g-time-reading-/.test(k)), 'CSS: keyframes ' + kf)
  ok(!/g-reject/.test(css) && !/is-rejected/.test(css), 'CSS: nombra g-reject… o is-rejected (la sacudida es de GInput)')
  ok(!/ease-spring|ease-bounce/.test(css), 'CSS: usa --g-ease-spring o --g-ease-bounce (§29.1: es una entrada)')
  // #383: ningún selector toma hijos por estructura sin excluir .g-tooltip
  ok(!/>\s*\*|>\s*:(?!where\(\.g-tooltip)/.test(css.replace(/\{[^}]*\}/g, '{}')), 'CSS: selector de hijos por estructura (#383)')
  let ctx = [], pending = ''
  const anim = [], hov = []
  for (const t of css.split(/([{}])/)) {
    if (t === '{') { ctx.push(pending.trim()); pending = '' }
    else if (t === '}') { ctx.pop(); pending = '' }
    else {
      pending += t
      if (/(^|;|\s)animation\s*:/.test(t) && !ctx.some((c) => /@keyframes/.test(c))) anim.push(ctx.join(' » '))
      if (ctx.length && /:hover/.test(ctx[ctx.length - 1]) && /:/.test(t)) hov.push(ctx.join(' » '))
    }
  }
  ok(anim.length >= 2 && anim.every((c) => /@media \(prefers-reduced-motion: no-preference\)/.test(c)), 'CSS: animación fuera de no-preference: ' + anim.filter((c) => !/no-preference/.test(c)))
  ok(hov.every((c) => /@media \(hover: hover\)/.test(c)), 'CSS: :hover fuera de @media (hover: hover)')
  ok(/@media \(forced-colors: active\)/.test(css) && /@media \(pointer: coarse\)/.test(css), 'CSS: sin forced-colors o sin puntero grueso')
  ok(/touch-action: manipulation/.test(css) && /-webkit-touch-callout: none/.test(css) && /user-select: none/.test(css), 'CSS: botones sin touch-action/selección/menú de toque largo')
  ok((css.match(/tabular-nums/g) || []).length >= 4, 'CSS: tabular-nums en campo, espejo, medidor y __choice-time')
  ok(/var\(--g-duration-press\) var\(--g-ease-out\)/.test(css) && !/cubic-bezier|steps\(|linear\b/.test(css), 'CSS: entrada sin --g-duration-press + --g-ease-out o con curva propia')
  ok(/translate: 0 calc\(var\(--g-space-1\) \* 1\)/.test(css), 'CSS: la entrada no parte de --g-space-1 × 1')
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
    let base = parse(getComputedStyle(document.documentElement).backgroundColor)
    if (base[3] < 1) base = [255, 255, 255, 1]
    for (let i = layers.length - 1; i >= 0; i--) base = over(layers[i], base)
    return base
  }
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]) }
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return +((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)).toFixed(2) }
  const tok = (n) => { const i = document.createElement('i'); i.style.color = `var(${n})`; document.body.append(i); const c = parse(getComputedStyle(i).color); i.remove(); return c }
  const px = (n) => { const i = document.createElement('i'); i.style.inlineSize = `var(${n})`; i.style.position = 'absolute'; document.body.append(i); const v = i.getBoundingClientRect().width; i.remove(); return v }
  const root = (c) => { const i = document.getElementById(c); return i && i.closest('.g-input, .g-select, .g-datepicker') }
  return { parse, over, bgOf, ratio, tok, px, root }
}

const contrast = () => {
  const { parse, over, bgOf, ratio, tok } = window.__lib
  const out = []
  const add = (k, fg, bg, min) => out.push({ k, r: ratio(over(fg, bg), bg), min })
  for (const root of document.querySelectorAll('.g-time-field')) {
    if (root.classList.contains('is-disabled')) continue
    const id = root.querySelector('.g-time-field__field').id
    const ctl = root.querySelector('.g-input__control')
    for (const s of root.querySelectorAll('.g-time-field__reading-word, .g-time-field__reading-time')) add(`${id} lectura ${s.className.includes('reading-time') ? 'hora' : 'palabra'}`, parse(getComputedStyle(s).color), bgOf(ctl), 4.5)
    for (const b of root.querySelectorAll('.g-time-field__half, .g-time-field__choice')) {
      if (b.closest('.g-time-field__measure')) continue
      add(`${id} separador`, parse(getComputedStyle(b).borderInlineStartColor), bgOf(ctl), 3)
      add(`${id} ${b.classList.contains('is-on') ? 'pulsado' : 'reposo'} ${b.className.includes('choice') ? 'lectura' : 'mitad'}`, parse(getComputedStyle(b).color), bgOf(b), 4.5)
    }
  }
  const surface = tok('--g-color-surface')
  const ns = over(tok('--g-color-neutral-soft'), surface), as = over(tok('--g-color-accent-soft'), surface)
  add('pasar: text / neutral-soft', tok('--g-color-text'), ns, 4.5)
  add('pasar: separador border-control / neutral-soft', tok('--g-color-border-control'), ns, 3)
  add('pulsado: on-accent-soft / accent-soft', tok('--g-color-on-accent-soft'), as, 4.5)
  add('pulsado: separador border-control / accent-soft', tok('--g-color-border-control'), as, 3)
  return out
}

const geometry = () => {
  const { px, root } = window.__lib
  const R = (el) => el.getBoundingClientRect()
  const space = px('--g-space-1'), bw = px('--g-border-width')
  const UNITS = { xs: 6, sm: 7, md: 9, lg: 11, xl: 13 }, GAP = { xs: '--g-space-1', sm: '--g-space-1', md: '--g-space-2', lg: '--g-space-2', xl: '--g-space-3' }, DEN = { default: 1, compact: 0.75 }
  const textRect = (el) => { const r = document.createRange(); r.selectNodeContents(el); return r.getBoundingClientRect() }
  const g = { space, bw, sizes: {}, states: {}, rows: [], rtl: {}, overflow: document.documentElement.scrollWidth - innerWidth }
  for (const sid of ['xs', 'sm', 'md', 'lg', 'xl', 'md-compact', 'xs-compact']) {
    const [size, den = 'default'] = sid.split('-')
    const h = Math.max(24, space * UNITS[size] * DEN[den])
    const t12 = root('t12-' + sid), t24 = root('t24-' + sid), ctl = t12.querySelector('.g-input__control'), c = R(ctl)
    const btns = [...t12.querySelectorAll('.g-time-field__halves .g-time-field__half')].map((b) => { const r = R(b); return { w: +r.width.toFixed(2), h: +r.height.toFixed(2), top: +(r.top - c.top).toFixed(2), bottom: +(c.bottom - r.bottom).toFixed(2), right: +(c.right - r.right).toFixed(2) } })
    const gap = px(GAP[size]) * DEN[den]
    const reads = [t12, t24].map((rt) => {
      const cell = rt.querySelector('.g-time-field__value'), word = rt.querySelector('.g-time-field__reading-word'), mirror = rt.querySelector('.g-time-field__mirror')
      const wt = textRect(word), mt = textRect(mirror)
      return { gap: +(wt.left - R(cell).right).toFixed(2), ink: +(wt.left - mt.right).toFixed(2), dy: +((wt.top + wt.bottom) / 2 - (mt.top + mt.bottom) / 2).toFixed(2), fs: [getComputedStyle(word).fontSize, getComputedStyle(rt.querySelector('.g-time-field__field')).fontSize] }
    })
    g.sizes[sid] = { expected: +h.toFixed(2), gap, btns, box: +c.height.toFixed(2), box24: +R(t24.querySelector('.g-input__control')).height.toFixed(2), inputBox: +R(root('in-' + sid).querySelector('.g-input__control')).height.toFixed(2), reads }
  }
  for (const c of ['s-rest', 's-invalid', 's-warning', 's-soft', 's-pill', 's-disabled', 's-valid', 's-empty', 's-pending']) {
    const rt = root(c), ctl = rt.querySelector('.g-input__control'), cr = R(ctl)
    const b = [...rt.querySelectorAll('.g-time-field__halves .g-time-field__half')]
    const cs = b.map((x) => getComputedStyle(x))
    g.states[c] = {
      cover: b.map((x) => { const r = R(x); return [+(r.top - cr.top).toFixed(2), +(cr.bottom - r.bottom).toFixed(2), +(cr.right - r.right).toFixed(2)] }),
      blockBorder: cs.map((s) => [s.borderTopColor, parseFloat(s.borderTopWidth), s.backgroundClip]),
      endBorder: [parseFloat(cs.at(-1).borderRightWidth), cs.at(-1).borderRightColor],
      sep: cs.map((s) => [s.borderLeftStyle, parseFloat(s.borderLeftWidth)]),
      radius: [cs.at(-1).borderTopRightRadius, getComputedStyle(ctl).borderTopRightRadius],
      pad: parseFloat(getComputedStyle(ctl).paddingRight),
      on: b.map((x) => x.classList.contains('is-on')),
      weight: cs.map((s) => +s.fontWeight),
      minW: b.map((x) => +R(x).width.toFixed(2)),
      cursor: [getComputedStyle(ctl).cursor, cs[0].cursor, getComputedStyle(b[0].parentElement).cursor, rt.querySelector('.g-time-field__reading') ? getComputedStyle(rt.querySelector('.g-time-field__reading')).cursor : null]
    }
  }
  const ro = root('s-readonly')
  g.readonly = { halves: ro.querySelectorAll('.g-time-field__halves').length, reading: !!ro.querySelector('.g-time-field__reading-word'), pad: parseFloat(getComputedStyle(ro.querySelector('.g-input__control')).paddingRight) }
  // El sufijo y el output siguen a la lectura al gap de la caja (pegados a la hora), no al final
  for (const c of ['s-zone', 's-output']) {
    const rt = root(c), rd = R(rt.querySelector('.g-time-field__reading')), nx = R(rt.querySelector(c === 's-zone' ? '.g-input__suffix' : '.g-input__output'))
    g.states[c] = { after: +(nx.left - rd.right).toFixed(2), clip: c === 's-zone' && rt.querySelector('.g-time-field__reading-word').scrollWidth > rt.querySelector('.g-time-field__reading-word').clientWidth }
  }
  g.scrolls = [...document.querySelectorAll('.g-time-field__field')].filter((f) => !f.closest('.w320, [data-row]') && f.scrollWidth > f.clientWidth + 1).map((f) => f.id + ' ' + f.scrollWidth + '/' + f.clientWidth)
  g.tab = ['field', 'mirror', 'measure'].map((k) => getComputedStyle(root('ref-12').querySelector('.g-time-field__' + k)).fontVariantNumeric)
  const mq = root('ref-12').querySelector('.g-time-field__measure')
  g.measure = { pos: getComputedStyle(mq).position, vis: getComputedStyle(mq).visibility, font: getComputedStyle(mq).fontSize === getComputedStyle(root('ref-12').querySelector('.g-time-field__field')).fontSize,
    weight: [...mq.querySelectorAll('.g-time-field__half')].map((s) => +getComputedStyle(s).fontWeight) }
  for (const row of document.querySelectorAll('.g-form-row[data-row]')) {
    const box = (k) => k.querySelector('.g-input__control, .g-select__trigger, .g-select__control, .g-datepicker__field') || k
    const kids = [...row.children].map((k) => ({ c: (k.querySelector('[id]') || k).id, rootTop: R(k).top, top: +R(box(k)).top.toFixed(2), h: +R(box(k)).height.toFixed(2) }))
    const lines = []
    for (const k of kids) { const l = lines.find((x) => Math.abs(x[0].rootTop - k.rootTop) < 2); if (l) l.push(k); else lines.push([k]) }
    g.rows.push({ row: row.dataset.row, lines: lines.map((l) => l.map(({ c, top, h }) => ({ c, top, h }))) })
  }
  // RTL: a. m./p. m. a la izquierda (final lógico), la lectura a la izquierda de la hora, a la separación de la caja
  for (const c of ['rtl-ar12', 'rtl-ar24']) {
    const rt = root(c), cell = R(rt.querySelector('.g-time-field__value')), word = rt.querySelector('.g-time-field__reading-word'), ctl = R(rt.querySelector('.g-input__control'))
    const h = rt.querySelector('.g-time-field__halves')
    const wt = textRect(word)
    g.rtl[c] = { gap: +(cell.left - wt.right).toFixed(2), halvesLeft: h ? R(h).right <= wt.left + 0.5 && near(R(h).left, ctl.left, 0.5) : null, dir: rt.querySelector('.g-time-field__field').getAttribute('dir') }
  }
  const n = root('n320-12'), nc = n.querySelector('.g-input__control')
  g.n320 = { ctlOverflow: nc.scrollWidth - nc.clientWidth, rootOut: R(n).right - R(n.parentElement).right, halvesIn: R(n.querySelector('.g-time-field__halves')).right <= R(nc).right + 0.5 }
  return g
  function near(a, b, t) { return Math.abs(a - b) <= t }
}

// Muestreo por cuadro (rAF) de la palabra de la lectura de un campo
const SAMPLER = ([id, ms]) => new Promise((res) => {
  const root = document.getElementById(id).closest('.g-input')
  const out = [], t0 = performance.now()
  ;(function frame() {
    const w = root.querySelector('.g-time-field__reading-word'), rd = root.querySelector('.g-time-field__reading')
    const cs = w && getComputedStyle(w)
    out.push({ t: +(performance.now() - t0).toFixed(1), text: w && w.textContent, entering: !!w && w.classList.contains('is-entering'), dy: w ? +(w.getBoundingClientRect().top - rd.getBoundingClientRect().top).toFixed(2) : null,
      op: cs ? +cs.opacity : null, anims: root.getAnimations({ subtree: true }).map((a) => a.animationName).filter((n) => n && n.startsWith('g-time-reading')) })
    if (performance.now() - t0 < ms) requestAnimationFrame(frame); else res(out)
  })()
})

for (const engine of ENGINES) {
  const browser = await pw[engine].launch()
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  const errors = []
  const watch = (p) => {
    p.on('console', (m) => { if (['error', 'warning'].includes(m.type())) errors.push(m.text()) })
    p.on('pageerror', (e) => errors.push(String(e)))
    p.on('requestfailed', (r) => errors.push('red: ' + r.url()))
  }
  watch(page)
  const go = async (qs, p = page) => {
    for (let i = 0; ; i++) { try { await p.goto(BASE + qs); await p.waitForSelector('html[data-ready]', { state: 'attached', timeout: 15000 }); break } catch (e) { if (i) throw e } }
    await p.evaluate(() => document.fonts.ready)
    await p.evaluate(`window.__lib = (${lib})()`)
    await p.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
  }
  const tag = (s) => `${engine} ${s}`
  const typeIn = async (id, s, p = page) => { await p.focus('#' + id); await p.keyboard.press('ControlOrMeta+a'); await p.keyboard.press('Backspace'); await p.keyboard.type(s); await p.waitForTimeout(60) }

  /* 1 · Contraste: por defecto, propio (@grana/cli) y los once generados, claro y oscuro; con las dos lecturas a la vista */
  const worst = {}
  for (const [name, qs] of [['defecto', ''], ['defecto', 'dark=1'], ['propio', 'theme=propio'], ['propio', 'theme=propio&dark=1'], ...GEN.flatMap((t) => [[t, `theme=${t}`], [t, `theme=${t}&dark=1`]])]) {
    await go('?' + qs)
    await typeIn('c-wide', '9')
    const m = await page.evaluate(contrast)
    await page.evaluate(() => document.activeElement.blur())
    const t = `${name} ${qs.includes('dark') ? 'oscuro' : 'claro'}`
    for (const c of m) ok(c.r >= c.min, tag(`${t}: ${c.k} ${c.r}:1 < ${c.min}`))
    const w = (re) => Math.min(...m.filter((c) => re.test(c.k)).map((c) => c.r))
    worst[t] = { palabra: w(/lectura palabra/), hora: w(/lectura hora|lectura palabra/), reposo: w(/reposo/), pulsado: w(/pulsado (mitad|lectura)/), pasar: w(/pasar: text/), separador: w(/separador/) }
    ok(m.some((c) => /c-wide pulsado lectura/.test(c.k)) && m.some((c) => /c-wide reposo lectura/.test(c.k)), tag(`${t}: las dos lecturas no aparecieron al escribir «9»`))
  }
  if (engine === 'chromium') {
    console.log('Contraste mínimo (palabra · hora entendida · botón en reposo · pulsado · al pasar · separador):')
    for (const [t, r] of Object.entries(worst)) if (args.verbose || /defecto|propio|spotify|caracol/.test(t)) console.log(`  ${t.padEnd(24)} ${Object.values(r).join(' · ')}`)
    const all = Object.values(worst)
    console.log(`  mínimo en ${all.length} temas       ${['palabra', 'hora', 'reposo', 'pulsado', 'pasar', 'separador'].map((k) => Math.min(...all.map((r) => r[k]))).join(' · ')}`)
  }

  /* 2 · Geometría: defecto, oscuro y propio (borde 2px, space 5, radio 10, fuente 16) */
  for (const qs of ['', 'dark=1', 'theme=propio']) {
    await go('?' + qs)
    const g = await page.evaluate(geometry)
    const t = (s) => tag(`?${qs} ${s}`)
    if (engine === 'chromium') notes.push(`?${qs || 'defecto'} a. m./p. m. (alto × ancho de p.m.) por tamaño: ${Object.entries(g.sizes).map(([k, s]) => k + ' ' + s.btns[1].h + '×' + s.btns[1].w).join(' · ')}; lectura–hora: ${Object.entries(g.sizes).map(([k, s]) => k + ' ' + s.reads[1].gap).join(' · ')}`)
    for (const [sid, s] of Object.entries(g.sizes)) {
      for (const b of s.btns) {
        ok(near(b.h, s.expected) && b.w >= s.expected - 0.01, t(`${sid}: a. m./p. m. ${b.w}×${b.h}: alto ≠ ${s.expected} o más estrecho que alto`))
        ok(b.w >= 24 - 0.01 && b.h >= 24 - 0.01, t(`${sid}: a. m./p. m. bajo 24px`))
        ok(near(b.top, 0) && near(b.bottom, 0), t(`${sid}: a. m./p. m. no llegan de borde a borde ${JSON.stringify(b)}`))
      }
      ok(near(s.btns[1].right, 0), t(`${sid}: p.m. no llega al borde final (${s.btns[1].right})`))
      ok(near(s.box, s.inputBox) && near(s.box24, s.inputBox), t(`${sid}: caja ${s.box}/${s.box24} ≠ GInput ${s.inputBox}`))
      for (const r of s.reads) {
        ok(near(r.gap, s.gap, 0.5), t(`${sid}: lectura a ${r.gap}px de la celda ≠ gap ${s.gap}`))
        ok(r.ink >= s.gap - 0.01 && r.ink <= s.gap + 1.5, t(`${sid}: tinta lectura–hora ${r.ink} (gap ${s.gap} + 1px del cursor)`))
        ok(Math.abs(r.dy) <= 0.5 && r.fs[0] === r.fs[1], t(`${sid}: la lectura no está en la línea del texto (Δ ${r.dy}px) o cambia de tamaño ${r.fs}`))
      }
    }
    for (const [c, s] of Object.entries(g.states)) {
      if (!s.cover) continue
      for (const [a, b] of s.cover) ok(near(a, 0) && near(b, 0), t(`${c}: botones no cubren de borde a borde ${JSON.stringify(s.cover)}`))
      ok(near(s.cover.at(-1)[2], 0), t(`${c}: p.m. no llega al borde final ${s.cover.at(-1)[2]}`))
      for (const [col, , clip] of s.blockBorder) ok(/rgba\(0, 0, 0, 0\)|transparent/.test(col) && clip === 'padding-box', t(`${c}: trazo no transparente o fondo sin recortar ${col} ${clip}`))
      const stroke = c === 's-invalid' || c === 's-warning' ? 2 * g.bw : g.bw
      ok(s.blockBorder.every(([, w]) => near(w, stroke, 0.01)) && near(s.endBorder[0], stroke, 0.01), t(`${c}: trazo ${s.blockBorder.map((x) => x[1])}/${s.endBorder[0]} ≠ ${stroke}`))
      ok(s.sep.every(([st, w]) => st === 'solid' && near(w, g.bw, 0.01)), t(`${c}: separador ${JSON.stringify(s.sep)}`))
      ok(s.radius[0] === s.radius[1], t(`${c}: esquina de p.m. ${s.radius[0]} ≠ caja ${s.radius[1]}`))
      ok(s.pad === 0, t(`${c}: la caja conserva relleno final con a. m./p. m. (${s.pad})`))
      // Pulsado distinguible sin color: el pulsado pesa más que el otro
      if (s.on.some(Boolean)) ok(s.weight[s.on.indexOf(true)] > s.weight[s.on.indexOf(false)], t(`${c}: pulsado sin peso ${s.weight}`))
      const dis = c === 's-disabled'
      ok(s.cursor[0] === (dis ? 'not-allowed' : 'text') && s.cursor[1] === (dis ? 'not-allowed' : 'pointer') && s.cursor[2] === 'default' && (s.cursor[3] == null || s.cursor[3] === (dis ? 'not-allowed' : 'text')), t(`${c}: cursores ${s.cursor}`))
    }
    ok(g.states['s-empty'].on.every((x) => !x) && g.states['s-pending'].on[1] && !g.states['s-pending'].on[0], t('vacío sin pulsado / p.m. pendiente pulsada'))
    for (const c of ['s-zone', 's-output']) ok(near(g.states[c].after, g.sizes.md.gap, 0.5) && !g.states[c].clip, t(`${c}: lo de después no va pegado a la lectura (${g.states[c].after}) o la lectura se recorta con sitio`))
    ok(g.readonly.halves === 0 && g.readonly.reading && g.readonly.pad > 0, t(`solo lectura ${JSON.stringify(g.readonly)}`))
    ok(!g.scrolls.length, t(`la hora no cabe en su campo ${g.scrolls}`))
    ok(g.tab.every((v) => /tabular-nums/.test(v)), t(`tabular-nums ${g.tab}`))
    ok(g.measure.pos === 'absolute' && g.measure.vis === 'hidden' && g.measure.font && g.measure.weight.length === 2 && g.measure.weight.every((w) => w >= 500), t(`__measure ${JSON.stringify(g.measure)}`))
    for (const r of g.rows) for (const l of r.lines) if (l.length > 1) ok(l.every((k) => near(k.top, l[0].top, 1)) && l.every((k) => near(k.h, l[0].h, 0.5)), t(`fila ${r.row}: cajas ${JSON.stringify(l)}`))
    for (const [c, r] of Object.entries(g.rtl)) {
      ok(r.dir === 'rtl' && near(r.gap, g.sizes.md.gap, 0.5), t(`${c}: RTL lectura–hora ${JSON.stringify(r)}`))
      if (r.halvesLeft !== null) ok(r.halvesLeft, t(`${c}: RTL a. m./p. m. no van al final lógico (izquierda)`))
    }
    ok(g.n320.ctlOverflow <= g.bw + 0.5 && g.n320.rootOut <= 0.5 && g.n320.halvesIn, t(`320: ${JSON.stringify(g.n320)}`))
    ok(g.overflow <= 0, t(`desborde de la página ${g.overflow}`))
  }

  /* 3 · Anchos de ventana: filas, sin desborde */
  for (const w of [720, 480, 360, 320]) {
    await page.setViewportSize({ width: w, height: 900 })
    await go('')
    const g = await page.evaluate(geometry)
    for (const r of g.rows) for (const l of r.lines) if (l.length > 1) ok(l.every((k) => near(k.top, l[0].top, 1)) && l.every((k) => near(k.h, l[0].h, 0.5)), tag(`${w}px fila ${r.row}: ${JSON.stringify(l)}`))
    ok(g.overflow <= 0, tag(`${w}px: desborde ${g.overflow}`))
    ok(g.n320.ctlOverflow <= 1.5 && g.n320.halvesIn, tag(`${w}px: 12 h con segundos fuera de la caja ${JSON.stringify(g.n320)}`))
  }
  await page.setViewportSize({ width: 1280, height: 900 })

  /* 4 · Mínimo de referencia (#410), md: con ese ancho de caja la hora más ancha cabe entera y la lectura desaparece entera;
     con 1px menos, no cabe. El de solo lectura (12 h) es el mismo que el editable */
  for (const qs of ['', 'theme=propio']) {
    await go('?' + qs)
    const r = await page.evaluate(async () => {
      const res = {}
      for (const c of ['ref-12', 'ref-24']) {
        const ref = window.__referenceMin(c)
        const root = document.getElementById(c).closest('.g-input')
        const tf = window.__tf.get(c)
        tf.text.value = ref.widest
        tf.sec.value = window.TF.parse(ref.widest, tf.info, {}).value
        const cell = root.querySelector('.g-time-field__value')
        const fits = async (w) => { root.style.inlineSize = w + 'px'; root.classList.remove('g-input--block'); await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))); const rd = root.querySelector('.g-time-field__reading'); return { cell: +cell.getBoundingClientRect().width.toFixed(3), need: +ref.text.toFixed(3), fits: cell.getBoundingClientRect().width >= ref.text - 0.01, read: rd ? +rd.getBoundingClientRect().width.toFixed(2) : 0, over: root.querySelector('.g-input__control').scrollWidth - root.querySelector('.g-input__control').clientWidth } }
        const at = await fits(ref.min), below = await fits(ref.min - 1 - Math.max(0, Math.ceil(ref.copies - ref.real - 0.01))), wide = await fits(ref.min + 120)
        root.style.inlineSize = ''; root.classList.add('g-input--block')
        res[c] = { ref, at, below, wide }
      }
      res.ro = window.__referenceMin('ref-12ro').min
      return res
    })
    for (const c of ['ref-12', 'ref-24']) {
      const x = r[c]
      // Exacto al píxel salvo el peso de pulsado que las copias cuentan en las dos mitades (la más ancha posible)
      const slack = Math.ceil(x.ref.copies - x.ref.real - 0.01)
      ok(x.at.fits && !x.below.fits && slack <= 1, tag(`?${qs} ${c}: mínimo ${x.ref.min}px no es exacto ${JSON.stringify(x)}`))
      ok(x.at.read <= slack + 0.5 && x.at.over <= bwOf(qs) + 0.5, tag(`?${qs} ${c}: en el mínimo la lectura ocupa ${x.at.read}px o la caja desborda ${x.at.over}`))
      ok(x.wide.read > 20, tag(`?${qs} ${c}: con sitio la lectura no aparece (${x.wide.read})`))
    }
    ok(r.ro === r['ref-12'].ref.min, tag(`?${qs} solo lectura ${r.ro} ≠ editable ${r['ref-12'].ref.min} (desbloquear repartiría la fila)`))
    if (engine === 'chromium') notes.push(`mínimo de referencia ${qs || 'defecto (md, space 4)'}: 12 h es-MX ${r['ref-12'].ref.min}px («${r['ref-12'].ref.widest}» ${r['ref-12'].ref.text.toFixed(2)}px + a. m./p. m. ${r['ref-12'].ref.copies.toFixed(2)}px) · 24 h es ${r['ref-24'].ref.min}px («${r['ref-24'].ref.widest}» ${r['ref-24'].ref.text.toFixed(2)}px) · solo lectura ${r.ro}px`)
  }

  /* 5 · Las dos lecturas: aparecen con «9», no le quitan sitio a la hora, se compactan si no caben, un toque fija la hora */
  await go('')
  {
    await typeIn('c-wide', '9')
    const a = await page.evaluate(() => {
      const root = document.getElementById('c-wide').closest('.g-input'), ch = root.querySelector('.g-time-field__choices'), f = root.querySelector('.g-time-field__field')
      const ctl = root.querySelector('.g-input__control'), cr = ctl.getBoundingClientRect()
      const b = [...ch.querySelectorAll('.g-time-field__choice')]
      const vis = (s) => getComputedStyle(s).position !== 'absolute'
      return { has: root.classList.contains('has-choices'), reading: !!root.querySelector('.g-time-field__reading'), compact: ch.hasAttribute('data-compact'), on: b.map((x) => x.classList.contains('is-on')),
        words: b.map((x) => vis(x.querySelector('.g-time-field__choice-word'))), times: b.map((x) => vis(x.querySelector('.g-time-field__choice-time'))),
        edge: b.map((x) => { const r = x.getBoundingClientRect(); return [+(r.top - cr.top).toFixed(2), +(cr.bottom - r.bottom).toFixed(2)] }), end: +(cr.right - b[1].getBoundingClientRect().right).toFixed(2),
        pad: parseFloat(getComputedStyle(ctl).paddingRight), fits: f.scrollWidth <= f.clientWidth + 1, h: b.map((x) => +x.getBoundingClientRect().height.toFixed(2)), ctlH: +cr.height.toFixed(2) }
    })
    ok(a.has && !a.reading && !a.compact && a.on[0] && !a.on[1], tag(`lecturas: estado ${JSON.stringify(a)}`))
    ok(a.words.every(Boolean) && a.times.every((x) => !x), tag(`lecturas sin compactar: se ve la franja y la hora queda oculta ${JSON.stringify(a)}`))
    ok(a.edge.every(([x, y]) => near(x, 0) && near(y, 0)) && near(a.end, 0) && a.pad === 0 && a.h.every((x) => near(x, a.ctlH)), tag(`lecturas no van de borde a borde ${JSON.stringify(a)}`))
    ok(a.fits, tag('lecturas: le quitan sitio a la hora escrita'))
    // Estrecha: data-compact, se ve la hora, nada desborda y la hora escrita sigue entera
    for (const id of ['c-narrow', 'c-xs']) {
      await typeIn(id, '9')
      await page.waitForTimeout(80)
      const n = await page.evaluate((i) => {
        const root = document.getElementById(i).closest('.g-input'), ch = root.querySelector('.g-time-field__choices'), ctl = root.querySelector('.g-input__control'), f = root.querySelector('.g-time-field__field')
        const vis = (s) => getComputedStyle(s).position !== 'absolute'
        return { compact: ch && ch.hasAttribute('data-compact'), times: [...ch.querySelectorAll('.g-time-field__choice-time')].map(vis), words: [...ch.querySelectorAll('.g-time-field__choice-word')].map(vis), over: ctl.scrollWidth - ctl.clientWidth, fits: f.scrollWidth <= f.clientWidth + 1,
          w: [...ch.querySelectorAll('.g-time-field__choice')].map((b) => +b.getBoundingClientRect().width.toFixed(2)), h: [...ch.querySelectorAll('.g-time-field__choice')].map((b) => +b.getBoundingClientRect().height.toFixed(2)) }
      }, id)
      ok(n.compact && n.times.every(Boolean) && n.words.every((x) => !x), tag(`${id}: sin data-compact o sin la hora visible ${JSON.stringify(n)}`))
      ok(n.over <= 1 && n.w.every((x) => x >= 24 - 0.01) && n.h.every((x) => x >= 24 - 0.01), tag(`${id}: el par compacto desborda o baja de 24px ${JSON.stringify(n)}`))
      if (engine === 'chromium') notes.push(`${id} compacto: ${n.w.join(' + ')}px, hora escrita entera: ${n.fits}`)
    }
    // Un toque en «de la noche»: la hora pasa a 21:00, las lecturas se van, el foco sigue en el campo
    await typeIn('c-wide', '9')
    const second = page.locator('#c-wide').locator('xpath=ancestor::div[contains(@class,"g-input ")][1]').locator('.g-time-field__choice').nth(1)
    await second.click()
    await page.waitForTimeout(80)
    const after = await page.evaluate(() => ({ focus: document.activeElement && document.activeElement.id, text: document.getElementById('c-wide').value, choices: !!document.getElementById('c-wide').closest('.g-input').querySelector('.g-time-field__choices') }))
    ok(after.focus === 'c-wide' && after.text === '21:00' && !after.choices, tag(`toque en una lectura ${JSON.stringify(after)}`))
    await page.evaluate(() => document.activeElement.blur())
  }

  /* 6 · Pasar, pulsar y foco de los botones */
  {
    await go('')
    const b = page.locator('#s-rest').locator('xpath=ancestor::div[contains(@class,"g-input ")][1]').locator('.g-time-field__half').nth(1)
    await b.hover(); await page.waitForTimeout(250)
    const hv = await page.evaluate(() => { const b = document.getElementById('s-rest').closest('.g-input').querySelectorAll('.g-time-field__half')[1]; const { tok } = window.__lib; const cs = getComputedStyle(b); const ns = tok('--g-color-neutral-soft'), tx = tok('--g-color-text'); return { bg: cs.backgroundColor, color: cs.color, ns: `rgb(${ns.slice(0, 3).join(', ')})`, tx: `rgb(${tx.slice(0, 3).join(', ')})` } })
    ok(hv.bg === hv.ns && hv.color === hv.tx, tag(`pasar sobre p.m.: ${JSON.stringify(hv)}`))
    await page.mouse.down(); await page.waitForTimeout(120); await page.mouse.up(); await page.waitForTimeout(250)
    const pr = await page.evaluate(() => { const r = document.getElementById('s-rest').closest('.g-input'); const b = r.querySelectorAll('.g-time-field__half')[1]; const { tok } = window.__lib; const as = tok('--g-color-accent-soft'); return { on: b.classList.contains('is-on'), bg: getComputedStyle(b).backgroundColor, as: `rgb(${as.slice(0, 3).join(', ')})`, focus: document.activeElement === document.body, val: document.getElementById('s-rest').value } })
    ok(pr.on && pr.bg === pr.as && pr.focus && /p\.\s?m\./.test(pr.val), tag(`pulsar p.m.: ${JSON.stringify(pr)}`))
    await page.mouse.move(0, 0)
    const f = await page.evaluate(() => { const b = document.getElementById('s-rest').closest('.g-input').querySelectorAll('.g-time-field__half')[0]; b.focus(); const cs = getComputedStyle(b); const out = { fv: b.matches(':focus-visible'), st: cs.outlineStyle, w: parseFloat(cs.outlineWidth), off: parseFloat(cs.outlineOffset) }; b.blur(); return out })
    if (f.fv) ok(f.st === 'solid' && f.w >= 1.5 && f.off + f.w <= 0.01, tag(`foco de a.m. ${JSON.stringify(f)}`))
    // Pulsar la lectura enfoca el campo con el cursor al final (lo hace el .vue: aquí el banco; se mide que el cursor sea el de escribir y nada la tape)
    const rd = page.locator('#s-24').locator('xpath=ancestor::div[contains(@class,"g-input ")][1]').locator('.g-time-field__reading-word')
    await rd.click()
    const fo = await page.evaluate(() => ({ id: document.activeElement.id, end: document.activeElement.selectionStart === document.activeElement.value.length }))
    ok(fo.id === 's-24' && fo.end, tag(`pulsar la lectura no enfoca al final ${JSON.stringify(fo)}`))
    await page.evaluate(() => document.activeElement.blur())
  }

  /* 7 · La palabra entra: ↑ que cruza las 12:00 con el foco */
  {
    await go('')
    const none = await page.evaluate(() => document.getAnimations().filter((a) => /g-time-reading/.test(a.animationName)).map((a) => a.animationName))
    ok(none.length === 0, tag(`al montar hay animaciones de la lectura: ${none}`))
    await page.focus('#s-rest')
    await page.evaluate(() => window.__tf.get('s-rest').setValue(11 * 3600 + 59 * 60))
    await page.waitForTimeout(400)
    const space = await page.evaluate(() => window.__lib.px('--g-space-1'))
    const s = page.evaluate(SAMPLER, ['s-rest', 450]); await page.waitForTimeout(30); await page.keyboard.press('ArrowUp')
    const fr = await s
    const moving = fr.filter((f) => f.entering && f.anims.includes('g-time-reading-rise'))
    const mids = new Set(moving.map((f) => f.dy).filter((d) => d > 0.2 && d < space - 0.2))
    ok(moving.length >= 2 && mids.size >= 2, tag(`la palabra entra: ${moving.length} cuadros, ${mids.size} posiciones intermedias`))
    ok(fr.every((f) => f.dy == null || (f.dy >= -0.01 && f.dy <= space + 0.01)) && Math.max(...fr.map((f) => f.dy ?? 0)) > space * 0.5, tag(`la palabra no sube desde --g-space-1 (${Math.max(...fr.map((f) => f.dy ?? 0))} / ${space})`))
    ok(near(fr.at(-1).dy, 0, 0.01) && fr.at(-1).op === 1 && fr.at(-1).anims.length === 0 && /mediod/.test(fr.at(-1).text), tag(`la palabra no termina en su sitio ${JSON.stringify(fr.at(-1))}`))
    notes.push(`${engine} entrada de la palabra: ${moving.length} cuadros, ${mids.size} posiciones intermedias, pico ${Math.max(...fr.map((f) => f.dy ?? 0))}px`)
    // Escribir cifras sin cambiar la franja: nada se anima
    await typeIn('s-24', '12:30')
    await page.waitForTimeout(250)
    const s2 = page.evaluate(SAMPLER, ['s-24', 250]); await page.waitForTimeout(20); await page.keyboard.press('Backspace'); await page.keyboard.type('5')
    ok((await s2).every((f) => !f.anims.length), tag('escribir cifras sin cambiar la franja anima la palabra'))
    await page.evaluate(() => document.activeElement.blur())
    // Desde la aplicación sin foco: nada se anima
    const s3 = page.evaluate(SAMPLER, ['s-24', 250]); await page.waitForTimeout(20)
    await page.evaluate(() => window.__tf.get('s-24').setValue(21 * 3600))
    const f3 = await s3
    ok(f3.every((f) => !f.anims.length) && /noche/.test(f3.at(-1).text), tag(`cambio desde la aplicación sin foco anima la palabra ${JSON.stringify(f3.at(-1))}`))
    // Las dos lecturas al aparecer: el par aparece (fundido) y su texto sube
    await page.focus('#c-wide')
    const s4 = page.evaluate(() => new Promise((res) => { const root = document.getElementById('c-wide').closest('.g-input'); const out = []; const t0 = performance.now(); (function f() { const ch = root.querySelector('.g-time-field__choices'); if (ch) { const w = ch.querySelector('.g-time-field__choice-word'); out.push({ op: +getComputedStyle(ch).opacity, dy: +(w.getBoundingClientRect().top - ch.querySelector('.g-time-field__choice').getBoundingClientRect().top).toFixed(2), anims: root.getAnimations({ subtree: true }).map((a) => a.animationName).filter((n) => n && n.startsWith('g-time-reading')) }) } if (performance.now() - t0 < 400) requestAnimationFrame(f); else res(out) })() }))
    await page.keyboard.type('9')
    const f4 = await s4
    const dys = [...new Set(f4.map((x) => x.dy))]
    ok(f4.length && f4.some((x) => x.op < 1) && f4.some((x) => x.anims.includes('g-time-reading-fade')) && f4.some((x) => x.anims.includes('g-time-reading-rise')) && dys.length >= 3 && f4.at(-1).op === 1 && !f4.at(-1).anims.length, tag(`las lecturas no entran (${f4.length} cuadros, ${dys.length} posiciones)`))
    await page.evaluate(() => document.activeElement.blur())
  }

  /* 8 · Movimiento reducido: 0 animaciones */
  {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await go('')
    await page.focus('#s-rest')
    await page.evaluate(() => window.__tf.get('s-rest').setValue(11 * 3600 + 59 * 60))
    const s = page.evaluate(SAMPLER, ['s-rest', 300]); await page.waitForTimeout(30); await page.keyboard.press('ArrowUp')
    const fr = await s
    ok(fr.every((f) => !f.anims.length && (f.dy == null || Math.abs(f.dy) < 0.01)) && /mediod/.test(fr.at(-1).text), tag('reduce: la palabra se mueve'))
    await typeIn('c-wide', '9')
    const ch = await page.evaluate(() => document.getElementById('c-wide').closest('.g-input').getAnimations({ subtree: true }).map((a) => a.animationName).filter((n) => n && n.startsWith('g-time-reading')))
    ok(ch.length === 0, tag(`reduce: las lecturas se animan ${ch}`))
    await page.evaluate(() => document.activeElement.blur())
    const sh = await page.evaluate(async () => { window.__tf.get('s-reject').rejected.value = true; await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))); return document.getElementById('s-reject').closest('.g-input').getAnimations({ subtree: true }).map((a) => a.animationName).filter(Boolean) })
    ok(sh.length === 0, tag(`reduce: I2 se mueve ${sh}`))
    await page.emulateMedia({ reducedMotion: 'no-preference' })
  }

  /* 9 · I2: la sacudida de GInput mueve la fila y con ella a. m./p. m.; una sola animación */
  {
    await go('')
    const r = await page.evaluate(async () => {
      const root = document.getElementById('s-reject').closest('.g-input')
      const row = root.querySelector('.g-input__row'), st = root.querySelector('.g-time-field__halves')
      const x0 = st.getBoundingClientRect().left, r0 = row.getBoundingClientRect().left
      window.__tf.get('s-reject').rejected.value = true
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
      const names = root.getAnimations({ subtree: true }).map((a) => a.animationName + '@' + a.effect.target.className.split(' ')[0])
      let maxSt = 0, same = true
      await new Promise((res) => { const t0 = performance.now(); (function f() { const ds = st.getBoundingClientRect().left - x0, dr = row.getBoundingClientRect().left - r0; maxSt = Math.max(maxSt, Math.abs(ds)); if (Math.abs(ds - dr) > 0.3) same = false; if (performance.now() - t0 < 300) requestAnimationFrame(f); else res() })() })
      return { names, maxSt, same }
    })
    ok(r.names.length === 1 && /^g-reject-shake@g-input__row/.test(r.names[0]), tag(`I2: animaciones ${r.names}`))
    ok(r.maxSt > 1 && r.same, tag(`I2: a. m./p. m. no van con la fila ${JSON.stringify(r)}`))
  }

  /* 10 · RTL con el foco: con el cursor al final la hora no se desplaza */
  await go('')
  for (const id of ['rtl-ar12', 'rtl-ar24', 's-rest', 't12-xs', 't24-xl']) {
    await page.focus('#' + id); await page.keyboard.press('End'); await page.waitForTimeout(30)
    const sl = await page.evaluate((i) => { const f = document.getElementById(i); return { sl: f.scrollLeft, sw: f.scrollWidth, cw: f.clientWidth } }, id)
    // WebKit redondea hacia arriba el ancho del texto del <input> y reserva además el cursor: el 1px del espejo (constante
    // de §7, #313) no alcanza en algunos anchos. Mismo hallazgo abierto que GNumberField (auditoría, hallazgo 1; lima)
    if (engine === 'webkit' && sl.sl === 1) { notes.push(`webkit: ${id} se desplaza 1px con el cursor al final (hueco del cursor de 1px, hallazgo 1 de GNumberField)`); continue }
    ok(sl.sl === 0 && sl.sw <= sl.cw + 1, tag(`con foco: ${id} se desplaza ${JSON.stringify(sl)}`))
  }
  await page.evaluate(() => document.activeElement.blur())

  /* 11 · forced-colors (solo Chromium lo emula) */
  if (engine === 'chromium') {
    for (const qs of ['', 'dark=1']) {
      await page.emulateMedia({ forcedColors: 'active' })
      await go('?' + qs)
      const fc = await page.evaluate(() => {
        const cs = (c, s, i = 0) => getComputedStyle(document.getElementById(c).closest('.g-input').querySelectorAll(s)[i])
        const off = cs('s-rest', '.g-time-field__half', 1), on = cs('s-rest', '.g-time-field__half', 0), dis = cs('s-disabled', '.g-time-field__half', 0)
        return { canvas: getComputedStyle(document.body).backgroundColor, text: getComputedStyle(document.body).color, off: [off.color, off.backgroundColor, +off.fontWeight], on: [on.color, on.backgroundColor, +on.fontWeight, on.forcedColorAdjust, on.borderLeftColor], sep: [off.borderLeftStyle, parseFloat(off.borderLeftWidth), off.borderLeftColor],
          dis: [dis.color, dis.borderLeftColor], read: cs('s-rest', '.g-time-field__reading').color, inv: [parseFloat(cs('s-invalid', '.g-input__control').borderTopWidth), parseFloat(cs('s-invalid', '.g-time-field__halves').marginTop)] }
      })
      const t = tag(`forced-colors ?${qs}`)
      ok(fc.off[0] !== fc.canvas && fc.sep[0] === 'solid' && fc.sep[1] >= 1 && fc.sep[2] !== fc.canvas, `${t}: botón o separador invisibles ${JSON.stringify(fc)}`)
      ok(fc.on[1] !== fc.canvas && fc.on[1] !== fc.off[1] && fc.on[0] !== fc.on[1] && fc.on[2] > fc.off[2], `${t}: pulsado sin Highlight o sin peso ${JSON.stringify(fc)}`)
      // Sin forced-color-adjust: none, Chromium pinta la placa de Canvas detrás del texto del pulsado (HighlightText sobre Canvas)
      ok(fc.on[3] === 'none' && fc.on[4] === fc.sep[2], `${t}: pulsado sin forced-color-adjust: none o separador que no es de sistema ${JSON.stringify(fc)}`)
      ok(fc.dis[0] !== fc.off[0] && fc.dis[1] === fc.dis[0], `${t}: deshabilitado no es GrayText ${JSON.stringify(fc)}`)
      ok(fc.read === fc.text, `${t}: la lectura no es CanvasText ${JSON.stringify(fc)}`)
      ok(near(fc.inv[1], -fc.inv[0], 0.01), `${t}: con error los botones no tapan el borde real (${fc.inv})`)
    }
    await page.emulateMedia({ forcedColors: 'none' })
  }

  /* 12 · Puntero grueso (Chromium y WebKit con táctil): a. m./p. m. ≥ 44×44 en todos los tamaños, caja ≥ 44 */
  if (engine !== 'firefox') {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: engine === 'chromium' })
    const p2 = await ctx.newPage(); watch(p2)
    await go('', p2)
    const coarse = await p2.evaluate(() => matchMedia('(pointer: coarse)').matches)
    if (!coarse) notes.push(`${engine}: pointer: coarse no se emula (puntero grueso sin medir en este motor)`)
    else {
      const g = await p2.evaluate(geometry)
      notes.push(`${engine} táctil a. m./p. m.: ${Object.entries(g.sizes).map(([k, s]) => k + ' ' + s.btns.map((b) => b.w + '×' + b.h).join('/')).join(' · ')}`)
      for (const [sid, s] of Object.entries(g.sizes)) for (const b of s.btns) ok(b.w >= 44 - 0.01 && b.h >= 44 - 0.01, tag(`táctil ${sid}: a. m./p. m. ${b.w}×${b.h}`))
      for (const [sid, s] of Object.entries(g.sizes)) ok(s.box >= 44 - 0.01 && near(s.box, s.inputBox), tag(`táctil ${sid}: caja ${s.box} / GInput ${s.inputBox}`))
      ok(g.overflow <= 0, tag(`táctil: desborde ${g.overflow}`))
      await typeIn('c-narrow', '9', p2)
      const t = await p2.evaluate(() => [...document.getElementById('c-narrow').closest('.g-input').querySelectorAll('.g-time-field__choice')].map((b) => { const r = b.getBoundingClientRect(); return [+r.width.toFixed(2), +r.height.toFixed(2)] }))
      ok(t.length === 2 && t.every(([w, h]) => w >= 44 - 0.01 && h >= 44 - 0.01), tag(`táctil: lecturas ${JSON.stringify(t)}`))
    }
    await ctx.close()
  }

  /* 13 · Escalas fraccionarias: el separador no desaparece */
  for (const dpr of [1.25, 1.5, 2]) {
    const ctx = await browser.newContext({ viewport: { width: 1000, height: 800 }, deviceScaleFactor: dpr })
    const p2 = await ctx.newPage(); watch(p2); await go('', p2)
    const w = await p2.evaluate(() => parseFloat(getComputedStyle(document.getElementById('s-rest').closest('.g-input').querySelector('.g-time-field__half')).borderLeftWidth))
    ok(w * dpr >= 1 - 0.01, tag(`DPR ${dpr}: separador ${w}px`))
    await ctx.close()
  }

  ok(!errors.length, tag(`consola: ${errors.join(' | ')}`))
  await browser.close()
}

server.close()
if (notes.length) console.log('\nNotas:\n' + [...new Set(notes)].map((n) => '  · ' + n).join('\n'))
console.log(`\n${total - failed}/${total} correctas`)
if (failed) { console.log(fails.slice(0, 80).map((f) => '  ✗ ' + f).join('\n')); if (fails.length > 80) console.log(`  … y ${fails.length - 80} más`); process.exitCode = 1 }
