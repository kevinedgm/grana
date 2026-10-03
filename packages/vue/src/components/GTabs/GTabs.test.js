import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick, h, ref } from 'vue'
import GTabs from './GTabs.vue'
import GTabPanel from './GTabPanel.vue'

beforeEach(() => {
  HTMLElement.prototype.showPopover = function () { this.setAttribute('data-open', '') }
  HTMLElement.prototype.hidePopover = function () { this.removeAttribute('data-open') }
})
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); document.body.innerHTML = '' })

const items = [
  { id: 'general', label: 'General', icon: 'house' },
  { id: 'msgs', label: 'Mensajes', count: 8, countLabel: '8 sin leer' },
  { id: 'news', label: 'Novedades', badge: 'Nuevo' },
  { id: 'errs', label: 'Errores', status: 'attention', statusLabel: 'requiere atención' },
  { id: 'rep', label: 'Informe', status: 'loading', statusLabel: 'cargando' },
  { id: 'perm', label: 'Permisos', disabled: true }
]
const labels = { more: 'Más pestañas', menu: 'Todas las pestañas', loading: '{label}: cargando', loaded: '{label}: listo' }
const mk = (props = {}, opts = {}) => mount(GTabs, {
  attachTo: document.body,
  props: { items, modelValue: 'general', label: 'Ajustes', id: 't', labels, ...props },
  slots: { panel: ({ item }) => `Contenido de ${item.label}` },
  ...opts
})
const tabs = (w) => w.findAll('[role="tab"]')
const tab = (w, id) => w.find(`#t-tab-${id}`)
const flush = async () => { for (let i = 0; i < 5; i++) await nextTick() }
const frames = () => new Promise((r) => setTimeout(r, 60))
const key = (w, id, k, extra = {}) => tab(w, id).trigger('keydown', { key: k, ...extra })
const activeEl = () => document.activeElement?.id

// Ancho simulado (jsdom no hace layout): cada pestaña mide `tabW`, el encabezado `headerW`, «Más» 40
function stubLayout({ tabW = 100, headerW = 350, rootW = headerW, moreW = 40 } = {}) {
  const orig = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth')
  const origC = Object.getOwnPropertyDescriptor(Element.prototype, 'clientWidth')
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, get() { return this.matches('[role="tab"]') ? tabW : this.matches('.g-tabs__more') ? moreW : 0 } })
  Object.defineProperty(Element.prototype, 'clientWidth', { configurable: true, get() { return this.matches('.g-tabs') ? rootW : this.matches('.g-tabs__header') ? headerW : 0 } })
  return () => {
    if (orig) Object.defineProperty(HTMLElement.prototype, 'offsetWidth', orig); else delete HTMLElement.prototype.offsetWidth
    if (origC) Object.defineProperty(Element.prototype, 'clientWidth', origC); else delete Element.prototype.clientWidth
  }
}

describe('GTabs · estructura y apariencias', () => {
  it('raíz con las clases del contrato y sin tablist vacío', () => {
    const w = mk()
    expect(w.classes()).toEqual(expect.arrayContaining(['g-tabs', 'g-tabs--appearance-underline', 'g-tabs--orientation-horizontal', 'g-tabs--color-brand', 'g-tabs--density-default', 'g-tabs--align-start', 'g-tabs--overflow-scroll']))
    expect(w.attributes('id')).toBe('t')
    expect(w.find('.g-tabs__live').attributes('role')).toBe('status')
    expect(w.find('.g-tabs__mark').attributes('aria-hidden')).toBe('true')
    w.unmount()
  })
  it.each(['underline', 'pill', 'segmented', 'contained'])('appearance %s', (a) => {
    const w = mk({ appearance: a })
    expect(w.classes()).toContain(`g-tabs--appearance-${a}`)
    w.unmount()
  })
  it('color, density, snap y disabled se reflejan en la raíz', () => {
    const w = mk({ color: 'accent', density: 'compact', snap: true, disabled: true })
    expect(w.classes()).toEqual(expect.arrayContaining(['g-tabs--color-accent', 'g-tabs--density-compact', 'g-tabs--snap', 'is-disabled']))
    expect(tabs(w).every((t) => t.attributes('aria-disabled') === 'true')).toBe(true)
    w.unmount()
  })
  it('las props enumeradas rechazan valores fuera de su lista', () => {
    const v = (name) => GTabs.props[name].validator
    expect(v('appearance')('tabs')).toBe(false)
    expect(v('orientation')('diagonal')).toBe(false)
    expect(v('color')('danger')).toBe(false)
    expect(v('density')('big')).toBe(false)
    expect(v('align')('end')).toBe(false)
    expect(v('activation')('hover')).toBe(false)
    expect(v('overflow')('combined')).toBe(false)
    expect(v('overflow')('auto')).toBe(false)
    expect(v('labelMode')('text')).toBe(false)
    expect(v('responsive')('always')).toBe(false)
    expect(v('overflow')('more')).toBe(true)
  })
  it('atributos y clases del consumidor van a la raíz, y `change` no llega al nativo', async () => {
    const onChange = vi.fn()
    const w = mk({}, { attrs: { class: 'mio', 'data-x': '1', onChange } })
    expect(w.classes()).toContain('mio')
    expect(w.attributes('data-x')).toBe('1')
    await tab(w, 'msgs').trigger('click')
    expect(onChange).toHaveBeenCalledTimes(1)
    w.unmount()
  })
  it('sin items: no dibuja tablist, muestra el slot empty y avisa', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mk({ items: [], modelValue: undefined }, { slots: { empty: () => 'Sin pestañas' } })
    expect(w.find('[role="tablist"]').exists()).toBe(false)
    expect(w.text()).toContain('Sin pestañas')
    expect(warn.mock.calls.some((c) => String(c[0]).includes('items'))).toBe(true)
    w.unmount()
  })
})

describe('GTabs · ARIA', () => {
  it('tablist con nombre, orientación y solo role="tab" dentro', () => {
    const w = mk()
    const list = w.find('[role="tablist"]')
    expect(list.attributes('aria-label')).toBe('Ajustes')
    expect(list.attributes('aria-orientation')).toBe('horizontal')
    expect([...list.element.children].every((c) => c.getAttribute('role') === 'tab')).toBe(true)
    expect(list.element.contains(w.find('.g-tabs__mark').element)).toBe(false)
    w.unmount()
  })
  it('labelledby nombra el tablist cuando no hay label', () => {
    const w = mk({ label: undefined, labelledby: 'titulo' })
    const list = w.find('[role="tablist"]')
    expect(list.attributes('aria-labelledby')).toBe('titulo')
    expect(list.attributes('aria-label')).toBeUndefined()
    w.unmount()
  })
  it('pestaña y panel se enlazan por id en los dos sentidos', () => {
    const w = mk()
    for (const e of items) {
      const t = tab(w, e.id)
      expect(t.attributes('aria-controls')).toBe(`t-panel-${e.id}`)
      const p = w.find(`#t-panel-${e.id}`)
      expect(p.attributes('role')).toBe('tabpanel')
      expect(p.attributes('aria-labelledby')).toBe(`t-tab-${e.id}`)
    }
    w.unmount()
  })
  it('aria-selected, is-active y un solo panel visible', () => {
    const w = mk({ modelValue: 'msgs' })
    expect(tab(w, 'msgs').attributes('aria-selected')).toBe('true')
    expect(tab(w, 'msgs').classes()).toContain('is-active')
    expect(tabs(w).filter((t) => t.attributes('aria-selected') === 'true')).toHaveLength(1)
    expect(w.findAll('[role="tabpanel"]').filter((p) => p.attributes('hidden') === undefined)).toHaveLength(1)
    expect(w.find('#t-panel-msgs').attributes('hidden')).toBeUndefined()
    expect(w.find('#t-panel-general').attributes('hidden')).toBeDefined()
    w.unmount()
  })
  it('tabindex itinerante: solo la activa tiene 0', () => {
    const w = mk({ modelValue: 'news' })
    expect(tabs(w).filter((t) => t.attributes('tabindex') === '0').map((t) => t.attributes('id'))).toEqual(['t-tab-news'])
    expect(tabs(w).filter((t) => t.attributes('tabindex') === '-1')).toHaveLength(5)
    w.unmount()
  })
  it('sin modelValue, la primera habilitada es la activa', () => {
    const w = mk({ modelValue: undefined, items: [{ id: 'a', label: 'A', disabled: true }, { id: 'b', label: 'B' }] })
    expect(w.find('#t-tab-b').attributes('aria-selected')).toBe('true')
    w.unmount()
  })
  it('modelValue desconocido o deshabilitado: ninguna activa, ningún panel visible, la primera habilitada es tabulable y avisa', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    for (const v of ['nada', 'perm']) {
      const w = mk({ modelValue: v })
      expect(tabs(w).some((t) => t.attributes('aria-selected') === 'true')).toBe(false)
      expect(w.findAll('[role="tabpanel"]').every((p) => p.attributes('hidden') !== undefined)).toBe(true)
      expect(tabs(w).filter((t) => t.attributes('tabindex') === '0').map((t) => t.attributes('id'))).toEqual(['t-tab-general'])
      expect(w.attributes('style')).toContain('--_mark-w: 0px')
      w.unmount()
    }
    expect(warn.mock.calls.filter((c) => String(c[0]).includes('modelValue'))).toHaveLength(2)
  })
  it('deshabilitada: aria-disabled, is-disabled y no se activa', async () => {
    const w = mk()
    const t = tab(w, 'perm')
    expect(t.attributes('aria-disabled')).toBe('true')
    expect(t.classes()).toContain('is-disabled')
    await t.trigger('click')
    expect(w.emitted('change')).toBeUndefined()
    w.unmount()
  })
  it('aria-orientation sigue al diseño real', () => {
    const w = mk({ orientation: 'vertical', responsive: 'never' })
    expect(w.find('[role="tablist"]').attributes('aria-orientation')).toBe('vertical')
    expect(w.classes()).toContain('g-tabs--orientation-vertical')
    w.unmount()
  })
  it('vertical con segmented o contained cae a horizontal y avisa', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    for (const a of ['segmented', 'contained']) {
      const w = mk({ orientation: 'vertical', appearance: a })
      expect(w.classes()).toContain('g-tabs--orientation-horizontal')
      expect(w.find('[role="tablist"]').attributes('aria-orientation')).toBe('horizontal')
      w.unmount()
    }
    expect(warn.mock.calls.filter((c) => String(c[0]).includes('no admite'))).toHaveLength(2)
  })
})

describe('GTabs · contenido de la pestaña', () => {
  it('etiqueta con data-text y orden icono, etiqueta, estado, insignia', () => {
    const w = mk({ items: [{ id: 'a', label: 'Mensajes', icon: 'mail', count: 3, countLabel: '3 sin leer' }] }, { slots: { icon: () => h('i', { class: 'ic' }) } })
    const t = tab(w, 'a')
    expect(t.find('.g-tabs__label').attributes('data-text')).toBe('Mensajes')
    expect([...t.element.children].map((c) => c.className.split(' ')[0])).toEqual(['g-tabs__icon', 'g-tabs__label', 'g-badge'])
    expect(t.find('.g-tabs__icon').attributes('aria-hidden')).toBe('true')
    w.unmount()
  })
  it('contador: GBadge count con texto accesible (countLabel); 0 no se pinta', () => {
    const w = mk()
    const b = tab(w, 'msgs').find('.g-badge')
    expect(b.classes()).toEqual(expect.arrayContaining(['g-badge--variant-soft', 'g-badge--color-neutral', 'g-badge--size-sm', 'g-badge--kind-count']))
    expect(b.find('.g-badge__sr').text()).toBe('8 sin leer')
    expect(b.find('.g-badge__text').attributes('aria-hidden')).toBe('true')
    w.unmount()
    const z = mk({ items: [{ id: 'a', label: 'A', count: 0, countLabel: 'cero' }] })
    expect(z.find('.g-badge').exists()).toBe(false)
    z.unmount()
  })
  it('insignia de texto; badgeLabel se lee en lugar del texto visible', () => {
    const w = mk({ items: [{ id: 'a', label: 'A', badge: 'Nuevo' }, { id: 'b', label: 'B', badge: 'Beta', badgeLabel: 'versión beta' }] })
    expect(tab(w, 'a').find('.g-badge').classes()).toContain('g-badge--kind-text')
    expect(tab(w, 'a').find('.g-badge__text').text()).toBe('Nuevo')
    expect(tab(w, 'b').find('.g-badge__text').attributes('aria-hidden')).toBe('true')
    expect(tab(w, 'b').find('.g-badge__sr').text()).toBe('versión beta')
    w.unmount()
  })
  it('status: icono decorativo y texto oculto; clases is-loading e is-attention; loading no deshabilita', () => {
    const w = mk()
    const l = tab(w, 'rep')
    expect(l.classes()).toContain('is-loading')
    expect(l.find('.g-tabs__status').attributes('aria-hidden')).toBe('true')
    expect(l.find('.g-tabs__status svg').exists()).toBe(true)
    expect(l.find('.g-tabs__sr').text()).toBe(', cargando')
    expect(l.attributes('aria-disabled')).toBeUndefined()
    expect(tab(w, 'errs').classes()).toContain('is-attention')
    expect(tab(w, 'errs').find('.g-tabs__sr').text()).toBe(', requiere atención')
    w.unmount()
  })
  it('slot label: contenido rico y nombre accesible desde item.label', () => {
    const w = mk({ items: [{ id: 'a', label: 'Mensajes', count: 2, countLabel: '2 sin leer' }] }, { slots: { label: ({ item }) => h('em', item.label.toUpperCase()) } })
    expect(tab(w, 'a').find('em').text()).toBe('MENSAJES')
    expect(tab(w, 'a').attributes('aria-label')).toBe('Mensajes, 2 sin leer')
    w.unmount()
  })
  it('slot icon recibe item, index y active', () => {
    const seen = []
    const w = mk({ items: [{ id: 'a', label: 'A', icon: 'x' }, { id: 'b', label: 'B', icon: 'y' }], modelValue: 'b' }, { slots: { icon: (c) => { seen.push([c.item.icon, c.index, c.active]); return 'i' } } })
    expect(seen).toEqual(expect.arrayContaining([['x', 0, false], ['y', 1, true]]))
    w.unmount()
  })
  it('labelMode="icon": todas con icono pasan a solo icono; la etiqueta sigue en el DOM; la que no tiene icono la conserva', () => {
    const w = mk({ labelMode: 'icon', modelValue: 'a', items: [{ id: 'a', label: 'Uno', icon: 'x' }, { id: 'b', label: 'Dos', icon: 'y' }, { id: 'c', label: 'Tres' }] }, { slots: { icon: () => 'i' } })
    expect(w.classes()).toContain('g-tabs--icon-only')
    expect(tab(w, 'a').classes()).toContain('is-icon-only')
    expect(tab(w, 'a').find('.g-tabs__label').text()).toBe('Uno')
    expect(tab(w, 'c').classes()).not.toContain('is-icon-only')
    w.unmount()
  })
  it('snap, align y overflow como clases (align degrada a start con desbordamiento)', () => {
    const w = mk({ align: 'fill', overflow: 'arrows' })
    expect(w.classes()).toEqual(expect.arrayContaining(['g-tabs--align-fill', 'g-tabs--overflow-arrows']))
    w.unmount()
  })
})

describe('GTabs · eventos', () => {
  it('clic: change {id,index,source:pointer} y update:modelValue; no cambia el prop por su cuenta', async () => {
    const w = mk()
    await tab(w, 'news').trigger('click')
    const ev = w.emitted('change')[0][0]
    expect(ev).toMatchObject({ id: 'news', index: 2, source: 'pointer' })
    expect(typeof ev.preventDefault).toBe('function')
    expect(w.emitted('update:modelValue')[0]).toEqual(['news'])
    expect(tab(w, 'general').attributes('aria-selected')).toBe('true')
    w.unmount()
  })
  it('clic en la activa no emite', async () => {
    const w = mk()
    await tab(w, 'general').trigger('click')
    expect(w.emitted('change')).toBeUndefined()
    w.unmount()
  })
  it('change cancelable: sin update:modelValue', async () => {
    const w = mk({ onChange: (e) => e.preventDefault() })
    await tab(w, 'news').trigger('click')
    expect(w.emitted('change')).toHaveLength(1)
    expect(w.emitted('update:modelValue')).toBeUndefined()
    w.unmount()
  })
  it('v-model controlado: la marca y el panel siguen al valor', async () => {
    const w = mk({ 'onUpdate:modelValue': (v) => w.setProps({ modelValue: v }) })
    await tab(w, 'news').trigger('click')
    await flush()
    expect(tab(w, 'news').attributes('aria-selected')).toBe('true')
    expect(w.find('#t-panel-news').attributes('hidden')).toBeUndefined()
    w.unmount()
  })
  it('un cambio de modelValue desde fuera no emite change ni mueve el foco', async () => {
    const w = mk()
    tab(w, 'general').element.focus()
    await w.setProps({ modelValue: 'msgs' })
    await flush()
    expect(w.emitted('change')).toBeUndefined()
    expect(activeEl()).toBe('t-tab-general')
    expect(tab(w, 'msgs').attributes('aria-selected')).toBe('true')
    w.unmount()
  })
  it('disabled (todo el componente) no emite', async () => {
    const w = mk({ disabled: true })
    await tab(w, 'news').trigger('click')
    expect(w.emitted('change')).toBeUndefined()
    w.unmount()
  })
})

describe('GTabs · teclado', () => {
  const controlled = (props = {}) => {
    const model = ref(props.modelValue ?? 'general')
    const w = mk({ ...props, modelValue: model.value, 'onUpdate:modelValue': (v) => { model.value = v; w.setProps({ modelValue: v }) } })
    return w
  }
  it('→ activa la siguiente y mueve el foco (auto); source keyboard', async () => {
    const w = controlled()
    tab(w, 'general').element.focus()
    await key(w, 'general', 'ArrowRight')
    expect(w.emitted('change')[0][0]).toMatchObject({ id: 'msgs', source: 'keyboard' })
    expect(activeEl()).toBe('t-tab-msgs')
    await flush()
    expect(tab(w, 'msgs').attributes('tabindex')).toBe('0')
    w.unmount()
  })
  it('← y vuelta circular; omite las deshabilitadas', async () => {
    const w = controlled()
    tab(w, 'general').element.focus()
    await key(w, 'general', 'ArrowLeft')
    expect(activeEl()).toBe('t-tab-rep') // permisos (última) está deshabilitada: se omite
    await flush()
    await key(w, 'rep', 'ArrowRight')
    expect(activeEl()).toBe('t-tab-general')
    w.unmount()
  })
  it('Home y End: primera y última habilitada', async () => {
    const w = controlled({ modelValue: 'news' })
    tab(w, 'news').element.focus()
    await key(w, 'news', 'End')
    expect(activeEl()).toBe('t-tab-rep')
    await flush()
    await key(w, 'rep', 'Home')
    expect(activeEl()).toBe('t-tab-general')
    w.unmount()
  })
  it('RTL: las flechas se invierten', async () => {
    const w = controlled({}) // sin dir
    w.unmount()
    const r = mk({}, { attrs: { dir: 'rtl' } })
    tab(r, 'general').element.focus()
    await key(r, 'general', 'ArrowLeft')
    expect(r.emitted('change')[0][0].id).toBe('msgs')
    await key(r, 'general', 'ArrowRight')
    expect(r.emitted('change')[1][0].id).toBe('rep')
    r.unmount()
  })
  it('vertical: ↓ y ↑ navegan; ← y → no se interceptan', async () => {
    const w = mk({ orientation: 'vertical', responsive: 'never' })
    tab(w, 'general').element.focus()
    const right = await key(w, 'general', 'ArrowRight')
    expect(w.emitted('change')).toBeUndefined()
    const down = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true })
    tab(w, 'general').element.dispatchEvent(down)
    expect(down.defaultPrevented).toBe(true)
    expect(w.emitted('change')[0][0].id).toBe('msgs')
    const cross = new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true })
    tab(w, 'general').element.dispatchEvent(cross)
    expect(cross.defaultPrevented).toBe(false)
    expect(right).toBeUndefined()
    w.unmount()
  })
  it('las flechas del eje contrario no se interceptan en horizontal', () => {
    const w = mk()
    tab(w, 'general').element.focus()
    const ev = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true })
    tab(w, 'general').element.dispatchEvent(ev)
    expect(ev.defaultPrevented).toBe(false)
    w.unmount()
  })
  it('manual: las flechas solo enfocan; Enter y Espacio activan', async () => {
    const w = mk({ activation: 'manual' })
    tab(w, 'general').element.focus()
    await key(w, 'general', 'ArrowRight')
    expect(w.emitted('change')).toBeUndefined()
    expect(activeEl()).toBe('t-tab-msgs')
    await key(w, 'msgs', 'Enter')
    expect(w.emitted('change')[0][0]).toMatchObject({ id: 'msgs', source: 'keyboard' })
    await key(w, 'msgs', ' ')
    expect(w.emitted('change')).toHaveLength(2)
    w.unmount()
  })
  it('Enter y Espacio evitan el clic sintético (preventDefault)', () => {
    const w = mk({ activation: 'manual' })
    const ev = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
    tab(w, 'msgs').element.dispatchEvent(ev)
    expect(ev.defaultPrevented).toBe(true)
    const up = new KeyboardEvent('keyup', { key: ' ', bubbles: true, cancelable: true })
    tab(w, 'msgs').element.dispatchEvent(up)
    expect(up.defaultPrevented).toBe(true)
    w.unmount()
  })
  it('change cancelado con el teclado: ni el valor ni el foco se mueven', async () => {
    const w = mk({ onChange: (e) => e.preventDefault() })
    tab(w, 'general').element.focus()
    await key(w, 'general', 'ArrowRight')
    expect(w.emitted('update:modelValue')).toBeUndefined()
    expect(activeEl()).toBe('t-tab-general')
    w.unmount()
  })
  it('Tab no se intercepta y Esc tampoco', () => {
    const w = mk()
    for (const k of ['Tab', 'Escape']) {
      const ev = new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true })
      tab(w, 'general').element.dispatchEvent(ev)
      expect(ev.defaultPrevented).toBe(false)
    }
    w.unmount()
  })
  it('con Ctrl, Meta o Alt no actúa', () => {
    const w = mk()
    tab(w, 'general').element.focus()
    const ev = new KeyboardEvent('keydown', { key: 'ArrowRight', ctrlKey: true, bubbles: true, cancelable: true })
    tab(w, 'general').element.dispatchEvent(ev)
    expect(ev.defaultPrevented).toBe(false)
    expect(w.emitted('change')).toBeUndefined()
    w.unmount()
  })
})

describe('GTabs · paneles', () => {
  it('montados y ocultos por defecto (conservan estado)', () => {
    const w = mk()
    expect(w.findAll('[role="tabpanel"]')).toHaveLength(6)
    expect(w.find('#t-panel-perm').text()).toContain('Contenido de Permisos')
    w.unmount()
  })
  it('slots panel-{id} y panel con item y active', () => {
    const w = mk({}, { slots: { 'panel-msgs': ({ active }) => `Bandeja ${active}`, panel: ({ item }) => `Genérico ${item.id}` } })
    expect(w.find('#t-panel-msgs').text()).toBe('Bandeja false')
    expect(w.find('#t-panel-general').text()).toBe('Genérico general')
    w.unmount()
  })
  it('panel con tabindex 0 si no contiene enfocables; sin él si los contiene', async () => {
    const w = mk({}, { slots: { 'panel-general': () => h('button', 'Guardar'), panel: () => 'texto' } })
    await flush()
    expect(w.find('#t-panel-general').attributes('tabindex')).toBeUndefined()
    await w.setProps({ modelValue: 'msgs' })
    await flush()
    expect(w.find('#t-panel-msgs').attributes('tabindex')).toBe('0')
    expect(w.find('#t-panel-general').attributes('tabindex')).toBeUndefined()
    w.unmount()
  })
  it('aria-busy en el panel visible si su pestaña está en loading', async () => {
    const w = mk({ modelValue: 'rep' })
    expect(w.find('#t-panel-rep').attributes('aria-busy')).toBe('true')
    expect(w.find('#t-panel-general').attributes('aria-busy')).toBeUndefined()
    await w.setProps({ modelValue: 'general' })
    expect(w.find('#t-panel-rep').attributes('aria-busy')).toBeUndefined()
    w.unmount()
  })
  it('lazy: monta al primer activarse y luego conserva; la no montada no se renderiza ni lleva aria-controls', async () => {
    const w = mk({ lazy: true })
    expect(w.findAll('[role="tabpanel"]')).toHaveLength(1)
    expect(tab(w, 'msgs').attributes('aria-controls')).toBeUndefined()
    expect(tab(w, 'general').attributes('aria-controls')).toBe('t-panel-general')
    await w.setProps({ modelValue: 'msgs' })
    expect(w.findAll('[role="tabpanel"]')).toHaveLength(2)
    await w.setProps({ modelValue: 'news' })
    expect(w.findAll('[role="tabpanel"]')).toHaveLength(3)
    expect(w.find('#t-panel-msgs').attributes('hidden')).toBeDefined()
    expect(tab(w, 'msgs').attributes('aria-controls')).toBe('t-panel-msgs')
    w.unmount()
  })
  it('detached: no renderiza paneles pero calcula aria-controls', () => {
    const w = mk({ detached: true })
    expect(w.find('.g-tabs__panels').exists()).toBe(false)
    expect(w.findAll('[role="tabpanel"]')).toHaveLength(0)
    expect(tab(w, 'msgs').attributes('aria-controls')).toBe('t-panel-msgs')
    w.unmount()
  })
})

describe('GTabPanel', () => {
  const Host = {
    components: { GTabs, GTabPanel },
    data: () => ({ v: 'a', items: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }] }),
    template: `<div><g-tabs id="h" v-model="v" :items="items" detached label="Demo" /><g-tab-panel tabs="h" value="a" :active="v === 'a'">uno</g-tab-panel><g-tab-panel tabs="h" value="b" :active="v === 'b'" lazy busy class="x" data-k="1"><button>dos</button></g-tab-panel></div>`
  }
  it('se enlaza por id con su pestaña y se muestra según `active`', async () => {
    const w = mount(Host, { attachTo: document.body })
    await flush()
    const pa = w.find('#h-panel-a')
    expect(pa.attributes('role')).toBe('tabpanel')
    expect(pa.attributes('aria-labelledby')).toBe('h-tab-a')
    expect(pa.classes()).toContain('g-tabs__panel')
    expect(pa.attributes('hidden')).toBeUndefined()
    expect(pa.attributes('tabindex')).toBe('0')
    expect(w.find('#h-panel-b').attributes('hidden')).toBeDefined()
    expect(w.find('#h-tab-a').attributes('aria-controls')).toBe('h-panel-a')
    w.unmount()
  })
  it('lazy: no monta su contenido hasta activarse; busy pone aria-busy; atributos al div; con enfocables sin tabindex', async () => {
    const w = mount(Host, { attachTo: document.body })
    await flush()
    const pb = () => w.find('#h-panel-b')
    expect(pb().find('button').exists()).toBe(false)
    expect(pb().classes()).toContain('x')
    expect(pb().attributes('data-k')).toBe('1')
    await w.find('#h-tab-b').trigger('click')
    await flush()
    expect(pb().find('button').exists()).toBe(true)
    expect(pb().attributes('aria-busy')).toBe('true')
    expect(pb().attributes('tabindex')).toBeUndefined()
    await w.find('#h-tab-a').trigger('click')
    await flush()
    expect(pb().find('button').exists()).toBe(true) // se conserva
    expect(pb().attributes('hidden')).toBeDefined()
    w.unmount()
  })
  it('avisos de desarrollo: sin tabs o value, y un GTabs que no existe', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mount(GTabPanel, { props: { tabs: '', value: '' }, attachTo: document.body })
    const z = mount(GTabPanel, { props: { tabs: 'no-existe', value: 'x' }, attachTo: document.body })
    const msgs = warn.mock.calls.map((c) => String(c[0]))
    expect(msgs.some((m) => m.includes('`tabs`'))).toBe(true)
    expect(msgs.some((m) => m.includes('`value`'))).toBe(true)
    expect(msgs.some((m) => m.includes('no-existe'))).toBe(true)
    w.unmount(); z.unmount()
  })
})

describe('GTabs · dirección del cambio (Personalidad T1/T2, #302)', () => {
  // v-model simulado: cada `update:modelValue` vuelve como prop
  const mkv = (props = {}, opts = {}) => {
    const w = mk({ 'onUpdate:modelValue': (v) => w.setProps({ modelValue: v }), ...props }, opts)
    return w
  }
  const dir = (w) => w.attributes('data-direction')

  it('ausente al montar y sin activa anterior', async () => {
    const w = mkv()
    await flush()
    expect(dir(w)).toBeUndefined()
    w.unmount()
  })
  it('clic: forward hacia una posterior y back hacia una anterior; se conserva hasta el siguiente cambio', async () => {
    const w = mkv()
    await flush()
    await tab(w, 'news').trigger('click')
    expect(dir(w)).toBe('forward')
    await flush()
    expect(dir(w)).toBe('forward') // se queda puesto
    await tab(w, 'msgs').trigger('click')
    expect(dir(w)).toBe('back')
    w.unmount()
  })
  it('se escribe en el mismo render que cambia la activa (antes de que el panel nuevo pierda hidden)', async () => {
    const w = mkv()
    await flush()
    const seen = []
    const panel = w.find('#t-panel-msgs').element
    const mo = new MutationObserver(() => {
      if (!panel.hasAttribute('hidden') && !seen.length) seen.push(w.element.getAttribute('data-direction'))
    })
    mo.observe(w.element, { attributes: true, subtree: true })
    await tab(w, 'msgs').trigger('click')
    await nextTick()
    mo.disconnect()
    expect(seen).toEqual(['forward'])
    w.unmount()
  })
  it('teclado: flechas, Home y End (activación automática)', async () => {
    const w = mkv()
    await flush()
    tab(w, 'general').element.focus()
    await key(w, 'general', 'ArrowRight')
    expect(tab(w, 'msgs').attributes('aria-selected')).toBe('true')
    expect(dir(w)).toBe('forward')
    await key(w, 'msgs', 'ArrowLeft')
    expect(dir(w)).toBe('back')
    await key(w, 'general', 'End')
    expect(tab(w, 'rep').attributes('aria-selected')).toBe('true')
    expect(dir(w)).toBe('forward')
    await key(w, 'rep', 'Home')
    expect(dir(w)).toBe('back')
    // Vuelta: de la primera hacia atrás llega a la última, que va después en el orden lógico
    await key(w, 'general', 'ArrowLeft')
    expect(tab(w, 'rep').attributes('aria-selected')).toBe('true')
    expect(dir(w)).toBe('forward')
    w.unmount()
  })
  it('teclado manual: mover el foco no cambia la dirección; Enter sí', async () => {
    const w = mkv({ activation: 'manual' })
    await flush()
    tab(w, 'general').element.focus()
    await key(w, 'general', 'ArrowRight')
    expect(dir(w)).toBeUndefined()
    await key(w, 'msgs', 'Enter')
    expect(dir(w)).toBe('forward')
    w.unmount()
  })
  it('RTL: el valor es lógico (ArrowLeft avanza → forward; ArrowRight retrocede → back)', async () => {
    const w = mkv({}, { attrs: { dir: 'rtl' } })
    await flush()
    tab(w, 'general').element.focus()
    await key(w, 'general', 'ArrowLeft')
    expect(tab(w, 'msgs').attributes('aria-selected')).toBe('true')
    expect(dir(w)).toBe('forward')
    await key(w, 'msgs', 'ArrowRight')
    expect(tab(w, 'general').attributes('aria-selected')).toBe('true')
    expect(dir(w)).toBe('back')
    w.unmount()
  })
  it('vertical: el mismo valor lógico con ArrowDown / ArrowUp', async () => {
    const w = mkv({ orientation: 'vertical', responsive: 'never' })
    await flush()
    tab(w, 'general').element.focus()
    await key(w, 'general', 'ArrowDown')
    expect(dir(w)).toBe('forward')
    await key(w, 'msgs', 'ArrowUp')
    expect(dir(w)).toBe('back')
    w.unmount()
  })
  it('modelValue externo: forward y back sin evento; hacia un valor desconocido se conserva, y desde él queda ausente', async () => {
    const w = mk()
    await flush()
    await w.setProps({ modelValue: 'rep' })
    expect(dir(w)).toBe('forward')
    await w.setProps({ modelValue: 'news' })
    expect(dir(w)).toBe('back')
    expect(w.emitted('change')).toBeUndefined()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await w.setProps({ modelValue: 'no-existe' })
    expect(dir(w)).toBe('back') // sin activa nueva no hay cambio que describir
    await w.setProps({ modelValue: 'msgs' })
    expect(dir(w)).toBeUndefined() // sin activa anterior
    warn.mockRestore()
    w.unmount()
  })
  it('change cancelado: ni valor ni dirección cambian', async () => {
    const w = mkv({ onChange: (e) => e.preventDefault() })
    await flush()
    await tab(w, 'news').trigger('click')
    expect(dir(w)).toBeUndefined()
    w.unmount()
  })
  it('--_mark-* siguen en la raíz con la misma convención', async () => {
    const w = mkv()
    await flush()
    await tab(w, 'news').trigger('click')
    const st = w.attributes('style')
    for (const v of ['--_mark-x', '--_mark-y', '--_mark-w', '--_mark-h']) expect(st).toContain(v)
    w.unmount()
  })
  describe('menú «Más»', () => {
    let restore
    beforeEach(() => { restore = stubLayout({ tabW: 100, headerW: 350 }) })
    afterEach(() => restore())
    it('elegir una oculta posterior da forward; luego una anterior, back', async () => {
      const w = mkv({ overflow: 'more' })
      await flush()
      const pick = async (label) => {
        await w.find('.g-tabs__more').trigger('click')
        await flush()
        ;[...document.querySelectorAll('[role="menuitemradio"]')].find((r) => r.textContent.includes(label)).click()
        await flush()
      }
      expect(tab(w, 'rep').exists()).toBe(false)
      await pick('Informe')
      expect(w.emitted('change').at(-1)[0]).toMatchObject({ id: 'rep', source: 'menu' })
      expect(dir(w)).toBe('forward')
      await new Promise((r) => setTimeout(r, 20))
      await flush()
      await pick('General')
      expect(dir(w)).toBe('back')
      w.unmount()
    })
  })
})

describe('GTabPanel · dirección copiada de su GTabs', () => {
  const Host = (order = 'tabs-first') => ({
    components: { GTabs, GTabPanel },
    data: () => ({ v: 'a', items: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }, { id: 'c', label: 'C' }] }),
    template: order === 'tabs-first'
      ? `<div><g-tabs id="h" v-model="v" :items="items" detached label="Demo" /><g-tab-panel v-for="i in items" :key="i.id" tabs="h" :value="i.id" :active="v === i.id">{{ i.label }}</g-tab-panel></div>`
      : `<div><g-tab-panel v-for="i in items" :key="i.id" tabs="h" :value="i.id" :active="v === i.id">{{ i.label }}</g-tab-panel><g-tabs id="h" v-model="v" :items="items" detached label="Demo" /></div>`
  })
  const pdir = (w, id) => w.find(`#h-panel-${id}`).attributes('data-direction')

  it.each(['tabs-first', 'panels-first'])('al activarse copia data-direction de #{tabs} (%s); ausente al montar', async (order) => {
    const w = mount(Host(order), { attachTo: document.body })
    await flush()
    expect(pdir(w, 'a')).toBeUndefined()
    await w.find('#h-tab-c').trigger('click')
    await flush()
    expect(w.find('#h').attributes('data-direction')).toBe('forward')
    expect(pdir(w, 'c')).toBe('forward')
    await w.find('#h-tab-b').trigger('click')
    await flush()
    expect(pdir(w, 'b')).toBe('back')
    w.unmount()
  })
  it.each(['tabs-first', 'panels-first'])('el panel visible ya tiene su dirección cuando GTabs mide la marca (%s)', async (order) => {
    const w = mount(Host(order), { attachTo: document.body })
    await flush()
    const panel = w.find('#h-panel-b').element
    // GTabs mide la marca en onUpdated (fuerza estilo y layout en un navegador): en ese momento el panel visible ya debe tener dirección
    const seen = []
    const real = Element.prototype.getBoundingClientRect
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function () {
      if (!panel.hidden) seen.push(panel.getAttribute('data-direction'))
      return real.call(this)
    })
    await w.find('#h-tab-b').trigger('click')
    await flush()
    expect(seen.length).toBeGreaterThan(0)
    expect(seen.every((d) => d === 'forward')).toBe(true)
    w.unmount()
  })
  it('teclado con RTL: forward lógico también en el panel', async () => {
    const w = mount(Host('tabs-first'), { attachTo: document.body, attrs: { dir: 'rtl' } })
    await flush()
    w.find('#h-tab-a').element.focus()
    await w.find('#h-tab-a').trigger('keydown', { key: 'ArrowLeft' })
    await flush()
    expect(w.find('#h-tab-b').attributes('aria-selected')).toBe('true')
    expect(pdir(w, 'b')).toBe('forward')
    w.unmount()
  })
  it('sin un GTabs con ese id, o sin dirección en él, no pone dirección', async () => {
    const w = mount(GTabPanel, { props: { tabs: 'no-existe', value: 'x', active: false }, attachTo: document.body })
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await w.setProps({ active: true })
    await flush()
    expect(w.attributes('data-direction')).toBeUndefined()
    warn.mockRestore()
    w.unmount()
  })
})

describe('GTabs · marca y listo', () => {
  it('variables --_mark-* en px y is-ready tras el primer posicionamiento', async () => {
    const w = mk()
    const style = w.attributes('style')
    for (const v of ['--_mark-x', '--_mark-y', '--_mark-w', '--_mark-h']) expect(style).toContain(`${v}:`)
    expect(style).toMatch(/--_mark-w: 0px/) // jsdom no hace layout: 0px, pero el formato es px
    expect(w.classes()).not.toContain('is-ready')
    await frames()
    expect(w.classes()).toContain('is-ready')
    w.unmount()
  })
  it('lee la caja de la activa con la convención del contrato (px, desplazamiento incluido; RTL desde la derecha)', async () => {
    const rect = (l, t, r, b) => ({ left: l, top: t, right: r, bottom: b, width: r - l, height: b - t })
    const spy = vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function () {
      if (this.matches('.g-tabs__scroller')) return rect(10, 20, 310, 60)
      if (this.matches('[aria-selected="true"]')) return rect(110, 20, 190, 60)
      return rect(0, 0, 0, 0)
    })
    const w = mk()
    await frames()
    expect(w.attributes('style')).toContain('--_mark-x: 100px')
    expect(w.attributes('style')).toContain('--_mark-w: 80px')
    expect(w.attributes('style')).toContain('--_mark-h: 40px')
    w.unmount()
    const r = mk({}, { attrs: { dir: 'rtl' } })
    await frames()
    expect(r.attributes('style')).toContain('--_mark-x: 120px') // 310 - 190
    r.unmount()
    spy.mockRestore()
  })
  it('sin activa, w y h valen 0px', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mk({ modelValue: 'zzz' })
    await frames()
    expect(w.attributes('style')).toContain('--_mark-w: 0px')
    expect(w.attributes('style')).toContain('--_mark-h: 0px')
    expect(warn).toHaveBeenCalled()
    w.unmount()
  })
  it('un cambio de apariencia no se anima: quita is-ready y lo recupera', async () => {
    const w = mk()
    await frames()
    expect(w.classes()).toContain('is-ready')
    await w.setProps({ appearance: 'pill' })
    await nextTick()
    expect(w.classes()).not.toContain('is-ready')
    await frames()
    expect(w.classes()).toContain('is-ready')
    w.unmount()
  })
})

describe('GTabs · desbordamiento', () => {
  it('scroll: sin botones; la rueda vertical se convierte en horizontal', () => {
    const w = mk()
    expect(w.find('.g-tabs__edge').exists()).toBe(false)
    const sc = w.find('.g-tabs__scroller').element
    Object.defineProperty(sc, 'scrollWidth', { configurable: true, value: 600 })
    Object.defineProperty(sc, 'clientWidth', { configurable: true, value: 200 })
    const ev = new WheelEvent('wheel', { deltaY: 40, bubbles: true, cancelable: true })
    sc.dispatchEvent(ev)
    expect(ev.defaultPrevented).toBe(true)
    expect(sc.scrollLeft).toBe(40)
    // en el tope no intercepta (la página sigue)
    sc.scrollLeft = 400
    const end = new WheelEvent('wheel', { deltaY: 40, bubbles: true, cancelable: true })
    sc.dispatchEvent(end)
    expect(end.defaultPrevented).toBe(false)
    // sin desbordamiento no intercepta
    Object.defineProperty(sc, 'scrollWidth', { configurable: true, value: 200 })
    const none = new WheelEvent('wheel', { deltaY: 40, bubbles: true, cancelable: true })
    sc.dispatchEvent(none)
    expect(none.defaultPrevented).toBe(false)
    w.unmount()
  })
  it('arrows: botones de borde aria-hidden, fuera del teclado y fuera del tablist; desplazan la lista', async () => {
    const w = mk({ overflow: 'arrows' })
    const edges = w.findAll('.g-tabs__edge')
    expect(edges).toHaveLength(2)
    for (const e of edges) {
      expect(e.attributes('aria-hidden')).toBe('true')
      expect(e.attributes('tabindex')).toBe('-1')
      expect(e.find('svg').exists()).toBe(true)
      expect(w.find('[role="tablist"]').element.contains(e.element)).toBe(false)
    }
    const sc = w.find('.g-tabs__scroller').element
    sc.scrollBy = vi.fn()
    Object.defineProperty(sc, 'clientWidth', { configurable: true, value: 300 })
    await w.find('.g-tabs__edge--next').trigger('click')
    expect(sc.scrollBy).toHaveBeenCalledWith(expect.objectContaining({ left: 180 }))
    await w.find('.g-tabs__edge--prev').trigger('click')
    expect(sc.scrollBy).toHaveBeenLastCalledWith(expect.objectContaining({ left: -180 }))
    w.unmount()
  })
  it('arrows en RTL invierten el sentido físico', async () => {
    const w = mk({ overflow: 'arrows' }, { attrs: { dir: 'rtl' } })
    const sc = w.find('.g-tabs__scroller').element
    sc.scrollBy = vi.fn()
    Object.defineProperty(sc, 'clientWidth', { configurable: true, value: 300 })
    await w.find('.g-tabs__edge--next').trigger('click')
    expect(sc.scrollBy).toHaveBeenCalledWith(expect.objectContaining({ left: -180 }))
    w.unmount()
  })
  it('segmented ignora arrows y more: degrada a scroll sin botones', () => {
    const w = mk({ appearance: 'segmented', overflow: 'arrows' })
    expect(w.find('.g-tabs__edge').exists()).toBe(false)
    expect(w.classes()).toContain('g-tabs--overflow-scroll')
    w.unmount()
  })
  it('segmented con más de 6 opciones avisa', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const many = Array.from({ length: 7 }, (_, i) => ({ id: `i${i}`, label: `Op ${i}` }))
    const w = mk({ appearance: 'segmented', items: many, modelValue: 'i0' })
    expect(warn.mock.calls.some((c) => String(c[0]).includes('2 a 6'))).toBe(true)
    w.unmount()
  })
  it('more sin labels.more cae a scroll y avisa; no hay botón', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mk({ overflow: 'more', labels: {} })
    expect(w.classes()).toContain('g-tabs--overflow-scroll')
    expect(w.find('.g-tabs__more').exists()).toBe(false)
    expect(warn.mock.calls.some((c) => String(c[0]).includes('labels.more'))).toBe(true)
    w.unmount()
  })
  it('more con todo cabiendo: sin botón «Más»', async () => {
    const restore = stubLayout({ tabW: 50, headerW: 600 })
    const w = mk({ overflow: 'more' })
    await flush()
    expect(w.find('.g-tabs__more').exists()).toBe(false)
    expect(tabs(w)).toHaveLength(6)
    expect(tab(w, 'general').attributes('aria-setsize')).toBeUndefined()
    w.unmount(); restore()
  })
  describe('more con falta de espacio', () => {
    let restore
    beforeEach(() => { restore = stubLayout({ tabW: 100, headerW: 350 }) })
    afterEach(() => restore())
    it('saca las que no caben del tablist, mantiene la activa, y pone aria-setsize/posinset', async () => {
      const w = mk({ overflow: 'more', modelValue: 'rep' })
      await flush()
      const ids = tabs(w).map((t) => t.attributes('id'))
      expect(ids).toContain('t-tab-rep') // la activa siempre entra
      expect(ids.length).toBeLessThan(6)
      expect(ids.length).toBeGreaterThan(0)
      expect(w.find('.g-tabs__more').exists()).toBe(true)
      const set = tabs(w)
      expect(set.every((t) => t.attributes('aria-setsize') === '6')).toBe(true)
      expect(tab(w, 'rep').attributes('aria-posinset')).toBe('5')
      expect(w.classes()).toContain('g-tabs--overflow-more')
      w.unmount()
    })
    it('el botón «Más» está fuera del tablist, con nombre, aria-haspopup y aria-expanded', async () => {
      const w = mk({ overflow: 'more' })
      await flush()
      const more = w.find('.g-tabs__more')
      expect(more.attributes('aria-label')).toContain('Más pestañas')
      expect(more.attributes('aria-haspopup')).toBe('menu')
      expect(more.attributes('aria-expanded')).toBe('false')
      expect(w.find('[role="tablist"]').element.contains(more.element)).toBe(false)
      w.unmount()
    })
    it('el menú lista todas las pestañas como radio, con la activa marcada; la señal de estado oculta sale en el botón', async () => {
      const w = mk({ overflow: 'more', modelValue: 'general' })
      await flush()
      await w.find('.g-tabs__more').trigger('click')
      await flush()
      const radios = [...document.querySelectorAll('[role="menuitemradio"]')]
      expect(radios).toHaveLength(6)
      expect(radios[0].getAttribute('aria-checked')).toBe('true')
      expect(radios.filter((r) => r.getAttribute('aria-checked') === 'true')).toHaveLength(1)
      expect(radios[5].getAttribute('aria-disabled')).toBe('true')
      expect(w.find('.g-tabs__more .g-tabs__status').exists()).toBe(true)
      expect(w.find('.g-tabs__more').attributes('aria-label')).toContain('requiere atención')
      w.unmount()
    })
    it('elegir en el menú emite change source "menu", la activa entra en la barra y recibe el foco', async () => {
      const w = mk({ overflow: 'more', modelValue: 'general', 'onUpdate:modelValue': (v) => w.setProps({ modelValue: v }) })
      await flush()
      expect(tab(w, 'rep').exists()).toBe(false)
      await w.find('.g-tabs__more').trigger('click')
      await flush()
      const item = [...document.querySelectorAll('[role="menuitemradio"]')].find((r) => r.textContent.includes('Informe'))
      item.click()
      await flush()
      expect(w.emitted('change')[0][0]).toMatchObject({ id: 'rep', source: 'menu' })
      await new Promise((r) => setTimeout(r, 20))
      await flush()
      expect(tab(w, 'rep').exists()).toBe(true)
      expect(activeEl()).toBe('t-tab-rep')
      w.unmount()
    })
    it('change cancelado desde el menú: no cambia nada', async () => {
      const w = mk({ overflow: 'more', onChange: (e) => e.preventDefault() })
      await flush()
      await w.find('.g-tabs__more').trigger('click')
      await flush()
      ;[...document.querySelectorAll('[role="menuitemradio"]')].find((r) => r.textContent.includes('Informe')).click()
      await flush()
      expect(w.emitted('update:modelValue')).toBeUndefined()
      expect(tab(w, 'rep').exists()).toBe(false)
      w.unmount()
    })
    it('un modelValue externo hacia una oculta la mete en la barra', async () => {
      const w = mk({ overflow: 'more', modelValue: 'general' })
      await flush()
      expect(tab(w, 'rep').exists()).toBe(false)
      await w.setProps({ modelValue: 'rep' })
      await flush()
      expect(tab(w, 'rep').exists()).toBe(true)
      w.unmount()
    })
    it('el teclado recorre solo las pestañas dibujadas', async () => {
      const w = mk({ overflow: 'more', modelValue: 'general', 'onUpdate:modelValue': (v) => w.setProps({ modelValue: v }) })
      await flush()
      const n = tabs(w).length
      tab(w, 'general').element.focus()
      for (let i = 0; i < n; i++) { await key(w, activeEl().replace('t-tab-', ''), 'ArrowRight'); await flush() }
      expect(activeEl()).toBe('t-tab-general')
      w.unmount()
    })
  })
})

describe('GTabs · labelMode auto y responsive', () => {
  it('auto: si todas tienen icono y no caben, las inactivas pasan a solo icono y la activa conserva la etiqueta', async () => {
    const restore = stubLayout({ tabW: 100, headerW: 250 })
    const list = [{ id: 'a', label: 'Uno', icon: 'x' }, { id: 'b', label: 'Dos', icon: 'y' }, { id: 'c', label: 'Tres', icon: 'z' }]
    const w = mk({ items: list, modelValue: 'b', labelMode: 'auto' }, { slots: { icon: () => 'i' } })
    await flush()
    expect(w.classes()).toContain('g-tabs--icon-only')
    expect(tab(w, 'a').classes()).toContain('is-icon-only')
    expect(tab(w, 'b').classes()).not.toContain('is-icon-only')
    expect(tab(w, 'a').find('.g-tabs__label').text()).toBe('Uno')
    w.unmount(); restore()
  })
  it('auto: si caben, todas conservan la etiqueta', async () => {
    const restore = stubLayout({ tabW: 50, headerW: 500 })
    const list = [{ id: 'a', label: 'Uno', icon: 'x' }, { id: 'b', label: 'Dos', icon: 'y' }]
    const w = mk({ items: list, modelValue: 'a', labelMode: 'auto' }, { slots: { icon: () => 'i' } })
    await flush()
    expect(w.classes()).not.toContain('g-tabs--icon-only')
    w.unmount(); restore()
  })
  it('responsive auto: vertical pasa a horizontal si el contenedor es menor que space × 120; never lo mantiene', async () => {
    const restore = stubLayout({ headerW: 300, rootW: 300 })
    const w = mk({ orientation: 'vertical' })
    await flush()
    expect(w.classes()).toContain('g-tabs--orientation-horizontal')
    expect(w.find('[role="tablist"]').attributes('aria-orientation')).toBe('horizontal')
    w.unmount()
    const n = mk({ orientation: 'vertical', responsive: 'never' })
    await flush()
    expect(n.classes()).toContain('g-tabs--orientation-vertical')
    n.unmount()
    restore()
  })
  it('responsive auto: con contenedor ancho se mantiene vertical', async () => {
    const restore = stubLayout({ headerW: 800, rootW: 800 })
    const w = mk({ orientation: 'vertical' })
    await flush()
    expect(w.classes()).toContain('g-tabs--orientation-vertical')
    w.unmount(); restore()
  })
})

describe('GTabs · anuncios (loading / loaded)', () => {
  it('la región role="status" existe desde el montaje y anuncia inicio y fin', async () => {
    const w = mk({ items: [{ id: 'a', label: 'Informe' }, { id: 'b', label: 'B' }] })
    const live = w.find('.g-tabs__live')
    expect(live.text()).toBe('')
    await w.setProps({ items: [{ id: 'a', label: 'Informe', status: 'loading', statusLabel: 'cargando' }, { id: 'b', label: 'B' }] })
    await flush()
    expect(live.text()).toBe('Informe: cargando')
    await w.setProps({ items: [{ id: 'a', label: 'Informe' }, { id: 'b', label: 'B' }] })
    await flush()
    expect(live.text()).toBe('Informe: listo')
    w.unmount()
  })
  it('no anuncia el estado inicial', async () => {
    const w = mk()
    await flush()
    expect(w.find('.g-tabs__live').text()).toBe('')
    w.unmount()
  })
  it('sin labels.loading no se anuncia el inicio y avisa una sola vez', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mk({ labels: {}, items: [{ id: 'a', label: 'Informe' }] })
    await w.setProps({ items: [{ id: 'a', label: 'Informe', status: 'loading', statusLabel: 'x' }] })
    await w.setProps({ items: [{ id: 'a', label: 'Informe', status: 'loading', statusLabel: 'y' }] })
    await flush()
    expect(w.find('.g-tabs__live').text()).toBe('')
    expect(warn.mock.calls.filter((c) => String(c[0]).includes('labels.loading'))).toHaveLength(1)
    w.unmount()
  })
})

describe('GTabs · avisos de desarrollo', () => {
  const warns = (spy) => spy.mock.calls.map((c) => String(c[0]))
  it('sin label ni labelledby', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mk({ label: undefined }).unmount()
    expect(warns(spy).some((m) => m.includes('`label` o `labelledby`'))).toBe(true)
  })
  it('ítem sin id: se ignora y avisa una vez', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mk({ items: [{ label: 'x' }, { label: 'y' }, { id: 'a', label: 'A' }], modelValue: 'a' })
    expect(tabs(w)).toHaveLength(1)
    expect(warns(spy).filter((m) => m.includes('sin `id`'))).toHaveLength(1)
    w.unmount()
  })
  it('ids duplicados: conserva el primero', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mk({ items: [{ id: 'a', label: 'A' }, { id: 'a', label: 'A2' }], modelValue: 'a' })
    expect(tabs(w)).toHaveLength(1)
    expect(warns(spy).some((m) => m.includes('repetida'))).toBe(true)
    w.unmount()
  })
  it('count sin countLabel, status sin statusLabel', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mk({ items: [{ id: 'a', label: 'A', count: 2 }, { id: 'b', label: 'B', status: 'loading' }], modelValue: 'a' }).unmount()
    expect(warns(spy).some((m) => m.includes('countLabel'))).toBe(true)
    expect(warns(spy).some((m) => m.includes('statusLabel'))).toBe(true)
  })
  it('labelMode sin icon', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mk({ labelMode: 'icon', items: [{ id: 'a', label: 'A' }] }).unmount()
    expect(warns(spy).some((m) => m.includes('labelMode'))).toBe(true)
  })
  it('más de una información secundaria', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mk({ items: [{ id: 'a', label: 'A', badge: 'Nuevo', count: 2, countLabel: 'dos' }], modelValue: 'a' }).unmount()
    expect(warns(spy).some((m) => m.includes('más de una'))).toBe(true)
  })
  it('closable reservado', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mk({ items: [{ id: 'a', label: 'A', closable: true }], modelValue: 'a' })
    expect(tabs(w)).toHaveLength(1)
    expect(warns(spy).some((m) => m.includes('closable'))).toBe(true)
    w.unmount()
  })
  it('un GTabs dentro de otro avisa', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const Inner = { render: () => h(GTabs, { items: [{ id: 'z', label: 'Z' }], label: 'Interno' }) }
    const w = mk({}, { slots: { panel: () => h(Inner) } })
    expect(warns(spy).some((m) => m.includes('anida'))).toBe(true)
    w.unmount()
  })
  it('los avisos solo se emiten una vez por causa', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mk({ label: undefined })
    w.setProps({ density: 'compact' })
    mk({ label: undefined }).unmount()
    expect(warns(spy).filter((m) => m.includes('`label` o `labelledby`')).length).toBe(2) // uno por instancia
    w.unmount()
  })
  it('en producción no avisa', async () => {
    const prev = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'
    vi.resetModules()
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { default: Prod } = await import('./GTabs.vue?prod')
    mount(Prod, { props: { items: [{ label: 'x' }] } }).unmount()
    expect(spy).not.toHaveBeenCalled()
    process.env.NODE_ENV = prev
  })
})
