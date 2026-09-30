// Capturas del playground con Playwright (reproducibles por URL). Uso:
//   node scripts/shots.mjs            → conjunto de demostración en screenshots/
//   node scripts/shots.mjs --all      → los 11 temas en dark × current/b/c (superficie real)
//   node scripts/shots.mjs --surfaces → los 11 temas en dark con C × low/medium/real/high
import { chromium } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const out = join(root, 'screenshots')
mkdirSync(out, { recursive: true })
const THEMES = ['notion', 'apple', 'medium', 'stripe', 'caracol-purpura', 'amazon', 'github', 'spotify', 'linear', 'grana', 'lustre']
const base = 'http://localhost:4180/design/lab/theme-playground/index.html'

const jobs = []
if (process.argv.includes('--all')) for (const t of THEMES) for (const s of ['current', 'b', 'c']) jobs.push({ t, scheme: 'dark', s, surface: 'real' })
else if (process.argv.includes('--surfaces')) for (const t of THEMES) for (const surface of ['low', 'medium', 'real', 'high']) jobs.push({ t, scheme: 'dark', s: 'c', surface })
else {
  jobs.push({ t: 'grana', scheme: 'light', s: 'current', surface: 'real' }, { t: 'grana', scheme: 'dark', s: 'current', surface: 'real' },
    { t: 'grana', scheme: 'dark', s: 'c', surface: 'high' }, { t: 'stripe', scheme: 'dark', s: 'b', surface: 'real' },
    { t: 'spotify', scheme: 'dark', s: 'current', surface: 'real' }, { t: 'caracol-purpura', scheme: 'dark', s: 'c', surface: 'high' },
    { t: 'grana', scheme: 'dark', s: 'current', surface: 'real', state: 'hover' }, { t: 'grana', scheme: 'dark', s: 'current', surface: 'real', state: 'focus' })
}
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
for (const j of jobs) {
  await page.goto(`${base}?theme=${j.t}&scheme=${j.scheme}&strategy=${j.s}&surface=${j.surface}`)
  await page.waitForSelector('body[data-ready="1"]')
  if (j.state === 'hover') await page.getByTestId('btn-primary').hover()
  if (j.state === 'focus') { await page.getByTestId('sel-surface').focus(); for (let i = 0; i < 40; i++) { await page.keyboard.press('Tab'); if (await page.evaluate(() => document.activeElement?.dataset.testid === 'btn-primary')) break } }
  await page.waitForTimeout(400)
  const name = `${j.t}-${j.scheme}-${j.s}-${j.surface}${j.state ? `-${j.state}` : ''}.png`
  await page.screenshot({ path: join(out, name), fullPage: true })
  console.log(name)
}
await browser.close()
