<script setup>
// GSpeechHost · anfitrión de la captura de voz (dueño: bruno)
// Contrato: design/contracts/speech.md §6, §10, §11, §12 · Estructura: design/lab/speech/r01/ · Estilo: GSpeechHost.css (coco)
// Uno por gestor, montado lo más alto posible. Raíz popover="manual" siempre abierta (capa superior) con DOS canales vivos
// presentes y vacíos desde el montaje (los únicos que anuncian, §6.2), la pill flotante de respaldo, el panel no modal
// anclado a la pill visible y la hoja móvil (<dialog> modal) bajo space × 130. Se traslada (mismos nodos) al <dialog>
// modal superior que no sea su hoja (utils/topModal.js, compartido con GToaster) y vuelve al body.
// En el servidor no pinta nada: la raíz se crea al montar y ahí empiezan escuchas y observadores.
// F2 (§25.3): diálogo de revisión de respaldo, un GDialog real (class="g-speech-review", size lg, pantalla completa en
// móvil) fuera de la raíz: al abrirse es el modal superior y la raíz (con sus canales vivos) se traslada a él.
import { computed, inject, nextTick, onBeforeUnmount, onMounted, provide, reactive, ref, toRaw, useAttrs, useId, watch } from 'vue'
import SpeechPillView from '../GSpeechPill/SpeechPillView.vue'
import SpeechPanel from './SpeechPanel.vue'
import GDialog from '../GDialog/GDialog.vue'
import GTranscript from '../GTranscript/GTranscript.vue'
import { REVIEW_DIALOG } from '../GTranscript/review.js'
import { INTERNAL, speechKey } from './speech.js'
import { ANNOUNCE, MOBILE_SPACES, matchesHotkey } from '../GToast/toaster.js'
import { placeBlock } from '../../utils/anchor.js'
import { createTopModal } from '../../utils/topModal.js'
import { createLiveWriter } from '../../utils/liveRegion.js'
import { clearEdgeReserve, setEdgeReserve } from '../../utils/edgeReserve.js'

defineOptions({ name: 'GSpeechHost', inheritAttrs: false })

const props = defineProps({
  // Gestor que pinta este anfitrión; por defecto, el provisto con app.use(speech)
  speech: { type: Object, default: undefined }
})

const isDev = typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production'
const attrs = useAttrs()
const injected = inject(speechKey, null)
const manager = toRaw(props.speech) || injected
const api = manager && manager[INTERNAL] ? manager[INTERNAL] : null
if (!api && isDev) console.warn('[Grana Speech] <GSpeechHost> sin prop `speech` y sin gestor provisto (app.use(createSpeech(…))): no pinta nada.')
const S = api ? api.state : null
const ui = api ? api.ui : null

const uid = useId()
const rootId = computed(() => attrs.id || `g-speech-host-${uid}`)
const panelId = computed(() => `${rootId.value}-panel`)
const active = ref(false)
const target = ref(null) // body o el <dialog> modal superior
const rootEl = ref(null)
const floatEl = ref(null)
const floatPill = ref(null)
const panel = ref(null)
const sheet = ref(null)
const mobile = ref(false)
const flipped = ref(false)
const placedVisible = ref(false)
const live = reactive({ polite: '', assertive: '' })
const writer = createLiveWriter(live, ANNOUNCE)
const owner = Symbol('GSpeechHost') // dueño en el registro de reservas de borde

// ---------- Posición de la pill flotante (§6.3; #213) ----------
const position = computed(() => (api ? api.opts.position : 'top-center'))
const edge = computed(() => {
  let e = mobile.value ? 'bottom' : position.value.split('-')[0]
  if (flipped.value) e = e === 'top' ? 'bottom' : 'top'
  return e
})
const align = computed(() => (mobile.value ? 'center' : position.value.split('-')[1]))
const toLength = (v) => (typeof v === 'number' ? `${v}px` : v)
const rootStyle = computed(() => {
  const o = api ? api.opts.offset : {}
  const s = {}
  if (o.top !== undefined) s['--_speech-offset-top'] = toLength(o.top)
  if (o.bottom !== undefined) s['--_speech-offset-bottom'] = toLength(o.bottom)
  return s
})

// ---------- Garantía de la pill visible (§6.3) ----------
const status = computed(() => (S ? S.status : 'idle'))
const inModal = () => target.value && target.value !== document.body
const placedUsable = computed(() => {
  const el = ui && ui.pillEl
  if (!el || status.value === 'idle' || !placedVisible.value) return false
  if (el.closest('[inert]')) return false
  if (inModal() && !target.value.contains(el)) return false
  return true
})
const floatShown = computed(() => status.value !== 'idle' && !placedUsable.value)
const inSheet = computed(() => mobile.value && Boolean(S && S.panelOpen) && status.value !== 'idle')

function visibleMain() {
  if (placedUsable.value && ui.pillEl) return ui.pillEl.querySelector('.g-speech-pill__main')
  if (floatShown.value && floatEl.value) return floatEl.value.querySelector('.g-speech-pill__main')
  return null
}
function visiblePillEl() {
  if (placedUsable.value && ui.pillEl) return ui.pillEl
  if (floatShown.value && floatEl.value) return floatEl.value.querySelector('.g-speech-pill')
  return null
}

// ---------- Foco ----------
const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
function usable(el) {
  if (!el || !el.isConnected || el === document.body || typeof el.focus !== 'function') return false
  if (el.closest('[inert]') || el.closest('[hidden]')) return false
  if (inModal() && !target.value.contains(el)) return false
  return true
}
const focusEl = (el) => { if (el && typeof el.focus === 'function') el.focus({ preventScroll: true }) }
const focusInside = (el) => Boolean(el && typeof document !== 'undefined' && el.contains(document.activeElement))
const inSpeechUi = (el) => Boolean(el && ((rootEl.value && rootEl.value.contains(el)) || (ui.pillEl && ui.pillEl.contains(el))))
function hostFallback() {
  const h = inModal() ? target.value : document.body
  const found = [...h.querySelectorAll(FOCUSABLE)].find((el) => usable(el) && !inSpeechUi(el))
  return found || null
}
let saved = null // elemento enfocado antes del atajo

// ---------- Canales y piezas: interfaz que usa el gestor ----------
const hostApi = {
  get id() { return rootId.value },
  write: (text, politeness) => writer.announce(text, politeness),
  focusPill: () => {
    const m = visibleMain()
    if (m) {
      const f = document.activeElement
      if (f && f !== document.body && !inSpeechUi(f)) saved = f
      focusEl(m)
    }
  }
}

// ---------- Traslado al <dialog> modal superior (sin contar la hoja propia) ----------
const topModal = createTopModal({
  ignore: (d) => Boolean(rootEl.value && rootEl.value.contains(d)) || d === sheet.value,
  onChange: (top) => { target.value = top || document.body }
})
function reopen() {
  const el = rootEl.value
  if (!el || typeof el.showPopover !== 'function') return
  let open = false
  try { open = el.matches(':popover-open') } catch { open = false }
  if (!open) {
    try { el.showPopover() } catch { /* sin soporte o ya abierto */ }
  }
}
// Marcadores del Teleport (como en GToaster): viajan con la raíz al cambiar de destino
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
watch(target, () => { refocus = focusInside(rootEl.value) ? document.activeElement : null }, { flush: 'pre' })
watch(target, async () => {
  keepMarkers()
  reopen()
  if (refocus && refocus.isConnected) focusEl(refocus)
  refocus = null
  checkPlaced()
  await nextTick()
  place()
}, { flush: 'post' })

// ---------- Móvil (visor < space × 130, medido; #103) y movimiento reducido ----------
const spaceUnit = () => {
  const rs = getComputedStyle(document.documentElement)
  const raw = rs.getPropertyValue('--g-space-1').trim()
  let space = parseFloat(raw)
  if (raw.endsWith('rem')) space *= parseFloat(rs.fontSize)
  return Number.isFinite(space) && space > 0 ? space : 0
}
function measureMobile() {
  const space = spaceUnit()
  mobile.value = space > 0 && window.innerWidth < space * MOBILE_SPACES
}
let rmQuery = null
const onReducedMotion = () => { ui.reducedMotion = Boolean(rmQuery && rmQuery.matches) }

// ---------- Pill colocada visible (≥ 95 %) ----------
let io = null
function ratio(el) {
  if (!el || el.hidden) return 0
  const r = el.getBoundingClientRect()
  const area = r.width * r.height
  if (!area) return 0
  const w = Math.max(0, Math.min(r.right, window.innerWidth) - Math.max(r.left, 0))
  const h = Math.max(0, Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0))
  return (w * h) / area
}
function checkPlaced() {
  placedVisible.value = ratio(ui && ui.pillEl) >= 0.95
}
function observePill(el) {
  if (io) io.disconnect()
  io = null
  if (!el || typeof IntersectionObserver === 'undefined') return
  io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.target === ui.pillEl) placedVisible.value = e.isIntersecting && e.intersectionRatio >= 0.95
  }, { threshold: [0, 0.95, 1] })
  io.observe(el)
}

// ---------- Panel anclado a la pill visible (desktop; utils/anchor.js placeBlock) ----------
let placing = false
function place() {
  if (!active.value || !S || !S.panelOpen || mobile.value) return
  const p = panel.value && panel.value.root
  const pill = visiblePillEl()
  if (!p || !pill || p.hidden) return
  const a = pill.getBoundingClientRect()
  const space = spaceUnit() // 0 si no se puede medir (jsdom, SSR): sin margen, sin inventar una unidad (como GToaster y GDialog)
  const rtl = getComputedStyle(rootEl.value || document.documentElement).direction === 'rtl'
  p.style.setProperty('--_speech-max-block', 'none')
  const natural = p.scrollHeight
  const r = placeBlock(a, { width: p.offsetWidth, naturalHeight: natural, vw: window.innerWidth, vh: window.innerHeight, align: 'end', rtl, pad: space * 2, gap: space * 2 })
  p.style.setProperty('--_speech-x', `${Math.round(r.x)}px`)
  p.style.setProperty('--_speech-y', `${Math.round(r.y)}px`)
  p.style.setProperty('--_speech-max-block', `${Math.max(0, Math.round(r.room))}px`)
}
const raf = (cb) => (typeof requestAnimationFrame === 'function' ? requestAnimationFrame(cb) : setTimeout(cb, 16))
function schedulePlace() {
  if (placing) return
  placing = true
  raf(() => { placing = false; place() })
}
let ro = null

// ---------- Borde compartido con GToaster (§6.7, #225): la pill flotante reserva su alto + margen ----------
async function publishReserve() {
  await nextTick()
  if (!active.value) return
  const f = floatEl.value
  if (!floatShown.value || !f || f.hidden) { clearEdgeReserve(owner); return }
  const space = spaceUnit() // 0 si no se puede medir (jsdom, SSR): sin margen, sin inventar una unidad (como GToaster y GDialog)
  const h = f.offsetHeight
  setEdgeReserve(owner, edge.value, h > 0 ? h + space * (mobile.value ? 2 : 4) : 0)
}

// ---------- No tapar el foco (2.4.11): la flotante pasa al borde contrario ----------
function overlaps(el) {
  const f = floatEl.value
  if (!f || f.hidden) return false
  const s = f.getBoundingClientRect()
  if (!s.width || !s.height) return false
  const r = el.getBoundingClientRect()
  return r.left < s.right && r.right > s.left && r.top < s.bottom && r.bottom > s.top
}
let avoiding = false
async function avoidFocus() {
  if (avoiding || !active.value) return
  avoiding = true
  try {
    if (!floatShown.value) { flipped.value = false; return }
    const f = document.activeElement
    if (!f || f === document.body || inSpeechUi(f)) return
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
      if (overlaps(f)) { flipped.value = false; await nextTick() }
    }
  } finally {
    avoiding = false
  }
}

// ---------- Escuchas de documento (solo con sesión) ----------
function onDocKeydown(event) {
  if (event.isComposing || !S || S.status === 'idle') return
  if (api.opts.hotkey === false || !matchesHotkey(event, api.opts.hotkeyKeys)) return
  event.preventDefault()
  const f = document.activeElement
  const pillEl = visiblePillEl()
  const inside = (pillEl && pillEl.contains(f)) || (panel.value && panel.value.root && panel.value.root.contains(f))
  if (inside) {
    const back = saved
    saved = null
    if (usable(back) && !inSpeechUi(back)) focusEl(back)
    return
  }
  saved = f && f !== document.body ? f : null
  focusEl(visibleMain())
}
function onDocPointerdown(event) {
  if (!S || !S.panelOpen || mobile.value) return
  const t = event.target
  if (!t || !t.closest) return
  if ((panel.value && panel.value.root && panel.value.root.contains(t)) || t.closest('.g-speech-pill') || t.closest('.g-speech-trigger')) return
  api.closePanel({ focus: false })
}
const onDocFocusin = (event) => { if (!inSpeechUi(event.target)) raf(() => { avoidFocus() }) }
const onResize = () => {
  measureMobile()
  checkPlaced()
  schedulePlace()
  publishReserve()
  raf(() => { avoidFocus() })
}
const onScroll = () => schedulePlace()
let docListeners = false
function attachDocListeners() {
  if (docListeners) return
  docListeners = true
  document.addEventListener('keydown', onDocKeydown)
  document.addEventListener('pointerdown', onDocPointerdown, true)
  document.addEventListener('focusin', onDocFocusin)
  window.addEventListener('scroll', onScroll, { passive: true, capture: true })
}
function detachDocListeners() {
  if (!docListeners) return
  docListeners = false
  document.removeEventListener('keydown', onDocKeydown)
  document.removeEventListener('pointerdown', onDocPointerdown, true)
  document.removeEventListener('focusin', onDocFocusin)
  window.removeEventListener('scroll', onScroll, { passive: true, capture: true })
}

// ---------- Reacciones al estado ----------
let hadFocus = false
watch(status, () => { hadFocus = active.value && (focusInside(rootEl.value) || focusInside(ui.pillEl)) }, { flush: 'pre' })
watch(status, async (st, prev) => {
  if (!active.value) return
  if (st !== 'idle' && prev === 'idle') attachDocListeners()
  checkPlaced()
  if (st === 'idle') {
    detachDocListeners()
    flipped.value = false
    // Al cerrar la sesión con el foco en la pill o el panel (que desaparecen): al disparador que la inició, o a donde
    // estaba antes del atajo; nunca se pierde en body si el anfitrión está en un modal (§11)
    if (hadFocus || (document.activeElement === document.body && inModal())) {
      const to = [ui.starter, saved].find((el) => usable(el) && !inSpeechUi(el)) || hostFallback()
      focusEl(to)
    }
    saved = null
    hadFocus = false
  }
  publishReserve()
  await nextTick()
  schedulePlace()
}, { flush: 'post' })

watch(() => ui && ui.pillEl, (el) => { observePill(el); checkPlaced() })
watch([floatShown, edge, mobile], () => publishReserve(), { flush: 'post' })
watch(floatShown, (shown) => { if (!shown) flipped.value = false; schedulePlace() }, { flush: 'post' })

// Panel: foco al título al abrir; al cerrar, a quien lo abrió o a la pill visible (el cierre ligero no mueve el foco)
watch(() => S && S.panelOpen, async (open, was) => {
  if (!active.value) return
  await nextTick()
  syncSheet()
  if (open) {
    place()
    if (panel.value) panel.value.focusTitle()
  } else if (was) {
    const back = ui.returnFocus !== false
    ui.returnFocus = true
    if (back && status.value !== 'idle') {
      const to = usable(ui.opener) && !(panel.value && panel.value.root && panel.value.root.contains(ui.opener)) ? ui.opener : visibleMain()
      focusEl(to)
    }
    ui.opener = null
  }
}, { flush: 'post' })
// Al cruzar el umbral con el panel abierto: se reabre en la otra forma con el foco en el título
watch(mobile, async () => {
  if (!active.value || !S.panelOpen) return
  await nextTick()
  syncSheet()
  place()
  if (panel.value) panel.value.focusTitle()
}, { flush: 'post' })

// Hoja móvil: <dialog> modal con el panel dentro
function syncSheet() {
  const d = sheet.value
  if (!d) return
  const want = inSheet.value
  if (want && !d.open && typeof d.showModal === 'function') {
    try { d.showModal() } catch { /* sin soporte */ }
  } else if (!want && d.open && typeof d.close === 'function') d.close()
}
watch(inSheet, async () => { await nextTick(); syncSheet() }, { flush: 'post' })
function onSheetCancel(event) {
  event.preventDefault()
  api.closePanel()
}

// ---------- Diálogo de revisión de respaldo (§25.3) ----------
provide(REVIEW_DIALOG, true) // solo lo leen los GTranscript de dentro del anfitrión: el del diálogo no es superficie
const reviewId = computed(() => `${rootId.value}-review`)
const reviewOpen = computed({
  get: () => Boolean(ui && ui.reviewOpen) && status.value !== 'idle' && Boolean(S.transcript),
  set: (v) => { if (ui) ui.reviewOpen = Boolean(v) }
})
// El diálogo se monta la primera vez que se abre (sin textos que pedir mientras no se usa) y ya no se desmonta: si se
// desmontara con la raíz trasladada dentro, se la llevaría consigo (la raíz vuelve a body cuando el <dialog> se cierra)
const reviewMounted = ref(false)
watch(reviewOpen, (v) => { if (v) reviewMounted.value = true })
// Al abrir, el foco va al título del diálogo (tabindex -1)
function onReviewOpen() {
  nextTick(() => {
    const title = document.getElementById(`${reviewId.value}-title`)
    if (title) {
      title.setAttribute('tabindex', '-1')
      title.focus()
    }
  })
}
// Al cerrar, a quien lo abrió («Revisar» o el botón de la aplicación) o a la pill visible si ya no existe
function onReviewClosed() {
  const back = ui.reviewOpener
  ui.reviewOpener = null
  const to = usable(back) && !inSpeechUi(back) ? back : visibleMain()
  if (to) focusEl(to)
}

// ---------- Montaje ----------
onMounted(async () => {
  if (!api) return
  if (ui.hostAttached) {
    if (isDev) console.warn('[Grana Speech] dos <GSpeechHost> para el mismo gestor: el segundo no pinta nada.')
    return
  }
  topModal.scan()
  if (!api.attachHost(hostApi)) {
    if (isDev) console.warn('[Grana Speech] dos <GSpeechHost> para el mismo gestor: el segundo no pinta nada.')
    return
  }
  topModal.sync()
  active.value = true
  topModal.observe()
  if (typeof matchMedia === 'function') {
    rmQuery = matchMedia('(prefers-reduced-motion: reduce)')
    onReducedMotion()
    if (typeof rmQuery.addEventListener === 'function') rmQuery.addEventListener('change', onReducedMotion)
  }
  await nextTick()
  reopen()
  measureMobile()
  observePill(ui.pillEl)
  checkPlaced()
  window.addEventListener('resize', onResize)
  if (typeof ResizeObserver !== 'undefined' && panel.value && panel.value.root) {
    ro = new ResizeObserver(() => schedulePlace())
    ro.observe(panel.value.root)
  }
  if (S.status !== 'idle') attachDocListeners()
})
onBeforeUnmount(() => {
  if (!api || !active.value) return
  api.detachHost(hostApi)
  topModal.disconnect()
  writer.dispose()
  detachDocListeners()
  window.removeEventListener('resize', onResize)
  if (rmQuery && typeof rmQuery.removeEventListener === 'function') rmQuery.removeEventListener('change', onReducedMotion)
  if (io) io.disconnect()
  if (ro) ro.disconnect()
  clearEdgeReserve(owner)
  if (sheet.value && sheet.value.open) { try { sheet.value.close() } catch { /* sin efecto */ } }
})
</script>

<template>
  <Teleport v-if="active && target" :to="target">
    <div
      v-bind="attrs"
      :id="rootId"
      ref="rootEl"
      class="g-speech-host"
      :style="rootStyle"
      popover="manual"
      :data-edge="edge"
      :data-align="align"
      :data-mobile="mobile ? '' : undefined"
      :data-flipped="flipped ? '' : undefined"
      :data-reduced-motion="ui.reducedMotion ? '' : undefined"
    >
      <div class="g-speech-host__live" role="status" aria-live="polite" aria-atomic="true">{{ live.polite }}</div>
      <div class="g-speech-host__live" role="alert" aria-atomic="true">{{ live.assertive }}</div>
      <div ref="floatEl" class="g-speech-host__float g-surface g-surface--level-floating" :hidden="floatShown ? undefined : true">
        <SpeechPillView ref="floatPill" :speech="manager" placement="floating" />
      </div>
      <Teleport defer :to="sheet" :disabled="!inSheet">
        <SpeechPanel ref="panel" :speech="manager" :panel-id="panelId" :hidden="!S.panelOpen || status === 'idle'" />
      </Teleport>
      <dialog ref="sheet" class="g-speech-sheet" :aria-labelledby="`${panelId}-title`" @cancel="onSheetCancel"></dialog>
    </div>
  </Teleport>
  <Teleport v-if="active && reviewMounted" to="body">
    <GDialog
      :id="reviewId"
      v-model="reviewOpen"
      class="g-speech-review"
      size="lg"
      mobile="fullscreen"
      :title="api.t('review.title')"
      :close-label="api.t('review.close')"
      @open="onReviewOpen"
      @closed="onReviewClosed"
    >
      <GTranscript v-if="S.transcript" :transcript="S.transcript" :speech="manager" :labelledby="`${reviewId}-title`" />
    </GDialog>
  </Teleport>
</template>
