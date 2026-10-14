<script setup>
// GPageHeader · encabezado de página (dueño: bruno)
// Contrato: design/contracts/page-header.md (#626 a #635) · Estructura: design/lab/page-header/r01/ (kiwi; B · Zócalo con el
// muelle de C solo en estrecho) · Estilo: GPageHeader.css (coco).
// Entrada propia `@grana/vue/page-header` (#633). Lo compartido (edgeReserve, sizeObserver, spaceUnit/nextFrame, motion)
// llega por `__shared`: un solo registro de reservas de borde por documento.
//
// Qué hace el .vue (el resto es CSS de coco):
//  - mide la raíz (is-narrow por debajo de space × 150), el zócalo (--_lift, regla del cuarto) y la entrada pública
//    --g-page-header-top; pone is-sticky / is-stuck y escribe --_p (título compacto) una vez por cuadro y solo si cambia,
//    DIRECTAMENTE en el estilo de la raíz: el desplazamiento no vuelve a pintar Vue (lección de bd888df);
//  - en estrecho y pegado, muda LOS MISMOS NODOS de las acciones al muelle con un Teleport de `disabled` conmutado; la
//    mudanza espera si el foco está dentro de las acciones o si hay un aria-expanded="true" (panel abierto);
//  - publica dos reservas de borde (zócalo pegado arriba, muelle abierto abajo) con EDGE_ORDER.pageHeader;
//  - al cambiar la pestaña del zócalo estando pegado, coloca la página al instante (MutationObserver de aria-selected);
//  - expone focus() al hN.
// Sin window/document al importar ni en el servidor: todo empieza al montar.
import { computed, onBeforeMount, onBeforeUnmount, onMounted, onUpdated, ref, shallowRef, useAttrs, useId, useSlots, watch } from 'vue'
import { nextFrame, spaceUnit } from '../GForm/formContext.js'
import { observeSize } from '../../utils/sizeObserver.js'
import { EDGE_ORDER, clearEdgeReserve, edgeReserve, setEdgeReserve } from '../../utils/edgeReserve.js'
import { transitionMs } from '../../utils/motion.js'

defineOptions({ name: 'GPageHeader' })

const props = defineProps({
  title: { type: String, default: undefined },
  headingLevel: { type: Number, default: 1 },
  eyebrow: { type: String, default: undefined },
  description: { type: String, default: undefined },
  sticky: { type: Boolean, default: true },
  zone: { type: String, default: 'none' },
  labels: { type: Object, default: () => ({}) },
  id: { type: String, default: undefined }
})

const slots = useSlots()
const attrs = useAttrs()

// Constantes de diseño (page-header.md «No son tokens»)
const NARROW_SPACES = 150 // estrecho por debajo de space × 150
const QUARTER = 0.25 // lo pegado nunca ocupa más de un cuarto del alto visible
const STUCK_TOLERANCE = 0.5
const LEVELS = [1, 2, 3]
const ZONES = ['none', 'brand']

// ---------- Avisos de desarrollo ([Grana GPageHeader], una vez por instancia y motivo) ----------
const isDev = () => typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production'
const warned = new Set()
function warnOnce(key, msg) {
  if (!isDev() || warned.has(key)) return
  warned.add(key)
  console.warn(`[Grana GPageHeader] ${msg}`)
}

// ---------- Datos ----------
const uid = useId()
const baseId = computed(() => props.id || `g-page-header-${uid}`)
const titleId = computed(() => `${baseId.value}-title`)
const titleText = computed(() => (typeof props.title === 'string' ? props.title.trim() : ''))
const level = computed(() => (LEVELS.includes(props.headingLevel) ? props.headingLevel : 1))
const zoneValue = computed(() => (ZONES.includes(props.zone) ? props.zone : 'none'))
const labelActions = computed(() => (props.labels && typeof props.labels.actions === 'string' && props.labels.actions) || undefined)

const hasTabs = computed(() => Boolean(slots.tabs))
const hasActions = computed(() => Boolean(slots.actions))
const hasBase = computed(() => hasTabs.value || hasActions.value)

// Estado (cambia pocas veces: solo al cruzar umbrales; el desplazamiento por cuadro no toca nada reactivo)
const narrow = ref(false)
const isSticky = ref(false)
const stuck = ref(false)
const docked = ref(false) // las acciones están en el muelle
const dockOpen = ref(false) // is-open
const dockHidden = ref(true)
const inDialog = ref(false)

const rootEl = ref(null)
const titleEl = ref(null)
const baseEl = ref(null)
const tabsEl = ref(null)
const actionsEl = ref(null)
const dockEl = ref(null)

// Destino del Teleport: un nodo propio creado en el cliente y colocado en el muelle al montar. Así el destino existe desde
// el primer render (Vue resuelve el destino de un Teleport al montarlo y no lo vuelve a resolver mientras está `disabled`)
// y nunca es `body` (Z4: el muelle y lo mudado heredan la zona de marca). En el servidor no hay nodo: el renderizador exige
// una cadena y, con `disabled`, pinta las acciones en su sitio ('body' no se usa nunca como destino).
// Se crea en onBeforeMount (antes del primer render del cliente; nunca en el servidor).
const dockHost = shallowRef(null)
onBeforeMount(() => {
  const el = document.createElement('div')
  el.className = 'g-page-header__dock-host'
  dockHost.value = el
})

const rootClasses = computed(() => [
  'g-page-header',
  {
    'has-base': hasBase.value,
    'has-tabs': hasTabs.value,
    'has-actions': hasActions.value,
    'is-narrow': narrow.value,
    'is-sticky': isSticky.value,
    'is-stuck': stuck.value,
    'is-docked': docked.value
  }
])

// ---------- Medidas ----------
const raf = (fn) => (typeof requestAnimationFrame === 'function' ? requestAnimationFrame(fn) : setTimeout(fn, 16))
const caf = (h) => (typeof cancelAnimationFrame === 'function' ? cancelAnimationFrame(h) : clearTimeout(h))
let reduced = null
const isReduced = () => Boolean(reduced && reduced.matches)

const M = { top: 0, lift: null, pad: 0, baseH: 0, dockH: 0, measured: false, scroller: null }
const written = { lift: null, p: null }

// Escribe una variable en línea en la raíz solo si cambia (datos del .vue al CSS, §29.5)
function writeVar(name, value) {
  const root = rootEl.value
  if (!root) return
  if (value === null) {
    root.style.removeProperty(name)
    return
  }
  if (root.style.getPropertyValue(name) !== value) root.style.setProperty(name, value)
}

// --g-page-header-top resuelta en px con una sonda efímera (admite calc() y var() de la aplicación)
function readTop() {
  const root = rootEl.value
  if (!root) return 0
  const probe = document.createElement('div')
  probe.setAttribute('aria-hidden', 'true')
  probe.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none;inline-size:0;block-size:var(--g-page-header-top)'
  root.appendChild(probe)
  const h = probe.getBoundingClientRect().height
  probe.remove()
  return Number.isFinite(h) ? h : 0
}

// Contenedor que desplaza (el de `position: sticky`): el ancestro más cercano con overflow que desplaza; null = el visor
function scrollerOf(el) {
  for (let a = el.parentElement; a && a !== document.body && a !== document.documentElement; a = a.parentElement) {
    const oy = getComputedStyle(a).overflowY
    if (oy === 'auto' || oy === 'scroll' || oy === 'overlay' || oy === 'hidden') return a
  }
  return null
}
// Borde de arriba de la zona visible del contenedor (borde de relleno), en coordenadas del visor
const scrollerTop = () => (M.scroller ? M.scroller.getBoundingClientRect().top + M.scroller.clientTop : 0)

function measure() {
  const root = rootEl.value
  if (!root) return
  M.scroller = scrollerOf(root)
  const space = spaceUnit(root)
  narrow.value = root.clientWidth > 0 && root.clientWidth < space * NARROW_SPACES
  M.top = readTop()
  // `position: sticky` se mide desde el borde del relleno del contenedor MENOS su padding (los tres motores): un cuerpo de
  // GDialog con relleno dejaría el zócalo ese relleno más abajo. El relleno se suma al top negativo (--_lift).
  M.pad = M.scroller ? Math.max(0, parseFloat(getComputedStyle(M.scroller).paddingTop) || 0) : 0
  const base = baseEl.value
  if (base) {
    M.baseH = base.offsetHeight
    M.lift = Math.round((base.getBoundingClientRect().top - root.getBoundingClientRect().top) * 100) / 100
    M.measured = M.baseH > 0
  } else {
    M.baseH = 0
    M.lift = null
    M.measured = false
  }
  checkBase()
  schedule()
}

// ---------- Cuadro a cuadro (ligado al desplazamiento) ----------
let frame = 0
function schedule() {
  if (frame || !rootEl.value) return
  frame = raf(() => {
    frame = 0
    update()
  })
}

function update() {
  const root = rootEl.value
  if (!root) return
  const vh = window.innerHeight
  const canStick = props.sticky && hasBase.value && M.measured && M.lift !== null && M.baseH <= vh * QUARTER
  if (canStick !== isSticky.value) isSticky.value = canStick
  if (canStick) {
    const lift = `${Math.round((M.lift + M.pad) * 100) / 100}px`
    if (written.lift !== lift) { writeVar('--_lift', lift); written.lift = lift }
  } else if (written.lift !== null) {
    writeVar('--_lift', null)
    written.lift = null
  }

  const rr = root.getBoundingClientRect()
  const edge = scrollerTop() + M.top // donde se queda el zócalo pegado
  const nowStuck = canStick && rr.top <= edge - M.lift + STUCK_TOLERANCE
  if (nowStuck !== stuck.value) stuck.value = nowStuck

  // --_p: cuánto del hN quedó por encima de --g-page-header-top (0 a 1)
  let p = 0
  const t = titleEl.value
  if (canStick && t) {
    const tr = t.getBoundingClientRect()
    p = Math.min(1, Math.max(0, (edge - tr.top) / Math.max(1, tr.height)))
    if (isReduced()) p = p >= 0.5 ? 1 : 0
    p = Math.round(p * 1000) / 1000
  }
  const pv = canStick ? String(p) : null
  if (written.p !== pv) { writeVar('--_p', pv); written.p = pv }

  // Reserva de borde del zócalo pegado (fuera de un <dialog>)
  if (nowStuck && !inDialog.value) setEdgeReserve(ownerTop, 'top', M.baseH, { order: EDGE_ORDER.pageHeader })
  else clearEdgeReserve(ownerTop)

  // Muelle (solo en estrecho y pegado)
  wantDock = Boolean(nowStuck && narrow.value && hasActions.value && !inDialog.value && dockFits(vh))
  applyDock()
  if (dockOpen.value) placeDock(rr)
}

// ---------- Muelle ----------
const ownerTop = Symbol('GPageHeader·zócalo')
const ownerBottom = Symbol('GPageHeader·muelle')
let wantDock = false
let hideTimer = 0
let fitTimer = 0

// Regla del cuarto para zócalo + muelle. El alto del muelle se mide la primera vez que se abre y se recuerda.
const dockFits = (vh) => !M.dockH || M.baseH + M.dockH <= vh * QUARTER

// La mudanza espera: lo que tiene el foco no se muda, ni lo que tiene un panel abierto (aria-expanded="true")
function blocked() {
  const a = actionsEl.value
  if (!a) return false
  if (typeof document !== 'undefined' && a.contains(document.activeElement)) return true
  return Boolean(a.querySelector('[aria-expanded="true"]'))
}

function applyDock() {
  if (wantDock === docked.value) return
  if (blocked()) return // se reintenta en focusout y al cerrarse el panel
  if (wantDock) openDock()
  else closeDock()
}

function openDock() {
  const dock = dockEl.value
  if (!dock) return
  clearTimeout(hideTimer)
  docked.value = true
  dockHidden.value = false
  dock.toggleAttribute('hidden', false)
  dock.toggleAttribute('inert', false)
  void dock.offsetHeight // el estado de partida de la transición de entrada
  nextFrame(() => {
    if (!docked.value) return
    dockOpen.value = true
    const h = dock.offsetHeight
    if (h > 0) {
      M.dockH = h
      if (!dockFits(window.innerHeight)) {
        // No cabe con el zócalo (regla del cuarto): las acciones se quedan en el zócalo pegado
        wantDock = false
        closeDock()
        return
      }
    }
    placeDock(rootEl.value ? rootEl.value.getBoundingClientRect() : null)
    publishDock()
    clearTimeout(fitTimer)
    fitTimer = setTimeout(checkDockEdge, transitionMs(dock) + 60)
  })
}

function closeDock() {
  docked.value = false
  dockOpen.value = false
  clearEdgeReserve(ownerBottom)
  const dock = dockEl.value
  if (!dock) return
  dock.toggleAttribute('inert', true)
  clearTimeout(hideTimer)
  const hide = () => {
    if (docked.value) return
    dockHidden.value = true
    dock.toggleAttribute('hidden', true)
  }
  if (isReduced()) hide()
  else {
    // `hidden` cuando termina la salida (la duración la da el CSS de coco)
    nextFrame(() => {
      const ms = transitionMs(dock)
      if (ms > 0) hideTimer = setTimeout(hide, ms)
      else hide()
    })
  }
}

// Caja física del encabezado y reserva previa del borde inferior (la pill de la voz)
const speechBelow = computed(() => edgeReserve('bottom', { before: EDGE_ORDER.pageHeader }))
function placeDock(rr) {
  const dock = dockEl.value
  if (!dock || !rr) return
  const vw = document.documentElement.clientWidth || window.innerWidth
  const set = (n, v) => { if (dock.style.getPropertyValue(n) !== v) dock.style.setProperty(n, v) }
  set('--_dock-left', `${Math.round(rr.left * 100) / 100}px`)
  set('--_dock-right', `${Math.max(0, Math.round((vw - rr.right) * 100) / 100)}px`)
  set('--_dock-offset', `${speechBelow.value}px`)
}
function publishDock() {
  const dock = dockEl.value
  if (!dockOpen.value || !dock) return
  const h = dock.offsetHeight // el sitio final (la traslación no cambia offsetHeight)
  if (h > 0) setEdgeReserve(ownerBottom, 'bottom', h, { order: EDGE_ORDER.pageHeader })
}
watch(speechBelow, () => {
  if (dockOpen.value && rootEl.value) placeDock(rootEl.value.getBoundingClientRect())
})

// Aviso 8: un ancestro que crea bloque contenedor para lo fijo atrapa el muelle
function checkDockEdge() {
  const dock = dockEl.value
  if (!dockOpen.value || !dock || !isDev()) return
  const r = dock.getBoundingClientRect()
  if (!r.height) return // sin maquetación (jsdom): nada que medir
  const vh = document.documentElement.clientHeight || window.innerHeight
  if (Math.abs(r.bottom + speechBelow.value - vh) > 2) {
    warnOnce('trap', 'el muelle no llega al borde inferior del visor: un ancestro con transform, translate, scale, filter, backdrop-filter, perspective, contain, container-type o will-change lo atrapa (page-header.md «Pegado», regla 7).')
  }
}

function onActionsFocusOut() {
  // El foco aún no ha llegado a su destino durante focusout
  setTimeout(() => { if (wantDock !== docked.value) applyDock() })
}

function onDockLink(e) {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
  const t = titleEl.value
  if (!t) return
  e.preventDefault()
  // El hN está dentro de una raíz pegada (desplazada por sticky): scrollIntoView mediría la posición pegada. Se lleva al
  // inicio desde su sitio en el flujo (una sonda vacía justo antes de la raíz), respetando el scroll-padding de la aplicación.
  const root = rootEl.value
  const probe = document.createElement('div')
  root.before(probe)
  const natural = probe.getBoundingClientRect().top + (t.getBoundingClientRect().top - root.getBoundingClientRect().top)
  probe.remove()
  const sc = M.scroller
  const pad = parseFloat(getComputedStyle(sc || document.documentElement).scrollPaddingBlockStart) || 0
  ;(sc || window).scrollBy({ top: natural - scrollerTop() - pad })
  t.focus({ preventScroll: true })
}

// ---------- Cambio de pestaña con el encabezado pegado ----------
function onTabSelected() {
  const root = rootEl.value
  if (!root || !stuck.value) return
  // El primer hermano siguiente que se pinta (un GTabPanel inactivo está oculto)
  let next = root.nextElementSibling
  while (next && !next.getClientRects().length) next = next.nextElementSibling
  if (!next) return
  // El principio del cuerpo que sigue queda justo bajo el zócalo pegado
  const delta = next.getBoundingClientRect().top - (scrollerTop() + M.top + M.baseH)
  if (Math.abs(delta) < 0.5) return
  ;(M.scroller || window).scrollBy({ top: delta, behavior: 'instant' })
  schedule()
}

// ---------- Comprobaciones de desarrollo que necesitan el DOM ----------
function checkBase() {
  if (!isDev()) return
  const base = baseEl.value
  if (base && M.baseH > 0) {
    const kids = [...(tabsEl.value ? tabsEl.value.children : []), ...(actionsEl.value ? actionsEl.value.children : [])]
    if (kids.some((k) => k.getBoundingClientRect().height > M.baseH + 0.5)) {
      warnOnce('tall', 'el contenido del zócalo es más alto que el zócalo (max(space × 12, 44px)): GTabs en una fila y GBtn hasta size="lg".')
    }
  }
  if (tabsEl.value && tabsEl.value.querySelector('.g-tabs__panels')) {
    warnOnce('panels', 'el slot tabs lleva un GTabs con paneles integrados: debe ir con detached y sus GTabPanel en el cuerpo de la página (#118).')
  }
  if (actionsEl.value && actionsEl.value.querySelectorAll('.g-btn--variant-solid.g-btn--color-brand').length > 1) {
    warnOnce('solid', 'más de una acción sólida de marca en el grupo: una sola acción principal (tokens.md §2).')
  }
  const root = rootEl.value
  if (root && isSticky.value && root.parentElement) {
    const ph = root.parentElement.getBoundingClientRect().height
    if (Math.abs(ph - root.getBoundingClientRect().height) < 1) {
      warnOnce('parent', 'el padre del encabezado mide lo mismo que él: el pegado no hará nada. El encabezado debe ser hijo directo del contenedor largo (normalmente main), sin envoltorio (ni de zona).')
    }
  }
}

function checkProps() {
  if (!titleText.value) warnOnce('title', 'falta title (o está vacío): es el texto del encabezado, del título compacto y del enlace del muelle.')
  if (!LEVELS.includes(props.headingLevel)) warnOnce('level', `headingLevel=${props.headingLevel} no está en 1–3: se usa 1.`)
  if (hasActions.value && !labelActions.value) warnOnce('labels', 'hay acciones y falta labels.actions (nombre del grupo de acciones).')
  if (!ZONES.includes(props.zone)) warnOnce('zone', `zone="${props.zone}" no está en none | brand: se usa none.`)
  if (zoneValue.value === 'brand' && attrs['data-theme'] !== undefined) {
    warnOnce('zone-theme', 'zone="brand" y data-theme en la misma raíz: el tema ganaría a la zona (api.md «Zona de marca», regla 4).')
  }
}
watch(() => [props.title, props.headingLevel, props.zone, hasActions.value, labelActions.value].join('\u0000'), checkProps, { immediate: true })

// ---------- Ciclo de vida ----------
let unobserveRoot = () => {}
let unobserveBase = () => {}
let tabsObserver = null
let expandedObserver = null
let onScroll = null
let onResize = null
let onReduced = null

function observeBase() {
  unobserveBase()
  unobserveBase = baseEl.value ? observeSize(baseEl.value, measure) : () => {}
}

function observeTabs() {
  if (tabsObserver) tabsObserver.disconnect()
  tabsObserver = null
  if (!tabsEl.value || typeof MutationObserver === 'undefined') return
  tabsObserver = new MutationObserver((list) => {
    if (list.some((m) => m.target.getAttribute && m.target.getAttribute('aria-selected') === 'true' && m.oldValue !== 'true')) onTabSelected()
  })
  tabsObserver.observe(tabsEl.value, { attributes: true, attributeFilter: ['aria-selected'], attributeOldValue: true, subtree: true })
}

function observeExpanded() {
  if (expandedObserver) expandedObserver.disconnect()
  expandedObserver = null
  if (!actionsEl.value || typeof MutationObserver === 'undefined') return
  // Al cerrarse un panel de las acciones, la mudanza que esperaba se aplica
  expandedObserver = new MutationObserver(() => { if (wantDock !== docked.value) applyDock() })
  expandedObserver.observe(actionsEl.value, { attributes: true, attributeFilter: ['aria-expanded'], subtree: true })
}

onMounted(() => {
  const root = rootEl.value
  inDialog.value = Boolean(root.closest('dialog'))
  if (dockEl.value && dockHost.value && !dockHost.value.parentNode) dockEl.value.appendChild(dockHost.value)
  if (isDev() && level.value === 1 && document.querySelectorAll('h1').length > 1) {
    warnOnce('h1', 'headingLevel 1 y ya hay otro h1 en el documento: un h1 por página (usa headingLevel 2 o 3 en una vista anidada).')
  }
  reduced = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null
  onScroll = () => schedule()
  onResize = () => measure()
  onReduced = () => schedule()
  window.addEventListener('scroll', onScroll, { passive: true, capture: true })
  window.addEventListener('resize', onResize)
  if (reduced && reduced.addEventListener) reduced.addEventListener('change', onReduced)
  unobserveRoot = observeSize(root, measure)
  observeBase()
  observeTabs()
  observeExpanded()
  measure()
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (rootEl.value) measure() })
})

// Si las piezas del zócalo aparecen o desaparecen (slots condicionales), se vuelven a observar
watch(baseEl, () => { if (rootEl.value) { observeBase(); measure() } })
watch(tabsEl, () => { if (rootEl.value) observeTabs() })
watch(actionsEl, () => { if (rootEl.value) observeExpanded() })
watch(() => props.sticky, () => schedule())

// Un parche de Vue sobre `style` (atributo de la aplicación) podría borrar las variables en línea: se reescriben
onUpdated(() => {
  const root = rootEl.value
  if (!root) return
  if (written.lift !== null && root.style.getPropertyValue('--_lift') !== written.lift) root.style.setProperty('--_lift', written.lift)
  if (written.p !== null && root.style.getPropertyValue('--_p') !== written.p) root.style.setProperty('--_p', written.p)
})

onBeforeUnmount(() => {
  if (frame) caf(frame)
  frame = 0
  clearTimeout(hideTimer)
  clearTimeout(fitTimer)
  unobserveRoot()
  unobserveBase()
  if (tabsObserver) tabsObserver.disconnect()
  if (expandedObserver) expandedObserver.disconnect()
  if (onScroll) window.removeEventListener('scroll', onScroll, { capture: true })
  if (onResize) window.removeEventListener('resize', onResize)
  if (reduced && reduced.removeEventListener && onReduced) reduced.removeEventListener('change', onReduced)
  clearEdgeReserve(ownerTop)
  clearEdgeReserve(ownerBottom)
})

defineExpose({
  focus(options) {
    if (titleEl.value) titleEl.value.focus(options)
  }
})
</script>

<template>
  <header ref="rootEl" :id="props.id" :class="rootClasses" :data-g-zone="zoneValue === 'brand' ? 'brand' : undefined">
    <slot name="trail" />
    <div class="g-page-header__head">
      <div class="g-page-header__titles">
        <p v-if="eyebrow || $slots.eyebrow" class="g-page-header__eyebrow"><slot name="eyebrow">{{ eyebrow }}</slot></p>
        <component :is="`h${level}`" :id="titleId" ref="titleEl" class="g-page-header__title" tabindex="-1" dir="auto"><slot name="title">{{ titleText }}</slot></component>
        <p v-if="description || $slots.description" class="g-page-header__desc"><slot name="description">{{ description }}</slot></p>
        <div v-if="$slots.meta" class="g-page-header__meta"><slot name="meta" /></div>
      </div>
    </div>
    <div v-if="$slots.default" class="g-page-header__content"><slot /></div>
    <div v-if="hasBase" ref="baseEl" class="g-page-header__base">
      <span v-if="!narrow" class="g-page-header__base-title" aria-hidden="true" dir="auto">{{ titleText }}</span>
      <div v-if="hasTabs" ref="tabsEl" class="g-page-header__tabs"><slot name="tabs" /></div>
      <div v-if="hasActions" class="g-page-header__actions-home">
        <Teleport :to="dockHost || 'body'" :disabled="!docked">
          <div ref="actionsEl" class="g-page-header__actions" role="group" :aria-label="labelActions" @focusout="onActionsFocusOut"><slot name="actions" :narrow="narrow" :docked="docked" /></div>
        </Teleport>
      </div>
    </div>
    <div v-if="hasActions && !inDialog" ref="dockEl" class="g-page-header__dock" :class="{ 'is-open': dockOpen }" :hidden="dockHidden" inert>
      <a class="g-page-header__dock-title" :href="`#${titleId}`" dir="auto" @click="onDockLink">{{ titleText }}</a>
    </div>
  </header>
</template>
