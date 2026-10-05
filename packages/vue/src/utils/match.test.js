// utils/match.js · coincidencia de texto compartida por GCombobox (engine.js), GSummary (highlight) y summaryDiff
// (summary.md «Coincidencia», #356). Antes vivía en GCombobox/engine.js (#335).
import { describe, it, expect } from 'vitest'
import { fold, parts, tokens } from './match.js'

describe('utils/match', () => {
  it('fold: sin acentos ni mayúsculas, carácter a carácter (misma longitud: se puede marcar por posición)', () => {
    expect(fold('María ÑANDÚ Óscar')).toBe('maria nandu oscar')
    expect(fold('María').length).toBe('María'.length)
    expect(fold(null)).toBe('')
    expect(fold(12)).toBe('12')
  })

  it('tokens: palabras buscadas plegadas, sin vacías', () => {
    expect(tokens('  Tipo   2 ')).toEqual(['tipo', '2'])
    expect(tokens('')).toEqual([])
  })

  it('parts: primera aparición de cada palabra; sin búsqueda, un solo trozo; si la forma plegada no mide igual, no marca', () => {
    expect(parts('María García', 'gar mar')).toEqual([{ t: 'Mar', m: true }, { t: 'ía ', m: false }, { t: 'Gar', m: true }, { t: 'cía', m: false }])
    expect(parts('Texto', '')).toEqual([{ t: 'Texto', m: false }])
    expect(parts('', 'x')).toEqual([])
    expect(parts('a😀b', 'b')).toEqual([{ t: 'a😀b', m: false }])
  })
})
