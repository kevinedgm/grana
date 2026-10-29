// «Una sola luz» · compuerta de rendimiento (DECISIONS #963; api.md «Una sola luz», rúbrica G). Se exige con un worker:
//   GRANA_PW_PORT=4208 npx playwright test tests/glide-perf.spec.mjs --workers=1
// Tabla de 500 filas (llana, A y B) y sidebar de 60 items con un submenú abierto; barrido de 300 pointermove:
//   · trabajo de la sesión por cuadro (búsqueda + colocación: la devolución de rAF que llama a elementFromPoint)
//     p95 ≤ 2 ms en Chromium y Firefox, ≤ 4 ms en WebKit;
//   · 0 tareas largas (> 50 ms; PerformanceObserver «longtask» donde existe, y ninguna devolución de la sesión > 50 ms);
//   · como mucho un elementFromPoint y dos lecturas de caja por cuadro;
//   · ninguna escucha por fila: las mismas escuchas pointermove con 10 y con 500 filas (y con 4 y 60 items);
//   · ninguna medida en un render del padre con props en línea (lección de bd888df).
import { test, expect } from '@playwright/test'
import { mountGlide } from './glide-helpers.mjs'

test.setTimeout(240_000)

const LIMIT = { chromium: 2, firefox: 2, webkit: 4 }
const p95 = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(s.length * 0.95))] : 0 }

// Envuelve requestAnimationFrame: por cada devolución que mide (elementFromPoint o una lectura de caja: la sesión cuando
// cambia de destino; un cuadro sin cambio de destino no lee nada), su duración y cuántas búsquedas y lecturas hizo
const instrumentFrames = (page) => page.evaluate(() => {
  const c = window.__count
  const raf = window.requestAnimationFrame.bind(window)
  window.__frames = []
  window.__long = []
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__long.push(e.duration) }).observe({ type: 'longtask', buffered: false }) } catch {}
  window.requestAnimationFrame = (fn) => raf((t) => {
    const e0 = c.efp, g0 = c.gbcr, s = performance.now()
    fn(t)
    if (c.efp > e0 || c.gbcr > g0) window.__frames.push({ d: performance.now() - s, efp: c.efp - e0, gb: c.gbcr - g0 })
  })
})

async function warm(page, rowsSel, xOf) {
  const b = (await page.$$eval(rowsSel, (els) => els.slice(1, 2).map((e) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height } })))[0]
  for (let i = 0; i < 30; i++) await page.mouse.move(xOf(b), b.y + 2 + (i * 7) % 300)
  await page.mouse.move(5, 5)
  await page.waitForTimeout(300)
}
async function sweepPerf(page, rowsSel, xOf) {
  await warm(page, rowsSel, xOf)
  await page.evaluate(() => { window.__frames.length = 0; window.__long.length = 0 })
  const bx = await page.$$eval(rowsSel, (els) => els.slice(0, 40).map((e) => { const b = e.getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height } }).filter((b) => b.y > 0 && b.y + b.h < innerHeight))
  const x = xOf(bx[0])
  const y0 = bx[0].y + 2
  const span = Math.min(bx[bx.length - 1].y + bx[bx.length - 1].h - 2 - y0, 900)
  for (let i = 0; i < 300; i++) await page.mouse.move(x, y0 + ((i * 3) % span))
  await page.waitForTimeout(200)
  return page.evaluate(() => ({ frames: window.__frames.splice(0), long: window.__long.splice(0) }))
}
const check = (r, browserName, label) => {
  const ds = r.frames.map((f) => f.d)
  const info = `${label}: ${r.frames.length} cuadros, p95 ${p95(ds).toFixed(2)} ms, máx ${Math.max(0, ...ds).toFixed(2)} ms`
  console.log(`[${browserName}] ${info}`)
  expect(r.frames.length, `${label}: la sesión trabajó`).toBeGreaterThanOrEqual(8)
  expect(p95(ds), info).toBeLessThanOrEqual(LIMIT[browserName])
  expect(Math.max(0, ...ds), `${label}: ninguna devolución larga`).toBeLessThan(50)
  expect(r.long, `${label}: tareas largas`).toEqual([])
  expect(Math.max(...r.frames.map((f) => f.efp)), `${label}: elementFromPoint por cuadro`).toBeLessThanOrEqual(1)
  expect(Math.max(...r.frames.map((f) => f.gb)), `${label}: lecturas de caja por cuadro`).toBeLessThanOrEqual(2)
}

test.describe('una sola luz · rendimiento (#963)', () => {
  for (const id of ['gt-plain', 'gt-door', 'gt-detail']) {
    test(`tabla de 500 filas · ${id}`, async ({ page, browserName }) => {
      await mountGlide(page, { only: 'tables', tables: [id], rows: 500, instrument: true, isolate: true, viewport: { width: 1280, height: 900 } })
      await instrumentFrames(page)
      const sel = id === 'gt-door' ? `#${id} tbody td.g-table__cell--primary` : `#${id} tbody .g-table__row`
      check(await sweepPerf(page, sel, (b) => (id === 'gt-door' ? b.x + b.w / 2 : b.x + b.w * 0.6)), browserName, `${id} · 500 filas`)
    })
  }

  test('sidebar de 60 items con un submenú abierto', async ({ page, browserName }) => {
    await mountGlide(page, { only: 'sidebar', sbItems: 56, instrument: true, isolate: true, sbHeight: 860 })
    await page.locator('#gl-sb [data-id="proj"]').click()
    await page.mouse.move(600, 5); await page.waitForTimeout(450)
    expect(await page.locator('#gl-sb .g-sidebar__link').count()).toBeGreaterThanOrEqual(60)
    await instrumentFrames(page)
    check(await sweepPerf(page, '#gl-sb .g-sidebar__link', (b) => b.x + 40), browserName, 'sidebar · 60 items')
  })

  test('ninguna escucha por fila: las mismas con 10 y con 500 filas; en el sidebar, una por lista', async ({ page }) => {
    const count = async (o) => {
      await mountGlide(page, { instrument: true, viewport: { width: 1280, height: 900 }, ...o })
      return page.evaluate(() => ({ all: window.__count.listen.pointermove || 0, hosts: window.__count.hosts, lists: document.querySelectorAll('#gl-host .g-sidebar__list, #gl-host .g-sidebar__fly-list').length, links: document.querySelectorAll('#gl-host .g-sidebar__link').length }))
    }
    const t10 = await count({ only: 'tables', rows: 10 })
    const t500 = await count({ only: 'tables', rows: 500 })
    expect(t500.all, `tablas: ${t10.all} pointermove con 10 filas, ${t500.all} con 500`).toBe(t10.all)
    expect(t500.hosts, 'tablas: una escucha por anfitrión').toBe(t10.hosts)
    const s4 = await count({ only: 'sidebar' })
    const s60 = await count({ only: 'sidebar', sbItems: 56 })
    // La luz: una pointermove por lista, la tenga con 4 o con 60 enlaces (las de la pista del riel son de visualTip)
    expect(s4.hosts, `sidebar: ${s4.hosts} anfitriones para ${s4.lists} listas`).toBe(s4.lists)
    expect(s60.hosts, `sidebar: ${s60.hosts} anfitriones para ${s60.lists} listas y ${s60.links} enlaces`).toBe(s60.lists)
  })

  test('ninguna medida de la luz en un render del padre con props en línea', async ({ page }) => {
    await mountGlide(page, { only: 'tables', tables: ['gt-plain'], rows: 50, instrument: true, inline: true, viewport: { width: 1280, height: 900 } })
    const b = await page.locator('#gt-plain tbody .g-table__row').nth(2).boundingBox()
    await page.mouse.move(b.x + b.width * 0.6, b.y + b.height / 2); await page.waitForTimeout(300)
    const r = await page.evaluate(async () => {
      const host = document.querySelector('#gt-plain .g-table__scroll')
      const layer = host.querySelector(':scope > .g-table__highlight')
      const style0 = host.getAttribute('style') + '|' + layer.getAttribute('style')
      const lit0 = host.classList.contains('has-highlight')
      const e0 = window.__count.efp
      for (let i = 0; i < 20; i++) {
        window.__gt.tick++
        await new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(res)))
      }
      return { efp: window.__count.efp - e0, same: host.getAttribute('style') + '|' + layer.getAttribute('style') === style0, lit: lit0 && host.classList.contains('has-highlight') }
    })
    expect(r.efp, 'elementFromPoint durante 20 renders del padre').toBe(0)
    expect(r.same, 'sin escrituras de la luz').toBe(true)
    expect(r.lit, 'la luz sigue encendida (las filas no cambiaron)').toBe(true)
  })
})
