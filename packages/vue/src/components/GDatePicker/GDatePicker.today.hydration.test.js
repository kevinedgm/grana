// Hidratación de GDatePicker con otro día en el cliente (#1033): el sitio estático se construye un día y se abre otro. Antes
// de montar, nada marcado como hoy y la vista sale solo de las props (el mes del valor); sin valor, la rejilla de días espera
// al montaje. Al montar, la fecha del dispositivo: hoy marcado y, sin valor, el mes de hoy.
import { describe, it, expect, vi, afterEach } from 'vitest'
import { h, nextTick } from 'vue'
import GDatePicker from './GDatePicker.vue'
import { hydrate } from '../../utils/hydrationTestEnv.js'

const LABELS = { prev: 'Mes anterior', next: 'Mes siguiente', clear: 'Limpiar', done: 'Listo', today: 'hoy', dialog: 'Elegir fecha', close: 'Cerrar' }
const App = (props) => ({ render: () => h(GDatePicker, { labels: LABELS, label: 'Fecha', locale: 'es-MX', ...props }) })
const at = (y, m, d) => new Date(y, m - 1, d, 10, 0, 0)
// El servidor pinta el `server`; el cliente hidrata el `client`
async function run(props, server, client) {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(server)
  return hydrate(App(props), () => { vi.setSystemTime(client); return null })
}
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); document.body.innerHTML = '' })

describe('hidratación · GDatePicker · otro día en el cliente', () => {
  it('en línea con valor: sin desajustes; al montar, hoy es el día del cliente', async () => {
    const r = await run({ inline: true, modelValue: '2026-11-20' }, at(2026, 11, 7), at(2026, 11, 8))
    expect(r.mismatch).toEqual([])
    expect(r.html).not.toContain('is-today')
    await nextTick()
    expect(r.el.querySelector('.is-today [data-date], [data-date].is-today, .is-today')?.outerHTML || '').toContain('2026-11-08')
    expect(r.el.querySelector('[data-date="2026-11-07"]').getAttribute('aria-label')).not.toMatch(/hoy/)
    expect(r.el.querySelector('[data-date="2026-11-08"]').getAttribute('aria-label')).toMatch(/hoy$/)
    expect(r.el.querySelector('[data-date="2026-11-20"]').getAttribute('tabindex')).toBe('0')
  })

  it('en línea sin valor: sin desajustes; la rejilla llega al montar con el mes y el día del cliente', async () => {
    const r = await run({ inline: true }, at(2026, 10, 31), at(2026, 11, 1))
    expect(r.mismatch).toEqual([])
    expect(r.html).not.toContain('data-date')
    await nextTick()
    expect(r.el.querySelector('[data-date="2026-11-01"]').getAttribute('tabindex')).toBe('0')
    expect(r.el.querySelector('[data-date="2026-11-01"]').getAttribute('aria-label')).toMatch(/hoy$/)
  })

  it('campo cerrado sin valor: sin desajustes', async () => {
    const r = await run({}, at(2026, 11, 7), at(2026, 11, 8))
    expect(r.mismatch).toEqual([])
  })

  it('tramo con valor: sin desajustes', async () => {
    const r = await run({ inline: true, mode: 'range', modelValue: { start: '2026-11-05', end: '2026-11-09' } }, at(2026, 11, 7), at(2026, 11, 8))
    expect(r.mismatch).toEqual([])
  })
})
