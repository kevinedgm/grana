// Montaje común de los specs de los niveles anidados de GDialog (dialog-levels.spec.mjs, B · pasos) y de GFormFold
// (form-fold.spec.mjs, C · pliegues), sobre los COMPONENTES REALES de dist/ en packages/vue/playground/dialog-levels.html
// (Vue de node_modules, sin red). Requiere `npm run build`. Contrato: design/contracts/dialog.md §«Niveles anidados» y
// form.md §15 (#580 a #591).
import { expect } from '@playwright/test'

export const PAGE = '/packages/vue/playground/dialog-levels.html'

/** Abre la página con parámetros (`mode=steps`, `dir=rtl`, `long=1`) y anota la consola. */
export async function load(page, qs = '') {
  const errs = []
  page.on('pageerror', (e) => errs.push(`pageerror: ${e.message}`))
  page.on('console', (m) => {
    const t = m.text()
    if (/development build of Vue|production build|Download the Vue Devtools/.test(t)) return
    if (m.type() === 'error' || (m.type() === 'warning' && /\[Vue warn\]|\[Grana/.test(t))) errs.push(`${m.type()}: ${t}`)
  })
  await page.goto(PAGE + (qs ? '?' + qs.replace(/^\?/, '') : ''))
  await page.waitForFunction(() => window.__ready === true)
  return errs
}

/** Sin transición de paso, de alto ni de pliegue en curso, con el borde superior ya fijado (D2, `is-pinned`) y sin la
 *  entrada del diálogo en marcha (D1); y unos milisegundos para el foco y la llegada. Con la máquina cargada, el cuadro de
 *  `is-pinned` y la entrada pueden llegar tarde: medir antes daría el movimiento de la apertura, no el del paso. */
export const settled = (page) => page.waitForFunction(() => {
  const d = document.getElementById('dlg')
  const moving = typeof d.getAnimations === 'function' && d.getAnimations().some((a) => a.playState === 'running')
  return d.open && d.classList.contains('is-pinned') && !moving && !d.matches('.is-forward, .is-back, .is-resizing') && !document.querySelector('.g-form-fold.is-animating')
}, null, { timeout: 8000 }).then(() => page.waitForTimeout(80))

/** Abre el diálogo con el historial dado (la aplicación pone `steps` antes de abrir) con el foco en el disparador. */
export async function openAt(page, steps) {
  await page.evaluate((s) => { window.__lv.state.steps.value = s; document.getElementById('opener').focus(); window.__lv.state.open.value = true }, steps)
  await settled(page)
  await page.waitForTimeout(200)
}

/** Lo que se mira a menudo: foco, historial, abierto. */
export const state = (page) => page.evaluate(() => {
  const a = document.activeElement
  const d = document.getElementById('dlg')
  return {
    id: a ? a.id || String(a.className).split(' ')[0] : null,
    inDlg: Boolean(a && d.contains(a) && a !== d),
    body: a === document.body,
    chrome: Boolean(a && a.matches('.g-dialog__back, .g-dialog__close, .g-dialog__trail-step')),
    steps: window.__lv.state.steps.value.slice(),
    folds: { ...window.__lv.state.folds },
    open: d.open
  }
})

/** Eventos de la aplicación desde la última llamada (step, dismiss, closed). */
export const takeEvents = (page) => page.evaluate(() => window.__lv.events.splice(0).map(([n, e]) => [n, e && { from: e.from, to: e.to, direction: e.direction, reason: e.reason, depth: e.depth, result: e.result }]))

/** Graba cuadros mientras ocurre `setup` (código en la página) durante `ms`. */
export const rec = (page, setup, sampler, ms) => page.evaluate(([setup, sampler, ms]) => new Promise((res) => {
  const fn = new Function('return (' + sampler + ')')()
  const out = [{ t: -1, ...fn() }]
  new Function(setup)()
  const t0 = performance.now()
  const step = () => { out.push({ t: performance.now() - t0, ...fn() }); if (performance.now() - t0 < ms) requestAnimationFrame(step); else res(out) }
  requestAnimationFrame(step)
}), [setup, sampler.toString(), ms])

/** Texto de las regiones vivas corteses dentro del <dialog> modal. */
export const liveInDialog = (page) => page.evaluate(() => [...document.getElementById('dlg').querySelectorAll('[aria-live]')].map((n) => [n.getAttribute('aria-live'), n.textContent.trim()]))

/** Espera la llegada (data-g-landed) y dice dónde cayó. */
export const landing = (page) => page.waitForFunction(() => {
  const el = document.querySelector('[data-g-landed]')
  return el ? { id: el.id, box: el.hasAttribute('data-g-tooltip-box'), holds: [...el.querySelectorAll('[id]')].map((n) => n.id) } : null
}, null, { timeout: 3000 }).then((h) => h.jsonValue()).catch(() => null)

/** Sin desborde horizontal en la página ni en la carcasa, el encabezado, el hilo, el cuerpo o el pie. */
export const overflowX = (page) => page.evaluate(() => {
  const d = document.getElementById('dlg')
  const out = []
  if (document.documentElement.scrollWidth > document.documentElement.clientWidth + 1) out.push('página')
  for (const el of [d, ...d.querySelectorAll('.g-dialog__header, .g-dialog__trail-list, .g-dialog__body, .g-dialog__footer, .g-form-fold__panel')]) {
    if (el.scrollWidth > el.clientWidth + 1) out.push(String(el.className).split(' ')[0] || el.tagName)
  }
  return out
})

export async function clean(errs, label) {
  expect(errs, `consola limpia (${label})`).toEqual([])
}

/** Nombres de las animaciones que empezaron dentro del <dialog> desde la última llamada (animationstart burbujea): no
 *  depende de que haya un cuadro grabado mientras corrían (con la máquina cargada, un fundido corto puede no verse). */
export const animStarts = (page) => page.evaluate(() => {
  const d = document.getElementById('dlg')
  if (!window.__anims) { window.__anims = []; d.addEventListener('animationstart', (e) => window.__anims.push(e.animationName)) }
  return window.__anims.splice(0)
})
