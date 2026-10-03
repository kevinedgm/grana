<script setup>
// GDialog · diálogo modal con carcasa e inset (dueño: bruno)
// Contrato: design/contracts/dialog.md · Estructura: design/lab/dialog/r01/ · Estilo: GDialog.css (coco)
import { computed, nextTick, onBeforeUnmount, onMounted, provide, ref, useAttrs, useId, useSlots, watch } from 'vue'
import { oneOf } from '../../utils/oneOf.js'
import { TABS_NEST } from '../../utils/tabs.js'
import { transitionMs } from '../../utils/motion.js'
import GIcon from '../GIcon/GLibIcon.js'

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
const hasTabs = computed(() => Boolean(slots.tabs))
// Un diálogo abierto desde un panel de GTabs puede llevar sus propias pestañas: no cuenta como anidamiento
provide(TABS_NEST, false)
const showClose = computed(() => Boolean(props.closeLabel) && !isAlert.value)

const dialog = ref(null)
const body = ref(null)

// El contenido sigue montado durante la salida; se desmonta (y se emite closed) al terminar (#152)
const rendered = ref(props.modelValue)
let leaveTimer = null
function finishLeave() {
  leaveTimer = null
  rendered.value = false
  unpin()
  emit('closed')
}

// ---------- Personalidad (dialog.md «Personalidad», #301) ----------
// Solo placement="center" sin fullscreen. El umbral móvil lo aplica el CSS (consulta de medios de coco): aquí no hay
// medidas. Variables dinámicas en línea (excepción como --_mark-* de GTabs); se escriben directamente en el <dialog>
// porque deben estar antes de showModal() (el primer estilo, @starting-style), y en refs para que el render de Vue
// (className y style) las conserve.
const centered = computed(() => props.placement === 'center' && !props.fullscreen)
const px = (n) => `${Math.round(n * 10) / 10}px`

// D1 · viene de donde lo llamaste: vector completo hasta el centro del disparador; fracción y tope son del CSS.
const origin = ref(null) // { x, y } en px, o null sin has-origin
let trigger = null // elemento con el foco al abrir: el mismo al que el navegador devuelve el foco al cerrar
let exitAimed = false
function hasBox(node) {
  return Boolean(node && node.isConnected && node.getClientRects && node.getClientRects().length)
}
function centerOf(rect) {
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
}
function writeOrigin(x, y) {
  const el = dialog.value
  const next = { x: px(x), y: px(y) }
  if (origin.value && origin.value.x === next.x && origin.value.y === next.y) return
  origin.value = next
  if (!el) return
  el.style.setProperty('--_origin-x', next.x)
  el.style.setProperty('--_origin-y', next.y)
  el.classList.add('has-origin')
}
function clearOrigin() {
  const el = dialog.value
  if (!origin.value) return
  origin.value = null
  if (!el) return
  el.style.removeProperty('--_origin-x')
  el.style.removeProperty('--_origin-y')
  el.classList.remove('has-origin')
}
// Antes de showModal(): desde el centro del visor (el del diálogo centrado) hasta el disparador enfocado fuera de él.
function aimEntry() {
  const el = dialog.value
  const active = document.activeElement
  trigger = active && active !== document.body && active !== document.documentElement && !el.contains(active) ? active : null
  if (!centered.value || !hasBox(trigger)) return clearOrigin()
  const t = centerOf(trigger.getBoundingClientRect())
  writeOrigin(t.x - window.innerWidth / 2, t.y - window.innerHeight / 2)
}
// Antes de la salida: desde el centro real del diálogo (con D2 ya no es el del visor) hasta adonde vuelve el foco.
function aimExit() {
  const el = dialog.value
  if (!el || !origin.value) return
  if (!centered.value || !hasBox(trigger) || el.contains(trigger)) return clearOrigin()
  const d = el.getBoundingClientRect()
  if (!d.width && !d.height) return // ya sin caja (cerró sin transición): no hay salida que orientar
  const c = centerOf(d)
  const t = centerOf(trigger.getBoundingClientRect())
  writeOrigin(t.x - c.x, t.y - c.y)
}

// D2 · crece hacia abajo: el borde superior medido centrado (offsetTop, sin transformaciones) queda fijo.
const pinTop = ref(null) // px, o null sin is-pinned
let pinFrame = 0
function unpin() {
  const el = dialog.value
  if (pinFrame) { cancelAnimationFrame(pinFrame); pinFrame = 0 }
  if (pinTop.value === null) return
  pinTop.value = null
  if (!el) return
  el.style.removeProperty('--_pin-top')
  el.classList.remove('is-pinned')
}
function pin() {
  pinFrame = 0
  const el = dialog.value
  if (!el || !el.open || !props.modelValue || !centered.value) return unpin()
  // Se suelta, se deja centrar y se mide en el mismo cuadro (sin pintar el estado intermedio)
  el.classList.remove('is-pinned')
  const top = px(el.offsetTop)
  el.classList.add('is-pinned')
  if (pinTop.value === top) return
  pinTop.value = top
  el.style.setProperty('--_pin-top', top)
}
function schedulePin() {
  if (pinFrame || typeof requestAnimationFrame !== 'function') return
  pinFrame = requestAnimationFrame(pin)
}
// Al redimensionar la ventana: una vez por cuadro, se recentra y se vuelve a fijar
let resizing = false
function onResize() {
  if (pinTop.value !== null) schedulePin()
}
function listenResize(on) {
  if (on === resizing || typeof window === 'undefined') return
  resizing = on
  window[on ? 'addEventListener' : 'removeEventListener']('resize', onResize, { passive: true })
}
watch(centered, (on) => {
  const el = dialog.value
  if (!el?.open) return
  if (on) schedulePin()
  else { unpin(); clearOrigin() }
})

// ---------- Foco al abrir (dialog.md «Foco») ----------
// autofocus (donde esté) → primer control del contenido → botón de cierre → el propio <dialog>.
// Se omiten el cierre (solo es el último recurso) y el cuerpo desplazable (tabindex propio, no es un control).
const FOCUSABLE = 'a[href], area[href], button, input:not([type="hidden"]), select, textarea, summary, iframe, audio[controls], video[controls], [contenteditable]:not([contenteditable="false"]), [tabindex]'
function isUsable(node) {
  if (node.matches(':disabled') || node.closest('[inert], [hidden]')) return false
  const tab = node.getAttribute('tabindex')
  if (tab !== null && Number(tab) < 0) return false
  return node.checkVisibility ? node.checkVisibility() : true
}
function focusInitial() {
  const el = dialog.value
  if (!el || !el.open || !props.modelValue) return
  // Si ya hay foco dentro (el navegador o el consumidor lo pusieron), no se roba
  if (document.activeElement && document.activeElement !== el && el.contains(document.activeElement)) return
  const close = el.querySelector('.g-dialog__close')
  const bodyEl = body.value
  const target =
    [...el.querySelectorAll('[autofocus]')].find(isUsable) ||
    [...el.querySelectorAll(FOCUSABLE)].find((n) => n !== close && n !== bodyEl && isUsable(n)) ||
    (close && isUsable(close) ? close : null)
  // Sin nada enfocable, el foco se queda donde lo dejó showModal(): el propio <dialog>
  if (target) target.focus({ preventScroll: true })
}

// ---------- Abrir y cerrar ----------
function sync() {
  const el = dialog.value
  if (!el) return
  if (props.modelValue) {
    if (leaveTimer) { clearTimeout(leaveTimer); leaveTimer = null }
    rendered.value = true
    if (!el.open) {
      // D2: una apertura (también a mitad de la salida) parte centrada; D1: el vector va antes de showModal()
      unpin()
      aimEntry()
      el.showModal()
      listenResize(true)
      emit('open')
      // El contenido se monta en este mismo ciclo, después de showModal(): el navegador ya no lo ve y deja el foco en el <dialog>
      // D2 mide después del foco (#292), en el cuadro siguiente
      nextTick(() => { measure(); focusInitial(); schedulePin() })
    }
  } else if (el.open) {
    aimExit()
    exitAimed = true
    el.close()
  }
}
onMounted(sync)
watch(() => props.modelValue, sync, { flush: 'post' })

// Cierre nativo (también el que provoca sync; p. ej. un <form method="dialog"> dentro, o la segunda pulsación de Esc
// en Chromium): el prop sigue siendo la fuente de verdad, así que se pide el cambio. El contenido se desmonta cuando
// termina la transición de salida calculada (0 → en este mismo ciclo; #149, #152).
function onNativeClose() {
  // Un cierre que no pasó por sync (form method="dialog"): se orienta la salida lo antes posible
  if (!exitAimed) aimExit()
  exitAimed = false
  listenResize(false)
  if (pinFrame) { cancelAnimationFrame(pinFrame); pinFrame = 0 }
  if (props.modelValue) emit('update:modelValue', false)
  const ms = transitionMs(dialog.value)
  if (ms > 0) leaveTimer = setTimeout(finishLeave, ms)
  else finishLeave()
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
  // Un descendiente que ya trató Esc (un aviso de GToaster, GMenu, GSelect) lo cancela: no es para el diálogo
  if (event.defaultPrevented) return
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
  clearTimeout(leaveTimer)
  listenResize(false)
  if (pinFrame) cancelAnimationFrame(pinFrame)
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
    'is-scrolled': !props.inset && scrolled.value,
    'has-origin': Boolean(origin.value),
    'is-pinned': pinTop.value !== null
  }
])
// Variables dinámicas (#301): las mismas que se escribieron en el elemento, para que el render no las borre
const dynStyle = computed(() => {
  const s = {}
  if (origin.value) { s['--_origin-x'] = origin.value.x; s['--_origin-y'] = origin.value.y }
  if (pinTop.value !== null) s['--_pin-top'] = pinTop.value
  return s
})
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
// Con el slot `tabs`, role="region" y tabindex pasan a los tabpanel (GTabs / GTabPanel): el cuerpo no se anuncia como región propia.
const bodyAttrs = computed(() => {
  if (!scrollable.value || hasTabs.value) return {}
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
    :style="dynStyle"
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
    <template v-if="rendered">
      <div class="g-dialog__header">
        <span v-if="hasIcon" class="g-dialog__icon" aria-hidden="true"><slot name="icon" /></span>
        <div class="g-dialog__titles">
          <slot name="header" :title-id="titleId" :description-id="descId">
            <h2 v-if="hasTitle" :id="titleId" class="g-dialog__title"><slot name="title">{{ title }}</slot></h2>
            <p v-if="hasDescription" :id="descId" class="g-dialog__description"><slot name="description">{{ description }}</slot></p>
          </slot>
        </div>
        <button v-if="showClose" class="g-dialog__close" type="button" :aria-label="closeLabel" @click="close"><GIcon name="x" /></button>
      </div>
      <div v-if="hasTabs" class="g-dialog__tabs"><slot name="tabs" /></div>
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
