import { describe, it, expect } from 'vitest'
import { addDays, addMonths, dayKey, dow, formatDay, formatTime, minToHHMM, minuteOfDay, toDate, tzOffsetMin, tzParts, weekStart, zoned } from './time.js'

const MX = 'America/Mexico_City'

describe('time · zona horaria explícita', () => {
  it('lee las horas en la zona del calendario, no en la del navegador', () => {
    const d = new Date('2026-09-29T15:43:00Z')
    expect(tzParts(d, MX)).toMatchObject({ y: 2026, m: 9, d: 29, h: 9, mi: 43 })
    expect(tzParts(d, 'Europe/Madrid')).toMatchObject({ h: 17, mi: 43 })
    expect(tzParts(d, 'Asia/Tokyo')).toMatchObject({ d: 30, h: 0, mi: 43 })
  })

  it('el día cambia con la zona', () => {
    const d = new Date('2026-09-29T23:30:00Z')
    expect(dayKey(d, MX)).toBe('2026-09-29')
    expect(dayKey(d, 'Asia/Tokyo')).toBe('2026-09-30')
  })

  it('zoned() y minuteOfDay() son inversas', () => {
    const d = zoned('2026-09-29', 12 * 60 + 43, MX)
    expect(minuteOfDay(d, MX)).toBe(763)
    expect(d.toISOString()).toBe('2026-09-29T18:43:00.000Z')
  })

  it('desfase de la zona', () => {
    expect(tzOffsetMin(new Date('2026-09-29T12:00:00Z'), MX)).toBe(-360)
    expect(tzOffsetMin(new Date('2026-09-29T12:00:00Z'), 'Europe/Madrid')).toBe(120)
  })

  it('cambio de horario de verano: el día tiene 23 o 25 horas reales', () => {
    // Nueva York: 8 de marzo de 2026 (adelanto) y 1 de noviembre de 2026 (retroceso)
    const ny = 'America/New_York'
    expect((zoned('2026-03-09', 0, ny) - zoned('2026-03-08', 0, ny)) / 3600000).toBe(23)
    expect((zoned('2026-11-02', 0, ny) - zoned('2026-11-01', 0, ny)) / 3600000).toBe(25)
    // la hora de pared sigue siendo correcta después del cambio
    expect(tzParts(zoned('2026-03-08', 12 * 60, ny), ny).h).toBe(12)
  })
})

describe('time · fechas del consumidor', () => {
  it('Date se conserva', () => {
    const d = new Date('2026-09-29T10:00:00Z')
    expect(toDate(d, MX)).toBe(d)
  })

  it('texto con desfase es un instante exacto', () => {
    expect(toDate('2026-09-29T09:00:00-06:00', 'Asia/Tokyo').toISOString()).toBe('2026-09-29T15:00:00.000Z')
    expect(toDate('2026-09-29T15:00:00Z', MX).toISOString()).toBe('2026-09-29T15:00:00.000Z')
  })

  it('texto sin desfase es hora local EN LA ZONA DEL CALENDARIO', () => {
    expect(toDate('2026-09-29T09:00', MX).toISOString()).toBe('2026-09-29T15:00:00.000Z')
    expect(toDate('2026-09-29T09:00', 'Asia/Tokyo').toISOString()).toBe('2026-09-29T00:00:00.000Z')
    expect(toDate('2026-09-29', MX).toISOString()).toBe('2026-09-29T06:00:00.000Z')
  })

  it('null y vacío', () => {
    expect(toDate(null, MX)).toBeNull()
    expect(toDate(undefined, MX)).toBeNull()
  })
})

describe('time · calendario', () => {
  it('addDays cruza mes y año', () => {
    expect(addDays('2026-09-30', 1)).toBe('2026-10-01')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
  })

  it('día de la semana y semana (lunes por defecto)', () => {
    expect(dow('2026-09-29')).toBe(2) // martes
    expect(weekStart('2026-09-29')).toBe('2026-09-28')
    expect(weekStart('2026-09-27')).toBe('2026-09-21') // domingo pertenece a la semana que empezó el lunes 21
    expect(weekStart('2026-09-29', 0)).toBe('2026-09-27') // semana que empieza en domingo
  })

  it('addMonths', () => {
    expect(addMonths('2026-09-29', 1)).toBe('2026-10-01')
    expect(addMonths('2026-01-15', -1)).toBe('2025-12-01')
  })

  it('formato de hora: 24 h por defecto y 12 h con hour12', () => {
    const d = zoned('2026-09-29', 12 * 60 + 43, MX)
    expect(formatTime(d, MX)).toBe('12:43')
    expect(formatTime(d, MX, { hour12: true, locale: 'en-US' })).toMatch(/12:43\s?PM/)
    expect(minToHHMM(763)).toBe('12:43')
  })

  it('los nombres de días siguen a la locale', () => {
    expect(formatDay('2026-09-29', { weekday: 'long' }, 'es-MX')).toBe('martes')
    expect(formatDay('2026-09-29', { weekday: 'long' }, 'en-US')).toBe('Tuesday')
  })
})
