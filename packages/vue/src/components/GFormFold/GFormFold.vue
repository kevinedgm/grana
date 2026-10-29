<script setup>
// GFormFold · crear lo que falta en su sitio, bajo el campo que lo pide (dueño: bruno)
// Contrato: design/contracts/form.md §15 (DECISIONS.md #587, #588) y la base de niveles de dialog.md §«Niveles anidados»
// (#581, #583, #589) · Comportamiento: design/lab/dialog/r02/ (kiwi, concepto C; XcFold es referencia, no implementación)
// · Estilo: GFormFold.css (coco).
// Un formulario propio SIN <form> (HTML no anida formularios): provee su `formKey` con el motor de GForm (formEngine.js,
// compartido, no copiado), hereda la presentación del de fuera y, abierto, se registra fuera como error propio («Termina o
// cancela …»), así el envío de fuera no pasa. Cerrado y asentado: `hidden`, sin rol y sin contenido.
// Entrada propia `@grana/vue/form-fold` (#590): todo lo que importa de fuera de su carpeta llega por `__shared`.
import { computed, inject, nextTick, onBeforeUnmount, onMounted, provide, ref, unref, useAttrs, useId, useSlots, watch } from 'vue'
import { fieldGroupKey, foldKey, formKey, layoutKey, ownFieldKey, revealKey, sectionKey } from '../GForm/formContext.js'
import { createFormEngine } from '../GForm/formEngine.js'
import { useCollapse } from '../../utils/collapse.js'
import { dialogFoldKey } from '../GDialog/dialogContext.js'
import { firstFocusable, focusChain, land, resolveFrom, resolveTarget, usable } from '../../utils/landing.js'
import { acquirePageLive, announcePage } from '../../utils/liveRegion.js'
import { fill } from '../../utils/template.js'
import { observeParent, rowGapOf } from '../GFormReveal/revealGap.js'
import { useDensityEpoch } from '../../utils/density.js'

defineOptions({ name: 'GFormFold', inheritAttrs: false })

const props = defineProps({
  open: Boolean,
  title: { type: String, default: undefined },
  description: { type: String, default: undefined },
  headingLevel: { type: Number, default: undefined, validator: (v) => Number.isInteger(v) && v >= 2 && v <= 6 },
  for: { type: String, default: undefined },
  from: { type: [String, typeof HTMLElement === 'undefined' ? Object : HTMLElement], default: undefined },
  errors: { type: Object, default: () => ({}) },
  warnings: { type: Object, default: () => ({}) },
  labels: { type: Object, default: () => ({}) }
})

const emit = defineEmits(['update:open', 'confirm', 'invalid', 'cancel'])

const attrs = useAttrs()
const slots = useSlots()
const uid = useId()
const rootId = computed(() => attrs.id || `g-form-fold-${uid}`)
const titleId = computed(() => `${rootId.value}-title`)
const descId = computed(() => `${rootId.value}-desc`)
// Nombre interno del registro de fuera: no colisiona con `errors` de la aplicación (form.md §15)
const pendingName = computed(() => `g-fold:${rootId.value}`)

// ---------- Contextos de fuera ----------
const outer = inject(formKey, null) // el GForm o el pliegue padre
const parentFold = inject(foldKey, null)
const outerReveal = inject(revealKey, null)
const outerLayout = inject(layoutKey, null)
const dialogFolds = inject(dialogFoldKey, null)

const depth = computed(() => (parentFold ? unref(parentFold.depth) + 1 : 1))
const level = computed(() => {
  if (props.headingLevel) return props.headingLevel
  const base = parentFold ? unref(parentFold.level) + 1 : unref(outer?.headingLevel) ?? 3
  return Math.min(6, Math.max(2, base))
})
// La densidad de fuera tal cual, sin resolverla a 'default' (#976): useFormField() la resuelve igual
const density = computed(() => unref(outerLayout?.density) ?? unref(outer?.density))

// ---------- Avisos de desarrollo ----------
const warned = new Set()
function warnOnce(key, msg) {
  try {
    if (process.env.NODE_ENV !== 'production' && !warned.has(key)) {
      warned.add(key)
      console.warn(`[Grana GFormFold] ${msg}`)
    }
  } catch {}
}
// Los avisos de los campos (labels.error…) van al de fuera si lo hay, para no repetirlos
const fieldWarn = (k, m) => { try { if (process.env.NODE_ENV !== 'production') outer && typeof outer.warnOnce === 'function' ? outer.warnOnce(k, m) : warnOnce(k, m) } catch {} }

// ---------- Estado de montaje y del plegado ----------
const root = ref(null)
// Separación de la pila que lo contiene (--_fold-gap, como --_reveal-gap de GFormReveal): cerrado no deja hueco
const gap = ref(null)
function readGap() {
  const p = root.value && root.value.parentElement
  if (!p) return
  const g = rowGapOf(p)
  if (gap.value !== g) gap.value = g
}
let stopGap = null
// La separación sigue a la región: un cambio de data-g-density no cambia el tamaño del padre (density.md §7)
watch(useDensityEpoch(), () => readGap())
const bodyEl = ref(null)
const mounted = ref(props.open) // contenido montado: abierto o durante la salida
const expanded = ref(props.open) // is-open (la rejilla 0fr → 1fr de coco)
const collapse = useCollapse({
  panel: root,
  onSettle: () => {
    if (!props.open) mounted.value = false
    else if (expanded.value) settleOpen()
  }
})

// ---------- Motor de formulario propio (form.md §15 «Formulario propio sin <form>») ----------
const engine = createFormEngine({
  errors: () => props.errors,
  warnings: () => props.warnings,
  showErrorsOn: () => unref(outer?.showErrorsOn) ?? 'blur',
  root: () => root.value,
  warnOnce: fieldWarn
})
// Región viva: «off» si lo está el de fuera (su envío) o el propio (confirmar)
const live = computed(() => (engine.live.value === 'off' || unref(outer?.live) === 'off' ? 'off' : 'polite'))
provide(formKey, {
  density,
  marks: computed(() => unref(outer?.marks) ?? 'optional'),
  readonly: computed(() => unref(outer?.readonly) ?? false),
  disabled: computed(() => unref(outer?.disabled) ?? false),
  labels: computed(() => unref(outer?.labels) || {}),
  headingLevel: computed(() => Math.min(6, level.value + 1)),
  showErrorsOn: computed(() => unref(outer?.showErrorsOn) ?? 'blur'),
  ...engine.context,
  live
})
provide(foldKey, { depth, level })
// El cuerpo es una pila como GFormReveal (#278): re‑provee la distribución; corta sección, revelado y grupos de fuera (sus
// campos no cuentan en la sección de fuera ni dependen de un bloque condicional de fuera)
provide(layoutKey, { block: true, density, stack: outerLayout?.stack, readonly: outerLayout?.readonly, disabled: outerLayout?.disabled })
provide(sectionKey, null)
provide(revealKey, null)
provide(fieldGroupKey, null)
provide(ownFieldKey, null)

// ---------- Registro como pendiente en el de fuera (error propio, §2 y §15) ----------
const pendingText = computed(() => {
  const v = props.labels && props.labels.pending
  const t = props.title || ''
  if (typeof v === 'function') return String(v(t) ?? '') || ' '
  return fill(v, { title: t }) || ' ' // sin texto, bloquea igual (con un espacio, como todo error propio)
})
const ownTarget = () => firstFocusable(bodyEl.value) || firstFocusable(root.value)
const entry = {
  uid: `fold-${uid}`,
  role: 'fold',
  inGroup: false,
  names: () => [pendingName.value],
  control: () => ownTarget(),
  root: () => root.value,
  disabled: () => false,
  inactive: () => (outerReveal ? !unref(outerReveal.active) : false),
  ownError: () => (props.open ? pendingText.value : ''),
  ownTarget,
  ownReveal: () => 'submit',
  blocking() {
    if (!props.open) return null
    const t = ownTarget()
    return { name: pendingName.value, message: pendingText.value, id: (t && t.id) || rootId.value }
  },
  visibleTarget() {
    if (!props.open || !outer || typeof outer.ownVisible !== 'function' || !outer.ownVisible(pendingName.value)) return null
    return { control: ownTarget(), root: root.value }
  },
  // GForm construye su FormData sin estos controles (también con formnovalidate)
  excludeFromData: () => bodyEl.value
}
let offOuter = null
let offDialog = null
let releaseLive = null
function bind(on) {
  if (on) {
    if (!offOuter && outer && typeof outer.register === 'function') offOuter = outer.register(entry)
    if (!offDialog && dialogFolds && typeof dialogFolds.register === 'function') offDialog = dialogFolds.register()
    if (!releaseLive) releaseLive = acquirePageLive()
  } else {
    offOuter?.()
    offDialog?.()
    offOuter = null
    offDialog = null
  }
}

// ---------- Abrir y cerrar ----------
let fromEl = null
let pending = null // cómo se cerró por dentro: { kind: 'close', focus, announce } | { kind: 'cancel' }
const container = () => {
  const p = root.value && root.value.parentElement
  return p ? p.closest('.g-form-fold, .g-dialog__step, dialog, form') : null
}
const CONTAINER_SKIP = '.g-dialog__close, .g-dialog__back, .g-dialog__trail-step, .g-dialog__body'

async function onOpened() {
  readGap()
  mounted.value = true
  await nextTick()
  const el = root.value
  if (!el || !props.open) return
  try { if (process.env.NODE_ENV !== 'production') checkInside() } catch {}
  // El estado cerrado ya está pintado (rejilla en 0fr): con un reflujo, is-open anima (sin is-ready, no anima)
  void el.offsetHeight
  expanded.value = true
  collapse.start()
  // Foco (base 3, #292 dentro del pliegue); sin desplazar: el pliegue se lleva a la vista al asentarse
  focusChain([], bodyEl.value || el)
}
// Al asentarse abierto: desplazamiento mínimo para que el pliegue entero quede a la vista si cabe
function settleOpen() {
  const el = root.value
  if (!el || typeof el.scrollIntoView !== 'function') return
  const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
  el.scrollIntoView({ block: 'nearest', behavior: reduce ? 'instant' : 'smooth' })
}
function onClosed() {
  const el = root.value
  const how = pending
  pending = null
  expanded.value = false
  collapse.start()
  if (!mounted.value) return
  const inside = el && typeof document !== 'undefined' && el.contains(document.activeElement)
  const cont = container()
  if (how && how.kind === 'close') {
    // Con resultado (base 7): foco a `focus` › `for` › `from` › #292 del contenedor; llegada; anuncio
    const got = focusChain([how.focus, props.for, fromEl].filter(Boolean), cont, CONTAINER_SKIP)
    // El destino puede aparecer con el cambio de modelo de la aplicación: un intento más con el DOM ya actualizado
    nextTick(() => {
      const t = resolveTarget(how.focus)
      if (t && usable(t) && t !== document.activeElement) t.focus({ preventScroll: true })
      const dest = (t && usable(t) && t) || resolveTarget(props.for) || got
      if ((how.focus || props.for) && dest) land(dest)
      if (how.announce) announcePage(how.announce)
    })
  } else if (how && how.kind === 'cancel') {
    if (inside || !document.activeElement || document.activeElement === document.body) focusChain([fromEl, props.for].filter(Boolean), cont, CONTAINER_SKIP)
  } else if (inside) {
    // Cerrado desde fuera con el foco dentro: from › for › #292 del contenedor
    focusChain([fromEl, props.for].filter(Boolean), cont, CONTAINER_SKIP)
  }
}
// flush 'pre': antes de que Vue aplique inert y el disabled del cuerpo (el foco sale antes de que se pierda)
watch(() => props.open, (v) => {
  if (v) {
    fromEl = resolveFrom(props.from, root.value)
    try {
      if (process.env.NODE_ENV !== 'production') {
        if (typeof props.from === 'string' && !resolveTarget(props.from)) warnOnce(`from-${props.from}`, `\`from\` nombra el id «${props.from}», que no existe al abrir.`)
        if (props.for && !resolveTarget(props.for)) warnOnce(`for-${props.for}`, `\`for\` nombra el id «${props.for}», que no existe al abrir.`)
      }
    } catch {}
    bind(true)
    onOpened()
  } else {
    bind(false)
    onClosed()
  }
})

// ---------- Métodos (slots y defineExpose) ----------
async function confirm() {
  if (!props.open) return
  const list = await engine.revealAll()
  if (list.length) {
    emit('invalid', { errors: list.map(({ name, message, id }) => ({ name, message, id })) })
    engine.reject(list)
    engine.focusAfter(list, { summary: false })
  } else {
    emit('confirm', { close })
  }
}
function close({ focus, announce } = {}) {
  if (!props.open) return
  pending = { kind: 'close', focus, announce }
  emit('update:open', false)
}
function cancelWith(reason) {
  if (!props.open) return
  pending = { kind: 'cancel' }
  emit('cancel', { reason })
  emit('update:open', false)
}
function cancel() {
  cancelWith('cancel')
}

// ---------- Teclado: Enter confirma, Esc recoge solo este pliegue ----------
const SINGLE_LINE = new Set(['text', 'search', 'email', 'url', 'tel', 'password', 'number', 'date', 'datetime-local', 'month', 'week', 'time'])
function onKeydown(event) {
  if (event.defaultPrevented || event.isComposing || !props.open) return
  if (event.key === 'Escape') {
    event.preventDefault()
    if (event.repeat) return // un nivel por pulsación (#565)
    cancelWith('escape')
    return
  }
  if (event.key === 'Enter' && !event.shiftKey && !event.altKey && !event.ctrlKey && !event.metaKey) {
    const t = event.target
    if (!t || t.tagName !== 'INPUT' || !SINGLE_LINE.has(String(t.type || 'text').toLowerCase())) return
    // Solo los campos de ESTE pliegue (uno anidado ya lo trató y lo canceló)
    if (!bodyEl.value || !bodyEl.value.contains(t)) return
    event.preventDefault() // sin envío implícito del <form> de fuera
    confirm()
  }
}

// ---------- Avisos de desarrollo ----------
function checkInside() {
  try {
    if (process.env.NODE_ENV !== 'production') {
      const el = root.value
      if (!el) return
      if (!props.title) warnOnce('title', 'sin `title`: es el nombre del pliegue (y del error que bloquea el envío de fuera).')
      if (!slots.actions) warnOnce('actions', 'sin slot `actions`: no hay forma de confirmar con el puntero.')
      if (outer && !(props.labels && props.labels.pending)) warnOnce('pending', 'falta `labels.pending`: el envío de fuera se bloquea igual con el pliegue abierto, pero el error no tiene texto.')
      const p = el.parentElement
      if (p && p.classList.contains('g-form-row')) warnOnce('row', 'va dentro de una GFormRow: rompe sus pistas; colócalo después de la fila.')
      if (bodyEl.value && bodyEl.value.querySelector('.g-form, .g-form-section')) warnOnce('nested-form', 'lleva un GForm o una GFormSection dentro: el pliegue ya es un formulario propio; usa campos, filas y otros pliegues.')
      if (depth.value > 3) warnOnce('depth', 'más de tres pliegues anidados: cada nivel resta ancho; replantea el flujo (un paso de GDialog).')
    }
  } catch {}
}

onMounted(() => {
  readGap()
  if (root.value) stopGap = observeParent(root.value.parentElement, readGap)
  if (props.open) {
    fromEl = resolveFrom(props.from, root.value)
    bind(true)
    try { if (process.env.NODE_ENV !== 'production') checkInside() } catch {}
  }
})
onBeforeUnmount(() => {
  stopGap?.()
  bind(false)
  if (releaseLive) { releaseLive(); releaseLive = null }
})
// El canal de página se suelta al asentarse cerrado (no al cerrar: el anuncio va después)
watch(mounted, (m) => { if (!m && releaseLive) { const r = releaseLive; releaseLive = null; setTimeout(r, 6000) } })

defineExpose({ confirm, close, cancel })

// ---------- Marcado ----------
const classes = computed(() => [
  'g-form-fold',
  { 'is-open': expanded.value, 'is-animating': collapse.animating.value, 'is-ready': collapse.ready.value }
])
const rootAttrs = computed(() => {
  const { id: _id, class: cls, style, ...rest } = attrs
  return { ...rest, class: [classes.value, cls], style: [style, { '--_d': depth.value }, gap.value === null ? null : { '--_fold-gap': `${gap.value}px` }] }
})
const scope = computed(() => ({ confirm, close, cancel }))
</script>

<template>
  <div
    v-bind="rootAttrs"
    :id="rootId"
    ref="root"
    :role="mounted ? 'group' : undefined"
    :aria-labelledby="mounted && title ? titleId : undefined"
    :aria-describedby="mounted && description ? descId : undefined"
    :hidden="mounted ? undefined : ''"
    :inert="mounted && !open ? '' : undefined"
    @keydown="onKeydown"
    @transitionend="collapse.onTransitionend"
  >
    <div v-if="mounted" class="g-form-fold__panel">
      <div class="g-form-fold__head">
        <component :is="`h${level}`" v-if="title" :id="titleId" class="g-form-fold__title">{{ title }}</component>
        <p v-if="description" :id="descId" class="g-form-fold__description">{{ description }}</p>
      </div>
      <fieldset ref="bodyEl" class="g-form-fold__body" role="none" :disabled="!open"><slot v-bind="scope" /></fieldset>
      <div v-if="$slots.actions" class="g-form-fold__actions"><slot name="actions" v-bind="scope" /></div>
    </div>
  </div>
</template>
