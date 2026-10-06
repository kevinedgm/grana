<script setup>
// GTimeField · una hora del reloj que se escribe como se dice (dueño: bruno)
// Contrato: design/contracts/time-field.md (DECISIONS.md #400 a #414; concepto A «La hora dicha», #407) · Estructura:
// design/lab/time-field/r01/ y r02/ (kiwi) · Estilo: GTimeField.css (coco). COMPONE GInput (#400) con sus slots internos
// `field` (la celda con espejo y el <input role="spinbutton">, la lectura en palabras y el oculto canónico) y `end`
// (a. m./p. m. en 12 h o las dos lecturas en 24 h, y el medidor del mínimo), y el añadido interno N4 (error propio, #409).
// El motor es la utilidad interna utils/timeInput.js (sin estado ni DOM, en segundos).
import { computed, inject, mergeProps, nextTick, onBeforeUnmount, onMounted, provide, ref, unref, useAttrs, useId, useSlots, watch } from 'vue'
import { oneOf } from '../../utils/oneOf.js'
import { DAY, canonical, filterTyped, formatTime, fromCanonical, isValidLocale, localeInfo, parseTime, period, stepTime, valueText } from '../../utils/timeInput.js'
import { observeSize } from '../../utils/sizeObserver.js'
import GInput from '../GInput/GInput.vue'
import { formKey, layoutKey, nextFrame, ownFieldKey } from '../GForm/formContext.js'

defineOptions({ name: 'GTimeField', inheritAttrs: false })

const HALF = 43200

const props = defineProps({
  modelValue: { type: String, default: null },
  min: { type: String, default: undefined },
  max: { type: String, default: undefined },
  step: { type: Number, default: 1, validator: (v) => Number.isInteger(v) && v >= 1 },
  seconds: Boolean,
  locale: { type: String, default: undefined },
  hourCycle: { type: String, default: undefined, validator: oneOf(['h12', 'h23']) },
  labels: { type: Object, default: () => ({}) },
  prefix: { type: String, default: undefined },
  suffix: { type: String, default: undefined },
  prefixLabel: { type: String, default: undefined },
  suffixLabel: { type: String, default: undefined },
  name: { type: String, default: undefined },
  label: { type: String, default: undefined },
  hint: { type: String, default: undefined },
  error: { type: String, default: undefined },
  warning: { type: String, default: undefined },
  valid: { type: String, default: undefined },
  output: { type: String, default: undefined },
  required: Boolean,
  mark: { type: Boolean, default: undefined },
  readonly: { type: Boolean, default: undefined },
  disabled: { type: Boolean, default: undefined },
  size: { type: String, default: 'md', validator: oneOf(['xs', 'sm', 'md', 'lg', 'xl']) },
  variant: { type: String, default: 'outline', validator: oneOf(['outline', 'soft']) },
  density: { type: String, default: undefined, validator: oneOf(['default', 'comfortable', 'compact']) },
  color: { type: String, default: undefined, validator: oneOf(['brand', 'accent', 'neutral', 'success', 'warning', 'danger', 'info']) },
  rounded: { type: String, default: undefined, validator: oneOf(['none', 'xs', 'sm', 'md', 'lg', 'xl', 'pill']) },
  block: { type: Boolean, default: undefined },
  id: { type: String, default: undefined }
})

// `change` propio (hora confirmada, una vez por gesto): declarado para que la escucha del consumidor no llegue al `change`
// nativo del <input> (lección de `emits`). El resto de eventos llega nativo al <input> visible.
const emit = defineEmits(['update:modelValue', 'change'])

const attrs = useAttrs()
const slots = useSlots()
const uid = useId()
const inputId = computed(() => props.id || `g-time-field-${uid}`)

// ---------- Avisos (una vez por instancia) ----------
const isDev = typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production'
const warned = new Set()
function warnOnce(key, text) {
  if (!isDev || warned.has(key)) return
  warned.add(key)
  console.warn(`[Grana GTimeField] ${text}`)
}

// ---------- Contexto (la precedencia de useFormField: prop › sub‑contexto › GForm › default) ----------
// El campo lo registra GInput; aquí se resuelven readonly/disabled para los pasos y los botones, y se toma setIntrinsicMin
const form = inject(formKey, null)
const layout = inject(layoutKey, null)
const isReadonly = computed(() => props.readonly ?? unref(layout?.readonly) ?? unref(form?.readonly) ?? false)
const isDisabled = computed(() => props.disabled ?? unref(layout?.disabled) ?? unref(form?.disabled) ?? false)
const editable = computed(() => !isDisabled.value && !isReadonly.value)

// ---------- Props resueltas ----------
function limit(key) {
  const v = props[key]
  if (v === undefined || v === null || v === '') return null
  const s = fromCanonical(v)
  if (s === null) warnOnce(key, `${key} «${String(v)}» no es una hora «HH:mm» o «HH:mm:ss»: se ignora ese límite.`)
  return s
}
const minSec = computed(() => limit('min'))
const maxSec = computed(() => limit('max'))
const stepSize = computed(() => {
  if (Number.isInteger(props.step) && props.step >= 1) return props.step
  warnOnce('step', `step ${String(props.step)} no es un entero ≥ 1: se usa 1.`)
  return 1
})

// Modelo: «HH:mm[:ss]» o null; undefined y '' = null sin aviso; otra cosa = null con aviso; segundos sin `seconds` se
// ignoran con aviso (el campo no emite por su cuenta)
function normalize(v) {
  if (v === undefined || v === null || v === '') return null
  const s = typeof v === 'string' ? fromCanonical(v) : null
  if (s === null) {
    warnOnce('format', `modelValue ${JSON.stringify(v) ?? String(v)} no es una hora «HH:mm» o «HH:mm:ss»: se lee como vacío (null).`)
    return null
  }
  if (!props.seconds && s % 60) {
    warnOnce('seconds', `modelValue «${v}» lleva segundos sin seconds: se muestra y se envía sin ellos.`)
    return s - (s % 60)
  }
  return s
}
const out = (sec) => (sec == null ? null : canonical(sec, props.seconds))
const current = ref(normalize(props.modelValue))
// Último confirmado (canónico o null): al montar, con cada `change` y con cada cambio desde la aplicación (sin emitir)
let lastConfirmed = out(current.value)

// ---------- Idioma: prop › lang del ancestro más cercano › navigator.language (al montar) ----------
const mounted = ref(false)
const domLang = ref(null)
const info = computed(() => {
  const hc = props.hourCycle === 'h12' || props.hourCycle === 'h23' ? props.hourCycle : undefined
  if (props.locale && isValidLocale(props.locale)) return localeInfo(props.locale, hc)
  if (!mounted.value) return null // SSR y primer render sin locale: texto canónico (sin desajuste de hidratación)
  const nav = typeof navigator !== 'undefined' ? navigator.language : undefined
  for (const cand of [domLang.value, nav]) if (cand && isValidLocale(cand)) return localeInfo(cand, hc)
  return localeInfo(undefined, hc)
})
watch(() => props.locale, (l) => {
  if (l && !isValidLocale(l)) warnOnce('locale', `locale «${l}» no lo acepta Intl: se usa el idioma del documento.`)
}, { immediate: true })
// Para interpretar antes de conocer el idioma (SSR sin locale: el texto es el canónico, que se lee en 24 h)
const writeInfo = () => info.value || localeInfo('en-US', 'h23')
const h12 = computed(() => info.value?.cycle === 'h12')

const display = (sec) => (sec == null ? '' : info.value ? formatTime(sec, info.value, props.seconds) : canonical(sec, props.seconds))

// ---------- Texto del campo ----------
const focused = ref(false)
const text = ref(display(current.value))
const fieldEl = ref(null)
const valueEl = ref(null)
const measureEl = ref(null)
const measureTextEl = ref(null)
// Mitad pendiente (a. m./p. m. pulsado sin valor) y la última hora vista entera: deciden una hora 1–12 sin marcador (#408)
const pendingHalf = ref(null)
const focusPrev = ref(current.value)
// Ambigüedad de 24 h (las dos lecturas, #407): solo la pone lo ESCRITO (un «9:00» formateado o elegido ya no lo es)
const amb = ref(null)
let composing = false

function setSel(el, pos) {
  try { el.setSelectionRange(pos, pos) } catch { /* sin selección */ }
}
function writeText(t) {
  text.value = t
  const el = fieldEl.value
  if (el && el.value !== t) el.value = t
}
watch(info, () => { if (!composing && current.value != null) writeText(display(current.value)) })
watch(() => props.seconds, () => { if (current.value != null) writeText(display(current.value)) })

const prevHint = () => (pendingHalf.value === 'pm' ? HALF : pendingHalf.value === 'am' ? 0 : focusPrev.value)
const parse = (t) => parseTime(t, writeInfo(), { seconds: props.seconds, prev: prevHint(), min: minSec.value, max: maxSec.value })
// Lo que hay en la caja ahora: el texto formateado de la hora vigente es esa hora (sin volver a interpretarlo)
function parsedNow() {
  if (current.value != null && text.value === display(current.value)) return { status: 'ok', value: current.value, ambiguous: false }
  return parse(text.value)
}

// Cambio desde la aplicación: actualiza el último confirmado sin emitir; reescribe el texto solo si no coincide
watch(() => props.modelValue, (v) => {
  const n = normalize(v)
  if (n === current.value) return
  current.value = n
  lastConfirmed = out(n)
  amb.value = null
  pendingHalf.value = null
  focusPrev.value = n
  writeText(display(n))
})

function setModel(v) {
  if (v === current.value) return
  current.value = v
  emit('update:modelValue', out(v))
}
function emitChangeIfNeeded() {
  const c = out(current.value)
  if (c === lastConfirmed) return
  lastConfirmed = c
  emit('change', c)
}
// Fija una hora entera (paso, botón, pegado): formatea, sin lecturas, el cursor al final si el campo tiene el foco
function setValue(v) {
  setModel(v)
  writeText(display(v))
  amb.value = null
  focusPrev.value = v
  const el = fieldEl.value
  if (el && focused.value) setSel(el, el.value.length)
}

// ---------- Contexto de GInput (slot interno `field`) ----------
let ctx = null
const notifyInput = () => ctx?.notifyInput()
const notifyChange = () => ctx?.notifyChange()
function setFieldEl(el) {
  fieldEl.value = el || null
  ctx?.setControl(el || null)
}

// ---------- Error propio (#409; form.md §2, input.md N4) ----------
// Con texto que no es una hora: labels.invalid o, sin él, un espacio (bloquea sin texto, #372). Se calcula siempre; lo que
// decide si se VE es el revelado ('blur': al salir, con las reglas de GForm; sin GForm, el del propio campo)
const ownError = computed(() => {
  if (!text.value.trim() || parsedNow().status !== 'invalid') return ''
  return props.labels?.invalid ? String(props.labels.invalid) : ' '
})
let ownApi = null
provide(ownFieldKey, {
  ownError: () => ownError.value,
  ownTarget: () => fieldEl.value,
  ownReveal: 'blur',
  connect: (api) => { ownApi = api }
})
// Fuera de GForm, la validez nativa lleva el mismo texto (un envío nativo o checkValidity() no salen con una hora ilegible)
function applyValidity() {
  const el = fieldEl.value
  if (el && typeof el.setCustomValidity === 'function') el.setCustomValidity(form ? '' : ownError.value)
}
watch(ownError, applyValidity, { flush: 'post' })

// ---------- Escritura ----------
function applyTyped(el) {
  const raw = el.value
  const f = filterTyped(raw, writeInfo())
  if (f !== raw) {
    // Lo que no entra se quita y el cursor se conserva
    const pos = Math.max(0, (el.selectionStart ?? raw.length) - (raw.length - f.length))
    el.value = f
    setSel(el, pos)
  }
  text.value = f
  if (!f.trim()) pendingHalf.value = null // se vacía: la mitad pendiente se suelta
  const r = parse(f)
  if (r.status === 'ok') {
    setModel(r.value)
    amb.value = r.ambiguous && !h12.value ? { value: r.value, alt: r.alt } : null
  } else {
    setModel(null)
    amb.value = null
  }
}
function onInput(e) {
  if (composing || e.isComposing) return
  applyTyped(e.target)
}
function onCompositionstart() {
  composing = true
}
function onCompositionend(e) {
  composing = false
  applyTyped(e.target)
}
function onPaste(e) {
  if (!editable.value) return
  const data = e.clipboardData
  if (!data) return
  const r = parse(data.getData('text/plain') || data.getData('text'))
  if (r.status !== 'ok') return // sigue su curso por el filtro
  e.preventDefault()
  setValue(r.value)
  notifyInput()
}
function onFocus() {
  focused.value = true
  focusPrev.value = current.value
}
// Confirmar (salir o Enter): formatea, conserva lo que no es una hora y emite `change` si la hora confirmada cambió
function commit() {
  const r = parsedNow()
  if (r.status === 'ok') {
    setModel(r.value)
    writeText(display(r.value))
    focusPrev.value = r.value
  } else {
    setModel(null)
    if (r.status === 'empty' && text.value) writeText('')
  }
  amb.value = null
  pendingHalf.value = null
  emitChangeIfNeeded()
}
function onBlur() {
  focused.value = false
  keyStepped = false
  commit()
}

// ---------- Teclado y pasos (#405) ----------
let keyStepped = false
const STEP_KEYS = { ArrowUp: [1, false], ArrowDown: [-1, false], PageUp: [1, true], PageDown: [-1, true] }
// La hora del reloj del dispositivo (sin zona, #411): solo en el cliente y solo en el gesto
function nowSec() {
  const d = new Date()
  return d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds()
}
function doStep(dir, big) {
  const r = parsedNow()
  const from = r.status === 'ok' ? r.value : null
  const next = stepTime(from, dir, { big, step: stepSize.value, min: minSec.value, max: maxSec.value, now: nowSec(), seconds: props.seconds })
  if (next === from && text.value === display(from)) return false
  setValue(next)
  notifyInput() // flechas = escritura (el error se revela al salir)
  return true
}
function onKeydown(e) {
  if (composing || e.isComposing) return
  if (e.key === 'Enter') {
    commit()
    ownApi?.revealOwn?.() // sin GForm, Enter también revela (dentro, el envío implícito revela todos)
    return // el envío implícito sigue
  }
  if (!editable.value || e.altKey || e.ctrlKey || e.metaKey) return
  const m = STEP_KEYS[e.key]
  if (m) {
    e.preventDefault()
    if (doStep(m[0], m[1] || e.shiftKey)) keyStepped = true
    return
  }
  // 12 h: con la hora escrita entera y formateada, «a»/«p» (o la primera letra del marcador del idioma) cambian la mitad
  const i = info.value
  if (i && i.cycle === 'h12' && e.key.length === 1 && current.value != null && text.value === display(current.value)) {
    const k = e.key.toLowerCase()
    const isA = k === 'a' || k === i.amKey[0]
    const isP = k === 'p' || k === i.pmKey[0]
    if (isA === isP) return
    e.preventDefault()
    const isPm = current.value >= HALF
    if (isP !== isPm) {
      setValue((current.value + HALF) % DAY)
      notifyInput()
    }
  }
}
// Fin del gesto de teclado (keyup de la tecla de paso): un `change` y, para GForm, un cambio (sube dirty, no revela)
function onKeyup(e) {
  if (!STEP_KEYS[e.key] || !keyStepped) return
  keyStepped = false
  notifyChange()
  emitChangeIfNeeded()
}

// ---------- 12 h: a. m./p. m. (#406) ----------
const hasLabel = computed(() => Boolean(props.label || slots.label))
function naming(own, txt) {
  const id = `${inputId.value}-${own}`
  if (hasLabel.value) return { 'aria-labelledby': `${id} ${inputId.value}-label` }
  if (attrs['aria-labelledby']) return { 'aria-labelledby': `${id} ${attrs['aria-labelledby']}` }
  if (attrs['aria-label']) return { 'aria-label': `${txt} ${attrs['aria-label']}` }
  return { 'aria-labelledby': id }
}
const showHalves = computed(() => h12.value && !isReadonly.value)
const halfOn = (half) => (current.value != null ? (half === 'pm') === current.value >= HALF : pendingHalf.value === half)
const halves = computed(() => {
  const i = info.value
  if (!i) return []
  return [['am', i.am], ['pm', i.pm]].map(([half, txt]) => ({ half, txt, id: `${inputId.value}-${half}`, on: halfOn(half), naming: naming(half, txt), pick: () => pickHalf(half) }))
})
// Puntero: el foco se queda donde estaba y, sin foco previo, el campo no se enfoca (sin teclado en un móvil)
function onButtonDown(e) {
  if (e.button === 0) e.preventDefault()
}
function pickHalf(half) {
  if (!editable.value) return
  if (current.value == null) {
    pendingHalf.value = half // la mitad de la próxima hora escrita (se ve pulsada)
    return
  }
  if ((half === 'pm') !== current.value >= HALF) setValue((current.value + HALF) % DAY)
  notifyChange()
  emitChangeIfNeeded()
}

// ---------- A · la hora dicha (#407) ----------
const formatted = computed(() => display(current.value))
const word = computed(() => (mounted.value && info.value && current.value != null ? period(current.value, info.value) : ''))
// Las dos lecturas (24 h): con foco, una hora a secas de 1 a 11 escrita sin cero delante, nunca en solo lectura
const showChoices = computed(() => mounted.value && focused.value && editable.value && !h12.value && amb.value != null && current.value != null)
const choices = computed(() => {
  if (!showChoices.value) return []
  const i = info.value
  return [amb.value.value, amb.value.alt].map((v, k) => ({
    value: v,
    on: k === 0,
    time: formatTime(v, i, props.seconds),
    word: period(v, i),
    id: `${inputId.value}-choice-${k}`,
    naming: naming(`choice-${k}`, `${formatTime(v, i, props.seconds)} ${period(v, i)}`.trim()),
    pick: () => pickChoice(v)
  }))
})
function pickChoice(v) {
  if (!editable.value) return
  setValue(v)
  notifyChange()
  emitChangeIfNeeded()
}
const showReading = computed(() => Boolean(word.value) && !formatted.value.includes(word.value) && !showChoices.value)
// La hora entendida delante, mientras lo escrito aún no es su forma final («930» → «9:30»)
const readingTime = computed(() => (focused.value && current.value != null && text.value.trim() !== formatted.value ? formatted.value : ''))
// La palabra entra (is-entering) solo cuando la franja cambia con el foco en el campo: el nodo se crea de nuevo (otra key)
// con la clase; nunca se alterna en uno existente. Al ocultarse, la próxima aparición es sin movimiento
const wordKey = ref(0)
const enteringKey = ref(-1)
// La última franja vista con el foco: pasar por un texto sin hora («12:3») vacía la palabra, pero al volver a «12:35» no
// entra de nuevo si la franja es la misma
let seenWord = ''
watch(focused, (f) => { if (f) seenWord = word.value })
watch([word, showReading], ([w, vis], [ow, ovis]) => {
  if (w !== ow) {
    wordKey.value++
    enteringKey.value = vis && focused.value && w && w !== seenWord ? wordKey.value : -1
    if (w && focused.value) seenWord = w
  } else if (!vis && ovis) enteringKey.value = -1
})

// Si el par no cabe en la caja, data-compact (la hora en vez de la franja): nunca reparte la fila ni desborda
const compact = ref(false)
let controlEl = null
let offChoices = null
function checkCompact() {
  if (!showChoices.value || !controlEl) return
  // Los botones tapan el borde final de la caja (margen negativo): ese borde no es desborde
  const border = typeof getComputedStyle === 'function' ? parseFloat(getComputedStyle(controlEl).borderInlineEndWidth) || 0 : 0
  if (controlEl.scrollWidth > controlEl.clientWidth + border + 0.5) compact.value = true
}
function recheckCompact() {
  if (!showChoices.value) return
  compact.value = false
  nextTick(checkCompact)
}
watch(showChoices, (on) => {
  offChoices?.()
  offChoices = null
  compact.value = false
  if (!on) return
  nextTick(checkCompact)
  if (controlEl) offChoices = observeSize(controlEl, recheckCompact)
})

// Pulsar el área vacía de la caja, la lectura, el prefijo, el sufijo o el output enfoca con el cursor al final (A1)
function onBoxDown(e) {
  if (e.button !== 0 || isDisabled.value) return
  const el = fieldEl.value
  const t = e.target
  if (!el || t === el || (t.closest && t.closest('.g-time-field__halves, .g-time-field__choices'))) return
  e.preventDefault()
  el.focus()
  setSel(el, el.value.length)
}

// ---------- Mínimo publicado en una GFormRow (#410) ----------
const canPublish = computed(() => Boolean(layout && typeof layout.setIntrinsicMin === 'function'))
let published = 0
let publishedEl = null
function publish(px) {
  if (!layout || typeof layout.setIntrinsicMin !== 'function') return
  const el = valueEl.value?.closest('.g-input') || null
  if (publishedEl && publishedEl !== el) {
    layout.setIntrinsicMin(publishedEl, 0)
    publishedEl = null
    published = 0
  }
  if (!el || Math.abs(px - published) < 0.5) return
  published = px
  publishedEl = px ? el : null
  layout.setIntrinsicMin(el, px)
}
// Texto de referencia: las 24 horas a los :59 (y :59 s) en el idioma y ciclo, y el placeholder (una línea cada uno)
const referenceText = computed(() => {
  const i = info.value
  const list = []
  if (i) for (let h = 0; h < 24; h++) list.push(formatTime(h * 3600 + 59 * 60 + (props.seconds ? 59 : 0), i, props.seconds))
  else list.push(canonical(23 * 3600 + 59 * 60 + 59, props.seconds))
  if (attrs.placeholder != null) list.push(String(attrs.placeholder))
  return list.join('\n')
})
// Mínimo = antes de la celda (borde, relleno, prepend, prefijo) + el texto de referencia (+ el hueco del cursor) + sufijo y
// output con su separación + a. m./p. m. en 12 h (la copia inerte del medidor, con su borde final; también en solo lectura) o
// el final de la caja. Por posiciones, nunca «caja − celda»; sin la lectura (se recorta) ni las dos lecturas (se compactan)
function measure() {
  if (!canPublish.value) return publish(0)
  const cell = valueEl.value
  const meas = measureEl.value
  const ctl = cell?.closest('.g-input__control')
  if (!cell || !meas || !ctl || typeof getComputedStyle !== 'function') return
  const cs = getComputedStyle(ctl)
  const rtl = cs.direction === 'rtl'
  const S = (r) => (rtl ? -r.right : r.left)
  const box = ctl.getBoundingClientRect()
  if (!(box.width > 0)) return
  const gap = parseFloat(cs.columnGap) || 0
  const c = cell.getBoundingClientRect()
  const textW = measureTextEl.value ? measureTextEl.value.getBoundingClientRect().width : 0
  const ref = textW + 1 // el hueco del cursor del espejo (§7)
  let after = 0
  let past = false
  for (const k of ctl.children) {
    if (k === cell) { past = true; continue }
    if (!past || k === meas || k.matches('.g-time-field__reading, .g-time-field__halves, .g-time-field__choices')) continue
    const kcs = getComputedStyle(k)
    if (kcs.display === 'none' || kcs.position === 'absolute' || kcs.position === 'fixed') continue
    const r = k.getBoundingClientRect()
    if (r.width > 0) after += gap + r.width
  }
  let tail
  if (h12.value) {
    let halvesW = 0
    for (const k of meas.querySelectorAll('.g-time-field__half')) halvesW += k.getBoundingClientRect().width
    // La copia final lleva el borde y los botones llegan al borde externo de la caja; en solo lectura cuentan igual (#266)
    tail = gap + halvesW
  } else {
    tail = (parseFloat(cs.paddingInlineEnd) || 0) + (parseFloat(cs.borderInlineEndWidth) || 0)
  }
  publish(Math.ceil((S(c) - S(box)) + ref + after + tail))
}
let measureQueued = false
function scheduleMeasure() {
  if (!mounted.value || measureQueued) return
  measureQueued = true
  nextTick(() => nextFrame(() => {
    measureQueued = false
    measure()
  }))
}
watch(
  () => [canPublish.value, referenceText.value, info.value?.cycle, props.prefix, props.suffix, props.prefixLabel, props.suffixLabel, props.output, props.size, props.density, unref(layout?.density), unref(form?.density), isReadonly.value],
  () => scheduleMeasure()
)
let offMeasure = null
watch(measureEl, (m) => {
  offMeasure?.()
  offMeasure = m ? observeSize(m, scheduleMeasure) : null
})
function onFonts() {
  scheduleMeasure()
}

// ---------- Montaje ----------
onMounted(() => {
  const root = valueEl.value?.closest('.g-input')
  domLang.value = root?.closest('[lang]')?.getAttribute('lang') || null
  mounted.value = true
  if (current.value != null) writeText(display(current.value))
  lastConfirmed = out(current.value)
  controlEl = valueEl.value?.closest('.g-input__control') || null
  controlEl?.addEventListener('pointerdown', onBoxDown)
  applyValidity()
  if (typeof document !== 'undefined' && document.fonts) {
    document.fonts.ready?.then(onFonts)
    document.fonts.addEventListener?.('loadingdone', onFonts)
  }
  scheduleMeasure()
  if (isDev && !props.labels?.invalid) warnOnce('invalid', 'sin labels.invalid: un texto que no es una hora bloqueará el envío sin mensaje.')
})
onBeforeUnmount(() => {
  controlEl?.removeEventListener('pointerdown', onBoxDown)
  controlEl = null
  offChoices?.()
  offMeasure?.()
  if (typeof document !== 'undefined') document.fonts?.removeEventListener?.('loadingdone', onFonts)
  publish(0)
})

// ---------- Atributos ----------
const isListener = (k) => /^on[A-Z]/.test(k)
// A GInput: todo salvo escuchas y `type` (la raíz recibe class/style; el resto llega en `bind` al <input>)
const forwardAttrs = computed(() => {
  void attrs.class // registra la dependencia aunque no haya atributos
  const o = {}
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class' || k === 'style' || k === 'type' || isListener(k)) continue
    o[k] = v
  }
  return o
})
// Escuchas del consumidor: al <input> visible, DESPUÉS de los manejadores del contexto y de los propios
const listenerAttrs = computed(() => {
  void attrs.class
  const o = {}
  for (const [k, v] of Object.entries(attrs)) if (isListener(k)) o[k] = v
  return o
})
const ownHandlers = { onInput, onKeydown, onKeyup, onFocus, onBlur, onPaste, onCompositionstart, onCompositionend }

const ariaValue = computed(() => {
  const v = current.value
  const a = {}
  const k = props.seconds ? 1 : 60
  if (v != null) {
    a['aria-valuenow'] = Math.floor(v / k)
    // La franja, solo en el cliente (las tablas de Intl pueden diferir entre el servidor y el navegador)
    a['aria-valuetext'] = mounted.value && info.value ? valueText(v, info.value, props.seconds) : display(v)
  } else if (text.value) {
    a['aria-valuetext'] = text.value // sin interpretar: el lector dice lo que hay en la caja
  }
  const lo = minSec.value
  const hi = maxSec.value
  if (lo != null && hi != null && lo <= hi) {
    a['aria-valuemin'] = Math.floor(lo / k)
    a['aria-valuemax'] = Math.floor(hi / k)
  }
  return a
})
const dir = computed(() => info.value?.dir)

/** Propiedades del <input> visible: derivadas › bind de GInput (contexto primero + atributos) › propios › escuchas › fijos. */
function fieldProps(f) {
  ctx = f
  const { name: _n, required: _r, ...bind } = f.bind
  return mergeProps(
    { inputmode: 'numeric', autocomplete: 'off', spellcheck: 'false', autocorrect: 'off' },
    bind,
    { class: 'g-time-field__field', ...ownHandlers },
    listenerAttrs.value,
    {
      type: 'text',
      role: 'spinbutton',
      dir: dir.value,
      value: text.value,
      ...ariaValue.value,
      'aria-required': props.required ? 'true' : undefined,
      'aria-readonly': f.readonly ? 'true' : undefined
    }
  )
}

const canonicalValue = computed(() => canonical(current.value, props.seconds))
const mirrorText = computed(() => text.value || (attrs.placeholder != null ? String(attrs.placeholder) : ''))
const rootClasses = computed(() => ['g-time-field', { 'g-time-field--h12': h12.value, 'has-choices': showChoices.value }, attrs.class])
// Botones del final de la caja: a. m./p. m. (12 h) o las dos lecturas (24 h), nunca los dos
const buttons = computed(() => (showHalves.value ? halves.value : choices.value))
// Props que pasan tal cual a GInput (time-field.md «Reglas de props»)
const PASS = ['name', 'label', 'hint', 'error', 'warning', 'valid', 'output', 'required', 'mark', 'readonly', 'disabled', 'size', 'variant', 'density', 'color', 'rounded', 'block', 'prefix', 'suffix', 'prefixLabel', 'suffixLabel']
const inputProps = computed(() => {
  const o = { ...forwardAttrs.value, id: inputId.value, class: rootClasses.value, style: attrs.style }
  for (const k of PASS) o[k] = props[k]
  return o
})

// ---------- Avisos de montaje (1 y 8; 2 al montar; 3 y 4 en normalize; 5 en los límites; 6 en step; 7 en locale) ----------
if (isDev) {
  if (!hasLabel.value && !attrs['aria-label'] && !attrs['aria-labelledby']) warnOnce('name', 'necesita label, slot label, aria-label o aria-labelledby para tener un nombre accesible.')
  if (attrs.type !== undefined) warnOnce('type', 'type no aplica: el campo es siempre type="text" con role="spinbutton".')
  if (slots.append || slots.action) warnOnce('slots', 'los slots append y action no aplican (el final de la caja es de a. m./p. m. y de las lecturas): no se pintan.')
  void minSec.value
  void maxSec.value
  void stepSize.value
}
</script>

<template>
  <GInput v-bind="inputProps">
    <template v-if="slots.label" #label><slot name="label" /></template>
    <template v-if="slots.hint" #hint><slot name="hint" /></template>
    <template v-if="slots.error" #error><slot name="error" /></template>
    <template v-if="slots.prepend" #prepend><slot name="prepend" /></template>
    <template #field="f">
      <span ref="valueEl" class="g-time-field__value">
        <span class="g-time-field__mirror" aria-hidden="true" :dir="dir">{{ mirrorText }}</span>
        <input :ref="setFieldEl" v-bind="fieldProps(f)">
      </span>
      <span v-if="showReading" class="g-time-field__reading" aria-hidden="true" :dir="dir"><span v-if="readingTime" class="g-time-field__reading-time">{{ readingTime }}</span><span :key="wordKey" :class="['g-time-field__reading-word', { 'is-entering': enteringKey === wordKey }]">{{ word }}</span></span>
      <input v-if="name" type="hidden" :name="name" :value="canonicalValue" :disabled="f.disabled || undefined" :form="attrs.form">
    </template>
    <template #end="e">
      <span v-if="buttons.length" :class="showHalves ? 'g-time-field__halves' : 'g-time-field__choices'" :data-compact="!showHalves && compact ? '' : undefined">
        <button
          v-for="b in buttons"
          :key="b.id"
          type="button"
          :class="[showHalves ? 'g-time-field__half' : 'g-time-field__choice', { 'is-on': b.on }]"
          :data-half="b.half"
          tabindex="-1"
          :aria-pressed="b.on ? 'true' : 'false'"
          :aria-controls="inputId"
          v-bind="b.naming"
          :disabled="e.disabled || undefined"
          @pointerdown="onButtonDown"
          @click="b.pick()"
        ><span v-if="b.half" :id="b.id" class="g-time-field__half-text">{{ b.txt }}</span><span v-else :id="b.id"><span class="g-time-field__choice-time">{{ b.time }}</span> <span class="g-time-field__choice-word">{{ b.word }}</span></span></button>
      </span>
      <span v-if="canPublish && mounted" ref="measureEl" class="g-time-field__measure" aria-hidden="true"><span ref="measureTextEl">{{ referenceText }}</span><template v-if="h12"><span v-for="h in halves" :key="h.half" class="g-time-field__half">{{ h.txt }}</span></template></span>
    </template>
  </GInput>
</template>
