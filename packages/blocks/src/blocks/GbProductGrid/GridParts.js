// GbProductGrid · las piezas que comparten las tres variantes (dueño: bruno; product-grid.md «Piezas»):
//   GridHeader: la cuenta (GText body-sm muted) y, con `sorts`, el orden (GSelect con labels.sort; v-model → update:sort),
//     en un GStack horizontal que se parte.
//   GridResults: UNA GPriceScope (`prices`, EC1) › GLoadRegion (loading, error, items, sample, keyBy 'id', refresh keep,
//     label = title, labels.region; retry) › la lista de la variante con la tarjeta de E1 (common/ProductCard.js, misma
//     anatomía) o el vacío: el slot `empty` { filtered } o GEmpty (none / filtered con su salida: relax quita ese valor,
//     clear todos) › y, con `total` y `pageSize`, GPagination (update:page; sin mover el foco).
//   `form`: 'top' (01: rejilla de tarjetas con foto), 'compact' (02: tarjetas compactas con acción rápida), 'horizontal'
//   (03: renglones, GStack as="ul" › li).
import { defineComponent, h } from 'vue'
import { GAdaptiveLayout, GEmpty, GPagination, GSelect, GStack, GText } from '@grana/vue'
import { GLoadRegion } from '@grana/vue/load-region'
import GbPriceRegion from '../common/priceRegion.js'
import ProductCard from '../common/ProductCard.js'

export const GridHeader = /* @__PURE__ */ defineComponent({
  name: 'GbGridHeader',
  props: { g: { type: Object, required: true } },
  setup(props) {
    return () => {
      const g = props.g
      return h(GStack, { orientation: 'horizontal', gap: 'md', vertical: 'center' }, () => [
        g.countLabel.value ? h(GText, { size: 'body-sm', tone: 'muted' }, () => g.countLabel.value) : null,
        g.sorts.value.length ? h(GSelect, { label: g.sortLabel.value, options: g.sorts.value, modelValue: g.sortValue.value, 'onUpdate:modelValue': (v) => g.setSort(v) }) : null
      ])
    }
  }
})

export const GridResults = /* @__PURE__ */ defineComponent({
  name: 'GbGridResults',
  props: {
    g: { type: Object, required: true },
    form: { type: String, default: 'top' },
    title: { type: String, required: true },
    loading: { type: Boolean, default: false },
    error: { type: [Boolean, String], default: false },
    total: { type: Number, default: undefined },
    pageSize: { type: Number, default: undefined },
    headingLevel: { type: Number, required: true },
    productSlot: { type: Function, default: undefined },
    emptySlot: { type: Function, default: undefined },
    warn: { type: Function, required: true }
  },
  emits: ['navigate', 'open', 'add'],
  setup(props, { emit }) {
    const card = (product, attrs, i) => h(ProductCard, {
      product,
      form: props.form,
      as: props.form === 'horizontal' ? 'div' : 'article',
      headingLevel: props.headingLevel,
      labels: props.g.L.value.card,
      locale: props.g.locale.value,
      busy: props.g.busyOf(product),
      index: i,
      what: `products[${i}]`,
      productSlot: props.productSlot,
      warn: props.warn,
      onNavigate: (x) => emit('navigate', x),
      onOpen: (x) => emit('open', x),
      onAdd: (x) => emit('add', x)
    })
    const list = (items, itemAttrs) => {
      if (props.form === 'horizontal') {
        return h(GStack, { as: 'ul', gap: 'md' }, () => items.map((p, i) => h('li', { key: props.g.keyOf(p) ?? i, ...itemAttrs(p) }, [card(p, null, i)])))
      }
      return h(GAdaptiveLayout, { role: 'list' }, () => items.map((p, i) => h('div', { key: props.g.keyOf(p) ?? i, role: 'listitem', class: 'g-adapt-standard', ...itemAttrs(p) }, [card(p, null, i)])))
    }
    const empty = () => {
      const g = props.g
      const filtered = g.anyFilter.value
      if (props.emptySlot) return props.emptySlot({ filtered })
      const e = g.emptyLabels.value
      return h(GEmpty, {
        cause: filtered ? 'filtered' : 'none',
        title: e.title || '',
        description: e.description,
        headingLevel: props.headingLevel,
        filters: filtered ? g.emptyFilters.value : undefined,
        total: filtered && Number.isFinite(props.total) ? props.total : undefined,
        locale: g.locale.value,
        labels: g.L.value.emptyLabels,
        onRelax: (key) => g.relax(key),
        onClear: () => g.clear()
      })
    }
    return () => {
      const g = props.g
      const region = h(GLoadRegion, {
        loading: props.loading,
        error: props.error,
        items: g.items.value,
        sample: g.sample.value,
        keyBy: 'id',
        refresh: 'keep',
        label: props.title,
        labels: g.L.value.region,
        onRetry: () => g.retry()
      }, {
        default: ({ items, mold, itemAttrs }) => (items && items.length ? list(items, itemAttrs) : mold ? null : empty())
      })
      const out = [h(GbPriceRegion, { region: g.region.value, labels: g.L.value.card, locale: g.locale.value, as: 'div' }, () => region)]
      if (g.paged.value) out.push(h(GPagination, { page: g.page.value, total: props.total, pageSize: props.pageSize, labels: g.L.value.pagination, 'onUpdate:page': (v) => g.setPage(v) }))
      return out
    }
  }
})
