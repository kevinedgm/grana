// Auditoría de coco (paso 5) de la PISTA DE SOLO ICONO: el motor de GTooltip en modo visual (tooltip.md §«Modo visual»,
// #433) en GTabs (#434), GRadioGroup labelMode="icon" (#435) y el riel de GSidebar (#436), sobre el COMPONENTE REAL
// (dist/grana.umd.js y dist/grana.css) en design/lab/tooltip/auditoria-pista-banco.html, con el tema por defecto y el
// tema de auditoría del tooltip (auditoria-tema.css: brand #14532D, accent #B45309, space 5, radius 14, borde 2px), claro
// y oscuro; el contraste, además, con los once temas de design/lab/tema-oscuro/dark-color-presence/generated/ en Chromium.
// Mide:
//   1 · forma: la pestaña de la pista contra cada control (Δ < 1 px de ancho y de borde abajo; de alto y de borde a los
//       lados; toca el control; hueco space × 1,5; la etiqueta no es más estrecha ni más baja que el control), lado
//       esperado (abajo en una línea; derecha lógica en vertical, apilado y riel; a la izquierda física en RTL), texto
//       = el nombre oculto, ≥ 12 px, sin recorte, dentro del visor; una sola pista abierta; nodo aria-hidden sin role ni
//       id. Matriz: GTabs underline/pill/segmented/contained, tres densidades, vertical, «Más», RTL, una sola pestaña;
//       GRadioGroup segmented y chip de xs a xl, densidades, apilado, chips en dos líneas, RTL; riel en tres densidades,
//       fixed/floating y RTL (padres por teclado, porque con el puntero abre su panel)
//   2 · #383: Δ0 de todos los descendientes de cada componente con los nodos y sin ellos (cerrados y con una abierta);
//       display: none de los nodos cerrados; en GSidebar, también en expanded, navbar y drawer (la pista no abre)
//   3 · movimiento: barrido con una sola etiqueta visible por cuadro (tabs, vertical, chips, riel); con movimiento normal
//       hay cuadros intermedios (viaja) y con reducido la pestaña siempre está sobre un control (salta)
//   4 · marca de underline: cuánto la tapa la pestaña con la pista abierta (aceptado en #434, solo se mide) y que al
//       cerrar reaparece intacta
//   5 · riel: pista y panel flotante nunca visibles a la vez sobre el mismo padre (puntero y teclado); insignias en RTL
//       en espejo exacto de LTR y fuera de la pestaña de la pista
//   6 · pestañas sin recorte (hallazgo 2: el contador de la vertical solo icono)
//   7 · contraste de la pista (nombre ≥ 4,5:1; etiqueta y pestaña contra la página ≥ 3:1), forced-colors emulado,
//       táctil (pointer: coarse: sin selección ni menú del sistema en control y caja)
//   8 · foco por flechas en radios (hallazgo 1): :focus-visible nativo por motor (se anota) y anillo con
//       [data-g-key-focus] en GRadioGroup segmented/chip/list y GCard radio; el clic de ratón no pinta anillo
//   9 · consola limpia
// Ejecutar desde la raíz con dist/ reconstruido: GRANA_PW_PORT=4212 node design/lab/tooltip/auditoria-pista-verificar.mjs
// Opcional: --engines=chromium,firefox,webkit   --only=1,3,4,5,7,8 (secciones)   --shots (capturas en $SHOTS o /tmp/grana-pista-audit)
import { readdir, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { serve, ROOT } from './estilo-serve.mjs'

const pw = await import(new URL('../theme-playground/node_modules/playwright/index.mjs', import.meta.url))
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')).map(([k, v]) => [k, v ?? true]))
const ENGINES = (args.engines || 'chromium,firefox,webkit').split(',')
const SHOTS = process.env.SHOTS || '/tmp/grana-pista-audit'
if (args.shots) await mkdir(SHOTS, { recursive: true })
const { server } = await serve(Number(process.env.GRANA_PW_PORT) || 4212)
const ORIGIN = `http://127.0.0.1:${server.address().port}`
const BASE = `${ORIGIN}/design/lab/tooltip/auditoria-pista-banco.html`
const GEN = (await readdir(join(ROOT, 'design/lab/tema-oscuro/dark-color-presence/generated'))).filter((f) => /^[a-z-]+\.css$/.test(f) && !/variants/.test(f)).map((f) => f.replace('.css', ''))

let total = 0, failed = 0
const fails = [], measures = {}, perEngine = {}
let ENGINE = ''
const ok = (cond, msg) => { total++; perEngine[ENGINE] ??= { total: 0, failed: 0 }; perEngine[ENGINE].total++; if (!cond) { failed++; perEngine[ENGINE].failed++; fails.push(`[${ENGINE}] ${msg}`) } }
const note = (k, v) => { (measures[k] ??= []).push(v) }
const want = (k) => !args.only || String(args.only).split(',').includes(k)

/* ---------- En la página ---------- */
const LIB = () => {
  const parse = (s) => {
    let m = s.match(/rgba?\(([^)]+)\)/)
    if (m) { const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p[3] ?? 1] }
    m = s.match(/color\(srgb ([^)]+)\)/)
    if (m) { const p = m[1].split(/[\s/]+/).filter(Boolean).map(Number); return [p[0] * 255, p[1] * 255, p[2] * 255, p[3] ?? 1] }
    return [0, 0, 0, 0]
  }
  const over = (t, b) => { const a = t[3]; return [t[0] * a + b[0] * (1 - a), t[1] * a + b[1] * (1 - a), t[2] * a + b[2] * (1 - a), 1] }
  const bgOf = (el) => {
    const layers = []
    for (let n = el; n; n = n.parentElement) { const c = parse(getComputedStyle(n).backgroundColor); if (c[3] > 0) { layers.push(c); if (c[3] >= 1) break } }
    let b = parse(getComputedStyle(document.body).backgroundColor)
    if (b[3] < 1) b = [255, 255, 255, 1]
    for (let i = layers.length - 1; i >= 0; i--) b = over(layers[i], b)
    return b
  }
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]) }
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return +((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)).toFixed(2) }
  const R = (e) => { const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height } }
  const px = (v) => parseFloat(v) || 0
  const root = (c) => document.querySelector(`[data-case="${c}"]`)
  // Controles con pista: [data-g-tooltip] visibles (los que «Más» saca del tablist no tienen nodo)
  const ctrls = (c) => [...root(c).querySelectorAll('[data-g-tooltip]')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 })
  const boxOf = (e) => e.closest('[data-g-tooltip-box]') || e
  const nodes = (c) => [...root(c).querySelectorAll('.g-tooltip')]
  const openNodes = () => [...document.querySelectorAll('.g-tooltip')].filter((n) => n.matches(':popover-open'))
  const visible = () => openNodes().filter((n) => +getComputedStyle(n).opacity > 0.01)
  const nameOf = (e) => {
    const ids = (e.getAttribute('aria-labelledby') || '').split(/\s+/).filter(Boolean)
    return [e.getAttribute('aria-label') || '', ...ids.map((i) => document.getElementById(i)?.textContent || ''), e.textContent, boxOf(e).textContent].join(' | ')
  }
  const geo = (c, i) => {
    const ctrl = ctrls(c)[i], box = boxOf(ctrl)
    const n = openNodes()[0]
    if (!n) return null
    const body = n.querySelector('.g-tooltip__body'), tab = n.querySelector('.g-tooltip__tab'), text = n.querySelector('.g-tooltip__text')
    return {
      side: n.dataset.side, dir: getComputedStyle(ctrl).direction, inRoot: root(c).contains(n), count: openNodes().length,
      box: R(box), body: R(body), tab: R(tab), u: px(getComputedStyle(n).getPropertyValue('--g-space-1')),
      text: text.textContent, name: nameOf(ctrl), fs: px(getComputedStyle(text).fontSize), clip: body.scrollWidth - body.clientWidth,
      vw: document.documentElement.clientWidth, vh: document.documentElement.clientHeight,
      hidden: n.getAttribute('aria-hidden'), role: n.getAttribute('role'), id: n.id, tdir: text.getAttribute('dir')
    }
  }
  // #383: descendientes (sin los nodos .g-tooltip) con su caja relativa y el modelo de caja
  const PROPS = ['marginTop', 'marginRight', 'marginBottom', 'marginLeft', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth', 'display', 'gridColumnStart', 'gridRowStart', 'order']
  const snap = (host) => {
    const o = R(host), out = []
    const walk = (e) => {
      for (const k of e.children) {
        if (k.classList.contains('g-tooltip')) continue
        const r = R(k), s = getComputedStyle(k)
        out.push([k.tagName, k.className.baseVal ?? k.className, +(r.l - o.l).toFixed(2), +(r.t - o.t).toFixed(2), +r.w.toFixed(2), +r.h.toFixed(2), ...PROPS.map((p) => s[p])])
        walk(k)
      }
    }
    walk(host)
    return [+o.w.toFixed(2), +o.h.toFixed(2), out]
  }
  // Quita los nodos (y los devuelve a su sitio) para medir «sin nodos» sobre el mismo DOM
  let parked = []
  const park = (c) => { parked = nodes(c).map((n) => [n, n.parentNode, n.nextSibling]); for (const [n] of parked) n.remove() }
  const unpark = () => { for (const [n, p, nx] of parked.reverse()) p.insertBefore(n, nx); parked = [] }
  const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
  const sys = (name, prop = 'color') => { const d = document.createElement('div'); d.style[prop] = name; document.body.append(d); const v = getComputedStyle(d)[prop]; d.remove(); return v }
  // Muestreo por cuadro: pistas visibles y si la pestaña está sobre algún control del caso (salto) o entre dos (viaje)
  const sample = (c) => {
    window.__s = []; window.__stop = false
    const loop = () => {
      const boxes = ctrls(c).map((e) => R(boxOf(e)))
      const vis = visible()
      const t = vis[0] && R(vis[0].querySelector('.g-tooltip__tab'))
      const onCtrl = t ? boxes.some((b) => (Math.abs(t.l - b.l) < 1 && Math.abs(t.w - b.w) < 1) || (Math.abs(t.t - b.t) < 1 && Math.abs(t.h - b.h) < 1)) : null
      window.__s.push({ n: vis.length, travel: vis.some((x) => x.hasAttribute('data-travel')), onCtrl, fly: Boolean(root(c).querySelector('.g-sidebar__fly:popover-open')) })
      if (!window.__stop) requestAnimationFrame(loop)
    }
    requestAnimationFrame(loop)
  }
  const stop = () => { window.__stop = true; return window.__s }
  window.A = { parse, over, bgOf, ratio, R, root, ctrls, boxOf, nodes, openNodes, visible, nameOf, geo, snap, park, unpark, frame, sys, sample, stop }
}

/* ---------- Casos ---------- */
const TABS = ['t-u', 't-p', 't-s', 't-c', 't-u-compact', 't-u-comfortable', 't-s-compact', 't-p-comfortable', 't-v', 't-vp', 't-v-compact', 't-more', 't-rtl', 't-s-rtl', 't-v-rtl', 't-one']
const RADIOS = ['xs', 'sm', 'md', 'lg', 'xl'].flatMap((s) => [`r-s-${s}`, `r-c-${s}`]).concat(['r-s-compact', 'r-c-comfortable', 'r-stack', 'r-wrap', 'r-s-rtl', 'r-c-rtl', 'r-stack-rtl'])
const RAILS = ['s-def', 's-compact', 's-comfortable', 's-float', 's-rtl', 's-rtl-float']
const PART = (c) => (c.startsWith('t-') ? 'tabs' : c.startsWith('r-') ? 'radio' : 'rail')
const SIDE = (c) => (/^t-v|^r-stack|^s-/.test(c) ? 'right' : 'bottom')

async function load(page, { q = '', part = 'all', motion = 'reduce', w = 1280, h = 900 } = {}) {
  await page.emulateMedia({ reducedMotion: motion })
  try { await page.emulateMedia({ forcedColors: 'none' }) } catch { /* sin emulación */ }
  await page.setViewportSize({ width: w, height: h })
  await page.goto(`${BASE}?part=${part}${q ? '&' + q : ''}`)
  await page.waitForFunction(() => window.__ready && document.fonts.status === 'loaded')
  await page.evaluate(LIB)
  await page.mouse.move(3, 3)
  await page.waitForTimeout(250)
}
const closeAll = async (page) => {
  await page.mouse.move(3, 3)
  await page.evaluate(() => document.activeElement?.blur())
  await page.waitForFunction(() => A.openNodes().length === 0, null, { timeout: 2000 }).catch(() => {})
}
const scrollTo = async (page, c) => { await page.evaluate((c) => { A.root(c).scrollIntoView({ block: 'center', inline: 'nearest' }) }, c); await page.evaluate(() => A.frame()); await page.waitForTimeout(60) }
const ctrlCenter = (page, c, i) => page.evaluate(([c, i]) => { const b = A.R(A.boxOf(A.ctrls(c)[i])); return [b.l + b.w / 2, b.t + b.h / 2] }, [c, i])
const settled = (page) => page.waitForFunction(() => { const o = A.openNodes(); return o.length === 1 && !o[0].hasAttribute('data-travel') && +getComputedStyle(o[0]).opacity > 0.99 }, null, { timeout: 2500 }).then(() => true).catch(() => false)
/** ¿Abre su panel con el puntero? (padres del riel) */
const isParent = (page, c, i) => page.evaluate(([c, i]) => { const e = A.ctrls(c)[i]; return (e.hasAttribute('aria-haspopup') || e.hasAttribute('aria-expanded')) && e.closest('.g-sidebar__nav') !== null }, [c, i])

async function openByPointer(page, c, i) {
  const [x, y] = await ctrlCenter(page, c, i)
  await page.mouse.move(x, y, { steps: 2 })
  return settled(page)
}
/** Por teclado: foco por programa en el control anterior del <nav> y ↓ (navegación: abre al instante) */
async function openByArrow(page, c, i) {
  await closeAll(page)
  const prev = await page.evaluate(([c, i]) => { const all = A.ctrls(c); const me = all[i]; const nav = me.closest('nav'); const inNav = all.filter((e) => nav && nav.contains(e)); const k = inNav.indexOf(me); if (k < 1) return false; inNav[k - 1].focus(); return true }, [c, i])
  if (!prev) return false
  await page.keyboard.press('ArrowDown')
  return settled(page)
}

function checkGeo(m, tag, side) {
  if (!m) { ok(false, `${tag}: no abre`); return }
  ok(m.count === 1, `${tag}: ${m.count} pistas abiertas`)
  ok(m.inRoot, `${tag}: el nodo abierto no es del componente`)
  ok(m.hidden === 'true' && m.role === null && !m.id, `${tag}: nodo con aria-hidden=${m.hidden} role=${m.role} id=${m.id}`)
  ok(m.tdir === 'auto', `${tag}: el texto sin dir="auto"`)
  ok(m.text && m.name.includes(m.text), `${tag}: texto «${m.text}» no es el nombre oculto (${m.name.slice(0, 80)})`)
  ok(m.side === side, `${tag}: lado ${m.side} (esperado ${side})`)
  ok(m.fs >= 12, `${tag}: texto ${m.fs}px`)
  ok(m.clip <= 0, `${tag}: el texto se recorta ${m.clip}px`)
  ok(m.body.l >= -0.5 && m.body.r <= m.vw + 0.5 && m.body.t >= -0.5 && m.body.b <= m.vh + 0.5, `${tag}: fuera del visor`)
  const { box, tab, body, u } = m
  const gap = u * 1.5
  let d
  if (m.side === 'bottom' || m.side === 'top') {
    d = Math.max(Math.abs(tab.w - box.w), Math.abs(tab.l - box.l), Math.abs(tab.r - box.r))
    ok(d < 1, `${tag}: pestaña ${tab.w.toFixed(2)} contra control ${box.w.toFixed(2)} (Δ ${d.toFixed(2)})`)
    ok(Math.abs(tab.t - box.b) < 1, `${tag}: la pestaña no toca el control (Δ ${(tab.t - box.b).toFixed(2)})`)
    ok(Math.abs(body.t - box.b - gap) < 1, `${tag}: hueco ${(body.t - box.b).toFixed(2)} ≠ space × 1,5 (${gap})`)
    ok(body.w >= box.w - 0.5, `${tag}: etiqueta más estrecha que el control`)
  } else {
    d = Math.max(Math.abs(tab.h - box.h), Math.abs(tab.t - box.t), Math.abs(tab.b - box.b))
    ok(d < 1, `${tag}: pestaña ${tab.h.toFixed(2)} contra control ${box.h.toFixed(2)} (Δ ${d.toFixed(2)})`)
    const rtl = m.dir === 'rtl'
    const touch = rtl ? tab.r - box.l : tab.l - box.r
    ok(Math.abs(touch) < 1, `${tag}: la pestaña no toca el control (Δ ${touch.toFixed(2)}, ${rtl ? 'izquierda' : 'derecha'})`)
    const g = rtl ? box.l - body.r : body.l - box.r
    ok(Math.abs(g - gap) < 1, `${tag}: hueco ${g.toFixed(2)} ≠ space × 1,5 (${gap})`)
    ok(body.h >= box.h - 0.5, `${tag}: etiqueta más baja que el control`)
  }
  note(`Δ pestaña/control máx (${ENGINE})`, d)
}

for (const engine of ENGINES) {
  ENGINE = engine
  const t0 = Date.now()
  const browser = await pw[engine].launch()
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await ctx.newPage()
  const errs = []
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message))
  page.on('console', (m) => { if (m.type() === 'error' || (m.type() === 'warning' && /Vue warn/.test(m.text()))) errs.push(m.type() + ': ' + m.text()) })

  /* 1 · Forma en cuatro temas; 2 · #383; 6 · sin recorte */
  if (want('1')) for (const th of ['', 'dark=1', 'theme=audit', 'theme=audit&dark=1']) {
    const T = th || 'defecto'
    await load(page, { q: th })
    for (const c of [...TABS, ...RADIOS, ...RAILS]) {
      await closeAll(page)
      await scrollTo(page, c)
      await page.waitForTimeout(30)
      // 2 · #383: con nodos cerrados = sin nodos; nodos cerrados con display none
      const s1 = await page.evaluate((c) => JSON.stringify(A.snap(A.root(c))), c)
      const disp = await page.evaluate((c) => A.nodes(c).map((n) => getComputedStyle(n).display), c)
      await page.evaluate((c) => A.park(c), c)
      await page.evaluate(() => A.frame())
      const s0 = await page.evaluate((c) => JSON.stringify(A.snap(A.root(c))), c)
      await page.evaluate(() => A.unpark())
      await page.evaluate(() => A.frame())
      ok(disp.length > 0 && disp.every((d) => d === 'none'), `${T} · ${c}: nodos cerrados con display ${[...new Set(disp)]}`)
      ok(s0 === s1, `${T} · ${c}: #383 los nodos cambian la distribución`)
      // 6 · ningún control recortado (contador de la vertical, insignias)
      const clipped = await page.evaluate((c) => A.ctrls(c).filter((e) => e.scrollWidth > e.clientWidth + 1 || e.scrollHeight > e.clientHeight + 1).map((e) => `${e.id || e.className} ${e.scrollWidth}/${e.clientWidth}`), c)
      ok(clipped.length === 0, `${T} · ${c}: controles recortados ${clipped.join(', ')}`)
      const outside = await page.evaluate((c) => { const sc = A.root(c).querySelector('.g-tabs__scroller'); if (!sc) return []; const s = A.R(sc); return A.ctrls(c).filter((e) => sc.contains(e)).map((e) => A.R(e)).filter((r) => r.l < s.l - 0.5 || r.r > s.r + 0.5).map((r) => r.w) }, c)
      if (!/^t-more/.test(c)) ok(outside.length === 0, `${T} · ${c}: pestañas fuera de la cabecera`)
      // 1 · forma, control a control
      const n = await page.evaluate((c) => A.ctrls(c).length, c)
      ok(n > 0, `${T} · ${c}: sin controles con pista`)
      for (let i = 0; i < n; i++) {
        const parent = PART(c) === 'rail' && (await isParent(page, c, i))
        const opened = parent ? await openByArrow(page, c, i) : await openByPointer(page, c, i)
        const m = opened ? await page.evaluate(([c, i]) => A.geo(c, i), [c, i]) : null
        checkGeo(m, `${T} · ${c}[${i}]${parent ? ' (padre, ↓)' : ''}`, SIDE(c))
        if (i === 0 && m) {
          // #383 con una abierta
          const so = await page.evaluate((c) => JSON.stringify(A.snap(A.root(c))[2].map((x) => x.slice(0, 6))), c)
          const sc = JSON.stringify(JSON.parse(s1)[2].map((x) => x.slice(0, 6)))
          ok(so === sc, `${T} · ${c}: #383 abrir la pista mueve algo`)
        }
        if (parent) await page.evaluate(() => document.activeElement?.blur())
      }
      if (args.shots && th === 'theme=audit') {
        await openByPointer(page, c, 0)
        const b = await page.evaluate((c) => A.R(A.root(c)), c)
        await page.screenshot({ path: `${SHOTS}/${engine}-${c}.png`, clip: { x: Math.max(0, b.l - 30), y: Math.max(0, b.t - 30), width: Math.min(600, b.w + 260), height: Math.min(700, b.h + 120) } })
      }
    }
  }

  /* 2b · #383 en los otros formatos de GSidebar: Δ0 con y sin nodos, nodos cerrados y la pista nunca abre */
  if (want('1')) for (const th of ['', 'theme=audit&dark=1']) {
    await load(page, { q: th, part: 'rail' })
    for (const c of ['f-expanded', 'f-navbar', 'f-drawer']) {
      await closeAll(page)
      await scrollTo(page, c)
      const fmt = await page.evaluate((c) => [...A.root(c).querySelectorAll('.g-sidebar')].map((e) => e.className.match(/g-sidebar--mode-(\w+)/)?.[1]).join(','), c)
      ok(fmt.split(',').includes(c.slice(2)) || (c === 'f-drawer' && (await page.evaluate((c) => Boolean(A.root(c).querySelector('dialog.g-sidebar__drawer')), c))), `${c}: formato ${fmt}`)
      const s1 = await page.evaluate((c) => JSON.stringify(A.snap(A.root(c))), c)
      const disp = await page.evaluate((c) => A.nodes(c).map((n) => getComputedStyle(n).display), c)
      await page.evaluate((c) => A.park(c), c)
      await page.evaluate(() => A.frame())
      const s0 = await page.evaluate((c) => JSON.stringify(A.snap(A.root(c))), c)
      await page.evaluate(() => A.unpark())
      // expanded conserva los nodos del riel (mismo DOM); navbar y drawer dibujan otro árbol y no llevan pista (#437)
      ok(c === 'f-expanded' ? disp.length > 0 && disp.every((d) => d === 'none') : disp.length === 0, `${c}: ${disp.length} nodos, display ${[...new Set(disp)]}`)
      ok(s0 === s1, `${c}: #383 los nodos cambian la distribución`)
      note('nodos de la pista por formato', `${engine} ${c}: ${disp.length}`)
      const n = await page.evaluate((c) => A.ctrls(c).length, c)
      for (let i = 0; i < Math.min(n, 3); i++) {
        const [x, y] = await ctrlCenter(page, c, i)
        if (!x && !y) continue // invisible (drawer cerrado)
        await page.mouse.move(x, y, { steps: 2 })
        await page.waitForTimeout(500)
        ok((await page.evaluate(() => A.openNodes().length)) === 0, `${c}[${i}]: la pista abre fuera del riel`)
      }
    }
  }

  /* 3 · Movimiento: barrido con movimiento normal y reducido */
  if (want('3')) for (const motion of ['no-preference', 'reduce']) {
    await load(page, { q: 'theme=audit', motion })
    for (const c of ['t-u', 't-v', 't-s-rtl', 'r-c-md', 'r-stack', 's-def']) {
      await closeAll(page)
      await scrollTo(page, c)
      const all = await page.evaluate((c) => A.ctrls(c).map((e, i) => [i, e.hasAttribute('aria-haspopup'), e.closest('nav') !== null]), c)
      const idx = all.filter(([, p]) => !p).map(([i]) => i)
      const first = c.startsWith('s-') ? all.filter(([, p, inNav]) => !p && inNav).map(([i]) => i) : idx
      await openByPointer(page, c, first[0])
      await page.evaluate((c) => A.sample(c), c)
      const pts = []
      for (const i of first) pts.push(await ctrlCenter(page, c, i))
      for (let k = 1; k < pts.length; k++) {
        const [x0, y0] = pts[k - 1], [x1, y1] = pts[k]
        for (let s = 1; s <= 6; s++) { await page.mouse.move(x0 + ((x1 - x0) * s) / 6, y0 + ((y1 - y0) * s) / 6); await page.waitForTimeout(16) }
        await page.waitForTimeout(motion === 'reduce' ? 60 : 30)
      }
      await page.waitForTimeout(450)
      const s = await page.evaluate(() => A.stop())
      const vis = s.filter((x) => x.n > 0)
      ok(s.every((x) => x.n <= 1), `${motion} · ${c}: dos etiquetas visibles en un cuadro`)
      ok(vis.length > 10, `${motion} · ${c}: barrido sin pista visible (${vis.length} cuadros)`)
      const between = vis.filter((x) => x.onCtrl === false).length
      if (motion === 'reduce') ok(between === 0, `${motion} · ${c}: con movimiento reducido la pestaña pasa por ${between} cuadros intermedios (no salta)`)
      else ok(between > 0 && vis.some((x) => x.travel), `${motion} · ${c}: con movimiento normal no viaja (${between} intermedios)`)
      note(`cuadros intermedios ${motion}`, `${engine} ${c}: ${between}/${vis.length}`)
    }
  }

  /* 4 · Marca de underline con la pista abierta */
  if (want('4')) {
    await load(page, { q: 'theme=audit' })
    for (const c of ['t-u', 't-rtl', 't-v']) {
      await closeAll(page)
      await scrollTo(page, c)
      const mk = () => page.evaluate((c) => { const m = A.root(c).querySelector('.g-tabs__mark'); const s = getComputedStyle(m); const r = A.R(m), o = A.R(A.root(c)); return { r, rel: [r.l - o.l, r.t - o.t, r.w, r.h].map((x) => +x.toFixed(2)), vis: s.visibility, op: s.opacity, bg: s.backgroundColor } }, c)
      const before = await mk()
      const active = await page.evaluate((c) => A.ctrls(c).findIndex((e) => e.getAttribute('aria-selected') === 'true'), c)
      const opened = await openByPointer(page, c, active)
      const cover = await page.evaluate(() => { const n = A.openNodes()[0]; return n ? A.R(n.querySelector('.g-tooltip__tab')) : null })
      const during = await mk()
      const ix = cover ? Math.max(0, Math.min(cover.r, during.r.r) - Math.max(cover.l, during.r.l)) * Math.max(0, Math.min(cover.b, during.r.b) - Math.max(cover.t, during.r.t)) : 0
      const area = during.r.w * during.r.h
      note('marca tapada por la pestaña', `${engine} ${c}: ${(100 * ix / area).toFixed(0)} % (${ix.toFixed(0)} de ${area.toFixed(0)} px²)`)
      ok(opened, `${c}: la pista de la activa no abre`)
      await closeAll(page)
      await page.waitForTimeout(200)
      const after = await mk()
      const k = (x) => JSON.stringify([x.rel, x.vis, x.op, x.bg])
      ok(k(after) === k(before), `${c}: la marca no reaparece intacta al cerrar ${k(before)} → ${k(after)}`)
    }
  }

  /* 5 · Riel: panel y pista; insignias en RTL */
  if (want('5')) {
    await load(page, { q: 'theme=audit', motion: 'no-preference' })
    for (const c of ['s-def', 's-rtl']) {
      await closeAll(page)
      await scrollTo(page, c)
      const parents = await page.evaluate((c) => A.ctrls(c).map((e, i) => (e.hasAttribute('aria-haspopup') && e.closest('.g-sidebar__nav') ? i : -1)).filter((i) => i >= 0), c)
      const panelClosed = () => page.waitForFunction((c) => !A.root(c).querySelector('.g-sidebar__fly:popover-open, [aria-expanded="true"]'), c, { timeout: 3000 }).catch(() => {})
      ok(parents.length > 0, `${c}: sin padres en el riel`)
      for (const p of parents) {
        // Puntero: desde el item anterior con la pista abierta (SKIP) al padre
        await closeAll(page)
        await openByPointer(page, c, p - 1)
        await page.evaluate((c) => A.sample(c), c)
        const [x, y] = await ctrlCenter(page, c, p)
        await page.mouse.move(x, y, { steps: 3 })
        await page.waitForTimeout(900)
        const s = await page.evaluate(() => A.stop())
        const both = s.filter((f) => f.fly && f.n > 0).length
        note('riel: cuadros con panel y pista a la vez (puntero, desde SKIP)', `${engine} ${c}: ${both}`)
        ok(both <= 3, `${c}[${p}]: panel y pista visibles a la vez ${both} cuadros (puntero)`)
        ok(s.at(-1).fly && s.at(-1).n === 0, `${c}[${p}]: al final no queda solo el panel (fly=${s.at(-1).fly}, pistas=${s.at(-1).n})`)
        // Teclado: ↓ hasta el padre muestra la pista; Intro abre el panel y la cierra
        await page.mouse.move(3, 3)
        await page.keyboard.press('Escape')
        await closeAll(page)
        await panelClosed()
        await page.waitForTimeout(250)
        const kb = await openByArrow(page, c, p)
        ok(kb, `${c}[${p}]: ↓ hasta el padre no muestra su pista`)
        await page.evaluate((c) => A.sample(c), c)
        await page.keyboard.press('Enter')
        await page.waitForTimeout(500)
        const s2 = await page.evaluate(() => A.stop())
        const both2 = s2.filter((f) => f.fly && f.n > 0).length
        note('riel: cuadros con panel y pista a la vez (Intro)', `${engine} ${c}: ${both2}`)
        ok(both2 <= 3 && s2.at(-1).fly && s2.at(-1).n === 0, `${c}[${p}]: con Intro panel y pista a la vez ${both2} cuadros; al final fly=${s2.at(-1).fly} pistas=${s2.at(-1).n}`)
        await page.keyboard.press('Escape')
        await page.keyboard.press('Escape')
        await closeAll(page)
        await panelClosed()
        await page.waitForTimeout(250)
      }
    }
    // Insignias: RTL en espejo de LTR; la pestaña de la pista no las tapa
    for (const [a, b] of [['s-def', 's-rtl'], ['s-float', 's-rtl-float']]) {
      const badge = (c) => page.evaluate((c) => [...A.root(c).querySelectorAll('.g-sidebar__nav .g-sidebar__link')].filter((l) => l.querySelector('.g-sidebar__badge')).map((l) => {
        const L = A.R(l), B = A.R(l.querySelector('.g-sidebar__badge')), rtl = getComputedStyle(l).direction === 'rtl'
        return { start: +(rtl ? L.r - B.r : B.l - L.l).toFixed(2), end: +(rtl ? B.l - L.l : L.r - B.r).toFixed(2), top: +(B.t - L.t).toFixed(2), w: +B.w.toFixed(2), h: +B.h.toFixed(2), lw: +L.w.toFixed(2) }
      }), c)
      const la = await badge(a), lb = await badge(b)
      if (a === 's-def') ok(JSON.stringify(la) === JSON.stringify(lb), `insignias ${a}/${b}: RTL no es el espejo de LTR ${JSON.stringify(la)} ${JSON.stringify(lb)}`)
      else note('insignias (densidad distinta)', `${engine} ${a} ${JSON.stringify(la[0])} · ${b} ${JSON.stringify(lb[0])}`)
      for (const c of [a, b]) {
        await scrollTo(page, c)
        const withBadge = await page.evaluate((c) => A.ctrls(c).map((e, i) => (e.querySelector('.g-sidebar__badge') ? i : -1)).filter((i) => i >= 0), c)
        for (const i of withBadge) {
          await closeAll(page)
          await openByPointer(page, c, i)
          const hit = await page.evaluate(([c, i]) => { const n = A.openNodes()[0]; if (!n) return null; const t = A.R(n.querySelector('.g-tooltip__tab')), B = A.R(A.ctrls(c)[i].querySelector('.g-sidebar__badge')); return Math.max(0, Math.min(t.r, B.r) - Math.max(t.l, B.l)) * Math.max(0, Math.min(t.b, B.b) - Math.max(t.t, B.t)) }, [c, i])
          ok(hit === 0, `${c}[${i}]: la pestaña de la pista tapa la insignia (${hit} px²)`)
        }
      }
    }
  }

  /* 7 · Contraste, forced-colors, táctil */
  if (want('7')) {
    const themes = ['', 'dark=1', 'theme=audit', 'theme=audit&dark=1']
    if (engine === 'chromium') for (const g of GEN) themes.push(`theme=${g}`, `theme=${g}&dark=1`)
    for (const th of themes) {
      await load(page, { q: th })
      for (const [c, i] of [['t-u', 1], ['r-c-md', 1], ['s-def', 3]]) {
        await closeAll(page)
        await scrollTo(page, c)
        await openByPointer(page, c, i)
        const k = await page.evaluate(([c, i]) => {
          const n = A.openNodes()[0]; if (!n) return null
          const body = n.querySelector('.g-tooltip__body'), tab = n.querySelector('.g-tooltip__tab'), text = n.querySelector('.g-tooltip__text')
          const bb = A.bgOf(body), page = A.bgOf(A.boxOf(A.ctrls(c)[i]).parentElement)
          return { name: A.ratio(A.over(A.parse(getComputedStyle(text).color), bb), bb), body: A.ratio(bb, page), tab: A.ratio(A.over(A.parse(getComputedStyle(tab).backgroundColor), page), page) }
        }, [c, i])
        ok(k && k.name >= 4.5, `contraste ${th || 'defecto'} · ${c}: nombre ${k?.name}`)
        ok(k && k.body >= 3 && k.tab >= 3, `contraste ${th || 'defecto'} · ${c}: etiqueta ${k?.body} / pestaña ${k?.tab} contra la página`)
        if (k) { note('contraste nombre (mín)', k.name); note('contraste etiqueta/página (mín)', Math.min(k.body, k.tab)) }
      }
    }
    // forced-colors emulado
    let supported = true
    await load(page, { q: 'theme=audit' })
    try { await page.emulateMedia({ forcedColors: 'active' }) } catch { supported = false }
    supported = supported && (await page.evaluate(() => matchMedia('(forced-colors: active)').matches))
    if (supported) {
      for (const [c, i] of [['t-u', 1], ['t-v', 1], ['r-s-md', 1], ['r-stack', 1], ['s-def', 3], ['s-rtl', 2]]) {
        await closeAll(page)
        await scrollTo(page, c)
        const opened = await openByPointer(page, c, i)
        const f = await page.evaluate(() => {
          const n = A.openNodes()[0]; if (!n) return null
          const tab = n.querySelector('.g-tooltip__tab'), body = n.querySelector('.g-tooltip__body')
          const t = getComputedStyle(tab), b = getComputedStyle(body)
          const side = n.dataset.side === 'bottom' || n.dataset.side === 'top' ? [t.borderLeftWidth, t.borderRightWidth, t.borderLeftColor] : [t.borderTopWidth, t.borderBottomWidth, t.borderTopColor]
          return { s1: parseFloat(side[0]), s2: parseFloat(side[1]), sc: side[2], tbg: t.backgroundColor, bc: b.borderTopColor, bw: parseFloat(b.borderTopWidth), ct: A.sys('CanvasText'), cv: A.sys('Canvas', 'backgroundColor') }
        })
        ok(opened && f && f.s1 >= 1 && f.s2 >= 1 && f.sc === f.ct && f.tbg === f.cv, `forced-colors ${c}: pestaña sin sus lados en CanvasText ${JSON.stringify(f)}`)
        ok(f && f.bc === f.ct && f.bw >= 1, `forced-colors ${c}: etiqueta sin borde CanvasText ${JSON.stringify(f)}`)
        if (args.shots && f) { const b = await page.evaluate((c) => A.R(A.root(c)), c); await page.screenshot({ path: `${SHOTS}/${engine}-forced-${c}.png`, clip: { x: Math.max(0, b.l - 30), y: Math.max(0, b.t - 30), width: 420, height: 300 } }) }
      }
    } else note('forced-colors', `${engine}: no se emula (no medido)`)
    // Táctil
    let tctx = null
    try { tctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, hasTouch: true, isMobile: engine !== 'firefox' }) } catch { tctx = null }
    if (tctx) {
      const tp = await tctx.newPage()
      await load(tp, {})
      if (await tp.evaluate(() => matchMedia('(pointer: coarse)').matches)) {
        for (const c of ['t-u', 't-v', 'r-s-md', 'r-c-md', 's-def']) {
          const u = await tp.evaluate((c) => A.ctrls(c).map((e) => {
            const us = (x) => { const s = getComputedStyle(x); return s.userSelect || s.webkitUserSelect }
            const call = (x) => (CSS.supports('-webkit-touch-callout', 'none') ? getComputedStyle(x).getPropertyValue('-webkit-touch-callout') : 'none')
            const box = A.boxOf(e)
            return { input: e.localName === 'input', ctrl: us(e), box: box === e ? null : us(box), call: call(e), callBox: call(box) }
          }), c)
          ok(u.every((x) => (x.input || x.ctrl === 'none') && (x.box === null || x.box === 'none') && x.call === 'none' && x.callBox === 'none'), `táctil ${c}: selección o menú del sistema ${JSON.stringify(u[0])}`)
        }
      } else note('táctil', `${engine}: (pointer: coarse) no se emula`)
      await tctx.close()
    }
  }

  /* 8 · Foco por flechas en radios (hallazgo 1) */
  if (want('8')) {
    await load(page, {})
    const TAB = engine === 'webkit' ? 'Alt+Tab' : 'Tab'
    for (const c of ['r-s-md', 'r-c-md', 'r-stack']) {
      await closeAll(page)
      await scrollTo(page, c)
      await page.evaluate((c) => { const g = A.root(c); const s = document.createElement('button'); s.id = '__pre'; s.textContent = 'antes'; document.getElementById('__pre')?.remove(); g.parentElement.insertBefore(s, g); s.focus() }, c)
      await page.keyboard.press(TAB)
      await page.keyboard.press('ArrowRight')
      await page.waitForTimeout(80)
      const ring = () => page.evaluate(() => { const e = document.activeElement; const o = getComputedStyle(e.closest('.g-radio-group__option')); return { radio: e.type === 'radio', fv: e.matches(':focus-visible'), style: o.outlineStyle, w: parseFloat(o.outlineWidth) } })
      const nat = await ring()
      note('flechas: :focus-visible nativo del radio', `${engine} ${c}: ${nat.fv} (anillo ${nat.style})`)
      ok(nat.radio, `${c}: Tab + → no deja el foco en un radio`)
      ok(!nat.fv || (nat.style === 'solid' && nat.w >= 1), `${c}: con :focus-visible no hay anillo`)
      // Con el atributo que escribirá el .vue (pedido a bruno): el anillo aparece aunque el motor no marque :focus-visible
      await page.evaluate(() => document.activeElement.setAttribute('data-g-key-focus', ''))
      const kf = await ring()
      ok(kf.style === 'solid' && kf.w >= 1, `${c}: con [data-g-key-focus] no hay anillo (${JSON.stringify(kf)})`)
      await page.evaluate(() => document.activeElement.removeAttribute('data-g-key-focus'))
      // Clic de ratón: sin anillo
      await page.mouse.click(...(await ctrlCenter(page, c, 2)))
      await page.waitForTimeout(80)
      const mc = await page.evaluate((c) => { const o = getComputedStyle(A.boxOf(A.ctrls(c)[2])); return o.outlineStyle }, c)
      ok(mc === 'none', `${c}: el clic de ratón pinta el anillo (${mc})`)
    }
    // list y GCard radio no están en el banco: comprobación de selector con un grupo list montado al vuelo no hace falta;
    // la regla [data-g-key-focus] es la misma en las cinco apariencias (GRadioGroup.css) y en GCard/GWidgetGallery.
  }

  /* 9 · Consola */
  ok(!errs.length, `consola: ${errs.slice(0, 3).join(' | ')}`)
  note('tiempo', `${engine}: ${((Date.now() - t0) / 1000).toFixed(0)} s`)
  await browser.close()
}
server.close()

for (const [k, v] of Object.entries(measures)) {
  const nums = v.filter((x) => typeof x === 'number')
  console.log(`· ${k}: ${nums.length === v.length ? `máx ${Math.max(...nums).toFixed(3)} · mín ${Math.min(...nums).toFixed(3)}` : v.join(' | ')}`)
}
for (const [e, r] of Object.entries(perEngine)) console.log(`${e}: ${r.total - r.failed}/${r.total}`)
console.log(fails.length ? `\nFALLOS (${fails.length}):\n` + fails.slice(0, 120).join('\n') : '')
console.log(`\nPista de solo icono · auditoría: ${total - failed}/${total}`)
process.exit(failed ? 1 : 0)
