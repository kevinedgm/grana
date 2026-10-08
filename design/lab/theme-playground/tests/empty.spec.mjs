// GEmpty sobre el COMPONENTE REAL del playground (#sec-load-region), en Chromium, Firefox y WebKit. Puntos de navegador de
// design/contracts/empty.md «Verificación» (DECISIONS.md #529, #537, #542, #547): contraste de título, descripción, traza y
// cuenta ≥ 4,5:1 en claro y oscuro; GBtn ≥ 44 × 44 a 390 px con puntero grueso y sin áreas solapadas; RTL (hueco del icono
// a la derecha); forced-colors en Chromium (contorno visible); el primer hueco dentro de una GLoadRegion mide un elemento
// (Δ ≤ 1 px); la salida con cuentas (orden, nombre accesible, relax) y el título anunciado por la región.
import { test, expect } from '@playwright/test'
import { openLR, watchConsole, frames, idle, loadAll, refreshList, live, btnAreas, expectClean } from './load-region-helpers.mjs'

test.describe('GEmpty · contraste (#547)', () => {
  for (const scheme of ['light', 'dark']) {
    test(`título, descripción, traza y cuenta ≥ 4,5:1 (${scheme})`, async ({ page }) => {
      const errs = await watchConsole(page)
      await openLR(page, { scheme, target: '#lr-empties' })
      const r = await page.evaluate(() => [...document.querySelectorAll('#lr-empties .g-empty__title, #lr-empties .g-empty__description, #lr-empties .g-empty__trace, #lr-empties .g-empty__count')]
        .map((n) => [n.className, Math.round(window.__contrast(n) * 100) / 100]))
      expect(r.length).toBeGreaterThanOrEqual(9)
      for (const [cls, c] of r) expect(c, cls).toBeGreaterThanOrEqual(4.5)
      expectClean(errs)
    })
  }
})

test.describe('GEmpty · estructura en el navegador', () => {
  test('sin role ni tabindex; título p o hN con dir="auto"; icono en un hueco aria-hidden; none con el icono de la aplicación', async ({ page }) => {
    await openLR(page, { target: '#lr-empties' })
    const st = await page.evaluate(() => [...document.querySelectorAll('#lr-empties .g-empty')].map((e) => ({
      id: e.id, role: e.getAttribute('role'), tab: e.getAttribute('tabindex'),
      title: [e.querySelector('.g-empty__title').tagName, e.querySelector('.g-empty__title').getAttribute('dir')],
      hole: e.querySelector('.g-empty__icon').getAttribute('aria-hidden'), svg: !!e.querySelector('.g-empty__icon svg')
    })))
    expect(st.map((x) => x.id)).toEqual(['lr-e-none', 'lr-e-filtered', 'lr-e-error', 'lr-e-forbidden'])
    for (const x of st) { expect(x.role).toBe(null); expect(x.tab).toBe(null); expect(x.hole).toBe('true'); expect(x.svg).toBe(true) }
    expect(st[3].title).toEqual(['H4', 'auto'])
    expect(st[0].title).toEqual(['P', 'auto'])
  })

  test('la salida: de más a menos, «Quitar todos» al final, cuenta oculta al lector y nombre = visible + «N vuelven»', async ({ page }) => {
    await openLR(page, { target: '#lr-empties' })
    const st = await page.evaluate(() => {
      const e = document.querySelector('#lr-e-filtered')
      return {
        exit: e.classList.contains('is-exit'),
        trace: e.querySelector('.g-empty__trace').textContent,
        btns: [...e.querySelectorAll('.g-empty__actions .g-btn')].map((b) => b.querySelector('.g-btn__label').textContent),
        hidden: [...e.querySelectorAll('.g-empty__count')].map((c) => c.getAttribute('aria-hidden'))
      }
    })
    expect(st.exit).toBe(true)
    expect(st.trace).toBe('Antes había 14; con Hoy, Cerradas y Urgentes, ninguna.')
    expect(st.btns).toEqual(['Quitar «Hoy»12 12 vuelven', 'Quitar «Cerradas»2 2 vuelven', 'Quitar todos'])
    expect(st.hidden).toEqual(['true', 'true'])
    const snap = await page.locator('#lr-e-filtered').ariaSnapshot()
    expect(snap).toMatch(/button "Quitar «Hoy» 12 vuelven"/)
    expect(snap).toMatch(/button "Quitar todos"/)
    await page.locator('#lr-e-filtered .g-empty__relax').first().click()
    expect(await page.evaluate(() => window.lrEvents.at(-1))).toEqual({ name: 'relax', payload: 'hoy' })
  })
})

test.describe('GEmpty · dentro de una GLoadRegion (#533, #534, #535)', () => {
  test('el primer hueco tiene de mínimo el alto de un elemento de la plantilla (Δ ≤ 1 px) y la región anuncia su título', async ({ page }) => {
    await openLR(page)
    await loadAll(page, 100)
    await idle(page)
    const rowH = await page.evaluate(() => document.querySelector('#lr-list [data-g-key]').getBoundingClientRect().height)
    await refreshList(page, 250, 'none')
    await idle(page)
    const st = await page.evaluate(() => {
      const r = document.querySelector('#lr-list')
      const e = r.querySelector('.g-empty')
      return { slot: parseFloat(r.style.getPropertyValue('--_load-slot')), h: e.getBoundingClientRect().height, min: parseFloat(getComputedStyle(e).minBlockSize) }
    })
    expect(Math.abs(st.slot - rowH)).toBeLessThanOrEqual(1)
    expect(Math.abs(st.min - rowH)).toBeLessThanOrEqual(1)
    // Mide un elemento como mínimo; si su contenido es mayor (título, descripción y dos acciones), su contenido (estilo.md)
    expect(st.h).toBeGreaterThanOrEqual(rowH - 1)
    expect(await live(page)).toContain('Aún no hay muestras')
  })

  test('suelto, sin región: no hay mínimo (min-block-size auto)', async ({ page }) => {
    await openLR(page, { target: '#lr-empties' })
    expect(await page.evaluate(() => getComputedStyle(document.querySelector('#lr-e-none')).minBlockSize)).toMatch(/auto|0px/)
  })

  test('salida por filtro: quitar un filtro por teclado deja el foco en la región (nunca body) y vuelve con los datos', async ({ page }) => {
    await openLR(page)
    await loadAll(page, 100)
    await idle(page)
    await page.evaluate(() => window.lrCtl.setFilters(['urg', 'closed']))
    await refreshList(page, 250)
    await idle(page)
    const btns = await page.evaluate(() => [...document.querySelectorAll('#lr-list .g-empty__actions .g-btn')].map((b) => b.querySelector('.g-btn__label').textContent))
    expect(btns).toEqual(['Quitar «Cerradas»2 2 vuelven', 'Quitar todos'])
    await page.locator('#lr-list .g-empty__relax').focus()
    await page.keyboard.press('Enter')
    await frames(page)
    expect(await page.evaluate(() => document.activeElement.id)).toBe('lr-list')
    await idle(page)
    expect(await page.evaluate(() => document.activeElement.id)).toBe('lr-list')
    expect(await page.locator('#lr-list .lr-row').count()).toBe(2)
  })
})

test.describe('GEmpty · RTL', () => {
  test('el hueco del icono queda a la derecha (inicio lógico) y la salida alineada con el texto', async ({ page }) => {
    await openLR(page, { target: '#lr-rtl-panel' })
    const st = await page.evaluate(() => {
      const e = document.querySelector('#lr-e-rtl')
      const r = (s) => e.querySelector(s).getBoundingClientRect()
      return { hole: r('.g-empty__icon'), title: r('.g-empty__title'), act: r('.g-empty__actions .g-btn'), dir: getComputedStyle(e).direction }
    })
    expect(st.dir).toBe('rtl')
    expect(st.hole.left).toBeGreaterThan(st.title.right - 1)
    expect(Math.abs(st.act.right - st.title.right)).toBeLessThanOrEqual(1)
  })
})

test.describe('GEmpty · colores forzados (Chromium)', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'forced-colors solo se emula en Chromium')
  test('contorno discontinuo y hueco en CanvasText', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' })
    await openLR(page, { target: '#lr-empties' })
    const st = await page.evaluate(() => {
      const probe = document.createElement('span'); probe.style.color = 'CanvasText'; document.body.append(probe)
      const ink = getComputedStyle(probe).color; probe.remove()
      const e = document.querySelector('#lr-e-none')
      const cs = getComputedStyle(e)
      const hole = getComputedStyle(e.querySelector('.g-empty__icon'))
      return { ink, border: cs.borderTopColor, style: cs.borderTopStyle, hole: hole.borderTopColor, holeStyle: hole.borderTopStyle }
    })
    expect(st.style).toBe('dashed')
    expect(st.border).toBe(st.ink)
    expect(st.holeStyle).toBe('dashed')
    expect(st.hole).toBe(st.ink)
  })
})

test.describe('GEmpty · 390 px con puntero grueso', () => {
  test.skip(({ browserName }) => browserName === 'firefox', 'Firefox: sin puntero grueso en Playwright')
  test.use({ hasTouch: true, isMobile: true })
  test('todos los GBtn ≥ 44 × 44, sin áreas solapadas, sin desborde', async ({ page }) => {
    await openLR(page, { width: 390, height: 844, target: '#lr-empties' })
    expect(await page.evaluate(() => matchMedia('(pointer: coarse)').matches)).toBe(true)
    for (const id of ['#lr-e-none', '#lr-e-filtered', '#lr-e-error']) {
      const a = await btnAreas(page, id)
      expect(a.list.length, id).toBeGreaterThan(0)
      for (const b of a.list) { expect(b.w, `${id} ${b.text}`).toBeGreaterThanOrEqual(44); expect(b.h, `${id} ${b.text}`).toBeGreaterThanOrEqual(44) }
      expect(a.overlap, id).toEqual([])
    }
    expect(await page.evaluate(() => [...document.querySelectorAll('#lr-empties .g-empty')].every((e) => e.scrollWidth <= e.clientWidth + 1))).toBe(true)
  })
})
