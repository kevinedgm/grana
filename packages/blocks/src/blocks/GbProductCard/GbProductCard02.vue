<script setup>
// GbProductCard02 · Horizontal (dueño: bruno). Contrato: design/contracts/blocks/product-card.md · Común: _comun.md §27 · Sin CSS.
// Foto al lado y todo el detalle a la vista (GCard orientation="auto" mediaPosition="start", `summary` como descripción y hasta 4 `facts`). Ignora `busy` y `labels.add`/`choose`/`busy`.
// Raíz: la GPriceScope de `prices` (as="div") con la tarjeta dentro o, sin región, la GCard (article) misma. El título va
// al nivel del sitio donde está la tarjeta (useSectionLevel; h2 suelta, h3 dentro de una GSection de la aplicación).
import { computed } from 'vue'
import { useSectionLevel } from '@grana/vue'
import { GPriceScope } from '@grana/vue/price'
import ProductCard, { isProduct } from '../common/ProductCard.js'
import { useLocale } from '../common/locale.js'
import { regionAttrs } from '../common/price.js'
import { has } from '../common/text.js'
import { useWarn } from '../common/warn.js'
import { emits as sectionEmits, props as sectionProps } from './props.js'

defineOptions({ name: 'GbProductCard02' })
const props = defineProps(sectionProps)
const emit = defineEmits(sectionEmits)
const warn = useWarn('GbProductCard02')
const { level } = useSectionLevel()
const heading = computed(() => Math.min(level.value, 6))
const locale = useLocale(props)
// Suelta, una tarjeta no avisa EC1 (es un solo precio): sin región, el GPrice con su código. Un producto que no se pinta
// (C2) no deja la región vacía: no pinta nada
const region = computed(() => (isProduct(props.product) && props.prices && typeof props.prices === 'object' && has(props.prices.currency) ? regionAttrs(props.prices, props.labels, locale.value) : null))
</script>

<template>
  <GPriceScope v-if="region" v-bind="region" as="div" data-gb="product-card-02">
    <ProductCard :product="product" form="horizontal" :heading-level="heading" :labels="labels" :locale="locale" :busy="busy" :product-slot="$slots.product" :media-slot="$slots.media" :warn="warn" @navigate="emit('navigate', $event)" @open="emit('open', $event)" @add="emit('add', $event)" />
  </GPriceScope>
  <ProductCard v-else :product="product" form="horizontal" :heading-level="heading" :labels="labels" :locale="locale" :busy="busy" :product-slot="$slots.product" :media-slot="$slots.media" :warn="warn" data-gb="product-card-02" @navigate="emit('navigate', $event)" @open="emit('open', $event)" @add="emit('add', $event)" />
</template>
