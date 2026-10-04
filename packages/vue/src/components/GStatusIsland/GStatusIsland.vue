<script setup>
// GStatusIsland · la isla de estado de un gestor (dueño: bruno)
// Contrato: design/contracts/status.md · Estructura: design/lab/alert/r02/ (B) · Estilo: de coco · DECISIONS.md #315 a #325.
// Una por gestor: raíz popover="manual" siempre abierta (capa superior), dos canales vivos permanentes fuera de la section,
// una sola superficie (`__shape`) que cambia de tamaño entre punto, compacta y abierta, y la hoja móvil (GDialog real).
// Se traslada (mismos nodos) al <dialog> modal superior que no sea su hoja y vuelve al body. NUNCA toma el foco al
// aparecer, actualizarse o abrirse sola. En el servidor no pinta nada: todo empieza al montar.
import { computed, inject, nextTick, onBeforeUnmount, onBeforeUpdate, onMounted, onUpdated, reactive, ref, toRaw, useAttrs, useId, watch } from 'vue'
import { fill } from '../../utils/template.js'
import GBtn from '../GBtn/GBtn.vue'
import GDialog from '../GDialog/GDialog.vue'
import GIcon from '../GIcon/GLibIcon.js'
import StatusList from './StatusList.vue'
import { INTERNAL, countText, formatRemaining, statusKey } from './status.js'
import { ANNOUNCE, MOBILE_SPACES, matchesHotkey } from '../GToast/toaster.js'
import { createTopModal } from '../../utils/topModal.js'
import { createLiveWriter } from '../../utils/liveRegion.js'
import { EDGE_ORDER, clearEdgeReserve, edgeReserve, setEdgeReserve } from '../../utils/edgeReserve.js'

defineOptions({ name: 'GStatusIsland', inheritAttrs: false })

const props = defineProps({
  // Gestor que pinta esta isla; por defecto, el provisto con app.use(status)
  status: { type: Object, default: undefined }
})

const isDev = typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production'
const attrs = useAttrs()
const injected = inject(statusKey, null)
const manager = toRaw(props.status) || injected
const api = manager && manager[INTERNAL] ? manager[INTERNAL] : null
if (!api && isDev) console.warn('[Grana Status] <GStatusIsland> sin prop `status` y sin gestor provisto (app.use(createStatus(…))): no pinta nada.')
const S = api ? api.state : null

const ICON = { info: 'info', success: 'circle-check', warning: 'triangle-alert', error: 'circle-alert' }
const raf = (cb) => (typeof requestAnimationFrame === 'function' ? requestAnimationFrame(cb) : setTimeout(cb, 16))
const caf = (h) => (typeof cancelAnimationFrame === 'function' ? cancelAnimationFrame(h) : clearTimeout(h))

// ---------- Estado de la región ----------
const uid = useId()
const rootId = computed(() => attrs.id || `g-status-island-${uid}`)
const summaryId = computed(() => `${rootId.value}-summary`)
const panelId = computed(() => `${rootId.value}-panel`)
const active = ref(false)
const host = ref(null) // body o el <dialog> modal superior
const rootEl = ref(null)
const shapeEl = ref(null)
const innerEl = ref(null)
const summaryEl = ref(null)
const panelEl = ref(null)
const ready = ref(false)
const nudging = ref(false)
const size = reactive({ w: 0, h: 0 })
const details = reactive(new Set()) // uids con el detalle técnico abierto
const live = reactive({ polite: '', assertive: '' })
const writer = createLiveWriter(live, ANNOUNCE)
const owner = Symbol('GStatusIsland') // dueño en el registro de reservas de borde

const L = computed(() => (S ? S.opts.labels : {}))
const items = computed(() => (api ? api.ordered.value : []))
const count = computed(() => items.value.length)
const first = computed(() => items.value[0] || null)
const form = computed(() => (api ? api.form.value : 'empty'))
const mobile = computed(() => Boolean(S && S.mobile))
const isOpen = computed(() => Boolean(S && S.open))
const position = computed(() => (S ? S.opts.position : 'top-center'))
const align = computed(() => position.value.split('-')[1])
const hotkey = computed(() => (S && S.opts.hotkey !== false ? S.opts.hotkey : ''))
const regionLabel = computed(() => (L.value.region ? fill(L.value.region, { hotkey: hotkey.value }) : undefined))
const typeLabel = (c) => (L.value.types ? L.value.types[c.type] : undefined)
// Prefijo oculto del resumen: «Estado: 3 avisos. Error: »
const summaryPrefix = computed(() => {
  const c = first.value
  if (!c) return ''
  const head = L.value.summary ? `${countText(L.value.summary, count.value)} ` : ''
  return head + (typeLabel(c) ? `${typeLabel(c)}: ` : '')
})
const moreText = computed(() => (L.value.more ? countText(L.value.more, count.value - 1) : ''))
const firstTimer = computed(() => (first.value && first.value.deadline !== undefined ? formatRemaining(first.value.deadline - S.now) : ''))

const toLength = (v) => (typeof v === 'number' ? `${v}px` : v)
// Borde compartido (#322): la isla lee la reserva de quien va antes (la pill de voz) y se coloca debajo
const rootStyle = computed(() => {
  const own = S && S.opts.offset.top !== undefined ? toLength(S.opts.offset.top) : undefined
  const reserve = active.value ? edgeReserve('top', { before: EDGE_ORDER.status }) : 0
  if (reserve > 0) return { '--_status-offset-top': `calc(${own ?? '0px'} + ${reserve}px)` }
  return own !== undefined ? { '--_status-offset-top': own } : {}
})
const rootClasses = computed(() => ['g-status-island', `g-status-island--position-${position.value}`, { 'is-ready': ready.value, 'is-nudge': nudging.value }])
// Tamaño natural de __inner en px: lo lee coco para animar la superficie (datos, no tokens)
const shapeStyle = computed(() => (size.w > 0 && size.h > 0 ? { '--_island-w': `${size.w}px`, '--_island-h': `${size.h}px` } : undefined))

// ---------- Medidas ----------
const spaceUnit = () => {
  const rs = getComputedStyle(document.documentElement)
  const raw = rs.getPropertyValue('--g-space-1').trim()
  let space = parseFloat(raw)
  if (raw.endsWith('rem')) space *= parseFloat(rs.fontSize)
  return Number.isFinite(space) && space > 0 ? space : 0
}
function measureMobile() {
  const space = spaceUnit()
  api.setMobile(space > 0 && window.innerWidth < space * MOBILE_SPACES)
}
function writeSize(w, h) {
  if (!(w > 0 && h > 0)) return
  size.w = Math.ceil(w)
  size.h = Math.ceil(h)
}
// La isla publica el alto de su forma REPLEGADA (el del resumen, nunca el de la abierta) más su margen, mientras no esté vacía
function publishReserve() {
  if (!active.value) return
  const s = summaryEl.value
  const h = count.value && s ? s.offsetHeight : 0
  if (!(h > 0)) { clearEdgeReserve(owner); return }
  setEdgeReserve(owner, 'top', h + spaceUnit() * 2, { order: EDGE_ORDER.status })
}
let ro = null
function measure() {
  // Sin ResizeObserver (jsdom): medida directa tras cada parche
  if (!ro && innerEl.value) writeSize(innerEl.value.offsetWidth, innerEl.value.offsetHeight)
  publishReserve()
}
function onResizeObserved(entries) {
  const e = entries[entries.length - 1]
  const box = e && e.borderBoxSize && e.borderBoxSize[0]
  if (box) writeSize(box.inlineSize, box.blockSize)
  else if (innerEl.value) writeSize(innerEl.value.offsetWidth, innerEl.value.offsetHeight)
  publishReserve()
}
const rectsOverlap = (a, b) => a.width > 0 && a.height > 0 && b.left < a.right && b.right > a.left && b.top < a.bottom && b.bottom > a.top

// ---------- Foco ----------
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
const hostEl = () => host.value || (typeof document !== 'undefined' ? document.body : null)
const inRoot = (el) => Boolean(el && rootEl.value && rootEl.value.contains(el))
const focusInside = () => inRoot(document.activeElement)
const focusEl = (el) => { if (el && typeof el.focus === 'function') el.focus({ preventScroll: true }) }
function usable(el) {
  if (!el || !el.isConnected || el === document.body || typeof el.focus !== 'function' || inRoot(el)) return false
  if (el.closest && (el.closest('[inert]') || el.closest('[hidden]'))) return false
  const h = hostEl()
  return h === document.body || h.contains(el)
}
// Siguiente elemento tabulable del anfitrión tras la isla; si no hay, el anterior. Nunca body.
function neighbour() {
  const h = hostEl()
  const root = rootEl.value
  const all = [...h.querySelectorAll(FOCUSABLE)].filter((el) => usable(el) && (!el.getClientRects || el.getClientRects().length || typeof el.checkVisibility !== 'function'))
  const next = root ? all.find((el) => root.compareDocumentPosition(el) & 4) : null // DOCUMENT_POSITION_FOLLOWING
  return next || all[all.length - 1] || (h !== document.body ? h : null)
}
let saved = null // elemento enfocado antes del atajo o la marca que abrió la isla (vuelta, D5)
let markReturn = null // la marca que abrió la hoja móvil
function leaveFocus() {
  const target = usable(saved) ? saved : neighbour()
  saved = null
  focusEl(target)
}
const uidOfItem = (li) => {
  const m = li && li.id ? /-i-(\d+)$/.exec(li.id) : null
  return m ? Number(m[1]) : null
}
const itemEl = (id) => (rootEl.value ? rootEl.value.querySelector(`#${CSS_ESCAPE(`${rootId.value}-i-${id}`)}`) : null)
const CSS_ESCAPE = (s) => (typeof CSS !== 'undefined' && typeof CSS.escape === 'function' ? CSS.escape(s) : s.replace(/[^\w-]/g, '\\$&'))
const sheetEl = () => (rootEl.value ? rootEl.value.querySelector('.g-status-sheet') : null)
let sheetShown = false // la hoja está (o sigue) en pantalla: de `open` a `closed`

// Guarda de foco: antes de cada parche se anota el control con foco dentro de la isla; después, si sigue ahí se le
// devuelve (un `li` reordenado lo pierde) y, si desapareció, el foco va al resumen (en la hoja: al `li` o al cierre);
// si la isla se vació, al elemento guardado o al siguiente tabulable. Nunca a body.
let memo = null
let movedFor = null // uid de la condición cuyo control con foco desapareció en este ciclo (su cambio no se anuncia)
const guard = {
  before() {
    if (memo || !rootEl.value) return
    const a = document.activeElement
    if (!a || a === document.body || !inRoot(a)) return
    memo = { el: a, uid: uidOfItem(a.closest('.g-status-item')) }
  },
  after() {
    const m = memo
    memo = null
    if (!m || !rootEl.value) return
    const el = m.el
    if (el.isConnected && inRoot(el) && !el.closest('[hidden]')) {
      // Solo si el foco se perdió (un `li` movido de sitio lo suelta); si ya está en otro elemento, alguien lo llevó allí
      const a = document.activeElement
      if (!a || a === document.body) focusEl(el)
      return
    }
    // Hoja móvil cerrándose: el foco se decide al terminar (onSheetClosed)
    if (mobile.value && sheetShown && !isOpen.value) return
    if (!count.value) { leaveFocus(); return }
    movedFor = m.uid
    if (mobile.value && isOpen.value) {
      const li = m.uid !== null ? itemEl(m.uid) : null
      const sheet = sheetEl()
      if (li) { li.setAttribute('tabindex', '-1'); focusEl(li) }
      else focusEl((sheet && sheet.querySelector('.g-dialog__close')) || sheet)
      return
    }
    focusEl(summaryEl.value)
  }
}
onBeforeUpdate(() => guard.before())
onUpdated(() => { guard.after(); measure() })

// ---------- Sucesos del gestor: anuncio, apertura automática y toque ----------
let liveOn = false // lo que existe al montar no anuncia, no abre y no da el toque
let queue = []
let scheduled = false
let lastPress = null // destino del último pointerdown (WebKit no enfoca botones con el ratón)
function actor() {
  const a = document.activeElement
  if (a && a !== document.body && a !== document.documentElement) return inRoot(a) ? null : a
  return lastPress && lastPress.isConnected && !inRoot(lastPress) ? lastPress : null
}
// Rectángulo de la isla ABIERTA, medido antes de pintarla (en el mismo cuadro, sin transición): ¿taparía lo que se usa?
function openRect() {
  const root = rootEl.value
  const shape = shapeEl.value
  const inner = innerEl.value
  const panel = panelEl.value
  if (!root || !shape || !inner || !panel) return null
  const prev = { form: root.getAttribute('data-form'), hidden: panel.hidden, w: shape.style.getPropertyValue('--_island-w'), h: shape.style.getPropertyValue('--_island-h'), transition: shape.style.transition }
  shape.style.transition = 'none'
  root.setAttribute('data-form', 'open')
  panel.hidden = false
  const w = inner.offsetWidth
  const h = inner.offsetHeight
  if (w > 0 && h > 0) {
    shape.style.setProperty('--_island-w', `${w}px`)
    shape.style.setProperty('--_island-h', `${h}px`)
  }
  const rect = shape.getBoundingClientRect()
  root.setAttribute('data-form', prev.form)
  panel.hidden = prev.hidden
  if (prev.w) shape.style.setProperty('--_island-w', prev.w)
  else shape.style.removeProperty('--_island-w')
  if (prev.h) shape.style.setProperty('--_island-h', prev.h)
  else shape.style.removeProperty('--_island-h')
  void shape.offsetWidth // reflujo: la vuelta tampoco transiciona
  shape.style.transition = prev.transition
  return rect
}
function fitsOpen() {
  const a = actor()
  if (!a || typeof a.getBoundingClientRect !== 'function') return true
  const rect = openRect()
  return !rect || !rectsOverlap(rect, a.getBoundingClientRect())
}
let nudgeFrames = []
function nudge() {
  nudging.value = false
  nudgeFrames.forEach(caf)
  nudgeFrames = [raf(() => {
    nudging.value = true
    // Sin animación en curso (movimiento reducido, sin CSS): no hay animationend que la quite
    nudgeFrames = [raf(() => {
      const root = rootEl.value
      if (!root || typeof root.getAnimations !== 'function') return
      let running = false
      try { running = root.getAnimations({ subtree: true }).some((x) => x.animationName === 'g-status-nudge') } catch { running = true }
      if (!running) nudging.value = false
    })]
  })]
}
function onAnimationend(event) {
  if (event.animationName === 'g-status-nudge') nudging.value = false
}
function flushEvents() {
  scheduled = false
  const evs = queue
  queue = []
  // Varios sucesos de la misma condición en un ciclo son uno solo: vale el último texto
  const byUid = new Map()
  for (const ev of evs) {
    const prev = byUid.get(ev.uid)
    byUid.set(ev.uid, prev ? { ...ev, kind: prev.kind === 'change' ? ev.kind : prev.kind, toError: prev.toError || ev.toError, typeChanged: prev.typeChanged || ev.typeChanged, countBefore: prev.countBefore } : ev)
  }
  let wantOpen = false
  let wantNudge = false
  for (const ev of byUid.values()) {
    const rec = api.byUid(ev.uid)
    if (!rec) continue // retirada en el mismo ciclo
    // El cambio que quitó el control con foco: el foco ya está en el resumen (o en el `li` de la hoja) y lee el nombre nuevo
    const focusReads = ev.kind === 'change' && movedFor === ev.uid && (mobile.value || first.value === rec)
    if (!focusReads) writer.announce(ev.text, ev.politeness)
    if (ev.toError) wantOpen = true
    if ((ev.kind === 'appear' && ev.countBefore > 0) || ev.kind === 'announce' || ev.typeChanged) wantNudge = true
  }
  movedFor = null
  if (isOpen.value) return
  if (wantOpen && S.opts.autoOpen && !mobile.value && fitsOpen()) api.setOpen(true)
  else if (wantNudge) nudge()
}
const region = {
  event(ev) {
    if (!liveOn) return
    queue.push(ev)
    if (!scheduled) {
      scheduled = true
      nextTick(flushEvents)
    }
  },
  say(message, politeness) {
    if (liveOn) writer.announce(message, politeness)
  },
  // Abrir en una condición (open(id) o la marca): desplaza hasta ella y, solo con `focus`, enfoca su acción
  opened(id, focus, from) {
    if (from) { saved = from; markReturn = from }
    pending = { uid: id, focus }
    if (!mobile.value || sheetShown) nextTick(applyPending)
  }
}
let pending = null
function applyPending() {
  const p = pending
  pending = null
  if (!p || !isOpen.value) return
  const li = p.uid !== null ? itemEl(p.uid) : null
  if (li && typeof li.scrollIntoView === 'function') li.scrollIntoView({ block: 'nearest' })
  if (!p.focus) return
  if (!li) { if (!mobile.value) focusEl(summaryEl.value); return }
  const target = li.querySelector('.g-status-item__action:not([aria-disabled="true"])') || li.querySelector('.g-status-item__origin') ||
    li.querySelector('.g-status-item__link') || li.querySelector('.g-status-item__dismiss')
  if (target) focusEl(target)
  else { li.setAttribute('tabindex', '-1'); focusEl(li) }
}

// ---------- Acciones de la persona ----------
function toggle() {
  if (isOpen.value) api.setOpen(false)
  else { markReturn = null; api.setOpen(true) }
}
function ack() {
  manager.acknowledge()
}
function resolveOrigin(c) {
  const t = c.origin.target
  let el = null
  try { el = typeof t === 'function' ? t() : typeof t === 'string' ? document.getElementById(t) : t } catch { el = null }
  return el && el.nodeType === 1 && el.isConnected ? el : null
}
function focusOrigin(el) {
  if (!el.isConnected) return
  if (el.tabIndex < 0 && !el.hasAttribute('tabindex')) {
    el.setAttribute('tabindex', '-1')
    el.addEventListener('blur', () => el.removeAttribute('tabindex'), { once: true })
  }
  if (typeof el.scrollIntoView === 'function') el.scrollIntoView({ block: 'nearest' })
  focusEl(el)
}
let pendingOrigin = null
// «Ir a…»: repliega la isla y enfoca el origen
function onOrigin(c) {
  const el = resolveOrigin(c)
  if (!el) {
    api.warn(`el origin.target de «${c.id}» no existe al pulsar «${c.origin.label}»: no se hace nada.`)
    return
  }
  saved = null
  if (mobile.value && sheetShown) {
    pendingOrigin = el // al terminar de cerrarse la hoja (el <dialog> devuelve antes el foco a quien la abrió)
    api.setOpen(false)
    return
  }
  api.setOpen(false)
  focusOrigin(el)
}
// El enlace: evento nativo cancelable para la aplicación (router) y la isla se repliega
function onLink(event, c) {
  if (c.link && typeof c.link.onClick === 'function') {
    try { c.link.onClick(event, api.copy(c)) } catch (e) { console.error(e) }
  }
  api.setOpen(false)
}

// ---------- Hoja móvil (GDialog real) ----------
const sheetOpen = computed({
  get: () => mobile.value && isOpen.value,
  set: (v) => api.setOpen(v)
})
function onSheetOpen() {
  sheetShown = true
  // Antes del foco inicial de GDialog (#292): si la marca pidió su condición, ya hay foco dentro y no se roba
  nextTick(applyPending)
}
let closedByHotkey = false
function onSheetClosed() {
  sheetShown = false
  const origin = pendingOrigin
  pendingOrigin = null
  const byKey = closedByHotkey
  closedByHotkey = false
  if (origin) { markReturn = null; focusOrigin(origin); return }
  if (!count.value) {
    markReturn = null
    const a = document.activeElement
    if (!a || a === document.body || inRoot(a)) leaveFocus()
    return
  }
  const back = byKey && usable(saved) ? saved : usable(markReturn) ? markReturn : summaryEl.value
  if (byKey) saved = null
  markReturn = null
  focusEl(back)
}

// ---------- Traslado al <dialog> modal superior (sin contar la hoja propia) ----------
const topModal = createTopModal({
  ignore: (d) => inRoot(d),
  onChange: (top) => { host.value = top || document.body }
})
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
watch(host, () => { refocus = focusInside() ? document.activeElement : null }, { flush: 'pre' })
watch(host, () => {
  keepMarkers()
  reopen()
  if (refocus && refocus.isConnected) focusEl(refocus)
  refocus = null
  publishReserve()
}, { flush: 'post' })

// ---------- Escuchas ----------
function onDocKeydown(event) {
  if (event.isComposing || !S || S.opts.hotkey === false || !matchesHotkey(event, S.hotkeyKeys)) return
  if (!count.value) return // sin condiciones no se intercepta
  event.preventDefault()
  if (focusInside()) {
    // Vuelta: repliega y devuelve el foco al elemento guardado
    if (mobile.value && sheetShown) { closedByHotkey = true; api.setOpen(false); return }
    const back = saved
    saved = null
    api.setOpen(false)
    focusEl(usable(back) ? back : summaryEl.value)
    return
  }
  const a = document.activeElement
  saved = a && a !== document.body ? a : null
  markReturn = null
  api.setOpen(true)
  if (!mobile.value) focusEl(summaryEl.value) // en móvil, el foco sigue la regla de GDialog (#292)
}
// Esc con el foco dentro de la isla abierta: repliega sin llegar al <dialog> anfitrión y deja el foco en el resumen
function onShapeKeydown(event) {
  if (event.key !== 'Escape' || event.isComposing || !isOpen.value || mobile.value) return
  event.preventDefault()
  event.stopPropagation()
  api.setOpen(false)
  focusEl(summaryEl.value)
}
function onDocPointerdown(event) {
  const t = event.target
  lastPress = t && t.nodeType === 1 ? t : null
  if (!isOpen.value || mobile.value || !lastPress) return
  if (inRoot(t) || (t.closest && t.closest('.g-status-mark--link'))) return
  api.setOpen(false) // pulsar fuera repliega; no mueve el foco
}
const warnedCovered = new WeakSet()
function onDocFocusin(event) {
  const t = event.target
  if (!t || t.nodeType !== 1 || inRoot(t) || !shapeEl.value || !count.value || typeof t.getBoundingClientRect !== 'function') return
  const s = shapeEl.value.getBoundingClientRect()
  const r = t.getBoundingClientRect()
  if (isOpen.value && !mobile.value) {
    // El foco va a un elemento que la isla abierta tapa (WCAG 2.4.11): se repliega
    if (rectsOverlap(s, r)) api.setOpen(false)
  } else if (isDev && !isOpen.value && r.width > 0 && r.height > 0 && r.left >= s.left && r.right <= s.right && r.top >= s.top && r.bottom <= s.bottom && !warnedCovered.has(t)) {
    warnedCovered.add(t)
    console.warn('[Grana Status] la isla replegada tapa por completo el elemento enfocado: cambia `position` u `offset` del gestor (status.md «Límites conocidos»).', t)
  }
}
const onResize = () => { measureMobile(); measure() }

// ---------- Cuenta atrás: un solo intervalo de 1 s, solo con algún plazo y la isla montada ----------
let clock = null
const hasDeadline = computed(() => Boolean(S && S.items.some((r) => r.deadline !== undefined)))
function syncClock() {
  const want = active.value && hasDeadline.value
  if (want && !clock) clock = setInterval(() => api.tick(), 1000)
  else if (!want && clock) { clearInterval(clock); clock = null }
}
watch(hasDeadline, syncClock)

// ---------- Reacciones ----------
watch([count, form, mobile], () => { if (active.value) nextTick(measure) }, { flush: 'post' })
watch(mobile, (m) => {
  if (m && isDev && active.value) {
    if (!L.value.sheetTitle) api.warn('falta labels.sheetTitle: la hoja móvil de la isla queda sin título.')
    if (!L.value.close) api.warn('falta labels.close: la hoja móvil de la isla queda sin botón de cierre.')
  }
})
// Detalles abiertos de condiciones que ya no están
watch(count, () => {
  if (!api || !details.size) return
  const alive = new Set(S.items.map((r) => r.uid))
  for (const k of [...details]) if (!alive.has(k)) details.delete(k)
})

// ---------- Montaje ----------
const frames = new Set()
onMounted(async () => {
  if (!api) return
  const twice = () => { if (isDev) console.warn('[Grana Status] dos <GStatusIsland> para el mismo gestor: la segunda no pinta nada.') }
  if (S.attached) { twice(); return }
  if (isDev) {
    if (!L.value.region) api.warn('falta labels.region: la isla queda sin nombre de región.')
    if (!L.value.summary) api.warn('falta labels.summary: el resumen de la isla va sin prefijo de cuenta.')
    if (!L.value.acknowledge) api.warn('falta labels.acknowledge: el botón «Entendido» no se dibuja (sin texto no tiene nombre) y no hay forma de punto.')
  }
  topModal.scan()
  if (!api.attach(region, rootId.value)) { twice(); return }
  topModal.sync()
  active.value = true
  topModal.observe()
  await nextTick()
  if (!active.value) return
  reopen()
  measureMobile()
  if (typeof ResizeObserver !== 'undefined' && innerEl.value) {
    ro = new ResizeObserver(onResizeObserved)
    ro.observe(innerEl.value)
    if (summaryEl.value) ro.observe(summaryEl.value)
  }
  measure()
  syncClock()
  document.addEventListener('keydown', onDocKeydown)
  document.addEventListener('pointerdown', onDocPointerdown, true)
  document.addEventListener('focusin', onDocFocusin)
  window.addEventListener('resize', onResize)
  // Las condiciones declaradas en este mismo ciclo de montaje (<GStatus> hermanos, onMounted de la aplicación) ya existían
  liveOn = true
  // Nada se anima al montar: is-ready dos cuadros después de la primera escritura de tamaño
  const h1 = raf(() => {
    frames.delete(h1)
    const h2 = raf(() => { frames.delete(h2); ready.value = true })
    frames.add(h2)
  })
  frames.add(h1)
})
// El resumen aparece y desaparece con las condiciones: el observador lo sigue (su alto es la reserva de borde)
watch(summaryEl, (el, old) => {
  if (!ro) return
  if (old) ro.unobserve(old)
  if (el) ro.observe(el)
}, { flush: 'post' })
onBeforeUnmount(() => {
  if (!api || !active.value) return
  active.value = false
  liveOn = false
  api.detach(region)
  api.setOpen(false)
  document.removeEventListener('keydown', onDocKeydown)
  document.removeEventListener('pointerdown', onDocPointerdown, true)
  document.removeEventListener('focusin', onDocFocusin)
  window.removeEventListener('resize', onResize)
  topModal.disconnect()
  writer.dispose()
  if (ro) ro.disconnect()
  ro = null
  if (clock) clearInterval(clock)
  clock = null
  clearEdgeReserve(owner)
  frames.forEach((h) => caf(h))
  nudgeFrames.forEach(caf)
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
      :data-align="align"
      :data-form="form"
      :data-type="first ? first.type : undefined"
      :data-mobile="mobile ? '' : undefined"
      @animationend="onAnimationend"
    >
      <div class="g-status-island__live" role="status" aria-live="polite" aria-atomic="true">{{ live.polite }}</div>
      <div class="g-status-island__live" role="alert" aria-atomic="true">{{ live.assertive }}</div>
      <section ref="shapeEl" class="g-status-island__shape" :hidden="count ? undefined : true" :aria-label="regionLabel" :style="shapeStyle" @keydown="onShapeKeydown">
        <div ref="innerEl" class="g-status-island__inner">
          <button
            v-if="first"
            :id="summaryId"
            ref="summaryEl"
            class="g-status-island__summary"
            type="button"
            :aria-expanded="isOpen ? 'true' : 'false'"
            :aria-controls="mobile ? undefined : panelId"
            :aria-haspopup="mobile ? 'dialog' : undefined"
            :aria-keyshortcuts="hotkey || undefined"
            @click="toggle"
          >
            <span class="g-status-island__badge" :class="{ 'is-busy': first.busy }" :data-type="first.type" aria-hidden="true"><GIcon :name="first.busy ? 'loader-circle' : ICON[first.type]" /></span>
            <span class="g-status-island__text"><span v-if="summaryPrefix" class="g-status-island__sr">{{ summaryPrefix }}</span>{{ first.title }}</span>
            <span v-if="firstTimer" class="g-status-island__timer" role="timer" aria-live="off">{{ firstTimer }}</span>
            <span v-if="count > 1" class="g-status-island__more"><span aria-hidden="true">+{{ count - 1 }}</span><span v-if="moreText" class="g-status-island__sr">{{ moreText }}</span></span>
          </button>
          <div v-if="!mobile" :id="panelId" ref="panelEl" class="g-status-island__panel" :hidden="isOpen ? undefined : true">
            <StatusList :api="api" :root-id="rootId" :details="details" :guard="guard" @origin="onOrigin" @link="onLink" />
            <div v-if="L.acknowledge" class="g-status-island__foot">
              <GBtn class="g-status-island__ack" size="sm" variant="outline" color="neutral" @click="ack">{{ L.acknowledge }}</GBtn>
            </div>
          </div>
        </div>
      </section>
      <GDialog v-if="mobile" v-model="sheetOpen" class="g-status-sheet" mobile="sheet" :title="L.sheetTitle" :close-label="L.close" @open="onSheetOpen" @closed="onSheetClosed">
        <StatusList :api="api" :root-id="rootId" :details="details" :guard="guard" @origin="onOrigin" @link="onLink" />
        <template v-if="L.acknowledge" #footer>
          <GBtn class="g-status-island__ack" size="sm" variant="outline" color="neutral" @click="ack">{{ L.acknowledge }}</GBtn>
        </template>
      </GDialog>
    </div>
  </Teleport>
</template>
