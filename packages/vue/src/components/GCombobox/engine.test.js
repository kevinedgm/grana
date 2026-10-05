// Motor de texto de GCombobox (combobox.md: filter, texto fantasma, línea secundaria). fold, tokens y parts se prueban
// en utils/match.test.js (compartidos con GSummary, #356): engine.js ya no lleva copia
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { tokens } from '../../utils/match.js'
import * as engine from './engine.js'
import { completion, matches, secondary, validOption } from './engine.js'

describe('GCombobox · engine', () => {
  it('no exporta ni define fold, tokens ni parts: los toma de utils/match.js (una sola copia, #356)', () => {
    expect(Object.keys(engine).sort()).toEqual(['completion', 'matches', 'secondary', 'validOption'])
    const src = readFileSync(resolve(process.cwd(), 'src/components/GCombobox/engine.js'), 'utf8')
    expect(src).toContain("from '../../utils/match.js'")
    expect(src).not.toMatch(/normalize\('NFD'\)/)
  })

  it('matches: todas las palabras sobre label, code, description y los valores de facts', () => {
    const o = { label: 'Diabetes mellitus tipo 2', code: 'E11.9', description: 'Endocrinas', facts: [{ label: 'Capítulo', value: 'IV' }] }
    expect(matches(o, tokens('DIABETES e11'))).toBe(true)
    expect(matches(o, tokens('endocrinas iv'))).toBe(true)
    expect(matches(o, tokens('capítulo'))).toBe(false) // los rótulos no se buscan
    expect(matches(o, tokens('diabetes tipo 7'))).toBe(false)
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
