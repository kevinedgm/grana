<script setup>
// GCheckboxGroup · grupo de casillas con maestra y conteo (dueño: bruno)
// Contrato: design/contracts/checkbox.md · Estructura: design/lab/checkbox/r01/ · Estilo: GCheckboxGroup.css (coco)
import { computed, defineComponent, mergeProps, provide, reactive, ref, useAttrs, useId, useSlots } from 'vue'
import { oneOf } from '../../utils/oneOf.js'
import GIcon from '../GIcon/GIcon.vue'
import GCheckbox from '../GCheckbox/GCheckbox.vue'
import { GROUP_KEY } from './groupKey.js'
import { messageIcon, useFormField } from '../GForm/formContext.js'

defineOptions({ name: 'GCheckboxGroup', inheritAttrs: false })

// La casilla maestra está dentro del grupo pero no es una hija: este ámbito corta la herencia del grupo.
const MasterScope = defineComponent({
  setup(_, { slots }) {
    provide(GROUP_KEY, null)
    return () => slots.default && slots.default()
  }
})

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  label: { type: String, default: undefined },
  hint: { type: String, default: undefined },
  error: { type: String, default: undefined },
  warning: { type: String, default: undefined },
  valid: { type: String, default: undefined },
  required: Boolean,
  mark: { type: Boolean, default: undefined },
  // Clave del grupo en `errors` de GForm y name por defecto de sus casillas (C11)
  name: { type: String, default: undefined },
  selectAll: Boolean,
  selectAllLabel: { type: String, default: undefined },
  countText: { type: Function, default: undefined },
  size: { type: String, default: 'md', validator: oneOf(['xs', 'sm', 'md', 'lg', 'xl']) },
  // density, disabled y error sin valor por defecto: la prop explícita gana al contexto de GForm (form.md §2)
  density: { type: String, default: undefined, validator: oneOf(['default', 'comfortable', 'compact']) },
  color: { type: String, default: 'brand', validator: oneOf(['brand', 'accent', 'neutral', 'success', 'warning', 'danger', 'info']) },
  layout: { type: String, default: 'default', validator: oneOf(['default', 'card', 'chip']) },
  disabled: { type: Boolean, default: undefined },
  id: { type: String, default: undefined }
})

const emit = defineEmits(['update:modelValue'])

const attrs = useAttrs()
const slots = useSlots()

const uid = useId()
const groupId = computed(() => props.id || `g-checkbox-group-${uid}`)
const hintId = computed(() => `${groupId.value}-hint`)

const rootEl = ref(null)
// El destino del resumen y del foco es la primera casilla habilitada de la lista
const firstControl = () => rootEl.value?.querySelector('.g-checkbox-group__list input:not(:disabled)') || null
const ff = useFormField({
  id: groupId,
  name: () => props.name,
  error: () => props.error,
  warning: () => props.warning,
  valid: () => props.valid,
  required: () => props.required,
  disabled: () => props.disabled,
  density: () => props.density,
  mark: () => props.mark,
  trigger: 'change',
  control: firstControl,
  root: rootEl
})
const density = ff.density
const isDisabled = ff.disabled
const message = ff.message

const hasLabel = computed(() => Boolean(props.label || slots.label))
const hasHint = computed(() => Boolean(props.hint || slots.hint))

// Hijas registradas (en orden de montaje = orden del documento).
const items = reactive(new Map())
function register(id, item) {
  items.set(id, item)
}
function unregister(id) {
  items.delete(id)
}
const enabled = computed(() => (isDisabled.value ? [] : [...items.entries()].filter(([, item]) => !item.isDisabled())))
const enabledValues = computed(() => enabled.value.map(([, item]) => item.value))
const enabledIds = computed(() => enabled.value.map(([id]) => id))

function toggle(value, checked) {
  const list = props.modelValue
  if (checked) {
    if (!list.includes(value)) emit('update:modelValue', [...list, value])
  } else if (list.includes(value)) {
    emit('update:modelValue', list.filter((v) => v !== value))
  }
}

provide(GROUP_KEY, {
  model: computed(() => props.modelValue),
  size: computed(() => props.size),
  density,
  color: computed(() => props.color),
  layout: computed(() => props.layout),
  disabled: isDisabled,
  name: computed(() => props.name),
  toggle,
  register,
  unregister
})

// Casilla maestra: se deriva de las hijas HABILITADAS.
const selectedCount = computed(() => enabledValues.value.filter((v) => props.modelValue.includes(v)).length)
const total = computed(() => enabledValues.value.length)
const allChecked = computed(() => total.value > 0 && selectedCount.value === total.value)
const someChecked = computed(() => selectedCount.value > 0 && selectedCount.value < total.value)
const showMaster = computed(() => props.selectAll && Boolean(props.selectAllLabel))
const controls = computed(() => (enabledIds.value.length ? enabledIds.value.join(' ') : undefined))

function toggleAll(checked) {
  const values = enabledValues.value
  if (checked) {
    emit('update:modelValue', [...props.modelValue, ...values.filter((v) => !props.modelValue.includes(v))])
  } else {
    emit('update:modelValue', props.modelValue.filter((v) => !values.includes(v)))
  }
}

const countString = computed(() => (props.countText ? props.countText(selectedCount.value, total.value) : ''))
const showHead = computed(() => showMaster.value || Boolean(props.countText))

const describedBy = computed(() => {
  const ids = [attrs['aria-describedby'], hasHint.value && hintId.value, message.value && ff.messageId.value].filter(Boolean)
  return ids.length ? ids.join(' ') : undefined
})

const classes = computed(() => [
  'g-checkbox-group',
  `g-checkbox-group--layout-${props.layout}`,
  {
    'is-disabled': isDisabled.value,
    'is-invalid': ff.invalid.value,
    'is-warning': ff.ownMessage.value?.type === 'warning',
    'is-valid': ff.ownMessage.value?.type === 'valid'
  }
])
// Los manejadores del contexto van PRIMERO; el resto de atributos y escuchas del consumidor, al <fieldset>
const rootBindings = computed(() => mergeProps(ff.handlers, attrs))

// Avisos solo en desarrollo. `process` puede no existir (UMD en navegador): se comprueba antes de leerlo.
const isDev = typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production'
if (isDev) {
  if (!hasLabel.value && !attrs['aria-label'] && !attrs['aria-labelledby']) {
    console.warn('[Grana] <GCheckboxGroup> necesita label, slot label, aria-label o aria-labelledby para tener un nombre accesible.')
  }
  if (props.selectAll && !props.selectAllLabel) {
    console.warn('[Grana] <GCheckboxGroup select-all> necesita selectAllLabel para mostrar la casilla maestra.')
  }
}
</script>

<template>
  <fieldset ref="rootEl" v-bind="rootBindings" :id="groupId" :class="classes" :disabled="isDisabled || undefined" :aria-describedby="describedBy">
    <legend v-if="hasLabel" class="g-checkbox-group__label"><slot name="label">{{ label }}</slot><template v-if="ff.mark.value === 'optional' && ff.markText.value">{{ ' ' }}<span class="g-checkbox-group__optional">{{ ff.markText.value }}</span></template><span v-if="ff.mark.value === 'required'" class="g-checkbox-group__required" aria-hidden="true">*</span></legend>
    <div v-if="showHead" class="g-checkbox-group__head">
      <MasterScope v-if="showMaster">
        <GCheckbox
          layout="default"
          :size="size"
          :density="density"
          :color="color"
          :model-value="allChecked"
          :indeterminate="someChecked"
          :label="selectAllLabel"
          :disabled="isDisabled || total === 0"
          :aria-controls="controls"
          @update:model-value="toggleAll"
        />
      </MasterScope>
      <span v-if="countText" class="g-checkbox-group__count" aria-live="polite">{{ countString }}</span>
    </div>
    <div class="g-checkbox-group__list"><slot /></div>
    <div v-if="hasHint" :id="hintId" class="g-checkbox-group__hint"><slot name="hint">{{ hint }}</slot></div>
    <div :id="ff.messageId.value" class="g-checkbox-group__message" :aria-live="ff.live.value"><template v-if="message"><GIcon class="g-checkbox-group__message-icon" :name="messageIcon(message.type)" /><span v-if="message.prefix" class="g-checkbox-group__message-type">{{ message.prefix }}</span><slot v-if="message.type === 'error'" name="error">{{ message.text }}</slot><template v-else>{{ message.text }}</template></template></div>
  </fieldset>
</template>
