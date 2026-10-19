// Verificación de coco del banco de contención (design/lab/contencion/banco.html) sobre los COMPONENTES REALES (dist/).
// Hallazgo de integración real (NisaNabani, «bug 3»): un componente con contención de tamaño en línea aporta 0 px al tamaño
// intrínseco de su padre. En un padre que se ajusta al contenido medía 0 y la etiqueta se partía letra a letra.
// Comprueba, en cada motor y para cada componente:
//   · en los cuatro padres que se ajustan (celda `auto`, rejilla `justify-items: center`, item flex, `<form>` hijo de flex)
//     el componente mide su ancho por defecto (± 1 px) y su etiqueta cabe en una línea;
//   · en un bloque ancho mide lo mismo (sin cambio) y en un bloque de 180 px no lo desborda (sigue cediendo al 100 %).
// Ejecutar desde la raíz del repo con dist/ reconstruido: node design/lab/contencion/verificar.mjs
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
const PAGE = `http://127.0.0.1:${server.address().port}/design/lab/contencion/banco.html`

/* Ancho esperado en un padre que se ajusta, en unidades de --g-space-1, de los componentes CON contención (su tamaño
   intrínseco es contain-intrinsic-inline-size). null: sin contención; su tamaño intrínseco es el de su contenido (la
   etiqueta), y solo se exige un ancho útil (≥ 160 px) y la etiqueta en una línea. El calendario: 80 unidades con bordes.
   GTextarea, GSelect y GDatePicker (100 con split) tienen contención desde #563: antes medían su etiqueta (~200px) */
const UNITS = { input: 60, 'input-action': 90, textarea: 60, select: 60, 'date-picker': 60, 'date-picker-split': 100, 'number-field': 60, 'time-field': 60, combobox: 60, calendar: 80, summary: 60, slider: null }
const FIT = ['table', 'grid', 'flex', 'form']

let total = 0, failed = 0
const fails = []
const ok = (cond, msg) => { total++; if (!cond) { failed++; fails.push(msg) } }

for (const engine of ENGINES) {
  const browser = await pw[engine].launch()
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } })
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e)))
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  await page.goto(PAGE)
  await page.waitForFunction(() => window.__ready)
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(300)
  const data = await page.evaluate(() => {
    const space = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--g-space-1'))
    const lines = (el) => {
      if (!el) return null
      const r = document.createRange(); r.selectNodeContents(el)
      const tops = new Set([...r.getClientRects()].filter((x) => x.width > 0).map((x) => Math.round(x.top)))
      return tops.size
    }
    const out = []
    for (const sec of document.querySelectorAll('[data-comp]')) {
      for (const c of sec.querySelectorAll('[data-parent]')) {
        const parent = c.dataset.parent
        const host = parent === 'table' ? c.querySelector('td') : parent === 'form' ? c.querySelector('form') : c.querySelector('p + *')
        const root = host.firstElementChild
        const label = root.querySelector('[class$="__label"], [class*="__label "], legend, label')
        out.push({ comp: sec.dataset.comp, parent, w: +root.getBoundingClientRect().width.toFixed(1), hostW: +host.getBoundingClientRect().width.toFixed(1), lines: lines(label) })
      }
    }
    return { space, out }
  })
  ok(errors.length === 0, `${engine}: consola limpia (${errors.slice(0, 3).join(' | ')})`)
  const byKey = Object.fromEntries(data.out.map((m) => [`${m.comp}/${m.parent}`, m]))
  for (const m of data.out) {
    const tag = `${engine} ${m.comp} en ${m.parent}`
    const units = UNITS[m.comp]
    const want = units == null ? byKey[`${m.comp}/block`].w : units * data.space
    const wantBlock = m.comp === 'calendar' || m.comp === 'summary' ? byKey[`${m.comp}/block`].hostW : want
    if (FIT.includes(m.parent)) {
      if (units != null) ok(Math.abs(m.w - want) <= 1, `${tag}: ancho ${m.w} ≠ ${want}`)
      else ok(m.w >= Math.min(want, 160), `${tag}: ancho ${m.w} (bloque ${want}); debe tener un ancho útil`)
      if (m.lines != null) ok(m.lines === 1, `${tag}: la etiqueta ocupa ${m.lines} líneas`)
    } else if (m.parent === 'block') {
      if (units != null) ok(Math.abs(m.w - wantBlock) <= 1, `${tag}: ancho ${m.w} ≠ ${wantBlock}`)
    } else if (m.parent === 'narrow') {
      ok(m.w <= m.hostW + 0.5, `${tag}: ${m.w} desborda el bloque de ${m.hostW}`)
    }
  }
  if (args.verbose) {
    console.log(`\n${engine} (space ${data.space}px)`)
    const comps = [...new Set(data.out.map((m) => m.comp))]
    console.log('comp'.padEnd(14) + ['table', 'grid', 'flex', 'form', 'block', 'narrow'].map((p) => p.padStart(12)).join(''))
    for (const c of comps) console.log(c.padEnd(14) + ['table', 'grid', 'flex', 'form', 'block', 'narrow'].map((p) => { const m = byKey[`${c}/${p}`]; return `${m.w}/${m.lines ?? '-'}`.padStart(12) }).join(''))
  }
  await browser.close()
}
server.close()
console.log(`\ncontención: ${total - failed}/${total}`)
if (failed) { for (const f of fails) console.log(' ✗ ' + f); process.exit(1) }
