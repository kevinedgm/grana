// Isla de estado transitoria (design/contracts/status.md «Verificación»; D1 · Cápsula de relevo, DECISIONS.md #693 a #705)
// sobre los COMPONENTES REALES del playground (packages/vue/playground, sección #sec-status, entrada @grana/vue/status por
// dist/status.umd.js, global GranaStatus), en Chromium, Firefox y WebKit. El movimiento cuadro a cuadro (F1, F2, I4 e
// interrupciones) va en tests/status-movimiento.spec.mjs.
// Casos: entrada propia; 0 anuncios al cargar pero se muestra; «Guardar» que falla con el 500 y se reintenta desde el asomo
// hasta «Guardada · Ver factura» en el mismo nodo y sin la traza (F3, F4); tiempo de lectura con la marca montada, eco y
// memoria en la marca; pausa por puntero y 1000 ms al reanudar; asomo por puntero que crece hacia abajo y Esc del asomo;
// teclado (asomo al enfocar, lista, Esc, Alt+F8); toque (primer toque asomo, segundo lista; la acción no queda bajo el dedo);
// relevo por gravedad sin anuncio; vive con su origen; `duration: false`; borde compartido con la voz y GToaster; traslado al
// GDialog; hoja móvil a 320 px; RTL; movimiento reducido; lista larga; cabecera fija; marca en GFormActions sin mover nada.
// Un solo proceso por puerto: GRANA_PW_PORT=4212 npx playwright test tests/status.spec.mjs
import { test, expect } from '@playwright/test'

test.setTimeout(90_000)

const PAGE = '/packages/vue/playground/index.html'
const ERR = 'Error: No se pudo guardar la factura. El servidor no respondió; tus datos siguen en el formulario.'
const SHAPE = '.g-status-island__shape'
const SUMMARY = '.g-status-island__summary'

function watchConsole(page) {
  const errs = []
  page.on('pageerror', (e) => { if (!/ResizeObserver loop/.test(e.message)) errs.push(`pageerror: ${e.message}`) })
  page.on('console', (m) => {
    const t = m.text()
    if (m.type() === 'error' && !/favicon/.test(t)) errs.push(`console: ${t}`)
    else if (m.type() === 'warning' && /\[Vue warn\]|\[Grana Status\]/.test(t)) errs.push(`warning: ${t}`)
  })
  return errs
}
// Registro de lo que se escribe en los canales de la isla, instalado ANTES de cargar (para medir «0 al cargar»)
const LIVE_LOG = () => {
  window.__live = []
  const last = new WeakMap()
  const scan = () => {
    for (const el of document.querySelectorAll('.g-status-island__live')) {
      const text = el.textContent
      if (text && last.get(el) !== text) window.__live.push({ text, ch: el.getAttribute('role') === 'alert' ? 'assertive' : 'polite', host: el.closest('dialog') ? 'dialog' : 'body' })
      last.set(el, text)
    }
  }
  new MutationObserver(scan).observe(document, { subtree: true, childList: true, characterData: true })
}
async function open(page, { seed = true, width = 1280, height = 900, motion = 'no-preference', query = '', rtl = false } = {}) {
  await page.emulateMedia({ reducedMotion: motion })
  await page.setViewportSize({ width, height })
  await page.addInitScript(LIVE_LOG)
  await page.goto(`${PAGE}?${seed ? 'status=seed' : 'status=none'}${query}`)
  await page.waitForFunction(() => window.gStatus && window.__st && document.querySelector('.g-status-island'))
  await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' })
  if (rtl) await page.evaluate(() => { document.documentElement.dir = 'rtl' })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForFunction(() => document.querySelector('.g-status-island').classList.contains('is-ready'))
  await page.waitForTimeout(150)
}
const live = (page) => page.evaluate(() => window.__live.map((x) => ({ ...x })))
const act = (page) => page.evaluate(() => { const a = document.activeElement; return [...a.classList].find((c) => c.startsWith('g-status-i')) || a.id || a.tagName })
const form = (page) => page.evaluate(() => document.querySelector('.g-status-island').dataset.form)
const stage = (page) => page.evaluate(() => document.querySelector('.g-status-island').dataset.stage || null)
const state = (page) => page.evaluate(() => ({ ...window.gStatus.state }))
const press = async (page, sel) => { await page.focus(sel); await page.keyboard.press('Enter') }
const center = (page, sel) => page.evaluate((s) => { document.querySelector(s).scrollIntoView({ block: 'center' }) }, sel)
// En reposo: sin etapa en curso y con el titular a la vista
const rest = (page) => page.waitForFunction(() => { const r = document.querySelector('.g-status-island'); return r.dataset.form !== 'empty' && !r.dataset.stage })
const empty = (page, timeout = 20_000) => page.waitForFunction(() => document.querySelector('.g-status-island').dataset.form === 'empty', null, { timeout })
const REFS = ['#st-cliente', '#st-save', '#st-table-region', '#st-text-mark', '#st-dialog']
const tops = (page) => page.evaluate((sels) => sels.map((s) => Math.round((document.querySelector(s).getBoundingClientRect().top + scrollY) * 100) / 100), REFS)
// Posición del elemento en cada cuadro durante `ms`: devuelve el recorrido máximo (Δ)
const startSample = (page, sel, ms) => page.evaluate(([s, t]) => {
  window.__sample = new Promise((res) => {
    const out = []; const el = document.querySelector(s); const t0 = performance.now()
    const f = () => setTimeout(() => { out.push(el.getBoundingClientRect().top); if (performance.now() - t0 < t) requestAnimationFrame(f); else res(out) }, 0)
    requestAnimationFrame(f)
  })
}, [sel, ms])
const endSample = async (page) => { const a = await page.evaluate(() => window.__sample); return Math.max(...a) - Math.min(...a) }
// Sin duplicados: ningún texto de los canales de la isla está a la vez en otra región viva del documento
const noRepeats = (page) => page.evaluate(() => {
  const own = [...document.querySelectorAll('.g-status-island__live')].map((x) => x.textContent.trim()).filter(Boolean)
  const others = [...document.querySelectorAll('[aria-live]:not([aria-live=off]),[role=alert],[role=status]')].filter((x) => !x.classList.contains('g-status-island__live')).map((x) => x.textContent.trim())
  return new Set(own).size === own.length && own.every((t) => !others.includes(t))
})
const rect = (page, sel) => page.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, width: r.width, height: r.height } }, sel)
// Lleva el puntero lejos de la isla (en Playwright el ratón empieza en 0,0, que puede caer sobre la cápsula)
const away = (page) => page.mouse.move(5, 880)

test.describe('isla de estado · playground (status.md, D1)', () => {
  test('entrada propia (#328): Grana no trae la isla; GranaStatus sí, registra sus componentes y toma lo compartido de Grana', async ({ page }) => {
    const errs = watchConsole(page)
    await open(page)
    const r = await page.evaluate(() => ({
      main: ['createStatus', 'useStatus', 'statusKey', 'GStatusIsland', 'GStatusMark', 'GStatus'].filter((k) => k in window.Grana),
      own: Object.keys(window.GranaStatus).sort(),
      shared: typeof window.Grana.__shared['utils/edgeReserve.js'].edgeReserve,
      toast: typeof window.Grana.__shared['components/GToast/toaster.js'].TOAST_DURATION,
      order: window.Grana.__shared['utils/edgeReserve.js'].EDGE_ORDER.status
    }))
    expect(r).toEqual({ main: [], own: ['GStatus', 'GStatusIsland', 'GStatusMark', 'createStatus', 'statusKey', 'useStatus'], shared: 'function', toast: 'object', order: 30 })
    expect(errs).toEqual([])
  })

  test('carga: 0 anuncios pero se muestra (cae tras is-ready); canales vacíos, región con nombre, nada es región viva; relevo con «+N»', async ({ page }) => {
    const errs = watchConsole(page)
    await away(page)
    await open(page)
    await rest(page)
    expect(await live(page), 'lo que existe al montar no se anuncia').toEqual([])
    const r = await page.evaluate(() => {
      const root = document.querySelector('.g-status-island')
      const s = root.querySelector('.g-status-island__summary')
      return {
        parent: root.parentElement.tagName, popover: root.matches(':popover-open'), form: root.dataset.form, type: root.dataset.type, align: root.dataset.align,
        lives: [...root.querySelectorAll(':scope > .g-status-island__live')].map((l) => [l.getAttribute('role'), l.textContent]),
        liveInside: root.querySelectorAll('.g-status-island__shape :is([role=alert],[role=status],[aria-live]:not([aria-live=off]))').length,
        expanded: s.getAttribute('aria-expanded'), keys: s.getAttribute('aria-keyshortcuts'), ring: !!s.querySelector('.g-status-island__badge > .g-status-island__ring'),
        state: { ...window.gStatus.state }
      }
    })
    expect(r).toMatchObject({ parent: 'BODY', popover: true, form: 'line', type: 'error', align: 'center', lives: [['status', ''], ['alert', '']], liveInside: 0, expanded: 'false', keys: 'Alt+F8', ring: true })
    expect(r.state).toMatchObject({ form: 'line', current: 'st-table', waiting: 1, count: 2 })
    expect(await page.locator('.g-status-island__shape').ariaSnapshot()).toMatch(/region "Estado de la aplicación \(Alt\+F8\)"/)
    expect(await page.locator(SUMMARY).ariaSnapshot()).toMatch(/button "Error: No se pudieron cargar las facturas \+?1? ?y 1 más en espera"/)
    await expect(page.locator('#st-table-region button#st-table-mark.g-status-mark--link')).toHaveText(/No se pudieron cargar/)
    expect(errs).toEqual([])
  })

  test('«Guardar» falla (500): 1 anuncio enérgico, el foco sigue en «Guardar», Δ0 en la página, cae como titular (no se abre nada) y la marca nace junto al botón', async ({ page, browserName }) => {
    const errs = watchConsole(page)
    const TOL = browserName === 'webkit' ? 1.5 : 1
    await away(page)
    await open(page, { seed: false })
    const t0 = await tops(page)
    await center(page, '#st-save'); await page.waitForTimeout(80)
    const y0 = await page.evaluate(() => scrollY)
    await page.focus('#st-save')
    await startSample(page, '#st-save', 900)
    await page.keyboard.press('Enter')
    const d = await endSample(page)
    expect(await live(page)).toEqual([{ text: ERR, ch: 'assertive', host: 'body' }])
    expect(await act(page)).toBe('st-save')
    expect(d, `el botón con foco no se mueve en ningún cuadro (Δ ${d.toFixed(2)}px)`).toBeLessThanOrEqual(TOL)
    expect(await tops(page), 'nada de la página cambia de sitio').toEqual(t0)
    expect(await page.evaluate(() => scrollY)).toBe(y0)
    expect(await form(page), 'nada se abre solo (#696)').toBe('line')
    await expect(page.locator(SUMMARY)).toHaveAttribute('aria-expanded', 'false')
    expect(await page.evaluate(() => document.querySelector('.g-status-island__peek').hidden)).toBe(true)
    const mark = await page.evaluate(() => {
      const m = document.getElementById('st-save-mark').getBoundingClientRect(); const s = document.getElementById('st-save').getBoundingClientRect()
      return { tag: document.getElementById('st-save-mark').tagName, dy: Math.abs(m.top + m.height / 2 - s.top - s.height / 2), before: m.right <= s.left + 1, text: document.getElementById('st-save-mark').textContent }
    })
    expect(mark).toMatchObject({ tag: 'BUTTON', before: true, text: 'Error: No se guardó' })
    expect(mark.dy).toBeLessThanOrEqual(2)
    expect(await noRepeats(page)).toBe(true)
    expect(errs).toEqual([])
  })

  test('reintentar desde el asomo → «Guardada · Ver factura» en el MISMO nodo, sin la descripción ni la traza del 500 (F4); el foco no cae al body', async ({ page }) => {
    const errs = watchConsole(page)
    await away(page)
    await open(page, { seed: false })
    await center(page, '#st-save')
    await press(page, '#st-save')
    await rest(page)
    const before = await page.evaluate(() => { window.__sum = document.querySelector('.g-status-island__summary'); return window.gStatus.get('st-save') })
    expect(before).toMatchObject({ type: 'error', details: 'POST /api/facturas · 500 Internal Server Error · req-2c41d7' })
    await page.hover(SHAPE)
    await expect(page.locator('.g-status-island')).toHaveClass(/is-peek/)
    await expect(page.locator('.g-status-island')).toHaveClass(/is-paused/)
    const action = page.locator('.g-status-island__peek .g-status-island__action')
    await expect(action).toBeVisible()
    await action.focus()
    await page.keyboard.press('Enter')
    await expect(action).toHaveAttribute('aria-disabled', 'true')
    await expect(action).toHaveText('Reintentando…')
    await expect(page.locator('#st-save-mark')).toHaveClass(/is-busy/)
    await page.waitForFunction(() => window.gStatus.get('st-save').type === 'success', null, { timeout: 5000 })
    await page.waitForTimeout(300)
    const after = await page.evaluate(() => ({ c: window.gStatus.get('st-save'), same: window.__sum === document.querySelector('.g-status-island__summary'), text: document.querySelector('.g-status-island__text').textContent, focusBody: document.activeElement === document.body, link: document.querySelector('.g-status-island__peek .g-status-island__link')?.textContent }))
    expect(after.c.description).toBeUndefined()
    expect(after.c.details).toBeUndefined()
    expect(after.c.link).toMatchObject({ label: 'Ver factura' })
    expect(after.same).toBe(true)
    expect(after.text).toBe('Correcto: Factura guardada con el folio F-0042')
    expect(after.focusBody).toBe(false)
    expect(after.link).toBe('Ver factura')
    await expect(page.locator('#st-save-mark')).toHaveText('Correcto: Guardada')
    expect(errs).toEqual([])
  })

  test('lectura: con la marca montada, el error se recoge pasado su tiempo (auto) con su texto; la marca recibe el eco y guarda lo pendiente (Alt+F8 y la marca lo traen)', async ({ page }) => {
    const errs = watchConsole(page)
    await away(page)
    await open(page, { seed: false, query: '' })
    await page.selectOption('#st-save-fails', 'always')
    await center(page, '#st-save')
    await page.evaluate(() => {
      window.__echo = 0
      new MutationObserver(() => { if (document.getElementById('st-save-mark')?.classList.contains('is-echo')) window.__echo++ }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class'] })
    })
    await page.click('#st-save')
    await rest(page)
    const t0 = Date.now()
    await page.waitForFunction(() => document.querySelector('.g-status-island').dataset.stage === 'fold', null, { timeout: 15_000 })
    const took = Date.now() - t0
    expect(took, `7280 ms de lectura (${took})`).toBeGreaterThan(6800)
    expect(took).toBeLessThan(8600)
    // Se recoge con su texto (I4) y `hidden` llega tras la subida
    expect(await page.evaluate(() => document.querySelector('.g-status-island__text').textContent)).toMatch(/No se pudo guardar/)
    await empty(page)
    expect(await page.evaluate(() => window.__echo), 'eco una vez, con la marca visible').toBeGreaterThanOrEqual(1)
    expect(await page.evaluate(() => [window.gStatus.get('st-save').seen, !!document.getElementById('st-save-mark')])).toEqual([true, true])
    // La marca trae la condición con el foco en su acción
    await page.click('#st-save-mark')
    await page.waitForFunction(() => document.querySelector('.g-status-island').dataset.form === 'list')
    expect(await page.evaluate(() => document.activeElement.classList.contains('g-status-item__action'))).toBe(true)
    await page.keyboard.press('Alt+F8')
    expect(await act(page), 'Alt+F8 vuelve a la marca').toBe('st-save-mark')
    expect(errs).toEqual([])
  })

  test('pausa: el puntero sobre la isla la detiene (is-paused, el anillo quieto); al salir quedan ≥ 1000 ms', async ({ page }) => {
    const errs = watchConsole(page)
    await away(page)
    await open(page, { seed: false })
    await page.evaluate(() => window.gStatus.info('p', 'Modo de solo lectura'))
    await rest(page)
    await page.waitForTimeout(3000) // quedan ~2000 ms (el mínimo de 1000 ms al reanudar se mide al milisegundo en vitest)
    await page.hover(SHAPE)
    await expect(page.locator('.g-status-island')).toHaveClass(/is-paused/)
    await page.waitForTimeout(3000)
    expect(await form(page)).toBe('line')
    expect(await stage(page)).toBeNull()
    const t0 = Date.now()
    await away(page)
    await page.waitForFunction(() => document.querySelector('.g-status-island').dataset.stage === 'fold', null, { timeout: 5000 })
    const took = Date.now() - t0
    expect(took, `sigue con lo que quedaba, nunca se reinicia (${took})`).toBeGreaterThanOrEqual(900)
    expect(took).toBeLessThan(3800)
    expect(errs).toEqual([])
  })

  test('asomo por puntero: crece hacia abajo (el titular no se mueve) con descripción, acción, «Ir a…» y «Ocultar»; Esc con el foco fuera lo cierra y recoge sin detener la propagación', async ({ page }) => {
    const errs = watchConsole(page)
    await away(page)
    await open(page, { seed: false })
    await page.selectOption('#st-save-fails', 'always')
    await center(page, '#st-save')
    await page.click('#st-save')
    await rest(page)
    const s0 = await rect(page, SUMMARY)
    const sh0 = await rect(page, SHAPE)
    await page.hover(SUMMARY)
    await expect(page.locator('.g-status-island')).toHaveClass(/is-peek/)
    await page.waitForTimeout(500)
    const s1 = await rect(page, SUMMARY)
    const sh1 = await rect(page, SHAPE)
    expect(Math.abs(s1.top - s0.top), 'el titular no se mueve al asomar').toBeLessThanOrEqual(1)
    expect(Math.abs(sh1.top - sh0.top)).toBeLessThanOrEqual(1)
    expect(sh1.height).toBeGreaterThan(sh0.height)
    const names = await page.evaluate(() => [...document.querySelectorAll('.g-status-island__peek :is(.g-status-island__desc, .g-status-island__action, .g-status-island__origin, .g-status-island__hide)')].map((x) => x.textContent.trim()))
    expect(names).toEqual(['El servidor no respondió; tus datos siguen en el formulario.', 'Reintentar', 'Ir al formulario', 'Ocultar'])
    await page.focus('#st-cliente') // fuera de la isla y no bajo ella (un foco tapado ya la recogería, 2.4.11)
    expect(await page.evaluate(() => window.gStatus.state.peek)).toBe(true)
    const ev = await page.evaluate(() => new Promise((res) => {
      window.addEventListener('keydown', (e) => res({ prevented: e.defaultPrevented, key: e.key }), { once: true })
      document.getElementById('st-cliente').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))
    }))
    expect(ev).toEqual({ prevented: true, key: 'Escape' })
    expect(await stage(page)).toMatch(/fold|rise/)
    expect(await act(page)).toBe('st-cliente')
    expect(errs).toEqual([])
  })

  test('teclado: enfocar el titular abre el asomo; Enter abre la lista («Pendiente (N)»); Esc recoge sin dejar el foco en body; Alt+F8 va y vuelve; sin condiciones no se intercepta', async ({ page }) => {
    const errs = watchConsole(page)
    await away(page)
    await open(page, { seed: false })
    await page.focus('#st-field')
    const notCaught = await page.evaluate(() => { const e = new KeyboardEvent('keydown', { key: 'F8', altKey: true, bubbles: true, cancelable: true }); document.getElementById('st-field').dispatchEvent(e); return !e.defaultPrevented })
    expect(notCaught).toBe(true)
    await page.evaluate(() => window.__st.offline())
    await rest(page)
    await page.focus(SUMMARY)
    await expect(page.locator('.g-status-island')).toHaveClass(/is-peek/)
    await page.keyboard.press('Enter')
    expect(await form(page)).toBe('list')
    await expect(page.locator(SUMMARY)).toHaveAttribute('aria-expanded', 'true')
    await expect(page.locator('.g-status-island__text')).toHaveText('Pendiente (1)')
    await page.keyboard.press('Escape')
    await page.waitForTimeout(100)
    expect(await stage(page)).toMatch(/fold|rise/)
    expect(await page.evaluate(() => document.activeElement !== document.body && !document.querySelector('.g-status-island').contains(document.activeElement))).toBe(true)
    await empty(page)
    // Alt+F8 desde el campo: abre la lista con el foco en el resumen; otra vez: recoge y vuelve al campo
    await page.focus('#st-field')
    await page.keyboard.press('Alt+F8')
    await page.waitForTimeout(100)
    expect([await form(page), await act(page)]).toEqual(['list', 'g-status-island__summary'])
    await page.keyboard.press('Alt+F8')
    expect(await act(page)).toBe('st-field')
    expect(errs).toEqual([])
  })

  test('relevo por gravedad: lo grave pasa delante, «+N» = lo que espera, el mismo resumen y ningún anuncio del relevo', async ({ page }) => {
    const errs = watchConsole(page)
    await away(page)
    await open(page, { seed: false })
    await page.evaluate(() => { window.__st.maint(); window.__st.readonly() })
    await rest(page)
    await page.evaluate(() => { window.__sum = document.querySelector('.g-status-island__summary') })
    expect(await state(page)).toMatchObject({ current: 'readonly', waiting: 1 })
    await page.evaluate(() => window.gStatus.error('boom', 'El servidor no responde'))
    await page.waitForFunction(() => window.gStatus.state.current === 'boom')
    expect(await state(page)).toMatchObject({ waiting: 2 })
    await expect(page.locator('.g-status-island__more [aria-hidden="true"]')).toHaveText('+2')
    await page.waitForTimeout(300)
    const said = await live(page)
    expect(said.map((x) => x.ch)).toEqual(['polite', 'assertive']) // las dos corteses llegaron juntas: un solo texto
    expect(said[0].text).toBe('Información: Mantenimiento programado esta noche. De 23:00 a 23:30 no se podrá guardar. Advertencia: Modo de solo lectura. Otra persona está editando este expediente.')
    expect(said[1].text).toBe('Error: El servidor no responde')
    await page.evaluate(() => window.gStatus.remove('boom'))
    await page.waitForFunction(() => window.gStatus.state.current === 'readonly')
    await page.waitForTimeout(300)
    expect(await page.evaluate(() => window.__sum === document.querySelector('.g-status-island__summary'))).toBe(true)
    expect(await live(page), 'el relevo no anuncia').toEqual(said)
    expect(errs).toEqual([])
  })

  test('vive con su origen: si su destino, que llegó a existir, sale del documento, la condición se retira (origin) sin anuncio', async ({ page }) => {
    const errs = watchConsole(page)
    await open(page, { seed: false })
    await page.evaluate(() => {
      const v = document.createElement('section'); v.id = 'vista-x'; document.body.append(v)
      window.__why = null
      window.gStatus.error('vista', 'No se pudo cargar la vista', { origin: { label: 'Ir a la vista', target: 'vista-x' }, onRemove: (r) => { window.__why = r } })
    })
    await page.waitForTimeout(300)
    const n = (await live(page)).length
    await page.evaluate(() => document.getElementById('vista-x').remove())
    await page.waitForFunction(() => !window.gStatus.has('vista'))
    expect(await page.evaluate(() => window.__why)).toBe('origin')
    await page.waitForTimeout(200)
    expect((await live(page)).length).toBe(n)
    expect(errs).toEqual([])
  })

  test('duration false («no ocultar solo»): queda en pausa y no se recoge por tiempo', async ({ page }) => {
    const errs = watchConsole(page)
    await away(page)
    await open(page, { seed: false })
    await page.selectOption('#st-duration', 'false')
    await page.evaluate(() => window.gStatus.info('p', 'Modo de solo lectura'))
    await rest(page)
    await expect(page.locator('.g-status-island')).toHaveClass(/is-paused/)
    await page.waitForTimeout(6000)
    expect([await form(page), await stage(page)]).toEqual(['line', null])
    await page.evaluate(() => window.gStatus.hide())
    await empty(page)
    expect(errs).toEqual([])
  })

  test('borde compartido: pill de voz → isla → aviso de GToaster (top-center); la isla publica solo mientras se ve', async ({ page }) => {
    const errs = watchConsole(page)
    await away(page)
    await open(page, { seed: false, query: '&speech=self' })
    await page.evaluate(() => window.speech.start({ mode: 'conversation' }))
    await page.waitForFunction(() => /listening|speech|transcribing/.test(window.speech.state.status))
    await page.evaluate(() => { document.querySelector('.pg-bar').style.position = 'static' })
    await center(page, '#st-save')
    await page.waitForFunction(() => { const f = document.querySelector('.g-speech-host__float'); return f && !f.hidden && f.getBoundingClientRect().height > 0 })
    const E = () => page.evaluate(() => window.Grana.__shared['utils/edgeReserve.js'].edgeReserve('top', { before: 99 }))
    const r0 = await E()
    await page.evaluate(() => { window.gStatus.configure({ duration: false }); window.__st.offline() })
    await rest(page)
    await page.waitForTimeout(300)
    const a = await page.evaluate((s) => {
      const f = document.querySelector('.g-speech-host__float').getBoundingClientRect(); const i = document.querySelector(s).getBoundingClientRect()
      return { edge: document.querySelector('.g-speech-host').dataset.edge, pillBottom: f.bottom, islandTop: i.top, islandBottom: i.bottom, offset: document.querySelector('.g-status-island').style.getPropertyValue('--_status-offset-top') }
    }, SHAPE)
    expect(a.edge).toBe('top')
    expect(a.offset).toMatch(/^calc\(/)
    expect(a.islandTop, 'la isla queda debajo de la pill de voz').toBeGreaterThanOrEqual(a.pillBottom)
    expect(await E(), 'publica mientras se ve').toBeGreaterThan(r0)
    await page.evaluate(() => { window.toaster.configure({ position: 'top-center' }); window.toaster.success('Borrador guardado') })
    await page.waitForSelector('.g-toast[data-state="visible"]'); await page.waitForTimeout(500)
    const b = await page.evaluate((s) => ({ islandTop: document.querySelector(s).getBoundingClientRect().top, islandBottom: document.querySelector(s).getBoundingClientRect().bottom, toastTop: document.querySelector('.g-toast').getBoundingClientRect().top }), SHAPE)
    expect(b.toastTop, 'el aviso flotante queda debajo de la isla').toBeGreaterThanOrEqual(b.islandBottom)
    expect(Math.abs(b.islandTop - a.islandTop)).toBeLessThan(1)
    await page.evaluate(() => window.gStatus.hide())
    await empty(page)
    expect(await E(), 'vacía: deja de publicar').toBe(r0)
    await page.evaluate(() => window.speech.discard ? window.speech.discard({ confirm: false }) : window.speech.cancel())
    expect(errs).toEqual([])
  })

  test('diálogo: la isla se traslada al GDialog (mismos nodos, sin anunciar), un aviso dentro usa los canales que viajaron, Esc en la isla no cierra el diálogo y vuelve al cerrarse', async ({ page }) => {
    const errs = watchConsole(page)
    await away(page)
    await open(page, { seed: false })
    await page.evaluate(() => { window.gStatus.configure({ duration: false }); window.__root = document.querySelector('.g-status-island') })
    await center(page, '#st-dialog')
    await press(page, '#st-dialog'); await page.waitForSelector('#st-dlg[open] #st-dlg-mark'); await page.waitForTimeout(450)
    expect(await live(page)).toEqual([])
    expect(await act(page), 'el foco sigue la regla de GDialog').toBe('st-dlg-name')
    expect(await page.evaluate(() => { const r = document.querySelector('.g-status-island'); return { same: r === window.__root, parent: r.parentElement.id, open: r.matches(':popover-open'), lives: r.querySelectorAll(':scope > .g-status-island__live').length } })).toEqual({ same: true, parent: 'st-dlg', open: true, lives: 2 })
    await press(page, '#st-dlg-offline')
    await rest(page)
    expect(await live(page)).toEqual([{ text: 'Advertencia: Sin conexión. Los cambios se guardarán al volver.', ch: 'polite', host: 'dialog' }])
    await press(page, SUMMARY)
    expect(await form(page)).toBe('list')
    await page.keyboard.press('Escape'); await page.waitForTimeout(100)
    expect(await page.evaluate(() => document.getElementById('st-dlg').open)).toBe(true)
    expect(await page.evaluate(() => document.getElementById('st-dlg').contains(document.activeElement))).toBe(true)
    await empty(page)
    await page.keyboard.press('Escape'); await page.waitForTimeout(600)
    expect(await page.evaluate(() => { const r = document.querySelector('.g-status-island'); return { same: r === window.__root, parent: r.parentElement.tagName, open: r.matches(':popover-open'), dlg: document.getElementById('st-dlg').open } })).toEqual({ same: true, parent: 'BODY', open: true, dlg: false })
    expect((await live(page)).length, 'el traslado no anuncia').toBe(1)
    expect(errs).toEqual([])
  })

  test('320px: nada se desborda ni se mueve; nada se abre solo; el titular abre una hoja inferior modal (GDialog real) y la marca la abre en su acción', async ({ page, browserName }) => {
    const errs = watchConsole(page)
    const TOL = browserName === 'webkit' ? 1.5 : 1
    await away(page)
    await open(page, { seed: false, width: 320, height: 700 })
    await page.selectOption('#st-save-fails', 'always')
    await expect(page.locator('.g-status-island')).toHaveAttribute('data-mobile', '')
    await center(page, '#st-save'); await page.waitForTimeout(80)
    await page.focus('#st-save')
    await startSample(page, '#st-save', 900)
    await page.keyboard.press('Enter')
    const d = await endSample(page)
    expect(d).toBeLessThanOrEqual(TOL)
    await rest(page)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320)
    const r = await rect(page, SHAPE)
    expect(r.left).toBeGreaterThanOrEqual(0)
    expect(r.right).toBeLessThanOrEqual(320)
    expect(await page.evaluate(() => !document.querySelector('dialog[open]')), 'una hoja modal tomaría el foco: no se abre sola').toBe(true)
    expect(await act(page)).toBe('st-save')
    const s = await page.evaluate(() => { const b = document.querySelector('.g-status-island__summary'); return [b.getAttribute('aria-haspopup'), b.hasAttribute('aria-controls')] })
    expect(s).toEqual(['dialog', false])
    await press(page, SUMMARY); await page.waitForSelector('dialog.g-status-sheet[open] .g-status-item'); await page.waitForTimeout(500)
    const sheet = await page.evaluate(() => { const dlg = document.querySelector('dialog.g-status-sheet'); return { modal: dlg.matches(':modal'), focus: dlg.contains(document.activeElement), items: dlg.querySelectorAll('.g-status-item').length, bottom: dlg.getBoundingClientRect().bottom >= innerHeight - 1, fits: dlg.scrollWidth <= 320 && document.documentElement.scrollWidth <= 320, form: document.querySelector('.g-status-island').dataset.form, rootParent: document.querySelector('.g-status-island').parentElement.tagName } })
    expect(sheet).toEqual({ modal: true, focus: true, items: 1, bottom: true, fits: true, form: 'list', rootParent: 'BODY' })
    await page.keyboard.press('Escape'); await page.waitForTimeout(600)
    expect(await page.evaluate(() => !document.querySelector('dialog[open]'))).toBe(true)
    expect(await page.evaluate(() => document.activeElement !== document.body)).toBe(true)
    await empty(page)
    await press(page, '#st-save-mark'); await page.waitForSelector('dialog.g-status-sheet[open] .g-status-item'); await page.waitForTimeout(500)
    expect(await page.evaluate(() => document.activeElement.classList.contains('g-status-item__action'))).toBe(true)
    await page.keyboard.press('Escape'); await page.waitForTimeout(600)
    expect(await act(page)).toBe('st-save-mark')
    expect(errs).toEqual([])
  })

  test('RTL: la isla sigue centrada, la insignia va al inicio y nada se desborda', async ({ page }) => {
    const errs = watchConsole(page)
    await away(page)
    await open(page, { seed: false, rtl: true })
    await page.evaluate(() => window.__st.offline())
    await rest(page)
    const r = await page.evaluate((s) => { const i = document.querySelector(s).getBoundingClientRect(); const b = document.querySelector('.g-status-island__badge').getBoundingClientRect(); const t = document.querySelector('.g-status-island__text').getBoundingClientRect(); return { center: Math.abs((i.left + i.right) / 2 - innerWidth / 2), badgeAtStart: b.left > t.left, overflow: document.documentElement.scrollWidth <= innerWidth } }, SHAPE)
    expect(r.center).toBeLessThanOrEqual(8)
    expect(r.badgeAtStart).toBe(true)
    expect(r.overflow).toBe(true)
    expect(errs).toEqual([])
  })

  test('movimiento reducido: sin desplazamiento ni escala animados (solo fundidos); los anuncios no cambian', async ({ page, browserName }) => {
    const errs = watchConsole(page)
    const TOL = browserName === 'webkit' ? 1.5 : 1
    await away(page)
    await open(page, { seed: false, motion: 'reduce' })
    await center(page, '#st-save'); await page.waitForTimeout(80)
    await page.focus('#st-save')
    await page.evaluate(() => {
      window.__moving = []
      const root = document.querySelector('.g-status-island')
      const f = () => { for (const a of root.getAnimations({ subtree: true })) { const p = a.transitionProperty || a.animationName; if (a.playState === 'running' && /^(translate|scale|transform|inline-size|block-size|width|height)$/.test(p)) window.__moving.push(p) } if (window.__moving.length < 50) requestAnimationFrame(f) }
      requestAnimationFrame(f)
      setTimeout(() => { window.__moving.push('fin') }, 1500)
    })
    await startSample(page, '#st-save', 500)
    await page.keyboard.press('Enter')
    const d = await endSample(page)
    expect(d).toBeLessThanOrEqual(TOL)
    await page.waitForTimeout(1200)
    expect(await page.evaluate(() => window.__moving.filter((x) => x !== 'fin'))).toEqual([])
    expect(await live(page)).toEqual([{ text: ERR, ch: 'assertive', host: 'body' }])
    expect(await form(page)).toBe('line')
    expect(errs).toEqual([])
  })

  test('más de 6 condiciones: la lista desplaza, «Cerrar» queda a la vista y el orden es por gravedad', async ({ page }) => {
    const errs = watchConsole(page)
    await away(page)
    await open(page, { height: 600 })
    await page.evaluate(() => window.__st.many()); await page.waitForTimeout(300)
    expect(await page.evaluate(() => window.gStatus.state.count)).toBe(9)
    await press(page, SUMMARY)
    await page.waitForTimeout(500)
    const r = await page.evaluate(() => {
      const list = document.querySelector('.g-status-island__list'); const close = document.querySelector('.g-status-island__close').getBoundingClientRect(); const s = document.querySelector('.g-status-island__shape').getBoundingClientRect()
      const order = { error: 0, warning: 1, info: 2, success: 3 }
      const types = [...document.querySelectorAll('.g-status-island__panel .g-status-item')].map((li) => order[li.dataset.type])
      return { scrolls: list.scrollHeight > list.clientHeight, closeVisible: close.bottom <= innerHeight && close.top >= 0, inViewport: s.bottom <= innerHeight, sorted: types.every((v, i) => i === 0 || types[i - 1] <= v), n: types.length, title: document.querySelector('.g-status-island__text').textContent }
    })
    expect(r).toEqual({ scrolls: true, closeVisible: true, inViewport: true, sorted: true, n: 9, title: 'Pendiente (9)' })
    expect(errs).toEqual([])
  })

  for (const width of [1280, 375]) {
    test(`cabecera fija (.pg-bar) a ${width}px: el titular no solapa ningún control (offset.top del gestor, medido con ResizeObserver)`, async ({ page }) => {
      const errs = watchConsole(page)
      await away(page)
      await open(page, { width, height: 800, seed: false })
      await page.evaluate(() => { window.gStatus.configure({ duration: false }); window.__st.offline() })
      await rest(page)
      const r = await page.evaluate(() => {
        const bar = document.querySelector('.pg-bar')
        const barBottom = Math.round(bar.getBoundingClientRect().bottom)
        const shape = document.querySelector('.g-status-island__shape').getBoundingClientRect()
        const controls = [...bar.querySelectorAll('button, a[href], select, input, [tabindex]')].filter((c) => c.offsetParent !== null)
        const hits = controls.filter((c) => { const b = c.getBoundingClientRect(); return b.width > 0 && shape.right > b.left && shape.left < b.right && shape.top < b.bottom && shape.bottom > b.top }).map((c) => c.textContent.trim() || c.id || c.tagName)
        return { barBottom, shapeTop: Math.round(shape.top), controls: controls.length, hits }
      })
      expect(r.controls).toBeGreaterThan(3)
      expect(r.hits, 'controles de la cabecera bajo la isla').toEqual([])
      expect(r.shapeTop, 'la isla cuelga por debajo de la cabecera').toBeGreaterThanOrEqual(r.barBottom)
      const top = await page.evaluate(() => { const bar = document.querySelector('.pg-bar'); bar.style.paddingBlock = '40px'; return new Promise((res) => setTimeout(() => res({ h: bar.offsetHeight, shape: document.querySelector('.g-status-island__shape').getBoundingClientRect().top }), 300)) })
      expect(top.shape).toBeGreaterThanOrEqual(top.h)
      expect(errs).toEqual([])
    })
  }

  test('«Alta de paciente»: la marca nace en GFormActions antes de los botones sin mover «Guardar» (Δ 0px)', async ({ page }) => {
    const errs = watchConsole(page)
    await open(page, { seed: false })
    await center(page, '#fm-medium button[value="save"]'); await page.waitForTimeout(150)
    const before = await page.evaluate(() => { const r = document.querySelector('#fm-medium button[value="save"]').getBoundingClientRect(); return [r.left, r.top, r.width, r.height] })
    await page.focus('#fm-medium button[value="save"]')
    await page.evaluate(() => window.gStatus.error('fm-save', 'No se pudo guardar al paciente', { origin: { label: 'Ir al formulario', target: 'fm-medium' } }))
    await page.waitForSelector('#fm-save-mark'); await page.waitForTimeout(400)
    const after = await page.evaluate(() => { const r = document.querySelector('#fm-medium button[value="save"]').getBoundingClientRect(); const m = document.getElementById('fm-save-mark'); return { box: [r.left, r.top, r.width, r.height], inActions: !!m.closest('.g-form-actions'), inStatus: !!m.closest('[role="status"]'), tag: m.tagName, text: m.textContent } })
    expect(after.box).toEqual(before)
    expect(after).toMatchObject({ inActions: true, inStatus: false, tag: 'BUTTON', text: 'Error: No se guardó' })
    expect(await page.evaluate(() => document.activeElement.value)).toBe('save')
    expect(errs).toEqual([])
  })
})

test.describe('isla de estado · toque (#703)', () => {
  test.use({ hasTouch: true })
  test('primer toque en el titular = asomo (no abre la lista) y pausa; la acción no queda bajo el dedo (2.5.2); segundo toque = lista; tocar fuera cierra el asomo', async ({ page }) => {
    const errs = watchConsole(page)
    await open(page, { seed: false })
    await page.selectOption('#st-save-fails', 'always')
    await center(page, '#st-save')
    await page.click('#st-save')
    await rest(page)
    const s = await rect(page, SUMMARY)
    const pt = { x: s.left + s.width / 2, y: s.top + s.height / 2 }
    await page.touchscreen.tap(pt.x, pt.y)
    await page.waitForTimeout(400)
    expect(await form(page)).toBe('line')
    await expect(page.locator('.g-status-island')).toHaveClass(/is-peek/)
    await expect(page.locator('.g-status-island')).toHaveClass(/is-paused/)
    const a = await rect(page, '.g-status-island__peek .g-status-island__action')
    expect(pt.x >= a.left && pt.x <= a.right && pt.y >= a.top && pt.y <= a.bottom, 'la acción no queda bajo el primer toque').toBe(false)
    await page.touchscreen.tap(pt.x, pt.y)
    await page.waitForTimeout(300)
    expect(await form(page)).toBe('list')
    await page.evaluate(() => window.gStatus.close())
    await empty(page)
    await page.evaluate(() => window.gStatus.announce('st-save'))
    await rest(page)
    await page.touchscreen.tap(pt.x, pt.y)
    await page.waitForTimeout(300)
    await expect(page.locator('.g-status-island')).toHaveClass(/is-peek/)
    const f = await rect(page, '#st-cliente')
    await page.touchscreen.tap(f.left + 8, f.top + 8)
    await page.waitForTimeout(300)
    await expect(page.locator('.g-status-island')).not.toHaveClass(/is-peek/)
    expect(errs).toEqual([])
  })
})
