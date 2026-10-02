<script setup>
// GErrorSummary · resumen de errores con enlaces a cada pregunta y foco (dueño: bruno)
// Contrato: design/contracts/form.md §7 (#162, precedente #78) · Estilo: GErrorSummary.css (coco)
// Raíz enfocable (tabindex=-1) siempre presente (hidden sin errores) con role="alert" interior.
import { computed, inject, nextTick, onBeforeUnmount, onMounted, ref, unref, useAttrs, useId, watch } from 'vue'
import { fill } from '../../utils/template.js'
import GIcon from '../GIcon/GLibIcon.js'
import { formKey, isDev, revealAndFocus } from '../GForm/formContext.js'

defineOptions({ name: 'GErrorSummary' })

const props = defineProps({
  errors: { type: Array, default: undefined },
  headingLevel: { type: Number, default: undefined, validator: (v) => Number.isInteger(v) && v >= 2 && v <= 6 },
  labels: { type: Object, default: () => ({}) }
})

const emit = defineEmits(['navigate'])

const attrs = useAttrs()
const form = inject(formKey, null)
const inForm = computed(() => Boolean(form) && props.errors === undefined)
const renders = computed(() => inForm.value || props.errors !== undefined)

const uid = useId()
const rootId = computed(() => attrs.id || `g-error-summary-${uid}`)
const titleId = computed(() => `${rootId.value}-title`)
const level = computed(() => props.headingLevel ?? unref(form?.headingLevel) ?? 3)

const items = computed(() => {
  if (inForm.value) return unref(form.summaryItems) || []
  return (props.errors || [])
    .filter((e) => e && e.message)
    .map((e, i) => ({ key: e.id || e.name || `i${i}`, name: e.name ?? null, id: e.id ?? null, message: String(e.message), root: null }))
})
const count = computed(() => items.value.length)
const title = computed(() => {
  const t = props.labels?.title
  if (typeof t === 'function') return String(t(count.value) ?? '')
  return fill(t, { count: count.value })
})

const el = ref(null)
function focus() {
  nextTick(() => { if (el.value && count.value) el.value.focus() })
}

let off = null
onMounted(() => {
  if (inForm.value && typeof form.registerSummary === 'function') off = form.registerSummary({ focus })
})
onBeforeUnmount(() => off?.())

// Fuera de GForm: recibe el foco al pasar de vacío a con elementos
watch(count, (n, prev) => {
  if (!inForm.value && n > 0 && !prev) focus()
})

async function onLink(event, item) {
  event.preventDefault()
  let prevented = false
  emit('navigate', { name: item.name, id: item.id, event, preventDefault: () => { prevented = true } })
  if (prevented) return
  await nextTick() // la aplicación pudo cambiar de pestaña o de paso en su manejador
  const control = typeof document !== 'undefined' ? document.getElementById(item.id) : null
  if (!control) {
    if (isDev) console.warn(`[Grana GErrorSummary] no existe ningún elemento con id «${item.id}».`)
    return
  }
  const root = (item.root && item.root()) || control.closest?.('.g-input, .g-textarea, .g-select, .g-datepicker, .g-checkbox-group, .g-checkbox, .g-switch, .g-field-group') || control
  revealAndFocus(control, root)
}

if (isDev) {
  if (!props.labels?.title) console.warn('[Grana GErrorSummary] falta labels.title: el título del resumen queda vacío.')
  if (!form && props.errors === undefined) console.warn('[Grana GErrorSummary] fuera de GForm necesita `errors`; sin ellos no pinta nada.')
}
</script>

<template>
  <div v-if="renders" :id="rootId" ref="el" class="g-error-summary" tabindex="-1" :aria-labelledby="titleId" :hidden="count ? undefined : true">
    <div role="alert">
      <component :is="`h${level}`" :id="titleId" class="g-error-summary__title"><GIcon class="g-error-summary__icon" name="circle-alert" />{{ title }}</component>
      <ul class="g-error-summary__list">
        <template v-for="item in items" :key="item.key">
          <li v-if="item.id"><a class="g-error-summary__link" :href="`#${item.id}`" @click="onLink($event, item)">{{ item.message }}</a></li>
          <li v-else class="g-error-summary__item">{{ item.message }}</li>
        </template>
      </ul>
    </div>
  </div>
</template>
