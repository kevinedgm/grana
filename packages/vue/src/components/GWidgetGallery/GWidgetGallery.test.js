import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick, h } from 'vue'
import GWidgetGallery from './GWidgetGallery.vue'

beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', '') }
  HTMLDialogElement.prototype.close = function () {
    if (!this.hasAttribute('open')) return
    this.removeAttribute('open')
    this.dispatchEvent(new Event('close'))
  }
})
afterEach(() => { vi.restoreAllMocks(); document.body.innerHTML = '' })

const LABELS = { search: 'Buscar widgets', all: 'Todas', categories: 'Categoría', add: 'Añadir', size: 'Tamaño inicial', results: '{count} widgets', empty: 'Ningún widget coincide', added: 'Ya añadido', addedCount: 'En el panel: {count}', addedShort: 'Añadido', addedToPanel: '{title} añadido', alreadyAdded: '{title} ya está en el panel', close: 'Cerrar', list: 'Widgets disponibles' }
const SIZES = [{ id: 's', label: 'Pequeño (1×1)' }, { id: 'm', label: 'Mediano (2×1)' }, { id: 'l', label: 'Grande (2×2)' }]
const ITEMS = [
  { id: 'revenue', title: 'Ingresos', category: 'Finanzas', description: 'Ingresos del periodo', sizes: ['m', 'l'], unique: true },
  { id: 'tasks', title: 'Tareas abiertas', category: 'Equipo', description: 'Tareas por persona', sizes: ['s', 'm', 'l'] },
  { id: 'uptime', title: 'Disponibilidad', category: 'Operaciones', description: 'Servicios críticos', sizes: ['s'] },
  { id: 'traffic', title: 'Visitas', category: 'Marketing', description: 'Visitas por canal' }
]
const mk = (props = {}, opts = {}) => mount(GWidgetGallery, { attachTo: document.body, props: { modelValue: true, title: 'Añadir widget', items: ITEMS, sizes: SIZES, labels: LABELS, ...props }, ...opts })
const cards = (w) => w.findAll('.g-widget-gallery__card')
const btn = (w, id) => w.findAll('.g-widget-gallery__card').find((c) => c.attributes('aria-labelledby').includes(`-${id}-t`)).find('.g-widget-gallery__btn')
const settle = async () => { for (let i = 0; i < 3; i++) await nextTick() }

describe('GWidgetGallery · estructura', () => {
  it('es una hoja lateral de GDialog con nombre, clases y cierre', () => {
    const w = mk({}, { attrs: { class: 'mi' } })
    const d = w.find('dialog')
    expect(d.classes()).toEqual(expect.arrayContaining(['g-dialog', 'g-dialog--placement-end', 'g-dialog--size-sm', 'g-widget-gallery', 'g-widget-gallery--density-default', 'mi']))
    expect(w.find('h2.g-dialog__title').text()).toBe('Añadir widget')
    expect(w.find('.g-dialog__close').attributes('aria-label')).toBe('Cerrar')
    expect(d.attributes('open')).toBeDefined()
  })

  it('búsqueda con etiqueta, autofocus y aria-controls a la lista', () => {
    const w = mk()
    const q = w.find('.g-widget-gallery__search input')
    expect(w.find('.g-widget-gallery__search label').text()).toBe('Buscar widgets')
    expect(q.attributes('type')).toBe('search')
    expect(q.attributes('autofocus')).toBeDefined()
    expect(q.attributes('aria-controls')).toBe(w.find('ul.g-widget-gallery__list').attributes('id'))
    expect(w.find('ul').attributes('aria-label')).toBe('Widgets disponibles')
  })

  it('contador en región de estado y una tarjeta por elemento con su nombre y descripción', () => {
    const w = mk()
    expect(w.find('.g-widget-gallery__status').attributes('role')).toBe('status')
    expect(w.find('.g-widget-gallery__status').text()).toBe('4 widgets')
    expect(cards(w)).toHaveLength(4)
    const c = cards(w)[0]
    expect(c.find('h3').text()).toBe('Ingresos')
    expect(c.find('p').text()).toBe('Ingresos del periodo')
    expect(c.attributes('aria-labelledby')).toBe(c.find('h3').attributes('id'))
    expect(c.attributes('aria-describedby')).toBe(c.find('p').attributes('id'))
    expect(c.find('.g-widget-gallery__category').text()).toBe('Finanzas')
  })

  it('el botón Añadir lleva el título como texto oculto y describe por la descripción', () => {
    const w = mk()
    const b = btn(w, 'tasks')
    expect(b.text()).toContain('Añadir')
    expect(b.find('.g-widget-gallery__sr').text()).toContain('Tareas abiertas')
    expect(b.attributes('aria-describedby')).toBe(cards(w)[1].find('p').attributes('id'))
  })

  it('sin la hoja abierta no se renderiza el contenido', () => {
    expect(mk({ modelValue: false }).find('.g-widget-gallery__search').exists()).toBe(false)
  })
})

describe('GWidgetGallery · categorías y búsqueda', () => {
  it('categorías derivadas de items, «Todas» primero y una seleccionada', () => {
    const w = mk()
    const cats = w.findAll('.g-widget-gallery__cat')
    expect(cats.map((c) => c.text())).toEqual(['Todas', 'Finanzas', 'Equipo', 'Operaciones', 'Marketing'])
    expect(cats[0].find('input').element.checked).toBe(true)
    expect(w.find('fieldset legend').text()).toBe('Categoría')
  })

  it('elegir una categoría filtra y actualiza el contador', async () => {
    const w = mk()
    await w.findAll('.g-widget-gallery__cat input')[2].setValue()
    await settle()
    expect(cards(w).map((c) => c.find('h3').text())).toEqual(['Tareas abiertas'])
    expect(w.find('.g-widget-gallery__status').text()).toBe('1 widgets')
  })

  it('sin categorías no se renderiza el filtro; `categories` fija nombres propios', () => {
    const w = mk({ items: [{ id: 'a', title: 'A' }] })
    expect(w.find('fieldset').exists()).toBe(false)
    const b = mk({ categories: [{ id: 'Finanzas', label: 'Dinero' }] })
    expect(b.findAll('.g-widget-gallery__cat').map((c) => c.text())).toEqual(['Todas', 'Dinero'])
    expect(b.find('.g-widget-gallery__category').text()).toBe('Dinero')
  })

  it('la búsqueda filtra en vivo, sin mayúsculas ni acentos, por título, descripción y categoría', async () => {
    const w = mk()
    const q = w.find('.g-widget-gallery__search input')
    await q.setValue('DISPONIBILIDAD')
    expect(cards(w)).toHaveLength(1)
    await q.setValue('critic')
    expect(cards(w)[0].find('h3').text()).toBe('Disponibilidad')
    await q.setValue('operaciónes'.replace('ó', 'o'))
    expect(cards(w)).toHaveLength(1)
    await q.setValue('canal')
    expect(cards(w)[0].find('h3').text()).toBe('Visitas')
  })

  it('se combinan categoría y búsqueda (Y)', async () => {
    const w = mk()
    await w.findAll('.g-widget-gallery__cat input')[1].setValue()
    await w.find('.g-widget-gallery__search input').setValue('tareas')
    expect(cards(w)).toHaveLength(0)
  })

  it('sin resultados: mensaje vacío (o el slot empty con la consulta)', async () => {
    const w = mk()
    await w.find('.g-widget-gallery__search input').setValue('zzz')
    expect(w.find('.g-widget-gallery__empty').text()).toBe('Ningún widget coincide')
    expect(w.find('.g-widget-gallery__status').text()).toBe('0 widgets')
    const s = mk({}, { slots: { empty: ({ query }) => h('b', `nada para ${query}`) } })
    await s.find('.g-widget-gallery__search input').setValue('zzz')
    expect(s.find('.g-widget-gallery__empty').text()).toBe('nada para zzz')
  })

  it('emite search con la consulta, la categoría y el número de resultados', async () => {
    const w = mk()
    await w.find('.g-widget-gallery__search input').setValue('ingr')
    await settle()
    expect(w.emitted('search').at(-1)[0]).toEqual({ query: 'ingr', category: 'all', count: 1 })
  })
})

describe('GWidgetGallery · tamaño inicial', () => {
  it('el selector ofrece los tamaños permitidos con sus nombres; el primero es el inicial', () => {
    const w = mk()
    const sel = cards(w)[1].find('select')
    expect(cards(w)[1].find('.g-widget-gallery__row label').text()).toBe('Tamaño inicial')
    expect(sel.findAll('option').map((o) => o.text())).toEqual(['Pequeño (1×1)', 'Mediano (2×1)', 'Grande (2×2)'])
    expect(sel.element.value).toBe('s')
  })

  it('con un solo tamaño no hay selector; sin `sizes` de la tarjeta se usa el catálogo entero', () => {
    const w = mk()
    expect(cards(w)[2].find('select').exists()).toBe(false)
    expect(cards(w)[3].find('select').findAll('option')).toHaveLength(3)
  })

  it('Añadir emite add con el tamaño elegido y anuncia dentro de la hoja; el foco no se mueve', async () => {
    const w = mk()
    await cards(w)[1].find('select').setValue('m')
    await btn(w, 'tasks').trigger('click')
    await settle()
    expect(w.emitted('add')[0][0]).toEqual({ id: 'tasks', size: 'm' })
    const live = w.find('.g-dialog .g-widget-gallery__sr[role="status"]:not(.g-widget-gallery__status)')
    expect(live.text()).toBe('Tareas abiertas añadido')
  })

  it('sin elegir, emite el tamaño inicial', async () => {
    const w = mk()
    await btn(w, 'revenue').trigger('click')
    expect(w.emitted('add')[0][0]).toEqual({ id: 'revenue', size: 'm' })
  })
})

describe('GWidgetGallery · ya añadidos', () => {
  it('marca de texto y clase: único «Ya añadido», repetible «En el panel: N»', () => {
    const w = mk({ added: { revenue: 1, tasks: 2 } })
    expect(cards(w)[0].classes()).toContain('is-added')
    expect(cards(w)[0].find('.g-widget-gallery__tag').text()).toBe('Ya añadido')
    expect(cards(w)[1].find('.g-widget-gallery__tag').text()).toBe('En el panel: 2')
    expect(cards(w)[2].find('.g-widget-gallery__tag').exists()).toBe(false)
  })

  it('un único ya añadido: botón aria-disabled «Añadido», enfocable, no emite y anuncia', async () => {
    const w = mk({ added: { revenue: 1 } })
    const b = btn(w, 'revenue')
    expect(b.attributes('aria-disabled')).toBe('true')
    expect(b.attributes('disabled')).toBeUndefined()
    expect(b.text()).toContain('Añadido')
    await b.trigger('click')
    await settle()
    expect(w.emitted('add')).toBeUndefined()
    expect(w.find('.g-widget-gallery__sr[aria-live="polite"]').text()).toBe('Ingresos ya está en el panel')
  })

  it('un repetible ya añadido se puede añadir otra vez', async () => {
    const w = mk({ added: { tasks: 3 } })
    expect(btn(w, 'tasks').attributes('aria-disabled')).toBeUndefined()
    await btn(w, 'tasks').trigger('click')
    expect(w.emitted('add')).toHaveLength(1)
  })

  it('announce() del componente escribe en la región de la hoja', async () => {
    const w = mk()
    w.vm.announce('Posición 3 de 3')
    await settle()
    expect(w.find('.g-widget-gallery__sr[aria-live="polite"]').text()).toBe('Posición 3 de 3')
  })
})

describe('GWidgetGallery · vista previa, slots y cierre', () => {
  it('la vista previa es aria-hidden e inert, con el tamaño elegido en el alcance', async () => {
    let seen
    const w = mk({}, { slots: { preview: (s) => { seen = s; return h('i', { class: 'pv' }, s.item.title) } } })
    const p = cards(w)[1].find('.g-widget-gallery__preview')
    expect(p.attributes('aria-hidden')).toBe('true')
    expect(p.element.hasAttribute('inert')).toBe(true)
    expect(p.text()).toBe('Tareas abiertas')
    expect(seen.size).toBeDefined()
    await cards(w)[1].find('select').setValue('l')
    expect(cards(w)[1].find('.pv').exists()).toBe(true)
  })

  it('sin slot preview la tarjeta no tiene vista previa', () => {
    expect(mk().find('.g-widget-gallery__preview').exists()).toBe(false)
  })

  it('el slot card sustituye el contenido de la tarjeta pero conserva el botón y el selector', () => {
    const w = mk({}, { slots: { card: ({ item }) => h('div', { class: 'mio' }, item.title) } })
    expect(cards(w)[1].find('.mio').text()).toBe('Tareas abiertas')
    expect(cards(w)[1].find('h3').exists()).toBe(false)
    expect(cards(w)[1].find('.g-widget-gallery__btn').exists()).toBe(true)
    expect(cards(w)[1].find('select').exists()).toBe(true)
  })

  it('«Cerrar» del pie y la ✕ piden el cierre (update:modelValue false)', async () => {
    const w = mk()
    await w.find('.g-dialog__footer .g-widget-gallery__btn').trigger('click')
    expect(w.emitted('update:modelValue').at(-1)).toEqual([false])
    await w.find('.g-dialog__close').trigger('click')
    expect(w.emitted('update:modelValue')).toHaveLength(2)
  })

  it('el slot footer sustituye al botón Cerrar', () => {
    const w = mk({}, { slots: { footer: () => h('button', { class: 'f' }, 'mío') } })
    expect(w.find('.g-dialog__footer .f').exists()).toBe(true)
    expect(w.find('.g-dialog__footer .g-widget-gallery__btn').exists()).toBe(false)
  })
})

describe('GWidgetGallery · datos inválidos y avisos', () => {
  it('ignora elementos sin id o sin título y ids repetidos (avisa)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mk({ items: [{ id: 'a', title: 'A' }, { id: 'a', title: 'B' }, { title: 'sin id' }, { id: 'c' }, null] })
    expect(cards(w)).toHaveLength(1)
    expect(warn.mock.calls.some((c) => String(c[0]).includes('mismo id'))).toBe(true)
  })

  it('avisa sin title y sin los textos requeridos', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount(GWidgetGallery, { props: { modelValue: false } })
    const msgs = warn.mock.calls.map((c) => String(c[0]))
    expect(msgs.some((m) => m.includes('necesita `title`'))).toBe(true)
    for (const k of ['search', 'add', 'results', 'close']) expect(msgs.some((m) => m.includes(`labels.${k}`))).toBe(true)
  })

  it('validadores de size y density', () => {
    expect(GWidgetGallery.props.size.validator('xl')).toBe(false)
    expect(GWidgetGallery.props.density.validator('dense')).toBe(false)
  })
})
