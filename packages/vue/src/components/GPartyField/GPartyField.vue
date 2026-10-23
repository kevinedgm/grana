<script setup>
// GPartyField · personas por tipo (dueño: bruno)
// Contrato: design/contracts/booking-bar.md «GPartyField» (DECISIONS.md #738, #742, #759) · Estructura:
// design/lab/booking-bar/r01/ (kiwi) · Estilo: GPartyField.css (coco: la caja de GSelect). Entrada @grana/vue/booking.
// Compone GNumberField steppers por fila (no inventa un contador). popover: disparador con el resumen en palabras + panel
// en la capa superior (panel.js: reglas 1 a 3 de #358, cierre por Tab comprobado tras el evento, una activación por gesto);
// inline: las filas a la vista en un role="group". Slot trigger como GDatePicker (la frase de GBookingBar). Campo completo
// (useFormField: etiqueta, mensajes, contexto de GForm, ocultos {name}[{key}]). Un valor que excede un max dependiente se
// corrige y se emite. Puro (#444).
import { computed, inject, nextTick, onBeforeUnmount, onMounted, provide, ref, useAttrs, useId, useSlots, watch } from 'vue'
import GNumberField from '../GNumberField/GNumberField.vue'
import GBtn from '../GBtn/GBtn.vue'
import GIcon from '../GIcon/GLibIcon.js'
import { fieldGroupKey, layoutKey, messageIcon, useFormField } from '../GForm/formContext.js'
import { oneOf } from '../../utils/oneOf.js'
import { useAnchoredPanel } from './panel.js'
import { clampParty, completeParty, isNum, maxOf, minOf, partySummary, validRows } from './party.js'

defineOptions({ name: 'GPartyField', inheritAttrs: false })

const props = defineProps({
  modelValue: { type: Object, default: () => ({}) },
  rows: { type: Array, default: undefined },
  mode: { type: String, default: 'popover', validator: oneOf(['popover', 'inline']) },
  label: { type: String, default: undefined },
  hint: { type: String, default: undefined },
  error: { type: String, default: undefined },
  warning: { type: String, default: undefined },
  valid: { type: String, default: undefined },
  name: { type: String, default: undefined },
  disabled: { type: Boolean, default: undefined },
  readonly: { type: Boolean, default: undefined },
  size: { type: String, default: 'md', validator: oneOf(['xs', 'sm', 'md', 'lg', 'xl']) },
  variant: { type: String, default: 'outline', validator: oneOf(['outline', 'soft']) },
  density: { type: String, default: undefined, validator: oneOf(['default', 'comfortable', 'compact']) },
  rounded: { type: String, default: undefined, validator: oneOf(['none', 'xs', 'sm', 'md', 'lg', 'xl', 'pill']) },
  block: { type: Boolean, default: undefined },
  labels: { type: Object, default: () => ({}) },
  locale: { type: String, default: undefined },
  id: { type: String, default: undefined }
})
const emit = defineEmits(['update:modelValue', 'open', 'close'])
const attrs = useAttrs()
const slots = useSlots()
const uid = useId()
const baseId = computed(() => props.id || `g-party-${uid}`)
const labelId = computed(() => `${baseId.value}-label`)
const valueId = computed(() => `${baseId.value}-value`)
const panelId = computed(() => `${baseId.value}-panel`)
const hintId = computed(() => `${baseId.value}-hint`)

const warned = new Set()
const warn = (key, text) => {
  try {
    if (process.env.NODE_ENV !== 'production' && !warned.has(key)) {
      warned.add(key)
      console.warn(`[Grana GPartyField] ${text}`)
    }
  } catch {}
}

const rootEl = ref(null)
const triggerEl = ref(null)
const panelEl = ref(null)
const rowsEl = ref(null)
const hasTrigger = computed(() => props.mode === 'popover' && Boolean(slots.trigger))
const ff = useFormField({
  id: baseId,
  name: () => props.name,
  error: () => props.error,
  warning: () => props.warning,
  valid: () => props.valid,
  readonly: () => props.readonly,
  disabled: () => props.disabled,
  density: () => props.density,
  block: () => props.block,
  trigger: 'change',
  control: () => (props.mode === 'inline' ? rowsEl.value && rowsEl.value.querySelector('input') : triggerEl.value),
  root: rootEl
})
// La fila de formulario de fuera (GFormRow): el campo publica su mínimo intrínseco (#271). Se lee ANTES de cortar el contexto
const row = inject(layoutKey, null)
// Los contadores del panel no publican en una GFormRow ni se registran en un grupo: el campo es el grupo entero
provide(layoutKey, null)
provide(fieldGroupKey, null)

const list = computed(() => validRows(props.rows))
const value = computed(() => clampParty(list.value, completeParty(list.value, props.modelValue)))
// Corrección por un max dependiente (o por valores que faltaban): se emite el valor resuelto
watch(value, (v) => {
  const given = props.modelValue || {}
  if (list.value.some((r) => given[r.key] !== v[r.key] && isNum(given[r.key]))) emit('update:modelValue', { ...v })
}, { immediate: true })

const loc = ref(props.locale)
const nf = computed(() => { try { return new Intl.NumberFormat(loc.value) } catch { return new Intl.NumberFormat() } })
const text = computed(() => partySummary(list.value, value.value, props.labels && props.labels.separator, nf.value))

const isDisabled = ff.disabled
const isReadonly = ff.readonly
function setRow(key, n) {
  if (!isNum(n)) return
  const next = clampParty(list.value, { ...value.value, [key]: n })
  emit('update:modelValue', next)
  ff.notifyChange()
}

// ---------- Panel ----------
const panel = useAnchoredPanel({
  panel: () => panelEl.value,
  anchor: () => triggerEl.value,
  onOpen: () => emit('open'),
  onClose: () => emit('close')
})
function onTrigger(e) {
  if (isDisabled.value || isReadonly.value) return
  panel.toggle(e)
}
watch(() => [isDisabled.value, isReadonly.value], () => panel.hide(false))
const slotScope = computed(() => ({
  id: baseId.value,
  expanded: panel.open.value,
  controls: panelId.value,
  toggle: onTrigger,
  open: (e) => { if (!isDisabled.value && !isReadonly.value) panel.show(e && e.currentTarget) },
  close: () => panel.hide(true),
  value: value.value,
  text: text.value
}))

// Mínimo intrínseco a GFormRow (#271): el resumen entero en una línea (texto medido con un Range) más el resto de la caja
function publishMin() {
  if (!row || typeof row.setIntrinsicMin !== 'function' || !rootEl.value || !triggerEl.value) return
  const v = triggerEl.value.querySelector('.g-party-field__value')
  if (!v || typeof document.createRange !== 'function') return
  const range = document.createRange()
  range.selectNodeContents(v)
  const textW = range.getBoundingClientRect ? range.getBoundingClientRect().width : 0
  const chrome = triggerEl.value.offsetWidth - v.clientWidth
  if (textW > 0) row.setIntrinsicMin(rootEl.value, Math.ceil(textW + chrome))
}
watch(text, () => nextTick(publishMin))
onBeforeUnmount(() => { if (row && typeof row.setIntrinsicMin === 'function' && rootEl.value) row.setIntrinsicMin(rootEl.value, 0) })
onMounted(() => {
  nextTick(publishMin)
  if (!props.locale) {
    const near = rootEl.value && rootEl.value.closest && rootEl.value.closest('[lang]')
    loc.value = (near && near.getAttribute('lang')) || (typeof document !== 'undefined' && document.documentElement.lang) || undefined
  }
  try {
    if (process.env.NODE_ENV !== 'production') {
      if (props.mode === 'popover' && rootEl.value && rootEl.value.closest('dialog')) warn('in-dialog', 'mode="popover" dentro de un <dialog>: en un modal usa mode="inline" (aviso 4).')
    }
  } catch {}
})
watch(() => props.locale, (v) => { if (v) loc.value = v })

// Avisos
watch(() => [props.rows, props.labels, props.label, props.mode, props.modelValue], () => {
  try {
    if (process.env.NODE_ENV !== 'production') {
      const raw = Array.isArray(props.rows) ? props.rows : null
      const keys = (raw || []).map((r) => r && r.key)
      if (!raw || !raw.length || raw.some((r) => !r || r.key === undefined || r.key === '' || !r.label) || new Set(keys).size !== keys.length) warn('rows', 'rows obligatoria, con key única y label en cada fila (aviso 1).')
      if (!props.label && !attrs['aria-label'] && !attrs['aria-labelledby'] && !hasTrigger.value) warn('name', 'falta label (o aria-label, aria-labelledby o el slot trigger): sin nombre accesible (aviso 2).')
      if (list.value.some((r) => !r.decrementLabel || !r.incrementLabel)) warn('steps', 'una fila sin decrementLabel/incrementLabel: GNumberField no pinta los pasos (aviso 3).')
      const L = props.labels || {}
      if (props.mode === 'popover' && !L.done) warn('done', 'falta labels.done (aviso 3).')
      if (typeof L.separator !== 'string') warn('separator', 'falta labels.separator (aviso 3).')
      const given = props.modelValue || {}
      for (const r of list.value) {
        const n = given[r.key]
        const max = maxOf(r, given)
        if (isNum(n) && (n < minOf(r) || (max !== undefined && n > max))) { warn('range', `el valor de «${r.key}» está fuera de [min, max] (aviso 5).`); break }
      }
    }
  } catch {}
}, { immediate: true, deep: true })

const classes = computed(() => [
  'g-party-field',
  `g-party-field--mode-${props.mode}`,
  `g-party-field--size-${props.size}`,
  `g-party-field--variant-${props.variant}`,
  `g-party-field--density-${ff.density.value}`,
  props.rounded && `g-party-field--rounded-${props.rounded}`,
  attrs.class,
  {
    'g-party-field--trigger': hasTrigger.value,
    'g-party-field--block': ff.block.value,
    'is-open': panel.open.value,
    'is-invalid': ff.invalid.value,
    'is-warning': ff.ownMessage.value?.type === 'warning',
    'is-valid': ff.ownMessage.value?.type === 'valid',
    'is-readonly': isReadonly.value,
    'is-disabled': isDisabled.value,
    'is-rejected': ff.rejected.value
  }
])
const message = ff.message
const describedBy = computed(() => {
  const ids = [attrs['aria-describedby'], props.hint && hintId.value, message.value && ff.messageId.value].filter(Boolean)
  return ids.length ? ids.join(' ') : undefined
})
const triggerAttrs = computed(() => {
  const { class: _c, style: _s, ...rest } = attrs
  return {
    ...rest,
    id: baseId.value,
    type: 'button',
    'aria-haspopup': 'dialog',
    'aria-expanded': panel.open.value ? 'true' : 'false',
    'aria-controls': panelId.value,
    'aria-labelledby': attrs['aria-labelledby'] || (props.label ? `${labelId.value} ${valueId.value}` : undefined),
    'aria-describedby': describedBy.value,
    'aria-invalid': ff.invalid.value ? 'true' : undefined,
    'aria-readonly': isReadonly.value ? 'true' : undefined,
    disabled: isDisabled.value || undefined
  }
})
const hidden = computed(() => (props.name ? list.value.map((r) => ({ name: `${props.name}[${r.key}]`, value: String(value.value[r.key]) })) : []))
const rowProps = (r) => ({
  modelValue: value.value[r.key],
  label: r.label,
  hint: r.hint,
  min: minOf(r),
  max: maxOf(r, value.value),
  steppers: true,
  decrementLabel: r.decrementLabel,
  incrementLabel: r.incrementLabel,
  locale: loc.value,
  block: true,
  disabled: isDisabled.value || undefined,
  readonly: isReadonly.value || undefined,
  // Un contador siempre tiene valor: dentro de GForm no se marca «opcional» (#902, BK-L9)
  mark: false,
  'onUpdate:modelValue': (n) => setRow(r.key, n)
})
defineExpose({ open: () => panel.show(triggerEl.value), close: () => panel.hide(true), focus: () => triggerEl.value && triggerEl.value.focus() })
</script>

<template>
  <div ref="rootEl" :class="classes" :style="attrs.style" @animationend="ff.onRejectEnd" @animationcancel="ff.onRejectEnd" @focusout="ff.handlers.onFocusout">
    <template v-if="mode === 'inline'">
      <span v-if="label" :id="labelId" class="g-party-field__label">{{ label }}</span>
      <div ref="rowsEl" class="g-party-field__rows" role="group" :aria-labelledby="label ? labelId : attrs['aria-labelledby']" :aria-label="label ? undefined : attrs['aria-label']" :aria-describedby="describedBy">
        <GNumberField v-for="r in list" :key="r.key" v-bind="rowProps(r)" />
      </div>
    </template>
    <template v-else>
      <slot v-if="hasTrigger" name="trigger" v-bind="slotScope" />
      <template v-else>
        <span v-if="label" :id="labelId" class="g-party-field__label"><slot name="label">{{ label }}</slot></span>
        <button ref="triggerEl" v-bind="triggerAttrs" class="g-party-field__trigger" @click="onTrigger">
          <GIcon name="users" />
          <span :id="valueId" class="g-party-field__value" dir="auto">{{ text }}</span>
          <GIcon class="g-party-field__arrow" name="chevron-down" />
        </button>
      </template>
      <div :id="panelId" ref="panelEl" class="g-party-field__panel" role="dialog" :aria-labelledby="label && !hasTrigger ? labelId : undefined" :aria-label="label && !hasTrigger ? undefined : (label || attrs['aria-label'])" popover="manual">
        <div class="g-party-field__rows">
          <GNumberField v-for="r in list" :key="r.key" v-bind="rowProps(r)" />
        </div>
        <GBtn class="g-party-field__done" variant="outline" color="neutral" size="sm" @click="panel.hide(true)">{{ labels.done }}</GBtn>
      </div>
    </template>
    <div v-if="!hasTrigger" class="g-party-field__support">
      <div v-if="hint" :id="hintId" class="g-party-field__hint">{{ hint }}</div>
      <p :id="ff.messageId.value" class="g-party-field__message" :aria-live="ff.live.value"><template v-if="message"><GIcon class="g-party-field__message-icon" :name="messageIcon(message.type)" /><span v-if="message.prefix" class="g-party-field__message-type">{{ message.prefix }}</span>{{ message.text }}</template></p>
    </div>
    <input v-for="h in hidden" :key="h.name" type="hidden" :name="h.name" :value="h.value" :disabled="isDisabled || undefined">
  </div>
</template>
