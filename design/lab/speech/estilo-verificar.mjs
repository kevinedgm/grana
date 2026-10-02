// Verificación de coco sobre el banco de la captura de voz (design/lab/speech/estilo-banco.html), con el CSS real.
// Contraste compuesto (texto 4.5:1, provisional incluido; iconos, bordes de estado, medidor y onda 3:1) en pill colocada y
// flotante (13 estados), paneles, disparadores y nota, con el tema por defecto y los temas generados, claro y oscuro;
// foco distinto del énfasis activo; objetivos 24/44px; 320×640 (página, hoja, pill + aviso de GToaster en el borde);
// GDialog modal; RTL; forced-colors; prefers-contrast; movimiento reducido; zoom 200 % (640×450); consola limpia.
// Requiere `npm run build` (dist/grana.umd.js). Ejecutar desde la raíz: node design/lab/speech/estilo-verificar.mjs
// Opcional: --engines=chromium,firefox,webkit  --verbose (mínimos por tema)
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
const BASE = `http://127.0.0.1:${server.address().port}/design/lab/speech/estilo-banco.html`

const GEN = ['amazon', 'apple', 'caracol-purpura', 'github', 'grana', 'linear', 'lustre', 'medium', 'notion', 'spotify']
let total = 0, failed = 0
const fails = []
const ok = (cond, msg) => { total++; if (!cond) { failed++; fails.push(msg) } }
const mins = []

/* ---------- En la página: contraste compuesto de todas las piezas visibles ---------- */
const contrast = () => {
  const parse = (s) => {
    let m = String(s).match(/rgba?\(([^)]+)\)/)
    if (m) { const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p[3] ?? 1] }
    m = String(s).match(/color\(srgb ([^)]+)\)/)
    if (m) { const p = m[1].split(/[\s/]+/).filter(Boolean).map(Number); return [p[0] * 255, p[1] * 255, p[2] * 255, p[3] ?? 1] }
    return [0, 0, 0, 0]
  }
  const over = (t, b) => { const a = t[3]; return [t[0] * a + b[0] * (1 - a), t[1] * a + b[1] * (1 - a), t[2] * a + b[2] * (1 - a), 1] }
  const bgOf = (el) => {
    const layers = []
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) { const c = parse(getComputedStyle(n).backgroundColor); if (c[3] > 0) { layers.push(c); if (c[3] >= 1) break } }
    let base = parse(getComputedStyle(document.body).backgroundColor); if (base[3] < 1) base = [255, 255, 255, 1]
    for (let i = layers.length - 1; i >= 0; i--) base = over(layers[i], base)
    return base
  }
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]) }
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return +((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)).toFixed(2) }
  const vis = (el) => el && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden'
  const out = []
  const add = (id, what, r, min) => out.push({ id, what, r, min })
  const text = (id, what, el, min = 4.5) => { if (!vis(el)) return; const bg = bgOf(el); add(id, what, ratio(over(parse(getComputedStyle(el).color), bg), bg), min) }
  const paint = (id, what, el, prop, against, min = 3) => { if (!vis(el)) return; const bg = against || bgOf(el); add(id, what, ratio(over(parse(getComputedStyle(el)[prop]), bg), bg), min) }
  // Pills (galería y viva)
  for (const p of document.querySelectorAll('.g-speech-pill')) {
    if (!vis(p)) continue
    const id = p.id + ':' + p.dataset.status
    const fill = bgOf(p), outside = bgOf(p.parentElement.closest('.page, .app-head, body') || document.body)
    text(id, 'texto', p.querySelector('.g-speech-pill__text'))
    text(id, 'duración', p.querySelector('.g-speech-pill__time'))
    const ic = p.querySelector('.g-speech-pill__icon'); paint(id, 'icono', ic, 'color', bgOf(ic))
    paint(id, 'chevron', p.querySelector('.g-speech-pill__chevron'), 'color')
    for (const b of p.querySelectorAll('.g-speech-pill__toggle, .g-speech-pill__finish')) paint(id, 'icono ' + b.className.match(/__(toggle|finish)/)[1], b, 'color')
    const bar = p.querySelector('.g-speech-meter__bar'); if (bar) paint(id, 'medidor', bar, 'backgroundColor', bgOf(bar.parentElement))
    if (p.classList.contains('is-live') || p.classList.contains('is-problem')) {
      const rim = parse(getComputedStyle(p).borderTopColor)
      add(id, 'borde de estado / fuera', ratio(over(rim, outside), outside), 3)
      add(id, 'borde de estado / tinte', ratio(over(rim, fill), fill), p.classList.contains('is-live') ? 3 : 1)
    }
  }
  // Paneles
  for (const pn of document.querySelectorAll('.g-speech-panel')) {
    if (!vis(pn)) continue
    const id = (pn.id || 'panel') + ':' + pn.dataset.status
    for (const [sel, what, min] of [['.g-speech-panel__title', 'título', 4.5], ['.g-speech-panel__mode', 'modo', 4.5], ['.g-speech-panel__status-text', 'estado', 4.5], ['.g-speech-panel__time', 'duración', 4.5],
      ['.g-speech-panel__sub > p', 'secundario', 4.5], ['.g-speech-panel__sub .is-warning', 'señal plana', 4.5], ['.g-speech-panel__privacy p', 'privacidad', 4.5], ['.g-speech-panel__privacy .g-icon', 'icono privacidad', 3],
      ['.g-speech-panel__transcript > h3', 'título transcript', 4.5], ['.g-speech-segment:not(.is-partial) .g-speech-segment__text', 'confirmado', 4.5], ['.g-speech-segment.is-partial .g-speech-segment__text', 'provisional', 4.5],
      ['.g-speech-segment__time', 'hora', 4.5], ['.g-speech-segment__speaker', 'hablante', 4.5], ['.g-speech-segment__flag', 'ficha', 4.5], ['.g-speech-panel__error > :not(.g-speech-panel__issue)', 'error', 4.5],
      ['.g-speech-panel__issue > span', 'fallo', 4.5], ['.g-speech-panel__issue .g-icon', 'icono fallo', 3], ['.g-speech-segment.is-failed .g-icon', 'icono fragmento fallido', 3], ['.g-speech-panel__error .g-icon', 'icono error', 3],
      ['.g-speech-panel__confirm > p', 'confirmación', 4.5], ['.g-speech-panel__setup > p', 'sin diarización', 4.5]]) for (const el of pn.querySelectorAll(sel)) text(id, what, el, min)
    const si = pn.querySelector('.g-speech-panel__status-icon'); paint(id, 'icono estado', si, 'color', bgOf(si))
    const wb = pn.querySelector('.g-speech-wave__bar'); if (wb && pn.classList.contains('is-live')) paint(id, 'onda', wb, getComputedStyle(wb).backgroundColor === 'rgba(0, 0, 0, 0)' ? 'borderTopColor' : 'backgroundColor', bgOf(wb.parentElement))
    for (const el of pn.querySelectorAll('.g-speech-panel__error > :not(.g-speech-panel__issue)')) paint(id, 'marca error', el, 'borderInlineStartColor', bgOf(pn))
    for (const el of pn.querySelectorAll('.g-speech-panel__issue, .g-speech-segment.is-failed')) paint(id, 'marca fallo', el, 'borderInlineStartColor', bgOf(pn))
    for (const el of pn.querySelectorAll('.g-speech-segment__flag')) paint(id, 'borde ficha', el, 'borderTopColor')
    for (const b of pn.querySelectorAll('.g-btn')) { if (!vis(b)) continue; const lab = b.querySelector('.g-btn__label'); text(id, 'botón «' + b.textContent.trim().slice(0, 18) + '»', lab && lab.textContent.trim() ? b : null) ; if (b.matches('.g-btn--variant-outline')) paint(id, 'borde botón', b, 'borderTopColor', bgOf(b.parentElement)) }
  }
  // Disparadores
  for (const t of document.querySelectorAll('.g-speech-trigger')) {
    if (!vis(t)) continue
    const b = t.querySelector('.g-speech-trigger__btn'), id = (b.id || 'trigger') + ':' + t.dataset.status + (t.classList.contains('is-busy') ? ':busy' : '')
    if (!t.classList.contains('is-busy')) paint(id, 'icono', b.querySelector('.g-icon'), 'color', bgOf(b))
    if (t.matches('.g-speech-trigger--mode-conversation') && !t.classList.contains('is-busy')) text(id, 'texto', b.querySelector('.g-btn__label'))
    const sh = getComputedStyle(b).boxShadow
    if (sh && sh !== 'none') { const c = parse(sh); const outside = bgOf(t.parentElement); add(id, 'contorno vivo / fuera', ratio(over(c, outside), outside), 3); add(id, 'contorno vivo / tinte', ratio(over(c, bgOf(b)), bgOf(b)), 3) }
    if (['denied', 'unavailable', 'error'].includes(t.dataset.status)) paint(id, 'borde problema', b, 'borderTopColor', bgOf(t.parentElement))
    const n = t.querySelector('.g-speech-trigger__note-text'); text(id, 'nota', n)
    const a = t.querySelector('.g-speech-trigger__note-action'); if (a) { text(id, 'acción nota', a); paint(id, 'borde acción', a, 'borderTopColor', bgOf(t)) }
  }
  return out
}

const consoleOf = (page) => { const msgs = []; page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) msgs.push(m.type() + ': ' + m.text()) }); page.on('pageerror', (e) => msgs.push('pageerror: ' + e.message)); page.on('response', (r) => { if (r.status() >= 400) msgs.push('http ' + r.status() + ' ' + r.url()) }); return msgs }
const open = async (page, qs) => { await page.goto(BASE + qs); await page.waitForFunction(() => window.__ready); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(350) }

for (const engine of ENGINES) {
  const browser = await pw[engine].launch()
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' })
  const page = await ctx.newPage()
  const msgs = consoleOf(page)

  /* ---------- 1. Contraste por tema ---------- */
  const themes = [['defecto', ''], ...(engine === 'chromium' ? GEN : ['spotify', 'lustre']).map((t) => [t, '&theme=' + t])]
  for (const [name, qs] of themes) {
    for (const dark of [false, true]) {
      for (const st of ['listening', 'reconnecting', 'error']) {
        await open(page, '?still=1&open=1&status=' + st + qs + (dark ? '&dark=1' : ''))
        const rows = await page.evaluate(contrast)
        const tag = `${engine} ${name} ${dark ? 'oscuro' : 'claro'}`
        let lo = { r: 99 }
        for (const r of rows) { ok(r.r >= r.min, `${tag} [${st}] ${r.id} ${r.what}: ${r.r} < ${r.min}`); if (r.min >= 3 && r.r - r.min < lo.r - (lo.min || 0)) lo = r }
        if (st === 'listening') mins.push({ tag, n: rows.length, lo: `${lo.id} ${lo.what} ${lo.r}`, rows })
      }
    }
  }

  /* ---------- 2. Énfasis activo distinto del foco ---------- */
  await open(page, '?still=1&only=live')
  await page.keyboard.press('Tab')
  await page.focus('#head-pill .g-speech-pill__main')
  const f = await page.evaluate(() => {
    const pill = document.getElementById('head-pill'), b = pill.querySelector('.g-speech-pill__main'), cs = getComputedStyle(b), ps = getComputedStyle(pill)
    const pr = pill.getBoundingClientRect(), br = b.getBoundingClientRect()
    const off = parseFloat(cs.outlineOffset), ow = parseFloat(cs.outlineWidth)
    // borde exterior del anillo respecto al borde interior de la pill (por arriba)
    const gap = (br.top - off - ow) - (pr.top + parseFloat(ps.borderTopWidth))
    return { fv: b.matches(':focus-visible'), style: cs.outlineStyle, off, ow, gap: +gap.toFixed(2), rimW: parseFloat(ps.borderTopWidth), rimStyle: ps.borderTopStyle, ringOnlyBtn: br.width < pr.width - 20 }
  })
  ok(f.fv && f.style === 'solid' && f.ow >= 2, `${engine} foco visible en la pill: ${JSON.stringify(f)}`)
  ok(f.off < 0 && f.gap >= 1.5, `${engine} el anillo de foco queda dentro del botón y separado del borde vivo (≥ 2px): ${JSON.stringify(f)}`)
  ok(f.rimW === 2 && f.rimStyle === 'solid' && f.ringOnlyBtn, `${engine} borde vivo 2px sólido en toda la pill; el anillo solo en el botón: ${JSON.stringify(f)}`)

  /* ---------- 3. Objetivos 24px (puntero fino) ---------- */
  await open(page, '?still=1&open=1')
  const tg = await page.evaluate(() => [...document.querySelectorAll('.g-speech-pill .g-btn, .g-speech-panel .g-btn, .g-speech-trigger .g-btn')].filter((b) => b.getClientRects().length).map((b) => { const a = getComputedStyle(b, '::after'); const r = b.getBoundingClientRect(); return { w: Math.max(r.width, parseFloat(a.width) || 0), h: Math.max(r.height, parseFloat(a.height) || 0), vh: r.height, n: b.className.match(/g-speech-[a-z-]+__[a-z-]+/)?.[0] || b.textContent.trim().slice(0, 12) } }))
  ok(tg.length > 20 && tg.every((t) => t.w >= 24 && t.h >= 24), `${engine} objetivos ≥ 24px: ${JSON.stringify(tg.filter((t) => t.w < 24 || t.h < 24))}`)
  const pillH = await page.evaluate(() => document.getElementById('head-pill').getBoundingClientRect().height)
  ok(Math.abs(pillH - 34) < 0.5, `${engine} pill de 34px (space × 7 + relleno + borde): ${pillH}`)

  /* ---------- 4. Movimiento reducido ---------- */
  await open(page, '?open=1&rm=1&status=processing')
  const rm1 = await page.evaluate(() => ({ spin: getComputedStyle(document.querySelector('#head-pill .g-speech-pill__icon > .g-icon')).animationName, tr: getComputedStyle(document.querySelector('#sh > .g-speech-panel')).transitionProperty }))
  ok(rm1.spin === 'none' && !/translate/.test(rm1.tr), `${engine} movimiento reducido: sin giro y panel solo con fundido: ${JSON.stringify(rm1)}`)
  await page.evaluate(() => { window.S.status = 'listening' }); await page.waitForTimeout(600)
  const rm2 = await page.evaluate(() => {
    const segs = [...document.querySelectorAll('#sh > .g-speech-panel .g-speech-wave__bar')]
    const on = segs.filter((s) => s.hasAttribute('data-on')), off = segs.filter((s) => !s.hasAttribute('data-on'))
    const bars = [...document.querySelectorAll('#head-pill .g-speech-meter__bar')].map((b) => ({ on: b.hasAttribute('data-on'), s: getComputedStyle(b).scale }))
    return { n: segs.length, onBg: on[0] && getComputedStyle(on[0]).backgroundColor, offBg: off[0] && getComputedStyle(off[0]).backgroundColor, offBorder: off[0] && getComputedStyle(off[0]).borderTopWidth, h: segs[0] && segs[0].getBoundingClientRect().height, bars }
  })
  ok(rm2.n === 5 && rm2.onBg !== rm2.offBg && /rgba\(0, 0, 0, 0\)|transparent/.test(rm2.offBg) && parseFloat(rm2.offBorder) >= 1, `${engine} onda discreta: 5 segmentos rellenos o con contorno: ${JSON.stringify(rm2)}`)
  ok(rm2.bars.every((b) => (b.on ? b.s === 'none' : b.s !== 'none')), `${engine} medidor discreto (encendida = alta, apagada = mínima): ${JSON.stringify(rm2.bars)}`)
  // «Ocultar actividad»: la onda y el medidor se van; estado y duración se quedan
  await page.evaluate(() => { window.S.activityHidden = true }); await page.waitForTimeout(100)
  const hid = await page.evaluate(() => ({ wave: !!document.querySelector('#sh > .g-speech-panel .g-speech-wave'), meter: !!document.querySelector('#head-pill .g-speech-meter'), time: document.querySelector('#head-pill .g-speech-pill__time').getClientRects().length > 0, text: document.querySelector('#head-pill .g-speech-pill__text').textContent }))
  ok(!hid.wave && !hid.meter && hid.time && hid.text === 'Grabando', `${engine} «Ocultar actividad»: ${JSON.stringify(hid)}`)

  /* ---------- 5. Modal (GDialog real) ---------- */
  await ctx.close()
  const c2 = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' })
  const p2 = await c2.newPage(); const m2 = consoleOf(p2)
  await open(p2, '?still=1&only=live')
  await p2.click('#t-dialog'); await p2.waitForTimeout(400)
  const dm = await p2.evaluate(() => {
    const host = document.getElementById('sh'), f = host.querySelector('.g-speech-host__float'), main = f.querySelector('.g-speech-pill__main'), r = main.getBoundingClientRect()
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
    return { inDialog: !!host.closest('dialog.g-dialog[open]'), open: host.matches(':popover-open'), floatShown: !f.hidden, hit: !!hit && main.contains(hit), inViewport: r.top >= 0 && r.bottom <= innerHeight }
  })
  ok(dm.inDialog && dm.open && dm.floatShown && dm.hit && dm.inViewport, `${engine} modal: anfitrión dentro del GDialog, flotante visible y pulsable: ${JSON.stringify(dm)}`)
  await p2.click('#float-pill .g-speech-pill__main'); await p2.waitForTimeout(300)
  const dp = await p2.evaluate(() => { const pn = document.querySelector('#sh > .g-speech-panel'); const r = pn.getBoundingClientRect(); const hit = document.elementFromPoint(r.left + 40, r.top + 20); return { panel: !!pn, inDialog: !!pn?.closest('dialog[open]'), hit: !!hit && pn.contains(hit), focus: document.activeElement.className } })
  ok(dp.panel && dp.inDialog && dp.hit && /title/.test(dp.focus), `${engine} modal: panel dentro y por encima, foco al título: ${JSON.stringify(dp)}`)
  await p2.keyboard.press('Escape'); await p2.waitForTimeout(200)
  const de = await p2.evaluate(() => ({ panel: !!document.querySelector('#sh > .g-speech-panel'), dlg: !!document.querySelector('dialog.g-dialog[open]') }))
  ok(!de.panel && de.dlg, `${engine} Esc en el panel lo cierra y el diálogo sigue abierto: ${JSON.stringify(de)}`)
  // foco visible dentro de la capa superior (Tab hasta un botón de la flotante)
  // (WebKit no lleva el Tab a los botones sin la preferencia del sistema: se enfoca por script tras una tecla)
  if (engine === 'webkit') { await p2.keyboard.press('Shift'); await p2.focus('#float-pill .g-speech-pill__toggle') }
  else { await p2.focus('#float-pill .g-speech-pill__toggle'); await p2.keyboard.press('Shift+Tab'); await p2.keyboard.press('Tab') }
  const fv = await p2.evaluate(() => { const a = document.activeElement; const cs = getComputedStyle(a); return { cls: a.className, fv: a.matches(':focus-visible'), w: cs.outlineWidth, s: cs.outlineStyle } })
  ok(fv.fv && fv.s === 'solid' && parseFloat(fv.w) >= 2, `${engine} foco visible en la flotante dentro del modal: ${JSON.stringify(fv)}`)
  ok(m2.length === 0, `${engine} consola (modal): ${m2.join(' | ')}`)
  await c2.close()

  /* ---------- 6. Móvil 320×640: página, hoja, pill + aviso en el borde inferior ---------- */
  const c3 = await browser.newContext({ viewport: { width: 320, height: 640 }, reducedMotion: 'reduce' })
  const p3 = await c3.newPage(); const m3 = consoleOf(p3)
  await open(p3, '?still=1')
  const mHead = await p3.evaluate(() => { const r = document.getElementById('head-pill').getBoundingClientRect(); return { sw: document.documentElement.scrollWidth, l: r.left, r: r.right, mobile: document.getElementById('sh').hasAttribute('data-mobile') } })
  ok(mHead.sw <= 320 && mHead.l >= 0 && mHead.r <= 320 && mHead.mobile, `${engine} 320: sin desbordamiento, pill de cabecera dentro: ${JSON.stringify(mHead)}`)
  await p3.evaluate(() => { scrollTo(0, 600); window.toaster.show({ type: 'success', title: 'Borrador guardado', description: 'Los cambios están en este dispositivo.' }) }); await p3.waitForTimeout(700)
  const edge = await p3.evaluate(() => { const f = document.querySelector('#float-pill').getBoundingClientRect(), t = document.querySelector('.g-toast').getBoundingClientRect(); return { pTop: f.top, pBottom: f.bottom, pl: f.left, pr: f.right, tBottom: t.bottom, edge: document.getElementById('sh').dataset.edge, sw: document.documentElement.scrollWidth } })
  ok(edge.edge === 'bottom' && edge.pBottom <= 640 && edge.pl >= 0 && edge.pr <= 320, `${engine} 320: flotante abajo, dentro del visor: ${JSON.stringify(edge)}`)
  ok(edge.tBottom <= edge.pTop - 4, `${engine} 320: el aviso queda por encima de la pill (borde compartido): ${JSON.stringify(edge)}`)
  await p3.evaluate(() => { window.S.panelOpen = true }); await p3.waitForTimeout(400)
  const sh = await p3.evaluate(() => { const d = document.querySelector('.g-speech-sheet'), pn = d.querySelector('.g-speech-panel'), r = d.getBoundingClientRect(); return { open: d.open, modal: d.matches(':modal'), top: r.top, bottom: r.bottom, w: r.width, maxH: innerHeight * 0.88, ov: pn.scrollWidth - pn.clientWidth, sw: document.documentElement.scrollWidth, focus: document.activeElement.className } })
  ok(sh.open && sh.modal && sh.bottom <= 640.5 && sh.top >= 640 - sh.maxH - 1 && sh.w <= 320 && sh.ov <= 0 && sh.sw <= 320, `${engine} 320: hoja inferior dentro del visor, ≤ 88 %, sin desbordamiento: ${JSON.stringify(sh)}`)
  ok(/title/.test(sh.focus), `${engine} 320: foco al título de la hoja: ${sh.focus}`)
  await p3.keyboard.press('Escape'); await p3.waitForTimeout(200)
  ok(await p3.evaluate(() => !document.querySelector('.g-speech-sheet').open), `${engine} 320: Esc cierra la hoja`)
  ok(m3.length === 0, `${engine} consola (móvil): ${m3.join(' | ')}`)
  await c3.close()

  /* ---------- 7. Táctil (pointer: coarse): áreas de 44px que no se pisan ---------- */
  if (engine !== 'firefox') {
    const c4 = await browser.newContext({ viewport: { width: 800, height: 900 }, hasTouch: true, isMobile: engine === 'chromium', reducedMotion: 'reduce' })
    const p4 = await c4.newPage()
    await open(p4, '?still=1&open=1')
    const co = await p4.evaluate(() => {
      const coarse = matchMedia('(pointer: coarse)').matches
      const area = (b) => { const r = b.getBoundingClientRect(), a = getComputedStyle(b, '::after'), w = Math.max(r.width, parseFloat(a.width)), h = Math.max(r.height, parseFloat(a.height)); return { l: r.left + r.width / 2 - w / 2, r: r.left + r.width / 2 + w / 2, t: r.top + r.height / 2 - h / 2, b: r.top + r.height / 2 + h / 2, w, h } }
      const bs = [...document.querySelectorAll('#head-pill .g-btn, #sh > .g-speech-panel .g-btn, #tr-live')].filter((b) => b.getClientRects().length)
      const as = bs.map(area); const small = as.filter((a) => a.w < 44 || a.h < 44).length
      let overlap = 0
      const pill = [...document.querySelectorAll('#head-pill .g-btn')].map(area)
      for (let i = 0; i < pill.length; i++) for (let j = i + 1; j < pill.length; j++) { const a = pill[i], b = pill[j]; if (a.l < b.r - 0.5 && b.l < a.r - 0.5 && a.t < b.b - 0.5 && b.t < a.b - 0.5) overlap++ }
      return { coarse, n: bs.length, small, overlap }
    })
    ok(co.coarse && co.n > 8 && co.small === 0 && co.overlap === 0, `${engine} táctil: áreas ≥ 44px sin pisarse en la pill: ${JSON.stringify(co)}`)
    await c4.close()
  }

  /* ---------- 8. RTL ---------- */
  const c5 = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' })
  const p5 = await c5.newPage(); const m5 = consoleOf(p5)
  await open(p5, '?still=1&rtl=1&open=1&status=reconnecting')
  const rtl = await p5.evaluate(() => {
    const p = document.getElementById('head-pill'), ic = p.querySelector('.g-speech-pill__icon').getBoundingClientRect(), tx = p.querySelector('.g-speech-pill__text').getBoundingClientRect(), fin = p.querySelector('.g-speech-pill__finish').getBoundingClientRect()
    const failed = document.querySelector('#gpn-reconn .g-speech-segment.is-failed'), fs = getComputedStyle(failed)
    const time = document.querySelector('#gpn-conv .g-speech-panel__time').getBoundingClientRect(), stx = document.querySelector('#gpn-conv .g-speech-panel__status-text').getBoundingClientRect()
    const pn = document.querySelector('#sh > .g-speech-panel').getBoundingClientRect()
    return { iconRight: ic.left > tx.left, finishLeft: fin.right < tx.left, markRight: parseFloat(fs.borderRightWidth) > 0 && parseFloat(fs.borderLeftWidth) === 0, timeLeft: time.right <= stx.left + 1, panelIn: pn.left >= 0 && pn.right <= innerWidth, sw: document.documentElement.scrollWidth }
  })
  ok(Object.entries(rtl).every(([k, v]) => k === 'sw' ? v <= 1280 : v), `${engine} RTL: orden y marcas invertidos, panel dentro: ${JSON.stringify(rtl)}`)
  // flotante centrada en RTL
  await p5.evaluate(() => scrollTo(0, 900)); await p5.waitForTimeout(300)
  const rc = await p5.evaluate(() => { const r = document.querySelector('#sh > .g-speech-host__float').getBoundingClientRect(); return { c: (r.left + r.right) / 2, top: r.top } })
  ok(Math.abs(rc.c - 640) < 2 && Math.abs(rc.top - 16) < 1, `${engine} RTL: flotante arriba al centro a 16px: ${JSON.stringify(rc)}`)
  ok(m5.length === 0, `${engine} consola (RTL): ${m5.join(' | ')}`)
  await c5.close()

  /* ---------- 9. Zoom 200 % (visor CSS de 640×450) ---------- */
  const c6 = await browser.newContext({ viewport: { width: 640, height: 450 }, reducedMotion: 'reduce' })
  const p6 = await c6.newPage()
  await open(p6, '?still=1&open=1')
  const z = await p6.evaluate(() => { const pn = document.querySelector('#sh > .g-speech-panel'), r = pn.getBoundingClientRect(), pill = document.getElementById('head-pill').getBoundingClientRect(); return { sw: document.documentElement.scrollWidth, l: r.left, r: r.right, b: r.bottom, h: innerHeight, scrolls: pn.scrollHeight > pn.clientHeight, pillR: pill.right, ov: pn.scrollWidth - pn.clientWidth } })
  ok(z.sw <= 640 && z.l >= 0 && z.r <= 640 && z.b <= z.h && z.pillR <= 640 && z.ov <= 0, `${engine} zoom 200 %: panel y pill dentro, el panel se desplaza dentro de su alto: ${JSON.stringify(z)}`)
  await c6.close()

  /* ---------- 10. forced-colors y prefers-contrast (solo Chromium emula ambos) ---------- */
  if (engine === 'chromium') {
    const c7 = await browser.newContext({ viewport: { width: 1280, height: 900 }, forcedColors: 'active', reducedMotion: 'reduce' })
    const p7 = await c7.newPage()
    await open(p7, '?still=1&open=1')
    const fc = await p7.evaluate(() => {
      const g = (s) => document.querySelector(s), cs = (s, p) => getComputedStyle(g(s))[p]
      return {
        liveRim: cs('#gp-listening', 'borderTopWidth') + ' ' + cs('#gp-listening', 'borderTopStyle'), probRim: cs('#gp-error', 'borderTopStyle'),
        lampBg: cs('#gp-listening .g-speech-pill__icon', 'backgroundColor'), lampFg: cs('#gp-listening .g-speech-pill__icon', 'color'),
        bar: cs('#gp-listening .g-speech-meter__bar', 'backgroundColor'), wave: cs('#gpn-conv .g-speech-wave__bar', 'backgroundColor'),
        panelBorder: cs('#gpn-conv', 'borderTopStyle'), errMark: cs('#gpn-error .g-speech-panel__error > div', 'borderInlineStartWidth'), trigLive: cs('#gt-convlive', 'borderTopWidth'), trigLiveD: cs('#gt-live', 'borderTopWidth'),
        floatBorder: cs('#g-states .g-speech-host__float', 'borderTopStyle')
      }
    })
    ok(fc.liveRim === '2px solid' && fc.probRim === 'dashed' && fc.lampBg !== fc.lampFg && !/rgba\(0, 0, 0, 0\)/.test(fc.lampBg) && !/rgba\(0, 0, 0, 0\)/.test(fc.bar) && !/rgba\(0, 0, 0, 0\)/.test(fc.wave) && fc.panelBorder === 'solid' && fc.errMark === '4px' && fc.trigLiveD === '2px' && fc.floatBorder === 'none', `chromium forced-colors: formas y barras visibles: ${JSON.stringify(fc)}`)
    await c7.close()
    const c8 = await browser.newContext({ viewport: { width: 1280, height: 900 }, contrast: 'more', reducedMotion: 'reduce' })
    const p8 = await c8.newPage()
    await open(p8, '?still=1&open=1')
    const pc = await p8.evaluate(() => {
      const probe = document.createElement('i'); document.body.append(probe)
      const tok = (t) => { probe.style.color = `var(--g-color-${t})`; return getComputedStyle(probe).color }
      const r = { placed: getComputedStyle(document.getElementById('gp-paused')).borderTopColor, control: tok('border-control'), mode: getComputedStyle(document.querySelector('#gpn-conv .g-speech-panel__mode')).color, text: tok('text'), panel: getComputedStyle(document.getElementById('gpn-conv')).borderTopColor }
      probe.remove(); return r
    })
    ok(pc.placed === pc.control && pc.mode === pc.text && pc.panel === pc.control, `chromium prefers-contrast: more: bordes de control y texto pleno: ${JSON.stringify(pc)}`)
    await c8.close()
  }
  ok(msgs.length === 0, `${engine} consola: ${msgs.join(' | ')}`)
  await browser.close()
}

if (args.verbose) for (const m of mins) console.log(`${m.tag}: ${m.n} medidas; el más justo (≥3): ${m.lo}`)
// Resumen de mínimos por qué-medida (todos los temas y motores)
const agg = {}
for (const m of mins) for (const r of m.rows) { const k = r.what.replace(/«.*»/, '«…»'); if (!agg[k] || r.r < agg[k].r) agg[k] = { r: r.r, at: m.tag + ' ' + r.id } }
console.log('Mínimos (estado listening, todas las piezas de la página):')
for (const [k, v] of Object.entries(agg).sort()) console.log(`  ${k}: ${v.r}  (${v.at})`)
console.log(`\n${total - failed}/${total} comprobaciones correctas` + (failed ? `\nFALLOS:\n- ${fails.join('\n- ')}` : ''))
server.close()
process.exit(failed ? 1 : 0)
