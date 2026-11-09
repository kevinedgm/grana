#!/usr/bin/env node
// Capturas del marco calcado en design/lab/sitio/build-calco/, con los mismos nombres, anchos y estados que la referencia
// congelada (design/lab/sitio/referencia/), para compararlas lado a lado. Sobre docs:preview (puerto 4234 o
// GRANA_SITE_PORT): node site/scripts/shots-calco.mjs
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const PORT = Number(process.env.GRANA_SITE_PORT) || 4234
const BASE = `http://localhost:${PORT}/grana/`
const OUT = fileURLToPath(new URL('../../design/lab/sitio/build-calco/', import.meta.url))
fs.mkdirSync(OUT, { recursive: true })
const PAGES = { portada: '', empezar: 'getting-started.html', combobox: 'components/combobox.html', blocks: 'blocks/' }
const browser = await chromium.launch()
const open = async (url, w, tema, h = w < 768 ? 740 : 800) => {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, colorScheme: tema === 'oscuro' ? 'dark' : 'light' })
  await ctx.addInitScript((d) => { try { localStorage.setItem('vitepress-theme-appearance', d ? 'dark' : 'light') } catch {} }, tema === 'oscuro')
  const page = await ctx.newPage()
  await page.goto(BASE + url, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(500)
  return { page, ctx }
}
const shot = (page, name) => page.screenshot({ path: OUT + name + '.png' })

for (const tema of ['claro', 'oscuro']) {
  for (const [name, url] of Object.entries(PAGES)) {
    for (const w of [1280, 1024, 768, 375, 320]) {
      const { page, ctx } = await open(url, w, tema)
      await shot(page, `${name}-${w}-${tema}`)
      await ctx.close()
    }
  }
  // Lectura a mitad de la ficha (marca de la columna y del índice)
  for (const w of [1280, 375]) {
    const { page, ctx } = await open(PAGES.combobox, w, tema)
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight / 2))
    await page.waitForTimeout(700)
    await shot(page, `combobox-${w}-${tema}-lectura`)
    await ctx.close()
  }
  // Estados
  {
    const { page, ctx } = await open(PAGES.combobox, 1280, tema)
    await page.locator('.g-nav-bar__link', { hasText: 'Blocks' }).hover()
    await page.waitForTimeout(400)
    await shot(page, `estado-hover-1280-${tema}`)
    await page.mouse.move(640, 700)
    for (let i = 0; i < 5; i++) await page.keyboard.press('Tab')
    await page.waitForTimeout(200)
    await shot(page, `estado-foco-1280-${tema}`)
    await page.locator('.g-nav-bar__actions .site-lang').click()
    await page.waitForTimeout(400)
    await shot(page, `estado-idioma-1280-${tema}`)
    await page.keyboard.press('Escape')
    await page.keyboard.press('Control+k')
    await page.keyboard.type('comb')
    await page.waitForFunction(() => document.querySelectorAll('#site-search-surface [role=option]').length > 0, null, { timeout: 60_000 }).catch(() => {})
    await page.waitForTimeout(300)
    await shot(page, `estado-busqueda-1280-${tema}`)
    await ctx.close()
  }
  {
    const { page, ctx } = await open(PAGES.combobox, 1024, tema)
    await page.locator('.g-nav-bar__more-btn').click()
    await page.waitForTimeout(400)
    await shot(page, `estado-mas-1024-${tema}`)
    await ctx.close()
  }
  for (const [state, act] of [
    ['menu-movil', (p) => p.locator('.g-nav-bar__toggle').click()],
    ['en-esta-pagina', (p) => p.locator('.site-local__index .g-page-index__fold').click()],
    ['drawer', (p) => p.locator('.site-local__menu').click()]
  ]) {
    const { page, ctx } = await open(PAGES.combobox, 375, tema)
    await act(page)
    await page.waitForTimeout(600)
    await shot(page, `estado-${state}-375-${tema}`)
    await ctx.close()
  }
}
await browser.close()
console.log('capturas en', OUT)
