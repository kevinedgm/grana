// Auditoría de coco (paso 5) de los NIVELES ANIDADOS de GDialog (GDialogStep, modo pasos B, GFormFold C, la llegada) y de los
// defectos #565 a #568 sobre el COMPONENTE REAL: design/lab/dialog/auditoria-pasos-banco.html con GDialog/GDialogStep de
// dist/grana.umd.js, GFormFold de dist/form-fold.umd.js, dist/grana.css y dist/fonts.css.
// Qué mide: 0 · CSS fuente y publicado (tokens, respaldos, literales, curvas, clases y variables frente a la tabla de dialog.md,
// #651); M · marcado real frente al contrato; 1 · contraste y tamaño de texto en 26 configuraciones (defecto, el tema de la
// auditoría de @grana/cli y los once de dark-color-presence/generated, claro y oscuro); 2 · áreas (24px y, con pointer: coarse,
// 44px); 3 · foco visible; 4 · comportamiento y foco (avanzar, volver, backTo, Esc, Esc mantenida, fondo, cierre, resultado con
// llegada y anuncio, error sin bajar, pliegues, fondo con un pliegue abierto, apilado con un solo fondo); 5 · movimiento (curva
// y duración por token, borde superior Δ0 entre pasos y al abrir un pliegue, alto entre pasos, desplazamiento restaurado, RTL,
// reducido); 6 · hoja a 375px y reflujo a 320px, texto al 200 %; 7 · forced-colors (donde el motor lo emula); consola limpia.
// Ejecutar desde la raíz del repo:  GRANA_PW_PORT=4209 node design/lab/dialog/auditoria-pasos-verificar.mjs
// Opcional: --engines=chromium,firefox,webkit  --themes=base (solo defecto y auditoría)  --only=0,m,1,…  --verbose
import http from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const pw = await import(new URL('../theme-playground/node_modules/playwright/index.mjs', import.meta.url))
const ROOT = fileURLToPath(new URL('../../../', import.meta.url))
const DISTDIR = join(ROOT, 'packages/vue/dist')
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')).map(([k, v]) => [k, v ?? true]))
const ENGINES = (args.engines || 'chromium,firefox,webkit').split(',')
const ONLY = args.only ? new Set(String(args.only).split(',')) : null
const run = (n) => !ONLY || ONLY.has(String(n))
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const server = http.createServer(async (req, res) => {
  try {
    const p = normalize(join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname)))
    if (!p.startsWith(ROOT)) throw new Error('fuera')
    const body = await readFile(p)
    res.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream' }).end(body)
  } catch { try { if (!res.headersSent) res.writeHead(404); res.end() } catch {} }
})
await new Promise((r) => server.listen(Number(process.env.GRANA_PW_PORT) || 4209, '127.0.0.1', r))
const BASE = `http://127.0.0.1:${server.address().port}/design/lab/dialog/auditoria-pasos-banco.html`

const GEN = ['amazon', 'apple', 'caracol-purpura', 'github', 'grana', 'linear', 'lustre', 'medium', 'notion', 'spotify', 'stripe']
let total = 0, failed = 0
const fails = [], notes = []
const counts = {}
const ok = (cond, msg, eng = 'estático') => {
  total++; counts[eng] = counts[eng] || [0, 0]; counts[eng][1]++
  if (cond) counts[eng][0]++; else { failed++; fails.push(msg) }
  if (args.verbose) console.log(cond ? '  ok ' : '  NO ', msg)
}
const note = (s) => notes.push(s)
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '')

/* ---------- 0 · CSS fuente y publicado ---------- */
if (run(0)) {
  const dlgRaw = await readFile(join(ROOT, 'packages/vue/src/components/GDialog/GDialog.css'), 'utf8')
  const foldRaw = await readFile(join(ROOT, 'packages/vue/src/components/GFormFold/GFormFold.css'), 'utf8')
  const defaults = await readFile(join(ROOT, 'packages/vue/src/styles/defaults.css'), 'utf8')
  const defined = new Set([...defaults.matchAll(/(--g-[a-z0-9-]+)\s*:/g)].map((m) => m[1]))
  for (const [name, raw] of [['GDialog.css', dlgRaw], ['GFormFold.css', foldRaw]]) {
    const css = strip(raw)
    ok(!/#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|lab|lch|hwb|color|color-mix)\(/.test(css), `${name}: color literal`)
    const words = [...css.matchAll(/(?:color|background|border(?:-[a-z-]+)?|outline(?:-color)?)\s*:\s*([^;]+);/g)].flatMap((m) => m[1].split(/[\s,()]+/)).filter((w) => /^[A-Za-z]+$/.test(w))
    const COLORS = /^(red|blue|green|black|white|gray|grey|orange|purple|yellow|pink|navy|silver|maroon|teal|olive|aqua|fuchsia|lime)$/i
    ok(!words.some((w) => COLORS.test(w)), `${name}: color con nombre`)
    const sys = words.filter((w) => /^(Canvas|CanvasText|ButtonText|ButtonFace|Highlight|HighlightText|GrayText|LinkText|Field|FieldText)$/.test(w))
    ok(!sys.length || /@media \(forced-colors: active\)/.test(css), `${name}: color del sistema fuera de forced-colors`)
    ok(!/var\(\s*--[\w-]+\s*,/.test(css), `${name}: var() con valor de respaldo`)
    ok(!/@layer/.test(css) && !/!important/.test(css), `${name}: @layer o !important`)
    const vars = [...css.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1])
    ok(vars.every((v) => v.startsWith('--g-') || v.startsWith('--_')), `${name}: var() que no es --g-* ni --_*`)
    const missing = [...new Set(vars.filter((v) => v.startsWith('--g-') && !defined.has(v)))]
    ok(!missing.length, `${name}: tokens que no existen en defaults.css: ${missing}`)
    ok(!/ease-spring|ease-bounce|cubic-bezier|steps\(/.test(css), `${name}: muelle, rebote o curva propia (#299: nunca en diálogos)`)
    const px = [...new Set([...css.matchAll(/(-?\d*\.?\d+)px/g)].map((m) => m[0]))]
    const PX = ['24px', '44px', '0px', '1px', '-1px', '521px', '520px', '900px']
    ok(px.every((p) => PX.includes(p)), `${name}: medidas literales no permitidas ${px.filter((p) => !PX.includes(p))}`)
    // Toda animación o transición que DESPLAZA va dentro de prefers-reduced-motion: no-preference
    let ctx = [], pending = ''
    const moving = []
    for (const t of css.split(/([{}])/)) {
      if (t === '{') { ctx.push(pending.trim()); pending = '' }
      else if (t === '}') { ctx.pop(); pending = '' }
      else {
        pending += t
        const tr = t.match(/transition\s*:([^;]*)/)
        const an = t.match(/animation\s*:([^;]*)/)
        // Una transición de 0s (cambio en un cuadro, p. ej. la pista del pliegue con reduce) no es movimiento
        const trMoves = tr && tr[1].split(',').some((it) => /translate|scale|grid-template-rows|margin-block-start/.test(it) && !/^\s*[\w-]+\s+0s\b/.test(it))
        if (trMoves || (an && /step-from|resize|thread|back-in|g-landed\s/.test(an[1] + ' '))) moving.push(ctx.join(' » '))
      }
    }
    ok(moving.length > 0 && moving.every((c) => /prefers-reduced-motion: no-preference/.test(c) || /\.g-dialog__(close|back) \{|\.g-dialog__close,\s*\.g-dialog__back/.test(c) || /\[data-g-landed\]::before/.test(c)),
      `${name}: movimiento fuera de no-preference: ${moving.filter((c) => !/no-preference/.test(c)).join(' | ')}`)
  }
  {
    const css = strip(dlgRaw)
    // La escala de pulsación de cierre/Volver (scale en transition) existe fuera del bloque, pero reduce la anula
    ok(/@media \(prefers-reduced-motion: reduce\)[\s\S]*\.g-dialog__close:active \{ scale: none; \}[\s\S]*\.g-dialog__back:active \{ scale: none; \}/.test(css), 'GDialog.css: reduce anula la pulsación de cierre y Volver')
    // La llegada fuera de no-preference: con reduce, el mismo anillo solo se funde (g-landed-fade)
    ok(/@media \(prefers-reduced-motion: reduce\)[\s\S]*\[data-g-landed\]::before \{[^}]*animation: g-landed-fade/.test(css), 'GDialog.css: reduce cambia la llegada a g-landed-fade')
    // Nombres de animación que el .vue reconoce (steps.js onAnimationEnd y utils/landing.js)
    const kf = [...css.matchAll(/@keyframes ([\w-]+)/g)].map((m) => m[1])
    ok(['g-dialog-step-from-end', 'g-dialog-step-from-start', 'g-dialog-step-fade', 'g-dialog-resize', 'g-landed', 'g-landed-fade'].every((k) => kf.includes(k)), 'GDialog.css: faltan keyframes del protocolo ' + kf)
    const onStep = [...css.matchAll(/\.g-dialog__step\.is-entering \{\s*animation: ([\w-]+)/g)].map((m) => m[1])
    ok(onStep.length === 3 && onStep.every((n) => n.startsWith('g-dialog-step')), 'GDialog.css: la animación del panel no empieza por g-dialog-step (el .vue no retiraría is-entering) ' + onStep)
    ok(/\.g-dialog--steps\.is-resizing \{\s*animation: g-dialog-resize var\(--g-duration-slow\) var\(--g-ease-out\)/.test(css), 'GDialog.css: g-dialog-resize con slow + ease-out')
    ok(/@keyframes g-dialog-resize \{\s*from \{ block-size: var\(--_step-from-h\); \}\s*to \{ block-size: var\(--_step-to-h\); \}/.test(css), 'GDialog.css: g-dialog-resize de --_step-from-h a --_step-to-h')
    ok(!/interpolate-size/.test(css), 'GDialog.css: interpolate-size (descartado en #651)')
    ok(!/infinite/.test(css), 'GDialog.css: animación infinita (#539: ninguna animación de carga pasa de 5 s)')
    // #651: el paso actual del hilo en el par accent-soft / on-accent-soft
    ok(/\.g-dialog__trail-item\.is-current \.g-dialog__trail-step \{\s*background: var\(--g-color-accent-soft\);\s*color: var\(--g-color-on-accent-soft\);/.test(css), 'GDialog.css: paso actual sin el par accent-soft / on-accent-soft (#651)')
    ok(/\.g-dialog\.is-stacked::backdrop \{\s*background: transparent;/.test(css), 'GDialog.css: is-stacked::backdrop transparente (#567)')
    // La llegada en ::before, en accent-text, con focus-width
    ok(/\[data-g-landed\]::before \{[^}]*border: var\(--g-focus-width\) solid var\(--g-color-accent-text\)/.test(css), 'GDialog.css: la llegada no es un anillo de focus-width en accent-text en ::before')
    // Clases y variables de la tabla de dialog.md (#651) frente al CSS
    const contract = await readFile(join(ROOT, 'design/contracts/dialog.md'), 'utf8')
    const table = contract.slice(contract.indexOf('## Clases (contrato entre bruno y coco)'), contract.indexOf('## Personalidad'))
    const inTable = new Set([...table.matchAll(/`(g-dialog[\w-]*|is-[\w-]+|has-[\w-]+|__[\w-]+|--_[\w-]+|data-g-[\w-]+)`/g)].map((m) => m[1]))
    const STEPS = ['g-dialog--steps', 'is-forward', 'is-back', 'has-sheet-hold', 'g-dialog__back', 'g-dialog__trail', '__trail-list', '__trail-item', '__trail-step', '__trail-number', '__trail-title', 'is-parent', 'is-current', 'g-dialog__step', 'is-entering', 'is-resizing', '--_step-from-h', '--_step-to-h', 'g-dialog__sr', '--_fold-gap', 'data-g-landed', 'is-stacked']
    ok(STEPS.every((c) => inTable.has(c)), 'dialog.md: la tabla de clases no recoge ' + STEPS.filter((c) => !inTable.has(c)))
    const used = (c) => {
      const full = c.startsWith('__') ? 'g-dialog' + c : c
      if (full.startsWith('--_')) return css.includes(`var(${full})`) || strip(foldRaw).includes(`var(${full})`)
      if (full.startsWith('data-')) return css.includes(`[${full}]`)
      return new RegExp('\\.' + full.replace(/[-]/g, '\\-') + '(?![\\w-])').test(css)
    }
    // is-entering e is-current del panel, el hilo y las variables: todos con regla
    ok(STEPS.every(used), 'GDialog.css: clase o variable de la tabla sin regla: ' + STEPS.filter((c) => !used(c)))
    const cssClasses = new Set([...css.matchAll(/\.(g-dialog[\w-]*)/g)].map((m) => m[1]))
    const tableFull = new Set([...inTable].map((c) => (c.startsWith('__') ? 'g-dialog' + c : c)))
    // Las de la tabla vieja que escribe el componente r01 (g-dialog__header…, size, density…) también están
    const strayClasses = [...cssClasses].filter((c) => !tableFull.has(c) && !/^g-dialog--(size|density|placement|mobile)-/.test(c) && !['g-dialog__titles', 'g-dialog__title', 'g-dialog__description', 'g-dialog__icon', 'g-dialog__close', 'g-dialog-pulse'].includes(c))
    ok(!strayClasses.length, 'GDialog.css: clases que no están en la tabla de dialog.md: ' + strayClasses)
    const ownVars = [...new Set([...css.matchAll(/var\((--_[\w-]+)/g)].map((m) => m[1]))]
    const declared = new Set([...css.matchAll(/(--_[\w-]+)\s*:/g)].map((m) => m[1]))
    const INLINE = ['--_origin-x', '--_origin-y', '--_pin-top', '--_step-from-h', '--_step-to-h', '--_sheet-hold']
    ok(ownVars.every((v) => declared.has(v) || INLINE.includes(v)), 'GDialog.css: lee alias --_* que ni declara ni escribe el .vue: ' + ownVars.filter((v) => !declared.has(v) && !INLINE.includes(v)))
    ok(INLINE.every((v) => tableFull.has(v) || ['--_origin-x', '--_origin-y', '--_pin-top', '--_sheet-hold'].includes(v)), 'dialog.md: variable en línea fuera de la tabla')
    ok(!strip(foldRaw).includes('var(--_d)'), 'GFormFold.css: consume --_d (la tabla dice que no, #651)')
    const meta = JSON.parse(await readFile(join(ROOT, 'packages/vue/src/components/GDialogStep/GDialogStep.meta.json'), 'utf8'))
    ok(meta.classes.every((c) => used(c)), 'GDialogStep.meta.json: clases sin regla en GDialog.css ' + meta.classes)
    ok(meta.style === 'packages/vue/src/components/GDialog/GDialog.css', 'GDialogStep.meta.json: style no apunta a GDialog.css')
  }
  // Publicado
  const dcss = await readFile(join(DISTDIR, 'grana.css'), 'utf8')
  const layerAt = dcss.indexOf('@layer grana.components')
  ok(layerAt >= 0 && dcss.indexOf('.g-dialog__trail-step') > layerAt && dcss.indexOf('.g-form-fold__panel') > layerAt, 'dist: hilo o pliegue fuera de @layer grana.components')
  ok(dcss.split('.g-dialog__trail').length === strip(dlgRaw).split('.g-dialog__trail').length, 'dist: grana.css no coincide con GDialog.css (reconstruir)')
  ok(dcss.split('.g-form-fold').length === strip(foldRaw).split('.g-form-fold').length, 'dist: grana.css no coincide con GFormFold.css (reconstruir)')
  ok(!/data:font/.test(dcss), 'dist: fuente incrustada')
  const djs = await readFile(join(DISTDIR, 'grana.js'), 'utf8')
  const fjs = await readFile(join(DISTDIR, 'form-fold.js'), 'utf8')
  ok(/name: "GDialogStep"/.test(djs) && !/name: "GFormFold"/.test(djs) && /name: "GFormFold"/.test(fjs), 'dist: GDialogStep en el principal y GFormFold solo en su entrada (#590)')
}

/* ---------- En la página ---------- */
const lib = () => {
  const cv = document.createElement('canvas'); cv.width = cv.height = 1
  const cx = cv.getContext('2d', { willReadFrequently: true })
  const parse = (s) => {
    if (!s || s === 'transparent') return [0, 0, 0, 0]
    cx.clearRect(0, 0, 1, 1); cx.fillStyle = 'rgba(0,0,0,0)'; cx.fillStyle = s; cx.fillRect(0, 0, 1, 1)
    const d = cx.getImageData(0, 0, 1, 1).data
    // fillRect sobre lienzo transparente: el alfa viene en d[3]; los canales no van premultiplicados en getImageData
    return [d[0], d[1], d[2], d[3] / 255]
  }
  const over = (top, bot) => { const a = top[3]; return [top[0] * a + bot[0] * (1 - a), top[1] * a + bot[1] * (1 - a), top[2] * a + bot[2] * (1 - a), 1] }
  const bgOf = (el) => {
    const layers = []
    for (let n = el; n; n = n.parentElement) {
      const c = parse(getComputedStyle(n).backgroundColor)
      if (c[3] > 0) { layers.push(c); if (c[3] >= 0.999) break }
      if (n.tagName === 'DIALOG') break
    }
    let base = parse(getComputedStyle(document.body).backgroundColor)
    if (base[3] < 1) base = [255, 255, 255, 1]
    for (let i = layers.length - 1; i >= 0; i--) base = over(layers[i], base)
    return base
  }
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]) }
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return +((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)).toFixed(2) }
  const col = (el, prop = 'color', pseudo) => parse(getComputedStyle(el, pseudo)[prop])
  const fg = (el, bgEl = el) => { const b = bgOf(bgEl); return ratio(over(col(el), b), b) }
  const vs = (c, bgEl) => { const b = bgOf(bgEl); return ratio(over(c, b), b) }
  const rect = (el) => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, top: r.top, bottom: r.bottom, left: r.left, right: r.right } }
  const ms = (v) => { const t = String(v).split(',')[0].trim(); const n = parseFloat(t); return /ms$/.test(t) ? n : n * 1000 }
  const tokMs = (name) => { const i = document.createElement('i'); i.style.transitionDuration = `var(${name})`; document.body.append(i); const v = ms(getComputedStyle(i).transitionDuration); i.remove(); return v }
  const tokEase = (name) => { const i = document.createElement('i'); i.style.transitionTimingFunction = `var(${name})`; document.body.append(i); const v = getComputedStyle(i).transitionTimingFunction; i.remove(); return v }
  const act = () => { const a = document.activeElement; return a ? (a.id || a.className || a.tagName) : null }
  return { parse, over, bgOf, ratio, col, fg, vs, rect, ms, tokMs, tokEase, act }
}

async function open(browser, qs = '', opts = {}) {
  const ctx = await browser.newContext({
    viewport: opts.viewport || { width: 1200, height: 900 },
    reducedMotion: opts.reducedMotion || 'no-preference',
    forcedColors: opts.forcedColors || 'none',
    ...(opts.touch ? { hasTouch: true, isMobile: opts.isMobile !== false } : {})
  })
  const page = await ctx.newPage()
  page.__errors = []
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') page.__errors.push(m.text()) })
  page.on('pageerror', (e) => page.__errors.push(e.message))
  await page.goto(BASE + (qs ? '?' + qs.replace(/^\?/, '') : ''), { waitUntil: 'load' })
  await page.waitForFunction(() => window.__ready === true)
  await page.addScriptTag({ content: `window.__a = (${lib})()` })
  return page
}
const settled = (page) => page.waitForFunction(() => {
  const d = document.getElementById('dlg')
  return d.open && !d.matches('.is-forward, .is-back, .is-resizing') && !document.querySelector('.g-form-fold.is-animating')
}, null, { timeout: 8000 }).then(() => page.waitForTimeout(60))
/** Abre el diálogo con el historial dado (la aplicación pone `steps` antes de abrir) y espera a que asiente. */
async function openAt(page, steps) {
  await page.evaluate((s) => { window.__lv.state.steps.value = s; document.getElementById('opener').focus(); window.__lv.state.open.value = true }, steps)
  await settled(page)
  await page.waitForTimeout(250)
}
/** Graba cuadros mientras ocurre `setup` (código en la página) durante `ms`. */
const rec = (page, setup, sampler, ms) => page.evaluate(([setup, sampler, ms]) => new Promise((res) => {
  const fn = new Function('return (' + sampler + ')')()
  const out = [{ t: -1, ...fn() }]
  new Function(setup)()
  const t0 = performance.now()
  const step = () => { out.push({ t: performance.now() - t0, ...fn() }); if (performance.now() - t0 < ms) requestAnimationFrame(step); else res(out) }
  requestAnimationFrame(step)
}), [setup, sampler.toString(), ms])

const themes = args.themes === 'base' ? ['', 'theme=auditoria'] : ['', 'theme=auditoria', ...GEN.map((g) => 'theme=' + g)]

for (const engine of ENGINES) {
  const E = `[${engine}]`
  let browser
  try { browser = await pw[engine].launch() } catch (e) {
    // Un motor que no arranca cuenta como fallo: la verificación queda incompleta (npx playwright install <motor>)
    ok(false, `${E} el motor no arranca: ${String(e.message).split('\n')[0]}`, engine)
    continue
  }
  const T = (c, m) => ok(c, `${E} ${m}`, engine)
  // WebKit en macOS, como Safari sin «acceso total por teclado», solo tabula a campos de texto: Opción+Tab recorre todo
  // (el criterio del resto del repo: tests/*.spec.mjs, tooltip/auditoria-verificar.mjs). Chromium y Firefox, Tab tal cual.
  const TAB = engine === 'webkit' ? 'Alt+Tab' : 'Tab'
  const BACKTAB = engine === 'webkit' ? 'Alt+Shift+Tab' : 'Shift+Tab'
  const errors = []
  const done = async (page) => { errors.push(...page.__errors.filter((e) => !/development build of Vue|production build/.test(e))); await page.context().close() }

  /* ---------- M · Marcado real (pasos, profundidad 3 y 5) ---------- */
  if (run('m')) for (const qs of ['mode=steps', 'mode=steps&theme=auditoria&dark=1&dir=rtl']) {
    const page = await open(browser, qs)
    for (const hist of [['detalle', 'ingreso', 'partida'], ['detalle', 'ingreso', 'partida', 'producto', 'categoria']]) {
      await page.evaluate(() => { window.__lv.state.open.value = false })
      await page.waitForTimeout(300)
      await openAt(page, hist)
      const bad = await page.evaluate((hist) => {
        const b = []
        const d = document.getElementById('dlg')
        const cur = hist[hist.length - 1]
        if (!d.classList.contains('g-dialog--steps')) b.push('sin g-dialog--steps')
        if (d.getAttribute('aria-labelledby') !== `dlg-step-${cur}-title`) b.push('aria-labelledby ' + d.getAttribute('aria-labelledby'))
        if (d.getAttribute('aria-describedby') !== `dlg-step-${cur}-desc`) b.push('aria-describedby ' + d.getAttribute('aria-describedby'))
        const h2 = d.querySelector('.g-dialog__header h2.g-dialog__title')
        if (!h2 || h2.id !== `dlg-step-${cur}-title`) b.push('h2 del paso actual')
        const hd = [...d.querySelector('.g-dialog__header').children].map((k) => k.className.split(' ')[0])
        if (hd.join() !== 'g-dialog__back,g-dialog__titles,g-dialog__close') b.push('encabezado ' + hd)
        const back = d.querySelector('.g-dialog__back')
        if (!back || back.type !== 'button' || !/^Volver a /.test(back.getAttribute('aria-label') || '') || !back.querySelector('svg.g-icon.g-icon--flip-rtl')) b.push('Volver: tipo, nombre o chevron flip-rtl')
        const nav = d.querySelector('nav.g-dialog__trail')
        if (!nav || nav.getAttribute('aria-label') !== 'Recorrido' || nav.previousElementSibling !== d.querySelector('.g-dialog__header')) b.push('nav del hilo')
        const items = [...nav.querySelectorAll(':scope > ol.g-dialog__trail-list > li.g-dialog__trail-item')]
        if (items.length !== hist.length) b.push('li ≠ historial')
        items.forEach((li, i) => {
          const last = i === hist.length - 1, parent = i === hist.length - 2
          if (li.classList.contains('is-current') !== last || li.classList.contains('is-parent') !== parent) b.push(`li ${i}: is-current/is-parent`)
          const st = li.querySelector(':scope > .g-dialog__trail-step')
          if (last ? (st.tagName !== 'SPAN' || st.getAttribute('aria-current') !== 'step' || st.tabIndex >= 0) : (st.tagName !== 'BUTTON' || st.type !== 'button' || st.hasAttribute('aria-current'))) b.push(`li ${i}: paso`)
          const n = st.querySelector(':scope > .g-dialog__trail-number')
          if (!n || n.getAttribute('aria-hidden') !== 'true' || n.textContent.trim() !== String(i + 1)) b.push(`li ${i}: número`)
          if (!st.querySelector(':scope > .g-dialog__trail-title')?.textContent.trim()) b.push(`li ${i}: título`)
        })
        const panels = [...d.querySelectorAll('.g-dialog__body > section.g-dialog__step')]
        if (panels.length !== hist.length) b.push('paneles ≠ historial')
        for (const p of panels) {
          const curP = p.getAttribute('aria-labelledby') === `dlg-step-${cur}-title`
          if (p.getAttribute('role') !== 'group') b.push('panel sin role=group')
          if (curP ? (p.hidden || p.inert || !p.classList.contains('is-current')) : (!p.hidden || !p.inert || p.classList.contains('is-current'))) b.push('panel hidden/inert/is-current')
          if (p.classList.contains('is-entering')) b.push('is-entering en reposo')
        }
        if (d.matches('.is-forward, .is-back, .is-resizing') || d.style.getPropertyValue('--_step-from-h')) b.push('estado de transición en reposo')
        const sr = nav.querySelector('.g-dialog__sr')
        if (!sr || !/^, /.test(sr.textContent)) b.push('summary oculto del hilo')
        return b
      }, hist)
      T(!bad.length, `marcado ${qs} prof. ${hist.length}: ${bad.slice(0, 6).join(' | ')}`)
    }
    await done(page)
  }

  /* ---------- 1 · Contraste y texto en 26 configuraciones (mixto: dos pasos y un pliegue abierto) ---------- */
  if (run(1)) {
    const mins = {}
    const keep = (k, v, cfg) => { if (!(k in mins) || v < mins[k][0]) mins[k] = [v, cfg] }
    for (const th of themes) for (const dark of [false, true]) {
      const qs = [th, dark ? 'dark=1' : ''].filter(Boolean).join('&')
      const cfg = qs || 'defecto'
      const page = await open(browser, qs)
      await openAt(page, ['detalle', 'ingreso'])
      await page.evaluate(() => { window.__lv.state.folds.partida = true })
      await settled(page)
      await page.waitForTimeout(200)
      const r = await page.evaluate(() => {
        const A = window.__a
        const q = (s) => document.querySelector(s)
        const d = q('#dlg')
        const shell = A.col(d, 'backgroundColor')
        const parent = q('.g-dialog__trail-item.is-parent .g-dialog__trail-step')
        const cur = q('.g-dialog__trail-item.is-current .g-dialog__trail-step')
        const pNum = parent.querySelector('.g-dialog__trail-number'), cNum = cur.querySelector('.g-dialog__trail-number')
        const back = q('.g-dialog__back'), close = q('.g-dialog__close')
        const fold = q('#fold-partida')
        const rail = fold.querySelector('.g-form-fold__panel')
        const box = q('#f-ingreso-oc').closest('[data-g-tooltip-box]') || q('#f-ingreso-oc')
        box.setAttribute('data-g-landed', '')
        const landC = A.col(box, 'borderTopColor', '::before')
        const landR = A.vs(landC, box.parentElement)
        box.removeAttribute('data-g-landed')
        const curLink = getComputedStyle(q('.g-dialog__trail-item.is-current'), '::before')
        const sz = (el) => parseFloat(getComputedStyle(el).fontSize)
        return {
          shellOpaque: shell[3] >= 0.999,
          title: A.fg(q('.g-dialog__title')),
          desc: A.fg(q('.g-dialog__description')),
          parentTitle: A.fg(parent.querySelector('.g-dialog__trail-title'), parent),
          parentNum: A.fg(pNum),
          curTitle: A.fg(cur.querySelector('.g-dialog__trail-title'), cur),
          curNum: A.fg(cNum),
          curNumShape: Math.max(A.vs(A.col(cNum, 'borderTopColor'), cur), A.vs(A.col(cNum, 'backgroundColor'), cur)),
          curLink: A.vs(A.parse(curLink.borderTopColor), q('.g-dialog__trail')),
          backIcon: A.fg(back),
          closeIcon: A.fg(close),
          rail: A.vs(A.col(rail, 'borderInlineStartColor'), fold.parentElement),
          foldTitle: A.fg(fold.querySelector('.g-form-fold__title')),
          foldDesc: A.fg(fold.querySelector('.g-form-fold__description')),
          land: landR,
          focusVsShell: A.vs(A.parse(getComputedStyle(document.body).getPropertyValue('--g-color-focus') || 'transparent').slice(0, 3).concat(1), d),
          sizes: { num: sz(pNum), parentTitle: sz(parent.querySelector('.g-dialog__trail-title')), cur: sz(cur), desc: sz(q('.g-dialog__description')), foldDesc: sz(fold.querySelector('.g-form-fold__description')) }
        }
      })
      // Hover de «Volver» y de un paso del hilo (puntero real)
      await page.hover('.g-dialog__back'); await page.waitForTimeout(350)
      r.backHover = await page.evaluate(() => window.__a.fg(document.querySelector('.g-dialog__back')))
      await page.hover('.g-dialog__trail-item.is-parent .g-dialog__trail-step'); await page.waitForTimeout(350)
      r.trailHover = await page.evaluate(() => { const s = document.querySelector('.g-dialog__trail-item.is-parent .g-dialog__trail-step'); return window.__a.fg(s.querySelector('.g-dialog__trail-title'), s) })
      await page.mouse.move(5, 5)
      T(r.shellOpaque, `${cfg}: la carcasa no es opaca (el contraste supone el fondo de la página)`)
      const TXT = ['title', 'desc', 'parentTitle', 'parentNum', 'curTitle', 'curNum', 'foldTitle', 'foldDesc', 'backHover', 'trailHover']
      const SHAPE = ['curNumShape', 'curLink', 'backIcon', 'closeIcon', 'rail', 'land', 'focusVsShell']
      for (const k of TXT) { keep(k, r[k], cfg); T(r[k] >= 4.5, `${cfg}: ${k} ${r[k]}:1 < 4,5`) }
      for (const k of SHAPE) { keep(k, r[k], cfg); T(r[k] >= 3, `${cfg}: ${k} ${r[k]}:1 < 3`) }
      for (const [k, v] of Object.entries(r.sizes)) T(v >= 12, `${cfg}: texto ${k} ${v}px < 12`)
      await done(page)
    }
    note(`${E} mínimos de contraste: ` + Object.entries(mins).map(([k, [v, c]]) => `${k} ${v} (${c})`).join(', '))
  }

  /* ---------- 2 · Áreas (24px; 44px con pointer: coarse) ---------- */
  if (run(2)) {
    for (const [qs, touch] of [['mode=steps', false], ['mode=steps&theme=auditoria', false], ['mode=steps', true]]) {
      if (touch && engine === 'firefox') { note(`${E} pointer: coarse no se emula en Firefox (isMobile no existe): sin comprobar 44px`); continue }
      const page = await open(browser, qs, touch ? { touch: true, viewport: { width: 900, height: 900 } } : {})
      const coarse = await page.evaluate(() => matchMedia('(pointer: coarse)').matches)
      if (touch && !coarse) { note(`${E} con hasTouch el motor no informa pointer: coarse: sin comprobar 44px`); await done(page); continue }
      await openAt(page, ['detalle', 'ingreso', 'partida', 'producto'])
      const r = await page.evaluate(() => [...document.querySelectorAll('#dlg .g-dialog__back, #dlg .g-dialog__close, #dlg button.g-dialog__trail-step')].map((b) => { const x = b.getBoundingClientRect(); return [b.className.split(' ')[0], Math.round(x.width * 10) / 10, Math.round(x.height * 10) / 10] }))
      const min = touch ? 44 : 24
      T(r.length === 5 && r.every(([, w, h]) => w >= min - 0.01 && h >= min - 0.01), `${qs}${touch ? ' táctil' : ''}: área < ${min}px ${JSON.stringify(r)}`)
      await done(page)
    }
  }

  /* ---------- 3 · Foco visible con teclado ---------- */
  if (run(3)) for (const qs of ['mode=steps', 'mode=steps&theme=auditoria&dark=1', 'mode=steps&long=1']) {
    const page = await open(browser, qs)
    await openAt(page, qs.includes('long') ? ['detalle', 'ingreso'] : ['detalle', 'ingreso', 'partida'])
    // Desde el primer control del paso, Mayús+Tab recorre hacia atrás hasta el hilo y Volver
    const seen = {}
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press(BACKTAB)
      const f = await page.evaluate(() => {
        const a = document.activeElement
        const cs = getComputedStyle(a)
        const kind = a.matches('.g-dialog__back') ? 'back' : a.matches('button.g-dialog__trail-step') ? 'trail' : a.matches('.g-dialog__close') ? 'close' : a.matches('.g-dialog__body') ? 'body' : null
        if (!kind) return null
        const ring = window.__a.parse(cs.outlineColor)
        return { kind, style: cs.outlineStyle, w: parseFloat(cs.outlineWidth), want: parseFloat(getComputedStyle(document.body).getPropertyValue('--g-focus-width')), contrast: window.__a.vs(ring, a.matches('.g-dialog__body') ? a : a.parentElement), fv: a.matches(':focus-visible') }
      })
      if (f && !seen[f.kind]) seen[f.kind] = f
    }
    const want = qs.includes('long') ? ['back', 'trail', 'close', 'body'] : ['back', 'trail', 'close']
    T(want.every((k) => seen[k]), `${qs}: Mayús+Tab no alcanza ${want.filter((k) => !seen[k])}`)
    for (const [k, f] of Object.entries(seen)) T(f.fv && f.style === 'solid' && f.w >= 2 && Math.abs(f.w - f.want) < 0.5 && f.contrast >= 3, `${qs}: foco de ${k} ${JSON.stringify(f)}`)
    await done(page)
  }

  /* ---------- 4 · Comportamiento y foco (pasos) ---------- */
  if (run(4)) for (const qs of ['mode=steps&theme=auditoria', 'mode=steps']) {
    const page = await open(browser, qs)
    const A = () => page.evaluate(() => {
      const a = document.activeElement, d = document.getElementById('dlg')
      return { id: a.id || a.className, inDlg: d.contains(a) && a !== d, body: a === document.body, steps: window.__lv.state.steps.value.slice(), open: d.open, skip: a.matches('.g-dialog__back, .g-dialog__close, .g-dialog__trail-step') }
    })
    const evts = () => page.evaluate(() => window.__lv.events.splice(0))
    await page.focus('#opener')
    await page.keyboard.press('Enter')
    await settled(page); await page.waitForTimeout(200)
    let a = await A()
    T(a.id === 'f-detalle-ingreso', `${qs}: al abrir, foco en el primer control (${a.id})`)
    // Avanzar con teclado: el primer control de cada paso, nunca Volver, cierre ni el hilo
    const chain = [['f-detalle-ingreso', 'f-ingreso-oc', 2]]
    for (const [btn, want, n] of chain) {
      await page.focus('#' + btn); await page.keyboard.press('Enter'); await settled(page)
      a = await A()
      T(a.id === want && a.inDlg && !a.skip && a.steps.length === n, `${qs}: push → foco ${a.id} (esperado ${want}), historial ${a.steps}`)
    }
    // Volver a 1 con «Volver» y foco al from
    await page.click('.g-dialog__back'); await settled(page)
    a = await A()
    T(a.id === 'f-detalle-ingreso' && a.steps.length === 1, `${qs}: Volver → foco al from (${a.id})`)
    await evts()
    // Cinco niveles con clics (el from lo da push); el primer control de partida es el disparador del GSelect
    await page.click('#f-detalle-ingreso'); await settled(page)
    await page.click('#f-ingreso-p3'); await settled(page)
    a = await A()
    T(a.inDlg && !a.body && !a.skip && /f-partida-producto|g-select/.test(a.id), `${qs}: partida → foco en el primer control (${a.id})`)
    const footer = () => page.evaluate(() => ({ cur: window.__lv.state.steps.value.at(-1), ids: [...document.querySelectorAll('#dlg .g-dialog__footer button')].map((b) => b.id) }))
    let fo = await footer()
    T(fo.ids.length === 2 && fo.ids.every((id) => id.startsWith(fo.cur)), `${qs}: el pie es el del paso actual (${fo.cur}: ${fo.ids})`)
    await page.click('#crear-producto'); await settled(page)
    fo = await footer()
    T(fo.ids.length === 2 && fo.ids.every((id) => id.startsWith(fo.cur)), `${qs}: el pie es el del paso actual (${fo.cur}: ${fo.ids})`)
    a = await A(); T(a.id === 'f-producto-nombre', `${qs}: producto → foco ${a.id}`)
    await page.click('#crear-categoria'); await settled(page)
    a = await A(); T(a.id === 'f-categoria-nombre' && a.steps.length === 5, `${qs}: categoría → foco ${a.id}`)
    // Esc baja uno, sin dismiss, foco al from
    await page.keyboard.press('Escape'); await settled(page)
    a = await A(); let ev = await evts()
    T(a.steps.length === 4 && a.id === 'crear-categoria' && !ev.some((e) => e[0] === 'dismiss') && ev.some((e) => e[0] === 'step' && e[1].reason === 'escape'), `${qs}: Esc baja uno → ${a.steps.length}, foco ${a.id}, ${JSON.stringify(ev)}`)
    // Esc mantenida (repeat): un solo nivel
    await page.keyboard.down('Escape'); for (let i = 0; i < 4; i++) await page.keyboard.down('Escape'); await page.keyboard.up('Escape')
    await settled(page)
    a = await A(); ev = await evts()
    T(a.steps.length === 3 && a.id === 'crear-producto' && ev.filter((e) => e[0] === 'step').length === 1, `${qs}: Esc mantenida baja uno (${a.steps.length}, ${a.id})`)
    // Fondo con tres pasos: nada
    await page.mouse.click(8, 8); await page.waitForTimeout(250)
    a = await A(); ev = await evts()
    T(a.open && a.steps.length === 3 && !ev.length, `${qs}: clic en el fondo con 3 pasos no hace nada`)
    // Error al confirmar: no baja; el foco va al campo con error (el primer [aria-invalid] del paso: el GSelect de Producto),
    // no se queda en el botón (en WebKit un clic no enfoca el botón: la comprobación no depende de eso)
    await page.click('#dlg .g-dialog__footer .g-btn:last-child'); await page.waitForTimeout(250)
    a = await A()
    const inv = await page.evaluate(() => document.activeElement.getAttribute('aria-invalid'))
    T(a.steps.length === 3 && a.inDlg && !a.body && /f-partida-producto|g-select/.test(a.id) && inv === 'true', `${qs}: confirmar con error no baja y el foco va al campo con error (${a.steps.length}, ${a.id}, aria-invalid ${inv})`)
    // Resultado: crear categoría → producto (llegada en la caja del select + anuncio en el modal)
    await page.click('#crear-producto'); await settled(page)
    await page.click('#crear-categoria'); await settled(page)
    await page.fill('#f-categoria-nombre', 'Tampones')
    await evts()
    await page.click('#dlg .g-dialog__footer .g-btn:last-child')
    const land = await page.waitForFunction(() => {
      const el = document.querySelector('[data-g-landed]')
      if (!el) return null
      const cs = getComputedStyle(el, '::before')
      return { box: el.hasAttribute('data-g-tooltip-box') || el.id, has: el.contains(document.getElementById('f-producto-categoria')) || el.id === 'f-producto-categoria', anim: cs.animationName, dur: window.__a.ms(cs.animationDuration), slow: window.__a.tokMs('--g-duration-slow'), ease: cs.animationTimingFunction, out: window.__a.tokEase('--g-ease-out') }
    }, null, { timeout: 3000 }).then((h) => h.jsonValue()).catch(() => null)
    T(land && land.has && land.box === true && land.anim === 'g-landed' && Math.abs(land.dur - land.slow * 3) < 2 && land.ease === land.out, `${qs}: llegada en la caja visible con g-landed slow × 3 + ease-out ${JSON.stringify(land)}`)
    await settled(page)
    a = await A()
    const live = await page.evaluate(() => [...document.getElementById('dlg').querySelectorAll('[aria-live]')].map((n) => [n.getAttribute('aria-live'), n.textContent.trim()]))
    T(a.steps.length === 4 && /f-producto-categoria|g-select/.test(a.id) && a.inDlg, `${qs}: con resultado, foco al campo que lo recibe (${a.id})`)
    T(live.some(([p, t]) => p === 'polite' && /Tampones/.test(t)) && !live.some(([p]) => p === 'assertive' && false), `${qs}: anuncio cortés dentro del modal ${JSON.stringify(live)}`)
    await page.waitForFunction(() => !document.querySelector('[data-g-landed]'), null, { timeout: 2500 }).catch(() => {})
    T(await page.evaluate(() => !document.querySelector('[data-g-landed]')), `${qs}: la llegada se retira sola`)
    // Salto desde el hilo con teclado: al paso 1; foco al from del paso de encima (f-detalle-ingreso)
    await page.focus('.g-dialog__trail-item:first-child .g-dialog__trail-step')
    await evts()
    await page.keyboard.press('Enter'); await settled(page)
    a = await A(); ev = await evts()
    T(a.steps.length === 1 && a.id === 'f-detalle-ingreso' && ev.filter((e) => e[0] === 'step').length === 1 && ev[0][1].reason === 'trail', `${qs}: salto del hilo → ${a.steps}, foco ${a.id}, ${JSON.stringify(ev)}`)
    // backTo desde ingreso con dos niveles: vuelve al from del de encima
    await page.click('#f-detalle-ingreso'); await settled(page)
    await page.click('#f-ingreso-p3'); await settled(page)
    await page.click('#crear-producto'); await settled(page)
    await page.focus('.g-dialog__trail-item:nth-child(2) .g-dialog__trail-step'); await page.keyboard.press('Enter'); await settled(page)
    a = await A()
    T(a.steps.length === 2 && a.id === 'f-ingreso-p3', `${qs}: backTo(ingreso) → foco al from del paso de encima (${a.id})`)
    // Resultado de ingreso: back con focus/announce → llegada sobre el GBtn (sin caja de tooltip)
    await page.click('#dlg .g-dialog__footer .g-btn:last-child')
    const l2 = await page.waitForFunction(() => document.querySelector('[data-g-landed]')?.id || null, null, { timeout: 2000 }).then((h) => h.jsonValue()).catch(() => null)
    await settled(page)
    a = await A()
    T(l2 === 'f-detalle-ingreso' && a.id === 'f-detalle-ingreso' && a.steps.length === 1, `${qs}: back({ focus, announce }) → foco y llegada en el botón (${l2}, ${a.id})`)
    // Apilado: alertdialog encima → is-stacked, un solo fondo visible; Esc cierra solo el de arriba
    await page.click('#f-detalle-descartar')
    await page.waitForFunction(() => document.getElementById('confirm').open)
    await page.waitForTimeout(300)
    const st = await page.evaluate(() => {
      const c = document.getElementById('confirm'), d = document.getElementById('dlg')
      const bd = (el) => window.__a.parse(getComputedStyle(el, '::backdrop').backgroundColor)[3]
      return { stacked: c.classList.contains('is-stacked'), lowerStacked: d.classList.contains('is-stacked'), top: bd(c), low: bd(d), focusIn: c.contains(document.activeElement) }
    })
    T(st.stacked && !st.lowerStacked && st.top === 0 && st.low > 0 && st.focusIn, `${qs}: apilado con un solo fondo ${JSON.stringify(st)}`)
    await evts()
    await page.mouse.click(8, 8); await page.waitForTimeout(200)
    T(await page.evaluate(() => document.getElementById('confirm').open && document.getElementById('dlg').open), `${qs}: fondo con un modal debajo no cierra (#568)`)
    await page.keyboard.press('Escape'); await page.waitForTimeout(400)
    const after = await page.evaluate(() => ({ c: document.getElementById('confirm').open, d: document.getElementById('dlg').open, low: window.__a.parse(getComputedStyle(document.getElementById('dlg'), '::backdrop').backgroundColor)[3], f: document.activeElement.id }))
    T(!after.c && after.d && after.low > 0 && after.f === 'f-detalle-descartar', `${qs}: Esc cierra solo el de arriba; el de abajo conserva su fondo y el foco vuelve ${JSON.stringify(after)}`)
    // Un paso: fondo cierra con dismiss backdrop depth 1; reabrir y cerrar con la X desde 3 → depth 3; foco de vuelta al disparador
    await evts()
    await page.mouse.click(8, 8); await page.waitForTimeout(450)
    ev = await evts()
    T(ev.some((e) => e[0] === 'dismiss' && e[1].reason === 'backdrop' && e[1].depth === 1) && !(await page.evaluate(() => document.getElementById('dlg').open)), `${qs}: fondo con un paso cierra ${JSON.stringify(ev)}`)
    T((await A()).id === 'opener', `${qs}: al cerrar, foco al disparador (from)`)
    await page.click('#opener'); await settled(page)
    await page.click('#f-detalle-ingreso'); await settled(page)
    await page.click('#f-ingreso-p3'); await settled(page)
    await evts()
    await page.click('.g-dialog__close'); await page.waitForTimeout(450)
    ev = await evts()
    T(ev.some((e) => e[0] === 'dismiss' && e[1].reason === 'close' && e[1].depth === 3), `${qs}: la X cierra el recorrido con depth 3 ${JSON.stringify(ev)}`)
    T((await A()).id === 'opener', `${qs}: tras la X, foco al disparador`)
    await done(page)
  }

  /* ---------- 4b · Pliegues dentro del diálogo ---------- */
  if (run(4)) {
    const page = await open(browser, 'theme=auditoria')
    const evts = () => page.evaluate(() => window.__lv.events.splice(0))
    // Un paso (el ingreso puesto antes de abrir): el fondo cierra solo sin pliegues abiertos
    await openAt(page, ['ingreso'])
    // Lo de arriba Δ0 en el contenido (posición dentro del cuerpo, sin contar el desplazamiento mínimo «nearest» que pide
    // form.md §15 para que el pliegue quede a la vista) y el borde superior del diálogo Δ0 (D2)
    const sampleFold = () => { const d = document.getElementById('dlg'), b = d.querySelector('.g-dialog__body'); return { top: d.getBoundingClientRect().top, btn: document.getElementById('f-ingreso-p3').getBoundingClientRect().top - b.getBoundingClientRect().top + b.scrollTop } }
    const frames = await rec(page, "window.__lv.state.folds.partida = true", sampleFold, 700)
    await settled(page)
    const g0 = frames[0]
    const dt = Math.max(...frames.map((f) => Math.abs(f.top - g0.top))), db = Math.max(...frames.map((f) => Math.abs(f.btn - g0.btn)))
    T(dt <= 0.5 && db <= 0.5, `pliegue: abrir no mueve el borde superior ni lo de arriba (Δ ${dt.toFixed(2)} / ${db.toFixed(2)}px)`)
    const vis = await page.evaluate(() => { const b = document.querySelector('#dlg .g-dialog__body').getBoundingClientRect(), f = document.getElementById('fold-partida').getBoundingClientRect(); return { fits: f.height <= b.height, inView: f.top >= b.top - 1.5 && f.bottom <= b.bottom + 1.5, f: [f.top, f.bottom], b: [b.top, b.bottom] } })
    T(!vis.fits || vis.inView, `pliegue: queda a la vista si cabe ${JSON.stringify(vis)}`)
    let a = await page.evaluate(() => ({ id: document.activeElement.id || document.activeElement.className, inFold: document.getElementById('fold-partida').contains(document.activeElement) }))
    T(a.inFold, `pliegue: foco dentro al abrir (${a.id})`)
    await evts()
    await page.mouse.click(8, 8); await page.waitForTimeout(300)
    T(await page.evaluate(() => document.getElementById('dlg').open) && !(await evts()).length, 'pliegue abierto: el fondo no cierra (base 5)')
    // Anidados: Esc recoge solo el de arriba
    await page.click('#crear-producto'); await settled(page)
    await page.click('#crear-categoria'); await settled(page)
    await page.keyboard.press('Escape'); await settled(page); await page.waitForTimeout(300)
    a = await page.evaluate(() => ({ f: { ...window.__lv.state.folds }, id: document.activeElement.id, open: document.getElementById('dlg').open }))
    T(a.open && a.f.categoria === false && a.f.producto === true && a.f.partida === true && a.id === 'crear-categoria', `pliegue: Esc recoge solo el de arriba y el foco vuelve ${JSON.stringify(a)}`)
    T(!(await evts()).some((e) => e[0] === 'dismiss'), 'pliegue: Esc no emite dismiss')
    // Resultado del pliegue: llegada en el select de categoría y anuncio
    await page.click('#crear-categoria'); await settled(page); await page.waitForTimeout(300)
    await page.fill('#f-categoria-nombre', 'Tampones')
    await page.click('#categoria-ok')
    const l = await page.waitForFunction(() => { const el = document.querySelector('[data-g-landed]'); return el ? el.contains(document.getElementById('f-producto-categoria')) || el.id === 'f-producto-categoria' : null }, null, { timeout: 2500 }).then((h) => h.jsonValue()).catch(() => null)
    await settled(page); await page.waitForTimeout(300)
    a = await page.evaluate(() => ({ id: document.activeElement.id || document.activeElement.className, live: [...document.getElementById('dlg').querySelectorAll('[aria-live="polite"]')].map((n) => n.textContent).join(' ') }))
    T(l === true && /Tampones/.test(a.live), `pliegue: resultado con llegada en la caja y anuncio (${l}, ${a.id})`)
    // Cerrar todos y el fondo cierra
    for (const k of ['producto', 'partida']) { await page.evaluate((k) => { window.__lv.state.folds[k] = false }, k); await settled(page) }
    await page.waitForTimeout(400)
    await evts()
    await page.mouse.click(8, 8); await page.waitForTimeout(400)
    const ev = await evts()
    T(ev.some((e) => e[0] === 'dismiss' && e[1].reason === 'backdrop' && e[1].depth === 1), `pliegues cerrados: el fondo vuelve a cerrar ${JSON.stringify(ev)}`)
    await done(page)
  }

  /* ---------- 5 · Movimiento ---------- */
  if (run(5)) {
    for (const [qs, rm] of [['mode=steps&theme=auditoria', 'no-preference'], ['mode=steps&theme=auditoria&dir=rtl', 'no-preference'], ['mode=steps&theme=auditoria', 'reduce']]) {
      const page = await open(browser, qs, { reducedMotion: rm })
      const rtl = qs.includes('rtl'), reduce = rm === 'reduce'
      const tag = `${rtl ? 'RTL' : 'LTR'} ${rm}`
      await openAt(page, ['detalle', 'ingreso'])
      const tok = await page.evaluate(() => ({ slow: window.__a.tokMs('--g-duration-slow'), fast: window.__a.tokMs('--g-duration-fast'), out: window.__a.tokEase('--g-ease-out') }))
      const sampler = () => {
        const d = document.getElementById('dlg')
        const p = d.querySelector('.g-dialog__step.is-current')
        const cs = p ? getComputedStyle(p) : null
        const dcs = getComputedStyle(d)
        const tr = cs ? (cs.translate === 'none' ? 0 : parseFloat(cs.translate)) : 0
        const m = cs && cs.transform !== 'none' ? new DOMMatrix(cs.transform).m41 : 0
        const body = d.querySelector('.g-dialog__body')
        return { top: d.getBoundingClientRect().top, h: d.getBoundingClientRect().height, x: tr + m, anim: cs ? cs.animationName : '', dur: cs ? cs.animationDuration : '', ease: cs ? cs.animationTimingFunction : '', resizing: d.classList.contains('is-resizing'), danim: dcs.animationName, ddur: dcs.animationDuration, dease: dcs.animationTimingFunction, from: d.style.getPropertyValue('--_step-from-h'), hscroll: body.scrollWidth > body.clientWidth + 1 && getComputedStyle(body).overflowX !== 'hidden' }
      }
      // Ir más hondo (ingreso → partida: el alto cambia)
      const fwd = await rec(page, "document.getElementById('f-ingreso-p3').click()", sampler, 900)
      await settled(page)
      const top0 = fwd[0].top
      const dTop = Math.max(...fwd.map((f) => Math.abs(f.top - top0)))
      T(dTop <= 0.5, `${tag}: borde superior Δ ${dTop.toFixed(2)}px al ir más hondo`)
      const entering = fwd.find((f) => f.anim && f.anim !== 'none')
      if (reduce) {
        T(entering && entering.anim === 'g-dialog-step-fade' && Math.abs(parseFloat(entering.dur) * (/ms$/.test(entering.dur) ? 1 : 1000) - tok.fast) < 2, `${tag}: el paso entra con g-dialog-step-fade en fast ${JSON.stringify(entering)}`)
        T(fwd.every((f) => Math.abs(f.x) < 0.01), `${tag}: sin desplazamiento del paso`)
        T(fwd.every((f) => f.danim === 'none' || !/resize/.test(f.danim)), `${tag}: sin animación del alto`)
        T(fwd.slice(1).every((f) => !f.resizing), `${tag}: is-resizing no se queda (sin animación, se limpia en el acto)`)
      } else {
        const durMs = entering ? parseFloat(entering.dur) * (/ms$/.test(entering.dur) ? 1 : 1000) : 0
        T(entering && entering.anim === 'g-dialog-step-from-end' && Math.abs(durMs - tok.slow) < 2 && entering.ease === tok.out, `${tag}: el paso entra con g-dialog-step-from-end, slow + ease-out ${JSON.stringify(entering)} ${JSON.stringify(tok)}`)
        const moved = fwd.filter((f) => Math.abs(f.x) > 0.5)
        T(moved.length > 0 && moved.every((f) => Math.sign(f.x) === (rtl ? -1 : 1)), `${tag}: el paso nuevo llega desde el final (signo ${rtl ? '−' : '+'}): ${moved.slice(0, 3).map((f) => f.x.toFixed(1))}`)
        const maxX = Math.max(...fwd.map((f) => Math.abs(f.x)))
        const space6 = await page.evaluate(() => { const i = document.createElement('i'); i.style.cssText = 'display:block;width:calc(var(--g-space-1) * 6)'; document.body.append(i); const w = i.getBoundingClientRect().width; i.remove(); return w })
        T(maxX <= space6 + 0.5, `${tag}: desplazamiento ≤ space × 6 (${maxX.toFixed(1)} ≤ ${space6})`)
        const rz = fwd.find((f) => f.resizing)
        const hs = fwd.map((f) => f.h)
        const h0 = hs[0], h1 = hs[hs.length - 1]
        const mono = hs.every((h, i) => i === 0 || (h1 >= h0 ? h >= hs[i - 1] - 0.5 : h <= hs[i - 1] + 0.5))
        T(rz && rz.danim === 'g-dialog-resize' && Math.abs(parseFloat(rz.ddur) * (/ms$/.test(rz.ddur) ? 1 : 1000) - tok.slow) < 2 && rz.dease === tok.out && rz.from, `${tag}: alto entre pasos con g-dialog-resize slow + ease-out ${JSON.stringify(rz && { danim: rz.danim, ddur: rz.ddur, dease: rz.dease, from: rz.from })}`)
        T(Math.abs(h1 - h0) > 4 && mono && hs.filter((h) => Math.abs(h - h0) > 1 && Math.abs(h - h1) > 1).length >= 2, `${tag}: el alto pasa por valores intermedios y sin vaivén (${h0.toFixed(0)} → ${h1.toFixed(0)})`)
        T(!fwd[fwd.length - 1].resizing && !fwd[fwd.length - 1].from, `${tag}: is-resizing y --_step-from-h se retiran al terminar`)
        T(fwd.every((f) => !f.hscroll), `${tag}: sin barra horizontal en el cuerpo durante el cambio`)
        // El tramo del hilo que se tiende y el número del actual aparecen después
        const thr = await page.evaluate(() => getComputedStyle(document.querySelector('.g-dialog__trail-item.is-current'), '::before').animationName)
        T(thr === 'none', `${tag}: el tramo ya no anima en reposo (${thr})`)
      }
      // Volver: el destino entra desde el inicio
      const bk = await rec(page, "document.querySelector('.g-dialog__back').click()", sampler, 900)
      await settled(page)
      const ent2 = bk.find((f) => f.anim && f.anim !== 'none')
      const dTop2 = Math.max(...bk.map((f) => Math.abs(f.top - top0)))
      T(dTop2 <= 0.5, `${tag}: borde superior Δ ${dTop2.toFixed(2)}px al volver`)
      if (!reduce) {
        const moved = bk.filter((f) => Math.abs(f.x) > 0.5)
        T(ent2 && ent2.anim === 'g-dialog-step-from-start' && moved.length > 0 && moved.every((f) => Math.sign(f.x) === (rtl ? 1 : -1)), `${tag}: al volver, el destino entra desde el inicio ${ent2 && ent2.anim}`)
      } else T(ent2 && ent2.anim === 'g-dialog-step-fade' && bk.every((f) => Math.abs(f.x) < 0.01), `${tag}: al volver, solo fundido`)
      // RTL: el chevron de Volver se espeja
      if (rtl) {
        await page.click('#f-ingreso-p3'); await settled(page)
        const flip = await page.evaluate(() => { const i = document.querySelector('.g-dialog__back .g-icon'); const cs = getComputedStyle(i); return cs.transform !== 'none' ? new DOMMatrix(cs.transform).a : cs.scale === 'none' ? 1 : parseFloat(cs.scale) })
        T(flip < 0, `${tag}: el chevron de Volver se espeja (${flip})`)
      }
      // La llegada con reduce: g-landed-fade
      if (reduce) {
        const page2 = page
        await page2.evaluate(() => { const b = document.getElementById('f-ingreso-oc').closest('[data-g-tooltip-box]'); b.setAttribute('data-g-landed', '') })
        const lf = await page2.evaluate(() => { const b = document.querySelector('[data-g-landed]'); const cs = getComputedStyle(b, '::before'); const r = { a: cs.animationName, o: cs.opacity, inset: cs.top }; b.removeAttribute('data-g-landed'); return r })
        T(lf.a === 'g-landed-fade', `${tag}: la llegada solo se funde (${JSON.stringify(lf)})`)
      }
      await done(page)
    }
    // Desplazamiento restaurado al volver a un paso largo y disparador en su sitio
    {
      const page = await open(browser, 'mode=steps&long=1')
      await openAt(page, ['detalle', 'ingreso'])
      await page.evaluate(() => document.getElementById('f-ingreso-p3').scrollIntoView({ block: 'center' }))
      await page.waitForTimeout(150)
      const before = await page.evaluate(() => ({ st: document.querySelector('#dlg .g-dialog__body').scrollTop, y: document.getElementById('f-ingreso-p3').getBoundingClientRect().top }))
      await page.click('#f-ingreso-p3'); await settled(page)
      await page.keyboard.press('Escape'); await settled(page)
      const after = await page.evaluate(() => ({ st: document.querySelector('#dlg .g-dialog__body').scrollTop, y: document.getElementById('f-ingreso-p3').getBoundingClientRect().top, f: document.activeElement.id }))
      T(before.st > 50 && Math.abs(after.st - before.st) <= 1 && Math.abs(after.y - before.y) <= 1 && after.f === 'f-ingreso-p3', `desplazamiento restaurado y el disparador en su sitio ${JSON.stringify({ before, after })}`)
      await done(page)
    }
  }

  /* ---------- 6 · Hoja a 375px, reflujo a 320px, texto al 200 % ---------- */
  if (run(6)) {
    for (const [qs, vp] of [['mode=steps', { width: 375, height: 740 }], ['mode=steps&theme=auditoria', { width: 375, height: 740 }], ['mode=steps&theme=auditoria', { width: 320, height: 640 }], ['mode=steps&text=2', { width: 1280, height: 900 }], ['mode=steps&text=2&theme=auditoria', { width: 640, height: 800 }]]) {
      const page = await open(browser, qs, { viewport: vp })
      const tag = `${qs} ${vp.width}px`
      await openAt(page, ['detalle'])
      const tops = []
      const check = () => page.evaluate(() => {
        const d = document.getElementById('dlg'), doc = document.documentElement
        const r = d.getBoundingClientRect()
        const list = d.querySelector('.g-dialog__trail-list')
        const out = [...d.querySelectorAll('.g-dialog__header, .g-dialog__trail, .g-dialog__footer')].some((el) => el.scrollWidth > el.clientWidth + 1)
        const clipped = [...d.querySelectorAll('.g-dialog__title, .g-dialog__description')].some((el) => el.scrollWidth > el.clientWidth + 1)
        const insideVp = r.left >= -0.5 && r.right <= innerWidth + 0.5 && r.top >= -0.5 && r.bottom <= innerHeight + 0.5
        return { top: r.top, docX: doc.scrollWidth > doc.clientWidth, dlgX: d.scrollWidth > d.clientWidth + 1, listX: list ? list.scrollWidth > list.clientWidth + 1 : false, out, clipped, insideVp, sheet: getComputedStyle(d).marginTop }
      })
      for (const [btn] of [['f-detalle-ingreso'], ['f-ingreso-p3'], ['crear-producto'], ['crear-categoria']]) {
        await page.click('#' + btn); await settled(page)
        const c = await check(); tops.push(c.top)
        T(!c.docX && !c.dlgX && !c.listX && !c.out && !c.clipped && c.insideVp, `${tag}: prof. ${tops.length + 1} sin desborde horizontal ni recorte ${JSON.stringify(c)}`)
      }
      if (vp.width <= 520) {
        T(tops.every((t, i) => i === 0 || t <= tops[i - 1] + 0.5), `${tag}: la hoja no baja al ir más hondo (${tops.map((t) => t.toFixed(0))})`)
        const deep = tops[tops.length - 1]
        for (let i = 0; i < 3; i++) { await page.keyboard.press('Escape'); await settled(page) }
        const t = (await check()).top
        T(Math.abs(t - deep) <= 0.5, `${tag}: la hoja no baja al volver (${deep.toFixed(1)} → ${t.toFixed(1)})`)
        T(await page.evaluate(() => document.getElementById('dlg').classList.contains('has-sheet-hold')), `${tag}: has-sheet-hold durante el recorrido`)
      }
      await done(page)
    }
  }

  /* ---------- 7 · forced-colors ---------- */
  if (run(7)) {
    const page = await open(browser, 'theme=auditoria', { forcedColors: 'active' })
    const fc = await page.evaluate(() => matchMedia('(forced-colors: active)').matches)
    if (!fc) note(`${E} forced-colors no se emula en este motor: sin comprobar`)
    else {
      await openAt(page, ['detalle', 'ingreso'])
      await page.evaluate(() => { window.__lv.state.folds.partida = true })
      await settled(page)
      await page.focus('.g-dialog__trail-item.is-parent .g-dialog__trail-step')
      await page.keyboard.press(BACKTAB); await page.keyboard.press(TAB)
      const r = await page.evaluate(() => {
        const q = (s) => document.querySelector(s)
        const sys = (kw) => { const i = document.createElement('i'); i.style.color = kw; document.body.append(i); const c = getComputedStyle(i).color; i.remove(); return c }
        const HL = sys('Highlight'), CT = sys('CanvasText'), BT = sys('ButtonText')
        const box = q('#f-ingreso-oc').closest('[data-g-tooltip-box]'); box.setAttribute('data-g-landed', '')
        const land = getComputedStyle(box, '::before').borderTopColor; box.removeAttribute('data-g-landed')
        const cur = q('.g-dialog__trail-item.is-current')
        const a = document.activeElement
        return {
          HL, CT,
          curStep: getComputedStyle(cur.querySelector('.g-dialog__trail-step')).borderTopColor === HL,
          curNum: getComputedStyle(cur.querySelector('.g-dialog__trail-number')).borderTopColor === HL,
          curLink: getComputedStyle(cur, '::before').borderTopColor === HL,
          parentNum: getComputedStyle(q('.g-dialog__trail-item.is-parent .g-dialog__trail-number')).borderTopColor === CT,
          back: getComputedStyle(q('.g-dialog__back')).borderTopColor === BT,
          land: land === HL,
          rail: getComputedStyle(q('#fold-partida .g-form-fold__panel')).borderInlineStartColor === HL,
          focus: a.matches('.g-dialog__trail-step') ? getComputedStyle(a).outlineColor === HL && getComputedStyle(a).outlineStyle === 'solid' : 'sin foco en el hilo: ' + (a.id || a.className)
        }
      })
      for (const [k, v] of Object.entries(r)) if (!['HL', 'CT'].includes(k)) T(v === true, `forced-colors: ${k} ${v}`)
    }
    await done(page)
  }

  T(!errors.length, `consola limpia: ${[...new Set(errors)].slice(0, 5).join(' | ')}`)
  await browser.close()
}

server.close()
console.log(`\nAuditoría de los niveles de GDialog: ${total - failed}/${total}`)
for (const [k, [a, b]] of Object.entries(counts)) console.log(`  ${k}: ${a}/${b}`)
if (notes.length) { console.log('\nNotas:'); for (const n of notes) console.log('  · ' + n) }
if (fails.length) { console.log('\nFallos:'); for (const f of fails) console.log('  ✗ ' + f) }
process.exit(failed ? 1 : 0)
