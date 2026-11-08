// Hidratación de GCalendar con otro día en el cliente (#1033). Sin `now`, la hora actual se lee al montar: antes, ninguna
// columna es hoy y no hay línea de ahora. Sin `date`, la ventana visible depende de hoy y espera al montaje.
import { describe, it, expect, vi, afterEach } from 'vitest'
import { h, nextTick } from 'vue'
import GCalendar from './GCalendar.vue'
import { hydrate } from '../../utils/hydrationTestEnv.js'

const labels = {
  calendar: 'Calendario', previous: 'Anterior', next: 'Siguiente', today: 'Hoy', views: 'Vista', day: 'Día', week: 'Semana', month: 'Mes', timeline: 'Timeline',
  resources: 'Recursos', allDay: 'Día completo', now: 'ahora', noEvents: 'No hay eventos para este periodo.', loading: 'Cargando', retry: 'Reintentar', close: 'Cerrar',
  tooManyResources: 'Demasiados recursos', moreEvents: (n) => `+${n} más`, unavailable: (a, b, why) => `No disponible, ${a} a ${b}, ${why}`,
  createEvent: (r, d, t) => `Crear, ${d}, ${t}`, monthDay: (d, n) => `día, ${n} eventos`,
  eventName: (e, r, a, b) => `${e.title}, ${a}${b ? ' a ' + b : ''}`,
  conflict: { overlap: 'Traslape', blockedTime: 'Bloqueado', outsideAvailability: 'Fuera', invalidDuration: 'Duración', resourceConflict: 'Conflicto' },
  resourceStatus: { busyUntil: (x) => `Ocupado hasta ${x}`, available: 'Disponible', availableNext: (x) => `Disponible ${x}`, blocked: 'Bloqueado', activeEvent: 'Ocupado' }
}
const events = [{ id: 'e1', title: 'Turno abierto', start: '2026-11-07T09:00' }, { id: 'e2', title: 'Reunión', start: '2026-11-08T09:00', end: '2026-11-08T10:00' }]
const App = (props) => ({ render: () => h(GCalendar, { timezone: 'UTC', locale: 'es-MX', labels, events, label: 'Cal', refreshInterval: 3600000, ...props }) })
const utc = (s) => new Date(`${s}Z`)
async function run(props, server, client) {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(server)
  return hydrate(App(props), () => { vi.setSystemTime(client); return null })
}
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); document.body.innerHTML = '' })

describe('hidratación · GCalendar · otro día en el cliente', () => {
  for (const view of ['week', 'month', 'day', 'timeline']) {
    it(`${view} con date y sin now: sin desajustes; al montar, hoy es el día del cliente`, async () => {
      const r = await run({ view, date: '2026-11-07' }, utc('2026-11-07T10:00'), utc('2026-11-08T11:30'))
      expect(r.mismatch).toEqual([])
      expect(r.html).not.toContain('is-today')
      expect(r.html).not.toContain('g-calendar__now"')
      await nextTick()
      if (view === 'week' || view === 'month') expect(r.el.querySelector('.is-today').outerHTML).toMatch(/8/)
    })
  }

  it('semana sin date ni now: sin desajustes; al montar, la semana del cliente', async () => {
    const r = await run({ view: 'week' }, utc('2026-11-07T10:00'), utc('2026-11-15T10:00'))
    expect(r.mismatch).toEqual([])
    await nextTick()
    expect(r.el.querySelector('.g-calendar__head.is-today')).not.toBeNull()
    expect(r.el.querySelector('.g-calendar__head.is-today').textContent).toMatch(/15/)
  })

  it('con now: igual que antes (el servidor marca hoy y el cliente también)', async () => {
    const r = await run({ view: 'week', date: '2026-11-07', now: '2026-11-07T10:00' }, utc('2026-11-07T10:00'), utc('2026-11-08T10:00'))
    expect(r.mismatch).toEqual([])
    expect(r.html).toContain('is-today')
  })
})
