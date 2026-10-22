// formatPrice · la regla del precio (dueño: bruno). design/contracts/price.md «formatPrice» (#769, #770, #774, #775).
// Pura: sin DOM, sin window, sin estado salvo la caché de Intl.NumberFormat (utils/currency.js); funciona en SSR, en un
// correo y en un worker; nunca lanza. Exportada solo desde @grana/vue/price (#776); los datos de la moneda (decimales,
// nombre, tabla de símbolos) llegan de utils/currency.js por __shared.
import { BIDI, currencyCode, currencyDigits, isShared, nf } from './currency.js'
import { fill } from './template.js'

const MINUS = '−' // U+2212: el menos tipográfico, delante del símbolo (lo visible; la lectura conserva el «-» de Intl)

// Avisos de formatPrice llamada por la aplicación: una vez por motivo y moneda en el módulo
const warned = new Set()
function moduleWarn(key, text) {
  try {
    if (process.env.NODE_ENV !== 'production' && !warned.has(key)) {
      warned.add(key)
      console.warn(`[Grana formatPrice] ${text}`)
    }
  } catch {}
}

const isInt = (n, d) => Math.round(n * 10 ** d) % 10 ** d === 0
const scaled = (n, d) => Math.round(n * 10 ** d)

/** `{ amount, currency }` normalizado; 'invalid' (moneda rechazada, sin currency) o null (amount no finito, null). */
function money(m, warn) {
  if (m == null) return null
  const c = currencyCode(m.currency)
  if (!c) {
    try { if (process.env.NODE_ENV !== 'production') warn(`m1|${m.currency}`, `moneda «${m.currency}» inválida o sin currency: no se pinta.`) } catch {}
    return 'invalid'
  }
  if (typeof m.amount !== 'number' || !Number.isFinite(m.amount)) {
    try { if (process.env.NODE_ENV !== 'production') warn(`m1n|${c}`, `amount ${m.amount} no es finito: se lee como null.`) } catch {}
    return null
  }
  return { amount: m.amount, currency: c, approximate: Boolean(m.approximate) }
}

/** Alternativa en la moneda `cur` (Money o Money[]); undefined si no la hay. */
function inCurrency(v, cur) {
  for (const m of Array.isArray(v) ? v : [v]) if (m && typeof m === 'object' && String(m.currency || '').toUpperCase() === cur) return m
}

/**
 * Partes visibles de un importe. `o`: { locale, display, cents, scope, canonical, noCode }. Con `canonical` (SSR sin
 * idioma), la cifra en ASCII y el código.
 */
function amountParts(m, o) {
  const { amount, currency } = m
  if (o.canonical) return { minus: '', symbolBefore: '', number: String(amount), symbolAfter: '', code: currency, currency }
  const d = currencyDigits(currency, o.locale)
  const opts = { style: 'currency', currency, currencyDisplay: o.display === 'code' ? 'code' : 'symbol' }
  if (o.cents === 'never') opts.maximumFractionDigits = opts.minimumFractionDigits = 0
  else if (o.cents === 'auto' && isInt(amount, d)) opts.minimumFractionDigits = 0
  const parts = nf(o.locale, opts).formatToParts(amount)
  const ni = parts.findIndex((p) => p.type === 'integer' || p.type === 'nan' || p.type === 'infinity')
  const near = (i) => parts[i - 1]?.type === 'currency' || parts[i + 1]?.type === 'currency'
  const out = { minus: '', symbolBefore: '', number: '', symbolAfter: '', code: '', currency }
  let symbol = ''
  parts.forEach((p, i) => {
    const v = p.value.replace(BIDI, '')
    if (p.type === 'minusSign') out.minus = MINUS
    else if (p.type === 'currency' || (p.type === 'literal' && near(i))) {
      if (p.type === 'currency') symbol = v
      if (o.display !== 'none') out[i < ni ? 'symbolBefore' : 'symbolAfter'] += v
    } else out.number += v
  })
  out.symbolBefore = out.symbolBefore.trimStart()
  out.symbolAfter = out.symbolAfter.trimEnd()
  if (o.display === 'auto' && !o.noCode && currency !== o.scope && isShared(symbol)) out.code = currency
  return out
}
const amountText = (p) => p.minus + p.symbolBefore + p.number + p.symbolAfter + (p.code ? ` ${p.code}` : '')

/** Lectura con el nombre de la moneda, sin decimales en los enteros («1,850 pesos mexicanos»). */
function spokenAmount(m, o) {
  if (o.canonical) return `${m.amount} ${m.currency}`
  const opts = { style: 'currency', currency: m.currency, currencyDisplay: 'name' }
  if (o.cents === 'never') opts.maximumFractionDigits = opts.minimumFractionDigits = 0
  else if (isInt(m.amount, currencyDigits(m.currency, o.locale))) opts.minimumFractionDigits = 0
  return nf(o.locale, opts).format(m.amount).replace(BIDI, '')
}
/** El número solo (el mínimo de un rango en la lectura: «900 a 1,400 pesos mexicanos»). */
function spokenNumber(m, o) {
  if (o.canonical) return String(m.amount)
  const d = o.cents === 'never' ? 0 : currencyDigits(m.currency, o.locale)
  return nf(o.locale, { minimumFractionDigits: isInt(m.amount, d) ? 0 : d, maximumFractionDigits: d }).format(m.amount).replace(BIDI, '')
}

const join = (...xs) => xs.filter(Boolean).join(' ')

/**
 * formatPrice(money, options) → { state, currency, text, spoken, parts }. price.md «formatPrice».
 * El tercer argumento es interno (no público): `{ warn, canonical }` de GPrice, para que un motivo avise una vez por
 * instancia y no se repita al pasar por aquí, y para la forma canónica del SSR sin idioma.
 */
export function formatPrice(value, options = {}, internal = {}) {
  const o0 = options || {}
  const warn = internal.warn || moduleWarn
  const labels = o0.labels || {}
  let locale = o0.locale || undefined
  if (locale && !nf(locale, {})) {
    try { if (process.env.NODE_ENV !== 'production') warn(`l9|${locale}`, `locale «${locale}» que Intl rechaza: se ignora.`) } catch {}
    locale = undefined
  }
  const view = currencyCode(o0.view)
  const scope = currencyCode(o0.scopeCurrency)
  const compareStyle = o0.compareStyle === 'strike' ? 'strike' : 'trace'
  const o = {
    locale,
    display: o0.display || 'auto',
    cents: o0.cents || 'auto',
    scope,
    canonical: Boolean(internal.canonical)
  }
  const result = (state, currency, text, spoken, parts = {}) => ({
    state, currency, text, spoken,
    parts: { lead: '', approx: '', unit: '', amount: null, range: null, compare: null, saving: null, total: null, ...parts }
  })

  // Alternativas (regla 9): la de la vista, si no la de la región, si no la primera
  let raw = value
  if (Array.isArray(value)) {
    if (value.length > 1 && !view && !scope) {
      try { if (process.env.NODE_ENV !== 'production') warn('a8', 'varias alternativas fuera de un GPriceScope: se usa la primera.') } catch {}
    }
    raw = (view && inCurrency(value, view)) || (scope && inCurrency(value, scope)) || value[0]
  }
  const m = money(raw, warn)
  if (m === 'invalid') return result('invalid', null, '', '')
  if (!m) {
    const t = labels.onRequest || ''
    if (!t) {
      try { if (process.env.NODE_ENV !== 'production') warn('t7r', 'falta labels.onRequest.') } catch {}
    }
    return result('onRequest', null, t, t)
  }
  const cur = m.currency
  // max, compareAt y total.value en la moneda del importe elegido (regla 9)
  const other = (v, what) => {
    if (v == null) return null
    const found = inCurrency(v, cur)
    if (!found) {
      try { if (process.env.NODE_ENV !== 'production') warn(`c2|${what}`, `${what} sin la moneda ${cur}: no se pinta.`) } catch {}
      return null
    }
    if (Array.isArray(v) && v.length > 1 && !view && !scope) {
      try { if (process.env.NODE_ENV !== 'production') warn('a8', 'varias alternativas fuera de un GPriceScope: se usa la primera.') } catch {}
    }
    const r = money(found, warn)
    return r === 'invalid' ? null : r
  }

  const lead = o0.lead || ''
  const unit = o0.unit || ''
  const unitLabel = o0.unitLabel || unit
  let approx = ''
  if (m.approximate) {
    approx = labels.approx || ''
    if (!approx) {
      try { if (process.env.NODE_ENV !== 'production') warn(`t7a|${cur}`, 'aproximado sin labels.approx: se pinta sin marca.') } catch {}
    }
  }

  // Rango (regla 5): plantilla labels.range, nunca formatRange
  let range = null
  let max = other(o0.max, 'max')
  if (max) {
    const tpl = labels.range || ''
    const i = tpl.indexOf('{min}')
    const j = tpl.indexOf('{max}')
    if (i < 0 || j < i) {
      try { if (process.env.NODE_ENV !== 'production') warn(`t7g|${cur}`, 'falta labels.range: el rango no se pinta.') } catch {}
      max = null
    } else {
      if (max.amount < m.amount) {
        try { if (process.env.NODE_ENV !== 'production') warn(`r6|${cur}`, 'max < value: se pinta tal cual.') } catch {}
      }
      range = { before: tpl.slice(0, i).trim(), between: tpl.slice(i + 5, j).trim(), after: tpl.slice(j + 5).trim(), max: amountParts(max, o), tpl }
    }
  }

  // Cero (regla 6)
  const zero = m.amount === 0 && !range
  const free = zero ? labels.free || '' : ''
  if (zero && !free) {
    try { if (process.env.NODE_ENV !== 'production') warn(`t7f|${cur}`, 'falta labels.free: se pinta el cero.') } catch {}
  }
  const amount = range ? amountParts(m, { ...o, noCode: true }) : amountParts(m, o)
  let nowText
  let nowSpoken
  if (range) {
    const minT = amountText(amount)
    const maxT = amountText(range.max)
    nowText = join(range.before, minT, range.between, maxT, range.after)
    nowSpoken = fill(range.tpl, { min: spokenNumber(m, o), max: spokenAmount(max, o) })
    delete range.tpl
  } else {
    nowText = free || amountText(amount)
    nowSpoken = free || spokenAmount(m, o)
  }
  const text = join(lead, approx, nowText, unit)
  let spoken = join(lead, approx, nowSpoken, unitLabel)

  // Referencia (regla 11; price.md «Referencia»)
  let compare = null
  let saving = null
  const cmp = other(o0.compareAt, 'compareAt')
  if (cmp) {
    const name = o0.compareLabel || labels.before || ''
    // trace exige nombrar con qué se compara; strike solo sin ningún nombre
    if (compareStyle === 'trace' ? !o0.compareLabel : !name) {
      try { if (process.env.NODE_ENV !== 'production') warn(`c5|${cur}`, `${compareStyle} sin compareLabel (nombra con qué comparas): se usa labels.before; sin él, no se pinta.`) } catch {}
    }
    if (name) {
      const cp = amountParts(cmp, { ...o, noCode: true })
      compare = { label: name, style: compareStyle, amount: cp, text: amountText(cp) }
      spoken += `. ${name}: ${spokenAmount(cmp, o)}`
      const d = currencyDigits(cur, o.locale)
      const diff = (scaled(cmp.amount, d) - scaled(m.amount, d)) / 10 ** d
      if (diff <= 0) {
        try { if (process.env.NODE_ENV !== 'production') warn(`c4|${cur}`, 'compareAt ≤ value: sin ahorro.') } catch {}
      } else if (compareStyle === 'trace' && labels.saving) {
        const sm = { amount: diff, currency: cur }
        saving = { text: fill(labels.saving, { amount: amountText(amountParts(sm, { ...o, noCode: true })) }), amount: sm }
        spoken += `. ${fill(labels.saving, { amount: spokenAmount(sm, o) })}`
      }
    }
  }

  // A · La cuenta (#773): el total de lo pedido, de la aplicación
  let total = null
  const tot = o0.total && typeof o0.total === 'object' ? other(o0.total.value, 'total') : null
  if (tot) {
    if (!labels.total) {
      try { if (process.env.NODE_ENV !== 'production') warn(`t7t|${cur}`, 'falta labels.total.') } catch {}
    }
    const tp = amountParts(tot, o)
    total = { label: labels.total || '', unit: o0.total.label || '', amount: tp, text: amountText(tp) }
    spoken = `${join(total.label, total.unit)}: ${spokenAmount(tot, o)}. ${spoken}`
  }

  return result(free ? 'free' : 'amount', cur, text, spoken, {
    lead, approx, unit, amount: free ? null : amount, range, compare, saving, total
  })
}

export { currencyDigits }
