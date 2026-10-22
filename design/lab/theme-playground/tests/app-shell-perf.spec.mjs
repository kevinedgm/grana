// GAppShell · rendimiento de B (app-shell.md «Verificación · Playwright», rúbrica G; encargo 5 de coco en
// design/lab/app-shell/estilo.md): con header="relay", desplazar no vuelve a pintar Vue (el chasis escribe is-yielded
// directamente en la raíz; el manejador es pasivo y solo decide «cede / no cede»), el manejador cuesta poco por evento y
// el DOM del chasis no cambia de nodos. Además, la MEDIDA (no compuerta) del coste de :root:has(.g-app-shell …) en una
// página con 2000 nodos. Banco: packages/vue/playground/app-shell.html (cuenta las actualizaciones en window.__gUpdates).
// Un solo proceso por puerto: GRANA_PW_PORT=4212.
import { test, expect } from '@playwright/test'

const PAGE = '/packages/vue/playground/app-shell.html'
const settle = (p) => p.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 40)))))

async function open(page, qs) {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(PAGE + qs)
  await page.waitForSelector('#sb.is-ready')
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(300)
  await settle(page)
}

test.describe('GAppShell · rendimiento de B', () => {
  test('bajar y subir 2000 px por pasos con B: las actualizaciones de Vue son solo las de los umbrales del encabezado, sin nodos nuevos en el chasis', async ({ page }) => {
    await open(page, '?header=relay&mode=expanded&long=120')
    const r = await page.evaluate(async () => {
      const root = document.querySelector('.g-app-shell')
      const before = window.__gUpdates
      const by0 = { ...window.__gUpdatesBy }
      let nodes = 0
      let yields = 0
      const mo = new MutationObserver((list) => {
        for (const m of list) {
          if (m.type === 'childList' && m.target.closest && !m.target.closest('.g-toaster, .g-status-island')) nodes += m.addedNodes.length + m.removedNodes.length
          if (m.type === 'attributes' && m.target === root && m.attributeName === 'class') yields++
        }
      })
      mo.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] })
      const frame = () => new Promise((r) => requestAnimationFrame(r))
      for (let y = 0; y <= 2000; y += 40) { scrollTo(0, y); await frame() }
      for (let y = 2000; y >= 1000; y -= 40) { scrollTo(0, y); await frame() }
      for (let y = 1000; y <= 2400; y += 40) { scrollTo(0, y); await frame() }
      await new Promise((r) => setTimeout(r, 300))
      mo.disconnect()
      const by = Object.fromEntries(Object.entries(window.__gUpdatesBy).map(([k, v]) => [k, v - (by0[k] || 0)]).filter(([, v]) => v))
      return { updates: window.__gUpdates - before, by, nodes, yields, yielded: root.classList.contains('is-yielded') }
    })
    test.info().annotations.push({ type: 'medida', description: `actualizaciones de Vue por componente: ${JSON.stringify(r.by)}` })
    expect(r.yielded).toBe(true)
    expect(r.yields).toBeGreaterThanOrEqual(3) // cedió, volvió y volvió a ceder
    // El chasis nunca se vuelve a pintar por desplazar. GPageHeader, solo al cruzar sus umbrales (is-sticky / is-stuck);
    // GToaster y GStatusIsland leen el registro de bordes y se actualizan una vez por cesión o vuelta (la banda publica 0 o
    // 56): acotado por el número de relevos, nunca por cuadro
    expect(r.by.GAppShell || 0).toBe(0)
    expect(r.by.GPageHeader || 0).toBeLessThanOrEqual(4)
    for (const [name, n] of Object.entries(r.by)) expect(n, name).toBeLessThanOrEqual(r.yields + 2)
    // Las sondas de medida entran y salen en el mismo turno (no llegan a pintarse); nada más cambia de nodos
    expect(r.nodes % 2).toBe(0)
  })

  test('el manejador de desplazamiento cuesta poco por evento (medido, tope generoso)', async ({ page }) => {
    await open(page, '?header=relay&mode=expanded&long=120')
    const ms = await page.evaluate(async () => {
      const frame = () => new Promise((r) => requestAnimationFrame(r))
      const times = []
      for (let y = 0; y <= 2000; y += 20) {
        scrollTo(0, y)
        const t0 = performance.now()
        window.dispatchEvent(new Event('scroll')) // los manejadores corren síncronos aquí (además del evento del navegador)
        times.push(performance.now() - t0)
        await frame()
      }
      times.sort((a, b) => a - b)
      return { median: times[Math.floor(times.length / 2)], p95: times[Math.floor(times.length * 0.95)] }
    })
    test.info().annotations.push({ type: 'medida', description: `scroll con B: mediana ${ms.median.toFixed(3)} ms, p95 ${ms.p95.toFixed(3)} ms` })
    expect(ms.median).toBeLessThan(4)
  })

  test(':root:has(.g-app-shell …) en una página con 2000 nodos (medida, no compuerta)', async ({ page }) => {
    await open(page, '?mode=expanded')
    const ms = await page.evaluate(async () => {
      const host = document.querySelector('#ct > .g-container__body')
      const box = document.createElement('div')
      for (let i = 0; i < 2000; i++) box.appendChild(document.createElement('span'))
      host.appendChild(box)
      const target = box.children[1000]
      const runs = []
      for (let i = 0; i < 40; i++) {
        const t0 = performance.now()
        target.classList.toggle('x')
        void getComputedStyle(document.documentElement).scrollPaddingBlockStart
        runs.push(performance.now() - t0)
        await new Promise((r) => requestAnimationFrame(r))
      }
      box.remove()
      runs.sort((a, b) => a - b)
      return runs[Math.floor(runs.length / 2)]
    })
    test.info().annotations.push({ type: 'medida', description: `:root:has() con 2000 nodos: mediana ${ms.toFixed(3)} ms por cambio` })
    expect(ms).toBeLessThan(50) // solo para que la medida no sea absurda
  })
})
