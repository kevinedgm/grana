import { describe, it, expect } from 'vitest'
import { assignLanes, detectConflicts, isWithinAvailability, segmentOf, unavailableBands } from './layout.js'
import { toDate, zoned } from './time.js'

const MX = 'America/Mexico_City'
const day = '2026-09-29'
const ev = (id, s, e, extra = {}) => ({ id, raw: { id }, start: toDate(`${day}T${s}`, MX), end: e ? toDate(`${day}T${e}`, MX) : null, resources: ['a'], ...extra })

describe('layout · tramo de un evento en un día', () => {
  it('minutos exactos, sin redondeo (12:43 = 763)', () => {
    const s = segmentOf(ev('1', '12:43', '13:12'), day, MX, new Date())
    expect(s.startMin).toBe(763)
    expect(s.endMin).toBe(792)
    expect(s.continuesBefore).toBe(false)
  })

  it('un evento fuera del día no tiene tramo', () => {
    expect(segmentOf(ev('1', '12:43', '13:12'), '2026-09-30', MX, new Date())).toBeNull()
  })

  it('un evento que cruza la medianoche se recorta y marca la continuación', () => {
    const e = { id: '1', start: toDate('2026-09-29T22:00', MX), end: toDate('2026-09-30T02:00', MX), resources: ['a'] }
    const a = segmentOf(e, '2026-09-29', MX, new Date())
    const b = segmentOf(e, '2026-09-30', MX, new Date())
    expect(a).toMatchObject({ startMin: 1320, endMin: 1440, continuesAfter: true, continuesBefore: false })
    expect(b).toMatchObject({ startMin: 0, endMin: 120, continuesBefore: true, continuesAfter: false })
  })

  it('evento abierto: hasta ahora (mínimo 30 minutos)', () => {
    const now = zoned(day, 10 * 60 + 10, MX)
    expect(segmentOf(ev('1', '09:37', null), day, MX, now)).toMatchObject({ startMin: 577, endMin: 610, open: true })
    const early = zoned(day, 9 * 60 + 40, MX)
    expect(segmentOf(ev('1', '09:37', null), day, MX, early).endMin).toBe(577 + 30)
  })

  it('la zona horaria cambia el día y los minutos', () => {
    const e = ev('1', '12:43', '13:12')
    const tokyo = segmentOf(e, '2026-09-30', 'Asia/Tokyo', new Date())
    expect(tokyo.startMin).toBe(3 * 60 + 43) // 12:43 MX = 03:43 del día siguiente en Tokio... (UTC+9, −6 → +15 h = 03:43)
  })

  it('un día de 23 horas (horario de verano) mide 1380 minutos', () => {
    const e = { id: '1', start: zoned('2026-03-08', 0, 'America/New_York'), end: zoned('2026-03-09', 0, 'America/New_York'), resources: ['a'] }
    const s = segmentOf(e, '2026-03-08', 'America/New_York', new Date())
    expect(s.endMin - s.startMin).toBe(1380)
  })
})

describe('layout · carriles', () => {
  const seg = (s, e) => ({ startMin: s, endMin: e })

  it('eventos sin traslape van en un solo carril', () => {
    const r = assignLanes([seg(0, 60), seg(60, 120)], 20)
    expect(r.map((x) => [x.lane, x.lanes])).toEqual([[0, 1], [0, 1]])
  })

  it('traslapes: un carril por evento y todos conocen el total', () => {
    const r = assignLanes([seg(600, 660), seg(615, 675), seg(630, 690)], 20)
    expect(r.map((x) => x.lane)).toEqual([0, 1, 2])
    expect(r.every((x) => x.lanes === 3)).toBe(true)
  })

  it('un carril libre se reutiliza dentro del grupo', () => {
    const r = assignLanes([seg(0, 60), seg(30, 90), seg(70, 100)], 20)
    expect(r.map((x) => x.lane)).toEqual([0, 1, 0])
    expect(r[0].lanes).toBe(2)
  })

  it('el alto mínimo cuenta: un evento de 5 minutos no se dibuja encima de otro', () => {
    const r = assignLanes([seg(543, 548), seg(550, 600)], 24)
    expect(r.map((x) => x.lane)).toEqual([0, 1])
  })

  it('grupos separados no comparten carriles', () => {
    const r = assignLanes([seg(0, 30), seg(15, 45), seg(300, 360)], 20)
    expect(r[2]).toMatchObject({ lane: 0, lanes: 1 })
    expect(r[0].lanes).toBe(2)
  })
})

describe('layout · disponibilidad', () => {
  const rules = [{ resourceId: 'a', dayOfWeek: 2, startTime: '09:00', endTime: '18:00', pauses: [{ startTime: '14:00', endTime: '15:00' }] }]

  it('franjas no disponibles: antes, pausa y después', () => {
    expect(unavailableBands(rules, 'a', day, 420, 1320)).toEqual([[420, 540], [840, 900], [1080, 1320]])
  })

  it('recurso sin reglas: sin restricciones', () => {
    expect(unavailableBands(rules, 'b', day, 420, 1320)).toEqual([])
  })

  it('día sin regla aplicable: todo el día no disponible', () => {
    expect(unavailableBands(rules, 'a', '2026-09-30', 420, 1320)).toEqual([[420, 1320]])
  })

  it('una regla con date sustituye a las de dayOfWeek', () => {
    const r = [...rules, { resourceId: 'a', date: day, startTime: '10:00', endTime: '12:00' }]
    expect(unavailableBands(r, 'a', day, 420, 1320)).toEqual([[420, 600], [720, 1320]])
  })

  it('available:false en una fecha: ese día no hay disponibilidad', () => {
    const r = [...rules, { resourceId: 'a', date: day, available: false }]
    expect(unavailableBands(r, 'a', day, 420, 1320)).toEqual([[420, 1320]])
  })

  it('varias ventanas el mismo día', () => {
    const r = [{ resourceId: 'a', startTime: '08:00', endTime: '10:00' }, { resourceId: 'a', startTime: '12:00', endTime: '14:00' }]
    expect(unavailableBands(r, 'a', day, 420, 900)).toEqual([[420, 480], [600, 720], [840, 900]])
  })

  it('un periodo cabe o no en la disponibilidad', () => {
    expect(isWithinAvailability(rules, 'a', toDate(`${day}T10:00`, MX), toDate(`${day}T11:00`, MX), MX)).toBe(true)
    expect(isWithinAvailability(rules, 'a', toDate(`${day}T13:30`, MX), toDate(`${day}T14:30`, MX), MX)).toBe(false)
    expect(isWithinAvailability(rules, 'a', toDate(`${day}T08:30`, MX), toDate(`${day}T09:30`, MX), MX)).toBe(false)
    expect(isWithinAvailability(rules, 'b', toDate(`${day}T03:00`, MX), toDate(`${day}T04:00`, MX), MX)).toBe(true)
  })
})

describe('layout · conflictos (el componente informa, no decide)', () => {
  const events = [ev('e1', '10:00', '11:00'), ev('e2', '12:00', '13:00'), ev('open', '09:00', null)]
  const blocks = [{ id: 'b', resourceId: 'a', start: toDate(`${day}T14:00`, MX), end: toDate(`${day}T15:00`, MX) }]
  const base = { events, blocks, availability: [], tz: MX }
  const move = (id, s, e, resourceId = 'a', extra = {}) => detectConflicts({ ...base, ...extra, event: events.find((x) => x.id === id) || ev(id, '00:00', '00:30'), start: toDate(`${day}T${s}`, MX), end: toDate(`${day}T${e}`, MX), resourceId })

  it('sin conflicto', () => expect(move('e1', '10:00', '11:30')).toEqual([]))
  it('overlap con otro evento del mismo recurso', () => {
    const c = move('e1', '11:30', '12:30')
    expect(c[0].type).toBe('overlap')
    expect(c[0].conflictingEvents).toEqual([{ id: 'e2' }])
  })
  it('un evento no choca consigo mismo ni con eventos de otro recurso', () => {
    expect(move('e1', '10:30', '11:30')).toEqual([])
    expect(move('e1', '12:00', '13:00', 'b')).toEqual([])
  })
  it('los eventos abiertos no cuentan para el traslape', () => expect(move('e1', '09:30', '10:30')).toEqual([]))
  it('blockedTime', () => expect(move('e2', '14:30', '15:30').map((c) => c.type)).toEqual(['blockedTime']))
  it('invalidDuration', () => {
    expect(move('e1', '11:00', '11:00').map((c) => c.type)).toContain('invalidDuration')
    expect(move('e1', '12:00', '11:00').map((c) => c.type)).toContain('invalidDuration')
  })
  it('outsideAvailability', () => {
    const availability = [{ resourceId: 'a', startTime: '09:00', endTime: '18:00' }]
    expect(move('e1', '18:30', '19:30', 'a', { availability }).map((c) => c.type)).toEqual(['outsideAvailability'])
  })
  it('resourceConflict: un evento con varios recursos choca en otro de sus recursos', () => {
    const shared = { ...ev('s', '10:00', '11:00'), resources: ['a', 'b'] }
    const other = { ...ev('o', '12:00', '13:00'), resources: ['b'] }
    const c = detectConflicts({ events: [shared, other], blocks: [], availability: [], tz: MX, event: shared, start: toDate(`${day}T12:30`, MX), end: toDate(`${day}T13:30`, MX), resourceId: 'a' })
    expect(c.map((x) => x.type)).toEqual(['resourceConflict'])
  })
})
