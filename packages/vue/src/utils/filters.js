// Motor de filtros (interno; dueño: bruno). Contrato: design/contracts/filter-bar.md (DECISIONS.md #109).
// Funciones puras: aplican, validan, interpretan y resumen filtros { key, op, value }.
// Y entre filtros; O dentro de un enum. Sin dependencias.

/** Reglas por tipo (lista cerrada, en el orden en que se ofrecen) */
export const OPS = {
  text: ['contains', 'is', 'starts'],
  number: ['gt', 'lt', 'eq', 'between'],
  date: ['after', 'before', 'between', 'last'],
  enum: ['in']
}

/** Campo del que se lee el valor de un filtro no textual (columna simple: key; compuesta: sortBy o title) */
export const valueField = (field) => field.sortBy || field.title || field.key
/** Campos donde busca un filtro de texto */
export const textFields = (field) =>
  field.filter?.fields || (field.title ? [field.title, field.subtitle].filter(Boolean) : [field.key])

const lower = (v) => String(v ?? '').toLocaleLowerCase()
/** Fecha local de hoy en formato YYYY-MM-DD */
export const isoDate = (d) => {
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

/** ¿Cumple la fila un filtro? */
export function matches(row, field, f, today = new Date()) {
  const type = field.filter?.type
  if (type === 'text') {
    const q = lower(f.value)
    return textFields(field).some((k) => {
      const v = lower(row[k])
      return f.op === 'is' ? v === q : f.op === 'starts' ? v.startsWith(q) : v.includes(q)
    })
  }
  const v = row[valueField(field)]
  if (type === 'enum') return Array.isArray(f.value) && f.value.includes(v)
  if (type === 'number') {
    const n = Number(v)
    if (f.op === 'gt') return n > f.value
    if (f.op === 'lt') return n < f.value
    if (f.op === 'eq') return n === f.value
    return n >= f.value[0] && n <= f.value[1]
  }
  if (type === 'date') {
    const d = String(v ?? '')
    if (f.op === 'after') return d > f.value
    if (f.op === 'before') return d < f.value
    if (f.op === 'between') return d >= f.value[0] && d <= f.value[1]
    const from = new Date(today)
    from.setDate(from.getDate() - f.value)
    return d >= isoDate(from) && d <= isoDate(today)
  }
  return true
}

/** Filas que cumplen todos los filtros (los de campos desconocidos se ignoran) */
export function applyFilters(rows, fields, filters, today = new Date()) {
  const active = (filters || []).map((f) => [fields.find((x) => x.key === f.key), f]).filter(([field]) => field && field.filter)
  if (!active.length) return rows
  return rows.filter((row) => active.every(([field, f]) => matches(row, field, f, today)))
}

/**
 * Convierte lo escrito en el editor en el valor del filtro y lo valida.
 * raw: texto, [desde, hasta] o lista (enum). Devuelve { value } o { error: 'required' | 'range' }.
 * Un campo numérico vacío NO es 0 (hallazgo de kiwi, r02).
 */
export function parseValue(type, op, raw) {
  if (type === 'enum') return Array.isArray(raw) && raw.length ? { value: [...raw] } : { error: 'required' }
  const pair = op === 'between'
  const parts = pair ? raw : [raw]
  if (!Array.isArray(parts) || parts.some((x) => String(x ?? '').trim() === '')) return { error: 'required' }
  const numeric = type === 'number' || op === 'last'
  const vals = parts.map((x) => (numeric ? Number(x) : String(x).trim()))
  if (numeric && vals.some((x) => Number.isNaN(x))) return { error: 'required' }
  if (op === 'last' && vals[0] < 1) return { error: 'required' }
  if (pair && vals[0] > vals[1]) return { error: 'range' }
  return { value: pair ? vals : vals[0] }
}

/** Texto de un valor para el resumen (formato con Intl en el idioma del documento) */
export function formatValue(field, value, locale) {
  const f = field.filter || {}
  if (f.type === 'number') {
    const n = Number(value).toLocaleString(locale)
    return f.unit === '$' ? `$${n}` : f.unit ? `${n} ${f.unit}` : n
  }
  if (f.type === 'date') {
    const d = new Date(`${value}T00:00:00`)
    return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })
  }
  if (f.type === 'enum') {
    const opt = (f.options || []).find((o) => (typeof o === 'object' ? o.value : o) === value)
    return opt && typeof opt === 'object' ? opt.label : String(value)
  }
  return String(value)
}

/** Resumen legible de un filtro: «Total mayor que $3,000», «Estado: pausado, vencido» */
export function summarize(field, f, labels = {}, locale) {
  const ops = labels.ops || {}
  const opText = ops[f.op] || f.op
  if (field.filter?.type === 'enum') return `${field.label}: ${f.value.map((v) => formatValue(field, v, locale)).join(', ')}`
  if (f.op === 'between') return `${field.label} ${opText} ${formatValue(field, f.value[0], locale)} ${labels.and || '–'} ${formatValue(field, f.value[1], locale)}`
  if (f.op === 'last') return `${field.label} ${opText} ${(labels.days || '{n}').replace('{n}', f.value)}`
  return `${field.label} ${opText} ${formatValue(field, f.value, locale)}`
}
