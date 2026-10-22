<script setup>
// El formulario de GbNewsletter, igual en las tres variantes (dueño: bruno; design/contracts/blocks/newsletter.md
// «El formulario»). Interno de la sección: no se exporta. Sin CSS (#763).
// GForm › GInput type="email" autocomplete="email" required (label, hint = la promesa, placeholder, name) con el slot
// `action` = GBtn type="submit" (loading = busy, loadingText = labels.busy) + p con `legal`.
// Validación: GForm no valida (form.md: «presenta y emite intención»); el bloque toma la del navegador sobre el propio
// campo (`required` + `type="email"`, su `validationMessage`) y la entrega a GForm por `errors`: al escribir, desde el
// `input` del campo; al enviar, desde el control del formulario que envía, y entonces `showErrors()` (revela, sacude y
// enfoca) y NO emite `submit`. `error` (servidor) entra por la misma vía y gana; `done` es el mensaje `valid` del campo.
import { computed, nextTick, ref, watch } from 'vue'
import { GBtn, GForm, GIcon, GInput } from '@grana/vue'
import GbLink from '../common/link.js'
import { has } from '../common/text.js'

defineOptions({ name: 'GbNewsletterForm' })
const props = defineProps({
  field: { type: Object, required: true },
  action: { type: Object, required: true },
  legal: { type: Object, default: undefined },
  busy: { type: Boolean, default: false },
  error: { type: String, default: undefined },
  done: { type: String, default: undefined },
  labels: { type: Object, default: () => ({}) },
  warn: { type: Function, required: true }
})
const emit = defineEmits(['submit', 'navigate'])
const warn = props.warn

const form = ref(null)
const email = ref('')
const native = ref('') // mensaje de validación del navegador tras la última escritura o el último envío
const name = computed(() => (has(props.field && props.field.name) ? props.field.name : 'email'))
const field = computed(() => props.field || {})
const serverError = computed(() => (has(props.error) ? props.error : ''))
const errors = computed(() => {
  const m = serverError.value || native.value
  return m ? { [name.value]: m } : {}
})
// N2: con `error` y `done` a la vez, gana `error`
const valid = computed(() => (!serverError.value && has(props.done) ? props.done : undefined))
const busyText = computed(() => (has(props.labels && props.labels.busy) ? props.labels.busy : undefined))

try {
  if (process.env.NODE_ENV !== 'production') {
    if (!has(field.value.hint)) warn('N1', 'falta field.hint, la promesa (qué llega y cada cuánto): se pinta sin ella (N1).')
  }
} catch {}
watch(() => [props.busy, busyText.value], ([b, t]) => {
  try { if (process.env.NODE_ENV !== 'production' && b && !t) warn('C5:busy', 'busy sin labels.busy: el botón carga sin anunciarlo (C5).') } catch {}
}, { immediate: true })
watch(() => [serverError.value, has(props.done)], ([e, d]) => {
  try { if (process.env.NODE_ENV !== 'production' && e && d) warn('N2', '`error` y `done` a la vez: gana `error` (N2).') } catch {}
}, { immediate: true })

// Error del servidor: se revela en el acto (form.md «Envío» paso 6)
watch(serverError, async (e) => {
  if (!e || !form.value) return
  await nextTick()
  form.value.showErrors()
})

function check(control) {
  native.value = control && control.validity && !control.validity.valid ? control.validationMessage || '' : ''
  return !(control && control.validity && !control.validity.valid)
}
function onInput(event) {
  check(event && event.target)
}
async function onSubmit({ event }) {
  const f = event && event.target
  const control = f && f.elements && typeof f.elements.namedItem === 'function' ? f.elements.namedItem(name.value) : null
  if (!check(control)) {
    await nextTick()
    if (form.value) form.value.showErrors()
    return
  }
  emit('submit', { event, email: String(email.value || '').trim() })
}
</script>

<template>
  <GForm ref="form" :errors="errors" @submit="onSubmit">
    <GInput
      v-model="email"
      type="email"
      autocomplete="email"
      required
      :name="name"
      :label="field.label"
      :hint="field.hint"
      :placeholder="field.placeholder"
      :valid="valid"
      @input="onInput"
    >
      <template #action="{ size, density, disabled }">
        <GBtn type="submit" :size="size" :density="density" :disabled="disabled" :loading="busy" :loading-text="busyText">
          <template v-if="has(action.icon)" #prepend><GIcon :name="action.icon" /></template>
          {{ action.label }}
        </GBtn>
      </template>
    </GInput>
    <p v-if="$slots.legal || (legal && has(legal.text))">
      <slot name="legal">{{ legal.text }}<template v-if="legal.link && has(legal.link.label)">{{ ' ' }}<GbLink :link="legal.link" :external="labels.external" what="legal.link" :warn="warn" @navigate="emit('navigate', $event)" /></template></slot>
    </p>
  </GForm>
</template>
