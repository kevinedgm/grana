// Verificación de coco sobre el banco de GBookingBar y GPartyField (design/lab/booking-bar/estilo-banco.html), con el CSS
// real de GBookingBar.css, GPartyField.css, GDatePicker.css y GDialog.css de src/ en la capa grana.components. Mide:
// análisis estático; la frase que refluye a 1100, 390, 320 y 320×256 en LTR y RTL; los huecos (vacío discontinuo frente a
// lleno continuo, error en danger-text, la tinta que se asienta en slow y aparece con reducido, diana de 44px sin pisar la
// línea con puntero grueso); raíces sin caja con el slot trigger; paneles dentro del visor con su letra; la barra (cajas
// alineadas con la acción, resumen visible) y el compacto (resumen ≥ 44px, resumen oculto accesible); el campo de grupo con
// la caja de GSelect; el muelle (alto de contrato, scroll-padding del documento, foco nunca tapado, reducido); el día «solo
// salida» distinto del tachado; contraste en el tema por defecto, tres temas del CLI y cuatro generados, claro y oscuro;
// forced-colors (Chromium); consola limpia.
// Ejecutar desde la raíz del repo (requiere dist/):  GRANA_PW_PORT=4241 node design/lab/booking-bar/estilo-verificar.mjs
// Opcional: --engines=chromium,firefox,webkit  --verbose
import http from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const pw = await import(new URL('../theme-playground/node_modules/playwright/index.mjs', import.meta.url))
const ROOT = fileURLToPath(new URL('../../../', import.meta.url))
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')).map(([k, v]) => [k, v ?? true]))
const ENGINES = (args.engines || 'chromium,firefox,webkit').split(',')
const V = !!args.verbose
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const server = http.createServer(async (req, res) => {
  try {
    const p = normalize(join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname)))
    if (!p.startsWith(ROOT)) throw new Error('fuera')
    res.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream' }).end(await readFile(p))
  } catch { if (!res.headersSent) res.writeHead(404).end() }
})
await new Promise((r) => server.listen(Number(process.env.GRANA_PW_PORT) || 4241, '127.0.0.1', r))
const BASE = `http://127.0.0.1:${server.address().port}/design/lab/booking-bar/estilo-banco.html`

let total = 0, failed = 0
const fails = [], notes = []
const ok = (cond, msg, info = '') => { total++; if (!cond) { failed++; fails.push(msg + (info !== '' ? ' · ' + info : '')) } else if (V) console.log('ok   ' + msg + (info !== '' ? ' · ' + info : '')) }
const note = (s) => { notes.push(s); if (V) console.log('nota ' + s) }

/* ---------- 0 · Análisis estático ---------- */
for (const file of ['GBookingBar/GBookingBar.css', 'GPartyField/GPartyField.css', 'GDatePicker/GDatePicker.css']) {
  const raw = await readFile(join(ROOT, 'packages/vue/src/components', file), 'utf8')
  const css = raw.replace(/\/\*[\s\S]*?\*\//g, '')
  ok(!/#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|lab|lch|hwb|color|color-mix)\(/.test(css), `estático ${file}: sin color literal`)
  ok(!/var\(\s*--[\w-]+\s*,/.test(css), `estático ${file}: var() sin respaldo`)
  ok(!/@layer/.test(css) && !/!important/.test(css), `estático ${file}: sin @layer ni !important`)
  const vars = [...new Set([...css.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1]))]
  ok(vars.every((v) => v.startsWith('--g-') || v.startsWith('--_')), `estático ${file}: solo --g-* y --_*`)
  if (file.startsWith('GBooking')) {
    ok(!/ease-(spring|bounce)/.test(css), 'estático GBookingBar: sin muelle ni rebote (#740)')
    const lens = [...css.matchAll(/(?<![\w-])(\d*\.?\d+)(px|rem|em|vh|vw|svh|dvh|ms|s|ch|cqi)(?![\w-])/g)].map((m) => m[1] + m[2])
    ok(lens.every((l) => ['24px', '44px', '1px', '0s', '125em', '100vw'].includes(l)), 'estático GBookingBar: literales de medida solo 24px/44px y el texto oculto', [...new Set(lens)].join(','))
    ok(/max\(var\(--g-space-16\), calc\(44px \+ var\(--g-space-1\) \* 4\)\)/.test(css), 'estático GBookingBar: alto de contrato del muelle (#740)')
    ok(/:root:has\(\.g-booking-bar__dock\.is-shown/.test(css) && /scroll-padding-block-end/.test(css), 'estático GBookingBar: scroll-padding-block-end en la capa de Grana')
  }
  if (file.startsWith('GDate')) ok(/\.g-datepicker--trigger \{\s*display: contents;/.test(css) && /\.g-datepicker__day\.is-checkout-only/.test(css), 'estático GDatePicker: --trigger sin caja e is-checkout-only (#739)')
  if (file.startsWith('GParty')) ok(/\.g-party-field--trigger \{\s*display: contents;/.test(css), 'estático GPartyField: --trigger sin caja (B-L7)')
}

const HELPERS = () => {
  const cv = document.createElement('canvas'); cv.width = cv.height = 1
  const cx = cv.getContext('2d', { willReadFrequently: true })
  const rgba = (c) => { cx.clearRect(0, 0, 1, 1); cx.fillStyle = '#000'; cx.fillStyle = c; cx.fillRect(0, 0, 1, 1); const d = cx.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255] }
  const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) }
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05) }
  const bgOf = (el) => { for (let e = el; e; e = e.parentElement) { const c = rgba(getComputedStyle(e).backgroundColor); if (c[3] > 0.99) return c } return [255, 255, 255, 1] }
  window.__c = { rgba, ratio, bgOf, text: (el) => ratio(rgba(getComputedStyle(el).color), bgOf(el)) }
}
async function open (b, qs = '', opts = {}) {
  const { vw = 1100, vh = 800, ...ctx } = opts
  const context = await b.newContext({ viewport: { width: vw, height: vh }, ...ctx })
  const p = await context.newPage()
  const errs = []
  p.on('console', (m) => { if (['error', 'warning'].includes(m.type()) && !/fonts\.css|404|\[Grana/.test(m.text())) errs.push(m.text()) })
  p.on('pageerror', (e) => errs.push(String(e)))
  await p.goto(BASE + qs.replace(/^&/, '?'))
  await p.waitForFunction(() => window.__bk && window.__bk.ready)
  await p.evaluate(() => document.fonts.ready)
  await p.evaluate(HELPERS)
  await p.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 200)))))
  p.__errs = errs; p.__ctx = context
  return p
}
const R = (p, sel) => p.evaluate((sel) => { const e = document.querySelector(sel); if (!e) return null; const r = e.getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top, b: r.bottom, w: r.width, h: r.height } }, sel)
const overflowX = (p) => p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)
const TEMAS = [['', 'defecto'], ['&tema=terracota', 'terracota'], ['&tema=anil', 'añil'], ['&tema=palida', 'pálida'], ['&theme=stripe', 'stripe'], ['&theme=amazon', 'amazon'], ['&theme=linear', 'linear'], ['&theme=notion', 'notion']]

for (const eng of ENGINES) {
  const b = await pw[eng].launch()
  const O = async (qs, opts) => { const p = await open(b, qs, opts); p.__eng = eng; return p }
  const close = async (p, label) => { ok(p.__errs.length === 0, `${eng} consola limpia (${label})`, p.__errs.slice(0, 2).join(' | ')); await p.__ctx.close() }
  const E = (m) => `${eng} ${m}`

  /* ---------- 1 · La frase: reflujo y huecos ---------- */
  for (const dir of ['ltr', 'rtl']) {
    for (const [vw, vh] of [[1100, 800], [390, 844], [320, 640], [320, 256]]) {
      const p = await O(`?invalid=1${dir === 'rtl' ? '&dir=rtl' : ''}`, { vw, vh })
      const L = `frase ${dir} ${vw}×${vh}`
      ok(!(await overflowX(p)), E(`${L}: sin desplazamiento horizontal (refluye como texto)`))
      const s = await p.evaluate(() => {
        const g = (k) => document.querySelector(`[data-slot="${k}"]`)
        const st = (el, pse) => getComputedStyle(el, pse)
        const empty = g('from'), full = g('nights')
        return {
          emptyStyle: st(empty).borderBottomStyle, emptyAfter: st(empty, '::after').scale, invalidColor: __c.rgba(st(empty).borderBottomColor).join(), danger: __c.rgba(st(empty).getPropertyValue('--g-color-danger-text')).join(),
          fullStyle: st(full, '::after').borderBottomStyle, fullScale: st(full, '::after').scale, fullDur: st(full, '::after').transitionDuration,
          ink: __c.ratio(__c.rgba(st(full, '::after').borderBottomColor), __c.bgOf(full)), dash: __c.ratio(__c.rgba(st(full).borderBottomColor), __c.bgOf(full)),
          vals: [...document.querySelectorAll('.g-booking-bar__slot-value')].map((v) => __c.text(v)), text: __c.text(document.querySelector('.g-booking-bar__phrase')),
          roots: [...document.querySelectorAll('.g-datepicker--trigger, .g-party-field--trigger')].map((r) => st(r).display),
          msg: __c.text(document.querySelector('.g-booking-bar__messages li'))
        }
      })
      ok(s.emptyStyle === 'dashed' && (s.emptyAfter === '1' || s.emptyAfter === '1 1') && s.invalidColor === s.danger, E(`${L}: hueco vacío con error: continuo en danger-text`), JSON.stringify([s.emptyStyle, s.emptyAfter]))
      ok(s.fullStyle === 'solid' && /^1( 1)?$/.test(s.fullScale) && /0\.24s/.test(s.fullDur), E(`${L}: hueco lleno: la tinta continua cubre el discontinuo (slow)`), JSON.stringify([s.fullStyle, s.fullScale, s.fullDur]))
      ok(s.ink >= 3 && s.dash >= 3, E(`${L}: subrayados ≥ 3:1`), `${s.ink.toFixed(2)} ${s.dash.toFixed(2)}`)
      ok(s.vals.every((c) => c >= 4.5) && s.text >= 4.5 && s.msg >= 4.5, E(`${L}: valores, frase y mensaje ≥ 4.5:1`), s.vals.map((c) => c.toFixed(2)).join('/'))
      ok(s.roots.every((d) => d === 'contents'), E(`${L}: raíces de GDatePicker y GPartyField sin caja en la frase`), s.roots.join())
      await close(p, L)
    }
  }
  {
    const p = await O('', { vw: 1100, vh: 800 })
    const empty = await p.evaluate(() => { const e = document.querySelector('[data-slot="from"]'); return [getComputedStyle(e).borderBottomStyle, getComputedStyle(e, '::after').scale] })
    ok(empty[0] === 'dashed' && /^0/.test(empty[1]), E('frase: hueco vacío sin error = solo discontinuo (forma, no color)'), empty.join())
    // Panel de noches: dentro del visor y con su letra (no la de title)
    await p.evaluate(() => __bk.openNights())
    await p.waitForTimeout(250)
    const pn = await p.evaluate(() => { const e = document.getElementById('bk-nights-panel'); const r = e.getBoundingClientRect(); return { fs: getComputedStyle(e).fontSize, ok: r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight, ls: getComputedStyle(e).letterSpacing } })
    ok(pn.fs === '16px' && pn.ok, E('panel de noches: dentro del visor y con letra body'), JSON.stringify(pn))
    await p.keyboard.press('Escape')
    await p.click('#slot-party'); await p.waitForTimeout(250)
    const pp = await p.evaluate(() => { const e = document.querySelector('.g-party-field__panel'); const r = e.getBoundingClientRect(); const rows = [...e.querySelectorAll('.g-party-field__rows > *')].map((x) => x.getBoundingClientRect().width); return { fs: getComputedStyle(e).fontSize, ok: r.left >= 0 && r.right <= innerWidth && r.bottom <= innerHeight, full: rows.every((w) => Math.abs(w - rows[0]) < 1), border: __c.ratio(__c.rgba(getComputedStyle(e).borderTopColor), __c.bgOf(e)) } })
    ok(pp.fs === '16px' && pp.ok && pp.full, E('panel del grupo: dentro del visor, letra body, contadores a todo el ancho'), JSON.stringify(pp))
    await p.click('#slot-from'); await p.waitForTimeout(300)
    const dp = await p.evaluate(() => { const e = document.querySelector('.g-datepicker__pop:popover-open'); return e ? getComputedStyle(e).fontSize : null })
    ok(dp === '16px', E('calendario abierto desde la frase: letra body, no la de title'), dp)
    await close(p, 'paneles')
    const r = await O('', { reducedMotion: 'reduce' })
    const rd = await r.evaluate(() => getComputedStyle(document.querySelector('[data-slot="nights"]'), '::after').transitionDuration)
    ok(/^0s/.test(rd), E('reducido: la tinta aparece sin dibujarse'), rd)
    await close(r, 'reducido')
  }
  /* Diana de 44px con puntero grueso sin pisar la línea de al lado */
  {
    const p = await O('?filled=1', { vw: 320, vh: 700, hasTouch: true, isMobile: eng !== 'firefox' })
    const coarse = await p.evaluate(() => matchMedia('(pointer: coarse)').matches)
    if (coarse) {
      const t = await p.evaluate(() => {
        const lh = parseFloat(getComputedStyle(document.querySelector('.g-booking-bar__phrase')).lineHeight)
        return { lh, hits: [...document.querySelectorAll('.g-booking-bar__phrase .g-booking-bar__slot')].map((s) => { const r = s.getBoundingClientRect(); const x = r.left + Math.min(12, r.width / 2); const cy = r.top + r.height / 2; return [cy - 21, cy + 21].every((y) => { const e = document.elementFromPoint(x, y); return e && s.contains(e) }) && (r.height <= lh + 0.5 || r.height > lh * 1.5) }) }
      })
      ok(t.lh >= 44 && t.hits.every(Boolean), E('puntero grueso: diana de 44px en cada hueco con el interlineado ≥ 44px'), JSON.stringify(t))
    } else note(`${eng}: sin emulación de puntero grueso; dianas medidas en Chromium y WebKit`)
    await close(p, 'grueso')
  }

  /* ---------- 2 · La barra, el compacto y el campo de grupo ---------- */
  for (const dir of ['ltr', 'rtl']) {
    {
      const p = await O(`?a=bar${dir === 'rtl' ? '&dir=rtl' : ''}`, { vw: 1100, vh: 800 })
      const L = `barra ${dir} 1100`
      const g = await p.evaluate(() => {
        const row = document.querySelector('.g-booking-bar__row'); const sub = row.querySelector('.g-booking-bar__submit').getBoundingClientRect()
        const box = document.querySelector('.g-party-field__trigger').getBoundingClientRect(); const dpf = document.querySelector('.g-datepicker__field').getBoundingClientRect()
        return { one: row.scrollWidth <= row.clientWidth + 1, subT: sub.top, boxT: box.top, dpT: dpf.top, boxH: box.height, dpH: dpf.height, digest: getComputedStyle(document.querySelector('.g-booking-bar__digest')).position, dc: __c.text(document.querySelector('.g-booking-bar__digest')) }
      })
      ok(g.one, E(`${L}: una fila, sin partirse`))
      ok(Math.abs(g.subT - g.boxT) < 1 && Math.abs(g.boxT - g.dpT) < 1 && Math.abs(g.boxH - g.dpH) < 1, E(`${L}: acción y cajas alineadas (mismo borde y alto que GDatePicker)`), JSON.stringify(g))
      ok(g.digest !== 'absolute' && g.dc >= 4.5, E(`${L}: el resumen se ve en la fila (≥ 4.5:1)`))
      await close(p, L)
    }
    for (const [vw, vh] of [[390, 844], [320, 640], [320, 256]]) {
      const p = await O(`?a=bar${dir === 'rtl' ? '&dir=rtl' : ''}`, { vw, vh })
      const L = `barra ${dir} ${vw}×${vh}`
      await p.waitForFunction(() => __bk.compact.value === true, null, { timeout: 3000 }).catch(() => {})
      ok(!(await overflowX(p)), E(`${L}: sin desplazamiento horizontal`))
      const c = await p.evaluate(() => { const s = document.getElementById('summary'); if (!s) return null; const r = s.getBoundingClientRect(); return { h: r.height, d: getComputedStyle(document.querySelector('.g-booking-bar__digest')).position, t: __c.text(s.querySelector('.g-booking-bar__summary-text')), k: __c.text(s.querySelector('.g-booking-bar__summary-title')), ch: __c.text(s.querySelector('.g-booking-bar__summary-change')), b: __c.ratio(__c.rgba(getComputedStyle(s).borderTopColor), __c.bgOf(s.parentElement)) } })
      ok(c && c.h >= 44 && c.d === 'absolute' && c.t >= 4.5 && c.k >= 4.5 && c.ch >= 4.5 && c.b >= 3, E(`${L}: compacto: el resumen es un botón ≥ 44px, textos ≥ 4.5:1, borde ≥ 3:1; el resumen suelto, oculto accesible`), JSON.stringify(c))
      await close(p, L)
    }
  }
  {
    const p = await O('?a=bar&invalid=1', { vw: 1100, vh: 800 })
    const f = await p.evaluate(() => { const t = document.querySelector('.g-party-field__trigger'); const cs = getComputedStyle(t); return { bc: __c.rgba(cs.borderTopColor).join(), danger: __c.rgba(cs.getPropertyValue('--g-color-danger-text')).join(), sh: cs.boxShadow, msg: __c.text(document.querySelector('.g-party-field__message')), v: __c.text(t.querySelector('.g-party-field__value')), lab: __c.text(document.querySelector('.g-party-field__label')) } })
    ok(f.bc === f.danger && /inset/.test(f.sh) && f.msg >= 4.5 && f.v >= 4.5 && f.lab >= 4.5, E('campo de grupo con error: borde doble danger-text, mensaje, valor y etiqueta ≥ 4.5:1'), JSON.stringify(f).slice(0, 160))
    await p.keyboard.press('Shift')
    await p.focus('.g-party-field__trigger')
    const ring = await p.evaluate(() => { const cs = getComputedStyle(document.activeElement); return [cs.outlineStyle, cs.outlineWidth] })
    ok(ring[0] === 'solid' && parseFloat(ring[1]) >= 2, E('campo de grupo: anillo de foco'), ring.join())
    await close(p, 'grupo error')
    const d = await O('?a=bar&disabled=1', { vw: 1100, vh: 800 })
    const dd = await d.evaluate(() => getComputedStyle(document.querySelector('.g-party-field__trigger')).cursor)
    ok(dd === 'not-allowed', E('campo de grupo deshabilitado'))
    await close(d, 'grupo deshabilitado')
  }

  /* ---------- 3 · El muelle ---------- */
  for (const red of [false, true]) {
    const p = await O('?dock=1', { vw: 1100, vh: 700, ...(red ? { reducedMotion: 'reduce' } : {}) })
    const L = `muelle${red ? ' reducido' : ''}`
    const hidden = await p.evaluate(() => { const d = document.getElementById('dock'); return [getComputedStyle(d).display, d.inert] })
    ok(hidden[0] === 'none' && hidden[1] === true, E(`${L}: oculto = display none e inerte`))
    await p.evaluate(() => window.scrollTo(0, 900)); await p.waitForTimeout(500)
    const m = await p.evaluate(() => { const d = document.getElementById('dock'); const r = d.getBoundingClientRect(); const s1 = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--g-space-1')); return { shown: d.classList.contains('is-shown'), h: r.height, b: r.bottom, vh: innerHeight, w: r.width, want: Math.max(16 * s1, 44 + 4 * s1), sp: getComputedStyle(document.documentElement).scrollPaddingBlockEnd, tr: getComputedStyle(d).translate, sum: __c.text(d.querySelector('.g-booking-bar__dock-summary')), edge: __c.ratio(__c.rgba(getComputedStyle(d).borderTopColor), __c.bgOf(d)) } })
    ok(m.shown && Math.abs(m.h - m.want) < 0.5 && Math.abs(m.b - m.vh) < 0.5 && Math.abs(m.w - 1100) < 20, E(`${L}: visible, alto de contrato ${m.want}px, de borde a borde, abajo`), JSON.stringify(m))
    ok(parseFloat(m.sp) === m.want, E(`${L}: scroll-padding-block-end del documento = su alto`), m.sp)
    ok(m.sum >= 4.5, E(`${L}: resumen ≥ 4.5:1`))
    if (red) ok(m.tr === 'none' || m.tr === '0px' || m.tr === '0px 0px', E(`${L}: sin desplazamiento`), m.tr)
    else {
      const tr = await p.evaluate(() => getComputedStyle(document.getElementById('dock')).transitionDuration)
      ok(/0\.24s/.test(tr), E(`${L}: entra con --g-duration-slow`), tr)
    }
    // Un control justo bajo el borde: al enfocarlo, el documento lo deja por encima del muelle (scroll-padding)
    await p.evaluate(() => { const b = document.createElement('button'); b.id = 'mid'; b.textContent = 'Medio'; b.style.cssText = 'position:absolute;inset-inline-start:16px'; b.style.top = (scrollY + innerHeight + 10) + 'px'; document.body.appendChild(b) })
    await p.focus('#mid'); await p.waitForTimeout(300)
    const cover = await p.evaluate(() => { const l = document.getElementById('mid').getBoundingClientRect(); const d = document.getElementById('dock').getBoundingClientRect(); return { lb: l.bottom, dt: d.top } })
    ok(cover.lb <= cover.dt + 0.5, E(`${L}: un control enfocado bajo el borde queda por encima del muelle (2.4.11)`), JSON.stringify(cover))
    await p.focus('#last'); await p.waitForTimeout(300)
    const end = await p.evaluate(() => { const l = document.getElementById('last').getBoundingClientRect(); const d = document.getElementById('dock').getBoundingClientRect(); return l.bottom <= d.top + 0.5 })
    ok(end, E(`${L}: el último botón de una página sin sitio al final es alcanzable (cola :root::after, #757)`))
    await close(p, L)
  }

  /* ---------- 4 · Día «solo salida» ---------- */
  {
    const p = await O('', { vw: 1100, vh: 800 })
    const d = await p.evaluate(() => { const g = (id) => getComputedStyle(document.getElementById(id)); return { out: [g('day-out').textDecorationLine, g('day-out').textDecorationStyle], off: g('day-off').textDecorationLine, c: __c.text(document.getElementById('day-out')) } })
    ok(d.out[0] === 'underline' && d.out[1] === 'dotted' && d.off === 'line-through' && d.c >= 4.5, E('día «solo salida»: subrayado punteado (no tachado) y ≥ 4.5:1'), JSON.stringify(d))
    await close(p, 'días')
  }

  /* ---------- 5 · Contraste en temas, claro y oscuro ---------- */
  for (const [t, tn] of TEMAS) {
    for (const dark of [false, true]) {
      const p = await O(`?invalid=1${t}${dark ? '&dark=1' : ''}`, { vw: 1100, vh: 800 })
      const L = `${tn} ${dark ? 'oscuro' : 'claro'}`
      const c = await p.evaluate(() => {
        const out = {}
        out.phrase = __c.text(document.querySelector('.g-booking-bar__phrase'))
        out.vals = Math.min(...[...document.querySelectorAll('.g-booking-bar__slot-value')].map((v) => __c.text(v)))
        const s = document.querySelector('[data-slot="nights"]')
        out.ink = __c.ratio(__c.rgba(getComputedStyle(s, '::after').borderBottomColor), __c.bgOf(s))
        out.dash = __c.ratio(__c.rgba(getComputedStyle(s).borderBottomColor), __c.bgOf(s))
        const e = document.querySelector('[data-slot="from"]')
        out.err = __c.ratio(__c.rgba(getComputedStyle(e).borderBottomColor), __c.bgOf(e))
        out.msg = __c.text(document.querySelector('.g-booking-bar__messages li'))
        out.title = __c.text(document.querySelector('.g-booking-bar__title'))
        return out
      })
      ok(c.phrase >= 4.5 && c.vals >= 4.5 && c.msg >= 4.5 && c.title >= 4.5, E(`${L}: frase, valores, título y mensaje ≥ 4.5:1`), JSON.stringify(c))
      ok(c.ink >= 3 && c.dash >= 3 && c.err >= 3, E(`${L}: subrayados (lleno, vacío, error) ≥ 3:1`), JSON.stringify(c))
      await close(p, L)
      const q = await O(`?a=bar&invalid=1${t}${dark ? '&dark=1' : ''}`, { vw: 1100, vh: 800 })
      const bc = await q.evaluate(() => { const t = document.querySelector('.g-party-field__trigger'); return { b: __c.ratio(__c.rgba(getComputedStyle(t).borderTopColor), __c.bgOf(t.parentElement)), v: __c.text(t.querySelector('.g-party-field__value')) } })
      ok(bc.b >= 3 && bc.v >= 4.5, E(`${L}: caja del grupo ≥ 3:1 y valor ≥ 4.5:1`), JSON.stringify(bc))
      await close(q, L + ' barra')
    }
  }
  if (eng === 'chromium') {
    const p = await O('', { forcedColors: 'active' })
    const f = await p.evaluate(() => { const s = document.querySelector('[data-slot="from"]'); return [getComputedStyle(s).borderBottomStyle, getComputedStyle(s).borderBottomColor, getComputedStyle(document.querySelector('[data-slot="nights"]'), '::after').borderBottomStyle] })
    ok(f[0] === 'dashed' && f[2] === 'solid' && !/rgba\(0, 0, 0, 0\)/.test(f[1]), E('forced-colors: vacío y lleno siguen distinguiéndose por forma'), f.join(' '))
    await close(p, 'forzados')
  }
  await b.close()
}
server.close()
console.log(`\nGBookingBar + GPartyField · estilo: ${total - failed}/${total}`)
if (notes.length) console.log('Notas:\n  ' + [...new Set(notes)].join('\n  '))
if (fails.length) { console.log('Fallos:\n  ' + fails.join('\n  ')); process.exitCode = 1 }
