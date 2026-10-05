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

describe('GMenu · salida y origen (plan 010)', () => {
  it('con transición de salida, la lista sigue montada e inerte hasta que termina', async () => {
    vi.useFakeTimers()
    const real = window.getComputedStyle.bind(window)
    vi.spyOn(window, 'getComputedStyle').mockImplementation((el, p) => {
      const cs = real(el, p)
      if (el.tagName !== 'UL') return cs
      return new Proxy(cs, { get: (t, k) => (k === 'transitionDuration' ? '0.12s' : k === 'transitionDelay' ? '0s' : typeof t[k] === 'function' ? t[k].bind(t) : t[k]) })
    })
    try {
      const w = mk()
      await trig(w).trigger('click'); await settle()
      await trig(w).trigger('click'); await settle()
      expect(list(w).exists()).toBe(true)
      expect(list(w).attributes('inert')).toBeDefined()
      vi.advanceTimersByTime(120); await settle()
      expect(list(w).exists()).toBe(false)
      w.unmount()
    } finally { vi.useRealTimers() }
  })

  it('escribe data-side y data-align en la lista', async () => {
    const w = mk()
    await trig(w).trigger('click'); await settle()
    expect(['top', 'bottom']).toContain(list(w).attributes('data-side'))
    expect(['left', 'right']).toContain(list(w).attributes('data-align'))
  })
})

// ---------- Disparador con `id` propio (kiwi personalidad r01, hallazgo 8; #305) ----------
describe('GMenu · disparador con id propio', () => {
  const GBtnHost = async (props = {}) => {
    const { default: GBtn } = await import('../GBtn/GBtn.vue')
    const Wrap = defineComponent({
      setup() {
        const open = ref(false)
        return () => h(GMenu, { ...props, items: [{ id: 'a', label: 'A' }], modelValue: open.value, 'onUpdate:modelValue': (v) => { open.value = v } }, {
          trigger: ({ attrs }) => h(GBtn, { ...attrs, id: 'mio' }, () => 'Acciones')
        })
      }
    })
    return mount(Wrap, { attachTo: document.body })
  }

  it('por qué no bastaba la referencia: GBtn tiene dos raíces y su $el es el ancla vacía del fragmento', async () => {
    const { default: GBtn } = await import('../GBtn/GBtn.vue')
    let inst = null
    mount(defineComponent({ setup: () => () => h(GBtn, { ref: (x) => { inst = x } }, () => 'B') }), { attachTo: document.body })
    expect(inst.$el.nodeType).toBe(Node.TEXT_NODE)
    expect(inst.$el.nextSibling.tagName).toBe('BUTTON')
  })

  it('con un id propio el menú se abre (ancla en el botón real), la lista conserva su nombre y avisa una vez', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = await GBtnHost()
    const btn = w.find('#mio')
    // Aviso al montar
    const msgs = () => warn.mock.calls.map((c) => String(c[0])).filter((m) => m.includes('[Grana GMenu]'))
    expect(msgs()).toHaveLength(1)
    expect(msgs()[0]).toMatch(/id="mio".*g-menu-.*-trigger.*prop `id`/)
    await btn.trigger('click'); await settle()
    const l = w.find('ul.g-menu__list')
    expect(l.exists()).toBe(true)
    expect(l.attributes('data-popover-open')).toBeDefined() // showPopover: antes no se llamaba (sin ancla)
    expect(l.attributes('style')).toContain('--_x')
    expect(l.attributes('aria-labelledby')).toBe('mio')
    // Un clic en el propio disparador no cuenta como «fuera» y Esc devuelve el foco al botón
    await key(w.find('.g-menu__item'), 'Escape'); await settle()
    expect(document.activeElement).toBe(btn.element)
    expect(msgs()).toHaveLength(1) // una vez, también al abrir
  })

  it('sin id propio (o con la prop id) no avisa', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mk({ menu: { id: 'acc' } })
    await trig(w).trigger('click'); await settle()
    expect(trig(w).attributes('id')).toBe('acc-trigger')
    expect(warn.mock.calls.some((c) => String(c[0]).includes('[Grana GMenu]'))).toBe(false)
  })
})

// ---------- M1 · una sola luz que viaja (menu.md «Personalidad», #305) ----------
// jsdom no maqueta: cada elemento recibe una geometría (alto 36, uno tras otro) relativa a su lista
const H = 36
const geom = (w) => {
  for (const m of w.findAll('ul[role="menu"]')) {
    items(w, m).forEach((it, i) => {
      Object.defineProperty(it.element, 'offsetTop', { configurable: true, get: () => 6 + i * H })
      Object.defineProperty(it.element, 'offsetHeight', { configurable: true, get: () => H })
      Object.defineProperty(it.element, 'offsetParent', { configurable: true, get: () => m.element })
    })
  }
}
const hl = (m) => ({
  on: m.classes('has-highlight'),
  instant: m.classes('is-highlight-instant'),
  y: m.element.style.getPropertyValue('--_active-y'),
  h: m.element.style.getPropertyValue('--_active-h')
})
const frames = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(r))))
const move = (el, x, y, pointerType = 'mouse') => el.trigger('pointermove', { pointerType, clientX: x, clientY: y })
const SIMPLE = [{ id: 'a', label: 'Abrir' }, { id: 'b', label: 'Borrar' }, { id: 'c', label: 'Copiar', disabled: true }, { id: 'd', label: 'Duplicar' }]

describe('GMenu · M1 una sola luz que viaja', () => {
  it('cada lista trae un único g-menu__highlight decorativo, antes de los elementos', async () => {
    const w = mk({ open: true }); await settle()
    const first = list(w).element.firstElementChild
    expect(first.className).toBe('g-menu__highlight')
    expect(first.getAttribute('aria-hidden')).toBe('true')
    expect(first.getAttribute('role')).toBe('none')
    expect(list(w).findAll(':scope > .g-menu__highlight')).toHaveLength(1)
  })

  it('con teclado, --_active-y/h y has-highlight siguen al foco; is-highlight-instant solo en la primera colocación', async () => {
    const w = mk({ items: SIMPLE })
    await trig(w).trigger('click'); await settle()
    geom(w)
    const l = list(w)
    await frames()
    expect(hl(l).instant).toBe(false) // retirada a los dos cuadros
    await key(items(w)[0], 'ArrowDown'); await settle()
    expect(hl(l)).toMatchObject({ on: true, instant: false, y: `${6 + H}px`, h: `${H}px` })
    await key(items(w)[1], 'ArrowDown'); await settle() // deshabilitado: con teclado sí se enfoca y se resalta
    expect(hl(l)).toMatchObject({ on: true, instant: false, y: `${6 + 2 * H}px` })
    await key(items(w)[2], 'Home'); await settle()
    expect(hl(l)).toMatchObject({ on: true, instant: false, y: '6px' })
  })

  it('al abrir, la primera colocación es instantánea; sin activo se apaga y al volver es instantánea otra vez', async () => {
    const w = mk({ items: SIMPLE })
    await trig(w).trigger('click'); await settle()
    const l = list(w)
    expect(hl(l)).toMatchObject({ on: true, instant: true })
    await frames()
    expect(hl(l).instant).toBe(false)
    // El foco sale de la lista (sin cerrarla): sin activo
    const out = document.createElement('button'); document.body.appendChild(out)
    out.focus(); await settle()
    expect(hl(l).on).toBe(false)
    items(w)[1].element.focus(); await settle()
    expect(hl(l)).toMatchObject({ on: true, instant: true })
  })

  it('el puntero (ratón o lápiz) mueve el foco y el roving tabindex en el acto, sin desplazar la lista', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    try {
      const w = mk({ items: SIMPLE })
      await trig(w).trigger('click'); await settle()
      geom(w)
      const its = items(w)
      const focusSpy = vi.spyOn(its[1].element, 'focus')
      const scrollSpy = (its[1].element.scrollIntoView = vi.fn())
      await move(its[1], 10, 50); await settle()
      expect(document.activeElement).toBe(its[1].element) // sin esperar los 180ms
      expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true, focusVisible: false })
      expect(scrollSpy).not.toHaveBeenCalled()
      expect(its.map((i) => i.attributes('tabindex'))).toEqual(['-1', '0', '-1', '-1'])
      expect(hl(list(w))).toMatchObject({ on: true, y: `${6 + H}px` })
      await move(its[3], 10, 130, 'pen'); await settle()
      expect(document.activeElement).toBe(its[3].element)
    } finally { vi.useRealTimers() }
  })

  it('el puntero sobre un deshabilitado no mueve foco ni resaltado; el toque no mueve el foco', async () => {
    const w = mk({ items: SIMPLE })
    await trig(w).trigger('click'); await settle()
    geom(w)
    const its = items(w)
    await move(its[1], 10, 50); await settle()
    const before = hl(list(w))
    await move(its[2], 10, 90); await settle()
    expect(document.activeElement).toBe(its[1].element)
    expect(hl(list(w))).toEqual(before)
    await move(its[3], 10, 130, 'touch'); await settle()
    expect(document.activeElement).toBe(its[1].element)
  })

  it('un elemento que pasa bajo el puntero quieto (sin movimiento) no le quita el foco al teclado', async () => {
    const w = mk({ items: SIMPLE })
    await trig(w).trigger('click'); await settle()
    const its = items(w)
    await move(its[0], 10, 10); await settle()
    await key(its[0], 'ArrowDown'); await settle()
    expect(document.activeElement).toBe(its[1].element)
    await its[3].trigger('pointerenter', { pointerType: 'mouse', clientX: 10, clientY: 10 }); await settle()
    expect(document.activeElement).toBe(its[1].element)
  })

  it('al barrer la lista con el puntero, en todo momento hay un solo elemento activo y una sola lista resaltada', async () => {
    const w = mk({ items: SIMPLE })
    await trig(w).trigger('click'); await settle()
    geom(w)
    const its = items(w)
    for (const [i, it] of [1, 3, 1, 0, 1].map((i) => [i, its[i]])) {
      await it.trigger('pointerenter', { pointerType: 'mouse', clientX: 10, clientY: 10 + i * H })
      await move(it, 12, 12 + i * H); await settle()
      expect(document.activeElement).toBe(it.element)
      expect(w.findAll('.g-menu__item[tabindex="0"]')).toHaveLength(1)
      expect(w.findAll('.g-menu__list.has-highlight')).toHaveLength(1)
      expect(hl(list(w)).y).toBe(`${6 + i * H}px`)
    }
  })

  it('con el foco en un submenú, la lista de arriba resalta al padre expandido y el submenú al enfocado', async () => {
    const w = mk({ open: true }); await settle()
    const parent = label(w, 'Exportar como')
    parent.element.focus()
    await key(parent, 'ArrowRight'); await settle()
    geom(w)
    await key(w.findAll('ul[role="menu"]')[1].find('.g-menu__item'), 'ArrowDown'); await settle()
    const [root, sub] = w.findAll('ul[role="menu"]')
    const pIndex = items(w, root).findIndex((i) => i.element === parent.element)
    expect(hl(root)).toMatchObject({ on: true, y: `${6 + pIndex * H}px` })
    expect(hl(sub)).toMatchObject({ on: true, y: `${6 + H}px` })
    expect(w.findAll('.g-menu__list.has-highlight')).toHaveLength(2)
    expect(sub.findAll(':scope > .g-menu__highlight')).toHaveLength(1)
  })
})

// ---------- Puntero quieto sobre un elemento mientras se usa el teclado ----------
describe('GMenu · puntero quieto y teclado', () => {
  const ITEMSQ = [{ id: 'a', label: 'Abrir' }, { label: 'Exportar', items: [{ id: 'pdf', label: 'PDF' }, { id: 'csv', label: 'CSV' }] }, { id: 'b', label: 'Borrar' }]
  const setup = async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    const w = mk({ items: ITEMSQ })
    await trig(w).trigger('click'); await settle()
    return w
  }
  const subs = (w) => w.findAll('ul[role="menu"]').length

  it('con el puntero quieto sobre otro elemento, → abre el submenú y la espera del puntero no lo cierra (ni pierde el foco)', async () => {
    try {
      const w = await setup()
      const its = items(w)
      await move(its[2], 10, 80); await settle() // el puntero llega a «Borrar»: arranca la espera de 180ms
      await key(its[2], 'ArrowUp'); await settle() // teclado antes de que venza
      expect(document.activeElement).toBe(its[1].element)
      await key(its[1], 'ArrowRight'); await settle()
      expect(subs(w)).toBe(2)
      expect(document.activeElement.textContent).toContain('PDF')
      vi.advanceTimersByTime(400); await settle()
      expect(subs(w)).toBe(2)
      expect(document.activeElement.textContent).toContain('PDF')
      await key(document.activeElement && w.findAll('ul[role="menu"]')[1].find('.g-menu__item'), 'ArrowLeft'); await settle()
      expect(subs(w)).toBe(1)
      expect(document.activeElement).toBe(label(w, 'Exportar').element)
      vi.advanceTimersByTime(400); await settle()
      expect(document.activeElement).toBe(label(w, 'Exportar').element)
    } finally { vi.useRealTimers() }
  })

  it('con el puntero fuera, → y ← siguen igual', async () => {
    try {
      const w = await setup()
      const its = items(w)
      its[1].element.focus()
      await key(its[1], 'ArrowRight'); await settle()
      expect(subs(w)).toBe(2)
      vi.advanceTimersByTime(400); await settle()
      expect(subs(w)).toBe(2)
      await key(w.findAll('ul[role="menu"]')[1].find('.g-menu__item'), 'ArrowLeft'); await settle()
      expect(subs(w)).toBe(1)
      expect(document.activeElement).toBe(label(w, 'Exportar').element)
    } finally { vi.useRealTimers() }
  })
})

// ---------- M4 · submenú con intención (triángulo de seguridad) ----------
describe('GMenu · M4 submenú con intención', () => {
  const ITEMS4 = [{ id: 'a', label: 'Abrir' }, { label: 'Exportar', items: [{ id: 'pdf', label: 'PDF' }, { id: 'csv', label: 'CSV' }] }, { id: 'b', label: 'Borrar' }, { id: 'c', label: 'Copiar' }]
  const rect = (el, r) => { el.getBoundingClientRect = () => ({ ...r, width: r.right - r.left, height: r.bottom - r.top, x: r.left, y: r.top }) }
  // LTR: padre en x 0–200 (fila 100–136); el submenú se abrió a su derecha (196–396, 94–300). En RTL, espejado.
  const setup = async (rtl = false) => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    const w = mk({ items: ITEMS4 })
    await trig(w).trigger('click'); await settle()
    const its = items(w)
    const X = rtl ? (x) => 400 - x : (x) => x
    its.forEach((it, i) => rect(it.element, { left: rtl ? 200 : 0, right: rtl ? 400 : 200, top: 64 + i * 36, bottom: 100 + i * 36 }))
    // Puntero al padre y espera de apertura (180ms)
    await move(its[1], X(150), 118); await settle()
    vi.advanceTimersByTime(200); await settle()
    const sub = w.findAll('ul[role="menu"]')[1]
    expect(sub.exists()).toBe(true)
    rect(sub.element, rtl ? { left: 4, right: 204, top: 94, bottom: 300 } : { left: 196, right: 396, top: 94, bottom: 300 })
    return { w, its, X, subExists: () => w.findAll('ul[role="menu"]').length === 2 }
  }

  it('en diagonal hacia el submenú, cruzar otro elemento no cambia el foco ni cierra el submenú', async () => {
    try {
      const { w, its, X, subExists } = await setup()
      await move(its[2], X(170), 140); await settle()
      await move(its[2], X(185), 150); await settle()
      expect(document.activeElement).toBe(its[1].element)
      vi.advanceTimersByTime(100); await settle()
      expect(subExists()).toBe(true)
      // Llega al submenú: su elemento toma el foco
      const subItem = w.findAll('ul[role="menu"]')[1].find('.g-menu__item')
      await move(subItem, X(220), 120); await settle()
      expect(document.activeElement).toBe(subItem.element)
      vi.advanceTimersByTime(400); await settle()
      expect(subExists()).toBe(true)
    } finally { vi.useRealTimers() }
  })

  it('en recto (fuera del triángulo) cambia el foco en el acto y cierra el submenú a los 180ms, como hoy', async () => {
    try {
      const { its, X, subExists } = await setup()
      await move(its[2], X(150), 150); await settle()
      expect(document.activeElement).toBe(its[2].element)
      vi.advanceTimersByTime(170); await settle()
      expect(subExists()).toBe(true)
      vi.advanceTimersByTime(20); await settle()
      expect(subExists()).toBe(false)
    } finally { vi.useRealTimers() }
  })

  it('dentro del triángulo pero parado 180ms sobre otro elemento: cambia', async () => {
    try {
      const { its, X, subExists } = await setup()
      await move(its[2], X(170), 140); await settle()
      vi.advanceTimersByTime(170); await settle()
      expect(document.activeElement).toBe(its[1].element)
      expect(subExists()).toBe(true)
      vi.advanceTimersByTime(20); await settle()
      expect(document.activeElement).toBe(its[2].element)
      expect(subExists()).toBe(false)
    } finally { vi.useRealTimers() }
  })

  it('RTL (submenú a la izquierda): el triángulo se espeja', async () => {
    try {
      const { its, X, subExists } = await setup(true)
      await move(its[2], X(170), 140); await settle()
      expect(document.activeElement).toBe(its[1].element)
      vi.advanceTimersByTime(100); await settle()
      expect(subExists()).toBe(true)
      // Alejarse del submenú (hacia la derecha en RTL) sale del triángulo
      await move(its[2], X(150), 141); await settle()
      expect(document.activeElement).toBe(its[2].element)
    } finally { vi.useRealTimers() }
  })

  it('en cascada (el submenú tapa a su padre) no hay triángulo', async () => {
    try {
      const { w, its, subExists } = await setup()
      w.findAll('ul[role="menu"]')[1].element.getBoundingClientRect = () => ({ left: 40, right: 240, top: 94, bottom: 300, width: 200, height: 206 })
      await move(its[2], 170, 140); await settle()
      expect(document.activeElement).toBe(its[2].element)
      vi.advanceTimersByTime(200); await settle()
      expect(subExists()).toBe(false)
    } finally { vi.useRealTimers() }
  })

  it('el teclado no cambia: ↓ desde el padre con el submenú abierto mueve el foco', async () => {
    try {
      const { its } = await setup()
      await key(its[1], 'ArrowDown'); await settle()
      expect(document.activeElement).toBe(its[2].element)
    } finally { vi.useRealTimers() }
  })
})

// ---------- Reporte del usuario (GCombobox, c4b087d): el panel «pivotea, tintinea, parpadea» al desplazar ----------
describe('GMenu · panel estable al desplazar la página', () => {
  const frame = () => new Promise((r) => requestAnimationFrame(() => r()))
  const scroll = async (target = window) => { target.dispatchEvent(new Event('scroll')); await frame(); await settle() }
  const ITEMS_S = [{ id: 'a', label: 'Abrir' }, { label: 'Exportar', items: [{ id: 'pdf', label: 'PDF' }] }, { id: 'b', label: 'Borrar' }]
  let restore = []
  const fake = (prop, fn) => {
    const own = Object.getOwnPropertyDescriptor(HTMLElement.prototype, prop)
    Object.defineProperty(HTMLElement.prototype, prop, { configurable: true, get() { return fn(this) } })
    // Vuelve el getter propio o, si era heredado (scrollHeight es de Element), lo deja ver de nuevo
    restore.push(() => { if (own) Object.defineProperty(HTMLElement.prototype, prop, own); else delete HTMLElement.prototype[prop] })
  }
  afterEach(() => { restore.forEach((f) => f()); restore = [] })
  // Visor 1000 × 800; lista de 300px de alto natural y 200 de ancho; con el código anterior el lado cambiaba en bottom > 484
  const setup = async (top0, menu = {}) => {
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 800 })
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1000 })
    fake('scrollHeight', (el) => (el.classList.contains('g-menu__list') ? 300 : 0))
    fake('offsetWidth', (el) => (el.classList.contains('g-menu__list') ? 200 : 0))
    fake('offsetHeight', (el) => (el.classList.contains('g-menu__list') ? 300 : 36))
    const w = mk({ items: ITEMS_S, menu })
    const at = { top: top0 }
    trig(w).element.getBoundingClientRect = () => ({ left: 100, right: 180, top: at.top, bottom: at.top + 36, width: 80, height: 36, x: 100, y: at.top })
    await trig(w).trigger('click'); await settle()
    return { w, ul: list(w).element, at }
  }

  it('vaivén de 4px alrededor del cruce: el lado no cambia y --_max no se reescribe', async () => {
    const { w, ul, at } = await setup(440)
    expect(ul.dataset.side).toBe('bottom')
    const max0 = ul.style.getPropertyValue('--_max')
    const spy = vi.spyOn(ul.style, 'setProperty')
    let flips = 0
    let side = 'bottom'
    for (const d of [4, 4, 4, 4, 4, -4, -4, -4, -4, -4, -4, -4, -4, -4, -4, 4, 4, 4, 4, 4]) {
      at.top += d
      await scroll()
      if (ul.dataset.side !== side) flips++
      side = ul.dataset.side
      expect(ul.style.getPropertyValue('--_y')).toBe(`${at.top + 36 + 4}px`) // la posición sí sigue al disparador
    }
    expect(flips).toBe(0)
    expect(spy.mock.calls.filter(([n]) => n === '--_max')).toEqual([])
    expect(ul.style.getPropertyValue('--_max')).toBe(max0)
    w.unmount()
  })

  it('cambia de lado solo si el actual baja de space × 40 y el otro ofrece space × 12 más; entonces fija --_max', async () => {
    const { w, ul, at } = await setup(440)
    at.top = 640 // debajo quedan 112px (< 160) y arriba 628
    await scroll()
    expect(ul.dataset.side).toBe('top')
    expect(ul.style.getPropertyValue('--_max')).toBe('628px')
    expect(ul.style.getPropertyValue('--_y')).toBe(`${640 - 4 - 304}px`) // alto natural + 4, como placeBlock
    at.top = 440 // arriba sigue siendo útil: no vuelve
    await scroll()
    expect(ul.dataset.side).toBe('top')
    expect(ul.style.getPropertyValue('--_max')).toBe('628px')
    expect(ul.style.getPropertyValue('--_y')).toBe(`${440 - 4 - 304}px`)
    w.unmount()
  })

  it('con side fijo (bottom) no cambia de lado aunque no quepa', async () => {
    const { w, ul, at } = await setup(440, { side: 'bottom' })
    at.top = 700
    await scroll()
    expect(ul.dataset.side).toBe('bottom')
    w.unmount()
  })

  it('varios desplazamientos en un cuadro escriben la posición una sola vez, y solo si cambia; la propia lista no recoloca', async () => {
    const { w, ul, at } = await setup(200)
    const spy = vi.spyOn(ul.style, 'setProperty')
    at.top = 190
    for (let i = 0; i < 5; i++) window.dispatchEvent(new Event('scroll'))
    await frame(); await settle()
    expect(spy.mock.calls).toEqual([['--_y', '230px']])
    spy.mockClear()
    await scroll()
    expect(spy).not.toHaveBeenCalled()
    at.top = 150
    await scroll(ul)
    expect(spy).not.toHaveBeenCalled()
    w.unmount()
  })

  it('el submenú abierto sigue a su padre sin reescribir --_max', async () => {
    const { w, ul, at } = await setup(200)
    const parent = label(w, 'Exportar')
    let py = 260
    parent.element.getBoundingClientRect = () => ({ left: 100, right: 300, top: py, bottom: py + 36, width: 200, height: 36, x: 100, y: py })
    await key(parent, 'ArrowRight'); await settle()
    const sub = w.findAll('ul[role="menu"]')[1].element
    const y0 = parseFloat(sub.style.getPropertyValue('--_y'))
    const spy = vi.spyOn(sub.style, 'setProperty')
    at.top -= 20; py -= 20
    await scroll()
    expect(parseFloat(sub.style.getPropertyValue('--_y'))).toBe(y0 - 20)
    expect(spy.mock.calls.filter(([n]) => n === '--_max')).toEqual([])
    expect(ul).toBeTruthy()
    w.unmount()
  })

  it('si el disparador sale del visor, el menú se cierra (comportamiento sin cambios)', async () => {
    const { w, at } = await setup(200)
    at.top = -100
    await scroll()
    expect(w.vm.isOpen).toBe(false)
    w.unmount()
  })
})
