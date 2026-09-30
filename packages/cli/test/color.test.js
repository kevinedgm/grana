import { describe, it, expect } from 'vitest'
import { contrast, fromOklch, parseHex, toHex, toOklch } from '../src/color.js'

describe('color', () => {
  it('parsea hex de 3 y 6 dígitos, con y sin #, y rechaza lo demás', () => {
    expect(parseHex('#fff')).toEqual([255, 255, 255])
    expect(parseHex('0b63ce')).toEqual([11, 99, 206])
    expect(parseHex('#12345')).toBeNull()
    expect(parseHex('rojo')).toBeNull()
    expect(toHex([11, 99, 206])).toBe('#0B63CE')
  })

  it('contraste WCAG: negro sobre blanco 21:1; iguales 1:1', () => {
    expect(contrast([0, 0, 0], [255, 255, 255])).toBeCloseTo(21, 5)
    expect(contrast([128, 128, 128], [128, 128, 128])).toBeCloseTo(1, 5)
  })

  it('contraste conocido: #767676 sobre blanco ≈ 4.54:1', () => {
    expect(contrast([0x76, 0x76, 0x76], [255, 255, 255])).toBeGreaterThan(4.5)
    expect(contrast([0x77, 0x77, 0x77], [255, 255, 255])).toBeLessThan(4.5)
  })

  it('OKLCH: blanco L=1, negro L=0, gris C≈0', () => {
    expect(toOklch([255, 255, 255]).l).toBeCloseTo(1, 3)
    expect(toOklch([0, 0, 0]).l).toBeCloseTo(0, 3)
    expect(toOklch([128, 128, 128]).c).toBeLessThan(0.001)
  })

  it('ida y vuelta hex → OKLCH → hex conserva el color', () => {
    for (const hex of ['#0B63CE', '#C4321F', '#1E7A46', '#8F5B00', '#7A1F5C', '#F5B940']) {
      const back = toHex(fromOklch(toOklch(parseHex(hex))).map(Math.round))
      const a = parseHex(hex), b = parseHex(back)
      a.forEach((v, i) => expect(Math.abs(v - b[i])).toBeLessThanOrEqual(1))
    }
  })

  it('fuera de gama reduce C y devuelve un sRGB válido con la misma L aproximada', () => {
    const rgb = fromOklch({ l: 0.9, c: 0.4, h: 145 })
    rgb.forEach((v) => { expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThanOrEqual(255) })
    expect(toOklch(rgb.map(Math.round)).l).toBeCloseTo(0.9, 1)
  })
})
