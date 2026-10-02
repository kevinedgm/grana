// Medición de adaptación de GStepper (coco). Uso, con el servidor en la raíz del repo:
//   python3 -m http.server 4191
//   node design/lab/stepper/adaptacion.mjs [--shots] [--label antes|despues] [--browsers chromium,firefox,webkit]
// Recorre set matrix y props × claro/oscuro × tema (defecto, spotify) × ltr/rtl y resume las incidencias por tramo.
import { chromium, firefox, webkit } from '../theme-playground/node_modules/@playwright/test/index.mjs'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d }
const label = arg('--label', 'actual')
const port = arg('--port', '4191')
const engines = { chromium, firefox, webkit }
const browsers = arg('--browsers', 'chromium,firefox,webkit').split(',')
const shotsDir = join(here, '../../lab/playground-shots/stepper-adaptacion', label)
const base = `http://localhost:${port}/design/lab/stepper/adaptacion.html`
const runs = [
  { set: 'matrix', scheme: 'light', theme: 'default', dir: 'ltr' },
  { set: 'matrix', scheme: 'dark', theme: 'spotify', dir: 'rtl' },
  { set: 'props', scheme: 'light', theme: 'default', dir: 'ltr' },
  { set: 'props', scheme: 'dark', theme: 'default', dir: 'rtl' },
  { set: 'props', scheme: 'light', theme: 'lustre', dir: 'ltr' }
]
const SHOTS = ['720-5-short-d-number', '720-5-short-d-dot', '720-5-short-d-icon', '720-5-short-d-segment', '720-5-short-d-line',
  '600-5-short-d-number', '480-5-short-d-number', '960-7-long-d-number', '720-3-long-d-number', '360-5-short-d-number']

const report = {}
for (const b of browsers) {
  const browser = await engines[b].launch()
  for (const run of runs) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
    const errors = []
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()) })
    page.on('pageerror', (e) => errors.push(String(e)))
    const qs = new URLSearchParams(run).toString()
    await page.goto(`${base}?${qs}`)
    if (arg('--css')) await page.addStyleTag({ path: arg('--css') })
    await page.evaluate(() => window.ready)
    const res = await page.evaluate(() => window.measure())
    const key = `${b} · ${qs}`
    report[key] = { errors: [...new Set(errors)], cases: res }
    if (process.argv.includes('--shots') && run.set === 'matrix' && run.dir === 'ltr' && run.scheme === 'light') {
      mkdirSync(join(shotsDir, b), { recursive: true })
      for (const id of SHOTS) {
        const el = page.locator(`[data-case="${id}"]`)
        if (await el.count()) await el.screenshot({ path: join(shotsDir, b, `${id}.png`) })
      }
    }
    await page.close()
  }
  await browser.close()
}

// Resumen: incidencias por navegador × ejecución y por tramo de ancho
const out = []
let total = 0
for (const [key, { errors, cases }] of Object.entries(report)) {
  const bad = cases.filter((c) => c.issues.length)
  total += bad.length
  out.push(`\n## ${key}: ${bad.length}/${cases.length} casos con incidencias; consola: ${errors.length ? errors.join(' | ') : 'limpia'}`)
  const byW = {}
  for (const c of cases) {
    byW[c.W] = byW[c.W] || { modes: {}, issues: {} }
    byW[c.W].modes[c.mode] = (byW[c.W].modes[c.mode] || 0) + 1
    for (const i of c.issues) {
      const kind = i.replace(/ en paso \d+.*| \(.*\)|\d+px/g, '').trim()
      byW[c.W].issues[kind] = (byW[c.W].issues[kind] || 0) + 1
    }
  }
  for (const [W, v] of Object.entries(byW).sort((a, b) => b[0] - a[0]))
    out.push(`- ${W}px · modos ${JSON.stringify(v.modes)} · ${Object.keys(v.issues).length ? JSON.stringify(v.issues) : 'sin incidencias'}`)
  for (const c of bad.slice(0, 400)) out.push(`  - ${c.id} [${c.mode}]: ${c.issues.join('; ')}`)
}
out.unshift(`# Medición GStepper (${label}) · casos con incidencias: ${total}`)
const file = join(here, `../../lab/playground-shots/stepper-adaptacion/${label}.txt`)
mkdirSync(dirname(file), { recursive: true })
writeFileSync(file, out.join('\n'))
writeFileSync(file.replace(/\.txt$/, '.json'), JSON.stringify(report, null, 1))
console.log(out.filter((l) => !l.startsWith('  - ')).join('\n'))
console.log(`\nDetalle: ${file}`)
