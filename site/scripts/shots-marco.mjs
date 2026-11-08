#!/usr/bin/env node
// Capturas del marco del sitio (1280 y 375 px, claro y oscuro; filtro, portada y drawer) en design/lab/sitio/build/.
// Sobre docs:preview en el puerto 4234 (o GRANA_SITE_PORT): node site/scripts/shots-marco.mjs
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'
const PORT = Number(process.env.GRANA_SITE_PORT) || 4234
const out = fileURLToPath(new URL('../../design/lab/sitio/build', import.meta.url))
const browser = await chromium.launch()
for (const [w, h] of [[1280, 800], [375, 812]]) for (const scheme of ['light', 'dark']) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: scheme })
  const page = await ctx.newPage()
  await page.goto(`http://localhost:${PORT}/grana/components/combobox.html`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)
  await page.screenshot({ path: `${out}/marco-${w}-${scheme === 'light' ? 'claro' : 'oscuro'}.png` })
  if (w === 1280 && scheme === 'light') {
    await page.locator('.g-sidebar__filter-input').fill('oscuro')
    await page.locator('.g-sidebar__group-title', { hasText: 'En el texto' }).waitFor({ timeout: 30000 })
    await page.screenshot({ path: `${out}/marco-1280-claro-filtro.png` })
    await page.goto(`http://localhost:${PORT}/grana/`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(800)
    await page.screenshot({ path: `${out}/marco-1280-claro-portada.png` })
  }
  if (w === 375 && scheme === 'light') {
    await page.locator('.site-band__menu').click()
    await page.waitForTimeout(500)
    await page.screenshot({ path: `${out}/marco-375-claro-drawer.png` })
  }
  await ctx.close()
}
await browser.close()
