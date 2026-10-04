// Auditoría de coco (paso 5) de la isla de estado sobre el COMPONENTE REAL: el playground (packages/vue/playground,
// sección #sec-status) con dist/grana.umd.js + dist/status.umd.js (global GranaStatus) + dist/grana.css, como se publica.
// Repite la batería del banco (estilo-verificar.mjs) sobre el marcado que ponen GStatusIsland.vue, StatusList.vue y
// GStatusMark.vue, y añade lo que solo existe con el componente real: marcado frente al que espera el CSS; tamaño de la
// forma = borderBoxSize de __inner redondeado hacia arriba + borde; contraste con hover y foco REALES (no con alias);
// toque por un suceso del gestor; resolver en el sitio (error → reintentando → éxito) con continuidad de la forma;
// cascada del panel con los retardos reales; Δ0 de la página y del foco al aparecer, abrirse y resolverse; convivencia
// con GToaster, la pill y el panel de voz (borde compartido, capa, solape) y con el GDialog modal (traslado y vuelta);
// que la isla replegada no tape los controles del playground; zoom 200 % y 400 % aproximados; reglas g-status-* de
// dist/grana.css sin literales ni respaldos.
// Temas: defecto claro y oscuro, «Tema de prueba» (botón del playground) claro y oscuro, uno generado con brand de color
// (spotify, design/lab/tema-oscuro/dark-color-presence/generated/) claro y oscuro, y el de la auditoría
// (auditoria-tema.css, @grana/cli: brand #6B2FA3, radius 4, shape rounded, space 3, fontSize 19) claro y oscuro.
// Ejecutar desde la raíz (tras `npm run build`): node design/lab/alert/auditoria-verificar.mjs
// Opcional: --engines=chromium,firefox,webkit   --verbose   GRANA_PW_PORT (coco: 4209)
import http from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const pw = await import(new URL('../theme-playground/node_modules/playwright/index.mjs', import.meta.url))
const ROOT = fileURLToPath(new URL('../../../', import.meta.url))
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')).map(([k, v]) => [k, v ?? true]))
const ENGINES = (args.engines || 'chromium,firefox,webkit').split(',')
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const server = http.createServer(async (req, res) => {
  try {
    const p = normalize(join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname)))
    if (!p.startsWith(ROOT)) throw new Error('fuera')
    const body = await readFile(p)
    res.writeHead(200, { 'content-type': MIME[extname(p)] || 'application/octet-stream' }).end(body)
  } catch { res.writeHead(404).end() }
})
await new Promise((r) => server.listen(Number(process.env.GRANA_PW_PORT || 4209), '127.0.0.1', r))
const PLAY = `http://127.0.0.1:${server.address().port}/packages/vue/playground/index.html`

let total = 0, failed = 0
const fails = [], info = []
let ENGINE = 'static'
const ok = (cond, msg) => { total++; if (!cond) { failed++; fails.push(`[${ENGINE}] ${msg}`) } if (args.verbose) console.log(cond ? 'ok ' : 'NO ', ENGINE, msg) }
const note = (m) => info.push(`[${ENGINE}] ${m}`)
// Defectos que no son del componente (p. ej. del playground, de bruno): se informan aparte y no cuentan en el total
const pend = []
const pending = (cond, msg) => { if (!cond) pend.push(`[${ENGINE}] ${msg}`) }

/* ---------- 0 · dist/grana.css: reglas g-status-* sin literales ni respaldos ---------- */
{
  const css = (await readFile(join(ROOT, 'packages/vue/dist/grana.css'), 'utf8')).replace(/\/\*[\s\S]*?\*\//g, '')
  // Recorrido por llaves: cada declaración con la pila de selectores/at-rules que la contienen
  const decls = []
  const stack = []
  let buf = ''
  for (const ch of css) {
    if (ch === '{') { stack.push(buf.trim()); buf = '' }
    else if (ch === '}') { if (buf.trim()) decls.push({ ctx: [...stack], text: buf.trim() }); stack.pop(); buf = '' }
    else if (ch === ';') { decls.push({ ctx: [...stack], text: buf.trim() }); buf = '' }
    else buf += ch
  }
  const mine = decls.filter((d) => d.ctx.some((c) => /g-status-(island|item|mark|sheet|nudge|spin|mark-spin)/.test(c)))
  ok(mine.length > 150, `dist: declaraciones g-status-* encontradas (${mine.length})`)
  const vals = mine.map((d) => d.text)
  const colorLit = vals.filter((v) => /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|lab|lch)\(/.test(v))
  ok(!colorLit.length, `dist: color literal en g-status-* (${colorLit.slice(0, 3)})`)
  const fb = vals.filter((v) => /var\(\s*--[\w-]+\s*,/.test(v))
  ok(!fb.length, `dist: var() con respaldo en g-status-* (${fb.slice(0, 3)})`)
  const foreign = [...new Set(vals.flatMap((v) => [...v.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1])).filter((v) => !/^--(g|_)/.test(v)))]
  ok(!foreign.length, `dist: var() que no es --g-* ni --_* (${foreign})`)
  const imp = vals.filter((v) => /!important/.test(v))
  ok(!imp.length, `dist: !important en g-status-* (${imp.slice(0, 3)})`)
  const lens = [...new Set(vals.flatMap((v) => [...v.replace(/clip-path:[^;]+/, '').matchAll(/(?<![\w.-])(-?\d*\.?\d+)(px|rem|em|vw|vh|ms|s)\b/g)].map((m) => m[0])))]
  ok(lens.every((l) => ['24px', '44px', '0px', '1px', '-1px', '0s'].includes(l)), `dist: medidas o duraciones literales en g-status-* (${lens.filter((l) => !['24px', '44px', '0px', '1px', '-1px', '0s'].includes(l))})`)
  const kws = [...new Set(vals.flatMap((v) => [...v.matchAll(/\b(CanvasText|Highlight|Canvas|ButtonText|LinkText)\b/g)].map((m) => m[1])))]
  ok(mine.filter((d) => /\b(CanvasText|Highlight)\b/.test(d.text)).every((d) => d.ctx.some((c) => /forced-colors/.test(c))), `dist: colores del sistema (${kws}) solo dentro de forced-colors`)
  const brand = vals.filter((v) => /--g-color-(?:on-)?brand/.test(v))
  ok(!brand.length, 'dist: g-status-* no lee brand (#325)')
  const anim = mine.filter((d) => /^animation\s*:/.test(d.text))
  ok(anim.every((d) => d.ctx.some((c) => /prefers-reduced-motion:\s*no-preference/.test(c))), 'dist: toda animation de g-status-* dentro de reduced-motion: no-preference')
  // Orden: la isla va después de GBtn y GDialog (reasigna sus alias)
  const at = (k) => css.indexOf(k)
  ok(at('.g-status-island{') > css.lastIndexOf('.g-btn--variant-outline') && at('.g-status-island{') > css.lastIndexOf('.g-dialog{'), 'dist: GStatusIsland.css va después de GBtn.css y GDialog.css')
  for (const g of ['g-status-island__shape', 'g-status-item--type-error', 'g-status-mark--link', 'g-status-sheet', 'g-status-nudge']) ok(css.includes(g), `dist: contiene ${g}`)
}

/* ---------- En la página ---------- */
const lum = ([r, g, b]) => { const f = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) }
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05) }
const PAGE_HELPERS = () => {
  const cv = document.createElement('canvas'); cv.width = cv.height = 1
  const x = cv.getContext('2d', { willReadFrequently: true })
  window.__mix = (layers) => {
    x.globalCompositeOperation = 'source-over'; x.fillStyle = '#ffffff'; x.fillRect(0, 0, 1, 1)
    for (const c of layers) { if (!c || !CSS.supports('color', c)) throw new Error('color ' + c); x.fillStyle = c; x.fillRect(0, 0, 1, 1) }
    const d = x.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2]]
  }
  window.__alpha = (c) => { x.clearRect(0, 0, 1, 1); x.fillStyle = c; x.fillRect(0, 0, 1, 1); return x.getImageData(0, 0, 1, 1).data[3] }
  window.__stack = (el) => {
    const stack = []
    for (let e = el; e; e = e.parentElement) {
      const c = getComputedStyle(e).backgroundColor
      const a = window.__alpha(c)
      if (a > 0) { stack.unshift(c); if (a === 255) return stack }
    }
    stack.unshift(getComputedStyle(document.documentElement).backgroundColor, getComputedStyle(document.body).backgroundColor)
    return stack
  }
  window.__bg = (el) => window.__mix(window.__stack(el))
  window.__fg = (el, prop = 'color', under = el) => window.__mix([...window.__stack(under), getComputedStyle(el)[prop]])
  window.__tok = (n) => window.__mix([getComputedStyle(document.documentElement).getPropertyValue(n).trim()])
  window.__R = (s) => { const e = typeof s === 'string' ? document.querySelector(s) : s; const r = e.getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top, b: r.bottom, w: r.width, h: r.height } }
}
// Cuatro condiciones, una por tipo, con todo lo que la isla puede pintar
const FOUR = () => {
  const s = window.gStatus
  s.clear()
  const L = (label) => ({ label, href: '#sec-status', onClick: (e) => e.preventDefault() })
  s.success('a-success', 'Factura F-0043 creada', { description: 'Ya está en la lista.', link: L('Ver factura'), action: { label: 'Deshacer', onClick: () => {} } })
  s.info('a-info', 'Mantenimiento esta noche', { description: 'De 23:00 a 23:30.', link: L('Más información'), dismissible: true, action: { label: 'Recordar', onClick: () => {} } })
  s.warning('a-warning', 'La sesión está por caducar', { description: 'Guarda tu trabajo.', deadline: Date.now() + 299000, link: L('Ver sesión'), action: { label: 'Seguir conectado', onClick: () => {} }, origin: { label: 'Ir al formulario', target: 'st-form' } })
  s.error('a-error', 'No se pudo guardar la factura', { description: 'El servidor no respondió.', details: 'POST /api/facturas · 500 Internal Server Error · req-2c41d7', action: { label: 'Reintentar', onClick: () => {} }, origin: { label: 'Ir al formulario', target: 'st-form' }, dismissible: true, link: L('Ver estado') })
}
// Marcas de los cuatro tipos (enlace con for y texto con type) en una aplicación aparte con el mismo gestor
const MARKS = () => {
  if (document.getElementById('aud-marks')) return
  const host = document.createElement('div')
  document.querySelector('#sec-status .pg-panel').prepend(host)
  Vue.createApp({
    setup: () => ({ types: ['error', 'warning', 'info', 'success'] }),
    template: `<div id="aud-marks" style="display:grid;gap:12px;padding-block:12px"><div v-for="t in types" :key="t" style="display:flex;flex-wrap:wrap;gap:12px;align-items:center"><g-status-mark :for="'a-' + t" :data-test="'ml-' + t"></g-status-mark><g-status-mark :type="t" type-label="Aviso" :data-test="'mt-' + t">Marca de texto de tipo {{ t }}.</g-status-mark></div></div>`
  }).use(Grana).use(window.gStatus).mount(host)
}

const THEMES = [
  ['defecto', null, false], ['defecto', null, true],
  ['prueba', 'test', false], ['prueba', 'test', true],
  ['spotify', 'design/lab/tema-oscuro/dark-color-presence/generated/spotify.css', false], ['spotify', 'design/lab/tema-oscuro/dark-color-presence/generated/spotify.css', true],
  ['auditoría', 'design/lab/alert/auditoria-tema.css', false], ['auditoría', 'design/lab/alert/auditoria-tema.css', true]
]
const themeCss = {}
for (const [, f] of THEMES) if (f && f !== 'test' && !themeCss[f]) themeCss[f] = await readFile(join(ROOT, f), 'utf8')

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
for (const engine of ENGINES) {
  ENGINE = engine
  const b = await pw[engine].launch()
  const errs = []
  const open = async ({ seed = false, width = 1280, height = 900, motion = 'no-preference', theme = null, dark = false, rtl = false, ctx = {}, query = '' } = {}) => {
    const context = await b.newContext({ viewport: { width, height }, reducedMotion: motion, colorScheme: 'light', ...ctx })
    const p = await context.newPage()
    p.on('console', (m) => {
      const t = m.text()
      if (/Failed to load resource|404|development build of Vue|ResizeObserver loop/.test(t)) return
      if (m.type() === 'error' || (m.type() === 'warning' && /\[Vue warn\]|\[Grana/.test(t))) errs.push(`${m.type()}: ${t.slice(0, 200)}`)
    })
    p.on('pageerror', (e) => { if (!/ResizeObserver loop/.test(String(e))) errs.push(`pageerror: ${e}`) })
    await p.addInitScript(([d, th]) => { try { localStorage.setItem('grana-playground', JSON.stringify({ scheme: d ? 'dark' : 'light', themed: th === 'test' })) } catch {} }, [dark, theme])
    await p.goto(`${PLAY}?status=${seed ? 'seed' : 'none'}${query}`)
    await p.waitForFunction(() => window.gStatus && window.__st && document.querySelector('.g-status-island.is-ready'))
    await p.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' })
    if (theme && theme !== 'test') await p.addStyleTag({ content: themeCss[theme] })
    if (rtl) await p.evaluate(() => { document.documentElement.dir = 'rtl' })
    await p.evaluate(() => Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 2500))]))
    await p.evaluate(PAGE_HELPERS)
    await p.waitForTimeout(250)
    return p
  }
  const settle = (p, ms = 450) => p.waitForTimeout(ms)
  // Foco de teclado: Firefox pierde la modalidad de teclado con el foco por programa tras usar el ratón; se llega al
  // control con Tab y Mayús+Tab desde él (comprobado aparte: con Tab real el anillo aparece en todos los temas)
  const kbFocus = async (p, sel) => {
    await p.evaluate((s) => document.querySelector(s).focus(), sel)
    if (engine === 'firefox') {
      await p.keyboard.press('Tab'); await p.keyboard.press('Shift+Tab')
      if (!(await p.evaluate((s) => document.activeElement === document.querySelector(s), sel))) await p.evaluate((s) => document.querySelector(s).focus(), sel)
    }
    await settle(p, 200)
  }
  const form = (p) => p.evaluate(() => document.querySelector('.g-status-island').dataset.form)

  /* 1 · Marcado real frente al que espera el CSS */
  {
    const p = await open({ seed: true })
    await p.evaluate(MARKS)
    await p.evaluate(FOUR); await settle(p)
    await p.evaluate(() => window.gStatus.open()); await settle(p)
    const m = await p.evaluate(() => {
      const root = document.querySelector('.g-status-island')
      const sh = root.querySelector(':scope > section.g-status-island__shape')
      const inner = sh && sh.querySelector(':scope > .g-status-island__inner')
      const sum = inner && inner.querySelector(':scope > button.g-status-island__summary')
      const badge = sum && sum.querySelector(':scope > .g-status-island__badge')
      const panel = inner && inner.querySelector(':scope > .g-status-island__panel')
      const lis = [...root.querySelectorAll('.g-status-island__list > li.g-status-item')]
      const err = lis.find((li) => li.dataset.type === 'error')
      const btn = (sel) => { const e = err.querySelector(sel); return e ? [...e.classList].filter((c) => /^g-btn--(variant|size|color)|^g-btn--icon$/.test(c)).sort().join(' ') : null }
      const lives = [...root.querySelectorAll(':scope > .g-status-island__live')]
      const ml = document.querySelector('[data-test="ml-error"]'); const mt = document.querySelector('[data-test="mt-warning"]')
      return {
        popover: root.getAttribute('popover'), popOpen: root.matches(':popover-open'), align: root.dataset.align, pos: root.dataset.position, form: root.dataset.form, type: root.dataset.type,
        rootDisplay: root.style.display, classes: [...root.classList].join(' '), lives: lives.map((l) => l.getAttribute('role')), livesOutside: lives.every((l) => !sh.contains(l)),
        shape: !!sh, w: sh && sh.style.getPropertyValue('--_island-w'), h: sh && sh.style.getPropertyValue('--_island-h'), label: sh && sh.getAttribute('aria-label'),
        summary: !!sum, badgeIcon: badge && badge.firstElementChild && badge.firstElementChild.classList.contains('g-icon'), badgeType: badge && badge.dataset.type,
        text: !!(sum && sum.querySelector(':scope > .g-status-island__text > .g-status-island__sr')), more: !!(sum && sum.querySelector(':scope > .g-status-island__more')),
        panel: !!panel, list: !!(panel && panel.querySelector(':scope > ul.g-status-island__list')), foot: !!(panel && panel.querySelector(':scope > .g-status-island__foot > .g-status-island__ack')),
        liClasses: lis.map((li) => li.className), liTypes: lis.map((li) => li.dataset.type).join(),
        liBadge: lis.every((li) => { const bd = li.querySelector(':scope > .g-status-item__badge'); return bd && bd.firstElementChild.classList.contains('g-icon') && bd.dataset.type === li.dataset.type }),
        content: lis.every((li) => li.querySelector(':scope > .g-status-item__content > p.g-status-item__title > .g-status-item__type')),
        order: [...err.children].map((c) => c.className.split(' ').find((k) => k.startsWith('g-status-item__'))).join(),
        emptyActions: lis.filter((li) => { const a = li.querySelector(':scope > .g-status-item__actions'); return a && !a.children.length }).length,
        action: btn('.g-status-item__action'), origin: btn('.g-status-item__origin'), toggle: btn('.g-status-item__details-toggle'), dismiss: btn('.g-status-item__dismiss'), ack: [...root.querySelector('.g-status-island__ack').classList].filter((c) => /^g-btn--(variant|size|color)/.test(c)).sort().join(' '),
        details: (() => { const d = err.querySelector(':scope > .g-status-item__content > .g-status-item__details'); return d && d.hidden && d.querySelector(':scope > pre.g-status-item__details-text[dir="ltr"]') && d.querySelector(':scope > .g-status-item__copy') ? true : false })(),
        timer: (() => { const t = lis.find((li) => li.dataset.type === 'warning').querySelector('.g-status-item__timer'); return t && t.getAttribute('role') === 'timer' && t.getAttribute('aria-live') === 'off' })(),
        ml: ml && ml.tagName + ' ' + ml.className + ' | ' + [...ml.children].map((c) => c.className).join(' + ') + ' | ' + !!ml.querySelector('.g-status-mark__text > .g-status-mark__type'),
        mt: mt && mt.tagName + ' ' + mt.className + ' | ' + [...mt.children].map((c) => c.tagName + '.' + c.className).join(' + ')
      }
    })
    ok(m.popover === 'manual' && m.popOpen && m.align === 'center' && m.pos === 'top-center' && m.form === 'open' && m.type === 'error', `raíz: popover manual abierto, data-align/position/form/type (${m.popover} ${m.popOpen} ${m.align} ${m.form} ${m.type})`)
    ok(!m.rootDisplay && /g-status-island--position-top-center/.test(m.classes) && /is-ready/.test(m.classes), `raíz: sin display en línea y con sus clases (${m.classes})`)
    ok(m.lives.join() === 'status,alert' && m.livesOutside, `canales: status + alert fuera de la section (${m.lives})`)
    ok(m.shape && /^\d+px$/.test(m.w) && /^\d+px$/.test(m.h) && /Alt\+F8/.test(m.label), `__shape: section con --_island-w/h enteros en px y nombre (${m.w} × ${m.h}, «${m.label}»)`)
    ok(m.summary && m.badgeIcon && m.badgeType === 'error' && m.text && m.more, 'resumen: insignia con .g-icon hijo directo y data-type, __text con __sr, «+N»')
    ok(m.panel && m.list && m.foot, 'panel: __list y __foot > __ack')
    ok(m.liTypes === 'error,warning,info,success' && m.liBadge && m.content, `avisos: orden por gravedad, insignia y título con prefijo (${m.liTypes})`)
    ok(m.liClasses[0].includes('g-status-item--type-error') && m.liClasses[0].includes('has-action') && m.liClasses[0].includes('has-details') && m.liClasses[0].includes('is-dismissible'), `avisos: clases de estado (${m.liClasses[0]})`)
    ok(m.order === 'g-status-item__badge,g-status-item__content,g-status-item__actions,g-status-item__dismiss', `aviso: orden insignia, contenido, acciones, descartar (${m.order})`)
    ok(m.emptyActions === 0, `aviso: sin __actions vacío (${m.emptyActions})`)
    ok(m.action === 'g-btn--color-neutral g-btn--size-sm g-btn--variant-outline' && m.ack === m.action, `botones: acción y «Entendido» outline + neutral + sm (${m.action} / ${m.ack})`)
    ok(m.origin === 'g-btn--color-neutral g-btn--size-sm g-btn--variant-ghost' && m.toggle === m.origin, `botones: «Ir a…» y detalle ghost + neutral + sm (${m.origin} / ${m.toggle})`)
    ok(/g-btn--icon/.test(m.dismiss) && /variant-ghost/.test(m.dismiss) && /size-sm/.test(m.dismiss), `botones: descartar icon + ghost + sm (${m.dismiss})`)
    ok(m.details && m.timer, 'detalle técnico (pre dir=ltr + Copiar, hidden) y temporizador role=timer aria-live=off')
    // Indicador del detalle: chevron en __append; 0° cerrado, 180° abierto, girando con duration-fast + ease-out
    const chev = async () => p.evaluate(() => { const t = document.querySelector('.g-status-item--type-error .g-status-item__details-toggle'); const c = t.querySelector('.g-btn__append .g-status-item__details-chevron'); if (!c) return null; const rot = getComputedStyle(c).rotate; return { exp: t.getAttribute('aria-expanded'), rot, tr: getComputedStyle(c).transitionProperty + ' ' + getComputedStyle(c).transitionDuration } })
    const c0 = await chev()
    await p.click('.g-status-item--type-error .g-status-item__details-toggle'); await settle(p, 300)
    const c1 = await chev()
    await p.click('.g-status-item--type-error .g-status-item__details-toggle'); await settle(p, 300)
    const c2 = await chev()
    const deg = (r) => (!r || r === 'none' ? 0 : /turn/.test(r) ? parseFloat(r) * 360 : parseFloat(r))
    ok(c0 && c0.exp === 'false' && deg(c0.rot) === 0 && c1.exp === 'true' && deg(c1.rot) === 180 && deg(c2.rot) === 0, `chevron del detalle: ${c0 && c0.rot} cerrado → ${c1 && c1.rot} abierto → ${c2 && c2.rot}`)
    ok(c0 && /rotate/.test(c0.tr) && /0\.12s/.test(c0.tr), `chevron del detalle: transición de rotate en duration-fast (${c0 && c0.tr})`)
    ok(/^BUTTON g-status-mark g-status-mark--link g-status-mark--type-error/.test(m.ml) && /g-status-mark__badge \+ g-status-mark__text \| true$/.test(m.ml), `marca enlace: ${m.ml}`)
    ok(/^DIV g-status-mark g-status-mark--text g-status-mark--type-warning \| SPAN\.g-status-mark__badge \+ P\.g-status-mark__text$/.test(m.mt), `marca de texto: ${m.mt}`)
    // La forma mide __inner (borderBoxSize, redondeado hacia arriba) + el borde
    const fit = await p.evaluate(() => {
      const sh = document.querySelector('.g-status-island__shape'); const inner = sh.querySelector('.g-status-island__inner')
      const s = sh.getBoundingClientRect(); const i = inner.getBoundingClientRect(); const bw = parseFloat(getComputedStyle(sh).borderTopWidth)
      return { dw: s.width - i.width - 2 * bw, dh: s.height - i.height - 2 * bw }
    })
    ok(fit.dw >= -0.01 && fit.dw < 1.01 && fit.dh >= -0.01 && fit.dh < 1.01, `forma = __inner redondeado hacia arriba + borde (sobra ${fit.dw.toFixed(2)} × ${fit.dh.toFixed(2)} px; nunca recorta)`)
    await p.context().close()
  }

  /* 2 · Contraste de los cuatro tipos, con hover y foco reales, en los ocho temas */
  const rows = []
  for (const [name, theme, dark] of THEMES) {
    const p = await open({ theme, dark })
    const label = `${name} ${dark ? 'oscuro' : 'claro'}`
    await p.evaluate(MARKS)
    await p.evaluate(FOUR); await settle(p)
    await p.evaluate(() => window.gStatus.open()); await settle(p)
    await p.click('.g-status-item--type-error .g-status-item__details-toggle'); await settle(p, 250)
    await p.mouse.move(0, 899)
    const data = await p.evaluate(() => {
      const out = []
      const add = (t, part, fg, bg, min) => out.push({ t, part, fg, bg, min })
      const root = document.querySelector('.g-status-island'); const sh = root.querySelector('.g-status-island__shape')
      const island = window.__bg(sh)
      add('-', 'isla = --g-color-text', window.__tok('--g-color-text'), island, 'eq')
      const sum = root.querySelector('.g-status-island__summary')
      add('error', 'resumen: texto', window.__fg(root.querySelector('.g-status-island__text')), window.__bg(sum), 4.5)
      const more = root.querySelector('.g-status-island__more')
      add('-', '«+N»: texto', window.__fg(more), window.__bg(more), 4.5)
      add('-', '«+N»: contorno', window.__fg(more, 'borderTopColor', more.parentElement), window.__bg(more), 3)
      const sb = root.querySelector('.g-status-island__badge')
      add('error', 'resumen: icono / insignia', window.__fg(sb), window.__bg(sb), 3)
      add('error', 'resumen: anillo / isla', window.__fg(sb, 'borderTopColor', sh), island, 3)
      for (const li of root.querySelectorAll('.g-status-item')) {
        const t = li.dataset.type; const tile = window.__bg(li)
        for (const [sel, n] of [['.g-status-item__title', 'título'], ['.g-status-item__description', 'descripción'], ['.g-status-item__timer', 'temporizador'], ['.g-status-item__link', 'enlace']]) {
          const e = li.querySelector(sel); if (e) add(t, 'aviso: ' + n, window.__fg(e), tile, 4.5)
        }
        const ib = li.querySelector('.g-status-item__badge')
        add(t, 'aviso: icono / insignia', window.__fg(ib), window.__bg(ib), 3)
        if (t !== 'success') add(t, 'aviso: anillo / aviso', window.__fg(ib, 'borderTopColor', li), tile, 3)
        add(t, 'aviso: relleno de insignia / aviso [informativo]', window.__bg(ib), tile, 0)
        for (const [sel, n, min] of [['.g-status-item__action', 'acción', 4.5], ['.g-status-item__origin', 'Ir a…', 4.5], ['.g-status-item__details-toggle', 'detalle', 4.5], ['.g-status-item__copy', 'copiar', 4.5], ['.g-status-item__dismiss', 'descartar', 3]]) {
          const e = li.querySelector(sel); if (!e || !e.getClientRects().length) continue
          add(t, `aviso: ${n} (texto)`, window.__fg(e), window.__bg(e), min)
          if (sel === '.g-status-item__action') add(t, 'aviso: acción (borde)', window.__fg(e, 'borderTopColor', li), tile, 3)
        }
        const pre = li.querySelector('.g-status-item__details:not([hidden]) .g-status-item__details-text')
        if (pre) add(t, 'detalle técnico (texto / pozo)', window.__fg(pre), window.__bg(pre), 4.5)
      }
      const ack = root.querySelector('.g-status-island__ack')
      add('-', '«Entendido» (texto)', window.__fg(ack), window.__bg(ack), 4.5)
      add('-', '«Entendido» (borde)', window.__fg(ack, 'borderTopColor', ack.parentElement), window.__bg(ack.parentElement), 3)
      // Marcas
      for (const t of ['error', 'warning', 'info', 'success']) {
        const ml = document.querySelector(`[data-test="ml-${t}"]`)
        add(t, 'marca enlace: texto', window.__fg(ml.querySelector('.g-status-mark__text')), window.__bg(ml), 4.5)
        const mlb = ml.querySelector('.g-status-mark__badge')
        add(t, 'marca enlace: icono / insignia', window.__fg(mlb), window.__bg(mlb), 3)
        if (t !== 'success') add(t, 'marca enlace: anillo', window.__fg(mlb, 'borderTopColor', ml), window.__bg(ml), 3)
        add(t, 'marca enlace = --g-color-text', window.__tok('--g-color-text'), window.__bg(ml), 'eq')
        const mt = document.querySelector(`[data-test="mt-${t}"]`)
        add(t, 'marca de texto: texto', window.__fg(mt.querySelector('.g-status-mark__text')), window.__bg(mt), 4.5)
        const mtb = mt.querySelector('.g-status-mark__badge')
        add(t, 'marca de texto: icono', window.__fg(mtb), window.__bg(mt), 3)
        if (t !== 'success') add(t, 'marca de texto: anillo', window.__fg(mtb, 'borderTopColor', mt), window.__bg(mt), 3)
      }
      add('-', 'brand (referencia)', window.__tok('--g-color-brand'), island, 'brand')
      return out
    })
    // Hover reales (GBtn y el resumen): se mide el color pintado tras la transición
    const hov = []
    const hoverPairs = [
      ['.g-status-item--type-error .g-status-item__action', 'acción al pasar', 4.5], ['.g-status-item--type-error .g-status-item__origin', 'Ir a… al pasar', 4.5],
      ['.g-status-item--type-error .g-status-item__details-toggle', 'detalle al pasar', 4.5], ['.g-status-item--type-error .g-status-item__dismiss', 'descartar al pasar', 3],
      ['.g-status-item--type-success .g-status-item__action', 'acción al pasar [success]', 4.5], ['.g-status-island__ack', '«Entendido» al pasar', 4.5],
      ['.g-status-item--type-error .g-status-item__copy', 'copiar al pasar', 4.5]
    ]
    for (const [sel, n, min] of hoverPairs) {
      await p.hover(sel); await settle(p, 260)
      hov.push(await p.evaluate(([s, n, min]) => { const e = document.querySelector(s); return { t: 'hover', part: n, fg: window.__fg(e), bg: window.__bg(e), min, changed: getComputedStyle(e).backgroundColor } }, [sel, n, min]))
    }
    await p.evaluate(() => window.gStatus.close()); await settle(p)
    await p.hover('.g-status-island__summary'); await settle(p, 260)
    hov.push(await p.evaluate(() => { const e = document.querySelector('.g-status-island__text'); return { t: 'hover', part: 'resumen al pasar (velo)', fg: window.__fg(e), bg: window.__bg(document.querySelector('.g-status-island__summary')), min: 4.5 } }))
    await p.hover('[data-test="ml-error"]'); await settle(p, 260)
    hov.push(await p.evaluate(() => { const e = document.querySelector('[data-test="ml-error"] .g-status-mark__text'); return { t: 'hover', part: 'marca enlace al pasar (subrayado)', fg: window.__fg(e, 'textDecorationColor', document.querySelector('[data-test="ml-error"]')), bg: window.__bg(e), min: 3 } }))
    await p.mouse.move(0, 899); await settle(p, 200)
    // Foco real (teclado): anillos sobre su fondo
    await p.keyboard.press('Tab')
    const foc = []
    const focusPairs = [['.g-status-island__summary', 'foco: resumen replegado (anillo exterior / página)', 'outer'], ['[data-test="ml-error"]', 'foco: marca enlace (anillo / página)', 'outer']]
    for (const [sel, n, kind] of focusPairs) {
      await kbFocus(p, sel)
      foc.push(await p.evaluate(([s, n]) => {
        const e = document.querySelector(s); const host = e.closest('.g-status-island__shape') || e
        const cs = getComputedStyle(host)
        return { t: 'foco', part: `${n} ${cs.outlineStyle} ${cs.outlineWidth}`, fg: window.__mix([cs.outlineColor]), bg: window.__mix(window.__stack(document.body)), min: 3, vis: cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) >= 2 }
      }, [sel, n]))
    }
    await p.evaluate(() => window.gStatus.open()); await settle(p)
    for (const [sel, n] of [['.g-status-island__summary', 'foco: resumen abierto (anillo interior / isla)'], ['.g-status-item--type-error .g-status-item__action', 'foco: acción (anillo / aviso)'], ['.g-status-item--type-error .g-status-item__link', 'foco: enlace (anillo / aviso)'], ['.g-status-item--type-info .g-status-item__dismiss', 'foco: descartar (anillo / aviso)'], ['.g-status-island__ack', 'foco: «Entendido» (anillo / isla)']]) {
      await kbFocus(p, sel)
      foc.push(await p.evaluate(([s, n]) => {
        const e = document.querySelector(s); const cs = getComputedStyle(e)
        const under = e.closest('.g-status-item') || e.closest('.g-status-island__shape')
        return { t: 'foco', part: `${n} ${cs.outlineStyle} ${cs.outlineWidth}`, fg: window.__mix([cs.outlineColor]), bg: window.__bg(under), min: 3, vis: cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) >= 2 }
      }, [sel, n]))
    }
    // Temporizador del resumen: la primera condición es la que tiene plazo
    await p.evaluate(() => { window.gStatus.close(); window.gStatus.remove('a-error') }); await settle(p)
    const tm = await p.evaluate(() => { const e = document.querySelector('.g-status-island__timer'); return e ? { t: 'warning', part: 'resumen: temporizador', fg: window.__fg(e), bg: window.__bg(e), min: 4.5 } : null })
    ok(!!tm, `${label}: el resumen muestra el temporizador de la primera`)
    for (const d of [...data, ...hov, ...foc, ...(tm ? [tm] : [])]) {
      if (d.min === 'brand') { if (name === 'spotify' || name === 'auditoría') ok(ratio(d.fg, d.bg) > 1.05, `${label}: la isla no se tiñe de brand (brand ${d.fg}, isla ${d.bg})`); continue }
      if (d.min === 'eq') { ok(d.fg.every((v, i) => Math.abs(v - d.bg[i]) <= 1), `${label} ${d.t}: ${d.part} (${d.fg} vs ${d.bg})`); continue }
      const r = ratio(d.fg, d.bg)
      rows.push({ label, t: d.t, part: d.part.replace(/ (solid|dashed|dotted|none) [\d.]+px$/, ''), r })
      if (d.min === 0) continue
      ok(r >= d.min, `${label} ${d.t}: ${d.part} ${r.toFixed(2)} < ${d.min}`)
      if (d.vis === false) ok(false, `${label}: ${d.part} sin anillo visible`)
    }
    await p.context().close()
  }
  {
    const worst = {}
    for (const r of rows) { const k = r.part; if (!worst[k] || r.r < worst[k].r) worst[k] = r }
    for (const [k, v] of Object.entries(worst)) note(`contraste mínimo · ${k}: ${v.r.toFixed(2)} (${v.label} ${v.t})`)
    const def = rows.filter((r) => r.label === 'defecto oscuro' && /^(resumen: texto|aviso: título|aviso: descripción|aviso: acción \(borde\)|aviso: icono \/ insignia|marca enlace: texto|marca de texto: icono)$/.test(r.part))
    note('defecto oscuro (isla clara): ' + def.map((r) => `${r.t} ${r.part} ${r.r.toFixed(2)}`).join(' · '))
  }

  /* 3 · Tamaños: compacta, punto, abierta, insignia concéntrica; defecto y auditoría (space 3); táctil */
  for (const [name, theme] of [['defecto', null], ['auditoría', 'design/lab/alert/auditoria-tema.css'], ['prueba', 'test']]) {
    const p = await open({ seed: true, theme })
    const space = await p.evaluate(() => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--g-space-1')) * (getComputedStyle(document.documentElement).getPropertyValue('--g-space-1').includes('rem') ? 16 : 1))
    const bw = await p.evaluate(() => parseFloat(getComputedStyle(document.querySelector('.g-status-island__shape')).borderTopWidth))
    const g = async () => p.evaluate(() => {
      const sh = window.__R('.g-status-island__shape'); const sum = window.__R('.g-status-island__summary'); const bd = window.__R('.g-status-island__summary .g-status-island__badge')
      return { sh, sum, bd, conc: [bd.l - sh.l, bd.t - sh.t, sh.b - bd.b] }
    })
    const c = await g()
    await p.evaluate(() => window.gStatus.acknowledge()); await settle(p)
    const d = await g()
    await p.evaluate(() => window.gStatus.open()); await settle(p)
    const o = await g()
    ok(Math.abs(c.sh.h - space * 12) <= 0.5, `${name}: compacta ${c.sh.h} = space × 12 (${space * 12})`)
    ok(Math.abs(d.sh.w - Math.max(space * 8, 24 + 2 * bw)) <= 0.5 && Math.abs(d.sh.h - d.sh.w) <= 0.5, `${name}: punto ${d.sh.w}×${d.sh.h} (space × 8 = ${space * 8})`)
    ok(d.sum.w >= 24 && d.sum.h >= 24, `${name}: el resumen (la diana) en el punto ${d.sum.w}×${d.sum.h} ≥ 24`)
    ok(c.sum.h >= 24, `${name}: el resumen en la compacta ${c.sum.h} ≥ 24`)
    ok(Math.abs(o.sh.w - Math.min(space * 104, 1280 - 4 * space)) <= 1, `${name}: abierta ${o.sh.w} = min(space × 104, disponible)`)
    ok(c.conc.every((v) => Math.abs(v - c.conc[0]) <= 0.6) && d.conc.every((v) => Math.abs(v - d.conc[0]) <= 0.6), `${name}: insignia concéntrica en compacta (${c.conc.map((v) => v.toFixed(1))}) y punto (${d.conc.map((v) => v.toFixed(1))})`)
    note(`${name}: compacta ${c.sh.w.toFixed(0)}×${c.sh.h}, punto ${d.sh.w}×${d.sh.h} (resumen ${d.sum.w}×${d.sum.h}), abierta ${o.sh.w}×${o.sh.h.toFixed(0)}, insignia ${c.bd.w}/${d.bd.w}`)
    await p.context().close()
  }
  {
    const touch = await open({ seed: true, ctx: engine === 'chromium' ? { hasTouch: true, isMobile: true } : { hasTouch: true } })
    const coarse = await touch.evaluate(() => matchMedia('(pointer: coarse)').matches)
    if (coarse) {
      const c = await touch.evaluate(() => ({ sum: window.__R('.g-status-island__summary'), sh: window.__R('.g-status-island__shape') }))
      await touch.evaluate(() => window.gStatus.acknowledge()); await settle(touch)
      const d = await touch.evaluate(() => ({ sum: window.__R('.g-status-island__summary'), sh: window.__R('.g-status-island__shape') }))
      const mk = await touch.evaluate(() => { const e = document.querySelector('#st-table-mark'); if (!e) return null; const a = getComputedStyle(e, '::after'); return [parseFloat(a.width), parseFloat(a.height)] })
      ok(c.sum.h >= 44 && d.sum.w >= 44 && d.sum.h >= 44, `táctil: el resumen (la diana) en compacta ${c.sum.w.toFixed(0)}×${c.sum.h} y en punto ${d.sum.w}×${d.sum.h} ≥ 44 (forma ${d.sh.w}×${d.sh.h})`)
      ok(!mk || mk.every((v) => v >= 44), `táctil: área de la marca enlace ${mk} ≥ 44`)
    } else note('sin pointer: coarse emulable: táctil no medido en este motor')
    await touch.context().close()
  }

  /* 4 · Cambio de forma con intermedios y sobrepaso; toque; resolver en el sitio con continuidad */
  {
    const p = await open({ seed: true })
    const sample = (fn) => p.evaluate(async (fn) => {
      const sh = document.querySelector('.g-status-island__shape')
      const c0 = getComputedStyle(sh); const r0 = { width: parseFloat(c0.width), height: parseFloat(c0.height) }; const fr = []
      ;(0, eval)(fn)()
      const t0 = performance.now()
      await new Promise((res) => { const f = () => { const cs = getComputedStyle(sh); fr.push({ t: performance.now() - t0, w: parseFloat(cs.width), h: parseFloat(cs.height), rad: parseFloat(cs.borderTopLeftRadius) }); if (performance.now() - t0 < 700) requestAnimationFrame(f); else res() }; requestAnimationFrame(f) })
      const c1 = getComputedStyle(sh); const r1 = { width: parseFloat(c1.width), height: parseFloat(c1.height) }
      return { w0: r0.width, h0: r0.height, w1: r1.width, h1: r1.height, fr, ease: getComputedStyle(sh).transitionTimingFunction }
    }, fn.toString())
    const check = (s, name) => {
      const mid = s.fr.filter((f) => f.h > Math.min(s.h0, s.h1) + 1 && f.h < Math.max(s.h0, s.h1) - 1)
      ok(mid.length >= 2, `${name}: valores intermedios de alto (${mid.length} cuadros)`)
      const dh = s.h1 - s.h0, dw = s.w1 - s.w0
      const overH = dh > 0 ? Math.max(...s.fr.map((f) => f.h)) - s.h1 : s.h1 - Math.min(...s.fr.map((f) => f.h))
      const overW = dw > 0 ? Math.max(...s.fr.map((f) => f.w)) - s.w1 : dw < 0 ? s.w1 - Math.min(...s.fr.map((f) => f.w)) : 0
      const pH = Math.abs(dh) ? overH / Math.abs(dh) : 0, pW = Math.abs(dw) > 4 ? overW / Math.abs(dw) : 0
      ok(pH <= 0.045 && pW <= 0.045, `${name}: sobrepaso ≤ 4,5 % (alto ${(pH * 100).toFixed(1)} %, ancho ${(pW * 100).toFixed(1)} %)`)
      const i = s.fr.findIndex((f, k) => s.fr.slice(k).every((g) => Math.abs(g.h - s.h1) < 0.5 && Math.abs(g.w - s.w1) < 0.5))
      ok(i >= 0 && s.fr[i].t <= 340, `${name}: asienta en ${i >= 0 ? s.fr[i].t.toFixed(0) : '—'}ms`)
      const rads = [...new Set(s.fr.map((f) => f.rad.toFixed(0)))]
      note(`${name}: ${s.w0.toFixed(0)}×${s.h0.toFixed(0)} → ${s.w1.toFixed(0)}×${s.h1.toFixed(0)}, sobrepaso alto ${(pH * 100).toFixed(1)} % ancho ${(pW * 100).toFixed(1)} %, asienta ${i >= 0 ? s.fr[i].t.toFixed(0) : '—'}ms, radio ${rads.length} valores`)
      return s
    }
    const a = check(await sample(() => window.gStatus.open()), 'compacta → abierta')
    ok(/linear\(/.test(a.ease), `curva de forma = --g-ease-spring (${a.ease.slice(0, 30)}…)`)
    check(await sample(() => window.gStatus.acknowledge()), 'abierta → punto')
    check(await sample(() => window.gStatus.warning('nueva', 'Sin conexión', { description: 'Los cambios se guardarán al volver.' })), 'punto → compacta (llega una condición)')
    // Toque: con la isla visible, una condición que no abre sola
    await settle(p, 500)
    const n = await p.evaluate(async () => {
      const root = document.querySelector('.g-status-island')
      window.gStatus.info('toque', 'Nueva versión disponible')
      let seen = false, anim = null
      const t0 = performance.now()
      await new Promise((res) => { const f = () => { if (root.classList.contains('is-nudge')) seen = true; const a = document.getAnimations().find((x) => x.animationName === 'g-status-nudge'); if (a && !anim) { const k = a.effect.getKeyframes(); anim = { from: k[0].scale, dur: a.effect.getComputedTiming().duration } } if (performance.now() - t0 < 700) requestAnimationFrame(f); else res() }; requestAnimationFrame(f) })
      return { seen, anim, after: root.classList.contains('is-nudge'), form: root.dataset.form }
    })
    ok(n.seen && n.anim && String(n.anim.from).trim() === '0.86' && Math.abs(n.anim.dur - 240) <= 1 && !n.after && n.form === 'compact', `toque real: is-nudge, g-status-nudge desde ${n.anim && n.anim.from} en ${n.anim && n.anim.dur}ms, retirada (${n.after}), sigue compacta`)
    await p.context().close()
  }
  {
    // Resolver en el sitio: error → reintentando → éxito en el mismo li; la forma no salta ni se oculta
    const p = await open({ seed: false })
    await p.evaluate(() => document.querySelector('#st-save').scrollIntoView({ block: 'center' }))
    await p.focus('#st-save'); await p.keyboard.press('Enter'); await settle(p, 600)
    ok((await form(p)) === 'open', `resolver: el error de guardar abre la isla sola (${await form(p)})`)
    await p.evaluate(() => { window.__st.saveFails = false; window.__li = document.querySelector('.g-status-item--type-error') })
    const r = await p.evaluate(async () => {
      const sh = document.querySelector('.g-status-island__shape'); const li = window.__li
      const fr = []; const t0 = performance.now(); let busySeen = null
      li.querySelector('.g-status-item__action').click()
      await new Promise((res) => { const f = () => { const r = sh.getBoundingClientRect(); const cur = document.querySelector('.g-status-item'); fr.push({ t: performance.now() - t0, w: r.width, h: r.height, hidden: sh.hidden, type: cur && cur.dataset.type, same: cur === li }); if (!busySeen && li.classList.contains('is-busy')) busySeen = { aria: li.getAttribute('aria-busy'), dis: li.querySelector('.g-status-item__action').getAttribute('aria-disabled'), spin: document.getAnimations().filter((a) => a.animationName === 'g-status-spin').length, sumBusy: document.querySelector('.g-status-island__summary .g-status-island__badge').classList.contains('is-busy'), mark: document.querySelector('#st-save-mark') && document.querySelector('#st-save-mark').classList.contains('is-busy') }; if (performance.now() - t0 < 1700) requestAnimationFrame(f); else res() }; requestAnimationFrame(f) })
      return { fr, busySeen, end: { type: li.dataset.type, same: document.querySelector('.g-status-item') === li, form: document.querySelector('.g-status-island').dataset.form } }
    })
    ok(r.busySeen && r.busySeen.aria === 'true' && r.busySeen.dis === 'true' && r.busySeen.spin >= 2 && r.busySeen.sumBusy && r.busySeen.mark, `reintentando: aria-busy, aria-disabled, insignias girando (${r.busySeen && r.busySeen.spin}), resumen y marca ocupados`)
    ok(r.end.type === 'success' && r.end.same && r.fr.every((f) => f.same) && r.end.form === 'open', `éxito en el MISMO li, la isla sigue abierta (${JSON.stringify(r.end)})`)
    ok(r.fr.every((f) => !f.hidden && f.w > 30 && f.h > 30), 'resolver: la forma nunca se oculta ni colapsa')
    const jumps = r.fr.slice(1).map((f, i) => Math.abs(f.h - r.fr[i].h))
    const changed = r.fr[r.fr.length - 1].h - r.fr[0].h
    note(`resolver: alto ${r.fr[0].h.toFixed(0)} → ${r.fr[r.fr.length - 1].h.toFixed(0)}, mayor salto entre cuadros ${Math.max(...jumps).toFixed(1)}px`)
    ok(Math.abs(changed) < 2 || Math.max(...jumps) < Math.abs(changed) * 0.6, `resolver: el cambio de tamaño es continuo (mayor salto ${Math.max(...jumps).toFixed(1)} de ${changed.toFixed(1)})`)
    await p.context().close()
  }

  /* 5 · Cascada del panel con los retardos reales; reduce solo fundidos */
  {
    const p = await open({ seed: true })
    await p.evaluate(FOUR); await settle(p)
    await p.evaluate(() => window.gStatus.close()); await settle(p)
    const c = await p.evaluate(async () => {
      window.gStatus.open()
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
      const lis = [...document.querySelectorAll('.g-status-island__shape .g-status-item, .g-status-island__shape .g-status-island__foot')]
      return lis.map((li) => li.getAnimations().filter((a) => ['opacity', 'translate'].includes(a.transitionProperty)).map((a) => ({ p: a.transitionProperty, delay: a.effect.getTiming().delay, dur: a.effect.getTiming().duration })))
    })
    const delays = c.map((a) => Math.round((a.find((x) => x.p === 'opacity') || {}).delay))
    ok(c.every((a) => a.length === 2) && JSON.stringify(delays) === JSON.stringify([0, 24, 48, 72, 72]) && c.flat().every((x) => x.dur === 160), `cascada: fundido + caída por aviso con retardos ${delays} (fast / 5, tope 3) en 160ms`)
    await p.context().close()
  }
  {
    const p = await open({ seed: true, motion: 'reduce' })
    const r = await p.evaluate(async () => {
      const sh = document.querySelector('.g-status-island__shape')
      window.gStatus.open(); window.gStatus.info('toque2', 'Otra condición')
      await new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(res))))
      const anims = document.getAnimations().filter((a) => a.playState === 'running' && (a.effect.target && a.effect.target.closest && a.effect.target.closest('.g-status-island'))).map((a) => a.animationName || a.transitionProperty)
      const inner = sh.querySelector('.g-status-island__inner').getBoundingClientRect(), s = sh.getBoundingClientRect()
      return { anims, jump: Math.abs(s.height - inner.height - 2) <= 1.01, nudge: document.querySelector('.g-status-island').classList.contains('is-nudge') }
    })
    await settle(p, 150)
    const after = await p.evaluate(() => document.querySelector('.g-status-island').classList.contains('is-nudge'))
    ok(r.anims.every((a) => a === 'opacity'), `reduce: solo fundidos en curso (${[...new Set(r.anims)].join(', ') || 'ninguno'})`)
    ok(r.jump && !after, `reduce: la forma salta a su tamaño; is-nudge se retira sin animationend (${after})`)
    await p.evaluate(() => { window.gStatus.close(); window.__st.saveFails = true }); await settle(p)
    await p.evaluate(() => window.__st.save()); await settle(p, 300)
    await p.evaluate(() => { window.__st.saveFails = true; window.gStatus.open(); document.querySelector('.g-status-item--type-error .g-status-item__action').click() }); await settle(p, 150)
    ok(await p.evaluate(() => !document.getAnimations().some((a) => a.animationName === 'g-status-spin' || a.animationName === 'g-status-mark-spin')), 'reduce: reintentando sin giro')
    const rc = await p.evaluate(async () => { const t = document.querySelector('.g-status-item--type-error .g-status-item__details-toggle'); const c = t.querySelector('.g-status-item__details-chevron'); t.click(); await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))); return { anims: c.getAnimations().length, rot: getComputedStyle(c).rotate, dur: getComputedStyle(c).transitionDuration } })
    ok(rc.anims === 0 && /180deg|0\.5turn/.test(rc.rot) && /^0s/.test(rc.dur), `reduce: el chevron salta a ${rc.rot} sin transición (${rc.anims} animaciones, ${rc.dur})`)
    await p.context().close()
  }

  /* 6 · Más de 6 condiciones: la lista desplaza, el pie se ve, la isla cabe */
  for (const h of [900, 600]) {
    const p = await open({ seed: true, height: h })
    await p.evaluate(() => { window.__st.many(); window.gStatus.open() }); await settle(p, 600)
    const r = await p.evaluate(() => {
      const sh = window.__R('.g-status-island__shape'); const list = document.querySelector('.g-status-island__list'); const foot = window.__R('.g-status-island__foot')
      return { n: list.children.length, scrolls: list.scrollHeight > list.clientHeight + 1, footIn: foot.b <= sh.b + 0.5 && foot.t >= sh.t, bottom: sh.b, vh: innerHeight, ob: getComputedStyle(list).overscrollBehaviorY }
    })
    ok(r.n >= 9 && (r.scrolls || r.bottom < r.vh - 9) && r.footIn && r.bottom <= r.vh - 7.5 && r.ob === 'contain', `${r.n} condiciones a ${h}px: desplaza ${r.scrolls}, pie visible ${r.footIn}, borde inferior ${r.bottom.toFixed(0)} / ${r.vh}`)
    await p.context().close()
  }

  /* 7 · Marcas alineadas en el playground real (GFormActions y sección); sangría francesa a 320 */
  {
    const p = await open({ seed: false })
    await p.evaluate(() => window.__st.save()); await settle(p)
    await p.evaluate(() => window.gStatus.close()); await settle(p)
    const r = await p.evaluate(() => {
      const c = (e) => { const r = e.getBoundingClientRect(); return r.top + r.height / 2 }
      const mark = document.querySelector('#st-save-mark'); const save = document.querySelector('#st-save')
      const lbl = save.querySelector('.g-btn__label') || save
      const fl = (p) => { const rg = document.createRange(); const tn = [...p.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim()); rg.setStart(tn, 0); rg.setEnd(tn, 1); return rg.getBoundingClientRect() }
      const tm = document.querySelector('#st-text-mark'); const tb = tm.querySelector('.g-status-mark__badge').getBoundingClientRect(); const tl = fl(tm.querySelector('.g-status-mark__text')); const ta = tm.querySelector('.g-status-mark__action')
      return { link: Math.abs(c(mark.querySelector('.g-status-mark__text')) - c(lbl)), row: Math.abs(c(mark) - c(save)), badge: Math.abs((tb.top + tb.height / 2) - (tl.top + tl.height / 2)), act: Math.abs(c(ta) - (tl.top + tl.height / 2)), gap: tl.left - tb.right }
    })
    ok(r.link <= 1 && r.row <= 1, `marca enlace junto a «Guardar»: texto Δ${r.link.toFixed(2)}, caja Δ${r.row.toFixed(2)}`)
    ok(r.badge <= 1 && r.act <= 1 && Math.abs(r.gap - 8) <= 0.6, `marca de texto: insignia vs 1.ª línea Δ${r.badge.toFixed(2)}, acción Δ${r.act.toFixed(2)}, hueco ${r.gap.toFixed(1)}`)
    await p.setViewportSize({ width: 320, height: 800 }); await settle(p, 400)
    const hang = await p.evaluate(() => {
      const tm = document.querySelector('#st-text-mark'); const t = tm.querySelector('.g-status-mark__text'); const rg = document.createRange(); rg.selectNodeContents(t)
      const lefts = [...new Set([...rg.getClientRects()].filter((r) => r.width > 2).map((r) => Math.round(r.left)))]
      return { lefts, act: Math.abs(tm.querySelector('.g-status-mark__action').getBoundingClientRect().left - t.getBoundingClientRect().left) }
    })
    ok(Math.max(...hang.lefts) - Math.min(...hang.lefts) <= 1 && hang.act <= 0.5, `marca de texto a 320: líneas desde ${hang.lefts}, acción alineada con el texto (Δ${hang.act.toFixed(1)})`)
    await p.context().close()
  }

  /* 8 · Móvil 375 y 320: hoja inferior real, sin desplazamiento horizontal; contraste en la hoja */
  for (const [w, dark] of [[375, false], [320, false], [375, true]]) {
    const p = await open({ seed: true, width: w, height: 760, dark })
    await p.evaluate(FOUR); await settle(p)
    ok((await form(p)) === 'compact', `${w}px: lo grave no abre nada solo (${await form(p)})`)
    await p.click('.g-status-island__summary'); await settle(p, 600)
    await p.click('dialog.g-status-sheet .g-status-item--type-error .g-status-item__details-toggle'); await settle(p, 250)
    const r = await p.evaluate(() => {
      const root = document.querySelector('.g-status-island'); const sh = window.__R('.g-status-island__shape')
      const d = document.querySelector('dialog.g-status-sheet'); const dr = window.__R(d)
      const pre = d.querySelector('.g-status-item__details-text')
      const items = [...d.querySelectorAll('.g-status-item')].every((li) => { const x = li.getBoundingClientRect(); return x.left >= dr.l - 0.5 && x.right <= dr.r + 0.5 })
      const con = []
      for (const li of d.querySelectorAll('.g-status-item')) {
        const tile = window.__bg(li)
        for (const [s, n, m] of [['.g-status-item__title', 'título', 4.5], ['.g-status-item__description', 'descripción', 4.5], ['.g-status-item__link', 'enlace', 4.5], ['.g-status-item__action', 'acción', 4.5], ['.g-status-item__origin', 'Ir a…', 4.5]]) { const e = li.querySelector(s); if (e) con.push({ k: `${li.dataset.type} ${n}`, fg: window.__fg(e), bg: window.__bg(e), m }) }
        const a = li.querySelector('.g-status-item__action'); if (a) con.push({ k: `${li.dataset.type} acción (borde)`, fg: window.__fg(a, 'borderTopColor', li), bg: tile, m: 3 })
        const ib = li.querySelector('.g-status-item__badge'); con.push({ k: `${li.dataset.type} icono / insignia`, fg: window.__fg(ib), bg: window.__bg(ib), m: 3 })
        if (li.dataset.type !== 'success') con.push({ k: `${li.dataset.type} anillo / aviso`, fg: window.__fg(ib, 'borderTopColor', li), bg: tile, m: 3 })
      }
      return { mobile: root.hasAttribute('data-mobile'), form: root.dataset.form, open: d.open, modal: d.matches(':modal'), sw: document.scrollingElement.scrollWidth, vw: innerWidth, vh: innerHeight, sh, dr, pre: pre ? pre.scrollWidth <= pre.clientWidth + 1 : null, items, pe: getComputedStyle(d).pointerEvents, con }
    })
    ok(r.mobile && r.open && r.modal && r.form === 'open' && Math.abs(r.dr.b - r.vh) <= 1 && Math.abs(r.dr.w - r.vw) <= 1, `${w}px${dark ? ' oscuro' : ''}: hoja inferior modal a todo el ancho (${r.dr.w.toFixed(0)}×${r.dr.h.toFixed(0)}, abajo ${r.dr.b.toFixed(0)}/${r.vh})`)
    ok(r.sw <= r.vw && r.sh.l >= 7.5 && r.sh.r <= r.vw - 7.5 && r.sh.t >= 7.5, `${w}px: sin desplazamiento horizontal (${r.sw}/${r.vw}), isla dentro del margen (${r.sh.l.toFixed(0)}–${r.sh.r.toFixed(0)})`)
    ok(r.pre && r.items && r.pe === 'auto', `${w}px: detalle partido, avisos dentro de la hoja, la hoja recibe el puntero`)
    for (const c of r.con) ok(ratio(c.fg, c.bg) >= c.m, `${w}px${dark ? ' oscuro' : ''} hoja: ${c.k} ${ratio(c.fg, c.bg).toFixed(2)} < ${c.m}`)
    await p.context().close()
  }

  /* 9 · RTL: insignias al inicio (derecha), concéntricas; top-start pegada a la derecha */
  {
    const p = await open({ seed: true, rtl: true })
    await p.evaluate(MARKS); await p.evaluate(FOUR); await settle(p)
    await p.evaluate(() => window.gStatus.open()); await settle(p)
    const r = await p.evaluate(() => {
      const sh = window.__R('.g-status-island__shape'); const b = window.__R('.g-status-island__summary .g-status-island__badge')
      const li = document.querySelector('.g-status-item'); const lb = window.__R(li.querySelector('.g-status-item__badge')); const lt = window.__R(li.querySelector('.g-status-item__title'))
      const mt = document.querySelector('[data-test="mt-info"]'); const mb = window.__R(mt.querySelector('.g-status-mark__badge')); const mtr = window.__R(mt); const mp = window.__R(mt.querySelector('.g-status-mark__text'))
      const ml = document.querySelector('[data-test="ml-info"]'); const mlr = window.__R(ml); const mlb = window.__R(ml.querySelector('.g-status-mark__badge'))
      return { sum: sh.r - b.r, sumTop: b.t - sh.t, item: lb.l > lt.r, mark: Math.abs(mb.r - mtr.r), markGap: mb.l - mp.r, link: mlr.r - mlb.r, linkTop: mlb.t - mlr.t }
    })
    ok(Math.abs(r.sum - r.sumTop) <= 0.6 && r.item, `RTL: insignia del resumen al inicio (derecha) y concéntrica (${r.sum.toFixed(1)} / ${r.sumTop.toFixed(1)}); aviso con insignia a la derecha`)
    ok(r.mark <= 0.5 && Math.abs(r.markGap - 8) <= 0.6 && Math.abs(r.link - r.linkTop) <= 0.6, `RTL: marca de texto al inicio (Δ${r.mark.toFixed(1)}, hueco ${r.markGap.toFixed(1)}); cápsula concéntrica (${r.link.toFixed(1)} / ${r.linkTop.toFixed(1)})`)
    await p.evaluate(() => { window.gStatus.close(); window.gStatus.configure({ position: 'top-start' }) }); await settle(p)
    const s = await p.evaluate(() => ({ sh: window.__R('.g-status-island__shape'), vw: document.documentElement.clientWidth, o: getComputedStyle(document.querySelector('.g-status-island__shape')).transformOrigin }))
    ok(Math.abs(s.vw - s.sh.r - 8) <= 0.6, `RTL top-start: la isla pegada al borde derecho a space × 2 (${(s.vw - s.sh.r).toFixed(1)})`)
    await p.context().close()
  }

  /* 10 · forced-colors (Chromium) */
  if (engine === 'chromium') {
    const sizes = async (p) => p.evaluate(() => [window.__R('.g-status-island__shape').w, window.__R('.g-status-island__shape').h, window.__R('#st-table-mark').w])
    const p0 = await open({ seed: true }); const s0 = await sizes(p0); await p0.context().close()
    const p = await open({ seed: true, ctx: { forcedColors: 'active' } })
    await p.evaluate(() => { window.gStatus.warning('fc-w', 'Advertencia de prueba') ; window.gStatus.info('fc-i', 'Información de prueba') }); await settle(p)
    await p.evaluate(() => window.gStatus.open()); await settle(p)
    const r = await p.evaluate(() => {
      const st = (s) => { const c = getComputedStyle(document.querySelector(s)); return c.borderTopStyle + ' ' + c.borderTopColor }
      return { fc: matchMedia('(forced-colors: active)').matches, sh: st('.g-status-island__shape'), w: st('.g-status-item--type-warning .g-status-item__badge'), i: st('.g-status-item--type-info .g-status-item__badge'), e: st('.g-status-item--type-error .g-status-item__badge'), li: st('.g-status-item'), mark: st('#st-table-mark') }
    })
    ok(r.fc && /solid/.test(r.sh) && !/rgba\(0, 0, 0, 0\)/.test(r.sh) && !/rgba\(0, 0, 0, 0\)/.test(r.mark) && !/rgba\(0, 0, 0, 0\)/.test(r.li), `forced-colors: borde visible en isla (${r.sh}), aviso (${r.li}) y marca (${r.mark})`)
    ok(/^dashed/.test(r.w) && /^dotted/.test(r.i) && /^solid/.test(r.e), `forced-colors: el anillo conserva su forma (${r.e} / ${r.w} / ${r.i})`)
    await p.evaluate(() => window.gStatus.clear()); await settle(p)
    await p.close()
    const p2 = await open({ seed: true, ctx: { forcedColors: 'active' } })
    const s1 = await sizes(p2)
    ok(s1.every((v, i) => Math.abs(v - s0[i]) <= 0.5), `forced-colors: sin cambio de tamaño (${s0} → ${s1})`)
    await p2.keyboard.press('Tab'); await p2.evaluate(() => document.querySelector('.g-status-island__summary').focus()); await settle(p2, 150)
    ok(await p2.evaluate(() => /solid/.test(getComputedStyle(document.querySelector('.g-status-island__shape')).outlineStyle)), 'forced-colors: el foco de la isla replegada sigue visible')
    await p2.context().close()
  }

  /* 11 · Zoom 200 % y 400 % aproximados (visor 640×450 y 320×225 con DPR 2 y 4) */
  for (const [w, h, dpr] of [[640, 450, 2], [320, 225, 4]]) {
    const p = await open({ seed: true, width: w, height: h, ctx: { deviceScaleFactor: dpr } })
    await p.evaluate(FOUR); await settle(p)
    await p.evaluate(() => window.gStatus.open()); await settle(p, 600)
    const r = await p.evaluate(() => {
      const root = document.querySelector('.g-status-island'); const mobile = root.hasAttribute('data-mobile')
      const box = mobile ? window.__R('dialog.g-status-sheet') : window.__R('.g-status-island__shape')
      const foot = mobile ? window.__R('dialog.g-status-sheet .g-status-island__ack') : window.__R('.g-status-island__foot')
      const list = mobile ? document.querySelector('dialog.g-status-sheet .g-dialog__body') || document.querySelector('dialog.g-status-sheet') : document.querySelector('.g-status-island__list')
      const clipped = [...root.querySelectorAll('.g-status-item__title, .g-status-item__description, .g-btn__label')].filter((e) => e.getClientRects().length && e.scrollWidth > e.clientWidth + 1).length
      return { mobile, box, foot, vh: innerHeight, vw: innerWidth, sw: document.scrollingElement.scrollWidth, scrolls: list ? list.scrollHeight > list.clientHeight + 1 : null, clipped }
    })
    ok(r.sw <= r.vw && r.box.l >= -0.5 && r.box.r <= r.vw + 0.5 && r.box.b <= r.vh + 0.5 && r.foot.b <= r.vh + 0.5 && r.clipped === 0, `zoom ${dpr * 100} % (${w}×${h}${r.mobile ? ', hoja' : ''}): cabe sin desplazamiento horizontal, «Entendido» visible (${r.foot.b.toFixed(0)}/${r.vh}), sin texto recortado (${r.clipped})`)
    await p.context().close()
  }

  /* 12 · Convivencia: Δ0 de la página y del foco; GToaster; pill y panel de voz; GDialog; controles del playground */
  {
    const p = await open({ seed: false })
    const REFS = ['#st-cliente', '#st-save', '#st-table-region', '#st-text-mark', '#st-dialog']
    const tops = () => p.evaluate((sels) => sels.map((s) => document.querySelector(s).getBoundingClientRect().top + scrollY), REFS)
    await p.evaluate(() => document.querySelector('#st-save').scrollIntoView({ block: 'center' }))
    const t0 = await tops()
    const track = (ms) => p.evaluate(([ms]) => new Promise((res) => { const el = document.activeElement; const out = []; const t0 = performance.now(); const f = () => { out.push(el.getBoundingClientRect().top); if (performance.now() - t0 < ms) requestAnimationFrame(f); else res(Math.max(...out) - Math.min(...out)) }; requestAnimationFrame(f) }), [ms])
    await p.focus('#st-save')
    const [d1] = await Promise.all([track(900), p.keyboard.press('Enter')])
    const t1 = await tops()
    const [d2] = await Promise.all([track(600), p.evaluate(() => { window.gStatus.close(); window.gStatus.open() })])
    await p.evaluate(() => { window.__st.saveFails = false })
    const [d3] = await Promise.all([track(1500), p.evaluate(() => document.querySelector('.g-status-item--type-error .g-status-item__action').click())])
    const t3 = await tops()
    ok(d1 <= 0.5 && d2 <= 0.5 && d3 <= 0.5 && (await p.evaluate(() => document.activeElement.id)) === 'st-save', `Δ0 del foco al aparecer ${d1.toFixed(2)}, abrirse ${d2.toFixed(2)}, resolverse ${d3.toFixed(2)}; el foco sigue en «Guardar»`)
    ok(t1.every((v, i) => Math.abs(v - t0[i]) <= 0.5) && t3.every((v, i) => Math.abs(v - t0[i]) <= 0.5), `Δ0 de la página (${t1.map((v, i) => (v - t0[i]).toFixed(1))} / ${t3.map((v, i) => (v - t0[i]).toFixed(1))})`)
    // GToaster arriba al centro: los avisos bajo la isla replegada; con la isla abierta, la isla queda encima
    await p.evaluate(() => { window.gStatus.close(); window.toaster.configure({ position: 'top-center' }); window.toaster.info('Borrador guardado', { duration: 0 }) }); await settle(p, 600)
    const tz = await p.evaluate(() => { const i = window.__R('.g-status-island__shape'); const t = window.__R('.g-toast'); return { gap: t.t - i.b, ib: i.b, tt: t.t } })
    ok(tz.gap >= 0, `GToaster top-center: el aviso empieza bajo la isla replegada (hueco ${tz.gap.toFixed(1)}px)`)
    await p.evaluate(() => window.gStatus.open()); await settle(p)
    const layer = await p.evaluate(() => {
      const i = window.__R('.g-status-island__shape'); const t = window.__R('.g-toast')
      if (!(t.t < i.b && t.b > i.t)) return { overlap: false }
      const x = Math.max(i.l, t.l) + 10, y = Math.max(i.t, t.t) + 5
      const hit = document.elementFromPoint(x, y)
      return { overlap: true, island: !!(hit && hit.closest('.g-status-island')) }
    })
    ok(!layer.overlap || layer.island, `capa: con la isla abierta sobre un aviso, gana la isla (${JSON.stringify(layer)})`)
    note(`GToaster: aviso bajo la isla replegada (${tz.gap.toFixed(1)}px); con la isla abierta ${layer.overlap ? 'se solapan y la isla queda encima' : 'no se solapan'}`)
    await p.evaluate(() => { window.toaster.dismiss ? window.toaster.dismiss() : null; window.gStatus.close() }); await settle(p)
    // GDialog modal: la isla se traslada (mismos nodos), sigue en la capa superior encima del diálogo y vuelve
    await p.evaluate(() => { window.__root = document.querySelector('.g-status-island'); window.__st.dlg = true }); await settle(p, 600)
    const dl = await p.evaluate(() => {
      const root = document.querySelector('.g-status-island'); const sh = window.__R('.g-status-island__shape')
      const hit = document.elementFromPoint(sh.l + sh.w / 2, sh.t + sh.h / 2)
      return { same: root === window.__root, inDialog: !!root.closest('dialog#st-dlg, dialog[open]'), pop: root.matches(':popover-open'), top: !!(hit && hit.closest('.g-status-island')), form: root.dataset.form, n: window.gStatus.state.count }
    })
    ok(dl.same && dl.inDialog && dl.pop && dl.top && dl.n >= 1, `GDialog: la isla se traslada (mismo nodo ${dl.same}), sigue abierta en la capa superior y encima del diálogo (${dl.top}), estado intacto (${dl.form}, ${dl.n})`)
    await p.evaluate(() => { window.__st.dlg = false }); await settle(p, 600)
    ok(await p.evaluate(() => { const r = document.querySelector('.g-status-island'); return r === window.__root && r.parentElement === document.body && r.matches(':popover-open') }), 'GDialog: al cerrarse, la isla vuelve al body y sigue abierta')
    await p.context().close()
  }
  {
    // Pill y panel de voz con la isla: borde compartido y solape
    const p = await open({ seed: true, query: '&speech=self' })
    await p.evaluate(() => window.speech.start({ mode: 'conversation' }))
    // La cabecera del playground es fija y lleva su pill: se suelta y se desplaza para que la visible sea la flotante
    await p.evaluate(() => { document.querySelector('.pg-bar').style.position = 'static'; document.querySelector('#st-save').scrollIntoView({ block: 'center' }) })
    await p.waitForFunction(() => { const f = document.querySelector('.g-speech-host__float'); return f && !f.hidden && f.getBoundingClientRect().height > 0 }, null, { timeout: 8000 }).catch(() => {})
    await settle(p, 600)
    const v = await p.evaluate(() => {
      const f = document.querySelector('.g-speech-host__float'); const fr = f && !f.hidden ? window.__R(f) : null; const i = window.__R('.g-status-island__shape')
      return { pill: fr, island: i, gap: fr ? i.t - fr.b : null }
    })
    if (v.pill) {
      ok(v.gap >= 0, `voz → isla: la isla empieza bajo la pill de voz (hueco ${v.gap.toFixed(1)}px)`)
      await p.click('.g-speech-host__float .g-speech-pill__main').catch(() => {}); await settle(p, 500)
      const panelOpen = await p.evaluate(() => { const x = document.querySelector('.g-speech-panel'); return x && !x.hidden && x.getBoundingClientRect().height > 0 })
      await p.evaluate(() => window.gStatus.open()); await settle(p, 500)
      const both = await p.evaluate(() => {
        const x = document.querySelector('.g-speech-panel'); const pr = x && !x.hidden ? window.__R(x) : null; const i = window.__R('.g-status-island__shape')
        const over = pr && pr.l < i.r && pr.r > i.l && pr.t < i.b && pr.b > i.t
        let top = null
        if (over) { const hx = Math.max(pr.l, i.l) + 10, hy = Math.max(pr.t, i.t) + 10; const h = document.elementFromPoint(hx, hy); top = h && h.closest('.g-status-island') ? 'isla' : h && h.closest('.g-speech-host') ? 'voz' : h && h.tagName }
        return { panel: !!pr, over, top }
      })
      note(`voz: panel abierto ${panelOpen}; con la isla abierta por programa: solape ${both.over}, encima ${both.top} (límite conocido de status.md con teclado)`)
      // Con puntero: pulsar el resumen de la isla cierra el panel de voz; pulsar la pill repliega la isla
      await p.evaluate(() => window.gStatus.close()); await settle(p, 300)
      if (!(await p.evaluate(() => { const x = document.querySelector('.g-speech-panel'); return x && !x.hidden }))) { await p.click('.g-speech-host__float .g-speech-pill__main').catch(() => {}); await settle(p, 400) }
      await p.click('.g-status-island__summary'); await settle(p, 500)
      const a = await p.evaluate(() => ({ island: document.querySelector('.g-status-island').dataset.form, panel: (() => { const x = document.querySelector('.g-speech-panel'); return !!(x && !x.hidden && x.getBoundingClientRect().height) })() }))
      ok(a.island === 'open' && !a.panel, `con puntero: abrir la isla cierra el panel de voz (isla ${a.island}, panel ${a.panel})`)
      await p.click('.g-speech-host__float .g-speech-pill__main').catch(() => {}); await settle(p, 500)
      const b2 = await p.evaluate(() => document.querySelector('.g-status-island').dataset.form)
      ok(b2 !== 'open', `con puntero: pulsar la pill de voz repliega la isla (${b2})`)
    } else note('voz: la pill flotante no apareció en este motor; borde compartido no medido aquí (lo cubre status.spec.mjs)')
    await p.evaluate(() => window.speech.cancel && window.speech.cancel()).catch(() => {})
    await p.context().close()
  }
  for (const w of [1280, 375]) {
    // ¿La isla replegada tapa controles del playground (cabecera fija)?
    const p = await open({ seed: true, width: w, height: 800 })
    const cov = async () => p.evaluate(() => {
      const s = window.__R('.g-status-island__shape')
      return [...document.querySelectorAll('.pg-bar button, .pg-bar a, .pg-bar input, .pg-bar select, .pg-bar [tabindex]')].filter((e) => e.getClientRects().length).map((e) => {
        const r = e.getBoundingClientRect(); const ix = Math.max(0, Math.min(r.right, s.r) - Math.max(r.left, s.l)); const iy = Math.max(0, Math.min(r.bottom, s.b) - Math.max(r.top, s.t))
        return { id: e.id || e.className.split(' ')[0] || e.tagName, txt: (e.textContent || e.getAttribute('aria-label') || '').trim().slice(0, 20), part: (ix * iy) / (r.width * r.height) }
      }).filter((x) => x.part > 0)
    })
    const c = await cov()
    await p.evaluate(() => window.gStatus.acknowledge()); await settle(p)
    const d = await cov()
    const bar = await p.evaluate(() => window.__R('.pg-bar').b)
    // El aviso de desarrollo 13 (control tapado por completo) no se puede ver aquí: la UMD del playground corre sin
    // `process` y los avisos de desarrollo solo existen con un empaquetador (lo cubre GStatusIsland.test.js)
    ok(!c.length && !d.length, `${w}px: la isla replegada no tapa controles de la cabecera del playground (offset de bruno); antes tapaba de la cabecera del playground (compacta: ${c.map((x) => `${x.txt || x.id} ${(x.part * 100).toFixed(0)} %`).join(', ') || 'ninguno'}; punto: ${d.map((x) => `${x.txt || x.id} ${(x.part * 100).toFixed(0)} %`).join(', ') || 'ninguno'}; cabecera hasta ${bar.toFixed(0)}px)`)
    await p.context().close()
  }

  ok(errs.length === 0, `consola: ${[...new Set(errs)].slice(0, 5).join(' | ')}`)
  await b.close()
}
server.close()
for (const i of info) console.log('·', i)
for (const f of pend) console.log('PENDIENTE', f)
for (const f of fails) console.log('FALLA', f)
console.log(`\nTOTAL ${total - failed}/${total}`)
process.exit(failed ? 1 : 0)
