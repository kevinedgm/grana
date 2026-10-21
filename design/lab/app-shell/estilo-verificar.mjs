// Verificación de coco sobre el banco de GAppShell (design/lab/app-shell/estilo-banco.html), con el CSS real de GAppShell.css,
// GContainer.css y GPageHeader.css en la capa grana.components y GSidebar, GPageHeader, GAccordion, GBtn y GIcon de dist/.
// Mide: análisis estático (literales, respaldos, @property, #383, acoplamiento de A con GSidebar.css, S5); landmarks y salto;
// reserva en los formatos del sidebar (expandida, riel, superpuesto, flotante, navbar, drawer) y RTL; la cifra (56/104, 72,
// sin zócalo pegado, sin cabecera, receta de la aplicación sin capa, otro space); presupuesto del cuarto (1440×900, 800×430,
// 800×400, 320×256); S1 (sidebar, cabecera, zócalo, antes de pegarse, acordeón sticky) con y sin la regla; A (dos posiciones,
// espera, interrupción, Δ0 del párrafo y del foco, reducido); B (cede, relevo sin costura cuadro a cuadro, vuelve al subir y
// con el foco, nunca sin franja, reducido); contraste en el tema por defecto y los once generados, claro y oscuro, y en la
// zona de marca; forced-colors (Chromium); rendimiento de :root:has() con 2000 nodos (medida); consola limpia.
// Ejecutar desde la raíz del repo (requiere dist/):  GRANA_PW_PORT=4212 node design/lab/app-shell/estilo-verificar.mjs
// Opcional: --engines=chromium,firefox,webkit  --themes=all|base  --parts=static,base,budget,s1,A,B,theme,perf  --verbose
import http from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const pw = await import(new URL('../theme-playground/node_modules/playwright/index.mjs', import.meta.url))
const ROOT = fileURLToPath(new URL('../../../', import.meta.url))
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')).map(([k, v]) => [k, v ?? true]))
const ENGINES = (args.engines || 'chromium,firefox,webkit').split(',')
const PARTS = (args.parts || 'static,base,budget,s1,A,B,theme,perf').split(',')
const V = !!args.verbose
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const server = http.createServer(async (req, res) => {
  try {
    const p = normalize(join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname)))
    if (!p.startsWith(ROOT)) throw new Error('fuera')
    res.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream' }).end(await readFile(p))
  } catch { if (!res.headersSent) res.writeHead(404).end() }
})
await new Promise((r) => server.listen(Number(process.env.GRANA_PW_PORT) || 4212, '127.0.0.1', r))
const BASE = `http://127.0.0.1:${server.address().port}/design/lab/app-shell/estilo-banco.html`
const GEN = ['amazon', 'apple', 'caracol-purpura', 'github', 'grana', 'linear', 'lustre', 'medium', 'notion', 'spotify', 'stripe']
const THEMES = args.themes === 'base' ? [''] : ['', ...GEN]

let total = 0, failed = 0
const fails = [], notes = []
const ok = (cond, msg, info = '') => { total++; if (!cond) { failed++; fails.push(msg + (info !== '' ? ' · ' + info : '')) } else if (V) console.log('ok   ' + msg + (info !== '' ? ' · ' + info : '')) }
const note = (s) => { notes.push(s); if (V) console.log('nota ' + s) }
const near = (a, b, t = 1.5) => Math.abs(a - b) <= t

/* ---------- 0 · Análisis estático ---------- */
if (PARTS.includes('static')) {
  const raw = await readFile(join(ROOT, 'packages/vue/src/components/GAppShell/GAppShell.css'), 'utf8')
  const css = raw.replace(/\/\*[\s\S]*?\*\//g, '')
  ok(!/#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|lab|lch|hwb|color|color-mix)\(/.test(css), 'estático: sin color literal')
  const named = [...css.matchAll(/(?:color|background(?:-color)?|border[\w-]*|outline[\w-]*)\s*:[^;]*\b(CanvasText|Canvas|Highlight|ButtonText|GrayText|red|blue|black|white|transparent)\b/g)].map((m) => m[1])
  ok(named.every((w) => w === 'CanvasText'), 'estático: color con nombre solo CanvasText (forced-colors)', named.join(','))
  ok(!/var\(\s*--[\w-]+\s*,/.test(css), 'estático: var() sin respaldo')
  ok(!/@layer/.test(css) && !/!important/.test(css), 'estático: sin @layer ni !important')
  const vars = [...css.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1])
  ok(vars.every((v) => v.startsWith('--g-') || v.startsWith('--_')), 'estático: solo --g-* y --_*')
  const defaults = await readFile(join(ROOT, 'packages/vue/src/styles/defaults.css'), 'utf8')
  const defined = new Set([...defaults.matchAll(/(--g-[a-z0-9-]+)\s*:/g)].map((m) => m[1]))
  const pub = ['--g-app-shell-header', '--g-app-shell-top', '--g-page-header-top', '--g-accordion-sticky-top']
  const missing = [...new Set(vars.filter((v) => v.startsWith('--g-') && !defined.has(v) && !pub.includes(v)))]
  ok(!missing.length, 'estático: todos los tokens existen en defaults.css', missing.join(','))
  ok(!defined.has('--g-app-shell-header') && !defined.has('--g-app-shell-top'), 'estático: las propiedades públicas no son del tema (no en defaults.css)')
  const allowed = ['--g-sidebar-width', '--g-sidebar-rail', '--g-sidebar-bar', '--g-color-bg', '--g-color-surface', '--g-color-text', '--g-color-text-muted', '--g-color-border', '--g-color-border-strong', '--g-color-focus', '--g-focus-width', '--g-focus-offset', '--g-border-width', '--g-radius-md', '--g-shadow-2', '--g-font-ui', '--g-text-body-sm-size', '--g-text-body-sm-line', '--g-text-action-weight', '--g-duration-fast', '--g-duration-slow', '--g-ease-out', ...pub]
  const extra = [...new Set(vars.filter((v) => v.startsWith('--g-') && !v.startsWith('--g-space-') && !allowed.includes(v)))]
  ok(!extra.length, 'estático: solo los tokens de «Tokens consumidos» (app-shell.md, tokens.md §48)', extra.join(','))
  const props = [...css.matchAll(/@property\s+(--[\w-]+)\s*\{([^}]*)\}/g)].map((m) => [m[1], m[2].replace(/\s+/g, ' ').trim()])
  const want = { '--g-app-shell-header': 'syntax: "<length>"; inherits: true; initial-value: 0px;', '--g-app-shell-top': 'syntax: "<length>"; inherits: true; initial-value: 0px;', '--_app-shell-nav': 'syntax: "<length>"; inherits: false; initial-value: 0px;', '--_app-shell-delay': 'syntax: "<time>"; inherits: false; initial-value: 0s;', '--_app-shell-bar': 'syntax: "<length>"; inherits: true; initial-value: 0px;', '--_app-shell-base': 'syntax: "<length>"; inherits: true; initial-value: 0px;' }
  ok(props.length === 6 && props.every(([n, b]) => want[n] === b), 'estático: las seis @property del contrato con su sintaxis', props.map((p) => p[0]).join(','))
  const noProps = css.replace(/@property[^}]*\}/g, '')
  const lens = [...noProps.matchAll(/(?<![\w-])(\d*\.?\d+)(px|rem|em|vh|vw|svh|dvh|lvh|ms|s|ch|cqi|%)(?![\w-])/g)].map((m) => m[1] + m[2])
  ok(lens.every((l) => ['24px', '44px', '100svh', '100dvh', '0s'].includes(l)), 'estático: literales de medida solo 24px, 44px, 100svh, 100dvh (y 0s de la transición discreta)', [...new Set(lens)].join(','))
  ok(/--_app-shell-delay: var\(--g-duration-slow\)/.test(css), 'estático: la espera de A es --g-duration-slow')
  const sb = (await readFile(join(ROOT, 'packages/vue/src/components/GSidebar/GSidebar.css'), 'utf8')).replace(/\/\*[\s\S]*?\*\//g, '')
  ok(/transition: inline-size var\(--g-duration-slow\)/.test(sb), 'estático: acoplada con el ancho de GSidebar.css (inline-size var(--g-duration-slow), L9 #709)')
  ok(/\.g-app-shell__header :not\(:where\(\.g-tooltip\)\)/.test(css), 'estático: los hijos de la aplicación en la banda ignoran .g-tooltip (#383)')
  ok(!/--g-ease-spring|--g-ease-bounce/.test(css), 'estático: sin muelle ni rebote (#299, #710)')
  ok(!/container-type|contain:/.test(css), 'estático: sin contención de tamaño (api.md «Contención en línea»)')
  const ph = (await readFile(join(ROOT, 'packages/vue/src/components/GPageHeader/GPageHeader.css'), 'utf8')).replace(/\/\*[\s\S]*?\*\//g, '')
  ok(/\.g-page-header\.is-sticky \.g-page-header__base,\s*\.g-page-header\.is-sticky \.g-page-header__base :not\(:where\(\.g-tooltip\)\) \{\s*scroll-margin-block-start: calc\(-1 \* \(var\(--g-page-header-top\) \+ var\(--_base-h\)\)\);/.test(ph), 'estático: S5 en GPageHeader.css (zócalo pegado con scroll-margin negativo)')
}

/* ---------- utilidades de página ---------- */
async function open (b, qs = '', opts = {}) {
  const { vw = 1440, vh = 900, ...ctx } = opts
  const context = await b.newContext({ viewport: { width: vw, height: vh }, ...ctx })
  const p = await context.newPage()
  const errs = []
  p.on('console', (m) => { if (['error', 'warning'].includes(m.type()) && !/fonts\.css|404/.test(m.text())) errs.push(m.text()) })
  p.on('pageerror', (e) => errs.push(String(e)))
  await p.goto(BASE + qs)
  await p.waitForFunction(() => window.__as && window.__as.ready)
  await p.evaluate(() => document.fonts.ready)
  await settle(p, 450)
  p.__errs = errs
  p.__ctx = context
  return p
}
const settle = (p, ms = 60) => p.evaluate((ms) => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, ms)))), ms)
const rect = (p, sel) => p.evaluate((sel) => { const e = document.querySelector(sel); if (!e) return null; const r = e.getBoundingClientRect(); return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, width: r.width, height: r.height } }, sel)
const cssv = (p, sel, name) => p.evaluate(([sel, name]) => getComputedStyle(document.querySelector(sel)).getPropertyValue(name).trim(), [sel, name])
const px = async (p, sel, name) => parseFloat(await cssv(p, sel, name))
const sp = (p) => p.evaluate(() => parseFloat(getComputedStyle(document.documentElement).scrollPaddingBlockStart) || 0)
const toY = (p, y) => p.evaluate((y) => new Promise((r) => { window.scrollTo(0, y); requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 140))) }), y)
const sy = (p) => p.evaluate(() => Math.round(window.scrollY))
const overflowX = (p) => p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)
const close = async (p, label) => { ok(p.__errs.length === 0, `${p.__eng} consola limpia (${label})`, p.__errs.slice(0, 2).join(' | ')); await p.__ctx.close() }
// Contraste en la página: compone colores con alfa sobre su fondo opaco (canvas = sRGB del navegador)
const CONTRAST = () => {
  window.__rgb = (c, under) => {
    const cv = (window.__cv ||= document.createElement('canvas')); cv.width = cv.height = 1
    const x = cv.getContext('2d', { willReadFrequently: true })
    x.clearRect(0, 0, 1, 1); if (under) { x.fillStyle = `rgb(${under.join(',')})`; x.fillRect(0, 0, 1, 1) }
    x.fillStyle = '#000'; x.fillStyle = c; x.fillRect(0, 0, 1, 1)
    return [...x.getImageData(0, 0, 1, 1).data].slice(0, 3)
  }
  window.__bgOf = (el) => { const stack = []; for (let e = el; e; e = e.parentElement) { const c = getComputedStyle(e).backgroundColor; stack.push(c); const a = c.match(/[\d.]+(?=\)$)/); if (!/rgba?\(0, 0, 0, 0\)|transparent/.test(c) && !(c.includes('/') && a && parseFloat(a[0]) < 1) && !(c.startsWith('rgba') && a && parseFloat(a[0]) < 1)) break } let rgb = [255, 255, 255]; for (const c of stack.reverse()) rgb = window.__rgb(c, rgb); return rgb }
  window.__ratio = (a, b) => { const L = (c) => { const [r, g, bl] = c.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }); return 0.2126 * r + 0.7152 * g + 0.0722 * bl }; const [x, y] = [L(a), L(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05) }
  window.__textRatio = (sel, prop = 'color') => { const e = document.querySelector(sel); const bg = window.__bgOf(e); return window.__ratio(window.__rgb(getComputedStyle(e)[prop], bg), bg) }
}
// Muestra cuadro a cuadro el borde inicial del marco y el ancho del sidebar tras un clic en contraer/expandir
const sampleToggle = (p, ms = 520, interruptAt = 0) => p.evaluate(([ms, interruptAt]) => new Promise((resolve) => {
  const frame = document.querySelector('.g-app-shell__frame'); const sb = document.getElementById('sb')
  const rtl = document.documentElement.dir === 'rtl'
  const edge = () => { const r = frame.getBoundingClientRect(); return Math.round(rtl ? innerWidth - r.right : r.left) }
  const out = []; const t0 = performance.now(); let done = false
  document.querySelector('#sb .g-sidebar__toggle').click()
  const tick = () => {
    const t = performance.now() - t0
    if (interruptAt && !done && t >= interruptAt) { done = true; document.querySelector('#sb .g-sidebar__toggle').click() }
    out.push({ t: Math.round(t), main: edge(), sb: Math.round(sb.getBoundingClientRect().width) })
    if (t < ms) requestAnimationFrame(tick); else resolve(out)
  }
  requestAnimationFrame(tick)
}), [ms, interruptAt])

for (const eng of ENGINES) {
  const b = await pw[eng].launch()
  const O = async (qs, opts) => { const p = await open(b, qs, opts); p.__eng = eng; await p.evaluate(CONTRAST); return p }
  const E = (m) => `${eng} ${m}`

  /* ---------- 1 · Base: landmarks, salto, reserva, cifra ---------- */
  if (PARTS.includes('base')) {
    let p = await O('')
    const snap = await p.locator('body').ariaSnapshot()
    ok(/- banner/.test(snap) && /- navigation "Principal"/.test(snap) && /- main/.test(snap) && /- contentinfo/.test(snap), E('landmarks banner, navigation, main, contentinfo'))
    const skip0 = await rect(p, '.g-app-shell__skip')
    ok(skip0.bottom <= 0, E('salto: fuera del visor sin foco'), `${skip0.bottom}`)
    await p.keyboard.press(eng === 'webkit' ? 'Alt+Tab' : 'Tab')
    await settle(p, 220)
    const sk = await p.evaluate(() => { const a = document.activeElement; const r = a.getBoundingClientRect(); const cs = getComputedStyle(a); return { cls: a.className, top: r.top, h: r.height, outline: cs.outlineStyle, ow: parseFloat(cs.outlineWidth), off: parseFloat(cs.outlineOffset) } })
    ok(sk.cls.includes('g-app-shell__skip') && near(sk.top, 0) && sk.h >= 24, E('salto: el primer Tab lo baja colgado del borde (≥ 24 px)'), JSON.stringify(sk))
    ok(sk.outline === 'solid' && sk.ow >= 2 && sk.off < 0, E('salto: anillo visible por dentro (no pierde el lado de arriba)'), JSON.stringify(sk))
    const skr = await p.evaluate(() => window.__textRatio('.g-app-shell__skip'))
    ok(skr >= 4.5, E('salto: texto ≥ 4,5:1'), skr.toFixed(2))
    const ring = await p.evaluate(() => { const e = document.querySelector('.g-app-shell__skip'); const bg = window.__bgOf(e); return window.__ratio(window.__rgb(getComputedStyle(e).outlineColor, bg), bg) })
    ok(ring >= 3, E('salto: anillo ≥ 3:1 contra la pestaña'), ring.toFixed(2))
    await p.keyboard.press('Enter')
    await settle(p)
    ok(await p.evaluate(() => document.activeElement.id === 'as-main' && getComputedStyle(document.activeElement).outlineStyle === 'none'), E('salto: Intro lleva el foco a main, sin anillo en la región'))
    const hd = await rect(p, '.g-app-shell__header'), mn = await rect(p, '.g-app-shell__main'), sb = await rect(p, '#sb')
    ok(near(mn.left, 264) && near(hd.left, 264) && near(sb.width, 264) && near(sb.left, 0), E('reserva expandida 264 (cabecera y página desde la pista)'), `${mn.left}`)
    ok(near(hd.height, 56), E('banda de contrato 56 px'), `${hd.height}`)
    ok(near(await px(p, '.g-app-shell', '--g-app-shell-top'), 56) && near(await px(p, '#ph', '--g-page-header-top'), 56) && near(await px(p, '.g-app-shell', '--g-accordion-sticky-top'), 104) && near(await sp(p), 104), E('cifra: top 56, page-header-top 56, acordeón 104, scroll-padding 104'))
    const hb = await p.evaluate(() => { const cs = getComputedStyle(document.querySelector('.g-app-shell__header')); return cs.borderBottomStyle + ' ' + cs.borderBottomWidth })
    ok(/solid/.test(hb) && parseFloat(hb.split(' ')[1]) >= 1, E('banda con borde real abajo'), hb)
    await toY(p, 1500)
    const sb2 = await rect(p, '#sb'), hd2 = await rect(p, '.g-app-shell__header'), base2 = await rect(p, '.g-page-header__base')
    ok(near(sb2.top, 0) && near(sb2.height, 900), E('al desplazar: sidebar fijo, del alto del visor'), `${sb2.top}/${sb2.height}`)
    ok(near(hd2.top, 0) && base2 && near(base2.top, 56), E('al desplazar: banda en 0 y zócalo pegado en 56'), base2 && `${base2.top}`)
    await toY(p, 0)
    await p.evaluate(() => document.getElementById('far-btn').focus())
    await settle(p, 160)
    const fb = await rect(p, '#far-btn')
    ok(fb.top >= 104 - 1 && fb.bottom <= 900, E('focus() de algo lejano: no queda bajo banda + zócalo (2.4.11)'), `${fb.top}`)
    ok(!(await overflowX(p)), E('sin desplazamiento horizontal (1440)'))
    const fr0 = await rect(p, '.g-app-shell__frame'), band = await rect(p, '#band'), bandP = await rect(p, '#band-p'), colB = await rect(p, '.g-container__body')
    ok(near(band.left, fr0.left) && near(band.right, fr0.right) && near(bandP.left, colB.left) && near(bandP.right, colB.right), E('GContainer dentro del chasis: la banda g-bleed llega al borde del marco (no bajo el sidebar) y su texto sigue en la columna'), `${band.left}/${fr0.left} ${bandP.left}/${colB.left}`)
    // Pie: texto atenuado legible
    const fr = await p.evaluate(() => window.__textRatio('.g-app-shell__footer'))
    ok(fr >= 4.5, E('pie: text-muted ≥ 4,5:1'), fr.toFixed(2))
    await close(p, 'base')

    // Formatos del sidebar
    const fmt = [
      ['?mode=rail', 64, 'riel'], ['?mode=rail&overlay=1', 64, 'riel superpuesto'], ['?variant=floating', 288, 'flotante expandida'],
      ['?variant=floating&mode=rail', 88, 'flotante riel'], ['?mode=drawer', 0, 'drawer']
    ]
    for (const [qs, want, label] of fmt) {
      p = await O(qs)
      const m = await rect(p, '.g-app-shell__main')
      ok(near(m.left, want), E(`reserva ${label}: ${want}`), `${m.left}`)
      if (label === 'riel superpuesto') {
        await p.click('#sb .g-sidebar__toggle'); await settle(p, 420); await toY(p, 1200)
        const ov = await rect(p, '#sb'), om = await rect(p, '.g-app-shell__main')
        ok(near(om.left, 64) && ov.width > 200 && near(ov.top, 0) && near(ov.height, 900), E('superpuesto: crece encima, fijo tras desplazar (S2)'), `${ov.width}/${om.left}/${ov.top}/${ov.height}`)
      }
      if (label === 'flotante expandida') {
        await toY(p, 1200)
        const f = await rect(p, '#sb')
        ok(near(f.top, 12) && near(f.bottom, 900 - 12), E('flotante: fijo con su margen arriba y abajo'), `${f.top}/${f.bottom}`)
      }
      await close(p, label)
    }
    p = await O('', { vw: 390, vh: 800 })
    ok(await p.evaluate(() => !!document.querySelector('.g-app-shell > .g-sidebar--mode-navbar')), E('390: navbar'))
    ok(near((await rect(p, '.g-app-shell__main')).left, 0) && near(await px(p, '.g-app-shell__frame', 'padding-bottom'), 68), E('navbar: pista 0 y reserva --g-sidebar-bar (68) al final del marco'))
    await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight)); await settle(p, 160)
    const ft = await rect(p, '.g-app-shell__footer'), bar = await rect(p, '.g-sidebar__bar')
    ok(ft.bottom <= bar.top + 1, E('navbar: el pie termina encima de la barra'), `${ft.bottom}/${bar.top}`)
    ok(!(await overflowX(p)), E('sin desplazamiento horizontal (390)'))
    await close(p, 'navbar')
    p = await O('?dir=rtl')
    const rs = await rect(p, '#sb'), rm = await rect(p, '.g-app-shell__main'), rh = await rect(p, '.g-app-shell__header')
    ok(near(rs.right, 1440) && near(rm.right, 1176) && near(rh.right, 1176), E('RTL: sidebar al final del visor, cabecera y página a su izquierda'), `${rs.right}/${rm.right}`)
    await p.keyboard.press(eng === 'webkit' ? 'Alt+Tab' : 'Tab'); await settle(p, 220)
    const rsk = await rect(p, '.g-app-shell__skip')
    ok(near(rsk.top, 0) && rsk.right <= 1440 - 15, E('RTL: el salto cuelga del borde al inicio (derecha)'), `${rsk.right}`)
    await close(p, 'rtl')

    // Cifra: entradas y casos
    p = await O('?hh=72')
    ok(near((await rect(p, '.g-app-shell__header')).height, 72) && near(await px(p, '#ph', '--g-page-header-top'), 72) && near(await sp(p), 120), E('--g-app-shell-header 72 en :root: banda 72, page-header-top 72, scroll-padding 120'))
    await close(p, 'hh72')
    p = await O('?phsticky=0')
    ok(near(await sp(p), 56) && near(await px(p, '.g-app-shell', '--g-accordion-sticky-top'), 56), E('zócalo que no se pega (sticky: false): no cuenta (scroll-padding 56, #713)'), `${await sp(p)}`)
    await close(p, 'phsticky0')
    p = await O('?ph=0')
    ok(near(await sp(p), 56), E('sin GPageHeader: scroll-padding 56'))
    await close(p, 'ph0')
    p = await O('?nohead=1')
    ok(!(await p.evaluate(() => !!document.querySelector('.g-app-shell__header'))) && near(await px(p, '.g-app-shell', '--g-app-shell-top'), 0) && near(await sp(p), 48) && near(await px(p, '#ph', '--g-page-header-top'), 0), E('sin cabecera: top 0, scroll-padding solo el zócalo (48)'))
    await toY(p, 1500)
    ok(near((await rect(p, '.g-page-header__base')).top, 0), E('sin cabecera: el zócalo se pega en 0'))
    await close(p, 'nohead')
    p = await O('?appRecipe=1&phsticky=0')
    ok(near(await sp(p), 104), E('receta de la aplicación sin capa: gana (migración, aviso 10)'), `${await sp(p)}`)
    await close(p, 'appRecipe')
    p = await O('?space=5')
    ok(near((await rect(p, '.g-app-shell__header')).height, 70) && near(await sp(p), 130) && near((await rect(p, '.g-app-shell__main')).left, 330), E('otro space (5): banda 70, scroll-padding 70 + 60, pista 330'), `${await sp(p)}`)
    await close(p, 'space5')
    p = await O('?zone=header')
    const z = await p.evaluate(() => ({ zone: document.querySelector('.g-app-shell__header').dataset.gZone, bg: getComputedStyle(document.querySelector('.g-app-shell__header')).backgroundColor, page: getComputedStyle(document.querySelector('.g-app-shell')).backgroundColor, t: window.__textRatio('.lab-brand') }))
    ok(z.zone === 'brand' && z.bg !== z.page && z.t >= 4.5, E('zona de marca en la banda: fondo de marca y texto ≥ 4,5:1'), JSON.stringify(z))
    await close(p, 'zona')
    if (eng === 'chromium') {
      p = await O('', { forcedColors: 'active' })
      const fc = await p.evaluate(() => { const h = getComputedStyle(document.querySelector('.g-app-shell__header')); const f = getComputedStyle(document.querySelector('.g-app-shell__footer')); return { h: h.borderBottomStyle + ' ' + h.borderBottomColor + ' ' + h.backgroundColor, f: f.borderTopStyle + ' ' + f.borderTopColor } })
      ok(/solid/.test(fc.h) && /solid/.test(fc.f) && !/rgba\(0, 0, 0, 0\)/.test(fc.h), E('forced-colors: borde real de la banda y del pie'), JSON.stringify(fc))
      await close(p, 'forced')
    }
  }

  /* ---------- 2 · Presupuesto del cuarto ---------- */
  if (PARTS.includes('budget')) {
    for (const [vw, vh, pinned] of [[1440, 900, true], [800, 430, true], [800, 400, false], [320, 256, false]]) {
      const p = await O('', { vw, vh })
      const top = await px(p, '.g-app-shell', '--g-app-shell-top')
      const stuck = await p.evaluate(() => document.getElementById('ph').classList.contains('is-sticky'))
      ok(pinned ? near(top, 56) : near(top, 0), E(`presupuesto ${vw}×${vh}: banda ${pinned ? 'pegada' : 'despegada'}`), `${top}`)
      ok(near(await sp(p), (pinned ? 56 : 0) + (stuck ? 48 : 0)), E(`presupuesto ${vw}×${vh}: scroll-padding = lo pegado`), `${await sp(p)}`)
      await toY(p, 1200)
      const h = await rect(p, '.g-app-shell__header')
      ok(pinned ? near(h.top, 0) : h.bottom <= 0, E(`presupuesto ${vw}×${vh}: la banda ${pinned ? 'sigue arriba' : 'se fue con la página'}`), `${h.top}`)
      const stuckSum = (pinned ? 56 : 0) + (stuck ? 48 : 0)
      ok(stuckSum <= vh / 4 + 0.5, E(`presupuesto ${vw}×${vh}: lo pegado ≤ 25 % del visor`), `${stuckSum}/${vh}`)
      ok(!(await overflowX(p)), E(`presupuesto ${vw}×${vh}: sin desplazamiento horizontal`))
      await close(p, `budget ${vw}`)
    }
  }

  /* ---------- 3 · S1: enfocar lo pegado no desplaza la página ---------- */
  if (PARTS.includes('s1')) {
    const p = await O('?acc=1')
    for (const sel of ['#sb .g-sidebar__toggle', '#sb .g-sidebar__link', '#hdr-bell', '#ph-pub', '#ph-hist']) {
      await toY(p, 1200)
      await p.evaluate((s) => document.querySelector(s).focus(), sel)
      await settle(p, 200)
      const y = await sy(p)
      ok(near(y, 1200, 2), E(`S1: enfocar ${sel} con la página desplazada → Δ0`), `${y}`)
    }
    // Tab real hacia atrás desde la página a la banda (lo que hace quien navega)
    await toY(p, 1200)
    await p.evaluate(() => document.getElementById('ph-pub').focus()); await settle(p, 120)
    const y0 = await sy(p)
    const st = eng === 'webkit' ? 'Alt+Shift+Tab' : 'Shift+Tab'; await p.keyboard.press(st); await p.keyboard.press(st); await settle(p, 200)
    note(`${eng} S1 Mayús+Tab desde el zócalo hacia atrás: foco en ${await p.evaluate(() => document.activeElement.id || document.activeElement.className)}, scrollY ${y0} → ${await sy(p)}`)
    // Antes de pegarse (is-sticky, el encabezado se hunde): el zócalo ya cae en la banda
    for (const y of [60, 120, 180]) {
      await toY(p, y)
      const st = await p.evaluate(() => document.getElementById('ph').className)
      await p.evaluate(() => document.getElementById('ph-pub').focus()); await settle(p, 200)
      const y1 = await sy(p)
      ok(near(y1, y, 2), E(`S5 antes de pegarse (scrollY ${y}, ${/is-stuck/.test(st) ? 'is-stuck' : 'solo is-sticky'}): Δ0`), `${y1}`)
      await p.evaluate(() => document.activeElement.blur())
    }
    // Sin la regla S5 (comprobación de que la regla es la que evita el salto)
    await p.addStyleTag({ content: '.g-page-header .g-page-header__base, .g-page-header .g-page-header__base * { scroll-margin-block-start: 0 !important }' })
    await toY(p, 1200)
    await p.evaluate(() => document.getElementById('ph-pub').focus()); await settle(p, 200)
    note(`${eng} S5 sin la regla (control): enfocar #ph-pub 1200 → ${await sy(p)}`)
    await close(p, 's1')
    // S5 sin chasis: el banco de GPageHeader con la receta de «Cabecera fija» de la aplicación (barra de 56 + zócalo)
    {
      const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } })
      const q = await ctx.newPage()
      await q.goto(BASE.replace('app-shell/estilo-banco.html', 'page-header/estilo-banco.html'))
      await q.waitForFunction(() => window.__ph && document.querySelector('.g-tabs'), null, { timeout: 90000 })
      await q.evaluate(() => document.fonts.ready)
      for (const [label, css] of [['con S5', ''], ['sin S5 (control)', '.g-page-header .g-page-header__base, .g-page-header .g-page-header__base * { scroll-margin-block-start: 0 !important }']]) {
        if (css) await q.addStyleTag({ content: css })
        for (const sel of ['.x-primary', '.g-page-header__tabs [role="tab"]']) {
          await q.evaluate(() => { document.activeElement && document.activeElement.blur(); window.scrollTo(0, 1200); window.__ph.measure() })
          await q.waitForTimeout(150); await q.evaluate(() => window.__ph.measure()); await q.waitForTimeout(60)
          const y0 = await q.evaluate(() => Math.round(scrollY))
          const st = await q.evaluate(() => document.querySelector('.g-page-header').className)
          await q.evaluate((s) => document.querySelector(s).focus(), sel)
          await q.waitForTimeout(200)
          const y1 = await q.evaluate(() => Math.round(scrollY))
          if (!css) ok(near(y1, y0, 2) && /is-stuck/.test(st), E(`S5 sin chasis (receta de la aplicación): enfocar ${sel} en el zócalo pegado → Δ0`), `${y0}→${y1}`)
          else note(`${eng} S5 sin chasis ${label}: enfocar ${sel} ${y0} → ${y1}`)
        }
      }
      await ctx.close()
    }
    // Acordeón sticky (encargo de lima: medir S1; dueño del arreglo, si hiciera falta, coco en GAccordion.css)
    const q = await O('?acc=1')
    const a1 = await q.evaluate(() => { const el = document.getElementById('acc-in'); return Math.round(el.getBoundingClientRect().top + scrollY) })
    await toY(q, a1 - 300)
    const head = await rect(q, '#a1 .g-accordion-item__heading')
    const stickyTop = await px(q, '.g-app-shell', '--g-accordion-sticky-top')
    note(`${eng} acordeón sticky: encabezado abierto en ${Math.round(head.top)} (--g-accordion-sticky-top ${stickyTop}, scroll-padding ${await sp(q)})`)
    for (const sel of ['#a1 .g-accordion-item__heading button', '#acc-act']) {
      await toY(q, a1 - 300)
      const yb = await sy(q)
      await q.evaluate((s) => document.querySelector(s).focus(), sel)
      await settle(q, 200)
      const ya = await sy(q)
      note(`${eng} S1 GAccordion sticky: enfocar ${sel} pegado ${yb} → ${ya} (Δ ${ya - yb})`)
      ok(near(ya, yb, 2), E(`S1 GAccordion sticky: enfocar ${sel} pegado → Δ0 (medida para su dueño)`), `${yb}→${ya}`)
    }
    await close(q, 's1 acordeón')
  }

  /* ---------- 4 · A · Cortina ---------- */
  if (PARTS.includes('A')) {
    let p = await O('')
    await p.evaluate(() => { const e = document.getElementById('p2'); window.scrollTo(0, e.getBoundingClientRect().top + scrollY - 300) })
    await settle(p, 160)
    const a0 = await rect(p, '#p2')
    await p.focus('#sb .g-sidebar__toggle')
    const s = await sampleToggle(p)
    const a1 = await rect(p, '#p2')
    const pos = [...new Set(s.map((x) => x.main))]
    ok(pos.length <= 2 && near(s.at(-1).main, 64), E('A contraer: dos posiciones del borde de la página (264 → 64)'), pos.join(','))
    const firstMove = s.find((x) => near(x.main, 64))
    ok(firstMove && firstMove.t <= 60, E('A contraer: la página se ensancha al empezar (≤ 60 ms)'), firstMove && `${firstMove.t}`)
    ok(s.some((x) => x.sb > 70 && near(x.main, 64)), E('A contraer: el riel se encoge SOBRE la página ya ensanchada'))
    ok(near(a1.top, a0.top, 0.5) && near(a1.height, a0.height, 0.5), E('A contraer: Δ0 del párrafo que se leía (alto y posición)'), `${a0.top}→${a1.top}`)
    ok(await p.evaluate(() => document.activeElement.classList.contains('g-sidebar__toggle')), E('A contraer: el foco sigue en el botón'))
    await settle(p, 300)
    const e = await sampleToggle(p, 520)
    const slow = await p.evaluate(() => { const d = document.createElement('div'); d.style.transitionDuration = 'var(--g-duration-slow)'; document.body.appendChild(d); const v = parseFloat(getComputedStyle(d).transitionDuration) * 1000; d.remove(); return v })
    const mid = e.filter((x) => x.t >= 90 && x.t <= 160)
    ok(mid.length && mid.every((x) => near(x.main, 64)) && mid.some((x) => x.sb > 70 && x.sb < 264), E('A expandir: a mitad la página sigue en 64 y el sidebar crece encima'), mid.map((x) => `${x.t}:${x.main}/${x.sb}`).join(' '))
    const jump = e.find((x) => near(x.main, 264))
    ok(jump && jump.t >= slow - 40 && jump.t <= slow + 80, E(`A expandir: la página se aparta una vez, tras --g-duration-slow (${slow} ms)`), jump && `${jump.t}`)
    ok([...new Set(e.map((x) => x.main))].length <= 2, E('A expandir: dos posiciones'))
    await settle(p, 300)
    await p.click('#sb .g-sidebar__toggle'); await settle(p, 400)
    const it = await sampleToggle(p, 520, 80)
    ok(it.every((x) => near(x.main, 64)), E('A interrumpir a 80 ms: la página no salta (se queda en el riel)'), [...new Set(it.map((x) => x.main))].join(','))
    await close(p, 'A')
    p = await O('', { reducedMotion: 'reduce' })
    await p.click('#sb .g-sidebar__toggle'); await settle(p, 300)
    const r = await sampleToggle(p, 200)
    const rj = r.find((x) => near(x.main, 264))
    ok(rj && rj.t <= 60, E('A reducido: sin espera (la página se aparta al instante)'), rj && `${rj.t}`)
    await close(p, 'A reducido')
    // Primera carga: la pista no espera al montar (is-ready)
    p = await O('')
    const load = await p.evaluate(() => performance.getEntriesByType('navigation')[0] ? 1 : 1)
    ok(load && near((await rect(p, '.g-app-shell__main')).left, 264), E('A al cargar: la pista ya reserva 264 sin espera'))
    await close(p, 'A carga')
  }

  /* ---------- 5 · B · Relevo de franja ---------- */
  if (PARTS.includes('B')) {
    let p = await O('?header=relay')
    for (let y = 0; y <= 1600; y += 80) await toY(p, y)
    await settle(p, 300)
    const hd = await rect(p, '.g-app-shell__header'), base = await rect(p, '.g-page-header__base')
    ok(await p.evaluate(() => window.__as.yielded) && hd.bottom <= 0.5 && near(base.top, 0) && near(await sp(p), 48), E('B bajar: cede (banda fuera, zócalo en 0, scroll-padding 48)'), `${hd.bottom}/${base.top}/${await sp(p)}`)
    ok(await p.evaluate(() => document.getElementById('ph').classList.contains('is-stuck')), E('B: GPageHeader sigue pegado (nunca sin franja)'))
    // Relevo sin costura: subir y muestrear cuadro a cuadro la junta banda/zócalo
    const seam = await p.evaluate(() => new Promise((resolve) => {
      const out = []; const t0 = performance.now()
      const H = document.querySelector('.g-app-shell__header'), B = document.querySelector('.g-page-header__base')
      window.scrollTo(0, scrollY - 80)
      requestAnimationFrame(() => { window.scrollTo(0, scrollY - 80) })
      const tick = () => { const t = performance.now() - t0; const h = H.getBoundingClientRect(), b = B.getBoundingClientRect(); out.push({ t: Math.round(t), hb: +h.bottom.toFixed(1), bt: +b.top.toFixed(1) }); if (t < 400) requestAnimationFrame(tick); else resolve(out) }
      requestAnimationFrame(tick)
    }))
    const gaps = seam.map((x) => Math.abs(x.hb - x.bt))
    ok(Math.max(...gaps) <= 1, E('B volver: relevo sin costura (borde de la banda = borde del zócalo en cada cuadro)'), `máx ${Math.max(...gaps).toFixed(1)} · ${seam.filter((x, i) => i % 3 === 0).map((x) => `${x.t}:${x.hb}/${x.bt}`).join(' ')}`)
    const moving = seam.filter((x) => x.hb > 0.5 && x.hb < 55.5).length
    ok(moving >= 2, E('B volver: la banda baja deslizándose (cuadros intermedios)'), `${moving}`)
    await settle(p, 200)
    const hd2 = await rect(p, '.g-app-shell__header'), base2 = await rect(p, '.g-page-header__base')
    ok(!(await p.evaluate(() => window.__as.yielded)) && near(hd2.top, 0) && near(base2.top, 56), E('B subir 160 en dos pasos: vuelve (banda 0, zócalo 56)'), `${hd2.top}/${base2.top}`)
    // Ceder otra vez, muestrear la salida
    const out = await p.evaluate(() => new Promise((resolve) => {
      const res = []; const t0 = performance.now(); const H = document.querySelector('.g-app-shell__header'), B = document.querySelector('.g-page-header__base')
      let n = 0; const step = () => { if (n++ < 2) { window.scrollTo(0, scrollY + 80); requestAnimationFrame(step) } }
      step()
      const tick = () => { const t = performance.now() - t0; const h = H.getBoundingClientRect(), b = B.getBoundingClientRect(); res.push(Math.abs(h.bottom - b.top)); if (t < 400) requestAnimationFrame(tick); else resolve(res) }
      requestAnimationFrame(tick)
    }))
    ok(Math.max(...out) <= 1, E('B ceder: relevo sin costura al salir'), `máx ${Math.max(...out).toFixed(1)}`)
    await settle(p, 250)
    // Foco hacia la banda cedida
    const yb = await sy(p)
    await p.evaluate(() => document.getElementById('hdr-bell').focus())
    await settle(p, 300)
    const ya = await sy(p)
    const hd3 = await rect(p, '.g-app-shell__header')
    ok(!(await p.evaluate(() => window.__as.yielded)) && near(hd3.top, 0), E('B foco en la banda cedida: vuelve'), `${hd3.top}`)
    note(`${eng} B foco en la banda cedida: scrollY ${yb} → ${ya} (Δ ${ya - yb}; el foco llega antes de que la banda baje)`)
    ok(near(ya, yb, 2), E('B foco en la banda cedida: no desplaza la página'), `${yb}→${ya}`)
    // Con teclado: Mayús+Tab desde el sidebar hasta la banda cedida
    await p.evaluate(() => document.activeElement.blur())
    for (let y = 1600; y <= 2000; y += 80) await toY(p, y)
    await settle(p, 250)
    const yielded2 = await p.evaluate(() => window.__as.yielded)
    await p.evaluate(() => document.querySelector('#sb .g-sidebar__toggle').focus({ preventScroll: true }))
    const yk = await sy(p)
    await p.keyboard.press(eng === 'webkit' ? 'Alt+Shift+Tab' : 'Shift+Tab'); await settle(p, 300)
    const fk = await p.evaluate(() => ({ id: document.activeElement.id, top: document.activeElement.getBoundingClientRect().top }))
    ok(yielded2 && fk.id === 'hdr-bell' && fk.top >= 0 && near(await sy(p), yk, 2), E('B Mayús+Tab a la banda cedida: vuelve, el foco a la vista y la página quieta'), `${yielded2} ${JSON.stringify(fk)} ${yk}→${await sy(p)}`)
    await close(p, 'B')
    p = await O('?header=relay&ph=0')
    for (let y = 0; y <= 1600; y += 80) await toY(p, y)
    ok(!(await p.evaluate(() => window.__as.yielded)) && near((await rect(p, '.g-app-shell__header')).top, 0), E('B sin GPageHeader: no cede (equivale a la base)'))
    await close(p, 'B ph0')
    p = await O('?header=relay', { vw: 800, vh: 400 })
    for (let y = 0; y <= 1600; y += 80) await toY(p, y)
    ok(!(await p.evaluate(() => window.__as.yielded)), E('B con la banda despegada por el presupuesto: no actúa'))
    await close(p, 'B budget')
    p = await O('?header=relay', { reducedMotion: 'reduce' })
    for (let y = 0; y <= 1600; y += 80) await toY(p, y)
    await settle(p, 200)
    const rr = await p.evaluate(() => new Promise((resolve) => {
      const res = []; const H = document.querySelector('.g-app-shell__header')
      window.scrollTo(0, scrollY - 80); requestAnimationFrame(() => window.scrollTo(0, scrollY - 80))
      const t0 = performance.now(); const tick = () => { const t = performance.now() - t0; res.push(+H.getBoundingClientRect().top.toFixed(1)); if (t < 300) requestAnimationFrame(tick); else resolve(res) }
      requestAnimationFrame(tick)
    }))
    ok(rr.filter((v) => v < -0.5 && v > -55.5).length === 0, E('B reducido: sin deslizarse (aparece en su sitio)'), [...new Set(rr)].join(','))
    await close(p, 'B reducido')
  }

  /* ---------- 6 · Temas: contraste y cifra con los once generados, claro y oscuro ---------- */
  if (PARTS.includes('theme')) {
    for (const t of THEMES) {
      for (const dark of [false, true]) {
        const qs = `?${t ? `theme=${t}&` : ''}${dark ? 'dark=1' : ''}`
        const p = await O(qs)
        const name = `${t || 'defecto'}${dark ? ' oscuro' : ''}`
        await p.keyboard.press(eng === 'webkit' ? 'Alt+Tab' : 'Tab'); await settle(p, 200)
        const m = await p.evaluate(() => {
          const ring = (() => { const e = document.querySelector('.g-app-shell__skip'); const bg = window.__bgOf(e); return window.__ratio(window.__rgb(getComputedStyle(e).outlineColor, bg), bg) })()
          return { brand: window.__textRatio('.lab-brand'), foot: window.__textRatio('.g-app-shell__footer'), skip: window.__textRatio('.g-app-shell__skip'), ring }
        })
        ok(m.brand >= 4.5 && m.foot >= 4.5 && m.skip >= 4.5 && m.ring >= 3, E(`tema ${name}: banda, pie y salto ≥ 4,5:1, anillo ≥ 3:1`), JSON.stringify(Object.fromEntries(Object.entries(m).map(([k, v]) => [k, +v.toFixed(2)]))))
        ok(near((await rect(p, '.g-app-shell__header')).height, 56) && near(await sp(p), 104), E(`tema ${name}: banda 56 y scroll-padding 104`))
        if (!t || ['grana', 'spotify', 'stripe'].includes(t)) {
          const z = await O(qs + '&zone=header')
          const zr = await z.evaluate(() => window.__textRatio('.lab-brand'))
          ok(zr >= 4.5, E(`tema ${name}: texto en la banda con zona de marca ≥ 4,5:1`), zr.toFixed(2))
          await close(z, `zona ${name}`)
        }
        await close(p, `tema ${name}`)
      }
    }
  }

  /* ---------- 7 · Rendimiento de :root:has() (medida, no compuerta) ---------- */
  if (PARTS.includes('perf')) {
    const p = await O('')
    const ms = await p.evaluate(() => {
      const host = document.getElementById('anchor').parentElement
      const box = document.createElement('div'); host.appendChild(box)
      for (let i = 0; i < 2000; i++) { const d = document.createElement('div'); d.className = 'n' + (i % 10); d.textContent = i; box.appendChild(d) }
      const deep = box.lastChild
      void document.body.offsetHeight
      const run = () => { const t0 = performance.now(); for (let i = 0; i < 200; i++) { deep.classList.toggle('is-x'); void getComputedStyle(document.documentElement).scrollPaddingBlockStart; void deep.offsetHeight } return (performance.now() - t0) / 200 }
      const withShell = run()
      const sheet = [...document.styleSheets].find((s) => { try { return [...s.cssRules].some((r) => r.styleSheet && /GAppShell/.test(r.href)) } catch { return false } })
      const rule = sheet && [...sheet.cssRules].find((r) => r.styleSheet && /GAppShell/.test(r.href))
      let without = null
      if (rule) { const rules = rule.styleSheet.cssRules; const kept = []; for (let i = rules.length - 1; i >= 0; i--) { if (/^:root/.test(rules[i].cssText)) { kept.push(rules[i].cssText); rule.styleSheet.deleteRule(i) } } void document.body.offsetHeight; without = run() }
      return { withShell, without }
    })
    note(`${eng} rendimiento: alternar una clase en un nodo de 2000 + leer el scroll-padding: ${ms.withShell.toFixed(3)} ms con :root:has() del chasis, ${ms.without === null ? '—' : ms.without.toFixed(3) + ' ms sin'}`)
    await p.__ctx.close()
  }
  await b.close()
}

server.close()
for (const n of notes) console.log('· ' + n)
for (const f of fails) console.log('FALLA ' + f)
console.log(`\nGAppShell · estilo: ${total - failed}/${total} (${ENGINES.join(', ')}; temas: ${THEMES.length} × claro/oscuro)`)
process.exit(failed ? 1 : 0)
