<script setup>
// Marco de un ejemplo vivo: componentes reales de Grana, fuera de los estilos de documento de
// VitePress (.vp-raw) y con el tema de Grana.
import { computed } from 'vue'
import { useData } from 'vitepress'

const props = defineProps({ label: { type: String, default: null } })
const { lang } = useData()
const text = computed(() => props.label || (lang.value === 'en' ? 'Live example' : 'Ejemplo vivo'))
</script>

<template>
  <section class="grana-demo" :aria-label="text">
    <p class="grana-demo__label" aria-hidden="true">{{ text }}</p>
    <div class="grana-demo__stage vp-raw">
      <slot />
    </div>
  </section>
</template>
