// Contraste de lo marcado (tokens.md §7.1; DECISIONS.md #431 y #432) · verificación de coco sobre los COMPONENTES REALES
// (banco.html: dist/grana.css y grana.umd.js tal como se publican).
// Apartados (--only=<lista>):
//   static   · el CSS fuente usa {familia}-text en cada selector del encargo (checkbox.md §«Contraste de lo marcado»)
//   contrast · contorno ≥ 3:1 contra surface, bg, surface-sunken, el fondo real y, donde ocurre, {familia}-soft; temas por
//              defecto, lustre, spotify y primary propia (#107), claro y oscuro, brand, accent y warning; tres motores.
//              Además, sin cambiar nada (informativo, para lima): franja de rango de GDatePicker, avance de GProgress,
//              conector de GStepper, variantes dot/line/segment de GStepper y la píldora del navbar de GSidebar (#431)
//   delta    · Δ0 visible en el tema por defecto (claro y oscuro): captura píxel a píxel de cada escena con el CSS anterior
//              (GRANA_DIST_ANTES=<copia de dist previa>, servida en /__antes/) y con el actual; hover informativo aparte
// Ejecutar desde la raíz (requiere `npm run build`): GRANA_PW_PORT=4209 node design/lab/contraste-marcado/verificar.mjs
// GRANA_DIST=<copia de dist> sirve /packages/vue/dist/ desde otra copia (otra sesión puede estar reconstruyendo dist/).
// El banco carga el JS de /__antes/ (el mismo dist si no hay GRANA_DIST_ANTES): el cambio es solo de CSS.
// Opciones: --engines=chromium,firefox,webkit  --themes=default,lustre,spotify,primary  --only=contrast  --verbose  --serve
import http from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const pw = await import(new URL('../theme-playground/node_modules/playwright/index.mjs', import.meta.url))
const ROOT = fileURLToPath(new URL('../../../', import.meta.url))
const ANTES = process.env.GRANA_DIST_ANTES || null
const DIST = process.env.GRANA_DIST || null
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')).map(([k, v]) => [k, v ?? true]))
const ENGINES = (args.engines || 'chromium,firefox,webkit').split(',')
const THEMES = (args.themes || 'default,lustre,spotify,primary').split(',')
const ONLY = args.only ? new Set(String(args.only).split(',')) : null
const run = (k) => !ONLY || ONLY.has(k)
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.woff2': 'font/woff2', '.svg': 'image/svg+xml' }
const server = http.createServer(async (req, res) => {
  try {
    const rel = decodeURIComponent(new URL(req.url, 'http://x').pathname)
    const dist = DIST || join(ROOT, 'packages/vue/dist')
    const p = rel.startsWith('/__antes/') ? join(ANTES || dist, rel.slice('/__antes/'.length))
      : DIST && rel.startsWith('/packages/vue/dist/') ? join(DIST, rel.slice('/packages/vue/dist/'.length)) : normalize(join(ROOT, rel))
    if (!p.startsWith(ROOT) && !(ANTES && p.startsWith(ANTES)) && !(DIST && p.startsWith(DIST))) throw new Error('fuera')
    res.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream' }).end(await readFile(p))
  } catch { if (!res.headersSent) res.writeHead(404).end() }
})
await new Promise((r) => server.listen(Number(process.env.GRANA_PW_PORT) || 4209, '127.0.0.1', r))
const ORIGIN = `http://127.0.0.1:${server.address().port}`
const BANK = `${ORIGIN}/design/lab/contraste-marcado/banco.html`
if (args.serve) { console.log(BANK + '?scene=controls'); await new Promise(() => {}) }

let total = 0, failed = 0, ENG = ''
const fails = [], notes = {}
const ok = (cond, msg) => { total++; if (!cond) { failed++; fails.push(`[${ENG}] ${msg}`) } }
const note = (k, v) => { (notes[k] ??= []).push(v) }
const r2 = (n) => Math.round(n * 100) / 100

/* ---------- Color ---------- */
const parse = (s) => {
  if (!s) return null
  let m = s.match(/rgba?\(\s*([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)/)
  if (m) return [+m[1] / 255, +m[2] / 255, +m[3] / 255, m[4] == null ? 1 : m[4].endsWith('%') ? parseFloat(m[4]) / 100 : +m[4]]
  m = s.match(/color\(srgb\s+([\d.e-]+)\s+([\d.e-]+)\s+([\d.e-]+)(?:\s*\/\s*([\d.]+))?\)/)
  if (m) return [+m[1], +m[2], +m[3], m[4] == null ? 1 : +m[4]]
  return null
}
const lum = ([r, g, b]) => { const f = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4); return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) }
const over = (fg, bg) => (fg[3] >= 1 ? fg : [0, 1, 2].map((i) => fg[i] * fg[3] + bg[i] * (1 - fg[3])).concat(1))
const ratio = (a, b) => { const A = parse(a), B = parse(b); if (!A || !B) return NaN; const x = lum(over(A, B)), y = lum(B); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) }

/* ---------- 0 · Estático ---------- */
if (run('static')) {
  ENG = 'estático'
  const css = async (c) => (await readFile(join(ROOT, `packages/vue/src/components/${c}/${c}.css`), 'utf8')).replace(/\/\*[\s\S]*?\*\//g, '')
  const rule = (src, sel) => { const i = src.indexOf(sel + ' {'); if (i < 0) return null; return src.slice(i, src.indexOf('}', i)) }
  const expect = [
    ['GCheckbox', '.g-checkbox__input:checked', /border-color: var\(--_text\)/],
    ['GCheckbox', '.g-checkbox__input:indeterminate', /border-color: var\(--_text\)/],
    ['GCheckbox', '.g-checkbox--layout-chip .g-checkbox__row:has(.g-checkbox__input:checked)', /border-color: var\(--_text\)/],
    ['GSwitch', '.g-switch__input:checked', /border-color: var\(--_text\)/],
    ['GMenu', '[aria-checked="true"] > .g-menu__mark', /border-color: var\(--g-color-primary-text\)/],
    ['GTable', '.g-table__select input[type="checkbox"]', /accent-color: var\(--g-color-primary-text\)/],
    ['GTable', '.g-table--mode-cards .g-table__row.is-selected', /border-color: var\(--g-color-primary-text\)/],
    ['GFilterBar', '.g-filter-bar__value input[type="checkbox"]', /accent-color: var\(--g-color-primary-text\)/],
    ['GCalendar', '.g-calendar__toolbar button[aria-pressed="true"]', /border-color: var\(--g-color-primary-text\)/],
    ['GCalendar', '.g-calendar__strip > button[aria-pressed="true"]', /inset 0 0 0 var\(--g-border-width\) var\(--g-color-primary-text\)/],
    ['GCalendar', '.g-calendar__month td[aria-current="date"] .g-calendar__day', /inset 0 0 0 var\(--g-border-width\) var\(--g-color-primary-text\)/],
    ['GCalendar', '.g-calendar__head[aria-current="date"] .g-calendar__head-title', /inset 0 0 0 var\(--g-border-width\) var\(--g-color-primary-text\)/],
    ['GDatePicker', '.g-datepicker__day.is-selected', /inset 0 0 0 var\(--g-border-width\) var\(--_text\)/],
    ['GStepper', '.g-stepper__step.is-complete .g-stepper__indicator', /border-color: var\(--_text\)/],
    ['GStepper', '.g-stepper__step.is-current .g-stepper__indicator', /border-color: var\(--_text\)/],
    ['GWidgetGallery', '.g-widget-gallery__cat > input:checked + span', /border-color: var\(--g-color-primary-text\)/],
    ['GCombobox', '.g-combobox__option[aria-selected="true"] > .g-combobox__box', /border-color: var\(--g-color-primary-text\)/]
  ]
  for (const [c, sel, re] of expect) { const r = rule(await css(c), sel); ok(r && re.test(r), `${c}: ${sel} → ${re}`) }
  // Las familias de GSwitch y GDatePicker llevan --_text (siete colores y el bloque base)
  for (const [c, pre] of [['GSwitch', '.g-switch--color-'], ['GDatePicker', '.g-datepicker--color-']]) {
    const src = await css(c)
    for (const f of ['brand', 'accent', 'neutral', 'success', 'warning', 'danger', 'info']) {
      const tok = f === 'brand' ? 'primary' : f
      ok(new RegExp(`\\${pre}${f} \\{[^}]*--_text: var\\(--g-color-${tok}-text\\)`).test(src), `${c}: ${pre}${f} con --_text`)
    }
  }
  // Sin respaldo ni literales de color en los archivos tocados
  for (const c of ['GCheckbox', 'GSwitch', 'GMenu', 'GTable', 'GFilterBar', 'GCalendar', 'GDatePicker', 'GStepper', 'GWidgetGallery', 'GCombobox']) {
    const src = await css(c)
    ok(!/var\(\s*--g-[\w-]+\s*,/.test(src), `${c}: sin valores de respaldo en tokens`)
    ok(!/#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch)\(/.test(src), `${c}: sin literales de color`)
  }
}

/* ---------- Medida en página ---------- */
const HELPERS = `
  const H = {
    tok(n) { const d = document.createElement('i'); d.style.color = 'var(' + n + ')'; document.body.append(d); const c = getComputedStyle(d).color; d.remove(); return c },
    clear(c) { return !c || c === 'transparent' || /rgba\\([^)]*,\\s*0\\)$/.test(c) || /\\/\\s*0\\)$/.test(c) },
    bgOf(el) { for (let e = el.parentElement; e; e = e.parentElement) { const c = getComputedStyle(e).backgroundColor; if (!H.clear(c)) return c } return H.tok('--g-color-bg') },
    shadows(el) { const s = getComputedStyle(el).boxShadow; if (!s || s === 'none') return []; return s.split(/,(?![^(]*\\))/).map((p) => ({ inset: /inset/.test(p), c: (p.match(/(rgba?\\([^)]*\\)|color\\([^)]*\\))/) || [])[0] })) },
    inset(el) { const s = H.shadows(el).filter((x) => x.inset); return s.length ? s[0].c : null },
    fam(el) { const c = (el.closest('[data-color]') || {}).dataset?.color || 'brand'; return c === 'brand' ? 'primary' : c },
    all(dc, sel) { return [...new Set([...document.querySelectorAll('[data-case="' + dc + '"]')].flatMap((e) => e.matches(sel) ? [e] : e.querySelector(sel) ? [...e.querySelectorAll(sel)] : e.closest(sel) ? [e.closest(sel)] : []))] },
    vis(el) { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 }
  }
  const surf = () => ({ surface: H.tok('--g-color-surface'), bg: H.tok('--g-color-bg'), sunken: H.tok('--g-color-surface-sunken') })
  const rec = (comp, kase, el, color, extra = {}, opt = {}) => ({ comp, kase, fam: opt.fam || H.fam(el), color, against: { ...surf(), real: H.bgOf(el), ...extra }, min: opt.min ?? 3, info: !!opt.info, expect: opt.expect ? H.tok(opt.expect.replace('{f}', opt.fam || H.fam(el))) : null })
`
const MEASURE = {
  controls: `
    const out = []
    const soft = (el) => ({ soft: H.tok('--g-color-' + H.fam(el) + '-soft') })
    for (const el of H.all('cb-checked', '.g-checkbox__input')) out.push(rec('GCheckbox', 'cuadro marcado', el, getComputedStyle(el).borderTopColor, {}, { expect: '--g-color-{f}-text' }))
    for (const el of H.all('cb-mixed', '.g-checkbox__input')) out.push(rec('GCheckbox', 'cuadro indeterminado', el, getComputedStyle(el).borderTopColor, {}, { expect: '--g-color-{f}-text' }))
    for (const el of H.all('cb-chip', '.g-checkbox__row')) out.push(rec('GCheckbox', 'chip marcado', el, getComputedStyle(el).borderTopColor, {}, { expect: '--g-color-{f}-text' }))
    for (const el of H.all('cb-card', '.g-checkbox__row')) out.push(rec('GCheckbox', 'tarjeta seleccionada', el, getComputedStyle(el).borderTopColor, {}, { expect: '--g-color-{f}-text' }))
    for (const el of H.all('sw-on', '.g-switch__input')) out.push(rec('GSwitch', 'riel encendido', el, getComputedStyle(el).borderTopColor, {}, { expect: '--g-color-{f}-text' }))
    for (const el of H.all('rg-list', '.g-radio-group__input:checked')) out.push(rec('GRadioGroup', 'list: círculo elegido', el, getComputedStyle(el).borderTopColor, {}, { expect: '--g-color-{f}-text' }))
    for (const el of H.all('rg-chip', '.g-radio-group__option:has(> .g-radio-group__input:checked)')) out.push(rec('GRadioGroup', 'chip elegido', el, getComputedStyle(el).borderTopColor, {}, { expect: '--g-color-{f}-text' }))
    for (const el of H.all('rg-segmented', '.g-radio-group__option:has(> .g-radio-group__input:checked)')) out.push(rec('GRadioGroup', 'segmento elegido', el, H.inset(el), {}, { expect: '--g-color-{f}-text' }))
    for (const el of H.all('rg-card', '.g-radio-group__option:has(> .g-radio-group__input:checked)')) out.push(rec('GRadioGroup', 'tarjeta elegida', el, getComputedStyle(el).borderTopColor, {}, { expect: '--g-color-{f}-text' }))
    for (const k of ['number', 'dot']) {
      for (const el of H.all('st-' + k, '.g-stepper__step.is-complete .g-stepper__indicator')) out.push(rec('GStepper', k + ': completado', el, getComputedStyle(el).borderTopColor, {}, { expect: '--g-color-{f}-text' }))
      for (const el of H.all('st-' + k, '.g-stepper__step.is-current .g-stepper__indicator')) out.push(rec('GStepper', k + ': actual', el, getComputedStyle(el).borderTopColor, {}, { expect: '--g-color-{f}-text' }))
    }
    // Fuera de la regla (informativo, para lima)
    for (const el of H.all('st-dot', '.g-stepper__step.is-current .g-stepper__indicator')) { const s = H.shadows(el).filter((x) => !x.inset); if (s[1]) out.push(rec('GStepper', 'dot: anillo exterior del actual', el, s[1].c, {}, { info: true })) }
    for (const el of H.all('st-line', '.g-stepper__step.is-complete .g-stepper__hit')) out.push(rec('GStepper', 'line: raya del completado', el, getComputedStyle(el).borderBottomColor, {}, { info: true }))
    for (const el of H.all('st-segment', '.g-stepper__step.is-complete .g-stepper__indicator')) out.push(rec('GStepper', 'segment: tramo completado', el, H.tok('--g-color-' + H.fam(el)), { track: H.tok('--g-color-border-control') }, { info: true }))
    for (const el of H.all('st-number', '.g-stepper__connector.is-done')) out.push(rec('GStepper', 'conector hecho', el, H.tok('--g-color-' + H.fam(el)), { track: H.tok('--g-color-border-strong') }, { info: true }))
    for (const el of H.all('dp-range', '.g-datepicker__day.is-selected')) out.push(rec('GDatePicker', 'día elegido (rango)', el, H.inset(el), soft(el), { expect: '--g-color-{f}-text' }))
    for (const el of H.all('dp-today', '.g-datepicker__day.is-selected.is-today')) {
      // Elegido y hoy: aro on-{color} en el borde; la forma es el aro o, si se funde con la superficie, el relleno
      const cs = getComputedStyle(el); out.push({ ...rec('GDatePicker', 'día elegido y hoy (aro on o relleno)', el, H.inset(el)), alt: cs.backgroundColor })
    }
    for (const el of H.all('dp-range', '.g-datepicker__day.is-today:not(.is-selected)')) out.push(rec('GDatePicker', 'hoy sin elegir: aro text-muted', el, H.inset(el), {}, { info: true }))
    for (const td of H.all('dp-range', 'td.is-in-range')) {
      out.push(rec('GDatePicker', 'franja de rango: relleno soft', td, getComputedStyle(td, '::before').backgroundColor, {}, { info: true }))
      out.push(rec('GDatePicker', 'franja de rango: filo border-control', td, getComputedStyle(td, '::before').borderTopColor, {}, { info: true }))
    }
    for (const el of H.all('tb-table', '.g-table__select input:checked')) out.push(rec('GTable', 'casilla nativa (accent-color)', el, getComputedStyle(el).accentColor, { soft: H.tok('--g-color-primary-soft') }, { expect: '--g-color-primary-text', fam: 'primary' }))
    for (const el of H.all('tb-cards', '.g-table__row.is-selected')) out.push(rec('GTable', 'tarjeta seleccionada', el, getComputedStyle(el).borderTopColor, {}, { expect: '--g-color-primary-text', fam: 'primary' }))
    for (const el of H.all('pg', '.g-progress__fill')) out.push(rec('GProgress', 'avance contra su pista', el, getComputedStyle(el).backgroundColor, { track: getComputedStyle(el.parentElement).backgroundColor }, { info: true }))
    return out`,
  menu: `const out = []
    for (const el of document.querySelectorAll('[aria-checked="true"] > .g-menu__mark')) out.push(rec('GMenu', el.parentElement.getAttribute('role') === 'menuitemradio' ? 'marca de opción' : 'marca de casilla', el, getComputedStyle(el).borderTopColor, {}, { expect: '--g-color-primary-text', fam: 'primary' }))
    return out`,
  calendar: `const out = []
    for (const el of document.querySelectorAll('.g-calendar__toolbar button[aria-pressed="true"]')) out.push(rec('GCalendar', 'vista pulsada (barra)', el, getComputedStyle(el).borderTopColor, {}, { expect: '--g-color-primary-text', fam: 'primary' }))
    for (const el of document.querySelectorAll('.g-calendar__month td[aria-current="date"] .g-calendar__day, .g-calendar__month td.is-today .g-calendar__day')) out.push(rec('GCalendar', 'hoy en Mes', el, H.inset(el), {}, { expect: '--g-color-primary-text', fam: 'primary' }))
    return out`,
  week: `const out = []
    for (const el of document.querySelectorAll('.g-calendar__head.is-today .g-calendar__head-title, .g-calendar__head[aria-current="date"] .g-calendar__head-title')) out.push(rec('GCalendar', 'hoy en la cabecera', el, H.inset(el), {}, { expect: '--g-color-primary-text', fam: 'primary' }))
    return out`,
  strip: `const out = []
    for (const el of document.querySelectorAll('.g-calendar__strip > button[aria-pressed="true"]')) out.push(rec('GCalendar', 'día pulsado (tira)', el, H.inset(el), {}, { expect: '--g-color-primary-text', fam: 'primary' }))
    return out`,
  gallery: `const out = []
    for (const el of document.querySelectorAll('.g-widget-gallery__cat > input:checked + span')) out.push(rec('GWidgetGallery', 'categoría elegida', el, getComputedStyle(el).borderTopColor, {}, { expect: '--g-color-primary-text', fam: 'primary' }))
    return out`,
  comboboxA: `const out = []
    for (const el of document.querySelectorAll('#cm-a-list [role=option][aria-selected=true] > .g-combobox__box')) out.push(rec('GCombobox', 'casilla marcada (campo A)' + (el.parentElement.classList.contains('is-active') ? ', activa' : ''), el, getComputedStyle(el).borderTopColor, {}, { expect: '--g-color-primary-text', fam: 'primary' }))
    return out`,
  comboboxC: `const out = []
    for (const el of document.querySelectorAll('.g-combobox-surface [role=option][aria-selected=true] > .g-combobox__box')) {
      const act = el.parentElement.classList.contains('is-active')
      const r = rec('GCombobox', act ? 'casilla marcada (paleta, activa invertida: surface)' : 'casilla marcada (paleta)', el, getComputedStyle(el).borderTopColor, {}, { expect: act ? '--g-color-surface' : '--g-color-primary-text', fam: 'primary' })
      if (act) r.against = { real: r.against.real } // la fila activa invertida (fondo text) es la única superficie adyacente
      out.push(r)
    }
    return out`,
  filter: `const out = []
    for (const el of document.querySelectorAll('.g-filter-bar__value input[type="checkbox"]:checked')) out.push(rec('GFilterBar', 'casilla nativa (accent-color)', el, getComputedStyle(el).accentColor, {}, { expect: '--g-color-primary-text', fam: 'primary' }))
    return out`,
  navbar: `const out = []
    const tab = document.querySelector('.g-sidebar__bar > li.is-current .g-sidebar__tab'), others = [...document.querySelectorAll('.g-sidebar__bar > li:not(.is-current)')]
    const r = out.push({ ...rec('GSidebar', 'píldora del navbar (exenta: etiqueta y ancho)', tab, getComputedStyle(tab).backgroundColor, {}, { info: true, fam: 'primary' }),
      grow: tab.closest('li').getBoundingClientRect().width / Math.max(...others.map((o) => o.getBoundingClientRect().width)),
      labelShown: [...tab.querySelectorAll('*')].some((e) => e.textContent.trim() === 'Bandeja' && H.vis(e) && getComputedStyle(e).clip !== 'rect(0px, 0px, 0px, 0px)' && getComputedStyle(e).clipPath !== 'inset(50%)'),
      othersLabel: others.some((o) => [...o.querySelectorAll('*')].some((e) => e.children.length === 0 && e.textContent.trim() && H.vis(e) && getComputedStyle(e).clipPath !== 'inset(50%)' && e.getBoundingClientRect().width > 2)) })
    return out`
}
const SCENES = [
  { scene: 'controls', m: ['controls'] },
  { scene: 'menu', m: ['menu'], prep: async (p) => { await p.locator('button', { hasText: 'Vista' }).click(); await p.waitForTimeout(300); await p.waitForSelector('[aria-checked="true"] > .g-menu__mark', { state: 'visible', timeout: 5000 }) } },
  { scene: 'calendar', m: ['calendar'] },
  { scene: 'week', m: ['week'] },
  { scene: 'strip', m: ['strip'], width: 390 },
  { scene: 'gallery', m: ['gallery'], prep: async (p) => { await p.waitForSelector('.g-widget-gallery__cat > input:checked + span', { state: 'visible', timeout: 5000 }) } },
  { scene: 'combobox', m: ['comboboxA', 'comboboxC'], prep: async (p) => { await p.click('#cm-a'); await p.waitForSelector('#cm-a-list [role=option][aria-selected=true]', { timeout: 5000 }); await p.waitForTimeout(250) },
    between: async (p) => { await p.keyboard.press('Escape'); await p.waitForTimeout(300); await p.click('#cm-c'); await p.waitForSelector('.g-combobox-surface [role=option][aria-selected=true]', { timeout: 5000 }); await p.keyboard.press('ArrowDown'); await p.waitForTimeout(300) } },
  { scene: 'filter', m: ['filter'], prep: async (p) => { await p.locator('.g-filter-bar button', { hasText: 'Estado' }).first().click(); await p.locator('.g-filter-bar__value input[type="checkbox"]').first().check(); await p.waitForTimeout(200) } },
  { scene: 'navbar', m: ['navbar'], width: 390 }
]
const url = (s, t, dark, css) => `${BANK}?scene=${s}${t && t !== 'default' ? '&theme=' + t : ''}${dark ? '&dark=1' : ''}${css ? '&css=' + css : ''}`
const open = async (page, s, t, dark, css) => {
  await page.setViewportSize({ width: s.width || 1280, height: 900 })
  await page.goto(url(s.scene, t, dark, css))
  await page.waitForSelector('html[data-ready], html[data-error]', { timeout: 20000 })
  const err = await page.evaluate(() => document.documentElement.getAttribute('data-error'))
  if (err) throw new Error('banco: ' + err)
  if (s.prep) await s.prep(page)
}

/* ---------- 1 · Contraste ---------- */
const REQUIRED = ['GCheckbox · cuadro marcado', 'GCheckbox · cuadro indeterminado', 'GCheckbox · chip marcado', 'GCheckbox · tarjeta seleccionada', 'GSwitch · riel encendido',
  'GRadioGroup · list: círculo elegido', 'GRadioGroup · chip elegido', 'GRadioGroup · segmento elegido', 'GRadioGroup · tarjeta elegida', 'GStepper · number: completado', 'GStepper · number: actual',
  'GStepper · dot: completado', 'GStepper · dot: actual', 'GDatePicker · día elegido (rango)', 'GDatePicker · día elegido y hoy (aro on o relleno)', 'GDatePicker · franja de rango: relleno soft',
  'GDatePicker · franja de rango: filo border-control', 'GTable · casilla nativa (accent-color)', 'GTable · tarjeta seleccionada', 'GProgress · avance contra su pista', 'GStepper · conector hecho',
  'GMenu · marca de casilla', 'GMenu · marca de opción', 'GCalendar · vista pulsada (barra)', 'GCalendar · hoy en Mes', 'GCalendar · hoy en la cabecera', 'GCalendar · día pulsado (tira)',
  'GWidgetGallery · categoría elegida', 'GCombobox · casilla marcada (campo A)', 'GCombobox · casilla marcada (paleta)', 'GCombobox · casilla marcada (paleta, activa invertida: surface)',
  'GFilterBar · casilla nativa (accent-color)', 'GSidebar · píldora del navbar (exenta: etiqueta y ancho)']
const worst = {}, infos = {}
if (run('contrast')) {
  for (const eng of ENGINES) {
    ENG = eng
    const browser = await pw[eng].launch()
    const ctx = await browser.newContext({ reducedMotion: 'reduce' })
    const page = await ctx.newPage()
    const seen = new Set()
    for (const t of THEMES) for (const dark of [false, true]) for (const s of SCENES) {
      const label = `${t}${dark ? ' oscuro' : ' claro'} · ${s.scene}`
      let recs = []
      try {
        await open(page, s, t, dark)
        for (const [i, m] of s.m.entries()) {
          if (i > 0 && s.between) await s.between(page)
          recs.push(...await page.evaluate(`(() => { ${HELPERS}; ${MEASURE[m]} })()`))
        }
      } catch (e) { ok(false, `${label}: no medible (${e.message.split('\n')[0]})`); continue }
      ok(recs.length > 0, `${label}: hay elementos que medir`)
      for (const r of recs) {
        seen.add(`${r.comp} · ${r.kase}`)
        const key = `${r.comp} · ${r.kase} · ${r.fam.replace('primary', 'brand')}`
        const cells = Object.entries(r.against).map(([n, c]) => [n, ratio(r.color, c)])
        let min = Math.min(...cells.map((x) => x[1]))
        if (r.alt) { // forma = aro o relleno: el mejor de los dos contra cada superficie
          const alt = Object.entries(r.against).map(([n, c]) => Math.max(ratio(r.color, c), ratio(r.alt, c)))
          min = Math.min(...alt)
        }
        if (r.grow != null) note('GSidebar navbar', `${eng} ${t}${dark ? ' oscuro' : ''}: píldora ${r2(min)}:1 contra la barra · ancho ×${r2(r.grow)} · etiqueta visible ${r.labelShown} · etiquetas en las demás ${r.othersLabel}`)
        if (r.info) { const k = `${r.comp} · ${r.kase} · ${r.fam.replace('primary', 'brand')}`; const w = (infos[k] ??= { min: 99, where: '', cells: {} }); for (const [n, v] of cells) w.cells[n] = Math.min(w.cells[n] ?? 99, r2(v)); if (min < w.min) { w.min = r2(min); w.where = `${t}${dark ? ' oscuro' : ' claro'} (${eng})` } continue }
        ok(min >= r.min, `${label}: ${key} ${r2(min)}:1 < ${r.min} (${cells.map(([n, v]) => n + ' ' + r2(v)).join(', ')})`)
        if (r.expect) ok(parse(r.color) && parse(r.expect) && parse(r.color).every((v, i) => Math.abs(v - parse(r.expect)[i]) < 0.01), `${label}: ${key} pinta ${r.color}, se esperaba ${r.expect}`)
        const w = (worst[`${r.comp} · ${r.kase}`] ??= {})
        const tk = `${t}${dark ? ' oscuro' : ''}`
        const fk = r.fam.replace('primary', 'brand')
        w[`${tk} ${fk}`] = Math.min(w[`${tk} ${fk}`] ?? 99, r2(min))
      }
    }
    for (const k of REQUIRED) ok(seen.has(k), `sin medir: ${k}`)
    await browser.close()
  }
}

/* ---------- 2 · Δ0 en el tema por defecto ---------- */
if (run('delta')) {
  if (!ANTES) note('Δ0', 'sin GRANA_DIST_ANTES: se omite la comparación píxel a píxel')
  else for (const eng of ENGINES) {
    ENG = eng
    const browser = await pw[eng].launch()
    const ctx = await browser.newContext({ reducedMotion: 'reduce' })
    const page = await ctx.newPage()
    const cmp = await ctx.newPage()
    await cmp.setContent('<canvas></canvas>')
    const shot = async (s, dark, css) => {
      await open(page, s, 'default', dark, css)
      if (s.between) await s.between(page)
      await page.mouse.move(1, 1); await page.waitForTimeout(150)
      const png = (await page.screenshot({ fullPage: true, animations: 'disabled', caret: 'hide' })).toString('base64')
      // Formas redondas que ganan un trazo interior del mismo color que su relleno: solo puede cambiar su antialiasing
      const rects = await page.evaluate(() => [...document.querySelectorAll('.g-datepicker__day.is-selected, .g-calendar__month td.is-today .g-calendar__day, .g-calendar__month td[aria-current="date"] .g-calendar__day, .g-calendar__head-title')]
        .map((e) => { const r = e.getBoundingClientRect(); return [r.left + scrollX - 1, r.top + scrollY - 1, r.right + scrollX + 1, r.bottom + scrollY + 1] }))
      return { png, rects }
    }
    await open(page, SCENES[0], 'default', false, 'antes') // calentamiento: la primera carga de Firefox aún asienta el texto
    for (const dark of [false, true]) for (const s of SCENES) {
      const label = `defecto${dark ? ' oscuro' : ' claro'} · ${s.scene}`
      try {
        const a = await shot(s, dark, 'antes'), b = await shot(s, dark)
        const d = await cmp.evaluate(async ([{ png: a, rects }, { png: b }]) => {
          const img = (src) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.src = 'data:image/png;base64,' + src })
          const [A, B] = await Promise.all([img(a), img(b)])
          if (A.width !== B.width || A.height !== B.height) return { size: [A.width, A.height, B.width, B.height] }
          const c = document.querySelector('canvas'); c.width = A.width; c.height = A.height
          const x = c.getContext('2d', { willReadFrequently: true })
          x.drawImage(A, 0, 0); const pa = x.getImageData(0, 0, A.width, A.height).data
          x.clearRect(0, 0, A.width, A.height); x.drawImage(B, 0, 0); const pb = x.getImageData(0, 0, A.width, A.height).data
          // n: píxeles distintos (> 2/255, por encima del ruido del rasterizado); aa: los que caen en el filo de una forma
          // redonda con trazo interior nuevo (antialiasing); out: los demás (un cambio visible de verdad)
          let n = 0, aa = 0, max = 0; const out = []
          const inRect = (x, y) => rects.some(([l, t, r, b]) => x >= l && x <= r && y >= t && y <= b)
          for (let i = 0; i < pa.length; i += 4) {
            const m = Math.max(Math.abs(pa[i] - pb[i]), Math.abs(pa[i + 1] - pb[i + 1]), Math.abs(pa[i + 2] - pb[i + 2]))
            if (m <= 2) continue
            n++; if (m > max) max = m
            const p = i / 4, x = p % A.width, y = (p / A.width) | 0
            if (inRect(x, y)) aa++; else if (out.length < 8) out.push(x + ',' + y)
          }
          return { n, aa, outside: n - aa, max, px: A.width * A.height, rects: rects.length, out }
        }, [a, b])
        ok(!d.size && d.outside === 0, `${label}: Δ visible fuera del filo de las formas redondas ${JSON.stringify(d)}`)
        note('Δ0 píxel a píxel', `${eng} ${label}: ${d.size ? 'tamaño distinto' : d.n ? `${d.n} píxeles distintos de ${d.px}, todos en el filo (antialiasing) de ${d.rects} formas redondas con trazo interior; máx. ${d.max}/255` : '0 píxeles distintos'}`)
      } catch (e) { ok(false, `${label}: Δ0 no medible (${e.message.split('\n')[0]})`) }
    }
    // Hover (informativo): el contorno se queda en -text con el relleno -strong (§7.1); con el CSS anterior era -strong
    for (const dark of [false, true]) {
      const res = {}
      for (const css of ['antes', '']) {
        await open(page, SCENES[0], 'default', dark, css)
        res[css || 'ahora'] = {}
        for (const [dc, sel, c] of [['cb-checked', '.g-checkbox__row', '.g-checkbox__input'], ['cb-chip', '.g-checkbox__row', '.g-checkbox__row'], ['sw-on', '.g-switch__row', '.g-switch__input']]) for (const color of ['brand', 'accent']) {
          const id = await page.evaluate(([dc, sel, color]) => {
            const e = [...document.querySelectorAll(`[data-case="${dc}"]`)].find((x) => x.closest('[data-color]')?.dataset.color === color)
            const row = e.closest(sel) || e.querySelector(sel); row.id = `hv-${dc}-${color}`; return row.id
          }, [dc, sel, color])
          await page.hover('#' + id); await page.waitForTimeout(250)
          res[css || 'ahora'][`${dc} ${color}`] = await page.evaluate(([id, c]) => { const r = document.getElementById(id); const el = r.matches(c) ? r : r.querySelector(c); const s = getComputedStyle(el); return [s.backgroundColor, s.borderTopColor] }, [id, c])
          await page.mouse.move(1, 1)
        }
      }
      for (const k of Object.keys(res.ahora)) note('hover (informativo)', `${eng} defecto${dark ? ' oscuro' : ' claro'} ${k}: relleno ${res.ahora[k][0]} · borde antes ${res.antes[k][1]} → ahora ${res.ahora[k][1]} (Δ borde/relleno ${r2(ratio(res.ahora[k][1], res.ahora[k][0]))}:1)`)
    }
    await browser.close()
  }
}

server.close()
console.log('\nMínimo del contorno (≥ 3:1) por componente, tema y familia:')
for (const [k, v] of Object.entries(worst)) console.log(`  ${k}: ` + Object.entries(v).map(([a, b]) => `${a} ${b}`).join(' · '))
console.log('\nFuera de la regla (informativo, mínimo de todas las configuraciones):')
for (const [k, v] of Object.entries(infos)) console.log(`  ${k}: ${v.min}:1 (peor: ${v.where}) · ` + Object.entries(v.cells).map(([n, x]) => `${n} ${x}`).join(', '))
for (const [k, v] of Object.entries(notes)) { console.log(`\n${k}:`); for (const x of (args.verbose ? v : v.slice(0, 40))) console.log('  ' + x) }
console.log(`\n${total - failed}/${total} comprobaciones` + (failed ? `, ${failed} fallan:` : ''))
for (const f of fails) console.log('  ✗ ' + f)
process.exit(failed ? 1 : 0)
