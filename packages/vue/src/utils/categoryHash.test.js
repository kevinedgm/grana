// categoryOf (utils/categoryHash.js): vectores de avatar.md «Hash» (#294), compartidos por GAvatar, GTag y GTagGroup (#469)
import { afterEach, describe, expect, it, vi } from 'vitest'
import { categoryOf } from './categoryHash.js'

// Clave, n = 4, n = 8, n = 12 (la tabla del contrato)
const VECTORS = [
  ['a', 4, 4, 4],
  ['Ana María López', 2, 2, 2],
  ['  ANA   MARÍA lópez ', 2, 2, 2],
  ['Ana María López'.normalize('NFD'), 2, 2, 2],
  ['李小龙', 1, 1, 1],
  ['محمد علي', 2, 6, 2],
  ['Grana Labs', 3, 3, 11],
  ['u_8f3a2c', 2, 2, 2],
  ['Zoë', 3, 3, 11]
]

afterEach(() => vi.unstubAllGlobals())

describe('categoryOf · vectores de avatar.md', () => {
  for (const [key, c4, c8, c12] of VECTORS) {
    it(`${JSON.stringify(key)} → ${c4} / ${c8} / ${c12}`, () => {
      expect([4, 8, 12].map((n) => categoryOf(key, n))).toEqual([c4, c8, c12])
    })
  }
  it('sin TextEncoder da lo mismo (codificación UTF-8 propia)', () => {
    const native = categoryOf('a\ud800b', 12)
    vi.stubGlobal('TextEncoder', undefined)
    for (const [key, c4, c8, c12] of VECTORS) expect([4, 8, 12].map((n) => categoryOf(key, n)), key).toEqual([c4, c8, c12])
    // Un sustituto suelto se codifica como U+FFFD, igual que TextEncoder
    expect(categoryOf('a\ud800b', 12)).toBe(native)
  })
  it('sin clave o con n fuera de 1..12 → null', () => {
    expect(categoryOf('', 8)).toBe(null)
    expect(categoryOf('   ', 8)).toBe(null)
    expect(categoryOf(undefined, 8)).toBe(null)
    expect(categoryOf(null, 8)).toBe(null)
    expect(categoryOf('a', 0)).toBe(null)
    expect(categoryOf('a', 13)).toBe(null)
    expect(categoryOf('a', 2.5)).toBe(null)
  })
  it('un número se convierte con String()', () => {
    expect(categoryOf(42, 8)).toBe(categoryOf('42', 8))
  })
  it('reparte entre n: 200 claves dan las n categorías', () => {
    const seen = new Set()
    for (let i = 0; i < 200; i++) seen.add(categoryOf('persona ' + i, 6))
    expect([...seen].sort()).toEqual([1, 2, 3, 4, 5, 6])
  })
})
