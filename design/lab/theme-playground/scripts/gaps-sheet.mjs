// Hoja de contacto de los temas de la Fase 4 (?set=gaps): A/B/C con la superficie real y A/B/C con la alta. Solo observación.
// Uso: node scripts/gaps-sheet.mjs   (servidor en :4180)
import { chromium } from '@playwright/test'
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const out = join(root, 'screenshots')
const THEMES = ['gris-medio', 'ocre-oliva', 'colision-ajustada', 'tinte-acento-violeta', 'tinte-acento-rojo']
const COLS = [['current', 'real'], ['b', 'real'], ['c', 'real'], ['current', 'high'], ['b', 'high'], ['c', 'high']]
const CARDS = ['card-buttons', 'card-badges', 'card-ladder']
const base = 'http://localhost:4180/design/lab/theme-playground/index.html'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
const shots = {}
for (const t of THEMES) for (const [s, surf] of COLS) {
  await page.goto(`${base}?set=gaps&theme=${t}&scheme=dark&strategy=${s}&surface=${surf}`)
  await page.waitForSelector('body[data-ready="1"]'); await page.waitForTimeout(350)
  shots[`${t}/${s}/${surf}`] = []
  for (const c of CARDS) shots[`${t}/${s}/${surf}`].push((await page.getByTestId(c).screenshot()).toString('base64'))
}
const rows = THEMES.map((t) => `<tr><th>${t}</th>${COLS.map(([s, surf]) => `<td><div class="h">${s === 'current' ? 'A' : s.toUpperCase()} · ${surf}</div>${shots[`${t}/${s}/${surf}`].map((b) => `<img src="data:image/png;base64,${b}">`).join('')}</td>`).join('')}</tr>`).join('')
writeFileSync(join(out, 'gaps-sheet.html'), `<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#000;color:#ddd;font:12px system-ui}table{border-collapse:collapse}th{writing-mode:vertical-rl;padding:4px;font-weight:600}td{padding:3px;vertical-align:top}img{display:block;inline-size:190px;margin-block:2px}.h{font-size:11px;color:#aaa}</style><table>${rows}</table>`)
const p = await browser.newPage({ viewport: { width: 1250, height: 600 } })
await p.goto(`file://${join(out, 'gaps-sheet.html')}`)
await p.screenshot({ path: join(out, 'gaps-sheet.png'), fullPage: true })
await browser.close()
console.log('gaps-sheet.png')
