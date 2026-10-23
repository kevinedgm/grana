// GbBookingSummary (dueño: bruno): booking-summary.md «Verificación propia» + la batería común de _comun.md §8 y §20.
import { describe, it, expect, afterEach, vi } from 'vitest'
import { h } from 'vue'
import meta from './GbBookingSummary.meta.json'
import * as bank from './booking-summary.bank.js'
import * as section from './props.js'
import GbBookingSummary01 from './GbBookingSummary01.vue'
import GbBookingSummary02 from './GbBookingSummary02.vue'
import GbBookingSummary03 from './GbBookingSummary03.vue'
import { sectionSuite } from '../bank/suite.js'
import { GBtn, GSummary, GText } from '@grana/vue'
import { GPrice, GPriceScope } from '@grana/vue/price'
import { describeQuery } from '@grana/vue/booking'
import { click, mountBlock } from '../bank/harness.js'
import { PARTY_ROWS, QUERY, QUERY_LABELS } from '../bank/booking.js'

const variants = { GbBookingSummary01, GbBookingSummary02, GbBookingSummary03 }
sectionSuite({ meta, bank, variants, section, dir: 'src/blocks/GbBookingSummary', headless: ['GbBookingSummary03'] })
afterEach(() => { vi.restoreAllMocks(); document.body.innerHTML = '' })

const run = (C, props = {}, extra = {}) => mountBlock(C, { props: { ...bank.props, ...props }, slots: bank.slots, ...extra })
const own = (warnings, n, code) => warnings.filter((t) => t.includes(`[Grana GbBookingSummary${n}]`) && t.includes(`(${code})`))
const ALL = Object.entries(variants).map(([k, C]) => [k.slice(-2), C])
const TEXT = describeQuery(QUERY, { partyRows: PARTY_ROWS, locale: 'es', labels: QUERY_LABELS }).text

describe('GbBookingSummary · lo pedido y el total', () => {
  it('la consulta es exactamente describeQuery, como dato labels.when del GSummary', () => {
    for (const [, C] of ALL) {
      const { w } = run(C)
      const s = w.findComponent(GSummary)
      expect(s.props('title')).toBe('Suite Jardín')
      expect(s.props('facts')).toEqual([{ label: 'Fechas y personas', value: TEXT, priority: 1 }])
    }
    expect(run(GbBookingSummary03).w.findComponent(GSummary).props('layout')).toBe('inline')
    // Sin oferta, la consulta sola es el título
    expect(run(GbBookingSummary01, { offer: undefined }).w.findComponent(GSummary).props('title')).toBe(TEXT)
  })
  it('el total es el dado (la cuenta) y el bloque no suma las líneas', () => {
    for (const [n, C] of ALL) {
      const { w } = run(C)
      expect(w.findAllComponents(GPriceScope)).toHaveLength(1)
      const prices = w.findAllComponents(GPrice)
      const main = prices[prices.length - 1]
      if (n === '03') {
        expect(main.props('value')).toEqual(bank.props.totals.total.value)
        expect(main.props('unit')).toBe('por 2 noches')
        expect(main.props('total')).toBe(null)
        expect(main.props('size')).toBe('sm')
      } else {
        expect(main.props('value')).toEqual(bank.props.offer.price.value)
        expect(main.props('lead')).toBe('desde')
        expect(main.props('total')).toEqual(bank.props.totals.total)
      }
      expect(w.text()).not.toContain('4,073')
      expect(w.text()).not.toContain('4073')
    }
    // Sin totals, la tarifa sola
    expect(run(GbBookingSummary01, { totals: undefined }).w.findComponent(GPrice).props('total')).toBe(null)
  })
  it('02: el desglose es un dl real dentro de una GText, nombrado por labels.lines, con un div por línea', () => {
    const { w } = run(GbBookingSummary02)
    const dl = w.find('dl')
    expect(dl.exists()).toBe(true)
    expect(dl.element.parentElement.classList.contains('g-text')).toBe(true)
    const groups = dl.element.children
    expect(groups).toHaveLength(3)
    for (const g of groups) {
      expect(g.tagName).toBe('DIV')
      expect(g.firstElementChild.tagName).toBe('DT')
    }
    expect(groups[1].querySelectorAll('dd')).toHaveLength(2)
    expect(w.findAll('h3').map((x) => x.text())).toContain('Desglose')
    expect(w.text()).toContain('Pagas al llegar')
    for (const C of [GbBookingSummary01, GbBookingSummary03]) {
      const o = run(C).w
      expect(o.find('dl').exists()).toBe(false)
      expect(o.text()).not.toContain('Pagas al llegar')
    }
  })
  it('la garantía describe la acción principal (aria-describedby)', () => {
    for (const [, C] of ALL) {
      const { w } = run(C)
      const g = w.findAllComponents(GText).find((t) => t.text() === bank.props.assurance)
      expect(g.props('tone')).toBe('muted')
      const id = g.element.id
      expect(id).toBeTruthy()
      const main = w.findAll('.g-btn')[0]
      expect(main.text()).toBe('Continuar')
      expect(main.attributes('aria-describedby')).toBe(id)
      if (w.findAll('.g-btn').length > 1) expect(w.findAll('.g-btn')[1].attributes('aria-describedby')).toBeUndefined()
    }
  })
  it('jerarquía: 01 y 02 solid + outline; 03 una sola acción outline; 01 con la foto', () => {
    for (const C of [GbBookingSummary01, GbBookingSummary02]) expect(run(C).w.findAllComponents(GBtn).map((b) => b.props('variant'))).toEqual(['solid', 'outline'])
    const w3 = run(GbBookingSummary03).w
    expect(w3.findAllComponents(GBtn).map((b) => b.props('variant'))).toEqual(['outline'])
    // #894, #897, #898: raíz GText (div) role="group" con el nombre; la fila es una GAdaptiveLayout con GSummary de hijo directo
    expect(w3.element.tagName).toBe('DIV')
    expect(w3.element.classList.contains('g-text')).toBe(true)
    expect(w3.element.getAttribute('role')).toBe('group')
    expect(w3.element.getAttribute('aria-label')).toBe('Tu reserva')
    const row = w3.find('.g-adaptive-layout')
    expect(row.exists()).toBe(true)
    expect(row.element.parentElement).toBe(w3.element)
    expect(row.find('.g-summary').element.parentElement).toBe(row.element)
    expect(run(GbBookingSummary01).w.findAll('img')).toHaveLength(1)
    expect(run(GbBookingSummary02).w.findAll('img')).toHaveLength(0)
  })
  it('navigate con clic primario; no con Ctrl; activate sin href', () => {
    for (const [, C] of ALL) {
      const onNavigate = vi.fn((p) => p.event.preventDefault())
      const { w } = run(C, { onNavigate }, { attachTo: document.body })
      const a = w.find('a.g-btn').element
      a.addEventListener('click', (e) => e.preventDefault()) // jsdom no navega (después de la escucha del bloque)
      a.dispatchEvent(click({ ctrlKey: true }))
      expect(onNavigate).not.toHaveBeenCalled()
      a.dispatchEvent(click())
      expect(onNavigate.mock.calls[0][0]).toMatchObject({ href: '/reservar/datos', item: bank.props.actions[0] })
      w.unmount()
    }
    const onActivate = vi.fn()
    const { w } = run(GbBookingSummary02, { onActivate, actions: [{ label: 'Seguir' }] })
    w.find('button.g-btn').trigger('click')
    expect(onActivate.mock.calls[0][0].item).toEqual({ label: 'Seguir' })
  })
  it('slots summary y actions', () => {
    const summary = vi.fn(({ offer }) => h('p', null, `propio ${offer.name}`))
    const actions = vi.fn(({ describedby }) => h('button', { 'aria-describedby': describedby }, 'Mío'))
    for (const [, C] of ALL) {
      const { w } = mountBlock(C, { props: bank.props, slots: { summary, actions } })
      expect(w.findComponent(GSummary).exists()).toBe(false)
      expect(w.text()).toContain('propio Suite Jardín')
      expect(w.find('button[aria-describedby]').exists()).toBe(true)
    }
  })
})

describe('GbBookingSummary · avisos', () => {
  it('R1: total sin label; R2: más de 8 líneas solo en 02', () => {
    for (const [n, C] of ALL) {
      expect(own(run(C, { totals: { total: { value: { amount: 1, currency: 'MXN' } } } }).warnings, n, 'R1')).toHaveLength(1)
      const many = Array.from({ length: 9 }, (_, i) => ({ label: `L${i}`, amount: { amount: i, currency: 'MXN' } }))
      expect(own(run(C, { totals: { ...bank.props.totals, lines: many } }).warnings, n, 'R2')).toHaveLength(n === '02' ? 1 : 0)
    }
  })
  it('C5: sin labels.when y, en 02, sin labels.lines; K2 sin labels.query; K1 consulta inválida', () => {
    for (const [n, C] of ALL) {
      expect(own(run(C, { labels: { ...bank.props.labels, when: undefined } }).warnings, n, 'C5')).toHaveLength(1)
      expect(own(run(C, { labels: { ...bank.props.labels, lines: undefined } }).warnings, n, 'C5')).toHaveLength(n === '02' ? 1 : 0)
      expect(own(run(C, { labels: { ...bank.props.labels, query: undefined } }).warnings, n, 'K2')).toHaveLength(1)
      expect(own(run(C, { query: { kind: 'hotel' } }).warnings, n, 'K1')).toHaveLength(1)
    }
  })
  it('K3: sin prices y con precios; tarifa sin value', () => {
    for (const [n, C] of ALL) {
      expect(own(run(C, { prices: undefined }).warnings, n, 'K3')).toHaveLength(1)
      expect(own(run(C, { totals: undefined, offer: { ...bank.props.offer, price: { lead: 'x' } } }).warnings, n, 'K3')).toHaveLength(1)
    }
  })
  it('C8: más de dos acciones', () => {
    const three = [...bank.props.actions, { label: 'Otra', href: '/x' }]
    for (const [n, C] of ALL) expect(own(run(C, { actions: three }).warnings, n, 'C8')).toHaveLength(1)
  })
})
