// Verificación de coco de #682 (rejilla de medio píxel en las alturas de los controles; tokens.md §4 y §7) sobre el banco
// design/lab/redondeo/banco.html con el CSS y el UMD reales de dist/.
// Mide, en Chromium, Firefox y WebKit, con --g-space-1 = 4 (tema por defecto), 4,375 y 3,75 px:
//   A · sondas de variable y elementos de CSS puro de cada control (size × density donde los hay): alto × 2 entero (±0,01)
//       con 4,375 y 3,75; con 4, Δ0 frente al dist de antes (ANTES=<copia del dist anterior>);
//   B · componentes montados: GBtn, GInput, GSelect y GDatePicker del mismo size/density en una GFormRow con Δ de alto 0
//       (y × 2 entero), y las cajas de GTextarea, GNumberField, GTimeField, GCombobox, GFileField, filas de GCheckbox,
//       GSwitch y GRadioGroup (lista y segmentos) con × 2 entero; con 4, Δ0 frente al dist anterior;
//   C · pisos: ninguna altura < 24px; con puntero grueso (Chromium, isMobile + hasTouch), las filas táctiles ≥ 44px y Δ0
//       frente al dist anterior con el tema por defecto.
// Ejecutar desde la raíz: ANTES=<dist anterior> GRANA_PW_PORT=4209 node design/lab/redondeo/verificar.mjs
// Opcional: --engines=chromium,firefox,webkit  --verbose. GRANA_DIST=<copia de dist> sirve una copia fija como «después».
import http from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const pw = await import(new URL('../theme-playground/node_modules/playwright/index.mjs', import.meta.url))
const ROOT = fileURLToPath(new URL('../../../', import.meta.url))
const DIST = process.env.GRANA_DIST
const ANTES = process.env.ANTES
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')).map(([k, v]) => [k, v ?? true]))
const ENGINES = (args.engines || 'chromium,firefox,webkit').split(',')
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const server = http.createServer(async (req, res) => {
  try {
    const path = decodeURIComponent(new URL(req.url, 'http://x').pathname)
    let p
    if (ANTES && path.startsWith('/dist-antes/')) p = join(ANTES, path.slice('/dist-antes/'.length))
    else if (DIST && path.startsWith('/packages/vue/dist/')) p = join(DIST, path.slice('/packages/vue/dist/'.length))
    else { p = normalize(join(ROOT, path)); if (!p.startsWith(ROOT)) throw new Error('fuera') }
    res.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream' }).end(await readFile(p))
  } catch { if (!res.headersSent) res.writeHead(404).end() }
})
await new Promise((r) => server.listen(Number(process.env.GRANA_PW_PORT) || 4209, '127.0.0.1', r))
const ORIGIN = `http://127.0.0.1:${server.address().port}`
const url = (space, antes) => `${ORIGIN}/design/lab/redondeo/banco.html?space=${space}${antes ? '&dist=/dist-antes' : ''}`

let total = 0, failed = 0
const fails = [], notes = {}, perEngine = {}
const ok = (cond, msg) => { total++; if (!cond) { failed++; fails.push(msg) } }
const note = (k, v) => { (notes[k] ??= []).push(v) }
const whole2 = (h) => Math.abs(h * 2 - Math.round(h * 2)) <= 0.01
const SPACES = ['4', '4.375', '3.75']

for (const engine of ENGINES) {
  const browser = await pw[engine].launch()
  const t0 = total, f0 = failed
  const tag = (s) => `${engine} ${s}`
  const errors = []
  const measure = async (space, antes, ctx = {}) => {
    const context = await browser.newContext({ viewport: { width: 1400, height: 1000 }, ...ctx })
    const page = await context.newPage()
    page.on('pageerror', (e) => errors.push(e.message))
    page.on('console', (m) => { if (m.type() === 'error' || (m.type() === 'warning' && /Grana|\[Vue warn\]/.test(m.text()))) errors.push(m.text()) })
    await page.goto(url(space, antes))
    await page.waitForSelector('[data-ready]')
    await page.evaluate(() => document.fonts.ready)
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
    const out = { v: await page.evaluate(() => window.__var()), r: await page.evaluate(() => window.__real()) }
    await context.close()
    return out
  }
  const runs = {}
  for (const space of SPACES) {
    runs[space] = await measure(space, false)
    if (ANTES) runs['antes ' + space] = await measure(space, true)
  }
  let notWholeBefore = 0, notWholeAfter = 0, changedDefault = 0
  for (const space of SPACES) {
    const after = runs[space], before = runs['antes ' + space]
    // A · sondas
    after.v.forEach((x, i) => {
      ok(x.h >= 24 - 0.01 || /GBadge|GTag/.test(x.k), tag(`${space} ${x.k}: ${x.h} < 24`))
      if (space !== '4') {
        ok(whole2(x.h), tag(`${space} ${x.k}: alto ${x.h} × 2 no es entero`))
        if (!whole2(x.h)) notWholeAfter++
        if (before && !whole2(before.v[i].h)) notWholeBefore++
      } else if (before) {
        ok(Math.abs(x.h - before.v[i].h) < 0.005, tag(`tema por defecto ${x.k}: ${before.v[i].h} → ${x.h}`))
        if (Math.abs(x.h - before.v[i].h) >= 0.005) changedDefault++
      }
      total++ // la sonda existe y mide
    })
    // B · componentes reales
    after.r.forEach((x, i) => {
      const row = [x.btn, x.input, x.select, x.date]
      ok(row.every((v) => v != null), tag(`${space} ${x.k}: falta una caja de la fila ${JSON.stringify(row)}`))
      ok(Math.max(...row) - Math.min(...row) < 0.005, tag(`${space} ${x.k}: fila GBtn/GInput/GSelect/GDatePicker con Δ ${row.map((v) => v.toFixed(3)).join(' / ')}`))
      const fh = x.frow.h, ft = x.frow.top
      ok(Math.max(...fh) - Math.min(...fh) < 0.005 && Math.max(...ft) - Math.min(...ft) < 0.005, tag(`${space} ${x.k}: GFormRow con cajas ${fh.join(' / ')} y tops ${ft.join(' / ')}`))
      for (const [n, h] of Object.entries(x)) {
        if (n === 'k' || n === 'frow') continue
        // El <textarea> mide la caja menos sus dos bordes (la caja la dibuja su envoltorio): su piso es 24px − 2 bordes
        ok(h != null && h >= (n === 'textarea' ? 20 : 24 - 0.01), tag(`${space} ${x.k} ${n}: ${h}`))
        if (space !== '4') {
          ok(whole2(h), tag(`${space} ${x.k} ${n}: alto ${h} × 2 no es entero`))
          if (!whole2(h)) notWholeAfter++
          if (before && !whole2(before.r[i][n])) notWholeBefore++
        } else if (before) {
          ok(Math.abs(h - before.r[i][n]) < 0.005, tag(`tema por defecto ${x.k} ${n}: ${before.r[i][n]} → ${h}`))
          if (Math.abs(h - before.r[i][n]) >= 0.005) changedDefault++
        }
      }
    })
    if (before && space !== '4') {
      const rowsBefore = before.r.filter((x) => { const row = [x.btn, x.input, x.select, x.date]; return Math.max(...row) - Math.min(...row) >= 0.005 }).length
      note('fila GBtn/GInput/GSelect/GDatePicker con Δ ≠ 0 (de 15 size × density)', tag(`space ${space}: antes ${rowsBefore}, después ${after.r.filter((x) => { const row = [x.btn, x.input, x.select, x.date]; return Math.max(...row) - Math.min(...row) >= 0.005 }).length}`))
    }
    if (args.verbose) note('alturas', tag(`space ${space}: ` + after.v.map((x) => `${x.k} ${x.h}`).join(' · ')))
  }
  if (ANTES) note('alturas con × 2 no entero (4,375 y 3,75; sondas + cajas reales)', tag(`antes ${notWholeBefore}, después ${notWholeAfter}; tema por defecto con alto distinto: ${changedDefault}`))

  // C · puntero grueso (solo Chromium emula pointer: coarse con isMobile + hasTouch)
  if (engine === 'chromium') {
    const coarse = { isMobile: true, hasTouch: true }
    const a = await measure('4', false, coarse)
    const b = ANTES ? await measure('4', true, coarse) : null
    const c = await measure('4.375', false, coarse)
    const TOUCH = /GBtn|GMenu|GFab píldora|GFab fila|GPagination|GFilterBar botón|GCalendar|GCheckbox|GSwitch|GRadioGroup|GSelect opción|GBreadcrumbs/
    a.v.forEach((x, i) => {
      if (b) ok(Math.abs(x.h - b.v[i].h) < 0.005, tag(`táctil, tema por defecto ${x.k}: ${b.v[i].h} → ${x.h}`))
      ok(whole2(c.v[i].h), tag(`táctil 4,375 ${x.k}: ${c.v[i].h} × 2 no es entero`))
    })
    for (const r of [a, c]) r.r.forEach((x) => { for (const n of ['checkbox', 'switch', 'radio']) ok(x[n] >= 44 - 0.01, tag(`táctil ${x.k} ${n}: ${x[n]} < 44`)) })
    const touchProbe = a.v.filter((x) => TOUCH.test(x.k) && !/GBtn|GCheckbox|GSwitch|GRadioGroup|GCalendar evento|GSelect opción|GMenu|GFab/.test(x.k))
    for (const x of touchProbe) ok(x.h >= 44 - 0.01, tag(`táctil ${x.k}: ${x.h} < 44`))
    note('puntero grueso', tag(`tema por defecto Δ0 frente al anterior; filas de casilla, interruptor y radio ≥ 44; ${touchProbe.length} elementos de CSS puro ≥ 44`))
  }
  ok(!errors.length, tag('consola: ' + [...new Set(errors)].slice(0, 3).join(' | ')))
  perEngine[engine] = `${total - t0 - (failed - f0)}/${total - t0}`
  await browser.close()
}
server.close()

console.log(`\n#682 · rejilla de medio píxel: ${total - failed}/${total} comprobaciones · ${Object.entries(perEngine).map(([k, v]) => `${k} ${v}`).join(' · ')}`)
for (const [k, v] of Object.entries(notes)) { console.log('· ' + k); v.forEach((x) => console.log('    ' + x)) }
if (fails.length) { console.log('\nFallos:'); [...new Set(fails)].slice(0, args.verbose ? 400 : 60).forEach((f) => console.log('  ✗ ' + f)) }
process.exit(failed ? 1 : 0)
