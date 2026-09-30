<script setup>
// GTextarea · lógica del campo de varias líneas (dueño: bruno)
// Contrato: design/contracts/textarea.md · Estructura: design/lab/textarea/r01/ · Estilo: GTextarea.css (coco)
import { computed, mergeProps, nextTick, onBeforeUnmount, onMounted, ref, useAttrs, useId, useSlots, watch } from 'vue'
import { oneOf } from '../../utils/oneOf.js'

defineOptions({ name: 'GTextarea', inheritAttrs: false })

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
  rows: { type: Number, default: 3 },
  autosize: Boolean,
  maxRows: { type: Number, default: undefined },
  resize: { type: String, default: 'vertical', validator: oneOf(['none', 'vertical']) },
  label: { type: String, default: undefined },
  hint: { type: String, default: undefined },
  error: { type: String, default: undefined },
  required: Boolean,
  counter: Boolean,
  counterText: { type: Function, default: undefined },
  id: { type: String, default: undefined }
})

// Solo `update:modelValue` se declara: el resto de eventos llega al <textarea> nativo por $attrs.
const emit = defineEmits(['update:modelValue'])

const attrs = useAttrs()
const slots = useSlots()

const uid = useId()
const fieldId = computed(() => props.id || `g-textarea-${uid}`)
const hintId = computed(() => `${fieldId.value}-hint`)
const errorId = computed(() => `${fieldId.value}-error`)

const invalid = computed(() => Boolean(props.error))
const hasLabel = computed(() => Boolean(props.label || slots.label))
const hasHint = computed(() => Boolean(props.hint || slots.hint))

// `rows` válido: entero ≥ 1. `maxRows` solo con autosize y ≥ rows.
const rowsN = computed(() => (Number.isInteger(props.rows) && props.rows >= 1 ? props.rows : 1))
const maxRowsN = computed(() => {
  if (!props.autosize || props.maxRows === undefined) return null
  return Number.isInteger(props.maxRows) && props.maxRows >= rowsN.value ? props.maxRows : rowsN.value
})
const resizeEff = computed(() => (props.autosize ? 'none' : props.resize))

// class y style van a la raíz; todo lo demás, al <textarea>.
const rootAttrs = computed(() => ({ class: attrs.class, style: attrs.style }))
const fieldAttrs = computed(() => {
  const { class: _class, style: _style, ...rest } = attrs
  return rest
})

const maxlength = computed(() => (attrs.maxlength === undefined || attrs.maxlength === '' ? null : Number(attrs.maxlength)))
const showCounter = computed(() => props.counter && maxlength.value !== null)

// ---------- Autosize: la altura sigue al contenido entre rows y maxRows ----------
const field = ref(null)
const autoH = ref(null)
const capped = ref(false)
let measuring = false

function measure() {
  const el = field.value
  if (!props.autosize || !el || measuring) return
  measuring = true
  const cs = getComputedStyle(el)
  const fs = parseFloat(cs.fontSize) || 16
  const lh = parseFloat(cs.lineHeight) || fs * 1.2
  const pv = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0)
  // Con la altura automática, scrollHeight es la altura del contenido (nunca menor que `rows`)
  el.style.setProperty('--_autoh', 'auto')
  const need = el.scrollHeight
  const cap = maxRowsN.value === null ? Infinity : maxRowsN.value * lh + pv
  const h = Math.max(Math.min(need, cap), rowsN.value * lh + pv)
  el.style.setProperty('--_autoh', `${h}px`)
  autoH.value = h
  capped.value = need > cap + 0.5
  measuring = false
}

let resizeObserver = null
onMounted(() => {
  nextTick(measure)
  if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) document.fonts.ready.then(measure)
  if (typeof ResizeObserver !== 'undefined' && field.value) {
    // Cualquier cambio de tamaño (ancho, relleno o interlineado por el tema) vuelve a medir; medir de
    // nuevo da la misma altura, así que el ciclo termina solo.
    resizeObserver = new ResizeObserver(() => measure())
    resizeObserver.observe(field.value)
  }
})
onBeforeUnmount(() => resizeObserver?.disconnect())
watch([() => props.modelValue, () => props.autosize, () => props.rows, () => props.maxRows, () => props.size, () => props.density], () => nextTick(measure), { flush: 'post' })
watch(() => props.autosize, (on) => {
  if (!on) {
    autoH.value = null
    capped.value = false
    field.value?.style.removeProperty('--_autoh')
  }
})

// ---------- Contador y aviso hablado (solo al cambiar de nivel) ----------
const length = computed(() => props.modelValue.length)
const level = computed(() => {
  if (maxlength.value === null) return 'ok'
  if (length.value >= maxlength.value) return 'limit'
  if (length.value >= Math.ceil(maxlength.value * 0.9)) return 'near'
  return 'ok'
})
const liveText = ref('')
watch(level, (l) => {
  liveText.value = l === 'ok' || !props.counterText ? '' : String(props.counterText(l, maxlength.value))
})

// ---------- Marcado ----------
const classes = computed(() => [
  'g-textarea',
  `g-textarea--variant-${props.variant}`,
  `g-textarea--size-${props.size}`,
  `g-textarea--density-${props.density}`,
  props.color && `g-textarea--color-${props.color}`,
  props.rounded && `g-textarea--rounded-${props.rounded}`,
  `g-textarea--resize-${resizeEff.value}`,
  {
    'g-textarea--block': props.block,
    'g-textarea--autosize': props.autosize,
    'is-capped': props.autosize && capped.value,
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
  id: fieldId.value,
  rows: rowsN.value,
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
  nextTick(measure)
}

// Nuestro manejador va PRIMERO: así una escucha `@input` del consumidor ya ve el modelo actualizado,
// igual que con un <textarea v-model> nativo.
const fieldBindings = computed(() => mergeProps({ onInput }, { ...fieldAttrs.value, ...controlled.value }))

// Avisos solo en desarrollo. `process` puede no existir (UMD en navegador): se comprueba antes de leerlo.
const isDev = typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production'
if (isDev) {
  if (!hasLabel.value && !attrs['aria-label'] && !attrs['aria-labelledby']) {
    console.warn('[Grana] <GTextarea> necesita label, slot label, aria-label o aria-labelledby para tener un nombre accesible.')
  }
  if (props.counter && maxlength.value === null) {
    console.warn('[Grana] <GTextarea counter> necesita maxlength para mostrar el contador.')
  }
  if (!(Number.isInteger(props.rows) && props.rows >= 1)) {
    console.warn('[Grana] <GTextarea rows> debe ser un entero mayor o igual que 1; se usa 1.')
  }
  if (props.maxRows !== undefined && !props.autosize) {
    console.warn('[Grana] <GTextarea maxRows> solo tiene efecto con autosize.')
  }
  if (props.autosize && props.maxRows !== undefined && !(Number.isInteger(props.maxRows) && props.maxRows >= rowsN.value)) {
    console.warn('[Grana] <GTextarea maxRows> debe ser un entero mayor o igual que rows; se usa rows.')
  }
}
</script>

<template>
  <div v-bind="rootAttrs" :class="classes">
    <label v-if="hasLabel" class="g-textarea__label" :for="fieldId">
      <slot name="label">{{ label }}</slot>
      <span v-if="required" class="g-textarea__required" aria-hidden="true">*</span>
    </label>
    <div class="g-textarea__control">
      <textarea ref="field" v-bind="fieldBindings" class="g-textarea__field" :style="autosize && autoH !== null ? { '--_autoh': `${autoH}px` } : undefined" />
      <span v-if="loading" class="g-textarea__loader" aria-hidden="true" />
    </div>
    <div v-if="hasHint || showCounter" class="g-textarea__messages">
      <span v-if="hasHint" :id="hintId" class="g-textarea__hint"><slot name="hint">{{ hint }}</slot></span>
      <span v-if="showCounter" class="g-textarea__counter" aria-hidden="true">{{ length }}/{{ maxlength }}</span>
    </div>
    <span class="g-textarea__count-live" aria-live="polite">{{ liveText }}</span>
    <div :id="errorId" class="g-textarea__error" aria-live="polite"><template v-if="invalid"><slot name="error">{{ error }}</slot></template></div>
  </div>
</template>
