<script setup>
// GSelect · selector de una opción con lista propia (dueño: bruno)
// Contrato: design/contracts/select.md · Estructura: design/lab/select/r01/ · Estilo: GSelect.css (coco)
// Patrón: combobox de solo selección (WAI-ARIA APG). El foco no sale del botón: la opción activa se
// indica con aria-activedescendant.
import { Comment, Fragment, Text, computed, mergeProps, nextTick, onBeforeUnmount, onMounted, ref, useAttrs, useId, useSlots, watch } from 'vue'
import { oneOf } from '../../utils/oneOf.js'
import GIcon from '../GIcon/GLibIcon.js'
import { messageIcon, nextFrame, spaceUnit, useFormField } from '../GForm/formContext.js'
import { anchorGone, followFrame, isPhone, px, setVar, stickySide } from '../../utils/anchor.js'
import { fold } from '../../utils/match.js'
import { repeatGesture } from '../../utils/menuNav.js'
import { aimed, placeHighlight } from '../../utils/glide.js'

defineOptions({ name: 'GSelect', inheritAttrs: false })

const props = defineProps({
  modelValue: { type: [String, Number], default: null },
  options: { type: Array, default: () => [] },
  variant: { type: String, default: 'outline', validator: oneOf(['outline', 'soft']) },
  size: { type: String, default: 'md', validator: oneOf(['xs', 'sm', 'md', 'lg', 'xl']) },
  // density, block, disabled, readonly y error sin valor por defecto: la prop explícita gana al contexto de GForm (form.md §2)
  density: { type: String, default: undefined, validator: oneOf(['default', 'comfortable', 'compact']) },
  color: { type: String, default: undefined, validator: oneOf(['brand', 'accent', 'neutral', 'success', 'warning', 'danger', 'info']) },
  rounded: { type: String, default: undefined, validator: oneOf(['none', 'xs', 'sm', 'md', 'lg', 'xl', 'pill']) },
  block: { type: Boolean, default: undefined },
  disabled: { type: Boolean, default: undefined },
  readonly: { type: Boolean, default: undefined },
  loading: Boolean,
  placeholder: { type: String, default: undefined },
  clearable: Boolean,
  clearLabel: { type: String, default: undefined },
  emptyText: { type: String, default: undefined },
  createLabel: { type: String, default: undefined },
  label: { type: String, default: undefined },
  hint: { type: String, default: undefined },
  error: { type: String, default: undefined },
  warning: { type: String, default: undefined },
  valid: { type: String, default: undefined },
  required: Boolean,
  mark: { type: Boolean, default: undefined },
  name: { type: String, default: undefined },
  id: { type: String, default: undefined }
})

// Solo estos eventos se declaran: el resto llega al botón por $attrs.
const emit = defineEmits(['update:modelValue', 'open', 'close', 'create'])

const attrs = useAttrs()
const slots = useSlots()

const uid = useId()
const buttonId = computed(() => props.id || `g-select-${uid}`)
const labelId = computed(() => `${buttonId.value}-label`)
const listId = computed(() => `${buttonId.value}-list`)
const hintId = computed(() => `${buttonId.value}-hint`)
const optId = (i) => (i === createIndex.value ? `${buttonId.value}-opt-create` : `${buttonId.value}-opt-${i}`)
const groupId = (g) => `${buttonId.value}-grp-${g}`

const rootEl = ref(null)
const button = ref(null)
// Contexto de GForm (form.md §2). Sin `input` nativo que burbujee: al elegir llama a notifyChange() (C9)
const ff = useFormField({
  id: buttonId,
  name: () => props.name,
  error: () => props.error,
  warning: () => props.warning,
  valid: () => props.valid,
  required: () => props.required,
  readonly: () => props.readonly,
  disabled: () => props.disabled,
  density: () => props.density,
  block: () => props.block,
  mark: () => props.mark,
  trigger: 'change',
  control: button,
  root: rootEl
})
const isDisabled = ff.disabled
const isReadonly = ff.readonly
const message = ff.message
const invalid = ff.invalid
const hasLabel = computed(() => Boolean(props.label || slots.label))
const hasHint = computed(() => Boolean(props.hint || slots.hint))

// ---------- Opciones: se aplanan (con índice global) y se conserva la estructura para pintar grupos ----------
const validOption = (o) => o && typeof o === 'object' && o.value !== undefined && o.value !== null && typeof o.label === 'string'
const model = computed(() => {
  const items = []
  const entries = []
  const seen = new Set()
  let g = 0
  const add = (o) => {
    if (!validOption(o)) return null
    try { if (process.env.NODE_ENV !== 'production' && seen.has(o.value)) console.warn(`[Grana] <GSelect> tiene dos opciones con el mismo value (${String(o.value)}).`) } catch {}
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
// Fila «Agregar nuevo…»: un elemento virtual, siempre el último; no está en `options`, ni en `modelValue`, ni en la escritura rápida
const createVisible = computed(() => Boolean(props.createLabel) && !isDisabled.value && !isReadonly.value)
const createIndex = computed(() => items.value.length)
const createItem = computed(() => ({ index: createIndex.value, label: props.createLabel, disabled: false, create: true }))
const navigable = computed(() => (createVisible.value ? [...enabled.value, createItem.value] : enabled.value))
const itemAt = (i) => (i === createIndex.value ? (createVisible.value ? createItem.value : undefined) : items.value[i])
const showClear = computed(() => props.clearable && Boolean(props.clearLabel) && Boolean(selected.value) && !isDisabled.value && !isReadonly.value)

// ---------- Estado ----------
const list = ref(null)
const control = ref(null)
const open = ref(false)
const activeIndex = ref(-1)
const activeId = computed(() => (open.value && activeIndex.value >= 0 ? optId(activeIndex.value) : undefined))
let keyMoved = false // una tecla (o una letra con coincidencia) movió la activa en esta apertura; solo eso hace que Tab elija (#1016)
let moved = false // la persona movió la activa (teclas, puntero o letras): la de partida deja de serlo
let lastX = null // última posición del puntero sobre la lista (o la del clic que la abrió)
let lastY = null

function emitChange(value) {
  emit('update:modelValue', value)
  ff.notifyChange()
}

// ---------- Posición: variables CSS dinámicas sobre la lista ----------
// Panel estable al desplazar (reporte del usuario sobre GCombobox; utils/anchor.js): el lado se decide AL ABRIR y se
// conserva (solo cambia si el actual baja de space × 40 y el otro ofrece space × 12 más); --_min y --_max se fijan al abrir,
// al cambiar el contenido, en resize y al cambiar de lado. Durante el desplazamiento de la página solo se escribe la
// posición, una vez por cuadro y solo si cambia. Si la caja sale del visor (o de su contenedor con desplazamiento), la
// lista se cierra; salvo en la hoja móvil, que no sigue a la caja.
let side = null // 'bottom' | 'top' mientras está abierta
function place(full = true) {
  const el = list.value
  const box = control.value
  if (!el || !box) return
  const r = box.getBoundingClientRect()
  const vh = window.innerHeight
  const below = vh - r.bottom - 8
  const above = r.top - 8
  const prev = side
  if (!side) {
    const need = el.scrollHeight + 4
    side = below < need && above > below ? 'top' : 'bottom'
  } else side = stickySide(side, { below, above, unit: spaceUnit(rootEl.value) })
  const goUp = side === 'top'
  el.classList.toggle('is-up', goUp)
  // --_x es la distancia desde el borde INICIAL del visor (la lista usa inset-inline-start): en RTL, desde la derecha
  const rtl = window.getComputedStyle(el).direction === 'rtl'
  setVar(el, '--_x', px(rtl ? el.ownerDocument.documentElement.clientWidth - r.right : r.left))
  if (full) setVar(el, '--_min', px(r.width))
  if (full || side !== prev) setVar(el, '--_max', px(Math.max(goUp ? above : below, 0)))
  setVar(el, '--_top', goUp ? 'auto' : px(r.bottom + 4))
  setVar(el, '--_bottom', goUp ? px(vh - r.top + 4) : 'auto')
}
const follow = followFrame((scroller) => {
  if (!open.value) return
  if (!isPhone() && anchorGone(control.value, scroller)) { hide(); return }
  place(false)
})
const refit = () => {
  place()
  settle(false, true)
}
const onResize = () => {
  if (open.value) refit()
}
const onScroll = (event) => {
  const t = event && event.target
  if (!open.value || (t && t.nodeType === 1 && list.value?.contains(t))) return // la propia lista se desplaza
  follow.schedule(t)
}
// Una sola luz (select.md, #1004): sigue a la activa, con la lista abierta. Una pasada por cambio: primero se desplaza y
// luego placeHighlight lee y escribe, sin más lecturas. Cerrando no se toca: la luz se queda durante la salida (hide()
// pone activeIndex en −1). Al desplazar la lista no hay nada que escribir: la capa va con el contenido.
// Las clases de la lista van por classList (is-up, is-keyed): un :class reescribiría has-highlight, que pone glide.js.
function settle(scroll, instant) {
  nextTick(() => {
    const l = list.value
    if (!l || !open.value) return
    const el = l.querySelector(`[data-index="${activeIndex.value}"]`) // por índice y en su lista: useId se repite entre aplicaciones
    if (scroll && el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' })
    placeHighlight(l, el, { instant, layer: l.firstElementChild })
  })
}
const setKeyed = (on) => list.value?.classList.toggle('is-keyed', on)

// ---------- Abrir y cerrar ----------
function show() {
  if (open.value || isDisabled.value || isReadonly.value || !hasRows.value) return
  open.value = true
  moved = false
  keyMoved = false
  const start = selected.value && !selected.value.disabled ? selected.value : (enabled.value[0] ?? (createVisible.value ? createItem.value : null))
  activeIndex.value = start ? start.index : -1
  nextTick(() => {
    const el = list.value
    if (el && typeof el.showPopover === 'function') el.showPopover()
    place()
    settle(true, true) // en cada apertura: has-highlight puede venir de la anterior y nunca viaja desde allí
  })
  document.addEventListener('pointerdown', onOutside)
  window.addEventListener('resize', onResize)
  window.addEventListener('scroll', onScroll, true)
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
  window.removeEventListener('resize', onResize)
  window.removeEventListener('scroll', onScroll, true)
  follow.cancel()
  side = null
  lastX = lastY = null
  emit('close')
}

function choose(item, { refocus = true } = {}) {
  if (!item || item.disabled) return
  if (item.create) {
    // Cierra, devuelve el foco al selector y DESPUÉS emite: un diálogo de la aplicación restaura el foco aquí
    hide()
    button.value?.focus()
    emit('create')
    return
  }
  if (item.value !== props.modelValue) emitChange(item.value)
  hide()
  if (refocus) button.value?.focus()
}

function clear() {
  emitChange(null)
  hide()
  button.value?.focus()
}

// Clic fuera: un pointerdown fuera del selector y de la lista cierra; en la hoja, el fondo cuenta como fuera.
function onOutside(event) {
  const l = list.value
  const box = control.value
  if (!l || !box) return
  if (box.contains(event.target)) return
  if (l.contains(event.target)) {
    // El ::backdrop de la hoja llega con la lista como destino: dentro de su rectángulo (relleno, barra) no es «fuera»
    if (event.target !== l) return
    const r = l.getBoundingClientRect()
    if (event.clientX >= r.left && event.clientX < r.right && event.clientY >= r.top && event.clientY < r.bottom) return
  }
  hide()
}
watch(() => [isDisabled.value, isReadonly.value], () => hide())
onBeforeUnmount(() => {
  if (open.value) hide()
  clearTimeout(typedTimer)
})

// ---------- Teclado ----------
let typed = ''
let typedTimer = null

function moveActive(step) {
  const list_ = navigable.value
  if (!list_.length) return
  const cur = list_.findIndex((i) => i.index === activeIndex.value)
  let next
  if (step === 'first') next = 0
  else if (step === 'last') next = list_.length - 1
  else next = Math.max(0, Math.min(list_.length - 1, (cur < 0 ? 0 : cur) + step))
  const changed = list_[next].index !== activeIndex.value
  activeIndex.value = list_[next].index
  moved = true
  if (changed) keyMoved = true
  setKeyed(true)
  settle(true)
}

function typeahead(ch) {
  clearTimeout(typedTimer)
  typed += ch
  typedTimer = setTimeout(() => { typed = '' }, 500)
  const list_ = enabled.value
  if (!list_.length) return
  const q = fold(typed)
  const cur = list_.findIndex((i) => i.index === activeIndex.value)
  const find = (from, s) => {
    const order = [...list_.slice(from), ...list_.slice(0, from)]
    return order.find((i) => fold(i.label).startsWith(s))
  }
  // La activa de partida (ni elegida ni movida) entra en la búsqueda; una letra suelta ya movida busca desde la siguiente
  const atStart = cur >= 0 && !moved && !(selected.value && selected.value.index === activeIndex.value)
  let hit
  if (q.length === 1) hit = find(atStart ? cur : cur + 1, q)
  else {
    hit = find(Math.max(cur, 0), q)
    // La misma letra repetida («b», «b»): recorre las que empiezan por ella (APG)
    if (!hit && Array.from(q).every((c) => c === q[0])) hit = find(cur + 1, q[0])
  }
  if (hit) {
    activeIndex.value = hit.index
    moved = true
    keyMoved = true
    setKeyed(true)
    settle(true)
  }
}

function onKeydown(event) {
  if (isDisabled.value || isReadonly.value) return
  // Una activación por gesto (#661): Intro o Espacio mantenidos no abren, no cierran y no eligen
  if (repeatGesture(event)) { event.preventDefault(); return }
  const k = event.key
  const printable = k.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey
  if (!open.value) {
    if (k === 'ArrowDown' || k === 'ArrowUp' || k === 'Enter' || k === ' ') {
      event.preventDefault()
      setKeyed(true)
      show()
    } else if (printable) {
      event.preventDefault()
      setKeyed(true)
      show()
      nextTick(() => { if (open.value) typeahead(k) })
    }
    return
  }
  if (k === 'ArrowDown') { event.preventDefault(); moveActive(1) }
  else if (k === 'ArrowUp') { event.preventDefault(); moveActive(-1) }
  else if (k === 'Home') { event.preventDefault(); moveActive('first') }
  else if (k === 'End') { event.preventDefault(); moveActive('last') }
  else if (k === 'PageDown') { event.preventDefault(); moveActive(10) }
  else if (k === 'PageUp') { event.preventDefault(); moveActive(-10) }
  else if (k === 'Enter' || (k === ' ' && !typed)) { event.preventDefault(); choose(itemAt(activeIndex.value)) }
  else if (k === 'Escape') {
    // Esc cierra solo la lista: no debe llegar a un GDialog (u otro ancestro) que también escuche Esc
    event.preventDefault()
    event.stopPropagation()
    hide()
  }
  else if (k === 'Tab') {
    // Elige la activa solo si una tecla la movió en esta apertura (#1016); sigue el orden del documento (sin devolver el foco)
    const it = keyMoved ? itemAt(activeIndex.value) : null
    if (it && !it.create && !it.disabled && it.value !== props.modelValue) emitChange(it.value)
    hide()
  } else if (printable) { event.preventDefault(); typeahead(k) }
}

function onButtonClick(event) {
  if (isDisabled.value || isReadonly.value || repeatGesture(event)) return
  if (open.value) hide()
  else {
    // Posición del clic: si la lista aparece bajo el puntero quieto, no le quita la activa al teclado
    if (event && event.detail > 0) { lastX = event.clientX; lastY = event.clientY }
    // Safari y Firefox en macOS no enfocan un botón al hacer clic: sin foco en él, Esc, Inicio, Fin y las flechas no llegan
    // (verificado con Playwright en WebKit). En Chromium ya está enfocado: no cambia nada. preventScroll: no mueve la página.
    if (button.value && button.value.ownerDocument.activeElement !== button.value) button.value.focus({ preventScroll: true })
    setKeyed(false)
    show()
  }
}

// La lista no roba el foco del botón
function onListPointerdown(event) {
  event.preventDefault()
  setKeyed(false)
}
function onListClick(event) {
  const li = event.target.closest?.('[role="option"]')
  if (!li) return
  const item = itemAt(Number(li.dataset.index))
  if (item) choose(item)
}
// Solo un movimiento REAL del puntero activa: el primer evento tras abrir con teclado solo anota dónde está, y uno sin
// desplazamiento (la lista o la página que se mueven bajo el puntero quieto) se ignora. La activa por puntero nunca
// desplaza la lista (settle(true) es solo del teclado y de la apertura). Solo ratón y lápiz: un arrastre táctil por la hoja
// no la mueve, y tocar una opción la elige por su fila. Sobre un hueco, un título o una deshabilitada, nada cambia.
function onListPointermove(event) {
  if (!aimed(event)) return
  const still = lastX === null || (event.clientX === lastX && event.clientY === lastY)
  lastX = event.clientX
  lastY = event.clientY
  if (still) return
  const li = event.target.closest?.('[role="option"]')
  if (!li) return
  const item = itemAt(Number(li.dataset.index))
  if (!item || item.disabled) return
  setKeyed(false)
  moved = true
  if (item.index === activeIndex.value) return
  keyMoved = false // el último que mueve la activa manda
  activeIndex.value = item.index
  settle()
}

// La etiqueta solo enfoca, como en un <select> nativo: se cancela la activación nativa del <label for>, que abriría la lista
function onLabelClick(event) {
  event.preventDefault()
  if (isDisabled.value) return
  button.value?.focus({ preventScroll: true })
  if (open.value) hide()
}

// ---------- Marcado ----------
const rootAttrs = computed(() => ({ class: attrs.class, style: attrs.style }))
const buttonAttrs = computed(() => {
  const { class: _class, style: _style, ...rest } = attrs
  return rest
})

// is-ready: dos cuadros después de montar (tras el primer pintado; nunca en SSR). Sin ella, coco no anima la entrada del
// mensaje (I1, #304 y #306): un error que ya viene al montar no se anima (como GInput; plan 012)
const ready = ref(false)
let unmounted = false
onMounted(() => nextFrame(() => nextFrame(() => { if (!unmounted) ready.value = true })))
onBeforeUnmount(() => { unmounted = true })

const classes = computed(() => [
  'g-select',
  `g-select--variant-${props.variant}`,
  `g-select--size-${props.size}`,
  `g-select--density-${ff.density.value}`,
  props.color && `g-select--color-${props.color}`,
  props.rounded && `g-select--rounded-${props.rounded}`,
  {
    'g-select--block': ff.block.value,
    'is-open': open.value,
    'is-disabled': isDisabled.value,
    'is-readonly': isReadonly.value,
    'is-invalid': invalid.value,
    'is-warning': ff.ownMessage.value?.type === 'warning',
    'is-valid': ff.ownMessage.value?.type === 'valid',
    'is-loading': props.loading,
    'is-ready': ready.value,
    // La pone GForm en un envío con errores o showErrors() (#304); el CSS de la sacudida es de coco
    'is-rejected': ff.rejected.value
  }
])

const describedBy = computed(() => {
  const ids = [attrs['aria-describedby'], hasHint.value && hintId.value, message.value && ff.messageId.value].filter(Boolean)
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
  'aria-readonly': isReadonly.value ? 'true' : undefined,
  'aria-busy': props.loading ? 'true' : undefined,
  disabled: isDisabled.value || undefined
}))
// Nuestros manejadores van PRIMERO (mismo criterio que GInput y GCheckbox)
// y los del contexto de GForm antes que los nuestros (form.md §2, C8)
const buttonBindings = computed(() => mergeProps(ff.handlers, { onClick: onButtonClick, onKeydown }, { ...buttonAttrs.value, ...controlled.value }))

const listLabelledBy = computed(() => (hasLabel.value ? labelId.value : attrs['aria-labelledby']))
// Un valor sin opción sigue siendo el valor (el catálogo puede no haber llegado): se envía; solo null y undefined envían ''
const hiddenValue = computed(() => (props.modelValue === null || props.modelValue === undefined ? '' : String(props.modelValue)))
// Valor sin opción con el catálogo ya cargado (con `loading` o sin opciones, aún no ha llegado)
const orphan = computed(() => (props.modelValue !== null && props.modelValue !== undefined && !selected.value && !props.loading && items.value.length > 0 ? String(props.modelValue) : null))
const warnedOrphans = new Set()
watch(orphan, (v) => {
  if (v === null || warnedOrphans.has(v)) return
  warnedOrphans.add(v)
  try { if (process.env.NODE_ENV !== 'production') console.warn(`[Grana] <GSelect> tiene un valor (${v}) sin opción correspondiente: se conserva y se envía, pero muestra el placeholder.`) } catch {}
}, { immediate: true })
// Un icono solo se pinta si el slot devuelve contenido para esa opción (una opción sin icono no reserva espacio)
const isEmptyNode = (v) => v.type === Comment || (v.type === Text && !String(v.children ?? '').trim()) || (v.type === Fragment && (!Array.isArray(v.children) || v.children.every(isEmptyNode)))
const hasIcon = (raw) => Boolean(slots.icon) && slots.icon({ option: raw }).some((v) => !isEmptyNode(v))
const emptyVisible = computed(() => items.value.length === 0 && !props.loading && Boolean(props.emptyText || slots.empty))
// Hay filas: una opción válida (también deshabilitada), el mensaje de vacío o «Agregar nuevo…»; sin ellas no abre
const hasRows = computed(() => items.value.length > 0 || emptyVisible.value || createVisible.value)
// Abierta y sin filas (también porque `loading` retira el mensaje de vacío): se cierra
watch(() => hasRows.value, (v) => { if (!v) hide() })
// Contenido nuevo con la lista abierta: --_max se vuelve a fijar (el lado se conserva)
watch(() => [model.value, emptyVisible.value, createVisible.value], () => { if (open.value) nextTick(refit) }, { flush: 'post' })

try {
  if (process.env.NODE_ENV !== 'production') {
    if (!hasLabel.value && !attrs['aria-label'] && !attrs['aria-labelledby']) {
      console.warn('[Grana] <GSelect> necesita label, slot label, aria-label o aria-labelledby para tener un nombre accesible.')
    }
    if (props.clearable && !props.clearLabel) {
      console.warn('[Grana] <GSelect clearable> necesita clearLabel para mostrar el botón de limpiar.')
    }
  }
} catch {}
</script>

<template>
  <div ref="rootEl" v-bind="rootAttrs" :class="classes" @animationend="ff.onRejectEnd" @animationcancel="ff.onRejectEnd">
    <label v-if="hasLabel" :id="labelId" class="g-select__label" :for="buttonId" @click="onLabelClick"><slot name="label">{{ label }}</slot><template v-if="ff.mark.value === 'optional' && ff.markText.value">{{ ' ' }}<span class="g-select__optional">{{ ff.markText.value }}</span></template><span v-if="ff.mark.value === 'required'" class="g-select__required" aria-hidden="true">*</span></label>
    <div ref="control" class="g-select__control" data-g-tooltip-box>
      <button ref="button" v-bind="buttonBindings" class="g-select__button">
        <span v-if="slots.prepend" class="g-select__prepend" aria-hidden="true"><slot name="prepend" /></span>
        <span class="g-select__value" :class="{ 'g-select__value--placeholder': !selected }"><template v-if="selected"><span v-if="!slots.value && hasIcon(selected.raw)" class="g-select__icon" aria-hidden="true"><slot name="icon" :option="selected.raw" /></span><slot name="value" :option="selected.raw">{{ selected.label }}</slot></template><template v-else>{{ placeholder }}</template></span>
        <GIcon class="g-select__arrow" name="chevron-down" />
      </button>
      <button v-if="showClear" class="g-select__clear" type="button" :aria-label="clearLabel" @click="clear"><GIcon name="x" /></button>
      <GIcon v-if="loading" class="g-select__loader" name="loader-circle" />
    </div>
    <input v-if="name" type="hidden" :name="name" :value="hiddenValue" :disabled="isDisabled || undefined">
    <ul
      ref="list"
      :id="listId"
      class="g-select__list"
      role="listbox"
      popover="manual"
      :aria-label="attrs['aria-label']"
      :aria-labelledby="attrs['aria-label'] ? undefined : listLabelledBy"
      @pointerdown="onListPointerdown"
      @click="onListClick"
      @pointermove="onListPointermove"
    >
      <li class="g-select__highlight" role="none" aria-hidden="true" />
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
            ><span v-if="!slots.option && hasIcon(item.raw)" class="g-select__icon" aria-hidden="true"><slot name="icon" :option="item.raw" /></span><slot name="option" :option="item.raw" :selected="Boolean(selected && selected.index === item.index)" :active="item.index === activeIndex">{{ item.label }}</slot><GIcon v-if="selected && selected.index === item.index" class="g-select__check" name="check" /></li>
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
        ><span v-if="!slots.option && hasIcon(entry.raw)" class="g-select__icon" aria-hidden="true"><slot name="icon" :option="entry.raw" /></span><slot name="option" :option="entry.raw" :selected="Boolean(selected && selected.index === entry.index)" :active="entry.index === activeIndex">{{ entry.label }}</slot><GIcon v-if="selected && selected.index === entry.index" class="g-select__check" name="check" /></li>
      </template>
      <li v-if="emptyVisible" class="g-select__empty" role="presentation"><slot name="empty">{{ emptyText }}</slot></li>
      <li
        v-if="createVisible"
        :id="optId(createIndex)"
        class="g-select__option g-select__create"
        :class="{ 'is-active': activeIndex === createIndex }"
        role="option"
        :data-index="createIndex"
        aria-selected="false"
      ><GIcon class="g-select__create-icon" name="plus" />{{ createLabel }}</li>
    </ul>
    <div class="g-select__support">
      <div v-if="hasHint" :id="hintId" class="g-select__hint"><slot name="hint">{{ hint }}</slot></div>
      <div :id="ff.messageId.value" class="g-select__message" :aria-live="ff.live.value"><template v-if="message"><GIcon class="g-select__message-icon" :name="messageIcon(message.type)" /><span v-if="message.prefix" class="g-select__message-type">{{ message.prefix }}</span><slot v-if="message.type === 'error'" name="error">{{ message.text }}</slot><template v-else>{{ message.text }}</template></template></div>
    </div>
  </div>
</template>
