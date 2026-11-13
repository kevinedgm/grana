// GTable · <select> de orden de: área táctil >= 44px con puntero grueso, sin cambio con puntero fino
// (tokens.md §7; PENDIENTES.md §6; DECISIONS #1076). Componente real (fixture propio, 360px).
// Ejecutar: GRANA_PW_PORT=4257 npx playwright test tests/table-cards-select-tactil.spec.mjs --project=chromium --project=webkit
import { test, expect } from './vue-local.mjs'

import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../../..')
const URL0 = '/packages/vue/playground/__tabla-cards-tactil.html'
const HTML = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="/packages/vue/dist/grana.css"></head><body>
<div id="app" style="padding:8px"><g-table id="tb" responsive="cards" caption="Clientes" row-key="id" :columns="cols" :rows="rows" :selectable="false" :page-size="5"></g-table></div>
<script src="/__vue.js"></script><script src="/packages/vue/dist/grana.umd.js"></script>
<script>
const { createApp } = Vue
const app = createApp({ data: () => ({ cols: [{ key: 'n', label: 'Nombre', sortable: true }, { key: 'p', label: 'Plan', sortable: true }],
  rows: [{ id: 1, n: 'Ana', p: 'Pro' }, { id: 2, n: 'Luis', p: 'Básico' }, { id: 3, n: 'Eva', p: 'Equipo' }] }) })
app.use(Grana); app.mount('#app'); window.__ready = true
</script></body></html>`
async function measure(page) {
  await page.route('**/__vue.js', (r) => r.fulfill({ path: join(ROOT, 'node_modules/vue/dist/vue.global.js'), contentType: 'text/javascript' }))
  await page.route('**/__tabla-cards-tactil.html', (r) => r.fulfill({ body: HTML, contentType: 'text/html' }))
  await page.setViewportSize({ width: 360, height: 760 })
  await page.goto(URL0)
  await page.waitForFunction(() => window.__ready && document.querySelectorAll('.g-table__bar-cards select').length === 2 && document.querySelector('.g-table--mode-cards'))
  await page.evaluate(() => document.fonts.ready)
  return page.evaluate(() => ({
    coarse: matchMedia('(pointer: coarse)').matches,
    cards: !!document.querySelector('.g-table--mode-cards'),
    hs: [...document.querySelectorAll('#tb .g-table__bar-cards select')].map((e) => e.getBoundingClientRect().height)
  }))
}

test.describe('GTable cards · select de orden', () => {
  test.describe('puntero grueso', () => {
    test.use({ hasTouch: true, isMobile: true })
    // Decisión del usuario (2026-11-13): Playwright no emula isMobile ni el puntero grueso en Firefox (setViewportSize se
    // cuelga); el caso queda cubierto en Chromium y WebKit, como en time-field.spec.
    test.skip(({ browserName }) => browserName === 'firefox', 'Firefox: sin isMobile ni puntero grueso en Playwright')
    test('mide >= 44px', async ({ page }) => {
      const m = await measure(page)
      expect(m.coarse).toBe(true)
      expect(m.cards).toBe(true)
      expect(m.hs.length).toBe(2)
      for (const h of m.hs) expect(h).toBeGreaterThanOrEqual(44)
    })
  })
  test.describe('puntero fino', () => {
    test('sigue en su alto de escritorio (< 44px)', async ({ page }) => {
      const m = await measure(page)
      expect(m.coarse).toBe(false)
      expect(m.cards).toBe(true)
      for (const h of m.hs) expect(h).toBeLessThan(44)
    })
  })
})
