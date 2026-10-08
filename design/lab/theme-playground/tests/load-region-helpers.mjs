// Ayudas comunes de los specs de carga (GLoadRegion, GEmpty y la carga de GTable) sobre el COMPONENTE REAL del playground
// (packages/vue/playground, #sec-load-region; su propia aplicación de Vue con window.lr, window.lrCtl, window.lrLive).
// Base: design/lab/empty-skeleton/r01/verificar.mjs (kiwi) y los puntos de navegador de load-region.md, empty.md y
// table.md «Verificación» (DECISIONS.md #529 a #549).
import { expect } from '@playwright/test'
import { PAGE, watchConsole, frames } from './visual-tip-helpers.mjs'

export { watchConsole, frames }

/** Abre el playground sin la carga automática de la sección (`?lrmanual`) y deja a mano las ayudas de color y de traza. */
export async function openLR(page, { motion = 'no-preference', width = 1280, height = 900, scheme = 'light', target = '#lr-list', query = '' } = {}) {
  await page.emulateMedia({ reducedMotion: motion, colorScheme: scheme })
  await page.setViewportSize({ width, height })
  await page.goto(`${PAGE}?lrmanual=1${query}`)
  await page.waitForSelector('#lr-list', { state: 'attached' })
  await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' })
  await page.evaluate(() => document.fonts.ready)
  await page.evaluate(installHelpers)
  await page.evaluate((s) => document.querySelector(s).scrollIntoView({ block: 'start' }), target)
  await page.mouse.move(2, 2)
  await frames(page)
}

function installHelpers() {
  window.__rgb = (c) => {
    const m = /^color\(srgb ([\d.]+) ([\d.]+) ([\d.]+)(?: \/ ([\d.]+))?/.exec(c)
    if (m) return [m[1] * 255, m[2] * 255, m[3] * 255, m[4] === undefined ? 1 : Number(m[4])]
    const cv = document.createElement('canvas'); cv.width = cv.height = 1
    const x = cv.getContext('2d'); x.fillStyle = '#000'; x.fillStyle = c; x.fillRect(0, 0, 1, 1)
    const d = x.getImageData(0, 0, 1, 1).data
    return [d[0], d[1], d[2], d[3] / 255]
  }
  window.__lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) }
  window.__bgOf = (el) => { for (let a = el; a; a = a.parentElement) { const c = __rgb(getComputedStyle(a).backgroundColor); if (c[3] > 0.95) return c } return __rgb(getComputedStyle(document.body).backgroundColor) }
  window.__ratio = (fg, bg) => { const a = __lum(fg), b = __lum(bg); return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) }
  window.__contrast = (el, prop = 'color') => __ratio(__rgb(getComputedStyle(el)[prop]), __bgOf(el))
  // Traza de clases de una raíz: { t, cls } por cada cambio, con t relativo al inicio de la traza
  window.__trace = (sel, attr = 'class') => {
    const el = document.querySelector(sel)
    const t0 = performance.now()
    const out = [{ t: 0, v: el.getAttribute(attr) }]
    const mo = new MutationObserver(() => { const v = el.getAttribute(attr); if (v !== out[out.length - 1].v) out.push({ t: Math.round(performance.now() - t0), v }) })
    mo.observe(el, { attributes: true, attributeFilter: [attr] })
    window.__traces = window.__traces || {}
    window.__traces[sel + '|' + attr] = { out, stop: () => mo.disconnect() }
    return true
  }
}

/** Traza de las clases de la raíz de `sel`; devuelve una función que la detiene y la devuelve. */
export async function trace(page, sel, attr = 'class') {
  await page.evaluate(([s, a]) => window.__trace(s, a), [sel, attr])
  return () => page.evaluate(([s, a]) => { const tr = window.__traces[s + '|' + a]; tr.stop(); return tr.out }, [sel, attr])
}

/** Espera a que la región esté en reposo (aria-busy="false" y sin revelado en curso). */
// (y deja pasar el ciclo del canal de página: el anuncio de fin se escribe 50 ms después de la llegada)
export async function idle(page, sel = '#lr-list', timeout = 15000) {
  await page.waitForFunction((s) => { const r = document.querySelector(s); return r && r.getAttribute('aria-busy') === 'false' && !r.classList.contains('is-mold') }, sel, { timeout })
  await page.waitForTimeout(120)
}

/** Lanza la primera carga de toda la sección con la latencia y el resultado dados. */
export async function loadAll(page, lat = 900, out = 'data') {
  await page.evaluate(([lat, out]) => { window.lrCtl.setLatency(lat); window.lrCtl.setOutcome(out); window.lrLive.length = 0; window.lrCtl.loadAll() }, [lat, out])
}
export async function refreshList(page, lat = 900, out = null) {
  await page.evaluate(([lat, out]) => { window.lrCtl.setLatency(lat); if (out) window.lrCtl.setOutcome(out); window.lrLive.length = 0; window.lrCtl.loadList() }, [lat, out])
}
export const live = (page) => page.evaluate(() => window.lrLive.map((x) => x.text))
export const top = (page, sel) => page.evaluate((s) => document.querySelector(s).getBoundingClientRect().top + scrollY, sel)
/** Animaciones en curso dentro de un elemento (o de todo el documento) */
export const running = (page, sel) => page.evaluate((s) => document.getAnimations().filter((a) => a.playState === 'running' && (!s || document.querySelector(s).contains(a.effect && a.effect.target))).map((a) => a.animationName || a.transitionProperty || 'x'), sel)

/** Área táctil de los GBtn visibles de un contenedor (el ::after centrado de GBtn) y si alguna se solapa con otra */
export const btnAreas = (page, sel) => page.evaluate((s) => {
  const list = [...document.querySelectorAll(`${s} .g-btn`)].filter((b) => b.offsetParent).map((b) => {
    const r = b.getBoundingClientRect()
    const cs = getComputedStyle(b, '::after')
    const w = Math.max(r.width, parseFloat(cs.width) || 0)
    const h = Math.max(r.height, parseFloat(cs.height) || 0)
    const cx = r.left + r.width / 2
    const cy = r.top + r.height / 2
    return { text: b.textContent.trim(), w, h, box: [cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2] }
  })
  const overlap = []
  for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
    const a = list[i].box, b = list[j].box
    const ix = Math.min(a[2], b[2]) - Math.max(a[0], b[0])
    const iy = Math.min(a[3], b[3]) - Math.max(a[1], b[1])
    if (ix > 0.5 && iy > 0.5) overlap.push(`${list[i].text} × ${list[j].text}`)
  }
  return { list, overlap }
}, sel)

export function expectClean(errs) {
  expect(errs, errs.join('\n')).toEqual([])
}
