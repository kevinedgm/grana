// GSidebar · «una sola luz» (DECISIONS #957 a #962; sidebar.md «Una sola luz»; api.md «Una sola luz»). Traslado de la parte
// del sidebar de design/lab/hover-glide/r01/verificar.mjs (kiwi) sobre el GSidebar REAL del UMD: al barrer, 0 enlaces con
// fondo propio, ≤ 1 luz y ninguna muestra a oscuras dentro de las filas; viaja con cuadros intermedios y termina exacto
// (recortada la junta por dentro); entrar desde fuera aparece en su sitio; deshabilitado y título de grupo apagan; el
// actual se ilumina sin tocar su asiento; el puntero no mueve el foco y el teclado no enciende la luz; pulsado se queda;
// panel flotante del riel con su propia luz; navbar sin capa; `reduce` solo opacidad; `forced-colors` oculta; toque
// nada; RTL; consola limpia.
import { test, expect } from '@playwright/test'
import { mountGlide, watchConsole, sweep, travel, lights, boxes, routeVue } from './glide-helpers.mjs'

test.setTimeout(120_000)

const G1 = '#gl-sb .g-sidebar__group:nth-child(1) .g-sidebar__link'
const G2 = '#gl-sb .g-sidebar__group:nth-child(2) .g-sidebar__item:nth-child(-n+3) .g-sidebar__link' // padre abierto, hijos y actual
const x40 = (b) => b.x + 40
const openProj = async (page) => {
  await page.locator('#gl-sb [data-id="proj"]').click()
  await page.mouse.move(5, 5)
  await page.waitForTimeout(450)
}

test.describe('GSidebar · una sola luz', () => {
  test('barrido: 0 fondos propios, ≤ 1 luz, sin apagón dentro de las filas (grupo simple y grupo con hijos y actual)', async ({ page }) => {
    const errs = watchConsole(page)
    await mountGlide(page, { only: 'sidebar' })
    await openProj(page)
    for (const sel of [G1, G2]) {
      const s = await sweep(page, sel, '#gl-sb', x40)
      expect(s.maxOwn, `${sel}: fondos propios`).toBe(0)
      expect(s.maxLights, `${sel}: luces a la vez`).toBeLessThanOrEqual(1)
      expect(s.dark, `${sel}: muestras sin luz dentro de las filas (${s.samples})`).toBe(0)
    }
    expect(errs).toEqual([])
  })

  test('viaja con cuadros intermedios y termina exacto (junta recortada por dentro); entrar desde fuera aparece en su sitio', async ({ page }) => {
    await mountGlide(page, { only: 'sidebar' })
    const t = await travel(page, G1, '#gl-sb', 0, 3, x40)
    expect(t.frames, 'cuadros intermedios').toBeGreaterThanOrEqual(3)
    const inset = (t.b.h - t.l.h) / 2
    expect(Math.abs(t.l.x - t.b.x)).toBeLessThanOrEqual(1)
    expect(Math.abs(t.l.w - t.b.w)).toBeLessThanOrEqual(1)
    expect(inset, 'recorte de la junta por lado').toBeGreaterThanOrEqual(0)
    expect(inset).toBeLessThanOrEqual(2)
    expect(Math.abs(t.l.y - (t.b.y + inset))).toBeLessThanOrEqual(1)
    // Desde fuera: primera colocación instantánea
    await page.mouse.move(600, 5); await page.waitForTimeout(300)
    const b = (await boxes(page, G1))[2]
    await page.mouse.move(b.x + 40, b.y + b.h / 2)
    await page.waitForTimeout(40)
    const l = (await lights(page, '#gl-sb'))[0]
    expect(l && Math.abs(l.y - b.y) <= 3, `aparece en su sitio: ${JSON.stringify({ l, b })}`).toBe(true)
  })

  test('deshabilitado y título de grupo apagan; el actual se ilumina y su asiento no cambia', async ({ page }) => {
    await mountGlide(page, { only: 'sidebar' })
    const dis = page.locator('#gl-sb .g-sidebar__link[aria-disabled="true"]')
    const d = await dis.boundingBox()
    await page.mouse.move(d.x + 40, d.y + d.height / 2); await page.waitForTimeout(200)
    expect(await dis.evaluate((a) => a.closest('.g-sidebar__list').classList.contains('has-highlight')), 'deshabilitado').toBe(false)
    const t = await page.locator('#gl-sb .g-sidebar__group-title').nth(1).boundingBox()
    await page.mouse.move(t.x + 40, t.y + t.height / 2); await page.waitForTimeout(150)
    expect(await lights(page, '#gl-sb'), 'título de grupo').toHaveLength(0)
    const cur = page.locator('#gl-sb .g-sidebar__link[aria-current="page"]')
    const seat = () => cur.locator('.g-sidebar__icon').evaluate((e) => getComputedStyle(e, '::before').backgroundColor + '|' + getComputedStyle(e, '::after').backgroundColor)
    const s0 = await seat()
    const c = await cur.boundingBox()
    await page.mouse.move(c.x + 40, c.y + c.height / 2); await page.waitForTimeout(250)
    expect(await cur.evaluate((a) => a.closest('.g-sidebar__list').classList.contains('has-highlight')), 'actual iluminado').toBe(true)
    expect(await seat()).toBe(s0)
  })

  test('el puntero no mueve el foco y el teclado no enciende la luz', async ({ page }) => {
    await mountGlide(page, { only: 'sidebar' })
    await page.locator('#gl-sb [data-id="home"]').focus()
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')
    expect(await lights(page, '#gl-sb'), 'el teclado no enciende la luz').toHaveLength(0)
    const before = await page.evaluate(() => document.activeElement.dataset.id)
    await sweep(page, G1, '#gl-sb', x40)
    expect(await page.evaluate(() => document.activeElement.dataset.id)).toBe(before)
    // Dos canales: luz en el puntero, anillo en el foco
    const l = await lights(page, '#gl-sb')
    expect(l).toHaveLength(1)
  })

  test('pulsado se queda en lo pulsado; al soltar va a lo que hay bajo el puntero', async ({ page }) => {
    // Sobre el padre (un botón): arrastrar un enlace empieza el arrastre nativo del navegador (pointercancel)
    await mountGlide(page, { only: 'sidebar' })
    const a = await page.locator('#gl-sb [data-id="proj"]').boundingBox()
    const b = await page.locator('#gl-sb [data-id="rep"]').boundingBox()
    await page.mouse.move(a.x + 40, a.y + a.height / 2); await page.waitForTimeout(250)
    await page.mouse.down()
    await page.mouse.move(b.x + 40, b.y + b.height / 2, { steps: 6 }); await page.waitForTimeout(250)
    const l = (await lights(page, '#gl-sb'))[0]
    await page.mouse.up(); await page.waitForTimeout(350)
    const l2 = (await lights(page, '#gl-sb'))[0]
    expect(l && Math.abs(l.y - a.y) <= 3, JSON.stringify({ l, a })).toBe(true)
    expect(l2 && Math.abs(l2.y - b.y) <= 3, JSON.stringify({ l2, b })).toBe(true)
  })

  test('abrir un submenú: la luz se recoloca sin viajar en el padre; los hijos son de la lista del padre', async ({ page }) => {
    await mountGlide(page, { only: 'sidebar' })
    const p = page.locator('#gl-sb [data-id="proj"]')
    const b = await p.boundingBox()
    await page.mouse.move(b.x + 40, b.y + b.height / 2); await page.waitForTimeout(250)
    await page.mouse.down(); await page.mouse.up()
    await page.waitForTimeout(450)
    const l = (await lights(page, '#gl-sb'))[0]
    const b2 = await p.boundingBox()
    expect(l && Math.abs(l.y - b2.y) <= 3 && Math.abs(l.h - b2.height) <= 4, JSON.stringify({ l, b2 })).toBe(true)
    const c = await page.locator('#gl-sb [data-id="p1"]').boundingBox()
    await page.mouse.move(c.x + 60, c.y + c.height / 2); await page.waitForTimeout(350)
    const lc = await lights(page, '#gl-sb')
    expect(lc).toHaveLength(1)
    expect(Math.abs(lc[0].x - c.x)).toBeLessThanOrEqual(1) // el hijo sangrado cambia x y ancho
    expect(Math.abs(lc[0].w - c.width)).toBeLessThanOrEqual(1)
  })

  test('riel: el panel flotante lleva su propia luz y la del riel se apaga al salir de su lista', async ({ page }) => {
    await mountGlide(page, { only: 'sidebar', sbMode: 'rail' })
    const p = await page.locator('#gl-sb [data-id="proj"]').boundingBox()
    await page.mouse.move(p.x + p.width / 2, p.y + p.height / 2); await page.waitForTimeout(400)
    expect((await lights(page, '#gl-sb'))[0]?.host).toContain('g-sidebar__list')
    const fly = page.locator('.g-sidebar__fly-list')
    await expect(fly).toBeVisible()
    const c = await fly.locator('.g-sidebar__link').nth(1).boundingBox()
    await page.mouse.move(p.x + p.width + 2, p.y + p.height / 2, { steps: 3 })
    await page.mouse.move(c.x + 30, c.y + c.height / 2, { steps: 4 }); await page.waitForTimeout(300)
    const ls = await lights(page)
    expect(ls, JSON.stringify(ls)).toHaveLength(1)
    expect(ls[0].host).toContain('g-sidebar__fly-list')
    expect(Math.abs(ls[0].x - c.x)).toBeLessThanOrEqual(1)
  })

  test('navbar: sin capa (#961)', async ({ page }) => {
    await mountGlide(page, { only: 'sidebar', sbMode: 'navbar' })
    expect(await page.locator('nav.g-sidebar--mode-navbar .g-sidebar__highlight').count()).toBe(0)
  })

  test('movimiento reducido: la luz no viaja (solo opacidad)', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await mountGlide(page, { only: 'sidebar' })
    const tp = await page.locator('#gl-sb .g-sidebar__highlight').first().evaluate((l) => getComputedStyle(l).transitionProperty)
    expect(tp).not.toMatch(/translate|size/)
  })

  test('forced-colors: la capa se oculta', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'forcedColors solo se emula en Chromium')
    await page.emulateMedia({ forcedColors: 'active' })
    await mountGlide(page, { only: 'sidebar' })
    expect(await page.locator('#gl-sb .g-sidebar__highlight').first().evaluate((l) => getComputedStyle(l).display)).toBe('none')
  })

  test('RTL: la luz cae sobre su fila (px físicos)', async ({ page }) => {
    await mountGlide(page, { only: 'sidebar', dir: 'rtl' })
    const s = (await boxes(page, G1))[1]
    await page.mouse.move(s.x + s.w - 40, s.y + s.h / 2); await page.waitForTimeout(350)
    const l = (await lights(page, '#gl-sb'))[0]
    expect(l && Math.abs(l.x - s.x) <= 1 && Math.abs(l.w - s.w) <= 1, JSON.stringify({ l, s })).toBe(true)
  })
})

test.describe('GSidebar · una sola luz · toque', () => {
  test('el toque no enciende la luz', async ({ browser, browserName }) => {
    test.skip(browserName === 'firefox', 'Firefox no admite hasTouch en el contexto')
    const ctx = await browser.newContext({ hasTouch: true, isMobile: browserName === 'chromium', viewport: { width: 1280, height: 900 } })
    await routeVue(ctx)
    const page = await ctx.newPage()
    await mountGlide(page, { only: 'sidebar' })
    const b = (await boxes(page, G1))[1]
    await page.touchscreen.tap(b.x + 40, b.y + b.h / 2); await page.waitForTimeout(250)
    expect(await page.locator('#gl-sb .has-highlight').count()).toBe(0)
    await ctx.close()
  })
})
