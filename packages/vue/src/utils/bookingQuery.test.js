// describeQuery (booking-bar.md «`describeQuery`», #862): igual al resumen de GBookingBar montado con la misma consulta y
// los mismos labels en los tres kind, con y sin huecos; pura (Node, sin DOM: ver bookingQuery.ssr.test.js); nunca lanza.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import GBookingBar from '../components/GBookingBar/GBookingBar.vue'
import { resetDialogStack } from './dialogStack.js'
import { describeQuery } from './bookingQuery.js'
import * as booking from '../booking.js'

vi.mock('./dates.js', async (orig) => ({ ...(await orig()), todayISO: () => '2026-11-02' }))

beforeEach(() => {
  HTMLElement.prototype.showPopover = function () { this.setAttribute('data-popover-open', '') }
  HTMLElement.prototype.hidePopover = function () { this.removeAttribute('data-popover-open') }
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', '') }
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open') }
})
afterEach(() => { vi.restoreAllMocks(); resetDialogStack(); document.body.innerHTML = '' })

const ROWS = [
  { key: 'adults', label: 'Adultos', min: 1, default: 2, unit: (n) => `${n} ${n === 1 ? 'adulto' : 'adultos'}`, decrementLabel: '−', incrementLabel: '+' },
  { key: 'children', label: 'Niños', unit: '{count} niños', decrementLabel: '−', incrementLabel: '+' },
  { key: 'rooms', label: 'Habitaciones', min: 1, max: (v) => v.adults, unit: (n) => `${n} ${n === 1 ? 'habitación' : 'habitaciones'}`, decrementLabel: '−', incrementLabel: '+' }
]
const TIMES = [{ value: '14:00', label: '2:00 p. m.' }, { value: '20:00' }]
const TOURS = [{ value: 'ma', label: 'Monte Albán' }, { value: 7, label: 'Hierve el Agua' }]
const LABELS = {
  fields: { from: 'Llegada', to: 'Salida', nights: 'Noches', date: 'Día', time: 'Hora', tour: 'Recorrido', party: 'Huéspedes' },
  nights: (n) => `${n} ${n === 1 ? 'noche' : 'noches'}`, checkout: 'Salida el {date}',
  noDates: 'Sin fechas', noDate: 'Sin fecha', noTime: 'Sin hora', noTour: 'Sin recorrido', separator: ' · ',
  summaryTitle: 'Tu consulta', change: 'Cambiar', submit: 'Ver', close: 'Cerrar', done: 'Listo', full: 'lleno',
  decrement: '−', increment: '+', errors: {}, missing: 'Faltan', datePicker: { prev: 'a', next: 'b', dialog: 'c', close: 'd' }
}
const CASES = [
  ['stay', { from: '2026-11-13', to: '2026-11-15', party: { adults: 2, children: 1, rooms: 1 } }],
  ['stay', { from: '2026-11-13', to: '2026-11-14', party: { adults: 1, children: 0, rooms: 1 } }],
  ['stay', { from: null, to: null, party: { adults: 3, children: 0, rooms: 2 } }],
  ['table', { date: '2026-11-02', time: '14:00', party: { adults: 2, children: 0, rooms: 1 } }],
  ['table', { date: '2026-11-03', time: '20:00', party: { adults: 4, children: 2, rooms: 1 } }],
  ['table', { date: '2026-11-20', time: null, party: { adults: 2, children: 0, rooms: 1 } }],
  ['table', { date: null, time: null, party: { adults: 2, children: 0, rooms: 1 } }],
  ['tour', { tour: 'ma', date: '2026-11-21', party: { adults: 2, children: 1, rooms: 1 } }],
  ['tour', { tour: 7, date: null, party: { adults: 2, children: 0, rooms: 1 } }],
  ['tour', { tour: null, date: null, party: { adults: 1, children: 0, rooms: 1 } }]
]
const digestOf = async (kind, model, locale = 'es') => {
  const w = mount(GBookingBar, { attachTo: document.body, props: { kind, title: 'Consulta', partyRows: ROWS, times: TIMES, tours: TOURS, labels: LABELS, locale, modelValue: model, appearance: 'bar' } })
  await nextTick()
  const text = w.find('.g-booking-bar__digest').text()
  w.unmount()
  return text
}

describe('describeQuery · igual al resumen de GBookingBar (#862)', () => {
  for (const [kind, model] of CASES) {
    it(`${kind} ${JSON.stringify(model)}`, async () => {
      const d = describeQuery({ kind, ...model }, { partyRows: ROWS, times: TIMES, tours: TOURS, locale: 'es', labels: LABELS })
      expect(d.text).toBe(await digestOf(kind, model))
      expect(d.text).not.toBe('')
    })
  }
  it('en inglés también (el idioma es el de la opción)', async () => {
    const [kind, model] = CASES[0]
    expect(describeQuery({ kind, ...model }, { partyRows: ROWS, locale: 'en', labels: LABELS }).text).toBe(await digestOf(kind, model, 'en'))
  })
})

describe('describeQuery · resultado', () => {
  const opts = { partyRows: ROWS, times: TIMES, tours: TOURS, locale: 'es', labels: LABELS }
  it('stay completa: noches, salida en palabras, nada que falte', () => {
    const d = describeQuery({ kind: 'stay', from: '2026-11-13', to: '2026-11-15', party: { adults: 2, children: 1, rooms: 1 } }, opts)
    expect(d.nights).toBe(2)
    expect(d.text).toMatch(/13.*15.*nov.* · 2 noches · 2 adultos · 1 niños · 1 habitación$/)
    expect(d.checkout).toMatch(/^Salida el domingo, 15 de noviembre$/)
    expect(d.missing).toEqual([])
  })
  it('missing en orden; sin salida si falta algo', () => {
    expect(describeQuery({ kind: 'stay', party: {} }, opts)).toMatchObject({ missing: ['dates'], checkout: '', nights: null })
    expect(describeQuery({ kind: 'table', party: {} }, opts).missing).toEqual(['date', 'time'])
    expect(describeQuery({ kind: 'tour', party: {} }, opts).missing).toEqual(['tour', 'date'])
  })
  it('el grupo se completa con default/min de las filas', () => {
    expect(describeQuery({ kind: 'stay', party: {} }, opts).text).toBe('Sin fechas · 2 adultos · 1 habitación')
  })
  it('labels que faltan: la pieza se omite, sin aviso ni excepción', () => {
    const spy = vi.spyOn(console, 'warn')
    const d = describeQuery({ kind: 'table', party: { adults: 2 } }, { partyRows: ROWS, labels: { separator: ' · ' } })
    expect(d.text).toBe('2 adultos · 1 habitación')
    expect(spy).not.toHaveBeenCalled()
  })
  it('nunca lanza: consulta, opciones o fechas inválidas', () => {
    for (const q of [null, undefined, 3, 'x', { kind: 'hotel' }, { kind: 'stay', from: '13/11/2026', to: 'mañana' }]) {
      expect(() => describeQuery(q, opts)).not.toThrow()
      expect(typeof describeQuery(q, opts).text).toBe('string')
    }
    expect(() => describeQuery({ kind: 'stay' }, null)).not.toThrow()
    expect(describeQuery({ kind: 'stay', from: '13/11/2026', to: null, party: {} }, opts).missing).toEqual(['dates'])
    const bad = { get separator() { throw new Error('x') } }
    expect(() => describeQuery({ kind: 'stay', party: {} }, { partyRows: ROWS, labels: bad })).not.toThrow()
  })
  it('la entrada @grana/vue/booking la exporta', () => {
    expect(booking.describeQuery).toBe(describeQuery)
  })
})
