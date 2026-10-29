// Verificación de coco · pieza 1 de configuración global: texto editable ≥ 16px con puntero grueso (DECISIONS.md #970 a
// #972; api.md «Texto editable con puntero grueso»). Mide los COMPONENTES REALES del banco (banco.html, UMD de dist/)
// con dos hojas: el grana.css de ANTES (HEAD sin la pieza) y el de DESPUÉS (con la pieza), servidas en /__grana.css.
// Criterios de #972 que cubre: 1 (≥ 16 en táctil), 2 (escritorio Δ0), 3 (tema de fontSize 18 y 20), 4 (alto táctil Δ0,
// salvo GTextarea xs con rows ≥ 3), 5 (acompañantes = control; etiqueta, ayuda, mensaje, contador y opciones en su rol),
// 6 (fantasma y espejos alineados ≤ 0,5px), 7 (320px sin desplazamiento ni desborde; la hora dicha todo o nada) y 8
// (grep de 16px en las hojas). Solo Chromium: es el único motor instalado en /opt/pw-browsers (WebKit y Firefox no).
//
// Uso (desde la raíz del repo):
//   node design/lab/campo-tactil/verificar.mjs --before=<grana.css antes> --after=<grana.css después> [--verbose]
// Sin --after se usa packages/vue/dist/grana.css. El «antes» se obtiene con `vite build --outDir …` en un worktree de
// HEAD (no toca dist/). Puerto 4209 (CLAUDE.md: un proceso por puerto). Vue desde node_modules (unpkg bloqueado).
import http from 'node:http'
import { readFile, readdir } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../../../', import.meta.url))
const { chromium } = await import(join(ROOT, 'node_modules/playwright/index.mjs'))
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')).map(([k, v]) => [k, v ?? true]))
const AFTER = args.after || join(ROOT, 'packages/vue/dist/grana.css')
const BEFORE = args.before
if (!BEFORE) { console.error('Falta --before=<grana.css de antes>'); process.exit(2) }
const PORT = 4209

const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.woff2': 'font/woff2' }
const server = http.createServer(async (req, res) => {
  try {
    const p = normalize(join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname)))
    if (!p.startsWith(ROOT)) throw new Error('fuera')
    const body = await readFile(p)
    res.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream' }).end(body)
  } catch { res.writeHead(404).end() }
})
await new Promise((r) => server.listen(PORT, '127.0.0.1', r))
const URL0 = `http://127.0.0.1:${PORT}/design/lab/campo-tactil/banco.html`

let total = 0, failed = 0
const fails = [], notes = []
const ok = (cond, msg) => { total++; if (!cond) { failed++; fails.push(msg) } }
const near = (a, b, t = 0.01) => Math.abs(a - b) <= t

/* ---------- Medida en la página ---------- */
// Por celda del banco: tamaño de letra (fs), interlineado (lh) y alto de la caja de cada parte con nombre
const collect = () => {
  const px = (v) => parseFloat(v)
  const st = (el, pe) => { if (!el) return null; const c = getComputedStyle(el, pe); return { fs: px(c.fontSize), lh: c.lineHeight === 'normal' ? null : px(c.lineHeight) } }
  const box = (el) => (el ? Math.round(el.getBoundingClientRect().height * 100) / 100 : null)
  // Ancho del icono por su caja calculada (el indicador de carga gira: su rectángulo cambia con el ángulo)
  const wid = (el) => (el ? Math.round(px(getComputedStyle(el).width) * 100) / 100 : null)
  const P = {
    input: (c) => ({
      control: st(c.querySelector('.g-input__field')), placeholder: st(c.querySelector('.g-input__field'), '::placeholder'),
      prefix: st(c.querySelector('.g-input__prefix')), suffix: st(c.querySelector('.g-input__suffix')), output: st(c.querySelector('.g-input__output')),
      loaderW: wid(c.querySelector('.g-input__loader')),
      label: st(c.querySelector('.g-input__label')), hint: st(c.querySelector('.g-input__hint')), message: st(c.querySelector('.g-input__message')),
      box: box(c.querySelector('.g-input__control'))
    }),
    textarea: (c) => {
      const [a, b] = c.querySelectorAll('.g-textarea')
      return {
        control: st(a.querySelector('.g-textarea__field')), placeholder: st(a.querySelector('.g-textarea__field'), '::placeholder'),
        loaderW: wid(a.querySelector('.g-textarea__loader')),
        label: st(a.querySelector('.g-textarea__label')), hint: st(a.querySelector('.g-textarea__hint')), counter: st(a.querySelector('.g-textarea__counter')),
        box: box(a.querySelector('.g-textarea__field')), box3: box(b.querySelector('.g-textarea__field'))
      }
    },
    select: (c) => ({
      control: st(c.querySelector('.g-select__button')), value: st(c.querySelector('.g-select__value')),
      arrowW: wid(c.querySelector('.g-select__arrow')), loaderW: wid(c.querySelector('.g-select__loader')),
      option: st(c.querySelector('.g-select__option')), list: st(c.querySelector('.g-select__list')),
      label: st(c.querySelector('.g-select__label')), hint: st(c.querySelector('.g-select__hint')),
      box: box(c.querySelector('.g-select__control'))
    }),
    datepicker: (c) => ({
      control: st(c.querySelector('.g-datepicker__field')), value: st(c.querySelector('.g-datepicker__value')), output: st(c.querySelector('.g-datepicker__output')),
      label: st(c.querySelector('.g-datepicker__label')), hint: st(c.querySelector('.g-datepicker__hint')),
      box: box(c.querySelector('.g-datepicker__field'))
    }),
    party: (c) => ({
      control: st(c.querySelector('.g-party-field__trigger')), value: st(c.querySelector('.g-party-field__value')),
      arrowW: wid(c.querySelector('.g-party-field__arrow')),
      label: st(c.querySelector('.g-party-field__label')), hint: st(c.querySelector('.g-party-field__hint')),
      box: box(c.querySelector('.g-party-field__trigger'))
    }),
    number: (c) => ({
      control: st(c.querySelector('.g-input__field')), suffix: st(c.querySelector('.g-input__suffix')),
      mirror: st(c.querySelector('.g-number-field__mirror')), step: st(c.querySelector('.g-number-field__step')),
      label: st(c.querySelector('.g-input__label')), hint: st(c.querySelector('.g-input__hint')),
      box: box(c.querySelector('.g-input__control'))
    }),
    time: (c) => ({
      control: st(c.querySelector('.g-input__field')), reading: st(c.querySelector('.g-time-field__reading')),
      half: st(c.querySelector('.g-time-field__half')), mirror: st(c.querySelector('.g-time-field__mirror')),
      label: st(c.querySelector('.g-input__label')), hint: st(c.querySelector('.g-input__hint')),
      box: box(c.querySelector('.g-input__control'))
    }),
    combobox: (c) => ({
      control: st(c.querySelector('.cb-field .g-input__field')), token: st(c.querySelector('.cb-token .g-combobox__token')),
      sentence: st(c.querySelector('.cb-multi .g-combobox__sentence')), palette: st(c.querySelector('.cb-palette .g-input__field')),
      label: st(c.querySelector('.cb-field .g-input__label')), hint: st(c.querySelector('.cb-field .g-input__hint')),
      box: box(c.querySelector('.cb-field .g-input__control')), boxMulti: box(c.querySelector('.cb-multi .g-input__control'))
    }),
    group: (c) => ({
      control: st(c.querySelector('.ig .g-input-group__part--input .g-input-group__control')),
      select: st(c.querySelector('.ig .g-input-group__part--select .g-input-group__control')),
      text: st(c.querySelector('.ig .g-input-group__part--text')),
      readonly: st(c.querySelector('.ig-ro .g-input-group__part--select .g-input-group__control')),
      label: st(c.querySelector('.ig .g-input-group__label')), hint: st(c.querySelector('.ig .g-input-group__hint')),
      box: box(c.querySelector('.ig .g-input-group__box')), boxRo: box(c.querySelector('.ig-ro .g-input-group__box'))
    })
  }
  const out = {}
  for (const c of document.querySelectorAll('[data-g][data-k]')) {
    const g = c.dataset.g
    if (P[g]) out[`${g}|${c.dataset.k}`] = P[g](c)
  }
  const loose = {
    table: [...document.querySelectorAll('.g-table__bar-cards select')].map((e) => st(e)),
    tableBox: [...document.querySelectorAll('.g-table__bar-cards select')].map(box),
    calendar: st(document.querySelector('.g-calendar__resource-select select')), calendarBox: box(document.querySelector('.g-calendar__resource-select select')),
    gallerySearch: st(document.querySelector('.g-widget-gallery__search input')), gallerySearchBox: box(document.querySelector('.g-widget-gallery__search input')),
    gallerySize: st(document.querySelector('.g-widget-gallery__row select')), galleryLabel: st(document.querySelector('.g-widget-gallery__row > label')),
    transcript: st(document.querySelector('.g-transcript__field')), transcriptBox: box(document.querySelector('.g-transcript__field')),
    cbPanel: st(document.querySelector('.g-combobox__panel'))
  }
  return { cells: out, loose }
}

// Editor de GFilterBar: se abre con la sugerencia «Total» (número) y se mide la regla y el valor
const filterEditor = async (page) => {
  // La galería es modal (abierta para medirla): se cierra antes de tocar la barra
  if (await page.$('dialog.g-widget-gallery[open]')) { await page.keyboard.press('Escape'); await page.waitForTimeout(300) }
  await page.click('[data-g="filter"] .g-filter-bar__suggest')
  await page.waitForTimeout(250)
  return page.evaluate(() => {
    const st = (el) => (el ? { fs: parseFloat(getComputedStyle(el).fontSize), h: el.getBoundingClientRect().height } : null)
    const rule = document.querySelector('.g-filter-bar__rule')
    const val = document.querySelector('.g-filter-bar__value input:not([type="checkbox"])')
    const title = document.querySelector('.g-filter-bar__editor-title') || document.querySelector('.g-dialog__title')
    return { rule: st(rule), value: st(val), title: st(title), sheet: !!rule?.closest('.g-filter-bar__sheet') }
  })
}

const browser = await chromium.launch()
const TOUCH = { hasTouch: true, isMobile: true, viewport: { width: 1000, height: 900 }, deviceScaleFactor: 1 }
const DESK = { viewport: { width: 1000, height: 900 } }
async function open(ctxOpts, css, query = '', { reduced = true } = {}) {
  const ctx = await browser.newContext({ ...ctxOpts, reducedMotion: reduced ? 'reduce' : 'no-preference' })
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  await page.route('**/__vue.js', (r) => r.fulfill({ path: join(ROOT, 'node_modules/vue/dist/vue.global.js'), contentType: 'text/javascript' }))
  await page.route('**/__grana.css', (r) => r.fulfill({ path: css, contentType: 'text/css' }))
  await page.goto(URL0 + query)
  await page.waitForFunction(() => window.__ready)
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(400)
  return { ctx, page, errors }
}

/* ---------- Precondición: la consulta de puntero ---------- */
{
  const { ctx, page } = await open(TOUCH, AFTER)
  const coarse = await page.evaluate(() => matchMedia('(pointer: coarse)').matches)
  ok(coarse, 'precondición: matchMedia("(pointer: coarse)") con hasTouch + isMobile')
  notes.push(`Chromium ${browser.version()}: (pointer: coarse) = ${coarse} con hasTouch + isMobile`)
  await ctx.close()
  const d = await open(DESK, AFTER)
  ok(!(await d.page.evaluate(() => matchMedia('(pointer: coarse)').matches)), 'precondición: escritorio sin puntero grueso')
  await d.ctx.close()
}

/* ---------- Medidas en las cuatro combinaciones ---------- */
const M = {}
for (const [name, opts, css] of [['tNew', TOUCH, AFTER], ['tOld', TOUCH, BEFORE], ['dNew', DESK, AFTER], ['dOld', DESK, BEFORE]]) {
  const { ctx, page, errors } = await open(opts, css)
  M[name] = await page.evaluate(collect)
  M[name].filter = await filterEditor(page)
  ok(errors.length === 0, `${name}: consola limpia (${errors.slice(0, 3).join(' | ')})`)
  await ctx.close()
}
// Editor de GFilterBar en hoja (visor estrecho: < space × 130)
for (const [name, opts, css] of [['tNewSheet', { ...TOUCH, viewport: { width: 390, height: 844 } }, AFTER], ['dOldSheet', { viewport: { width: 390, height: 844 } }, BEFORE], ['dNewSheet', { viewport: { width: 390, height: 844 } }, AFTER]]) {
  const { ctx, page } = await open(opts, css, '?only=loose')
  M[name] = await filterEditor(page)
  await ctx.close()
}

const keys = Object.keys(M.tNew.cells)
const CONTROLS = { input: ['control'], textarea: ['control'], select: ['control'], datepicker: ['control'], party: ['control'], number: ['control'], time: ['control'], combobox: ['control', 'palette'], group: ['control', 'select', 'readonly'] }
const COMPANIONS = { input: ['placeholder', 'prefix', 'suffix', 'output'], textarea: ['placeholder'], select: ['value'], datepicker: ['value', 'output'], party: ['value'], number: ['suffix', 'mirror', 'step'], time: ['reading', 'half', 'mirror'], combobox: ['token', 'sentence'], group: ['select', 'text', 'readonly'] }
const WIDTHS = { input: ['loaderW'], textarea: ['loaderW'], select: ['arrowW', 'loaderW'], party: ['arrowW'] }
const STAY = { input: ['label', 'hint', 'message'], textarea: ['label', 'hint', 'counter'], select: ['label', 'hint', 'option', 'list'], datepicker: ['label', 'hint'], party: ['label', 'hint'], number: ['label', 'hint'], time: ['label', 'hint'], combobox: ['label', 'hint'], group: ['label', 'hint'] }
const BOXES = { input: ['box'], textarea: ['box', 'box3'], select: ['box'], datepicker: ['box'], party: ['box'], number: ['box'], time: ['box'], combobox: ['box', 'boxMulti'], group: ['box', 'boxRo'] }
const table1 = []

for (const k of keys) {
  const [g, size, dens] = k.split('|')
  const n = M.tNew.cells[k], o = M.tOld.cells[k], dn = M.dNew.cells[k], dol = M.dOld.cells[k]
  // 1 · cada control ≥ 16 en táctil
  for (const part of CONTROLS[g]) {
    ok(n[part] && n[part].fs >= 16 - 0.01, `C1 ${k} ${part}: ${n[part]?.fs}px ≥ 16`)
    // y es max(16, rol): el rol es el de antes en táctil
    ok(n[part] && near(n[part].fs, Math.max(16, o[part].fs)), `C1 ${k} ${part}: ${n[part]?.fs} = max(16, ${o[part]?.fs})`)
    // interlineado: max(rol, body-sm-line) (20 con el tema por defecto)
    if (o[part].lh != null) ok(near(n[part].lh, Math.max(o[part].lh, 20)), `C1 ${k} ${part}: interlineado ${n[part].lh} = max(${o[part].lh}, 20)`)
  }
  table1.push(`${k.padEnd(22)} ${CONTROLS[g].map((p) => `${p} ${o[p].fs}→${n[p].fs}`).join(' · ')}`)
  // 2 · escritorio Δ0 en todo lo medido
  for (const [part, v] of Object.entries(dol)) ok(JSON.stringify(v) === JSON.stringify(dn[part]), `C2 ${k} ${part}: escritorio ${JSON.stringify(v)} → ${JSON.stringify(dn[part])}`)
  // 4 · alto de la caja en táctil Δ0 (excepción: GTextarea xs con rows 3, +4px por fila extra = +8)
  for (const b of BOXES[g]) {
    if (g === 'textarea' && size === 'xs' && b === 'box3') {
      ok(near(n[b] - o[b], 8, 0.05), `C4 ${k} ${b}: excepción aceptada GTextarea xs rows 3 = +8 (${o[b]} → ${n[b]})`)
      notes.push(`GTextarea xs ${dens} rows 3 en táctil: ${o[b]} → ${n[b]} px (+${(n[b] - o[b]).toFixed(2)}; #972 criterio 4, aceptada)`)
    } else ok(near(n[b], o[b], 0.05), `C4 ${k} ${b}: alto táctil ${o[b]} → ${n[b]}`)
  }
  // 5 · acompañantes = control; lo que se queda, en su rol (igual que antes en táctil)
  const ctl = n.control.fs
  for (const part of COMPANIONS[g]) {
    if (!n[part]) { ok(false, `C5 ${k} ${part}: no se encontró`); continue }
    ok(near(n[part].fs, ctl), `C5 ${k} ${part}: ${n[part].fs} = control ${ctl}`)
  }
  for (const part of WIDTHS[g] || []) if (n[part] != null && o[part] != null) ok(near(n[part], ctl, 0.05) || (part === 'arrowW' && near(n[part] / o[part], ctl / o.control.fs, 0.01)), `C5 ${k} ${part}: ancho del icono ${n[part]} sigue al texto ${ctl}`)
  for (const part of STAY[g]) {
    if (!n[part] || !o[part]) { ok(false, `C5 ${k} ${part}: no se encontró`); continue }
    ok(n[part].fs === o[part].fs && n[part].lh === o[part].lh, `C5 ${k} ${part}: se queda en su rol (${o[part].fs}/${o[part].lh} → ${n[part].fs}/${n[part].lh})`)
  }
}

// Controles sueltos de la lista A
{
  const n = M.tNew.loose, o = M.tOld.loose, dn = M.dNew.loose, dol = M.dOld.loose
  for (const [part, i] of [['table', 0], ['table', 1]]) ok(n[part][i].fs >= 16 && near(n[part][i].fs, Math.max(16, o[part][i].fs)), `C1 GTable cards select ${i}: ${o[part][i].fs} → ${n[part][i].fs}`)
  for (const part of ['calendar', 'gallerySearch', 'gallerySize', 'transcript']) ok(n[part] && n[part].fs >= 16 && near(n[part].fs, Math.max(16, o[part].fs)), `C1 ${part}: ${o[part]?.fs} → ${n[part]?.fs}`)
  ok(n.galleryLabel.fs === o.galleryLabel.fs, `C5 GWidgetGallery etiqueta de tamaño en su rol (${o.galleryLabel.fs} → ${n.galleryLabel.fs})`)
  ok(n.cbPanel.fs === o.cbPanel.fs, `C5 GCombobox panel en su rol (${o.cbPanel.fs} → ${n.cbPanel.fs})`)
  for (const part of ['tableBox', 'calendarBox', 'gallerySearchBox', 'transcriptBox']) ok(JSON.stringify(n[part]) === JSON.stringify(o[part]), `C4 ${part}: alto táctil ${JSON.stringify(o[part])} → ${JSON.stringify(n[part])}`)
  ok(JSON.stringify(dn) === JSON.stringify(dol), 'C2 controles sueltos: escritorio Δ0')
  table1.push(`sueltos               table ${o.table.map((x) => x.fs)}→${n.table.map((x) => x.fs)} · calendar ${o.calendar.fs}→${n.calendar.fs} · galería ${o.gallerySearch.fs}/${o.gallerySize.fs}→${n.gallerySearch.fs}/${n.gallerySize.fs} · transcript ${o.transcript.fs}→${n.transcript.fs}`)
  // GFilterBar: popover y hoja
  const f = M.tNew.filter, fo = M.tOld.filter
  ok(!f.sheet && f.rule.fs >= 16 && f.value.fs >= 16, `C1 GFilterBar popover: regla ${fo.rule.fs}→${f.rule.fs}, valor ${fo.value.fs}→${f.value.fs}`)
  ok(near(f.rule.h, fo.rule.h, 0.05) && near(f.value.h, fo.value.h, 0.05), `C4 GFilterBar popover: alto ${fo.rule.h}/${fo.value.h} → ${f.rule.h}/${f.value.h}`)
  ok(f.title.fs === fo.title.fs, `C5 GFilterBar título del editor en su rol (${fo.title.fs} → ${f.title.fs})`)
  ok(JSON.stringify(M.dNew.filter) === JSON.stringify(M.dOld.filter), 'C2 GFilterBar popover: escritorio Δ0')
  const s = M.tNewSheet
  ok(s.sheet && s.rule.fs >= 16 && s.value.fs >= 16 && near(s.rule.fs, Math.max(16, M.dOldSheet.rule.fs)), `C1 GFilterBar hoja: regla ${s.rule.fs}, valor ${s.value.fs} (rol en la hoja ${M.dOldSheet.rule.fs})`)
  ok(JSON.stringify(M.dNewSheet) === JSON.stringify(M.dOldSheet), 'C2 GFilterBar hoja: escritorio Δ0')
  table1.push(`GFilterBar            popover ${fo.rule.fs}/${fo.value.fs}→${f.rule.fs}/${f.value.fs} · hoja (rol ${M.dOldSheet.rule.fs}) → ${s.rule.fs}/${s.value.fs}`)
}

/* ---------- 3 · Tema de fontSize 18 y 20 ---------- */
const themeRows = []
for (const t of ['18', '20']) {
  const tn = await open(TOUCH, AFTER, `?theme=${t}`), dn = await open(DESK, AFTER, `?theme=${t}`)
  const a = await tn.page.evaluate(collect), d = await dn.page.evaluate(collect)
  for (const k of Object.keys(a.cells)) {
    const g = k.split('|')[0]
    for (const part of CONTROLS[g]) ok(near(a.cells[k][part].fs, Math.max(16, d.cells[k][part].fs)), `C3 tema ${t} ${k} ${part}: táctil ${a.cells[k][part].fs} = max(16, rol ${d.cells[k][part].fs})`)
  }
  for (const s of ['xs', 'md', 'lg']) themeRows.push(`fontSize ${t} · input ${s}: rol ${d.cells[`input|${s}|default`].control.fs}px → táctil ${a.cells[`input|${s}|default`].control.fs}px`)
  await tn.ctx.close(); await dn.ctx.close()
}

/* ---------- 6 · Fantasma y espejos alineados con el texto real ---------- */
// Final del texto real = inicio del contenido del <input> + ancho de un clon con su tipografía calculada
const alignRows = []
{
  const { ctx, page } = await open(TOUCH, AFTER, '?only=combobox,number,time', { reduced: true })
  const endOf = (sel) => page.evaluate((sel) => {
    const f = document.querySelector(sel)
    const cs = getComputedStyle(f)
    const s = document.createElement('span')
    for (const p of ['fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'letterSpacing', 'fontVariantNumeric', 'fontFeatureSettings', 'fontKerning', 'wordSpacing']) s.style[p] = cs[p]
    s.style.whiteSpace = 'pre'; s.style.position = 'absolute'; s.style.visibility = 'hidden'
    s.textContent = f.value
    document.body.append(s)
    const w = s.getBoundingClientRect().width
    s.remove()
    const r = f.getBoundingClientRect()
    return { start: r.left + parseFloat(cs.paddingLeft) + parseFloat(cs.borderLeftWidth), w, fs: parseFloat(cs.fontSize) }
  }, sel)
  const rangeRight = (sel) => page.evaluate((sel) => {
    const el = document.querySelector(sel)
    const rg = document.createRange(); rg.selectNodeContents(el)
    return rg.getBoundingClientRect().right
  }, sel)
  for (const s of ['xs', 'sm', 'md', 'lg', 'xl']) for (const d of ['default', 'compact']) {
    const k = `${s}|${d}`
    // GCombobox: se escribe un prefijo y el fantasma propone el resto
    const cf = `[data-g="combobox"][data-k="${k}"] .cb-field .g-input__field`
    await page.fill(cf, 'Diab')
    await page.waitForTimeout(150)
    const hasGhost = await page.$(`[data-g="combobox"][data-k="${k}"] .cb-field .g-combobox__ghost-typed`)
    if (hasGhost) {
      const e = await endOf(cf)
      const gr = await rangeRight(`[data-g="combobox"][data-k="${k}"] .cb-field .g-combobox__ghost-typed`)
      const dlt = Math.abs(e.start + e.w - gr)
      ok(dlt <= 0.5, `C6 GCombobox ${k}: fantasma Δ ${dlt.toFixed(2)}px ≤ 0,5`)
      alignRows.push(`combobox ${k}: Δ ${dlt.toFixed(2)}`)
    } else ok(false, `C6 GCombobox ${k}: no apareció el fantasma`)
    await page.fill(cf, '')
    await page.keyboard.press('Escape')
    // GNumberField y GTimeField: el espejo (sin el hueco del cursor de 2px al final) termina donde termina el texto
    for (const [g, mir] of [['number', '.g-number-field__mirror'], ['time', '.g-time-field__mirror']]) {
      const fsel = `[data-g="${g}"][data-k="${k}"] .g-input__field`
      const e = await endOf(fsel)
      const m = await rangeRight(`[data-g="${g}"][data-k="${k}"] ${mir}`)
      const dlt = Math.abs(e.start + e.w - m)
      ok(dlt <= 0.5, `C6 ${g} ${k}: espejo Δ ${dlt.toFixed(2)}px ≤ 0,5`)
      alignRows.push(`${g} ${k}: Δ ${dlt.toFixed(2)}`)
    }
  }
  await ctx.close()
}

/* ---------- 7 · 320px: sin desplazamiento horizontal ni desborde; la hora dicha todo o nada ---------- */
const v320 = []
for (const [label, opts] of [['táctil', { ...TOUCH, viewport: { width: 320, height: 800 } }], ['escritorio', { viewport: { width: 320, height: 800 } }]]) {
  for (const only of ['row', 'input', 'number', 'time', 'combobox', 'select', 'datepicker', 'group', 'textarea', 'party']) {
    const { ctx, page } = await open(opts, AFTER, `?only=${only}`)
    const r = await page.evaluate(() => {
      const se = document.scrollingElement
      const over = []
      for (const b of document.querySelectorAll('.g-input__control, .g-select__control, .g-datepicker__field, .g-input-group__box, .g-textarea__control, .g-party-field__trigger')) {
        const rc = b.getBoundingClientRect()
        if (rc.right > document.documentElement.clientWidth + 0.5 || b.scrollWidth > b.clientWidth + 1) over.push(b.className.split(' ')[0] + ' ' + Math.round(rc.right) + ' ' + b.scrollWidth + '/' + b.clientWidth)
      }
      // Todo o nada: cada pieza de la hora dicha está entera en la primera línea o fuera (en otra línea)
      const partial = []
      for (const rd of document.querySelectorAll('.g-time-field__reading')) {
        const R = rd.getBoundingClientRect()
        for (const ch of rd.children) {
          const c = ch.getBoundingClientRect()
          if (c.width === 0) continue
          const firstLine = c.top < R.top + 1
          if (firstLine && c.right > R.right + 0.5) partial.push(ch.className + ' ' + c.right + '>' + R.right)
          if (firstLine && ch.classList.contains('g-time-field__reading-word') && c.width < 2 * parseFloat(getComputedStyle(ch).fontSize) - 0.5) partial.push('palabra bajo su mínimo legible ' + c.width)
        }
      }
      return { hscroll: se.scrollWidth > se.clientWidth, sw: se.scrollWidth, cw: se.clientWidth, over, partial, readings: document.querySelectorAll('.g-time-field__reading').length }
    })
    ok(!r.hscroll, `C7 320px ${label} ${only}: sin desplazamiento horizontal (${r.sw}/${r.cw})`)
    ok(r.over.length === 0, `C7 320px ${label} ${only}: sin desborde de caja (${r.over.slice(0, 3).join(' | ')})`)
    ok(r.partial.length === 0, `C7 320px ${label} ${only}: hora dicha todo o nada (${r.partial.join(' | ')})`)
    v320.push(`${label} ${only}: scroll ${r.sw}/${r.cw}, desbordes ${r.over.length}, lecturas ${r.readings} sin cortes ${r.partial.length === 0}`)
    await ctx.close()
  }
}

/* ---------- 8 · 16px solo dentro de @media (pointer: coarse) y en font-size o su alias ---------- */
{
  const DIR = join(ROOT, 'packages/vue/src/components')
  let hits = 0
  for (const d of await readdir(DIR)) {
    let files = []
    try { files = (await readdir(join(DIR, d))).filter((f) => f.endsWith('.css')) } catch { continue }
    for (const f of files) {
      const css = (await readFile(join(DIR, d, f), 'utf8')).replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
      // Recorre bloques: pila de prelude para saber si se está dentro de @media (pointer: coarse)
      const stack = []
      let buf = ''
      for (let i = 0; i < css.length; i++) {
        const ch = css[i]
        if (ch === '{') { stack.push(buf.trim()); buf = '' } else if (ch === '}') { stack.pop(); buf = '' } else if (ch === ';') {
          if (/\b16px\b/.test(buf)) {
            hits++
            const inCoarse = stack.some((p) => /@media\s*\(pointer:\s*coarse\)/.test(p))
            const decl = buf.trim()
            const okDecl = /^(font-size|--_fs)\s*:\s*max\(16px,\s*var\(--[\w-]+\)\)$/.test(decl)
            ok(inCoarse && okDecl, `C8 ${d}/${f}: «${decl}» ${inCoarse ? '' : 'FUERA de pointer: coarse'}`)
          }
          buf = ''
        } else buf += ch
      }
    }
  }
  notes.push(`C8: ${hits} declaraciones con 16px en components/*/*.css, todas comprobadas`)
}

await browser.close()
server.close()

console.log('\nControles en táctil (antes → después, px):')
for (const l of table1) console.log('  ' + l)
console.log('\nTema del CLI con fontSize 18 y 20:')
for (const l of themeRows) console.log('  ' + l)
if (args.verbose) { console.log('\nAlineación (C6):'); for (const l of alignRows) console.log('  ' + l); console.log('\n320px (C7):'); for (const l of v320) console.log('  ' + l) }
else console.log(`\nC6: Δ máximo ${Math.max(...alignRows.map((l) => parseFloat(l.split('Δ ')[1]))).toFixed(2)}px en ${alignRows.length} medidas`)
console.log('\nNotas:'); for (const n of notes) console.log('  · ' + n)
console.log(`\n${total - failed}/${total} comprobaciones (Chromium)`)
if (failed) { console.log('\nFallos:'); for (const f of fails.slice(0, 80)) console.log('  ✗ ' + f); process.exit(1) }
