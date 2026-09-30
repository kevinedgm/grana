import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { h, nextTick, toRaw } from 'vue'
import GCalendar from './GCalendar.vue'

afterEach(() => vi.restoreAllMocks())

const MX = 'America/Mexico_City'
const labels = {
  calendar: 'Calendario', previous: 'Anterior', next: 'Siguiente', today: 'Hoy', views: 'Vista', day: 'Día', week: 'Semana', month: 'Mes', timeline: 'Timeline',
  resources: 'Recursos', allDay: 'Día completo', now: 'ahora', noEvents: 'No hay eventos para este periodo.', loading: 'Cargando', retry: 'Reintentar', close: 'Cerrar',
  tooManyResources: 'Demasiados recursos: usa Timeline.', moreEvents: (n) => `+${n} más`, unavailable: (a, b, why) => `No disponible, ${a} a ${b}, ${why}`,
  createEvent: (r, d, t) => `Crear evento en ${r ? r.title : ''}, ${d}, ${t}`, monthDay: (d, n) => `día, ${n} eventos`,
  eventName: (e, r, a, b, st) => `${e.title}, ${a}${b ? ' a ' + b : ', sin hora final'}, ${r ? r.title : ''}${st ? ', ' + st : ''}`,
  conflict: { overlap: 'Traslape', blockedTime: 'Tiempo bloqueado', outsideAvailability: 'Fuera de disponibilidad', invalidDuration: 'Duración no válida', resourceConflict: 'Conflicto de recurso' },
  resourceStatus: { busyUntil: (h) => `Ocupado hasta ${h}`, available: 'Disponible', availableNext: (h) => `Disponible · próximo evento ${h}`, blocked: 'Bloqueado', activeEvent: 'Ocupado · evento activo' }
}
const D = '2026-09-29'
const resources = [{ id: 'a', title: 'Recurso A' }, { id: 'b', title: 'Recurso B' }, { id: 'c', title: 'Recurso C' }]
const events = [
  { id: 'e1', resourceId: 'a', title: 'Reunión', start: `${D}T09:00`, end: `${D}T10:00`, color: 'accent', type: 'meeting' },
  { id: 'e2', resourceId: 'a', title: 'Revisión', start: `${D}T10:15`, end: `${D}T11:00`, status: 'tentative' },
  { id: 'e3', resourceId: 'a', title: 'Llamada', start: `${D}T10:30`, end: `${D}T11:15` },
  { id: 'e4', resourceId: 'a', title: 'Cita corta', start: `${D}T12:43`, end: `${D}T13:12` },
  { id: 'e5', resourceId: 'a', title: 'Trámite', start: `${D}T09:03`, end: `${D}T09:08` },
  { id: 'e6', resourceId: 'a', title: 'Turno activo', start: `${D}T09:37` },
  { id: 'e7', resourceId: 'a', title: 'Antes de las 7', start: `${D}T06:30`, end: `${D}T06:50` },
  { id: 'e8', resourceId: 'a', title: 'Feriado', allDay: true, start: `${D}T00:00`, end: '2026-09-30T00:00' },
  { id: 'e9', resourceId: 'b', title: 'Inspección', start: `${D}T09:30`, end: `${D}T10:00` }
]
const blocks = [{ id: 'k1', resourceId: 'a', start: `${D}T14:00`, end: `${D}T15:00`, reason: 'Descanso' }]
const availability = [{ resourceId: 'a', dayOfWeek: 2, startTime: '09:00', endTime: '18:00', pauses: [{ startTime: '14:00', endTime: '15:00' }] }]
const base = { timezone: MX, locale: 'es-MX', labels, date: D, now: `${D}T10:10`, events, blocks, availability, resources, view: 'day', label: 'Cal' }
const mk = (props = {}, opts = {}) => mount(GCalendar, { props: { ...base, ...props }, ...opts })
const ev = (w, title) => w.findAll('.g-calendar__event').find((b) => b.text().includes(title))
const li = (w, title) => ev(w, title).element.closest('li')
const v = (el, name) => el.style.getPropertyValue(name)

describe('GCalendar · estructura y semántica', () => {
  it('región con nombre, barra, viewport y región viva', () => {
    const w = mk()
    const root = w.find('.g-calendar')
    expect(root.attributes('role')).toBe('region')
    expect(root.attributes('aria-label')).toBe('Cal')
    expect(root.classes()).toEqual(expect.arrayContaining(['g-calendar--view-day', 'g-calendar--density-comfortable', 'g-calendar--mode-desktop']))
    expect(w.find('.g-calendar__toolbar').attributes('role')).toBe('toolbar')
    expect(w.find('.g-calendar__live').attributes('aria-live')).toBe('polite')
    expect(v(root.element, '--_grid')).toBe('30')
  })

  it('los botones de vista llevan aria-pressed true/false', () => {
    const w = mk({ view: 'week' })
    const b = w.findAll('.g-calendar__views button')
    expect(b.map((x) => [x.text(), x.attributes('aria-pressed')])).toEqual([['Día', 'false'], ['Semana', 'true'], ['Mes', 'false'], ['Timeline', 'false']])
  })

  it('validadores de las props enumeradas', () => {
    for (const n of ['view', 'density']) expect(GCalendar.props[n].validator('otro')).toBe(false)
    expect(GCalendar.props.view.validator('timeline')).toBe(true)
  })

  it('los eventos y bloqueos van en UNA lista, en orden cronológico', () => {
    const w = mk()
    const list = w.find('ul.g-calendar__events')
    const starts = [...list.element.children].map((l) => Number(v(l, '--_start')))
    expect(starts.length).toBeGreaterThan(5)
    expect(starts).toEqual([...starts].sort((a, b) => a - b))
  })

  it('el eje, la disponibilidad, la línea de ahora y el fantasma son decorativos (aria-hidden)', () => {
    const w = mk()
    for (const c of ['.g-calendar__axis', '.g-calendar__availability', '.g-calendar__now']) expect(w.find(c).attributes('aria-hidden')).toBe('true')
  })
})

describe('GCalendar · posición por tiempo real', () => {
  it('minutos arbitrarios sin redondeo: 12:43 = 343 min desde las 07:00, 29 min de duración', () => {
    const w = mk()
    const l = li(w, 'Cita corta')
    expect([v(l, '--_start'), v(l, '--_dur')]).toEqual(['343', '29'])
  })

  it('un evento de 5 minutos conserva su posición real (el alto mínimo lo pone el CSS)', () => {
    const l = li(mk(), 'Trámite')
    expect([v(l, '--_start'), v(l, '--_dur')]).toEqual(['123', '5'])
  })

  it('evento abierto: de su inicio a ahora (10:10)', () => {
    const w = mk()
    const l = li(w, 'Turno activo')
    expect([v(l, '--_start'), v(l, '--_dur')]).toEqual(['157', '33'])
    expect(ev(w, 'Turno activo').classes()).toContain('g-calendar__event--open')
    expect(ev(w, 'Turno activo').attributes('data-status')).toBe('active')
    expect(ev(w, 'Turno activo').text()).not.toContain('–')
  })

  it('carriles: dos eventos traslapados en dos carriles y uno solo ocupa todo', () => {
    const w = mk()
    const lanes = ['Revisión', 'Llamada'].map((t) => [v(li(w, t), '--_lane'), v(li(w, t), '--_lanes')])
    expect(new Set(lanes.map((x) => x[0])).size).toBe(2)
    expect(lanes.every((x) => x[1] === '2')).toBe(true)
    expect(v(li(w, 'Cita corta'), '--_lanes')).toBe('1')
  })

  it('tres eventos traslapados: tres carriles', () => {
    const w = mk({ events: [1, 2, 3].map((i) => ({ id: 'o' + i, resourceId: 'a', title: 'O' + i, start: `${D}T1${i}:00`, end: `${D}T1${i + 3}:00` })) })
    expect(['O1', 'O2', 'O3'].map((t) => v(li(w, t), '--_lanes'))).toEqual(['3', '3', '3'])
  })

  it('la zona horaria cambia dónde cae un evento', () => {
    const w = mk({ timezone: 'Europe/Madrid', events: [{ id: 'x', resourceId: 'a', title: 'X', start: `${D}T09:00:00-06:00`, end: `${D}T10:00:00-06:00` }] })
    expect(v(li(w, 'X'), '--_start')).toBe(String(17 * 60 - 420))
    expect(w.find('.g-calendar__now').exists()).toBe(true)
  })

  it('un evento fuera del rango visible no se dibuja y se cuenta en el aviso', () => {
    const w = mk({ labels: { ...labels, outOfRange: (n, a, b) => `${n} fuera (${a}–${b})` } })
    expect(ev(w, 'Antes de las 7')).toBeUndefined()
    expect(w.text()).toContain('1 fuera (07:00–22:00)')
  })

  it('una sola línea de ahora por ventana: abarca las columnas de hoy, en su minuto', () => {
    const w = mk({ resources: [resources[0], resources[1]] })
    const nows = w.findAll('.g-calendar__now')
    expect(nows.length).toBe(1)
    expect(v(nows[0].element, '--_start')).toBe('190')
    expect(v(nows[0].element, '--_span')).toBe('2')
    const wk = mk({ view: 'week' })
    expect(wk.findAll('.g-calendar__now').length).toBe(1)
    expect(v(wk.find('.g-calendar__now').element, '--_span')).toBe('1')
  })

  it('la marca de hoy (píldora y aria-current) va en las fechas de Semana, no en cada recurso del Día', () => {
    expect(mk({ resources }).findAll('.g-calendar__head.is-today').length).toBe(0)
    expect(mk({ view: 'week' }).findAll('.g-calendar__head.is-today').length).toBe(1)
  })

  it('showNowIndicator=false quita la línea', () => {
    expect(mk({ showNowIndicator: false }).find('.g-calendar__now').exists()).toBe(false)
  })

  it('disponibilidad: franjas antes, pausa y después de la jornada', () => {
    const bands = mk().findAll('.g-calendar__availability > div').map((b) => [v(b.element, '--_start'), v(b.element, '--_dur')])
    expect(bands).toEqual([['0', '120'], ['420', '60'], ['660', '240']])
  })

  it('bloqueo: elemento de la lista con texto para lectores', () => {
    const b = mk().find('.g-calendar__block')
    expect([v(b.element, '--_start'), v(b.element, '--_dur')]).toEqual(['420', '60'])
    expect(b.find('.g-calendar__sr').text()).toBe('No disponible, 14:00 a 15:00, Descanso')
  })

  it('día completo: región propia, fuera del eje', () => {
    const w = mk()
    expect(w.find('.g-calendar__allday').text()).toContain('Feriado')
    expect(w.find('.g-calendar__events').text()).not.toContain('Feriado')
  })

  it('nombre accesible del evento con labels.eventName', () => {
    const w = mk()
    expect(ev(w, 'Cita corta').attributes('aria-label')).toBe('Cita corta, 12:43 a 13:12, Recurso A')
    expect(ev(w, 'Turno activo').attributes('aria-label')).toBe('Turno activo, 09:37, sin hora final, Recurso A, active')
  })

  it('color, tipo y estado del evento salen como atributos de datos (nunca solo color)', () => {
    const e = ev(mk(), 'Reunión')
    expect([e.attributes('data-color'), e.attributes('data-type')]).toEqual(['accent', 'meeting'])
    expect(ev(mk(), 'Revisión').attributes('data-status')).toBe('tentative')
  })

  it('las fechas aceptan Date, ISO con desfase y texto sin desfase (hora local del calendario)', () => {
    const w = mk({ events: [
      { id: '1', resourceId: 'a', title: 'D', start: new Date('2026-09-29T15:00:00Z'), end: new Date('2026-09-29T16:00:00Z') },
      { id: '2', resourceId: 'a', title: 'I', start: '2026-09-29T09:00:00-06:00', end: '2026-09-29T10:00:00-06:00' },
      { id: '3', resourceId: 'a', title: 'L', start: '2026-09-29T09:00', end: '2026-09-29T10:00' }
    ] })
    expect(['D', 'I', 'L'].map((t) => v(li(w, t), '--_start'))).toEqual(['120', '120', '120'])
  })

  it('sin timezone: UTC explícita y aviso en desarrollo', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mk({ timezone: undefined })
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('timezone'))
  })
})

describe('GCalendar · vistas', () => {
  it('Día: una columna por recurso (hasta 5) con su cabecera', () => {
    const w = mk({ resources })
    expect(w.findAll('.g-calendar__col').length).toBe(3)
    expect(w.findAll('.g-calendar__head').map((h) => h.find('.g-calendar__head-title').text())).toEqual(['Recurso A', 'Recurso B', 'Recurso C'])
    expect(v(w.find('.g-calendar__grid').element, '--_cols')).toBe('3')
  })

  it('Día con más de 5 recursos: aviso y solo cinco columnas', () => {
    const many = [...Array(7)].map((_, i) => ({ id: 'r' + i, title: 'R' + i }))
    const w = mk({ resources: many })
    expect(w.findAll('.g-calendar__col').length).toBe(5)
    expect(w.find('.g-calendar__status').text()).toBe('Demasiados recursos: usa Timeline.')
  })

  it('Semana: siete columnas de un recurso, lunes primero, hoy marcado', () => {
    const w = mk({ view: 'week' })
    expect(w.findAll('.g-calendar__col').length).toBe(7)
    expect(w.findAll('.g-calendar__col').map((c) => c.attributes('data-date'))[0]).toBe('2026-09-28')
    expect(w.findAll('.g-calendar__head.is-today').length).toBe(1)
    expect(w.find('.g-calendar__head.is-today').attributes('aria-current')).toBe('date')
    expect(w.find('.g-calendar__resource-select').exists()).toBe(true)
  })

  it('Semana con weekStartsOn=0 empieza en domingo', () => {
    expect(mk({ view: 'week', weekStartsOn: 0 }).find('.g-calendar__col').attributes('data-date')).toBe('2026-09-27')
  })

  it('Mes: 42 celdas, máximo visible configurable y +N', () => {
    const many = [...Array(6)].map((_, i) => ({ id: 'm' + i, resourceId: 'a', title: 'M' + i, start: `${D}T${String(9 + i).padStart(2, '0')}:00`, end: `${D}T${String(9 + i).padStart(2, '0')}:30` }))
    const w = mk({ view: 'month', events: many, monthMaxVisibleEvents: 3 })
    expect(w.findAll('.g-calendar__month td').length).toBe(42)
    const cell = w.findAll('.g-calendar__month td').find((c) => c.find('.g-calendar__day').attributes('data-date') === D)
    expect(cell.findAll('.g-calendar__event').length).toBe(3)
    expect(cell.find('.g-calendar__more').text()).toBe('+3 más')
    expect(cell.attributes('aria-current')).toBe('date')
    expect(w.findAll('td.is-outside').length).toBeGreaterThan(0)
  })

  it('Timeline: una fila por recurso, un solo eje y una sola línea de ahora', () => {
    const w = mk({ view: 'timeline' })
    expect(w.findAll('.g-calendar__row').length).toBe(3)
    expect(w.findAll('.g-calendar__now').length).toBe(1)
    expect(v(w.find('.g-calendar__timeline').element, '--_minutes')).toBe('900')
    expect(v(w.find('.g-calendar__track').element, '--_lanes')).toBeTruthy()
  })

  it('Timeline: el mismo instante cae en el mismo minuto en todas las filas', () => {
    const w = mk({ view: 'timeline', events: [
      { id: '1', resourceId: 'a', title: 'A9', start: `${D}T09:00`, end: `${D}T10:00` },
      { id: '2', resourceId: 'b', title: 'B9', start: `${D}T09:00`, end: `${D}T10:00` }
    ] })
    expect(v(li(w, 'A9'), '--_start')).toBe(v(li(w, 'B9'), '--_start'))
  })

  it('un evento en varios recursos aparece en cada uno con el mismo id', () => {
    const w = mk({ resources: [resources[0], resources[1]], events: [{ id: 's', resourceIds: ['a', 'b'], title: 'Compartido', start: `${D}T09:00`, end: `${D}T10:00` }] })
    const b = w.findAll('.g-calendar__event')
    expect(b.length).toBe(2)
    expect(b.map((x) => x.attributes('data-resource'))).toEqual(['a', 'b'])
    expect(new Set(b.map((x) => x.attributes('data-id'))).size).toBe(1)
  })

  it('sin resources: un recurso implícito y los eventos sin resourceId le pertenecen', () => {
    const w = mk({ resources: undefined, availability: [], blocks: [], events: [{ id: '1', title: 'Solo', start: `${D}T09:00`, end: `${D}T10:00` }] })
    expect(w.findAll('.g-calendar__col').length).toBe(1)
    expect(ev(w, 'Solo')).toBeDefined()
  })

  it('un evento que cruza la medianoche se recorta al día y al rango visible', () => {
    const ev1 = [{ id: 'n', resourceId: 'a', title: 'Noche', start: `${D}T21:00`, end: '2026-09-30T02:00' }]
    expect(v(li(mk({ events: ev1 }), 'Noche'), '--_dur')).toBe('60')                       // hasta las 22:00, fin del rango visible
    expect(v(li(mk({ events: ev1, endHour: 24 }), 'Noche'), '--_dur')).toBe('180')        // hasta la medianoche
    const next = mk({ events: ev1, date: '2026-09-30', startHour: 0 })
    expect([v(li(next, 'Noche'), '--_start'), v(li(next, 'Noche'), '--_dur')]).toEqual(['0', '120'])   // continúa el día siguiente
  })

  it('densidad: cambia la clase de la raíz', () => {
    expect(mk({ density: 'spacious' }).find('.g-calendar').classes()).toContain('g-calendar--density-spacious')
  })
})

describe('GCalendar · v-model, navegación y range-change', () => {
  it('emite range-change al montar con el rango del día (fin exclusivo)', () => {
    const w = mk()
    const r = w.emitted('range-change')[0][0]
    expect(r.view).toBe('day')
    expect(r.timezone).toBe(MX)
    expect(r.start.toISOString()).toBe('2026-09-29T06:00:00.000Z')
    expect(r.end.toISOString()).toBe('2026-09-30T06:00:00.000Z')
  })

  it('el rango de Semana y de Mes cubre semana completa y 42 días', () => {
    const wk = mk({ view: 'week' }).emitted('range-change')[0][0]
    expect((wk.end - wk.start) / 86400000).toBe(7)
    const mo = mk({ view: 'month' }).emitted('range-change')[0][0]
    expect((mo.end - mo.start) / 86400000).toBe(42)
  })

  it('anterior, hoy y siguiente emiten update:date con un Date en la medianoche del calendario', async () => {
    const w = mk()
    await w.find('.g-calendar__next').trigger('click')
    expect(w.emitted('update:date')[0][0].toISOString()).toBe('2026-09-30T06:00:00.000Z')
    await w.find('.g-calendar__prev').trigger('click')
    expect(w.emitted('update:date')[1][0].toISOString()).toBe('2026-09-28T06:00:00.000Z')
    await w.find('.g-calendar__today').trigger('click')
    expect(w.emitted('update:date')[2][0].toISOString()).toBe('2026-09-29T06:00:00.000Z')
  })

  it('siguiente avanza según la vista (día, semana, mes)', async () => {
    const wk = mk({ view: 'week' })
    await wk.find('.g-calendar__next').trigger('click')
    expect(wk.emitted('update:date')[0][0].toISOString()).toBe('2026-10-06T06:00:00.000Z')
    const mo = mk({ view: 'month' })
    await mo.find('.g-calendar__next').trigger('click')
    expect(mo.emitted('update:date')[0][0].toISOString()).toBe('2026-10-01T06:00:00.000Z')
  })

  it('cambiar de vista emite update:view y un nuevo range-change', async () => {
    const w = mk()
    await w.findAll('.g-calendar__views button')[1].trigger('click')
    expect(w.emitted('update:view')[0]).toEqual(['week'])
    await w.setProps({ view: 'week' })
    expect(w.emitted('range-change').pop()[0].view).toBe('week')
  })

  it('sin v-model funciona con estado propio', async () => {
    const w = mount(GCalendar, { props: { ...base, view: undefined, date: undefined } })
    await w.findAll('.g-calendar__views button')[2].trigger('click')
    expect(w.find('.g-calendar--view-month').exists()).toBe(true)
  })

  it('Semana: el selector de recurso cambia la columna mostrada', async () => {
    const w = mk({ view: 'week' })
    await w.find('.g-calendar__resource-select select').setValue('b')
    expect(ev(w, 'Inspección')).toBeDefined()
    expect(ev(w, 'Cita corta')).toBeUndefined()
  })

  it('clic en un día del Mes emite date-click y abre el Día', async () => {
    const w = mk({ view: 'month' })
    await w.find(`.g-calendar__day[data-date="${D}"]`).trigger('click')
    expect(w.emitted('date-click')[0][0].date.toISOString()).toBe('2026-09-29T06:00:00.000Z')
    expect(w.emitted('update:view').pop()).toEqual(['day'])
  })

  it('+N emite more-events-click', async () => {
    const many = [...Array(5)].map((_, i) => ({ id: 'm' + i, resourceId: 'a', title: 'M' + i, start: `${D}T${String(9 + i).padStart(2, '0')}:00`, end: `${D}T${String(9 + i).padStart(2, '0')}:30` }))
    const w = mk({ view: 'month', events: many })
    await w.find('.g-calendar__more').trigger('click')
    expect(w.emitted('more-events-click')[0][0]).toMatchObject({ hidden: 2 })
  })
})

describe('GCalendar · solicitudes (nunca mutan)', () => {
  const editable = { editable: true, events: events.map((e) => ({ ...e })) }
  const key = (w, title, k, mods = {}) => ev(w, title).trigger('keydown', { key: k, ...mods })

  it('Alt+↓ emite event-move-request con valores previo y nuevo, y NO cambia el evento', async () => {
    const w = mk(editable)
    const raw = editable.events.find((e) => e.id === 'e4')
    const before = raw.start
    await key(w, 'Cita corta', 'ArrowDown', { altKey: true })
    const r = w.emitted('event-move-request')[0][0]
    expect(toRaw(r.event)).toBe(toRaw(raw))
    expect(r.resourceId).toBe('a')
    expect(r.newResourceId).toBe('a')
    expect(r.newStart - r.previousStart).toBe(5 * 60000)
    expect(r.newEnd - r.previousEnd).toBe(5 * 60000)
    expect(r.conflicts).toEqual([])
    expect(raw.start).toBe(before)
    expect(toRaw(raw).end).toBe(`${D}T13:12`)
  })

  it('Shift+↓ emite event-resize-request con el nuevo fin', async () => {
    const w = mk(editable)
    await key(w, 'Cita corta', 'ArrowDown', { shiftKey: true })
    const r = w.emitted('event-resize-request')[0][0]
    expect(r.newEnd - r.previousEnd).toBe(5 * 60000)
    expect(r.conflicts).toEqual([])
  })

  it('el paso es snapInterval', async () => {
    const w = mk({ ...editable, snapInterval: 15 })
    await key(w, 'Cita corta', 'ArrowUp', { altKey: true })
    const r = w.emitted('event-move-request')[0][0]
    expect(r.previousStart - r.newStart).toBe(15 * 60000)
  })

  it('un conflicto se informa (conflict) además de emitir la solicitud', async () => {
    const w = mk(editable)
    // Cita corta 12:43–13:12: alargarla hasta invadir el bloqueo de 14:00 (cada paso 5 min) → una sola vez basta con snap grande
    const w2 = mk({ ...editable, snapInterval: 60 })
    await key(w2, 'Cita corta', 'ArrowDown', { shiftKey: true })
    const req = w2.emitted('event-resize-request')[0][0]
    expect(req.conflicts.map((c) => c.type)).toContain('blockedTime')
    const c = w2.emitted('conflict')[0][0]
    expect(c.type).toBe('blockedTime')
    await new Promise((r) => setTimeout(r, 60))
    expect(w2.find('.g-calendar__live').text()).toBe('Tiempo bloqueado')
    expect(w.emitted('conflict')).toBeUndefined()
  })

  it('overlap y outsideAvailability se detectan', async () => {
    const w = mk({ ...editable, snapInterval: 60 })
    await key(w, 'Reunión', 'ArrowUp', { altKey: true })   // 08:00–09:00, antes de la jornada de las 09:00
    expect(w.emitted('event-move-request')[0][0].conflicts.map((c) => c.type)).toContain('outsideAvailability')
    const w2 = mk({ ...editable, snapInterval: 60 })
    await key(w2, 'Llamada', 'ArrowUp', { altKey: true })    // 09:30–10:15 solapa con Reunión
    expect(w2.emitted('event-move-request')[0][0].conflicts.map((c) => c.type)).toContain('overlap')
  })

  it('detectConflicts=false: la solicitud sale sin lista de conflictos', async () => {
    const w = mk({ ...editable, snapInterval: 60, detectConflicts: false })
    await key(w, 'Cita corta', 'ArrowDown', { shiftKey: true })
    expect(w.emitted('event-resize-request')[0][0].conflicts).toEqual([])
    expect(w.emitted('conflict')).toBeUndefined()
  })

  it('un evento abierto no se redimensiona ni se mueve por teclado', async () => {
    const w = mk(editable)
    await key(w, 'Turno activo', 'ArrowDown', { shiftKey: true })
    await key(w, 'Turno activo', 'ArrowDown', { altKey: true })
    expect(w.emitted('event-resize-request')).toBeUndefined()
    expect(w.emitted('event-move-request')).toBeUndefined()
  })

  it('sin editable, readonly o disabled no hay solicitudes ni tiradores', async () => {
    for (const extra of [{}, { editable: true, readonly: true }, { editable: true, disabled: true }]) {
      const w = mk({ events: events.map((e) => ({ ...e })), ...extra })
      await key(w, 'Cita corta', 'ArrowDown', { altKey: true })
      expect(w.emitted('event-move-request')).toBeUndefined()
      expect(w.findAll('.g-calendar__handle').length).toBe(0)
    }
  })

  it('editable/draggable/resizable por evento sobrescriben la prop global', async () => {
    const evs = [{ id: 'z', resourceId: 'a', title: 'Fijo', start: `${D}T09:00`, end: `${D}T10:00`, draggable: false }]
    const w = mk({ editable: true, events: evs })
    await key(w, 'Fijo', 'ArrowDown', { altKey: true })
    expect(w.emitted('event-move-request')).toBeUndefined()
    await key(w, 'Fijo', 'ArrowDown', { shiftKey: true })
    expect(w.emitted('event-resize-request')).toBeTruthy()
  })

  it('el tirador existe solo si el evento se puede redimensionar y no está abierto', () => {
    const w = mk(editable)
    const withHandle = w.findAll('.g-calendar__events > li').filter((l) => l.find('.g-calendar__handle').exists())
    expect(withHandle.length).toBeGreaterThan(0)
    expect(li(w, 'Turno activo').querySelector('.g-calendar__handle')).toBeNull()
    expect(w.find('.g-calendar__handle').attributes('aria-hidden')).toBe('true')
  })

  it('el botón de teclado "Crear evento" emite create-request con source keyboard y sin mutar', async () => {
    const w = mk({ ...editable, resources: [resources[0]] })
    const btn = w.find('.g-calendar__create')
    expect(btn.text()).toBe('Crear evento en Recurso A, 2026-09-29, 09:00')
    await btn.trigger('click')
    const r = w.emitted('create-request')[0][0]
    expect(r).toMatchObject({ resourceId: 'a', timezone: MX, source: 'keyboard' })
    expect(r.start.toISOString()).toBe('2026-09-29T15:00:00.000Z')
    expect(w.emitted('time-click')).toBeTruthy()
  })

  it('slotDuration de la disponibilidad propone el fin al crear', async () => {
    const w = mk({ ...editable, resources: [resources[0]], availability: [{ ...availability[0], slotDuration: 45 }] })
    await w.find('.g-calendar__create').trigger('click')
    const r = w.emitted('create-request')[0][0]
    expect(r.end - r.start).toBe(45 * 60000)
  })

  it('sin editable no hay botón de creación', () => {
    expect(mk().find('.g-calendar__create').exists()).toBe(false)
  })

  it('un bloqueo que cubre eventos emite block-conflict con los eventos impactados (sin tocarlos)', () => {
    const w = mk({ blocks: [{ id: 'kx', resourceId: 'a', start: `${D}T09:30`, end: `${D}T09:45`, reason: 'X' }] })
    const c = w.emitted('block-conflict')[0][0]
    expect(c.block.id).toBe('kx')
    expect(c.impactedEvents.map((e) => e.id)).toEqual(expect.arrayContaining(['e1']))
  })
})

describe('GCalendar · pointer', () => {
  function stubGeometry(w) {
    const cols = w.findAll('.g-calendar__col')
    cols.forEach((c) => { c.element.getBoundingClientRect = () => ({ top: 0, left: 0, width: 200, height: 900, right: 200, bottom: 900 }) })
  }
  const ptr = (target, type, xy) => target.dispatchEvent(new MouseEvent(type, { bubbles: true, button: 0, clientX: xy[0], clientY: xy[1] }))

  it('un clic en un hueco emite create-request con el inicio ajustado a snapInterval', async () => {
    const w = mk({ editable: true, resources: [resources[0]] })
    stubGeometry(w)
    const col = w.find('.g-calendar__col').element
    ptr(col, 'pointerdown', [50, 508])       // 7:00 + 508 min = 15:28 → 15:30
    ptr(document, 'pointerup', [50, 508])
    await nextTick()
    const r = w.emitted('create-request')[0][0]
    expect(r.source).toBe('pointer')
    expect(r.start.toISOString()).toBe('2026-09-29T21:30:00.000Z')
    expect(r.end).toBeUndefined()
  })

  it('arrastrar sobre un hueco emite el rango', async () => {
    const w = mk({ editable: true, resources: [resources[0]] })
    stubGeometry(w)
    const col = w.find('.g-calendar__col').element
    ptr(col, 'pointerdown', [50, 480])   // 15:00
    ptr(document, 'pointermove', [50, 540])
    await nextTick()
    expect(w.find('.g-calendar__ghost').exists()).toBe(true)
    ptr(document, 'pointerup', [50, 540])
    await nextTick()
    const r = w.emitted('create-request')[0][0]
    expect(r.end - r.start).toBe(60 * 60000)
    expect(w.find('.g-calendar__ghost').exists()).toBe(false)
  })

  it('Esc durante un arrastre lo cancela sin emitir nada', async () => {
    const w = mk({ editable: true, resources: [resources[0]] })
    stubGeometry(w)
    ptr(w.find('.g-calendar__col').element, 'pointerdown', [50, 480])
    ptr(document, 'pointermove', [50, 540])
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    ptr(document, 'pointerup', [50, 540])
    await nextTick()
    expect(w.emitted('create-request')).toBeUndefined()
  })

  it('arrastrar un evento emite event-move-request con snap y sin mutar', async () => {
    const evs = events.map((e) => ({ ...e }))
    const w = mk({ editable: true, resources: [resources[0]], events: evs })
    stubGeometry(w)
    const btn = ev(w, 'Cita corta')
    ptr(btn.element, 'pointerdown', [50, 350])
    ptr(document, 'pointermove', [50, 410])   // +60 min
    ptr(document, 'pointerup', [50, 410])
    await nextTick()
    const r = w.emitted('event-move-request')[0][0]
    expect(r.newStart.getUTCMinutes() % 5).toBe(0)                                        // el snap es absoluto: 13:45, no 13:43
    expect(Math.abs(r.newStart - r.previousStart - 60 * 60000)).toBeLessThanOrEqual(5 * 60000)
    expect(r.newEnd - r.newStart).toBe(r.previousEnd - r.previousStart)                   // conserva la duración
    expect(evs.find((e) => e.id === 'e4').start).toBe(`${D}T12:43`)
    expect(w.emitted('event-click')).toBeUndefined()      // el arrastre no cuenta como clic
  })

  it('arrastrar el tirador emite event-resize-request', async () => {
    const w = mk({ editable: true, resources: [resources[0]], events: events.map((e) => ({ ...e })) })
    stubGeometry(w)
    const handle = li(w, 'Cita corta').querySelector('.g-calendar__handle')
    ptr(handle, 'pointerdown', [50, 372])
    ptr(document, 'pointermove', [50, 402])
    ptr(document, 'pointerup', [50, 402])
    await nextTick()
    const r = w.emitted('event-resize-request')[0][0]
    expect(r.newEnd.getUTCMinutes() % 5).toBe(0)
    expect(Math.abs(r.newEnd - r.previousEnd - 30 * 60000)).toBeLessThanOrEqual(5 * 60000)
  })

  it('con readonly el puntero no crea ni mueve', async () => {
    const w = mk({ editable: true, readonly: true, resources: [resources[0]] })
    stubGeometry(w)
    ptr(w.find('.g-calendar__col').element, 'pointerdown', [50, 480])
    ptr(document, 'pointerup', [50, 480])
    await nextTick()
    expect(w.emitted('create-request')).toBeUndefined()
  })
})

describe('GCalendar · selección, detalle y teclado', () => {
  it('clic en un evento emite event-click, actualiza selectedEventId y abre el detalle (slot)', async () => {
    const w = mk({ resources: [resources[0]] }, { slots: { detail: ({ event, close }) => h('div', { class: 'mi-detalle' }, [event.title, h('button', { onClick: close, class: 'x' }, 'x')]) } })
    await ev(w, 'Cita corta').trigger('click')
    expect(w.emitted('event-click')[0][0].event.id).toBe('e4')
    expect(w.emitted('update:selectedEventId')[0]).toEqual(['e4'])
    expect(w.find('.g-calendar__detail .mi-detalle').text()).toContain('Cita corta')
    expect(w.find('.g-calendar__detail').attributes('role')).toBe('dialog')
    expect(ev(w, 'Cita corta').classes()).toContain('is-selected')
  })

  it('Esc cierra el detalle y devuelve el foco al evento', async () => {
    const w = mk({ resources: [resources[0]], selectedEventId: 'e4' }, { slots: { detail: () => h('div', 'Detalle') }, attachTo: document.body })
    await ev(w, 'Cita corta').trigger('keydown', { key: 'Escape' })
    expect(w.emitted('update:selectedEventId')[0]).toEqual([null])
    w.unmount()
  })

  it('doble clic emite event-double-click', async () => {
    const w = mk()
    await ev(w, 'Cita corta').trigger('dblclick')
    expect(w.emitted('event-double-click')[0][0].event.id).toBe('e4')
  })

  it('Enter y Espacio activan el evento', async () => {
    const w = mk()
    await ev(w, 'Cita corta').trigger('keydown', { key: 'Enter' })
    await ev(w, 'Reunión').trigger('keydown', { key: ' ' })
    expect(w.emitted('event-click').map((c) => c[0].event.id)).toEqual(['e4', 'e1'])
  })

  it('un solo punto de tabulación en la vista (tabulación itinerante)', () => {
    const w = mk({ resources })
    expect(w.findAll('.g-calendar__event').filter((b) => b.attributes('tabindex') === '0').length).toBe(1)
  })

  it('las flechas recorren los eventos de la lista y pasan a la lista vecina', async () => {
    const w = mk({ resources: [resources[0], resources[1]] }, { attachTo: document.body })
    const first = w.findAll('.g-calendar__event').find((b) => b.attributes('data-key') && b.element.closest('ul.g-calendar__events'))
    first.element.focus()
    await first.trigger('keydown', { key: 'ArrowDown' })
    expect(document.activeElement).not.toBe(first.element)
    expect(document.activeElement.closest('ul')).toBe(first.element.closest('ul'))
    const last = [...w.element.querySelectorAll('ul.g-calendar__events')][0]
    const lastBtn = [...last.querySelectorAll('.g-calendar__event')].pop()
    lastBtn.focus()
    await w.findAll('.g-calendar__event').find((b) => b.element === lastBtn).trigger('keydown', { key: 'ArrowRight' })
    expect(document.activeElement.closest('ul')).not.toBe(last)
    w.unmount()
  })
})

describe('GCalendar · estados', () => {
  it('loading conserva la barra y muestra esqueleto con aria-busy', () => {
    const w = mk({ loading: true })
    expect(w.find('.g-calendar').attributes('aria-busy')).toBe('true')
    expect(w.find('.g-calendar__toolbar').exists()).toBe(true)
    expect(w.find('.g-calendar__skeleton').exists()).toBe(true)
    expect(w.find('.g-calendar__col').exists()).toBe(false)
  })

  it('error: alerta con reintento que emite retry; conserva la barra', async () => {
    const w = mk({ error: 'No fue posible cargar.' })
    const alert = w.find('[role="alert"]')
    expect(alert.text()).toContain('No fue posible cargar.')
    await alert.find('.g-calendar__retry').trigger('click')
    expect(w.emitted('retry')).toHaveLength(1)
    expect(w.find('.g-calendar__toolbar').exists()).toBe(true)
  })

  it('vacío: mensaje sin ocultar la rejilla, la disponibilidad ni los bloqueos', () => {
    const w = mk({ events: [] })
    expect(w.text()).toContain('No hay eventos para este periodo.')
    expect(w.find('.g-calendar__col').exists()).toBe(true)
    expect(w.find('.g-calendar__availability').exists()).toBe(true)
    expect(w.find('.g-calendar__block').exists()).toBe(true)
  })

  it('el slot empty sustituye el mensaje', () => {
    const w = mk({ events: [] }, { slots: { empty: () => h('p', { class: 'vacio' }, 'Nada') } })
    expect(w.find('.vacio').exists()).toBe(true)
  })

  it('disabled: aria-disabled y botones de la barra deshabilitados', () => {
    const w = mk({ disabled: true })
    expect(w.find('.g-calendar').attributes('aria-disabled')).toBe('true')
    expect(w.find('.g-calendar__next').attributes('disabled')).toBeDefined()
  })

  it('avisa en desarrollo si faltan textos o el nombre accesible', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount(GCalendar, { props: { timezone: MX, date: D, view: 'day' } })
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('labels.'))
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('nombre accesible'))
  })

  it('los slots resource, day-header, event-content y month-day reciben sus datos', () => {
    const w = mk({ resources: [resources[0]] }, { slots: { resource: ({ resource }) => h('i', { class: 'sr-res' }, resource.title), 'event-content': ({ event, segment }) => h('b', { class: 'sr-ev' }, event.title + '|' + segment.open) } })
    expect(w.find('.sr-res').text()).toBe('Recurso A')
    expect(w.find('.sr-ev').text()).toMatch(/\|(true|false)$/)
    const wk = mk({ view: 'week' }, { slots: { 'day-header': ({ date }) => h('u', { class: 'sr-day' }, date.toISOString().slice(0, 10)) } })
    expect(wk.findAll('.sr-day').length).toBe(7)
    const mo = mk({ view: 'month' }, { slots: { 'month-day': ({ events: es }) => h('s', { class: 'sr-month' }, String(es.length)) } })
    expect(mo.findAll('.sr-month').length).toBe(42)
  })
})

describe('GCalendar · adaptación por dispositivo (ancho de la propia raíz)', () => {
  function withWidth(width, props) {
    const original = globalThis.ResizeObserver
    let cb
    globalThis.ResizeObserver = class { constructor(f) { cb = f } observe() {} disconnect() {} }
    const w = mk(props)
    cb([{ contentRect: { width } }])
    globalThis.ResizeObserver = original
    return w
  }

  it('escritorio, tableta y teléfono según el ancho', async () => {
    for (const [width, mode] of [[900, 'desktop'], [650, 'tablet'], [400, 'phone']]) {
      const w = withWidth(width)
      await nextTick()
      expect(w.find('.g-calendar').classes()).toContain(`g-calendar--mode-${mode}`)
    }
  })

  it('teléfono: Timeline y Día con varios recursos pasan a la lista de recursos con estado', async () => {
    const w = withWidth(400, { view: 'timeline', resources })
    await nextTick()
    const items = w.findAll('.g-calendar__resource')
    expect(items.length).toBe(3)
    expect(items[0].text()).toContain('Recurso A')
    expect(items[0].text()).toContain('Ocupado · evento activo')
    expect(items[1].text()).toContain('Disponible')       // la inspección de B terminó a las 10:00 y ahora son las 10:10
    expect(items[2].text()).toContain('Disponible')
    expect(w.find('.g-calendar__timeline').exists()).toBe(false)
  })

  it('teléfono: tocar un recurso abre su Día y emite resource-click', async () => {
    const w = withWidth(400, { view: 'timeline', resources })
    await nextTick()
    await w.findAll('.g-calendar__resource')[1].trigger('click')
    expect(w.emitted('resource-click')[0][0]).toEqual({ resourceId: 'b' })
    expect(w.emitted('update:view')[0]).toEqual(['day'])
  })

  it('teléfono: Semana es una tira de siete días más la agenda del día', async () => {
    const w = withWidth(400, { view: 'week', resources: [resources[0]] })
    await nextTick()
    expect(w.findAll('.g-calendar__strip button').length).toBe(7)
    expect(w.findAll('.g-calendar__strip button').filter((b) => b.attributes('aria-pressed') === 'true').length).toBe(1)
    expect(w.find('.g-calendar__agenda').exists()).toBe(true)
    expect(w.find('.g-calendar__grid').exists()).toBe(false)
  })

  it('teléfono: un día del Mes abre la hoja inferior con sus eventos', async () => {
    const w = withWidth(400, { view: 'month' })
    await nextTick()
    await w.find(`.g-calendar__day[data-date="${D}"]`).trigger('click')
    const sheet = w.find('.g-calendar__sheet')
    expect(sheet.attributes('role')).toBe('dialog')
    expect(sheet.text()).toContain('Cita corta')
    await sheet.find('.g-calendar__sheet-close').trigger('click')
    expect(w.find('.g-calendar__sheet').exists()).toBe(false)
  })
})
