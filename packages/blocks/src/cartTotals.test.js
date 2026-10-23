// @vitest-environment node
// cartTotals (dueño: bruno; _comun.md §29 «Verificación», #911). En Node, sin DOM: la utilidad es pura (SSR, worker, servidor).
import { describe, it, expect, afterEach, vi } from 'vitest'
import { cartTotals } from './cartTotals.js'
import { CART_LINES, CART_OPTIONS, CART_TOTALS } from './blocks/bank/ecommerce.js'

const mxn = (amount, extra = {}) => ({ amount, currency: 'MXN', ...extra })
const line = (id, amount, quantity = 1, extra = {}) => ({ id, product: { id, name: id }, quantity, unitPrice: mxn(amount), ...extra })
const LABELS = { subtotal: 'Subtotal', total: 'Total' }
const run = (lines, o = {}) => cartTotals(lines, { currency: 'MXN', labels: LABELS, ...o })
let warns = []
const spy = () => { warns = []; vi.spyOn(console, 'warn').mockImplementation((...a) => warns.push(a.join(' '))) }
const code = (c) => warns.filter((t) => t.startsWith('[Grana cartTotals]') && t.includes(`(${c})`))
afterEach(() => vi.restoreAllMocks())

describe('cartTotals · enteros escalados (regla 1)', () => {
  it('sin error de coma flotante: 0.1 + 0.2 = 0.3 y 3 × 33.33 = 99.99', () => {
    expect(run([line('a', 0.1), line('b', 0.2)]).total.value.amount).toBe(0.3)
    expect(run([line('a', 33.33, 3)]).total.value.amount).toBe(99.99)
    expect(run([line('a', 1.005)]).subtotal.amount).toBe(1.01)
  })
  it('JPY sin decimales y KWD con tres', () => {
    expect(cartTotals([{ id: 'a', quantity: 3, unitPrice: { amount: 1234.6, currency: 'JPY' } }], { currency: 'JPY', labels: LABELS }).total.value).toEqual({ amount: 3705, currency: 'JPY' })
    const k = cartTotals([{ id: 'a', quantity: 3, unitPrice: { amount: 0.1235, currency: 'KWD' } }], { currency: 'KWD', labels: LABELS })
    expect(k.subtotal.amount).toBe(0.372)
    expect(cartTotals([line('a', 10)], { currency: 'kwd', labels: LABELS }).total.value.currency).toBe('KWD')
  })
})

describe('cartTotals · líneas (regla 2)', () => {
  it('CartLine.total gana a la multiplicación; byLine por String(id); count de piezas que entran', () => {
    const r = run([line(1, 100, 3, { total: mxn(270) }), line('b', 50, 2)])
    expect(r.subtotal.amount).toBe(370)
    expect(r.byLine).toEqual({ 1: mxn(270), b: mxn(100) })
    expect(r.count).toBe(5)
  })
  it('no disponibles, de otra moneda y con quantity inválida van a excluded y no cuentan', () => {
    spy()
    const r = run([line('a', 100), line('b', 50, 1, { available: false }), line('c', 50, 1, { available: 'Ya no queda' }), { id: 'd', quantity: 1, unitPrice: { amount: 5, currency: 'USD' } }, line('e', 10, 1.5), line('f', 10, 0)])
    expect(r.excluded).toEqual(['b', 'c', 'd', 'e', 'f'])
    expect(r.count).toBe(1)
    expect(r.subtotal.amount).toBe(100)
    expect(code('CT2')).toHaveLength(1) // una vez por llamada; quantity 0 (quitar) no avisa
  })
  it('de un Money[] se toma la alternativa de la moneda del carrito', () => {
    const r = run([{ id: 'a', quantity: 2, unitPrice: [{ amount: 5, currency: 'USD' }, mxn(90)] }])
    expect(r.subtotal).toEqual(mxn(180))
  })
})

describe('cartTotals · orden, descuentos, envío e impuestos (reglas 3 a 5)', () => {
  it('descuentos percent (sobre el subtotal, redondeado) y amount, en orden, negativos en las líneas', () => {
    const r = run([line('a', 333.33)], { discounts: [{ label: '10 %', percent: 10 }, { label: 'Cupón', amount: mxn(50) }] })
    expect(r.lines.map((l) => [l.kind, l.label, l.amount && l.amount.amount])).toEqual([['subtotal', 'Subtotal', 333.33], ['discount', '10 %', -33.33], ['discount', 'Cupón', -50]])
    expect(r.total.value.amount).toBe(250)
  })
  it('nunca por debajo de 0: lo que sobra se recorta (CT3)', () => {
    spy()
    const r = run([line('a', 100)], { discounts: [{ label: 'A', amount: mxn(80) }, { label: 'B', amount: mxn(80) }] })
    expect(r.total.value.amount).toBe(0)
    expect(r.lines[2].amount.amount).toBe(-20)
    expect(code('CT3')).toHaveLength(1)
  })
  it('IVA no incluido 16 % sobre (subtotal − descuentos) y se suma', () => {
    const r = run([line('a', 1000)], { discounts: [{ label: 'D', amount: mxn(100) }], taxes: [{ label: 'IVA', rate: 0.16 }] })
    expect(r.lines.at(-1)).toEqual({ label: 'IVA', amount: mxn(144), kind: 'tax', included: false })
    expect(r.total.value.amount).toBe(1044)
  })
  it('IVA incluido (Barro y Agave: 2 880 MXN → 397.24) se dice y no se suma', () => {
    const r = run([line('a', 890, 2), line('b', 1100)], { taxes: [{ label: 'Incluye IVA', rate: 0.16, included: true }] })
    expect(r.subtotal.amount).toBe(2880)
    expect(r.lines.at(-1)).toEqual({ label: 'Incluye IVA', amount: mxn(397.24), kind: 'tax', included: true })
    expect(r.total.value.amount).toBe(2880)
  })
  it('un impuesto con amount ya calculado se usa tal cual; sin rate ni amount, CT4 y se ignora', () => {
    spy()
    const r = run([line('a', 100)], { taxes: [{ label: 'Otro', amount: mxn(7.5) }, { label: 'Roto' }] })
    expect(r.total.value.amount).toBe(107.5)
    expect(r.lines.map((l) => l.label)).toEqual(['Subtotal', 'Otro'])
    expect(code('CT4')).toHaveLength(1)
  })
  it('envío: con importe se suma; null es «por calcular» (pending, amount null)', () => {
    expect(run([line('a', 100)], { shipping: { label: 'Envío', amount: mxn(150) } }).total.value.amount).toBe(250)
    const r = run([line('a', 100)], { shipping: { label: 'Envío', amount: null, note: 'Con tu código postal' } })
    expect(r.pending).toBe(true)
    expect(r.lines[1]).toEqual({ label: 'Envío', amount: null, kind: 'shipping', note: 'Con tu código postal' })
    expect(r.total.value.amount).toBe(100)
  })
  it('percent fuera de 0..100: CT5 y se ignora', () => {
    spy()
    expect(run([line('a', 100)], { discounts: [{ label: 'X', percent: 120 }] }).total.value.amount).toBe(100)
    expect(code('CT5')).toHaveLength(1)
  })
  it('la etiqueta del total, texto o función de count', () => {
    expect(run([line('a', 1, 3)], { labels: { subtotal: 'S', total: (n) => `por ${n} piezas` } }).total.label).toBe('por 3 piezas')
    expect(run([line('a', 1)]).total.label).toBe('Total')
  })
  it('goals: alcanzado y por alcanzar con lo que falta (sobre el subtotal tras descuentos)', () => {
    const goals = [{ id: 'g1', label: 'Envío gratis', target: mxn(3000) }, { id: 'g2', label: 'Regalo', target: mxn(1000) }]
    const r = run([line('a', 1500)], { goals, discounts: [{ label: 'D', amount: mxn(100) }] })
    expect(r.goals).toEqual([
      { id: 'g1', label: 'Envío gratis', reached: false, remaining: mxn(1600), target: mxn(3000), value: mxn(1400) },
      { id: 'g2', label: 'Regalo', reached: true, remaining: mxn(0), target: mxn(1000), value: mxn(1400) }
    ])
  })
})

describe('cartTotals · aproximado, moneda inválida y pureza (reglas 6 y 7)', () => {
  it('approximate se contagia al total, al subtotal y a las líneas', () => {
    const r = run([line('a', 100), { id: 'b', quantity: 1, unitPrice: mxn(50, { approximate: true }) }])
    expect(r.approximate).toBe(true)
    expect(r.total.value.approximate).toBe(true)
    expect(r.subtotal.approximate).toBe(true)
    expect(r.byLine.a.approximate).toBe(true)
    expect(run([line('a', 100)]).approximate).toBe(false)
  })
  it('currency inválida o ausente: nunca lanza, todo a 0, excluded = todas y CT1', () => {
    spy()
    for (const currency of [undefined, 'pesos', 12]) {
      const r = cartTotals([line('a', 10), line('b', 5)], { currency, labels: LABELS })
      expect(r.total.value.amount).toBe(0)
      expect(r.excluded).toEqual(['a', 'b'])
      expect(r.count).toBe(0)
    }
    expect(() => cartTotals(null, null)).not.toThrow()
    expect(code('CT1').length).toBeGreaterThan(0)
  })
  it('los cinco avisos una vez por llamada, con el prefijo y la guarda (en producción, ninguno)', () => {
    spy()
    run([line('a', 100), line('b', 1, 1.5), line('c', 1, 2.5)], { discounts: [{ label: 'X', percent: -1 }, { label: 'Y', amount: mxn(500) }, { label: 'Z', amount: mxn(1) }], taxes: [{ label: 'T' }, { label: 'U' }] })
    expect(['CT2', 'CT3', 'CT4', 'CT5'].map((c) => code(c).length)).toEqual([1, 1, 1, 1])
    const env = process.env.NODE_ENV
    try {
      process.env.NODE_ENV = 'production'
      warns = []
      cartTotals([line('a', 1)], { currency: 'xx', labels: LABELS })
      expect(warns).toEqual([])
    } finally { process.env.NODE_ENV = env }
  })
  it('pura: no toca window ni document y no muta sus argumentos', () => {
    expect(typeof globalThis.window).toBe('undefined')
    const lines = [line('a', 10, 2)]
    const before = JSON.stringify(lines)
    cartTotals(lines, { currency: 'MXN', labels: LABELS })
    expect(JSON.stringify(lines)).toBe(before)
  })
  it('el carrito del banco: IVA incluido, envío por calcular, umbral y el plato excluido', () => {
    expect(CART_TOTALS).toEqual(cartTotals(CART_LINES, CART_OPTIONS))
    expect(CART_TOTALS.subtotal).toEqual(mxn(4180))
    expect(CART_TOTALS.excluded).toEqual(['l3'])
    expect(CART_TOTALS.count).toBe(3)
    expect(CART_TOTALS.pending).toBe(true)
    expect(CART_TOTALS.lines.map((l) => l.kind)).toEqual(['subtotal', 'shipping', 'tax'])
    expect(CART_TOTALS.lines[2]).toMatchObject({ included: true, amount: mxn(576.55) })
    expect(CART_TOTALS.total).toEqual({ value: mxn(4180), label: 'por 3 piezas' })
    expect(CART_TOTALS.goals[0]).toMatchObject({ reached: true, remaining: mxn(0) })
  })
})
