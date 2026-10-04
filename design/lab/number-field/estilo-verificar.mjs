// Verificación de coco sobre el banco de GNumberField (design/lab/number-field/estilo-banco.html), con el CSS real cargado
// en la capa grana.components y los vecinos reales de dist/. Mide: análisis estático del CSS (sin literales, sin respaldos,
// sin @layer, keyframes g-number-roll…/g-number-bump… y nunca g-reject…, movimiento solo con no-preference, hover solo en
// (hover: hover)); contraste del valor, prefijo, sufijo, icono y separador de −/+ (y del par de pasar/pulsar) en el tema
// por defecto claro y oscuro, el «Tema de prueba» y los once temas generados (claro y oscuro); −/+ cuadrados del alto de la
// caja de cada tamaño, de borde a borde, piso 24px y 44×44 con puntero grueso; P1 separación valor–sufijo = gap de la caja
// por tamaño (1, 3 y 6 caracteres); tabular-nums; P2 solo las cifras que cambian, ≥ 2 posiciones intermedias, sentido,
// alineación con el texto del campo, retirada, sin rodar al repetir; P3 ≤ space × 0.5 y vuelta a 0; movimiento reducido
// sin movimiento; I2 sin duplicar; estados (error, advertencia, soft, pill, solo lectura, deshabilitado); fila real con
// GInput y GSelect (Δ top ≤ 1px, misma altura) a 1100/720/320; RTL; 320 sin desborde con la unidad visible; mínimo de
// referencia (#312) comprobado al píxel; forced-colors (Chromium); escalas fraccionarias; consola limpia.
// Ejecutar desde la raíz del repo (requiere `npm run build`): node design/lab/number-field/estilo-verificar.mjs
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
await new Promise((r) => server.listen(Number(process.env.GRANA_PW_PORT) || 0, '127.0.0.1', r))
const BASE = `http://127.0.0.1:${server.address().port}/design/lab/number-field/estilo-banco.html`

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
    // Un reintento: en WebKit una carga suelta a veces no llega a data-ready (sin error de la página)
    for (let i = 0; ; i++) { try { await p.goto(BASE + qs); await p.waitForSelector('html[data-ready]', { state: 'attached', timeout: 15000 }); break } catch (e) { if (i) throw e } }
    await p.evaluate(() => document.fonts.ready)
    await p.evaluate(`window.__lib = (${lib})()`)
    await p.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
    if (/theme=|test=|dark=/.test(qs)) await p.waitForTimeout(350)
  }
  const tag = (s) => `${engine} ${s}`

  /* 1 · Contraste: por defecto (claro, oscuro), Tema de prueba y los once generados (claro y oscuro) */
  const worst = {}
  for (const [name, qs] of [['defecto', ''], ['defecto', 'dark=1'], ['prueba', 'test=1'], ...GEN.flatMap((t) => [[t, `theme=${t}`], [t, `theme=${t}&dark=1`]])]) {
    await go('?' + qs)
    const m = await page.evaluate(contrast)
    const t = `${name} ${qs.includes('dark') ? 'oscuro' : 'claro'}`
    if (args.debug) console.log(t, m.filter((c) => c.r < c.min))
    for (const c of m) {
      if (c.r < c.min && /^pasar/.test(c.k)) { notes.push(`${t}: ${c.k} ${c.r}:1 (par del tema)`); continue }
      ok(c.r >= c.min, tag(`${t}: ${c.k} ${c.r}:1 < ${c.min}`))
    }
    const w = (re) => Math.min(...m.filter((c) => re.test(c.k)).map((c) => c.r))
    worst[t] = { valor: w(/valor/), sufijo: w(/ (suffix|prefix)$/), icono: w(/icono/), separador: w(/separador/), pasar: w(/pasar: icono/) }
  }
  if (engine === 'chromium') {
    console.log('Contraste mínimo (valor · sufijo/prefijo · icono −/+ · separador · icono al pasar):')
    for (const [t, r] of Object.entries(worst)) if (args.verbose || /defecto|prueba|spotify|caracol/.test(t)) console.log(`  ${t.padEnd(24)} ${Object.values(r).join(' · ')}`)
    const all = Object.values(worst)
    console.log(`  mínimo en ${all.length} temas       ${['valor', 'sufijo', 'icono', 'separador', 'pasar'].map((k) => Math.min(...all.map((r) => r[k]))).join(' · ')}`)
  }

  /* 2 · Geometría: tema por defecto, oscuro y Tema de prueba (borde 2px, space 5) */
  for (const qs of ['', 'dark=1', 'test=1']) {
    await go('?' + qs)
    const g = await page.evaluate(geometry)
    const t = (s) => tag(`?${qs} ${s}`)
    if (engine === 'chromium') notes.push(`?${qs} −/+ por tamaño: ${Object.entries(g.sizes).map(([k, s]) => k + ' ' + s.btns[0].w).join(' · ')}; P1 valor–sufijo: ${Object.entries(g.p1).map(([k, p]) => k + ' ' + p.gaps[0]).join(' · ')}`)
    for (const [sid, s] of Object.entries(g.sizes)) {
      for (const b of s.btns) {
        ok(near(b.w, s.expected) && near(b.h, s.expected), t(`${sid}: −/+ ${b.w}×${b.h} ≠ ${s.expected} (cuadrado del alto de la caja)`))
        ok(b.w >= 24 - 0.01 && b.h >= 24 - 0.01, t(`${sid}: −/+ bajo 24px`))
        ok(near(b.top, 0) && near(b.bottom, 0) && b.right <= 0.5 && b.right >= -0.5 || b.right > s.expected - 1, t(`${sid}: −/+ no llegan de borde a borde ${JSON.stringify(b)}`))
      }
      ok(near(s.btns[1].right, 0), t(`${sid}: + no llega al borde final (${s.btns[1].right})`))
      ok(near(s.box, s.inputBox) && near(s.nfBox, s.inputBox), t(`${sid}: caja ${s.box}/${s.nfBox} ≠ GInput ${s.inputBox}`))
      ok(near(s.icon, s.fs, 0.1), t(`${sid}: icono ${s.icon} ≠ 1em del texto (${s.fs})`))
      const p = g.p1[sid]
      ok(p.gaps.every((x) => near(x, p.expected, 0.5)), t(`${sid}: P1 valor–sufijo ${p.gaps} ≠ gap ${p.expected}`))
      // Tinta: con 1 carácter el espejo puede tener el piso de 1ch (una fuente sin cifras tabulares, «7» < «0»)
      ok(Math.max(...p.ink) - Math.min(...p.ink) <= 1 && p.ink.every((x) => x >= p.expected - 0.01 && x <= p.expected + 2), t(`${sid}: P1 distancia de tinta ${p.ink} (gap ${p.expected} + 1px del cursor)`))
      ok(p.fromStart < p.boxW / 3, t(`${sid}: P1 el sufijo no está pegado (${p.fromStart} de ${p.boxW})`))
    }
    for (const [c, s] of Object.entries(g.states)) {
      for (const [a, b, e] of s.cover) ok(near(a, 0) && near(b, 0), t(`${c}: −/+ no cubren de borde a borde ${JSON.stringify(s.cover)}`))
      ok(near(s.cover.at(-1)[2], 0), t(`${c}: + no llega al borde final ${s.cover.at(-1)[2]}`))
      for (const [col, w, clip] of s.blockBorder) ok(/rgba\(0, 0, 0, 0\)|transparent/.test(col) && clip === 'padding-box', t(`${c}: trazo de −/+ no transparente o fondo sin recortar ${col} ${clip}`))
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
    for (const r of g.rows) for (const l of r.lines) if (l.length > 1) {
      ok(l.every((k) => near(k.top, l[0].top, 1)) && l.every((k) => near(k.h, l[0].h, 0.5)), t(`fila ${r.row}: cajas ${JSON.stringify(l)}`))
    }
    for (const [c, r] of Object.entries(g.rtl)) {
      ok(r.stepsLeft && r.incLeft && near(r.edge, 0), t(`${c}: RTL −/+ ${JSON.stringify(r)}`))
      ok(near(r.gap, g.p1.md.expected), t(`${c}: RTL valor–sufijo ${r.gap} ≠ ${g.p1.md.expected}`))
      ok(r.align <= 0.5, t(`${c}: text-align: match-parent no ancla a la derecha en RTL (hueco ${r.align}px)`))
    }
    ok(g.n320.ctlOverflow <= g.bw + 0.5 && g.n320.sufIn && g.n320.sufW >= g.n320.sufNatural - 0.5 && g.n320.shrunk && g.n320.rootOut <= 0.5, t(`320: número largo ${JSON.stringify(g.n320)}`))
    ok(g.overflow <= 0, t(`desborde de la página ${g.overflow}`))
  }

  /* 3 · Anchos de ventana: filas, sin desborde */
  for (const w of [720, 480, 360, 320]) {
    await page.setViewportSize({ width: w, height: 900 })
    await go('')
    const g = await page.evaluate(geometry)
    for (const r of g.rows) for (const l of r.lines) if (l.length > 1) ok(l.every((k) => near(k.top, l[0].top, 1)) && l.every((k) => near(k.h, l[0].h, 0.5)), tag(`${w}px fila ${r.row}: ${JSON.stringify(l)}`))
    ok(g.overflow <= 0, tag(`${w}px: desborde ${g.overflow}`))
    ok(g.n320.sufIn && g.n320.ctlOverflow <= 1.5, tag(`${w}px: unidad fuera de la caja ${JSON.stringify(g.n320)}`))
  }
  await page.setViewportSize({ width: 1280, height: 900 })

  /* 4 · Mínimo de referencia (#312): «Cantidad» 1–99 con −/+ en md, space 4. Al píxel: con ese ancho de caja «99» cabe
     entero; con 1px menos, no */
  for (const qs of ['', 'test=1']) {
    await go('?' + qs)
    const r = await page.evaluate(async () => {
      const ref = window.__referenceMin()
      const root = document.querySelector('[data-case="ref-qty"]')
      const f = root.querySelector('.g-number-field__field'), cell = root.querySelector('.g-number-field__value'), m = root.querySelector('.g-number-field__mirror')
      window.__nf.get('ref-qty').model.value = 99; window.__nf.get('ref-qty').text.value = '99'
      const fits = async (w) => { root.style.inlineSize = w + 'px'; root.classList.remove('g-input--block'); await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))); const c = cell.getBoundingClientRect().width; return { cell: +c.toFixed(3), need: +ref.meas.toFixed(3), fits: c >= ref.meas - 0.01 } }
      const at = await fits(ref.min), below = await fits(ref.min - 1)
      root.style.inlineSize = ''; root.classList.add('g-input--block')
      return { ref, at, below }
    })
    ok(r.at.fits && !r.below.fits, tag(`?${qs} mínimo ${r.ref.min}px no es exacto ${JSON.stringify(r)}`))
    ok(r.ref.naive > r.ref.min + 50, tag(`?${qs} «caja − celda + medidor» debería sobrecontar el hueco libre de P1 (${r.ref.naive} vs ${r.ref.min})`))
    if (engine === 'chromium') notes.push(`mínimo de referencia ${qs || 'defecto (md, space 4)'}: ${r.ref.min}px (medidor «99» ${r.ref.meas.toFixed(2)}px; «caja − celda + medidor» sin restar el hueco libre daría ${r.ref.naive}px)`)
  }

  /* 5 · Foco: el anillo es el de GInput sobre el conjunto; −/+ con anillo si una tecnología de apoyo los enfoca */
  await go('')
  {
    await page.focus('#s-rest')
    await page.waitForTimeout(300)
    const f = await page.evaluate(() => { const row = document.querySelector('[data-case="s-rest"] .g-input__row'); const cs = getComputedStyle(row); const { tok } = window.__lib; const fc = tok('--g-color-focus'); return { st: cs.outlineStyle, w: parseFloat(cs.outlineWidth), c: cs.outlineColor, fc: `rgb(${fc.slice(0, 3).join(', ')})` } })
    ok(f.st === 'solid' && f.w >= 1.5 && f.c === f.fc, tag(`foco del campo ${JSON.stringify(f)}`))
    await page.keyboard.press('Shift')
    const s = await page.evaluate(() => { const b = document.querySelector('[data-case="s-rest"] .g-number-field__step--increment'); b.focus(); const cs = getComputedStyle(b); return { fv: b.matches(':focus-visible'), st: cs.outlineStyle, w: parseFloat(cs.outlineWidth), off: parseFloat(cs.outlineOffset) } })
    if (s.fv) ok(s.st === 'solid' && s.w >= 1.5 && s.off + s.w <= 0.01, tag(`foco de + ${JSON.stringify(s)}`))
    await page.evaluate(() => document.activeElement.blur())
  }

  /* 5b · P1 con el foco: con el cursor al final el texto no se desplaza (el 1px del espejo es el sitio del cursor) */
  for (const id of ['p1-xs-6', 'p1-md-1', 'p1-md-6', 'p1-xl-6', 'st-md', 'rtl-ar', 'rtl-he']) {
    await page.focus('#' + id); await page.keyboard.press('End'); await page.waitForTimeout(30)
    const sl = await page.evaluate((i) => { const f = document.getElementById(i); return { sl: f.scrollLeft, sw: f.scrollWidth, cw: f.clientWidth } }, id)
    ok(sl.sl === 0 && sl.sw <= sl.cw + 1, tag(`P1 con foco: ${id} se desplaza ${JSON.stringify(sl)}`))
  }
  await page.evaluate(() => document.activeElement.blur())

  /* 6 · Pasar y pulsar (con pointerdown + preventDefault, como hará el .vue) */
  {
    const b = page.locator('[data-case="s-rest"] .g-number-field__step--decrement')
    await page.evaluate(() => document.querySelector('[data-case="s-rest"]').scrollIntoView({ block: 'center' }))
    await b.hover()
    await page.waitForTimeout(250)
    const hv = await page.evaluate(() => { const b = document.querySelector('[data-case="s-rest"] .g-number-field__step--decrement'); const { tok } = window.__lib; const cs = getComputedStyle(b); const ns = tok('--g-color-neutral-soft'), tx = tok('--g-color-text'); return { bg: cs.backgroundColor, color: cs.color, ns: `rgb(${ns.slice(0, 3).join(', ')})`, tx: `rgb(${tx.slice(0, 3).join(', ')})` } })
    ok(hv.bg === hv.ns && hv.color === hv.tx, tag(`pasar sobre −: ${JSON.stringify(hv)}`))
    await page.mouse.down()
    await page.waitForTimeout(250)
    const act = await page.evaluate(() => { const b = document.querySelector('[data-case="s-rest"] .g-number-field__step--decrement'); return { active: b.matches(':active'), bg: getComputedStyle(b).backgroundColor, focus: document.activeElement === document.body } })
    await page.mouse.up()
    ok(act.focus, tag('pulsar −: movió el foco (el .vue cancela pointerdown)'))
    if (!act.active) notes.push(`${engine}: :active no se aplica con pointerdown cancelado (el fondo de pulsar lo da el de pasar en puntero fino; en táctil no hay fondo de pulsar)`)
    await page.mouse.move(0, 0)
  }

  /* 7 · P2 · cifras que ruedan */
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
    ok(during.every((f) => f.align && Math.abs(f.align[0]) <= 0.5 && Math.abs(f.align[1]) <= 0.5), tag(`P2: la capa no coincide con el texto del campo ${JSON.stringify(during.map((f) => f.align))}`))
    const end = fr.findIndex((f, i) => i > fr.indexOf(during[0]) && !f.layer)
    ok(end > 0 && fr[end].t - during[0].t <= 160 + 140 && !fr.at(-1).layer && !fr.at(-1).rolling, tag(`P2: la capa no se retira a tiempo (${end > 0 ? fr[end].t - during[0].t : 'nunca'}ms)`))
    notes.push(`${engine} P2 19→20: ${during.length} cuadros con capa, ${mids.size} posiciones intermedias, retirada a los ${end > 0 ? Math.round(fr[end].t - during[0].t) : '?'}ms`)
    const last = during.at(-1)
    ok(last.off.every((o) => Math.abs(o) <= 1.5), tag(`P2: la cifra nueva no termina en su sitio ${last.off}`))
    // 20 → 21: una cifra; 21 → 20 con ↓: hacia abajo
    const s2 = page.evaluate(SAMPLER, ['s-rest', 400]); await page.waitForTimeout(30); await page.keyboard.press('ArrowUp')
    const f2 = (await s2).filter((f) => f.layer)
    ok(f2.length && f2.every((f) => f.n === 1), tag(`P2 20→21: ranuras ${[...new Set(f2.map((f) => f.n))]}`))
    const s3 = page.evaluate(SAMPLER, ['s-rest', 400]); await page.waitForTimeout(30); await page.keyboard.press('ArrowDown')
    const f3 = (await s3).filter((f) => f.layer)
    ok(f3.length && f3.every((f) => f.dir === 'down' && f.off.every((o) => o <= 0.01)) && f3.some((f) => f.off.some((o) => o < -0.3)), tag(`P2 al restar: la cifra nueva no entra desde arriba ${JSON.stringify(f3.map((f) => f.off))}`))
    // Mantener + 1s: después del primer paso, nada rueda
    const btn = page.locator('[data-case="s-rest"] .g-number-field__step--increment')
    const bb = await btn.boundingBox()
    const hold = page.evaluate(() => new Promise((res) => { let max = 0; const t0 = performance.now(); (function f() { const k = document.querySelectorAll('[data-case="s-rest"] .g-number-field__roll-slot').length; if (performance.now() - t0 > 450) max = Math.max(max, k); if (performance.now() - t0 < 1100) requestAnimationFrame(f); else res(max) })() }))
    await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await page.mouse.down(); await page.waitForTimeout(1050); await page.mouse.up()
    ok((await hold) === 0, tag('P2: rueda al repetir (botón mantenido)'))
    await page.mouse.move(0, 0)
  }

  /* 8 · P3 · el tope */
  {
    await go('')
    const space = await page.evaluate(() => window.__lib.px('--g-space-1'))
    await page.focus('#s-max')
    const s = page.evaluate(SAMPLER, ['s-max', 450]); await page.waitForTimeout(30); await page.keyboard.press('ArrowUp')
    const fr = await s
    const dys = fr.map((f) => f.dy)
    const peak = Math.min(...dys)
    ok(peak < -0.5 && peak >= -space * 0.5 - 0.01 && Math.max(...dys) <= 0.01, tag(`P3 ↑ en el máximo: ${peak}px (≤ ${space * 0.5}, hacia arriba)`))
    notes.push(`${engine} P3: pico ${peak}px (tope ${space * 0.5}px)`)
    ok(near(fr.at(-1).dy, 0, 0.01) && !fr.at(-1).bumping && fr.every((f) => f.val === '99' && !f.layer), tag(`P3: no vuelve a 0, queda la clase, cambió el valor o rodó ${JSON.stringify(fr.at(-1))}`))
    await page.focus('#s-min')
    const s2 = page.evaluate(SAMPLER, ['s-min', 450]); await page.waitForTimeout(30); await page.keyboard.press('ArrowDown')
    const d2 = (await s2).map((f) => f.dy)
    ok(Math.max(...d2) > 0.5 && Math.max(...d2) <= space * 0.5 + 0.01 && Math.min(...d2) >= -0.01, tag(`P3 ↓ en el mínimo: ${Math.max(...d2)}px hacia abajo`))
    await page.focus('#s-rest')
    const s3 = page.evaluate(SAMPLER, ['s-rest', 300]); await page.waitForTimeout(30); await page.keyboard.press('ArrowUp')
    ok((await s3).every((f) => !f.bumping && Math.abs(f.dy) < 0.01), tag('P3: tope fuera del límite'))
  }

  /* 9 · Movimiento reducido: nada se mueve ni queda capa o clase */
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
    const sh = await page.evaluate(async () => { window.__nf.get('s-reject').rejected.value = true; await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))); const root = document.querySelector('[data-case="s-reject"]'); return root.getAnimations({ subtree: true }).map((a) => a.animationName) })
    ok(sh.length === 0, tag(`reduce: I2 se mueve ${sh}`))
    await page.emulateMedia({ reducedMotion: 'no-preference' })
  }

  /* 10 · I2: la sacudida de GInput mueve la fila (y con ella −/+), una sola animación */
  {
    await go('')
    const r = await page.evaluate(async () => {
      const root = document.querySelector('[data-case="s-reject"]')
      const row = root.querySelector('.g-input__row'), st = root.querySelector('.g-number-field__steppers')
      const x0 = st.getBoundingClientRect().left, r0 = row.getBoundingClientRect().left
      window.__nf.get('s-reject').rejected.value = true
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
      const names = root.getAnimations({ subtree: true }).map((a) => a.animationName + '@' + a.effect.target.className.split(' ')[0])
      let maxSt = 0, maxRow = 0, same = true
      await new Promise((res) => { const t0 = performance.now(); (function f() { const ds = st.getBoundingClientRect().left - x0, dr = row.getBoundingClientRect().left - r0; maxSt = Math.max(maxSt, Math.abs(ds)); maxRow = Math.max(maxRow, Math.abs(dr)); if (Math.abs(ds - dr) > 0.3) same = false; if (performance.now() - t0 < 300) requestAnimationFrame(f); else res() })() })
      return { names, maxSt, maxRow, same, cls: root.classList.contains('is-rejected') }
    })
    ok(r.names.length === 1 && /^g-reject-shake@g-input__row/.test(r.names[0]), tag(`I2: animaciones ${r.names}`))
    ok(r.maxSt > 1 && r.same, tag(`I2: −/+ no van con la fila ${JSON.stringify(r)}`))
    ok(!r.cls, tag('I2: is-rejected no se retira al fin de la sacudida (el nombre de una animación propia la habría retirado antes)'))
  }

  /* 11 · forced-colors (solo Chromium lo emula) */
  if (engine === 'chromium') {
    for (const qs of ['', 'dark=1']) {
      await page.emulateMedia({ forcedColors: 'active' })
      await go('?' + qs)
      const fc = await page.evaluate(() => {
        const cs = (c, s) => getComputedStyle(document.querySelector(`[data-case="${c}"] ${s}`))
        const inc = cs('s-rest', '.g-number-field__step--increment'), dec = cs('s-min', '.g-number-field__step--decrement'), dis = cs('s-disabled', '.g-number-field__step--increment')
        const ctl = cs('s-rest', '.g-input__control')
        return { canvas: getComputedStyle(document.body).backgroundColor, inc: inc.color, sep: [inc.borderLeftStyle, parseFloat(inc.borderLeftWidth), inc.borderLeftColor], dec: dec.color, dis: dis.color, disSep: dis.borderLeftColor, box: ctl.borderTopColor, block: inc.borderTopColor,
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
    }
    await page.emulateMedia({ forcedColors: 'none' })
  }

  /* 12 · Puntero grueso (Chromium y WebKit con táctil): −/+ 44×44 en todos los tamaños, caja ≥ 44 */
  if (engine !== 'firefox') {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: engine === 'chromium' })
    const p2 = await ctx.newPage(); watch(p2)
    await go('', p2)
    const coarse = await p2.evaluate(() => matchMedia('(pointer: coarse)').matches)
    if (!coarse) notes.push(`${engine}: pointer: coarse no se emula (puntero grueso sin medir en este motor)`)
    else {
      const g = await p2.evaluate(geometry)
      notes.push(`${engine} táctil: mínimo de referencia ${(await p2.evaluate(() => window.__referenceMin().min))}px`)
      notes.push(`${engine} táctil −/+: ${Object.entries(g.sizes).map(([k, s]) => k + ' ' + s.btns[0].w + '×' + s.btns[0].h).join(' · ')}`)
      for (const [sid, s] of Object.entries(g.sizes)) for (const b of s.btns) ok(b.w >= 44 - 0.01 && b.h >= 44 - 0.01 && near(b.w, Math.max(44, s.expected)) && near(b.h, Math.max(44, s.expected)), tag(`táctil ${sid}: −/+ ${b.w}×${b.h}`))
      for (const [sid, s] of Object.entries(g.sizes)) ok(s.box >= 44 - 0.01 && near(s.box, s.inputBox), tag(`táctil ${sid}: caja ${s.box} / GInput ${s.inputBox}`))
      ok(g.overflow <= 0, tag(`táctil: desborde ${g.overflow}`))
      ok(g.n320.sufIn, tag('táctil: unidad fuera de la caja'))
    }
    await ctx.close()
  }

  /* 13 · Escalas fraccionarias: el separador no desaparece */
  for (const dpr of [1.25, 1.5, 2]) {
    const ctx = await browser.newContext({ viewport: { width: 1000, height: 800 }, deviceScaleFactor: dpr })
    const p2 = await ctx.newPage(); watch(p2); await go('', p2)
    const w = await p2.evaluate(() => parseFloat(getComputedStyle(document.querySelector('[data-case="s-rest"] .g-number-field__step')).borderLeftWidth))
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
