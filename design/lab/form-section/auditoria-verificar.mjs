// Auditoría de coco (paso 5) de GFormSection Fase 3 sobre el COMPONENTE REAL: GFormSection.vue + dist/grana.css en el
// playground (packages/vue/playground): «Alta de paciente» #fm-medium (dentro de GForm: «Información básica» fija con una
// acción ghost, «Contacto» opcional al lado con divider, «Signos vitales», «Datos fiscales» agregable, «Preferencias»
// plegable con summary) y el marco #fx-frame fuera de GForm (#fx-1 fija, #fx-2 plegable con acción y summary, #fx-3
// agregable; las tres auto y con divider). Más una página propia con la UMD real (Vue + dist/grana.umd.js) para lo que el
// playground no tiene: lead dentro del botón, readonly con una agregable oculta, primera sección plegada con divider, RTL.
// Temas: defecto claro y oscuro, el de la auditoría de radio-group (@grana/cli: brand #0B1F4D, radius 0, shape pill) claro
// y oscuro, el «Tema de prueba» del playground claro y oscuro, y los once generados de dark-color-presence claro y oscuro.
// Comprueba: dist/grana.css sin literales ni respaldos en las reglas de g-form-section; marcado real frente al que espera el
// CSS (orden de hijos, __lead dentro del botón, chevron e icono de estado hijos directos, is-ready tras la primera medida,
// [hidden]); sin transición al cargar; cerrada y sin agregar sin hueco; Δ0 del botón/sección y del desplazamiento con clic
// real al abrir, plegar, agregar y quitar (a media vista, pegado arriba, RTL, al lado); intermedios; is-instant al enviar
// con error en una plegada y desde el enlace de GErrorSummary (sin transición, sin desplazamiento interno); tipografía del
// botón = título fijo; sangría del texto; chevron (dirección LTR/RTL, giro con fast); divider (ritmo #192 40/35/30 dentro y
// 40 fuera, centrado, a todo el ancho, sin línea en la primera, con plegadas y abiertas); L9 a 320 (Fase 1 y Fase 3) y la
// acción ghost abajo; al lado (1 : 2, título = primera etiqueta ±1px) en #fm-medium y #fx-frame; 320 sin desborde;
// contraste (título, botón, estado, resumen, descripción, chevron, «Agregar …»); anillo del botón sin mover el título;
// objetivo 24/44; quitar sin salto a gris con los controles reales; confirmación alertdialog sm con «Cancelar» enfocado;
// movimiento reducido; forced-colors (Chromium); consola limpia.
// Ejecutar desde la raíz del repo con dist/ reconstruido: node design/lab/form-section/auditoria-verificar.mjs
// Opcional: --engines=chromium   --verbose
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
    let p = normalize(join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname)))
    if (!p.startsWith(ROOT)) throw new Error('fuera')
    if (p.endsWith('/')) p += 'index.html'
    const body = await readFile(p)
    res.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream' }).end(body)
  } catch { if (!res.headersSent) res.writeHead(404).end() }
})
await new Promise((r) => server.listen(0, '127.0.0.1', r))
const ORIGIN = `http://127.0.0.1:${server.address().port}`
const PLAY = ORIGIN + '/packages/vue/playground/index.html'
const VUE = await readFile(join(ROOT, 'node_modules/vue/dist/vue.global.js'), 'utf8')
const AUDIT_CSS = await readFile(join(ROOT, 'design/lab/radio-group/auditoria-tema.css'), 'utf8')
const GEN = ['amazon', 'apple', 'caracol-purpura', 'github', 'grana', 'linear', 'lustre', 'medium', 'notion', 'spotify', 'stripe']
const GEN_CSS = Object.fromEntries(await Promise.all(GEN.map(async (g) => [g, await readFile(join(ROOT, `design/lab/tema-oscuro/dark-color-presence/generated/${g}.css`), 'utf8')])))

let total = 0, failed = 0
const fails = []
let ENGINE = 'static'
let PHASE = ''
const ok = (cond, msg) => { total++; if (!cond) { failed++; fails.push(`[${ENGINE}] ${msg}`) } if (args.verbose) console.log(cond ? 'ok ' : 'NO ', ENGINE, msg) }
// Pendientes de otro rol (anotados en auditoria.md): se miden y se informan, sin contar como fallo de esta auditoría
const pending = []
const pend = (cond, msg) => { if (!cond) pending.push(`[${ENGINE}] ${msg}`); if (args.verbose) console.log(cond ? 'ok ' : 'PEND', ENGINE, msg) }
const near = (a, b, t = 1) => Math.abs(a - b) <= t
const info = []
const note = (m) => info.push(`[${ENGINE}] ${m}`)
const inter = (tops) => { const a = tops[0], z = tops[tops.length - 1]; return new Set(tops.filter((v) => Math.abs(v - a) > 1 && Math.abs(v - z) > 1)).size }

/* ---------- 0 · CSS publicado (dist/grana.css): reglas de g-form-section sin literales ni respaldos ---------- */
{
  const dist = await readFile(join(ROOT, 'packages/vue/dist/grana.css'), 'utf8')
  ok(dist.includes('g-form-section__panel') && dist.includes('g-form-section__toggle') && dist.includes('g-form-section__divider'), 'dist: faltan reglas de la Fase 3 (__panel, __toggle, __divider)')
  const css = dist.replace(/\/\*[\s\S]*?\*\//g, '')
  const rules = []
  const stack = []
  for (let i = 0, buf = ''; i < css.length; i++) {
    const ch = css[i]
    if (ch === '{') { stack.push(buf.trim()); buf = '' }
    else if (ch === '}') { const s = stack.pop(); if (/\.g-form-section/.test(s || '')) rules.push({ sel: s, body: buf }); buf = '' }
    else buf += ch
  }
  // Las reglas de otras hojas que solo EXCLUYEN el panel de una agregable (:where de §14) no son de GFormSection
  const own = rules.filter((r) => !/:where\(:not\(\.g-form-section--mode-addable:not\(\.is-open\) > \.g-form-section__panel \*\)\)/.test(r.sel))
  ok(own.length >= 40, `dist: reglas de g-form-section (${own.length})`)
  for (const r of own) {
    const b = r.body.replace(/ButtonText/g, '')
    ok(!/#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|lab|lch)\(/.test(b), `dist ${r.sel}: color literal`)
    ok(!/var\(\s*--[\w-]+\s*,/.test(b), `dist ${r.sel}: var() con respaldo`)
    const lit = [...b.matchAll(/(-?\d*\.?\d+)(px|ms|s|rem|em)\b/g)].map((m) => m[0]).filter((x) => !['0px', '0s', '24px', '44px'].includes(x))
    ok(!lit.length, `dist ${r.sel}: literales ${lit}`)
    ok(!/!important/.test(b), `dist ${r.sel}: !important`)
    const vars = [...b.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1])
    ok(vars.every((v) => v.startsWith('--g-') || v.startsWith('--_')), `dist ${r.sel}: var() ajena`)
  }
  ok(/@layer grana\.components[\s\S]*\.g-form-section__panel/.test(css), 'dist: GFormSection.css dentro de la capa grana.components')
}

/* ---------- Funciones de página ---------- */
const INIT = () => {
  window.__frames = 0
  const tick = () => { window.__frames++; requestAnimationFrame(tick) }
  requestAnimationFrame(tick)
  window.__log = new Map()
  window.__runs = []
  document.addEventListener('transitionrun', (e) => {
    const t = e.target
    if (t && t.classList && (t.classList.contains('g-form-section__panel') || (t.closest && t.closest('.g-form-section__chevron')))) window.__runs.push({ id: t.closest('.g-form-section')?.id, p: e.propertyName, f: window.__frames, chev: !t.classList.contains('g-form-section__panel') })
  }, true)
  new MutationObserver((ms) => {
    for (const m of ms) {
      if (m.type === 'childList') {
        for (const n of m.addedNodes) {
          if (n.nodeType !== 1) continue
          for (const el of [n, ...n.querySelectorAll('.g-form-section')]) if (el.classList.contains('g-form-section') && !window.__log.has(el)) window.__log.set(el, [{ f: window.__frames, cls: el.className }])
        }
      } else if (m.target.classList?.contains('g-form-section')) {
        const l = window.__log.get(m.target) || []
        l.push({ f: window.__frames, cls: m.target.className })
        window.__log.set(m.target, l)
      }
    }
  }).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] })
}
const HELPERS = () => {
  document.documentElement.style.scrollBehavior = 'auto'
  const parse = (s) => {
    let m = s.match(/rgba?\(([^)]+)\)/)
    if (m) { const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p[3] ?? 1] }
    m = s.match(/color\(srgb ([^)]+)\)/)
    if (m) { const p = m[1].split(/[\s/]+/).filter(Boolean).map(Number); return [p[0] * 255, p[1] * 255, p[2] * 255, p[3] ?? 1] }
    return null
  }
  const cv = document.createElement('canvas').getContext('2d', { willReadFrequently: true })
  const rgba = (s) => { const d = parse(s); if (d) return d; cv.clearRect(0, 0, 1, 1); cv.fillStyle = '#000'; cv.fillStyle = s; cv.fillRect(0, 0, 1, 1); const x = cv.getImageData(0, 0, 1, 1).data; return [x[0], x[1], x[2], x[3] / 255] }
  const over = (t, b) => { const a = t[3]; return [t[0] * a + b[0] * (1 - a), t[1] * a + b[1] * (1 - a), t[2] * a + b[2] * (1 - a), 1] }
  const bgOf = (el) => {
    const layers = []
    for (let n = el; n; n = n.parentElement) { const c = rgba(getComputedStyle(n).backgroundColor); if (c[3] > 0) { layers.push(c); if (c[3] >= 1) break } }
    let base = rgba(getComputedStyle(document.body).backgroundColor)
    if (base[3] < 1) base = over(base, rgba(getComputedStyle(document.documentElement).backgroundColor))
    if (base[3] < 1) base = over(base, [255, 255, 255, 1])
    for (let i = layers.length - 1; i >= 0; i--) base = over(layers[i], base)
    return base
  }
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]) }
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return +((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)).toFixed(2) }
  window.__ratio = (el, prop = 'color') => { const bg = bgOf(el.parentElement && prop !== 'color' ? el.parentElement : el); return ratio(over(rgba(getComputedStyle(el)[prop]), bg), bg) }
  window.__ringRatio = (el) => { const bg = bgOf(el); return ratio(over(rgba(getComputedStyle(el).outlineColor), bg), bg) }
  window.__contrast = () => {
    const pick = (sel) => [...document.querySelectorAll(sel)].filter((e) => e.closest('#fm-medium, #fx-frame') && e.getClientRects().length && getComputedStyle(e).visibility === 'visible')
    const min = (sel, prop) => { const l = pick(sel); return l.length ? Math.min(...l.map((e) => __ratio(e, prop))) : null }
    return { title: min('.g-form-section__title'), toggle: min('.g-form-section__toggle-text'), desc: min('.g-form-section__description'), summary: min('.g-form-section__summary-text'),
      status: min('.g-form-section__status'), chevron: min('.g-form-section__chevron'), add: min('.g-form-section__add-button'), addBorder: min('.g-form-section__add-button', 'borderTopColor'),
      line: min('.g-form-section__divider', 'borderTopColor'), nStatus: pick('.g-form-section__status').length, nSummary: pick('.g-form-section__summary-text').length, nAdd: pick('.g-form-section__add-button').length }
  }
  window.__app = () => document.getElementById('app').__vue_app__._instance.proxy
  window.__fm = () => window.__app().fm
  window.__finishAll = () => document.getAnimations().forEach((a) => { try { a.finish() } catch {} })
  window.__frame = (n = 2) => new Promise((r) => { const f = () => (--n > 0 ? requestAnimationFrame(f) : r()); requestAnimationFrame(f) })
  window.__st = (id) => {
    const sec = document.getElementById(id); const p = sec.querySelector(':scope > .g-form-section__panel'); const cs = getComputedStyle(p); const body = p.firstElementChild
    const head = sec.querySelector(':scope > .g-form-section__header, :scope > .g-form-section__add')
    return { inert: p.hasAttribute('inert'), disabled: body.disabled === true, vis: cs.visibility, op: +cs.opacity, h: +p.getBoundingClientRect().height.toFixed(2), mt: parseFloat(cs.marginBlockStart),
      gap: parseFloat(getComputedStyle(sec).rowGap) || 0, ovf: getComputedStyle(body).overflowY, anim: sec.classList.contains('is-animating'), open: sec.classList.contains('is-open'), side: sec.classList.contains('is-header-side'),
      instant: sec.classList.contains('is-instant'), secH: sec.getBoundingClientRect().height, headH: head.getBoundingClientRect().height, secBottom: sec.getBoundingClientRect().bottom, headBottom: head.getBoundingClientRect().bottom, bodyScroll: body.scrollTop }
  }
  window.__pause = (id, frac) => {
    const el = document.querySelector('#' + id + ' > .g-form-section__panel'); const as = el.getAnimations()
    const live = as.filter((a) => a.playState !== 'finished' && a.playState !== 'idle'); const L = live.length ? live : as
    const main = [...L].reverse().find((a) => a.transitionProperty === 'grid-template-rows') || [...L].reverse().find((a) => a.transitionProperty === 'opacity')
    if (!main) return null; const t = main.effect.getComputedTiming(); const at = (t.delay || 0) + t.duration * frac
    L.forEach((a) => { a.pause(); a.currentTime = at }); return L.map((a) => a.transitionProperty)
  }
  window.__track = (sel, ms) => new Promise((res) => {
    const el = document.querySelector(sel); const r0 = el.getBoundingClientRect(); const s0 = scrollY
    let dt = 0, dl = 0, ds = 0, n = 0; const tops = []; const t0 = performance.now()
    ;(function f() { const r = el.isConnected ? el.getBoundingClientRect() : r0; dt = Math.max(dt, Math.abs(r.top - r0.top)); dl = Math.max(dl, Math.abs(r.left - r0.left)); ds = Math.max(ds, Math.abs(scrollY - s0)); tops.push(+r.top.toFixed(1)); n++
      if (performance.now() - t0 < ms) requestAnimationFrame(f); else res({ dt, dl, ds, n, tops }) })()
  })
  window.__dir = (id) => { const g = document.querySelector('#' + id + ' .g-form-section__chevron > .g-icon'); const cs = getComputedStyle(g)
    const r = cs.rotate === 'none' ? 0 : parseFloat(cs.rotate) * Math.PI / 180; const s = cs.scale === 'none' ? [1, 1] : cs.scale.split(' ').map(Number)
    const x = s[0] * Math.cos(r), y = s[0] * Math.sin(r)
    return Math.abs(x) > Math.abs(y) ? (x > 0 ? 'right' : 'left') : (y > 0 ? 'down' : 'up') }
  window.__len = (tok) => { const d = document.createElement('div'); d.style.cssText = 'position:absolute;visibility:hidden;inline-size:var(' + tok + ')'; document.body.append(d); const w = d.getBoundingClientRect().width; d.remove(); return w }
  window.__rtl = (el) => getComputedStyle(el).direction === 'rtl'
  window.__start = (el) => { const r = el.getBoundingClientRect(); return __rtl(el) ? r.right : r.left }
  window.__textStart = (el) => { const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode()) && !n.textContent.trim()); const rg = document.createRange(); rg.selectNodeContents(n); const r = rg.getClientRects()[0]; return __rtl(el) ? r.right : r.left }
  window.__frameOf = (id) => document.getElementById(id).closest('[data-frame]')
  // Línea de divider de cada sección de un anfitrión: separación con la anterior, centrado y ancho
  window.__dividers = (hostSel) => {
    const first = document.querySelector(hostSel + ' .g-form-section'); const host = first.parentElement
    const secs = [...host.children].filter((s) => s.classList.contains('g-form-section') && !s.hidden)
    const sg = __len('--g-form-section-gap')
    return secs.map((s, i) => {
      const hr = s.querySelector(':scope > .g-form-section__divider'); if (!hr) return { id: s.id, i, none: true }
      const r = hr.getBoundingClientRect(); const cs = getComputedStyle(hr)
      if (i === 0) return { id: s.id, i, first: true, shown: cs.display !== 'none' && r.height > 0 }
      const prev = secs[i - 1].getBoundingClientRect(), cur = s.getBoundingClientRect()
      return { id: s.id, i, dist: cur.top - prev.bottom, mid: (cur.top + prev.bottom) / 2, line: r.top + r.height / 2, w: r.width, sw: cur.width, bw: parseFloat(cs.borderTopWidth), d: parseFloat(getComputedStyle(s).getPropertyValue('--_d')), sg, shown: cs.display !== 'none' }
    })
  }
}

const settle = (p) => p.evaluate(() => new Promise((r) => { let n = 4; const f = () => (--n ? requestAnimationFrame(f) : setTimeout(r, 30)); requestAnimationFrame(f) }))
const IDS = ['fm-sec-basica', 'fm-sec-contacto', 'fm-sec-vitales', 'fm-sec-fiscal', 'fm-sec-pref', 'fx-1', 'fx-2', 'fx-3']
const settled = (p, ids = IDS) => p.waitForFunction((is) => is.every((i) => !document.getElementById(i).classList.contains('is-animating')), [].concat(ids), { timeout: 4000 })
const finish = async (p, ids) => { await p.evaluate(() => window.__finishAll()); await settled(p, ids); await settle(p) }
// Las transiciones de color de GBtn y de los campos se terminan: se mide el color del tema, no uno a medio camino
const setTheme = (p, css, dark) => p.evaluate(([c, d]) => { document.getElementById('theme').textContent = c; document.documentElement.dataset.theme = d ? 'dark' : 'light' }, [css, dark]).then(() => settle(p)).then(() => p.evaluate(() => window.__finishAll())).then(() => settle(p))
const bench = async (p, { w, density }) => {
  if (density !== undefined) await p.selectOption('#fm-bench-density', density)
  if (w !== undefined) await p.selectOption('#fm-bench-w', w)
  await p.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 60))))))
}
// Abre o pliega por el modelo de la aplicación (v-model:open), sin animación que esperar
const setOpen = async (p, key, v) => { await p.evaluate(([k, x]) => { window.__fm()[k] = x }, [key, v]); await p.evaluate(() => new Promise((r) => requestAnimationFrame(r))); await finish(p) }
const setAdded = async (p, id, v) => {
  const now = await p.evaluate((i) => document.getElementById(i).classList.contains('is-added'), id)
  if (now === v) return
  await p.locator(`#${id} ${v ? '.g-form-section__add-button' : '.g-form-section__remove'}`).click()
  const dlg = await p.evaluate((i) => document.querySelector('#' + i + ' > .g-form-section__confirm')?.open, id)
  if (dlg) await p.locator(`#${id} > .g-form-section__confirm .g-btn--color-danger`).click()
  await p.evaluate(() => new Promise((r) => requestAnimationFrame(r))); await finish(p)
}

async function openPlay(browser, { reduced = false, forced = false, width = 1280, height = 900, touch = false } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, reducedMotion: reduced ? 'reduce' : 'no-preference', ...(forced ? { forcedColors: 'active' } : {}), ...(touch ? { hasTouch: true } : {}) })
  const p = await ctx.newPage()
  p.errs = []
  p.on('console', (m) => { const t = m.text(); if (['error', 'warning'].includes(m.type()) && !/ResizeObserver loop|favicon/.test(t)) p.errs.push(`(${PHASE}) ${t}`) })
  p.on('pageerror', (e) => { if (!/ResizeObserver loop/.test(e.message)) p.errs.push(String(e)) })
  await p.route('https://unpkg.com/vue@3/dist/vue.global.js', (r) => r.fulfill({ status: 200, contentType: 'text/javascript', body: VUE }))
  await p.addInitScript(INIT)
  await p.goto(PLAY)
  await p.waitForSelector('#fm-sec-pref.is-ready')
  await p.waitForSelector('#fx-2.is-ready')
  await p.evaluate(() => document.fonts.ready)
  await p.evaluate(HELPERS)
  await settle(p)
  return p
}

// Página propia con la UMD real: lo que el playground no cubre
const UMD_PAGE = `<!doctype html><html lang="es"><head><meta charset="utf-8"><link rel="stylesheet" href="/packages/vue/dist/grana.css"><link rel="stylesheet" href="/packages/vue/dist/fonts.css">
<style>body{margin:0;padding:24px;background:var(--g-color-bg);color:var(--g-color-text);font-family:var(--g-font-ui)} .host{inline-size:640px;margin-block-end:48px}</style></head><body><div id="app"></div>
<script src="/node_modules/vue/dist/vue.global.prod.js"></script><script src="/packages/vue/dist/grana.umd.js"></script><script src="/packages/vue/playground/lucide-icons.js"></script><script>
  const { createApp, reactive, h } = Vue
  const G = Grana
  const labels = { optional: '(opcional)', sectionOptional: 'Opcional', sectionErrors: (n) => n === 1 ? '1 error' : n + ' errores', error: 'Error: ' }
  const add = { add: 'Agregar acompañante', remove: 'Quitar acompañante', removeTitle: '¿Quitar?', removeConfirm: 'Quitar', removeCancel: 'Cancelar' }
  const field = (id) => h(G.GFormLayout, null, () => h(G.GInput, { id: id + '-in', label: 'Campo de ' + id, name: id }))
  const icon = () => h(G.GIcon, { name: 'map-pin' })
  const st = reactive({ pOpen: false })
  window.__u = st
  createApp({ render: () => [
    h('div', { class: 'host', id: 'u-lead-host' }, h(G.GForm, { 'aria-label': 'Con lead', labels }, () => [
      h(G.GFormSection, { id: 'u-static-lead', title: 'Dirección' }, { lead: icon, default: () => field('a') }),
      h(G.GFormSection, { id: 'u-col-lead', title: 'Dirección de facturación con un título que ocupa dos líneas a este ancho de prueba', mode: 'collapsible', summary: 'CDMX · 06700', description: 'Si es distinta de la del paciente.', divider: true }, { lead: icon, default: () => field('b') })
    ])),
    h('div', { class: 'host', id: 'u-rtl-host', dir: 'rtl' }, h(G.GForm, { 'aria-label': 'RTL', labels }, () => [
      h(G.GFormSection, { id: 'u-rtl-static', title: 'العنوان' }, { default: () => field('c') }),
      h(G.GFormSection, { id: 'u-rtl-col', title: 'التفضيلات', mode: 'collapsible', summary: 'العربية', description: 'كيف نبلغك.', divider: true }, { lead: icon, default: () => field('d') })
    ])),
    h('div', { class: 'host', id: 'u-ro-host' }, h(G.GForm, { 'aria-label': 'Solo lectura', labels, readonly: true }, () => [
      h(G.GFormSection, { id: 'u-ro-add', title: 'Acompañante', mode: 'addable', labels: add, divider: true }, { default: () => field('e') }),
      h(G.GFormSection, { id: 'u-ro-2', title: 'Datos', divider: true }, { default: () => field('f') }),
      h(G.GFormSection, { id: 'u-ro-3', title: 'Más datos', divider: true }, { default: () => field('g') })
    ])),
    h('div', { class: 'host', id: 'u-first-host' }, h(G.GForm, { 'aria-label': 'Primera plegada', labels }, () => [
      h(G.GFormSection, { id: 'u-first', title: 'Primera plegada', mode: 'collapsible', open: st.pOpen, 'onUpdate:open': (v) => { st.pOpen = v }, divider: true }, { default: () => field('h') }),
      h(G.GFormSection, { id: 'u-second', title: 'Segunda', divider: true }, { default: () => field('i') })
    ]))
  ] }).use(G).use(G.createIcons(Object.values(window.LUCIDE_STATIC))).mount('#app')
  document.documentElement.dataset.ready = ''
</script></body></html>`

for (const engine of ENGINES) {
  ENGINE = engine
  const browser = await pw[engine].launch()
  let p = await openPlay(browser)

  PHASE = '1'
  /* 1 · Marcado real frente al que espera el CSS; is-ready tras la primera medida; sin transición al cargar */
  {
    const m = await p.evaluate((ids) => ids.map((id) => {
      const s = document.getElementById(id); const kids = [...s.children].map((k) => k.classList.contains('g-form-section__divider') ? 'divider' : k.classList.contains('g-form-section__confirm') ? 'confirm' : (k.className.match(/g-form-section__([\w-]+)/) || [, k.tagName])[1])
      const hd = s.querySelector(':scope > .g-form-section__header')
      const hk = hd ? [...hd.children].map((k) => (k.className.match(/g-form-section__([\w-]+)/) || [, k.tagName])[1]) : null
      const hn = hd ? [...hd.querySelector(':scope > .g-form-section__heading').children].map((k) => k.classList.contains('g-badge') ? 'badge' : (k.className.match(/g-form-section__([\w-]+)/) || [, k.tagName])[1]) : null
      const tg = s.querySelector('.g-form-section__toggle')
      const panel = s.querySelector(':scope > .g-form-section__panel')
      const hr = s.querySelector(':scope > .g-form-section__divider')
      const log = window.__log.get(s) || []
      const at = (c) => { const e = log.find((x) => x.cls.split(' ').includes(c)); return e ? e.f : null }
      return { id, mode: (s.className.match(/--mode-(\w+)/) || [])[1], kids, hk, hn, born: log[0]?.f, bornCls: log[0]?.cls, readyAt: at('is-ready'), sideAt: at('is-header-side'), belowAt: at('is-actions-below'),
        toggle: tg ? { parent: tg.parentElement.tagName, only: tg.parentElement.children.length === 1, type: tg.type, kids: [...tg.children].map((k) => (k.className.match(/g-form-section__([\w-]+)/) || [])[1]), chevSvg: tg.querySelector(':scope > .g-form-section__chevron > svg.g-icon') !== null } : null,
        panel: panel ? { only: panel.children.length === 1, body: panel.firstElementChild.tagName, bodyCls: panel.firstElementChild.className, role: panel.firstElementChild.getAttribute('role'), inert: panel.hasAttribute('inert'), disabled: panel.firstElementChild.disabled === true } : null,
        hr: hr ? { cls: hr.className, aria: hr.getAttribute('aria-hidden'), tag: hr.tagName } : null, cls: s.className }
    }), IDS)
    for (const s of m) {
      const divider = s.hr ? ['divider'] : []
      const exp = s.mode === 'static' ? [...divider, 'header', 'body'] : s.mode === 'collapsible' ? [...divider, 'header', 'panel'] : [...divider, s.cls.includes('is-added') ? 'header' : 'add', 'panel', 'confirm']
      ok(JSON.stringify(s.kids) === JSON.stringify(exp), `marcado ${s.id}: hijos de la raíz en el orden que espera el CSS (${s.kids} vs ${exp})`)
      if (s.hk) {
        const order = ['heading', 'summary', 'description', 'actions', 'help']
        ok(s.hk.every((k) => order.includes(k)) && s.hk.map((k) => order.indexOf(k)).every((v, i, a) => !i || v > a[i - 1]), `marcado ${s.id}: hijos de __header en orden (${s.hk})`)
        ok(s.hn[0] === 'title' || (s.hn[0] === 'lead' && s.hn[1] === 'title'), `marcado ${s.id}: __heading (lead) + título (+ insignia) (${s.hn})`)
      }
      if (s.hr) ok(s.hr.tag === 'HR' && s.hr.aria === 'true' && /g-divider--emphasis-subtle/.test(s.hr.cls) && /g-divider--inset-none/.test(s.hr.cls), `marcado ${s.id}: divider = GDivider hr decorativo subtle inset none (${s.hr.cls})`)
      if (s.mode === 'collapsible') ok(s.toggle && /^H[2-6]$/.test(s.toggle.parent) && s.toggle.only && s.toggle.type === 'button' && s.toggle.kids.join() === 'chevron,toggle-text' && s.toggle.chevSvg, `marcado ${s.id}: hN > button (único hijo) > chevron (svg hijo directo) + toggle-text (${JSON.stringify(s.toggle)})`)
      if (s.panel) ok(s.panel.only && s.panel.bodyCls === 'g-form-section__body' && (s.mode === 'addable' ? s.panel.body === 'FIELDSET' && s.panel.role === 'none' : s.panel.body === 'DIV'), `marcado ${s.id}: __panel > __body único hijo (${JSON.stringify(s.panel)})`)
      if (s.mode !== 'static') {
        ok(s.born !== undefined && s.readyAt !== null && s.readyAt - s.born >= 2 && !/is-ready/.test(s.bornCls), `marcado ${s.id}: is-ready ausente al nacer y puesto ≥ 2 cuadros después (nace ${s.born}, listo ${s.readyAt})`)
        if (s.sideAt !== null) ok(s.sideAt < s.readyAt, `marcado ${s.id}: is-header-side (cuadro ${s.sideAt}) pintado antes de is-ready (cuadro ${s.readyAt})`)
      } else ok(s.readyAt === null, `marcado ${s.id}: la fija no lleva is-ready (ninguna regla de la fija depende de él)`)
    }
    const runs = await p.evaluate(() => window.__runs)
    ok(runs.length === 0, `al cargar no corre ninguna transición de panel ni de chevron (${JSON.stringify(runs.slice(0, 4))})`)
    // Página propia: lead dentro del botón (después del chevron), lead de la fija antes del hN, [hidden] en readonly
    const q = await browser.newPage({ viewport: { width: 1280, height: 900 } })
    q.errs = []
    q.on('console', (mm) => { if (['error', 'warning'].includes(mm.type()) && !/ResizeObserver loop/.test(mm.text())) q.errs.push(mm.text()) })
    q.on('pageerror', (e) => q.errs.push(String(e)))
    await q.route(ORIGIN + '/__umd.html', (r) => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: UMD_PAGE }))
    await q.goto(ORIGIN + '/__umd.html')
    await q.waitForSelector('html[data-ready]')
    await q.waitForSelector('#u-col-lead.is-ready')
    await q.evaluate(() => document.fonts.ready)
    await q.evaluate(HELPERS)
    await settle(q)
    const u = await q.evaluate(() => {
      const tg = document.querySelector('#u-col-lead .g-form-section__toggle')
      const st = document.querySelector('#u-static-lead .g-form-section__heading')
      return { tg: [...tg.children].map((k) => (k.className.match(/g-form-section__([\w-]+)/) || [])[1]), leadAria: tg.querySelector('.g-form-section__lead').getAttribute('aria-hidden'),
        headingKids: [...document.querySelector('#u-col-lead .g-form-section__heading').children].map((k) => k.className.split(' ')[0]),
        st: [...st.children].map((k) => (k.className.match(/g-form-section__([\w-]+)/) || [])[1]), name: tg.textContent.trim() }
    })
    ok(u.tg.join() === 'chevron,lead,toggle-text' && u.leadAria === 'true', `marcado collapsible con lead: chevron, lead (aria-hidden) y texto dentro del botón (${u.tg})`)
    ok(u.headingKids.join() === 'g-form-section__title' && u.st.join() === 'lead,title', `marcado: en collapsible el lead no está fuera del botón; en static va antes del hN (${u.headingKids} · ${u.st})`)
    // Sangría con lead: resumen y descripción alineados con el ICONO (lo primero tras el chevron); chevron y lead centrados en la primera línea
    for (const id of ['u-col-lead', 'u-rtl-col']) {
      const a = await q.evaluate((i) => { const s = document.getElementById(i); const ch = s.querySelector('.g-form-section__chevron'); const ld = s.querySelector('.g-form-section__toggle .g-form-section__lead'); const tx = s.querySelector('.g-form-section__toggle-text')
        const sum = s.querySelector('.g-form-section__summary'); const d = s.querySelector(':scope > .g-form-section__header > .g-form-section__description')
        const mid = (e) => { const r = e.getBoundingClientRect(); return r.top + r.height / 2 }
        const line1 = tx.getBoundingClientRect().top + parseFloat(getComputedStyle(tx).lineHeight) / 2
        const lines = Math.round(tx.getBoundingClientRect().height / parseFloat(getComputedStyle(tx).lineHeight))
        return { rtl: __rtl(s), lead: __start(ld), sum: __start(sum), desc: __start(d), chevMid: mid(ch.firstElementChild), leadMid: mid(ld.firstElementChild), line1, lines, dir: __dir(i) } }, id)
      ok(near(a.sum, a.lead, 0.5) && near(a.desc, a.lead, 0.5), `${id}${a.rtl ? ' (RTL)' : ''}: resumen y descripción alineados con el lead (${a.sum.toFixed(1)}, ${a.desc.toFixed(1)} vs ${a.lead.toFixed(1)})`)
      ok(near(a.chevMid, a.line1, 0.75) && near(a.leadMid, a.line1, 0.75), `${id}: chevron y lead centrados en la primera línea del título (${a.chevMid.toFixed(2)}, ${a.leadMid.toFixed(2)} vs ${a.line1.toFixed(2)}; ${a.lines} línea(s))`)
      ok(a.dir === (a.rtl ? 'left' : 'right'), `${id}: chevron plegado apunta al texto (${a.dir})`)
    }
    // readonly: la agregable sin agregar es [hidden] y no se ve; la siguiente no dibuja línea (es la primera visible)
    const ro = await q.evaluate(() => { const s = document.getElementById('u-ro-add'); const f = s.parentElement
      return { hidden: s.hidden, disp: getComputedStyle(s).display, h: s.getBoundingClientRect().height, d: __dividers('#u-ro-host'), top: document.getElementById('u-ro-2').getBoundingClientRect().top - f.getBoundingClientRect().top - parseFloat(getComputedStyle(f).paddingBlockStart) } })
    ok(ro.hidden && ro.disp === 'none' && ro.h === 0, `readonly: la agregable sin agregar va [hidden] y no ocupa nada (${JSON.stringify({ ...ro, d: undefined })})`)
    ok(ro.d[0].first && !ro.d[0].shown && ro.d[1].shown && near(ro.d[1].dist, ro.d[1].sg, 1), `readonly: la primera visible no dibuja línea; la siguiente sí, con el ritmo (${JSON.stringify(ro.d)})`)
    // Primera sección plegada con divider: sin línea, cerrada y abierta; la segunda con el ritmo y centrada
    for (const v of [false, true]) {
      await q.evaluate((x) => { window.__u.pOpen = x }, v); await q.evaluate(() => new Promise((r) => requestAnimationFrame(r))); await q.evaluate(() => window.__finishAll()); await settle(q)
      const d = await q.evaluate(() => __dividers('#u-first-host'))
      ok(d[0].first && !d[0].shown && near(d[1].dist, d[1].sg, 1) && near(d[1].line, d[1].mid, 0.5), `primera plegada ${v ? 'abierta' : 'cerrada'} con divider: sin línea; la segunda a section-gap y centrada (${JSON.stringify(d)})`)
    }
    ok(!q.errs.length, `consola (página UMD): ${[...new Set(q.errs)].slice(0, 4).join(' | ')}`)
    await q.close()
  }

  PHASE = '2'
  /* 2 · Cerrada y sin agregar sin hueco; la tipografía del botón = la del título fijo */
  {
    await setOpen(p, 'prefOpen', false)
    for (const id of ['fm-sec-pref', 'fm-sec-fiscal', 'fx-2', 'fx-3']) {
      const s = await p.evaluate((i) => __st(i), id)
      ok(s.inert && s.vis === 'hidden' && s.op === 0 && s.h === 0 && !s.open, `${id} cerrada: inert, hidden, altura 0 (${JSON.stringify(s)})`)
      ok(s.side ? s.mt === 0 : near(s.mt, -s.gap, 0.01) && s.gap > 0, `${id} cerrada: margen ${s.side ? '0 al lado' : '= −gap propio'} (${s.mt} / ${s.gap})`)
      ok(near(s.secBottom, s.headBottom, 0.5), `${id} cerrada: la sección acaba donde su encabezado o «Agregar …», sin hueco (${(s.secBottom - s.headBottom).toFixed(2)})`)
    }
    const t = await p.evaluate(() => { const fixed = document.querySelector('#fm-sec-vitales .g-form-section__title'); const col = document.querySelector('#fm-sec-pref .g-form-section__title'); const tg = col.firstElementChild
      const f = (e) => { const c = getComputedStyle(e); return [c.fontSize, c.fontWeight, c.lineHeight, c.letterSpacing, c.fontFamily, c.color].join('|') }
      return { st: f(fixed), tg: f(tg), txt: f(tg.querySelector('.g-form-section__toggle-text')), hs: fixed.getBoundingClientRect().height, hc: col.getBoundingClientRect().height, bg: getComputedStyle(tg).backgroundColor, b: getComputedStyle(tg).borderTopWidth, pad: getComputedStyle(tg).paddingTop } })
    ok(t.st === t.tg && t.st === t.txt, `el botón y su texto = tipografía y color del título fijo (${t.st} | ${t.tg})`)
    ok(near(t.hs, t.hc, 0.01), `título plegable de una línea = título fijo (${t.hc} vs ${t.hs})`)
    ok(/rgba\(0, 0, 0, 0\)|transparent/.test(t.bg) && t.b === '0px' && t.pad === '0px', 'el botón no dibuja caja (sin fondo, borde ni relleno)')
    // Sangría del texto (resumen y descripción) en el componente real
    const a = await p.evaluate(() => ['fm-sec-pref', 'fx-2'].map((id) => { const s = document.getElementById(id); const tx = s.querySelector('.g-form-section__toggle-text')
      const sum = s.querySelector('.g-form-section__summary'); const d = s.querySelector(':scope > .g-form-section__header > .g-form-section__description'); const ac = s.querySelector(':scope > .g-form-section__header > .g-form-section__actions')
      return { id, tx: __start(tx), sum: sum && __start(sum), d: __start(d), ac: ac && __start(ac) } }))
    for (const x of a) ok(near(x.d, x.tx, 0.5) && (x.sum === null || near(x.sum, x.tx, 0.5)) && (x.ac === null || near(x.ac, x.tx, 0.5)), `${x.id}: resumen, descripción y acciones abajo alineados con el texto del título (${JSON.stringify(x)})`)
  }

  PHASE = '3'
  /* 3 · Δ0 del botón y del desplazamiento con clic real (a media vista, pegado arriba, RTL, al lado); la línea de estado */
  {
    const cases = [['fm-sec-pref', 'center', 'ltr'], ['fm-sec-pref', 'start', 'ltr'], ['fm-sec-pref', 'center', 'rtl'], ['fx-2', 'center', 'ltr'], ['fx-2', 'center', 'rtl']]
    for (const [id, where, dir] of cases) {
      await p.evaluate(([i, w, d]) => { window.__frameOf(i).dir = d; document.getElementById(i + '-toggle').scrollIntoView({ block: w }) }, [id, where, dir])
      await settle(p)
      for (const opening of [true, false]) {
        const tr = p.evaluate((s) => __track(s, 520), `#${id}-toggle`)
        await p.locator(`#${id}-toggle`).click()
        const mid = await p.evaluate((i) => __st(i), id)
        const t = await tr
        ok(t.dt === 0 && t.dl === 0 && t.ds === 0 && t.n > 5, `${id} ${where} ${dir} ${opening ? 'abrir' : 'plegar'} con clic: botón Δ0 y Δscroll 0 en cada cuadro (${JSON.stringify({ ...t, tops: undefined })})`)
        ok(mid.anim && mid.open === opening, `${id} ${dir} ${opening ? 'abrir' : 'plegar'}: is-animating durante la transición`)
        await settled(p, id)
        const s = await p.evaluate((i) => __st(i), id)
        ok(!s.anim && (opening ? s.vis === 'visible' && s.op === 1 && s.ovf === 'visible' && s.mt === 0 : s.vis === 'hidden' && s.h === 0), `${id} ${dir} ${opening ? 'abierta' : 'plegada'} asentada (${JSON.stringify(s)})`)
        // WebKit en macOS no enfoca un botón al pulsarlo con el ratón (comportamiento de la plataforma)
        const f = await p.evaluate(() => document.activeElement?.id)
        if (engine !== 'webkit') ok(f === `${id}-toggle`, `${id} ${opening ? 'abrir' : 'plegar'}: el foco se queda en el botón (${f})`)
      }
      await p.evaluate((i) => { window.__frameOf(i).dir = '' }, id)
    }
    // La línea de estado desaparece al abrir (v-if del contrato): primer cuadro de lo que hay bajo el encabezado
    for (const id of ['fm-sec-pref', 'fx-2']) {
      await p.evaluate((i) => document.getElementById(i + '-toggle').scrollIntoView({ block: 'center' }), id); await settle(p)
      const probe = id === 'fm-sec-pref' ? `#${id} > .g-form-section__panel` : '#fx-3'
      const first = (v) => p.evaluate(async ([i, sel, x]) => { const el = document.querySelector(sel); const t0 = el.getBoundingClientRect().top; const sum = document.querySelector('#' + i + ' .g-form-section__summary'); const sumH = sum ? sum.getBoundingClientRect().height + parseFloat(getComputedStyle(sum).marginBlockStart) : 0
        document.getElementById(i + '-toggle').click(); await new Promise((r) => requestAnimationFrame(r)); const panel = document.querySelector('#' + i + ' > .g-form-section__panel')
        panel.getAnimations().forEach((a) => { a.pause(); a.currentTime = 0 }); const d = el.getBoundingClientRect().top - t0; const sum2 = document.querySelector('#' + i + ' .g-form-section__summary'); const sumH2 = sum2 ? sum2.getBoundingClientRect().height + parseFloat(getComputedStyle(sum2).marginBlockStart) : 0
        window.__finishAll(); return { d: +d.toFixed(1), sumH: +Math.max(sumH, sumH2).toFixed(1) } }, [id, probe, v])
      const jo = await first(true); await settled(p, id); await settle(p)
      const jc = await first(false); await settled(p, id); await settle(p)
      note(`${id}: primer cuadro de lo de debajo del encabezado (${probe}): abrir ${jo.d}px, plegar ${jc.d}px; línea de estado ${jo.sumH}px`)
      if (id === 'fm-sec-pref') ok(near(Math.abs(jo.d), jo.sumH, 1) && near(Math.abs(jc.d), jc.sumH, 1), `${id}: el salto del primer cuadro es exactamente la línea de estado (${jo.d}/${jc.d} vs ${jo.sumH}); el botón no se mueve`)
    }
  }

  PHASE = '4'
  /* 4 · Agregar y quitar con clic real: Δ0 de la sección, foco, confirmación alertdialog */
  {
    const id = 'fm-sec-fiscal'
    await p.evaluate((i) => document.getElementById(i).scrollIntoView({ block: 'center' }), id); await settle(p)
    let tr = p.evaluate((s) => __track(s, 520), '#' + id)
    await p.locator(`#${id} .g-form-section__add-button`).click()
    let t = await tr
    await settled(p, id)
    let f = await p.evaluate(() => { const a = document.activeElement; const c = getComputedStyle(a); return { id: a.id, tag: a.tagName, fv: a.matches(':focus-visible'), w: parseFloat(c.outlineWidth), s: c.outlineStyle } })
    ok(t.dt === 0 && t.ds === 0, `agregar con clic: la sección Δ0 y Δscroll 0 (${JSON.stringify({ ...t, tops: undefined })})`)
    ok(f.id === `${id}-title`, `agregar: foco al título (${JSON.stringify(f)})`)
    note(`agregar: título enfocado por programa, :focus-visible ${f.fv}, anillo ${f.w}px ${f.s}`)
    const top = await p.evaluate((i) => { const s = document.getElementById(i); return Math.abs(s.getBoundingClientRect().top - s.querySelector(':scope > .g-form-section__header').getBoundingClientRect().top) }, id)
    ok(top < 0.5, 'agregada: el encabezado empieza en el borde superior de la sección (ocupa el sitio de «Agregar …»)')
    // Quitar sin nada que perder: directo, foco a «Agregar …»
    tr = p.evaluate((s) => __track(s, 520), '#' + id)
    await p.locator(`#${id} .g-form-section__remove`).click()
    t = await tr
    await settled(p, id)
    f = await p.evaluate(() => document.activeElement.className)
    ok(t.dt === 0 && t.ds === 0 && /g-form-section__add-button/.test(f), `quitar sin nada que perder: directo, Δ0 y foco a «Agregar …» (${JSON.stringify({ ...t, tops: undefined })}, ${f})`)
    // Con algo escrito: alertdialog sm con «Cancelar» enfocado; Esc vuelve a «Quitar …»; Confirmar → «Agregar …»
    await p.locator(`#${id} .g-form-section__add-button`).click(); await settled(p, id)
    await p.locator('#fm-sec-fiscal input[name="m-rfc"]').fill('GODE561231GR8')
    await p.locator(`#${id} .g-form-section__remove`).click()
    await p.waitForFunction((i) => document.querySelector('#' + i + ' > .g-form-section__confirm').open, id)
    await p.waitForTimeout(80)
    const d = await p.evaluate((i) => { const dl = document.querySelector('#' + i + ' > .g-form-section__confirm'); const a = document.activeElement; const c = getComputedStyle(a)
      return { role: dl.getAttribute('role'), sm: dl.classList.contains('g-dialog--size-sm'), alert: dl.classList.contains('g-dialog--alert'), last: dl === dl.parentElement.lastElementChild, focus: a.textContent.trim(), inDlg: dl.contains(a), fv: a.matches(':focus-visible'), ring: parseFloat(c.outlineWidth), modal: dl.matches(':modal') } }, id)
    ok(d.role === 'alertdialog' && d.sm && d.alert && d.last && d.modal, `confirmación: GDialog alertdialog sm modal, último hijo de la sección (${JSON.stringify(d)})`)
    ok(d.inDlg && d.focus === 'Cancelar', `confirmación: «Cancelar» enfocado al abrir (${d.focus})`)
    note(`confirmación: «Cancelar» :focus-visible ${d.fv}, anillo ${d.ring}px`)
    await p.keyboard.press('Escape')
    await p.waitForFunction((i) => !document.querySelector('#' + i + ' > .g-form-section__confirm').open, id)
    await p.waitForTimeout(80)
    f = await p.evaluate(() => document.activeElement.className)
    if (engine !== 'webkit') ok(/g-form-section__remove/.test(f), `Esc: foco de vuelta a «Quitar …» (${f})`)
    await p.locator(`#${id} .g-form-section__remove`).click()
    await p.waitForFunction((i) => document.querySelector('#' + i + ' > .g-form-section__confirm').open, id)
    await p.locator(`#${id} > .g-form-section__confirm .g-btn--color-danger`).click()
    await p.waitForFunction(() => document.activeElement && document.activeElement.classList.contains('g-form-section__add-button'), null, { timeout: 3000 }).catch(() => {})
    await settled(p, id)
    f = await p.evaluate(() => document.activeElement.className)
    ok(/g-form-section__add-button/.test(f), `confirmar: quita y el foco va a «Agregar …» (${f})`)
    // Con teclado: el foco que mueve la sección se ve (título al agregar, «Cancelar» en la confirmación, «Agregar …» al quitar)
    const ring = () => p.evaluate(() => { const a = document.activeElement; const c = getComputedStyle(a); return { cls: a.className, id: a.id, text: a.textContent.trim().slice(0, 30), fv: a.matches(':focus-visible'), w: parseFloat(c.outlineWidth), s: c.outlineStyle, r: __ringRatio(a) } })
    const visible = (r) => r.fv && r.w >= 2 && r.s === 'solid' && r.r >= 3
    // Se llega con Tab de verdad (Firefox solo pone :focus-visible a un foco por programa si el anterior lo tenía)
    const TAB = engine === 'webkit' ? 'Alt+Tab' : 'Tab', BACK = engine === 'webkit' ? 'Alt+Shift+Tab' : 'Shift+Tab'
    const reach = async (sel) => { await p.locator(sel).focus(); await p.keyboard.press(BACK); await p.keyboard.press(TAB) }
    await reach(`#${id} .g-form-section__add-button`); await p.keyboard.press('Enter'); await settled(p, id); await settle(p)
    let k = await ring()
    ok(k.id === `${id}-title` && visible(k), `teclado, agregar: foco al título con anillo visible (${JSON.stringify(k)})`)
    await p.locator(`#${id} input[name="m-rfc"]`).fill('GODE561231GR8')
    await p.keyboard.press(BACK)
    await p.keyboard.press('Enter')
    await p.waitForFunction((i) => document.querySelector('#' + i + ' > .g-form-section__confirm').open, id); await p.waitForTimeout(80)
    k = await ring()
    ok(k.text === 'Cancelar' && visible(k), `teclado, quitar con algo escrito: «Cancelar» enfocado con anillo visible (${JSON.stringify(k)})`)
    await p.keyboard.press('Escape'); await p.waitForFunction((i) => !document.querySelector('#' + i + ' > .g-form-section__confirm').open, id); await p.waitForTimeout(80)
    k = await ring()
    ok(/g-form-section__remove/.test(k.cls) && visible(k), `teclado, Esc: «Quitar …» enfocado con anillo visible (${JSON.stringify(k)})`)
    await p.keyboard.press('Enter'); await p.waitForFunction((i) => document.querySelector('#' + i + ' > .g-form-section__confirm').open, id); await p.waitForTimeout(80)
    await p.keyboard.press(TAB); await p.keyboard.press('Enter')
    await p.waitForFunction(() => document.activeElement && document.activeElement.classList.contains('g-form-section__add-button'), null, { timeout: 3000 }).catch(() => {})
    await settled(p, id); await settle(p)
    k = await ring()
    ok(/g-form-section__add-button/.test(k.cls) && visible(k), `teclado, confirmar: «Agregar …» enfocado con anillo visible (${JSON.stringify(k)})`)
    // Al lado (fuera de GForm): agregar y quitar #fx-3
    await p.evaluate(() => document.getElementById('fx-3').scrollIntoView({ block: 'center' })); await settle(p)
    for (const v of [true, false]) {
      tr = p.evaluate((s) => __track(s, 520), '#fx-3')
      await p.locator(`#fx-3 ${v ? '.g-form-section__add-button' : '.g-form-section__remove'}`).click()
      t = await tr
      await settled(p, 'fx-3')
      ok(t.dt === 0 && t.ds === 0, `#fx-3 al lado ${v ? 'agregar' : 'quitar'}: Δ0 y Δscroll 0 (${JSON.stringify({ ...t, tops: undefined })})`)
    }
  }

  PHASE = '5'
  /* 5 · Intermedios (pausados) */
  {
    const id = 'fm-sec-pref'
    // A la vista (si queda por encima, Firefox ancla el desplazamiento con cada pausa artificial y lo acaba desactivando)
    await p.evaluate(() => document.getElementById('fm-sec-pref-toggle').scrollIntoView({ block: 'start' })); await settle(p)
    await setOpen(p, 'prefOpen', true)
    const H = (await p.evaluate((i) => __st(i), id)).h
    await setOpen(p, 'prefOpen', false)
    await p.evaluate(() => { document.getElementById('fm-sec-pref-toggle').click() })
    const props = await p.evaluate((i) => __pause(i, 0.5), id)
    ok(props && props.includes('grid-template-rows') && props.some((x) => /^margin-(block-start|top)$/.test(x)) && props.includes('opacity'), `abrir: altura, margen y opacidad (${props})`)
    let s = await p.evaluate((i) => __st(i), id)
    ok(s.h > 1 && s.h < H - 1 && s.anim && s.ovf === 'hidden' && !s.inert && s.mt < 0 && s.mt > -s.gap, `abrir a la mitad: altura (${s.h} de ${H}) y margen (${s.mt.toFixed(2)}) intermedios, recortado, sin inert`)
    await p.evaluate((i) => __pause(i, 0.75), id)
    s = await p.evaluate((i) => __st(i), id)
    ok(s.op > 0 && s.op < 1 && s.vis === 'visible', `abrir a 3/4: opacidad intermedia (${s.op})`)
    await finish(p, id)
    await p.evaluate(() => { document.getElementById('fm-sec-pref-toggle').click() })
    await p.evaluate((i) => __pause(i, 0.25), id)
    s = await p.evaluate((i) => __st(i), id)
    ok(s.op > 0 && s.op < 1 && s.vis === 'visible' && s.h > 1 && s.h < H - 1 && s.inert, `plegar a 1/4: visible, opacidad (${s.op}) y altura (${s.h}) intermedias, inert en el acto`)
    await finish(p, id)
  }

  PHASE = '6'
  /* 6 · Chevron: dirección (LTR y RTL), giro con --g-duration-fast; el de otra sección no gira */
  {
    const d0 = await p.evaluate(() => ({ ltr: __dir('fm-sec-pref'), other: __dir('fx-2') }))
    await p.evaluate(() => { window.__frameOf('fx-2').dir = 'rtl' }); await settle(p)
    const r0 = await p.evaluate(() => __dir('fx-2'))
    ok(d0.ltr === 'right' && r0 === 'left', `chevron plegado: apunta al texto (LTR ${d0.ltr}, RTL ${r0})`)
    await p.evaluate(() => document.getElementById('fx-2-toggle').click())
    await p.evaluate(() => new Promise((r) => requestAnimationFrame(r)))
    const tr = await p.evaluate(() => document.querySelector('#fx-2 .g-form-section__chevron > .g-icon').getAnimations().map((a) => [a.transitionProperty, a.effect.getComputedTiming().duration]))
    const fast = await p.evaluate(() => { const v = getComputedStyle(document.documentElement).getPropertyValue('--g-duration-fast').trim(); return /ms$/.test(v) ? parseFloat(v) : parseFloat(v) * 1000 })
    ok(tr.length === 1 && tr[0][0] === 'rotate' && near(tr[0][1], fast, 1), `chevron: gira con --g-duration-fast (${JSON.stringify(tr)})`)
    await finish(p, 'fx-2')
    const r1 = await p.evaluate(() => ({ rtl: __dir('fx-2'), other: __dir('fm-sec-pref') }))
    ok(r1.rtl === 'down' && r1.other === 'right', `chevron abierto en RTL: abajo; el de otra sección no gira (${JSON.stringify(r1)})`)
    await p.evaluate(() => { window.__frameOf('fx-2').dir = '' })
    await setOpen(p, 'fxOpen', false)
    await setOpen(p, 'prefOpen', true)
    ok(await p.evaluate(() => __dir('fm-sec-pref')) === 'down', 'chevron abierto en LTR: abajo')
  }

  PHASE = '7'
  /* 7 · is-instant: enviar con error en una plegada y el enlace de GErrorSummary */
  {
    await p.evaluate(() => { const fm = window.__fm(); fm.m.avisos = []; fm.m.privacidad = false })
    await setOpen(p, 'prefOpen', false)
    await p.evaluate(() => { window.__runs = []; document.querySelector('#fm-medium .g-form-actions').scrollIntoView({ block: 'end' }) })
    await settle(p)
    await p.locator('#fm-medium .g-form-actions .g-btn[value="save"]').click()
    await p.waitForFunction(() => document.getElementById('fm-sec-pref').classList.contains('is-open'), null, { timeout: 2000 })
    await p.waitForTimeout(250)
    const r = await p.evaluate(() => { const log = window.__log.get(document.getElementById('fm-sec-pref')); const i = log.findLastIndex((x) => x.cls.split(' ').includes('is-open') && !(log[log.indexOf(x) - 1] || { cls: '' }).cls.split(' ').includes('is-open'))
      return { opened: log[i]?.cls, after: log.slice(i + 1).map((x) => x.cls), runs: window.__runs.filter((x) => x.id === 'fm-sec-pref'), st: __st('fm-sec-pref'), focus: document.activeElement.className } })
    ok(/is-instant/.test(r.opened || ''), `enviar con error en una plegada: is-open llega con is-instant en el mismo parche (${r.opened})`)
    ok(!r.runs.length, `enviar: la plegada se abre sin transición de panel ni de chevron (${JSON.stringify(r.runs)})`)
    ok(r.st.open && !r.st.instant && r.st.op === 1 && r.st.vis === 'visible' && r.st.bodyScroll === 0, `enviar: abierta y asentada, is-instant retirado, sin desplazamiento interno (${JSON.stringify(r.st)})`)
    note(`enviar con error: foco en ${r.focus}`)
    // Plegar con errores visibles → línea de estado «N errores»; el enlace del resumen la abre sin animar
    await p.locator('#fm-sec-pref-toggle').click(); await settled(p, 'fm-sec-pref'); await settle(p)
    const status = await p.evaluate(() => { const s = document.querySelector('#fm-sec-pref .g-form-section__status'); return s && { text: s.textContent.trim(), icon: s.firstElementChild?.matches('svg.g-icon') && s.firstElementChild.getAttribute('aria-hidden') === 'true', desc: document.getElementById('fm-sec-pref-toggle').getAttribute('aria-describedby') } })
    ok(status && /2 errores/.test(status.text) && status.icon && status.desc === 'fm-sec-pref-summary', `plegada con errores: «2 errores» con circle-alert (hijo directo, aria-hidden) en la descripción del botón (${JSON.stringify(status)})`)
    await p.evaluate(() => { window.__runs = []; document.querySelector('#fm-medium .g-error-summary').scrollIntoView({ block: 'start' }) }); await settle(p)
    await p.locator('#fm-medium .g-error-summary__link', { hasText: /aviso/ }).first().click()
    await p.waitForFunction(() => document.getElementById('fm-sec-pref').classList.contains('is-open'), null, { timeout: 2000 })
    await p.waitForTimeout(250)
    const l = await p.evaluate(() => { const a = document.activeElement; const lab = document.querySelector('#fm-avisos legend, #fm-avisos .g-checkbox-group__label'); const r = lab.getBoundingClientRect()
      return { runs: window.__runs.filter((x) => x.id === 'fm-sec-pref'), focusIn: !!a.closest('#fm-avisos'), st: __st('fm-sec-pref'), labelInView: r.top >= 0 && r.bottom <= innerHeight } })
    ok(!l.runs.length && l.st.open && l.st.bodyScroll === 0, `enlace del resumen: abre sin transición y sin desplazamiento interno (${JSON.stringify({ runs: l.runs, scroll: l.st.bodyScroll })})`)
    ok(l.focusIn && l.labelInView, `enlace del resumen: foco en el campo con su etiqueta a la vista (${JSON.stringify({ f: l.focusIn, v: l.labelInView })})`)
    await p.locator('#fm-sec-pref-toggle').click(); await settled(p, 'fm-sec-pref'); await settle(p)
  }

  PHASE = '8'
  /* 8 · Contraste (con estado de errores visible): defecto, auditoría, prueba y los once generados, claro y oscuro */
  {
    const THEMES = [['defecto', '', false], ['defecto oscuro', '', true], ['auditoría', AUDIT_CSS, false], ['auditoría oscuro', AUDIT_CSS, true], ['prueba', 'PRUEBA', false], ['prueba oscuro', 'PRUEBA', true], ...GEN.flatMap((g) => [[g, GEN_CSS[g], false], [g + ' oscuro', GEN_CSS[g], true]])]
    const rows = []
    for (const [name, css, dark] of THEMES) {
      if (css === 'PRUEBA') { await setTheme(p, '', dark); await p.evaluate(() => window.__app().pgSetThemed(true)); await settle(p); await p.evaluate(() => window.__finishAll()); await settle(p) }
      else { await p.evaluate(() => window.__app().pgSetThemed(false)); await setTheme(p, css, dark) }
      const c = await p.evaluate(() => __contrast())
      rows.push(`${name}: estado ${c.status} · resumen ${c.summary} · desc ${c.desc} · chevron ${c.chevron} · borde «Agregar» ${c.addBorder}`)
      ok(c.nStatus === 1 && c.nSummary >= 2 && c.nAdd === 2, `${name}: estado, resúmenes y «Agregar …» a la vista (${c.nStatus}/${c.nSummary}/${c.nAdd})`)
      ok(c.title >= 4.5 && c.toggle >= 4.5 && c.desc >= 4.5 && c.summary >= 4.5 && c.status >= 4.5 && c.add >= 4.5, `texto ≥ 4.5:1 · ${name} (título ${c.title}, botón ${c.toggle}, descripción ${c.desc}, resumen ${c.summary}, estado ${c.status}, «Agregar» ${c.add})`)
      ok(c.chevron >= 3, `chevron ≥ 3:1 · ${name} (${c.chevron})`)
    }
    if (engine === ENGINES[0] || args.verbose) note('contraste mínimo: ' + rows.join(' | '))
    await p.evaluate(() => window.__app().pgSetThemed(false)); await setTheme(p, '', false)
  }

  PHASE = '9'
  /* 9 · divider: ritmo #192 y centrado, dentro (tres densidades) y fuera, con plegadas, abiertas y la agregable */
  {
    const check = async (label, host, densities) => {
      for (const d of densities) {
        if (host === '#fm-medium') await bench(p, { density: d })
        const rows = await p.evaluate((h) => __dividers(h), host)
        for (const r of rows) {
          if (r.none) continue
          if (r.first) { ok(!r.shown, `${label} ${host} ${d}: la primera sección no dibuja línea (${r.id})`); continue }
          ok(r.shown && near(r.dist, r.sg * r.d, 1), `${label} ${host} ${d} ${r.id}: separación = section-gap × densidad (${r.dist.toFixed(2)} vs ${r.sg * r.d})`)
          ok(near(r.line, r.mid, 0.5), `${label} ${host} ${d} ${r.id}: línea centrada en el hueco (${r.line.toFixed(2)} vs ${r.mid.toFixed(2)})`)
          ok(r.bw >= 1 && near(r.w, r.sw, 0.5), `${label} ${host} ${d} ${r.id}: línea visible a todo el ancho (${r.bw}px, ${r.w.toFixed(1)} de ${r.sw.toFixed(1)})`)
        }
        if (label === 'plegada' && d) note(`${host} ${d}: separaciones ${rows.filter((r) => r.dist !== undefined).map((r) => r.dist.toFixed(1)).join('/')}`)
      }
      await bench(p, { density: 'default' })
    }
    await setOpen(p, 'prefOpen', false); await setOpen(p, 'fxOpen', false)
    await check('plegada', '#fm-medium', ['default', 'comfortable', 'compact'])
    await check('plegada', '#fx-frame', ['default'])
    await bench(p, { w: '720' })
    await check('plegada 720', '#fx-frame', ['default'])
    await bench(p, { w: '' })
    await setOpen(p, 'prefOpen', true); await setOpen(p, 'fxOpen', true)
    await setAdded(p, 'fm-sec-fiscal', true); await setAdded(p, 'fx-3', true)
    await check('abierta', '#fm-medium', ['default', 'comfortable', 'compact'])
    await check('abierta', '#fx-frame', ['default'])
    await setAdded(p, 'fm-sec-fiscal', false); await setAdded(p, 'fx-3', false); await setOpen(p, 'fxOpen', false)
  }

  PHASE = '10'
  /* 10 · Al lado: 1 : 2 y título = primera etiqueta ±1px en #fm-medium y #fx-frame; arriba por debajo del umbral */
  {
    await setOpen(p, 'fxOpen', true); await setAdded(p, 'fx-3', true)
    const rows = await p.evaluate(() => ['fm-sec-contacto', 'fx-1', 'fx-2', 'fx-3'].map((id) => { const s = document.getElementById(id); const h = s.querySelector(':scope > .g-form-section__header'); const b = s.querySelector('.g-form-section__body')
      const lab = b.querySelector('label, legend'); const t = s.querySelector('.g-form-section__title')
      return { id, side: s.classList.contains('is-header-side'), w: s.getBoundingClientRect().width, t: t.getBoundingClientRect().top, l: lab.getBoundingClientRect().top, hw: h.getBoundingClientRect().width, bw: b.getBoundingClientRect().width,
        gap: Math.abs(__start(b) - (__rtl(s) ? h.getBoundingClientRect().left : h.getBoundingClientRect().right)), sg: __len('--g-form-section-gap'), space: __len('--g-space-1') } }))
    for (const a of rows) {
      ok(a.side === a.w >= a.space * 200, `${a.id}: is-header-side según su ancho propio (${a.w.toFixed(0)} vs ${a.space * 200})`)
      if (!a.side) continue
      ok(near(a.t, a.l, 1), `${a.id} al lado: título alineado con la primera etiqueta (${a.t.toFixed(2)} vs ${a.l.toFixed(2)})`)
      ok(near(a.bw / a.hw, 2, 0.02) && near(a.gap, a.sg, 0.5), `${a.id} al lado: columnas 1 : 2 (${a.hw.toFixed(1)} : ${a.bw.toFixed(1)}) separadas por el aire de sección (${a.gap.toFixed(1)})`)
    }
    // RTL al lado
    await p.evaluate(() => { window.__frameOf('fx-2').dir = 'rtl' }); await settle(p)
    const rt = await p.evaluate(() => { const s = document.getElementById('fx-2'); const h = s.querySelector(':scope > .g-form-section__header'); const b = s.querySelector('.g-form-section__body'); return { hRight: h.getBoundingClientRect().right, sRight: s.getBoundingClientRect().right, bLeft: b.getBoundingClientRect().left, sLeft: s.getBoundingClientRect().left, t: s.querySelector('.g-form-section__title').getBoundingClientRect().top, l: b.querySelector('label').getBoundingClientRect().top } })
    ok(near(rt.hRight, rt.sRight, 0.5) && near(rt.bLeft, rt.sLeft, 0.5) && near(rt.t, rt.l, 1), `fx-2 al lado en RTL: encabezado a la derecha, cuerpo a la izquierda, título = primera etiqueta (${JSON.stringify(rt)})`)
    await p.evaluate(() => { window.__frameOf('fx-2').dir = '' })
    // Plegada al lado: la fila mide lo que el encabezado; sin agregar al lado: «Agregar …» a todo el ancho
    await setOpen(p, 'fxOpen', false); await setAdded(p, 'fx-3', false)
    const pl = await p.evaluate(() => ({ s: __st('fx-2'), add: [document.querySelector('#fx-3 .g-form-section__add').getBoundingClientRect().width, document.getElementById('fx-3').getBoundingClientRect().width] }))
    ok(near(pl.s.secH, pl.s.headH, 0.5) && pl.s.h === 0, `fx-2 al lado plegada: la fila mide el encabezado (${pl.s.secH.toFixed(1)} vs ${pl.s.headH.toFixed(1)})`)
    ok(near(pl.add[0], pl.add[1], 0.5), `fx-3 al lado sin agregar: «Agregar …» a todo el ancho (${pl.add.map((x) => x.toFixed(1))})`)
    // Por debajo del umbral, arriba; al volver, al lado. Al pasar de «al lado» a arriba, is-actions-below no debe aparecer
    // ni un cuadro (a 720 las acciones caben junto al título): hallazgo 1, de bruno
    await setOpen(p, 'fxOpen', true); await setAdded(p, 'fx-3', true)
    for (const w of ['720', '']) {
      await p.evaluate(() => { window.__flash = []; window.__mo = new MutationObserver((ms) => { for (const m of ms) if (/^fx-[23]$/.test(m.target.id) && m.target.classList.contains('is-actions-below')) window.__flash.push(m.target.id + '@' + window.__frames) }); window.__mo.observe(document.getElementById('fx-frame'), { subtree: true, attributes: true, attributeFilter: ['class'] }) })
      await bench(p, { w })
      const flash = await p.evaluate(() => { window.__mo.disconnect(); return window.__flash })
      pend(!flash.length, `${w || 'libre'}: de «al lado» a arriba sin un cuadro de is-actions-below (${flash.join(', ')}); measure() decide el ancho por side.value antes de que Vue pinte la clase`)
      const s = await p.evaluate(() => ['fm-sec-contacto', 'fx-1', 'fx-2', 'fx-3'].map((i) => [document.getElementById(i).classList.contains('is-header-side'), document.getElementById(i).getBoundingClientRect().width >= __len('--g-space-1') * 200]))
      ok(s.every(([a, b]) => a === b), `${w || 'libre'}: is-header-side sigue al ancho propio al redimensionar (${JSON.stringify(s)})`)
    }
    await setOpen(p, 'fxOpen', false); await setAdded(p, 'fx-3', false)
  }

  PHASE = '11'
  /* 11 · L9 a 320: título ≥ space × 40 con acción en la Fase 1 (Información básica) y la Fase 3 (fx-2); acción ghost abajo */
  {
    for (const w of ['320', '480']) {
      await bench(p, { w })
      const r = await p.evaluate(() => ['fm-sec-basica', 'fx-2'].map((id) => { const s = document.getElementById(id); const hd = s.querySelector('.g-form-section__heading'); const a = s.querySelector('.g-form-section__actions'); const d = s.querySelector(':scope > .g-form-section__header > .g-form-section__description')
        const btn = a.firstElementChild; const tt = s.querySelector('.g-form-section__toggle-text') || s.querySelector('.g-form-section__title')
        return { id, below: s.classList.contains('is-actions-below'), side: s.classList.contains('is-header-side'), hw: hd.getBoundingClientRect().width, min: __len('--g-space-1') * 40, lines: Math.round(tt.getBoundingClientRect().height / parseFloat(getComputedStyle(tt).lineHeight)),
          aTop: a.getBoundingClientRect().top, dBottom: d.getBoundingClientRect().bottom, aStart: __start(a), dStart: __start(d), textStart: __textStart(btn), ghost: btn.classList.contains('g-btn--variant-ghost'), pad: parseFloat(getComputedStyle(btn).paddingInlineStart) } }))
      for (const x of r) {
        ok(x.hw >= x.min, `${w} ${x.id}: el título dispone de al menos space × 40 (${x.hw.toFixed(1)} ≥ ${x.min}; ${x.lines} línea(s))`)
        if (w === '320') {
          ok(x.below && x.aTop >= x.dBottom - 0.5 && near(x.aStart, x.dStart, 0.5), `${w} ${x.id}: is-actions-below, acciones debajo de la descripción y al inicio (${JSON.stringify(x)})`)
          ok(x.ghost && near(x.textStart, x.dStart, 0.5), `${w} ${x.id}: el texto de la acción ghost apilada se alinea con el de la descripción (texto ${x.textStart.toFixed(1)} vs ${x.dStart.toFixed(1)}; relleno del GBtn ${x.pad}px)`)
        } else if (x.id === 'fm-sec-basica') ok(!x.below, `${w} ${x.id}: la acción cabe al lado (sin is-actions-below)`)
      }
    }
    // 320 con todo abierto y agregado: sin desborde
    await setOpen(p, 'prefOpen', true); await setOpen(p, 'fxOpen', true); await setAdded(p, 'fm-sec-fiscal', true); await setAdded(p, 'fx-3', true)
    await bench(p, { w: '320' })
    const o = await p.evaluate(() => ['fm-medium', 'fx-1'].map((id) => { const f = window.__frameOf(id); const out = [...f.querySelectorAll('.g-form-section *')].filter((e) => e.getClientRects().length && getComputedStyle(e).visibility === 'visible' && !e.closest('[popover]:not(:popover-open), dialog:not([open]), .g-datepicker__pop')).filter((e) => e.getBoundingClientRect().right > f.getBoundingClientRect().right + 1 || e.getBoundingClientRect().left < f.getBoundingClientRect().left - 1).map((e) => e.className).slice(0, 4)
      return { id, sw: f.scrollWidth, cw: f.clientWidth, out } }))
    for (const x of o) ok(x.sw <= x.cw && !x.out.length, `320 con todo abierto y agregado (${x.id}): sin desborde (${JSON.stringify(x)})`)
    await bench(p, { w: '' })
    await setAdded(p, 'fm-sec-fiscal', false); await setAdded(p, 'fx-3', false); await setOpen(p, 'fxOpen', false)
  }

  PHASE = '12'
  /* 12 · Foco del botón: anillo visible sin mover ni recortar el título; objetivo ≥ 24px */
  {
    await p.evaluate(() => { document.getElementById('fm-sec-pref').scrollIntoView({ block: 'center' }); document.activeElement?.blur() }); await settle(p)
    const before = await p.evaluate(() => { const h = document.querySelector('#fm-sec-pref .g-form-section__title').getBoundingClientRect(); const t = document.getElementById('fm-sec-pref-toggle').getBoundingClientRect(); return [h.top, h.height, h.width, t.top, t.height, t.width].map((v) => +v.toFixed(2)) })
    // Lo de debajo del título, desde donde acaba el anillo (anillo = borde del botón + offset + grosor)
    const clipOf = () => p.evaluate(() => { const t = document.getElementById('fm-sec-pref-toggle'); const c = getComputedStyle(t); const d = document.querySelector('#fm-sec-pref .g-form-section__description').getBoundingClientRect()
      const ringEnd = t.getBoundingClientRect().bottom + (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--g-focus-width')) || 0) + (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--g-focus-offset')) || 0)
      const top = Math.ceil(Math.max(d.top, ringEnd)); return { x: Math.floor(d.left), y: top, width: Math.ceil(d.width), height: Math.floor(d.bottom - top), over: +(ringEnd - d.top).toFixed(2) } })
    const clip0 = await clipOf()
    const shotA = await p.screenshot({ clip: { x: clip0.x, y: clip0.y, width: clip0.width, height: clip0.height } })
    await p.evaluate(() => document.querySelector('#fm-sec-vitales .g-form-section__title').focus?.())
    await p.locator('#fm-sec-pref-toggle').focus()
    // Teclado: Mayús+Tab y Tab para que :focus-visible lo ponga el navegador (WebKit en macOS: Alt para pasar por botones)
    const T = engine === 'webkit' ? 'Alt+Tab' : 'Tab'
    await p.keyboard.press(engine === 'webkit' ? 'Alt+Shift+Tab' : 'Shift+Tab'); await p.keyboard.press(T)
    const f = await p.evaluate(() => { const a = document.activeElement; const c = getComputedStyle(a); const h = document.querySelector('#fm-sec-pref .g-form-section__title').getBoundingClientRect(); const t = a.getBoundingClientRect()
      return { id: a.id, fv: a.matches(':focus-visible'), w: parseFloat(c.outlineWidth), s: c.outlineStyle, off: parseFloat(c.outlineOffset), r: __ringRatio(a), box: [h.top, h.height, h.width, t.top, t.height, t.width].map((v) => +v.toFixed(2)), radius: c.borderTopLeftRadius } })
    const shotB = await p.screenshot({ clip: { x: clip0.x, y: clip0.y, width: clip0.width, height: clip0.height } })
    ok(f.id === 'fm-sec-pref-toggle' && f.fv && f.w >= 2 && f.s === 'solid' && f.r >= 3, `foco del botón con teclado: anillo ${f.w}px sólido, ${f.r}:1 (${JSON.stringify(f)})`)
    ok(JSON.stringify(f.box) === JSON.stringify(before), `foco: el título y el botón no cambian de caja (${f.box} vs ${before})`)
    ok(shotA.equals(shotB), `foco: la descripción no cambia por debajo del anillo (el anillo entra ${clip0.over}px en su caja de línea, por encima de los glifos)`)
    if (engine === ENGINES[0]) note(`foco: el anillo del botón acaba ${clip0.over}px dentro de la caja de línea de la descripción (interlineado, sin glifos)`)
    const clip = await p.evaluate(() => { const a = document.getElementById('fm-sec-pref-toggle'); const c = getComputedStyle(a); const out = parseFloat(c.outlineWidth) + parseFloat(c.outlineOffset); const r = a.getBoundingClientRect()
      const clips = []; for (let n = a.parentElement; n && n !== document.body; n = n.parentElement) { const s = getComputedStyle(n); if (/hidden|clip|auto|scroll/.test(s.overflowX + s.overflowY)) { const q = n.getBoundingClientRect(); if (r.left - out < q.left || r.right + out > q.right || r.top - out < q.top || r.bottom + out > q.bottom) clips.push(n.className) } }
      return clips })
    ok(!clip.length, `foco: el anillo no lo recorta ningún antepasado (${clip})`)
    const hit = await p.evaluate(() => { const b = document.getElementById('fm-sec-pref-toggle'); const r = b.getBoundingClientRect(); const x = r.left + Math.min(r.width / 2, 40), y = r.top + r.height / 2
      const at = (dy) => document.elementFromPoint(x, y + dy); return { h: r.height, up: b.contains(at(-11.5)), down: b.contains(at(11.5)) } })
    ok(hit.h >= 24 || (hit.up && hit.down), `objetivo del botón ≥ 24px (${JSON.stringify(hit)})`)
  }

  PHASE = '13'
  /* 13 · Quitar sin salto a gris con los controles reales (GInput, GSelect, GDatePicker de «Datos fiscales») */
  for (const [name, css, dark] of [['defecto', '', false], ['defecto oscuro', '', true], ['auditoría', AUDIT_CSS, false]]) {
    await setTheme(p, css, dark)
    await setAdded(p, 'fm-sec-fiscal', true)
    await p.evaluate(() => { document.activeElement?.blur(); document.getElementById('fm-sec-fiscal').scrollIntoView({ block: 'start' }) }); await settle(p)
    const SEL = ['#fm-sec-fiscal input[name="m-rfc"]', '#fm-sec-fiscal .g-input__label', '#fm-sec-fiscal .g-input__control', '#fm-sec-fiscal .g-select__trigger, #fm-sec-fiscal .g-select__button', '#fm-sec-fiscal .g-select__label']
    const styleOf = () => p.evaluate((sels) => sels.map((s) => { const el = document.querySelector(s); if (!el) return s + ':—'; const cs = getComputedStyle(el); return s + ':' + cs.color + '|' + cs.backgroundColor + '|' + cs.borderTopColor + '|' + cs.opacity + '|' + cs.cursor }), SEL)
    const cur = (l) => l.map((x) => x.split('|').pop())
    const st0 = await styleOf()
    const loc = p.locator('#fm-sec-fiscal > .g-form-section__panel')
    const before = await loc.screenshot({ animations: 'allow' })
    await p.evaluate(() => document.querySelector('#fm-sec-fiscal .g-form-section__remove').click())
    await p.evaluate(() => new Promise((r) => requestAnimationFrame(r)))
    await p.evaluate(() => { const panel = document.querySelector('#fm-sec-fiscal > .g-form-section__panel'); document.getAnimations().forEach((a) => { if (a.effect?.target === panel) { a.pause(); a.currentTime = 0 } else { try { a.finish() } catch {} } }) })
    const s = await p.evaluate(() => __st('fm-sec-fiscal'))
    const st1 = await styleOf()
    const after = await loc.screenshot({ animations: 'allow' })
    ok(s.disabled && s.inert && s.op === 1, `${name} quitar, primer cuadro: disabled e inert puestos, opacidad 1 (${JSON.stringify(s)})`)
    // El cursor del agente de usuario sobre un campo deshabilitado (text → default) no se ve: el panel ya es inert y se desvanece
    const look = (l) => l.map((x) => x.split('|').slice(0, -1).join('|'))
    const changed = look(st0).filter((x, i) => x !== look(st1)[i]).map((x) => x + ' → ' + look(st1)[look(st0).indexOf(x)])
    ok(!changed.length && !st0.some((x) => x.endsWith(':—')), `${name} quitar: los controles reales no cambian de color, fondo, borde ni opacidad (${changed.join(' ; ')} ${st0.filter((x) => x.endsWith(':—'))})`)
    if (name === 'defecto') note(`quitar, primer cuadro: cursor ${cur(st0).join(',')} → ${cur(st1).join(',')}`)
    const diff = await p.evaluate(async ([A, B]) => {
      const load = (s) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = 'data:image/png;base64,' + s })
      const get = (i) => { const c = document.createElement('canvas'); c.width = i.width; c.height = i.height; const x = c.getContext('2d'); x.drawImage(i, 0, 0); return x.getImageData(0, 0, i.width, i.height).data }
      const [a, b] = [await load(A), await load(B)]; if (a.width !== b.width || a.height !== b.height) return { size: false, a: [a.width, a.height], b: [b.width, b.height] }
      const da = get(a), db = get(b); let n = 0, max = 0
      for (let i = 0; i < da.length; i += 4) { const d = Math.max(Math.abs(da[i] - db[i]), Math.abs(da[i + 1] - db[i + 1]), Math.abs(da[i + 2] - db[i + 2])); if (d) { n++; max = Math.max(max, d) } }
      return { size: true, n, max }
    }, [before.toString('base64'), after.toString('base64')])
    ok(diff.size && diff.max <= 8, `${name} quitar: captura del panel igual a la de la agregada, nada salta a gris (${JSON.stringify(diff)})`)
    await finish(p, 'fm-sec-fiscal')
  }
  await setTheme(p, '', false)
  // Firefox desactiva el anclaje del desplazamiento por el vaivén de un cuadro del hallazgo 1 (ajustes de 0px en total)
  const anchoring = p.errs.filter((e) => /Scroll anchoring was disabled/.test(e))
  pend(!anchoring.length, `consola: ${anchoring.join(' | ')}`)
  const errs = p.errs.filter((e) => !/Scroll anchoring was disabled/.test(e))
  ok(!errs.length, `consola (playground): ${[...new Set(errs)].slice(0, 5).join(' | ')}`)
  await p.context().close()

  PHASE = '14'
  /* 14 · Movimiento reducido: altura en un cuadro, fundido conservado, chevron sin transición, Δ0 */
  p = await openPlay(browser, { reduced: true })
  {
    const id = 'fm-sec-pref'
    await p.evaluate(() => document.getElementById('fm-sec-pref-toggle').scrollIntoView({ block: 'center' })); await settle(p)
    for (const opening of [false, true]) {
      const tr = p.evaluate(() => __track('#fm-sec-pref-toggle', 400))
      await p.evaluate(() => { window.__runs = [] })
      await p.locator('#fm-sec-pref-toggle').click()
      await p.waitForFunction(() => window.__runs.length > 0, null, { timeout: 2000 }).catch(() => {})
      const s = await p.evaluate((i) => __st(i), id)
      const runs = await p.evaluate(() => window.__runs)
      ok(!runs.some((x) => x.p === 'grid-template-rows' || /^margin/.test(x.p) || x.chev) && runs.some((x) => x.p === 'opacity'), `reducido ${opening ? 'abrir' : 'plegar'}: sin altura, margen ni giro animados; con fundido (${JSON.stringify(runs)})`)
      ok(opening ? s.h > 40 && s.mt === 0 && s.vis === 'visible' : s.inert, `reducido ${opening ? 'abrir: altura final en el primer cuadro' : 'plegar: inert en el acto'} (${JSON.stringify(s)})`)
      await settled(p, id)
      const t = await tr
      ok(t.dt === 0 && t.ds === 0, `reducido ${opening ? 'abrir' : 'plegar'}: botón Δ0 (${JSON.stringify({ ...t, tops: undefined })})`)
      const e = await p.evaluate((i) => __st(i), id)
      ok(opening ? e.op === 1 && e.ovf === 'visible' : e.vis === 'hidden' && e.h === 0, `reducido ${opening ? 'abierta' : 'plegada'} asentada (${JSON.stringify(e)})`)
    }
    ok(await p.evaluate(() => __dir('fm-sec-pref')) === 'down', 'reducido: el chevron gira (sin transición) a abajo')
  }
  ok(!p.errs.length, `consola (reducido): ${[...new Set(p.errs)].slice(0, 5).join(' | ')}`)
  await p.context().close()

  PHASE = '15'
  /* 15 · Puntero grueso: objetivo de 44px sin mover el título (Chromium y WebKit; Firefox no emula pointer: coarse) */
  {
    p = await openPlay(browser, { touch: true })
    const coarse = await p.evaluate(() => matchMedia('(pointer: coarse)').matches)
    if (coarse) {
      const hit = await p.evaluate(() => { const b = document.getElementById('fm-sec-pref-toggle'); b.scrollIntoView({ block: 'center' }); const r = b.getBoundingClientRect(); const x = r.left + Math.min(r.width / 2, 40), y = r.top + r.height / 2
        const at = (dy) => document.elementFromPoint(x, y + dy); const h = document.querySelector('#fm-sec-pref .g-form-section__title').getBoundingClientRect().height
        return { h: r.height, title: h, up: b.contains(at(-21.5)), down: b.contains(at(21.5)), out: !b.contains(at(-23)) } })
      const fixed = await p.evaluate(() => document.querySelector('#fm-sec-vitales .g-form-section__title').getBoundingClientRect().height)
      ok(hit.up && hit.down && hit.out && near(hit.title, fixed, 0.01), `pointer: coarse: objetivo de 44px sin cambiar la caja del título (${JSON.stringify(hit)} · fijo ${fixed})`)
    } else note('pointer: coarse no emulado: sin medida de 44px')
    await p.context().close()
  }

  PHASE = '16'
  /* 16 · forced-colors (solo Chromium la emula) */
  if (engine === 'chromium') {
    p = await openPlay(browser, { forced: true })
    await setOpen(p, 'prefOpen', false)
    await p.evaluate(() => { const fm = window.__fm(); fm.m.avisos = []; fm.m.privacidad = false })
    await p.locator('#fm-medium .g-form-actions .g-btn[value="save"]').click()
    await p.waitForTimeout(300)
    await p.locator('#fm-sec-pref-toggle').click(); await settled(p, 'fm-sec-pref'); await settle(p)
    const fc = await p.evaluate(() => { const tg = document.getElementById('fm-sec-pref-toggle'); const ch = tg.querySelector('.g-form-section__chevron'); const svg = ch.firstElementChild
      const hr = document.querySelector('#fm-sec-pref > .g-form-section__divider'); const st = document.querySelector('#fm-sec-pref .g-form-section__status')
      const sys = (k) => { const s = document.createElement('span'); s.style.color = k; document.body.append(s); const c = getComputedStyle(s).color; s.remove(); return c }
      const add = document.querySelector('#fm-sec-fiscal .g-form-section__add-button')
      return { fc: matchMedia('(forced-colors: active)').matches, chev: getComputedStyle(ch).color, tg: getComputedStyle(tg).color, bt: sys('ButtonText'), stroke: getComputedStyle(svg.querySelector('path, polyline')).stroke,
        hrW: parseFloat(getComputedStyle(hr).borderTopWidth), hrDisp: getComputedStyle(hr).display, hrR: __ratio(hr, 'borderTopColor'), st: st && __ratio(st), add: __ratio(add), addB: parseFloat(getComputedStyle(add).borderTopWidth), addBR: __ratio(add, 'borderTopColor') } })
    ok(fc.fc && fc.chev === fc.bt && fc.tg === fc.bt && fc.stroke === fc.chev, `forced-colors: chevron y botón en ButtonText, trazo currentColor (${fc.chev} · ${fc.tg} · ${fc.stroke})`)
    ok(fc.hrW >= 1 && fc.hrDisp === 'block' && fc.hrR >= 3, `forced-colors: la línea de divider es un borde visible (${fc.hrW}px, ${fc.hrR}:1)`)
    ok(fc.st >= 4.5 && fc.add >= 4.5 && fc.addB >= 1 && fc.addBR >= 3, `forced-colors: estado (${fc.st}) y «Agregar …» legibles con borde (${fc.add}, ${fc.addB}px ${fc.addBR}:1)`)
    await p.evaluate(() => { window.__frameOf('fx-2').dir = 'rtl' }); await settle(p)
    ok(await p.evaluate(() => __dir('fx-2')) === 'left', 'forced-colors: chevron espejado en RTL')
    await p.locator('#fm-sec-pref-toggle').focus(); await p.keyboard.press('Shift+Tab'); await p.keyboard.press('Tab')
    const ring = await p.evaluate(() => { const c = getComputedStyle(document.activeElement); return { id: document.activeElement.id, w: parseFloat(c.outlineWidth), s: c.outlineStyle, r: __ringRatio(document.activeElement) } })
    ok(ring.id === 'fm-sec-pref-toggle' && ring.w >= 2 && ring.s === 'solid' && ring.r >= 3, `forced-colors: anillo visible en el botón (${JSON.stringify(ring)})`)
    ok(!p.errs.length, `consola (forced-colors): ${p.errs.join(' | ')}`)
    await p.context().close()
  }
  await browser.close()
}
server.close()
console.log(info.join('\n'))
if (pending.length) console.log(`\nPendientes de otro rol (auditoria.md), ${pending.length}:\n` + pending.join('\n'))
console.log(`\nGFormSection · auditoría (componente real): ${total - failed}/${total}`)
if (fails.length) { console.log(fails.join('\n')); process.exitCode = 1 }
