// GDatePicker · lectura del día (AV-C1, #952; design/contracts/datepicker.md «Cuando el dato no cabe en la celda») sobre
// los componentes REALES (dist/grana.js): #sec-datepicker del playground (#dp-price, precios de cuatro o cinco cifras) y
// Availability 01 y 03 del banco de @grana/blocks/booking. Chromium, Firefox y WebKit. Dueño: bruno. Puerto propio:
//   GRANA_PW_PORT=4218 npx playwright test tests/datepicker-lectura.spec.mjs
import { test, expect } from '@playwright/test'

const TARGETS = [
  // El playground ya se desborda a 320 por otras secciones: allí se comprueba la caja del selector, no la página
  { name: 'playground #dp-price', url: '/packages/vue/playground/index.html', ready: '#dp-price .g-datepicker__day', root: '#dp-price .g-datepicker', pageOverflowOk: true },
  { name: 'availability 01', url: '/packages/blocks/playground/booking/availability.html?v=01', ready: 'html[data-ready="1"] [data-gb="availability-01"] .g-datepicker__day', root: '[data-gb="availability-01"] .g-datepicker' },
  { name: 'availability 03', url: '/packages/blocks/playground/booking/availability.html?v=03', ready: 'html[data-ready="1"] [data-gb="availability-03"] .g-datepicker__day', root: '[data-gb="availability-03"] .g-datepicker' }
]

function watchConsole(page) {
  const errs = []
  page.on('pageerror', (e) => errs.push(`pageerror: ${e.message}`))
  page.on('console', (m) => {
    const t = m.text()
    if (m.type() === 'error' && !/favicon/.test(t)) errs.push(`console: ${t}`)
    else if (m.type() === 'warning' && /\[Vue warn\]|\[Grana /.test(t)) errs.push(`warning: ${t}`)
  })
  return errs
}
const settle = (p) => p.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 80))))))
async function open(page, t, { width = 1440, text = 100 } = {}) {
  await page.setViewportSize({ width, height: 900 })
  await page.goto(t.url)
  await page.waitForSelector(t.ready, { timeout: 30_000 })
  await page.evaluate(() => document.fonts.ready)
  if (text !== 100) await scale(page, text)
  await page.locator(t.root).first().scrollIntoViewIfNeeded()
  await settle(page)
}
const scale = async (page, text) => { await page.evaluate((v) => { document.documentElement.style.fontSize = v === 100 ? '' : `${v}%` }, text); await settle(page) }

// Lo que ve la persona: clase, lectura (visible y su texto), contenido visible fuera de su celda y medida de las celdas
const STATE = (sel) => {
  const root = document.querySelector(sel)
  const days = [...root.querySelectorAll('.g-datepicker__day')]
  let visible = 0
  let overlaps = 0
  for (const b of days) {
    const td = b.parentElement.getBoundingClientRect()
    for (const el of b.children) {
      if (el.classList.contains('g-datepicker__today-dot') || el.clientWidth <= 1) continue
      if (getComputedStyle(el).visibility === 'hidden') continue
      visible++
      const r = el.getBoundingClientRect()
      if (el.scrollWidth > el.clientWidth + 0.5 || r.left < td.left - 0.5 || r.right > td.right + 0.5) overlaps++
    }
  }
  const rd = root.querySelectorAll('.g-datepicker__day-readout')
  const r = rd[0]
  const shown = r && getComputedStyle(r).display !== 'none' && r.getBoundingClientRect().height > 0
  const dateText = r && r.firstElementChild ? r.firstElementChild.textContent : ''
  const norm = (s) => s.replace(/\s+/g, ' ').trim()
  const cells = days.map((b) => { const q = b.parentElement.getBoundingClientRect(); return [Math.round(q.width * 10) / 10, Math.round(q.height * 10) / 10] })
  return {
    hidden: root.classList.contains('is-day-content-hidden'),
    readouts: rd.length,
    ariaHidden: r && r.getAttribute('aria-hidden'),
    shown: Boolean(shown),
    date: norm(dateText),
    data: r ? norm(r.textContent.slice(dateText.length)) : '',
    visible,
    overlaps,
    cells,
    doc: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    inBox: (() => { if (!shown) return false; const a = r.getBoundingClientRect(); const b = root.querySelector('.g-datepicker__surface').getBoundingClientRect(); return a.left >= b.left - 0.5 && a.right <= b.right + 0.5 && r.scrollWidth <= r.clientWidth + 1 })()
  }
}
// Dato del día en la celda (el slot, sin el número)
const cellData = (page, root, iso) => page.evaluate(({ root, iso }) => {
  const b = document.querySelector(`${root} .g-datepicker__day[data-date="${iso}"]`)
  return [...b.childNodes].slice(1).map((n) => n.textContent).join('').replace(/\s+/g, ' ').trim()
}, { root, iso })
const tabbable = (page, root) => page.locator(`${root} .g-datepicker__day[tabindex="0"]`).first()

for (const t of TARGETS) {
  test.describe(t.name, () => {
    for (const width of [320, 1440]) {
      test(`texto al 200 % a ${width}: clase, 0 solapes y lectura del día activo que cambia con ← → y con el puntero`, async ({ page }) => {
        const errs = watchConsole(page)
        await open(page, t, { width, text: 200 })
        let s = await page.evaluate(STATE, t.root)
        expect(s.hidden, 'clase is-day-content-hidden').toBe(true)
        expect(s.overlaps, 'contenido visible fuera de su celda').toBe(0)
        expect(s.visible, 'ningún dato visible en las celdas').toBe(0)
        expect(s.readouts, 'una sola lectura').toBe(1)
        expect(s.ariaHidden).toBe('true')
        expect(s.shown, 'lectura visible').toBe(true)
        if (!t.pageOverflowOk) expect(s.doc, 'sin desplazamiento horizontal').toBe(false)
        expect(s.inBox, 'lectura dentro de la caja del selector').toBe(true)
        // Día activo por teclado: la parada de Tab
        const tab = tabbable(page, t.root)
        await tab.focus()
        const iso0 = await tab.getAttribute('data-date')
        await settle(page)
        s = await page.evaluate(STATE, t.root)
        expect(s.date).toContain(String(Number(iso0.slice(8))))
        expect(s.data).toBe(await cellData(page, t.root, iso0))
        await page.keyboard.press('ArrowRight')
        await settle(page)
        const iso1 = await tabbable(page, t.root).getAttribute('data-date')
        expect(iso1).not.toBe(iso0)
        s = await page.evaluate(STATE, t.root)
        expect(s.date).toContain(String(Number(iso1.slice(8))))
        expect(s.data).toBe(await cellData(page, t.root, iso1))
        await page.keyboard.press('ArrowLeft')
        await settle(page)
        s = await page.evaluate(STATE, t.root)
        expect(s.date).toContain(String(Number(iso0.slice(8))))
        // Día activo por puntero: gana a la parada de Tab mientras está encima
        const other = page.locator(`${t.root} .g-datepicker__day:not(.is-outside):not([tabindex="0"])`).nth(9)
        const isoP = await other.getAttribute('data-date')
        await other.hover()
        await settle(page)
        s = await page.evaluate(STATE, t.root)
        expect(s.date).toContain(String(Number(isoP.slice(8))))
        expect(s.data).toBe(await cellData(page, t.root, isoP))
        expect(s.overlaps).toBe(0)
        expect(errs).toEqual([])
      })
    }

    test('texto al 100 % a 320 con cuatro cifras: sin clase, datos en la celda y lectura oculta', async ({ page }) => {
      const errs = watchConsole(page)
      await open(page, t, { width: 320 })
      const s = await page.evaluate(STATE, t.root)
      expect(s.hidden).toBe(false)
      expect(s.shown).toBe(false)
      expect(s.readouts).toBe(1)
      expect(s.visible).toBeGreaterThan(0)
      expect(s.overlaps).toBe(0)
      expect(errs).toEqual([])
    })

    test('sin histéresis (100 → 200 → 100 %, 320 → 1440 → 320) y celda Δ 0 entre los dos estados', async ({ page }) => {
      await open(page, t, { width: 320 })
      const a = await page.evaluate(STATE, t.root)
      await scale(page, 200)
      const b = await page.evaluate(STATE, t.root)
      expect(b.hidden).toBe(true)
      await scale(page, 100)
      const c = await page.evaluate(STATE, t.root)
      expect(c.hidden).toBe(a.hidden)
      expect(c.cells).toEqual(a.cells)
      await page.setViewportSize({ width: 1440, height: 900 }); await settle(page)
      const d = await page.evaluate(STATE, t.root)
      await page.setViewportSize({ width: 320, height: 900 }); await settle(page)
      const e = await page.evaluate(STATE, t.root)
      expect(e.hidden).toBe(a.hidden)
      expect(e.cells).toEqual(a.cells)
      // Con la clase: la celda mide lo mismo con y sin ella (Δ 0)
      await scale(page, 200)
      const delta = await page.evaluate((sel) => {
        const root = document.querySelector(sel)
        const m = () => [...root.querySelectorAll('.g-datepicker__grid td')].map((td) => { const r = td.getBoundingClientRect(); return [r.width, r.height] })
        const on = m()
        root.classList.remove('is-day-content-hidden')
        const off = m()
        root.classList.add('is-day-content-hidden')
        return on.reduce((mx, v, i) => Math.max(mx, Math.abs(v[0] - off[i][0]), Math.abs(v[1] - off[i][1])), 0)
      }, t.root)
      expect(delta).toBeLessThanOrEqual(0.5)
      expect(d.overlaps).toBe(0)
    })

    test('el nombre del día lleva el precio en los dos estados (ariaSnapshot)', async ({ page }) => {
      for (const text of [100, 200]) {
        await open(page, t, { width: 320, text })
        const tab = tabbable(page, t.root)
        const snap = await tab.ariaSnapshot()
        expect(snap, `texto ${text} %`).toMatch(/pesos/)
        // La lectura no llega al árbol accesible
        const tree = await page.locator(t.root).first().ariaSnapshot()
        const s = await page.evaluate(STATE, t.root)
        if (s.shown) expect(tree).not.toContain(s.date)
      }
    })
  })
}

test('playground: cinco cifras a 320 con el texto al 100 % → clase (#801)', async ({ page }) => {
  const t = TARGETS[0]
  await open(page, t, { width: 320 })
  expect((await page.evaluate(STATE, t.root)).hidden).toBe(false)
  await page.locator('[data-test="dp-five"]').check()
  await settle(page)
  const s = await page.evaluate(STATE, t.root)
  expect(s.hidden).toBe(true)
  expect(s.shown).toBe(true)
  expect(s.overlaps).toBe(0)
  // Y vuelve al quitarlo
  await page.locator('[data-test="dp-five"]').uncheck()
  await settle(page)
  expect((await page.evaluate(STATE, t.root)).hidden).toBe(false)
})
