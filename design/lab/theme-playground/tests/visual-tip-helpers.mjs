// Ayudas comunes de los specs del modo visual del motor del tooltip (tooltip.md §«Modo visual», #433): GTabs (#434),
// GRadioGroup (#435) y el riel de GSidebar (#436), sobre el componente real del playground (packages/vue/playground).
import { expect } from '@playwright/test'

export const PAGE = '/packages/vue/playground/index.html'
export const TAB = (browserName) => (browserName === 'webkit' ? 'Alt+Tab' : 'Tab')

export async function watchConsole(page) {
  const errs = []
  page.on('pageerror', (e) => { if (!/ResizeObserver loop/.test(e.message)) errs.push(`pageerror: ${e.message}`) })
  page.on('console', (m) => {
    const t = m.text()
    if (m.type() === 'error' && !/favicon/.test(t)) errs.push(`console: ${t}`)
    else if (m.type() === 'warning' && /\[Vue warn\]/.test(t)) errs.push(`warning: ${t}`)
  })
  return errs
}

export async function open(page, target, { motion = 'no-preference', width = 1280, height = 900 } = {}) {
  await page.emulateMedia({ reducedMotion: motion })
  await page.setViewportSize({ width, height })
  await page.goto(PAGE)
  await page.waitForSelector(target)
  await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' })
  await page.evaluate(() => document.fonts.ready)
  await page.evaluate((s) => document.querySelector(s).scrollIntoView({ block: 'center' }), target)
  await page.mouse.move(2, 2)
  await frames(page)
}
export const frames = (page, n = 2) => page.evaluate((k) => new Promise((r) => { const f = () => (k-- > 0 ? requestAnimationFrame(f) : setTimeout(r, 20)); f() }), n)
export const center = async (page, sel) => { const b = await page.locator(sel).boundingBox(); return [b.x + b.width / 2, b.y + b.height / 2] }
export const hover = async (page, sel) => { const [x, y] = await center(page, sel); await page.mouse.move(x, y) }

/** Textos de las pistas abiertas en todo el documento */
export const openTexts = (page) => page.evaluate(() => [...document.querySelectorAll('.g-tooltip')].filter((n) => n.matches(':popover-open')).map((n) => n.querySelector('.g-tooltip__text').textContent))

/**
 * Geometría de la pista de un control: `ctrl` = selector del enfocable; `box` = selector de la caja visible (por defecto
 * el propio control); el nodo se busca por su texto dentro de `scope`.
 */
export const geo = async (page, { scope, ctrl, box, text }) => {
  // Tras un relevo, la geometría final llega al terminar el viaje (data-travel se retira)
  await page.waitForFunction(() => !document.querySelector('.g-tooltip[data-travel]'))
  return geoNow(page, { scope, ctrl, box, text })
}
const geoNow = (page, { scope, ctrl, box, text }) => page.evaluate(({ scope, ctrl, box, text }) => {
  const root = document.querySelector(scope)
  const c = document.querySelector(ctrl)
  const b = box ? document.querySelector(box) : c
  const n = [...root.querySelectorAll('.g-tooltip')].find((x) => x.querySelector('.g-tooltip__text').textContent === text)
  const r = (e) => { const q = e.getBoundingClientRect(); return { l: q.left, t: q.top, r: q.right, b: q.bottom, w: q.width, h: q.height } }
  return {
    c: r(b),
    n: r(n),
    tab: r(n.querySelector('.g-tooltip__tab')),
    side: n.dataset.side,
    open: n.matches(':popover-open'),
    attrs: [...n.attributes].map((a) => a.name),
    hidden: n.getAttribute('aria-hidden'),
    role: n.getAttribute('role'),
    id: n.id,
    ctrlAttrs: [...c.attributes].map((a) => a.name).filter((a) => a.startsWith('aria-') || a.startsWith('data-g-tooltip') || a === 'title').sort()
  }
}, { scope, ctrl, box, text })

/** Pestaña contra la caja visible: Δ < 1 px de ancho (arriba o abajo) o de alto (a los lados) y de borde */
export function expectTab(g, side) {
  expect(g.side).toBe(side)
  if (side === 'bottom') {
    expect(Math.abs(g.tab.w - g.c.w)).toBeLessThan(1)
    expect(Math.abs(g.tab.l - g.c.l)).toBeLessThan(1)
    expect(Math.abs(g.tab.t - g.c.b)).toBeLessThan(1)
  } else {
    expect(Math.abs(g.tab.h - g.c.h)).toBeLessThan(1)
    expect(Math.abs(g.tab.t - g.c.t)).toBeLessThan(1)
  }
}

/** Muestreo por cuadro: cuántas pistas visibles hay (opacidad > 0.01) y si alguna viaja */
export async function startSampling(page) {
  await page.evaluate(() => {
    window.__vt = []
    window.__vtStop = false
    const loop = () => {
      const vis = [...document.querySelectorAll('.g-tooltip')].filter((n) => n.matches(':popover-open') && parseFloat(getComputedStyle(n).opacity) > 0.01)
      window.__vt.push({ n: vis.length, travel: vis.some((n) => n.hasAttribute('data-travel')), texts: vis.map((n) => n.textContent) })
      if (!window.__vtStop) requestAnimationFrame(loop)
    }
    requestAnimationFrame(loop)
  })
}
export const stopSampling = (page) => page.evaluate(() => { window.__vtStop = true; return window.__vt })

/** Pulsación táctil sintética sobre un elemento (como tooltip.spec.mjs) y el clic que la sigue */
export const touch = (page, sel, type) => page.evaluate(([sel, type]) => {
  const el = document.querySelector(sel)
  const r = el.getBoundingClientRect()
  el.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, pointerType: 'touch', pointerId: 7, isPrimary: true, clientX: r.left + 5, clientY: r.top + 5 }))
}, [sel, type])
export const synthClick = (page, sel) => page.evaluate((sel) => document.querySelector(sel).dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })), sel)
