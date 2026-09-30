// Hoja de contacto del experimento D: A, B, C y D en superficie real y alta (y 0.30 no existe como condición: high = 0.275).
// Uso: node scripts/d-sheet.mjs   (servidor en :4180)
import { chromium } from '@playwright/test'
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const out = join(dirname(dirname(fileURLToPath(import.meta.url))), 'screenshots')
const THEMES = [['benchmark', 'grana'], ['benchmark', 'stripe'], ['benchmark', 'linear'], ['gaps', 'gris-medio'], ['gaps', 'ocre-oliva'], ['benchmark', 'spotify']]
const COLS = [['current', 'high'], ['b', 'high'], ['c', 'high'], ['d', 'high'], ['c', 'real'], ['d', 'real']]
const CARDS = ['card-buttons', 'card-badges']
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
const shots = {}
for (const [set, t] of THEMES) for (const [s, surf] of COLS) {
  await page.goto(`http://localhost:4180/design/lab/theme-playground/index.html?${set === 'gaps' ? 'set=gaps&' : ''}theme=${t}&scheme=dark&strategy=${s}&surface=${surf}`)
  await page.waitForSelector('body[data-ready="1"]'); await page.waitForTimeout(300)
  shots[`${t}/${s}/${surf}`] = []
  for (const c of CARDS) shots[`${t}/${s}/${surf}`].push((await page.getByTestId(c).screenshot()).toString('base64'))
}
const rows = THEMES.map(([, t]) => `<tr><th>${t}</th>${COLS.map(([s, surf]) => `<td><div class="h">${s === 'current' ? 'A' : s.toUpperCase()} · ${surf}</div>${shots[`${t}/${s}/${surf}`].map((b) => `<img src="data:image/png;base64,${b}">`).join('')}</td>`).join('')}</tr>`).join('')
writeFileSync(join(out, 'd-sheet.html'), `<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#000;color:#ddd;font:12px system-ui}table{border-collapse:collapse}th{writing-mode:vertical-rl;padding:4px;font-weight:600}td{padding:3px;vertical-align:top}img{display:block;inline-size:200px;margin-block:2px}.h{font-size:11px;color:#aaa}</style><table>${rows}</table>`)
const p = await browser.newPage({ viewport: { width: 1300, height: 600 } })
await p.goto(`file://${join(out, 'd-sheet.html')}`)
await p.screenshot({ path: join(out, 'd-sheet.png'), fullPage: true })
await browser.close()
console.log('d-sheet.png')
