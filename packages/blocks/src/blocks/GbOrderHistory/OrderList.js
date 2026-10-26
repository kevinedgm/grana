// La lista de pedidos de 02 y 03 (dueño: bruno; order-history.md «Variantes»): GLoadRegion (labels.region; la primera
// carga pinta el molde de la lista con una muestra hecha de los propios textos de la sección, sin datos inventados) ›
// GStack as="ul" › OrderCard por pedido (con `itemAttrs`: la vuelta del foco y lo nuevo), o el vacío (GEmpty, o el slot
// `empty`), o el fallo sin nada conocido (GEmpty cause="error" con «Reintentar» → retry) + GPagination (con total y
// pageSize). Interna de la sección; sin CSS.
import { computed, defineComponent, h } from 'vue'
import { GBtn, GEmpty, GPagination, GStack } from '@grana/vue'
import { GLoadRegion } from '@grana/vue/load-region'
import { has } from '../common/text.js'
import { OrderCard } from './OrderPieces.js'

export default /* @__PURE__ */ defineComponent({
  name: 'GbOrderList',
  props: {
    h: { type: Object, required: true },
    p: { type: Object, required: true },
    compact: { type: Boolean, default: false },
    headingLevel: { type: Number, required: true },
    priceLocale: { type: String, default: undefined },
    slots: { type: Object, default: () => ({}) },
    warn: { type: Function, required: true }
  },
  emits: ['open', 'navigate', 'update:page', 'retry'],
  setup(props, { emit }) {
    const L = computed(() => props.p.labels || {})
    // La muestra del molde (load-region.md «sample»): una página de pedidos con los rótulos de la sección
    const sample = computed(() => Array.from({ length: Math.min(props.p.pageSize || 3, 5) }, (_, i) => ({
      key: `s${i}`, code: L.value.reference || '', color: 'neutral', date: null, href: null, count: '', progress: null, tracking: null,
      order: { statusText: L.value.status || '', total: null }
    })))
    const items = computed(() => (props.p.loading && !props.h.orders.value.length ? null : props.h.orders.value))
    const retry = () => emit('retry', { event: null })
    return () => {
      const p = props.p
      const region = h(GLoadRegion, { loading: p.loading, items: items.value, sample: sample.value, keyBy: 'key', error: p.error, label: p.title, labels: L.value.region, onRetry: retry }, {
        default: ({ items: list, itemAttrs }) => {
          if (list && list.length) {
            return h(GStack, { as: 'ul', gap: props.compact ? 'sm' : 'md' }, () => list.map((r) => h(OrderCard, {
              key: r.key, ...itemAttrs(r), r, labels: L.value, compact: props.compact, headingLevel: props.headingLevel, priceLocale: props.priceLocale, orderSlot: props.slots.order, warn: props.warn,
              onOpen: (x) => emit('open', x), onNavigate: (x) => emit('navigate', x)
            })))
          }
          if (p.error) {
            const R = L.value.region || {}
            return h(GEmpty, { cause: 'error', title: typeof p.error === 'string' && has(p.error) ? p.error : R.failed, headingLevel: props.headingLevel }, {
              actions: has(R.retry) ? () => h(GBtn, { variant: 'outline', onClick: retry }, () => R.retry) : undefined
            })
          }
          if (props.slots.empty) return props.slots.empty()
          const E = L.value.empty || {}
          return h(GEmpty, { cause: 'none', title: E.title, description: E.description, headingLevel: props.headingLevel })
        }
      })
      const paged = Number.isFinite(p.total) && Number.isFinite(p.pageSize) && p.total > p.pageSize
      return [region, paged ? h(GPagination, { page: p.page || 1, total: p.total, pageSize: p.pageSize, labels: L.value.pagination, 'onUpdate:page': (n) => emit('update:page', n) }) : null]
    }
  }
})
