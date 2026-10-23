// Verificación propia de coco · auditoría (paso 5, flujo reducido #766) de @grana/blocks/booking (lote 3, once secciones).
// Sobre los bloques REALES (packages/blocks/dist/booking.js + packages/vue/dist) en el banco de bruno
// (packages/blocks/playground/booking/*.html), con el tema por defecto y los dos del CLI (rústico y lujo, ../marketing/temas),
// claro y oscuro, en Chromium, Firefox y WebKit. Común (servidor, colores y contraste) en ../../hero/auditoria-comun.mjs.
//   GRANA_PW_PORT=4219 node design/lab/blocks/booking/auditoria-verificar.mjs [--engines=chromium] [--verbose] [--solo=generic,states,…]
// Requiere `npm run build` en packages/vue y packages/blocks. Cada fallo es un hallazgo de auditoria.md (BK-…).
import { serve, stop, pw, ENGINES, ok, note, report, HELPERS, settle, args } from '../../hero/auditoria-comun.mjs'

const ORIGIN = (await serve()).replace(/\/packages\/vue\/playground\/$/, '')
const BASE = `${ORIGIN}/packages/blocks/playground/booking/`
// De una en una donde las tres repetirían anclas o `name` de campos (como el spec de bruno)
const PAGES = [
  ['search', 'search.html', ''], ['offer-list', 'offer-list.html', ''],
  ['guest-form 01', 'guest-form.html', 'v=01'], ['guest-form 02', 'guest-form.html', 'v=02'], ['guest-form 03', 'guest-form.html', 'v=03'],
  ['confirmation', 'confirmation.html', ''],
  ['itinerary 01', 'itinerary.html', 'v=01&hoy=1'], ['itinerary 02', 'itinerary.html', 'v=02&hoy=1'], ['itinerary 03', 'itinerary.html', 'v=03&hoy=1'],
  ['location', 'location.html', ''],
  ['policies 01', 'policies.html', 'v=01'], ['policies 02', 'policies.html', 'v=02'], ['policies 03', 'policies.html', 'v=03'],
  ['offer-detail 01', 'offer-detail.html', 'v=01'], ['offer-detail 02', 'offer-detail.html', 'v=02'], ['offer-detail 03', 'offer-detail.html', 'v=03'],
  ['booking-summary', 'booking-summary.html', ''],
  ['menu 01', 'menu.html', 'v=01'], ['menu 02', 'menu.html', 'v=02'], ['menu 03', 'menu.html', 'v=03'],
  ['availability', 'availability.html', '']
]
const THEMES = ['defecto', 'rustico', 'lujo']
const SOLO = args.solo ? String(args.solo).split(',') : null
const run = (k) => !SOLO || SOLO.includes(k)
const q = (...xs) => xs.filter(Boolean).join('&')

async function open (b, file, qs = '', { vw = 1440, vh = 900, rm = false, fc = false, expectWarn = null } = {}) {
  const ctx = await b.newContext({ viewport: { width: vw, height: vh }, reducedMotion: rm ? 'reduce' : 'no-preference', forcedColors: fc ? 'active' : 'none' })
  const p = await ctx.newPage()
  const errs = []
  p.on('console', (m) => {
    const t = m.text()
    if (expectWarn && expectWarn.test(t)) return
    if ((m.type() === 'error' && !/favicon/.test(t)) || (m.type() === 'warning' && /\[Vue warn\]|\[Grana /.test(t))) errs.push(t.slice(0, 160))
  })
  p.on('pageerror', (e) => errs.push(String(e).slice(0, 160)))
  const url = `${BASE}${file}${qs ? '?' + qs : ''}`
  for (let i = 0; ; i++) {
    try { await p.goto(url, { waitUntil: 'domcontentloaded' }); await p.waitForSelector('html[data-ready="1"] [data-gb]', { timeout: 20000 }); break } catch (e) { if (i >= 2) throw e }
  }
  await p.evaluate(() => document.fonts.ready)
  await p.evaluate(HELPERS)
  await settle(p, 150)
  p.__errs = errs
  return { p, close: () => ctx.close() }
}
const overflow = (p) => p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)
// Cambia props de una variante en vivo (app.js: window.blockViews[nn] se mezcla en las props)
const patch = async (p, n, obj) => { await p.evaluate(([n, o]) => Object.assign(window.blockViews[n], o), [n, obj]); await settle(p, 150) }
const norm = (s) => s.replace(/[\s  ]+/g, ' ').trim()

// En la página: texto, controles y márgenes del navegador de cada bloque (como Marketing)
const SCAN = () => {
  const vis = (e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && !e.closest('[hidden], [inert], .g-sr-only, dialog:not([open])') }
  const ownText = (e) => [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())
  const sizes = {}
  for (const k of ['caption', 'body-sm', 'body', 'title-sm', 'title', 'title-lg', 'display']) {
    const d = document.createElement('div'); d.style.fontSize = `var(--g-text-${k}-size)`; document.body.append(d); sizes[k] = parseFloat(getComputedStyle(d).fontSize); d.remove()
  }
  const tokenSizes = Object.values(sizes)
  { const d = document.createElement('div'); d.style.inlineSize = 'var(--g-space-1)'; document.body.append(d); window.__space = parseFloat(getComputedStyle(d).width); d.remove() }
  return [...document.querySelectorAll('[data-gb]')].filter((x) => !x.parentElement.closest('[data-gb]')).map((blk) => {
    const text = []; const ctl = []; const margins = []
    for (const e of blk.querySelectorAll('*')) {
      if (!vis(e) || e.closest('svg, img')) continue
      const cs = getComputedStyle(e)
      // Inactivo (día fuera de rango, botón deshabilitado): 1.4.3 lo exime; se cuenta aparte
      const inactive = !!e.closest('[aria-disabled="true"], :disabled, .is-disabled')
      if (ownText(e)) {
        const fs = parseFloat(cs.fontSize); const bold = Number(cs.fontWeight) >= 700
        const large = fs >= 24 || (bold && fs >= 18.66)
        const r = window.__c.text(e)
        // Escala propia auditada: cifras de GPrice/GMetric, la frase de GBookingBar y la celda de GDatePicker
        const ownScale = !!e.closest('.g-price, .g-metric, .g-booking-bar, .g-datepicker, .g-badge')
        text.push({ tag: e.tagName, t: e.textContent.trim().slice(0, 32), fs, r, need: large ? 3 : 4.5, inactive, style: cs.fontStyle, token: ownScale || tokenSizes.some((s) => Math.abs(s - fs) < 0.3) })
      }
      if (e.matches('a[href], button, input:not([type="hidden"]), select, textarea, [tabindex="0"]')) {
        const box = e.matches('input') ? (e.closest('.g-input__row, .g-input__control, .g-checkbox, .g-number-field') || (e.id && document.querySelector(`label[for="${e.id}"]`)) || e) : (e.closest('.g-card__primary, .g-card__title') && e.closest('.g-card')) || e
        let r = box.getBoundingClientRect()
        // GBtn amplía su diana con ::after a ≥ 24 × 24 sin cambiar su aspecto (GBtn.css «Área táctil»): esa es su área
        if (box === e && e.classList.contains('g-btn') && getComputedStyle(e, '::after').content !== 'none') {
          const w = Math.max(r.width, 24); const h = Math.max(r.height, 24); const cx = r.left + r.width / 2; const cy = r.top + r.height / 2
          r = { left: cx - w / 2, right: cx + w / 2, top: cy - h / 2, bottom: cy + h / 2, width: w, height: h }
        }
        ctl.push({ tag: e.tagName, t: (e.textContent || e.getAttribute('aria-label') || '').trim().slice(0, 24), x: r.left + r.width / 2, y: r.top + r.height / 2, l: r.left, r: r.right, tp: r.top, b: r.bottom, w: Math.round(r.width), h: Math.round(r.height) })
      }
      if (!/(^|\s)g-/.test(String(e.className)) && !e.parentElement.classList.contains('g-adaptive-layout') && e.tagName !== 'IMG') {
        const m = [cs.marginTop, cs.marginRight, cs.marginBottom, cs.marginLeft].map(parseFloat)
        const rhythm = (() => {
          for (let a = e.parentElement; a && a !== blk; a = a.parentElement) {
            if (a.classList.contains('g-text')) { const k = /g-text--size-(body-sm|caption|body)/.exec(a.className); return k ? ({ body: 3, 'body-sm': 2.5, caption: 2 })[k[1]] * window.__space : null }
            if (/(^|\s)g-(?!text(\s|$|--))/.test(String(a.className)) || a.matches('.g-tooltip')) return null
          }
          return null
        })()
        const ok0 = (v) => Math.abs(v) <= 0.5
        const okRhythm = rhythm !== null && ok0(m[1]) && ok0(m[3]) && [m[0], m[2]].every((v) => ok0(v) || Math.abs(v - rhythm) <= 0.5)
        if (!okRhythm && m.some((v) => Math.abs(v) > 0.5)) margins.push(`${e.tagName.toLowerCase()} ${m.map(Math.round).join('/')}`)
      }
    }
    return { gb: blk.dataset.gb, text, ctl, margins }
  })
}

async function generic (b, eng, tema, dark) {
  const mode = `${eng} · ${tema}${dark ? ' · oscuro' : ''}`
  for (const [name, file, q0] of PAGES) {
    const qs = q(q0, `tema=${tema}`, dark && 'dark=1')
    const { p, close } = await open(b, file, qs)
    const blocks = await p.evaluate(SCAN)
    for (const blk of blocks) {
      const id = `${mode} · ${blk.gb}`
      const low = blk.text.filter((x) => !x.inactive && x.r < x.need)
      ok(!low.length, `${id}: contraste del texto ≥ 4,5:1 (grande 3:1)`, low.map((x) => `${x.t} ${x.r}`).join('; '))
      const act = blk.text.filter((x) => !x.inactive)
      if (act.length) note(`${id}: contraste mínimo ${Math.min(...act.map((x) => x.r))}:1`)
      const smallT = blk.text.filter((x) => x.fs < 12)
      ok(!smallT.length, `${id}: texto ≥ 12 px`, smallT.map((x) => `${x.t} ${x.fs}`).join('; '))
      const small = (c) => c.w < 24 || c.h < 24
      const hits = (c, o) => { const dx = Math.max(o.l - c.x, 0, c.x - o.r); const dy = Math.max(o.tp - c.y, 0, c.y - o.b); return Math.hypot(dx, dy) < 12 || (small(o) && Math.hypot(c.x - o.x, c.y - o.y) < 24) }
      const tiny = blk.ctl.filter((c) => small(c) && blk.ctl.some((o) => o !== c && hits(c, o)))
      ok(!tiny.length, `${id}: controles ≥ 24 × 24 o con la separación de 2.5.8`, tiny.map((c) => `${c.tag} «${c.t}» ${c.w}×${c.h}`).join('; '))
      if (!dark) {
        const off = blk.text.filter((x) => !x.token)
        ok(!off.length, `${id}: todo el texto en un tamaño de la escala del tema (regla 7)`, [...new Set(off.map((x) => `${x.tag.toLowerCase()} ${x.fs}px «${x.t}»`))].slice(0, 4).join('; '))
        const it = blk.text.filter((x) => x.style === 'italic')
        ok(!it.length, `${id}: sin cursiva del navegador (address, cite)`, [...new Set(it.map((x) => x.tag.toLowerCase()))].join(','))
        ok(!blk.margins.length, `${id}: sin márgenes del navegador (solo el gap de las primitivas)`, [...new Set(blk.margins)].slice(0, 5).join('; '))
      }
    }
    ok(!p.__errs.length, `${mode} · ${name}: consola limpia`, p.__errs.join(' | '))
    for (const [w, h] of [[390, 844], [320, 640]]) {
      await p.setViewportSize({ width: w, height: h }); await settle(p)
      ok(!(await overflow(p)), `${mode} · ${name}: sin desplazamiento horizontal a ${w}`)
    }
    await close()
    if (!dark) {
      const z = await open(b, file, `${qs}&zoom=2`, { vw: 320, vh: 640 })
      ok(!(await overflow(z.p)), `${mode} · ${name}: sin desplazamiento horizontal a 320 con texto al 200 %`)
      await z.close()
    }
  }
}

async function focusPass (b, eng, tema) {
  for (const [name, file, q0] of PAGES) {
    const { p, close } = await open(b, file, q(q0, `tema=${tema}`))
    let seen = 0; const bad = []
    for (let i = 0; i < 30; i++) {
      await p.keyboard.press(eng === 'webkit' ? 'Alt+Tab' : 'Tab')
      const r = await p.evaluate(() => {
        const el = document.activeElement
        if (!el || el === document.body || !el.closest('[data-gb]')) return null
        const ring = (x, pe = null) => { if (!x) return false; const c = getComputedStyle(x, pe); return (c.outlineStyle !== 'none' && parseFloat(c.outlineWidth) > 0) || c.boxShadow !== 'none' }
        const boxes = ['.g-input__control', '.g-input__row', '.g-select__control', '.g-textarea__control', '.g-number-field__control', '.g-checkbox__box', '.g-checkbox']
        return { t: (el.textContent || el.getAttribute('aria-label') || el.tagName).trim().slice(0, 20), ring: ring(el) || ring(el.closest('.g-card'), '::after') || boxes.some((s) => ring(el.closest(s))) || ring(el.parentElement) || ring(el.nextElementSibling) }
      })
      if (r) { seen++; if (!r.ring) bad.push(r.t) }
    }
    const n = await p.evaluate(() => document.querySelectorAll('[data-gb] a[href], [data-gb] button:not([disabled]), [data-gb] input, [data-gb] [tabindex="0"]').length)
    ok(!n || seen > 0, `${eng} · ${tema} · ${name}: el Tab entra en el bloque`)
    ok(!bad.length, `${eng} · ${tema} · ${name}: foco visible en todo lo enfocable (${seen})`, [...new Set(bad)].join('; '))
    await close()
  }
}

async function structure (b, eng) {
  const E = eng
  for (const [name, file, q0] of PAGES) {
    const { p, close } = await open(b, file, q0)
    const s = await p.evaluate(() => {
      const hs = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map((h) => Number(h.tagName[1]))
      const lists = [...document.querySelectorAll('[data-gb] [role="list"]')].every((l) => [...l.children].filter((c) => !c.classList.contains('g-tooltip')).every((c) => c.getAttribute('role') === 'listitem' || (c.tagName === 'LI' && /^(UL|OL)$/.test(l.tagName))))
      const uls = [...document.querySelectorAll('[data-gb] ul, [data-gb] ol')].every((l) => [...l.children].every((c) => /^(LI|TEMPLATE)$/.test(c.tagName) || c.getAttribute('role') === 'presentation'))
      // Fechas y horas en <time datetime> ISO (fecha, fecha y hora, o HH:mm)
      const times = [...document.querySelectorAll('[data-gb] time')].map((t) => t.getAttribute('datetime') || '')
      const badTimes = times.filter((d) => !/^(\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?([+-]\d{2}:\d{2}|Z)?)?|\d{2}:\d{2})$/.test(d))
      // dl y address solo dentro de un componente que los tipografía (GText, la ficha de GCard, GSummary)
      const naked = [...document.querySelectorAll('[data-gb] dl, [data-gb] address, [data-gb] p, [data-gb] blockquote')].filter((e) => { for (let a = e; a && !a.matches('[data-gb]'); a = a.parentElement) if (/(^|\s)g-/.test(String(a.className))) return false; return true }).map((e) => e.tagName.toLowerCase())
      return { h1: hs.filter((h) => h === 1).length, hs, lists, uls, times: times.length, badTimes, naked }
    })
    ok(s.h1 === 0, `${E} · ${name}: ningún h1 (§15 regla 1)`, s.h1)
    ok(s.hs.every((l, i) => !i || l <= s.hs[i - 1] + 1), `${E} · ${name}: encabezados sin saltos`, s.hs.join(','))
    ok(s.lists && s.uls, `${E} · ${name}: listas reales (role=list › listitem, ul/ol › li)`)
    ok(!s.badTimes.length, `${E} · ${name}: toda fecha u hora en <time datetime> ISO (${s.times})`, s.badTimes.join(','))
    ok(!s.naked.length, `${E} · ${name}: ningún p/dl/address/blockquote fuera de un componente que lo tipografía`, s.naked.join(','))
    await close()
    const n = await open(b, file, q(q0, 'anidado=1'))
    const lv = await n.p.evaluate(() => [...document.querySelectorAll('[data-gb]')].filter((x) => !x.parentElement.closest('[data-gb]')).map((x) => x.querySelector('h2,h3,h4,h5,h6')).filter(Boolean).map((h) => Number(h.tagName[1])))
    ok(lv.length && lv.every((l) => l === 3), `${E} · ${name}: anidado en una GSection, el título del bloque baja a h3`, lv.join(','))
    await n.close()
  }
}

// La consulta dicha igual en todas (§15 regla 3): la referencia es el resumen de GBookingBar (Search 02)
async function query (b, eng) {
  const ref = await (async () => {
    const { p, close } = await open(b, 'search.html', 'v=02')
    const t = await p.evaluate(() => { const e = [...document.querySelectorAll('[data-gb="search-02"] *')].find((x) => [...x.childNodes].some((n) => n.nodeType === 3 && /^13[\s\u2009\u202f\u00a0]*\S[\s\u2009\u202f\u00a0]*15 nov.*noches/.test(n.textContent.trim()))); return e ? e.textContent : '' })
    await close(); return norm(t)
  })()
  ok(/noches/.test(ref) && /adultos/.test(ref), `${eng} · referencia de la consulta (resumen de GBookingBar)`, ref)
  note(`${eng} · consulta de referencia: «${ref}»`)
  for (const [file, qs, gbs] of [
    ['offer-list.html', '', ['offer-list-01', 'offer-list-02', 'offer-list-03']],
    ['guest-form.html', 'v=03', ['guest-form-03']],
    ['confirmation.html', '', ['confirmation-01', 'confirmation-02', 'confirmation-03']],
    ['offer-detail.html', 'v=01', ['offer-detail-01']], ['offer-detail.html', 'v=02', ['offer-detail-02']], ['offer-detail.html', 'v=03', ['offer-detail-03']],
    ['booking-summary.html', '', ['booking-summary-01', 'booking-summary-02', 'booking-summary-03']],
    ['availability.html', 'v=03', ['availability-03']]
  ]) {
    for (const vw of [1440, 390]) {
      const { p, close } = await open(b, file, qs, { vw, vh: vw > 500 ? 900 : 844 })
      for (const gb of gbs) {
        const r = await p.evaluate((gb) => {
          const root = document.querySelector(`[data-gb="${gb}"]`)
          // El elemento más pequeño que contiene la frase entera y su número de líneas
          return { text: root.textContent }
        }, gb)
        ok(!!ref && norm(r.text).includes(ref), `${eng} · ${gb} a ${vw}: la consulta con las mismas palabras que la búsqueda (describeQuery)`)
      }
      // BK-C1: con sitio, la consulta de un GSummary stack no se parte en columnas estrechas
      if (vw === 1440) {
        const st = await p.evaluate(() => [...document.querySelectorAll('[data-gb] .g-summary--layout-stack .g-summary__fact-value')].map((v) => { const s = v.closest('.g-summary').getBoundingClientRect().width; const lh = parseFloat(getComputedStyle(v).lineHeight); return { gb: v.closest('[data-gb]').dataset.gb, w: Math.round(v.getBoundingClientRect().width), s: Math.round(s), lines: Math.round(v.getBoundingClientRect().height / lh) } }))
        for (const x of st) ok(x.lines === 1, `${eng} · ${x.gb}: la consulta del GSummary stack en una línea con sitio (BK-C1)`, `${x.lines} líneas, valor ${x.w} de ${x.s} px`)
      }
      await close()
    }
  }
}

async function states (b, eng, tema, dark) {
  const E = `${eng} · ${tema}${dark ? ' · oscuro' : ''}`
  const base = [`tema=${tema}`, dark && 'dark=1']
  const textMin = (p, sel) => p.evaluate((sel) => { const t = [...document.querySelectorAll(sel)].filter((x) => x.getBoundingClientRect().height > 0 && [...x.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())); return t.length ? Math.min(...t.map((x) => window.__c.text(x))) : 0 }, sel)
  // Guest form: enviar vacío revela los errores, sin submit; error del servidor; error general; busy
  {
    const { p, close } = await open(b, 'guest-form.html', q('v=01', ...base))
    await p.locator('[data-gb] button[type="submit"]').click(); await settle(p, 300)
    const r = await p.evaluate(() => ({ invalid: document.querySelectorAll('[data-gb] [aria-invalid="true"]').length, submits: window.blockEvents.filter((e) => e[0] === 'submit').length, summary: !!document.querySelector('[data-gb] .g-error-summary:not([hidden])'), focus: document.activeElement && document.activeElement.closest('.g-error-summary, [aria-invalid="true"], .g-field-group') ? 1 : 0 }))
    ok(r.invalid >= 5 && !r.submits, `${E} · guest-form 01 vacío: errores revelados y ningún submit`, `${r.invalid} campos, ${r.submits} submit`)
    ok(r.summary, `${E} · guest-form 01 vacío: resumen de errores a la vista`)
    const c = await textMin(p, '[data-gb] .g-error-summary *, [data-gb] [id$="-error"], [data-gb] .g-input__message, [data-gb] .g-field__message, [data-gb] [class*="__error"]')
    ok(c >= 4.5, `${E} · guest-form 01 vacío: mensajes de error ≥ 4,5:1`, c)
    ok(!p.__errs.length, `${E} · guest-form 01 vacío: consola limpia`, p.__errs.join(' | '))
    await close()
  }
  for (const st of ['errors', 'error', 'busy']) {
    const { p, close } = await open(b, 'guest-form.html', q('v=01', ...base, `estado=${st}`))
    if (st === 'errors') {
      const r = await p.evaluate(() => { const i = document.querySelector('[data-gb] input[name="telefono"]'); return i.getAttribute('aria-invalid') })
      // Los errores de la aplicación se ven al enviar (castigar tarde) o al montar: se registra lo que hay
      if (r !== 'true') { await p.locator('[data-gb] button[type="submit"]').click(); await settle(p, 300) }
      const r2 = await p.evaluate(() => { const i = document.querySelector('[data-gb] input[name="telefono"]'); const d = (i.getAttribute('aria-describedby') || '').split(' ').map((x) => document.getElementById(x)).filter(Boolean).map((x) => x.textContent).join(' '); return { inv: i.getAttribute('aria-invalid'), d } })
      note(`${E} · guest-form errors: aria-invalid al montar ${r}`)
      ok(r2.inv === 'true' && /no recibe mensajes/.test(r2.d), `${E} · guest-form errors: el error del servidor en el teléfono, ligado al campo`, JSON.stringify(r2))
    }
    if (st === 'error') {
      await p.locator('[data-gb] button[type="submit"]').click(); await settle(p, 300)
      const t = await p.evaluate(() => { const e = [...document.querySelectorAll('[data-gb] *')].find((x) => [...x.childNodes].some((n) => n.nodeType === 3 && /No pudimos guardar/.test(n.textContent))); return e ? window.__c.text(e) : 0 })
      ok(t >= 4.5, `${E} · guest-form error general: visible y ≥ 4,5:1`, t)
    }
    if (st === 'busy') {
      const r = await p.evaluate(() => { const bt = document.querySelector('[data-gb] button[type="submit"]'); const lab = [...bt.querySelectorAll('*')].find((e) => [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) || bt; return { busy: bt.getAttribute('aria-busy') === 'true' || bt.getAttribute('aria-disabled') === 'true' || bt.disabled, r: window.__c.text(lab) } })
      ok(r.busy, `${E} · guest-form busy: el envío en carga`)
      ok(r.r >= 4.5, `${E} · guest-form busy: texto del botón ≥ 4,5:1`, r.r)
    }
    ok(!p.__errs.length, `${E} · guest-form ${st}: consola limpia`, p.__errs.join(' | '))
    await close()
  }
  // Confirmation: pedida (no confirmada) se dice en texto, con contraste
  {
    const { p, close } = await open(b, 'confirmation.html', q(...base, 'estado=requested'))
    const r = await p.evaluate(() => [...document.querySelectorAll('[data-gb]')].map((x) => { const e = [...x.querySelectorAll('*')].find((y) => [...y.childNodes].some((n) => n.nodeType === 3 && /Pendiente de confirmar/.test(n.textContent))); return [x.dataset.gb, e ? window.__c.text(e) : 0] }))
    for (const [gb, c] of r) ok(c >= 4.5, `${E} · ${gb} pedida: «Pendiente de confirmar» en texto ≥ 4,5:1`, c)
    await close()
  }
  // Offer list: la oferta no disponible del banco sigue a la vista con su motivo, sin «Elegir» ni tarjeta-botón (§15 regla 7)
  {
    const o = await open(b, 'offer-list.html', q(...base))
    const r = await o.p.evaluate(() => [...document.querySelectorAll('[data-gb]')].map((x) => {
      const card = [...x.querySelectorAll('.g-card')].find((c) => /Sencilla Cantera/.test(c.textContent))
      const reason = [...card.querySelectorAll('*')].find((y) => [...y.childNodes].some((n) => n.nodeType === 3 && /No quedan/.test(n.textContent)))
      return { gb: x.dataset.gb, reason: reason ? window.__c.text(reason) : 0, elegir: [...card.querySelectorAll('button, a')].some((bt) => /Elegir/.test(bt.textContent)), button: card.matches('.g-card--interaction-button') }
    }))
    for (const x of r) ok(x.reason >= 4.5 && !x.elegir && !x.button, `${E} · ${x.gb}: la oferta no disponible sigue con su motivo ≥ 4,5:1 y sin elegir`, JSON.stringify(x))
    await o.close()
  }
  // Menu: lo agotado se queda con su aviso
  for (const v of ['01', '02', '03']) {
    const { p, close } = await open(b, 'menu.html', q(`v=${v}`, ...base))
    if (v === '02') { await p.getByRole('tab', { name: /Comida/ }).click(); await settle(p, 300) }
    const c = await p.evaluate(() => { const e = [...document.querySelectorAll('[data-gb] *')].filter((y) => y.getBoundingClientRect().height > 0 && [...y.childNodes].some((n) => n.nodeType === 3 && /Agotado hoy/.test(n.textContent))); return e.length ? Math.min(...e.map((x) => window.__c.text(x))) : 0 })
    ok(c >= 4.5, `${E} · menu-${v}: «Agotado hoy» a la vista ≥ 4,5:1`, c)
    await close()
  }
  // Availability: vacío (sin días) y lleno (todo full); el lleno se dice y nada desborda
  for (const caso of ['vacío', 'lleno']) {
    const { p, close } = await open(b, 'availability.html', q(...base), { expectWarn: /\[Grana GbAvailability0[123]\] .*V4|\[Grana GbAvailability0[123]\]/ })
    await p.evaluate((caso) => { for (const n of ['01', '02', '03']) { const days = caso === 'vacío' ? [] : Array.from({ length: 30 }, (_, i) => ({ date: `2026-11-${String(i + 1).padStart(2, '0')}`, status: 'full' })); Object.assign(window.blockViews[n], { days, value: null }) } }, caso)
    await settle(p, 300)
    const r = await p.evaluate(() => ({ list: document.querySelectorAll('[data-gb="availability-02"] li').length, full: [...document.querySelectorAll('[data-gb="availability-01"] .g-datepicker__day[data-date="2026-11-10"]')].map((d) => d.getAttribute('aria-label') || '').join('') }))
    ok(r.list === 0, `${E} · availability ${caso}: 02 sin lista (V4: la aplicación pone su mensaje en el slot empty)`, r.list)
    if (caso === 'lleno') ok(/lleno/.test(r.full), `${E} · availability lleno: el día dice «lleno» en su nombre`, r.full)
    for (const [w, h] of [[390, 844], [320, 640]]) { await p.setViewportSize({ width: w, height: h }); await settle(p); ok(!(await overflow(p)), `${E} · availability ${caso}: sin desbordar a ${w}`) }
    ok(!p.__errs.length, `${E} · availability ${caso}: consola limpia salvo V4`, p.__errs.join(' | '))
    await close()
  }
}

// Medidas de forma de esta auditoría
async function shapes (b, eng, tema) {
  const E = `${eng} · ${tema}`
  const t = `tema=${tema}`
  // Confirmation 03 cabe en 390 × 844
  {
    const { p, close } = await open(b, 'confirmation.html', q('v=03', t), { vw: 390, vh: 844 })
    const h = await p.evaluate(() => Math.round(document.querySelector('[data-gb]').getBoundingClientRect().height))
    ok(h <= 844, `${E} · confirmation-03: la tarjeta entera cabe en 390 × 844`, `${h} px`)
    await close()
  }
  // Confirmation: los botones de canal a la misma altura (BK-B3)
  {
    const { p, close } = await open(b, 'confirmation.html', t)
    const r = await p.evaluate(() => [...document.querySelectorAll('[data-gb] ul[aria-label]')].map((u) => [u.closest('[data-gb]').dataset.gb, [...u.querySelectorAll(':scope > li .g-btn')].map((x) => Math.round(x.getBoundingClientRect().top))]))
    for (const [gb, tops] of r) ok(new Set(tops).size === 1, `${E} · ${gb}: los canales alineados arriba (BK-B3)`, tops.join('/'))
    await close()
  }
  // Guest form 03 a 390 × 844: ningún control enfocado bajo el pie pegado (2.4.11, y aquí entero a la vista)
  {
    const { p, close } = await open(b, 'guest-form.html', q('v=03', t), { vw: 390, vh: 844 })
    const bad = []
    for (let i = 0; i < 24; i++) {
      await p.keyboard.press(eng === 'webkit' ? 'Alt+Tab' : 'Tab'); await settle(p, 80)
      const r = await p.evaluate(() => {
        const el = document.activeElement; if (!el || !el.closest('[data-gb]') || el.closest('.g-form-actions')) return null
        const box = (el.closest('.g-input__row, .g-input__control, .g-select__control, .g-textarea__control, .g-checkbox') || el).getBoundingClientRect()
        const bar = document.querySelector('[data-gb] .g-form-actions').getBoundingClientRect()
        return { t: el.name || el.textContent.trim().slice(0, 16), under: box.bottom > bar.top + 1 && box.top < bar.bottom, hidden: box.top >= bar.top - 1 }
      })
      if (r && r.under) bad.push(`${r.t}${r.hidden ? ' (entero)' : ''}`)
    }
    ok(!bad.length, `${E} · guest-form-03 a 390 × 844: ningún control enfocado bajo el pie pegado`, bad.join('; '))
    const sticky = await p.evaluate(() => getComputedStyle(document.querySelector('[data-gb] .g-form-actions')).position)
    ok(sticky === 'sticky', `${E} · guest-form-03: el pie de envío es pegado`, sticky)
    await close()
  }
  // Search 03: el muelle aparece al dejar atrás la consulta, no pasa de un cuarto del alto y no tapa el último botón
  {
    const { p, close } = await open(b, 'search.html', q('v=03&alto=1', t), { vw: 390, vh: 844 })
    await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight)); await settle(p, 400)
    await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight)); await settle(p, 300)
    const r = await p.evaluate(() => { const d = document.querySelector('.g-booking-bar__dock'); const dr = d.getBoundingClientRect(); const bt = document.getElementById('pg-last').getBoundingClientRect(); const s = d.querySelector('.g-booking-bar__dock-summary'); return { shown: d.classList.contains('is-shown'), h: Math.round(dr.height), vh: innerHeight, covers: bt.bottom > dr.top + 1, r: s ? window.__c.text(s) : 0, w: Math.round(dr.width), vw: document.documentElement.clientWidth } })
    ok(r.shown, `${E} · search-03: el muelle aparece al dejar atrás la consulta`)
    ok(r.h <= r.vh / 4, `${E} · search-03: el muelle ≤ un cuarto del alto`, `${r.h} de ${r.vh}`)
    ok(!r.covers, `${E} · search-03: el último botón de la página no queda bajo el muelle`)
    ok(r.r >= 4.5, `${E} · search-03: resumen del muelle ≥ 4,5:1`, r.r)
    ok(r.w <= r.vw, `${E} · search-03: el muelle no desborda`, `${r.w}/${r.vw}`)
    await p.locator('#pg-last').focus(); await settle(p, 200)
    const f = await p.evaluate(() => { const d = document.querySelector('.g-booking-bar__dock').getBoundingClientRect(); const bt = document.getElementById('pg-last').getBoundingClientRect(); return bt.bottom <= d.top + 1 || !document.querySelector('.g-booking-bar__dock.is-shown') })
    ok(f, `${E} · search-03: el foco en el último botón no queda tapado (2.4.11)`)
    await close()
  }
  // Booking summary 03 «Línea»: una fila a 1440 (BS-L1, lima)
  {
    const { p, close } = await open(b, 'booking-summary.html', q('v=03', t))
    const r = await p.evaluate(() => { const kids = [...document.querySelector('[data-gb]').children].map((x) => x.getBoundingClientRect()); return Math.max(...kids.map((x) => x.top)) < Math.min(...kids.map((x) => x.bottom)) })
    ok(r, `${E} · booking-summary-03: lo pedido, el total y la acción en una sola fila a 1440 (BS-L1)`)
    await close()
  }
  // Availability 03: dos columnas a 1440 (AV-L1, lima)
  {
    const { p, close } = await open(b, 'availability.html', q('v=03', t))
    const r = await p.evaluate(() => { const x = document.querySelector('[data-gb]'); const a = x.querySelector('.g-datepicker').getBoundingClientRect(); const c = x.querySelector('.g-adapt-standard').getBoundingClientRect(); return c.top < a.bottom - 1 })
    ok(r, `${E} · availability-03: el calendario y el resumen en dos columnas a 1440 (AV-L1)`)
    await close()
  }
  // Offer list 01: la última fila no estira una tarjeta sola a todo el ancho (BK-L7)
  {
    const { p, close } = await open(b, 'offer-list.html', q('v=01', t))
    const r = await p.evaluate(() => { const w = [...document.querySelectorAll('[data-gb] [role="listitem"]')].map((li) => li.getBoundingClientRect().width); return [Math.round(Math.min(...w)), Math.round(Math.max(...w))] })
    ok(r[1] <= r[0] * 1.5, `${E} · offer-list-01: tarjetas de ancho parecido en todas las filas a 1440 (BK-L7)`, `${r[0]} a ${r[1]} px`)
    await close()
  }
  // Offer list 02: la viñeta de lo incluido igual que en 01 (BK-C3)
  {
    const { p, close } = await open(b, 'offer-list.html', t)
    const r = await p.evaluate(() => [...new Set([...document.querySelectorAll('[data-gb] .g-text ul')].map((u) => getComputedStyle(u).listStyleType))])
    ok(r.length === 1 && r[0] === 'disc', `${E} · offer-list: misma viñeta en las tres variantes (BK-C3)`, r.join(','))
    await close()
  }
  // Itinerary 03: la hora de fin no se pierde en la tabla (BK-B4)
  {
    const { p, close } = await open(b, 'itinerary.html', q('v=03', t))
    const r = await p.evaluate(() => { const row = [...document.querySelectorAll('[data-gb] tr')].find((x) => /Gran Plaza/.test(x.textContent)); return row ? row.textContent : '' })
    ok(/10:30/.test(r), `${E} · itinerary-03: la parada con fin dice su fin (9:00–10:30) como en 01 y 02 (BK-B4)`, norm(r))
    await close()
  }
  // Guest form: los consentimientos con título de grupo (#880, BK-B1)
  {
    const { p, close } = await open(b, 'guest-form.html', q('v=01', t))
    const r = await p.evaluate(() => { const cb = document.querySelector('[data-gb] input[name="politica"]'); const fs = cb && cb.closest('fieldset'); return fs ? (fs.querySelector('legend') || {}).textContent || '' : '' })
    ok(!!r, `${E} · guest-form: los consentimientos en un GFieldGroup con legend (#880, BK-B1)`, r || 'sin fieldset/legend')
    const a = await p.evaluate(() => { const ln = [...document.querySelectorAll('[data-gb] a')].find((x) => /política/i.test(x.textContent)); const lab = [...document.querySelectorAll('[data-gb] label')].find((x) => /Acepto/.test(x.textContent)); const txt = [...lab.querySelectorAll('*')].find((y) => [...y.childNodes].some((n) => n.nodeType === 3 && /Acepto/.test(n.textContent))) || lab; return [Math.round(ln.getBoundingClientRect().left), Math.round(txt.getBoundingClientRect().left)] })
    ok(Math.abs(a[0] - a[1]) <= 1, `${E} · guest-form: el enlace de la política alineado con el texto de su casilla (BK-L8)`, `${a[0]} frente a ${a[1]} px`)
    const opt = await p.evaluate(() => [...document.querySelectorAll('[data-gb] label')].filter((l) => /^(Adultos|Niños|Habitaciones)/.test(l.textContent.trim()) && /opcional/.test(l.textContent)).length)
    ok(opt === 0, `${E} · guest-form: los contadores del grupo no se marcan «opcional» (siempre tienen valor, BK-L9)`, `${opt} marcados`)
    await close()
  }
  // GPriceScope: con los impuestos en una línea propia (estrecho), ningún filete suelto al inicio de la línea (BK-C4)
  for (const [file, qs0] of [['availability.html', ''], ['guest-form.html', 'v=03'], ['offer-list.html', ''], ['menu.html', 'v=01']]) {
    const { p, close } = await open(b, file, q(qs0, t), { vw: 390, vh: 844 })
    const r = await p.evaluate(() => [...document.querySelectorAll('[data-gb] .g-price-scope__legend')].map((lg) => {
      const tx = lg.querySelector('.g-price-scope__taxes'); if (!tx) return null
      const L = lg.getBoundingClientRect(); const T = tx.getBoundingClientRect()
      const rtl = getComputedStyle(lg).direction === 'rtl'
      const wrapped = rtl ? Math.abs(L.right - T.right) < 2 : Math.abs(T.left - L.left) < 2
      const own = getComputedStyle(tx).borderInlineStartStyle !== 'none' || getComputedStyle(tx).borderLeftStyle !== 'none'
      const clip = getComputedStyle(lg).overflowX !== 'visible'
      return { wrapped, loose: wrapped && (own || !clip) }
    }).filter(Boolean))
    const loose = r.filter((x) => x.loose).length
    if (r.some((x) => x.wrapped)) note(`${E} · ${file}: ${r.filter((x) => x.wrapped).length} leyenda(s) con los impuestos en línea propia a 390`)
    ok(!loose, `${E} · ${file} a 390: la leyenda de precios sin filete suelto al inicio de una línea (BK-C4)`, `${loose} de ${r.length}`)
    await close()
  }
  // Search 01 y 03 en estrecho: la puntuación final de la frase no baja sola a una línea (BK-C5)
  for (const vw of [390, 320]) {
    const { p, close } = await open(b, 'search.html', t, { vw, vh: 844 })
    const r = await p.evaluate(() => ['search-01', 'search-03'].map((gb) => {
      const ph = document.querySelector(`[data-gb="${gb}"] .g-booking-bar__phrase`)
      const last = [...ph.childNodes].reverse().find((n) => n.nodeType === 3 && n.textContent.trim())
      const slots = [...ph.querySelectorAll('.g-booking-bar__slot')]
      const rg = document.createRange(); rg.selectNodeContents(last)
      const rs = [...rg.getClientRects()]; const tail = rs[0]
      const sl = slots[slots.length - 1].getBoundingClientRect()
      return { gb, text: last.textContent.trim(), alone: tail.top >= sl.bottom - 2 && last.textContent.trim().length <= 2 }
    }))
    for (const x of r) ok(!x.alone, `${E} · ${x.gb} a ${vw}: la puntuación final «${x.text}» no queda sola en su línea (BK-C5)`)
    await close()
  }
  // GBtn con una palabra larga a 320: no saca el botón de su contenedor (BK-C2)
  for (const [file, n, pt] of [['guest-form.html?v=01', '01', { action: { label: 'Donaudampfschifffahrtsgesellschaftskapitänsmütze' } }], ['confirmation.html?v=02', '02', { actions: [{ id: 'a', label: 'Donaudampfschifffahrtsgesellschaftskapitänsmütze', href: '/a' }] }], ['location.html?v=02', '02', { directions: { label: 'Donaudampfschifffahrtsgesellschaftskapitänsmütze', href: 'https://maps.example/x', external: true } }]]) {
    const [f, qs0] = file.split('?')
    const { p, close } = await open(b, f, q(qs0, t), { vw: 320, vh: 640 })
    await patch(p, n, pt)
    ok(!(await overflow(p)), `${E} · ${f} ${n}: un botón con una palabra larga no desborda a 320 (BK-C2)`)
    await close()
  }
}

// Rúbrica de movimiento sobre lo compuesto
async function motion (b, eng) {
  const running = (p, filterMove) => p.evaluate((fm) => {
    const all = document.getAnimations().filter((a) => a.playState === 'running' && a.effect?.target?.closest?.('[data-gb], dialog'))
    const moves = all.filter((a) => !/^(opacity|visibility|color|background-color|border-color|outline-color|box-shadow)$/.test(a.transitionProperty || '') && !(a.animationName && /fade/i.test(a.animationName)))
    return { n: all.length, moves: (fm ? moves : all).length, dur: Math.max(0, ...(fm ? moves : all).map((a) => Number(a.effect.getComputedTiming().duration) || 0)), props: [...new Set(moves.map((a) => a.transitionProperty || a.animationName))].join(',') }
  }, filterMove)
  // Acordeones: Itinerary 02, Policies 01, Offer detail 03
  for (const [file, qs, gb] of [['itinerary.html', 'v=02', 'itinerary-02'], ['policies.html', 'v=01', 'policies-01'], ['offer-detail.html', 'v=03', 'offer-detail-03']]) {
    for (const rm of [false, true]) {
      const { p, close } = await open(b, file, qs, { rm })
      const tag = `${eng} · ${gb}${rm ? ' · reducido' : ''}`
      const s = await p.evaluate(async (gb) => {
        const root = document.querySelector(`[data-gb="${gb}"]`)
        const items = [...root.querySelectorAll('.g-accordion-item')]
        const it = items.find((x) => x.querySelector('[aria-expanded="false"]')) || items[1]
        const btn = it.querySelector('[aria-expanded]')
        const head = it.getBoundingClientRect().top
        btn.click()
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
        const all = document.getAnimations().filter((a) => a.playState === 'running' && a.effect?.target?.closest?.('[data-gb]'))
        const moves = all.filter((a) => !/^(opacity|visibility|color)$/.test(a.transitionProperty || ''))
        const dur = Math.max(0, ...moves.map((a) => Number(a.effect.getComputedTiming().duration) || 0))
        const mid = it.getBoundingClientRect().top
        await new Promise((r) => setTimeout(r, 700))
        const open1 = btn.getAttribute('aria-expanded')
        const other = items.find((x) => x !== it && x.querySelector('[aria-expanded="false"]'))
        let closed2 = 'false'
        if (other) { const b2 = other.querySelector('[aria-expanded]'); b2.click(); await new Promise((r) => requestAnimationFrame(r)); b2.click(); await new Promise((r) => setTimeout(r, 700)); closed2 = b2.getAttribute('aria-expanded') }
        return { n: moves.length, dur, moved: Math.abs(mid - head), after: Math.abs(it.getBoundingClientRect().top - head), open1, closed2 }
      }, gb)
      ok(s.open1 === 'true', `${tag}: abre`)
      ok(s.moved < 0.5 && s.after < 0.5, `${tag}: el encabezado no se mueve al abrir`, `${s.moved}/${s.after}`)
      if (rm) ok(s.n === 0, `${tag}: con movimiento reducido, sin movimiento (solo fundidos)`, `${s.n} · ${s.dur} ms`)
      else { ok(s.dur > 0 && s.dur <= 500, `${tag}: el plegado anima dentro de la duración del tema`, `${s.n} · ${s.dur} ms`); note(`${tag}: plegado de ${s.dur} ms`) }
      ok(s.closed2 === 'false', `${tag}: interrumpible (abrir y cerrar en el acto termina cerrado)`)
      await close()
    }
  }
  // Pestañas: Menu 02 y Offer detail 02
  for (const [file, qs, gb, tab] of [['menu.html', 'v=02', 'menu-02', /Cena/], ['offer-detail.html', 'v=02', 'offer-detail-02', null]]) {
    for (const rm of [false, true]) {
      const { p, close } = await open(b, file, qs, { rm })
      const tag = `${eng} · ${gb}${rm ? ' · reducido' : ''}`
      const tabs = p.locator(`[data-gb="${gb}"] .g-tabs [role="tab"]`)
      const target = tab ? tabs.filter({ hasText: tab }) : tabs.nth(1)
      await target.scrollIntoViewIfNeeded(); await settle(p, 100)
      const top0 = await p.evaluate((gb) => document.querySelector(`[data-gb="${gb}"] .g-tabs [role="tablist"]`).getBoundingClientRect().top + scrollY, gb)
      await target.click()
      await p.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
      const r = await running(p, true)
      await p.waitForTimeout(600)
      const top1 = await p.evaluate((gb) => document.querySelector(`[data-gb="${gb}"] .g-tabs [role="tablist"]`).getBoundingClientRect().top + scrollY, gb)
      ok(await target.getAttribute('aria-selected') === 'true', `${tag}: la pestaña se elige`)
      ok(Math.abs(top1 - top0) < 0.5, `${tag}: la fila de pestañas no se mueve al cambiar`, `${top0}→${top1}`)
      if (rm) ok(r.moves === 0, `${tag}: con movimiento reducido, sin movimiento`, `${r.moves} (${r.props})`)
      else { ok(r.dur <= 500, `${tag}: el cambio de pestaña dentro de la duración del tema`, `${r.dur} ms (${r.props})`); note(`${tag}: ${r.moves} animaciones, ${r.dur} ms (${r.props})`) }
      await close()
    }
  }
  // Visor de fotos (Offer list): abre, anima corto, con reducido sin desplazamiento, Esc cierra y el foco vuelve
  for (const rm of [false, true]) {
    const { p, close } = await open(b, 'offer-list.html', 'v=01', { rm })
    const tag = `${eng} · visor de offer-list${rm ? ' · reducido' : ''}`
    const btn = p.getByRole('button', { name: 'Ver 3 fotos' })
    await btn.click()
    await p.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
    const r = await running(p, true)
    await p.waitForTimeout(600)
    ok(await p.locator('dialog[open]').count() === 1, `${tag}: abre`)
    if (rm) ok(r.moves === 0, `${tag}: con movimiento reducido, sin desplazamiento ni escala`, `${r.moves} (${r.props})`)
    else { ok(r.dur <= 500, `${tag}: la apertura dentro de la duración del tema`, `${r.dur} ms`); note(`${tag}: ${r.moves} animaciones de movimiento, ${r.dur} ms (${r.props})`) }
    await p.keyboard.press('Escape'); await p.waitForTimeout(600)
    ok(await p.locator('dialog[open]').count() === 0, `${tag}: Esc cierra`)
    ok(await btn.evaluate((x) => x === document.activeElement), `${tag}: el foco vuelve a su botón`)
    await close()
  }
  // El total que rueda (GPrice) en Booking summary 01; con reducido no rueda
  for (const rm of [false, true]) {
    const { p, close } = await open(b, 'booking-summary.html', 'v=01', { rm })
    const tag = `${eng} · booking-summary-01 total${rm ? ' · reducido' : ''}`
    const s = await p.evaluate(() => new Promise((r) => {
      const root = document.querySelector('[data-gb="booking-summary-01"]')
      const head = root.querySelector('.g-price').getBoundingClientRect().top
      let seen = false; let dur = 0
      const scan = () => { for (const a of document.getAnimations()) if (a.playState === 'running' && a.effect?.target && root.contains(a.effect.target)) { seen = true; dur = Math.max(dur, Number(a.effect.getComputedTiming().duration) || 0) } }
      const mo = new MutationObserver(scan); mo.observe(root, { subtree: true, childList: true, attributes: true })
      window.blockViews['01'].totals = { total: { value: { amount: 5950, currency: 'MXN' }, label: 'por 3 noches' } }
      requestAnimationFrame(scan)
      setTimeout(() => { mo.disconnect(); r({ seen, dur, moved: Math.abs(root.querySelector('.g-price').getBoundingClientRect().top - head), text: root.textContent }) }, 900)
    }))
    ok(s.seen === !rm, `${tag}: ${rm ? 'no rueda' : 'las cifras que cambian ruedan'}`, `${s.seen} · ${s.dur} ms`)
    if (!rm) ok(s.dur <= 600, `${tag}: el rodar dentro de la duración del tema`, `${s.dur} ms`)
    ok(s.moved < 0.5, `${tag}: el precio no cambia de sitio al rodar`, s.moved)
    ok(/5[,.  ]?950/.test(s.text), `${tag}: termina en la cifra nueva`)
    await close()
  }
  // Muelle de Search 03 con reducido: solo fundido
  {
    const { p, close } = await open(b, 'search.html', 'v=03&alto=1', { rm: true, vw: 390, vh: 844 })
    await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
    await p.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
    const r = await running(p, true)
    ok(r.moves === 0, `${eng} · search-03 muelle · reducido: entra sin desplazamiento`, `${r.moves} (${r.props})`)
    await close()
  }
  // Nada se mueve solo al cargar (2.2.2)
  for (const [name, file, q0] of PAGES) {
    const { p, close } = await open(b, file, q0)
    await p.waitForTimeout(300)
    const n = await p.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running' && a.effect?.target?.closest?.('[data-gb]')).length)
    ok(n === 0, `${eng} · ${name}: nada se mueve solo`, n)
    await close()
  }
}

async function extras (b) {
  // forced-colors (Chromium emulado): acciones con borde del sistema y foco con contorno
  for (const [file, qs] of [['booking-summary.html', ''], ['confirmation.html', ''], ['guest-form.html', 'v=01'], ['availability.html', 'v=03'], ['offer-list.html', '']]) {
    const { p, close } = await open(b, file, qs, { fc: true })
    const s = await p.evaluate(() => [...document.querySelectorAll('[data-gb] .g-btn--variant-solid, [data-gb] .g-btn--variant-outline')].map((x) => getComputedStyle(x).borderTopStyle))
    ok(s.every((x) => x !== 'none'), `chromium · forced-colors · ${file} ${qs}: las acciones con borde del sistema`, s.join(','))
    const cards = await p.evaluate(() => [...document.querySelectorAll('[data-gb] .g-card--level-outlined, [data-gb] .g-card--level-raised')].map((x) => getComputedStyle(x).borderTopStyle))
    ok(cards.every((x) => x !== 'none'), `chromium · forced-colors · ${file} ${qs}: tarjetas delimitadas`, cards.join(','))
    let fine = 0; const bad = []
    for (let i = 0; i < 6; i++) {
      await p.keyboard.press('Tab')
      const f = await p.evaluate(() => { const el = document.activeElement; if (!el || !el.closest('[data-gb]')) return null; const ring = (x, pe) => { if (!x) return false; const c = getComputedStyle(x, pe); return c.outlineStyle !== 'none' && parseFloat(c.outlineWidth) > 0 }; return ring(el) || ring(el.closest('.g-card'), '::after') || ['.g-input__row', '.g-input__control', '.g-number-field__control', '.g-checkbox__box'].some((s) => ring(el.closest(s))) || ring(el.parentElement) })
      if (f === true) fine++; else if (f === false) bad.push(i)
    }
    ok(!bad.length, `chromium · forced-colors · ${file} ${qs}: anillo de foco con contorno del sistema (${fine})`, bad.join(','))
    await close()
  }
  // RTL: página en rtl a 390 sin desbordar; los títulos arrancan del borde derecho
  for (const [name, file, q0] of PAGES) {
    const { p, close } = await open(b, file, q0, { vw: 390, vh: 844 })
    await p.evaluate(() => { document.documentElement.dir = 'rtl' }); await settle(p, 150)
    ok(!(await overflow(p)), `chromium · rtl · ${name}: sin desplazamiento horizontal a 390`)
    const al = await p.evaluate(() => [...document.querySelectorAll('[data-gb] .g-section__title')].every((t) => { const s = t.getBoundingClientRect(); const c = t.closest('.g-section').getBoundingClientRect(); return Math.abs(s.right - c.right) < 1.5 }))
    ok(al, `chromium · rtl · ${name}: los títulos de sección arrancan del borde derecho`)
    await close()
  }
}

for (const eng of ENGINES) {
  const b = await pw[eng].launch()
  try {
    if (run('structure')) await structure(b, eng)
    if (run('query')) await query(b, eng)
    if (run('motion')) await motion(b, eng)
    for (const tema of THEMES) {
      for (const dark of [false, true]) {
        if (run('generic')) await generic(b, eng, tema, dark)
        if (run('states')) await states(b, eng, tema, dark)
      }
      if (run('shapes')) await shapes(b, eng, tema)
      if (run('focus')) await focusPass(b, eng, tema)
    }
    if (eng === 'chromium' && run('extras')) await extras(b)
  } finally { await b.close() }
}
stop()
report('Auditoría de @grana/blocks/booking')
