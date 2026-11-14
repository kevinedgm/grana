<script setup>
// GDatePicker · selector de una fecha o de un rango (dueño: bruno)
// Contrato: design/contracts/datepicker.md · Estructura: design/lab/datepicker/r01/ y r02/ · Estilo: GDatePicker.css (coco)
// Patrón: date picker dialog (WAI-ARIA APG). Cada mes es un grid; un solo tabstop (tabindex móvil) y un
// nombre completo por día. El valor es una cadena ISO (YYYY-MM-DD) o { start, end }; solo se emiten valores completos.
import { computed, mergeProps, nextTick, onBeforeUnmount, onMounted, onUpdated, ref, useAttrs, useId, useSlots, watch } from 'vue'
import { oneOf } from '../../utils/oneOf.js'
import GIcon from '../GIcon/GLibIcon.js'
import { messageIcon, spaceUnit, useFormField } from '../GForm/formContext.js'
import { anchorGone, followFrame, isPhone, px, setVar, stickySide } from '../../utils/anchor.js'
import { addDays, addMonths, daysBetween, daysInMonth, firstOfMonth, isISO, monthKey, parseISO, todayISO, weekday } from '../../utils/dates.js'

// Búfer del año escrito en la vista de años (r02, #1024): sin cifra nueva en este tiempo se vacía. No es token (§29.6).
const YEAR_TYPE_MS = 1500

defineOptions({ name: 'GDatePicker', inheritAttrs: false })

const props = defineProps({
  modelValue: { type: [String, Object], default: null },
  mode: { type: String, default: 'single', validator: oneOf(['single', 'range']) },
  inline: Boolean,
  open: Boolean,
  min: { type: String, default: undefined },
  max: { type: String, default: undefined },
  disabledDates: { type: Function, default: undefined },
  dayDescription: { type: Function, default: undefined },
  disabledNights: { type: Function, default: undefined },
  minNights: { type: Number, default: undefined },
  maxNights: { type: Number, default: undefined },
  // #1021: un mes por defecto; `auto` mide y pone dos si caben
  months: { type: [String, Number], default: 1, validator: (v) => v === 'auto' || v === 1 || v === 2 || v === '1' || v === '2' },
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

const warned = new Set()
const warnOnce = (key, msg) => {
  try {
    if (process.env.NODE_ENV !== 'production' && !warned.has(key)) {
      warned.add(key)
      console.warn(`[Grana] <GDatePicker> ${msg}`)
    }
  } catch {}
}

const isRange = computed(() => props.mode === 'range')
const hasTriggerSlot = computed(() => !props.inline && Boolean(slots.trigger))
const L = computed(() => props.labels || {})

// ---------- Idioma ----------
// Antes de montar (servidor e hidratación) nada del entorno: sin `locale`, 'en', y los tramos sin formatRange, cuya
// salida cambia con los datos de ICU de cada motor (WebKit separa «26 – 29», Node y Chromium «26–29»). Al montar,
// el `lang` del documento o del navegador y formatRange.
const mounted = ref(false)
const locale = computed(() => props.locale || (mounted.value && (document.documentElement.lang || (typeof navigator !== 'undefined' && navigator.language))) || 'en')
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
const fmtReadout = computed(() => dtf({ weekday: 'short', day: 'numeric' }))
const nf = computed(() => new Intl.NumberFormat(locale.value, { useGrouping: false }))
const full = (iso) => fmtFull.value.format(parseISO(iso))
const short = (iso) => fmtShort.value.format(parseISO(iso))
const rangeText = (a, b) => {
  if (a === b) return short(a)
  const f = fmtShort.value
  return mounted.value && typeof f.formatRange === 'function' ? f.formatRange(parseISO(a), parseISO(b)) : `${short(a)} – ${short(b)}`
}
const fill = (tpl, vars) => (typeof tpl === 'string' ? tpl.replace(/\{(date|start|end|days|year|from|to)\}/g, (_, k) => String(vars[k] ?? '')) : '')
// Meses y años (r02): fechas locales con setFullYear (años de 1 a 99 sin el salto a 19xx de Date)
const dateOf = (y, m = 0) => { const d = new Date(2000, m, 1); d.setFullYear(y); return d }
const fmtYear = computed(() => dtf({ year: 'numeric' }))
const fmtMonthYear = computed(() => dtf({ month: 'long', year: 'numeric' }))
const fmtMonthShort = computed(() => dtf({ month: 'short' }))
const yearText = (y) => fmtYear.value.format(dateOf(y))
const yearsText = (a, b) => {
  const f = fmtYear.value
  return mounted.value && typeof f.formatRange === 'function' ? f.formatRange(dateOf(a), dateOf(b)) : `${yearText(a)}–${yearText(b)}`
}

// ---------- Valor ----------
const normalized = computed(() => {
  const v = props.modelValue
  if (v === null || v === undefined || v === '') return { start: null, end: null }
  if (!isRange.value) {
    if (typeof v === 'string' && isISO(v)) return { start: v, end: null }
    try { if (process.env.NODE_ENV !== 'production') warnOnce('value', `modelValue inválido para mode="single": se esperaba una cadena ISO YYYY-MM-DD (llegó ${JSON.stringify(v)}).`) } catch {}
    return { start: null, end: null }
  }
  if (typeof v === 'object' && isISO(v.start) && isISO(v.end) && v.start <= v.end) return { start: v.start, end: v.end }
  try { if (process.env.NODE_ENV !== 'production') warnOnce('value', `modelValue inválido para mode="range": se esperaba { start, end } ISO con start ≤ end (llegó ${JSON.stringify(v)}).`) } catch {}
  return { start: null, end: null }
})
const hasValue = computed(() => Boolean(normalized.value.start))

// Estado interno
const pending = ref(null) // inicio de rango elegido y aún sin fin
const hover = ref(null)
// La fecha del dispositivo se lee al montar (#1033): el servidor y el primer pintado del cliente no marcan hoy, y la vista
// sale solo del valor. Sin valor, la rejilla de días espera al montaje (`viewReady`), que pone el mes de hoy; HOLD es un
// marcador estable que nunca se pinta.
const HOLD = '2000-01-01'
const today = ref(null)
const viewReady = ref(Boolean(normalized.value.start))
const view = ref(firstOfMonth(normalized.value.start || HOLD))
const focusDate = ref(normalized.value.start || HOLD)
const n = ref(props.months === 2 || props.months === '2' ? 2 : 1)
const announcement = ref('')

const fieldText = computed(() => {
  const { start, end } = normalized.value
  if (!start) return ''
  return isRange.value ? rangeText(start, end) : short(start)
})

// ---------- Disponibilidad ----------
// Noches y salida (#739, datepicker.md «Noches y salida»; solo range): disabledNights(iso) = la noche que empieza iso está agotada
const unavailable = (iso) => Boolean((props.min && iso < props.min) || (props.max && iso > props.max) || (props.disabledDates && props.disabledDates(iso)))
// Noches (#739): solo en range. Con alguna de las tres reglas, un rango duerme las noches start … end − 1 y el fin va
// después del inicio; sin ellas, el comportamiento de siempre (fin ≥ inicio, disabledDates no impide contener días)
const nightsOn = computed(() => isRange.value && (props.disabledNights || props.minNights || props.maxNights) !== undefined)
const nightOff = (iso) => Boolean(isRange.value && props.disabledNights && props.disabledNights(iso))
const canStart = (iso) => !unavailable(iso) && !nightOff(iso)
// Fin válido: sin las reglas, e ≥ s; con ellas, e > s, noches (días − 1) en [min, max] y ninguna agotada entre medias
function canEnd(s, e) {
  if (!s || unavailable(e)) return false
  if (!nightsOn.value) return e >= s
  const n = daysBetween(s, e) - 1
  if (n < (props.minNights || 1) || n > (props.maxNights ?? n)) return false
  for (let d = s; d < e; d = addDays(d, 1)) if (nightOff(d)) return false
  return true
}

// ---------- Rango efectivo (con vista previa mientras se elige el final) ----------
const eff = computed(() => {
  if (!isRange.value) return { a: null, b: null, preview: false }
  if (pending.value) {
    if (hover.value && hover.value >= pending.value && (!nightsOn.value || canEnd(pending.value, hover.value))) return { a: pending.value, b: hover.value, preview: true }
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
  if (!viewReady.value) return out
  const now = today.value
  // Borde visible de la franja que sigue (#1027): en un mes, la primera y la última celda pintadas; en dos, el primer día
  // del primero y el último del segundo
  const lead0 = (weekday(view.value) - fdow.value + 7) % 7
  const vis = n.value === 1 ? [addDays(view.value, -lead0), addDays(view.value, 41 - lead0)] : [view.value, lastVisibleDay()]
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
          cell.st = dayState(cell, now, vis)
          cell.label = dayLabel(cell, cell.st)
          cell.sel = cellSelected(cell)
        }
        cells.push(cell)
      }
      weeks.push(cells)
    }
    out.push({ key: first, first, index: i, name: fmtMonth.value.format(d0), year: yearText(d0.getFullYear()), live: fmtMonthYear.value.format(d0), weeks })
  }
  return out
})
const cellAt = (iso) => {
  for (const m of grid.value) for (const w of m.weeks) for (const c of w) if (c.render && c.iso === iso) return c
}
const tabbable = computed(() => (cellAt(focusDate.value) ? focusDate.value : grid.value[0]?.first ?? focusDate.value))
// Alcance del slot day, el mismo en la celda y en la lectura
const dayScope = (c) => ({ date: c.iso, day: c.day, selected: c.st.selected, inRange: c.st.inBand, disabled: c.st.disabled, outside: c.st.outside })

function dayState(cell, today, vis) {
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
  // Con noches (#739): sin inicio pendiente, lo que no puede ser inicio es Disabled salvo «solo salida»; con inicio pendiente,
  // lo que no puede ser fin pero sí inicio es Inactive, y lo que no puede ser ni una cosa ni otra, Disabled (regla 3)
  const p = pending.value
  let dis = unavailable(iso)
  let co = false
  let inact = Boolean(p && iso < p && !dis && cell.inMonth)
  if (nightsOn.value && !dis && iso !== p) {
    const st = canStart(iso)
    // Solo salida (regla 4): sin inicio pendiente, su noche agotada y la de antes no
    if (!p) co = !st && nightOff(iso) && !nightOff(addDays(iso, -1))
    const end = p && canEnd(p, iso)
    dis = !st && !end && !co
    if (p) inact = Boolean(!end && st && cell.inMonth)
  }
  const circle = single ? selectedSingle : Boolean(a && (iso === a || (iso === b && !preview)))
  const cs = inBand && (cell.col === 0 || (multi && cell.first))
  const ce = inBand && (cell.col === 6 || (multi && cell.last))
  // La franja que sigue (#1027): el rango continúa fuera de lo que se ve; en lugar del extremo redondo
  const openStart = Boolean(inBand && iso === vis[0] && a < iso)
  const openEnd = Boolean(inBand && iso === vis[1] && b > iso)
  return {
    selected: Boolean(circle),
    today: Boolean(today) && iso === today,
    disabled: dis,
    outside: !cell.inMonth,
    inactive: inact,
    checkoutOnly: co,
    isStart, isEnd, same, inBand, preview: Boolean(inBand && preview),
    capStart: Boolean(cs && !isStart && !openStart), capEnd: Boolean(ce && !isEnd && !openEnd), openStart, openEnd
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
  if (st.checkoutOnly) add(l.checkoutOnly)
  if (st.disabled) add(l.unavailable)
  // Dato del día de la aplicación (#778; p. ej. formatPrice(...).spoken): al final del nombre, sin aviso si no es texto
  if (props.dayDescription) {
    const d = props.dayDescription(cell.iso)
    if (typeof d === 'string') add(d)
  }
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
  // Noches (#739): con inicio pendiente, un fin válido cierra el rango y si no, un inicio válido lo reinicia; sin él, solo
  // un inicio válido (un día «solo salida» no hace nada)
  const restart = nightsOn.value && !(pending.value && canEnd(pending.value, iso))
  if (restart && !canStart(iso)) return
  focusDate.value = iso
  if (!isRange.value) {
    emitValue(iso)
    say(fill(L.value.announceDate, { date: full(iso) }))
    afterPick(true, iso)
    return
  }
  if (!pending.value || restart) {
    pending.value = iso
    hover.value = null
    emit('start', { date: iso })
    say(fill(L.value.announceStart, { date: full(iso) }))
    afterPick(false, iso)
  } else if (iso < pending.value && !nightsOn.value) {
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
  const { start, end } = normalized.value
  let a = addDays(start, -days)
  let b = addDays(end, days)
  if (props.min && a < props.min) a = props.min
  if (props.max && b > props.max) b = props.max
  // Regla 7 (#739): ampliar no mete noches agotadas (recorta antes de la primera) ni pasa de maxNights
  for (let d = addDays(start, -1); d >= a; d = addDays(d, -1)) if (nightOff(d)) { a = addDays(d, 1); break }
  for (let d = end; d < b; d = addDays(d, 1)) if (nightOff(d)) { b = d; break }
  if (nightsOn.value && daysBetween(a, b) > props.maxNights + 1) b = addDays(a, props.maxNights)
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
  zoom.value = null // cambiar de mes no lleva zoom (#1023)
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
  // Día activo de la lectura (#952): el del puntero; el toque no cuenta (en táctil, el activo es el elegido)
  if (b && slots.day && event.pointerType !== 'touch' && pointed.value !== b.dataset.date) pointed.value = b.dataset.date
}
function onGridPointerleave() {
  hover.value = null
  pointed.value = null
}

// ---------- Vistas: días, meses y años (r02, A · Zoom de escala; #1020, #1024) ----------
// La vista es interna (no es prop ni evento). Las vistas solo navegan: elegir un año baja a sus meses y elegir un mes
// baja a sus días; el valor no cambia. Esc sube un nivel (la pila es la de los gestos). El zoom lo pinta coco con
// data-zoom y el origen --_zoom-x/-y, escritos en la raíz de la vista y calculados por índice (sin leer cajas).
const level = ref('days')
let stack = []
const vy = ref(0) // año a la vista en meses
const vm = ref(0) // mes con la parada de Tab en meses (0-11)
const ys = ref(1) // primer año de la página de años
const vyf = ref(0) // año con la parada de Tab en años
const fromCol = ref(0) // columna (con dos meses) desde cuyo título se abrió
const zoom = ref(null) // { dir: 'in' | 'out', x, y } en fracción del escenario
const typed = ref([]) // cifras escritas del año
let typedTimer = 0

const pad4 = (y) => String(y).padStart(4, '0')
const ymISO = (y, m, d = 1) => `${pad4(y)}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
const yOf = (iso) => Number(iso.slice(0, 4))
const mOf = (iso) => Number(iso.slice(5, 7)) - 1
const lastOf = (y, m) => ymISO(y, m, daysInMonth(ymISO(y, m)))
// min/max en meses y años (#1026): solo min y max (disabledDates no cuenta); sin ellos, años de 1 a 9999
const minY = computed(() => Math.max(1, isISO(props.min) ? yOf(props.min) : 1))
const maxY = computed(() => Math.min(9999, isISO(props.max) ? yOf(props.max) : 9999))
const monthOff = (y, m) => Boolean((props.min && lastOf(y, m) < props.min) || (props.max && ymISO(y, m) > props.max))
const yearOff = (y) => y < minY.value || y > maxY.value
const pageOff = (s) => s > maxY.value || s + 11 < minY.value
const clampYs = (s) => Math.max(1, Math.min(9988, s))
const origin = (idx) => ({ x: ((idx % 3) + 0.5) / 3, y: (Math.floor(idx / 3) + 0.5) / 4 })

// Lo elegido que marcan meses y años: la fecha, el rango o el inicio pendiente
const markSpan = computed(() => {
  if (pending.value) return [pending.value, pending.value]
  const { start, end } = normalized.value
  return start ? [start, end || start] : null
})
const touches = (a, b) => Boolean(markSpan.value && markSpan.value[0] <= b && markSpan.value[1] >= a)
function pickLabel(text, cur, has, off) {
  const l = L.value
  let t = text
  const add = (x) => { if (x) t += `, ${x}` }
  if (cur) add(l.current)
  if (has) add(isRange.value ? l.hasValue : l.selected)
  if (off) add(l.unavailable)
  return t
}
const picks = computed(() => {
  const lv = level.value
  if (lv === 'days') return []
  const now = today.value
  const rows = []
  for (let r = 0; r < 4; r++) {
    const row = []
    for (let c = 0; c < 3; c++) {
      const i = r * 3 + c
      if (lv === 'months') {
        const y = vy.value
        const has = touches(ymISO(y, i), lastOf(y, i))
        const cur = Boolean(now) && yOf(now) === y && mOf(now) === i
        const off = monthOff(y, i)
        row.push({ key: i, text: fmtMonthShort.value.format(dateOf(y, i)), label: pickLabel(fmtMonthYear.value.format(dateOf(y, i)), cur, has, off), cur, has, off, tab: i === vm.value })
      } else {
        const y = ys.value + i
        const has = touches(ymISO(y, 0), ymISO(y, 11, 31))
        const cur = Boolean(now) && yOf(now) === y
        const off = yearOff(y)
        const text = yearText(y)
        row.push({ key: y, text, label: pickLabel(text, cur, has, off), cur, has, off, tab: y === vyf.value })
      }
    }
    rows.push(row)
  }
  return rows
})
const pickName = computed(() => {
  const l = L.value
  if (level.value === 'months') return fill(l.viewMonths, { year: yearText(vy.value) }) || yearText(vy.value)
  return fill(l.viewYears, { from: yearText(ys.value), to: yearText(ys.value + 11) }) || yearsText(ys.value, ys.value + 11)
})
const yearsHintId = computed(() => `${baseId.value}-years-hint`)
const typedDigits = computed(() => [0, 1, 2, 3].map((i) => (i < typed.value.length ? nf.value.format(typed.value[i]) : '')))
// Bordes (#1026): la flecha que llevaría a un año o a una página enteros fuera de [min, max] lleva aria-disabled
const edgePrev = computed(() => (level.value === 'months' ? yearOff(vy.value - 1) : ys.value <= 1 || pageOff(clampYs(ys.value - 12))))
const edgeNext = computed(() => (level.value === 'months' ? yearOff(vy.value + 1) : ys.value >= 9988 || pageOff(clampYs(ys.value + 12))))
// Origen del zoom en la vista i de n (con dos meses, el escenario son las dos columnas)
// Con varios meses la separación entre ellos cuenta: (X·cols − i)·ancho + (X·(cols − 1) − i)·separación (B1 de la auditoría r02).
const zoomVars = (i, cols) => {
  if (!zoom.value) return undefined
  const px = (zoom.value.x * cols - i) * 100
  const x = cols > 1 ? `calc(${px}% + ${zoom.value.x * (cols - 1) - i} * var(--_months-gap))` : `${px}%`
  return { '--_zoom-x': x, '--_zoom-y': `${zoom.value.y * 100}%` }
}

function clearTyped() {
  if (typedTimer) { clearTimeout(typedTimer); typedTimer = 0 }
  if (typed.value.length) typed.value = []
}
function focusPick() {
  surfaceEl.value?.querySelector('.g-datepicker__pick[tabindex="0"]')?.focus()
}
function enter(next, dir, idx) {
  clearTyped()
  level.value = next
  zoom.value = { dir, ...origin(idx) }
  nextTick(next === 'days' ? focusDay : focusPick)
}
// Botón del título de días (columna i): meses de ese año, foco en ese mes
function toMonths(i) {
  if (isDisabled.value) return
  const first = addMonths(view.value, i)
  fromCol.value = i
  stack = ['days']
  vy.value = yOf(first)
  vm.value = mOf(first)
  enter('months', 'out', vm.value)
}
// Botón del año (en días, columna i, o en meses): la página empieza en el año − 4
function toYears(i) {
  if (isDisabled.value) return
  let y
  if (level.value === 'months') {
    stack.push('months')
    y = vy.value
  } else {
    const first = addMonths(view.value, i)
    fromCol.value = i
    stack = ['days']
    y = yOf(first)
    vm.value = mOf(first)
  }
  ys.value = clampYs(y - 4)
  vyf.value = y
  enter('years', 'out', y - ys.value)
}
function pickYear(y) {
  if (yearOff(y)) return
  const idx = y - ys.value
  vy.value = y
  stack = ['days']
  enter('months', 'in', idx)
}
// Elegir un mes baja a sus días: el mismo número de día que la parada de Tab, recortado; abierto desde la segunda
// columna, el elegido queda segundo. Emite navigate si cambia el primer mes visible
function pickMonth(m) {
  const y = vy.value
  if (monthOff(y, m)) return
  const d = Math.min(Number(focusDate.value.slice(8, 10)), daysInMonth(ymISO(y, m)))
  focusDate.value = ymISO(y, m, d)
  stack = []
  setView(firstOfMonth(addMonths(ymISO(y, m), -fromCol.value)))
  enter('days', 'in', m)
}
// Esc: sube al nivel anterior sin elegir; el foco vuelve al botón del título que abrió el nivel. No navega
function levelUp() {
  const was = level.value
  const prev = stack.pop() || 'days'
  clearTyped()
  let idx = 4.5
  if (was === 'months') idx = mOf(addMonths(view.value, fromCol.value))
  else if (prev === 'months' && vy.value >= ys.value && vy.value <= ys.value + 11) idx = vy.value - ys.value
  else if (prev === 'days') { const y = yOf(addMonths(view.value, fromCol.value)) - ys.value; if (y >= 0 && y <= 11) idx = y }
  level.value = prev
  zoom.value = { dir: 'in', ...origin(idx) }
  nextTick(() => {
    const months = surfaceEl.value?.querySelectorAll('.g-datepicker__month')
    const sec = months && (months[prev === 'days' ? fromCol.value : 0] || months[0])
    sec?.querySelector(`.g-datepicker__title-part--${prev === 'days' && was === 'months' ? 'month' : 'year'}`)?.focus()
  })
}
function stepYear(d) {
  if (isDisabled.value || yearOff(vy.value + d)) return
  vy.value += d
  say(fill(L.value.viewMonths, { year: yearText(vy.value) }))
}
function stepPage(d) {
  if (isDisabled.value) return
  const s = clampYs(ys.value + d * 12)
  if (s === ys.value || pageOff(s)) return
  vyf.value = Math.max(s, Math.min(s + 11, vyf.value + (s - ys.value)))
  ys.value = s
  say(fill(L.value.viewYears, { from: yearText(s), to: yearText(s + 11) }))
}
function onPickClick(event) {
  const b = event.target.closest?.('.g-datepicker__pick')
  if (!b) return
  const v = Number(b.dataset.value)
  if (level.value === 'months') { vm.value = v; pickMonth(v) } else { vyf.value = v; pickYear(v) }
}
function onPickFocus(event) {
  const b = event.target.closest?.('.g-datepicker__pick')
  if (!b) return
  const v = Number(b.dataset.value)
  if (level.value === 'months') vm.value = v
  else vyf.value = v
}
// Valor de una cifra de cualquier sistema (\p{Nd}): los dígitos vienen en tramos contiguos de diez
function digitOf(k) {
  if (typeof k !== 'string' || [...k].length !== 1 || !/\p{Nd}/u.test(k)) return null
  const cp = k.codePointAt(0)
  let i = 0
  while (i < 9 && /\p{Nd}/u.test(String.fromCodePoint(cp - i - 1))) i++
  return i
}
function onPickKeydown(event) {
  if (!event.target.closest?.('.g-datepicker__pick')) return
  const k = event.key
  const rtl = surfaceEl.value && getComputedStyle(surfaceEl.value).direction === 'rtl'
  const ctrl = event.ctrlKey || event.metaKey
  const steps = { ArrowLeft: rtl ? 1 : -1, ArrowRight: rtl ? -1 : 1, ArrowUp: -3, ArrowDown: 3 }
  if (level.value === 'months') {
    let y = vy.value
    let m = vm.value
    if (steps[k]) m += steps[k]
    else if (k === 'Home') m = ctrl ? 0 : m - (m % 3)
    else if (k === 'End') m = ctrl ? 11 : m - (m % 3) + 2
    else if (k === 'PageUp') y -= 1
    else if (k === 'PageDown') y += 1
    else return
    event.preventDefault()
    y += Math.floor(m / 12)
    m = ((m % 12) + 12) % 12
    if (yearOff(y)) return // no se pasa a un año entero fuera de [min, max]
    const crossed = y !== vy.value
    vy.value = y
    vm.value = m
    if (crossed) say(fill(L.value.viewMonths, { year: yearText(y) }))
    nextTick(focusPick)
    return
  }
  // Años: cifras, Retroceso, flechas
  const dg = event.altKey || ctrl ? null : digitOf(k)
  if (dg !== null) {
    event.preventDefault()
    if (typedTimer) clearTimeout(typedTimer)
    typed.value = [...typed.value, dg]
    if (typed.value.length < 4) {
      typedTimer = setTimeout(() => { typedTimer = 0; typed.value = [] }, YEAR_TYPE_MS)
      return
    }
    const y = Math.max(minY.value, Math.min(maxY.value, Number(typed.value.join(''))))
    clearTyped()
    ys.value = clampYs(y - 4)
    vyf.value = y
    nextTick(focusPick)
    return
  }
  if (k === 'Backspace') {
    if (typed.value.length) { event.preventDefault(); typed.value = typed.value.slice(0, -1) }
    return
  }
  let y = vyf.value
  const s0 = ys.value
  if (steps[k]) y += steps[k]
  else if (k === 'Home') y = ctrl ? s0 : y - ((y - s0) % 3)
  else if (k === 'End') y = ctrl ? s0 + 11 : y - ((y - s0) % 3) + 2
  else if (k === 'PageUp') y -= 12
  else if (k === 'PageDown') y += 12
  else return
  event.preventDefault()
  if (y < 1 || y > 9999) return
  let s = s0
  while (y < s) s = clampYs(s - 12)
  while (y > s + 11) s = clampYs(s + 12)
  if (s !== s0 && pageOff(s)) return // no se pasa a una página entera fuera de [min, max]
  ys.value = s
  vyf.value = y
  if (s !== s0) say(fill(L.value.viewYears, { from: yearText(s), to: yearText(s + 11) }))
  nextTick(focusPick)
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
    const d = (dx < 0) !== rtl ? 1 : -1
    // En cada vista, lo mismo que sus flechas (mes, año, página de 12)
    if (level.value === 'months') stepYear(d)
    else if (level.value === 'years') stepPage(d)
    else if (!isDisabled.value) go(d)
  }
}

// ---------- Uno o dos meses por la medida real de la celda ----------
const isOpen = ref(false)
const lastCell = ref(0)

// ---------- Lectura del día (AV-C1, #952; datepicker.md «Cuando el dato no cabe en la celda») ----------
// Si el contenido del slot day no cabe en alguna celda, la raíz lleva is-day-content-hidden (todo o nada) y la lectura
// bajo la cuadrícula enseña el dato del día activo. Un hijo de 1 px o menos es texto oculto accesible y no cuenta; el ancho de referencia es el menor del hijo y del día (la pista de la rejilla del día crece con su contenido). Se mide en un solo cuadro y solo con lecturas; el contenido oculto
// sigue ocupando su sitio (visibility, coco), así que la decisión no tiene histéresis. Se vuelve a medir al cambiar de
// tamaño (el ResizeObserver de la raíz), al abrir y tras un render que cambie el mes o el texto de los días: la clave es
// lo medido, no el render (un padre con props en línea no vuelve a medir)
const pointed = ref(null)
const dayHidden = ref(false)
let measureRaf = 0
let measuredKey = null
function measureKey() {
  const m = surfaceEl.value?.querySelector('.g-datepicker__months')
  return m ? `${isOpen.value}|${view.value}|${n.value}|${m.textContent}` : null
}
function measureDays() {
  measureRaf = 0
  measuredKey = measureKey()
  const el = surfaceEl.value
  let over = false
  if (el && slots.day && (props.inline || isOpen.value)) {
    for (const c of el.querySelectorAll('.g-datepicker__day > :not(.g-datepicker__today-dot)')) if (c.clientWidth > 1 && c.scrollWidth > Math.min(c.clientWidth, c.parentElement.clientWidth) + 0.5) { over = true; break }
  }
  if (over !== dayHidden.value) dayHidden.value = over
}
function scheduleMeasure() {
  if (measureRaf || !slots.day) return
  measureRaf = requestAnimationFrame(measureDays)
}
onUpdated(() => {
  if (!slots.day) { if (dayHidden.value) dayHidden.value = false; return }
  const k = measureKey()
  if (k !== measuredKey) { measuredKey = k; scheduleMeasure() }
})
const activeCell = computed(() => cellAt(pointed.value || tabbable.value))
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
    zoom.value = null
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

// Panel estable al desplazar (reporte del usuario sobre GCombobox; utils/anchor.js): el lado se decide AL ABRIR y se
// conserva (solo cambia si el actual baja de space × 40 y el otro ofrece space × 12 más); --_max se fija al abrir, al
// cambiar de uno a dos meses, en resize y al cambiar de lado. Durante el desplazamiento de la página solo se escribe la
// posición, una vez por cuadro y solo si cambia, con el ancho medido en la última colocación completa. Si el ancla sale
// del visor (o de su contenedor con desplazamiento), el selector se cierra sin devolver el foco; la hoja móvil no la sigue.
let side = null // 'bottom' | 'top' mientras está abierto
let popW = 0
function place(full = true) {
  const el = popEl.value
  const a = anchorEl()
  if (!el || !a) return
  if (full) el.style.setProperty('--_max', 'none')
  const r = a.getBoundingClientRect()
  const vh = window.innerHeight
  const vw = document.documentElement.clientWidth || window.innerWidth
  const below = vh - r.bottom - 8
  const above = r.top - 8
  const prev = side
  if (!side) side = el.offsetHeight > below && above > below ? 'top' : 'bottom'
  else side = stickySide(side, { below, above, unit: spaceUnit(el) })
  const goUp = side === 'top'
  up.value = goUp
  if (full) popW = el.offsetWidth
  const rtl = getComputedStyle(el).direction === 'rtl'
  const x = rtl ? Math.max(8, Math.min(vw - r.right, vw - popW - 8)) : Math.max(8, Math.min(r.left, vw - popW - 8))
  setVar(el, '--_x', px(x))
  setVar(el, '--_top', goUp ? 'auto' : px(r.bottom + 8))
  setVar(el, '--_bottom', goUp ? px(vh - r.top + 8) : 'auto')
  if (full || side !== prev) el.style.setProperty('--_max', px(Math.max(goUp ? above : below, 0)))
}
const follow = followFrame((scroller) => {
  if (!isOpen.value) return
  if (!isPhone() && anchorGone(anchorEl(), scroller)) { close(false); return }
  place(false)
})
const onResize = () => {
  if (!isOpen.value) return
  fit()
  nextTick(() => place())
}
const onScroll = (event) => {
  const t = event && event.target
  if (!isOpen.value || (t && t.nodeType === 1 && popEl.value?.contains(t))) return // la propia superficie se desplaza
  follow.schedule(t)
}
// Uno o dos meses con el selector abierto: cambia el tamaño, colocación completa (el lado se conserva)
watch(n, () => { if (isOpen.value && !props.inline) nextTick(() => place()) }, { flush: 'post' })

function show(trigger) {
  if (props.inline || isOpen.value || isDisabled.value || isReadonly.value) return
  triggerEl = trigger || triggerEl
  openedBy.value = trigger || openedBy.value
  const { start } = normalized.value
  pending.value = null
  hover.value = null
  // Cada vez que se abre, la vista es la de días, sin zoom (r02)
  level.value = 'days'
  stack = []
  zoom.value = null
  clearTyped()
  today.value = todayISO()
  view.value = firstOfMonth(start || today.value)
  focusDate.value = start || today.value
  viewReady.value = true
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
  window.addEventListener('resize', onResize)
  window.addEventListener('scroll', onScroll, true)
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
  window.removeEventListener('resize', onResize)
  window.removeEventListener('scroll', onScroll, true)
  follow.cancel()
  side = null
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
  if (event.key !== 'Escape' || event.isComposing) return
  // Esc cierra lo de arriba primero (r02, #1024): las cifras escritas, luego sube de nivel y, en días, cierra el
  // selector. Lo que consume no debe llegar a un GDialog que también escuche Esc (un inline dentro no lo cierra)
  if (typed.value.length) clearTyped()
  else if (level.value !== 'days') levelUp()
  else if (!props.inline) close(true)
  else return
  event.preventDefault()
  event.stopPropagation()
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

// Aviso (#739): una noche agotada dentro del modelValue recibido (se muestra tal cual)
watch(() => [normalized.value.start, normalized.value.end, props.disabledNights], () => {
  try {
    if (process.env.NODE_ENV !== 'production' && isRange.value && props.disabledNights) {
      const { start, end } = normalized.value
      if (start && end) for (let d = start; d < end; d = addDays(d, 1)) if (props.disabledNights(d)) { warnOnce('nights-value', `modelValue con la noche agotada del ${d}.`); break }
    }
  } catch {}
}, { immediate: true })

let ro = null
// Una fuente web que llega después de la primera medida cambia el ancho del dato del día sin cambiar el tamaño de la
// caja (el ResizeObserver no salta): se vuelve a medir al terminar cada carga de fuentes. Sin esto, la medida hecha con
// la fuente de respaldo (más ancha) dejaba la lectura puesta aunque el dato ya cupiera (Firefox en la integración continua)
const onFontsLoaded = () => { if (props.inline) fit(); scheduleMeasure() }
let fontSet = null
onMounted(() => {
  mounted.value = true
  today.value = todayISO()
  if (!viewReady.value) {
    view.value = firstOfMonth(normalized.value.start || today.value)
    focusDate.value = normalized.value.start || today.value
    viewReady.value = true
  }
  // Aviso (B-L7, #739): la raíz es un div y no va dentro de un <p> (el analizador cerraría el párrafo en SSR)
  try { if (process.env.NODE_ENV !== 'production' && root.value && root.value.parentElement && root.value.parentElement.closest('p')) warnOnce('in-p', 'la raíz está dentro de un <p> (usa un div).') } catch {}
  // Un solo observador: la raíz en línea (uno o dos meses) y, con el slot day, la superficie (lectura del día, #952)
  if ((props.inline || slots.day) && typeof ResizeObserver !== 'undefined' && root.value) {
    ro = new ResizeObserver(() => { if (props.inline) fit(); scheduleMeasure() })
    ro.observe(root.value)
    if (slots.day && surfaceEl.value) ro.observe(surfaceEl.value)
  }
  if (slots.day && typeof document !== 'undefined' && document.fonts && document.fonts.addEventListener) {
    fontSet = document.fonts
    fontSet.addEventListener('loadingdone', onFontsLoaded)
  }
  if (props.inline) nextTick(fit)
  if (props.inline) nextTick(scheduleMeasure)
  if (props.open && !props.inline) nextTick(() => show(fieldEls.value[0] || null))
})
onBeforeUnmount(() => {
  ro?.disconnect()
  fontSet?.removeEventListener('loadingdone', onFontsLoaded)
  if (typedTimer) clearTimeout(typedTimer)
  if (measureRaf) cancelAnimationFrame(measureRaf)
  if (isOpen.value) close(false)
})

// ---------- Marcado ----------
// inline: la raíz es la superficie y recibe todos los atributos (#895); con campo, solo class y style
const rootAttrs = computed(() => (props.inline ? attrs : { class: attrs.class, style: attrs.style }))
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
    // Slot trigger (B-L7, #739): la raíz sin caja (display: contents, coco)
    'g-datepicker--trigger': hasTriggerSlot.value,
    'g-datepicker--split': splitOn.value,
    // Slot day (#778): todas las celdas toman la forma de «día con contenido» de coco
    'g-datepicker--day-content': Boolean(slots.day),
    // El dato del día no cabe en alguna celda (#952): la lectura del día lo enseña
    'is-day-content-hidden': Boolean(slots.day) && dayHidden.value,
    'g-datepicker--has-output': hasOutput.value,
    'is-open': isOpen.value,
    'is-disabled': isDisabled.value,
    'is-readonly': isReadonly.value,
    'is-invalid': invalid.value,
    'is-warning': ff.ownMessage.value?.type === 'warning',
    'is-valid': ff.ownMessage.value?.type === 'valid',
    // La pone GForm en un envío con errores o showErrors() (#304); el CSS de la sacudida es de coco
    'is-rejected': ff.rejected.value
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

try {
  if (process.env.NODE_ENV !== 'production') {
    const l = props.labels || {}
    // r02 (#1025): el salto a mes y año existe en todos los tamaños, así que sus seis claves se piden siempre; un solo aviso
    const miss = ['prev', 'next', 'chooseMonth', 'chooseYear', 'prevYear', 'nextYear', 'prevYears', 'nextYears'].filter((k) => !l[k])
    if (miss.length) warnOnce('nav', `necesita ${miss.map((k) => `labels.${k}`).join(', ')}: sin ellos los botones de mes, de año y de página quedan sin nombre.`)
    if (!props.inline && !l.dialog) warnOnce('dialog', 'necesita labels.dialog (nombre accesible del popover).')
    if (!props.inline && !l.close) warnOnce('close', 'necesita labels.close (nombre del botón de cierre de la hoja móvil).')
    if (!props.inline && !hasTriggerSlot.value) {
      if (splitOn.value) {
        if (!props.labelStart || !props.labelEnd) warnOnce('split', 'con split necesita labelStart y labelEnd.')
      } else if (!hasLabel.value && !attrs['aria-label'] && !attrs['aria-labelledby']) {
        warnOnce('label', 'necesita label, slot label, aria-label o aria-labelledby para tener un nombre accesible.')
      }
    }
    // Noches y salida (#739)
    if (!isRange.value && (props.disabledNights || props.minNights || props.maxNights)) warnOnce('nights-single', 'disabledNights, minNights y maxNights solo valen con mode="range".')
    if (props.maxNights < props.minNights) warnOnce('nights-max', `maxNights (${props.maxNights}) es menor que minNights (${props.minNights}).`)
    if (props.inline) {
      // density no: aprieta también la superficie en línea (#1022)
      const fieldProps = ['label', 'hint', 'error', 'placeholder', 'required', 'name', 'split', 'size', 'rounded', 'block', 'variant']
      const given = fieldProps.filter((k) => attrs[k] !== undefined)
      // (los props declarados no llegan a attrs: se comprueban contra sus valores no predeterminados)
      const set = [props.label, props.hint, props.error, props.placeholder, props.required, props.name, props.split, props.block, props.rounded].some(Boolean)
      if (given.length || set) warnOnce('inline-fields', 'con inline se ignoran las props de campo (label, hint, error, placeholder, required, name, split, size, rounded, block, variant).')
    }
  }
} catch {}

defineExpose({
  open: () => show(fieldEls.value[0] || null),
  close: () => close(true),
  focus: () => (isOpen.value || props.inline ? (level.value === 'days' ? focusDay() : focusPick()) : fieldEls.value[0]?.focus())
})
</script>

<template>
  <div ref="root" v-bind="rootAttrs" :class="classes" @animationend="ff.onRejectEnd" @animationcancel="ff.onRejectEnd">
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
        <!-- r02 (#1020): cada mes es head + escenario (__stage) con la raíz de la vista (__view) dentro. En meses y años hay una
             sola sección con una cabecera, que ocupa la caja de los meses visibles (con dos meses, las dos columnas) -->
        <div :class="['g-datepicker__months', { 'g-datepicker__months--pair': n === 2 }]" @pointerdown="onSwipeDown" @pointerup="onSwipeUp">
          <template v-if="level === 'days'">
            <section v-for="m in grid" :key="m.index" class="g-datepicker__month" :aria-labelledby="monthId(m.index)">
              <div class="g-datepicker__head">
                <button
                  class="g-datepicker__nav g-datepicker__nav--prev"
                  type="button"
                  :hidden="m.index !== 0 || undefined"
                  :aria-hidden="m.index !== 0 ? 'true' : undefined"
                  :tabindex="m.index !== 0 ? -1 : undefined"
                  :aria-label="L.prev"
                  :disabled="isDisabled || undefined"
                  @click="go(-1)"
                ><GIcon name="chevron-left" /></button>
                <h3 class="g-datepicker__title"><button
                  class="g-datepicker__title-part g-datepicker__title-part--month"
                  type="button"
                  :aria-label="L.chooseMonth ? `${m.name}, ${L.chooseMonth}` : undefined"
                  :disabled="isDisabled || undefined"
                  @click="toMonths(m.index)"
                >{{ m.name }}<GIcon name="chevron-down" /></button> <button
                  class="g-datepicker__title-part g-datepicker__title-part--year"
                  type="button"
                  :aria-label="L.chooseYear ? `${m.year}, ${L.chooseYear}` : undefined"
                  :disabled="isDisabled || undefined"
                  @click="toYears(m.index)"
                >{{ m.year }}<GIcon name="chevron-down" /></button></h3>
                <button
                  class="g-datepicker__nav g-datepicker__nav--next"
                  type="button"
                  :hidden="m.index !== grid.length - 1 || undefined"
                  :aria-hidden="m.index !== grid.length - 1 ? 'true' : undefined"
                  :tabindex="m.index !== grid.length - 1 ? -1 : undefined"
                  :aria-label="L.next"
                  :disabled="isDisabled || undefined"
                  @click="go(1)"
                ><GIcon name="chevron-right" /></button>
                <span :id="monthId(m.index)" class="g-datepicker__sr g-datepicker__title-live" aria-live="polite">{{ m.live }}</span>
              </div>
              <div class="g-datepicker__stage">
                <div class="g-datepicker__view g-datepicker__view--days" :data-zoom="zoom ? zoom.dir : undefined" :style="zoomVars(m.index, grid.length)">
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
                              'is-cap-end': cell.st.capEnd,
                              'is-open-start': cell.st.openStart,
                              'is-open-end': cell.st.openEnd
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
                                'is-inactive': cell.st.inactive,
                                'is-checkout-only': cell.st.checkoutOnly
                              }"
                              type="button"
                              :data-date="cell.iso"
                              :tabindex="cell.iso === tabbable ? 0 : -1"
                              :aria-label="cell.label"
                              :aria-disabled="cell.st.disabled ? 'true' : undefined"
                              :disabled="isDisabled || undefined"
                              @focus="onDayFocus(cell.iso)"
                            >{{ nf.format(cell.day) }}<GIcon v-if="cell.st.today" class="g-datepicker__today-dot" name="circle" filled /><slot name="day" v-bind="dayScope(cell)" /></button>
                          </td>
                        </template>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </template>
          <section v-else class="g-datepicker__month">
            <div class="g-datepicker__head">
              <button
                :class="['g-datepicker__nav', 'g-datepicker__nav--prev', level === 'months' ? 'g-datepicker__nav--year' : 'g-datepicker__nav--years']"
                type="button"
                :aria-label="level === 'months' ? L.prevYear : L.prevYears"
                :aria-disabled="edgePrev ? 'true' : undefined"
                :disabled="isDisabled || undefined"
                @click="level === 'months' ? stepYear(-1) : stepPage(-1)"
              ><GIcon name="chevron-left" /></button>
              <h3 v-if="level === 'months'" class="g-datepicker__title"><button
                class="g-datepicker__title-part g-datepicker__title-part--year"
                type="button"
                :aria-label="L.chooseYear ? `${yearText(vy)}, ${L.chooseYear}` : undefined"
                :disabled="isDisabled || undefined"
                @click="toYears(0)"
              >{{ yearText(vy) }}<GIcon name="chevron-down" /></button></h3>
              <h3 v-else class="g-datepicker__title">{{ yearsText(ys, ys + 11) }}</h3>
              <button
                :class="['g-datepicker__nav', 'g-datepicker__nav--next', level === 'months' ? 'g-datepicker__nav--year' : 'g-datepicker__nav--years']"
                type="button"
                :aria-label="level === 'months' ? L.nextYear : L.nextYears"
                :aria-disabled="edgeNext ? 'true' : undefined"
                :disabled="isDisabled || undefined"
                @click="level === 'months' ? stepYear(1) : stepPage(1)"
              ><GIcon name="chevron-right" /></button>
            </div>
            <div class="g-datepicker__stage">
              <div :key="level" :class="['g-datepicker__view', `g-datepicker__view--${level}`]" :data-zoom="zoom ? zoom.dir : undefined" :style="zoomVars(0, 1)">
                <table
                  :class="['g-datepicker__grid', `g-datepicker__grid--${level}`]"
                  role="grid"
                  :aria-label="pickName"
                  :aria-describedby="level === 'years' && L.typeYear ? yearsHintId : undefined"
                  @click="onPickClick"
                  @keydown="onPickKeydown"
                  @focusin="onPickFocus"
                >
                  <tbody>
                    <tr v-for="(row, ri) in picks" :key="ri">
                      <td v-for="c in row" :key="c.key" role="gridcell" :aria-selected="c.has && !isRange ? 'true' : 'false'">
                        <button
                          class="g-datepicker__pick"
                          :class="{ 'is-current': c.cur, 'is-selected': c.has && !isRange, 'is-in-value': c.has && isRange, 'is-disabled': c.off }"
                          type="button"
                          :data-value="c.key"
                          :tabindex="c.tab ? 0 : -1"
                          :aria-label="c.label"
                          :aria-disabled="c.off ? 'true' : undefined"
                          :disabled="isDisabled || undefined"
                        >{{ c.text }}<GIcon v-if="c.has && isRange" name="circle" filled /></button>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div v-if="level === 'years' && L.typeYear" class="g-datepicker__years-hint"><span :id="yearsHintId">{{ L.typeYear }}</span><span class="g-datepicker__typed" aria-hidden="true"><span v-for="(d, di) in typedDigits" :key="di" class="g-datepicker__typed-digit">{{ d }}</span></span></div>
              </div>
            </div>
          </section>
        </div>
        <div v-if="$slots.day" class="g-datepicker__day-readout" aria-hidden="true"><template v-if="activeCell"><span>{{ fmtReadout.format(parseISO(activeCell.iso)) }}</span><slot name="day" v-bind="dayScope(activeCell)" /></template></div>
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
