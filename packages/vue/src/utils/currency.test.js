// @vitest-environment node
// utils/currency.js, la tabla de símbolos y formatPrice (utils/price.js) · price.md «Verificación · bruno» (#769, #770, #774,
// #775). En Node, sin DOM: también es la prueba de que formatPrice funciona en SSR.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { currencyAffix, currencyCode, currencyDigits, currencyName, isShared, nf, stripCurrency } from './currency.js'
import { SHARED_SYMBOLS } from './currencySymbols.js'
import { formatPrice } from './price.js'
import { current, render, sharedFromIntl } from '../../scripts/currency-symbols.mjs'

const L = { free: 'Gratis', onRequest: 'Precio a consultar', before: 'Antes', range: '{min} a {max}', saving: 'Ahorras {amount}', approx: 'aprox.', total: 'Total' }
const mx = (amount, x) => ({ amount, currency: 'MXN', ...x })
const fp = (v, o = {}) => formatPrice(v, { locale: 'es-MX', labels: L, ...o })
const BIDI = /[‎‏؜]/
// Intl separa el código de la cifra con U+00A0: las expectativas se escriben con espacio normal
const sp = (t) => t.replace(/\u00a0/g, ' ')

let warn
beforeEach(() => { warn = vi.spyOn(console, 'warn').mockImplementation(() => {}) })
afterEach(() => vi.restoreAllMocks())

describe('sin DOM', () => {
  it('Node sin window ni document', () => {
    expect(typeof window).toBe('undefined')
    expect(typeof document).toBe('undefined')
  })
})

describe('tabla de símbolos compartidos (#770)', () => {
  it('contiene todo lo que da el Intl de Node (falla si no se ejecutó scripts/currency-symbols.mjs)', () => {
    for (const s of sharedFromIntl()) expect(SHARED_SYMBOLS, s).toContain(s)
    expect(SHARED_SYMBOLS).toEqual(expect.arrayContaining(['$', '¥', 'kr', '£', '₩', 'Rs', 'Bs']))
  })
  it('el script solo crece: lee lo que ya estaba y escribe la unión', () => {
    const dir = mkdtempSync(join(tmpdir(), 'grana-sym-'))
    const f = join(dir, 'currencySymbols.js')
    writeFileSync(f, render(['$', 'ZZ']))
    expect(current(f)).toEqual(['$', 'ZZ'])
    const merged = [...current(f), ...sharedFromIntl().filter((s) => !current(f).includes(s))]
    expect(merged).toContain('ZZ')
    expect(merged).toContain('£')
  })
  it('el módulo de datos es un literal (sin efectos en el nivel superior, #444)', () => {
    const src = readFileSync(resolve(process.cwd(), 'src/utils/currencySymbols.js'), 'utf8')
    expect(src).toMatch(/^export const SHARED_SYMBOLS = \[[^\]]*\]$/m)
    expect(src.replace(/\/\/[^\n]*/g, '')).not.toMatch(/Intl|supportedValuesOf/)
    expect(isShared('$')).toBe(true)
    expect(isShared('€')).toBe(false)
  })
})

describe('datos de la moneda', () => {
  it('currencyDigits: MXN 2, JPY 0, KWD 3; moneda mal formada: 2', () => {
    expect(currencyDigits('MXN')).toBe(2)
    expect(currencyDigits('jpy')).toBe(0)
    expect(currencyDigits('KWD', 'es-MX')).toBe(3)
    expect(currencyDigits('peso')).toBe(2)
  })
  it('currencyCode normaliza a mayúsculas y rechaza lo mal formado', () => {
    expect(currencyCode('mxn')).toBe('MXN')
    expect(currencyCode('MXNN')).toBe(null)
    expect(currencyCode(undefined)).toBe(null)
  })
  it('caché: un Intl.NumberFormat por idioma y opciones', () => {
    expect(nf('es-MX', { style: 'currency', currency: 'MXN' })).toBe(nf('es-MX', { style: 'currency', currency: 'MXN' }))
    expect(nf('xx-invalid-123456789', {})).toBe(null)
  })
  it('nombre en plural y singular; afijo del campo (lado, visible y nombre)', () => {
    expect(currencyName('MXN', 'es-MX')).toBe('pesos mexicanos')
    expect(currencyName('MXN', 'es-MX', false)).toBe('peso mexicano')
    expect(currencyAffix('MXN', 'es-MX')).toEqual({ side: 'prefix', symbol: '$', visible: '$ MXN', name: 'pesos mexicanos' })
    expect(currencyAffix('MXN', 'en-US').visible).toBe('MX$')
    expect(currencyAffix('EUR', 'de-DE')).toMatchObject({ side: 'suffix', visible: '€' })
  })
  it('stripCurrency quita símbolo, código, nombre y espacios de ESA moneda; otra moneda no', () => {
    expect(stripCurrency('$1,850.00 MXN', 'MXN', 'es-MX')).toBe('1,850.00')
    expect(stripCurrency('mxn 95', 'MXN', 'es-MX')).toBe('95')
    expect(stripCurrency('1.850,00 €', 'EUR', 'de-DE')).toBe('1.850,00')
    expect(stripCurrency('€50', 'MXN', 'es-MX')).toBe('€50')
  })
})

describe('formatPrice · casos de kiwi', () => {
  it('base: lead y unidad; lo visible corto y la frase con el nombre', () => {
    const r = fp(mx(1850), { lead: 'desde', unit: '/ noche', unitLabel: 'por noche' })
    expect(r.state).toBe('amount')
    expect(r.currency).toBe('MXN')
    expect(r.text).toBe('desde $1,850 MXN / noche')
    expect(r.spoken).toBe('desde 1,850 pesos mexicanos por noche')
    expect(r.parts.amount).toEqual({ minus: '', symbolBefore: '$', number: '1,850', symbolAfter: '', code: 'MXN', currency: 'MXN' })
  })
  it('ambigüedad por idioma: es-MX+MXN con código, en-US+MXN «MX$» sin código, es-MX+USD «USD 95», de-DE+EUR «1.850 €»', () => {
    expect(fp(mx(1850)).text).toBe('$1,850 MXN')
    expect(fp(mx(1850), { locale: 'en-US' }).text).toBe('MX$1,850')
    expect(sp(fp({ amount: 95, currency: 'USD' }).text)).toBe('USD 95')
    expect(sp(fp({ amount: 1850, currency: 'EUR' }, { locale: 'de-DE' }).text)).toBe('1.850 €')
    expect(fp(mx(1850), { locale: 'en-US' }).spoken).toBe('1,850 Mexican pesos')
  })
  it('decimales de la moneda: JPY 0, KWD 3; sin «,00» en los enteros con cents auto', () => {
    expect(sp(fp({ amount: 12800, currency: 'JPY' }).text)).toBe('JPY 12,800')
    expect(sp(fp({ amount: 12.125, currency: 'KWD' }).text)).toBe('KWD 12.125')
    expect(fp(mx(1850.5)).text).toBe('$1,850.50 MXN')
    expect(fp(mx(1850.5)).spoken).toBe('1,850.50 pesos mexicanos')
  })
  it('cents: always, never, auto', () => {
    expect(fp(mx(1850), { cents: 'always' }).text).toBe('$1,850.00 MXN')
    expect(fp(mx(1850), { cents: 'always' }).spoken).toBe('1,850 pesos mexicanos')
    expect(fp(mx(1850.6), { cents: 'never' }).text).toBe('$1,851 MXN')
    expect(fp(mx(1850.6), { cents: 'never' }).spoken).toBe('1,851 pesos mexicanos')
  })
  it('display: symbol, code, none', () => {
    expect(fp(mx(1850), { display: 'symbol' }).text).toBe('$1,850')
    expect(sp(fp(mx(1850), { display: 'code' }).text)).toBe('MXN 1,850')
    expect(fp(mx(1850), { display: 'none' }).text).toBe('1,850')
    expect(fp(mx(1850), { display: 'none' }).spoken).toBe('1,850 pesos mexicanos')
  })
  it('la región que declara la moneda omite el código; lo extranjero lo conserva', () => {
    expect(fp(mx(1850), { scopeCurrency: 'MXN' }).text).toBe('$1,850')
    expect(sp(fp({ amount: 190, currency: 'USD' }, { scopeCurrency: 'MXN', cents: 'always' }).text)).toBe('USD 190.00')
  })
  it('negativo: U+2212 visible delante del símbolo, «-» leído', () => {
    const r = fp(mx(-200), { cents: 'always' })
    expect(r.text).toBe('−$200.00 MXN')
    expect(r.parts.amount.minus).toBe('−')
    expect(r.spoken).toBe('-200 pesos mexicanos')
    expect(sp(fp({ amount: -200, currency: 'EUR' }, { locale: 'de-DE' }).text)).toBe('−200 €')
  })
  it('árabe: cifras del idioma, símbolo en su lado, sin marcas bidi', () => {
    const r = fp({ amount: 1850, currency: 'EGP' }, { locale: 'ar-EG' })
    expect(r.text).toMatch(/١٬٨٥٠/)
    expect(r.text).not.toMatch(BIDI)
    expect(r.spoken).not.toMatch(BIDI)
    expect(r.parts.amount.symbolAfter).toMatch(/ج\.م\./)
  })
  it('rango con la plantilla, nunca formatRange: mínimo sin código, máximo con símbolo y código; lectura con número y nombre', () => {
    const r = fp(mx(900), { max: mx(1400) })
    expect(r.text).toBe('$900 a $1,400 MXN')
    expect(r.spoken).toBe('900 a 1,400 pesos mexicanos')
    expect(r.parts.range).toMatchObject({ before: '', between: 'a', after: '' })
    expect(r.parts.range.max.code).toBe('MXN')
    expect(r.parts.amount.code).toBe('')
    expect(fp(mx(900), { max: mx(1400), labels: {} }).parts.range).toBe(null)
  })
  it('cero → free con labels.free; sin él, el cero formateado; null → onRequest', () => {
    expect(fp(mx(0))).toMatchObject({ state: 'free', text: 'Gratis', spoken: 'Gratis' })
    expect(fp(mx(0), { labels: {} }).text).toBe('$0 MXN')
    expect(fp(null)).toMatchObject({ state: 'onRequest', text: 'Precio a consultar', currency: null })
    expect(fp(null).parts.amount).toBe(null)
  })
  it('aproximado: labels.approx delante, visible y leído', () => {
    const r = fp({ amount: 105, currency: 'USD', approximate: true })
    expect(sp(r.text)).toBe('aprox. USD 105')
    expect(r.spoken).toBe('aprox. 105 dólares estadounidenses')
  })
  it('alternativas: la de la vista, si no la de la región, si no la primera; max/compareAt/total en esa moneda', () => {
    const v = [mx(1850), { amount: 105.11, currency: 'USD', approximate: true }]
    expect(sp(fp(v, { view: 'USD', scopeCurrency: 'USD' }).text)).toBe('aprox. USD 105.11')
    expect(fp(v, { scopeCurrency: 'MXN' }).currency).toBe('MXN')
    expect(fp(v).currency).toBe('MXN')
    const r = fp(v, { view: 'USD', compareAt: [mx(2300), { amount: 130, currency: 'USD' }], compareLabel: 'Temporada alta' })
    expect(sp(r.parts.compare.text)).toBe('USD 130')
    expect(fp(v, { view: 'USD', compareAt: mx(2300), compareLabel: 'T' }).parts.compare).toBe(null)
  })
  it('referencia trace: nombrada, sin código, con ahorro sin error de coma flotante (2300 − 1850.1 = 449.9)', () => {
    const r = fp(mx(1850.1), { compareAt: mx(2300), compareLabel: 'Temporada alta' })
    expect(r.parts.compare).toMatchObject({ label: 'Temporada alta', style: 'trace', text: '$2,300' })
    expect(r.parts.saving.amount).toEqual({ amount: 449.9, currency: 'MXN' })
    expect(r.parts.saving.text).toBe('Ahorras $449.90')
    expect(r.spoken).toBe('1,850.10 pesos mexicanos. Temporada alta: 2,300 pesos mexicanos. Ahorras 449.90 pesos mexicanos')
    expect(fp(mx(1850), { compareAt: mx(2300), compareLabel: 'X' }).parts.saving.amount.amount).toBe(450)
  })
  it('trace sin compareLabel: labels.before; sin los dos no se pinta; strike: tachado sin ahorro', () => {
    expect(fp(mx(1850), { compareAt: mx(2300) }).parts.compare.label).toBe('Antes')
    expect(fp(mx(1850), { compareAt: mx(2300), labels: {} }).parts.compare).toBe(null)
    const s = fp(mx(1850), { compareAt: mx(2300), compareStyle: 'strike' })
    expect(s.parts.compare.style).toBe('strike')
    expect(s.parts.saving).toBe(null)
    expect(s.spoken).toBe('1,850 pesos mexicanos. Antes: 2,300 pesos mexicanos')
  })
  it('gratis con referencia: «Gratis», la referencia y el ahorro', () => {
    const r = fp(mx(0), { compareAt: mx(150), compareLabel: 'Precio de lista' })
    expect(r.state).toBe('free')
    expect(r.parts.compare.text).toBe('$150')
    expect(r.spoken).toBe('Gratis. Precio de lista: 150 pesos mexicanos. Ahorras 150 pesos mexicanos')
  })
  it('A · total: la frase empieza por el total', () => {
    const r = fp(mx(1850), { lead: 'desde', unit: '/ noche', unitLabel: 'por noche', total: { value: mx(3700), label: 'por 2 noches' } })
    expect(r.parts.total).toMatchObject({ label: 'Total', unit: 'por 2 noches', text: '$3,700 MXN' })
    expect(r.spoken).toBe('Total por 2 noches: 3,700 pesos mexicanos. desde 1,850 pesos mexicanos por noche')
    expect(r.text).toBe('desde $1,850 MXN / noche')
  })
  it('inválido sin lanzar; amount no finito se lee como null', () => {
    expect(fp({ amount: 1, currency: 'pesos' })).toMatchObject({ state: 'invalid', text: '', spoken: '', currency: null })
    expect(fp({ amount: 1 }).state).toBe('invalid')
    expect(fp({ amount: NaN, currency: 'MXN' }).state).toBe('onRequest')
    expect(fp({ amount: Infinity, currency: 'MXN' }).state).toBe('onRequest')
    expect(() => formatPrice(undefined, { labels: L })).not.toThrow()
    expect(() => formatPrice('x', null)).not.toThrow()
  })
  it('sin marcas bidi en ninguna salida', () => {
    for (const loc of ['es-MX', 'en-US', 'de-DE', 'ar-EG', 'he']) {
      const r = fp(mx(-1850.5), { locale: loc, compareAt: mx(2000), compareLabel: 'X', total: { value: mx(3000), label: 'y' } })
      expect(r.text + r.spoken + r.parts.total.text, loc).not.toMatch(BIDI)
    }
  })
  it('forma canónica interna (SSR sin idioma): cifra ASCII y código', () => {
    const r = formatPrice(mx(1850.5), { labels: L }, { canonical: true })
    expect(r.text).toBe('1850.5 MXN')
    expect(r.spoken).toBe('1850.5 MXN')
  })
})

describe('formatPrice · avisos (una vez por motivo y moneda en el módulo)', () => {
  const msgs = () => warn.mock.calls.map((c) => c[0])
  it('avisos 1 a 9 con el prefijo de formatPrice; el mismo motivo no se repite', async () => {
    // Módulo nuevo: los avisos son una vez por motivo en el módulo y las pruebas de arriba ya consumieron algunos
    vi.resetModules()
    const { formatPrice } = await import('./price.js')
    const fp = (v, o = {}) => formatPrice(v, { locale: 'es-MX', labels: L, ...o })
    fp({ amount: 1, currency: 'qq' })
    fp({ amount: NaN, currency: 'CAD' })
    fp(mx(1), { max: { amount: 2, currency: 'USD' } })
    fp(mx(1), { cents: 'never' })
    fp(mx(3), { compareAt: mx(2), compareLabel: 'X' })
    fp({ amount: 3, currency: 'CLP' }, { compareAt: { amount: 5, currency: 'CLP' } })
    fp({ amount: 5, currency: 'COP' }, { max: { amount: 2, currency: 'COP' } })
    formatPrice({ amount: 0, currency: 'ARS' }, { locale: 'es-MX' })
    formatPrice(null, { locale: 'es-MX' })
    formatPrice({ amount: 1, currency: 'BRL', approximate: true }, { locale: 'es-MX' })
    fp({ amount: 1, currency: 'NZD' }, { total: { value: { amount: 1, currency: 'NZD' }, label: 'x' }, labels: {} })
    fp([mx(1), { amount: 1, currency: 'USD' }])
    formatPrice(mx(1), { locale: 'xx-invalid-123456789' })
    const m = msgs()
    expect(m.every((x) => x.startsWith('[Grana formatPrice]'))).toBe(true)
    for (const re of [/inválida o sin currency/, /no es finito/, /sin la moneda/, /compareAt ≤ value/, /sin compareLabel/, /max < value/, /labels\.free/, /labels\.onRequest/, /labels\.approx/, /labels\.total/, /varias alternativas/, /locale «xx-invalid/]) {
      expect(m.some((x) => re.test(x)), String(re)).toBe(true)
    }
    const n = warn.mock.calls.length
    formatPrice(null, { locale: 'es-MX' })
    fp([mx(1), { amount: 1, currency: 'USD' }])
    expect(warn.mock.calls.length).toBe(n)
  })
  it('con el ayudante interno de GPrice, el motivo va al ayudante (no al módulo)', () => {
    const calls = []
    formatPrice(null, {}, { warn: (k, t) => calls.push([k, t]) })
    expect(calls).toHaveLength(1)
    expect(warn).not.toHaveBeenCalled()
  })
})
