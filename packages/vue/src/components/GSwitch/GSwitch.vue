<script setup>
// GSwitch · interruptor de efecto inmediato (dueño: bruno)
// Contrato: design/contracts/switch.md · Estructura: design/lab/switch/r01/ · Estilo: GSwitch.css (coco)
import { computed, mergeProps, nextTick, onMounted, ref, useAttrs, useId, useSlots, watch } from 'vue'
import { oneOf } from '../../utils/oneOf.js'
import GIcon from '../GIcon/GLibIcon.js'
import { messageIcon, useFormField } from '../GForm/formContext.js'

defineOptions({ name: 'GSwitch', inheritAttrs: false })

const props = defineProps({
  modelValue: Boolean,
  labelPosition: { type: String, default: 'end', validator: oneOf(['end', 'start']) },
  size: { type: String, default: 'md', validator: oneOf(['xs', 'sm', 'md', 'lg', 'xl']) },
  // density, block, disabled, readonly y error sin valor por defecto: la prop explícita gana al contexto de GForm (form.md §2)
  density: { type: String, default: undefined, validator: oneOf(['default', 'comfortable', 'compact']) },
  color: { type: String, default: 'brand', validator: oneOf(['brand', 'accent', 'neutral', 'success', 'warning', 'danger', 'info']) },
  disabled: { type: Boolean, default: undefined },
  readonly: { type: Boolean, default: undefined },
  loading: Boolean,
  label: { type: String, default: undefined },
  hint: { type: String, default: undefined },
  error: { type: String, default: undefined },
  warning: { type: String, default: undefined },
  valid: { type: String, default: undefined },
  id: { type: String, default: undefined }
})

// Solo este evento se declara: el resto llega al <input> nativo por $attrs.
const emit = defineEmits(['update:modelValue'])

const attrs = useAttrs()
const slots = useSlots()

const uid = useId()
const inputId = computed(() => props.id || `g-switch-${uid}`)
const labelId = computed(() => `${inputId.value}-label`)
const hintId = computed(() => `${inputId.value}-hint`)

const input = ref(null)
const rootEl = ref(null)
// Contexto de GForm (form.md §2). El interruptor nunca lleva marca (#47) y revela su error al cambiar
const ff = useFormField({
  id: inputId,
  name: () => attrs.name,
  error: () => props.error,
  warning: () => props.warning,
  valid: () => props.valid,
  readonly: () => props.readonly,
  disabled: () => props.disabled,
  density: () => props.density,
  markRule: 'none',
  trigger: 'change',
  control: input,
  root: rootEl
})
const isDisabled = ff.disabled
const isReadonly = ff.readonly
const message = ff.message
const invalid = ff.invalid
const hasLabel = computed(() => Boolean(props.label || slots.label))
const hasHint = computed(() => Boolean(props.hint || slots.hint))
const hasIconOn = computed(() => Boolean(slots['icon-on']))
const hasIconOff = computed(() => Boolean(slots['icon-off']))

// El <input> nativo puede divergir del prop tras un clic; se vuelve a alinear con lo que diga el consumidor.
function sync() {
  if (input.value) input.value.checked = props.modelValue
}
onMounted(sync)
watch(() => props.modelValue, sync, { flush: 'post' })

// class y style van a la raíz; todo lo demás, al <input>.
const rootAttrs = computed(() => ({ class: attrs.class, style: attrs.style }))
const inputAttrs = computed(() => {
  const { class: _class, style: _style, ...rest } = attrs
  return rest
})

const classes = computed(() => [
  'g-switch',
  `g-switch--size-${props.size}`,
  `g-switch--density-${ff.density.value}`,
  `g-switch--color-${props.color}`,
  `g-switch--label-${props.labelPosition}`,
  {
    'g-switch--icons': hasIconOn.value || hasIconOff.value,
    'is-disabled': isDisabled.value,
    'is-readonly': isReadonly.value,
    'is-invalid': invalid.value,
    'is-warning': ff.ownMessage.value?.type === 'warning',
    'is-valid': ff.ownMessage.value?.type === 'valid',
    'is-loading': props.loading
  }
])

const describedBy = computed(() => {
  const ids = [attrs['aria-describedby'], hasHint.value && hintId.value, message.value && ff.messageId.value].filter(Boolean)
  return ids.length ? ids.join(' ') : undefined
})

// Atributos que controla el componente; se aplican después de los del consumidor y ganan.
const controlled = computed(() => ({
  id: inputId.value,
  role: 'switch',
  checked: props.modelValue,
  disabled: isDisabled.value || undefined,
  'aria-readonly': isReadonly.value ? 'true' : undefined,
  'aria-invalid': invalid.value ? 'true' : undefined,
  'aria-busy': props.loading ? 'true' : undefined,
  'aria-labelledby': hasLabel.value ? labelId.value : attrs['aria-labelledby'],
  'aria-describedby': describedBy.value
}))

// readonly: el <input type="checkbox"> no admite `readonly`; se cancela el clic (también el de Espacio).
function onClick(event) {
  if (isReadonly.value) event.preventDefault()
}

function onChange(event) {
  emit('update:modelValue', event.target.checked)
  nextTick(sync)
}

// Nuestros manejadores van PRIMERO: así una escucha `@change` del consumidor ya ve el modelo actualizado,
// igual que con un <input v-model> nativo.
// Los del contexto de GForm van antes que los nuestros (form.md §2, C8).
const fieldBindings = computed(() => mergeProps(ff.handlers, { onClick, onChange }, { ...inputAttrs.value, ...controlled.value }))

// Avisos solo en desarrollo. `process` puede no existir (UMD en navegador): se comprueba antes de leerlo.
const isDev = typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production'
if (isDev && !hasLabel.value && !attrs['aria-label'] && !attrs['aria-labelledby']) {
  console.warn('[Grana] <GSwitch> necesita label, slot label, aria-label o aria-labelledby para tener un nombre accesible.')
}
</script>

<template>
  <div ref="rootEl" v-bind="rootAttrs" :class="classes">
    <label class="g-switch__row" :for="inputId">
      <span class="g-switch__control">
        <input ref="input" v-bind="fieldBindings" class="g-switch__input" type="checkbox">
        <GIcon class="g-switch__mark g-switch__mark--off" name="minus" />
        <GIcon class="g-switch__mark g-switch__mark--on" name="check" />
        <GIcon class="g-switch__mark g-switch__mark--busy" name="loader-circle" />
        <span v-if="hasIconOn" class="g-switch__icon g-switch__icon--on" aria-hidden="true"><slot name="icon-on" /></span>
        <span v-if="hasIconOff" class="g-switch__icon g-switch__icon--off" aria-hidden="true"><slot name="icon-off" /></span>
      </span>
      <span class="g-switch__text">
        <span v-if="hasLabel" :id="labelId" class="g-switch__label"><slot name="label">{{ label }}</slot></span>
        <span v-if="hasHint" :id="hintId" class="g-switch__hint"><slot name="hint">{{ hint }}</slot></span>
      </span>
    </label>
    <div :id="ff.messageId.value" class="g-switch__message" :aria-live="ff.live.value"><template v-if="message"><GIcon class="g-switch__message-icon" :name="messageIcon(message.type)" /><span v-if="message.prefix" class="g-switch__message-type">{{ message.prefix }}</span><slot v-if="message.type === 'error'" name="error">{{ message.text }}</slot><template v-else>{{ message.text }}</template></template></div>
  </div>
</template>
