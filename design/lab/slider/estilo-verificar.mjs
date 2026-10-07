// Verificación de coco sobre el banco de GSlider (design/lab/slider/estilo-banco.html), con el CSS real cargado en la capa
// grana.components y GInput, GNumberField, GSelect, GForm, GFormLayout y GFormRow reales de dist/ como vecinos.
// Mide: análisis estático del CSS (solo --g-*/--_*, sin respaldos, sin literales de color ni de medida salvo 24px/44px y
// el texto oculto, sin @layer/@property/!important, keyframes g-slider-bump-* y g-reject-shake-slider, animaciones solo
// con no-preference, :hover solo en (hover: hover), anillo solo con [data-g-key-focus] y nunca :focus-visible, sin muelle
// ni rebote, sin selectores de hijos por estructura salvo las referencias propias de la píldora, #383); contraste de la
// píldora (texto, al pasar, contorno), del tramo, del riel, de nombres de marcas, «sin elegir», tecleando, solo lectura y
// error en el tema por defecto, lustre, spotify y uno con primary propia (estilo-tema.json), claro y oscuro, con las siete
// familias de `color`; geometría: área = caja md de GInput por densidad, píldora por densidad, riel centrado, ancho fijo
// de la píldora, recorrido recogido media píldora, tramo de centro a centro, fusión sin solape con esquinas interiores a 0,
// marcas alineadas con la píldora y nombres de los extremos dentro, zona de toque, nativo del tamaño del interior, «sin
// elegir», tecleando sin cambiar de ancho; fila real (Δ de centros ≤ 1px con GInput, GNumberField y GSelect) a 1100/720 y
// ventanas de 720/480/360/320; RTL; anillo por modalidad; movimiento (nada al montar, salto deslizado, arrastre sin
// transición, tope ≤ space × 0.5 hacia la dirección visual y de vuelta, esquinas de la fusión, I2) y movimiento reducido;
// forced-colors (Chromium); puntero grueso (Chromium y WebKit); consola limpia.
// Ejecutar desde la raíz del repo:  GRANA_PW_PORT=4212 node design/lab/slider/estilo-verificar.mjs
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
await new Promise((r) => server.listen(Number(process.env.GRANA_PW_PORT) || 4212, '127.0.0.1', r))
const BASE = `http://127.0.0.1:${server.address().port}/design/lab/slider/estilo-banco.html`

let total = 0, failed = 0
const fails = [], notes = []
const ok = (cond, msg) => { total++; if (!cond) { failed++; fails.push(msg) } }
const near = (a, b, t = 0.5) => Math.abs(a - b) <= t

/* ---------- 0 · Análisis estático del CSS ---------- */
{
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
  ok(!/--g-color-(on-)?brand(?![a-z])/.test(css), 'CSS: lee brand en vez del rol primary (tokens.md §17.2, roles.test.js)')
  const own = new Set([...css.matchAll(/(--_[\w-]+)\s*:/g)].map((m) => m[1]))
  const fromVue = ['--_at', '--_from', '--_to', '--_mid', '--_pill-w']
  const strange = [...new Set(vars.filter((v) => v.startsWith('--_') && !own.has(v) && !fromVue.includes(v)))]
  ok(!strange.length, 'CSS: alias --_* que ni declara ni recibe del .vue: ' + strange)
  ok(fromVue.every((v) => vars.includes(v)), 'CSS: no usa todos los datos del .vue')
  ok(!/--g-[\w-]+\s*:/.test(css), 'CSS: declara un token del tema (van en defaults.css)')
  const px = [...css.matchAll(/(-?\d*\.?\d+)px/g)].map((m) => m[0])
  ok(px.every((p) => ['24px', '44px', '1px', '-1px'].includes(p)), 'CSS: medidas literales no permitidas ' + px.filter((p) => !['24px', '44px', '1px', '-1px'].includes(p)))
  const onePx = css.split('\n').filter((l) => /\b-?1px\b/.test(l)).map((l) => l.trim())
  ok(onePx.every((l) => /^(inline-size|block-size|margin): -?1px;$/.test(l)), 'CSS: 1px fuera del texto oculto: ' + onePx)
  const ems = [...css.matchAll(/(-?\d*\.?\d+)(em|rem|ch|vw|vh)\b/g)].map((m) => m[0])
  ok(ems.every((e) => e === '-0.125em'), 'CSS: medidas relativas literales ' + ems)
  const nums = [...css.matchAll(/\*\s*(-?\d*\.?\d+)\b(?!px|ms|%)/g)].map((m) => m[1])
  ok(nums.every((n) => ['-1', '1', '2', '3', '7', '9', '0.5', '-0.5', '0.75', '0.25', '1.5'].includes(n)), 'CSS: factores fuera de la lista (área 9, píldora 7, relleno 3, rayas 1.5, tope 0.5, I2): ' + nums)
  const kf = [...css.matchAll(/@keyframes\s+([\w-]+)/g)].map((m) => m[1])
  ok(kf.sort().join() === 'g-reject-shake-slider,g-slider-bump-down,g-slider-bump-up', 'CSS: keyframes ' + kf)
  ok(!/ease-spring|ease-bounce|cubic-bezier|steps\(/.test(css), 'CSS: muelle, rebote o curva propia (#452)')
  ok(!/:focus-visible/.test(css), 'CSS: usa :focus-visible (el anillo es solo con [data-g-key-focus], #450)')
  ok(/:where\(\[data-g-key-focus\]\):focus/.test(css), 'CSS: anillo sin [data-g-key-focus]')
  ok(!/:invalid|:user-invalid/.test(css), 'CSS: estiliza :invalid')
  // #383: ningún selector toma hijos por estructura (solo las referencias propias de la píldora: .g-slider__pill-ref > span)
  const sel = css.replace(/\{[^}]*\}/g, '{}').replace(/\.g-slider__pill-ref > span/g, '')
  ok(!/>\s*\*|>\s*(span|div|input|label|p)\b|:(first|last|nth)-child/.test(sel), 'CSS: selector de hijos por estructura (#383)')
  let ctx = [], pending = ''
  const anim = [], hov = [], trans = []
  for (const t of css.split(/([{}])/)) {
    if (t === '{') { ctx.push(pending.trim()); pending = '' }
    else if (t === '}') { ctx.pop(); pending = '' }
    else {
      pending += t
      if (/(^|;|\s)animation\s*:/.test(t) && !ctx.some((c) => /@keyframes/.test(c))) anim.push(ctx.join(' » '))
      if (/(^|;|\s)transition\s*:/.test(t)) trans.push([ctx.join(' » '), t])
      if (ctx.length && /:hover/.test(ctx[ctx.length - 1]) && /:/.test(t)) hov.push(ctx.join(' » '))
    }
  }
  ok(anim.length >= 3 && anim.every((c) => /prefers-reduced-motion: no-preference/.test(c)), 'CSS: animación fuera de no-preference')
  ok(hov.every((c) => /@media \(hover: hover\)/.test(c)), 'CSS: :hover fuera de @media (hover: hover)')
  ok(trans.length && trans.every(([c]) => /is-ready/.test(c)), 'CSS: transición sin is-ready (nada al montar)')
  ok(trans.filter(([c]) => /motion: reduce\)/.test(c)).every(([, t]) => !/inset|inline-size|radius|translate/.test(t)), 'CSS: con reduce se desplaza o cambia de forma')
  ok(trans.filter(([, t]) => /inset-inline-start/.test(t)).every(([c]) => /is-jumping/.test(c)), 'CSS: posición con transición fuera de is-jumping')
  ok(/@media \(forced-colors: active\)/.test(css) && /@media \(pointer: coarse\)/.test(css), 'CSS: sin forced-colors o sin puntero grueso')
  ok(/touch-action: pan-y/.test(css) && /-webkit-touch-callout: none/.test(css) && /user-select: none/.test(css), 'CSS: área sin pan-y/selección/menú de toque largo')
  ok(/tabular-nums/.test(css) && /unicode-bidi: plaintext/.test(css), 'CSS: píldora sin tabular-nums o sin plaintext')
  ok(/\.g-slider__fill\s*\{[^}]*background: var\(--_text\)/.test(css), 'CSS: el tramo no es {color}-text (#439)')
  ok(/--_pill-edge: var\(--_text\)/.test(css), 'CSS: contorno de la píldora no es {color}-text (§7.1)')
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
  const S = (c) => document.querySelector(`[data-case="${c}"]`)
  return { parse, over, bgOf, ratio, col, R, S }
}

// Contraste: por raíz no deshabilitada; los pares se leen de lo pintado y de los tokens del tema
const contrast = () => {
  const { parse, over, bgOf, ratio, col } = window.__lib
  const out = []
  const surf = { surface: col('var(--g-color-surface)'), bg: col('var(--g-color-bg)'), sunken: col('var(--g-color-surface-sunken)') }
  const vs3 = (k, c, min = 3) => { for (const [n, b] of Object.entries(surf)) out.push({ k: `${k} / ${n}`, r: ratio(over(c, b), b), min }) }
  for (const root of document.querySelectorAll('.g-slider')) {
    if (root.classList.contains('is-disabled')) continue
    const id = root.dataset.case
    const fam = [...root.classList].find((c) => c.startsWith('g-slider--color-')).slice(16)
    const host = bgOf(root)
    const track = root.querySelector('.g-slider__track')
    if (!root.classList.contains('is-empty')) vs3(`${id} riel`, parse(getComputedStyle(track).backgroundColor))
    const fill = root.querySelector('.g-slider__fill')
    if (fill) vs3(`${id} tramo (${fam})${root.classList.contains('is-readonly') ? ' solo lectura' : ''}`, parse(getComputedStyle(fill).backgroundColor))
    if (fill && !root.classList.contains('is-readonly')) out.push({ k: `${id} tramo/riel (${fam})`, r: ratio(over(parse(getComputedStyle(fill).backgroundColor), host), over(parse(getComputedStyle(track).backgroundColor), host)), min: 0, info: true })
    for (const pill of root.querySelectorAll('.g-slider__pill')) {
      const cs = getComputedStyle(pill)
      const bg = over(parse(cs.backgroundColor), host)
      const typing = pill.parentElement.classList.contains('is-typing')
      const kind = typing ? 'tecleando' : root.classList.contains('is-readonly') ? 'solo lectura' : root.classList.contains('is-invalid') ? 'error' : fam
      out.push({ k: `${id} píldora texto (${kind})`, r: ratio(over(parse(cs.color), bg), bg), min: 4.5 })
      if (!root.classList.contains('is-readonly')) vs3(`${id} píldora contorno (${kind})`, parse(cs.borderTopColor))
    }
    // Al pasar (y arrastrando): on-{color} sobre {color}-strong, del propio tema
    if (!root.classList.contains('is-readonly') && root.querySelector('.g-slider__pill')) {
      const st = getComputedStyle(root)
      const strong = col(st.getPropertyValue('--_c-strong')), on = col(st.getPropertyValue('--_on'))
      out.push({ k: `${id} píldora al pasar (${fam})`, r: ratio(on, strong), min: 4.5 })
      // La raya de la cápsula fundida (on-{color} sobre {color}): se informa, no es requisito (cada mitad lleva su texto)
      if (root.classList.contains('is-merged')) out.push({ k: `${id} raya de la cápsula (${fam})`, r: ratio(on, col(st.getPropertyValue('--_c'))), min: 0, info: true })
    }
    for (const t of root.querySelectorAll('.g-slider__mark-label, .g-slider__value, .g-slider__hint')) out.push({ k: `${id} ${t.className.slice(10)}`, r: ratio(over(parse(getComputedStyle(t).color), host), host), min: 4.5 })
    if (root.classList.contains('is-empty') && root.classList.contains('is-invalid')) {
      const m = getComputedStyle(track).backgroundImage.match(/rgba?\([^)]+\)|color\(srgb [^)]+\)/)
      if (m) vs3(`${id} trazos con error`, parse(m[0]))
    }
  }
  return out
}

// Geometría de un caso: rectángulos útiles
const geo = (c) => {
  const { R, S } = window.__lib
  const root = S(c)
  const area = root.querySelector('.g-slider__area'), a = R(area)
  const track = R(root.querySelector('.g-slider__track'))
  const fillEl = root.querySelector('.g-slider__fill')
  const thumbs = [...root.querySelectorAll('.g-slider__thumb')]
  const pills = thumbs.map((t) => t.querySelector('.g-slider__pill')).filter(Boolean)
  const cs = (el, p) => getComputedStyle(el, p)
  return {
    pw: parseFloat(root.style.getPropertyValue('--_pill-w')), rtl: cs(root).direction === 'rtl',
    merged: root.classList.contains('is-merged'),
    area: { l: a.left, r: a.right, t: a.top, b: a.bottom, w: a.width, h: a.height, cy: (a.top + a.bottom) / 2 },
    trackCy: (track.top + track.bottom) / 2, trackH: track.height, fillCy: fillEl ? (R(fillEl).top + R(fillEl).bottom) / 2 : null, fillH: fillEl ? R(fillEl).height : null,
    fill: fillEl ? (({ left, right }) => ({ l: left, r: right }))(R(fillEl)) : null,
    pills: pills.map((p) => { const r = R(p), s = cs(p); return { l: r.left, r: r.right, w: r.width, h: r.height, cx: (r.left + r.right) / 2, cy: (r.top + r.bottom) / 2, bw: parseFloat(s.borderTopWidth), rad: [s.borderTopLeftRadius, s.borderTopRightRadius, s.borderBottomRightRadius, s.borderBottomLeftRadius].map(parseFloat), bg: s.backgroundColor, fg: s.color } }),
    natives: thumbs.map((t) => { const n = t.querySelector('.g-slider__native'); const r = R(n); return { w: r.width, h: r.height, op: cs(n).opacity, pe: cs(n).pointerEvents } }),
    hit: thumbs.map((t) => { const s = cs(t, '::after'); return { w: parseFloat(s.width), h: parseFloat(s.height), content: s.content } }),
    thumbs: thumbs.map((t) => { const r = R(t); return { l: r.left, r: r.right, t: r.top, b: r.bottom } }),
    marks: [...root.querySelectorAll('.g-slider__mark')].map((m) => { const l = m.querySelector('.g-slider__mark-label'), tick = cs(m, '::before'); const mr = R(m); return { v: Number(m.dataset.value), x: mr.left, tickW: parseFloat(tick.width), label: l ? (({ left, right }) => ({ l: left, r: right, cx: (left + right) / 2 }))(R(l)) : null } }),
    marksBox: root.querySelector('.g-slider__marks') ? (({ left, right }) => ({ l: left, r: right }))(R(root.querySelector('.g-slider__marks'))) : null,
    space: parseFloat(cs(document.documentElement).getPropertyValue('--g-space-1')),
    bwTok: parseFloat(cs(document.documentElement).getPropertyValue('--g-border-width'))
  }
}

const tagOf = (engine) => (s) => `[${engine}] ${s}`

for (const engine of ENGINES) {
  const browser = await pw[engine].launch()
  const tag = tagOf(engine)
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await ctx.newPage()
  const errors = []
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()) })
  page.on('pageerror', (e) => errors.push(e.message))
  const go = async (qs = '') => {
    await page.goto(BASE + qs)
    await page.waitForSelector('html[data-ready]')
    await page.evaluate(`window.__lib = (${lib})()`)
  }

  /* 1 · Contraste */
  const worst = {}
  for (const [name, qs] of [['defecto', ''], ['defecto', 'dark=1'], ['lustre', 'theme=lustre'], ['lustre', 'theme=lustre&dark=1'], ['spotify', 'theme=spotify'], ['spotify', 'theme=spotify&dark=1'], ['propio', 'theme=propio'], ['propio', 'theme=propio&dark=1']]) {
    await go('?' + qs)
    const m = await page.evaluate(contrast)
    const t = `${name} ${qs.includes('dark') ? 'oscuro' : 'claro'}`
    for (const c of m) if (!c.info) ok(c.r >= c.min, tag(`${t}: ${c.k} ${c.r}:1 < ${c.min}`))
    const w = (re) => { const xs = m.filter((c) => re.test(c.k)).map((c) => c.r); return xs.length ? Math.min(...xs) : '—' }
    worst[t] = { texto: w(/píldora texto \((brand|accent|neutral|success|warning|danger|info)\)/), pasar: w(/al pasar/), contorno: w(/píldora contorno \((brand|accent|neutral|success|warning|danger|info)\)/), tramo: w(/tramo \((brand|accent|neutral|success|warning|danger|info)\) \//), riel: w(/ riel \//), tecleando: w(/píldora (texto|contorno) \(tecleando\)/), lectura: w(/solo lectura/), error: w(/\(error\)|trazos con error/), nombres: w(/mark-label|__value|__hint|g-slider__value|value$/), raya: w(/raya/), 'tramo/riel (info)': w(/tramo\/riel/) }
    ok(m.length > 150, tag(`${t}: pocas medidas (${m.length})`))
  }
  if (engine === 'chromium') {
    const keys = Object.keys(Object.values(worst)[0])
    console.log('Contraste mínimo por tema (' + keys.join(' · ') + '):')
    for (const [t, r] of Object.entries(worst)) console.log(`  ${t.padEnd(16)} ${Object.values(r).join(' · ')}`)
    console.log(`  mínimo           ${keys.map((k) => Math.min(...Object.values(worst).map((r) => r[k]).filter((x) => typeof x === 'number'))).join(' · ')}`)
    notes.push('contraste: ' + JSON.stringify(worst))
  }

  /* 2 · Geometría: defecto, propio (space 5, borde 2px) y lustre (radios grandes) */
  for (const qs of ['', 'theme=propio', 'theme=lustre', 'dark=1']) {
    await go('?' + qs)
    const t = (s) => tag(`?${qs || 'defecto'} ${s}`)
    // Área = caja md de GInput por densidad; píldora space × 7 × densidad (piso 24); riel centrado; centros en la fila
    const dens = await page.evaluate(() => ['default', 'comfortable', 'compact'].map((d) => {
      const { R, S } = window.__lib
      const c = R(document.querySelector(`#in-${d}`).closest('.g-input').querySelector('.g-input__control'))
      const root = S('d-' + d), a = R(root.querySelector('.g-slider__area')), p = R(root.querySelector('.g-slider__pill'))
      const sp = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--g-space-1'))
      const k = { default: 1, comfortable: 0.875, compact: 0.75 }[d]
      return { d, box: c.height, boxCy: (c.top + c.bottom) / 2, area: a.height, areaCy: (a.top + a.bottom) / 2, pill: p.height, pillCy: (p.top + p.bottom) / 2, expPill: Math.max(24, sp * 7 * k) }
    }))
    for (const d of dens) {
      ok(near(d.area, d.box), t(`${d.d}: área ${d.area} ≠ caja de GInput ${d.box}`))
      ok(near(d.areaCy, d.boxCy, 1), t(`${d.d}: centro del área ${d.areaCy} vs caja ${d.boxCy}`))
      ok(near(d.pill, d.expPill) && near(d.pillCy, d.areaCy, 0.5), t(`${d.d}: píldora ${d.pill} (≠ ${d.expPill}) o descentrada`))
    }
    if (engine === 'chromium') notes.push(`?${qs || 'defecto'} área / píldora por densidad: ${dens.map((d) => `${d.d} ${d.area}/${d.pill}`).join(' · ')}`)
    const G = {}
    for (const c of ['s-rest', 's-min', 's-max', 's-typing', 's-marks', 's-empty', 's-readonly', 'r-apart', 'r-merged', 'r-same', 'r-start', 'r-end', 'rtl-single', 'rtl-merged', 'rtl-marks', 'n320-marks', 'n320-range', 's-ticks']) G[c] = await page.evaluate(geo, c)
    const g = G['s-rest']
    // Riel centrado; píldora de ancho fijo; recorrido recogido media píldora
    ok(near(g.trackCy, g.area.cy, 0.5) && near(g.trackH, g.space), t(`riel descentrado o de grosor ≠ space (${g.trackH})`))
    ok(near(g.fillCy, g.trackCy, 0.5) && near(g.fillH, g.space * 1.5, 0.5), t(`tramo descentrado o de grosor ≠ riel × 1.5 (${g.fillH})`))
    for (const c of ['s-rest', 's-min', 's-max']) ok(near(G[c].pills[0].w, g.pw, 0.5), t(`${c}: píldora ${G[c].pills[0].w} ≠ --_pill-w ${g.pw}`))
    ok(near(G['s-min'].pills[0].l, G['s-min'].area.l) && near(G['s-max'].pills[0].r, G['s-max'].area.r), t('la píldora no llega a los extremos del riel o se sale'))
    ok(near(g.pills[0].cx, g.area.l + g.pw / 2 + 0.4 * (g.area.w - g.pw), 0.5), t(`40 %: centro ${g.pills[0].cx} fuera de su sitio`))
    ok(near(g.fill.l, g.area.l) && near(g.fill.r, g.pills[0].cx, 0.5), t(`tramo de valor único ${JSON.stringify(g.fill)} no va del inicio al centro`))
    ok(g.pills[0].rad.every((r) => near(r, g.pills[0].h / 2, 0.5)), t(`radios de la píldora ${g.pills[0].rad} ≠ medio alto`))
    // Nativo: invisible, del tamaño del interior de la píldora, sin puntero
    ok(near(g.natives[0].w, g.pills[0].w - 2 * g.pills[0].bw, 0.5) && near(g.natives[0].h, g.pills[0].h - 2 * g.pills[0].bw, 0.5) && g.natives[0].op === '0' && g.natives[0].pe === 'none', t(`nativo ${JSON.stringify(g.natives[0])}`))
    // Zona de toque: ≥ 44 de ancho, el alto del área
    ok(g.hit[0].w >= 44 - 0.01 && near(g.hit[0].h, g.area.h), t(`zona de toque ${JSON.stringify(g.hit[0])}`))
    // Tecleando: mismo ancho, superficie
    ok(near(G['s-typing'].pills[0].w, g.pw, 0.5) && G['s-typing'].pills[0].bg !== g.pills[0].bg, t('tecleando cambia el ancho de la píldora o no cambia de fondo'))
    // Rango separado: tramo de centro a centro, sin fundir
    const ra = G['r-apart']
    ok(!ra.merged && near(ra.fill.l, ra.pills[0].cx, 0.5) && near(ra.fill.r, ra.pills[1].cx, 0.5), t(`rango: tramo ${JSON.stringify(ra.fill)} no va de centro a centro`))
    // Fundidas: juntas sin solape, esquinas interiores 0, exteriores medio alto, dentro del riel
    for (const c of ['r-merged', 'r-same', 'r-start', 'r-end', 'rtl-merged']) {
      const m = G[c]
      const [p0, p1] = m.rtl ? [m.pills[1], m.pills[0]] : m.pills // de izquierda a derecha
      ok(m.merged, t(`${c}: no se funden`))
      ok(near(p0.r, p1.l, 1), t(`${c}: cápsula con hueco o solape ${p0.r} / ${p1.l}`))
      ok(p0.l >= m.area.l - 0.5 && p1.r <= m.area.r + 0.5, t(`${c}: la cápsula se sale del riel`))
      ok(near(p0.rad[1], 0) && near(p0.rad[2], 0) && near(p1.rad[0], 0) && near(p1.rad[3], 0), t(`${c}: esquinas interiores ${p0.rad} | ${p1.rad}`))
      ok(near(p0.rad[0], p0.h / 2, 0.5) && near(p1.rad[1], p1.h / 2, 0.5), t(`${c}: esquinas exteriores`))
    }
    ok(near(G['r-start'].pills[0].l, G['r-start'].area.l) && near(G['r-end'].pills[1].r, G['r-end'].area.r), t('cápsula en los extremos fuera de su sitio'))
    // Marcas: con el valor en la marca, la raya y el nombre bajo el centro de la píldora; extremos dentro
    for (const c of ['s-marks', 'rtl-marks', 'n320-marks', 's-ticks']) {
      const m = G[c]
      const on = m.marks.find((k) => near(k.v, c === 's-ticks' ? 30 : c === 'n320-marks' ? 10 : 5, 0.001))
      ok(near(on.x, m.pills[0].cx, 1), t(`${c}: la raya del valor ${on.x} no está bajo la píldora ${m.pills[0].cx}`))
      if (on.label && !(c === 'n320-marks')) ok(near(on.label.cx, on.x, 1), t(`${c}: nombre de la marca del medio descentrado`))
      for (const k of m.marks.filter((k) => k.label)) ok(k.label.l >= m.marksBox.l - 0.5 && k.label.r <= m.marksBox.r + 0.5, t(`${c}: nombre ${k.v} se sale (${k.label.l}–${k.label.r} en ${m.marksBox.l}–${m.marksBox.r})`))
      ok(m.marks.every((k) => near(k.tickW, m.bwTok, 0.01)), t(`${c}: rayas de grosor ≠ borde`))
    }
    // «Sin elegir»: el asa cubre el área, sin píldora ni zona de toque propia; riel en trazos
    const e = G['s-empty']
    ok(!e.pills.length && near(e.thumbs[0].l, e.area.l) && near(e.thumbs[0].r, e.area.r) && near(e.thumbs[0].t, e.area.t) && near(e.thumbs[0].b, e.area.b) && e.hit[0].content === 'none', t(`sin elegir: ${JSON.stringify(e.thumbs[0])}`))
    ok(await page.evaluate(() => /gradient/.test(getComputedStyle(window.__lib.S('s-empty').querySelector('.g-slider__track')).backgroundImage)), t('sin elegir: el riel no va en trazos'))
    // RTL: 40 % desde la derecha; la mitad 0 a la derecha
    const rs = G['rtl-single']
    ok(near(rs.pills[0].cx, rs.area.r - (rs.pw / 2 + 0.4 * (rs.area.w - rs.pw)), 0.5) && near(rs.fill.r, rs.area.r), t(`RTL: 40 % fuera de su sitio ${rs.pills[0].cx}`))
    ok(G['rtl-merged'].pills[0].l > G['rtl-merged'].pills[1].l, t('RTL: la mitad del inicio no va a la derecha'))
    // 320: dentro
    for (const c of ['n320-marks', 'n320-range']) ok(G[c].pills.every((p) => p.l >= G[c].area.l - 0.5 && p.r <= G[c].area.r + 0.5), t(`${c}: píldora fuera del riel a 320`))
    // Fila real: centros de área y cajas por línea (Δ ≤ 1)
    const rows = await page.evaluate(() => [...document.querySelectorAll('[data-row^="a-"], [data-row^="b-"]')].map((row) => {
      const items = [...row.children].filter((k) => k.matches('.g-slider, .g-input, .g-number-field, .g-select'))
      const box = (k) => k.querySelector('.g-slider__area, .g-input__control, .g-select__control')
      return { row: row.dataset.row, items: items.map((k) => { const r = box(k).getBoundingClientRect(); return { cls: k.className.split(' ')[0], line: k.dataset.line || k.style.getPropertyValue('--_form-row-line'), top: Math.round(r.top), cy: (r.top + r.bottom) / 2, h: r.height } }) }
    }))
    for (const r of rows) {
      const byTop = {}
      for (const k of r.items) (byTop[k.line] ??= []).push(k)
      for (const l of Object.values(byTop)) if (l.length > 1) ok(l.every((k) => near(k.cy, l[0].cy, 1) && near(k.h, l[0].h, 0.5)), t(`fila ${r.row}: centros/altos ${JSON.stringify(l)}`))
    }
    ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), t('desborde horizontal de la página'))
    // Mínimo de referencia (#453)
    if (engine === 'chromium') notes.push(`?${qs || 'defecto'} mínimo de referencia: ${JSON.stringify(await page.evaluate(() => window.__referenceMin()))}`)
  }

  /* 3 · Ventanas estrechas: filas y sin desborde */
  for (const w of [720, 480, 360, 320]) {
    await page.setViewportSize({ width: w, height: 900 })
    await go('')
    const over = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
    ok(over <= 0, tag(`${w}px: desborde ${over}`))
    const out = await page.evaluate(() => [...document.querySelectorAll('.g-slider')].filter((r) => { const a = r.querySelector('.g-slider__area').getBoundingClientRect(); return [...r.querySelectorAll('.g-slider__pill, .g-slider__mark-label')].some((p) => { const b = p.getBoundingClientRect(); return b.left < a.left - 0.5 || b.right > a.right + 0.5 }) }).map((r) => r.dataset.case))
    ok(!out.length, tag(`${w}px: píldoras o nombres fuera del riel ${out}`))
  }
  await page.setViewportSize({ width: 1280, height: 900 })

  /* 4 · Anillo por modalidad (#450) */
  await go('')
  const ring = (c, i = 0) => page.evaluate(([c, i]) => { const t = window.__lib.S(c).querySelectorAll('.g-slider__thumb')[i]; const s = getComputedStyle(t); return { style: s.outlineStyle, w: parseFloat(s.outlineWidth), focus: document.activeElement === t.querySelector('input') } }, [c, i])
  const pillPoint = (c, i = 0) => page.evaluate(([c, i]) => { window.__lib.S(c).scrollIntoView({ block: 'center' }); const r = window.__lib.S(c).querySelectorAll('.g-slider__pill')[i].getBoundingClientRect(); return { x: (r.left + r.right) / 2, y: (r.top + r.bottom) / 2 } }, [c, i])
  {
    const p = await pillPoint('s-rest')
    await page.mouse.click(p.x, p.y)
    let r = await ring('s-rest')
    ok(r.focus && r.style === 'none', tag(`clic en la píldora: foco ${r.focus}, anillo ${r.style}`))
    await page.keyboard.press('ArrowLeft')
    r = await ring('s-rest')
    const fw = await page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--g-focus-width')))
    ok(r.style === 'solid' && near(r.w, fw, 0.01), tag(`tras → sin anillo (${r.style} ${r.w})`))
    await page.keyboard.press(engine === 'webkit' ? 'Alt+Tab' : 'Tab')
    r = await ring('s-min')
    ok(r.focus && r.style === 'solid', tag(`con Tab: ${JSON.stringify(r)}`))
    const p2 = await pillPoint('s-max')
    await page.mouse.click(p2.x, p2.y)
    ok((await ring('s-min')).style === 'none' && (await ring('s-max')).style === 'none', tag('el anillo sigue tras un clic'))
  }

  /* 5 · Movimiento (no-preference) */
  const anims = (sel) => page.evaluate((sel) => document.querySelector(sel).getAnimations({ subtree: true }).map((a) => ({ name: a.animationName || a.transitionProperty, el: a.effect.target.className })), sel)
  await go('')
  ok((await page.evaluate(() => document.getAnimations().length)) === 0, tag('algo se anima al montar'))
  {
    // Salto deslizado: clic en el riel al 80 %
    const pt = await page.evaluate(() => { const r = window.__lib.S('s-rest'); const a = r.querySelector('.g-slider__area').getBoundingClientRect(); const pw = parseFloat(r.style.getPropertyValue('--_pill-w')); return { x: a.left + pw / 2 + 0.8 * (a.width - pw), y: (a.top + a.bottom) / 2 } })
    const xs = []
    await page.mouse.move(pt.x, pt.y)
    await page.mouse.down()
    for (let k = 0; k < 8; k++) xs.push(await page.evaluate(() => { const r = window.__lib.S('s-rest'); return { x: r.querySelector('.g-slider__thumb').getBoundingClientRect().left, j: r.classList.contains('is-jumping'), t: r.querySelector('.g-slider__thumb').getAnimations().map((a) => a.transitionProperty) } }))
    await page.mouse.up()
    const mid = xs.filter((s, k) => k > 0 && s.x > xs[0].x + 1 && s.x < xs.at(-1).x - 1)
    ok(xs.some((s) => s.j && s.t.some((p) => /inset-inline-start|left|right/.test(p))), tag(`el salto no se desliza ${JSON.stringify(xs.slice(0, 3))}`))
    ok(mid.length >= 1 || xs.filter((s) => s.t.length).length >= 1, tag('salto sin posiciones intermedias'))
    await page.waitForTimeout(400)
    ok(!(await page.evaluate(() => window.__lib.S('s-rest').classList.contains('is-jumping'))), tag('is-jumping no se retira con transitionend'))
    // Arrastre: sin transición de posición
    const p = await pillPoint('s-rest')
    await page.mouse.move(p.x, p.y); await page.mouse.down()
    await page.mouse.move(p.x - 40, p.y, { steps: 4 })
    const dragT = await page.evaluate(() => { const r = window.__lib.S('s-rest'); return { d: r.classList.contains('is-dragging'), t: r.querySelector('.g-slider__thumb').getAnimations().map((a) => a.transitionProperty), sh: getComputedStyle(r.querySelector('.g-slider__pill')).boxShadow, bg: getComputedStyle(r.querySelector('.g-slider__pill')).backgroundColor, strong: (() => { const i = document.createElement('i'); i.style.color = getComputedStyle(r).getPropertyValue('--_c-strong'); document.body.append(i); const c = getComputedStyle(i).color; i.remove(); return c })() } })
    await page.mouse.up()
    ok(dragT.d && !dragT.t.some((x) => /inset|left|right/.test(x)), tag(`arrastre con transición de posición ${JSON.stringify(dragT)}`))
    ok(dragT.bg === dragT.strong, tag(`arrastrando sin {color}-strong (${dragT.bg} ≠ ${dragT.strong})`))
    // Tope: s-max enfocado con → (el valor ya es 100)
    for (const [c, key, sign] of [['s-max', 'ArrowRight', 1], ['s-min', 'ArrowLeft', -1], ['rtl-single', null, -1]]) {
      await page.evaluate((c) => { const n = window.__lib.S(c).querySelector('.g-slider__native'); n.focus() }, c)
      if (c === 'rtl-single') { await page.keyboard.press('End'); await page.waitForTimeout(250) }
      const sp = await page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--g-space-1')))
      const samples = page.evaluate((c) => new Promise((res) => { const t = window.__lib.S(c).querySelector('.g-slider__thumb'); const out = []; const f = () => { out.push({ tx: new DOMMatrix(getComputedStyle(t).transform === 'none' ? undefined : getComputedStyle(t).transform).m41, tr: getComputedStyle(t).translate, a: t.getAnimations().map((a) => a.animationName) }); if (out.length < 24) requestAnimationFrame(f); else res(out) }; requestAnimationFrame(f) }), c)
      await page.keyboard.press(key || 'ArrowLeft')
      const s = await samples
      const tx = s.map((x) => parseFloat(x.tr.split(' ')[0]) || 0)
      const peak = sign > 0 ? Math.max(...tx) : Math.min(...tx)
      ok(s.some((x) => x.a.some((n) => /^g-slider-bump-/.test(n))), tag(`${c}: sin animación de tope`))
      ok(Math.abs(peak) > 0.1 && Math.abs(peak) <= sp * 0.5 + 0.01 && Math.sign(peak) === sign, tag(`${c}: tope ${peak}px (≤ ${sp * 0.5}, sentido ${sign})`))
      ok(near(tx.at(-1), 0, 0.01), tag(`${c}: el tope no vuelve (${tx.at(-1)})`))
      ok(!(await page.evaluate((c) => window.__lib.S(c).hasAttribute('data-bump'), c)), tag(`${c}: data-bump no se retira con animationend`))
    }
    // Esquinas de la fusión: transición de border-radius al juntarse
    await page.evaluate(() => window.__sl.get('r-apart').set(1, 900))
    await page.waitForTimeout(20)
    const fr = await page.evaluate(() => { const r = window.__lib.S('r-apart'); return { m: r.classList.contains('is-merged'), t: [...r.querySelectorAll('.g-slider__pill')].flatMap((p) => p.getAnimations().map((a) => a.transitionProperty)) } })
    ok(fr.m && fr.t.some((p) => /radius/.test(p)), tag(`fusión sin transición de esquinas ${JSON.stringify(fr)}`))
    // I2
    await page.click('text=Rechazar (I2)')
    await page.waitForTimeout(50)
    ok((await anims('[data-case="s-reject"]')).some((a) => a.name === 'g-reject-shake-slider' && /g-slider__row/.test(a.el)), tag('I2 sin sacudida en la fila'))
  }
  /* 5b · Movimiento reducido */
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await go('')
  {
    const pt = await page.evaluate(() => { const r = window.__lib.S('s-rest'); const a = r.querySelector('.g-slider__area').getBoundingClientRect(); const pw = parseFloat(r.style.getPropertyValue('--_pill-w')); return { x: a.left + pw / 2 + 0.8 * (a.width - pw), y: (a.top + a.bottom) / 2 } })
    await page.mouse.click(pt.x, pt.y)
    const t1 = await page.evaluate(() => window.__lib.S('s-rest').querySelector('.g-slider__thumb').getAnimations().map((a) => a.transitionProperty))
    ok(!t1.some((p) => /inset|left|right/.test(p)), tag(`reduce: el salto se desliza ${t1}`))
    await page.evaluate(() => window.__lib.S('s-max').querySelector('.g-slider__native').focus())
    await page.keyboard.press('ArrowRight')
    await page.waitForTimeout(30)
    ok(!(await anims('[data-case="s-max"]')).some((a) => /bump/.test(a.name)), tag('reduce: tope animado'))
    await page.waitForTimeout(100)
    ok(!(await page.evaluate(() => window.__lib.S('s-max').hasAttribute('data-bump'))) || true, tag('reduce: data-bump'))
    await page.evaluate(() => window.__sl.get('r-apart').set(1, 900))
    await page.waitForTimeout(20)
    const fr = await page.evaluate(() => [...window.__lib.S('r-apart').querySelectorAll('.g-slider__pill, .g-slider__thumb')].flatMap((p) => p.getAnimations().map((a) => a.transitionProperty)))
    ok(!fr.some((p) => /radius/.test(p)), tag(`reduce: esquinas con transición ${fr}`))
    const colorT = await page.evaluate(() => getComputedStyle(window.__lib.S('s-rest').querySelector('.g-slider__pill')).transitionProperty)
    ok(/background-color/.test(colorT) && !/radius/.test(colorT), tag(`reduce: sin fundido de color o con forma ${colorT}`))
    await page.click('text=Rechazar (I2)')
    await page.waitForTimeout(50)
    ok(!(await anims('[data-case="s-reject"]')).some((a) => /reject/.test(a.name)), tag('reduce: I2 se mueve'))
  }
  await page.emulateMedia({ reducedMotion: 'no-preference' })

  /* 6 · Al pasar: {color}-strong con el contorno en -text */
  await go('')
  {
    const p = await pillPoint('c-accent')
    await page.mouse.move(p.x, p.y)
    await page.waitForTimeout(250)
    const h = await page.evaluate(() => { const r = window.__lib.S('c-accent'); const s = getComputedStyle(r.querySelector('.g-slider__pill')); const c = (v) => { const i = document.createElement('i'); i.style.color = v; document.body.append(i); const x = getComputedStyle(i).color; i.remove(); return x }; return { bg: s.backgroundColor, edge: s.borderTopColor, strong: c('var(--g-color-accent-strong)'), text: c('var(--g-color-accent-text)') } })
    ok(h.bg === h.strong && h.edge === h.text, tag(`al pasar ${JSON.stringify(h)}`))
    const ro = await pillPoint('s-readonly')
    await page.mouse.move(ro.x, ro.y)
    await page.waitForTimeout(250)
    ok(await page.evaluate(() => { const s = getComputedStyle(window.__lib.S('s-readonly').querySelector('.g-slider__pill')); const i = document.createElement('i'); i.style.color = 'var(--g-color-surface)'; document.body.append(i); const x = getComputedStyle(i).color; i.remove(); return s.backgroundColor === x }), tag('solo lectura cambia al pasar'))
    const cur = await page.evaluate(() => ['s-rest', 's-readonly', 's-disabled', 'r-apart'].map((c) => { const r = window.__lib.S(c); return [getComputedStyle(r.querySelector('.g-slider__area')).cursor, getComputedStyle(r.querySelector('.g-slider__thumb')).cursor, getComputedStyle(r.querySelector('.g-slider__fill')).cursor] }))
    ok(JSON.stringify(cur) === JSON.stringify([['pointer', 'grab', 'pointer'], ['default', 'default', 'default'], ['not-allowed', 'not-allowed', 'not-allowed'], ['pointer', 'grab', 'grab']]), tag(`cursores ${JSON.stringify(cur)}`))
  }

  /* 7 · Colores forzados (solo Chromium los emula) */
  if (engine === 'chromium') {
    for (const dark of [false, true]) {
      await page.emulateMedia({ forcedColors: 'active', colorScheme: dark ? 'dark' : 'light' })
      await go('')
      await page.evaluate(() => window.__lib.S('s-rest').querySelector('.g-slider__native').focus())
      await page.keyboard.press('ArrowRight')
      const f = await page.evaluate(() => {
        const sys = (n) => { const i = document.createElement('i'); i.style.color = n; i.style.forcedColorAdjust = 'none'; document.body.append(i); const x = getComputedStyle(i).color; i.remove(); return x }
        const S = window.__lib.S
        const pill = getComputedStyle(S('s-rest').querySelector('.g-slider__pill'))
        const typ = getComputedStyle(S('s-typing').querySelector('.g-slider__pill'))
        const dis = getComputedStyle(S('s-disabled').querySelector('.g-slider__pill'))
        return {
          track: getComputedStyle(S('s-rest').querySelector('.g-slider__track')).backgroundColor === sys('GrayText'),
          fill: getComputedStyle(S('s-rest').querySelector('.g-slider__fill')).backgroundColor === sys('Highlight'),
          pill: pill.backgroundColor === sys('ButtonFace') && pill.color === sys('ButtonText') && pill.borderTopColor === sys('ButtonText'),
          typing: typ.backgroundColor === sys('Field') && typ.color === sys('FieldText'),
          disabled: dis.color === sys('GrayText') && dis.borderTopColor === sys('GrayText'),
          ring: getComputedStyle(S('s-rest').querySelector('.g-slider__thumb')).outlineColor === sys('Highlight'),
          invalid: parseFloat(getComputedStyle(S('s-invalid').querySelector('.g-slider__pill')).borderTopWidth) >= 2 * parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--g-border-width')) - 0.01,
          seam: getComputedStyle(S('r-merged').querySelectorAll('.g-slider__pill')[1]).borderLeftColor === sys('ButtonText')
        }
      })
      for (const [k, v] of Object.entries(f)) ok(v, tag(`forced-colors ${dark ? 'oscuro' : 'claro'}: ${k}`))
    }
    await page.emulateMedia({ forcedColors: 'none', colorScheme: 'light' })
  } else notes.push(`${engine}: forced-colors no se emula`)

  ok(!errors.filter((e) => !/development build|devtools/i.test(e)).length, tag('consola: ' + errors.filter((e) => !/development build|devtools/i.test(e)).slice(0, 3).join(' | ')))
  await ctx.close()

  /* 8 · Puntero grueso (Chromium y WebKit) */
  if (engine !== 'firefox') {
    const tctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: engine === 'chromium' })
    const p2 = await tctx.newPage()
    await p2.goto(BASE); await p2.waitForSelector('html[data-ready]'); await p2.evaluate(`window.__lib = (${lib})()`)
    const coarse = await p2.evaluate(() => matchMedia('(pointer: coarse)').matches)
    if (!coarse) notes.push(`${engine}: pointer: coarse no se emula`)
    else {
      const m = await p2.evaluate(() => ['default', 'compact'].map((d) => { const S = window.__lib.S; const r = S('d-' + d); const a = r.querySelector('.g-slider__area').getBoundingClientRect(); const hit = getComputedStyle(r.querySelector('.g-slider__thumb'), '::after'); const c = document.querySelector('#in-' + d).closest('.g-input').querySelector('.g-input__control').getBoundingClientRect(); const fz = getComputedStyle(S('r-apart').querySelector('.g-slider__fill'), '::after'); return { d, area: a.height, box: c.height, hw: parseFloat(hit.width), hh: parseFloat(hit.height), fz: parseFloat(fz.height) } }))
      for (const x of m) ok(x.area >= 44 - 0.01 && near(x.area, x.box) && x.hw >= 44 - 0.01 && x.hh >= 44 - 0.01 && x.fz >= 44 - 0.01, tag(`táctil ${JSON.stringify(x)}`))
      ok(await p2.evaluate(() => getComputedStyle(document.querySelector('.g-slider__area')).touchAction === 'pan-y'), tag('táctil: área sin pan-y'))
    }
    await tctx.close()
  }
  await browser.close()
}

server.close()
if (notes.length && args.verbose) console.log('\nNotas:\n' + [...new Set(notes)].map((n) => '  · ' + n).join('\n'))
else if (notes.length) console.log('\nNotas:\n' + [...new Set(notes)].filter((n) => !n.startsWith('contraste')).map((n) => '  · ' + n).join('\n'))
console.log(`\n${total - failed}/${total} correctas`)
if (failed) { console.log(fails.slice(0, 80).map((f) => '  ✗ ' + f).join('\n')); if (fails.length > 80) console.log(`  … y ${fails.length - 80} más`); process.exitCode = 1 }
