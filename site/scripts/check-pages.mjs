#!/usr/bin/env node
// Recorrido rápido de las páginas de componente con Chromium: consola limpia, ejemplo vivo pintado
// y sin desplazamiento horizontal. Para iterar sobre los ejemplos (docs:dev o docs:preview).
//
//   node site/scripts/check-pages.mjs [--base http://localhost:4219/grana/] [--width 1280] [--locale en] [--no-grana-warnings] [slug…]
//
// Por defecto inyecta `process.env.NODE_ENV = 'development'` antes de cargar: los avisos de desarrollo
// de Grana se guardan con `typeof process !== 'undefined'` y en un navegador no saldrían nunca.
// Sin slugs, recorre todos los componentes de site/src/.site-data.json (ejecuta antes el generador).

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const here = path.dirname(fileURLToPath(import.meta.url))
const args = process.argv.slice(2)
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`)
  if (i === -1) return def
  const v = args[i + 1]
  args.splice(i, 2)
  return v
}
const base = opt('base', 'http://localhost:4219/grana/')
const width = Number(opt('width', '1280'))
const locale = opt('locale', '')
const granaWarnings = !args.includes('--no-grana-warnings')
if (!granaWarnings) args.splice(args.indexOf('--no-grana-warnings'), 1)
const data = JSON.parse(fs.readFileSync(path.join(here, '../src/.site-data.json'), 'utf8'))
const slugs = args.length ? args : data.components.map((c) => c.slug)

const browser = await chromium.launch()
const context = await browser.newContext({ viewport: { width, height: 900 } })
if (granaWarnings) await context.addInitScript(() => { window.process = { env: { NODE_ENV: 'development' } } })
let failures = 0
for (const slug of slugs) {
  const page = await context.newPage()
  const problems = []
  page.on('console', (m) => {
    if (['error', 'warning'].includes(m.type())) problems.push(`${m.type()}: ${m.text().slice(0, 300)}`)
  })
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message.slice(0, 300)}`))
  const url = `${base}${locale ? locale + '/' : ''}components/${slug}.html`
  const res = await page.goto(url, { waitUntil: 'networkidle' })
  if (!res || res.status() !== 200) problems.push(`HTTP ${res?.status()}`)
  await page.waitForTimeout(300)
  const info = await page.evaluate(() => {
    const stages = [...document.querySelectorAll('.grana-demo__stage')]
    return {
      demos: stages.length,
      empty: stages.filter((s) => !s.querySelector('*') || s.getBoundingClientRect().height < 8).length,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
    }
  })
  if (!info.demos) problems.push('sin ejemplo vivo')
  if (info.empty) problems.push(`${info.empty} ejemplo(s) vacío(s)`)
  if (info.overflow > 0) problems.push(`desplazamiento horizontal de ${info.overflow}px`)
  if (problems.length) failures++
  console.log(`${problems.length ? 'FALLA' : 'ok   '} ${slug} (${info.demos} ejemplo/s)${problems.map((p) => '\n       ' + p).join('')}`)
  await page.close()
}
await browser.close()
console.log(`\n${slugs.length - failures}/${slugs.length} páginas sin problemas`)
process.exit(failures ? 1 : 0)
