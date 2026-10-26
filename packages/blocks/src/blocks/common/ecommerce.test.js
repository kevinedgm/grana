// Lo común de Ecommerce (dueño: bruno; _comun.md §27 a §31): la elección que viaja, la variante resuelta, la calificación
// en palabras, EC1, EC4, EC5 y EC6. Lo usan las doce secciones (partes A, B y C).
import { describe, it, expect, vi } from 'vitest'
import { chosenOptions, countText, isCardField, missingOption, productKey, ratingText, requiredOptions, resolveVariant, shopRegion } from './ecommerce.js'
import { PRODUCTS, CART_LINES, PRICES } from '../bank/ecommerce.js'

const collect = () => { const out = []; const warn = (key, text) => out.push([key, text]); return { out, warn } }

describe('la elección que viaja (§27 regla 3)', () => {
  it('chosenOptions dice la elección con las palabras de la ficha, en el orden de las opciones', () => {
    expect(chosenOptions(PRODUCTS.huipil, { color: 'grana', talla: 'm' })).toEqual([
      { key: 'talla', label: 'Talla', value: 'M' },
      { key: 'color', label: 'Color', value: 'Grana' }
    ])
    // La misma ChosenOption que lleva la línea del carrito del banco
    expect(chosenOptions(PRODUCTS.rebozo, { color: 'grana' })).toEqual(CART_LINES[1].options)
    expect(chosenOptions(PRODUCTS.huipil, {})).toEqual([])
  })
  it('requiredOptions y missingOption: required por defecto true; la primera que falta', () => {
    expect(requiredOptions(PRODUCTS.huipil).map((o) => o.key)).toEqual(['talla', 'color'])
    expect(requiredOptions(PRODUCTS.jarro)).toEqual([])
    expect(missingOption(PRODUCTS.huipil, { color: 'grana' }).key).toBe('talla')
    expect(missingOption(PRODUCTS.huipil, { talla: 'm', color: 'grana' })).toBe(null)
  })
  it('resolveVariant: la variante de la elección o null; EC4 ignora las que no cubren todas las claves o se repiten', () => {
    expect(resolveVariant(PRODUCTS.huipil, { talla: 'm', color: 'grana' }, () => {}).variant.id).toBe('huipil-m-grana')
    expect(resolveVariant(PRODUCTS.huipil, { talla: 'ch', color: 'grana' }, () => {}).variant).toBe(null)
    const { out, warn } = collect()
    const p = { ...PRODUCTS.rebozo, variants: [...PRODUCTS.rebozo.variants, { id: 'x', options: {} }, { id: 'y', options: { color: 'grana' } }] }
    const r = resolveVariant(p, { color: 'grana' }, warn)
    expect(r.variants).toHaveLength(3)
    expect(r.variant.id).toBe('rebozo-grana')
    expect(out.map(([k]) => k)).toEqual(['EC4:3', 'EC4:4'])
  })
})

describe('calificación en palabras (§27 regla 5, EC2)', () => {
  const L = { rating: '{average} de {max} · {count} opiniones', noReviews: 'Todavía sin opiniones' }
  it('Intl por idioma, la cuenta con agrupación; en SSR sin idioma, un decimal con punto', () => {
    expect(ratingText({ average: 4.8, count: 1312 }, L, 'es', 'p', () => {})).toBe('4,8 de 5 · 1312 opiniones')
    expect(ratingText({ average: 4.8, count: 1312 }, L, 'es-MX', 'p', () => {})).toBe('4.8 de 5 · 1,312 opiniones')
    expect(ratingText({ average: 9, max: 10, count: 3 }, L, 'en-US', 'p', () => {})).toBe('9.0 de 10 · 3 opiniones')
    expect(ratingText({ average: 4.8, count: 312 }, L, undefined, 'p', () => {})).toBe('4.8 de 5 · 312 opiniones')
    expect(countText(1312, 'de')).toBe('1.312')
  })
  it('count 0: noReviews, nunca «0 de 5»; inválida: EC2 y nada', () => {
    expect(ratingText({ average: 0, count: 0 }, L, 'es', 'p', () => {})).toBe('Todavía sin opiniones')
    const { out, warn } = collect()
    expect(ratingText({ average: -1, count: 2 }, L, 'es', 'p', warn)).toBe('')
    expect(out[0][0]).toBe('EC2:p')
  })
})

describe('EC1, EC5 y EC6', () => {
  it('productKey: id:<id> o el índice con EC5', () => {
    const { out, warn } = collect()
    expect(productKey({ id: 7 }, 0, 'p', warn)).toBe('id:7')
    expect(productKey({}, 3, 'lines[3]', warn)).toBe('i:3')
    expect(out[0][0]).toBe('EC5:lines[3]')
  })
  it('isCardField: autocomplete cc-* o name card* no se pinta (EC6)', () => {
    const { out, warn } = collect()
    expect(isCardField({ name: 'cardNumber', label: 'Tarjeta' }, warn)).toBe(true)
    expect(isCardField({ name: 'n', autocomplete: 'section-pago cc-number', label: 'N' }, warn)).toBe(true)
    expect(isCardField({ name: 'email', autocomplete: 'email', label: 'Correo' }, warn)).toBe(false)
    expect(out.map(([k]) => k)).toEqual(['EC6:cardNumber', 'EC6:n'])
  })
  it('shopRegion: la región o null con EC1 si hay precios', () => {
    const { out, warn } = collect()
    expect(shopRegion(PRICES, true, warn)).toBe(PRICES)
    expect(shopRegion(undefined, true, warn)).toBe(null)
    expect(shopRegion(undefined, false, warn)).toBe(null)
    expect(out.map(([k]) => k)).toEqual(['EC1'])
  })
  it('los avisos llevan la guarda de #653 (en producción, ninguno)', () => {
    const env = process.env.NODE_ENV
    const warn = vi.fn()
    try {
      process.env.NODE_ENV = 'production'
      isCardField({ name: 'card' }, warn)
      productKey({}, 0, 'p', warn)
      ratingText({ average: 9, count: 1 }, {}, 'es', 'p', warn)
    } finally { process.env.NODE_ENV = env }
    expect(warn).not.toHaveBeenCalled()
  })
})
