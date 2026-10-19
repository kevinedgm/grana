// Verificación de coco sobre el banco de la isla TRANSITORIA (design/lab/alert/estilo-banco.html), con el CSS real de src/
// (GStatusIsland.css y GStatusMark.css dentro de grana.components, vía packages/vue/src/styles/grana.css) y los componentes
// reales de dist/ (GBtn, GDialog, GFormActions). Contrato: design/contracts/status.md (#693 a #705).
//   0. Análisis estático: sin literales ni respaldos, sin @layer ni !important, solo tokens que existen, propiedades
//      lógicas, :hover bajo (hover: hover), light-dark() con su @supports not, on-brand-zone solo en GStatusIsland.css
//      (#694), sin brand, el muelle solo en el tamaño, dentro de @supports y con duration-slow, keyframes g-status*
//   1. Contraste y delimitación sobre página, tabla y zona de marca (el cristal contra el peor fondo: negro, blanco y el
//      fondo): texto ≥ 4,5; glifo, anillo, chevrón, acción, «+N» y foco ≥ 3; delimitación ≥ 3. Tema por defecto claro y
//      oscuro en los tres motores; en Chromium además los once temas de dark-color-presence regenerados con el CLI
//   2. Geometría: fila 44, cápsula space × 24, insignia 24 concéntrica, marca 32 con insignia 20 concéntrica
//   3. Movimiento cuadro a cuadro (rúbrica B, D y F): nacer (cápsula con insignia y sin texto desde el borde, sin pasar
//      del destino salvo el muelle ≤ 4 %, sin destellos), recogerse (sin bajar de la cápsula, salida ≤ entrada, se va con
//      su insignia), asomo que crece con muelle y vuelve sin bajar del titular (M1), relevo (el texto nuevo entra desde
//      abajo sin que la cápsula desaparezca), interrupciones que parten del estado actual (#702), pausa del anillo, el
//      anillo que se vacía (también en Firefox), chevrón con ease-out, eco en slow
//   4. Movimiento reducido: nada se desplaza ni cambia de tamaño animado; el anillo sigue diciendo el tiempo; el eco es un
//      fundido en su sitio · 5. forced-colors (Chromium) · 6. 320 px y texto al 200 % · 7. dianas ≥ 24 y ≥ 44 (coarse)
//   8. Alineación en LTR y RTL · 9. Marca de texto · 10. Hoja móvil · 11. Consola limpia
// Ejecutar desde la raíz del repo: node design/lab/alert/estilo-verificar.mjs [--capturas]
//   ENGINES=chromium THEMES=0 VERBOSE=1 para filtrar o ver todo. Puerto GRANA_PW_PORT (por defecto 4214). Requiere el
//   dist/ de un `npm run build` (GBtn, GDialog y GFormActions del UMD); el CSS se lee de src/.
import http from 'node:http'
import { readFile, mkdtemp, readdir } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const pw = await import(new URL('../theme-playground/node_modules/playwright/index.mjs', import.meta.url))
const ROOT = fileURLToPath(new URL('../../../', import.meta.url))
const HERE = fileURLToPath(new URL('./', import.meta.url))
const CAPS = process.argv.includes('--capturas')
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const server = http.createServer(async (req, res) => {
  try {
    const p = normalize(join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname)))
    if (!p.startsWith(ROOT)) throw new Error('fuera')
    res.writeHead(200, { 'content-type': MIME[extname(p)] || 'application/octet-stream' }).end(await readFile(p))
  } catch { if (!res.headersSent) res.writeHead(404).end() }
})
await new Promise((r) => server.listen(Number(process.env.GRANA_PW_PORT || 4214), '127.0.0.1', r))
const BASE = `http://127.0.0.1:${server.address().port}/design/lab/alert/estilo-banco.html`

let total = 0, failed = 0
const fails = [], info = []
let ENGINE = 'static'
const per = {}
const ok = (cond, msg) => { total++; const e = per[ENGINE] ||= [0, 0]; e[1]++; if (cond) e[0]++; if (!cond) { failed++; fails.push(`[${ENGINE}] ${msg}`) } if (process.env.VERBOSE) console.log(cond ? 'ok ' : 'NO ', ENGINE, msg) }

/* ---------- 0 · Análisis estático ---------- */
{
  const read = (f) => readFile(join(ROOT, f), 'utf8')
  const strip = (c) => c.replace(/\/\*[\s\S]*?\*\//g, '')
  const defaults = await read('packages/vue/src/styles/defaults.css')
  const defined = new Set([...defaults.matchAll(/(--g-[a-z0-9-]+)\s*:/g)].map((m) => m[1]))
  for (const f of ['GStatusIsland/GStatusIsland.css', 'GStatusMark/GStatusMark.css']) {
    const css = strip(await read('packages/vue/src/components/' + f))
    const name = f.split('/')[1]
    const island = name === 'GStatusIsland.css'
    ok(!/#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|lab|lch)\(/.test(css), `${name}: color literal`)
    // el único nombre de color permitido es el de la consulta de soporte de light-dark() (tokens.md §12.1, regla 3)
    ok(!/(?<![\w-])(?:red|white|black|gray|grey)(?![\w-])/.test(css.replace(/@supports not \(color: light-dark\(red, red\)\)/g, '')), `${name}: nombre de color literal`)
    ok(!/var\(\s*--[\w-]+\s*,/.test(css), `${name}: var() con valor de respaldo`)
    ok(!/@layer/.test(css) && !/!important/.test(css), `${name}: @layer o !important`)
    const vars = [...css.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1])
    ok(vars.every((v) => v.startsWith('--g-') || v.startsWith('--_')), `${name}: var() que no es --g-* ni --_*`)
    const missing = [...new Set(vars.filter((v) => v.startsWith('--g-') && !defined.has(v)))]
    ok(!missing.length, `${name}: tokens inexistentes ${missing}`)
    ok(!/--g-[a-z0-9-]+\s*:/.test(css), `${name}: declara tokens --g-*`)
    ok(!/--g-color-(?:on-)?brand(?![\w-])|--g-color-brand-/.test(css), `${name}: no lee brand (tokens.md §2)`)
    ok(island ? /--g-color-on-brand-zone/.test(css) : !/brand-zone/.test(css), `${name}: on-brand-zone solo en GStatusIsland.css (excepción de §44.2, #694)`)
    ok(/light-dark\(/.test(css) && /@supports not \(color: light-dark\(red, red\)\)/.test(css), `${name}: light-dark() con su @supports not (§12.1)`)
    const badPx = [...css.matchAll(/(-?\d*\.?\d+)(px|ms|s|rem|em|vw|vh|deg)\b/g)].map((m) => m[0]).filter((p) => !['24px', '44px', '0px', '1px', '-1px', '1ms'].includes(p))
    ok(!badPx.length, `${name}: medidas o duraciones literales ${badPx}`)
    const onePx = css.replace(/inline-size:\s*1px;\s*block-size:\s*1px;\s*margin:\s*-1px;/g, '')
    ok(!/\b1px\b/.test(onePx), `${name}: 1px fuera del patrón de texto oculto`)
    ok(!/[^-\w]1ms/.test(css.replace(/calc\(var\(--_run-ms\) \* 1ms\)/g, '')), `${name}: 1ms solo para convertir --_run-ms`)
    const phys = css.replace(/left:\s*50%;/g, '')
    ok(!/(?<![-\w])(?:left|right|top|bottom)\s*:|(?:margin|padding|border)-(?:left|right|top|bottom)\b|text-align:\s*(?:left|right)/.test(phys), `${name}: solo propiedades lógicas`)
    ok(!/:hover/.test(css.replace(/@media \(hover: hover\) \{[^{}]*(\{[^{}]*\}[^{}]*)*\}/g, '')), `${name}: :hover solo dentro de @media (hover: hover)`)
    ok(/@media \(prefers-reduced-motion: reduce\)/.test(css) && /@media \(forced-colors: active\)/.test(css) && /@media \(prefers-reduced-transparency: reduce\)/.test(css), `${name}: bloques reduce, forced-colors y reduced-transparency`)
    const kf = [...css.matchAll(/@keyframes\s+([\w-]+)/g)].map((m) => m[1])
    ok(kf.every((k) => k.startsWith('g-status')), `${name}: keyframes con prefijo g-status (${kf})`)
    const outside = css.replace(/@supports \(transition-timing-function: linear\(0, 1\)\) \{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, '')
    ok(!/--g-ease-spring/.test(outside), `${name}: --g-ease-spring fuera de @supports`)
    const springUses = [...css.matchAll(/([\w-]+)\s+var\(--g-duration-(\w+)\)\s+var\(--g-ease-spring\)/g)]
    ok(springUses.every((m) => m[2] === 'slow'), `${name}: el muelle siempre con duration-slow`)
    ok(!/--g-ease-bounce/.test(css), `${name}: sin --g-ease-bounce`)
    ok(!/is-nudge|g-status-nudge|__ack|is-acknowledged|data-form="(?:dot|open|compact)"/.test(css), `${name}: sin restos retirados (#701, #696)`)
    if (island) {
      ok([...new Set(springUses.map((m) => m[1]))].sort().join() === '--_status-h,--_status-w', `GStatusIsland.css: el muelle solo en el tamaño (${[...new Set(springUses.map((m) => m[1]))]})`)
      ok(/\.g-status-island__chevron \{\s*transition: rotate var\(--g-duration-slow\) var\(--g-ease-out\)/.test(css), 'GStatusIsland.css: chevrón con slow + ease-out (no muelle)')
      ok(/@starting-style \{\s*\.g-status-island\.is-ready\[data-stage="drop"\] \.g-status-island__shape \{\s*translate: 0 calc\(-100% - var\(--_m\)\);\s*scale: 0\.9;\s*opacity: 0;/.test(css), 'GStatusIsland.css: nacer desde −(100 % + margen), 0.9 y fundido, solo con is-ready')
      ok(/--_cap-w: calc\(var\(--g-space-1\) \* 24\)/.test(css) && /--_row: max\(calc\(24px \+ var\(--g-border-width\) \* 2\), calc\(var\(--g-space-1\) \* 11\)\)/.test(css) && /--_badge: calc\(var\(--g-space-1\) \* 6\)/.test(css) && /--_wide: calc\(var\(--g-space-1\) \* 104\)/.test(css), 'GStatusIsland.css: constantes del contrato (cápsula ×24, fila ×11, insignia ×6, ancho ×104)')
      ok(/g-status-island__peek/.test(css) && /g-status-island__shape/.test(css), 'GStatusIsland.css: selectores de las compuertas (__shape, __peek)')
      const trans = [...css.matchAll(/([^{}]+)\{[^{}]*transition:\s*([^;]+);/g)].filter((m) => /--_status|scale|translate|opacity/.test(m[2]))
      ok(trans.every((m) => /is-ready/.test(m[1])), 'GStatusIsland.css: transiciones de forma solo bajo is-ready (nada al montar)')
    } else {
      ok(/\.g-status-mark--link\.is-echo::before \{\s*animation: g-status-echo var\(--g-duration-slow\) var\(--g-ease-out\)/.test(css), 'GStatusMark.css: eco g-status-echo en slow + ease-out (#701)')
    }
  }
}

// Temas: los once de dark-color-presence, regenerados con el CLI actual (los .css de generated/ son anteriores a la zona)
const THEMES = []
if (process.env.THEMES !== '0') {
  const dir = join(ROOT, 'design/lab/tema-oscuro/dark-color-presence/themes')
  const out = await mkdtemp(join(tmpdir(), 'grana-isla-'))
  for (const f of (await readdir(dir)).filter((x) => x.endsWith('.json')).sort()) {
    const css = join(out, f.replace('.json', '.css'))
    execFileSync(process.execPath, [join(ROOT, 'packages/cli/bin/grana.mjs'), 'theme', join(dir, f), '--out', css], { stdio: 'ignore' })
    THEMES.push({ name: f.replace('.json', ''), css: await readFile(css, 'utf8') })
  }
}

// Utilidades de color en la página: parser de rgb/color(srgb)/oklab/oklch/hex, composición y contraste WCAG
const UTIL = () => {
  const lin2s = (v) => { v = Math.max(0, Math.min(1, v)); return 255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055) }
  const oklab = (L, a, b) => {
    const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3, m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3, s = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3
    return [lin2s(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s), lin2s(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s), lin2s(-0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s)]
  }
  const num = (t, scale = 1) => t.endsWith('%') ? parseFloat(t) / 100 * scale : parseFloat(t)
  function parse (str) {
    str = String(str).trim()
    if (!str || str === 'transparent' || str === 'none') return [0, 0, 0, 0]
    let m
    if ((m = str.match(/^#([0-9a-f]{3,8})$/i))) { let h = m[1]; if (h.length <= 4) h = [...h].map((c) => c + c).join(''); const n = (i) => parseInt(h.slice(i, i + 2), 16); return [n(0), n(2), n(4), h.length === 8 ? n(6) / 255 : 1] }
    if ((m = str.match(/^(rgba?|color|oklab|oklch)\((.*)\)$/i))) {
      const fn = m[1].toLowerCase(); let body = m[2].replace(/,/g, ' ').trim()
      let alpha = 1
      if (body.includes('/')) { const [a, b] = body.split('/'); body = a.trim(); alpha = num(b.trim()) }
      let p = body.split(/\s+/)
      if (fn === 'rgb' || fn === 'rgba') { if (p.length === 4) { alpha = num(p[3]); p = p.slice(0, 3) } return [...p.map((x) => num(x, 255)), alpha] }
      if (fn === 'color') { const sp = p.shift(); if (sp !== 'srgb') throw new Error('espacio ' + sp); return [...p.map((x) => num(x) * 255), alpha] }
      if (fn === 'oklab') return [...oklab(num(p[0]), num(p[1], 0.4), num(p[2], 0.4)), alpha]
      if (fn === 'oklch') { const L = num(p[0]), C = num(p[1], 0.4), H = parseFloat(p[2]) * Math.PI / 180; return [...oklab(L, C * Math.cos(H), C * Math.sin(H)), alpha] }
    }
    throw new Error('color sin leer: ' + str)
  }
  const over = (top, bot) => [...top.slice(0, 3).map((v, i) => v * top[3] + bot[i] * (1 - top[3])), 1]
  const L = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]) }
  const cr = (a, b) => { const x = L(a), y = L(b); return Math.round((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) * 100) / 100 }
  function resolve (el, expr) { const s = document.createElement('span'); s.style.backgroundColor = expr; el.append(s); const v = getComputedStyle(s).backgroundColor; s.remove(); return parse(v) }
  function shadows (cs) {
    const raw = cs.boxShadow; if (!raw || raw === 'none') return []
    const parts = []; let depth = 0, cur = ''
    for (const ch of raw) { if (ch === '(') depth++; if (ch === ')') depth--; if (ch === ',' && !depth) { parts.push(cur.trim()); cur = '' } else cur += ch }
    parts.push(cur.trim())
    return parts.map((p) => {
      const cm = p.match(/(rgba?\([^)]*\)|color\([^)]*\)|oklab\([^)]*\)|oklch\([^)]*\)|#[0-9a-f]+|transparent)/i)
      const rest = cm ? p.replace(cm[0], '') : p
      const n = (rest.match(/-?[\d.]+px/g) || []).map(parseFloat)
      return { color: cm ? parse(cm[0]) : [0, 0, 0, 0], x: n[0] || 0, y: n[1] || 0, blur: n[2] || 0, spread: n[3] || 0, inset: /inset/.test(p) }
    })
  }
  window.__C = { parse, over, cr, resolve, shadows }
}

// Contraste y delimitación de los ejemplares quietos, de las marcas y de la marca de texto
const MEASURE = () => {
  const { parse, over, cr, resolve, shadows } = window.__C
  const cs = (el) => getComputedStyle(el)
  const page = parse(cs(document.body).backgroundColor)
  const out = { text: {}, graphic: {}, edge: {}, disc: 99 }
  const T = (k, v) => { out.text[k] = Math.min(out.text[k] ?? 99, v) }
  const G = (k, v) => { out.graphic[k] = Math.min(out.graphic[k] ?? 99, v) }
  const E = (k, v) => { out.edge[k] = Math.min(out.edge[k] ?? 99, v) }
  const edgeOf = (el, fillRaw, bg) => {
    const f = over(fillRaw, bg)
    const sh = shadows(cs(el)).filter((s) => !s.blur && !s.x && !s.y && s.spread > 0)
    return Math.max(cr(f, bg), ...sh.map((s) => cr(over(s.color, s.inset ? f : bg), bg)))
  }
  for (const panel of document.querySelectorAll('.panel')) {
    const kind = panel.dataset.bg
    const bgEl = panel.querySelector('.bg')
    const bg = bgEl ? over(parse(cs(bgEl).backgroundColor), page) : page
    for (const shape of panel.querySelectorAll('.g-status-island__shape')) {
      const fillRaw = parse(cs(shape).backgroundColor)
      // el cristal es translúcido: la tinta se mide contra el peor fondo posible (negro, blanco) y el fondo real
      const fills = (fillRaw[3] < 1 ? [[0, 0, 0, 1], [255, 255, 255, 1], bg] : [bg]).map((b) => over(fillRaw, b))
      const minOn = (fg, layer) => Math.min(...fills.map((f) => { const base = layer ? over(layer, f) : f; return cr(over(fg, base), base) }))
      const sel = (s, fn) => shape.querySelectorAll(s).forEach((e) => { if (e.getClientRects().length) fn(e) })
      sel('.g-status-island__text:not([aria-hidden])', (e) => T('titular', minOn(parse(cs(e).color))))
      sel('.g-status-island__desc', (e) => T('descripción del asomo', minOn(parse(cs(e).color))))
      sel('.g-status-island__timer, .g-status-item__timer', (e) => T('cuenta atrás', minOn(parse(cs(e).color))))
      sel('.g-status-item__title', (e) => T('título de la lista', minOn(parse(cs(e).color))))
      sel('.g-status-item__description', (e) => T('descripción de la lista', minOn(parse(cs(e).color))))
      sel('.g-status-item__link, .g-status-island__link', (e) => T('enlace', minOn(parse(cs(e).color))))
      sel('.g-status-item__details-text', (e) => T('detalle técnico', minOn(parse(cs(e).color), parse(cs(e.closest('.g-status-item__details')).backgroundColor))))
      sel('.g-status-island__more', (e) => { const chip = parse(cs(e).backgroundColor); T('«+N»', minOn(parse(cs(e).color), chip)) })
      sel('.g-btn:not(.g-status-island__action):not(.g-status-item__action)', (e) => T('botones de texto', minOn(parse(cs(e).color))))
      sel('.g-status-island__action, .g-status-item__action', (e) => {
        const b = parse(cs(e).backgroundColor)
        T('acción (texto)', Math.min(...fills.map((f) => { const base = over(b, f); return cr(over(parse(cs(e).color), base), base) })))
        G('acción (cápsula rellena)', Math.min(...fills.map((f) => cr(over(b, f), f))))
        // al pasar: los alias de hover que reasigna coco
        const hb = resolve(e, cs(e).getPropertyValue('--_bg-hover')), hf = resolve(e, cs(e).getPropertyValue('--_fg-hover'))
        T('acción al pasar', Math.min(...fills.map((f) => { const base = over(hb, f); return cr(over(hf, base), base) })))
      })
      sel('.g-status-island__chevron', (e) => G('chevrón', minOn(parse(cs(e).color))))
      sel('.g-status-island__badge, .g-status-item__badge', (b) => {
        const disc = parse(cs(b).backgroundColor), glyph = parse(cs(b).color)
        G('glifo del tipo', Math.min(...fills.map((f) => { const base = over(disc, f); return cr(over(glyph, base), base) })))
        out.disc = Math.min(out.disc, ...fills.map((f) => cr(over(disc, f), f)))
      })
      sel('.g-status-island__ring', (r) => G('anillo de tiempo', minOn(resolve(r, 'var(--_ink)'))))
      G('foco (anillo interior)', minOn(resolve(shape, 'var(--_focus)')))
      E(`isla · ${kind}`, edgeOf(shape, fillRaw, bg))
    }
  }
  // Marca enlace en la página (sobre la superficie del formulario) y dentro de la zona (cabecera)
  for (const mk of document.querySelectorAll('.g-status-mark--link')) {
    let host = mk.parentElement; while (host && parse(cs(host).backgroundColor)[3] === 0) host = host.parentElement
    const hb = host ? over(parse(cs(host).backgroundColor), page) : page
    const where = mk.closest('[data-g-zone]') ? 'zona' : 'superficie'
    const fillRaw = parse(cs(mk).backgroundColor)
    // en la página, contra el peor fondo (negro, blanco) y su anfitrión; dentro de una zona, contra la zona: la zona es una
    // superficie opaca y es lo único que la marca tiene detrás (no flota sobre contenido, como la isla)
    const fills = (where === 'zona' ? [hb] : [[0, 0, 0, 1], [255, 255, 255, 1], hb]).map((b) => over(fillRaw, b))
    T(`marca (texto) · ${where}`, Math.min(...fills.map((f) => cr(over(parse(cs(mk).color), f), f))))
    const b = mk.querySelector('.g-status-mark__badge'); const disc = parse(cs(b).backgroundColor)
    G(`marca (glifo) · ${where}`, Math.min(...fills.map((f) => { const base = over(disc, f); return cr(over(parse(cs(b).color), base), base) })))
    E(`marca · ${where}`, edgeOf(mk, fillRaw, hb))
  }
  // Marca de texto (sin caja, sobre la superficie de su sección)
  for (const mt of document.querySelectorAll('.g-status-mark--text')) {
    const hb = over(parse(cs(document.getElementById('text-host')).backgroundColor), page)
    T('marca de texto (texto)', cr(over(parse(cs(mt.querySelector('.g-status-mark__text')).color), hb), hb))
    G('marca de texto (glifo)', cr(over(parse(cs(mt.querySelector('.g-status-mark__badge')).color), hb), hb))
  }
  return out
}

const total0 = { data: [] }
for (const engine of (process.env.ENGINES || 'chromium,firefox,webkit').split(',')) {
  ENGINE = engine
  const browser = await pw[engine].launch()
  const errs = []
  const open = async ({ vw = 1280, vh = 900, q = '', css = '', ...ctx } = {}) => {
    const context = await browser.newContext({ viewport: { width: vw, height: vh }, ...ctx })
    await context.addInitScript(UTIL)
    const p = await context.newPage()
    p.on('console', (m) => { const t = m.text(); if (/development build of Vue|production build|Failed to load resource|404/.test(t)) return; if (['error', 'warning'].includes(m.type())) errs.push(`${m.type()}: ${t.slice(0, 200)}`) })
    p.on('pageerror', (e) => errs.push(`pageerror: ${e}`))
    await p.goto(BASE + q, { waitUntil: 'domcontentloaded' })
    if (css) await p.addStyleTag({ content: css })
    await p.waitForFunction(() => window.__live && window.__live.st.ready)
    await p.evaluate(() => Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 2500))]))
    await p.waitForTimeout(250)
    return { p, context }
  }
  // Película: un registro por cuadro de la cápsula viva
  const FILM = (ms) => new Promise((done) => {
    const L = window.__live; const sh = L.shape.value; const out = []; const t0 = performance.now()
    const tick = () => {
      if (!sh.hidden && sh.getClientRects().length) {
        const r = sh.getBoundingClientRect(); const c = getComputedStyle(sh)
        const tx = sh.querySelector('.g-status-island__text:not([aria-hidden])'); const b = sh.querySelector('.g-status-island__badge')
        out.push({ t: performance.now() - t0, w: r.width, h: r.height, y: r.top, op: +c.opacity, txt: tx ? +getComputedStyle(tx).opacity : 0, ty: tx ? tx.getBoundingClientRect().top : 0, bx: b ? b.getBoundingClientRect().left : 0, stage: L.st.stage, form: L.st.form })
      } else out.push({ t: performance.now() - t0, hidden: true, stage: L.st.stage, form: L.st.form })
      if (performance.now() - t0 < ms) requestAnimationFrame(tick); else done(out)
    }
    requestAnimationFrame(tick)
  })

  // ---------- 1 · Contraste y delimitación ----------
  const judge = (tag, m) => {
    const lowT = Object.entries(m.text).filter(([, v]) => v < 4.5), lowG = Object.entries(m.graphic).filter(([, v]) => v < 3), lowE = Object.entries(m.edge).filter(([, v]) => v < 3)
    const minT = Math.min(...Object.values(m.text)), minG = Math.min(...Object.values(m.graphic)), minE = Math.min(...Object.values(m.edge))
    total0.data.push({ engine, tag, minT, minG, minE })
    ok(!lowT.length, `${tag}: texto ≥ 4,5 (mín ${minT}${lowT.length ? '; bajos ' + JSON.stringify(lowT) : ''})`)
    ok(!lowG.length, `${tag}: glifo, anillo, chevrón, acción y foco ≥ 3 (mín ${minG}${lowG.length ? '; bajos ' + JSON.stringify(lowG) : ''})`)
    ok(!lowE.length, `${tag}: delimitación ≥ 3 (${JSON.stringify(m.edge)})`)
    return m
  }
  const themes = engine === 'chromium' ? [{ name: 'defecto', css: '' }, ...THEMES] : [{ name: 'defecto', css: '' }]
  for (const th of themes) for (const dark of [false, true]) {
    const { p, context } = await open({ q: dark ? '?dark' : '', css: th.css })
    const m = judge(`${th.name} ${dark ? 'oscuro' : 'claro'}`, await p.evaluate(MEASURE))
    if (th.name === 'defecto' && process.env.VERBOSE) console.log(JSON.stringify(m))
    if (th.name === 'defecto') info.push(`${engine} defecto ${dark ? 'oscuro' : 'claro'}: delimitación ${JSON.stringify(m.edge)}; disco frente a la cápsula ${m.disc}; texto mín ${Math.min(...Object.values(m.text))}; gráficos mín ${Math.min(...Object.values(m.graphic))}`)
    if (CAPS && engine === 'chromium' && th.name === 'defecto') await p.screenshot({ path: join(HERE, `estilo-isla-${dark ? 'oscuro' : 'claro'}.png`), fullPage: true })
    await context.close()
  }

  // ---------- 2 · Geometría ----------
  {
    const { p, context } = await open()
    const g = await p.evaluate(() => {
      const R = (e) => e.getBoundingClientRect()
      const sp = document.querySelector('[data-test="page-line-warning"]'); const sh = R(sp.querySelector('.g-status-island__shape')); const b = R(sp.querySelector('.g-status-island__badge'))
      const mk = document.querySelector('[data-test="mark-link-error"]'); const mr = R(mk); const mb = R(mk.querySelector('.g-status-mark__badge'))
      return { row: sh.height, badge: b.width, conc: [b.left - sh.left, b.top - sh.top, sh.bottom - b.bottom], mark: mr.height, mbadge: mb.width, mconc: [mb.left - mr.left, mb.top - mr.top, mr.bottom - mb.bottom] }
    })
    ok(Math.abs(g.row - 44) <= 0.5 && g.badge === 24, `titular: fila ${g.row} (space × 11), insignia ${g.badge}`)
    ok(g.conc.every((v) => Math.abs(v - g.conc[0]) <= 0.6), `insignia concéntrica con el extremo (${g.conc.map((v) => v.toFixed(1))})`)
    ok(Math.abs(g.mark - 32) <= 0.5 && g.mbadge === 20 && g.mconc.every((v) => Math.abs(v - g.mconc[0]) <= 0.6), `marca: ${g.mark} de alto, insignia ${g.mbadge} concéntrica (${g.mconc.map((v) => v.toFixed(1))})`)
    await context.close()
  }

  // ---------- 3 · Movimiento cuadro a cuadro (?solo: una sola superficie de cristal, como en una aplicación) ----------
  {
    const { p, context } = await open({ q: '?solo' })
    const slow = await p.evaluate(() => { const s = document.createElement('span'); s.style.transitionDuration = 'var(--g-duration-slow)'; document.body.append(s); const v = parseFloat(getComputedStyle(s).transitionDuration) * 1000; s.remove(); return v })
    // Nacer
    const born = await p.evaluate(async (F) => { const f = new Function('return ' + F)(); const film = f(1000); window.bench.show('error'); return film }, FILM.toString())
    const vis = born.filter((f) => !f.hidden && f.op > 0.02)
    const fin = born[born.length - 1]
    const capW = 96
    const f0 = vis[0]
    const stages = await p.evaluate(() => window.__stages.map((s) => s.s))
    ok(stages.slice(0, 3).join() === 'drop,grow,rest', `nacer: etapas drop → grow → reposo (${stages.join(',')})`)
    ok(f0 && f0.w <= capW + 1 && f0.txt < 0.05 && f0.y < fin.y - 1 && f0.op < 0.9, `nacer: el primer cuadro visible es la cápsula sin texto y entra desde el borde (${f0 && Math.round(f0.w)}px, texto ${f0 && f0.txt}, Δy ${f0 && (fin.y - f0.y).toFixed(1)}, op ${f0 && f0.op.toFixed(2)})`)
    const drop = vis.filter((f) => f.stage === 'drop')
    ok(drop.length && drop.every((f) => f.w <= capW + 1 && f.txt < 0.05), `nacer: durante la caída, tamaño de cápsula y sin texto (${drop.length} cuadros, máx ${Math.round(Math.max(...drop.map((f) => f.w)))}px)`)
    const maxW = Math.max(...vis.map((f) => f.w)); const over = (maxW - fin.w) / (fin.w - capW)
    ok(over <= 0.045, `nacer: ningún cuadro más ancho que el destino salvo el muelle (${(over * 100).toFixed(1)} % del cambio, final ${Math.round(fin.w)}px)`)
    // destello: cambio de opacidad por cuadro de 16,7 ms (un cuadro largo del entorno sin GPU no cuenta como destello)
    const per = (a, b) => Math.max(1, (b.t - a.t) / 16.7)
    let up = 0; for (let i = 1; i < vis.length; i++) up = Math.max(up, (vis[i].op - vis[i - 1].op) / per(vis[i - 1], vis[i]))
    ok(up <= 0.5, `nacer: sin destello (opacidad por cuadro +${up.toFixed(2)})`)
    const entry = await p.evaluate(() => { const s = window.__stages; const a = s.find((x) => x.s === 'drop').t; const b = s.find((x) => x.s === 'rest').t; return b - a })
    // Asomo (crece con muelle) y cierre (sin bajar del titular: M1)
    const h0 = fin.h
    const pk = await p.evaluate(async (F) => { const f = new Function('return ' + F)(); const film = f(700); window.__live.setPeek(true); return film }, FILM.toString())
    const h1 = pk[pk.length - 1].h
    const pOver = (Math.max(...pk.map((f) => f.h)) - h1) / (h1 - h0)
    ok(h1 > h0 + 20 && pOver <= 0.045, `asomo: crece hacia abajo (${Math.round(h0)} → ${Math.round(h1)}px, sobrepaso ${(pOver * 100).toFixed(1)} %)`)
    const rot = await p.evaluate(() => { const c = getComputedStyle(document.querySelector('[data-test="live"] .g-status-island__chevron')); return { rotate: c.rotate, ease: c.transitionTimingFunction } })
    ok(/180deg|0\.5turn/.test(rot.rotate) && /cubic-bezier\(0\.23, 1, 0\.32, 1\)/.test(rot.ease), `chevrón: media vuelta con --g-ease-out (${rot.rotate}, ${rot.ease})`)
    const yTop = pk[pk.length - 1].y
    ok(Math.abs(yTop - fin.y) <= 0.5, `asomo: el borde de arriba no se mueve (Δ ${(yTop - fin.y).toFixed(2)})`)
    const pc = await p.evaluate(async (F) => { const f = new Function('return ' + F)(); const film = f(900); window.__live.setPeek(false); return film }, FILM.toString())
    const h2 = pc[pc.length - 1].h
    ok(Math.abs(h2 - h0) <= 0.5 && Math.min(...pc.map((f) => f.h)) >= h2 - 0.5, `cerrar el asomo: vuelve al titular sin bajar de él (M1; mín ${Math.min(...pc.map((f) => f.h)).toFixed(1)}, final ${h2.toFixed(1)})`)
    // Pausa: el anillo se queda quieto con la pista completa
    const ring = await p.evaluate(async () => {
      const L = window.__live; const r = () => document.querySelector('[data-test="live"] .g-status-island__ring')
      const v = () => parseFloat(getComputedStyle(r()).getPropertyValue('--_status-ring'))
      const a = v(); await new Promise((z) => setTimeout(z, 400)); const b = v()
      L.setPause(true); await new Promise((z) => setTimeout(z, 100))
      const an = r().getAnimations()[0]; const arc1 = getComputedStyle(r()).backgroundImage; await new Promise((z) => setTimeout(z, 400)); const arc2 = getComputedStyle(r()).backgroundImage
      const track = [getComputedStyle(r()).getPropertyValue('--_track')]
      L.setPause(false)
      return { a, b, state: an && an.playState, same: arc1 === arc2, track }
    })
    ok(ring.b > ring.a, `anillo: se vacía con el tiempo (avance ${ring.a.toFixed(3)} → ${ring.b.toFixed(3)})`)
    ok(ring.state === 'paused' && ring.same, `pausa: el anillo se detiene (${ring.state}, arco quieto ${ring.same})`)
    // Recogerse: fold → rise; nunca baja de la cápsula; se va con su insignia; la salida no dura más que la entrada
    await p.evaluate(() => document.getElementById('mark-save').scrollIntoView({ block: 'center' }))
    const echoP = p.evaluate(() => new Promise((r) => { const m = document.getElementById('mark-save'); const t0 = performance.now(); const mo = new MutationObserver(() => { if (m.classList.contains('is-echo')) { mo.disconnect(); requestAnimationFrame(() => { const a = m.getAnimations({ subtree: true }).find((x) => x.animationName === 'g-status-echo'); r({ dur: a && a.effect.getComputedTiming().duration, t: performance.now() - t0 }) }) } }); mo.observe(m, { attributes: true }); setTimeout(() => r(null), 3000) }))
    const gone = await p.evaluate(async (F) => { const f = new Function('return ' + F)(); window.__stages = []; const film = f(1000); window.__live.hide(); return film }, FILM.toString())
    const gv = gone.filter((f) => !f.hidden)
    const exit = await p.evaluate(() => { const s = window.__stages; return s.find((x) => x.s === 'empty').t - s.find((x) => x.s === 'fold').t })
    // en la subida la escala baja a 0.9: el ancho dibujado es el de la cápsula × escala
    const minFold = Math.min(...gv.filter((f) => f.stage === 'fold').map((f) => f.w)), minRise = Math.min(...gv.filter((f) => f.stage === 'rise').map((f) => f.w))
    ok(minFold >= capW - 0.5 && minRise >= capW * 0.9 - 0.5, `recogerse: nunca más estrecha que la cápsula (M1; mín ${Math.round(minFold)}px al estrecharse, ${Math.round(minRise)}px al subir con 0.9)`)
    ok(gv.filter((f) => f.stage === 'rise').every((f) => f.txt < 0.05) && gv.some((f) => f.stage === 'rise' && f.y < fin.y - 2 && f.op < 1), 'recogerse: sube y se funde, sin texto (con su insignia)')
    let down = 0; for (let i = 1; i < gone.length; i++) down = Math.max(down, ((gone[i - 1].hidden ? 0 : gone[i - 1].op) - (gone[i].hidden ? 0 : gone[i].op)) / per(gone[i - 1], gone[i]))
    ok(down <= 0.5 && gone[gone.length - 1].hidden, `recogerse: sin destello y acaba oculta (−${down.toFixed(2)} por cuadro)`)
    // las dos son 2 × slow en el CSS; el banco suma dos cuadros por etapa al avanzar (margen: tres cuadros)
    ok(exit <= entry + 50, `salida ≤ entrada (#152): ${exit} ms frente a ${entry} ms (2 × slow = ${2 * slow} en el CSS)`)
    const echo = await echoP
    ok(echo && Math.abs(echo.dur - slow) <= 1, `eco en la marca al subir, una vez, en --g-duration-slow (${echo && echo.dur} ms)`)
    info.push(`${engine}: entrada ${entry} ms, salida ${exit} ms; nacer ${Math.round(capW)} → ${Math.round(fin.w)}px, sobrepaso ${(over * 100).toFixed(1)} %; asomo ${Math.round(h0)} → ${Math.round(h1)}px, sobrepaso ${(pOver * 100).toFixed(1)} %`)
    await context.close()
  }
  // Relevo e interrupciones
  {
    const { p, context } = await open({ q: '?t=1400&solo' })
    await p.evaluate(() => window.bench.show('warning')); await p.waitForTimeout(700)
    const rl = await p.evaluate(async (F) => {
      const f = new Function('return ' + F)(); const film = f(700); window.bench.show('error')
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
      const sh = document.querySelector('[data-test="live"] .g-status-island__shape')
      const out = sh.querySelector('.g-status-island__text[aria-hidden="true"]'); const nw = sh.querySelector('.g-status-island__text:not([aria-hidden])')
      const s = sh.querySelector('.g-status-island__summary').getBoundingClientRect()
      const nr = nw.getBoundingClientRect(); const or = out && out.getBoundingClientRect()
      return { film: await film, outgoing: !!out, newBelow: nr.top - (s.top + s.height / 2 - nr.height / 2), outAbove: or ? or.top - (s.top + s.height / 2 - or.height / 2) : 0, more: !!sh.querySelector('.g-status-island__more') }
    }, FILM.toString())
    ok(rl.film.every((f) => !f.hidden && f.op > 0.98), 'relevo: la cápsula no desaparece ni se funde')
    ok(rl.outgoing && rl.newBelow > 1 && rl.outAbove < -1 && rl.more, `relevo: el texto nuevo entra desde abajo y la copia que sale se va arriba («+1»; Δ ${rl.newBelow.toFixed(1)} / ${rl.outAbove.toFixed(1)})`)
    // Interrupción en fold: vuelve a crecer desde el ancho actual
    await p.waitForTimeout(400)
    const iFold = await p.evaluate(async (F) => {
      const f = new Function('return ' + F)(); const L = window.__live
      L.hide(); await new Promise((r) => setTimeout(r, 90))
      const sh = L.shape.value; const w0 = sh.getBoundingClientRect().width; const film = f(500); window.bench.show('info'); const fr = await film
      return { w0, w1: Math.min(...fr.map((x) => x.w)), stage: L.st.stage || 'rest', hidden: fr.some((x) => x.hidden), fin: fr[fr.length - 1].w }
    }, FILM.toString())
    // el banco cambia de etapa al cuadro siguiente: uno o dos cuadros más de estrecharse caben; reiniciar desde la cápsula, no
    ok(!iFold.hidden && iFold.w1 >= iFold.w0 - 24 && iFold.w1 > 96 + 4 && iFold.fin > iFold.w0, `interrupción en fold: vuelve a crecer desde el ancho actual (${Math.round(iFold.w0)} → ${Math.round(iFold.w1)} → ${Math.round(iFold.fin)}px)`)
    await p.waitForTimeout(500)
    const iRise = await p.evaluate(async (F) => {
      const f = new Function('return ' + F)(); const L = window.__live
      L.hide(); await new Promise((r) => { const c = () => (L.st.stage === 'rise' ? setTimeout(r, 90) : requestAnimationFrame(c)); c() })
      const sh = L.shape.value; const y0 = sh.getBoundingClientRect().top; const film = f(600); window.bench.show('warning'); const fr = await film
      return { y0, y1: Math.min(...fr.map((x) => x.y)), hidden: fr.some((x) => x.hidden), yFin: fr[fr.length - 1].y }
    }, FILM.toString())
    ok(!iRise.hidden && iRise.y1 >= iRise.y0 - 8 && iRise.yFin > iRise.y0, `interrupción en rise: baja otra vez desde donde está, sin reaparecer (${iRise.y0.toFixed(1)} → ${iRise.y1 && iRise.y1.toFixed(1)} → ${iRise.yFin.toFixed(1)})`)
    // Abrir la lista en cualquier etapa: la lista crece desde el estado actual
    await p.waitForTimeout(500)
    const lst = await p.evaluate(async (F) => { const f = new Function('return ' + F)(); const film = f(700); window.__live.toggleList(); return film }, FILM.toString())
    const lw = lst[lst.length - 1]
    ok(!lst.some((x) => x.hidden) && lw.form === 'list' && lw.h > 100, `lista: se abre desde el titular (${Math.round(lst[0].h)} → ${Math.round(lw.h)}px)`)
    await context.close()
  }

  // ---------- 4 · Movimiento reducido ----------
  {
    const { p, context } = await open({ q: '?solo', reducedMotion: 'reduce' })
    const r = await p.evaluate(async (F) => {
      const f = new Function('return ' + F)()
      const moving = new Set(); let stop = false
      const watch = () => { for (const a of document.getAnimations().filter((x) => x.effect && x.effect.target && x.effect.target.closest && x.effect.target.closest('.g-status-island, .g-status-mark') && x.playState === 'running')) { const k = a.effect && a.effect.getKeyframes ? a.effect.getKeyframes() : []; const props = new Set(k.flatMap((x) => Object.keys(x)).filter((x) => !['offset', 'easing', 'composite', 'computedOffset'].includes(x))); if (a.transitionProperty) props.add(a.transitionProperty); for (const x of props) if (/transform|translate|scale|rotate|size|width|height|--_status-(?:w|h)|inline|block/.test(x)) moving.add(x + ':' + (a.animationName || a.transitionProperty)) } if (!stop) requestAnimationFrame(watch) }
      watch()
      const film = f(900); window.bench.show('error'); const born = await film
      window.__live.setPeek(true); await new Promise((z) => setTimeout(z, 300)); window.__live.setPeek(false); await new Promise((z) => setTimeout(z, 300))
      const ring = document.querySelector('[data-test="live"] .g-status-island__ring'); const a1 = parseFloat(getComputedStyle(ring).getPropertyValue('--_status-ring'))
      await new Promise((z) => setTimeout(z, 500)); const a2 = parseFloat(getComputedStyle(ring).getPropertyValue('--_status-ring'))
      const fin = born[born.length - 1]; const vis = born.filter((x) => !x.hidden && x.op > 0.02)
      document.getElementById('mark-save').scrollIntoView({ block: 'center' })
      const echo = new Promise((z) => { const m = document.getElementById('mark-save'); const mo = new MutationObserver(() => { if (m.classList.contains('is-echo')) { mo.disconnect(); requestAnimationFrame(() => { const an = m.getAnimations({ subtree: true }).find((x) => x.animationName === 'g-status-echo'); const k = an && an.effect.getKeyframes(); z(k && k.map((x) => x.boxShadow)) }) } }); mo.observe(m, { attributes: true }); setTimeout(() => z(null), 2500) })
      const goneP = f(800); window.__live.hide(); const gone = await goneP
      const e = await echo
      stop = true
      return { moving: [...moving], sizes: vis.map((x) => Math.round(x.w)), fin: Math.round(fin.w), ys: [...new Set(vis.map((x) => Math.round(x.y)))], a1, a2, goneHidden: gone[gone.length - 1].hidden, goneW: [...new Set(gone.filter((x) => !x.hidden).map((x) => Math.round(x.w)))], echo: e }
    }, FILM.toString())
    ok(r.moving.length === 0, `reducido: nada se desplaza, gira ni cambia de tamaño animado (${r.moving.join(', ')})`)
    ok(r.sizes.every((w) => Math.abs(w - r.fin) <= 1) && r.ys.length === 1, `reducido: aparece con su tamaño y en su sitio, fundida (anchos ${[...new Set(r.sizes)]}, y ${r.ys})`)
    ok(r.goneHidden && r.goneW.length <= 1, `reducido: se va fundida con su tamaño (${r.goneW})`)
    ok(r.a2 > r.a1, `reducido: el anillo sigue diciendo el tiempo (${r.a1.toFixed(3)} → ${r.a2.toFixed(3)})`)
    const spread = (s) => (s.match(/-?[\d.]+px/g) || []).map(parseFloat)[3]
    ok(r.echo && r.echo.length === 2 && spread(r.echo[0]) === spread(r.echo[1]), `reducido: el eco es un fundido en su sitio (${r.echo && r.echo.join(' → ')})`)
    await context.close()
  }

  // ---------- 5 · forced-colors (Chromium) ----------
  if (engine === 'chromium') {
    const { p, context } = await open({ forcedColors: 'active' })
    const fc = await p.evaluate(() => {
      const { parse } = window.__C; const cs = (e) => getComputedStyle(e)
      const sp = document.querySelector('[data-test="page-line-error"]'); const sh = sp.querySelector('.g-status-island__shape')
      const b = sh.querySelector('.g-status-island__badge'); const ring = sh.querySelector('.g-status-island__ring')
      const act = document.querySelector('[data-test="page-peek-error"] .g-status-island__action'); const mk = document.querySelector('[data-test="mark-link-error"]')
      return { border: parseFloat(cs(sh).borderTopWidth) >= 1 && parse(cs(sh).borderTopColor)[3] > 0, badge: cs(b).outlineStyle === 'solid', ring: /rgb\((0, 0, 0|255, 255, 255)\)|canvastext/i.test(cs(ring).backgroundImage), act: parse(cs(act).borderTopColor)[3] > 0, mark: parse(cs(mk).borderTopColor)[3] > 0, sheen: getComputedStyle(sh, '::before').display === 'none' }
    })
    ok(Object.values(fc).every(Boolean), `forced-colors: cápsula, insignia, anillo, acción y marca con colores del sistema (${JSON.stringify(fc)})`)
    await context.close()
  }

  // ---------- 6 · 320 px y texto al 200 % · 7 · dianas ----------
  const fits = (p, vw) => p.evaluate((vw) => {
    const sh = document.querySelector('[data-test="live"] .g-status-island__shape'); const r = sh.getBoundingClientRect(); const inner = sh.firstElementChild.getBoundingClientRect()
    return { l: Math.round(r.left), r: Math.round(r.right), clip: Math.round(inner.bottom - r.bottom), ok: r.left >= 0 && r.right <= vw && document.documentElement.scrollWidth <= document.documentElement.clientWidth && inner.bottom <= r.bottom + 1 && inner.right <= r.right + 1 }
  }, vw)
  for (const [vw, zoom] of [[320, ''], [1280, '200%'], [640, '200%']]) {
    const { p, context } = await open({ vw, vh: 800 })
    if (zoom) await p.evaluate((z) => { document.documentElement.style.fontSize = z }, zoom)
    await p.evaluate(() => window.bench.show('error')); await p.waitForTimeout(800)
    const a = await fits(p, vw)
    await p.evaluate(() => window.__live.setPeek(true)); await p.waitForTimeout(700)
    const b = await fits(p, vw)
    await p.evaluate(() => window.__live.toggleList()); await p.waitForTimeout(700)
    const c = await fits(p, vw)
    const tag = zoom ? `texto al 200 % a ${vw}px` : `${vw}px`
    ok(a.ok && b.ok && c.ok, `${tag}: titular, asomo y lista dentro del visor, sin desplazamiento horizontal ni recorte (${JSON.stringify({ a, b, c })})`)
    const small = await p.evaluate(() => [...document.querySelectorAll('[data-test="live"] button, [data-test="live"] a, #mark-save')].filter((b) => b.getClientRects().length).map((b) => b.getBoundingClientRect()).filter((r) => r.width < 24 || r.height < 24).length)
    ok(small === 0, `${tag}: dianas ≥ 24×24 (${small} pequeñas)`)
    await context.close()
  }
  if (engine === 'chromium') {
    const { p, context } = await open({ vw: 390, vh: 800, hasTouch: true, isMobile: true })
    await p.evaluate(() => window.bench.show('success')); await p.waitForTimeout(800); await p.evaluate(() => window.__live.setPeek(true)); await p.waitForTimeout(600)
    const t = await p.evaluate(() => {
      const area = (e) => { const r = e.getBoundingClientRect(); const a = getComputedStyle(e, '::after'); return [Math.max(r.width, parseFloat(a.width) || 0), Math.max(r.height, parseFloat(a.height) || 0)] }
      const live = document.querySelector('[data-test="live"]')
      return { coarse: matchMedia('(pointer: coarse)').matches, summary: area(live.querySelector('.g-status-island__summary')), btns: [...live.querySelectorAll('.g-btn, .g-status-island__link')].filter((b) => b.getClientRects().length).map(area), mark: area(document.getElementById('mark-save')) }
    })
    ok(t.coarse && [t.summary, t.mark, ...t.btns].every(([w, h]) => w >= 44 && h >= 44), `pointer: coarse: dianas ≥ 44×44 (${JSON.stringify(t)})`)
    await context.close()
  }

  // ---------- 8 · Alineación (LTR y RTL) ----------
  for (const dir of ['ltr', 'rtl']) {
    const { p, context } = await open({ q: dir === 'rtl' ? '?rtl' : '' })
    const al = await p.evaluate((rtl) => {
      const R = (e) => e.getBoundingClientRect(); const s = (r) => rtl ? -r.right : r.left
      const res = { concentric: 0, centred: 0, column: 0, list: 0, endPad: true }
      for (const sh of document.querySelectorAll('[data-test^="page-"] .g-status-island__shape')) {
        const o = R(sh); const sum = sh.querySelector('.g-status-island__summary'); const b = R(sum.querySelector('.g-status-island__badge')); const row = R(sum)
        const startGap = rtl ? o.right - b.right : b.left - o.left
        res.concentric = Math.max(res.concentric, Math.abs(startGap - (b.top - o.top)))
        const t = R(sum.querySelector('.g-status-island__text:not([aria-hidden])'))
        const peek = sh.closest('.g-status-island').classList.contains('is-peek')
        if (!peek) res.centred = Math.max(res.centred, Math.abs((t.top + t.bottom) / 2 - (b.top + b.bottom) / 2))
        const tail = sum.querySelector('.g-status-island__tail'); if (tail) { const tr = R(tail); const endGap = rtl ? tr.left - o.left : o.right - tr.right; if (endGap + 0.5 < startGap) res.endPad = false }
        sh.querySelectorAll('.g-status-island__desc, .g-status-island__acts > :first-child').forEach((e) => { if (e.getClientRects().length) res.column = Math.max(res.column, Math.abs(s(R(e)) - s(t))) })
        sh.querySelectorAll('.g-status-item__title').forEach((e) => { if (e.getClientRects().length) res.list = Math.max(res.list, Math.abs(s(R(e)) - s(t))) })
      }
      return res
    }, dir === 'rtl')
    ok(al.concentric <= 1, `${dir}: insignia concéntrica con el extremo de la cápsula (Δ ${al.concentric.toFixed(2)}px)`)
    ok(al.centred <= 1, `${dir}: título centrado con la insignia (Δ ${al.centred.toFixed(2)}px)`)
    ok(al.column <= 1 && al.list <= 1, `${dir}: descripción, acción y títulos de la lista arrancan donde el título (Δ ${al.column.toFixed(2)} / ${al.list.toFixed(2)}px)`)
    ok(al.endPad, `${dir}: el aire del final no es menor que el del inicio`)
    await context.close()
  }

  // ---------- 9 · Marca de texto y marca enlace junto a «Guardar» ----------
  {
    const { p, context } = await open()
    const r = await p.evaluate(() => {
      const c = (e) => { const r = e.getBoundingClientRect(); return r.top + r.height / 2 }
      const firstLine = (p) => { const rg = document.createRange(); const tn = [...p.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim()); rg.setStart(tn, 0); rg.setEnd(tn, 1); return rg.getBoundingClientRect() }
      const btn = document.querySelector('#save')
      const links = [...document.querySelectorAll('[data-test^="mark-link-"]')].map((m) => Math.abs(c(m) - c(btn)))
      const para = document.querySelector('#para').getBoundingClientRect()
      const texts = [...document.querySelectorAll('[data-test^="mark-text-"]')].map((m) => { const b = m.querySelector('.g-status-mark__badge').getBoundingClientRect(); const fl = firstLine(m.querySelector('.g-status-mark__text')); return { t: m.dataset.test, start: Math.abs(b.left - para.left), v: Math.abs((b.top + b.height / 2) - (fl.top + fl.height / 2)) } })
      return { links, texts }
    })
    ok(r.links.every((d) => d <= 1), `marca enlace: centrada con «Guardar» en la fila (Δ ${r.links.map((d) => d.toFixed(1))})`)
    ok(r.texts.every((t) => t.start <= 0.5 && t.v <= 1), `marca de texto: arranca con el texto de la sección y la insignia centrada con la 1.ª línea (${JSON.stringify(r.texts)})`)
    await context.close()
  }

  // ---------- 10 · Hoja móvil ----------
  for (const w of [375, 320]) {
    const { p, context } = await open({ vw: w, vh: 760 })
    await p.evaluate(() => window.bench.show('error')); await p.waitForTimeout(700)
    await p.evaluate(() => { window.__live.st.sheet = true }); await p.waitForTimeout(500)
    const r = await p.evaluate(() => {
      const root = document.querySelector('[data-test="live"]'); const sh = root.querySelector('.g-status-island__shape').getBoundingClientRect()
      const d = document.querySelector('.g-status-sheet'); const dr = d.getBoundingClientRect()
      const items = [...d.querySelectorAll('.g-status-item')].every((li) => { const x = li.getBoundingClientRect(); return x.left >= dr.left - 0.5 && x.right <= dr.right + 0.5 })
      return { mobile: root.hasAttribute('data-mobile'), open: d.open, sw: document.scrollingElement.scrollWidth, vw: innerWidth, sh: { l: sh.left, r: sh.right }, items, pe: getComputedStyle(d).pointerEvents, ink: getComputedStyle(d.querySelector('.g-status-item__title')).color === getComputedStyle(document.body).color }
    })
    ok(r.mobile && r.open && r.items && r.pe === 'auto' && r.ink, `${w}px: hoja inferior con la lista en la tinta de la página (${JSON.stringify(r)})`)
    ok(r.sw <= r.vw && r.sh.l >= 7.5 && r.sh.r <= r.vw - 7.5, `${w}px: sin desplazamiento horizontal y la isla dentro del margen`)
    await context.close()
  }

  ok(errs.length === 0, `consola limpia (${errs.slice(0, 5).join(' | ')})`)
  await browser.close()
}
server.close()
for (const i of info) console.log('·', i)
const byEng = {}
for (const d of total0.data) { const e = byEng[d.engine] ||= { t: 99, g: 99, e: 99, n: 0 }; e.t = Math.min(e.t, d.minT); e.g = Math.min(e.g, d.minG); e.e = Math.min(e.e, d.minE); e.n++ }
for (const [k, v] of Object.entries(byEng)) console.log(`· ${k}: mínimos en ${v.n} temas × esquemas · texto ${v.t}, gráficos ${v.g}, delimitación ${v.e}`)
for (const f of fails) console.log('FALLA', f)
console.log(`\n${Object.entries(per).map(([k, [a, b]]) => `${k} ${a}/${b}`).join(' · ')}\nTOTAL ${total - failed}/${total}`)
process.exit(failed ? 1 : 0)
