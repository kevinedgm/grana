#!/usr/bin/env node
// Recorrido de las fichas interactivas («Prueba en vivo», site/live/G<Nombre>.js) con Chromium, Firefox o WebKit:
// la ficha monta el componente real, cada valor del código cicla por todos sus valores, cada casilla
// se activa y se quita, cada caso se abre en la ficha, en claro y en oscuro, sin errores ni avisos
// en la consola y sin desplazamiento horizontal (también a 375 px). Sobre docs:dev o docs:preview.
//
//   node site/scripts/check-live.mjs [--base http://localhost:4219/grana/] [--browser chromium|firefox|webkit] [--days-ahead N] [--no-grana-warnings] [Componente…]
//
// Sin nombres, recorre todos los de site/live/. Inyecta `process.env.NODE_ENV = 'development'` para que
// salgan los avisos de desarrollo de Grana (un texto que falta, un valor fuera de la lista).

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium, firefox, webkit } from '@playwright/test'

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
const engine = { chromium, firefox, webkit }[opt('browser', 'chromium')]
// Sitio estático: se construye una vez y se abre otro día. --days-ahead N adelanta el reloj del navegador N días
// (lo que dependa de «hoy» en el primer render daría «Hydration mismatch»; DECISIONS #1033).
const daysAhead = Number(opt('days-ahead', '0'))
if (!engine) throw new Error('--browser: chromium, firefox o webkit')
const granaWarnings = !args.includes('--no-grana-warnings')
if (!granaWarnings) args.splice(args.indexOf('--no-grana-warnings'), 1)
const data = JSON.parse(fs.readFileSync(path.join(here, '../src/.site-data.json'), 'utf8'))
const live = fs.readdirSync(path.join(here, '../live')).filter((f) => /^G.*\.js$/.test(f)).map((f) => f.replace(/\.js$/, ''))
const names = args.length ? args : live
const slugOf = (n) => data.components.find((c) => c.name === n)?.slug

const browser = await engine.launch()
let failures = 0
for (const name of names) {
  const slug = slugOf(name)
  const problems = []
  if (!slug) { console.log(`FALLA ${name}\n       sin página en el sitio`); failures++; continue }
  const stats = { controls: 0, steps: 0, cases: 0 }
  for (const [scheme, width] of [['light', 1280], ['dark', 375]]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: scheme })
    await context.addInitScript((s) => {
      try { localStorage.setItem('vitepress-theme-appearance', s) } catch {}
    }, scheme)
    if (granaWarnings) await context.addInitScript(() => { window.process = { env: { NODE_ENV: 'development' } } })
    if (daysAhead) await context.clock.install({ time: new Date(Date.now() + daysAhead * 86_400_000) })
    const page = await context.newPage()
    page.on('console', (m) => {
      if (!['error', 'warning'].includes(m.type())) return
      const t = m.text()
      // «[JavaScript Warning: …]» son avisos de rendimiento del propio Firefox (scroll-linked), como en site.spec.mjs.
      if (/Failed to load resource|\[vite\]|Download the Vue Devtools|^\[JavaScript Warning:/.test(t)) return
      problems.push(`${scheme}: ${m.type()}: ${t.slice(0, 240)}`)
    })
    page.on('pageerror', (e) => problems.push(`${scheme}: pageerror: ${e.message.slice(0, 240)}`))
    const res = await page.goto(`${base}components/${slug}.html`, { waitUntil: 'networkidle' })
    if (!res || res.status() !== 200) problems.push(`HTTP ${res?.status()}`)
    // La ficha se monta en el cliente (<ClientOnly>): esperarla antes de contar.
    await page.locator('.grana-live, .grana-live-unavailable').first().waitFor({ timeout: 15_000 }).catch(() => {})
    const unavailable = await page.locator('.grana-live-unavailable').count()
    if (unavailable) { stats.unavailable = true; await context.close(); break }
    if (await page.locator('vite-error-overlay').count()) { problems.push(`${scheme}: error de Vite en la página (vite-error-overlay): reintentar tras la recarga`); await context.close(); continue }
    const ok = await page.locator('.grana-live').count()
    if (!ok) { problems.push(`${scheme}: sin ficha (.grana-live)`); await context.close(); continue }
    await page.waitForTimeout(250)
    const mounted = await page.evaluate(() => {
      const m = document.querySelector('.grana-live__mount')
      return !!m?.querySelector('*') && m.getBoundingClientRect().height >= 8
    })
    if (!mounted) problems.push(`${scheme}: la ficha no pinta el componente`)
    // Oscilación: con la página quieta, un componente que se mide a sí mismo no debe cambiar de forma sin parar.
    // Un asentamiento al montar (entrada, medida en dos cuadros) no es oscilación: si hay cambios, se espera
    // un segundo y se vuelve a medir; solo cuenta lo que sigue.
    const sample = () => page.evaluate(() => new Promise((done) => {
      const root = document.querySelector('.grana-live')
      if (!root) return done(0)
      let n = 0
      const mo = new MutationObserver((list) => { n += list.filter((m) => m.attributeName === 'class').length })
      mo.observe(root, { attributes: true, subtree: true, attributeFilter: ['class'] })
      setTimeout(() => { mo.disconnect(); done(n) }, 600)
    }))
    let churn = await sample()
    if (churn > 10) { await page.waitForTimeout(1000); churn = await sample() }
    if (churn > 10) problems.push(`${scheme} ${width}px: la ficha no se queda quieta (${churn} cambios de clase en 600 ms, ¿oscila?)`)
    // Solo a lo ancho (en claro): cada control recorre todos sus valores y vuelve al inicial.
    if (scheme === 'light') try {
      const vals = page.locator('.grana-live__code .t-val')
      const nv = await vals.count()
      for (let i = 0; i < nv; i++) {
        const label = await vals.nth(i).getAttribute('aria-label')
        let seen = 0
        do {
          await vals.nth(i).click()
          seen++
          stats.steps++
        } while ((await vals.nth(i).getAttribute('aria-label')) !== label && seen < 12)
        stats.controls++
      }
      const bools = page.locator('.grana-live__code .t-bool')
      const nb = await bools.count()
      for (let i = 0; i < nb; i++) {
        await bools.nth(i).click()
        await bools.nth(i).click()
        stats.controls++
        stats.steps += 2
      }
      const cases = page.locator('.grana-live__case-actions .g-btn:last-child')
      const nc = await cases.count()
      for (let i = 0; i < nc; i++) { await cases.nth(i).click(); stats.cases++ }
      await page.waitForTimeout(150)
      const after = await page.evaluate(() => !!document.querySelector('.grana-live__mount *'))
      if (!after) problems.push('tras recorrer los controles, la ficha quedó vacía')
    } catch (e) { problems.push(`${scheme}: interacción bloqueada: ${String(e.message).split('\n')[0]}`) }
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    if (overflow > 0) problems.push(`${scheme} ${width}px: desplazamiento horizontal de ${overflow}px`)
    await context.close()
  }
  if (problems.length) failures++
  const dedup = [...new Set(problems)]
  console.log(`${dedup.length ? 'FALLA' : 'ok   '} ${name}${stats.unavailable ? ' (vista previa no disponible)' : ` (${stats.controls} controles, ${stats.steps} cambios, ${stats.cases} casos)`}${dedup.slice(0, 12).map((p) => '\n       ' + p).join('')}`)
}
await browser.close()
console.log(`\n${names.length - failures}/${names.length} fichas sin problemas`)
process.exit(failures ? 1 : 0)
