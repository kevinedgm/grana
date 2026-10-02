<script setup>
// GFieldGroup · una pregunta con varias partes y un solo mensaje (dueño: bruno)
// Contrato: design/contracts/form.md §5 (#160) · Estilo: GFieldGroup.css (coco)
// <fieldset> + <legend>; aria-invalid en las partes, nunca en el fieldset (no se admite en el rol group, ARIA 1.3).
import { computed, onBeforeUnmount, onMounted, provide, ref, shallowReactive, useId, useSlots } from 'vue'
import { oneOf } from '../../utils/oneOf.js'
import GIcon from '../GIcon/GIcon.vue'
import { byDocument, fieldGroupKey, isDev, layoutKey, messageIcon, useFormField } from '../GForm/formContext.js'

defineOptions({ name: 'GFieldGroup' })

const props = defineProps({
  label: { type: String, default: undefined },
  hint: { type: String, default: undefined },
  name: { type: String, default: undefined },
  error: { type: String, default: undefined },
  warning: { type: String, default: undefined },
  valid: { type: String, default: undefined },
  required: Boolean,
  // Sin valor por defecto para distinguir lo explícito del contexto (form.md §2)
  disabled: { type: Boolean, default: undefined },
  readonly: { type: Boolean, default: undefined },
  density: { type: String, default: undefined, validator: oneOf(['default', 'comfortable', 'compact']) },
  id: { type: String, default: undefined }
})

const slots = useSlots()
const root = ref(null)
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

// ---------- Partes ----------
const parts = shallowReactive(new Map())
const sortedParts = () => [...parts.values()].sort((a, b) => byDocument(a.root() || a.control(), b.root() || b.control()))
const token = Symbol('part-of')
provide(fieldGroupKey, {
  token,
  required: computed(() => props.required),
  name: computed(() => props.name),
  registerPart(entry) {
    parts.set(entry.uid, entry)
    return () => { if (parts.get(entry.uid) === entry) parts.delete(entry.uid) }
  }
})
// Las partes llenan su sitio y heredan el estado del grupo (disabled, readonly, densidad)
provide(layoutKey, { block: true, density: ff.density, readonly: ff.readonly, disabled: ff.disabled })

// Un solo mensaje: el del grupo o el primero de sus partes en orden del DOM (prioridad error › advertencia › válido)
const message = computed(() => {
  const list = [ff.ownMessage.value, ...sortedParts().filter((p) => !p.disabled()).map((p) => p.ownMessage())].filter(Boolean)
  return list.find((m) => m.type === 'error') || list.find((m) => m.type === 'warning') || list.find((m) => m.type === 'valid') || null
})
const hasLabel = computed(() => Boolean(props.label || slots.label))
const hasHint = computed(() => Boolean(props.hint || slots.hint))
const describedBy = computed(() => [hasHint.value && hintId.value, message.value && ff.messageId.value].filter(Boolean).join(' ') || undefined)

// ---------- Registro en GForm: un elemento del resumen por pregunta ----------
let off = null
onMounted(() => {
  const form = ff.form
  if (!form || typeof form.register !== 'function') return
  const enabledParts = () => sortedParts().filter((p) => !p.disabled())
  off = form.register({
    uid: `group-${uid}`,
    role: 'group',
    inGroup: false,
    names: () => [props.name, ...sortedParts().map((p) => p.name())].filter(Boolean),
    control: () => enabledParts()[0]?.control() || null,
    root: () => root.value,
    disabled: () => ff.disabled.value,
    blocking(errors) {
      const ps = enabledParts()
      const own = ff.explicitError()
      const ownMsg = own !== undefined ? own : (props.name && errors ? errors[props.name] : '')
      const firstInvalid = (map) => ps.find((p) => {
        const e = p.explicitError()
        return e !== undefined ? Boolean(e) : Boolean(p.name() && map && map[p.name()])
      })
      if (ownMsg) {
        const target = firstInvalid(errors) || ps[0]
        return { name: props.name ?? target?.name() ?? null, message: String(ownMsg), id: target?.control()?.id || null }
      }
      const p = firstInvalid(errors)
      if (!p) return null
      const e = p.explicitError()
      return { name: props.name ?? p.name() ?? null, message: String(e !== undefined ? e : errors[p.name()]), id: p.control()?.id || null }
    },
    visibleTarget() {
      const ps = enabledParts()
      const p = ps.find((x) => x.invalid())
      if (p) return { control: p.control(), root: root.value }
      if (ff.ownMessage.value?.type === 'error' && ps[0]) return { control: ps[0].control(), root: root.value }
      return null
    }
  })
})
onBeforeUnmount(() => off?.())

const classes = computed(() => [
  'g-field-group',
  `g-field-group--density-${ff.density.value}`,
  {
    'is-disabled': ff.disabled.value,
    'is-readonly': ff.readonly.value,
    'is-invalid': message.value?.type === 'error',
    'is-warning': message.value?.type === 'warning',
    'is-valid': message.value?.type === 'valid'
  }
])

if (isDev && !hasLabel.value) console.warn('[Grana GFieldGroup] necesita label o el slot label (texto del <legend>).')
</script>

<template>
  <fieldset :id="groupId" ref="root" :class="classes" :disabled="ff.disabled.value || undefined" :aria-describedby="describedBy">
    <legend v-if="hasLabel" class="g-field-group__label"><slot name="label">{{ label }}</slot><template v-if="ff.mark.value === 'optional' && ff.markText.value">{{ ' ' }}<span class="g-field-group__optional">{{ ff.markText.value }}</span></template><span v-if="ff.mark.value === 'required'" class="g-field-group__required" aria-hidden="true">*</span></legend>
    <div class="g-field-group__parts"><slot /></div>
    <div v-if="hasHint" :id="hintId" class="g-field-group__hint"><slot name="hint">{{ hint }}</slot></div>
    <div :id="ff.messageId.value" class="g-field-group__message" :aria-live="ff.live.value"><template v-if="message"><GIcon class="g-field-group__message-icon" :name="messageIcon(message.type)" /><span v-if="message.prefix" class="g-field-group__message-type">{{ message.prefix }}</span>{{ message.text }}</template></div>
  </fieldset>
</template>
