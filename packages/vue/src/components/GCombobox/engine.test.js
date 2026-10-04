// Motor de texto de GCombobox (combobox.md: filter, coincidencia, línea secundaria)
import { describe, it, expect } from 'vitest'
import { completion, fold, matches, parts, secondary, tokens, validOption } from './engine.js'

describe('GCombobox · engine', () => {
  it('fold: sin acentos ni mayúsculas, carácter a carácter', () => {
    expect(fold('María ÑANDÚ Óscar')).toBe('maria nandu oscar')
    expect(fold('María').length).toBe('María'.length)
    expect(tokens('  Tipo   2 ')).toEqual(['tipo', '2'])
  })

  it('matches: todas las palabras sobre label, code, description y los valores de facts', () => {
    const o = { label: 'Diabetes mellitus tipo 2', code: 'E11.9', description: 'Endocrinas', facts: [{ label: 'Capítulo', value: 'IV' }] }
    expect(matches(o, tokens('DIABETES e11'))).toBe(true)
    expect(matches(o, tokens('endocrinas iv'))).toBe(true)
    expect(matches(o, tokens('capítulo'))).toBe(false) // los rótulos no se buscan
    expect(matches(o, tokens('diabetes tipo 7'))).toBe(false)
  })

  it('parts: primera aparición de cada palabra; sin búsqueda, un solo trozo; si la forma plegada no mide igual, no marca', () => {
    expect(parts('María García', 'gar mar')).toEqual([{ t: 'Mar', m: true }, { t: 'ía ', m: false }, { t: 'Gar', m: true }, { t: 'cía', m: false }])
    expect(parts('Texto', '')).toEqual([{ t: 'Texto', m: false }])
    expect(parts('', 'x')).toEqual([])
    expect(parts('a😀b', 'b')).toEqual([{ t: 'a😀b', m: false }])
  })

  it('completion: por prefijo sin acentos ni mayúsculas y solo si la etiqueta es más larga', () => {
    expect(completion('María García', 'mar')).toBe('ía García')
    expect(completion('María', 'MARIA')).toBeNull()
    expect(completion('María', 'ar')).toBeNull()
    expect(completion('María', '')).toBeNull()
  })

  it('secondary: description › facts «rótulo valor · rótulo valor» › nada', () => {
    expect(secondary({ description: 'Exp. 1', facts: [{ label: 'a', value: 'b' }] })).toBe('Exp. 1')
    expect(secondary({ facts: [{ label: 'Exp.', value: '7' }, { label: 'Edad', value: '3' }, { label: 'x', value: '' }] })).toBe('Exp. 7 · Edad 3')
    expect(secondary({ label: 'x' })).toBe('')
    expect(secondary(null)).toBe('')
  })

  it('validOption: value String o Number y label no vacío', () => {
    expect(validOption({ value: 0, label: 'Cero' })).toBe(true)
    expect(validOption({ value: null, label: 'x' })).toBe(false)
    expect(validOption({ value: 'a', label: '' })).toBe(false)
    expect(validOption(null)).toBe(false)
  })
})
