<script>
// GPriceScope · la moneda se dice una vez (B; dueño: bruno)
// Contrato: design/contracts/price.md «GPriceScope» (DECISIONS.md #772) · Estilo: GPriceScope.css (coco).
// La región declara su moneda (y, si la aplicación lo da, la de la vista) con una leyenda con sello; dentro, un precio de esa
// moneda no lleva código. provide/inject: la región no cuenta ni recorre sus precios (SSR-seguro). Sin rol, sin nombre, sin
// región viva ni enfocables propios.
// Función de render (no plantilla): el tope de la entrada es 6 KiB gzip (#776).
import { computed, defineComponent, h, provide, ref, watch } from 'vue'
import { oneOf } from '../../utils/oneOf.js'
import { currencyCode, currencyName } from '../../utils/currency.js'
import { fill } from '../../utils/template.js'
import { okLocale, onceWarner, priceScopeKey, useLocale } from '../GPrice/priceScope.js'

export default defineComponent({
  name: 'GPriceScope',
  props: {
    currency: { type: String, required: true },
    view: { type: String, default: undefined },
    legend: { type: Boolean, default: true },
    taxes: { type: String, default: undefined },
    locale: { type: String, default: undefined },
    labels: { type: Object, default: () => ({}) },
    as: { type: String, default: 'div', validator: oneOf(['div', 'section', 'aside']) }
  },
  setup(props, { slots }) {
    const root = ref(null)
    const warnOnce = onceWarner('GPriceScope')
    // La moneda de la vista: `view` si Intl la acepta; si no, la de la región
    const shown = computed(() => currencyCode(props.view) || currencyCode(props.currency))
    const fixedLocale = computed(() => (okLocale(props.locale) ? props.locale : undefined))
    // declared: dice su moneda con leyenda y su texto, o con legend: false (la aplicación promete que está dicha en otro sitio)
    provide(priceScopeKey, {
      view: shown,
      declared: computed(() => Boolean(shown.value && (!props.legend || props.labels.legend))),
      locale: fixedLocale,
      labels: computed(() => props.labels)
    })

    // Idioma del nombre de la leyenda: la prop › el lang del ancestro (al montar) › navigator.language. Antes de montar sin
    // locale (SSR), el código en lugar del nombre (sin desajuste de hidratación)
    const { locale } = useLocale(() => [props.locale], root)
    const legendText = computed(() => {
      const c = shown.value
      return props.legend && c && props.labels.legend ? fill(props.labels.legend, { name: locale.value === null ? c : currencyName(c, locale.value), code: c }) : ''
    })

    watch(() => [props.currency, props.view, props.locale, props.legend && !props.labels.legend], () => {
      try {
        if (process.env.NODE_ENV !== 'production') {
          if (!currencyCode(props.currency)) warnOnce(`c${props.currency}`, `currency «${props.currency}» ausente o que Intl rechaza.`)
          if (props.view && !currencyCode(props.view)) warnOnce(`v${props.view}`, `view «${props.view}» que Intl rechaza: se usa currency.`)
          if (props.locale && !fixedLocale.value) warnOnce(`l${props.locale}`, `locale «${props.locale}» que Intl rechaza: se ignora.`)
          if (props.legend && !props.labels.legend) warnOnce('legend', 'legend sin labels.legend: no hay leyenda y los precios conservan su código.')
        }
      } catch {}
    }, { immediate: true })
    return () => h(props.as, { ref: root, class: 'g-price-scope', 'data-currency': shown.value || undefined }, [
      legendText.value && h('p', { class: 'g-price-scope__legend' }, [
        h('span', { class: 'g-price-scope__seal', 'aria-hidden': 'true' }, shown.value),
        h('span', { class: 'g-price-scope__legend-text' }, legendText.value),
        props.taxes && h('span', { class: 'g-price-scope__taxes' }, props.taxes)
      ]),
      slots.default?.()
    ])
  }
})
</script>
