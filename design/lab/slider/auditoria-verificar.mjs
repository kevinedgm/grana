// Auditoría de coco (paso 5) de GSlider sobre el COMPONENTE REAL: design/lab/slider/auditoria-banco.html con GSlider de
// dist/slider.umd.js (entrada propia @grana/vue/slider, global GranaSlider), los vecinos reales de dist/grana.umd.js y
// dist/grana.css + dist/fonts.css. Repite la batería de estilo-verificar.mjs sobre el real y añade lo que solo existe con
// él: marcado real frente al que espera el CSS, CSS publicado (capa y orden), contraste en 28 configuraciones (defecto,
// auditoría, propio y los once de dark-color-presence/generated, claro y oscuro), alto del área = caja de GInput también
// con un tema de espacio pequeño y texto grande y con el texto al 200 %, fila real de 1280 a 320, mínimo publicado (#453)
// con barrido de 1px y bloqueo (#266), anillo por la regla de modalidad real (utils/keyFocus.js, #450) también desde
// GErrorSummary, movimiento (nada al montar, salto, arrastre, tope también con un valor fuera de límites, fusión, I2 de
// GForm) y movimiento reducido, teclear la cifra, forced-colors (Chromium), táctil (Chromium y WebKit), zoom aproximado y
// consola limpia.
// Ejecutar desde la raíz del repo:  GRANA_PW_PORT=4212 node design/lab/slider/auditoria-verificar.mjs
// Opcional: GRANA_DIST=<copia de dist/>  --engines=chromium,firefox,webkit  --verbose  --only=1,2,…
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
    const p = DIST && path.startsWith('/packages/vue/dist/') ? join(DIST, path.slice('/packages/vue/dist/'.length)) : normalize(join(ROOT, path))
    if (!DIST && !p.startsWith(ROOT)) throw new Error('fuera')
    const body = await readFile(p)
    res.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream' }).end(body)
  } catch { res.writeHead(404).end() }
})
await new Promise((r) => server.listen(Number(process.env.GRANA_PW_PORT) || 4212, '127.0.0.1', r))
const BASE = `http://127.0.0.1:${server.address().port}/design/lab/slider/auditoria-banco.html`

let total = 0, failed = 0
const fails = [], notes = []
const counts = {}
const ok = (cond, msg, eng = 'estático') => { total++; counts[eng] = counts[eng] || [0, 0]; counts[eng][1]++; if (cond) counts[eng][0]++; else { failed++; fails.push(msg) } }
const near = (a, b, t = 0.5) => Math.abs(a - b) <= t

/* ---------- 0 · Análisis estático del CSS fuente y del publicado ---------- */
if (run(0)) {
  const raw = await readFile(join(ROOT, 'packages/vue/src/components/GSlider/GSlider.css'), 'utf8')
  const css = raw.replace(/\/\*[\s\S]*?\*\//g, '')
  ok(!/#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|lab|lch|color-mix)\(/.test(css), 'CSS: color literal')
  ok(!/var\(\s*--[\w-]+\s*,/.test(css), 'CSS: var() con valor de respaldo')
  ok(!/@layer|@property|!important/.test(css), 'CSS: @layer, @property o !important')
  const vars = [...css.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1])
  ok(vars.every((v) => v.startsWith('--g-') || v.startsWith('--_')), 'CSS: var() que no es --g-* ni --_*')
  const defaults = await readFile(join(ROOT, 'packages/vue/src/styles/defaults.css'), 'utf8')
  const defined = new Set([...defaults.matchAll(/(--g-[a-z0-9-]+)\s*:/g)].map((m) => m[1]))
  const missing = [...new Set(vars.filter((v) => v.startsWith('--g-') && !defined.has(v)))]
  ok(!missing.length, 'CSS: tokens que no existen en defaults.css ' + missing)
  ok(!/--g-color-(on-)?brand(?![a-z])/.test(css), 'CSS: lee brand en vez del rol primary (tokens.md §17.2)')
  const own = new Set([...css.matchAll(/(--_[\w-]+)\s*:/g)].map((m) => m[1]))
  const fromVue = ['--_at', '--_from', '--_to', '--_mid', '--_pill-w']
  ok(![...new Set(vars.filter((v) => v.startsWith('--_') && !own.has(v) && !fromVue.includes(v)))].length, 'CSS: alias --_* que ni declara ni recibe del .vue')
  ok(!/--g-[\w-]+\s*:/.test(css), 'CSS: declara un token del tema')
  const px = [...css.matchAll(/(-?\d*\.?\d+)px/g)].map((m) => m[0])
  ok(px.every((p) => ['24px', '44px', '1px', '-1px'].includes(p)), 'CSS: medidas literales no permitidas ' + px)
  const onePx = css.split('\n').filter((l) => /\b-?1px\b/.test(l)).map((l) => l.trim())
  ok(onePx.every((l) => /^(inline-size|block-size|margin): -?1px;$/.test(l)), 'CSS: 1px fuera del texto oculto')
  const ems = [...css.matchAll(/(-?\d*\.?\d+)(em|rem|ch|vw|vh)\b/g)].map((m) => m[0])
  ok(ems.every((e) => e === '-0.125em'), 'CSS: medidas relativas literales ' + ems)
  const nums = [...css.matchAll(/\*\s*(-?\d*\.?\d+)\b(?!px|ms|%)/g)].map((m) => m[1])
  ok(nums.every((n) => ['-1', '1', '2', '3', '7', '9', '0.5', '-0.5', '0.75', '0.25', '1.5'].includes(n)), 'CSS: factores fuera de la lista ' + nums)
  const kf = [...css.matchAll(/@keyframes\s+([\w-]+)/g)].map((m) => m[1])
  ok(kf.sort().join() === 'g-reject-shake-slider,g-slider-bump-down,g-slider-bump-up', 'CSS: keyframes ' + kf)
  ok(!/ease-spring|ease-bounce|cubic-bezier|steps\(/.test(css), 'CSS: muelle, rebote o curva propia (#452)')
  ok(!/:focus-visible/.test(css) && /:where\(\[data-g-key-focus\]\):focus/.test(css), 'CSS: anillo con :focus-visible o sin [data-g-key-focus] (#450)')
  const sel = css.replace(/\{[^}]*\}/g, '{}').replace(/\.g-slider__pill-ref > span/g, '')
  ok(!/>\s*\*|>\s*(span|div|input|label|p)\b|:(first|last|nth)-child/.test(sel), 'CSS: selector de hijos por estructura (#383)')
  // Solo lectura (hallazgo 1): contorno border-control en trazo discontinuo, relleno neutral-soft, como GInput
  ok(/\.g-slider\.is-readonly \.g-slider__thumb\s*\{[^}]*--_pill-edge: var\(--g-color-border-control\)[^}]*\}/.test(css) && /\.g-slider\.is-readonly \.g-slider__pill\s*\{\s*border-style: dashed;\s*\}/.test(css) && !/border-strong\);\s*\n?\s*--_pill-shadow/.test(css), 'CSS: solo lectura sin border-control discontinuo (hallazgo 1)')
  // Área y píldora crecen con su texto como la caja de GInput (hallazgo 2)
  ok(/--_text-box: calc\(var\(--g-text-body-sm-line\) \+ var\(--g-border-width\) \* 2\)/.test(css) && (css.match(/var\(--_text-box\)\)/g) || []).length === 3, 'CSS: área/píldora sin el alto de su texto (hallazgo 2)')
  // Publicado
  const dcss = await readFile(join(DISTDIR, 'grana.css'), 'utf8')
  const djs = await readFile(join(DISTDIR, 'grana.js'), 'utf8')
  const sjs = await readFile(join(DISTDIR, 'slider.js'), 'utf8')
  const layerAt = dcss.indexOf('@layer grana.components')
  const pillAt = dcss.indexOf('.g-slider__pill')
  ok(layerAt >= 0 && pillAt > layerAt, 'dist: GSlider fuera de @layer grana.components')
  ok(dcss.indexOf('.g-input__control') < pillAt, 'dist: GSlider antes que GInput')
  ok(/g-slider\.is-readonly \.g-slider__pill\s*\{\s*border-style:\s*dashed/.test(dcss) && /--_text-box/.test(dcss), 'dist: grana.css sin los arreglos de la auditoría (reconstruir)')
  ok(!/GSlider/.test(djs) && /GSlider/.test(sjs) && !/g-slider__pill\s*\{/.test(sjs), 'dist: GSlider en grana.js o CSS en slider.js')
  const kfd = [...dcss.matchAll(/@keyframes\s+(g-slider[\w-]*|g-reject-shake-slider)/g)].map((m) => m[1])
  ok(kfd.length === 3, 'dist: keyframes del deslizador ' + kfd)
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
  const col = (v, host = document.body) => { const i = document.createElement('i'); i.style.color = v; host.append(i); const c = parse(getComputedStyle(i).color); i.remove(); return c }
  const R = (el) => el.getBoundingClientRect()
  const S = (c) => document.querySelector(`.g-slider[data-case="${c}"]`)
  const raf2 = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
  return { parse, over, bgOf, ratio, col, R, S, raf2 }
}

// Marcado real frente al que espera el CSS (contrato «Estructura accesible» y «Clases y datos»)
const markup = () => {
  const bad = []
  const kids = (el) => [...el.children]
  const has = (el, c) => el.classList.contains(c)
  for (const root of document.querySelectorAll('.g-slider')) {
    const id = root.dataset.case
    const b = (m) => bad.push(`${id}: ${m}`)
    const cls = [...root.classList]
    if (!cls.some((c) => /^g-slider--color-(brand|accent|neutral|success|warning|danger|info)$/.test(c))) b('sin g-slider--color-*')
    if (!cls.some((c) => /^g-slider--density-(default|comfortable|compact)$/.test(c))) b('sin g-slider--density-*')
    if (!has(root, 'is-ready')) b('sin is-ready')
    const range = has(root, 'g-slider--range'), empty = has(root, 'is-empty')
    const [head, row, support, ...rest] = kids(root)
    if (rest.length || !head || !has(head, 'g-slider__head') || !has(row, 'g-slider__row') || !has(support, 'g-slider__support')) { b('raíz sin cabecera · fila · pie'); continue }
    if (!!head.querySelector('.g-slider__value') !== empty) b('__value fuera de is-empty')
    const rk = kids(row)
    const area = rk[0]
    if (!has(area, 'g-slider__area')) b('la fila no empieza por __area')
    const marks = row.querySelector(':scope > .g-slider__marks')
    if (marks && rk.indexOf(marks) !== 1) b('__marks no va detrás de __area')
    const hidden = rk.filter((k) => k.matches('input[type="hidden"]'))
    if (hidden.length !== (range ? 2 : 1)) b(`ocultos ${hidden.length}`)
    if (range && row.getAttribute('role') !== 'group') b('rango sin role="group"')
    const ak = kids(area)
    if (!has(ak[0], 'g-slider__track')) b('el área no empieza por __track')
    const fill = area.querySelector(':scope > .g-slider__fill')
    if (!!fill === empty) b('__fill con is-empty o sin él')
    if (fill && !(fill.style.getPropertyValue('--_from') !== '' && fill.style.getPropertyValue('--_to') !== '' && fill.style.length === 2)) b(`__fill estilo «${fill.getAttribute('style')}»`)
    const thumbs = area.querySelectorAll(':scope > .g-slider__thumb')
    if (thumbs.length !== (range ? 2 : 1)) b(`asas ${thumbs.length}`)
    thumbs.forEach((t, i) => {
      if (t.dataset.thumb !== String(i)) b(`data-thumb ${t.dataset.thumb}`)
      const st = t.getAttribute('style') || ''
      if (empty ? st !== '' : !(t.style.getPropertyValue('--_at') !== '' && t.style.length === 1)) b(`asa ${i} estilo «${st}»`)
      const pill = t.querySelector(':scope > .g-slider__pill'), nat = t.querySelector(':scope > .g-slider__native')
      if (!!pill === empty) b(`asa ${i}: píldora con is-empty o sin ella`)
      if (pill) {
        if (pill.getAttribute('aria-hidden') !== 'true') b('píldora sin aria-hidden')
        const [txt, ref] = kids(pill)
        if (!txt || !has(txt, 'g-slider__pill-text') || !ref || !has(ref, 'g-slider__pill-ref') || kids(pill).length !== 2) b('píldora sin texto + referencias')
        else {
          if (txt.getAttribute('dir') !== 'auto') b('texto de la píldora sin dir=auto')
          if (!t.classList.contains('is-typing') && ![...ref.children].some((s) => s.textContent === txt.textContent)) b(`la referencia no incluye el texto actual «${txt.textContent}»`)
          if (!kids(ref).every((s) => s.tagName === 'SPAN')) b('referencias que no son span')
        }
      }
      if (!nat || nat.type !== 'range' || nat.getAttribute('step') !== 'any' || nat.hasAttribute('name') || nat.hasAttribute('aria-required') || nat.required) b(`nativo ${i} ${nat && nat.outerHTML.slice(0, 120)}`)
      else {
        const cs = getComputedStyle(nat)
        if (cs.opacity !== '0' || cs.pointerEvents !== 'none' || cs.position !== 'absolute') b(`nativo ${i}: visible o con puntero`)
        if (!nat.getAttribute('aria-valuetext')) b(`nativo ${i} sin aria-valuetext`)
        for (const ref of (nat.getAttribute('aria-describedby') || '').split(' ').filter(Boolean)) if (!document.getElementById(ref)) b(`aria-describedby a ${ref} inexistente`)
        // Lo que se ve es lo que se oye (B1): sin marca con nombre ni valueText, el texto de la píldora = aria-valuetext
        if (pill && !t.classList.contains('is-typing') && !root.querySelector('.g-slider__mark.has-label')) {
          const txt = pill.querySelector('.g-slider__pill-text').textContent
          if (txt !== nat.getAttribute('aria-valuetext')) b(`píldora «${txt}» ≠ aria-valuetext «${nat.getAttribute('aria-valuetext')}»`)
        }
      }
      if (range !== !!t.querySelector(':scope > .g-slider__thumb-name[hidden]')) b(`asa ${i}: __thumb-name`)
    })
    const rs = root.style
    // --_form-row-* los escribe GFormRow en sus hijos (form.md §4), no el .vue
    for (let k = 0; k < rs.length; k++) if (!['--_pill-w', '--_mid', '--_form-row-column', '--_form-row-line'].includes(rs[k])) b(`raíz con estilo ${rs[k]}`)
    if (!empty && !(parseFloat(rs.getPropertyValue('--_pill-w')) > 0)) b('--_pill-w sin medir')
    if (has(root, 'is-merged') !== (rs.getPropertyValue('--_mid') !== '')) b('is-merged sin --_mid o al revés')
    if (marks) {
      if (marks.getAttribute('aria-hidden') !== 'true') b('__marks sin aria-hidden')
      for (const m of marks.children) {
        if (!has(m, 'g-slider__mark') || m.style.length !== 1 || m.dataset.value === undefined) b(`marca ${m.outerHTML.slice(0, 80)}`)
        if (!!m.querySelector('.g-slider__mark-label') !== has(m, 'has-label')) b('has-label sin nombre o al revés')
      }
    }
    const msg = support.querySelector(':scope > .g-slider__message')
    if (!msg || !msg.hasAttribute('aria-live')) b('mensaje sin región viva')
    const icon = msg && msg.querySelector('svg')
    if (msg && msg.textContent.trim() && !(icon && icon.classList.contains('g-slider__message-icon'))) b('mensaje sin g-slider__message-icon')
    if (has(root, 'is-warning') && !root.querySelector('.g-slider__message').textContent.trim()) b('is-warning sin mensaje')
    if (root.querySelector('.g-slider__thumb.is-typing')) b('is-typing en reposo')
    if (root.hasAttribute('data-bump') || has(root, 'is-jumping') || has(root, 'is-dragging')) b('estado de gesto en reposo')
  }
  return bad
}

// Contraste: por raíz no deshabilitada; los pares se leen de lo pintado y de los tokens del tema
const contrast = () => {
  const { parse, over, bgOf, ratio, col } = window.__lib
  const out = []
  const surf = { surface: col('var(--g-color-surface)'), bg: col('var(--g-color-bg)'), sunken: col('var(--g-color-surface-sunken)') }
  const vs3 = (k, c, min = 3) => { for (const [n, b] of Object.entries(surf)) out.push({ k: `${k} / ${n}`, r: ratio(over(c, b), b), min }) }
  vs3('anillo de foco', col('var(--g-color-focus)'))
  for (const root of document.querySelectorAll('.g-slider')) {
    if (root.classList.contains('is-disabled')) continue
    const id = root.dataset.case
    const fam = [...root.classList].find((c) => c.startsWith('g-slider--color-')).slice(16)
    const host = bgOf(root)
    const ro = root.classList.contains('is-readonly')
    const track = root.querySelector('.g-slider__track')
    if (!root.classList.contains('is-empty')) vs3(`${id} riel`, parse(getComputedStyle(track).backgroundColor))
    const fill = root.querySelector('.g-slider__fill')
    if (fill) vs3(`${id} tramo (${fam})${ro ? ' solo lectura' : ''}`, parse(getComputedStyle(fill).backgroundColor))
    if (fill && !ro) out.push({ k: `${id} tramo/riel (${fam})`, r: ratio(over(parse(getComputedStyle(fill).backgroundColor), host), over(parse(getComputedStyle(track).backgroundColor), host)), min: 0, info: true })
    for (const pill of root.querySelectorAll('.g-slider__pill')) {
      const cs = getComputedStyle(pill)
      const bg = over(parse(cs.backgroundColor), host)
      const typing = pill.parentElement.classList.contains('is-typing')
      const kind = typing ? 'tecleando' : ro ? 'solo lectura' : root.classList.contains('is-invalid') ? 'error' : fam
      out.push({ k: `${id} píldora texto (${kind})`, r: ratio(over(parse(cs.color), bg), bg), min: 4.5 })
      vs3(`${id} píldora contorno (${kind})`, parse(cs.borderTopColor))
    }
    if (!ro && root.querySelector('.g-slider__pill')) {
      const st = getComputedStyle(root)
      out.push({ k: `${id} píldora al pasar (${fam})`, r: ratio(col(st.getPropertyValue('--_on')), col(st.getPropertyValue('--_c-strong'))), min: 4.5 })
      if (root.classList.contains('is-merged')) out.push({ k: `${id} raya de la cápsula (${fam})`, r: ratio(col(st.getPropertyValue('--_on')), col(st.getPropertyValue('--_c'))), min: 0, info: true })
    }
    for (const t of root.querySelectorAll('.g-slider__mark-label, .g-slider__value, .g-slider__hint, .g-slider__label, .g-slider__message')) {
      if (!t.textContent.trim()) continue
      out.push({ k: `${id} ${t.className.split(' ')[0].slice(10)}`, r: ratio(over(parse(getComputedStyle(t).color), host), host), min: 4.5 })
    }
    if (root.classList.contains('is-empty')) {
      const m = getComputedStyle(track).backgroundImage.match(/rgba?\([^)]+\)|color\(srgb [^)]+\)/)
      if (m) vs3(`${id} trazos${root.classList.contains('is-invalid') ? ' con error' : ''}`, parse(m[0]))
    }
  }
  return out
}

// Geometría de un caso
const geo = (c) => {
  const { R, S } = window.__lib
  const root = S(c)
  const a = R(root.querySelector('.g-slider__area'))
  const track = R(root.querySelector('.g-slider__track'))
  const fillEl = root.querySelector('.g-slider__fill')
  const thumbs = [...root.querySelectorAll('.g-slider__thumb')]
  const pills = thumbs.map((t) => t.querySelector('.g-slider__pill')).filter(Boolean)
  const cs = (el, p) => getComputedStyle(el, p)
  return {
    pw: parseFloat(root.style.getPropertyValue('--_pill-w')), rtl: cs(root).direction === 'rtl', merged: root.classList.contains('is-merged'),
    area: { l: a.left, r: a.right, t: a.top, b: a.bottom, w: a.width, h: a.height, cy: (a.top + a.bottom) / 2 },
    trackCy: (track.top + track.bottom) / 2, trackH: track.height, fillCy: fillEl ? (R(fillEl).top + R(fillEl).bottom) / 2 : null, fillH: fillEl ? R(fillEl).height : null,
    fill: fillEl ? (({ left, right }) => ({ l: left, r: right }))(R(fillEl)) : null,
    pills: pills.map((p) => { const r = R(p), s = cs(p), tx = R(p.querySelector('.g-slider__pill-text')); return { l: r.left, r: r.right, w: r.width, h: r.height, cx: (r.left + r.right) / 2, cy: (r.top + r.bottom) / 2, bw: parseFloat(s.borderTopWidth), rad: [s.borderTopLeftRadius, s.borderTopRightRadius, s.borderBottomRightRadius, s.borderBottomLeftRadius].map(parseFloat), bg: s.backgroundColor, text: { l: tx.left, r: tx.right, t: tx.top, b: tx.bottom }, top: r.top, bot: r.bottom, txt: p.querySelector('.g-slider__pill-text').textContent } }),
    natives: thumbs.map((t) => { const n = t.querySelector('.g-slider__native'); const r = R(n); return { w: r.width, h: r.height, op: cs(n).opacity, pe: cs(n).pointerEvents } }),
    hit: thumbs.map((t) => { const s = cs(t, '::after'); return { w: parseFloat(s.width), h: parseFloat(s.height), content: s.content } }),
    thumbs: thumbs.map((t) => { const r = R(t); return { l: r.left, r: r.right, t: r.top, b: r.bottom, h: r.height } }),
    marks: [...root.querySelectorAll('.g-slider__mark')].map((m) => { const l = m.querySelector('.g-slider__mark-label'), tick = cs(m, '::before'); const mr = R(m); return { v: Number(m.dataset.value), x: mr.left, tickW: parseFloat(tick.width), label: l ? (({ left, right }) => ({ l: left, r: right, cx: (left + right) / 2 }))(R(l)) : null } }),
    marksBox: root.querySelector('.g-slider__marks') ? (({ left, right }) => ({ l: left, r: right }))(R(root.querySelector('.g-slider__marks'))) : null,
    space: parseFloat(cs(document.documentElement).getPropertyValue('--g-space-1')),
    bwTok: parseFloat(cs(document.documentElement).getPropertyValue('--g-border-width')),
    lh: parseFloat(cs(root.querySelector('.g-slider__label') || root).lineHeight)
  }
}

// Filas reales: cajas por línea (raíces con el mismo top)
const rowsOf = () => [...document.querySelectorAll('.g-form-row')].map((row) => {
  const items = [...row.children].filter((k) => k.matches('.g-slider, .g-input, .g-select'))
  const box = (k) => k.querySelector('.g-slider__area, .g-input__control, .g-select__control')
  const lines = {}
  for (const k of items) { const r = box(k).getBoundingClientRect(); (lines[Math.round(k.getBoundingClientRect().top)] ??= []).push({ c: k.dataset.case || k.querySelector('input')?.id || k.className.split(' ')[0], cy: +((r.top + r.bottom) / 2).toFixed(2), h: +r.height.toFixed(2) }) }
  return { row: row.dataset.row || row.id, lines: Object.values(lines) }
})

// Píldoras y nombres dentro del riel; nombres de marcas sin solaparse (solo en filas, donde el mínimo publicado los cuida)
const inside = () => {
  const out = [], overlap = []
  for (const r of document.querySelectorAll('.g-slider')) {
    const a = r.querySelector('.g-slider__area').getBoundingClientRect()
    if ([...r.querySelectorAll('.g-slider__pill, .g-slider__mark-label')].some((p) => { const b = p.getBoundingClientRect(); return b.left < a.left - 0.5 || b.right > a.right + 0.5 })) out.push(r.dataset.case)
    const ls = [...r.querySelectorAll('.g-slider__mark-label')].map((l) => l.getBoundingClientRect()).sort((x, y) => x.left - y.left)
    const gap = Math.min(...ls.map((l, i) => (i ? l.left - ls[i - 1].right : Infinity)))
    if (r.closest('.g-form-row') && gap < -0.5) overlap.push(`${r.dataset.case} (${gap.toFixed(1)}px)`)
  }
  return { out, overlap }
}

// Barrido del mínimo publicado (#453): el mínimo esperado se calcula aquí aparte, por posiciones
const SWEEP = async ([rowId, hi, lo]) => {
  const { raf2 } = window.__lib
  const host = document.getElementById('mn-host'), row = document.getElementById(rowId)
  const [sl, other] = [...row.children]
  const one = () => Math.abs(sl.getBoundingClientRect().top - other.getBoundingClientRect().top) < 2
  const at = async (w) => { host.style.inlineSize = w + 'px'; await raf2(); await raf2(); await raf2() }
  const space = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--g-space-1'))
  let last = null
  // Grueso de 16 en 16 hasta que se parte; luego fino de 1px desde el último ancho de una línea
  let start = hi
  for (let w = hi; w >= lo; w -= 16) { await at(w); if (!one()) break; start = w }
  for (let w = start; w >= lo; w--) {
    await at(w)
    if (!one()) break
    const pills = [...sl.querySelectorAll('.g-slider__pill')].map((p) => p.getBoundingClientRect().width)
    const labels = [...sl.querySelectorAll('.g-slider__mark-label')].map((l) => l.getBoundingClientRect())
    const range = sl.classList.contains('g-slider--range')
    // #509: el menor ancho C en que cada par de nombres vecinos por valor deja space × 2, con cada nombre centrado en la
    // píldora de su valor (x = p/2 + f · (C − p)) y ajustado al borde como en el CSS; se publica el entero por encima + 0,5
    // de la tolerancia de GFormRow, redondeado hacia arriba. Calculado aquí aparte, por bisección de 0,01px
    const pillW = Math.max(...pills)
    const named = [...new Map([...sl.querySelectorAll('.g-slider__mark-label')].map((l) => [parseFloat(l.parentElement.style.getPropertyValue('--_at')), l.getBoundingClientRect().width])).entries()].filter(([f]) => Number.isFinite(f)).sort((x, y) => x[0] - y[0])
    const fitsAt = (C) => { let pr = -Infinity; for (const [f, w] of named) { const left = Math.min(Math.max(pillW / 2 + f * (C - pillW) - w / 2, 0), C - w); if (left - pr < space * 2 - 0.01) return false; pr = left + w } return true }
    let marksMin = 0
    if (named.length) {
      let lo = Math.max(pillW, ...named.map(([, w]) => w)), hi = lo * 2 + space * 2 * named.length
      while (!fitsAt(hi)) hi *= 2
      if (fitsAt(lo)) hi = lo
      else while (hi - lo > 0.01) { const m = (lo + hi) / 2; if (fitsAt(m)) hi = m; else lo = m }
      marksMin = hi
    }
    const marks = marksMin ? Math.ceil(marksMin - 0.001) + 0.5 : 0
    const expected = Math.ceil(Math.max(space * 40, (range ? 4 : 3) * pillW, marks) - 0.001)
    const a = sl.querySelector('.g-slider__area').getBoundingClientRect()
    const sorted = labels.slice().sort((x, y) => x.left - y.left)
    last = { w, expected, sl: +sl.getBoundingClientRect().width.toFixed(2), other: +other.getBoundingClientRect().width.toFixed(2), parts: { space: space * 40, pills: +((range ? 4 : 3) * Math.max(...pills)).toFixed(2), marks: +marks.toFixed(2) },
      gap: sorted.length ? +Math.min(...sorted.map((l, i) => (i ? l.left - sorted[i - 1].right : Infinity))).toFixed(2) : null, out: [...sl.querySelectorAll('.g-slider__pill, .g-slider__mark-label')].some((p) => { const b = p.getBoundingClientRect(); return b.left < a.left - 0.5 || b.right > a.right + 0.5 }),
      merged: sl.classList.contains('is-merged') }
  }
  const res = { last }
  if (last) {
    await at(last.w)
    const snap = () => ({ one: one(), w: +sl.getBoundingClientRect().width.toFixed(2), h: +sl.querySelector('.g-slider__area').getBoundingClientRect().height.toFixed(2), pw: sl.style.getPropertyValue('--_pill-w'), ro: sl.classList.contains('is-readonly') })
    const a = snap(); window.__lock.value = true; await raf2(); await raf2(); await raf2()
    const b = snap(); window.__lock.value = false; await raf2(); await raf2(); await raf2()
    res.lock = { a, b, c: snap() }
  }
  host.style.inlineSize = ''
  return res
}

const THEMES = [['defecto', ''], ['auditoria', 'theme=auditoria'], ['propio', 'theme=propio'], ...['amazon', 'apple', 'caracol-purpura', 'github', 'grana', 'linear', 'lustre', 'medium', 'notion', 'spotify', 'stripe'].map((n) => [n, 'theme=' + n])]
const summary = {}

for (const engine of ENGINES) {
  const browser = await pw[engine].launch()
  const tag = (s) => `[${engine}] ${s}`
  const OK = (c, m) => ok(c, tag(m), engine)
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await ctx.newPage()
  const errors = []
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()) })
  page.on('pageerror', (e) => errors.push(e.message))
  const go = async (qs = '') => {
    for (let k = 0; k < 3; k++) {
      try { await page.goto(BASE + (qs ? '?' + qs.replace(/^\?/, '') : ''), { timeout: 60000 }); await page.waitForSelector('html[data-ready]', { timeout: 60000 }); break } catch (e) { if (k === 2) throw e }
    }
    await page.evaluate(`window.__lib = (${lib})()`)
  }
  const pillPoint = (c, i = 0) => page.evaluate(([c, i]) => { window.__lib.S(c).scrollIntoView({ block: 'center' }); const r = window.__lib.S(c).querySelectorAll('.g-slider__pill')[i].getBoundingClientRect(); return { x: (r.left + r.right) / 2, y: (r.top + r.bottom) / 2 } }, [c, i])
  const railPoint = (c, f) => page.evaluate(([c, f]) => { const r = window.__lib.S(c); r.scrollIntoView({ block: 'center' }); const a = r.querySelector('.g-slider__area').getBoundingClientRect(); const pw = parseFloat(r.style.getPropertyValue('--_pill-w')); const x = getComputedStyle(r).direction === 'rtl' ? a.right - (pw / 2 + f * (a.width - pw)) : a.left + pw / 2 + f * (a.width - pw); return { x, y: (a.top + a.bottom) / 2 } }, [c, f])
  const focusCase = (c, i = 0) => page.evaluate(([c, i]) => { const n = window.__lib.S(c).querySelectorAll('.g-slider__native')[i]; n.scrollIntoView({ block: 'center' }); n.focus() }, [c, i])

  /* 1 · Marcado real y contraste en 28 configuraciones (con «35» a medio teclear en s-typing) */
  if (run(1)) {
    const worst = {}
    for (const [name, qs0] of THEMES) for (const dark of [false, true]) {
      const qs = [qs0, dark ? 'dark=1' : ''].filter(Boolean).join('&')
      await go(qs)
      const t = `${name} ${dark ? 'oscuro' : 'claro'}`
      if (!qs0 || qs0 === 'theme=auditoria') {
        const bad = await page.evaluate(markup)
        OK(!bad.length, `${t}: marcado ${bad.slice(0, 6).join(' | ')}`)
      }
      await focusCase('s-typing')
      await page.keyboard.press('3')
      await page.waitForTimeout(300) // tras el fundido de color (--g-duration-fast); la cifra se confirma a los 900 ms
      const m = await page.evaluate(contrast)
      OK(m.some((c) => /tecleando/.test(c.k)), `${t}: s-typing no pasó a tecleando`)
      for (const c of m) if (!c.info) OK(c.r >= c.min, `${t}: ${c.k} ${c.r}:1 < ${c.min}`)
      const w = (re) => { const xs = m.filter((c) => re.test(c.k)).map((c) => c.r); return xs.length ? Math.min(...xs) : '—' }
      worst[t] = { texto: w(/píldora texto \((brand|accent|neutral|success|warning|danger|info)\)/), pasar: w(/al pasar/), contorno: w(/píldora contorno \((brand|accent|neutral|success|warning|danger|info)\)/), tramo: w(/tramo \((brand|accent|neutral|success|warning|danger|info)\) \//), riel: w(/ riel \//), tecleando: w(/tecleando/), 'lectura texto': w(/píldora texto \(solo lectura\)/), 'lectura contorno': w(/píldora contorno \(solo lectura\)/), error: w(/\(error\)|con error/), nombres: w(/mark-label|__value|__hint|label|value/), anillo: w(/anillo/), 'tramo/riel': w(/tramo\/riel/) }
      OK(m.length > 300, `${t}: pocas medidas (${m.length})`)
      await page.keyboard.press('Escape') // anula la cifra a medias (la página se recarga en la siguiente configuración)
    }
    if (engine === 'chromium' || args.verbose) {
      const keys = Object.keys(Object.values(worst)[0])
      console.log(`[${engine}] Contraste mínimo por tema (${keys.join(' · ')}):`)
      for (const [t, r] of Object.entries(worst)) console.log(`  ${t.padEnd(22)} ${Object.values(r).join(' · ')}`)
      console.log(`  ${'mínimo'.padEnd(22)} ${keys.map((k) => Math.min(...Object.values(worst).map((r) => r[k]).filter((x) => typeof x === 'number'))).join(' · ')}`)
      summary[engine] = worst
    }
  }

  /* 2 · Geometría: defecto, auditoría (space 3, texto 19, Georgia), propio (space 5, borde 2), oscuros y texto al 200 % */
  if (run(2)) for (const qs of ['', 'theme=auditoria', 'theme=propio', 'dark=1', 'theme=auditoria&dark=1', 'text=200', 'theme=auditoria&text=200']) {
    await go(qs)
    const t = (s) => `?${qs || 'defecto'} ${s}`
    const dens = await page.evaluate(() => ['default', 'comfortable', 'compact'].map((d) => {
      const { R, S } = window.__lib
      const c = R(document.querySelector(`#in-${d}`).closest('.g-input').querySelector('.g-input__control'))
      const root = S('d-' + d), a = R(root.querySelector('.g-slider__area')), th = R(root.querySelector('.g-slider__thumb')), p = R(root.querySelector('.g-slider__pill')), tx = R(root.querySelector('.g-slider__pill-text'))
      const sp = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--g-space-1'))
      const bw = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--g-border-width'))
      const lh = parseFloat(getComputedStyle(root.querySelector('.g-slider__pill')).lineHeight)
      const k = { default: 1, comfortable: 0.875, compact: 0.75 }[d]
      return { d, box: c.height, boxCy: (c.top + c.bottom) / 2, area: a.height, areaCy: (a.top + a.bottom) / 2, thumb: th.height, pill: p.height, pillCy: (p.top + p.bottom) / 2, expPill: Math.max(24, sp * 7 * k, lh + 2 * bw), textIn: tx.top >= p.top + bw - 0.5 && tx.bottom <= p.bottom - bw + 0.5 }
    }))
    for (const d of dens) {
      OK(near(d.area, d.box), t(`${d.d}: área ${d.area} ≠ caja de GInput ${d.box}`))
      OK(near(d.areaCy, d.boxCy, 1), t(`${d.d}: centro del área ${d.areaCy} vs caja ${d.boxCy}`))
      OK(near(d.pill, d.expPill) && near(d.pill, d.thumb, 0.01) && near(d.pillCy, d.areaCy, 0.5), t(`${d.d}: píldora ${d.pill} (esperada ${d.expPill}, asa ${d.thumb}) o descentrada ${d.pillCy}/${d.areaCy}`))
      OK(d.textIn, t(`${d.d}: el texto se sale de la píldora en vertical`))
    }
    if (engine === 'chromium') notes.push(`?${qs || 'defecto'} área / píldora por densidad (caja de GInput): ${dens.map((d) => `${d.d} ${d.area}/${d.pill} (${d.box})`).join(' · ')}`)
    const G = {}
    for (const c of ['s-rest', 's-min', 's-max', 's-marks', 's-empty', 's-readonly', 's-outside', 's-neg', 's-vt', 'r-apart', 'r-merged', 'r-same', 'r-start', 'r-end', 'rtl-single', 'rtl-merged', 'rtl-marks', 'n320-marks', 'n320-range', 's-ticks']) G[c] = await page.evaluate(geo, c)
    const g = G['s-rest']
    OK(near(g.trackCy, g.area.cy, 0.5) && near(g.trackH, g.space), t(`riel descentrado o de grosor ≠ space (${g.trackH})`))
    OK(near(g.fillCy, g.trackCy, 0.5) && near(g.fillH, g.space * 1.5, 0.5), t(`tramo descentrado o ≠ riel × 1.5 (${g.fillH})`))
    for (const c of ['s-rest', 's-min', 's-max']) OK(near(G[c].pills[0].w, g.pw, 0.5), t(`${c}: píldora ${G[c].pills[0].w} ≠ --_pill-w ${g.pw} (B1: no baila)`))
    OK(near(G['s-min'].pills[0].l, G['s-min'].area.l) && near(G['s-max'].pills[0].r, G['s-max'].area.r), t('la píldora no llega a los extremos o se sale'))
    OK(near(g.pills[0].cx, g.area.l + g.pw / 2 + 0.4 * (g.area.w - g.pw), 0.5), t(`40 %: centro ${g.pills[0].cx} fuera de su sitio`))
    OK(near(g.fill.l, g.area.l) && near(g.fill.r, g.pills[0].cx, 0.5), t(`tramo de valor único ${JSON.stringify(g.fill)}`))
    OK(g.pills[0].rad.every((r) => near(r, g.pills[0].h / 2, 0.5)), t(`radios ${g.pills[0].rad} ≠ medio alto`))
    OK(near(g.natives[0].w, g.pills[0].w - 2 * g.pills[0].bw, 0.5) && near(g.natives[0].h, g.pills[0].h - 2 * g.pills[0].bw, 0.5), t(`nativo ≠ interior de la píldora ${JSON.stringify(g.natives[0])}`))
    OK(g.hit[0].w >= 44 - 0.01 && near(g.hit[0].h, g.area.h), t(`zona de toque ${JSON.stringify(g.hit[0])}`))
    // Valores de la aplicación: fuera de límites en el extremo; negativo y valueText dentro de su píldora
    OK(near(G['s-outside'].pills[0].r, G['s-outside'].area.r) && G['s-outside'].pills[0].txt.includes('140'), t(`fuera de límites: ${JSON.stringify(G['s-outside'].pills[0])}`))
    for (const c of ['s-neg', 's-vt', 's-outside']) { const p = G[c].pills[0]; OK(p.text.l >= p.l - 0.5 && p.text.r <= p.r + 0.5, t(`${c}: «${p.txt}» se sale de su píldora`)) }
    const ra = G['r-apart']
    // Con el texto al 200 % las píldoras de 800 y 2400 quedan a menos de un ancho y se funden (B2): el tramo queda bajo la cápsula
    if (!ra.merged) OK(near(ra.fill.l, ra.pills[0].cx, 0.5) && near(ra.fill.r, ra.pills[1].cx, 0.5), t(`rango: tramo ${JSON.stringify(ra.fill)}`))
    else OK(/text=200/.test(qs), t('r-apart fundido sin el texto al 200 %'))
    for (const c of ['r-merged', 'r-same', 'r-start', 'r-end', 'rtl-merged']) {
      const m = G[c]
      const [p0, p1] = m.rtl ? [m.pills[1], m.pills[0]] : m.pills
      OK(m.merged, t(`${c}: no se funden`))
      OK(near(p0.r, p1.l, 1), t(`${c}: cápsula con hueco o solape ${p0.r} / ${p1.l}`))
      OK(p0.l >= m.area.l - 0.5 && p1.r <= m.area.r + 0.5, t(`${c}: la cápsula se sale del riel`))
      OK(near(p0.rad[1], 0) && near(p0.rad[2], 0) && near(p1.rad[0], 0) && near(p1.rad[3], 0), t(`${c}: esquinas interiores ${p0.rad} | ${p1.rad}`))
      OK(near(p0.rad[0], p0.h / 2, 0.5) && near(p1.rad[1], p1.h / 2, 0.5), t(`${c}: esquinas exteriores`))
    }
    OK(near(G['r-start'].pills[0].l, G['r-start'].area.l) && near(G['r-end'].pills[1].r, G['r-end'].area.r), t('cápsula en los extremos fuera de su sitio'))
    for (const c of ['s-marks', 'rtl-marks', 'n320-marks', 's-ticks']) {
      const m = G[c]
      const on = m.marks.find((k) => near(k.v, c === 's-ticks' ? 30 : c === 'n320-marks' ? 10 : 5, 0.001))
      OK(near(on.x, m.pills[0].cx, 1), t(`${c}: raya del valor ${on.x} ≠ centro de la píldora ${m.pills[0].cx}`))
      if (on.label && c !== 'n320-marks') OK(near(on.label.cx, on.x, 1), t(`${c}: nombre del medio descentrado`))
      for (const k of m.marks.filter((k) => k.label)) OK(k.label.l >= m.marksBox.l - 0.5 && k.label.r <= m.marksBox.r + 0.5, t(`${c}: nombre ${k.v} se sale`))
      OK(m.marks.every((k) => near(k.tickW, m.bwTok, 0.01)), t(`${c}: rayas de grosor ≠ borde`))
    }
    const e = G['s-empty']
    OK(!e.pills.length && near(e.thumbs[0].l, e.area.l) && near(e.thumbs[0].r, e.area.r) && near(e.thumbs[0].t, e.area.t) && near(e.thumbs[0].b, e.area.b) && e.hit[0].content === 'none', t(`sin elegir: ${JSON.stringify(e.thumbs[0])}`))
    const rs = G['rtl-single']
    OK(near(rs.pills[0].cx, rs.area.r - (rs.pw / 2 + 0.4 * (rs.area.w - rs.pw)), 0.5) && near(rs.fill.r, rs.area.r), t(`RTL: 40 % fuera de su sitio`))
    OK(/[٠-٩]/.test(rs.pills[0].txt) && G['rtl-merged'].pills[0].l > G['rtl-merged'].pills[1].l, t(`RTL: sin cifras arábigo-índicas («${rs.pills[0].txt}») o la mitad del inicio no va a la derecha`))
    for (const c of ['n320-marks', 'n320-range']) OK(G[c].pills.every((p) => p.l >= G[c].area.l - 0.5 && p.r <= G[c].area.r + 0.5), t(`${c}: píldora fuera del riel a 320`))
    for (const r of await page.evaluate(rowsOf)) for (const l of r.lines) if (l.length > 1) OK(l.every((k) => near(k.cy, l[0].cy, 1) && near(k.h, l[0].h, 0.5)), t(`fila ${r.row}: ${JSON.stringify(l)}`))
    const ins = await page.evaluate(inside)
    OK(!ins.out.length, t(`fuera del riel ${ins.out}`))
    // Hallazgo 3 (resuelto, #509): también con el texto al 200 % los nombres no se solapan en una fila
    // Salvo la fila fija de 320px al 200 %: ahí la fila no llega al mínimo publicado (límite del contenedor, no del mínimo)
    const lim = /text=200/.test(qs) ? ins.overlap.filter((o) => o.startsWith('row-dolor-320')) : []
    OK(ins.overlap.length === lim.length, t(`nombres solapados en fila ${ins.overlap.filter((o) => !lim.includes(o))}`))
    if (lim.length) notes.push(`${engine} ?${qs} límite del contenedor (no del mínimo): ${lim} en una fila fija de 320px por debajo del mínimo publicado`)
    OK(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), t('desborde horizontal'))
    if (engine === 'chromium') notes.push(`?${qs || 'defecto'} --_pill-w: «40 %» ${g.pw.toFixed(1)}px · «$2,400» ${G['r-apart'].pw.toFixed(1)}px · dolor ${G['s-marks'].pw.toFixed(1)}px`)
  }

  /* 3 · Anchos de ventana 1280 → 320 y zoom aproximado (640 con DPR 2): filas, sin desborde */
  if (run(3)) {
    for (const qs of ['', 'theme=auditoria&dark=1']) for (const w of [1280, 1024, 720, 480, 360, 320]) {
      await page.setViewportSize({ width: w, height: 900 })
      await go(qs)
      for (const r of await page.evaluate(rowsOf)) for (const l of r.lines) if (l.length > 1) OK(l.every((k) => near(k.cy, l[0].cy, 1) && near(k.h, l[0].h, 0.5)), `?${qs} ${w}px fila ${r.row}: ${JSON.stringify(l)}`)
      OK((await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 0, `?${qs} ${w}px: desborde`)
      const ins = await page.evaluate(inside)
      OK(!ins.out.length && !ins.overlap.length, `?${qs} ${w}px: fuera del riel ${ins.out} · solapes en fila ${ins.overlap}`)
    }
    await page.setViewportSize({ width: 1280, height: 900 })
    const zctx = await browser.newContext({ viewport: { width: 640, height: 900 }, deviceScaleFactor: 2 })
    const zp = await zctx.newPage()
    for (const qs of ['', '?theme=auditoria']) {
      await zp.goto(BASE + qs); await zp.waitForSelector('html[data-ready]'); await zp.evaluate(`window.__lib = (${lib})()`)
      for (const r of await zp.evaluate(rowsOf)) for (const l of r.lines) if (l.length > 1) OK(l.every((k) => near(k.cy, l[0].cy, 1)), `zoom ${qs} fila ${r.row}: ${JSON.stringify(l)}`)
      OK((await zp.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 0 && !(await zp.evaluate(inside)).out.length, `zoom ${qs}: desborde o píldoras fuera`)
    }
    await zctx.close()
  }

  /* 4 · Mínimo publicado (#453) en una GFormRow real, barrido de 1px; bloquear y desbloquear (#266) */
  if (run(4)) for (const qs of ['', 'theme=auditoria', 'theme=propio', 'text=200']) {
    await go(qs)
    for (const row of ['mn-pain', 'mn-pct', 'mn-mxn']) {
      const r = await page.evaluate(SWEEP, [row, 1100, 120])
      const t = (s) => `?${qs || 'defecto'} ${row} ${s}`
      OK(r.last, t('el deslizador nunca comparte la línea'))
      if (!r.last) continue
      const L = r.last
      // El publicado es el esperado (ceil); GFormRow admite 0,5px por debajo (TOL de formRowPlan). Si mide más, manda la clase
      OK(L.sl >= L.expected - 0.51, t(`mide ${L.sl} por debajo del mínimo por posiciones ${L.expected} ${JSON.stringify(L.parts)}`))
      const binds = L.sl <= L.expected + 0.01
      OK(!L.out, t(`en el mínimo, píldoras o nombres fuera del riel ${JSON.stringify(L)}`))
      // Hallazgo 3 (resuelto, #509 en 6129b74): el mínimo de las marcas se resuelve por pares de nombres vecinos (nombre
      // centrado en la píldora, ajustado al borde): el hueco en el mínimo no baja de space × 2, también con extremos
      // asimétricos y con el texto al 200 %
      if (L.gap !== null) {
        OK(L.gap >= L.parts.space / 20 - 0.01, t(`en el mínimo, hueco entre nombres ${L.gap}px < space × 2 (${L.parts.space / 20}px)`))
        notes.push(`${engine} ?${qs || 'defecto'} ${row}: hueco mínimo entre nombres en el mínimo ${L.gap}px (space × 2 = ${L.parts.space / 20}px)`)
      }
      notes.push(`${engine} ?${qs || 'defecto'} ${row}: ${L.sl}px en el último ancho de una línea (por posiciones ${L.expected}px: ${JSON.stringify(L.parts)})${binds ? '' : '; manda la clase de la fila'}`)
      const { a, b, c } = r.lock
      OK(a.one && b.one && c.one && near(a.w, b.w) && near(a.w, c.w) && near(a.h, b.h) && a.pw === b.pw && b.ro && !c.ro, t(`bloquear/desbloquear reparte la fila ${JSON.stringify(r.lock)}`))
    }
  }

  /* 5 · Anillo por la regla de modalidad real (#450) */
  if (run(5)) {
    await go('')
    const ring = (c, i = 0) => page.evaluate(([c, i]) => { const t = window.__lib.S(c).querySelectorAll('.g-slider__thumb')[i]; const s = getComputedStyle(t); const n = t.querySelector('input'); const i2 = document.createElement('i'); i2.style.color = 'var(--g-color-focus)'; document.body.append(i2); const fc = getComputedStyle(i2).color; i2.remove(); return { style: s.outlineStyle, w: parseFloat(s.outlineWidth), off: parseFloat(s.outlineOffset), color: s.outlineColor === fc, focus: document.activeElement === n, mark: n.hasAttribute('data-g-key-focus') } }, [c, i])
    const fw = await page.evaluate(() => [parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--g-focus-width')), parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--g-focus-offset'))])
    const p = await pillPoint('s-rest')
    await page.mouse.click(p.x, p.y)
    let r = await ring('s-rest')
    OK(r.focus && r.style === 'none' && !r.mark, `clic en la píldora: ${JSON.stringify(r)}`)
    await page.keyboard.press('ArrowLeft')
    r = await ring('s-rest')
    OK(r.style === 'solid' && near(r.w, fw[0], 0.01) && near(r.off, fw[1], 0.01) && r.color && r.mark, `tras ← sin anillo ${JSON.stringify(r)}`)
    await page.keyboard.press(engine === 'webkit' ? 'Alt+Tab' : 'Tab')
    r = await ring('s-min')
    OK(r.focus && r.style === 'solid', `con Tab: ${JSON.stringify(r)}`)
    const p2 = await pillPoint('s-max')
    await page.mouse.click(p2.x, p2.y)
    OK((await ring('s-min')).style === 'none' && (await ring('s-max')).style === 'none', 'el anillo sigue tras un clic')
    // Rango: Tab de inicio a fin; el anillo en la mitad enfocada de la cápsula
    await focusCase('r-merged', 0)
    await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowLeft')
    await page.keyboard.press(engine === 'webkit' ? 'Alt+Tab' : 'Tab')
    const rr = [await ring('r-merged', 0), await ring('r-merged', 1)]
    OK(rr[1].focus && rr[1].style === 'solid' && rr[0].style === 'none', `rango: el anillo no pasa a la segunda mitad ${JSON.stringify(rr)}`)
    // Sin elegir: el anillo rodea el área entera (cápsula). Foco por programa tras un clic (última entrada, puntero)
    await page.mouse.click(5, 5)
    await focusCase('s-empty')
    await page.keyboard.press('Shift')
    const em = await page.evaluate(() => { const r = window.__lib.S('s-empty'); const t = r.querySelector('.g-slider__thumb'), a = r.querySelector('.g-slider__area'); return { st: getComputedStyle(t).outlineStyle, tw: t.getBoundingClientRect().width, aw: a.getBoundingClientRect().width } })
    OK(em.st === 'none', `sin elegir: Mayús sola pinta el anillo ${JSON.stringify(em)}`)
    await page.keyboard.press('Tab'); await page.keyboard.press('Shift+Tab')
    const em2 = await page.evaluate(() => { const t = window.__lib.S('s-empty').querySelector('.g-slider__thumb'); return { st: getComputedStyle(t).outlineStyle, focus: document.activeElement === t.querySelector('input') } })
    if (engine !== 'webkit') OK(em2.focus && em2.st === 'solid' && near(em.tw, em.aw, 0.5), `sin elegir: anillo con Mayús+Tab ${JSON.stringify([em, em2])}`)
  }

  /* 6 · Movimiento (no-preference) y envío con GForm (I2, GErrorSummary, Intro en el enlace) */
  if (run(6)) {
    await go('')
    const anims = (c) => page.evaluate((c) => window.__lib.S(c).getAnimations({ subtree: true }).map((a) => ({ name: a.animationName || a.transitionProperty, el: a.effect.target.className })), c)
    OK((await page.evaluate(() => [...document.querySelectorAll('.g-slider')].flatMap((r) => r.getAnimations({ subtree: true })).length)) === 0, 'algo del deslizador se anima al montar')
    // B6 · salto deslizado (clic en el riel al 80 %)
    const pt = await railPoint('s-rest', 0.8)
    const xs = []
    await page.mouse.move(pt.x, pt.y)
    await page.mouse.down()
    for (let k = 0; k < 8; k++) xs.push(await page.evaluate(() => { const r = window.__lib.S('s-rest'); return { x: r.querySelector('.g-slider__thumb').getBoundingClientRect().left, j: r.classList.contains('is-jumping'), t: r.querySelector('.g-slider__thumb').getAnimations().map((a) => a.transitionProperty), f: r.querySelector('.g-slider__fill').getAnimations().map((a) => a.transitionProperty) } }))
    await page.mouse.up()
    OK(xs.some((s) => s.j && s.t.some((p) => /inset-inline-start|left|right/.test(p)) && s.f.length), `el salto no se desliza ${JSON.stringify(xs.slice(0, 3))}`)
    await page.waitForTimeout(450)
    OK(!(await page.evaluate(() => window.__lib.S('s-rest').classList.contains('is-jumping'))) && (await page.evaluate(() => window.__v['s-rest'])) === 80, 'is-jumping no se retira o el valor no es 80')
    // Arrastre: sin transición de posición; {color}-strong y --g-shadow-2 en el asa enfocada
    const p = await pillPoint('s-rest')
    await page.mouse.move(p.x, p.y); await page.mouse.down()
    await page.mouse.move(p.x - 40, p.y, { steps: 4 })
    await page.waitForTimeout(200)
    const dragT = await page.evaluate(() => { const r = window.__lib.S('s-rest'); const s = getComputedStyle(r.querySelector('.g-slider__pill')); const c = (v, prop = 'color') => { const i = document.createElement('i'); i.style[prop] = v; document.body.append(i); const x = getComputedStyle(i)[prop]; i.remove(); return x }; return { d: r.classList.contains('is-dragging'), t: r.querySelector('.g-slider__thumb').getAnimations().map((a) => a.transitionProperty), bg: s.backgroundColor, strong: c(getComputedStyle(r).getPropertyValue('--_c-strong')), sh: s.boxShadow, sh2: c('var(--g-shadow-2)', 'boxShadow'), cur: getComputedStyle(r.querySelector('.g-slider__area')).cursor } })
    await page.mouse.up()
    OK(dragT.d && !dragT.t.some((x) => /inset|left|right/.test(x)), `arrastre con transición de posición ${JSON.stringify(dragT)}`)
    OK(dragT.bg === dragT.strong && dragT.sh === dragT.sh2 && dragT.cur === 'grabbing', `arrastrando sin strong, shadow-2 o grabbing ${JSON.stringify(dragT)}`)
    OK(!(await page.evaluate(() => window.__lib.S('s-rest').classList.contains('is-dragging'))), 'is-dragging no se retira al soltar')
    // B5 · tope: s-max →, s-min Inicio, RTL Fin y luego ← (sube), y un valor fuera de límites con → (decisión de bruno)
    for (const [c, pre, key, sign] of [['s-max', null, 'ArrowRight', 1], ['s-min', null, 'Home', -1], ['rtl-single', 'End', 'ArrowLeft', -1], ['s-outside', null, 'ArrowRight', 1]]) {
      await focusCase(c)
      if (pre) { await page.keyboard.press(pre); await page.waitForTimeout(250) }
      const sp = await page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--g-space-1')))
      const before = await page.evaluate((c) => window.__v[c], c)
      const samples = page.evaluate((c) => new Promise((res) => { const t = window.__lib.S(c).querySelector('.g-slider__thumb'); const out = []; const f = () => { out.push({ tr: getComputedStyle(t).translate, a: t.getAnimations().map((a) => a.animationName), bump: window.__lib.S(c).getAttribute('data-bump') }); if (out.length < 30) requestAnimationFrame(f); else res(out) }; requestAnimationFrame(f) }), c)
      await page.keyboard.press(key)
      const s = await samples
      const tx = s.map((x) => parseFloat(String(x.tr).split(' ')[0]) || 0)
      const peak = sign > 0 ? Math.max(...tx) : Math.min(...tx)
      OK(s.some((x) => x.a.some((n) => /^g-slider-bump-/.test(n))), `${c}: sin animación de tope ${JSON.stringify(s.slice(0, 4))}`)
      OK(Math.abs(peak) > 0.1 && Math.abs(peak) <= sp * 0.5 + 0.01 && Math.sign(peak) === sign, `${c}: tope ${peak}px (≤ ${sp * 0.5}, sentido ${sign})`)
      OK(near(tx.at(-1), 0, 0.01), `${c}: el tope no vuelve (${tx.at(-1)})`)
      OK(!(await page.evaluate((c) => window.__lib.S(c).hasAttribute('data-bump'), c)), `${c}: data-bump no se retira`)
      OK((await page.evaluate((c) => window.__v[c], c)) === before, `${c}: el tope cambió el valor`)
    }
    // Autorrepetición en el límite: sin tope
    await focusCase('s-max')
    await page.keyboard.down('ArrowRight'); await page.waitForTimeout(700)
    const rep = await page.evaluate(() => window.__lib.S('s-max').getAttribute('data-bump'))
    await page.keyboard.up('ArrowRight')
    notes.push(`${engine}: autorrepetición en el límite, data-bump a los 700 ms = ${rep}`)
    // B2 · fusión: transición de esquinas al juntarse y al separarse; sin desplazamiento de posición
    await page.evaluate(() => { window.__v['r-apart'] = [800, 900] })
    await page.waitForTimeout(30)
    const fr = await page.evaluate(() => { const r = window.__lib.S('r-apart'); return { m: r.classList.contains('is-merged'), t: [...r.querySelectorAll('.g-slider__pill, .g-slider__thumb')].flatMap((p) => p.getAnimations().map((a) => a.transitionProperty)) } })
    OK(fr.m && fr.t.some((x) => /radius/.test(x)) && !fr.t.some((x) => /^(inset|left$|right$)/.test(x)), `fusión: ${JSON.stringify(fr)}`)
    await page.waitForTimeout(300)
    await page.evaluate(() => { window.__v['r-apart'] = [800, 2400] })
    await page.waitForTimeout(30)
    OK(!(await page.evaluate(() => window.__lib.S('r-apart').classList.contains('is-merged'))), 'no se separan')
    // B3 · tramo: cursor grab y arrastre entero (conserva la anchura)
    await page.waitForTimeout(300)
    const fp = await page.evaluate(() => { const r = window.__lib.S('r-apart'); r.scrollIntoView({ block: 'center' }); const f = r.querySelector('.g-slider__fill').getBoundingClientRect(); return { x: (f.left + f.right) / 2, y: (f.top + f.bottom) / 2, hit: document.elementFromPoint((f.left + f.right) / 2, (f.top + f.bottom) / 2).className } })
    OK(fp.hit === 'g-slider__fill', `el centro del tramo no es del tramo (${fp.hit})`)
    await page.mouse.move(fp.x, fp.y); await page.mouse.down(); await page.mouse.move(fp.x + 60, fp.y, { steps: 6 })
    const win = await page.evaluate(() => ({ v: window.__v['r-apart'].slice(), d: window.__lib.S('r-apart').classList.contains('is-dragging'), cur: getComputedStyle(window.__lib.S('r-apart').querySelector('.g-slider__fill')).cursor }))
    await page.mouse.up()
    OK(win.d && win.v[1] - win.v[0] === 1600 && win.v[0] > 800 && win.cur === 'grabbing', `tramo entero ${JSON.stringify(win)}`)
    // Decisión de bruno: con las dos asas juntas, una pulsación en el riel a un lado mueve la de ese lado
    for (const [f, side] of [[0.85, 1], [0.15, 0]]) {
      await page.evaluate(() => { window.__v['r-same'] = [50, 50] })
      await page.waitForTimeout(60)
      const q = await railPoint('r-same', f)
      await page.mouse.click(q.x, q.y)
      await page.waitForTimeout(350)
      const rv = await page.evaluate(() => window.__v['r-same'].slice())
      OK(side ? rv[0] === 50 && rv[1] > 50 : rv[1] === 50 && rv[0] < 50, `asas juntas, pulsación al ${side ? 'final' : 'inicio'}: ${JSON.stringify(rv)}`)
    }
    // B4 · teclear la cifra: is-typing, mismo ancho, Intro confirma; fuera de límites va al límite con tope
    await focusCase('s-typing')
    const [w0, vt0] = await page.evaluate(() => [window.__lib.S('s-typing').querySelector('.g-slider__pill').getBoundingClientRect().width, window.__lib.S('s-typing').querySelector('input[type=range]').getAttribute('aria-valuetext')])
    await page.keyboard.press('3'); await page.keyboard.press('5')
    await page.waitForTimeout(250) // fundido de sombra y color (--g-duration-fast)
    const ty = await page.evaluate(() => { const r = window.__lib.S('s-typing'); const t = r.querySelector('.g-slider__thumb'), p = r.querySelector('.g-slider__pill'); const cur = getComputedStyle(r.querySelector('.g-slider__pill-text'), '::after'); return { typing: t.classList.contains('is-typing'), w: p.getBoundingClientRect().width, txt: r.querySelector('.g-slider__pill-text').textContent, sh: getComputedStyle(p).boxShadow, curW: parseFloat(cur.width), cur: getComputedStyle(t).cursor, vt: r.querySelector('input[type=range]').getAttribute('aria-valuetext') } })
    OK(ty.typing && near(ty.w, w0, 0.5) && ty.txt === '35' && ty.sh === 'none' && ty.curW > 0 && ty.cur === 'text' && ty.vt === vt0, `tecleando ${JSON.stringify({ ...ty, w0, vt0 })}`)
    await page.keyboard.press('Enter')
    OK((await page.evaluate(() => [window.__v['s-typing'], window.__lib.S('s-typing').querySelector('.is-typing')])).join() === '35,', 'Intro no confirma 35')
    await page.keyboard.press('1'); await page.keyboard.press('5'); await page.keyboard.press('0')
    const bs = page.evaluate(() => new Promise((res) => { let seen = false; const t = window.__lib.S('s-typing').querySelector('.g-slider__thumb'); let n = 0; const f = () => { if (t.getAnimations().some((a) => /bump/.test(a.animationName))) seen = true; if (++n < 30) requestAnimationFrame(f); else res(seen) }; requestAnimationFrame(f) }))
    await page.keyboard.press('Enter')
    OK((await bs) && (await page.evaluate(() => window.__v['s-typing'])) === 100, 'cifra fuera de límites: sin tope o no va al límite')
    // I2 y GErrorSummary: enviar sin elegir la escala obligatoria
    await page.evaluate(() => document.getElementById('ef-send').scrollIntoView({ block: 'center' }))
    await page.click('#ef-send')
    await page.waitForTimeout(60)
    const rej = await page.evaluate(() => { const r = window.__lib.S('s-reject'); return { cls: r.classList.contains('is-rejected'), inv: r.classList.contains('is-invalid'), a: r.getAnimations({ subtree: true }).map((a) => [a.animationName, a.effect.target.className]), log: document.getElementById('ef-log').textContent, stripes: getComputedStyle(r.querySelector('.g-slider__track')).backgroundImage, danger: (() => { const i = document.createElement('i'); i.style.color = 'var(--g-color-danger-text)'; document.body.append(i); const x = getComputedStyle(i).color; i.remove(); return x })() } })
    OK(rej.cls && rej.inv && rej.a.length === 1 && rej.a[0][0] === 'g-reject-shake-slider' && /g-slider__row/.test(rej.a[0][1]) && /invalid dolor/.test(rej.log), `I2: ${JSON.stringify(rej)}`)
    OK(rej.stripes.includes(rej.danger.replace(/\s/g, '').replace(/,/g, ', ')) || rej.stripes.replace(/\s/g, '').includes(rej.danger.replace(/\s/g, '')), `sin elegir con error: trazos sin danger-text ${rej.stripes}`)
    await page.waitForTimeout(700)
    OK(!(await page.evaluate(() => window.__lib.S('s-reject').classList.contains('is-rejected'))), 'is-rejected no se retira')
    // Intro en el enlace del resumen: el foco al asa y el anillo (regla de modalidad)
    await page.focus('.g-error-summary__link')
    await page.keyboard.press('Enter')
    await page.waitForTimeout(150)
    const sr = await page.evaluate(() => { const r = window.__lib.S('s-reject'); const n = r.querySelector('input[type=range]'); return { focus: document.activeElement === n, ring: getComputedStyle(r.querySelector('.g-slider__thumb')).outlineStyle } })
    OK(sr.focus && sr.ring === 'solid', `Intro en el resumen: ${JSON.stringify(sr)}`)
    await page.keyboard.press('ArrowUp')
    await page.waitForTimeout(80)
    const fixed = await page.evaluate(() => ({ v: window.__v['s-reject'], inv: window.__lib.S('s-reject').classList.contains('is-invalid'), empty: window.__lib.S('s-reject').classList.contains('is-empty') }))
    OK(fixed.v === 0 && !fixed.inv && !fixed.empty, `↑ desde sin elegir: ${JSON.stringify(fixed)}`)
  }

  /* 7 · Movimiento reducido */
  if (run(7)) {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await go('')
    const pt = await railPoint('s-rest', 0.8)
    await page.mouse.click(pt.x, pt.y)
    const t1 = await page.evaluate(() => ({ t: window.__lib.S('s-rest').querySelector('.g-slider__thumb').getAnimations().map((a) => a.transitionProperty), j: window.__lib.S('s-rest').classList.contains('is-jumping') }))
    OK(!t1.t.some((p) => /inset|left|right/.test(p)) && !t1.j, `reduce: el salto se desliza ${JSON.stringify(t1)}`)
    await focusCase('s-max')
    await page.keyboard.press('ArrowRight')
    await page.waitForTimeout(40)
    const rb = await page.evaluate(() => ({ a: window.__lib.S('s-max').getAnimations({ subtree: true }).map((a) => a.animationName), bump: window.__lib.S('s-max').getAttribute('data-bump') }))
    OK(!rb.a.some((n) => /bump/.test(n)) && rb.bump === null, `reduce: tope ${JSON.stringify(rb)}`)
    await page.evaluate(() => { window.__v['r-apart'] = [800, 900] })
    await page.waitForTimeout(30)
    const fr = await page.evaluate(() => [...window.__lib.S('r-apart').querySelectorAll('.g-slider__pill, .g-slider__thumb')].flatMap((p) => p.getAnimations().map((a) => a.transitionProperty)))
    OK(!fr.some((p) => /radius|^inset|^left$|^right$/.test(p)) && (await page.evaluate(() => window.__lib.S('r-apart').classList.contains('is-merged'))), `reduce: fusión con transición ${fr}`)
    const colorT = await page.evaluate(() => getComputedStyle(window.__lib.S('s-rest').querySelector('.g-slider__pill')).transitionProperty)
    OK(/background-color/.test(colorT) && !/radius/.test(colorT), `reduce: color ${colorT}`)
    await page.click('#ef-send')
    await page.waitForTimeout(60)
    const rj = await page.evaluate(() => ({ cls: window.__lib.S('s-reject').classList.contains('is-rejected'), a: window.__lib.S('s-reject').getAnimations({ subtree: true }).length }))
    OK(rj.a === 0, `reduce: I2 se mueve ${JSON.stringify(rj)}`)
    notes.push(`${engine} reduce: I2 deja is-rejected = ${rj.cls} (sin animación)`)
    await page.emulateMedia({ reducedMotion: 'no-preference' })
  }

  /* 8 · Al pasar y cursores */
  if (run(8)) {
    await go('')
    const p = await pillPoint('c-accent')
    await page.mouse.move(p.x, p.y)
    await page.waitForTimeout(250)
    const h = await page.evaluate(() => { const r = window.__lib.S('c-accent'); const s = getComputedStyle(r.querySelector('.g-slider__pill')); const c = (v) => { const i = document.createElement('i'); i.style.color = v; document.body.append(i); const x = getComputedStyle(i).color; i.remove(); return x }; return { bg: s.backgroundColor, edge: s.borderTopColor, strong: c('var(--g-color-accent-strong)'), text: c('var(--g-color-accent-text)') } })
    OK(h.bg === h.strong && h.edge === h.text, `al pasar ${JSON.stringify(h)}`)
    const ro = await pillPoint('s-readonly')
    await page.mouse.move(ro.x, ro.y)
    await page.waitForTimeout(250)
    const rr = await page.evaluate(() => { const s = getComputedStyle(window.__lib.S('s-readonly').querySelector('.g-slider__pill')); const c = (v) => { const i = document.createElement('i'); i.style.color = v; document.body.append(i); const x = getComputedStyle(i).color; i.remove(); return x }; return { bg: s.backgroundColor === c('var(--g-color-neutral-soft)'), edge: s.borderTopColor === c('var(--g-color-border-control)'), dash: s.borderTopStyle, sh: s.boxShadow } })
    OK(rr.bg && rr.edge && rr.dash === 'dashed' && rr.sh === 'none', `solo lectura (y al pasar) ${JSON.stringify(rr)}`)
    const cur = await page.evaluate(() => ['s-rest', 's-readonly', 's-disabled', 'r-apart'].map((c) => { const r = window.__lib.S(c); return [getComputedStyle(r.querySelector('.g-slider__area')).cursor, getComputedStyle(r.querySelector('.g-slider__thumb')).cursor, getComputedStyle(r.querySelector('.g-slider__fill')).cursor] }))
    OK(JSON.stringify(cur) === JSON.stringify([['pointer', 'grab', 'pointer'], ['default', 'default', 'default'], ['not-allowed', 'not-allowed', 'not-allowed'], ['pointer', 'grab', 'grab']]), `cursores ${JSON.stringify(cur)}`)
  }

  /* 9 · Colores forzados (solo Chromium los emula) */
  if (run(9) && engine === 'chromium') {
    for (const [dark, qs] of [[false, ''], [true, 'dark=1'], [false, 'theme=auditoria']]) {
      await page.emulateMedia({ forcedColors: 'active', colorScheme: dark ? 'dark' : 'light' })
      await go(qs)
      await focusCase('s-typing')
      await page.keyboard.press('3')
      await focusCase('s-rest')
      await page.keyboard.press('ArrowRight')
      const f = await page.evaluate(() => {
        const sys = (n) => { const i = document.createElement('i'); i.style.color = n; i.style.forcedColorAdjust = 'none'; document.body.append(i); const x = getComputedStyle(i).color; i.remove(); return x }
        const S = window.__lib.S
        const pill = getComputedStyle(S('s-rest').querySelector('.g-slider__pill'))
        const typ = getComputedStyle(S('s-typing').querySelector('.g-slider__pill'))
        const dis = getComputedStyle(S('s-disabled').querySelector('.g-slider__pill'))
        const ro = getComputedStyle(S('s-readonly').querySelector('.g-slider__pill'))
        const bw = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--g-border-width'))
        return {
          track: getComputedStyle(S('s-rest').querySelector('.g-slider__track')).backgroundColor === sys('GrayText'),
          fill: getComputedStyle(S('s-rest').querySelector('.g-slider__fill')).backgroundColor === sys('Highlight'),
          pill: pill.backgroundColor === sys('ButtonFace') && pill.color === sys('ButtonText') && pill.borderTopColor === sys('ButtonText'),
          typing: typ.backgroundColor === sys('Field') && typ.color === sys('FieldText'),
          readonly: ro.borderTopStyle === 'dashed' && ro.borderTopColor === sys('ButtonText') && ro.color === sys('ButtonText'),
          disabled: dis.color === sys('GrayText') && dis.borderTopColor === sys('GrayText'),
          ring: getComputedStyle(S('s-rest').querySelector('.g-slider__thumb')).outlineColor === sys('Highlight') && getComputedStyle(S('s-rest').querySelector('.g-slider__thumb')).outlineStyle === 'solid',
          invalid: parseFloat(getComputedStyle(S('s-invalid').querySelector('.g-slider__pill')).borderTopWidth) >= 2 * bw - 0.01,
          seam: getComputedStyle(S('r-merged').querySelectorAll('.g-slider__pill')[1]).borderLeftColor === sys('ButtonText'),
          ticks: getComputedStyle(S('s-marks').querySelector('.g-slider__mark'), '::before').backgroundColor === sys('CanvasText'),
          emptyStripes: /gradient/.test(getComputedStyle(S('s-empty').querySelector('.g-slider__track')).backgroundImage)
        }
      })
      for (const [k, v] of Object.entries(f)) OK(v, `forced-colors ${qs || 'defecto'} ${dark ? 'oscuro' : 'claro'}: ${k}`)
    }
    await page.emulateMedia({ forcedColors: 'none', colorScheme: 'light' })
  } else if (run(9)) notes.push(`${engine}: forced-colors no se emula`)

  const errs = errors.filter((e) => !/development build|devtools|You are running a development build/i.test(e))
  OK(!errs.length, 'consola: ' + errs.slice(0, 3).join(' | '))
  await ctx.close()

  /* 10 · Táctil (Chromium y WebKit): áreas ≥ 44, pan-y, toque en el riel salta, toque en el tramo mueve el asa más cercana */
  if (run(10) && engine !== 'firefox') {
    for (const qs of ['', '?theme=auditoria']) {
      const tctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: engine === 'chromium' })
      const p2 = await tctx.newPage()
      const terr = []
      p2.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') terr.push(m.text()) })
      await p2.goto(BASE + qs); await p2.waitForSelector('html[data-ready]'); await p2.evaluate(`window.__lib = (${lib})()`)
      if (!(await p2.evaluate(() => matchMedia('(pointer: coarse)').matches))) { notes.push(`${engine}: pointer: coarse no se emula`); await tctx.close(); continue }
      const m = await p2.evaluate(() => ['default', 'compact'].map((d) => { const S = window.__lib.S; const r = S('d-' + d); const a = r.querySelector('.g-slider__area').getBoundingClientRect(); const hit = getComputedStyle(r.querySelector('.g-slider__thumb'), '::after'); const c = document.querySelector('#in-' + d).closest('.g-input').querySelector('.g-input__control').getBoundingClientRect(); const fz = getComputedStyle(S('r-apart').querySelector('.g-slider__fill'), '::after'); return { d, area: a.height, box: c.height, hw: parseFloat(hit.width), hh: parseFloat(hit.height), fz: parseFloat(fz.height) } }))
      for (const x of m) OK(x.area >= 44 - 0.01 && near(x.area, x.box) && x.hw >= 44 - 0.01 && x.hh >= 44 - 0.01 && x.fz >= 44 - 0.01, `táctil ${qs} ${JSON.stringify(x)}`)
      OK(await p2.evaluate(() => getComputedStyle(document.querySelector('.g-slider__area')).touchAction === 'pan-y'), `táctil ${qs}: área sin pan-y`)
      for (const r of await p2.evaluate(rowsOf)) for (const l of r.lines) if (l.length > 1) OK(l.every((k) => near(k.cy, l[0].cy, 1) && near(k.h, l[0].h, 0.5)), `táctil ${qs} fila ${r.row}: ${JSON.stringify(l)}`)
      OK((await p2.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 0, `táctil ${qs}: desborde`)
      // Un toque en el riel al 20 % lleva el 40 al 20
      const tp = await p2.evaluate(() => { const r = window.__lib.S('s-rest'); r.scrollIntoView({ block: 'center' }); const a = r.querySelector('.g-slider__area').getBoundingClientRect(); const pw = parseFloat(r.style.getPropertyValue('--_pill-w')); return { x: a.left + pw / 2 + 0.2 * (a.width - pw), y: (a.top + a.bottom) / 2 } })
      await p2.touchscreen.tap(tp.x, tp.y)
      await p2.waitForTimeout(400)
      OK((await p2.evaluate(() => window.__v['s-rest'])) === 20, `táctil ${qs}: el toque en el riel no salta (${await p2.evaluate(() => window.__v['s-rest'])})`)
      // Un toque en el tramo del rango (2.5.7): el asa más cercana va ahí
      // En el hueco visible del tramo, más cerca del inicio (fuera de la zona de toque de las píldoras)
      const fp = await p2.evaluate(() => { const r = window.__lib.S('r-apart'); r.scrollIntoView({ block: 'center' }); const f = r.querySelector('.g-slider__fill').getBoundingClientRect(); const z = getComputedStyle(r.querySelector('.g-slider__thumb'), '::after'); const p0 = r.querySelector('.g-slider__thumb').getBoundingClientRect(); const x = Math.max(p0.right, (p0.left + p0.right) / 2 + parseFloat(z.width) / 2) + 2; return { x, y: (f.top + f.bottom) / 2, hit: document.elementFromPoint(x, (f.top + f.bottom) / 2).className, mid: (f.left + f.right) / 2 } })
      OK(fp.hit === 'g-slider__fill' && fp.x < fp.mid, `táctil ${qs}: sin hueco de tramo entre las píldoras ${JSON.stringify(fp)}`)
      await p2.touchscreen.tap(fp.x, fp.y)
      await p2.waitForTimeout(400)
      const rv = await p2.evaluate(() => window.__v['r-apart'])
      OK(rv[0] > 800 && rv[1] === 2400, `táctil ${qs}: el toque en el tramo no mueve el inicio ${JSON.stringify(rv)}`)
      OK(!terr.length, `táctil ${qs}: consola ${terr.slice(0, 2)}`)
      await tctx.close()
    }
  }
  await browser.close()
  console.log(`[${engine}] ${counts[engine] ? `${counts[engine][0]}/${counts[engine][1]}` : '—'}`)
}

server.close()
const shown = [...new Set(notes)]
if (shown.length) console.log('\nNotas:\n' + shown.map((n) => '  · ' + n).join('\n'))
console.log(`\nestático ${counts['estático'] ? counts['estático'].join('/') : '—'} · ` + ENGINES.map((e) => `${e} ${counts[e] ? counts[e].join('/') : '—'}`).join(' · '))
console.log(`${total - failed}/${total} correctas`)
if (failed) { console.log(fails.slice(0, 80).map((f) => '  ✗ ' + f).join('\n')); if (fails.length > 80) console.log(`  … y ${fails.length - 80} más`); process.exitCode = 1 }
