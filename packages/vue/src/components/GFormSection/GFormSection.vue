<script setup>
// GFormSection · sección de un formulario (una idea): fija, plegable o agregable (dueño: bruno)
// Contrato: design/contracts/form.md §3 (Fase 1 #161; Fase 3 #284 a #291) y §2 (sectionKey, revealKey) · Estructura:
// design/lab/form-section/r01/ (kiwi) · Estilo: GFormSection.css (coco; marcado que espera en su cabecera y en
// design/lab/form-section/estilo.md).
// <section> SIN aria-labelledby (no es punto de referencia); el título hN da la navegación.
// - static: encabezado + __body (el DOM de la Fase 1, más --mode-static, la línea opcional y is-actions-below).
// - collapsible: hN > button (APG Disclosure) con chevron; __panel inert plegado SIN fieldset disabled (los datos
//   siguen en FormData y en el registro); abre sin animar ante OPEN_REQUEST (abrir antes de enfocar, #287).
// - addable: «Agregar …» (GBtn) sin hN; __panel inert + fieldset role="none" disabled + registro inactivo (revealKey);
//   «Quitar …» descarta (cuerpo con clave nueva al terminar la transición) con confirmación GDialog alertdialog si hay
//   algo que perder (#288).
// Slot lead (#203): en static/addable, <span class="g-form-section__lead" aria-hidden="true"> inmediatamente antes del hN
// (el CSS usa `__lead + __title`); en collapsible, dentro del botón, después del chevron.
import { computed, getCurrentInstance, inject, nextTick, onBeforeUnmount, onMounted, onUpdated, provide, ref, shallowReactive, unref, useAttrs, useId, useSlots, watch } from 'vue'
import GBadge from '../GBadge/GBadge.vue'
import GBtn from '../GBtn/GBtn.vue'
import GDialog from '../GDialog/GDialog.vue'
import GDivider from '../GDivider/GDivider.vue'
import GIcon from '../GIcon/GLibIcon.js'
import { formKey, isDev, nextFrame, revealKey, sectionKey, spaceUnit } from '../GForm/formContext.js'
import { oneOf } from '../../utils/oneOf.js'
import { fill } from '../../utils/template.js'
import { transitionMs } from '../../utils/motion.js'
import { observeSize } from '../../utils/sizeObserver.js'

defineOptions({ name: 'GFormSection', inheritAttrs: false })

const props = defineProps({
  title: { type: String, default: undefined },
  description: { type: String, default: undefined },
  headingLevel: { type: Number, default: undefined, validator: (v) => Number.isInteger(v) && v >= 2 && v <= 6 },
  optional: Boolean,
  mode: { type: String, default: 'static', validator: oneOf(['static', 'collapsible', 'addable']) },
  open: Boolean,
  added: Boolean,
  summary: { type: String, default: undefined },
  headerPlacement: { type: String, default: 'top', validator: oneOf(['top', 'auto']) },
  divider: Boolean,
  labels: { type: Object, default: () => ({}) }
})

// Solo estos dos (#284): update:added(false) ES «el usuario quitó la sección»
const emit = defineEmits(['update:open', 'update:added'])

const attrs = useAttrs()
const slots = useSlots()
const form = inject(formKey, null)
const parentReveal = inject(revealKey, null)
const parentSection = inject(sectionKey, null)

const isStatic = computed(() => props.mode === 'static')
const isCollapsible = computed(() => props.mode === 'collapsible')
const isAddable = computed(() => props.mode === 'addable')

// id del consumidor o generado: base de los id internos; el generado NO se escribe en la raíz
const uid = useId()
const baseId = computed(() => attrs.id || `g-form-section-${uid}`)

const level = computed(() => props.headingLevel ?? unref(form?.headingLevel) ?? 3)
const badgeText = computed(() => (props.optional ? unref(form?.labels)?.sectionOptional : undefined))
// Editar la estructura es editar: con GForm readonly/disabled no hay «Agregar …» ni «Quitar …» (plegar sí funciona)
const editable = computed(() => !unref(form?.readonly) && !unref(form?.disabled))
const labelOf = (k) => (props.labels && props.labels[k]) || ''

// ---------- Estado (controlado y no controlado: parte de la prop y la sigue, como `dirty` de GForm) ----------
const openL = ref(props.open)
const addedL = ref(props.added)
const appAdded = ref(props.added) // la agregó la aplicación (al montar o por programa): confirma al quitar (#288)
const edited = ref(false) // el usuario escribió desde que se agregó
const gen = ref(0) // clave del cuerpo: cambia al descartar (lo no controlado se vacía)
const animating = ref(false)
const ready = ref(false)
const instant = ref(false)
const side = ref(false)
const below = ref(false)
const confirmOpen = ref(false)

const shown = computed(() => (isCollapsible.value ? openL.value : isAddable.value ? addedL.value : true))
const hiddenRoot = computed(() => isAddable.value && !addedL.value && !editable.value)

// ---------- Registro inactivo (addable sin agregar, #288) y recuento de errores (#286) ----------
// Transparente salvo en addable: activo = agregada y el ancestro activo. fromReveal se hereda (el aviso 3 de §14 solo
// sale por un GFormReveal por encima, no por una sección agregable)
const active = computed(() => (isAddable.value ? addedL.value : true) && (parentReveal ? Boolean(unref(parentReveal.active)) : true))
provide(revealKey, { active, fromReveal: Boolean(parentReveal?.fromReveal) })

const entries = shallowReactive(new Map())
function notifyEdit() {
  if (isAddable.value && addedL.value) edited.value = true
  if (parentSection && typeof parentSection.notifyEdit === 'function') parentSection.notifyEdit()
}
provide(sectionKey, {
  // Dentro de una sección opcional no hay «(opcional)» en sus campos: lo dice la sección
  optional: computed(() => props.optional),
  register(entry) {
    const key = Symbol('entry')
    entries.set(key, entry)
    // Se propaga a las secciones ancestro: una plegada que contiene otra cuenta también sus preguntas
    const up = parentSection && typeof parentSection.register === 'function' ? parentSection.register(entry) : null
    return () => {
      entries.delete(key)
      up?.()
    }
  },
  notifyEdit
})
// Preguntas con error VISIBLE (el que pinta el campo): sin partes de grupo, deshabilitados, inactivos ni advertencias
const errorCount = computed(() => {
  if (!form) return 0
  let n = 0
  for (const e of entries.values()) {
    if (e.inGroup || (e.disabled && e.disabled()) || (e.inactive && e.inactive())) continue
    if (typeof e.visibleTarget === 'function' && e.visibleTarget()) n++
  }
  return n
})
const statusText = computed(() => {
  const n = errorCount.value
  if (!n) return ''
  const t = unref(form?.labels)?.sectionErrors
  if (typeof t === 'function') return String(t(n) ?? '')
  return fill(t, { count: n })
})
const collapsed = computed(() => isCollapsible.value && !openL.value)
// Línea de estado: solo plegada y con algo que decir (estado de errores y/o texto de la aplicación)
const hasSummaryText = () => Boolean(slots.summary) || Boolean(props.summary)
const showSummary = () => collapsed.value && (Boolean(statusText.value) || hasSummaryText())
watch(() => collapsed.value && errorCount.value > 0, (v) => {
  if (v && isDev && form && !unref(form.labels)?.sectionErrors && typeof form.warnOnce === 'function') {
    form.warnOnce('label-sectionErrors', 'falta labels.sectionErrors: una sección plegada con errores va sin estado (un icono solo no basta).')
  }
}, { immediate: true })

// ---------- Transición (la de §14 en __panel, #278) ----------
const root = ref(null)
const header = ref(null)
const actions = ref(null)
const panel = ref(null)
const body = ref(null)
const toggleEl = ref(null)
const titleEl = ref(null)
const summaryEl = ref(null)

let timer = null
let pendingRemount = false
function settle() {
  clearTimeout(timer)
  timer = null
  if (animating.value) animating.value = false
  // Descartar: el cuerpo se vuelve a montar al terminar la transición (sin vaciarse a la vista mientras se funde)
  if (pendingRemount) {
    pendingRemount = false
    gen.value++
  }
}
// Respaldo del transitionend: si la transición de altura sigue en curso (empezó tarde con el hilo ocupado), espera
function fallback() {
  const p = panel.value
  const running = p && typeof p.getAnimations === 'function' && p.getAnimations().some((a) => a.transitionProperty === 'grid-template-rows' && a.playState === 'running')
  if (running) {
    timer = setTimeout(fallback, 50)
    return
  }
  settle()
}
function startAnim() {
  animating.value = true
  clearTimeout(timer)
  // Respaldo del transitionend (una transición de 0s no lo emite: movimiento reducido), con el DOM ya actualizado
  nextTick(() => {
    clearTimeout(timer)
    timer = setTimeout(fallback, transitionMs(panel.value) + 50)
  })
}
function onTransitionend(event) {
  if (event.target === event.currentTarget && event.propertyName === 'grid-template-rows') settle()
}

// ---------- collapsible ----------
function setOpen(v, { silent = false } = {}) {
  if (v === openL.value) return
  // Plegar con el foco dentro (por programa): al botón ANTES de aplicar inert, sin desplazar (nunca a <body>, 2.4.3)
  if (!v && panel.value && typeof document !== 'undefined' && panel.value.contains(document.activeElement)) {
    toggleEl.value?.focus({ preventScroll: true })
  }
  openL.value = v
  if (!silent) emit('update:open', v)
  startAnim()
}
function toggle() {
  setOpen(!openL.value)
}
watch(() => props.open, (v) => {
  if (isCollapsible.value) setOpen(Boolean(v), { silent: true })
})
// Abrir para llevar a un campo (envío, showErrors(), enlace del resumen, focusFirstError(); #287): en un cuadro, sin
// animar (is-instant en el mismo parche que is-open), y se cancela la petición para que quien la despachó espere un parche.
// Se escucha en __panel (`@g-open-request` = OPEN_REQUEST de formContext.js): una petición desde el encabezado no abre
function onOpenRequest(event) {
  if (!isCollapsible.value || openL.value) return
  clearTimeout(timer)
  timer = null
  animating.value = false
  instant.value = true
  openL.value = true
  emit('update:open', true)
  event.preventDefault()
  nextFrame(() => nextFrame(() => { instant.value = false }))
}

// ---------- addable ----------
const confirmable = computed(() => Boolean(labelOf('removeTitle') && labelOf('removeConfirm') && labelOf('removeCancel')))
const removeVisible = computed(() => isAddable.value && addedL.value && editable.value && Boolean(labelOf('remove')))
function focusAdd() {
  const b = root.value && root.value.querySelector('.g-form-section__add-button')
  if (b) b.focus({ preventScroll: true })
}
function remountNow() {
  if (!pendingRemount) return
  pendingRemount = false
  gen.value++
}
async function add() {
  remountNow() // volver a agregar empieza vacía, también a mitad del plegado
  edited.value = false
  appAdded.value = false
  addedL.value = true
  emit('update:added', true)
  startAnim()
  await nextTick()
  // Contexto antes que campo (form r01 §4): el título ocupa el sitio del botón
  titleEl.value?.focus?.({ preventScroll: true })
}
function discard({ user, focus }) {
  addedL.value = false
  edited.value = false
  appAdded.value = false
  pendingRemount = true
  if (user) {
    emit('update:added', false)
    // Descartar datos es un cambio (#288): sube `dirty` de GForm
    if (form && typeof form.notifyChange === 'function') form.notifyChange(null, false)
  }
  startAnim()
  if (focus) nextTick(focusAdd)
}
let confirmed = false
function requestRemove() {
  // Algo que perder: escribió desde que la agregó, o la agregó la aplicación (datos guardados)
  if (confirmable.value && (edited.value || appAdded.value)) {
    confirmOpen.value = true
    return
  }
  discard({ user: true, focus: true })
}
function confirmRemove(close) {
  confirmed = true
  close()
  discard({ user: true, focus: false })
}
// El retorno nativo iría a «Quitar …», que ya no existe
function onConfirmClosed() {
  if (!confirmed) return
  confirmed = false
  focusAdd()
}
watch(() => props.added, (v) => {
  if (!isAddable.value) return
  const next = Boolean(v)
  if (next === addedL.value) return
  if (next) {
    // Agregar por programa (datos ya guardados): sin mover el foco; quitar después pide confirmación
    remountNow()
    edited.value = false
    appAdded.value = true
    addedL.value = true
    startAnim()
  } else {
    // Quitar por programa descarta igual; si el foco estaba dentro, a «Agregar …»
    const inside = typeof document !== 'undefined' && root.value && root.value.contains(document.activeElement)
    discard({ user: false, focus: Boolean(inside) })
  }
})
// «Editado»: input/change nativos que burbujean desde el cuerpo (los de notifyChange() llegan por sectionKey)
function onEditEvent() {
  if (isAddable.value && addedL.value) edited.value = true
}

// ---------- Encabezado al lado y acciones que bajan de línea (#289; L9 también en static) ----------
function contentWidth(el) {
  const cs = getComputedStyle(el)
  return el.getBoundingClientRect().width - (parseFloat(cs.paddingInlineStart) || 0) - (parseFloat(cs.paddingInlineEnd) || 0) - (parseFloat(cs.borderInlineStartWidth) || 0) - (parseFloat(cs.borderInlineEndWidth) || 0)
}
// Se llama en un cuadro (requestAnimationFrame: el observador compartido ya lo difiere); escribe solo si cambia
function measure() {
  const el = root.value
  if (!el || typeof getComputedStyle !== 'function') return
  const space = spaceUnit(el)
  const width = el.getBoundingClientRect().width
  // Sin caja (oculta, sin maquetar) no se decide nada
  if (!width) return
  const s = props.headerPlacement === 'auto' && width >= space * 200
  let b = false
  const h = header.value
  const a = actions.value
  if (!s && h && a && a.children.length) {
    // Ancho natural de las acciones (hijos + separaciones): igual en los dos estados, sin vaivén
    const kids = [...a.children]
    const gap = parseFloat(getComputedStyle(a).columnGap) || 0
    const natural = kids.reduce((sum, k) => sum + k.getBoundingClientRect().width, 0) + gap * (kids.length - 1)
    const hgap = parseFloat(getComputedStyle(h).columnGap) || 0
    // Viniendo de «al lado», el encabezado aún mide su columna: el de arriba ocupa el ancho de la sección
    const hw = side.value ? contentWidth(el) : h.getBoundingClientRect().width
    b = hw - natural - hgap < space * 40
  }
  if (side.value !== s) side.value = s
  if (below.value !== b) below.value = b
}
let offRoot = null
let offActions = null
const needsMeasure = () => props.headerPlacement === 'auto' || Boolean(actions.value)
watch(actions, (el) => {
  offActions?.()
  offActions = el ? observeSize(el, measure) : null
  if (!el && below.value) below.value = false
}, { flush: 'post' })
watch(() => props.headerPlacement, () => nextFrame(measure))

// ---------- Avisos de desarrollo ([Grana GFormSection], una vez por instancia) ----------
const warn = (m) => console.warn(`[Grana GFormSection] ${m}`)
if (isDev) {
  const vnodeProps = getCurrentInstance()?.vnode.props || {}
  const passed = (k) => Object.prototype.hasOwnProperty.call(vnodeProps, k)
  if (props.mode !== 'collapsible' && (passed('open') || passed('onUpdate:open'))) warn('open (y v-model:open) solo vale con mode="collapsible": se ignora.')
  if (props.mode !== 'addable' && (passed('added') || passed('onUpdate:added'))) warn('added (y v-model:added) solo vale con mode="addable": se ignora.')
  if (props.mode !== 'collapsible' && (props.summary !== undefined || slots.summary)) warn('summary (prop o slot) solo vale con mode="collapsible": no se pinta.')
  if (props.mode === 'addable') {
    if (!labelOf('add')) warn('mode="addable" sin labels.add: no se pinta «Agregar …» (la aplicación aún puede agregar con added).')
    if (!labelOf('remove')) warn('mode="addable" sin labels.remove: no se pinta «Quitar …».')
    if (!confirmable.value) warn('mode="addable" sin labels.removeTitle, removeConfirm o removeCancel: «Quitar …» quita sin confirmar.')
    if (props.optional) warn('optional con mode="addable": no se pinta la insignia (el botón «Agregar …» ya dice que es opcional).')
  }
  if (!props.title && !slots.title) warn('necesita title o el slot title.')
  if (props.optional && props.mode !== 'addable' && !badgeText.value) {
    if (form && typeof form.warnOnce === 'function') form.warnOnce('label-sectionOptional', 'falta labels.sectionOptional: la sección opcional va sin insignia.')
    else warn('optional necesita labels.sectionOptional de GForm para la insignia.')
  }
  watch(() => props.mode, () => warn('mode cambió tras montar: se espera fijo durante la vida de la sección; se pinta en el modo nuevo.'))
}
// Aviso 7: nada interactivo en la línea de estado (es la descripción del botón; su contenido no se puede usar)
const INTERACTIVE = 'a[href], button, input, select, textarea, [tabindex]'
let warnedSummary = false
function checkSummary() {
  if (!isDev || warnedSummary || !summaryEl.value) return
  if (summaryEl.value.querySelector(INTERACTIVE)) {
    warnedSummary = true
    warn('la línea de estado (summary) no admite nada interactivo: es la descripción del botón y su contenido no se puede usar.')
  }
}
onUpdated(checkSummary)

// Raíces que no deben ir directas en el cuerpo (form.md §3 «El cuerpo no distribuye» y §14 «Colocación», #283)
const BODY_FIELD_ROOTS = ['g-input', 'g-textarea', 'g-select', 'g-datepicker', 'g-input-group', 'g-radio-group', 'g-checkbox', 'g-checkbox-group', 'g-switch', 'g-field-group', 'g-form-row', 'g-form-reveal']

onMounted(() => {
  const el = root.value
  if (isDev && el) {
    // Una sección dentro de un GFormReveal (form.md §14 aviso 3, #279; no por una sección agregable, #288)
    if (parentReveal && parentReveal.fromReveal) warn('va dentro de un GFormReveal: la sección contiene la pregunta y el bloque, no al revés.')
    // Campos, filas o bloques condicionales directos en el cuerpo (#283): un solo aviso aunque haya varios
    const b = body.value
    if (b && Array.from(b.children).some((c) => BODY_FIELD_ROOTS.some((k) => c.classList.contains(k)))) {
      warn('los campos de una sección van en un `GFormLayout` (separación, ancho completo y densidad); el cuerpo de la sección no distribuye.')
    }
    // Un GDivider a mano entre dos secciones (#192, #290)
    const prev = el.previousElementSibling
    if (prev && prev.classList.contains('g-divider') && prev.previousElementSibling && prev.previousElementSibling.classList.contains('g-form-section')) {
      warn('hay un GDivider a mano antes de esta sección: entre secciones la separación es el espacio; para una línea, usa `divider` en la sección.')
    }
    checkSummary()
  }
  if (el) offRoot = observeSize(el, measure)
  if (actions.value) offActions = observeSize(actions.value, measure)
  // Primera medida en un cuadro y, DESPUÉS de pintarla, is-ready (si no, el paso a «al lado» de un panel plegado
  // animaría su margen al cargar). Sin medida que hacer, is-ready tras el primer pintado
  nextFrame(() => {
    if (needsMeasure()) measure()
    nextFrame(() => nextFrame(() => { ready.value = true }))
  })
})
onBeforeUnmount(() => {
  offRoot?.()
  offActions?.()
  clearTimeout(timer)
})

// ---------- Marcado ----------
const classes = computed(() => [
  'g-form-section',
  `g-form-section--mode-${props.mode}`,
  {
    'g-form-section--optional': props.optional,
    'is-open': !isStatic.value && shown.value,
    'is-added': isAddable.value && addedL.value,
    'is-animating': animating.value,
    'is-ready': ready.value && !isStatic.value,
    'is-instant': instant.value,
    'is-header-side': side.value,
    'is-actions-below': below.value
  }
])
const hasDescription = () => Boolean(props.description) || Boolean(slots.description)
const hasActions = () => Boolean(slots.actions) || removeVisible.value
</script>

<template>
  <section v-bind="attrs" ref="root" :class="classes" :hidden="hiddenRoot || undefined">
    <GDivider v-if="divider" decorative emphasis="subtle" inset="none" class="g-form-section__divider" />
    <div v-if="isAddable && !addedL && editable" class="g-form-section__add">
      <GBtn v-if="labelOf('add')" class="g-form-section__add-button" variant="outline" color="neutral" :aria-describedby="hasDescription() ? `${baseId}-add-description` : undefined" @click="add">
        <template #prepend><GIcon name="plus" /></template>{{ labelOf('add') }}
      </GBtn>
      <p v-if="hasDescription()" :id="`${baseId}-add-description`" class="g-form-section__description"><slot name="description">{{ description }}</slot></p>
    </div>
    <div v-else-if="!isAddable || addedL" ref="header" class="g-form-section__header">
      <div class="g-form-section__heading">
        <span v-if="slots.lead && !isCollapsible" class="g-form-section__lead" aria-hidden="true"><slot name="lead" /></span>
        <component :is="`h${level}`" ref="titleEl" class="g-form-section__title" :id="isAddable ? `${baseId}-title` : undefined" :tabindex="isAddable ? -1 : undefined">
          <button
            v-if="isCollapsible"
            ref="toggleEl"
            :id="`${baseId}-toggle`"
            type="button"
            class="g-form-section__toggle"
            :aria-expanded="openL ? 'true' : 'false'"
            :aria-controls="`${baseId}-panel`"
            :aria-describedby="showSummary() ? `${baseId}-summary` : undefined"
            @click="toggle"
          >
            <span class="g-form-section__chevron" aria-hidden="true"><GIcon name="chevron-right" /></span>
            <span v-if="slots.lead" class="g-form-section__lead" aria-hidden="true"><slot name="lead" /></span>
            <span class="g-form-section__toggle-text"><slot name="title">{{ title }}</slot></span>
          </button>
          <slot v-else name="title">{{ title }}</slot>
        </component>
        <GBadge v-if="optional && badgeText && !isAddable" size="sm" variant="soft" color="neutral">{{ badgeText }}</GBadge>
      </div>
      <p v-if="showSummary()" :id="`${baseId}-summary`" ref="summaryEl" class="g-form-section__summary">
        <span v-if="statusText" class="g-form-section__status"><GIcon name="circle-alert" />{{ statusText }}</span>
        <span v-if="hasSummaryText()" class="g-form-section__summary-text"><slot name="summary">{{ summary }}</slot></span>
      </p>
      <p v-if="hasDescription()" class="g-form-section__description"><slot name="description">{{ description }}</slot></p>
      <div v-if="hasActions()" ref="actions" class="g-form-section__actions">
        <slot name="actions" />
        <GBtn v-if="removeVisible" class="g-form-section__remove" variant="ghost" color="neutral" @click="requestRemove">{{ labelOf('remove') }}</GBtn>
      </div>
      <div v-if="slots.help" class="g-form-section__help"><slot name="help" /></div>
    </div>
    <div v-if="isStatic" ref="body" class="g-form-section__body"><slot /></div>
    <div
      v-else
      ref="panel"
      :id="`${baseId}-panel`"
      class="g-form-section__panel"
      :inert="shown ? undefined : ''"
      @transitionend="onTransitionend"
      @g-open-request="onOpenRequest"
      @input="onEditEvent"
      @change="onEditEvent"
    >
      <component
        :is="isAddable ? 'fieldset' : 'div'"
        :key="gen"
        ref="body"
        class="g-form-section__body"
        :role="isAddable ? 'none' : undefined"
        :disabled="isAddable && !addedL ? true : undefined"
      ><slot /></component>
    </div>
    <GDialog
      v-if="isAddable && confirmable"
      v-model="confirmOpen"
      role="alertdialog"
      size="sm"
      class="g-form-section__confirm"
      :title="labelOf('removeTitle')"
      :description="labelOf('removeBody') || undefined"
      @closed="onConfirmClosed"
    >
      <template #footer="{ close }">
        <GBtn variant="outline" color="neutral" autofocus @click="close()">{{ labelOf('removeCancel') }}</GBtn>
        <GBtn variant="solid" color="danger" @click="confirmRemove(close)">{{ labelOf('removeConfirm') }}</GBtn>
      </template>
    </GDialog>
  </section>
</template>
