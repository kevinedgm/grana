import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import GCheckbox from '../components/GCheckbox/GCheckbox.vue'
import GCheckboxGroup from '../components/GCheckboxGroup/GCheckboxGroup.vue'
import GInput from '../components/GInput/GInput.vue'
import GTextarea from '../components/GTextarea/GTextarea.vue'
import GSwitch from '../components/GSwitch/GSwitch.vue'
import GSelect from '../components/GSelect/GSelect.vue'

// Marcas de los componentes de formulario: todas son iconos de Lucide decorativos (docs/contract/icons.md §4)
const TRIANGLE_ALERT = 'm21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3'
const hidden = (w) => expect(w.attributes('aria-hidden')).toBe('true')

describe('GCheckbox · marcas de Lucide', () => {
  it('el cuadro lleva el input y las marcas check y minus (decorativas) dentro de g-checkbox__box', () => {
    const w = mount(GCheckbox, { props: { label: 'x' } })
    const box = w.find('.g-checkbox__box')
    expect(box.element.firstElementChild.tagName).toBe('INPUT')
    const check = box.find('svg.g-checkbox__check')
    const dash = box.find('svg.g-checkbox__dash')
    hidden(check); hidden(dash)
    expect(check.html()).toContain('M20 6 9 17l-5-5')
    expect(dash.html()).toContain('M5 12h14')
  })

  it('el chip lleva su check dentro de la etiqueta (no dibujado con CSS)', () => {
    const w = mount(GCheckbox, { props: { label: 'Wifi', layout: 'chip' } })
    const mark = w.find('.g-checkbox__label svg.g-checkbox__chip-mark')
    expect(mark.exists()).toBe(true)
    hidden(mark)
    expect(mount(GCheckbox, { props: { label: 'x' } }).find('.g-checkbox__chip-mark').exists()).toBe(false)
  })
})

describe('mensajes de error · triangle-alert de Lucide', () => {
  const cases = [
    ['GCheckbox', GCheckbox, { label: 'x', error: 'Mal', invalid: true }, 'g-checkbox__error-icon'],
    ['GCheckboxGroup', GCheckboxGroup, { label: 'x', error: 'Mal', invalid: true }, 'g-checkbox-group__error-icon'],
    ['GInput', GInput, { label: 'x', error: 'Mal' }, 'g-input__error-icon'],
    ['GTextarea', GTextarea, { label: 'x', error: 'Mal' }, 'g-textarea__error-icon'],
    ['GSwitch', GSwitch, { label: 'x', error: 'Mal' }, 'g-switch__error-icon'],
    ['GSelect', GSelect, { label: 'x', options: [{ value: 1, label: 'a' }], error: 'Mal' }, 'g-select__error-icon']
  ]
  for (const [name, comp, props, cls] of cases) {
    it(`${name}: con error, el icono va antes del texto y es decorativo; sin error no hay icono`, () => {
      const w = mount(comp, { props })
      const icon = w.find(`svg.${cls}`)
      expect(icon.exists(), name).toBe(true)
      hidden(icon)
      expect(icon.html()).toContain(TRIANGLE_ALERT)
      const err = icon.element.parentElement
      expect(err.textContent.trim()).toBe('Mal')
      expect(err.firstElementChild).toBe(icon.element)
      const ok = mount(comp, { props: { ...props, error: undefined, invalid: false } })
      expect(ok.find(`svg.${cls}`).exists(), name).toBe(false)
    })
  }
})

describe('indicadores de carga · loader-circle de Lucide', () => {
  it('GInput y GTextarea dibujan el loader-circle (decorativo) al cargar', () => {
    for (const [comp, cls] of [[GInput, 'g-input__loader'], [GTextarea, 'g-textarea__loader']]) {
      const svg = mount(comp, { props: { label: 'x', loading: true } }).find(`svg.${cls}`)
      expect(svg.exists(), cls).toBe(true)
      hidden(svg)
    }
  })
})

describe('GDatePicker y GCalendar · iconos de Lucide', () => {
  it('GDatePicker: calendar en el campo, chevrons de navegación, x de la hoja, punto de hoy y error', async () => {
    const { default: GDatePicker } = await import('../components/GDatePicker/GDatePicker.vue')
    const w = mount(GDatePicker, { attachTo: document.body, props: { label: 'Fecha', inline: true, modelValue: null, error: 'Mal', invalid: true, labels: { prev: 'Mes anterior', next: 'Mes siguiente' } } })
    expect(w.find('.g-datepicker__nav--prev svg').html()).toContain('m15 18-6-6 6-6')
    expect(w.find('.g-datepicker__nav--next svg').html()).toContain('m9 18 6-6-6-6')
    w.unmount()
    const f = mount(GDatePicker, { attachTo: document.body, props: { label: 'Fecha', modelValue: null, error: 'Mal', invalid: true } })
    expect(f.find('.g-datepicker__icon svg').html()).toContain('M8 2v3')
    expect(f.find('svg.g-datepicker__error-icon').exists()).toBe(true)
    f.unmount()
  })

  it('GCalendar: chevrons de la barra y punto de la línea de ahora (circle relleno)', async () => {
    const { default: GCalendar } = await import('../components/GCalendar/GCalendar.vue')
    const w = mount(GCalendar, { props: { events: [], resources: [{ id: 'a', title: 'A' }], modelValue: new Date(), view: 'day', labels: { previous: 'Anterior', next: 'Siguiente' } } })
    expect(w.find('.g-calendar__prev svg').html()).toContain('m15 18-6-6 6-6')
    expect(w.find('.g-calendar__next svg').html()).toContain('m9 18 6-6-6-6')
  })
})

describe('GDialog, GSidebar, GBtn y GBadge · iconos de Lucide', () => {
  it('GBtn: el indicador de carga es el loader-circle de Lucide', async () => {
    const { default: GBtn } = await import('../components/GBtn/GBtn.vue')
    const w = mount(GBtn, { props: { loading: true }, slots: { default: 'Guardar' } })
    const svg = w.find('svg.g-btn__loader')
    expect(svg.exists()).toBe(true)
    expect(svg.attributes('aria-hidden')).toBe('true')
    expect(svg.html()).toContain('M21 12a9 9 0 1 1-6.219-8.56')
  })

  it('GBadge: cada figura es su icono de Lucide relleno', async () => {
    const { default: GBadge } = await import('../components/GBadge/GBadge.vue')
    for (const shape of ['circle', 'square', 'diamond', 'triangle']) {
      const w = mount(GBadge, { props: { shape, label: shape } })
      const svg = w.find(`svg.g-badge__shape--${shape}`)
      expect(svg.exists(), shape).toBe(true)
      expect(svg.attributes('fill')).toBe('currentColor')
    }
  })

  it('GSidebar: chevron de los padres, punto de estado y cierre del drawer son Lucide', async () => {
    const { default: GSidebar } = await import('../components/GSidebar/GSidebar.vue')
    const items = [{ id: 'a', label: 'A', icon: 'x', children: [{ id: 'a1', label: 'A1', href: '#a1' }] }, { id: 'b', label: 'B', href: '#b', dot: true, badgeLabel: 'nuevo' }]
    const w = mount(GSidebar, { attachTo: document.body, props: { items, label: 'Principal', mode: 'expanded', labels: { collapse: 'Contraer', expand: 'Expandir', more: 'Más', drawer: 'Menú', close: 'Cerrar' } } })
    expect(w.find('svg.g-sidebar__chevron').html()).toContain('m9 18 6-6-6-6')
    const dot = w.find('svg.g-sidebar__badge--dot')
    expect(dot.attributes('fill')).toBe('currentColor')
    expect(dot.attributes('aria-hidden')).toBe('true')
    w.unmount()
  })
})
