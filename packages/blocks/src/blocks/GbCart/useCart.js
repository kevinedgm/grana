// GbCart · lo que comparten las tres variantes (dueño: bruno; cart.md «Anatomía de una línea», «El resumen», avisos C2, C3,
// C5, C7, K3, K4, EC1, EC5, CA1 a CA3). El bloque NO suma (§27 regla 4): pinta los `Totals` que recibe (de `cartTotals` o del
// servidor). Lo que sí guarda es estado de vista (§15 regla 9):
//   - La cantidad que se está escribiendo (vuelve a la de la aplicación si se deja vacía) y el evento nativo del último
//     gesto sobre la línea (GNumberField emite `change` con el número; el bloque lo reemite con ese evento).
//   - La huella (#913, #921; el patrón A «Huella» de GTag aplicado a la línea): «Quitar» (o cantidad 0) emite `remove`;
//     cuando la aplicación quita la línea de `lines`, el bloque deja en su sitio «Quitaste {name} · Deshacer» con el foco
//     en «Deshacer» (el foco nunca cae en body). «Deshacer» emite `restore` con la línea y su índice; la huella se va
//     cuando foco y puntero salen de ella (no por tiempo, 2.2.1) o cuando la línea vuelve (entonces el foco va a su
//     cantidad, o a su «Quitar» si no está disponible). Si la aplicación no quita la línea, no hay huella.
import { computed, getCurrentInstance, nextTick, ref, useId, watch } from 'vue'
import { formatPrice } from '@grana/vue/price'
import { fill, useLocale } from '../common/locale.js'
import { productKey, shopRegion } from '../common/ecommerce.js'
import { labelOf } from '../common/order.js'
import { availability } from '../common/price.js'
import { has } from '../common/text.js'
import { totalOf, totalsParts } from '../common/totals.js'
import { MAX_LINES } from './props.js'

export function useCart(props, emit, warn, variant) {
  const uid = useId()
  const locale = useLocale(props)
  const L = computed(() => props.labels || {})
  const busy = computed(() => new Set((Array.isArray(props.busy) ? props.busy : []).map(String)))

  // ---------- Líneas ----------
  const lines = computed(() => {
    const list = Array.isArray(props.lines) ? props.lines : []
    try { if (process.env.NODE_ENV !== 'production' && list.length > MAX_LINES) warn('C7', `lines con ${list.length} líneas; se recomiendan hasta ${MAX_LINES}: se pintan todas (C7).`) } catch {}
    const seen = new Set()
    const out = []
    list.forEach((line, index) => {
      if (!line || typeof line !== 'object' || !line.product || !has(line.product.name) || !line.unitPrice) {
        try { if (process.env.NODE_ENV !== 'production') warn(`C2:lines:${index}`, `lines[${index}] sin product.name o sin unitPrice: se omite (C2).`) } catch {}
        return
      }
      let key = productKey(line, index, 'lines', warn)
      if (seen.has(key)) {
        try { if (process.env.NODE_ENV !== 'production') warn(`C3:${key}`, `lines: id «${String(line.id)}» repetido; se usa el índice (C3).`) } catch {}
        key = `i:${index}`
      }
      seen.add(key)
      const min = Number.isFinite(line.min) ? line.min : 1
      const max = Number.isFinite(line.max) ? line.max : undefined
      try { if (process.env.NODE_ENV !== 'production' && (!Number.isFinite(line.quantity) || line.quantity < min || (max !== undefined && line.quantity > max))) warn(`CA1:${key}`, `lines «${line.product.name}» con quantity ${line.quantity} fuera de ${min}..${max ?? '∞'}: se pinta lo dado; GNumberField lo ajusta al gesto (CA1).`) } catch {}
      const av = availability(line, L.value, 'lines', warn)
      out.push({ key, line, index, min, max, available: av, busy: busy.value.has(String(line.id)), id: `${uid}-${key.replace(/[^\w-]/g, '_')}` })
    })
    return out
  })

  // ---------- Totales y región ----------
  const region = computed(() => shopRegion(props.prices, true, warn))
  const totals = computed(() => {
    const t = props.totals
    const total = totalOf(t)
    if (!total) {
      try { if (process.env.NODE_ENV !== 'production') warn('C2:totals', 'totals sin total: el resumen va sin total (C2).') } catch {}
      return null
    }
    try { if (process.env.NODE_ENV !== 'production' && !has(total.label)) warn('CA2', 'totals.total sin label: el total necesita su unidad («por 3 piezas») (CA2).') } catch {}
    return t
  })
  // Lo que no entra (§27 regla 1): `excluded` de CartTotals o, de un total del servidor, las líneas no disponibles
  const excluded = computed(() => {
    const t = props.totals
    const n = t && Array.isArray(t.excluded) ? t.excluded.length : lines.value.filter((x) => !x.available.ok).length
    if (!n) return ''
    const s = labelOf(L.value.excluded, 'count', n)
    try { if (process.env.NODE_ENV !== 'production' && !s) warn('C5:excluded', 'hay líneas que no entran y falta labels.excluded («{count} artículos no entran en tu pedido»): no se dice (C5).') } catch {}
    return s
  })
  // El umbral (el primero de `goals` de CartTotals): sí es un progreso hacia una meta (cart.md «El resumen»)
  const goal = computed(() => {
    const g = props.totals && Array.isArray(props.totals.goals) ? props.totals.goals[0] : null
    if (!g || !has(g.label) || !g.target || !g.value) return null
    const remaining = g.remaining ? formatPrice(g.remaining, { locale: locale.value, scopeCurrency: props.prices && props.prices.currency, labels: L.value.price }).text : ''
    const text = g.reached ? labelOf(L.value.goalReached, 'label', g.label) : typeof L.value.goal === 'function' ? String(L.value.goal({ label: g.label, remaining })) : has(L.value.goal) ? fill(L.value.goal, { label: g.label, remaining }) : ''
    if (!text) {
      try { if (process.env.NODE_ENV !== 'production') warn('C5:goal', 'hay goals y faltan labels.goal / labels.goalReached: sin umbral (C5).') } catch {}
      return null
    }
    return { goal: g, text }
  })
  const assuranceId = computed(() => (has(props.assurance) ? `${uid}-assurance` : undefined))
  const actions = computed(() => (Array.isArray(props.actions) ? props.actions : []))

  // ---------- Textos que el estado necesita (C5) ----------
  try {
    if (process.env.NODE_ENV !== 'production') {
      const l = props.labels || {}
      for (const k of ['quantity', 'decrement', 'increment', 'remove', 'removed', 'undo', 'summary', 'total']) if (l[k] === undefined || l[k] === '') warn(`C5:${k}`, `falta labels.${k}: se pinta sin ese texto (C5).`)
      if (!l.empty || !has(l.empty.title)) warn('C5:empty', 'falta labels.empty.title («Tu carrito está vacío»): el vacío va sin título (C5).')
      if (typeof l.remove === 'function' && !has(l.removeText)) warn('C5:removeText', 'labels.remove es una función y falta labels.removeText («Quitar», el texto visible): el botón dice el nombre entero (C5).')
      if ((props.lines || []).some((x) => x && x.total) && (l.forQuantity === undefined || !has(l.each) || !has(l.eachLabel))) warn('C5:each', 'hay line.total y faltan labels.forQuantity, each o eachLabel: se pinta el unitario solo (C5).')
      if (variant === '03' && (!has(l.close))) warn('C5:close', 'el cajón y falta labels.close: el cierre va sin nombre (C5).')
    }
  } catch {}

  // ---------- Cantidad: lo que se escribe y el gesto ----------
  const typed = ref({})
  watch(() => (Array.isArray(props.lines) ? props.lines.map((l) => (l ? l.quantity : null)).join(',') : ''), () => { typed.value = {} })
  const quantityOf = (x) => (typed.value[x.key] !== undefined ? typed.value[x.key] : x.line.quantity)
  const setTyped = (x, v) => { typed.value = { ...typed.value, [x.key]: v } }
  // GNumberField entrega el valor, no un evento del DOM: la intención lleva `event: null` (#936), también la de quitar por
  // cantidad 0; nunca un evento fabricado.
  function onChange(x, q) {
    if (q === null || q === undefined || !Number.isFinite(q)) { setTyped(x, x.line.quantity); return }
    if (q === 0) { remove(x, null); return }
    emit('change', { event: null, line: x.line, quantity: q })
  }

  // ---------- La huella ----------
  const inst = getCurrentInstance()
  const hasListener = (name) => {
    const vp = (inst && inst.vnode.props) || {}
    return Boolean(vp[name] || vp[`${name}Once`])
  }
  try {
    if (process.env.NODE_ENV !== 'production' && (!hasListener('onRemove') || !hasListener('onRestore'))) warn('CA3', 'nadie escucha `remove` o `restore`: la huella se pinta sin «Deshacer» (CA3).')
  } catch {}
  const undoable = computed(() => hasListener('onRestore') && has(L.value.undo))
  const pendingRemoval = new Map() // clave → { line, index } pedidos por el bloque
  const traces = ref([]) // [{ key, line, index, id }]
  function remove(x, event) {
    pendingRemoval.set(x.key, { line: x.line, index: x.index })
    emit('remove', { event, line: x.line, index: x.index })
  }
  const traceId = (key) => `${uid}-t-${key.replace(/[^\w-]/g, '_')}`
  const focusId = async (id) => {
    await nextTick()
    const el = id && typeof document !== 'undefined' ? document.getElementById(id) : null
    if (el && typeof el.focus === 'function') el.focus()
  }
  watch(() => lines.value.map((x) => x.key), (now, before) => {
    const live = new Set(now)
    // Una línea que el bloque pidió quitar y la aplicación quitó: deja huella en su sitio, con el foco en «Deshacer»
    for (const key of before || []) {
      if (live.has(key) || !pendingRemoval.has(key)) continue
      const p = pendingRemoval.get(key)
      pendingRemoval.delete(key)
      traces.value = [...traces.value.filter((t) => t.key !== key), { key, line: p.line, index: p.index, id: traceId(key) }]
      focusId(traceId(key))
    }
    // La línea que vuelve (Deshacer o la aplicación): fuera la huella; si el foco estaba en ella, a la cantidad (o a «Quitar»)
    for (const t of traces.value) {
      if (!live.has(t.key)) continue
      const el = typeof document !== 'undefined' ? document.getElementById(t.id) : null
      const had = el && el.contains(document.activeElement)
      traces.value = traces.value.filter((x) => x.key !== t.key)
      const x = lines.value.find((y) => y.key === t.key)
      if (had && x) focusId(x.available.ok ? `${x.id}-q` : `${x.id}-r`)
    }
    for (const key of [...pendingRemoval.keys()]) if (!live.has(key)) pendingRemoval.delete(key)
  })
  /** Foco o puntero salen de la huella: se va cuando ninguno de los dos queda dentro (se mira el estado del propio li). */
  function leave(t, event) {
    const el = event && event.currentTarget
    if (!el) return
    if (event.type === 'focusout') {
      if (el.contains(event.relatedTarget)) return
      let hovered = false
      try { hovered = el.matches(':hover') } catch {}
      if (hovered) return
    } else if (typeof document !== 'undefined' && el.contains(document.activeElement)) return
    traces.value = traces.value.filter((x) => x.key !== t.key)
  }
  const restore = (t, event) => emit('restore', { event, line: t.line, index: t.index })

  /** Las líneas y las huellas en su sitio, en orden. */
  const rows = computed(() => {
    const out = lines.value.map((x) => ({ type: 'line', key: x.key, x }))
    for (const t of [...traces.value].sort((a, b) => a.index - b.index)) out.splice(Math.min(t.index, out.length), 0, { type: 'trace', key: `t:${t.key}`, t })
    return out
  })
  const empty = computed(() => !rows.value.length)

  return {
    uid, locale, L, lines, rows, empty, region, totals, totalsParts, excluded, goal, assuranceId, actions,
    quantityOf, setTyped, onChange, remove, restore, leave, undoable, traces
  }
}
