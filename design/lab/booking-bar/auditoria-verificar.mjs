// Auditoría de coco (paso 5) de GBookingBar y GPartyField sobre el COMPONENTE REAL (dist/booking.umd.js,
// packages/vue/playground/booking.html), con las enmiendas de GDatePicker (noches, is-checkout-only, --trigger). Mide en
// Chromium, Firefox y WebKit: estático (GBookingBar.css, GPartyField.css, GDatePicker.css; .vue sin <style>); la frase en
// ocho temas, claro y oscuro (texto, valor vacío y mensaje ≥ 4,5:1; subrayado discontinuo, tinta y error ≥ 3:1); vacío
// discontinuo / lleno con la tinta continua (slow; reducido sin transición; RTL desde la derecha) / error danger-text; la
// diana del hueco ≥ 24 px y 44 px con puntero grueso sin pisar la línea de al lado; 1100, 390, 320 y 320×256 en LTR y RTL
// sin desplazamiento horizontal y con los paneles dentro del visor; la barra: en fila a 1100 (acción alineada con las cajas,
// GPartyField a la altura de GSelect), compacta a 390 con resumen ≥ 44 px y ≥ 4,5:1, y vuelta a la fila al ensanchar
// (histéresis); el calendario real con un día «solo salida» elegido y sin elegir (hallazgo B-A1); el muelle (alto de
// contrato, de borde a borde, cola :root::after = su alto, el último control nunca bajo el muelle al final de la página,
// reducido sin desplazamiento); forced-colors (Chromium); consola limpia.
// Ejecutar desde la raíz con dist/ reconstruido:  node design/lab/booking-bar/auditoria-verificar.mjs   (puerto 4244)
import { pw, ENGINES, ok, note, report, serve, stop, opener, overflowX, rect, settle, staticCheck } from '../hero/auditoria-comun.mjs'

await staticCheck('packages/vue/src/components/GBookingBar/GBookingBar.css', ['packages/vue/src/components/GBookingBar/GBookingBar.vue'])
await staticCheck('packages/vue/src/components/GPartyField/GPartyField.css', ['packages/vue/src/components/GPartyField/GPartyField.vue'])
await staticCheck('packages/vue/src/components/GDatePicker/GDatePicker.css', ['packages/vue/src/components/GDatePicker/GDatePicker.vue'])
const BASE = await serve()
const TEMAS = ['defecto', 'terracota', 'anil', 'palida', 'stripe', 'amazon', 'linear', 'notion']
const fill = (p, nights = 2) => p.evaluate((n) => { const s = window.bookingState; s.query.value = { from: s.plus(2), to: s.plus(2 + n), party: { adults: 2, children: 0, rooms: 1 } } }, nights)
const ms = (v) => parseFloat(v) * (String(v).endsWith('ms') ? 1 : 1000)

for (const eng of ENGINES) {
  const b = await pw[eng].launch()
  const open = await opener(b, BASE, eng)
  const E = (m) => `${eng} ${m}`
  const close = async (p, label) => { ok(p.__errs.length === 0, E(`consola limpia (${label})`), p.__errs.slice(0, 2).join(' | ')); await p.__ctx.close() }

  /* 1 · La frase: contraste en ocho temas, claro y oscuro; estados por forma */
  let minT = Infinity, minL = Infinity
  for (const theme of TEMAS) for (const dark of [false, true]) {
    if (eng !== 'chromium' && !['defecto', 'terracota', 'linear'].includes(theme)) continue
    const p = await open('booking.html', { theme, dark })
    // Enviar vacío: los huecos de fecha y noches quedan con error; el de huéspedes lleno
    await p.locator('.g-booking-bar__submit').click(); await settle(p, 450)
    const m = await p.evaluate(() => {
      const slots = [...document.querySelectorAll('.g-booking-bar__slot')]
      const one = (s) => ({ cls: s.className, text: window.__c.text(s.querySelector('.g-booking-bar__slot-value')), under: window.__c.line(s, 'borderBottomColor'), ink: window.__c.line(s, 'borderBottomColor', '::after'), style: getComputedStyle(s).borderBottomStyle, scale: getComputedStyle(s, '::after').scale })
      return { phrase: window.__c.text(document.querySelector('.g-booking-bar__phrase')), title: window.__c.text(document.querySelector('.g-booking-bar__title')), msg: Math.min(...[...document.querySelectorAll('.g-booking-bar__messages > li')].map((e) => window.__c.text(e))), slots: slots.map(one) }
    })
    const L = `frase ${theme} ${dark ? 'oscuro' : 'claro'}`
    ok(m.phrase >= 4.5 && m.title >= 4.5 && m.msg >= 4.5, E(`${L}: frase, título y mensaje ≥ 4,5:1`), [m.phrase, m.title, m.msg].join(' '))
    for (const s of m.slots) {
      ok(s.text >= 4.5, E(`${L}: valor del hueco ≥ 4,5:1`), `${s.cls} ${s.text}`)
      ok(s.under >= 3, E(`${L}: subrayado ≥ 3:1`), `${s.cls} ${s.under}`)
      minT = Math.min(minT, s.text); minL = Math.min(minL, s.under)
      if (s.cls.includes('is-invalid')) ok(s.style === 'dashed' && s.scale === '1' && s.ink >= 3, E(`${L}: error = tinta continua danger-text ≥ 3:1`), JSON.stringify(s))
      else if (s.cls.includes('is-filled')) ok(s.scale === '1' && s.ink >= 3, E(`${L}: lleno = tinta continua ≥ 3:1`), JSON.stringify(s))
    }
    await close(p, L)
  }
  note(`${eng}: frase, valor mínimo ${minT}:1, subrayado mínimo ${minL}:1`)

  /* 2 · La tinta que se asienta: vacío (escala 0), lleno (1, slow), reducido sin transición, RTL desde la derecha */
  for (const [rm, dir] of [[false, ''], [true, ''], [false, 'dir=rtl']]) {
    const p = await open('booking.html', { rm, qs: dir })
    // La frase lleva dir="auto": con la plantilla en español resuelve ltr aunque la página sea rtl. Para el caso RTL se fija
    // dir="rtl" en la frase (una plantilla en árabe o hebreo lo resolvería así)
    if (dir) await p.evaluate(() => document.querySelector('.g-booking-bar__phrase').setAttribute('dir', 'rtl'))
    const before = await p.evaluate(() => { const s = document.querySelector('.g-booking-bar__slot.is-empty'); return { scale: getComputedStyle(s, '::after').scale, style: getComputedStyle(s).borderBottomStyle } })
    await fill(p)
    await p.waitForTimeout(30)
    const after = await p.evaluate(() => { const s = document.querySelector('.g-booking-bar__slot'); const cs = getComputedStyle(s, '::after'); const slow = document.createElement('div'); slow.style.transitionDuration = 'var(--g-duration-slow)'; document.body.append(slow); const d = getComputedStyle(slow).transitionDuration; slow.remove(); return { cls: s.className, td: cs.transitionDuration, origin: cs.transformOrigin, slow: d, w: s.getBoundingClientRect().width } })
    const L = `tinta ${rm ? 'reducido' : 'normal'} ${dir || 'ltr'}`
    ok(before.scale === '0 1' && before.style === 'dashed', E(`${L}: vacío = discontinuo sin tinta`), JSON.stringify(before))
    ok(after.cls.includes('is-filled') && (rm ? ms(after.td) === 0 : Math.abs(ms(after.td) - ms(after.slow)) < 2), E(`${L}: lleno con transición ${rm ? 'nula' : 'slow'}`), JSON.stringify(after))
    const ox = parseFloat(after.origin)
    ok(dir ? Math.abs(ox - after.w) < 1 : Math.abs(ox) < 1, E(`${L}: la tinta empieza en el inicio de la línea`), after.origin)
    await close(p, L)
  }

  /* 3 · Diana del hueco: ≥ 24 px (fino) y 44 px (grueso), el interlineado la contiene (no pisa la línea de al lado) */
  for (const coarse of [false, true]) {
    const p = await open('booking.html', { coarse, vw: 390, vh: 844 })
    const d = await p.evaluate(() => {
      const ph = document.querySelector('.g-booking-bar__phrase')
      return { lh: parseFloat(getComputedStyle(ph).lineHeight), t: Math.min(...[...document.querySelectorAll('.g-booking-bar__slot')].map((s) => parseFloat(getComputedStyle(s, '::before').height))) }
    })
    const want = coarse ? 44 : 24
    ok(d.t >= want - 0.01 && d.lh >= d.t - 0.01, E(`diana ${coarse ? 'gruesa' : 'fina'}: ≥ ${want} px y ≤ interlineado`), JSON.stringify(d))
    await close(p, `diana ${coarse}`)
  }

  /* 4 · Anchos y RTL: sin desplazamiento; paneles (noches, huéspedes, calendario) dentro del visor */
  for (const dir of ['', 'dir=rtl']) for (const [vw, vh] of [[1100, 800], [390, 844], [320, 640], [320, 256]]) {
    const p = await open('booking.html', { vw, vh, qs: dir })
    const L = `frase ${dir || 'ltr'} ${vw}×${vh}`
    ok(!(await overflowX(p)), E(`${L}: sin desplazamiento horizontal`))
    for (const [i, sel] of [[1, '.g-booking-bar__slot-panel:popover-open'], [2, '.g-party-field__panel:popover-open'], [0, '.g-datepicker__pop:popover-open, .g-datepicker__pop[open], dialog[open] .g-datepicker__month, .g-datepicker__pop']]) {
      await p.locator('.g-booking-bar__slot').nth(i).click(); await settle(p, 300)
      const r = await p.evaluate((sel) => { const e = [...document.querySelectorAll(sel)].find((x) => x.getClientRects().length && getComputedStyle(x).display !== 'none'); if (!e) return null; const r = e.getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top, b: r.bottom, fs: getComputedStyle(e).fontSize } }, sel)
      ok(r && r.l >= -0.5 && r.r <= vw + 0.5 && r.t >= -0.5, E(`${L}: panel del hueco ${i} dentro del visor`), JSON.stringify(r))
      await p.keyboard.press('Escape'); await settle(p, 250)
    }
    await close(p, L)
  }

  /* 5 · La barra: fila a 1100, compacta a 390, vuelta a la fila (histéresis); alturas y alineación */
  for (const kind of ['stay', 'table', 'tour']) for (const dir of ['', 'dir=rtl']) {
    const p = await open(`booking.html?a=bar&kind=${kind}`, { vw: 1100, vh: 700, qs: dir })
    const L = `barra ${kind} ${dir || 'ltr'}`
    const row = await p.evaluate(() => {
      const r = document.querySelector('.g-booking-bar__row'); if (!r) return null
      const sub = r.querySelector('.g-booking-bar__submit').getBoundingClientRect()
      const boxes = [...r.querySelectorAll('.g-datepicker__field, .g-select__trigger, .g-select__field, .g-party-field__trigger')].filter((e) => e.getClientRects().length).map((e) => e.getBoundingClientRect())
      return { sub: [sub.top, sub.height], boxes: boxes.map((b) => [b.top, b.height]), over: r.scrollWidth > r.clientWidth + 1 }
    })
    ok(row && !row.over, E(`${L}: en fila a 1100`), JSON.stringify(row))
    if (row) {
      ok(row.boxes.length >= 2 && row.boxes.every(([t, h]) => Math.abs(t - row.boxes[0][0]) < 1 && Math.abs(h - row.boxes[0][1]) < 1), E(`${L}: cajas a la misma altura (GPartyField = GSelect = GDatePicker)`), JSON.stringify(row.boxes))
      ok(Math.abs(row.sub[0] - row.boxes[0][0]) < 1.5, E(`${L}: la acción alineada con las cajas`), JSON.stringify(row.sub))
    }
    await p.setViewportSize({ width: 390, height: 700 }); await settle(p, 300)
    const c = await p.evaluate(() => { const s = document.querySelector('.g-booking-bar__summary'); if (!s) return null; const r = s.getBoundingClientRect(); return { h: r.height, t: window.__c.text(s.querySelector('.g-booking-bar__summary-text')), ti: window.__c.text(s.querySelector('.g-booking-bar__summary-title')), ch: window.__c.text(s.querySelector('.g-booking-bar__summary-change')), b: window.__c.line(s, 'borderTopColor') } })
    ok(c && c.h >= 44 && c.t >= 4.5 && c.ti >= 4.5 && c.ch >= 4.5 && c.b >= 3, E(`${L}: compacta a 390 (resumen ≥ 44 px, texto ≥ 4,5:1, borde ≥ 3:1)`), JSON.stringify(c))
    ok(!(await overflowX(p)), E(`${L}: 390 sin desplazamiento`))
    for (const [w, h] of [[320, 640], [320, 256]]) { await p.setViewportSize({ width: w, height: h }); await settle(p, 200); ok(!(await overflowX(p)) && await p.locator('.g-booking-bar__summary').count() === 1, E(`${L}: ${w}×${h} compacta sin desplazamiento`)) }
    await p.setViewportSize({ width: 1100, height: 700 }); await settle(p, 400)
    ok(await p.locator('.g-booking-bar__row').count() === 1, E(`${L}: vuelve a la fila al ensanchar`))
    await close(p, L)
  }

  /* 6 · Calendario real: día «solo salida» sin elegir (punteado, ≥ 4,5:1) y elegido como fin (B-A1: ≥ 4,5:1 sobre el relleno) */
  for (const theme of ['defecto', 'terracota', 'linear']) for (const dark of [false, true]) {
    if (eng !== 'chromium' && theme !== 'defecto') continue
    const p = await open('booking.html?a=bar', { theme, dark })
    await fill(p, 2) // fin = plus(4), su noche agotada: «solo salida»
    await settle(p, 100)
    await p.locator('.g-datepicker__field').first().click(); await settle(p, 400)
    const d = await p.evaluate(() => [...document.querySelectorAll('.g-datepicker__day.is-checkout-only')].filter((e) => e.getClientRects().length).map((e) => {
      const cs = getComputedStyle(e)
      const bg = window.__c.over(window.__c.rgba(cs.backgroundColor), window.__c.bgOf(e.closest('td')))
      return { sel: e.classList.contains('is-selected'), c: window.__c.ratio(window.__c.rgba(cs.color), bg), deco: cs.textDecorationLine + ' ' + cs.textDecorationStyle }
    }))
    const L = `solo salida ${theme} ${dark ? 'oscuro' : 'claro'}`
    ok(d.some((x) => x.sel) && d.some((x) => !x.sel), E(`${L}: hay uno elegido y otro sin elegir`), JSON.stringify(d))
    for (const x of d) ok(x.c >= 4.5 && x.deco === 'underline dotted', E(`${L}: ${x.sel ? 'elegido' : 'sin elegir'} ≥ 4,5:1 y punteado`), JSON.stringify(x))
    await close(p, L)
  }

  /* 7 · El muelle: alto de contrato, borde a borde, cola = su alto, el último control nunca debajo; reducido */
  for (const rm of [false, true]) for (const vw of [1100, 390]) {
    const p = await open('booking.html?a=bar&dock=1', { rm, vw, vh: 800 })
    const hidden = await p.evaluate(() => { const d = document.querySelector('.g-booking-bar__dock'); return { disp: getComputedStyle(d).display, inert: d.inert } })
    ok(hidden.disp === 'none' && hidden.inert, E(`muelle ${vw} ${rm ? 'reducido' : ''}: oculto = display none + inerte`), JSON.stringify(hidden))
    await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight)); await settle(p, 400)
    await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight)); await settle(p, 500)
    const m = await p.evaluate(() => {
      const d = document.querySelector('.g-booking-bar__dock'); const r = d.getBoundingClientRect(); const u = (() => { const x = document.createElement('div'); x.style.inlineSize = 'var(--g-space-1)'; document.body.append(x); const w = x.getBoundingClientRect().width; x.remove(); return w })()
      const last = document.getElementById('last').getBoundingClientRect()
      return { shown: d.classList.contains('is-shown'), h: r.height, want: Math.max(u * 16, 44 + u * 4), l: r.left, r: r.right, vw: document.documentElement.clientWidth, bottom: r.bottom, vh: innerHeight, tail: parseFloat(getComputedStyle(document.documentElement, '::after').height), lastB: last.bottom, top: r.top, sp: getComputedStyle(document.documentElement).scrollPaddingBottom, tr: getComputedStyle(d).translate, sum: window.__c.text(d.querySelector('.g-booking-bar__dock-summary')) }
    })
    const L = `muelle ${vw} ${rm ? 'reducido' : 'normal'}`
    ok(m.shown && Math.abs(m.h - m.want) < 1 && Math.abs(m.l) < 1 && Math.abs(m.r - m.vw) < 1 && Math.abs(m.bottom - m.vh) < 1, E(`${L}: alto de contrato, de borde a borde, abajo`), JSON.stringify(m))
    ok(Math.abs(m.tail - m.want) < 1 && Math.abs(parseFloat(m.sp) - m.want) < 1, E(`${L}: cola :root::after y scroll-padding = su alto`), `${m.tail} ${m.sp}`)
    ok(m.lastB <= m.top + 0.5, E(`${L}: el último control queda por encima del muelle al final de la página`), `${m.lastB} ≤ ${m.top}`)
    ok(m.sum >= 4.5, E(`${L}: resumen del muelle ≥ 4,5:1`), m.sum)
    if (rm) ok(m.tr === 'none' || m.tr === '0px' || m.tr === '0px 0px', E(`${L}: reducido sin desplazamiento`), m.tr)
    await close(p, L)
  }

  /* 8 · GPartyField suelto: foco visible y alto de GSelect md; grueso ≥ 44 */
  for (const coarse of [false, true]) {
    const p = await open('booking.html?party=1', { coarse, vw: 390, vh: 844 })
    const tr = p.locator('.g-party-field:not(.g-party-field--trigger) .g-party-field__trigger').last()
    await tr.focus(); await p.keyboard.press(eng === 'webkit' ? 'Shift+Alt+Tab' : 'Shift+Tab'); await p.keyboard.press(eng === 'webkit' ? 'Alt+Tab' : 'Tab')
    const f = await tr.evaluate((e) => { const cs = getComputedStyle(e); return { fv: e.matches(':focus-visible'), w: parseFloat(cs.outlineWidth), c: window.__c.ratio(window.__c.rgba(cs.outlineColor), window.__c.bgOf(e.parentElement)), h: e.getBoundingClientRect().height } })
    ok(f.fv && f.w >= 2 && f.c >= 3 && f.h >= (coarse ? 44 : 36), E(`GPartyField ${coarse ? 'grueso' : 'fino'}: foco visible ≥ 3:1 y alto ≥ ${coarse ? 44 : 36}`), JSON.stringify(f))
    await close(p, `party ${coarse}`)
  }

  /* 9 · forced-colors (Chromium): subrayado CanvasText, error Highlight y más grueso */
  if (eng === 'chromium') {
    const p = await open('booking.html', { fc: true })
    await p.locator('.g-booking-bar__submit').click(); await settle(p, 400)
    const s = await p.evaluate(() => {
      const sys = (n) => { const d = document.createElement('i'); d.style.color = n; document.body.append(d); const c = getComputedStyle(d).color; d.remove(); return c }
      const inv = document.querySelector('.g-booking-bar__slot.is-invalid'); const ok2 = document.querySelector('.g-booking-bar__slot:not(.is-invalid)')
      return { inv: getComputedStyle(inv, '::after').borderBottomColor === sys('Highlight'), invW: parseFloat(getComputedStyle(inv, '::after').borderBottomWidth) > parseFloat(getComputedStyle(ok2, '::after').borderBottomWidth), base: getComputedStyle(ok2).borderBottomColor === sys('CanvasText') }
    })
    ok(s.inv && s.invW && s.base, E('forced-colors: subrayado CanvasText; error Highlight y más grueso'), JSON.stringify(s))
    await close(p, 'forced')
  }
  await b.close()
}
stop()
report('GBookingBar')
