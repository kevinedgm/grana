// Verificación de coco de la altura del campo de GDatePicker (hallazgo 3 de design/lab/time-field/auditoria.md).
// En cada motor, con el texto al 100 % y al 200 % (html 200 %), y en sm, md y lg: la caja del campo de GDatePicker (vacío,
// con marcador, con valor, tramo vacío y con valor, split) mide lo mismo que la caja de GInput del mismo tamaño (± 0,5 px),
// igual que GTimeField y GSelect.
// Ejecutar desde la raíz del repo con dist/ reconstruido: node design/lab/datepicker/altura-verificar.mjs
// Opcional: --engines=chromium   --verbose (tabla de medidas)
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
const BASE = `http://127.0.0.1:${server.address().port}/design/lab/datepicker/altura.html`

let total = 0, failed = 0
const fails = []
const ok = (cond, msg) => { total++; if (!cond) { failed++; fails.push(msg) } }

for (const engine of ENGINES) {
  const browser = await pw[engine].launch()
  for (const text of ['100', '200']) {
    const page = await browser.newPage({ viewport: { width: 1400, height: 900 } })
    const errors = []
    page.on('pageerror', (e) => errors.push(String(e)))
    await page.goto(BASE + (text === '200' ? '?text=200' : ''))
    await page.waitForFunction(() => window.__ready)
    await page.evaluate(() => document.fonts.ready)
    await page.waitForTimeout(200)
    const rows = await page.evaluate(() => [...document.querySelectorAll('[data-size]')].map((row) => {
      const h = (k, sel) => [...row.querySelectorAll(`[data-k="${k}"] ${sel}`)].map((e) => +e.getBoundingClientRect().height.toFixed(2))
      return {
        size: row.dataset.size,
        input: h('input', '.g-input__control')[0], inputV: h('input-v', '.g-input__control')[0],
        time: h('time', '.g-input__control')[0], select: h('select', '.g-select__control')[0],
        date: h('date', '.g-datepicker__field')[0], datePh: h('date-ph', '.g-datepicker__field')[0], dateV: h('date-v', '.g-datepicker__field')[0],
        range: h('range', '.g-datepicker__field')[0], rangeV: h('range-v', '.g-datepicker__field')[0], split: h('split', '.g-datepicker__field'),
      }
    }))
    ok(errors.length === 0, `${engine} texto ${text} %: consola limpia (${errors.slice(0, 2).join(' | ')})`)
    for (const r of rows) {
      const tag = `${engine} texto ${text} % ${r.size}`
      for (const k of ['inputV', 'time', 'select', 'date', 'datePh', 'dateV', 'range', 'rangeV']) ok(Math.abs(r[k] - r.input) <= 0.5, `${tag}: ${k} ${r[k]} ≠ GInput ${r.input}`)
      r.split.forEach((v, i) => ok(Math.abs(v - r.input) <= 0.5, `${tag}: split[${i}] ${v} ≠ GInput ${r.input}`))
      if (args.verbose) console.log(tag.padEnd(28), JSON.stringify(r))
    }
    await page.close()
  }
  await browser.close()
}
server.close()
console.log(`\naltura del campo de GDatePicker: ${total - failed}/${total}`)
if (failed) { for (const f of fails) console.log(' ✗ ' + f); process.exit(1) }
