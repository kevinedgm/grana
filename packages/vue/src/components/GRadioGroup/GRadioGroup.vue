<script setup>
// GRadioGroup · una pregunta con una sola respuesta, con radios nativos (dueño: bruno)
// Contrato: design/contracts/radio-group.md (DECISIONS.md #267 a #273) · Estructura: design/lab/radio-group/r01/ (kiwi)
// Estilo: GRadioGroup.css (coco). Referencia ejecutable del marcado: rg() en design/lab/radio-group/estilo-banco.html.
// El navegador hace el trabajo: estado, teclado (una parada de Tab, flechas que mueven y eligen), envío y agrupación son
// los del radio nativo. Único manejador propio de teclado: el bloqueo de solo lectura (#272).
import { computed, defineComponent, h, inject, mergeProps, nextTick, onBeforeUnmount, onMounted, ref, useAttrs, useId, useSlots, watch } from 'vue'
import { oneOf } from '../../utils/oneOf.js'
import GIcon from '../GIcon/GLibIcon.js'
import GAppIcon from '../GIcon/GIcon.vue'
import { layoutKey, messageIcon, useFormField } from '../GForm/formContext.js'
import { observeOptions } from './fitEngine.js'

defineOptions({ name: 'GRadioGroup', inheritAttrs: false })

// En `segmented`, icono y texto van en un bloque `__segment` que no se parte; en las demás, sueltos en la <label>
const Body = defineComponent({
  props: { wrap: Boolean },
  setup(p, { slots }) {
    return () => (p.wrap ? h('span', { class: 'g-radio-group__segment' }, slots.default && slots.default()) : slots.default && slots.default())
  }
})

const props = defineProps({
  // String ANTES de Boolean (si no, Vue convierte '' en true) y default null (si no, la prop ausente sería false)
  modelValue: { type: [String, Number, Boolean], default: null },
  options: { type: Array, default: () => [] },
  appearance: { type: String, default: 'list', validator: oneOf(['list', 'inline', 'segmented', 'chip', 'card']) },
  labelMode: { type: String, default: 'full', validator: oneOf(['full', 'icon']) },
  name: { type: String, default: undefined },
  label: { type: String, default: undefined },
  hint: { type: String, default: undefined },
  error: { type: String, default: undefined },
  warning: { type: String, default: undefined },
  valid: { type: String, default: undefined },
  required: Boolean,
  mark: { type: Boolean, default: undefined },
  // readonly, disabled y density sin valor por defecto: la prop explícita gana al contexto de GForm (form.md §2)
  readonly: { type: Boolean, default: undefined },
  disabled: { type: Boolean, default: undefined },
  size: { type: String, default: 'md', validator: oneOf(['xs', 'sm', 'md', 'lg', 'xl']) },
  density: { type: String, default: undefined, validator: oneOf(['default', 'comfortable', 'compact']) },
  color: { type: String, default: 'brand', validator: oneOf(['brand', 'accent', 'neutral', 'success', 'warning', 'danger', 'info']) },
  // field (#262): true = campo (región de mensaje y contexto de GForm); false = control suelto dentro de otro componente.
  // Se lee al crear el grupo.
  field: { type: Boolean, default: true },
  id: { type: String, default: undefined }
})

// Solo este evento se declara: change, focusin, focusout, keydown… suben del radio y llegan a la raíz por $attrs.
const emit = defineEmits(['update:modelValue'])

const attrs = useAttrs()
const slots = useSlots()
const uid = useId()

const rootId = computed(() => props.id || `g-radio-group-${uid}`)
const labelId = computed(() => `${rootId.value}-label`)
const hintId = computed(() => `${rootId.value}-hint`)
const optId = (i) => `${rootId.value}-${i}`
// Los radios necesitan un name común para agruparse y para las flechas: si falta, uno estable
const groupName = computed(() => props.name || `g-radio-group-${uid}`)

const isDiv = computed(() => props.appearance === 'inline' || props.appearance === 'segmented')
const isSegmented = computed(() => props.appearance === 'segmented')
const descOk = computed(() => props.appearance === 'list' || props.appearance === 'card')

// ---------- Opciones (forma de GSelect, sin grupos; §«Opciones») ----------
const isValue = (v) => typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean'
const parsed = computed(() => {
  const items = []
  const problems = { invalid: false, group: false, dup: false }
  for (const o of Array.isArray(props.options) ? props.options : []) {
    if (!o || typeof o !== 'object') { problems.invalid = true; continue }
    if (Array.isArray(o.options)) { problems.group = true; continue }
    if (!isValue(o.value) || typeof o.label !== 'string' || !o.label) { problems.invalid = true; continue }
    if (items.some((x) => x.value === o.value || String(x.value) === String(o.value))) problems.dup = true
    items.push(o)
  }
  return { items, problems }
})
const items = computed(() => parsed.value.items)

const hasModel = computed(() => props.modelValue !== null && props.modelValue !== undefined)
// La elegida: la primera opción cuyo value es === al modelo (con un value repetido se pinta solo una)
const checkedIndex = computed(() => (hasModel.value ? items.value.findIndex((o) => o.value === props.modelValue) : -1))

// Una opción «tiene icono» con slot `icon` y `option.icon` con valor, o sin slot y `option.icon` cadena (#202, regla de GTabs)
const hasIconValue = (v) => v !== undefined && v !== null
const hasIcon = (o) => (slots.icon ? hasIconValue(o.icon) : typeof o.icon === 'string' && o.icon !== '')
// Solo icono efectivo: solo en segmented y chip, y sin slot `option`
const iconMode = computed(() => props.labelMode === 'icon' && (props.appearance === 'segmented' || props.appearance === 'chip') && !slots.option)
const iconOnly = (o) => iconMode.value && hasIcon(o)
const descOf = (o) => (descOk.value && !slots.option && typeof o.description === 'string' && o.description ? o.description : '')

// ---------- Contexto de formulario (form.md §2; contrato «Contexto de formulario») ----------
const rootEl = ref(null)
const inputs = () => (rootEl.value ? [...rootEl.value.querySelectorAll(':scope > .g-radio-group__options > .g-radio-group__option > .g-radio-group__input')] : [])
// El radio por el que Tab entraría: la elegida si está habilitada; si no, la primera habilitada
const tabTarget = () => {
  const list = inputs()
  return list.find((r) => r.checked && !r.disabled) || list.find((r) => !r.disabled) || null
}
const isField = props.field !== false
const NONE = computed(() => null)
const ff = isField ? useFormField({
  id: rootId,
  name: () => props.name,
  error: () => props.error,
  warning: () => props.warning,
  valid: () => props.valid,
  required: () => props.required,
  readonly: () => props.readonly,
  disabled: () => props.disabled,
  density: () => props.density,
  mark: () => props.mark,
  trigger: 'change',
  control: tabTarget,
  root: rootEl
}) : {
  density: computed(() => props.density ?? 'default'),
  readonly: computed(() => props.readonly ?? false),
  disabled: computed(() => props.disabled ?? false),
  message: NONE,
  ownMessage: NONE,
  invalid: computed(() => false),
  mark: NONE,
  markText: computed(() => undefined),
  messageId: computed(() => undefined),
  live: computed(() => undefined),
  handlers: {}
}
const density = ff.density
const isReadonly = ff.readonly
const isDisabled = ff.disabled
const message = ff.message

const hasLabel = computed(() => Boolean(props.label || slots.label))
const hasHint = computed(() => Boolean(props.hint || slots.hint))
const showSupport = computed(() => isField || hasHint.value)

// ---------- Segmentado: medida del ancho natural y apilado (#271) ----------
const layout = inject(layoutKey, null)
const stacked = ref(false)
let natural = 0
let published = 0
let publishedEl = null
const MEASURE = 'g-radio-group--measure'

// Publica el ancho natural a la GFormRow que lo contiene (setIntrinsicMin; 0 lo retira). Si la raíz cambió de elemento
// (otra appearance cambia div ↔ fieldset), retira primero lo publicado con la anterior.
function publish(px) {
  if (!layout || typeof layout.setIntrinsicMin !== 'function') return
  const el = rootEl.value
  if (publishedEl && publishedEl !== el) {
    layout.setIntrinsicMin(publishedEl, 0)
    publishedEl = null
    published = 0
  }
  if (!el || px === published) return
  published = px
  publishedEl = px ? el : null
  layout.setIntrinsicMin(el, px)
}
// Ancho natural: todas las opciones en una línea e iguales a la más larga. Pasada síncrona con la clase de medida (sin
// transiciones y en una línea aunque esté apilado): n × max(ancho de __segment + relleno en línea + borde de inicio,
// min-inline-size de la opción), redondeado hacia arriba. 0 = sin maquetación (SSR, jsdom).
function measure() {
  const el = rootEl.value
  if (!el || !isSegmented.value || typeof getComputedStyle !== 'function') return 0
  const opts = [...el.querySelectorAll(':scope > .g-radio-group__options > .g-radio-group__option')]
  if (!opts.length) return 0
  el.classList.add(MEASURE)
  let w = 0
  for (const o of opts) {
    const cs = getComputedStyle(o)
    const seg = o.querySelector(':scope > .g-radio-group__segment')
    const own = (seg ? seg.getBoundingClientRect().width : 0) + (parseFloat(cs.paddingInlineStart) || 0) + (parseFloat(cs.paddingInlineEnd) || 0) + (parseFloat(cs.borderInlineStartWidth) || 0)
    w = Math.max(w, own, parseFloat(cs.minInlineSize) || 0)
  }
  el.classList.remove(MEASURE)
  return w > 0 ? Math.ceil(opts.length * w) : 0
}
// Decide el apilado por el ancho propio de __options (que no depende de is-stacked: no oscila). Escribe solo si cambia.
function fit() {
  const el = rootEl.value
  if (!el || !isSegmented.value) {
    if (stacked.value) stacked.value = false
    publish(0)
    return
  }
  natural = measure()
  publish(natural)
  const box = el.querySelector(':scope > .g-radio-group__options')
  const avail = box ? box.getBoundingClientRect().width : 0
  const next = natural > 0 && avail > 0 && natural > avail + 0.5
  if (stacked.value !== next) stacked.value = next
}

let stopObserve = null
let unmounted = false
const onFonts = () => { if (!unmounted) fit() }
function watchSize() {
  stopObserve?.()
  stopObserve = null
  const box = rootEl.value && rootEl.value.querySelector(':scope > .g-radio-group__options')
  // Las escrituras van fuera de la devolución del observador (en el cuadro siguiente, #169): lo hace el motor compartido
  if (isSegmented.value && box) stopObserve = observeOptions(box, fit)
}

onMounted(() => {
  // Antes del primer pintado del cliente: si no cabe, ya sale apilado
  fit()
  watchSize()
  if (typeof document !== 'undefined' && document.fonts) {
    document.fonts.ready?.then(onFonts)
    document.fonts.addEventListener?.('loadingdone', onFonts)
  }
})
// Al cambiar opciones, labelMode, size, density o appearance se mide de nuevo (tras el parche del DOM)
watch(() => [props.options, props.labelMode, props.size, density.value, props.appearance], () => {
  if (unmounted) return
  fit()
  watchSize()
}, { deep: true, flush: 'post' })
onBeforeUnmount(() => {
  unmounted = true
  stopObserve?.()
  if (typeof document !== 'undefined') document.fonts?.removeEventListener?.('loadingdone', onFonts)
  publish(0)
})

// ---------- Modelo controlado ----------
// El <input> nativo puede divergir del modelo tras un clic (si el consumidor no lo actualiza): se vuelve a alinear.
function sync() {
  inputs().forEach((r, i) => {
    const want = i === checkedIndex.value
    if (r.checked !== want) r.checked = want
  })
}
onMounted(sync)
watch(checkedIndex, sync, { flush: 'post' })

function onChange(event) {
  const t = event.target
  if (!t || !t.classList || !t.classList.contains('g-radio-group__input')) return
  const i = inputs().indexOf(t)
  const o = items.value[i]
  if (!o || !t.checked) return
  if (isReadonly.value || isDisabled.value || o.disabled) {
    nextTick(sync)
    return
  }
  emit('update:modelValue', o.value)
  nextTick(sync)
}
// Solo lectura (#272): se cancelan las cuatro flechas y el clic (también el de la etiqueta y el que dispara Espacio): ni
// la selección ni el foco cambian de opción. Los radios siguen habilitados, enfocables y en FormData.
const ARROWS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Up', 'Down', 'Left', 'Right'])
function onKeydown(event) {
  if (isReadonly.value && ARROWS.has(event.key)) event.preventDefault()
}
function onClick(event) {
  if (!isReadonly.value) return
  event.preventDefault()
  // El navegador devuelve la elegida al cancelar; si un entorno no lo hace (jsdom), el DOM se realinea con el modelo
  nextTick(sync)
}

// ---------- Raíz ----------
const describedBy = computed(() => {
  const ids = [attrs['aria-describedby'], hasHint.value && hintId.value, message.value && ff.messageId.value].filter(Boolean)
  return ids.length ? ids.join(' ') : undefined
})
const classes = computed(() => [
  'g-radio-group',
  `g-radio-group--appearance-${props.appearance}`,
  `g-radio-group--size-${props.size}`,
  `g-radio-group--density-${density.value}`,
  `g-radio-group--color-${props.color}`,
  {
    'g-radio-group--icon-only': iconMode.value,
    'is-disabled': isDisabled.value,
    'is-readonly': isReadonly.value,
    'is-invalid': ff.invalid.value,
    'is-warning': ff.ownMessage.value?.type === 'warning',
    'is-valid': ff.ownMessage.value?.type === 'valid',
    'is-stacked': isSegmented.value && stacked.value
  }
])
// Lo que controla el componente va al final y gana; class y style del consumidor se fusionan
const controlled = computed(() => ({
  id: rootId.value,
  class: classes.value,
  role: 'radiogroup',
  'aria-labelledby': hasLabel.value ? labelId.value : attrs['aria-labelledby'],
  'aria-describedby': describedBy.value,
  'aria-required': isField && props.required ? 'true' : undefined,
  'aria-invalid': ff.invalid.value ? 'true' : undefined,
  'aria-readonly': isReadonly.value ? 'true' : undefined,
  disabled: !isDiv.value && isDisabled.value ? true : undefined
}))
// Los manejadores del contexto van PRIMERO, luego los propios y después los del consumidor (C8): un @change del consumidor
// en la raíz recibe el change nativo del radio con el modelo ya actualizado.
const rootBindings = computed(() => mergeProps(ff.handlers, { onChange, onKeydown, onClick }, attrs, controlled.value))

const ctx = (o, i) => ({ option: o, index: i, checked: i === checkedIndex.value, disabled: Boolean(o.disabled) || isDisabled.value })
const iconCtx = (o, i) => ({ option: o, index: i, checked: i === checkedIndex.value })

// ---------- Avisos de desarrollo (una vez por instancia y mensaje) ----------
const isDev = typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production'
if (isDev) {
  const warned = new Set()
  const warn = (key, msg) => {
    if (warned.has(key)) return
    warned.add(key)
    console.warn(`[Grana GRadioGroup] ${msg}`)
  }
  const check = () => {
    const app = props.appearance
    const list = items.value
    const p = parsed.value.problems
    if (!hasLabel.value && !attrs['aria-label'] && !attrs['aria-labelledby']) warn('name', 'necesita label, slot label, aria-label o aria-labelledby para tener un nombre accesible.')
    if (list.length < 2) warn('few', `tiene ${list.length} opción(es) válida(s): una pregunta de radios necesita al menos 2.`)
    if (app === 'segmented' && list.length > 6) warn('many', `appearance="segmented" con ${list.length} opciones (más de 6): usa list, chip o GSelect.`)
    if (p.invalid) warn('invalid', 'una opción sin value (o con value null/undefined o que no es String, Number ni Boolean) o sin label se ignora.')
    if (p.group) warn('group', 'una opción con `options` (grupo) se ignora: un grupo de opciones dentro de una pregunta de radios es otra pregunta.')
    if (p.dup) warn('dup', 'hay un value repetido (por === o por String(value), que es lo que se envía).')
    if (hasModel.value && checkedIndex.value === -1) warn(`model-${String(props.modelValue)}`, `modelValue «${String(props.modelValue)}» no está en options: se trata como sin selección.`)
    const chosen = list[checkedIndex.value]
    if (chosen && chosen.disabled) warn('chosen-disabled', `la opción elegida («${chosen.label}») está deshabilitada: una flecha elegiría otra y no se enviaría. Usa readonly si el valor no se puede cambiar.`)
    if (!descOk.value && list.some((o) => o.description)) warn('description', `\`description\` solo se muestra en list y card; en ${app} se ignora.`)
    if (props.labelMode === 'icon') {
      if (app !== 'segmented' && app !== 'chip') warn('icon-mode', `labelMode="icon" solo se admite en segmented y chip; en ${app} cuenta como full.`)
      else if (slots.option) warn('icon-slot', 'labelMode="icon" no tiene efecto con el slot `option`.')
      else if (list.some((o) => !hasIcon(o))) warn('icon-missing', 'labelMode="icon" necesita `icon` en cada opción (un nombre de Lucide, o cualquier valor con el slot `icon`); la que no lo tenga conserva su etiqueta visible.')
    }
    if (!isField) {
      const given = ['error', 'warning', 'valid', 'required', 'mark'].filter((k) => (k === 'required' ? props.required : props[k] !== undefined))
      if (given.length) warn('field', `con field: false no es un campo: ${given.map((k) => `\`${k}\``).join(', ')} se ignora${given.length > 1 ? 'n' : ''} (sin región de mensaje ni marca).`)
    }
  }
  check()
  watch(() => [props.options, props.modelValue, props.appearance, props.labelMode, props.label, props.error, props.warning, props.valid, props.required, props.mark, attrs['aria-label'], attrs['aria-labelledby']], check, { deep: true })
  onMounted(() => {
    if (!props.name && rootEl.value && rootEl.value.closest('form')) warn('form-name', 'está dentro de un <form> sin `name`: el envío llevaría una clave generada y GForm no podría asociarle errores.')
  })
}
</script>

<template>
  <component :is="isDiv ? 'div' : 'fieldset'" ref="rootEl" v-bind="rootBindings">
    <component :is="isDiv ? 'span' : 'legend'" v-if="hasLabel" :id="labelId" class="g-radio-group__label"><slot name="label">{{ label }}</slot><template v-if="ff.mark.value === 'optional' && ff.markText.value">{{ ' ' }}<span class="g-radio-group__optional">{{ ff.markText.value }}</span></template><span v-if="ff.mark.value === 'required'" class="g-radio-group__required" aria-hidden="true">*</span></component>
    <div class="g-radio-group__options">
      <label v-for="(o, i) in items" :key="optId(i)" :class="['g-radio-group__option', { 'is-disabled': o.disabled, 'is-icon-only': iconOnly(o) }]" :for="optId(i)">
        <input
          :id="optId(i)"
          class="g-radio-group__input"
          type="radio"
          :name="groupName"
          :value="String(o.value)"
          :checked="i === checkedIndex"
          :disabled="o.disabled || (isDiv && isDisabled) || undefined"
          :aria-labelledby="`${optId(i)}-label`"
          :aria-describedby="descOf(o) ? `${optId(i)}-description` : undefined"
        >
        <Body :wrap="isSegmented">
          <span v-if="$slots.option" :id="`${optId(i)}-label`" class="g-radio-group__option-label" dir="auto"><slot name="option" v-bind="ctx(o, i)" /></span>
          <template v-else>
            <span v-if="hasIcon(o)" class="g-radio-group__icon" aria-hidden="true"><slot v-if="$slots.icon" name="icon" v-bind="iconCtx(o, i)" /><GAppIcon v-else :name="o.icon" /></span>
            <span class="g-radio-group__text"><span :id="`${optId(i)}-label`" class="g-radio-group__option-label" dir="auto">{{ o.label }}</span><span v-if="descOf(o)" :id="`${optId(i)}-description`" class="g-radio-group__description">{{ descOf(o) }}</span></span>
          </template>
        </Body>
      </label>
    </div>
    <div v-if="showSupport" class="g-radio-group__support">
      <div v-if="hasHint" :id="hintId" class="g-radio-group__hint"><slot name="hint">{{ hint }}</slot></div>
      <div v-if="isField" :id="ff.messageId.value" class="g-radio-group__message" :aria-live="ff.live.value"><template v-if="message"><GIcon class="g-radio-group__message-icon" :name="messageIcon(message.type)" /><span v-if="message.prefix" class="g-radio-group__message-type">{{ message.prefix }}</span><slot v-if="message.type === 'error'" name="error">{{ message.text }}</slot><template v-else>{{ message.text }}</template></template></div>
    </div>
  </component>
</template>
