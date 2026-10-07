// GSidebar · pista del riel con el motor del tooltip en modo visual (sidebar.md §«Pista del riel», #436, cierra #113;
// comunes de tooltip.md §«Modo visual», #433) sobre el componente real del playground (#sb-rail-demo), en Chromium,
// Firefox y WebKit: aparece con el puntero a los 350 ms y al instante por Tab, no duplica el nombre en el árbol
// accesible, viaja entre items y entre grupos del <nav>, padres con pista por teclado que se cierra al abrir el panel,
// con el puntero el panel gana, búsqueda y contraer, Esc, pulsación larga que no navega ni abre el panel, RTL a la
// izquierda, sin pista en expandida y pestaña contra el item Δ < 1 px.
// Un solo proceso por puerto: GRANA_PW_PORT=4211 (bruno, este encargo).
import { test, expect } from '@playwright/test'
import { TAB, watchConsole, open, frames, hover, openTexts, geo, expectTab, startSampling, stopSampling, touch, synthClick } from './visual-tip-helpers.mjs'

const LINK = (root, id) => `#${root} .g-sidebar__nav .g-sidebar__item > .g-sidebar__link[data-id="${id}"]`

test.describe('GSidebar · pista del riel (#436)', () => {
  test('puntero: nada a 200 ms y abierta a 500, a la derecha; Δ < 1 px de alto; aria-hidden; árbol idéntico; sin g-sidebar__tip', async ({ page }) => {
    const errs = await watchConsole(page)
    await open(page, '#sb-rail-demo')
    expect(await page.locator('.g-sidebar__tip').count()).toBe(0)
    const before = await page.locator('#sb-rail').ariaSnapshot()
    await hover(page, LINK('sb-rail', 'team'))
    await page.waitForTimeout(200)
    expect(await openTexts(page)).toEqual([])
    await page.waitForTimeout(300)
    expect(await openTexts(page)).toEqual(['Equipo'])
    const g = await geo(page, { scope: '#sb-rail', ctrl: LINK('sb-rail', 'team'), text: 'Equipo' })
    expect(g.hidden).toBe('true')
    expect(g.role).toBe(null)
    expect(g.id).toBe('')
    expect(g.ctrlAttrs).toEqual(['data-g-tooltip'])
    expectTab(g, 'right')
    expect(g.tab.l).toBeGreaterThanOrEqual(g.c.r - 0.5)
    expect(await page.locator('#sb-rail').ariaSnapshot()).toBe(before)
    await expect(page.locator('#sb-rail').getByRole('link', { name: 'Equipo', exact: true })).toHaveCount(1)
    expect(await page.getByRole('tooltip').count()).toBe(0)
    expect(errs).toEqual([])
  })

  test('viaja de item en item y entre grupos del <nav> con una sola etiqueta visible en todo cuadro', async ({ page }) => {
    await open(page, '#sb-rail-demo')
    await hover(page, LINK('sb-rail', 'home'))
    await page.waitForTimeout(500)
    await startSampling(page)
    const a = await page.locator(LINK('sb-rail', 'inbox')).boundingBox()
    const b = await page.locator(LINK('sb-rail', 'team')).boundingBox()
    const x = a.x + a.width / 2
    // Por los items, sin pasar por el padre (su panel se abriría): de Inicio a Mensajes, luego salto a Equipo
    for (let y = a.y - a.height / 2; y <= a.y + a.height * 1.5; y += 4) { await page.mouse.move(x, y); await page.waitForTimeout(16) }
    await page.mouse.move(x, b.y + b.height / 2)
    await page.waitForTimeout(400)
    const s = await stopSampling(page)
    expect(s.length).toBeGreaterThan(10)
    expect(s.filter((q) => q.n !== 1)).toEqual([])
    expect(s.some((q) => q.travel)).toBe(true)
    expect(await openTexts(page)).toEqual(['Equipo'])
    expectTab(await geo(page, { scope: '#sb-rail', ctrl: LINK('sb-rail', 'team'), text: 'Equipo' }), 'right')
  })

  test('padre: Tab ↓ hasta él muestra su pista; → abre el panel y la cierra; con el puntero el panel gana y la pista no se ve', async ({ page, browserName }) => {
    await open(page, '#sb-rail-demo')
    await page.evaluate(() => document.querySelector('#sb-rail .g-sidebar__nav .g-sidebar__link[data-id="cal"]').focus())
    await page.keyboard.press('ArrowUp')
    await page.keyboard.press('ArrowUp')
    await expect.poll(() => page.evaluate(() => document.activeElement.dataset.id)).toBe('proj')
    await expect.poll(() => openTexts(page)).toEqual(['Proyectos'])
    await page.keyboard.press('ArrowRight')
    await expect(page.locator(LINK('sb-rail', 'proj'))).toHaveAttribute('aria-expanded', 'true')
    expect(await openTexts(page)).toEqual([])
    await page.keyboard.press('Escape')
    await expect(page.locator(LINK('sb-rail', 'proj'))).toHaveAttribute('aria-expanded', 'false')
    // El foco vuelve al padre por programa: sin pista
    await page.waitForTimeout(450)
    expect(await openTexts(page)).toEqual([])
    // Con el puntero: el panel abre a los 150 ms y la pista nunca se ve
    await page.locator('#sb-rail-demo').scrollIntoViewIfNeeded()
    await page.mouse.move(2, 2)
    await page.waitForTimeout(700)
    await startSampling(page)
    await hover(page, LINK('sb-rail', 'rep'))
    await page.waitForTimeout(600)
    const s = await stopSampling(page)
    await expect(page.locator(LINK('sb-rail', 'rep'))).toHaveAttribute('aria-expanded', 'true')
    expect(s.filter((q) => q.texts.includes('Reportes'))).toEqual([])
    void TAB(browserName)
  })

  test('búsqueda y contraer tienen pista con su nombre; Esc cierra la pista sin mover el foco; foco por programa no abre', async ({ page, browserName }) => {
    await open(page, '#sb-rail-demo')
    await hover(page, '#sb-rail .g-sidebar__toggle')
    await expect.poll(() => openTexts(page)).toEqual(['Expandir la barra lateral'])
    expectTab(await geo(page, { scope: '#sb-rail', ctrl: '#sb-rail .g-sidebar__toggle', text: 'Expandir la barra lateral' }), 'right')
    await hover(page, '#sb-rail .g-sidebar__search')
    await expect.poll(() => openTexts(page)).toEqual(['Buscar'])
    expectTab(await geo(page, { scope: '#sb-rail', ctrl: '#sb-rail .g-sidebar__search', text: 'Buscar' }), 'right')
    await page.mouse.move(2, 2)
    await page.waitForTimeout(700)
    // Foco por programa: nada; Tab al primer item: al instante
    await page.evaluate(() => document.querySelector('#sb-rail .g-sidebar__search').focus())
    await page.waitForTimeout(450)
    expect(await openTexts(page)).toEqual([])
    await page.keyboard.press(TAB(browserName))
    await expect.poll(() => page.evaluate(() => document.activeElement.dataset.id)).toBe('home')
    await expect.poll(() => openTexts(page)).toEqual(['Inicio'])
    await page.keyboard.press('Escape')
    expect(await openTexts(page)).toEqual([])
    expect(await page.evaluate(() => document.activeElement.dataset.id)).toBe('home')
  })

  test('pulsación larga: muestra el nombre y no navega; sobre un padre no abre el panel; un toque normal navega', async ({ page }) => {
    await open(page, '#sb-rail-demo')
    const log = page.locator('#sb-rail-log')
    await expect(log).toContainText('actual=home · sin navegar')
    await touch(page, LINK('sb-rail', 'team'), 'pointerdown')
    await expect.poll(() => openTexts(page), { intervals: [50] }).toEqual(['Equipo'])
    await touch(page, LINK('sb-rail', 'team'), 'pointerup')
    await synthClick(page, LINK('sb-rail', 'team'))
    await frames(page)
    await expect(log).toContainText('actual=home · sin navegar')
    await page.waitForTimeout(2000)
    await touch(page, LINK('sb-rail', 'proj'), 'pointerdown')
    await expect.poll(() => openTexts(page), { intervals: [50] }).toEqual(['Proyectos'])
    await touch(page, LINK('sb-rail', 'proj'), 'pointerup')
    await synthClick(page, LINK('sb-rail', 'proj'))
    await frames(page)
    await expect(page.locator(LINK('sb-rail', 'proj'))).toHaveAttribute('aria-expanded', 'false')
    await page.waitForTimeout(2000)
    await touch(page, LINK('sb-rail', 'team'), 'pointerdown')
    await page.waitForTimeout(80)
    await touch(page, LINK('sb-rail', 'team'), 'pointerup')
    await synthClick(page, LINK('sb-rail', 'team'))
    await expect(log).toContainText('actual=team · navigate → team')
  })

  test('RTL: a la izquierda (fin de línea lógico), Δ < 1 px; expandida: sin pista', async ({ page }) => {
    await open(page, '#sb-rail-demo')
    await hover(page, LINK('sb-rail-rtl', 'team'))
    await expect.poll(() => openTexts(page)).toEqual(['Equipo'])
    const g = await geo(page, { scope: '#sb-rail-rtl', ctrl: LINK('sb-rail-rtl', 'team'), text: 'Equipo' })
    expectTab(g, 'right')
    expect(g.tab.r).toBeLessThanOrEqual(g.c.l + 0.5)
    await page.mouse.move(2, 2)
    await page.waitForTimeout(700)
    // La barra principal del playground (1000 px) está expandida: sus nodos existen pero no se activan
    await page.evaluate(() => document.getElementById('sec-sidebar').scrollIntoView({ block: 'start' }))
    const main = '#sec-sidebar .g-sidebar--mode-expanded'
    await expect(page.locator(main)).toHaveCount(1)
    expect(await page.locator(`${main} > .g-tooltip`).count()).toBeGreaterThan(0)
    await hover(page, `${main} .g-sidebar__nav .g-sidebar__item > .g-sidebar__link[data-id="team"]`)
    await page.waitForTimeout(600)
    expect(await openTexts(page)).toEqual([])
  })
})
