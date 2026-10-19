// GStatusIsland, GStatusMark y GStatus en jsdom (status.md «Verificación», D1 · Cápsula de relevo, #693 a #705): marcado,
// formas y etapas, F1/F2 como regla (sin `transition` en línea; destino medido antes de `grow`; variables borradas al
// vaciarse), interrupciones, lectura y relevo, asomo por puntero, foco y toque, lista, anuncios, foco y teclado, acción en el
// sitio, «vive con su origen», marca y eco, declarativo, traslado al <dialog> modal, hoja móvil y borde compartido.
// La capa superior real, las transiciones, las medidas y los tres motores son de Playwright (tests/status*.spec.mjs).
// En jsdom no hay getAnimations: cada etapa avanza en el cuadro siguiente; donde una prueba necesita una etapa quieta,
// la forma declara una transición en curso y la prueba lanza su transitionend.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import GStatusIsland from './GStatusIsland.vue'
import GStatusMark from '../GStatusMark/GStatusMark.vue'
import GStatus from '../GStatus/GStatus.vue'
import GDialog from '../GDialog/GDialog.vue'
import { createStatus, INTERNAL } from './status.js'
import { ANNOUNCE } from '../GToast/toaster.js'
import { EDGE_ORDER, clearEdgeReserve, edgeReserve, setEdgeReserve } from '../../utils/edgeReserve.js'

const LABELS = {
  region: 'Estado de la aplicación ({hotkey})', waiting: 'y {count} más en espera', listTitle: 'Pendiente ({count})', hide: 'Ocultar',
  types: { info: 'Información', success: 'Correcto', warning: 'Advertencia', error: 'Error' },
  dismiss: 'Descartar: {title}', details: 'Detalle técnico', copy: 'Copiar', copied: 'Copiado',
  remaining: 'Quedan {time}', sheetTitle: 'Estado de la aplicación', close: 'Cerrar'
}

// jsdom no implementa popover ni showModal ni :modal: se simulan con el mismo contrato (como en GToaster.test.js)
const origMatches = HTMLElement.prototype.matches
let warn
beforeEach(() => {
  HTMLElement.prototype.showPopover = function () { this.setAttribute('data-popover-open', '') }
  HTMLElement.prototype.hidePopover = function () { this.removeAttribute('data-popover-open') }
  HTMLElement.prototype.matches = function (sel) {
    if (sel === ':popover-open') return this.hasAttribute('data-popover-open')
    if (sel === ':modal') return this.hasAttribute('open') && this.hasAttribute('data-modal')
    return origMatches.call(this, sel)
  }
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('data-modal', ''); this.setAttribute('open', '') }
  HTMLDialogElement.prototype.close = function () {
    if (!this.hasAttribute('open')) return
    this.removeAttribute('open')
    this.removeAttribute('data-modal')
    this.dispatchEvent(new Event('close'))
  }
  HTMLElement.prototype.scrollIntoView = function () {}
  // Cada cuadro es un temporizador de 16 ms exactos; frames(n) avanza n cuadros de verdad
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'] })
  vi.stubGlobal('requestAnimationFrame', (cb) => setTimeout(() => cb(Date.now()), 16))
  vi.stubGlobal('cancelAnimationFrame', (id) => clearTimeout(id))
  vi.setSystemTime(new Date('2026-10-04T10:00:00Z'))
  warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
})
afterEach(() => {
  while (wrappers.length) wrappers.pop().unmount()
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  HTMLElement.prototype.matches = origMatches
  document.body.innerHTML = ''
  document.documentElement.style.removeProperty('--g-space-1')
})

const wrappers = []
const flush = async () => { for (let i = 0; i < 4; i++) await nextTick() }
const frames = async (n = 3) => { for (let i = 0; i < n; i++) { vi.advanceTimersByTime(16); await flush() } }
const said = async () => { vi.advanceTimersByTime(ANNOUNCE.delay); await flush() }
const settle = () => frames(3) // caída → ensanche → reposo (en jsdom, un cuadro por etapa)
// Monta la aplicación y espera a is-ready (lo presente al montar empieza a caer)
async function setup(opts = {}, { slot, before, island = true } = {}) {
  const status = createStatus({ labels: LABELS, ...opts })
  if (before) before(status)
  const App = defineComponent({
    setup() {
      return () => h('div', [
        h('input', { id: 'field' }), h('button', { id: 'other' }, 'Otro'), h('div', { id: 'origin' }, 'Origen'),
        slot ? slot(status) : null,
        island ? h(GStatusIsland) : null,
        h('button', { id: 'after' }, 'Después')
      ])
    }
  })
  const w = mount(App, { attachTo: document.body, global: { plugins: [status] } })
  wrappers.push(w)
  await flush()
  await frames(2)
  return { status, w, api: status[INTERNAL] }
}
const $ = (sel) => document.querySelector(sel)
const $$ = (sel) => [...document.querySelectorAll(sel)]
const root = () => $('.g-status-island')
const shape = () => $('.g-status-island__shape')
const summary = () => $('.g-status-island__summary')
const peek = () => $('.g-status-island__peek')
const panel = () => $('.g-status-island__panel')
const items = () => $$('.g-status-item')
const item = (status, id) => document.getElementById(`${root().id}-i-${status[INTERNAL].byId(id).uid}`)
const live = (role) => $(`.g-status-island__live[role="${role}"]`).textContent
const formOf = () => root().getAttribute('data-form')
const stageOf = () => root().getAttribute('data-stage')
const text = () => summary().querySelector('.g-status-island__text').textContent
const key = (k, o = {}) => new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...o })
const altF8 = () => { const e = key('F8', { altKey: true }); (document.activeElement || document.body).dispatchEvent(e); return e }
const warned = (re) => warn.mock.calls.some((c) => re.test(String(c[0])))
const rect = (left, top, width, height) => ({ left, top, width, height, right: left + width, bottom: top + height, x: left, y: top })
// Sucesos de puntero con su tipo (jsdom no tiene PointerEvent)
const ptr = (type, pointerType = 'mouse', bubbles = true) => { const e = new MouseEvent(type, { bubbles, cancelable: true }); Object.defineProperty(e, 'pointerType', { value: pointerType }); return e }
const enter = (el, t = 'mouse') => el.dispatchEvent(ptr('pointerenter', t, false))
const leave = (el, t = 'mouse') => el.dispatchEvent(ptr('pointerleave', t, false))
// Una etapa quieta: la forma declara una transición en curso hasta que la prueba lanza su fin
function holdStages() {
  const el = shape()
  const ctl = { running: true }
  el.getAnimations = () => (ctl.running ? [{ playState: 'running', effect: { getTiming: () => ({ iterations: 1 }) } }] : [])
  ctl.end = async () => { ctl.running = false; el.dispatchEvent(new Event('transitionend')); await frames(1); ctl.running = true }
  return ctl
}
// Graba data-stage en cada cambio
function stageLog() {
  const log = []
  const mo = new MutationObserver(() => { const s = root().getAttribute('data-stage'); if (log[log.length - 1] !== s) log.push(s) })
  mo.observe(root(), { attributes: true, attributeFilter: ['data-stage'] })
  return log
}
// Tamaño natural de __inner (jsdom no hace layout)
function innerSize(w, h) {
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, get() { return this.classList && this.classList.contains('g-status-island__inner') ? w : 0 } })
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, get() { return this.classList && this.classList.contains('g-status-island__inner') ? h : this.classList && this.classList.contains('g-status-island__summary') ? 44 : 0 } })
}
afterEach(() => { delete HTMLElement.prototype.offsetWidth; delete HTMLElement.prototype.offsetHeight })
// Marca «montada»: conectada y con caja (jsdom no da cajas)
const boxed = (el, r = rect(10, 300, 120, 32)) => { el.getClientRects = () => [r]; el.getBoundingClientRect = () => r; return el }

describe('GStatusIsland · estructura', () => {
  it('vacía: raíz popover abierta en body, dos canales vacíos fuera de la section, section hidden, data-form="empty", sin data-stage', async () => {
    await setup()
    const r = root()
    expect(r.parentElement).toBe(document.body)
    expect(r.getAttribute('popover')).toBe('manual')
    expect(r.hasAttribute('data-popover-open')).toBe(true)
    expect(r.className).toContain('g-status-island--position-top-center')
    expect([r.getAttribute('data-position'), r.getAttribute('data-align'), formOf(), stageOf()]).toEqual(['top-center', 'center', 'empty', null])
    expect(r.hasAttribute('data-type')).toBe(false)
    const lives = $$('.g-status-island__live')
    expect(lives.map((l) => [l.getAttribute('role'), l.getAttribute('aria-live'), l.getAttribute('aria-atomic'), l.textContent, l.parentElement === r])).toEqual([
      ['status', 'polite', 'true', '', true], ['alert', null, 'true', '', true]
    ])
    expect(shape().tagName).toBe('SECTION')
    expect(shape().hidden).toBe(true)
    expect(shape().getAttribute('aria-label')).toBe('Estado de la aplicación (Alt+F8)')
    expect(summary()).toBeNull()
    expect(shape().querySelector('[aria-live], [role="alert"], [role="status"]')).toBeNull()
  })

  it('titular: caída sin anillo, ensanche y reposo con el anillo; resumen, insignia, prefijo, cola con chevrón, asomo y panel ocultos', async () => {
    const { status } = await setup({}, { before: (s) => s.error('save', 'No se pudo guardar la factura', { description: 'El servidor no respondió.', action: { label: 'Reintentar', onClick() {} }, origin: { label: 'Ir al formulario', target: 'origin' }, link: { label: 'Ayuda', href: '#ayuda' } }) })
    expect([formOf(), stageOf()]).toEqual(['line', 'drop'])
    expect(shape().hidden).toBe(false)
    expect(root().getAttribute('data-type')).toBe('error')
    expect($('.g-status-island__ring')).toBeNull() // el tiempo aún no corre
    await frames(1)
    expect(stageOf()).toBe('grow')
    await frames(1)
    expect(stageOf()).toBeNull()
    expect(status.state).toMatchObject({ form: 'line', current: 'save', waiting: 0, paused: false })
    const s = summary()
    expect([s.tagName, s.getAttribute('type'), s.getAttribute('aria-expanded'), s.getAttribute('aria-controls'), s.getAttribute('aria-keyshortcuts'), s.hasAttribute('aria-haspopup')]).toEqual(['BUTTON', 'button', 'false', panel().id, 'Alt+F8', false])
    expect(s.getAttribute('aria-describedby')).toBe($('.g-status-island__desc').id)
    const badge = s.querySelector('.g-status-island__badge')
    expect([badge.getAttribute('data-type'), badge.getAttribute('aria-hidden')]).toEqual(['error', 'true'])
    expect(badge.querySelector(':scope > svg.g-icon')).not.toBeNull()
    expect(badge.querySelector(':scope > .g-status-island__ring')).not.toBeNull()
    expect(shape().style.getPropertyValue('--_left')).toBe('1')
    expect(shape().style.getPropertyValue('--_run-ms')).toBe('5240') // 2000 + 60 × (29 + 25)
    expect(s.querySelector('.g-status-island__text').textContent).toBe('Error: No se pudo guardar la factura')
    expect(s.querySelector('.g-status-island__sr').textContent).toBe('Error: ')
    expect(s.querySelector('.g-status-island__tail > .g-status-island__chevron[aria-hidden="true"] > svg')).not.toBeNull()
    expect(s.querySelector('.g-status-island__more')).toBeNull()
    expect(s.querySelector('.g-status-island__timer')).toBeNull()
    // Asomo: oculto; orden descripción → acción → «Ir a…» → enlace → «Ocultar»
    expect(peek().hidden).toBe(true)
    expect([...peek().querySelectorAll('.g-status-island__desc, .g-status-island__action, .g-status-island__origin, .g-status-island__link, .g-status-island__hide')].map((x) => x.className.match(/g-status-island__(\w+)/)[1])).toEqual(['desc', 'action', 'origin', 'link', 'hide'])
    expect(peek().querySelector('.g-status-island__details, .g-status-item__dismiss')).toBeNull()
    expect(panel().hidden).toBe(true)
    expect(panel().querySelector('ul.g-status-island__list').getAttribute('aria-labelledby')).toBe(s.id)
    expect(items()).toHaveLength(0) // la lista solo se pinta abierta
  })

  it('«+N» = las que esperan, con texto oculto; sin espera no hay «+N»', async () => {
    await setup({}, { before: (s) => { s.info('a', 'Uno'); s.info('b', 'Dos'); s.info('c', 'Tres') } })
    await settle()
    const more = summary().querySelector('.g-status-island__tail > .g-status-island__more')
    expect(more.querySelector('[aria-hidden="true"]').textContent).toBe('+2')
    expect(more.querySelector('.g-status-island__sr').textContent).toBe(' y 2 más en espera')
    expect(summary().textContent.replace(/\s+/g, ' ').trim()).toBe('Información: Uno+2 y 2 más en espera')
  })

  it('hotkey: false quita aria-keyshortcuts y deja {hotkey} vacío; position y offset', async () => {
    await setup({ hotkey: false, position: 'top-end', offset: { top: 64 } }, { before: (s) => s.info('a', 'a') })
    expect(summary().hasAttribute('aria-keyshortcuts')).toBe(false)
    expect(shape().getAttribute('aria-label')).toBe('Estado de la aplicación ()')
    expect(root().getAttribute('data-align')).toBe('end')
    expect(root().style.getPropertyValue('--_status-offset-top')).toBe('64px')
  })

  it('is-ready dos cuadros después de montar; lo presente al cargar cae entonces, no antes', async () => {
    const status = createStatus({ labels: LABELS })
    status.info('a', 'a')
    const w = mount(GStatusIsland, { attachTo: document.body, props: { status } })
    wrappers.push(w)
    await flush()
    expect(root().classList.contains('is-ready')).toBe(false)
    expect(formOf()).toBe('empty')
    await frames(2)
    expect(root().classList.contains('is-ready')).toBe(true)
    expect([formOf(), stageOf()]).toEqual(['line', 'drop'])
  })

  it('dos islas del mismo gestor: la segunda no pinta nada y avisa; sin gestor: aviso y nada; falta labels.region', async () => {
    await setup({}, { slot: () => h(GStatusIsland) })
    expect($$('.g-status-island')).toHaveLength(1)
    expect(warned(/dos <GStatusIsland>/)).toBe(true)
    const w = mount(GStatusIsland, { attachTo: document.body })
    wrappers.push(w)
    await flush()
    expect($$('.g-status-island')).toHaveLength(1)
    expect(warned(/sin prop `status` y sin gestor/)).toBe(true)
    const bare = createStatus()
    const w2 = mount(defineComponent({ render: () => h(GStatusIsland, { status: bare }) }), { attachTo: document.body })
    wrappers.push(w2)
    await flush()
    expect(warned(/labels\.region/)).toBe(true)
  })
})

describe('F1 y F2 como regla (#701): medir antes de mostrar y nunca cancelar la entrada', () => {
  it('el destino está medido en el primer cuadro de la caída (antes de grow) y se borra al vaciarse; la siguiente no nace con el tamaño anterior', async () => {
    innerSize(312.4, 44)
    const { status } = await setup()
    status.info('a', 'Uno')
    await flush()
    expect(stageOf()).toBe('drop')
    expect(shape().style.getPropertyValue('--_island-w')).toBe('313px')
    expect(shape().style.getPropertyValue('--_island-h')).toBe('44px')
    await settle()
    status.hide()
    await frames(3) // fold → rise → vacía
    expect(formOf()).toBe('empty')
    expect(shape().style.getPropertyValue('--_island-w')).toBe('')
    expect(shape().style.getPropertyValue('--_island-h')).toBe('')
    innerSize(180, 44)
    status.info('b', 'Dos')
    await flush()
    expect(stageOf()).toBe('drop')
    expect(shape().style.getPropertyValue('--_island-w')).toBe('180px')
  })

  it('la región nunca escribe `transition` en línea (F1) en ninguna etapa, ni con apertura de la lista o del asomo', async () => {
    const seen = []
    const { status } = await setup()
    const mo = new MutationObserver(() => seen.push(shape().getAttribute('style') || ''))
    mo.observe(shape(), { attributes: true, attributeFilter: ['style'] })
    status.error('e', 'Falló', { description: 'd', action: { label: 'R', onClick() {} } })
    await settle()
    enter(shape()); await flush()
    summary().click(); await flush()
    status.close(); await frames(3)
    await flush()
    expect(seen.length).toBeGreaterThan(0)
    expect(seen.some((s) => /transition/.test(s))).toBe(false)
  })

  it('etapas: drop → grow → reposo → fold → rise → vacía; `hidden` llega después de la subida (F3) y se recoge con su texto (I4)', async () => {
    const { status } = await setup()
    const log = stageLog()
    status.info('a', 'Uno')
    await settle()
    vi.advanceTimersByTime(5000); await flush()
    expect(stageOf()).toBe('fold')
    expect(text()).toBe('Información: Uno')
    await frames(1)
    expect(stageOf()).toBe('rise')
    expect(shape().hidden).toBe(false)
    expect(text()).toBe('Información: Uno')
    await frames(1)
    expect(formOf()).toBe('empty')
    expect(shape().hidden).toBe(true)
    expect(log).toEqual(['drop', 'grow', null, 'fold', 'rise', null])
    // El modelo retira la mostrada: se recoge con su copia
    status.warning('w', 'Sin conexión')
    await settle()
    status.remove('w'); await flush()
    expect(stageOf()).toBe('fold')
    expect(text()).toBe('Advertencia: Sin conexión')
  })

  it('avanza al terminar las transiciones de la propia forma (transitionend/transitioncancel), no las de sus hijos', async () => {
    const { status } = await setup()
    const ctl = holdStages()
    status.info('a', 'Uno')
    await frames(3)
    expect(stageOf()).toBe('drop') // la caída sigue en curso
    summary().dispatchEvent(new Event('transitionend', { bubbles: true })); await frames(1)
    expect(stageOf()).toBe('drop') // de un hijo: no cuenta
    await ctl.end()
    expect(stageOf()).toBe('grow')
    ctl.running = false
    shape().dispatchEvent(new Event('transitioncancel')); await frames(1)
    expect(stageOf()).toBeNull()
  })
})

describe('Interrupciones (#702): toda transición parte del estado actual', () => {
  it('llega algo durante fold → grow (no vuelve a caer); durante rise → drop desde donde está', async () => {
    const { status } = await setup()
    status.info('a', 'Uno')
    await settle()
    const ctl = holdStages()
    status.hide(); await frames(1)
    expect(stageOf()).toBe('fold')
    status.warning('b', 'Dos'); await flush()
    expect(stageOf()).toBe('grow')
    expect(text()).toBe('Advertencia: Dos')
    await ctl.end()
    expect(stageOf()).toBeNull()
    status.hide(); await frames(1)
    await ctl.end()
    expect(stageOf()).toBe('rise')
    status.error('c', 'Tres'); await flush()
    expect(stageOf()).toBe('drop')
    expect(formOf()).toBe('line')
  })

  it('puntero sobre lo que se recoge por tiempo: se cancela la recogida y la lectura queda en pausa; la entrada no se detiene por el puntero', async () => {
    const { status } = await setup()
    const ctl = holdStages()
    status.info('a', 'Uno'); await frames(1)
    enter(shape()); await flush()
    expect(stageOf()).toBe('drop') // la entrada sigue
    await ctl.end(); await ctl.end()
    expect(stageOf()).toBeNull()
    expect(root().classList.contains('is-paused')).toBe(true) // empieza en pausa
    leave(shape()); await flush()
    vi.advanceTimersByTime(5000); await flush()
    expect(stageOf()).toBe('fold')
    enter(shape()); await flush()
    expect(stageOf()).toBe('grow')
    expect(status.state.paused).toBe(true)
  })

  it('«Ocultar», Esc y hide() durante la entrada pasan a fold; abrir la lista vale en cualquier etapa (quita data-stage)', async () => {
    const { status } = await setup()
    const ctl = holdStages()
    status.info('a', 'Uno'); await frames(1)
    expect(stageOf()).toBe('drop')
    status.hide(); await flush()
    expect(stageOf()).toBe('fold')
    status.open(); await flush()
    expect([formOf(), stageOf()]).toEqual(['list', null])
    ctl.running = false
  })
})

describe('Lectura y relevo en la isla (#696)', () => {
  it('el anillo: un tramo nuevo (elemento nuevo) al empezar y al reanudar; al pausar, --_left con la fracción y is-paused', async () => {
    const { status } = await setup()
    status.info('a', 'Uno')
    await settle()
    const r1 = $('.g-status-island__ring')
    expect(r1).not.toBeNull()
    vi.advanceTimersByTime(2000); await flush()
    $('#field').focus()
    summary().focus(); await flush()
    expect(root().classList.contains('is-paused')).toBe(true)
    expect(shape().style.getPropertyValue('--_left')).toBe('0.6')
    expect($('.g-status-island__ring')).toBe(r1) // el mismo tramo, quieto
    $('#field').focus(); await flush()
    expect(root().classList.contains('is-paused')).toBe(false)
    expect($('.g-status-island__ring')).not.toBe(r1)
    expect(shape().style.getPropertyValue('--_run-ms')).toBe('3000')
  })

  it('relevo: el mismo resumen con un `__text` nuevo; sin anuncio del relevo; lo más grave releva al momento', async () => {
    const { status } = await setup({ duration: 20000 })
    status.info('a', 'Uno')
    status.info('b', 'Dos')
    await settle()
    await said(); vi.advanceTimersByTime(ANNOUNCE.clear); await flush()
    const s = summary()
    const t1 = s.querySelector('.g-status-island__text')
    vi.advanceTimersByTime(20000 - ANNOUNCE.clear - ANNOUNCE.delay); await flush()
    expect(summary()).toBe(s)
    expect(stageOf()).toBeNull()
    expect(text()).toBe('Información: Dos')
    expect(s.querySelector('.g-status-island__text')).not.toBe(t1)
    // La copia que sale: oculta a la lectura (no entra en el nombre) y se va al terminar su transición
    const out = s.querySelector('.g-status-island__text[aria-hidden="true"]')
    expect(out.textContent).toBe('Uno')
    expect(s.textContent.replace(/\s+/g, ' ')).toContain('Información: Dos')
    out.dispatchEvent(new Event('transitionend')); await flush()
    expect(s.querySelector('.g-status-island__text[aria-hidden="true"]')).toBeNull()
    await said()
    expect(live('status') + live('alert')).toBe('')
    status.error('e', 'Falló'); await flush()
    expect(text()).toBe('Error: Falló')
    expect(root().getAttribute('data-type')).toBe('error')
  })

  it('cuenta atrás: m:ss con role="timer" aria-live="off" en lugar del anillo; no se recoge por tiempo; umbral cortés', async () => {
    const { status } = await setup()
    status.warning('ses', 'La sesión caduca pronto', { deadline: Date.now() + 5 * 60000 + 8000 })
    await settle(); await said()
    vi.advanceTimersByTime(ANNOUNCE.clear); await flush()
    const t = summary().querySelector('.g-status-island__timer')
    expect([t.getAttribute('role'), t.getAttribute('aria-live'), t.textContent]).toEqual(['timer', 'off', '5:03'])
    expect($('.g-status-island__ring')).toBeNull()
    vi.advanceTimersByTime(3000); await flush(); await said()
    expect(live('status')).toBe('Quedan 5:00')
    vi.advanceTimersByTime(60000); await flush()
    expect(formOf()).toBe('line')
  })
})

describe('Asomo (#703): puntero, teclado y toque', () => {
  const full = (s) => s.error('save', 'No se pudo guardar', { description: 'El servidor no respondió.', action: { label: 'Reintentar', onClick() {} }, origin: { label: 'Ir al formulario', target: 'origin' } })

  it('ratón: asomo al pasar y se cierra al salir; táctil no abre por pointerenter', async () => {
    const { status } = await setup({}, { before: full })
    await settle()
    enter(shape(), 'touch'); await flush()
    expect(root().classList.contains('is-peek')).toBe(false)
    enter(shape()); await flush()
    expect(root().classList.contains('is-peek')).toBe(true)
    expect(peek().hidden).toBe(false)
    expect(status.state).toMatchObject({ peek: true, paused: true })
    leave(shape()); await flush()
    expect(root().classList.contains('is-peek')).toBe(false)
    expect(peek().hidden).toBe(true)
  })

  it('teclado: enfocar el resumen abre el asomo; salir el foco lo cierra; Enter abre la lista', async () => {
    await setup({}, { before: full })
    await settle()
    summary().focus(); await flush()
    expect(root().classList.contains('is-peek')).toBe(true)
    peek().querySelector('.g-status-island__action').focus(); await flush()
    expect(root().classList.contains('is-peek')).toBe(true)
    $('#after').focus(); await flush()
    expect(root().classList.contains('is-peek')).toBe(false)
    summary().focus(); summary().click(); await flush()
    expect(formOf()).toBe('list')
  })

  it('toque: el primer toque abre el asomo (su click no abre la lista) y pausa; el segundo, la lista; tocar fuera cierra el asomo y sigue', async () => {
    const { status } = await setup({}, { before: full })
    await settle()
    summary().dispatchEvent(ptr('pointerdown', 'touch'))
    summary().click(); await flush()
    expect([formOf(), root().classList.contains('is-peek')]).toEqual(['line', true])
    document.dispatchEvent(ptr('pointerup', 'touch'))
    expect(status.state.paused).toBe(true)
    summary().dispatchEvent(ptr('pointerdown', 'touch'))
    summary().click(); await flush()
    expect(formOf()).toBe('list')
    status.close(); await frames(3)
    status.announce('save'); await settle()
    summary().dispatchEvent(ptr('pointerdown', 'touch'))
    summary().click(); await flush()
    document.dispatchEvent(ptr('pointerup', 'touch'))
    $('#origin').dispatchEvent(ptr('pointerdown', 'touch')); await flush()
    expect(root().classList.contains('is-peek')).toBe(false)
    expect(status.state.paused).toBe(false)
  })

  it('Esc con el asomo abierto por el puntero y el foco fuera: lo cierra y recoge, preventDefault sin detener la propagación', async () => {
    await setup({}, { before: full })
    await settle()
    $('#field').focus()
    enter(shape()); await flush()
    const seen = vi.fn()
    document.body.addEventListener('keydown', seen)
    const e = key('Escape')
    $('#field').dispatchEvent(e); await flush()
    expect(e.defaultPrevented).toBe(true)
    expect(seen).toHaveBeenCalled()
    expect(stageOf()).toBe('fold')
    expect(document.activeElement.id).toBe('field')
    document.body.removeEventListener('keydown', seen)
  })

  it('«Ocultar»: con espera, relevo y el foco sigue en «Ocultar»; sin espera, se recoge y el foco sale (nunca a body)', async () => {
    const { status } = await setup({}, { before: (s) => { full(s); s.info('i', 'Info') } })
    await settle()
    summary().focus(); await flush()
    const hide = peek().querySelector('.g-status-island__hide')
    expect(hide.textContent.trim()).toBe('Ocultar')
    hide.focus(); hide.click(); await flush()
    expect(text()).toBe('Información: Info')
    expect(document.activeElement).toBe(peek().querySelector('.g-status-island__hide'))
    peek().querySelector('.g-status-island__hide').click(); await flush()
    expect(stageOf()).toBe('fold')
    expect(document.activeElement).not.toBe(document.body)
    expect(root().contains(document.activeElement)).toBe(false)
    expect(status.get('save').seen).toBe(true)
  })

  it('sin labels.hide no se dibuja «Ocultar» y avisa al primer asomo', async () => {
    const { status } = await setup({ labels: { ...LABELS, hide: undefined } }, { before: full })
    await settle()
    enter(shape()); await flush()
    expect(peek().querySelector('.g-status-island__hide')).toBeNull()
    expect(warned(/labels\.hide/)).toBe(true)
    expect(status.state.peek).toBe(true)
  })
})

describe('Lista, teclado y foco', () => {
  it('clic en el titular: lista con «Pendiente (N)», aria-expanded, panel visible; «Cerrar» recoge; pulsar fuera, también, sin mover el foco', async () => {
    const { status } = await setup({}, { before: (s) => { s.info('maint', 'Mantenimiento', { dismissible: true }); s.error('e', 'Falló', { details: 'HTTP 500' }) } })
    await settle()
    summary().click(); await flush()
    expect(formOf()).toBe('list')
    expect(summary().getAttribute('aria-expanded')).toBe('true')
    expect(text()).toBe('Pendiente (2)')
    expect(summary().hasAttribute('aria-describedby')).toBe(false)
    expect(panel().hidden).toBe(false)
    expect(peek()).toBeNull()
    expect(items().map((li) => li.getAttribute('data-type'))).toEqual(['error', 'info'])
    expect(status.state.paused).toBe(true)
    $('.g-status-island__close').click(); await flush()
    expect(stageOf()).toBe('fold')
    expect(status.conditions.every((c) => c.seen)).toBe(true)
    await frames(3)
    status.announce('e'); await settle()
    summary().click(); await flush()
    $('#field').focus()
    $('#other').dispatchEvent(ptr('pointerdown')); await flush()
    expect(stageOf()).toBe('fold')
    expect(document.activeElement.id).toBe('field')
  })

  it('Alt+F8: ida (abre la lista y enfoca el resumen) y vuelta (recoge y devuelve el foco); sin condiciones no se intercepta', async () => {
    const { status } = await setup()
    $('#field').focus()
    expect(altF8().defaultPrevented).toBe(false)
    status.warning('w', 'Sin conexión'); await settle()
    status.hide(); await frames(3)
    expect(formOf()).toBe('empty')
    expect(altF8().defaultPrevented).toBe(true)
    await flush()
    expect(formOf()).toBe('list')
    expect(document.activeElement).toBe(summary())
    expect(altF8().defaultPrevented).toBe(true)
    await flush()
    expect(stageOf()).toBe('fold')
    expect(document.activeElement.id).toBe('field')
  })

  it('Esc con el foco dentro recoge con preventDefault + stopPropagation; el foco sale al siguiente tabulable (nunca a body)', async () => {
    await setup({}, { before: (s) => s.info('a', 'a') })
    await settle()
    summary().focus()
    const parent = vi.fn()
    document.body.addEventListener('keydown', parent)
    const e = key('Escape')
    summary().dispatchEvent(e); await flush()
    expect(e.defaultPrevented).toBe(true)
    expect(parent).not.toHaveBeenCalled()
    expect(stageOf()).toBe('fold')
    expect(document.activeElement.id).toBe('after')
    document.body.removeEventListener('keydown', parent)
  })

  it('nunca toma el foco al aparecer ni al relevarse; el foco que cae bajo la isla la recoge sin moverlo (2.4.11)', async () => {
    const { status } = await setup()
    $('#field').focus()
    status.error('e', 'Falló'); status.info('i', 'Info')
    await settle()
    vi.advanceTimersByTime(5000); await flush()
    expect(document.activeElement.id).toBe('field')
    shape().getBoundingClientRect = () => rect(400, 8, 300, 44)
    $('#other').getBoundingClientRect = () => rect(500, 20, 80, 30)
    $('#other').focus(); await flush()
    expect(stageOf()).toBe('fold')
    expect(document.activeElement.id).toBe('other')
  })

  it('el control con foco que desaparece: al resumen; descartar en la lista con su nombre; un li reordenado conserva el foco', async () => {
    const { status } = await setup({}, { before: (s) => { s.error('e', 'Error'); s.info('i', 'Info', { dismissible: true, action: { label: 'Hacer', onClick() {} } }) } })
    await settle()
    summary().click(); await flush()
    const li = item(status, 'i')
    const btn = li.querySelector('.g-status-item__action')
    btn.focus()
    status.update('e', { type: 'success' }); await flush()
    expect(item(status, 'i')).toBe(li)
    expect(items().indexOf(li)).toBe(0)
    expect(document.activeElement).toBe(btn)
    const x = li.querySelector('.g-status-item__dismiss')
    expect(x.getAttribute('aria-label')).toBe('Descartar: Info')
    x.focus(); x.click(); await flush()
    expect(status.has('i')).toBe(false)
    expect(document.activeElement).toBe(summary())
  })

  it('«Ir a…» recoge y enfoca el origen (tabindex -1 temporal); destino inexistente: aviso y no hace nada', async () => {
    const { status } = await setup({}, { before: (s) => {
      s.error('t', 'No se pudieron cargar', { origin: { label: 'Ir a Facturas', target: 'origin' } })
      s.error('x', 'Otro', { origin: { label: 'Ir', target: () => document.getElementById('no-existe') } })
    } })
    await settle()
    summary().click(); await flush()
    item(status, 'x').querySelector('.g-status-item__origin').click(); await flush()
    expect(formOf()).toBe('list')
    expect(warned(/origin\.target de «x» no existe/)).toBe(true)
    const go = item(status, 't').querySelector('.g-status-item__origin')
    go.focus(); go.click(); await flush()
    expect(stageOf()).toBe('fold')
    const origin = $('#origin')
    expect(document.activeElement).toBe(origin)
    expect(origin.getAttribute('tabindex')).toBe('-1')
    origin.blur()
    expect(origin.hasAttribute('tabindex')).toBe(false)
  })

  it('el enlace: onClick recibe el evento nativo cancelable y la condición; activarlo recoge', async () => {
    const onClick = vi.fn((e) => e.preventDefault())
    await setup({}, { before: (s) => s.success('ok', 'Factura guardada', { link: { label: 'Ver factura', href: '#f-42', target: '_blank', rel: 'noopener', onClick } }) })
    await settle()
    enter(shape()); await flush()
    const a = peek().querySelector('.g-status-island__link')
    expect([a.tagName, a.getAttribute('href'), a.getAttribute('target'), a.getAttribute('rel')]).toEqual(['A', '#f-42', '_blank', 'noopener'])
    const ev = new MouseEvent('click', { bubbles: true, cancelable: true })
    a.dispatchEvent(ev); await flush()
    expect(onClick.mock.calls[0][0]).toBe(ev)
    expect(onClick.mock.calls[0][1]).toMatchObject({ id: 'ok' })
    expect(ev.defaultPrevented).toBe(true)
    expect(stageOf()).toBe('fold')
  })

  it('detalle técnico en la lista: Disclosure cerrado, dir="ltr"; «Copiar» escribe al pulsar y anuncia', async () => {
    const writeText = vi.fn(() => Promise.resolve())
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    const { status } = await setup({}, { before: (s) => s.error('e', 'Falló', { details: 'HTTP 500 · req-9f2' }) })
    await settle()
    summary().click(); await flush()
    const li = item(status, 'e')
    const t = li.querySelector('.g-status-item__details-toggle')
    const box = li.querySelector('.g-status-item__details')
    expect([t.getAttribute('aria-expanded'), t.getAttribute('aria-controls'), box.hidden]).toEqual(['false', box.id, true])
    expect(li.querySelector('pre.g-status-item__details-text').getAttribute('dir')).toBe('ltr')
    t.click(); await flush()
    expect([t.getAttribute('aria-expanded'), box.hidden]).toEqual(['true', false])
    li.querySelector('.g-status-item__copy').click()
    await flush(); await said()
    expect(writeText).toHaveBeenCalledWith('HTTP 500 · req-9f2')
    expect(live('status')).toBe('Copiado')
  })
})

describe('Anuncios (#698)', () => {
  it('0 anuncios al cargar (set previo y <GStatus> hermano), pero se muestran', async () => {
    await setup({}, {
      before: (s) => s.error('pre', 'Error previo'),
      slot: () => h(GStatus, { id: 'view', type: 'error', title: 'No se pudieron cargar las facturas' })
    })
    vi.advanceTimersByTime(1000); await flush()
    expect(live('status') + live('alert')).toBe('')
    expect(formOf()).toBe('line')
  })

  it('uno por suceso, en el canal del tipo, aunque espere su turno; se vacía pasado ANNOUNCE.clear', async () => {
    const { status } = await setup()
    status.warning('off', 'Sin conexión', { description: 'Los cambios se guardan al volver.' })
    await flush(); await said()
    expect(live('status')).toBe('Advertencia: Sin conexión. Los cambios se guardan al volver.')
    status.info('i', 'Espera su turno', { politeness: 'assertive' })
    await flush(); await said()
    expect(live('alert')).toBe('Información: Espera su turno')
    expect(text()).toBe('Advertencia: Sin conexión')
    vi.advanceTimersByTime(ANNOUNCE.clear); await flush()
    expect(live('alert') + live('status')).toBe('')
  })

  it('no anuncian: asomo, lista, recoger, «Ocultar», descartar, el eco ni la retirada por su origen', async () => {
    const { status, api } = await setup({}, { before: (s) => { s.warning('a', 'a', { details: 'traza' }); s.info('b', 'b', { dismissible: true, origin: { label: 'Ir', target: 'origin' } }) } })
    await settle()
    enter(shape()); await flush(); leave(shape()); await flush()
    summary().click(); await flush()
    $('.g-status-item__details-toggle').click(); await flush()
    api.dismiss(api.byId('b').uid); await flush()
    status.close(); await frames(3)
    vi.advanceTimersByTime(500); await flush()
    expect(live('status') + live('alert')).toBe('')
  })
})

describe('Acción y resolución en el sitio (#697)', () => {
  const deferred = () => { let ok, no; const p = new Promise((a, b) => { ok = a; no = b }); return { p, ok, no } }
  const promises = async () => { for (let i = 0; i < 6; i++) await Promise.resolve(); await flush() }

  it('reintentar desde el asomo: busy (insignia, aria-disabled, busyLabel) en pausa; éxito = resolve sin la traza, foco al resumen y sin anuncio duplicado', async () => {
    const d = deferred()
    const { status } = await setup({}, { before: (s) => s.error('save', 'No se pudo guardar', { description: 'El servidor no respondió.', details: 'POST · 500', action: { label: 'Reintentar', busyLabel: 'Reintentando…', onClick: () => d.p } }) })
    await settle()
    summary().focus(); await flush()
    const btn = peek().querySelector('.g-status-island__action')
    btn.focus(); btn.click(); await flush()
    expect(btn.getAttribute('aria-disabled')).toBe('true')
    expect(btn.disabled).toBe(false)
    expect(btn.textContent.trim()).toBe('Reintentando…')
    expect(summary().querySelector('.g-status-island__badge').classList.contains('is-busy')).toBe(true)
    expect(status.state.paused).toBe(true)
    await said()
    expect(live('status')).toBe('Reintentando…')
    vi.advanceTimersByTime(ANNOUNCE.clear); await flush()
    d.ok({ type: 'success', title: 'Factura guardada', link: { label: 'Ver factura', href: '#f' } })
    await promises()
    expect(status.get('save')).toMatchObject({ type: 'success', title: 'Factura guardada' })
    expect(status.get('save').description).toBeUndefined()
    expect(status.get('save').details).toBeUndefined()
    expect(peek().querySelector('.g-status-island__action')).toBeNull()
    expect(peek().querySelector('.g-status-island__desc')).toBeNull()
    expect(document.activeElement).toBe(summary())
    expect(text()).toBe('Correcto: Factura guardada')
    await said()
    expect(live('status')).toBe('')
  })

  it('rechazada: se reanuncia (enérgico), el botón vuelve y conserva el foco', async () => {
    const d = deferred()
    await setup({}, { before: (s) => s.error('save', 'No se pudo guardar', { action: { label: 'Reintentar', onClick: () => d.p } }) })
    await settle()
    summary().focus(); await flush()
    const btn = peek().querySelector('.g-status-island__action')
    btn.focus(); btn.click(); await flush()
    d.no(new Error('otra vez'))
    await promises(); await said()
    expect(live('alert')).toBe('Error: No se pudo guardar')
    expect(btn.hasAttribute('aria-disabled')).toBe(false)
    expect(document.activeElement).toBe(btn)
  })
})

describe('Vive con su origen (#697)', () => {
  it('su destino, que llegó a existir, sale del documento: se retira (motivo origin) sin anuncio; un destino que aún no existe no la retira', async () => {
    const onRemove = vi.fn()
    const view = ref(true)
    const later = ref(false)
    const { status } = await setup({}, { slot: () => [view.value ? h('section', { id: 'vista' }, 'Vista') : null, later.value ? h('section', { id: 'luego' }) : null] })
    status.error('load', 'No se pudo cargar', { origin: { label: 'Ir', target: 'vista' }, onRemove })
    status.error('fut', 'Aún no existe', { origin: { label: 'Ir', target: () => document.getElementById('luego') } })
    await settle(); await said()
    vi.advanceTimersByTime(ANNOUNCE.clear); await flush()
    $('#field').after(document.createElement('i')) // una mutación cualquiera
    await frames(1)
    expect(status.has('fut')).toBe(true)
    view.value = false; await flush(); await frames(1)
    expect(status.has('load')).toBe(false)
    expect(onRemove.mock.calls[0][0]).toBe('origin')
    later.value = true; await flush(); await frames(1)
    later.value = false; await flush(); await frames(1)
    expect(status.has('fut')).toBe(false)
    await said()
    expect(live('status') + live('alert')).toBe('')
  })
})

describe('GStatusMark (#323, #700)', () => {
  it('enlace: vive con la condición (también vista); tipo y busy derivados; abre la lista con el foco en su acción; Alt+F8 vuelve a la marca', async () => {
    const d = { p: null }
    d.p = new Promise((r) => { d.ok = r })
    const { status } = await setup({}, {
      slot: () => h(GStatusMark, { for: 'save', id: 'mark' }, { default: ({ type, busy, condition }) => (type === 'success' ? 'Guardada' : busy ? 'Reintentando' : `No se guardó (${condition.id})`) })
    })
    expect($('#mark')).toBeNull()
    status.error('save', 'No se pudo guardar', { action: { label: 'Reintentar', onClick: () => d.p } })
    await settle()
    const m = $('#mark')
    expect(m.tagName).toBe('BUTTON')
    expect(m.className).toBe('g-status-mark g-status-mark--link g-status-mark--type-error')
    expect([m.getAttribute('type'), m.getAttribute('data-type'), m.getAttribute('aria-expanded'), m.getAttribute('aria-controls')]).toEqual(['button', 'error', 'false', panel().id])
    expect(m.querySelector('.g-status-mark__text').textContent).toBe('Error: No se guardó (save)')
    status.hide(); await frames(3)
    expect($('#mark')).toBe(m) // vista: la marca sigue
    m.focus(); m.click(); await flush()
    expect(formOf()).toBe('list')
    expect(m.getAttribute('aria-expanded')).toBe('true')
    expect(document.activeElement).toBe(item(status, 'save').querySelector('.g-status-item__action'))
    altF8(); await flush()
    expect(document.activeElement).toBe(m)
    status[INTERNAL].action(status[INTERNAL].byId('save').uid); await flush()
    expect(m.classList.contains('is-busy')).toBe(true)
    expect(m.getAttribute('aria-busy')).toBe('true')
    status.resolve('save', 'Factura guardada'); await flush()
    expect(m.getAttribute('data-type')).toBe('success')
    expect(m.textContent).toBe('Correcto: Guardada')
    status.remove('save'); await flush()
    expect($('#mark')).toBeNull()
  })

  it('pasar o enfocar la marca de lo mostrado pausa la lectura; con la marca montada, la acción no retiene el titular', async () => {
    const { status } = await setup({}, { slot: () => h(GStatusMark, { for: 'save', id: 'mark' }) })
    status.error('save', 'No se pudo guardar', { action: { label: 'Reintentar', onClick() {} } })
    await flush()
    boxed($('#mark'))
    await settle()
    enter($('#mark')); await flush()
    expect(root().classList.contains('is-paused')).toBe(true)
    leave($('#mark')); await flush()
    vi.advanceTimersByTime(5000); await flush()
    expect(stageOf()).toBe('fold')
    expect(warned(/ninguna marca enlace montada/)).toBe(false)
  })

  it('eco: al empezar la subida, una vez y solo con la marca visible (no fuera del visor)', async () => {
    const { status } = await setup({}, { slot: () => [h(GStatusMark, { for: 'a', id: 'ma' }), h(GStatusMark, { for: 'b', id: 'mb' })] })
    status.warning('a', 'Uno')
    status.info('b', 'Dos')
    await flush()
    boxed($('#ma'))
    boxed($('#mb'), rect(10, 5000, 120, 32)) // fuera del visor
    await settle()
    $('#ma').getAnimations = () => [{ playState: 'running' }] // el eco de coco en curso
    status.hide(); await flush(); await frames(1)
    expect(stageOf()).toBe('rise')
    expect($('#ma').classList.contains('is-echo')).toBe(true)
    expect($('#mb').classList.contains('is-echo')).toBe(false)
    await frames(1)
    expect($('#ma').classList.contains('is-echo')).toBe(true)
    $('#ma').dispatchEvent(new Event('animationend')); await flush()
    expect($('#ma').classList.contains('is-echo')).toBe(false)
    // Sin animación (movimiento reducido o sin CSS): se quita en el cuadro siguiente
    delete $('#ma').getAnimations
    status.announce('a'); await settle()
    status.hide(); await flush(); await frames(1)
    expect($('#ma').classList.contains('is-echo')).toBe(true)
    await frames(1)
    expect($('#ma').classList.contains('is-echo')).toBe(false)
  })

  it('texto: div con p, prefijo de typeLabel o del gestor, slot action fuera del p; estática y sin gestor', async () => {
    const w = mount(defineComponent({ render: () => h('div', [
      h(GStatusMark, { type: 'warning', typeLabel: 'Advertencia', id: 'txt' }, { default: () => 'Tu tarjeta caduca este mes.', action: () => h('button', { id: 'act' }, 'Actualizar') }),
      h(GStatusMark, { id: 'bare' }, { default: () => 'Sin prefijo' })
    ]) }), { attachTo: document.body })
    wrappers.push(w)
    await flush()
    const m = $('#txt')
    expect(m.tagName).toBe('DIV')
    expect(m.className).toBe('g-status-mark g-status-mark--text g-status-mark--type-warning')
    expect(m.querySelector('p.g-status-mark__text').textContent).toBe('Advertencia: Tu tarjeta caduca este mes.')
    expect(m.querySelector('.g-status-mark__action > #act')).not.toBeNull()
    expect(m.querySelector('[aria-live], [role]')).toBeNull()
    expect(warned(/de texto sin prefijo de tipo/)).toBe(true)
  })

  it('avisos: for + type a la vez; for sin gestor; activada sin isla montada', async () => {
    const w = mount(GStatusMark, { props: { for: 'x' }, attachTo: document.body })
    wrappers.push(w)
    expect(warned(/<GStatusMark for> sin prop `status`/)).toBe(true)
    const { status } = await setup({}, { island: false, before: (s) => s.error('e', 'e'), slot: () => h(GStatusMark, { for: 'e', type: 'error', id: 'm' }) })
    expect(warned(/`for` y `type` a la vez/)).toBe(true)
    $('#m').click(); await flush()
    expect(warned(/activada sin ninguna <GStatusIsland>/)).toBe(true)
    expect(status.state.form).toBe('empty')
  })
})

describe('GStatus (declarativo, sin pintura)', () => {
  it('set al montar, update al cambiar una prop, remove al desmontar (unmount no emite remove); no pinta nada', async () => {
    const show = ref(false)
    const title = ref('No se pudieron cargar las facturas')
    const onRemove = vi.fn()
    const { status } = await setup({}, { slot: () => h('div', { id: 'slot' }, show.value ? h(GStatus, { id: 'inv', type: 'error', title: title.value, origin: { label: 'Ir a Facturas', target: 'origin' }, onRemove }) : null) })
    show.value = true; await flush(); await said()
    expect($('#slot').children).toHaveLength(0)
    expect(status.get('inv')).toMatchObject({ type: 'error', title: 'No se pudieron cargar las facturas', persistent: true })
    expect(live('alert')).toBe('Error: No se pudieron cargar las facturas')
    const uid = status[INTERNAL].byId('inv').uid
    title.value = 'Siguen sin cargar'; await flush()
    expect(status.get('inv').title).toBe('Siguen sin cargar')
    expect(status[INTERNAL].byId('inv').uid).toBe(uid)
    show.value = false; await flush()
    expect(status.has('inv')).toBe(false)
    expect(onRemove).not.toHaveBeenCalled()
  })

  it('retirada con el componente montado: emite remove(reason) y no se vuelve a registrar; expire al llegar a cero', async () => {
    const onRemove = vi.fn()
    const onExpire = vi.fn()
    const title = ref('Mantenimiento')
    const { status, api } = await setup({}, { slot: () => h(GStatus, { id: 'm', title: title.value, dismissible: true, deadline: Date.now() + 2000, onRemove, onExpire }) })
    vi.advanceTimersByTime(3000); await flush()
    expect(onExpire).toHaveBeenCalledTimes(1)
    api.dismiss(api.byId('m').uid); await flush()
    expect(onRemove.mock.calls[0]).toEqual(['dismiss'])
    title.value = 'Otro'; await flush()
    expect(status.has('m')).toBe(false)
  })

  it('dos <GStatus> con el mismo id y <GStatus> sin gestor: avisos', async () => {
    await setup({}, { slot: () => [h(GStatus, { id: 'd', title: 'a' }), h(GStatus, { id: 'd', title: 'b' })] })
    expect(warned(/dos <GStatus> montados con el mismo id/)).toBe(true)
    const w = mount(GStatus, { props: { id: 'x', title: 'x' } })
    wrappers.push(w)
    expect(warned(/<GStatus> sin prop `status`/)).toBe(true)
  })
})

describe('Convivencia', () => {
  it('traslado a un GDialog real y vuelta: mismos nodos, canales incluidos, sin anuncios; Esc en la isla no cierra el diálogo', async () => {
    const open = ref(false)
    const dismiss = vi.fn()
    const { status } = await setup({ duration: false }, {
      before: (s) => s.warning('off', 'Sin conexión'),
      slot: () => h(GDialog, { modelValue: open.value, 'onUpdate:modelValue': (v) => { open.value = v }, title: 'Editar', closeLabel: 'Cerrar', onDismiss: dismiss }, { default: () => h('input', { id: 'dlg-field' }) })
    })
    await settle()
    const r = root()
    open.value = true; await flush(); await flush()
    const dlg = $('dialog.g-dialog')
    expect(root()).toBe(r)
    expect(r.parentElement).toBe(dlg)
    expect(r.hasAttribute('data-popover-open')).toBe(true)
    expect($$('.g-status-island__live').every((l) => dlg.contains(l))).toBe(true)
    expect(text()).toBe('Advertencia: Sin conexión')
    summary().focus()
    const e = key('Escape')
    summary().dispatchEvent(e); await flush()
    expect(e.defaultPrevented).toBe(true)
    expect(dismiss).not.toHaveBeenCalled()
    expect(open.value).toBe(true)
    expect(dlg.contains(document.activeElement)).toBe(true)
    open.value = false; await flush(); vi.advanceTimersByTime(500); await flush()
    expect(r.parentElement).toBe(document.body)
    expect(status.has('off')).toBe(true)
    expect(live('status') + live('alert')).toBe('')
  })

  it('borde compartido (#699): lee voz, zócalo y FAB (order < 30); publica el alto del titular + margen solo mientras se ve', async () => {
    document.documentElement.style.setProperty('--g-space-1', '4px')
    const fab = Symbol('fab')
    const { status } = await setup({ offset: { top: '2rem' } })
    expect(EDGE_ORDER.status).toBe(30)
    expect(edgeReserve('top')).toBe(0)
    innerSize(200, 44)
    status.info('a', 'a'); await flush()
    expect(stageOf()).toBe('drop')
    expect(edgeReserve('top')).toBe(52) // desde la caída: 44 + space × 2
    setEdgeReserve(fab, 'top', 60, { order: EDGE_ORDER.fab }); await flush()
    expect(root().style.getPropertyValue('--_status-offset-top')).toBe('calc(2rem + 60px)')
    expect(edgeReserve('top', { before: EDGE_ORDER.fab })).toBe(0) // el FAB no lee la isla
    await settle()
    summary().click(); await flush()
    expect(edgeReserve('top', { except: fab })).toBe(52) // la lista no cuenta: el titular
    status.close(); await frames(1)
    expect(stageOf()).toBe('fold')
    expect(edgeReserve('top', { except: fab })).toBe(52)
    await frames(2)
    expect(formOf()).toBe('empty')
    expect(edgeReserve('top', { except: fab })).toBe(0)
    clearEdgeReserve(fab)
  })

  it('al desmontar retira escuchas, intervalo, observador y reserva; el gestor queda libre para otra isla', async () => {
    const rm = vi.spyOn(document, 'removeEventListener')
    const { status, w } = await setup({}, { before: (s) => s.warning('a', 'a', { deadline: Date.now() + 60000, origin: { label: 'Ir', target: 'origin' } }) })
    wrappers.splice(wrappers.indexOf(w), 1)
    w.unmount()
    expect(rm.mock.calls.map((c) => c[0])).toEqual(expect.arrayContaining(['focusin', 'keydown', 'pointerdown', 'pointerup', 'visibilitychange']))
    expect(status[INTERNAL].state.attached).toBe(false)
    expect(status.state.form).toBe('empty')
    expect(edgeReserve('top')).toBe(0)
    expect($('.g-status-island')).toBeNull()
    const now = status[INTERNAL].state.now
    vi.advanceTimersByTime(5000)
    expect(status[INTERNAL].state.now).toBe(now)
  })

  it('pestaña oculta: la lectura queda en pausa', async () => {
    const { status } = await setup({}, { before: (s) => s.info('a', 'a') })
    await settle()
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' })
    document.dispatchEvent(new Event('visibilitychange')); await flush()
    expect(status.state.paused).toBe(true)
    vi.advanceTimersByTime(60000); await flush()
    expect(formOf()).toBe('line')
    delete document.visibilityState
    document.dispatchEvent(new Event('visibilitychange')); await flush()
    expect(status.state.paused).toBe(false)
  })
})

describe('Móvil (visor < space × 130): hoja con GDialog real que solo abre la persona', () => {
  async function mobileSetup(opts, extra) {
    document.documentElement.style.setProperty('--g-space-1', '4px')
    const w0 = window.innerWidth
    window.innerWidth = 400
    const r = await setup(opts, extra)
    return { ...r, restore: () => { window.innerWidth = w0 } }
  }

  it('data-mobile; cae igual; el titular abre la hoja (aria-haspopup, sin aria-controls) con la lista; al cerrarla se recoge y el foco sale', async () => {
    const { status, restore } = await mobileSetup()
    try {
      expect(root().hasAttribute('data-mobile')).toBe(true)
      expect(status.state.mobile).toBe(true)
      $('#field').focus()
      status.error('save', 'No se pudo guardar', { action: { label: 'Reintentar', onClick() {} } }); await settle()
      expect(formOf()).toBe('line')
      expect($('dialog.g-status-sheet').hasAttribute('open')).toBe(false)
      expect(document.activeElement.id).toBe('field')
      const s = summary()
      expect([s.getAttribute('aria-haspopup'), s.hasAttribute('aria-controls')]).toEqual(['dialog', false])
      expect(panel()).toBeNull()
      s.focus(); s.click(); await flush(); await flush()
      const sheet = $('dialog.g-status-sheet')
      expect(sheet.hasAttribute('open')).toBe(true)
      expect(formOf()).toBe('list')
      expect(sheet.querySelector('.g-dialog__title').textContent).toBe('Estado de la aplicación')
      expect(sheet.querySelectorAll('ul.g-status-island__list > .g-status-item')).toHaveLength(1)
      expect(root().parentElement).toBe(document.body)
      status.close(); await flush(); vi.advanceTimersByTime(500); await flush()
      expect(sheet.hasAttribute('open')).toBe(false)
      expect(root().contains(document.activeElement)).toBe(false)
      expect(document.activeElement).not.toBe(document.body)
    } finally { restore() }
  })

  it('la marca abre la hoja en su condición con el foco en su acción y, al cerrarse, el foco vuelve a la marca', async () => {
    const { status, restore } = await mobileSetup({}, {
      before: (s) => s.error('save', 'No se pudo guardar', { action: { label: 'Reintentar', onClick() {} } }),
      slot: () => h(GStatusMark, { for: 'save', id: 'mark' })
    })
    try {
      const m = $('#mark')
      expect([m.getAttribute('aria-haspopup'), m.hasAttribute('aria-expanded'), m.hasAttribute('aria-controls')]).toEqual(['dialog', false, false])
      m.focus(); m.click(); await flush(); await flush()
      const sheet = $('dialog.g-status-sheet')
      expect(sheet.hasAttribute('open')).toBe(true)
      expect(document.activeElement).toBe(item(status, 'save').querySelector('.g-status-item__action'))
      status.close(); await flush(); vi.advanceTimersByTime(500); await flush()
      expect(sheet.hasAttribute('open')).toBe(false)
      expect(document.activeElement).toBe(m)
    } finally { restore() }
  })

  it('al cruzar el umbral con la hoja abierta, se cierra y se recoge', async () => {
    const { status, restore } = await mobileSetup({}, { before: (s) => s.warning('a', 'a') })
    try {
      await settle()
      summary().click(); await flush(); await flush()
      expect(formOf()).toBe('list')
      window.innerWidth = 1024
      window.dispatchEvent(new Event('resize')); await flush()
      expect(root().hasAttribute('data-mobile')).toBe(false)
      expect(formOf()).toBe('line')
      expect(stageOf()).toBe('fold')
      expect(status.get('a').seen).toBe(true)
    } finally { restore() }
  })
})
