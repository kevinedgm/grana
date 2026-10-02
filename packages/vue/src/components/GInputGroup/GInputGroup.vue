<script setup>
// GInputGroup · campo fusionado: una caja, una etiqueta, varias partes y un mensaje (dueño: bruno)
// Contrato: design/contracts/form.md §13 (DECISIONS.md #177, #178, #188) · Estilo: GInputGroup.css (coco)
// Raíz role="group" nombrada por la etiqueta visible; <label for> → parte principal; cada parte con nombre propio
// (etiqueta + nombre de la parte, 2.5.3) y su propio foco; aria-invalid solo en la parte que falla; un mensaje.
// Partes: GInputGroupInput, GInputGroupSelect (<select> nativo, por el autocompletado) y GInputGroupText.
import { computed, onMounted, provide, ref, shallowReactive, useId, useSlots } from 'vue'
import { oneOf } from '../../utils/oneOf.js'
import GIcon from '../GIcon/GIcon.vue'
import { byDocument, isDev, layoutKey, messageIcon, useCompositeField, useFormField } from '../GForm/formContext.js'
import { inputGroupKey } from './inputGroupContext.js'

defineOptions({ name: 'GInputGroup' })

const props = defineProps({
  label: { type: String, default: undefined },
  hint: { type: String, default: undefined },
  name: { type: String, default: undefined },
  error: { type: String, default: undefined },
  warning: { type: String, default: undefined },
  valid: { type: String, default: undefined },
  required: Boolean,
  mark: { type: Boolean, default: undefined },
  // Sin valor por defecto: la prop explícita gana al contexto de GForm (form.md §2)
  readonly: { type: Boolean, default: undefined },
  disabled: { type: Boolean, default: undefined },
  size: { type: String, default: 'md', validator: oneOf(['xs', 'sm', 'md', 'lg', 'xl']) },
  variant: { type: String, default: 'outline', validator: oneOf(['outline', 'soft']) },
  density: { type: String, default: undefined, validator: oneOf(['default', 'comfortable', 'compact']) },
  block: { type: Boolean, default: undefined },
  id: { type: String, default: undefined }
})

const slots = useSlots()
const root = ref(null)
const uid = useId()
const baseId = computed(() => props.id || `g-input-group-${uid}`)
const labelId = computed(() => `${baseId.value}-label`)
const hintId = computed(() => `${baseId.value}-hint`)

const ff = useFormField({
  role: 'group',
  id: baseId,
  name: () => props.name,
  error: () => props.error,
  warning: () => props.warning,
  valid: () => props.valid,
  required: () => props.required,
  mark: () => props.mark,
  readonly: () => props.readonly,
  disabled: () => props.disabled,
  density: () => props.density,
  block: () => props.block,
  root
})

// ---------- Partes ----------
const parts = shallowReactive(new Map()) // uid → { kind, el(), controlId(), principal(), partLabel(), descId() }
const sorted = computed(() => [...parts.values()].sort((a, b) => byDocument(a.el(), b.el())))
const controls = computed(() => sorted.value.filter((p) => p.kind !== 'text'))
const principal = computed(() => controls.value.find((p) => p.principal()) || controls.value[0] || null)
const principalId = computed(() => principal.value?.controlId())
const textIds = computed(() => sorted.value.filter((p) => p.kind === 'text').map((p) => p.descId()).filter(Boolean))

// Mensaje único y registro en GForm: el resumen lleva a la primera parte inválida (o a la principal)
const { message } = useCompositeField({
  ff,
  name: () => props.name,
  required: () => props.required,
  root,
  sortKey: (p) => p.control(),
  fallback: (ps) => ps.find((p) => p.control()?.id === principalId.value) || ps[0]
})

const hasLabel = computed(() => Boolean(props.label || slots.label))
const hasHint = computed(() => Boolean(props.hint || slots.hint))
// Error del grupo (propio o errors[name]): marca todas las partes que son control
const groupInvalid = computed(() => ff.ownMessage.value?.type === 'error')
const describedBy = computed(() => [...textIds.value, hasHint.value && hintId.value, message.value && ff.messageId.value].filter(Boolean).join(' ') || undefined)

function focusNear(el) {
  const list = controls.value
  const next = list.find((p) => byDocument(el, p.el()) < 0)
  const prev = [...list].reverse().find((p) => byDocument(p.el(), el) < 0)
  const target = next || prev
  if (target && typeof document !== 'undefined') document.getElementById(target.controlId())?.focus()
}

provide(inputGroupKey, {
  root,
  labelId,
  principalId,
  describedBy,
  groupInvalid,
  required: computed(() => props.required),
  register(entry) {
    parts.set(entry.uid, entry)
    return () => { if (parts.get(entry.uid) === entry) parts.delete(entry.uid) }
  },
  focusNear
})
// Las partes heredan el estado del campo (disabled, readonly, densidad)
provide(layoutKey, { block: true, density: ff.density, readonly: ff.readonly, disabled: ff.disabled })

const classes = computed(() => [
  'g-input-group',
  `g-input-group--size-${props.size}`,
  `g-input-group--variant-${props.variant}`,
  `g-input-group--density-${ff.density.value}`,
  {
    'g-input-group--block': ff.block.value,
    'is-disabled': ff.disabled.value,
    'is-readonly': ff.readonly.value,
    'is-invalid': message.value?.type === 'error',
    'is-warning': message.value?.type === 'warning',
    'is-valid': message.value?.type === 'valid'
  }
])

// ---------- Avisos de desarrollo (al montar; las partes ya están registradas) ----------
onMounted(() => {
  if (!isDev) return
  const warn = (m) => console.warn(`[Grana GInputGroup] ${m}`)
  if (!hasLabel.value) warn('necesita label o el slot label (nombre del grupo y de cada parte).')
  if (controls.value.length < 2) warn('tiene menos de dos partes GInputGroupInput/GInputGroupSelect: para una sola parte, usa GInput con prefix/suffix.')
  if (controls.value.filter((p) => p.principal()).length > 1) warn('más de una parte con `principal`.')
  for (const p of controls.value) if (p !== principal.value && !p.partLabel()) warn('una parte no principal sin `partLabel`: su nombre accesible sería solo la etiqueta del grupo.')
  const box = root.value?.querySelector('.g-input-group__box')
  if (box) for (const c of box.children) {
    if (!c.matches('.g-input-group__part, .g-input-group__text-label')) warn(`«${c.className || c.localName}» no es una parte: solo GInputGroupInput, GInputGroupSelect y GInputGroupText (cada campo trae su propia etiqueta y caja).`)
  }
})
</script>

<template>
  <div ref="root" :class="classes" role="group" :aria-labelledby="hasLabel ? labelId : undefined" :id="props.id">
    <label v-if="hasLabel" :id="labelId" class="g-input-group__label" :for="principalId"><slot name="label">{{ label }}</slot><template v-if="ff.mark.value === 'optional' && ff.markText.value">{{ ' ' }}<span class="g-input-group__optional">{{ ff.markText.value }}</span></template><span v-if="ff.mark.value === 'required'" class="g-input-group__required" aria-hidden="true">*</span></label>
    <div class="g-input-group__box"><slot /></div>
    <div class="g-input-group__support">
      <div v-if="hasHint" :id="hintId" class="g-input-group__hint"><slot name="hint">{{ hint }}</slot></div>
      <div :id="ff.messageId.value" class="g-input-group__message" :aria-live="ff.live.value"><template v-if="message"><GIcon class="g-input-group__message-icon" :name="messageIcon(message.type)" /><span v-if="message.prefix" class="g-input-group__message-type">{{ message.prefix }}</span>{{ message.text }}</template></div>
    </div>
  </div>
</template>
