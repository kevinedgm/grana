// GTable · filas por página con la fila ancla y el pie acoplado (B «Pie que acompaña», #592 a #596) sobre el COMPONENTE
// REAL (packages/vue/playground/table-rows.html?c=size: dist/grana.umd.js), en Chromium, Firefox y WebKit. Port de la
// verificación de kiwi (design/lab/pagination/r02/verificar.mjs, concepto B) y de los puntos de navegador del contrato
// (design/contracts/table.md «Pruebas (bruno)»): página por ancla (100 → 10 con la fila 62 arriba da la página 7), Δ ≤ 1px
// de la fila en cada cuadro (local, servidor con la ranura del esqueleto y maxHeight dentro de g-table__scroll), foco en el
// radio, un solo anuncio, orden de eventos, pie acoplado con su borde en el de la ventana y desacoplado al final,
// scroll-margin (Tab hasta una fila bajo el pie la deja a la vista), filtros, «aquí estabas» y 360px con 44px.
// Ejecutar desde design/lab/theme-playground: GRANA_PW_PORT=4227 npx playwright test tests/table-page-size.spec.mjs
import { test, expect } from '@playwright/test'

const PAGE = '/packages/vue/playground/table-rows.html'

function watchConsole(page) {
  const errs = []
  page.on('pageerror', (e) => { if (!/ResizeObserver loop/.test(e.message)) errs.push(`pageerror: ${e.message}`) })
  page.on('console', (m) => {
    const t = m.text()
    if (m.type() === 'error' && !/favicon/.test(t)) errs.push(`console: ${t}`)
    else if (m.type() === 'warning' && /\[Vue warn\]|\[Grana/.test(t)) errs.push(`warning: ${t}`)
  })
  return errs
}
const frames = (page, n = 3) => page.evaluate((n) => new Promise((r) => { const f = (k) => (k ? requestAnimationFrame(() => f(k - 1)) : setTimeout(r, 20)); f(n) }), n)
async function open(page, qs = '', viewport = { width: 1280, height: 900 }) {
  await page.setViewportSize(viewport)
  await page.goto(`${PAGE}?c=size${qs}`)
  await page.waitForFunction(() => window.__tb && window.__tb.ready && document.querySelector('#tb tbody tr.g-table__row'))
  await page.evaluate(() => document.fonts.ready)
  await frames(page)
}
const idle = (page) => page.waitForFunction(() => document.querySelector('#tb table').getAttribute('aria-busy') === 'false' && !window.__tb.loading.value, null, { timeout: 8000 })
// Fila por su código (la puerta no existe en este banco: el título es texto)
const ROW = (code) => `[...document.querySelectorAll('#tb tbody tr.g-table__row')].find((tr) => tr.querySelector('.g-table__title')?.textContent === '${code}')`
const topOf = (page, code) => page.evaluate((code) => { const tr = [...document.querySelectorAll('#tb tbody tr.g-table__row')].find((t) => t.querySelector('.g-table__title')?.textContent === code); return tr ? tr.getBoundingClientRect().top : null }, code)
// Coloca la fila `code` a `y` px del borde superior de la ventana (o del área desplazable con maxHeight)
async function park(page, code, y = 2, inner = false) {
  await page.evaluate(([code, y, inner]) => {
    const tr = [...document.querySelectorAll('#tb tbody tr.g-table__row')].find((t) => t.querySelector('.g-table__title')?.textContent === code)
    if (inner) {
      const sc = document.querySelector('#tb .g-table__scroll')
      document.querySelector('#tb').scrollIntoView({ block: 'start' })
      const head = sc.querySelector('thead').getBoundingClientRect().height
      sc.scrollTop += tr.getBoundingClientRect().top - (sc.getBoundingClientRect().top + head + y)
    } else scrollBy(0, tr.getBoundingClientRect().top - y)
  }, [code, y, inner])
  await frames(page)
}
// Muestreo por cuadro del borde superior de una fila (y de las ranuras del esqueleto) mientras dura el gesto
async function sample(page, code, slot = null) {
  await page.evaluate(([code, slot]) => {
    const out = (window.__smp = [])
    window.__smpStop = false
    const tick = () => {
      const rows = [...document.querySelectorAll('#tb tbody tr')]
      const tr = rows.find((t) => !t.hasAttribute('aria-hidden') && t.querySelector('.g-table__title')?.textContent === code)
      const sk = slot != null && rows[0] && rows[0].hasAttribute('aria-hidden') ? rows[slot] : null
      out.push({ row: tr ? tr.getBoundingClientRect().top : null, slot: sk ? sk.getBoundingClientRect().top : null, sk: rows.filter((t) => t.hasAttribute('aria-hidden')).length })
      if (!window.__smpStop) requestAnimationFrame(tick)
    }
    tick()
  }, [code, slot])
  return () => page.evaluate(() => { window.__smpStop = true; return window.__smp })
}
// Escrituras de la región viva de la tabla
async function listen(page) {
  await page.evaluate(() => {
    const p = document.querySelector('#tb > p.g-table__sr[aria-live]')
    window.__said = []
    window.__mo = new MutationObserver(() => { if (p.textContent) window.__said.push(p.textContent) })
    window.__mo.observe(p, { childList: true, characterData: true, subtree: true })
  })
  return () => page.evaluate(() => { window.__mo.disconnect(); return window.__said })
}
const events = (page, from) => page.evaluate((n) => window.__tb.events.value.slice(n).filter((e) => /^update:/.test(e[0])).map((e) => `${e[0]} ${e[1]}`), from)
const radio = (n) => `#tb .g-pagination__size-input[value="${n}"]`
// Teclado como una persona: foco en el radio marcado y flechas
async function arrowTo(page, n) {
  const order = [10, 25, 50, 100]
  const now = await page.evaluate(() => window.__tb.size.value)
  await page.focus(radio(now))
  const d = order.indexOf(n) - order.indexOf(now)
  for (let i = 0; i < Math.abs(d); i++) { await page.keyboard.press(d > 0 ? 'ArrowRight' : 'ArrowLeft'); await frames(page, 1) }
}
const maxDelta = (s, base, key = 'row') => Math.max(0, ...s.filter((x) => x[key] != null).map((x) => Math.abs(x[key] - base)))

test.describe('GTable · filas por página: la fila ancla (local)', () => {
  test('10 → 25 desde la página 2 con la fila 15 arriba: página 1, la fila no se mueve en ningún cuadro, foco en el radio, un anuncio', async ({ page }) => {
    const errs = watchConsole(page)
    await open(page)
    await page.evaluate(() => { window.__tb.page.value = 2 })
    await frames(page)
    await park(page, 'LT-0015')
    const before = await topOf(page, 'LT-0015')
    const n0 = await page.evaluate(() => window.__tb.events.value.length)
    const said = await listen(page)
    const stop = await sample(page, 'LT-0015')
    await arrowTo(page, 25)
    await frames(page, 6)
    const s = await stop()
    expect(await page.evaluate(() => [window.__tb.page.value, window.__tb.size.value])).toEqual([1, 25])
    expect(maxDelta(s, before)).toBeLessThanOrEqual(1)
    expect(await page.evaluate((sel) => document.activeElement === document.querySelector(sel), radio(25))).toBe(true)
    expect(await events(page, n0)).toEqual(['update:pageSize 25', 'update:page 1'])
    await page.waitForTimeout(150)
    expect(await said()).toEqual(['Filas 1–25 de 240'])
    expect(await page.evaluate(() => document.querySelector('#tb .g-pagination__range').hasAttribute('role'))).toBe(false)
    expect(errs).toEqual([])
  })

  test('«aquí estabas»: la fila ancla lleva is-here y las que entran is-new; se apaga', async ({ page }) => {
    await open(page)
    await page.evaluate(() => { window.__tb.page.value = 2 })
    await frames(page)
    await park(page, 'LT-0015')
    await arrowTo(page, 25)
    await frames(page, 2)
    const m = await page.evaluate((r) => { const tr = eval(r); return { here: tr.classList.contains('is-here'), n: document.querySelectorAll('#tb tr.is-here').length, fresh: document.querySelectorAll('#tb tr.is-new').length } }, ROW('LT-0015'))
    expect(m).toEqual({ here: true, n: 1, fresh: 15 })
    await page.waitForFunction(() => !document.querySelector('#tb tr.is-here'), null, { timeout: 5000 })
  })

  test('25 → 100: la fila 15 no se mueve y el radio sigue a la vista (pie acoplado, la fila no cede)', async ({ page }) => {
    await open(page)
    await page.evaluate(() => { window.__tb.size.value = 25 })
    await frames(page)
    await park(page, 'LT-0015')
    const before = await topOf(page, 'LT-0015')
    const stop = await sample(page, 'LT-0015')
    await arrowTo(page, 100)
    await frames(page, 6)
    const s = await stop()
    expect(maxDelta(s, before)).toBeLessThanOrEqual(1)
    const ctl = await page.evaluate((sel) => { const r = document.querySelector(sel).closest('label').getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight }, radio(100))
    expect(ctl).toBe(true)
  })

  test('100 → 10 con la fila 62 arriba: el control a la vista sin bajar al pie; página 7 y la fila 62 no se mueve', async ({ page }) => {
    await open(page)
    await page.evaluate(() => { window.__tb.size.value = 100 })
    await frames(page)
    await park(page, 'LT-0062')
    await frames(page, 4)
    const bx = await page.evaluate((sel) => { const r = document.querySelector(sel).closest('label').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, vis: r.top >= 0 && r.bottom <= innerHeight } }, radio(10))
    expect(bx.vis).toBe(true)
    const before = await topOf(page, 'LT-0062')
    const stop = await sample(page, 'LT-0062')
    await page.mouse.click(bx.x, bx.y)
    await frames(page, 6)
    const s = await stop()
    expect(await page.evaluate(() => [window.__tb.page.value, window.__tb.size.value])).toEqual([7, 10])
    expect(maxDelta(s, before)).toBeLessThanOrEqual(1)
  })

  test('pie acoplado: con 100 filas se pega al borde inferior (is-stuck, --_dock-size) y al final vuelve a su sitio', async ({ page }) => {
    await open(page)
    await page.evaluate(() => { window.__tb.size.value = 100 })
    await frames(page)
    await page.evaluate(() => document.querySelector('#tb').scrollIntoView({ block: 'start' }))
    await page.evaluate(() => scrollBy(0, 300))
    await frames(page, 4)
    const st = await page.evaluate(() => {
      const n = document.querySelector('#tb nav.g-pagination')
      const r = n.getBoundingClientRect()
      return { dock: n.classList.contains('g-pagination--dock'), stuck: n.classList.contains('is-stuck'), bottom: r.bottom, vh: innerHeight, size: parseFloat(document.querySelector('#tb').style.getPropertyValue('--_dock-size')), h: r.height }
    })
    expect(st.dock).toBe(true)
    expect(st.stuck).toBe(true)
    expect(Math.abs(st.bottom - st.vh)).toBeLessThanOrEqual(1)
    expect(Math.abs(st.size - st.h)).toBeLessThanOrEqual(1)
    await page.evaluate(() => document.querySelector('#after').scrollIntoView({ block: 'end' }))
    await frames(page, 4)
    expect(await page.evaluate(() => document.querySelector('#tb nav.g-pagination').classList.contains('is-stuck'))).toBe(false)
  })

  test('scroll-margin: Tab hasta una casilla bajo el pie acoplado la deja a la vista, sobre el pie', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'WebKit sin «acceso total por teclado» no da Tab a las casillas')
    await open(page)
    await page.evaluate(() => { window.__tb.size.value = 50 })
    await frames(page)
    await page.evaluate(() => document.querySelector('#tb').scrollIntoView({ block: 'start' }))
    await page.evaluate(() => scrollBy(0, 200))
    await frames(page, 4)
    // La última casilla visible por encima del pie y la siguiente, tapada por él
    const i = await page.evaluate(() => {
      const nav = document.querySelector('#tb nav.g-pagination').getBoundingClientRect()
      const boxes = [...document.querySelectorAll('#tb tbody .g-table__select input')]
      return boxes.findIndex((b) => b.getBoundingClientRect().bottom > nav.top) - 1
    })
    expect(i).toBeGreaterThan(0)
    await page.evaluate((i) => document.querySelectorAll('#tb tbody .g-table__select input')[i].focus(), i)
    await page.keyboard.press('Tab')
    await frames(page, 4)
    const r = await page.evaluate(() => { const a = document.activeElement.getBoundingClientRect(); const n = document.querySelector('#tb nav.g-pagination').getBoundingClientRect(); return { bottom: a.bottom, navTop: n.top } })
    expect(r.bottom).toBeLessThanOrEqual(r.navTop + 1)
  })

  test('filtrar vuelve a la página 1 y conserva el tamaño', async ({ page }) => {
    await open(page)
    await page.evaluate(() => { window.__tb.size.value = 25; window.__tb.page.value = 3 })
    await frames(page)
    await page.evaluate(() => { window.__tb.filters.value = [{ key: 'place', op: 'contains', value: 'Anaquel 1' }] })
    await frames(page, 4)
    expect(await page.evaluate(() => [window.__tb.page.value, window.__tb.size.value])).toEqual([1, 25])
    expect(await page.evaluate(() => document.querySelector('#tb .g-pagination__size-input[value="25"]').checked)).toBe(true)
  })

  test('maxHeight: la fila se sujeta dentro de g-table__scroll', async ({ page }) => {
    await open(page, '&h=1')
    await page.evaluate(() => { window.__tb.page.value = 2 })
    await frames(page)
    await park(page, 'LT-0015', 2, true)
    const before = await topOf(page, 'LT-0015')
    const stop = await sample(page, 'LT-0015')
    await arrowTo(page, 25)
    await frames(page, 6)
    const s = await stop()
    expect(await page.evaluate(() => window.__tb.page.value)).toBe(1)
    expect(maxDelta(s, before)).toBeLessThanOrEqual(1)
    expect(await page.evaluate(() => document.querySelector('#tb .g-table__scroll').scrollTop)).toBeGreaterThan(0)
  })
})

test.describe('GTable · filas por página: servidor', () => {
  test('10 → 25: esqueleto con las 25 filas que llegan, la ranura del ancla en su sitio, la fila al llegar y dos anuncios', async ({ page }) => {
    const errs = watchConsole(page)
    await open(page, '&server=1')
    await page.evaluate(() => { window.__tb.page.value = 2 })
    await idle(page)
    await frames(page)
    await park(page, 'LT-0015')
    const before = await topOf(page, 'LT-0015')
    const said = await listen(page)
    const stop = await sample(page, 'LT-0015', 14)
    await arrowTo(page, 25)
    await page.waitForFunction(() => document.querySelector('#tb tbody tr[aria-hidden="true"]') && !document.querySelector('#tb').classList.contains('is-pending'), null, { timeout: 3000 })
    await frames(page, 2)
    expect(await page.evaluate(() => document.querySelectorAll('#tb tbody tr[aria-hidden="true"]').length)).toBe(25)
    await idle(page)
    await frames(page, 6)
    const s = await stop()
    expect(maxDelta(s, before, 'slot')).toBeLessThanOrEqual(1)
    expect(maxDelta(s, before, 'row')).toBeLessThanOrEqual(1)
    expect(await page.evaluate(() => window.__tb.events.value.filter((e) => e[0] === 'fetch').length)).toBe(2) // la página 2 y el cambio: una petición por gesto
    await page.waitForTimeout(100)
    expect(await said()).toEqual(['Cargando lotes…', 'Filas 1–25 de 240'])
    expect(errs).toEqual([])
  })
})

test.describe('GTable · filas por página: móvil', () => {
  test('360px: sin desplazamiento horizontal y, con puntero grueso, cada cifra ≥ 44px', async ({ browser, browserName }) => {
    const ctx = await browser.newContext({ viewport: { width: 360, height: 760 }, hasTouch: true, isMobile: browserName === 'chromium' })
    const page = await ctx.newPage()
    await page.goto(`${PAGE}?c=size`)
    await page.waitForFunction(() => window.__tb && window.__tb.ready)
    await frames(page, 4)
    const over = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
    expect(over).toBeLessThanOrEqual(0)
    if (await page.evaluate(() => matchMedia('(pointer: coarse)').matches)) {
      const box = await page.evaluate(() => [...document.querySelectorAll('#tb .g-pagination__size-option')].map((l) => { const r = l.getBoundingClientRect(); return [r.width, r.height] }))
      expect(box.every(([w, h]) => w >= 43.5 && h >= 43.5)).toBe(true)
    }
    await ctx.close()
  })
})
