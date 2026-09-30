<script setup>
// GCheckboxGroup · grupo de casillas con maestra y conteo (dueño: bruno)
// Contrato: design/contracts/checkbox.md · Estructura: design/lab/checkbox/r01/ · Estilo: GCheckboxGroup.css (coco)
import { computed, defineComponent, provide, reactive, useAttrs, useId, useSlots } from 'vue'
import { oneOf } from '../../utils/oneOf.js'
import GCheckbox from '../GCheckbox/GCheckbox.vue'
import { GROUP_KEY } from './groupKey.js'

defineOptions({ name: 'GCheckboxGroup' })

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
  selectAll: Boolean,
  selectAllLabel: { type: String, default: undefined },
  countText: { type: Function, default: undefined },
  size: { type: String, default: 'md', validator: oneOf(['xs', 'sm', 'md', 'lg', 'xl']) },
  density: { type: String, default: 'default', validator: oneOf(['default', 'comfortable', 'compact']) },
  color: { type: String, default: 'brand', validator: oneOf(['brand', 'accent', 'neutral', 'success', 'warning', 'danger', 'info']) },
  layout: { type: String, default: 'default', validator: oneOf(['default', 'card', 'chip']) },
  disabled: Boolean,
  id: { type: String, default: undefined }
})

const emit = defineEmits(['update:modelValue'])

const attrs = useAttrs()
const slots = useSlots()

const uid = useId()
const groupId = computed(() => props.id || `g-checkbox-group-${uid}`)
const hintId = computed(() => `${groupId.value}-hint`)
const errorId = computed(() => `${groupId.value}-error`)

const hasLabel = computed(() => Boolean(props.label || slots.label))
const hasHint = computed(() => Boolean(props.hint || slots.hint))
const hasError = computed(() => Boolean(props.error))

// Hijas registradas (en orden de montaje = orden del documento).
const items = reactive(new Map())
function register(id, item) {
  items.set(id, item)
}
function unregister(id) {
  items.delete(id)
}
const enabled = computed(() => (props.disabled ? [] : [...items.entries()].filter(([, item]) => !item.isDisabled())))
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
  density: computed(() => props.density),
  color: computed(() => props.color),
  layout: computed(() => props.layout),
  disabled: computed(() => props.disabled),
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
  const ids = [attrs['aria-describedby'], hasHint.value && hintId.value, hasError.value && errorId.value].filter(Boolean)
  return ids.length ? ids.join(' ') : undefined
})

const classes = computed(() => ['g-checkbox-group', `g-checkbox-group--layout-${props.layout}`])

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
  <fieldset :id="groupId" :class="classes" :disabled="disabled || undefined" :aria-describedby="describedBy">
    <legend v-if="hasLabel" class="g-checkbox-group__label"><slot name="label">{{ label }}</slot></legend>
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
          :disabled="disabled || total === 0"
          :aria-controls="controls"
          @update:model-value="toggleAll"
        />
      </MasterScope>
      <span v-if="countText" class="g-checkbox-group__count" aria-live="polite">{{ countString }}</span>
    </div>
    <div class="g-checkbox-group__list"><slot /></div>
    <div v-if="hasHint" :id="hintId" class="g-checkbox-group__hint"><slot name="hint">{{ hint }}</slot></div>
    <div :id="errorId" class="g-checkbox-group__error" aria-live="polite"><template v-if="hasError"><slot name="error">{{ error }}</slot></template></div>
  </fieldset>
</template>
