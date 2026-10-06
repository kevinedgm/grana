<script setup>
// GFieldGroup · una pregunta con varias partes y un solo mensaje (dueño: bruno)
// Contrato: design/contracts/form.md §5 (#160, r02: #179) · Estilo: GFieldGroup.css (coco)
// <fieldset> + <legend>; aria-invalid en las partes, nunca en el fieldset (no se admite en el rol group, ARIA 1.3).
// r02: las partes se reparten en una GFormRow compuesta (mismo motor de líneas; `keep` pasa a esa fila). Va siempre en
// su propia fila: dentro de una GFormRow con más hijos, avisa.
import { computed, inject, onMounted, provide, ref, unref, useId, useSlots } from 'vue'
import { oneOf } from '../../utils/oneOf.js'
import GIcon from '../GIcon/GLibIcon.js'
import { isDev, layoutKey, messageIcon, nextFrame, useCompositeField, useFormField } from '../GForm/formContext.js'
import GFormRow from '../GFormRow/GFormRow.vue'
import { rowRoots } from '../GFormRow/rowEngine.js'

defineOptions({ name: 'GFieldGroup' })

const props = defineProps({
  label: { type: String, default: undefined },
  hint: { type: String, default: undefined },
  name: { type: String, default: undefined },
  error: { type: String, default: undefined },
  warning: { type: String, default: undefined },
  valid: { type: String, default: undefined },
  required: Boolean,
  // r02: las partes nunca se parten en líneas (Día · Mes · Año)
  keep: Boolean,
  // Sin valor por defecto para distinguir lo explícito del contexto (form.md §2)
  disabled: { type: Boolean, default: undefined },
  readonly: { type: Boolean, default: undefined },
  density: { type: String, default: undefined, validator: oneOf(['default', 'comfortable', 'compact']) },
  id: { type: String, default: undefined }
})

const slots = useSlots()
const root = ref(null)
const outer = inject(layoutKey, null)
const uid = useId()
const groupId = computed(() => props.id || `g-field-group-${uid}`)
const hintId = computed(() => `${groupId.value}-hint`)

const ff = useFormField({
  role: 'group',
  id: groupId,
  name: () => props.name,
  error: () => props.error,
  warning: () => props.warning,
  valid: () => props.valid,
  required: () => props.required,
  disabled: () => props.disabled,
  readonly: () => props.readonly,
  density: () => props.density,
  root
})

// ---------- Partes, mensaje único y registro en GForm (un elemento del resumen por pregunta) ----------
const { message } = useCompositeField({ ff, name: () => props.name, required: () => props.required, root })
// Las partes llenan su sitio y heredan el estado del grupo (disabled, readonly, densidad)
provide(layoutKey, { block: true, density: ff.density, stack: computed(() => Boolean(unref(outer?.stack))), readonly: ff.readonly, disabled: ff.disabled })

const hasLabel = computed(() => Boolean(props.label || slots.label))
const hasHint = computed(() => Boolean(props.hint || slots.hint))
const describedBy = computed(() => [hasHint.value && hintId.value, message.value && ff.messageId.value].filter(Boolean).join(' ') || undefined)

onMounted(() => {
  // Siempre en su propia fila (r02, L5): su <legend> no puede bajar las cajas de los vecinos. En el cuadro siguiente:
  // la GFormRow que lo contendría se monta después que sus hijos
  if (!isDev) return
  nextFrame(() => {
    const p = root.value?.parentElement
    if (p && rowRoots.has(p) && [...p.children].filter((c) => !c.classList.contains('g-tooltip')).length > 1) console.warn('[Grana GFieldGroup] va en su propia fila (hijo directo de GFormLayout), no junto a otros campos en una GFormRow.')
  })
})

const classes = computed(() => [
  'g-field-group',
  `g-field-group--density-${ff.density.value}`,
  {
    'is-disabled': ff.disabled.value,
    'is-readonly': ff.readonly.value,
    'is-invalid': message.value?.type === 'error',
    'is-warning': message.value?.type === 'warning',
    'is-valid': message.value?.type === 'valid',
    // La pone GForm en un envío con errores o showErrors() (#304); el CSS de la sacudida es de coco
    'is-rejected': ff.rejected.value
  }
])

if (isDev && !hasLabel.value) console.warn('[Grana GFieldGroup] necesita label o el slot label (texto del <legend>).')
</script>

<template>
  <fieldset :id="groupId" ref="root" :class="classes" @animationend="ff.onRejectEnd" @animationcancel="ff.onRejectEnd" :disabled="ff.disabled.value || undefined" :aria-describedby="describedBy">
    <legend v-if="hasLabel" class="g-field-group__label"><slot name="label">{{ label }}</slot><template v-if="ff.mark.value === 'optional' && ff.markText.value">{{ ' ' }}<span class="g-field-group__optional">{{ ff.markText.value }}</span></template><span v-if="ff.mark.value === 'required'" class="g-field-group__required" aria-hidden="true">*</span></legend>
    <GFormRow class="g-field-group__parts" :keep="keep" :density="ff.density.value"><slot /></GFormRow>
    <div class="g-field-group__support">
      <div v-if="hasHint" :id="hintId" class="g-field-group__hint"><slot name="hint">{{ hint }}</slot></div>
      <div :id="ff.messageId.value" class="g-field-group__message" :aria-live="ff.live.value"><template v-if="message"><GIcon class="g-field-group__message-icon" :name="messageIcon(message.type)" /><span v-if="message.prefix" class="g-field-group__message-type">{{ message.prefix }}</span>{{ message.text }}</template></div>
    </div>
  </fieldset>
</template>
