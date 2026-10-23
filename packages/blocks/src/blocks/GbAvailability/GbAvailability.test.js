// GbAvailability (dueño: bruno): availability.md «Verificación propia» + la batería común de _comun.md §8 y §20.
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { h, nextTick } from 'vue'
import meta from './GbAvailability.meta.json'
import * as bank from './availability.bank.js'
import * as section from './props.js'
import GbAvailability01 from './GbAvailability01.vue'
import GbAvailability02 from './GbAvailability02.vue'
import GbAvailability03 from './GbAvailability03.vue'
import { sectionSuite } from '../bank/suite.js'
import { GBtn, GCard, GDatePicker } from '@grana/vue'
import { GPrice, GPriceScope, formatPrice } from '@grana/vue/price'
import { describeQuery } from '@grana/vue/booking'
import { mountBlock } from '../bank/harness.js'
import { PARTY_ROWS, QUERY, QUERY_LABELS } from '../bank/booking.js'

const variants = { GbAvailability01, GbAvailability02, GbAvailability03 }
sectionSuite({ meta, bank, variants, section, dir: 'src/blocks/GbAvailability' })
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date(2026, 9, 23, 12)) })
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); document.body.innerHTML = '' })

const run = (C, props = {}, extra = {}) => mountBlock(C, { props: { ...bank.props, ...props }, slots: bank.slots, ...extra })
const own = (warnings, n, code) => warnings.filter((t) => t.includes(`[Grana GbAvailability${n}]`) && t.includes(`(${code})`))
const ALL = Object.entries(variants).map(([k, C]) => [k.slice(-2), C])
const CAL = [['01', GbAvailability01], ['03', GbAvailability03]]
const spoken = (amount) => formatPrice({ amount, currency: 'MXN' }, { locale: 'es', cents: 'never', scopeCurrency: 'MXN', labels: bank.props.labels.price }).spoken

describe('GbAvailability · del dato al calendario', () => {
  it('stay: full es noche agotada (disabledNights), closed no elegible (disabledDates)', () => {
    for (const [, C] of CAL) {
      const dp = run(C).w.findComponent(GDatePicker)
      expect(dp.props('mode')).toBe('range')
      expect(dp.props('inline')).toBe(true)
      expect(dp.props('months')).toBe('auto')
      expect(dp.props('disabledNights')('2026-11-20')).toBe(true)
      expect(dp.props('disabledDates')('2026-11-20')).toBe(false)
      expect(dp.props('disabledDates')('2026-11-02')).toBe(true)
      expect(dp.props('disabledDates')('2026-11-25')).toBe(false)
      expect(dp.props('minNights')).toBe(1)
      expect(dp.props('labels')).toBe(bank.props.labels.datePicker)
    }
  })
  it('table: full no es elegible (disabledDates), sin noches', () => {
    for (const [, C] of CAL) {
      const dp = run(C, bank.states.mesa).w.findComponent(GDatePicker)
      expect(dp.props('mode')).toBe('single')
      expect(dp.props('disabledDates')('2026-11-20')).toBe(true)
      expect(dp.props('disabledNights') ?? null).toBe(null)
      expect(dp.props('minNights') ?? null).toBe(null)
    }
  })
  it('dayDescription: estado en palabras, el precio leído y la nota; lleno sin precio; sin dato, nada', () => {
    for (const [, C] of CAL) {
      const d = run(C).w.findComponent(GDatePicker).props('dayDescription')
      expect(d('2026-11-12')).toBe(`quedan pocas, ${spoken(1850)}, Quedan 2`)
      expect(d('2026-11-13')).toBe(spoken(2100))
      expect(d('2026-11-20')).toBe('lleno')
      expect(d('2026-11-02')).toBe('cerrado')
      expect(d('2026-11-25')).toBe('')
      expect(spoken(1850)).toContain('1')
    }
  })
  it('slot day: GPrice xs display none cents never en los días con precio; nada en lleno ni cerrado', () => {
    for (const [, C] of CAL) {
      const { w } = run(C)
      const cells = w.findAllComponents(GPrice).filter((p) => p.props('size') === 'xs')
      expect(cells.length).toBeGreaterThan(20)
      for (const p of cells) {
        expect(p.props('display')).toBe('none')
        expect(p.props('cents')).toBe('never')
      }
      expect(w.findAll('.g-datepicker__day').some((b) => b.attributes('aria-label') && b.attributes('aria-label').includes('lleno') && b.find('.g-price').exists())).toBe(false)
      expect(w.find('.g-datepicker--day-content').exists()).toBe(true)
      // El precio del día llega a su nombre accesible
      expect(w.findAll('.g-datepicker__day').some((b) => (b.attributes('aria-label') || '').includes(`quedan pocas, ${spoken(1850)}`))).toBe(true)
    }
  })
  it('una GPriceScope por región (03: calendario y total en la misma)', () => {
    for (const [, C] of ALL) expect(run(C).w.findAllComponents(GPriceScope)).toHaveLength(1)
  })
  it('01: update:value en cada elección completa y select con el día y la consulta con las fechas', async () => {
    const onSelect = vi.fn()
    const onUpdate = vi.fn()
    const { w } = run(GbAvailability01, { value: null, onSelect, 'onUpdate:value': onUpdate })
    const dp = w.findComponent(GDatePicker)
    dp.vm.$emit('update:modelValue', { start: '2026-11-16', end: '2026-11-18' })
    await nextTick()
    expect(onUpdate).toHaveBeenCalledWith({ start: '2026-11-16', end: '2026-11-18' })
    const p = onSelect.mock.calls[0][0]
    expect(p).toMatchObject({ kind: 'stay', value: { start: '2026-11-16', end: '2026-11-18' }, day: bank.DAYS.find((d) => d.date === '2026-11-16') })
    expect(p.query).toEqual({ ...QUERY, from: '2026-11-16', to: '2026-11-18', party: { ...QUERY.party } })
    expect('event' in p).toBe(true)
    // table: un día completa la elección
    const t = vi.fn()
    const m = run(GbAvailability01, { ...bank.states.mesa, onSelect: t })
    m.w.findComponent(GDatePicker).vm.$emit('update:modelValue', '2026-11-17')
    expect(t.mock.calls[0][0]).toMatchObject({ kind: 'table', value: '2026-11-17', query: { kind: 'table', date: '2026-11-17', time: '20:00' } })
  })
  it('01: con un clic real en dos días, select lleva el evento del gesto', async () => {
    vi.setSystemTime(new Date(2026, 10, 1, 12)) // sin valor, el calendario abre en el mes de hoy
    const onSelect = vi.fn()
    const { w } = run(GbAvailability01, { value: null, onSelect }, { attachTo: document.body })
    const btn = (iso) => w.find(`.g-datepicker__day[data-date="${iso}"]`)
    await btn('2026-11-16').trigger('click')
    await btn('2026-11-18').trigger('click')
    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onSelect.mock.calls[0][0].event).toBeInstanceOf(Event)
    expect(onSelect.mock.calls[0][0].value).toEqual({ start: '2026-11-16', end: '2026-11-18' })
  })
  it('02: los `upcoming` primeros días abiertos desde min, en orden, con time datetime; select con la llegada', async () => {
    const onSelect = vi.fn()
    const { w } = run(GbAvailability02, { onSelect })
    const cards = w.findAllComponents(GCard)
    expect(cards).toHaveLength(6)
    const dates = w.findAll('li time').map((t) => t.attributes('datetime'))
    expect(dates).toEqual(['2026-11-01', '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07', '2026-11-08'])
    expect(w.find('li time').text()).toMatch(/domingo/)
    expect(w.find('ul').attributes('aria-label')).toBe('Próximas fechas')
    await cards[1].find('button.g-card__primary').trigger('click')
    const p = onSelect.mock.calls[0][0]
    expect(p).toMatchObject({ kind: 'stay', value: { start: '2026-11-04', end: null }, day: bank.DAYS.find((d) => d.date === '2026-11-04') })
    expect(p.query).toMatchObject({ from: '2026-11-04', to: null })
    expect(p.event).toBeInstanceOf(Event)
    // la insignia de pocas
    const few = run(GbAvailability02, { min: '2026-11-12', upcoming: 1 }).w.findComponent(GCard)
    expect(few.props('badge')).toBe('quedan pocas')
    expect(few.props('description')).toBe('Quedan 2')
  })
  it('02 desde hoy: los días pasados no salen', async () => {
    vi.setSystemTime(new Date(2026, 10, 10, 12))
    const { w } = run(GbAvailability02, { min: undefined })
    await nextTick()
    expect(w.find('li time').attributes('datetime')).toBe('2026-11-10')
  })
  it('02 sin fechas abiertas: sin lista, el slot empty', () => {
    const closed = bank.DAYS.map((d) => ({ date: d.date, status: 'closed' }))
    const { w, warnings } = mountBlock(GbAvailability02, { props: { ...bank.props, days: closed }, slots: { empty: () => h('p', null, 'Sin fechas') } })
    expect(w.find('ul').exists()).toBe(false)
    expect(w.text()).toContain('Sin fechas')
    expect(own(warnings, '02', 'V4')).toHaveLength(0)
    expect(own(run(GbAvailability02, { days: closed }).warnings, '02', 'V4')).toHaveLength(1)
  })
  it('03: la selección dicha con describeQuery, el total dado y el botón con la elección completa', async () => {
    const onSelect = vi.fn()
    const { w } = run(GbAvailability03, { onSelect })
    expect(w.findComponent(GCard).props('title')).toBe(describeQuery(QUERY, { partyRows: PARTY_ROWS, locale: 'es', labels: QUERY_LABELS }).text)
    const total = w.findAllComponents(GPrice).find((p) => p.props('size') === 'lg')
    expect(total.props('value')).toEqual(bank.props.total.value)
    expect(total.props('unit')).toBe('por 2 noches')
    const btn = w.findComponent(GBtn)
    expect(btn.props('variant')).toBe('solid')
    await w.find('button.g-btn').trigger('click')
    expect(onSelect.mock.calls[0][0]).toMatchObject({ kind: 'stay', value: bank.props.value, query: { ...QUERY, from: '2026-11-13', to: '2026-11-15' } })
    // Elección a medias: el botón queda deshabilitado
    const half = run(GbAvailability03, { value: null })
    expect(half.w.findComponent(GBtn).props('disabled')).toBe(true)
    // Al elegir, la frase cambia
    half.w.findComponent(GDatePicker).vm.$emit('update:modelValue', { start: '2026-11-16', end: '2026-11-18' })
    await nextTick()
    expect(half.w.findComponent(GCard).props('title')).toBe(describeQuery({ ...QUERY, from: '2026-11-16', to: '2026-11-18' }, { partyRows: PARTY_ROWS, locale: 'es', labels: QUERY_LABELS }).text)
  })
  it('slot day del bloque: recibe el AvailabilityDay del día', () => {
    const day = vi.fn(({ day: d }) => (d ? h('span', { class: 'mio' }, d.status) : null))
    const { w } = mountBlock(GbAvailability01, { props: bank.props, slots: { day } })
    expect(w.findAll('.mio').length).toBeGreaterThan(20)
    expect(day.mock.calls.some(([s]) => s.date === '2026-11-20' && s.day.status === 'full')).toBe(true)
  })
})

describe('GbAvailability · avisos', () => {
  it('V1: estado fuera de lista; C3: fecha repetida', () => {
    for (const [n, C] of ALL) {
      expect(own(run(C, { days: [...bank.DAYS, { date: '2026-11-25', status: 'maybe' }] }).warnings, n, 'V1')).toHaveLength(1)
      expect(own(run(C, { days: [...bank.DAYS, { date: '2026-11-01', status: 'open' }] }).warnings, n, 'C3')).toHaveLength(1)
    }
  })
  it('V2: noches fuera de stay; V3: cinco cifras solo en 01 y 03', () => {
    for (const [n, C] of ALL) {
      expect(own(run(C, { ...bank.states.mesa, minNights: 2 }).warnings, n, 'V2')).toHaveLength(1)
      const big = bank.DAYS.map((d) => (d.price ? { ...d, price: { value: { amount: 12500, currency: 'MXN' } } } : d))
      expect(own(run(C, { days: big }).warnings, n, 'V3')).toHaveLength(n === '02' ? 0 : 1)
    }
  })
  it('C5: sin labels.status.full; 02 sin upcoming; 03 sin select', () => {
    for (const [n, C] of ALL) {
      expect(own(run(C, { labels: { ...bank.props.labels, status: { few: 'pocas', closed: 'cerrado' } } }).warnings, n, 'C5').length).toBe(1)
      expect(own(run(C, { labels: { ...bank.props.labels, upcoming: undefined } }).warnings, n, 'C5')).toHaveLength(n === '02' ? 1 : 0)
      expect(own(run(C, { labels: { ...bank.props.labels, select: undefined } }).warnings, n, 'C5')).toHaveLength(n === '03' ? 1 : 0)
    }
  })
  it('K1 consulta inválida; K2 solo en 03 (la dice); K3 sin prices', () => {
    for (const [n, C] of ALL) {
      expect(own(run(C, { query: { kind: 'hotel' } }).warnings, n, 'K1')).toHaveLength(1)
      expect(own(run(C, { partyRows: undefined }).warnings, n, 'K2')).toHaveLength(n === '03' ? 1 : 0)
      expect(own(run(C, { prices: undefined }).warnings, n, 'K3')).toHaveLength(1)
    }
  })
  it('C7 con más de 120 días', () => {
    const many = Array.from({ length: 121 }, (_, i) => ({ date: new Date(Date.UTC(2026, 10, 1 + i)).toISOString().slice(0, 10), status: 'open' }))
    for (const [n, C] of ALL) expect(own(run(C, { days: many }).warnings, n, 'C7')).toHaveLength(1)
  })
})
