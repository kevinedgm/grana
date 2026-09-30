// Hoja de contacto: los 11 temas con la estrategia C sobre las cuatro superficies experimentales (low, real, medium, high).
// Recorta con Playwright las tarjetas Botones, Badges y Feedback de cada estado y las monta en una cuadrícula (PNG).
// Solo observación: no define ningún límite ni regla. Uso: node scripts/surface-sheet.mjs [current|b|c]   (servidor en :4180)
import { chromium } from '@playwright/test'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const strategy = process.argv[2] ?? 'c'
const root = dirname(dirname(fileURLToPath(import.meta.url)))
const out = join(root, 'screenshots')
mkdirSync(out, { recursive: true })
const THEMES = ['notion', 'apple', 'medium', 'stripe', 'caracol-purpura', 'amazon', 'github', 'spotify', 'linear', 'grana', 'lustre']
const SURFACES = ['low', 'real', 'medium', 'high']
const CARDS = ['card-buttons', 'card-badges', 'card-feedback']
const base = 'http://localhost:4180/design/lab/theme-playground/index.html'

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
const shots = {}
for (const t of THEMES) {
  for (const s of SURFACES) {
    await page.goto(`${base}?theme=${t}&scheme=dark&strategy=${strategy}&surface=${s}`)
    await page.waitForSelector('body[data-ready="1"]')
    await page.waitForTimeout(350)
    shots[`${t}/${s}`] = []
    for (const c of CARDS) shots[`${t}/${s}`].push((await page.getByTestId(c).screenshot()).toString('base64'))
  }
}
const sheet = (themes, name) => {
  const rows = themes.map((t) => `<tr><th>${t}</th>${SURFACES.map((s) => `<td><div class="h">${s}</div>${shots[`${t}/${s}`].map((b) => `<img src="data:image/png;base64,${b}">`).join('')}</td>`).join('')}</tr>`).join('')
  writeFileSync(join(out, `${name}.html`), `<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#000;color:#ddd;font:12px system-ui}table{border-collapse:collapse}th{writing-mode:vertical-rl;padding:4px;font-weight:600}td{padding:4px;vertical-align:top}img{display:block;inline-size:230px;margin-block:2px}.h{font-size:11px;color:#aaa}</style><table>${rows}</table>`)
  return name
}
const names = [sheet(THEMES.slice(0, 4), `surfaces-${strategy}-1`), sheet(THEMES.slice(4, 8), `surfaces-${strategy}-2`), sheet(THEMES.slice(8), `surfaces-${strategy}-3`)]
for (const n of names) {
  const p = await browser.newPage({ viewport: { width: 1000, height: 600 } })
  await p.goto(`file://${join(out, `${n}.html`)}`)
  await p.screenshot({ path: join(out, `${n}.png`), fullPage: true })
  await p.close()
  console.log(n)
}
await browser.close()
