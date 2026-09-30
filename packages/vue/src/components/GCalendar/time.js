// GCalendar · tiempo y zona horaria (dueño: bruno)
// Sin bibliotecas: todo con Intl.DateTimeFormat. Las horas se leen en la zona horaria DEL CALENDARIO,
// nunca en la del navegador ni la del servidor.

export const pad = (n) => String(n).padStart(2, '0')

const partsFormatters = new Map()
function partsFormatter(tz) {
  let f = partsFormatters.get(tz)
  if (!f) {
    f = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
    partsFormatters.set(tz, f)
  }
  return f
}

/** Año, mes, día, hora, minuto y segundo de un instante, en la zona `tz`. */
export function tzParts(date, tz) {
  const o = {}
  for (const p of partsFormatter(tz).formatToParts(date)) o[p.type] = p.value
  let h = Number(o.hour)
  if (h === 24) h = 0
  return { y: Number(o.year), m: Number(o.month), d: Number(o.day), h, mi: Number(o.minute), s: Number(o.second) }
}

/** Clave `AAAA-MM-DD` del día de un instante, en la zona `tz`. */
export function dayKey(date, tz) {
  const p = tzParts(date, tz)
  return `${p.y}-${pad(p.m)}-${pad(p.d)}`
}

/** Desfase de la zona `tz` en minutos respecto a UTC, en un instante dado. */
export function tzOffsetMin(date, tz) {
  const p = tzParts(date, tz)
  return (Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi, p.s) - Math.floor(date.getTime() / 1000) * 1000) / 60000
}

/** Instante que corresponde a `minutos` desde las 00:00 del día `key`, en la zona `tz`. */
export function zoned(key, minutes, tz) {
  const [y, m, d] = key.split('-').map(Number)
  const guess = Date.UTC(y, m - 1, d, 0, 0, 0) + minutes * 60000
  let off = tzOffsetMin(new Date(guess), tz)
  const t = guess - off * 60000
  off = tzOffsetMin(new Date(t), tz)
  return new Date(guess - off * 60000)
}

export function addDays(key, n) {
  const [y, m, d] = key.split('-').map(Number)
  const t = new Date(Date.UTC(y, m - 1, d + n))
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`
}

/** Día de la semana de una clave: 0 = domingo. */
export function dow(key) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay()
}

/** Primer día de la semana (según `weekStartsOn`, 0 = domingo) que contiene `key`. */
export function weekStart(key, weekStartsOn = 1) {
  return addDays(key, -((dow(key) - weekStartsOn + 7) % 7))
}

export function monthStart(key) {
  return `${key.slice(0, 8)}01`
}

export function addMonths(key, n) {
  const [y, m] = key.split('-').map(Number)
  const t = new Date(Date.UTC(y, m - 1 + n, 1))
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-01`
}

/**
 * Normaliza una fecha del consumidor a un instante.
 * - `Date`: tal cual. - Texto con desfase (`Z`, `±hh:mm`): instante exacto.
 * - Texto sin desfase (`2026-09-29T09:00`): hora local EN LA ZONA DEL CALENDARIO.
 */
export function toDate(value, tz) {
  if (value == null) return null
  if (value instanceof Date) return value
  const s = String(value)
  if (/([zZ]|[+-]\d{2}:?\d{2})$/.test(s)) return new Date(s)
  const m = s.match(/^(\d{4}-\d{2}-\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?$/)
  if (!m) return new Date(s)
  return zoned(m[1], (Number(m[2] || 0) * 60) + Number(m[3] || 0) + Number(m[4] || 0) / 60, tz)
}

/** Minutos desde las 00:00 de su día, en la zona `tz`. */
export function minuteOfDay(date, tz) {
  const p = tzParts(date, tz)
  return p.h * 60 + p.mi + p.s / 60
}

export function hhmmToMin(text) {
  const [h, m] = String(text).split(':').map(Number)
  return h * 60 + (m || 0)
}

export function minToHHMM(min) {
  return `${pad(Math.floor(min / 60))}:${pad(Math.round(min % 60))}`
}

/** Hora de un instante en la zona `tz`: `HH:mm` (24 h) o, con `hour12`, en 12 horas según `locale`. */
export function formatTime(date, tz, { hour12 = false, locale } = {}) {
  if (!hour12) {
    const p = tzParts(date, tz)
    return `${pad(p.h)}:${pad(p.mi)}`
  }
  return new Intl.DateTimeFormat(locale, { timeZone: tz, hour: 'numeric', minute: '2-digit', hour12: true }).format(date)
}

/** Formatea una clave de día con Intl (los nombres de días y meses siguen a `locale`). */
export function formatDay(key, options, locale) {
  const [y, m, d] = key.split('-').map(Number)
  return new Intl.DateTimeFormat(locale, { timeZone: 'UTC', ...options }).format(new Date(Date.UTC(y, m - 1, d, 12)))
}
