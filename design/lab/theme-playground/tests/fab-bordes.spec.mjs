// GFab · convivencia (design/contracts/fab.md «Bordes compartidos», «Modal» y «Verificación · Playwright»; DECISIONS.md
// #659; hallazgo H3 de design/lab/fab/auditoria.md): lo que tests/fab.spec.mjs no cubre, sobre los COMPONENTES REALES en el
// banco ligero packages/vue/playground/fab.html (GFab de dist/fab.umd.js; GToaster y GDialog de dist/grana.umd.js;
// GStatusIsland de dist/status.umd.js; GPageHeader de dist/page-header.umd.js; GSpeechHost de dist/speech.umd.js con el
// adaptador simulado de dist/testing.umd.js), en Chromium, Firefox y WebKit:
//   · un solo registro de bordes (edgeReserve llega a cada entrada por __shared) con EDGE_ORDER.fab = 25 y la isla,
//     transitoria, detrás del FAB (EDGE_ORDER.status = 30, #699);
//   · abajo, en estrecho, desde el borde: pill de la voz → muelle de GPageHeader → FAB → aviso, sin solaparse; la pila
//     abierta no baja al muelle ni a la voz;
//   · arriba: zócalo pegado de GPageHeader → FAB → isla de estado → aviso, sin solaparse; un FAB de arriba no se mueve al
//     caer la isla; la pila abierta no sube a ellos;
//   · un GDialog modal cierra la lista sin tocar el foco; el FAB no se traslada al modal, queda bajo el fondo (el toque no
//     le llega), no cambia su reserva y no se abre mientras el modal esté; al cerrarlo vuelve a abrir;
//   · dentro de la zona de marca y en oscuro: la pila, el panel de la cola y C heredan el tema de su sitio y conservan los
//     mínimos (texto ≥ 4,5:1, el FAB frente a la página ≥ 3:1).
// Un solo proceso por puerto: GRANA_PW_PORT=4212 npx playwright test tests/fab-bordes.spec.mjs
import { test, expect } from '@playwright/test'

test.setTimeout(90_000)

const PAGE = '/packages/vue/playground/fab.html'

function watchConsole(page) {
  const errs = []
  page.on('pageerror', (e) => { if (!/ResizeObserver loop/.test(e.message)) errs.push(`pageerror: ${e.message}`) })
  page.on('console', (m) => {
    const t = m.text()
    if (m.type() === 'error' && !/favicon|Failed to load resource/.test(t)) errs.push(`console: ${t}`)
    else if (m.type() === 'warning' && /\[Grana|\[Vue warn\]/.test(t)) errs.push(`warning: ${t}`)
  })
  return errs
}
async function load(page, qs, { width = 1280, height = 900 } = {}) {
  await page.setViewportSize({ width, height })
  await page.goto(`${PAGE}?${qs}`)
  await page.waitForFunction(() => window.__ready && document.getElementById('fab'))
  await page.evaluate(() => document.fonts.ready)
}
const settle = (p, ms = 400) => p.evaluate((ms) => new Promise((r) => requestAnimationFrame(() => setTimeout(r, ms))), ms)
const boxes = (page, sels) => page.evaluate((sels) => Object.fromEntries(Object.entries(sels).map(([k, s]) => {
  const e = document.querySelector(s)
  if (!e || !e.getClientRects().length) return [k, null]
  const b = e.getBoundingClientRect()
  return [k, { top: b.top, bottom: b.bottom, left: b.left, right: b.right, height: b.height }]
})), sels)
const hit = (a, b) => a.left < b.right - 0.5 && a.right > b.left + 0.5 && a.top < b.bottom - 0.5 && a.bottom > b.top + 0.5
const openFab = async (page) => {
  await page.click('#fab-trigger')
  await page.waitForFunction(() => document.getElementById('fab').dataset.state === 'open')
  await settle(page, 300)
}

test('un solo registro de bordes para todas las entradas, con el orden del contrato', async ({ page }) => {
  await load(page, 'n=6')
  const order = await page.evaluate(() => ({ ...Grana.__shared['utils/edgeReserve.js'].EDGE_ORDER }))
  expect(order).toEqual({ appShell: 5, speech: 10, pageHeader: 15, bookingDock: 20, fab: 25, status: 30 }) // #714: el chasis, lo más cercano al borde; #740: el muelle de GBookingBar
  // fab.umd.js toma edgeReserve de Grana.__shared: una reserva publicada en el registro del principal mueve al FAB (lee lo
  // que va antes que él, 10 < 25) y una de después (30) no; con una copia del módulo no se movería con ninguna
  const r = await page.evaluate(async () => {
    const E = Grana.__shared['utils/edgeReserve.js']
    const y = () => document.getElementById('fab-trigger').getBoundingClientRect().bottom
    const tick = () => new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(res)))
    const y0 = y()
    const before = {}, after = {}
    E.setEdgeReserve(before, 'bottom', 100, { order: 10 })
    await tick()
    const y1 = y()
    E.setEdgeReserve(after, 'bottom', 100, { order: 30 })
    await tick()
    const y2 = y()
    E.clearEdgeReserve(before)
    E.clearEdgeReserve(after)
    await tick()
    return { d1: y0 - y1, d2: y1 - y2, back: y() - y0 }
  })
  expect(r.d1).toBeCloseTo(100, 0)
  expect(r.d2).toBeCloseTo(0, 0)
  expect(r.back).toBeCloseTo(0, 0)
})

test('abajo, en estrecho: voz → muelle de GPageHeader → FAB → aviso, sin solaparse; la pila abierta no baja a ellos', async ({ page }) => {
  const errs = watchConsole(page)
  await load(page, 'n=6&ph=1&speech=1&toast=1', { width: 390, height: 760 })
  await page.evaluate(() => window.__b.speech.start({ mode: 'conversation' }))
  await page.waitForFunction(() => /listening|speech|transcribing/.test(window.__b.speech.state.status), null, { timeout: 20_000 })
  await page.evaluate(() => window.scrollTo(0, 900))
  await settle(page, 800)
  const b = await boxes(page, { pill: '.g-speech-host__float', dock: '#ph .g-page-header__dock', fab: '#fab-trigger', toast: '.g-toast' })
  for (const k of Object.keys(b)) expect(b[k], `${k} en pantalla`).not.toBeNull()
  const msg = `voz ${b.pill.top}–${b.pill.bottom} · muelle ${b.dock.top}–${b.dock.bottom} · FAB ${b.fab.top}–${b.fab.bottom} · aviso ${b.toast.top}–${b.toast.bottom}`
  expect(b.pill.top, msg).toBeGreaterThanOrEqual(b.dock.bottom - 0.5)
  expect(b.dock.top, msg).toBeGreaterThanOrEqual(b.fab.bottom - 0.5)
  expect(b.fab.top, msg).toBeGreaterThanOrEqual(b.toast.bottom - 0.5)
  expect(b.pill.bottom).toBeLessThanOrEqual(760)
  const all = Object.values(b)
  for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) expect(hit(all[i], all[j]), msg).toBe(false)
  // Abierto, la reserva no cambia (los avisos no se mueven bajo el dedo) y la pila sube sin tocar el muelle ni la voz
  const reserve = await page.evaluate(() => document.getElementById('fab').style.getPropertyValue('--_reserve'))
  await openFab(page)
  const o = await boxes(page, { list: '#fab-menu', dock: '#ph .g-page-header__dock', pill: '.g-speech-host__float', toast: '.g-toast', fab: '#fab-trigger' })
  expect(await page.evaluate(() => document.getElementById('fab').style.getPropertyValue('--_reserve'))).toBe(reserve)
  expect(Math.abs(o.toast.top - b.toast.top), 'el aviso no se mueve al abrir').toBeLessThan(0.5)
  expect(o.list.bottom).toBeLessThanOrEqual(o.fab.top + 0.5)
  expect(o.list.top).toBeGreaterThanOrEqual(0)
  expect(hit(o.list, o.dock)).toBe(false)
  expect(hit(o.list, o.pill)).toBe(false)
  await page.keyboard.press('Escape')
  await page.evaluate(() => window.__b.speech.abort?.())
  expect(errs).toEqual([])
})

test('arriba: zócalo pegado → FAB → isla → aviso, sin solaparse; el FAB no se mueve al caer la isla; la pila abierta baja sin tocarlos', async ({ page }) => {
  const errs = watchConsole(page)
  await load(page, 'n=6&ph=1&toast=1&toastpos=top-end&pos=top-end', { width: 1000, height: 700 })
  await page.evaluate(() => window.scrollTo(0, 700))
  await settle(page, 800)
  expect(await page.evaluate(() => document.getElementById('ph').classList.contains('is-stuck'))).toBe(true)
  const before = await boxes(page, { fab: '#fab-trigger' })
  // La isla es transitoria (#699): cae detrás del FAB, que conserva su borde
  await page.evaluate(() => window.__b.status.info('maint', 'Mantenimiento programado esta noche', { description: 'De 23:00 a 23:30 no se podrá guardar.' }))
  await settle(page, 800)
  const b = await boxes(page, { ph: '#ph', island: '.g-status-island__shape', fab: '#fab-trigger', toast: '.g-toast' })
  for (const k of Object.keys(b)) expect(b[k], `${k} en pantalla`).not.toBeNull()
  expect(Math.abs(b.fab.top - before.fab.top), 'el FAB no baja al caer la isla').toBeLessThan(0.5)
  const msg = `zócalo …–${b.ph.bottom} · FAB ${b.fab.top}–${b.fab.bottom} · isla ${b.island.top}–${b.island.bottom} · aviso ${b.toast.top}–${b.toast.bottom}`
  expect(b.island.height, msg).toBeGreaterThan(0)
  expect(b.fab.top, msg).toBeGreaterThanOrEqual(b.ph.bottom - 0.5)
  expect(b.island.top, msg).toBeGreaterThanOrEqual(b.fab.bottom - 0.5)
  expect(b.toast.top, msg).toBeGreaterThanOrEqual(b.island.bottom - 0.5)
  const all = [{ ...b.ph, top: Math.max(0, b.ph.top) }, b.island, b.fab, b.toast]
  for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) expect(hit(all[i], all[j]), msg).toBe(false)
  await openFab(page)
  const o = await boxes(page, { list: '#fab-menu', fab: '#fab-trigger', island: '.g-status-island__shape', ph: '#ph' })
  expect(o.list.top).toBeGreaterThanOrEqual(o.fab.bottom - 0.5)
  expect(o.list.bottom).toBeLessThanOrEqual(700)
  expect(hit(o.list, o.island)).toBe(false)
  expect(hit(o.list, { ...o.ph, top: Math.max(0, o.ph.top) })).toBe(false)
  expect(errs).toEqual([])
})

test('un GDialog modal cierra la lista sin tocar el foco; el FAB no va al modal, queda bajo el fondo y no se abre; al cerrarlo vuelve', async ({ page }) => {
  const errs = watchConsole(page)
  await load(page, 'n=6')
  await openFab(page)
  const reserve = await page.evaluate(() => document.getElementById('fab').style.getPropertyValue('--_reserve'))
  await page.evaluate(() => { window.__b.st.dialog = true })
  await page.waitForFunction(() => document.querySelector('dialog[open]'))
  await settle(page, 400)
  const r = await page.evaluate(() => {
    const fab = document.getElementById('fab')
    const t = document.getElementById('fab-trigger').getBoundingClientRect()
    const at = document.elementFromPoint(t.left + t.width / 2, t.top + t.height / 2)
    return {
      state: fab.dataset.state,
      list: document.getElementById('fab-menu').matches(':popover-open'),
      focusInDialog: !!document.activeElement.closest('dialog[open]'),
      inDialog: !!fab.closest('dialog'),
      underBackdrop: !at || !at.closest('.g-fab'),
      reserve: fab.style.getPropertyValue('--_reserve')
    }
  })
  expect(r.state).toBe('closed')
  expect(r.list).toBe(false)
  expect(r.focusInDialog, 'el foco lo toma el diálogo, no el FAB').toBe(true)
  expect(r.inDialog, 'el FAB no se traslada al modal').toBe(false)
  expect(r.underBackdrop, 'el toque en el FAB no le llega').toBe(true)
  expect(r.reserve).toBe(reserve)
  // Abrirlo por v-model con el modal encima tampoco lo abre
  await page.evaluate(() => { window.__b.st.open = true })
  await settle(page, 200)
  expect(await page.evaluate(() => document.getElementById('fab').dataset.state)).toBe('closed')
  await page.evaluate(() => { window.__b.st.open = false })
  await page.keyboard.press('Escape')
  await page.waitForFunction(() => !document.querySelector('dialog[open]'))
  await settle(page, 300)
  await openFab(page)
  expect(await page.evaluate(() => document.getElementById('fab').dataset.state)).toBe('open')
  expect(errs).toEqual([])
})

// Contraste en la página con el tema de su sitio: lienzo para normalizar cualquier color CSS, luminancia WCAG
function contrastHelpers() {
  const c = document.createElement('canvas')
  c.width = c.height = 1
  const x = c.getContext('2d', { willReadFrequently: true })
  const rgba = (v) => { x.clearRect(0, 0, 1, 1); x.fillStyle = '#000'; x.fillStyle = v; x.fillRect(0, 0, 1, 1); return [...x.getImageData(0, 0, 1, 1).data] }
  const over = (f, b) => { const a = f[3] / 255; return [0, 1, 2].map((i) => Math.round(f[i] * a + b[i] * (1 - a))).concat(255) }
  const lum = (p) => { const [r, g, b] = p.slice(0, 3).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }); return 0.2126 * r + 0.7152 * g + 0.0722 * b }
  const ratio = (a, b) => { const [h, l] = [lum(a), lum(b)].sort((m, n) => n - m); return (h + 0.05) / (l + 0.05) }
  // Fondo efectivo: el primer antecesor con fondo opaco, componiendo los translúcidos
  const bgOf = (el) => {
    const stack = []
    for (let e = el; e; e = e.parentElement) {
      const v = rgba(getComputedStyle(e).backgroundColor)
      if (v[3] > 0) stack.push(v)
      if (v[3] === 255) break
    }
    return stack.reverse().reduce((acc, v) => over(v, acc), [255, 255, 255, 255])
  }
  const fgOn = (el, bgEl = el) => { const bg = bgOf(bgEl); return ratio(over(rgba(getComputedStyle(el).color), bg), bg) }
  window.__ct = { rgba, ratio, bgOf, fgOn, over }
}

for (const [qs, name] of [['zone=1', 'zona de marca'], ['dark=1', 'oscuro'], ['zone=1&dark=1', 'zona de marca en oscuro']]) {
  test(`${name}: la pila, el panel de la cola y C heredan el tema de su sitio y conservan los mínimos`, async ({ page }) => {
    const errs = watchConsole(page)
    await load(page, `n=15&${qs}`)
    await page.evaluate(contrastHelpers)
    await openFab(page)
    await page.click('#fab-menu .g-fab__item--more')
    await settle(page, 300)
    const a = await page.evaluate((zone) => {
      const C = window.__ct
      const wrap = document.querySelector('.wrap')
      const fab = document.getElementById('fab-trigger')
      const pill = document.querySelector('#fab-menu .g-fab__item')
      const panel = document.getElementById('fab-more')
      const row = panel.querySelector('.g-fab__item')
      const tok = (name, el) => { const p = document.createElement('span'); p.style.cssText = `color:var(${name})`; el.append(p); const v = C.rgba(getComputedStyle(p).color); p.remove(); return v }
      const page = C.bgOf(wrap)
      return {
        zoneAttr: wrap.getAttribute('data-g-zone'),
        // La lista es un popover en la capa superior pero hija de la zona en el DOM: sus tokens son los de su sitio
        surfaceHere: tok('--g-color-surface', pill).join(),
        surfaceZone: tok('--g-color-surface', wrap).join(),
        surfaceRoot: tok('--g-color-surface', document.body).join(),
        pillLabel: C.fgOn(pill.querySelector('.g-fab__label'), pill),
        panelLabel: C.fgOn(row.querySelector('.g-fab__label'), panel),
        fabIcon: C.fgOn(fab, fab),
        fabVsPage: C.ratio(C.bgOf(fab), page),
        panelBg: C.bgOf(panel).join()
      }
    }, qs.includes('zone'))
    expect(a.surfaceHere).toBe(a.surfaceZone)
    if (qs.includes('zone')) {
      expect(a.zoneAttr).toBe('brand')
      expect(a.surfaceZone, 'la zona redefine la superficie').not.toBe(a.surfaceRoot)
    }
    expect(a.pillLabel, 'etiqueta de la píldora').toBeGreaterThanOrEqual(4.5)
    expect(a.panelLabel, 'etiqueta del panel').toBeGreaterThanOrEqual(4.5)
    expect(a.fabIcon, 'icono del FAB').toBeGreaterThanOrEqual(4.5)
    expect(a.fabVsPage, 'el FAB frente a la página').toBeGreaterThanOrEqual(3)
    // C en el mismo sitio: la principal y su etiqueta, y el panel que filtra
    await load(page, `n=15&main=1&${qs}`)
    await page.evaluate(contrastHelpers)
    await openFab(page)
    await page.keyboard.type('exp')
    await expect(page.locator('#fab-menu .g-fab__find-count')).toHaveText('1 acción')
    const c = await page.evaluate(() => {
      const C = window.__ct
      const main = document.querySelector('.g-fab__main')
      const ul = document.getElementById('fab-menu')
      const hitRow = [...ul.querySelectorAll('.g-fab__item')].find((b) => !b.closest('[hidden]'))
      return { main: C.fgOn(main, main), row: C.fgOn(hitRow.querySelector('.g-fab__label'), hitRow), count: C.fgOn(ul.querySelector('.g-fab__find-count'), ul) }
    })
    expect(c.main, 'etiqueta de la principal').toBeGreaterThanOrEqual(4.5)
    expect(c.row, 'la fila encontrada (con el resaltado)').toBeGreaterThanOrEqual(4.5)
    expect(c.count, 'el recuento').toBeGreaterThanOrEqual(4.5)
    expect(errs).toEqual([])
  })
}
