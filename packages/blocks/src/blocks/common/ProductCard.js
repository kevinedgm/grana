// Un producto como GCard (dueño: bruno; design/contracts/blocks/product-card.md «Anatomía»). Interno del paquete: lo usan
// las tres variantes de GbProductCard y lo reutilizan Product grid (E2) y Cart (parte B y C) para que la tarjeta se lea
// igual en todas partes (§27 regla 3). No se exporta.
//   GCard (as) · interaction link (href) / button (sin href: «ver», → open) / none (C6)
//   media: portada (photos[0]) o el slot `media` · eyebrow maker · title name (lang en el título; marca externa) ·
//   subtitle optionsSummary · description summary (horizontal) · badge (neutral) · meta facts (top 2, horizontal 4)
//   default: GPrice (PriceSpec tal cual; compact "sm") + GText body-sm muted con la calificación en palabras + GText body-sm
//            con el motivo si no está disponible + slot `product`
//   actions (compact): UNA acción rápida outline: «Elegir opciones» (→ open) con opciones obligatorias, «Añadir» (→ add)
//            sin ellas; nunca añade a ciegas (EC3); con `busy`, loading + loadingText.
// `form`: 'top' (01), 'horizontal' (02), 'compact' (03). Avisos C2, C4 a C6, K3, K4, EC2, EC3, EC5 y PC1 con el `warn` y
// el `what` de quien la pinta.
import { computed, defineComponent, h } from 'vue'
import { GBtn, GCard, GIcon, GText } from '@grana/vue'
import { GPrice } from '@grana/vue/price'
import { imgAttrs, checkMedia } from './media.js'
import { isUnsafeHref, safeHref } from './navigate.js'
import { availability, priceSpec } from './price.js'
import { productKey, ratingText, requiredOptions } from './ecommerce.js'
import { has } from './text.js'

const FORMS = {
  top: { card: { mediaPosition: 'top' }, facts: 2, summary: false, subtitle: true, media: true, quick: false, size: 'md' },
  horizontal: { card: { orientation: 'auto', mediaPosition: 'start' }, facts: 4, summary: true, subtitle: true, media: true, quick: false, size: 'md' },
  compact: { card: { density: 'compact', mediaPosition: 'top' }, facts: 0, summary: false, subtitle: false, media: true, quick: true, size: 'sm' }
}

/** ¿Se puede pintar? (C2: sin `name` o sin `price`, no.) Sin avisar: el aviso lo da `productRow`. */
export const isProduct = (p) => Boolean(p) && typeof p === 'object' && has(p.name) && Boolean(p.price) && typeof p.price === 'object'

/** El producto listo para pintar (o null con C2: sin `name` o sin `price`). */
export function productRow(product, { form = 'top', labels = {}, locale, busy = false, what = 'product', index = 0, warn, coverWarn = true }) {
  const p = product
  const F = FORMS[form] || FORMS.top
  if (!isProduct(p)) {
    try { if (process.env.NODE_ENV !== 'production') warn(`C2:${what}`, `${what} sin ${p && has(p.name) ? 'price' : 'name'}: no se pinta (C2).`) } catch {}
    return null
  }
  const L = labels || {}
  const key = productKey(p, index, what, warn)
  const av = availability(p, L, what, warn)
  const pics = Array.isArray(p.photos) ? p.photos.filter((x) => x && has(x.src)) : []
  const cover = F.media && pics.length ? pics[0] : null
  if (cover) checkMedia(cover, `${what}.photos[0]`, warn)
  try { if (process.env.NODE_ENV !== 'production' && coverWarn && form !== 'compact' && !pics.length) warn(`PC1:${what}`, `${what} sin photos: se pinta sin media (PC1).`) } catch {}
  // La acción principal es la tarjeta: enlace a la ficha con href; sin href, botón «ver» (open); href javascript: sin interacción
  let card = { interaction: 'button' }
  let external = false
  if (p.href !== undefined && p.href !== null && p.href !== '') {
    const href = safeHref(p.href)
    if (!href) {
      try { if (process.env.NODE_ENV !== 'production' && isUnsafeHref(p.href)) warn(`C6:${what}`, `${what} tiene un href javascript:; la tarjeta queda sin interacción (C6).`) } catch {}
      card = { interaction: 'none' }
    } else if (p.external) {
      external = true
      card = { interaction: 'link', href, target: '_blank', rel: 'noopener' }
      try { if (process.env.NODE_ENV !== 'production' && !has(L.external)) warn('C5:external', 'hay un producto externo y falta labels.external («se abre en otra pestaña»): la marca queda decorativa (C5).') } catch {}
    } else card = { interaction: 'link', href }
  }
  // La acción rápida (solo la compacta): nunca a ciegas (§27 regla 3)
  let quick = null
  if (F.quick && av.ok) {
    if (requiredOptions(p).length) {
      if (has(L.choose)) quick = { kind: 'choose', label: L.choose }
      else {
        try { if (process.env.NODE_ENV !== 'production') warn(`EC3:${what}`, `${what} tiene opciones obligatorias y falta labels.choose («Elegir opciones»): la acción rápida no se pinta, nunca se añade a ciegas (EC3).`) } catch {}
      }
    } else if (has(L.add)) quick = { kind: 'add', label: L.add }
    else {
      try { if (process.env.NODE_ENV !== 'production') warn('C5:add', 'hay un producto sin opciones obligatorias y falta labels.add («Añadir al carrito»): sin acción rápida (C5).') } catch {}
    }
    if (quick && busy && !has(L.busy)) {
      try { if (process.env.NODE_ENV !== 'production') warn('C5:busy', 'busy sin labels.busy («Añadiendo…»): el botón se carga sin texto de estado (C5).') } catch {}
    }
  }
  const facts = F.facts ? (Array.isArray(p.facts) ? p.facts : []).filter((f) => f && has(f.label) && has(f.value)).slice(0, F.facts).map((f) => ({ label: f.label, value: f.value })) : []
  return {
    key,
    product: p,
    form: F,
    available: av,
    card,
    external,
    cover,
    price: priceSpec(p.price, `${what}.price`, warn),
    rating: ratingText(p.rating, L, locale, what, warn),
    quick,
    facts
  }
}

export default /* @__PURE__ */ defineComponent({
  name: 'GbProductCard',
  props: {
    product: { type: Object, required: true },
    form: { type: String, default: 'top' },
    as: { type: String, default: 'article' },
    headingLevel: { type: Number, required: true },
    labels: { type: Object, default: () => ({}) },
    locale: { type: String, default: undefined },
    busy: { type: Boolean, default: false },
    index: { type: Number, default: 0 },
    what: { type: String, default: 'product' },
    // Slots de escape de la sección (`product`, `media`), como funciones de alcance { product }
    productSlot: { type: Function, default: undefined },
    mediaSlot: { type: Function, default: undefined },
    warn: { type: Function, required: true }
  },
  emits: ['navigate', 'open', 'add'],
  setup(props, { emit }) {
    const row = computed(() => productRow(props.product, { form: props.form, labels: props.labels, locale: props.locale, busy: props.busy, what: props.what, index: props.index, warn: props.warn, coverWarn: !props.mediaSlot }))
    return () => {
      const r = row.value
      if (!r) return null
      const p = r.product
      const L = props.labels || {}
      const slots = {}
      if (props.mediaSlot) slots.media = () => props.mediaSlot({ product: p })
      else if (r.cover) slots.media = () => h('img', imgAttrs(r.cover))
      // Idioma del producto en el título y la descripción, no en la raíz (#891: marcaría también los labels)
      const name = has(p.lang) ? h('span', { lang: p.lang }, p.name) : p.name
      if (r.external || has(p.lang)) slots.title = () => (r.external ? [name, ' ', h(GIcon, { name: 'external-link', label: has(L.external) ? L.external : undefined })] : [name])
      if (r.form.summary && has(p.summary) && has(p.lang)) slots.description = () => h('span', { lang: p.lang }, p.summary)
      const body = []
      if (r.price) body.push(h(GPrice, { ...r.price, size: r.form.size, locale: props.locale }))
      if (r.rating) body.push(h(GText, { size: 'body-sm', tone: 'muted' }, () => r.rating))
      if (!r.available.ok && r.available.reason) body.push(h(GText, { size: 'body-sm' }, () => r.available.reason))
      if (props.productSlot) body.push(props.productSlot({ product: p }))
      if (body.length) slots.default = () => body
      if (r.quick) {
        const q = r.quick
        slots.actions = () => h(GBtn, {
          variant: 'outline',
          size: 'sm',
          loading: q.kind === 'add' && props.busy,
          loadingText: q.kind === 'add' && props.busy && has(L.busy) ? L.busy : undefined,
          onClick: (event) => (q.kind === 'choose'
            ? emit('open', { event, product: p })
            : emit('add', { event, product: p, variant: null, selection: {}, options: [], quantity: 1 }))
        }, () => q.label)
      }
      return h(GCard, {
        ...r.form.card,
        ...r.card,
        as: props.as,
        eyebrow: p.maker || undefined,
        title: p.name,
        subtitle: r.form.subtitle && has(p.optionsSummary) ? p.optionsSummary : undefined,
        description: r.form.summary && has(p.summary) ? p.summary : undefined,
        badge: has(p.badge) ? p.badge : undefined,
        badgeColor: 'neutral',
        meta: r.facts,
        headingLevel: props.headingLevel,
        onNavigate: (x) => emit('navigate', { ...x, item: p }),
        onActivate: ({ event }) => emit('open', { event, product: p })
      }, slots)
    }
  }
})
