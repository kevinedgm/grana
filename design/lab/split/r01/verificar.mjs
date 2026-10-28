// Verificación del prototipo de GSplit (kiwi r01) en Chromium, Firefox y WebKit.
//   GRANA_PW_PORT=4218 node design/lab/split/r01/verificar.mjs [--engines=chromium] [--parts=casos,bloques] [--verbose]
// Requiere packages/vue/dist (grana.css, grana.js, …) y packages/blocks/dist/{ecommerce,booking}.js. Solo lee; no toca packages/.
// «bloques»: los casos reales de EC-L7 (Product overview 01, Cart 01, Checkout 03, Availability 03) sobre los bancos de bruno,
// ANTES (bloque tal cual) y DESPUÉS (sp.js pone el GSplit donde iría), a 1440, 1024, 768, 390 y 320, con el texto al 100 % y
// al 200 %, y una secuencia de cambios de tamaño (sin histéresis). Booking summary 03 solo «antes» (no es caso de GSplit).
// «casos»: index.html?vista=casos (proporciones, umbral exacto, caja y no visor, anidado, RTL, una región, separación,
// alineación, palabra larga, contenido rígido, orden de foco con Tab, experimento de sticky).
import http from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../../../../', import.meta.url))
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')).map(([k, v]) => [k, v ?? true]))
const ENGINES = (args.engines || 'chromium,firefox,webkit').split(',')
const PARTS = (args.parts || 'casos,bloques').split(',')
const V = !!args.verbose
const PORT = Number(process.env.GRANA_PW_PORT || 4218)
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.woff2': 'font/woff2', '.svg': 'image/svg+xml' }
const server = http.createServer(async (req, res) => {
  try {
    const p = normalize(join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname)))
    if (!p.startsWith(ROOT)) throw new Error('fuera')
    res.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream' }).end(await readFile(p))
  } catch { if (!res.headersSent) res.writeHead(404).end() }
})
await new Promise((r) => server.listen(PORT, '127.0.0.1', r))
const O = `http://127.0.0.1:${PORT}`
const pw = await import(new URL('../../theme-playground/node_modules/playwright/index.mjs', import.meta.url))

let total = 0; let failed = 0; const fails = []; const notes = []
const tally = {}
let cur = ''
const ok = (c, msg, info = '') => {
  total++; tally[cur] = tally[cur] || [0, 0]; tally[cur][1]++
  if (!c) { failed++; fails.push(`[${cur}] ${msg}${info !== '' ? ' · ' + info : ''}`) } else { tally[cur][0]++; if (V) console.log('ok   ' + msg + (info !== '' ? ' · ' + info : '')) }
}
const note = (s) => { notes.push(`[${cur}] ${s}`); if (V) console.log('nota ' + s) }
const near = (a, b, t = 1.5) => Math.abs(a - b) <= t
const settle = (p, ms = 80) => p.evaluate((ms) => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, ms)))), ms)

async function open (b, url, { vw = 1440, vh = 900, ready } = {}) {
  const ctx = await b.newContext({ viewport: { width: vw, height: vh } })
  const p = await ctx.newPage()
  const errs = []
  p.on('console', (m) => { const t = m.text(); if ((m.type() === 'error' && !/favicon|404/.test(t)) || (m.type() === 'warning' && /\[Vue warn\]|\[Grana /.test(t))) errs.push(t.slice(0, 160)) })
  p.on('pageerror', (e) => errs.push(String(e).slice(0, 160)))
  for (let i = 0; ; i++) {
    try { await p.goto(url, { waitUntil: 'domcontentloaded' }); await p.waitForFunction(ready, null, { timeout: 25000 }); break } catch (e) { if (i >= 2) throw e }
  }
  await p.evaluate(() => document.fonts.ready)
  await settle(p, 150)
  p.__errs = errs
  return { p, close: () => ctx.close() }
}

// Umbral esperado (tema por defecto: space 4 px, cuerpo 16 px; con zoom=2 el cuerpo es 32 px)
const RATIO = { '1-1': [1, 1], '2-1': [2, 1], '1-2': [1, 2], '3-2': [3, 2], '2-3': [2, 3] }
const K = { sm: 64, md: 80, lg: 96 }
const GAP = { none: 0, sm: 12, md: 24, lg: 48 }
const threshold = ({ ratio, collapse, gap }, zoom) => {
  const [a, b] = RATIO[ratio]; const k = K[collapse]
  const narrow = Math.max(4 * k, 16 * zoom * k / 4)
  return { t: narrow / Math.min(a, b) * (a + b) + GAP[gap], narrow, a, b, gap: GAP[gap] }
}

// En la página: medidas de un GSplit (o del contenedor viejo en «antes»)
const MEASURE = (sel) => {
  const sp = document.querySelector(sel)
  if (!sp) return null
  const kids = [...sp.children].filter((k) => !k.hidden)
  const R = (e) => { const r = e.getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top, b: r.bottom, w: r.width, h: r.height } }
  const box = R(sp)
  const regs = kids.map(R)
  let spill = 0
  for (const reg of kids) {
    const Q = reg.getBoundingClientRect()
    for (const e of reg.querySelectorAll('*')) {
      const r = e.getBoundingClientRect()
      if (r.width <= 1 || getComputedStyle(e).position === 'fixed') continue // el texto oculto accesible (1 px) no cuenta
      const g = Math.max(r.right - Q.right, Q.left - r.left)
      if (g > spill) spill = g
    }
  }
  // Orden: todo lo enfocable de la primera región va antes en el DOM que lo de la segunda; ningún tabindex positivo; sin `order`
  const foc = 'a[href],button:not([disabled]),input:not([disabled]):not([type=hidden]),select,textarea,[tabindex]'
  const f0 = kids[0] ? [...kids[0].querySelectorAll(foc)] : []
  const f1 = kids[1] ? [...kids[1].querySelectorAll(foc)] : []
  const domOrder = !f0.length || !f1.length || !!(f0[f0.length - 1].compareDocumentPosition(f1[0]) & Node.DOCUMENT_POSITION_FOLLOWING)
  const posTab = [...sp.querySelectorAll('[tabindex]')].some((e) => e.tabIndex > 0)
  const orderProp = kids.some((k) => getComputedStyle(k).order !== '0')
  return { box, regs, spill: Math.round(spill), hscroll: document.documentElement.scrollWidth > innerWidth + 0.5, domOrder, posTab, orderProp, nf: f0.length + f1.length, dir: getComputedStyle(sp).direction }
}

// ---------- Bloques ----------
const BLOCKS = [
  { key: 'po', gb: 'product-overview-01', url: 'ecommerce/product-overview.html?v=01', ratio: '1-1', collapse: 'lg', gap: 'lg', antes: '.g-adaptive-layout' },
  { key: 'cart', gb: 'cart-01', url: 'ecommerce/cart.html?v=01', ratio: '3-2', collapse: 'md', gap: 'lg', antes: '.g-adaptive-layout' },
  { key: 'checkout', gb: 'checkout-03', url: 'ecommerce/checkout.html?v=03', ratio: '3-2', collapse: 'md', gap: 'lg', antes: '.g-adaptive-layout' },
  { key: 'availability', gb: 'availability-03', url: 'booking/availability.html?v=03', ratio: '2-1', collapse: 'md', gap: 'lg', antes: '.g-price-scope > .g-stack' }
]
const WIDTHS = [1440, 1024, 768, 390, 320]
const readyBank = () => document.documentElement.dataset.ready === '1'

async function bloques (b, engine) {
  for (const B of BLOCKS) {
    for (const zoom of [1, 2]) {
      for (const vw of WIDTHS) {
        cur = `${engine} bloques`
        const tag = `${B.key} ${vw}${zoom === 2 ? ' texto 200 %' : ''}`
        const url = `${O}/packages/blocks/playground/${B.url}${zoom === 2 ? '&zoom=2' : ''}`
        const { p, close } = await open(b, url, { vw, ready: readyBank })
        const m = (sel) => p.evaluate(`(${MEASURE.toString()})(${JSON.stringify(sel)})`)
        const before = await m(`[data-gb="${B.gb}"] ${B.antes}`)
        // ANTES: las dos piezas siempre una debajo de otra (EC-L7 reproducido) y sin desbordar
        ok(before && before.regs.length === 2, `${tag} · antes: dos piezas`)
        if (before && before.regs.length === 2) {
          ok(before.regs[1].t >= before.regs[0].b - 0.5, `${tag} · antes: apilado (EC-L7)`, `${Math.round(before.regs[0].b)}→${Math.round(before.regs[1].t)}`)
        }
        // DESPUÉS
        await p.addScriptTag({ url: `${O}/design/lab/split/r01/sp.js` })
        await p.evaluate(() => window.GSplitLab.apply())
        await settle(p, 300)
        const a = await m(`[data-gb="${B.gb}"] .sp`)
        const th = threshold(B, zoom)
        const side = a.regs.length === 2 && Math.abs(a.regs[0].t - a.regs[1].t) < 1 && a.regs[1].l > a.regs[0].l
        const expSide = a.box.w >= th.t - 0.5
        ok(side === expSide, `${tag} · después: ${expSide ? 'al lado' : 'apilado'} (caja ${Math.round(a.box.w)}, umbral ${Math.round(th.t)})`, `${Math.round(a.regs[0].w)}|${Math.round(a.regs[1].w)}`)
        if (side) {
          const free = a.box.w - th.gap
          ok(near(a.regs[0].w, free * th.a / (th.a + th.b)) && near(a.regs[1].w, free * th.b / (th.a + th.b)), `${tag} · proporción ${B.ratio.replace('-', ':')} exacta`, `${a.regs[0].w.toFixed(1)}|${a.regs[1].w.toFixed(1)}`)
          ok(Math.min(a.regs[0].w, a.regs[1].w) >= th.narrow - 0.5, `${tag} · el lado estrecho ≥ collapse (${th.narrow})`, Math.round(Math.min(a.regs[0].w, a.regs[1].w)))
          ok(near(a.regs[1].l - a.regs[0].r, th.gap, 0.75), `${tag} · separación ${th.gap}`, (a.regs[1].l - a.regs[0].r).toFixed(1))
        } else {
          ok(a.regs.every((r) => near(r.w, a.box.w, 0.75)), `${tag} · apilado: cada región a todo el ancho`)
          ok(a.regs[1].t > a.regs[0].t && near(a.regs[1].t - a.regs[0].b, th.gap, 0.75), `${tag} · apilado: start arriba, end debajo, separación ${th.gap}`, (a.regs[1].t - a.regs[0].b).toFixed(1))
        }
        ok(!a.hscroll, `${tag} · sin desplazamiento horizontal`)
        // Lo que sobresale de una región: nunca más que antes (lo que ya sobresalía es del contenido, no del GSplit)
        ok(a.spill <= Math.max(0, before ? before.spill : 0) + 0.5, `${tag} · nada sobresale de su región (más que antes)`, `después ${a.spill} · antes ${before ? before.spill : '?'}`)
        if (a.spill > 0) note(`${tag}: sobresale ${a.spill} px también antes (${before.spill}): es del contenido`)
        ok(a.domOrder && !a.posTab && !a.orderProp, `${tag} · orden del DOM = lectura y Tab (sin order ni tabindex positivo)`, `enfocables ${a.nf}`)
        ok(p.__errs.length === 0, `${tag} · consola limpia`, p.__errs.join(' | '))
        await close()
      }
    }
    // Sin histéresis: 768 → 1440 → 1024 → 1440 → 320 → 1440 da lo mismo que cargar en cada ancho
    cur = `${engine} bloques`
    const { p, close } = await open(b, `${O}/packages/blocks/playground/${B.url}`, { vw: 768, ready: readyBank })
    await p.addScriptTag({ url: `${O}/design/lab/split/r01/sp.js` })
    await p.evaluate(() => window.GSplitLab.apply())
    const seq = []
    for (const vw of [768, 1440, 1024, 1440, 320, 1440]) {
      await p.setViewportSize({ width: vw, height: 900 })
      await settle(p, 350)
      const a = await p.evaluate(`(${MEASURE.toString()})(${JSON.stringify(`[data-gb="${B.gb}"] .sp`)})`)
      const side = Math.abs(a.regs[0].t - a.regs[1].t) < 1
      seq.push(`${vw}:${side ? 'L' : 'A'}`)
      ok(side === (a.box.w >= threshold(B, 1).t - 0.5), `${B.key} · cambio de tamaño a ${vw}: decide solo la caja (sin histéresis)`, seq.join(' '))
    }
    await close()
  }
  // Booking summary 03: solo antes (no es caso de GSplit): sin desbordar a 390 y 320
  for (const vw of [1440, 768, 390, 320]) {
    cur = `${engine} bloques`
    const { p, close } = await open(b, `${O}/packages/blocks/playground/booking/booking-summary.html?v=03`, { vw, ready: readyBank })
    const hs = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 0.5)
    ok(!hs, `booking-summary 03 ${vw} · línea de GAdaptiveLayout sin desplazamiento horizontal (no necesita GSplit)`)
    await close()
  }
}

// ---------- Casos ----------
async function casos (b, engine) {
  cur = `${engine} casos`
  const { p, close } = await open(b, `${O}/design/lab/split/r01/index.html?vista=casos`, { vw: 1440, ready: () => window.__lab && window.__lab.ready })
  const R = (sel) => p.evaluate((s) => { const e = document.querySelector(s); const r = e.getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top, b: r.bottom, w: r.width, h: r.height } }, sel)
  const regs = (sel) => p.evaluate((s) => [...document.querySelector(s).children].map((e) => { const r = e.getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top, b: r.bottom, w: r.width, h: r.height } }), sel)
  // K1 proporciones
  for (const [rat, [a, bb]] of Object.entries({ '1:1': [1, 1], '2:1': [2, 1], '1:2': [1, 2], '3:2': [3, 2], '2:3': [2, 3] })) {
    const [x, y] = await regs(`#k1 [data-ratio="${rat}"]`)
    const free = (await R(`#k1 [data-ratio="${rat}"]`)).w - 24
    ok(near(x.t, y.t, 0.5) && near(x.w, free * a / (a + bb)) && near(y.w, free * bb / (a + bb)), `K1 ${rat} al lado y exacta`, `${x.w.toFixed(1)}|${y.w.toFixed(1)}`)
  }
  // K2 umbral exacto
  const [a1, a2] = await regs('#k2a .sp'); const [b1, b2] = await regs('#k2b .sp')
  ok(a2.t > a1.t, 'K2 a 983 px (umbral − 1) apila')
  ok(near(b1.t, b2.t, 0.5) && b2.l > b1.l, 'K2 a 984 px (umbral) al lado', `${b1.w.toFixed(1)}|${b2.w.toFixed(1)}`)
  ok(near(b2.w, 320, 0.75), 'K2 en el umbral el lado estrecho mide collapse (320)', b2.w.toFixed(2))
  // K3 caja y no visor
  const [c1, c2] = await regs('#k3 .sp')
  ok(c2.t > c1.t && near(c1.w, 480, 0.75), 'K3 cajón de 480 en visor de 1440: apila')
  // K4 anidado
  const [o1, o2] = await regs('#k4o'); const [i1, i2] = await regs('#k4i')
  const k4w = (await R('#k4')).w
  ok(near(o1.t, o2.t, 0.5), 'K4 exterior 2:1 al lado', `${o1.w.toFixed(0)}|${o2.w.toFixed(0)}`)
  const innerT = 256 * 2 + 24
  ok((o1.w >= innerT) === near(i1.t, i2.t, 0.5), `K4 interior decide por su caja (${Math.round(o1.w)} frente a umbral ${innerT})`, `caja ${k4w}`)
  // K5 RTL
  const [r1, r2] = await regs('#k5 .sp')
  ok(near(r1.t, r2.t, 0.5) && r1.l > r2.l, 'K5 RTL: start a la derecha, end a la izquierda')
  // K6 una región
  const [s1] = await regs('#k6 .sp'); const k6 = await R('#k6 .sp')
  ok(near(s1.w, k6.w, 0.5), 'K6 una sola región: ancho completo')
  // K7 separación al lado y apilada
  for (const g of [0, 12, 24, 48, 18]) {
    const [x, y] = await regs(`#k7 [data-g="${g}"]`)
    ok(near(x.t, y.t, 0.5) && near(y.l - x.r, g, 0.6), `K7 separación ${g} al lado`, (y.l - x.r).toFixed(2))
  }
  const [t1, t2] = await regs('#k7s .sp')
  ok(t2.t > t1.t && near(t2.t - t1.b, 48, 0.6), 'K7 separación lg apilada = 48 (la misma en el eje de bloque)', (t2.t - t1.b).toFixed(2))
  // K8 alineación
  for (const al of ['start', 'center', 'stretch']) {
    const [x, y] = await regs(`#k8 [data-a="${al}"]`)
    const exp = al === 'start' ? near(y.t, x.t, 0.5) && y.h < x.h : al === 'center' ? near(y.t + y.h / 2, x.t + x.h / 2, 0.75) : near(y.h, x.h, 0.5)
    ok(exp, `K8 align ${al}`)
  }
  // K9 palabra larga y contenido rígido
  const w9 = await p.evaluate(() => { const e = document.getElementById('k9w'); return { sw: e.scrollWidth, cw: e.clientWidth } })
  ok(w9.sw <= w9.cw + 1, 'K9 palabra larga: se parte dentro de la región estrecha', `${w9.sw}/${w9.cw}`)
  const rg = await p.evaluate(() => { const e = document.getElementById('k9rigid'); const reg = e.parentElement.getBoundingClientRect(); return { e: e.getBoundingClientRect().right, reg: reg.right, w: reg.width } })
  note(`K9 contenido rígido de 520 px en una región de ${Math.round(rg.w)} px: sobresale ${Math.round(rg.e - rg.reg)} px (límite conocido: sin suelo de contenido, punto 9)`)
  // K10 orden de foco con Tab real, al lado y en una caja estrecha
  for (const w of [1000, 360]) {
    await p.evaluate((w) => { document.getElementById('k10').style.inlineSize = `${w}px` }, w)
    await settle(p)
    await p.evaluate(() => { document.getElementById('k9w').setAttribute('tabindex', '-1'); document.getElementById('k9w').focus() })
    const seen = []
    for (let i = 0; i < 3; i++) { await p.keyboard.press('Tab'); seen.push(await p.evaluate(() => document.activeElement && document.activeElement.dataset.o)) }
    // WebKit no lleva el foco a los botones con Tab sin la preferencia del sistema: entonces se comprueba el orden del DOM
    if (seen.every((x) => !x)) {
      const dom = await p.evaluate(() => [...document.querySelectorAll('#k10 [data-o]')].map((e) => e.dataset.o).join(''))
      ok(dom === '123', `K10 (${w}) orden del DOM 1-2-3 (el motor no enfoca botones con Tab)`)
      note(`K10 ${engine}: Tab no enfoca botones (preferencia del motor); se comprobó el orden del DOM`)
    } else ok(seen.join('') === '123', `K10 (${w}) Tab recorre 1 → 2 → 3`, seen.join(','))
    const [x, y] = await regs('#k10 .sp')
    if (w === 1000) ok(near(x.t, y.t, 0.5) && y.l > x.l, 'K10 al lado: lo que se lee primero está al inicio')
    else ok(y.t > x.t, 'K10 apilado: lo que se lee primero está arriba')
  }
  // K11 experimento sticky (reservado): ¿el último control de una región pegada más alta que el visor se puede ver con el foco?
  await p.setViewportSize({ width: 1440, height: 700 })
  await settle(p)
  await p.evaluate(() => { const e = document.getElementById('k11first'); e.scrollIntoView({ block: 'start' }); e.focus() })
  await settle(p)
  await p.evaluate(() => document.getElementById('k11last').focus())
  await settle(p, 200)
  const vis = await p.evaluate(() => { const r = document.getElementById('k11last').getBoundingClientRect(); return { t: Math.round(r.top), b: Math.round(r.bottom), vh: innerHeight, y: Math.round(scrollY) } })
  const seenLast = vis.t >= 0 && vis.b <= vis.vh
  note(`K11 sticky (experimento): «Pagar» con el foco ${seenLast ? 'VISIBLE' : 'FUERA DE LA VISTA'} (top ${vis.t}, bottom ${vis.b}, visor ${vis.vh}, scrollY ${vis.y})`)
  ok(true, 'K11 experimento medido (no es criterio de aceptación)')
  ok(p.__errs.length === 0, 'casos · consola limpia', p.__errs.join(' | '))
  await close()
}

for (const engine of ENGINES) {
  const b = await pw[engine].launch()
  try {
    if (PARTS.includes('casos')) await casos(b, engine)
    if (PARTS.includes('bloques')) await bloques(b, engine)
  } catch (e) { cur = `${engine} error`; ok(false, 'excepción', String(e).slice(0, 300)) }
  await b.close()
}
server.close()
console.log('\nResumen:')
for (const [k, [g, t]] of Object.entries(tally)) console.log(`  ${k}: ${g}/${t}`)
console.log(`\n${total - failed}/${total} pasan`)
if (notes.length) console.log('\nNotas:\n  ' + notes.join('\n  '))
if (fails.length) console.log('\nFallos:\n  ' + fails.join('\n  '))
process.exit(failed ? 1 : 0)
