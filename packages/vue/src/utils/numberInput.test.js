// Motor numérico (number-field.md «Verificación · bruno»: motor; DECISIONS.md #309)
import { describe, it, expect } from 'vitest'
import {
  canonical, decimalsOf, filterTyped, formatNumber, formatRaw, isPartialValid, isValidLocale, localeInfo, parsePasted,
  partialNumber, roundTo, stepValue, textMatches, toAscii, typedAscii
} from './numberInput.js'

const es = localeInfo('es')
const en = localeInfo('en-US')
const he = localeInfo('he')
const ar = localeInfo('ar-EG')

describe('numberInput · idioma', () => {
  it('separadores y cifras de es, en, he y ar-EG, sin marcas bidi', () => {
    expect([es.decimal, es.group]).toEqual([',', '.'])
    expect([en.decimal, en.group]).toEqual(['.', ','])
    expect([he.decimal, he.group]).toEqual(['.', ','])
    expect([ar.decimal, ar.group]).toEqual(['٫', '٬'])
    expect(es.digits.join('')).toBe('0123456789')
    expect(ar.digits.join('')).toBe('٠١٢٣٤٥٦٧٨٩')
  })

  it('una etiqueta que Intl rechaza lanza RangeError; isValidLocale no lanza', () => {
    expect(() => localeInfo('es_MX')).toThrow(RangeError)
    expect(isValidLocale('es_MX')).toBe(false)
    expect(isValidLocale('ar-EG')).toBe(true)
  })

  it('formato de salida: miles con la regla del idioma, precisión, cifras del idioma y sin marcas bidi', () => {
    expect(formatNumber(1234.5, es)).toBe('1234,5') // es no agrupa 4 cifras
    expect(formatNumber(12345, es)).toBe('12.345')
    expect(formatNumber(1234567, es)).toBe('1.234.567')
    expect(formatNumber(2026, en)).toBe('2,026')
    expect(formatNumber(2026, en, { grouping: false })).toBe('2026')
    expect(formatNumber(37, es, { precision: 1 })).toBe('37,0')
    expect(formatNumber(1234.5, es, { precision: 2 })).toBe('1234,50')
    expect(formatNumber(-4.5, ar, { precision: 1 })).toBe('-٤٫٥')
    expect(formatNumber(-72.5, he)).toBe('-72.5') // sin U+200E delante
    expect(formatNumber(null, es)).toBe('')
    expect(formatRaw(1234567, es)).toBe('1234567')
    expect(formatRaw(36.6, es, { precision: 1 })).toBe('36,6')
  })

  it('valor canónico: punto decimal, sin miles ni exponente', () => {
    expect(canonical(72.5)).toBe('72.5')
    expect(canonical(12345)).toBe('12345')
    expect(canonical(null)).toBe('')
    expect(canonical(1e-7)).toBe('0.0000001')
    expect(canonical(1e21)).toBe('1000000000000000000000')
  })
})

describe('numberInput · escritura', () => {
  it('cifras del idioma y latinas a ASCII; signos menos tipográficos a «-»', () => {
    expect(toAscii('-٤٫٥', ar)).toBe('-4٫5')
    expect(typedAscii('-٤٫٥', ar)).toBe('-4.5')
    expect(typedAscii('٣٫٥', ar)).toBe('3.5')
    expect(typedAscii('−3', es)).toBe('-3')
    expect(typedAscii('36,5', es)).toBe('36.5')
    expect(typedAscii('36.5', es)).toBe('36.5')
  })

  it('filtro: letras, «e», segundo separador, «-» sin negativos o fuera del principio y separador con precision 0', () => {
    const o = { decimals: true, negative: true }
    expect(isPartialValid('36a', o)).toBe(false)
    expect(isPartialValid('1e5', o)).toBe(false)
    expect(isPartialValid('1.2.3', o)).toBe(false)
    expect(isPartialValid('1-', o)).toBe(false)
    expect(isPartialValid('-', { decimals: true, negative: false })).toBe(false)
    expect(isPartialValid('1.', { decimals: false, negative: true })).toBe(false)
    expect(isPartialValid('-1.', o)).toBe(true)
    expect(isPartialValid('', o)).toBe(true)
  })

  it('el separador tecleado se convierte al del idioma («36.5» → «36,5» en es; «.» → «٫» en ar-EG)', () => {
    expect(filterTyped('36.5', es)).toEqual({ ok: true, text: '36,5', value: 36.5 })
    expect(filterTyped('36,5', en)).toEqual({ ok: true, text: '36.5', value: 36.5 })
    expect(filterTyped('٣.5', ar).text).toBe('٣٫5')
    expect(filterTyped('1,2,', es).ok).toBe(false)
    expect(filterTyped('abc', es).ok).toBe(false)
  })

  it('parcial: «1,» → 1; «-», «,», «-,» → null', () => {
    expect(filterTyped('1,', es).value).toBe(1)
    expect(partialNumber('-')).toBe(null)
    expect(filterTyped(',', es).value).toBe(null)
    expect(filterTyped('-,', es).value).toBe(null)
    expect(partialNumber('')).toBe(null)
  })

  it('textMatches: «1,» ya dice 1 (no se reescribe); «36,55» con precision 1 dice 36,6', () => {
    expect(textMatches('1,', 1, es)).toBe(true)
    expect(textMatches('36,55', 36.6, es, 1)).toBe(true)
    expect(textMatches('2', 1, es)).toBe(false)
  })
})

describe('numberInput · pegado (cuatro reglas)', () => {
  it('dos tipos de separador: el último es el decimal', () => {
    expect(parsePasted('1,234.5', es)).toBe(1234.5)
    expect(parsePasted('1.234,5', en)).toBe(1234.5)
  })
  it('uno repetido: miles', () => {
    expect(parsePasted('1.234.567', es)).toBe(1234567)
    expect(parsePasted('1,234,567', es)).toBe(1234567)
  })
  it('uno solo + tres cifras y es el de miles del idioma: miles; si no, decimal', () => {
    expect(parsePasted('12.345', es)).toBe(12345)
    expect(parsePasted('12.345', en)).toBe(12.345)
    expect(parsePasted('12,345', en)).toBe(12345)
    expect(parsePasted('12,5', es)).toBe(12.5)
    expect(parsePasted('72.5', es)).toBe(72.5)
  })
  it('lo que no es número no entra; cifras del idioma y espacios', () => {
    expect(parsePasted('setenta', es)).toBe(null)
    expect(parsePasted('12 kg', es)).toBe(null)
    expect(parsePasted(' 1 234,5 ', es)).toBe(1234.5)
    expect(parsePasted('٣٫٥', ar)).toBe(3.5)
    expect(parsePasted('-4,5', es)).toBe(-4.5)
  })
})

describe('numberInput · redondeo y rejilla', () => {
  it('decimales y redondeo sin error de coma flotante', () => {
    expect(decimalsOf(0.1)).toBe(1)
    expect(decimalsOf(0.25)).toBe(2)
    expect(decimalsOf(1e-7)).toBe(7)
    expect(decimalsOf(30)).toBe(0)
    expect(roundTo(36.55, 1)).toBe(36.6)
    expect(roundTo(1.005, 2)).toBe(1.01)
    expect(roundTo(-0.04, 1)).toBe(0)
    expect(roundTo(5, undefined)).toBe(5)
    expect(roundTo(null, 1)).toBe(null)
  })

  it('pasos exactos: 72,5 + 3 × 0,1 = 72,8', () => {
    let v = 72.5
    for (let i = 0; i < 3; i++) v = stepValue(v, { dir: 1, step: 0.1, min: 0, max: 400, precision: 1 })
    expect(v).toBe(72.8)
    expect(stepValue(0.2, { dir: 1, step: 0.1 })).toBe(0.3)
  })

  it('encaja en la rejilla de step desde min: ↑ desde 72,53 con step 0,1 → 72,6; ↓ → 72,5', () => {
    expect(stepValue(72.53, { dir: 1, step: 0.1, min: 0 })).toBe(72.6)
    expect(stepValue(72.53, { dir: -1, step: 0.1, min: 0 })).toBe(72.5)
    expect(stepValue(3, { dir: 1, step: 5, min: 1 })).toBe(6) // rejilla 1, 6, 11…
    expect(stepValue(6, { dir: -1, step: 5, min: 1 })).toBe(1)
  })

  it('× 10 (Shift / Re Pág)', () => {
    expect(stepValue(36, { dir: 1, mult: 10 })).toBe(46)
    expect(stepValue(46, { dir: -1, mult: 10 })).toBe(36)
  })

  it('límites: nunca rebasa; desde fuera de rango entra al límite', () => {
    expect(stepValue(120, { dir: 1, max: 120 })).toBe(120)
    expect(stepValue(150, { dir: -1, max: 120 })).toBe(120)
    expect(stepValue(5, { dir: 1, min: 30 })).toBe(30)
    expect(stepValue(99, { dir: 1, mult: 10, max: 100 })).toBe(100)
  })

  it('punto de partida: 0, o el límite más cercano si 0 queda fuera', () => {
    expect(stepValue(null, { dir: 1 })).toBe(0)
    expect(stepValue(null, { dir: -1, min: 30, max: 45 })).toBe(30)
    expect(stepValue(null, { dir: 1, min: -10, max: -5 })).toBe(-5)
  })

  it('precision menor que los decimales de step: el resultado se redondea a precision', () => {
    expect(stepValue(1, { dir: 1, step: 0.25, precision: 1 })).toBe(1.3)
  })
})
