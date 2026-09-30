<script setup>
// GDialog · diálogo modal con carcasa e inset (dueño: bruno)
// Contrato: design/contracts/dialog.md · Estructura: design/lab/dialog/r01/ · Estilo: GDialog.css (coco)
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useAttrs, useId, useSlots, watch } from 'vue'
import { oneOf } from '../../utils/oneOf.js'

defineOptions({ name: 'GDialog', inheritAttrs: false })

const props = defineProps({
  modelValue: Boolean,
  title: { type: String, default: undefined },
  description: { type: String, default: undefined },
  size: { type: String, default: 'md', validator: oneOf(['sm', 'md', 'lg']) },
  density: { type: String, default: 'default', validator: oneOf(['default', 'comfortable', 'compact']) },
  inset: { type: Boolean, default: true },
  fullscreen: Boolean,
  placement: { type: String, default: 'center', validator: oneOf(['center', 'end']) },
  mobile: { type: String, default: 'sheet', validator: oneOf(['sheet', 'full-width', 'fullscreen']) },
  role: { type: String, default: 'dialog', validator: oneOf(['dialog', 'alertdialog']) },
  closeLabel: { type: String, default: undefined },
  closeOnBackdrop: { type: Boolean, default: true },
  loading: Boolean,
  id: { type: String, default: undefined }
})

const emit = defineEmits(['update:modelValue', 'dismiss', 'open', 'closed'])

const attrs = useAttrs()
const slots = useSlots()

const uid = useId()
const rootId = computed(() => props.id || `g-dialog-${uid}`)
const titleId = computed(() => `${rootId.value}-title`)
const descId = computed(() => `${rootId.value}-desc`)

const isAlert = computed(() => props.role === 'alertdialog')
const hasTitle = computed(() => Boolean(props.title || slots.title))
const hasDescription = computed(() => Boolean(props.description || slots.description))
const hasHeaderSlot = computed(() => Boolean(slots.header))
const hasFooter = computed(() => Boolean(slots.footer))
const hasIcon = computed(() => Boolean(slots.icon))
const showClose = computed(() => Boolean(props.closeLabel) && !isAlert.value)

const dialog = ref(null)
const body = ref(null)

// ---------- Abrir y cerrar ----------
function sync() {
  const el = dialog.value
  if (!el) return
  if (props.modelValue && !el.open) {
    el.showModal()
    emit('open')
    nextTick(measure)
  } else if (!props.modelValue && el.open) {
    el.close()
  }
}
onMounted(sync)
watch(() => props.modelValue, sync, { flush: 'post' })

// Cierre nativo (p. ej. un <form method="dialog"> dentro, o la segunda pulsación de Esc en Chromium):
// el prop sigue siendo la fuente de verdad, así que se pide el cambio.
function onNativeClose() {
  emit('closed')
  if (props.modelValue) emit('update:modelValue', false)
}

// Intento de cierre del usuario: `dismiss` cancelable; si nadie lo impide, se pide el cierre.
function requestClose(reason) {
  let prevented = false
  const payload = {
    reason,
    preventDefault() { prevented = true },
    get defaultPrevented() { return prevented }
  }
  emit('dismiss', payload)
  if (!prevented) emit('update:modelValue', false)
}

// Esc: se cancela siempre el comportamiento nativo y se decide aquí. `keydown` cubre la segunda pulsación
// (Chromium ignora el preventDefault de `cancel` sin interacción intermedia); `cancel` cubre el resto.
let escHandled = false
function markEsc() {
  escHandled = true
  setTimeout(() => { escHandled = false }, 0)
}
function onKeydown(event) {
  if (event.key !== 'Escape' || event.isComposing) return
  event.preventDefault()
  markEsc()
  requestClose('escape')
}
function onCancel(event) {
  event.preventDefault()
  if (escHandled) return
  markEsc()
  requestClose('escape')
}

// Fondo: el clic debe empezar y terminar fuera de la carcasa (el <dialog> recibe también los clics de su relleno).
let downOnBackdrop = false
function isBackdrop(event) {
  const el = dialog.value
  if (!el || event.target !== el) return false
  const r = el.getBoundingClientRect()
  return event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom
}
function onPointerdown(event) {
  downOnBackdrop = isBackdrop(event)
}
function onClick(event) {
  const started = downOnBackdrop
  downOnBackdrop = false
  if (isAlert.value || !props.closeOnBackdrop) return
  if (started && isBackdrop(event)) requestClose('backdrop')
}

function close() {
  requestClose('close')
}

// ---------- Cuerpo desplazable ----------
const scrollable = ref(false)
const scrolled = ref(false)
function measure() {
  const el = body.value
  if (!el) return
  scrollable.value = el.scrollHeight > el.clientHeight + 1
  scrolled.value = el.scrollTop + el.clientHeight < el.scrollHeight - 1
}
let resizeObserver = null
let mutationObserver = null
watch(body, (el, old) => {
  if (old) {
    resizeObserver?.disconnect()
    mutationObserver?.disconnect()
  }
  if (!el) {
    scrollable.value = false
    scrolled.value = false
    return
  }
  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(measure)
    resizeObserver.observe(el)
  }
  if (typeof MutationObserver !== 'undefined') {
    mutationObserver = new MutationObserver(measure)
    mutationObserver.observe(el, { childList: true, subtree: true, characterData: true })
  }
  measure()
}, { flush: 'post' })
onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  mutationObserver?.disconnect()
  if (dialog.value?.open) dialog.value.close()
})

// ---------- Marcado ----------
const classes = computed(() => [
  'g-dialog',
  `g-dialog--size-${props.size}`,
  `g-dialog--density-${props.density}`,
  `g-dialog--placement-${props.placement}`,
  `g-dialog--mobile-${props.mobile}`,
  {
    'g-dialog--inset': props.inset,
    'g-dialog--fullscreen': props.fullscreen,
    'g-dialog--alert': isAlert.value,
    'is-loading': props.loading,
    'is-scrolled': !props.inset && scrolled.value
  }
])
const insetClasses = computed(() => ['g-dialog__inset', { 'is-scrolled': scrolled.value }])
const bodyClasses = computed(() => ['g-dialog__body', { 'is-scrollable': scrollable.value }])

const labelledBy = computed(() => {
  if (attrs['aria-label'] || attrs['aria-labelledby']) return attrs['aria-labelledby']
  return hasTitle.value || hasHeaderSlot.value ? titleId.value : undefined
})
const describedBy = computed(() => {
  const ids = [attrs['aria-describedby'], hasDescription.value && descId.value].filter(Boolean)
  return ids.length ? ids.join(' ') : undefined
})
// Solo se anuncia un rol distinto del nativo; role="dialog" sobre <dialog> es redundante.
const roleAttr = computed(() => (isAlert.value ? 'alertdialog' : undefined))

// Un cuerpo que se desplaza debe poder recibir el foco para que el teclado lo alcance.
const bodyAttrs = computed(() => {
  if (!scrollable.value) return {}
  const named = hasTitle.value || hasHeaderSlot.value
  return { tabindex: 0, ...(named ? { role: 'region', 'aria-labelledby': titleId.value } : {}) }
})

// Avisos solo en desarrollo. `process` puede no existir (UMD en navegador): se comprueba antes de leerlo.
const isDev = typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production'
if (isDev) {
  if (!hasTitle.value && !hasHeaderSlot.value && !attrs['aria-label'] && !attrs['aria-labelledby']) {
    console.warn('[Grana] <GDialog> necesita title, slot title o header, aria-label o aria-labelledby para tener un nombre accesible.')
  }
  if (!props.closeLabel && !isAlert.value) {
    console.warn('[Grana] <GDialog> necesita `closeLabel` para mostrar el botón de cierre (sin valor por defecto: los textos los pone la aplicación).')
  }
}
</script>

<template>
  <dialog
    v-bind="attrs"
    ref="dialog"
    :id="rootId"
    :class="classes"
    :role="roleAttr"
    :aria-labelledby="labelledBy"
    :aria-describedby="describedBy"
    :aria-busy="loading ? 'true' : undefined"
    @close="onNativeClose"
    @cancel="onCancel"
    @keydown="onKeydown"
    @pointerdown="onPointerdown"
    @click="onClick"
  >
    <template v-if="modelValue">
      <div class="g-dialog__header">
        <span v-if="hasIcon" class="g-dialog__icon" aria-hidden="true"><slot name="icon" /></span>
        <div class="g-dialog__titles">
          <slot name="header" :title-id="titleId" :description-id="descId">
            <h2 v-if="hasTitle" :id="titleId" class="g-dialog__title"><slot name="title">{{ title }}</slot></h2>
            <p v-if="hasDescription" :id="descId" class="g-dialog__description"><slot name="description">{{ description }}</slot></p>
          </slot>
        </div>
        <button v-if="showClose" class="g-dialog__close" type="button" :aria-label="closeLabel" @click="close" />
      </div>
      <div v-if="inset" :class="insetClasses">
        <div ref="body" :class="bodyClasses" v-bind="bodyAttrs" @scroll.passive="measure"><slot :close="close" /></div>
        <div v-if="hasFooter" class="g-dialog__footer"><slot name="footer" :close="close" /></div>
      </div>
      <template v-else>
        <div ref="body" :class="bodyClasses" v-bind="bodyAttrs" @scroll.passive="measure"><slot :close="close" /></div>
        <div v-if="hasFooter" class="g-dialog__footer"><slot name="footer" :close="close" /></div>
      </template>
    </template>
  </dialog>
</template>
