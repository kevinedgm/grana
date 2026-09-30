<script setup>
// GCheckbox · lógica de la casilla (dueño: bruno)
// Contrato: design/contracts/checkbox.md · Estructura: design/lab/checkbox/r01/ · Estilo: GCheckbox.css (coco)
import { computed, inject, mergeProps, nextTick, onBeforeUnmount, onMounted, ref, useAttrs, useId, useSlots, watch } from 'vue'
import { oneOf } from '../../utils/oneOf.js'
import GIcon from '../GIcon/GIcon.vue'
import { GROUP_KEY } from '../GCheckboxGroup/groupKey.js'

defineOptions({ name: 'GCheckbox', inheritAttrs: false })

const props = defineProps({
  modelValue: { type: [Boolean, Array], default: false },
  value: { type: [String, Number], default: undefined },
  indeterminate: Boolean,
  // size, density, color, layout y disabled quedan sin valor por defecto para saber si el consumidor los dio:
  // si no, los hereda del grupo y, si no hay grupo, toman el valor del contrato.
  layout: { type: String, default: undefined, validator: oneOf(['default', 'card', 'chip']) },
  size: { type: String, default: undefined, validator: oneOf(['xs', 'sm', 'md', 'lg', 'xl']) },
  density: { type: String, default: undefined, validator: oneOf(['default', 'comfortable', 'compact']) },
  color: { type: String, default: undefined, validator: oneOf(['brand', 'accent', 'neutral', 'success', 'warning', 'danger', 'info']) },
  disabled: { type: Boolean, default: undefined },
  readonly: Boolean,
  required: Boolean,
  label: { type: String, default: undefined },
  hint: { type: String, default: undefined },
  error: { type: String, default: undefined },
  id: { type: String, default: undefined }
})

// Solo estos dos eventos se declaran: el resto llega al <input> nativo por $attrs.
const emit = defineEmits(['update:modelValue', 'update:indeterminate'])

const attrs = useAttrs()
const slots = useSlots()
const group = inject(GROUP_KEY, null)
// Solo las casillas con `value` dentro de un grupo son hijas; la maestra del grupo no tiene `value`.
const inGroup = computed(() => Boolean(group) && props.value !== undefined)

const uid = useId()
const inputId = computed(() => props.id || `g-checkbox-${uid}`)
const labelId = computed(() => `${inputId.value}-label`)
const hintId = computed(() => `${inputId.value}-hint`)
const metaId = computed(() => `${inputId.value}-meta`)
const errorId = computed(() => `${inputId.value}-error`)

const layout = computed(() => props.layout ?? group?.layout.value ?? 'default')
const size = computed(() => props.size ?? group?.size.value ?? 'md')
const density = computed(() => props.density ?? group?.density.value ?? 'default')
const color = computed(() => props.color ?? group?.color.value ?? 'brand')
const isDisabled = computed(() => props.disabled ?? group?.disabled.value ?? false)

const invalid = computed(() => Boolean(props.error))
const hasLabel = computed(() => Boolean(props.label || slots.label))
const hasHint = computed(() => Boolean(props.hint || slots.hint))
const isCard = computed(() => layout.value === 'card')
const hasIcon = computed(() => isCard.value && Boolean(slots.icon))
const hasMeta = computed(() => isCard.value && Boolean(slots.meta))

// Estado marcado: del grupo, de un arreglo (si hay `value`) o booleano.
const checked = computed(() => {
  if (inGroup.value) return group.model.value.includes(props.value)
  if (props.value !== undefined) return Array.isArray(props.modelValue) && props.modelValue.includes(props.value)
  return props.modelValue === true
})

const input = ref(null)
// El <input> nativo puede divergir de las props tras un clic; se vuelve a alinear con lo que digan.
function sync() {
  if (!input.value) return
  input.value.checked = checked.value
  input.value.indeterminate = props.indeterminate
}
onMounted(sync)
watch([checked, () => props.indeterminate], sync, { flush: 'post' })

// class y style van a la raíz; todo lo demás, al <input>.
const rootAttrs = computed(() => ({ class: attrs.class, style: attrs.style }))
const inputAttrs = computed(() => {
  const { class: _class, style: _style, ...rest } = attrs
  return rest
})

const classes = computed(() => [
  'g-checkbox',
  `g-checkbox--layout-${layout.value}`,
  `g-checkbox--size-${size.value}`,
  `g-checkbox--density-${density.value}`,
  `g-checkbox--color-${color.value}`,
  {
    'is-disabled': isDisabled.value,
    'is-readonly': props.readonly,
    'is-invalid': invalid.value
  }
])

const labelledBy = computed(() => (hasLabel.value ? [labelId.value, hasMeta.value && metaId.value].filter(Boolean).join(' ') : undefined))
const describedBy = computed(() => {
  const ids = [attrs['aria-describedby'], hasHint.value && hintId.value, invalid.value && errorId.value].filter(Boolean)
  return ids.length ? ids.join(' ') : undefined
})

// Atributos que controla el componente; se aplican después de los del consumidor y ganan.
const controlled = computed(() => ({
  id: inputId.value,
  checked: checked.value,
  value: props.value,
  disabled: isDisabled.value || undefined,
  required: props.required || undefined,
  'aria-readonly': props.readonly ? 'true' : undefined,
  'aria-invalid': invalid.value ? 'true' : undefined,
  'aria-labelledby': labelledBy.value ?? attrs['aria-labelledby'],
  'aria-describedby': describedBy.value
}))

// readonly: el <input type="checkbox"> no admite `readonly`; se cancela el clic (también el de Espacio).
function onClick(event) {
  if (props.readonly) event.preventDefault()
}

function onChange(event) {
  const next = event.target.checked
  if (inGroup.value) {
    group.toggle(props.value, next)
  } else if (props.value !== undefined) {
    const list = Array.isArray(props.modelValue) ? props.modelValue : []
    emit('update:modelValue', next ? [...list, props.value] : list.filter((v) => v !== props.value))
  } else {
    emit('update:modelValue', next)
  }
  if (props.indeterminate) emit('update:indeterminate', false)
  nextTick(sync)
}

// Nuestros manejadores van PRIMERO: así una escucha `@change` del consumidor ya ve el modelo actualizado,
// igual que con un <input v-model> nativo.
const fieldBindings = computed(() => mergeProps({ onClick, onChange }, { ...inputAttrs.value, ...controlled.value }))

// Registro en el grupo (solo casillas con `value`).
onMounted(() => {
  if (inGroup.value) group.register(inputId.value, { value: props.value, isDisabled: () => isDisabled.value })
})
onBeforeUnmount(() => {
  if (group) group.unregister(inputId.value)
})

// Avisos solo en desarrollo. `process` puede no existir (UMD en navegador): se comprueba antes de leerlo.
const isDev = typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production'
if (isDev) {
  if (!hasLabel.value && !attrs['aria-label'] && !attrs['aria-labelledby']) {
    console.warn('[Grana] <GCheckbox> necesita label, slot label, aria-label o aria-labelledby para tener un nombre accesible.')
  }
  if (group && props.value === undefined) {
    console.warn('[Grana] <GCheckbox> dentro de un <GCheckboxGroup> necesita `value`.')
  }
}
</script>

<template>
  <div v-bind="rootAttrs" :class="classes">
    <label class="g-checkbox__row" :for="inputId">
      <span class="g-checkbox__box">
        <input ref="input" v-bind="fieldBindings" class="g-checkbox__input" type="checkbox">
        <GIcon class="g-checkbox__mark g-checkbox__check" name="check" />
        <GIcon class="g-checkbox__mark g-checkbox__dash" name="minus" />
      </span>
      <span v-if="hasIcon" class="g-checkbox__icon" aria-hidden="true"><slot name="icon" /></span>
      <span class="g-checkbox__text">
        <span v-if="hasLabel" :id="labelId" class="g-checkbox__label"><GIcon v-if="layout === 'chip'" class="g-checkbox__chip-mark" name="check" /><slot name="label">{{ label }}</slot><span v-if="required" class="g-checkbox__required" aria-hidden="true">*</span></span>
        <span v-if="hasHint" :id="hintId" class="g-checkbox__hint"><slot name="hint">{{ hint }}</slot></span>
      </span>
      <span v-if="hasMeta" :id="metaId" class="g-checkbox__meta"><slot name="meta" /></span>
    </label>
    <div :id="errorId" class="g-checkbox__error" aria-live="polite"><template v-if="invalid"><GIcon class="g-checkbox__error-icon" name="triangle-alert" /><slot name="error">{{ error }}</slot></template></div>
  </div>
</template>
