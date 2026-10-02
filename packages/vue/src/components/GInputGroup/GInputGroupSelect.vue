<script setup>
// GInputGroupSelect · parte de elección de un GInputGroup: <select> nativo sin caja propia (dueño: bruno)
// Contrato: design/contracts/form.md §13 (#178: nativo para que el navegador pueda autocompletarlo, p. ej. tel-country-code)
// Solo lectura: un <select> no admite readonly; se pinta <input type="text" readonly> con el TEXTO de la opción
// elegida (enfocable y seleccionable, #165) más un <input type="hidden"> con el valor.
import { computed, mergeProps, ref, useAttrs } from 'vue'
import GIcon from '../GIcon/GIcon.vue'
import { isDev } from '../GForm/formContext.js'
import { useInputGroupPart } from './inputGroupContext.js'

defineOptions({ name: 'GInputGroupSelect', inheritAttrs: false })

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  name: { type: String, default: undefined },
  partLabel: { type: String, default: undefined },
  principal: Boolean,
  required: { type: Boolean, default: undefined },
  error: { type: String, default: undefined },
  options: { type: Array, default: () => [] },
  placeholder: { type: String, default: undefined },
  id: { type: String, default: undefined }
})
const emit = defineEmits(['update:modelValue'])

const attrs = useAttrs()
const control = ref(null)
const part = ref(null)
const p = useInputGroupPart('GInputGroupSelect', 'select', props, { control, part })

// Opciones planas o grupos { label, options } (<optgroup>), como GSelect
const isGroup = (o) => o && typeof o === 'object' && Array.isArray(o.options)
const flat = computed(() => props.options.flatMap((o) => (isGroup(o) ? o.options : [o])))
const current = computed(() => String(props.modelValue ?? ''))
const selectedLabel = computed(() => {
  const o = flat.value.find((x) => String(x.value) === current.value)
  return o ? String(o.label ?? o.value) : ''
})
if (isDev) {
  const values = flat.value.map((o) => String(o.value))
  if (new Set(values).size !== values.length) console.warn('[Grana GInputGroup] options con valores repetidos en GInputGroupSelect.')
}

const partAttrs = computed(() => ({ class: attrs.class, style: attrs.style }))
const controlAttrs = computed(() => {
  const { class: _c, style: _s, ...rest } = attrs
  return rest
})
const partClasses = computed(() => ['g-input-group__part', 'g-input-group__part--select', { 'is-invalid': p.invalid.value }])
const readonly = computed(() => Boolean(p.ctx) && p.ff.readonly.value)

function onChange(event) {
  emit('update:modelValue', event.target.value)
}
const common = computed(() => ({
  id: p.controlId.value,
  required: p.required.value || undefined,
  disabled: p.ff.disabled.value || undefined,
  'aria-labelledby': p.labelledBy.value,
  'aria-describedby': p.describedBy(controlAttrs.value['aria-describedby']),
  'aria-invalid': p.invalid.value ? 'true' : undefined
}))
// Manejadores del contexto y el propio PRIMERO; las escuchas del consumidor después (C9)
const selectBindings = computed(() => mergeProps(p.ff.handlers, { onChange }, { ...controlAttrs.value, name: props.name, ...common.value }))
const readonlyBindings = computed(() => {
  const { autocomplete: _a, ...rest } = controlAttrs.value
  // size = caracteres del texto elegido: como el <select>, la parte mide su contenido (sin size, el ancho intrínseco de
  // un <input> es de ~20 caracteres y desborda la caja en contenedores estrechos)
  return mergeProps(p.ff.handlers, { ...rest, ...common.value, type: 'text', readonly: true, value: selectedLabel.value, size: Math.max(1, selectedLabel.value.length) })
})
</script>

<template>
  <span v-if="p.ctx" ref="part" v-bind="partAttrs" :class="partClasses">
    <span v-if="p.hasName.value" :id="p.nameId.value" class="g-input-group__part-name">{{ partLabel }}</span>
    <template v-if="readonly">
      <input ref="control" v-bind="readonlyBindings" class="g-input-group__control">
      <input type="hidden" :name="name" :value="current">
    </template>
    <template v-else>
      <select ref="control" v-bind="selectBindings" class="g-input-group__control">
        <option v-if="placeholder !== undefined" value="" :disabled="p.required.value || undefined" :selected="current === '' || undefined">{{ placeholder }}</option>
        <template v-for="(o, i) in options" :key="isGroup(o) ? `g${i}` : String(o.value)">
          <optgroup v-if="isGroup(o)" :label="o.label">
            <option v-for="c in o.options" :key="String(c.value)" :value="String(c.value)" :disabled="c.disabled || undefined" :selected="String(c.value) === current || undefined">{{ c.label ?? c.value }}</option>
          </optgroup>
          <option v-else :value="String(o.value)" :disabled="o.disabled || undefined" :selected="String(o.value) === current || undefined">{{ o.label ?? o.value }}</option>
        </template>
      </select>
      <GIcon class="g-input-group__select-icon" name="chevron-down" />
    </template>
  </span>
  <select v-else ref="control" v-bind="{ ...selectBindings, ...partAttrs }">
    <option v-if="placeholder !== undefined" value="">{{ placeholder }}</option>
    <option v-for="o in flat" :key="String(o.value)" :value="String(o.value)" :selected="String(o.value) === current || undefined">{{ o.label ?? o.value }}</option>
  </select>
</template>
