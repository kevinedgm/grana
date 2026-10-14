<script setup>
import { reactive, ref, onMounted, onBeforeUnmount } from 'vue'

const ancho = ref('completo')
const anchos = [
  { value: 'completo', label: 'Completo' },
  { value: 'mediano', label: 'Mediano' },
  { value: 'estrecho', label: 'Estrecho' }
]
const m = reactive({ calle: '', ext: '', int: '', colonia: '', cp: '', ciudad: '' })
const textos = { optional: '(opcional)', error: 'Error: ', warning: 'Advertencia: ', valid: 'Correcto: ' }

// La fila mide su propio ancho y publica en data-lines cuántas líneas usa
const fila = ref(null)
const lineas = ref(1)
let observador
onMounted(() => {
  const el = fila.value.$el
  const leer = () => { lineas.value = Number(el.dataset.lines) || 1 }
  observador = new MutationObserver(leer)
  observador.observe(el, { attributes: true, attributeFilter: ['data-lines'] })
  leer()
})
onBeforeUnmount(() => observador?.disconnect())
</script>

<template>
  <div class="demo">
    <g-radio-group v-model="ancho" appearance="segmented" label="Ancho del contenedor" name="ancho" :options="anchos" />
    <div class="marco" :class="`marco--${ancho}`">
      <g-form aria-label="Dirección" :labels="textos">
        <g-form-layout>
          <g-form-row ref="fila">
            <g-input v-model="m.calle" class="g-form-w-lg" label="Calle" name="calle" required autocomplete="address-line1" />
            <g-input v-model="m.ext" class="g-form-w-xs" label="Núm. ext." name="num-ext" required />
            <g-input v-model="m.int" class="g-form-w-xs" label="Núm. int." name="num-int" autocomplete="address-line2" />
          </g-form-row>
          <g-form-row>
            <g-input v-model="m.colonia" label="Colonia" name="colonia" required autocomplete="address-level3" />
            <g-input v-model="m.cp" class="g-form-w-sm" label="Código postal" name="cp" inputmode="numeric" required autocomplete="postal-code" />
            <g-input v-model="m.ciudad" label="Ciudad" name="ciudad" required autocomplete="address-level2" />
          </g-form-row>
        </g-form-layout>
      </g-form>
    </div>
    <p class="nota" aria-live="polite">Calle · Núm. ext. · Núm. int. ocupa {{ lineas }} {{ lineas === 1 ? 'línea' : 'líneas' }}.</p>
  </div>
</template>

<style scoped>
.demo {
  display: grid;
  gap: var(--g-space-6);
}
.marco--mediano {
  max-inline-size: calc(var(--g-space-1) * 120);
}
.marco--estrecho {
  max-inline-size: calc(var(--g-space-1) * 75);
}
.nota {
  margin: 0;
}
</style>
