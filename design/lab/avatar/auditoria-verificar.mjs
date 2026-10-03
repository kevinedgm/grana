// Auditoría de coco (paso 5) sobre el COMPONENTE REAL de GAvatar: el playground (packages/vue/playground, #sec-gavatar y
// los huecos reales de GSidebar, GBadge, GCard, GTable, GMenu y GSelect) con dist/ (grana.umd.js + grana.css).
// Donde el playground no muestra un caso (las 12 categorías, una escritura concreta, una tarjeta cargando con avatar, una
// tabla gemela con leading de texto), se monta el componente real del UMD (window.Grana) dentro de la misma página.
// Temas: por defecto claro/oscuro con el `app-categories` del playground (categories: 8); `tema-cat12.css` y
// `tema-marca-cat8.css` de kiwi (salida de `grana theme`, marca distinta); el tema alterno del playground («themed»).
// Mide: dist/grana.css sin literales ni respaldos (g-avatar y las seis hojas tocadas, dentro de grana.components); marcado
// real (hijos directos, <img> última, un estado a la vez); lado = space × n (space 4 y 5); ajuste de iniciales por tamaño
// y escritura; contraste (≥ 4.5 texto, ≥ 3 icono) en neutro y todas las categorías, claro y oscuro; imagen cargando →
// cargada → fallida, 3:1 y cambio de src sin salto (por fotograma); fundido cruzado y asentamiento con intermedios, morfo
// de forma, `reduce` instantáneo; remontaje (¿se repite el fundido?); GCard lead una sola forma y esqueleto intacto; GTable
// sin cambio de alto de fila; GMenu huecos a space × 5 con etiquetas alineadas y el menú solo de iconos intacto; GSelect
// centrado sin cambiar el alto; GSidebar `user`; GBadge a 45° en LTR/RTL y en la esquina en square; forced-colors
// (Chromium); zoom 200 % aproximado; 320px; consola limpia.
// Ejecutar desde la raíz del repo (tras `npm run build`): node design/lab/avatar/auditoria-verificar.mjs
// Opcional: --engines=chromium,firefox,webkit (por defecto los tres)   --verbose
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
await new Promise((r) => server.listen(0, '127.0.0.1', r))
const ORIGIN = `http://127.0.0.1:${server.address().port}`
const PAGE = `${ORIGIN}/packages/vue/playground/index.html`

const UNITS = { xs: 5, sm: 6, md: 8, lg: 10, xl: 16 }
const SIZES = Object.keys(UNITS)
let total = 0, failed = 0
const fails = [], info = [], notes = []
let ENGINE = 'static'
const ok = (cond, msg) => { total++; if (!cond) { failed++; fails.push(`[${ENGINE}] ${msg}`) } if (args.verbose) console.log(cond ? 'ok ' : 'NO ', ENGINE, msg) }
// Hallazgos abiertos de otro dueño (auditoria.md): se informan como ABIERTO / CERRADO y no cuentan en el total
const open_ = new Map()
const known = (id, cond, msg) => { const k = `${id} · ${msg}`; open_.set(k, (open_.get(k) ?? true) && cond) }
const near = (a, b, t = 0.51) => Math.abs(a - b) <= t
const THEMES = {
  cat12: await readFile(join(ROOT, 'design/lab/avatar/r01/tema-cat12.css'), 'utf8'),
  marca8: await readFile(join(ROOT, 'design/lab/avatar/r01/tema-marca-cat8.css'), 'utf8')
}

/* ---------- 0 · dist/grana.css: reglas del avatar sin literales ni respaldos, dentro de grana.components ---------- */
{
  const css = await readFile(join(ROOT, 'packages/vue/dist/grana.css'), 'utf8')
  const defaults = await readFile(join(ROOT, 'packages/vue/src/styles/defaults.css'), 'utf8')
  const defined = new Set([...defaults.matchAll(/(--g-[a-z0-9-]+)\s*:/g)].map((m) => m[1]))
  const CAT_OK = /^--g-color-(?:on-)?cat-(?:[1-9]|1[0-2])-soft$/
  // Recorre el árbol de reglas con la pila de at-rules
  const rules = []
  {
    const stack = []
    let i = 0, buf = ''
    while (i < css.length) {
      const ch = css[i]
      if (ch === '/' && css[i + 1] === '*') { const e = css.indexOf('*/', i + 2); i = e < 0 ? css.length : e + 2; continue }
      if (ch === '{') {
        const sel = buf.trim(); buf = ''
        if (sel.startsWith('@')) { stack.push(sel); i++; continue }
        const e = css.indexOf('}', i)
        rules.push({ sel, body: css.slice(i + 1, e), at: [...stack] })
        i = e + 1; continue
      }
      if (ch === '}') { stack.pop(); buf = ''; i++; continue }
      if (ch === ';' && buf.trim().startsWith('@')) { buf = ''; i++; continue }
      buf += ch; i++
    }
  }
  const mine = rules.filter((r) => /\.g-avatar(?!-motion)/.test(r.sel))
  const own = mine.filter((r) => /^[^,]*\.g-avatar(?:[^\w-]|$)|^\.g-avatar/.test(r.sel) || r.sel.split(',').every((s) => /\.g-avatar/.test(s)))
  ok(mine.length >= 40, `dist: reglas del avatar presentes (${mine.length})`)
  const hosts = { GCard: /g-card/, GTable: /g-table/, GMenu: /g-menu/, GSelect: /g-select/, GBadge: /g-badge/ }
  for (const [n, re] of Object.entries(hosts)) ok(mine.some((r) => re.test(r.sel)), `dist: hay reglas del avatar en ${n}`)
  ok(mine.every((r) => r.at.some((a) => /^@layer grana\.components/.test(a))), `dist: todas dentro de @layer grana.components (${mine.filter((r) => !r.at.some((a) => /grana\.components/.test(a))).map((r) => r.sel).slice(0, 3)})`)
  const all = mine.map((r) => r.body).join(';')
  ok(!/#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|lab|lch|color)\(/.test(all), 'dist: sin color literal')
  ok(!/var\(\s*--[\w-]+\s*,/.test(all), 'dist: sin var() con respaldo')
  ok(!/!important/.test(all), 'dist: sin !important')
  const vars = [...all.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1])
  ok(vars.every((v) => v.startsWith('--g-') || v.startsWith('--_')), 'dist: solo var(--g-*) y var(--_*)')
  const missing = [...new Set(vars.filter((v) => v.startsWith('--g-') && !defined.has(v) && !CAT_OK.test(v)))]
  ok(!missing.length, `dist: tokens inexistentes ${missing}`)
  const badPx = [...all.matchAll(/(-?\d*\.?\d+)(px|ms|s|rem|em|deg|vw|vh)\b/g)].map((m) => m[0]).filter((p) => !['24px', '44px', '0px', '1em'].includes(p))
  ok(!badPx.length, `dist: medidas o duraciones literales ${badPx}`)
  ok(!/--g-radius-shape/.test(all), 'dist: el avatar no lee --g-radius-shape')
  // esbuild baja `inset: 0` a top/right/bottom/left: 0 (simétrico, no depende de la dirección); cualquier otro físico falla
  ok(!/(?:^|[;{\s])(?:left|right|top|bottom)\s*:(?!0(?:;|$))|(?:margin|padding|border)-(?:left|right|top|bottom)\b/.test(all), 'dist: solo propiedades lógicas (o inset 0 bajado por esbuild)')
  const colorKw = [...all.matchAll(/(?<![\w-])(CanvasText|Canvas|ButtonText|Highlight|GrayText|transparent|currentColor|black|white)(?![\w-])/g)].map((m) => m[1])
  ok(colorKw.every((k) => k === 'CanvasText'), `dist: palabras de color solo CanvasText (forced-colors): ${[...new Set(colorKw)]}`)
  ok(mine.filter((r) => /CanvasText/.test(r.body)).every((r) => r.at.some((a) => /forced-colors/.test(a))), 'dist: CanvasText solo dentro de @media (forced-colors)')
  ok(mine.filter((r) => /transition|scale:\s*1\.06/.test(r.body)).every((r) => r.at.some((a) => /prefers-reduced-motion:\s*no-preference/.test(a))), 'dist: transiciones y escala solo dentro de prefers-reduced-motion: no-preference')
  info.push(`dist: ${mine.length} reglas del avatar (${own.length} propias de .g-avatar)`)
}

/* ---------- Ayudas de página ---------- */
const SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="#777"/></svg>'
const PAGE_HELPERS = () => {
  const cv = document.createElement('canvas'); cv.width = cv.height = 1
  const cx = cv.getContext('2d', { willReadFrequently: true })
  const rgb = (c) => { cx.clearRect(0, 0, 1, 1); cx.fillStyle = '#000'; cx.fillStyle = c; cx.fillRect(0, 0, 1, 1); const d = cx.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255] }
  const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) }
  window.__cr = (a, b) => { const A = lum(rgb(a)), B = lum(rgb(b)); return (Math.max(A, B) + 0.05) / (Math.min(A, B) + 0.05) }
  window.__alpha = (c) => rgb(c)[3]
  // Monta componentes reales del UMD en un contenedor nuevo
  window.__mount = (id, render, parent = '#sec-gavatar') => {
    document.getElementById(id)?.remove()
    const host = document.createElement('div'); host.id = id
    host.style.cssText = 'display:flex;flex-wrap:wrap;align-items:flex-start;gap:8px;padding:8px'
    document.querySelector(parent).append(host)
    window.Vue.createApp({ render: () => render(window.Vue.h, window.Grana) }).mount(host)
    return host
  }
}
const settle = (p) => p.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 30)))))

for (const engine of ENGINES) {
  ENGINE = engine
  const b = await pw[engine].launch()
  const errs = []
  const open = async (opts = {}) => {
    const ctx = await b.newContext({ viewport: { width: opts.width ?? 1280, height: opts.height ?? 900 }, deviceScaleFactor: opts.dsf ?? 1, reducedMotion: opts.reducedMotion ?? 'no-preference', colorScheme: opts.colorScheme ?? 'light' })
    const p = await ctx.newPage()
    p.on('console', (m) => {
      const t = m.text()
      if (/You are running a development build of Vue|Download the Vue Devtools/.test(t)) return
      if (m.type() === 'error' && /favicon/.test(t)) return
      if (m.type() === 'error' || (m.type() === 'warning' && /\[Vue warn\]|\[Grana/.test(t))) errs.push(`${m.type()}: ${t.slice(0, 220)}`)
    })
    p.on('pageerror', (e) => { if (!/ResizeObserver loop/.test(e.message)) errs.push(`pageerror: ${e.message}`) })
    let release; const held = new Promise((res) => { release = res })
    p.releaseSlow = () => release()
    await p.route('**/playground/_avatar-lenta.svg*', async (r) => { await held; await r.fulfill({ status: 200, contentType: 'image/svg+xml', body: SVG }) })
    await p.goto(PAGE, { waitUntil: 'domcontentloaded' })
    await p.waitForFunction(() => document.querySelector('#sec-gavatar .g-avatar') && window.Grana && window.Vue)
    await p.evaluate(() => { const f = getComputedStyle(document.body).fontFamily; return Promise.race([Promise.all(['400', '500', '600'].map((w) => document.fonts.load(`${w} 16px ${f}`))), new Promise((r) => setTimeout(r, 3000))]) })
    await p.evaluate(PAGE_HELPERS)
    await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto' })
    await p.waitForTimeout(250)
    return p
  }
  const rect = (p, sel) => p.evaluate((s) => { const r = document.querySelector(s)?.getBoundingClientRect(); return r && { x: r.x, y: r.y, w: r.width, h: r.height } }, sel)

  const p = await open()

  /* ---------- 1 · Marcado real ---------- */
  const mk = await p.evaluate(() => [...document.querySelectorAll('.g-avatar')].map((a) => {
    const kids = [...a.children]
    const imgs = a.querySelectorAll('img')
    const states = ['is-loading', 'is-loaded', 'is-failed'].filter((c) => a.classList.contains(c))
    const fb = kids[0]
    return {
      where: a.dataset.test || a.closest('[id]')?.id || '?',
      n: kids.length, fbOk: !!fb && (fb.classList.contains('g-avatar__initials') || fb.classList.contains('g-avatar__icon')),
      imgLast: imgs.length === 0 || (imgs.length === 1 && kids[kids.length - 1] === imgs[0] && imgs[0].classList.contains('g-avatar__img')),
      nonImg: a.querySelectorAll(':scope > :not(.g-avatar__img)').length,
      states, hasImg: imgs.length > 0, content: [...a.classList].find((c) => c.startsWith('g-avatar--content-')),
      textNodes: [...a.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim()).length,
      size: [...a.classList].find((c) => c.startsWith('g-avatar--size-')), shape: [...a.classList].find((c) => c.startsWith('g-avatar--shape-'))
    }
  }))
  ok(mk.length >= 60, `marcado: avatares reales en la página (${mk.length})`)
  const badMk = mk.filter((m) => !(m.fbOk && m.imgLast && m.nonImg === 1 && m.n <= 2 && m.textNodes === 0 && m.size && m.shape && m.content && m.states.length <= 1 && (!m.hasImg || m.states.length === 1)))
  ok(!badMk.length, `marcado: respaldo hijo directo primero, <img> última, un estado (${JSON.stringify(badMk.slice(0, 2))})`)
  const commentKids = await p.evaluate(() => [...document.querySelectorAll('.g-avatar')].filter((a) => [...a.childNodes].some((n) => n.nodeType === 8)).length)
  info.push(`${engine} marcado: ${mk.length} avatares; ${commentKids} con el comentario <!----> de Vue como hijo (no genera caja: sin efecto en la rejilla)`)
  // El comentario no altera la rejilla: un avatar con y sin comentario centra igual
  const cmt = await p.evaluate(() => { const a = document.querySelector('[data-test="size-ini-md"]'); const t = a.querySelector('.g-avatar__initials').getBoundingClientRect(); const r = a.getBoundingClientRect(); return { dx: (t.x + t.width / 2) - (r.x + r.width / 2), dy: (t.y + t.height / 2) - (r.y + r.height / 2) } })
  ok(Math.abs(cmt.dx) <= 0.5 && Math.abs(cmt.dy) <= 0.5, `marcado: con <!----> las iniciales siguen centradas (dx ${cmt.dx.toFixed(2)}, dy ${cmt.dy.toFixed(2)})`)

  /* ---------- 2 · Lado = space × n ---------- */
  const sides = async (sp) => p.evaluate(() => [...document.querySelectorAll('[data-test^="size-"]')].map((a) => { const r = a.getBoundingClientRect(); return { t: a.dataset.test, w: r.width, h: r.height } }))
  for (const sp of [4, 5]) {
    if (sp === 5) { await p.evaluate(() => document.documentElement.style.setProperty('--g-space-1', '5px')); await settle(p) }
    const bx = await sides(sp)
    ok(bx.length === 20, `lado space ${sp}: 20 avatares de escala (${bx.length})`)
    const bad = bx.filter((x) => { const s = sp * UNITS[x.t.split('-').pop()]; return !(near(x.w, s, 0.01) && near(x.h, s, 0.01)) })
    ok(!bad.length, `lado space ${sp}: exacto en los 5 tamaños × imagen/iniciales/icono/square (${JSON.stringify(bad.slice(0, 3))})`)
  }
  await p.evaluate(() => document.documentElement.style.removeProperty('--g-space-1')); await settle(p)

  /* ---------- 3 · Ajuste de iniciales por tamaño y escritura (componente real del UMD) ---------- */
  const NAMES = ['Ana María López', 'William Moore', 'Жанна Шевченко', '李小龙', '山田 太郎', '김민수', 'محمد علي', 'ØRSTED', '🦊 Zorro Plateado', 'Émile Zola', 'łukasz żółw', 'Straße', 'Wolfgang Mozart', 'नरेन्द्र मोदी', 'สมชาย ใจดี']
  for (const shape of ['circle', 'square']) {
    await p.evaluate(({ NAMES, SIZES, shape }) => window.__mount('au-fit', (h, G) => NAMES.flatMap((n) => SIZES.map((s) => h(G.GAvatar, { name: n, size: s, shape, 'data-n': n, 'data-s': s })))), { NAMES, SIZES, shape })
    await settle(p)
    const fit = await p.evaluate((shape) => [...document.querySelectorAll('#au-fit .g-avatar')].map((a) => {
      const sp = a.querySelector('.g-avatar__initials'); if (!sp) return { n: a.dataset.n, s: a.dataset.s, none: true }
      const fs = parseFloat(getComputedStyle(sp).fontSize); const rg = document.createRange(); rg.selectNodeContents(sp); const tr = rg.getBoundingClientRect(); const ar = a.getBoundingClientRect()
      const r = ar.width / 2, cap = 0.72 * fs
      const avail = shape === 'circle' ? 2 * Math.sqrt(r * r - (cap / 2) ** 2) - 2 : ar.width - 2
      return { n: a.dataset.n, s: a.dataset.s, drawn: sp.textContent, w: tr.width, avail, fs, inside: tr.left >= ar.left - 0.01 && tr.right <= ar.right + 0.01, cy: (tr.top + tr.height / 2) - (ar.top + ar.height / 2), cx: (tr.left + tr.width / 2) - (ar.left + ar.width / 2) }
    }), shape)
    const bad = fit.filter((f) => f.none || !(f.w <= f.avail && f.inside && f.fs >= 12 && Math.abs(f.cy) <= 1 && Math.abs(f.cx) <= 0.75))
    ok(fit.length === NAMES.length * 5 && !bad.length, `${shape}: iniciales caben, ≥ 12px y centradas en ${fit.length} casos (${JSON.stringify(bad.slice(0, 3))})`)
    const smallOne = fit.filter((f) => ['xs', 'sm'].includes(f.s)).every((f) => [...new Intl.Segmenter().segment(f.drawn)].length === 1)
    ok(smallOne, `${shape}: una sola letra en xs y sm`)
    const worst = fit.filter((f) => !['xs', 'sm'].includes(f.s) && [...new Intl.Segmenter().segment(f.drawn)].length > 1).map((f) => ({ d: f.avail - f.w, at: `${f.s} ${f.drawn}` })).sort((a, b) => a.d - b.d)[0]
    info.push(`${engine} ${shape}: aire mínimo de dos letras ${worst?.d.toFixed(1)}px (${worst?.at})`)
  }
  await p.evaluate(() => document.getElementById('au-fit')?.remove())

  /* ---------- 4 · Contraste: neutro y todas las categorías, claro y oscuro, en cuatro temas ---------- */
  await p.evaluate(() => window.__mount('au-cat', (h, G) => [
    h(G.GAvatar, { name: 'Ana López', 'data-k': 'n' }), h(G.GAvatar, { 'data-k': 'n-i' }),
    ...Array.from({ length: 12 }, (_, i) => [h(G.GAvatar, { initials: 'AB', color: i + 1, 'data-k': String(i + 1) }), h(G.GAvatar, { color: i + 1, 'data-k': (i + 1) + '-i' })]).flat()
  ]))
  const measure = () => p.evaluate(() => [...document.querySelectorAll('#au-cat .g-avatar')].map((a) => {
    const cs = getComputedStyle(a); const ink = getComputedStyle(a.firstElementChild).color
    return { k: a.dataset.k, icon: a.dataset.k.endsWith('i'), bg: cs.backgroundColor, has: window.__alpha(cs.backgroundColor) > 0.99, cr: window.__cr(ink, cs.backgroundColor) }
  }))
  const setTheme = (css, scheme) => p.evaluate(({ css, scheme }) => {
    if (css !== null) document.getElementById('app-categories').textContent = css
    if (scheme === 'auto') delete document.documentElement.dataset.theme
    else document.documentElement.dataset.theme = scheme
  }, { css, scheme })
  const appCats = await p.evaluate(() => document.getElementById('app-categories').textContent)
  const cmin = []
  for (const [name, css, n] of [['playground (app-categories)', appCats, 8], ['tema-cat12', THEMES.cat12, 12], ['tema-marca-cat8', THEMES.marca8, 8]]) {
    for (const scheme of ['light', 'dark']) {
      await setTheme(css, scheme); await settle(p)
      const rows = await measure()
      let min = 99, at = ''
      for (const r of rows) {
        const k = parseInt(r.k)
        if (!Number.isNaN(k) && k > n) { ok(!r.has, `${name} ${scheme} cat ${r.k}: categoría no declarada → sin relleno (límite del contrato)`); continue }
        ok(r.has, `${name} ${scheme} ${r.k}: con relleno`)
        ok(r.cr >= (r.icon ? 3 : 4.5), `${name} ${scheme} ${r.k}: contraste ${r.cr.toFixed(2)} < ${r.icon ? 3 : 4.5}`)
        if (!r.icon && r.cr < min) { min = r.cr; at = r.k }
      }
      cmin.push(`${name} ${scheme} ${min.toFixed(2)} (${at})`)
    }
  }
  info.push(`${engine} contraste mínimo de iniciales: ${cmin.join(' · ')}`)
  // El playground en claro SIN data-theme (esquema automático, el caso por defecto de una aplicación)
  await setTheme(appCats, 'auto'); await settle(p)
  const auto = await p.evaluate(() => { const cs = getComputedStyle(document.documentElement); return { cat1: cs.getPropertyValue('--g-color-cat-1-soft').trim(), bg: getComputedStyle(document.body).backgroundColor, dark: matchMedia('(prefers-color-scheme: dark)').matches } })
  known('H1 (bruno)', auto.cat1.toUpperCase() === '#FFEBE9', 'playground: en claro automático (sin data-theme) `app-categories` debe dar las categorías claras (falta el @media (prefers-color-scheme: dark))')
  info.push(`${engine} app-categories en claro automático: cat-1-soft = ${auto.cat1}`)
  // Tema alterno del playground («themed») + neutro
  await p.evaluate(() => { const app = document.querySelector('#app').__vue_app__; const st = app._instance.setupState; st.themed = true })
  for (const scheme of ['light', 'dark']) {
    await setTheme(null, scheme); await settle(p)
    const r = (await measure()).filter((x) => x.k.startsWith('n'))
    ok(r.every((x) => x.has && x.cr >= (x.icon ? 3 : 4.5)), `tema alterno del playground ${scheme}: neutro ${r.map((x) => x.cr.toFixed(2))}`)
  }
  await p.evaluate(() => { document.querySelector('#app').__vue_app__._instance.setupState.themed = false })
  await setTheme(appCats, 'light'); await settle(p)
  await p.evaluate(() => document.getElementById('au-cat')?.remove())

  /* ---------- 5 · Imagen: cargando → cargada, fallida, 3:1 y cambio de src sin salto ---------- */
  await p.locator('#av-img').scrollIntoViewIfNeeded(); await settle(p)
  const st = (t) => p.evaluate((x) => {
    const a = document.querySelector(`[data-test="${x}"]`); const n = document.querySelector(`[data-next="${x}"]`) || a.parentElement.lastChild
    const r = a.getBoundingClientRect(); const fb = a.querySelector(':scope > :not(.g-avatar__img)'); const im = a.querySelector(':scope > img')
    const nr = n.nodeType === 1 ? n.getBoundingClientRect() : (() => { const rg = document.createRange(); rg.selectNode(n); return rg.getBoundingClientRect() })()
    return { cls: a.className, w: r.width, h: r.height, x: r.x, y: r.y, nx: nr.x, ny: nr.y, img: !!im, imgOp: im ? +getComputedStyle(im).opacity : null, fbVis: getComputedStyle(fb).visibility, fbOp: +getComputedStyle(fb).opacity, fbKind: fb.tagName.toLowerCase(), fit: im ? getComputedStyle(im).objectFit : null, nat: im ? im.naturalWidth / im.naturalHeight : null }
  }, t)
  await p.click('#av-slow-btn'); await settle(p)
  const s0 = await st('img-slow')
  ok(/is-loading/.test(s0.cls) && s0.fbVis === 'visible' && s0.fbOp === 1 && s0.imgOp === 0, `cargando: respaldo visible, imagen invisible (${s0.cls})`)
  // Fundido cruzado medido por fotograma desde la llegada de la imagen
  const samplesP = p.evaluate(() => new Promise((res) => {
    const a = document.querySelector('[data-test="img-slow"]'); const out = []; const t0 = performance.now()
    const tick = () => {
      const im = a.querySelector(':scope > img'); const fb = a.querySelector(':scope > :not(.g-avatar__img)')
      const r = a.getBoundingClientRect(); const n = document.querySelector('[data-next="img-slow"]').getBoundingClientRect()
      out.push({ t: performance.now() - t0, loaded: a.classList.contains('is-loaded'), io: im ? +getComputedStyle(im).opacity : null, sc: im ? getComputedStyle(im).scale : null, fo: +getComputedStyle(fb).opacity, fv: getComputedStyle(fb).visibility, w: r.width, h: r.height, nx: n.x })
      if (performance.now() - t0 < 1200) requestAnimationFrame(tick); else res(out)
    }
    requestAnimationFrame(tick)
  }))
  await p.waitForTimeout(50); p.releaseSlow()
  const sm = await samplesP
  const after = sm.filter((x) => x.loaded)
  ok(after.length > 0, 'cargada: llega is-loaded')
  const mid = after.filter((x) => x.io > 0.02 && x.io < 0.98)
  const scMid = after.filter((x) => { const v = parseFloat(x.sc); return v > 1.001 && v < 1.059 })
  const fbMid = after.filter((x) => x.fo > 0.02 && x.fo < 0.98)
  ok(mid.length >= 2, `fundido: valores intermedios de opacidad de la imagen (${mid.length} fotogramas: ${mid.slice(0, 4).map((x) => x.io.toFixed(2))})`)
  ok(scMid.length >= 2, `asentamiento: valores intermedios de escala 1.06 → 1 (${scMid.slice(0, 4).map((x) => x.sc)})`)
  ok(fbMid.length === 0 && after.filter((x) => x.io < 1).every((x) => x.fo === 1 && x.fv === 'visible'), `revelado: el respaldo sigue entero bajo la foto mientras se funde (${fbMid.length} intermedios)`)
  ok(sm.every((x) => Math.max(x.io ?? 0, x.fo) >= 0.99), `revelado: ningún fotograma deja ver el relleno vacío (mín. max(foto, respaldo) ${Math.min(...sm.map((x) => Math.max(x.io ?? 0, x.fo))).toFixed(2)})`)
  const monoI = after.every((x, i, a) => i === 0 || x.io >= a[i - 1].io - 0.001), monoS = after.every((x, i, a) => i === 0 || parseFloat(x.sc) <= parseFloat(a[i - 1].sc) + 0.0001)
  ok(monoI && monoS, 'fundido y asentamiento monótonos (sin rebote)')
  const last = after[after.length - 1]
  ok(last.io === 1 && (last.sc === '1' || last.sc === 'none') && last.fo === 0 && last.fv === 'hidden', `final: imagen 1, escala 1, respaldo oculto (${JSON.stringify(last)})`)
  const tEnd = (after.find((x) => (x.sc === '1' || x.sc === 'none') && x.io === 1)?.t ?? 0) - after[0].t
  info.push(`${engine} revelado: ${mid.length} fotogramas de fundido, ${scMid.length} de asentamiento; asentado en ~${tEnd.toFixed(0)}ms (esperado ≈ 2 × --g-duration-fast = 240ms)`)
  ok(sm.every((x) => x.w === sm[0].w && x.h === sm[0].h && near(x.nx, sm[0].nx, 0.01)), 'cargando → cargada: sin salto de caja ni del texto vecino en ningún fotograma')
  const okI = await st('img-ok'), br = await st('img-broken'), brn = await st('img-broken-noname'), wide = await st('img-wide')
  ok(/is-loaded/.test(okI.cls) && okI.imgOp === 1 && okI.fbVis === 'hidden', `cargada: ${okI.cls}`)
  ok(/is-failed/.test(br.cls) && !br.img && br.fbVis === 'visible' && br.fbKind === 'span' && br.w === 40 && near(br.ny, okI.ny, 0.01), `fallida: sin <img>, iniciales, misma caja (${br.cls})`)
  ok(/is-failed/.test(brn.cls) && brn.fbKind === 'svg' && brn.w === 40, 'fallida sin nombre: icono user, misma caja')
  ok(wide.w === 40 && wide.h === 40 && wide.fit === 'cover' && near(wide.nat, 3, 0.01), `3:1: cover en 40×40 (proporción natural ${wide.nat?.toFixed(2)})`)
  // Cambio de src por fotograma: la caja y el vecino no se mueven; vuelve a is-loading y luego is-loaded
  const swapP = p.evaluate(() => new Promise((res) => {
    const a = document.querySelector('[data-test="img-swap"]'); const out = []; const t0 = performance.now()
    const tick = () => { const r = a.getBoundingClientRect(); const b = document.getElementById('av-swap').getBoundingClientRect(); const im = a.querySelector(':scope > img'); out.push({ c: a.className.match(/is-\w+/)?.[0], w: r.width, h: r.height, bx: b.x, imgs: a.querySelectorAll('img').length, io: im ? +getComputedStyle(im).opacity : null, fo: +getComputedStyle(a.firstElementChild).opacity }); if (performance.now() - t0 < 700) requestAnimationFrame(tick); else res(out) }
    requestAnimationFrame(tick)
  }))
  await p.waitForTimeout(40); await p.click('#av-swap')
  const sw = await swapP
  ok(sw.every((x) => x.w === 40 && x.h === 40 && near(x.bx, sw[0].bx, 0.01)), 'cambio de src: caja 40×40 y botón vecino quietos en todos los fotogramas')
  ok(sw.every((x) => x.imgs <= 1), 'cambio de src: nunca dos <img> a la vez')
  ok(sw[sw.length - 1].c === 'is-loaded', `cambio de src: termina cargada (${sw.map((x) => x.c).filter((c, i, a) => c !== a[i - 1]).join(' → ')})`)
  ok(sw.every((x) => Math.max(x.io ?? 0, x.fo) >= 0.99), `cambio de src: ningún fotograma vacío; el respaldo vuelve al instante (mín. ${Math.min(...sw.map((x) => Math.max(x.io ?? 0, x.fo))).toFixed(2)})`)
  info.push(`${engine} cambio de src: ${sw.map((x) => x.c).filter((c, i, a) => c !== a[i - 1]).join(' → ')}`)

  /* ---------- 6 · Morfo de forma y remontaje ---------- */
  await p.evaluate(() => window.__mount('au-morph', (h, G) => [h(G.GAvatar, { name: 'Grana Labs', size: 'xl', shape: (window.__shape ??= window.Vue.ref('circle')).value, 'data-m': '1' })]))
  await settle(p)
  const morph = p.evaluate(() => new Promise((res) => { const a = document.querySelector('[data-m="1"]'); const out = []; const t0 = performance.now(); const tick = () => { out.push(getComputedStyle(a).borderTopLeftRadius); if (performance.now() - t0 < 400) requestAnimationFrame(tick); else res(out) }; requestAnimationFrame(tick) }))
  await p.waitForTimeout(30); await p.evaluate(() => { window.__shape.value = 'square' })
  const mr = await morph
  const end = mr[mr.length - 1]
  const inter = [...new Set(mr)].filter((v) => v !== '50%' && v !== end)
  ok(/px$/.test(end) && parseFloat(end) > 0 && mr[0] === '50%' && inter.length >= 2, `morfo de forma: el radio pasa por intermedios (${[...new Set(mr)].slice(0, 6).join(' ')})`)
  await p.evaluate(() => document.getElementById('au-morph')?.remove())

  // Remontaje: abrir dos veces la lista de GSelect «Responsable (avatares)»; ¿la foto (ya en memoria) repite el fundido?
  const selPeople = p.locator('.g-select', { hasText: 'Responsable (avatares)' }).first()
  await selPeople.scrollIntoViewIfNeeded()
  const remount = []
  for (let i = 0; i < 2; i++) {
    const probe = p.evaluate(() => new Promise((res) => {
      const out = []; const t0 = performance.now()
      const tick = () => { const im = [...document.querySelectorAll('.g-select__option .g-avatar__img')].find((x) => x.getClientRects().length); if (im) out.push({ t: performance.now() - t0, op: +getComputedStyle(im).opacity, c: im.parentElement.className.match(/is-\w+/)?.[0] }); if (performance.now() - t0 < 600) requestAnimationFrame(tick); else res(out) }
      requestAnimationFrame(tick)
    }))
    await selPeople.locator('.g-select__control').click()
    const r = await probe
    const firstSeen = r[0]
    remount.push({ frames: r.filter((x) => x.op > 0.02 && x.op < 0.98).length, first: firstSeen && `${firstSeen.c} ${firstSeen.op.toFixed(2)}` })
    await p.keyboard.press('Escape'); await settle(p)
  }
  info.push(`${engine} remontaje (GSelect, dos aperturas): fotogramas a medio fundido ${remount.map((r) => r.frames).join(' / ')}; primer fotograma ${remount.map((r) => r.first).join(' / ')}`)
  notes.push(`${engine}: remontaje GSelect → ${JSON.stringify(remount)}`)

  /* ---------- 7 · GCard lead: una sola forma; esqueleto intacto ---------- */
  await p.locator('.cd-list').scrollIntoViewIfNeeded()
  const card = await p.evaluate(() => [...document.querySelectorAll('.cd-list .g-card__lead')].map((l) => {
    const cs = getComputedStyle(l); const r = l.getBoundingClientRect(); const a = l.querySelector(':scope > .g-avatar'); const ar = a?.getBoundingClientRect()
    return { bw: cs.borderTopWidth, bg: window.__alpha(cs.backgroundColor), rad: cs.borderTopLeftRadius, ov: cs.overflow, w: r.width, h: r.height, aw: ar?.width, ah: ar?.height, dx: ar ? (ar.x + ar.width / 2) - (r.x + r.width / 2) : null, dy: ar ? (ar.y + ar.height / 2) - (r.y + r.height / 2) : null, arad: a && getComputedStyle(a).borderTopLeftRadius }
  }))
  ok(card.length === 3 && card.every((c) => c.bw === '0px' && c.bg === 0 && c.rad === '0px' && c.ov === 'visible'), `GCard lista: lead sin borde, relleno, radio ni recorte (${JSON.stringify(card[0])})`)
  ok(card.every((c) => near(c.w, 40, 0.01) && near(c.h, 40, 0.01) && near(c.aw, 40, 0.01) && Math.abs(c.dx) < 0.01 && Math.abs(c.dy) < 0.01 && c.arad === '50%'), `GCard lista: caja 40 = avatar lg centrado, una sola forma (${card.map((c) => c.w + '/' + c.aw).join(' ')})`)
  await p.evaluate(() => window.__mount('au-card', (h, G) => [
    h(G.GCard, { title: 'Ana Pérez', subtitle: 'Diseño', orientation: 'horizontal', density: 'compact', loading: true, 'data-c': 'av' }, { lead: () => h(G.GAvatar, { name: 'Ana Pérez', size: 'lg' }) }),
    h(G.GCard, { title: 'Ana Pérez', subtitle: 'Diseño', orientation: 'horizontal', density: 'compact', loading: true, 'data-c': 'tx' }, { lead: () => 'AP' }),
    h(G.GCard, { title: 'Ana Pérez', subtitle: 'Diseño', orientation: 'horizontal', density: 'compact', 'data-c': 'tx-on' }, { lead: () => 'AP' })
  ], '#sec-gavatar'))
  await settle(p)
  const sk = await p.evaluate(() => Object.fromEntries(['av', 'tx', 'tx-on'].map((k) => { const c = document.querySelector(`[data-c="${k}"]`); const l = c.querySelector('.g-card__lead'); const cs = getComputedStyle(l); const r = l.getBoundingClientRect(); return [k, { bw: cs.borderTopWidth, bg: cs.backgroundColor, rad: cs.borderTopLeftRadius, ov: cs.overflow, w: r.width, h: r.height, ch: c.getBoundingClientRect().height, loading: c.classList.contains('is-loading') }] })))
  ok(sk.av.loading && JSON.stringify({ ...sk.av, ch: 0 }) === JSON.stringify({ ...sk.tx, ch: 0 }) && near(sk.av.ch, sk.tx.ch, 0.01), `GCard cargando: esqueleto idéntico con y sin avatar (${JSON.stringify(sk.av)})`)
  ok(sk['tx-on'].bw !== '0px' && sk['tx-on'].rad !== '0px', 'GCard: un lead de texto conserva su marco')
  await p.evaluate(() => document.getElementById('au-card')?.remove())

  /* ---------- 8 · GTable: hueco a la caja del avatar; alto de fila sin cambio ---------- */
  const tbReal = await p.evaluate(() => {
    const t = [...document.querySelectorAll('.g-table')].find((x) => x.querySelector('.g-table__leading > .g-avatar'))
    return [...t.querySelectorAll('.g-table__leading')].map((l) => { const cs = getComputedStyle(l); const r = l.getBoundingClientRect(); const a = l.querySelector(':scope > .g-avatar').getBoundingClientRect(); return { w: r.width, h: r.height, aw: a.width, dx: a.x - r.x, dy: a.y - r.y, rad: cs.borderTopLeftRadius, ov: cs.overflow, bg: window.__alpha(cs.backgroundColor), row: l.closest('tr').getBoundingClientRect().height } })
  })
  ok(tbReal.length === 5 && tbReal.every((l) => near(l.w, 32, 0.01) && near(l.h, 32, 0.01) && near(l.aw, 32, 0.01) && Math.abs(l.dx) < 0.01 && Math.abs(l.dy) < 0.01 && l.rad === '0px' && l.ov === 'visible' && l.bg === 0), `GTable playground: hueco = avatar md 32, sin relleno, radio ni recorte (${tbReal.map((l) => l.w).join(' ')})`)
  await p.evaluate(() => window.__mount('au-table', (h, G) => {
    const rows = ['Ana Torres', 'Bruno Díaz', 'Carla Ruiz'].map((n, i) => ({ id: 'r' + i, nombre: n, correo: n.split(' ')[0].toLowerCase() + '@correo.com', ini: n.split(' ').map((x) => x[0]).join(''), plan: 'Pro' }))
    const columns = [{ key: 'cliente', label: 'Cliente', leading: 'ini', title: 'nombre', subtitle: 'correo' }, { key: 'plan', label: 'Plan' }]
    return [
      h('div', { style: 'flex:1 1 300px' }, [h(G.GTable, { columns, rows, caption: 'Con avatar', 'data-tb': 'av' }, { 'leading-cliente': ({ row }) => h(G.GAvatar, { name: row.nombre, size: 'md' }) })]),
      h('div', { style: 'flex:1 1 300px' }, [h(G.GTable, { columns, rows, caption: 'Con texto', 'data-tb': 'tx' })]),
      h('div', { style: 'flex:1 1 300px' }, [h(G.GTable, { columns, rows, caption: 'Con avatar compacta', density: 'compact', 'data-tb': 'avc' }, { 'leading-cliente': ({ row }) => h(G.GAvatar, { name: row.nombre, size: 'md' }) })]),
      h('div', { style: 'flex:1 1 300px' }, [h(G.GTable, { columns, rows, caption: 'Con texto compacta', density: 'compact', 'data-tb': 'txc' })])
    ]
  }))
  await settle(p)
  const tbH = await p.evaluate(() => Object.fromEntries(['av', 'tx', 'avc', 'txc'].map((k) => { const t = document.querySelector(`[data-tb="${k}"]`) || document.querySelectorAll('#au-table .g-table')[['av', 'tx', 'avc', 'txc'].indexOf(k)]; return [k, [...t.querySelectorAll('tbody tr')].map((r) => r.getBoundingClientRect().height)] })))
  ok(tbH.av.length === 3 && tbH.av.every((h, i) => near(h, tbH.tx[i], 0.01)), `GTable: alto de fila con avatar = con texto (${tbH.av} / ${tbH.tx})`)
  ok(tbH.avc.every((h, i) => near(h, tbH.txc[i], 0.01)), `GTable compacta: alto de fila igual (${tbH.avc} / ${tbH.txc})`)
  await p.evaluate(() => document.getElementById('au-table')?.remove())

  /* ---------- 9 · GMenu «Asignar a…» y el menú solo de iconos ---------- */
  const menu = async (loc) => {
    await loc.scrollIntoViewIfNeeded(); await loc.click(); await p.waitForTimeout(450)
    const r = await p.evaluate(() => [...document.querySelectorAll('.g-menu__list:popover-open [role^=menuitem], .g-menu__list.is-open [role^=menuitem]')].map((i) => {
      const hu = i.querySelector('.g-menu__icon'); const lab = i.querySelector('.g-menu__label').getBoundingClientRect(); const ir = i.getBoundingClientRect()
      const hr = hu?.getBoundingClientRect(); const c = hu?.firstElementChild?.getBoundingClientRect()
      return { h: ir.height, hw: hr?.width, hh: hr?.height, cw: c?.width, ch: c?.height, dx: c ? (c.x + c.width / 2) - (hr.x + hr.width / 2) : null, dy: c ? (c.y + c.height / 2) - (hr.y + hr.height / 2) : null, lx: lab.x - ir.x, av: !!hu?.querySelector(':scope > .g-avatar'), hidden: hu ? hu.closest('[aria-hidden="true"]') !== null || hu.getAttribute('aria-hidden') === 'true' : null }
    }))
    await p.keyboard.press('Escape'); await p.waitForTimeout(300)
    return r
  }
  const mp = await menu(p.locator('[data-test=mn-people-trigger]').first())
  const ma = await menu(p.locator('#sec-menu .g-btn', { hasText: /^\s*Acciones\s*$/ }).first())
  const slotP = mp.filter((m) => m.hw != null)
  ok(mp.length === 4 && slotP.length === 4, `GMenu Asignar: cuatro elementos con hueco (${mp.length}/${slotP.length})`)
  ok(slotP.every((m) => near(m.hw, 20, 0.01) && near(m.hh, 20, 0.01)), `GMenu Asignar: todos los huecos a space × 5 (${slotP.map((m) => m.hw)})`)
  ok(slotP.filter((m) => m.av).length === 3 && slotP.filter((m) => m.av).every((m) => near(m.cw, 20, 0.01) && Math.abs(m.dx) < 0.01 && Math.abs(m.dy) < 0.01), 'GMenu Asignar: avatares enteros y centrados en su hueco')
  ok(slotP.filter((m) => !m.av).every((m) => near(m.cw, 18, 0.01) && Math.abs(m.dx) < 0.01 && Math.abs(m.dy) < 0.01), `GMenu Asignar: el icono «Invitar» conserva 18 y queda centrado (${slotP.filter((m) => !m.av).map((m) => m.cw)})`)
  ok(slotP.every((m) => near(m.lx, slotP[0].lx, 0.01)), `GMenu Asignar: etiquetas alineadas (${slotP.map((m) => m.lx.toFixed(2))})`)
  ok(slotP.every((m) => m.hidden), 'GMenu Asignar: el hueco (y el avatar) fuera del árbol accesible')
  const slotA = ma.filter((m) => m.hw != null)
  ok(slotA.length >= 1 && slotA.every((m) => near(m.hw, 18, 0.01) && near(m.cw, 18, 0.01)), `GMenu Acciones (solo iconos): hueco e icono 18 sin cambio (${slotA.map((m) => m.hw)})`)
  ok(mp.every((m) => near(m.h, ma[0].h, 0.01)), `GMenu: alto del elemento igual con avatar y con icono (${mp.map((m) => m.h)} / ${ma[0]?.h})`)

  /* ---------- 10 · GSelect «Responsable (avatares)» ---------- */
  const selCli = p.locator('.g-select', { hasText: 'Cliente (prefijo' }).first()
  const ctlH = (loc) => loc.locator('.g-select__control').evaluate((e) => e.getBoundingClientRect().height)
  const hPlain0 = await ctlH(selPeople)
  await p.evaluate(() => { document.querySelector('#app').__vue_app__._instance.setupState.selPerson = 'ana' }); await settle(p)
  const sv = await selPeople.evaluate((root) => {
    const val = root.querySelector('.g-select__value'); const hu = val.querySelector('.g-select__icon'); const a = hu.querySelector(':scope > .g-avatar')
    const ar = a.getBoundingClientRect(), vr = val.getBoundingClientRect(); const rg = document.createRange(); rg.setStartAfter(hu); rg.setEndAfter(val.lastChild); const tr = rg.getBoundingClientRect()
    return { aw: ar.width, hw: hu.getBoundingClientRect().width, d: (ar.top + ar.height / 2) - (tr.top + tr.height / 2), inside: ar.top >= vr.top - 0.01 && ar.bottom <= vr.bottom + 0.01, h: root.querySelector('.g-select__control').getBoundingClientRect().height }
  })
  const hCli = await ctlH(selCli)
  ok(near(sv.aw, 20, 0.01) && near(sv.hw, 20, 0.01) && sv.inside, `GSelect valor: hueco = avatar xs 20, entero (${sv.hw}/${sv.aw})`)
  ok(Math.abs(sv.d) <= 0.5, `GSelect valor: avatar centrado en la línea de texto (Δ ${sv.d.toFixed(2)})`)
  ok(near(sv.h, hPlain0, 0.01) && near(sv.h, hCli, 0.01), `GSelect: alto del control sin cambio (${sv.h} vacío ${hPlain0}, con icono ${hCli})`)
  const opts = async (loc) => { await loc.locator('.g-select__control').click(); await p.waitForTimeout(350); const r = await p.evaluate(() => [...document.querySelectorAll('.g-select__option')].filter((o) => o.getClientRects().length).map((o) => { const hu = o.querySelector('.g-select__icon'); const a = hu?.querySelector(':scope > .g-avatar'); const or = o.getBoundingClientRect(); let d = null; if (a) { const ar = a.getBoundingClientRect(); const txt = [...o.querySelectorAll('*'), o].flatMap((e) => [...e.childNodes]).find((n) => n.nodeType === 3 && n.textContent.trim() && !n.parentElement.closest('.g-avatar')); const rg = document.createRange(); rg.selectNode(txt); const tr = rg.getBoundingClientRect(); d = (ar.top + ar.height / 2) - (tr.top + tr.height / 2) } return { h: or.height, d, hw: hu?.getBoundingClientRect().width, av: !!a } })); await p.keyboard.press('Escape'); await settle(p); return r }
  const oP = await opts(selPeople), oC = await opts(selCli)
  ok(oP.filter((o) => o.av).length === 4 && oP.filter((o) => o.av).every((o) => near(o.hw, 20, 0.01) && Math.abs(o.d) <= 0.5), `GSelect lista: hueco 20 y avatar centrado (${oP.map((o) => o.d?.toFixed(2)).join(' ')})`)
  ok(oP.filter((o) => o.av).every((o) => near(o.h, oC.find((x) => x.hw)?.h ?? oC[0].h, 0.01)), `GSelect lista: alto de opción igual que con icono (${oP.map((o) => o.h)} / ${oC.map((o) => o.h)})`)
  await p.evaluate(() => { document.querySelector('#app').__vue_app__._instance.setupState.selPerson = undefined })

  /* ---------- 11 · GSidebar slot user ---------- */
  const sb = await p.evaluate(() => {
    const a = document.querySelector('[data-test="sb-user-av"]'); if (!a) return null
    const btn = a.closest('button'); const r = a.getBoundingClientRect(); const br = btn.getBoundingClientRect(); const cs = getComputedStyle(a)
    return { w: r.width, h: r.height, dy: (r.y + r.height / 2) - (br.y + br.height / 2), hidden: a.getAttribute('aria-hidden'), bh: br.height, cr: window.__cr(getComputedStyle(a.firstElementChild).color, cs.backgroundColor), shrink: cs.flexShrink }
  })
  ok(sb && near(sb.w, 32, 0.01) && near(sb.h, 32, 0.01) && Math.abs(sb.dy) <= 0.5 && sb.hidden === 'true' && sb.bh >= 44, `GSidebar user: avatar md 32 decorativo, centrado en el botón ≥ 44 (${JSON.stringify(sb)})`)
  ok(sb && sb.cr >= 4.5, `GSidebar user: contraste ${sb?.cr.toFixed(2)}`)

  /* ---------- 12 · GBadge anclada: contorno a 45° (LTR/RTL), esquina en square ---------- */
  const badges = () => p.evaluate(() => [...document.querySelectorAll('.g-badge-anchor:has(> .g-avatar)')].map((an) => {
    const a = an.querySelector(':scope > .g-avatar'); const ar = a.getBoundingClientRect(); const bd = an.querySelector(':scope > .g-badge').getBoundingClientRect()
    const pl = [...an.classList].find((c) => /--(top|bottom)-(start|end)$/.test(c))?.split('--')[1]
    return { pl, sq: a.classList.contains('g-avatar--shape-square'), dx: (bd.x + bd.width / 2) - (ar.x + ar.width / 2), dy: (bd.y + bd.height / 2) - (ar.y + ar.height / 2), r: ar.width / 2, rtl: getComputedStyle(an).direction === 'rtl' }
  }))
  for (const dir of ['ltr', 'rtl']) {
    await p.evaluate((dir) => { document.querySelectorAll('#av-status, #sec-badge').forEach((e) => { e.dir = dir }) }, dir); await settle(p)
    const bs = await badges()
    ok(bs.length >= 5, `GBadge ${dir}: anclas con avatar (${bs.length})`)
    for (const x of bs) {
      const sx = (x.pl.endsWith('end') ? 1 : -1) * (x.rtl ? -1 : 1), sy = x.pl.startsWith('bottom') ? 1 : -1
      if (!x.sq) ok(Math.abs(Math.hypot(x.dx, x.dy) - x.r) <= 1 && Math.abs(Math.abs(x.dx) - Math.abs(x.dy)) <= 1 && Math.sign(x.dx) === sx && Math.sign(x.dy) === sy, `GBadge ${dir} círculo ${x.pl} r${x.r}: en el contorno a 45° (|d| − r ${(Math.hypot(x.dx, x.dy) - x.r).toFixed(2)}, dx ${x.dx.toFixed(2)}, dy ${x.dy.toFixed(2)})`)
      else ok(near(Math.abs(x.dx), x.r, 1) && near(Math.abs(x.dy), x.r, 1) && Math.sign(x.dx) === sx && Math.sign(x.dy) === sy, `GBadge ${dir} square ${x.pl}: en la esquina (dx ${x.dx.toFixed(2)}, dy ${x.dy.toFixed(2)})`)
    }
  }
  await p.evaluate(() => { document.querySelectorAll('#av-status, #sec-badge').forEach((e) => e.removeAttribute('dir')) })

  /* ---------- 13 · forced-colors (solo Chromium lo emula) ---------- */
  if (engine === 'chromium') {
    const sel = '#sec-gavatar .g-avatar, .cd-list .g-avatar, .g-table__leading > .g-avatar'
    const before = await p.evaluate((s) => [...document.querySelectorAll(s)].map((a) => a.getBoundingClientRect().width), sel)
    await p.emulateMedia({ forcedColors: 'active' }); await settle(p)
    const fc = await p.evaluate((s) => [...document.querySelectorAll(s)].map((a) => { const cs = getComputedStyle(a); const im = a.querySelector(':scope > img'); return { s: cs.borderTopStyle, w: parseFloat(cs.borderTopWidth), c: cs.borderTopColor, box: a.getBoundingClientRect().width, ink: cs.color, imgOp: im ? getComputedStyle(im).opacity : null, loaded: a.classList.contains('is-loaded') } }), sel)
    ok(fc.every((x) => x.s === 'solid' && x.w >= 1), `forced-colors: borde sólido en los ${fc.length} avatares reales`)
    ok(fc.every((x) => x.c === fc[0].c && x.ink === fc[0].c), `forced-colors: borde y letra en CanvasText (${fc[0].c} / ${fc[0].ink})`)
    ok(fc.every((x, i) => x.box === before[i]), 'forced-colors: el borde no cambia el tamaño')
    ok(fc.filter((x) => x.loaded).every((x) => x.imgOp === '1'), 'forced-colors: la foto cargada sigue visible')
    // La insignia de presencia sigue siendo distinguible por su forma (la decide GBadge)
    await p.emulateMedia({ forcedColors: 'none' }); await settle(p)
  } else info.push(`${engine}: forced-colors no emulable (Firefox/WebKit)`)

  await p.context().close()

  /* ---------- 14 · Movimiento reducido: todo instantáneo ---------- */
  {
    const pr = await open({ reducedMotion: 'reduce' })
    await pr.locator('#av-img').scrollIntoViewIfNeeded(); await settle(pr)
    const tr = await pr.evaluate(() => { const a = document.querySelector('[data-test=img-ok]'); const im = a.querySelector('img'); const fb = a.firstElementChild; return { d: [a, im, fb].map((e) => getComputedStyle(e).transitionDuration), sc: getComputedStyle(im).scale } })
    ok(tr.d.every((d) => /^0s(, 0s)*$/.test(d)) && (tr.sc === 'none' || tr.sc === '1'), `reduce: sin transiciones ni escala (${tr.d} · ${tr.sc})`)
    await pr.click('#av-slow-btn'); await settle(pr)
    const sP = pr.evaluate(() => new Promise((res) => { const a = document.querySelector('[data-test="img-slow"]'); const out = []; const t0 = performance.now(); const tick = () => { const im = a.querySelector(':scope > img'); out.push({ l: a.classList.contains('is-loaded'), io: im ? +getComputedStyle(im).opacity : null, fo: +getComputedStyle(a.firstElementChild).opacity, sc: im ? getComputedStyle(im).scale : null }); if (performance.now() - t0 < 600) requestAnimationFrame(tick); else res(out) }; requestAnimationFrame(tick) }))
    await pr.waitForTimeout(40); pr.releaseSlow()
    const rs = (await sP).filter((x) => x.l)
    ok(rs.length && rs.every((x) => x.io === 1 && x.fo === 0 && (x.sc === 'none' || x.sc === '1')), `reduce: la imagen aparece en el primer fotograma cargado, sin intermedios (${JSON.stringify(rs[0])})`)
    await pr.context().close()
  }

  /* ---------- 15 · Zoom 200 % aproximado (640 CSS px a escala 2) y 320px ---------- */
  for (const [label, o] of [['zoom 200 %', { width: 640, height: 450, dsf: 2 }], ['320px', { width: 320, height: 800 }]]) {
    const pz = await open(o)
    await pz.locator('#sec-gavatar').scrollIntoViewIfNeeded(); await settle(pz)
    const z = await pz.evaluate(() => {
      const sec = document.querySelector('#sec-gavatar'); const sr = sec.getBoundingClientRect()
      const out = [...sec.querySelectorAll('.g-avatar')].filter((a) => { const r = a.getBoundingClientRect(); return r.right > sr.right + 0.5 || r.left < sr.left - 0.5 }).length
      const sizes = [...sec.querySelectorAll('[data-test^="size-ini-"]')].map((a) => a.getBoundingClientRect().width)
      return { sw: document.scrollingElement.scrollWidth, vw: innerWidth, out, sizes, secOver: sec.scrollWidth > sec.clientWidth + 1 }
    })
    ok(z.sw <= z.vw + 1, `${label}: sin desplazamiento horizontal de página (${z.sw} vs ${z.vw})`)
    ok(z.out === 0 && !z.secOver, `${label}: ningún avatar se sale de la sección (${z.out})`)
    ok(JSON.stringify(z.sizes) === JSON.stringify([20, 24, 32, 40, 64]), `${label}: lados sin cambio (${z.sizes})`)
    await pz.context().close()
  }

  ok(errs.length === 0, `consola limpia: ${errs.slice(0, 5).join(' | ')}`)
  await b.close()
}
server.close()
for (const i of info) console.log('·', i)
if (args.verbose) for (const n of notes) console.log('nota', n)
for (const [k, v] of open_) console.log(v ? 'CERRADO' : 'ABIERTO', k)
for (const f of fails) console.log('FALLA', f)
console.log(`\nTOTAL ${total - failed}/${total}`)
process.exit(failed ? 1 : 0)
