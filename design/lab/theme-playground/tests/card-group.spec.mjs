// GCardGroup sobre el COMPONENTE REAL (packages/vue/playground/card-group.html: GCard, GMetric y GTable del principal y
// GCardGroup de su entrada propia), en Chromium, Firefox y WebKit. Traslada design/lab/card-group/r01/verificar.mjs (base y
// A · Lengüeta) y el § «Verificación» de design/contracts/card-group.md (#603 a #611, #570): toolbar con nombre, una sola
// parada, Tab entra en la pulsada → última enfocada → primera elegible, flechas sin filtrar y sin vuelta (espejo RTL),
// Espacio/Intro alternan, receta con los filtros de la tabla (quitar el chip suelta; la tabla anuncia, #569), cambio externo
// sin change ni foco y desplazando solo la tira, Firefox sin parada en la tira, L7 (Fin trae la última ENTERA en WebKit a
// 375 px), puente Δ0 (x, ancho, nace en el borde inferior, cubre el borde del panel, uno solo que viaja, se retira, RTL),
// Δ0 de las cajas al pulsar, rendimiento (un render del padre no vuelve a medir, bd888df), movimiento reducido y consola
// limpia. Un solo proceso por puerto: GRANA_PW_PORT=4223 (bruno de GCardGroup).
import { test, expect } from '@playwright/test'

const PAGE = '/packages/vue/playground/card-group.html'
const TAB = (b) => (b === 'webkit' ? 'Alt+Tab' : 'Tab')
const BACKTAB = (b) => (b === 'webkit' ? 'Alt+Shift+Tab' : 'Shift+Tab')
const BTN = (g) => `#${g} > .g-card-group__strip > .g-card .g-card__primary`
const CARD = (g) => `#${g} > .g-card-group__strip > .g-card`

async function open(page, { motion = 'no-preference', width = 1280, height = 900, q = '' } = {}) {
  const errs = []
  page.on('pageerror', (e) => { if (!/ResizeObserver loop/.test(e.message)) errs.push(`pageerror: ${e.message}`) })
  page.on('console', (m) => {
    const t = m.text()
    if (m.type() === 'error' && !/favicon/.test(t)) errs.push(`console: ${t}`)
    else if (m.type() === 'warning' && /\[Vue warn\]|\[Grana/.test(t)) errs.push(`warning: ${t}`)
  })
  await page.emulateMedia({ reducedMotion: motion })
  await page.setViewportSize({ width, height })
  await page.goto(PAGE + q)
  await page.waitForFunction(() => window.__ready && document.querySelector('#cg-tab.is-ready'), null, { timeout: 30000 })
  await page.evaluate(() => document.fonts.ready)
  return errs
}
const pressed = (page, g) => page.evaluate((s) => [...document.querySelectorAll(s)].map((b) => b.getAttribute('aria-pressed')), BTN(g))
const rows = (page, t) => page.evaluate((id) => [...document.querySelectorAll(`#${id} tbody tr`)].filter((r) => !r.querySelector('.g-empty')).length, t)
const chips = (page, t) => page.evaluate((id) => document.querySelectorAll(`#${id} .g-filter-bar__chip`).length, t)
const activeIdx = (page, g) => page.evaluate((s) => [...document.querySelectorAll(s)].indexOf(document.activeElement), BTN(g))
const stops = (page, g) => page.evaluate((s) => [...document.querySelectorAll(s)].map((b) => b.tabIndex), BTN(g))
const docRects = (page, g) => page.evaluate((s) => [...document.querySelectorAll(s)].map((c) => { const r = c.getBoundingClientRect(); return { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height } }), CARD(g))
async function tabInto(page, g, browserName) {
  await page.evaluate((id) => {
    let s = document.getElementById('pw-sentinel')
    if (!s) { s = document.createElement('button'); s.id = 'pw-sentinel'; s.textContent = 'antes' }
    document.getElementById(id).before(s)
    s.focus()
  }, g)
  await page.keyboard.press(TAB(browserName))
}
const bridge = (page, g, i) => page.evaluate(([g, i]) => {
  const br = document.querySelector(`#${g} .g-card-group__bridge:not(.is-leaving)`)
  const card = document.querySelectorAll(`#${g} > .g-card-group__strip > .g-card`)[i]
  const pan = document.querySelector(`#${g} > .g-card-group__panel`)
  if (!br) return null
  const a = br.getBoundingClientRect(), k = card.getBoundingClientRect(), q = pan.getBoundingClientRect()
  return {
    n: document.querySelectorAll(`#${g} .g-card-group__bridge:not(.is-leaving)`).length,
    dx: Math.abs(a.left - k.left), dw: Math.abs(a.width - k.width), top: a.top - k.bottom,
    over: a.bottom - q.top, edge: parseFloat(getComputedStyle(pan).borderTopWidth), hidden: br.getAttribute('aria-hidden'),
    inStrip: br.parentElement.classList.contains('g-card-group__strip')
  }
}, [g, i])

test.describe('GCardGroup · semántica, receta y eventos', () => {
  test('toolbar con nombre, una parada, aria-controls al panel, descripción con la cifra, tira tabindex -1', async ({ page }) => {
    const errs = await open(page)
    const s = await page.evaluate((sel) => {
      const bs = [...document.querySelectorAll(sel)]
      const tb = bs[0].closest('[role="toolbar"]')
      return {
        toolbar: tb?.classList.contains('g-card-group__strip'), name: tb?.getAttribute('aria-label'), stripTab: tb?.getAttribute('tabindex'),
        rootRole: document.getElementById('cg-tab').getAttribute('role'),
        n: bs.length, zero: bs.filter((b) => b.tabIndex === 0).length,
        ctrl: bs.every((b) => b.getAttribute('aria-controls') === 'cg-tab-panel') && !!document.getElementById('cg-tab-panel'),
        panelOut: !tb.contains(document.getElementById('cg-tab-panel')),
        desc: bs.map((b) => (b.getAttribute('aria-describedby') || '').split(' ').map((id) => document.getElementById(id)?.textContent || '').join(' ').replace(/\s+/g, ' ')),
        types: bs.every((b) => b.tagName === 'BUTTON' && b.type === 'button'),
        selected: bs.some((b) => b.hasAttribute('aria-selected'))
      }
    }, BTN('cg-tab'))
    expect(s.toolbar).toBe(true)
    expect(s.name).toBe('Filtrar facturas por estado')
    expect(s.stripTab).toBe('-1')
    expect(s.rootRole).toBeNull()
    expect(s.n).toBe(4)
    expect(s.types).toBe(true)
    expect(s.selected).toBe(false)
    expect(s.zero).toBe(1)
    expect(s.ctrl).toBe(true)
    expect(s.panelOut).toBe(true)
    expect(s.desc[1]).toMatch(/Facturas/)
    expect(s.desc[1]).toMatch(/4/)
    // labelledby en el grupo múltiple; controls explícito en la rejilla
    expect(await page.getAttribute('#cg-multi > .g-card-group__strip', 'aria-labelledby')).toBe('h-multi')
    expect(await page.evaluate(() => [...document.querySelectorAll('#cg-grid .g-card__primary')].every((b) => b.getAttribute('aria-controls') === 't-grid-ext'))).toBe(true)
    // Rejilla: la tarjeta «Total» sin value es estática, fuera de la parada
    expect(await page.evaluate(() => document.querySelectorAll('#cg-grid > .g-card-group__strip > .g-card')[0].querySelector('.g-card__primary'))).toBeNull()
    expect(await page.getAttribute('#cg-grid > .g-card-group__strip', 'tabindex')).toBeNull()
    expect(errs).toEqual([])
  })

  test('pulsar filtra (la tabla anuncia, #569), Δ0 de las cajas, exclusiva, soltar, quitar el chip suelta la tarjeta', async ({ page }) => {
    const errs = await open(page)
    const before = await docRects(page, 'cg-tab')
    await page.locator(BTN('cg-tab')).nth(1).click()
    expect(await pressed(page, 'cg-tab')).toEqual(['false', 'true', 'false', 'false'])
    await expect.poll(() => rows(page, 't-tab')).toBe(4)
    expect(await chips(page, 't-tab')).toBe(1)
    await expect.poll(() => page.evaluate(() => [...document.querySelectorAll('#t-tab [aria-live]')].map((n) => n.textContent).join(' ')), { timeout: 3000 }).toContain('4 facturas')
    const after = await docRects(page, 'cg-tab')
    const moved = Math.max(...after.map((r, i) => Math.max(Math.abs(r.x - before[i].x), Math.abs(r.y - before[i].y), Math.abs(r.w - before[i].w), Math.abs(r.h - before[i].h))))
    expect(moved).toBeLessThan(0.5)
    expect(await page.evaluate(() => window.cgEvents.filter((e) => e[0] === 'tab').map((e) => e.join(' ')))).toEqual(['tab vencida true'])
    await page.locator(BTN('cg-tab')).nth(2).click()
    expect(await pressed(page, 'cg-tab')).toEqual(['false', 'false', 'true', 'false'])
    await expect.poll(() => rows(page, 't-tab')).toBe(10)
    await page.locator(BTN('cg-tab')).nth(2).click()
    expect(await pressed(page, 'cg-tab')).toEqual(['false', 'false', 'false', 'false'])
    await expect.poll(() => rows(page, 't-tab')).toBe(24)
    expect(await chips(page, 't-tab')).toBe(0)
    await page.locator(BTN('cg-tab')).nth(0).click()
    await page.locator('#t-tab .g-filter-bar__remove').first().click()
    expect(await pressed(page, 'cg-tab')).toEqual(['false', 'false', 'false', 'false'])
    await expect.poll(() => rows(page, 't-tab')).toBe(24)
    expect(await page.evaluate(() => document.getElementById('cg-tab').classList.contains('is-filtered'))).toBe(false)
    expect(errs).toEqual([])
  })

  test('multiple: dos pulsadas, un filtro in en el orden del DOM, la tabla une (8 + 4 = 12)', async ({ page }) => {
    await open(page)
    await page.locator(BTN('cg-multi')).nth(1).click()
    await page.locator(BTN('cg-multi')).nth(0).click()
    expect(await pressed(page, 'cg-multi')).toEqual(['true', 'true', 'false', 'false'])
    await expect.poll(() => rows(page, 't-multi')).toBe(12)
    expect(await page.evaluate(() => JSON.stringify(window.cg.multi.filters))).toBe('[{"key":"estado","op":"in","value":["pendiente","vencida"]}]')
    expect(await page.evaluate(() => document.querySelectorAll('#cg-multi .g-card-group__bridge:not(.is-leaving)').length)).toBe(2)
    await page.locator(BTN('cg-multi')).nth(0).click()
    expect(await pressed(page, 'cg-multi')).toEqual(['false', 'true', 'false', 'false'])
    await expect.poll(() => rows(page, 't-multi')).toBe(4)
  })

  test('cambio externo: sin change, sin mover el foco y desplazando solo la tira (375 px)', async ({ page }) => {
    const errs = await open(page, { width: 375, height: 800 })
    await page.evaluate(() => { const b = document.createElement('button'); b.id = 'pw-out'; b.textContent = 'fuera'; document.body.prepend(b); b.focus() })
    const y0 = await page.evaluate(() => scrollY)
    const sl0 = await page.evaluate(() => document.querySelector('#cg-tab > .g-card-group__strip').scrollLeft)
    await page.evaluate(() => { window.cgModel.tab = 'en disputa' })
    await expect.poll(() => pressed(page, 'cg-tab')).toEqual(['false', 'false', 'false', 'true'])
    await page.waitForTimeout(600)
    const s = await page.evaluate(() => {
      const strip = document.querySelector('#cg-tab > .g-card-group__strip')
      const r = strip.getBoundingClientRect()
      const k = document.querySelectorAll('#cg-tab > .g-card-group__strip > .g-card')[3].getBoundingClientRect()
      return { focus: document.activeElement.id, y: scrollY, sl: strip.scrollLeft, inside: k.left >= r.left - 0.5 && k.right <= r.right + 0.5, ev: window.cgEvents.length }
    })
    expect(s.focus).toBe('pw-out')
    expect(s.y).toBe(y0)
    expect(Math.abs(s.sl)).toBeGreaterThan(Math.abs(sl0))
    expect(s.inside).toBe(true)
    expect(s.ev).toBe(0)
    expect(errs).toEqual([])
  })
})

test.describe('GCardGroup · teclado y foco', () => {
  test('Tab entra en la primera; flechas sin filtrar; Espacio filtra; Fin/Inicio sin vuelta; vuelve a la pulsada; Intro suelta; sale', async ({ page, browserName }) => {
    const errs = await open(page)
    for (const g of ['cg-tab', 'cg-grid']) {
      await tabInto(page, g, browserName)
      expect(await activeIdx(page, g)).toBe(0)
      await page.keyboard.press('ArrowRight')
      expect(await activeIdx(page, g)).toBe(1)
      expect((await pressed(page, g)).every((x) => x === 'false')).toBe(true)
      const ring = await page.evaluate(() => { const a = document.activeElement; return { fv: a.matches(':focus-visible'), ring: getComputedStyle(a.closest('.g-card'), '::after').outlineStyle } })
      expect(ring.fv).toBe(true)
      expect(ring.ring).toBe('solid')
      await page.keyboard.press('Space')
      expect((await pressed(page, g))[1]).toBe('true')
      await page.keyboard.press('End')
      expect(await activeIdx(page, g)).toBe(3)
      await page.keyboard.press('ArrowRight')
      expect(await activeIdx(page, g)).toBe(3)
      await page.keyboard.press('Home')
      expect(await activeIdx(page, g)).toBe(0)
      await page.keyboard.press('ArrowLeft')
      expect(await activeIdx(page, g)).toBe(0)
      await page.keyboard.press('ArrowDown')
      expect(await activeIdx(page, g)).toBe(1)
      await page.keyboard.press('ArrowUp')
      expect(await activeIdx(page, g)).toBe(0)
      await tabInto(page, g, browserName)
      expect(await activeIdx(page, g)).toBe(1)
      expect((await stops(page, g)).filter((t) => t === 0)).toHaveLength(1)
      await page.keyboard.press('Enter')
      expect((await pressed(page, g)).every((x) => x === 'false')).toBe(true)
      await page.keyboard.press(TAB(browserName))
      expect(await activeIdx(page, g)).toBe(-1)
      expect(await page.evaluate((id) => document.getElementById(id).querySelector('.g-card-group__strip').contains(document.activeElement), g)).toBe(false)
    }
    expect(errs).toEqual([])
  })

  test('#570: la tira con panel no es una parada (Tab y Mayús+Tab), también en Firefox', async ({ page, browserName }) => {
    await open(page)
    await tabInto(page, 'cg-tab', browserName)
    expect(await activeIdx(page, 'cg-tab')).toBe(0)
    await page.keyboard.press(BACKTAB(browserName))
    expect(await page.evaluate(() => document.activeElement.id)).toBe('pw-sentinel')
    await page.keyboard.press(TAB(browserName))
    await page.keyboard.press(TAB(browserName))
    const out = await page.evaluate(() => ({ strip: document.activeElement.classList.contains('g-card-group__strip'), inPanel: !!document.activeElement.closest('#cg-tab-panel') }))
    expect(out.strip).toBe(false)
    expect(out.inPanel).toBe(true)
  })

  test('RTL: ← avanza y → retrocede; el puente sigue a la tarjeta', async ({ page, browserName }) => {
    const errs = await open(page, { q: '?dir=rtl' })
    await tabInto(page, 'cg-grid', browserName)
    await page.keyboard.press('ArrowLeft')
    expect(await activeIdx(page, 'cg-grid')).toBe(1)
    await page.keyboard.press('ArrowRight')
    expect(await activeIdx(page, 'cg-grid')).toBe(0)
    await page.locator(BTN('cg-tab')).nth(1).click()
    await page.waitForTimeout(500)
    const g = await bridge(page, 'cg-tab', 1)
    expect(g.dx).toBeLessThan(0.5)
    expect(g.dw).toBeLessThan(0.5)
    expect(errs).toEqual([])
  })

  test('una tarjeta que pasa a disabled con el foco: el foco va a la siguiente elegible', async ({ page, browserName }) => {
    await open(page)
    await tabInto(page, 'cg-grid', browserName)
    await page.keyboard.press('ArrowRight')
    expect(await activeIdx(page, 'cg-grid')).toBe(1)
    await page.evaluate(() => { window.cg.gridDisabled = 'vencida' })
    await expect.poll(() => activeIdx(page, 'cg-grid')).toBe(2)
    // La deshabilitada queda fuera de la parada y de las flechas
    await page.keyboard.press('ArrowLeft')
    expect(await activeIdx(page, 'cg-grid')).toBe(0)
  })
})

test.describe('GCardGroup · L7 y puente', () => {
  test('L7: a 375 px, Fin trae la última tarjeta ENTERA a la vista (WebKit incluido)', async ({ page, browserName }) => {
    await open(page, { width: 375, height: 800 })
    const a = await page.evaluate(() => { const s = document.querySelector('#cg-tab > .g-card-group__strip'); const k = [...s.querySelectorAll(':scope > .g-card')].map((x) => x.getBoundingClientRect().top); return { scroll: s.scrollWidth > s.clientWidth, row: Math.max(...k) - Math.min(...k) } })
    expect(a.scroll).toBe(true)
    expect(a.row).toBeLessThan(0.5)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 0.5)).toBe(true)
    await tabInto(page, 'cg-tab', browserName)
    expect(await activeIdx(page, 'cg-tab')).toBe(0)
    await page.keyboard.press('End')
    await page.waitForTimeout(700)
    const vis = await page.evaluate(() => {
      const s = document.querySelector('#cg-tab > .g-card-group__strip').getBoundingClientRect()
      const k = document.activeElement.closest('.g-card').getBoundingClientRect()
      return k.left >= s.left - 0.5 && k.right <= s.right + 0.5 ? true : `${k.left.toFixed(1)}–${k.right.toFixed(1)} en ${s.left.toFixed(1)}–${s.right.toFixed(1)}`
    })
    expect(vis).toBe(true)
    await page.keyboard.press('Home')
    await page.waitForTimeout(700)
    const vis0 = await page.evaluate(() => {
      const s = document.querySelector('#cg-tab > .g-card-group__strip').getBoundingClientRect()
      const k = document.activeElement.closest('.g-card').getBoundingClientRect()
      return k.left >= s.left - 0.5 && k.right <= s.right + 0.5
    })
    expect(vis0).toBe(true)
  })

  test('puente: x y ancho Δ0, nace en el borde inferior de la tarjeta, cubre el borde del panel; viaja; se retira', async ({ page }) => {
    const errs = await open(page)
    expect(await page.evaluate(() => document.querySelectorAll('#cg-tab .g-card-group__bridge').length)).toBe(0)
    await page.locator(BTN('cg-tab')).nth(1).click()
    await page.waitForTimeout(500)
    const g = await bridge(page, 'cg-tab', 1)
    expect(g).not.toBeNull()
    expect(g.dx).toBeLessThan(0.5)
    expect(g.dw).toBeLessThan(0.5)
    // Nace en el borde inferior de la tarjeta: lo tapa (el borde doble, --_edge) y baja hasta el marco (geometría de coco)
    expect(Math.abs(g.top + g.edge)).toBeLessThan(0.5)
    expect(g.over).toBeGreaterThanOrEqual(g.edge - 0.5)
    expect(g.hidden).toBe('true')
    expect(g.inStrip).toBe(true)
    const el = await page.evaluateHandle(() => document.querySelector('#cg-tab .g-card-group__bridge'))
    await page.locator(BTN('cg-tab')).nth(3).click()
    await page.waitForTimeout(500)
    const g2 = await bridge(page, 'cg-tab', 3)
    expect(g2.n).toBe(1)
    expect(g2.dx).toBeLessThan(0.5)
    expect(await page.evaluate((e) => e === document.querySelector('#cg-tab .g-card-group__bridge'), el)).toBe(true) // el mismo: viaja
    // Se recoge: is-leaving durante su transición (--g-duration-fast) y después se retira (registro por MutationObserver)
    await page.evaluate(() => {
      window.__leave = { seen: false, ms: 0 }
      const strip = document.querySelector('#cg-tab > .g-card-group__strip')
      new MutationObserver(() => {
        const b = strip.querySelector('.g-card-group__bridge.is-leaving')
        if (b && !window.__leave.seen) { window.__leave.seen = true; window.__leave.at = performance.now() }
        if (window.__leave.seen && !strip.querySelector('.g-card-group__bridge') && !window.__leave.ms) window.__leave.ms = performance.now() - window.__leave.at
      }).observe(strip, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] })
    })
    await page.locator(BTN('cg-tab')).nth(3).click()
    await expect.poll(() => page.evaluate(() => document.querySelectorAll('#cg-tab .g-card-group__bridge').length), { timeout: 2000 }).toBe(0)
    const leave = await page.evaluate(() => window.__leave)
    expect(leave.seen).toBe(true)
    expect(leave.ms).toBeGreaterThan(30) // se quedó lo que dura su transición, no se borró en el acto
    expect(await page.evaluate(() => document.querySelector('#cg-tab-panel').classList.contains('is-filtered'))).toBe(false)
    expect(errs).toEqual([])
  })

  test('el puente sigue a su tarjeta al desplazar la tira (375 px)', async ({ page }) => {
    await open(page, { width: 375, height: 800 })
    await page.locator(BTN('cg-tab')).nth(0).click()
    await page.evaluate(() => { document.querySelector('#cg-tab > .g-card-group__strip').scrollLeft = 120 })
    await page.waitForTimeout(400)
    const g = await bridge(page, 'cg-tab', 0)
    expect(g.dx).toBeLessThan(0.5)
  })

  test('movimiento reducido: el puente solo se funde', async ({ page }) => {
    await open(page, { motion: 'reduce' })
    await page.locator(BTN('cg-tab')).nth(1).click()
    const tr = await page.evaluate(() => getComputedStyle(document.querySelector('#cg-tab .g-card-group__bridge')).transitionProperty)
    expect(tr).not.toMatch(/translate|transform|scale|width|inline-size|left/)
  })

  test('rendimiento: un render del padre que no cambia lo medible no vuelve a medir la tira (bd888df)', async ({ page }) => {
    await open(page)
    await page.locator(BTN('cg-tab')).nth(1).click()
    await page.waitForTimeout(300)
    const calls = await page.evaluate(async () => {
      const strips = new Set([...document.querySelectorAll('.g-card-group__strip')])
      let n = 0
      const orig = Element.prototype.getBoundingClientRect
      Element.prototype.getBoundingClientRect = function () { if (strips.has(this)) n++; return orig.call(this) }
      // El registro de eventos se pinta en la raíz: cada push re-renderiza la aplicación entera
      for (let i = 0; i < 20; i++) { window.cgEvents.push(['x', String(i), '']); await new Promise((r) => requestAnimationFrame(r)) }
      Element.prototype.getBoundingClientRect = orig
      return n
    })
    expect(calls).toBe(0)
  })
})
