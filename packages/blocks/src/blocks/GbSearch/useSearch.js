// GbSearch · lo que comparten las tres variantes (dueño: bruno; search.md «Props», «Eventos», avisos K1 y S1).
// - `query` ↔ `modelValue`: se quita `kind` al pasarla a GBookingBar (su modelo no lo lleva) y se añade al emitir
//   `update:query`; una consulta de otro `kind` o con forma inválida es `null` (K1). Sin `query`, la barra guarda el estado.
// - Atributos: los del envío nativo (`action`, `method`, `target`, `enctype`, `accept-charset`, `autocomplete`) van al
//   <form> de GBookingBar; `class`, `style`, `id`, `aria-*`, `data-*` y el resto, a la raíz del bloque.
// - `submit`: la carga de GBookingBar tal cual (misma referencia, con su preventDefault síncrono).
import { computed, onMounted, useAttrs } from 'vue'
import { checkQuery } from '../common/booking.js'

const FORM_ATTRS = ['action', 'method', 'target', 'enctype', 'accept-charset', 'acceptCharset', 'autocomplete']
const BAR_PROPS = ['kind', 'title', 'partyRows', 'min', 'max', 'disabledDates', 'disabledNights', 'minNights', 'maxNights', 'times', 'tours', 'names', 'pending', 'disabled', 'locale']

/** `{ bar, root, onModel, onSubmit }`: props y escuchas de GBookingBar y atributos de la raíz. `quick`: si pasa `quickDays`. */
export function useSearch(props, emit, warn, { appearance = 'phrase', dock = false, quick = true, variant } = {}) {
  const attrs = useAttrs()
  const model = computed(() => {
    const q = checkQuery(props.query, warn, props.kind)
    if (!q) return null
    const { kind: _k, ...rest } = q
    return rest
  })
  const bar = computed(() => {
    const out = { appearance, labels: props.labels && props.labels.bar ? props.labels.bar : undefined, modelValue: model.value }
    for (const k of BAR_PROPS) if (props[k] !== undefined) out[k] = props[k]
    if (quick && props.quickDays !== undefined) out.quickDays = props.quickDays
    if (dock) out.dock = true
    for (const k of FORM_ATTRS) if (attrs[k] !== undefined) out[k] = attrs[k]
    return out
  })
  const root = computed(() => {
    const out = {}
    for (const [k, v] of Object.entries(attrs)) if (!FORM_ATTRS.includes(k)) out[k] = v
    return out
  })
  const onModel = (v) => emit('update:query', { kind: props.kind, ...v })
  const onSubmit = (payload) => emit('submit', payload)
  if (variant === '03') {
    onMounted(() => {
      try { if (process.env.NODE_ENV !== 'production' && document.querySelectorAll('[data-gb="search-03"]').length > 1) warn('S1', 'hay más de un GbSearch03 en el documento: dos muelles de consulta (S1).') } catch {}
    })
  }
  return { bar, root, onModel, onSubmit }
}
