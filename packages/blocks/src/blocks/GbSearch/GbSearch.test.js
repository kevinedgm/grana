// GbSearch (dueño: bruno): search.md «Verificación propia» + la batería común de _comun.md §8 y §20.
import { describe, it, expect, afterEach, vi } from 'vitest'
import { h, nextTick } from 'vue'
import { GSection, GText } from '@grana/vue'
import { GBookingBar, describeQuery } from '@grana/vue/booking'
import meta from './GbSearch.meta.json'
import * as bank from './search.bank.js'
import * as section from './props.js'
import GbSearch01 from './GbSearch01.vue'
import GbSearch02 from './GbSearch02.vue'
import GbSearch03 from './GbSearch03.vue'
import { sectionSuite } from '../bank/suite.js'
import { mountBlock } from '../bank/harness.js'
import { PARTY_ROWS, QUERY, QUERY_LABELS } from '../bank/booking.js'

const variants = { GbSearch01, GbSearch02, GbSearch03 }
sectionSuite({ meta, bank, variants, section, dir: 'src/blocks/GbSearch' })
afterEach(() => { vi.restoreAllMocks(); document.body.innerHTML = '' })

const run = (C, props = {}, extra = {}) => mountBlock(C, { props: { ...bank.props, ...props }, slots: bank.slots, ...extra })
const own = (warnings, n, code) => warnings.filter((t) => t.includes(`[Grana GbSearch${n}]`) && t.includes(`(${code})`))
const ALL = Object.entries({ '01': GbSearch01, '02': GbSearch02, '03': GbSearch03 })

describe('GbSearch · lo que pasa a GBookingBar', () => {
  it('01 phrase, 02 bar sin quickDays, 03 phrase + dock; el resto tal cual', () => {
    for (const [n, C] of ALL) {
      const { w } = run(C, { quickDays: 3 })
      const bar = w.findComponent(GBookingBar)
      expect(bar.props('appearance')).toBe(n === '02' ? 'bar' : 'phrase')
      expect(bar.props('dock')).toBe(n === '03')
      expect(bar.props('quickDays')).toBe(n === '02' ? 0 : 3)
      expect(bar.props('title')).toBe(bank.props.title)
      expect(bar.props('partyRows')).toBe(bank.props.partyRows)
      expect(bar.props('disabledNights')).toBe(bank.props.disabledNights)
      expect(bar.props('names')).toEqual(bank.props.names)
      expect(bar.props('labels')).toBe(bank.props.labels.bar)
      expect(bar.props('kind')).toBe('stay')
    }
  })
  it('modelValue sin kind; update:query con kind', async () => {
    for (const [, C] of ALL) {
      const onQ = vi.fn()
      const { w } = run(C, { 'onUpdate:query': onQ })
      const bar = w.findComponent(GBookingBar)
      expect(bar.props('modelValue')).toEqual({ from: QUERY.from, to: QUERY.to, party: QUERY.party })
      expect('kind' in bar.props('modelValue')).toBe(false)
      bar.vm.$emit('update:modelValue', { from: '2026-11-14', to: '2026-11-16', party: { adults: 2, children: 0, rooms: 1 } })
      expect(onQ).toHaveBeenCalledWith({ kind: 'stay', from: '2026-11-14', to: '2026-11-16', party: { adults: 2, children: 0, rooms: 1 } })
    }
  })
  it('submit: la carga de GBookingBar tal cual (misma referencia)', () => {
    for (const [, C] of ALL) {
      const onSubmit = vi.fn()
      const { w } = run(C, { onSubmit })
      const payload = { kind: 'stay', from: QUERY.from, to: QUERY.to, party: QUERY.party, nights: 2, event: new Event('submit'), preventDefault() {}, defaultPrevented: false }
      w.findComponent(GBookingBar).vm.$emit('submit', payload)
      expect(onSubmit.mock.calls[0][0]).toBe(payload)
    }
  })
  it('submit real del formulario: kind, consulta y noches', async () => {
    const onSubmit = vi.fn()
    const { w } = run(GbSearch02, { onSubmit }, { attachTo: document.body })
    w.find('form').element.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    for (let i = 0; i < 5; i++) await nextTick()
    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ kind: 'stay', from: QUERY.from, to: QUERY.to, nights: 2 })
  })
  it('la nota: GText body-sm muted después del form; sin nota, nada', () => {
    for (const [, C] of ALL) {
      const { w } = run(C)
      const t = w.findComponent(GText)
      expect(t.props('size')).toBe('body-sm')
      expect(t.props('tone')).toBe('muted')
      expect(t.text()).toBe(bank.props.note)
      expect(w.element.lastElementChild).toBe(t.element)
      expect(w.find('form').element.compareDocumentPosition(t.element) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
      expect(run(C, { note: undefined }).w.findComponent(GText).exists()).toBe(false)
    }
  })
  it('sin GSection alrededor: la barra es la región (form role="search" con su encabezado)', () => {
    for (const [, C] of ALL) {
      const { w } = run(C)
      expect(w.findComponent(GSection).exists()).toBe(false)
      expect(w.find('form').attributes('role')).toBe('search')
      expect(w.find('form h2').text()).toBe(bank.props.title)
    }
  })
  it('action, method y target van al <form>; class y data-* a la raíz', () => {
    for (const [, C] of ALL) {
      const { w } = run(C, {}, { attrs: { action: '/reservar', method: 'get', target: '_self', class: 'x', 'data-y': '1' } })
      const f = w.find('form')
      expect(f.attributes('action')).toBe('/reservar')
      expect(f.attributes('method')).toBe('get')
      expect(f.attributes('target')).toBe('_self')
      expect(w.element.classList.contains('x')).toBe(true)
      expect(w.element.getAttribute('data-y')).toBe('1')
      expect(w.element.hasAttribute('action')).toBe(false)
    }
  })
  it('mesa y recorrido (juegos de prueba): sin avisos y con su kind', () => {
    for (const k of ['table', 'tour']) {
      for (const [, C] of ALL) {
        const { w, warnings } = run(C, bank.tests[k])
        expect(warnings, `${k}`).toEqual([])
        expect(w.findComponent(GBookingBar).props('kind')).toBe(k)
      }
    }
  })
  it('el resumen de la barra es describeQuery con la misma consulta (el hilo, #862)', () => {
    const { w } = run(GbSearch02)
    const text = describeQuery(QUERY, { partyRows: PARTY_ROWS, locale: 'es', labels: QUERY_LABELS }).text
    expect(w.find('.g-booking-bar__digest').text()).toBe(text)
  })
})

describe('GbSearch · avisos', () => {
  it('K1: query de otro kind o con forma inválida → null, una vez', () => {
    for (const [n, C] of ALL) {
      const { w, warnings } = run(C, { query: { kind: 'table', date: null, time: null, party: {} } })
      expect(w.findComponent(GBookingBar).props('modelValue')).toBe(null)
      expect(own(warnings, n, 'K1')).toHaveLength(1)
      const bad = run(C, { query: { kind: 'stay', from: '13/11/2026', to: null, party: {} } })
      expect(own(bad.warnings, n, 'K1')).toHaveLength(1)
    }
  })
  it('S1: dos GbSearch03 en el documento', () => {
    const two = mountBlock({ render: () => h('div', [h(GbSearch03, bank.props), h(GbSearch03, bank.props)]) }, { attachTo: document.body })
    expect(two.warnings.filter((t) => t.includes('(S1)')).length).toBeGreaterThanOrEqual(1)
    two.w.unmount()
    two.restore()
    const one = run(GbSearch03, {}, { attachTo: document.body })
    expect(own(one.warnings, '03', 'S1')).toHaveLength(0)
  })
})
