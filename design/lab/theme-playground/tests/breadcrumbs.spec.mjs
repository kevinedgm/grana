// GBreadcrumbs sobre el COMPONENTE REAL del playground (packages/vue/playground, #sec-breadcrumbs), en Chromium, Firefox y
// WebKit. Traslada design/lab/breadcrumbs/r01/verificar.mjs (A, B, C y A + B) y el § «Verificación · Playwright» de
// design/contracts/breadcrumbs.md (#490 a #503, #505): etapas por ancho en LTR y RTL sin desbordar, seis de seis niveles en
// el árbol y en el Tab, step y vuelta conservando el foco, alto Δ0, despliegue por teclado y pista, pista con el puntero
// solo en lo recortado, puertas, escalera, navigate cancelado y con modificadores, GDialog, pointer: coarse, RTL, fuentes y
// consola limpia. El movimiento va en personalidad-breadcrumbs.spec.mjs y los paneles al desplazar en panel-estable.spec.mjs.
// Un solo proceso por puerto: GRANA_PW_PORT=4215 (bruno de GBreadcrumbs).
import { test, expect } from '@playwright/test'

const PAGE = '/packages/vue/playground/index.html'
const WIDTHS = [1100, 720, 560, 480, 400, 320, 260, 240]
const STAGES = ['liquid', 'root-icon', 'shrink', 'step']
const TAB = (browserName) => (browserName === 'webkit' ? 'Alt+Tab' : 'Tab')

async function watchConsole(page) {
  const errs = []
  page.on('pageerror', (e) => { if (!/ResizeObserver loop/.test(e.message)) errs.push(`pageerror: ${e.message}`) })
  page.on('console', (m) => {
    const t = m.text()
    if (m.type() === 'error' && !/favicon/.test(t)) errs.push(`console: ${t}`)
    else if (m.type() === 'warning' && /\[Vue warn\]|\[Grana GBreadcrumbs|\[Grana GIcon/.test(t)) errs.push(`warning: ${t}`)
  })
  return errs
}
async function open(page, { motion = 'reduce', width = 1400, height = 900 } = {}) {
  await page.emulateMedia({ reducedMotion: motion })
  await page.setViewportSize({ width, height })
  await page.goto(PAGE)
  await page.waitForSelector('#bc-main.is-ready')
  await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' })
  await page.evaluate(() => document.fonts.ready)
  await page.evaluate(() => document.querySelector('#bc-box').scrollIntoView({ block: 'start' }))
  await page.mouse.move(2, 2)
  await frames(page)
}
const frames = (page, n = 2) => page.evaluate((k) => new Promise((r) => { const f = () => (k-- > 0 ? requestAnimationFrame(f) : setTimeout(r, 20)); f() }), n)
// Ancho de los contenedores de la sección (el mismo para todas las migas de la fila de anchos)
async function setW(page, w) {
  await page.evaluate((w) => { const r = document.getElementById('bc-range'); r.value = w; r.dispatchEvent(new Event('input')) }, w)
  await frames(page, 4)
}
const stageOf = (page, id) => page.evaluate((id) => document.getElementById(id).dataset.stage, id)
const geo = (page, id) => page.evaluate((id) => {
  const n = document.getElementById(id)
  const r = n.getBoundingClientRect()
  const parts = [...n.querySelectorAll(':scope > .g-breadcrumbs__list > li, :scope > .g-breadcrumbs__face > *')]
  return {
    stage: n.dataset.stage,
    h: r.height,
    over: parts.some((e) => { const b = e.getBoundingClientRect(); return b.left < r.left - 1 || b.right > r.right + 1 }),
    items: n.querySelectorAll(':scope > .g-breadcrumbs__list > li:not(.is-leaving)').length
  }
}, id)
const openTexts = (page) => page.evaluate(() => [...document.querySelectorAll('.g-tooltip')].filter((n) => n.matches(':popover-open')).map((n) => n.querySelector('.g-tooltip__text').textContent))
const center = async (page, sel) => { const b = await page.locator(sel).boundingBox(); return [b.x + b.width / 2, b.y + b.height / 2] }
const hover = async (page, sel) => { const [x, y] = await center(page, sel); await page.mouse.move(x, y) }
const LINK = (id, i) => `#${id} > .g-breadcrumbs__list > li:nth-child(${i + 1}) > .g-breadcrumbs__link`
const DOOR = (id, i) => `#${id} > .g-breadcrumbs__list > li:nth-child(${i + 1}) > .g-breadcrumbs__door`
const active = (page) => page.evaluate(() => { const a = document.activeElement; return { text: a.textContent.trim(), cls: a.className, href: a.getAttribute('href'), cur: a.getAttribute('aria-current'), exp: a.getAttribute('aria-expanded') } })

test.describe('GBreadcrumbs · etapas y árbol', () => {
  test('etapas por ancho en LTR y RTL, con y sin puertas: sin desbordar el nav, en orden y con alto Δ0', async ({ page }) => {
    const errs = await watchConsole(page)
    await open(page)
    const seen = { 'bc-main': [], 'bc-plain': [], 'bc-rtl': [] }
    for (const w of WIDTHS) {
      await setW(page, w)
      for (const id of Object.keys(seen)) {
        const g = await geo(page, id)
        expect(g.over, `${id} a ${w}px (${g.stage}) no desborda`).toBe(false)
        seen[id].push(g)
      }
    }
    for (const [id, list] of Object.entries(seen)) {
      const idx = list.map((g) => STAGES.indexOf(g.stage))
      expect(idx.every((v, i) => i === 0 || v >= idx[i - 1]), `${id}: etapas ${list.map((g) => g.stage).join(' ')}`).toBe(true)
      expect(list[0].stage, `${id} a 1100px`).toBe('liquid')
      expect(list.at(-1).stage, `${id} a 240px`).toBe('step')
      expect([...new Set(list.map((g) => g.h))], `${id}: alto de la raíz en cada etapa`).toHaveLength(1)
    }
    // Sin puertas, a 560 y 400px los seis niveles siguen en la fila
    expect(seen['bc-plain'][2]).toMatchObject({ stage: 'liquid', items: 6 })
    expect(seen['bc-plain'][4].stage).not.toBe('step')
    expect(seen['bc-plain'][4].items).toBe(6)
    // La página no desborda a ningún ancho
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true)
    expect(errs, errs.join('\n')).toEqual([])
  })

  test('seis de seis niveles en el árbol y en el Tab a 560 y 400px; nombres enteros en el árbol', async ({ page, browserName }) => {
    const errs = await watchConsole(page)
    await open(page)
    for (const w of [560, 400]) {
      await setW(page, w)
      const snap = await page.locator('#bc-plain').ariaSnapshot()
      expect(snap).toMatch(/navigation "Ruta de navegación"/)
      expect((snap.match(/- listitem/g) || []).length, snap).toBe(6)
      expect((snap.match(/- link /g) || []).length, snap).toBe(5)
      expect(snap).toContain('link "Laboratorio central"')
      // Tab de enlace en enlace: los cinco con página, el actual el último (el nivel sin página no es parada)
      await page.focus(LINK('bc-plain', 0))
      const stops = [(await active(page)).text]
      for (let k = 0; k < 4; k++) { await page.keyboard.press(TAB(browserName)); stops.push((await active(page)).text) }
      expect(stops, `Tab a ${w}px`).toEqual(['Inicio', 'Laboratorio central', 'Muestras', 'Lote 2026-0412', 'Muestra M-0007'])
      expect((await active(page)).cur).toBe('page')
    }
    expect(errs, errs.join('\n')).toEqual([])
  })

  test('step en lo estrecho y vuelta a la fila al ensanchar conservando el foco por nivel', async ({ page }) => {
    const errs = await watchConsole(page)
    await open(page)
    await setW(page, 320)
    expect(await stageOf(page, 'bc-main')).toBe('step')
    // Desde la divulgación vuelve al actual
    await page.focus('#bc-main .g-breadcrumbs__toggle')
    await setW(page, 1100)
    expect(await stageOf(page, 'bc-main')).toBe('liquid')
    expect(await active(page)).toMatchObject({ text: 'Muestra M-0007', cur: 'page' })
    // Desde un enlace de la fila pasa a «Subir» (mismo nivel) y vuelve a ese enlace
    await page.focus(LINK('bc-main', 4))
    await setW(page, 320)
    expect((await active(page)).cls).toContain('g-breadcrumbs__up')
    await setW(page, 1100)
    expect((await active(page)).text).toBe('Lote 2026-0412')
    // Desde una puerta pasa a la divulgación
    await page.focus(DOOR('bc-main', 4))
    await setW(page, 320)
    expect((await active(page)).cls).toContain('g-breadcrumbs__toggle')
    expect(errs, errs.join('\n')).toEqual([])
  })

  test('la carga de una fuente vuelve a medir sin cambiar el ancho del nav', async ({ page }) => {
    const errs = await watchConsole(page)
    await open(page)
    await setW(page, 720)
    expect(await stageOf(page, 'bc-plain')).toBe('liquid')
    const w0 = await page.evaluate(() => document.getElementById('bc-plain').getBoundingClientRect().width)
    await page.evaluate(() => { document.getElementById('bc-plain').style.fontSize = '2.5em' })
    await frames(page, 4)
    expect(await page.evaluate(() => document.getElementById('bc-plain').getBoundingClientRect().width)).toBe(w0)
    expect(await stageOf(page, 'bc-plain'), 'sin aviso de fuentes, la etapa no cambia').toBe('liquid')
    await page.evaluate(() => document.fonts.dispatchEvent(new Event('loadingdone')))
    await frames(page, 4)
    expect(await stageOf(page, 'bc-plain'), 'loadingdone vuelve a medir').toBe('step')
    expect(errs, errs.join('\n')).toEqual([])
  })
})

test.describe('GBreadcrumbs · despliegue y pistas (#496)', () => {
  test('el foco por teclado despliega la pastilla; la pista solo si ni desplegada cabe; al irse el foco se pliega', async ({ page, browserName }) => {
    const errs = await watchConsole(page)
    await open(page, { motion: 'no-preference' })
    await setW(page, 560)
    const lab = LINK('bc-plain', 1)
    expect(await page.evaluate((s) => document.querySelector(s).closest('li').hasAttribute('data-clipped'), lab), 'a 560px «Laboratorio central» es pastilla').toBe(true)
    await page.focus(LINK('bc-plain', 0))
    await page.keyboard.press(TAB(browserName))
    await frames(page, 3)
    const u = await page.evaluate((s) => {
      const a = document.querySelector(s)
      const l = a.querySelector('.g-breadcrumbs__label')
      return { focused: document.activeElement === a, fv: a.matches(':focus-visible'), seen: l.clientWidth / l.scrollWidth, cut: l.scrollWidth > l.clientWidth + 1, max: getComputedStyle(l).maxInlineSize, ring: getComputedStyle(a).outlineStyle }
    }, lab)
    expect(u.focused && u.fv).toBe(true)
    expect(u.max).toBe('none')
    expect(u.ring).toBe('solid')
    expect(u.seen, 'se ve entero o casi').toBeGreaterThan(0.9)
    await page.waitForTimeout(120)
    const tips = await openTexts(page)
    if (u.cut) expect(tips).toEqual(['Laboratorio central'])
    else expect(tips).toEqual([])
    expect((await geo(page, 'bc-plain')).over, 'desplegar no desborda').toBe(false)
    await page.keyboard.press(TAB(browserName))
    await frames(page, 3)
    expect(await page.evaluate((s) => getComputedStyle(document.querySelector(s).querySelector('.g-breadcrumbs__label')).maxInlineSize, lab), 'se pliega al irse el foco').not.toBe('none')
    expect(errs, errs.join('\n')).toEqual([])
  })

  test('con el puntero: pista a los 350 ms solo en lo recortado y en la raíz en solo icono; nunca en lo que cabe', async ({ page }) => {
    const errs = await watchConsole(page)
    await open(page, { motion: 'no-preference' })
    await setW(page, 560)
    await hover(page, LINK('bc-plain', 1))
    await page.waitForTimeout(200)
    expect(await openTexts(page)).toEqual([])
    await page.waitForTimeout(300)
    expect(await openTexts(page)).toEqual(['Laboratorio central'])
    const n = await page.evaluate(() => { const t = [...document.querySelectorAll('#bc-plain > .g-tooltip')].find((x) => x.matches(':popover-open')); return { hidden: t.getAttribute('aria-hidden'), role: t.getAttribute('role'), id: t.id, side: t.dataset.side } })
    expect(n).toEqual({ hidden: 'true', role: null, id: '', side: 'bottom' })
    // El actual cabe: nada
    await page.mouse.move(2, 2)
    await page.waitForTimeout(800)
    await hover(page, LINK('bc-plain', 5))
    await page.waitForTimeout(500)
    expect(await openTexts(page)).toEqual([])
    // La raíz en solo icono
    await page.mouse.move(2, 2)
    await setW(page, 400)
    expect(['root-icon', 'shrink']).toContain(await stageOf(page, 'bc-plain'))
    await page.waitForTimeout(800)
    await hover(page, LINK('bc-plain', 0))
    await page.waitForTimeout(500)
    expect(await openTexts(page)).toEqual(['Inicio'])
    expect(errs, errs.join('\n')).toEqual([])
  })

  test('la puerta tiene pista siempre (su nombre) y se cierra al abrir el panel', async ({ page }) => {
    const errs = await watchConsole(page)
    await open(page, { motion: 'no-preference' })
    await hover(page, DOOR('bc-main', 4))
    await page.waitForTimeout(500)
    expect(await openTexts(page)).toEqual(['Otras páginas en 2026'])
    await page.focus(DOOR('bc-main', 4))
    await page.keyboard.press('Enter')
    await frames(page)
    expect(await openTexts(page)).toEqual([])
    expect(errs, errs.join('\n')).toEqual([])
  })
})

test.describe('GBreadcrumbs · puertas y escalera', () => {
  test('puerta: ↓ al hijo de la ruta, ↑/↓ circulares, Inicio/Fin, Esc vuelve; Tab sale y cierra', async ({ page, browserName }) => {
    const errs = await watchConsole(page)
    await open(page)
    const door = DOOR('bc-main', 4)
    const exp = () => page.getAttribute(door, 'aria-expanded')
    await page.focus(door)
    await page.keyboard.press('ArrowDown')
    expect(await exp()).toBe('true')
    expect(await active(page)).toMatchObject({ text: 'Lote 2026-0412', cur: 'true' })
    await page.keyboard.press('ArrowDown')
    expect((await active(page)).text).toBe('Lote 2026-0413')
    await page.keyboard.press('ArrowDown')
    expect((await active(page)).text, 'circular (el hijo sin página no es parada)').toBe('Lote 2026-0411')
    await page.keyboard.press('ArrowUp')
    expect((await active(page)).text).toBe('Lote 2026-0413')
    await page.keyboard.press('Home')
    expect((await active(page)).text).toBe('Lote 2026-0411')
    await page.keyboard.press('End')
    expect((await active(page)).text).toBe('Lote 2026-0413')
    await page.keyboard.press('Escape')
    expect(await exp()).toBe('false')
    expect(await page.evaluate((s) => document.activeElement === document.querySelector(s), door)).toBe(true)
    // Intro abre sin mover el foco; Tab entra en el panel (orden del documento) y al salir lo cierra
    await page.keyboard.press('Enter')
    expect(await exp()).toBe('true')
    expect(await page.evaluate((s) => document.activeElement === document.querySelector(s), door)).toBe(true)
    for (let k = 0; k < 3; k++) await page.keyboard.press(TAB(browserName))
    expect(await page.evaluate(() => Boolean(document.activeElement.closest('.g-breadcrumbs__panel')))).toBe(true)
    await page.keyboard.press(TAB(browserName))
    expect((await active(page)).text, 'después del panel, el enlace del nivel').toBe('Lote 2026-0412')
    expect(await exp()).toBe('false')
    expect(errs, errs.join('\n')).toEqual([])
  })

  test('puerta: clic abre sin mover el foco al panel; pulsar fuera cierra; una abierta a la vez; aspecto abierto', async ({ page }) => {
    const errs = await watchConsole(page)
    await open(page)
    const d1 = DOOR('bc-main', 2)
    const d2 = DOOR('bc-main', 4)
    await page.click(d2)
    await frames(page)
    expect(await page.getAttribute(d2, 'aria-expanded')).toBe('true')
    expect(await page.evaluate(() => Boolean(document.activeElement.closest('.g-breadcrumbs__panel')))).toBe(false)
    const panel = await page.evaluate((s) => {
      const d = document.querySelector(s)
      const p = document.getElementById(d.getAttribute('aria-controls'))
      const a = d.getBoundingClientRect(); const r = p.getBoundingClientRect()
      return { open: p.matches(':popover-open'), below: r.top >= a.bottom - 1, side: p.dataset.side, x: p.style.getPropertyValue('--_x'), max: p.style.getPropertyValue('--_max'), links: p.querySelectorAll('a').length }
    }, d2)
    expect(panel).toMatchObject({ open: true, below: true, side: 'bottom', links: 3 })
    expect(panel.x).toMatch(/px$/)
    expect(panel.max).toMatch(/px$/)
    await page.click(d1)
    await frames(page)
    expect(await page.getAttribute(d2, 'aria-expanded')).toBe('false')
    expect(await page.getAttribute(d1, 'aria-expanded')).toBe('true')
    await page.click('#bc-log', { position: { x: 2, y: 2 }, force: true })
    await frames(page)
    expect(await page.getAttribute(d1, 'aria-expanded')).toBe('false')
    expect(errs, errs.join('\n')).toEqual([])
  })

  test('escalera: ↓ al primer escalón, el actual con aria-current, sangría hacia el inicio lógico (LTR y RTL); Esc vuelve', async ({ page }) => {
    const errs = await watchConsole(page)
    await open(page)
    await setW(page, 320)
    const t = '#bc-main .g-breadcrumbs__toggle'
    await page.focus(t)
    await page.keyboard.press('ArrowDown')
    expect(await page.getAttribute(t, 'aria-expanded')).toBe('true')
    expect((await active(page)).text).toBe('Inicio')
    const st = await page.evaluate(() => {
      const s = [...document.querySelectorAll('#bc-main .g-breadcrumbs__stair')]
      return { n: s.length, cur: s.at(-1).querySelector('[aria-current="page"]')?.textContent.trim(), x: s.map((x) => x.querySelector('.g-breadcrumbs__link').getBoundingClientRect().left) }
    })
    expect(st.n).toBe(6)
    expect(st.cur).toBe('Muestra M-0007')
    expect(st.x.every((v, i) => i === 0 || v > st.x[i - 1]), st.x.join(',')).toBe(true)
    await page.keyboard.press('ArrowDown')
    expect((await active(page)).text).toBe('Laboratorio central')
    await page.keyboard.press('Escape')
    expect(await page.evaluate((s) => document.activeElement === document.querySelector(s), t)).toBe(true)
    expect(await page.getAttribute(t, 'aria-expanded')).toBe('false')
    // RTL
    await page.click('#bc-rtl .g-breadcrumbs__toggle')
    await frames(page)
    const xr = await page.evaluate(() => [...document.querySelectorAll('#bc-rtl .g-breadcrumbs__stair .g-breadcrumbs__link')].map((a) => a.getBoundingClientRect().right))
    expect(xr.every((v, i) => i === 0 || v < xr[i - 1]), xr.join(',')).toBe(true)
    expect(errs, errs.join('\n')).toEqual([])
  })

  test('panel en la capa superior dentro de una cabecera con overflow: hidden', async ({ page }) => {
    const errs = await watchConsole(page)
    await open(page)
    await page.evaluate(() => document.getElementById('bc-header').scrollIntoView({ block: 'center' }))
    const d = DOOR('bc-head', 4)
    await page.click(d)
    await frames(page)
    const top = await page.evaluate((s) => {
      const p = document.getElementById(document.querySelector(s).getAttribute('aria-controls'))
      const r = p.getBoundingClientRect()
      const hit = document.elementFromPoint(r.left + r.width / 2, r.bottom - 6)
      return { inPanel: p.contains(hit), below: r.bottom > document.getElementById('bc-header').getBoundingClientRect().bottom }
    }, d)
    expect(top).toEqual({ inPanel: true, below: true })
    expect(errs, errs.join('\n')).toEqual([])
  })
})

test.describe('GBreadcrumbs · navigate, diálogo, táctil y RTL', () => {
  test('navigate cancelado sin cambio de URL; con Ctrl, ⌘, Mayús o Alt no hay evento (#505)', async ({ page }) => {
    const errs = await watchConsole(page)
    await open(page)
    const url = page.url()
    await page.click(LINK('bc-plain', 2))
    expect(await page.textContent('#bc-log')).toBe('navigate · path · Muestras (índice 2) · cancelado')
    expect(page.url()).toBe(url)
    // Los gestos con modificador son del navegador: aquí se evita la pestaña nueva DESPUÉS de comprobar que no hay evento
    await page.evaluate(() => { document.getElementById('bc-log').textContent = '' ; window.addEventListener('click', (e) => { if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) e.preventDefault() }) })
    for (const mod of ['Control', 'Meta', 'Shift', 'Alt']) await page.click(LINK('bc-plain', 1), { modifiers: [mod] })
    await page.click(LINK('bc-plain', 1), { button: 'middle' })
    expect(await page.textContent('#bc-log')).toBe('')
    // Desde una puerta: from door, el hijo y el índice del nivel delante del cual está; el foco vuelve a la puerta. (El clic
    // central lo resuelve el navegador por su cuenta: WebKit puede seguir el enlace en la misma página; no es del componente)
    const url2 = page.url()
    await page.click(DOOR('bc-main', 4))
    await page.click('#bc-main a[href="#lote-0413"]')
    expect(await page.textContent('#bc-log')).toBe('navigate · door · Lote 2026-0413 (índice 4) · cancelado')
    expect(await page.evaluate((s) => document.activeElement === document.querySelector(s), DOOR('bc-main', 4))).toBe(true)
    expect(page.url()).toBe(url2)
    expect(errs, errs.join('\n')).toEqual([])
  })

  test('dentro de un GDialog, Esc cierra el panel y no el diálogo; el segundo Esc cierra el diálogo', async ({ page }) => {
    const errs = await watchConsole(page)
    await open(page)
    await page.click('#bc-dlg-open')
    await page.waitForSelector('dialog[open] #bc-dlg.is-ready')
    const d = DOOR('bc-dlg', 4)
    await page.focus(d)
    await page.keyboard.press('ArrowDown')
    expect(await page.getAttribute(d, 'aria-expanded')).toBe('true')
    await page.keyboard.press('Escape')
    await frames(page)
    expect(await page.getAttribute(d, 'aria-expanded')).toBe('false')
    expect(await page.evaluate(() => Boolean(document.querySelector('dialog[open] #bc-dlg'))), 'el diálogo sigue abierto').toBe(true)
    await page.keyboard.press('Escape')
    await page.waitForFunction(() => !document.querySelector('dialog[open] #bc-dlg'))
    expect(errs, errs.join('\n')).toEqual([])
  })

  test('RTL: separador espejado (scale -1 1), la raíz a la derecha y la puerta abierta a −90°', async ({ page }) => {
    const errs = await watchConsole(page)
    await open(page, { motion: 'no-preference' })
    const r = await page.evaluate(() => {
      const n = document.getElementById('bc-rtl')
      const lis = [...n.querySelectorAll(':scope > .g-breadcrumbs__list > li')]
      return { scale: getComputedStyle(n.querySelector('.g-breadcrumbs__sep')).scale, rootRight: lis[0].getBoundingClientRect().right > lis.at(-1).getBoundingClientRect().right }
    })
    expect(r.scale).toMatch(/^-1( 1)?$/)
    expect(r.rootRight).toBe(true)
    const d = DOOR('bc-rtl', 4)
    await page.click(d)
    await page.waitForTimeout(400)
    expect(await page.evaluate((s) => getComputedStyle(document.querySelector(s).querySelector('.g-icon')).rotate, d)).toBe('-90deg')
    expect(errs, errs.join('\n')).toEqual([])
  })
})

test.describe('GBreadcrumbs · pointer: coarse', () => {
  test('a 390px, todo destino ≥ 44 × 44, alto 44 y sin desbordar', async ({ browser, browserName }) => {
    const ctx = await browser.newContext(browserName === 'chromium' ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } : { viewport: { width: 390, height: 844 }, hasTouch: true })
    const page = await ctx.newPage()
    const errs = await watchConsole(page)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(PAGE)
    await page.waitForSelector('#bc-main.is-ready')
    await page.evaluate(() => document.fonts.ready)
    const coarse = await page.evaluate(() => matchMedia('(pointer: coarse)').matches)
    test.skip(!coarse, `${browserName} no emula pointer: coarse`)
    await page.evaluate(() => { const r = document.getElementById('bc-range'); r.value = 358; r.dispatchEvent(new Event('input')) })
    await frames(page, 4)
    for (const id of ['bc-main', 'bc-plain', 'bc-rtl', 'bc-spa']) {
      const m = await page.evaluate((id) => {
        const n = document.getElementById(id)
        const t = [...n.querySelectorAll(':scope > .g-breadcrumbs__list > li > a.g-breadcrumbs__link, :scope > .g-breadcrumbs__list > li > .g-breadcrumbs__door, :scope > .g-breadcrumbs__face > *')]
        return { h: n.getBoundingClientRect().height, small: t.map((e) => e.getBoundingClientRect()).filter((r) => r.width < 44 || r.height < 44).map((r) => `${Math.round(r.width)}×${Math.round(r.height)}`), n: t.length }
      }, id)
      expect(m.n, id).toBeGreaterThan(0)
      expect(m.small, `${id}: destinos < 44`).toEqual([])
      expect(m.h, id).toBe(44)
      expect((await geo(page, id)).over, id).toBe(false)
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true)
    // Los enlaces de la escalera también
    await page.click('#bc-main .g-breadcrumbs__toggle')
    await frames(page)
    const st = await page.evaluate(() => [...document.querySelectorAll('#bc-main .g-breadcrumbs__stair .g-breadcrumbs__link')].map((a) => a.getBoundingClientRect().height))
    expect(st.every((h) => h >= 44), st.join(',')).toBe(true)
    expect(errs, errs.join('\n')).toEqual([])
    await ctx.close()
  })
})
