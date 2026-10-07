// GTabs · pista de solo icono con el motor del tooltip en modo visual (tabs.md §«Pista de solo icono», #434; comunes de
// tooltip.md §«Modo visual», #433) sobre el componente real del playground (#tb-icon-demo), en Chromium, Firefox y WebKit:
// aparece con el puntero a los 350 ms y al instante por Tab, no duplica el nombre en el árbol accesible, viaja en el
// tablist con una sola etiqueta visible, Esc, pulsación larga que no activa, vertical a la derecha y RTL a la izquierda,
// «Más» con el menú abierto, la activa con etiqueta sin pista y la pestaña contra la pestaña Δ < 1 px.
// Un solo proceso por puerto: GRANA_PW_PORT=4211 (bruno, este encargo).
import { test, expect } from '@playwright/test'
import { TAB, watchConsole, open, frames, hover, openTexts, geo, expectTab, startSampling, stopSampling, touch, synthClick } from './visual-tip-helpers.mjs'

const T = (root, id) => `#${root}-tab-${id}`

test.describe('GTabs · pista de solo icono (#434)', () => {
  test('puntero: nada a 200 ms y abierta a 500; aria-hidden sin role ni id; pestaña Δ < 1 px; árbol accesible idéntico', async ({ page }) => {
    const errs = await watchConsole(page)
    await open(page, '#tb-icon-demo')
    const before = await page.locator('#tb-icon [role="tablist"]').ariaSnapshot()
    await hover(page, T('tb-icon', 'msgs'))
    await page.waitForTimeout(200)
    expect(await openTexts(page)).toEqual([])
    await page.waitForTimeout(300)
    expect(await openTexts(page)).toEqual(['Mensajes'])
    const g = await geo(page, { scope: '#tb-icon', ctrl: T('tb-icon', 'msgs'), text: 'Mensajes' })
    expect(g.hidden).toBe('true')
    expect(g.role).toBe(null)
    expect(g.id).toBe('')
    expect(g.ctrlAttrs).toEqual(['aria-controls', 'aria-selected', 'data-g-tooltip'])
    expectTab(g, 'bottom')
    // El nombre (etiqueta + contador) no cambia y la pista no entra en el árbol
    expect(await page.locator('#tb-icon [role="tablist"]').ariaSnapshot()).toBe(before)
    await expect(page.locator('#tb-icon').getByRole('tab', { name: /^Mensajes,? 3 sin leer$/ })).toBeVisible()
    expect(await page.getByRole('tooltip').count()).toBe(0)
    // Los nodos fuera del tablist, al final de la cabecera
    const kids = await page.evaluate(() => [...document.querySelectorAll('#tb-icon [role="tablist"] > *')].map((k) => k.getAttribute('role')))
    expect(new Set(kids)).toEqual(new Set(['tab']))
    await page.mouse.move(2, 2)
    await page.waitForTimeout(300)
    expect(await openTexts(page)).toEqual([])
    expect(errs).toEqual([])
  })

  test('barrido con el puntero: viaja de pestaña en pestaña con una sola etiqueta visible en todo cuadro', async ({ page }) => {
    await open(page, '#tb-icon-demo')
    await hover(page, T('tb-icon', 'general'))
    await page.waitForTimeout(500)
    await startSampling(page)
    const a = await page.locator(T('tb-icon', 'general')).boundingBox()
    const b = await page.locator(T('tb-icon', 'cfg')).boundingBox()
    const y = a.y + a.height / 2
    for (let x = a.x + a.width / 2; x <= b.x + b.width / 2; x += 6) { await page.mouse.move(x, y); await page.waitForTimeout(16) }
    await page.waitForTimeout(400)
    const s = await stopSampling(page)
    expect(s.length).toBeGreaterThan(10)
    expect(s.filter((x) => x.n !== 1)).toEqual([])
    expect(s.some((x) => x.travel)).toBe(true)
    expect(await openTexts(page)).toEqual(['Ajustes'])
    expectTab(await geo(page, { scope: '#tb-icon', ctrl: T('tb-icon', 'cfg'), text: 'Ajustes' }), 'bottom')
  })

  test('Tab la muestra al instante; las flechas la llevan con el foco; Esc la cierra sin mover el foco; clic y programa no', async ({ page, browserName }) => {
    await open(page, '#tb-icon-demo')
    await page.evaluate(() => document.querySelector('#tb-icon-demo').previousElementSibling.setAttribute('tabindex', '-1'))
    await page.evaluate(() => document.querySelector('#tb-icon-demo').previousElementSibling.focus())
    await page.keyboard.press(TAB(browserName))
    await expect.poll(() => page.evaluate(() => document.activeElement.id)).toBe('tb-icon-tab-general')
    await expect.poll(() => openTexts(page)).toEqual(['General'])
    await page.keyboard.press('ArrowRight')
    await expect.poll(() => page.evaluate(() => document.activeElement.id)).toBe('tb-icon-tab-msgs')
    await expect.poll(() => openTexts(page)).toEqual(['Mensajes'])
    await frames(page, 20)
    expectTab(await geo(page, { scope: '#tb-icon', ctrl: T('tb-icon', 'msgs'), text: 'Mensajes' }), 'bottom')
    await page.keyboard.press('Escape')
    expect(await openTexts(page)).toEqual([])
    expect(await page.evaluate(() => document.activeElement.id)).toBe('tb-icon-tab-msgs')
    // Foco por programa no abre
    await page.evaluate(() => document.getElementById('tb-icon-tab-cal').focus())
    await page.waitForTimeout(450)
    expect(await openTexts(page)).toEqual([])
    // Clic: pulsar es usar (no abre ni con el puntero encima)
    await page.locator(T('tb-icon', 'cal')).click()
    await page.waitForTimeout(450)
    expect(await openTexts(page)).toEqual([])
    await page.evaluate(() => document.getElementById('tb-icon-tab-general').click())
  })

  test('vertical: a la derecha (Δ < 1 px de alto); RTL: a la izquierda', async ({ page }) => {
    await open(page, '#tb-icon-demo')
    await hover(page, T('tb-icon-v', 'cal'))
    await expect.poll(() => openTexts(page)).toEqual(['Calendario'])
    const g = await geo(page, { scope: '#tb-icon-v', ctrl: T('tb-icon-v', 'cal'), text: 'Calendario' })
    expectTab(g, 'right')
    expect(g.tab.l).toBeGreaterThanOrEqual(g.c.r - 0.5)
    await page.mouse.move(2, 2)
    await page.waitForTimeout(700)
    await hover(page, T('tb-icon-rtl', 'cal'))
    await expect.poll(() => openTexts(page)).toEqual(['Calendario'])
    const r = await geo(page, { scope: '#tb-icon-rtl', ctrl: T('tb-icon-rtl', 'cal'), text: 'Calendario' })
    expectTab(r, 'right')
    expect(r.tab.r).toBeLessThanOrEqual(r.c.l + 0.5)
  })

  test('pulsación larga: muestra el nombre y no activa (sin change); un toque normal activa sin pista', async ({ page }) => {
    await open(page, '#tb-icon-demo')
    const log = page.locator('#tb-icon-log')
    await expect(log).toContainText('activa=general · sin cambios')
    await touch(page, T('tb-icon', 'cal'), 'pointerdown')
    await page.waitForTimeout(300)
    expect(await openTexts(page)).toEqual([])
    await page.waitForTimeout(350)
    expect(await openTexts(page)).toEqual(['Calendario'])
    expect((await geo(page, { scope: '#tb-icon', ctrl: T('tb-icon', 'cal'), text: 'Calendario' })).attrs).toContain('data-touch')
    await touch(page, T('tb-icon', 'cal'), 'pointerup')
    await synthClick(page, T('tb-icon', 'cal'))
    await frames(page)
    await expect(log).toContainText('activa=general · sin cambios')
    await page.waitForTimeout(2000)
    expect(await openTexts(page)).toEqual([])
    await touch(page, T('tb-icon', 'cal'), 'pointerdown')
    await page.waitForTimeout(80)
    await touch(page, T('tb-icon', 'cal'), 'pointerup')
    await synthClick(page, T('tb-icon', 'cal'))
    await expect(log).toContainText('activa=cal · change → cal')
    expect(await openTexts(page)).toEqual([])
  })

  test('«Más»: su pista nombra el botón y no abre con el menú abierto; entre una pestaña y «Más» no viaja', async ({ page }) => {
    await open(page, '#tb-icon-demo')
    await expect(page.locator('#tb-icon-more .g-tabs__more')).toHaveCount(1)
    await hover(page, '#tb-icon-more .g-tabs__more')
    await expect.poll(() => openTexts(page)).toEqual(['Más pestañas'])
    const g = await geo(page, { scope: '#tb-icon-more', ctrl: '#tb-icon-more .g-tabs__more', text: 'Más pestañas' })
    expectTab(g, 'bottom')
    expect(g.ctrlAttrs).toContain('data-g-tooltip')
    // De «Más» a una pestaña: otro grupo, sin viaje
    await hover(page, '#tb-icon-more [role="tab"]:last-child')
    await frames(page)
    const attrs = await page.evaluate(() => [...document.querySelectorAll('#tb-icon-more .g-tooltip')].filter((n) => n.matches(':popover-open')).map((n) => n.hasAttribute('data-travel')))
    expect(attrs).toEqual([false])
    await page.locator('#tb-icon-more .g-tabs__more').click()
    await expect(page.locator('#tb-icon-more .g-tabs__more')).toHaveAttribute('aria-expanded', 'true')
    await page.mouse.move(2, 2)
    await page.waitForTimeout(700)
    await hover(page, '#tb-icon-more .g-tabs__more')
    await page.waitForTimeout(500)
    expect(await openTexts(page)).toEqual([])
    await page.keyboard.press('Escape')
  })

  test('labelMode full sin nodos; segmentado: pestaña Δ < 1 px', async ({ page }) => {
    await open(page, '#tb-icon-demo')
    expect(await page.locator('#tabs-demo > .g-tabs:first-child .g-tooltip').count()).toBe(0)
    await hover(page, T('tb-icon-pill', 'cal'))
    await expect.poll(() => openTexts(page)).toEqual(['Calendario'])
    expectTab(await geo(page, { scope: '#tb-icon-pill', ctrl: T('tb-icon-pill', 'cal'), text: 'Calendario' }), 'bottom')
  })
})
