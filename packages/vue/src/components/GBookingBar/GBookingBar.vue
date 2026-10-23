<script setup>
// GBookingBar · la consulta de disponibilidad (dueño: bruno)
// Contrato: design/contracts/booking-bar.md (DECISIONS.md #736 a #742, #744, #745; remates #757, #759) · Estructura:
// design/lab/booking-bar/r01/ (kiwi) · Estilo: GBookingBar.css (coco). Entrada propia @grana/vue/booking (#742).
// Emite INTENCIÓN, no reserva: `submit` con la consulta; envío nativo solo con `action` y sin preventDefault(). Compone:
// GDatePicker (con las noches de #739), GNumberField, GSelect, GRadioGroup, GDialog, GBtn y GPartyField. A · La frase
// (por defecto): la plantilla labels.phrase de la aplicación con un hueco por marcador; refluye como texto (un div, nunca
// un <p>, B-L7). La barra: una fila medida que, si no cabe, pasa a resumen + acción con histéresis, con el cambio fuera de
// la llamada del ResizeObserver (observador compartido: el cuadro siguiente); la hoja (GDialog) lleva los campos en línea.
// B · El muelle (dock): IntersectionObserver, hidden + inert / is-shown en el mismo cuadro, alto de contrato publicado con
// EDGE_ORDER.bookingDock y --_reserve (lo de abajo); no aparece si pasa del cuarto del visor. Valida al enviar, foco al
// primero, anuncio por el canal de página; aislada de un GForm exterior. Sin fetch. Puro (#444).
import { computed, inject, nextTick, onBeforeUnmount, onMounted, provide, reactive, ref, useAttrs, useId, watch } from 'vue'
import GDatePicker from '../GDatePicker/GDatePicker.vue'
import GNumberField from '../GNumberField/GNumberField.vue'
import GSelect from '../GSelect/GSelect.vue'
import GRadioGroup from '../GRadioGroup/GRadioGroup.vue'
import GDialog from '../GDialog/GDialog.vue'
import GBtn from '../GBtn/GBtn.vue'
import GIcon from '../GIcon/GLibIcon.js'
import GPartyField from '../GPartyField/GPartyField.vue'
import { useAnchoredPanel, repeatGesture } from '../GPartyField/panel.js'
import { completeParty, partySummary, validRows } from '../GPartyField/party.js'
import { fieldGroupKey, formKey, layoutKey, spaceUnit } from '../GForm/formContext.js'
import { sectionKey } from '../../utils/sectionKey.js'
import { fill } from '../../utils/template.js'
import { addDays, daysBetween, isISO, todayISO } from '../../utils/dates.js'
import { observeSize } from '../../utils/sizeObserver.js'
import { EDGE_ORDER, clearEdgeReserve, edgeReserve, setEdgeReserve } from '../../utils/edgeReserve.js'
import { acquirePageLive, announcePage } from '../../utils/liveRegion.js'
import { describeQuery, queryFormat } from '../../utils/bookingQuery.js'

defineOptions({ name: 'GBookingBar' })

const KINDS = ['stay', 'table', 'tour']
const SLOTS = { stay: ['from', 'nights', 'party'], table: ['party', 'date', 'time'], tour: ['tour', 'date', 'party'] }

const props = defineProps({
  kind: { type: String, default: 'stay', validator: (v) => ['stay', 'table', 'tour'].includes(v) },
  modelValue: { type: Object, default: null },
  appearance: { type: String, default: 'phrase' },
  dock: Boolean,
  title: { type: String, default: undefined },
  headingLevel: { type: Number, default: undefined },
  partyRows: { type: Array, default: undefined },
  min: { type: String, default: undefined },
  max: { type: String, default: undefined },
  disabledDates: { type: Function, default: undefined },
  disabledNights: { type: Function, default: undefined },
  minNights: { type: Number, default: 1 },
  maxNights: { type: Number, default: undefined },
  times: { type: [Array, Function], default: undefined },
  tours: { type: Array, default: undefined },
  quickDays: { type: Number, default: 0 },
  names: { type: Object, default: () => ({}) },
  pending: Boolean,
  disabled: Boolean,
  locale: { type: String, default: undefined },
  labels: { type: Object, default: () => ({}) },
  id: { type: String, default: undefined }
})
const emit = defineEmits(['update:modelValue', 'submit'])
const attrs = useAttrs()
const uid = useId()
const base = computed(() => props.id || `g-booking-${uid}`)
const kind = computed(() => (KINDS.includes(props.kind) ? props.kind : 'stay'))
const section = inject(sectionKey, null)
const level = computed(() => ([2, 3, 4].includes(props.headingLevel) ? props.headingLevel : section ? section.value.next : 2))
// La consulta se aísla de un GForm exterior (como GDialog, #566)
provide(formKey, null)
provide(layoutKey, null)
provide(fieldGroupKey, null)

const warned = new Set()
const warn = (key, text) => {
  try {
    if (process.env.NODE_ENV !== 'production' && !warned.has(key)) {
      warned.add(key)
      console.warn(`[Grana GBookingBar] ${text}`)
    }
  } catch {}
}
const L = computed(() => props.labels || {})
/** Texto de labels (con ruta `errors.night`); falta → aviso 7 la primera vez que se necesita */
const lab = (path) => {
  let v = L.value
  for (const k of path.split('.')) v = v && typeof v === 'object' ? v[k] : undefined
  if (v === undefined || v === null || v === '') {
    try { if (process.env.NODE_ENV !== 'production') warn(`labels.${path}`, `falta labels.${path} (aviso 7).`) } catch {}
    return ''
  }
  return v
}
const counted = (path, count, vars) => {
  const t = lab(path)
  return typeof t === 'function' ? String(t(count, vars)) : fill(t, vars)
}
const sep = () => (typeof L.value.separator === 'string' ? L.value.separator : lab('separator'))

// ---------- Idioma y formatos ----------
const loc = ref(props.locale)
// Formatos compartidos con describeQuery (utils/bookingQuery.js): las fechas de los huecos y del resumen salen iguales
const fmt = computed(() => queryFormat(loc.value))
const nf = computed(() => fmt.value.nf)
const short = (iso) => fmt.value.short(iso)
const long = (iso) => fmt.value.long(iso)
const today = () => todayISO()
const dayWord = (iso) => fmt.value.day(iso)

// ---------- Modelo (B-L4): la consulta; las noches se derivan ----------
const rows = computed(() => validRows(props.partyRows))
const emptyQuery = () => {
  const party = completeParty(rows.value, {})
  return kind.value === 'stay' ? { from: null, to: null, party } : kind.value === 'table' ? { date: null, time: null, party } : { tour: null, date: null, party }
}
const validShape = (v) => {
  if (!v || typeof v !== 'object') return false
  const dates = kind.value === 'stay' ? ['from', 'to'] : ['date']
  return dates.every((k) => v[k] === null || v[k] === undefined || isISO(v[k]))
}
const local = ref(null)
const query = computed(() => {
  const v = props.modelValue
  const src = v && validShape(v) ? v : local.value || emptyQuery()
  const out = { ...emptyQuery(), ...src }
  out.party = completeParty(rows.value, src.party)
  return out
})
watch(() => props.modelValue, (v) => {
  try { if (process.env.NODE_ENV !== 'production' && v && !validShape(v)) warn('model', `modelValue con forma inválida para kind="${kind.value}": se trata como vacío (aviso 4).`) } catch {}
}, { immediate: true })
const errors = reactive({})
function set(patch) {
  const next = { ...query.value, ...patch }
  local.value = next
  emit('update:modelValue', next)
  for (const k of Object.keys(patch)) clearErr(k)
}
const clearErr = (k) => {
  const map = { from: ['dates', 'night', 'nights'], to: ['dates', 'night', 'nights'], date: ['date'], time: ['time'], tour: ['tour'], party: [] }
  for (const e of map[k] || []) delete errors[e]
}
const nights = computed(() => (query.value.from && query.value.to ? daysBetween(query.value.from, query.value.to) - 1 : null))
// Noches elegidas antes que la llegada (la frase): se aplican al elegirla
const nightsDraft = ref(null)

const callDD = (iso) => Boolean(props.disabledDates && props.disabledDates(iso, query.value))
const callDN = (iso) => Boolean(kind.value === 'stay' && props.disabledNights && props.disabledNights(iso, query.value))
const dpDisabled = computed(() => (props.disabledDates ? callDD : undefined))
const dpNights = computed(() => (props.disabledNights && kind.value === 'stay' ? callDN : undefined))
// Llegada en la frase: una llegada cuya noche está agotada no es elegible (disabledDates ∪ noche agotada)
const arrivalDisabled = computed(() => (props.disabledDates || (props.disabledNights && kind.value === 'stay') ? (iso) => callDD(iso) || callDN(iso) : undefined))
const freeNights = computed(() => {
  const f = query.value.from
  const cap = Number.isInteger(props.maxNights) ? props.maxNights : undefined
  if (!f || !props.disabledNights) return cap
  let n = 0
  for (let d = f; n < (cap ?? 365); d = addDays(d, 1)) { if (callDN(d)) break; n++ }
  return cap === undefined ? (n >= 365 ? undefined : Math.max(n, 1)) : Math.max(Math.min(n, cap), 1)
})
function setNights(n) {
  if (!Number.isInteger(n) || n < 1) return
  nightsDraft.value = n
  if (query.value.from) set({ to: addDays(query.value.from, n) })
}
function setFrom(iso) {
  const n = nights.value ?? nightsDraft.value
  set({ from: iso, to: iso && n ? addDays(iso, n) : null })
}

// ---------- Opciones ----------
const timeList = computed(() => {
  const t = typeof props.times === 'function' ? props.times(query.value.date) : props.times
  return Array.isArray(t) ? t.filter((x) => x && x.value !== undefined) : []
})
const tourList = computed(() => (Array.isArray(props.tours) ? props.tours.filter((x) => x && x.value !== undefined) : []))
const timeLabel = (t) => {
  const base0 = t.label || t.value
  if (!t.disabled) return base0
  const why = typeof t.disabled === 'string' ? t.disabled : lab('full')
  return why ? `${base0}${sep()}${why}` : base0
}
const timeOptions = computed(() => timeList.value.map((t) => ({ value: t.value, label: timeLabel(t), disabled: Boolean(t.disabled) })))
const tourOptions = computed(() => tourList.value.map((t) => ({ value: t.value, label: t.label || String(t.value), description: t.description, disabled: Boolean(t.disabled) })))
const tourOf = (v) => tourList.value.find((t) => t.value === v)
const timeOf = (v) => timeList.value.find((t) => t.value === v)
const quickOptions = computed(() => {
  const n = Number.isInteger(props.quickDays) ? props.quickDays : 0
  const out = []
  let d = props.min && props.min > today() ? props.min : today()
  for (let i = 0; out.length < n && i < n + 60; i++, d = addDays(d, 1)) {
    if (props.max && d > props.max) break
    if (callDD(d)) continue
    out.push({ value: d, label: dayWord(d) })
  }
  return out
})

// ---------- Textos: valores, resumen, salida ----------
const partyText = computed(() => partySummary(rows.value, query.value.party, sep(), nf.value))
const nightsText = (n) => counted('nights', n, { count: nf.value.format(n) })
const slotValue = (slot) => {
  const q = query.value
  if (slot === 'from') return q.from ? short(q.from) : null
  if (slot === 'nights') { const n = nights.value ?? nightsDraft.value; return n ? nightsText(n) : null }
  if (slot === 'party') return partyText.value
  if (slot === 'date') return q.date ? (kind.value === 'table' ? dayWord(q.date) : short(q.date)) : null
  if (slot === 'time') { const t = timeOf(q.time); return t ? t.label || t.value : null }
  if (slot === 'tour') { const t = tourOf(q.tour); return t ? t.label || String(t.value) : null }
  return null
}
// El resumen y la salida salen de describeQuery (utils/bookingQuery.js, #862), la misma que exporta la entrada: los bloques de
// Booking dicen la consulta con estas mismas palabras. Los textos se leen con `lab` al pedirlos (aviso 7 como antes, solo
// de lo que la pieza necesita); `checkout` va aparte para no pedir labels.checkout donde no se pinta.
const qLabels = (withCheckout) => new Proxy({}, { get: (_, k) => (k === 'separator' ? sep() : k === 'checkout' && !withCheckout ? undefined : lab(k)) })
const describe = (withCheckout) => describeQuery({ kind: kind.value, ...query.value }, { partyRows: rows.value, times: timeList.value, tours: tourList.value, locale: loc.value, labels: qLabels(withCheckout) })
const digest = computed(() => describe(false).text)
const checkoutText = computed(() => (kind.value === 'stay' && query.value.from && query.value.to ? describe(true).checkout : ''))

// ---------- Apariencia y plantilla de la frase ----------
const tokens = computed(() => {
  const tpl = L.value.phrase
  if (typeof tpl !== 'string' || !tpl) return null
  const need = SLOTS[kind.value]
  const out = []
  let last = 0
  const seen = new Set()
  for (const m of tpl.matchAll(/\{(\w+)\}/g)) {
    if (m.index > last) out.push({ text: tpl.slice(last, m.index) })
    if (need.includes(m[1]) && !seen.has(m[1])) { out.push({ slot: m[1] }); seen.add(m[1]) }
    else {
      out.push({ text: m[0] })
      try { if (process.env.NODE_ENV !== 'production') warn(`marker:${m[1]}`, `labels.phrase lleva el marcador desconocido {${m[1]}}: se pinta literal (aviso 6).`) } catch {}
    }
    last = m.index + m[0].length
  }
  if (last < tpl.length) out.push({ text: tpl.slice(last) })
  return need.every((s) => seen.has(s)) ? out : null
})
const mode = computed(() => {
  const a = props.appearance === 'bar' ? 'bar' : 'phrase'
  return a === 'phrase' && !tokens.value ? 'bar' : a
})

// ---------- Validación (al enviar, nunca al escribir) ----------
function validate() {
  for (const k of Object.keys(errors)) delete errors[k]
  const q = query.value
  if (kind.value === 'stay') {
    if (!q.from || !q.to) errors.dates = lab('errors.dates')
    else {
      for (let d = q.from; d < q.to; d = addDays(d, 1)) if (callDN(d)) { errors.night = fill(lab('errors.night'), { date: long(d) }); break }
      const n = nights.value
      if (!errors.night && ((Number.isInteger(props.minNights) && n < props.minNights) || (Number.isInteger(props.maxNights) && n > props.maxNights))) errors.nights = lab('errors.nights')
    }
  } else {
    if (kind.value === 'tour' && !q.tour) errors.tour = lab('errors.tour')
    if (!q.date) errors.date = lab('errors.date')
    if (kind.value === 'table' && !q.time) errors.time = lab('errors.time')
  }
  return Object.keys(errors)
}
// El hueco de la frase que lleva cada error
const slotErr = (slot) => {
  if (slot === 'from') return errors.dates && !query.value.from ? errors.dates : ''
  if (slot === 'nights') return errors.night || errors.nights || (errors.dates && query.value.from ? errors.dates : '')
  return errors[slot] || ''
}
const rangeErr = computed(() => errors.dates || errors.night || errors.nights || undefined)
const fieldName = (slot) => lab(`fields.${slot}`)
const errId = (slot) => `${base.value}-err-${slot}`

// ---------- Envío e intención ----------
const formEl = ref(null)
const sheetOpen = ref(false)
const sheetFrom = ref(null)
let releaseLive = null
function focusFirstInvalid(scope) {
  nextTick(() => nextTick(() => {
    const root = scope ? scope() : formEl.value
    if (!root) return
    let el = root.querySelector('[aria-invalid="true"]')
    // Un grupo de radios: su opción elegida o la primera; un mensaje del calendario en línea: su día enfocable
    if (el && !/^(BUTTON|INPUT|SELECT|TEXTAREA)$/.test(el.tagName)) {
      const box = el.closest('.g-booking-bar__field') || el
      el = el.querySelector('input:checked') || el.querySelector('input, button') || box.querySelector('input:checked, [tabindex="0"], input, button') || el
    }
    if (el && typeof el.focus === 'function') el.focus()
  }))
}
// El envío nativo lleva solo los ocultos de la consulta (names): los controles internos (radios de los paneles, etc.) fuera
function onFormdata(event) {
  const keep = new Set(hidden.value.map((x) => x.name))
  for (const k of [...event.formData.keys()]) if (!keep.has(k)) event.formData.delete(k)
}
function onSubmit(event) {
  const hasAction = Boolean(attrs.action)
  const bad = props.disabled ? ['disabled'] : validate()
  if (props.disabled) { event.preventDefault(); return }
  if (bad.length) {
    event.preventDefault()
    const listText = bad.map((k) => (k === 'night' || k === 'nights' || k === 'dates' ? (kind.value === 'stay' ? fieldName('from') : '') : fieldName(k))).filter(Boolean)
    announcePage(counted('missing', bad.length, { count: nf.value.format(bad.length), list: [...new Set(listText)].join(sep()) }))
    if (mode.value === 'bar' && compact.value && !sheetOpen.value) {
      sheetFrom.value = summaryEl.value
      sheetOpen.value = true
      focusFirstInvalid(() => document.getElementById(`${base.value}-sheet`))
    } else focusFirstInvalid(sheetOpen.value ? () => document.getElementById(`${base.value}-sheet`) : null)
    return
  }
  let prevented = false
  const q = query.value
  const payload = { kind: kind.value, ...q, party: { ...q.party }, event, preventDefault() { prevented = true; event.preventDefault() }, get defaultPrevented() { return prevented } }
  if (kind.value === 'stay') payload.nights = nights.value
  emit('submit', payload)
  // Sin action, nunca recarga la página; con action, el GET nativo si la aplicación no lo impidió
  if (!hasAction) event.preventDefault()
  sheetOpen.value = false
}

// ---------- Huecos de la frase ----------
const slotEls = reactive({})
const setSlotEl = (slot) => (el) => { if (el) slotEls[slot] = el }
const panelEls = reactive({})
const panels = {}
for (const k of ['nights', 'time', 'tour', 'quick']) {
  panels[k] = useAnchoredPanel({ panel: () => panelEls[k], anchor: () => slotEls[k === 'quick' ? dateSlot() : k] })
}
const dateSlot = () => (kind.value === 'stay' ? 'from' : 'date')
const dpRefs = reactive({})
function onOwnSlot(e, slot) {
  if (props.disabled || repeatGesture(e)) return
  panels[slot].toggle(e)
}
function onDateSlot(e, scope) {
  if (props.disabled || repeatGesture(e)) return
  if (quickOptions.value.length) { panels.quick.toggle(e); return }
  scope.toggle(e)
}
function otherDay() {
  panels.quick.hide(false)
  const dp = dpRefs[dateSlot()]
  if (dp) nextTick(() => dp.open())
}
const slotAttrs = (slot, extra = {}) => {
  const v = slotValue(slot)
  const err = slotErr(slot)
  const id = `${base.value}-slot-${slot}`
  return {
    id,
    type: 'button',
    class: ['g-booking-bar__slot', v ? 'is-filled' : 'is-empty', { 'is-invalid': Boolean(err) }],
    'aria-haspopup': 'dialog',
    'aria-labelledby': `${id}-l ${id}-v`,
    'aria-invalid': err ? 'true' : undefined,
    'aria-describedby': err ? errId(slot) : undefined,
    disabled: props.disabled || undefined,
    ...extra
  }
}
const slotMessages = computed(() => SLOTS[kind.value].map((s) => ({ slot: s, text: slotErr(s) })).filter((m) => m.text))

// ---------- La barra: forma compacta medida, con histéresis (B-L11) ----------
const compact = ref(false)
const rowEl = ref(null)
const summaryEl = ref(null)
let need = 0
let stopSize = null
function measure() {
  if (mode.value !== 'bar' || !formEl.value) return
  if (!compact.value) {
    const r = rowEl.value
    if (r && r.scrollWidth > r.clientWidth + 1) { need = r.scrollWidth; compact.value = true }
  } else if (formEl.value.clientWidth >= need) {
    compact.value = false
    nextTick(() => { if (typeof requestAnimationFrame === 'function') requestAnimationFrame(measure) })
  }
}
watch([digest, mode], () => nextTick(measure))
function openSheet(e) {
  if (props.disabled || repeatGesture(e)) return
  sheetFrom.value = e && e.currentTarget
  sheetOpen.value = true
}

// ---------- B · El muelle ----------
const docked = ref(false)
const budgetOk = ref(true)
const reserveBelow = computed(() => edgeReserve('bottom', { before: EDGE_ORDER.bookingDock, except: dockOwner }))
const dockOwner = {}
const dockH = () => {
  const u = spaceUnit(formEl.value)
  return Math.max(u * 16, 44 + u * 4)
}
const shown = computed(() => props.dock && docked.value && budgetOk.value)
function checkBudget() {
  if (typeof window === 'undefined') return
  budgetOk.value = dockH() + reserveBelow.value <= window.innerHeight / 4
}
watch(shown, (on) => {
  if (on) setEdgeReserve(dockOwner, 'bottom', dockH(), { order: EDGE_ORDER.bookingDock })
  else clearEdgeReserve(dockOwner)
})
watch(reserveBelow, checkBudget)
let io = null
const onResize = () => checkBudget()
function startDock() {
  if (!props.dock || io || typeof IntersectionObserver === 'undefined' || !formEl.value) return
  io = new IntersectionObserver((entries) => {
    for (const e of entries) docked.value = !e.isIntersecting && e.boundingClientRect.bottom <= 0
  })
  io.observe(formEl.value)
  window.addEventListener('resize', onResize)
  checkBudget()
}
function stopDock() {
  if (io) { io.disconnect(); io = null }
  if (typeof window !== 'undefined') window.removeEventListener('resize', onResize)
  docked.value = false
  clearEdgeReserve(dockOwner)
}
watch(() => props.dock, (on) => { if (on) nextTick(startDock); else stopDock() })

onMounted(() => {
  if (!props.locale) {
    const near = formEl.value && formEl.value.parentElement && formEl.value.parentElement.closest('[lang]')
    loc.value = (near && near.getAttribute('lang')) || document.documentElement.lang || undefined
  }
  releaseLive = acquirePageLive()
  if (formEl.value) stopSize = observeSize(formEl.value, measure)
  nextTick(measure)
  startDock()
  try {
    if (process.env.NODE_ENV !== 'production') {
      if (formEl.value && formEl.value.parentElement && formEl.value.parentElement.closest('form')) warn('nested', 'está dentro de otro <form>: los formularios anidados no son válidos (aviso 5).')
    }
  } catch {}
})
watch(() => props.locale, (v) => { if (v) loc.value = v })
onBeforeUnmount(() => {
  if (releaseLive) releaseLive()
  if (stopSize) stopSize()
  stopDock()
})

// Avisos de props
watch(() => [props.title, props.partyRows, props.kind, props.times, props.tours, props.appearance, props.disabledNights, props.minNights, props.maxNights, props.labels], () => {
  try {
    if (process.env.NODE_ENV !== 'production') {
      if (!(typeof props.title === 'string' && props.title.trim())) warn('title', 'falta title (aviso 1).')
      if (!Array.isArray(props.partyRows) || !props.partyRows.length) warn('rows', 'falta partyRows (aviso 2).')
      if (kind.value === 'table' && !props.times) warn('times', 'kind="table" sin times (aviso 3).')
      if (kind.value === 'tour' && !props.tours) warn('tours', 'kind="tour" sin tours (aviso 3).')
      if (props.appearance === 'guided') warn('guided', 'appearance="guided" está reservada: se pinta como phrase (aviso 9).')
      if (props.appearance !== 'bar' && !tokens.value) warn('phrase', `appearance="phrase" sin labels.phrase o sin uno de los marcadores de kind="${kind.value}" (${SLOTS[kind.value].map((s) => `{${s}}`).join(' ')}): se pinta como bar (aviso 6).`)
      if (kind.value !== 'stay' && (props.disabledNights || props.minNights !== 1 || props.maxNights !== undefined)) warn('nights', 'disabledNights, minNights y maxNights solo valen con kind="stay" (aviso 8).')
    }
  } catch {}
}, { immediate: true })

// ---------- Marcado ----------
const titleId = computed(() => `${base.value}-title`)
const digestId = computed(() => `${base.value}-digest`)
const hidden = computed(() => {
  const n = props.names || {}
  const name = (k) => n[k] ?? k
  const q = query.value
  const out = []
  if (kind.value === 'stay') out.push({ name: name('from'), value: q.from || '' }, { name: name('to'), value: q.to || '' })
  if (kind.value === 'tour') out.push({ name: name('tour'), value: q.tour ?? '' })
  if (kind.value !== 'stay') out.push({ name: name('date'), value: q.date || '' })
  if (kind.value === 'table') out.push({ name: name('time'), value: q.time ?? '' })
  if (n.nights && kind.value === 'stay') out.push({ name: n.nights, value: nights.value ?? '' })
  for (const r of rows.value) out.push({ name: `${name('party')}[${r.key}]`, value: String(q.party[r.key]) })
  return out
})
const classes = computed(() => ['g-booking-bar', `g-booking-bar--appearance-${mode.value}`, `g-booking-bar--kind-${kind.value}`, { 'is-compact': mode.value === 'bar' && compact.value, 'is-disabled': props.disabled }])
const dpLabels = computed(() => (L.value.datePicker && typeof L.value.datePicker === 'object' ? L.value.datePicker : {}))
const partyLabels = computed(() => ({ done: L.value.done, separator: typeof L.value.separator === 'string' ? L.value.separator : undefined }))
const submitBind = computed(() => ({ class: 'g-booking-bar__submit', type: 'submit', loading: props.pending, loadingText: props.pending ? L.value.pending : undefined, disabled: props.disabled, 'aria-describedby': digestId.value }))
const rangeModel = computed(() => (query.value.from && query.value.to ? { start: query.value.from, end: query.value.to } : null))
const onRange = (v) => set(v && v.start ? { from: v.start, to: v.end } : { from: null, to: null })
</script>

<template>
  <form ref="formEl" :class="classes" role="search" :aria-labelledby="titleId" novalidate @submit="onSubmit" @formdata="onFormdata">
    <component :is="`h${level}`" :id="titleId" class="g-booking-bar__title" dir="auto">{{ title }}</component>
    <input v-for="h in hidden" :key="h.name" type="hidden" :name="h.name" :value="h.value">

    <!-- A · La frase -->
    <template v-if="mode === 'phrase'">
      <div class="g-booking-bar__phrase" dir="auto">
        <template v-for="(t, i) in tokens" :key="i">
          <template v-if="t.text !== undefined">{{ t.text }}</template>
          <GDatePicker
            v-else-if="t.slot === 'from' || t.slot === 'date'"
            :ref="(c) => { if (c) dpRefs[t.slot] = c }"
            :model-value="query[t.slot]"
            :min="min"
            :max="max"
            :disabled-dates="t.slot === 'from' ? arrivalDisabled : dpDisabled"
            :locale="loc"
            :labels="dpLabels"
            :disabled="disabled || undefined"
            :anchor="slotEls[t.slot]"
            :summary="false"
            @update:model-value="(v) => (t.slot === 'from' ? setFrom(v) : set({ date: v }))"
          >
            <template #trigger="s">
              <button :ref="setSlotEl(t.slot)" v-bind="slotAttrs(t.slot, { 'aria-expanded': String(s.expanded || panels.quick.open.value), 'aria-controls': quickOptions.length ? `${base}-panel-quick` : s.controls })" @click="onDateSlot($event, s)">
                <span :id="`${base}-slot-${t.slot}-l`" class="g-booking-bar__slot-label">{{ fieldName(t.slot) }}</span>
                <span :id="`${base}-slot-${t.slot}-v`" class="g-booking-bar__slot-value" dir="auto">{{ slotValue(t.slot) || lab(`empty.${t.slot}`) }}</span>
                <GIcon name="chevron-down" />
              </button>
            </template>
          </GDatePicker>
          <GPartyField
            v-else-if="t.slot === 'party'"
            :model-value="query.party"
            :rows="partyRows"
            :label="fieldName('party')"
            :labels="partyLabels"
            :locale="loc"
            :disabled="disabled || undefined"
            @update:model-value="(v) => set({ party: v })"
          >
            <template #trigger="s">
              <button :ref="setSlotEl('party')" v-bind="slotAttrs('party', { 'aria-expanded': String(s.expanded), 'aria-controls': s.controls })" @click="(e) => { if (!disabled && !repeatGesture(e)) s.toggle(e) }">
                <span :id="`${base}-slot-party-l`" class="g-booking-bar__slot-label">{{ fieldName('party') }}</span>
                <span :id="`${base}-slot-party-v`" class="g-booking-bar__slot-value" dir="auto">{{ slotValue('party') }}</span>
                <GIcon name="chevron-down" />
              </button>
            </template>
          </GPartyField>
          <template v-else>
            <button :ref="setSlotEl(t.slot)" v-bind="slotAttrs(t.slot, { 'aria-expanded': String(panels[t.slot].open.value), 'aria-controls': `${base}-panel-${t.slot}` })" @click="onOwnSlot($event, t.slot)">
              <span :id="`${base}-slot-${t.slot}-l`" class="g-booking-bar__slot-label">{{ fieldName(t.slot) }}</span>
              <span :id="`${base}-slot-${t.slot}-v`" class="g-booking-bar__slot-value" dir="auto">{{ slotValue(t.slot) || lab(`empty.${t.slot}`) }}</span>
              <GIcon name="chevron-down" />
            </button>
          </template>
        </template>
        <!-- Paneles propios de los huecos (capa superior; dentro de la frase, que es un div) -->
        <div v-if="SLOTS[kind].includes('nights')" :id="`${base}-panel-nights`" :ref="(el) => { panelEls.nights = el }" class="g-booking-bar__slot-panel" role="dialog" :aria-label="fieldName('nights')" popover="manual">
          <GNumberField
            :model-value="nights ?? nightsDraft"
            :label="fieldName('nights')"
            :min="Number.isInteger(minNights) ? minNights : 1"
            :max="freeNights"
            steppers
            block
            :decrement-label="lab('decrement')"
            :increment-label="lab('increment')"
            :locale="loc"
            @update:model-value="setNights"
          />
          <p v-if="checkoutText" class="g-booking-bar__checkout">{{ checkoutText }}</p>
          <GBtn variant="outline" color="neutral" size="sm" class="g-booking-bar__done" @click="panels.nights.hide(true)">{{ lab('done') }}</GBtn>
        </div>
        <div v-if="SLOTS[kind].includes('time')" :id="`${base}-panel-time`" :ref="(el) => { panelEls.time = el }" class="g-booking-bar__slot-panel" role="dialog" :aria-label="fieldName('time')" popover="manual">
          <GRadioGroup :model-value="query.time" :options="timeOptions" appearance="chip" :name="`${base}-time`" :label="fieldName('time')" :field="false" @update:model-value="(v) => set({ time: v })" />
          <GBtn variant="outline" color="neutral" size="sm" class="g-booking-bar__done" @click="panels.time.hide(true)">{{ lab('done') }}</GBtn>
        </div>
        <div v-if="SLOTS[kind].includes('tour')" :id="`${base}-panel-tour`" :ref="(el) => { panelEls.tour = el }" class="g-booking-bar__slot-panel" role="dialog" :aria-label="fieldName('tour')" popover="manual">
          <GRadioGroup :model-value="query.tour" :options="tourOptions" appearance="list" :name="`${base}-tour`" :label="fieldName('tour')" :field="false" @update:model-value="(v) => set({ tour: v })" />
          <GBtn variant="outline" color="neutral" size="sm" class="g-booking-bar__done" @click="panels.tour.hide(true)">{{ lab('done') }}</GBtn>
        </div>
        <div v-if="quickOptions.length" :id="`${base}-panel-quick`" :ref="(el) => { panelEls.quick = el }" class="g-booking-bar__slot-panel" role="dialog" :aria-label="fieldName(dateSlot())" popover="manual">
          <GRadioGroup :model-value="query[dateSlot()]" :options="quickOptions" appearance="chip" :name="`${base}-quick`" :label="fieldName(dateSlot())" :field="false" @update:model-value="(v) => (dateSlot() === 'from' ? setFrom(v) : set({ date: v }))" />
          <GBtn variant="outline" color="neutral" size="sm" class="g-booking-bar__other" @click="otherDay">{{ lab('otherDay') }}</GBtn>
        </div>
      </div>
      <p v-if="checkoutText" class="g-booking-bar__checkout">{{ checkoutText }}</p>
      <ul class="g-booking-bar__messages"><li v-for="m in slotMessages" :id="errId(m.slot)" :key="m.slot"><GIcon name="circle-alert" />{{ m.text }}</li></ul>
      <GBtn v-bind="submitBind">{{ lab('submit') }}</GBtn>
    </template>

    <!-- La barra -->
    <template v-else>
      <div v-if="!compact" ref="rowEl" class="g-booking-bar__row">
        <template v-if="kind === 'stay'">
          <div class="g-booking-bar__field">
            <GDatePicker mode="range" split block :model-value="rangeModel" :label-start="fieldName('from')" :label-end="fieldName('to')" :min="min" :max="max" :disabled-dates="dpDisabled" :disabled-nights="dpNights" :min-nights="minNights" :max-nights="maxNights" :locale="loc" :labels="dpLabels" :error="rangeErr" :disabled="disabled || undefined" @update:model-value="onRange" />
          </div>
        </template>
        <div v-if="kind === 'tour'" class="g-booking-bar__field">
          <GSelect block :model-value="query.tour" :options="tourOptions" :label="fieldName('tour')" :error="errors.tour" :disabled="disabled || undefined" @update:model-value="(v) => set({ tour: v })" />
        </div>
        <div v-if="kind !== 'stay'" class="g-booking-bar__field">
          <GDatePicker block :model-value="query.date" :label="fieldName('date')" :min="min" :max="max" :disabled-dates="dpDisabled" :locale="loc" :labels="dpLabels" :error="errors.date" :disabled="disabled || undefined" @update:model-value="(v) => set({ date: v })" />
        </div>
        <div v-if="kind === 'table'" class="g-booking-bar__field">
          <GSelect block :model-value="query.time" :options="timeOptions" :label="fieldName('time')" :error="errors.time" :disabled="disabled || undefined" @update:model-value="(v) => set({ time: v })" />
        </div>
        <div class="g-booking-bar__field">
          <GPartyField block :model-value="query.party" :rows="partyRows" :label="fieldName('party')" :labels="partyLabels" :locale="loc" :disabled="disabled || undefined" @update:model-value="(v) => set({ party: v })" />
        </div>
        <GBtn v-bind="submitBind">{{ lab('submit') }}</GBtn>
      </div>
      <div v-else class="g-booking-bar__compact">
        <button ref="summaryEl" type="button" class="g-booking-bar__summary" aria-haspopup="dialog" :aria-expanded="sheetOpen ? 'true' : 'false'" :disabled="disabled || undefined" @click="openSheet">
          <span class="g-booking-bar__summary-title">{{ lab('summaryTitle') }}</span>
          <span class="g-booking-bar__summary-text" dir="auto">{{ digest }}</span>
          <span class="g-booking-bar__summary-change">{{ lab('change') }}</span>
        </button>
        <GBtn v-bind="submitBind">{{ lab('submit') }}</GBtn>
      </div>
    </template>

    <p :id="digestId" class="g-booking-bar__digest" dir="auto">{{ digest }}</p>

    <!-- La hoja (compacto y muelle): los mismos campos en línea; en un modal no se abre otro popover -->
    <GDialog v-if="mode === 'bar' || dock" :id="`${base}-sheet`" v-model="sheetOpen" class="g-booking-bar__sheet" :title="title" :close-label="lab('close')" :from="sheetFrom || undefined">
      <div v-if="kind === 'tour'" class="g-booking-bar__field">
        <GRadioGroup :model-value="query.tour" :options="tourOptions" appearance="list" :name="`${base}-sheet-tour`" :label="fieldName('tour')" :error="errors.tour" @update:model-value="(v) => set({ tour: v })" />
      </div>
      <div class="g-booking-bar__field" role="group" :aria-label="kind === 'stay' ? `${fieldName('from')}${sep()}${fieldName('to')}` : fieldName('date')">
        <GDatePicker v-if="kind === 'stay'" inline mode="range" :months="1" :model-value="rangeModel" :min="min" :max="max" :disabled-dates="dpDisabled" :disabled-nights="dpNights" :min-nights="minNights" :max-nights="maxNights" :locale="loc" :labels="dpLabels" :disabled="disabled || undefined" @update:model-value="onRange" />
        <GDatePicker v-else inline :months="1" :model-value="query.date" :min="min" :max="max" :disabled-dates="dpDisabled" :locale="loc" :labels="dpLabels" :disabled="disabled || undefined" @update:model-value="(v) => set({ date: v })" />
        <p v-if="rangeErr && kind === 'stay'" class="g-booking-bar__checkout" :aria-invalid="'true'">{{ rangeErr }}</p>
        <p v-else-if="errors.date" class="g-booking-bar__checkout">{{ errors.date }}</p>
      </div>
      <div v-if="kind === 'table'" class="g-booking-bar__field">
        <GRadioGroup :model-value="query.time" :options="timeOptions" appearance="chip" :name="`${base}-sheet-time`" :label="fieldName('time')" :error="errors.time" @update:model-value="(v) => set({ time: v })" />
      </div>
      <div class="g-booking-bar__field">
        <GPartyField mode="inline" :model-value="query.party" :rows="partyRows" :label="fieldName('party')" :labels="partyLabels" :locale="loc" :disabled="disabled || undefined" @update:model-value="(v) => set({ party: v })" />
      </div>
      <template #footer>
        <GBtn v-bind="submitBind">{{ lab('submit') }}</GBtn>
      </template>
    </GDialog>

    <!-- B · El muelle -->
    <div v-if="dock" class="g-booking-bar__dock" :class="{ 'is-shown': shown }" :hidden="!shown || undefined" :inert="!shown || undefined" :style="{ '--_reserve': `${reserveBelow}px` }">
      <p class="g-booking-bar__dock-summary" dir="auto">{{ digest }}</p>
      <GBtn class="g-booking-bar__dock-change" variant="outline" color="neutral" :disabled="disabled" @click="openSheet">{{ lab('change') }}</GBtn>
      <GBtn v-bind="submitBind">{{ lab('submit') }}</GBtn>
    </div>
  </form>
</template>
