#!/usr/bin/env node
// Capturas de la portada con la marca (BrandHero.vue): 1280 y 375 px, claro y oscuro, tras «La impresión» (1,6 s).
//   cd site && npm run docs:build && npx vitepress preview . --port 4249 &
//   node design/lab/sitio/marca/capturas.mjs [--base http://localhost:4249/grana/]
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const bi = process.argv.indexOf('--base')
const BASE = bi > 0 ? process.argv[bi + 1] : 'http://localhost:4249/grana/'
const browser = await chromium.launch()
for (const w of [1280, 375]) for (const theme of ['claro', 'oscuro']) {
  const dark = theme === 'oscuro'
  const ctx = await browser.newContext({ viewport: { width: w, height: w < 768 ? 812 : 900 }, deviceScaleFactor: 2, colorScheme: dark ? 'dark' : 'light' })
  await ctx.addInitScript((d) => { try { localStorage.setItem('vitepress-theme-appearance', d ? 'dark' : 'light') } catch {} }, dark)
  const page = await ctx.newPage()
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(1600)
  const file = path.join(HERE, `portada-${w}-${theme}.png`)
  await page.screenshot({ path: file })
  console.log(file)
  await ctx.close()
}
await browser.close()
