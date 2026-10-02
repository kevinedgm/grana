<script setup>
// GInputGroupText · texto fijo de un GInputGroup: separador («/», «a») o unidad («mmHg», «años») (dueño: bruno)
// Contrato: design/contracts/form.md §13 · Estilo: GInputGroup.css (coco)
// Con `label`: el texto visible es aria-hidden y su expansión oculta (__text-label, hermano) entra en la descripción
// de cada parte. Con `decorative`: aria-hidden y nada en la descripción. Sin ninguno: el texto visible entra en la
// descripción. Pulsarlo enfoca la parte siguiente (o la anterior si es el último).
import { computed, onBeforeUnmount, ref, useId } from 'vue'
import { useInputGroup } from './inputGroupContext.js'

defineOptions({ name: 'GInputGroupText', inheritAttrs: false })

const props = defineProps({
  text: { type: String, default: undefined },
  label: { type: String, default: undefined },
  decorative: Boolean,
  id: { type: String, default: undefined }
})

const ctx = useInputGroup('GInputGroupText')
const uid = useId()
const textId = computed(() => props.id || `g-input-group-text-${uid}`)
const el = ref(null)
const descId = computed(() => (props.decorative ? null : textId.value))
if (ctx) {
  const off = ctx.register({ uid, kind: 'text', el: () => el.value, controlId: () => null, principal: () => false, partLabel: () => undefined, descId: () => descId.value })
  onBeforeUnmount(off)
}
function onClick() {
  if (ctx && el.value) ctx.focusNear(el.value)
}
</script>

<template>
  <span v-if="decorative" ref="el" v-bind="$attrs" class="g-input-group__part g-input-group__part--text" aria-hidden="true" @click="onClick"><slot>{{ text }}</slot></span>
  <template v-else-if="label">
    <span ref="el" v-bind="$attrs" class="g-input-group__part g-input-group__part--text" aria-hidden="true" @click="onClick"><slot>{{ text }}</slot></span>
    <span :id="textId" class="g-input-group__text-label">{{ label }}</span>
  </template>
  <span v-else :id="textId" ref="el" v-bind="$attrs" class="g-input-group__part g-input-group__part--text" @click="onClick"><slot>{{ text }}</slot></span>
</template>
