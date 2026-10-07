// Verificación de coco sobre el banco de GTag + GTagGroup (design/lab/chip/estilo-banco.html), con el CSS real
// (GTag.css y GTagGroup.css de src/, dentro de grana.components) y GAvatar, GBtn, GIcon y la pista reales de dist/.
// Mide: análisis estático (solo var(--g-*) que existen o la familia de categorías permitida a cada hoja, alias --_tag-/--_tgg-
// y el dato --_ghost-w, sin respaldos, sin literales de color ni de medida salvo 24px/44px/1px del texto oculto, sin @layer,
// !important ni keyframes, sin muelle ni rebote, :hover solo en (hover: hover), selectores sin hijos por estructura, #383);
// contraste de cada fila de la tabla de tag.md §«Contraste» en 8 temas generados con @grana/cli (por defecto, lustre,
// spotify y uno con primary propia, con 8 y 12 categorías), claro y oscuro, con la tapa y la pulsada al pasar; geometría
// (alto space × 8 / × 6, tapa alto × alto de borde a borde, cuerpo ≥ 24px, avatar concéntrico, marca 0 → 1em, recorte solo
// con control, estática partida, separación × 2, racimo del alto de una etiqueta, esquinas del último valor) en tres temas;
// la huella (Δ0 en posición y ancho de todas las etiquetas al quitar, también con avatar, pulsada y en un racimo; discontinua,
// tachada, sin color; «Deshacer» con el foco), la vista previa tachada al apuntar y al enfocar con teclado, la tapa
// invertida; la recogida (salida con posiciones intermedias; instantánea con movimiento reducido) y la marca que se abre;
// foco visible (hacia dentro en el racimo); RTL; 320px sin desplazamiento; forced-colors (Chromium) sin cambio de caja;
// puntero grueso (≥ 44px); consola limpia.
// Ejecutar desde la raíz del repo (requiere dist/):  GRANA_PW_PORT=4213 node design/lab/chip/estilo-verificar.mjs
// Opcional: --engines=chromium,firefox,webkit (por defecto los tres)   --verbose
import http from 'node:http'
import { readFile } from 'node:fs/promises'
import { readFileSync } from 'node:fs'
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
    res.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream' }).end(await readFile(p))
  } catch { if (!res.headersSent) res.writeHead(404).end() }
})
await new Promise((r) => server.listen(Number(process.env.GRANA_PW_PORT) || 4213, '127.0.0.1', r))
const BASE = `http://127.0.0.1:${server.address().port}/design/lab/chip/estilo-banco.html`

const THEMES = ['default-cat8', 'default-cat12', 'lustre-cat8', 'lustre-cat12', 'spotify-cat8', 'spotify-cat12', 'propio-cat8', 'propio-cat12']
let total = 0, failed = 0, ENGINE = 'static'
const fails = [], notes = []
const ok = (cond, msg) => { total++; if (!cond) { failed++; fails.push(`[${ENGINE}] ${msg}`) } }
// WebKit en macOS no lleva Tab a botones ni enlaces (preferencia del sistema): Option+Tab
const TAB = () => (ENGINE === 'webkit' ? 'Alt+Tab' : 'Tab')
const near = (a, b, t = 0.6) => Math.abs(a - b) <= t
const mins = {} // fila → { v, where }
const rec = (row, v, where) => { if (!mins[row] || v < mins[row].v) mins[row] = { v, where } }

/* ---------- 0 · Análisis estático ---------- */
{
  const defaults = readFileSync(join(ROOT, 'packages/vue/src/styles/defaults.css'), 'utf8')
  const defined = new Set([...defaults.matchAll(/(--g-[a-z0-9-]+)\s*:/g)].map((m) => m[1]))
  const K = '(?:[1-9]|1[0-2])'
  const SHEETS = {
    'GTag/GTag.css': { cat: new RegExp(`^--g-color-(?:cat-${K}(?:-strong|-soft|-text)?|on-cat-${K}(?:-soft)?)$`), alias: /^--_(?:tag-[a-z-]+|ghost-w)$/ },
    'GTagGroup/GTagGroup.css': { cat: new RegExp(`^--g-color-cat-${K}-text$`), alias: /^--_tgg-[a-z-]+$/ }
  }
  for (const [name, rule] of Object.entries(SHEETS)) {
    const raw = readFileSync(join(ROOT, 'packages/vue/src/components', name), 'utf8')
    const css = raw.replace(/\/\*[\s\S]*?\*\//g, '')
    for (const m of css.matchAll(/var\((--[a-z0-9_-]+)/g)) {
      const v = m[1]
      if (v.startsWith('--g-')) ok(defined.has(v) || rule.cat.test(v), `${name}: ${v} no existe en defaults.css ni es de la familia permitida`)
      else ok(rule.alias.test(v), `${name}: alias ${v} fuera del prefijo`)
    }
    for (const m of css.matchAll(/(--[a-z0-9_-]+)\s*:/g)) ok(rule.alias.test(m[1]) && m[1] !== '--_ghost-w', `${name}: declara ${m[1]} (solo alias propios; --_ghost-w es del .vue)`)
    ok(!/var\([^)]*,/.test(css), `${name}: var() con respaldo`)
    ok(!/#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|lab|lch)\(/.test(css), `${name}: color literal`)
    ok(!/@layer|!important|@keyframes|@property/.test(css), `${name}: @layer, !important, @keyframes o @property`)
    ok(!/ease-spring|ease-bounce/.test(css), `${name}: muelle o rebote (#471: ningún uso nuevo)`)
    const px = [...css.matchAll(/(-?\d*\.?\d+)px/g)].map((m) => m[1])
    ok(px.every((n) => ['24', '44', '1', '-1'].includes(n)), `${name}: medidas literales ${[...new Set(px)].join(', ')}`)
    const ms = [...css.matchAll(/\b\d+m?s\b/g)].map((m) => m[0])
    ok(!ms.length, `${name}: duraciones literales ${ms.join(', ')}`)
    // :hover solo dentro de (hover: hover)
    const outside = css.replace(/@media \(hover: hover\) \{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, '').replace(/@media \(forced-colors: active\) \{[\s\S]*$/, '')
    ok(!/:hover/.test(outside), `${name}: :hover fuera de @media (hover: hover)`)
    // #383/#394: ningún selector por estructura sin clase propia
    ok(!/>\s*\*|:(?:first|last|nth|nth-last)-child(?!\(1 of \.g-tag-group__value\))|~/.test(css), `${name}: selector estructural sin clase (#383)`)
    ok(/@media \(prefers-reduced-motion: reduce\)/.test(css) && /@media \(forced-colors: active\)/.test(css), `${name}: falta movimiento reducido o forced-colors`)
  }
  const tag = readFileSync(join(ROOT, 'packages/vue/src/components/GTag/GTag.css'), 'utf8')
  ok(/@media \(pointer: coarse\)/.test(tag), 'GTag.css: sin puntero grueso')
}

/* ---------- Utilidades en la página ---------- */
const HELPERS = () => {
  window.$rgb = (s) => { const m = String(s).match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p[3] ?? 1 } }
  window.$mix = (fg, bg) => ({ r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a), a: 1 })
  window.$bg = (el) => { // fondo efectivo: compone las capas translúcidas sobre la primera opaca
    const layers = []
    for (let e = el; e; e = e.parentElement) { const c = $rgb(getComputedStyle(e).backgroundColor); if (c && c.a > 0) { layers.push(c); if (c.a >= 1) break } }
    let acc = layers.pop() || { r: 255, g: 255, b: 255, a: 1 }
    while (layers.length) acc = $mix(layers.pop(), acc)
    return acc
  }
  window.$lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b) }
  window.$cr = (a, b) => { if (!a || !b) return 0; const x = $lum(a), y = $lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) }
  window.$ink = (el, prop = 'color') => { const c = $rgb(getComputedStyle(el)[prop]); return c && c.a < 1 ? $mix(c, $bg(el)) : c }
  window.$t = (t) => document.querySelector(`[data-test="${t}"]`)
}
const NO_TRANSITIONS = '*, *::before, *::after { transition: none !important; }'

async function open(page, qs = '') {
  await page.goto(`${BASE}${qs}`)
  await page.waitForFunction(() => window.BENCH?.ready && document.fonts.status === 'loaded')
  await page.evaluate(HELPERS)
}

/* ---------- 1 · Contraste: 8 temas × claro/oscuro ---------- */
async function contrast(page) {
  for (const theme of THEMES) for (const dark of [false, true]) {
    const where = `${theme}${dark ? ' oscuro' : ''}`
    await open(page, `?theme=${theme}${dark ? '&dark=1' : ''}`)
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
        const facet = T('facet'); o.spine = $cr($ink(facet, 'borderLeftColor'), surface); o.spinePage = $cr($ink(facet, 'borderLeftColor'), $bg(facet.closest('.host').parentElement))
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
      // Al pasar: la tapa invertida (quitable, pulsada quitable, racimo) y la pulsada (-strong, contorno -text)
      for (const [t, row] of [['rem', 'Tapa al pasar (invertida)'], ['on-rem', 'Tapa al pasar sobre la pulsada'], ['vrem', 'Racimo: tapa al pasar']]) {
        await page.hover(`[data-test="m-${k}-${t}"] .g-tag__remove`)
        const v = await page.evaluate((s) => { const c = document.querySelector(s); return $cr($ink(c), $bg(c)) }, `[data-test="m-${k}-${t}"] .g-tag__remove`)
        rec(row, v, lab); ok(v >= 4.5, `${lab}: ${row} ${v.toFixed(2)} < 4.5`)
      }
      await page.hover(`[data-test="m-${k}-on"] .g-tag__body`)
      const hv = await page.evaluate((t) => { const e = $t(t); return { text: $cr($ink(e), $bg(e)), edge: $cr($ink(e, 'borderTopColor'), $bg(e.parentElement)), strong: getComputedStyle(e).backgroundColor } }, `m-${k}-on`)
      rec('Pulsada al pasar: texto / -strong', hv.text, lab); ok(hv.text >= 4.5, `${lab}: pulsada al pasar ${hv.text.toFixed(2)}`)
      rec('Pulsada al pasar: contorno / surface', hv.edge, lab); ok(hv.edge >= 3, `${lab}: contorno de la pulsada al pasar ${hv.edge.toFixed(2)}`)
      await page.hover(`[data-test="m-${k}-free"] .g-tag__body`)
      const fv = await page.evaluate((t) => { const e = $t(t); return $cr($ink(e), $bg(e)) }, `m-${k}-free`)
      rec('Racimo libre al pasar: texto / sunken', fv, lab); ok(fv >= 4.5, `${lab}: racimo libre al pasar ${fv.toFixed(2)}`)
      await page.mouse.move(0, 0)
    }
    // Categoría que el tema no declara: sin relleno (límite documentado)
    if (n === 8) ok(await page.evaluate(() => getComputedStyle($t('m-9-static')).backgroundColor === 'rgba(0, 0, 0, 0)'), `${where}: categoría 9 sin declarar debería quedar sin relleno`)
    // Huella: quitar «Látex» del grupo y medir «Deshacer», el contorno discontinuo y el texto atenuado; foco
    await page.click('[data-test="g-flow-lat"] .g-tag__remove')
    const g = await page.evaluate(() => { const t = $t('g-flow-lat'), u = t.querySelector('.g-tag__undo'), s = $bg(t.parentElement); return { undo: $cr($ink(u), $bg(u)), dash: $cr($ink(t, 'borderTopColor'), s), text: $cr($ink(t.querySelector('.g-tag__text')), s), focus: $cr($rgb(getComputedStyle(u).outlineColor), s), outline: getComputedStyle(u).outlineStyle } })
    for (const [row, v, min] of [['Huella: «Deshacer»', g.undo, 4.5], ['Huella: contorno discontinuo', g.dash, 3], ['Huella: texto tachado', g.text, 4.5]]) { rec(row, v, where); ok(v >= min, `${where}: ${row} ${v.toFixed(2)} < ${min}`) }
    await page.keyboard.press('Shift+' + TAB()); await page.keyboard.press(TAB())
    const f = await page.evaluate(() => { const u = document.activeElement; return { cls: u.className, c: $cr($rgb(getComputedStyle(u).outlineColor), $bg(u.closest('.host'))), s: getComputedStyle(u).outlineStyle } })
    rec('Anillo de foco / surface', f.c, where); ok(f.s === 'solid' && f.c >= 3, `${where}: anillo de foco ${f.s} ${f.c.toFixed(2)} (${f.cls})`)
  }
}

/* ---------- 2 · Geometría ---------- */
async function geometry(page, theme) {
  await open(page, `?theme=${theme}`)
  const r = await page.evaluate(() => {
    const sp = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--g-space-1'))
    const bw = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--g-border-width'))
    const out = { sp, bw, cases: {} }
    for (const el of document.querySelectorAll('#cases [data-test]')) {
      const b = el.getBoundingClientRect(), cap = el.querySelector('.g-tag__remove'), body = el.querySelector('.g-tag__body'), txt = el.querySelector('.g-tag__text')
      const lead = el.querySelector('.g-tag__lead .g-avatar'), chk = el.querySelector('.g-tag__check')
      out.cases[el.dataset.test] = {
        h: b.height, w: b.width, top: b.top, right: b.right, left: b.left, bottom: b.bottom,
        cap: cap && (({ width, height, top, right, bottom }) => ({ width, height, top, right, bottom }))(cap.getBoundingClientRect()),
        capR: cap && getComputedStyle(cap).borderTopRightRadius, tagR: getComputedStyle(el).borderTopRightRadius, shape: getComputedStyle(document.documentElement).getPropertyValue('--g-radius-shape'),
        hit: parseFloat(getComputedStyle(body, '::after').height), bodyH: body.getBoundingClientRect().height, bodyW: body.getBoundingClientRect().width, interactive: /^(A|BUTTON)$/.test(body.tagName),
        cut: txt.scrollWidth > txt.clientWidth + 1, ws: getComputedStyle(txt).whiteSpace, lines: Math.round(txt.getBoundingClientRect().height / parseFloat(getComputedStyle(txt).lineHeight)),
        fs: parseFloat(getComputedStyle(el).fontSize),
        av: lead && (({ width, top, left, right, bottom }) => ({ width, top, left, right, bottom }))(lead.getBoundingClientRect()),
        chk: chk && chk.getBoundingClientRect().width, textLeft: txt.getBoundingClientRect().left, bodyLeft: body.getBoundingClientRect().left
      }
    }
    const gap = (() => { const a = $t('g-flow-pen').getBoundingClientRect(), b = $t('g-flow-lat').getBoundingClientRect(); return b.left - a.right })()
    const fac = $t('g-facets-facet-0'), facB = fac.getBoundingClientRect()
    const last = fac.querySelector('.g-tag-group__value:last-child > .g-tag')
    const vals = [...fac.querySelectorAll('.g-tag-group__value > .g-tag')].map((t) => t.getBoundingClientRect().height)
    out.flow = { gap, facetH: facB.height, vals, lastR: getComputedStyle(last).borderTopRightRadius, facR: getComputedStyle(fac).borderTopRightRadius, spine: parseFloat(getComputedStyle(fac).borderLeftWidth) }
    const sm = $t('g-facets-sm-facet-0').getBoundingClientRect().height
    out.flow.facetSm = sm
    const tools = document.querySelector('#g-limit .g-tag-group__more').getBoundingClientRect(), firstTag = $t('g-limit-l0').getBoundingClientRect()
    out.flow.toolsMid = (tools.top + tools.bottom) / 2 - (firstTag.top + firstTag.bottom) / 2
    out.flow.toolsH = tools.height
    return out
  })
  const { sp, bw, cases } = r
  for (const s of ['md', 'sm']) {
    const H = sp * (s === 'md' ? 8 : 6)
    for (const [k, c] of Object.entries(cases).filter(([k]) => k.startsWith(s + '-'))) {
      const where = `${theme} ${k}`
      if (k.endsWith('long-static')) { ok(c.lines >= 2 && c.h > H && !c.cut && c.ws !== 'nowrap', `${where}: la estática larga se parte (líneas ${c.lines}, alto ${c.h})`); continue }
      ok(near(c.h, H), `${where}: alto ${c.h} ≠ ${H}`)
      ok(c.fs >= 12, `${where}: texto ${c.fs}px < 12`)
      ok(c.w <= sp * 60 + 0.6, `${where}: ancho ${c.w} > space × 60`)
      if (c.interactive) ok(c.hit >= 24 - 0.5, `${where}: área del cuerpo interactivo ${c.hit} < 24`)
      if (c.cap) {
        ok(near(c.cap.width, H) && near(c.cap.height, H), `${where}: tapa ${c.cap.width}×${c.cap.height} ≠ ${H}×${H}`)
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
      if (/^(md|sm)-toggle$/.test(k)) ok(near(c.textLeft - c.bodyLeft, sp * (s === 'md' ? 3 : 2), 0.6), `${where}: sin pulsar la marca no deja hueco (${(c.textLeft - c.bodyLeft).toFixed(2)})`)
    }
  }
  const H = sp * 8
  ok(near(r.flow.gap, sp * 2), `${theme}: separación entre etiquetas ${r.flow.gap} ≠ space × 2`)
  ok(near(r.flow.facetH, H), `${theme}: racimo ${r.flow.facetH} ≠ ${H}`)
  ok(near(r.flow.facetSm, sp * 6), `${theme}: racimo sm ${r.flow.facetSm} ≠ ${sp * 6}`)
  ok(r.flow.vals.every((v) => near(v, H - 2 * bw)), `${theme}: valores del racimo ${r.flow.vals} ≠ alto − 2 bordes`)
  ok(near(r.flow.spine, Math.floor(sp * 0.75)) || near(r.flow.spine, sp * 0.75), `${theme}: lomo ${r.flow.spine} ≠ space × 0.75 (ajustado al píxel)`)
  ok(r.flow.lastR !== '0px' || r.flow.facR === '0px', `${theme}: el último valor no lleva las esquinas del racimo (${r.flow.lastR})`)
  ok(Math.abs(r.flow.toolsMid) <= 1, `${theme}: «Ver N más» no está centrado con las etiquetas (${r.flow.toolsMid})`)
}

/* ---------- 3 · Huella, vista previa, tapa invertida, recogida, marca ---------- */
const rects = (page, gid) => page.evaluate((gid) => [...document.querySelectorAll(`#${gid} .g-tag`)].map((t) => { const b = t.getBoundingClientRect(); return { id: t.dataset.test, x: +(b.left + scrollX).toFixed(2), y: +(b.top + scrollY).toFixed(2), w: +b.width.toFixed(2) } }), gid)
async function huella(page) {
  await open(page, '?theme=default-cat8')
  // Δ0 al quitar: normal, con avatar, pulsada quitable, enlace; y en un racimo
  for (const [gid, id] of [['g-flow', 'pen'], ['g-flow', 'ana'], ['g-flow', 'urg'], ['g-flow', 'vue'], ['g-flow-sm', 'ibu'], ['g-facets', 'p1'], ['g-facets', 'e2'], ['g-facets-sm', 'a1'], ['g-facets', 'x1']]) {
    const before = await rects(page, gid)
    await page.click(`[data-test="${gid}-${id}"] .g-tag__remove`)
    const after = await rects(page, gid)
    const bad = before.filter((b, i) => !after[i] || !near(b.x, after[i].x, 0.5) || !near(b.y, after[i].y, 0.5) || !near(b.w, after[i].w, 0.5))
    ok(!bad.length && before.length === after.length, `Δ0 ${gid}:${id}: ${JSON.stringify(bad.map((b, i) => [b, after[before.indexOf(b)]]))}`)
    const s = await page.evaluate((t) => { const e = $t(t), tx = e.querySelector('.g-tag__text'), cs = getComputedStyle(e); return { ghost: e.classList.contains('is-ghost'), style: e.classList.contains('is-plain') ? cs.outlineStyle : cs.borderTopStyle, deco: getComputedStyle(tx).textDecorationLine, color: cs.color, muted: getComputedStyle(document.documentElement).getPropertyValue('--g-color-text-muted'), lead: e.querySelector('.g-tag__lead') && getComputedStyle(e.querySelector('.g-tag__lead')).filter, bg: cs.backgroundColor, focus: document.activeElement.classList.contains('g-tag__undo') && e.contains(document.activeElement) } }, `${gid}-${id}`)
    ok(s.ghost && s.style === 'dashed' && /line-through/.test(s.deco), `huella ${gid}:${id}: ${JSON.stringify(s)}`)
    ok(s.bg === 'rgba(0, 0, 0, 0)', `huella ${gid}:${id}: con relleno ${s.bg}`)
    if (s.lead) ok(/grayscale\(1\)/.test(s.lead), `huella ${gid}:${id}: el hueco no pierde el color (${s.lead})`)
    ok(s.focus, `huella ${gid}:${id}: «Deshacer» sin el foco`)
    // Deshacer en su sitio: vuelve igual
    await page.click(`[data-test="${gid}-${id}"] .g-tag__undo`)
    const back = await rects(page, gid)
    ok(back.every((b, i) => near(b.x, before[i].x, 0.5) && near(b.w, before[i].w, 0.5)), `deshacer ${gid}:${id}: no vuelve a la misma caja`)
  }
  // Vista previa: tachado al apuntar la tapa y al enfocarla con teclado; tapa invertida
  await page.mouse.move(0, 0)
  const capSel = '[data-test="g-flow-mar"] .g-tag__remove'
  const pre = await page.evaluate(() => { const t = $t('g-flow-mar'); return { fg: getComputedStyle(t).color, bg: getComputedStyle(t).backgroundColor } })
  await page.hover(capSel); await page.waitForTimeout(250)
  const hov = await page.evaluate((s) => { const c = document.querySelector(s); return { deco: getComputedStyle($t('g-flow-mar').querySelector('.g-tag__text')).textDecorationLine, bg: getComputedStyle(c).backgroundColor, ink: getComputedStyle(c).color } }, capSel)
  ok(/line-through/.test(hov.deco), 'vista previa: apuntar la tapa no tacha el texto')
  ok(hov.bg === pre.fg && hov.ink === pre.bg, `tapa invertida: fondo ${hov.bg} / ${pre.fg}, icono ${hov.ink} / ${pre.bg}`)
  await page.mouse.move(0, 0); await page.waitForTimeout(250)
  ok(await page.evaluate(() => getComputedStyle($t('g-flow-mar').querySelector('.g-tag__text')).textDecorationLine === 'none'), 'vista previa: el tachado no se va al salir')
  await page.focus('[data-test="g-flow-vue"] .g-tag__remove'); await page.keyboard.press(TAB())
  const kf = await page.evaluate(() => ({ on: document.activeElement.closest('[data-test]')?.dataset.test, deco: getComputedStyle($t('g-flow-mar').querySelector('.g-tag__text')).textDecorationLine, ow: getComputedStyle(document.activeElement).outlineWidth, fw: getComputedStyle(document.documentElement).getPropertyValue('--g-focus-width').trim() }))
  ok(/line-through/.test(kf.deco), `vista previa con teclado: ${JSON.stringify(kf)}`)
  ok(kf.ow === kf.fw, `foco visible en la tapa: ${kf.ow} ≠ ${kf.fw}`)
  // Foco en el racimo hacia dentro
  await page.focus('[data-test="g-facets-toggles-t2"] .g-tag__body'); await page.keyboard.press('Shift+' + TAB()); await page.keyboard.press(TAB())
  const rf = await page.evaluate(() => ({ off: parseFloat(getComputedStyle(document.activeElement).outlineOffset), st: getComputedStyle(document.activeElement).outlineStyle }))
  ok(rf.st === 'solid' && rf.off < 0, `foco en el racimo: ${JSON.stringify(rf)}`)

  // Recogida: quitar dos, salir puntero y foco → is-settling con posiciones intermedias → fuera del DOM
  for (const reduce of [false, true]) {
    await page.emulateMedia({ reducedMotion: reduce ? 'reduce' : 'no-preference' })
    await open(page, '?theme=default-cat8')
    await page.click('[data-test="g-flow-lat"] .g-tag__remove')
    await page.click('[data-test="g-flow-ibu"] .g-tag__remove')
    ok(await page.evaluate(() => document.querySelectorAll('#g-flow .is-ghost').length === 2), 'dos huellas a la vez')
    const tr = page.evaluate(() => new Promise((res) => {
      const frames = []; const t0 = performance.now()
      const step = () => { const t = document.querySelector('#g-flow [data-id="lat"] > .g-tag'); frames.push(t ? +t.getBoundingClientRect().width.toFixed(1) : -1); if (frames.at(-1) === -1 || performance.now() - t0 > 1500) res(frames); else requestAnimationFrame(step) }
      requestAnimationFrame(step)
    }))
    await page.mouse.move(2, 2); await page.evaluate(() => document.activeElement.blur())
    await page.mouse.click(2, 2)
    const frames = await tr
    const w0 = frames[0], mid = frames.filter((w) => w > 3 && w < w0 - 0.5)
    ok(frames.at(-1) === -1, `recogida ${reduce ? 'reducida' : ''}: la huella no sale del DOM (${frames.slice(-3)})`)
    if (reduce) ok(mid.length === 0, `recogida con movimiento reducido: ${mid.length} posiciones intermedias (debe ser instantánea)`)
    else ok(mid.length >= 2, `recogida: ${mid.length} posiciones intermedias (${frames.join(' ')})`)
    ok(await page.evaluate(() => document.querySelectorAll('#g-flow .is-ghost').length === 0), 'recogida: quedan huellas')
    // La marca se abre (0 → 1em) con posiciones intermedias; con movimiento reducido aparece sin abrirse
    await page.mouse.move(0, 0)
    const ck = page.evaluate(() => new Promise((res) => {
      const el = $t('g-facets-toggles-t2').querySelector('.g-tag__check'); const frames = []; const t0 = performance.now()
      const step = () => { frames.push(+el.getBoundingClientRect().width.toFixed(1)); if (performance.now() - t0 > 600) res(frames); else requestAnimationFrame(step) }
      requestAnimationFrame(step)
    }))
    await page.click('[data-test="g-facets-toggles-t2"] .g-tag__body')
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
  // Nada al montar: ninguna transición en curso al cargar (con el puntero fuera de toda etiqueta)
  await page.mouse.move(0, 0)
  await open(page, '?theme=default-cat8')
  ok(await page.evaluate(() => document.getAnimations().length === 0), 'algo se anima al montar')
}

/* ---------- 4 · RTL, 320, pista (#383) ---------- */
async function layout(page) {
  await open(page, '?theme=lustre-cat8&dir=rtl')
  const r = await page.evaluate(() => {
    const t = $t('md-rem'), b = t.getBoundingClientRect(), c = t.querySelector('.g-tag__remove').getBoundingClientRect()
    const fac = $t('g-facets-facet-0'), cs = getComputedStyle(fac)
    const fil = getComputedStyle(t.querySelector('.g-tag__remove'), '::before')
    const undo = (() => { return null })()
    return { capLeft: c.left - b.left, capW: c.width, spineR: parseFloat(cs.borderRightWidth), spineL: parseFloat(cs.borderLeftWidth), filRight: fil.right, filLeft: fil.left, scroll: document.scrollingElement.scrollWidth - innerWidth }
  })
  ok(near(r.capLeft, 0), `RTL: la tapa no está al final lógico (izquierda): ${r.capLeft}`)
  ok(r.spineR > r.spineL, `RTL: el lomo no está a la derecha (${r.spineR} / ${r.spineL})`)
  ok(r.filRight === '0px', `RTL: el filo de la tapa no está a su inicio lógico (right ${r.filRight})`)
  ok(r.scroll <= 0, `RTL: desplazamiento horizontal ${r.scroll}`)
  await page.click('[data-test="g-flow-pen"] .g-tag__remove')
  ok(await page.evaluate(() => getComputedStyle($t('g-flow-pen').querySelector('.g-tag__undo svg')).scale === '-1 1'), 'RTL: undo-2 no se espeja')
  // 320px
  await page.setViewportSize({ width: 320, height: 800 })
  for (const d of ['', '&dir=rtl']) {
    await open(page, `?theme=propio-cat12${d}`)
    const s = await page.evaluate(() => ({ sw: document.scrollingElement.scrollWidth - innerWidth, name: [...document.querySelectorAll('#g-narrow-facets .g-tag-group__facet-name')].map((n) => { const r = document.createRange(); r.selectNodeContents(n); return new Set([...r.getClientRects()].map((x) => Math.round(x.top))).size }) }))
    ok(s.sw <= 0, `320px${d}: desplazamiento horizontal ${s.sw}`)
    ok(s.name.every((l) => l === 1), `320px${d}: el nombre de una faceta se parte (${s.name})`)
  }
  await page.setViewportSize({ width: 1200, height: 900 })
  // La pista es hija de la raíz: con y sin ella, la etiqueta suelta y el grupo miden igual (#383)
  await open(page, '?theme=default-cat8')
  const tip = await page.evaluate(() => {
    const a = $t('lone-tip').getBoundingClientRect(), b = $t('lone').getBoundingClientRect()
    const g = document.querySelector('#g-flow'); const before = g.getBoundingClientRect().height; g.querySelector('.g-tooltip').remove(); return { a: a.width - b.width, ah: a.height - b.height, g: g.getBoundingClientRect().height - before }
  })
  ok(near(tip.ah, 0) && tip.g === 0, `#383: la pista cambia la caja ${JSON.stringify(tip)}`)
}

/* ---------- 5 · forced-colors (Chromium) y puntero grueso ---------- */
async function forced(page) {
  await open(page, '?theme=default-cat8')
  const sizes = () => page.evaluate(() => [...document.querySelectorAll('#cases .g-tag, #g-facets .g-tag-group__facet')].map((t) => { const b = t.getBoundingClientRect(); return [+b.width.toFixed(1), +b.height.toFixed(1)] }))
  const s0 = await sizes()
  await page.emulateMedia({ forcedColors: 'active' })
  const s1 = await sizes()
  ok(JSON.stringify(s0) === JSON.stringify(s1), 'forced-colors: cambia la caja de alguna etiqueta')
  const f = await page.evaluate(() => {
    const c = (t, p = 'borderTopColor') => getComputedStyle($t(t))[p]
    const fil = getComputedStyle($t('md-rem').querySelector('.g-tag__remove'), '::before').backgroundColor
    return { rest: c('md-static'), pressedBg: c('md-pressed', 'backgroundColor'), pressedFg: c('md-pressed', 'color'), canvas: getComputedStyle(document.body).backgroundColor, fil, facet: getComputedStyle($t('g-facets-facet-0')).borderTopColor, check: getComputedStyle($t('md-pressed').querySelector('.g-tag__check')).opacity }
  })
  ok(f.rest !== 'rgba(0, 0, 0, 0)' && f.rest !== f.canvas, `forced-colors: contorno en reposo ${f.rest}`)
  ok(f.pressedBg !== f.canvas && f.pressedFg !== f.pressedBg && f.check === '1', `forced-colors: pulsada ${JSON.stringify(f)}`)
  ok(f.fil !== f.canvas && f.fil !== 'rgba(0, 0, 0, 0)', `forced-colors: filo de la tapa ${f.fil}`)
  ok(f.facet !== f.canvas, `forced-colors: marco del racimo ${f.facet}`)
  await page.click('[data-test="g-flow-pen"] .g-tag__remove')
  ok(await page.evaluate(() => getComputedStyle($t('g-flow-pen')).borderTopStyle === 'dashed'), 'forced-colors: la huella no es discontinua')
  await page.emulateMedia({ forcedColors: 'none' })
}
async function coarse(browser, engine) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: engine === 'chromium' })
  const p = await ctx.newPage()
  await open(p, '?theme=default-cat8')
  if (!(await p.evaluate(() => matchMedia('(pointer: coarse)').matches))) { notes.push(`${engine}: pointer: coarse no se emula (44px sin medir)`); await ctx.close(); return }
  const r = await p.evaluate(() => ['sm-rem', 'md-rem', 'sm-toggle', 'sm-link', 'md-pressed-rem'].map((t) => {
    const el = $t(t); const parts = [el.querySelector('.g-tag__remove'), el.querySelector('a.g-tag__body, button.g-tag__body')].filter(Boolean)
    return parts.map((x) => { const a = getComputedStyle(x, '::after'); return [t, parseFloat(a.width), parseFloat(a.height)] })
  }).flat())
  for (const [t, w, h] of r) ok(w >= 44 - 0.5 && h >= 44 - 0.5, `${engine} puntero grueso ${t}: área ${w}×${h} < 44`)
  ok(await p.evaluate(() => document.scrollingElement.scrollWidth <= innerWidth), `${engine} puntero grueso: desplazamiento horizontal`)
  await ctx.close()
}

for (const engine of ENGINES) {
  ENGINE = engine
  const browser = await pw[engine].launch()
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } })
  const consoleErr = []
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') consoleErr.push(m.text()) })
  page.on('pageerror', (e) => consoleErr.push(e.message))
  const t0 = Date.now()
  await contrast(page)
  for (const th of ['default-cat8', 'propio-cat12', 'lustre-cat12']) await geometry(page, th)
  await huella(page)
  await layout(page)
  if (engine === 'chromium') await forced(page)
  await coarse(browser, engine)
  ok(!consoleErr.length, `consola: ${consoleErr.slice(0, 3).join(' | ')}`)
  await browser.close()
  console.log(`${engine}: ${total} comprobaciones acumuladas, ${failed} fallos (${((Date.now() - t0) / 1000).toFixed(0)}s)`)
}
server.close()

console.log('\nMínimos de contraste (todas las categorías, 8 temas, claro y oscuro, motores pedidos):')
for (const [row, { v, where }] of Object.entries(mins)) console.log(`  ${row.padEnd(44)} ${v.toFixed(2)}  (${where})`)
for (const n of notes) console.log('nota:', n)
if (fails.length) { console.log(`\nFALLOS (${fails.length}):`); for (const f of (args.verbose ? fails : fails.slice(0, 40))) console.log(' -', f) }
console.log(`\n${total - failed}/${total}`)
process.exit(failed ? 1 : 0)
