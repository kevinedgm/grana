// GPriceScope · design/contracts/price.md «GPriceScope» (#772)
import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import GPrice from '../GPrice/GPrice.vue'
import GPriceScope from './GPriceScope.vue'

const LEG = { legend: 'Precios en {name} ({code})' }
const mounted = []
const mk = (props = {}, slot = '') => {
  const w = mount(defineComponent({ components: { GPrice, GPriceScope }, data: () => ({ props }), template: `<g-price-scope v-bind="props">${slot}</g-price-scope>` }), { attachTo: document.body })
  mounted.push(w)
  return w
}
afterEach(() => {
  while (mounted.length) mounted.pop().unmount()
  vi.restoreAllMocks()
})

describe('GPriceScope', () => {
  it('leyenda primera con sello aria-hidden, la plantilla con nombre y código, y taxes sin separador escrito', () => {
    const w = mk({ currency: 'mxn', locale: 'es-MX', labels: LEG, taxes: 'IVA incluido' }, '<p class="x">carta</p>')
    const root = w.find('.g-price-scope')
    expect(root.element.tagName).toBe('DIV')
    expect(root.attributes('data-currency')).toBe('MXN')
    expect(root.attributes('role')).toBeUndefined()
    expect(root.element.firstElementChild.className).toBe('g-price-scope__legend')
    expect(root.element.firstElementChild.tagName).toBe('P')
    expect(w.find('.g-price-scope__seal').attributes('aria-hidden')).toBe('true')
    expect(w.find('.g-price-scope__seal').text()).toBe('MXN')
    expect(w.find('.g-price-scope__legend-text').text()).toBe('Precios en pesos mexicanos (MXN)')
    expect(w.find('.g-price-scope__taxes').text()).toBe('IVA incluido')
    expect(w.find('.g-price-scope__legend').element.textContent).toBe('MXNPrecios en pesos mexicanos (MXN)IVA incluido')
    expect(w.find('.x').exists()).toBe(true)
  })
  it('as section/aside; view cambia la leyenda y data-currency', () => {
    const w = mk({ currency: 'MXN', view: 'USD', as: 'section', locale: 'es-MX', labels: LEG })
    expect(w.find('section.g-price-scope').attributes('data-currency')).toBe('USD')
    expect(w.find('.g-price-scope__legend-text').text()).toBe('Precios en dólares estadounidenses (USD)')
  })
  it('legend:false no pinta la leyenda y omite los códigos; sin labels.legend, sin leyenda, con códigos y aviso', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const a = mk({ currency: 'MXN', legend: false, locale: 'es-MX' }, '<g-price :value="{ amount: 5, currency: \'MXN\' }" />')
    expect(a.find('.g-price-scope__legend').exists()).toBe(false)
    expect(a.find('.g-price__code').exists()).toBe(false)
    const b = mk({ currency: 'MXN', locale: 'es-MX' }, '<g-price :value="{ amount: 5, currency: \'MXN\' }" />')
    expect(b.find('.g-price-scope__legend').exists()).toBe(false)
    expect(b.find('.g-price__code').text()).toBe('MXN')
    expect(warn.mock.calls.some((c) => /^\[Grana GPriceScope\] legend sin labels\.legend/.test(c[0]))).toBe(true)
  })
  it('dentro, lo extranjero conserva su código', () => {
    const w = mk({ currency: 'MXN', locale: 'es-MX', labels: LEG }, '<g-price :value="{ amount: 5, currency: \'MXN\' }" /><g-price :value="{ amount: 190, currency: \'USD\' }" />')
    const p = w.findAll('.g-price')
    expect(p[0].find('.g-price__code').exists()).toBe(false)
    expect(p[1].find('.g-price__symbol').text()).toMatch(/^USD/)
  })
  it('anidadas: manda la más cercana', () => {
    const w = mk({ currency: 'MXN', locale: 'es-MX', labels: LEG }, '<g-price-scope currency="USD" :legend="false"><g-price :value="{ amount: 5, currency: \'MXN\' }" /></g-price-scope>')
    expect(w.find('.g-price__code').text()).toBe('MXN')
  })
  it('avisos 10 y 9: currency rechazada, view rechazada, locale rechazado', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mk({ currency: 'pesos', view: 'dolares', locale: 'xx-invalid-123456789', labels: LEG })
    const m = warn.mock.calls.map((c) => c[0]).join('\n')
    expect(m).toMatch(/currency «pesos»/)
    expect(m).toMatch(/view «dolares»/)
    expect(m).toMatch(/locale «xx-invalid/)
  })
})
