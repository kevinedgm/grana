// Verificación de estilo de GCardGroup (coco) sobre estilo-banco.html: geometría de la lengüeta y del puente, tiempos de #611,
// contraste del marco y de la seleccionada, rejilla, 375px, RTL, forced-colors, movimiento reducido, temas generados.
// Ejecutar desde la raíz: GRANA_PW_PORT=4224 node design/lab/card-group/estilo-verificar.mjs
// (ENGINES=chromium,firefox,webkit; VERBOSE=1). Requiere packages/vue/dist (npm run build). Solo lee.
import http from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../../../', import.meta.url))
const PORT = Number(process.env.GRANA_PW_PORT || 4224)
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.json': 'application/json', '.svg': 'image/svg+xml' }
const server = http.createServer(async (req, res) => {
  try {
    const path = normalize(join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname)))
    if (!path.startsWith(ROOT)) throw new Error('fuera')
    res.writeHead(200, { 'content-type': TYPES[extname(path)] || 'application/octet-stream' }).end(await readFile(path))
  } catch { if (!res.headersSent) res.writeHead(404).end() }
})
await new Promise((r) => server.listen(PORT, '127.0.0.1', r))
const BASE = `http://127.0.0.1:${PORT}/design/lab/card-group/estilo-banco.html`
const pw = await import(new URL('../theme-playground/node_modules/playwright/index.mjs', import.meta.url))

const ENGINES = (process.env.ENGINES || 'chromium,firefox,webkit').split(',')
const V = !!process.env.VERBOSE
const R = []
const rec = (eng, part, name, ok, info = '') => { R.push({ eng, part, name, ok: !!ok, info }); if (V || !ok) console.log(`${ok ? 'ok  ' : 'FALLA'} ${eng} ${part} · ${name}${info ? ' · ' + info : ''}`) }
const MEAS = []

const H = () => {
  window.__rgb = (c) => { const cv = document.createElement('canvas'); cv.width = cv.height = 1; const x = cv.getContext('2d'); x.fillStyle = '#000'; x.fillStyle = c; x.fillRect(0, 0, 1, 1); const d = x.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255] }
  window.__over = (top, under) => { const a = top[3]; return [0, 1, 2].map((i) => top[i] * a + under[i] * (1 - a)).concat(1) }
  window.__lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) }
  window.__ratio = (a, b) => { const L1 = __lum(a), L2 = __lum(b); return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05) }
  window.__tok = (n) => __rgb(getComputedStyle(document.documentElement).getPropertyValue(n).trim())
}
async function open(b, q = '', opts = {}) {
  const { vw = 1200, vh = 900, ...ctx } = opts
  const context = await b.newContext({ viewport: { width: vw, height: vh }, ...ctx })
  const p = await context.newPage()
  const errs = []
  p.on('console', (m) => { if (['error', 'warning'].includes(m.type()) && !/bounce tracker/.test(m.text())) errs.push(m.text()) }) // aviso de privacidad de Firefox, ajeno al banco
  p.on('pageerror', (e) => errs.push(String(e)))
  await p.goto(BASE + q, { timeout: 90000 })
  await p.waitForFunction(() => window.__ready)
  await p.evaluate(H)
  await p.evaluate(() => document.fonts.ready)
  p.__errs = errs
  return p
}
const press = (p, g, v) => p.click(`#${g} .g-card[data-value="${v}"] .g-card__primary`)
const settle = (p, ms = 1400) => p.waitForTimeout(ms)

// Geometría de la unión: la seleccionada, su puente y el marco
const geo = ([g, v]) => {
  const root = document.getElementById(g)
  const strip = root.querySelector('.g-card-group__strip')
  const card = root.querySelector(`.g-card[data-value="${v}"]`)
  const panel = root.querySelector('.g-card-group__panel')
  const br = [...root.querySelectorAll('.g-card-group__bridge:not(.is-leaving)')]
  const c = card.getBoundingClientRect(), pr = panel.getBoundingClientRect()
  const b = br[0] ? br[0].getBoundingClientRect() : null
  const ps = getComputedStyle(panel), cs = getComputedStyle(card), bs = br[0] ? getComputedStyle(br[0]) : null
  const edge = parseFloat(ps.borderTopWidth)
  return {
    n: br.length, edge,
    dx: b ? Math.abs(b.left - c.left) : null, dw: b ? Math.abs(b.width - c.width) : null,
    topD: b ? Math.abs(b.top - (c.bottom - edge)) : null, botD: b ? Math.abs(b.bottom - (pr.top + edge)) : null,
    slot: pr.top + edge - c.bottom,
    bl: cs.borderBottomLeftRadius, brr: cs.borderBottomRightRadius, tl: cs.borderTopLeftRadius,
    bridgeSide: bs ? parseFloat(bs.borderLeftWidth) : null,
    cardSide: parseFloat(cs.borderLeftWidth) + parseFloat(getComputedStyle(card, '::after').borderLeftWidth),
    frame: ps.borderTopColor, mark: getComputedStyle(card, '::after').borderLeftColor,
    filtered: panel.classList.contains('is-filtered')
  }
}

for (const name of ENGINES) {
  const b = await pw[name].launch()
  const E = name

  // ---------- 1 · Lengüeta: geometría, marco y puente (tiempos × 5 con ?slow=1: las comprobaciones de transición no dependen de la carga) ----------
  {
    const p = await open(b, '?slow=1')
    const g0 = await p.evaluate(geo, ['g-one', 'vencida'])
    rec(E, 'lengüeta', 'reposo: sin puente, marco border-strong', g0.n === 0 && !g0.filtered)
    rec(E, 'lengüeta', 'esquinas inferiores rectas, superiores redondeadas', g0.bl === '0px' && g0.brr === '0px' && g0.tl !== '0px', `${g0.tl} / ${g0.bl}`)
    const gap = await p.evaluate(() => { const cs = [...document.querySelectorAll('#g-one .g-card')].map((c) => c.getBoundingClientRect()); return cs[1].left - cs[0].right })
    const sp = await p.evaluate(() => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--g-space-1')))
    rec(E, 'lengüeta', 'separación entre lengüetas = space × 2', Math.abs(gap - sp * 2) < 0.6, gap.toFixed(2))
    rec(E, 'lengüeta', 'ranura tarjeta → borde interior del marco = space × 2', Math.abs(g0.slot - sp * 2) < 0.6, g0.slot.toFixed(2))
    const boxes0 = await p.evaluate(() => [...document.querySelectorAll('#g-one .g-card, #g-one .g-card-group__panel')].map((e) => { const r = e.getBoundingClientRect(); return [r.x, r.y, r.width, e.classList.contains("g-card-group__panel") ? 0 : r.height].map((n) => n.toFixed(2)).join() }).join('|'))
    await press(p, 'g-one', 'vencida'); await settle(p)
    const g1 = await p.evaluate(geo, ['g-one', 'vencida'])
    rec(E, 'lengüeta', 'pulsar: un puente, x y ancho Δ0 respecto de la tarjeta', g1.n === 1 && g1.dx < 0.6 && g1.dw < 0.6, `dx ${g1.dx?.toFixed(2)} dw ${g1.dw?.toFixed(2)}`)
    rec(E, 'lengüeta', 'el puente tapa el borde inferior doble de la tarjeta (nace en card.bottom − edge)', g1.topD < 0.6, g1.topD?.toFixed(2))
    rec(E, 'lengüeta', 'el puente cubre el borde superior del marco (acaba en su cara interior)', g1.botD < 0.6, g1.botD?.toFixed(2))
    rec(E, 'lengüeta', 'lados del puente = borde doble de la tarjeta (2 × border-width)', Math.abs(g1.bridgeSide - g1.cardSide) < 0.1 && Math.abs(g1.bridgeSide - g1.edge) < 0.1, `${g1.bridgeSide} / ${g1.cardSide} / marco ${g1.edge}`)
    rec(E, 'lengüeta', 'marco en primary-text con is-filtered (= color de la marca de la tarjeta)', g1.filtered && g1.frame === g1.mark, `${g1.frame}`)
    const boxes1 = await p.evaluate(() => [...document.querySelectorAll('#g-one .g-card, #g-one .g-card-group__panel')].map((e) => { const r = e.getBoundingClientRect(); return [r.x, r.y, r.width, e.classList.contains("g-card-group__panel") ? 0 : r.height].map((n) => n.toFixed(2)).join() }).join('|'))
    rec(E, 'lengüeta', 'pulsar no mueve ninguna caja (Δ0)', boxes0 === boxes1)
    // Píxel: en medio de la ranura bajo la pulsada ya no hay hueco (el lado del puente es la marca)
    // Contraste: marca (borde de la seleccionada y del marco) frente a lo adyacente
    const ct = await p.evaluate(() => {
      const surf = __tok('--g-color-surface'), bg = __tok('--g-color-bg'), mark = __tok('--g-color-primary-text'), tint = __tok('--g-card-selected'), rest = __tok('--g-color-border-strong')
      const inside = __over(tint, surf)
      return { markBg: __ratio(mark, bg), markSurf: __ratio(mark, surf), markTint: __ratio(mark, inside), restBg: __ratio(__over(rest, bg), bg), restSurf: __ratio(__over(rest, surf), surf) }
    })
    const ok3 = Math.min(ct.markBg, ct.markSurf, ct.markTint) >= 3
    rec(E, 'contraste', 'marca (marco filtrado, bordes de la seleccionada y del puente) ≥ 3:1 frente a fondo, superficie y tinte', ok3, `bg ${ct.markBg.toFixed(2)} · surface ${ct.markSurf.toFixed(2)} · tinte ${ct.markTint.toFixed(2)}`)
    if (E === 'chromium') MEAS.push(['defecto claro', ct])
    // Viaja: mismo nodo, nuevo sitio
    const id0 = await p.evaluate(() => { const el = document.querySelector('#g-one .g-card-group__bridge'); el.__mark = 1; return 1 })
    const travel = await p.evaluate(async () => { document.querySelector('#g-one .g-card[data-value="pagada"] .g-card__primary').click(); await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))); const el = document.querySelector('#g-one .g-card-group__bridge:not(.is-leaving)'); return { same: el && el.__mark === 1, props: el ? el.getAnimations().map((a) => a.transitionProperty).sort().join() : '' } })
    rec(E, 'movimiento', 'cambiar de tarjeta: el mismo puente viaja (translate; el ancho solo si cambia)', id0 && travel.same && /translate/.test(travel.props), travel.props)
    await settle(p)
    const g2 = await p.evaluate(geo, ['g-one', 'pagada'])
    rec(E, 'movimiento', 'tras viajar: Δ0 bajo la nueva', g2.n === 1 && g2.dx < 0.6 && g2.dw < 0.6, `dx ${g2.dx?.toFixed(2)}`)
    const tr = await p.evaluate(() => { const s = getComputedStyle(document.querySelector('#g-one .g-card-group__bridge')); return { p: s.transitionProperty, d: s.transitionDuration, f: s.transitionTimingFunction } })
    const tok = await p.evaluate(() => ['--g-duration-press', '--g-duration-slow', '--g-duration-fast', '--g-ease-out'].map((n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim()))
    rec(E, 'movimiento', 'tiempos #611: translate/inline-size press, scale slow, todo ease-out (sin muelle)', /translate/.test(tr.p) && /scale/.test(tr.p) && !/linear\(/.test(tr.f) && tr.f.split(',').length >= 3, `${tr.p} · ${tr.d} · ${tr.f}`)
    if (E === 'chromium') MEAS.push(['tiempos', { ...tr, tokens: tok }])
    // Se recoge: is-leaving con scale fast
    const leave = await p.evaluate(async () => { document.querySelector('#g-one .g-card[data-value="pagada"] .g-card__primary').click(); await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))); const el = document.querySelector('#g-one .g-card-group__bridge.is-leaving'); if (!el) return null; const s = getComputedStyle(el); return { p: s.transitionProperty, d: s.transitionDuration, anim: el.getAnimations().map((a) => a.transitionProperty).join() } })
    rec(E, 'movimiento', 'soltar: is-leaving se recoge (scale, duración fast)', leave && /scale/.test(leave.p) && /scale/.test(leave.anim), JSON.stringify(leave))
    await settle(p)
    const gone = await p.evaluate(() => document.querySelectorAll('#g-one .g-card-group__bridge').length)
    const gr = await p.evaluate(geo, ['g-one', 'vencida'])
    rec(E, 'movimiento', 'tras soltar: sin puente y marco en reposo', gone === 0 && !gr.filtered)
    // Aparece: crece desde la tarjeta (scale en bloque, origen arriba)
    const grow = await p.evaluate(async () => { document.querySelector('#g-one .g-card[data-value="vencida"] .g-card__primary').click(); await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))); const el = document.querySelector('#g-one .g-card-group__bridge'); return { anim: el.getAnimations().map((a) => a.transitionProperty).join(), origin: getComputedStyle(el).transformOrigin } })
    rec(E, 'movimiento', 'aparece: crece (scale) desde arriba', /scale/.test(grow.anim) && /\s0px$/.test(grow.origin), JSON.stringify(grow))
    // Foco distinto de la pulsada
    await settle(p)
    await p.focus('#g-one .g-card[data-value="pendiente"] .g-card__primary')
    await p.keyboard.press(E === 'webkit' ? 'Alt+Tab' : 'Tab')
    const fo = await p.evaluate(() => { const s = getComputedStyle(document.querySelector('#g-one .g-card[data-value="vencida"]'), '::after'); return { o: s.outlineStyle, oc: s.outlineColor, bc: s.borderLeftColor } })
    rec(E, 'foco', 'pulsada con foco: anillo (outline) además del borde de la marca', fo.o !== 'none', JSON.stringify(fo))
    // Táctil: la tarjeta entera es el blanco
    const tap = await p.evaluate(() => { const r = document.querySelector('#g-one .g-card .g-card__primary').getBoundingClientRect(); const c = document.querySelector('#g-one .g-card').getBoundingClientRect(); return Math.min(c.width, c.height) })
    rec(E, 'táctil', 'blanco (tarjeta entera por el estirado) ≥ 44px', tap >= 44, tap.toFixed(1))
    // Doble marco: GTable sin borde exterior; con paginación la última línea se queda
    const tbl = await p.evaluate(() => { const t = document.querySelector('#t-one'); const s = getComputedStyle(t); const last = t.querySelector('tbody > tr:last-child > td'); return { tb: s.borderTopWidth, sh: s.boxShadow, pag: !!t.querySelector(':scope > .g-pagination'), lastLine: getComputedStyle(last).borderBottomColor } })
    rec(E, 'doble marco', 'GTable dentro del panel sin borde ni sombra propios', (tbl.tb === '0px') && tbl.sh === 'none', JSON.stringify(tbl))
    rec(E, 'errores', 'consola sin errores ni avisos', p.__errs.length === 0, p.__errs.join(' | '))
    await p.context().close()
  }

  // ---------- 2 · Sin paginación: la última línea de la tabla se quita ----------
  {
    const p = await open(b)
    const r = await p.evaluate(() => {
      const t = document.querySelector('#t-one'); const pag = t.querySelector(':scope > .g-pagination'); pag && pag.remove()
      const td = t.querySelector('tbody > tr:last-child > td'); return getComputedStyle(td).borderBottomColor
    })
    const alpha = (await p.evaluate((c) => __rgb(c)[3], r))
    rec(E, 'doble marco', 'tabla «lines» última en el panel y sin paginación: sin línea bajo la última fila', alpha === 0, r)
    await p.context().close()
  }

  // ---------- 3 · Primer posicionamiento sin animar (seed) ----------
  {
    const p = await open(b, '?seed=1')
    const a = await p.evaluate(() => { const el = document.querySelector('#g-one .g-card-group__bridge'); return { has: !!el, anim: el ? el.getAnimations().length : -1, ready: document.querySelector('#g-one').classList.contains('is-ready') } })
    rec(E, 'movimiento', 'modelo inicial: el puente está y no se animó al montar (is-ready después)', a.has && a.anim === 0 && a.ready, JSON.stringify(a))
    const g = await p.evaluate(geo, ['g-one', 'vencida'])
    rec(E, 'movimiento', 'modelo inicial: Δ0', g.dx < 0.6 && g.dw < 0.6)
    await p.context().close()
  }

  // ---------- 4 · multiple: un puente por pulsada ----------
  {
    const p = await open(b)
    await press(p, 'g-multi', 'pendiente'); await press(p, 'g-multi', 'pagada'); await settle(p)
    const m = await p.evaluate(() => [...document.querySelectorAll('#g-multi .g-card-group__bridge')].map((br) => { const c = document.querySelector(`#g-multi .g-card[data-value="${br.dataset.for}"]`).getBoundingClientRect(); const r = br.getBoundingClientRect(); return Math.abs(r.left - c.left) + Math.abs(r.width - c.width) }))
    rec(E, 'multiple', 'dos pulsadas, dos puentes Δ0', m.length === 2 && m.every((d) => d < 1), m.join())
    await p.context().close()
  }

  // ---------- 5 · Rejilla sin panel ----------
  for (const [vw, cols] of [[1200, 5], [375, 2]]) {
    const p = await open(b, '', { vw })
    const r = await p.evaluate(() => { const s = document.querySelector('#g-grid .g-card-group__strip'); const tops = [...s.children].map((c) => Math.round(c.getBoundingClientRect().top)); return { perRow: tops.filter((t) => t === tops[0]).length, hasBridge: !!s.querySelector('.g-card-group__bridge') } })
    rec(E, 'rejilla', `sin panel a ${vw}px: ${cols} por fila (mínimo space × 34)`, r.perRow === cols && !r.hasBridge, `${r.perRow}`)
    await press(p, 'g-grid', 'vencida'); await settle(p, 300)
    const sel = await p.evaluate(() => { const c = document.querySelector('#g-grid .g-card[data-value="vencida"]'); const s = getComputedStyle(c); return { r: s.borderBottomLeftRadius, b: getComputedStyle(c, '::after').borderBottomColor } })
    rec(E, 'rejilla', `sin panel a ${vw}px: la seleccionada conserva la forma de GCard (esquinas redondeadas, borde doble cerrado)`, sel.r !== '0px', JSON.stringify(sel))
    if (vw === 375) {
      const tab = await p.evaluate(() => { const s = document.querySelector('#g-one .g-card-group__strip'); const tops = [...s.querySelectorAll(':scope > .g-card')].map((c) => Math.round(c.getBoundingClientRect().top)); return { oneRow: new Set(tops).size === 1, scrolls: s.scrollWidth > s.clientWidth, w: Math.round(s.querySelector('.g-card').getBoundingClientRect().width), page: document.documentElement.scrollWidth <= innerWidth } })
      rec(E, '375', 'con panel: una fila que se desplaza; lengüeta ≥ space × 44; sin desplazamiento horizontal de la página', tab.oneRow && tab.scrolls && tab.w >= 176 && tab.page, JSON.stringify(tab))
      // Puente con la tira desplazada
      await p.evaluate(() => { document.querySelector('#g-one .g-card[data-value="en disputa"]').scrollIntoView({ inline: 'nearest', block: 'nearest' }) })
      await press(p, 'g-one', 'en disputa'); await settle(p)
      const gs = await p.evaluate(geo, ['g-one', 'en disputa'])
      rec(E, '375', 'tira desplazada: el puente sigue a la tarjeta (Δ0)', gs.dx < 0.6 && gs.dw < 0.6, `dx ${gs.dx?.toFixed(2)}`)
    }
    await p.context().close()
  }

  // ---------- 6 · RTL ----------
  {
    const p = await open(b, '?dir=rtl')
    await press(p, 'g-one', 'pagada'); await settle(p)
    const g = await p.evaluate(geo, ['g-one', 'pagada'])
    rec(E, 'rtl', 'puente Δ0 en RTL', g.n === 1 && g.dx < 0.6 && g.dw < 0.6, `dx ${g.dx?.toFixed(2)}`)
    await press(p, 'g-one', 'pendiente'); await settle(p)
    const g2 = await p.evaluate(geo, ['g-one', 'pendiente'])
    rec(E, 'rtl', 'viaja y queda Δ0 en RTL', g2.dx < 0.6, `dx ${g2.dx?.toFixed(2)}`)
    const g3 = await p.evaluate(() => { const c = getComputedStyle(document.querySelector('#g-one .g-card')); return c.borderBottomLeftRadius + ' ' + c.borderBottomRightRadius })
    rec(E, 'rtl', 'esquinas inferiores rectas en RTL', g3 === '0px 0px', g3)
    await p.context().close()
  }

  // ---------- 7 · Movimiento reducido ----------
  {
    const p = await open(b, '?slow=1', { reducedMotion: 'reduce' })
    const a = await p.evaluate(async () => { document.querySelector('#g-one .g-card[data-value="vencida"] .g-card__primary').click(); await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))); const el = document.querySelector('#g-one .g-card-group__bridge'); return { anim: el.getAnimations().map((x) => x.transitionProperty).join(), p: getComputedStyle(el).transitionProperty } })
    rec(E, 'reduce', 'aparece: solo opacidad', a.p === 'opacity' && /^(opacity)?$/.test(a.anim), JSON.stringify(a))
    await settle(p)
    const t = await p.evaluate(async () => { document.querySelector('#g-one .g-card[data-value="pagada"] .g-card__primary').click(); await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))); const el = document.querySelector('#g-one .g-card-group__bridge:not(.is-leaving)'); return el.getAnimations().map((x) => x.transitionProperty).join() })
    rec(E, 'reduce', 'cambia: salta de sitio (sin translate ni tamaño animados)', !/translate|inline-size|width|scale/.test(t), t)
    await settle(p)
    const l = await p.evaluate(async () => { document.querySelector('#g-one .g-card[data-value="pagada"] .g-card__primary').click(); await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))); const el = document.querySelector('#g-one .g-card-group__bridge.is-leaving'); return el ? { p: getComputedStyle(el).transitionProperty, o: getComputedStyle(el).opacity, s: getComputedStyle(el).scale } : null })
    rec(E, 'reduce', 'se retira: fundido, sin recoger', l && l.p === 'opacity' && (l.s === 'none' || l.s === '1'), JSON.stringify(l))
    await p.context().close()
  }

  // ---------- 8 · forced-colors (solo Chromium lo emula) ----------
  if (E === 'chromium') {
    const p = await open(b, '', { forcedColors: 'active' })
    await press(p, 'g-one', 'vencida'); await settle(p)
    const f = await p.evaluate(() => {
      const hl = __rgb('Highlight').join(), panel = getComputedStyle(document.querySelector('#g-one .g-card-group__panel')), br = getComputedStyle(document.querySelector('#g-one .g-card-group__bridge'))
      const ref = document.createElement('div'); ref.style.color = 'Highlight'; document.body.append(ref); const hlc = getComputedStyle(ref).color; ref.remove()
      return { frame: panel.borderTopColor, side: br.borderLeftColor, hl: hlc }
    })
    rec(E, 'forced-colors', 'marco filtrado y lados del puente en Highlight', f.frame === f.hl && f.side === f.hl, JSON.stringify(f))
    await p.context().close()
  }

  // ---------- 9 · Oscuro y temas generados: contraste de la marca ----------
  for (const q of ['?dark=1', '?theme=amazon', '?theme=amazon&dark=1', '?theme=stripe', '?theme=stripe&dark=1', '?theme=spotify&dark=1', '?theme=caracol-purpura', '?theme=caracol-purpura&dark=1', '?theme=linear&dark=1', '?theme=notion']) {
    if (E !== 'chromium' && !['?dark=1', '?theme=stripe&dark=1'].includes(q)) continue
    const p = await open(b, q)
    await press(p, 'g-one', 'vencida'); await settle(p)
    const ct = await p.evaluate(() => {
      const surf = __tok('--g-color-surface'), bg = __tok('--g-color-bg'), mark = __tok('--g-color-primary-text'), tint = __tok('--g-card-selected')
      return { markBg: __ratio(mark, bg), markSurf: __ratio(mark, surf), markTint: __ratio(mark, __over(tint, surf)) }
    })
    const g = await p.evaluate(geo, ['g-one', 'vencida'])
    const min = Math.min(ct.markBg, ct.markSurf, ct.markTint)
    rec(E, 'temas', `${q}: marca ≥ 3:1 frente a fondo, superficie y tinte; Δ0`, min >= 3 && g.dx < 0.6, `${ct.markBg.toFixed(2)} · ${ct.markSurf.toFixed(2)} · ${ct.markTint.toFixed(2)}`)
    if (E === 'chromium') MEAS.push([q, ct])
    rec(E, 'temas', `${q}: consola limpia`, p.__errs.length === 0, p.__errs.join(' | '))
    await p.context().close()
  }
  await b.close()
}
server.close()
const bad = R.filter((r) => !r.ok)
if (V || process.env.MEAS) for (const [k, v] of MEAS) console.log('medida', k, JSON.stringify(v))
console.log(`${R.length - bad.length}/${R.length}`)
process.exit(bad.length ? 1 : 0)
