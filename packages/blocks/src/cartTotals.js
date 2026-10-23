// cartTotals · los totales del carrito (dueño: bruno; design/contracts/blocks/_comun.md §29, #911). La aritmética del carrito
// vive solo aquí (§27 regla 4): los bloques pintan `Totals` hechos, vengan de esta función o del servidor de la aplicación.
// Pura: sin DOM, sin estado, sin Vue; solo `currencyDigits` de @grana/vue/price (*peer*). Funciona en SSR, en un worker y en
// el servidor. Reglas:
//   1. Enteros escalados: cada importe pasa a unidades menores (`× 10^d`, d = currencyDigits) antes de operar.
//   2. Entra una línea disponible, con `quantity` entera > 0 y precio en `currency`; su total es `line.total` si viene.
//   3. subtotal → descuentos en orden (nunca por debajo de 0) → envío → impuestos no incluidos → total; los incluidos se
//      dicen (`base − base / (1 + rate)`) y no se suman.
//   4. Un redondeo por operación, a la unidad menor, mitad hacia fuera de cero.
//   5. `approximate` se contagia. 6. Nunca lanza. Avisos `[Grana cartTotals]` CT1 a CT5 con la guarda de #653.
import { currencyDigits } from '@grana/vue/price'

// Mitad hacia fuera de cero, tras quitar el ruido de coma flotante (1.005 × 100 = 100.49999…)
const round = (x) => { const n = Number(x.toPrecision(15)); return Math.sign(n) * Math.round(Math.abs(n)) }
const fin = (n) => typeof n === 'number' && Number.isFinite(n)

/** @param {object[]} lines @param {object} options */
export function cartTotals(lines, options) {
  const o = options && typeof options === 'object' ? options : {}
  const said = new Set()
  const warn = (code, text) => {
    try {
      if (process.env.NODE_ENV !== 'production' && !said.has(code)) { said.add(code); console.warn(`[Grana cartTotals] ${text} (${code}).`) }
    } catch {}
  }
  const list = Array.isArray(lines) ? lines : []
  const ok = typeof o.currency === 'string' && /^[A-Za-z]{3}$/.test(o.currency)
  const currency = ok ? o.currency.toUpperCase() : String(o.currency || '')
  const f = 10 ** (ok ? currencyDigits(currency) : 2)
  let approx = false
  // Un Money (o la alternativa de la moneda en un Money[]) a unidades menores; null si no hay en esta moneda
  const pick = (m) => {
    const x = Array.isArray(m) ? m.find((v) => v && String(v.currency).toUpperCase() === currency) : m
    if (!x || String(x.currency).toUpperCase() !== currency || !fin(x.amount)) return null
    if (x.approximate) approx = true
    return round(x.amount * f)
  }
  const money = (n) => ({ amount: (n || 0) / f, currency, ...(approx ? { approximate: true } : {}) })
  const L = o.labels && typeof o.labels === 'object' ? o.labels : {}
  const totalLabel = (n) => (typeof L.total === 'function' ? String(L.total(n)) : String(L.total ?? ''))

  if (!ok) {
    try { if (process.env.NODE_ENV !== 'production') warn('CT1', `currency «${o.currency}» no es un código ISO 4217: todo a 0 y ninguna línea entra`) } catch {}
    return { lines: [], total: { value: money(0), label: totalLabel(0) }, count: 0, subtotal: money(0), byLine: {}, excluded: list.map((l, i) => (l && l.id !== undefined ? l.id : i)), pending: false, approximate: false, goals: [] }
  }

  let sub = 0
  let count = 0
  const per = {}
  const excluded = []
  list.forEach((l, i) => {
    const id = l && l.id !== undefined && l.id !== null ? l.id : i
    if (!l || typeof l !== 'object' || (l.available !== undefined && l.available !== true)) return excluded.push(id)
    if (!Number.isInteger(l.quantity) || l.quantity <= 0) {
      try { if (process.env.NODE_ENV !== 'production' && !(l.quantity === 0)) warn('CT2', `la línea «${String(id)}» tiene quantity no entera`) } catch {}
      return excluded.push(id)
    }
    const given = l.total !== undefined && l.total !== null ? pick(l.total) : null
    const unit = given === null ? pick(l.unitPrice) : 0
    if (given === null && unit === null) {
      try { if (process.env.NODE_ENV !== 'production') warn('CT2', `la línea «${String(id)}» no tiene precio en ${currency}`) } catch {}
      return excluded.push(id)
    }
    const t = given !== null ? given : unit * l.quantity
    per[String(id)] = t
    sub += t
    count += l.quantity
  })

  const out = []
  let disc = 0
  for (const d of Array.isArray(o.discounts) ? o.discounts : []) {
    if (!d || typeof d !== 'object') continue
    let n
    if ('percent' in d) {
      if (!fin(d.percent) || d.percent < 0 || d.percent > 100) {
        try { if (process.env.NODE_ENV !== 'production') warn('CT5', `el descuento «${d.label}» tiene percent fuera de 0..100: se ignora`) } catch {}
        continue
      }
      n = round((sub * d.percent) / 100)
    } else n = pick(d.amount)
    if (n === null || n < 0) continue
    if (disc + n > sub) {
      try { if (process.env.NODE_ENV !== 'production') warn('CT3', 'los descuentos superan el subtotal: se recortan en 0') } catch {}
      n = sub - disc
    }
    disc += n
    out.push({ label: d.label, amount: n, kind: 'discount', neg: true })
  }
  const base = sub - disc
  let ship = 0
  let pending = false
  if (o.shipping && typeof o.shipping === 'object') {
    const s = o.shipping.amount === null ? null : pick(o.shipping.amount)
    if (s === null) pending = true
    else ship = s
    out.push({ label: o.shipping.label, amount: s, kind: 'shipping', note: o.shipping.note })
  }
  let tax = 0
  for (const t of Array.isArray(o.taxes) ? o.taxes : []) {
    if (!t || typeof t !== 'object') continue
    let n = t.amount !== undefined ? pick(t.amount) : null
    if (n === null && fin(t.rate) && t.rate >= 0) n = round(t.included ? base - base / (1 + t.rate) : base * t.rate)
    if (n === null) {
      try { if (process.env.NODE_ENV !== 'production') warn('CT4', `el impuesto «${t.label}» no tiene rate ni amount: se ignora`) } catch {}
      continue
    }
    if (!t.included) tax += n
    out.push({ label: t.label, amount: n, kind: 'tax', included: Boolean(t.included) })
  }

  // Los umbrales se leen antes de convertir nada: un objetivo aproximado también contagia
  const goals = (Array.isArray(o.goals) ? o.goals : []).map((g) => [g, g && typeof g === 'object' ? pick(g.target) : null]).filter(([, t]) => t !== null)
  const byLine = {}
  for (const k of Object.keys(per)) byLine[k] = money(per[k])
  const totals = [{ label: L.subtotal, amount: money(sub), kind: 'subtotal' }]
  for (const x of out) {
    const line = { label: x.label, amount: x.amount === null ? null : money(x.neg && x.amount ? -x.amount : x.amount), kind: x.kind }
    if (x.note !== undefined) line.note = x.note
    if (x.kind === 'tax') line.included = x.included
    totals.push(line)
  }
  return {
    lines: totals,
    total: { value: money(base + ship + tax), label: totalLabel(count) },
    count,
    subtotal: money(sub),
    byLine,
    excluded,
    pending,
    approximate: approx,
    goals: goals.map(([g, target]) => ({ id: g.id, label: g.label, reached: base >= target, remaining: money(Math.max(0, target - base)), target: money(target), value: money(base) }))
  }
}
