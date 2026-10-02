<script setup>
// GFormSection · sección fija de un formulario (una idea) (dueño: bruno)
// Contrato: design/contracts/form.md §3 (#161) · Estilo: GFormSection.css (coco)
// <section> SIN aria-labelledby (no es punto de referencia); el título hN da la navegación.
// Slot lead (#203): <span class="g-form-section__lead" aria-hidden="true"> primer hijo de __heading, solo con el slot,
// inmediatamente antes del hN (el CSS de coco usa `__lead + __title`: no intercalar nada). Decorativo; un GIcon con label dentro avisa por sí mismo (antecesor aria-hidden, icons.md §2.4).
import { computed, inject, provide, unref, useAttrs, useSlots } from 'vue'
import GBadge from '../GBadge/GBadge.vue'
import { formKey, isDev, sectionKey } from '../GForm/formContext.js'

defineOptions({ name: 'GFormSection', inheritAttrs: false })

const props = defineProps({
  title: { type: String, default: undefined },
  description: { type: String, default: undefined },
  headingLevel: { type: Number, default: undefined, validator: (v) => Number.isInteger(v) && v >= 2 && v <= 6 },
  optional: Boolean
})

const attrs = useAttrs()
const slots = useSlots()
const form = inject(formKey, null)

// Reservadas para la Fase 3: no se aceptan (ni llegan al DOM)
const RESERVED = ['mode', 'open', 'added', 'headerPlacement', 'header-placement', 'labels', 'onUpdate:open', 'onUpdate:added']
const rootAttrs = computed(() => Object.fromEntries(Object.entries(attrs).filter(([k]) => !RESERVED.includes(k))))

const level = computed(() => props.headingLevel ?? unref(form?.headingLevel) ?? 3)
const badgeText = computed(() => (props.optional ? unref(form?.labels)?.sectionOptional : undefined))

// Dentro de una sección opcional no hay «(opcional)» en sus campos: lo dice la sección
provide(sectionKey, { optional: computed(() => props.optional) })

if (isDev) {
  const used = RESERVED.filter((k) => attrs[k] !== undefined)
  if (used.length) console.warn(`[Grana GFormSection] ${used.join(', ')} están reservadas para la Fase 3 y se ignoran.`)
  if (!props.title && !slots.title) console.warn('[Grana GFormSection] necesita title o el slot title.')
  if (props.optional && !badgeText.value) {
    if (form && typeof form.warnOnce === 'function') form.warnOnce('label-sectionOptional', 'falta labels.sectionOptional: la sección opcional va sin insignia.')
    else console.warn('[Grana GFormSection] optional necesita labels.sectionOptional de GForm para la insignia.')
  }
}
</script>

<template>
  <section v-bind="rootAttrs" class="g-form-section" :class="{ 'g-form-section--optional': optional }">
    <div class="g-form-section__header">
      <div class="g-form-section__heading">
        <span v-if="slots.lead" class="g-form-section__lead" aria-hidden="true"><slot name="lead" /></span>
        <component :is="`h${level}`" class="g-form-section__title"><slot name="title">{{ title }}</slot></component>
        <GBadge v-if="optional && badgeText" size="sm" variant="soft" color="neutral">{{ badgeText }}</GBadge>
      </div>
      <p v-if="description || slots.description" class="g-form-section__description"><slot name="description">{{ description }}</slot></p>
      <div v-if="slots.actions" class="g-form-section__actions"><slot name="actions" /></div>
      <div v-if="slots.help" class="g-form-section__help"><slot name="help" /></div>
    </div>
    <div class="g-form-section__body"><slot /></div>
  </section>
</template>
