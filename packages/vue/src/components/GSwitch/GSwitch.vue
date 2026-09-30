<script setup>
// GSwitch · interruptor de efecto inmediato (dueño: bruno)
// Contrato: design/contracts/switch.md · Estructura: design/lab/switch/r01/ · Estilo: GSwitch.css (coco)
import { computed, mergeProps, nextTick, onMounted, ref, useAttrs, useId, useSlots, watch } from 'vue'
import { oneOf } from '../../utils/oneOf.js'

defineOptions({ name: 'GSwitch', inheritAttrs: false })

const props = defineProps({
  modelValue: Boolean,
  labelPosition: { type: String, default: 'end', validator: oneOf(['end', 'start']) },
  size: { type: String, default: 'md', validator: oneOf(['xs', 'sm', 'md', 'lg', 'xl']) },
  density: { type: String, default: 'default', validator: oneOf(['default', 'comfortable', 'compact']) },
  color: { type: String, default: 'brand', validator: oneOf(['brand', 'accent', 'neutral', 'success', 'warning', 'danger', 'info']) },
  disabled: Boolean,
  readonly: Boolean,
  loading: Boolean,
  label: { type: String, default: undefined },
  hint: { type: String, default: undefined },
  error: { type: String, default: undefined },
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
const errorId = computed(() => `${inputId.value}-error`)

const invalid = computed(() => Boolean(props.error))
const hasLabel = computed(() => Boolean(props.label || slots.label))
const hasHint = computed(() => Boolean(props.hint || slots.hint))
const hasIconOn = computed(() => Boolean(slots['icon-on']))
const hasIconOff = computed(() => Boolean(slots['icon-off']))

const input = ref(null)
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
  `g-switch--density-${props.density}`,
  `g-switch--color-${props.color}`,
  `g-switch--label-${props.labelPosition}`,
  {
    'g-switch--icons': hasIconOn.value || hasIconOff.value,
    'is-disabled': props.disabled,
    'is-readonly': props.readonly,
    'is-invalid': invalid.value,
    'is-loading': props.loading
  }
])

const describedBy = computed(() => {
  const ids = [attrs['aria-describedby'], hasHint.value && hintId.value, invalid.value && errorId.value].filter(Boolean)
  return ids.length ? ids.join(' ') : undefined
})

// Atributos que controla el componente; se aplican después de los del consumidor y ganan.
const controlled = computed(() => ({
  id: inputId.value,
  role: 'switch',
  checked: props.modelValue,
  disabled: props.disabled || undefined,
  'aria-readonly': props.readonly ? 'true' : undefined,
  'aria-invalid': invalid.value ? 'true' : undefined,
  'aria-busy': props.loading ? 'true' : undefined,
  'aria-labelledby': hasLabel.value ? labelId.value : attrs['aria-labelledby'],
  'aria-describedby': describedBy.value
}))

// readonly: el <input type="checkbox"> no admite `readonly`; se cancela el clic (también el de Espacio).
function onClick(event) {
  if (props.readonly) event.preventDefault()
}

function onChange(event) {
  emit('update:modelValue', event.target.checked)
  nextTick(sync)
}

// Nuestros manejadores van PRIMERO: así una escucha `@change` del consumidor ya ve el modelo actualizado,
// igual que con un <input v-model> nativo.
const fieldBindings = computed(() => mergeProps({ onClick, onChange }, { ...inputAttrs.value, ...controlled.value }))

// Avisos solo en desarrollo. `process` puede no existir (UMD en navegador): se comprueba antes de leerlo.
const isDev = typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production'
if (isDev && !hasLabel.value && !attrs['aria-label'] && !attrs['aria-labelledby']) {
  console.warn('[Grana] <GSwitch> necesita label, slot label, aria-label o aria-labelledby para tener un nombre accesible.')
}
</script>

<template>
  <div v-bind="rootAttrs" :class="classes">
    <label class="g-switch__row" :for="inputId">
      <span class="g-switch__control">
        <input ref="input" v-bind="fieldBindings" class="g-switch__input" type="checkbox">
        <span v-if="hasIconOn" class="g-switch__icon g-switch__icon--on" aria-hidden="true"><slot name="icon-on" /></span>
        <span v-if="hasIconOff" class="g-switch__icon g-switch__icon--off" aria-hidden="true"><slot name="icon-off" /></span>
      </span>
      <span class="g-switch__text">
        <span v-if="hasLabel" :id="labelId" class="g-switch__label"><slot name="label">{{ label }}</slot></span>
        <span v-if="hasHint" :id="hintId" class="g-switch__hint"><slot name="hint">{{ hint }}</slot></span>
      </span>
    </label>
    <div :id="errorId" class="g-switch__error" aria-live="polite"><template v-if="invalid"><slot name="error">{{ error }}</slot></template></div>
  </div>
</template>
