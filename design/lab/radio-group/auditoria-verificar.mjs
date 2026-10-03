// Auditoría de coco (paso 5) de GRadioGroup sobre el COMPONENTE REAL (GRadioGroup.vue + dist/grana.css).
// Dos páginas: auditoria-banco.html (los casos de estilo-banco.html montados con GRadioGroup, GInput, GFormRow y GCheckbox
// reales de dist/grana.umd.js) y el playground (fila real «Fecha · Sexo · ¿Primera consulta?» de #sec-form y #sec-radio).
// Temas: defecto claro y oscuro, el de la auditoría (auditoria-tema.css, @grana/cli: brand #0B1F4D, radius 0, shape pill)
// claro y oscuro, «Tema de prueba» (Georgia, borde 2px, space 5) y los once generados de dark-color-presence.
// Comprueba: marcado real frente al que espera el CSS; contraste (texto, círculo, punto, contorno, marco, trazo de la
// elegida, foco) en reposo y en HOVER; alturas = GInput por size y density; misma arista superior en GFormRow (banco y
// playground a 1280/960/720/480/360/320, con y sin mensajes y etiquetas largas); área táctil (puntero fino y grueso);
// apilado del segmentado en los dos sentidos; RTL; forced-colors (Chromium); movimiento reducido; zoom 200 % (visor a la
// mitad con DPR 2) y escalas 1.25/1.5/2; CSS publicado en dist/grana.css sin literales ni respaldos; GCheckbox tras #270.
// Ejecutar desde la raíz del repo con dist/ reconstruido: node design/lab/radio-group/auditoria-verificar.mjs
// Opcional: --engines=chromium   --verbose (tabla de contraste)
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
const BASE = ORIGIN + '/design/lab/radio-group/auditoria-banco.html'
const PLAY = ORIGIN + '/packages/vue/playground/index.html'
const VUE = await readFile(join(ROOT, 'node_modules/vue/dist/vue.global.prod.js'), 'utf8')
const AUDIT_CSS = await readFile(join(ROOT, 'design/lab/radio-group/auditoria-tema.css'), 'utf8')

const GEN = ['amazon', 'apple', 'caracol-purpura', 'github', 'grana', 'linear', 'lustre', 'medium', 'notion', 'spotify', 'stripe']
let total = 0, failed = 0
const fails = []
const ok = (cond, msg) => { total++; if (!cond) { failed++; fails.push(msg) } }
const near = (a, b, t = 1) => Math.abs(a - b) <= t
const info = []

/* ---------- 0 · CSS publicado (dist/grana.css): las reglas de g-radio-group, sin literales ni respaldos ---------- */
{
  const dist = await readFile(join(ROOT, 'packages/vue/dist/grana.css'), 'utf8')
  ok(dist.includes('g-radio-group__segment'), 'dist: falta g-radio-group__segment')
  // Reglas cuyo selector nombra g-radio-group (también dentro de @media); se recorre el árbol de llaves
  const css = dist.replace(/\/\*[\s\S]*?\*\//g, '')
  const rules = []
  let depth = 0, sel = '', stack = []
  for (let i = 0, buf = ''; i < css.length; i++) {
    const ch = css[i]
    if (ch === '{') { stack.push(buf.trim()); buf = ''; depth++ }
    else if (ch === '}') { const s = stack.pop(); if (/g-radio-group/.test(s)) rules.push({ sel: s, body: buf }); buf = ''; depth-- }
    else buf += ch
  }
  void sel
  const body = rules.map((r) => r.body).join(';')
  ok(rules.length > 100, `dist: solo ${rules.length} reglas de g-radio-group`)
  ok(!/#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|lab|lch)\(/.test(body), 'dist: color literal en g-radio-group')
  ok(!/var\(\s*--[\w-]+\s*,/.test(body), 'dist: var() con respaldo en g-radio-group')
  const vars = [...body.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1])
  ok(vars.every((v) => /^--(g|_)[-\w]/.test(v)), 'dist: var() ajena ' + vars.filter((v) => !/^--(g|_)/.test(v)))
  const px = [...body.matchAll(/(-?\d*\.?\d+)px/g)].map((m) => m[0]).filter((p) => !['24px', '44px', '0px', '1px', '-1px'].includes(p))
  ok(!px.length, 'dist: medidas literales ' + px)
  ok(!/--g-tabs-/.test(body), 'dist: lee --g-tabs-*')
  // Sistema de colores solo en forced-colors
  const sys = rules.filter((r) => /\b(ButtonText|Canvas|CanvasText|SelectedItem|SelectedItemText|GrayText|Highlight)\b/.test(r.body))
  ok(sys.length > 0, 'dist: sin colores de sistema (¿se perdió forced-colors?)')
  // Capa: el CSS del componente va en grana.components (lo aplica el registro)
  ok(/@layer\s+grana\.components/.test(dist) || /@layer[^{;]*components/.test(dist), 'dist: sin capa de componentes')
  // Tokens leídos que no existen en defaults.css
  const defaults = await readFile(join(ROOT, 'packages/vue/src/styles/defaults.css'), 'utf8')
  const defined = new Set([...defaults.matchAll(/(--g-[a-z0-9-]+)\s*:/g)].map((m) => m[1]))
  const missing = [...new Set(vars.filter((v) => v.startsWith('--g-') && !defined.has(v)))]
  ok(!missing.length, 'dist: tokens inexistentes ' + missing)
  // Tokens que bruno vio y no están en la tabla del contrato (informativo para lima)
  for (const t of ['--g-radius-md', '--g-ease-out', '--g-press-scale', '--g-text-body-sm-weight']) ok(defined.has(t), `defaults.css: no define ${t}`)
  const tokensMd = await readFile(join(ROOT, 'docs/contract/tokens.md'), 'utf8')
  for (const t of ['--g-radius-md', '--g-ease-out', '--g-press-scale']) ok(tokensMd.includes(t), `tokens.md: no nombra ${t}`)
  ok(/--g-text-\{caption\|body-sm\|body[^`]*\}-\{size\|line\|tracking\|weight\}/.test(tokensMd), 'tokens.md: sin la familia --g-text-{rol}-weight')
  // GCheckbox (#270): su CSS no depende de [required] ni de la validez nativa
  for (const f of ['GCheckbox/GCheckbox.css', 'GCheckboxGroup/GCheckboxGroup.css', 'GRadioGroup/GRadioGroup.css']) {
    const c = (await readFile(join(ROOT, 'packages/vue/src/components', f), 'utf8')).replace(/\/\*[\s\S]*?\*\//g, '')
    ok(!/\[required\]|:required|:optional|:invalid|:valid\b|:user-invalid|:user-valid/.test(c), `${f}: depende de required o de la validez nativa`)
  }
}


/* Centrado del icono en las opciones de solo icono (hallazgo 8, encontrado por el usuario): centro del icono = centro de
   la opción (±1px en los dos ejes), con y sin apilado, LTR y RTL. El texto oculto sigue en el DOM (nombre del radio) */
const iconCentering = () => {
  const out = []
  for (const o of document.querySelectorAll('.g-radio-group__option.is-icon-only')) {
    const root = o.closest('.g-radio-group'), ic = o.querySelector('.g-radio-group__icon'), r = o.getBoundingClientRect(), i = ic.getBoundingClientRect()
    const txt = o.querySelector('.g-radio-group__option-label')
    out.push({
      id: (root.dataset.case || root.id) + ':' + o.querySelector('input').value,
      dx: +((i.left + i.width / 2) - (r.left + r.width / 2)).toFixed(2),
      dy: +((i.top + i.height / 2) - (r.top + r.height / 2)).toFixed(2),
      dir: getComputedStyle(o).direction, stacked: root.classList.contains('is-stacked'), w: +r.width.toFixed(2), iw: +i.width.toFixed(2),
      // el texto oculto no ocupa hueco en el flujo ni sale de la opción, y sigue siendo el nombre accesible (no display:none)
      hidden: !txt || getComputedStyle(txt).display !== 'none' && txt.textContent.trim().length > 0 && getComputedStyle(txt.closest('.g-radio-group__text')).display !== 'none'
    })
  }
  return out
}

/* ---------- En la página: contraste (el de estilo-verificar.mjs) ---------- */
const measure = () => {
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
  const shadows = (s) => (s.match(/rgba?\([^)]*\)|color\([^)]*\)/g) || []).map(parse)
  const out = []
  const add = (k, fg, bg, min, pair) => out.push({ k, r: ratio(over(fg, bg), bg), min, pair })
  const FAM = { brand: 'primary', accent: 'accent', neutral: 'neutral', success: 'success', warning: 'warning', danger: 'danger', info: 'info' }
  const probe = document.createElement('i'); document.body.append(probe)
  const tok = (n) => { probe.style.color = `var(--g-color-${n})`; return parse(getComputedStyle(probe).color) }
  const pairs = {}
  for (const [c, f] of Object.entries(FAM)) { pairs[c + ':fill'] = ratio(tok('on-' + f), tok(f)); pairs[c + ':soft'] = ratio(tok('on-' + f + '-soft'), tok(f + '-soft')) }
  probe.remove()
  for (const root of document.querySelectorAll('.g-radio-group[data-case]')) {
    const id = root.dataset.case
    const app = [...root.classList].find((c) => c.startsWith('g-radio-group--appearance-')).slice(26)
    const groupOff = root.classList.contains('is-disabled')
    const label = root.querySelector('.g-radio-group__label')
    if (label && !groupOff) add(`${id} etiqueta`, parse(getComputedStyle(label).color), bgOf(label), 4.5)
    const hint = root.querySelector('.g-radio-group__hint')
    if (hint && !groupOff) add(`${id} ayuda`, parse(getComputedStyle(hint).color), bgOf(hint), 4.5)
    const msg = root.querySelector('.g-radio-group__message')
    if (msg && msg.textContent.trim()) add(`${id} mensaje`, parse(getComputedStyle(msg).color), bgOf(msg), 4.5)
    if (groupOff) continue
    const box = root.querySelector('.g-radio-group__options')
    if (app === 'segmented') add(`${id} marco del segmentado`, parse(getComputedStyle(box, '::after').outlineColor), bgOf(root), 3)
    for (const o of root.querySelectorAll('.g-radio-group__option')) {
      if (o.classList.contains('is-disabled')) continue
      const inp = o.querySelector('.g-radio-group__input')
      const k = `${id}[${inp.value}${inp.checked ? ' ✓' : ''}]`
      const color = [...root.classList].find((x) => x.startsWith('g-radio-group--color-')).slice(21)
      const pair = inp.checked && !root.classList.contains('is-readonly') ? (app === 'chip' || app === 'segmented' ? color + ':fill' : app === 'card' ? color + ':soft' : null) : null
      if (!o.classList.contains('is-icon-only')) { const l = o.querySelector('.g-radio-group__option-label'); add(`${k} texto`, parse(getComputedStyle(l).color), bgOf(l), 4.5, pair && pairs[pair] < 4.5 ? pairs[pair] : null) }
      else { const ic = o.querySelector('.g-radio-group__icon'); add(`${k} icono (solo icono)`, parse(getComputedStyle(ic).color), bgOf(ic), 3, pair && pairs[pair] < 3 ? pairs[pair] : null) }
      const d = o.querySelector('.g-radio-group__description'); if (d) add(`${k} descripción`, parse(getComputedStyle(d).color), bgOf(d), 4.5)
      const ocs = getComputedStyle(o)
      if (app === 'list' || app === 'inline' || app === 'card') {
        const ics = getComputedStyle(inp)
        add(`${k} borde del círculo`, parse(ics.borderTopColor), bgOf(o), 3)
        if (inp.checked) { const sh = shadows(ics.boxShadow); add(`${k} punto sobre el relleno`, parse(ics.backgroundColor), sh[1] || sh[0], 3) }
        if (app === 'card' && inp.checked) add(`${k} borde de la tarjeta elegida`, parse(ocs.borderTopColor), bgOf(box), 3)
      }
      if (app === 'chip') add(`${k} contorno del chip`, parse(ocs.borderTopColor), bgOf(box), 3)
      if (app === 'segmented' && inp.checked) { const sh = shadows(ocs.boxShadow); add(`${k} trazo de la elegida`, sh[0], bgOf(box), 3) }
    }
  }
  return out
}

/* ---------- En la página: contraste de UNA opción (para hover) ---------- */
const HOVER = () => {
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
  const shadows = (s) => (s.match(/rgba?\([^)]*\)|color\([^)]*\)/g) || []).map(parse)
  window.__m = (o) => {
    const out = []
    const add = (k, fg, bg, min) => out.push({ k, r: ratio(over(fg, bg), bg), min })
    const root = o.closest('.g-radio-group')
    const app = [...root.classList].find((c) => c.startsWith('g-radio-group--appearance-')).slice(26)
    const inp = o.querySelector('.g-radio-group__input')
    const box = root.querySelector('.g-radio-group__options')
    const l = o.querySelector('.g-radio-group__option-label')
    if (!o.classList.contains('is-icon-only')) add('texto', parse(getComputedStyle(l).color), bgOf(l), 4.5)
    else { const ic = o.querySelector('.g-radio-group__icon'); add('icono', parse(getComputedStyle(ic).color), bgOf(ic), 3) }
    const ocs = getComputedStyle(o)
    if (app === 'list' || app === 'inline' || app === 'card') {
      const ics = getComputedStyle(inp)
      add('borde del círculo', parse(ics.borderTopColor), bgOf(o), 3)
      if (inp.checked) { const sh = shadows(ics.boxShadow); add('punto sobre el relleno', parse(ics.backgroundColor), sh[1] || sh[0], 3) }
    }
    if (app === 'chip') add('contorno del chip', parse(ocs.borderTopColor), bgOf(box), 3)
    if (app === 'segmented' && inp.checked) { const sh = shadows(ocs.boxShadow); add('trazo de la elegida', sh[0], bgOf(box), 3) }
    if (app === 'segmented' && !inp.checked) add('fondo hover contra la caja (informativo)', bgOf(o), parse(getComputedStyle(box).backgroundColor), 1)
    return out
  }
}

/* ---------- En la página: geometría (banco real) ---------- */
const geometry = () => {
  const q = (c) => document.querySelector(`[data-case="${c}"]`)
  const R = (el) => el.getBoundingClientRect()
  const boxOf = (el) => el.querySelector('.g-input__control, .g-radio-group__options')
  // Ancho natural del segmentado, con la fórmula del contrato (#271) y la clase de medida (no la publica el componente)
  const natural = (root) => {
    root.classList.add('g-radio-group--measure')
    const opts = [...root.querySelectorAll('.g-radio-group__option')]
    let w = 0
    for (const o of opts) { const cs = getComputedStyle(o); const seg = o.querySelector('.g-radio-group__segment'); w = Math.max(w, seg.getBoundingClientRect().width + parseFloat(cs.paddingInlineStart) + parseFloat(cs.paddingInlineEnd) + parseFloat(cs.borderInlineStartWidth), parseFloat(cs.minInlineSize) || 0) }
    root.classList.remove('g-radio-group--measure')
    return Math.ceil(opts.length * w)
  }
  const g = { heights: {}, rows: {}, targets: [], clipped: [], equal: {} }
  for (const s of ['xs', 'sm', 'md', 'lg', 'xl', 'md-compact']) {
    g.heights[s] = { input: +R(boxOf(q('in-' + s))).height.toFixed(2), seg: +R(boxOf(q('seg-' + s))).height.toFixed(2), inl: +R(boxOf(q('inl-' + s))).height.toFixed(2), segOpt: +R(q('seg-' + s).querySelector('.g-radio-group__option')).height.toFixed(2) }
  }
  for (const row of document.querySelectorAll('.g-form-row')) {
    const lines = {}
    for (const k of row.children) { const b = boxOf(k); (lines[k.dataset.line] ??= []).push({ c: k.dataset.case, top: +R(b).top.toFixed(2), h: +R(b).height.toFixed(2) }) }
    g.rows[row.dataset.row] = { lines: row.dataset.lines, byLine: lines, compactH: row.dataset.row === 'c' ? [...row.children].map((k) => +R(boxOf(k)).height.toFixed(2)) : null }
  }
  for (const o of document.querySelectorAll('.g-radio-group__option')) {
    const r = R(o); const id = o.closest('[data-case]').dataset.case
    g.targets.push({ id: id + ':' + o.querySelector('input').value, w: +r.width.toFixed(2), h: +r.height.toFixed(2) })
    for (const t of o.querySelectorAll('.g-radio-group__option-label, .g-radio-group__description')) {
      if (o.classList.contains('is-icon-only') && t.classList.contains('g-radio-group__option-label')) continue
      if (t.scrollWidth > t.clientWidth + 1 || R(t).right > R(o).right + 1 || R(t).left < R(o).left - 1) g.clipped.push(id + ':' + t.textContent)
    }
  }
  for (const l of document.querySelectorAll('.g-radio-group__label, .g-input__label')) if (l.scrollWidth > l.clientWidth + 1) g.clipped.push('etiqueta ' + l.textContent)
  for (const seg of document.querySelectorAll('.g-radio-group--appearance-segmented[data-case]')) {
    const opts = [...seg.querySelectorAll('.g-radio-group__option')].map(R)
    g.equal[seg.dataset.case] = { stacked: seg.classList.contains('is-stacked'), widths: opts.map((r) => +r.width.toFixed(2)), tops: opts.map((r) => +r.top.toFixed(2)), lefts: opts.map((r) => +r.left.toFixed(2)), natural: natural(seg), box: +R(seg.querySelector('.g-radio-group__options')).width.toFixed(2) }
  }
  const rtl = (c) => [...q(c).querySelectorAll('.g-radio-group__option')].map((o) => +R(o).left.toFixed(2))
  g.rtl = { seg: rtl('rtl-seg'), inline: rtl('rtl-inline') }
  g.overflow = { doc: document.documentElement.scrollWidth, vw: innerWidth }
  return g
}

/* ---------- En la página: marcado real frente a lo que espera el CSS ---------- */
const markup = () => {
  const bad = []
  for (const root of document.querySelectorAll('.g-radio-group[data-case]')) {
    const id = root.dataset.case
    const cls = [...root.classList]
    const app = (cls.find((c) => c.startsWith('g-radio-group--appearance-')) || '').slice(26)
    if (!app) bad.push(`${id}: sin --appearance-*`)
    for (const p of ['size', 'density', 'color']) if (!cls.some((c) => c.startsWith(`g-radio-group--${p}-`))) bad.push(`${id}: sin --${p}-*`)
    const isDiv = app === 'inline' || app === 'segmented'
    if (root.tagName !== (isDiv ? 'DIV' : 'FIELDSET')) bad.push(`${id}: raíz ${root.tagName} para ${app}`)
    if (root.getAttribute('role') !== 'radiogroup') bad.push(`${id}: sin role=radiogroup`)
    const kids = [...root.children].map((k) => k.className.split(' ')[0])
    const want = ['g-radio-group__label', 'g-radio-group__options', 'g-radio-group__support'].filter((c) => kids.includes(c))
    if (kids.join() !== want.join() || !kids.includes('g-radio-group__options')) bad.push(`${id}: hijos de la raíz ${kids}`)
    const lab = root.querySelector(':scope > .g-radio-group__label')
    if (lab && lab.tagName !== (isDiv ? 'SPAN' : 'LEGEND')) bad.push(`${id}: etiqueta ${lab.tagName}`)
    if (root.classList.contains('is-stacked') && app !== 'segmented') bad.push(`${id}: is-stacked fuera de segmented`)
    if (root.classList.contains('g-radio-group--measure')) bad.push(`${id}: --measure se quedó puesta`)
    if (root.querySelector('.g-radio-group__segment') && app !== 'segmented') bad.push(`${id}: __segment fuera de segmented`)
    const iconMode = root.classList.contains('g-radio-group--icon-only')
    if (iconMode && app !== 'segmented' && app !== 'chip') bad.push(`${id}: --icon-only en ${app}`)
    for (const o of root.querySelectorAll(':scope > .g-radio-group__options > *')) {
      if (o.tagName !== 'LABEL' || !o.classList.contains('g-radio-group__option')) { bad.push(`${id}: hijo de __options ${o.tagName}.${o.className}`); continue }
      const el = [...o.children]
      const inp = el[0]
      if (!inp || !inp.matches('input.g-radio-group__input[type=radio]')) bad.push(`${id}: el <input> no es el primer hijo directo de la opción`)
      if (inp && inp.hasAttribute('required')) bad.push(`${id}: required nativo en un radio (#269)`)
      if (app === 'segmented' && (el.length !== 2 || !el[1].classList.contains('g-radio-group__segment'))) bad.push(`${id}: el segmento no envuelve icono y texto (${el.map((e) => e.className)})`)
      if (app !== 'segmented' && el.slice(1).some((e) => !/g-radio-group__(icon|text|option-label)/.test(e.className))) bad.push(`${id}: partes inesperadas ${el.map((e) => e.className)}`)
      // Nodos que no son elementos dentro de la opción: comentarios (fragmentos de Vue) sí; texto con contenido, no
      const walk = document.createTreeWalker(o, NodeFilter.SHOW_TEXT)
      for (let n = walk.nextNode(); n; n = walk.nextNode()) if (n.parentElement === o && n.textContent.trim()) bad.push(`${id}: texto suelto en la opción «${n.textContent}»`)
      if (o.classList.contains('is-icon-only') && !(iconMode && o.querySelector('.g-radio-group__icon'))) bad.push(`${id}: is-icon-only sin modo icono o sin icono`)
      if (iconMode && o.querySelector('.g-radio-group__icon') && !o.classList.contains('is-icon-only')) bad.push(`${id}: opción con icono sin is-icon-only`)
      if (o.querySelector('.g-radio-group__description') && !(app === 'list' || app === 'card')) bad.push(`${id}: descripción en ${app}`)
    }
    // Región de mensaje vacía: no ocupa sitio aunque Vue deje un comentario dentro (:empty los ignora)
    const msg = root.querySelector('.g-radio-group__message')
    if (msg && !msg.textContent.trim()) { const r = msg.getBoundingClientRect(); const mt = parseFloat(getComputedStyle(msg).marginTop); if (r.height > 0.5 || mt > 0) bad.push(`${id}: mensaje vacío ocupa ${r.height}px + margen ${mt}`) }
  }
  return bad
}

const table = []
const themeNotes = new Set()
const hoverTable = []
for (const engine of ENGINES) {
  const browser = await pw[engine].launch()
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  const errors = []
  const watch = (p) => {
    p.on('console', (m) => { if (['error', 'warning'].includes(m.type()) && !/ResizeObserver loop/.test(m.text())) errors.push(m.text()) })
    p.on('pageerror', (e) => { if (!/ResizeObserver loop/.test(e.message)) errors.push(String(e)) })
    p.on('requestfailed', (r) => errors.push('red: ' + r.url()))
  }
  watch(page)
  const go = async (qs, p = page) => {
    await p.goto(BASE + qs); await p.waitForSelector('html[data-ready]'); await p.evaluate(() => document.fonts.ready)
    await p.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
    if (/theme=|test=|dark=|audit=/.test(qs)) await p.waitForTimeout(400)
  }

  /* 1 · Marcado real */
  await go('')
  const bad = await page.evaluate(markup)
  ok(!bad.length, `${engine} marcado: ${bad.slice(0, 12).join(' | ')}`)

  /* 2 · Contraste en reposo, todos los temas */
  const configs = [['defecto', ''], ['defecto', 'dark=1'], ['auditoría', 'audit=1'], ['auditoría', 'audit=1&dark=1'], ['prueba', 'test=1'], ...GEN.flatMap((t) => [[t, `theme=${t}`], [t, `theme=${t}&dark=1`]])]
  for (const [name, qs] of configs) {
    await go('?' + qs)
    const m = await page.evaluate(measure)
    const tag = `${engine} ${name} ${qs.includes('dark') ? 'oscuro' : 'claro'}`
    for (const c of m) {
      if (c.r < c.min && c.pair && near(c.r, c.pair, 0.05)) { themeNotes.add(`${name} ${qs.includes('dark') ? 'oscuro' : 'claro'}: ${c.k} ${c.r}:1 = par del tema ${c.pair}:1`); continue }
      ok(c.r >= c.min, `${tag}: ${c.k} ${c.r}:1 < ${c.min}`)
    }
    const worst = (re) => { const xs = m.filter((c) => re.test(c.k)); return xs.length ? Math.min(...xs.map((c) => c.r)) : null }
    table.push({ tag, texto: worst(/texto|etiqueta|descripción|ayuda|mensaje/), circulo: worst(/borde del círculo/), punto: worst(/punto/), chip: worst(/contorno del chip/), marco: worst(/marco/), elegida: worst(/trazo de la elegida|tarjeta elegida/), icono: worst(/icono/) })
  }

  /* 3 · Contraste en hover (puntero real): la opción sin elegir y la elegida de cada apariencia y color */
  for (const qs of ['', 'dark=1', 'audit=1', 'audit=1&dark=1', 'theme=spotify', 'theme=spotify&dark=1', 'test=1']) {
    await go('?' + qs)
    await page.evaluate(HOVER)
    const cases = ['ap-list', 'ap-inline', 'ap-segmented', 'ap-chip', 'ap-card', 'st-list-warning', 'st-chip-valid', 'st-card-invalid', 'io-seg', ...['segmented', 'chip', 'card', 'list'].flatMap((a) => ['brand', 'accent', 'warning', 'info'].map((c) => `col-${a}-${c}`))]
    let worst = { text: 99, ctl: 99 }
    for (const c of cases) {
      for (const checked of [false, true]) {
        const loc = page.locator(`[data-case="${c}"] .g-radio-group__option:not(.is-disabled)`).filter({ has: page.locator(checked ? 'input:checked' : 'input:not(:checked)') }).first()
        if (!(await loc.count())) continue
        await loc.hover()
        await page.waitForTimeout(260)
        const r = await page.evaluate(([c, checked]) => {
          const o = [...document.querySelectorAll(`[data-case="${c}"] .g-radio-group__option:not(.is-disabled)`)].find((x) => x.querySelector('input').checked === checked)
          if (!o.matches(':hover')) return { nohover: true }
          const all = window.__m(o)
          return all
        }, [c, checked])
        if (r.nohover) { ok(false, `${engine} hover ?${qs}: ${c} no queda en :hover`); continue }
        for (const x of r) {
          ok(x.r >= x.min, `${engine} hover ?${qs}: ${c}${checked ? ' ✓' : ''} ${x.k} ${x.r}:1 < ${x.min}`)
          if (x.min === 4.5) worst.text = Math.min(worst.text, x.r); else if (x.min === 3) worst.ctl = Math.min(worst.ctl, x.r)
        }
      }
    }
    await page.mouse.move(0, 0)
    hoverTable.push({ tag: `${engine} ?${qs || 'defecto'}`, texto: worst.text, control: worst.ctl })
  }

  /* 4 · Foco visible por opción */
  for (const qs of ['', 'dark=1', 'audit=1', 'audit=1&dark=1', 'theme=spotify', 'theme=caracol-purpura&dark=1']) {
    await go('?' + qs)
    for (const c of ['ap-list', 'ap-inline', 'ap-segmented', 'ap-chip', 'ap-card', 'st-segmented-readonly', 'st-list-readonly', 'io-seg', 'col-segmented-accent', 'col-chip-warning', 'col-segmented-info']) {
      await page.keyboard.press('Shift')
      const f = await page.evaluate((c) => {
        const root = document.querySelector(`[data-case="${c}"]`)
        const app = [...root.classList].find((x) => x.startsWith('g-radio-group--appearance-')).slice(26)
        const inp = root.querySelector('.g-radio-group__input:checked') || root.querySelector('.g-radio-group__input:not(:disabled)')
        inp.focus()
        return new Promise((done) => setTimeout(() => done(after()), 400))
        function after() {
          const ringEl = app === 'list' || app === 'inline' ? inp : inp.closest('.g-radio-group__option')
          const cs = getComputedStyle(ringEl)
          const probe = document.createElement('i'); probe.style.color = 'var(--g-color-focus)'; document.body.append(probe); const focus = getComputedStyle(probe).color; probe.remove()
          const parse = (s) => { const m = s.match(/rgba?\(([^)]+)\)/); if (!m) return [0, 0, 0, 0]; const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p[3] ?? 1] }
          const bgOf = (el) => { for (let n = el; n; n = n.parentElement) { const x = parse(getComputedStyle(n).backgroundColor); if (x[3] >= 1) return x } return [255, 255, 255, 1] }
          const lum = (x) => { const f = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(x[0]) + 0.7152 * f(x[1]) + 0.0722 * f(x[2]) }
          const ratio = (a, b) => { const x = lum(a), y = lum(b); return +((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)).toFixed(2) }
          const off = parseFloat(cs.outlineOffset), w = parseFloat(cs.outlineWidth)
          let adj
          if (app === 'segmented') {
            // Anillo interior: lo que hay justo fuera y justo dentro de él, por capas (la primera sombra interior va encima)
            const layers = [...cs.boxShadow.matchAll(/(rgba?\([^)]*\))\s+0px\s+0px\s+0px\s+([\d.]+)px\s+inset|inset\s+0px\s+0px\s+0px\s+([\d.]+)px\s+(rgba?\([^)]*\))/g)].map((m) => ({ c: parse(m[1] || m[4]), d: parseFloat(m[2] || m[3]) }))
            const at = (x) => { const l = layers.find((y) => y.d > x && y.c[3] > 0); return l ? l.c : bgOf(ringEl) }
            const d1 = -off - w, d2 = -off
            adj = [at(d1 - 0.5), at(d2 + 0.5)]
            // Separación entre el anillo y el trazo visible más interior (que no es el halo de superficie): ≥ focus-offset
            const own = bgOf(ringEl).join()
            const strokes = layers.filter((y) => y.d <= d1 + 0.01 && y.c[3] > 0 && y.c.join() !== own)
            var gap = strokes.length ? d1 - Math.max(...strokes.map((y) => y.d)) : null
            var fo = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--g-focus-offset'))
          } else adj = [bgOf(app === 'list' || app === 'inline' ? inp.closest('.g-radio-group__option') : root.querySelector('.g-radio-group__options'))]
          const fc = parse(cs.outlineColor)
          return { fv: inp.matches(':focus-visible'), style: cs.outlineStyle, w, off, color: cs.outlineColor, focus, ratio: Math.min(...adj.map((a) => ratio(fc, a))), inside: app === 'segmented' ? off + w <= 0 : true, gap: typeof gap === 'undefined' ? null : gap, fo: typeof fo === 'undefined' ? null : fo }
        }
      }, c)
      const tag = `${engine} foco ${c} ?${qs}`
      ok(f.fv, `${tag}: no hay :focus-visible`)
      ok(f.style === 'solid' && f.w >= 1.5, `${tag}: sin anillo (${f.style} ${f.w})`)
      ok(f.color === f.focus, `${tag}: color ${f.color} ≠ --g-color-focus ${f.focus}`)
      ok(f.ratio >= 3, `${tag}: anillo ${f.ratio}:1 < 3 contra lo adyacente`)
      ok(f.inside, `${tag}: el anillo del segmento sale de la opción (offset ${f.off}, ancho ${f.w})`)
      ok(f.gap === null || f.gap >= f.fo - 0.01, `${tag}: el anillo queda a ${f.gap}px del trazo de la opción (< --g-focus-offset ${f.fo})`)
      await page.evaluate(() => document.activeElement && document.activeElement.blur())
    }
  }

  /* 5 · Geometría: defecto, oscuro, RTL de página, auditoría y Tema de prueba (borde 2px, space 5) */
  for (const qs of ['', 'dark=1', 'rtl=1', 'audit=1', 'test=1']) {
    await go('?' + qs)
    const g = await page.evaluate(geometry)
    const tag = `${engine} geom ?${qs}`
    for (const [s, h] of Object.entries(g.heights)) {
      ok(near(h.seg, h.input, 0.5), `${tag}: caja segmented ${s} ${h.seg} ≠ GInput ${h.input}`)
      ok(near(h.inl, h.input, 0.5), `${tag}: caja inline ${s} ${h.inl} ≠ GInput ${h.input}`)
      ok(near(h.segOpt, h.input, 0.5), `${tag}: segmento ${s} ${h.segOpt} no ocupa el alto de la caja ${h.input}`)
    }
    for (const [r, row] of Object.entries(g.rows)) for (const [line, kids] of Object.entries(row.byLine)) {
      if (kids.length < 2) continue
      ok(kids.every((k) => near(k.top, kids[0].top, 1)), `${tag}: fila ${r} línea ${line} tops ${JSON.stringify(kids)}`)
    }
    ok(g.rows.a.lines === '1', `${tag}: la fila a no cabe en una línea a 1280 (${g.rows.a.lines})`)
    ok(g.rows.c.compactH.every((h) => near(h, g.rows.c.compactH[0], 0.5)), `${tag}: fila compacta alturas ${g.rows.c.compactH}`)
    for (const t of g.targets) ok(t.w >= 24 - 0.01 && t.h >= 24 - 0.01, `${tag}: opción ${t.id} ${t.w}×${t.h} < 24`)
    ok(!g.clipped.length, `${tag}: textos recortados ${g.clipped.join(' | ')}`)
    for (const [c, e] of Object.entries(g.equal)) {
      if (!e.stacked) {
        ok(e.widths.every((w) => near(w, e.widths[0], 1)), `${tag}: ${c} segmentos desiguales ${e.widths}`)
        ok(e.tops.every((t) => near(t, e.tops[0], 0.5)), `${tag}: ${c} no está en una línea`)
        ok(e.natural <= e.box + 0.5, `${tag}: ${c} en una línea sin caber (natural ${e.natural} > ${e.box})`)
      } else {
        ok(e.natural > e.box + 0.5, `${tag}: ${c} apilado sin necesidad (natural ${e.natural} ≤ ${e.box})`)
        ok(e.lefts.every((l) => near(l, e.lefts[0], 0.5)) && e.tops.every((t, i) => i === 0 || t > e.tops[i - 1]), `${tag}: ${c} apilado no es una columna en orden`)
      }
    }
    ok(g.equal['narrow-seg'].stacked, `${tag}: narrow-seg (4 opciones en 220px) no se apila`)
    ok(!g.equal['rowa-seg'].stacked && !g.equal['ap-segmented'].stacked, `${tag}: segmentado apilado a 1280`)
    ok(g.rtl.seg[0] > g.rtl.seg[1] && g.rtl.inline[0] > g.rtl.inline[1], `${tag}: RTL local ${JSON.stringify(g.rtl)}`)
    if (qs === 'rtl=1') { const e = g.equal['ap-segmented']; ok(e.lefts[0] > e.lefts[1], `${tag}: página RTL, el segmentado no empieza a la derecha`) }
    ok(g.overflow.doc <= g.overflow.vw, `${tag}: desborde ${JSON.stringify(g.overflow)}`)
  }

  /* 5b · Solo icono: el icono queda centrado en la opción (chip y segmentado, LTR y RTL, con y sin apilado) */
  for (const qs of ['', 'rtl=1', 'dark=1', 'audit=1', 'test=1']) {
    await go('?' + qs)
    const c = await page.evaluate(iconCentering)
    const tag = `${engine} solo icono ?${qs}`
    ok(c.length >= 20, `${tag}: solo ${c.length} opciones de solo icono`)
    for (const k of c) {
      ok(Math.abs(k.dx) <= 1 && Math.abs(k.dy) <= 1, `${tag}: icono descentrado en ${k.id} (dx ${k.dx}, dy ${k.dy}; opción ${k.w}, icono ${k.iw}, ${k.dir}${k.stacked ? ', apilado' : ''})`)
      ok(k.hidden, `${tag}: ${k.id} perdió el texto accesible`)
    }
    if (qs === '') {
      ok(c.some((k) => k.stacked) && c.some((k) => k.dir === 'rtl') && c.some((k) => !k.stacked && k.dir === 'ltr'), `${tag}: faltan casos apilado/RTL/LTR (${JSON.stringify(c.map((k) => [k.dir, k.stacked]))})`)
    }
  }

  /* 6 · Anchos de ventana: el componente real se apila y se desapila (ResizeObserver) en los dos sentidos */
  await go('')
  for (const w of [960, 720, 480, 360, 320, 480, 1280]) {
    await page.setViewportSize({ width: w, height: 900 })
    await page.evaluate(() => new Promise((r) => { let n = 6; const f = () => (--n ? requestAnimationFrame(f) : setTimeout(r, 30)); requestAnimationFrame(f) }))
    const g = await page.evaluate(geometry)
    const tag = `${engine} ${w}px (redimensionado)`
    for (const [r, row] of Object.entries(g.rows)) for (const [line, kids] of Object.entries(row.byLine)) if (kids.length > 1) ok(kids.every((k) => near(k.top, kids[0].top, 1)), `${tag}: fila ${r} línea ${line} ${JSON.stringify(kids)}`)
    ok(!g.clipped.length, `${tag}: recortes ${g.clipped.join(' | ')}`)
    ok(g.overflow.doc <= w, `${tag}: desborde ${JSON.stringify(g.overflow)}`)
    for (const t of g.targets) ok(t.w >= 24 - 0.01 && t.h >= 24 - 0.01, `${tag}: opción ${t.id} ${t.w}×${t.h}`)
    for (const [c, e] of Object.entries(g.equal)) if (e.stacked) ok(e.natural > e.box + 0.5, `${tag}: ${c} apilado sin necesidad (${e.natural} ≤ ${e.box})`); else ok(e.natural <= e.box + 0.5, `${tag}: ${c} en una línea sin caber (${e.natural} > ${e.box})`)
    if (g.equal['rowa-seg'].stacked) { const line = Object.values(g.rows.a.byLine).find((k) => k.some((x) => x.c === 'rowa-seg')); ok(line.length === 1, `${tag}: el segmentado de la fila a se apiló sin que la fila se partiera`) }
    if (w === 1280) ok(!Object.entries(g.equal).some(([c, e]) => !/^(narrow-seg|io-seg-stack(-rtl)?)$/.test(c) && e.stacked), `${tag}: al volver a 1280 queda algo apilado ${Object.entries(g.equal).filter(([, e]) => e.stacked).map(([c]) => c)}`)
  }
  await page.setViewportSize({ width: 1280, height: 900 })

  /* 7 · Movimiento reducido */
  for (const rm of ['no-preference', 'reduce']) {
    await page.emulateMedia({ reducedMotion: rm })
    await go('')
    const t = await page.evaluate(() => {
      const tr = (el) => { const cs = getComputedStyle(el); const p = cs.transitionProperty.split(',').map((s) => s.trim()); const d = cs.transitionDuration.split(',').map(parseFloat); return Object.fromEntries(p.map((x, i) => [x, d[i % d.length]])) }
      return { circle: tr(document.querySelector('[data-case="ap-list"] .g-radio-group__input')), seg: tr(document.querySelector('[data-case="ap-segmented"] .g-radio-group__option')), chip: tr(document.querySelector('[data-case="ap-chip"] .g-radio-group__option')) }
    })
    const tag = `${engine} reduced-motion=${rm}`
    if (rm === 'reduce') {
      ok(!t.circle['box-shadow'] && !t.circle.scale && !t.circle['outline-offset'], `${tag}: el círculo sigue con movimiento ${JSON.stringify(t.circle)}`)
      ok(t.circle['border-color'] > 0, `${tag}: el círculo perdió el fundido de color`)
      ok(t.seg['background-color'] > 0 && !t.seg.transform && !t.seg.translate, `${tag}: segmento ${JSON.stringify(t.seg)}`)
      ok(t.chip['background-color'] > 0, `${tag}: chip sin fundido de color`)
    } else {
      ok(t.circle['box-shadow'] > 0 && t.circle.scale > 0, `${tag}: el punto no crece ${JSON.stringify(t.circle)}`)
      ok(t.seg['background-color'] > 0 && !t.seg.transform && !t.seg.translate, `${tag}: el relleno del segmento se desliza ${JSON.stringify(t.seg)}`)
    }
    // Nada se anima al montar: ninguna animación CSS en el componente
    ok(await page.evaluate(() => [...document.querySelectorAll('.g-radio-group, .g-radio-group *')].every((e) => getComputedStyle(e).animationName === 'none')), `${tag}: hay animaciones al montar`)
  }
  if (engine === 'chromium') {
    for (const [rm, want] of [['reduce', false], ['no-preference', true]]) {
      await page.emulateMedia({ reducedMotion: rm })
      await go('')
      const b = await page.locator('[data-case="ap-list"] .g-radio-group__option').first().boundingBox()
      await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await page.mouse.down(); await page.waitForTimeout(400)
      const sc = await page.evaluate(() => getComputedStyle(document.querySelector('[data-case="ap-list"] .g-radio-group__input')).scale)
      await page.mouse.up()
      ok(want ? sc !== '1' && sc !== 'none' : sc === '1' || sc === 'none', `${engine} ${rm}: al pulsar scale ${sc}`)
    }
  }
  await page.emulateMedia({ reducedMotion: 'no-preference' })

  /* 8 · forced-colors (solo Chromium lo emula) */
  if (engine === 'chromium') {
    for (const qs of ['', 'dark=1', 'audit=1']) {
      await page.emulateMedia({ forcedColors: 'active' })
      await go('?' + qs)
      const fc = await page.evaluate(() => {
        const q = (c) => document.querySelector(`[data-case="${c}"]`)
        const opt = (c, checked) => [...q(c).querySelectorAll('.g-radio-group__option')].find((o) => o.querySelector('input').checked === checked)
        const cs = (el) => getComputedStyle(el)
        const segBox = getComputedStyle(q('ap-segmented').querySelector('.g-radio-group__options'), '::after')
        const listOn = q('ap-list').querySelector('input:checked'), listOff = q('ap-list').querySelector('input:not(:checked):not(:disabled)')
        return {
          seg: [cs(opt('ap-segmented', true)).backgroundColor, cs(opt('ap-segmented', false)).backgroundColor],
          segText: cs(opt('ap-segmented', true).querySelector('.g-radio-group__option-label')).color,
          chip: [cs(opt('ap-chip', true)).backgroundColor, cs(opt('ap-chip', false)).backgroundColor],
          frame: { st: segBox.outlineStyle, w: parseFloat(segBox.outlineWidth), c: segBox.outlineColor },
          list: [cs(listOn).backgroundColor + ' ' + cs(listOn).boxShadow + ' ' + cs(listOn).borderColor, cs(listOff).backgroundColor + ' ' + cs(listOff).boxShadow + ' ' + cs(listOff).borderColor],
          listOffBorder: { w: parseFloat(cs(listOff).borderTopWidth), st: cs(listOff).borderTopStyle },
          card: [parseFloat(cs(opt('ap-card', true)).borderTopWidth), parseFloat(cs(opt('ap-card', false)).borderTopWidth)],
          roSeg: { o: cs(opt('st-segmented-readonly', true)).outlineStyle, w: parseFloat(cs(opt('st-segmented-readonly', true)).outlineWidth) },
          io: cs(opt('io-seg', true)).backgroundColor !== cs(opt('io-seg', false)).backgroundColor,
          canvas: cs(document.body).backgroundColor
        }
      })
      const tag = `${engine} forced-colors ?${qs}`
      ok(fc.seg[0] !== fc.seg[1], `${tag}: segmento elegido igual al resto ${fc.seg}`)
      ok(fc.segText !== fc.seg[0], `${tag}: texto del segmento elegido sin contraste`)
      ok(fc.chip[0] !== fc.chip[1], `${tag}: chip elegido igual al resto`)
      ok(fc.frame.st === 'solid' && fc.frame.w >= 1 && fc.frame.c !== fc.canvas, `${tag}: marco del segmentado ${JSON.stringify(fc.frame)}`)
      ok(fc.list[0] !== fc.list[1], `${tag}: círculo elegido igual al resto`)
      ok(fc.listOffBorder.w >= 1 && fc.listOffBorder.st === 'solid', `${tag}: círculo sin borde ${JSON.stringify(fc.listOffBorder)}`)
      ok(fc.card[0] > fc.card[1], `${tag}: tarjeta elegida sin borde más grueso ${fc.card}`)
      ok(fc.roSeg.o === 'solid' && fc.roSeg.w >= 2, `${tag}: segmento elegido en solo lectura sin marca ${JSON.stringify(fc.roSeg)}`)
      ok(fc.io, `${tag}: segmento de solo icono elegido igual al resto`)
      // Foco sobre lo elegido (también en solo lectura): el anillo es Highlight, de otro color que lo que tiene a los
      // dos lados (relleno SelectedItem, halo, Canvas) y la marca de solo lectura sigue ahí
      for (const c of ['ap-segmented', 'ap-chip', 'st-segmented-readonly', 'st-chip-readonly', 'io-seg', 'ap-list', 'ap-card']) {
        await page.keyboard.press('Shift')
        const ff = await page.evaluate(async (c) => {
          const root = document.querySelector(`[data-case="${c}"]`)
          const app = [...root.classList].find((x) => x.startsWith('g-radio-group--appearance-')).slice(26)
          const i = root.querySelector('input:checked'); i.focus()
          await new Promise((r) => setTimeout(r, 400))
          const el = app === 'list' || app === 'inline' ? i : i.closest('.g-radio-group__option')
          const cs = getComputedStyle(el)
          const probe = document.createElement('i'); probe.style.color = 'Highlight'; document.body.append(probe); const hl = getComputedStyle(probe).color; probe.style.color = 'CanvasText'; const ct = getComputedStyle(probe).color; probe.remove()
          const off = parseFloat(cs.outlineOffset), w = parseFloat(cs.outlineWidth)
          const layers = [...cs.boxShadow.matchAll(/(rgba?\([^)]*\))\s+0px\s+0px\s+0px\s+([\d.]+)px\s+inset|inset\s+0px\s+0px\s+0px\s+([\d.]+)px\s+(rgba?\([^)]*\))/g)].map((m) => ({ c: m[1] || m[4], d: parseFloat(m[2] || m[3]) }))
          const bg = (n) => { for (; n; n = n.parentElement) { const b = getComputedStyle(n).backgroundColor; if (!/rgba\(\s*0,\s*0,\s*0,\s*0\s*\)|transparent/.test(b)) return b } return 'rgb(255, 255, 255)' }
          let adj
          if (off < 0) { const at = (x) => { const l = layers.find((y) => y.d > x); return l ? l.c : bg(el) }; adj = [at(-off - w - 0.5), at(-off + 0.5)] }
          else adj = [bg(el.parentElement), cs.backgroundColor === 'rgba(0, 0, 0, 0)' ? bg(el.parentElement) : cs.backgroundColor]
          return { st: cs.outlineStyle, w, color: cs.outlineColor, hl, adj, mark: layers.some((l) => l.c === ct) || cs.outlineColor === ct }
        }, c)
        ok(ff.st === 'solid' && ff.w >= 1.5 && ff.color === ff.hl, `${tag}: foco de ${c} ${JSON.stringify(ff)}`)
        ok(ff.adj.every((a) => a !== ff.color), `${tag}: el anillo de ${c} tiene el color de lo que lo rodea ${JSON.stringify(ff)}`)
        if (c.includes('readonly')) ok(ff.mark, `${tag}: con foco, ${c} pierde la marca de solo lectura ${JSON.stringify(ff)}`)
        await page.evaluate(() => document.activeElement && document.activeElement.blur())
      }
    }
    await page.emulateMedia({ forcedColors: 'none' })
  }

  /* 9 · Puntero grueso (Chromium: táctil y móvil) */
  if (engine === 'chromium') {
    for (const qs of ['', 'audit=1']) {
      const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })
      const p2 = await ctx.newPage(); watch(p2)
      await go('?' + qs, p2)
      ok(await p2.evaluate(() => matchMedia('(pointer: coarse)').matches), `${engine} táctil: pointer: coarse no se emula`)
      const g = await p2.evaluate(geometry)
      for (const t of g.targets) ok(t.w >= 44 - 0.01 && t.h >= 44 - 0.01, `${engine} táctil ?${qs}: opción ${t.id} ${t.w}×${t.h} < 44`)
      for (const [s, h] of Object.entries(g.heights)) ok((g.equal['seg-' + s].stacked || near(h.seg, h.input, 0.5)) && near(h.segOpt, h.input, 0.5) && near(h.inl, h.input, 0.5) && h.input >= 44 - 0.01, `${engine} táctil ?${qs}: cajas ${s} ${JSON.stringify(h)}`)
      for (const [r, row] of Object.entries(g.rows)) for (const [line, kids] of Object.entries(row.byLine)) if (kids.length > 1) ok(kids.every((k) => near(k.top, kids[0].top, 1)), `${engine} táctil ?${qs}: fila ${r} línea ${line}`)
      ok(g.overflow.doc <= 390, `${engine} táctil ?${qs}: desborde ${JSON.stringify(g.overflow)}`)
      ok(!g.clipped.length, `${engine} táctil ?${qs}: recortes ${g.clipped.join(' | ')}`)
      await ctx.close()
    }
  }

  /* 10 · Zoom 200 % (visor a la mitad con DPR 2: lo que ve el navegador con zoom 200 % en 1280) y escalas fraccionarias */
  for (const [vw, dpr, qs] of [[640, 2, ''], [640, 2, 'audit=1'], [640, 2, 'test=1'], [1000, 1.25, ''], [1000, 1.5, ''], [1000, 2, '']]) {
    const ctx = await browser.newContext({ viewport: { width: vw, height: 800 }, deviceScaleFactor: dpr })
    const p2 = await ctx.newPage(); watch(p2)
    await go('?' + qs, p2)
    const g = await p2.evaluate(geometry)
    const tag = `${engine} ${vw}px DPR ${dpr} ?${qs}`
    ok(!g.clipped.length, `${tag}: recortes ${g.clipped.join(' | ')}`)
    ok(g.overflow.doc <= vw, `${tag}: desborde ${JSON.stringify(g.overflow)}`)
    for (const t of g.targets) ok(t.w >= 24 - 0.01 && t.h >= 24 - 0.01, `${tag}: opción ${t.id} ${t.w}×${t.h}`)
    for (const [r, row] of Object.entries(g.rows)) for (const [line, kids] of Object.entries(row.byLine)) if (kids.length > 1) ok(kids.every((k) => near(k.top, kids[0].top, 1)), `${tag}: fila ${r} línea ${line}`)
    for (const [s, h] of Object.entries(g.heights)) ok(near(h.segOpt, h.input, 0.5) && near(h.inl, h.input, 0.5), `${tag}: cajas ${s} ${JSON.stringify(h)}`)
    for (const [c, e] of Object.entries(g.equal)) if (e.stacked) ok(e.natural > e.box + 0.5, `${tag}: ${c} apilado sin necesidad`); else ok(e.natural <= e.box + 0.5, `${tag}: ${c} en una línea sin caber`)
    const v = await p2.evaluate(() => ({ frame: parseFloat(getComputedStyle(document.querySelector('[data-case="ap-segmented"] .g-radio-group__options'), '::after').outlineWidth), circle: parseFloat(getComputedStyle(document.querySelector('[data-case="ap-list"] .g-radio-group__input')).borderTopWidth) }))
    ok(v.frame * dpr >= 1 - 0.01 && v.circle * dpr >= 1 - 0.01, `${tag}: marco/borde < 1 píxel de dispositivo ${JSON.stringify(v)}`)
    await ctx.close()
  }

  /* 11 · GCheckbox tras #270: obligatoria = sin obligatoria salvo la marca; sin required nativo ni :invalid */
  await go('')
  const cb = await page.evaluate(() => {
    const pick = (id) => { const i = document.getElementById(id); const box = i.closest('.g-checkbox'); const cs = getComputedStyle(i); const r = i.getBoundingClientRect(); return { req: i.hasAttribute('required'), aria: i.getAttribute('aria-required'), invalid: i.matches(':invalid'), look: [cs.borderTopColor, cs.borderTopWidth, cs.borderTopStyle, cs.backgroundColor, cs.boxShadow, cs.outlineStyle, r.width, r.height].join('|'), rootH: box.getBoundingClientRect().height } }
    const a = document.querySelector('[data-case="cb-req"]'), b = document.querySelector('[data-case="cb-plain"]')
    const ia = (a.matches('input') ? a : a.querySelector('input')), ib = (b.matches('input') ? b : b.querySelector('input'))
    ia.id ||= 'cb-req-i'; ib.id ||= 'cb-plain-i'
    return { a: pick(ia.id), b: pick(ib.id), mark: !!document.querySelector('.g-checkbox__required') }
  })
  ok(!cb.a.req && cb.a.aria === 'true' && !cb.a.invalid, `${engine} GCheckbox #270: ${JSON.stringify(cb.a)}`)
  ok(cb.a.look === cb.b.look, `${engine} GCheckbox #270: la casilla obligatoria se ve distinta ${cb.a.look} ≠ ${cb.b.look}`)
  ok(cb.mark && near(cb.a.rootH, cb.b.rootH, 0.5), `${engine} GCheckbox #270: marca o alto (${cb.a.rootH} / ${cb.b.rootH})`)

  /* 12 · Playground: la fila real «Fecha · Sexo · ¿Primera consulta?» (#sec-form) y la sección #sec-radio */
  const pp = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  watch(pp)
  await pp.route('https://unpkg.com/vue@3/dist/vue.global.js', (r) => r.fulfill({ status: 200, contentType: 'text/javascript', body: VUE }))
  await pp.emulateMedia({ reducedMotion: 'reduce' })
  for (const theme of ['defecto', 'auditoría', 'oscuro', 'auditoría oscuro']) {
    await pp.goto(PLAY)
    await pp.waitForSelector('#sec-form .g-form-row[data-lines]')
    await pp.evaluate(() => document.fonts.ready)
    await pp.evaluate(([t, css]) => {
      if (t.includes('auditoría')) document.getElementById('theme').textContent = css
      if (t.includes('oscuro')) document.documentElement.dataset.theme = 'dark'
    }, [theme, AUDIT_CSS])
    await pp.locator('#sec-form').scrollIntoViewIfNeeded()
    for (const [state, long] of [[false, false], [true, true]]) {
      for (const w of ['1280', '960', '720', '480', '360', '320']) {
        await pp.selectOption('#fm-bench-w', w)
        await pp.locator('#fm-bench-state').setChecked(state)
        await pp.locator('#fm-bench-long').setChecked(long)
        await pp.evaluate(() => new Promise((r) => { let n = 6; const f = () => (--n ? requestAnimationFrame(f) : setTimeout(r, 30)); requestAnimationFrame(f) }))
        const r = await pp.evaluate(() => {
          const sexo = document.getElementById('fm-sexo'), row = sexo.closest('.g-form-row')
          const box = (el) => el.querySelector(':scope > .g-input__row, :scope > .g-datepicker__field, :scope > .g-radio-group__options').getBoundingClientRect()
          const kids = [...row.children]
          const clipped = [...row.querySelectorAll('.g-radio-group__option-label, .g-radio-group__label, .g-input__label, .g-datepicker__label')].filter((l) => l.scrollWidth > l.clientWidth + 1).map((l) => l.textContent)
          const opts = [...sexo.querySelectorAll('.g-radio-group__option')].map((o) => o.getBoundingClientRect())
          return { lines: row.dataset.lines, line: kids.map((k) => k.dataset.line), tops: kids.map((k) => +box(k).top.toFixed(2)), hs: kids.map((k) => +box(k).height.toFixed(2)), stacked: sexo.classList.contains('is-stacked'), clipped, opts: opts.map((o) => [+o.width.toFixed(1), +o.height.toFixed(1)]), rowW: row.getBoundingClientRect().width, over: kids.some((k) => box(k).right > row.getBoundingClientRect().right + 1 || box(k).left < row.getBoundingClientRect().left - 1) }
        })
        const tag = `${engine} playground ${theme} ${w}px${state ? ' con mensajes y etiquetas largas' : ''}`
        for (const l of new Set(r.line)) {
          const ts = r.tops.filter((_, i) => r.line[i] === l), hs = r.hs.filter((_, i) => r.line[i] === l)
          ok(Math.max(...ts) - Math.min(...ts) <= 1, `${tag}: línea ${l} tops ${ts}`)
          if (!r.stacked || r.line.filter((x) => x === r.line[1]).length > 1) ok(Math.max(...hs) - Math.min(...hs) <= 1, `${tag}: línea ${l} alturas ${hs}`)
        }
        const alone = r.line.filter((x) => x === r.line[1]).length === 1
        ok(!r.stacked || alone, `${tag}: Sexo apilado compartiendo línea ${JSON.stringify(r)}`)
        if (w === '1280') ok(r.lines === '1' && !r.stacked, `${tag}: a 1280 no está en una línea ${JSON.stringify(r)}`)
        ok(!r.clipped.length, `${tag}: recortes ${r.clipped}`)
        ok(!r.over, `${tag}: una caja sale de la fila`)
        ok(r.opts.every(([ow, oh]) => ow >= 24 && oh >= 24), `${tag}: opciones < 24 ${JSON.stringify(r.opts)}`)
      }
    }
    // Solo icono del playground («Vista», «Canal»): centrado en el tema
    {
      const c = await pp.evaluate((fn) => { document.querySelectorAll('#sec-radio .g-radio-group').forEach((g) => { g.dataset.case = g.id }); return new Function('return (' + fn + ')()')() }, iconCentering.toString())
      const mine = c.filter((k) => /^rg-icon/.test(k.id))
      ok(mine.length >= 6, `${engine} playground ${theme} solo icono: solo ${mine.length} opciones`)
      for (const k of mine) ok(Math.abs(k.dx) <= 1 && Math.abs(k.dy) <= 1, `${engine} playground ${theme} solo icono: ${k.id} descentrado (dx ${k.dx}, dy ${k.dy})`)
      await pp.evaluate(() => { document.documentElement.dir = 'rtl' })
      const r = (await pp.evaluate((fn) => new Function('return (' + fn + ')()')(), iconCentering.toString())).filter((k) => /^rg-icon/.test(k.id))
      for (const k of r) ok(Math.abs(k.dx) <= 1 && Math.abs(k.dy) <= 1, `${engine} playground ${theme} solo icono RTL: ${k.id} descentrado (dx ${k.dx}, dy ${k.dy})`)
      await pp.evaluate(() => { document.documentElement.dir = 'ltr' })
    }
    // #sec-radio en ese tema: contraste del marcado real del playground
    await pp.selectOption('#fm-bench-w', '')
    const m = await pp.evaluate(([fn]) => { document.querySelectorAll('#sec-radio .g-radio-group').forEach((g) => { g.dataset.case = g.id }); return new Function('return (' + fn + ')()')() }, [measure.toString()])
    for (const c of m) if (!(c.r < c.min && c.pair && near(c.r, c.pair, 0.05))) ok(c.r >= c.min, `${engine} playground ${theme} #sec-radio: ${c.k} ${c.r}:1 < ${c.min}`)
  }
  await pp.close()

  ok(!errors.length, `${engine} consola: ${[...new Set(errors)].slice(0, 6).join(' | ')}`)
  await browser.close()
}

server.close()
const cols = ['texto', 'circulo', 'punto', 'chip', 'marco', 'elegida', 'icono']
if (args.verbose) console.table(table)
else {
  const min = (k) => Math.min(...table.map((r) => r[k] ?? Infinity)).toFixed(2)
  const pick = (t) => table.find((r) => r.tag.endsWith(t))
  console.log('Contraste mínimo en reposo (texto · círculo · punto · chip · marco · trazo de la elegida · icono solo):')
  for (const t of ['defecto claro', 'defecto oscuro', 'auditoría claro', 'auditoría oscuro', 'prueba claro', 'spotify claro', 'spotify oscuro']) { const r = pick(t); if (r) console.log(`  ${t.padEnd(18)} ${cols.map((k) => r[k]).join(' · ')}`) }
  console.log(`  mínimo en ${table.length}    ${cols.map(min).join(' · ')}`)
  console.log('Contraste mínimo en hover (texto · controles):')
  for (const r of hoverTable) console.log(`  ${r.tag.padEnd(36)} ${r.texto} · ${r.control}`)
}
if (themeNotes.size) console.log('\nNotas del tema (par del propio tema por debajo; defecto del motor, no del componente):\n' + [...themeNotes].map((n) => '  · ' + n).join('\n'))
if (info.length) console.log(info.join('\n'))
console.log(`\n${total - failed}/${total} correctas`)
if (failed) { console.log(fails.slice(0, 80).map((f) => '  ✗ ' + f).join('\n')); if (fails.length > 80) console.log(`  … y ${fails.length - 80} más`); process.exitCode = 1 }
