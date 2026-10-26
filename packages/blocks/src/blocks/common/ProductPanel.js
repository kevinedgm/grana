// El panel de la ficha de un producto (dueño: bruno; design/contracts/blocks/product-overview.md «Piezas», quick-view.md
// «El panel»). Interno del paquete: lo comparten Product overview (E4) y Quick view (E5) para que los mismos datos se elijan
// igual en la página y en la superficie (§38: Quick view no importa una variante de E4). No se exporta.
//   `useProductPanel(props, emit, warn)`: la elección (v-model:selection, con o sin v-model), la variante resuelta
//   (`resolveVariant`, EC4), lo que no se puede pedir (K4, la variante o el producto), el precio de la variante (K3), la
//   cantidad (v-model:quantity, PO3), la foto que sigue a la elección (`index` para GGallery, sin mover el foco) y «Añadir»
//   (nunca a ciegas: con una opción obligatoria sin elegir no emite, pone el error y enfoca su primer radio, §27 regla 3).
//   `ProductPanel`: GStack gap="md" › maker + calificación (y el enlace a las opiniones) › precio (GPrice lg en un
//   GPriceScope) › una pregunta por opción (GRadioGroup chip) › cantidad (GNumberField) › «Añadir» (GBtn solid block) o el
//   motivo › note › slot `panel` › `after` (la ficha completa de Quick view).
// Avisos C5, K3, K4, EC2, EC4, PO2 y PO3 con el `warn` de quien lo pinta.
import { computed, defineComponent, h, ref, useId, watch } from 'vue'
import { GBtn, GNumberField, GRadioGroup, GStack, GText } from '@grana/vue'
import { GPrice, GPriceScope } from '@grana/vue/price'
import GbLink from './link.js'
import { fill, useLocale } from './locale.js'
import { availability, priceSpec, regionAttrs } from './price.js'
import { chosenOptions, missingOption, ratingText, resolveVariant } from './ecommerce.js'
import { has } from './text.js'

/** Un valor del modelo (como lo da la aplicación o el radio). */
const set = (v) => v !== undefined && v !== null && v !== ''
/** `available` de un dato (OptionValue, Variant): false o un motivo no vacío = no se puede pedir. */
const off = (x) => Boolean(x) && (x.available === false || (typeof x.available === 'string' && has(x.available)))

export function useProductPanel(props, emit, warn) {
  const locale = useLocale(props)
  const uid = useId()
  const L = computed(() => props.labels || {})
  const p = computed(() => (props.product && typeof props.product === 'object' ? props.product : {}))

  /** C5 de un texto obligatorio. */
  const need = (key, what) => {
    if (has(L.value[key]) || typeof L.value[key] === 'function') return L.value[key]
    try { if (process.env.NODE_ENV !== 'production') warn(`C5:${key}`, `falta labels.${key} (${what}): se pinta sin ese texto (C5).`) } catch {}
    return ''
  }

  // Las preguntas: opciones con `key` y valores
  const options = computed(() => (Array.isArray(p.value.options) ? p.value.options : []).filter((o) => o && has(o.key) && Array.isArray(o.values)).map((o) => ({ ...o, values: o.values.filter((v) => v && set(v.value) && has(v.label)) })))

  // La elección: copia propia (sin v-model funciona igual) que la prop sustituye cuando cambia
  const local = ref({ ...(props.selection || {}) })
  watch(() => props.selection, (v) => { local.value = { ...(v || {}) } })
  /**
   * La elección efectiva: la de la aplicación sin los valores que no están en su opción (PO2) y, en una opción de un solo
   * valor, ese valor (se elige solo). Nada más se preelige: la talla es de quien compra.
   */
  const selection = computed(() => {
    const out = {}
    for (const o of options.value) {
      const v = local.value[o.key]
      if (set(v)) {
        if (o.values.some((x) => x.value === v)) out[o.key] = v
        else {
          try { if (process.env.NODE_ENV !== 'production') warn(`PO2:${o.key}`, `selection.${o.key} = «${String(v)}» no está en los valores de «${o.label}»: se ignora (PO2).`) } catch {}
        }
      } else if (o.values.length === 1) out[o.key] = o.values[0].value
    }
    return out
  })
  const resolved = computed(() => resolveVariant(p.value, selection.value, warn))
  const variant = computed(() => resolved.value.variant)
  const missing = computed(() => missingOption({ options: options.value }, selection.value))

  // Lo que no se puede pedir (§27 regla 1): el producto; con todo elegido, la variante (o la combinación sin variante)
  const available = computed(() => {
    const a = availability(p.value, L.value, 'product', warn)
    if (!a.ok || missing.value) return a
    if (variant.value) return availability(variant.value, L.value, 'variant', warn)
    if (resolved.value.variants.length && options.value.length) return availability({ available: false }, L.value, 'la combinación elegida', warn)
    return a
  })

  // Las preguntas con sus valores: un valor que ninguna variante disponible tiene con lo elegido en las demás opciones queda
  // `disabled` y su nombre lo dice (labels.unavailableValue); el elegido no se deshabilita (GRadioGroup no lo admite): su
  // combinación sin existencias la dice el motivo bajo el botón.
  const questions = computed(() => {
    const sel = selection.value
    const variants = resolved.value.variants
    let anyOff = false
    const list = options.value.map((o) => {
      const values = o.values.map((v) => {
        let out = off(v)
        if (!out && variants.length) {
          const others = Object.entries(sel).filter(([k]) => k !== o.key)
          out = !variants.some((x) => x.options[o.key] === v.value && others.every(([k, val]) => x.options[k] === val) && !off(x))
        }
        if (out) anyOff = true
        return { value: v.value, label: out ? outName(v.label) : v.label, disabled: out && sel[o.key] !== v.value }
      })
      return { key: o.key, label: o.label, id: `${uid}-opt-${String(o.key).replace(/[^\w-]/g, '_')}`, values }
    })
    try { if (process.env.NODE_ENV !== 'production' && anyOff && !has(L.value.unavailableValue) && typeof L.value.unavailableValue !== 'function') warn('C5:unavailableValue', 'hay valores sin existencias y falta labels.unavailableValue («{value}, agotada»): se deshabilitan sin decirlo en su nombre (C5).') } catch {}
    return list
  })
  /** «G, agotada» (String con {value} o función); sin el texto, el nombre tal cual. */
  function outName(label) {
    const t = L.value.unavailableValue
    return typeof t === 'function' ? String(t(label)) : has(t) ? fill(t, { value: label }) : label
  }

  // El error de una pregunta sin responder («Elige Talla»), hasta que se responde
  const errorKey = ref(null)
  const chooseText = (label) => {
    const t = need('choose', '«Elige {option}»')
    return typeof t === 'function' ? String(t(label)) : fill(t, { option: label })
  }

  // La foto que sigue a la elección: la de la variante resuelta o la del valor elegido (GGallery v-model:index, sin foco)
  const index = ref(0)
  const photoOf = (key, value) => {
    const v = variant.value
    if (v && Number.isInteger(v.photo)) return v.photo
    const o = options.value.find((x) => x.key === key)
    const val = o && o.values.find((x) => x.value === value)
    return val && Number.isInteger(val.photo) ? val.photo : null
  }

  // Elegir: la elección nueva (objeto nuevo) y, con el `change` del radio que sube a la raíz de GRadioGroup, `select`
  let pending = null
  function choose(key, value) {
    local.value = { ...local.value, [key]: value }
    if (errorKey.value === key) errorKey.value = null
    emit('update:selection', { ...selection.value })
    const i = photoOf(key, value)
    if (i !== null) index.value = i
    pending = { key, value }
  }
  function chosen(event) {
    if (!pending) return
    const { key, value } = pending
    pending = null
    emit('select', { event, product: props.product, key, value, variant: variant.value })
  }

  // La cantidad: copia propia, entero ≥ 1 hasta el `max` de la variante (PO3: fuera de rango lo ajusta GNumberField)
  const qLocal = ref(Number.isFinite(props.quantity) ? props.quantity : 1)
  watch(() => props.quantity, (v) => { if (Number.isFinite(v)) qLocal.value = v })
  const max = computed(() => (variant.value && Number.isFinite(variant.value.max) ? variant.value.max : undefined))
  try {
    if (process.env.NODE_ENV !== 'production') {
      watch([() => props.quantity, max], ([q, m]) => {
        if (Number.isFinite(q) && (q < 1 || (m !== undefined && q > m))) warn('PO3', `quantity = ${q} fuera de 1..${m === undefined ? '∞' : m}: lo ajusta GNumberField (PO3).`)
      }, { immediate: true })
    }
  } catch {}
  function setQuantity(v) {
    if (!Number.isFinite(v)) return
    qLocal.value = v
    emit('update:quantity', v)
  }

  const price = computed(() => priceSpec(variant.value && variant.value.price ? variant.value.price : p.value.price, 'product.price', warn))
  const region = computed(() => (props.prices && typeof props.prices === 'object' && has(props.prices.currency) ? regionAttrs(props.prices, L.value, locale.value) : null))
  const rating = computed(() => ratingText(p.value.rating, L.value, locale.value, 'product', warn))
  const reviews = computed(() => {
    const r = p.value.reviews
    if (!r || typeof r !== 'object' || !has(r.href)) return null
    const label = has(r.label) ? r.label : need('reviews', '«Leer las opiniones»')
    return label ? { label, href: r.href, item: r } : null
  })

  // «Añadir»: con una opción obligatoria sin elegir, no emite; el error en esa pregunta y el foco en su primer radio
  function add(event) {
    if (props.busy) return
    const m = missing.value
    if (m) {
      errorKey.value = m.key
      const q = questions.value.find((x) => x.key === m.key)
      const i = q ? q.values.findIndex((v) => !v.disabled) : -1
      const el = i >= 0 && typeof document !== 'undefined' ? document.getElementById(`${q.id}-${i}`) : null
      if (el) el.focus()
      return
    }
    if (!available.value.ok) return
    const sel = { ...selection.value }
    emit('add', { event, product: props.product, variant: variant.value, selection: sel, options: chosenOptions(p.value, sel), quantity: qLocal.value })
  }

  return { locale, L, p, need, questions, selection, variant, available, errorKey, chooseText, choose, chosen, index, quantity: qLocal, max, setQuantity, price, region, rating, reviews, add }
}

export default /* @__PURE__ */ defineComponent({
  name: 'GbProductPanel',
  props: {
    // Lo que da useProductPanel
    d: { type: Object, required: true },
    busy: { type: Boolean, default: false },
    // Quick view 03: el maker y el precio van en la tarjeta de la portada, no en el panel
    bare: { type: Boolean, default: false },
    // Slot `panel` de la sección ({ product, variant }) y lo que va al final (la ficha completa de Quick view)
    panelSlot: { type: Function, default: undefined },
    after: { type: Function, default: undefined },
    warn: { type: Function, required: true }
  },
  emits: ['navigate'],
  setup(props, { emit }) {
    return () => {
      const d = props.d
      const L = d.L.value
      const product = d.p.value
      const out = []
      if (!props.bare && has(product.maker)) out.push(h(GText, { size: 'body-sm', tone: 'muted' }, () => product.maker))
      const rating = d.rating.value
      const reviews = d.reviews.value
      if (rating || reviews) {
        out.push(h(GText, { size: 'body-sm', tone: 'muted' }, () => [
          rating || null,
          rating && reviews ? ' ' : null,
          reviews ? h(GbLink, { link: { label: reviews.label, href: reviews.href }, item: reviews.item, external: L.external, what: 'product.reviews', warn: props.warn, onNavigate: (x) => emit('navigate', x) }) : null
        ]))
      }
      if (!props.bare && d.price.value) {
        const price = h(GPrice, { ...d.price.value, size: 'lg', locale: d.locale.value })
        out.push(d.region.value ? h(GPriceScope, { ...d.region.value, as: 'div' }, () => price) : price)
      }
      for (const q of d.questions.value) {
        out.push(h(GRadioGroup, {
          key: q.key,
          id: q.id,
          label: q.label,
          appearance: 'chip',
          options: q.values,
          modelValue: d.selection.value[q.key] ?? null,
          error: d.errorKey.value === q.key ? d.chooseText(q.label) : undefined,
          'onUpdate:modelValue': (v) => d.choose(q.key, v),
          onChange: (e) => d.chosen(e)
        }))
      }
      const av = d.available.value
      if (av.ok) {
        out.push(h(GNumberField, {
          label: d.need('quantity', 'rótulo de la cantidad'),
          modelValue: d.quantity.value,
          min: 1,
          max: d.max.value,
          step: 1,
          precision: 0,
          steppers: true,
          decrementLabel: d.need('decrement', '«Quitar una»'),
          incrementLabel: d.need('increment', '«Añadir una»'),
          locale: d.locale.value,
          'onUpdate:modelValue': (v) => d.setQuantity(v)
        }))
        try { if (process.env.NODE_ENV !== 'production' && props.busy && !has(L.busy)) props.warn('C5:busy', 'busy sin labels.busy («Añadiendo…»): el botón se carga sin texto de estado (C5).') } catch {}
        out.push(h(GBtn, {
          variant: 'solid',
          block: true,
          loading: props.busy,
          loadingText: props.busy && has(L.busy) ? L.busy : undefined,
          onClick: (e) => d.add(e)
        }, () => d.need('add', '«Añadir al carrito»')))
      } else if (av.reason) out.push(h(GText, { size: 'body-sm' }, () => av.reason))
      if (has(product.note)) out.push(h(GText, { size: 'body-sm' }, () => product.note))
      if (props.panelSlot) out.push(props.panelSlot({ product: props.d.p.value, variant: d.variant.value }))
      if (props.after) out.push(props.after())
      return h(GStack, { gap: 'md' }, () => out)
    }
  }
})
