// Verificación de la ronda r02 (kiwi). Uso: python3 -m http.server 4214 desde la raíz del repo, y luego
//   node design/lab/sidebar/r02/verificar.mjs   (Playwright de design/lab/theme-playground/node_modules)
import { createRequire } from 'node:module'
const require = createRequire(new URL('../../theme-playground/package.json', import.meta.url))
const { chromium } = require('playwright')
const PORT = process.env.GRANA_PW_PORT || 4214
const URL_ = `http://localhost:${PORT}/design/lab/sidebar/r02/index.html`
const OUT = process.env.SHOTS || ''
let fails = 0, oks = 0
const ok = (c, m) => { if (c) oks++; else { fails++; console.log('FALLA', m) } }
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 1440, height: 1000 } })
const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()))
await p.goto(URL_); await p.waitForTimeout(400)
const meas = async () => p.$$eval('.stage', ss => ss.map(s => ({ key: s.dataset.key, rows: JSON.parse(s.dataset.meas || '[]') })))
const report = {}
for (const preset of ['p-quiet', 'p-brand', 'p-integ', 'p-integ+fix']) {
  await p.check(`input[value=${preset.replace('+fix', '')}]`, { force: true })
  await p.setChecked('#fixdark', preset.endsWith('+fix'))
  await p.waitForTimeout(150)
  report[preset] = await meas()
}
console.log(JSON.stringify(report))
// Estructura común
const cur = await p.$$eval('.stage', ss => ss.map(s => s.querySelectorAll('[aria-current=page]').length))
ok(cur.every(n => n >= 1), 'cada escenario tiene aria-current')
const navs = await p.$$eval('nav[aria-label]', n => n.length); ok(navs >= 36, 'navs con nombre ' + navs)
// Rama en el riel: con «Todos» actual, el padre del riel es el representante y lleva la forma
const repA = await p.$eval('.stage[data-key="A-grana-dark"] .sb--rail', sb => { const r = sb.querySelector('.lk.is-rep'); const t = sb.querySelector('.thumb'); if (!r || !t) return null; const a = r.getBoundingClientRect(), b = t.getBoundingClientRect(); return Math.abs(a.top - b.top) < 1 && t.classList.contains('on') })
ok(repA, 'A riel: ficha sobre el padre de la rama')
// A: viaje (Inicio → Ajustes) con la ficha en el destino al terminar
await p.click('.stage[data-key="A-grana-light"] .sb:not(.sb--rail) [data-id=set]'); await p.waitForTimeout(450)
const landed = await p.$eval('.stage[data-key="A-grana-light"] .sb:not(.sb--rail)', sb => { const a = sb.querySelector('[aria-current=page]').getBoundingClientRect(), t = sb.querySelector('.thumb').getBoundingClientRect(); return Math.abs(a.top - t.top) < 1 && Math.abs(a.height - t.height) < 1 })
ok(landed, 'A: la ficha llega al destino')
// A: a mitad del viaje la ficha es más alta que un item (se estira)
await p.click('.stage[data-key="A-grana-light"] .sb:not(.sb--rail) [data-id=home]'); await p.waitForTimeout(90)
const stretch = await p.$eval('.stage[data-key="A-grana-light"] .sb:not(.sb--rail) .thumb', t => t.getBoundingClientRect().height)
console.log('A altura a mitad de viaje', stretch)
// C: la lengüeta llega al filo del sidebar
const edge = await p.$eval('.stage[data-key="C-grana-light"] .sb:not(.sb--rail)', sb => { const t = sb.querySelector('.tongue').getBoundingClientRect(), s = sb.getBoundingClientRect(); return Math.abs(t.right - s.right) < 1 })
ok(edge, 'C: la lengüeta toca el filo')
// B: el asiento del actual tiene relleno visible (clip-path abierto)
const seat = await p.$eval('.stage[data-key="B-grana-light"] .sb:not(.sb--rail) [aria-current=page]', a => a.querySelector('.ic') ? getComputedStyle(a.querySelector('.ic'), '::before').clipPath : 'nodo')
console.log('B asiento/nodo del actual:', seat)
// Teclado: Tab llega a los items; foco visible
await p.focus('.stage[data-key="A-grana-light"] .sb:not(.sb--rail) [data-id=inbox]')
await p.keyboard.press('Tab')
const fv = await p.evaluate(() => { const a = document.activeElement; return a.matches(':focus-visible') && getComputedStyle(a).outlineStyle })
ok(fv === 'solid', 'foco visible con Tab')
// H10: caso real (drawer < 1024, sin riel)
const h10 = async (w) => { await p.$eval('#w', (el, w) => { el.value = w; el.dispatchEvent(new Event('input')) }, w); return p.$$eval('.verdict', v => v.map(x => x.textContent)) }
const v1000 = await h10(1000), v1100 = await h10(1100)
console.log('H10 a 1000', v1000, 'a 1100', v1100)
ok(v1000[0].startsWith('drawer') && v1000[1].startsWith('drawer') && v1000[2].startsWith('drawer'), 'H10 caso real 1000 = drawer en A, B y C')
ok(v1100[0].startsWith('expanded') && v1100[1].startsWith('expanded') && v1100[2].startsWith('expanded'), 'H10 1100 = expandida')
// H11: desbordes
const ovf = await p.$$eval('#h11g > div', ds => ds.map(d => [d.className, [...d.querySelectorAll('.ic')].map(i => i.dataset.ovf).join('')]))
console.log('H11 desbordes (1 = desborda):', JSON.stringify(ovf))
ok(ovf[0][1].includes('1'), 'H11 hoy desborda'); ok(!ovf[1][1].includes('1') && !ovf[2][1].includes('1'), 'H11 A y B sin desborde')
if (OUT) {
  await p.check('input[value=p-integ]', { force: true }); await p.waitForTimeout(200)
  await p.screenshot({ path: OUT + '/r02-integ.png', fullPage: true })
  await p.check('input[value=p-quiet]', { force: true }); await p.waitForTimeout(200)
  await p.screenshot({ path: OUT + '/r02-quiet.png', fullPage: true })
  await p.emulateMedia({ forcedColors: 'active' }); await p.waitForTimeout(200)
  await p.locator('#cA').screenshot({ path: OUT + '/r02-forced-A.png' })
  await p.locator('#cB').screenshot({ path: OUT + '/r02-forced-B.png' })
  await p.locator('#cC').screenshot({ path: OUT + '/r02-forced-C.png' })
  await p.emulateMedia({ forcedColors: 'none' })
  await p.setViewportSize({ width: 375, height: 800 }); await p.waitForTimeout(200)
  const sw = await p.evaluate(() => document.documentElement.scrollWidth); console.log('scrollWidth a 375:', sw)
  await p.screenshot({ path: OUT + '/r02-375.png' })
}
ok(errs.length === 0, 'sin errores en consola: ' + errs.join(' | '))
console.log(`${oks}/${oks + fails}`)
await b.close()
process.exit(fails ? 1 : 0)
