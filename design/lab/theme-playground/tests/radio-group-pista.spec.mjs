// GRadioGroup · pista de solo icono con el motor del tooltip en modo visual (radio-group.md §«Pista de solo icono», #435;
// comunes de tooltip.md §«Modo visual», #433) sobre el componente real del playground (#sec-radio), en Chromium, Firefox
// y WebKit: aparece con el puntero sobre el segmento o el chip y al instante por Tab, no duplica el nombre en el árbol
// accesible, la pestaña mide la caja visible (no el radio) Δ < 1 px, las flechas eligen y la pista viaja, Esc, la
// pulsación larga no elige, apilado a la derecha, RTL, opción deshabilitada sin pista y Δ0 del segmentado con nodos.
// Un solo proceso por puerto: GRANA_PW_PORT=4211 (bruno, este encargo).
import { test, expect } from '@playwright/test'
import { TAB, watchConsole, open, frames, hover, openTexts, geo, expectTab, startSampling, stopSampling, touch, synthClick } from './visual-tip-helpers.mjs'

// La caja visible de la opción i del grupo `id`
const OPT = (id, i) => `#${id} .g-radio-group__options > .g-radio-group__option:nth-child(${i + 1})`
const RADIO = (id, i) => `#${id}-${i}`

test.describe('GRadioGroup · pista de solo icono (#435)', () => {
  test('segmentado: abre a los 350 ms sobre el segmento; pestaña Δ < 1 px contra el segmento; aria-hidden; árbol idéntico', async ({ page }) => {
    const errs = await watchConsole(page)
    await open(page, '#rg-icon')
    const before = await page.locator('#rg-icon').ariaSnapshot()
    await hover(page, OPT('rg-icon', 1))
    await page.waitForTimeout(200)
    expect(await openTexts(page)).toEqual([])
    await page.waitForTimeout(300)
    expect(await openTexts(page)).toEqual(['Gráfica'])
    const g = await geo(page, { scope: '#rg-icon', ctrl: RADIO('rg-icon', 1), box: OPT('rg-icon', 1), text: 'Gráfica' })
    expect(g.hidden).toBe('true')
    expect(g.role).toBe(null)
    expect(g.id).toBe('')
    expect(g.ctrlAttrs).toEqual(['aria-labelledby', 'data-g-tooltip'])
    expectTab(g, 'bottom')
    expect(await page.locator('#rg-icon').ariaSnapshot()).toBe(before)
    await expect(page.locator('#rg-icon').getByRole('radio', { name: 'Gráfica', exact: true })).toHaveCount(1)
    expect(await page.getByRole('tooltip').count()).toBe(0)
    // Nunca dentro de la <label> ni hijo de la raíz
    expect(await page.evaluate(() => [...document.querySelectorAll('#rg-icon .g-tooltip')].every((n) => !n.closest('label') && n.parentElement.classList.contains('g-radio-group__options')))).toBe(true)
    // Ningún nodo es hijo de la raíz (field: false: etiqueta y caja; con field, además el pie)
    expect(await page.evaluate(() => [...document.getElementById('rg-icon').children].map((c) => c.className))).toEqual(['g-radio-group__label', 'g-radio-group__options'])
    expect(errs).toEqual([])
  })

  test('chips: barrido sin dos etiquetas a la vez en ningún cuadro; pestaña Δ < 1 px contra el chip', async ({ page }) => {
    await open(page, '#rg-icon-chip')
    await hover(page, OPT('rg-icon-chip', 0))
    await page.waitForTimeout(500)
    await startSampling(page)
    const a = await page.locator(OPT('rg-icon-chip', 0)).boundingBox()
    const b = await page.locator(OPT('rg-icon-chip', 2)).boundingBox()
    const y = a.y + a.height / 2
    for (let x = a.x + a.width / 2; x <= b.x + b.width / 2; x += 5) { await page.mouse.move(x, y); await page.waitForTimeout(16) }
    await page.waitForTimeout(400)
    const s = await stopSampling(page)
    expect(s.length).toBeGreaterThan(5)
    // Nunca dos a la vez (entre chips hay hueco: si el puntero tarda más que CLOSE en cruzarlo, puede no haber ninguna)
    expect(s.filter((x) => x.n > 1)).toEqual([])
    expect(await openTexts(page)).toEqual(['Web'])
    expectTab(await geo(page, { scope: '#rg-icon-chip', ctrl: RADIO('rg-icon-chip', 2), box: OPT('rg-icon-chip', 2), text: 'Web' }), 'bottom')
  })

  test('Tab entra y la muestra; las flechas eligen y la pista viaja; Esc cierra sin mover el foco ni la elección', async ({ page, browserName }) => {
    await open(page, '#rg-icon')
    const checked = () => page.evaluate(() => [...document.querySelectorAll('#rg-icon input')].findIndex((r) => r.checked))
    const start = await checked()
    // Desde el grupo siguiente con Mayús+Tab (el foco por programa del de partida no abre nada)
    await page.evaluate(() => document.querySelector('#rg-icon-chip input:checked, #rg-icon-chip input').focus())
    await page.keyboard.press(`Shift+${TAB(browserName)}`)
    await expect.poll(() => page.evaluate(() => document.activeElement.id)).toBe(`rg-icon-${start}`)
    const names = ['Lista', 'Gráfica', 'Galería']
    await expect.poll(() => openTexts(page)).toEqual([names[start]])
    await page.keyboard.press('ArrowRight')
    const next = (start + 1) % 3
    await expect.poll(() => checked()).toBe(next)
    await expect.poll(() => openTexts(page)).toEqual([names[next]])
    await frames(page, 20)
    expectTab(await geo(page, { scope: '#rg-icon', ctrl: RADIO('rg-icon', next), box: OPT('rg-icon', next), text: names[next] }), 'bottom')
    await page.keyboard.press('Escape')
    expect(await openTexts(page)).toEqual([])
    expect(await page.evaluate(() => document.activeElement.id)).toBe(`rg-icon-${next}`)
    expect(await checked()).toBe(next)
  })

  test('pulsación larga sobre el segmento: muestra el nombre y no elige; un toque normal elige sin pista', async ({ page }) => {
    await open(page, '#rg-icon')
    const checked = () => page.evaluate(() => [...document.querySelectorAll('#rg-icon input')].findIndex((r) => r.checked))
    const start = await checked()
    const target = (start + 2) % 3
    const names = ['Lista', 'Gráfica', 'Galería']
    await touch(page, OPT('rg-icon', target), 'pointerdown')
    await page.waitForTimeout(300)
    expect(await openTexts(page)).toEqual([])
    await expect.poll(() => openTexts(page), { intervals: [50] }).toEqual([names[target]])
    await touch(page, OPT('rg-icon', target), 'pointerup')
    await synthClick(page, OPT('rg-icon', target))
    await frames(page)
    expect(await checked()).toBe(start)
    await expect(page.locator('#sec-radio p.log').last()).toContainText(`vista=${['lista', 'grafica', 'galeria'][start]}`)
    await page.waitForTimeout(2000)
    await touch(page, OPT('rg-icon', target), 'pointerdown')
    await page.waitForTimeout(80)
    await touch(page, OPT('rg-icon', target), 'pointerup')
    await synthClick(page, OPT('rg-icon', target))
    await expect.poll(() => checked()).toBe(target)
    expect(await openTexts(page)).toEqual([])
  })

  test('apilado (is-stacked): a la derecha, Δ < 1 px de alto contra el segmento; RTL en chips: debajo y alineada', async ({ page }) => {
    await open(page, '#rg-icon-stack')
    expect(await page.evaluate(() => document.getElementById('rg-icon-stack').classList.contains('is-stacked'))).toBe(true)
    await hover(page, OPT('rg-icon-stack', 1))
    await expect.poll(() => openTexts(page)).toEqual(['Gráfica'])
    const g = await geo(page, { scope: '#rg-icon-stack', ctrl: RADIO('rg-icon-stack', 1), box: OPT('rg-icon-stack', 1), text: 'Gráfica' })
    expectTab(g, 'right')
    expect(g.tab.l).toBeGreaterThanOrEqual(g.c.r - 0.5)
    await page.mouse.move(2, 2)
    await page.waitForTimeout(700)
    await hover(page, OPT('rg-icon-rtl', 0))
    await expect.poll(() => openTexts(page)).toEqual(['Correo'])
    expectTab(await geo(page, { scope: '#rg-icon-rtl', ctrl: RADIO('rg-icon-rtl', 0), box: OPT('rg-icon-rtl', 0), text: 'Correo' }), 'bottom')
  })

  test('opción deshabilitada: sin pista; Δ0 del segmentado y de los chips con la pista abierta; nodos cerrados sin caja', async ({ page }) => {
    await open(page, '#rg-icon-dis')
    await hover(page, OPT('rg-icon-dis', 3))
    await page.waitForTimeout(600)
    expect(await openTexts(page)).toEqual([])
    const rects = (id) => page.evaluate((id) => [...document.querySelectorAll(`#${id}, #${id} .g-radio-group__options, #${id} .g-radio-group__option`)].map((e) => { const r = e.getBoundingClientRect(); return [r.x, r.y, r.width, r.height].map((v) => Math.round(v * 100) / 100) }), id)
    expect(await page.evaluate(() => [...document.querySelectorAll('#rg-icon-dis .g-tooltip')].every((n) => getComputedStyle(n).display === 'none'))).toBe(true)
    const closed = await rects('rg-icon-dis')
    await page.mouse.move(2, 2)
    await page.waitForTimeout(700)
    await hover(page, OPT('rg-icon-dis', 0))
    await expect.poll(() => openTexts(page)).toEqual(['Lista'])
    expect(await rects('rg-icon-dis')).toEqual(closed)
  })
})
