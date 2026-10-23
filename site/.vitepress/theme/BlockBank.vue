<script setup>
// Ejemplo vivo de una sección de @grana/blocks: sus variantes, una debajo de otra, con el banco de datos
// de la sección (el mismo de las pruebas y del playground del paquete). Las intenciones que emite cada
// variante (navigate, activate, submit, select, book, photos…) se anotan debajo; los `update:*` escriben
// de vuelta en los datos, como haría tu aplicación con `v-model`.
import { computed, h, reactive, ref } from 'vue'
import { GContainer } from '@grana/vue'

const props = defineProps({
  blocks: { type: Object, required: true }, // import * as Blocks from '@grana/blocks/<familia>'
  meta: { type: Object, required: true }, // <Gb…>.meta.json
  bank: { type: Object, required: true } // <seccion>.bank.js: { props, slots }
})

const state = reactive({ ...props.bank.props })
const last = ref('')
const eventNames = (props.meta.events || []).map((e) => e.name)

function handlers(variant) {
  const out = {}
  for (const name of eventNames) {
    const camel = name.replace(/(^|[:-])([a-z])/g, (_, __, c) => c.toUpperCase())
    if (name.startsWith('update:')) {
      const key = name.slice(7)
      out[`onUpdate:${key}`] = (v) => { state[key] = v }
    } else {
      out[`on${camel}`] = (payload) => {
        // La navegación la decide tu router: aquí se anota la intención y no se sale de la página.
        payload?.event?.preventDefault?.()
        const data = payload && typeof payload === 'object' ? payload.href ?? payload.value ?? payload.offer?.id ?? payload.item?.id ?? '' : payload
        last.value = `${variant} · ${name}${data ? ` · ${typeof data === 'string' ? data : JSON.stringify(data)}` : ''}`
      }
    }
  }
  return out
}

const all = computed(() => props.meta.variants.map((v) => ({ ...v, component: props.blocks[v.name] })))
// Una sección cuyo bloque pinta el `h1` de la página (GbHero) se muestra de una en una: la página de documentación ya
// tiene el suyo y tres `h1` más serían un esquema de encabezados roto.
const single = computed(() => props.meta.name === 'GbHero')
const current = ref(props.meta.variants[0]?.name)
const variants = computed(() => (single.value ? all.value.filter((v) => v.name === current.value) : all.value))

// Renderiza una variante con los datos y los slots del banco.
const Variant = (p) => h(p.component, { ...state, id: `demo-${p.name}`, ...handlers(p.name) }, props.bank.slots)
Variant.props = ['component', 'name']
</script>

<template>
  <div class="grana-block-bank">
    <div v-if="single" class="grana-block-bank__choose" role="group" :aria-label="meta.name">
      <button
        v-for="v in all" :key="v.name" type="button" class="grana-block-bank__pick"
        :aria-pressed="v.name === current" @click="current = v.name"
      >{{ v.name }} · {{ v.concept }}</button>
    </div>
    <section v-for="v in variants" :key="v.name" class="grana-block-bank__variant">
      <p class="grana-block-bank__label">{{ v.name }} · {{ v.concept }}</p>
      <GContainer as="div"><Variant :component="v.component" :name="v.name" /></GContainer>
    </section>
    <p class="grana-block-bank__last" aria-live="polite"><span v-if="last">{{ last }}</span></p>
  </div>
</template>

<style scoped>
.grana-block-bank { display: grid; grid-template-columns: minmax(0, 1fr); gap: var(--g-space-8); }
.grana-block-bank__choose { display: flex; flex-wrap: wrap; gap: var(--g-space-2); }
.grana-block-bank__pick { min-block-size: 24px; padding-block: var(--g-space-1); padding-inline: var(--g-space-3); border: 1px solid var(--g-color-border-control); border-radius: var(--g-radius-md); background: var(--g-color-surface); color: var(--g-color-text); font: inherit; cursor: pointer; }
.grana-block-bank__pick[aria-pressed='true'] { border-color: var(--g-color-primary); background: var(--g-color-primary-soft); }
@media (pointer: coarse) { .grana-block-bank__pick { min-block-size: 44px; } }
.grana-block-bank__label { margin: 0 0 var(--g-space-3); font: var(--g-font-caption); color: var(--g-color-text-muted); }
.grana-block-bank__last { margin: 0; min-block-size: 1lh; font: var(--g-font-caption); color: var(--g-color-text-muted); }
</style>
