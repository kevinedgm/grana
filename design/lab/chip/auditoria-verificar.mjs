// Auditoría de coco (paso 5) de GTag + GTagGroup sobre el COMPONENTE REAL: design/lab/chip/auditoria-banco.html con GTag y
// GTagGroup de dist/tag.umd.js (entrada propia @grana/vue/tag, global GranaTag), GAvatar, GIcon y GBtn de dist/grana.umd.js,
// y dist/grana.css + dist/fonts.css. Repite la batería de estilo-verificar.mjs sobre el real y añade lo que solo existe con
// él: marcado real frente al que espera el CSS (racimo y data-cat, is-plain, nodos de la pista: <span> al final de una GTag
// suelta y <div> al final de la raíz del grupo), CSS publicado (capa y orden), contraste en 42 configuraciones (tema de la
// auditoría y los cuatro del estilo con 8 y 12 categorías, más los once de dark-color-presence/generated, claro y oscuro),
// geometría también con espacio pequeño y texto grande y con el texto al 200 % (hallazgo 1), forma pill y cuadrada, huella
// real (Δ0, --_ghost-w, foco a «Deshacer» tras un clic, deshacer a su sitio con el foco en «Quitar», doble clic, Supr),
// vista previa, tapa invertida, recogida y settle, marca, nada al montar, movimiento reducido, «Quitar todas» y su deshacer
// con el foco, «Ver N más», alternar (clic, Espacio, Intro), recorte con pista, RTL, 320px, forced-colors (Chromium),
// puntero grueso (Chromium y WebKit), consola limpia; y los remates cerrados por bruno en d585178 (#512, #513 y el «Deshacer» con clic de «Quitar todas», hallazgos 2, 3 y 5), que ahora fallan si vuelven.
// Ejecutar desde la raíz del repo:  GRANA_PW_PORT=4213 node design/lab/chip/auditoria-verificar.mjs
// Opcional: GRANA_DIST=<copia de dist/>  --engines=chromium,firefox,webkit  --verbose  --only=0,1,2,…
import http from 'node:http'
import { readFile } from 'node:fs/promises'
import { readFileSync } from 'node:fs'
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
    res.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream' }).end(await readFile(p))
  } catch { if (!res.headersSent) res.writeHead(404).end() }
})
await new Promise((r) => server.listen(Number(process.env.GRANA_PW_PORT) || 4213, '127.0.0.1', r))
const BASE = `http://127.0.0.1:${server.address().port}/design/lab/chip/auditoria-banco.html`

const GEN = ['amazon', 'apple', 'caracol-purpura', 'github', 'grana', 'linear', 'lustre', 'medium', 'notion', 'spotify', 'stripe']
const THEMES = ['auditoria-cat8', 'auditoria-cat12', 'default-cat8', 'default-cat12', 'lustre-cat8', 'lustre-cat12', 'spotify-cat8', 'spotify-cat12', 'propio-cat8', 'propio-cat12', ...GEN]
let total = 0, failed = 0, ENGINE = 'estático'
const fails = [], notes = new Set()
const counts = {}
const ok = (cond, msg) => { total++; counts[ENGINE] = counts[ENGINE] || [0, 0]; counts[ENGINE][1]++; if (cond) counts[ENGINE][0]++; else { failed++; fails.push(`[${ENGINE}] ${msg}`) } }
const TAB = () => (ENGINE === 'webkit' ? 'Alt+Tab' : 'Tab')
const near = (a, b, t = 0.6) => Math.abs(a - b) <= t
const mins = {}
const rec = (row, v, where) => { if (!mins[row] || v < mins[row].v) mins[row] = { v, where } }

/* ---------- 0 · Análisis estático del CSS fuente y del publicado ---------- */
if (run(0)) {
  const defaults = readFileSync(join(ROOT, 'packages/vue/src/styles/defaults.css'), 'utf8')
  const defined = new Set([...defaults.matchAll(/(--g-[a-z0-9-]+)\s*:/g)].map((m) => m[1]))
  const K = '(?:[1-9]|1[0-2])'
  const SHEETS = {
    'GTag/GTag.css': { cat: new RegExp(`^--g-color-(?:cat-${K}(?:-strong|-soft|-text)?|on-cat-${K}(?:-soft)?)$`), alias: /^--_(?:tag-[a-z-]+|ghost-w)$/ },
    'GTagGroup/GTagGroup.css': { cat: new RegExp(`^--g-color-cat-${K}-text$`), alias: /^--_tgg-[a-z-]+$/ }
  }
  for (const [name, rule] of Object.entries(SHEETS)) {
    const css = readFileSync(join(ROOT, 'packages/vue/src/components', name), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
    for (const m of css.matchAll(/var\((--[a-z0-9_-]+)/g)) {
      const v = m[1]
      if (v.startsWith('--g-')) ok(defined.has(v) || rule.cat.test(v), `${name}: ${v} no existe en defaults.css ni es de la familia permitida`)
      else ok(rule.alias.test(v), `${name}: alias ${v} fuera del prefijo`)
    }
    for (const m of css.matchAll(/(--[a-z0-9_-]+)\s*:/g)) ok(rule.alias.test(m[1]) && m[1] !== '--_ghost-w', `${name}: declara ${m[1]}`)
    ok(!/var\([^)]*,/.test(css), `${name}: var() con respaldo`)
    ok(!/#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|lab|lch|color-mix)\(/.test(css), `${name}: color literal`)
    ok(!/@layer|!important|@keyframes|@property/.test(css), `${name}: @layer, !important, @keyframes o @property`)
    ok(!/ease-spring|ease-bounce|cubic-bezier|steps\(/.test(css), `${name}: muelle, rebote o curva propia (#471)`)
    const px = [...css.matchAll(/(-?\d*\.?\d+)px/g)].map((m) => m[1])
    ok(px.every((n) => ['24', '44', '1', '-1'].includes(n)), `${name}: medidas literales ${[...new Set(px)].join(', ')}`)
    ok(![...css.matchAll(/\b\d+m?s\b/g)].length, `${name}: duraciones literales`)
    const outside = css.replace(/@media \(hover: hover\) \{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, '').replace(/@media \(forced-colors: active\) \{[\s\S]*$/, '')
    ok(!/:hover/.test(outside), `${name}: :hover fuera de @media (hover: hover)`)
    ok(!/>\s*\*|:(?:first|last|nth|nth-last)-child(?!\(1 of \.g-tag-group__value\))|~/.test(css), `${name}: selector estructural sin clase (#383)`)
    ok(/@media \(prefers-reduced-motion: reduce\)/.test(css) && /@media \(forced-colors: active\)/.test(css), `${name}: falta movimiento reducido o forced-colors`)
  }
  // Hallazgo 1: el alto nunca baja de la línea de texto + dos bordes (como la caja de GInput)
  const tag = readFileSync(join(ROOT, 'packages/vue/src/components/GTag/GTag.css'), 'utf8')
  const grp = readFileSync(join(ROOT, 'packages/vue/src/components/GTagGroup/GTagGroup.css'), 'utf8')
  ok((tag.match(/--_tag-h: max\(calc\(var\(--g-space-1\) \* [68]\), calc\(var\(--_tag-lh\) \+ var\(--g-border-width\) \* 2\)\);/g) || []).length === 2, 'GTag.css: el alto no crece con su texto (hallazgo 1)')
  ok((grp.match(/--_tgg-h: max\(calc\(var\(--g-space-1\) \* [68]\), calc\(var\(--_tgg-lh\) \+ var\(--g-border-width\) \* 2\)\);/g) || []).length === 2, 'GTagGroup.css: el alto no crece con su texto (hallazgo 1)')
  ok(/@media \(pointer: coarse\)/.test(tag), 'GTag.css: sin puntero grueso')
  // Publicado
  const dcss = readFileSync(join(DISTDIR, 'grana.css'), 'utf8')
  const djs = readFileSync(join(DISTDIR, 'grana.js'), 'utf8')
  const tjs = readFileSync(join(DISTDIR, 'tag.js'), 'utf8')
  const layerAt = dcss.indexOf('@layer grana.components')
  const tagAt = dcss.indexOf('.g-tag{') >= 0 ? dcss.indexOf('.g-tag{') : dcss.indexOf('.g-tag {')
  const grpAt = dcss.indexOf('.g-tag-group{') >= 0 ? dcss.indexOf('.g-tag-group{') : dcss.indexOf('.g-tag-group {')
  ok(layerAt >= 0 && tagAt > layerAt && grpAt > tagAt, `dist: GTag/GTagGroup fuera de @layer grana.components o en otro orden (${layerAt}, ${tagAt}, ${grpAt})`)
  for (const dep of ['.g-avatar', '.g-btn', '.g-icon']) ok(dcss.indexOf(dep) < tagAt, `dist: ${dep} después de GTag`)
  ok(/g-tag__undo/.test(dcss) && /g-tag-group__facet/.test(dcss), 'dist: compuertas g-tag__undo / g-tag-group__facet')
  ok(/--_tag-lh\)\s*\+\s*var\(--g-border-width\)/.test(dcss), 'dist: grana.css sin el arreglo del hallazgo 1 (reconstruir)')
  ok(!/GTag/.test(djs) && /GTag/.test(tjs) && !/\.g-tag\s*\{/.test(tjs), 'dist: GTag en grana.js o CSS en tag.js (#510)')
  ok(!/data:font/.test(dcss), 'dist: fuente incrustada')
}

/* ---------- Utilidades en la página ---------- */
const HELPERS = () => {
  window.$rgb = (s) => { const m = String(s).match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p[3] ?? 1 } }
  window.$mix = (fg, bg) => ({ r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a), a: 1 })
  window.$bg = (el) => {
    const layers = []
    for (let e = el; e; e = e.parentElement) { const c = $rgb(getComputedStyle(e).backgroundColor); if (c && c.a > 0) { layers.push(c); if (c.a >= 1) break } }
    let acc = layers.pop() || { r: 255, g: 255, b: 255, a: 1 }
    while (layers.length) acc = $mix(layers.pop(), acc)
    return acc
  }
  window.$lum = (c) => { const f = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b) }
  window.$cr = (a, b) => { if (!a || !b) return 0; const x = $lum(a), y = $lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) }
  window.$ink = (el, prop = 'color') => { const c = $rgb(getComputedStyle(el)[prop]); return c && c.a < 1 ? $mix(c, $bg(el)) : c }
  // Una GTag suelta por su data-test; en un grupo, «<grupo>-<id>» = `#<grupo> [data-id="<id>"] > .g-tag`; «<grupo>-facet-N»
  window.$t = (t) => {
    const d = document.querySelector(`[data-test="${t}"]`)
    if (d) return d
    for (const g of document.querySelectorAll('.g-tag-group[id]')) {
      if (!t.startsWith(g.id + '-')) continue
      const rest = t.slice(g.id.length + 1)
      const f = rest.match(/^facet-(\d+)$/)
      const el = f ? g.querySelectorAll('.g-tag-group__facet')[+f[1]] : g.querySelector(`[data-id="${rest}"] > .g-tag`)
      if (el) return el
    }
    return null
  }
  window.$sel = (t) => { const e = $t(t); if (!e) return null; e.dataset.q = e.dataset.q || Math.random().toString(36).slice(2); return `[data-q="${e.dataset.q}"]` }
}
const NO_TRANSITIONS = '*, *::before, *::after { transition: none !important; }'
const frames = (page, n = 3) => page.evaluate((k) => new Promise((r) => { const f = () => (k-- > 0 ? requestAnimationFrame(f) : setTimeout(r, 20)); f() }), n)

async function open(page, qs = '') {
  await page.goto(`${BASE}?${qs}`)
  await page.waitForFunction(() => window.BENCH?.ready, null, { timeout: 20000 })
  await page.evaluate(HELPERS)
}
const S = (page, t) => page.evaluate((t) => $sel(t), t)

/* ---------- M · Marcado real frente al que espera el CSS ---------- */
async function markup(page) {
  await open(page, 'theme=default-cat8')
  const bad = await page.evaluate(() => {
    const b = []
    for (const t of document.querySelectorAll('.g-tag')) {
      const id = t.dataset.test || t.closest('[data-id]')?.dataset.id
      const kids = [...t.children]
      if (!/g-tag--size-(sm|md)/.test(t.className)) b.push(`${id}: sin g-tag--size-*`)
      if (!kids[0] || !kids[0].classList.contains('g-tag__body')) b.push(`${id}: el cuerpo no es el primer hijo`)
      const cap = t.querySelector(':scope > .g-tag__remove, :scope > .g-tag__undo')
      if (t.classList.contains('is-removable') !== !!t.querySelector(':scope > .g-tag__remove')) b.push(`${id}: is-removable ≠ tapa`)
      if (cap && kids[1] !== cap) b.push(`${id}: la tapa no sigue al cuerpo`)
      if (cap && !cap.querySelector(':scope > svg') ) b.push(`${id}: la tapa sin svg hijo directo`)
      if (cap && !cap.querySelector(':scope > .g-tag__sr')?.textContent.trim()) b.push(`${id}: la tapa sin nombre en g-tag__sr`)
      const tips = kids.filter((k) => k.classList.contains('g-tooltip'))
      if (t.closest('.g-tag-group') && tips.length) b.push(`${id}: pista dentro de una etiqueta del grupo`)
      if (!t.closest('.g-tag-group')) for (const n of tips) if (n.tagName !== 'SPAN' || n.getAttribute('aria-hidden') !== 'true' || kids.indexOf(n) < kids.length - tips.length) b.push(`${id}: pista suelta no es <span aria-hidden> al final`)
      const body = kids[0]
      if (t.classList.contains('is-toggle') && !(body.tagName === 'BUTTON' && body.querySelector(':scope > .g-tag__check > svg'))) b.push(`${id}: alternar sin botón y marca`)
      const lead = body.querySelector(':scope > .g-tag__lead')
      if (lead && lead.getAttribute('aria-hidden') !== 'true') b.push(`${id}: hueco sin aria-hidden`)
      const txt = body.querySelector(':scope > .g-tag__text')
      if (!txt || txt.getAttribute('dir') !== 'auto') b.push(`${id}: texto sin dir=auto`)
      if (t.closest('.g-tag-group__value') && !t.classList.contains('is-plain')) b.push(`${id}: valor de racimo sin is-plain`)
      if (t.closest('.g-tag-group__item') && t.classList.contains('is-plain')) b.push(`${id}: suelta con is-plain`)
    }
    for (const g of document.querySelectorAll('.g-tag-group')) {
      const kids = [...g.children]
      const live = g.querySelector(':scope > .g-tag-group__live[role="status"]')
      if (!live) b.push(`${g.id}: sin región viva`)
      const tips = kids.filter((k) => k.classList.contains('g-tooltip'))
      if (tips.some((n) => n.tagName !== 'DIV' || n.getAttribute('aria-hidden') !== 'true' || kids.indexOf(n) < kids.indexOf(live))) b.push(`${g.id}: pista del grupo no es <div aria-hidden> al final de la raíz`)
      if (g.querySelector('.g-tag-group__list .g-tooltip')) b.push(`${g.id}: pista dentro de la lista`)
      for (const f of g.querySelectorAll('.g-tag-group__facet')) {
        const cats = [...f.querySelectorAll('.g-tag')].map((x) => x.dataset.cat)
        if (cats.some((c) => c !== f.dataset.cat)) b.push(`${g.id}: data-cat del racimo ${f.dataset.cat} ≠ etiquetas ${cats}`)
      }
    }
    const fac = document.querySelectorAll('#g-facets .g-tag-group__facet')
    if (!fac.length || [...fac].some((f) => !f.dataset.cat)) b.push('g-facets: racimo sin data-cat con categories')
    return b
  })
  ok(!bad.length, `marcado: ${bad.slice(0, 8).join(' | ')}`)
}

/* ---------- 1 · Contraste: 21 temas × claro/oscuro ---------- */
async function contrast(page) {
  for (const theme of THEMES) for (const dark of [false, true]) {
    const where = `${theme}${dark ? ' oscuro' : ''}`
    await open(page, `theme=${theme}${dark ? '&dark=1' : ''}`)
    await page.addStyleTag({ content: NO_TRANSITIONS })
    await page.mouse.move(0, 0)
    const n = await page.evaluate(() => BENCH.NCAT)
    const ks = ['n', ...Array.from({ length: n }, (_, i) => i + 1)]
    for (const k of ks) {
      const r = await page.evaluate((k) => {
        const T = (s) => $t(`m-${k}-${s}`)
        const surface = $bg(T('static').parentElement)
        const o = {}
        const st = T('static'); o.static = $cr($ink(st), $bg(st))
        const rem = T('rem'); o.capIcon = $cr($ink(rem.querySelector('.g-tag__remove')), $bg(rem))
        const tog = T('tog'); o.togText = $cr($ink(tog), $bg(tog)); o.togEdge = $cr($ink(tog, 'borderTopColor'), surface)
        const on = T('on'); o.onText = $cr($ink(on), $bg(on)); o.onEdge = $cr($ink(on, 'borderTopColor'), surface)
        o.onCheck = $cr($ink(on.querySelector('.g-tag__check')), $bg(on))
        const pick = T('pick'); o.pickText = $cr($ink(pick), $bg(pick))
        const raya = $rgb(getComputedStyle(pick).boxShadow); o.rayaPick = $cr(raya, $bg(pick)); o.rayaSurface = $cr(raya, surface)
        const facet = T('facet-0'); o.spine = $cr($ink(facet, 'borderLeftColor'), surface); o.spinePage = $cr($ink(facet, 'borderLeftColor'), $bg(document.body))
        o.frame = $cr($ink(facet, 'borderTopColor'), surface)
        o.facetName = $cr($ink(facet.querySelector('.g-tag-group__facet-name')), surface)
        const free = T('free'); o.freeText = $cr($ink(free), $bg(free))
        const vrem = T('vrem'); o.vcapIcon = $cr($ink(vrem.querySelector('.g-tag__remove')), $bg(vrem))
        return o
      }, k)
      const lab = `${where} ${k === 'n' ? 'neutra' : 'cat ' + k}`
      const rows = [['Reposo: texto / soft', r.static, 4.5], ['Tapa: icono en reposo', r.capIcon, 3], ['Alternar: texto / surface', r.togText, 4.5], ['Alternar: contorno / surface', r.togEdge, 3],
        ['Pulsada: texto / relleno', r.onText, 4.5], ['Pulsada: contorno -text / surface (§7.1)', r.onEdge, 3], ['Pulsada: marca / relleno', r.onCheck, 3],
        ['Racimo elegida: texto / soft', r.pickText, 4.5], ['Racimo elegida: raya / soft', r.rayaPick, 3], ['Racimo elegida: raya / surface', r.rayaSurface, 3],
        ['Lomo / surface', r.spine, 3], ['Lomo / fondo de página', r.spinePage, 3], ['Marco del racimo / surface', r.frame, 3], ['Nombre de faceta / surface', r.facetName, 4.5],
        ['Racimo libre: texto / surface', r.freeText, 4.5], ['Racimo: icono de la tapa', r.vcapIcon, 3]]
      for (const [row, v, min] of rows) { rec(row, v, lab); ok(v >= min, `${lab}: ${row} ${v.toFixed(2)} < ${min}`) }
      for (const [t, row] of [['rem', 'Tapa al pasar (invertida)'], ['on-rem', 'Tapa al pasar sobre la pulsada'], ['vrem', 'Racimo: tapa al pasar']]) {
        const s = await S(page, `m-${k}-${t}`)
        await page.hover(`${s} .g-tag__remove`)
        const v = await page.evaluate((s) => { const c = document.querySelector(s); return $cr($ink(c), $bg(c)) }, `${s} .g-tag__remove`)
        rec(row, v, lab); ok(v >= 4.5, `${lab}: ${row} ${v.toFixed(2)} < 4.5`)
      }
      await page.hover(`${await S(page, `m-${k}-on`)} .g-tag__body`)
      const hv = await page.evaluate((t) => { const e = $t(t); return { text: $cr($ink(e), $bg(e)), edge: $cr($ink(e, 'borderTopColor'), $bg(e.parentElement)) } }, `m-${k}-on`)
      rec('Pulsada al pasar: texto / -strong', hv.text, lab); ok(hv.text >= 4.5, `${lab}: pulsada al pasar ${hv.text.toFixed(2)}`)
      rec('Pulsada al pasar: contorno / surface', hv.edge, lab); ok(hv.edge >= 3, `${lab}: contorno de la pulsada al pasar ${hv.edge.toFixed(2)}`)
      await page.hover(`${await S(page, `m-${k}-free`)} .g-tag__body`)
      const fv = await page.evaluate((t) => { const e = $t(t); return $cr($ink(e), $bg(e)) }, `m-${k}-free`)
      rec('Racimo libre al pasar: texto / sunken', fv, lab); ok(fv >= 4.5, `${lab}: racimo libre al pasar ${fv.toFixed(2)}`)
      await page.mouse.move(0, 0)
    }
    if (n === 8) ok(await page.evaluate(() => getComputedStyle($t('m-9-static')).backgroundColor === 'rgba(0, 0, 0, 0)'), `${where}: categoría 9 sin declarar debería quedar sin relleno`)
    // Huella real: quitar «Látex» del grupo y medir «Deshacer», contorno discontinuo, texto atenuado; anillo con teclado
    await page.click('#g-flow [data-id="lat"] .g-tag__remove')
    await frames(page)
    const g = await page.evaluate(() => { const t = $t('g-flow-lat'), u = t.querySelector('.g-tag__undo'), s = $bg(t.parentElement); return { undo: $cr($ink(u), $bg(u)), dash: $cr($ink(t, 'borderTopColor'), s), text: $cr($ink(t.querySelector('.g-tag__text')), s) } })
    for (const [row, v, min] of [['Huella: «Deshacer»', g.undo, 4.5], ['Huella: contorno discontinuo', g.dash, 3], ['Huella: texto tachado', g.text, 4.5]]) { rec(row, v, where); ok(v >= min, `${where}: ${row} ${v.toFixed(2)} < ${min}`) }
    await page.hover('#g-flow [data-id="lat"] .g-tag__undo')
    const gu = await page.evaluate(() => { const u = $t('g-flow-lat').querySelector('.g-tag__undo'); return $cr($ink(u), $bg(u)) })
    rec('Huella: «Deshacer» al pasar (invertido)', gu, where); ok(gu >= 4.5, `${where}: «Deshacer» al pasar ${gu.toFixed(2)}`)
    await page.keyboard.press('Shift+' + TAB()); await page.keyboard.press(TAB())
    const f = await page.evaluate(() => { const u = document.activeElement; return { cls: u.className, c: $cr($rgb(getComputedStyle(u).outlineColor), $bg(u.closest('.host'))), s: getComputedStyle(u).outlineStyle } })
    rec('Anillo de foco / surface', f.c, where); ok(f.s === 'solid' && f.c >= 3, `${where}: anillo de foco ${f.s} ${f.c.toFixed(2)} (${f.cls})`)
    // Herramientas (GBtn link accent) y texto de vacío
    const tl = await page.evaluate(() => { const m = document.querySelector('#g-limit .g-tag-group__more'), e = document.querySelector('#g-empty .g-tag-group__empty'); return { more: $cr($ink(m), $bg(m)), empty: $cr($ink(e), $bg(e)) } })
    rec('«Ver N más» / surface', tl.more, where); ok(tl.more >= 4.5, `${where}: «Ver N más» ${tl.more.toFixed(2)}`)
    rec('Texto de vacío / surface', tl.empty, where); ok(tl.empty >= 4.5, `${where}: texto de vacío ${tl.empty.toFixed(2)}`)
  }
}

/* ---------- 2 · Geometría ---------- */
async function geometry(page, qs) {
  await open(page, qs)
  const r = await page.evaluate(() => {
    const root = getComputedStyle(document.documentElement)
    const sp = parseFloat(root.getPropertyValue('--g-space-1'))
    const bw = parseFloat(root.getPropertyValue('--g-border-width'))
    const probe = document.createElement('i'); probe.style.cssText = 'position:absolute;inline-size:200px;block-size:200px;border-radius:var(--g-radius-shape)'; document.body.append(probe)
    const shape = getComputedStyle(probe).borderTopRightRadius; probe.remove()
    const out = { sp, bw, shape, cases: {} }
    for (const el of document.querySelectorAll('#cases [data-test]')) {
      const b = el.getBoundingClientRect(), cap = el.querySelector('.g-tag__remove'), body = el.querySelector('.g-tag__body'), txt = el.querySelector('.g-tag__text')
      const lead = el.querySelector('.g-tag__lead .g-avatar'), chk = el.querySelector('.g-tag__check')
      out.cases[el.dataset.test] = {
        h: b.height, w: b.width, top: b.top, right: b.right, left: b.left, bottom: b.bottom, lh: parseFloat(getComputedStyle(el).lineHeight),
        cap: cap && (({ width, height, top, right, bottom }) => ({ width, height, top, right, bottom }))(cap.getBoundingClientRect()),
        capR: cap && getComputedStyle(cap).borderTopRightRadius, tagR: getComputedStyle(el).borderTopRightRadius,
        hit: parseFloat(getComputedStyle(body, '::after').height), interactive: /^(A|BUTTON)$/.test(body.tagName) && (body.hasAttribute('href') || body.tagName === 'BUTTON'),
        cut: txt.scrollWidth > txt.clientWidth + 1, ws: getComputedStyle(txt).whiteSpace, lines: Math.round(txt.getBoundingClientRect().height / parseFloat(getComputedStyle(txt).lineHeight)),
        fs: parseFloat(getComputedStyle(el).fontSize),
        av: lead && (({ width, top, left, right, bottom }) => ({ width, top, left, right, bottom }))(lead.getBoundingClientRect()),
        chk: chk && chk.getBoundingClientRect().width, textLeft: txt.getBoundingClientRect().left, bodyLeft: body.getBoundingClientRect().left,
        textBottom: txt.getBoundingClientRect().bottom, textTop: txt.getBoundingClientRect().top
      }
    }
    // Separación entre dos vecinas de la misma línea
    const gap = (() => { const ts = [...document.querySelectorAll('#g-flow .g-tag')].map((t) => t.getBoundingClientRect()); for (let i = 1; i < ts.length; i++) if (Math.abs(ts[i].top - ts[i - 1].top) < 1) return ts[i].left - ts[i - 1].right; return NaN })()
    const fac = $t('g-facets-facet-0'), facB = fac.getBoundingClientRect()
    const last = fac.querySelector('.g-tag-group__value:last-child > .g-tag')
    const vals = [...fac.querySelectorAll('.g-tag-group__value > .g-tag')].map((t) => t.getBoundingClientRect().height)
    const loose = $t('g-facets-x1').getBoundingClientRect().height
    const capV = fac.querySelector('.g-tag__remove').getBoundingClientRect()
    out.flow = { gap, facetH: facB.height, vals, loose, capV: [capV.width, capV.height], lastR: getComputedStyle(last).borderTopRightRadius, facR: getComputedStyle(fac).borderTopRightRadius, spine: parseFloat(getComputedStyle(fac).borderLeftWidth) }
    out.flow.facetSm = $t('g-facets-sm-facet-0').getBoundingClientRect().height
    out.flow.tagSm = $t('g-flow-sm-pen').getBoundingClientRect().height
    out.flow.lhSm = parseFloat(getComputedStyle($t('g-flow-sm-pen')).lineHeight)
    out.flow.lhMd = parseFloat(getComputedStyle($t('g-flow-pen')).lineHeight)
    const tools = document.querySelector('#g-limit .g-tag-group__more').getBoundingClientRect(), firstTag = $t('g-limit-l0').getBoundingClientRect()
    out.flow.toolsMid = (tools.top + tools.bottom) / 2 - (firstTag.top + firstTag.bottom) / 2
    out.scroll = document.scrollingElement.scrollWidth - innerWidth
    // Cada elemento del grupo mide lo que su etiqueta (hallazgo 4: sin hueco detrás de una recortada)
    out.slack = [...document.querySelectorAll('.g-tag-group__item, .g-tag-group__value')].filter((li) => !li.hidden).map((li) => [li.dataset.id, li.getBoundingClientRect().width - li.querySelector('.g-tag').getBoundingClientRect().width - parseFloat(getComputedStyle(li).borderLeftWidth) - parseFloat(getComputedStyle(li).borderRightWidth)]).filter(([, d]) => Math.abs(d) > 0.6)
    return out
  })
  const { sp, bw, cases } = r
  const Hof = (n, lh) => Math.max(sp * n, lh + 2 * bw)
  for (const s of ['md', 'sm']) {
    for (const [k, c] of Object.entries(cases).filter(([k]) => k.startsWith(s + '-'))) {
      const where = `${qs} ${k}`
      const H = Hof(s === 'md' ? 8 : 6, c.lh)
      if (k.endsWith('long-static')) { ok(c.lines >= 2 && c.h > H && !c.cut && c.ws !== 'nowrap', `${where}: la estática larga se parte (líneas ${c.lines}, alto ${c.h})`); continue }
      // Varias líneas solo si se parte (estática o deshabilitada, que no se recortan: con el texto al 200 % y el tope de
      // space × 60 ocurre); entonces la tapa sigue siendo del alto entero y del ancho de una línea
      const multi = c.h > H + 0.6
      if (multi) ok(/(static|icon|dis-)/.test(k) && !c.cut && c.lines >= 2, `${where}: crece sin partirse o se parte con control (${c.h.toFixed(2)}, ${c.lines} líneas)`)
      else ok(near(c.h, H), `${where}: alto ${c.h.toFixed(2)} ≠ ${H}`)
      ok(c.textTop >= c.top + bw - 0.6 && c.textBottom <= c.bottom - bw + 0.6, `${where}: el texto se sale de la caja`)
      ok(c.fs >= 12, `${where}: texto ${c.fs}px < 12`)
      ok(c.w <= sp * 60 + 0.6 || c.w <= 1180, `${where}: ancho ${c.w}`)
      if (c.interactive) ok(c.hit >= 24 - 0.5, `${where}: área del cuerpo interactivo ${c.hit} < 24`)
      ok(c.tagR === r.shape || (parseFloat(r.shape) > c.h / 2 && near(parseFloat(c.tagR), parseFloat(r.shape), 0.6)), `${where}: radio ${c.tagR} ≠ --g-radius-shape ${r.shape}`)
      if (c.cap) {
        ok(near(c.cap.width, H) && near(c.cap.height, multi ? c.h : H), `${where}: tapa ${c.cap.width.toFixed(2)}×${c.cap.height.toFixed(2)} ≠ ${H}×${multi ? c.h : H}`)
        ok(near(c.cap.top, c.top) && near(c.cap.bottom, c.bottom) && near(c.cap.right, c.right), `${where}: la tapa no va de borde a borde al final`)
        ok(c.capR === c.tagR, `${where}: esquina final de la tapa ${c.capR} ≠ ${c.tagR}`)
      }
      if (/long-(rem|toggle)/.test(k)) ok(c.cut && c.ws === 'nowrap', `${where}: con control se recorta en una línea`)
      if (c.av) {
        const top = c.av.top - c.top, start = c.av.left - c.left
        ok(near(c.av.width, sp * 5), `${where}: avatar ${c.av.width} ≠ space × 5`)
        if (!/pressed/.test(k)) ok(near(top, start, 0.75), `${where}: avatar no concéntrico (arriba ${top.toFixed(2)}, inicio ${start.toFixed(2)})`)
      }
      if (c.chk != null) ok(/pressed/.test(k) ? near(c.chk, c.fs, 0.6) : c.chk === 0, `${where}: marca ${c.chk} (pulsada = 1em, sin pulsar = 0)`)
      if (/^(md|sm)-toggle$/.test(k)) ok(near(c.textLeft - c.bodyLeft, sp * (s === 'md' ? 3 : 2), 0.6), `${where}: sin pulsar la marca deja hueco (${(c.textLeft - c.bodyLeft).toFixed(2)})`)
    }
  }
  const H = Hof(8, r.flow.lhMd), Hs = Hof(6, r.flow.lhSm)
  ok(near(r.flow.gap, sp * 2), `${qs}: separación entre etiquetas ${r.flow.gap} ≠ space × 2`)
  ok(near(r.flow.facetH, H), `${qs}: racimo ${r.flow.facetH} ≠ ${H}`)
  ok(near(r.flow.loose, H), `${qs}: suelta en facets ${r.flow.loose} ≠ ${H}`)
  ok(near(r.flow.facetSm, Hs) && near(r.flow.tagSm, Hs), `${qs}: sm racimo ${r.flow.facetSm} / etiqueta ${r.flow.tagSm} ≠ ${Hs}`)
  ok(r.flow.vals.every((v) => near(v, H - 2 * bw)), `${qs}: valores del racimo ${r.flow.vals} ≠ alto − 2 bordes (${H - 2 * bw})`)
  ok(near(r.flow.capV[0], H - 2 * bw) && near(r.flow.capV[1], H - 2 * bw), `${qs}: tapa del valor ${r.flow.capV} ≠ ${H - 2 * bw}`)
  ok(near(r.flow.spine, Math.floor(sp * 0.75)) || near(r.flow.spine, sp * 0.75), `${qs}: lomo ${r.flow.spine} ≠ space × 0.75`)
  ok(r.flow.lastR !== '0px' || r.flow.facR === '0px', `${qs}: el último valor no lleva las esquinas del racimo (${r.flow.lastR})`)
  ok(Math.abs(r.flow.toolsMid) <= 1, `${qs}: «Ver N más» no centrado con las etiquetas (${r.flow.toolsMid})`)
  ok(r.scroll <= 0, `${qs}: desplazamiento horizontal ${r.scroll}`)
  ok(!r.slack.length, `${qs}: elementos del grupo más anchos que su etiqueta ${JSON.stringify(r.slack)}`)
}

/* ---------- 3 · Huella real, vista previa, tapa invertida, recogida, marca ---------- */
const rects = (page, gid) => page.evaluate((gid) => [...document.querySelectorAll(`#${gid} .g-tag`)].map((t) => { const b = t.getBoundingClientRect(); return { id: t.closest('[data-id]').dataset.id, x: +(b.left + scrollX).toFixed(2), y: +(b.top + scrollY).toFixed(2), w: +b.width.toFixed(2) } }), gid)
const evs = (page) => page.evaluate(() => BENCH.ev.splice(0))
async function huella(page) {
  await open(page, 'theme=default-cat8')
  await evs(page)
  for (const [gid, id] of [['g-flow', 'pen'], ['g-flow', 'ana'], ['g-flow', 'urg'], ['g-flow', 'vue'], ['g-flow-sm', 'ibu'], ['g-facets', 'p1'], ['g-facets', 'e2'], ['g-facets-sm', 'a1'], ['g-facets', 'x1']]) {
    const before = await rects(page, gid)
    await page.click(`#${gid} [data-id="${id}"] .g-tag__remove`)
    await page.waitForTimeout(300) // fundido de color de la huella (--g-duration-fast)
    const after = await rects(page, gid)
    const bad = before.map((b, i) => [b, after[i]]).filter(([b, a]) => !a || a.id !== b.id || !near(b.x, a.x, 0.5) || !near(b.y, a.y, 0.5) || !near(b.w, a.w, 0.5))
    ok(!bad.length && before.length === after.length, `Δ0 ${gid}:${id}: ${JSON.stringify(bad)}`)
    const s = await page.evaluate((t) => { const e = $t(t), tx = e.querySelector('.g-tag__text'), cs = getComputedStyle(e); return { ghost: e.classList.contains('is-ghost'), gw: e.style.getPropertyValue('--_ghost-w'), style: e.classList.contains('is-plain') ? cs.outlineStyle : cs.borderTopStyle, deco: getComputedStyle(tx).textDecorationLine, hidden: e.querySelector('.g-tag__body').getAttribute('aria-hidden'), lead: e.querySelector('.g-tag__lead') && getComputedStyle(e.querySelector('.g-tag__lead')).filter, bg: cs.backgroundColor, focus: document.activeElement.classList.contains('g-tag__undo') && e.contains(document.activeElement) } }, `${gid}-${id}`)
    ok(s.ghost && /px$/.test(s.gw) && s.style === 'dashed' && /line-through/.test(s.deco) && s.hidden === 'true', `huella ${gid}:${id}: ${JSON.stringify(s)}`)
    ok(s.bg === 'rgba(0, 0, 0, 0)', `huella ${gid}:${id}: con relleno ${s.bg}`)
    if (s.lead) ok(/grayscale\(1\)/.test(s.lead), `huella ${gid}:${id}: el hueco no pierde el color (${s.lead})`)
    ok(s.focus, `huella ${gid}:${id}: «Deshacer» sin el foco tras un clic`)
    await page.click(`#${gid} [data-id="${id}"] .g-tag__undo`)
    await frames(page)
    const back = await rects(page, gid)
    ok(back.length === before.length && back.every((b, i) => b.id === before[i].id && near(b.x, before[i].x, 0.5) && near(b.w, before[i].w, 0.5)), `deshacer ${gid}:${id}: no vuelve a la misma caja`)
    ok(await page.evaluate((t) => { const e = $t(t); return !e.classList.contains('is-ghost') && document.activeElement === e.querySelector('.g-tag__remove') }, `${gid}-${id}`), `deshacer ${gid}:${id}: el foco no vuelve a «Quitar»`)
  }
  const e1 = await evs(page)
  ok(e1.filter((e) => e.name === 'remove' && e.source === 'button').length === 9 && e1.filter((e) => e.name === 'restore').length === 9, `eventos de quitar/deshacer: ${e1.length}`)
  // Doble clic rápido sobre la misma tapa: quita y deshace; la vecina sigue en su sitio
  const b0 = await rects(page, 'g-flow')
  await page.dblclick('#g-flow [data-id="pol"] .g-tag__remove')
  await frames(page)
  const b1 = await rects(page, 'g-flow')
  ok(b1.length === b0.length && b1.every((b, i) => b.id === b0[i].id && near(b.x, b0[i].x, 0.5) && near(b.w, b0[i].w, 0.5)), 'doble clic: alguna caja se movió')
  ok(await page.evaluate(() => !$t('g-flow-pol').classList.contains('is-ghost') && !!$t('g-flow-vue') && !$t('g-flow-vue').classList.contains('is-ghost')), 'doble clic: quitó la vecina o dejó la huella')
  // Supr sobre «Quitar»: source key, huella con el foco; anuncio
  await page.focus('#g-flow [data-id="mar"] .g-tag__remove'); await page.keyboard.press('Delete')
  await page.waitForTimeout(150)
  const k = await page.evaluate(() => ({ ev: BENCH.ev.at(-1), ghost: $t('g-flow-mar').classList.contains('is-ghost'), focus: document.activeElement === $t('g-flow-mar').querySelector('.g-tag__undo'), live: document.querySelector('#g-flow .g-tag-group__live').textContent }))
  ok(k.ev?.source === 'key' && k.ghost && k.focus && /Mariscos quitada/.test(k.live), `Supr: ${JSON.stringify(k)}`)
  await page.click('#g-flow [data-id="mar"] .g-tag__undo')
  // La vuelta lleva el foco a «Quitar» por programa; tras el teclado (Supr) Chromium lo marca :focus-visible y la vista
  // previa con teclado lo tacharía: se suelta el foco antes de medir la del puntero
  await page.evaluate(() => document.activeElement.blur())
  // Vista previa: tachado al apuntar la tapa y al enfocarla con teclado; tapa invertida
  await page.mouse.move(0, 0)
  await page.waitForTimeout(250)
  const capSel = '#g-flow [data-id="mar"] .g-tag__remove'
  const pre = await page.evaluate(() => { const t = $t('g-flow-mar'); return { fg: getComputedStyle(t).color, bg: getComputedStyle(t).backgroundColor } })
  await page.hover(capSel); await page.waitForTimeout(250)
  const hov = await page.evaluate((s) => { const c = document.querySelector(s); return { deco: getComputedStyle($t('g-flow-mar').querySelector('.g-tag__text')).textDecorationLine, bg: getComputedStyle(c).backgroundColor, ink: getComputedStyle(c).color } }, capSel)
  ok(/line-through/.test(hov.deco), 'vista previa: apuntar la tapa no tacha el texto')
  ok(hov.bg === pre.fg && hov.ink === pre.bg, `tapa invertida: fondo ${hov.bg} / ${pre.fg}, icono ${hov.ink} / ${pre.bg}`)
  await page.mouse.move(0, 0); await page.waitForTimeout(250)
  ok(await page.evaluate(() => getComputedStyle($t('g-flow-mar').querySelector('.g-tag__text')).textDecorationLine === 'none'), 'vista previa: el tachado no se va al salir')
  await page.focus('#g-flow [data-id="vue"] .g-tag__remove'); await page.keyboard.press(TAB())
  const kf = await page.evaluate(() => ({ on: document.activeElement.closest('[data-id]')?.dataset.id, deco: getComputedStyle($t('g-flow-mar').querySelector('.g-tag__text')).textDecorationLine, ow: getComputedStyle(document.activeElement).outlineWidth, fw: getComputedStyle(document.documentElement).getPropertyValue('--g-focus-width').trim() }))
  ok(/line-through/.test(kf.deco), `vista previa con teclado: ${JSON.stringify(kf)}`)
  ok(kf.ow === kf.fw, `foco visible en la tapa: ${kf.ow} ≠ ${kf.fw}`)
  // Foco en el racimo hacia dentro
  await page.focus('#g-facets-toggles [data-id="t2"] .g-tag__body'); await page.keyboard.press('Shift+' + TAB()); await page.keyboard.press(TAB())
  const rf = await page.evaluate(() => ({ off: parseFloat(getComputedStyle(document.activeElement).outlineOffset), st: getComputedStyle(document.activeElement).outlineStyle }))
  ok(rf.st === 'solid' && rf.off < 0, `foco en el racimo: ${JSON.stringify(rf)}`)

  // Recogida real: quitar dos, salir puntero y foco → is-settling con anchos intermedios → fuera del DOM, settle
  for (const reduce of [false, true]) {
    await page.emulateMedia({ reducedMotion: reduce ? 'reduce' : 'no-preference' })
    await open(page, 'theme=default-cat8')
    await page.click('#g-flow [data-id="lat"] .g-tag__remove')
    await page.click('#g-flow [data-id="ibu"] .g-tag__remove')
    await frames(page)
    ok(await page.evaluate(() => document.querySelectorAll('#g-flow .is-ghost').length === 2), 'dos huellas a la vez')
    // Mientras el foco sigue en el grupo, aunque el puntero salga, no se recoge
    await page.mouse.move(2, 2); await page.waitForTimeout(400)
    ok(await page.evaluate(() => document.querySelectorAll('#g-flow .is-ghost').length === 2), 'se recoge con el foco dentro del grupo')
    await evs(page)
    const tr = page.evaluate(() => new Promise((res) => {
      const frames = []; const t0 = performance.now()
      const step = () => { const t = document.querySelector('#g-flow [data-id="lat"] > .g-tag'); frames.push(t ? +t.getBoundingClientRect().width.toFixed(1) : -1); if (frames.at(-1) === -1 || performance.now() - t0 > 1500) res(frames); else requestAnimationFrame(step) }
      requestAnimationFrame(step)
    }))
    await page.mouse.click(2, 2)
    await page.evaluate(() => document.activeElement.blur())
    const fr = await tr
    const w0 = fr[0], mid = fr.filter((w) => w > 3 && w < w0 - 0.5)
    ok(fr.at(-1) === -1, `recogida ${reduce ? 'reducida' : ''}: la huella no sale del DOM (${fr.slice(-3)})`)
    if (reduce) ok(mid.length === 0, `recogida con movimiento reducido: ${mid.length} anchos intermedios`)
    else ok(mid.length >= 2, `recogida: ${mid.length} anchos intermedios (${fr.join(' ')})`)
    await page.waitForTimeout(50)
    const st = await page.evaluate(() => ({ ghosts: document.querySelectorAll('#g-flow .is-ghost, #g-flow .is-settling').length, settle: BENCH.ev.filter((e) => e.name === 'settle') }))
    ok(st.ghosts === 0, 'recogida: quedan huellas')
    ok(st.settle.length === 1 && st.settle[0].ids.sort().join() === 'ibu,lat', `settle: ${JSON.stringify(st.settle)}`)
    // La marca se abre (0 → 1em) con anchos intermedios; con movimiento reducido aparece sin abrirse
    await page.mouse.move(0, 0)
    const ck = page.evaluate(() => new Promise((res) => {
      const el = $t('g-facets-toggles-t2').querySelector('.g-tag__check'); const fr = []; const t0 = performance.now()
      const step = () => { fr.push(+el.getBoundingClientRect().width.toFixed(1)); if (performance.now() - t0 > 600) res(fr); else requestAnimationFrame(step) }
      requestAnimationFrame(step)
    }))
    await page.click('#g-facets-toggles [data-id="t2"] .g-tag__body')
    const cf = await ck
    const fs = await page.evaluate(() => parseFloat(getComputedStyle($t('g-facets-toggles-t2')).fontSize))
    const cmid = cf.filter((w) => w > 0.5 && w < fs - 0.5)
    ok(near(cf.at(-1), fs), `marca: termina en ${cf.at(-1)} ≠ 1em (${fs})`)
    if (reduce) ok(cmid.length === 0, `marca con movimiento reducido: ${cmid.length} anchos intermedios`)
    else ok(cmid.length >= 2, `marca: ${cmid.length} anchos intermedios (${cf.join(' ')})`)
    const capT = await page.evaluate(() => getComputedStyle($t('g-flow-pen').querySelector('.g-tag__remove > svg')).transitionDuration)
    if (reduce) ok(/^0s$/.test(capT), `con movimiento reducido el icono de la tapa no escala (${capT})`)
  }
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.mouse.move(0, 0)
  await open(page, 'theme=default-cat8')
  const anim = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running' || !/g-btn-spin/.test(a.animationName || '')).map((a) => `${a.transitionProperty || a.animationName}:${a.playState}`))
  ok(anim.length === 0, `algo se anima al montar: ${anim}`) // el GBtn interno deja su giro de carga en pausa: no cuenta
}

/* ---------- 4 · Herramientas, alternar y foco ---------- */
async function tools(page) {
  await open(page, 'theme=auditoria-cat12')
  await evs(page)
  // «Quitar todas»: sin huella, el mismo botón pasa a «Deshacer» con el foco; deshacer todas en su sitio
  const before = await rects(page, 'g-clear')
  await page.click('#g-clear .g-tag-group__clear')
  await page.waitForTimeout(150)
  const c = await page.evaluate(() => { const b = document.querySelector('#g-clear .g-tag-group__clear'); if (!b) return { gone: true, html: document.querySelector('#g-clear').outerHTML.slice(0, 600), ev: BENCH.ev, act: document.activeElement.outerHTML.slice(0, 120) }; return { focus: document.activeElement === b, undo: b.classList.contains('is-undo'), text: b.textContent.trim(), icon: !!b.querySelector('.g-icon--flip-rtl'), tags: document.querySelectorAll('#g-clear .g-tag').length, empty: !!document.querySelector('#g-clear .g-tag-group__empty'), live: document.querySelector('#g-clear .g-tag-group__live').textContent } })
  ok(c.focus && c.undo && c.text === 'Deshacer: volver a poner 4' && c.icon && c.tags === 0 && !c.empty && /Se quitaron 4/.test(c.live), `quitar todas: ${JSON.stringify(c)}`)
  await page.click('#g-clear .g-tag-group__clear')
  await page.waitForTimeout(150)
  const u = await page.evaluate(() => { const b = document.querySelector('#g-clear .g-tag-group__clear'); if (!b) return { gone: true, html: document.querySelector('#g-clear').outerHTML.slice(0, 600), ev: BENCH.ev, act: document.activeElement.outerHTML.slice(0, 120) }; return { focus: document.activeElement === b, undo: b.classList.contains('is-undo'), text: b.textContent.trim(), live: document.querySelector('#g-clear .g-tag-group__live').textContent } })
  if (u.gone) {
    // WebKit no deja el foco en un botón al pulsarlo: el mousedown saca el foco del grupo, el focusout retira el «Deshacer»
    // de «Quitar todas» (y emite settle) antes del clic. Defecto del .vue (bruno): se anota y se prueba con Intro
    ok(false, `HALLAZGO 5 (cerrado en d585178) ${ENGINE}: un clic en «Deshacer: volver a poner 4» no deshace: el botón se va en el mousedown (eventos ${JSON.stringify(u.ev.map((e) => e.name))})`)
    await open(page, 'theme=auditoria-cat12')
    await page.click('#g-clear .g-tag-group__clear')
    await page.keyboard.press('Enter')
    await page.waitForTimeout(150)
  } else ok(u.focus && !u.undo && u.text === 'Quitar todas' && /4 etiquetas restauradas/.test(u.live), `deshacer todas: ${JSON.stringify(u)}`)
  const after = await rects(page, 'g-clear')
  ok(JSON.stringify(after) === JSON.stringify(before), 'deshacer todas: no vuelven a su sitio')
  // «Ver N más»: aria-expanded, el foco se queda, las ocultas aparecen
  await page.click('#g-limit .g-tag-group__more')
  await frames(page)
  const m = await page.evaluate(() => { const b = document.querySelector('#g-limit .g-tag-group__more'); return { focus: document.activeElement === b, exp: b.getAttribute('aria-expanded'), ctl: document.getElementById(b.getAttribute('aria-controls'))?.classList.contains('g-tag-group__list'), text: b.textContent.trim(), hidden: document.querySelectorAll('#g-limit [data-id][hidden]').length } })
  ok(m.focus && m.exp === 'true' && m.ctl && m.text === 'Ver menos' && m.hidden === 0, `Ver N más: ${JSON.stringify(m)}`)
  // Alternar: clic, Espacio, Intro; aria-pressed, is-pressed, marca 1em; en un grupo y suelta con v-model
  await page.click('#g-view [data-id="v2"] .g-tag__body')
  await page.focus('#g-view [data-id="v3"] .g-tag__body'); await page.keyboard.press('Space')
  await page.focus('#g-view [data-id="v1"] .g-tag__body'); await page.keyboard.press('Enter')
  await page.click('[data-test="lone-toggle"] .g-tag__body')
  await page.waitForTimeout(250)
  const t = await page.evaluate(() => ['v1', 'v2', 'v3'].map((id) => { const e = $t('g-view-' + id); return [e.querySelector('.g-tag__body').getAttribute('aria-pressed'), e.classList.contains('is-pressed'), Math.round(e.querySelector('.g-tag__check').getBoundingClientRect().width)] }).concat([[$t('lone-toggle').querySelector('.g-tag__body').getAttribute('aria-pressed'), $t('lone-toggle').classList.contains('is-pressed')]]))
  const fs = await page.evaluate(() => Math.round(parseFloat(getComputedStyle($t('g-view-v1')).fontSize)))
  ok(JSON.stringify(t) === JSON.stringify([['false', false, 0], ['true', true, fs], ['true', true, fs], ['true', true]]), `alternar: ${JSON.stringify(t)}`)
  const tev = (await evs(page)).filter((e) => e.name === 'toggle').map((e) => e.id).join()
  ok(tev === 'v2,v3,v1', `toggle: ${tev}`)
  // Vacío: contenedor con nombre y aria-describedby al texto de vacío
  const em = await page.evaluate(() => { const l = document.querySelector('#g-empty .g-tag-group__list'); return [l.getAttribute('aria-label'), document.getElementById(l.getAttribute('aria-describedby'))?.textContent] })
  ok(em[0] === 'Vacío' && em[1] === 'Sin etiquetas', `vacío: ${em}`)
}

/* ---------- 5 · Pista: lugar del nodo, recorte, «Quitar» siempre, #383 ---------- */
const openTexts = (page) => page.evaluate(() => [...document.querySelectorAll('.g-tooltip')].filter((n) => n.matches(':popover-open')).map((n) => n.querySelector('.g-tooltip__text').textContent))
const hoverC = async (page, sel) => { const b = await page.locator(sel).boundingBox(); await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2) }
async function pista(page) {
  await open(page, 'theme=auditoria-cat12')
  await page.evaluate(() => document.querySelector('#g-cut').scrollIntoView({ block: 'center' }))
  await page.mouse.move(2, 2); await page.waitForTimeout(300)
  const LONG = 'Solicitudes pendientes de revisión por el comité de ética de la institución'
  ok(await page.evaluate(() => { const t = document.querySelector('#g-cut [data-id="k2"] .g-tag__text'); return t.scrollWidth > t.clientWidth + 1 }), 'recorte: el enlace largo no se recorta')
  await hoverC(page, '#g-cut [data-id="k2"] a')
  let got = []
  for (let i = 0; i < 25 && !got.length; i++) { await page.waitForTimeout(200); got = await openTexts(page) }
  ok(got.length === 1 && got[0] === LONG, `pista del recortado: ${JSON.stringify(got)}`)
  const geo = await page.evaluate(() => { const n = [...document.querySelectorAll('#g-cut > .g-tooltip')].find((x) => x.matches(':popover-open')); const a = document.querySelector('#g-cut [data-id="k2"] .g-tag').getBoundingClientRect(), b = n.getBoundingClientRect(); return { inView: b.left >= -0.5 && b.right <= innerWidth + 0.5, apart: b.bottom <= a.top + 1 || b.top >= a.bottom - 1, name: document.querySelector('#g-cut [data-id="k2"] a').textContent.trim() } })
  ok(geo.inView && geo.apart, `pista: fuera del visor o sobre la etiqueta ${JSON.stringify(geo)}`)
  await page.mouse.move(2, 2); await page.waitForTimeout(700)
  await hoverC(page, '#g-cut [data-id="k3"] a'); await page.waitForTimeout(1000)
  ok((await openTexts(page)).length === 0, 'pista: un enlace no recortado la abre')
  await hoverC(page, '#g-cut [data-id="k1"] .g-tag__remove')
  got = []
  for (let i = 0; i < 25 && !got.length; i++) { await page.waitForTimeout(200); got = await openTexts(page) }
  ok(got[0] === 'Quitar Hipertensión arterial esencial (primaria) controlada con tratamiento', `pista de «Quitar»: ${JSON.stringify(got)}`)
  await page.mouse.move(2, 2); await page.waitForTimeout(700)
  // Suelta: su nodo es un <span> al final de su raíz; quitarlo no cambia la caja (#383)
  const tip = await page.evaluate(() => {
    const t = $t('lone-tip'), b = t.getBoundingClientRect()
    const n = [...t.children].filter((c) => c.classList.contains('g-tooltip'))
    const g = document.querySelector('#g-flow'), gh = g.getBoundingClientRect().height
    const gn = [...g.children].filter((c) => c.classList.contains('g-tooltip'))
    const clone = t.cloneNode(true); clone.querySelectorAll('.g-tooltip').forEach((x) => x.remove()); t.after(clone)
    const cb = clone.getBoundingClientRect(); clone.remove()
    const g2 = g.cloneNode(true); g2.querySelectorAll(':scope > .g-tooltip').forEach((x) => x.remove()); g.after(g2)
    const g2h = g2.getBoundingClientRect().height; g2.remove()
    return { tags: n.map((x) => x.tagName), dw: cb.width - b.width, dh: cb.height - b.height, gtags: [...new Set(gn.map((x) => x.tagName))], dg: g2h - gh }
  })
  ok(tip.tags.join() === 'SPAN' && tip.gtags.join() === 'DIV', `nodos de la pista: ${JSON.stringify(tip)}`)
  ok(near(tip.dw, 0) && near(tip.dh, 0) && near(tip.dg, 0), `#383: la pista cambia la caja ${JSON.stringify(tip)}`)
}

/* ---------- 6 · RTL y 320px ---------- */
async function layout(page) {
  await open(page, 'theme=lustre-cat8&dir=rtl')
  const r = await page.evaluate(() => {
    const t = $t('md-rem'), b = t.getBoundingClientRect(), c = t.querySelector('.g-tag__remove').getBoundingClientRect()
    const fac = $t('g-facets-facet-0'), cs = getComputedStyle(fac)
    const fil = getComputedStyle(t.querySelector('.g-tag__remove'), '::before')
    const tg = $t('md-pressed'), ck = tg.querySelector('.g-tag__check').getBoundingClientRect(), tx = tg.querySelector('.g-tag__text').getBoundingClientRect()
    const av = $t('md-avatar'), avb = av.querySelector('.g-avatar').getBoundingClientRect(), avt = av.querySelector('.g-tag__text').getBoundingClientRect()
    const loose = $t('g-facets-x1'), lcs = getComputedStyle(loose)
    return { capLeft: c.left - b.left, spineR: parseFloat(cs.borderRightWidth), spineL: parseFloat(cs.borderLeftWidth), filRight: fil.right, chkRight: ck.left > tx.right, avRight: avb.left > avt.right, looseR: parseFloat(lcs.borderRightWidth) > parseFloat(lcs.borderLeftWidth), scroll: document.scrollingElement.scrollWidth - innerWidth, concentric: [avb.top - b.top, b.right - avb.right] }
  })
  ok(near(r.capLeft, 0), `RTL: la tapa no está al final lógico (izquierda): ${r.capLeft}`)
  ok(r.spineR > r.spineL && r.looseR, `RTL: el lomo no está a la derecha ${JSON.stringify(r)}`)
  ok(r.filRight === '0px', `RTL: el filo de la tapa no está a su inicio lógico (right ${r.filRight})`)
  ok(r.chkRight && r.avRight, `RTL: marca o avatar no al inicio lógico ${JSON.stringify(r)}`)
  ok(r.scroll <= 0, `RTL: desplazamiento horizontal ${r.scroll}`)
  await page.click('#g-flow [data-id="pen"] .g-tag__remove')
  await page.waitForTimeout(300)
  const sc = await page.evaluate(() => { const s = $t('g-flow-pen').querySelector('.g-tag__undo svg'); const cs = getComputedStyle(s); return [cs.scale, cs.transform] })
  ok(sc[0] === '-1 1' || /matrix\(-1, 0, 0, 1/.test(sc[1]), `RTL: undo-2 no se espeja ${sc}`)
  const xr = await page.evaluate(() => { const cs = getComputedStyle($t('md-rem').querySelector('.g-tag__remove svg')); return [cs.scale, cs.transform] })
  ok(xr[0] !== '-1 1' && !/matrix\(-1/.test(xr[1]), 'RTL: la x se espeja')
  // 320px
  await page.setViewportSize({ width: 320, height: 800 })
  for (const d of ['', '&dir=rtl']) for (const th of ['propio-cat12', 'auditoria-cat12']) {
    await open(page, `theme=${th}${d}`)
    const s = await page.evaluate(() => ({ sw: document.scrollingElement.scrollWidth - innerWidth, over: [...document.querySelectorAll('#g-narrow .g-tag, #g-narrow-facets .g-tag-group__facet')].filter((t) => { const a = t.getBoundingClientRect(), h = t.closest('.host').getBoundingClientRect(); return a.left < h.left - 0.5 || a.right > h.right + 0.5 }).length, name: [...document.querySelectorAll('#g-narrow-facets .g-tag-group__facet-name')].map((n) => { const r = document.createRange(); r.selectNodeContents(n); return new Set([...r.getClientRects()].map((x) => Math.round(x.top))).size }) }))
    ok(s.sw <= 0 && s.over === 0, `320px ${th}${d}: desplazamiento ${s.sw}, ${s.over} fuera del contenedor`)
    ok(s.name.every((l) => l === 1), `320px ${th}${d}: el nombre de una faceta se parte (${s.name})`)
  }
  await page.setViewportSize({ width: 1200, height: 900 })
}

/* ---------- 7 · forced-colors (Chromium) y puntero grueso ---------- */
async function forced(page) {
  for (const qs of ['theme=default-cat8', 'theme=auditoria-cat12&dark=1']) {
    await open(page, qs)
    const sizes = () => page.evaluate(() => [...document.querySelectorAll('#cases .g-tag, #g-facets .g-tag-group__facet, #g-flow .g-tag')].map((t) => { const b = t.getBoundingClientRect(); return [+b.width.toFixed(1), +b.height.toFixed(1)] }))
    const s0 = await sizes()
    await page.emulateMedia({ forcedColors: 'active' })
    const s1 = await sizes()
    ok(JSON.stringify(s0) === JSON.stringify(s1), `forced-colors ${qs}: cambia la caja de alguna etiqueta`)
    const f = await page.evaluate(() => {
      const c = (t, p = 'borderTopColor') => getComputedStyle($t(t))[p]
      const fil = getComputedStyle($t('md-rem').querySelector('.g-tag__remove'), '::before').backgroundColor
      return { rest: c('md-static'), pressedBg: c('md-pressed', 'backgroundColor'), pressedFg: c('md-pressed', 'color'), canvas: getComputedStyle(document.body).backgroundColor, fil, facet: getComputedStyle($t('g-facets-facet-0')).borderTopColor, spine: getComputedStyle($t('g-facets-facet-0')).borderLeftColor, check: getComputedStyle($t('md-pressed').querySelector('.g-tag__check')).opacity, pick: getComputedStyle($t('m-1-pick') || $t('m-n-pick')).backgroundColor }
    })
    ok(f.rest !== 'rgba(0, 0, 0, 0)' && f.rest !== f.canvas, `forced-colors: contorno en reposo ${f.rest}`)
    ok(f.pressedBg !== f.canvas && f.pressedFg !== f.pressedBg && f.check === '1', `forced-colors: pulsada ${JSON.stringify(f)}`)
    ok(f.fil !== f.canvas && f.fil !== 'rgba(0, 0, 0, 0)', `forced-colors: filo de la tapa ${f.fil}`)
    ok(f.facet !== f.canvas && f.spine !== f.canvas, `forced-colors: marco o lomo del racimo ${f.facet} ${f.spine}`)
    ok(f.pick !== f.canvas, `forced-colors: la elegida del racimo no se distingue (${f.pick})`)
    await page.click('#g-flow [data-id="pen"] .g-tag__remove')
    await frames(page)
    ok(await page.evaluate(() => getComputedStyle($t('g-flow-pen')).borderTopStyle === 'dashed'), 'forced-colors: la huella no es discontinua')
    await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Tab')
    const ring = await page.evaluate(() => [getComputedStyle(document.activeElement).outlineStyle, getComputedStyle(document.activeElement).outlineColor, getComputedStyle(document.body).backgroundColor])
    ok(ring[0] === 'solid' && ring[1] !== ring[2], `forced-colors: anillo ${ring}`)
    await page.emulateMedia({ forcedColors: 'none' })
  }
}
async function coarse(browser, engine) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: engine === 'chromium' })
  const p = await ctx.newPage()
  await open(p, 'theme=auditoria-cat12')
  if (!(await p.evaluate(() => matchMedia('(pointer: coarse)').matches))) { notes.add(`${engine}: pointer: coarse no se emula (44px sin medir)`); await ctx.close(); return }
  const r = await p.evaluate(() => ['sm-rem', 'md-rem', 'sm-toggle', 'sm-link', 'md-pressed-rem', 'g-facets-sm-a1', 'g-flow-sm-pen'].map((t) => {
    const el = $t(t); const parts = [el.querySelector('.g-tag__remove'), el.querySelector('a.g-tag__body, button.g-tag__body')].filter(Boolean)
    return parts.map((x) => { const a = getComputedStyle(x, '::after'); const b = x.getBoundingClientRect(); return [t, parseFloat(a.width), parseFloat(a.height), Math.abs(parseFloat(a.left) - b.width / 2) < 0.6 || a.translate !== 'none'] })
  }).flat())
  for (const [t, w, h, c] of r) ok(w >= 44 - 0.5 && h >= 44 - 0.5 && c, `${engine} puntero grueso ${t}: área ${w}×${h}`)
  ok(await p.evaluate(() => document.scrollingElement.scrollWidth <= innerWidth), `${engine} puntero grueso: desplazamiento horizontal`)
  // Un toque en la tapa quita y deja huella con el foco en «Deshacer»
  await p.tap('#g-flow [data-id="lat"] .g-tag__remove')
  await p.waitForTimeout(100)
  ok(await p.evaluate(() => $t('g-flow-lat').classList.contains('is-ghost') && document.activeElement === $t('g-flow-lat').querySelector('.g-tag__undo')), `${engine} toque: sin huella o sin foco en «Deshacer»`)
  // Un toque en «Deshacer» la devuelve (en táctil solo cuenta el foco para recoger)
  await p.tap('#g-flow [data-id="lat"] .g-tag__undo')
  await p.waitForTimeout(400)
  const back = await p.evaluate(() => ({ el: !!$t('g-flow-lat'), ghost: $t('g-flow-lat')?.classList.contains('is-ghost'), ev: BENCH.ev.map((e) => e.name) }))
  if (!back.el || back.ghost) ok(false, `HALLAZGO 5 (cerrado en d585178) ${engine} táctil: un toque en «Deshacer» de la huella no la devuelve (${JSON.stringify(back)})`)
  else ok(true, '')
  // «Deshacer» de «Quitar todas» con el dedo
  await p.tap('#g-clear .g-tag-group__clear')
  await p.waitForTimeout(150)
  if (await p.locator('#g-clear .g-tag-group__clear.is-undo').count()) {
    await p.tap('#g-clear .g-tag-group__clear')
    await p.waitForTimeout(200)
    const n = await p.evaluate(() => document.querySelectorAll('#g-clear .g-tag').length)
    if (n !== 4) ok(false, `HALLAZGO 5 (cerrado en d585178) ${engine} táctil: un toque en «Deshacer» de «Quitar todas» no las devuelve (${n})`)
    else ok(true, '')
  } else ok(false, `${engine} táctil: «Quitar todas» no pasa a «Deshacer»`)
  await ctx.close()
}

/* ---------- 8 · Remates contratados para bruno (#512, #513): cerrados en d585178, fallan si vuelven ---------- */
async function remates(page) {
  await open(page, 'theme=default-cat8')
  const r = await page.evaluate(() => {
    const more = document.querySelector('#g-dis .g-tag-group__more')
    const av = [...document.querySelectorAll('#g-av [data-id]')].map((li) => [li.dataset.id, li.querySelector('.g-avatar')?.getAttribute('data-cat') ?? null])
    return { moreDisabled: more ? more.disabled : 'sin botón', clearDisabled: document.querySelector('#g-dis .g-tag-group__clear')?.disabled, removes: [...document.querySelectorAll('#g-dis .g-tag__remove')].every((b) => b.disabled), av }
  })
  ok(r.clearDisabled === true && r.removes, `#512: «Quitar todas» o «Quitar» habilitados con disabled ${JSON.stringify(r)}`)
  if (r.moreDisabled !== false) ok(false, `HALLAZGO 2 (#512, cerrado en d585178): con disabled en el grupo, «Ver N más» sigue deshabilitado (disabled=${r.moreDisabled}); las etiquetas ocultas no se pueden leer`)
  const inherit = r.av.find(([id]) => id === 'ana')?.[1], init = r.av.find(([id]) => id === 'luis')?.[1], own = r.av.find(([id]) => id === 'mia')?.[1]
  if (!inherit || !init) ok(false, `HALLAZGO 3 (#513, cerrado en d585178): item.avatar no hereda las categories del grupo (avatar: true → data-cat ${inherit}; { initials } → ${init}; con color propio → ${own})`)
  ok(own === '4', `#513: un avatar con color propio pierde su color (${own})`)
}

for (const engine of ENGINES) {
  ENGINE = engine
  const browser = await pw[engine].launch()
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } })
  const consoleErr = []
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') consoleErr.push(m.text()) })
  page.on('pageerror', (e) => consoleErr.push(e.message))
  const t0 = Date.now()
  if (run('m')) await markup(page)
  if (run(1)) await contrast(page)
  if (run(2)) for (const qs of ['theme=default-cat8', 'theme=propio-cat12', 'theme=lustre-cat12', 'theme=auditoria-cat12', 'theme=auditoria-cat8&dark=1', 'theme=auditoria-cat12&text=200', 'theme=default-cat8&text=200']) await geometry(page, qs)
  if (run(3)) await huella(page)
  if (run(4)) await tools(page)
  if (run(5)) await pista(page)
  if (run(6)) await layout(page)
  if (run(7) && engine === 'chromium') await forced(page)
  if (run(7)) await coarse(browser, engine)
  if (run(8)) await remates(page)
  ok(!consoleErr.length, `consola: ${consoleErr.slice(0, 3).join(' | ')}`)
  await browser.close()
  console.log(`${engine}: ${counts[engine] ? counts[engine].join('/') : 0} (${((Date.now() - t0) / 1000).toFixed(0)}s)`)
}
server.close()

console.log('\nMínimos de contraste (todas las categorías declaradas, 21 temas, claro y oscuro, motores pedidos):')
for (const [row, { v, where }] of Object.entries(mins)) console.log(`  ${row.padEnd(44)} ${v.toFixed(2)}  (${where})`)
for (const n of notes) console.log('nota:', n)
if (fails.length) { console.log(`\nFALLOS (${fails.length}):`); for (const f of (args.verbose ? fails : fails.slice(0, 40))) console.log(' -', f) }
console.log('\n' + Object.entries(counts).map(([e, [a, b]]) => `${e} ${a}/${b}`).join(' · '))
console.log(`${total - failed}/${total}`)
process.exit(failed ? 1 : 0)
