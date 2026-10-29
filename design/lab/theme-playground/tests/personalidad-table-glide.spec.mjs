// GTable · «una sola luz» (DECISIONS #957, #958, #960 a #962; table.md «Una sola luz»). Traslado de la parte de la tabla
// de design/lab/hover-glide/r01/verificar.mjs (kiwi) sobre el GTable REAL del UMD: barrido a 1px en llana, A (columna
// principal) y B: 0 filas con fondo propio, ≤ 1 luz, 0 muestras sin luz dentro de los destinos; viaje con ≥ 3 cuadros
// intermedios y final exacto (±1px); entrar desde fuera aparece en su sitio; A en otra celda: ninguna luz; cabecera:
// ninguna; seleccionada conserva su fondo; la ficha de B apaga; carga apaga y al llegar los datos nada se enciende hasta
// mover el puntero; el puntero no mueve el foco; pulsado se queda; scroll con el puntero quieto sigue a la fila de
// debajo; `reduce` solo opacidad; `forced-colors` oculta; toque nada; RTL; `surface` y `cards`: como mucho una fila con
// fondo en cada instante del barrido y sin capa; consola limpia.
import { test, expect } from '@playwright/test'
import { mountGlide, watchConsole, sweep, travel, lights, boxes, ownBg, routeVue } from './glide-helpers.mjs'

test.setTimeout(120_000)

const ROWS = (id) => `#${id} tbody .g-table__row`
const PRIM = (id) => `#${id} tbody td.g-table__cell--primary`
const x60 = (b) => b.x + b.w * 0.6
const xMid = (b) => b.x + b.w / 2

test.describe('GTable · una sola luz', () => {
  test('barrido: 0 fondos propios, ≤ 1 luz, sin apagón (llana, A · puerta en la columna principal, B)', async ({ page }) => {
    const errs = watchConsole(page)
    await mountGlide(page, { only: 'tables' })
    for (const [rows, scope, xOf] of [[ROWS('gt-plain'), '#gt-plain', x60], [PRIM('gt-door'), '#gt-door', xMid], [ROWS('gt-detail'), '#gt-detail', x60]]) {
      const s = await sweep(page, rows, scope, xOf)
      expect(s.maxOwn, `${scope}: fondos propios`).toBe(0)
      expect(s.maxLights, `${scope}: luces a la vez`).toBeLessThanOrEqual(1)
      expect(s.dark, `${scope}: muestras sin luz (${s.samples})`).toBe(0)
    }
    expect(errs).toEqual([])
  })

  test('viaja con cuadros intermedios y termina exacto; entrar desde fuera aparece en su sitio', async ({ page }) => {
    await mountGlide(page, { only: 'tables' })
    for (const [rows, scope, xOf] of [[ROWS('gt-plain'), '#gt-plain', x60], [PRIM('gt-door'), '#gt-door', xMid]]) {
      const t = await travel(page, rows, scope, 1, 4, xOf)
      expect(t.frames, `${scope}: cuadros intermedios`).toBeGreaterThanOrEqual(3)
      const ok = t.l && Math.abs(t.l.y - t.b.y) <= 1 && Math.abs(t.l.h - t.b.h) <= 1 && Math.abs(t.l.x - t.b.x) <= 1 && Math.abs(t.l.w - t.b.w) <= 1
      expect(ok, `${scope}: final exacto ${JSON.stringify(t)}`).toBe(true)
    }
    await page.mouse.move(5, 5); await page.waitForTimeout(300)
    const b = (await boxes(page, ROWS('gt-plain')))[5]
    await page.mouse.move(x60(b), b.y + b.h / 2)
    await page.waitForTimeout(40)
    const l = (await lights(page, '#gt-plain'))[0]
    expect(l && Math.abs(l.y - b.y) <= 1, `aparece en su sitio ${JSON.stringify({ l, b })}`).toBe(true)
  })

  test('A: otra celda de la fila sin luz; cabecera sin luz; seleccionada conserva su fondo', async ({ page }) => {
    await mountGlide(page, { only: 'tables' })
    const c = await page.locator(ROWS('gt-door')).nth(2).locator('td').nth(1).boundingBox()
    await page.mouse.move(c.x + c.width / 2, c.y + c.height / 2); await page.waitForTimeout(150)
    expect(await lights(page, '#gt-door'), 'A en otra celda').toHaveLength(0)
    const th = await page.locator('#gt-plain thead th').nth(2).boundingBox()
    await page.mouse.move(th.x + 5, th.y + th.height / 2); await page.waitForTimeout(150)
    expect(await lights(page, '#gt-plain'), 'cabecera').toHaveLength(0)
    const sel = page.locator('#gt-plain tbody .g-table__row.is-selected')
    const s = await sel.boundingBox()
    await page.mouse.move(x60({ x: s.x, w: s.width }), s.y + s.height / 2); await page.waitForTimeout(250)
    expect(await sel.locator('td').nth(1).evaluate((td) => getComputedStyle(td).backgroundColor)).not.toBe('rgba(0, 0, 0, 0)')
    expect(await lights(page, '#gt-plain')).toHaveLength(1)
  })

  test('B: la ficha desplegada apaga; desplegar recoloca sin viajar en la misma fila', async ({ page }) => {
    await mountGlide(page, { only: 'tables' })
    const row = page.locator(ROWS('gt-detail')).nth(1)
    const r = await row.boundingBox()
    await page.mouse.move(r.x + r.width * 0.6, r.y + r.height / 2); await page.waitForTimeout(250)
    await page.mouse.down(); await page.mouse.up()
    await page.waitForTimeout(700)
    const l = (await lights(page, '#gt-detail'))[0]
    const r2 = await row.boundingBox()
    expect(l && Math.abs(l.y - r2.y) <= 1, JSON.stringify({ l, r2 })).toBe(true)
    const d = await page.locator('#gt-detail tr.g-table__detail').first().boundingBox()
    expect(d.height).toBeGreaterThan(10)
    await page.mouse.move(d.x + d.width * 0.6, d.y + d.height / 2); await page.waitForTimeout(200)
    expect(await lights(page, '#gt-detail'), 'sobre la ficha').toHaveLength(0)
  })

  test('carga apaga y nada se registra; al llegar los datos no se enciende hasta mover el puntero; cambio de filas apaga', async ({ page }) => {
    await mountGlide(page, { only: 'tables' })
    const b = (await boxes(page, ROWS('gt-plain')))[2]
    await page.mouse.move(x60(b), b.y + b.h / 2); await page.waitForTimeout(200)
    expect(await lights(page, '#gt-plain')).toHaveLength(1)
    await page.evaluate(() => { window.__gt.loading = true })
    await page.waitForTimeout(100)
    expect(await lights(page, '#gt-plain'), 'cargando').toHaveLength(0)
    await page.mouse.move(x60(b), b.y + b.h / 2 + 3); await page.waitForTimeout(150)
    expect(await lights(page, '#gt-plain'), 'cargando con movimiento').toHaveLength(0)
    await page.evaluate(() => { window.__gt.rows = window.__mkRows(8).reverse(); window.__gt.loading = false })
    await page.waitForTimeout(900)
    expect(await lights(page, '#gt-plain'), 'al llegar los datos').toHaveLength(0)
    await page.mouse.move(x60(b), b.y + b.h / 2); await page.waitForTimeout(150)
    expect(await lights(page, '#gt-plain'), 'con el siguiente movimiento').toHaveLength(1)
    await page.evaluate(() => { window.__gt.rows = window.__mkRows(8) })
    await page.waitForTimeout(150)
    expect(await lights(page, '#gt-plain'), 'cambio de filas sin gesto').toHaveLength(0)
  })

  test('el puntero no mueve el foco; pulsado se queda; scroll con el puntero quieto sigue a la fila de debajo', async ({ page }) => {
    await mountGlide(page, { only: 'tables' })
    await page.locator('#gt-door .g-table__door').first().focus()
    const before = await page.evaluate(() => document.activeElement.textContent)
    await sweep(page, ROWS('gt-detail'), '#gt-detail', x60)
    expect(await page.evaluate(() => document.activeElement.textContent)).toBe(before)

    const rows = page.locator(ROWS('gt-plain'))
    const a = await rows.nth(1).boundingBox(), c = await rows.nth(4).boundingBox()
    await page.mouse.move(a.x + a.width * 0.6, a.y + a.height / 2); await page.waitForTimeout(250)
    await page.mouse.down()
    await page.mouse.move(c.x + c.width * 0.6, c.y + c.height / 2, { steps: 6 }); await page.waitForTimeout(250)
    const l = (await lights(page, '#gt-plain'))[0]
    await page.mouse.up(); await page.waitForTimeout(300)
    const l2 = (await lights(page, '#gt-plain'))[0]
    expect(l && Math.abs(l.y - a.y) <= 1, 'pulsado: se queda').toBe(true)
    expect(l2 && Math.abs(l2.y - c.y) <= 1, 'al soltar: va a la de debajo').toBe(true)

    await page.setViewportSize({ width: 1280, height: 900 })
    await rows.nth(4).scrollIntoViewIfNeeded(); await page.waitForTimeout(200)
    const b = await rows.nth(2).boundingBox()
    const x = b.x + b.width * 0.6, y = b.y + b.height / 2
    await page.mouse.move(x, y); await page.waitForTimeout(250)
    await page.evaluate(() => window.scrollBy(0, 53)); await page.waitForTimeout(300)
    const under = await page.evaluate(([x, y]) => { const r = document.elementFromPoint(x, y).closest('tr'); const b = r.getBoundingClientRect(); return { y: b.y, h: b.height } }, [x, y])
    const l3 = (await lights(page, '#gt-plain'))[0]
    expect(l3 && Math.abs(l3.y - under.y) <= 1, `scroll: ${JSON.stringify({ l3, under })}`).toBe(true)
  })

  test('movimiento reducido: solo opacidad', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await mountGlide(page, { only: 'tables' })
    const tp = await page.locator('#gt-plain .g-table__highlight').evaluate((l) => getComputedStyle(l).transitionProperty)
    expect(tp).not.toMatch(/translate|size/)
  })

  test('forced-colors: la capa se oculta', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'forcedColors solo se emula en Chromium')
    await page.emulateMedia({ forcedColors: 'active' })
    await mountGlide(page, { only: 'tables' })
    expect(await page.locator('#gt-plain .g-table__highlight').evaluate((l) => getComputedStyle(l).display)).toBe('none')
  })

  test('RTL: la luz de la puerta cae sobre su celda', async ({ page }) => {
    await mountGlide(page, { only: 'tables', dir: 'rtl' })
    const b = await page.locator(PRIM('gt-door')).nth(2).boundingBox()
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await page.waitForTimeout(350)
    const l = (await lights(page, '#gt-door'))[0]
    expect(l && Math.abs(l.x - b.x) <= 1 && Math.abs(l.w - b.width) <= 1, JSON.stringify({ l, b })).toBe(true)
  })

  for (const [label, opts] of [['surface', { appearance: 'surface' }], ['cards', { responsive: 'cards' }]]) {
    test(`${label}: sin capa y como mucho una fila con fondo en cada instante del barrido`, async ({ page }) => {
      await mountGlide(page, { only: 'tables', ...opts })
      expect(await page.locator('#gt-plain .g-table__highlight').count()).toBe(0)
      const sig = () => page.evaluate(() => [...document.querySelectorAll('#gt-plain tbody .g-table__row')]
        .map((r) => [r, ...r.children].map((e) => getComputedStyle(e).backgroundColor).join('|')))
      await page.mouse.move(5, 5); await page.waitForTimeout(300)
      const rest = await sig()
      const bx = await boxes(page, ROWS('gt-plain'))
      const x = bx[0].x + bx[0].w * 0.6
      let max = 0
      for (let y = bx[0].y + 2; y <= bx[bx.length - 1].y + bx[bx.length - 1].h - 2; y += 2) {
        await page.mouse.move(x, y)
        const now = await sig()
        max = Math.max(max, now.filter((v, i) => v !== rest[i]).length)
      }
      expect(max).toBeLessThanOrEqual(1)
      expect(await lights(page, '#gt-plain')).toHaveLength(0)
    })
  }
})

test.describe('GTable · una sola luz · toque', () => {
  test('el toque no enciende la luz', async ({ browser, browserName }) => {
    test.skip(browserName === 'firefox', 'Firefox no admite hasTouch en el contexto')
    const ctx = await browser.newContext({ hasTouch: true, isMobile: browserName === 'chromium', viewport: { width: 1280, height: 900 } })
    await routeVue(ctx)
    const page = await ctx.newPage()
    await mountGlide(page, { only: 'tables' })
    const b = (await boxes(page, ROWS('gt-plain')))[3]
    await page.touchscreen.tap(x60(b), b.y + b.h / 2); await page.waitForTimeout(250)
    expect(await page.locator('#gl-host .has-highlight').count()).toBe(0)
    await ctx.close()
  })
})
