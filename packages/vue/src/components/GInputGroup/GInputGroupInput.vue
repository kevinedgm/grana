<script setup>
// GInputGroupInput · parte de texto de un GInputGroup: <input> sin caja propia (dueño: bruno)
// Contrato: design/contracts/form.md §13 · Estilo: GInputGroup.css (coco)
import { computed, mergeProps, ref, useAttrs } from 'vue'
import { oneOf } from '../../utils/oneOf.js'
import { isDev } from '../GForm/formContext.js'
import { useInputGroupPart } from './inputGroupContext.js'

defineOptions({ name: 'GInputGroupInput', inheritAttrs: false })

const props = defineProps({
  modelValue: { type: String, default: '' },
  name: { type: String, default: undefined },
  partLabel: { type: String, default: undefined },
  principal: Boolean,
  required: { type: Boolean, default: undefined },
  error: { type: String, default: undefined },
  type: { type: String, default: 'text', validator: oneOf(['text', 'tel', 'email', 'url', 'search']) },
  chars: { type: Number, default: undefined },
  id: { type: String, default: undefined }
})
const emit = defineEmits(['update:modelValue'])

const attrs = useAttrs()
const control = ref(null)
const part = ref(null)
const p = useInputGroupPart('GInputGroupInput', 'input', props, { control, part })

const charsOk = computed(() => Number.isInteger(props.chars) && props.chars > 0)
if (isDev && props.chars !== undefined && !charsOk.value) console.warn(`[Grana GInputGroup] chars debe ser un entero positivo, no «${props.chars}».`)

// class y style van a la parte; el resto (autocomplete, inputmode, placeholder, maxlength, pattern, escuchas), al <input>
const partAttrs = computed(() => ({ class: attrs.class, style: attrs.style }))
const inputAttrs = computed(() => {
  const { class: _c, style: _s, ...rest } = attrs
  return rest
})
const partClasses = computed(() => ['g-input-group__part', 'g-input-group__part--input', { 'g-input-group__part--chars': charsOk.value, 'is-invalid': p.invalid.value }])
const partStyle = computed(() => (charsOk.value ? { '--_input-group-chars': String(props.chars) } : undefined))

function onInput(event) {
  emit('update:modelValue', event.target.value)
}
// Manejadores del contexto y el propio PRIMERO; las escuchas del consumidor después (C9)
const bindings = computed(() => mergeProps(p.ff.handlers, { onInput }, {
  ...inputAttrs.value,
  id: p.controlId.value,
  name: props.name,
  type: props.type,
  value: props.modelValue,
  required: p.required.value || undefined,
  readonly: p.ff.readonly.value || undefined,
  disabled: p.ff.disabled.value || undefined,
  'aria-labelledby': p.labelledBy.value,
  'aria-describedby': p.describedBy(inputAttrs.value['aria-describedby']),
  'aria-invalid': p.invalid.value ? 'true' : undefined
}))
</script>

<template>
  <span v-if="p.ctx" ref="part" v-bind="partAttrs" :class="partClasses" :style="partStyle"><span v-if="p.hasName.value" :id="p.nameId.value" class="g-input-group__part-name">{{ partLabel }}</span><input ref="control" v-bind="bindings" class="g-input-group__control"></span>
  <input v-else ref="control" v-bind="{ ...bindings, ...partAttrs }">
</template>
