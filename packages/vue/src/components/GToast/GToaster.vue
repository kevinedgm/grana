<script setup>
// GToaster · región de avisos de un gestor (dueño: bruno)
// Contrato: design/contracts/toast.md · Estructura: design/lab/toast/r01/ · Estilo: GToast.css (coco)
// Una región por gestor: raíz popover="manual" siempre abierta (capa superior), dos canales vivos permanentes fuera de la
// section, lista no viva. Se traslada (mismos nodos, Teleport de destino reactivo) al <dialog> modal superior y vuelve al body.
// En el servidor no pinta nada: la región se crea al montar (onMounted) y ahí empiezan escuchas, observador y temporizadores.
import { computed, inject, nextTick, onBeforeUnmount, onBeforeUpdate, onMounted, onUpdated, reactive, ref, toRaw, useAttrs, useId, watch } from 'vue'
import { fill } from '../../utils/template.js'
import GSurface from '../GSurface/GSurface.vue'
import GBtn from '../GBtn/GBtn.vue'
import GBadge from '../GBadge/GBadge.vue'
import GIcon from '../GIcon/GLibIcon.js'
import { ANNOUNCE, INTERNAL, MOBILE_SPACES, SWIPE, matchesHotkey, toasterKey } from './toaster.js'
import { createTopModal } from '../../utils/topModal.js'
import { createLiveWriter } from '../../utils/liveRegion.js'
import { edgeReserve } from '../../utils/edgeReserve.js'

defineOptions({ name: 'GToaster', inheritAttrs: false })

const props = defineProps({
  // Gestor que pinta esta región; por defecto, el provisto con app.use(toaster)
  toaster: { type: Object, default: undefined }
})

const isDev = typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production'
const attrs = useAttrs()
const injected = inject(toasterKey, null)
const manager = toRaw(props.toaster) || injected
const api = manager && manager[INTERNAL] ? manager[INTERNAL] : null
if (!api && isDev) console.warn('[Grana GToaster] <GToaster> sin prop `toaster` y sin gestor provisto (app.use(createToaster(…))): no pinta nada.')
const S = api ? api.state : null

const ICON = { info: 'info', success: 'circle-check', warning: 'triangle-alert', error: 'circle-alert', loading: 'loader-circle' }
const raf = (cb) => (typeof requestAnimationFrame === 'function' ? requestAnimationFrame(cb) : setTimeout(cb, 16))
const caf = (h) => (typeof cancelAnimationFrame === 'function' ? cancelAnimationFrame(h) : clearTimeout(h))

// ---------- Estado de la región ----------
const uid = useId()
const rootId = computed(() => attrs.id || `g-toaster-${uid}`)
const active = ref(false)
const host = ref(null)
const rootEl = ref(null)
const listEl = ref(null)
const flipped = ref(false)
const live = reactive({ polite: '', assertive: '' })
const entered = reactive(new Set())
const leaveY = reactive({})
const swipes = reactive({})
const els = new Map() // uid → li
const uidOfEl = new WeakMap()
let saved = null // elemento enfocado antes de entrar en la región

const L = computed(() => (S ? S.opts.labels : {}))
const position = computed(() => (S ? S.opts.position : 'bottom-end'))
const align = computed(() => position.value.split('-')[1])
const edge = computed(() => {
  let e = position.value.split('-')[0]
  if (S && S.mobile) e = 'bottom'
  if (flipped.value) e = e === 'top' ? 'bottom' : 'top'
  return e
})
// Orden del DOM = orden visual: el más reciente junto al borde (abajo: último; arriba: primero)
const rendered = computed(() => {
  if (!S) return []
  const list = S.items.filter((r) => r.state === 'visible' || r.state === 'leaving').sort((a, b) => a.revealSeq - b.revealSeq)
  return edge.value === 'top' ? list.reverse() : list
})
const visibleToasts = computed(() => rendered.value.filter((r) => r.state === 'visible'))
const paused = computed(() => Boolean(S && Object.values(S.paused).some(Boolean)))
const hotkey = computed(() => (S && S.opts.hotkey !== false ? S.opts.hotkey : ''))
const regionLabel = computed(() => (L.value.region ? fill(L.value.region, { hotkey: hotkey.value }) : undefined))
const queuedText = computed(() => (S && S.queue.length && L.value.queued ? fill(L.value.queued, { count: S.queue.length }) : ''))

const toLength = (v) => (typeof v === 'number' ? `${v}px` : v)
// Borde compartido con GSpeechHost (speech.md §6.7, #225): la reserva que publica la pill flotante en el borde efectivo
// de la región se suma a su offset de ese borde (GToast.css no cambia: lee las mismas variables)
const rootStyle = computed(() => {
  const o = S ? S.opts.offset : {}
  const s = {}
  for (const side of ['top', 'bottom']) {
    const reserve = active.value && edge.value === side ? edgeReserve(side) : 0
    const own = o[side] !== undefined ? toLength(o[side]) : undefined
    if (reserve > 0) s[`--_toaster-offset-${side}`] = `calc(${own ?? '0px'} + ${reserve}px)`
    else if (own !== undefined) s[`--_toaster-offset-${side}`] = own
  }
  return s
})
const rootClasses = computed(() => ['g-toaster', `g-toaster--position-${position.value}`, { 'is-paused': paused.value }])

const safeId = (id) => String(id).replace(/[^\w-]/g, '-')
const liId = (t) => `${rootId.value}-t${safeId(t.id)}`
const titleId = (t) => `${liId(t)}-title`
const descId = (t) => `${liId(t)}-desc`
const describedBy = (t) => (t.description ? `${titleId(t)} ${descId(t)}` : titleId(t))
const typeLabel = (t) => (t.type !== 'neutral' && L.value.types ? L.value.types[t.type] : undefined)
const repeatedLabel = (t) => (L.value.repeated ? fill(L.value.repeated, { count: t.count }) : undefined)
const stateOf = (t) => (t.state === 'leaving' ? 'leaving' : entered.has(t.uid) ? 'visible' : 'entering')
const toastClasses = (t) => [
  'g-toast',
  `g-toast--type-${t.type}`,
  {
    'has-action': Boolean(t.action),
    'has-description': Boolean(t.description),
    'is-loading': t.type === 'loading',
    'is-swiping': Boolean(swipes[t.uid] && swipes[t.uid].active)
  }
]
const toastStyle = (t) => {
  const s = {}
  if (swipes[t.uid]) s['--_toast-swipe'] = `${swipes[t.uid].px}px`
  if (t.state === 'leaving' && leaveY[t.uid] !== undefined) s['--_toast-y'] = `${leaveY[t.uid]}px`
  return s
}
const setEl = (key, c) => {
  const el = c && c.$el
  if (el && el.nodeType === 1) {
    els.set(key, el)
    uidOfEl.set(el, key)
  } else els.delete(key)
}

// ---------- Canales vivos: vaciar y escribir en el siguiente ciclo (un texto idéntico se vuelve a anunciar) ----------
// Útil compartido con GSpeechHost (utils/liveRegion.js): varios anuncios en el mismo ciclo se escriben juntos
const writer = createLiveWriter(live, ANNOUNCE)
const announce = (text, politeness) => writer.announce(text, politeness)

// ---------- Foco ----------
const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
const hostEl = () => host.value || (typeof document !== 'undefined' ? document.body : null)
function usable(el) {
  if (!el || !el.isConnected || el === document.body || typeof el.focus !== 'function') return false
  if (rootEl.value && rootEl.value.contains(el)) return false
  if (el.closest && el.closest('[inert]')) return false
  const h = hostEl()
  return h === document.body || h.contains(el)
}
function hostFallback() {
  const h = hostEl()
  const found = [...h.querySelectorAll(FOCUSABLE)].find((el) => usable(el))
  return found || (h !== document.body ? h : null)
}
function focusEl(el) {
  if (el && typeof el.focus === 'function') el.focus({ preventScroll: true })
}
function returnFocus() {
  const target = usable(saved) ? saved : hostFallback()
  saved = null
  focusEl(target)
}
// Tras cerrar con el foco dentro: cierre del vecino más reciente; si no, el elemento guardado; si no, el primer control del anfitrión
function moveFocusAfterClose(r) {
  const others = visibleToasts.value.filter((x) => x.uid !== r.uid).sort((a, b) => b.revealSeq - a.revealSeq)
  const li = others.length ? els.get(others[0].uid) : null
  if (li) focusEl(li.querySelector('.g-toast__close'))
  else returnFocus()
}
const focusInside = (el) => Boolean(el && el.contains(document.activeElement))

// ---------- Ciclo de vida de un aviso ----------
function transitionMs(el) {
  const cs = getComputedStyle(el)
  const list = (v) => String(v || '').split(',').map((x) => {
    const n = parseFloat(x)
    return Number.isFinite(n) ? (x.trim().endsWith('ms') ? n : n * 1000) : 0
  })
  const d = list(cs.transitionDuration)
  const dl = list(cs.transitionDelay)
  return d.reduce((m, v, i) => Math.max(m, v + (dl[i % dl.length] || 0)), 0)
}
const removals = new Set()
const region = {
  announce,
  // Antes de pasar a leaving: fijar --_toast-y donde está (el resto se recoloca con FLIP) y sacar el foco si estaba dentro
  beforeLeave(r) {
    const li = els.get(r.uid)
    if (!li) return
    leaveY[r.uid] = edge.value === 'bottom' && li.parentElement
      ? li.parentElement.clientHeight - li.offsetTop - li.offsetHeight
      : li.offsetTop
    if (focusInside(li)) moveFocusAfterClose(r)
  },
  // Retirada por tiempo fijo (la transición calculada del propio aviso), sin esperar transitionend
  leave(r) {
    nextTick(() => {
      const li = els.get(r.uid)
      const h = setTimeout(() => {
        removals.delete(h)
        api.remove(r.uid)
      }, li ? transitionMs(li) : 0)
      removals.add(h)
    })
  },
  beforeClear() {
    if (focusInside(listEl.value)) returnFocus()
  }
}

// ---------- Modal: la región sigue al <dialog> modal superior (utils/topModal.js, compartido con GSpeechHost) ----------
// Sin predicado `ignore`: la hoja móvil de GSpeechHost también es un modal y los avisos deben seguir operables encima.
const topModal = createTopModal({ onChange: (top) => { host.value = top || document.body } })
// Sacar un popover abierto del documento lo cierra: se vuelve a abrir tras cada traslado (y queda encima del modal)
function reopen() {
  const el = rootEl.value
  if (!el || typeof el.showPopover !== 'function') return
  let open = false
  try { open = el.matches(':popover-open') } catch { open = false }
  if (!open) {
    try { el.showPopover() } catch { /* sin soporte o ya abierto */ }
  }
}
// Marcadores del Teleport (texto vacío antes y después de la raíz, puestos por Vue al montar). Al cambiar `to`, Vue 3.5
// traslada el final y la raíz pero deja el inicio en el destino anterior; ese inicio apunta al final y Vue lo salta al
// buscar el siguiente nodo de un hermano: si quedaba dentro de un <dialog>, GDialog insertaba ante un nodo que ya estaba
// en body (insertBefore). Se capturan al montar y viajan con la raíz: inicio, raíz, final, como en un montaje nuevo.
let markers = null
watch(rootEl, (el) => {
  const s = el && el.previousSibling
  const e = el && el.nextSibling
  const blank = (n) => Boolean(n && n.nodeType === 3 && n.data === '')
  markers = blank(s) && blank(e) ? [s, e] : null
}, { flush: 'post' })
function keepMarkers() {
  const el = rootEl.value
  const parent = el && el.parentNode
  if (!parent || !markers) return
  const [s, e] = markers
  if (el.previousSibling !== s) parent.insertBefore(s, el)
  if (el.nextSibling !== e) parent.insertBefore(e, el.nextSibling)
}
let refocus = null
watch(host, () => { refocus = focusInside(rootEl.value) ? document.activeElement : null }, { flush: 'pre' })
watch(host, () => {
  keepMarkers()
  reopen()
  if (refocus && refocus.isConnected) focusEl(refocus)
  refocus = null
}, { flush: 'post' })

// ---------- Móvil (visor < space × 130, medido) ----------
function measureMobile() {
  const rs = getComputedStyle(document.documentElement)
  const raw = rs.getPropertyValue('--g-space-1').trim()
  let space = parseFloat(raw)
  if (raw.endsWith('rem')) space *= parseFloat(rs.fontSize)
  api.setMobile(Number.isFinite(space) && space > 0 && window.innerWidth < space * MOBILE_SPACES)
}

// ---------- No tapar el foco (2.4.11): pasar al borde contrario ----------
function overlaps(el) {
  const list = listEl.value
  if (!list) return false
  const s = list.getBoundingClientRect()
  if (!s.width || !s.height) return false
  const r = el.getBoundingClientRect()
  return r.left < s.right && r.right > s.left && r.top < s.bottom && r.bottom > s.top
}
let avoiding = false
async function avoidFocus() {
  if (avoiding || !active.value) return
  avoiding = true
  try {
    if (!visibleToasts.value.length) {
      flipped.value = false
      return
    }
    const f = document.activeElement
    if (!f || f === document.body || f === hostEl() || focusInside(rootEl.value)) return
    if (flipped.value) {
      flipped.value = false
      await nextTick()
      if (!overlaps(f)) return
      flipped.value = true
      await nextTick()
      return
    }
    if (overlaps(f)) {
      flipped.value = true
      await nextTick()
      if (overlaps(f)) {
        flipped.value = false
        await nextTick()
      }
    }
  } finally {
    avoiding = false
  }
}
const scheduleAvoid = () => raf(() => { avoidFocus() })

// ---------- Escuchas ----------
function onDocKeydown(event) {
  if (event.isComposing || !S || !matchesHotkey(event, S.hotkeyKeys)) return
  const vis = visibleToasts.value
  if (!vis.length) return // sin avisos no se intercepta
  event.preventDefault()
  if (focusInside(rootEl.value)) {
    returnFocus()
    return
  }
  saved = document.activeElement && document.activeElement !== document.body ? document.activeElement : null
  const newest = vis.slice().sort((a, b) => b.revealSeq - a.revealSeq)[0]
  const li = els.get(newest.uid)
  if (li) focusEl(li.querySelector('.g-toast__action') || li.querySelector('.g-toast__close'))
}
function onRegionKeydown(event) {
  if (event.key !== 'Escape' || event.isComposing) return
  const li = event.target && event.target.closest ? event.target.closest('.g-toast') : null
  const key = li ? uidOfEl.get(li) : undefined
  if (key === undefined) return
  // No llega al <dialog> anfitrión (GDialog escucha Esc en burbuja) ni genera su `cancel`
  event.preventDefault()
  event.stopPropagation()
  api.close(key, 'escape')
}
function onFocusin(event) {
  const from = event.relatedTarget
  if (from && !rootEl.value.contains(from)) saved = from
  api.setPause('focus', true)
}
function onFocusout(event) {
  if (rootEl.value && rootEl.value.contains(event.relatedTarget)) return
  api.setPause('focus', false)
  if (event.relatedTarget) saved = null
}
const onPointerenter = () => api.setPause('hover', true)
const onPointerleave = () => api.setPause('hover', false)
const onVisibility = () => api.setPause('hidden', document.visibilityState === 'hidden')
const onDocFocusin = (event) => { if (!rootEl.value || !rootEl.value.contains(event.target)) scheduleAvoid() }
const onResize = () => { measureMobile(); scheduleAvoid() }

// Deslizar para cerrar: solo táctil o lápiz, horizontal (touch-action: pan-y en el CSS). Un dedo apoyado pausa.
function onPointerdown(event, t) {
  if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return
  if (t.state !== 'visible') return
  const li = event.currentTarget
  const key = t.uid
  api.setPause('press', true)
  const canSwipe = S.opts.swipe && !(event.target.closest && event.target.closest('button'))
  const x0 = event.clientX
  const t0 = Date.now()
  if (canSwipe) {
    swipes[key] = { px: 0, active: true }
    try { li.setPointerCapture(event.pointerId) } catch { /* sin captura */ }
  }
  const move = (ev) => { if (canSwipe && swipes[key]) swipes[key].px = ev.clientX - x0 }
  const end = (ev) => {
    li.removeEventListener('pointermove', move)
    li.removeEventListener('pointerup', end)
    li.removeEventListener('pointercancel', end)
    api.setPause('press', false)
    if (!canSwipe || !swipes[key]) return
    const dx = ev.type === 'pointercancel' ? 0 : ev.clientX - x0
    const w = li.offsetWidth || 1
    const v = Math.abs(dx) / Math.max(1, Date.now() - t0)
    if (Math.abs(dx) > w * SWIPE.distance || (Math.abs(dx) >= w * SWIPE.minDistance && v > SWIPE.velocity)) {
      swipes[key] = { px: Math.sign(dx) * w, active: false }
      api.close(key, 'swipe')
    } else swipes[key] = { px: 0, active: false }
  }
  li.addEventListener('pointermove', move)
  li.addEventListener('pointerup', end)
  li.addEventListener('pointercancel', end)
}

// ---------- Recolocación FLIP (transform) y entrada en dos fotogramas ----------
// No se usa TransitionGroup: decide si mover leyendo la transición del PRIMER hijo, y un aviso que sale (data-state="leaving")
// no transiciona transform; con el primero saliendo, la pila no se recolocaba. Aquí se mide cada aviso.
let before = null
let beforeEdge = null
let focusMemo = null
onBeforeUpdate(() => {
  if (!active.value || !listEl.value) return
  before = new Map()
  for (const [key, el] of els) if (el.dataset.state !== 'leaving' && el.isConnected) before.set(key, el.getBoundingClientRect())
  beforeEdge = rootEl.value ? rootEl.value.dataset.edge : null
  focusMemo = null
  for (const [key, el] of els) {
    if (focusInside(el)) focusMemo = { key, action: document.activeElement.classList.contains('g-toast__action') }
  }
})
const scheduled = new Set()
const frames = new Set()
function afterRender() {
  if (!S) return
  // Prune
  const alive = new Set(S.items.map((r) => r.uid))
  for (const k of [...entered]) if (!alive.has(k)) entered.delete(k)
  for (const k of Object.keys(leaveY)) if (!alive.has(Number(k))) delete leaveY[k]
  for (const k of Object.keys(swipes)) if (!alive.has(Number(k))) delete swipes[k]
  // entering → visible dos fotogramas después de insertar
  for (const t of rendered.value) {
    if (t.state === 'leaving' || entered.has(t.uid) || scheduled.has(t.uid)) continue
    const key = t.uid
    scheduled.add(key)
    const h1 = raf(() => {
      frames.delete(h1)
      const h2 = raf(() => { frames.delete(h2); scheduled.delete(key); entered.add(key) })
      frames.add(h2)
    })
    frames.add(h1)
  }
}
onUpdated(() => {
  afterRender()
  // Conservar el foco en el control equivalente si una actualización lo quitó (acción → acción; si desaparece, cerrar)
  if (focusMemo && !focusInside(rootEl.value)) {
    const li = els.get(focusMemo.key)
    if (li && li.dataset.state !== 'leaving') focusEl((focusMemo.action && li.querySelector('.g-toast__action')) || li.querySelector('.g-toast__close'))
  }
  focusMemo = null
  const prev = before
  before = null
  if (!prev || !rootEl.value || beforeEdge !== rootEl.value.dataset.edge) return
  const moved = []
  for (const [key, el] of els) {
    const a = prev.get(key)
    if (!a || el.dataset.state === 'leaving') continue
    const b = el.getBoundingClientRect()
    const dx = a.left - b.left
    const dy = a.top - b.top
    if (!dx && !dy) continue
    el.style.transitionDuration = '0s'
    el.style.transform = `translate(${dx}px, ${dy}px)`
    moved.push(el)
  }
  if (!moved.length) return
  void document.body.offsetHeight // reflujo: el navegador parte de la posición anterior
  for (const el of moved) {
    el.style.transitionDuration = ''
    el.style.transform = ''
  }
})

// Al quedarse sin avisos no llega pointerleave: se quita la pausa por puntero
watch(() => rendered.value.length, (n) => {
  if (!n && api) api.setPause('hover', false)
  if (active.value) scheduleAvoid()
}, { flush: 'post' })

// ---------- Montaje ----------
onMounted(async () => {
  if (!api) return
  if (S.attached) {
    if (isDev) console.warn('[Grana GToaster] dos <GToaster> para el mismo gestor: la segunda no pinta nada.')
    return
  }
  if (isDev) {
    if (!L.value.region) console.warn('[Grana GToaster] falta labels.region: la región de avisos queda sin nombre.')
    if (!L.value.close) console.warn('[Grana GToaster] falta labels.close: el botón cerrar queda sin nombre accesible (se dibuja igual).')
  }
  topModal.scan()
  // Se reclama el gestor en el acto (dos regiones montadas en el mismo ciclo: gana la primera). Los anuncios esperan
  // ANNOUNCE.delay, así que la región ya está en el árbol cuando se escribe el primero.
  if (!api.attach(region)) {
    if (isDev) console.warn('[Grana GToaster] dos <GToaster> para el mismo gestor: la segunda no pinta nada.')
    return
  }
  topModal.sync()
  active.value = true
  // El observador empieza ya: un <dialog> hermano posterior se abre en su propio onMounted, en este mismo ciclo
  topModal.observe()
  await nextTick()
  reopen()
  measureMobile()
  onVisibility()
  afterRender()
  document.addEventListener('keydown', onDocKeydown)
  document.addEventListener('visibilitychange', onVisibility)
  document.addEventListener('focusin', onDocFocusin)
  window.addEventListener('resize', onResize)
})
onBeforeUnmount(() => {
  if (!api || !active.value) return
  api.detach(region)
  for (const k of Object.keys(S.paused)) api.setPause(k, false)
  document.removeEventListener('keydown', onDocKeydown)
  document.removeEventListener('visibilitychange', onVisibility)
  document.removeEventListener('focusin', onDocFocusin)
  window.removeEventListener('resize', onResize)
  topModal.disconnect()
  writer.dispose()
  removals.forEach((h) => clearTimeout(h))
  frames.forEach((h) => caf(h))
})
</script>

<template>
  <Teleport v-if="active && host" :to="host">
    <div
      v-bind="attrs"
      :id="rootId"
      ref="rootEl"
      :class="rootClasses"
      :style="rootStyle"
      popover="manual"
      :data-position="position"
      :data-edge="edge"
      :data-align="align"
      :data-mobile="S.mobile ? '' : undefined"
      :data-flipped="flipped ? '' : undefined"
    >
      <div class="g-toaster__live" role="status" aria-live="polite" aria-atomic="true">{{ live.polite }}</div>
      <div class="g-toaster__live" role="alert" aria-atomic="true">{{ live.assertive }}</div>
      <section
        class="g-toaster__region"
        :hidden="rendered.length ? undefined : true"
        :aria-label="regionLabel"
        :aria-keyshortcuts="hotkey || undefined"
        @keydown="onRegionKeydown"
        @focusin="onFocusin"
        @focusout="onFocusout"
      >
        <ol ref="listEl" class="g-toaster__list" @pointerenter="onPointerenter" @pointerleave="onPointerleave">
          <GSurface
            v-for="t in rendered"
            :key="t.uid"
            :ref="(c) => setEl(t.uid, c)"
            as="li"
            level="floating"
            padding="sm"
            :id="liId(t)"
            :class="toastClasses(t)"
            :style="toastStyle(t)"
            :data-type="t.type"
            :data-state="stateOf(t)"
            :aria-busy="t.type === 'loading' ? 'true' : undefined"
            :inert="t.state === 'leaving' ? true : undefined"
            @pointerdown="onPointerdown($event, t)"
          >
            <span v-if="ICON[t.type]" class="g-toast__icon" aria-hidden="true"><GIcon :name="ICON[t.type]" /></span>
            <div class="g-toast__content">
              <p :id="titleId(t)" class="g-toast__title"><span v-if="typeLabel(t)" class="g-toast__type">{{ typeLabel(t) + ': ' }}</span>{{ t.title }}<GBadge v-if="t.count > 1" class="g-toast__count" :count="t.count" :label="repeatedLabel(t)" size="sm" variant="soft" color="neutral" /></p>
              <p v-if="t.description" :id="descId(t)" class="g-toast__description">{{ t.description }}</p>
            </div>
            <div class="g-toast__actions">
              <GBtn v-if="t.action" class="g-toast__action" size="sm" variant="outline" color="neutral" @click="api.action(t.uid)">{{ t.action.label }}</GBtn>
              <GBtn class="g-toast__close" icon size="sm" variant="ghost" color="neutral" :aria-label="L.close" :aria-describedby="describedBy(t)" @click="api.close(t.uid, 'close')"><GIcon name="x" /></GBtn>
            </div>
          </GSurface>
        </ol>
        <p v-if="queuedText" class="g-toaster__queued">{{ queuedText }}</p>
      </section>
    </div>
  </Teleport>
</template>
