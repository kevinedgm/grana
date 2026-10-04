// GStatusIsland, GStatusMark y GStatus en jsdom (status.md «Verificación»): marcado, formas, anuncios, foco y teclado,
// apertura automática, acción en el sitio, marca, declarativo, traslado al <dialog> modal (GDialog real), hoja móvil y
// borde compartido. La capa superior real, las medidas y los tres motores son de Playwright.
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
  region: 'Estado de la aplicación ({hotkey})', summary: (n) => (n === 1 ? 'Estado: 1 aviso.' : `Estado: ${n} avisos.`), more: 'y {count} más',
  types: { info: 'Información', success: 'Correcto', warning: 'Advertencia', error: 'Error' },
  acknowledge: 'Entendido', dismiss: 'Descartar: {title}', details: 'Detalle técnico', copy: 'Copiar', copied: 'Copiado',
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
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date', 'requestAnimationFrame', 'cancelAnimationFrame'] })
  vi.setSystemTime(new Date('2026-10-04T10:00:00Z'))
  warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
})
afterEach(() => {
  while (wrappers.length) wrappers.pop().unmount()
  vi.useRealTimers()
  vi.restoreAllMocks()
  HTMLElement.prototype.matches = origMatches
  document.body.innerHTML = ''
  document.documentElement.style.removeProperty('--g-space-1')
})

const wrappers = []
const flush = async () => { for (let i = 0; i < 4; i++) await nextTick() }
const frames = async (n = 3) => { for (let i = 0; i < n; i++) vi.advanceTimersByTime(16); await flush() }
const said = async () => { vi.advanceTimersByTime(ANNOUNCE.delay); await flush() }
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
  return { status, w, api: status[INTERNAL] }
}
const $ = (sel) => document.querySelector(sel)
const $$ = (sel) => [...document.querySelectorAll(sel)]
const root = () => $('.g-status-island')
const shape = () => $('.g-status-island__shape')
const summary = () => $('.g-status-island__summary')
const panel = () => $('.g-status-island__panel')
const items = () => $$('.g-status-item')
const item = (status, id) => document.getElementById(`${root().id}-i-${status[INTERNAL].byId(id).uid}`)
const live = (role) => $(`.g-status-island__live[role="${role}"]`).textContent
const formOf = () => root().getAttribute('data-form')
const key = (k, o = {}) => new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...o })
const altF8 = () => { const e = key('F8', { altKey: true }); (document.activeElement || document.body).dispatchEvent(e); return e }
const warned = (re) => warn.mock.calls.some((c) => re.test(String(c[0])))
const rect = (left, top, width, height) => ({ left, top, width, height, right: left + width, bottom: top + height, x: left, y: top })

describe('GStatusIsland · estructura', () => {
  it('vacía: raíz popover abierta en body, dos canales vacíos fuera de la section, section hidden, data-form="empty"', async () => {
    await setup()
    const r = root()
    expect(r.parentElement).toBe(document.body)
    expect(r.getAttribute('popover')).toBe('manual')
    expect(r.hasAttribute('data-popover-open')).toBe(true)
    expect(r.className).toContain('g-status-island--position-top-center')
    expect(r.getAttribute('data-position')).toBe('top-center')
    expect(r.getAttribute('data-align')).toBe('center')
    expect(formOf()).toBe('empty')
    expect(r.hasAttribute('data-type')).toBe(false)
    const lives = $$('.g-status-island__live')
    expect(lives.map((l) => [l.getAttribute('role'), l.getAttribute('aria-live'), l.getAttribute('aria-atomic'), l.textContent, l.parentElement === r])).toEqual([
      ['status', 'polite', 'true', '', true], ['alert', null, 'true', '', true]
    ])
    expect(shape().tagName).toBe('SECTION')
    expect(shape().hidden).toBe(true)
    expect(shape().getAttribute('aria-label')).toBe('Estado de la aplicación (Alt+F8)')
    expect(summary()).toBeNull()
    // Ni la isla ni la lista son regiones vivas
    expect(shape().querySelector('[aria-live], [role="alert"], [role="status"]')).toBeNull()
  })

  it('compacta: resumen con insignia, prefijo oculto, título, «+N» y atributos; lista en el orden del gestor', async () => {
    const { status } = await setup({}, { before: (s) => {
      s.info('maint', 'Mantenimiento esta noche', { dismissible: true })
      s.error('save', 'No se pudo guardar la factura', { description: 'El servidor no respondió.', action: { label: 'Reintentar', onClick() {} }, origin: { label: 'Ir al formulario', target: 'origin' }, link: { label: 'Ayuda', href: '#ayuda' }, details: 'HTTP 500 · req-1' })
      s.warning('off', 'Sin conexión')
    } })
    expect(formOf()).toBe('compact')
    expect(root().getAttribute('data-type')).toBe('error')
    expect(shape().hidden).toBe(false)
    const s = summary()
    expect(s.tagName).toBe('BUTTON')
    expect(s.getAttribute('type')).toBe('button')
    expect(s.getAttribute('aria-expanded')).toBe('false')
    expect(s.getAttribute('aria-controls')).toBe(panel().id)
    expect(s.getAttribute('aria-keyshortcuts')).toBe('Alt+F8')
    expect(s.hasAttribute('aria-haspopup')).toBe(false)
    expect(s.textContent.replace(/\s+/g, ' ').trim()).toBe('Estado: 3 avisos. Error: No se pudo guardar la factura+2y 2 más')
    expect(s.querySelector('.g-status-island__badge').getAttribute('data-type')).toBe('error')
    expect(s.querySelector('.g-status-island__badge').getAttribute('aria-hidden')).toBe('true')
    expect(s.querySelector('.g-status-island__badge > svg.g-icon')).not.toBeNull()
    expect(s.querySelector('.g-status-island__more [aria-hidden="true"]').textContent).toBe('+2')
    expect(panel().hidden).toBe(true)
    expect(items().map((li) => li.getAttribute('data-type'))).toEqual(['error', 'warning', 'info'])
    const li = item(status, 'save')
    expect(li.className).toContain('g-status-item--type-error')
    expect(li.classList.contains('has-action')).toBe(true)
    expect(li.classList.contains('has-details')).toBe(true)
    expect(li.querySelector('.g-status-item__title').textContent).toBe('Error: No se pudo guardar la factura')
    expect(li.querySelector('.g-status-item__type').textContent).toBe('Error: ')
    expect(li.querySelector('.g-status-item__description').textContent).toBe('El servidor no respondió.')
    expect(li.querySelector('a.g-status-item__link').getAttribute('href')).toBe('#ayuda')
    // Orden del DOM: contenido → acciones → descartar
    expect([...li.children].map((c) => c.className.split(' ').find((x) => x.startsWith('g-status-item__')))).toEqual(['g-status-item__badge', 'g-status-item__content', 'g-status-item__actions'])
    expect([...li.querySelectorAll('.g-status-item__actions > *')].map((b) => b.textContent.trim())).toEqual(['Reintentar', 'Ir al formulario'])
    const m = item(status, 'maint')
    expect(m.classList.contains('is-dismissible')).toBe(true)
    expect(m.lastElementChild.classList.contains('g-status-item__dismiss')).toBe(true)
    expect(m.querySelector('.g-status-item__dismiss').getAttribute('aria-label')).toBe('Descartar: Mantenimiento esta noche')
    expect($('.g-status-island__ack').textContent.trim()).toBe('Entendido')
  })

  it('hotkey: false quita aria-keyshortcuts y deja {hotkey} vacío; position y offset', async () => {
    await setup({ hotkey: false, position: 'top-end', offset: { top: 64 } }, { before: (s) => s.info('a', 'a') })
    expect(summary().hasAttribute('aria-keyshortcuts')).toBe(false)
    expect(shape().getAttribute('aria-label')).toBe('Estado de la aplicación ()')
    expect(root().getAttribute('data-align')).toBe('end')
    expect(root().style.getPropertyValue('--_status-offset-top')).toBe('64px')
  })

  it('is-ready dos cuadros después de montar; sin literales de tamaño hasta medir', async () => {
    await setup({}, { before: (s) => s.info('a', 'a') })
    expect(root().classList.contains('is-ready')).toBe(false)
    await frames(3)
    expect(root().classList.contains('is-ready')).toBe(true)
  })

  it('escribe --_island-w/h en px con el tamaño natural de __inner (ResizeObserver)', async () => {
    const ros = []
    vi.stubGlobal('ResizeObserver', class { constructor(cb) { this.cb = cb; this.els = []; ros.push(this) } observe(el) { this.els.push(el) } unobserve() {} disconnect() {} })
    await setup({}, { before: (s) => s.info('a', 'a') })
    const inner = $('.g-status-island__inner')
    const ro = ros.find((o) => o.els.includes(inner))
    expect(ro).toBeTruthy()
    expect(shape().style.getPropertyValue('--_island-w')).toBe('')
    // El resumen también se observa (reserva de borde): su entrada no cuenta para el tamaño de la forma
    ro.cb([{ target: inner, borderBoxSize: [{ inlineSize: 311.4, blockSize: 48 }] }, { target: summary(), borderBoxSize: [{ inlineSize: 300, blockSize: 20 }] }])
    await flush()
    expect(shape().style.getPropertyValue('--_island-w')).toBe('312px')
    expect(shape().style.getPropertyValue('--_island-h')).toBe('48px')
    vi.unstubAllGlobals()
  })

  it('dos islas del mismo gestor: la segunda no pinta nada y avisa; sin gestor: aviso y nada', async () => {
    await setup({}, { slot: () => h(GStatusIsland) })
    expect($$('.g-status-island')).toHaveLength(1)
    expect(warned(/dos <GStatusIsland>/)).toBe(true)
    const w = mount(GStatusIsland, { attachTo: document.body })
    wrappers.push(w)
    await flush()
    expect($$('.g-status-island')).toHaveLength(1)
    expect(warned(/sin prop `status` y sin gestor/)).toBe(true)
  })

  it('faltan labels al montar: region, summary y acknowledge (sin «Entendido» no se dibuja el botón)', async () => {
    const status = createStatus()
    status.info('a', 'a')
    const w = mount(GStatusIsland, { attachTo: document.body, props: { status } })
    wrappers.push(w)
    await flush()
    for (const re of [/labels\.region/, /labels\.summary/, /labels\.acknowledge/]) expect(warned(re), String(re)).toBe(true)
    expect($('.g-status-island__ack')).toBeNull()
    expect(shape().hasAttribute('aria-label')).toBe(false)
  })
})

describe('Anuncios (#320)', () => {
  it('0 anuncios al cargar: lo que existe al montar (set previo y <GStatus> hermano) no anuncia, no abre y no da el toque', async () => {
    await setup({}, {
      before: (s) => s.error('pre', 'Error previo'),
      slot: () => h(GStatus, { id: 'view', type: 'error', title: 'No se pudieron cargar las facturas' })
    })
    vi.advanceTimersByTime(1000)
    await flush()
    expect(live('status')).toBe('')
    expect(live('alert')).toBe('')
    expect(items()).toHaveLength(2)
    expect(formOf()).toBe('compact')
    expect(root().classList.contains('is-nudge')).toBe(false)
  })

  it('uno por suceso, en el canal del tipo, con el texto exacto; se vacía pasado ANNOUNCE.clear', async () => {
    const { status } = await setup()
    status.warning('off', 'Sin conexión', { description: 'Los cambios se guardan al volver.' })
    await flush()
    expect(live('status')).toBe('')
    await said()
    expect(live('status')).toBe('Advertencia: Sin conexión. Los cambios se guardan al volver.')
    expect(live('alert')).toBe('')
    status.error('save', 'No se pudo guardar')
    await flush(); await said()
    expect(live('alert')).toBe('Error: No se pudo guardar')
    vi.advanceTimersByTime(ANNOUNCE.clear)
    await flush()
    expect(live('alert')).toBe('')
    expect(live('status')).toBe('')
    // politeness explícita
    status.info('i', 'Importante', { politeness: 'assertive' })
    await flush(); await said()
    expect(live('alert')).toBe('Información: Importante')
  })

  it('cambio de title/description/type y announce(id) anuncian; set + update en el mismo ciclo es un solo anuncio', async () => {
    const { status } = await setup({ autoOpen: false })
    status.info('a', 'Uno')
    status.update('a', { title: 'Dos' })
    await flush(); await said()
    expect(live('status')).toBe('Información: Dos')
    vi.advanceTimersByTime(ANNOUNCE.clear); await flush()
    status.update('a', { dismissible: true })
    await flush(); await said()
    expect(live('status')).toBe('')
    status.announce('a')
    await flush(); await said()
    expect(live('status')).toBe('Información: Dos')
  })

  it('no anuncian: abrir, replegar, reconocer, descartar, abrir el detalle', async () => {
    const { status, api } = await setup({ autoOpen: false }, { before: (s) => { s.warning('a', 'a', { details: 'traza' }); s.info('b', 'b', { dismissible: true }) } })
    summary().click(); await flush()
    $('.g-status-item__details-toggle').click(); await flush()
    api.dismiss(api.byId('b').uid); await flush()
    $('.g-status-island__ack').click(); await flush()
    summary().click(); await flush()
    summary().click(); await flush()
    vi.advanceTimersByTime(500); await flush()
    expect(live('status') + live('alert')).toBe('')
    expect(status.has('b')).toBe(false)
  })

  it('umbrales de la cuenta atrás con reloj falso: role="timer" aria-live="off" visible y anuncio cortés en 5 min', async () => {
    const { status } = await setup({ autoOpen: false })
    status.warning('ses', 'La sesión caduca pronto', { deadline: Date.now() + 5 * 60000 + 8000 })
    await flush(); await said()
    vi.advanceTimersByTime(ANNOUNCE.clear); await flush()
    const t = summary().querySelector('.g-status-island__timer')
    expect([t.getAttribute('role'), t.getAttribute('aria-live'), t.textContent]).toEqual(['timer', 'off', '5:03'])
    vi.advanceTimersByTime(2000); await flush()
    expect(summary().querySelector('.g-status-island__timer').textContent).toBe('5:01')
    expect($('.g-status-item__timer').textContent).toBe('5:01')
    expect(live('status')).toBe('')
    vi.advanceTimersByTime(1000); await flush(); await said()
    expect(live('status')).toBe('Quedan 5:00')
  })
})

describe('Formas, reconocimiento y apertura automática (#319)', () => {
  it('un error nuevo abre la isla sola sin tomar el foco; data-form en cada paso', async () => {
    const { status } = await setup()
    $('#field').focus()
    status.error('save', 'No se pudo guardar')
    await flush()
    expect(formOf()).toBe('open')
    expect(summary().getAttribute('aria-expanded')).toBe('true')
    expect(panel().hidden).toBe(false)
    expect(document.activeElement.id).toBe('field')
    status.close(); await flush()
    expect(formOf()).toBe('compact')
    expect(panel().hidden).toBe(true)
  })

  it('reconocer → punto con el nombre accesible intacto; el resultado reconocido se retira; nueva condición → compacta', async () => {
    const { status } = await setup({ autoOpen: false }, { before: (s) => { s.warning('off', 'Sin conexión'); s.success('ok', 'Factura guardada') } })
    const name = summary().textContent
    summary().click(); await flush()
    expect(formOf()).toBe('open')
    $('.g-status-island__ack').click(); await flush()
    expect(formOf()).toBe('dot')
    expect(status.has('ok')).toBe(false)
    expect(shape().hidden).toBe(false)
    expect(summary().textContent.replace(/\s+/g, ' ')).toBe('Estado: 1 aviso. Advertencia: Sin conexión')
    expect(name).toContain('Sin conexión')
    expect(item(status, 'off').classList.contains('is-acknowledged')).toBe(true)
    status.info('n', 'Nueva'); await flush()
    expect(formOf()).toBe('compact')
    status.clear(); await flush()
    expect(formOf()).toBe('empty')
    expect(shape().hidden).toBe(true)
    expect($$('.g-status-island__live')).toHaveLength(2)
  })

  it('no abre si taparía el elemento en uso: se queda compacta y da el toque; el rectángulo se mide sin dejar rastro', async () => {
    const { status } = await setup({}, { before: (s) => s.info('a', 'a') })
    const field = $('#field')
    field.focus()
    field.getBoundingClientRect = () => rect(400, 60, 200, 32)
    const seen = []
    shape().getBoundingClientRect = function () { seen.push([root().getAttribute('data-form'), panel().hidden, this.style.transition]); return rect(300, 8, 420, 300) }
    status.error('save', 'No se pudo guardar')
    await flush()
    expect(seen).toEqual([['open', false, 'none']]) // medido abierto, antes de pintar
    expect(formOf()).toBe('compact')
    expect(panel().hidden).toBe(true)
    expect(shape().style.transition).toBe('')
    expect(root().getAttribute('data-type')).toBe('error')
    await frames(1)
    expect(root().classList.contains('is-nudge')).toBe(true)
    const end = new Event('animationend', { bubbles: true }); end.animationName = 'g-status-nudge'
    shape().dispatchEvent(end); await flush()
    expect(root().classList.contains('is-nudge')).toBe(false)
    expect(document.activeElement).toBe(field)
    // Sin solape, abre
    field.getBoundingClientRect = () => rect(400, 600, 200, 32)
    status.announce('save'); await flush()
    expect(formOf()).toBe('open')
  })

  it('con el foco en body cuenta el destino del último pointerdown (WebKit no enfoca botones con el ratón)', async () => {
    const { status } = await setup()
    const other = $('#other')
    other.getBoundingClientRect = () => rect(400, 60, 80, 32)
    other.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    await flush()
    shape().getBoundingClientRect = () => rect(300, 8, 420, 300)
    expect(document.activeElement).toBe(document.body)
    status.error('save', 'Falló'); await flush()
    expect(formOf()).toBe('compact')
  })

  it('autoOpen: false nunca abre sola (da el toque si ya era visible); lo no grave tampoco abre', async () => {
    const { status } = await setup({ autoOpen: false }, { before: (s) => s.info('a', 'a') })
    status.error('e', 'Falló'); await flush(); await frames(1)
    expect(formOf()).toBe('compact')
    expect(root().classList.contains('is-nudge')).toBe(true)
    status.configure({ autoOpen: true })
    status.warning('w', 'Ojo'); await flush()
    expect(formOf()).toBe('compact')
  })

  it('pasar a error abre; se repliega si el foco va a un elemento que la isla abierta tapa (2.4.11)', async () => {
    const { status } = await setup({}, { before: (s) => s.warning('a', 'a') })
    status.update('a', { type: 'error' }); await flush()
    expect(formOf()).toBe('open')
    shape().getBoundingClientRect = () => rect(300, 8, 420, 300)
    $('#other').getBoundingClientRect = () => rect(900, 600, 80, 32)
    $('#other').focus(); await flush()
    expect(formOf()).toBe('open')
    $('#field').getBoundingClientRect = () => rect(400, 60, 200, 32)
    $('#field').focus(); await flush()
    expect(formOf()).toBe('compact')
    expect(document.activeElement.id).toBe('field')
  })
})

describe('Teclado y foco (#320, #321)', () => {
  it('Alt+F8: ida (abre y enfoca el resumen) y vuelta (repliega y devuelve el foco); sin condiciones no se intercepta', async () => {
    const { status } = await setup({ autoOpen: false })
    $('#field').focus()
    expect(altF8().defaultPrevented).toBe(false)
    status.warning('a', 'a'); await flush()
    const go = altF8(); await flush()
    expect(go.defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(summary())
    expect(formOf()).toBe('open')
    const back = altF8(); await flush()
    expect(back.defaultPrevented).toBe(true)
    expect(document.activeElement.id).toBe('field')
    expect(formOf()).toBe('compact')
    // Modificadores exactos: F8 y Mayús+F8 no se interceptan; con isComposing tampoco
    for (const o of [{}, { shiftKey: true }, { altKey: true, shiftKey: true }, { altKey: true, isComposing: true }]) {
      const e = key('F8', o)
      document.activeElement.dispatchEvent(e)
      expect(e.defaultPrevented, JSON.stringify(o)).toBe(false)
    }
  })

  it('Esc con el foco dentro repliega con preventDefault + stopPropagation y deja el foco en el resumen; replegada, nada', async () => {
    await setup({ autoOpen: false }, { before: (s) => s.warning('a', 'a') })
    const outer = vi.fn()
    document.body.addEventListener('keydown', outer)
    summary().click(); await flush()
    $('.g-status-island__ack').focus()
    const e = key('Escape')
    $('.g-status-island__ack').dispatchEvent(e); await flush()
    expect(e.defaultPrevented).toBe(true)
    expect(outer).not.toHaveBeenCalled()
    expect(formOf()).toBe('compact')
    expect(document.activeElement).toBe(summary())
    const e2 = key('Escape')
    summary().dispatchEvent(e2)
    expect(e2.defaultPrevented).toBe(false)
    expect(outer).toHaveBeenCalledTimes(1)
    document.body.removeEventListener('keydown', outer)
  })

  it('pulsar fuera repliega sin mover el foco; pulsar en una marca enlace no', async () => {
    const { status } = await setup({ autoOpen: false }, { before: (s) => s.warning('a', 'a'), slot: () => h(GStatusMark, { for: 'a', id: 'mark' }) })
    $('#field').focus()
    status.open(); await flush()
    expect(formOf()).toBe('open')
    expect(document.activeElement.id).toBe('field') // open() no mueve el foco
    $('#mark').dispatchEvent(new Event('pointerdown', { bubbles: true })); await flush()
    expect(formOf()).toBe('open')
    $('.g-status-island__ack').dispatchEvent(new Event('pointerdown', { bubbles: true })); await flush()
    expect(formOf()).toBe('open')
    $('#other').dispatchEvent(new Event('pointerdown', { bubbles: true })); await flush()
    expect(formOf()).toBe('compact')
    expect(document.activeElement.id).toBe('field')
  })

  it('«Entendido» con el foco en él: al resumen si la isla sigue; si se vacía, al elemento guardado o al siguiente tabulable, nunca a body', async () => {
    const { status } = await setup({ autoOpen: false }, { before: (s) => s.warning('a', 'a') })
    summary().click(); await flush()
    $('.g-status-island__ack').focus()
    $('.g-status-island__ack').click(); await flush()
    expect(formOf()).toBe('dot')
    expect(document.activeElement).toBe(summary())
    // Se vacía (solo resultados) con el foco dentro, tras llegar con el atajo desde #field
    status.clear(); await flush()
    status.success('ok', 'Hecho'); await flush()
    $('#field').focus()
    altF8(); await flush()
    $('.g-status-island__ack').focus()
    $('.g-status-island__ack').click(); await flush()
    expect(formOf()).toBe('empty')
    expect(document.activeElement.id).toBe('field')
    // Sin elemento guardado: al siguiente tabulable del anfitrión
    status.success('ok2', 'Hecho'); await flush()
    summary().focus()
    summary().click(); await flush()
    $('.g-status-island__ack').focus()
    $('.g-status-island__ack').click(); await flush()
    expect(document.activeElement).not.toBe(document.body)
    expect(document.activeElement.id).toBe('after')
  })

  it('descartar con el foco en su botón: el foco va al resumen; nombre con el título', async () => {
    const { status } = await setup({ autoOpen: false }, { before: (s) => { s.warning('a', 'a'); s.info('m', 'Mantenimiento', { dismissible: true }) } })
    summary().click(); await flush()
    const x = item(status, 'm').querySelector('.g-status-item__dismiss')
    x.focus(); x.click(); await flush()
    expect(status.has('m')).toBe(false)
    expect(items()).toHaveLength(1)
    expect(document.activeElement).toBe(summary())
    expect(formOf()).toBe('open')
  })

  it('si un li se reordena con el foco dentro, el nodo es el mismo y el foco se restituye', async () => {
    const { status } = await setup({ autoOpen: false }, { before: (s) => { s.error('e', 'Error'); s.info('i', 'Info', { action: { label: 'Hacer', onClick() {} } }) } })
    summary().click(); await flush()
    const li = item(status, 'i')
    const btn = li.querySelector('.g-status-item__action')
    btn.focus()
    expect(items().indexOf(li)).toBe(1)
    const blur = vi.fn()
    btn.addEventListener('blur', blur)
    status.update('e', { type: 'success' }) // la info pasa a ser la primera
    await flush()
    expect(item(status, 'i')).toBe(li)
    expect(items().indexOf(li)).toBe(0)
    expect(document.activeElement).toBe(btn)
  })

  it('«Ir a…» repliega y enfoca el origen (tabindex -1 temporal); destino inexistente: aviso y no hace nada', async () => {
    const { status } = await setup({ autoOpen: false }, { before: (s) => {
      s.error('t', 'No se pudieron cargar', { origin: { label: 'Ir a Facturas', target: 'origin' } })
      s.error('x', 'Otro', { origin: { label: 'Ir', target: () => document.getElementById('no-existe') } })
    } })
    summary().click(); await flush()
    item(status, 'x').querySelector('.g-status-item__origin').click(); await flush()
    expect(formOf()).toBe('open')
    expect(warned(/origin\.target de «x» no existe/)).toBe(true)
    const go = item(status, 't').querySelector('.g-status-item__origin')
    go.focus(); go.click(); await flush()
    expect(formOf()).toBe('compact')
    const origin = $('#origin')
    expect(document.activeElement).toBe(origin)
    expect(origin.getAttribute('tabindex')).toBe('-1')
    origin.blur()
    expect(origin.hasAttribute('tabindex')).toBe(false)
  })

  it('el enlace: onClick recibe el evento nativo cancelable y la condición; activarlo repliega', async () => {
    const onClick = vi.fn((e) => e.preventDefault())
    const { status } = await setup({ autoOpen: false }, { before: (s) => s.success('ok', 'Factura guardada', { link: { label: 'Ver factura', href: '#f-42', target: '_blank', rel: 'noopener', onClick } }) })
    summary().click(); await flush()
    const a = item(status, 'ok').querySelector('.g-status-item__link')
    expect([a.getAttribute('target'), a.getAttribute('rel')]).toEqual(['_blank', 'noopener'])
    const ev = new MouseEvent('click', { bubbles: true, cancelable: true })
    a.dispatchEvent(ev); await flush()
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(onClick.mock.calls[0][0]).toBe(ev)
    expect(onClick.mock.calls[0][1]).toMatchObject({ id: 'ok' })
    expect(ev.defaultPrevented).toBe(true)
    expect(formOf()).toBe('compact')
  })

  it('detalle técnico: Disclosure cerrado, dir="ltr"; «Copiar» escribe al pulsar y anuncia «Copiado»', async () => {
    const writeText = vi.fn(() => Promise.resolve())
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    const { status } = await setup({ autoOpen: false }, { before: (s) => s.error('e', 'Falló', { details: 'HTTP 500 · req-9f2' }) })
    summary().click(); await flush()
    const li = item(status, 'e')
    const t = li.querySelector('.g-status-item__details-toggle')
    const box = li.querySelector('.g-status-item__details')
    expect([t.getAttribute('aria-expanded'), t.getAttribute('aria-controls'), box.hidden]).toEqual(['false', box.id, true])
    expect(li.querySelector('pre.g-status-item__details-text').getAttribute('dir')).toBe('ltr')
    expect(writeText).not.toHaveBeenCalled()
    t.click(); await flush()
    expect([t.getAttribute('aria-expanded'), box.hidden]).toEqual(['true', false])
    li.querySelector('.g-status-item__copy').click()
    await flush(); await said()
    expect(writeText).toHaveBeenCalledWith('HTTP 500 · req-9f2')
    expect(live('status')).toBe('Copiado')
    vi.unstubAllGlobals()
  })
})

describe('Acción y resolución en el sitio', () => {
  const deferred = () => { let ok, no; const p = new Promise((a, b) => { ok = a; no = b }); return { p, ok, no } }
  const settle = async () => { for (let i = 0; i < 6; i++) await Promise.resolve(); await flush() }

  it('error → reintentando → éxito en el MISMO li: busy (aria-busy, aria-disabled, busyLabel, insignias), foco al resumen y sin anuncio duplicado', async () => {
    const d = deferred()
    const { status } = await setup({ autoOpen: false }, { before: (s) => s.error('save', 'No se pudo guardar', { action: { label: 'Reintentar', busyLabel: 'Reintentando…', onClick: () => d.p } }) })
    summary().click(); await flush()
    const li = item(status, 'save')
    const btn = li.querySelector('.g-status-item__action')
    btn.focus(); btn.click(); await flush()
    expect(li.getAttribute('aria-busy')).toBe('true')
    expect(li.classList.contains('is-busy')).toBe(true)
    expect(btn.getAttribute('aria-disabled')).toBe('true')
    expect(btn.disabled).toBe(false)
    expect(btn.textContent.trim()).toBe('Reintentando…')
    expect(btn.querySelector('.g-btn__status')).toBeNull()
    expect(summary().querySelector('.g-status-island__badge').classList.contains('is-busy')).toBe(true)
    expect(document.activeElement).toBe(btn)
    await said()
    expect(live('status')).toBe('Reintentando…')
    vi.advanceTimersByTime(ANNOUNCE.clear); await flush()
    d.ok({ type: 'success', title: 'Factura guardada', action: undefined, link: { label: 'Ver factura', href: '#f' } })
    await settle()
    expect(item(status, 'save')).toBe(li)
    expect(li.getAttribute('data-type')).toBe('success')
    expect(li.hasAttribute('aria-busy')).toBe(false)
    expect(li.querySelector('.g-status-item__action')).toBeNull()
    expect(li.querySelector('.g-status-item__link').textContent).toBe('Ver factura')
    // El control con foco desapareció: el foco va al resumen, que ya dice el nombre nuevo (no se anuncia aparte)
    expect(document.activeElement).toBe(summary())
    expect(summary().textContent).toContain('Correcto: Factura guardada')
    await said()
    expect(live('status')).toBe('')
    expect(formOf()).toBe('open') // no se cierra sola
  })

  it('si el resumen muestra OTRA condición, el desenlace sí se anuncia (el foco no lo lee)', async () => {
    const d = deferred()
    const { status } = await setup({ autoOpen: false }, { before: (s) => {
      s.error('table', 'No se pudieron cargar las facturas')
      s.error('save', 'No se pudo guardar', { action: { label: 'Reintentar', onClick: () => d.p } })
    } })
    summary().click(); await flush()
    const btn = item(status, 'save').querySelector('.g-status-item__action')
    btn.focus(); btn.click(); await flush()
    d.ok({ type: 'success', title: 'Factura guardada', action: undefined })
    await settle(); await said()
    expect(document.activeElement).toBe(summary())
    expect(live('status')).toBe('Correcto: Factura guardada')
  })

  it('rechazada: se reanuncia (enérgico), el botón vuelve y conserva el foco', async () => {
    const d = deferred()
    const { status } = await setup({ autoOpen: false }, { before: (s) => s.error('save', 'No se pudo guardar', { action: { label: 'Reintentar', onClick: () => d.p } }) })
    summary().click(); await flush()
    const btn = item(status, 'save').querySelector('.g-status-item__action')
    btn.focus(); btn.click(); await flush()
    d.no(new Error('otra vez'))
    await settle(); await said()
    expect(live('alert')).toBe('Error: No se pudo guardar')
    expect(btn.hasAttribute('aria-disabled')).toBe(false)
    expect(btn.textContent.trim()).toBe('Reintentar')
    expect(document.activeElement).toBe(btn)
  })
})

describe('GStatusMark (#323)', () => {
  it('enlace: existe solo mientras exista la condición; tipo y busy derivados; slot con alcance; sin anuncios', async () => {
    const d = { p: null }
    d.p = new Promise((r) => { d.ok = r })
    const { status } = await setup({ autoOpen: false }, {
      slot: () => h(GStatusMark, { for: 'save', id: 'mark' }, { default: ({ type, busy, condition }) => (type === 'success' ? 'Guardada' : busy ? 'Reintentando' : `No se guardó (${condition.id})`) })
    })
    expect($('#mark')).toBeNull()
    status.error('save', 'No se pudo guardar', { action: { label: 'Reintentar', onClick: () => d.p } })
    await flush(); await said()
    vi.advanceTimersByTime(ANNOUNCE.clear); await flush()
    const m = $('#mark')
    expect(m.tagName).toBe('BUTTON')
    expect(m.className).toBe('g-status-mark g-status-mark--link g-status-mark--type-error')
    expect([m.getAttribute('type'), m.getAttribute('data-type'), m.getAttribute('aria-expanded'), m.getAttribute('aria-controls')]).toEqual(['button', 'error', 'false', panel().id])
    expect(m.querySelector('.g-status-mark__badge > svg.g-icon')).not.toBeNull()
    expect(m.querySelector('.g-status-mark__text').textContent).toBe('Error: No se guardó (save)')
    expect(m.querySelector('.g-status-mark__type').textContent).toBe('Error: ')
    // Abre la isla en su condición y enfoca su acción
    m.focus(); m.click(); await flush()
    const action = item(status, 'save').querySelector('.g-status-item__action')
    expect(formOf()).toBe('open')
    expect(m.getAttribute('aria-expanded')).toBe('true')
    expect(document.activeElement).toBe(action)
    // Vuelta con el atajo: a la marca
    altF8(); await flush()
    expect(document.activeElement).toBe(m)
    expect(formOf()).toBe('compact')
    // busy y tipo salen de la condición
    status[INTERNAL].action(status[INTERNAL].byId('save').uid); await flush()
    expect(m.classList.contains('is-busy')).toBe(true)
    expect(m.getAttribute('aria-busy')).toBe('true')
    expect(m.textContent).toContain('Reintentando')
    vi.advanceTimersByTime(ANNOUNCE.clear + ANNOUNCE.delay); await flush()
    status.resolve('save', 'Factura guardada'); await flush()
    expect(m.getAttribute('data-type')).toBe('success')
    expect(m.classList.contains('is-busy')).toBe(false)
    expect(m.textContent).toBe('Correcto: Guardada')
    status.remove('save'); await flush()
    expect($('#mark')).toBeNull()
  })

  it('enlace sin slot: el título de la condición; con acción ocupada el foco va a «Ir a…»; sin controles, al li', async () => {
    const { status } = await setup({ autoOpen: false }, {
      before: (s) => { s.error('t', 'No se pudieron cargar', { origin: { label: 'Ir a Facturas', target: 'origin' } }); s.info('i', 'Solo lectura') },
      slot: () => [h(GStatusMark, { for: 't', id: 'mt' }), h(GStatusMark, { for: 'i', id: 'mi' })]
    })
    expect($('#mt .g-status-mark__text').textContent).toBe('Error: No se pudieron cargar')
    $('#mt').click(); await flush()
    expect(document.activeElement).toBe(item(status, 't').querySelector('.g-status-item__origin'))
    $('#mi').click(); await flush()
    expect(document.activeElement).toBe(item(status, 'i'))
    expect(item(status, 'i').getAttribute('tabindex')).toBe('-1')
    vi.advanceTimersByTime(500); await flush()
    expect(live('status') + live('alert')).toBe('')
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
    expect(m.getAttribute('data-type')).toBe('warning')
    expect(m.querySelector('p.g-status-mark__text').textContent).toBe('Advertencia: Tu tarjeta caduca este mes.')
    expect(m.querySelector('.g-status-mark__action > #act')).not.toBeNull()
    expect(m.querySelector('p #act')).toBeNull()
    expect(m.querySelector('[aria-live], [role]')).toBeNull()
    expect($('#bare').getAttribute('data-type')).toBe('info')
    expect($('#bare .g-status-mark__action')).toBeNull()
    expect(warned(/de texto sin prefijo de tipo/)).toBe(true)
  })

  it('avisos: for + type a la vez; for sin gestor; activada sin isla montada', async () => {
    const w = mount(GStatusMark, { props: { for: 'x' }, attachTo: document.body })
    wrappers.push(w)
    expect(warned(/<GStatusMark for> sin prop `status`/)).toBe(true)
    expect(w.html()).toBe('<!--v-if-->')
    const { status } = await setup({}, { island: false, before: (s) => s.error('e', 'e'), slot: () => h(GStatusMark, { for: 'e', type: 'error', id: 'm' }) })
    expect(warned(/`for` y `type` a la vez/)).toBe(true)
    $('#m').click(); await flush()
    expect(warned(/activada sin ninguna <GStatusIsland>/)).toBe(true)
    expect(status[INTERNAL].state.open).toBe(false)
  })
})

describe('GStatus (declarativo, sin pintura)', () => {
  it('set al montar, update al cambiar una prop, remove al desmontar (unmount no emite remove); no pinta nada', async () => {
    const show = ref(false)
    const title = ref('No se pudieron cargar las facturas')
    const onRemove = vi.fn()
    const { status } = await setup({ autoOpen: false }, { slot: () => h('div', { id: 'slot' }, show.value ? h(GStatus, { id: 'inv', type: 'error', title: title.value, origin: { label: 'Ir a Facturas', target: 'origin' }, onRemove }) : null) })
    expect(status.has('inv')).toBe(false)
    show.value = true; await flush(); await said()
    expect($('#slot').children).toHaveLength(0)
    expect(status.get('inv')).toMatchObject({ type: 'error', title: 'No se pudieron cargar las facturas', persistent: true, dismissible: false })
    expect(live('alert')).toBe('Error: No se pudieron cargar las facturas') // montado después: anuncia como cualquiera
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
    const { status, api } = await setup({ autoOpen: false }, { slot: () => h(GStatus, { id: 'm', title: title.value, dismissible: true, deadline: Date.now() + 2000, onRemove, onExpire }) })
    vi.advanceTimersByTime(3000); await flush()
    expect(onExpire).toHaveBeenCalledTimes(1)
    expect(status.has('m')).toBe(true)
    api.dismiss(api.byId('m').uid); await flush()
    expect(onRemove).toHaveBeenCalledTimes(1)
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
  it('traslado a un GDialog real y vuelta: mismos nodos, canales incluidos, estado intacto y sin anuncios; Esc en la isla no cierra el diálogo', async () => {
    const open = ref(false)
    const dismiss = vi.fn()
    const { status } = await setup({ autoOpen: false }, {
      before: (s) => s.warning('off', 'Sin conexión', { action: { label: 'Reintentar', onClick() {} } }),
      slot: () => h(GDialog, { modelValue: open.value, 'onUpdate:modelValue': (v) => { open.value = v }, title: 'Editar', closeLabel: 'Cerrar', onDismiss: dismiss }, { default: () => h('input', { id: 'dlg-field' }) })
    })
    status.acknowledge(); await flush()
    const r = root()
    const li = item(status, 'off')
    open.value = true; await flush(); await flush()
    const dlg = $('dialog.g-dialog')
    expect(root()).toBe(r)
    expect(r.parentElement).toBe(dlg)
    expect(r.hasAttribute('data-popover-open')).toBe(true)
    expect($$('.g-status-island__live').every((l) => dlg.contains(l))).toBe(true)
    expect(item(status, 'off')).toBe(li)
    expect(formOf()).toBe('dot')
    summary().click(); await flush()
    const e = key('Escape')
    summary().dispatchEvent(e); await flush()
    expect(e.defaultPrevented).toBe(true)
    expect(dismiss).not.toHaveBeenCalled()
    expect(open.value).toBe(true)
    open.value = false; await flush(); vi.advanceTimersByTime(500); await flush()
    expect(r.parentElement).toBe(document.body)
    expect(root()).toBe(r)
    expect(formOf()).toBe('dot')
    vi.advanceTimersByTime(500); await flush()
    expect(live('status') + live('alert')).toBe('')
  })

  it('borde compartido (#322): lee la reserva de la voz (order menor) y publica el alto del resumen + margen con order status', async () => {
    document.documentElement.style.setProperty('--g-space-1', '4px')
    const speech = Symbol('voz')
    const { status } = await setup({ offset: { top: '2rem' } })
    expect(edgeReserve('top')).toBe(0)
    status.info('a', 'a'); await flush()
    Object.defineProperty(summary(), 'offsetHeight', { configurable: true, value: 48 })
    window.dispatchEvent(new Event('resize')); await flush()
    expect(edgeReserve('top')).toBe(56) // 48 + space × 2
    expect(edgeReserve('top', { before: EDGE_ORDER.status })).toBe(0)
    expect(root().style.getPropertyValue('--_status-offset-top')).toBe('2rem')
    setEdgeReserve(speech, 'top', 60, { order: EDGE_ORDER.speech }); await flush()
    expect(root().style.getPropertyValue('--_status-offset-top')).toBe('calc(2rem + 60px)')
    expect(edgeReserve('top')).toBe(116) // lo que suma GToaster
    // Vacía: deja de publicar
    status.clear(); await flush()
    expect(edgeReserve('top')).toBe(60)
    clearEdgeReserve(speech)
  })

  it('al desmontar retira escuchas, intervalo y reserva; el gestor queda libre para otra isla', async () => {
    const rm = vi.spyOn(document, 'removeEventListener')
    const { status, w } = await setup({}, { before: (s) => s.warning('a', 'a', { deadline: Date.now() + 60000 }) })
    wrappers.splice(wrappers.indexOf(w), 1)
    w.unmount()
    expect(rm.mock.calls.map((c) => c[0]).sort()).toEqual(expect.arrayContaining(['focusin', 'keydown', 'pointerdown']))
    expect(status[INTERNAL].state.attached).toBe(false)
    expect(edgeReserve('top')).toBe(0)
    expect($('.g-status-island')).toBeNull()
    const now = status[INTERNAL].state.now
    vi.advanceTimersByTime(5000)
    expect(status[INTERNAL].state.now).toBe(now)
  })
})

describe('Móvil (visor < space × 130): hoja con GDialog real', () => {
  async function mobileSetup(opts, extra) {
    document.documentElement.style.setProperty('--g-space-1', '4px')
    const w0 = window.innerWidth
    window.innerWidth = 400
    const r = await setup(opts, extra)
    return { ...r, restore: () => { window.innerWidth = w0 } }
  }

  it('data-mobile; un error no abre nada solo; el resumen abre la hoja (aria-haspopup, sin aria-controls) con la misma lista', async () => {
    const { status, restore } = await mobileSetup()
    try {
      expect(root().hasAttribute('data-mobile')).toBe(true)
      expect(status.state.mobile).toBe(true)
      $('#field').focus()
      status.error('save', 'No se pudo guardar', { action: { label: 'Reintentar', onClick() {} } }); await flush(); await said()
      expect(formOf()).toBe('compact')
      expect($('dialog.g-status-sheet').hasAttribute('open')).toBe(false)
      expect(document.activeElement.id).toBe('field')
      expect(live('alert')).toBe('Error: No se pudo guardar')
      const s = summary()
      expect([s.getAttribute('aria-haspopup'), s.hasAttribute('aria-controls'), s.getAttribute('aria-expanded')]).toEqual(['dialog', false, 'false'])
      expect(panel()).toBeNull()
      s.focus(); s.click(); await flush(); await flush()
      const sheet = $('dialog.g-status-sheet')
      expect(sheet.classList.contains('g-dialog')).toBe(true)
      expect(sheet.hasAttribute('open')).toBe(true)
      expect(sheet.matches(':modal')).toBe(true)
      expect(root().contains(sheet)).toBe(true)
      expect(formOf()).toBe('open')
      expect(sheet.querySelector('.g-dialog__title').textContent).toBe('Estado de la aplicación')
      expect(sheet.querySelector('.g-dialog__close').getAttribute('aria-label')).toBe('Cerrar')
      expect(sheet.querySelectorAll('.g-status-item')).toHaveLength(1)
      expect(sheet.querySelector('.g-dialog__footer .g-status-island__ack')).not.toBeNull()
      // La isla NO se traslada a su propia hoja
      expect(root().parentElement).toBe(document.body)
      // «Entendido» cierra la hoja y el foco vuelve al resumen
      sheet.querySelector('.g-status-island__ack').focus()
      sheet.querySelector('.g-status-island__ack').click(); await flush(); vi.advanceTimersByTime(500); await flush()
      expect(sheet.hasAttribute('open')).toBe(false)
      expect(formOf()).toBe('dot')
      expect(document.activeElement).toBe(summary())
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

  it('en la hoja, si el control con foco desaparece el foco se queda dentro del modal (li o cierre); al cruzar el umbral abierta, se repliega', async () => {
    const { status, api, restore } = await mobileSetup({}, { before: (s) => { s.warning('a', 'a'); s.info('m', 'Mantenimiento', { dismissible: true }) } })
    try {
      summary().click(); await flush(); await flush()
      const sheet = $('dialog.g-status-sheet')
      const x = item(status, 'm').querySelector('.g-status-item__dismiss')
      x.focus(); x.click(); await flush()
      expect(sheet.contains(document.activeElement)).toBe(true)
      expect(document.activeElement).toBe(sheet.querySelector('.g-dialog__close'))
      expect(api.state.open).toBe(true)
      window.innerWidth = 1024
      window.dispatchEvent(new Event('resize')); await flush()
      expect(root().hasAttribute('data-mobile')).toBe(false)
      expect(formOf()).toBe('compact')
    } finally { restore() }
  })
})
