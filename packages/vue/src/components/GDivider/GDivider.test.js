import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { h, nextTick, ref } from 'vue'
import GDivider from './GDivider.vue'

// Contrato: design/contracts/divider.md. Las medidas (alto del vertical con GBtn reales, inset, RTL, 320px) y el árbol de
// accesibilidad real se comprueban con Playwright en los tres motores (design/lab/theme-playground/tests/library.spec.mjs):
// jsdom no tiene maquetación ni árbol de accesibilidad.

const wrappers = []
afterEach(() => {
  vi.restoreAllMocks()
  while (wrappers.length) wrappers.pop().unmount()
  document.body.innerHTML = ''
})

const spy = () => vi.spyOn(console, 'warn').mockImplementation(() => {})
const msgs = (s) => s.mock.calls.map((c) => String(c[0]))
const mk = (props = {}, slots = {}, attrs = {}) => {
  const w = mount(GDivider, { props, slots, attrs, attachTo: document.body })
  wrappers.push(w)
  return w
}
// Monta el divider dentro de un padre con estilo en línea (jsdom calcula display y flex-direction desde ahí)
const fnSlots = (slots) => Object.fromEntries(Object.entries(slots).map(([k, v]) => [k, typeof v === 'function' ? v : () => v]))
const inParent = (tag, parentAttrs, props = {}, slots = {}) => {
  const w = mount({ render: () => h(tag, parentAttrs, [h(GDivider, props, fnSlots(slots))]) }, { attachTo: document.body })
  wrappers.push(w)
  return w
}
const root = (w) => w.find('.g-divider')
const cls = (w) => root(w).classes().join(' ')

describe('GDivider · marcado por caso (las cinco filas de «Semántica»)', () => {
  it('horizontal sin texto: <hr> sin role ni aria-* (separator implícito, horizontal)', () => {
    const w = mk()
    const el = root(w).element
    expect(el.tagName).toBe('HR')
    expect(cls(w)).toBe('g-divider g-divider--orientation-horizontal g-divider--inset-none g-divider--emphasis-subtle')
    expect(el.hasAttribute('role')).toBe(false)
    expect(el.hasAttribute('aria-orientation')).toBe(false)
    expect(el.hasAttribute('aria-hidden')).toBe(false)
  })

  it('horizontal sin texto, decorative: <hr aria-hidden="true">', () => {
    const w = mk({ decorative: true, inset: 'start', emphasis: 'strong' })
    const el = root(w).element
    expect(el.tagName).toBe('HR')
    expect(el.getAttribute('aria-hidden')).toBe('true')
    expect(el.hasAttribute('role')).toBe(false)
    expect(cls(w)).toBe('g-divider g-divider--orientation-horizontal g-divider--inset-start g-divider--emphasis-strong')
  })

  it('vertical: <div role="separator" aria-orientation="vertical">', () => {
    const w = inParent('div', { style: 'display:flex' }, { orientation: 'vertical' })
    const el = root(w).element
    expect(el.tagName).toBe('DIV')
    expect(el.getAttribute('role')).toBe('separator')
    expect(el.getAttribute('aria-orientation')).toBe('vertical')
    expect(el.hasAttribute('aria-hidden')).toBe(false)
    expect(cls(w)).toBe('g-divider g-divider--orientation-vertical g-divider--inset-none g-divider--emphasis-subtle')
    expect(el.childNodes.length).toBe(0)
  })

  it('vertical decorative: aria-hidden sin role ni aria-orientation', () => {
    const w = inParent('div', { style: 'display:flex' }, { orientation: 'vertical', decorative: true, inset: 'both' })
    const el = root(w).element
    expect(el.tagName).toBe('DIV')
    expect(el.getAttribute('aria-hidden')).toBe('true')
    expect(el.hasAttribute('role')).toBe(false)
    expect(el.hasAttribute('aria-orientation')).toBe(false)
    expect(cls(w)).toBe('g-divider g-divider--orientation-vertical g-divider--inset-both g-divider--emphasis-subtle')
  })

  it('horizontal con texto: <div> sin rol + <span class="g-divider__label">; decorative no cambia nada', () => {
    for (const decorative of [false, true]) {
      const w = mk({ label: 'O bien', decorative })
      const el = root(w).element
      expect(el.tagName).toBe('DIV')
      expect(cls(w)).toBe('g-divider g-divider--orientation-horizontal g-divider--labeled g-divider--inset-none g-divider--emphasis-subtle')
      expect(el.hasAttribute('role')).toBe(false)
      expect(el.hasAttribute('aria-hidden')).toBe(false)
      expect(el.hasAttribute('aria-orientation')).toBe(false)
      expect(el.children.length).toBe(1)
      expect(el.children[0].tagName).toBe('SPAN')
      expect(el.children[0].className).toBe('g-divider__label')
      expect(el.textContent).toBe('O bien')
    }
  })

  it('las clases siguen a las props en cada combinación (orientación × inset × énfasis × decorative × texto)', () => {
    for (const orientation of ['horizontal', 'vertical']) {
      for (const inset of ['none', 'both', 'start']) {
        for (const emphasis of ['subtle', 'strong']) {
          for (const decorative of [false, true]) {
            for (const label of [undefined, 'Ayer']) {
              const s = spy()
              const w = inParent('div', { style: 'display:flex' }, { orientation, inset, emphasis, decorative, label })
              const el = root(w).element
              const vertical = orientation === 'vertical'
              const labeled = !vertical && !!label
              const effInset = vertical && inset === 'start' ? 'both' : inset
              const expected = ['g-divider', `g-divider--orientation-${orientation}`, labeled && 'g-divider--labeled', `g-divider--inset-${effInset}`, `g-divider--emphasis-${emphasis}`].filter(Boolean).join(' ')
              const key = JSON.stringify({ orientation, inset, emphasis, decorative, label })
              expect(cls(w), key).toBe(expected)
              // Árbol esperado: separator (implícito u explícito), fuera del árbol o texto sin rol
              if (labeled) {
                expect([el.tagName, el.getAttribute('role'), el.getAttribute('aria-hidden')], key).toEqual(['DIV', null, null])
              } else if (!vertical) {
                expect([el.tagName, el.getAttribute('role'), el.getAttribute('aria-hidden')], key).toEqual(['HR', null, decorative ? 'true' : null])
              } else if (decorative) {
                expect([el.tagName, el.getAttribute('role'), el.getAttribute('aria-orientation'), el.getAttribute('aria-hidden')], key).toEqual(['DIV', null, null, 'true'])
              } else {
                expect([el.tagName, el.getAttribute('role'), el.getAttribute('aria-orientation'), el.getAttribute('aria-hidden')], key).toEqual(['DIV', 'separator', 'vertical', null])
              }
              // Nunca enfocable ni con nombre propio
              expect(el.hasAttribute('tabindex'), key).toBe(false)
              expect(el.hasAttribute('aria-label'), key).toBe(false)
              expect(el.hasAttribute('aria-valuenow'), key).toBe(false)
              s.mockRestore()
            }
          }
        }
      }
    }
  })
})

describe('GDivider · props, slot y atributos', () => {
  it('cada prop enumerada tiene validador; no hay density, color, variant, size, as ni rounded', () => {
    for (const n of ['orientation', 'inset', 'emphasis']) expect(GDivider.props[n].validator('valor-invalido')).toBe(false)
    expect(GDivider.props.orientation.validator('vertical')).toBe(true)
    expect(GDivider.props.inset.validator('start')).toBe(true)
    expect(GDivider.props.emphasis.validator('strong')).toBe(true)
    expect(GDivider.props.inset.validator('end')).toBe(false)
    for (const n of ['density', 'color', 'variant', 'size', 'as', 'rounded', 'strong']) expect(GDivider.props[n]).toBeUndefined()
    expect(GDivider.props.orientation.default).toBe('horizontal')
    expect(GDivider.props.inset.default).toBe('none')
    expect(GDivider.props.emphasis.default).toBe('subtle')
    expect(GDivider.props.decorative).toBe(Boolean)
  })

  it('sin eventos declarados ni manejadores de teclado o puntero', () => {
    expect(GDivider.emits).toBeUndefined()
    const w = mk({ label: 'O bien' })
    const props = w.findComponent(GDivider).vm.$.subTree.props || {}
    expect(Object.keys(props).filter((k) => /^on[A-Z]/.test(k))).toEqual([])
  })

  it('el slot label gana a la prop', () => {
    const w = mk({ label: 'Prop' }, { label: () => h('em', 'Slot') })
    expect(root(w).classes()).toContain('g-divider--labeled')
    expect(w.find('.g-divider__label').html()).toContain('<em>Slot</em>')
    expect(root(w).text()).toBe('Slot')
  })

  it('el slot label sin prop pinta el texto', () => {
    const w = mk({}, { label: 'Ayer' })
    expect(root(w).element.tagName).toBe('DIV')
    expect(w.find('.g-divider__label').text()).toBe('Ayer')
  })

  it('sin texto efectivo (prop vacía o en blanco, slot vacío) es la variante de línea', () => {
    for (const [props, slots] of [[{ label: '' }, {}], [{ label: '   ' }, {}], [{}, { label: () => [] }], [{}, { label: ' ' }]]) {
      const w = mk(props, slots)
      expect(root(w).element.tagName).toBe('HR')
      expect(root(w).classes()).not.toContain('g-divider--labeled')
      expect(w.find('.g-divider__label').exists()).toBe(false)
    }
  })

  it('el contenido del slot por defecto no se pinta', () => {
    const s = spy()
    const w = mk({}, { default: 'O bien' })
    expect(root(w).element.tagName).toBe('HR')
    expect(root(w).text()).toBe('')
    expect(msgs(s).some((m) => m.includes('usa label o el slot label'))).toBe(true)
  })

  it('los atributos del consumidor van a la raíz (id, class, style, data-*, aria-label)', () => {
    const w = mk({}, {}, { id: 'd1', class: 'mi-linea', style: 'opacity: 0.5', 'data-x': '1', 'aria-label': 'Fin de la sección' })
    const el = root(w).element
    expect(el.id).toBe('d1')
    expect(el.classList.contains('mi-linea')).toBe(true)
    expect(el.classList.contains('g-divider')).toBe(true)
    expect(el.getAttribute('style')).toContain('opacity')
    expect(el.dataset.x).toBe('1')
    expect(el.getAttribute('aria-label')).toBe('Fin de la sección')
  })

  it('en vertical, el texto no se pinta (sin __label ni --labeled)', () => {
    const s = spy()
    const w = inParent('div', { style: 'display:flex' }, { orientation: 'vertical', label: 'O bien' }, { label: 'Slot' })
    expect(w.find('.g-divider__label').exists()).toBe(false)
    expect(root(w).classes()).not.toContain('g-divider--labeled')
    expect(root(w).text()).toBe('')
    expect(root(w).attributes('role')).toBe('separator')
    expect(msgs(s).filter((m) => m.includes('label solo en horizontal'))).toHaveLength(1)
  })

  it('inset="start" en vertical se convierte en both (clase efectiva) y avisa', () => {
    const s = spy()
    const w = inParent('div', { style: 'display:flex' }, { orientation: 'vertical', inset: 'start' })
    expect(root(w).classes()).toContain('g-divider--inset-both')
    expect(root(w).classes()).not.toContain('g-divider--inset-start')
    expect(msgs(s)).toEqual(['[Grana GDivider] inset="start" solo en horizontal; en vertical se usa both.'])
  })

  it('RTL: sin prop ni marcado distinto (propiedades lógicas en el CSS)', () => {
    const w = inParent('div', { dir: 'rtl' }, { inset: 'start', label: 'أو' })
    expect(cls(w)).toBe('g-divider g-divider--orientation-horizontal g-divider--labeled g-divider--inset-start g-divider--emphasis-subtle')
    expect(root(w).attributes('dir')).toBeUndefined()
  })

  it('cambia de elemento al cambiar la orientación (hr ↔ div) y mantiene las clases al día', async () => {
    const o = ref('horizontal')
    const w = mount({ render: () => h('div', { style: 'display:flex' }, [h(GDivider, { orientation: o.value })]) }, { attachTo: document.body })
    wrappers.push(w)
    expect(root(w).element.tagName).toBe('HR')
    o.value = 'vertical'
    await nextTick()
    expect(root(w).element.tagName).toBe('DIV')
    expect(root(w).attributes('role')).toBe('separator')
    expect(root(w).classes()).toContain('g-divider--orientation-vertical')
  })
})

describe('GDivider · nunca enfocable', () => {
  it('ningún caso lleva tabindex; Tab pasa de largo (el foco va del botón anterior al siguiente)', async () => {
    const w = mount({
      render: () => h('div', { style: 'display:flex' }, [
        h('button', { id: 'a' }, 'A'),
        h(GDivider, { orientation: 'vertical' }),
        h(GDivider, {}),
        h(GDivider, { label: 'O bien' }),
        h(GDivider, { decorative: true }),
        h('button', { id: 'b' }, 'B')
      ])
    }, { attachTo: document.body })
    wrappers.push(w)
    const focusables = [...document.body.querySelectorAll('button, [tabindex], hr, [role="separator"]')].filter((el) => el.tabIndex >= 0)
    expect(focusables.map((el) => el.id)).toEqual(['a', 'b'])
    for (const d of w.findAll('.g-divider')) {
      d.element.focus()
      expect(document.activeElement).not.toBe(d.element)
    }
  })
})

describe('GDivider · avisos de desarrollo (una vez por instancia y motivo)', () => {
  it('1 · vertical con un padre de bloque', () => {
    const s = spy()
    inParent('div', {}, { orientation: 'vertical' })
    expect(msgs(s)).toEqual(['[Grana GDivider] vertical necesita un padre flex en fila o grid para tomar su alto (padre: display block).'])
  })

  it('1 · vertical en una columna flex', () => {
    const s = spy()
    inParent('div', { style: 'display:flex;flex-direction:column' }, { orientation: 'vertical' })
    expect(msgs(s)).toHaveLength(1)
    expect(msgs(s)[0]).toContain('flex-direction column')
  })

  it('1 · atraviesa display: contents hasta el padre real', () => {
    const s = spy()
    const w = mount({ render: () => h('div', { style: 'display:flex' }, [h('div', { style: 'display:contents' }, [h(GDivider, { orientation: 'vertical' })])]) }, { attachTo: document.body })
    wrappers.push(w)
    expect(msgs(s)).toEqual([])
    const s2 = spy()
    const w2 = mount({ render: () => h('div', {}, [h('div', { style: 'display:contents' }, [h(GDivider, { orientation: 'vertical' })])]) }, { attachTo: document.body })
    wrappers.push(w2)
    expect(msgs(s2)).toHaveLength(1)
  })

  it('1 · al cambiar a vertical también se comprueba (y no se repite)', async () => {
    const s = spy()
    const o = ref('horizontal')
    const w = mount({ render: () => h('div', {}, [h(GDivider, { orientation: o.value })]) }, { attachTo: document.body })
    wrappers.push(w)
    expect(msgs(s)).toEqual([])
    o.value = 'vertical'
    await nextTick()
    await nextTick()
    expect(msgs(s).filter((m) => m.includes('vertical necesita'))).toHaveLength(1)
    o.value = 'horizontal'
    await nextTick()
    o.value = 'vertical'
    await nextTick()
    await nextTick()
    expect(msgs(s).filter((m) => m.includes('vertical necesita'))).toHaveLength(1)
  })

  it('2 · hijo de ul, ol, menu o de un role list/menu/menubar/listbox/tablist', () => {
    for (const [tag, attrs] of [['ul', {}], ['ol', {}], ['menu', {}], ['div', { role: 'list' }], ['div', { role: 'menu' }], ['div', { role: 'menubar' }], ['div', { role: 'listbox' }], ['div', { role: 'tablist' }]]) {
      const s = spy()
      inParent(tag, attrs)
      expect(msgs(s), `${tag} ${JSON.stringify(attrs)}`).toEqual(['[Grana GDivider] un divider no puede ser hijo de una lista o un menú: parte la lista en dos y pon el divider entre ellas (en GMenu, usa su separador).'])
      s.mockRestore()
    }
  })

  it('3 · label (prop o slot) en vertical', () => {
    const s = spy()
    inParent('div', { style: 'display:flex' }, { orientation: 'vertical', label: 'O bien' })
    inParent('div', { style: 'display:flex' }, { orientation: 'vertical' }, { label: 'Slot' })
    expect(msgs(s)).toEqual(['[Grana GDivider] label solo en horizontal; en vertical se ignora.', '[Grana GDivider] label solo en horizontal; en vertical se ignora.'])
  })

  it('4 · inset="start" en vertical', () => {
    const s = spy()
    inParent('div', { style: 'display:grid' }, { orientation: 'vertical', inset: 'start' })
    expect(msgs(s)).toEqual(['[Grana GDivider] inset="start" solo en horizontal; en vertical se usa both.'])
  })

  it('5 · contenido interactivo en el texto (a[href], button, input, select, textarea, summary, [tabindex], [contenteditable])', () => {
    const cases = [
      () => h('a', { href: '#x' }, 'enlace'),
      () => h('button', 'botón'),
      () => h('input'),
      () => h('select'),
      () => h('textarea'),
      () => h('details', [h('summary', 'más')]),
      () => h('span', { tabindex: '0' }, 'x'),
      () => h('span', { contenteditable: 'true' }, 'x')
    ]
    for (const c of cases) {
      const s = spy()
      mk({}, { label: c })
      expect(msgs(s)).toEqual(['[Grana GDivider] el texto del divider no admite contenido interactivo.'])
      s.mockRestore()
    }
  })

  it('5 · también si el contenido interactivo aparece después (al actualizar), una sola vez', async () => {
    const s = spy()
    const show = ref(false)
    const w = mount({ render: () => h(GDivider, null, { label: () => (show.value ? [h('button', 'x'), h('a', { href: '#' }, 'y')] : 'texto') }) }, { attachTo: document.body })
    wrappers.push(w)
    expect(msgs(s)).toEqual([])
    show.value = true
    await nextTick()
    show.value = false
    await nextTick()
    show.value = true
    await nextTick()
    expect(msgs(s)).toEqual(['[Grana GDivider] el texto del divider no admite contenido interactivo.'])
  })

  it('6 · tabindex del consumidor: avisa y el atributo llega a la raíz', () => {
    const s = spy()
    const w = mk({}, {}, { tabindex: '0' })
    expect(root(w).attributes('tabindex')).toBe('0')
    expect(msgs(s)).toEqual(['[Grana GDivider] GDivider no es enfocable (un separador enfocable es un splitter).'])
  })

  it('7 · contenido en el slot por defecto', () => {
    const s = spy()
    mk({}, { default: () => h('span', 'O bien') })
    expect(msgs(s)).toEqual(['[Grana GDivider] usa label o el slot label: el slot por defecto no se pinta.'])
  })

  it('cada aviso, una sola vez por instancia aunque se vuelva a renderizar', async () => {
    const s = spy()
    const n = ref(0)
    const w = mount({ render: () => h('div', {}, [h(GDivider, { orientation: 'vertical', inset: 'start', label: `L${n.value}`, tabindex: '0', 'data-n': n.value }, { default: () => 'x' })]) }, { attachTo: document.body })
    wrappers.push(w)
    for (let i = 1; i < 4; i++) { n.value = i; await nextTick() }
    const m = msgs(s)
    for (const k of ['vertical necesita', 'label solo en horizontal', 'inset="start"', 'no es enfocable', 'usa label o el slot label']) {
      expect(m.filter((x) => x.includes(k)), k).toHaveLength(1)
    }
    expect(m).toHaveLength(5)
  })

  it('una instancia nueva vuelve a avisar (por instancia, no global)', () => {
    const s = spy()
    inParent('div', { style: 'display:flex' }, { orientation: 'vertical', inset: 'start' })
    inParent('div', { style: 'display:flex' }, { orientation: 'vertical', inset: 'start' })
    expect(msgs(s)).toHaveLength(2)
  })

  it('ningún aviso en los usos correctos', () => {
    const s = spy()
    // vertical en fila flex, fila flex invertida, fila con align-items: center, inline-flex, grid e inline-grid
    for (const style of ['display:flex', 'display:flex;flex-direction:row-reverse', 'display:flex;align-items:center', 'display:inline-flex', 'display:grid', 'display:inline-grid']) {
      inParent('div', { style }, { orientation: 'vertical', inset: 'both', emphasis: 'strong' })
      inParent('div', { style }, { orientation: 'vertical', decorative: true })
    }
    // horizontal en bloque y en columna flex, con y sin texto, con inset start
    for (const style of ['', 'display:flex;flex-direction:column;align-items:center']) {
      inParent('div', { style }, { inset: 'start' })
      inParent('div', { style }, { label: 'O bien', decorative: true })
      inParent('div', { style }, {}, { label: () => h('strong', 'Ayer') })
    }
    // entre dos listas, no dentro
    mount({ render: () => h('div', [h('ul', [h('li', 'a')]), h(GDivider), h('ul', [h('li', 'b')])]) }, { attachTo: document.body })
    expect(msgs(s)).toEqual([])
  })
})

describe('GDivider · avisos solo en desarrollo', () => {
  it('en producción no avisa nada (y se pinta igual)', async () => {
    const prev = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'
    vi.resetModules()
    try {
      const { default: Prod } = await import('./GDivider.vue')
      const s = spy()
      const w = mount({ render: () => h('ul', [h(Prod, { orientation: 'vertical', inset: 'start', label: 'x', tabindex: '0' }, { default: () => 'y' })]) }, { attachTo: document.body })
      wrappers.push(w)
      expect(w.find('.g-divider').classes()).toContain('g-divider--inset-both')
      expect(msgs(s)).toEqual([])
    } finally {
      process.env.NODE_ENV = prev
      vi.resetModules()
    }
  })
})
