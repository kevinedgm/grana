// Auditoría de coco (paso 5) de GNumberField sobre el COMPONENTE REAL: design/lab/number-field/auditoria-banco.html con
// GNumberField, GInput, GSelect, GForm, GFormLayout, GFormRow, GErrorSummary y GSwitch de dist/ (grana.umd.js y
// grana.css, como se publica). Repite la batería del banco de estilo (estilo-verificar.mjs) sobre el marcado que pone
// GNumberField.vue y añade lo que solo existe con el componente real: marcado frente al que espera el CSS; mínimo publicado
// a una GFormRow real (#312: la fila se parte antes de que «99» deje de caber y el mínimo no sobrecuenta el hueco libre de
// P1); bloquear/desbloquear sin repartir la fila (#266); is-rejected puesto por GForm en un envío y foco desde
// GErrorSummary; I1 del mensaje; retirada de P2/P3 con los tiempos reales del .vue; reglas de g-number-field en
// dist/grana.css; zoom 200 % aproximado; el playground (#sec-number y signos vitales); y, con --old-dist, que GInput SIN
// slots internos pinta exactamente lo mismo que antes de GNumberField (auditoria-ginput.html con el dist/ actual y el
// anterior).
// Temas: defecto claro y oscuro, el de la auditoría (auditoria-tema.css, @grana/cli: brand #5B1A3A, radius 16, shape pill,
// space 5, fontSize 17) claro y oscuro, «Tema de prueba» (Georgia, borde 2px, space 5) y los once generados de
// design/lab/tema-oscuro/dark-color-presence/generated/ claro y oscuro: 27 configuraciones de contraste por motor.
// Ejecutar desde la raíz del repo (requiere `npm run build`): node design/lab/number-field/auditoria-verificar.mjs
// Opcional: --engines=chromium,firefox,webkit   --old-dist=<carpeta dist/ construida desde c466132>   --verbose
// Puerto: GRANA_PW_PORT (coco usa 4209; sin él, uno libre)
import http from 'node:http'
import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const pw = await import(new URL('../theme-playground/node_modules/playwright/index.mjs', import.meta.url))
const ROOT = fileURLToPath(new URL('../../../', import.meta.url))
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')).map(([k, v]) => [k, v ?? true]))
const ENGINES = (args.engines || 'chromium,firefox,webkit').split(',')
const OLD = typeof args['old-dist'] === 'string' && existsSync(join(args['old-dist'], 'grana.umd.js')) ? args['old-dist'] : null
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const server = http.createServer(async (req, res) => {
  try {
    const p = normalize(join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname)))
    if (!p.startsWith(ROOT)) throw new Error('fuera')
    const body = await readFile(p)
    res.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream' }).end(body)
  } catch { res.writeHead(404).end() }
})
await new Promise((r) => server.listen(Number(process.env.GRANA_PW_PORT) || 0, '127.0.0.1', r))
const ORIGIN = `http://127.0.0.1:${server.address().port}`
const BASE = `${ORIGIN}/design/lab/number-field/auditoria-banco.html`
const PLAY = `${ORIGIN}/packages/vue/playground/index.html`

const GEN = ['amazon', 'apple', 'caracol-purpura', 'github', 'grana', 'linear', 'lustre', 'medium', 'notion', 'spotify', 'stripe']
let total = 0, failed = 0
const fails = []
const notes = []
const ok = (cond, msg) => { total++; if (!cond) { failed++; fails.push(msg) } }
const near = (a, b, t = 0.5) => Math.abs(a - b) <= t

/* ---------- 0 · Análisis estático del CSS ---------- */
{
  const raw = await readFile(join(ROOT, 'packages/vue/src/components/GNumberField/GNumberField.css'), 'utf8')
  const css = raw.replace(/\/\*[\s\S]*?\*\//g, '')
  ok(!/#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|lab|lch)\(/.test(css), 'CSS: color literal')
  ok(!/var\(\s*--[\w-]+\s*,/.test(css), 'CSS: var() con valor de respaldo')
  ok(!/@layer/.test(css), 'CSS: @layer en el archivo')
  ok(!/@property/.test(css), 'CSS: @property (sin propiedades nuevas)')
  ok(!/!important/.test(css), 'CSS: !important')
  const vars = [...css.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1])
  ok(vars.every((v) => v.startsWith('--g-') || v.startsWith('--_')), 'CSS: var() que no es --g-* ni --_*: ' + vars.filter((v) => !/^--(g|_)/.test(v)))
  const defaults = await readFile(join(ROOT, 'packages/vue/src/styles/defaults.css'), 'utf8')
  const defined = new Set([...defaults.matchAll(/(--g-[a-z0-9-]+)\s*:/g)].map((m) => m[1]))
  const missing = [...new Set(vars.filter((v) => v.startsWith('--g-') && !defined.has(v)))]
  ok(!missing.length, 'CSS: tokens que no existen en defaults.css ' + missing)
  // Alias propios: solo los de GInput (--_h, --_fs, --_lh, --_radius, --_focus) y los --_nf-* declarados aquí
  const own = new Set([...css.matchAll(/(--_[\w-]+)\s*:/g)].map((m) => m[1]))
  const fromInput = ['--_h', '--_fs', '--_lh', '--_radius', '--_focus']
  const strange = [...new Set(vars.filter((v) => v.startsWith('--_') && !own.has(v) && !fromInput.includes(v)))]
  ok(!strange.length, 'CSS: alias --_* que no son de GInput ni propios: ' + strange)
  ok([...own].every((v) => v.startsWith('--_nf-')), 'CSS: alias propio sin prefijo --_nf- (no pisar los de GInput): ' + [...own])
  // Literales de medida: 24px, 44px, 1px (texto oculto y hueco del cursor, #313); 1ch (#187); 0.5 (P3, #313); 100% (P2)
  const px = [...css.matchAll(/(-?\d*\.?\d+)px/g)].map((m) => m[0])
  ok(px.every((p) => ['24px', '44px', '1px', '-1px'].includes(p)), 'CSS: medidas literales no permitidas ' + px.filter((p) => !['24px', '44px', '1px', '-1px'].includes(p)))
  const onePx = css.split('\n').filter((l) => /\b-?1px\b/.test(l)).map((l) => l.trim())
  ok(onePx.every((l) => /^(inline-size|block-size|margin): -?1px;$/.test(l) || l === 'padding-inline-end: 1px;'), 'CSS: 1px fuera del texto oculto y del hueco del cursor: ' + onePx)
  ok(css.split('\n').filter((l) => /padding-inline-end: 1px/.test(l)).length === 2, 'CSS: el hueco del cursor (1px) debe estar en el espejo y el medidor, y solo ahí')
  const nums = [...css.matchAll(/\*\s*(-?\d*\.?\d+)\b(?!px|ms|%)/g)].map((m) => m[1])
  ok(nums.every((n) => ['-1', '2', '0.5', '-0.5'].includes(n)), 'CSS: factores fuera de −1, 2 (doble trazo de GInput) y 0.5 (P3): ' + nums)
  // Keyframes: nombres g-number-roll… / g-number-bump…, nunca g-reject…
  const kf = [...css.matchAll(/@keyframes\s+([\w-]+)/g)].map((m) => m[1])
  ok(kf.length === 6 && kf.every((k) => /^g-number-(roll|bump)-/.test(k)), 'CSS: keyframes ' + kf)
  ok(!/g-reject/.test(css), 'CSS: nombra g-reject… (GInput y GForm retiran is-rejected por ese prefijo)')
  ok(!/is-rejected/.test(css), 'CSS: regla propia para is-rejected (la sacudida es de GInput, no se repite)')
  // Toda declaración `animation` está dentro de @media (prefers-reduced-motion: no-preference); hover dentro de (hover: hover)
  let depth = 0, ctx = []
  const anim = [], hov = []
  let pending = ''
  for (const t of css.split(/([{}])/)) {
    if (t === '{') { ctx.push(pending.trim()); depth++; pending = '' }
    else if (t === '}') { ctx.pop(); depth--; pending = '' }
    else {
      pending += t
      if (/(^|;|\s)animation\s*:/.test(t) && !ctx.some((c) => /@keyframes/.test(c))) anim.push(ctx.join(' » '))
      if (ctx.length && /:hover/.test(ctx[ctx.length - 1]) && /:/.test(t)) hov.push(ctx.join(' » '))
    }
  }
  ok(anim.length >= 6 && anim.every((c) => /@media \(prefers-reduced-motion: no-preference\)/.test(c)), 'CSS: animación fuera de no-preference: ' + anim.filter((c) => !/no-preference/.test(c)))
  ok(hov.every((c) => /@media \(hover: hover\)/.test(c)), 'CSS: :hover fuera de @media (hover: hover): ' + hov.filter((c) => !/hover: hover/.test(c)))
  ok(/@media \(forced-colors: active\)/.test(css), 'CSS: sin bloque de forced-colors')
  ok(/touch-action: manipulation/.test(css) && /-webkit-touch-callout: none/.test(css) && /user-select: none/.test(css), 'CSS: −/+ sin touch-action/selección/menú de toque largo')
  ok(/@media \(pointer: coarse\)/.test(css), 'CSS: sin puntero grueso')
  ok((css.match(/tabular-nums/g) || []).length >= 4, 'CSS: tabular-nums en campo, espejo, medidor y capa')
  ok(/--g-duration-press\) var\(--g-ease-out\)/.test(css) && !/cubic-bezier|steps\(|linear\b/.test(css), 'CSS: P2/P3 sin --g-duration-press + --g-ease-out o con curva propia')
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
  return { parse, over, bgOf, ratio, tok, px }
}

const contrast = () => {
  const { parse, over, bgOf, ratio, tok } = window.__lib
  const out = []
  const add = (k, fg, bg, min) => out.push({ k, r: ratio(over(fg, bg), bg), min })
  for (const root of document.querySelectorAll('.g-number-field[data-case]')) {
    if (root.classList.contains('is-disabled')) continue
    const id = root.dataset.case
    const ctl = root.querySelector('.g-input__control')
    const f = root.querySelector('.g-number-field__field')
    if (f.value) add(`${id} valor`, parse(getComputedStyle(f).color), bgOf(ctl), 4.5)
    for (const s of root.querySelectorAll('.g-input__suffix, .g-input__prefix')) add(`${id} ${s.className.slice(9)}`, parse(getComputedStyle(s).color), bgOf(ctl), 4.5)
    for (const b of root.querySelectorAll('.g-number-field__step')) {
      add(`${id} separador ${b.className.slice(-9)}`, parse(getComputedStyle(b).borderInlineStartColor), bgOf(ctl), 3)
      if (!b.disabled) add(`${id} icono ${b.className.slice(-9)}`, parse(getComputedStyle(b).color), bgOf(b), 3)
    }
  }
  // Pasar y pulsar: icono --g-color-text sobre --g-color-neutral-soft; separador junto al fondo de pasar
  const ns = over(tok('--g-color-neutral-soft'), tok('--g-color-surface'))
  add('pasar: icono text / neutral-soft', tok('--g-color-text'), ns, 4.5)
  add('pasar: separador border-control / neutral-soft', tok('--g-color-border-control'), ns, 3)
  return out
}

const geometry = () => {
  const { px } = window.__lib
  const R = (el) => el.getBoundingClientRect()
  const q = (c) => { const el = document.querySelector(`[data-case="${c}"]`); return el && el.closest('.g-input, .g-select') || el }
  const space = px('--g-space-1'), bw = px('--g-border-width')
  const UNITS = { xs: 6, sm: 7, md: 9, lg: 11, xl: 13 }, GAP = { xs: '--g-space-1', sm: '--g-space-1', md: '--g-space-2', lg: '--g-space-2', xl: '--g-space-3' }, DEN = { default: 1, compact: 0.75 }
  const g = { space, bw, sizes: {}, p1: {}, states: {}, tab: {}, rows: [], rtl: {}, n320: {}, overflow: document.documentElement.scrollWidth - innerWidth }
  for (const sid of ['xs', 'sm', 'md', 'lg', 'xl', 'md-compact', 'xs-compact']) {
    const [size, den = 'default'] = sid.split('-')
    const h = Math.max(24, space * UNITS[size] * DEN[den])
    const st = q('st-' + sid), ctl = st.querySelector('.g-input__control'), c = R(ctl)
    const btns = [...st.querySelectorAll('.g-number-field__step')].map((b) => { const r = R(b); return { w: +r.width.toFixed(2), h: +r.height.toFixed(2), top: +(r.top - c.top).toFixed(2), bottom: +(c.bottom - r.bottom).toFixed(2), right: +(c.right - r.right).toFixed(2) } })
    g.sizes[sid] = { expected: +h.toFixed(2), btns, box: +c.height.toFixed(2), inputBox: +R(q('in-' + sid).querySelector('.g-input__control')).height.toFixed(2), nfBox: +R(q('nf-' + sid).querySelector('.g-input__control')).height.toFixed(2),
      icon: +R(st.querySelector('.g-number-field__step .g-icon')).width.toFixed(2), fs: parseFloat(getComputedStyle(st.querySelector('.g-number-field__field')).fontSize) }
    const gap = px(GAP[size]) * DEN[den]
    g.p1[sid] = { expected: gap, gaps: [], ink: [] }
    for (const n of [1, 4, 6]) {
      const r = q(`p1-${sid}-${n}`)
      const v = R(r.querySelector('.g-number-field__value')), sf = R(r.querySelector('.g-input__suffix'))
      const m = r.querySelector('.g-number-field__mirror'); const range = document.createRange(); range.selectNodeContents(m)
      g.p1[sid].gaps.push(+(sf.left - v.right).toFixed(2))
      g.p1[sid].ink.push(+(sf.left - range.getBoundingClientRect().right).toFixed(2))
    }
    // Sin P1 el sufijo estaría al final de la caja: aquí está pegado
    const r7 = q(`p1-${sid}-1`)
    g.p1[sid].fromStart = +(R(r7.querySelector('.g-input__suffix')).left - R(r7.querySelector('.g-number-field__field')).left).toFixed(2)
    g.p1[sid].boxW = +R(r7.querySelector('.g-input__control')).width.toFixed(2)
  }
  for (const c of ['s-rest', 's-invalid', 's-warning', 's-soft', 's-pill', 's-disabled', 's-valid', 's-prefix']) {
    const root = q(c), ctl = root.querySelector('.g-input__control'), cr = R(ctl)
    const b = [...root.querySelectorAll('.g-number-field__step')]
    const cs = b.map((x) => getComputedStyle(x))
    g.states[c] = {
      cover: b.map((x) => { const r = R(x); return [+(r.top - cr.top).toFixed(2), +(cr.bottom - r.bottom).toFixed(2), +(cr.right - r.right).toFixed(2)] }),
      blockBorder: cs.map((s) => [s.borderTopColor, parseFloat(s.borderTopWidth), s.backgroundClip]),
      endBorder: cs.length ? [parseFloat(cs.at(-1).borderRightWidth), cs.at(-1).borderRightColor] : null,
      sep: cs.map((s) => [s.borderLeftStyle, parseFloat(s.borderLeftWidth)]),
      radius: cs.length ? [cs.at(-1).borderTopRightRadius, getComputedStyle(ctl).borderTopRightRadius] : null,
      ctlBorder: parseFloat(getComputedStyle(ctl).borderTopWidth),
      sq: b.map((x) => { const r = R(x); return [+r.width.toFixed(2), +r.height.toFixed(2)] }),
      cursor: [getComputedStyle(ctl).cursor, cs[0] && cs[0].cursor, cs[0] && getComputedStyle(b[0].parentElement).cursor]
    }
  }
  // P1: el <input> mide lo que el espejo; su texto no desborda (WebKit redondea scrollWidth hacia arriba: ±1). El
  // desplazamiento con el cursor al final se mide aparte, con el foco
  g.scrolls = [...document.querySelectorAll('.g-number-field[data-case]:not([data-case="n320-long"]) .g-number-field__field')].filter((f) => f.scrollWidth > f.clientWidth + 1).map((f) => f.id + ' ' + f.scrollWidth + '/' + f.clientWidth)
  g.readonly = { steppers: q('s-readonly').querySelectorAll('.g-number-field__steppers').length, pad: parseFloat(getComputedStyle(q('s-readonly').querySelector('.g-input__control')).paddingRight) }
  for (const [k, sel] of [['field', '.g-number-field__field'], ['mirror', '.g-number-field__mirror'], ['measure', '.g-number-field__measure']]) {
    const el = q('r-qty-1100').querySelector(sel)
    g.tab[k] = getComputedStyle(el).fontVariantNumeric
  }
  // Medidor fuera de flujo: no cambia la caja
  const mq = q('r-qty-1100').querySelector('.g-number-field__measure')
  g.measure = { pos: getComputedStyle(mq).position, vis: getComputedStyle(mq).visibility, font: getComputedStyle(mq).fontSize === getComputedStyle(q('r-qty-1100').querySelector('.g-number-field__field')).fontSize }
  // Filas reales: cajas de la misma línea con el mismo top (±1) y la misma altura
  for (const row of document.querySelectorAll('.g-form-row[data-row]')) {
    const kids = [...row.children].map((k) => ({ c: k.dataset.case, rootTop: R(k).top, top: +R(k.querySelector('.g-input__control, .g-select__trigger, .g-select__control') || k).top.toFixed(2), h: +R(k.querySelector('.g-input__control, .g-select__trigger, .g-select__control') || k).height.toFixed(2) }))
    const lines = []
    for (const k of kids) { const l = lines.find((x) => Math.abs(x[0].rootTop - k.rootTop) < 2); if (l) l.push(k); else lines.push([k]) }
    g.rows.push({ row: row.dataset.row, lines: lines.map((l) => l.map(({ c, top, h }) => ({ c, top, h }))) })
  }
  // RTL: −/+ a la izquierda del valor, el sufijo pegado al valor por la izquierda, + en el extremo
  for (const c of ['rtl-ar', 'rtl-he']) {
    const r = q(c), v = R(r.querySelector('.g-number-field__value')), sf = R(r.querySelector('.g-input__suffix')), st = R(r.querySelector('.g-number-field__steppers'))
    const inc = R(r.querySelector('.g-number-field__step--increment')), dec = R(r.querySelector('.g-number-field__step--decrement')), ctl = R(r.querySelector('.g-input__control'))
    g.rtl[c] = { gap: +(v.left - sf.right).toFixed(2), stepsLeft: st.right <= sf.left + 0.5, incLeft: inc.right <= dec.left + 0.5, edge: +(inc.left - ctl.left).toFixed(2), align: (() => { const d = document.createElement('span'); d.className = 'g-number-field__roll'; d.dir = 'ltr'; d.style.cssText = 'display:block;inline-size:200px;position:absolute'; d.textContent = '12'; r.querySelector('.g-number-field__value').append(d); const rg = document.createRange(); rg.selectNodeContents(d); const out = R(d).right - rg.getBoundingClientRect().right; d.remove(); return +out.toFixed(2) })(), dir: r.querySelector('.g-number-field__field').getAttribute('dir') }
  }
  // 320: número largo; la celda encoge y la unidad sigue entera dentro de la caja
  {
    const r = q('n320-long'), ctl = r.querySelector('.g-input__control'), cr = R(ctl), sf = R(r.querySelector('.g-input__suffix')), st = R(r.querySelector('.g-number-field__steppers'))
    const m = r.querySelector('.g-number-field__mirror')
    g.n320 = { ctlOverflow: ctl.scrollWidth - ctl.clientWidth, sufIn: sf.left >= cr.left && sf.right <= st.left + 0.5, sufW: +sf.width.toFixed(2), sufNatural: r.querySelector('.g-input__suffix').scrollWidth, shrunk: m.scrollWidth > m.clientWidth + 1, rootOut: R(r).right - R(r.parentElement).right }
  }
  return g
}

// Muestreo por cuadro (rAF) de la celda: capas, ranuras, desplazamiento de cada cifra nueva respecto a su ranura
const SAMPLER = ([id, ms]) => new Promise((res) => {
  const root = document.querySelector(`[data-case="${id}"]`)
  const v = root.querySelector('.g-number-field__value'), f = root.querySelector('.g-number-field__field')
  const ctl = root.querySelector('.g-input__control')
  const y0 = v.getBoundingClientRect().top - ctl.getBoundingClientRect().top
  const out = [], t0 = performance.now()
  ;(function frame() {
    const layer = v.querySelector('.g-number-field__roll')
    const slots = [...v.querySelectorAll('.g-number-field__roll-slot')]
    out.push({ t: +(performance.now() - t0).toFixed(1), layer: !!layer, rolling: v.classList.contains('is-rolling'), bumping: v.classList.contains('is-bumping'), dir: layer && layer.dataset.direction, n: slots.length,
      off: slots.map((s) => +(s.querySelector('.g-number-field__roll-new').getBoundingClientRect().top - s.getBoundingClientRect().top).toFixed(2)),
      offOld: slots.map((s) => { const o = s.querySelector('.g-number-field__roll-old'); return o ? +(o.getBoundingClientRect().top - s.getBoundingClientRect().top).toFixed(2) : null }),
      anim: slots.map((s) => getComputedStyle(s.querySelector('.g-number-field__roll-new')).animationName),
      val: f.value, dy: +(v.getBoundingClientRect().top - ctl.getBoundingClientRect().top - y0).toFixed(2), fieldColor: getComputedStyle(f).color, caret: getComputedStyle(f).caretColor,
      layerColor: layer ? getComputedStyle(layer).color : null,
      align: layer ? (() => {
        // Cada carácter de la capa frente al mismo carácter del espejo (mismo texto): x igual; y igual menos el desplazamiento
        const mt = root.querySelector('.g-number-field__mirror').firstChild
        const at0 = (node, i, j) => { const r = document.createRange(); r.setStart(node, i); r.setEnd(node, j); return r.getBoundingClientRect() }
        // WebKit redondea al píxel el rectángulo de un solo carácter: la x del carácter i del espejo sale del ancho acumulado
        const at = (node, i, j) => { if (node !== mt) return at0(node, i, j); const a = at0(mt, 0, 1), w = i ? at0(mt, 0, i).width : 0; return { left: a.left + w, top: at0(mt, i, j).top } }
        let idx = 0, worst = [0, 0]
        for (const n of layer.childNodes) {
          if (n.nodeType === 3) { for (let i = 0; i < n.length; i++) { const a = at(n, i, i + 1), b = at(mt, idx + i, idx + i + 1); worst = [Math.max(worst[0], Math.abs(a.left - b.left)), Math.max(worst[1], Math.abs(a.top - b.top))] } idx += n.length }
          else { const nw = n.querySelector('.g-number-field__roll-new'); const a = at(nw.firstChild, 0, 1), b = at(mt, idx, idx + 1); const off = nw.getBoundingClientRect().top - n.getBoundingClientRect().top; worst = [Math.max(worst[0], Math.abs(a.left - b.left)), Math.max(worst[1], Math.abs(a.top - off - b.top))]; idx += 1 }
        }
        return worst.map((x) => +x.toFixed(2))
      })() : null })
    if (performance.now() - t0 < ms) requestAnimationFrame(frame); else res(out)
  })()
})

/* ---------- 0b · Reglas de g-number-field en dist/grana.css (lo que se publica) ---------- */
{
  const dist = await readFile(join(ROOT, 'packages/vue/dist/grana.css'), 'utf8')
  const flat = dist.replace(/\/\*[\s\S]*?\*\//g, '')
  // Reglas cuyo selector nombra g-number-field (y las @keyframes g-number-*), dentro de @layer grana.components
  const rules = []
  const re = /([^{}]*g-number-field[^{}]*|@keyframes g-number-[\w-]+[^{]*)\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g
  for (const m of flat.matchAll(re)) rules.push(m[0])
  ok(rules.length >= 30, `dist: pocas reglas de g-number-field (${rules.length}): ¿no está registrado?`)
  const body = rules.join('\n')
  ok(!/#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|lab|lch)\(/.test(body), 'dist: color literal en g-number-field')
  ok(!/var\(\s*--[\w-]+\s*,/.test(body), 'dist: var() con respaldo en g-number-field')
  const px = [...body.matchAll(/(-?\d*\.?\d+)px/g)].map((m) => m[0])
  ok(px.every((p) => ['24px', '44px', '1px', '-1px'].includes(p)), 'dist: medidas literales ' + px.filter((p) => !['24px', '44px', '1px', '-1px'].includes(p)))
  const vars = [...body.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1])
  ok(vars.every((v) => /^--(g|_)/.test(v)), 'dist: var() que no es --g-*/--_*')
  // Colores de sistema: solo dentro de @media (forced-colors: active) (bloques con llaves emparejadas)
  const fcRanges = []
  for (const m of flat.matchAll(/@media ?\(forced-colors: ?active\)\s*\{/g)) {
    let d = 1, i = m.index + m[0].length
    for (; i < flat.length && d; i++) d += flat[i] === '{' ? 1 : flat[i] === '}' ? -1 : 0
    fcRanges.push([m.index, i])
  }
  const sysOut = []
  let nSys = 0
  for (const m of flat.matchAll(/([^{}]*g-number-field[^{}]*)\{([^{}]*)\}/g)) {
    if (!/\b(ButtonText|GrayText|Highlight|HighlightText|Canvas|CanvasText)\b/.test(m[2])) continue
    nSys++
    if (!fcRanges.some(([a, b]) => m.index >= a && m.index < b)) sysOut.push(m[1].trim())
  }
  ok(nSys > 0 && !sysOut.length, 'dist: colores de sistema fuera de forced-colors ' + sysOut)
  const layer = flat.indexOf('@layer grana.components')
  ok(layer >= 0 && flat.indexOf('.g-number-field__value') > layer, 'dist: g-number-field fuera de @layer grana.components')
  // Orden de registro: GNumberField después de GInput (sus reglas tocan la caja de GInput con la misma especificidad)
  ok(flat.indexOf('.g-number-field__value') > flat.indexOf('.g-input__control'), 'dist: GNumberField.css antes que GInput.css')
}

/* ---------- Ayudas de página ---------- */
// Lo que el campo necesita para «99» (mínimo de #312, medido desde fuera): caja − hueco libre de P1 (margin auto de −/+)
const NEED = (c) => {
  const r = document.querySelector(`[data-case="${c}"]`)
  const ctl = r.querySelector('.g-input__control'), st = r.querySelector('.g-number-field__steppers')
  const free = st ? parseFloat(getComputedStyle(st).marginInlineStart) : 0
  return { need: ctl.getBoundingClientRect().width - free, free, box: ctl.getBoundingClientRect().width }
}
// Marcado real frente al que espera el CSS (estilo.md «Para bruno»)
const MARKUP = () => {
  const bad = []
  for (const r of document.querySelectorAll('.g-number-field[data-case]')) {
    const id = r.dataset.case
    const ctl = r.querySelector(':scope > .g-input__row > .g-input__control')
    if (!r.classList.contains('g-input')) bad.push(`${id}: raíz sin g-input`)
    if (!ctl) { bad.push(`${id}: sin g-input__control`); continue }
    const v = ctl.querySelector(':scope > .g-number-field__value')
    if (!v) { bad.push(`${id}: __value no es hijo directo de __control`); continue }
    const kids = [...v.children].map((k) => k.className.split(' ').find((c) => c.startsWith('g-number-field__')) || k.tagName)
    if (kids[0] !== 'g-number-field__mirror' || !v.querySelector(':scope > .g-number-field__field')) bad.push(`${id}: hijos de __value ${kids}`)
    if (kids.some((k) => !/^g-number-field__(mirror|field|roll|measure)$/.test(k))) bad.push(`${id}: hijo ajeno en __value ${kids}`)
    const f = v.querySelector(':scope > .g-number-field__field')
    if (!f.classList.contains('g-input__field')) bad.push(`${id}: el campo no lleva g-input__field (sin anillo de foco de GInput)`)
    if (f.getAttribute('dir') !== 'ltr' || f.getAttribute('role') !== 'spinbutton' || f.type !== 'text') bad.push(`${id}: campo dir/role/type`)
    if (f.hasAttribute('name')) bad.push(`${id}: el visible lleva name`)
    const st = ctl.querySelector(':scope > .g-number-field__steppers')
    const has = r.classList.contains('g-number-field--has-steppers')
    if (has !== Boolean(st)) bad.push(`${id}: --has-steppers ${has} y __steppers ${Boolean(st)}`)
    if (st) {
      if (ctl.lastElementChild !== st) bad.push(`${id}: __steppers no es el último de __control`)
      const b = [...st.children]
      if (b.length !== 2 || !b[0].classList.contains('g-number-field__step--decrement') || !b[1].classList.contains('g-number-field__step--increment')) bad.push(`${id}: orden de −/+`)
      for (const x of b) {
        if (!x.classList.contains('g-number-field__step') || x.tabIndex !== -1 || x.type !== 'button') bad.push(`${id}: botón −/+`)
        if (!x.querySelector(':scope > svg.g-icon')) bad.push(`${id}: icono de −/+ no es .g-icon hijo directo`)
        if (x.hasAttribute('aria-hidden')) bad.push(`${id}: −/+ aria-hidden`)
        if (x.hasAttribute('style')) bad.push(`${id}: estilo en línea en −/+`)
      }
    }
    for (const el of r.querySelectorAll('[style]')) if (el.closest('.g-number-field__value') || el.closest('.g-number-field__steppers')) bad.push(`${id}: estilo en línea en ${el.className}`)
    const inRow = r.parentElement?.classList.contains('g-form-row')
    const ms = v.querySelector(':scope > .g-number-field__measure')
    if (Boolean(ms) !== Boolean(inRow && st !== null && has) && !(inRow && r.classList.contains('is-readonly'))) bad.push(`${id}: __measure ${Boolean(ms)} (fila ${inRow}, −/+ ${has})`)
    if (r.classList.contains('is-rolling') || v.classList.contains('is-rolling') || v.classList.contains('is-bumping') || v.querySelector('.g-number-field__roll')) bad.push(`${id}: P2/P3 quedaron puestos en reposo`)
    const hidden = ctl.querySelectorAll(':scope > input[type="hidden"]')
    for (const h of hidden) if (getComputedStyle(h).display !== 'none') bad.push(`${id}: oculto visible`)
  }
  return bad
}
// Contraste de los GNumberField de una página que no es el banco (playground)
const CONTRAST_ANY = (sel) => {
  const { parse, over, bgOf, ratio } = window.__lib
  const out = []
  const add = (k, fg, bg, min) => out.push({ k, r: ratio(over(fg, bg), bg), min })
  for (const root of document.querySelectorAll(sel)) {
    if (root.classList.contains('is-disabled') || !root.getClientRects().length) continue
    const id = root.querySelector('.g-number-field__field').id
    const ctl = root.querySelector('.g-input__control')
    const f = root.querySelector('.g-number-field__field')
    if (f.value) add(`${id} valor`, parse(getComputedStyle(f).color), bgOf(ctl), 4.5)
    for (const s of root.querySelectorAll('.g-input__suffix, .g-input__prefix')) add(`${id} ${s.className}`, parse(getComputedStyle(s).color), bgOf(ctl), 4.5)
    for (const b of root.querySelectorAll('.g-number-field__step')) {
      add(`${id} separador`, parse(getComputedStyle(b).borderInlineStartColor), bgOf(ctl), 3)
      if (!b.disabled) add(`${id} icono`, parse(getComputedStyle(b).color), bgOf(b), 3)
    }
  }
  return out
}

for (const engine of ENGINES) {
  const browser = await pw[engine].launch()
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  const errors = []
  const watch = (p) => {
    p.on('console', (m) => { if (['error', 'warning'].includes(m.type())) errors.push(m.text()) })
    p.on('pageerror', (e) => { if (!/ResizeObserver loop/.test(e.message)) errors.push(String(e)) })
    p.on('requestfailed', (r) => errors.push('red: ' + r.url()))
  }
  watch(page)
  const go = async (qs, p = page) => {
    for (let i = 0; ; i++) { try { await p.goto(BASE + qs); await p.waitForSelector('html[data-ready]', { state: 'attached', timeout: 15000 }); break } catch (e) { if (i) throw e } }
    await p.evaluate(() => document.fonts.ready)
    await p.evaluate(`window.__lib = (${lib})()`)
    await p.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 60)))))
  }
  const settle = (p = page) => p.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 20)))))
  const tag = (s) => `${engine} ${s}`

  /* 1 · Marcado real frente al que espera el CSS (defecto) */
  await go('')
  {
    const bad = await page.evaluate(MARKUP)
    ok(!bad.length, tag(`marcado: ${bad.join(' | ')}`))
    const n = await page.evaluate(() => document.querySelectorAll('.g-number-field[data-case]').length)
    if (engine === 'chromium') notes.push(`marcado: ${n} GNumberField del banco revisados`)
  }

  /* 2 · Contraste: defecto, auditoría, Tema de prueba y los once generados, claro y oscuro (27) */
  const worst = {}
  const CONF = [['defecto', ''], ['defecto', 'dark=1'], ['auditoría', 'audit=1'], ['auditoría', 'audit=1&dark=1'], ['prueba', 'test=1'], ...GEN.flatMap((t) => [[t, `theme=${t}`], [t, `theme=${t}&dark=1`]])]
  for (const [name, qs] of CONF) {
    await go('?' + qs)
    const m = await page.evaluate(contrast)
    const t = `${name} ${qs.includes('dark') ? 'oscuro' : 'claro'}`
    for (const c of m) ok(c.r >= c.min, tag(`${t}: ${c.k} ${c.r}:1 < ${c.min}`))
    const w = (re) => Math.min(...m.filter((c) => re.test(c.k)).map((c) => c.r))
    worst[t] = { valor: w(/valor/), sufijo: w(/ (suffix|prefix)$/), icono: w(/icono/), separador: w(/separador/), pasar: w(/pasar: icono/), pasarSep: w(/pasar: separador/) }
  }
  if (engine === 'chromium') {
    console.log('Contraste mínimo (valor · sufijo/prefijo · icono −/+ · separador · icono al pasar · separador al pasar):')
    for (const [t, r] of Object.entries(worst)) if (args.verbose || /defecto|auditoría|prueba|spotify/.test(t)) console.log(`  ${t.padEnd(24)} ${Object.values(r).join(' · ')}`)
    const all = Object.values(worst)
    console.log(`  mínimo en ${all.length} temas       ${['valor', 'sufijo', 'icono', 'separador', 'pasar', 'pasarSep'].map((k) => Math.min(...all.map((r) => r[k]))).join(' · ')}`)
  }

  /* 3 · Geometría: defecto, oscuro, auditoría (space 5, radio 16, 17px) y Tema de prueba (borde 2px, space 5) */
  for (const qs of ['', 'dark=1', 'audit=1', 'test=1']) {
    await go('?' + qs)
    const g = await page.evaluate(geometry)
    const t = (s) => tag(`?${qs} ${s}`)
    if (engine === 'chromium') notes.push(`?${qs || 'defecto'} −/+ por tamaño: ${Object.entries(g.sizes).map(([k, s]) => k + ' ' + s.btns[0].w).join(' · ')}; P1 valor–sufijo: ${Object.entries(g.p1).map(([k, p]) => k + ' ' + p.gaps[0]).join(' · ')}`)
    for (const [sid, s] of Object.entries(g.sizes)) {
      for (const b of s.btns) {
        ok(near(b.w, s.expected) && near(b.h, s.expected), t(`${sid}: −/+ ${b.w}×${b.h} ≠ ${s.expected} (cuadrado del alto de la caja)`))
        ok(b.w >= 24 - 0.01 && b.h >= 24 - 0.01, t(`${sid}: −/+ bajo 24px`))
        ok(near(b.top, 0) && near(b.bottom, 0), t(`${sid}: −/+ no llegan de borde a borde ${JSON.stringify(b)}`))
      }
      ok(near(s.btns[1].right, 0), t(`${sid}: + no llega al borde final (${s.btns[1].right})`))
      ok(near(s.box, s.inputBox) && near(s.nfBox, s.inputBox), t(`${sid}: caja ${s.box}/${s.nfBox} ≠ GInput ${s.inputBox}`))
      ok(near(s.icon, s.fs, 0.1), t(`${sid}: icono ${s.icon} ≠ 1em del texto (${s.fs})`))
      const p = g.p1[sid]
      ok(p.gaps.every((x) => near(x, p.expected, 0.5)), t(`${sid}: P1 valor–sufijo ${p.gaps} ≠ gap ${p.expected}`))
      ok(Math.max(...p.ink) - Math.min(...p.ink) <= 1 && p.ink.every((x) => x >= p.expected - 0.01 && x <= p.expected + 2), t(`${sid}: P1 distancia de tinta ${p.ink} (gap ${p.expected} + 1px del cursor)`))
      ok(p.fromStart < p.boxW / 3, t(`${sid}: P1 el sufijo no está pegado (${p.fromStart} de ${p.boxW})`))
    }
    for (const [c, s] of Object.entries(g.states)) {
      for (const [a, b] of s.cover) ok(near(a, 0) && near(b, 0), t(`${c}: −/+ no cubren de borde a borde ${JSON.stringify(s.cover)}`))
      ok(near(s.cover.at(-1)[2], 0), t(`${c}: + no llega al borde final ${s.cover.at(-1)[2]}`))
      for (const [col, , clip] of s.blockBorder) ok(/rgba\(0, 0, 0, 0\)|transparent/.test(col) && clip === 'padding-box', t(`${c}: trazo de −/+ no transparente o fondo sin recortar ${col} ${clip}`))
      const stroke = c === 's-invalid' || c === 's-warning' ? 2 * g.bw : g.bw
      ok(s.blockBorder.every(([, w]) => near(w, stroke, 0.01)) && near(s.endBorder[0], stroke, 0.01), t(`${c}: trazo transparente ${s.blockBorder.map((x) => x[1])}/${s.endBorder[0]} ≠ ${stroke}`))
      ok(s.sep.every(([st, w]) => st === 'solid' && near(w, g.bw, 0.01)), t(`${c}: separador ${JSON.stringify(s.sep)}`))
      ok(s.radius[0] === s.radius[1], t(`${c}: esquina de + ${s.radius[0]} ≠ caja ${s.radius[1]}`))
      for (const [w, h] of s.sq) ok(near(w, h), t(`${c}: −/+ no cuadrado ${w}×${h}`))
      ok(s.cursor[0] === (c === 's-disabled' ? 'not-allowed' : 'text') && s.cursor[1] === (c === 's-disabled' ? 'not-allowed' : 'pointer') && s.cursor[2] === 'default', t(`${c}: cursores ${s.cursor}`))
    }
    ok(g.readonly.steppers === 0, t('solo lectura con −/+'))
    ok(!g.scrolls.length, t(`P1: el texto no cabe en el campo ${g.scrolls}`))
    ok(Object.values(g.tab).every((v) => /tabular-nums/.test(v)), t(`tabular-nums ${JSON.stringify(g.tab)}`))
    ok(g.measure.pos === 'absolute' && g.measure.vis === 'hidden' && g.measure.font, t(`__measure ${JSON.stringify(g.measure)}`))
    for (const r of g.rows) for (const l of r.lines) if (l.length > 1) ok(l.every((k) => near(k.top, l[0].top, 1)) && l.every((k) => near(k.h, l[0].h, 0.5)), t(`fila ${r.row}: cajas ${JSON.stringify(l)}`))
    for (const [c, r] of Object.entries(g.rtl)) {
      ok(r.stepsLeft && r.incLeft && near(r.edge, 0), t(`${c}: RTL −/+ ${JSON.stringify(r)}`))
      ok(near(r.gap, g.p1.md.expected), t(`${c}: RTL valor–sufijo ${r.gap} ≠ ${g.p1.md.expected}`))
      ok(r.align <= 0.5, t(`${c}: el texto no se ancla a la derecha en RTL (hueco ${r.align}px)`))
    }
    ok(g.n320.ctlOverflow <= g.bw + 0.5 && g.n320.sufIn && g.n320.sufW >= g.n320.sufNatural - 0.5 && g.n320.shrunk && g.n320.rootOut <= 0.5, t(`320: número largo ${JSON.stringify(g.n320)}`))
    ok(g.overflow <= 0, t(`desborde de la página ${g.overflow}`))
    // RTL real: cifras del idioma desde el lang del ancestro (sin prop locale) y celda anclada a la derecha del valor
    const rt = await page.evaluate(() => ['rtl-ar', 'rtl-he'].map((i) => { const f = document.getElementById(i); const r = f.closest('.g-input'); const v = r.querySelector('.g-number-field__value').getBoundingClientRect(); const sf = r.querySelector('.g-input__suffix').getBoundingClientRect(); const c = r.querySelector('.g-input__control').getBoundingClientRect(); return { i, text: f.value, ta: getComputedStyle(f).textAlign, valueAtRight: +(c.right - v.right).toFixed(2), sufLeftOfValue: sf.right <= v.left + 0.5 } }))
    ok(rt[0].text === '-٤٫٥' && rt[1].text === '72.5', t(`RTL: texto ${rt.map((x) => x.text)} (cifras del idioma por lang del ancestro)`))
    ok(rt.every((x) => x.ta === 'right' && x.sufLeftOfValue), t(`RTL: alineación ${JSON.stringify(rt)}`))
  }

  /* 4 · Anchos de ventana: filas, sin desborde, unidad dentro */
  for (const w of [720, 480, 360, 320]) {
    await page.setViewportSize({ width: w, height: 900 })
    await go('')
    const g = await page.evaluate(geometry)
    for (const r of g.rows) for (const l of r.lines) if (l.length > 1) ok(l.every((k) => near(k.top, l[0].top, 1)) && l.every((k) => near(k.h, l[0].h, 0.5)), tag(`${w}px fila ${r.row}: ${JSON.stringify(l)}`))
    ok(g.overflow <= 0, tag(`${w}px: desborde ${g.overflow}`))
    ok(g.n320.sufIn && g.n320.ctlOverflow <= 1.5, tag(`${w}px: unidad fuera de la caja ${JSON.stringify(g.n320)}`))
  }
  await page.setViewportSize({ width: 1280, height: 900 })

  /* 5 · Mínimo publicado (#312) en una GFormRow real: «Cantidad» 1–99 (valor 99) + GInput xs. Mientras compartan línea,
     «99» cabe entero (celda ≥ medidor, el campo no desplaza); la fila se parte; y en el último ancho de una línea el campo
     mide lo que necesita (± 2px): el mínimo publicado no sobrecuenta el hueco libre de P1 */
  for (const qs of ['', 'audit=1', 'test=1']) {
    await go('?' + qs)
    const sweep = await page.evaluate(async () => {
      const lay = document.getElementById('min-layout'), row = document.getElementById('min-row')
      const f = document.getElementById('ref-qty'), r = f.closest('.g-input')
      const cell = r.querySelector('.g-number-field__value'), meas = r.querySelector('.g-number-field__measure'), st = r.querySelector('.g-number-field__steppers')
      const out = []
      for (let w = 420; w >= 140; w--) {
        lay.style.inlineSize = w + 'px'
        await new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(res)))
        const lines = new Set([...row.children].map((k) => k.dataset.line)).size
        const ctl = r.querySelector('.g-input__control').getBoundingClientRect().width
        const free = parseFloat(getComputedStyle(st).marginInlineStart)
        out.push({ w, lines, root: +r.getBoundingClientRect().width.toFixed(2), cell: +cell.getBoundingClientRect().width.toFixed(2), meas: +meas.getBoundingClientRect().width.toFixed(2), need: +(ctl - free).toFixed(2), scroll: f.scrollWidth - f.clientWidth })
      }
      lay.style.inlineSize = ''
      return out
    })
    const one = sweep.filter((s) => s.lines === 1)
    const bad = one.filter((s) => s.cell + 0.5 < s.meas || s.scroll > 1)
    ok(one.length > 10 && sweep.some((s) => s.lines > 1), tag(`?${qs} mínimo: la fila no llega a partirse (${one.length} anchos en una línea)`))
    ok(!bad.length, tag(`?${qs} mínimo: «99» no cabe compartiendo línea ${JSON.stringify(bad.slice(0, 3))}`))
    const need = one.length ? Math.max(...one.map((s) => s.need)) : 0
    ok(one.every((s) => near(s.need, need, 1)), tag(`?${qs} mínimo: lo que necesita «99» cambia con el ancho ${[...new Set(one.map((s) => s.need))]}`))
    const last = one.at(-1)
    ok(last && last.root - last.need <= 2 && last.root - last.need >= -0.5, tag(`?${qs} mínimo: en el último ancho de una línea el campo mide ${last?.root} y necesita ${last?.need} (publicado de más o de menos)`))
    if (engine === 'chromium' || qs === '') notes.push(`${engine} ?${qs || 'defecto'} mínimo publicado: «99» necesita ${Math.ceil(need)}px; la fila se parte por debajo de ${last?.w}px de fila (campo ${last?.root}px)`)
  }

  /* 6 · Bloquear y desbloquear (#266, #312): misma distribución, misma caja, sin −/+ en solo lectura */
  {
    await go('')
    const res = await page.evaluate(async () => {
      const lay = document.getElementById('lk-layout'), row = document.getElementById('lk-row')
      const r = document.getElementById('lk-qty').closest('.g-input')
      const raf = () => new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(res, 20))))
      const snap = () => ({ line: [...row.children].map((k) => k.dataset.line).join(','), h: +r.querySelector('.g-input__control').getBoundingClientRect().height.toFixed(2), top: +r.querySelector('.g-input__control').getBoundingClientRect().top.toFixed(2), w: +r.getBoundingClientRect().width.toFixed(2), st: r.querySelectorAll('.g-number-field__step').length })
      const out = []
      for (let w = 900; w >= 260; w -= 20) {
        lay.style.inlineSize = w + 'px'
        window.__lock.value = false; await raf(); const a = snap()
        window.__lock.value = true; await raf(); const b = snap()
        window.__lock.value = false; await raf(); const c = snap()
        out.push({ w, a, b, c })
      }
      lay.style.inlineSize = ''
      return out
    })
    const diff = res.filter((x) => x.a.line !== x.b.line || x.a.line !== x.c.line)
    ok(!diff.length, tag(`bloquear reparte la fila: ${JSON.stringify(diff.slice(0, 2))}`))
    ok(res.every((x) => near(x.a.h, x.b.h, 0.01) && near(x.a.top, x.b.top, 0.5) && near(x.a.w, x.b.w, 0.5)), tag(`bloquear cambia la caja ${JSON.stringify(res.find((x) => !near(x.a.h, x.b.h, 0.01) || !near(x.a.top, x.b.top, 0.5) || !near(x.a.w, x.b.w, 0.5)))}`))
    ok(res.every((x) => x.a.st === 2 && x.b.st === 0 && x.c.st === 2), tag('bloquear: −/+ no desaparecen y vuelven'))
    ok(new Set(res.map((x) => x.a.line)).size > 1, tag('bloquear: el barrido no llega a partir la fila'))
  }

  /* 7 · Foco: anillo de GInput sobre el conjunto (también con el error); −/+ con anillo si se enfocan */
  for (const qs of ['', 'audit=1']) {
    await go('?' + qs)
    for (const id of ['s-rest', 's-invalid']) {
      await page.focus('#' + id)
      await page.waitForTimeout(300)
      const f = await page.evaluate((i) => { const row = document.getElementById(i).closest('.g-input__row'); const cs = getComputedStyle(row); const { tok } = window.__lib; const fc = tok('--g-color-focus'); return { st: cs.outlineStyle, w: parseFloat(cs.outlineWidth), c: cs.outlineColor, fc: `rgb(${fc.slice(0, 3).join(', ')})` } }, id)
      ok(f.st === 'solid' && f.w >= 1.5 && (id === 's-invalid' || f.c === f.fc), tag(`?${qs} foco de ${id} ${JSON.stringify(f)}`))
    }
    const s = await page.evaluate(() => { const b = document.querySelector('[data-case="s-rest"] .g-number-field__step--increment'); b.focus(); const cs = getComputedStyle(b); return { fv: b.matches(':focus-visible'), st: cs.outlineStyle, w: parseFloat(cs.outlineWidth), off: parseFloat(cs.outlineOffset) } })
    if (s.fv) ok(s.st === 'solid' && s.w >= 1.5 && s.off + s.w <= 0.01, tag(`foco de + ${JSON.stringify(s)}`))
    await page.evaluate(() => document.activeElement.blur())
  }

  /* 7b · P1 con el foco (texto crudo, sin agrupar): con el cursor al final el texto no se desplaza; la unidad sigue al gap */
  await go('')
  for (const id of ['p1-xs-6', 'p1-md-1', 'p1-md-6', 'p1-xl-6', 'st-md', 'rtl-ar', 'rtl-he', 'nf-md']) {
    await page.focus('#' + id); await page.keyboard.press('End'); await page.waitForTimeout(40)
    const sl = await page.evaluate((i) => { const f = document.getElementById(i); const r = f.closest('.g-input'); const sf = r.querySelector('.g-input__suffix'); const v = r.querySelector('.g-number-field__value').getBoundingClientRect(); const rtl = getComputedStyle(r).direction === 'rtl'; return { sl: f.scrollLeft, sw: f.scrollWidth, cw: f.clientWidth, gap: sf ? +(rtl ? v.left - sf.getBoundingClientRect().right : sf.getBoundingClientRect().left - v.right).toFixed(2) : null, cg: parseFloat(getComputedStyle(r.querySelector('.g-input__control')).columnGap) } }, id)
    // WebKit: hallazgo 1 de auditoria.md (el ancho del texto se redondea hacia arriba: 1px de desplazamiento con el cursor al final)
    ok(engine === 'webkit' ? sl.sl <= 1 : sl.sl === 0 && sl.sw <= sl.cw + 1, tag(`P1 con foco: ${id} se desplaza ${JSON.stringify(sl)}`))
    if (sl.gap != null) ok(near(sl.gap, sl.cg, 0.5), tag(`P1 con foco: ${id} valor–sufijo ${sl.gap} ≠ gap ${sl.cg}`))
  }
  await page.evaluate(() => document.activeElement.blur())
  // Recuento en todo el banco: campos que se desplazan con el foco y el cursor al final (hallazgo 1)
  {
    const ids = await page.evaluate(() => [...document.querySelectorAll('.g-number-field[data-case] .g-number-field__field')].filter((f) => !f.disabled && !f.readOnly && f.id !== 'n320-long').map((f) => f.id))
    const moved = []
    for (const id of ids) {
      await page.focus('#' + id); await page.keyboard.press('End'); await page.waitForTimeout(10)
      const sl = await page.evaluate((i) => document.getElementById(i).scrollLeft, id)
      if (sl) moved.push(`${id} ${sl}`)
    }
    await page.evaluate(() => document.activeElement.blur())
    notes.push(`${engine} P1 con foco y cursor al final: ${moved.length} de ${ids.length} campos se desplazan${moved.length ? ' (' + moved.slice(0, 6).join(', ') + '…)' : ''}`)
    ok(engine === 'webkit' ? moved.every((m) => / 1$/.test(m)) : !moved.length, tag(`P1 con foco: se desplazan ${moved}`))
  }
  // Pulsar el área vacía de la caja enfoca con el cursor al final (P1, lo hace el .vue)
  {
    const r = await page.evaluate(() => { document.querySelector('[data-case="s-rest"]').scrollIntoView({ block: 'center' }); const c = document.querySelector('[data-case="s-rest"] .g-number-field__steppers').getBoundingClientRect(); return { x: c.left - 12, y: c.top + c.height / 2 } })
    await page.mouse.click(r.x, r.y)
    const a = await page.evaluate(() => { const f = document.activeElement; return { id: f.id, s: f.selectionStart, n: f.value?.length } })
    ok(a.id === 's-rest' && a.s === a.n, tag(`P1: pulsar el hueco libre no enfoca con el cursor al final ${JSON.stringify(a)}`))
    await page.evaluate(() => document.activeElement.blur())
  }

  /* 8 · Pasar y pulsar (pointerdown cancelado por el .vue) */
  {
    await go('')
    const b = page.locator('[data-case="s-rest"] .g-number-field__step--decrement')
    await page.evaluate(() => document.querySelector('[data-case="s-rest"]').scrollIntoView({ block: 'center' }))
    await b.hover()
    await page.waitForTimeout(250)
    const hv = await page.evaluate(() => { const b = document.querySelector('[data-case="s-rest"] .g-number-field__step--decrement'); const { tok } = window.__lib; const cs = getComputedStyle(b); const ns = tok('--g-color-neutral-soft'), tx = tok('--g-color-text'); return { bg: cs.backgroundColor, color: cs.color, ns: `rgb(${ns.slice(0, 3).join(', ')})`, tx: `rgb(${tx.slice(0, 3).join(', ')})` } })
    ok(hv.bg === hv.ns && hv.color === hv.tx, tag(`pasar sobre −: ${JSON.stringify(hv)}`))
    await page.mouse.down()
    await page.waitForTimeout(150)
    const act = await page.evaluate(() => { const b = document.querySelector('[data-case="s-rest"] .g-number-field__step--decrement'); return { active: b.matches(':active'), bg: getComputedStyle(b).backgroundColor, focus: document.activeElement === document.body, v: document.getElementById('s-rest').value } })
    await page.mouse.up()
    ok(act.focus, tag('pulsar −: movió el foco'))
    ok(act.v === '18', tag(`pulsar −: valor ${act.v}`))
    if (!act.active) notes.push(`${engine}: :active no se aplica con pointerdown cancelado (el fondo lo da el de pasar)`)
    await page.mouse.move(0, 0)
  }

  /* 9 · P2 · cifras que ruedan (tiempos reales del .vue) */
  {
    await go('')
    await page.focus('#s-rest')
    const sample = page.evaluate(SAMPLER, ['s-rest', 500])
    await page.waitForTimeout(30)
    await page.keyboard.press('ArrowUp') // 19 → 20
    const fr = await sample
    const during = fr.filter((f) => f.layer)
    const mids = new Set(during.flatMap((f) => f.off).filter((o) => o > 0.3))
    ok(during.length >= 2 && during.every((f) => f.n === 2) && mids.size >= 2, tag(`P2 19→20: ${during.length} cuadros, ranuras ${[...new Set(during.map((f) => f.n))]}, ${mids.size} posiciones intermedias`))
    ok(during.every((f) => f.off.every((o) => o >= -0.01)) && during.every((f) => f.dir === 'up'), tag('P2 al sumar: la cifra nueva no entra desde abajo'))
    ok(during.every((f) => f.offOld.every((o) => o == null || o <= 0.01)), tag('P2 al sumar: la cifra vieja no sale por arriba'))
    ok(during.every((f) => f.val === '20'), tag('P2: el <input> no tiene el valor nuevo desde el primer cuadro'))
    ok(during.every((f) => f.fieldColor === 'rgba(0, 0, 0, 0)' && f.caret !== 'rgba(0, 0, 0, 0)' && f.layerColor && f.layerColor !== 'rgba(0, 0, 0, 0)'), tag(`P2: texto del campo no oculto, cursor oculto o capa sin color ${JSON.stringify(during[0])}`))
    // WebKit ajusta al píxel el rectángulo de un rango de UN carácter (medido: «2» del espejo 84→93, ranura 84→92,406; el
    // rango de dos caracteres mide 16,8 = 2 × 8,406): ahí la x del espejo lleva hasta 1px de redondeo. El extremo final se
    // comprueba aparte con el rango completo (fraccionario)
    const tolX = engine === 'webkit' ? 1 : 0.5
    ok(during.every((f) => f.align && Math.abs(f.align[0]) <= tolX && Math.abs(f.align[1]) <= 0.5), tag(`P2: la capa no coincide con el texto del campo ${JSON.stringify(during.map((f) => f.align))}`))
    const end = fr.findIndex((f, i) => i > fr.indexOf(during[0]) && !f.layer)
    ok(end > 0 && fr[end].t - during[0].t <= 160 + 140 && !fr.at(-1).layer && !fr.at(-1).rolling, tag(`P2: la capa no se retira a tiempo (${end > 0 ? fr[end].t - during[0].t : 'nunca'}ms)`))
    notes.push(`${engine} P2 19→20 (componente real): ${during.length} cuadros con capa, ${mids.size} posiciones intermedias, retirada a los ${end > 0 ? Math.round(fr[end].t - during[0].t) : '?'}ms`)
    ok(during.at(-1).off.every((o) => Math.abs(o) <= 1.5), tag(`P2: la cifra nueva no termina en su sitio ${during.at(-1).off}`))
    const s2 = page.evaluate(SAMPLER, ['s-rest', 400]); await page.waitForTimeout(30); await page.keyboard.press('ArrowUp')
    const f2 = (await s2).filter((f) => f.layer)
    ok(f2.length && f2.every((f) => f.n === 1), tag(`P2 20→21: ranuras ${[...new Set(f2.map((f) => f.n))]}`))
    // Extremos de la capa frente al rango completo del espejo (sin redondeo por carácter), con la capa en su sitio final
    {
      await page.evaluate(() => { document.documentElement.style.setProperty('--g-duration-press', '2s') })
      await page.keyboard.press('ArrowUp'); await page.waitForTimeout(40)
      const e = await page.evaluate(() => { const root = document.querySelector('[data-case="s-rest"]'); const layer = root.querySelector('.g-number-field__roll'); const m = root.querySelector('.g-number-field__mirror'); if (!layer) return null; const r = document.createRange(); r.selectNodeContents(layer); const rm = document.createRange(); rm.selectNodeContents(m.firstChild); const L = r.getBoundingClientRect(), M = rm.getBoundingClientRect(); return [+(L.left - M.left).toFixed(3), +(L.right - M.right).toFixed(3)] })
      await page.evaluate(() => { document.documentElement.style.removeProperty('--g-duration-press') })
      ok(e && Math.abs(e[0]) <= 0.1 && Math.abs(e[1]) <= 0.1, tag(`P2: extremos de la capa ≠ espejo ${JSON.stringify(e)}`))
      await page.waitForTimeout(100)
      await page.keyboard.press('ArrowDown'); await page.waitForTimeout(400)
    }
    const s3 = page.evaluate(SAMPLER, ['s-rest', 400]); await page.waitForTimeout(30); await page.keyboard.press('ArrowDown')
    const f3 = (await s3).filter((f) => f.layer)
    ok(f3.length && f3.every((f) => f.dir === 'down' && f.off.every((o) => o <= 0.01)) && f3.some((f) => f.off.some((o) => o < -0.3)), tag(`P2 al restar: la cifra nueva no entra desde arriba ${JSON.stringify(f3.map((f) => f.off))}`))
    // Escribir no rueda; con autorrepetición de la tecla (repeat) no rueda
    const s4 = page.evaluate(SAMPLER, ['s-rest', 300]); await page.waitForTimeout(30); await page.keyboard.type('5')
    ok((await s4).every((f) => !f.layer), tag('P2: rueda al escribir'))
    // −/+ con el ratón: el primer paso rueda; al mantener 1s, después del primer paso nada rueda
    await page.evaluate(() => document.activeElement.blur())
    await page.evaluate(() => { window.__v['s-rest'] = 30 }); await settle()
    const btn = page.locator('[data-case="s-rest"] .g-number-field__step--increment')
    const bb = await btn.boundingBox()
    const hold = page.evaluate(() => new Promise((res) => { let max = 0, first = 0; const t0 = performance.now(); (function f() { const k = document.querySelectorAll('[data-case="s-rest"] .g-number-field__roll-slot').length; if (performance.now() - t0 < 200) first = Math.max(first, k); if (performance.now() - t0 > 450) max = Math.max(max, k); if (performance.now() - t0 < 1100) requestAnimationFrame(f); else res({ max, first }) })() }))
    await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await page.mouse.down(); await page.waitForTimeout(1050); await page.mouse.up()
    const h = await hold
    ok(h.max === 0 && h.first > 0, tag(`P2 con −/+: primer paso ${h.first} ranuras, al mantener ${h.max}`))
    await page.mouse.move(0, 0)
  }

  /* 10 · P3 · el tope */
  for (const qs of ['', 'audit=1']) {
    await go('?' + qs)
    const space = await page.evaluate(() => window.__lib.px('--g-space-1'))
    await page.focus('#s-max')
    const s = page.evaluate(SAMPLER, ['s-max', 450]); await page.waitForTimeout(30); await page.keyboard.press('ArrowUp')
    const fr = await s
    const dys = fr.map((f) => f.dy)
    const peak = Math.min(...dys)
    ok(peak < -0.5 && peak >= -space * 0.5 - 0.01 && Math.max(...dys) <= 0.01, tag(`?${qs} P3 ↑ en el máximo: ${peak}px (≤ ${space * 0.5}, hacia arriba)`))
    notes.push(`${engine} ?${qs || 'defecto'} P3: pico ${peak}px (tope ${space * 0.5}px)`)
    ok(near(fr.at(-1).dy, 0, 0.01) && !fr.at(-1).bumping && fr.every((f) => f.val === '99' && !f.layer), tag(`P3: no vuelve a 0, queda la clase, cambió el valor o rodó ${JSON.stringify(fr.at(-1))}`))
    await page.focus('#s-min')
    const s2 = page.evaluate(SAMPLER, ['s-min', 450]); await page.waitForTimeout(30); await page.keyboard.press('ArrowDown')
    const d2 = (await s2).map((f) => f.dy)
    ok(Math.max(...d2) > 0.5 && Math.max(...d2) <= space * 0.5 + 0.01 && Math.min(...d2) >= -0.01, tag(`P3 ↓ en el mínimo: ${Math.max(...d2)}px hacia abajo`))
    await page.focus('#s-rest')
    const s3 = page.evaluate(SAMPLER, ['s-rest', 300]); await page.waitForTimeout(30); await page.keyboard.press('ArrowUp')
    ok((await s3).every((f) => !f.bumping && Math.abs(f.dy) < 0.01), tag('P3: tope fuera del límite'))
  }

  /* 11 · Movimiento reducido: nada se mueve ni queda capa o clase; I2 por GForm sin animación; I1 solo fundido */
  {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await go('')
    await page.focus('#s-rest')
    const s = page.evaluate(SAMPLER, ['s-rest', 300]); await page.waitForTimeout(30); await page.keyboard.press('ArrowUp')
    const fr = await s
    ok(fr.every((f) => f.off.every((o) => Math.abs(o) < 0.01) && f.anim.every((a) => a === 'none')), tag('reduce: P2 se mueve'))
    ok(fr.filter((f) => f.layer).length <= 2 && !fr.at(-1).layer && fr.at(-1).val === '20', tag(`reduce: la capa no se retira en el acto (${fr.filter((f) => f.layer).length} cuadros)`))
    await page.focus('#s-max')
    const s2 = page.evaluate(SAMPLER, ['s-max', 300]); await page.waitForTimeout(30); await page.keyboard.press('ArrowUp')
    const f2 = await s2
    ok(f2.every((f) => Math.abs(f.dy) < 0.01) && f2.filter((f) => f.bumping).length <= 2 && !f2.at(-1).bumping, tag('reduce: P3 se mueve o la clase queda'))
    await page.evaluate(() => document.activeElement.blur())
    await page.click('#ef-send')
    await settle()
    const sh = await page.evaluate(() => { const r = document.getElementById('ef-qty').closest('.g-input'); return { cls: r.classList.contains('is-rejected'), anim: r.getAnimations({ subtree: true }).map((a) => a.animationName || a.transitionProperty) } })
    ok(sh.cls && !sh.anim.some((a) => /reject/.test(a)), tag(`reduce: I2 por GForm ${JSON.stringify(sh)}`))
    const i1 = await page.evaluate(async () => { window.__msg.value = true; await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))); const m = document.querySelector('[data-case="s-msg"] .g-input__message'); return { props: m.getAnimations().map((a) => a.transitionProperty), tr: getComputedStyle(m).translate } })
    ok(!i1.props.includes('translate') && (i1.tr === 'none' || /^0px( 0px)?$/.test(i1.tr)), tag(`reduce: I1 se mueve ${JSON.stringify(i1)}`))
    await page.emulateMedia({ reducedMotion: 'no-preference' })
  }

  /* 12 · I2 puesto por GForm al enviar: una sola animación (g-reject-shake en g-input__row), −/+ con la fila, retirada; foco
     desde GErrorSummary con el anillo de GInput */
  for (const qs of ['', 'audit=1']) {
    await go('?' + qs)
    const r = await page.evaluate(async () => {
      const root = document.getElementById('ef-qty').closest('.g-input')
      const row = root.querySelector('.g-input__row'), st = root.querySelector('.g-number-field__steppers')
      const x0 = st.getBoundingClientRect().left, r0 = row.getBoundingClientRect().left
      document.getElementById('ef-send').click()
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
      const names = root.getAnimations({ subtree: true }).filter((a) => a.animationName).map((a) => a.animationName + '@' + a.effect.target.className.split(' ')[0])
      const others = ['ef-peso', 'ef-nom'].map((i) => document.getElementById(i).closest('.g-input').classList.contains('is-rejected'))
      let maxSt = 0, same = true
      const x1 = st.getBoundingClientRect().left - x0, y1 = row.getBoundingClientRect().left - r0
      await new Promise((res) => { const t0 = performance.now(); (function f() { const ds = st.getBoundingClientRect().left - x0 - x1, dr = row.getBoundingClientRect().left - r0 - y1; maxSt = Math.max(maxSt, Math.abs(ds)); if (Math.abs(ds - dr) > 0.3) same = false; if (performance.now() - t0 < 300) requestAnimationFrame(f); else res() })() })
      await new Promise((res) => setTimeout(res, 700))
      return { names, others, maxSt, same, cls: root.classList.contains('is-rejected'), invalid: document.getElementById('ef-qty').getAttribute('aria-invalid'), log: document.getElementById('ef-log').textContent }
    })
    ok(r.names.length === 1 && /^g-reject-shake@g-input__row/.test(r.names[0]), tag(`?${qs} I2 (GForm): animaciones ${r.names}`))
    ok(r.maxSt > 1 && r.same, tag(`?${qs} I2: −/+ no van con la fila ${JSON.stringify(r)}`))
    ok(!r.cls && r.others.every((x) => !x), tag(`?${qs} I2: is-rejected no se retira o llega a campos sin error ${JSON.stringify(r)}`))
    ok(r.invalid === 'true' && r.log === 'invalid', tag(`?${qs} I2: envío ${JSON.stringify(r)}`))
    // GErrorSummary: el enlace lleva al campo; anillo de GInput en el conjunto
    await page.locator('.g-error-summary__link').first().click()
    await page.waitForTimeout(250)
    const fx = await page.evaluate(() => { const a = document.activeElement; const row = a.closest('.g-input__row'); const cs = row && getComputedStyle(row); return { id: a.id, st: cs?.outlineStyle, w: parseFloat(cs?.outlineWidth), vis: a.getBoundingClientRect().top >= 0 && a.getBoundingClientRect().bottom <= innerHeight } })
    ok(fx.id === 'ef-qty' && fx.st === 'solid' && fx.w >= 1.5 && fx.vis, tag(`?${qs} foco desde GErrorSummary ${JSON.stringify(fx)}`))
    // Corregir con + (sin foco previo, botón) quita el error del resumen; el campo no se sacude más
    await page.evaluate(() => document.activeElement.blur())
  }

  /* 13 · I1: el mensaje sale del campo (transición de GInput, una vez) */
  {
    await go('')
    const r = await page.evaluate(async () => {
      const m = document.querySelector('[data-case="s-msg"] .g-input__message')
      const ready = m.closest('.g-input').classList.contains('is-ready')
      window.__msg.value = true
      const out = []
      await new Promise((res) => { const t0 = performance.now(); (function f() { const cs = getComputedStyle(m); out.push({ o: parseFloat(cs.opacity), t: cs.translate }); if (performance.now() - t0 < 400) requestAnimationFrame(f); else res() })() })
      return { ready, out, props: m.getAnimations().map((a) => a.transitionProperty) }
    })
    const ys = r.out.map((x) => parseFloat(String(x.t).split(' ')[1] ?? 0) || 0)
    ok(r.ready && r.out[0].o < 1 && r.out.at(-1).o === 1 && Math.min(...ys) < -0.5 && near(ys.at(-1), 0, 0.01), tag(`I1: el mensaje no entra desde la caja ${JSON.stringify({ ready: r.ready, first: r.out[0], last: r.out.at(-1) })}`))
  }

  /* 14 · forced-colors (solo Chromium lo emula) */
  if (engine === 'chromium') {
    for (const qs of ['', 'dark=1', 'audit=1']) {
      await page.emulateMedia({ forcedColors: 'active' })
      await go('?' + qs)
      const fc = await page.evaluate(() => {
        const cs = (c, s) => getComputedStyle(document.querySelector(`[data-case="${c}"] ${s}`))
        const inc = cs('s-rest', '.g-number-field__step--increment'), dec = cs('s-min', '.g-number-field__step--decrement'), dis = cs('s-disabled', '.g-number-field__step--increment')
        return { canvas: getComputedStyle(document.body).backgroundColor, inc: inc.color, sep: [inc.borderLeftStyle, parseFloat(inc.borderLeftWidth), inc.borderLeftColor], dec: dec.color, dis: dis.color,
          inv: [parseFloat(cs('s-invalid', '.g-input__control').borderTopWidth), parseFloat(cs('s-invalid', '.g-number-field__steppers').marginTop)] }
      })
      const t = tag(`forced-colors ?${qs}`)
      ok(fc.inc !== fc.canvas && fc.sep[0] === 'solid' && fc.sep[1] >= 1 && fc.sep[2] !== fc.canvas, `${t}: −/+ o separador invisibles ${JSON.stringify(fc)}`)
      ok(fc.dec !== fc.inc && fc.dis === fc.dec, `${t}: deshabilitado no es GrayText ${JSON.stringify(fc)}`)
      ok(near(fc.inv[1], -fc.inv[0], 0.01), `${t}: con error −/+ no tapan el borde real (${fc.inv})`)
      const b = page.locator('[data-case="s-rest"] .g-number-field__step--increment'); const bb = await b.boundingBox()
      await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await page.waitForTimeout(250)
      const hv = await page.evaluate(() => { const s = getComputedStyle(document.querySelector('[data-case="s-rest"] .g-number-field__step--increment')); return [s.backgroundColor, s.color] })
      ok(hv[0] !== fc.canvas && hv[0] !== hv[1], `${t}: pasar sin Highlight ${hv}`)
      await page.mouse.move(0, 0)
      await page.focus('#s-rest')
      const fo = await page.evaluate(() => { const cs = getComputedStyle(document.getElementById('s-rest').closest('.g-input__row')); return [cs.outlineStyle, parseFloat(cs.outlineWidth), cs.outlineColor] })
      ok(fo[0] !== 'none' && fo[1] >= 1 && fo[2] !== fc.canvas, `${t}: foco invisible ${fo}`)
      await page.evaluate(() => document.activeElement.blur())
    }
    await page.emulateMedia({ forcedColors: 'none' })
  }

  /* 15 · Puntero grueso (Chromium y WebKit con táctil): −/+ 44×44, caja ≥ 44, mínimo publicado con −/+ de 44 */
  if (engine !== 'firefox') {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: engine === 'chromium' })
    const p2 = await ctx.newPage(); watch(p2)
    await go('', p2)
    const coarse = await p2.evaluate(() => matchMedia('(pointer: coarse)').matches)
    if (!coarse) notes.push(`${engine}: pointer: coarse no se emula (puntero grueso sin medir en este motor)`)
    else {
      const g = await p2.evaluate(geometry)
      notes.push(`${engine} táctil −/+: ${Object.entries(g.sizes).map(([k, s]) => k + ' ' + s.btns[0].w + '×' + s.btns[0].h).join(' · ')}`)
      for (const [sid, s] of Object.entries(g.sizes)) for (const b of s.btns) ok(near(b.w, Math.max(44, s.expected)) && near(b.h, Math.max(44, s.expected)), tag(`táctil ${sid}: −/+ ${b.w}×${b.h}`))
      for (const [sid, s] of Object.entries(g.sizes)) ok(s.box >= 44 - 0.01 && near(s.box, s.inputBox), tag(`táctil ${sid}: caja ${s.box} / GInput ${s.inputBox}`))
      ok(g.overflow <= 0, tag(`táctil: desborde ${g.overflow}`))
      ok(g.n320.sufIn, tag('táctil: unidad fuera de la caja'))
      const n = await p2.evaluate(NEED, 'ref-qty')
      notes.push(`${engine} táctil: «99» necesita ${Math.ceil(n.need)}px`)
      // Un toque en + suma sin enfocar el campo (sin teclado en pantalla)
      await p2.evaluate(() => document.querySelector('[data-case="st-md"]').scrollIntoView({ block: 'center' }))
      const bb = await p2.locator('[data-case="st-md"] .g-number-field__step--increment').boundingBox()
      await p2.touchscreen.tap(bb.x + bb.width / 2, bb.y + bb.height / 2)
      await p2.waitForTimeout(100)
      const t = await p2.evaluate(() => ({ v: document.getElementById('st-md').value, a: document.activeElement.tagName }))
      ok(t.v === '13' && t.a !== 'INPUT', tag(`táctil: un toque en + ${JSON.stringify(t)}`))
    }
    await ctx.close()
  }

  /* 16 · Escalas fraccionarias y zoom 200 % aproximado (visor 640 con DPR 2) */
  for (const dpr of [1.25, 1.5, 2]) {
    const ctx = await browser.newContext({ viewport: { width: 1000, height: 800 }, deviceScaleFactor: dpr })
    const p2 = await ctx.newPage(); watch(p2); await go('', p2)
    const w = await p2.evaluate(() => parseFloat(getComputedStyle(document.querySelector('[data-case="s-rest"] .g-number-field__step')).borderLeftWidth))
    ok(w * dpr >= 1 - 0.01, tag(`DPR ${dpr}: separador ${w}px`))
    await ctx.close()
  }
  for (const qs of ['', 'audit=1', 'test=1']) {
    const ctx = await browser.newContext({ viewport: { width: 640, height: 450 }, deviceScaleFactor: 2 })
    const p2 = await ctx.newPage(); watch(p2); await go('?' + qs, p2)
    const g = await p2.evaluate(geometry)
    for (const r of g.rows) for (const l of r.lines) if (l.length > 1) ok(l.every((k) => near(k.top, l[0].top, 1)) && l.every((k) => near(k.h, l[0].h, 0.5)), tag(`zoom 200 % ?${qs} fila ${r.row}: ${JSON.stringify(l)}`))
    ok(g.overflow <= 0 && g.n320.sufIn, tag(`zoom 200 % ?${qs}: desborde ${g.overflow} o unidad fuera`))
    const clip = await p2.evaluate(() => [...document.querySelectorAll('.g-number-field[data-case]')].filter((r) => { const c = r.querySelector('.g-input__control').getBoundingClientRect(); return [...r.querySelectorAll('.g-input__control > *')].some((k) => { const b = k.getBoundingClientRect(); return b.width && (b.right > c.right + 0.5 || b.left < c.left - 0.5) }) || r.getBoundingClientRect().right > document.documentElement.clientWidth + 0.5 }).map((r) => r.dataset.case))
    ok(!clip.length, tag(`zoom 200 % ?${qs}: cajas que desbordan ${clip}`))
    await ctx.close()
  }

  /* 17 · Playground: #sec-number y signos vitales (componente real con el tema del playground), claro y oscuro */
  for (const dark of [false, true]) {
    await page.goto(PLAY)
    await page.waitForSelector('#nf-qty')
    await page.evaluate((d) => { document.documentElement.dataset.theme = d ? 'dark' : 'light' }, dark)
    await page.evaluate(() => document.fonts.ready)
    await page.evaluate(`window.__lib = (${lib})()`)
    await page.waitForTimeout(400)
    const m = await page.evaluate(CONTRAST_ANY, '#sec-number .g-number-field, #fm-vitals .g-number-field')
    for (const c of m) ok(c.r >= c.min, tag(`playground ${dark ? 'oscuro' : 'claro'}: ${c.k} ${c.r}:1 < ${c.min}`))
    ok(m.length > 20, tag(`playground: pocos GNumberField medidos (${m.length})`))
    const sz = await page.evaluate(() => [...document.querySelectorAll('#sec-number .g-number-field--has-steppers')].filter((r) => r.getClientRects().length).map((r) => { const c = r.querySelector('.g-input__control').getBoundingClientRect(); const rtl = getComputedStyle(r).direction === 'rtl'; return [...r.querySelectorAll('.g-number-field__step')].map((b) => { const x = b.getBoundingClientRect(); const edge = !b.classList.contains('g-number-field__step--increment') || (rtl ? Math.abs(x.left - c.left) < 0.6 : Math.abs(c.right - x.right) < 0.6); return Math.abs(x.height - c.height) < 0.6 && Math.abs(x.width - x.height) < 0.6 && edge }) }).flat())
    ok(sz.length > 10 && sz.every(Boolean), tag(`playground: −/+ no son cuadrados del alto de la caja de borde a borde (${sz.filter((x) => !x).length} de ${sz.length})`))
  }

  ok(!errors.length, tag(`consola: ${[...new Set(errors)].join(' | ')}`))
  await browser.close()
}

/* ---------- 18 · GInput sin slots internos: lo mismo que antes de GNumberField (Chromium, --old-dist) ---------- */
if (OLD) {
  const browser = await pw.chromium.launch()
  const shot = async (old) => {
    const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } })
    if (old) {
      await page.route('**/packages/vue/dist/grana.umd.js', async (r) => r.fulfill({ body: await readFile(join(OLD, 'grana.umd.js')), contentType: 'text/javascript' }))
      await page.route('**/packages/vue/dist/grana.css', async (r) => r.fulfill({ body: await readFile(join(OLD, 'grana.css')), contentType: 'text/css' }))
    }
    await page.goto(`${ORIGIN}/design/lab/number-field/auditoria-ginput.html`)
    await page.waitForSelector('html[data-ready]', { state: 'attached' })
    const PROPS = ['display', 'position', 'color', 'background-color', 'border-top-width', 'border-top-color', 'border-top-style', 'border-right-width', 'border-top-right-radius', 'padding-inline-start', 'padding-inline-end', 'margin-inline-start', 'margin-inline-end', 'gap', 'font-size', 'line-height', 'font-weight', 'outline-style', 'box-shadow', 'opacity', 'cursor', 'translate', 'transition-property', 'animation-name', 'text-align', 'font-variant-numeric']
    const snap = () => page.evaluate((P) => {
      const out = {}
      for (const r of document.querySelectorAll('.g-input')) {
        const id = r.querySelector('input')?.id || 'x'
        const els = [r, ...r.querySelectorAll('*')]
        out[id] = {
          html: r.outerHTML.replace(/ id="[^"]*-label"/g, '').replace(/<!--[^>]*-->/g, ''),
          els: els.map((e) => { const b = e.getBoundingClientRect(); const cs = getComputedStyle(e); return [e.tagName + '.' + (e.getAttribute('class') || ''), +b.x.toFixed(2), +b.y.toFixed(2), +b.width.toFixed(2), +b.height.toFixed(2), P.map((p) => cs.getPropertyValue(p)).join('|')] })
        }
      }
      return out
    }, PROPS)
    const a = await snap()
    // Enviar con errores: GForm pone is-rejected; al pasar el cuadro, misma animación
    await page.click('#row-send')
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
    const rej = await page.evaluate(() => [...document.querySelectorAll('.g-input')].map((r) => (r.classList.contains('is-rejected') ? 'R' : '-') + r.getAnimations({ subtree: true }).map((x) => x.animationName || x.transitionProperty).join(',')).join(' '))
    await page.focus('#c-md-default')
    const foc = await page.evaluate(() => { const cs = getComputedStyle(document.getElementById('c-md-default').closest('.g-input__row')); return [cs.outlineStyle, cs.outlineWidth, cs.outlineColor].join(' ') })
    await page.close()
    return { a, rej, foc }
  }
  const now = await shot(false), before = await shot(true)
  const ids = Object.keys(before.a)
  ok(ids.length >= 25 && ids.every((i) => now.a[i]), `GInput: casos que faltan ${ids.filter((i) => !now.a[i])}`)
  let diffs = []
  for (const i of ids) {
    if (!now.a[i]) continue
    if (now.a[i].html !== before.a[i].html) diffs.push(`${i}: HTML`)
    const A = now.a[i].els, B = before.a[i].els
    if (A.length !== B.length) { diffs.push(`${i}: ${A.length} vs ${B.length} elementos`); continue }
    // Lo que gira (el cargador) se compara sin su caja: el cuadro de la captura cambia la rotación
    A.forEach((e, k) => { const spin = /g-input-spin/.test(e[5]) || /g-input__loader/.test(A.find((x) => /g-input__loader/.test(x[0]))?.[0] || '') && /^path\./.test(e[0]); const a2 = spin ? [e[0], e[5]] : e, b2 = spin ? [B[k][0], B[k][5]] : B[k]; if (JSON.stringify(a2) !== JSON.stringify(b2)) diffs.push(`${i}: ${e[0]} ${JSON.stringify(e.slice(1))} ≠ ${JSON.stringify(B[k].slice(1))}`) })
  }
  ok(!diffs.length, `GInput sin slots internos difiere de antes de GNumberField: ${diffs.slice(0, 6).join(' | ')}`)
  ok(now.rej === before.rej, `GInput: I2 por GForm difiere ${now.rej} / ${before.rej}`)
  ok(now.foc === before.foc, `GInput: foco difiere ${now.foc} / ${before.foc}`)
  notes.push(`GInput sin slots internos (Chromium, ${ids.length} campos, ${Object.values(now.a).reduce((n, x) => n + x.els.length, 0)} elementos): HTML (salvo el id de la etiqueta), cajas, estilos calculados, I2 y foco idénticos a ${OLD}`)
  await browser.close()
} else notes.push('GInput sin slots internos: sin --old-dist, no se comparó con el dist/ anterior')

server.close()
if (notes.length) console.log('\nNotas:\n' + [...new Set(notes)].map((n) => '  · ' + n).join('\n'))
console.log(`\n${total - failed}/${total} correctas`)
if (failed) { console.log(fails.slice(0, 80).map((f) => '  ✗ ' + f).join('\n')); if (fails.length > 80) console.log(`  … y ${fails.length - 80} más`); process.exitCode = 1 }
