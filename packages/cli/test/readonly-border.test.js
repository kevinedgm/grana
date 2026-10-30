// Hallazgo de cli-init.md §15: border-control sobre neutral-soft (solo lectura, #186) con neutros teñidos, y el mensaje
// que redondeaba 2,99:1 a «3:1, mínimo 3:1».
import { describe, it, expect } from 'vitest'
import { buildTheme, contrast, parseHex, tintedNeutrals, toHex, validateTheme, DEFAULTS } from '../src/index.js'
import { below } from '../src/validate.js'

const c = (n) => `--g-color-${n}`
describe('border-control-readonly', () => {
  it('#0F766E con neutros teñidos ya pasa, con border-control ≥ 3:1 sobre neutral-soft, la superficie y la hundida', () => {
    const r = buildTheme({ brand: '#0F766E' })
    expect(r.issues.filter((i) => i.severity === 'error')).toEqual([])
    for (const bg of ['neutral-soft', 'surface', 'surface-sunken']) expect(contrast(parseHex(r.tokens[c('border-control')]), parseHex(r.tokens[c(bg)])), bg).toBeGreaterThanOrEqual(3)
    expect(r.tokens[c('border-control')]).toBe('#858A89')
  })
  it('el cambio es mínimo: solo se aleja cuando no llega (#7A1F5C y el tema por defecto, sin cambios)', () => {
    // Lo que ya daban los neutros teñidos, sin el paso nuevo
    for (const brand of ['#7A1F5C', '#2563EB']) expect(buildTheme({ brand }).tokens[c('border-control')]).toBe(tintedNeutrals(brand)[c('border-control')])
    expect(buildTheme({}).tokens[c('border-control')]).toBe(DEFAULTS[c('border-control')])
  })
  // Corpus determinista de 2000 marcas (el generador de zone.test.js): ninguna falla ya este par, en claro ni en oscuro
  it('2000 marcas aleatorias: 0 fallos de border-control-readonly', () => {
    let seed = 20261013
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647
    const hex = () => toHex([0, 0, 0].map(() => Math.floor(rnd() * 256)))
    const fails = []
    for (let i = 0; i < 2000; i++) {
      const cfg = { brand: hex(), ...(rnd() < 0.5 ? { accent: hex() } : {}), ...(rnd() < 0.3 ? { neutralsHue: 'accent' } : {}) }
      for (const x of buildTheme(cfg).issues) if (x.id === 'border-control-readonly') fails.push(cfg)
    }
    expect(fails).toEqual([])
  }, 120000)
})

describe('contraste que no llega: truncado, nunca redondeado hacia el mínimo', () => {
  it('below trunca a dos decimales', () => {
    expect(below(2.9951)).toBe(2.99)
    expect(below(2.999999)).toBe(2.99)
    expect(below(4.4999)).toBe(4.49)
    expect(below(1.2)).toBe(1.2)
  })
  it('un par a 2,99x:1 se informa como 2.99:1, no como 3:1', () => {
    // Busca un borde a [2,995, 3) de neutral-soft (#F0F0F0)
    const soft = parseHex(DEFAULTS[c('neutral-soft')])
    let found
    for (let r = 120; r < 150 && !found; r++) for (let g = 120; g < 150 && !found; g++) for (let b = 120; b < 150 && !found; b++) {
      const k = contrast([r, g, b], soft)
      if (k >= 2.995 && k < 3) found = toHex([r, g, b])
    }
    expect(found).toBeTruthy()
    const issue = validateTheme({ ...DEFAULTS, [c('border-control')]: found }).find((i) => i.id === 'border-control-readonly')
    expect(issue.message).toMatch(/contraste 2\.99:1, mínimo 3:1/)
    expect(issue.ratio).toBe(2.99)
  })
})
