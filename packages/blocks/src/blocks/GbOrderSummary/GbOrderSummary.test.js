// GbOrderSummary (dueño: bruno): order-summary.md «Verificación propia» + la batería común de _comun.md §8 y §33.
import { describe, it, expect, afterEach, vi } from 'vitest'
import meta from './GbOrderSummary.meta.json'
import * as bank from './order-summary.bank.js'
import * as section from './props.js'
import GbOrderSummary01 from './GbOrderSummary01.vue'
import GbOrderSummary02 from './GbOrderSummary02.vue'
import GbOrderSummary03 from './GbOrderSummary03.vue'
import { sectionSuite } from '../bank/suite.js'

const variants = { GbOrderSummary01, GbOrderSummary02, GbOrderSummary03 }
sectionSuite({ meta, bank, variants, section, dir: 'src/blocks/GbOrderSummary', headless: ['GbOrderSummary03'] })
afterEach(() => { vi.restoreAllMocks(); document.body.innerHTML = '' })

import { GMetric, GSummary } from '@grana/vue'
import { GPrice, GPriceScope } from '@grana/vue/price'
import { click, mountBlock } from '../bank/harness.js'
import { CART_LINES, ORDER, mxn } from '../bank/ecommerce.js'

const run = (C, props = {}, extra = {}) => mountBlock(C, { props: { ...bank.props, ...props }, slots: bank.slots, ...extra })
const own = (warnings, n, code) => warnings.filter((t) => t.includes(`[Grana GbOrderSummary${n}]`) && t.includes(`(${code})`))
const ALL = Object.entries(variants).map(([k, C]) => [k.slice(-2), C])
// Un total que NO es la suma de sus partes: el bloque pinta lo dado (§27 regla 4, §33.1)
const ODD = { ...ORDER, totals: { ...ORDER.totals, total: { value: mxn(1234), label: 'por 4 piezas' } } }

describe('GbOrderSummary · el recibo (order-summary.md «Piezas»)', () => {
  it('01 y 02: el código es lo primero (GMetric con su rótulo)', () => {
    for (const C of [GbOrderSummary01, GbOrderSummary02]) {
      const { w } = run(C)
      const m = w.findComponent(GMetric)
      expect(m.props('value')).toBe('BYA-2611-07')
      expect(m.props('label')).toBe('Número de pedido')
      const first = w.element.querySelector('.g-metric')
      const firstPrice = w.element.querySelector('.g-price')
      expect(first.compareDocumentPosition(firstPrice) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    }
  })
  it('la elección de cada línea dice las mismas palabras que la del carrito (la elección viaja, §27 regla 3)', () => {
    const { w } = run(GbOrderSummary02)
    const opt = CART_LINES[1].options[0]
    const li = [...w.element.querySelectorAll('ul > li')].find((x) => x.textContent.includes('Rebozo'))
    expect(li.textContent).toContain(`${opt.label} ${opt.value}`)
    expect(li.textContent).toContain('1 pieza')
  })
  it('ningún cálculo: el total pintado es el dado aunque no sea la suma, y es el último par antes de lo incluido', () => {
    for (const C of [GbOrderSummary01, GbOrderSummary02]) {
      const { w } = run(C, { order: ODD })
      const pairs = [...w.element.querySelectorAll('dl > div')]
      const totalPair = pairs.find((d) => d.querySelector('dt').textContent === 'Total')
      expect(totalPair).toBeTruthy()
      const price = w.findAllComponents(GPrice).find((p) => p.element.closest('div') === totalPair || totalPair.contains(p.element))
      expect(price.props('value')).toEqual(mxn(1234))
      expect(totalPair.textContent).toContain('por 4 piezas')
    }
    const { w } = run(GbOrderSummary02)
    const terms = [...w.element.querySelectorAll('dl > div > dt')].map((d) => d.textContent)
    expect(terms).toEqual(['Subtotal', 'Descuento OAXACA10', 'Envío estándar', 'Total', 'Incluye IVA', 'Pago'])
  })
  it('01: sin desglose (solo el total); 02: dirección en address y fechas en time con datetime', () => {
    const one = run(GbOrderSummary01).w
    expect([...one.element.querySelectorAll('dl dt')].map((d) => d.textContent)).toEqual(['Total'])
    expect(one.find('address').exists()).toBe(false)
    const two = run(GbOrderSummary02).w
    const addr = two.find('address')
    expect(addr.text()).toContain('Macedonio Alcalá 202, Centro')
    const times = two.findAll('time').map((t) => t.attributes('datetime'))
    expect(times).toEqual(['2026-11-07T10:42:00-06:00', '2026-11-12'])
    // La entrega se dice en palabras, nunca «mañana»; el pedido en la hora de la tienda
    expect(two.findAll('time')[1].text()).toMatch(/^Llega el jueves, 12 de noviembre$/)
    expect(two.findAll('time')[0].text()).toMatch(/^Pedido el sábado, 7 de noviembre/)
  })
  it('un solo GPriceScope y ningún precio fuera de GPrice', () => {
    for (const [, C] of ALL) {
      const { w } = run(C)
      expect(w.findAllComponents(GPriceScope)).toHaveLength(1)
      const rest = w.element.cloneNode(true)
      for (const p of rest.querySelectorAll('.g-price')) p.remove()
      expect(rest.textContent).not.toMatch(/\$\s?\d/)
    }
  })
  it('03: una línea con el código, las piezas y el total; la primera acción outline', () => {
    const { w } = run(GbOrderSummary03)
    const root = w.element
    expect(root.getAttribute('role')).toBe('group')
    expect(root.getAttribute('aria-label')).toBe('Tu pedido')
    const s = w.findComponent(GSummary)
    expect(s.props('title')).toBe('BYA-2611-07')
    expect(s.props('facts')).toEqual([{ label: 'Lo que compraste', value: '4 piezas', bare: true }])
    expect(w.findAll('.g-btn')).toHaveLength(1)
  })
  it('navigate con el nombre de un producto (item = la OrderLine), no con Ctrl', () => {
    const onNavigate = vi.fn((p) => p.event.preventDefault())
    const { w } = run(GbOrderSummary02, { onNavigate }, { attachTo: document.body })
    const a = [...w.element.querySelectorAll('ul a')].find((x) => x.textContent.includes('Jarro'))
    a.dispatchEvent(click({ ctrlKey: true }))
    expect(onNavigate).not.toHaveBeenCalled()
    a.dispatchEvent(click())
    expect(onNavigate.mock.calls[0][0]).toMatchObject({ href: ORDER.lines[2].href, item: ORDER.lines[2] })
  })
})

describe('GbOrderSummary · avisos propios', () => {
  it('OS1 sin label del total, OS2 con más de 30 líneas en 01, EC1 sin prices; una vez', () => {
    const noLabel = { ...ORDER, totals: { ...ORDER.totals, total: { value: mxn(1) } } }
    const a = run(GbOrderSummary02, { order: noLabel })
    expect(own(a.warnings, '02', 'OS1')).toHaveLength(1)
    const many = { ...ORDER, lines: Array.from({ length: 31 }, (_, i) => ({ id: `x${i}`, name: `Pieza ${i}`, quantity: 1, total: mxn(1) })) }
    expect(own(run(GbOrderSummary01, { order: many }).warnings, '01', 'OS2')).toHaveLength(1)
    expect(own(run(GbOrderSummary02, { order: many }).warnings, '02', 'OS2')).toHaveLength(0)
    expect(own(run(GbOrderSummary01, { prices: undefined }).warnings, '01', 'EC1')).toHaveLength(1)
  })
  it('C5 sin labels.lines; C8 con tres acciones', () => {
    const { warnings } = run(GbOrderSummary02, { labels: { ...bank.props.labels, lines: undefined }, actions: [{ label: 'a', href: '/a' }, { label: 'b', href: '/b' }, { label: 'c', href: '/c' }] })
    expect(own(warnings, '02', 'C5')).toHaveLength(1)
    expect(own(warnings, '02', 'C8')).toHaveLength(1)
  })
})
