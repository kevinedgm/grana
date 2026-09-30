// Hoja de evaluación ciega para una SEGUNDA persona evaluadora (la clasificación visual actual es de una sola persona).
// Genera blind/ con imágenes numeradas al azar (sin indicar la estrategia ni la superficie), key.json (la clave: NO se le enseña al evaluador)
// y rating-template.csv para rellenar. Después `node scripts/score-blind.mjs ratings.csv` mide el acuerdo con visual.json.
// Uso: node scripts/blind-sheet.mjs [--seed=N]   (servidor en :4180)
import { chromium } from '@playwright/test'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const out = join(root, 'blind')
mkdirSync(out, { recursive: true })
const seedArg = process.argv.find((a) => a.startsWith('--seed='))
let seed = seedArg ? Number(seedArg.slice(7)) : 20260930
const rnd = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296 } // generador reproducible
const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] } return a }

const BENCH = ['grana', 'stripe', 'spotify', 'lustre']
const GAPS = ['gris-medio', 'ocre-oliva', 'colision-ajustada', 'tinte-acento-violeta', 'tinte-acento-rojo']
const jobs = []
for (const t of BENCH) for (const s of ['current', 'b', 'c']) jobs.push({ set: 'benchmark', t, s, surface: 'real' })
for (const t of GAPS) for (const s of ['current', 'b', 'c']) jobs.push({ set: 'gaps', t, s, surface: 'real' })
for (const t of ['grana', 'stripe', 'gris-medio', 'tinte-acento-violeta']) for (const s of ['current', 'b', 'c']) jobs.push({ set: t.includes('-') && GAPS.includes(t) ? 'gaps' : 'benchmark', t, s, surface: 'high' })
shuffle(jobs)

const base = 'http://localhost:4180/design/lab/theme-playground/index.html'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
const key = {}
const rows = ['id,brand,accent,success,warning,danger,info,notas']
let n = 0
for (const j of jobs) {
  n++
  const id = String(n).padStart(3, '0')
  await page.goto(`${base}?${j.set === 'gaps' ? 'set=gaps&' : ''}theme=${j.t}&scheme=dark&strategy=${j.s}&surface=${j.surface}`)
  await page.waitForSelector('body[data-ready="1"]'); await page.waitForTimeout(350)
  // se recortan las tarjetas de Botones y Badges (sin título del tema ni selectores: la imagen no dice qué estrategia es)
  const a = await page.getByTestId('card-buttons').boundingBox(), b = await page.getByTestId('card-badges').boundingBox()
  const clip = { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), width: Math.max(a.x + a.width, b.x + b.width) - Math.min(a.x, b.x), height: Math.max(a.y + a.height, b.y + b.height) - Math.min(a.y, b.y) }
  await page.screenshot({ path: join(out, `${id}.png`), clip })
  key[id] = { set: j.set, theme: j.t, strategy: j.s, surface: j.surface }
  rows.push(`${id},,,,,,,`)
}
await browser.close()
writeFileSync(join(out, 'key.json'), `${JSON.stringify(key, null, 2)}\n`)
writeFileSync(join(out, 'rating-template.csv'), `${rows.join('\n')}\n`)
console.log(`${n} imágenes en ${out}`)
