import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import GMenu from './GMenu.vue'

beforeEach(() => {
  HTMLElement.prototype.showPopover = function () { this.setAttribute('data-popover-open', '') }
  HTMLElement.prototype.hidePopover = function () { this.removeAttribute('data-popover-open') }
  const orig = HTMLElement.prototype.matches
  HTMLElement.prototype.matches = function (sel) { return sel === ':popover-open' ? this.hasAttribute('data-popover-open') : orig.call(this, sel) }
})
afterEach(() => { vi.restoreAllMocks(); document.body.innerHTML = '' })

const ITEMS = [
  { id: 'rename', label: 'Renombrar', icon: 'pencil', shortcut: 'F2', keyshortcuts: 'F2' },
  { id: 'dup', label: 'Duplicar' },
  { id: 'move', label: 'Mover a…', disabled: true },
  { type: 'separator' },
  { type: 'group', label: 'Mostrar', items: [
    { type: 'checkbox', id: 'grid', label: 'Cuadrícula', checked: true },
    { type: 'checkbox', id: 'rulers', label: 'Reglas' },
    { type: 'radio', id: 'by-name', label: 'Por nombre', checked: true },
    { type: 'radio', id: 'by-date', label: 'Por fecha' }
  ] },
  { label: 'Exportar como', items: [{ id: 'pdf', label: 'PDF' }, { label: 'Más', items: [{ id: 'csv', label: 'Datos' }] }] },
  { id: 'del', label: 'Eliminar', danger: true }
]

// Anfitrión con v-model: el menú presenta y emite; la aplicación guarda el estado abierto
const Host = defineComponent({
  props: { items: { type: Array, default: () => ITEMS }, menu: { type: Object, default: () => ({}) }, open: Boolean },
  emits: ['select'],
  setup(props, { emit, expose }) {
    const isOpen = ref(props.open)
    expose({ isOpen })
    return () => h('div', [
      h(GMenu, { ...props.menu, items: props.items, modelValue: isOpen.value, 'onUpdate:modelValue': (v) => { isOpen.value = v }, onSelect: (e) => emit('select', e) }, {
        trigger: ({ attrs }) => h('button', { ...attrs, type: 'button' }, 'Acciones'),
        icon: ({ item }) => h('i', { class: 'ic' }, item.icon)
      })
    ])
  }
})
const mk = (props = {}) => mount(Host, { attachTo: document.body, props })
const trig = (w) => w.find('button[aria-haspopup="menu"]')
const list = (w) => w.find('ul.g-menu__list[role="menu"]')
const items = (w, root = list(w)) => root.findAll('.g-menu__item').filter((i) => i.element.closest('[role="menu"]') === root.element)
const settle = async () => { for (let i = 0; i < 4; i++) await nextTick() }
const label = (w, text) => w.findAll('.g-menu__item').find((i) => i.find('.g-menu__label').text() === text)
const key = (el, k, extra = {}) => el.trigger('keydown', { key: k, ...extra })

describe('GMenu · disparador y apertura (Menu Button de APG)', () => {
  it('el slot trigger recibe los atributos de ARIA; cerrado no hay lista', () => {
    const w = mk()
    const t = trig(w)
    expect(t.attributes('aria-haspopup')).toBe('menu')
    expect(t.attributes('aria-expanded')).toBe('false')
    expect(t.attributes('aria-controls')).toBeTruthy()
    expect(list(w).exists()).toBe(false)
  })

  it('clic abre: lista con role=menu, popover manual, nombre por el disparador y foco en el primero', async () => {
    const w = mk()
    await trig(w).trigger('click'); await settle()
    const l = list(w)
    expect(l.exists()).toBe(true)
    expect(l.attributes('popover')).toBe('manual')
    expect(l.attributes('aria-labelledby')).toBe(trig(w).attributes('id'))
    expect(trig(w).attributes('aria-expanded')).toBe('true')
    expect(document.activeElement).toBe(items(w)[0].element)
    expect(items(w)[0].attributes('tabindex')).toBe('0')
    expect(items(w)[1].attributes('tabindex')).toBe('-1')
  })

  it('Enter, Espacio y ↓ abren en el primero; ↑ abre en el último', async () => {
    for (const k of ['Enter', ' ', 'ArrowDown']) {
      const w = mk()
      await key(trig(w), k); await settle()
      expect(document.activeElement.textContent, k).toContain('Renombrar')
      w.unmount()
    }
    const w = mk()
    await key(trig(w), 'ArrowUp'); await settle()
    expect(document.activeElement.textContent).toContain('Eliminar')
  })

  it('un segundo clic cierra y devuelve el foco al disparador', async () => {
    const w = mk()
    await trig(w).trigger('click'); await settle()
    await trig(w).trigger('click'); await settle()
    expect(list(w).exists()).toBe(false)
    expect(document.activeElement).toBe(trig(w).element)
  })

  it('label nombra la lista con aria-label en lugar del disparador', async () => {
    const w = mk({ menu: { label: 'Acciones del archivo' } })
    await trig(w).trigger('click'); await settle()
    expect(list(w).attributes('aria-label')).toBe('Acciones del archivo')
    expect(list(w).attributes('aria-labelledby')).toBeUndefined()
  })

  it('class, style y data-* van a la lista; density añade su clase', async () => {
    const w = mount(defineComponent({ setup: () => () => h(GMenu, { items: ITEMS, modelValue: true, density: 'compact', class: 'mi', 'data-x': '1' }, { trigger: ({ attrs }) => h('button', attrs, 'x') }) }), { attachTo: document.body })
    await settle()
    const l = w.find('ul.g-menu__list')
    expect(l.classes()).toEqual(expect.arrayContaining(['g-menu__list--density-compact', 'mi']))
    expect(l.attributes('data-x')).toBe('1')
  })
})

describe('GMenu · elementos y roles', () => {
  const open = async () => { const w = mk(); await trig(w).trigger('click'); await settle(); return w }

  it('cada li es role=none; acciones, casillas y opciones con sus roles y aria-checked', async () => {
    const w = await open()
    expect(w.findAll('li').every((li) => li.attributes('role') === 'none')).toBe(true)
    expect(label(w, 'Renombrar').attributes('role')).toBe('menuitem')
    expect(label(w, 'Cuadrícula').attributes('role')).toBe('menuitemcheckbox')
    expect(label(w, 'Cuadrícula').attributes('aria-checked')).toBe('true')
    expect(label(w, 'Reglas').attributes('aria-checked')).toBe('false')
    expect(label(w, 'Por nombre').attributes('role')).toBe('menuitemradio')
    expect(label(w, 'Por nombre').attributes('aria-checked')).toBe('true')
    expect(label(w, 'Por fecha').attributes('aria-checked')).toBe('false')
  })

  it('las marcas de casilla y opción son iconos de Lucide decorativos (check y circle relleno)', async () => {
    const w = await open()
    const cb = label(w, 'Cuadrícula').find('.g-menu__mark')
    expect(cb.attributes('aria-hidden')).toBe('true')
    expect(cb.find('svg').html()).toContain('M20 6 9 17l-5-5')
    const rd = label(w, 'Por nombre').find('.g-menu__mark svg')
    expect(rd.attributes('fill')).toBe('currentColor')
  })

  it('separador role=separator y grupo con título que lo nombra', async () => {
    const w = await open()
    expect(w.find('[role="separator"]').classes()).toContain('g-menu__separator')
    const g = w.find('ul[role="group"]')
    const title = w.find(`#${g.attributes('aria-labelledby')}`)
    expect(title.text()).toBe('Mostrar')
    expect(title.attributes('role')).toBe('presentation')
  })

  it('atajo visible (aria-hidden) y aria-keyshortcuts; el icono va por el slot y es decorativo', async () => {
    const w = await open()
    const r = label(w, 'Renombrar')
    expect(r.find('.g-menu__shortcut').text()).toBe('F2')
    expect(r.find('.g-menu__shortcut').attributes('aria-hidden')).toBe('true')
    expect(r.attributes('aria-keyshortcuts')).toBe('F2')
    expect(r.find('.g-menu__icon').attributes('aria-hidden')).toBe('true')
    expect(r.find('.g-menu__icon .ic').text()).toBe('pencil')
    expect(label(w, 'Duplicar').find('.g-menu__icon').exists()).toBe(false)
  })

  it('deshabilitado: aria-disabled (no disabled) y sigue enfocable', async () => {
    const w = await open()
    const m = label(w, 'Mover a…')
    expect(m.attributes('aria-disabled')).toBe('true')
    expect(m.attributes('disabled')).toBeUndefined()
  })

  it('peligroso: clase y un triangle-alert de Lucide antes de la etiqueta', async () => {
    const w = await open()
    const d = label(w, 'Eliminar')
    expect(d.classes()).toContain('g-menu__item--danger')
    expect(d.find('.g-menu__label').element.firstElementChild.tagName.toLowerCase()).toBe('svg')
    expect(d.find('svg.g-menu__danger-icon').html()).toContain('m21.73 18-8-14')
  })

  it('un padre de submenú lleva aria-haspopup, aria-expanded, aria-controls y un chevron-right de Lucide', async () => {
    const w = await open()
    const p = label(w, 'Exportar como')
    expect(p.attributes('aria-haspopup')).toBe('menu')
    expect(p.attributes('aria-expanded')).toBe('false')
    expect(p.attributes('aria-controls')).toBeTruthy()
    expect(p.find('svg.g-menu__chevron').html()).toContain('m9 18 6-6-6-6')
  })

  it('slot item sustituye el contenido y conserva el nombre accesible por el texto', async () => {
    const w = mount(defineComponent({ setup: () => () => h(GMenu, { items: [{ id: 'a', label: 'Alfa' }], modelValue: true }, { trigger: ({ attrs }) => h('button', attrs, 'x'), item: ({ item }) => h('b', { class: 'mio' }, item.label) }) }), { attachTo: document.body })
    await settle()
    expect(w.find('.g-menu__item .mio').text()).toBe('Alfa')
  })

  it('ignora elementos sin id, sin label o de tipo desconocido (avisa una vez)', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mount(Host, { attachTo: document.body, props: { open: true, items: [{ id: 'a', label: 'A' }, { label: 'sin id' }, { id: 'b' }, { type: 'raro', id: 'c', label: 'C' }, null] } })
    await settle()
    expect(items(w)).toHaveLength(1)
    expect(warn.mock.calls.length).toBeGreaterThanOrEqual(3)
  })
})

describe('GMenu · teclado de la lista', () => {
  const open = async (props) => { const w = mk(props); await trig(w).trigger('click'); await settle(); return w }
  const at = (w) => document.activeElement.textContent.trim()

  it('↑ ↓ recorren de forma cíclica; Inicio y Fin saltan; los deshabilitados siguen enfocables', async () => {
    const w = await open()
    await key(items(w)[0], 'ArrowDown'); expect(at(w)).toContain('Duplicar')
    await key(document.activeElement && w.find(':focus'), 'ArrowDown'); expect(at(w)).toContain('Mover a…')
    await key(w.find(':focus'), 'End'); expect(at(w)).toContain('Eliminar')
    await key(w.find(':focus'), 'ArrowDown'); expect(at(w)).toContain('Renombrar')
    await key(w.find(':focus'), 'ArrowUp'); expect(at(w)).toContain('Eliminar')
    await key(w.find(':focus'), 'Home'); expect(at(w)).toContain('Renombrar')
  })

  it('escribir salta al siguiente elemento que empieza por la letra', async () => {
    const w = await open()
    await key(w.find(':focus'), 'd'); expect(at(w)).toContain('Duplicar')
    await new Promise((r) => setTimeout(r, 550)) // el búfer de escritura dura 500ms
    await key(w.find(':focus'), 'e'); expect(at(w)).toContain('Exportar como')
    await new Promise((r) => setTimeout(r, 550))
    await key(w.find(':focus'), 'e'); expect(at(w)).toContain('Eliminar')
  })

  it('Esc cierra y devuelve el foco al disparador, y no llega a un ancestro', async () => {
    const parent = vi.fn()
    const w = mount(defineComponent({ setup: () => () => h('div', { onKeydown: parent }, [h(Host, { open: true })]) }), { attachTo: document.body })
    await settle()
    await w.find('.g-menu__item').trigger('keydown', { key: 'Escape' }); await settle()
    expect(w.find('ul.g-menu__list').exists()).toBe(false)
    expect(document.activeElement).toBe(w.find('button[aria-haspopup="menu"]').element)
    expect(parent).not.toHaveBeenCalled()
  })

  it('Tab cierra sin devolver el foco; un clic fuera cierra', async () => {
    const w = await open()
    await key(w.find(':focus'), 'Tab'); await settle()
    expect(list(w).exists()).toBe(false)
    expect(document.activeElement).not.toBe(trig(w).element)
    await trig(w).trigger('click'); await settle()
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true })); await settle()
    expect(list(w).exists()).toBe(false)
  })
})

describe('GMenu · activar y emitir intención', () => {
  const open = async (props) => { const w = mk(props); await trig(w).trigger('click'); await settle(); return w }

  it('una acción emite select { id, item, type }, cierra y devuelve el foco al disparador', async () => {
    const w = await open()
    await label(w, 'Duplicar').trigger('click'); await settle()
    const e = w.emitted('select')[0][0]
    expect(e).toMatchObject({ id: 'dup', type: 'item' })
    expect(e.item.label).toBe('Duplicar')
    expect(e.checked).toBeUndefined()
    expect(list(w).exists()).toBe(false)
    expect(document.activeElement).toBe(trig(w).element)
  })

  it('un deshabilitado no emite ni cierra', async () => {
    const w = await open()
    await label(w, 'Mover a…').trigger('click'); await settle()
    expect(w.emitted('select')).toBeUndefined()
    expect(list(w).exists()).toBe(true)
  })

  it('casilla: emite el valor nuevo (!checked) y no cierra; el estado lo guarda la aplicación', async () => {
    const w = await open()
    await label(w, 'Cuadrícula').trigger('click')
    await label(w, 'Reglas').trigger('click')
    expect(w.emitted('select')[0][0]).toMatchObject({ id: 'grid', type: 'checkbox', checked: false })
    expect(w.emitted('select')[1][0]).toMatchObject({ id: 'rulers', type: 'checkbox', checked: true })
    expect(list(w).exists()).toBe(true)
    expect(label(w, 'Cuadrícula').attributes('aria-checked')).toBe('true') // no cambia sola
  })

  it('opción: emite checked true y el grupo que la contiene; no cierra', async () => {
    const w = await open()
    await label(w, 'Por fecha').trigger('click')
    const e = w.emitted('select')[0][0]
    expect(e).toMatchObject({ id: 'by-date', type: 'radio', checked: true })
    expect(e.group.label).toBe('Mostrar')
    expect(list(w).exists()).toBe(true)
  })

  it('closeOnSelect: always cierra también las casillas; never no cierra nada; preventDefault impide el cierre', async () => {
    const a = await open({ menu: { closeOnSelect: 'always' } })
    await label(a, 'Reglas').trigger('click'); await settle()
    expect(list(a).exists()).toBe(false)
    const n = await open({ menu: { closeOnSelect: 'never' } })
    await label(n, 'Duplicar').trigger('click'); await settle()
    expect(list(n).exists()).toBe(true)
    const p = mount(defineComponent({ setup: () => () => h(GMenu, { items: [{ id: 'a', label: 'A' }], modelValue: true, onSelect: (e) => e.event.preventDefault() }, { trigger: ({ attrs }) => h('button', attrs, 'x') }) }), { attachTo: document.body })
    await settle()
    const updates = []
    await p.find('.g-menu__item').trigger('click')
    expect(p.findComponent(GMenu).emitted('update:modelValue')).toBeUndefined()
    expect(updates).toEqual([])
  })
})

describe('GMenu · submenús', () => {
  const open = async () => { const w = mk(); await trig(w).trigger('click'); await settle(); return w }
  const at = () => document.activeElement.textContent.trim()

  it('→ abre el submenú con el foco en su primer elemento; ← y Esc cierran solo ese nivel y vuelven al padre', async () => {
    const w = await open()
    const parent = label(w, 'Exportar como')
    parent.element.focus()
    await key(parent, 'ArrowRight'); await settle()
    expect(parent.attributes('aria-expanded')).toBe('true')
    expect(w.findAll('ul[role="menu"]')).toHaveLength(2)
    expect(w.findAll('ul[role="menu"]')[1].attributes('aria-labelledby')).toBe(parent.attributes('id'))
    expect(at()).toContain('PDF')
    await key(w.find(':focus'), 'Escape'); await settle()
    expect(w.findAll('ul[role="menu"]')).toHaveLength(1)
    expect(at()).toContain('Exportar como')
    expect(list(w).exists()).toBe(true)
    await key(w.find(':focus'), 'ArrowRight'); await settle()
    await key(w.find(':focus'), 'ArrowLeft'); await settle()
    expect(w.findAll('ul[role="menu"]')).toHaveLength(1)
  })

  it('Enter en un padre abre el submenú; tres niveles; elegir un hijo emite y cierra todo', async () => {
    const w = await open()
    const parent = label(w, 'Exportar como')
    await parent.trigger('click'); await settle()
    await label(w, 'Más').trigger('click'); await settle()
    expect(w.findAll('ul[role="menu"]')).toHaveLength(3)
    await label(w, 'Datos').trigger('click'); await settle()
    expect(w.emitted('select')[0][0]).toMatchObject({ id: 'csv' })
    expect(list(w).exists()).toBe(false)
  })

  it('el puntero encima abre el submenú tras un retardo', async () => {
    vi.useFakeTimers()
    const w = await open()
    await label(w, 'Exportar como').trigger('pointerenter')
    vi.advanceTimersByTime(200); await settle()
    expect(w.findAll('ul[role="menu"]')).toHaveLength(2)
    vi.useRealTimers()
  })

  it('un padre deshabilitado no abre', async () => {
    const w = mount(Host, { attachTo: document.body, props: { open: true, items: [{ label: 'P', disabled: true, id: 'p', items: [{ id: 'h', label: 'H' }] }] } })
    await settle()
    await w.find('.g-menu__item').trigger('click'); await settle()
    expect(w.findAll('ul[role="menu"]')).toHaveLength(1)
  })
})

describe('GMenu · avisos y validadores', () => {
  it('avisa sin slot trigger', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount(GMenu, { props: { items: [] } })
    expect(warn.mock.calls.some((c) => String(c[0]).includes('trigger'))).toBe(true)
  })

  it('validadores de align, side, closeOnSelect y density', () => {
    const p = GMenu.props
    expect(p.align.validator('center')).toBe(false)
    expect(p.side.validator('left')).toBe(false)
    expect(p.closeOnSelect.validator('x')).toBe(false)
    expect(p.density.validator('dense')).toBe(false)
    expect(p.side.validator('top')).toBe(true)
  })
})

describe('GMenu · disparador que es un componente', () => {
  it('con un componente como disparador (v-bind="attrs" enlaza la instancia), ancla y devuelve el foco a su elemento raíz', async () => {
    const Btn = defineComponent({ inheritAttrs: true, setup: (_, { slots }) => () => h('button', { type: 'button', class: 'mi-btn' }, slots.default?.()) })
    const Wrap = defineComponent({
      setup() {
        const open = ref(false)
        return () => h(GMenu, { items: [{ id: 'a', label: 'A' }], modelValue: open.value, 'onUpdate:modelValue': (v) => { open.value = v } }, { trigger: ({ attrs }) => h(Btn, attrs, () => 'Abrir') })
      }
    })
    const w = mount(Wrap, { attachTo: document.body })
    await w.find('.mi-btn').trigger('click'); await settle()
    expect(w.find('ul.g-menu__list').attributes('style')).toContain('--_x')
    await w.find('.g-menu__item').trigger('click'); await settle()
    expect(document.activeElement).toBe(w.find('.mi-btn').element)
  })
})
