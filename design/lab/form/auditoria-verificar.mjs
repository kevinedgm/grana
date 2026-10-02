// Auditoría de coco (paso 5) del sistema de formularios r02 sobre los COMPONENTES REALES (playground, #sec-form, dist/).
// Complementa la prueba obligatoria de bruno (design/lab/theme-playground/tests/form-distribution.spec.mjs, LTR y tema
// por defecto) con: §12 en RTL (tres motores), con otros temas (Spotify oscuro, «Tema de prueba» del playground claro y
// oscuro, tema con space 5 y borde 2px), contraste medido, táctil, pie fijo, forced-colors, prefers-contrast, solo
// lectura del selector de GInputGroup, consola y capturas para revisar la composición a ojo.
// Ejecutar desde la raíz del repo (con dist/ reconstruido): node design/lab/form/auditoria-verificar.mjs
// Opcional: --engines=chromium   --shots (capturas en $SHOTS o /tmp/grana-form-shots)
import http from 'node:http'
import { readFile, mkdir } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const pw = await import(new URL('../theme-playground/node_modules/playwright/index.mjs', import.meta.url))
const ROOT = fileURLToPath(new URL('../../../', import.meta.url))
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')).map(([k, v]) => [k, v ?? true]))
const ENGINES = (args.engines || 'chromium,firefox,webkit').split(',')
const SHOTS = process.env.SHOTS || '/tmp/grana-form-shots'
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
const ORIGIN = `http://127.0.0.1:${server.address().port}`
const PAGE = ORIGIN + '/packages/vue/playground/index.html'
const GEN = (n) => readFile(join(ROOT, `design/lab/tema-oscuro/dark-color-presence/generated/${n}.css`), 'utf8')
// Tema con otra escala (space 5, borde 2px, serif, radios pequeños): el «Tema de prueba» del banco de coco
const SPACE5 = ':root{--g-font-ui:Georgia,serif;--g-border-width:2px;--g-radius-md:3px;--g-radius-sm:2px;--g-radius-xs:1px;--g-color-primary:#7A1E3A;--g-color-primary-text:#7A1E3A;--g-color-surface:#fffaf2;--g-color-surface-sunken:#f1e7d8;--g-color-neutral-soft:#ece0cc;--g-color-bg:#f4ecdf;--g-color-border-control:#8a6d4b;--g-color-text:#2b1d0e;--g-color-text-muted:#6b5238;--g-color-text-subtle:#6f553b;--g-color-focus:#1C6E6E;--g-space-1:5px}'

const WIDTHS = ['1280', '960', '720', '480', '360', '320']
const STATES = [[false, false], [true, false], [false, true], [true, true]]
const report = {}
let total = 0, failed = 0
const ok = (engine, cond, msg) => { total++; (report[engine] ??= { pass: 0, fail: [] }); if (cond) report[engine].pass++; else { failed++; report[engine].fail.push(msg) } }

/* Geometría: la misma de form-distribution.spec.mjs (bruno), con RTL */
const geom = () => {
  const out = []; const T = 1
  const rtl = getComputedStyle(document.documentElement).direction === 'rtl'
  const S = (r) => (rtl ? -r.right : r.left), E = (r) => (rtl ? -r.left : r.right)
  const BOX = ':scope > .g-input__row, :scope > .g-select__control, :scope > .g-textarea__control, :scope > .g-datepicker__field, :scope > .g-input-group__box'
  const name = (el) => (el.querySelector('label, legend, .g-datepicker__label')?.textContent.trim() || el.className.split(' ')[0]).slice(0, 40)
  for (const fr of document.querySelectorAll('#sec-form [data-frame]')) {
    fr.querySelectorAll('.g-form-layout').forEach((lay) => {
      const R = E(lay.getBoundingClientRect())
      for (const c of lay.children) { const d = R - E(c.getBoundingClientRect()); if (Math.abs(d) > T) out.push(`hijo de layout a ${Math.round(d)}px del borde: ${name(c)}`) }
    })
    fr.querySelectorAll('.g-form-row').forEach((row) => {
      if (!row.hasAttribute('data-lines')) out.push(`fila sin medir: ${[...row.children].map(name).join('|')}`)
      const R = E(row.getBoundingClientRect())
      const kids = [...row.children]
      const lines = new Map()
      for (const c of kids) { const k = c.dataset.line ?? String(Math.round(c.getBoundingClientRect().top)); if (!lines.has(k)) lines.set(k, []); lines.get(k).push(c) }
      let prevBottom = -Infinity, domIdx = -1
      ;[...lines.values()].sort((a, b) => a[0].getBoundingClientRect().top - b[0].getBoundingClientRect().top).forEach((ks) => {
        const end = Math.max(...ks.map((k) => E(k.getBoundingClientRect())))
        if (Math.abs(end - R) > T) out.push(`línea que no llega al borde (${Math.round(R - end)}px): ${ks.map(name).join('|')}`)
        const tops = ks.map((k) => k.querySelector(BOX)?.getBoundingClientRect().top).filter((x) => x !== undefined)
        if (tops.length > 1 && Math.max(...tops) - Math.min(...tops) > T) out.push(`cajas desalineadas (${(Math.max(...tops) - Math.min(...tops)).toFixed(1)}px): ${ks.map(name).join('|')}`)
        const sorted = [...ks].sort((a, b) => S(a.getBoundingClientRect()) - S(b.getBoundingClientRect()))
        sorted.forEach((k) => { const i = kids.indexOf(k); if (i < domIdx) out.push(`orden visual ≠ DOM: ${name(k)}`); domIdx = i })
        sorted.slice(1).forEach((k, i) => { if (S(k.getBoundingClientRect()) < E(sorted[i].getBoundingClientRect()) - T) out.push(`solape: ${name(sorted[i])} / ${name(k)}`) })
        const top = Math.min(...ks.map((k) => k.getBoundingClientRect().top)); if (top < prevBottom - T) out.push(`líneas superpuestas: ${ks.map(name).join('|')}`)
        prevBottom = Math.max(...ks.map((k) => k.getBoundingClientRect().bottom))
        ks.forEach((k) => { const b = k.querySelector(BOX); if (b && E(b.getBoundingClientRect()) > E(k.getBoundingClientRect()) + T) out.push(`caja más ancha que su celda: ${name(k)}`) })
      })
    })
    if (fr.scrollWidth > fr.clientWidth + 1) out.push(`desborde en el marco de ${fr.querySelector('form')?.id}`)
    const FR = fr.getBoundingClientRect()
    fr.querySelectorAll('.g-input__row, .g-select__control, .g-textarea__control, .g-datepicker__field, .g-input-group__box, .g-input-group__part').forEach((b) => {
      const r = b.getBoundingClientRect()
      if (r.right > FR.right + 1 || r.left < FR.left - 1) out.push(`caja fuera del marco: ${b.closest('.g-input, .g-select, .g-textarea, .g-datepicker, .g-input-group')?.id || b.className}`)
    })
    // partes de GInputGroup: el control no se sale de su parte (selector de solo lectura con size)
    fr.querySelectorAll('.g-input-group__part').forEach((p) => { const c = p.querySelector('.g-input-group__control'); if (c && c.scrollWidth > c.clientWidth + 1 && c.tagName === 'INPUT' && c.readOnly) out.push(`texto recortado en parte de solo lectura: ${c.value}`) })
    fr.querySelectorAll('.g-input__label, .g-select__label, .g-textarea__label, .g-datepicker__label, .g-input-group__label, .g-field-group__label').forEach((l) => {
      const cs = getComputedStyle(l)
      if (l.scrollWidth > l.clientWidth + 1 || l.scrollHeight > l.clientHeight + 1) out.push(`etiqueta recortada: ${l.textContent}`)
      if (cs.textOverflow === 'ellipsis' || (cs.webkitLineClamp && cs.webkitLineClamp !== 'none')) out.push(`etiqueta con elipsis o límite de líneas: ${l.textContent}`)
    })
  }
  if (document.documentElement.scrollWidth > window.innerWidth + 1) out.push(`desborde de página ${document.documentElement.scrollWidth - window.innerWidth}px`)
  return out
}

const settle = (page) => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 40))))))
async function bench(page, { w, state, long, density }) {
  if (density !== undefined) await page.selectOption('#fm-bench-density', density)
  if (w !== undefined) await page.selectOption('#fm-bench-w', w)
  if (state !== undefined) await page.locator('#fm-bench-state').setChecked(state)
  if (long !== undefined) await page.locator('#fm-bench-long').setChecked(long)
  await settle(page)
}
// theme: '' | 'spotify' | 'lustre' | 'pg' (Tema de prueba del playground) | 'space5'; dark: bool; rtl: bool
async function open(browser, { vw = 1440, theme = '', dark = false, rtl = false, ctxOpts = {} } = {}) {
  const ctx = await browser.newContext({ viewport: { width: vw, height: 900 }, colorScheme: dark ? 'dark' : 'light', reducedMotion: 'reduce', ...ctxOpts })
  await ctx.addInitScript(() => { try { localStorage.clear() } catch {} })
  const page = await ctx.newPage()
  const errs = []
  page.on('console', (m) => { const t = m.text(); if (m.type() === 'error' && !/favicon/.test(t)) errs.push('console: ' + t); else if (m.type() === 'warning' && /ResizeObserver|\[Vue warn\]|\[Grana/.test(t)) errs.push('warning: ' + t) })
  page.on('pageerror', (e) => { if (!/ResizeObserver loop/.test(e.message)) errs.push('pageerror: ' + e.message) })
  await page.goto(PAGE)
  await page.waitForSelector('#sec-form .g-form-row[data-lines]')
  if (theme === 'pg') await page.click('#pg-theme-test')
  else if (theme === 'space5') await page.addStyleTag({ content: SPACE5 })
  else if (theme) await page.addStyleTag({ content: await GEN(theme) })
  if (rtl) await page.evaluate(() => { document.documentElement.dir = 'rtl' })
  await page.evaluate(() => document.fonts.ready)
  await page.locator('#sec-form').scrollIntoViewIfNeeded()
  await settle(page)
  return { ctx, page, errs }
}

async function distribution(engine, browser, opts, label) {
  const { ctx, page, errs } = await open(browser, opts)
  for (const w of WIDTHS) for (const [state, long] of STATES) {
    await bench(page, { w, state, long })
    const g = await page.evaluate(geom)
    ok(engine, g.length === 0, `${label}contenedor ${w} mensajes=${state} largas=${long}: ${g.slice(0, 5).join(' · ')}`)
  }
  ok(engine, errs.length === 0, `${label}consola: ${errs.slice(0, 3).join(' | ')}`)
  await ctx.close()
  for (const vw of [360, 320]) {
    const { ctx, page, errs } = await open(browser, { ...opts, vw })
    for (const [state, long] of STATES) {
      await bench(page, { state, long })
      const g = await page.evaluate(geom)
      ok(engine, g.length === 0, `${label}ventana ${vw} mensajes=${state} largas=${long}: ${g.slice(0, 5).join(' · ')}`)
    }
    ok(engine, errs.length === 0, `${label}consola ventana ${vw}: ${errs.slice(0, 3).join(' | ')}`)
    await ctx.close()
  }
}

/* ---------- Contraste (Chromium): colores computados resueltos por canvas, alfa compuesto sobre los ancestros ---------- */
const measure = () => {
  const cv = document.createElement('canvas'); cv.width = cv.height = 1; const cx = cv.getContext('2d', { willReadFrequently: true })
  const rgba = (c) => { cx.clearRect(0, 0, 1, 1); cx.fillStyle = '#000'; cx.fillStyle = c; cx.fillRect(0, 0, 1, 1); const d = cx.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255] }
  const over = (top, bot) => { const a = top[3]; return [top[0] * a + bot[0] * (1 - a), top[1] * a + bot[1] * (1 - a), top[2] * a + bot[2] * (1 - a), 1] }
  const bgOf = (el) => { const stack = []; for (let e = el; e; e = e.parentElement) { const c = rgba(getComputedStyle(e).backgroundColor); if (c[3] > 0) { stack.push(c); if (c[3] >= 1) break } } let acc = [255, 255, 255, 1]; for (const c of stack.reverse()) acc = over(c, acc); return acc }
  const L = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]) }
  const ratio = (a, b) => { const x = L(a), y = L(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) }
  const q = (s) => (typeof s === 'string' ? document.querySelector(s) : s)
  const fg = (el, prop = 'color', pseudo) => rgba(getComputedStyle(el, pseudo).getPropertyValue(prop))
  const text = (s, bgSel) => { const el = q(s); if (!el) return null; const b = bgOf(bgSel ? q(bgSel) : el); return ratio(over(fg(el), b), b) }
  const borderOut = (s) => { const el = q(s); if (!el) return null; const out = bgOf(el.parentElement); return ratio(over(fg(el, 'border-top-color'), out), out) }
  const borderIn = (s, prop = 'border-top-color') => { const el = q(s); if (!el) return null; const b = bgOf(el); return ratio(over(fg(el, prop), b), b) }
  const r = {}
  const T = (k, v, min) => { r[k] = { v: v == null ? null : +v.toFixed(2), min } }
  T('etiqueta', text('label[for="fs-nombre"]'), 4.5)
  T('asterisco', text('#sec-form .g-input__required'), 3)
  T('«(opcional)»', text('#sec-form .g-input__optional'), 4.5)
  T('ayuda', text('#sec-form .g-input__hint'), 4.5)
  T('descripción de sección', text('#fm-medium .g-form-section__description'), 4.5)
  T('insignia «Opcional» de sección', text('#fm-medium .g-form-section__optional, #fm-medium .g-form-section .g-badge'), 4.5)
  T('estado del pie', text('#fm-medium .g-form-actions__status'), 4.5)
  T('mensaje error', text('#sec-form .is-invalid .g-input__message:not(:empty), #sec-form .g-input-group.is-invalid .g-input-group__message:not(:empty)'), 4.5)
  T('mensaje advertencia', text('#sec-form .is-warning .g-input-group__message:not(:empty), #sec-form .is-warning .g-input__message:not(:empty)'), 4.5)
  T('mensaje válido', text('#sec-form .is-valid .g-input__message:not(:empty)'), 4.5)
  T('borde de error', borderOut('#sec-form .g-input.is-invalid .g-input__control'), 3)
  T('borde de advertencia (IG)', borderOut('#sec-form .g-input-group.is-warning .g-input-group__box'), 3)
  T('borde válido', borderOut('#sec-form .g-input.is-valid .g-input__control'), 3)
  T('borde de caja en reposo', borderOut(q('#fs-nombre').closest('.g-input__control')), 3)
  T('borde de IG en reposo', borderOut('#fs-tel .g-input-group__box'), 3)
  T('sufijo (kg)', text(q('#fm-peso').closest('.g-input').querySelector('.g-input__suffix'), q('#fm-peso').closest('.g-input__control')), 4.5)
  T('IG «mmHg»', text('#fm-pa .g-input-group__part--text:has(+ .g-input-group__text-label)', '#fm-pa .g-input-group__box'), 4.5)
  T('IG «/»', text('#fm-pa .g-input-group__part--text', '#fm-pa .g-input-group__box'), 4.5)
  T('IG «años»', text('#fj-rango .g-input-group__part--text:last-of-type', '#fj-rango .g-input-group__box'), 4.5)
  T('IG valor del selector', text('#fs-tel-pais', '#fs-tel .g-input-group__box'), 4.5)
  { const i = q('#fs-tel .g-input-group__select-icon'); const b = bgOf(i.parentElement); T('chevron-down del selector', ratio(over(fg(i), b), b), 3) }
  T('separador entre partes (decorativo, border-strong)', borderIn(q('#fs-tel-num').closest('.g-input-group__part'), 'border-inline-start-color'), 0)
  { const p = q('#sec-form .g-input-group__part.is-invalid'); T('marca de la parte inválida', p && (() => { const b = bgOf(p); return ratio(over(fg(p, 'background-color', '::after'), b), b) })(), 3) }
  { const g = q('#fs-tel'); const b = bgOf(q('#fs-tel .g-input-group__box')); T('anillo de foco por parte (color)', ratio(over(rgba(getComputedStyle(g).getPropertyValue('--_focus')), b), b), 3) }
  // Solo lectura: GForm readonly (#fm-view) y GInputGroup readonly (#fj-ro), relleno neutral-soft
  const v = q('#fm-view')
  T('solo lectura: valor GInput', text(v.querySelector('.g-input input'), v.querySelector('.g-input .g-input__control')), 4.5)
  { const s = [...v.querySelectorAll('.g-input')].find((x) => x.querySelector('.g-input__suffix')); T('solo lectura: sufijo', text(s.querySelector('.g-input__suffix'), s.querySelector('.g-input__control')), 4.5) }
  T('solo lectura: valor GSelect', text(v.querySelector('.g-select__value') || v.querySelector('.g-select input'), v.querySelector('.g-select__control')), 4.5)
  T('solo lectura: fecha', text(v.querySelector('.g-datepicker__value'), v.querySelector('.g-datepicker__field')), 4.5)
  T('solo lectura: output de fecha', text(v.querySelector('.g-datepicker__output'), v.querySelector('.g-datepicker__field')), 4.5)
  T('solo lectura: GTextarea', text(v.querySelector('textarea'), v.querySelector('.g-textarea__control')), 4.5)
  T('solo lectura: IG valor', text('#fj-ro-n', '#fj-ro .g-input-group__box'), 4.5)
  T('solo lectura: IG selector como texto', text('#fj-ro-p', '#fj-ro .g-input-group__box'), 4.5)
  T('solo lectura: borde por fuera', borderOut(v.querySelector('.g-input .g-input__control')), 3)
  T('solo lectura: borde sobre su relleno', borderIn(v.querySelector('.g-input .g-input__control')), 3)
  T('solo lectura: borde IG sobre su relleno', borderIn('#fj-ro .g-input-group__box'), 3)
  T('solo lectura: separador IG (discontinuo)', borderIn(q('#fj-ro-n').closest('.g-input-group__part'), 'border-inline-start-color'), 3)
  const fill = bgOf(v.querySelector('.g-input .g-input__control')), surf = bgOf(q('#fs-nombre').closest('.g-input__control'))
  r.L8 = { fill: L(fill).toFixed(4), surface: L(surf).toFixed(4) }
  return r
}

async function contrast(browser) {
  const out = {}
  for (const theme of ['', 'spotify', 'pg', 'space5']) for (const dark of theme === 'space5' ? [false] : [false, true]) {
    const { ctx, page } = await open(browser, { theme, dark })
    await bench(page, { state: true })
    // advertencia de temperatura: escribir una lectura alta; error de parte: teléfono corto en el formulario corto
    await page.fill('#fm-temp-v', '38.5'); await page.locator('#fm-temp-v').blur()
    await page.waitForTimeout(150)
    const r = await page.evaluate(measure)
    const key = (theme || 'defecto') + (dark ? ' oscuro' : ' claro')
    out[key] = r
    for (const [k, v] of Object.entries(r)) {
      if (k === 'L8') { const f = +v.fill, s = +v.surface; ok('chromium', dark ? f >= s : f <= s, `${key}: L8 relleno de solo lectura (${v.fill} vs superficie ${v.surface})`); continue }
      ok('chromium', v.v != null && v.v >= v.min, `${key}: ${k} = ${v.v} (mín ${v.min})`)
    }
    // Resumen de errores (tras enviar el mediano)
    await page.click('#fm-medium button[type="submit"][value="save"]')
    await page.waitForSelector('#fm-medium .g-error-summary a')
    const s = await page.evaluate(() => {
      const cv = document.createElement('canvas'); cv.width = cv.height = 1; const cx = cv.getContext('2d', { willReadFrequently: true })
      const rgba = (c) => { cx.clearRect(0, 0, 1, 1); cx.fillStyle = '#000'; cx.fillStyle = c; cx.fillRect(0, 0, 1, 1); const d = cx.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255] }
      const L = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]) }
      const bg = (el) => { for (let e = el; e; e = e.parentElement) { const c = rgba(getComputedStyle(e).backgroundColor); if (c[3] >= 1) return c } return [255, 255, 255, 1] }
      const ratio = (a, b) => { const x = L(a), y = L(b); return +((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)).toFixed(2) }
      const sum = document.querySelector('#fm-medium .g-error-summary'); const a = sum.querySelector('a'); const t = sum.querySelector('.g-error-summary__title') || sum.querySelector('h2,h3,h4,h5,p')
      return { titulo: ratio(rgba(getComputedStyle(t).color), bg(t)), enlace: ratio(rgba(getComputedStyle(a).color), bg(a)), borde: ratio(rgba(getComputedStyle(sum).borderTopColor), bg(sum.parentElement)), focused: document.activeElement === sum || sum.contains(document.activeElement) }
    })
    out[key].resumen = s
    ok('chromium', s.titulo >= 4.5 && s.enlace >= 4.5 && s.borde >= 3 && s.focused, `${key}: resumen ${JSON.stringify(s)}`)
    await ctx.close()
  }
  return out
}

async function extras(browser) {
  const R = {}
  // Táctil (pointer: coarse) compacto a 360
  {
    const { ctx, page } = await open(browser, { vw: 400, ctxOpts: { hasTouch: true, isMobile: true } })
    await bench(page, { density: 'compact', w: '360' })
    R.tactil = await page.evaluate(() => {
      const h = (s) => Math.min(...[...document.querySelectorAll(s)].filter((e) => e.offsetParent).map((e) => e.getBoundingClientRect().height))
      const w = (s) => Math.min(...[...document.querySelectorAll(s)].filter((e) => e.offsetParent && !e.closest('.is-disabled')).map((e) => e.getBoundingClientRect().width))
      return {
        coarse: matchMedia('(pointer: coarse)').matches,
        input: h('#sec-form .g-input__control'), select: h('#sec-form .g-select__control'), fecha: h('#sec-form .g-datepicker__field'),
        caja_IG: h('#sec-form .g-input-group__box'), parte_IG_ancho: w('#sec-form .g-input-group__part--input, #sec-form .g-input-group__part--select'),
        casilla: h('#sec-form .g-checkbox'), interruptor: h('#sec-form .g-switch'),
        pie: Math.min(...[...document.querySelectorAll('#fm-medium .g-form-actions .g-btn')].map((b) => { const a = getComputedStyle(b, '::after'); return Math.max(b.getBoundingClientRect().height, parseFloat(a.blockSize) || 0) }))
      }
    })
    const t = R.tactil
    ok('chromium', t.coarse && Object.entries(t).every(([k, v]) => k === 'coarse' || v >= 44), `táctil compacto a 360: ${JSON.stringify(t)}`)
    await ctx.close()
  }
  // Selector de solo lectura de GInputGroup (input con size): mide su texto, sin recorte, sin flecha, mismo alto
  {
    const { ctx, page } = await open(browser, {})
    R.selectorSoloLectura = {}
    for (const w of ['1280', '320']) {
      await bench(page, { w })
      R.selectorSoloLectura[w] = await page.evaluate(() => {
        const ro = document.getElementById('fj-ro-p'); const ed = document.getElementById('fj-dis-p')
        const part = ro.closest('.g-input-group__part')
        return { size: ro.size, texto: ro.value, ancho: Math.round(part.getBoundingClientRect().width), anchoEditable: Math.round(ed.closest('.g-input-group__part').getBoundingClientRect().width), recortado: ro.scrollWidth > ro.clientWidth + 1, flecha: !!part.querySelector('.g-input-group__select-icon'), alto: ro.getBoundingClientRect().height, altoCaja: ro.closest('.g-input-group__box').clientHeight }
      })
      const s = R.selectorSoloLectura[w]
      ok('chromium', !s.recortado && !s.flecha && s.ancho <= s.anchoEditable + 1 && Math.abs(s.alto - s.altoCaja) <= 1, `selector de solo lectura a ${w}: ${JSON.stringify(s)}`)
    }
    // Densidades: altura de caja de GInput y GInputGroup iguales en cada densidad
    R.densidades = {}
    await bench(page, { w: '960' })
    for (const d of ['default', 'comfortable', 'compact']) {
      await bench(page, { density: d })
      R.densidades[d] = await page.evaluate(() => ({ input: document.querySelector('#fs-nombre').closest('.g-input__control').getBoundingClientRect().height, ig: document.querySelector('#fs-tel .g-input-group__box').getBoundingClientRect().height, select: document.querySelector('#fm-sexo').closest('.g-select').querySelector('.g-select__control').getBoundingClientRect().height, fila: getComputedStyle(document.querySelector('#fm-short .g-form-layout')).rowGap }))
      const x = R.densidades[d]
      ok('chromium', Math.abs(x.input - x.ig) <= 0.5 && Math.abs(x.input - x.select) <= 0.5, `densidad ${d}: ${JSON.stringify(x)}`)
    }
    await ctx.close()
  }
  // forced-colors y prefers-contrast
  {
    const { ctx, page } = await open(browser, {})
    await bench(page, { state: true })
    await page.emulateMedia({ forcedColors: 'active' })
    await page.focus('#fs-tel-num'); await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Tab')
    R.forced = await page.evaluate(() => {
      const part = document.activeElement.closest('.g-input-group__part')
      const inv = document.querySelector('#sec-form .g-input-group__part.is-invalid')
      const view = document.querySelector('#fm-view .g-input .g-input__control')
      return {
        foco: document.activeElement.id, anilloParte: getComputedStyle(part).outlineStyle, anilloCaja: getComputedStyle(part.parentElement).outlineStyle,
        soloLectura: getComputedStyle(view).borderTopStyle, soloLecturaIG: getComputedStyle(document.querySelector('#fj-ro .g-input-group__box')).borderTopStyle,
        parteInvalida: inv ? getComputedStyle(inv, '::after').backgroundColor : 'sin parte inválida',
        advertencia: getComputedStyle(document.querySelector('#sec-form .g-input-group.is-warning .g-input-group__box') || document.body).borderTopStyle,
        separador: getComputedStyle(document.querySelector('#fs-tel-num').closest('.g-input-group__part')).borderInlineStartStyle,
        errorIG: getComputedStyle(document.querySelector('#sec-form .g-input-group.is-invalid .g-input-group__box') || document.body).borderTopWidth
      }
    })
    const f = R.forced
    ok('chromium', f.anilloParte === 'solid' && f.anilloCaja !== 'solid' && f.soloLectura === 'dashed' && f.soloLecturaIG === 'dashed' && !/rgba\(0, 0, 0, 0\)|sin parte/.test(f.parteInvalida) && f.separador === 'solid', `forced-colors: ${JSON.stringify(f)}`)
    await page.emulateMedia({ forcedColors: 'none', contrast: 'more' })
    await page.mouse.move(0, 0); await page.waitForTimeout(300)
    R.prefersContrast = await page.evaluate(() => [getComputedStyle(document.querySelector('#fs-tel-num').closest('.g-input-group__part')).borderInlineStartColor, getComputedStyle(document.querySelector('#fs-nombre').closest('.g-input__control')).borderTopColor, getComputedStyle(document.querySelector('#fm-medium .g-form-actions')).borderTopColor])
    ok('chromium', R.prefersContrast[0] === R.prefersContrast[1], `prefers-contrast: more → separador = borde de control (${R.prefersContrast})`)
    await ctx.close()
  }
  return R
}

/* 2.4.11: Tab por el formulario mediano sin que el pie fijo tape el foco; altura del pie apilado */
async function sticky(engine, browser, rtl = false) {
  const res = {}
  for (const vw of [1280, 320]) {
    const { ctx, page, errs } = await open(browser, { vw, rtl })
    await page.evaluate(() => window.scrollTo(0, document.querySelector('#fm-medium').getBoundingClientRect().top + scrollY - 40))
    await page.focus('#fm-nombre')
    const hidden = []; let seen = 0
    for (let i = 0; i < 45; i++) {
      const r = await page.evaluate(() => new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(() => {
        const a = document.activeElement; if (!a || !a.closest('#fm-medium')) return res(null)
        const bar = document.querySelector('#fm-medium .g-form-actions'); if (a.closest('.g-form-actions')) return res({ id: 'pie', under: false })
        res({ id: a.id || a.name, under: a.getBoundingClientRect().bottom > bar.getBoundingClientRect().top + 0.5 })
      }))))
      if (!r) break
      seen++; if (r.under) hidden.push(r.id)
      await page.keyboard.press('Tab')
    }
    const foot = await page.evaluate(() => { const a = document.querySelector('#fm-medium .g-form-actions'); const p = a.querySelector('.g-btn--variant-solid'); return { alto: Math.round(a.getBoundingClientRect().height), apilado: a.hasAttribute('data-stacked'), primariaArriba: [...a.querySelectorAll('.g-btn')].every((b) => b === p || b.getBoundingClientRect().top > p.getBoundingClientRect().top), fijo: getComputedStyle(a).position } })
    res[vw] = { paradas: seen, tapados: hidden, ...foot }
    ok(engine, hidden.length === 0 && seen > 15, `${rtl ? 'RTL ' : ''}pie fijo ${vw}: ${seen} paradas, tapados: ${hidden.join(',')}`)
    if (vw === 320) ok(engine, foot.apilado && foot.primariaArriba && foot.alto < 177, `${rtl ? 'RTL ' : ''}pie apilado a 320: ${JSON.stringify(foot)}`)
    ok(engine, errs.length === 0, `consola pie ${vw}: ${errs.slice(0, 3).join(' | ')}`)
    await ctx.close()
  }
  return res
}

/* RTL: sentido de las partes, del pie y de los mensajes (Chromium, Firefox, WebKit) */
async function rtlChecks(engine, browser) {
  const { ctx, page } = await open(browser, { rtl: true })
  await bench(page, { state: true, w: '960' })
  const r = await page.evaluate(() => {
    const x = (s) => document.querySelector(s).getBoundingClientRect()
    const pais = x('#fs-tel-pais'), num = x('#fs-tel-num'), nom = x('#fs-nombre'), ape = x('#fs-apellido')
    const chev = document.querySelector('#fs-tel .g-input-group__select-icon').getBoundingClientRect(), part = document.querySelector('#fs-tel-pais').closest('.g-input-group__part').getBoundingClientRect()
    const div = getComputedStyle(document.querySelector('#fs-tel-num').closest('.g-input-group__part'))
    const act = document.querySelector('#fm-medium .g-form-actions'); const btns = [...act.querySelectorAll('.g-btn')]
    const p = act.querySelector('.g-btn--variant-solid')
    const msg = document.querySelector('#sec-form .g-input.is-invalid .g-input__message:not(:empty)')
    const icon = msg?.querySelector('.g-icon, svg')
    const suf = document.querySelector('#fm-peso').closest('.g-input__control').querySelector('.g-input__suffix')
    return {
      paisALaDerecha: pais.left > num.left, nombreALaDerecha: nom.left > ape.left,
      flechaALaIzquierdaDeSuParte: chev.left - part.left < part.right - chev.right,
      separadorDerecho: div.borderRightStyle === 'solid' && div.borderLeftStyle === 'none',
      primariaALaIzquierda: btns.every((b) => b === p || b.getBoundingClientRect().left >= p.getBoundingClientRect().left),
      iconoMensajeALaDerecha: icon ? icon.getBoundingClientRect().left > msg.getBoundingClientRect().left + msg.getBoundingClientRect().width / 2 : null,
      sufijoALaIzquierda: suf.getBoundingClientRect().left < document.querySelector('#fm-peso').getBoundingClientRect().left
    }
  })
  ok(engine, Object.values(r).every((v) => v === true), `RTL sentido: ${JSON.stringify(r)}`)
  await ctx.close()
  return r
}

async function shots(browser) {
  await mkdir(SHOTS, { recursive: true })
  for (const dark of [false, true]) for (const vw of [1280, 720, 360]) for (const state of [false, true]) {
    const { ctx, page } = await open(browser, { vw, dark })
    await page.addStyleTag({ content: '.pg-top, .pg-bar, .pg-header { position: static !important }' })
    await bench(page, { state, long: state })
    for (const id of ['fm-short', 'fm-medium', 'fm-address', 'fm-join', 'fm-group', 'fm-view']) {
      await page.locator('#' + id).screenshot({ path: `${SHOTS}/${id}-${vw}-${dark ? 'oscuro' : 'claro'}${state ? '-estados' : ''}.png` })
    }
    await ctx.close()
  }
  for (const theme of ['spotify', 'pg']) for (const dark of [false, true]) {
    const { ctx, page } = await open(browser, { vw: 1280, theme, dark })
    await bench(page, { state: true })
    await page.locator('#fm-medium').screenshot({ path: `${SHOTS}/fm-medium-${theme}-${dark ? 'oscuro' : 'claro'}.png` })
    await page.locator('#fm-join').screenshot({ path: `${SHOTS}/fm-join-${theme}-${dark ? 'oscuro' : 'claro'}.png` })
    await ctx.close()
  }
  {
    const { ctx, page } = await open(browser, { vw: 1280, rtl: true })
    await bench(page, { state: true, w: '720' })
    for (const id of ['fm-short', 'fm-medium', 'fm-join']) await page.locator('#' + id).screenshot({ path: `${SHOTS}/${id}-rtl-720.png` })
    await ctx.close()
  }
}

const summary = {}
for (const engine of ENGINES) {
  const browser = await pw[engine].launch()
  await distribution(engine, browser, { rtl: true }, 'RTL · ')
  summary[engine] = { rtl: await rtlChecks(engine, browser), pie: await sticky(engine, browser), pieRtl: await sticky(engine, browser, true) }
  if (engine === 'chromium') {
    await distribution(engine, browser, { theme: 'spotify', dark: true }, 'spotify oscuro · ')
    await distribution(engine, browser, { theme: 'pg' }, 'tema de prueba claro · ')
    await distribution(engine, browser, { theme: 'pg', dark: true }, 'tema de prueba oscuro · ')
    await distribution(engine, browser, { theme: 'space5' }, 'space 5 · ')
    await distribution(engine, browser, { theme: 'space5', rtl: true }, 'space 5 RTL · ')
    summary.contraste = await contrast(browser)
    summary.extras = await extras(browser)
    if (args.shots) await shots(browser)
  }
  await browser.close()
}
server.close()
for (const [e, r] of Object.entries(report)) {
  console.log(`\n${e}: ${r.pass}/${r.pass + r.fail.length} OK`)
  for (const f of r.fail.slice(0, 40)) console.log('  ✗ ' + f)
}
if (summary.contraste) {
  const keys = Object.keys(Object.values(summary.contraste)[0]).filter((k) => k !== 'L8' && k !== 'resumen')
  console.log('\nContraste (' + Object.keys(summary.contraste).join(' · ') + '):')
  for (const k of keys) { const vals = Object.values(summary.contraste).map((r) => r[k].v); console.log(`  ${k}: ${vals.join(' / ')}  (mín ${Math.min(...vals.filter((x) => x != null))})`) }
  console.log('  L8: ' + Object.entries(summary.contraste).map(([t, r]) => `${t} ${r.L8.fill}/${r.L8.surface}`).join(' · '))
  console.log('  resumen: ' + Object.entries(summary.contraste).map(([t, r]) => `${t} ${JSON.stringify(r.resumen)}`).join(' · '))
}
const { contraste, ...rest } = summary
console.log('\n' + JSON.stringify(rest, null, 1))
console.log(`\nTotal: ${total - failed}/${total} OK`)
process.exit(failed ? 1 : 0)
