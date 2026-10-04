// Isla de estado (design/contracts/status.md «Verificación»; DECISIONS.md #315 a #328) sobre los COMPONENTES REALES del
// playground (packages/vue/playground, sección #sec-status, entrada @grana/vue/status por dist/status.umd.js, global
// GranaStatus), en Chromium, Firefox y WebKit. Port de design/lab/alert/r02/verificar.mjs (kiwi, concepto B, 56/56).
// Casos: 0 anuncios al cargar; un anuncio por suceso sin duplicados entre regiones vivas; foco que no se mueve y Δ0 de
// la página; reintentar → éxito en el mismo nodo; marca → isla → origen; Alt+F8, Esc y descartar; lo grave no abre si
// taparía; borde compartido voz → isla → avisos; traslado al GDialog y vuelta; hoja móvil; RTL; movimiento reducido.
import { test, expect } from '@playwright/test'

const PAGE = '/packages/vue/playground/index.html'
const ERR = 'Error: No se pudo guardar la factura. El servidor no respondió; tus datos siguen en el formulario.'

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
const press = async (page, sel) => { await page.focus(sel); await page.keyboard.press('Enter') }
// El elemento queda en el 70 % del alto del visor (no al centro): la isla del playground cuelga bajo la cabecera fija
// (offset.top) y abierta llega más abajo; con el elemento al centro taparía el campo en uso y no se abriría sola (#319)
const center = (page, sel) => page.evaluate((s) => { document.querySelector(s).scrollIntoView({ block: 'center' }); scrollBy(0, -0.2 * innerHeight) }, sel)
// El `li` de una condición (su id interno no es el de la aplicación): se busca por su título actual
const itemSel = async (page, id) => '#' + await page.evaluate((i) => [...document.querySelectorAll('.g-status-item')].find((li) => li.querySelector('.g-status-item__title').textContent.endsWith(window.gStatus.get(i).title)).id, id)
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
const overlap = (page, a, b) => page.evaluate(([x, y]) => {
  const i = document.querySelector(x).getBoundingClientRect(); const s = document.querySelector(y).getBoundingClientRect()
  return s.right > i.left && s.left < i.right && s.top < i.bottom && s.bottom > i.top
}, [a, b])
const SHAPE = '.g-status-island__shape'
const SUMMARY = '.g-status-island__summary'

test.describe('isla de estado · playground (status.md)', () => {
  test('entrada propia (#328): Grana no trae la isla; GranaStatus sí, registra sus componentes y toma lo compartido de Grana', async ({ page }) => {
    const errs = watchConsole(page)
    await open(page)
    const r = await page.evaluate(() => ({
      main: ['createStatus', 'useStatus', 'statusKey', 'GStatusIsland', 'GStatusMark', 'GStatus'].filter((k) => k in window.Grana),
      own: Object.keys(window.GranaStatus).sort(),
      shared: typeof window.Grana.__shared['utils/edgeReserve.js'].edgeReserve
    }))
    expect(r.main).toEqual([])
    expect(r.own).toEqual(['GStatus', 'GStatusIsland', 'GStatusMark', 'createStatus', 'statusKey', 'useStatus'])
    expect(r.shared).toBe('function')
    expect(errs).toEqual([])
  })

  test('carga: 0 anuncios, raíz en la capa superior con sus dos canales vacíos, región con nombre y nada es región viva', async ({ page }) => {
    const errs = watchConsole(page)
    await open(page)
    await page.waitForTimeout(400)
    expect(await live(page), 'lo que existe al montar no se anuncia').toEqual([])
    const r = await page.evaluate(() => {
      const root = document.querySelector('.g-status-island')
      return {
        parent: root.parentElement.tagName, popover: root.matches(':popover-open'), form: root.dataset.form, type: root.dataset.type, align: root.dataset.align,
        lives: [...root.querySelectorAll(':scope > .g-status-island__live')].map((l) => [l.getAttribute('role'), l.textContent]),
        liveInside: root.querySelectorAll('.g-status-island__shape :is([role=alert],[role=status],[aria-live]:not([aria-live=off]))').length,
        count: window.gStatus.state.count, expanded: root.querySelector('.g-status-island__summary').getAttribute('aria-expanded'),
        keys: root.querySelector('.g-status-island__summary').getAttribute('aria-keyshortcuts')
      }
    })
    expect(r).toEqual({ parent: 'BODY', popover: true, form: 'compact', type: 'error', align: 'center', lives: [['status', ''], ['alert', '']], liveInside: 0, count: 2, expanded: 'false', keys: 'Alt+F8' })
    expect(await page.locator('.g-status-island').ariaSnapshot()).toMatch(/region "Estado de la aplicación \(Alt\+F8\)"/)
    expect(await page.locator(SUMMARY).ariaSnapshot()).toMatch(/button "Estado: 2 avisos\. Error: No se pudieron cargar las facturas ?y 1 más"/)
    // La marca del origen (hueco de las filas, #327) existe y no anuncia
    await expect(page.locator('#st-table-region button#st-table-mark.g-status-mark--link')).toHaveText(/No se pudieron cargar/)
    expect(errs).toEqual([])
  })

  test('error al guardar: 1 anuncio enérgico, el foco sigue en «Guardar», Δ0 en la página, la isla se abre sola sin tapar y la marca nace en la fila del botón', async ({ page, browserName }) => {
    const errs = watchConsole(page)
    const TOL = browserName === 'webkit' ? 1.5 : 1
    await open(page)
    const t0 = await tops(page)
    await center(page, '#st-save'); await page.waitForTimeout(80)
    const y0 = await page.evaluate(() => scrollY)
    await page.focus('#st-save')
    await startSample(page, '#st-save', 900)
    await page.keyboard.press('Enter')
    const d = await endSample(page)
    const lv = await live(page)
    expect(lv).toEqual([{ text: ERR, ch: 'assertive', host: 'body' }])
    expect(await act(page)).toBe('st-save')
    expect(d, `el botón con foco no se mueve en ningún cuadro (Δ ${d.toFixed(2)}px)`).toBeLessThanOrEqual(TOL)
    expect(await tops(page), 'nada de la página cambia de sitio').toEqual(t0)
    expect(await page.evaluate(() => scrollY)).toBe(y0)
    expect(await form(page)).toBe('open')
    await expect(page.locator(SUMMARY)).toHaveAttribute('aria-expanded', 'true')
    expect(await overlap(page, SHAPE, '#st-save'), 'la isla abierta no tapa el control con foco (2.4.11)').toBe(false)
    const mark = await page.evaluate(() => {
      const m = document.getElementById('st-save-mark').getBoundingClientRect(); const s = document.getElementById('st-save').getBoundingClientRect()
      return { tag: document.getElementById('st-save-mark').tagName, dy: Math.abs(m.top + m.height / 2 - s.top - s.height / 2), before: m.right <= s.left + 1, text: document.getElementById('st-save-mark').textContent }
    })
    expect(mark.tag).toBe('BUTTON')
    expect(mark.dy).toBeLessThan(2)
    expect(mark.before).toBe(true)
    expect(mark.text).toBe('Error: No se guardó')
    // Segundo fallo idéntico: se reanuncia (announce) y sigue sin mover el foco
    await page.waitForTimeout(200)
    await page.keyboard.press('Enter'); await page.waitForTimeout(200)
    expect((await live(page)).filter((x) => x.text === ERR)).toHaveLength(2)
    expect(await act(page)).toBe('st-save')
    expect(await noRepeats(page), 'ningún texto repetido entre las regiones vivas').toBe(true)
    expect(errs).toEqual([])
  })

  test('reintentar → éxito en el MISMO nodo; el foco no cae al body; no se cierra solo; «Entendido» → punto con nombre', async ({ page }) => {
    const errs = watchConsole(page)
    await open(page)
    await center(page, '#st-save'); await press(page, '#st-save'); await page.waitForTimeout(300)
    const li = await itemSel(page, 'st-save')
    await page.evaluate((s) => { window.__item = document.querySelector(s); window.__st.saveFails = false }, li)
    const n0 = (await live(page)).length
    await press(page, `${li} .g-status-item__action`)
    // Reintentando: busy en el aviso, botón enfocable con aria-disabled y busyLabel, la marca gira con él
    await expect(page.locator(li)).toHaveAttribute('aria-busy', 'true')
    const busy = await page.evaluate((s) => {
      const b = document.querySelector(`${s} .g-status-item__action`); const m = document.getElementById('st-save-mark')
      return { dis: b.getAttribute('aria-disabled'), native: b.disabled, text: b.textContent.trim(), focus: document.activeElement === b, mark: m.classList.contains('is-busy') && m.getAttribute('aria-busy') === 'true', markText: m.textContent, btnStatus: !!b.querySelector('.g-btn__status') }
    }, li)
    expect(busy).toEqual({ dis: 'true', native: false, text: 'Reintentando…', focus: true, mark: true, markText: 'Error: Reintentando…', btnStatus: false })
    await page.waitForFunction(() => window.gStatus.get('st-save').type === 'success'); await page.waitForTimeout(300)
    const lv = (await live(page)).slice(n0)
    // El resumen muestra otra condición (el error de la tabla): el desenlace se anuncia, una vez y cortés
    expect(lv).toEqual([{ text: 'Reintentando…', ch: 'polite', host: 'body' }, { text: 'Correcto: Factura guardada con el folio F-0042', ch: 'polite', host: 'body' }])
    expect(await act(page), 'el foco pasa al resumen, no al body').toBe('g-status-island__summary')
    const same = await page.evaluate((s) => ({ same: window.__item === document.querySelector(s), type: window.__item.dataset.type, connected: window.__item.isConnected, busy: window.__item.hasAttribute('aria-busy'), action: !!window.__item.querySelector('.g-status-item__action'), link: window.__item.querySelector('a.g-status-item__link')?.getAttribute('href'), mark: document.getElementById('st-save-mark').dataset.type, markText: document.getElementById('st-save-mark').textContent }), li)
    expect(same).toEqual({ same: true, type: 'success', connected: true, busy: false, action: false, link: '#f-0042', mark: 'success', markText: 'Correcto: Guardada' })
    await page.waitForTimeout(900)
    expect(await form(page), 'no se cierra solo').toBe('open')
    expect(await page.evaluate(() => window.gStatus.has('st-save'))).toBe(true)
    // Reconocer: el resultado se retira, las condiciones se quedan y la isla pasa a punto conservando su nombre
    const n1 = (await live(page)).length
    await press(page, '.g-status-island__ack'); await page.waitForTimeout(400)
    expect(await form(page)).toBe('dot')
    expect(await act(page)).toBe('g-status-island__summary')
    expect(await page.evaluate(() => [window.gStatus.has('st-save'), window.gStatus.state.count, !!document.getElementById('st-save-mark')])).toEqual([false, 2, false])
    expect(await page.locator(SUMMARY).ariaSnapshot()).toMatch(/button "Estado: 2 avisos\. Error: No se pudieron cargar las facturas/)
    const dot = await page.evaluate(() => { const r = document.querySelector('.g-status-island__shape').getBoundingClientRect(); return [r.width, r.height] })
    expect(dot[0]).toBeLessThan(60)
    expect((await live(page)).length, 'reconocer no anuncia').toBe(n1)
    expect(errs).toEqual([])
  })

  test('marca → isla → origen sin anuncios; el reintento de la tabla trae las filas y el foco no cae al body', async ({ page }) => {
    const errs = watchConsole(page)
    await open(page)
    await center(page, '#st-table-mark')
    await press(page, '#st-table-mark'); await page.waitForTimeout(350)
    const li = await itemSel(page, 'st-table')
    expect(await form(page)).toBe('open')
    await expect(page.locator('#st-table-mark')).toHaveAttribute('aria-expanded', 'true')
    expect(await page.evaluate((s) => document.activeElement === document.querySelector(`${s} .g-status-item__action`), li), 'la marca abre la isla en su aviso y enfoca su acción').toBe(true)
    await press(page, `${li} .g-status-item__origin`); await page.waitForTimeout(250)
    expect(await act(page)).toBe('st-table-region')
    expect(await form(page)).toBe('compact')
    // Vuelta con el atajo desde la marca
    await page.focus('#st-table-mark'); await page.keyboard.press('Enter'); await page.waitForTimeout(250)
    await page.keyboard.press('Alt+F8'); await page.waitForTimeout(150)
    expect(await act(page), 'Alt+F8 devuelve el foco a la marca').toBe('st-table-mark')
    expect(await live(page), 'abrir, replegar e ir al origen no anuncian nada').toEqual([])
    // Reintentar: llegan las filas, la condición declarativa se retira con su vista y el foco queda en la isla
    await page.keyboard.press('Enter'); await page.waitForTimeout(250)
    await page.keyboard.press('Enter')
    await page.waitForFunction(() => document.querySelectorAll('#st-table-region tbody tr').length >= 2 && !window.gStatus.has('st-table'))
    await page.waitForTimeout(250)
    expect(await act(page)).not.toBe('BODY')
    expect(await page.evaluate(() => !!document.getElementById('st-table-mark'))).toBe(false)
    // Un fallo posterior se anuncia (enérgico) y no mueve el foco
    await center(page, '#st-table-break')
    const n = (await live(page)).length
    await press(page, '#st-table-break'); await page.waitForTimeout(300)
    const lv = (await live(page)).slice(n)
    expect(lv).toEqual([{ text: 'Error: No se pudieron cargar las facturas. El servidor tardó demasiado en responder.', ch: 'assertive', host: 'body' }])
    expect(await act(page)).toBe('st-table-break')
    expect(errs).toEqual([])
  })

  test('condición de página: un anuncio cortés, ni el foco ni la página se mueven; se resuelve en el sitio; cuenta atrás visible que no es región viva', async ({ page, browserName }) => {
    const errs = watchConsole(page)
    const TOL = browserName === 'webkit' ? 1.5 : 1
    await open(page, { seed: false })
    expect(await form(page)).toBe('empty')
    await center(page, '#st-offline'); await page.waitForTimeout(80)
    await page.focus('#st-offline')
    await startSample(page, '#st-offline', 700)
    await page.keyboard.press('Enter')
    const d = await endSample(page)
    let lv = await live(page)
    expect(lv).toEqual([{ text: 'Advertencia: Sin conexión. Los cambios se guardarán al volver.', ch: 'polite', host: 'body' }])
    expect(await act(page)).toBe('st-offline')
    expect(d).toBeLessThanOrEqual(TOL)
    expect(await form(page), 'lo no grave no abre la isla').toBe('compact')
    await page.evaluate(() => { window.__item = document.querySelector('.g-status-item') })
    await press(page, '#st-online'); await page.waitForTimeout(300)
    lv = await live(page)
    expect(lv).toHaveLength(2)
    expect(lv[1]).toEqual({ text: 'Correcto: Conexión restablecida. Los cambios se guardarán al volver.', ch: 'polite', host: 'body' })
    expect(await page.evaluate(() => window.__item === document.querySelector('.g-status-item') && window.__item.dataset.type === 'success')).toBe(true)
    expect(await noRepeats(page)).toBe(true)
    // Cuenta atrás: role="timer" con aria-live="off", cifras visibles; el umbral de 30 s se anuncia una vez (cortés)
    await press(page, '#st-session-short'); await page.waitForTimeout(300)
    const timer = await page.evaluate(() => { const t = document.querySelector('.g-status-island__timer'); return t ? [t.getAttribute('role'), t.getAttribute('aria-live'), /^0:3\d$/.test(t.textContent), t.getClientRects().length > 0] : null })
    expect(timer).toEqual(['timer', 'off', true, true])
    await page.waitForFunction(() => window.__live.some((x) => x.text === 'Quedan 0:30'), null, { timeout: 8000 })
    await page.waitForTimeout(1500)
    expect((await live(page)).filter((x) => x.text === 'Quedan 0:30')).toEqual([{ text: 'Quedan 0:30', ch: 'polite', host: 'body' }])
    expect(await act(page)).toBe('st-session-short')
    expect(errs).toEqual([])
  })

  test('teclado: Enter abre y repliega, Esc repliega y deja el foco en el resumen, Alt+F8 va y vuelve, descartar no pierde el foco', async ({ page }) => {
    const errs = watchConsole(page)
    await open(page)
    await press(page, SUMMARY); await page.waitForTimeout(250)
    expect(await form(page)).toBe('open')
    await page.keyboard.press('Enter'); await page.waitForTimeout(250)
    expect(await form(page)).toBe('compact')
    await page.keyboard.press('Enter'); await page.waitForTimeout(250)
    await page.focus('.g-status-island__ack') // (Tab no llega a los botones en WebKit sin la opción del sistema)
    await page.keyboard.press('Escape'); await page.waitForTimeout(250)
    expect(await form(page)).toBe('compact')
    expect(await act(page)).toBe('g-status-island__summary')
    // Atajo
    await center(page, '#st-field')
    await page.focus('#st-field'); await page.keyboard.press('Alt+F8'); await page.waitForTimeout(250)
    const there = await act(page)
    expect([there, await form(page)]).toEqual(['g-status-island__summary', 'open'])
    await page.keyboard.press('Alt+F8'); await page.waitForTimeout(250)
    expect([await act(page), await form(page)]).toEqual(['st-field', 'compact'])
    // Descartar una condición informativa: solo ella; el foco va al resumen
    await page.keyboard.press('Alt+F8'); await page.waitForTimeout(250)
    const n0 = await page.locator('.g-status-item').count()
    const maint = await itemSel(page, 'maint')
    await expect(page.locator(`${maint} .g-status-item__dismiss`)).toHaveAttribute('aria-label', 'Descartar: Mantenimiento programado esta noche')
    await press(page, `${maint} .g-status-item__dismiss`); await page.waitForTimeout(250)
    expect(await page.locator('.g-status-item').count()).toBe(n0 - 1)
    expect(await act(page)).toBe('g-status-island__summary')
    // Pulsar fuera repliega sin mover el foco
    expect(await form(page)).toBe('open')
    await page.mouse.click(30, 700); await page.waitForTimeout(250)
    expect(await form(page)).toBe('compact')
    // Controles ≥ 24×24 (abierta)
    await press(page, SUMMARY); await page.waitForTimeout(300)
    const small = await page.evaluate(() => [...document.querySelectorAll('.g-status-island__summary, .g-status-island .g-btn, .g-status-mark--link')].filter((x) => x.getClientRects().length).map((x) => { const r = x.getBoundingClientRect(); return [x.className.split(' ')[0], Math.round(r.width), Math.round(r.height)] }).filter((x) => x[1] < 24 || x[2] < 24))
    expect(small).toEqual([])
    expect(await live(page), 'nada de esto anuncia').toEqual([])
    expect(errs).toEqual([])
  })

  test('sin condiciones Alt+F8 no se intercepta; lo grave NO abre la isla si taparía el campo en uso (da el toque)', async ({ page }) => {
    const errs = watchConsole(page)
    await open(page, { seed: false })
    await page.focus('#st-field')
    const prevented = await page.evaluate(() => new Promise((res) => {
      document.addEventListener('keydown', (e) => setTimeout(() => res(e.defaultPrevented), 0), { once: true })
      document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'F8', altKey: true, bubbles: true, cancelable: true }))
    }))
    expect(prevented).toBe(false)
    // El campo «Cliente» queda justo debajo de la isla: abrirla lo taparía
    await page.evaluate(() => { document.querySelector('.pg-bar').style.position = 'static'; const el = document.getElementById('st-cliente'); window.scrollTo(0, el.getBoundingClientRect().top + scrollY - 70) })
    await page.waitForTimeout(100)
    await page.focus('#st-cliente')
    await page.evaluate(() => { window.__nudged = false; new MutationObserver(() => { if (document.querySelector('.g-status-island').classList.contains('is-nudge')) window.__nudged = true }).observe(document.querySelector('.g-status-island'), { attributes: true, attributeFilter: ['class'] }) })
    await page.evaluate(() => window.gStatus.info('pre', 'Aviso previo'))
    await page.waitForTimeout(300)
    await page.keyboard.press('Enter') // envía el formulario: el servidor falla
    await page.waitForFunction(() => window.gStatus.has('st-save')); await page.waitForTimeout(500)
    expect(await form(page)).toBe('compact')
    expect(await act(page)).toBe('st-cliente')
    await expect(page.locator(SUMMARY)).toContainText('No se pudo guardar la factura')
    expect(await page.evaluate(() => window.__nudged), 'da el toque').toBe(true)
    await expect(page.locator('.g-status-island')).not.toHaveClass(/is-nudge/)
    expect((await live(page)).filter((x) => x.ch === 'assertive')).toHaveLength(1)
    expect(errs).toEqual([])
  })

  test('borde compartido: pill de voz → isla → aviso de GToaster (top-center); la isla no se mueve al llegar el aviso', async ({ page }) => {
    const errs = watchConsole(page)
    await open(page, { query: '&speech=self' })
    const top0 = await page.evaluate((s) => document.querySelector(s).getBoundingClientRect().top, SHAPE)
    await page.evaluate(() => window.speech.start({ mode: 'conversation' }))
    await page.waitForFunction(() => /listening|speech|transcribing/.test(window.speech.state.status))
    // La cabecera del playground es fija y lleva la pill colocada: se suelta para que, al desplazar, salga del visor y
    // la visible sea la flotante del anfitrión, arriba al centro
    await page.evaluate(() => { document.querySelector('.pg-bar').style.position = 'static' })
    await center(page, '#st-save')
    await page.waitForFunction(() => { const f = document.querySelector('.g-speech-host__float'); return f && !f.hidden && f.getBoundingClientRect().height > 0 })
    await page.waitForTimeout(500)
    const a = await page.evaluate((s) => {
      const f = document.querySelector('.g-speech-host__float').getBoundingClientRect(); const i = document.querySelector(s).getBoundingClientRect()
      return { edge: document.querySelector('.g-speech-host').dataset.edge, pillBottom: f.bottom, islandTop: i.top, islandBottom: i.bottom, offset: document.querySelector('.g-status-island').style.getPropertyValue('--_status-offset-top') }
    }, SHAPE)
    expect(a.edge).toBe('top')
    expect(a.offset).toMatch(/^calc\(/)
    expect(a.islandTop, 'la isla queda debajo de la pill de voz').toBeGreaterThanOrEqual(a.pillBottom)
    expect(a.islandTop).toBeGreaterThan(top0)
    await page.evaluate(() => { window.toaster.configure({ position: 'top-center' }); window.toaster.success('Borrador guardado') })
    await page.waitForSelector('.g-toast[data-state="visible"]'); await page.waitForTimeout(500)
    const b = await page.evaluate((s) => ({ islandTop: document.querySelector(s).getBoundingClientRect().top, islandBottom: document.querySelector(s).getBoundingClientRect().bottom, toastTop: document.querySelector('.g-toast').getBoundingClientRect().top }), SHAPE)
    expect(b.toastTop, 'el aviso flotante queda debajo de la isla replegada').toBeGreaterThanOrEqual(b.islandBottom)
    expect(b.islandTop).toBe(a.islandTop)
    // Sin voz, la isla vuelve a su sitio y el aviso sigue debajo
    await page.evaluate(() => window.speech.discard ? window.speech.discard({ confirm: false }) : window.speech.cancel())
    await page.waitForFunction((t) => Math.abs(document.querySelector('.g-status-island__shape').getBoundingClientRect().top - t) < 1, top0, { timeout: 5000 }).catch(() => {})
    await page.evaluate(() => window.speech.state.status)
    expect(errs).toEqual([])
  })

  test('diálogo: la advertencia de la vista no se anuncia, la isla se traslada al GDialog (mismos nodos y estado), Esc en la isla no lo cierra y vuelve al cerrarse', async ({ page }) => {
    const errs = watchConsole(page)
    await open(page)
    await page.evaluate(() => window.gStatus.acknowledge()); await page.waitForTimeout(200)
    await page.evaluate(() => { window.__root = document.querySelector('.g-status-island'); window.__li = document.querySelector('.g-status-item') })
    await center(page, '#st-dialog')
    await press(page, '#st-dialog'); await page.waitForSelector('#st-dlg[open] #st-dlg-mark'); await page.waitForTimeout(450)
    expect(await live(page)).toEqual([])
    expect(await act(page), 'el foco sigue la regla de GDialog').toBe('st-dlg-name')
    const inside = await page.evaluate(() => { const r = document.querySelector('.g-status-island'); const s = r.querySelector('.g-status-island__shape').getBoundingClientRect(); return { same: r === window.__root && window.__li === r.querySelector('.g-status-item'), parent: r.parentElement.id, open: r.matches(':popover-open'), visible: s.width > 0 && s.height > 0, form: r.dataset.form, lives: r.querySelectorAll(':scope > .g-status-island__live').length } })
    expect(inside).toEqual({ same: true, parent: 'st-dlg', open: true, visible: true, form: 'dot', lives: 2 })
    // Marca de texto: estática, sin región viva
    expect(await page.evaluate(() => { const m = document.getElementById('st-dlg-mark'); return [m.tagName, m.querySelector('p.g-status-mark__text').textContent, m.querySelectorAll('[aria-live],[role=status],[role=alert]').length] })).toEqual(['DIV', 'Advertencia: Esta factura ya se envió al cliente.', 0])
    // Una condición nueva dentro del modal: un anuncio, por los canales que viajaron con la isla
    await press(page, '#st-dlg-offline'); await page.waitForTimeout(300)
    expect(await live(page)).toEqual([{ text: 'Advertencia: Sin conexión. Los cambios se guardarán al volver.', ch: 'polite', host: 'dialog' }])
    // La isla es operable dentro del modal; Esc la repliega sin cerrar el diálogo
    await press(page, SUMMARY); await page.waitForTimeout(300)
    expect(await form(page)).toBe('open')
    await page.keyboard.press('Escape'); await page.waitForTimeout(300)
    expect(await page.evaluate(() => [document.getElementById('st-dlg').open, document.querySelector('.g-status-island').dataset.form])).toEqual([true, 'compact'])
    expect(await act(page)).toBe('g-status-island__summary')
    await page.keyboard.press('Escape'); await page.waitForTimeout(600)
    const back = await page.evaluate(() => { const r = document.querySelector('.g-status-island'); return { same: r === window.__root, parent: r.parentElement.tagName, open: r.matches(':popover-open'), count: window.gStatus.state.count, dlg: document.getElementById('st-dlg').open } })
    expect(back).toEqual({ same: true, parent: 'BODY', open: true, count: 3, dlg: false })
    expect((await live(page)).length, 'el traslado no anuncia').toBe(1)
    expect(errs).toEqual([])
  })

  test('320px: nada se desborda ni se mueve; lo grave no abre nada solo; la isla abre una hoja inferior modal (GDialog real) y Esc devuelve el foco', async ({ page, browserName }) => {
    const errs = watchConsole(page)
    const TOL = browserName === 'webkit' ? 1.5 : 1
    await open(page, { width: 320, height: 700 })
    await expect(page.locator('.g-status-island')).toHaveAttribute('data-mobile', '')
    await center(page, '#st-save'); await page.waitForTimeout(80)
    await page.focus('#st-save')
    await startSample(page, '#st-save', 900)
    await page.keyboard.press('Enter')
    const d = await endSample(page)
    expect(d).toBeLessThanOrEqual(TOL)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320)
    const r = await page.evaluate((s) => { const i = document.querySelector(s).getBoundingClientRect(); return [i.left, i.right] }, SHAPE)
    expect(r[0]).toBeGreaterThanOrEqual(0)
    expect(r[1]).toBeLessThanOrEqual(320)
    expect(await page.evaluate(() => !document.querySelector('dialog[open]')), 'una hoja modal tomaría el foco: no se abre sola').toBe(true)
    expect(await act(page)).toBe('st-save')
    expect((await live(page)).filter((x) => x.ch === 'assertive')).toHaveLength(1)
    const s = await page.evaluate(() => { const b = document.querySelector('.g-status-island__summary'); return [b.getAttribute('aria-haspopup'), b.hasAttribute('aria-controls'), b.getAttribute('aria-expanded')] })
    expect(s).toEqual(['dialog', false, 'false'])
    await press(page, SUMMARY); await page.waitForSelector('dialog.g-status-sheet[open] .g-status-item'); await page.waitForTimeout(500)
    const sheet = await page.evaluate(() => { const dlg = document.querySelector('dialog.g-status-sheet'); return { modal: dlg.matches(':modal'), focus: dlg.contains(document.activeElement), items: dlg.querySelectorAll('.g-status-item').length, bottom: dlg.getBoundingClientRect().bottom >= innerHeight - 1, fits: dlg.scrollWidth <= 320 && document.documentElement.scrollWidth <= 320, ack: !!dlg.querySelector('.g-status-island__ack'), form: document.querySelector('.g-status-island').dataset.form, rootParent: document.querySelector('.g-status-island').parentElement.tagName } })
    expect(sheet).toEqual({ modal: true, focus: true, items: 3, bottom: true, fits: true, ack: true, form: 'open', rootParent: 'BODY' })
    await page.keyboard.press('Escape'); await page.waitForTimeout(600)
    expect(await page.evaluate(() => !document.querySelector('dialog[open]'))).toBe(true)
    expect(await act(page)).toBe('g-status-island__summary')
    // La marca abre la hoja en su condición con el foco en su acción y, al cerrarse, el foco vuelve a la marca
    await press(page, '#st-save-mark'); await page.waitForSelector('dialog.g-status-sheet[open] .g-status-item'); await page.waitForTimeout(500)
    expect(await page.evaluate(() => document.activeElement.classList.contains('g-status-item__action') && document.activeElement.closest('.g-status-item').dataset.type === 'error')).toBe(true)
    await page.keyboard.press('Escape'); await page.waitForTimeout(600)
    expect(await act(page)).toBe('st-save-mark')
    expect(errs).toEqual([])
  })

  test('RTL: la isla sigue centrada, la insignia va al inicio y nada se desborda', async ({ page }) => {
    const errs = watchConsole(page)
    await open(page, { rtl: true })
    await center(page, '#st-save'); await press(page, '#st-save'); await page.waitForTimeout(600)
    const r = await page.evaluate((s) => { const i = document.querySelector(s).getBoundingClientRect(); const b = document.querySelector('.g-status-island__badge').getBoundingClientRect(); const t = document.querySelector('.g-status-island__text').getBoundingClientRect(); return { center: Math.abs((i.left + i.right) / 2 - innerWidth / 2), badgeAtStart: b.left > t.left, overflow: document.documentElement.scrollWidth <= innerWidth, form: document.querySelector('.g-status-island').dataset.form } }, SHAPE)
    expect(r.center).toBeLessThanOrEqual(8)
    expect(r.badgeAtStart).toBe(true)
    expect(r.overflow).toBe(true)
    expect(r.form).toBe('open')
    expect(errs).toEqual([])
  })

  test('movimiento reducido: sin animaciones en curso ni saltos; los anuncios no cambian; el toque no deja la clase puesta', async ({ page, browserName }) => {
    const errs = watchConsole(page)
    const TOL = browserName === 'webkit' ? 1.5 : 1
    await open(page, { motion: 'reduce' })
    await center(page, '#st-save'); await page.waitForTimeout(80)
    await page.focus('#st-save')
    await startSample(page, '#st-save', 500)
    await page.keyboard.press('Enter')
    const d = await endSample(page)
    expect(d).toBeLessThanOrEqual(TOL)
    expect(await page.evaluate(() => document.querySelector('.g-status-island').getAnimations({ subtree: true }).filter((x) => x.playState === 'running').length)).toBe(0)
    expect(await live(page)).toEqual([{ text: ERR, ch: 'assertive', host: 'body' }])
    expect(await form(page)).toBe('open')
    // Toque (isla replegada, llega una condición nueva): sin animación no hay animationend y la clase se retira sola
    await page.keyboard.press('Alt+F8'); await page.keyboard.press('Alt+F8'); await page.waitForTimeout(200)
    expect(await form(page)).toBe('compact')
    await page.evaluate(() => window.__st.offline()); await page.waitForTimeout(400)
    await expect(page.locator('.g-status-island')).not.toHaveClass(/is-nudge/)
    expect(errs).toEqual([])
  })

  test('más de 6 condiciones: el panel desplaza, «Entendido» queda a la vista y el orden es por gravedad', async ({ page }) => {
    const errs = watchConsole(page)
    await open(page, { height: 600 })
    await page.evaluate(() => window.__st.many()); await page.waitForTimeout(600)
    expect(await page.evaluate(() => window.gStatus.state.count)).toBe(9)
    if ((await form(page)) !== 'open') { await press(page, SUMMARY); await page.waitForTimeout(500) }
    const r = await page.evaluate(() => {
      const list = document.querySelector('.g-status-island__list'); const ack = document.querySelector('.g-status-island__ack').getBoundingClientRect(); const s = document.querySelector('.g-status-island__shape').getBoundingClientRect()
      const order = { error: 0, warning: 1, info: 2, success: 3 }
      const types = [...document.querySelectorAll('.g-status-item')].map((li) => order[li.dataset.type])
      return { scrolls: list.scrollHeight > list.clientHeight, ackVisible: ack.bottom <= innerHeight && ack.top >= 0, inViewport: s.bottom <= innerHeight, sorted: types.every((v, i) => i === 0 || types[i - 1] <= v), more: document.querySelector('.g-status-island__more [aria-hidden]').textContent }
    })
    expect(r).toEqual({ scrolls: true, ackVisible: true, inViewport: true, sorted: true, more: '+8' })
    expect(errs).toEqual([])
  })

  for (const width of [1280, 375]) {
    test(`cabecera fija (.pg-bar) a ${width}px: la isla replegada no solapa ningún control (offset.top del gestor, medido con ResizeObserver)`, async ({ page }) => {
      const errs = watchConsole(page)
      await open(page, { width, height: 800 })
      const r = await page.evaluate(() => {
        const bar = document.querySelector('.pg-bar')
        const barBottom = Math.round(bar.getBoundingClientRect().bottom)
        const shape = document.querySelector('.g-status-island__shape').getBoundingClientRect()
        const controls = [...bar.querySelectorAll('button, a[href], select, input, [tabindex]')].filter((c) => c.offsetParent !== null)
        const hits = controls.filter((c) => { const b = c.getBoundingClientRect(); return b.width > 0 && shape.right > b.left && shape.left < b.right && shape.top < b.bottom && shape.bottom > b.top }).map((c) => c.textContent.trim() || c.id || c.tagName)
        return { form: document.querySelector('.g-status-island').dataset.form, barBottom, shapeTop: Math.round(shape.top), controls: controls.length, hits }
      })
      expect(r.form).toBe('compact')
      expect(r.controls).toBeGreaterThan(3)
      expect(r.hits, 'controles de la cabecera bajo la isla').toEqual([])
      expect(r.shapeTop, 'la isla cuelga por debajo de la cabecera').toBeGreaterThanOrEqual(r.barBottom)
      // Sigue a la cabecera si cambia de alto (se parte en filas): el offset es su alto actual
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
