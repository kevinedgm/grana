<script setup>
// GSelect · selector de una opción con lista propia (dueño: bruno)
// Contrato: design/contracts/select.md · Estructura: design/lab/select/r01/ · Estilo: GSelect.css (coco)
// Patrón: combobox de solo selección (WAI-ARIA APG). El foco no sale del botón: la opción activa se
// indica con aria-activedescendant.
import { computed, mergeProps, nextTick, onBeforeUnmount, ref, useAttrs, useId, useSlots, watch } from 'vue'
import { oneOf } from '../../utils/oneOf.js'

defineOptions({ name: 'GSelect', inheritAttrs: false })

const props = defineProps({
  modelValue: { type: [String, Number], default: null },
  options: { type: Array, default: () => [] },
  variant: { type: String, default: 'outline', validator: oneOf(['outline', 'soft']) },
  size: { type: String, default: 'md', validator: oneOf(['xs', 'sm', 'md', 'lg', 'xl']) },
  density: { type: String, default: 'default', validator: oneOf(['default', 'comfortable', 'compact']) },
  color: { type: String, default: undefined, validator: oneOf(['brand', 'accent', 'neutral', 'success', 'warning', 'danger', 'info']) },
  rounded: { type: String, default: undefined, validator: oneOf(['none', 'xs', 'sm', 'md', 'lg', 'xl', 'pill']) },
  block: Boolean,
  disabled: Boolean,
  readonly: Boolean,
  loading: Boolean,
  placeholder: { type: String, default: undefined },
  clearable: Boolean,
  clearLabel: { type: String, default: undefined },
  emptyText: { type: String, default: undefined },
  label: { type: String, default: undefined },
  hint: { type: String, default: undefined },
  error: { type: String, default: undefined },
  required: Boolean,
  name: { type: String, default: undefined },
  id: { type: String, default: undefined }
})

// Solo estos eventos se declaran: el resto llega al botón por $attrs.
const emit = defineEmits(['update:modelValue', 'open', 'close'])

const attrs = useAttrs()
const slots = useSlots()

const uid = useId()
const buttonId = computed(() => props.id || `g-select-${uid}`)
const labelId = computed(() => `${buttonId.value}-label`)
const listId = computed(() => `${buttonId.value}-list`)
const hintId = computed(() => `${buttonId.value}-hint`)
const errorId = computed(() => `${buttonId.value}-error`)
const optId = (i) => `${buttonId.value}-opt-${i}`
const groupId = (g) => `${buttonId.value}-grp-${g}`

const invalid = computed(() => Boolean(props.error))
const hasLabel = computed(() => Boolean(props.label || slots.label))
const hasHint = computed(() => Boolean(props.hint || slots.hint))

// ---------- Opciones: se aplanan (con índice global) y se conserva la estructura para pintar grupos ----------
const isDev = typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production'
const validOption = (o) => o && typeof o === 'object' && o.value !== undefined && o.value !== null && typeof o.label === 'string'
const model = computed(() => {
  const items = []
  const entries = []
  const seen = new Set()
  let g = 0
  const add = (o) => {
    if (!validOption(o)) return null
    if (isDev && seen.has(o.value)) console.warn(`[Grana] <GSelect> tiene dos opciones con el mismo value (${String(o.value)}).`)
    seen.add(o.value)
    const item = { index: items.length, value: o.value, label: o.label, disabled: Boolean(o.disabled), raw: o }
    items.push(item)
    return item
  }
  for (const o of props.options) {
    if (o && Array.isArray(o.options)) {
      const group = { group: g++, label: String(o.label ?? ''), items: [] }
      for (const child of o.options) {
        const it = add(child)
        if (it) group.items.push(it)
      }
      entries.push(group)
    } else {
      const it = add(o)
      if (it) entries.push(it)
    }
  }
  return { items, entries }
})
const items = computed(() => model.value.items)
const selected = computed(() => (props.modelValue === null || props.modelValue === undefined ? null : items.value.find((i) => i.value === props.modelValue) ?? null))
const enabled = computed(() => items.value.filter((i) => !i.disabled))
const showClear = computed(() => props.clearable && Boolean(props.clearLabel) && Boolean(selected.value) && !props.disabled && !props.readonly)

// ---------- Estado ----------
const button = ref(null)
const list = ref(null)
const control = ref(null)
const open = ref(false)
const up = ref(false)
const activeIndex = ref(-1)
const activeId = computed(() => (open.value && activeIndex.value >= 0 ? optId(activeIndex.value) : undefined))

function emitChange(value) {
  emit('update:modelValue', value)
}

// ---------- Posición: variables CSS dinámicas sobre la lista ----------
function place() {
  const el = list.value
  const box = control.value
  if (!el || !box) return
  const r = box.getBoundingClientRect()
  const vh = window.innerHeight
  const need = el.scrollHeight + 4
  const below = vh - r.bottom - 8
  const above = r.top - 8
  const goUp = below < need && above > below
  up.value = goUp
  el.style.setProperty('--_x', `${r.left}px`)
  el.style.setProperty('--_min', `${r.width}px`)
  if (goUp) {
    el.style.setProperty('--_top', 'auto')
    el.style.setProperty('--_bottom', `${vh - r.top + 4}px`)
    el.style.setProperty('--_max', `${Math.max(above, 0)}px`)
  } else {
    el.style.setProperty('--_top', `${r.bottom + 4}px`)
    el.style.setProperty('--_bottom', 'auto')
    el.style.setProperty('--_max', `${Math.max(below, 0)}px`)
  }
}
const onReposition = () => {
  if (open.value) place()
}

function scrollActive() {
  nextTick(() => {
    const el = list.value?.ownerDocument.getElementById(optId(activeIndex.value))
    if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' })
  })
}

// ---------- Abrir y cerrar ----------
function show() {
  if (open.value || props.disabled || props.readonly) return
  open.value = true
  const start = selected.value && !selected.value.disabled ? selected.value : enabled.value[0]
  activeIndex.value = start ? start.index : -1
  nextTick(() => {
    const el = list.value
    if (el && typeof el.showPopover === 'function') el.showPopover()
    place()
    scrollActive()
  })
  document.addEventListener('pointerdown', onOutside)
  window.addEventListener('resize', onReposition)
  window.addEventListener('scroll', onReposition, true)
  emit('open')
}

function hide() {
  if (!open.value) return
  open.value = false
  activeIndex.value = -1
  typed = ''
  const el = list.value
  if (el && typeof el.hidePopover === 'function' && el.matches?.(':popover-open')) el.hidePopover()
  document.removeEventListener('pointerdown', onOutside)
  window.removeEventListener('resize', onReposition)
  window.removeEventListener('scroll', onReposition, true)
  emit('close')
}

function choose(item, { refocus = true } = {}) {
  if (!item || item.disabled) return
  if (item.value !== props.modelValue) emitChange(item.value)
  hide()
  if (refocus) button.value?.focus()
}

function clear() {
  emitChange(null)
  button.value?.focus()
}

// Clic fuera: un pointerdown fuera del selector y de la lista cierra; en la hoja, el fondo cuenta como fuera.
function onOutside(event) {
  const l = list.value
  const box = control.value
  if (!l || !box) return
  if (box.contains(event.target)) return
  if (l.contains(event.target) && event.target !== l) return
  hide()
}
watch(() => [props.disabled, props.readonly], () => hide())
onBeforeUnmount(() => {
  if (open.value) hide()
  clearTimeout(typedTimer)
})

// ---------- Teclado ----------
let typed = ''
let typedTimer = null

function moveActive(step) {
  const list_ = enabled.value
  if (!list_.length) return
  const cur = list_.findIndex((i) => i.index === activeIndex.value)
  let next
  if (step === 'first') next = 0
  else if (step === 'last') next = list_.length - 1
  else next = Math.max(0, Math.min(list_.length - 1, (cur < 0 ? 0 : cur) + step))
  activeIndex.value = list_[next].index
  scrollActive()
}

function typeahead(ch) {
  clearTimeout(typedTimer)
  typed += ch.toLowerCase()
  typedTimer = setTimeout(() => { typed = '' }, 500)
  const list_ = enabled.value
  if (!list_.length) return
  const cur = list_.findIndex((i) => i.index === activeIndex.value)
  const from = Math.max(0, cur) + (typed.length === 1 ? 1 : 0)
  const order = [...list_.slice(from), ...list_.slice(0, from)]
  const hit = order.find((i) => i.label.toLowerCase().startsWith(typed))
  if (hit) {
    activeIndex.value = hit.index
    scrollActive()
  }
}

function onKeydown(event) {
  if (props.disabled || props.readonly) return
  const k = event.key
  const printable = k.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey
  if (!open.value) {
    if (k === 'ArrowDown' || k === 'ArrowUp' || k === 'Enter' || k === ' ') {
      event.preventDefault()
      show()
    } else if (printable) {
      event.preventDefault()
      show()
      nextTick(() => typeahead(k))
    }
    return
  }
  if (k === 'ArrowDown') { event.preventDefault(); moveActive(1) }
  else if (k === 'ArrowUp') { event.preventDefault(); moveActive(-1) }
  else if (k === 'Home') { event.preventDefault(); moveActive('first') }
  else if (k === 'End') { event.preventDefault(); moveActive('last') }
  else if (k === 'PageDown') { event.preventDefault(); moveActive(10) }
  else if (k === 'PageUp') { event.preventDefault(); moveActive(-10) }
  else if (k === 'Enter' || (k === ' ' && !typed)) { event.preventDefault(); choose(items.value[activeIndex.value]) }
  else if (k === 'Escape') { event.preventDefault(); hide() }
  else if (k === 'Tab') {
    // Elige la activa y sigue el orden del documento (sin devolver el foco al botón)
    const it = items.value[activeIndex.value]
    if (it && !it.disabled && it.value !== props.modelValue) emitChange(it.value)
    hide()
  } else if (printable) { event.preventDefault(); typeahead(k) }
}

function onButtonClick() {
  if (props.disabled || props.readonly) return
  if (open.value) hide()
  else show()
}

// La lista no roba el foco del botón
function onListPointerdown(event) {
  event.preventDefault()
}
function onListClick(event) {
  const li = event.target.closest?.('[role="option"]')
  if (!li) return
  const item = items.value[Number(li.dataset.index)]
  if (item) choose(item)
}
function onListPointermove(event) {
  const li = event.target.closest?.('[role="option"]')
  if (!li) return
  const item = items.value[Number(li.dataset.index)]
  if (item && !item.disabled) activeIndex.value = item.index
}

// ---------- Marcado ----------
const rootAttrs = computed(() => ({ class: attrs.class, style: attrs.style }))
const buttonAttrs = computed(() => {
  const { class: _class, style: _style, ...rest } = attrs
  return rest
})

const classes = computed(() => [
  'g-select',
  `g-select--variant-${props.variant}`,
  `g-select--size-${props.size}`,
  `g-select--density-${props.density}`,
  props.color && `g-select--color-${props.color}`,
  props.rounded && `g-select--rounded-${props.rounded}`,
  {
    'g-select--block': props.block,
    'is-open': open.value,
    'is-disabled': props.disabled,
    'is-readonly': props.readonly,
    'is-invalid': invalid.value,
    'is-loading': props.loading
  }
])

const describedBy = computed(() => {
  const ids = [attrs['aria-describedby'], hasHint.value && hintId.value, invalid.value && errorId.value].filter(Boolean)
  return ids.length ? ids.join(' ') : undefined
})
const labelledBy = computed(() => (hasLabel.value ? `${labelId.value} ${buttonId.value}` : attrs['aria-labelledby']))

const controlled = computed(() => ({
  id: buttonId.value,
  type: 'button',
  role: 'combobox',
  'aria-haspopup': 'listbox',
  'aria-expanded': open.value ? 'true' : 'false',
  'aria-controls': listId.value,
  'aria-activedescendant': activeId.value,
  'aria-labelledby': labelledBy.value,
  'aria-describedby': describedBy.value,
  'aria-invalid': invalid.value ? 'true' : undefined,
  'aria-required': props.required ? 'true' : undefined,
  'aria-readonly': props.readonly ? 'true' : undefined,
  'aria-busy': props.loading ? 'true' : undefined,
  disabled: props.disabled || undefined
}))
// Nuestros manejadores van PRIMERO (mismo criterio que GInput y GCheckbox)
const buttonBindings = computed(() => mergeProps({ onClick: onButtonClick, onKeydown }, { ...buttonAttrs.value, ...controlled.value }))

const listLabelledBy = computed(() => (hasLabel.value ? labelId.value : attrs['aria-labelledby']))
const hiddenValue = computed(() => (selected.value ? String(selected.value.value) : ''))
const emptyVisible = computed(() => items.value.length === 0 && Boolean(props.emptyText || slots.empty))

if (isDev) {
  if (!hasLabel.value && !attrs['aria-label'] && !attrs['aria-labelledby']) {
    console.warn('[Grana] <GSelect> necesita label, slot label, aria-label o aria-labelledby para tener un nombre accesible.')
  }
  if (props.clearable && !props.clearLabel) {
    console.warn('[Grana] <GSelect clearable> necesita clearLabel para mostrar el botón de limpiar.')
  }
}
</script>

<template>
  <div v-bind="rootAttrs" :class="classes">
    <label v-if="hasLabel" :id="labelId" class="g-select__label" :for="buttonId">
      <slot name="label">{{ label }}</slot>
      <span v-if="required" class="g-select__required" aria-hidden="true">*</span>
    </label>
    <div ref="control" class="g-select__control">
      <button ref="button" v-bind="buttonBindings" class="g-select__button">
        <span class="g-select__value" :class="{ 'g-select__value--placeholder': !selected }"><slot v-if="selected" name="value" :option="selected.raw">{{ selected.label }}</slot><template v-else>{{ placeholder }}</template></span>
        <span class="g-select__arrow" aria-hidden="true" />
      </button>
      <button v-if="showClear" class="g-select__clear" type="button" :aria-label="clearLabel" @click="clear" />
      <span v-if="loading" class="g-select__loader" aria-hidden="true" />
    </div>
    <input v-if="name" type="hidden" :name="name" :value="hiddenValue" :disabled="disabled || undefined">
    <ul
      ref="list"
      :id="listId"
      class="g-select__list"
      :class="{ 'is-up': up }"
      role="listbox"
      popover="manual"
      :aria-label="attrs['aria-label']"
      :aria-labelledby="attrs['aria-label'] ? undefined : listLabelledBy"
      @pointerdown="onListPointerdown"
      @click="onListClick"
      @pointermove="onListPointermove"
    >
      <template v-for="entry in model.entries" :key="entry.group !== undefined ? `g${entry.group}` : entry.index">
        <li v-if="entry.group !== undefined" role="presentation">
          <ul class="g-select__group" role="group" :aria-labelledby="groupId(entry.group)">
            <li :id="groupId(entry.group)" class="g-select__group-label" role="presentation">{{ entry.label }}</li>
            <li
              v-for="item in entry.items"
              :id="optId(item.index)"
              :key="item.index"
              class="g-select__option"
              :class="{ 'is-active': item.index === activeIndex }"
              role="option"
              :data-index="item.index"
              :aria-selected="selected && selected.index === item.index ? 'true' : 'false'"
              :aria-disabled="item.disabled ? 'true' : undefined"
            ><slot name="option" :option="item.raw" :selected="Boolean(selected && selected.index === item.index)" :active="item.index === activeIndex">{{ item.label }}</slot></li>
          </ul>
        </li>
        <li
          v-else
          :id="optId(entry.index)"
          class="g-select__option"
          :class="{ 'is-active': entry.index === activeIndex }"
          role="option"
          :data-index="entry.index"
          :aria-selected="selected && selected.index === entry.index ? 'true' : 'false'"
          :aria-disabled="entry.disabled ? 'true' : undefined"
        ><slot name="option" :option="entry.raw" :selected="Boolean(selected && selected.index === entry.index)" :active="entry.index === activeIndex">{{ entry.label }}</slot></li>
      </template>
      <li v-if="emptyVisible" class="g-select__empty" role="presentation"><slot name="empty">{{ emptyText }}</slot></li>
    </ul>
    <div v-if="hasHint" :id="hintId" class="g-select__hint"><slot name="hint">{{ hint }}</slot></div>
    <div :id="errorId" class="g-select__error" aria-live="polite"><template v-if="invalid"><slot name="error">{{ error }}</slot></template></div>
  </div>
</template>
