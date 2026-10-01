import { describe, it, expect } from 'vitest'
import { OPS, applyFilters, matches, parseValue, summarize, formatValue, textFields, valueField } from './filters.js'

const fields = [
  { key: 'cliente', label: 'Cliente', title: 'nombre', subtitle: 'correo', filter: { type: 'text' } },
  { key: 'estado', label: 'Estado', filter: { type: 'enum', options: ['activo', 'pausado', 'vencido'] } },
  { key: 'total', label: 'Total', filter: { type: 'number', unit: '$' } },
  { key: 'alta', label: 'Alta', filter: { type: 'date' } }
]
const rows = [
  { id: 1, nombre: 'Ana Torres', correo: 'ana@x.com', estado: 'activo', total: 3393, alta: '2026-09-25' },
  { id: 2, nombre: 'Bruno Díaz', correo: 'bruno@x.com', estado: 'pausado', total: 1931, alta: '2026-03-10' },
  { id: 3, nombre: 'Carla Ruiz', correo: 'carla@x.com', estado: 'vencido', total: 2662, alta: '2026-06-01' }
]
const today = new Date('2026-10-01T12:00:00')
const ids = (r) => r.map((x) => x.id)

describe('filters · reglas', () => {
  it('lista cerrada de operadores por tipo', () => {
    expect(OPS).toEqual({ text: ['contains', 'is', 'starts'], number: ['gt', 'lt', 'eq', 'between'], date: ['after', 'before', 'between', 'last'], enum: ['in'] })
  })
  it('compuesta: texto busca en título y subtítulo; el resto lee title', () => {
    expect(textFields(fields[0])).toEqual(['nombre', 'correo'])
    expect(valueField(fields[0])).toBe('nombre')
    expect(valueField(fields[2])).toBe('total')
  })
})

describe('filters · aplicar', () => {
  it('texto: contiene (en nombre o correo), es, empieza por; sin distinguir mayúsculas', () => {
    expect(ids(applyFilters(rows, fields, [{ key: 'cliente', op: 'contains', value: 'BRUNO@' }], today))).toEqual([2])
    expect(ids(applyFilters(rows, fields, [{ key: 'cliente', op: 'is', value: 'ana torres' }], today))).toEqual([1])
    expect(ids(applyFilters(rows, fields, [{ key: 'cliente', op: 'starts', value: 'car' }], today))).toEqual([3])
  })
  it('enum: cualquiera de (O dentro del filtro)', () => {
    expect(ids(applyFilters(rows, fields, [{ key: 'estado', op: 'in', value: ['pausado', 'vencido'] }], today))).toEqual([2, 3])
  })
  it('número: mayor, menor, igual, entre (inclusivo)', () => {
    expect(ids(applyFilters(rows, fields, [{ key: 'total', op: 'gt', value: 2000 }], today))).toEqual([1, 3])
    expect(ids(applyFilters(rows, fields, [{ key: 'total', op: 'lt', value: 2000 }], today))).toEqual([2])
    expect(ids(applyFilters(rows, fields, [{ key: 'total', op: 'eq', value: 1931 }], today))).toEqual([2])
    expect(ids(applyFilters(rows, fields, [{ key: 'total', op: 'between', value: [1931, 2662] }], today))).toEqual([2, 3])
  })
  it('fecha: después, antes, entre, últimos N días', () => {
    expect(ids(applyFilters(rows, fields, [{ key: 'alta', op: 'after', value: '2026-06-01' }], today))).toEqual([1])
    expect(ids(applyFilters(rows, fields, [{ key: 'alta', op: 'before', value: '2026-06-01' }], today))).toEqual([2])
    expect(ids(applyFilters(rows, fields, [{ key: 'alta', op: 'between', value: ['2026-03-10', '2026-06-01'] }], today))).toEqual([2, 3])
    expect(ids(applyFilters(rows, fields, [{ key: 'alta', op: 'last', value: 30 }], today))).toEqual([1])
  })
  it('Y entre filtros', () => {
    expect(ids(applyFilters(rows, fields, [{ key: 'estado', op: 'in', value: ['pausado', 'vencido'] }, { key: 'total', op: 'gt', value: 2000 }], today))).toEqual([3])
  })
  it('sin filtros devuelve las mismas filas; los de campos desconocidos se ignoran', () => {
    expect(applyFilters(rows, fields, [], today)).toBe(rows)
    expect(ids(applyFilters(rows, fields, [{ key: 'nada', op: 'is', value: 'x' }], today))).toEqual([1, 2, 3])
  })
  it('matches con fecha vacía no rompe', () => {
    expect(matches({ alta: null }, fields[3], { op: 'after', value: '2026-01-01' }, today)).toBe(false)
  })
})

describe('filters · interpretar y validar', () => {
  it('vacío no es 0', () => {
    expect(parseValue('number', 'gt', '')).toEqual({ error: 'required' })
    expect(parseValue('date', 'last', '  ')).toEqual({ error: 'required' })
    expect(parseValue('number', 'gt', '0')).toEqual({ value: 0 })
  })
  it('números, días y textos', () => {
    expect(parseValue('number', 'gt', '3000')).toEqual({ value: 3000 })
    expect(parseValue('date', 'last', '30')).toEqual({ value: 30 })
    expect(parseValue('date', 'last', '0')).toEqual({ error: 'required' })
    expect(parseValue('text', 'contains', '  ana ')).toEqual({ value: 'ana' })
    expect(parseValue('number', 'gt', 'abc')).toEqual({ error: 'required' })
  })
  it('entre: ambos valores y desde ≤ hasta', () => {
    expect(parseValue('number', 'between', ['10', ''])).toEqual({ error: 'required' })
    expect(parseValue('number', 'between', ['5000', '1000'])).toEqual({ error: 'range' })
    expect(parseValue('number', 'between', ['1000', '5000'])).toEqual({ value: [1000, 5000] })
    expect(parseValue('date', 'between', ['2026-06-01', '2026-01-01'])).toEqual({ error: 'range' })
  })
  it('enum: al menos una opción', () => {
    expect(parseValue('enum', 'in', [])).toEqual({ error: 'required' })
    expect(parseValue('enum', 'in', ['activo'])).toEqual({ value: ['activo'] })
  })
})

describe('filters · resumen', () => {
  const labels = { ops: { gt: 'mayor que', in: 'es cualquiera de', between: 'entre', last: 'últimos' }, and: 'y', days: '{n} días' }
  it('número con unidad, enum, entre y últimos N días', () => {
    expect(summarize(fields[2], { op: 'gt', value: 3000 }, labels, 'es-MX')).toBe('Total mayor que $3,000')
    expect(summarize(fields[1], { op: 'in', value: ['pausado', 'vencido'] }, labels, 'es-MX')).toBe('Estado: pausado, vencido')
    expect(summarize(fields[2], { op: 'between', value: [1000, 5000] }, labels, 'es-MX')).toBe('Total entre $1,000 y $5,000')
    expect(summarize(fields[3], { op: 'last', value: 30 }, labels, 'es-MX')).toBe('Alta últimos 30 días')
  })
  it('opciones con etiqueta y fechas con Intl', () => {
    expect(formatValue({ filter: { type: 'enum', options: [{ value: 'a', label: 'Activo' }] } }, 'a')).toBe('Activo')
    expect(formatValue({ filter: { type: 'date' } }, '2026-09-25', 'es-MX')).toMatch(/25.*sept?.*2026/)
  })
})
