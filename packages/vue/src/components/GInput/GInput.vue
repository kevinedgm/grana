<script setup>
// GInput · lógica del campo de texto (dueño: bruno)
// Contrato: design/contracts/input.md · Estructura: design/lab/input/r01/ · Estilo: GInput.css (coco)
import { computed, mergeProps, ref, useAttrs, useId, useSlots } from 'vue'
import { oneOf } from '../../utils/oneOf.js'

defineOptions({ name: 'GInput', inheritAttrs: false })

const props = defineProps({
  modelValue: { type: String, default: '' },
  variant: { type: String, default: 'outline', validator: oneOf(['outline', 'soft']) },
  size: { type: String, default: 'md', validator: oneOf(['xs', 'sm', 'md', 'lg', 'xl']) },
  density: { type: String, default: 'default', validator: oneOf(['default', 'comfortable', 'compact']) },
  color: { type: String, default: undefined, validator: oneOf(['brand', 'accent', 'neutral', 'success', 'warning', 'danger', 'info']) },
  rounded: { type: String, default: undefined, validator: oneOf(['none', 'xs', 'sm', 'md', 'lg', 'xl', 'pill']) },
  block: Boolean,
  disabled: Boolean,
  readonly: Boolean,
  loading: Boolean,
  type: { type: String, default: 'text', validator: oneOf(['text', 'email', 'password', 'search', 'tel', 'url']) },
  label: { type: String, default: undefined },
  hint: { type: String, default: undefined },
  error: { type: String, default: undefined },
  required: Boolean,
  counter: Boolean,
  showPasswordLabel: { type: String, default: undefined },
  hidePasswordLabel: { type: String, default: undefined },
  id: { type: String, default: undefined }
})

// Solo `update:modelValue` se declara: el resto de eventos llega al <input> nativo por $attrs.
const emit = defineEmits(['update:modelValue'])

const attrs = useAttrs()
const slots = useSlots()

const uid = useId()
const inputId = computed(() => props.id || `g-input-${uid}`)
const hintId = computed(() => `${inputId.value}-hint`)
const errorId = computed(() => `${inputId.value}-error`)

const invalid = computed(() => Boolean(props.error))
const hasLabel = computed(() => Boolean(props.label || slots.label))
const hasHint = computed(() => Boolean(props.hint || slots.hint))

// class y style van a la raíz; todo lo demás, al <input>.
const rootAttrs = computed(() => ({ class: attrs.class, style: attrs.style }))
const inputAttrs = computed(() => {
  const { class: _class, style: _style, ...rest } = attrs
  return rest
})

const hasAction = computed(() => Boolean(slots.action))

const classes = computed(() => [
  'g-input',
  `g-input--variant-${props.variant}`,
  `g-input--size-${props.size}`,
  `g-input--density-${props.density}`,
  props.color && `g-input--color-${props.color}`,
  props.rounded && `g-input--rounded-${props.rounded}`,
  {
    'g-input--block': props.block,
    'g-input--has-action': hasAction.value,
    'is-disabled': props.disabled,
    'is-readonly': props.readonly,
    'is-invalid': invalid.value,
    'is-loading': props.loading
  }
])

// Contraseña: el botón solo existe si el consumidor da las dos etiquetas.
const visible = ref(false)
const showToggle = computed(() => props.type === 'password' && Boolean(props.showPasswordLabel && props.hidePasswordLabel))
const fieldType = computed(() => (props.type === 'password' && visible.value ? 'text' : props.type))

const maxlength = computed(() => (attrs.maxlength === undefined || attrs.maxlength === '' ? null : Number(attrs.maxlength)))
const showCounter = computed(() => props.counter && maxlength.value !== null)

const describedBy = computed(() => {
  const ids = [attrs['aria-describedby'], hasHint.value && hintId.value, invalid.value && errorId.value].filter(Boolean)
  return ids.length ? ids.join(' ') : undefined
})

// Atributos que controla el componente; se aplican después de los del consumidor y ganan.
const controlled = computed(() => ({
  id: inputId.value,
  type: fieldType.value,
  value: props.modelValue,
  disabled: props.disabled || undefined,
  readonly: props.readonly || undefined,
  required: props.required || undefined,
  'aria-invalid': invalid.value ? 'true' : undefined,
  'aria-busy': props.loading ? 'true' : undefined,
  'aria-describedby': describedBy.value
}))
function onInput(event) {
  emit('update:modelValue', event.target.value)
}

// Nuestro manejador va PRIMERO: así una escucha `@input` del consumidor ya ve el modelo actualizado,
// igual que con un <input v-model> nativo.
const fieldBindings = computed(() => mergeProps({ onInput }, { ...inputAttrs.value, ...controlled.value }))

// Avisos solo en desarrollo. `process` puede no existir (UMD en navegador): se comprueba antes de leerlo.
const isDev = typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production'
if (isDev) {
  if (!hasLabel.value && !attrs['aria-label'] && !attrs['aria-labelledby']) {
    console.warn('[Grana] <GInput> necesita label, slot label, aria-label o aria-labelledby para tener un nombre accesible.')
  }
  if (props.counter && maxlength.value === null) {
    console.warn('[Grana] <GInput counter> necesita maxlength para mostrar el contador.')
  }
  if (props.type === 'password' && !showToggle.value) {
    console.warn('[Grana] <GInput type="password"> necesita showPasswordLabel y hidePasswordLabel para mostrar el botón de visibilidad.')
  }
}
</script>

<template>
  <div v-bind="rootAttrs" :class="classes">
    <label v-if="hasLabel" class="g-input__label" :for="inputId">
      <slot name="label">{{ label }}</slot>
      <span v-if="required" class="g-input__required" aria-hidden="true">*</span>
    </label>
    <div class="g-input__row">
      <div class="g-input__control">
        <span v-if="slots.prepend" class="g-input__prepend" aria-hidden="true"><slot name="prepend" /></span>
        <input v-bind="fieldBindings" class="g-input__field">
        <span v-if="slots.append" class="g-input__append" aria-hidden="true"><slot name="append" /></span>
        <span v-if="loading" class="g-input__loader" aria-hidden="true" />
        <button
          v-if="showToggle"
          class="g-input__toggle"
          type="button"
          :aria-controls="inputId"
          :disabled="disabled"
          @click="visible = !visible"
        >{{ visible ? hidePasswordLabel : showPasswordLabel }}</button>
      </div>
      <div v-if="hasAction" class="g-input__action">
        <slot name="action" :size="size" :density="density" :disabled="disabled" />
      </div>
    </div>
    <div v-if="hasHint || showCounter" class="g-input__messages">
      <span v-if="hasHint" :id="hintId" class="g-input__hint"><slot name="hint">{{ hint }}</slot></span>
      <span v-if="showCounter" class="g-input__counter" aria-hidden="true">{{ modelValue.length }}/{{ maxlength }}</span>
    </div>
    <div :id="errorId" class="g-input__error" aria-live="polite"><template v-if="invalid"><slot name="error">{{ error }}</slot></template></div>
  </div>
</template>
