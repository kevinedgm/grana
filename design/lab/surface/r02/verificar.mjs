// Verificación de la ronda r02 (zona de marca): mide los pares de contraste de cada concepto con componentes reales,
// en tres temas y dos esquemas, y comprueba 320px sin desplazamiento horizontal y consola sin errores.
// Uso (desde la raíz del repo): node design/lab/surface/r02/verificar.mjs  [GRANA_PW_PORT=4211]
import { createRequire } from 'node:module'
import { spawn } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
const require = createRequire(new URL('../../theme-playground/package.json', import.meta.url))
const { chromium } = require('playwright')
const root = fileURLToPath(new URL('../../../../', import.meta.url))
const port = Number(process.env.GRANA_PW_PORT || 4211)
const srv = spawn('python3', ['-m', 'http.server', String(port), '-d', root], { stdio: 'ignore' })
await new Promise(r => setTimeout(r, 900))
const browser = await chromium.launch()
const out = {}
let fails = 0
const errors = []
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
  page.on('pageerror', e => errors.push(String(e)))
  await page.goto(`http://localhost:${port}/design/lab/surface/r02/index.html`)
  await page.waitForFunction(() => window.r02ready === true, null, { timeout: 15000 })
  for (const tema of ['defecto', 'nisa', 'teal']) for (const esq of ['light', 'dark', 'deep']) {
    const r = await page.evaluate(([t, e]) => window.r02.run(t, e), [tema, esq])
    out[`${tema}/${esq}`] = r
    for (const [c, v] of Object.entries(r)) {
      const bad = v.rows.filter(x => x.ratio < x.min)
      if (c !== 'hoy') fails += bad.length
      console.log(`${tema}/${esq} ${c}: ${v.rows.length} pares, ${bad.length} bajo mínimo${bad.length ? ' → ' + bad.map(b => `${b.id} ${b.ratio.toFixed(2)}`).join(', ') : ''}`)
    }
  }
  await page.setViewportSize({ width: 320, height: 800 })
  await page.waitForTimeout(200)
  const sw = await page.evaluate(() => document.documentElement.scrollWidth)
  if (sw > 320) console.log('Desborda:', await page.evaluate(() => [...document.querySelectorAll('body *')].filter(e => e.getBoundingClientRect().right > 321).slice(0, 6).map(e => e.tagName + '.' + String(e.className).slice(0, 40) + ' ' + Math.round(e.getBoundingClientRect().right)).join(' | ')))
  console.log('320px scrollWidth:', sw, sw <= 320 ? 'ok' : 'DESBORDA')
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.evaluate(() => window.r02.run('nisa', 'light'))
  await page.screenshot({ path: fileURLToPath(new URL('./captura-nisa-claro.png', import.meta.url)), fullPage: true })
  await page.evaluate(() => window.r02.run('nisa', 'dark'))
  await page.screenshot({ path: fileURLToPath(new URL('./captura-nisa-oscuro.png', import.meta.url)), fullPage: true })
  // Teclado: Tab recorre la zona A y el foco es visible (outline o box-shadow) en cada parada
  await page.evaluate(() => window.r02.run('nisa', 'light'))
  await page.focus('#concept-A .r02-route a')
  const stops = []
  for (let i = 0; i < 14; i++) {
    if (i) stops.push(await page.evaluate(() => {
      const a = document.activeElement
      // GInput pinta el anillo en .g-input__row y GCard en su ::after (:has); se mide el color pintado, no solo el estilo
      const host = a.closest('.g-input__row') || a.closest('.g-card') || a
      const ring = (el, pseudo) => { const cs = getComputedStyle(el, pseudo); const on = cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0 && !/rgba\(0, 0, 0, 0\)|transparent/.test(cs.outlineColor); return on || (cs.boxShadow !== 'none' && cs.boxShadow !== '') }
      return { tag: a.tagName, cls: a.className.toString().slice(0, 40), visible: ring(a) || ring(host) || ring(host, '::after'), inZone: !!a.closest('#concept-A') }
    }))
    await page.keyboard.press('Tab'); await page.waitForTimeout(250)
  }
  console.log('Paradas de Tab en A:', stops.filter(s => s.inZone).length, 'sin indicador propio:', stops.filter(s => s.inZone && !s.visible).map(s => s.tag + '.' + s.cls).join(' | ') || 'ninguna')
  console.log('Errores de consola:', errors.length ? errors : 'ninguno')
} finally {
  await browser.close(); srv.kill()
}
writeFileSync(fileURLToPath(new URL('./mediciones.json', import.meta.url)), JSON.stringify(out, null, 2))
console.log(fails ? `\n${fails} pares bajo mínimo en A/B/C` : '\nA/B/C: todos los pares en mínimo')
