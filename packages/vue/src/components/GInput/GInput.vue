<script setup>
// GInput · lógica del campo de texto (dueño: bruno)
// Contrato: design/contracts/input.md · Estructura: design/lab/input/r01/ · Estilo: GInput.css (coco)
import { computed, mergeProps, ref, useAttrs, useId, useSlots } from 'vue'
import { oneOf } from '../../utils/oneOf.js'
import GIcon from '../GIcon/GIcon.vue'
import { messageIcon, useFormField } from '../GForm/formContext.js'

defineOptions({ name: 'GInput', inheritAttrs: false })

const props = defineProps({
  modelValue: { type: String, default: '' },
  variant: { type: String, default: 'outline', validator: oneOf(['outline', 'soft']) },
  size: { type: String, default: 'md', validator: oneOf(['xs', 'sm', 'md', 'lg', 'xl']) },
  // density, block, disabled, readonly y error sin valor por defecto: la prop explícita gana al contexto de GForm
  // y, fuera de él, se resuelven a los de siempre ('default', false, false, false, sin error) (form.md §2)
  density: { type: String, default: undefined, validator: oneOf(['default', 'comfortable', 'compact']) },
  color: { type: String, default: undefined, validator: oneOf(['brand', 'accent', 'neutral', 'success', 'warning', 'danger', 'info']) },
  rounded: { type: String, default: undefined, validator: oneOf(['none', 'xs', 'sm', 'md', 'lg', 'xl', 'pill']) },
  block: { type: Boolean, default: undefined },
  disabled: { type: Boolean, default: undefined },
  readonly: { type: Boolean, default: undefined },
  loading: Boolean,
  type: { type: String, default: 'text', validator: oneOf(['text', 'email', 'password', 'search', 'tel', 'url']) },
  label: { type: String, default: undefined },
  hint: { type: String, default: undefined },
  error: { type: String, default: undefined },
  warning: { type: String, default: undefined },
  valid: { type: String, default: undefined },
  required: Boolean,
  mark: { type: Boolean, default: undefined },
  prefix: { type: String, default: undefined },
  suffix: { type: String, default: undefined },
  prefixLabel: { type: String, default: undefined },
  suffixLabel: { type: String, default: undefined },
  // Valor calculado por la aplicación (form.md C14, #180): <output> al final de la caja; no se envía
  output: { type: String, default: undefined },
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
const prefixId = computed(() => `${inputId.value}-prefix`)
const suffixId = computed(() => `${inputId.value}-suffix`)
const outputId = computed(() => `${inputId.value}-output`)
const hasOutput = computed(() => Boolean(props.output))

const field = ref(null)
const rootEl = ref(null)
// Contexto de GForm (form.md §2): densidad, estados, marca, mensaje y registro (name de $attrs)
const ff = useFormField({
  id: inputId,
  name: () => attrs.name,
  error: () => props.error,
  warning: () => props.warning,
  valid: () => props.valid,
  required: () => props.required,
  readonly: () => props.readonly,
  disabled: () => props.disabled,
  density: () => props.density,
  block: () => props.block,
  mark: () => props.mark,
  trigger: 'blur',
  control: field,
  root: rootEl
})
const density = ff.density
const isDisabled = ff.disabled
const isReadonly = ff.readonly
const message = ff.message
const invalid = ff.invalid
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
  `g-input--density-${density.value}`,
  props.color && `g-input--color-${props.color}`,
  props.rounded && `g-input--rounded-${props.rounded}`,
  {
    'g-input--block': ff.block.value,
    'g-input--has-action': hasAction.value,
    'g-input--has-prefix': Boolean(props.prefix),
    'g-input--has-suffix': Boolean(props.suffix),
    'g-input--has-output': hasOutput.value,
    'is-disabled': isDisabled.value,
    'is-readonly': isReadonly.value,
    'is-invalid': invalid.value,
    'is-warning': ff.ownMessage.value?.type === 'warning',
    'is-valid': ff.ownMessage.value?.type === 'valid',
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
  // La unidad es información (#166): prefijo y sufijo antes de ayuda y mensaje; el valor calculado (C14) tras ellos
  const ids = [attrs['aria-describedby'], props.prefix && prefixId.value, props.suffix && suffixId.value, hasOutput.value && outputId.value, hasHint.value && hintId.value, message.value && ff.messageId.value].filter(Boolean)
  return ids.length ? ids.join(' ') : undefined
})

// Atributos que controla el componente; se aplican después de los del consumidor y ganan.
const controlled = computed(() => ({
  id: inputId.value,
  type: fieldType.value,
  value: props.modelValue,
  disabled: isDisabled.value || undefined,
  readonly: isReadonly.value || undefined,
  required: props.required || undefined,
  'aria-invalid': invalid.value ? 'true' : undefined,
  'aria-busy': props.loading ? 'true' : undefined,
  'aria-describedby': describedBy.value
}))
function onInput(event) {
  emit('update:modelValue', event.target.value)
}

// Los manejadores del contexto y el nuestro van PRIMERO: así una escucha `@input`/`@blur` del consumidor ya ve el
// modelo y el estado del formulario actualizados, igual que con un <input v-model> nativo.
const fieldBindings = computed(() => mergeProps(ff.handlers, { onInput }, { ...inputAttrs.value, ...controlled.value }))

// Pulsar sobre el prefijo, el sufijo o el valor calculado enfoca el <input> (comodidad de puntero; no son interactivos)
function focusField() {
  field.value?.focus()
}

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
  <div ref="rootEl" v-bind="rootAttrs" :class="classes">
    <label v-if="hasLabel" class="g-input__label" :for="inputId"><slot name="label">{{ label }}</slot><template v-if="ff.mark.value === 'optional' && ff.markText.value">{{ ' ' }}<span class="g-input__optional">{{ ff.markText.value }}</span></template><span v-if="ff.mark.value === 'required'" class="g-input__required" aria-hidden="true">*</span></label>
    <div class="g-input__row">
      <div class="g-input__control">
        <span v-if="slots.prepend" class="g-input__prepend" aria-hidden="true"><slot name="prepend" /></span>
        <template v-if="prefix">
          <span class="g-input__prefix" :id="prefixLabel ? undefined : prefixId" :aria-hidden="prefixLabel ? 'true' : undefined" @click="focusField">{{ prefix }}</span>
          <span v-if="prefixLabel" :id="prefixId" class="g-input__prefix-label">{{ prefixLabel }}</span>
        </template>
        <input ref="field" v-bind="fieldBindings" class="g-input__field">
        <template v-if="suffix">
          <span class="g-input__suffix" :id="suffixLabel ? undefined : suffixId" :aria-hidden="suffixLabel ? 'true' : undefined" @click="focusField">{{ suffix }}</span>
          <span v-if="suffixLabel" :id="suffixId" class="g-input__suffix-label">{{ suffixLabel }}</span>
        </template>
        <output v-if="output !== undefined" :id="outputId" class="g-input__output" :for="inputId" aria-live="polite" @click="focusField"><template v-if="output">{{ output }}</template></output>
        <span v-if="slots.append" class="g-input__append" aria-hidden="true"><slot name="append" /></span>
        <GIcon v-if="loading" class="g-input__loader" name="loader-circle" />
        <button
          v-if="showToggle"
          class="g-input__toggle"
          type="button"
          :aria-controls="inputId"
          :disabled="isDisabled"
          @click="visible = !visible"
        >{{ visible ? hidePasswordLabel : showPasswordLabel }}</button>
      </div>
      <div v-if="hasAction" class="g-input__action">
        <slot name="action" :size="size" :density="density" :disabled="isDisabled" />
      </div>
    </div>
    <div class="g-input__support">
      <div v-if="hasHint || showCounter" class="g-input__messages">
        <span v-if="hasHint" :id="hintId" class="g-input__hint"><slot name="hint">{{ hint }}</slot></span>
        <span v-if="showCounter" class="g-input__counter" aria-hidden="true">{{ modelValue.length }}/{{ maxlength }}</span>
      </div>
      <div :id="ff.messageId.value" class="g-input__message" :aria-live="ff.live.value"><template v-if="message"><GIcon class="g-input__message-icon" :name="messageIcon(message.type)" /><span v-if="message.prefix" class="g-input__message-type">{{ message.prefix }}</span><slot v-if="message.type === 'error'" name="error">{{ message.text }}</slot><template v-else>{{ message.text }}</template></template></div>
    </div>
  </div>
</template>
