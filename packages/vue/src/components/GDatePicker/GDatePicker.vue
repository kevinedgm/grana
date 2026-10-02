<script setup>
// GDatePicker · selector de una fecha o de un rango (dueño: bruno)
// Contrato: design/contracts/datepicker.md · Estructura: design/lab/datepicker/r01/ · Estilo: GDatePicker.css (coco)
// Patrón: date picker dialog (WAI-ARIA APG). Cada mes es un grid; un solo tabstop (tabindex móvil) y un
// nombre completo por día. El valor es una cadena ISO (YYYY-MM-DD) o { start, end }; solo se emiten valores completos.
import { computed, mergeProps, nextTick, onBeforeUnmount, onMounted, ref, useAttrs, useId, useSlots, watch } from 'vue'
import { oneOf } from '../../utils/oneOf.js'
import GIcon from '../GIcon/GLibIcon.js'
import { messageIcon, useFormField } from '../GForm/formContext.js'
import { addDays, addMonths, daysBetween, daysInMonth, firstOfMonth, isISO, monthKey, parseISO, todayISO, weekday } from '../../utils/dates.js'

defineOptions({ name: 'GDatePicker', inheritAttrs: false })

const props = defineProps({
  modelValue: { type: [String, Object], default: null },
  mode: { type: String, default: 'single', validator: oneOf(['single', 'range']) },
  inline: Boolean,
  open: Boolean,
  min: { type: String, default: undefined },
  max: { type: String, default: undefined },
  disabledDates: { type: Function, default: undefined },
  months: { type: [String, Number], default: 'auto', validator: (v) => v === 'auto' || v === 1 || v === 2 || v === '1' || v === '2' },
  locale: { type: String, default: undefined },
  firstDay: { type: Number, default: undefined, validator: (v) => Number.isInteger(v) && v >= 0 && v <= 6 },
  labels: { type: Object, default: () => ({}) },
  proximity: { type: Array, default: () => [] },
  summary: { type: Boolean, default: true },
  closeOnSelect: { type: Boolean, default: undefined },
  anchor: { type: [String, Object], default: undefined },
  color: { type: String, default: 'brand', validator: oneOf(['brand', 'accent', 'neutral', 'success', 'warning', 'danger', 'info']) },
  variant: { type: String, default: 'outline', validator: oneOf(['outline', 'soft']) },
  size: { type: String, default: 'md', validator: oneOf(['xs', 'sm', 'md', 'lg', 'xl']) },
  // density, block, disabled, readonly y error sin valor por defecto: la prop explícita gana al contexto de GForm (form.md §2)
  density: { type: String, default: undefined, validator: oneOf(['default', 'comfortable', 'compact']) },
  rounded: { type: String, default: undefined, validator: oneOf(['none', 'xs', 'sm', 'md', 'lg', 'xl', 'pill']) },
  block: { type: Boolean, default: undefined },
  disabled: { type: Boolean, default: undefined },
  readonly: { type: Boolean, default: undefined },
  label: { type: String, default: undefined },
  hint: { type: String, default: undefined },
  error: { type: String, default: undefined },
  warning: { type: String, default: undefined },
  valid: { type: String, default: undefined },
  mark: { type: Boolean, default: undefined },
  placeholder: { type: String, default: undefined },
  required: Boolean,
  name: { type: String, default: undefined },
  id: { type: String, default: undefined },
  split: Boolean,
  labelStart: { type: String, default: undefined },
  labelEnd: { type: String, default: undefined },
  placeholderStart: { type: String, default: undefined },
  placeholderEnd: { type: String, default: undefined },
  // Valor calculado por la aplicación (form.md C14, #180): <output> tras la fecha, dentro de la caja; no se envía
  output: { type: String, default: undefined }
})

// Solo estos eventos se declaran: el resto llega al botón del campo por $attrs.
const emit = defineEmits(['update:modelValue', 'change', 'start', 'navigate', 'update:open', 'open', 'close'])

const attrs = useAttrs()
const slots = useSlots()
const uid = useId()
const baseId = computed(() => props.id || `g-datepicker-${uid}`)
const popId = computed(() => `${baseId.value}-pop`)
const labelId = computed(() => `${baseId.value}-label`)
const hintId = computed(() => `${baseId.value}-hint`)
const outputId = computed(() => `${baseId.value}-output`)
// Contexto de GForm (form.md §2). Con inline solo lee readonly y disabled (C1). Al elegir un valor completo llama a
// notifyChange() (C9): revela al cambiar y marca sucio.
const ff = useFormField({
  id: baseId,
  name: () => (props.inline ? undefined : props.name),
  error: () => props.error,
  warning: () => props.warning,
  valid: () => props.valid,
  required: () => props.required,
  readonly: () => props.readonly,
  disabled: () => props.disabled,
  density: () => (props.inline ? props.density ?? 'default' : props.density),
  block: () => (props.inline ? props.block ?? false : props.block),
  mark: () => props.mark,
  trigger: 'change',
  control: () => fieldEls.value[0] || null,
  root: () => root.value
})
const isDisabled = ff.disabled
const isReadonly = ff.readonly
const message = ff.message
const monthId = (i) => `${baseId.value}-m${i}`

const isDev = typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production'
const warned = new Set()
const warnOnce = (key, msg) => {
  if (!isDev || warned.has(key)) return
  warned.add(key)
  console.warn(`[Grana] <GDatePicker> ${msg}`)
}

const isRange = computed(() => props.mode === 'range')
const hasTriggerSlot = computed(() => !props.inline && Boolean(slots.trigger))
const L = computed(() => props.labels || {})

// ---------- Idioma ----------
const locale = computed(() => props.locale || (typeof document !== 'undefined' && document.documentElement.lang) || (typeof navigator !== 'undefined' && navigator.language) || 'en')
const fdow = computed(() => {
  if (props.firstDay !== undefined) return props.firstDay
  try {
    const loc = new Intl.Locale(locale.value)
    const info = typeof loc.getWeekInfo === 'function' ? loc.getWeekInfo() : loc.weekInfo
    if (info && info.firstDay) return info.firstDay % 7
  } catch { /* sin soporte: lunes */ }
  return 1
})
const dtf = (opts) => new Intl.DateTimeFormat(locale.value, opts)
const fmtFull = computed(() => dtf({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }))
const fmtShort = computed(() => dtf({ day: 'numeric', month: 'short', year: 'numeric' }))
const fmtMonth = computed(() => dtf({ month: 'long' }))
const fmtWdNarrow = computed(() => dtf({ weekday: 'narrow' }))
const fmtWdLong = computed(() => dtf({ weekday: 'long' }))
const nf = computed(() => new Intl.NumberFormat(locale.value, { useGrouping: false }))
const full = (iso) => fmtFull.value.format(parseISO(iso))
const short = (iso) => fmtShort.value.format(parseISO(iso))
const rangeText = (a, b) => {
  if (a === b) return short(a)
  const f = fmtShort.value
  return typeof f.formatRange === 'function' ? f.formatRange(parseISO(a), parseISO(b)) : `${short(a)} – ${short(b)}`
}
const fill = (tpl, vars) => (typeof tpl === 'string' ? tpl.replace(/\{(date|start|end|days)\}/g, (_, k) => String(vars[k] ?? '')) : '')

// ---------- Valor ----------
const normalized = computed(() => {
  const v = props.modelValue
  if (v === null || v === undefined || v === '') return { start: null, end: null }
  if (!isRange.value) {
    if (typeof v === 'string' && isISO(v)) return { start: v, end: null }
    warnOnce('value', `modelValue inválido para mode="single": se esperaba una cadena ISO YYYY-MM-DD (llegó ${JSON.stringify(v)}).`)
    return { start: null, end: null }
  }
  if (typeof v === 'object' && isISO(v.start) && isISO(v.end) && v.start <= v.end) return { start: v.start, end: v.end }
  warnOnce('value', `modelValue inválido para mode="range": se esperaba { start, end } ISO con start ≤ end (llegó ${JSON.stringify(v)}).`)
  return { start: null, end: null }
})
const hasValue = computed(() => Boolean(normalized.value.start))

// Estado interno
const pending = ref(null) // inicio de rango elegido y aún sin fin
const hover = ref(null)
const view = ref(firstOfMonth(normalized.value.start || todayISO()))
const focusDate = ref(normalized.value.start || todayISO())
const n = ref(props.months === 2 || props.months === '2' ? 2 : 1)
const announcement = ref('')

const fieldText = computed(() => {
  const { start, end } = normalized.value
  if (!start) return ''
  return isRange.value ? rangeText(start, end) : short(start)
})

// ---------- Disponibilidad ----------
const unavailable = (iso) => Boolean((props.min && iso < props.min) || (props.max && iso > props.max) || (props.disabledDates && props.disabledDates(iso)))

// ---------- Rango efectivo (con vista previa mientras se elige el final) ----------
const eff = computed(() => {
  if (!isRange.value) return { a: null, b: null, preview: false }
  if (pending.value) {
    if (hover.value && hover.value >= pending.value) return { a: pending.value, b: hover.value, preview: true }
    return { a: pending.value, b: pending.value, preview: false }
  }
  const { start, end } = normalized.value
  return start ? { a: start, b: end, preview: false } : { a: null, b: null, preview: false }
})

// ---------- Meses y cuadrícula ----------
const weekdays = computed(() => {
  const out = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(2024, 0, 7 + ((fdow.value + i) % 7)) // 2024-01-07 es domingo
    out.push({ narrow: fmtWdNarrow.value.format(d), long: fmtWdLong.value.format(d) })
  }
  return out
})
const grid = computed(() => {
  const out = []
  const today = todayISO()
  for (let i = 0; i < n.value; i++) {
    const first = addMonths(view.value, i)
    const lead = (weekday(first) - fdow.value + 7) % 7
    const total = daysInMonth(first)
    const d0 = parseISO(first)
    const weeks = []
    for (let r = 0; r < 6; r++) {
      const cells = []
      for (let c = 0; c < 7; c++) {
        const idx = r * 7 + c - lead
        const iso = addDays(first, idx)
        const inMonth = idx >= 0 && idx < total
        const cell = { iso, day: parseISO(iso).getDate(), inMonth, render: inMonth || n.value === 1, col: c, last: inMonth && idx === total - 1, first: inMonth && idx === 0 }
        if (cell.render) {
          cell.st = dayState(cell, today)
          cell.label = dayLabel(cell, cell.st)
          cell.sel = cellSelected(cell)
        }
        cells.push(cell)
      }
      weeks.push(cells)
    }
    out.push({ key: first, first, index: i, name: fmtMonth.value.format(d0), year: d0.getFullYear(), weeks })
  }
  return out
})
const tabbable = computed(() => {
  for (const m of grid.value) for (const w of m.weeks) for (const c of w) if (c.render && c.iso === focusDate.value) return focusDate.value
  return grid.value[0].first
})

function dayState(cell, today) {
  const { a, b, preview } = eff.value
  const iso = cell.iso
  const range = isRange.value
  const single = !range
  const start = normalized.value.start
  const selectedSingle = single && iso === start
  const isStart = Boolean(range && a && iso === a && a !== b)
  const isEnd = Boolean(range && a && iso === b && a !== b)
  const same = Boolean(range && a && a === b && iso === a) // inicio = fin, o inicio pendiente sin fin
  const inBand = Boolean(range && a && a !== b && iso >= a && iso <= b)
  const multi = n.value > 1
  const dis = unavailable(iso)
  const circle = single ? selectedSingle : Boolean(a && (iso === a || (iso === b && !preview)))
  const cs = inBand && (cell.col === 0 || (multi && cell.first))
  const ce = inBand && (cell.col === 6 || (multi && cell.last))
  return {
    selected: Boolean(circle),
    today: iso === today,
    disabled: dis,
    outside: !cell.inMonth,
    inactive: Boolean(pending.value && iso < pending.value && !dis && cell.inMonth),
    isStart, isEnd, same, inBand, preview: Boolean(inBand && preview),
    capStart: Boolean(cs && !isStart), capEnd: Boolean(ce && !isEnd)
  }
}

function dayLabel(cell, st) {
  let t = full(cell.iso)
  const l = L.value
  const add = (s) => { if (s) t += `, ${s}` }
  if (st.today) add(l.today)
  if (!isRange.value) {
    if (cell.iso === normalized.value.start) add(l.selected)
  } else if (!eff.value.preview) {
    const { a, b } = eff.value
    if (a && cell.iso === a && cell.iso === b) add(l.rangeSingle)
    else if (a && cell.iso === a) add(l.rangeStart)
    else if (a && cell.iso === b) add(l.rangeEnd)
    else if (a && b && cell.iso > a && cell.iso < b && !pending.value) add(l.inRange)
  } else if (cell.iso === eff.value.a) add(l.rangeStart)
  if (st.disabled) add(l.unavailable)
  return t
}
const cellSelected = (cell) => {
  const { a, b, preview } = eff.value
  if (!isRange.value) return cell.iso === normalized.value.start
  return Boolean(a && cell.iso >= a && cell.iso <= b && !preview && !pending.value)
}

// ---------- Selección ----------
function say(text) {
  announcement.value = ''
  nextTick(() => { announcement.value = text })
}

function emitValue(value) {
  emit('update:modelValue', value)
  emit('change', value)
  ff.notifyChange()
}

const shouldClose = computed(() => (props.closeOnSelect !== undefined ? props.closeOnSelect : (!isRange.value || props.proximity.length === 0)))
const interactive = computed(() => !isDisabled.value && !isReadonly.value)

function pick(iso) {
  if (!interactive.value || unavailable(iso)) return
  focusDate.value = iso
  if (!isRange.value) {
    emitValue(iso)
    say(fill(L.value.announceDate, { date: full(iso) }))
    afterPick(true, iso)
    return
  }
  if (!pending.value) {
    pending.value = iso
    hover.value = null
    emit('start', { date: iso })
    say(fill(L.value.announceStart, { date: full(iso) }))
    afterPick(false, iso)
  } else if (iso < pending.value) {
    pending.value = iso
    emit('start', { date: iso })
    say(fill(L.value.announceStart, { date: full(iso) }))
    afterPick(false, iso)
  } else {
    const start = pending.value
    pending.value = null
    hover.value = null
    emitValue({ start, end: iso })
    say(fill(L.value.announceEnd, { start: full(start), end: full(iso), days: daysBetween(start, iso) }))
    afterPick(true, iso)
  }
}

function afterPick(complete, iso) {
  if (n.value === 1 && monthKey(iso) !== monthKey(view.value)) setView(firstOfMonth(iso))
  else ensureVisible(iso)
  nextTick(focusDay)
  if (complete && !props.inline && shouldClose.value) nextTick(() => close(true))
}

function widen(days) {
  if (!interactive.value || !isRange.value || pending.value || !normalized.value.start) return
  let a = addDays(normalized.value.start, -days)
  let b = addDays(normalized.value.end, days)
  if (props.min && a < props.min) a = props.min
  if (props.max && b > props.max) b = props.max
  emitValue({ start: a, end: b })
  say(fill(L.value.announceWiden, { start: full(a), end: full(b), days: daysBetween(a, b) }))
}

function clearValue() {
  if (!interactive.value) return
  pending.value = null
  hover.value = null
  emitValue(null)
  say(L.value.announceClear || '')
}

// ---------- Vista, foco y navegación ----------
function setView(first, { announce = true } = {}) {
  if (first === view.value) return
  view.value = first
  if (announce) emit('navigate', { month: monthKey(first) })
}
function lastVisibleDay() {
  const last = addMonths(view.value, n.value - 1)
  return addDays(firstOfMonth(last), daysInMonth(last) - 1)
}
function ensureVisible(iso) {
  if (iso < view.value) setView(firstOfMonth(iso))
  else if (iso > lastVisibleDay()) setView(firstOfMonth(addMonths(iso, -(n.value - 1))))
}
function go(step) {
  setView(addMonths(view.value, step))
  focusDate.value = addMonths(focusDate.value, step)
}

const surfaceEl = ref(null)
const root = ref(null)
function focusDay() {
  const el = surfaceEl.value?.querySelector(`[data-date="${tabbable.value}"]`)
  el?.focus()
}

function onGridKeydown(event) {
  const btn = event.target.closest?.('.g-datepicker__day')
  if (!btn) return
  const k = event.key
  const rtl = surfaceEl.value && getComputedStyle(surfaceEl.value).direction === 'rtl'
  const f = tabbable.value
  let t = null
  if (k === 'ArrowLeft') t = addDays(f, rtl ? 1 : -1)
  else if (k === 'ArrowRight') t = addDays(f, rtl ? -1 : 1)
  else if (k === 'ArrowUp') t = addDays(f, -7)
  else if (k === 'ArrowDown') t = addDays(f, 7)
  else if (k === 'Home') t = addDays(f, -((weekday(f) - fdow.value + 7) % 7))
  else if (k === 'End') t = addDays(f, 6 - ((weekday(f) - fdow.value + 7) % 7))
  else if (k === 'PageUp') t = addMonths(f, event.shiftKey ? -12 : -1)
  else if (k === 'PageDown') t = addMonths(f, event.shiftKey ? 12 : 1)
  if (t) {
    event.preventDefault()
    focusDate.value = t
    ensureVisible(t)
    nextTick(focusDay)
  }
}
function onGridClick(event) {
  const b = event.target.closest?.('.g-datepicker__day')
  if (b) pick(b.dataset.date)
}
function onDayFocus(iso) {
  focusDate.value = iso
  if (pending.value) hover.value = iso
}
function onGridPointerover(event) {
  const b = event.target.closest?.('.g-datepicker__day')
  if (b && pending.value && hover.value !== b.dataset.date) hover.value = b.dataset.date
}
function onGridPointerleave() {
  hover.value = null
}

// Deslizamiento horizontal (táctil)
let x0 = null
let y0 = null
function onSwipeDown(event) {
  if (event.pointerType === 'touch') { x0 = event.clientX; y0 = event.clientY }
}
function onSwipeUp(event) {
  if (x0 === null) return
  const dx = event.clientX - x0
  const dy = event.clientY - y0
  x0 = null
  if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.5) {
    const rtl = surfaceEl.value && getComputedStyle(surfaceEl.value).direction === 'rtl'
    go((dx < 0) !== rtl ? 1 : -1)
  }
}

// ---------- Uno o dos meses por la medida real de la celda ----------
const isOpen = ref(false)
const lastCell = ref(0)
function availableWidth() {
  const margin = 16
  const vw = typeof window !== 'undefined' ? window.innerWidth : 0
  if (props.inline) return root.value?.clientWidth || 0
  const cap = Math.max(0, vw - margin * 2)
  const a = anchorEl()
  return props.anchor && a ? Math.min(cap, a.getBoundingClientRect().width) : cap
}
function needWidth() {
  const el = surfaceEl.value
  if (!el) return Infinity
  const day = el.querySelector('.g-datepicker__day')
  const cell = day ? day.getBoundingClientRect().width : lastCell.value
  if (!cell) return Infinity
  lastCell.value = cell
  const months = el.querySelector('.g-datepicker__months')
  const cs = getComputedStyle(el)
  const gap = months ? parseFloat(getComputedStyle(months).columnGap) || 0 : 0
  const pad = (parseFloat(cs.paddingInlineStart) || 0) + (parseFloat(cs.paddingInlineEnd) || 0) + (parseFloat(cs.borderInlineStartWidth) || 0) + (parseFloat(cs.borderInlineEndWidth) || 0)
  return 14 * cell + gap + pad
}
function fit() {
  if (props.months === 1 || props.months === '1') { n.value = 1; return }
  if (props.months === 2 || props.months === '2') { n.value = 2; return }
  if (!props.inline && !isOpen.value) return
  const avail = availableWidth()
  if (!avail) return
  const need = needWidth()
  const next = avail >= need ? 2 : 1
  if (next !== n.value) {
    n.value = next
    ensureVisible(focusDate.value)
  }
}
watch(() => props.months, () => { n.value = props.months === 2 || props.months === '2' ? 2 : 1; nextTick(fit) })

// ---------- Popover ----------
const popEl = ref(null)
const up = ref(false)
const openedBy = ref(null)
let triggerEl = null
const fieldEls = ref([])

function anchorEl() {
  const a = props.anchor
  if (a && typeof a === 'string') return document.querySelector(a)
  if (a && typeof a === 'object') return a
  return openedBy.value || root.value
}

function place() {
  const el = popEl.value
  const a = anchorEl()
  if (!el || !a) return
  el.style.setProperty('--_max', 'none')
  const r = a.getBoundingClientRect()
  const vh = window.innerHeight
  const vw = document.documentElement.clientWidth || window.innerWidth
  const need = el.offsetHeight
  const w = el.offsetWidth
  const below = vh - r.bottom - 8
  const above = r.top - 8
  const goUp = need > below && above > below
  up.value = goUp
  const rtl = getComputedStyle(el).direction === 'rtl'
  const x = rtl ? Math.max(8, Math.min(vw - r.right, vw - w - 8)) : Math.max(8, Math.min(r.left, vw - w - 8))
  el.style.setProperty('--_x', `${x}px`)
  if (goUp) {
    el.style.setProperty('--_top', 'auto')
    el.style.setProperty('--_bottom', `${vh - r.top + 8}px`)
    el.style.setProperty('--_max', `${Math.max(above, 0)}px`)
  } else {
    el.style.setProperty('--_top', `${r.bottom + 8}px`)
    el.style.setProperty('--_bottom', 'auto')
    el.style.setProperty('--_max', `${Math.max(below, 0)}px`)
  }
}
const onReposition = () => {
  if (!isOpen.value) return
  fit()
  nextTick(place)
}

function show(trigger) {
  if (props.inline || isOpen.value || isDisabled.value || isReadonly.value) return
  triggerEl = trigger || triggerEl
  openedBy.value = trigger || openedBy.value
  const { start } = normalized.value
  pending.value = null
  hover.value = null
  view.value = firstOfMonth(start || todayISO())
  focusDate.value = start || todayISO()
  isOpen.value = true
  nextTick(() => {
    const el = popEl.value
    if (el && typeof el.showPopover === 'function') el.showPopover()
    fit()
    nextTick(() => {
      ensureVisible(focusDate.value)
      place()
      nextTick(focusDay)
    })
  })
  document.addEventListener('pointerdown', onOutside)
  window.addEventListener('resize', onReposition)
  window.addEventListener('scroll', onReposition, true)
  emit('update:open', true)
  emit('open')
}

function close(returnFocus = false) {
  if (!isOpen.value) return
  isOpen.value = false
  pending.value = null
  hover.value = null
  const el = popEl.value
  if (el && typeof el.hidePopover === 'function' && el.matches?.(':popover-open')) el.hidePopover()
  document.removeEventListener('pointerdown', onOutside)
  window.removeEventListener('resize', onReposition)
  window.removeEventListener('scroll', onReposition, true)
  emit('update:open', false)
  emit('close')
  if (returnFocus) (triggerEl || root.value?.querySelector(`[aria-controls="${popId.value}"]`))?.focus()
}
function toggle(event) {
  const t = event?.currentTarget || null
  if (isOpen.value) close(true)
  else show(t)
}
function onOutside(event) {
  const el = popEl.value
  if (!el || el.contains(event.target)) return
  const a = anchorEl()
  const triggers = root.value ? [...root.value.querySelectorAll(`[aria-controls="${popId.value}"]`)] : []
  if (triggers.some((t) => t.contains(event.target)) || (a && a.contains(event.target) && !props.anchor)) return
  close(false)
}
function onPopFocusout(event) {
  const r = event.relatedTarget
  if (!r) return
  const el = popEl.value
  if (el && el.contains(r)) return
  const triggers = root.value ? [...root.value.querySelectorAll(`[aria-controls="${popId.value}"]`)] : []
  if (triggers.some((t) => t.contains(r))) return
  close(false)
}
function onPopKeydown(event) {
  if (event.key !== 'Escape' || props.inline) return
  // Esc cierra solo el selector: no debe llegar a un GDialog que también escuche Esc
  event.preventDefault()
  event.stopPropagation()
  close(true)
}
function done() {
  close(true)
}

watch(() => props.open, (v) => {
  if (props.inline) return
  if (v) show(triggerEl || fieldEls.value[0] || null)
  else close(false)
})
watch(() => [isDisabled.value, isReadonly.value], () => close(false))
watch(() => props.mode, () => { pending.value = null })
// Un valor nuevo desde fuera descarta un inicio pendiente
watch(() => `${normalized.value.start}/${normalized.value.end}`, () => { pending.value = null; hover.value = null })
watch(() => normalized.value.start, (s) => {
  if (s && !isOpen.value && !pending.value) {
    if (props.inline) { setView(firstOfMonth(s), { announce: false }); ensureVisible(s) }
  }
})

let ro = null
onMounted(() => {
  if (props.inline && typeof ResizeObserver !== 'undefined' && root.value) {
    ro = new ResizeObserver(() => fit())
    ro.observe(root.value)
  }
  if (props.inline) nextTick(fit)
  if (props.open && !props.inline) nextTick(() => show(fieldEls.value[0] || null))
})
onBeforeUnmount(() => {
  ro?.disconnect()
  if (isOpen.value) close(false)
})

// ---------- Marcado ----------
const rootAttrs = computed(() => ({ class: attrs.class, style: attrs.style }))
const fieldAttrs = computed(() => {
  const { class: _c, style: _s, ...rest } = attrs
  return rest
})
const classes = computed(() => [
  'g-datepicker',
  `g-datepicker--mode-${props.mode}`,
  `g-datepicker--variant-${props.variant}`,
  `g-datepicker--size-${props.size}`,
  `g-datepicker--density-${ff.density.value}`,
  `g-datepicker--color-${props.color}`,
  props.rounded && `g-datepicker--rounded-${props.rounded}`,
  {
    'g-datepicker--block': ff.block.value,
    'g-datepicker--inline': props.inline,
    'g-datepicker--split': splitOn.value,
    'g-datepicker--has-output': hasOutput.value,
    'is-open': isOpen.value,
    'is-disabled': isDisabled.value,
    'is-readonly': isReadonly.value,
    'is-invalid': invalid.value,
    'is-warning': ff.ownMessage.value?.type === 'warning',
    'is-valid': ff.ownMessage.value?.type === 'valid'
  }
])
const invalid = ff.invalid
const splitOn = computed(() => props.split && isRange.value && !props.inline && !hasTriggerSlot.value)
const hasLabel = computed(() => Boolean(props.label || slots.label))
const hasHint = computed(() => Boolean(props.hint || slots.hint))
const activeSide = computed(() => (openedBy.value ? fieldEls.value.indexOf(openedBy.value) : -1))

// El valor calculado (C14) solo existe en el modo campo de una caja (no inline, no split, sin slot trigger)
const outputOn = computed(() => props.output !== undefined && !props.inline && !splitOn.value && !hasTriggerSlot.value)
const hasOutput = computed(() => outputOn.value && Boolean(props.output))
const describedBy = computed(() => {
  const ids = [attrs['aria-describedby'], hasOutput.value && outputId.value, hasHint.value && hintId.value, message.value && ff.messageId.value].filter(Boolean)
  return ids.length ? ids.join(' ') : undefined
})
function fieldBindings(side) {
  const ownId = side === undefined ? baseId.value : `${baseId.value}-${side === 0 ? 'start' : 'end'}`
  const lab = side === undefined ? (hasLabel.value ? labelId.value : undefined) : `${ownId}-label`
  const expanded = isOpen.value && (side === undefined || activeSide.value === side)
  const first = side === undefined || side === 0
  const controlled = {
    id: ownId,
    type: 'button',
    'aria-haspopup': 'dialog',
    'aria-expanded': expanded ? 'true' : 'false',
    'aria-controls': popId.value,
    'aria-labelledby': lab ? `${lab} ${ownId}-value` : (attrs['aria-labelledby'] || undefined),
    'aria-describedby': describedBy.value,
    'aria-invalid': invalid.value ? 'true' : undefined,
    'aria-required': props.required ? 'true' : undefined,
    'aria-readonly': isReadonly.value ? 'true' : undefined,
    disabled: isDisabled.value || undefined
  }
  const base = first ? { ...fieldAttrs.value, ...controlled } : controlled
  // Los del contexto de GForm y el nuestro van PRIMERO (mismo criterio que GInput y GSelect; form.md §2, C8)
  return mergeProps(ff.handlers, { onClick: (e) => { if (interactive.value) toggle(e) } }, base)
}
const setFieldRef = (el, i) => { if (el) fieldEls.value[i] = el }

const slotScope = computed(() => ({
  id: baseId.value,
  expanded: isOpen.value,
  controls: popId.value,
  toggle,
  open: (e) => show(e?.currentTarget || null),
  close: () => close(true),
  value: normalized.value,
  text: fieldText.value
}))

const hiddenFields = computed(() => {
  if (!props.name) return []
  if (!isRange.value) return [{ name: props.name, value: normalized.value.start || '' }]
  return [{ name: `${props.name}-start`, value: normalized.value.start || '' }, { name: `${props.name}-end`, value: normalized.value.end || '' }]
})

// Pie
const showSummary = computed(() => props.summary || Boolean(slots.summary))
const summaryText = computed(() => {
  if (!isRange.value) return normalized.value.start ? short(normalized.value.start) : ''
  if (pending.value) return short(pending.value)
  const { start, end } = normalized.value
  return start ? rangeText(start, end) : ''
})
const summaryScope = computed(() => {
  const { start, end } = normalized.value
  return { start: pending.value || start, end: pending.value ? null : end, pending: Boolean(pending.value), days: start && end && !pending.value ? daysBetween(start, end) : 0 }
})
const proximityItems = computed(() => (isRange.value ? props.proximity.filter((p) => p && Number.isInteger(p.days) && p.days >= 1 && typeof p.label === 'string') : []))
const canWiden = computed(() => interactive.value && hasValue.value && !pending.value)
const showClear = computed(() => Boolean(L.value.clear) && (hasValue.value || Boolean(pending.value)))
const showDone = computed(() => !props.inline && Boolean(L.value.done))
const showFoot = computed(() => proximityItems.value.length > 0 || showSummary.value || showClear.value || showDone.value)

const sheetVisibleClose = computed(() => !props.inline)

if (isDev) {
  const l = props.labels || {}
  if (!l.prev || !l.next) warnOnce('nav', 'necesita labels.prev y labels.next: sin ellos los botones de mes no tienen nombre accesible.')
  if (!props.inline && !l.dialog) warnOnce('dialog', 'necesita labels.dialog (nombre accesible del popover).')
  if (!props.inline && !l.close) warnOnce('close', 'necesita labels.close (nombre del botón de cierre de la hoja móvil).')
  if (!props.inline && !hasTriggerSlot.value) {
    if (splitOn.value) {
      if (!props.labelStart || !props.labelEnd) warnOnce('split', 'con split necesita labelStart y labelEnd.')
    } else if (!hasLabel.value && !attrs['aria-label'] && !attrs['aria-labelledby']) {
      warnOnce('label', 'necesita label, slot label, aria-label o aria-labelledby para tener un nombre accesible.')
    }
  }
  if (props.inline) {
    const fieldProps = ['label', 'hint', 'error', 'placeholder', 'required', 'name', 'split', 'size', 'density', 'rounded', 'block', 'variant']
    const given = fieldProps.filter((k) => attrs[k] !== undefined)
    // (los props declarados no llegan a attrs: se comprueban contra sus valores no predeterminados)
    const set = [props.label, props.hint, props.error, props.placeholder, props.required, props.name, props.split, props.block, props.rounded].some(Boolean)
    if (given.length || set) warnOnce('inline-fields', 'con inline se ignoran las props de campo (label, hint, error, placeholder, required, name, split, size, density, rounded, block, variant).')
  }
}

defineExpose({
  open: () => show(fieldEls.value[0] || null),
  close: () => close(true),
  focus: () => (isOpen.value || props.inline ? focusDay() : fieldEls.value[0]?.focus())
})
</script>

<template>
  <div ref="root" v-bind="rootAttrs" :class="classes">
    <template v-if="!inline">
      <slot v-if="hasTriggerSlot" name="trigger" v-bind="slotScope" />
      <template v-else>
        <template v-if="splitOn">
          <span v-if="hasLabel" :id="labelId" class="g-datepicker__label"><slot name="label">{{ label }}</slot><template v-if="ff.mark.value === 'optional' && ff.markText.value">{{ ' ' }}<span class="g-datepicker__optional">{{ ff.markText.value }}</span></template><span v-if="ff.mark.value === 'required'" class="g-datepicker__required" aria-hidden="true">*</span></span>
          <div class="g-datepicker__fields" role="group" :aria-labelledby="hasLabel ? labelId : undefined">
            <div v-for="side in [0, 1]" :key="side" class="g-datepicker__item">
              <span :id="`${baseId}-${side === 0 ? 'start' : 'end'}-label`" class="g-datepicker__label">{{ side === 0 ? labelStart : labelEnd }}</span>
              <button :ref="(el) => setFieldRef(el, side)" v-bind="fieldBindings(side)" class="g-datepicker__field">
                <span class="g-datepicker__icon" aria-hidden="true"><slot name="icon"><GIcon name="calendar" /></slot></span>
                <span :id="`${baseId}-${side === 0 ? 'start' : 'end'}-value`" class="g-datepicker__value" :class="{ 'g-datepicker__value--placeholder': !(side === 0 ? normalized.start : normalized.end) }">{{ (side === 0 ? normalized.start : normalized.end) ? short(side === 0 ? normalized.start : normalized.end) : (side === 0 ? placeholderStart : placeholderEnd) }}</span>
              </button>
            </div>
          </div>
        </template>
        <template v-else>
          <span v-if="hasLabel" :id="labelId" class="g-datepicker__label"><slot name="label">{{ label }}</slot><template v-if="ff.mark.value === 'optional' && ff.markText.value">{{ ' ' }}<span class="g-datepicker__optional">{{ ff.markText.value }}</span></template><span v-if="ff.mark.value === 'required'" class="g-datepicker__required" aria-hidden="true">*</span></span>
          <button :ref="(el) => setFieldRef(el, 0)" v-bind="fieldBindings()" class="g-datepicker__field">
            <span class="g-datepicker__icon" aria-hidden="true"><slot name="icon"><GIcon name="calendar" /></slot></span>
            <span :id="`${baseId}-value`" class="g-datepicker__value" :class="{ 'g-datepicker__value--placeholder': !fieldText }">{{ fieldText || placeholder }}</span>
            <output v-if="outputOn" :id="outputId" class="g-datepicker__output" :for="baseId" aria-live="polite"><template v-if="output">{{ output }}</template></output>
          </button>
        </template>
        <input v-for="h in hiddenFields" :key="h.name" type="hidden" :name="h.name" :value="h.value" :disabled="isDisabled || undefined">
        <div class="g-datepicker__support">
          <div v-if="hasHint" :id="hintId" class="g-datepicker__hint"><slot name="hint">{{ hint }}</slot></div>
          <div :id="ff.messageId.value" class="g-datepicker__message" :aria-live="ff.live.value"><template v-if="message"><GIcon class="g-datepicker__message-icon" :name="messageIcon(message.type)" /><span v-if="message.prefix" class="g-datepicker__message-type">{{ message.prefix }}</span><slot v-if="message.type === 'error'" name="error">{{ message.text }}</slot><template v-else>{{ message.text }}</template></template></div>
        </div>
      </template>
    </template>

    <div
      :id="inline ? undefined : popId"
      ref="popEl"
      :class="inline ? undefined : ['g-datepicker__pop', { 'is-up': up }]"
      :role="inline ? undefined : 'dialog'"
      :aria-label="inline ? undefined : L.dialog"
      :popover="inline ? undefined : 'manual'"
      @keydown="onPopKeydown"
      @focusout="!inline && onPopFocusout($event)"
    >
      <div v-if="sheetVisibleClose" class="g-datepicker__sheet-head">
        <button class="g-datepicker__sheet-close" type="button" :aria-label="L.close" @click="close(true)"><GIcon name="x" /></button>
      </div>
      <div ref="surfaceEl" class="g-datepicker__surface">
        <div class="g-datepicker__months" @pointerdown="onSwipeDown" @pointerup="onSwipeUp">
          <section v-for="m in grid" :key="m.key" class="g-datepicker__month" :aria-labelledby="monthId(m.index)">
            <div class="g-datepicker__head">
              <button
                class="g-datepicker__nav g-datepicker__nav--prev"
                type="button"
                :hidden="m.index !== 0 || undefined"
                :aria-hidden="m.index !== 0 ? 'true' : undefined"
                :tabindex="m.index !== 0 ? -1 : undefined"
                :aria-label="L.prev"
                @click="go(-1)"
              ><GIcon name="chevron-left" /></button>
              <h3 :id="monthId(m.index)" class="g-datepicker__title" aria-live="polite"><span>{{ m.name }}</span> <span>{{ m.year }}</span></h3>
              <button
                class="g-datepicker__nav g-datepicker__nav--next"
                type="button"
                :hidden="m.index !== grid.length - 1 || undefined"
                :aria-hidden="m.index !== grid.length - 1 ? 'true' : undefined"
                :tabindex="m.index !== grid.length - 1 ? -1 : undefined"
                :aria-label="L.next"
                @click="go(1)"
              ><GIcon name="chevron-right" /></button>
            </div>
            <table class="g-datepicker__grid" role="grid" :aria-labelledby="monthId(m.index)" @click="onGridClick" @keydown="onGridKeydown" @pointerover="onGridPointerover" @pointerleave="onGridPointerleave">
              <thead>
                <tr>
                  <th v-for="(w, wi) in weekdays" :key="wi" scope="col"><span aria-hidden="true">{{ w.narrow }}</span><span class="g-datepicker__sr">{{ w.long }}</span></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(week, wi) in m.weeks" :key="wi">
                  <template v-for="cell in week" :key="cell.iso">
                    <td v-if="!cell.render" aria-hidden="true" />
                    <td
                      v-else
                      role="gridcell"
                      :class="{
                        'is-in-range': cell.st.inBand && !cell.st.isStart && !cell.st.isEnd,
                        'is-range-start': cell.st.isStart || cell.st.same,
                        'is-range-end': cell.st.isEnd || cell.st.same,
                        'is-preview': cell.st.preview,
                        'is-cap-start': cell.st.capStart,
                        'is-cap-end': cell.st.capEnd
                      }"
                      :aria-selected="cell.sel ? 'true' : 'false'"
                    >
                      <button
                        class="g-datepicker__day"
                        :class="{
                          'is-selected': cell.st.selected,
                          'is-today': cell.st.today,
                          'is-disabled': cell.st.disabled,
                          'is-outside': cell.st.outside,
                          'is-inactive': cell.st.inactive
                        }"
                        type="button"
                        :data-date="cell.iso"
                        :tabindex="cell.iso === tabbable ? 0 : -1"
                        :aria-label="cell.label"
                        :aria-disabled="cell.st.disabled ? 'true' : undefined"
                        :disabled="isDisabled || undefined"
                        @focus="onDayFocus(cell.iso)"
                      >{{ nf.format(cell.day) }}<GIcon v-if="cell.st.today" class="g-datepicker__today-dot" name="circle" filled /><slot name="day" :date="cell.iso" :day="cell.day" :selected="cell.st.selected" :in-range="cell.st.inBand" :disabled="cell.st.disabled" :outside="cell.st.outside" /></button>
                    </td>
                  </template>
                </tr>
              </tbody>
            </table>
          </section>
        </div>
        <div v-if="showFoot" class="g-datepicker__foot">
          <div v-if="proximityItems.length" class="g-datepicker__chips" role="group" :aria-label="L.proximityGroup">
            <button
              v-for="p in proximityItems"
              :key="p.days"
              class="g-datepicker__chip"
              type="button"
              :data-days="p.days"
              :aria-label="p.ariaLabel || undefined"
              :disabled="!canWiden || undefined"
              @click="widen(p.days)"
            >{{ p.label }}</button>
          </div>
          <div v-if="showSummary || showClear || showDone" class="g-datepicker__bar">
            <div v-if="showSummary" class="g-datepicker__summary"><slot name="summary" v-bind="summaryScope">{{ summaryText }}</slot></div>
            <div v-if="showClear || showDone" class="g-datepicker__actions">
              <button v-if="showClear" class="g-datepicker__action" type="button" :disabled="!interactive || undefined" @click="clearValue">{{ L.clear }}</button>
              <button v-if="showDone" class="g-datepicker__action g-datepicker__action--primary" type="button" @click="done">{{ L.done }}</button>
            </div>
          </div>
        </div>
        <div class="g-datepicker__sr" role="status" aria-live="polite">{{ announcement }}</div>
      </div>
    </div>
  </div>
</template>
