// Hidratación de GBookingBar con otro día en el cliente (#1033): «hoy»/«mañana» de la mesa y los días rápidos dependen de la
// fecha del dispositivo y se leen al montar. Antes, la fecha corta y sin días rápidos.
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { h, nextTick } from 'vue'
import GBookingBar from './GBookingBar.vue'
import { hydrate } from '../../utils/hydrationTestEnv.js'
import { resetDialogStack } from '../../utils/dialogStack.js'

const ROWS = [{ key: 'adults', label: 'Adultos', min: 1, default: 2, unit: (n) => `${n} adultos`, decrementLabel: '−', incrementLabel: '+' }]
const LABELS = {
  phrase: 'Mesa para {party} el {date} a las {time}.',
  fields: { date: 'Día', time: 'Hora', party: 'Personas' }, empty: { date: '¿qué día?', time: '¿a qué hora?' },
  noDate: 'Sin fecha', noTime: 'Sin hora', separator: ' · ', summaryTitle: 'Tu consulta', change: 'Cambiar', submit: 'Buscar', pending: 'Buscando', close: 'Cerrar', done: 'Listo',
  otherDay: 'Otro día', full: 'lleno', errors: { date: 'Elige el día.', time: 'Elige la hora.' }, missing: (n, v) => `Faltan ${v.count}`,
  datePicker: { prev: 'Anterior', next: 'Siguiente', dialog: 'Elegir fecha', close: 'Cerrar', today: 'hoy' }
}
const App = (props) => ({ render: () => h(GBookingBar, { kind: 'table', title: 'Reserva', partyRows: ROWS, labels: LABELS, locale: 'es', times: [{ value: '20:00' }], quickDays: 3, ...props }) })
const at = (y, m, d) => new Date(y, m - 1, d, 10, 0, 0)
async function run(props, server, client) {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(server)
  return hydrate(App(props), () => { vi.setSystemTime(client); return null })
}
beforeEach(() => {
  HTMLElement.prototype.showPopover = function () { this.setAttribute('data-popover-open', '') }
  HTMLElement.prototype.hidePopover = function () { this.removeAttribute('data-popover-open') }
})
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); resetDialogStack(); document.body.innerHTML = '' })

describe('hidratación · GBookingBar · otro día en el cliente', () => {
  it('mesa con fecha: sin desajustes; al montar, «hoy» con el día del cliente', async () => {
    const r = await run({ modelValue: { date: '2026-11-08', time: '20:00', party: { adults: 2 } } }, at(2026, 11, 7), at(2026, 11, 8))
    expect(r.mismatch).toEqual([])
    expect(r.html).not.toMatch(/mañana|hoy/)
    await nextTick(); await nextTick()
    expect(r.el.textContent).toMatch(/hoy/)
  })

  it('mesa sin fecha con quickDays: sin desajustes', async () => {
    const r = await run({}, at(2026, 11, 7), at(2026, 11, 8))
    expect(r.mismatch).toEqual([])
  })

  it('estancia: formatRange distinto en el cliente (otro ICU) no desajusta el resumen; al montar usa formatRange', async () => {
    const orig = Intl.DateTimeFormat.prototype.formatRange
    const props = { kind: 'stay', labels: { ...LABELS, nights: '{count} noches', checkout: 'Salida el {date}', fields: { dates: 'Fechas', party: 'Personas' }, empty: { dates: '¿cuándo?' }, noDates: 'Sin fechas' }, modelValue: { from: '2026-10-26', to: '2026-10-29', party: { adults: 2 } } }
    const r = await hydrate(App(props), () => { Intl.DateTimeFormat.prototype.formatRange = function (a, b) { return `«${orig.call(this, a, b)}»` }; return () => { Intl.DateTimeFormat.prototype.formatRange = orig } })
    expect(r.mismatch).toEqual([])
    expect(r.html).not.toContain('«')
    await nextTick(); await nextTick()
    expect(r.el.textContent).toContain('«')
    r.undo?.()
  })
})
