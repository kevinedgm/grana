import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick } from 'vue'
import {
  GAdaptiveLayout, GBtn, GCard, GCheckbox, GCheckboxGroup, GDatePicker, GDialog, GFieldGroup, GForm, GFormActions, GFormLayout,
  GFormReveal, GFormRow, GFormSection, GInput, GInputGroup, GMenu, GNumberField, GRadioGroup, GSelect, GSidebar, GSplit, GStack,
  GStepper, GSurface, GSwitch, GTable, GTabs, GTextarea, GToaster, GWidget, GWidgetConfig, GWidgetGallery, GWidgetGrid,
  createToaster, useFormField
} from './index.js'
import GSlider from './components/GSlider/GSlider.vue'
import GTimeField from './components/GTimeField/GTimeField.vue'
import GFormFold from './components/GFormFold/GFormFold.vue'

// Densidad por región (density.md §3 a §5, #975 a #977): la prop es la región del componente. Con valor explícito, la
// raíz que pinta lleva data-g-density y la clase g-<tag>--density-{d} en el MISMO elemento (lo que P2 reconoce, #978);
// sin prop, ninguna de las dos en todo el marcado del componente.
beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', '') }
  HTMLDialogElement.prototype.close = function () { if (this.hasAttribute('open')) { this.removeAttribute('open'); this.dispatchEvent(new Event('close')) } }
  HTMLElement.prototype.showPopover = function () { this.setAttribute('data-popover-open', '') }
  HTMLElement.prototype.hidePopover = function () { this.removeAttribute('data-popover-open') }
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})
afterEach(() => { vi.restoreAllMocks(); document.body.innerHTML = '' })

const OPTS = [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }]
const T = (text) => () => text
// [nombre, componente, props mínimas, slots, selector del elemento que pinta (por defecto la raíz)]
const CASES = [
  ['GBtn', GBtn, {}, { default: T('Guardar') }, 'button.g-btn'],
  ['GCard', GCard, { title: 'Ingresos' }],
  ['GCheckbox', GCheckbox, { label: 'Acepto' }],
  ['GCheckboxGroup', GCheckboxGroup, { label: 'Alergias', modelValue: [] }, { default: () => [h(GCheckbox, { value: 'a', label: 'A' })] }],
  ['GDialog', GDialog, { modelValue: true, title: 'Editar', closeLabel: 'Cerrar' }, { default: T('x') }, 'dialog'],
  ['GForm', GForm, {}, { default: T('x') }],
  ['GMenu', GMenu, { modelValue: true, label: 'Acciones', items: [{ id: 'a', label: 'A' }] }, { trigger: ({ attrs }) => h('button', attrs, 'Abrir') }, 'ul.g-menu__list'],
  ['GSidebar', GSidebar, { label: 'Principal', modelValue: 'a', items: [{ label: 'G', items: [{ id: 'a', label: 'Inicio', href: '#a' }] }] }, {}, '.g-sidebar'],
  ['GSplit', GSplit, {}, { start: T('A'), end: T('B') }],
  ['GStack', GStack, {}, { default: T('A') }],
  ['GStepper', GStepper, { steps: [{ id: 'a', label: 'Uno' }, { id: 'b', label: 'Dos' }], modelValue: 'a' }],
  ['GSurface', GSurface, {}, { default: T('A') }],
  ['GTable', GTable, { columns: [{ key: 'n', label: 'Nombre' }], rows: [{ id: 1, n: 'Ana' }], caption: 'Clientes', rowKey: 'id' }],
  ['GTabs', GTabs, { items: [{ id: 'a', label: 'Uno' }, { id: 'b', label: 'Dos' }], modelValue: 'a', label: 'Vistas' }],
  ['GWidget', GWidget, { title: 'Ingresos' }],
  ['GWidgetConfig', GWidgetConfig, { modelValue: true, title: 'Configurar', tabs: [{ id: 'a', label: 'Datos' }], labels: { close: 'Cerrar', apply: 'Aplicar', cancel: 'Cancelar' } }, {}, 'dialog'],
  ['GWidgetGallery', GWidgetGallery, { modelValue: true, title: 'Añadir', items: [], labels: { close: 'Cerrar', search: 'Buscar', results: '{count}', list: 'Lista' } }, {}, 'dialog'],
  ['GWidgetGrid', GWidgetGrid, { modelValue: [], label: 'Panel', labels: { empty: 'Vacío' } }],
  ['GInput', GInput, { label: 'Nombre' }],
  ['GTextarea', GTextarea, { label: 'Notas' }],
  ['GSelect', GSelect, { label: 'Tipo', options: OPTS }],
  ['GDatePicker', GDatePicker, { label: 'Fecha' }],
  ['GRadioGroup', GRadioGroup, { label: 'Vista', options: OPTS, name: 'v' }],
  ['GSwitch', GSwitch, { label: 'Activo' }],
  ['GSlider', GSlider, { label: 'Dolor', modelValue: 1, max: 10, locale: 'es' }],
  ['GNumberField', GNumberField, { label: 'Cantidad', modelValue: 1, locale: 'es' }, {}, '.g-input'],
  ['GTimeField', GTimeField, { label: 'Hora', locale: 'es' }, {}, '.g-input'],
  ['GFormLayout', GFormLayout, {}, { default: T('x') }],
  ['GFormRow', GFormRow, {}, { default: () => [h(GInput, { label: 'A' })] }],
  ['GFieldGroup', GFieldGroup, { label: 'Fecha' }, { default: () => [h(GInput, { label: 'A' })] }],
  ['GInputGroup', GInputGroup, { label: 'Precio' }, { default: () => [h(GInput, { label: 'A' })] }],
  ['GFormActions', GFormActions, {}, { default: () => [h(GBtn, { type: 'submit' }, () => 'Guardar')] }],
  ['GAdaptiveLayout', GAdaptiveLayout, {}, { default: () => [h('div', 'x')] }]
]
const at = (w, sel) => (sel ? document.querySelector(sel) || w.element : w.element)
const markup = (w) => (w.element.outerHTML || '') + [...document.querySelectorAll('dialog, [popover]')].map((n) => n.outerHTML).join('')
const densityClasses = (el) => [...el.classList].filter((c) => c.includes('--density-'))

describe('Densidad por región · emisión (#975)', () => {
  for (const [name, comp, props, slots = {}, sel] of CASES) {
    it(`${name}: sin prop no lleva ni clase --density-* ni data-g-density`, async () => {
      const w = mount(comp, { props, slots, attachTo: document.body })
      await nextTick()
      const html = markup(w)
      expect(html, name).not.toMatch(/--density-/)
      expect(html, name).not.toMatch(/data-g-density/)
      w.unmount()
    })
    for (const d of ['default', 'compact']) {
      it(`${name}: con density="${d}" la raíz que pinta lleva el atributo y la clase en el mismo elemento`, async () => {
        const w = mount(comp, { props: { ...props, density: d }, slots, attachTo: document.body })
        await nextTick()
        const el = at(w, sel)
        expect(el.getAttribute('data-g-density'), name).toBe(d)
        expect(densityClasses(el).some((c) => c.endsWith(`--density-${d}`)), `${name}: ${el.className}`).toBe(true)
        w.unmount()
      })
    }
  }

  // Componentes cuya raíz recibe los atributos de la aplicación: la prop gana a su data-g-density; sin prop, se respeta
  const ROOT_ATTRS = ['GBtn', 'GCard', 'GForm', 'GDialog', 'GSidebar', 'GSplit', 'GStack', 'GStepper', 'GSurface', 'GTable', 'GTabs', 'GWidget', 'GWidgetGrid', 'GFormLayout', 'GFormRow', 'GFieldGroup', 'GInputGroup', 'GFormActions', 'GAdaptiveLayout', 'GRadioGroup', 'GCheckboxGroup', 'GSlider']
  for (const name of ROOT_ATTRS) {
    const [, comp, props, slots = {}, sel] = CASES.find((c) => c[0] === name)
    it(`${name}: la prop gana al data-g-density de la aplicación; sin prop, el de la aplicación se queda`, async () => {
      const a = mount(comp, { props: { ...props, density: 'compact' }, attrs: { 'data-g-density': 'comfortable', class: 'mia' }, slots, attachTo: document.body })
      await nextTick()
      expect(at(a, sel).getAttribute('data-g-density'), name).toBe('compact')
      a.unmount()
      const b = mount(comp, { props, attrs: { 'data-g-density': 'comfortable' }, slots, attachTo: document.body })
      await nextTick()
      expect(at(b, sel).getAttribute('data-g-density'), name).toBe('comfortable')
      expect(densityClasses(at(b, sel)), name).toEqual([])
      b.unmount()
    })
  }

  it('los compuestos pasan density ?? undefined: sin prop, sus partes no se vuelven explícitas', async () => {
    const w = mount(defineComponent({
      setup: () => () => [
        h(GNumberField, { label: 'N', modelValue: 1, locale: 'es' }),
        h(GCheckboxGroup, { label: 'G', modelValue: [], options: OPTS }),
        h(GFieldGroup, { label: 'F' }, { default: () => [h(GInput, { label: 'A' })] }),
        h(GInput, { label: 'Con acción' }, { action: ({ density }) => h(GBtn, { density }, () => 'Ir') }),
        h(GCard, { title: 'T', menu: [{ id: 'a', label: 'A' }], labels: { menu: 'Acciones' } })
      ]
    }), { attachTo: document.body })
    await nextTick()
    expect(document.body.innerHTML).not.toMatch(/--density-|data-g-density/)
    w.unmount()
  })

  it('el slot action de GInput recibe la prop tal cual (undefined sin prop)', () => {
    const seen = []
    mount(GInput, { props: { label: 'A' }, slots: { action: ({ density }) => { seen.push(density); return null } } })
    mount(GInput, { props: { label: 'A', density: 'compact' }, slots: { action: ({ density }) => { seen.push(density); return null } } })
    expect(seen).toEqual([undefined, 'compact'])
  })
})

describe('Formularios (#976)', () => {
  // Un campo propio con useFormField(): su density no cambia de forma ni de valor y no ve la región
  const seen = []
  const Probe = defineComponent({
    props: { density: { type: String, default: undefined } },
    setup (props) {
      const ff = useFormField({ density: () => props.density })
      seen.push(ff.density)
      return () => h('i')
    }
  })
  const run = (tpl) => {
    seen.length = 0
    mount({ components: { GForm, GFormLayout, GFormRow, GFormReveal, GFormSection, GFormFold, GFieldGroup, GInputGroup, Probe }, template: tpl }, { attachTo: document.body })
    return seen.map((r) => r.value)
  }

  it('useFormField().density resuelve igual que antes: prop › sub‑contexto › GForm › default', () => {
    expect(run('<Probe />')).toEqual(['default'])
    expect(run('<GForm><Probe /></GForm>')).toEqual(['default'])
    expect(run('<GForm density="compact"><Probe /></GForm>')).toEqual(['compact'])
    expect(run('<GForm density="compact"><GFormLayout density="comfortable"><Probe /><GFormRow><Probe /></GFormRow></GFormLayout></GForm>')).toEqual(['comfortable', 'comfortable'])
    expect(run('<GForm density="compact"><GFormLayout><GFormReveal :when="true"><Probe /></GFormReveal></GFormLayout></GForm>')).toEqual(['compact'])
    expect(run('<GForm density="compact"><Probe density="default" /></GForm>')).toEqual(['default'])
    expect(run('<GForm density="compact"><GFieldGroup label="F"><Probe /></GFieldGroup></GForm>')).toEqual(['compact'])
    // No ve la región de la aplicación
    expect(run('<section data-g-density="compact"><GForm><Probe /></GForm></section>')).toEqual(['default'])
  })

  it('GFormReveal y GFormFold no emiten clase de densidad; GForm sin prop no impone nada', () => {
    const w = mount({ components: { GForm, GFormLayout, GFormReveal, GFormFold, GInput }, template: '<GForm density="compact"><GFormLayout><GFormReveal :when="true"><GInput label="A" /></GFormReveal></GFormLayout></GForm>' }, { attachTo: document.body })
    expect(w.find('.g-form-reveal').classes().some((c) => c.includes('--density-'))).toBe(false)
    const v = mount(GForm, { slots: { default: () => 'x' } })
    expect(v.find('form').attributes('data-g-density')).toBeUndefined()
    expect(v.find('form').classes().some((c) => c.includes('--density-'))).toBe(false)
  })
})

describe('Superficies de página fijas en default (#977)', () => {
  it('GToaster lleva data-g-density="default" fijo, sin clase, aunque la aplicación pase otro', async () => {
    const toaster = createToaster()
    const w = mount(GToaster, { global: { plugins: [toaster] }, attrs: { 'data-g-density': 'compact' }, attachTo: document.body })
    toaster.show({ message: 'Hola' })
    await nextTick(); await nextTick()
    const root = document.querySelector('.g-toaster')
    expect(root?.getAttribute('data-g-density')).toBe('default')
    expect(densityClasses(root)).toEqual([])
    w.unmount()
  })
})

describe('GCard · meta de prioridad baja (#980)', () => {
  const META = [{ label: 'Alta', value: '1' }, { label: 'Baja', value: '2', priority: 'low' }]
  const labels = (w) => w.findAll('.g-card__meta dt, .g-card__meta-label').map((n) => n.text())
  // jsdom no hereda propiedades personalizadas: se simula el --g-density calculado de la tarjeta
  const stubDensity = (v) => {
    const real = window.getComputedStyle
    vi.spyOn(window, 'getComputedStyle').mockImplementation((el, p) => {
      const cs = real(el, p)
      if (!el?.classList?.contains('g-card')) return cs
      return new Proxy(cs, { get: (t, k) => (k === 'getPropertyValue' ? (n) => (n === '--g-density' ? v.value : t.getPropertyValue(n)) : Reflect.get(t, k)) })
    })
  }
  const text = (w) => w.text()

  it('con la prop compact se oculta desde el primer render (también en el servidor)', () => {
    const w = mount(GCard, { props: { title: 'T', meta: META, density: 'compact' } })
    expect(text(w)).toContain('Alta')
    expect(text(w)).not.toContain('Baja')
  })

  it('sin prop sigue la densidad leída al montar y en cada cambio de data-g-density', async () => {
    const v = { value: '0.75' }
    stubDensity(v)
    const frames = []
    vi.stubGlobal('requestAnimationFrame', (f) => { frames.push(f); return frames.length })
    const host = document.createElement('section')
    host.setAttribute('data-g-density', 'compact')
    document.body.append(host)
    const w = mount(GCard, { props: { title: 'T', meta: META }, attachTo: host })
    await nextTick()
    expect(text(w)).not.toContain('Baja')
    v.value = '1'
    host.setAttribute('data-g-density', 'default')
    await Promise.resolve()
    frames.splice(0).forEach((f) => f())
    await nextTick()
    expect(text(w)).toContain('Baja')
    w.unmount()
    vi.unstubAllGlobals()
  })
})
