// Auditoría de coco (paso 5) de GTimeField sobre el COMPONENTE REAL: design/lab/time-field/auditoria-banco.html con
// GTimeField de dist/time-field.umd.js (entrada propia @grana/vue/time-field) y GInput, GForm, GFormLayout, GFormRow,
// GErrorSummary, GDatePicker, GSelect, GTooltip y GBtn de dist/grana.umd.js, con dist/grana.css y dist/fonts.css (como se
// publica). Repite la batería del banco de estilo (estilo-verificar.mjs) sobre el marcado que pone GTimeField.vue y añade lo
// que solo existe con el componente real: marcado frente al que espera el CSS; reglas de g-time-field en dist/grana.css;
// mínimo PUBLICADO a una GFormRow real (#410, barrido del ancho: la fila se parte antes de que la hora más ancha deje de caber
// y no sobrecuenta el hueco libre); bloquear/desbloquear sin repartir la fila; error propio al salir (#409) que bloquea el
// envío de GForm, is-rejected (I2) puesto por GForm, foco desde GErrorSummary y, fuera de GForm, setCustomValidity; teclado
// (↑/↓, Mayús, Re Pág/Av Pág, a/p, botones fuera del Tab); GTooltip envolviendo el campo (pestaña contra la caja visible);
// texto al 200 % y zoom 200 % aproximado; el playground (#sec-time, filas #tf-row/#tf-row2 con ?now=); y, en Chromium, el
// árbol accesible (límite de valuetext registrado por bruno).
// Temas: defecto claro y oscuro, el de la auditoría (auditoria-tema.css, @grana/cli: brand #1D3557, accent #6D28D9, neutros
// teñidos, radius 4, space 3, fontSize 18, Georgia) claro y oscuro, el propio del estilo (borde 2px, space 5) claro y oscuro
// y los once generados de design/lab/tema-oscuro/dark-color-presence/generated/ claro y oscuro: 28 de contraste por motor.
// Ejecutar desde la raíz del repo (requiere `npm run build`): GRANA_PW_PORT=4209 node design/lab/time-field/auditoria-verificar.mjs
// Opcional: GRANA_DIST=<copia de dist/>  --engines=chromium,firefox,webkit  --verbose
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
const ORIGIN = `http://127.0.0.1:${server.address().port}`
const BASE = `${ORIGIN}/design/lab/time-field/auditoria-banco.html`
const PLAY = `${ORIGIN}/packages/vue/playground/index.html`

const GEN = ['amazon', 'apple', 'caracol-purpura', 'github', 'grana', 'linear', 'lustre', 'medium', 'notion', 'spotify', 'stripe']
let total = 0, failed = 0
const fails = []
const notes = []
const per = {}
const ok = (cond, msg) => { total++; const e = msg.split(' ')[0]; per[e] = per[e] || [0, 0]; per[e][0]++; if (!cond) { failed++; per[e][1]++; fails.push(msg) } }
const near = (a, b, t = 0.5) => Math.abs(a - b) <= t
const bwOf = (qs) => (/propio/.test(qs) ? 2 : 1)

/* ---------- 0 · CSS fuente y CSS publicado ---------- */
{
  const raw = await readFile(join(ROOT, 'packages/vue/src/components/GTimeField/GTimeField.css'), 'utf8')
  const css = raw.replace(/\/\*[\s\S]*?\*\//g, '')
  const s = (c, m) => ok(c, 'estatico ' + m)
  s(!/#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|lab|lch)\(/.test(css), 'CSS: color literal')
  s(!/var\(\s*--[\w-]+\s*,/.test(css), 'CSS: var() con valor de respaldo')
  s(!/@layer/.test(css) && !/@property/.test(css) && !/!important/.test(css), 'CSS: @layer, @property o !important')
  s(!/:invalid|:user-invalid/.test(css), 'CSS: estiliza :invalid o :user-invalid (#409)')
  const vars = [...css.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1])
  s(vars.every((v) => v.startsWith('--g-') || v.startsWith('--_')), 'CSS: var() que no es --g-* ni --_*')
  const defaults = await readFile(join(ROOT, 'packages/vue/src/styles/defaults.css'), 'utf8')
  const defined = new Set([...defaults.matchAll(/(--g-[a-z0-9-]+)\s*:/g)].map((m) => m[1]))
  s(!vars.filter((v) => v.startsWith('--g-') && !defined.has(v)).length, 'CSS: tokens que no existen en defaults.css')
  const own = new Set([...css.matchAll(/(--_[\w-]+)\s*:/g)].map((m) => m[1]))
  const fromInput = ['--_h', '--_fs', '--_lh', '--_radius', '--_focus', '--_gap', '--_density']
  const fromVue = ['--_min-inline'] // la escribe GTimeField.vue en la raíz (#416); la regla [data-fit] solo existe con ella
  s(!vars.filter((v) => v.startsWith('--_') && !own.has(v) && !fromInput.includes(v) && !fromVue.includes(v)).length && [...own].every((v) => v.startsWith('--_tf-')), 'CSS: alias --_* ajenos')
  const px = [...css.matchAll(/(-?\d*\.?\d+)px/g)].map((m) => m[0])
  s(px.every((p) => ['24px', '44px', '1px', '-1px'].includes(p)), 'CSS: medidas literales no permitidas ' + px)
  const kf = [...css.matchAll(/@keyframes\s+([\w-]+)/g)].map((m) => m[1])
  s(kf.length === 2 && kf.every((k) => /^g-time-reading-/.test(k)), 'CSS: keyframes ' + kf)
  s(!/g-reject/.test(css) && !/is-rejected/.test(css) && !/ease-spring|ease-bounce/.test(css), 'CSS: g-reject, is-rejected, muelle o rebote')
  s(!/>\s*\*|>\s*:(?!where\(\.g-tooltip)/.test(css.replace(/\{[^}]*\}/g, '{}')), 'CSS: selector de hijos por estructura (#383)')
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
  s(anim.length >= 2 && anim.every((c) => /prefers-reduced-motion: no-preference/.test(c)), 'CSS: animación fuera de no-preference')
  s(hov.every((c) => /hover: hover/.test(c)), 'CSS: :hover fuera de (hover: hover)')
  // Publicado: reglas de g-time-field dentro de @layer grana.components y después de GInput; colores de sistema solo en forced-colors
  const dist = await readFile(join(DIST || join(ROOT, 'packages/vue/dist'), 'grana.css'), 'utf8')
  const iInput = dist.indexOf('.g-input__control{') >= 0 ? dist.indexOf('.g-input__control{') : dist.indexOf('.g-input__control {')
  const iTime = dist.indexOf('.g-time-field__value')
  s(iTime > 0 && iInput > 0 && iTime > iInput, `dist/grana.css: g-time-field no está o va antes de GInput (${iInput}/${iTime})`)
  const before = dist.slice(0, iTime)
  const layerOpen = before.lastIndexOf('@layer grana.components')
  s(layerOpen > 0 && layerOpen > before.lastIndexOf('@layer grana.defaults'), 'dist/grana.css: g-time-field fuera de @layer grana.components')
  const tfRules = [...dist.matchAll(/[^{}]*g-time-field[^{}]*\{[^{}]*\}/g)].map((m) => m[0])
  s(tfRules.length > 20, 'dist/grana.css: reglas de g-time-field ' + tfRules.length)
  const bodies = tfRules.map((r) => r.slice(r.indexOf('{')))
  s(bodies.every((b) => !/#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch)\(/.test(b) && !/var\(\s*--[\w-]+\s*,/.test(b)), 'dist/grana.css: color literal o respaldo en g-time-field')
  s(/@keyframes g-time-reading-rise/.test(dist) && /@keyframes g-time-reading-fade/.test(dist), 'dist/grana.css: keyframes g-time-reading-*')
  const js = await readFile(join(DIST || join(ROOT, 'packages/vue/dist'), 'grana.js'), 'utf8')
  s(!/g-time-field__value/.test(js) && !/GTimeField/.test(js), 'dist/grana.js: GTimeField viaja en el paquete principal (#415)')
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
  const raf2 = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
  // Hallazgo 1: en la lectura, cada parte se ve entera o no se ve (nunca medio glifo ni «9:3»); la palabra recortada
  // conserva su mínimo legible (2 × el tamaño del texto) y su elipsis
  window.__slivers = () => [...document.querySelectorAll('.g-time-field__reading')].filter((rd) => rd.getClientRects().length).flatMap((rd) => {
    const r = rd.getBoundingClientRect(), lh = parseFloat(getComputedStyle(rd).lineHeight), fs = parseFloat(getComputedStyle(rd).fontSize)
    const id = rd.closest('.g-input').querySelector('.g-time-field__field').id
    const out = []
    for (const k of rd.children) {
      const b = k.getBoundingClientRect()
      if (b.top >= r.top + lh - 0.5) continue // en la segunda línea: fuera del recorte
      if (b.left < r.left - 0.5 || b.right > r.right + 0.5) out.push(`${id} ${k.className} asoma ${b.left.toFixed(1)}–${b.right.toFixed(1)} / ${r.left.toFixed(1)}–${r.right.toFixed(1)}`)
      if (k.classList.contains('g-time-field__reading-word') && k.scrollWidth > k.clientWidth + 1 && b.width < 2 * fs - 0.5) out.push(`${id} palabra recortada por debajo de su mínimo (${b.width.toFixed(1)} < ${2 * fs})`)
    }
    return out
  })
  return { parse, over, bgOf, ratio, tok, px, root, raf2 }
}

const contrast = () => {
  const { parse, over, bgOf, ratio, tok } = window.__lib
  const out = []
  const add = (k, fg, bg, min) => out.push({ k, r: ratio(over(fg, bg), bg), min })
  for (const root of document.querySelectorAll('.g-time-field')) {
    if (root.classList.contains('is-disabled') || !root.getClientRects().length) continue
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
  add('foco: anillo / superficie', tok('--g-color-focus'), surface, 3)
  return out
}

// Marcado real frente al que espera el CSS (estilo.md «Lo que el CSS espera del .vue» y contrato «Clases y datos»)
const markup = () => {
  const bad = []
  let n = 0
  for (const root of document.querySelectorAll('.g-time-field')) {
    n++
    const f = root.querySelector('.g-time-field__field'), id = f.id, ctl = root.querySelector('.g-input__control')
    const cell = root.querySelector('.g-time-field__value'), rd = root.querySelector('.g-time-field__reading')
    const e = (c, m) => { if (!c) bad.push(`${id}: ${m}`) }
    e(root.classList.contains('g-input'), 'raíz sin g-input')
    e(cell && cell.parentElement === ctl, '__value no es hijo directo de g-input__control')
    e(cell.firstElementChild?.classList.contains('g-time-field__mirror') && cell.children[1] === f && cell.children.length === 2, '__value ≠ espejo + campo')
    e(f.classList.contains('g-input__field') && f.type === 'text' && f.getAttribute('role') === 'spinbutton' && !f.name, 'campo sin g-input__field/type text/spinbutton o con name')
    e(f.getAttribute('dir') === cell.firstElementChild.getAttribute('dir') && ['ltr', 'rtl'].includes(f.getAttribute('dir')), 'dir del campo ≠ espejo')
    e(!f.hasAttribute('aria-expanded') && !f.hasAttribute('aria-haspopup'), 'aria-expanded/haspopup')
    if (rd) {
      e(rd.parentElement === ctl && rd.previousElementSibling === cell && rd.getAttribute('aria-hidden') === 'true', '__reading no va detrás de __value o sin aria-hidden')
      const kids = [...rd.childNodes].filter((x) => x.nodeType === 1 || x.textContent.trim())
      e(kids.every((x) => x.nodeType === 1 && /g-time-field__reading-(time|word)/.test(x.className)), '__reading con texto entre sus partes')
      e(rd.querySelector('.g-time-field__reading-word')?.textContent.trim(), '__reading sin palabra')
    }
    const h12 = root.classList.contains('g-time-field--h12'), ro = root.classList.contains('is-readonly')
    const halves = root.querySelector('.g-time-field__halves'), ch = root.querySelector('.g-time-field__choices')
    e(!(halves && ch), 'mitades y lecturas a la vez')
    e(Boolean(halves) === (h12 && !ro), `a. m./p. m. ${halves ? 'presentes' : 'ausentes'} con h12=${h12} readonly=${ro}`)
    for (const b of root.querySelectorAll('.g-time-field__halves > button, .g-time-field__choices > button')) {
      e(b.type === 'button' && b.tabIndex === -1 && /^(true|false)$/.test(b.getAttribute('aria-pressed')) && b.getAttribute('aria-controls') === id && !b.hasAttribute('aria-hidden'), 'botón sin type/tabindex/aria-pressed/aria-controls')
      e(b.classList.contains('is-on') === (b.getAttribute('aria-pressed') === 'true'), 'is-on ≠ aria-pressed')
      e(!b.getAttribute('style'), 'estilo en línea en un botón')
    }
    if (halves) e(halves.parentElement === ctl && [...halves.children].every((b) => b.classList.contains('g-time-field__half')) && halves.children.length === 2, '__halves mal formado')
    e(!cell.getAttribute('style') && !f.getAttribute('style'), 'estilo en línea en la celda o el campo')
    const m = root.querySelector('.g-time-field__measure')
    const inRow = root.parentElement?.classList.contains('g-form-row')
    // #416: fuera de una fila y sin block también se mide (el mínimo es el suelo de la raíz, con data-fit y --_min-inline)
    const wantsMeasure = Boolean(inRow) || !root.classList.contains('g-input--block')
    e(Boolean(m) === wantsMeasure, `__measure ${m ? 'presente' : 'ausente'} con ${inRow ? 'fila' : root.classList.contains('g-input--block') ? 'block' : 'ancho por defecto'}`)
    e(root.hasAttribute('data-fit') === Boolean(m && !inRow) && Boolean(root.style.getPropertyValue('--_min-inline')) === root.hasAttribute('data-fit'), `data-fit o --_min-inline mal puestos (${root.hasAttribute('data-fit')}, ${m ? 'con' : 'sin'} medidor, ${inRow ? 'fila' : 'fuera'})`)
    if (m) {
      e(m.parentElement === ctl && m.getAttribute('aria-hidden') === 'true', '__measure no es hijo de la caja o sin aria-hidden')
      e(m.firstElementChild && !m.firstElementChild.className && /\n/.test(m.firstElementChild.textContent), '__measure: el texto de referencia no es el primer hijo')
      e(m.querySelectorAll('.g-time-field__half').length === (h12 ? 2 : 0), '__measure: copias de a. m./p. m.')
    }
    const hid = root.querySelector('input[type=hidden]')
    if (hid) e(hid.parentElement === ctl && getComputedStyle(hid).display === 'none', 'oculto canónico fuera de la caja o visible')
    e(!root.querySelector('.is-entering'), 'is-entering en reposo')
    e(f.getAttribute('aria-valuetext') == null || f.hasAttribute('aria-valuenow') || f.value, 'aria-valuetext sin valor ni texto')
  }
  return { n, bad }
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
      cursor: [getComputedStyle(ctl).cursor, cs[0].cursor, getComputedStyle(b[0].parentElement).cursor, rt.querySelector('.g-time-field__reading') ? getComputedStyle(rt.querySelector('.g-time-field__reading')).cursor : null]
    }
  }
  const ro = root('s-readonly')
  g.readonly = { halves: ro.querySelectorAll('.g-time-field__halves').length, reading: !!ro.querySelector('.g-time-field__reading-word'), pad: parseFloat(getComputedStyle(ro.querySelector('.g-input__control')).paddingRight) }
  for (const c of ['s-zone', 's-output']) {
    const rt = root(c), rd = R(rt.querySelector('.g-time-field__reading')), nx = R(rt.querySelector(c === 's-zone' ? '.g-input__suffix' : '.g-input__output'))
    const wd = rt.querySelector('.g-time-field__reading-word'), ctl = R(rt.querySelector('.g-input__control'))
    // Recortada solo si no hay sitio: entonces con elipsis y lo de después dentro de la caja
    g.states[c] = { after: +(nx.left - rd.right).toFixed(2), clip: wd.scrollWidth > wd.clientWidth + 1 && !(getComputedStyle(wd).textOverflow === 'ellipsis' && nx.right <= ctl.right + 0.5) }
  }
  // La hora escrita cabe entera en su campo (fuera de las cajas estrechas a propósito); la lectura nunca pisa a. m./p. m.
  g.scrolls = [...document.querySelectorAll('.g-time-field__field')].filter((f) => !f.closest('.w320, [data-row], .sweep') && f.getClientRects().length && f.scrollWidth > f.clientWidth + 1).map((f) => f.id + ' ' + f.scrollWidth + '/' + f.clientWidth)
  g.overlap = [...document.querySelectorAll('.g-time-field')].filter((rt) => rt.getClientRects().length).flatMap((rt) => {
    const rd = rt.querySelector('.g-time-field__reading'), hv = rt.querySelector('.g-time-field__halves, .g-time-field__choices'), ctl = R(rt.querySelector('.g-input__control'))
    const out = []
    const rtl = getComputedStyle(rt).direction === 'rtl'
    if (rd && hv && (rtl ? R(rd).left < R(hv).right - 0.5 : R(rd).right > R(hv).left + 0.5)) out.push(rt.querySelector('.g-time-field__field').id + ' lectura sobre botones')
    if (hv && (R(hv).left < ctl.left - 0.5 || R(hv).right > ctl.right + 0.5)) out.push(rt.querySelector('.g-time-field__field').id + ' botones fuera de la caja')
    return out
  })
  g.slivers = window.__slivers()
  g.tab = ['field', 'mirror', 'measure'].map((k) => getComputedStyle(root('mn-12').querySelector('.g-time-field__' + k)).fontVariantNumeric)
  const mq = root('mn-12').querySelector('.g-time-field__measure')
  g.measure = { pos: getComputedStyle(mq).position, vis: getComputedStyle(mq).visibility, font: getComputedStyle(mq).fontSize === getComputedStyle(root('mn-12').querySelector('.g-time-field__field')).fontSize,
    weight: [...mq.querySelectorAll('.g-time-field__half')].map((s) => +getComputedStyle(s).fontWeight), inside: R(mq).right <= R(root('mn-12')).right + 0.5 }
  for (const row of document.querySelectorAll('.g-form-row[data-row]')) {
    const box = (k) => k.querySelector('.g-input__control, .g-select__trigger, .g-select__control, .g-datepicker__field') || k
    const kids = [...row.children].map((k) => ({ c: (k.querySelector('input[id], button[id]') || k).id, rootTop: R(k).top, top: +R(box(k)).top.toFixed(2), h: +R(box(k)).height.toFixed(2) }))
    const lines = []
    for (const k of kids) { const l = lines.find((x) => Math.abs(x[0].rootTop - k.rootTop) < 2); if (l) l.push(k); else lines.push([k]) }
    g.rows.push({ row: row.dataset.row, lines: lines.map((l) => l.map(({ c, top, h }) => ({ c, top, h }))) })
  }
  for (const c of ['rtl-ar12', 'rtl-ar24']) {
    const rt = root(c), cell = R(rt.querySelector('.g-time-field__value')), word = rt.querySelector('.g-time-field__reading-word'), ctl = R(rt.querySelector('.g-input__control'))
    const h = rt.querySelector('.g-time-field__halves')
    const wt = textRect(word)
    const f = rt.querySelector('.g-time-field__field')
    g.rtl[c] = { gap: +(cell.left - wt.right).toFixed(2), halvesLeft: h ? R(h).right <= wt.left + 0.5 && Math.abs(R(h).left - ctl.left) <= 0.5 : null, dir: f.getAttribute('dir'), text: f.value, word: word.textContent }
  }
  const n = root('n320-12'), nc = n.querySelector('.g-input__control')
  g.n320 = { ctlOverflow: nc.scrollWidth - nc.clientWidth, rootOut: R(n).right - R(n.parentElement).right, halvesIn: R(n.querySelector('.g-time-field__halves')).right <= R(nc).right + 0.5, text: n.querySelector('.g-time-field__field').value }
  return g
}

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


// Fuera de una fila y sin block (#416): el mínimo medido es el suelo de la raíz, acotado al contenedor. La hora más ancha en
// cada campo; el mínimo esperado por posiciones se calcula aquí aparte, sin leer --_min-inline
const FIT = async () => {
  const { raf2 } = window.__lib
  const out = {}
  for (const id of ['fit-12', 'fit-24s']) {
    const field = document.getElementById(id), tf = field.closest('.g-time-field'), cell = tf.querySelector('.g-time-field__value')
    const lines = tf.querySelector('.g-time-field__measure').firstElementChild.textContent.split('\n')
    const seconds = /:\d\d:\d\d/.test(lines[0])
    let need = 0, idx = 0
    lines.forEach((l, i) => { const sp = document.createElement('span'); sp.className = 'g-time-field__mirror'; sp.textContent = l; sp.style.cssText = 'grid-area:1/1;justify-self:start'; cell.append(sp); const w = sp.getBoundingClientRect().width; sp.remove(); if (w > need) { need = w; idx = i } })
    window.__v[id] = String(idx).padStart(2, '0') + ':59' + (seconds ? ':59' : '')
    await raf2(); await raf2(); await raf2()
    const ctl = tf.querySelector('.g-input__control'), cs = getComputedStyle(ctl)
    const copies = [...tf.querySelectorAll('.g-time-field__measure .g-time-field__half')].reduce((a, k) => a + k.getBoundingClientRect().width, 0)
    const expected = Math.ceil(cell.getBoundingClientRect().left - ctl.getBoundingClientRect().left + need + (copies ? parseFloat(cs.columnGap) + copies : parseFloat(cs.paddingRight) + parseFloat(cs.borderRightWidth)))
    const host = document.getElementById('fit-host'), hs = getComputedStyle(host)
    const cont = host.getBoundingClientRect().width - parseFloat(hs.paddingLeft) - parseFloat(hs.paddingRight) - 2 * parseFloat(hs.borderLeftWidth)
    out[id] = { root: +tf.getBoundingClientRect().width.toFixed(2), expected, cont: +cont.toFixed(2), fit: tf.hasAttribute('data-fit'), varr: tf.style.getPropertyValue('--_min-inline'), clips: field.scrollWidth - field.clientWidth, value: field.value }
  }
  const gin = document.getElementById('fit-in').closest('.g-input')
  out.ref = { root: +gin.getBoundingClientRect().width.toFixed(2) }
  out.overflow = document.documentElement.scrollWidth - innerWidth
  return out
}

// Barrido del mínimo publicado (#410) en la GFormRow real: la hora más ancha en el campo, el contenedor de 1px en 1px
const SWEEP = async ([rowId, hi, lo]) => {
  const { raf2 } = window.__lib
  const host = document.getElementById('mn-host'), row = document.getElementById(rowId)
  const [tf, other] = [...row.children].filter((k) => !k.classList.contains('g-tooltip'))
  const field = tf.querySelector('.g-time-field__field'), cell = tf.querySelector('.g-time-field__value')
  // La hora más ancha: las líneas del medidor (mismas 24 horas a los :59) medidas con la clase del espejo
  const lines = tf.querySelector('.g-time-field__measure').firstElementChild.textContent.split('\n')
  let need = 0, idx = 0
  lines.forEach((l, i) => { const s = document.createElement('span'); s.className = 'g-time-field__mirror'; s.textContent = l; s.style.cssText = 'grid-area:1/1;justify-self:start'; cell.append(s); const w = s.getBoundingClientRect().width; s.remove(); if (w > need) { need = w; idx = i } })
  window.__v[field.id] = String(idx).padStart(2, '0') + ':59'
  await raf2(); await raf2()
  const one = () => Math.abs(tf.getBoundingClientRect().top - other.getBoundingClientRect().top) < 2
  const at = async (w) => { host.style.inlineSize = w + 'px'; await raf2(); await raf2(); await raf2() }
  let last = null
  const slivers = []
  for (let w = hi; w >= lo; w--) {
    await at(w)
    if (!one()) break
    const rd = tf.querySelector('.g-time-field__reading')
    const sl = window.__slivers()
    if (sl.length) slivers.push(w + ': ' + sl[0])
    // Mínimo esperado por posiciones, calculado aquí aparte (no con el código del .vue): antes de la celda + la hora más ancha
    // con el hueco del cursor + en 12 h el gap y las copias de a. m./p. m. (con su borde final), en 24 h relleno y borde finales
    const ctl = tf.querySelector('.g-input__control'), cs = getComputedStyle(ctl)
    const copies = [...tf.querySelectorAll('.g-time-field__measure .g-time-field__half')].reduce((a, k) => a + k.getBoundingClientRect().width, 0)
    const expected = Math.ceil(cell.getBoundingClientRect().left - ctl.getBoundingClientRect().left + need + (copies ? parseFloat(cs.columnGap) + copies : parseFloat(cs.paddingRight) + parseFloat(cs.borderRightWidth)))
    last = { w, expected, tf: +tf.getBoundingClientRect().width.toFixed(2), other: +other.getBoundingClientRect().width.toFixed(2), cell: +cell.getBoundingClientRect().width.toFixed(2), need: +need.toFixed(2),
      fits: cell.getBoundingClientRect().width >= need - 1 - 0.01, cursor: +(need - cell.getBoundingClientRect().width).toFixed(2), read: rd ? +rd.getBoundingClientRect().width.toFixed(2) : 0, text: field.value }
  }
  const res = { last, widest: lines[idx], slivers }
  // Bloquear/desbloquear en el último ancho de una línea: misma distribución y misma caja
  if (last) {
    await at(last.w)
    const snap = () => ({ one: one(), w: +tf.getBoundingClientRect().width.toFixed(2), h: +tf.querySelector('.g-input__control').getBoundingClientRect().height.toFixed(2), halves: !!tf.querySelector('.g-time-field__halves') })
    const a = snap(); window.__lock.value = true; await raf2(); await raf2(); await raf2()
    const b = snap(); window.__lock.value = false; await raf2(); await raf2(); await raf2()
    const c = snap()
    res.lock = { a, b, c }
  }
  host.style.inlineSize = ''
  return res
}

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
    await p.evaluate(() => window.__lib.raf2())
  }
  const tag = (s) => `${engine} ${s}`
  const typeIn = async (id, s, p = page) => { await p.focus('#' + id); await p.keyboard.press('ControlOrMeta+a'); await p.keyboard.press('Backspace'); await p.keyboard.type(s); await p.waitForTimeout(60) }
  const blur = (p = page) => p.evaluate(() => document.activeElement && document.activeElement.blur())

  /* 1 · Marcado real y contraste en 28 configuraciones (con las dos lecturas a la vista) */
  const worst = {}
  for (const [name, qs] of [['defecto', ''], ['defecto', 'dark=1'], ['auditoria', 'theme=auditoria'], ['auditoria', 'theme=auditoria&dark=1'], ['propio', 'theme=propio'], ['propio', 'theme=propio&dark=1'], ...GEN.flatMap((t) => [[t, `theme=${t}`], [t, `theme=${t}&dark=1`]])]) {
    await go('?' + qs)
    if (!qs) {
      const mk = await page.evaluate(markup)
      ok(mk.n >= 50 && !mk.bad.length, tag(`marcado (${mk.n} campos): ${mk.bad.slice(0, 6).join(' | ')}`))
      if (engine === 'chromium') notes.push(`marcado real: ${mk.n} GTimeField en el banco, ${mk.bad.length} diferencias con lo que espera el CSS`)
    }
    await typeIn('c-wide', '9')
    const m = await page.evaluate(contrast)
    await blur()
    const t = `${name} ${qs.includes('dark') ? 'oscuro' : 'claro'}`
    for (const c of m) ok(c.r >= c.min, tag(`${t}: ${c.k} ${c.r}:1 < ${c.min}`))
    const w = (re) => Math.min(...m.filter((c) => re.test(c.k)).map((c) => c.r))
    worst[t] = { palabra: w(/lectura palabra/), hora: w(/lectura (hora|palabra)/), reposo: w(/reposo/), pulsado: w(/pulsado (mitad|lectura)|pulsado: on-accent/), pasar: w(/pasar: text/), separador: w(/separador/), foco: w(/foco/) }
    ok(m.some((c) => /c-wide pulsado lectura/.test(c.k)) && m.some((c) => /c-wide reposo lectura/.test(c.k)), tag(`${t}: las dos lecturas no aparecieron al escribir «9»`))
  }
  {
    const all = Object.values(worst)
    const mins = Object.fromEntries(['palabra', 'hora', 'reposo', 'pulsado', 'pasar', 'separador', 'foco'].map((k) => [k, Math.min(...all.map((r) => r[k]))]))
    notes.push(`${engine} contraste mínimo en ${all.length} configuraciones (palabra · hora entendida · reposo · pulsado · pasar · separador · foco): ${Object.values(mins).join(' · ')}`)
    if (engine === 'chromium') for (const [t, r] of Object.entries(worst)) if (args.verbose || /defecto|auditoria|propio/.test(t)) notes.push(`  contraste ${t}: ${Object.values(r).join(' · ')}`)
  }

  /* 2 · Geometría: defecto, oscuro, auditoría (space 3, Georgia 18) y propio (borde 2px, space 5) */
  for (const qs of ['', 'dark=1', 'theme=auditoria', 'theme=propio']) {
    await go('?' + qs)
    const g = await page.evaluate(geometry)
    const t = (s) => tag(`?${qs} ${s}`)
    if (engine === 'chromium') notes.push(`?${qs || 'defecto'} a. m./p. m. (alto × ancho de p.m.): ${Object.entries(g.sizes).map(([k, s]) => k + ' ' + s.btns[1].h + '×' + s.btns[1].w).join(' · ')}; lectura–hora: ${Object.entries(g.sizes).map(([k, s]) => k + ' ' + s.reads[1].gap).join(' · ')}`)
    for (const [sid, s] of Object.entries(g.sizes)) {
      for (const b of s.btns) {
        // Del alto de la caja (= --_h de GInput, o más si el texto del tema no cabe en él: entonces la caja de GInput crece igual)
        ok(near(b.h, s.box) && s.box >= s.expected - 0.01 && b.w >= b.h - 0.01, t(`${sid}: a. m./p. m. ${b.w}×${b.h}: alto ≠ caja ${s.box} (≥ ${s.expected}) o más estrecho que alto`))
        ok(b.w >= 24 - 0.01 && b.h >= 24 - 0.01, t(`${sid}: a. m./p. m. bajo 24px`))
        ok(near(b.top, 0) && near(b.bottom, 0), t(`${sid}: a. m./p. m. no llegan de borde a borde ${JSON.stringify(b)}`))
      }
      ok(near(s.btns[1].right, 0), t(`${sid}: p.m. no llega al borde final (${s.btns[1].right})`))
      ok(near(s.box, s.inputBox) && near(s.box24, s.inputBox), t(`${sid}: caja ${s.box}/${s.box24} ≠ GInput ${s.inputBox}`))
      for (const r of s.reads) {
        ok(near(r.gap, s.gap, 0.5), t(`${sid}: lectura a ${r.gap}px de la celda ≠ gap ${s.gap}`))
        ok(r.ink >= s.gap - 0.01 && r.ink <= s.gap + 1.5, t(`${sid}: tinta lectura–hora ${r.ink} (gap ${s.gap} + 1px)`))
        ok(Math.abs(r.dy) <= 0.5 && r.fs[0] === r.fs[1], t(`${sid}: la lectura fuera de la línea (Δ ${r.dy}px) o de otro tamaño ${r.fs}`))
      }
    }
    for (const [c, s] of Object.entries(g.states)) {
      if (!s.cover) continue
      for (const [a, b] of s.cover) ok(near(a, 0) && near(b, 0), t(`${c}: botones no cubren de borde a borde ${JSON.stringify(s.cover)}`))
      ok(near(s.cover.at(-1)[2], 0), t(`${c}: p.m. no llega al borde final`))
      for (const [col, , clip] of s.blockBorder) ok(/rgba\(0, 0, 0, 0\)|transparent/.test(col) && clip === 'padding-box', t(`${c}: trazo no transparente o fondo sin recortar`))
      const stroke = c === 's-invalid' || c === 's-warning' ? 2 * g.bw : g.bw
      ok(s.blockBorder.every(([, w]) => near(w, stroke, 0.01)) && near(s.endBorder[0], stroke, 0.01), t(`${c}: trazo ${s.blockBorder.map((x) => x[1])}/${s.endBorder[0]} ≠ ${stroke}`))
      ok(s.sep.every(([st, w]) => st === 'solid' && near(w, g.bw, 0.01)), t(`${c}: separador ${JSON.stringify(s.sep)}`))
      ok(s.radius[0] === s.radius[1], t(`${c}: esquina de p.m. ${s.radius[0]} ≠ caja ${s.radius[1]}`))
      ok(s.pad === 0, t(`${c}: la caja conserva relleno final con a. m./p. m.`))
      if (s.on.some(Boolean)) ok(s.weight[s.on.indexOf(true)] > s.weight[s.on.indexOf(false)], t(`${c}: pulsado sin peso ${s.weight}`))
      const dis = c === 's-disabled'
      ok(s.cursor[0] === (dis ? 'not-allowed' : 'text') && s.cursor[1] === (dis ? 'not-allowed' : 'pointer') && s.cursor[2] === 'default' && (s.cursor[3] == null || s.cursor[3] === (dis ? 'not-allowed' : 'text')), t(`${c}: cursores ${s.cursor}`))
    }
    ok(g.states['s-empty'].on.every((x) => !x) && g.states['s-pending'].on[1] && !g.states['s-pending'].on[0], t('vacío sin pulsado / p.m. pendiente pulsada'))
    for (const c of ['s-zone', 's-output']) ok(near(g.states[c].after, g.sizes.md.gap, 0.5) && !g.states[c].clip, t(`${c}: lo de después no sigue a la lectura (${g.states[c].after})`))
    ok(g.readonly.halves === 0 && g.readonly.reading && g.readonly.pad > 0, t(`solo lectura ${JSON.stringify(g.readonly)}`))
    ok(!g.scrolls.length, t(`la hora no cabe en su campo ${g.scrolls}`))
    ok(!g.overlap.length, t(`solapes ${g.overlap}`))
    ok(!g.slivers.length, t(`lectura a medias ${g.slivers}`))
    ok(g.tab.every((v) => /tabular-nums/.test(v)), t(`tabular-nums ${g.tab}`))
    ok(g.measure.pos === 'absolute' && g.measure.vis === 'hidden' && g.measure.font && g.measure.weight.length === 2 && g.measure.weight.every((w) => w >= 500) && g.measure.inside, t(`__measure ${JSON.stringify(g.measure)}`))
    for (const r of g.rows) for (const l of r.lines) if (l.length > 1) ok(l.every((k) => near(k.top, l[0].top, 1)) && l.every((k) => near(k.h, l[0].h, 0.5)), t(`fila ${r.row}: cajas ${JSON.stringify(l)}`))
    for (const [c, r] of Object.entries(g.rtl)) {
      ok(r.dir === 'rtl' && near(r.gap, g.sizes.md.gap, 0.5) && /[٠-٩]/.test(r.text), t(`${c}: RTL ${JSON.stringify(r)}`))
      if (r.halvesLeft !== null) ok(r.halvesLeft, t(`${c}: RTL a. m./p. m. no van al final lógico (izquierda)`))
    }
    if (engine === 'chromium' && !qs) notes.push(`RTL ar-EG: 12 h «${g.rtl['rtl-ar12'].text}» + «${g.rtl['rtl-ar12'].word}»; 24 h «${g.rtl['rtl-ar24'].text}» + «${g.rtl['rtl-ar24'].word}»`)
    ok(g.n320.ctlOverflow <= g.bw + 0.5 && g.n320.rootOut <= 0.5 && g.n320.halvesIn, t(`320: ${JSON.stringify(g.n320)}`))
    ok(g.overflow <= 0, t(`desborde de la página ${g.overflow}`))
  }

  /* 3 · Anchos de ventana 1280 → 320: filas reales (Δ0 junto a GInput, GDatePicker y GSelect), sin desborde */
  for (const qs of ['', 'theme=auditoria&dark=1']) {
    for (const w of [1280, 1024, 720, 480, 360, 320]) {
      await page.setViewportSize({ width: w, height: 900 })
      await go('?' + qs)
      const g = await page.evaluate(geometry)
      for (const r of g.rows) for (const l of r.lines) if (l.length > 1) ok(l.every((k) => near(k.top, l[0].top, 1)) && l.every((k) => near(k.h, l[0].h, 0.5)), tag(`?${qs} ${w}px fila ${r.row}: ${JSON.stringify(l)}`))
      ok(g.overflow <= 0, tag(`?${qs} ${w}px: desborde ${g.overflow}`))
      ok(g.n320.ctlOverflow <= g.bw + 0.5 && g.n320.halvesIn, tag(`?${qs} ${w}px: 12 h con segundos fuera de la caja ${JSON.stringify(g.n320)}`))
      ok(!g.overlap.length, tag(`?${qs} ${w}px: solapes ${g.overlap}`))
    }
  }
  await page.setViewportSize({ width: 1280, height: 900 })

  /* 4 · Mínimo publicado (#410) en una GFormRow real, barrido de 1px; bloquear/desbloquear (#266) */
  for (const qs of ['', 'theme=auditoria', 'theme=propio']) {
    await go('?' + qs)
    for (const [row, h12] of [['mn-row12', true], ['mn-row24', false]]) {
      const r = await page.evaluate(SWEEP, [row, 560, 120])
      const t = (s) => tag(`?${qs} ${row} ${s}`)
      ok(r.last, t('el campo nunca comparte la línea'))
      if (!r.last) continue
      ok(r.last.fits, t(`en el último ancho de una línea la hora más ancha no cabe ${JSON.stringify(r.last)}`))
      // No sobrecuenta: en el último ancho de una línea la lectura casi no tiene sitio (≤ 1px: el peso de pulsado de las copias)
      // cuando el mínimo publicado es el que manda (12 h, y 24 h si supera al de la clase de tamaño)
      const bindsXs = !h12 && r.last.read > 1.5
      if (!bindsXs) ok(r.last.read <= 1.5, t(`el mínimo sobrecuenta: la lectura ocupa ${r.last.read}px en el último ancho de una línea`))
      notes.push(`${engine} ?${qs || 'defecto'} ${h12 ? '12 h es-MX' : '24 h es'}: el campo mide ${r.last.tf}px en el último ancho de una línea (mínimo por posiciones ${r.last.expected}px; «${r.widest}» ${r.last.need}px, lectura ${r.last.read}px${bindsXs ? '; manda el mínimo de la clase de la fila, no el publicado' : ''})`)
      // El publicado es el esperado (ceil); GFormRow admite 0,5px por debajo del mínimo (TOL de formRowPlan)
      if (!bindsXs) ok(r.last.tf >= r.last.expected - 0.51 && r.last.tf <= r.last.expected + 0.01, t(`el campo mide ${r.last.tf} y el mínimo por posiciones es ${r.last.expected}`))
      ok(!r.slivers.length, t(`lectura a medias durante el barrido: ${r.slivers.slice(0, 3)}`))
      if (r.last.cursor > 0) notes.push(`${engine} ?${qs || 'defecto'} ${row}: en el mínimo la celda pierde ${r.last.cursor}px del hueco del cursor (TOL de 0,5px de GFormRow); la hora sigue entera`)
      const { a, b, c } = r.lock
      ok(a.one && b.one && c.one && near(a.w, b.w) && near(a.w, c.w) && near(a.h, b.h) && a.halves === h12 && !b.halves && c.halves === h12, t(`bloquear/desbloquear reparte la fila ${JSON.stringify(r.lock)}`))
    }
  }

  /* 5 · Las dos lecturas en el real */
  await go('')
  {
    await typeIn('c-wide', '9')
    const a = await page.evaluate(() => {
      const root = document.getElementById('c-wide').closest('.g-input'), ch = root.querySelector('.g-time-field__choices'), f = root.querySelector('.g-time-field__field')
      const ctl = root.querySelector('.g-input__control'), cr = ctl.getBoundingClientRect()
      const b = [...ch.querySelectorAll('.g-time-field__choice')]
      const vis = (s) => getComputedStyle(s).position !== 'absolute'
      return { has: root.classList.contains('has-choices'), reading: !!root.querySelector('.g-time-field__reading'), compact: ch.hasAttribute('data-compact'), on: b.map((x) => x.classList.contains('is-on')),
        words: b.map((x) => vis(x.querySelector('.g-time-field__choice-word'))), times: b.map((x) => vis(x.querySelector('.g-time-field__choice-time'))), labels: b.map((x) => x.textContent.trim()),
        edge: b.map((x) => { const r = x.getBoundingClientRect(); return [+(r.top - cr.top).toFixed(2), +(cr.bottom - r.bottom).toFixed(2)] }), end: +(cr.right - b[1].getBoundingClientRect().right).toFixed(2),
        pad: parseFloat(getComputedStyle(ctl).paddingRight), fits: f.scrollWidth <= f.clientWidth + 1, h: b.map((x) => +x.getBoundingClientRect().height.toFixed(2)), ctlH: +cr.height.toFixed(2) }
    })
    ok(a.has && !a.reading && !a.compact && a.on[0] && !a.on[1], tag(`lecturas: estado ${JSON.stringify(a)}`))
    ok(a.words.every(Boolean) && a.times.every((x) => !x), tag(`lecturas sin compactar ${JSON.stringify(a)}`))
    ok(a.edge.every(([x, y]) => near(x, 0) && near(y, 0)) && near(a.end, 0) && a.pad === 0 && a.h.every((x) => near(x, a.ctlH)), tag(`lecturas no van de borde a borde ${JSON.stringify(a)}`))
    ok(a.fits, tag('lecturas: le quitan sitio a la hora escrita'))
    if (engine === 'chromium') notes.push(`las dos lecturas con «9»: ${a.labels.join(' · ')}`)
    for (const id of ['c-narrow', 'c-xs']) {
      await typeIn(id, '9')
      await page.waitForTimeout(120)
      const n = await page.evaluate((i) => {
        const root = document.getElementById(i).closest('.g-input'), ch = root.querySelector('.g-time-field__choices'), ctl = root.querySelector('.g-input__control'), f = root.querySelector('.g-time-field__field')
        const vis = (s) => getComputedStyle(s).position !== 'absolute'
        const bs = [...ch.querySelectorAll('.g-time-field__choice')]
        return { compact: ch.hasAttribute('data-compact'), times: bs.map((b) => vis(b.querySelector('.g-time-field__choice-time'))), words: bs.map((b) => vis(b.querySelector('.g-time-field__choice-word'))), over: ctl.scrollWidth - ctl.clientWidth, fits: f.scrollWidth <= f.clientWidth + 1,
          w: bs.map((b) => +b.getBoundingClientRect().width.toFixed(2)), h: bs.map((b) => +b.getBoundingClientRect().height.toFixed(2)), endBorder: bs.map((b) => parseFloat(getComputedStyle(b).borderRightWidth)), names: bs.map((b) => b.getAttribute('aria-labelledby')) }
      }, id)
      // Compacta solo si el par no cabe: con la fuente servida, en xs a 180px sí cabe y se queda con la franja
      if (n.compact) ok(n.times.every(Boolean) && n.words.every((x) => !x), tag(`${id}: compacto sin la hora visible ${JSON.stringify(n)}`))
      else ok(n.words.every(Boolean) && n.over <= 1 && n.fits, tag(`${id}: sin data-compact y el par no cabe ${JSON.stringify(n)}`))
      if (id === 'c-narrow') ok(n.compact, tag(`c-narrow (md, 180px): el par no se compacta ${JSON.stringify(n)}`))
      ok(n.over <= 1 && n.w.every((x) => x >= 24 - 0.01) && n.h.every((x) => x >= 24 - 0.01), tag(`${id}: el par compacto desborda o baja de 24px ${JSON.stringify(n)}`))
      ok(near(n.endBorder[1], 1, 0.01) && n.endBorder[0] === 0 && n.h.every((x) => x >= 24 - 0.01), tag(`${id}: data-compact sin el borde final de 1px en el último ${n.endBorder}`))
      if (engine === 'chromium') notes.push(`${id} ${n.compact ? 'compacto' : 'sin compactar (cabe)'}: ${n.w.join(' + ')}px, hora escrita entera: ${n.fits}`)
    }
    // Un toque en la segunda lectura: 21:00, el foco sigue en el campo, el par se va
    await typeIn('c-wide', '9')
    await page.locator('#c-wide').locator('xpath=ancestor::div[contains(@class,"g-input ")][1]').locator('.g-time-field__choice').nth(1).click()
    await page.waitForTimeout(80)
    const after = await page.evaluate(() => ({ focus: document.activeElement && document.activeElement.id, text: document.getElementById('c-wide').value, model: window.__v['c-wide'], choices: !!document.getElementById('c-wide').closest('.g-input').querySelector('.g-time-field__choices') }))
    ok(after.focus === 'c-wide' && after.text === '21:00' && after.model === '21:00' && !after.choices, tag(`toque en una lectura ${JSON.stringify(after)}`))
    await blur()
  }

  /* 6 · Pasar, pulsar (contraste justo del pulsado), foco del conjunto */
  {
    await go('')
    const b = page.locator('#s-rest').locator('xpath=ancestor::div[contains(@class,"g-input ")][1]').locator('.g-time-field__half').nth(1)
    await b.hover(); await page.waitForTimeout(250)
    const hv = await page.evaluate(() => { const b = document.getElementById('s-rest').closest('.g-input').querySelectorAll('.g-time-field__half')[1]; const { tok } = window.__lib; const cs = getComputedStyle(b); const ns = tok('--g-color-neutral-soft'), tx = tok('--g-color-text'); return { bg: cs.backgroundColor, color: cs.color, ns: `rgb(${ns.slice(0, 3).join(', ')})`, tx: `rgb(${tx.slice(0, 3).join(', ')})` } })
    ok(hv.bg === hv.ns && hv.color === hv.tx, tag(`pasar sobre p.m.: ${JSON.stringify(hv)}`))
    await page.mouse.down(); await page.waitForTimeout(120); await page.mouse.up(); await page.waitForTimeout(250)
    const pr = await page.evaluate(() => { const r = document.getElementById('s-rest').closest('.g-input'); const b = r.querySelectorAll('.g-time-field__half')[1]; const { tok } = window.__lib; const as = tok('--g-color-accent-soft'); return { on: b.classList.contains('is-on'), pressed: b.getAttribute('aria-pressed'), bg: getComputedStyle(b).backgroundColor, as: `rgb(${as.slice(0, 3).join(', ')})`, focus: document.activeElement === document.body, val: document.getElementById('s-rest').value, model: window.__v['s-rest'] } })
    ok(pr.on && pr.pressed === 'true' && pr.bg === pr.as && pr.focus && /p\.\s?m\./.test(pr.val) && pr.model === '21:30', tag(`pulsar p.m. sin foco previo: ${JSON.stringify(pr)}`))
    await page.mouse.move(0, 0)
    // Con el foco en el campo, pulsar a.m. no lo mueve
    await page.focus('#s-rest')
    await page.locator('#s-rest').locator('xpath=ancestor::div[contains(@class,"g-input ")][1]').locator('.g-time-field__half').nth(0).click()
    const kept = await page.evaluate(() => ({ id: document.activeElement.id, model: window.__v['s-rest'] }))
    ok(kept.id === 's-rest' && kept.model === '09:30', tag(`pulsar a.m. con foco: ${JSON.stringify(kept)}`))
    await blur()
    // Anillo de GInput en el conjunto al llegar con Tab (foco por teclado)
    await page.focus('#s-24'); await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Tab'); await page.waitForTimeout(250)
    const ring = await page.evaluate(() => { const f = document.activeElement; const row = f.closest('.g-input__row'); const cs = getComputedStyle(row); const { tok, parse } = window.__lib; const fo = tok('--g-color-focus'); return { id: f.id, fv: f.matches(':focus-visible'), st: cs.outlineStyle, w: parseFloat(cs.outlineWidth), col: parse(cs.outlineColor).slice(0, 3).map(Math.round).join(), fo: fo.slice(0, 3).map(Math.round).join() } })
    ok(ring.id === 's-24' && ring.fv && ring.st === 'solid' && ring.w >= 2 && ring.col === ring.fo, tag(`anillo de foco del conjunto ${JSON.stringify(ring)}`))
    await blur()
    const f = await page.evaluate(() => { const b = document.getElementById('s-rest').closest('.g-input').querySelectorAll('.g-time-field__half')[0]; b.focus(); const cs = getComputedStyle(b); const out = { fv: b.matches(':focus-visible'), st: cs.outlineStyle, w: parseFloat(cs.outlineWidth), off: parseFloat(cs.outlineOffset) }; b.blur(); return out })
    if (f.fv) ok(f.st === 'solid' && f.w >= 1.5 && f.off + f.w <= 0.01, tag(`foco programático de a.m. (anillo interior) ${JSON.stringify(f)}`))
    const rd = page.locator('#s-24').locator('xpath=ancestor::div[contains(@class,"g-input ")][1]').locator('.g-time-field__reading-word')
    await rd.click()
    const fo = await page.evaluate(() => ({ id: document.activeElement.id, end: document.activeElement.selectionStart === document.activeElement.value.length }))
    ok(fo.id === 's-24' && fo.end, tag(`pulsar la lectura no enfoca al final ${JSON.stringify(fo)}`))
    await blur()
  }

  /* 7 · Teclado: ↑/↓ con paso, Mayús y Re Pág/Av Pág (una hora), límites, arco 22:00–06:00, a/p, botones fuera del Tab */
  {
    await go('')
    const key = async (id, k) => { await page.focus('#' + id); await page.keyboard.press(k); await page.waitForTimeout(30); return page.evaluate((i) => [window.__v[i], document.getElementById(i).value], id) }
    const seq = []
    for (const k of ['ArrowUp', 'ArrowDown', 'Shift+ArrowUp', 'PageUp', 'PageDown', 'Shift+ArrowDown']) seq.push((await key('k-24', k))[0])
    ok(JSON.stringify(seq) === JSON.stringify(['09:15', '09:00', '10:00', '11:00', '10:00', '09:00']), tag(`↑/↓, Mayús, Re Pág/Av Pág: ${seq}`))
    await page.evaluate(() => { window.__v['k-24'] = '17:45' }); await page.waitForTimeout(30)
    const top = [(await key('k-24', 'ArrowUp'))[0], (await key('k-24', 'ArrowUp'))[0]]
    ok(top[0] === '18:00' && top[1] === '18:00', tag(`tope en max: ${top}`))
    const arc = [(await key('k-arc', 'ArrowUp'))[0]]
    await page.evaluate(() => { window.__v['k-arc'] = '23:30' }); await page.waitForTimeout(30)
    arc.push((await key('k-arc', 'ArrowUp'))[0], (await key('k-arc', 'ArrowUp'))[0])
    await page.evaluate(() => { window.__v['k-arc'] = '05:30' }); await page.waitForTimeout(30)
    arc.push((await key('k-arc', 'ArrowUp'))[0], (await key('k-arc', 'ArrowUp'))[0])
    ok(JSON.stringify(arc) === JSON.stringify(['22:00', '00:00', '00:30', '06:00', '06:00']), tag(`arco 22:00–06:00: ${arc}`))
    const ap = [(await key('k-12', 'p')), (await key('k-12', 'p')), (await key('k-12', 'a'))].map((x) => x.join(' '))
    ok(/^21:30 9:30 p\.\s?m\.$/.test(ap[0]) && ap[1] === ap[0] && /^09:30 9:30 a\.\s?m\.$/.test(ap[2]), tag(`a/p: ${ap}`))
    // Tab: del campo de 12 h al siguiente campo, nunca a a. m./p. m.; Mayús+Tab vuelve
    await page.focus('#k-12'); await page.keyboard.press('Tab')
    const nx = await page.evaluate(() => ({ id: document.activeElement.id, tag: document.activeElement.tagName, cls: document.activeElement.className }))
    ok(nx.tag !== 'BUTTON' || !/g-time-field__/.test(nx.cls), tag(`Tab entra en a. m./p. m. ${JSON.stringify(nx)}`))
    await page.focus('#c-wide'); await page.keyboard.type('9'); await page.keyboard.press('Tab')
    const nx2 = await page.evaluate(() => ({ id: document.activeElement.id, cls: document.activeElement.className, model: window.__v['c-wide'] }))
    ok(!/g-time-field__choice/.test(nx2.cls) && nx2.model === '09:00', tag(`Tab entra en las lecturas o no confirma ${JSON.stringify(nx2)}`))
    // Movimiento en el teclado: cada paso no anima la palabra salvo al cambiar la franja
    await blur()
  }

  /* 8 · Error propio (#409): al salir, bloquea el envío de GForm (I2, foco, GErrorSummary); fuera de GForm, setCustomValidity */
  {
    await go('')
    await typeIn('ef-hora', '99:99')
    const pre = await page.evaluate(() => { const f = document.getElementById('ef-hora'), r = f.closest('.g-input'); return { inv: f.getAttribute('aria-invalid'), msg: r.querySelector('.g-input__message').textContent.trim() } })
    ok(pre.inv !== 'true' && !pre.msg, tag(`error propio visible antes de salir ${JSON.stringify(pre)}`))
    await page.keyboard.press('Tab'); await page.waitForTimeout(120)
    const post = await page.evaluate(() => { const f = document.getElementById('ef-hora'), r = f.closest('.g-input'); return { inv: f.getAttribute('aria-invalid'), msg: r.querySelector('.g-input__message').textContent.trim(), text: f.value, cls: r.classList.contains('is-invalid'), vt: f.getAttribute('aria-valuetext'), now: f.hasAttribute('aria-valuenow'), cv: f.validationMessage, model: window.__v['ef-hora'] } })
    ok(post.inv === 'true' && /Escribe una hora/.test(post.msg) && post.text === '99:99' && post.cls && post.vt === '99:99' && !post.now && post.model === null && post.cv === '', tag(`error propio al salir ${JSON.stringify(post)}`))
    // Los botones tapan el doble trazo del error
    const cover = await page.evaluate(() => { const r = document.getElementById('ef-hora').closest('.g-input'), c = r.querySelector('.g-input__control').getBoundingClientRect(); return [...r.querySelectorAll('.g-time-field__halves .g-time-field__half')].map((b) => { const x = b.getBoundingClientRect(); return [+(x.top - c.top).toFixed(2), +(c.bottom - x.bottom).toFixed(2), parseFloat(getComputedStyle(b).borderTopWidth)] }) })
    ok(cover.every(([a, b, w]) => near(a, 0) && near(b, 0) && near(w, 2, 0.01)), tag(`error propio: botones y doble trazo ${JSON.stringify(cover)}`))
    // Enviar: invalid, is-rejected (una sola animación en g-input__row con a. m./p. m. dentro), foco al campo
    const anim = page.evaluate(() => new Promise((res) => { const r = document.getElementById('ef-hora').closest('.g-input'); const row = r.querySelector('.g-input__row'), st = r.querySelector('.g-time-field__halves'); const x0 = st.getBoundingClientRect().left, r0 = row.getBoundingClientRect().left; let maxSt = 0, same = true, names = new Set(), rej = false; const t0 = performance.now(); (function f() { if (r.classList.contains('is-rejected')) rej = true; r.getAnimations({ subtree: true }).forEach((a) => a.animationName && names.add(a.animationName + '@' + a.effect.target.className.split(' ')[0])); const ds = st.getBoundingClientRect().left - x0, dr = row.getBoundingClientRect().left - r0; maxSt = Math.max(maxSt, Math.abs(ds)); if (Math.abs(ds - dr) > 0.3) same = false; if (performance.now() - t0 < 700) requestAnimationFrame(f); else res({ names: [...names], maxSt, same, rej, end: r.classList.contains('is-rejected') }) })() }))
    await page.click('#ef-send')
    const a = await anim
    const sub = await page.evaluate(() => ({ log: document.getElementById('ef-log').textContent, focus: document.activeElement.id }))
    // Con un GErrorSummary montado, GForm lleva el foco al resumen (form.md §1 «Envío», 4)
    ok(/^invalid hora/.test(sub.log) && /^g-error-summary/.test(sub.focus), tag(`el envío no se bloquea o no enfoca el resumen ${JSON.stringify(sub)}`))
    ok(a.rej && a.names.length === 1 && /^g-reject-shake@g-input__row/.test(a.names[0]) && a.maxSt > 1 && a.same && !a.end, tag(`I2 por GForm ${JSON.stringify(a)}`))
    // GErrorSummary enlaza al campo
    const link = page.locator('.g-error-summary a').first()
    if (await link.count()) {
      await blur(); await link.click(); await page.waitForTimeout(250)
      const fs = await page.evaluate(() => { const f = document.activeElement; const r = f.getBoundingClientRect(); return { id: f.id, vis: r.top >= 0 && r.bottom <= innerHeight } })
      ok(fs.id === 'ef-hora' && fs.vis, tag(`GErrorSummary no lleva al campo ${JSON.stringify(fs)}`))
    } else ok(false, tag('GErrorSummary sin enlace'))
    // Corregir: el error sale al entender la hora; el envío pasa con el canónico
    await typeIn('ef-hora', '930p'); await page.keyboard.press('Tab'); await page.waitForTimeout(80)
    await page.click('#ef-send'); await page.waitForTimeout(80)
    const okSub = await page.evaluate(() => ({ log: document.getElementById('ef-log').textContent, inv: document.getElementById('ef-hora').getAttribute('aria-invalid'), text: document.getElementById('ef-hora').value }))
    ok(/^submit .*hora=21:30/.test(okSub.log) && okSub.inv !== 'true' && /9:30 p\.\s?m\./.test(okSub.text), tag(`tras corregir ${JSON.stringify(okSub)}`))
    // Fuera de GForm: setCustomValidity mientras haya error propio; se revela al salir; el envío nativo no sale
    await typeIn('nat-hora', '99:99')
    const nat = await page.evaluate(() => { const f = document.getElementById('nat-hora'); return { custom: f.validity.customError, msg: f.validationMessage, form: document.getElementById('nat-form').checkValidity() } })
    ok(nat.custom && /Escribe una hora/.test(nat.msg) && !nat.form, tag(`fuera de GForm sin setCustomValidity ${JSON.stringify(nat)}`))
    await page.keyboard.press('Tab'); await page.waitForTimeout(80)
    const natVis = await page.evaluate(() => { const f = document.getElementById('nat-hora'); return { inv: f.getAttribute('aria-invalid'), msg: f.closest('.g-input').querySelector('.g-input__message').textContent.trim() } })
    ok(natVis.inv === 'true' && /Escribe una hora/.test(natVis.msg), tag(`fuera de GForm el error no se revela al salir ${JSON.stringify(natVis)}`))
    await typeIn('nat-hora', '21:30'); await blur()
    const natOk = await page.evaluate(() => ({ custom: document.getElementById('nat-hora').validity.customError, form: document.getElementById('nat-form').checkValidity(), inv: document.getElementById('nat-hora').getAttribute('aria-invalid') }))
    ok(!natOk.custom && natOk.form && natOk.inv !== 'true', tag(`fuera de GForm el error no sale al corregir ${JSON.stringify(natOk)}`))
  }

  /* 9 · Movimiento: la palabra entra solo al cambiar la franja con foco; nada al montar, al escribir ni desde la aplicación */
  {
    await go('')
    const none = await page.evaluate(() => document.getAnimations().filter((a) => /g-time-reading/.test(a.animationName)).map((a) => a.animationName))
    ok(none.length === 0, tag(`al montar hay animaciones de la lectura: ${none}`))
    await page.evaluate(() => { window.__v['s-rest'] = '11:59' }); await page.waitForTimeout(80)
    await page.focus('#s-rest'); await page.waitForTimeout(300)
    const space = await page.evaluate(() => window.__lib.px('--g-space-1'))
    const s = page.evaluate(SAMPLER, ['s-rest', 450]); await page.waitForTimeout(30); await page.keyboard.press('ArrowUp')
    const fr = await s
    const moving = fr.filter((f) => f.entering && f.anims.includes('g-time-reading-rise'))
    const mids = new Set(moving.map((f) => f.dy).filter((d) => d > 0.2 && d < space - 0.2))
    ok(moving.length >= 2 && mids.size >= 2, tag(`la palabra entra: ${moving.length} cuadros, ${mids.size} posiciones intermedias`))
    ok(fr.every((f) => f.dy == null || (f.dy >= -0.01 && f.dy <= space + 0.01)) && Math.max(...fr.map((f) => f.dy ?? 0)) > space * 0.5, tag(`la palabra no sube desde --g-space-1`))
    ok(near(fr.at(-1).dy, 0, 0.01) && fr.at(-1).op === 1 && fr.at(-1).anims.length === 0 && /mediod/.test(fr.at(-1).text), tag(`la palabra no termina en su sitio ${JSON.stringify(fr.at(-1))}`))
    notes.push(`${engine} entrada de la palabra (real): ${moving.length} cuadros, ${mids.size} posiciones intermedias, pico ${Math.max(...fr.map((f) => f.dy ?? 0))}px`)
    await blur()
    // Un paso sin cambiar la franja (10:00 → 10:01, con foco): nada
    await page.evaluate(() => { window.__v['s-rest'] = '10:00' }); await page.waitForTimeout(60)
    await page.focus('#s-rest'); await page.waitForTimeout(250)
    const s1 = page.evaluate(SAMPLER, ['s-rest', 300]); await page.waitForTimeout(20); await page.keyboard.press('ArrowUp')
    const f1 = await s1
    ok(f1.every((f) => !f.anims.length) && /ma.ana/.test(f1.at(-1).text), tag('un paso sin cambiar la franja anima la palabra'))
    await blur()
    // Escribir cifras sin cambiar la franja (pasando por «12:3»): nada
    await typeIn('s-24', '12:30'); await page.waitForTimeout(250)
    const s2 = page.evaluate(SAMPLER, ['s-24', 300]); await page.waitForTimeout(20); await page.keyboard.press('Backspace'); await page.keyboard.type('5')
    ok((await s2).every((f) => !f.anims.length), tag('escribir cifras sin cambiar la franja anima la palabra'))
    await blur(); await page.waitForTimeout(250)
    // Desde la aplicación sin foco: nada
    const s3 = page.evaluate(SAMPLER, ['s-24', 300]); await page.waitForTimeout(20)
    await page.evaluate(() => { window.__v['s-24'] = '21:00' })
    const f3 = await s3
    ok(f3.every((f) => !f.anims.length) && /noche/.test(f3.at(-1).text), tag(`cambio desde la aplicación sin foco anima la palabra ${JSON.stringify(f3.at(-1))}`))
    // Salir y volver a enfocar sin cambiar nada: nada
    const s5 = page.evaluate(SAMPLER, ['s-24', 250]); await page.focus('#s-24'); await blur()
    ok((await s5).every((f) => !f.anims.length), tag('enfocar/salir anima la palabra'))
    // Las dos lecturas: el par aparece (fundido) y su texto sube
    await page.focus('#c-wide')
    const s4 = page.evaluate(() => new Promise((res) => { const root = document.getElementById('c-wide').closest('.g-input'); const out = []; const t0 = performance.now(); (function f() { const ch = root.querySelector('.g-time-field__choices'); if (ch) { const w = ch.querySelector('.g-time-field__choice-word'); out.push({ op: +getComputedStyle(ch).opacity, dy: +(w.getBoundingClientRect().top - ch.querySelector('.g-time-field__choice').getBoundingClientRect().top).toFixed(2), anims: root.getAnimations({ subtree: true }).map((a) => a.animationName).filter((n) => n && n.startsWith('g-time-reading')) }) } if (performance.now() - t0 < 400) requestAnimationFrame(f); else res(out) })() }))
    await page.keyboard.type('9')
    const f4 = await s4
    const dys = [...new Set(f4.map((x) => x.dy))]
    ok(f4.length && f4.some((x) => x.op < 1) && f4.some((x) => x.anims.includes('g-time-reading-fade')) && f4.some((x) => x.anims.includes('g-time-reading-rise')) && dys.length >= 3 && f4.at(-1).op === 1 && !f4.at(-1).anims.length, tag(`las lecturas no entran (${f4.length} cuadros, ${dys.length} posiciones)`))
    await blur()
  }

  /* 10 · Movimiento reducido: 0 animaciones (palabra, lecturas, I2 por GForm) */
  {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await go('')
    await page.evaluate(() => { window.__v['s-rest'] = '11:59' }); await page.waitForTimeout(60)
    await page.focus('#s-rest')
    const s = page.evaluate(SAMPLER, ['s-rest', 300]); await page.waitForTimeout(30); await page.keyboard.press('ArrowUp')
    const fr = await s
    ok(fr.every((f) => !f.anims.length && (f.dy == null || Math.abs(f.dy) < 0.01)) && /mediod/.test(fr.at(-1).text), tag('reduce: la palabra se mueve'))
    await typeIn('c-wide', '9')
    const ch = await page.evaluate(() => document.getElementById('c-wide').closest('.g-input').getAnimations({ subtree: true }).map((a) => a.animationName).filter((n) => n && n.startsWith('g-time-reading')))
    ok(ch.length === 0, tag(`reduce: las lecturas se animan ${ch}`))
    await blur()
    await typeIn('ef-hora', '99:99'); await page.keyboard.press('Tab')
    const sh = page.evaluate(() => new Promise((res) => { const r = document.getElementById('ef-hora').closest('.g-input'); const names = new Set(); let rej = false; const t0 = performance.now(); (function f() { if (r.classList.contains('is-rejected')) rej = true; r.getAnimations({ subtree: true }).forEach((a) => a.animationName && names.add(a.animationName)); if (performance.now() - t0 < 400) requestAnimationFrame(f); else res({ rej, names: [...names] }) })() }))
    await page.click('#ef-send')
    const shr = await sh
    ok(shr.names.length === 0, tag(`reduce: I2 se mueve ${JSON.stringify(shr)}`))
    await page.emulateMedia({ reducedMotion: 'no-preference' })
  }

  /* 11 · RTL y WebKit: con el foco y el cursor al final, la hora no se desplaza */
  await go('')
  for (const id of ['rtl-ar12', 'rtl-ar24', 's-rest', 't12-xs', 't24-xl', 'mn-12']) {
    await page.focus('#' + id); await page.keyboard.press('End'); await page.waitForTimeout(30)
    const sl = await page.evaluate((i) => { const f = document.getElementById(i); return { sl: Math.abs(f.scrollLeft), sw: f.scrollWidth, cw: f.clientWidth } }, id)
    if (engine === 'webkit' && sl.sl === 1) { notes.push(`webkit: ${id} se desplaza 1px con el cursor al final (hueco del cursor de 1px; hallazgo 1 de GNumberField, de lima)`); continue }
    ok(sl.sl === 0 && sl.sw <= sl.cw + 1, tag(`con foco: ${id} se desplaza ${JSON.stringify(sl)}`))
  }
  await blur()

  /* 12 · GTooltip envolviendo el campo: la pestaña mide la caja visible (data-g-tooltip-box = g-input__control) */
  {
    await go('')
    for (const id of ['tt-12', 'tt-24']) {
      await page.focus('#tt-before'); await page.keyboard.press('Tab')
      if (id === 'tt-24') { await page.keyboard.press('Tab') }
      await page.waitForTimeout(400)
      const m = await page.evaluate((i) => {
        const f = document.getElementById(i), box = f.closest('[data-g-tooltip-box]')
        const tip = document.getElementById((f.getAttribute('aria-describedby') || '').split(' ')[0].replace(/-name$/, '')) || [...document.querySelectorAll('.g-tooltip')].find((t) => t.matches(':popover-open'))
        const open = tip && tip.matches(':popover-open')
        const R = (e) => { const r = e.getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top, b: r.bottom, w: r.width } }
        return { focus: document.activeElement.id, describedby: f.getAttribute('aria-describedby'), labelled: f.getAttribute('aria-labelledby'), boxIsCtl: box && box.classList.contains('g-input__control'), open, side: tip && tip.dataset.side, box: box && R(box), tab: open && R(tip.querySelector('.g-tooltip__tab')), body: open && R(tip.querySelector('.g-tooltip__body')) }
      }, id)
      ok(m.focus === id && m.boxIsCtl && /-name\b/.test(m.describedby || '') && m.open, tag(`${id}: tooltip con Tab ${JSON.stringify(m)}`))
      if (m.open) {
        const want = Math.min(m.box.r, m.body.r) - Math.max(m.box.l, m.body.l)
        ok(near(m.tab.w, want, 0.25) && m.tab.l >= m.body.l - 0.5 && m.tab.r <= m.body.r + 0.5, tag(`${id}: pestaña ${m.tab.w.toFixed(2)} ≠ caja ∩ etiqueta ${want.toFixed(2)}`))
        ok(m.side === 'bottom' ? near(m.tab.t, m.box.b, 0.5) : near(m.tab.b, m.box.t, 0.5), tag(`${id}: la pestaña no toca la caja ${JSON.stringify(m)}`))
        if (engine === 'chromium') notes.push(`${id} con GTooltip: caja ${m.box.w.toFixed(2)}px, pestaña ${m.tab.w.toFixed(2)}px, etiqueta ${m.body.w.toFixed(2)}px (${m.side})`)
      }
      await blur(); await page.keyboard.press('Escape'); await page.waitForTimeout(150)
    }
    // Puntero sobre p.m.: muestra el tooltip del campo; pulsar p.m. lo cierra («pulsar es usar») sin mover el foco
    await page.mouse.move(0, 0); await page.waitForTimeout(200)
    const pm = page.locator('#tt-12').locator('xpath=ancestor::div[contains(@class,"g-input ")][1]').locator('.g-time-field__half').nth(0)
    await pm.hover(); await page.waitForTimeout(600)
    const hv = await page.evaluate(() => [...document.querySelectorAll('.g-tooltip')].some((t) => t.matches(':popover-open')))
    ok(hv, tag('pasar sobre a.m. no muestra el tooltip del campo'))
    await pm.click(); await page.waitForTimeout(250)
    const cl = await page.evaluate(() => ({ open: [...document.querySelectorAll('.g-tooltip')].some((t) => t.matches(':popover-open')), model: window.__v['tt-12'], focus: document.activeElement === document.body }))
    ok(!cl.open && cl.model === '09:30' && cl.focus, tag(`pulsar a.m. con tooltip ${JSON.stringify(cl)}`))
    await page.mouse.move(0, 0)
    // El tooltip no cambia el aspecto del campo: caja y botones como sin él
    const same = await page.evaluate(() => { const a = document.getElementById('tt-12').closest('.g-input').querySelector('.g-input__control').getBoundingClientRect(), b = document.getElementById('s-rest').closest('.g-input').querySelector('.g-input__control').getBoundingClientRect(); return [a.height, b.height] })
    ok(near(same[0], same[1]), tag(`con tooltip la caja cambia ${same}`))
  }

  /* 13 · Texto al 200 % (html 200 %) y zoom 200 % aproximado (visor de 640 con DPR 2) */
  for (const [label, qs, vp, dpr] of [['texto 200 %', '?text=200', { width: 1280, height: 900 }, 1], ['zoom 200 %', '', { width: 640, height: 800 }, 2], ['zoom 200 % auditoría', '?theme=auditoria', { width: 640, height: 800 }, 2]]) {
    const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: dpr })
    const p2 = await ctx.newPage(); watch(p2); await go(qs, p2)
    const g = await p2.evaluate(geometry)
    ok(g.overflow <= 0, tag(`${label}: desborde de la página ${g.overflow}`))
    ok(!g.overlap.length, tag(`${label}: solapes ${g.overlap}`))
    // Hallazgo 2 (cerrado, #416): sin tolerancia, ninguna hora recortada, tampoco un 12 h fuera de una fila con el ancho por defecto
    ok(!g.scrolls.length, tag(`${label}: la hora no cabe ${g.scrolls}`))
    // Δ0 de GTimeField con GInput en cada fila; GDatePicker vacío aparte (hallazgo 3, de su CSS, no de este componente)
    for (const r of g.rows) for (const l of r.lines) {
      const mine = l.filter((k) => !/fecha/.test(k.c))
      if (mine.length > 1) ok(mine.every((k) => near(k.top, mine[0].top, 1)) && mine.every((k) => near(k.h, mine[0].h, 0.5)), tag(`${label} fila ${r.row}: ${JSON.stringify(l)}`))
      const dp = l.filter((k) => /fecha/.test(k.c) && !near(k.h, mine[0]?.h ?? k.h, 0.5))
      if (dp.length) notes.push(`${engine} ${label} fila ${r.row}: GDatePicker ${dp.map((k) => k.c + ' ' + k.h).join(', ')}px frente a ${mine[0].h}px de GInput/GTimeField`)
    }
    for (const [sid, s] of Object.entries(g.sizes)) ok(near(s.box, s.inputBox) && s.btns.every((b) => near(b.top, 0) && near(b.bottom, 0)), tag(`${label} ${sid}: caja o botones ${JSON.stringify(s.btns)}`))
    const fs = await p2.evaluate(() => parseFloat(getComputedStyle(document.getElementById('s-rest')).fontSize))
    if (qs.includes('text')) ok(fs >= 27.9, tag(`${label}: el texto no crece (${fs}px)`))
    await ctx.close()
  }

  /* 13b · Fuera de una fila y sin block (#416): 240px exactos a texto normal (Δ0 con un GInput vecino), el mínimo medido a texto
     al 200 % (hora entera, raíz ≥ mínimo por posiciones y ≤ contenedor) y sin desborde en 320px; con block o dentro de una
     fila, ni data-fit ni variable */
  for (const [label, qs, vp] of [['normal', '', { width: 1280, height: 900 }], ['normal auditoría', '?theme=auditoria', { width: 1280, height: 900 }], ['texto 200 %', '?text=200', { width: 1280, height: 900 }], ['texto 200 % auditoría', '?text=200&theme=auditoria', { width: 1280, height: 900 }], ['texto 200 % 320px', '?text=200', { width: 320, height: 800 }], ['texto 100 % 320px', '', { width: 320, height: 800 }]]) {
    const ctx = await browser.newContext({ viewport: vp })
    const p3 = await ctx.newPage(); watch(p3); await go(qs, p3)
    const f = await p3.evaluate(FIT)
    const wide = qs.includes('text=200'), tag3 = (m) => tag(`fit ${label}: ${m}`)
    for (const id of ['fit-12', 'fit-24s']) {
      const r = f[id]
      ok(r.fit && /^\d+(\.\d+)?px$/.test(r.varr), tag3(`${id} sin data-fit o variable ${JSON.stringify(r)}`))
      // Con el mínimo por encima del contenedor (320px y texto al 200 %) la raíz se acota al 100 %: sin desborde, la hora cede
      const capped = r.expected > r.cont + 0.5
      ok(capped || r.clips <= 1, tag3(`${id} la hora no cabe entera (${r.clips}px, «${r.value}»)`))
      ok(r.root >= Math.min(r.expected, r.cont) - 0.51 && r.root <= r.cont + 0.01, tag3(`${id} la raíz mide ${r.root}px, mínimo por posiciones ${r.expected}, contenedor ${r.cont}`))
      if (!wide && vp.width > 400) ok(near(r.root, f.ref.root, 0.01) && (qs.includes('auditoria') || near(r.root, 240, 0.01)), tag3(`${id} mide ${r.root}px y el GInput vecino ${f.ref.root}px (esperado 240 a texto normal)`))
    }
    ok(f.overflow <= 0, tag3(`desborde de la página ${f.overflow}`))
    if (engine === 'chromium' && vp.width <= 400 && wide) notes.push(`${engine} fit ${label}: el mínimo (${f['fit-12'].expected}px en 12 h) supera el contenedor (${f['fit-12'].cont}px): la raíz se acota al 100 % (${f['fit-12'].root}px), sin desborde, y la hora cede ${f['fit-12'].clips}px (límite aceptado de #416)`)
    if (engine === 'chromium' && vp.width > 400) notes.push(`${engine} fit ${label}: 12 h ${f['fit-12'].root}px (mínimo ${f['fit-12'].expected}), 24 h con segundos ${f['fit-24s'].root}px (mínimo ${f['fit-24s'].expected}), GInput ${f.ref.root}px, contenedor ${f['fit-12'].cont}px`)
    await ctx.close()
  }
  {
    // Con block o dentro de una fila no hay data-fit ni variable
    await go('')
    const bad = await page.evaluate(() => [...document.querySelectorAll('.g-time-field')].filter((r) => r.closest('.g-input--block, .g-form-row') && (r.hasAttribute('data-fit') || r.style.getPropertyValue('--_min-inline'))).map((r) => r.querySelector('.g-time-field__field').id))
    ok(!bad.length, tag(`fit: con block o en una fila hay data-fit o variable ${bad}`))
  }

  /* 14 · forced-colors (solo Chromium lo emula) */
  if (engine === 'chromium') {
    for (const qs of ['', 'dark=1', 'theme=auditoria']) {
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
      ok(fc.on[1] !== fc.canvas && fc.on[0] !== fc.on[1] && fc.on[2] > fc.off[2] && fc.on[3] === 'none', `${t}: pulsado sin Highlight, sin peso o sin forced-color-adjust ${JSON.stringify(fc)}`)
      ok(fc.dis[0] !== fc.off[0], `${t}: deshabilitado no es GrayText ${JSON.stringify(fc)}`)
      ok(fc.read === fc.text, `${t}: la lectura no es CanvasText`)
      ok(near(fc.inv[1], -fc.inv[0], 0.01), `${t}: con error los botones no tapan el borde real (${fc.inv})`)
      // Foco visible en el conjunto
      await page.focus('#s-24'); await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Tab')
      const ring = await page.evaluate(() => { const cs = getComputedStyle(document.activeElement.closest('.g-input__row')); return { st: cs.outlineStyle, w: parseFloat(cs.outlineWidth), c: cs.outlineColor, canvas: getComputedStyle(document.body).backgroundColor } })
      ok(ring.st !== 'none' && ring.w >= 1 && ring.c !== ring.canvas, `${t}: foco invisible ${JSON.stringify(ring)}`)
      await blur()
    }
    await page.emulateMedia({ forcedColors: 'none' })
  }

  /* 15 · Puntero grueso (Chromium y WebKit con táctil) */
  if (engine !== 'firefox') {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: engine === 'chromium' })
    const p2 = await ctx.newPage(); watch(p2)
    await go('', p2)
    const coarse = await p2.evaluate(() => matchMedia('(pointer: coarse)').matches)
    if (!coarse) notes.push(`${engine}: pointer: coarse no se emula`)
    else {
      const g = await p2.evaluate(geometry)
      for (const [sid, s] of Object.entries(g.sizes)) for (const b of s.btns) ok(b.w >= 44 - 0.01 && b.h >= 44 - 0.01, tag(`táctil ${sid}: a. m./p. m. ${b.w}×${b.h}`))
      for (const [sid, s] of Object.entries(g.sizes)) ok(s.box >= 44 - 0.01 && near(s.box, s.inputBox), tag(`táctil ${sid}: caja ${s.box} / GInput ${s.inputBox}`))
      ok(g.overflow <= 0, tag(`táctil: desborde ${g.overflow}`))
      // Un toque en p.m. sin foco: cambia la mitad y no enfoca el campo (sin teclado en pantalla)
      await p2.locator('#s-24').evaluate((e) => e.blur())
      await p2.locator('#k-12').locator('xpath=ancestor::div[contains(@class,"g-input ")][1]').locator('.g-time-field__half').nth(1).tap()
      const tp = await p2.evaluate(() => ({ model: window.__v['k-12'], focus: document.activeElement.tagName }))
      // Hallazgo 4 (bruno): en WebKit con táctil, preventDefault en pointerdown cancela el click y el toque no hace nada
      ok(tp.model === '21:30' && tp.focus !== 'INPUT', tag(`táctil: toque en p.m. ${JSON.stringify(tp)}`))
      await p2.locator('#c-narrow').evaluate((e) => e.focus()); await p2.keyboard.type('9'); await p2.waitForTimeout(100)
      const tsz = await p2.evaluate(() => [...document.getElementById('c-narrow').closest('.g-input').querySelectorAll('.g-time-field__choice')].map((b) => { const r = b.getBoundingClientRect(); return [+r.width.toFixed(2), +r.height.toFixed(2)] }))
      ok(tsz.length === 2 && tsz.every(([w, h]) => w >= 44 - 0.01 && h >= 44 - 0.01), tag(`táctil: lecturas ${JSON.stringify(tsz)}`))
      await p2.locator('#c-narrow').locator('xpath=ancestor::div[contains(@class,"g-input ")][1]').locator('.g-time-field__choice').nth(1).tap(); await p2.waitForTimeout(100)
      const tc = await p2.evaluate(() => ({ model: window.__v['c-narrow'], text: document.getElementById('c-narrow').value }))
      ok(tc.text === '21:00', tag(`táctil: toque en la segunda lectura ${JSON.stringify(tc)}`))
    }
    await ctx.close()
  }

  /* 16 · Escalas fraccionarias: el separador no desaparece */
  for (const dpr of [1.25, 1.5, 2]) {
    const ctx = await browser.newContext({ viewport: { width: 1000, height: 800 }, deviceScaleFactor: dpr })
    const p2 = await ctx.newPage(); watch(p2); await go('', p2)
    const w = await p2.evaluate(() => parseFloat(getComputedStyle(document.getElementById('s-rest').closest('.g-input').querySelector('.g-time-field__half')).borderLeftWidth))
    ok(w * dpr >= 1 - 0.01, tag(`DPR ${dpr}: separador ${w}px`))
    await ctx.close()
  }

  /* 17 · Playground: #sec-time con ?now=, filas #tf-row/#tf-row2 (Δ0) de 1280 a 320, bloquear, contraste claro y oscuro */
  {
    const p2 = await browser.newPage({ viewport: { width: 1280, height: 900 } })
    const perr = []
    p2.on('console', (m) => { if (['error', 'warning'].includes(m.type())) perr.push(m.text()) })
    p2.on('pageerror', (e) => perr.push(String(e)))
    await p2.goto(PLAY + '?now=10:40#sec-time')
    await p2.waitForSelector('#tf-r-hora', { timeout: 20000 })
    await p2.evaluate(() => document.fonts.ready)
    await p2.evaluate(`window.__lib = (${lib})()`)
    const rowsOf = () => [...document.querySelectorAll('#tf-row, #tf-row2')].map((row) => {
      const R = (e) => e.getBoundingClientRect()
      const box = (k) => k.querySelector('.g-input__control, .g-select__trigger, .g-select__control, .g-datepicker__field') || k
      const kids = [...row.children].filter((k) => !k.classList.contains('g-tooltip')).map((k) => ({ c: (k.querySelector('input[id], button[id]') || k).id, rootTop: R(k).top, top: +R(box(k)).top.toFixed(2), h: +R(box(k)).height.toFixed(2), w: +R(k).width.toFixed(2) }))
      const lines = []
      for (const k of kids) { const l = lines.find((x) => Math.abs(x[0].rootTop - k.rootTop) < 2); if (l) l.push(k); else lines.push([k]) }
      return { row: row.id, lines: lines.map((l) => l.map(({ c, top, h, w }) => ({ c, top, h, w }))), over: document.documentElement.scrollWidth - innerWidth }
    })
    // GFormRow vuelve a planear la fila tras cambiar el ancho (ResizeObserver + cuadro): se mide cuando dos lecturas seguidas coinciden
    const settled = async () => { let prev = ''; for (let i = 0; i < 30; i++) { await p2.waitForTimeout(80); const cur = JSON.stringify(await p2.evaluate(rowsOf)); if (cur === prev) return JSON.parse(cur); prev = cur } return JSON.parse(prev) }
    for (const dark of [false, true]) {
      await p2.evaluate((d) => { document.documentElement.dataset.theme = d ? 'dark' : 'light' }, dark)
      for (const w of [1280, 1024, 720, 480, 360, 320]) {
        await p2.setViewportSize({ width: w, height: 900 })
        for (const r of await settled()) {
          for (const l of r.lines) if (l.length > 1) ok(l.every((k) => near(k.top, l[0].top, 1)) && l.every((k) => near(k.h, l[0].h, 0.5)), tag(`playground ${dark ? 'oscuro' : 'claro'} ${w}px ${r.row}: ${JSON.stringify(l)}`))
          ok(r.over <= 0, tag(`playground ${w}px: desborde ${r.over}`))
        }
      }
      await p2.setViewportSize({ width: 1280, height: 900 }); await p2.waitForTimeout(60)
      const c = await p2.evaluate(contrast)
      const bad = c.filter((x) => x.r < x.min)
      ok(!bad.length, tag(`playground ${dark ? 'oscuro' : 'claro'}: contraste ${JSON.stringify(bad.slice(0, 4))}`))
    }
    // Bloquear la hora (switch): misma distribución a 1280, 720 y 480
    for (const w of [1280, 720, 480]) {
      await p2.setViewportSize({ width: w, height: 900 })
      const a = await settled()
      await p2.click('#tf-lock')
      const b = await settled()
      const ro = await p2.evaluate(() => ({ halves: !!document.getElementById('tf-r-hora').closest('.g-input').querySelector('.g-time-field__halves') }))
      await p2.click('#tf-lock'); await settled()
      const sameLines = JSON.stringify(a[0].lines.map((l) => l.map((k) => [k.c, k.w]))) === JSON.stringify(b[0].lines.map((l) => l.map((k) => [k.c, k.w])))
      ok(sameLines && !ro.halves, tag(`playground ${w}px: bloquear reparte la fila ${JSON.stringify({ a: a[0].lines, b: b[0].lines, ro })}`))
    }
    // Vacío + ↑ con ?now=10:40 = 10:40 (sin paso) en «Hora de la toma»
    await p2.focus('#tf-toma'); await p2.keyboard.press('ArrowUp'); await p2.waitForTimeout(40)
    const nowV = await p2.evaluate(() => document.getElementById('tf-toma').value)
    ok(nowV === '10:40', tag(`playground: vacío + ↑ con ?now=10:40 da «${nowV}»`))
    await p2.evaluate(() => document.activeElement.blur())
    ok(!perr.filter((e) => /time-field|GTimeField|Grana/.test(e)).length, tag(`playground consola: ${perr.join(' | ')}`))
    if (perr.length) notes.push(`${engine} playground: ${perr.length} mensajes de consola ajenos a GTimeField: ${[...new Set(perr)].slice(0, 2).join(' | ').slice(0, 200)}`)
    await p2.close()
  }

  /* 18 · Árbol accesible (Chromium, CDP): límite de valuetext registrado por bruno */
  if (engine === 'chromium') {
    await go('')
    const cdp = await page.context().newCDPSession(page)
    const { nodes } = await cdp.send('Accessibility.getFullAXTree')
    const sp = nodes.filter((n) => n.role?.value === 'spinbutton')
    const find = (name) => sp.find((n) => n.name?.value === name)
    const show = (n) => n && Object.fromEntries((n.properties || []).filter((p) => /value/.test(p.name)).map((p) => [p.name, p.value.value]).concat([['value', n.value?.value]]))
    const a = show(find('12 h en reposo')), b = show(find('24 h')), dom = await page.evaluate(() => [document.getElementById('s-rest').getAttribute('aria-valuetext'), document.getElementById('s-24').getAttribute('aria-valuetext')])
    notes.push(`chromium AX (límite de bruno, no de coco): «12 h en reposo» aria-valuetext «${dom[0]}» → AX ${JSON.stringify(a)}; «24 h» «${dom[1]}» → AX ${JSON.stringify(b)}`)
    ok(sp.length >= 50, tag(`AX: spinbuttons ${sp.length}`))
    await cdp.detach()
  }

  ok(!errors.length, tag(`consola: ${errors.join(' | ')}`))
  await browser.close()
}

server.close()
if (notes.length) console.log('\nNotas:\n' + [...new Set(notes)].map((n) => '  · ' + n).join('\n'))
console.log('\nPor motor: ' + Object.entries(per).map(([e, [n, f]]) => `${e} ${n - f}/${n}`).join(' · '))
console.log(`\n${total - failed}/${total} correctas`)
if (failed) { console.log(fails.slice(0, 80).map((f) => '  ✗ ' + f).join('\n')); if (fails.length > 80) console.log(`  … y ${fails.length - 80} más`); process.exitCode = 1 }
