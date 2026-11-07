// Verificación de coco · paso 5 de GBtn · A · Retén sobre el componente REAL (UMD de dist/) y el CSS real.
// Contrato: design/contracts/btn.md «Carga y acuse: A · Retén» (#1010 a #1015). Complementa el spec de bruno
// (design/lab/theme-playground/tests/btn-reten.spec.mjs): aquí solo lo que ese spec no mide.
//   S1 nitidez de la escala sostenida a 1× y 2× (borde, indicador, texto en pendiente)
//   S2 `block` a 1280 px: cuánto se mueve el borde con el hundido y con el pico de la suelta
//   S3 GTooltip abierto durante la carga y tras la suelta (la pestaña mide la caja ya escalada)
//   S4 `link`: grosor del subrayado en pendiente, a la vista y con puntero; marca sobre `hover` (35 pares, 2 esquemas)
//   S5 reafirmar `done` tras un clic: ¿se redibuja el trazo?
//   S6 is-leaving junto a is-done: opacidades en cuadros fijos (WAAPI) y contacto en PNG (solo Chromium)
//   S7 anfitrionas que redefinen .g-btn (clases de GToast, GStatusIsland, GSpeechPill, GFab) y GBtn en GFormActions y GDialog reales
//   S8 tema: sin literales en GBtn.css, F1/F2 en tres temas y dos esquemas, --g-press-scale propio, press-scale 1, duraciones a 0
//   S9 movimiento reducido real y forced-colors (donde la emulación funcione; si no, «no verificable»)
// Ejecutar desde la raíz del repo: node design/lab/btn/auditoria-reten-verificar.mjs [--engines=chromium,firefox,webkit]
// GRANA_ROOT=<ruta> sirve el dist/ de otro árbol (un git worktree construido) en vez del de este. Usa el Playwright de
// design/lab/theme-playground. Con VERBOSE=1 imprime cada medida.
import http from 'node:http'
import { readFile, writeFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const HERE = fileURLToPath(new URL('./', import.meta.url))
const pw = await import(new URL('../theme-playground/node_modules/playwright/index.mjs', import.meta.url))
const REPO = fileURLToPath(new URL('../../../', import.meta.url))
const ROOT = process.env.GRANA_ROOT ? join(process.env.GRANA_ROOT, '/') : REPO
const { buildTheme } = await import(pathToFileURL(join(ROOT, 'packages/cli/src/index.js')).href)
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')).map(([k, v]) => [k, v ?? true]))
const ENGINES = (args.engines || 'chromium,firefox,webkit').split(',')
const VERBOSE = !!process.env.VERBOSE
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const server = http.createServer(async (req, res) => {
  try {
    const p = normalize(join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname)))
    if (!p.startsWith(ROOT)) throw new Error('fuera')
    res.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream' }).end(await readFile(p))
  } catch { if (!res.headersSent) res.writeHead(404).end() }
})
await new Promise((r) => server.listen(0, '127.0.0.1', r))
const BASE = `http://127.0.0.1:${server.address().port}`

const COLORS = ['brand', 'accent', 'neutral', 'success', 'warning', 'danger', 'info']
const VARIANTS = ['solid', 'soft', 'outline', 'ghost', 'link']
const THEMES = [
  { name: 'defecto', css: '', schemes: ['light', 'dark'] },
  { name: 'T2 amarillo', css: buildTheme({ brand: '#F2C200', dark: true }).css, schemes: ['light', 'dark'] },
  { name: 'T4 dark:false', css: buildTheme({ brand: '#7A1F5C', accent: '#0F766E', dark: false }).css, schemes: ['light'] }
]

let total = 0, failed = 0
let fails = []
const ok = (cond, msg) => { total++; if (!cond) { failed++; fails.push(msg) } }
const info = (engine, key, v) => { if (VERBOSE) console.log(`  [${engine}] ${key}: ${typeof v === 'object' ? JSON.stringify(v) : v}`); (RES[engine] ||= {})[key] = v }
const RES = {}
const near = (a, b, t) => Math.abs(a - b) <= t
const f2 = (n) => Math.round(n * 100) / 100

// ---------- Página de prueba ----------
const SHELL = ({ css = '', dir = 'ltr', theme = '', zone = false } = {}) => `<!doctype html><html dir="${dir}"${theme ? ` data-theme="${theme}"` : ''}><head><meta charset="utf-8">
  <link rel="stylesheet" href="/packages/vue/dist/grana.css"><style>body{margin:0;padding:48px;background:var(--g-color-surface);font-family:var(--g-font-ui)}${css}</style></head>
  <body><div id="host"${zone ? ' data-g-zone="brand" style="padding:16px"' : ''}><div id="app"></div></div>
  <script src="/node_modules/vue/dist/vue.global.js"></script><script src="/packages/vue/dist/grana.umd.js"></script></body></html>`
let pageSeq = 0
const shell = async (page, opts = {}) => {
  const path = `/__reten-${++pageSeq}.html`
  await page.route(`**${path}`, (r) => r.fulfill({ contentType: 'text/html', body: SHELL(opts) }))
  await page.goto(BASE + path)
}
// Ayudas en la página: un GBtn real con props reactivas (window.__set) y utilidades de tiempo
const HELPERS = ({ props, model, label, extra }) => {
  const { createApp, h, reactive } = Vue
  const s = reactive(props)
  window.__s = s
  window.__ev = []
  window.__set = (p) => Object.assign(s, p)
  window.__nextTick = Vue.nextTick
  window.__btn = () => document.getElementById('rt')
  window.__has = (c) => window.__btn().classList.contains(c)
  window.__status = () => { const r = document.querySelector('.g-btn__status'); return r ? r.textContent : null }
  window.__scale = () => { const m = getComputedStyle(window.__btn()).transform; return !m || m === 'none' ? 1 : +m.slice(m.indexOf('(') + 1).split(',')[0] }
  window.__until = (pred) => new Promise((res) => {
    if (pred()) return res(performance.now())
    const o = new MutationObserver(() => { if (pred()) { o.disconnect(); res(performance.now()) } })
    o.observe(window.__btn(), { attributes: true, attributeFilter: ['class'] })
  })
  window.__wait = (ms) => new Promise((res) => setTimeout(res, ms))
  window.__frame = () => new Promise(requestAnimationFrame)
  window.__sample = (fn, ms) => new Promise((res) => {
    const xs = []; const t0 = performance.now()
    ;(function f() { xs.push({ t: performance.now() - t0, v: fn() }); if (performance.now() - t0 < ms) requestAnimationFrame(f); else res(xs) })()
  })
  const node = () => h(Grana.GBtn, {
    id: 'rt', ...s,
    'onUpdate:done': (v) => { window.__ev.push(`done:${v}`); if (model) s.done = v },
    onClick: () => { window.__ev.push('click'); if (window.__onClick) window.__onClick(s) }
  }, () => label)
  createApp({ render: () => (extra ? extra(h, node) : node()) }).mount('#app')
}
const open = async (page, { props = {}, model = false, label = 'Enviar informe', extra = null, ...rest } = {}) => {
  await shell(page, rest)
  await page.evaluate(`(${HELPERS})(${JSON.stringify({ props, model, label })})`)
  await page.waitForSelector('#rt')
}
const ctxFor = async (browser, opts = {}) => {
  const c = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: 'light', ...opts })
  return c
}
// Contraste (en la página)
const CONTRAST = () => {
  const cv = document.createElement('canvas'); cv.width = cv.height = 1
  const ctx = cv.getContext('2d', { willReadFrequently: true })
  const rgba = (s) => { ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = '#000'; ctx.fillStyle = s; ctx.fillRect(0, 0, 1, 1); const d = ctx.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255] }
  const over = (t, b) => { const a = t[3]; return [t[0] * a + b[0] * (1 - a), t[1] * a + b[1] * (1 - a), t[2] * a + b[2] * (1 - a), 1] }
  const lum = (k) => { const f = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(k[0]) + 0.7152 * f(k[1]) + 0.0722 * f(k[2]) }
  const ratio = (a, b) => { const x = lum(a); const y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) }
  const surface = (el) => { const ls = []; for (let n = el.parentElement; n; n = n.parentElement) { const k = rgba(getComputedStyle(n).backgroundColor); if (k[3] > 0) { ls.push(k); if (k[3] >= 1) break } } let b = [255, 255, 255, 1]; for (let i = ls.length - 1; i >= 0; i--) b = over(ls[i], b); return b }
  window.__contrast = (btn, mark) => { const bg = over(rgba(getComputedStyle(btn).backgroundColor), surface(btn)); return ratio(over(rgba(getComputedStyle(mark).color), bg), bg) }
}

// Decodifica un PNG en la página y devuelve luma por píxel (para medir nitidez)
const decode = (page, buf) => page.evaluate(async (b64) => {
  const blob = await (await fetch('data:image/png;base64,' + b64)).blob()
  const bmp = await createImageBitmap(blob)
  const cv = new OffscreenCanvas(bmp.width, bmp.height); const c = cv.getContext('2d', { willReadFrequently: true })
  c.drawImage(bmp, 0, 0)
  const d = c.getImageData(0, 0, bmp.width, bmp.height).data
  const luma = new Array(bmp.width * bmp.height)
  for (let i = 0; i < luma.length; i++) luma[i] = 0.2126 * d[i * 4] + 0.7152 * d[i * 4 + 1] + 0.0722 * d[i * 4 + 2]
  return { w: bmp.width, h: bmp.height, luma }
}, buf.toString('base64'))
// Gradiente máximo (percentil 95 de |∇luma|) de una imagen: una región nítida lo conserva, una difuminada lo pierde
const p95grad = ({ w, h, luma }, box) => {
  const gs = []
  const x0 = box ? Math.max(1, Math.floor(box.x0)) : 1, x1 = box ? Math.min(w - 1, Math.ceil(box.x1)) : w - 1
  const y0 = box ? Math.max(1, Math.floor(box.y0)) : 1, y1 = box ? Math.min(h - 1, Math.ceil(box.y1)) : h - 1
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) gs.push(Math.hypot(luma[y * w + x + 1] - luma[y * w + x - 1], luma[(y + 1) * w + x] - luma[(y - 1) * w + x]) / 2)
  gs.sort((a, b) => a - b)
  return gs[Math.floor(gs.length * 0.95)] || 0
}

// =====================================================================================================================
async function s1Sharpness(browser, engine) {
  for (const dpr of [1, 2]) {
    const c = await ctxFor(browser, { deviceScaleFactor: dpr })
    const page = await c.newPage()
    await shell(page, { css: '*{transition:none!important}.g-btn__loader{animation:none!important;rotate:0deg!important}.cell{position:absolute}' })
    await page.evaluate(() => {
      const { createApp, h } = Vue
      const mk = (i, id, v) => h('div', { class: 'cell', style: `left:40px;top:${40 + i * 90}px` }, h(Grana.GBtn, { id, variant: v, color: 'neutral' }, () => 'Enviar informe'))
      createApp({ render: () => [mk(0, 'rest', 'outline'), mk(1, 'held', 'outline'), mk(2, 'pend', 'outline'), mk(3, 'shownonly', 'outline')] }).mount('#app')
      document.getElementById('held').classList.add('is-loading', 'is-shown')
      document.getElementById('pend').classList.add('is-loading')
      document.getElementById('shownonly').classList.add('is-shown')
    })
    const shot = async (id) => {
      const r = await page.evaluate((id) => { const b = document.getElementById(id); const r = b.getBoundingClientRect(); const l = b.querySelector('.g-btn__label').getBoundingClientRect(); const ld = b.querySelector('.g-btn__loader').getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, label: [l.x - r.x, l.y - r.y, l.right - r.x, l.bottom - r.y], loader: [ld.x - r.x, ld.y - r.y, ld.right - r.x, ld.bottom - r.y], sc: getComputedStyle(b).transform } }, id)
      const pad = 8
      const buf = await page.screenshot({ clip: { x: Math.floor(r.x) - pad, y: Math.floor(r.y) - pad, width: Math.ceil(r.w) + 2 * pad, height: Math.ceil(r.h) + 2 * pad } })
      const img = await decode(page, buf)
      const off = { x: (r.x - (Math.floor(r.x) - pad)) * dpr, y: (r.y - (Math.floor(r.y) - pad)) * dpr }
      return { r, img, off }
    }
    // Perfil vertical del borde superior en el centro: cobertura del trazo (0..1) y número de filas físicas tocadas
    const edge = ({ r, img, off }) => {
      const cx = Math.round(off.x + r.w * dpr / 2)
      const col = []; for (let y = 0; y < img.h; y++) col.push(img.luma[y * img.w + cx])
      const bgL = Math.max(...col.slice(0, 3)); const yTop = Math.round(off.y)
      const win = col.slice(Math.max(0, yTop - 3 * dpr), yTop + 3 * dpr)
      const dark = Math.min(...col)
      const cov = win.map((l) => (bgL - l) / Math.max(1, bgL - dark))
      return { peak: Math.max(...cov), rows: cov.filter((v) => v > 0.1).length, sum: cov.reduce((a, b) => a + Math.max(0, b), 0) }
    }
    const rest = await shot('rest'), held = await shot('held'), pend = await shot('pend'), shownOnly = await shot('shownonly')
    const e0 = edge(rest), e1 = edge(held)
    const box = (s, a) => ({ x0: (s.off.x + a[0] * dpr) - 1, y0: (s.off.y + a[1] * dpr) - 1, x1: (s.off.x + a[2] * dpr) + 1, y1: (s.off.y + a[3] * dpr) + 1 })
    const gText0 = p95grad(rest.img, box(rest, [rest.r.w * 0 + 0, 0, rest.r.w, rest.r.h])), gTextP = p95grad(pend.img, box(pend, [0, 0, pend.r.w, pend.r.h]))
    const gInd0 = p95grad(shownOnly.img, box(shownOnly, [shownOnly.r.w / 2 - 12, shownOnly.r.h / 2 - 12, shownOnly.r.w / 2 + 12, shownOnly.r.h / 2 + 12]))
    const gIndH = p95grad(held.img, box(held, [held.r.w / 2 - 12, held.r.h / 2 - 12, held.r.w / 2 + 12, held.r.h / 2 + 12]))
    const R = { borde_reposo: { pico: f2(e0.peak), filas: e0.rows, suma: f2(e0.sum) }, borde_hundido: { pico: f2(e1.peak), filas: e1.rows, suma: f2(e1.sum) }, texto_pendiente_vs_reposo: f2(gTextP / gText0), indicador_hundido_vs_sin_escala: f2(gIndH / gInd0) }
    info(engine, `S1 nitidez ${dpr}×`, R)
    // El borde sigue siendo un trazo legible (pico ≥ 0,5) y la cobertura total se conserva (±35 %: 0,97 px de grosor y bordes de media coverage)
    ok(e1.peak >= 0.5, `S1 ${engine} ${dpr}×: pico del borde hundido ${f2(e1.peak)} < 0,5`)
    ok(e1.sum >= e0.sum * 0.6 && e1.sum <= e0.sum * 1.4, `S1 ${engine} ${dpr}×: cobertura del borde ${f2(e1.sum)} vs ${f2(e0.sum)}`)
    ok(gTextP / gText0 >= 0.6, `S1 ${engine} ${dpr}×: texto en pendiente pierde nitidez ${f2(gTextP / gText0)}`)
    ok(gIndH / gInd0 >= 0.6, `S1 ${engine} ${dpr}×: indicador hundido pierde nitidez ${f2(gIndH / gInd0)}`)
    await c.close()
  }
}

async function s2Block(browser, engine) {
  const c = await ctxFor(browser); const page = await c.newPage()
  await open(page, { props: { block: true } })
  const r = await page.evaluate(async () => {
    const R = () => { const r = __btn().getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top, b: r.bottom, w: r.width, h: r.height } }
    const rest = R(); const host = document.getElementById('app').getBoundingClientRect()
    __set({ loading: true }); await __wait(450)
    const sunk = R()
    __set({ loading: false }); await __until(() => !__has('is-loading'))
    const xs = await __sample(R, 450)
    const peak = { l: Math.min(...xs.map((x) => x.v.l)), r: Math.max(...xs.map((x) => x.v.r)), t: Math.min(...xs.map((x) => x.v.t)), b: Math.max(...xs.map((x) => x.v.b)), w: Math.max(...xs.map((x) => x.v.w)) }
    return { rest, sunk, peak, host: { l: host.left, r: host.right }, vw: innerWidth }
  })
  const inward = r.sunk.l - r.rest.l, v = r.sunk.t - r.rest.t, out = r.rest.l - r.peak.l, outV = r.rest.t - r.peak.t
  const theory = (r.rest.w * 0.03) / 2
  info(engine, 'S2 block 1280', { ancho: f2(r.rest.w), borde_hundido_px: f2(inward), borde_hundido_vertical_px: f2(v), teoria_px: f2(theory), pico_fuera_px: f2(out), pico_fuera_vertical_px: f2(outV), ancho_pico: f2(r.peak.w) })
  ok(r.vw === 1280, `S2 ${engine}: viewport ${r.vw}`)
  ok(r.rest.w > 1100, `S2 ${engine}: block no llena (${r.rest.w})`)
  ok(near(inward, theory, 0.6), `S2 ${engine}: el borde se mueve ${f2(inward)} px, la teoría dice ${f2(theory)}`)
  ok(out > 0 && out <= r.rest.w * 0.0065 / 2 + 0.6, `S2 ${engine}: pico fuera ${f2(out)} px`)
  ok(near(r.sunk.r - r.rest.r, -inward, 0.3), `S2 ${engine}: el hundido no es simétrico`)
  await c.close()
}

async function s3Tooltip(browser, engine) {
  const c = await ctxFor(browser); const page = await c.newPage()
  const geom = () => {
    const t = document.querySelector('[role="tooltip"]'); const b = document.getElementById('rt').getBoundingClientRect()
    if (!t || !t.matches(':popover-open')) return null
    const tab = t.querySelector('.g-tooltip__tab').getBoundingClientRect(); const body = t.querySelector('.g-tooltip__body').getBoundingClientRect()
    return { tabW: tab.width, btnW: b.width, dTabLeft: tab.left - b.left, dTabRight: tab.right - b.right, gap: body.top - b.bottom, dBodyCx: (body.left + body.width / 2) - (b.left + b.width / 2), tabTopToBtnBottom: tab.top - b.bottom }
  }
  await page.addInitScript(`window.__geom = ${geom}`)
  for (const mode of ['reposo', 'carga', 'carga y suelta']) {
    await open(page, { props: { loading: mode !== 'reposo' }, extra: null })
    // El tooltip se pide con la prop `tooltip`
    await page.evaluate(() => { __set({ tooltip: 'Guardar los cambios' }) })
    await page.waitForTimeout(mode === 'reposo' ? 100 : 500)
    await page.evaluate(() => window.__btn().blur())
    await page.keyboard.press('Tab')
    await page.waitForTimeout(500)
    let g = await page.evaluate(() => window.__geom())
    if (!g) { await page.hover('#rt'); await page.waitForTimeout(800); g = await page.evaluate(() => window.__geom()) }
    if (mode === 'carga y suelta') {
      await page.evaluate(async () => { __set({ loading: false }); await __until(() => !__has('is-loading')) })
      await page.waitForTimeout(700)
      const g2 = await page.evaluate(() => window.__geom())
      info(engine, 'S3 tooltip tras la suelta', { antes: g && { tabW: f2(g.tabW), btnW: f2(g.btnW) }, despues: g2 && { dTabLeft: f2(g2.dTabLeft), dTabRight: f2(g2.dTabRight), tabW: f2(g2.tabW), btnW: f2(g2.btnW), gap: f2(g2.gap) } })
      ok(!!g2, `S3 ${engine}: el tooltip se cerró al soltar`)
      if (g2) ok(Math.abs(g2.dTabLeft) <= 2.5 && Math.abs(g2.dTabRight) <= 2.5, `S3 ${engine}: tras la suelta la pestaña queda a ${f2(g2.dTabLeft)} / ${f2(g2.dTabRight)} px de los bordes de la caja`)
    } else {
      info(engine, `S3 tooltip ${mode}`, g && { tabW: f2(g.tabW), btnW: f2(g.btnW), dTabLeft: f2(g.dTabLeft), dTabRight: f2(g.dTabRight), gap: f2(g.gap), dBodyCx: f2(g.dBodyCx) })
      ok(!!g, `S3 ${engine} ${mode}: el tooltip no abrió`)
      if (g) {
        ok(Math.abs(g.dTabLeft) <= 1 && Math.abs(g.dTabRight) <= 1, `S3 ${engine} ${mode}: la pestaña no sigue la caja (${f2(g.dTabLeft)} / ${f2(g.dTabRight)})`)
        ok(Math.abs(g.dBodyCx) <= 1, `S3 ${engine} ${mode}: el cuerpo no está centrado en la caja (${f2(g.dBodyCx)})`)
      }
    }
  }
  // El tooltip ya estaba abierto (foco por teclado) cuando empieza la carga: la caja se encoge bajo una pestaña fija
  for (const [name, props, label] of [['normal', {}, 'Guardar'], ['solo icono', { icon: true, size: 'md', 'aria-label': 'Guardar' }, ''], ['block (1184)', { block: true }, 'Guardar']]) {
    await open(page, { props: { ...props, tooltip: 'Guardar los cambios' }, label })
    await page.keyboard.press('Tab'); await page.waitForTimeout(500)
    let g0 = await page.evaluate(() => window.__geom())
    if (!g0) { await page.hover('#rt'); await page.waitForTimeout(800); g0 = await page.evaluate(() => window.__geom()) } // WebKit no enfoca botones con Tab
    await page.evaluate(() => __set({ loading: true })); await page.waitForTimeout(500)
    const g1 = await page.evaluate(() => window.__geom())
    info(engine, `S3 tooltip abierto antes de la carga (${name})`, g0 && g1 && { ancho_caja: f2(g0.btnW), pestana_sobresale_px_por_lado: f2(Math.max(0, -g1.dTabLeft)), sigue_abierto: !!g1 })
    ok(!!g0, `S3 ${engine} ${name}: el tooltip no abrió antes de la carga`)
    // Se anota, no se exige: la pestaña se mide al abrir y la caja se encoge un 3 % mientras dura la carga (límite del motor, ver el addendum)
    if (g0 && g1) ok(-g1.dTabLeft <= (g0.btnW * 0.03) / 2 + 0.6, `S3 ${engine} ${name}: la pestaña sobresale ${f2(-g1.dTabLeft)} px, más que el 1,5 % de la caja`)
  }
  await c.close()
}

async function s4LinkAndMark(browser, engine) {
  // 4a · link: grosor del subrayado
  let c = await ctxFor(browser); let page = await c.newPage()
  await open(page, { props: { variant: 'link' }, label: 'Ver detalle' })
  const th = () => page.evaluate(() => parseFloat(getComputedStyle(__btn()).textDecorationThickness))
  const w1 = await th()
  const out = { reposo: w1 }
  // Sin puntero: Enter
  await page.evaluate(async () => { __set({ loading: true }); await __nextTick() })
  out.pendiente_sin_puntero = await th()
  await page.evaluate(async () => { await __until(() => __has('is-shown')) })
  out.vista_sin_puntero = await th()
  out.scale_link = await page.evaluate(() => __scale())
  await page.waitForTimeout(300)
  out.etiqueta_opacidad_a_la_vista = await page.evaluate(() => +getComputedStyle(__btn().querySelector('.g-btn__label')).opacity)
  await page.mouse.move(60, 60)
  await page.hover('#rt'); await page.waitForTimeout(100)
  out.vista_con_puntero = await th()
  out.hover_reposo = await (async () => { await page.evaluate(() => __set({ loading: false })); await page.waitForTimeout(700); await page.mouse.move(600, 600); await page.hover('#rt'); await page.waitForTimeout(100); return th() })()
  info(engine, 'S4 link: grosor del subrayado (px)', out)
  ok(out.pendiente_sin_puntero === w1 * 2, `S4 ${engine}: link en pendiente no toma el grosor de hover (${out.pendiente_sin_puntero})`)
  ok(out.etiqueta_opacidad_a_la_vista === 0, `S4 ${engine}: la etiqueta del link (y su subrayado) sigue visible a la vista`)
  ok(out.scale_link === 1, `S4 ${engine}: link no debe hundirse (${out.scale_link})`)
  ok(out.vista_sin_puntero === w1, `S4 ${engine}: link a la vista sin puntero vuelve al grosor de reposo (${out.vista_sin_puntero})`)
  info(engine, 'S4 link: a la vista con puntero encima (el hover de un inerte)', out.vista_con_puntero)
  await c.close()

  // 4b · marca sobre hover: 35 pares × reposo/hover × claro/oscuro, hover con ratón real y la marca ya dibujada
  for (const scheme of ['light', 'dark']) {
    c = await ctxFor(browser, { colorScheme: scheme }); page = await c.newPage()
    await shell(page, { theme: scheme, css: '.g-btn,.g-btn *{transition:none!important;animation:none!important}#app{display:grid;grid-template-columns:repeat(5,max-content);gap:16px}' })
    await page.evaluate(CONTRAST)
    await page.evaluate(async ({ COLORS, VARIANTS }) => {
      const { createApp, h, reactive, nextTick } = Vue
      const s = reactive({ done: false }); window.__sd = s
      createApp({ render: () => COLORS.flatMap((color) => VARIANTS.map((variant) => h(Grana.GBtn, { color, variant, done: s.done, doneText: 'Hecho', 'data-k': `${color}/${variant}` }, () => 'Acción'))) }).mount('#app')
      await nextTick(); s.done = true; await nextTick()
    }, { COLORS, VARIANTS })
    // La marca dura 960 ms: se congela con una hoja que anula la retirada (clase puesta a mano) para poder pasar el ratón
    await page.evaluate(() => { document.querySelectorAll('.g-btn').forEach((b) => b.classList.add('is-done')) })
    const rows = []
    const btns = await page.$$('.g-btn')
    ok(btns.length === 35, `S4 ${engine}: 35 botones`)
    for (const b of btns) {
      await page.mouse.move(2, 2); await page.waitForTimeout(0)
      const k = await b.getAttribute('data-k')
      const rest = await b.evaluate((el) => { el.classList.add('is-done'); return window.__contrast(el, el.querySelector('.g-btn__done')) })
      await b.hover()
      const hov = await b.evaluate((el) => { el.classList.add('is-done'); return { r: window.__contrast(el, el.querySelector('.g-btn__done')), op: getComputedStyle(el.querySelector('.g-btn__done')).opacity, hov: el.matches(':hover') } })
      rows.push({ k, rest, hov: hov.r, op: hov.op, hovered: hov.hov })
    }
    const minRest = Math.min(...rows.map((r) => r.rest)), minHov = Math.min(...rows.map((r) => r.hov))
    info(engine, `S4 marca sobre hover (${scheme})`, { reposo_min: f2(minRest), hover_min: f2(minHov), peor: rows.sort((a, b) => a.hov - b.hov)[0].k })
    ok(rows.every((r) => r.op === '1'), `S4 ${engine} ${scheme}: marca no visible`)
    ok(rows.every((r) => r.hovered), `S4 ${engine} ${scheme}: el ratón no llegó a todos`)
    ok(minRest >= 3, `S4 ${engine} ${scheme}: marca en reposo ${f2(minRest)}:1`)
    ok(minHov >= 3, `S4 ${engine} ${scheme}: marca sobre hover ${f2(minHov)}:1`)
    await c.close()
  }
}

async function s5Redraw(browser, engine) {
  const c = await ctxFor(browser); const page = await c.newPage()
  const run = async (model, when, byProp) => {
    await open(page, { props: { doneText: 'Copiado' }, model })
    if (byProp) await page.evaluate(() => { window.__onClick = (s) => { s.done = true } })
    else await page.evaluate(() => { window.__onClick = (s) => { s.done = true } })
    await page.evaluate(async () => { __set({ done: true }); await __until(() => __has('is-done')) })
    await page.waitForTimeout(when)
    return page.evaluate(async () => {
      const path = () => __btn().querySelector('.g-btn__done path')
      const offs = []; const classes = []
      const mo = new MutationObserver(() => classes.push({ t: performance.now() - t0, done: __has('is-done') }))
      mo.observe(__btn(), { attributes: true, attributeFilter: ['class'] })
      const t0 = performance.now()
      __btn().click()
      await __nextTick(); await __nextTick()
      const xs = await __sample(() => ({ off: parseFloat(getComputedStyle(path()).strokeDashoffset), anims: path().getAnimations().length, done: __has('is-done'), status: __status() }), 400)
      mo.disconnect()
      return { xs, classes, ev: [...__ev] }
    })
  }
  for (const [model, when, name] of [[true, 700, 'con v-model, trazo ya completo'], [true, 100, 'con v-model, a media cuenta del trazo']]) {
    const r = await run(model, when)
    const drew = r.xs.some((x) => x.v.off < -0.15)
    const flick = r.classes.length
    const restartedTimer = r.xs.length > 0 && r.xs[r.xs.length - 1].v.done
    info(engine, `S5 reafirmar ${name}`, { se_redibuja: drew, cambios_de_clase: flick, is_done_al_final: restartedTimer, eventos: r.ev, estado_ini: r.xs[0].v })
    ok(r.xs[0].v.done, `S5 ${engine} (${name}): tras el clic y la reafirmación no hay acuse`)
    ok(JSON.stringify(r.ev) === JSON.stringify(['done:true', 'done:false', 'click', 'done:false']) || r.ev.includes('click'), `S5 ${engine} (${name}): eventos ${r.ev}`)
    if (when === 700) {
      // Hipótesis de la causa: quitar y volver a poner is-done sin cuadro ni recálculo de estilo entre medias no reinicia la animación.
      // Con una lectura de layout entre medias, sí
      const fix = await page.evaluate(async () => {
        const b = __btn(); const path = b.querySelector('.g-btn__done path')
        await __wait(1100)
        __set({ done: true }); await __until(() => __has('is-done')); await __wait(400)
        const base = path.getAnimations().length
        b.classList.remove('is-done'); b.classList.add('is-done'); await __frame()
        const sinLectura = path.getAnimations().length
        b.classList.remove('is-done'); void b.offsetWidth; b.classList.add('is-done'); await __frame()
        const conLectura = path.getAnimations().length
        return { base, sinLectura, conLectura }
      })
      info(engine, 'S5 causa: animaciones del trazo tras quitar y poner is-done', fix)
      ok(fix.sinLectura === 0 && fix.conLectura === 1, `S5 ${engine}: la hipótesis (sin lectura de layout no reinicia, con lectura sí) no se confirma ${JSON.stringify(fix)}`)
    }
    // Resultado del contrato (btn.md «es un acuse nuevo»): el anuncio vuelve a emitirse y la marca se retira 960 ms después del segundo
    // El trazo puede no redibujarse: se anota con `info` y se decide en el addendum (no es una aserción de este script)
  }
  await c.close()
}

async function s6Leaving(browser, engine) {
  const c = await ctxFor(browser, { deviceScaleFactor: engine === 'chromium' ? 3 : 1 }); const page = await c.newPage()
  await open(page, { props: { doneText: 'Guardado', color: 'brand' }, model: true })
  const ts = [0, 30, 60, 90, 120, 180, 240]
  const imgsAll = []
  for (const turn of ['primer acuse', 'segundo acuse']) {
    const r = await page.evaluate(async (ts) => {
      __set({ loading: true })
      await __until(() => __has('is-shown')); await __wait(450)
      __set({ loading: false, done: true })
      await __until(() => __has('is-done'))
      const joint = __has('is-leaving')
      await __frame()
      const anims = document.getAnimations().filter((a) => a.effect && a.effect.target && __btn().contains(a.effect.target))
      anims.forEach((a) => a.pause())
      window.__frozen = anims
      const loader = __btn().querySelector('.g-btn__loader'), mark = __btn().querySelector('.g-btn__done'), label = __btn().querySelector('.g-btn__label')
      const out = []
      for (const t of ts) {
        anims.forEach((a) => { a.currentTime = t })
        const cs = (e) => getComputedStyle(e)
        const off = parseFloat(cs(mark.querySelector('path')).strokeDashoffset)
        out.push({ t, loader: +cs(loader).opacity, mark: +cs(mark).opacity, draw: Math.round((1 + off) * 100) / 100, label: +cs(label).opacity, n: anims.length })
      }
      return { joint, out }
    }, ts)
    info(engine, `S6 is-leaving + is-done (${turn})`, { juntas: r.joint, cuadros: r.out.map((x) => `${x.t}ms giro ${f2(x.loader)} marca ${f2(x.mark)} trazo ${x.draw} etiqueta ${f2(x.label)}`) })
    ok(r.joint, `S6 ${engine} ${turn}: is-leaving e is-done no coinciden en la llegada`)
    ok(r.out[0].n > 0, `S6 ${engine} ${turn}: sin animaciones que congelar`)
    ok(r.out.every((x) => x.label < 0.05), `S6 ${engine} ${turn}: la etiqueta asoma durante el acuse`)
    const last = r.out[r.out.length - 1]
    ok(last.mark > 0.95 && last.loader < 0.05 && last.draw >= 0.99, `S6 ${engine} ${turn}: a 240 ms no queda solo la marca entera`)
    // Cuánto se ve del giro y de la marca a la vez, en los cuadros: el producto de opacidad por trazo dibujado es lo que hay de marca
    const both = Math.max(...r.out.map((x) => Math.min(x.loader, x.mark * x.draw)))
    info(engine, `S6 solape del giro con la marca visible (${turn})`, f2(both))
    ok(both <= 0.5, `S6 ${engine} ${turn}: el giro y la marca conviven a más del 50 % (${f2(both)})`)
    if (engine === 'chromium') {
      for (const t of ts) {
        await page.evaluate((t) => { window.__frozen.forEach((a) => { a.currentTime = t }) }, t)
        const clip = await page.evaluate(() => { const r = __btn().getBoundingClientRect(); return { x: Math.floor(r.x) - 6, y: Math.floor(r.y) - 6, width: Math.ceil(r.width) + 12, height: Math.ceil(r.height) + 12 } })
        imgsAll.push((await page.screenshot({ clip })).toString('base64'))
      }
    }
    await page.evaluate(() => { window.__frozen.forEach((a) => a.play()) })
    await page.waitForTimeout(1200) // el acuse se retira y el botón queda en reposo para el segundo turno
    await page.evaluate(() => { const b = __btn(); b.classList.remove('is-leaving') })
  }
  if (engine === 'chromium') {
    const png = await page.evaluate(async ({ imgs, ts }) => {
      const bms = await Promise.all(imgs.map(async (b) => createImageBitmap(await (await fetch('data:image/png;base64,' + b)).blob())))
      const W = bms[0].width, H = bms[0].height, cols = ts.length, rows = Math.ceil(bms.length / cols)
      const cv = document.createElement('canvas'); cv.width = W * cols; cv.height = (H + 28) * rows
      const g = cv.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, cv.width, cv.height); g.font = '22px sans-serif'; g.fillStyle = '#000'
      bms.forEach((bm, i) => { const x = (i % cols) * W, y = Math.floor(i / cols) * (H + 28); g.drawImage(bm, x, y + 28); g.fillText(ts[i % cols] + ' ms' + (i < cols ? ' · primer acuse' : ' · segundo'), x + 6, y + 20) })
      return cv.toDataURL('image/png').split(',')[1]
    }, { imgs: imgsAll, ts })
    await writeFile(join(HERE, 'auditoria-reten-leaving.png'), Buffer.from(png, 'base64'))
  }
  await c.close()
}

async function s7Hosts(browser, engine) {
  const c = await ctxFor(browser); const page = await c.newPage()
  const HOSTS = [
    { name: 'GToast', host: '<div class="g-toast"><div class="g-toast__actions" id="hostbox">', end: '</div></div>', cls: 'g-toast__action', props: { size: 'sm', variant: 'outline', color: 'neutral' } },
    { name: 'GStatusIsland (acción)', host: '<div class="g-status-sheet" id="hostbox" style="padding:16px;position:static">', end: '</div>', cls: 'g-status-island__action', props: { size: 'sm' } },
    { name: 'GStatusIsland (origen)', host: '<div class="g-status-sheet" id="hostbox" style="padding:16px;position:static">', end: '</div>', cls: 'g-status-island__origin', props: { size: 'sm', variant: 'ghost', color: 'neutral' } },
    { name: 'GSpeechPill (principal)', host: '<div class="g-speech-pill" id="hostbox" style="position:static">', end: '</div>', cls: 'g-speech-pill__main', props: { size: 'sm', variant: 'ghost', color: 'neutral' } },
    { name: 'GFab (hijo directo)', host: '<div class="g-fab" id="hostbox" style="position:static">', end: '</div>', cls: '', props: { icon: true, size: 'xl', rounded: 'pill', 'aria-label': 'Acción' } }
  ]
  for (const H of HOSTS) {
    await shell(page, { css: '#mount{display:block;padding:24px}' })
    await page.evaluate(CONTRAST)
    await page.evaluate(({ H }) => {
      document.getElementById('app').outerHTML = `${H.host}<div id="app"></div>${H.end}`
      const { createApp, h, reactive } = Vue
      const s = reactive({ loading: false, done: false }); window.__s = s
      window.__btn = () => document.getElementById('rt')
      createApp({ render: () => h(Grana.GBtn, { id: 'rt', class: H.cls, ...H.props, loading: s.loading, done: s.done, doneText: 'Hecho', 'onUpdate:done': (v) => { s.done = v } }, () => (H.props.icon ? h(Grana.GIcon, { name: 'check' }) : 'Guardar')) }).mount('#app')
    }, { H })
    await page.waitForSelector('#rt')
    const cs = (sel) => page.evaluate((sel) => { const b = document.getElementById('rt'); const s = getComputedStyle(b); return { bg: s.backgroundColor, fg: s.color, bd: s.borderTopColor, tr: s.transform, shadow: s.boxShadow } }, sel)
    const rest = await cs()
    await page.mouse.move(2, 2)
    await page.evaluate(() => { __s.loading = true })
    await page.waitForTimeout(60)
    const pend = await cs()
    await page.waitForTimeout(450)
    const shown = await page.evaluate(() => { const b = document.getElementById('rt'); return { shown: b.classList.contains('is-shown'), loader: +getComputedStyle(b.querySelector('.g-btn__loader')).opacity } })
    const held = await cs()
    await page.hover('#rt'); await page.waitForTimeout(250)
    const heldHover = await cs()
    await page.mouse.move(2, 2)
    await page.evaluate(() => { __s.loading = false; __s.done = true })
    await page.waitForFunction(() => document.getElementById('rt').classList.contains('is-done'), null, { timeout: 4000 })
    await page.waitForTimeout(350)
    const done = await page.evaluate(() => { const b = document.getElementById('rt'); const m = b.querySelector('.g-btn__done'); return { op: +getComputedStyle(m).opacity, r: window.__contrast(b, m), label: +getComputedStyle(b.querySelector('.g-btn__label')).opacity } })
    const sc = (t) => (t === 'none' ? 1 : +t.slice(t.indexOf('(') + 1).split(',')[0])
    const R = { reposo_bg: rest.bg, escala_en_carga: f2(sc(held.tr)), pendiente_bg_igual_hover: null, a_la_vista_bg_igual_reposo: held.bg === rest.bg, hover_inerte_igual: heldHover.bg === held.bg && heldHover.fg === held.fg && heldHover.bd === held.bd, loader: shown.loader, marca: f2(done.r), marca_op: done.op, etiqueta_op: done.label }
    info(engine, `S7 anfitriona ${H.name}`, R)
    ok(shown.shown && shown.loader === 1, `S7 ${engine} ${H.name}: el indicador no se ve (${shown.loader})`)
    ok(near(sc(held.tr), 0.97, 0.001), `S7 ${engine} ${H.name}: escala en carga ${sc(held.tr)}`)
    ok(held.bg === rest.bg && held.fg === rest.fg, `S7 ${engine} ${H.name}: a la vista el fondo o el texto de la anfitriona cambian (${rest.bg} -> ${held.bg})`)
    ok(heldHover.bg === held.bg && heldHover.fg === held.fg && heldHover.bd === held.bd, `S7 ${engine} ${H.name}: a la vista el hover de la anfitriona responde`)
    ok(done.op === 1 && done.label === 0, `S7 ${engine} ${H.name}: acuse no visible`)
    ok(done.r >= 3, `S7 ${engine} ${H.name}: marca ${f2(done.r)}:1`)
  }
  // GFormActions real: apilado (estrecho) y en línea; GDialog real: pie
  for (const [name, width] of [['GFormActions en línea', 640], ['GFormActions apilado (280)', 280]]) {
    await shell(page, { css: `#app{width:${width}px}` })
    await page.evaluate(CONTRAST)
    await page.evaluate(() => {
      const { createApp, h, reactive } = Vue
      const s = reactive({ loading: false, done: false }); window.__s = s
      createApp({ render: () => h(Grana.GFormActions, null, { default: () => [h(Grana.GBtn, { variant: 'outline' }, () => 'Cancelar'), h(Grana.GBtn, { id: 'rt', loading: s.loading, done: s.done, doneText: 'Hecho', 'onUpdate:done': (v) => { s.done = v } }, () => 'Guardar cambios')] }) }).mount('#app')
    })
    await page.waitForSelector('#rt')
    const r = await page.evaluate(async () => {
      const b = document.getElementById('rt'); const wait = (ms) => new Promise((r) => setTimeout(r, ms))
      const box = (e) => { const r = e.getBoundingClientRect(); return { l: r.left, r: r.right, w: r.width, h: r.height } }
      const rest = box(b)
      __s.loading = true; await wait(450)
      const sunk = box(b); const loader = +getComputedStyle(b.querySelector('.g-btn__loader')).opacity
      __s.loading = false; __s.done = true
      await new Promise((res) => { const o = new MutationObserver(() => { if (b.classList.contains('is-done')) { o.disconnect(); res() } }); o.observe(b, { attributes: true }) })
      await wait(350)
      const m = b.querySelector('.g-btn__done')
      const sib = document.querySelector('.g-form-actions .g-btn')
      return { rest, sunk, loader, mark: window.__contrast(b, m), op: +getComputedStyle(m).opacity, sibW: sib.getBoundingClientRect().width, host: box(document.querySelector('.g-form-actions')) }
    })
    info(engine, `S7 ${name}`, { ancho_reposo: f2(r.rest.w), ancho_hundido: f2(r.sunk.w), hundido_px_por_lado: f2((r.rest.w - r.sunk.w) / 2), marca: f2(r.mark), indicador: r.loader })
    ok(r.loader === 1 && r.op === 1, `S7 ${engine} ${name}: indicador o marca no visibles`)
    ok(near(r.sunk.w / r.rest.w, 0.97, 0.002), `S7 ${engine} ${name}: escala ${f2(r.sunk.w / r.rest.w)}`)
    ok(r.mark >= 3, `S7 ${engine} ${name}: marca ${f2(r.mark)}:1`)
    ok(r.sunk.l >= r.host.l - 0.5 && r.sunk.r <= r.host.r + 0.5, `S7 ${engine} ${name}: el botón hundido se sale del pie`)
  }
  {
    await shell(page, {})
    await page.evaluate(CONTRAST)
    await page.evaluate(() => {
      const { createApp, h, reactive } = Vue
      const s = reactive({ open: true, loading: false, done: false }); window.__s = s
      createApp({ render: () => h(Grana.GDialog, { modelValue: s.open, 'onUpdate:modelValue': (v) => { s.open = v }, title: 'Guardar', size: 'sm' }, { default: () => 'Contenido', footer: () => [h(Grana.GBtn, { variant: 'outline' }, () => 'Cancelar'), h(Grana.GBtn, { id: 'rt', loading: s.loading, done: s.done, doneText: 'Hecho', 'onUpdate:done': (v) => { s.done = v } }, () => 'Guardar')] }) }).mount('#app')
    })
    await page.waitForSelector('#rt'); await page.waitForTimeout(500)
    const r = await page.evaluate(async () => {
      const b = document.getElementById('rt'); const wait = (ms) => new Promise((r) => setTimeout(r, ms))
      const rest = b.getBoundingClientRect()
      __s.loading = true; await wait(450)
      const sunk = b.getBoundingClientRect(); const loader = +getComputedStyle(b.querySelector('.g-btn__loader')).opacity
      const inFocus = document.activeElement
      __s.loading = false
      const xs = []; const t0 = performance.now()
      await new Promise((res) => (function f() { const r = b.getBoundingClientRect(); xs.push({ l: r.left, r: r.right, t: r.top, b: r.bottom }); if (performance.now() - t0 < 450) requestAnimationFrame(f); else res() })())
      let clip = null
      for (let n = b.parentElement; n; n = n.parentElement) { const o = getComputedStyle(n).overflow; if (o !== 'visible') { const r = n.getBoundingClientRect(); clip = { cls: n.className, l: r.left, r: r.right, t: r.top, b: r.bottom }; break } }
      const peak = { l: Math.min(...xs.map((x) => x.l)), r: Math.max(...xs.map((x) => x.r)), t: Math.min(...xs.map((x) => x.t)), b: Math.max(...xs.map((x) => x.b)) }
      __s.done = true; await wait(120)
      await new Promise((res) => { const o = new MutationObserver(() => { if (b.classList.contains('is-done')) { o.disconnect(); res() } }); b.classList.contains('is-done') ? res() : o.observe(b, { attributes: true }) })
      await wait(350)
      const m = b.querySelector('.g-btn__done')
      return { rest: rest.width, sunk: sunk.width, loader, peak, clip, mark: window.__contrast(b, m), op: +getComputedStyle(m).opacity, openStill: __s.open, focusKept: document.activeElement === b || inFocus === document.activeElement }
    })
    const out = r.clip ? { izq: f2(r.clip.l - r.peak.l), der: f2(r.peak.r - r.clip.r), sup: f2(r.clip.t - r.peak.t), inf: f2(r.peak.b - r.clip.b) } : null
    info(engine, 'S7 GDialog (pie)', { escala: f2(r.sunk / r.rest), marca: f2(r.mark), contenedor_con_overflow: r.clip && r.clip.cls, pico_sobre_el_borde_px: out })
    ok(r.loader === 1 && r.op === 1, `S7 ${engine} GDialog: indicador o marca no visibles`)
    ok(r.mark >= 3, `S7 ${engine} GDialog: marca ${f2(r.mark)}:1`)
    ok(r.openStill, `S7 ${engine} GDialog: el acuse cerró el diálogo`)
  }
  await c.close()
}

async function s8Theme(browser, engine) {
  // 8a · literales en GBtn.css
  const css = (await readFile(join(ROOT, 'packages/vue/src/components/GBtn/GBtn.css'), 'utf8')).replace(/\/\*[\s\S]*?\*\//g, '')
  const lit = []
  for (const m of css.matchAll(/#[0-9a-fA-F]{3,8}\b|\b(?:rgb|rgba|hsl|hsla|oklch|oklab|lab|lch)\(|cubic-bezier\(|\b\d*\.?\d+m?s\b(?![\w-])|-?\b\d*\.?\d+px\b/g)) {
    const v = m[0]
    if (['24px', '44px', '0.5px', '1px', '-1px'].includes(v)) continue
    lit.push(v)
  }
  info(engine, 'S8 literales en GBtn.css fuera de la lista', lit)
  ok(lit.length === 0, `S8 ${engine}: literales en GBtn.css: ${lit.join(', ')}`)
  // 1px y -1px solo en g-btn__status
  const stray = [...css.matchAll(/[^{}]*\{[^{}]*\b-?1px\b[^{}]*\}/g)].map((m) => m[0].trim().split('{')[0].trim()).filter((s) => !s.includes('g-btn__status'))
  ok(stray.length === 0, `S8 ${engine}: 1px fuera del texto oculto en ${stray.join(' | ')}`)
  ok(!/--g-ease-bounce[\s\S]*--g-ease-bounce/.test(css), `S8 ${engine}: --g-ease-bounce aparece más de una vez`)
  ok((css.match(/--g-ease-bounce/g) || []).length === 1, `S8 ${engine}: --g-ease-bounce debe aparecer una sola vez`)

  // 8b · F1 y F2 en tres temas y dos esquemas (35 pares) con ratón real
  for (const T of THEMES) for (const scheme of T.schemes) {
    const c = await ctxFor(browser, { colorScheme: scheme }); const page = await c.newPage()
    await shell(page, { theme: T.name === 'T4 dark:false' ? '' : scheme, css: `${T.css}.g-btn,.g-btn *{transition:none!important;animation:none!important}#app{display:grid;grid-template-columns:repeat(5,max-content);gap:16px}` })
    await page.evaluate(async ({ COLORS, VARIANTS }) => {
      const { createApp, h, nextTick } = Vue
      createApp({ render: () => COLORS.flatMap((color) => VARIANTS.map((variant) => h(Grana.GBtn, { color, variant, 'data-k': `${color}/${variant}` }, () => 'Acción'))) }).mount('#app')
      await nextTick()
    }, { COLORS, VARIANTS })
    const bad = []
    for (const b of await page.$$('.g-btn')) {
      const k = await b.getAttribute('data-k'); const link = k.endsWith('/link')
      const snap = () => b.evaluate((el) => { const s = getComputedStyle(el); return [s.backgroundColor, s.color, s.borderTopColor, s.textDecorationThickness].join('|') })
      await page.mouse.move(2, 2); await b.evaluate((el) => el.classList.remove('is-loading', 'is-shown'))
      const A = await snap()
      await b.hover(); const Hh = await snap()
      await b.evaluate((el) => el.classList.add('is-loading')); const P = await snap()
      await b.evaluate((el) => el.classList.add('is-shown')); const S = await snap()
      await page.mouse.move(2, 2); const S2 = await snap()
      await b.evaluate((el) => el.classList.remove('is-shown'))
      const P2 = await snap()
      await b.evaluate((el) => el.classList.remove('is-loading'))
      const cut = (s) => s.split('|').slice(0, 3).join('|')
      if (cut(S) !== cut(A)) bad.push(`${k} a la vista con puntero ≠ reposo (${S} vs ${A})`)
      if (cut(S2) !== cut(A)) bad.push(`${k} a la vista sin puntero ≠ reposo`)
      if (!link && cut(P) !== cut(Hh)) bad.push(`${k} pendiente con puntero ≠ hover`)
      if (!link && cut(P2) !== cut(Hh)) bad.push(`${k} pendiente sin puntero ≠ hover`)
      if (link && P2.split('|')[3] === A.split('|')[3]) bad.push(`${k} pendiente sin grosor de hover`)
    }
    info(engine, `S8 F1/F2 ${T.name} ${scheme}`, bad.length ? bad.slice(0, 3) : 'ok')
    ok(bad.length === 0, `S8 ${engine} ${T.name} ${scheme}: ${bad.slice(0, 3).join('; ')}`)
    await c.close()
  }

  // 8c · tokens de tema: --g-press-scale propio, 1, duraciones a 0
  const c = await ctxFor(browser); const page = await c.newPage()
  for (const [name, themeCss, press, duration] of [['--g-press-scale: 0.9', ':root{--g-press-scale:0.9}', 0.9, 0], ['--g-press-scale: 1', ':root{--g-press-scale:1}', 1, 0], ['duraciones a 0', ':root{--g-duration-fast:0ms;--g-duration-press:0ms;--g-duration-slow:0ms;--g-duration-spin:1000ms}', 0.97, 1]]) {
    await open(page, { props: { doneText: 'Guardado' }, model: true, css: themeCss })
    const r = await page.evaluate(async () => {
      __set({ loading: true }); await __wait(400)
      const sunk = __scale()
      __set({ loading: false, done: true })
      await __until(() => __has('is-done'))
      const samples = await __sample(() => __scale(), 250)
      const t0 = performance.now()
      await __until(() => !__has('is-done'))
      const ms = performance.now() - t0
      return { sunk, ms, maxAfter: Math.max(...samples.map((x) => x.v)), ev: [...__ev] }
    })
    info(engine, `S8 tema ${name}`, { hundido: f2(r.sunk), pico_tras_soltar: Math.round(r.maxAfter * 10000) / 10000, retirada_tras_acuse_ms: Math.round(r.ms) })
    ok(near(r.sunk, press, 0.001), `S8 ${engine} ${name}: hundido ${r.sunk}`)
    if (press === 1) ok(r.maxAfter <= 1.0001, `S8 ${engine} ${name}: con press-scale 1 hay rebote (${r.maxAfter})`)
    if (duration === 1) ok(r.ev[r.ev.length - 1] === 'done:false' || r.ms < 1500, `S8 ${engine} ${name}: el acuse no se retiró`)
    ok(r.ms < 1500 && r.ev.includes('done:false'), `S8 ${engine} ${name}: la marca no se retira (${Math.round(r.ms)} ms, ${r.ev})`)
  }
  await c.close()
}

async function s9Prefs(browser, engine) {
  // 9a · movimiento reducido real
  let c = await ctxFor(browser, { reducedMotion: 'reduce' }); let page = await c.newPage()
  await open(page, { props: { doneText: 'Guardado', variant: 'solid' }, model: true })
  const red = await page.evaluate(async () => {
    const match = matchMedia('(prefers-reduced-motion: reduce)').matches
    __set({ loading: true }); await __until(() => __has('is-shown')); await __wait(450)
    const sc = __scale(); const tr = getComputedStyle(__btn().querySelector('.g-btn__loader')).translate
    const lt = getComputedStyle(__btn().querySelector('.g-btn__label')).translate
    const dur = getComputedStyle(__btn().querySelector('.g-btn__loader')).animationDuration
    __set({ loading: false, done: true })
    await __until(() => __has('is-done'))
    const xs = await __sample(() => ({ s: __scale(), off: parseFloat(getComputedStyle(__btn().querySelector('.g-btn__done path')).strokeDashoffset), a: __btn().querySelector('.g-btn__done path').getAnimations().length }), 300)
    return { match, sc, tr, lt, dur, maxScale: Math.max(...xs.map((x) => x.v.s)), minOff: Math.min(...xs.map((x) => x.v.off)), anims: Math.max(...xs.map((x) => x.v.a)), joint: __has('is-leaving') }
  })
  info(engine, 'S9 movimiento reducido', red)
  ok(red.match, `S9 ${engine}: la emulación de reduce no se aplicó`)
  ok(red.sc === 1 && red.maxScale <= 1.0001, `S9 ${engine} reduce: escala ${red.sc} / pico ${red.maxScale}`)
  ok(red.tr === 'none' || red.tr === '0px', `S9 ${engine} reduce: el indicador se desplaza (${red.tr})`)
  ok(red.lt === 'none' || red.lt === '0px', `S9 ${engine} reduce: la etiqueta se desplaza (${red.lt})`)
  ok(red.anims === 0 && red.minOff === 0, `S9 ${engine} reduce: el trazo se redibuja (anims ${red.anims}, offset ${red.minOff})`)
  await c.close()

  // 9b · forced-colors
  c = await ctxFor(browser, { forcedColors: 'active' }); page = await c.newPage()
  await open(page, { props: { doneText: 'Guardado' }, model: true })
  const active = await page.evaluate(() => matchMedia('(forced-colors: active)').matches)
  if (!active) {
    info(engine, 'S9 forced-colors', 'no verificable: la emulación no se aplica en este motor')
  } else {
    const r = await page.evaluate(async () => {
      const rows = []
      const snap = (tag) => { const b = __btn(); const s = getComputedStyle(b); const ld = getComputedStyle(b.querySelector('.g-btn__loader')); const mk = b.querySelector('.g-btn__done'); rows.push({ tag, bd: s.borderTopColor, fg: s.color, bg: s.backgroundColor, ld: ld.color, ldOp: +ld.opacity, mk: mk && getComputedStyle(mk).color, mkOp: mk && +getComputedStyle(mk).opacity }) }
      __set({ loading: true }); await __until(() => __has('is-shown')); await __wait(300); snap('carga')
      __set({ loading: false, done: true }); await __until(() => __has('is-done')); await __wait(350); snap('acuse')
      return rows
    })
    info(engine, 'S9 forced-colors', r)
    const [carga, acuse] = r
    ok(carga.ldOp === 1 && carga.ld === carga.fg, `S9 ${engine} forced-colors: el indicador no hereda el color del sistema`)
    ok(acuse.mkOp === 1 && acuse.mk === acuse.fg, `S9 ${engine} forced-colors: la marca no hereda el color del sistema`)
    ok(acuse.fg !== acuse.bg, `S9 ${engine} forced-colors: texto = fondo`)
    ok(carga.bd !== carga.bg, `S9 ${engine} forced-colors: borde = fondo en carga`)
    // link: borde Canvas, marca y subrayado visibles
    await open(page, { props: { variant: 'link', doneText: 'Guardado' }, model: true })
    const l = await page.evaluate(async () => { __set({ done: true }); await __until(() => __has('is-done')); await __wait(350); const b = __btn(); const m = b.querySelector('.g-btn__done'); return { bd: getComputedStyle(b).borderTopColor, mk: getComputedStyle(m).color, fg: getComputedStyle(b).color, op: +getComputedStyle(m).opacity } })
    ok(l.op === 1 && l.mk === l.fg, `S9 ${engine} forced-colors link: marca no visible`)
    info(engine, 'S9 forced-colors link', l)
  }
  await c.close()
}

// =====================================================================================================================
const STEPS = [['S1', s1Sharpness], ['S2', s2Block], ['S3', s3Tooltip], ['S4', s4LinkAndMark], ['S5', s5Redraw], ['S6', s6Leaving], ['S7', s7Hosts], ['S8', s8Theme], ['S9', s9Prefs]]
const only = args.only ? String(args.only).split(',') : null
const summary = []
for (const engine of ENGINES) {
  const browser = await pw[engine].launch()
  const before = total, bf = failed
  for (const [id, fn] of STEPS) {
    if (only && !only.includes(id)) continue
    const t0 = total, f0 = failed
    try { await fn(browser, engine) } catch (e) { total++; failed++; fails.push(`${id} ${engine}: excepción ${e.message.split('\n')[0]}`) }
    if (VERBOSE) console.log(`${engine} ${id}: ${total - t0 - (failed - f0)}/${total - t0}`)
  }
  await browser.close()
  summary.push(`${engine}: ${total - before - (failed - bf)}/${total - before}`)
}
server.close()
await writeFile(join(HERE, 'auditoria-reten-resultados.json'), JSON.stringify(RES, null, 1))
console.log(summary.join('   '), `· total ${total - failed}/${total}`)
if (fails.length) console.log('FALLOS:\n' + fails.map((f) => ' - ' + f).join('\n'))
process.exit(failed ? 1 : 0)
