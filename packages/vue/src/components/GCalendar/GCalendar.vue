<script setup>
// GCalendar · calendario y planificador multirrecurso (dueño: bruno)
// Contrato: design/contracts/calendar.md · Estructura: design/lab/calendar/r01/ · Estilo: GCalendar.css (coco)
// Representa y manipula tiempo; NO muta el modelo del consumidor: crear, mover y redimensionar emiten solicitudes.
import { computed, nextTick, onBeforeUnmount, onMounted, provide, ref, useAttrs, useSlots, watch } from 'vue'
import { oneOf } from '../../utils/oneOf.js'
import GIcon from '../GIcon/GIcon.vue'
import CalendarEvent from './CalendarEvent.vue'
import { CALENDAR_KEY } from './context.js'
import { addDays, addMonths, dayKey, dow, formatDay, formatTime, minToHHMM, monthStart, toDate, weekStart, zoned } from './time.js'
import { assignLanes, detectConflicts as findConflicts, segmentOf, unavailableBands } from './layout.js'

defineOptions({ name: 'GCalendar', inheritAttrs: false })

const COLORS = ['brand', 'accent', 'neutral', 'success', 'warning', 'danger', 'info']
const props = defineProps({
  events: { type: Array, default: () => [] },
  resources: { type: Array, default: undefined },
  availability: { type: Array, default: () => [] },
  blocks: { type: Array, default: () => [] },
  view: { type: String, default: undefined, validator: oneOf(['day', 'week', 'month', 'timeline']) },
  date: { type: [Date, String], default: undefined },
  selectedEventId: { type: [String, Number], default: undefined },
  timezone: { type: String, default: undefined },
  locale: { type: String, default: undefined },
  weekStartsOn: { type: Number, default: 1 },
  hour12: Boolean,
  startHour: { type: Number, default: 7 },
  endHour: { type: Number, default: 22 },
  gridInterval: { type: Number, default: 30 },
  snapInterval: { type: Number, default: 5 },
  density: { type: String, default: 'comfortable', validator: oneOf(['compact', 'comfortable', 'spacious']) },
  editable: Boolean,
  draggable: { type: Boolean, default: undefined },
  resizable: { type: Boolean, default: undefined },
  readonly: Boolean,
  disabled: Boolean,
  loading: Boolean,
  error: { type: String, default: undefined },
  showNowIndicator: { type: Boolean, default: true },
  now: { type: [Date, String], default: undefined },
  refreshInterval: { type: Number, default: 60000 },
  monthMaxVisibleEvents: { type: Number, default: 3 },
  detectConflicts: { type: Boolean, default: true },
  labels: { type: Object, default: () => ({}) },
  label: { type: String, default: undefined },
  id: { type: String, default: undefined }
})

const emit = defineEmits([
  'update:view', 'update:date', 'update:selectedEventId',
  'range-change', 'create-request', 'event-move-request', 'event-resize-request',
  'event-click', 'event-double-click', 'conflict', 'block-conflict',
  'resource-click', 'date-click', 'time-click', 'more-events-click', 'retry'
])

const attrs = useAttrs()
const slots = useSlots()
const isDev = typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production'

// ---- Umbrales de estructura por ancho de la propia raíz (constantes literales: DECISIONS.md #34 y #39)
const MODE_TABLET_MAX = 700
const MODE_PHONE_MAX = 520
const DAY_COLUMNS_MAX = 5

// ---- Zona horaria y textos
const tz = computed(() => props.timezone || 'UTC')
if (isDev && !props.timezone) console.warn('[Grana] <GCalendar> necesita `timezone` (zona IANA). Se usa UTC, no la del navegador.')
const warned = new Set()
function text(key) {
  const v = props.labels[key]
  if (v == null && isDev && !warned.has(key)) {
    warned.add(key)
    console.warn(`[Grana] <GCalendar> necesita labels.${key}.`)
  }
  return typeof v === 'string' ? v : ''
}
const fn = (key, ...args) => (typeof props.labels[key] === 'function' ? props.labels[key](...args) : '')
const time = (d) => formatTime(d, tz.value, { hour12: props.hour12, locale: props.locale })

// ---- Estado (controlado por v-model o local)
const localView = ref('week')
const localKey = ref(null)
const localSelected = ref(null)
const viewId = computed(() => props.view ?? localView.value)
const nowDate = ref(new Date())
const current = computed(() => (props.now != null ? toDate(props.now, tz.value) : nowDate.value))
const dateKey = computed(() => (props.date != null ? dayKey(toDate(props.date, tz.value), tz.value) : localKey.value ?? dayKey(current.value, tz.value)))
const selectedId = computed(() => (props.selectedEventId !== undefined ? props.selectedEventId : localSelected.value))
const mode = ref('desktop')
const activeResource = ref(null)
const weekResource = ref(null)
const sheetKey = ref(null)
const ghost = ref(null)
const liveText = ref('')
const tabStop = ref(null)
const detailPos = ref({ x: 0, y: 0 })

function setView(v) {
  localView.value = v
  emit('update:view', v)
  announce(rangeTitleFor(v, dateKey.value))
}
function setDate(key) {
  localKey.value = key
  emit('update:date', zoned(key, 0, tz.value))
}
function select(id) {
  localSelected.value = id
  emit('update:selectedEventId', id)
}
function announce(t) {
  liveText.value = ''
  setTimeout(() => (liveText.value = t || ''), 30)
}

// ---- Datos normalizados
const resList = computed(() => (props.resources && props.resources.length ? props.resources.map((r) => ({ id: String(r.id), title: r.title, subtitle: r.subtitle, raw: r })) : [{ id: '__default', title: '', raw: null }]))
const isSingle = computed(() => !(props.resources && props.resources.length))
const resourceOf = (id) => resList.value.find((r) => r.id === id) || null
const normEvents = computed(() =>
  props.events.map((e) => {
    const ids = new Set([...(e.resourceId != null ? [String(e.resourceId)] : []), ...((e.resourceIds || []).map(String))])
    if (!ids.size && isSingle.value) ids.add('__default')
    return { id: String(e.id), raw: e, title: e.title, start: toDate(e.start, tz.value), end: e.end ? toDate(e.end, tz.value) : null, allDay: !!e.allDay, status: e.status, type: e.type, color: COLORS.includes(e.color) ? e.color : undefined, resources: [...ids], editable: e.editable, draggable: e.draggable, resizable: e.resizable }
  })
)
const normBlocks = computed(() => props.blocks.map((b) => ({ id: String(b.id), raw: b, resourceId: String(b.resourceId), start: toDate(b.start, tz.value), end: toDate(b.end, tz.value), allDay: !!b.allDay, reason: b.reason })))
const ownerOf = (raw) => normEvents.value.find((e) => e.raw === raw || e.id === String(raw.id))

// Un bloqueo nuevo que cubre eventos existentes: se informa, no se toca nada
const seenBlocks = new Set()
watch([normBlocks, normEvents], () => {
  for (const b of normBlocks.value) {
    if (seenBlocks.has(b.id)) continue
    seenBlocks.add(b.id)
    const hit = normEvents.value.filter((e) => e.resources.includes(b.resourceId) && e.end && +e.start < +b.end && +e.end > +b.start)
    if (hit.length) emit('block-conflict', { block: b.raw, impactedEvents: hit.map((e) => e.raw) })
  }
}, { immediate: true })

// ---- Escalas medidas del CSS (la escala en píxeles es del tema; aquí solo se mide)
const metrics = ref({ ppm: 1, ppmx: 1.8667, evmin: 24 })
function measure() {
  const root = rootEl.value
  if (!root) return
  const probe = document.createElement('span')
  probe.setAttribute('aria-hidden', 'true')
  probe.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none;inline-size:calc(var(--_ppmx) * 60);block-size:var(--_evmin);min-block-size:0'
  const hour = document.createElement('span')
  hour.setAttribute('aria-hidden', 'true')
  hour.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none;block-size:var(--_hour);inline-size:0'
  root.append(probe, hour)
  const w = probe.getBoundingClientRect().width
  const evmin = probe.getBoundingClientRect().height
  const h = hour.getBoundingClientRect().height
  probe.remove()
  hour.remove()
  if (h > 0 && w > 0 && evmin > 0) metrics.value = { ppm: h / 60, ppmx: w / 60, evmin }
}

// ---- Rango visible y título
const fromMin = computed(() => props.startHour * 60)
const toMin = computed(() => props.endHour * 60)
const visibleMin = computed(() => toMin.value - fromMin.value)
function rangeOf(v, key) {
  if (v === 'month') { const s = weekStart(monthStart(key), props.weekStartsOn); return [s, addDays(s, 42)] }
  if (v === 'week') { const s = weekStart(key, props.weekStartsOn); return [s, addDays(s, 7)] }
  return [key, addDays(key, 1)]
}
function rangeTitleFor(v, key) {
  const [s, e] = rangeOf(v, key)
  const custom = fn('rangeTitle', v, zoned(s, 0, tz.value), zoned(e, 0, tz.value))
  if (custom) return custom
  if (v === 'month') return formatDay(monthStart(key), { month: 'long', year: 'numeric' }, props.locale)
  if (v === 'week') return `${formatDay(s, { day: 'numeric', month: 'short' }, props.locale)} – ${formatDay(addDays(e, -1), { day: 'numeric', month: 'short', year: 'numeric' }, props.locale)}`
  return formatDay(key, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }, props.locale)
}
const title = computed(() => rangeTitleFor(viewId.value, dateKey.value))
watch([viewId, dateKey, tz, () => props.weekStartsOn], () => {
  const [s, e] = rangeOf(viewId.value, dateKey.value)
  emit('range-change', { start: zoned(s, 0, tz.value), end: zoned(e, 0, tz.value), view: viewId.value, timezone: tz.value })
}, { immediate: true })

// ---- Recursos visibles según vista y dispositivo
const phone = computed(() => mode.value === 'phone')
const weekRes = computed(() => (resList.value.some((r) => r.id === weekResource.value) ? weekResource.value : resList.value[0].id))
const dayResources = computed(() => {
  if (activeResource.value && resList.value.some((r) => r.id === activeResource.value)) return resList.value.filter((r) => r.id === activeResource.value)
  return resList.value.slice(0, DAY_COLUMNS_MAX)
})
const showResourceList = computed(() => phone.value && ((viewId.value === 'day' && resList.value.length > 1 && !activeResource.value) || viewId.value === 'timeline'))

// ---- Modelo de vista
const todayKey = computed(() => dayKey(current.value, tz.value))
const nowRel = computed(() => {
  if (!props.showNowIndicator) return null
  const d = current.value
  const p = (+d - +zoned(todayKey.value, 0, tz.value)) / 60000
  return p >= fromMin.value && p <= toMin.value ? p - fromMin.value : null
})
function daySegs(resId, key, minMinutes) {
  const segs = normEvents.value.filter((e) => e.resources.includes(resId) && !e.allDay).map((e) => segmentOf(e, key, tz.value, current.value)).filter(Boolean)
  const visible = segs.filter((s) => s.endMin > fromMin.value && s.startMin < toMin.value)
  assignLanes(visible, minMinutes)
  for (const s of visible) { s.k = `${s.ev.id}|${resId}|${key}`; s.relStart = Math.max(s.startMin, fromMin.value) - fromMin.value; s.relDur = Math.min(s.endMin, toMin.value) - Math.max(s.startMin, fromMin.value) }
  return { visible, outside: segs.length - visible.length }
}
function dayBlocks(resId, key) {
  const ds = zoned(key, 0, tz.value)
  const de = zoned(addDays(key, 1), 0, tz.value)
  return normBlocks.value.filter((b) => b.resourceId === resId && +b.start < +de && +b.end > +ds).map((b) => {
    const a = Math.max((Math.max(+b.start, +ds) - +ds) / 60000, fromMin.value)
    const z = Math.min((Math.min(+b.end, +de) - +ds) / 60000, toMin.value)
    return { b, allDay: b.allDay, relStart: a - fromMin.value, relDur: z - a, from: a, to: z }
  }).filter((x) => x.allDay || x.relDur > 0)
}
// Un evento de día completo también es un botón de evento (título; sin hora)
const allDaySeg = (e, key) => ({ ev: e, start: zoned(key, 0, tz.value), end: zoned(addDays(key, 1), 0, tz.value), open: false, continuesBefore: false, continuesAfter: false })
function dayAllDay(resId, key) {
  const ds = zoned(key, 0, tz.value)
  const de = zoned(addDays(key, 1), 0, tz.value)
  return normEvents.value.filter((e) => e.allDay && e.resources.includes(resId) && +e.start < +de && +(e.end || e.start) >= +ds)
}
const bands = (resId, key) => unavailableBands(props.availability, resId, key, fromMin.value, toMin.value).map(([a, b]) => ({ relStart: a - fromMin.value, relDur: b - a }))

// Eventos y bloqueos en UN solo arreglo, en orden temporal: el orden del DOM es el orden cronológico
function chronological(segs, blks) {
  return [
    ...segs.map((s) => ({ kind: 'event', id: s.k, t: s.relStart, s })),
    ...blks.filter((x) => !x.allDay).map((b) => ({ kind: 'block', id: 'b' + b.b.id, t: b.relStart, b }))
  ].sort((a, b) => a.t - b.t || (a.kind === 'block' ? -1 : 1))
}
const columns = computed(() => {
  if (viewId.value !== 'day' && viewId.value !== 'week') return []
  const minMin = metrics.value.evmin / metrics.value.ppm
  const cols = viewId.value === 'day'
    ? dayResources.value.map((r) => ({ key: dateKey.value, res: r, head: r.title || formatDay(dateKey.value, { weekday: 'short', day: 'numeric' }, props.locale), sub: r.title ? formatDay(dateKey.value, { weekday: 'short', day: 'numeric' }, props.locale) : '' }))
    : [...Array(7)].map((_, i) => { const k = addDays(weekStart(dateKey.value, props.weekStartsOn), i); const r = resourceOf(weekRes.value); return { key: k, res: r, head: formatDay(k, { weekday: 'short', day: 'numeric' }, props.locale), sub: r.title } })
  return cols.map((c) => {
    const { visible, outside } = daySegs(c.res.id, c.key, minMin)
    const blks = dayBlocks(c.res.id, c.key)
    return { ...c, id: `${c.key}|${c.res.id}`, isToday: c.key === todayKey.value, today: viewId.value === 'week' && c.key === todayKey.value, segs: visible, outside, blocks: blks, items: chronological(visible, blks), bands: bands(c.res.id, c.key), allDay: dayAllDay(c.res.id, c.key) }
  })
})
const timelineRows = computed(() => {
  if (viewId.value !== 'timeline') return []
  const minMin = metrics.value.evmin / metrics.value.ppmx
  return resList.value.map((r) => {
    const { visible } = daySegs(r.id, dateKey.value, minMin)
    const blks = dayBlocks(r.id, dateKey.value).filter((x) => !x.allDay)
    return { res: r, segs: visible, lanes: Math.max(1, ...visible.map((s) => s.lane + 1)), blocks: blks, items: chronological(visible, blks), bands: bands(r.id, dateKey.value), allDay: dayAllDay(r.id, dateKey.value) }
  })
})
function eventsOnDay(key, resIds) {
  const ds = zoned(key, 0, tz.value)
  const de = zoned(addDays(key, 1), 0, tz.value)
  return normEvents.value.filter((e) => e.resources.some((r) => resIds.includes(r)) && +e.start < +de && +(e.end || e.start) >= +ds).sort((a, b) => (b.allDay ? 1 : 0) - (a.allDay ? 1 : 0) || +a.start - +b.start)
}
const monthCells = computed(() => {
  if (viewId.value !== 'month') return []
  const first = monthStart(dateKey.value)
  const start = weekStart(first, props.weekStartsOn)
  const ids = resList.value.map((r) => r.id)
  const max = Math.max(1, props.monthMaxVisibleEvents)
  return [...Array(6)].map((_, w) => [...Array(7)].map((__, d) => {
    const key = addDays(start, w * 7 + d)
    const evs = eventsOnDay(key, ids)
    return { key, outside: key.slice(0, 7) !== first.slice(0, 7), today: key === todayKey.value, events: evs, shown: evs.slice(0, max), hidden: Math.max(0, evs.length - max) }
  }))
})
const weekdayNames = computed(() => [...Array(7)].map((_, i) => formatDay(addDays(weekStart('2026-09-27', props.weekStartsOn), i), { weekday: 'short' }, props.locale)))
const axisHours = computed(() => [...Array(props.endHour - props.startHour + 1)].map((_, i) => ({ label: props.hour12 ? formatTime(zoned('2026-01-01', (props.startHour + i) * 60, 'UTC'), 'UTC', { hour12: true, locale: props.locale }) : `${String(props.startHour + i).padStart(2, '0')}:00`, rel: i * 60 })))
const totalVisible = computed(() => (viewId.value === 'month' ? monthCells.value.flat().reduce((n, c) => n + c.events.length, 0) : viewId.value === 'timeline' ? timelineRows.value.reduce((n, r) => n + r.segs.length, 0) : columns.value.reduce((n, c) => n + c.segs.length + c.allDay.length, 0)))
const tooMany = computed(() => viewId.value === 'day' && resList.value.length > DAY_COLUMNS_MAX && !phone.value && !activeResource.value)
// Una sola línea de ahora por ventana: se dibuja en la primera columna de hoy y abarca todas las de hoy
const nowColumn = computed(() => columns.value.find((c) => c.isToday) || null)
const nowSpan = computed(() => columns.value.filter((c) => c.isToday).length)
const outsideTotal = computed(() => columns.value.reduce((n, c) => n + c.outside, 0))
const allKeys = computed(() => {
  const ks = []
  for (const c of columns.value) {
    for (const e of c.allDay) ks.push(`${e.id}|${c.id}`)
    for (const s of c.segs) ks.push(s.k)
  }
  for (const r of timelineRows.value) for (const s of r.segs) ks.push(s.k)
  return ks
})
const effectiveTabStop = computed(() => (tabStop.value && allKeys.value.includes(tabStop.value) ? tabStop.value : allKeys.value[0]))

// ---- Estado de un recurso (teléfono)
function statusOf(resId) {
  const key = todayKey.value
  const ds = zoned(key, 0, tz.value)
  const de = zoned(addDays(key, 1), 0, tz.value)
  const n = current.value
  const st = props.labels.resourceStatus || {}
  if (normBlocks.value.some((b) => b.resourceId === resId && +b.start <= +n && +b.end > +n)) return st.blocked || ''
  const evs = normEvents.value.filter((e) => e.resources.includes(resId) && !e.allDay && +e.start < +de && +(e.end || n) > +ds).sort((a, b) => +a.start - +b.start)
  const cur = evs.find((e) => +e.start <= +n && (!e.end || +e.end > +n))
  if (cur) return cur.end ? (st.busyUntil ? st.busyUntil(time(cur.end)) : '') : st.activeEvent || ''
  const next = evs.find((e) => +e.start > +n)
  return next ? (st.availableNext ? st.availableNext(time(next.start)) : '') : st.available || ''
}

// ---- Contexto para las piezas internas
provide(CALENDAR_KEY, {
  slots,
  resourceOf,
  time,
  eventName(ev, res, seg) {
    const start = time(seg.start)
    const end = seg.open ? null : time(seg.end)
    const status = seg.open ? 'active' : ev.status
    const custom = props.labels.eventName ? props.labels.eventName(ev.raw, res ? res.raw : null, start, end, status) : ''
    if (custom) return custom
    return [ev.title, ev.allDay ? '' : seg.open ? start : `${start} – ${end}`, res && res.title, status].filter(Boolean).join(', ')
  }
})

// ---- Permisos de interacción
const canEdit = computed(() => !props.disabled && !props.readonly)
const can = (ev, kind) => canEdit.value && (ev[kind] ?? ev.editable ?? (props[kind] ?? props.editable))
const canCreate = computed(() => canEdit.value && props.editable)

// ---- Solicitudes (nunca mutan)
function conflictsFor(ev, start, end, resourceId) {
  if (!props.detectConflicts) return []
  return findConflicts({ event: ev, start, end, resourceId, events: normEvents.value, blocks: normBlocks.value, availability: props.availability, tz: tz.value })
}
function reportConflicts(ev, conflicts) {
  if (!conflicts.length) return
  emit('conflict', { type: conflicts[0].type, event: ev.raw, conflicts })
  const c = props.labels.conflict
  announce(c && c[conflicts[0].type] ? (typeof c[conflicts[0].type] === 'function' ? c[conflicts[0].type](ev.raw) : c[conflicts[0].type]) : '')
}
function requestMove(ev, resourceId, newStart, newEnd, newResourceId) {
  const conflicts = conflictsFor(ev, newStart, newEnd, newResourceId)
  emit('event-move-request', { event: ev.raw, resourceId, previousStart: ev.start, previousEnd: ev.end, newStart, newEnd, newResourceId, conflicts })
  reportConflicts(ev, conflicts)
}
function requestResize(ev, resourceId, newEnd) {
  const conflicts = conflictsFor(ev, ev.start, newEnd, resourceId)
  emit('event-resize-request', { event: ev.raw, resourceId, previousEnd: ev.end, newEnd, conflicts })
  reportConflicts(ev, conflicts)
}
function requestCreate(resourceId, start, end, source) {
  const rule = props.availability.find((r) => r.resourceId === resourceId && r.slotDuration)
  const finalEnd = end || (rule ? new Date(+start + rule.slotDuration * 60000) : null)
  emit('time-click', { resourceId: resourceId === '__default' ? undefined : resourceId, start })
  emit('create-request', { resourceId: resourceId === '__default' ? undefined : resourceId, start, ...(finalEnd ? { end: finalEnd } : {}), timezone: tz.value, source })
}

// ---- Selección y detalle
const selectedEv = computed(() => (selectedId.value != null ? normEvents.value.find((e) => e.id === String(selectedId.value)) || null : null))
function placeDetail(anchor) {
  const root = rootEl.value
  if (!root || !anchor) return
  const r = anchor.getBoundingClientRect()
  const b = root.getBoundingClientRect()
  detailPos.value = { x: Math.max(0, Math.min(r.left - b.left, b.width - 320)), y: Math.max(0, r.bottom - b.top + 6) }
}
function activate(evEl) {
  const ev = normEvents.value.find((e) => e.id === evEl.dataset.id)
  if (!ev) return
  select(ev.id)
  emit('event-click', { event: ev.raw, resourceId: evEl.dataset.resource === '__default' ? undefined : evEl.dataset.resource })
  nextTick(() => placeDetail(evEl))
}
const cssEscape = (t) => (typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(t) : String(t).replace(/(["\\])/g, '\\$1'))
function closeDetail() {
  const el = selectedEv.value && viewportEl.value && viewportEl.value.querySelector(`[data-id="${cssEscape(selectedEv.value.id)}"]`)
  select(null)
  if (el) el.focus()
}

// ---- Interacción con puntero
const rootEl = ref(null)
const viewportEl = ref(null)
let drag = null
function cellOf(t) {
  return t && t.closest ? t.closest('[data-cell]') : null
}
function posToMin(cell, e) {
  const r = cell.getBoundingClientRect()
  const horizontal = cell.dataset.axis === 'x'
  const len = horizontal ? r.width : r.height
  const p = horizontal ? e.clientX - r.left : e.clientY - r.top
  return fromMin.value + (p / len) * visibleMin.value
}
const snapMin = (m) => Math.round(m / props.snapInterval) * props.snapInterval
function ghostFor(cell, a, b, conflict, label) {
  ghost.value = { cell: cell.dataset.cellId, start: a - fromMin.value, dur: Math.max(b - a, props.snapInterval), conflict, label }
}
function onPointerDown(e) {
  if (e.button !== 0 || !canEdit.value) return
  const handle = e.target.closest('.g-calendar__handle')
  const btn = e.target.closest('.g-calendar__event')
  const cell = cellOf(e.target)
  if (handle) return startEventDrag(e, handle.dataset.id, 'resize', cell)
  if (btn && btn.dataset.key) return startEventDrag(e, btn.dataset.id, 'move', cell)
  if (cell && props.editable && !e.target.closest('.g-calendar__block') && !btn) startCreate(e, cell)
}
function startCreate(e0, cell) {
  const m0 = snapMin(posToMin(cell, e0))
  let m1 = m0
  let moved = false
  const move = (e) => {
    const d = cell.dataset.axis === 'x' ? Math.abs(e.clientX - e0.clientX) : Math.abs(e.clientY - e0.clientY)
    if (d < 4) return
    moved = true
    m1 = snapMin(posToMin(cell, e))
    ghostFor(cell, Math.min(m0, m1), Math.max(m0, m1) || m0 + props.snapInterval, false, `${minToHHMM(Math.min(m0, m1))}–${minToHHMM(Math.max(m0, m1) || m0 + props.snapInterval)}`)
  }
  const finish = (commit) => {
    document.removeEventListener('pointermove', move)
    document.removeEventListener('pointerup', up)
    document.removeEventListener('keydown', esc)
    ghost.value = null
    drag = null
    if (!commit) return
    const a = Math.min(m0, m1)
    const b = moved && Math.max(m0, m1) > a ? Math.max(m0, m1) : null
    requestCreate(cell.dataset.resource, zoned(cell.dataset.date, a, tz.value), b ? zoned(cell.dataset.date, b, tz.value) : null, 'pointer')
  }
  const up = () => finish(true)
  const esc = (ev) => { if (ev.key === 'Escape') finish(false) }
  drag = { finish }
  document.addEventListener('pointermove', move)
  document.addEventListener('pointerup', up)
  document.addEventListener('keydown', esc)
}
function startEventDrag(e0, id, kind, cell0) {
  const ev = normEvents.value.find((x) => x.id === id)
  if (!ev || !cell0 || !can(ev, kind === 'move' ? 'draggable' : 'resizable') || (kind === 'resize' && !ev.end)) return
  const dur = ev.end ? +ev.end - +ev.start : 0
  const resourceId = cell0.dataset.resource
  const offset = posToMin(cell0, e0) - (+ev.start - +zoned(cell0.dataset.date, 0, tz.value)) / 60000
  let started = false
  let cur = null
  const move = (e) => {
    if (!started && Math.hypot(e.clientX - e0.clientX, e.clientY - e0.clientY) < 4) return
    started = true
    if (kind === 'move') {
      const cell = cellOf(document.elementFromPoint ? document.elementFromPoint(e.clientX, e.clientY) : null) || cell0
      const m = snapMin(posToMin(cell, e) - offset)
      const ns = zoned(cell.dataset.date, m, tz.value)
      const ne = new Date(+ns + dur)
      const bad = conflictsFor(ev, ns, ne, cell.dataset.resource).length > 0
      ghostFor(cell, m, m + dur / 60000, bad, time(ns))
      cur = { ns, ne, res: cell.dataset.resource }
    } else {
      const dsm = (+ev.start - +zoned(cell0.dataset.date, 0, tz.value)) / 60000
      const m = Math.max(snapMin(posToMin(cell0, e)), dsm + props.snapInterval)
      const ne = zoned(cell0.dataset.date, m, tz.value)
      const bad = conflictsFor(ev, ev.start, ne, resourceId).length > 0
      ghostFor(cell0, dsm, m, bad, `${time(ev.start)}–${time(ne)}`)
      cur = { ne }
    }
  }
  const finish = (commit) => {
    document.removeEventListener('pointermove', move)
    document.removeEventListener('pointerup', up)
    document.removeEventListener('keydown', esc)
    ghost.value = null
    drag = null
    if (!started) return
    suppressClick = true
    setTimeout(() => (suppressClick = false), 0)
    if (!commit || !cur) return
    if (kind === 'move') requestMove(ev, resourceId, cur.ns, cur.ne, cur.res)
    else requestResize(ev, resourceId, cur.ne)
  }
  const up = () => finish(true)
  const esc = (evt) => { if (evt.key === 'Escape') finish(false) }
  drag = { finish }
  document.addEventListener('pointermove', move)
  document.addEventListener('pointerup', up)
  document.addEventListener('keydown', esc)
}
let suppressClick = false
function onClick(e) {
  if (suppressClick) return
  const btn = e.target.closest('.g-calendar__event')
  if (btn) return activate(btn)
  const day = e.target.closest('.g-calendar__day')
  if (day) {
    emit('date-click', { date: zoned(day.dataset.date, 0, tz.value) })
    if (phone.value) return openSheet(day.dataset.date)
    setDate(day.dataset.date)
    return setView('day')
  }
  const more = e.target.closest('.g-calendar__more')
  if (more) {
    emit('more-events-click', { date: zoned(more.dataset.date, 0, tz.value), hidden: Number(more.dataset.hidden) })
    return openSheet(more.dataset.date)
  }
  const head = e.target.closest('[data-resource-head]')
  if (head) emit('resource-click', { resourceId: head.dataset.resourceHead })
}
function onDblClick(e) {
  const btn = e.target.closest('.g-calendar__event')
  if (!btn) return
  const ev = normEvents.value.find((x) => x.id === btn.dataset.id)
  if (ev) emit('event-double-click', { event: ev.raw, resourceId: btn.dataset.resource === '__default' ? undefined : btn.dataset.resource })
}
function openSheet(key) {
  sheetKey.value = key
}

// ---- Teclado
function onFocusIn(e) {
  const btn = e.target.closest && e.target.closest('.g-calendar__event')
  if (btn && btn.dataset.key) tabStop.value = btn.dataset.key
}
function onKeydown(e) {
  const btn = e.target.closest('.g-calendar__event')
  if (!btn || !btn.dataset.key) return
  const ev = normEvents.value.find((x) => x.id === btn.dataset.id)
  if (!ev) return
  const horizontal = viewId.value === 'timeline'
  const back = horizontal ? 'ArrowLeft' : 'ArrowUp'
  const fwd = horizontal ? 'ArrowRight' : 'ArrowDown'
  const sign = e.key === fwd ? 1 : e.key === back ? -1 : 0
  const step = props.snapInterval * 60000
  const resourceId = btn.dataset.resource
  if (e.altKey && sign) {
    e.preventDefault()
    if (ev.end && can(ev, 'draggable')) requestMove(ev, resourceId, new Date(+ev.start + sign * step), new Date(+ev.end + sign * step), resourceId)
    return
  }
  if (e.shiftKey && sign) {
    e.preventDefault()
    if (ev.end && can(ev, 'resizable')) requestResize(ev, resourceId, new Date(+ev.end + sign * step))
    return
  }
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    activate(btn)
    return
  }
  if (e.key === 'Escape' && selectedEv.value) {
    e.preventDefault()
    closeDetail()
    return
  }
  // Tabulación itinerante
  const all = [...viewportEl.value.querySelectorAll('.g-calendar__event[data-key]')]
  const list = [...btn.closest('ul').querySelectorAll('.g-calendar__event[data-key]')]
  let next = null
  if (e.key === fwd) next = list[list.indexOf(btn) + 1] || null
  else if (e.key === back) next = list[list.indexOf(btn) - 1] || null
  else if (e.key === (horizontal ? 'ArrowDown' : 'ArrowRight') || e.key === (horizontal ? 'ArrowUp' : 'ArrowLeft')) {
    const lists = [...viewportEl.value.querySelectorAll('ul.g-calendar__events, ul.g-calendar__allday-events')].filter((u) => u.querySelector('.g-calendar__event[data-key]'))
    const target = lists[lists.indexOf(btn.closest('ul')) + (e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1)]
    next = target ? target.querySelector('.g-calendar__event[data-key]') : null
  } else if (e.key === 'Home') next = all[0]
  else if (e.key === 'End') next = all[all.length - 1]
  else return
  if (next) {
    e.preventDefault()
    next.focus()
  }
}
function createFromKeyboard(col) {
  requestCreate(col.res.id, zoned(col.key, Math.max(fromMin.value, 9 * 60), tz.value), null, 'keyboard')
}
function createFromKeyboardTimeline(row) {
  requestCreate(row.res.id, zoned(dateKey.value, Math.max(fromMin.value, 9 * 60), tz.value), null, 'keyboard')
}

// ---- Navegación
function move(n) {
  const v = viewId.value
  setDate(v === 'month' ? addMonths(dateKey.value, n) : addDays(dateKey.value, n * (v === 'week' ? 7 : 1)))
  announce(rangeTitleFor(v, v === 'month' ? addMonths(dateKey.value, n) : addDays(dateKey.value, n * (v === 'week' ? 7 : 1))))
}
function goToday() {
  setDate(todayKey.value)
}
function pickResource(id) {
  emit('resource-click', { resourceId: id })
  activeResource.value = id
  if (viewId.value !== 'day') setView('day')
}

// ---- Ciclo de vida
let ro = null
let timer = null
let frame = 0
let pendingMode = null
const raf = (f) => (typeof requestAnimationFrame === 'function' ? requestAnimationFrame(f) : setTimeout(f, 16))
const caf = (id) => (typeof cancelAnimationFrame === 'function' ? cancelAnimationFrame(id) : clearTimeout(id))
onMounted(() => {
  measure()
  if (typeof ResizeObserver !== 'undefined' && rootEl.value) {
    // La escritura va al cuadro siguiente y solo si cambia: dentro de la devolución, WebKit avisa «ResizeObserver loop completed» (#169)
    ro = new ResizeObserver((entries) => {
      const w = entries[entries.length - 1].contentRect.width
      pendingMode = w > 0 && w <= MODE_PHONE_MAX ? 'phone' : w > 0 && w <= MODE_TABLET_MAX ? 'tablet' : 'desktop'
      if (frame) return
      frame = raf(() => {
        frame = 0
        if (pendingMode !== null && pendingMode !== mode.value) mode.value = pendingMode
        pendingMode = null
      })
    })
    ro.observe(rootEl.value)
  }
  if (props.now == null) timer = setInterval(() => (nowDate.value = new Date()), Math.max(1000, props.refreshInterval))
})
onBeforeUnmount(() => {
  if (ro) ro.disconnect()
  if (frame) caf(frame)
  if (timer) clearInterval(timer)
  if (drag) drag.finish(false)
})
watch(() => props.density, () => nextTick(measure))
watch(() => props.startHour, () => nextTick(measure))
watch(viewId, () => { sheetKey.value = null; nextTick(measure) })
watch(mode, () => nextTick(measure))

// ---- Presentación
const rootId = computed(() => props.id || undefined)
const regionLabel = computed(() => props.label || attrs['aria-label'] || text('calendar') || undefined)
if (isDev && !props.label && !attrs['aria-label'] && !attrs['aria-labelledby'] && !props.labels.calendar) console.warn('[Grana] <GCalendar> necesita label, aria-label, aria-labelledby o labels.calendar para tener un nombre accesible.')
const rootAttrs = computed(() => {
  const { class: c, style: s, 'aria-label': _al, ...rest } = attrs
  return { class: c, style: s, ...Object.fromEntries(Object.entries(rest).filter(([k]) => k.startsWith('data-') || k === 'aria-labelledby')) }
})
const classes = computed(() => [
  'g-calendar', `g-calendar--view-${viewId.value}`, `g-calendar--density-${props.density}`, `g-calendar--mode-${mode.value}`,
  { 'is-readonly': props.readonly, 'is-disabled': props.disabled, 'is-loading': props.loading, 'is-error': Boolean(props.error) }
])
const skeletonRows = computed(() => Math.max(3, Math.min(resList.value.length, 6)))
const statusText = computed(() => {
  if (props.error || props.loading) return ''
  if (tooMany.value) return text('tooManyResources')
  return ''
})
const showEmpty = computed(() => !props.loading && !props.error && totalVisible.value === 0 && !showResourceList.value)
const phoneAgenda = computed(() => (viewId.value === 'week' && phone.value ? eventsOnDay(dateKey.value, [weekRes.value]) : []))
const sheetEvents = computed(() => (sheetKey.value ? eventsOnDay(sheetKey.value, resList.value.map((r) => r.id)) : []))
const weekStripDays = computed(() => [...Array(7)].map((_, i) => { const k = addDays(weekStart(dateKey.value, props.weekStartsOn), i); return { key: k, n: eventsOnDay(k, [weekRes.value]).length, label: formatDay(k, { weekday: 'narrow', day: 'numeric' }, props.locale) } }))
const ghostFor2 = (key) => (ghost.value && ghost.value.cell === key ? ghost.value : null)
</script>

<template>
  <div
    :id="rootId"
    ref="rootEl"
    v-bind="rootAttrs"
    :class="classes"
    role="region"
    :aria-label="regionLabel"
    :aria-busy="loading ? 'true' : undefined"
    :aria-disabled="disabled ? 'true' : undefined"
    :style="{ '--_grid': gridInterval }"
  >
    <div class="g-calendar__toolbar" role="toolbar" :aria-label="regionLabel">
      <button class="g-calendar__prev" type="button" :aria-label="text('previous')" :disabled="disabled" @click="move(-1)"><GIcon name="chevron-left" /></button>
      <button class="g-calendar__today" type="button" :disabled="disabled" @click="goToday">{{ text('today') }}</button>
      <button class="g-calendar__next" type="button" :aria-label="text('next')" :disabled="disabled" @click="move(1)"><GIcon name="chevron-right" /></button>
      <h2 class="g-calendar__title">{{ title }}</h2>
      <label v-if="viewId === 'week' && resList.length > 1" class="g-calendar__resource-select">
        <span class="g-calendar__sr">{{ text('resources') }}</span>
        <select :value="weekRes" :disabled="disabled" @change="weekResource = $event.target.value">
          <option v-for="r in resList" :key="r.id" :value="r.id">{{ r.title }}</option>
        </select>
      </label>
      <div class="g-calendar__views" role="group" :aria-label="text('views')">
        <button v-for="v in ['day', 'week', 'month', 'timeline']" :key="v" type="button" :aria-pressed="viewId === v ? 'true' : 'false'" :disabled="disabled" @click="setView(v)">{{ text(v) }}</button>
      </div>
      <slot name="toolbar-end" />
    </div>

    <div class="g-calendar__status" role="status">{{ statusText }}</div>
    <div v-if="error" class="g-calendar__status" role="alert">
      {{ error }} <button class="g-calendar__retry" type="button" @click="emit('retry')">{{ text('retry') }}</button>
    </div>

    <div ref="viewportEl" class="g-calendar__viewport" @pointerdown="onPointerDown" @click="onClick" @dblclick="onDblClick" @keydown="onKeydown" @focusin="onFocusIn">
      <!-- Cargando: conserva la estructura -->
      <div v-if="loading" class="g-calendar__skeleton" aria-busy="true" :aria-label="text('loading')"><span v-for="n in skeletonRows" :key="n" /></div>

      <!-- Teléfono: lista de recursos con estado -->
      <ul v-else-if="showResourceList" class="g-calendar__resources" :aria-label="text('resources')">
        <li v-for="r in resList" :key="r.id">
          <button class="g-calendar__resource" type="button" @click="pickResource(r.id)"><span>{{ r.title }}</span><span>{{ statusOf(r.id) }}</span></button>
        </li>
      </ul>

      <!-- Día y Semana (columnas de tiempo) -->
      <div v-else-if="(viewId === 'day' || viewId === 'week') && !(phone && viewId === 'week')" class="g-calendar__grid" :style="{ '--_cols': columns.length, '--_minutes': visibleMin }">
        <div />
        <div v-for="c in columns" :key="'h' + c.id" class="g-calendar__head" :class="{ 'is-today': c.today }" :aria-current="c.today ? 'date' : undefined" :data-resource-head="viewId === 'day' ? c.res.id : undefined">
          <slot v-if="viewId === 'day'" name="resource" :resource="c.res.raw"><span class="g-calendar__head-title">{{ c.head }}</span>{{ c.sub }}</slot>
          <slot v-else name="day-header" :date="zoned(c.key, 0, tz)"><span class="g-calendar__head-title">{{ c.head }}</span>{{ c.sub }}</slot>
        </div>
        <div class="g-calendar__allday">
          <div>{{ text('allDay') }}</div>
          <div v-for="c in columns" :key="'a' + c.id">
            <ul v-if="c.allDay.length" class="g-calendar__allday-events">
              <li v-for="e in c.allDay" :key="e.id">
                <slot name="all-day-event" :event="e.raw"><CalendarEvent :seg="allDaySeg(e, c.key)" :resource-id="c.res.id" :selected="selectedId === e.id" :tab-stop="effectiveTabStop === e.id + '|' + c.id" :data-key="e.id + '|' + c.id" /></slot>
              </li>
            </ul>
            <span v-for="b in c.blocks.filter((x) => x.allDay)" :key="b.b.id" class="g-calendar__event-time">{{ text('unavailable') }}{{ b.b.reason ? ' · ' + b.b.reason : '' }}</span>
          </div>
        </div>
        <div class="g-calendar__axis" aria-hidden="true" :style="{ '--_minutes': visibleMin }"><span v-for="h in axisHours" :key="h.rel" :style="{ '--_start': h.rel }">{{ h.label }}</span></div>
        <div v-for="c in columns" :key="c.id" class="g-calendar__col" :class="{ 'is-today': c.today }" data-cell="" :data-cell-id="c.id" :data-date="c.key" :data-resource="c.res.id" data-axis="y" :style="{ '--_minutes': visibleMin }">
          <div class="g-calendar__availability" aria-hidden="true"><div v-for="(b, i) in c.bands" :key="i" :style="{ '--_start': b.relStart, '--_dur': b.relDur }" /></div>
          <ul class="g-calendar__events" :aria-label="c.head + (c.sub ? ', ' + c.sub : '')">
            <template v-for="it in c.items" :key="it.id">
              <li v-if="it.kind === 'block'" class="g-calendar__block" :style="{ '--_start': it.b.relStart, '--_dur': it.b.relDur }">
                <span aria-hidden="true">{{ it.b.b.reason }}</span><span class="g-calendar__sr">{{ fn('unavailable', time(zoned(c.key, it.b.from, tz)), time(zoned(c.key, it.b.to, tz)), it.b.b.reason) }}</span>
              </li>
              <li v-else :class="{ 'is-selected': selectedId === it.s.ev.id }" :style="{ '--_start': it.s.relStart, '--_dur': it.s.relDur, '--_lane': it.s.lane, '--_lanes': it.s.lanes }">
                <CalendarEvent :seg="it.s" :resource-id="c.res.id" :small="it.s.relDur * metrics.ppm < 34" :selected="selectedId === it.s.ev.id" :tab-stop="effectiveTabStop === it.s.k" :data-key="it.s.k" />
                <span v-if="!it.s.open && can(it.s.ev, 'resizable')" class="g-calendar__handle" aria-hidden="true" :data-id="it.s.ev.id" />
              </li>
            </template>
          </ul>
          <div v-if="nowColumn && nowColumn.id === c.id && nowRel != null" class="g-calendar__now" aria-hidden="true" :style="{ '--_start': nowRel, '--_span': nowSpan }"><GIcon class="g-calendar__now-dot" name="circle" filled /><span>{{ text('now') }} {{ time(current) }}</span></div>
          <div v-if="ghostFor2(c.id)" class="g-calendar__ghost" :class="{ 'is-conflict': ghostFor2(c.id).conflict }" aria-hidden="true" :style="{ '--_start': ghostFor2(c.id).start, '--_dur': ghostFor2(c.id).dur }">{{ ghostFor2(c.id).label }}</div>
          <button v-if="canCreate" class="g-calendar__create" type="button" @click="createFromKeyboard(c)">{{ fn('createEvent', c.res.raw, c.key, '09:00') }}</button>
        </div>
        <div v-if="outsideTotal" class="g-calendar__status">{{ fn('outOfRange', outsideTotal, `${String(startHour).padStart(2, '0')}:00`, `${String(endHour).padStart(2, '0')}:00`) }}</div>
      </div>

      <!-- Semana en teléfono: tira de días + agenda -->
      <div v-else-if="viewId === 'week' && phone">
        <div class="g-calendar__strip" role="group" :aria-label="text('week')">
          <button v-for="d in weekStripDays" :key="d.key" type="button" :aria-pressed="d.key === dateKey ? 'true' : 'false'" @click="setDate(d.key)">{{ d.label }}<span v-if="d.n" class="g-calendar__strip-dots" aria-hidden="true"><GIcon v-for="i in Math.min(d.n, 3)" :key="i" name="circle" filled /></span></button>
        </div>
        <ul class="g-calendar__agenda" :aria-label="resourceOf(weekRes).title">
          <li v-for="e in phoneAgenda" :key="e.id">
            <CalendarEvent :seg="{ ev: e, start: e.start, end: e.end || e.start, open: !e.end, continuesBefore: false, continuesAfter: false }" :resource-id="weekRes" :data-key="e.id + '|' + weekRes" :selected="selectedId === e.id" natural />
          </li>
        </ul>
      </div>

      <!-- Timeline -->
      <div v-else-if="viewId === 'timeline'" class="g-calendar__timeline" :style="{ '--_minutes': visibleMin }">
        <div class="g-calendar__axis" aria-hidden="true">
          <div />
          <span v-for="h in axisHours" :key="h.rel" :style="{ '--_start': h.rel }">{{ h.label }}</span>
        </div>
        <ul class="g-calendar__rows" :aria-label="text('resources')">
          <li v-for="r in timelineRows" :key="r.res.id" class="g-calendar__row">
            <div class="g-calendar__label" :data-resource-head="r.res.id">
              <slot name="resource" :resource="r.res.raw"><span class="g-calendar__label-title">{{ r.res.title }}</span><span v-if="r.res.subtitle" class="g-calendar__label-sub">{{ r.res.subtitle }}</span></slot>
            </div>
            <div class="g-calendar__track" data-cell="" :data-cell-id="r.res.id" :data-date="dateKey" :data-resource="r.res.id" data-axis="x" :style="{ '--_lanes': r.lanes }">
              <div class="g-calendar__availability" aria-hidden="true"><div v-for="(b, i) in r.bands" :key="i" :style="{ '--_start': b.relStart, '--_dur': b.relDur }" /></div>
              <ul class="g-calendar__events" :aria-label="r.res.title + ', ' + dateKey">
                <template v-for="it in r.items" :key="it.id">
                  <li v-if="it.kind === 'block'" class="g-calendar__block" :style="{ '--_start': it.b.relStart, '--_dur': it.b.relDur }"><span aria-hidden="true">{{ it.b.b.reason }}</span><span class="g-calendar__sr">{{ fn('unavailable', time(zoned(dateKey, it.b.from, tz)), time(zoned(dateKey, it.b.to, tz)), it.b.b.reason) }}</span></li>
                  <li v-else :class="{ 'is-selected': selectedId === it.s.ev.id }" :style="{ '--_start': it.s.relStart, '--_dur': it.s.relDur, '--_lane': it.s.lane, '--_lanes': 1 }">
                    <CalendarEvent :seg="it.s" :resource-id="r.res.id" small :selected="selectedId === it.s.ev.id" :tab-stop="effectiveTabStop === it.s.k" :data-key="it.s.k" />
                    <span v-if="!it.s.open && can(it.s.ev, 'resizable')" class="g-calendar__handle" aria-hidden="true" :data-id="it.s.ev.id" />
                  </li>
                </template>
              </ul>
              <div v-if="ghostFor2(r.res.id)" class="g-calendar__ghost" :class="{ 'is-conflict': ghostFor2(r.res.id).conflict }" aria-hidden="true" :style="{ '--_start': ghostFor2(r.res.id).start, '--_dur': ghostFor2(r.res.id).dur }">{{ ghostFor2(r.res.id).label }}</div>
              <button v-if="canCreate" class="g-calendar__create" type="button" @click="createFromKeyboardTimeline(r)">{{ fn('createEvent', r.res.raw, dateKey, '09:00') }}</button>
            </div>
          </li>
          <div v-if="nowRel != null && dateKey === todayKey" class="g-calendar__now" aria-hidden="true" :style="{ '--_start': nowRel }"><GIcon class="g-calendar__now-dot" name="circle" filled /></div>
        </ul>
      </div>

      <!-- Mes -->
      <table v-else-if="viewId === 'month'" class="g-calendar__month" :aria-label="title">
        <thead><tr><th v-for="n in weekdayNames" :key="n" scope="col">{{ n }}</th></tr></thead>
        <tbody>
          <tr v-for="(week, wi) in monthCells" :key="wi">
            <td v-for="c in week" :key="c.key" :class="{ 'is-outside': c.outside, 'is-today': c.today }" :aria-current="c.today ? 'date' : undefined">
              <button class="g-calendar__day" type="button" :data-date="c.key" :aria-label="fn('monthDay', zoned(c.key, 0, tz), c.events.length) || String(Number(c.key.slice(8)))">{{ Number(c.key.slice(8)) }}</button>
              <slot name="month-day" :date="zoned(c.key, 0, tz)" :events="c.events.map((e) => e.raw)" />
              <span class="g-calendar__dots" aria-hidden="true"><template v-if="c.events.length"><GIcon name="circle" filled /> {{ c.events.length }}</template></span>
              <ul class="g-calendar__events">
                <li v-for="e in c.shown" :key="e.id">
                  <CalendarEvent :seg="{ ev: e, start: e.start, end: e.end || e.start, open: !e.end, continuesBefore: false, continuesAfter: false }" :resource-id="e.resources[0]" :data-key="e.id + '|' + c.key" :selected="selectedId === e.id" natural />
                </li>
                <li v-if="c.hidden"><button class="g-calendar__more" type="button" :data-date="c.key" :data-hidden="c.hidden">{{ fn('moreEvents', c.hidden) }}</button></li>
              </ul>
            </td>
          </tr>
        </tbody>
      </table>

      <slot v-if="showEmpty" name="empty"><div class="g-calendar__status" role="status">{{ text('noEvents') }}</div></slot>
    </div>

    <!-- Hoja del día (teléfono) -->
    <div v-if="sheetKey" class="g-calendar__sheet" role="dialog" :aria-label="formatDay(sheetKey, { weekday: 'long', day: 'numeric', month: 'long' }, locale)">
      <button class="g-calendar__sheet-close" type="button" @click="sheetKey = null">{{ text('close') }}</button>
      <ul class="g-calendar__agenda">
        <li v-for="e in sheetEvents" :key="e.id">{{ e.allDay ? text('allDay') : time(e.start) }} · {{ e.title }}</li>
      </ul>
    </div>

    <!-- Detalle del evento seleccionado (slot del consumidor) -->
    <div v-if="selectedEv && slots.detail" class="g-calendar__detail" role="dialog" :aria-label="selectedEv.title" :style="{ '--_x': detailPos.x + 'px', '--_y': detailPos.y + 'px' }" @keydown.esc.stop="closeDetail">
      <slot name="detail" :event="selectedEv.raw" :resource="null" :close="closeDetail" />
    </div>

    <div class="g-calendar__live" aria-live="polite" role="status">{{ liveText }}</div>
  </div>
</template>
