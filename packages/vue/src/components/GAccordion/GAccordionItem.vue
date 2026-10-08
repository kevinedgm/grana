<script setup>
// GAccordionItem · elemento de GAccordion; suelto, sección plegable de una pieza (dueño: bruno)
// Contrato: design/contracts/accordion.md (#475 a #488) · Estructura: design/lab/accordion/r01/ (kiwi) · Estilo:
// GAccordion.css (coco; marcado que espera en su cabecera) y design/lab/accordion/estilo.md «Para bruno».
// - hN > button[aria-expanded][aria-controls] (APG Accordion; suelto, APG Disclosure con encabezado). Nada interactivo
//   dentro del botón. Contenido montado siempre (salvo lazy): plegado y asentado = hidden="until-found" en __content (la
//   búsqueda de la página, un #id de dentro y #:~:text= lo encuentran y lo abren por beforematch); inert en __panel SOLO
//   mientras se cierra. Motor de plegado compartido con GFormSection (utils/collapse.js, #486).
// - A «Avance» (#483): __peek en la misma celda que el panel; clic en él (cerrado) abre como el botón.
// - Δ0 (#481): el encabezado que toca el usuario no se mueve (keepInPlace), cancelable al desplazar.
// - sticky (#484): --_head-size del encabezado pegado (observador de tamaño compartido, escrituras en un cuadro).
import { computed, getCurrentInstance, inject, nextTick, onBeforeUnmount, onMounted, onUpdated, provide, ref, useId, useSlots, watch } from 'vue'
import GIcon from '../GIcon/GLibIcon.js'
import { formKey, isDev } from '../GForm/formContext.js'
import { keepInPlace, useCollapse } from '../../utils/collapse.js'
import { transitionMs } from '../../utils/motion.js'
import { observeSize } from '../../utils/sizeObserver.js'
import { accordionKey, currentHash, FORM_CONTROLS, INTERACTIVE, subscribeHash } from './accordionContext.js'

defineOptions({ name: 'GAccordionItem' })

const props = defineProps({
  value: { type: [String, Number], default: undefined },
  id: { type: String, default: undefined },
  title: { type: String, default: undefined },
  meta: { type: String, default: undefined },
  peek: { type: String, default: undefined },
  disabled: Boolean,
  lazy: Boolean,
  headingLevel: { type: Number, default: undefined, validator: (v) => Number.isInteger(v) && v >= 2 && v <= 6 },
  open: Boolean
})

// update:open solo suelto; dentro de un grupo el único origen es el v-model del grupo
const emit = defineEmits(['update:open'])

const slots = useSlots()
const group = inject(accordionKey, null)
// Un elemento suelto (u otro grupo sin elemento entre medias) dentro de este panel no se une al grupo de fuera
provide(accordionKey, null)
const form = inject(formKey, null)

// ---------- Avisos de desarrollo ([Grana GAccordionItem], una vez por instancia) ----------
const warned = new Set()
const warn = (key, msg) => {
  if (!isDev || warned.has(key)) return
  warned.add(key)
  console.warn(`[Grana GAccordionItem] ${msg}`)
}

// ---------- Identidad ----------
const uid = useId()
const baseId = computed(() => props.id || `g-accordion-item-${uid}`)
const val = computed(() => (props.value !== undefined && props.value !== null ? props.value : baseId.value))
const level = computed(() => props.headingLevel ?? (group ? group.headingLevel() : 3))

// ---------- Estado ----------
const localOpen = ref(Boolean(props.open))
watch(() => props.open, (v) => { if (!group) localOpen.value = Boolean(v) })
const isOpen = computed(() => (group ? group.isOpen(val.value) : localOpen.value))
const regionOK = computed(() => (group ? group.regionOK() : true))
const sticky = computed(() => Boolean(group && group.sticky()))
const hasPeek = computed(() => Boolean(props.peek) || Boolean(slots.peek))
const hasMeta = () => Boolean(props.meta) || Boolean(slots.meta)

const root = ref(null)
const headingEl = ref(null)
const toggleEl = ref(null)
const titleEl = ref(null)
const metaEl = ref(null)
const peekEl = ref(null)
const panel = ref(null)
const content = ref(null)

// Plegado y asentado (hidden="until-found"); lazy: montado desde el primer abrir y nunca desmontado
const settled = ref(!isOpen.value)
const everOpened = ref(isOpen.value)
const { animating, ready, instant, start, settle, onTransitionend, openInstant, focusOut } = useCollapse({
  panel,
  toggle: toggleEl,
  onSettle() {
    if (!isOpen.value) settled.value = true
  }
})
// inert SOLO mientras se cierra (lo que se va no se enfoca); plegado y asentado manda hidden
const closing = computed(() => !isOpen.value && !settled.value)

// Cada cambio, venga de donde venga (usuario, modelo, búsqueda, #id, OPEN_REQUEST). Antes del parche (flush 'pre'):
// abierto quita hidden en el MISMO parche que entra is-open; plegar con el foco dentro lo lleva al botón ANTES de inert
watch(isOpen, (open) => {
  if (open) {
    settled.value = false
    everOpened.value = true
  } else focusOut()
  // Sin animar: is-instant (búsqueda, #id, OPEN_REQUEST, cierre desde el pegado) o antes del primer pintado
  if (instant.value || !ready.value) settle()
  else start()
})

// ---------- Registro en el grupo ----------
let unregister = null
if (group) {
  unregister = group.register({
    value: () => val.value,
    el: () => root.value,
    toggle: () => toggleEl.value,
    heading: () => headingEl.value,
    panel: () => panel.value,
    setInstant: openInstant
  })
}

// ---------- Cambios ----------
// Duración del movimiento con el cambio aplicado: la mayor de los paneles del grupo (en exclusive se cierra otro)
function movementMs() {
  if (instant.value) return 0
  const list = group ? group.panels() : [panel.value]
  return list.reduce((m, p) => Math.max(m, transitionMs(p)), 0)
}
function request(open, { inst = false, keep = true } = {}) {
  if (open === isOpen.value) return
  const h = headingEl.value
  const r = root.value
  // Cerrar desde el encabezado pegado (el principio del elemento ya está por encima): instantáneo y sin moverse (#484)
  const stuck = !open && sticky.value && h && r && h.getBoundingClientRect().top - r.getBoundingClientRect().top > 1
  if (inst || stuck) openInstant()
  // Δ0 solo cuando lo tocó el usuario (#481)
  if (keep && h) keepInPlace(h, movementMs)
  if (group) group.set(val.value, open, { instant: inst })
  else {
    localOpen.value = open
    emit('update:open', open)
  }
}
function onClick() {
  if (props.disabled) return
  request(!isOpen.value)
}
// Clic en el avance (cerrado): abre como el botón; no si el clic termina una selección de texto (#483)
function onPeek() {
  if (props.disabled || isOpen.value) return
  const sel = typeof getSelection === 'function' ? getSelection() : null
  if (sel && !sel.isCollapsed && sel.toString()) return
  request(true)
}
// La página encontró texto dentro (Ctrl+F, #:~:text=, #id de dentro); el navegador ya quitó hidden. También deshabilitado
function onBeforematch() {
  if (isOpen.value) return
  request(true, { inst: true, keep: false })
}
// Abrir antes de enfocar (#287): abre sin animar, emite y cancela; quien la despachó espera un nextTick. No detiene la
// propagación (los anidados se abren todos). En exclusive, solo la primera petición del tick que llega al grupo
function onOpenRequest(event) {
  if (group && !group.takeRequest()) return
  if (isOpen.value) return
  request(true, { inst: true, keep: false })
  event.preventDefault()
}
// #id del elemento (#482): al montar y en hashchange; abre sin animar y lo trae arriba (respeta el scroll-padding de la aplicación, #515).
// Al montar durante la carga, otra vez en `load` (como el navegador con un fragmento: lo que se pinta encima, p. ej. las
// fuentes, puede moverlo, y el grupo no participa del anclaje de desplazamiento, overflow-anchor: none)
function bringIntoView() {
  const t = toggleEl.value
  if (t && typeof t.scrollIntoView === 'function') t.scrollIntoView({ block: 'start', behavior: 'instant' })
}
let offLoad = null
function onHash(initial = false) {
  if (currentHash() !== baseId.value) return
  if (!isOpen.value) request(true, { inst: true, keep: false })
  nextTick(bringIntoView)
  if (initial === true && typeof document !== 'undefined' && document.readyState !== 'complete' && typeof window !== 'undefined') {
    const again = () => {
      offLoad = null
      if (currentHash() !== baseId.value) return
      bringIntoView()
      // WebKit puede cambiar de fuente después de load
      if (document.fonts && document.fonts.status !== 'loaded' && document.fonts.ready) {
        const y = window.scrollY
        document.fonts.ready.then(() => { if (window.scrollY === y && currentHash() === baseId.value) bringIntoView() })
      }
    }
    window.addEventListener('load', again, { once: true })
    offLoad = () => window.removeEventListener('load', again)
  }
}

// ---------- sticky: alto del encabezado pegado (--_head-size, 2.4.11) ----------
const headSize = ref(null)
let offHead = null
function measureHead() {
  const hd = headingEl.value
  if (!hd) return
  const v = Math.round(layoutHeight(hd) * 100) / 100
  if (v && v !== headSize.value) headSize.value = v
}
// Alto de maquetación de la caja de borde (#517): getBoundingClientRect incluye transformaciones (la escala de entrada de
// GDialog, #299) y offsetHeight redondea; el alto calculado conserva las fracciones
function layoutHeight(el) {
  const cs = getComputedStyle(el)
  let h = parseFloat(cs.height)
  if (!Number.isFinite(h)) return el.offsetHeight
  if (cs.boxSizing !== 'border-box') {
    for (const k of ['paddingTop', 'paddingBottom', 'borderTopWidth', 'borderBottomWidth']) h += parseFloat(cs[k]) || 0
  }
  return h
}
function syncHead() {
  const on = isOpen.value && sticky.value
  if (on && headingEl.value) {
    if (!offHead) offHead = observeSize(headingEl.value, measureHead)
    group.measurePad()
  } else if (!on && offHead) {
    offHead()
    offHead = null
    headSize.value = null
  }
}
watch(() => isOpen.value && sticky.value, syncHead, { flush: 'post' })

// ---------- Avisos ----------
const vnodeProps = getCurrentInstance()?.vnode.props || {}
const passed = (k) => Object.prototype.hasOwnProperty.call(vnodeProps, k)
if (!props.title && !slots.title && !props.meta && !slots.meta) warn('no-name', 'necesita title, meta o sus slots: el botón no tiene nombre.')
if (group && (passed('open') || passed('onUpdate:open'))) warn('open-in-group', 'open (y v-model:open) solo vale suelto: dentro de un GAccordion el estado es el v-model del grupo; se ignora.')
if (group && group.hasModel() && (props.value === undefined || props.value === null) && !props.id) {
  warn('no-value', 'en un grupo con v-model, sin value ni id: el modelo usará un id generado que la aplicación no conoce.')
}
function checkDom() {
  if (!isDev) return
  if ([titleEl.value, metaEl.value].some((el) => el && el.querySelector(INTERACTIVE))) {
    warn('interactive-name', 'hay algo interactivo en title o meta: los hijos de un botón no se pueden usar (van en el slot actions o en el contenido).')
  }
  if (peekEl.value && peekEl.value.querySelector(INTERACTIVE)) {
    warn('interactive-peek', 'hay algo interactivo en el avance (peek): es la descripción del botón y abre al clic; no se puede usar.')
  }
}
function checkForm() {
  if (!isDev || !form || !content.value) return
  if (content.value.querySelector(FORM_CONTROLS)) {
    warn('in-form', 'para plegar campos de un formulario, usa `GFormSection mode="collapsible"`; aquí no cuentan en el estado de errores por sección.')
  }
}
// Al montarse por primera vez un contenido lazy
watch(everOpened, (v) => { if (v && props.lazy) nextTick(checkForm) })
onUpdated(checkDom)

let offHash = null
onMounted(() => {
  if (isDev) {
    checkDom()
    checkForm()
    const id = baseId.value
    if (typeof document !== 'undefined' && document.querySelectorAll(`[id="${id.replace(/["\\]/g, '\\$&')}"]`).length > 1) {
      warn('dup-id', `su id «${id}» está repetido en el documento: el ancla y aria-controls irían a otro elemento.`)
    }
  }
  offHash = subscribeHash(onHash)
  onHash(true)
  syncHead()
})
onBeforeUnmount(() => {
  offHash?.()
  offLoad?.()
  offHead?.()
  offHead = null
  unregister?.()
})

// ---------- Marcado ----------
const classes = computed(() => [
  'g-accordion-item',
  {
    'is-open': isOpen.value,
    'is-animating': animating.value,
    'is-instant': instant.value,
    'is-ready': ready.value,
    'is-disabled': props.disabled,
    'is-standalone': !group,
    'has-peek': hasPeek.value,
    'has-actions': Boolean(slots.actions)
  }
])
const style = computed(() => (headSize.value !== null && isOpen.value && sticky.value ? { '--_head-size': `${headSize.value}px` } : undefined))
</script>

<template>
  <div ref="root" :id="baseId" :class="classes" :style="style">
    <component :is="`h${level}`" ref="headingEl" class="g-accordion-item__heading">
      <button
        ref="toggleEl"
        :id="`${baseId}-toggle`"
        type="button"
        class="g-accordion-item__toggle"
        :aria-expanded="isOpen ? 'true' : 'false'"
        :aria-controls="`${baseId}-content`"
        :aria-disabled="disabled ? 'true' : undefined"
        :aria-describedby="hasPeek && !isOpen ? `${baseId}-peek` : undefined"
        @click="onClick"
      >
        <span ref="titleEl" class="g-accordion-item__title" dir="auto"><slot name="title" :open="isOpen">{{ title }}</slot></span>
        <span v-if="hasMeta()" ref="metaEl" class="g-accordion-item__meta" dir="auto"><slot name="meta" :open="isOpen">{{ meta }}</slot></span>
        <span class="g-accordion-item__chevron" aria-hidden="true"><GIcon name="chevron-right" /></span>
      </button>
    </component>
    <div v-if="slots.actions" class="g-accordion-item__actions"><slot name="actions" :open="isOpen" /></div>
    <div v-if="hasPeek" ref="peekEl" :id="`${baseId}-peek`" class="g-accordion-item__peek" dir="auto" @click="onPeek"><slot name="peek" :open="isOpen">{{ peek }}</slot></div>
    <div
      ref="panel"
      class="g-accordion-item__panel"
      :inert="closing ? '' : undefined"
      @transitionend="onTransitionend"
      @g-open-request="onOpenRequest"
    >
      <div
        ref="content"
        :id="`${baseId}-content`"
        class="g-accordion-item__content"
        :role="regionOK ? 'region' : undefined"
        :aria-labelledby="regionOK ? `${baseId}-toggle` : undefined"
        :hidden.attr="settled ? 'until-found' : undefined"
        @beforematch="onBeforematch"
      >
        <div class="g-accordion-item__body"><slot v-if="!lazy || everOpened" /></div>
      </div>
    </div>
  </div>
</template>
