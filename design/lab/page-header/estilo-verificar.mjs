// Verificación de coco sobre el banco de GPageHeader (design/lab/page-header/estilo-banco.html), con el CSS real cargado en
// la capa grana.components y GBreadcrumbs, GTabs, GBtn, GBadge y GMetric reales de dist/.
// Mide: análisis estático del CSS (literales, respaldos, @property, #383, regla 7 de ancestros-trampa, muelle solo en la
// entrada y dentro de @supports); geometría (zócalo de 48px y de 44px con space 3, Δ0 al pegarse, primera pestaña
// alineada con el título, marca de la pestaña en el suelo, título compacto a medio pasar, sin desbordar a 390px, muelle de
// borde a borde de la caja, dianas táctiles ≥ 44px con pointer: coarse, RTL); movimiento (entrada con --g-ease-spring en
// slow, salida con ease-out en press, reducido = solo fundido); contraste en el tema por defecto, NisaNabani y los once
// generados, claro y oscuro, y dentro de la zona de marca (por defecto y NisaNabani, claro y oscuro); separación de la
// banda pegada frente a la página; forced-colors (Chromium); GDialog a 0; consola limpia.
// Ejecutar desde la raíz del repo (requiere dist/):  GRANA_PW_PORT=4234 node design/lab/page-header/estilo-verificar.mjs
// Opcional: --engines=chromium,firefox,webkit  --themes=all|base  --verbose
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
await new Promise((r) => server.listen(Number(process.env.GRANA_PW_PORT) || 4234, '127.0.0.1', r))
const BASE = `http://127.0.0.1:${server.address().port}/design/lab/page-header/estilo-banco.html`

const GEN = ['amazon', 'apple', 'caracol-purpura', 'github', 'grana', 'linear', 'lustre', 'medium', 'notion', 'spotify', 'stripe']
let total = 0, failed = 0
const fails = [], notes = []
const ok = (cond, msg) => { total++; if (!cond) { failed++; fails.push(msg) } }
const note = (s) => notes.push(s)

/* ---------- 0 · Análisis estático del CSS ---------- */
{
  const raw = await readFile(join(ROOT, 'packages/vue/src/components/GPageHeader/GPageHeader.css'), 'utf8')
  const css = raw.replace(/\/\*[\s\S]*?\*\//g, '')
  ok(!/#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|lab|lch|hwb|color|color-mix)\(/.test(css), 'CSS: color literal')
  const named = [...css.matchAll(/(?:color|background(?:-color)?|border[\w-]*)\s*:[^;]*\b(CanvasText|Canvas|Highlight|ButtonText|GrayText|red|blue|black|white|transparent)\b/g)].map((m) => m[1])
  ok(named.every((w) => ['CanvasText', 'transparent'].includes(w)), 'CSS: color con nombre fuera de CanvasText/transparent: ' + named)
  ok(!/var\(\s*--[\w-]+\s*,/.test(css), 'CSS: var() con valor de respaldo')
  ok(!/@layer/.test(css) && !/!important/.test(css), 'CSS: @layer o !important')
  const prop = css.match(/@property\s+(--[\w-]+)\s*\{([^}]*)\}/g) || []
  ok(prop.length === 1 && /@property --g-page-header-top \{\s*syntax: "<length>";\s*inherits: true;\s*initial-value: 0px;\s*\}/.test(prop[0]), 'CSS: @property --g-page-header-top (<length>, inherits, 0px)')
  ok(/\.g-dialog__body \{\s*--g-page-header-top: calc\(var\(--g-space-1\) \* 0\);\s*\}/.test(css), 'CSS: --g-page-header-top a 0 en .g-dialog__body')
  const vars = [...css.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1])
  ok(vars.every((v) => v.startsWith('--g-') || v.startsWith('--_')), 'CSS: var() que no es --g-* ni --_*')
  const defaults = await readFile(join(ROOT, 'packages/vue/src/styles/defaults.css'), 'utf8')
  const defined = new Set([...defaults.matchAll(/(--g-[a-z0-9-]+)\s*:/g)].map((m) => m[1]))
  const missing = [...new Set(vars.filter((v) => v.startsWith('--g-') && !defined.has(v) && !['--g-page-header-top', '--g-tabs-inset'].includes(v)))]
  ok(!missing.length, 'CSS: tokens que no existen en defaults.css ' + missing)
  ok(!defined.has('--g-page-header-top'), 'defaults.css: --g-page-header-top no es del tema (#629)')
  ok(!vars.includes('--g-color-zone-edge'), 'CSS: no lee --g-color-zone-edge (#634, §44.2)')
  ok(!vars.some((v) => /^--g-color-(on-)?brand/.test(v)), 'CSS: no lee --g-color-brand* ni on-brand* (§44.2)')
  const allowedTokens = ['--g-color-bg', '--g-color-surface', '--g-color-surface-sunken', '--g-surface-shell', '--g-color-text', '--g-color-text-muted', '--g-color-border', '--g-color-border-strong', '--g-color-focus']
  const colors = [...new Set(vars.filter((v) => v.startsWith('--g-color') || v.startsWith('--g-surface')))]
  ok(colors.every((v) => allowedTokens.includes(v)), 'CSS: tokens de color fuera de §45 / §44.5: ' + colors.filter((v) => !allowedTokens.includes(v)))
  const own = new Set([...css.matchAll(/(--_[\w-]+)\s*:/g)].map((m) => m[1]))
  const strange = [...new Set(vars.filter((v) => v.startsWith('--_') && !own.has(v)))]
  ok(!strange.length, 'CSS: lee alias --_* que no declara: ' + strange)
  const px = [...css.matchAll(/(-?\d*\.?\d+)px/g)].map((m) => m[0])
  ok(px.every((p) => p === '44px' || p === '24px' || p === '0px') && px.filter((p) => p === '0px').length === 1, 'CSS: medidas literales no permitidas ' + px)
  ok(!/\d(?:rem|em|ch|vh|vw)\b/.test(css), 'CSS: rem/em/ch/vh/vw literales')
  ok(!/@keyframes|animation\s*:/.test(css), 'CSS: keyframes o animation (todo son transiciones)')
  ok(!/ease-bounce/.test(css), 'CSS: --g-ease-bounce (no es una escala pequeña)')
  // El muelle: --g-ease-spring solo en la entrada del muelle y solo dentro de @supports linear()
  const springUses = raw.replace(/\/\*[\s\S]*?\*\//g, '').split('\n').filter((l) => /var\(--g-ease-spring\)/.test(l)).length
  ok(springUses === 1, 'CSS: --g-ease-spring en una sola declaración (la entrada del muelle): ' + springUses)
  const sup = css.match(/@supports \(transition-timing-function: linear\(0, 1\)\) \{\s*\.g-page-header__dock\.is-open \{\s*transition:\s*translate var\(--g-duration-slow\) var\(--g-ease-spring\),\s*opacity var\(--g-duration-fast\) var\(--g-ease-out\);/)
  ok(!!sup, 'CSS: entrada del muelle = translate slow + spring dentro de @supports, opacidad fast + ease-out')
  // Regla 7: ni la raíz ni el zócalo crean bloque contenedor para lo fijo
  const rootRules = [...css.matchAll(/([^{}]+)\{([^}]*)\}/g)].filter(([, sel]) => /\.g-page-header(\.[\w-]+|\[[^\]]+\])*\s*(,|$)/m.test(sel.trim()) && !/__/.test(sel))
  const trap = rootRules.filter(([, , body]) => /\b(transform|translate|scale|rotate|filter|backdrop-filter|perspective|contain|container-type|will-change)\s*:/.test(body))
  ok(!trap.length, 'CSS: la raíz lleva una propiedad-trampa para position: fixed (regla 7): ' + trap.map((t) => t[1].trim()))
  const structural = [...css.replace(/\{[^}]*\}/g, '{}').matchAll(/>\s*(\*|:[\w-]+(?:\([^)]*\)*)?)/g)].map((m) => m[1]).filter((x) => !/^:not\(:where\(\.g-tooltip\)\)|^:where\(\.g-[\w-]+\)$/.test(x))
  ok(!structural.length, 'CSS: selector de hijos por estructura sin excluir .g-tooltip (#383): ' + structural)
  ok(/@media \(prefers-reduced-motion: reduce\)/.test(css) && /@media \(forced-colors: active\)/.test(css) && /@media \(pointer: coarse\)/.test(css), 'CSS: reducido, forzados y táctil presentes')
  ok(/max\(var\(--g-space-12\), 44px\)/.test(css) && /block-size: var\(--_base-h\)/.test(css), 'CSS: alto del zócalo max(space-12, 44px) como block-size')
  // #515 + enmienda #715 (S5): ningún scroll-margin positivo; solo el negativo del zócalo pegado (lo enfocable de dentro)
  const sm = [...css.matchAll(/([^{}]+)\{[^}]*scroll-margin[^}]*\}/g)].map((m) => m[0].replace(/\s+/g, ' ').trim())
  ok(sm.length === 1 && /^\.g-page-header\.is-sticky \.g-page-header__base, \.g-page-header\.is-sticky \.g-page-header__base :not\(:where\(\.g-tooltip\)\) \{ scroll-margin-block-start: calc\(-1 \* \(var\(--g-page-header-top\) \+ var\(--_base-h\)\)\); \}$/.test(sm[0]), 'CSS: solo el scroll-margin negativo del zócalo pegado (#515, S5 #715)', sm.join(' | '))
}

/* ---------- Utilidades del navegador ---------- */
const LIB = `
window.__c = (() => {
  const cv = document.createElement('canvas'); cv.width = cv.height = 1
  const cx = cv.getContext('2d', { willReadFrequently: true })
  const rgba = (s) => { cx.clearRect(0, 0, 1, 1); cx.fillStyle = '#000'; cx.fillStyle = s; cx.fillRect(0, 0, 1, 1); const d = cx.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255] }
  const over = (f, b) => [0, 1, 2].map((i) => f[i] * f[3] + b[i] * (1 - f[3])).concat(1)
  const lum = (c) => { const [r, g, b] = c.slice(0, 3).map((v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }); return 0.2126 * r + 0.7152 * g + 0.0722 * b }
  const cr = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) }
  // Fondo efectivo: sube por los ancestros componiendo
  const bgOf = (el) => { const stack = []; for (let n = el; n; n = n.parentElement) { const c = rgba(getComputedStyle(n).backgroundColor); if (c[3] > 0) stack.push(c); if (c[3] >= 1) break } let acc = [255, 255, 255, 1]; for (const c of stack.reverse()) acc = over(c, acc); return acc }
  const txt = (el, bgEl) => { const f = rgba(getComputedStyle(el).color); const b = bgOf(bgEl || el); return cr(over(f, b), b) }
  return { rgba, over, cr, bgOf, txt }
})()`

async function open(browser, q = '', vp = { width: 1280, height: 800 }, extra = {}) {
  const ctx = await browser.newContext({ viewport: vp, ...extra })
  const page = await ctx.newPage()
  const errs = []
  page.on('console', (m) => { if (m.type() === 'error' && !/favicon|404|downloadable font/.test(m.text())) errs.push(m.text()) })
  page.on('pageerror', (e) => errs.push(e.message))
  await page.goto(BASE + (q ? '?' + q : ''), { waitUntil: 'domcontentloaded', timeout: 90000 })
  await page.waitForFunction(() => window.__ph && document.querySelector('.g-tabs'), null, { timeout: 90000 }); await page.evaluate(() => document.fonts.ready)
  await page.evaluate(LIB)
  await page.waitForTimeout(150)
  return { ctx, page, errs }
}
const scrollTo = async (page, y) => { await page.evaluate((y) => { scrollTo(0, y); window.__ph.measure() }, y); await page.waitForTimeout(60); await page.evaluate(() => window.__ph.measure()); await page.waitForTimeout(40) }
const settle = (page, ms = 500) => page.waitForTimeout(ms)

for (const engine of ENGINES) {
  const browser = await pw[engine].launch()
  const E = `[${engine}]`

  /* ---------- 1 · Geometría en escritorio ---------- */
  {
    const { ctx, page, errs } = await open(browser)
    const g0 = await page.evaluate(() => {
      const r = document.querySelector('.g-page-header'), b = document.querySelector('.g-page-header__base')
      const t = document.querySelector('.g-page-header__title'), tab = document.querySelector('.g-tabs__tab .g-tabs__label, .g-tabs__tab')
      const range = document.createRange(); range.selectNodeContents(t.firstChild ? t : t)
      const tx = range.getClientRects()[0].left
      const lab = document.querySelector('.g-tabs__tab'); const rr = document.createRange(); rr.selectNodeContents(lab); const labX = [...rr.getClientRects()].find((x) => x.width > 0).left
      const hdr = document.querySelector('.g-page-header__tabs .g-tabs__header').getBoundingClientRect()
      return { baseH: b.getBoundingClientRect().height, bottom: b.getBoundingClientRect().bottom, hdrBottom: hdr.bottom, tx, labX, bodyY: document.getElementById('contenido').getBoundingClientRect().top + scrollY, rootH: r.getBoundingClientRect().height, titleW: document.querySelector('.g-page-header__base-title').getBoundingClientRect().width, cls: r.className }
    })
    ok(Math.abs(g0.baseH - 48) < 0.01, `${E} zócalo de 48px en reposo: ${g0.baseH}`)
    ok(Math.abs(g0.hdrBottom - g0.bottom) < 0.6, `${E} las pestañas apoyan en el suelo: ${g0.hdrBottom} vs ${g0.bottom}`)
    ok(Math.abs(g0.tx - g0.labX) <= 1.5, `${E} la primera pestaña alinea con el título (--g-tabs-inset): ${g0.tx} vs ${g0.labX}`)
    ok(g0.titleW < 0.5, `${E} título compacto sin ancho en reposo: ${g0.titleW}`)
    ok(/is-sticky/.test(g0.cls) && !/is-stuck/.test(g0.cls), `${E} sticky sin stuck en reposo: ${g0.cls}`)
    const shadow0 = await page.evaluate(() => getComputedStyle(document.querySelector('.g-page-header')).boxShadow)
    ok(shadow0 === 'none', `${E} sin sombra en reposo: ${shadow0}`)
    // Medio paso: --_p intermedio
    const lift = await page.evaluate(() => parseFloat(document.querySelector('.g-page-header').style.getPropertyValue('--_lift')))
    const tTop = await page.evaluate(() => document.querySelector('.g-page-header__title').getBoundingClientRect().top + scrollY)
    const tH = await page.evaluate(() => document.querySelector('.g-page-header__title').getBoundingClientRect().height)
    await scrollTo(page, tTop - 56 + tH / 2)
    const mid = await page.evaluate(() => { const r = document.querySelector('.g-page-header'); const bt = document.querySelector('.g-page-header__base-title'); const cs = getComputedStyle(bt); return { p: parseFloat(r.style.getPropertyValue('--_p')), op: parseFloat(cs.opacity), tr: cs.translate, w: bt.getBoundingClientRect().width, bodyY: document.getElementById('contenido').getBoundingClientRect().top + scrollY } })
    ok(mid.p > 0.3 && mid.p < 0.7, `${E} --_p a medio pasar: ${mid.p}`)
    ok(Math.abs(mid.op - mid.p) < 0.02, `${E} opacidad del título compacto = --_p: ${mid.op} vs ${mid.p}`)
    ok(/^0px [0-9.]+px$/.test(mid.tr) && parseFloat(mid.tr.split(' ')[1]) > 0 && parseFloat(mid.tr.split(' ')[1]) <= 16.01, `${E} translate del título ≤ space × 4: ${mid.tr}`)
    ok(Math.abs(mid.bodyY - g0.bodyY) < 0.5, `${E} Δ0 del cuerpo a medio hundir: ${mid.bodyY - g0.bodyY}`)
    // Pegado
    await scrollTo(page, 900); await settle(page, 300)
    const g1 = await page.evaluate(() => { const r = document.querySelector('.g-page-header'), b = document.querySelector('.g-page-header__base'); return { cls: r.className, baseTop: b.getBoundingClientRect().top, baseH: b.getBoundingClientRect().height, rootH: r.getBoundingClientRect().height, bodyY: document.getElementById('contenido').getBoundingClientRect().top + scrollY, line: getComputedStyle(b).boxShadow, sh: getComputedStyle(r).boxShadow, p: r.style.getPropertyValue('--_p'), titleW: document.querySelector('.g-page-header__base-title').getBoundingClientRect().width } })
    ok(/is-stuck/.test(g1.cls), `${E} pegado: ${g1.cls}`)
    ok(Math.abs(g1.baseTop - 56) < 0.6, `${E} zócalo pegado a --g-page-header-top (56): ${g1.baseTop}`)
    ok(Math.abs(g1.baseH - 48) < 0.01 && Math.abs(g1.rootH - g0.rootH) < 0.01, `${E} el encabezado no encoge (Δ alto 0): ${g1.rootH - g0.rootH}`)
    ok(Math.abs(g1.bodyY - g0.bodyY) < 0.5, `${E} Δ0 del cuerpo pegado: ${g1.bodyY - g0.bodyY}`)
    ok(/inset/.test(g1.line) && !/rgba\(0, 0, 0, 0\)/.test(g1.line), `${E} el suelo pegado gana su línea: ${g1.line}`)
    ok(g1.sh !== 'none', `${E} sombra al pegarse: ${g1.sh}`)
    ok(g1.p === '1' && g1.titleW > 40, `${E} título compacto entero pegado: p=${g1.p} w=${g1.titleW}`)
    // Línea uniforme: bajo las pestañas no se suman dos líneas (el __tabs opaco tapa la del suelo)
    const tabsBg = await page.evaluate(() => { const a = __c.rgba(getComputedStyle(document.querySelector('.g-page-header__tabs')).backgroundColor); return a[3] })
    ok(tabsBg === 1, `${E} __tabs opaco (una sola línea bajo las pestañas): alfa ${tabsBg}`)
    // Vuelta arriba
    await scrollTo(page, 0); await settle(page, 300)
    const g2 = await page.evaluate(() => ({ cls: document.querySelector('.g-page-header').className, bodyY: document.getElementById('contenido').getBoundingClientRect().top + scrollY }))
    ok(!/is-stuck/.test(g2.cls) && Math.abs(g2.bodyY - g0.bodyY) < 0.5, `${E} vuelta arriba sin pegar y Δ0: ${g2.cls}`)
    // space 3 → el zócalo cae a 44px
    await page.addStyleTag({ content: ':root{--g-space-1:3px;--g-space-12:36px}' }); await page.evaluate(() => window.__ph.measure()); await settle(page, 100)
    const h3 = await page.evaluate(() => document.querySelector('.g-page-header__base').getBoundingClientRect().height)
    ok(Math.abs(h3 - 44) < 0.01, `${E} con space 3 el zócalo mide 44px: ${h3}`)
    // GDialog a 0
    const dlg = await page.evaluate(() => { const d = document.createElement('div'); d.className = 'g-dialog__body'; document.body.appendChild(d); const v = getComputedStyle(d).getPropertyValue('--g-page-header-top').trim(); d.remove(); return v })
    ok(dlg === '0px', `${E} --g-page-header-top a 0 en .g-dialog__body: ${dlg}`)
    ok(!errs.length, `${E} consola limpia (escritorio): ${errs}`)
    await ctx.close()
  }

  /* ---------- 2 · Estrecho, táctil, muelle y movimiento ---------- */
  for (const coarse of [false, true]) {
    const { ctx, page, errs } = await open(browser, 'w=390', { width: 390, height: 800 }, coarse ? { hasTouch: true, isMobile: engine !== 'firefox' } : {})
    const C = `${E}${coarse ? '[coarse]' : ''}`
    const n0 = await page.evaluate(() => ({ cls: document.querySelector('.g-page-header').className, sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, bt: getComputedStyle(document.querySelector('.g-page-header__base-title') || document.body).display, hasBT: !!document.querySelector('.g-page-header__base-title'), coarse: matchMedia('(pointer: coarse)').matches }))
    ok(/is-narrow/.test(n0.cls), `${C} is-narrow a 390px`)
    ok(n0.sw <= n0.cw, `${C} sin desbordamiento horizontal a 390px: ${n0.sw} > ${n0.cw}`)
    ok(!n0.hasBT || n0.bt === 'none', `${C} sin título compacto en estrecho`)
    if (coarse && !n0.coarse) note(`${C} el motor no emula pointer: coarse; las dianas se miden igual`)
    await scrollTo(page, 1000); await settle(page, 700)
    const d = await page.evaluate(() => {
      const r = document.querySelector('.g-page-header'), dk = document.querySelector('.g-page-header__dock'), rr = r.getBoundingClientRect(), dr = dk.getBoundingClientRect()
      const t = document.querySelector('.g-page-header__dock-title').getBoundingClientRect()
      const btns = [...dk.querySelectorAll('.g-btn')].map((b) => { const a = getComputedStyle(b, '::after'); const br = b.getBoundingClientRect(); return [Math.max(br.width, parseFloat(a.width) || 0), Math.max(br.height, parseFloat(a.height) || 0)] })
      const cs = getComputedStyle(dk)
      return { cls: r.className, open: dk.classList.contains('is-open'), hidden: dk.hidden, l: dr.left, r: dr.right, rl: rr.left, rr: rr.right, bottom: dr.bottom, vh: innerHeight, th: t.height, btns, tf: cs.transitionTimingFunction, td: cs.transitionDuration, tp: cs.transitionProperty, tr: cs.translate, op: cs.opacity, inHost: !!dk.querySelector('.g-page-header__dock-host .g-page-header__actions'), sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }
    })
    ok(/is-docked/.test(d.cls) && d.open && !d.hidden && d.inHost, `${C} muelle abierto con las acciones dentro: ${d.cls}`)
    ok(Math.abs(d.l - d.rl) < 0.6 && Math.abs(d.r - d.rr) < 0.6, `${C} muelle de borde a borde de la caja: ${d.l}-${d.r} vs ${d.rl}-${d.rr}`)
    ok(Math.abs(d.bottom - d.vh) < 0.6, `${C} muelle pegado al borde inferior: ${d.bottom} vs ${d.vh}`)
    ok(d.tr === 'none' || d.tr === '0px' || d.tr === '0px 0px', `${C} muelle asentado (translate 0): ${d.tr}`)
    ok(Math.abs(parseFloat(d.op) - 1) < 0.01, `${C} muelle opaco abierto: ${d.op}`)
    ok(/linear\(/.test(d.tf) && /cubic-bezier\(0\.23, 1, 0\.32, 1\)/.test(d.tf) && /0\.24s/.test(d.td), `${C} entrada: translate con --g-ease-spring en slow (240ms), opacidad ease-out: ${d.tf} · ${d.td}`)
    ok(d.sw <= d.cw, `${C} sin desbordamiento con el muelle: ${d.sw}`)
    if (coarse) {
      ok(d.th >= 44, `${C} enlace del muelle ≥ 44px: ${d.th}`)
      ok(d.btns.every(([w, h]) => w >= 44 && h >= 44), `${C} acciones del muelle ≥ 44 × 44: ${JSON.stringify(d.btns)}`)
    } else ok(d.th >= 24, `${C} enlace del muelle ≥ 24px: ${d.th}`)
    // Salida: ease-out en press, y hidden al terminar
    await scrollTo(page, 0)
    await page.waitForTimeout(40)
    const x = await page.evaluate(() => { const dk = document.querySelector('.g-page-header__dock'); const cs = getComputedStyle(dk); return { tf: cs.transitionTimingFunction, td: cs.transitionDuration, open: dk.classList.contains('is-open') } })
    ok(!x.open && !/linear\(/.test(x.tf) && /0\.16s/.test(x.td), `${C} salida: ease-out en press (160ms): ${x.tf} · ${x.td}`)
    await settle(page, 600)
    const x2 = await page.evaluate(() => ({ hidden: document.querySelector('.g-page-header__dock').hidden, home: !!document.querySelector('.g-page-header__actions-home .g-page-header__actions') }))
    ok(x2.hidden && x2.home, `${C} muelle cerrado (hidden) y acciones de vuelta en el zócalo`)
    ok(!errs.length, `${C} consola limpia (estrecho): ${errs}`)
    await ctx.close()
  }

  /* ---------- 3 · Movimiento reducido ---------- */
  {
    const { ctx, page } = await open(browser, 'w=390', { width: 390, height: 800 }, { reducedMotion: 'reduce' })
    const tTop = await page.evaluate(() => document.querySelector('.g-page-header__title').getBoundingClientRect().top + scrollY)
    await scrollTo(page, tTop - 56 + 10)
    await page.evaluate(() => { document.querySelector('.g-page-header').classList.remove('is-narrow') }) // solo para leer el título compacto
    await scrollTo(page, 1000); await page.waitForTimeout(80)
    const r = await page.evaluate(() => { const dk = document.querySelector('.g-page-header__dock'); const cs = getComputedStyle(dk); return { tp: cs.transitionProperty, tf: cs.transitionTimingFunction, tr: cs.translate, open: dk.classList.contains('is-open') } })
    ok(r.open, `${E}[reducido] muelle abierto`)
    ok(r.tp === 'opacity' && !/linear\(/.test(r.tf), `${E}[reducido] el muelle solo funde (sin translate ni spring): ${r.tp} · ${r.tf}`)
    ok(r.tr === 'none', `${E}[reducido] muelle sin translate: ${r.tr}`)
    await ctx.close()
    const { ctx: c2, page: p2 } = await open(browser, '', { width: 1280, height: 800 }, { reducedMotion: 'reduce' })
    const tTop2 = await p2.evaluate(() => document.querySelector('.g-page-header__title').getBoundingClientRect().top + scrollY)
    const tH = await p2.evaluate(() => document.querySelector('.g-page-header__title').getBoundingClientRect().height)
    await scrollTo(p2, tTop2 - 56 + tH * 0.3)
    const m = await p2.evaluate(() => { const bt = document.querySelector('.g-page-header__base-title'); return { p: document.querySelector('.g-page-header').style.getPropertyValue('--_p'), tr: getComputedStyle(bt).translate } })
    ok((m.p === '0' || m.p === '1') && m.tr === 'none', `${E}[reducido] --_p ∈ {0, 1} y título sin translate: ${m.p} · ${m.tr}`)
    await c2.close()
  }

  /* ---------- 4 · RTL ---------- */
  {
    const { ctx, page } = await open(browser, 'rtl=1')
    await scrollTo(page, 900); await settle(page, 200)
    const r = await page.evaluate(() => { const root = document.querySelector('.g-page-header').getBoundingClientRect(); const bt = document.querySelector('.g-page-header__base-title').getBoundingClientRect(); const tabs = document.querySelector('.g-page-header__tabs').getBoundingClientRect(); const act = document.querySelector('.g-page-header__actions').getBoundingClientRect(); return { rootR: root.right, btR: bt.right, tabsR: tabs.right, actL: act.left, rootL: root.left } })
    ok(Math.abs(r.rootR - 24 - r.btR) < 1, `${E}[rtl] el título compacto al principio lógico (derecha): ${r.btR} vs ${r.rootR - 24}`)
    ok(r.tabsR < r.btR && Math.abs(r.actL - (r.rootL + 24)) < 1, `${E}[rtl] pestañas tras el título y acciones al final lógico (izquierda): ${r.actL}`)
    await ctx.close()
    const { ctx: c2, page: p2 } = await open(browser, 'rtl=1&w=390', { width: 390, height: 800 })
    await scrollTo(p2, 1000); await settle(p2, 600)
    const d = await p2.evaluate(() => { const rr = document.querySelector('.g-page-header').getBoundingClientRect(), dr = document.querySelector('.g-page-header__dock').getBoundingClientRect(); const t = document.querySelector('.g-page-header__dock-title').getBoundingClientRect(); return { ok: Math.abs(dr.left - rr.left) < 0.6 && Math.abs(dr.right - rr.right) < 0.6, tR: t.right, dR: dr.right } })
    ok(d.ok, `${E}[rtl] muelle de borde a borde de la caja`)
    ok(d.tR > d.dR - 24, `${E}[rtl] enlace del muelle al principio lógico (derecha): ${d.tR} vs ${d.dR}`)
    await c2.close()
  }

  /* ---------- 5 · Contraste: temas, claro y oscuro, zona ---------- */
  const themes = args.themes === 'base' ? ['', 'nsa'] : ['', 'nsa', ...GEN]
  const cases = []
  for (const th of themes) for (const dark of [false, true]) cases.push({ th, dark, zone: false })
  for (const th of ['', 'nsa']) for (const dark of [false, true]) cases.push({ th, dark, zone: true })
  for (const c of cases) {
    const q = [c.th && 'theme=' + c.th, c.dark && 'dark=1', c.zone && 'zone=1'].filter(Boolean).join('&')
    const name = `${E}[${c.th || 'defecto'}${c.dark ? '·oscuro' : '·claro'}${c.zone ? '·zona' : ''}]`
    const { ctx, page } = await open(browser, q)
    await scrollTo(page, 900); await settle(page, 300)
    const m = await page.evaluate(() => {
      const $ = (s) => document.querySelector(s)
      const root = $('.g-page-header')
      const prim = $('.x-primary'), mark = $('.g-tabs__mark')
      const out = {
        title: __c.txt($('.g-page-header__title'), root),
        eyebrow: __c.txt($('.g-page-header__eyebrow'), root),
        desc: __c.txt($('.g-page-header__desc'), root),
        meta: __c.txt($('.g-page-header__meta > span:not(.g-badge)'), root),
        compact: __c.txt($('.g-page-header__base-title'), root),
        tab: __c.txt($('.g-tabs__tab[aria-selected="false"]'), root),
        tabSel: __c.txt($('.g-tabs__tab[aria-selected="true"]'), root),
        primary: __c.cr(__c.rgba(getComputedStyle(prim).color), __c.bgOf(prim)),
        primaryFill: __c.cr(__c.bgOf(prim), __c.bgOf(root)),
        markOnBg: mark ? __c.cr(__c.over(__c.rgba(getComputedStyle(mark).backgroundColor), __c.bgOf(root)), __c.bgOf(root)) : null,
        focus: __c.cr(__c.rgba(getComputedStyle(root).getPropertyValue('--g-color-focus').trim()), __c.bgOf(root)),
        crumbs: Math.min(...[...document.querySelectorAll('.g-breadcrumbs a, .g-breadcrumbs [aria-current]')].map((e) => __c.txt(e, e))),
        // Separación de la banda pegada frente a la página que pasa por debajo
        bandVsPage: __c.cr(__c.bgOf(root), __c.bgOf(document.body)),
        lineVsPage: __c.cr(__c.over(__c.rgba(getComputedStyle(root).getPropertyValue('--g-color-border').trim()), __c.bgOf(root)), __c.bgOf(document.body)),
        lineVsBand: __c.cr(__c.over(__c.rgba(getComputedStyle(root).getPropertyValue('--g-color-border').trim()), __c.bgOf(root)), __c.bgOf(root))
      }
      return out
    })
    // El muelle (zona incluida): en 390px
    await page.setViewportSize({ width: 390, height: 800 }); await page.evaluate(() => window.__ph.measure()); await scrollTo(page, 1400); await settle(page, 600)
    const dm = await page.evaluate(() => { const dk = document.querySelector('.g-page-header__dock'); if (!dk || dk.hidden) return null; const prim = dk.querySelector('.x-primary'); return { title: __c.txt(dk.querySelector('.g-page-header__dock-title'), dk), primary: prim ? __c.cr(__c.rgba(getComputedStyle(prim).color), __c.bgOf(prim)) : null, edge: __c.cr(__c.over(__c.rgba(getComputedStyle(dk).borderTopColor), __c.bgOf(dk)), __c.bgOf(document.body)) } })
    const MIN = 4.5
    for (const k of ['title', 'eyebrow', 'desc', 'meta', 'compact', 'tab', 'tabSel', 'primary']) ok(m[k] >= MIN, `${name} ${k} ${m[k].toFixed(2)} < 4,5`)
    ok(m.focus >= 3, `${name} foco ${m.focus.toFixed(2)} < 3`)
    if (m.markOnBg !== null) ok(m.markOnBg >= 3, `${name} marca de la pestaña ${m.markOnBg.toFixed(2)} < 3`)
    ok(m.crumbs >= MIN, `${name} ruta (GBreadcrumbs) ${m.crumbs.toFixed(2)} < 4,5`)
    ok(dm && dm.title >= MIN && (dm.primary === null || dm.primary >= MIN), `${name} muelle: título ${dm && dm.title.toFixed(2)}, principal ${dm && dm.primary && dm.primary.toFixed(2)}`)
    if (args.verbose || c.zone || !c.th || c.th === 'nsa') note(`${name} h1 ${m.title.toFixed(2)} · desc ${m.desc.toFixed(2)} · eyebrow ${m.eyebrow.toFixed(2)} · compacto ${m.compact.toFixed(2)} · pestaña ${m.tab.toFixed(2)}/${m.tabSel.toFixed(2)} · marca ${m.markOnBg && m.markOnBg.toFixed(2)} · principal ${m.primary.toFixed(2)} (relleno/banda ${m.primaryFill.toFixed(2)}) · foco ${m.focus.toFixed(2)} · ruta ${m.crumbs.toFixed(2)} · muelle ${dm && dm.title.toFixed(2)}/${dm && dm.primary && dm.primary.toFixed(2)} · banda/página ${m.bandVsPage.toFixed(2)} · suelo/página ${m.lineVsPage.toFixed(2)} · suelo/banda ${m.lineVsBand.toFixed(2)} · filo del muelle/página ${dm && dm.edge.toFixed(2)}`)
    await ctx.close()
  }

  /* ---------- 6 · Colores forzados (Chromium) ---------- */
  if (engine === 'chromium') {
    const { ctx, page } = await open(browser, 'w=390', { width: 390, height: 800 }, { forcedColors: 'active' })
    await scrollTo(page, 1000); await settle(page, 600)
    const f = await page.evaluate(() => { const b = getComputedStyle(document.querySelector('.g-page-header__base')); const d = getComputedStyle(document.querySelector('.g-page-header__dock')); const canvasText = (() => { const e = document.createElement('i'); e.style.color = 'CanvasText'; document.body.appendChild(e); const c = getComputedStyle(e).color; e.remove(); return c })(); return { bs: b.borderBottomStyle, bc: b.borderBottomColor, dc: d.borderTopColor, ct: canvasText, h: document.querySelector('.g-page-header__base').getBoundingClientRect().height } })
    ok(f.bs === 'solid' && f.bc === f.ct, `[chromium][forzados] suelo pegado con borde CanvasText: ${f.bs} ${f.bc} (${f.ct})`)
    ok(f.dc === f.ct, `[chromium][forzados] filo del muelle CanvasText: ${f.dc}`)
    ok(Math.abs(f.h - 48) < 0.01, `[chromium][forzados] el zócalo sigue en 48px con el borde: ${f.h}`)
    await ctx.close()
  }
  await browser.close()
}
server.close()
console.log(notes.join('\n'))
console.log(`\n${total - failed}/${total} comprobaciones correctas`)
if (fails.length) { console.log('FALLOS:\n' + fails.join('\n')); process.exitCode = 1 }
