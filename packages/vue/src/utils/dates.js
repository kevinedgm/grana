// Fechas ISO sin zona (YYYY-MM-DD) para GDatePicker. Se operan con Date local a mediodía
// implícito de calendario (año, mes, día): sin horas ni zonas, no hay desfase de un día.
const pad = (n) => String(n).padStart(2, '0')
export const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/

export const toISO = (d) => `${String(d.getFullYear()).padStart(4, '0')}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

/** Devuelve un Date local o null si la cadena no es una fecha ISO real (rechaza 2026-02-30). */
export function parseISO(s) {
  if (typeof s !== 'string') return null
  const m = ISO_RE.exec(s)
  if (!m) return null
  const y = Number(m[1])
  const mo = Number(m[2])
  const d = Number(m[3])
  const date = new Date(y, mo - 1, d)
  date.setFullYear(y)
  if (date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d) return null
  return date
}
export const isISO = (s) => parseISO(s) !== null

export const todayISO = () => toISO(new Date())

export function addDays(iso, n) {
  const d = parseISO(iso)
  d.setDate(d.getDate() + n)
  return toISO(d)
}

/** Suma meses conservando el día, o el último del mes destino si no existe. */
export function addMonths(iso, n) {
  const d = parseISO(iso)
  const day = d.getDate()
  d.setDate(1)
  d.setMonth(d.getMonth() + n)
  d.setDate(Math.min(day, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()))
  return toISO(d)
}

export const firstOfMonth = (iso) => `${iso.slice(0, 8)}01`
export const daysInMonth = (iso) => {
  const d = parseISO(iso)
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
}
export const monthKey = (iso) => iso.slice(0, 7)
export const weekday = (iso) => parseISO(iso).getDay()

/** Días inclusivos entre dos fechas ISO. */
export function daysBetween(a, b) {
  const da = parseISO(a)
  const db = parseISO(b)
  return Math.round((Date.UTC(db.getFullYear(), db.getMonth(), db.getDate()) - Date.UTC(da.getFullYear(), da.getMonth(), da.getDate())) / 864e5) + 1
}
