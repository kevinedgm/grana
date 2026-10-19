// GFab · rendimiento (design/contracts/fab.md «Verificación · Playwright»: «abrir con 15 no supera 1 cuadro largo; el
// desplazamiento no vuelve a pintar Vue»; lección de bd888df; hallazgo H3 de design/lab/fab/auditoria.md) sobre el
// COMPONENTE REAL (dist/fab.umd.js) en su banco ligero packages/vue/playground/fab.html: en el playground completo la cifra
// sería de la página (miles de elementos de las demás secciones), no del componente.
// Qué se mide, en Chromium, Firefox y WebKit:
//   · abrir y cerrar A con 15 acciones (pila con cola), abrir el panel de «Más acciones» (11) y abrir C con 15 (panel de 14)
//     y escribir «exportar» letra a letra: el tiempo hasta el primer cuadro pintado (del gesto al temporizador que sigue
//     al primer requestAnimationFrame) y los cuadros largos (> 50 ms entre dos cuadros) durante toda la coreografía;
//   · desplazar el contenedor con la lista abierta (anchor="container") no cambia el DOM del FAB salvo variables de estilo
//     (Vue no vuelve a pintar) y un render del padre que no toca al FAB no le hace medir nada (0 getBoundingClientRect),
//     tampoco con `items` como arreglo nuevo en cada render (`:items="acciones.filter(…)"`).
// Como las de la voz F2 (#264) y el combobox (#428), los umbrales de tiempo se exigen SOLO con un worker (con varios, la
// medida no es repetible y solo se anota); las cuentas de DOM y de medidas se exigen siempre:
//   GRANA_PW_PORT=4212 npx playwright test tests/fab-perf.spec.mjs --workers=1
// Tres repeticiones por caso (la primera en frío); se exige la mediana y se anotan las tres.
import { test, expect } from '@playwright/test'

test.setTimeout(120_000)

const PAGE = '/packages/vue/playground/fab.html'
const LONG = 50 // cuadro largo (Long Animation Frames, RAIL)
// Hasta el primer cuadro pintado (incluye esperar al siguiente refresco, ≤ 16,7 ms): dos cuadros y algo de margen en
// Chromium y Firefox; WebKit con más, como en #264 y #428
const WORK = { chromium: 40, firefox: 40, webkit: 50 }

function watchConsole(page) {
  const errs = []
  page.on('pageerror', (e) => { if (!/ResizeObserver loop/.test(e.message)) errs.push(`pageerror: ${e.message}`) })
  page.on('console', (m) => { if (m.type() === 'error' && !/favicon|Failed to load resource/.test(m.text())) errs.push(`console: ${m.text()}`) })
  return errs
}
async function load(page, qs) {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto(`${PAGE}?${qs}`)
  await page.waitForFunction(() => window.__ready && document.getElementById('fab'))
  await page.evaluate(() => document.fonts.ready)
  // Medidor en la página: lanza `act` y registra el primer cuadro y los huecos entre cuadros durante `ms`
  await page.evaluate(() => {
    window.__measure = (act, ms = 400) => new Promise((resolve) => {
      const t0 = performance.now()
      act()
      const sync = performance.now() - t0
      let first = 0
      let last = t0
      const gaps = []
      const tick = (now) => {
        const t = performance.now()
        // El primer cuadro, pintado: el temporizador que sigue al primer requestAnimationFrame corre tras su estilo,
        // composición y pintura
        if (!gaps.length) setTimeout(() => { first = performance.now() - t0 }, 0)
        gaps.push(t - last)
        last = t
        if (t - t0 < ms) requestAnimationFrame(tick)
        else resolve({ sync, first, max: Math.max(...gaps), long: gaps.filter((g) => g > 50).length })
      }
      requestAnimationFrame(tick)
    })
  })
}
const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)]
const gate = () => test.info().config.workers === 1

async function report(name, browserName, runs) {
  const first = runs.map((r) => Math.round(r.first))
  const max = runs.map((r) => Math.round(r.max))
  const long = runs.map((r) => r.long)
  const line = `${browserName} ${name}: primer cuadro ${first.join(' / ')} ms (mediana ${median(first)}; umbral ${WORK[browserName]}) · cuadro más largo ${max.join(' / ')} ms · cuadros > ${LONG} ms ${long.join(' / ')}`
  test.info().annotations.push({ type: 'rendimiento', description: line + (gate() ? ' (exigido)' : ' (registrado: varios workers)') })
  console.log(`[fab perf] ${line}`)
  if (gate()) {
    expect(median(first), line).toBeLessThan(WORK[browserName])
    expect(median(long), line).toBeLessThanOrEqual(1)
  }
}

test('A · abrir y cerrar con 15 acciones y abrir el panel de «Más acciones» (11) sin cuadros largos', async ({ page, browserName }) => {
  const errs = watchConsole(page)
  await load(page, 'n=15')
  const open = [], more = [], close = []
  for (let k = 0; k < 3; k++) {
    open.push(await page.evaluate(() => window.__measure(() => document.getElementById('fab-trigger').click())))
    expect(await page.evaluate(() => document.getElementById('fab-menu').dataset.state)).toBe('open')
    expect(await page.locator('#fab-menu .g-fab__item').count()).toBe(5)
    more.push(await page.evaluate(() => window.__measure(() => document.querySelector('#fab-menu .g-fab__item--more').click())))
    expect(await page.locator('#fab-more .g-fab__item').count()).toBe(11)
    await page.keyboard.press('Escape') // cierra el panel de la cola
    await page.waitForTimeout(200)
    close.push(await page.evaluate(() => window.__measure(() => document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })))))
    expect(await page.evaluate(() => document.getElementById('fab').dataset.state)).toBe('closed')
    await page.waitForTimeout(150)
  }
  await report('A abrir 15', browserName, open)
  await report('A panel de la cola (11)', browserName, more)
  await report('A cerrar', browserName, close)
  expect(errs).toEqual([])
})

test('C · abrir con 15 (panel de 14) y escribir «exportar» letra a letra sin cuadros largos', async ({ page, browserName }) => {
  const errs = watchConsole(page)
  await load(page, 'n=15&main=1')
  const open = [], keys = []
  for (let k = 0; k < 3; k++) {
    open.push(await page.evaluate(() => window.__measure(() => document.getElementById('fab-trigger').click())))
    await page.waitForTimeout(100)
    const per = []
    for (const ch of 'exportar') per.push(await page.evaluate((ch) => window.__measure(() => document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: ch, bubbles: true, cancelable: true })), 120), ch))
    // Por pasada, la letra más lenta
    keys.push(per.reduce((a, b) => (b.first > a.first ? b : a)))
    await expect(page.locator('#fab-menu .g-fab__find-count')).toHaveText('1 acción')
    await page.keyboard.press('Escape')
    await page.keyboard.press('Escape')
    await page.waitForFunction(() => document.getElementById('fab').dataset.state === 'closed')
    await page.waitForTimeout(150)
  }
  await report('C abrir 15', browserName, open)
  await report('C escribir (la letra más lenta)', browserName, keys)
  expect(errs).toEqual([])
})

test('desplazar con la lista abierta (anchor="container") solo mueve variables: Vue no vuelve a pintar', async ({ page }) => {
  const errs = watchConsole(page)
  await load(page, 'n=10&anchor=container')
  await page.evaluate(() => document.getElementById('frame').scrollIntoView({ block: 'center', behavior: 'instant' }))
  await page.click('#fab-trigger')
  await page.waitForFunction(() => document.getElementById('fab-menu').dataset.state === 'open')
  await page.waitForTimeout(300)
  const r = await page.evaluate(() => new Promise((resolve) => {
    const root = document.getElementById('fab')
    const ul = document.getElementById('fab-menu')
    const other = []
    let style = 0
    const mo = new MutationObserver((ms) => {
      for (const m of ms) {
        if (m.type === 'attributes' && m.attributeName === 'style') style++
        else other.push(`${m.type}:${m.attributeName || ''}:${m.target.className || m.target.nodeName}`)
      }
    })
    mo.observe(root, { subtree: true, childList: true, attributes: true, characterData: true })
    const sc = document.getElementById('frame-scroll')
    const fab = document.getElementById('fab-trigger')
    const gap = () => ul.getBoundingClientRect().bottom - fab.getBoundingClientRect().top
    const g0 = gap()
    const y0 = ul.getBoundingClientRect().top
    const gaps = []
    let n = 0
    // 20 cuadros desplazando el contenido del marco y 10 desplazando la página (el marco, con el FAB, se mueve)
    const step = () => {
      if (n < 20) sc.scrollTop += 4
      else { window.scrollBy(0, 3); gaps.push(gap()) }
      if (++n < 30) requestAnimationFrame(step)
      else requestAnimationFrame(() => requestAnimationFrame(() => { mo.disconnect(); resolve({ other, style, state: ul.dataset.state, moved: ul.getBoundingClientRect().top - y0, scrolled: sc.scrollTop, g0, g1: gap() }) }))
    }
    requestAnimationFrame(step)
  }))
  // La lista sigue abierta y pegada al FAB: al desplazar la página la siguen sus variables de posición, nada más
  expect(r.state).toBe('open')
  expect(r.scrolled).toBeGreaterThan(0)
  expect(Math.abs(r.moved), 'la lista acompañó al FAB al desplazar la página').toBeGreaterThan(20)
  expect(Math.abs(r.g1 - r.g0), 'misma distancia de la lista al FAB').toBeLessThan(0.5)
  expect(r.style).toBeGreaterThan(0)
  expect(r.other, r.other.join('\n')).toEqual([])
  expect(errs).toEqual([])
})

for (const inline of [false, true]) {
  test(`un render del padre con la lista abierta no hace medir al FAB${inline ? ' (items como arreglo nuevo en cada render)' : ''}`, async ({ page }) => {
    const errs = watchConsole(page)
    await load(page, `n=10${inline ? '&inline=1' : ''}`)
    await page.click('#fab-trigger')
    await page.waitForFunction(() => document.getElementById('fab-menu').dataset.state === 'open')
    await page.waitForTimeout(300)
    const r = await page.evaluate(async () => {
      const root = document.getElementById('fab')
      const focus0 = document.activeElement
      const proto = Element.prototype
      const orig = proto.getBoundingClientRect
      let calls = 0
      proto.getBoundingClientRect = function () { if (root.contains(this) || this.contains?.(root)) calls++; return orig.call(this) }
      const t0 = performance.now()
      for (let k = 0; k < 30; k++) {
        window.__b.st.tick++
        await new Promise((res) => requestAnimationFrame(() => setTimeout(res, 0)))
      }
      const ms = performance.now() - t0
      proto.getBoundingClientRect = orig
      return { calls, ms, tick: document.getElementById('tick').textContent, same: document.activeElement === focus0, state: root.dataset.state }
    })
    expect(r.tick).toContain('30')
    expect(r.state).toBe('open')
    expect(r.same, 'el foco no se mueve').toBe(true)
    expect(r.calls, `medidas del FAB en 30 renders del padre (${Math.round(r.ms)} ms)`).toBe(0)
    expect(errs).toEqual([])
  })
}
