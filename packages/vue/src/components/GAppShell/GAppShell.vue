<script setup>
// GAppShell · chasis de aplicación (dueño: bruno)
// Contrato: design/contracts/app-shell.md (#708 a #718) · Estructura: design/lab/app-shell/r01/ (kiwi; base + A · Cortina por
// defecto, B · Relevo de franja con header="relay", C reservada) · Estilo: GAppShell.css (coco; design/lab/app-shell/estilo.md).
// Entrada propia `@grana/vue/app-shell` (#716). Lo compartido (edgeReserve, appShellKey, sizeObserver, spaceUnit/nextFrame)
// llega por `__shared`: un solo registro de reservas de borde y una sola clave del canal con GPageHeader.
//
// Qué hace el .vue (la reserva del sidebar, la cifra, el presupuesto del cuarto y A son CSS de coco):
//  - pinta los landmarks, el enlace de salto y el `main` único (destino del salto, tabindex="-1");
//  - publica en el registro de bordes la banda pegada arriba (el SITIO FINAL de --g-app-shell-top) y el relleno inferior
//    real del marco abajo (navbar + área segura), con EDGE_ORDER.appShell;
//  - provee el canal interno appShellKey ({ top, notify }) para que GPageHeader mida con la cifra final (S6, #710);
//  - B: un manejador pasivo de scroll que solo decide «cede / no cede» y escribe `is-yielded` DIRECTAMENTE en la raíz al
//    cambiar (el desplazamiento no vuelve a pintar Vue); vuelve al subir, sin zócalo pegado, con el foco en la cabecera
//    (focusin) y al pasar a header="pinned";
//  - los once avisos de desarrollo (nunca en el manejador de desplazamiento ni en resize).
// No navega, no pide datos, no abre el drawer. Sin window/document al importar ni en el servidor: todo empieza al montar.
import { computed, onBeforeUnmount, onMounted, onUpdated, provide, readonly, ref, shallowRef, useId, useSlots, watch } from 'vue'
import { nextFrame, spaceUnit } from '../GForm/formContext.js'
import { observeSize } from '../../utils/sizeObserver.js'
import { EDGE_ORDER, clearEdgeReserve, setEdgeReserve } from '../../utils/edgeReserve.js'
import { appShellKey } from '../../utils/appShell.js'

defineOptions({ name: 'GAppShell' })

const props = defineProps({
  header: { type: String, default: 'pinned' },
  headerZone: { type: String, default: 'none' },
  labels: { type: Object, default: () => ({}) },
  id: { type: String, default: undefined }
})

const slots = useSlots()

const HEADERS = ['pinned', 'relay']
const ZONES = ['none', 'brand']
const RELAY_SPACES = 4 // umbral de B: space × 4 seguidos (app-shell.md «No son tokens»)

// ---------- Avisos de desarrollo ([Grana GAppShell], una vez por instancia y motivo) ----------
const warned = new Set()
function warnOnce(key, msg) {
  try {
    if (process.env.NODE_ENV !== 'production' && !warned.has(key)) {
      warned.add(key)
      console.warn(`[Grana GAppShell] ${msg}`)
    }
  } catch {}
}

// ---------- Datos ----------
const uid = useId()
const baseId = computed(() => props.id || `g-app-shell-${uid}`)
const mainId = computed(() => `${baseId.value}-main`)
const relay = computed(() => props.header === 'relay')
const skipText = computed(() => (props.labels && typeof props.labels.skip === 'string' ? props.labels.skip.trim() : ''))
const zoneBrand = computed(() => props.headerZone === 'brand')

const rootEl = ref(null)
const headerEl = ref(null)
const frameEl = ref(null)
const mainEl = ref(null)

// ---------- Canal con GPageHeader (S6, #710) ----------
const top = shallowRef(0) // px del sitio final de la banda
let inDialog = false
let mounted = false
let yielded = false // B: se escribe en la raíz con classList (no es estado reactivo)
let pinned = 0 // la banda pegada sin ceder (0 sin cabecera o despegada por el presupuesto)
let stuck = false // hay un GPageHeader pegado ahora (is-stuck) en main, fuera de un <dialog>
const ownerTop = Symbol('GAppShell·cabecera')
const ownerBottom = Symbol('GAppShell·navbar')

// Longitud resuelta en px con una sonda efímera en el marco (admite calc(), var() y 100svh de la hoja de coco)
function lengthOf(host, expr, tag) {
  if (!host) return 0
  const probe = document.createElement('div')
  probe.setAttribute('aria-hidden', 'true')
  probe.dataset.gProbe = tag
  probe.style.cssText = `position:absolute;visibility:hidden;pointer-events:none;inline-size:0;block-size:${expr}`
  host.appendChild(probe)
  const h = probe.getBoundingClientRect().height
  probe.remove()
  return Number.isFinite(h) ? h : 0
}

const isNavbar = (root) => [...root.children].some((c) => c.classList.contains('g-sidebar--mode-navbar'))

function findStuck() {
  const main = mainEl.value
  if (!main) return false
  for (const el of main.querySelectorAll('.g-page-header.is-stuck')) if (!el.closest('dialog')) return true
  return false
}

// La cifra y los bordes. Al montar, al redimensionar, al cambiar la banda o la forma del sidebar, al ceder o volver y
// cuando GPageHeader llama a notify()
function compute() {
  const root = rootEl.value
  if (!root || !mounted) return
  if (inDialog) {
    if (top.value !== 0) top.value = 0
    clearEdgeReserve(ownerTop)
    clearEdgeReserve(ownerBottom)
    return
  }
  pinned = headerEl.value ? Math.round(lengthOf(frameEl.value, 'var(--_app-shell-pinned)', 'pinned') * 100) / 100 : 0
  if (yielded && !(relay.value && pinned > 0 && stuck)) setYielded(false, false) // nada que tome el relevo: vuelve
  const t = yielded ? 0 : pinned
  if (top.value !== t) top.value = t
  setEdgeReserve(ownerTop, 'top', t, { order: EDGE_ORDER.appShell })
  const frame = frameEl.value
  const bottom = frame && isNavbar(root) ? parseFloat(getComputedStyle(frame).paddingBlockEnd) || 0 : 0
  setEdgeReserve(ownerBottom, 'bottom', Math.round(bottom * 100) / 100, { order: EDGE_ORDER.appShell })
}

function notify() {
  stuck = findStuck()
  compute()
  // Un salto (Fin, un ancla) llega antes de que el zócalo se pegue: si ya se bajó el umbral, cede en cuanto se pega
  if (listening && stuck && !yielded && acc >= threshold && pinned > 0 && !focusInHeader()) setYielded(true)
}

provide(appShellKey, { top: readonly(top), notify })

// ---------- B · Relevo de franja (#710) ----------
function setYielded(v, recompute = true) {
  if (yielded === v) return
  yielded = v
  acc = 0 // el umbral se vuelve a contar desde aquí: nada encadena una cesión con la vuelta
  const root = rootEl.value
  if (root) root.classList.toggle('is-yielded', v)
  if (recompute) compute()
}

let lastY = 0
let acc = 0
let threshold = 16
const focusInHeader = () => Boolean(headerEl.value && typeof document !== 'undefined' && headerEl.value.contains(document.activeElement))

function onScroll() {
  const y = window.scrollY
  const dy = y - lastY
  lastY = y
  if (!dy) return
  acc = dy > 0 === acc > 0 ? acc + dy : dy
  if (yielded) {
    if (acc <= -threshold || !stuck || y <= 0) setYielded(false)
  } else if (acc >= threshold && stuck && pinned > 0 && !focusInHeader()) {
    setYielded(true)
  }
}

function onHeaderFocusIn() {
  setYielded(false)
}

let listening = false
function listen(on) {
  if (typeof window === 'undefined' || on === listening) return
  listening = on
  if (on) {
    lastY = window.scrollY
    acc = 0
    window.addEventListener('scroll', onScroll, { passive: true })
  } else {
    window.removeEventListener('scroll', onScroll)
  }
}

watch(relay, (on) => {
  if (!mounted) return
  if (!on) setYielded(false)
  listen(on && !inDialog)
})

// ---------- Enlace de salto (2.4.1) ----------
function onSkip(e) {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return // lo hace el navegador
  const main = mainEl.value
  if (!main) return
  e.preventDefault() // sin tocar location.hash: no interfiere con un enrutador por hash
  main.focus({ preventScroll: true })
  if (typeof main.scrollIntoView === 'function') main.scrollIntoView({ block: 'start' }) // respeta el scroll-padding
}

// ---------- Avisos ----------
function checkProps() {
  try { if (process.env.NODE_ENV !== 'production' && !skipText.value) warnOnce('skip', 'falta labels.skip (o está vacío): es el texto del enlace «Saltar al contenido», el primer enfocable de la página.') } catch {}
  try { if (process.env.NODE_ENV !== 'production' && !HEADERS.includes(props.header)) warnOnce(`header:${props.header}`, `header="${props.header}" no está en pinned | relay: se usa pinned.`) } catch {}
  try { if (process.env.NODE_ENV !== 'production' && !ZONES.includes(props.headerZone)) warnOnce(`zone:${props.headerZone}`, `headerZone="${props.headerZone}" no está en none | brand: se usa none.`) } catch {}
  try { if (process.env.NODE_ENV !== 'production' && props.headerZone === 'brand' && !slots.header) warnOnce('zone-header', 'headerZone="brand" sin slot header: no hay banda que pintar.') } catch {}
}
watch(() => [props.header, props.headerZone, skipText.value].join('\u0000'), checkProps, { immediate: true })

function checkDom() {
  try {
    if (process.env.NODE_ENV !== 'production') {
      const root = rootEl.value
      const main = mainEl.value
      if (root && main) {
        if (inDialog) warnOnce('dialog', 'el chasis está dentro de un <dialog>: no publica bordes ni escribe la receta de la cabecera (un chasis por documento, en la página).')
        if (document.querySelectorAll('.g-app-shell').length > 1) warnOnce('two', 'hay más de un GAppShell en el documento: un solo chasis por documento.')
        if (main.querySelector('main, [role="main"]')) warnOnce('main', 'hay un main dentro del main del chasis (<main>, role="main" o GContainer as="main"): el chasis ya pone el único main; usa GContainer con as="div".')
        const kids = [...root.children]
        if (slots.nav && !kids.some((c) => c.classList.contains('g-sidebar') || c.classList.contains('g-sidebar__drawer'))) {
          warnOnce('nav', 'el slot nav no tiene un GSidebar como hijo directo del chasis: un envoltorio hace que GSidebar mida su propia pista y caiga a móvil.')
        }
        if (root.querySelector('.g-sidebar--contained')) warnOnce('contained', 'un GSidebar con contained dentro del chasis: el chasis ya lo coloca fijo al visor; quita contained.')
        const head = headerEl.value
        if (head) {
          const band = head.getBoundingClientRect().height
          if (band > 0 && [...head.children].some((c) => c.getBoundingClientRect().height > band + 0.5)) {
            warnOnce('tall', 'el contenido de la cabecera es más alto que la banda: declara --g-app-shell-header en :root con su alto.')
          }
        }
        if (!inDialog) {
          const html = document.documentElement
          const cs = getComputedStyle(root)
          const own = parseFloat(cs.getPropertyValue('--g-app-shell-top'))
          const base = parseFloat(cs.getPropertyValue('--_app-shell-base')) || 0
          const inMain = parseFloat(getComputedStyle(main).getPropertyValue('--g-page-header-top'))
          const pad = parseFloat(getComputedStyle(html).scrollPaddingBlockStart)
          if ((Number.isFinite(own) && Number.isFinite(inMain) && Math.abs(own - inMain) > 0.5) || (Number.isFinite(own) && Number.isFinite(pad) && Math.abs(own + base - pad) > 0.5)) {
            warnOnce('recipe', 'la aplicación escribe su propia receta de cabecera (--g-page-header-top o scroll-padding-block-start): con GAppShell no hace falta y se cuenta con el valor de la aplicación.')
          }
          const a = cs.getPropertyValue('--g-app-shell-header').trim()
          const b = getComputedStyle(html).getPropertyValue('--g-app-shell-header').trim()
          if (a !== b) warnOnce('header-root', '--g-app-shell-header se declaró en el chasis o en un ancestro que no es :root: el scroll-padding de <html> no lo ve. Declárala en :root.')
        }
      }
    }
  } catch {}
}

// ---------- Ciclo de vida ----------
let unobserveHeader = () => {}
let mutations = null
let onResize = null

// La forma del sidebar (sus clases) y sus nodos: hijos directos de la raíz
function watchNav() {
  if (!mutations) return
  const pending = mutations.takeRecords() // disconnect() descartaría lo que aún no se entregó
  mutations.disconnect()
  const root = rootEl.value
  mutations.observe(root, { childList: true })
  for (const c of root.children) {
    if (c === headerEl.value || c === frameEl.value || c.classList.contains('g-app-shell__skip')) continue
    mutations.observe(c, { attributes: true, attributeFilter: ['class'] })
  }
  if (pending.length) compute()
}

watch(headerEl, () => {
  if (!mounted) return
  unobserveHeader()
  unobserveHeader = headerEl.value ? observeSize(headerEl.value, compute) : () => {}
  compute()
})

onMounted(() => {
  const root = rootEl.value
  inDialog = Boolean(root.closest('dialog'))
  mounted = true
  threshold = spaceUnit(root) * RELAY_SPACES
  onResize = () => {
    threshold = spaceUnit(root) * RELAY_SPACES
    compute()
  }
  window.addEventListener('resize', onResize)
  if (headerEl.value) unobserveHeader = observeSize(headerEl.value, compute)
  if (typeof MutationObserver !== 'undefined') {
    mutations = new MutationObserver((list) => {
      if (list.some((m) => m.type === 'childList')) watchNav()
      compute()
    })
    watchNav()
  }
  if (relay.value && !inDialog) listen(true)
  stuck = findStuck()
  compute()
  // Lo que depende de piezas que se colocan después de montar (el formato del sidebar, is-sticky del encabezado)
  nextFrame(() => nextFrame(() => {
    if (!rootEl.value) return
    compute()
    checkDom()
  }))
})

// Un parche de Vue sobre `class` (atributo de la aplicación, slot que aparece) podría borrar is-yielded: se reescribe
onUpdated(() => {
  const root = rootEl.value
  if (root && root.classList.contains('is-yielded') !== yielded) root.classList.toggle('is-yielded', yielded)
  if (mutations) watchNav()
})

onBeforeUnmount(() => {
  mounted = false
  listen(false)
  if (onResize) window.removeEventListener('resize', onResize)
  unobserveHeader()
  if (mutations) mutations.disconnect()
  clearEdgeReserve(ownerTop)
  clearEdgeReserve(ownerBottom)
})
</script>

<template>
  <div
    ref="rootEl"
    :id="props.id"
    :class="['g-app-shell', { 'g-app-shell--header-relay': relay, 'has-header': !!$slots.header, 'has-footer': !!$slots.footer }]"
  >
    <a class="g-app-shell__skip" :href="`#${mainId}`" @click="onSkip">{{ skipText }}</a>
    <header v-if="$slots.header" ref="headerEl" class="g-app-shell__header" :data-g-zone="zoneBrand ? 'brand' : undefined" @focusin="onHeaderFocusIn"><slot name="header" /></header>
    <slot name="nav" />
    <div ref="frameEl" class="g-app-shell__frame">
      <main ref="mainEl" :id="mainId" class="g-app-shell__main" tabindex="-1"><slot /></main>
      <footer v-if="$slots.footer" class="g-app-shell__footer"><slot name="footer" /></footer>
    </div>
  </div>
</template>
