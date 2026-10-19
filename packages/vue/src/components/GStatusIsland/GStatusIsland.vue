<script setup>
// GStatusIsland · la isla de estado de un gestor (dueño: bruno)
// Contrato: design/contracts/status.md · Estructura: design/lab/alert/r04/ (D1 · Cápsula de relevo) · Estilo: de coco ·
// DECISIONS.md #315 a #328 y #693 a #705.
// Una por gestor: raíz popover="manual" siempre abierta (capa superior), dos canales vivos permanentes fuera de la section y
// una sola superficie (`__shape`) que cuenta la vida del aviso: cae sin texto (drop), se ensancha con su titular (grow), se
// lee (el gestor mide el tiempo), se releva, asoma (is-peek), abre la lista y se recoge (fold → rise). Cada etapa avanza al
// terminar sus transiciones en `__shape`; toda transición parte del estado actual (#702): esta región nunca reinicia un
// movimiento ni pone `transition` en línea (F1). El tamaño de destino se mide con el contenido montado antes de usarse (F2).
// NUNCA toma el foco al aparecer, relevarse o cambiar. En el servidor no pinta nada: todo empieza al montar.
import { computed, inject, nextTick, onBeforeUnmount, onBeforeUpdate, onMounted, onUpdated, reactive, ref, shallowRef, toRaw, useAttrs, useId, watch } from 'vue'
import { fill } from '../../utils/template.js'
import GBtn from '../GBtn/GBtn.vue'
import GDialog from '../GDialog/GDialog.vue'
import GIcon from '../GIcon/GLibIcon.js'
import StatusList from './StatusList.vue'
import { INTERNAL, STATUS_ICONS as ICON, countText, formatRemaining, statusKey } from './status.js'
import { ANNOUNCE, MOBILE_SPACES, matchesHotkey } from '../GToast/toaster.js'
import { createTopModal } from '../../utils/topModal.js'
import { spaceUnit as unitOf } from '../GForm/formContext.js'
import { transitionMs } from '../../utils/motion.js'
import { createLiveWriter } from '../../utils/liveRegion.js'
import { EDGE_ORDER, clearEdgeReserve, edgeReserve, setEdgeReserve } from '../../utils/edgeReserve.js'

defineOptions({ name: 'GStatusIsland', inheritAttrs: false })

// `status`: gestor que pinta esta isla; por defecto, el provisto con app.use(status)
const props = defineProps({
  status: { type: Object, default: undefined }
})

const attrs = useAttrs()
const injected = inject(statusKey, null)
const manager = toRaw(props.status) || injected
const api = manager && manager[INTERNAL] ? manager[INTERNAL] : null
try { if (process.env.NODE_ENV !== 'production' && !api) console.warn('[Grana Status] <GStatusIsland> sin prop `status` y sin gestor provisto (app.use(createStatus(…))): no pinta nada.') } catch {}
const S = api ? api.state : null

const raf = (cb) => (typeof requestAnimationFrame === 'function' ? requestAnimationFrame(cb) : setTimeout(cb, 16))
const caf = (h) => (typeof cancelAnimationFrame === 'function' ? cancelAnimationFrame(h) : clearTimeout(h))

// ---------- Estado de la región ----------
const uid = useId()
const rootId = computed(() => attrs.id || `g-status-island-${uid}`)
const summaryId = computed(() => `${rootId.value}-summary`)
const panelId = computed(() => `${rootId.value}-panel`)
const descId = computed(() => `${rootId.value}-desc`)
const active = ref(false)
const host = ref(null) // body o el <dialog> modal superior
const rootEl = ref(null)
const shapeEl = ref(null)
const innerEl = ref(null)
const summaryEl = ref(null)
const ready = ref(false)
const stage = ref(null) // 'drop' | 'grow' | 'fold' | 'rise' | null (en reposo)
const shown = shallowRef(null) // la condición del titular; se conserva hasta el fin de `rise` aunque el modelo la retire (I4)
const textKey = ref(0) // cada relevo es un `__text` nuevo (el texto entra desde abajo)
const outgoing = ref(null) // la copia que sale en el relevo ({ key, title }, aria-hidden; se va por arriba)
let outTimer = 0
// Relevo en reposo: el texto anterior sale como copia oculta a la lectura y entra el nuevo (coco: el rodillo)
function roll(prev) {
  if (prev && stage.value === null) {
    outgoing.value = { key: textKey.value, title: prev }
    clearTimeout(outTimer)
    outTimer = setTimeout(() => { outgoing.value = null }, 1000)
  }
  textKey.value++
}
const size = reactive({ w: 0, h: 0 })
const details = reactive(new Set()) // uids con el detalle técnico abierto
const live = reactive({ polite: '', assertive: '' })
const writer = createLiveWriter(live, ANNOUNCE)
const owner = Symbol('GStatusIsland') // dueño en el registro de reservas de borde

const L = computed(() => (S ? S.opts.labels : {}))
const items = computed(() => (api ? api.ordered.value : []))
const count = computed(() => items.value.length)
const form = computed(() => (api ? api.form.value : 'empty'))
const mobile = computed(() => Boolean(S && S.mobile))
const isList = computed(() => form.value === 'list')
const position = computed(() => (S ? S.opts.position : 'top-center'))
const align = computed(() => position.value.split('-')[1])
const hotkey = computed(() => (S && S.opts.hotkey !== false ? S.opts.hotkey : ''))
const regionLabel = computed(() => (L.value.region ? fill(L.value.region, { hotkey: hotkey.value }) : undefined))
const typeLabel = (c) => (L.value.types ? L.value.types[c.type] : undefined)
// El titular: la condición mostrada; en la lista, la que lo era o la primera de la lista
const head = computed(() => (isList.value ? shown.value || items.value[0] || null : form.value === 'empty' ? null : shown.value))
const waiting = computed(() => (api && S.current && !isList.value ? api.queue.value.length : 0))
const waitingText = computed(() => (L.value.waiting ? countText(L.value.waiting, waiting.value) : ''))
const peekOpen = computed(() => Boolean(S && S.peek) && form.value === 'line' && Boolean(shown.value))
// Cerrar el asomo: primero sale is-peek (el contenido se funde) y `hidden` llega tras su transición (Firefox no
// transiciona `display`). La lista que se recoge conserva su panel hasta el fin de `rise` (I4).
const peekEl = ref(null)
const peekLinger = ref(false)
const fromList = ref(false)
const panelOpen = computed(() => isList.value || fromList.value)
let peekTimer = 0
watch(peekOpen, (on) => {
  clearTimeout(peekTimer)
  peekLinger.value = !on
  if (!on) nextTick(() => { const ms = transitionMs(peekEl.value); if (ms) peekTimer = setTimeout(() => { peekLinger.value = false }, ms); else peekLinger.value = false })
})
const paused = computed(() => Boolean(api && api.paused.value))
const timer = computed(() => (head.value && head.value.deadline !== undefined ? formatRemaining(head.value.deadline - S.now) : ''))
const ring = computed(() => (S && S.reading && !timer.value && !isList.value ? S.ring : null))

const toLength = (v) => (typeof v === 'number' ? `${v}px` : v)
// Borde compartido (#322, #699): la isla lee la reserva de quien va antes (voz, zócalo, FAB) y se coloca debajo
const rootStyle = computed(() => {
  const own = S && S.opts.offset.top !== undefined ? toLength(S.opts.offset.top) : undefined
  const reserve = active.value ? edgeReserve('top', { before: EDGE_ORDER.status }) : 0
  if (reserve > 0) return { '--_status-offset-top': `calc(${own ?? '0px'} + ${reserve}px)` }
  return own !== undefined ? { '--_status-offset-top': own } : {}
})
const rootClasses = computed(() => ['g-status-island', `g-status-island--position-${position.value}`, { 'is-ready': ready.value, 'is-peek': peekOpen.value, 'is-paused': paused.value && form.value !== 'empty' }])
// Datos del `.vue` para coco (§29.5): tamaño de destino medido y tramo del anillo (números; sin escrituras por cuadro)
const shapeStyle = computed(() => {
  const s = {}
  if (size.w > 0 && size.h > 0) { s['--_island-w'] = `${size.w}px`; s['--_island-h'] = `${size.h}px` }
  if (ring.value) { s['--_left'] = String(Math.round(ring.value.left * 1000) / 1000); s['--_run-ms'] = String(Math.round(ring.value.run)) }
  return s
})

// ---------- Medidas ----------
const spaceUnit = () => unitOf(document.documentElement)
const measureMobile = () => api.setMobile(window.innerWidth < spaceUnit() * MOBILE_SPACES)
// Tamaño natural de __inner (no depende del tamaño animado de la forma): el destino de grow, del asomo y de la lista.
// En `empty` se borra (F2: la siguiente vez no nace con el tamaño de la anterior).
function measure() {
  if (form.value === 'empty') { size.w = 0; size.h = 0 } else {
    const el = innerEl.value
    const w = el ? el.offsetWidth : 0
    const h = el ? el.offsetHeight : 0
    if (w > 0 && h > 0) { size.w = Math.ceil(w); size.h = Math.ceil(h) }
  }
  publishReserve()
}
// La isla publica el alto del TITULAR (nunca el del asomo ni el de la lista) más su margen, solo mientras se ve (#699)
function publishReserve() {
  if (!active.value) return
  const s = summaryEl.value
  const h = form.value !== 'empty' && s ? s.offsetHeight : 0
  if (!(h > 0)) { clearEdgeReserve(owner); return }
  setEdgeReserve(owner, 'top', h + spaceUnit() * 2, { order: EDGE_ORDER.status })
}
let ro = null
const rectsOverlap = (a, b) => a.width > 0 && a.height > 0 && b.left < a.right && b.right > a.left && b.top < a.bottom && b.bottom > a.top

// ---------- Etapas (status.md «Formas» e «Interrupciones») ----------
let cycle = new Set() // uids mostrados desde la última caída (los que reciben el eco)
let stageFrame = 0
let stageTimer = 0
// Transiciones o animaciones finitas de la propia forma en curso (sin las de sus hijos: anillo, giro)
function moving() {
  const el = shapeEl.value
  if (!el || typeof el.getAnimations !== 'function') return false
  try {
    return el.getAnimations().some((a) => {
      const t = a.effect && typeof a.effect.getTiming === 'function' ? a.effect.getTiming() : null
      return a.playState === 'running' && (!t || t.iterations !== Infinity)
    })
  } catch { return false }
}
// Comprueba en el cuadro siguiente (sin transición en curso: movimiento reducido, sin CSS) y, de respaldo, más tarde
function checkStage() {
  caf(stageFrame)
  clearTimeout(stageTimer)
  if (!stage.value) return
  const s = stage.value
  stageFrame = raf(() => {
    stageFrame = 0
    if (stage.value !== s) return
    if (!moving()) { advance(); return }
    stageTimer = setTimeout(checkStage, 600)
  })
}
function onShapeTransition(event) {
  if (event.target === shapeEl.value && stage.value) checkStage()
}
function advance() {
  const s = stage.value
  if (s === 'drop') stage.value = 'grow'
  else if (s === 'grow') { stage.value = null; if (S.current) api.shown(S.current) }
  else if (s === 'fold') { stage.value = 'rise'; echo() }
  else if (s === 'rise') { stage.value = null; api.collapsed() }
}
watch(stage, () => { if (stage.value) nextTick(checkStage) }, { flush: 'post' })
// El gestor manda: cada cambio de titular, de recogida o de lista se traduce en una etapa que parte de la actual
watch(() => (S ? [S.current, S.leaving, S.list] : []), (now, before) => {
  if (!api) return
  const [cur, leaving, list] = now
  const [pc, pl, plist] = before || []
  if (list) {
    stage.value = null
    if (cur) shown.value = api.byUid(cur) || shown.value
    return
  }
  if (cur) {
    const r = api.byUid(cur)
    const s = stage.value
    const prev = shown.value
    shown.value = r
    cycle.add(cur)
    if (!pc && !pl && !plist && s !== 'fold' && s !== 'rise') { cycle = new Set([cur]); stage.value = 'drop'; return } // nace
    if (s === 'fold') { stage.value = 'grow'; textKey.value++; return } // se cancela la recogida: se ensancha desde donde está
    if (s === 'rise') { stage.value = 'drop'; return } // baja otra vez desde donde está
    if (s === null && prev !== r) { roll(prev && prev.title); nextTick(() => api.shown(cur)) } // relevo: el texto nuevo ya se ve
    else if (s === 'grow') textKey.value++
    return
  }
  if (leaving) {
    if (plist) fromList.value = true
    shown.value = api.byUid(leaving) || shown.value
    if (!shown.value) { nextTick(() => api.collapsed()); return } // nada que recoger con su texto
    if (stage.value !== 'fold' && stage.value !== 'rise') stage.value = 'fold'
    return
  }
  stage.value = null
  shown.value = null
  fromList.value = false
  cycle = new Set()
})
// Un cambio de texto de la mostrada entra con el mismo relevo (en el sitio, D4)
watch(() => (shown.value ? `${shown.value.type}\u0000${shown.value.title}\u0000${shown.value.description || ''}` : ''), (v, o) => {
  if (v && o && stage.value !== 'drop') roll(o.split('\u0000')[1])
})
watch([form, stage, shown, textKey, peekOpen, mobile], () => { if (active.value) measure() }, { flush: 'post' })

// ---------- Eco en la marca (#700): solo si la marca se ve; una vez por recogida ----------
function markVisible(el) {
  if (!el || !el.isConnected || (el.closest && el.closest('[inert],[hidden]'))) return false
  const h = host.value
  if (h && h !== document.body && !h.contains(el)) return false // bajo un modal
  const r = el.getBoundingClientRect()
  return r.width > 0 && r.height > 0 && r.bottom > 0 && r.right > 0 && r.top < window.innerHeight && r.left < window.innerWidth
}
function echo() {
  for (const u of cycle) {
    const r = api.byUid(u)
    if (!r) continue
    for (const m of api.marksOf(r.id)) if (markVisible(m.el())) m.echo()
  }
}

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
let saved = null // elemento enfocado antes del atajo o la marca que abrió la lista (vuelta, D5)
let markReturn = null // la marca que abrió la hoja móvil
// Al recogerse con el foco dentro: al guardado, a la marca de lo mostrado o al siguiente tabulable. Nunca a body.
function leaveFocus() {
  let target = usable(saved) ? saved : null
  saved = null
  if (!target && shown.value) target = api.marksOf(shown.value.id).map((m) => m.el()).find(usable) || null
  focusEl(target || neighbour())
}
// Recoge por un gesto de la persona; si el foco estaba dentro, sale según «Foco»
function collapseByPerson() {
  const inside = focusInside()
  manager.hide()
  if (inside) leaveFocus()
}
const uidOfItem = (li) => {
  const m = li && li.id ? /-i-(\d+)$/.exec(li.id) : null
  return m ? Number(m[1]) : null
}
const itemEl = (id) => document.getElementById(`${rootId.value}-i-${id}`)
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
    memo = { el: a, uid: uidOfItem(a.closest('.g-status-item')) ?? (a.closest('.g-status-island__peek') && shown.value ? shown.value.uid : null) }
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
    if (mobile.value && sheetShown && !isList.value) return
    if (!count.value || form.value === 'empty' || stage.value === 'fold' || stage.value === 'rise') { leaveFocus(); return }
    movedFor = m.uid
    if (mobile.value && isList.value) {
      const li = m.uid !== null ? itemEl(m.uid) : null
      const sheet = sheetEl()
      if (li) { li.setAttribute('tabindex', '-1'); focusEl(li) } else focusEl((sheet && sheet.querySelector('.g-dialog__close')) || sheet)
      return
    }
    focusEl(summaryEl.value)
  }
}
onBeforeUpdate(() => guard.before())
onUpdated(() => guard.after())

// ---------- Anuncios: uno por suceso, tras pintar ----------
let liveOn = false // lo que existe al montar no se anuncia (pero se muestra, #698)
let queue = []
let scheduled = false
function flushEvents() {
  scheduled = false
  const evs = queue
  queue = []
  // Varios sucesos de la misma condición en un ciclo son uno solo: vale el último texto
  const byUid = new Map()
  for (const ev of evs) byUid.set(ev.uid, { ...ev, kind: byUid.has(ev.uid) && byUid.get(ev.uid).kind !== 'change' ? byUid.get(ev.uid).kind : ev.kind })
  for (const ev of byUid.values()) {
    const rec = api.byUid(ev.uid)
    if (!rec) continue // retirada en el mismo ciclo
    // El cambio que quitó el control con foco: el foco ya está en el resumen (o en el `li` de la hoja) y lee el nombre nuevo
    const focusReads = ev.kind === 'change' && movedFor === ev.uid && (mobile.value || shown.value === rec)
    if (!focusReads) writer.announce(ev.text, ev.politeness)
  }
  movedFor = null
}
let lastPress = null // destino del último pointerdown
// Faltan textos de la lista la primera vez que se abre
function warnList() {
  try {
    if (process.env.NODE_ENV !== 'production') {
      if (!L.value.listTitle) api.warn('falta labels.listTitle: el resumen conserva el titular.')
      if (!L.value.close) api.warn('falta labels.close: «Cerrar» no se dibuja.')
    }
  } catch {}
}
// opened: abrir en una condición (open(id) o la marca) desplaza hasta ella y, solo con `focus`, enfoca su acción
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
  opened(id, focus, from) {
    if (from) { saved = from; markReturn = from }
    pending = { uid: id, focus }
    warnList()
    if (!mobile.value || sheetShown) nextTick(applyPending)
  }
}
let pending = null
function applyPending() {
  const p = pending
  pending = null
  if (!p || !isList.value) return
  const li = p.uid !== null ? itemEl(p.uid) : null
  if (li && typeof li.scrollIntoView === 'function') li.scrollIntoView({ block: 'nearest' })
  if (!p.focus) return
  if (!li) { if (!mobile.value) focusEl(summaryEl.value); return }
  const target = li.querySelector('.g-status-item__action:not([aria-disabled="true"])') || li.querySelector('.g-status-item__origin') ||
    li.querySelector('.g-status-item__link') || li.querySelector('.g-status-item__dismiss')
  if (target) focusEl(target)
  else { li.setAttribute('tabindex', '-1'); focusEl(li) }
}

// ---------- Gestos de la persona ----------
const hoverMedia = () => typeof matchMedia === 'function' && matchMedia('(hover: hover)').matches
const byHover = (e) => e.pointerType === 'mouse' || (e.pointerType === 'pen' && hoverMedia())
const byTouch = (e) => e.pointerType === 'touch' || (e.pointerType === 'pen' && !hoverMedia())
let touchDown = false // el último pointerdown en el resumen fue un toque (su click abre el asomo, no la lista)
function onSummaryPointerdown(e) { touchDown = byTouch(e) }
function onSummaryClick() {
  const touch = touchDown
  touchDown = false
  if (touch && form.value === 'line' && S.peek !== 'touch') { api.setPeek('touch'); return } // primer toque: asomo (#703)
  if (isList.value) { collapseByPerson(); return }
  markReturn = null
  api.openList()
  warnList()
}
function onPointerenter(e) {
  if (!byHover(e)) return
  api.hold('pointer', true)
  if (!S.peek) api.setPeek('pointer')
}
function onPointerleave(e) {
  if (!byHover(e)) return
  api.hold('pointer', false)
  if (S.peek === 'pointer') api.setPeek(focusInside() ? 'focus' : '')
}
function onShapePointerdown(e) {
  if (byTouch(e)) api.hold('touch', true)
}
function onDocPointerup(e) {
  if (byTouch(e) && S && S.hold.touch) api.hold('touch', false)
}
function onFocusin() {
  api.hold('focus', true)
  if (!S.peek) api.setPeek('focus')
}
function onFocusout(e) {
  if (inRoot(e.relatedTarget)) return
  api.hold('focus', false)
  if (S.peek === 'focus') api.setPeek('')
}
// «Ocultar»: si esperan otras, relevo (el foco sigue en «Ocultar»); si no, se recoge y el foco sale según «Foco»
function onHide() {
  const inside = focusInside()
  api.hideShown()
  if (inside && !S.current) leaveFocus()
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
// «Ir a…»: recoge la isla y enfoca el origen
function onOrigin(c) {
  const el = resolveOrigin(c)
  if (!el) {
    try { if (process.env.NODE_ENV !== 'production') api.warn(`el origin.target de «${c.id}» no existe al pulsar «${c.origin.label}»: no se hace nada.`) } catch {}
    return
  }
  saved = null
  if (mobile.value && sheetShown) {
    pendingOrigin = el // al terminar de cerrarse la hoja (el <dialog> devuelve antes el foco a quien la abrió)
    manager.hide()
    return
  }
  manager.hide()
  focusOrigin(el)
}
// El enlace: evento nativo cancelable para la aplicación (router) y la isla se recoge
function onLink(event, c) {
  if (c.link && typeof c.link.onClick === 'function') {
    try { c.link.onClick(event, api.copy(c)) } catch (e) { console.error(e) }
  }
  collapseByPerson()
}

// ---------- Hoja móvil (GDialog real) ----------
const sheetOpen = computed({
  get: () => mobile.value && isList.value,
  set: (v) => { if (!v && isList.value) manager.hide() }
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
  const back = byKey && usable(saved) ? saved : usable(markReturn) ? markReturn : null
  saved = null
  markReturn = null
  const a = document.activeElement
  if (back) focusEl(back)
  else if (!a || a === document.body || inRoot(a)) leaveFocus()
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

// ---------- Escuchas de documento ----------
function onDocKeydown(event) {
  if (event.isComposing || !S || S.opts.hotkey === false || !matchesHotkey(event, S.hotkeyKeys)) return
  if (!count.value) return // sin condiciones no se intercepta
  event.preventDefault()
  if (focusInside()) {
    // Vuelta: cierra la lista, recoge y devuelve el foco al elemento guardado
    if (mobile.value && sheetShown) { closedByHotkey = true; manager.hide(); return }
    collapseByPerson()
    return
  }
  const a = document.activeElement
  saved = a && a !== document.body ? a : null
  markReturn = null
  manager.open()
  if (!mobile.value) nextTick(() => focusEl(summaryEl.value)) // en móvil, el foco sigue la regla de GDialog (#292)
}
// Esc con el foco dentro de la isla: recoge sin llegar al <dialog> anfitrión
function onShapeKeydown(event) {
  if (event.key !== 'Escape' || event.isComposing || form.value === 'empty' || (mobile.value && isList.value)) return
  event.preventDefault()
  event.stopPropagation()
  collapseByPerson()
}
// Esc con el asomo abierto por el puntero y el foco fuera (1.4.13 «descartable», #703): sin detener la propagación
function onPeekEscape(event) {
  if (event.key !== 'Escape' || event.isComposing || S.peek !== 'pointer' || focusInside()) return
  event.preventDefault()
  manager.hide()
}
watch(() => Boolean(S && S.peek === 'pointer'), (on) => {
  if (!active.value) return
  if (on) document.addEventListener('keydown', onPeekEscape, true)
  else document.removeEventListener('keydown', onPeekEscape, true)
})
function onDocPointerdown(event) {
  const t = event.target
  lastPress = t && t.nodeType === 1 ? t : null
  if (!lastPress || inRoot(t) || (t.closest && t.closest('.g-status-mark--link'))) return
  if (isList.value && !mobile.value) manager.hide() // pulsar fuera cierra la lista y recoge; no mueve el foco
  else if (S.peek === 'touch') api.setPeek('') // tocar fuera cierra el asomo táctil; la lectura sigue
}
// El foco va a algo que la isla tapa (2.4.11): se recoge al momento sin mover el foco
function onDocFocusin(event) {
  const t = event.target
  if (!t || t.nodeType !== 1 || inRoot(t) || form.value === 'empty' || !shapeEl.value || typeof t.getBoundingClientRect !== 'function') return
  if (mobile.value && isList.value) return
  if (rectsOverlap(shapeEl.value.getBoundingClientRect(), t.getBoundingClientRect())) manager.hide()
}
const onResize = () => { measureMobile(); measure() }
const onVisibility = () => api.hold('hidden', document.visibilityState === 'hidden')

// ---------- Cuenta atrás: un solo intervalo de 1 s, solo con algún plazo y la isla montada ----------
let clock = null
const hasDeadline = computed(() => Boolean(S && S.items.some((r) => r.deadline !== undefined)))
function syncClock() {
  const want = active.value && hasDeadline.value
  if (want && !clock) clock = setInterval(() => api.tick(), 1000)
  else if (!want && clock) { clearInterval(clock); clock = null }
}
watch(hasDeadline, syncClock)

// ---------- Vive con su origen (#697): un MutationObserver solo mientras alguna condición tenga `origin` ----------
const met = new WeakMap() // registro → el `origin` cuyo destino llegó a existir
let mo = null
let moFrame = 0
const withOrigin = computed(() => Boolean(S && S.items.some((r) => r.origin)))
function checkOrigins() {
  moFrame = 0
  for (const r of S.items.slice()) {
    if (!r.origin) continue
    const raw = toRaw(r)
    const el = resolveOrigin(r)
    if (el) met.set(raw, r.origin)
    else if (met.get(raw) === r.origin) api.removeAs(r.id, 'origin')
  }
}
const scheduleOrigins = () => { if (!moFrame) moFrame = raf(checkOrigins) }
function syncOrigins() {
  const want = active.value && withOrigin.value
  if (want && !mo && typeof MutationObserver !== 'undefined') {
    mo = new MutationObserver(scheduleOrigins)
    mo.observe(document.documentElement, { childList: true, subtree: true })
  } else if (!want && mo) { mo.disconnect(); mo = null }
  if (want) scheduleOrigins()
}
watch(withOrigin, syncOrigins)
watch(() => (S ? S.items.length : 0), () => { if (mo) scheduleOrigins() })

// ---------- Avisos de textos que faltan (la primera vez que se necesitan) ----------
watch([waiting, mobile], ([n, m]) => {
  try {
    if (process.env.NODE_ENV !== 'production' && active.value) {
      if (n > 0 && !L.value.waiting) api.warn('falta labels.waiting: «+N» queda sin texto para lectores de pantalla.')
      if (m && !L.value.sheetTitle) api.warn('falta labels.sheetTitle: la hoja móvil de la isla queda sin título.')
    }
  } catch {}
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
  const twice = () => { try { if (process.env.NODE_ENV !== 'production') console.warn('[Grana Status] dos <GStatusIsland> para el mismo gestor: la segunda no pinta nada.') } catch {} }
  if (S.attached) { twice(); return }
  try { if (process.env.NODE_ENV !== 'production' && !L.value.region) api.warn('falta labels.region: la isla queda sin nombre de región.') } catch {}
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
    ro = new ResizeObserver(() => measure())
    ro.observe(innerEl.value)
  }
  measure()
  syncClock()
  syncOrigins()
  onVisibility()
  document.addEventListener('keydown', onDocKeydown)
  document.addEventListener('pointerdown', onDocPointerdown, true)
  document.addEventListener('pointerup', onDocPointerup, true)
  document.addEventListener('pointercancel', onDocPointerup, true)
  document.addEventListener('focusin', onDocFocusin)
  document.addEventListener('visibilitychange', onVisibility)
  window.addEventListener('resize', onResize)
  // Las condiciones declaradas en este mismo ciclo de montaje (<GStatus> hermanos, onMounted de la aplicación) ya existían
  liveOn = true
  // Nada se anima al montar: is-ready dos cuadros después; lo presente al cargar entra entonces, con su caída
  const h1 = raf(() => {
    frames.delete(h1)
    const h2 = raf(() => { frames.delete(h2); ready.value = true; api.ready() })
    frames.add(h2)
  })
  frames.add(h1)
})
onBeforeUnmount(() => {
  if (!api || !active.value) return
  active.value = false
  liveOn = false
  api.detach(region)
  document.removeEventListener('keydown', onDocKeydown)
  document.removeEventListener('keydown', onPeekEscape, true)
  document.removeEventListener('pointerdown', onDocPointerdown, true)
  document.removeEventListener('pointerup', onDocPointerup, true)
  document.removeEventListener('pointercancel', onDocPointerup, true)
  document.removeEventListener('focusin', onDocFocusin)
  document.removeEventListener('visibilitychange', onVisibility)
  window.removeEventListener('resize', onResize)
  topModal.disconnect()
  writer.dispose()
  if (ro) ro.disconnect()
  ro = null
  if (mo) mo.disconnect()
  mo = null
  if (clock) clearInterval(clock)
  clock = null
  clearEdgeReserve(owner)
  frames.forEach((h) => caf(h))
  caf(stageFrame)
  caf(moFrame)
  clearTimeout(stageTimer)
  clearTimeout(outTimer)
  clearTimeout(peekTimer)
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
      :data-stage="stage || undefined"
      :data-type="head ? head.type : undefined"
      :data-mobile="mobile ? '' : undefined"
    >
      <div class="g-status-island__live" role="status" aria-live="polite" aria-atomic="true">{{ live.polite }}</div>
      <div class="g-status-island__live" role="alert" aria-atomic="true">{{ live.assertive }}</div>
      <section
        ref="shapeEl"
        class="g-status-island__shape"
        :hidden="form === 'empty' ? true : undefined"
        :aria-label="regionLabel"
        :style="shapeStyle"
        @keydown="onShapeKeydown"
        @pointerenter="onPointerenter"
        @pointerleave="onPointerleave"
        @pointerdown="onShapePointerdown"
        @focusin="onFocusin"
        @focusout="onFocusout"
        @transitionend="onShapeTransition"
        @transitioncancel="onShapeTransition"
      >
        <div ref="innerEl" class="g-status-island__inner">
          <button
            v-if="head"
            :id="summaryId"
            ref="summaryEl"
            class="g-status-island__summary"
            type="button"
            :aria-expanded="isList ? 'true' : 'false'"
            :aria-controls="mobile ? undefined : panelId"
            :aria-haspopup="mobile ? 'dialog' : undefined"
            :aria-keyshortcuts="hotkey || undefined"
            :aria-describedby="!isList && head.description ? descId : undefined"
            @pointerdown="onSummaryPointerdown"
            @click="onSummaryClick"
          >
            <span class="g-status-island__badge" :class="{ 'is-busy': head.busy }" :data-type="head.type" aria-hidden="true"><GIcon :name="head.busy ? 'loader-circle' : ICON[head.type]" /><span v-if="ring" :key="ring.seg" class="g-status-island__ring"></span></span>
            <span v-if="isList && L.listTitle" class="g-status-island__text">{{ countText(L.listTitle, count) }}</span>
            <span v-else :key="textKey" class="g-status-island__text"><span v-if="typeLabel(head)" class="g-status-island__sr">{{ typeLabel(head) + ': ' }}</span>{{ head.title }}</span>
            <span v-if="outgoing && !isList" :key="`o${outgoing.key}`" class="g-status-island__text" aria-hidden="true" @transitionend.self="outgoing = null">{{ outgoing.title }}</span>
            <span v-if="timer && !isList" class="g-status-island__timer" role="timer" aria-live="off">{{ timer }}</span>
            <span class="g-status-island__tail">
              <span v-if="waiting" class="g-status-island__more"><span aria-hidden="true">+{{ waiting }}</span><span v-if="waitingText" class="g-status-island__sr">{{ ' ' + waitingText }}</span></span>
              <span class="g-status-island__chevron" aria-hidden="true"><GIcon name="chevron-down" /></span>
            </span>
          </button>
          <div v-if="head && !isList" :id="`${rootId}-peek`" ref="peekEl" class="g-status-island__peek" :hidden="peekOpen || peekLinger ? undefined : true">
            <p v-if="head.description" :id="descId" class="g-status-island__desc">{{ head.description }}</p>
            <div class="g-status-island__acts">
              <GBtn v-if="head.action" class="g-status-island__action" size="sm" :aria-disabled="head.busy ? 'true' : undefined" @click="api.action(head.uid)">{{ head.busy && head.action.busyLabel ? head.action.busyLabel : head.action.label }}</GBtn>
              <GBtn v-if="head.origin" class="g-status-island__origin" size="sm" variant="ghost" color="neutral" @click="onOrigin(head)">{{ head.origin.label }}</GBtn>
              <a v-if="head.link" class="g-status-island__link" :href="head.link.href" :target="head.link.target" :rel="head.link.rel" @click="onLink($event, head)">{{ head.link.label }}</a>
              <GBtn v-if="L.hide" class="g-status-island__hide" size="sm" variant="ghost" color="neutral" @click="onHide">{{ L.hide }}</GBtn>
            </div>
          </div>
          <div v-if="!mobile" :id="panelId" class="g-status-island__panel" :hidden="panelOpen ? undefined : true">
            <ul class="g-status-island__list" :aria-labelledby="summaryId">
              <StatusList v-if="panelOpen" :api="api" :root-id="rootId" :details="details" :guard="guard" @origin="onOrigin" @link="onLink" />
            </ul>
            <div v-if="L.close" class="g-status-island__foot">
              <GBtn class="g-status-island__close" size="sm" variant="ghost" color="neutral" @click="collapseByPerson">{{ L.close }}</GBtn>
            </div>
          </div>
        </div>
      </section>
      <GDialog v-if="mobile" v-model="sheetOpen" class="g-status-sheet" mobile="sheet" :title="L.sheetTitle" :close-label="L.close" @open="onSheetOpen" @closed="onSheetClosed">
        <ul class="g-status-island__list" :aria-labelledby="summaryId">
          <StatusList :api="api" :root-id="rootId" :details="details" :guard="guard" @origin="onOrigin" @link="onLink" />
        </ul>
      </GDialog>
    </div>
  </Teleport>
</template>
