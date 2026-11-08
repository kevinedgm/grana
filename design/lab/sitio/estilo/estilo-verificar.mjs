// Verificación de coco sobre el banco del marco del sitio (design/lab/sitio/estilo/estilo-banco.html): CSS real de
// GPageIndex.css, GSidebar.css (filtro del índice y código del item) y GMenu.css (aria-current="location") en la capa
// grana.components sobre los tokens y componentes de dist/.
// Mide: análisis estático del CSS nuevo (sin literales de color ni de medida salvo 24px/44px/16px de coarse, sin respaldos, sin
// !important ni @layer salvo la línea de orden, sin keyframes, movimiento solo con no-preference, hover solo con (hover: hover),
// #383, forced-colors); contraste en 14 temas claro y oscuro (texto ≥ 4,5:1, formas y bordes de control ≥ 3:1) en reposo,
// hover, expandido, asiento lleno, rama hueca y barra de la lista; geometría (Δ0 del disparador entre secciones, misma altura
// que GBtn, tope con etiqueta larga, filtro que no se mueve al enfocar y escribir, hint dentro de la cabecera, áreas ≥ 24 y
// ≥ 44 con puntero grueso, código que cabe en el asiento, RTL); movimiento (fases, ráfaga instantánea, reducido = solo
// fundido); forced-colors; consola limpia.
// Ejecutar desde la raíz del repo (requiere dist/):  GRANA_PW_PORT=4232 node design/lab/sitio/estilo/estilo-verificar.mjs
// Opcional: --engines=chromium,firefox,webkit  --themes=all|base  --verbose
import http from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const pw = await import(new URL('../../theme-playground/node_modules/playwright/index.mjs', import.meta.url))
const ROOT = fileURLToPath(new URL('../../../../', import.meta.url))
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
await new Promise((r) => server.listen(Number(process.env.GRANA_PW_PORT) || 4232, '127.0.0.1', r))
const BASE = `http://127.0.0.1:${server.address().port}/design/lab/sitio/estilo/estilo-banco.html`
const GEN = ['amazon', 'apple', 'caracol-purpura', 'github', 'grana', 'linear', 'lustre', 'medium', 'notion', 'spotify', 'stripe']
const THEMES = args.themes === 'base' ? [''] : ['', ...GEN]
let total = 0, failed = 0
const fails = [], notes = []
const ok = (cond, msg) => { total++; if (!cond) { failed++; fails.push(msg) } }
const note = (s) => notes.push(s)

/* ---------- 0 · Análisis estático ---------- */
{
  const pi = await readFile(join(ROOT, 'packages/vue/src/components/GPageIndex/GPageIndex.css'), 'utf8')
  const sb = await readFile(join(ROOT, 'packages/vue/src/components/GSidebar/GSidebar.css'), 'utf8')
  const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '')
  const a = sb.indexOf('/* ---------- Filtro del índice'), b = sb.indexOf('/* ---------- Región de navegación')
  const c = sb.indexOf('.g-sidebar__icon[data-code]')
  const sbNew = strip(sb.slice(a, b) + '\n' + sb.slice(c, c + 400))
  ok(a > 0 && b > a && c > 0, 'GSidebar.css: faltan los bloques del filtro o del código')
  const defaults = await readFile(join(ROOT, 'packages/vue/src/styles/defaults.css'), 'utf8')
  const defined = new Set([...defaults.matchAll(/(--g-[a-z0-9-]+)\s*:/g)].map((m) => m[1]))
  for (const [name, css, raw] of [['GPageIndex.css', strip(pi), pi], ['GSidebar.css (nuevo)', sbNew, sb]]) {
    ok(!/#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|lab|lch|hwb|color|color-mix)\(/.test(css), name + ': color literal')
    ok(!/var\(\s*--[\w-]+\s*,/.test(css), name + ': var() con valor de respaldo')
    ok(!/!important/.test(css) && !/@layer/.test(css.replace(/^\s*@layer[^;]*;/, '')), name + ': !important o @layer')
    const vars = [...css.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1])
    ok(vars.every((v) => v.startsWith('--g-') || v.startsWith('--_')), name + ': var() que no es --g-* ni --_*')
    const missing = [...new Set(vars.filter((v) => v.startsWith('--g-') && !defined.has(v)))]
    ok(!missing.length, name + ': tokens que no existen en defaults.css ' + missing)
    const px = [...css.matchAll(/(-?\d*\.?\d+)px/g)].map((m) => m[0]).filter((p) => !['24px', '44px', '16px', '0px', '1px'].includes(p) && p !== '0.5px')
    ok(!px.length, name + ': medidas literales no permitidas ' + px)
    ok(!/@keyframes|animation\s*:/.test(css), name + ': keyframes o animation')
    ok(!/ease-spring|ease-bounce/.test(css), name + ': muelle o rebote (relevo y filtro no lo llevan)')
    ok(!/\bfont-family\s*:\s*(?!var\()\S/.test(css), name + ': pila de fuentes literal')
  }
  ok(raw1(pi).startsWith('@layer grana.defaults, grana.components, grana.blocks, grana.utilities;'), 'GPageIndex.css: primera línea = orden de las cuatro capas')
  ok(!/:hover/.test(strip(pi).replace(/@media \(hover: hover\)\s*\{[^}]*\{[^}]*\}\s*\}/g, '')), 'GPageIndex.css: :hover fuera de (hover: hover)')
  // movimiento: translate solo bajo no-preference
  const outside = strip(pi).replace(/@media \(prefers-reduced-motion: no-preference\)\s*\{[\s\S]*?\n\}\n/, '')
  ok(!/transition:[^;]*translate/.test(outside.replace(/\.g-page-index__current\.is-burst[^}]*\}/, '')), 'GPageIndex.css: transición de translate fuera de no-preference')
  ok(/@media \(forced-colors: active\)/.test(pi) && /@media \(forced-colors: active\)/.test(sb), 'falta forced-colors')
  ok(/ui-monospace|monospace/.test(pi + sb) === false, 'sin pila monoespaciada literal')
  ok(/:is\(\[aria-current="page"\], \[aria-current="location"\]\)/.test(await readFile(join(ROOT, 'packages/vue/src/components/GMenu/GMenu.css'), 'utf8')), 'GMenu.css: aria-current="location" no está en la marca de la actual')
}
function raw1(s) { return s.split('\n')[0] }

/* ---------- En la página ---------- */
const lib = () => {
  const cv = document.createElement('canvas'); cv.width = cv.height = 1
  const cx = cv.getContext('2d', { willReadFrequently: true })
  const parse = (s) => { cx.clearRect(0, 0, 1, 1); cx.fillStyle = '#000'; cx.fillStyle = s; cx.fillRect(0, 0, 1, 1); const d = cx.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255] }
  const over = (top, bot) => { const a = top[3]; return [top[0] * a + bot[0] * (1 - a), top[1] * a + bot[1] * (1 - a), top[2] * a + bot[2] * (1 - a), 1] }
  const bgOf = (el, pseudo) => {
    const layers = []
    if (pseudo) { const c = parse(getComputedStyle(el, pseudo).backgroundColor); if (c[3] > 0) layers.push(c) }
    for (let n = el; n && !(layers.length && layers[layers.length - 1][3] >= 1); n = n.parentElement) { const c = parse(getComputedStyle(n).backgroundColor); if (c[3] > 0) layers.push(c) }
    let base = [255, 255, 255, 1]
    for (let i = layers.length - 1; i >= 0; i--) base = over(layers[i], base)
    return base
  }
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]) }
  const cr = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) }
  const tok = (name) => { const p = document.createElement('i'); p.style.cssText = 'position:fixed;background:var(' + name + ')'; document.body.append(p); const c = parse(getComputedStyle(p).backgroundColor); p.remove(); return c }
  window.L = { parse, bgOf, cr, tok, over }
}
const fmt = (n) => Math.round(n * 100) / 100

async function contrastTheme(page, theme, dark) {
  const tag = `[${theme || 'por defecto'}${dark ? ' oscuro' : ''}]`
  const r = await page.evaluate(() => {
    const { parse, bgOf, cr, tok } = window.L
    const out = {}
    const txt = (sel, pseudo) => { const el = document.querySelector(sel); return [parse(getComputedStyle(el).color), bgOf(el, pseudo)] }
    const c = (k, sel, extra) => { const [fg, bg] = txt(sel); out[k] = cr(extra?.fg || fg, extra?.bg || bg) }
    c('piKey', '#pi .g-page-index__key')
    c('piCur', '#pi-cur')
    c('piIcon', '#pi .g-page-index__icon')
    const trg = document.getElementById('pi-trigger')
    out.piBorder = cr(parse(getComputedStyle(trg).borderTopColor), bgOf(trg.parentElement))
    out.piSep = cr(parse(getComputedStyle(trg.querySelector('.g-page-index__value')).borderInlineStartColor), bgOf(trg))
    const soft = tok('--g-color-neutral-soft')
    out.piKeyHover = cr(parse(getComputedStyle(trg.querySelector('.g-page-index__key')).color), soft)
    out.piCurHover = cr(parse(getComputedStyle(document.getElementById('pi-cur')).color), soft)
    // lista de GMenu: etiqueta de la actual y barra
    const loc = document.getElementById('loc')
    out.menuLabel = cr(parse(getComputedStyle(loc.querySelector('.g-menu__label')).color), bgOf(loc))
    out.menuBar = cr(parse(getComputedStyle(loc, '::before').backgroundColor), bgOf(loc))
    // sidebar
    const box = document.getElementById('fbox'), inp = document.getElementById('fin')
    const shell = bgOf(document.getElementById('sb'))
    const surf = bgOf(box)
    out.fInput = cr(parse(getComputedStyle(inp).color), surf)
    out.fPlace = cr(parse(getComputedStyle(inp, '::placeholder').color), surf)
    out.fBorder = cr(parse(getComputedStyle(box).borderTopColor), shell)
    out.fIcon = cr(parse(getComputedStyle(box.querySelector('.g-sidebar__filter-icon')).color), surf)
    out.fHint = cr(parse(getComputedStyle(document.getElementById('fhint')).color), surf)
    const cnt = document.getElementById('fcount')
    out.fCount = cr(parse(getComputedStyle(cnt).color), shell)
    cnt.classList.add('is-empty'); out.fCountEmpty = cr(parse(getComputedStyle(cnt).color), shell); cnt.classList.remove('is-empty')
    const clr = document.getElementById('fclear'); clr.hidden = false
    out.fClear = cr(parse(getComputedStyle(clr).color), surf); clr.hidden = true
    const hl = window.L.over(tok('--g-color-border'), shell)
    // códigos: reposo (en la carcasa), hover (text sobre la luz), rama hueca, lleno, deshabilitado
    const code = (id) => document.querySelector('#' + id + ' .g-sidebar__icon')
    out.codeRest = cr(parse(getComputedStyle(code('s-rest')).color), shell)
    out.codeHover = cr(parse(getComputedStyle(document.querySelector('#s-rest .g-sidebar__label')).color), shell) // color de la etiqueta en reposo (referencia)
    const textTok = tok('--g-color-text')
    out.codeHoverLuz = cr(textTok, hl)
    out.codeBranch = cr(parse(getComputedStyle(code('s-branch')).color), shell)
    out.codeFull = cr(parse(getComputedStyle(code('s-cur')).color), bgOf(code('s-cur'), '::before'))
    out.seatEdge = cr(parse(getComputedStyle(code('s-cur'), '::after').borderTopColor), shell)
    out.dot = cr(tok('--g-color-accent-text'), shell)
    return out
  })
  const T = (k, v, min, what) => ok(v >= min, `${tag} ${what}: ${fmt(v)}:1 < ${min}`)
  T('piKey', r.piKey, 4.5, 'GPageIndex key'); T('', r.piCur, 4.5, 'GPageIndex actual'); T('', r.piIcon, 3, 'GPageIndex chevron')
  T('', r.piBorder, 3, 'GPageIndex borde del control'); T('', r.piSep, 3, 'GPageIndex separador')
  T('', r.piKeyHover, 4.5, 'GPageIndex key en hover/expandido'); T('', r.piCurHover, 4.5, 'GPageIndex actual en hover/expandido')
  T('', r.menuLabel, 4.5, 'GMenu etiqueta de la actual (location)'); T('', r.menuBar, 3, 'GMenu barra de la actual (location)')
  T('', r.fInput, 4.5, 'filtro texto'); T('', r.fPlace, 4.5, 'filtro placeholder'); T('', r.fBorder, 3, 'filtro borde del control')
  T('', r.fIcon, 3, 'filtro icono'); T('', r.fHint, 4.5, 'filtro hint'); T('', r.fCount, 4.5, 'filtro recuento'); T('', r.fCountEmpty, 4.5, 'filtro recuento vacío')
  T('', r.fClear, 3, 'filtro vaciar (glifo)')
  T('', r.codeRest, 4.5, 'código en reposo'); T('', r.codeHoverLuz, 4.5, 'código en hover (text sobre la luz)'); T('', r.codeBranch, 4.5, 'código en la rama hueca')
  T('', r.codeFull, 4.5, 'código en el asiento lleno'); T('', r.seatEdge, 3, 'aro del asiento'); T('', r.dot, 3, 'punto del botón de filtro del riel')
  return r
}

async function geometry(page, engine, coarse) {
  const tag = `[${engine}${coarse ? ' táctil' : ''}]`
  // Δ0 del disparador y altura frente a GBtn
  const w = []
  for (const t of ['API', 'Ejemplos', 'Teclado y foco', 'Accesibilidad y lectores de pantalla']) {
    await page.evaluate((t) => window.relay(t, 'down', true), t)
    w.push(await page.evaluate(() => document.getElementById('pi-trigger').getBoundingClientRect().width))
  }
  ok(w.every((x) => Math.abs(x - w[0]) < 0.51), `${tag} Δ0 del disparador entre secciones: ${w.map(fmt)}`)
  const h = await page.evaluate(() => ({ t: document.getElementById('pi-trigger').getBoundingClientRect().height, b: document.getElementById('sib').getBoundingClientRect().height }))
  if (coarse) ok(h.t >= 44 - 0.01, `${tag} disparador ≥ 44: ${h.t}`)
  else { ok(Math.abs(h.t - h.b) <= 0.51, `${tag} disparador y GBtn miden lo mismo: ${h.t} / ${h.b}`); ok(h.t >= 24, `${tag} disparador ≥ 24`) }
  const n = await page.evaluate(() => { const t = document.querySelector('#pi2 .g-page-index__trigger').getBoundingClientRect(), s = document.getElementById('shelf-narrow').getBoundingClientRect(); return { r: t.right, s: s.right, w: t.width } })
  ok(n.r <= n.s + 0.5, `${tag} etiqueta larga: el disparador desborda su zócalo (${n.r} > ${n.s})`)
  const el = await page.evaluate(() => { const c = document.getElementById('pi-cur'); c.textContent = 'Accesibilidad y lectores de pantalla'; const s = getComputedStyle(c); const tr = document.querySelector('#pi .g-page-index__trigger').getBoundingClientRect(); const r = c.getBoundingClientRect(); return { ell: s.textOverflow, over: c.scrollWidth > c.clientWidth, in: r.right <= tr.right + 0.5 } })
  ok(el.ell === 'ellipsis' && el.in, `${tag} la actual se acorta con elipsis dentro del disparador`)
  await page.evaluate(() => window.relay('API', 'down', true))
  // Filtro: no se mueve al enfocar, escribir ni vaciar
  const rect = () => page.evaluate(() => { const b = document.getElementById('fbox').getBoundingClientRect(), c = document.getElementById('fcount').getBoundingClientRect(), s = document.getElementById('sb').getBoundingClientRect(); const hint = document.getElementById('fhint'); return { x: b.x, y: b.y, w: b.width, h: b.height, cy: c.y, ch: c.height, sbr: s.right, hr: hint.hidden ? null : hint.getBoundingClientRect().right } })
  const r0 = await rect()
  await page.focus('#fin'); const r1 = await rect()
  await page.keyboard.type('oscuro'); const r2 = await rect()
  const clr = await page.evaluate(() => { const b = document.getElementById('fclear').getBoundingClientRect(), x = document.getElementById('fbox').getBoundingClientRect(); return { w: b.width, h: b.height, inside: b.top >= x.top - 0.01 && b.bottom <= x.bottom + 0.01 && b.right <= x.right + 0.01 } })
  await page.keyboard.press('Control+a'); await page.keyboard.press('Backspace'); const r3 = await rect()
  for (const [i, r] of [r1, r2, r3].entries()) ok(r.x === r0.x && r.y === r0.y && r.w === r0.w && r.h === r0.h && r.cy === r0.cy, `${tag} el filtro se movió en el paso ${i + 1}: ${JSON.stringify(r0)} → ${JSON.stringify(r)}`)
  ok(r0.hr !== null && r0.hr <= r0.sbr - 0.5, `${tag} el hint «/» queda dentro de la cabecera (derecha ${r0.hr} / barra ${r0.sbr})`)
  ok(clr.inside, `${tag} el botón de vaciar queda dentro de la caja`)
  ok(clr.w >= (coarse ? 44 : 24) - 0.01 && clr.h >= (coarse ? 44 : 24) - 0.01, `${tag} área del botón de vaciar ${clr.w}×${clr.h}`)
  ok(r0.h >= (coarse ? 44 : 24) - 0.01, `${tag} la caja del filtro mide ${r0.h}`)
  const fs = await page.evaluate(() => parseFloat(getComputedStyle(document.getElementById('fin')).fontSize))
  ok(fs >= (coarse ? 16 : 12) - 0.01, `${tag} tamaño del texto del filtro ${fs}`)
  const fo = await page.evaluate(() => { document.getElementById('fin').focus(); const s = getComputedStyle(document.getElementById('fbox')); return { w: parseFloat(s.outlineWidth), st: s.outlineStyle } })
  ok(fo.st !== 'none' && fo.w > 0, `${tag} el filtro enfocado muestra anillo`)
  // código en el asiento
  const cd = await page.evaluate(() => [...document.querySelectorAll('#sb .g-sidebar__icon[data-code]')].map((i) => { const s = getComputedStyle(i), seat = i.getBoundingClientRect(); const rg = document.createRange(); rg.selectNodeContents(i); const t = rg.getBoundingClientRect(); return { code: i.dataset.code, fs: parseFloat(s.fontSize), seat: seat.width, tw: t.width, tc: (t.left + t.right) / 2, sc: (seat.left + seat.right) / 2, lab: i.nextElementSibling && i.parentElement.querySelector('.g-sidebar__label').getBoundingClientRect().left - seat.right } }))
  for (const c of cd) { ok(c.fs >= 12, `${tag} código ${c.code}: tamaño ${c.fs}`); ok(c.code.length > 3 || c.tw <= c.seat - 2, `${tag} código ${c.code} (${fmt(c.tw)}) no cabe en el asiento (${fmt(c.seat)})`); ok(Math.abs(c.tc - c.sc) <= 1, `${tag} código ${c.code} descentrado ${fmt(c.tc - c.sc)}`) }
  // el asiento con código no mueve la fila: mismo alto de enlace que sin código
  const hts = await page.evaluate(() => [...document.querySelectorAll('#sb .g-sidebar__link')].map((l) => l.getBoundingClientRect().height))
  ok(hts.every((x) => Math.abs(x - hts[0]) < 0.51), `${tag} filas de distinto alto con código: ${hts}`)
  // punto del riel
  const dot = await page.evaluate(() => { const b = document.getElementById('rbtn'), d = getComputedStyle(b, '::after'), r = b.getBoundingClientRect(); return { disp: d.content, w: parseFloat(d.width), pos: d.position, br: r } })
  ok(dot.content !== 'none' && dot.w >= 8 && dot.w <= 14, `${tag} punto del riel: ${JSON.stringify({ c: dot.disp, w: dot.w })}`)
  const rw = await page.evaluate(() => { const b = document.getElementById('rbtn').getBoundingClientRect(); return { w: b.width, h: b.height } })
  ok(rw.w >= (coarse ? 44 : 24) && rw.h >= (coarse ? 44 : 24), `${tag} botón de filtro del riel ${rw.w}×${rw.h}`)
}

async function motion(page, engine) {
  const tag = `[${engine}]`
  const sample = async (reduce) => {
    await page.emulateMedia({ reducedMotion: reduce ? 'reduce' : 'no-preference' })
    await page.evaluate(() => window.relay('API', 'down', true))
    return page.evaluate(async () => {
      const c = document.getElementById('pi-cur'), out = {}
      const read = () => { const s = getComputedStyle(c); return { o: parseFloat(s.opacity), t: s.translate } }
      out.rest = read()
      c.dataset.dir = 'down'; c.dataset.phase = 'out'
      await new Promise((r) => setTimeout(r, 70)); out.mid = read()
      await new Promise((r) => setTimeout(r, 120)); out.out = read()
      c.textContent = 'Ejemplos'; c.dataset.phase = 'in'; void c.offsetWidth; out.inStart = read()
      await new Promise((r) => requestAnimationFrame(r)); delete c.dataset.phase
      await new Promise((r) => setTimeout(r, 60)); out.inMid = read()
      await new Promise((r) => setTimeout(r, 200)); out.end = read(); delete c.dataset.dir
      // dirección contraria
      c.dataset.dir = 'up'; c.dataset.phase = 'in'; void c.offsetWidth; out.upStart = read(); delete c.dataset.phase; delete c.dataset.dir
      // ráfaga: aunque lleve fase, no hay transición ni desplazamiento
      c.classList.add('is-burst'); c.dataset.phase = 'out'; out.burst = { ...read(), d: getComputedStyle(c).transitionDuration }; c.classList.remove('is-burst'); delete c.dataset.phase
      return out
    })
  }
  const n = await sample(false)
  const ty = (t) => (t === 'none' ? 0 : parseFloat(t.split(' ')[1]))
  ok(n.rest.o === 1 && n.rest.t === 'none', `${tag} reposo: ${JSON.stringify(n.rest)}`)
  ok(n.mid.o < 1 && n.mid.o > 0, `${tag} la saliente se funde (opacidad a los 70 ms ${n.mid.o})`)
  ok(n.out.o === 0 && Math.abs(ty(n.out.t) + 4) < 0.6, `${tag} saliente fuera: opacidad ${n.out.o}, desplazamiento ${n.out.t} (esperado −4px: sube al bajar la lectura)`)
  ok(n.inStart.o === 0 && Math.abs(ty(n.inStart.t) - 4) < 0.6, `${tag} entrada parte invisible 4px por debajo (bajando): ${JSON.stringify(n.inStart)}`)
  ok(n.inMid.o > 0 && n.inMid.o < 1, `${tag} la entrante se funde hacia dentro (${n.inMid.o})`)
  ok(n.end.o === 1 && n.end.t === 'none', `${tag} la entrada llega al reposo: ${JSON.stringify(n.end)}`)
  ok(Math.abs(ty(n.upStart.t) + 4) < 0.6, `${tag} subiendo, la entrada parte 4px por encima: ${n.upStart.t}`)
  ok(n.burst.o === 1 && n.burst.t === 'none' && parseFloat(n.burst.d) === 0, `${tag} ráfaga instantánea: ${JSON.stringify(n.burst)}`)
  const r = await sample(true)
  ok(r.mid.o < 1 && r.mid.t === 'none' && r.out.t === 'none' && r.inStart.t === 'none', `${tag} movimiento reducido: solo fundido (${r.mid.o}, ${r.out.t}, ${r.inStart.t})`)
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  // sin transición al montar: el nodo recién creado ya está en reposo en el primer cuadro
  const mount = await page.evaluate(() => { const c = document.createElement('span'); c.className = 'g-page-index__current'; document.querySelector('#pi .g-page-index__value').append(c); const s = getComputedStyle(c); const r = { o: s.opacity, t: s.translate }; c.remove(); return r })
  ok(mount.o === '1' && mount.t === 'none', `${tag} al montar: ${JSON.stringify(mount)}`)
}

const results = {}
for (const engine of ENGINES) {
  const browser = await pw[engine].launch()
  const errors = []
  for (const dark of [false, true]) {
    for (const th of THEMES) {
      const ctx = await browser.newContext({ viewport: { width: 1100, height: 900 } })
      const page = await ctx.newPage()
      page.on('pageerror', (e) => errors.push(String(e)))
      page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
      await page.goto(`${BASE}?${dark ? 'dark=1&' : ''}${th ? 'theme=' + th : ''}`)
      await page.waitForLoadState('networkidle'); await page.evaluate(() => document.fonts.ready)
      await page.evaluate(lib)
      await contrastTheme(page, th, dark)
      if (!th && !dark) {
        await geometry(page, engine, false)
        await motion(page, engine)
        // RTL
        await page.evaluate(() => { document.documentElement.dir = 'rtl' })
        const rtl = await page.evaluate(() => { const k = document.querySelector('#pi .g-page-index__key').getBoundingClientRect(), v = document.querySelector('#pi .g-page-index__value').getBoundingClientRect(), i = document.querySelector('#pi .g-page-index__icon').getBoundingClientRect(), t = document.getElementById('pi-trigger').getBoundingClientRect(), f = document.getElementById('fbox').getBoundingClientRect(), icon = document.querySelector('#fbox .g-sidebar__filter-icon').getBoundingClientRect(); return { order: k.left > v.left && v.left > i.left, inside: k.right <= t.right && i.left >= t.left, flt: icon.right <= f.right && icon.left > f.left } })
        ok(rtl.order && rtl.inside, `[${engine}] RTL: orden del disparador (clave a la derecha, chevron a la izquierda)`)
        await page.evaluate(() => { document.documentElement.dir = 'ltr' })
        if (engine === 'chromium') {
          await page.emulateMedia({ forcedColors: 'active' })
          const fc = await page.evaluate(() => { const t = document.getElementById('pi-trigger'), g = document.querySelector('#pi .g-page-index__ghost'); return { b: getComputedStyle(t).borderTopColor, vis: getComputedStyle(g).visibility, fb: getComputedStyle(document.getElementById('fbox')).borderTopColor } })
          ok(fc.vis === 'hidden' && fc.b !== 'rgba(0, 0, 0, 0)' && fc.fb !== 'rgba(0, 0, 0, 0)', `[${engine}] forced-colors: bordes visibles y pila oculta ${JSON.stringify(fc)}`)
          await page.emulateMedia({ forcedColors: 'none' })
        }
      }
      await ctx.close()
    }
  }
  // Puntero grueso (Chromium y WebKit emulan táctil)
  if (engine !== 'firefox') {
    const ctx = await browser.newContext({ viewport: { width: 820, height: 900 }, hasTouch: true, isMobile: true })
    const page = await ctx.newPage()
    await page.goto(BASE); await page.waitForLoadState('networkidle'); await page.evaluate(lib)
    const coarse = await page.evaluate(() => matchMedia('(pointer: coarse)').matches)
    if (coarse) await geometry(page, engine, true); else note(`${engine}: el contexto táctil no activa pointer: coarse; no se midió`)
    await ctx.close()
  }
  ok(!errors.length, `[${engine}] consola: ${errors.slice(0, 3)}`)
  await browser.close()
}
server.close()
console.log(`${total - failed}/${total} comprobaciones`)
for (const n of notes) console.log('nota:', n)
for (const f of fails) console.log('FALLA:', f)
process.exit(failed ? 1 : 0)
