// GTooltip sobre el COMPONENTE REAL del playground (packages/vue/playground, #sec-tooltip), en Chromium, Firefox y WebKit.
// Batería de kiwi (design/lab/tooltip/verificar.mjs) y del contrato (design/contracts/tooltip.md «Verificación ·
// Playwright»; DECISIONS.md #380 a #394): apertura y cierre con sus tiempos, relevo del grupo y viaje (una sola etiqueta
// visible en todo cuadro, pestaña Δ0 frente al control), sin viaje entre grupos, movimiento reducido, segunda etapa
// (quieto sí, en movimiento no, borde junto al control fijo), puntero que cruza a la etiqueta (1.4.13), Esc sin mover el
// foco, foco por navegación sí y por clic o programa no, volteo, RTL, seguir al desplazar y cerrar al salir (#358),
// disabled / aria-disabled / aria-expanded, GDialog (foco al abrir no muestra; primer Esc el tooltip, segundo el diálogo),
// táctil sintético, GHelper envuelto, contraste y tamaños, la matriz de componentes hijo (atributos y caja visible, #395)
// y el foco con Tab de #396.
// Un solo proceso por puerto: GRANA_PW_PORT=4210 (bruno).
import { test, expect } from '@playwright/test'

const PAGE = '/packages/vue/playground/index.html'

async function watchConsole(page) {
  const errs = []
  page.on('pageerror', (e) => { if (!/ResizeObserver loop/.test(e.message)) errs.push(`pageerror: ${e.message}`) })
  page.on('console', (m) => {
    const t = m.text()
    if (m.type() === 'error' && !/favicon/.test(t)) errs.push(`console: ${t}`)
    else if (m.type() === 'warning' && /\[Vue warn\]|\[Grana GTooltip/.test(t)) errs.push(`warning: ${t}`)
  })
  return errs
}
async function open(page, { motion = 'no-preference', width = 1280, height = 900, target = '#tt-bar' } = {}) {
  await page.emulateMedia({ reducedMotion: motion })
  await page.setViewportSize({ width, height })
  await page.goto(PAGE)
  await page.waitForSelector('#tt-bar')
  await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' })
  await page.evaluate(() => document.fonts.ready)
  if (target) await page.evaluate((s) => document.querySelector(s).scrollIntoView({ block: 'center' }), target)
  await page.mouse.move(2, 2)
}
const frames = (page, n = 2) => page.evaluate((k) => new Promise((r) => { const f = () => (k-- > 0 ? requestAnimationFrame(f) : setTimeout(r, 20)); f() }), n)
/** Ids de los controles con su tooltip abierto (el nodo es el hermano siguiente) */
const openTips = (page) => page.evaluate(() => [...document.querySelectorAll('.g-tooltip')].filter((n) => n.matches(':popover-open')).map((n) => n.previousElementSibling?.id || n.previousElementSibling?.querySelector('[data-g-tooltip]')?.id || n.id))
const center = async (page, sel) => { const b = await page.locator(sel).boundingBox(); return [b.x + b.width / 2, b.y + b.height / 2] }
const hover = async (page, sel) => { const [x, y] = await center(page, sel); await page.mouse.move(x, y) }
/** Geometría del control y de su tooltip (nodo, etiqueta y pestaña) */
const geo = (page, id) => page.evaluate((id) => {
  const c = document.getElementById(id)
  const n = [...document.querySelectorAll('.g-tooltip')].find((x) => x.previousElementSibling === c || x.previousElementSibling?.contains(c))
  const r = (e) => { const b = e.getBoundingClientRect(); return { l: b.left, t: b.top, r: b.right, b: b.bottom, w: b.width, h: b.height } }
  return { c: r(c), n: r(n), body: r(n.querySelector('.g-tooltip__body')), tab: r(n.querySelector('.g-tooltip__tab')), side: n.dataset.side, open: n.matches(':popover-open'), attrs: [...n.attributes].map((a) => a.name).filter((a) => a.startsWith('data-')) }
}, id)
const TAB = (browserName) => (browserName === 'webkit' ? 'Alt+Tab' : 'Tab')

test.describe('GTooltip · apertura, cierre y grupo', () => {
  test('nada a 200 ms y abierto a 500 ms; cierra al salir; pestaña Δ0 frente al control', async ({ page }) => {
    const errs = await watchConsole(page)
    await open(page)
    await hover(page, '#tt-copy')
    await page.waitForTimeout(200)
    expect(await openTips(page)).toEqual([])
    await page.waitForTimeout(300)
    expect(await openTips(page)).toEqual(['tt-copy'])
    const g = await geo(page, 'tt-copy')
    expect(g.side).toBe('bottom')
    expect(Math.abs(g.tab.w - g.c.w)).toBeLessThan(0.05)
    expect(Math.abs(g.tab.l - g.c.l)).toBeLessThan(0.5)
    expect(Math.abs(g.tab.t - g.c.b)).toBeLessThan(0.5)
    // El texto: nombre en su span y atajo en el kbd, aria-hidden
    const sem = await page.evaluate(() => { const b = document.getElementById('tt-copy'); const n = b.nextElementSibling; return { lb: b.getAttribute('aria-labelledby'), name: document.getElementById(b.getAttribute('aria-labelledby')).textContent, ks: b.getAttribute('aria-keyshortcuts'), kbd: n.querySelector('kbd').getAttribute('aria-hidden'), role: n.getAttribute('role'), live: n.getAttribute('aria-live') } })
    expect(sem).toEqual({ lb: expect.stringMatching(/-name$/), name: 'Duplicar', ks: 'Control+D', kbd: 'true', role: 'tooltip', live: null })
    await page.mouse.move(2, 2)
    await page.waitForTimeout(300)
    expect(await openTips(page)).toEqual([])
    expect(errs).toEqual([])
  })

  test('relevo del grupo en < 200 ms y uno solo visible; sin viaje entre grupos distintos', async ({ page }) => {
    await open(page)
    await hover(page, '#tt-undo')
    await page.waitForTimeout(450)
    // El relevo es síncrono con la entrada del puntero: medido dentro de la página, sin la latencia del protocolo
    await page.evaluate(() => {
      window.__relay = null
      const b = document.getElementById('tt-redo')
      b.addEventListener('pointerenter', () => { const t = performance.now(); requestAnimationFrame(() => { window.__relay = { ms: performance.now() - t, open: b.nextElementSibling.matches(':popover-open') } }) }, { once: true })
    })
    await hover(page, '#tt-redo')
    await expect.poll(() => page.evaluate(() => window.__relay)).not.toBe(null)
    const relay = await page.evaluate(() => window.__relay)
    expect(relay.open).toBe(true)
    expect(relay.ms).toBeLessThan(200)
    expect(await openTips(page)).toEqual(['tt-redo'])
    // De la barra a las acciones de una fila: otro grupo, sin viaje y sin entrada
    await hover(page, '#tt-row-edit-F-0041')
    const g = await geo(page, 'tt-row-edit-F-0041')
    expect(g.open).toBe(true)
    expect(g.attrs).toContain('data-instant')
    expect(g.attrs).not.toContain('data-travel')
    expect(await openTips(page)).toEqual(['tt-row-edit-F-0041'])
  })

  test('viaje: barrido de los ocho iconos con una sola etiqueta visible en todo cuadro; llega con la pestaña Δ0', async ({ page }) => {
    await open(page)
    await hover(page, '#tt-undo')
    await page.waitForTimeout(500)
    await page.evaluate(() => {
      window.__tt = []
      window.__ttStop = false
      const loop = () => {
        const vis = [...document.querySelectorAll('.g-tooltip')].filter((n) => n.matches(':popover-open') && parseFloat(getComputedStyle(n).opacity) > 0.01)
        window.__tt.push({ n: vis.length, travel: vis.some((n) => n.hasAttribute('data-travel')) })
        if (!window.__ttStop) requestAnimationFrame(loop)
      }
      requestAnimationFrame(loop)
    })
    const [x0, y] = await center(page, '#tt-undo')
    const [x1] = await center(page, '#tt-trash')
    for (let x = x0; x <= x1; x += 6) { await page.mouse.move(x, y); await page.waitForTimeout(16) }
    await page.waitForTimeout(400)
    const samples = await page.evaluate(() => { window.__ttStop = true; return window.__tt })
    expect(samples.length).toBeGreaterThan(20)
    expect(samples.filter((s) => s.n !== 1)).toEqual([])
    expect(samples.some((s) => s.travel)).toBe(true)
    const g = await geo(page, 'tt-trash')
    expect(g.attrs).not.toContain('data-travel')
    expect(Math.abs(g.tab.w - g.c.w)).toBeLessThan(0.05)
    expect(Math.abs(g.tab.l - g.c.l)).toBeLessThan(0.5)
    expect(await page.evaluate(() => document.getElementById('tt-trash').nextElementSibling.style.inlineSize)).toBe('')
  })

  test('movimiento reducido: el viaje salta (sin translate ni inline-size en la transición)', async ({ page }) => {
    await open(page, { motion: 'reduce' })
    await hover(page, '#tt-undo')
    await page.waitForTimeout(450)
    await hover(page, '#tt-redo')
    const tp = await page.evaluate(() => { const n = document.getElementById('tt-redo').nextElementSibling; return { travel: n.hasAttribute('data-travel'), tp: getComputedStyle(n).transitionProperty } })
    expect(tp.tp).not.toMatch(/translate|inline-size|--_tooltip/)
    await page.waitForTimeout(300)
    const g = await geo(page, 'tt-redo')
    expect(Math.abs(g.tab.l - g.c.l)).toBeLessThan(0.5)
  })

  test('el puntero cruza a la etiqueta por la pestaña y sigue abierto (1.4.13)', async ({ page }) => {
    await open(page)
    await hover(page, '#tt-copy')
    await page.waitForTimeout(450)
    const g = await geo(page, 'tt-copy')
    const x = g.c.l + g.c.w / 2
    for (let y = g.c.t + g.c.h / 2; y <= g.body.t + g.body.h / 2; y += 3) await page.mouse.move(x, y)
    await page.waitForTimeout(500)
    expect(await openTips(page)).toEqual(['tt-copy'])
    await page.mouse.move(2, 2)
    await page.waitForTimeout(300)
    expect(await openTips(page)).toEqual([])
  })

  test('pulsar el control cierra y no vuelve mientras el puntero sigue encima', async ({ page }) => {
    await open(page)
    await hover(page, '#tt-copy')
    await page.waitForTimeout(450)
    await page.mouse.down()
    await page.mouse.up()
    await page.waitForTimeout(500)
    expect(await openTips(page)).toEqual([])
    expect(await page.locator('#tt-log').textContent()).toBe('Duplicar')
  })
})

test.describe('GTooltip · segunda etapa', () => {
  test('crece a los 700 ms quieto, hacia fuera (borde junto al control Δ0); en movimiento no crece', async ({ page }) => {
    await open(page)
    await hover(page, '#tt-flag')
    await page.waitForTimeout(450)
    const g0 = await geo(page, 'tt-flag')
    expect(g0.attrs).not.toContain('data-dwell')
    await page.waitForTimeout(900)
    const g1 = await geo(page, 'tt-flag')
    expect(g1.attrs).toContain('data-dwell')
    expect(g1.side).toBe(g0.side)
    expect(g1.n.h).toBeGreaterThan(g0.n.h + 10)
    if (g1.side === 'bottom') expect(Math.abs(g1.n.t - g0.n.t)).toBeLessThan(0.5)
    else expect(Math.abs(g1.n.b - g0.n.b)).toBeLessThan(0.5)
    expect(Math.abs(g1.tab.w - g1.c.w)).toBeLessThan(0.05)
    // En movimiento: no crece
    await page.mouse.move(2, 2)
    await page.waitForTimeout(800)
    const [x, y] = await center(page, '#tt-flag')
    await page.mouse.move(x - 6, y)
    for (let i = 0; i < 12; i++) { await page.mouse.move(x - 6 + (i % 2 ? 4 : 0), y + (i % 3) - 1); await page.waitForTimeout(150) }
    expect((await geo(page, 'tt-flag')).attrs).not.toContain('data-dwell')
  })

  test('el detalle y el atajo están en el árbol desde el montaje (describedby al detalle)', async ({ page }) => {
    await open(page)
    const r = await page.evaluate(() => { const b = document.getElementById('tt-flag'); return (b.getAttribute('aria-describedby') || '').split(' ').map((id) => document.getElementById(id)?.textContent) })
    expect(r).toEqual(['Avisa al responsable del expediente y lo pone en su bandeja'])
  })
})

test.describe('GTooltip · teclado y foco', () => {
  test('flechas en la barra abren al instante; Esc cierra sin mover el foco y no reaparece', async ({ page }) => {
    await open(page)
    await page.evaluate(() => document.getElementById('tt-undo').focus())
    await frames(page)
    expect(await openTips(page)).toEqual([])
    await page.keyboard.press('ArrowRight')
    await expect.poll(() => openTips(page), { intervals: [20] }).toEqual(['tt-redo'])
    await page.keyboard.press('Escape')
    expect(await openTips(page)).toEqual([])
    expect(await page.evaluate(() => document.activeElement.id)).toBe('tt-redo')
    await page.waitForTimeout(400)
    expect(await openTips(page)).toEqual([])
    // Flecha al siguiente: vuelve a abrir (el Esc solo dura hasta perder el foco)
    await page.keyboard.press('ArrowRight')
    await expect.poll(() => openTips(page)).toEqual(['tt-copy'])
  })

  test('Tab al riel (grupo vertical): abre al instante a la derecha', async ({ page, browserName }) => {
    await open(page)
    await page.evaluate(() => document.getElementById('tt-undo').focus())
    await page.keyboard.press(TAB(browserName))
    await expect.poll(() => page.evaluate(() => document.activeElement.id)).toBe('tt-rail-home')
    await expect.poll(() => openTips(page)).toEqual(['tt-rail-home'])
    const g = await geo(page, 'tt-rail-home')
    expect(g.side).toBe('right')
    expect(g.n.l).toBeGreaterThanOrEqual(g.c.r - 0.5)
    expect(Math.abs(g.tab.h - g.c.h)).toBeLessThan(0.05)
  })

  test('foco por clic y por programa no abren', async ({ page }) => {
    await open(page)
    await page.evaluate(() => document.getElementById('tt-publish').focus())
    await page.waitForTimeout(100)
    expect(await openTips(page)).toEqual([])
    await page.locator('#tt-publish').click()
    await page.mouse.move(2, 2)
    await page.waitForTimeout(400)
    expect(await openTips(page)).toEqual([])
  })

  test('#396 Tab + Intro con GDialog: llegar por Tab a un control sin tooltip cierra el saliente; Intro abre el diálogo sin mostrar', async ({ page, browserName }) => {
    await open(page, { target: '#tt-open-dlg' })
    const T = TAB(browserName)
    // Por teclado al control anterior (con tooltip), que se abre al llegar
    await page.evaluate(() => document.getElementById('tt-open-dlg').focus())
    await page.keyboard.press(`Shift+${T}`)
    const prev = await page.evaluate(() => document.activeElement.id)
    expect(prev).toBe('tt-rtl-left')
    await expect.poll(() => openTips(page)).toEqual(['tt-rtl-left'])
    // Tab a «Abrir diálogo» (sin tooltip, fuera del grupo): el saliente cierra
    await page.keyboard.press(T)
    await expect.poll(() => page.evaluate(() => document.activeElement.id)).toBe('tt-open-dlg')
    await expect.poll(() => openTips(page)).toEqual([])
    // Intro: el diálogo enfoca su primer control (foco por programa) y no muestra su tooltip
    await page.keyboard.press('Enter')
    await expect(page.locator('dialog[open]')).toHaveCount(1)
    await expect.poll(() => page.evaluate(() => document.activeElement.id)).toBe('tt-dlg-undo')
    await page.waitForTimeout(450)
    expect(await openTips(page)).toEqual([])
    await page.keyboard.press('Escape')
    await expect(page.locator('dialog[open]')).toHaveCount(0)
  })

  test('#396 Tab con relevo en una barra sin tabindex itinerante: viaja sin cuadro vacío; Tab a otro grupo aparece sin viaje', async ({ page, browserName }) => {
    await open(page, { target: '.tt-rows' })
    const T = TAB(browserName)
    await page.evaluate(() => document.getElementById('tt-row-dl-F-0041').focus())
    await page.keyboard.press(`Shift+${T}`)
    await expect.poll(() => openTips(page)).toEqual(['tt-row-edit-F-0041'])
    await page.waitForTimeout(250)
    await page.evaluate(() => {
      window.__tt = []
      window.__ttStop = false
      const loop = () => {
        const vis = [...document.querySelectorAll('.g-tooltip')].filter((n) => n.matches(':popover-open') && parseFloat(getComputedStyle(n).opacity) > 0.01)
        window.__tt.push({ n: vis.length, travel: vis.some((n) => n.hasAttribute('data-travel')) })
        if (!window.__ttStop) requestAnimationFrame(loop)
      }
      requestAnimationFrame(loop)
      // El viaje se registra por mutación (con carga, WebKit puede no pintar un cuadro durante los 120 ms del viaje)
      window.__travel = false
      const n = document.getElementById('tt-row-dl-F-0041').nextElementSibling
      new MutationObserver(() => { if (n.hasAttribute('data-travel')) window.__travel = true }).observe(n, { attributes: true, attributeFilter: ['data-travel'] })
    })
    await page.keyboard.press(T)
    await expect.poll(() => openTips(page)).toEqual(['tt-row-dl-F-0041'])
    await page.waitForTimeout(350)
    const samples = await page.evaluate(() => { window.__ttStop = true; return window.__tt })
    expect(samples.length).toBeGreaterThan(5)
    expect(samples.filter((x) => x.n !== 1)).toEqual([])
    expect(await page.evaluate(() => window.__travel)).toBe(true)
    const g = await geo(page, 'tt-row-dl-F-0041')
    expect(Math.abs(g.tab.w - g.c.w)).toBeLessThan(0.05)
    expect(Math.abs(g.tab.l - g.c.l)).toBeLessThan(0.5)
    // Al último de la fila y Tab a la fila siguiente (otro grupo): uno solo abierto y sin viaje
    await page.keyboard.press(T)
    await expect.poll(() => openTips(page)).toEqual(['tt-row-del-F-0041'])
    await page.waitForTimeout(250)
    await page.keyboard.press(T)
    await expect.poll(() => openTips(page)).toEqual(['tt-row-edit-F-0042'])
    expect(await page.evaluate(() => document.getElementById('tt-row-edit-F-0042').nextElementSibling.hasAttribute('data-travel'))).toBe(false)
  })

  test('GDialog: el foco al abrir (Intro) no muestra; primer Esc cierra el tooltip y el segundo el diálogo', async ({ page }) => {
    await open(page, { target: '#tt-open-dlg' })
    await page.evaluate(() => document.getElementById('tt-open-dlg').focus())
    await page.keyboard.press('Enter')
    await expect(page.locator('dialog[open]')).toHaveCount(1)
    await expect.poll(() => page.evaluate(() => document.activeElement.id)).toBe('tt-dlg-undo')
    await page.waitForTimeout(150)
    expect(await openTips(page)).toEqual([])
    await page.keyboard.press('ArrowRight')
    await expect.poll(() => openTips(page)).toEqual(['tt-dlg-redo'])
    // El nodo vive dentro del <dialog> modal (no inerte) y se ve por encima
    expect(await page.evaluate(() => document.getElementById('tt-dlg-redo').nextElementSibling.closest('dialog') !== null)).toBe(true)
    await page.keyboard.press('Escape')
    expect(await openTips(page)).toEqual([])
    await expect(page.locator('dialog[open]')).toHaveCount(1)
    await page.keyboard.press('Escape')
    await expect(page.locator('dialog[open]')).toHaveCount(0)
  })
})

test.describe('GTooltip · estados del control', () => {
  test('disabled nativo no abre; aria-disabled sí; aria-expanded (menú abierto) cierra y no vuelve', async ({ page }) => {
    await open(page, { target: '#tt-flag' })
    await hover(page, '#tt-disabled')
    await page.waitForTimeout(500)
    expect(await openTips(page)).toEqual([])
    await page.mouse.move(2, 2)
    await page.waitForTimeout(700)
    await hover(page, '#tt-aria-disabled')
    await page.waitForTimeout(450)
    expect(await openTips(page)).toEqual(['tt-aria-disabled'])
    await page.mouse.move(2, 2)
    await page.waitForTimeout(700)
    await hover(page, '#tt-menu')
    await page.waitForTimeout(450)
    expect(await openTips(page)).toEqual(['tt-menu'])
    await page.locator('#tt-menu').click()
    await expect(page.locator('#tt-menu')).toHaveAttribute('aria-expanded', 'true')
    await page.waitForTimeout(500)
    expect(await openTips(page)).toEqual([])
    await page.keyboard.press('Escape')
  })
})

test.describe('GTooltip · posición', () => {
  test('voltea arriba sin sitio debajo; la etiqueta queda dentro del visor', async ({ page }) => {
    await open(page, { target: null })
    await page.evaluate(() => document.getElementById('tt-flag').scrollIntoView({ block: 'end' }))
    await frames(page)
    await hover(page, '#tt-flag')
    await page.waitForTimeout(450)
    const g = await geo(page, 'tt-flag')
    expect(g.side).toBe('top')
    expect(g.n.b).toBeLessThanOrEqual(g.c.t + 0.5)
    expect(g.n.t).toBeGreaterThanOrEqual(0)
    expect(Math.abs(g.tab.b - g.c.t)).toBeLessThan(0.5)
  })

  test('RTL: placement="left" abre al lado físico derecho; la pestaña mide el control', async ({ page }) => {
    await open(page, { target: '#tt-rtl' })
    await hover(page, '#tt-rtl-left')
    await page.waitForTimeout(450)
    const g = await geo(page, 'tt-rtl-left')
    expect(g.side).toBe('left')
    expect(g.n.l).toBeGreaterThanOrEqual(g.c.r - 0.5)
    expect(Math.abs(g.tab.h - g.c.h)).toBeLessThan(0.05)
    // Barra RTL: debajo, pestaña sobre el control
    await page.mouse.move(2, 2)
    await page.waitForTimeout(700)
    await hover(page, '#tt-rtl-a')
    await page.waitForTimeout(450)
    const a = await geo(page, 'tt-rtl-a')
    expect(Math.abs(a.tab.l - a.c.l)).toBeLessThan(0.5)
    expect(Math.abs(a.tab.w - a.c.w)).toBeLessThan(0.05)
  })

  test('sigue al control al desplazar su contenedor sin cambiar de lado; cierra cuando sale (#358, regla 3)', async ({ page }) => {
    await open(page, { target: '#tt-scroll' })
    await hover(page, '#tt-scroll-btn')
    await page.waitForTimeout(450)
    const g0 = await geo(page, 'tt-scroll-btn')
    expect(g0.open).toBe(true)
    await page.evaluate(() => { document.getElementById('tt-scroll').scrollTop += 20 })
    await frames(page, 3)
    const g1 = await geo(page, 'tt-scroll-btn')
    expect(g1.open).toBe(true)
    expect(g1.side).toBe(g0.side)
    expect(Math.abs((g0.n.t - g1.n.t) - 20)).toBeLessThan(0.6)
    expect(Math.abs(g1.tab.l - g1.c.l)).toBeLessThan(0.5)
    await page.evaluate(() => { document.getElementById('tt-scroll').scrollTop += 200 })
    await frames(page, 3)
    expect(await openTips(page)).toEqual([])
  })

  test('sigue al desplazar la página', async ({ page }) => {
    await open(page)
    await hover(page, '#tt-copy')
    await page.waitForTimeout(450)
    const g0 = await geo(page, 'tt-copy')
    await page.evaluate(() => window.scrollBy(0, 30))
    await frames(page, 3)
    const g1 = await geo(page, 'tt-copy')
    if (g1.open) {
      expect(Math.abs(g1.tab.t - g1.c.b)).toBeLessThan(0.5)
      expect(g1.side).toBe(g0.side)
    }
  })

  test('320 px: la etiqueta larga cabe con sus márgenes y nunca se recorta', async ({ page }) => {
    await open(page, { width: 320, height: 700, target: '#tt-long' })
    await page.evaluate(() => document.getElementById('tt-long').scrollIntoView({ block: 'center', inline: 'center' }))
    await hover(page, '#tt-long')
    await page.waitForTimeout(450)
    const g = await geo(page, 'tt-long')
    expect(g.open).toBe(true)
    expect(g.n.l).toBeGreaterThanOrEqual(7.5)
    expect(g.n.r).toBeLessThanOrEqual(320 - 7.5)
    const clip = await page.evaluate(() => { const t = document.getElementById('tt-long').nextElementSibling.querySelector('.g-tooltip__text'); return t.scrollWidth - t.clientWidth })
    expect(clip).toBeLessThanOrEqual(0)
  })
})

test.describe('GTooltip · táctil sintético', () => {
  const touch = (page, id, type) => page.evaluate(([id, type]) => {
    const el = document.getElementById(id)
    const r = el.getBoundingClientRect()
    el.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, pointerType: 'touch', pointerId: 7, isPrimary: true, clientX: r.left + 5, clientY: r.top + 5 }))
  }, [id, type])
  const click = (page, id) => page.evaluate((id) => document.getElementById(id).dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })), id)

  test('pulsación larga: abre a los ~500 ms, soltar no activa, queda el tiempo de lectura', async ({ page }) => {
    await open(page)
    await touch(page, 'tt-copy', 'pointerdown')
    await page.waitForTimeout(300)
    expect(await openTips(page)).toEqual([])
    await page.waitForTimeout(350)
    expect(await openTips(page)).toEqual(['tt-copy'])
    expect((await geo(page, 'tt-copy')).attrs).toContain('data-touch')
    await touch(page, 'tt-copy', 'pointerup')
    await click(page, 'tt-copy')
    expect(await page.locator('#tt-log').textContent()).toBe('nada')
    await page.waitForTimeout(1200)
    expect(await openTips(page)).toEqual(['tt-copy'])
    await page.waitForTimeout(600)
    expect(await openTips(page)).toEqual([])
  })

  test('con detail: todo de una vez (data-dwell); un toque normal activa y no muestra', async ({ page }) => {
    await open(page)
    await touch(page, 'tt-tag', 'pointerdown')
    await page.waitForTimeout(650)
    expect((await geo(page, 'tt-tag')).attrs).toEqual(expect.arrayContaining(['data-touch', 'data-dwell']))
    await touch(page, 'tt-tag', 'pointerup')
    // Toque normal en otro: cierra el anterior, activa y no muestra
    await touch(page, 'tt-redo', 'pointerdown')
    await page.waitForTimeout(80)
    await touch(page, 'tt-redo', 'pointerup')
    await click(page, 'tt-redo')
    expect(await page.locator('#tt-log').textContent()).toBe('Rehacer')
    expect(await openTips(page)).toEqual([])
  })
})

test.describe('GTooltip · forma, contraste y tamaños', () => {
  test('nombre 14 px y atajo 12 px; contraste ≥ 4.5:1', async ({ page }) => {
    await open(page)
    await hover(page, '#tt-copy')
    await page.waitForTimeout(450)
    const r = await page.evaluate(() => {
      const n = document.getElementById('tt-copy').nextElementSibling
      const rgb = (c) => c.match(/[\d.]+/g).slice(0, 3).map(Number)
      const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) }
      const ratio = (a, b) => { const [x, y] = [lum(rgb(a)), lum(rgb(b))].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05) }
      const body = getComputedStyle(n.querySelector('.g-tooltip__body')).backgroundColor
      const text = n.querySelector('.g-tooltip__text'), kbd = n.querySelector('kbd')
      return { name: parseFloat(getComputedStyle(text).fontSize), kbd: parseFloat(getComputedStyle(kbd).fontSize), cName: ratio(getComputedStyle(text).color, body), cKbd: ratio(getComputedStyle(kbd).color, body) }
    })
    expect(r.name).toBeGreaterThanOrEqual(14)
    expect(r.kbd).toBeGreaterThanOrEqual(12)
    expect(r.cName).toBeGreaterThanOrEqual(4.5)
    expect(r.cKbd).toBeGreaterThanOrEqual(4.5)
  })

  test('botón block: etiqueta acotada al máximo y pestaña dentro de ella', async ({ page }) => {
    await open(page, { target: '#tt-block' })
    await hover(page, '#tt-block')
    await page.waitForTimeout(450)
    const g = await geo(page, 'tt-block')
    expect(g.n.w).toBeLessThanOrEqual(280.5)
    expect(g.tab.l).toBeGreaterThanOrEqual(g.n.l - 0.5)
    expect(g.tab.r).toBeLessThanOrEqual(g.n.r + 0.5)
  })
})

// Matriz de componentes hijo (tooltip.md §«El hijo», #394; caja visible, #395): los atributos llegan al elemento
// enfocable y la pestaña se mide contra la CAJA VISIBLE del control (Δ ≤ 0,5 px de ancho, o de alto en un riel, y del
// borde). El puntero se pone donde se pide (el prefijo, −/+, «Mostrar»): abre siempre el tooltip del campo.
const MATRIX = [
  // [nombre, id del elemento resuelto o del campo, selector de la caja visible desde el elemento resuelto (vacío: él mismo), dónde poner el puntero (dentro de la raíz del hijo; vacío: la caja)]
  ['GBtn (button)', 'tt-publish', '', ''],
  ['GBtn (a)', 'tt-f-link', '', ''],
  ['GInput', 'tt-f-input', '.g-input__control', ''],
  ['GInput prefix + suffix + action', 'tt-f-money', '.g-input__control', '.g-input__prefix'],
  ['GInput contraseña', 'tt-f-pass', '.g-input__control', '.g-input__toggle'],
  ['GTextarea', 'tt-f-textarea', '.g-textarea__control', ''],
  ['GSelect', 'tt-f-select', '.g-select__control', ''],
  ['GNumberField −/+', 'tt-f-number', '.g-input__control', '.g-number-field__step--increment'],
  ['GCombobox field', 'tt-f-combobox', '.g-input__control', ''],
  ['GCombobox palette', 'tt-f-palette', '.g-input__control', ''],
  ['GDatePicker', 'tt-f-date', '.g-datepicker__field', ''],
  ['GSwitch', 'tt-f-switch', '.g-switch__control', ''],
  ['GCheckbox', 'tt-f-checkbox', '.g-checkbox__box', ''],
  ['GHelper', '.tt-fields .g-helper__trigger', '', ''],
  ['GFileField', 'tt-f-file', '.g-file-field__add', ''],
  ['GFileField con archivos', 'tt-f-files', '.g-file-field__add', '']
]
const BOXED = ['.g-input__control', '.g-textarea__control', '.g-select__control', '.g-file-field__add']
/** Elemento resuelto (con data-g-tooltip), raíz del hijo (su hermano siguiente es el nodo) y caja visible */
const parts = (page, id, visual) => page.evaluate(([id, visual]) => {
  const byId = document.getElementById(id) || document.querySelector(id)
  const el = byId?.matches('[data-g-tooltip]') ? byId : byId?.querySelector('[data-g-tooltip]') || byId?.closest('.g-helper')?.querySelector('[data-g-tooltip]')
  if (!el) return null
  let root = el
  while (root && !root.nextElementSibling?.matches('.g-tooltip')) root = root.parentElement
  const box = visual ? el.closest(visual) : el
  root.setAttribute('data-pw-root', id)
  box?.setAttribute('data-pw-box', id)
  const desc = (el.getAttribute('aria-describedby') || '').split(' ').filter(Boolean)
  const lb = (el.getAttribute('aria-labelledby') || '').split(' ').filter(Boolean)
  return {
    focusable: el.matches('button, a[href], input, select, textarea, [tabindex]'),
    name: [...desc, ...lb].some((d) => /-name$/.test(d) && document.getElementById(d)?.closest('.g-tooltip') === root.nextElementSibling),
    marked: box?.hasAttribute('data-g-tooltip-box') || box === el,
    nodeId: root.nextElementSibling.id
  }
}, [id, visual])
test.describe('GTooltip · matriz de componentes hijo', () => {
  test('atributos en el elemento enfocable; la pestaña mide la caja visible (Δ ≤ 0,5 px) y el puntero en ella abre el del campo', async ({ page }) => {
    const errs = await watchConsole(page)
    await open(page, { target: '.tt-fields' })
    const rows = []
    for (const [name, id, visual, pointAt] of MATRIX) {
      const p = await parts(page, id, visual)
      expect(p, name).not.toBe(null)
      expect(p.focusable, name).toBe(true)
      expect(p.name, name).toBeTruthy()
      // Las cajas que no coinciden con su enfocable llevan la marca; GDatePicker, GSwitch y GCheckbox coinciden sin ella
      if (BOXED.includes(visual)) expect(p.marked, `${name}: caja marcada`).toBe(true)
      await page.evaluate((id) => document.querySelector(`[data-pw-box="${id}"]`).scrollIntoView({ block: 'center' }), id)
      await page.mouse.move(2, 2)
      await page.waitForTimeout(250)
      await hover(page, pointAt ? `[data-pw-root="${id}"] ${pointAt}` : `[data-pw-box="${id}"]`)
      await expect.poll(() => page.evaluate(() => [...document.querySelectorAll('.g-tooltip')].filter((x) => x.matches(':popover-open')).map((x) => x.id)), { message: name }).toEqual([p.nodeId])
      await frames(page, 3)
      const m = await page.evaluate(([id, nodeId]) => {
        const b = document.querySelector(`[data-pw-box="${id}"]`).getBoundingClientRect()
        const n = document.getElementById(nodeId)
        const t = n.querySelector('.g-tooltip__tab').getBoundingClientRect()
        const side = n.dataset.side
        const v = side === 'top' || side === 'bottom'
        return {
          side,
          dSize: Math.abs(v ? t.width - b.width : t.height - b.height),
          dStart: Math.abs(v ? t.left - b.left : t.top - b.top),
          dEdge: Math.abs(side === 'bottom' ? t.top - b.bottom : side === 'top' ? t.bottom - b.top : side === 'right' ? t.left - b.right : t.right - b.left),
          box: Math.round(v ? b.width : b.height)
        }
      }, [id, p.nodeId])
      rows.push(`${name}: ${m.side} caja ${m.box}px Δtamaño ${m.dSize.toFixed(2)} Δinicio ${m.dStart.toFixed(2)} Δborde ${m.dEdge.toFixed(2)}`)
      expect(m.dSize, `${name} Δ tamaño`).toBeLessThanOrEqual(0.5)
      expect(m.dStart, `${name} Δ inicio`).toBeLessThanOrEqual(0.5)
      expect(m.dEdge, `${name} Δ borde`).toBeLessThanOrEqual(0.5)
    }
    test.info().annotations.push({ type: 'matriz', description: rows.join(' | ') })
    expect(errs).toEqual([])
  })

  test('controles dentro de la caja: el GBtn del action conserva su tooltip (#397) y el foco de «Mostrar» o −/+ no abre el del campo', async ({ page, browserName }) => {
    await open(page, { target: '.tt-fields' })
    // El GBtn tooltip del action está fuera de la caja y abre el suyo (uno solo)
    await page.mouse.move(2, 2)
    await hover(page, '#tt-f-action')
    await expect.poll(() => openTips(page)).toEqual(['tt-f-action'])
    expect(await page.evaluate(() => document.getElementById('tt-f-action').closest('[data-g-tooltip-box]'))).toBe(null)
    await page.mouse.move(2, 2)
    await page.waitForTimeout(300)
    // Tab desde el campo de contraseña a «Mostrar»: el del campo se abre al llegar y se cierra al salir del campo
    await page.evaluate(() => document.getElementById('tt-f-pass').focus())
    const T = TAB(browserName)
    await page.keyboard.press(`Shift+${T}`)
    await page.keyboard.press(T)
    await expect.poll(() => page.evaluate(() => document.activeElement.id)).toBe('tt-f-pass')
    const passNode = await page.evaluate(() => { let r = document.getElementById('tt-f-pass'); while (!r.nextElementSibling?.matches('.g-tooltip')) r = r.parentElement; return r.nextElementSibling.id })
    await expect.poll(() => page.evaluate((n) => document.getElementById(n).matches(':popover-open'), passNode)).toBe(true)
    await page.keyboard.press(T)
    await expect.poll(() => page.evaluate(() => document.activeElement.className)).toContain('g-input__toggle')
    await expect.poll(() => openTips(page)).toEqual([])
    // −/+ de GNumberField: el puntero encima muestra el del campo; pulsar es usar (cierra y no vuelve mientras siga encima)
    await page.mouse.move(2, 2)
    await page.waitForTimeout(300)
    const inc = '#tt-f-number ~ .g-number-field__steppers .g-number-field__step--increment, .g-number-field:has(#tt-f-number) .g-number-field__step--increment'
    await hover(page, inc)
    const numNode = await page.evaluate(() => { let r = document.getElementById('tt-f-number'); while (!r.nextElementSibling?.matches('.g-tooltip')) r = r.parentElement; return r.nextElementSibling.id })
    await expect.poll(() => page.evaluate((n) => document.getElementById(n).matches(':popover-open'), numNode)).toBe(true)
    await page.mouse.down()
    await page.mouse.up()
    expect(await page.evaluate(() => document.getElementById('tt-f-number').value)).not.toBe('')
    await page.waitForTimeout(450)
    expect(await openTips(page)).toEqual([])
  })

  test('#399 GFileField con archivos: el elemento resuelto es el <input type="file">, no el «Quitar» de la primera ficha; Tab desde fuera lo enfoca y abre el del campo', async ({ page, browserName }) => {
    const errs = await watchConsole(page)
    await open(page, { target: '.tt-fields' })
    const info = await page.evaluate(() => {
      const root = document.getElementById('tt-f-files').closest('.g-file-field')
      const marked = [...root.querySelectorAll('[data-g-tooltip]')]
      const first = root.querySelector('button, a[href], input, select, textarea, summary, [tabindex]')
      return { n: marked.length, tag: marked[0]?.localName, type: marked[0]?.type, firstIsRemove: first?.classList.contains('g-file-field__remove'), removes: root.querySelectorAll('.g-file-field__remove').length, boxHasMarked: Boolean(root.querySelector('.g-file-field__add[data-g-tooltip-box] [data-g-tooltip]')) }
    })
    // Con archivos: dos «Quitar» antes del campo y un solo elemento con la referencia: el <input type="file">
    expect(info).toEqual({ n: 1, tag: 'input', type: 'file', firstIsRemove: true, removes: 2, boxHasMarked: true })
    // Un «Quitar» no lleva las referencias ni abre el del campo con el foco
    expect(await page.evaluate(() => document.querySelectorAll('.g-file-field:has(#tt-f-files) .g-file-field__remove[data-g-tooltip], .g-file-field:has(#tt-f-files) .g-file-field__remove[aria-labelledby$="-name"]').length)).toBe(0)
    const T = TAB(browserName)
    await page.evaluate(() => document.querySelector('.g-file-field:has(#tt-f-files) .g-file-field__remove').focus())
    await page.keyboard.press(T)
    // El orden de foco recorre las fichas y llega al campo: el tooltip del campo se abre al llegar por teclado al <input>
    for (let i = 0; i < 6; i++) {
      const on = await page.evaluate(() => document.activeElement?.matches('input#tt-f-files'))
      if (on) break
      await page.keyboard.press(T)
    }
    expect(await page.evaluate(() => document.activeElement.matches('input#tt-f-files'))).toBe(true)
    await expect.poll(() => page.evaluate(() => [...document.querySelectorAll('.g-tooltip')].filter((n) => n.matches(':popover-open')).map((n) => n.id))).toHaveLength(1)
    // La pestaña mide la caja __add, no un «Quitar»
    const m = await page.evaluate(() => {
      const root = document.getElementById('tt-f-files').closest('.g-file-field')
      const box = root.querySelector('.g-file-field__add').getBoundingClientRect()
      const n = [...document.querySelectorAll('.g-tooltip')].find((x) => x.matches(':popover-open'))
      const t = n.querySelector('.g-tooltip__tab').getBoundingClientRect()
      return { inOwn: n.previousElementSibling === root, d: ['top', 'bottom'].includes(n.dataset.side) ? Math.abs(t.width - box.width) : Math.abs(t.height - box.height) }
    })
    expect(m.inOwn).toBe(true)
    expect(m.d).toBeLessThan(0.5)
    expect(errs).toEqual([])
  })

  test('GHelper envuelto: atributos en su botón; abre con el puntero', async ({ page }) => {
    await open(page, { target: '.tt-fields' })
    const btn = '.tt-fields .g-helper__trigger'
    expect(await page.locator(btn).getAttribute('data-g-tooltip')).toBe('')
    expect(await page.locator('.tt-fields .g-helper').getAttribute('data-g-tooltip')).toBe(null)
    await hover(page, btn)
    await page.waitForTimeout(450)
    expect(await page.evaluate(() => document.querySelector('.tt-fields .g-helper').nextElementSibling.matches(':popover-open'))).toBe(true)
  })

  test('GInputGroupInput envuelto no se activa (#394); un GBtn como parte sí y la línea entre partes se conserva', async ({ page }) => {
    await open(page, { target: '.tt-fields' })
    const r = await page.evaluate(() => {
      const box = document.querySelector('#tt-f-group .g-input-group__box') || document.querySelector('.g-input-group__box:has(#tt-f-call)')
      return { marks: [...box.querySelectorAll('[data-g-tooltip]')].map((e) => e.id), nodes: box.querySelectorAll('.g-tooltip').length }
    })
    expect(r.marks).toEqual(['tt-f-call'])
    expect(r.nodes).toBe(1)
  })
})
