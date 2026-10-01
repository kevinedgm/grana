// GToaster (región) en jsdom: marcado, canales vivos, foco y teclado, pausa, deslizar, traslado al <dialog> modal (GDialog real).
// Playwright cubre capa superior real, transiciones y los tres motores (design/lab/theme-playground/tests/library.spec.mjs).
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import GToaster from './GToaster.vue'
import GDialog from '../GDialog/GDialog.vue'
import { createToaster, ANNOUNCE, INTERNAL, POSITIONS } from './toaster.js'

const LABELS = {
  region: 'Notificaciones ({hotkey})',
  close: 'Cerrar notificación',
  types: { info: 'Información', success: 'Correcto', warning: 'Advertencia', error: 'Error', loading: 'En curso' },
  repeated: '{count} veces',
  queued: '{count} más en espera',
  actionHint: 'Pulsa {hotkey} para {action}.'
}

// jsdom no implementa popover ni showModal ni :modal: se simulan con el mismo contrato.
const origMatches = HTMLElement.prototype.matches
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
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date', 'requestAnimationFrame', 'cancelAnimationFrame'] })
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  document.body.innerHTML = ''
  document.documentElement.style.removeProperty('--g-space-1')
})

const wrappers = []
async function setup(opts = {}, { props = {}, slot } = {}) {
  const toaster = createToaster({ labels: LABELS, ...opts })
  const App = defineComponent({
    setup() { return () => h('div', [h('input', { id: 'field' }), h('button', { id: 'other' }, 'Otro'), slot ? slot() : null, h(GToaster, props)]) }
  })
  const w = mount(App, { attachTo: document.body, global: { plugins: [toaster] } })
  wrappers.push(w)
  await flush()
  return { toaster, w }
}
const flush = async () => { await nextTick(); await nextTick() }
const frames = async (n = 2) => { for (let i = 0; i < n; i++) vi.advanceTimersByTime(16); await flush() }
const root = () => document.querySelector('.g-toaster')
const toasts = () => [...document.querySelectorAll('.g-toast')]
const live = (role) => document.querySelector(`.g-toaster__live[role="${role}"]`)
const key = (k, o = {}) => new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...o })
afterEach(() => { while (wrappers.length) wrappers.pop().unmount() })

describe('GToaster · región', () => {
  it('existe antes del primer aviso: raíz popover abierta en body, 2 canales vacíos, section hidden', async () => {
    await setup()
    const r = root()
    expect(r.parentElement).toBe(document.body)
    expect(r.getAttribute('popover')).toBe('manual')
    expect(r.hasAttribute('data-popover-open')).toBe(true)
    expect(r.getAttribute('role')).toBeNull()
    const lives = r.querySelectorAll('.g-toaster__live')
    expect(lives).toHaveLength(2)
    expect(live('status').getAttribute('aria-live')).toBe('polite')
    expect(live('status').getAttribute('aria-atomic')).toBe('true')
    expect(live('alert').getAttribute('aria-atomic')).toBe('true')
    expect([...lives].every((l) => l.textContent === '')).toBe(true)
    // Canales fuera de la section
    expect(r.querySelector('section .g-toaster__live')).toBeNull()
    expect(r.querySelector('section').hidden).toBe(true)
    expect(r.querySelector('ol.g-toaster__list')).not.toBeNull()
    expect(r.dataset).toMatchObject({ position: 'bottom-end', edge: 'bottom', align: 'end' })
    expect(r.classList.contains('g-toaster--position-bottom-end')).toBe(true)
  })

  it('con avisos: section visible con nombre y aria-keyshortcuts; la lista no es viva', async () => {
    const { toaster } = await setup()
    toaster.success('Hecho')
    await flush()
    const s = root().querySelector('section')
    expect(s.hidden).toBe(false)
    expect(s.getAttribute('aria-label')).toBe('Notificaciones (F8)')
    expect(s.getAttribute('aria-keyshortcuts')).toBe('F8')
    expect(s.querySelectorAll('[aria-live]')).toHaveLength(0)
    expect(s.querySelector('ol').getAttribute('aria-live')).toBeNull()
  })

  it('hotkey:false: sin aria-keyshortcuts y {hotkey} vacío', async () => {
    const { toaster } = await setup({ hotkey: false, labels: { ...LABELS, region: 'Notificaciones' } })
    toaster.info('x')
    await flush()
    expect(root().querySelector('section').hasAttribute('aria-keyshortcuts')).toBe(false)
  })

  it('dos GToaster del mismo gestor: aviso y una sola región', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const toaster = createToaster({ labels: LABELS })
    const w = mount({ render: () => h('div', [h(GToaster), h(GToaster)]) }, { attachTo: document.body, global: { plugins: [toaster] } })
    wrappers.push(w)
    await flush()
    expect(document.querySelectorAll('.g-toaster')).toHaveLength(1)
    expect(warn.mock.calls.some(([m]) => /dos <GToaster>/.test(m))).toBe(true)
  })

  it('sin gestor (ni prop ni provisto): aviso y no pinta nada; con prop toaster, pinta ese', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mount(GToaster, { attachTo: document.body })
    await flush()
    expect(document.querySelector('.g-toaster')).toBeNull()
    expect(warn.mock.calls.some(([m]) => /sin prop `toaster`/.test(m))).toBe(true)
    w.unmount()
    const t = createToaster({ labels: LABELS })
    const w2 = mount(GToaster, { attachTo: document.body, props: { toaster: t } })
    wrappers.push(w2)
    await flush()
    t.info('Por prop')
    await flush()
    expect(toasts()).toHaveLength(1)
  })

  it('faltan labels.region y labels.close: aviso al montar; el botón cerrar se dibuja igual', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { toaster } = await setup({ labels: {} })
    expect(warn.mock.calls.some(([m]) => /falta labels\.region/.test(m))).toBe(true)
    expect(warn.mock.calls.some(([m]) => /falta labels\.close/.test(m))).toBe(true)
    toaster.show({ title: 'Sin textos' })
    await flush()
    expect(document.querySelector('.g-toast__close')).not.toBeNull()
  })
})

describe('GToaster · marcado del aviso', () => {
  it('li = GSurface floating completa + tipo + estados; icono hijo directo; prefijo oculto; acción antes de cerrar', async () => {
    const { toaster } = await setup()
    toaster.error('No se pudo sincronizar', { description: 'Revisa la conexión.', action: { label: 'Reintentar' } })
    await flush()
    const li = toasts()[0]
    expect(li.tagName).toBe('LI')
    expect([...li.classList]).toEqual(expect.arrayContaining(['g-toast', 'g-surface', 'g-surface--level-floating', 'g-surface--tone-surface', 'g-surface--padding-sm', 'g-surface--density-default', 'g-toast--type-error', 'has-action', 'has-description']))
    expect(li.dataset.type).toBe('error')
    expect(li.id).toMatch(/-ttoast-1$/)
    expect(li.querySelector('.g-toast__icon').getAttribute('aria-hidden')).toBe('true')
    expect(li.querySelector('.g-toast__icon > svg.g-icon')).not.toBeNull()
    const title = li.querySelector('p.g-toast__title')
    expect(title.id).toBe(`${li.id}-title`)
    expect(title.querySelector('.g-toast__type').textContent).toBe('Error: ')
    expect(title.textContent).toBe('Error: No se pudo sincronizar')
    expect(li.querySelector('p.g-toast__description').id).toBe(`${li.id}-desc`)
    const buttons = [...li.querySelectorAll('.g-toast__actions > button')]
    expect(buttons.map((b) => b.className.match(/g-toast__\w+/)[0])).toEqual(['g-toast__action', 'g-toast__close'])
    expect([...buttons[0].classList]).toEqual(expect.arrayContaining(['g-btn', 'g-btn--size-sm', 'g-btn--variant-outline', 'g-btn--color-neutral']))
    expect([...buttons[1].classList]).toEqual(expect.arrayContaining(['g-btn', 'g-btn--icon', 'g-btn--size-sm', 'g-btn--variant-ghost', 'g-btn--color-neutral']))
    expect(buttons[1].getAttribute('aria-label')).toBe('Cerrar notificación')
    expect(buttons[1].getAttribute('aria-describedby')).toBe(`${li.id}-title ${li.id}-desc`)
    expect(buttons[1].querySelector('svg.g-icon')).not.toBeNull()
    expect(buttons.every((b) => b.getAttribute('type') === 'button')).toBe(true)
  })

  it('neutral sin icono ni prefijo; loading con is-loading y aria-busy', async () => {
    const { toaster } = await setup()
    toaster.show({ title: 'Borrador guardado' })
    toaster.show({ type: 'loading', title: 'Subiendo' })
    await flush()
    const [n, l] = toasts()
    expect(n.querySelector('.g-toast__icon')).toBeNull()
    expect(n.querySelector('.g-toast__type')).toBeNull()
    expect(n.classList.contains('has-action')).toBe(false)
    expect(l.classList.contains('is-loading')).toBe(true)
    expect(l.getAttribute('aria-busy')).toBe('true')
    expect(n.hasAttribute('aria-busy')).toBe(false)
  })

  it('contador: GBadge count con label solo con count > 1', async () => {
    const { toaster } = await setup()
    toaster.success('Copiado')
    await flush()
    expect(document.querySelector('.g-toast__count')).toBeNull()
    toaster.success('Copiado')
    toaster.success('Copiado')
    await flush()
    const b = document.querySelector('.g-toast__title > .g-badge.g-toast__count')
    expect([...b.classList]).toEqual(expect.arrayContaining(['g-badge--kind-count', 'g-badge--size-sm', 'g-badge--variant-soft', 'g-badge--color-neutral']))
    expect(b.querySelector('.g-badge__text').getAttribute('aria-hidden')).toBe('true')
    expect(b.querySelector('.g-badge__sr').textContent).toBe('3 veces')
  })

  it('data-state: entering → visible dos fotogramas después', async () => {
    const { toaster } = await setup()
    toaster.info('Entra')
    await flush()
    expect(toasts()[0].dataset.state).toBe('entering')
    await frames(1)
    expect(toasts()[0].dataset.state).toBe('entering')
    await frames(1)
    expect(toasts()[0].dataset.state).toBe('visible')
  })

  it('al salir: --_toast-y en línea, data-state leaving, inert, y se retira sin esperar transitionend', async () => {
    const { toaster } = await setup()
    toaster.error('Sale')
    await flush()
    const li = toasts()[0]
    toaster.dismiss('toast-1')
    await flush()
    expect(li.dataset.state).toBe('leaving')
    expect(li.style.getPropertyValue('--_toast-y')).toMatch(/^-?\d+(\.\d+)?px$/)
    expect(li.hasAttribute('inert')).toBe(true)
    vi.advanceTimersByTime(1)
    await flush()
    expect(toasts()).toHaveLength(0)
    expect(root().querySelector('section').hidden).toBe(true)
  })

  it('las 6 posiciones: clase, data-position, data-edge y data-align; arriba el más reciente va primero', async () => {
    const { toaster } = await setup()
    toaster.info('a')
    toaster.info('b')
    for (const p of POSITIONS) {
      toaster.configure({ position: p })
      await flush()
      const [edge, align] = p.split('-')
      expect(root().classList.contains(`g-toaster--position-${p}`)).toBe(true)
      expect(root().dataset).toMatchObject({ position: p, edge, align })
      expect(toasts().map((li) => li.textContent.replace(/Información: /, '')[0])).toEqual(edge === 'top' ? ['b', 'a'] : ['a', 'b'])
    }
  })

  it('offset → variables en línea; texto de cola con labels.queued', async () => {
    const { toaster } = await setup({ offset: { top: 56, bottom: '4rem' }, limit: 1 })
    expect(root().style.getPropertyValue('--_toaster-offset-top')).toBe('56px')
    expect(root().style.getPropertyValue('--_toaster-offset-bottom')).toBe('4rem')
    toaster.info('1'); toaster.info('2'); toaster.info('3')
    await flush()
    expect(document.querySelector('.g-toaster__queued').textContent).toBe('2 más en espera')
    expect(document.querySelector('.g-toaster__queued').closest('section')).not.toBeNull()
  })

  it('móvil: visor < space × 130 → data-mobile, abajo y mobileLimit', async () => {
    document.documentElement.style.setProperty('--g-space-1', '4px')
    const w0 = window.innerWidth
    window.innerWidth = 400
    try {
      const { toaster } = await setup({ position: 'top-center' })
      toaster.info('a'); toaster.info('b')
      await flush()
      expect(root().hasAttribute('data-mobile')).toBe(true)
      expect(root().dataset.edge).toBe('bottom')
      expect(toasts()).toHaveLength(1)
      window.innerWidth = 1024
      window.dispatchEvent(new Event('resize'))
      await flush()
      expect(root().hasAttribute('data-mobile')).toBe(false)
      expect(root().dataset.edge).toBe('top')
      expect(toasts()).toHaveLength(2)
    } finally {
      window.innerWidth = w0
    }
  })
})

describe('GToaster · canales vivos', () => {
  it('escribe el texto compuesto en el canal cortés tras el retardo y lo vacía después', async () => {
    const { toaster } = await setup()
    toaster.success('Cambios guardados')
    await flush()
    expect(live('status').textContent).toBe('')
    vi.advanceTimersByTime(ANNOUNCE.delay)
    await flush()
    expect(live('status').textContent).toBe('Correcto: Cambios guardados.')
    expect(live('alert').textContent).toBe('')
    vi.advanceTimersByTime(ANNOUNCE.clear)
    await flush()
    expect(live('status').textContent).toBe('')
  })

  it('error al canal enérgico; el mismo texto se vacía y se reescribe', async () => {
    const { toaster } = await setup()
    toaster.error('No se pudo')
    vi.advanceTimersByTime(ANNOUNCE.delay)
    await flush()
    expect(live('alert').textContent).toBe('Error: No se pudo.')
    toaster.update('toast-1', { title: 'No se pudo.' })
    await flush()
    expect(live('alert').textContent).toBe('')
    vi.advanceTimersByTime(ANNOUNCE.delay)
    await flush()
    expect(live('alert').textContent).toBe('Error: No se pudo.')
  })

  it('varios en el mismo ciclo se escriben juntos', async () => {
    const { toaster } = await setup()
    toaster.info('Uno')
    toaster.info('Dos')
    vi.advanceTimersByTime(ANNOUNCE.delay)
    await flush()
    expect(live('status').textContent).toBe('Información: Uno. Información: Dos.')
  })

  it('avisos creados antes de montar se anuncian tras montar y esperar un ciclo', async () => {
    const toaster = createToaster({ labels: LABELS })
    toaster.info('Temprano')
    const w = mount({ render: () => h(GToaster) }, { attachTo: document.body, global: { plugins: [toaster] } })
    wrappers.push(w)
    await flush()
    expect(live('status').textContent).toBe('')
    vi.advanceTimersByTime(ANNOUNCE.delay)
    await flush()
    expect(live('status').textContent).toBe('Información: Temprano.')
  })
})

describe('GToaster · foco y teclado', () => {
  it('no roba el foco al aparecer ni al actualizarse', async () => {
    const { toaster } = await setup()
    document.getElementById('field').focus()
    toaster.error('Algo', { action: { label: 'Ver' } })
    await flush()
    toaster.update('toast-1', { title: 'Otra cosa' })
    await flush()
    expect(document.activeElement.id).toBe('field')
  })

  it('F8 lleva a la acción del más reciente (o su cierre) y F8 vuelve; sin avisos no se intercepta', async () => {
    const { toaster } = await setup()
    const field = document.getElementById('field')
    field.focus()
    const e0 = key('F8')
    field.dispatchEvent(e0)
    expect(e0.defaultPrevented).toBe(false)
    toaster.info('Viejo', { action: { label: 'Abrir' } })
    toaster.info('Nuevo')
    await flush()
    const e1 = key('F8')
    field.dispatchEvent(e1)
    expect(e1.defaultPrevented).toBe(true)
    expect(document.activeElement.classList.contains('g-toast__close')).toBe(true)
    expect(document.activeElement.closest('.g-toast').textContent).toContain('Nuevo')
    document.activeElement.dispatchEvent(key('F8'))
    expect(document.activeElement).toBe(field)
    toaster.dismiss('toast-2')
    await flush()
    vi.advanceTimersByTime(1)
    await flush()
    field.dispatchEvent(key('F8'))
    expect(document.activeElement.classList.contains('g-toast__action')).toBe(true)
  })

  it('composición IME: ni atajo ni Esc', async () => {
    const { toaster } = await setup()
    toaster.error('E')
    await flush()
    const ev = key('F8', { isComposing: true })
    document.getElementById('field').dispatchEvent(ev)
    expect(ev.defaultPrevented).toBe(false)
    const close = document.querySelector('.g-toast__close')
    close.focus()
    close.dispatchEvent(key('Escape', { isComposing: true }))
    expect(toaster.toasts).toHaveLength(1)
  })

  it('orden de foco: acción → cerrar → siguiente aviso', async () => {
    const { toaster } = await setup()
    toaster.info('a', { action: { label: 'A' } })
    toaster.info('b', { action: { label: 'B' } })
    await flush()
    const order = [...document.querySelectorAll('.g-toaster button')].map((b) => b.textContent.trim() || b.getAttribute('aria-label'))
    expect(order).toEqual(['A', 'Cerrar notificación', 'B', 'Cerrar notificación'])
  })

  it('Esc en un aviso: lo cierra (escape), defaultPrevented y sin propagarse; el foco va al cierre del vecino más reciente', async () => {
    const { toaster } = await setup()
    const onDismiss = vi.fn()
    toaster.error('a')
    toaster.error('b', { onDismiss })
    toaster.error('c')
    await flush()
    const outside = vi.fn()
    document.body.addEventListener('keydown', outside)
    const closeB = toasts()[1].querySelector('.g-toast__close')
    closeB.focus()
    const ev = key('Escape')
    closeB.dispatchEvent(ev)
    expect(ev.defaultPrevented).toBe(true)
    expect(outside).not.toHaveBeenCalled()
    expect(onDismiss).toHaveBeenCalledWith('escape', expect.any(Object))
    expect(document.activeElement.closest('.g-toast').textContent).toContain('c')
    document.body.removeEventListener('keydown', outside)
  })

  it('Esc con el foco fuera de los avisos no hace nada con ellos', async () => {
    const { toaster } = await setup()
    toaster.error('a')
    await flush()
    const ev = key('Escape')
    document.getElementById('field').dispatchEvent(ev)
    expect(ev.defaultPrevented).toBe(false)
    expect(toaster.toasts).toHaveLength(1)
  })

  it('foco tras cerrar el último: al elemento guardado; si ya no está, al primer control del anfitrión', async () => {
    const { toaster } = await setup()
    const other = document.getElementById('other')
    other.focus()
    toaster.error('a')
    await flush()
    other.dispatchEvent(key('F8'))
    document.activeElement.click()
    await flush()
    expect(document.activeElement).toBe(other)
    toaster.error('b')
    await flush()
    other.dispatchEvent(key('F8'))
    other.remove()
    document.activeElement.click()
    await flush()
    expect(document.activeElement.id).toBe('field')
  })

  it('actualizar con el foco dentro conserva el control equivalente (si la acción desaparece, cerrar)', async () => {
    const { toaster } = await setup()
    toaster.error('a', { action: { label: 'Reintentar' } })
    await flush()
    document.querySelector('.g-toast__action').focus()
    toaster.update('toast-1', { title: 'b' })
    await flush()
    expect(document.activeElement.classList.contains('g-toast__action')).toBe(true)
    toaster.update('toast-1', { action: undefined })
    await flush()
    expect(document.activeElement.classList.contains('g-toast__close')).toBe(true)
  })

  it('la acción llama a onClick y cierra con motivo action', async () => {
    const { toaster } = await setup()
    const onClick = vi.fn()
    const onDismiss = vi.fn()
    toaster.success('Archivado', { action: { label: 'Deshacer', onClick }, onDismiss })
    await flush()
    document.querySelector('.g-toast__action').click()
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(onDismiss).toHaveBeenCalledWith('action', expect.any(Object))
    document.querySelector('.g-toast__close') // sigue en salida
    expect(toaster.toasts[0].state).toBe('leaving')
  })
})

describe('GToaster · pausa y deslizar', () => {
  it('pausa con el puntero sobre la lista, con el foco dentro y con la pestaña oculta', async () => {
    const { toaster } = await setup()
    toaster.success('Pausa')
    await flush()
    const list = document.querySelector('.g-toaster__list')
    list.dispatchEvent(new Event('pointerenter'))
    await flush()
    expect(root().classList.contains('is-paused')).toBe(true)
    vi.advanceTimersByTime(60000)
    expect(toaster.toasts).toHaveLength(1)
    list.dispatchEvent(new Event('pointerleave'))
    document.querySelector('.g-toast__close').focus()
    vi.advanceTimersByTime(60000)
    expect(toaster.toasts).toHaveLength(1)
    document.getElementById('field').focus()
    const vis = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
    document.dispatchEvent(new Event('visibilitychange'))
    vi.advanceTimersByTime(60000)
    expect(toaster.toasts).toHaveLength(1)
    vis.mockReturnValue('visible')
    document.dispatchEvent(new Event('visibilitychange'))
    vi.advanceTimersByTime(5000)
    expect(toaster.toasts.filter((t) => t.state !== 'leaving')).toHaveLength(0)
  })

  const pointer = (type, o) => {
    const e = new Event(type, { bubbles: true, cancelable: true })
    return Object.assign(e, { pointerId: 1, pointerType: 'touch', clientX: 0, ...o })
  }
  it('deslizar con el dedo más de un tercio del ancho cierra (swipe); mientras, is-swiping y --_toast-swipe', async () => {
    const { toaster } = await setup()
    const onDismiss = vi.fn()
    toaster.info('Desliza', { onDismiss })
    await flush()
    const li = toasts()[0]
    Object.defineProperty(li, 'offsetWidth', { value: 300 })
    li.querySelector('.g-toast__content').dispatchEvent(pointer('pointerdown', { clientX: 10 }))
    li.dispatchEvent(pointer('pointermove', { clientX: 60 }))
    await flush()
    expect(li.classList.contains('is-swiping')).toBe(true)
    expect(li.style.getPropertyValue('--_toast-swipe')).toBe('50px')
    expect(root().classList.contains('is-paused')).toBe(true)
    vi.advanceTimersByTime(1000)
    li.dispatchEvent(pointer('pointerup', { clientX: 150 }))
    await flush()
    expect(onDismiss).toHaveBeenCalledWith('swipe', expect.any(Object))
    expect(li.classList.contains('is-swiping')).toBe(false)
    expect(li.style.getPropertyValue('--_toast-swipe')).toBe('300px')
  })

  it('un arrastre corto y lento vuelve a su sitio; el ratón no desliza', async () => {
    const { toaster } = await setup()
    toaster.info('Quieto')
    await flush()
    const li = toasts()[0]
    Object.defineProperty(li, 'offsetWidth', { value: 300 })
    li.dispatchEvent(pointer('pointerdown', { clientX: 10 }))
    vi.advanceTimersByTime(1000)
    li.dispatchEvent(pointer('pointerup', { clientX: 60 }))
    await flush()
    expect(toaster.toasts).toHaveLength(1)
    expect(li.style.getPropertyValue('--_toast-swipe')).toBe('0px')
    li.dispatchEvent(pointer('pointerdown', { clientX: 10, pointerType: 'mouse' }))
    li.dispatchEvent(pointer('pointerup', { clientX: 290, pointerType: 'mouse' }))
    await flush()
    expect(toaster.toasts).toHaveLength(1)
  })

  it('un gesto rápido (> 0,5 px/ms) cierra aunque no llegue al tercio; swipe:false no desliza', async () => {
    const { toaster } = await setup()
    toaster.info('Rápido')
    await flush()
    const li = toasts()[0]
    Object.defineProperty(li, 'offsetWidth', { value: 300 })
    li.dispatchEvent(pointer('pointerdown', { clientX: 10 }))
    vi.advanceTimersByTime(50)
    li.dispatchEvent(pointer('pointerup', { clientX: -50 }))
    await flush()
    expect(toaster.toasts[0].state).toBe('leaving')
    expect(li.style.getPropertyValue('--_toast-swipe')).toBe('-300px')
    vi.advanceTimersByTime(1)
    toaster.configure({ swipe: false })
    toaster.info('Fijo')
    await flush()
    const li2 = toasts().at(-1)
    li2.dispatchEvent(pointer('pointerdown', { clientX: 10 }))
    li2.dispatchEvent(pointer('pointerup', { clientX: 290 }))
    await flush()
    expect(toaster.toasts.filter((t) => t.state === 'visible')).toHaveLength(1)
  })
})

describe('GToaster · no tapar el foco (2.4.11)', () => {
  it('si el foco queda bajo la pila pasa al borde contrario (data-flipped) y vuelve al enfocar otra cosa', async () => {
    const { toaster } = await setup()
    toaster.info('Tapa')
    await flush()
    const list = document.querySelector('.g-toaster__list')
    list.getBoundingClientRect = () => (root().dataset.edge === 'bottom'
      ? { left: 600, right: 960, top: 700, bottom: 780, width: 360, height: 80 }
      : { left: 600, right: 960, top: 16, bottom: 96, width: 360, height: 80 })
    const field = document.getElementById('field')
    field.getBoundingClientRect = () => ({ left: 0, right: 1000, top: 740, bottom: 770, width: 1000, height: 30 })
    field.focus()
    await frames(1)
    await flush()
    expect(root().hasAttribute('data-flipped')).toBe(true)
    expect(root().dataset.edge).toBe('top')
    document.getElementById('other').focus()
    await frames(1)
    await flush()
    expect(root().hasAttribute('data-flipped')).toBe(false)
    expect(root().dataset.edge).toBe('bottom')
  })
})

describe('GToaster · con un GDialog modal real', () => {
  const Host = (toaster, open) => defineComponent({
    setup() {
      return () => h('div', [
        h(GDialog, { modelValue: open.value, 'onUpdate:modelValue': (v) => { open.value = v }, title: 'Editar', closeLabel: 'Cerrar' }, { default: () => h('input', { id: 'dlg-field' }) }),
        h(GToaster)
      ])
    }
  })
  async function setupDialog() {
    const toaster = createToaster({ labels: LABELS })
    const open = ref(false)
    const w = mount(Host(toaster, open), { attachTo: document.body, global: { plugins: [toaster] } })
    wrappers.push(w)
    await flush()
    return { toaster, open, w }
  }

  it('la región se traslada al <dialog> abierto (mismos nodos, abierta) y vuelve a body al cerrarlo, con avisos y tiempo intactos', async () => {
    const { toaster, open } = await setupDialog()
    const r = root()
    const channel = live('status')
    toaster.success('Antes')
    await flush()
    vi.advanceTimersByTime(3000)
    open.value = true
    await flush()
    await flush()
    const dlg = document.querySelector('dialog.g-dialog')
    expect(dlg.hasAttribute('open')).toBe(true)
    expect(r.parentElement).toBe(dlg)
    expect(root()).toBe(r)
    expect(live('status')).toBe(channel)
    expect(r.hasAttribute('data-popover-open')).toBe(true)
    expect(toasts()).toHaveLength(1)
    open.value = false
    await flush()
    await flush()
    expect(r.parentElement).toBe(document.body)
    expect(r.hasAttribute('data-popover-open')).toBe(true)
    // El tiempo siguió (3000 + 1999 < 5000): no se reinició con el traslado
    vi.advanceTimersByTime(1999)
    expect(toaster.toasts).toHaveLength(1)
    vi.advanceTimersByTime(1)
    expect(toaster.toasts[0]?.state ?? 'gone').not.toBe('visible')
  })

  it('Esc en un aviso dentro del modal no emite dismiss de GDialog ni lo cierra; Esc fuera de los avisos sí', async () => {
    const { toaster, open, w } = await setupDialog()
    open.value = true
    await flush()
    await flush()
    toaster.error('Dentro')
    await flush()
    const dialog = w.findComponent(GDialog)
    const close = document.querySelector('dialog .g-toast__close')
    close.focus()
    close.dispatchEvent(key('Escape'))
    await flush()
    expect(dialog.emitted('dismiss')).toBeFalsy()
    expect(open.value).toBe(true)
    expect(toaster.toasts[0].state).toBe('leaving')
    // El foco no se pierde en body: primer control del modal
    expect(document.querySelector('dialog').contains(document.activeElement)).toBe(true)
    document.getElementById('dlg-field').dispatchEvent(key('Escape'))
    await flush()
    expect(dialog.emitted('dismiss')[0][0].reason).toBe('escape')
    expect(open.value).toBe(false)
  })
})
