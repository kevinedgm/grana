// A · La cuenta: las cifras del total que ruedan (design/contracts/price.md «A · La cuenta» y «Rúbrica de movimiento»; #773)
// sobre el componente REAL (packages/vue/playground/price.html?c=A). ≥ 2 posiciones intermedias, menos posiciones que dígitos,
// termina y retira la capa, Δ ancho 0; con reduce, ninguna capa. Rendimiento: 50 GPrice con total cambiando a la vez, sin
// tarea larga > 50 ms (Chromium, `--workers=1`). GRANA_PW_PORT=4208.
import { test, expect } from '@playwright/test'

const PAGE = '/packages/vue/playground/price.html'
const settle = (p, ms = 60) => p.evaluate((ms) => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, ms)))), ms)
async function open(page, qs, { reduce = false } = {}) {
  await page.emulateMedia({ reducedMotion: reduce ? 'reduce' : 'no-preference' })
  await page.goto(PAGE + qs)
  await page.waitForFunction(() => window.__price && window.__price.ready)
  await page.evaluate(() => document.fonts.ready)
  await settle(page)
}

test('A: al cambiar las noches solo ruedan las cifras que cambian; ≥ 2 posiciones intermedias; termina y retira la capa; Δ ancho 0', async ({ page }) => {
  await open(page, '?c=A')
  const amt = page.locator('[data-room="patio"] .g-price__total-amount')
  const before = await amt.evaluate((el) => ({ w: el.getBoundingClientRect().width, digits: el.querySelector('.g-price__number').textContent.replace(/\D/g, '').length }))
  // Muestreo por cuadro: posición del primer __roll-new, ancho de la caja y número de ranuras
  const samples = await page.evaluate(() => new Promise((resolve) => {
    const el = document.querySelector('[data-room="patio"] .g-price__total-amount')
    const out = []
    const t0 = performance.now()
    window.__price.nights.value = 3
    const tick = () => {
      const n = el.querySelector('.g-price__roll-new')
      out.push({ rolling: el.classList.contains('is-rolling'), dir: el.dataset.direction, slots: el.querySelectorAll('.g-price__roll-slot').length, y: n ? n.getBoundingClientRect().top - el.getBoundingClientRect().top : null, w: el.getBoundingClientRect().width, text: el.querySelector('.g-price__number').textContent })
      if (performance.now() - t0 < 900) requestAnimationFrame(tick)
      else resolve(out)
    }
    requestAnimationFrame(tick)
  }))
  const during = samples.filter((s) => s.rolling)
  expect(during.length).toBeGreaterThan(0)
  expect(during[0].dir).toBe('up')
  expect(during[0].slots).toBeGreaterThan(0)
  expect(during[0].slots).toBeLessThan(before.digits)
  const ys = new Set(during.map((s) => Math.round(s.y)).filter((y) => y !== 0))
  expect(ys.size, `posiciones intermedias ${[...ys]}`).toBeGreaterThanOrEqual(2)
  for (const s of during) expect(Math.abs(s.w - during[0].w), 'Δ ancho durante la capa').toBeLessThanOrEqual(0.5)
  const last = samples.at(-1)
  expect(last.rolling).toBe(false)
  expect(last.slots).toBe(0)
  expect(last.text).toBe('5,950')
  // La frase oculta ya tiene el total nuevo
  expect(await page.locator('[data-room="patio"] .g-price__spoken').textContent()).toContain('5,950 pesos mexicanos')
  // Bajar: data-direction down
  const dir = await page.evaluate(() => new Promise((resolve) => {
    window.__price.nights.value = 2
    requestAnimationFrame(() => resolve(document.querySelector('[data-room="patio"] .g-price__total-amount').dataset.direction))
  }))
  expect(dir).toBe('down')
})

test('A con movimiento reducido: ninguna capa queda (se retira en el acto) y el total nuevo está en su sitio', async ({ page }) => {
  await open(page, '?c=A', { reduce: true })
  await page.evaluate(() => { window.__price.nights.value = 3 })
  await settle(page, 30)
  const s = await page.locator('[data-room="patio"] .g-price__total-amount').evaluate((el) => ({ rolling: el.classList.contains('is-rolling'), slots: el.querySelectorAll('.g-price__roll-slot').length, dir: el.dataset.direction, text: el.querySelector('.g-price__number').textContent }))
  expect(s).toEqual({ rolling: false, slots: 0, dir: undefined, text: '5,950' })
})

test('rendimiento: 50 GPrice con total cambiando a la vez, sin tarea larga > 50 ms', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Long Tasks API solo en Chromium')
  await open(page, '?c=A&many=50')
  expect(await page.locator('.pr-many .g-price').count()).toBe(50)
  const result = await page.evaluate(() => new Promise((resolve) => {
    const long = []
    const po = new PerformanceObserver((l) => { for (const e of l.getEntries()) long.push(Math.round(e.duration)) })
    po.observe({ type: 'longtask', buffered: false })
    let i = 0
    const step = () => {
      window.__price.nights.value = (window.__price.nights.value % 7) + 1
      if (++i < 6) setTimeout(step, 400)
      else setTimeout(() => { po.disconnect(); resolve({ long, rolling: document.querySelectorAll('.pr-many .is-rolling').length }) }, 600)
    }
    step()
  }))
  expect(result.long.filter((d) => d > 50), `tareas largas ${result.long}`).toEqual([])
  expect(result.rolling).toBe(0)
})
