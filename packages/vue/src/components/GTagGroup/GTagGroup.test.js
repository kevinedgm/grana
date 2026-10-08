import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { h, nextTick, ref, toRaw } from 'vue'
import GTagGroup from './GTagGroup.vue'
import { categoryOf } from '../../utils/categoryHash.js'
import { stubPopover, resetEngine } from '../../utils/visualTipTestEnv.js'

// Contrato: design/contracts/tag.md (lima, #460 a #473). Δ0 de la huella, la recogida animada, la vista previa, el recorte y
// el árbol de accesibilidad real se miden con Playwright en los tres motores (tests/tag.spec.mjs, personalidad-tag.spec.mjs).

const LBL = {
  remove: 'Quitar {label}', removeIn: 'Quitar {label} de {facet}',
  removed: '{label} quitada. Deshacer disponible', removedIn: '{label} quitada de {facet}. Deshacer disponible',
  undo: 'Deshacer: quitar {label}', undoIn: 'Deshacer: quitar {label} de {facet}', restored: '{label} restaurada',
  more: 'Ver {count} más', less: 'Ver menos', clearAll: 'Quitar todas', cleared: 'Se quitaron {count} etiquetas',
  undoAll: 'Deshacer: volver a poner {count}', restoredAll: '{count} etiquetas restauradas', empty: 'Sin etiquetas'
}
const ALERGIAS = () => [
  { id: 'pen', label: 'Penicilina', removable: true },
  { id: 'lat', label: 'Látex', removable: true },
  { id: 'nue', label: 'Nueces', removable: true },
  { id: 'pol', label: 'Polen', removable: true }
]

const wrappers = []
let outside
beforeEach(() => {
  stubPopover(); resetEngine()
  // jsdom no maqueta: un ancho fijo para la medida de la huella
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function () {
    const w = this.classList && this.classList.contains('g-tag') ? 87.5 : 0
    return { x: 0, y: 0, top: 0, left: 0, right: w, bottom: 32, width: w, height: 32, toJSON() {} }
  })
  outside = document.createElement('button')
  outside.id = 'fuera'
  outside.textContent = 'Fuera'
  document.body.append(outside)
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.useRealTimers()
  while (wrappers.length) wrappers.pop().unmount()
  document.body.innerHTML = ''
})
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const mk = (props = {}, opts = {}) => {
  const w = mount(GTagGroup, { props: { label: 'Alergias', labels: LBL, items: ALERGIAS(), ...props }, attachTo: document.body, ...opts })
  wrappers.push(w)
  return w
}
// Con v-model:items (la aplicación sustituye el arreglo)
const mkModel = (items, props = {}) => {
  const model = ref(items)
  const events = []
  const W = { render: () => h(GTagGroup, { label: 'Alergias', labels: LBL, ...props, items: model.value, 'onUpdate:items': (v) => { events.push('update:items'); model.value = v }, onRemove: () => events.push('remove'), onRestore: () => events.push('restore'), onSettle: (p) => events.push(['settle', p.items.map((x) => x.id)]) }) }
  const w = mount(W, { attachTo: document.body })
  wrappers.push(w)
  return { w, model, events }
}
const texts = (w) => w.findAll('.g-tag:not(.is-ghost) .g-tag__text').map((x) => x.text())
const ids = (w) => w.findAll('[data-id]').map((x) => x.attributes('data-id'))
const li = (w, id) => w.find(`[data-id="${id}"]`)
const live = (w) => w.find('.g-tag-group__live').text()
const active = () => document.activeElement
const fresh = async () => { vi.resetModules(); return (await import('./GTagGroup.vue')).default }
const spyWarn = () => vi.spyOn(console, 'warn').mockImplementation(() => {})
const grana = (s) => s.mock.calls.map((c) => String(c[0])).filter((m) => m.startsWith('[Grana GTagGroup]'))
const leave = async (w) => {
  outside.focus()
  w.find('.g-tag-group').element.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: outside }))
  await wait(0)
  await nextTick()
}
const key = (el, k) => { const e = new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }); el.dispatchEvent(e); return e }

describe('GTagGroup · marcado (tag.md §«El grupo», #464)', () => {
  it('flow: raíz <div> sin rol; <ul role="list"> con nombre; <li data-id> con su GTag; región viva vacía al montar', () => {
    const w = mk()
    const r = w.find('.g-tag-group')
    expect(r.element.tagName).toBe('DIV')
    expect(r.classes()).toEqual(['g-tag-group', 'g-tag-group--layout-flow', 'g-tag-group--size-md'])
    expect(r.attributes('role')).toBeUndefined()
    const ul = w.find('.g-tag-group__list')
    expect(ul.element.tagName).toBe('UL')
    expect(ul.attributes('role')).toBe('list')
    expect(ul.attributes('aria-label')).toBe('Alergias')
    expect(ul.attributes('id')).toBeTruthy()
    expect(w.findAll('li.g-tag-group__item').length).toBe(4)
    expect(ids(w)).toEqual(['pen', 'lat', 'nue', 'pol'])
    expect(w.find('li[data-id="pen"] > .g-tag.g-tag--size-md.is-removable').exists()).toBe(true)
    const lv = w.find('.g-tag-group__live')
    expect(lv.attributes('role')).toBe('status')
    expect(lv.text()).toBe('')
    expect(w.find('.g-tag-group__tools').exists()).toBe(false)
    expect(w.find('.g-tag__remove .g-tag__sr').text()).toBe('Quitar Penicilina')
  })
  it('labelledby → aria-labelledby en el contenedor', () => {
    const w = mk({ label: undefined, labelledby: 'titulo' })
    expect(w.find('.g-tag-group__list').attributes('aria-labelledby')).toBe('titulo')
    expect(w.find('.g-tag-group__list').attributes('aria-label')).toBeUndefined()
  })
  it('todas de alternar: <div role="group"> con nombre y <span> por etiqueta', () => {
    const w = mk({ label: 'Estado', items: [{ id: 1, label: 'Pendiente', pressed: true }, { id: 2, label: 'En curso', pressed: false }] })
    const c = w.find('.g-tag-group__list')
    expect(c.element.tagName).toBe('DIV')
    expect(c.attributes('role')).toBe('group')
    expect(c.attributes('aria-label')).toBe('Estado')
    expect(w.findAll('span.g-tag-group__item').length).toBe(2)
    expect(w.findAll('button[aria-pressed]').map((b) => b.attributes('aria-pressed'))).toEqual(['true', 'false'])
  })
  it('size sm llega a todas las etiquetas y a la raíz', () => {
    const w = mk({ size: 'sm' })
    expect(w.find('.g-tag-group').classes()).toContain('g-tag-group--size-sm')
    expect(w.findAll('.g-tag.g-tag--size-sm').length).toBe(4)
  })
  it('item.avatar hereda las categories del grupo (#513); con color o categories propios manda lo suyo', () => {
    const items = [
      { id: 'a', label: 'Ana López', avatar: true },
      { id: 'b', label: 'Bea', avatar: { initials: 'BT' } },
      { id: 'c', label: 'Ceci', avatar: { initials: 'CC', color: 3 } },
      { id: 'd', label: 'Dani', avatar: { initials: 'DD', categories: 0 } }
    ]
    const w = mk({ items, categories: 8 })
    const cat = (id) => li(w, id).find('.g-tag__lead > .g-avatar').attributes('data-cat')
    expect(cat('a')).toBe(String(categoryOf('Ana López', 8)))
    expect(cat('b')).toBe(String(categoryOf('Bea', 8)))
    expect(cat('c')).toBe('3')
    expect(cat('d')).toBeUndefined()
    const z = mk({ items })
    expect(z.find('[data-id="a"] .g-tag__lead > .g-avatar').attributes('data-cat')).toBeUndefined()
  })
  it('item.avatar → GAvatar xs decorativo en el hueco; item.icon → icono; el slot lead manda', () => {
    const items = [
      { id: 'a', label: 'Ana López', avatar: true },
      { id: 'b', label: 'Lápiz', icon: 'pencil' },
      { id: 'c', label: 'Luis', avatar: { initials: 'LT', size: 'xl', label: 'no' }, icon: 'pencil' }
    ]
    const w = mk({ items })
    const av = li(w, 'a').find('.g-tag__lead > .g-avatar')
    expect(av.classes()).toContain('g-avatar--size-xs')
    expect(av.attributes('aria-hidden')).toBe('true')
    expect(li(w, 'b').find('.g-tag__lead > svg').exists()).toBe(true)
    const c = li(w, 'c').find('.g-tag__lead > .g-avatar')
    expect(c.classes()).toContain('g-avatar--size-xs')
    expect(c.attributes('role')).toBeUndefined()
    const s = mount(GTagGroup, { props: { label: 'X', items }, slots: { lead: ({ item }) => h('i', { class: 'mio' }, item.id) }, attachTo: document.body })
    wrappers.push(s)
    expect(s.findAll('.g-tag__lead > i.mio').length).toBe(3)
    expect(s.find('.g-avatar').exists()).toBe(false)
  })
  it('slot label sustituye el texto visible ({ item, index })', () => {
    const w = mount(GTagGroup, { props: { label: 'X', items: [{ id: 1, label: 'Vue', n: 12 }] }, slots: { label: ({ item, index }) => `${item.label} · ${item.n} · ${index}` }, attachTo: document.body })
    wrappers.push(w)
    expect(w.find('.g-tag__text').text()).toBe('Vue · 12 · 0')
  })
  it('otros campos del item se conservan y llegan a los eventos', async () => {
    const w = mk({ items: [{ id: 1, label: 'Vue', href: '#vue', extra: 'x' }] })
    w.find('a').element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }))
    const p = w.emitted('navigate')[0][0]
    expect(p.item.extra).toBe('x')
    expect(p.href).toBe('#vue')
    expect(p.event).toBeInstanceOf(MouseEvent)
  })
  it('navigate respeta la guarda de modificadores (#505)', () => {
    const w = mk({ items: [{ id: 1, label: 'Vue', href: '#vue' }] })
    w.find('a').element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0, metaKey: true }))
    expect(w.emitted('navigate')).toBeUndefined()
  })
})

describe('GTagGroup · v-model:items', () => {
  it('sin v-model: quitar emite un arreglo NUEVO; los que no cambian conservan su referencia; el grupo guarda su copia', async () => {
    const items = ALERGIAS()
    const w = mk({ items })
    await li(w, 'lat').find('.g-tag__remove').trigger('click')
    const next = w.emitted('update:items')[0][0]
    expect(next).not.toBe(items)
    expect(next.map((x) => x.id)).toEqual(['pen', 'nue', 'pol'])
    expect(toRaw(next[0])).toBe(items[0])
    expect(items.length).toBe(4) // nunca muta el recibido
    // Sin v-model: la etiqueta quitada queda como huella y las demás siguen
    expect(texts(w)).toEqual(['Penicilina', 'Nueces', 'Polen'])
  })
  it('con v-model: orden de eventos update:items → remove; el modelo cambia en el acto', async () => {
    const { w, model, events } = mkModel(ALERGIAS())
    await li(w, 'pen').find('.g-tag__remove').trigger('click')
    expect(events).toEqual(['update:items', 'remove'])
    expect(model.value.map((x) => x.id)).toEqual(['lat', 'nue', 'pol'])
  })
  it('alternar: arreglo nuevo con el elemento como objeto nuevo y pressed invertido; toggle después', async () => {
    const items = [{ id: 1, label: 'Pendiente', pressed: false }, { id: 2, label: 'Cerrado', pressed: true }]
    const w = mk({ items })
    await w.find('[data-id="1"] button').trigger('click')
    const next = w.emitted('update:items')[0][0]
    expect(next[0]).not.toBe(items[0])
    expect(next[0]).toEqual({ id: 1, label: 'Pendiente', pressed: true })
    expect(toRaw(next[1])).toBe(items[1])
    expect(w.emitted('toggle')[0][0]).toEqual({ item: next[0], pressed: true })
    expect(w.find('[data-id="1"] button').attributes('aria-pressed')).toBe('true')
  })
  it('un cambio de la aplicación en items se respeta', async () => {
    const w = mk()
    await w.setProps({ items: [{ id: 'x', label: 'Nuevo', removable: true }] })
    expect(texts(w)).toEqual(['Nuevo'])
  })
})

describe('GTagGroup · A «Huella» (#466)', () => {
  it('quitar: la huella queda en su sitio con --_ghost-w medido, «Deshacer» con el foco, anuncio; sale del modelo', async () => {
    const w = mk()
    await li(w, 'lat').find('.g-tag__remove').trigger('click')
    await nextTick()
    expect(ids(w)).toEqual(['pen', 'lat', 'nue', 'pol'])
    const g = li(w, 'lat').find('.g-tag')
    expect(g.classes()).toContain('is-ghost')
    expect(g.attributes('style')).toContain('--_ghost-w: 87.5px')
    expect(g.find('.g-tag__body').attributes('aria-hidden')).toBe('true')
    expect(g.find('.g-tag__remove').exists()).toBe(false)
    const undo = g.find('button.g-tag__undo')
    expect(undo.find('.g-tag__sr').text()).toBe('Deshacer: quitar Látex')
    expect(undo.find('svg.g-icon--flip-rtl').exists()).toBe(true)
    expect(active()).toBe(undo.element)
    expect(w.emitted('remove')[0][0]).toMatchObject({ item: { id: 'lat' }, index: 1, source: 'button' })
    await wait(80)
    expect(live(w)).toBe('Látex quitada. Deshacer disponible')
  })
  it('Supr sobre «Quitar» quita con source "key"; Retroceso sobre el cuerpo de un enlace también', async () => {
    const w = mk({ items: [{ id: 1, label: 'A', removable: true }, { id: 2, label: 'B', href: '#b', removable: true }] })
    key(li(w, 1).find('.g-tag__remove').element, 'Delete')
    await nextTick()
    key(li(w, 2).find('a').element, 'Backspace')
    await nextTick()
    expect(w.emitted('remove').map((x) => x[0].source)).toEqual(['key', 'key'])
  })
  it('deshacer: vuelve a su sitio (delante del que le seguía), restore, foco a su «Quitar», anuncio', async () => {
    const { w, model, events } = mkModel(ALERGIAS())
    await li(w, 'lat').find('.g-tag__remove').trigger('click')
    await nextTick()
    await li(w, 'lat').find('.g-tag__undo').trigger('click')
    await nextTick()
    expect(model.value.map((x) => x.id)).toEqual(['pen', 'lat', 'nue', 'pol'])
    expect(events).toEqual(['update:items', 'remove', 'update:items', 'restore'])
    expect(active()).toBe(li(w, 'lat').find('.g-tag__remove').element)
    await wait(80)
    expect(w.find('.g-tag-group__live').text()).toBe('Látex restaurada')
  })
  it('deshacer cuando el que le seguía ya no existe: detrás del anterior; sin vecinos: al final', async () => {
    const { w, model } = mkModel(ALERGIAS())
    await li(w, 'lat').find('.g-tag__remove').trigger('click')
    await nextTick()
    // La aplicación quita «Nueces» y «Polen» por su cuenta
    model.value = model.value.filter((x) => x.id === 'pen')
    await nextTick()
    await li(w, 'lat').find('.g-tag__undo').trigger('click')
    expect(model.value.map((x) => x.id)).toEqual(['pen', 'lat'])
    // Sin ningún vecino
    const b = mkModel([{ id: 1, label: 'Uno', removable: true }])
    await li(b.w, 1).find('.g-tag__remove').trigger('click')
    await nextTick()
    b.model.value = [{ id: 9, label: 'Otro' }]
    await nextTick()
    await li(b.w, 1).find('.g-tag__undo').trigger('click')
    expect(b.model.value.map((x) => x.id)).toEqual([9, 1])
  })
  it('varias huellas conviven, cada una con su «Deshacer», en sus sitios', async () => {
    const w = mk()
    await li(w, 'lat').find('.g-tag__remove').trigger('click')
    await nextTick()
    await li(w, 'nue').find('.g-tag__remove').trigger('click')
    await nextTick()
    expect(ids(w)).toEqual(['pen', 'lat', 'nue', 'pol'])
    expect(w.findAll('.g-tag.is-ghost').length).toBe(2)
    expect(w.emitted('update:items')[1][0].map((x) => x.id)).toEqual(['pen', 'pol'])
  })
  it('se recogen todas a la vez cuando el foco sale (is-settling, salen del DOM, settle)', async () => {
    const w = mk()
    await li(w, 'lat').find('.g-tag__remove').trigger('click')
    await nextTick()
    await li(w, 'nue').find('.g-tag__remove').trigger('click')
    await nextTick()
    await leave(w)
    expect(li(w, 'lat').classes()).toContain('is-settling')
    expect(li(w, 'nue').classes()).toContain('is-settling')
    expect(w.emitted('settle')).toBeUndefined()
    await wait(150) // respaldo (jsdom no tiene transiciones)
    await nextTick()
    expect(ids(w)).toEqual(['pen', 'pol'])
    expect(w.emitted('settle')[0][0].items.map((x) => x.id)).toEqual(['lat', 'nue'])
  })
  it('sale del DOM en el transitionend de inline-size de la etiqueta (no de otra propiedad)', async () => {
    const w = mk()
    await li(w, 'lat').find('.g-tag__remove').trigger('click')
    await nextTick()
    await leave(w)
    await nextTick()
    const tag = li(w, 'lat').find('.g-tag').element
    const te = (prop, target = tag) => { const e = new Event('transitionend', { bubbles: true }); Object.defineProperty(e, 'propertyName', { value: prop }); target.dispatchEvent(e) }
    te('opacity')
    te('inline-size', tag.querySelector('.g-tag__text'))
    await nextTick()
    expect(li(w, 'lat').exists()).toBe(true)
    te('inline-size')
    await nextTick()
    expect(li(w, 'lat').exists()).toBe(false)
    expect(w.emitted('settle').length).toBe(1)
  })
  it('con movimiento reducido salen del DOM en el acto', async () => {
    vi.stubGlobal('matchMedia', (q) => ({ matches: /reduce/.test(q), media: q, addEventListener() {}, removeEventListener() {} }))
    const w = mk()
    await li(w, 'lat').find('.g-tag__remove').trigger('click')
    await nextTick()
    await leave(w)
    await nextTick()
    expect(li(w, 'lat').exists()).toBe(false)
    expect(w.emitted('settle')[0][0].items.map((x) => x.id)).toEqual(['lat'])
  })
  it('un puntero con hover sobre el grupo lo impide; al salir el puntero se recogen', async () => {
    const w = mk()
    const root = w.find('.g-tag-group').element
    const pe = (type, pointerType = 'mouse') => { const e = new MouseEvent(type, { bubbles: false }); Object.defineProperty(e, 'pointerType', { value: pointerType }); root.dispatchEvent(e) }
    pe('pointerenter')
    await li(w, 'lat').find('.g-tag__remove').trigger('click')
    await nextTick()
    await leave(w)
    expect(li(w, 'lat').classes()).not.toContain('is-settling')
    pe('pointerleave')
    await nextTick()
    expect(li(w, 'lat').classes()).toContain('is-settling')
  })
  it('en táctil cuenta solo el foco (pointerenter touch no retiene)', async () => {
    const w = mk()
    const root = w.find('.g-tag-group').element
    const e = new MouseEvent('pointerenter'); Object.defineProperty(e, 'pointerType', { value: 'touch' }); root.dispatchEvent(e)
    await li(w, 'lat').find('.g-tag__remove').trigger('click')
    await nextTick()
    await leave(w)
    expect(li(w, 'lat').classes()).toContain('is-settling')
  })
  it('un toque fuera del grupo (pointerdown) con el foco fuera recoge', async () => {
    const w = mk()
    const root = w.find('.g-tag-group').element
    const pe = new MouseEvent('pointerenter'); Object.defineProperty(pe, 'pointerType', { value: 'mouse' }); root.dispatchEvent(pe)
    await li(w, 'lat').find('.g-tag__remove').trigger('click')
    await nextTick()
    outside.focus()
    await wait(0)
    expect(li(w, 'lat').classes()).not.toContain('is-settling')
    outside.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }))
    await wait(0)
    await nextTick()
    expect(li(w, 'lat').classes()).toContain('is-settling')
  })
  it('un id que vuelve mientras su huella está a la vista sustituye a la huella', async () => {
    const { w, model } = mkModel(ALERGIAS())
    await li(w, 'lat').find('.g-tag__remove').trigger('click')
    await nextTick()
    model.value = ALERGIAS()
    await nextTick()
    expect(w.findAll('.g-tag.is-ghost').length).toBe(0)
    expect(ids(w)).toEqual(['pen', 'lat', 'nue', 'pol'])
  })
  it('desmontar con huellas pendientes emite settle', async () => {
    const settle = vi.fn()
    const w = mount(GTagGroup, { props: { label: 'A', labels: LBL, items: ALERGIAS(), onSettle: settle }, attachTo: document.body })
    await w.find('[data-id="pen"] .g-tag__remove').trigger('click')
    w.unmount()
    expect(settle).toHaveBeenCalledWith({ items: [expect.objectContaining({ id: 'pen' })] })
  })
})

describe('GTagGroup · «Quitar todas» (#466.9)', () => {
  it('aparece con ≥ 2 quitables habilitadas; GBtn link accent sm', () => {
    const w = mk({ clearable: true })
    const b = w.find('.g-tag-group__tools > .g-tag-group__clear')
    expect(b.classes()).toEqual(expect.arrayContaining(['g-btn', 'g-btn--variant-link', 'g-btn--size-sm']))
    expect(b.text()).toBe('Quitar todas')
    const one = mk({ clearable: true, items: [{ id: 1, label: 'A', removable: true }, { id: 2, label: 'B', removable: true, disabled: true }] })
    expect(one.find('.g-tag-group__clear').exists()).toBe(false)
  })
  it('quita las quitables habilitadas SIN huella, el mismo botón pasa a «Deshacer» con el foco; deshacer las devuelve a su sitio', async () => {
    const items = [{ id: 'a', label: 'A', removable: true }, { id: 'f', label: 'Fija' }, { id: 'b', label: 'B', removable: true }, { id: 'd', label: 'D', removable: true, disabled: true }]
    const { w, model, events } = mkModel(items, { clearable: true })
    const btn = w.find('.g-tag-group__clear')
    await btn.trigger('click')
    await nextTick()
    expect(model.value.map((x) => x.id)).toEqual(['f', 'd'])
    expect(w.findAll('.g-tag.is-ghost').length).toBe(0)
    const undo = w.find('.g-tag-group__clear')
    expect(undo.element).toBe(btn.element)
    expect(undo.classes()).toContain('is-undo')
    expect(undo.text()).toBe('Deshacer: volver a poner 2')
    expect(undo.find('svg.g-icon--flip-rtl').exists()).toBe(true)
    expect(active()).toBe(undo.element)
    await wait(80)
    expect(live(w)).toBe('Se quitaron 2 etiquetas')
    await undo.trigger('click')
    await nextTick()
    expect(model.value.map((x) => x.id)).toEqual(['a', 'f', 'b', 'd'])
    expect(events.filter((e) => typeof e === 'string')).toEqual(['update:items', 'update:items', 'restore'])
    expect(active()).toBe(w.find('.g-tag-group__clear').element)
    expect(w.find('.g-tag-group__clear').text()).toBe('Quitar todas')
    await wait(80)
    expect(live(w)).toBe('2 etiquetas restauradas')
  })
  it('emite clear { items } y restore con source "undo-all"', async () => {
    const w = mk({ clearable: true })
    await w.find('.g-tag-group__clear').trigger('click')
    expect(w.emitted('clear')[0][0].items.map((x) => x.id)).toEqual(['pen', 'lat', 'nue', 'pol'])
    await nextTick()
    await w.find('.g-tag-group__clear').trigger('click')
    expect(w.emitted('restore')[0][0]).toMatchObject({ source: 'undo-all' })
    expect(w.emitted('restore')[0][0].items.map((x) => x.id)).toEqual(['pen', 'lat', 'nue', 'pol'])
  })
  it('recoge al instante las huellas que hubiera y las incluye en su settle; el «Deshacer» se va al salir el foco', async () => {
    const w = mk({ clearable: true, items: [...ALERGIAS(), { id: 'x', label: 'X', removable: true }] })
    await li(w, 'x').find('.g-tag__remove').trigger('click')
    await nextTick()
    await w.find('.g-tag-group__clear').trigger('click')
    await nextTick()
    expect(w.findAll('.g-tag.is-ghost').length).toBe(0)
    expect(w.find('.g-tag-group__empty').exists()).toBe(false) // vacío, pero con «Deshacer» pendiente
    await leave(w)
    expect(w.find('.g-tag-group__clear').exists()).toBe(false)
    expect(w.emitted('settle')[0][0].items.map((x) => x.id)).toEqual(['pen', 'lat', 'nue', 'pol', 'x'])
    expect(w.find('.g-tag-group__empty').text()).toBe('Sin etiquetas')
  })
})

describe('GTagGroup · «Deshacer» de «Quitar todas» caduca como las huellas (#466.6, hallazgo 5)', () => {
  const pe = (root, type, pointerType = 'mouse') => { const e = new MouseEvent(type, { bubbles: false }); Object.defineProperty(e, 'pointerType', { value: pointerType }); root.dispatchEvent(e) }
  it('con el puntero encima, perder el foco (mousedown de WebKit) no lo retira; el clic deshace', async () => {
    const { w, model, events } = mkModel(ALERGIAS(), { clearable: true })
    const root = w.find('.g-tag-group').element
    pe(root, 'pointerenter')
    await w.find('.g-tag-group__clear').trigger('click')
    await nextTick()
    // WebKit: el mousedown sobre el botón deja el foco en <body>
    const undo = w.find('.g-tag-group__clear').element
    undo.blur()
    root.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: null }))
    await wait(0)
    await nextTick()
    expect(w.find('.g-tag-group__clear').classes()).toContain('is-undo')
    expect(events.some((e) => Array.isArray(e) && e[0] === 'settle')).toBe(false)
    await w.find('.g-tag-group__clear').trigger('click')
    await nextTick()
    expect(model.value.map((x) => x.id)).toEqual(['pen', 'lat', 'nue', 'pol'])
    expect(events).toContain('restore')
  })
  it('sin foco dentro, al salir el puntero se retira y emite settle', async () => {
    const w = mk({ clearable: true })
    const root = w.find('.g-tag-group').element
    pe(root, 'pointerenter')
    await w.find('.g-tag-group__clear').trigger('click')
    await nextTick()
    await leave(w)
    expect(w.find('.g-tag-group__clear').classes()).toContain('is-undo')
    pe(root, 'pointerleave')
    await nextTick()
    expect(w.find('.g-tag-group__clear').exists()).toBe(false)
    expect(w.emitted('settle')[0][0].items.map((x) => x.id)).toEqual(['pen', 'lat', 'nue', 'pol'])
  })
  it('con el foco dentro, salir el puntero no lo retira', async () => {
    const w = mk({ clearable: true })
    const root = w.find('.g-tag-group').element
    pe(root, 'pointerenter')
    await w.find('.g-tag-group__clear').trigger('click')
    await nextTick()
    pe(root, 'pointerleave')
    await nextTick()
    expect(w.find('.g-tag-group__clear').classes()).toContain('is-undo')
    expect(w.emitted('settle')).toBeUndefined()
  })
  it('un pointerdown fuera con el foco fuera lo retira', async () => {
    const w = mk({ clearable: true })
    const root = w.find('.g-tag-group').element
    pe(root, 'pointerenter')
    await w.find('.g-tag-group__clear').trigger('click')
    await nextTick()
    outside.focus()
    await wait(0)
    expect(w.find('.g-tag-group__clear').classes()).toContain('is-undo')
    outside.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }))
    await wait(0)
    await nextTick()
    expect(w.find('.g-tag-group__clear').exists()).toBe(false)
    expect(w.emitted('settle')).toHaveLength(1)
  })
})

describe('GTagGroup · foco cuando el control desaparece por otra causa (#465)', () => {
  it('la aplicación quita la etiqueta enfocada → control equivalente de la siguiente', async () => {
    const { w, model } = mkModel(ALERGIAS())
    li(w, 'lat').find('.g-tag__remove').element.focus()
    model.value = model.value.filter((x) => x.id !== 'lat')
    await nextTick()
    expect(active()).toBe(li(w, 'nue').find('.g-tag__remove').element)
  })
  it('del cuerpo al cuerpo: un enlace enfocado lleva al enlace siguiente (no a su «Quitar»)', async () => {
    const items = [{ id: 1, label: 'A', href: '#a', removable: true }, { id: 2, label: 'B', href: '#b', removable: true }]
    const { w, model } = mkModel(items)
    li(w, 1).find('a').element.focus()
    model.value = [items[1]]
    await nextTick()
    expect(active()).toBe(li(w, 2).find('a').element)
  })
  it('sin siguiente → la anterior más cercana; las estáticas se saltan', async () => {
    const items = [{ id: 1, label: 'A', removable: true }, { id: 2, label: 'Estática' }, { id: 3, label: 'C', removable: true }]
    const { w, model } = mkModel(items)
    li(w, 3).find('.g-tag__remove').element.focus()
    model.value = items.slice(0, 2)
    await nextTick()
    expect(active()).toBe(li(w, 1).find('.g-tag__remove').element)
  })
  it('una etiqueta deja de ser quitable con el foco en su «Quitar» → la siguiente', async () => {
    const { w, model } = mkModel(ALERGIAS())
    li(w, 'pen').find('.g-tag__remove').element.focus()
    model.value = [{ ...model.value[0], removable: false }, ...model.value.slice(1)]
    await nextTick()
    expect(active()).toBe(li(w, 'lat').find('.g-tag__remove').element)
  })
  it('sin ninguna: emptyFocus como selector, elemento o función', async () => {
    for (const ef of ['#fuera', () => outside, outside, () => ({ $el: outside })]) {
      const { w, model } = mkModel([{ id: 1, label: 'A', removable: true }], { emptyFocus: ef })
      li(w, 1).find('.g-tag__remove').element.focus()
      model.value = []
      await nextTick()
      expect(active()).toBe(outside)
      w.unmount()
      wrappers.splice(wrappers.indexOf(w), 1)
    }
  })
  it('sin emptyFocus: el contenedor con tabindex="-1" (se quita al salir); vacío referencia labels.empty', async () => {
    const { w, model } = mkModel([{ id: 1, label: 'A', removable: true }])
    li(w, 1).find('.g-tag__remove').element.focus()
    model.value = []
    await nextTick()
    await nextTick()
    const list = w.find('.g-tag-group__list')
    expect(list.attributes('tabindex')).toBe('-1')
    expect(active()).toBe(list.element)
    const empty = w.find('.g-tag-group__empty')
    expect(list.attributes('aria-describedby')).toBe(empty.attributes('id'))
    expect(list.attributes('role')).toBe('list')
    expect(list.attributes('aria-label')).toBe('Alergias')
    list.element.dispatchEvent(new FocusEvent('blur'))
    await nextTick()
    expect(w.find('.g-tag-group__list').attributes('tabindex')).toBeUndefined()
  })
  it('G10: emptyFocus que no se encuentra → aviso y foco al contenedor', async () => {
    const G = await fresh()
    const s = spyWarn()
    const model = ref([{ id: 1, label: 'A', removable: true }])
    const w = mount({ render: () => h(G, { label: 'X', labels: LBL, items: model.value, emptyFocus: '#no-existe' }) }, { attachTo: document.body })
    wrappers.push(w)
    w.find('.g-tag__remove').element.focus()
    model.value = []
    await nextTick()
    await nextTick()
    expect(active()).toBe(w.find('.g-tag-group__list').element)
    expect(grana(s).some((m) => /emptyFocus no se encuentra/.test(m))).toBe(true)
  })
})

describe('GTagGroup · limit (APG Disclosure)', () => {
  const many = () => Array.from({ length: 6 }, (_, i) => ({ id: i, label: `T${i}`, removable: true }))
  it('«Ver N más»: aria-expanded, aria-controls al contenedor, ocultas con hidden; el foco se queda en el botón', async () => {
    const w = mk({ items: many(), limit: 3 })
    const more = w.find('.g-tag-group__more')
    expect(more.text()).toBe('Ver 3 más')
    expect(more.attributes('aria-expanded')).toBe('false')
    expect(more.attributes('aria-controls')).toBe(w.find('.g-tag-group__list').attributes('id'))
    expect(w.findAll('[data-id][hidden]').map((x) => x.attributes('data-id'))).toEqual(['3', '4', '5'])
    more.element.focus()
    await more.trigger('click')
    await nextTick()
    expect(w.find('.g-tag-group__more').attributes('aria-expanded')).toBe('true')
    expect(w.find('.g-tag-group__more').text()).toBe('Ver menos')
    expect(w.findAll('[data-id][hidden]').length).toBe(0)
    expect(active()).toBe(w.find('.g-tag-group__more').element)
  })
  it('las huellas cuentan en la ventana (nada sube desde las ocultas); «Ver N más» cuenta solo las vivas ocultas', async () => {
    const w = mk({ items: many(), limit: 3 })
    await li(w, 1).find('.g-tag__remove').trigger('click')
    await nextTick()
    expect(w.findAll('[data-id]:not([hidden])').map((x) => x.attributes('data-id'))).toEqual(['0', '1', '2'])
    expect(w.find('.g-tag-group__more').text()).toBe('Ver 3 más')
  })
  it('sin nada oculto no hay botón', () => {
    expect(mk({ items: many().slice(0, 3), limit: 3 }).find('.g-tag-group__more').exists()).toBe(false)
  })
})

describe('GTagGroup · B «Racimo» (layout="facets", #467)', () => {
  const FIL = () => [
    { id: 1, label: 'Pendiente', facet: 'Estado', removable: true },
    { id: 2, label: 'Alta', facet: 'Prioridad', removable: true },
    { id: 3, label: 'En curso', facet: 'Estado', removable: true },
    { id: 4, label: 'Suelta', removable: true },
    { id: 5, label: 'Alta', facet: 'Impacto', removable: true }
  ]
  it('racimos en orden de primera aparición, valores en orden de items; sueltas en su lugar sin lista interior', () => {
    const w = mk({ layout: 'facets', items: FIL(), categories: 8 })
    const outer = w.find('ul.g-tag-group__list')
    expect(outer.attributes('role')).toBe('list')
    const kids = [...outer.element.children]
    expect(kids.map((k) => k.className.split(' ')[0])).toEqual(['g-tag-group__facet', 'g-tag-group__facet', 'g-tag-group__item', 'g-tag-group__facet'])
    const f = w.findAll('.g-tag-group__facet')
    expect(f.map((x) => x.find('.g-tag-group__facet-name').text())).toEqual(['Estado', 'Prioridad', 'Impacto'])
    expect(f[0].findAll('.g-tag-group__value').map((x) => x.attributes('data-id'))).toEqual(['1', '3'])
    const name = f[0].find('.g-tag-group__facet-name')
    expect(name.attributes('dir')).toBe('auto')
    const inner = f[0].find('ul.g-tag-group__values')
    expect(inner.attributes('role')).toBe('list')
    expect(inner.attributes('aria-labelledby')).toBe(name.attributes('id'))
    expect(f[0].findAll('.g-tag.is-plain').length).toBe(2)
    expect(w.find('li.g-tag-group__item[data-id="4"] > .g-tag').classes()).not.toContain('is-plain')
  })
  it('color: data-cat en el racimo (su primer elemento, clave colorKey ?? facet ?? label) y en cada etiqueta de dentro', () => {
    const w = mk({ layout: 'facets', items: FIL(), categories: 8 })
    const f = w.findAll('.g-tag-group__facet')
    const k = String(categoryOf('Estado', 8))
    expect(f[0].attributes('data-cat')).toBe(k)
    expect(f[0].findAll('.g-tag').map((t) => t.attributes('data-cat'))).toEqual([k, k])
    expect(w.find('[data-id="4"] .g-tag').attributes('data-cat')).toBe(String(categoryOf('Suelta', 8)))
  })
  it('flow: la clave del color también es colorKey ?? facet ?? label (#469)', () => {
    const items = [
      { id: 1, label: 'Alta', facet: 'Prioridad' },
      { id: 2, label: 'Baja', facet: 'Prioridad' },
      { id: 3, label: 'Alta', facet: 'Riesgo', colorKey: 'fijo' },
      { id: 4, label: 'Suelta' }
    ]
    const w = mk({ items, categories: 8 })
    const cat = (id) => w.find(`[data-id="${id}"] .g-tag`).attributes('data-cat')
    expect(cat(1)).toBe(String(categoryOf('Prioridad', 8)))
    expect(cat(2)).toBe(cat(1))
    expect(cat(3)).toBe(String(categoryOf('fijo', 8)))
    expect(cat(4)).toBe(String(categoryOf('Suelta', 8)))
  })
  it('nombres con faceta: «Quitar Alta de Prioridad» únicos aunque «Alta» esté en dos facetas', () => {
    const w = mk({ layout: 'facets', items: FIL() })
    const names = w.findAll('.g-tag__remove .g-tag__sr').map((x) => x.text())
    expect(names).toContain('Quitar Alta de Prioridad')
    expect(names).toContain('Quitar Alta de Impacto')
    expect(names).toContain('Quitar Suelta')
    expect(new Set(names).size).toBe(names.length)
  })
  it('quitar en un racimo: huella con undoIn, anuncio removedIn', async () => {
    const w = mk({ layout: 'facets', items: FIL() })
    await li(w, 2).find('.g-tag__remove').trigger('click')
    await nextTick()
    expect(li(w, 2).find('.g-tag').classes()).toEqual(expect.arrayContaining(['is-ghost', 'is-plain']))
    expect(li(w, 2).find('.g-tag__undo .g-tag__sr').text()).toBe('Deshacer: quitar Alta de Prioridad')
    await wait(80)
    expect(live(w)).toBe('Alta quitada de Prioridad. Deshacer disponible')
  })
  it('foco: primero dentro del mismo racimo', async () => {
    const items = FIL()
    const { w, model } = mkModel(items, { layout: 'facets' })
    li(w, 1).find('.g-tag__remove').element.focus()
    model.value = items.filter((x) => x.id !== 1)
    await nextTick()
    expect(active()).toBe(li(w, 3).find('.g-tag__remove').element)
  })
  it('alternar en un racimo: <span role="group"> nombrado por la faceta, valores <span>', () => {
    const w = mk({ layout: 'facets', items: [{ id: 1, label: 'Pendiente', facet: 'Estado', pressed: true }, { id: 2, label: 'Cerrado', facet: 'Estado', pressed: false }] })
    const g = w.find('.g-tag-group__values')
    expect(g.element.tagName).toBe('SPAN')
    expect(g.attributes('role')).toBe('group')
    expect(g.attributes('aria-labelledby')).toBe(w.find('.g-tag-group__facet-name').attributes('id'))
    expect(w.findAll('span.g-tag-group__value').length).toBe(2)
    expect(w.find('.g-tag.is-plain.is-pressed .g-tag__check').exists()).toBe(true)
  })
  it('G5: sin removeIn cae a remove y avisa', async () => {
    const G = await fresh()
    const s = spyWarn()
    const w = mount(G, { props: { label: 'F', layout: 'facets', items: FIL(), labels: { remove: 'Quitar {label}' } }, attachTo: document.body })
    wrappers.push(w)
    expect(w.find('[data-id="2"] .g-tag__sr').text()).toBe('Quitar Alta')
    expect(grana(s).some((m) => /labels\.removeIn/.test(m))).toBe(true)
  })
})

describe('GTagGroup · vacío y deshabilitado', () => {
  it('vacío: el contenedor sigue con rol y nombre, sin hijos; __empty con id referenciado', () => {
    const w = mk({ items: [] })
    const list = w.find('.g-tag-group__list')
    expect(list.attributes('role')).toBe('list')
    expect(list.element.children.length).toBe(0)
    const e = w.find('p.g-tag-group__empty')
    expect(e.text()).toBe('Sin etiquetas')
    expect(list.attributes('aria-describedby')).toBe(e.attributes('id'))
  })
  it('no se pinta el vacío mientras hay huellas', async () => {
    const w = mk({ items: [{ id: 1, label: 'A', removable: true }] })
    await w.find('.g-tag__remove').trigger('click')
    await nextTick()
    expect(w.find('.g-tag-group__empty').exists()).toBe(false)
  })
  it('disabled: todos los controles del grupo deshabilitados e is-disabled', () => {
    const w = mk({ disabled: true, clearable: true, items: [...ALERGIAS(), { id: 't', label: 'T', pressed: false }, { id: 'l', label: 'L', href: '#l' }] })
    expect(w.find('.g-tag-group').classes()).toContain('is-disabled')
    expect(w.findAll('.g-tag__remove').every((b) => b.attributes('disabled') !== undefined)).toBe(true)
    expect(w.find('[data-id="t"] button').attributes('disabled')).toBeDefined()
    expect(w.find('[data-id="l"] a').attributes('aria-disabled')).toBe('true')
    expect(w.find('.g-tag-group__clear').attributes('disabled')).toBeDefined()
  })
  it('disabled: «Ver N más» sigue activo y despliega (#512)', async () => {
    const w = mk({ disabled: true, limit: 2 })
    const more = w.find('.g-tag-group__more')
    expect(more.attributes('disabled')).toBeUndefined()
    expect(more.attributes('aria-disabled')).toBeUndefined()
    await more.trigger('click')
    await nextTick()
    expect(w.find('.g-tag-group__more').attributes('aria-expanded')).toBe('true')
    expect(w.findAll('[data-id][hidden]').length).toBe(0)
  })
})

describe('GTagGroup · avisos de desarrollo', () => {
  it('G1, G2, G3, G4, G6, G7, G8, G9', async () => {
    const G = await fresh()
    const s = spyWarn()
    const items = [
      { label: 'Sin id', removable: true },
      { id: 1, label: 'A', removable: true },
      { id: 1, label: 'Repetido', removable: true },
      { id: 2 },
      { id: 3, label: ' a ', removable: true },
      { id: 4, label: 'L', href: '#l', pressed: true },
      { id: 5, label: 'C', color: 'danger' }
    ]
    const w = mount(G, { props: { items, labels: LBL, limit: 2, layout: 'facets', categories: 99 }, slots: { default: () => h('span', 'hijo') }, attachTo: document.body })
    wrappers.push(w)
    const m = grana(s)
    expect(m.some((x) => /label o labelledby/.test(x))).toBe(true) // G1
    expect(m.some((x) => /sin id/.test(x))).toBe(true) // G2
    expect(m.some((x) => /id repetido/.test(x))).toBe(true) // G2
    expect(m.some((x) => /no tiene label/.test(x))).toBe(true) // G3
    expect(m.some((x) => /no son únicos/.test(x))).toBe(true) // G4
    expect(m.some((x) => /limit no se combina/.test(x))).toBe(true) // G6
    expect(m.some((x) => /sin ningún item.facet/.test(x))).toBe(true) // G7
    expect(m.some((x) => /href y pressed/.test(x))).toBe(true) // G8
    expect(m.some((x) => /color semántico/.test(x))).toBe(true) // G8
    expect(m.some((x) => /categories=99/.test(x))).toBe(true) // G8
    expect(m.some((x) => /no tiene slot por defecto/.test(x))).toBe(true) // G9
    expect(w.text()).not.toContain('hijo')
    expect(ids(w)).toEqual(['1', '3', '4', '5'])
    // Ninguna GTag de dentro avisa por su cuenta (lo dice el grupo)
    expect(s.mock.calls.map((c) => String(c[0])).filter((x) => x.startsWith('[Grana GTag]'))).toEqual([])
  })
  it('un grupo correcto no avisa', async () => {
    const G = await fresh()
    const s = spyWarn()
    wrappers.push(mount(G, { props: { label: 'A', items: ALERGIAS(), labels: LBL, clearable: true, limit: 2, categories: 8 }, attachTo: document.body }))
    expect(grana(s)).toEqual([])
  })
})

describe('GTagGroup · pista visual (#470)', () => {
  it('un nodo por control al final de la raíz (fuera de la lista), aria-hidden; «Quitar» con su nombre', async () => {
    const w = mk({ items: [{ id: 1, label: 'A', href: '#a', removable: true }, { id: 2, label: 'B' }] })
    await nextTick()
    const nodes = w.findAll('.g-tag-group > .g-tooltip')
    expect(nodes.map((n) => n.text())).toEqual(['A', 'Quitar A'])
    expect(w.find('.g-tag-group__list .g-tooltip').exists()).toBe(false)
    for (const n of nodes) expect(n.attributes('aria-hidden')).toBe('true')
  })
  it('la huella tiene la pista de «Deshacer»', async () => {
    const w = mk({ items: [{ id: 1, label: 'A', removable: true }] })
    await w.find('.g-tag__remove').trigger('click')
    await nextTick()
    expect(w.findAll('.g-tag-group > .g-tooltip').map((n) => n.text())).toEqual(['Deshacer: quitar A'])
  })
})
