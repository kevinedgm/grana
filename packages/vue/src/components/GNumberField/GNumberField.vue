<script setup>
// GNumberField · campo numérico que se escribe (dueño: bruno)
// Contrato: design/contracts/number-field.md (DECISIONS.md #309 a #314) · Estructura: design/lab/number-field/r01/ (kiwi)
// Estilo: GNumberField.css (coco). COMPONE GInput (#309) con sus slots internos `field` (el <input role="spinbutton"> con
// su celda, espejo, capa de cifras y medidor, más el oculto con el valor canónico) y `end` (−/+). El motor numérico es la
// utilidad interna utils/numberInput.js (sin estado ni DOM).
import { computed, inject, mergeProps, nextTick, onBeforeUnmount, onMounted, ref, unref, useAttrs, useId, useSlots, watch } from 'vue'
import { oneOf } from '../../utils/oneOf.js'
import {
  canonical, decimalsOf, filterTyped, formatNumber, formatRaw, isValidLocale, localeInfo, parsePasted, roundTo,
  stepValue, textMatches
} from '../../utils/numberInput.js'
import { observeSize } from '../../utils/sizeObserver.js'
import GInput from '../GInput/GInput.vue'
import GIcon from '../GIcon/GLibIcon.js'
import { formKey, layoutKey, nextFrame } from '../GForm/formContext.js'

defineOptions({ name: 'GNumberField', inheritAttrs: false })

const props = defineProps({
  modelValue: { type: Number, default: null },
  min: { type: Number, default: undefined },
  max: { type: Number, default: undefined },
  step: { type: Number, default: 1, validator: (v) => Number.isFinite(v) && v > 0 },
  precision: { type: Number, default: undefined, validator: (v) => Number.isInteger(v) && v >= 0 },
  locale: { type: String, default: undefined },
  grouping: { type: Boolean, default: true },
  prefix: { type: String, default: undefined },
  suffix: { type: String, default: undefined },
  prefixLabel: { type: String, default: undefined },
  suffixLabel: { type: String, default: undefined },
  steppers: Boolean,
  decrementLabel: { type: String, default: undefined },
  incrementLabel: { type: String, default: undefined },
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

// `change` propio (valor confirmado, una vez por gesto): declarado para que la escucha del consumidor no llegue al
// `change` nativo del <input> (lección de `emits`). El resto de eventos llega nativo al <input> visible.
const emit = defineEmits(['update:modelValue', 'change'])

const attrs = useAttrs()
const slots = useSlots()
const uid = useId()
const inputId = computed(() => props.id || `g-number-field-${uid}`)

// Constantes neutras de la repetición de −/+ (tokens.md §29.6, #313): no son tema
const REPEAT_DELAY = 400
const REPEAT_EVERY = 60
const ROLL_PREFIX = 'g-number-roll'
const BUMP_PREFIX = 'g-number-bump'

// ---------- Avisos (una vez por instancia) ----------
const isDev = typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production'
const warned = new Set()
function warnOnce(key, text) {
  if (!isDev || warned.has(key)) return
  warned.add(key)
  console.warn(`[Grana GNumberField] ${text}`)
}

// ---------- Contexto (la misma precedencia que useFormField: prop › sub‑contexto › GForm › default) ----------
// El campo lo registra GInput; aquí solo se resuelven readonly/disabled para −/+ y se toma setIntrinsicMin de la fila.
const form = inject(formKey, null)
const layout = inject(layoutKey, null)
const isReadonly = computed(() => props.readonly ?? unref(layout?.readonly) ?? unref(form?.readonly) ?? false)
const isDisabled = computed(() => props.disabled ?? unref(layout?.disabled) ?? unref(form?.disabled) ?? false)
const editable = computed(() => !isDisabled.value && !isReadonly.value)

// ---------- Props resueltas ----------
const limits = computed(() => {
  const { min, max } = props
  const okMin = Number.isFinite(min) ? min : undefined
  const okMax = Number.isFinite(max) ? max : undefined
  if (okMin !== undefined && okMax !== undefined && okMin > okMax) return { min: undefined, max: undefined, crossed: true }
  return { min: okMin, max: okMax, crossed: false }
})
const stepSize = computed(() => (Number.isFinite(props.step) && props.step > 0 ? props.step : 1))
const precision = computed(() => (Number.isInteger(props.precision) && props.precision >= 0 ? props.precision : undefined))
const allowDecimals = computed(() => precision.value !== 0)
const allowNegative = computed(() => limits.value.min === undefined || limits.value.min < 0)
const inputmode = computed(() => (allowDecimals.value ? 'decimal' : 'numeric'))
const filterOpts = computed(() => ({ decimals: allowDecimals.value, negative: allowNegative.value }))

// Modelo: Number finito o null; undefined = null; NaN/±Infinity = null (aviso); una cadena canónica se lee como número
function normalize(v) {
  if (v === undefined || v === null) return null
  if (typeof v === 'number') {
    if (Number.isFinite(v)) return v
    warnOnce('nan', `modelValue ${String(v)} no es un número finito: se lee como vacío (null).`)
    return null
  }
  if (typeof v === 'string' && /^-?(\d+(\.\d*)?|\.\d+)$/.test(v.trim())) return Number(v.trim())
  return null
}
const current = ref(normalize(props.modelValue))
// Último confirmado: al montar, con cada `change` y con cada cambio desde la aplicación (sin emitir)
let lastConfirmed = current.value

// ---------- Idioma: prop › lang del ancestro más cercano › navigator.language (leído al montar) ----------
const mounted = ref(false)
const domLang = ref(null)
const info = computed(() => {
  if (props.locale && isValidLocale(props.locale)) return localeInfo(props.locale)
  if (!mounted.value) return null // SSR y primer render sin locale: texto canónico (sin desajuste de hidratación)
  const nav = typeof navigator !== 'undefined' ? navigator.language : undefined
  for (const cand of [domLang.value, nav]) if (cand && isValidLocale(cand)) return localeInfo(cand)
  return localeInfo(undefined)
})
watch(() => props.locale, (l) => {
  if (l && !isValidLocale(l)) warnOnce('locale', `locale «${l}» no lo acepta Intl: se usa el idioma del documento.`)
}, { immediate: true })
// Para escribir antes de conocer el idioma (no debería pasar: solo se escribe montado) se usa el formato canónico
const writeInfo = () => info.value || localeInfo('en-US')

const display = (v) => (v == null ? '' : info.value ? formatNumber(v, info.value, { grouping: props.grouping, precision: precision.value }) : canonical(v))
const raw = (v) => (v == null ? '' : info.value ? formatRaw(v, info.value, { precision: precision.value }) : canonical(v))

// ---------- Texto del campo ----------
const focused = ref(false)
const text = ref(display(current.value))
const fieldEl = ref(null)
const valueEl = ref(null)
const measureEl = ref(null)
const steppersEl = ref(null)
let composing = false

function setSel(el, pos) {
  try { el.setSelectionRange(pos, pos) } catch { /* tipos sin selección */ }
}
function writeText(t) {
  text.value = t
  const el = fieldEl.value
  if (el && el.value !== t) el.value = t
}
function syncText() {
  writeText(focused.value ? raw(current.value) : display(current.value))
}
watch(info, () => { if (!composing) syncText() })
watch(() => [props.grouping, precision.value], () => { if (!focused.value) syncText() })

// Cambio desde la aplicación: actualiza el último confirmado sin emitir; reescribe el texto solo si no coincide
watch(() => props.modelValue, (v) => {
  const n = normalize(v)
  if (n === current.value) return
  current.value = n
  lastConfirmed = n
  clearRoll()
  // «1,» a medio escribir y el modelo 1: no se toca; si no coincide, se reescribe
  if (!textMatches(text.value, n, writeInfo(), precision.value)) syncText()
})

function setModel(v) {
  if (v === current.value) return
  current.value = v
  emit('update:modelValue', v)
}
function emitChangeIfNeeded() {
  if (current.value === lastConfirmed) return
  lastConfirmed = current.value
  emit('change', current.value)
}

// ---------- Contexto de GInput (slot interno `field`) ----------
let ctx = null
const notifyInput = () => ctx?.notifyInput()
const notifyChange = () => ctx?.notifyChange()
function setFieldEl(el) {
  fieldEl.value = el || null
  ctx?.setControl(el || null)
}

// ---------- Escritura ----------
function applyTyped(el) {
  const prev = text.value
  const r = filterTyped(el.value, writeInfo(), filterOpts.value)
  if (!r.ok) {
    // No entra: se restaura el texto anterior y el cursor donde estaba
    const pos = Math.max(0, (el.selectionStart ?? el.value.length) - (el.value.length - prev.length))
    el.value = prev
    setSel(el, pos)
    return
  }
  if (r.text !== el.value) {
    const pos = el.selectionStart ?? r.text.length
    el.value = r.text
    setSel(el, pos)
  }
  text.value = r.text
  clearRoll()
  setModel(roundTo(r.value, precision.value))
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
  const data = e.clipboardData
  if (!data || !editable.value) return
  e.preventDefault()
  const n = parsePasted(data.getData('text/plain') || data.getData('text'), writeInfo())
  if (n == null || (!allowNegative.value && n < 0)) return
  const rounded = roundTo(n, precision.value)
  const ins = raw(rounded)
  const el = e.target
  const start = el.selectionStart ?? el.value.length
  const end = el.selectionEnd ?? start
  const joined = el.value.slice(0, start) + ins + el.value.slice(end)
  const r = filterTyped(joined, writeInfo(), filterOpts.value)
  const t = r.ok ? r.text : ins
  const caret = r.ok ? start + ins.length : ins.length
  el.value = t
  text.value = t
  setSel(el, caret)
  clearRoll()
  setModel(r.ok ? roundTo(r.value, precision.value) : rounded)
  notifyInput()
}
function onFocus(e) {
  focused.value = true
  clearRoll()
  const el = e.target
  const all = el.value.length > 0 && el.selectionStart === 0 && el.selectionEnd === el.value.length
  const r = raw(current.value)
  if (current.value != null && r !== text.value) {
    writeText(r)
    if (all) el.select()
    else setSel(el, r.length)
  }
}
// Confirmar (salir o Enter): redondea, formatea y emite `change` si el valor difiere del último confirmado
function commit() {
  const v = roundTo(current.value, precision.value)
  if (v !== current.value) setModel(v)
  syncText()
  emitChangeIfNeeded()
}
function onBlur() {
  focused.value = false
  keyStepped = false
  clearRoll()
  commit()
}

// ---------- Pasos ----------
let keyStepped = false
const STEP_KEYS = { ArrowUp: [1, false], ArrowDown: [-1, false], PageUp: [1, true], PageDown: [-1, true] }
function atLimit(dir, v = current.value) {
  const { min, max } = limits.value
  return v != null && ((dir > 0 && max !== undefined && v >= max) || (dir < 0 && min !== undefined && v <= min))
}
/** Un paso. `source`: 'key' | 'keyrepeat' | 'button' | 'repeat'. Devuelve si cambió el valor. */
function doStep(dir, mult, source) {
  if (!editable.value) return false
  const v = current.value
  if (atLimit(dir)) {
    if (source === 'key') bump(dir)
    return false
  }
  const { min, max } = limits.value
  const nv = stepValue(v, { dir, mult, step: stepSize.value, min, max, precision: precision.value })
  if (nv === v) return false
  const el = fieldEl.value
  const oldText = el ? el.value : text.value
  setModel(nv)
  const t = focused.value ? raw(nv) : display(nv)
  writeText(t)
  if (el && focused.value) setSel(el, t.length)
  const hadRoll = Boolean(roll.value)
  clearRoll()
  // Rueda solo un paso deliberado y sin capa previa (pasos rápidos: la anterior se retira y este no rueda)
  if ((source === 'key' || source === 'button') && !hadRoll) startRoll(oldText, t, dir)
  // Flechas = escritura (el error se revela al salir); −/+ = cambio (sube dirty, no revela)
  if (source === 'key' || source === 'keyrepeat') notifyInput()
  else notifyChange()
  return true
}
function onKeydown(e) {
  if (composing || e.isComposing) return
  if (e.key === 'Enter') {
    commit()
    return // el envío implícito sigue
  }
  const m = STEP_KEYS[e.key]
  if (!m || e.altKey || e.ctrlKey || e.metaKey || !editable.value) return
  e.preventDefault()
  const mult = m[1] || e.shiftKey ? 10 : 1
  if (doStep(m[0], mult, e.repeat ? 'keyrepeat' : 'key')) keyStepped = true
}
// Fin del gesto de teclado (keyup de la tecla de paso): un `change` y, para GForm, un cambio (sube dirty, no revela)
function onKeyup(e) {
  if (!STEP_KEYS[e.key] || !keyStepped) return
  keyStepped = false
  notifyChange()
  emitChangeIfNeeded()
}

// ---------- −/+ ----------
const hasStepLabels = computed(() => Boolean(props.decrementLabel && props.incrementLabel))
const wantsSteppers = computed(() => props.steppers && hasStepLabels.value)
const showSteppers = computed(() => wantsSteppers.value && !isReadonly.value)
const decDisabled = computed(() => isDisabled.value || atLimit(-1))
const incDisabled = computed(() => isDisabled.value || atLimit(1))
const hasLabel = computed(() => Boolean(props.label || slots.label))
function stepNaming(kind, text) {
  const own = `${inputId.value}-${kind}`
  if (hasLabel.value) return { 'aria-labelledby': `${own} ${inputId.value}-label` }
  if (attrs['aria-labelledby']) return { 'aria-labelledby': `${own} ${attrs['aria-labelledby']}` }
  if (attrs['aria-label']) return { 'aria-label': `${text} ${attrs['aria-label']}` }
  return { 'aria-labelledby': own }
}
const decNaming = computed(() => stepNaming('decrement', props.decrementLabel))
const incNaming = computed(() => stepNaming('increment', props.incrementLabel))

let delayTimer = null
let everyTimer = null
let gesture = false
let gestureStepped = false
function stopRepeat() {
  clearTimeout(delayTimer)
  clearInterval(everyTimer)
  delayTimer = null
  everyTimer = null
}
function removeGestureListeners() {
  if (typeof window === 'undefined') return
  window.removeEventListener('pointerup', onGestureEnd)
  window.removeEventListener('pointercancel', onGestureEnd)
  window.removeEventListener('blur', onGestureEnd)
}
function endGesture(emitChange = true) {
  stopRepeat()
  removeGestureListeners()
  const stepped = gesture && gestureStepped
  gesture = false
  gestureStepped = false
  if (emitChange && stepped) emitChangeIfNeeded()
}
function onGestureEnd() {
  endGesture(true)
}
function onStepDown(dir, e) {
  if (e.button !== 0) return
  e.preventDefault() // el foco se queda donde estaba; sin foco previo, el campo no se enfoca (sin teclado en móvil)
  endGesture(true)
  if (!doStep(dir, 1, 'button')) return
  gesture = true
  gestureStepped = true
  window.addEventListener('pointerup', onGestureEnd)
  window.addEventListener('pointercancel', onGestureEnd)
  window.addEventListener('blur', onGestureEnd)
  delayTimer = setTimeout(() => {
    everyTimer = setInterval(() => { if (!doStep(dir, 1, 'repeat')) endGesture(true) }, REPEAT_EVERY)
  }, REPEAT_DELAY)
}
// Activación sin puntero (lector de pantalla, tecnología de apoyo): click con detail 0 = un paso y su `change`
function onStepClick(dir, e) {
  if (e.detail !== 0) return
  if (doStep(dir, 1, 'button')) emitChangeIfNeeded()
}
watch([isDisabled, isReadonly], () => { if (gesture) endGesture(true) })

// ---------- P2 · las cifras ruedan / P3 · el tope ----------
const roll = ref(null) // { dir: 'up' | 'down', chars: [{ ch, old, changed }] }
let rollPending = 0
let rollToken = 0
const bumping = ref(false)
const bumpDir = ref(null)
let bumpToken = 0

const parseTime = (x) => {
  const n = parseFloat(x)
  return Number.isFinite(n) ? (String(x).trim().endsWith('ms') ? n : n * 1000) : 0
}
// Animaciones calculadas con ese prefijo en el elemento y sus descendientes (duración > 0). Sin CSS, con movimiento
// reducido o en jsdom: 0. Así el JS no tiene duraciones propias.
function computedAnimations(root, prefix) {
  if (!root || typeof getComputedStyle !== 'function') return 0
  let n = 0
  for (const el of [root, ...root.querySelectorAll('*')]) {
    const cs = getComputedStyle(el)
    const names = String(cs.animationName || '').split(',').map((s) => s.trim())
    const durs = String(cs.animationDuration || '').split(',')
    names.forEach((name, i) => {
      if (name.startsWith(prefix) && parseTime(durs[i % durs.length]) > 0) n++
    })
  }
  return n
}
function clearRoll() {
  rollToken++
  rollPending = 0
  if (roll.value) roll.value = null
}
function startRoll(oldT, newT, dir) {
  if (!oldT || !newT) return
  const el = fieldEl.value
  if (el && el.scrollWidth > el.clientWidth + 1) return // el texto no cabe en la celda
  const a = [...oldT]
  const b = [...newT]
  const chars = []
  for (let i = 1; i <= b.length; i++) {
    const ch = b[b.length - i]
    const old = a[a.length - i] ?? ''
    chars.unshift({ ch, old, changed: ch !== old })
  }
  if (!chars.some((c) => c.changed)) return
  roll.value = { dir: dir > 0 ? 'up' : 'down', chars }
  const token = ++rollToken
  nextTick(() => {
    if (token !== rollToken) return
    const layer = valueEl.value?.querySelector('.g-number-field__roll')
    rollPending = computedAnimations(layer, ROLL_PREFIX)
    if (!rollPending) clearRoll()
  })
}
function bump(dir) {
  const token = ++bumpToken
  bumping.value = false
  bumpDir.value = dir > 0 ? 'up' : 'down'
  nextFrame(() => {
    if (token !== bumpToken) return
    bumping.value = true
    nextTick(() => {
      if (token !== bumpToken) return
      if (!computedAnimations(valueEl.value, BUMP_PREFIX)) endBump()
    })
  })
}
function endBump() {
  bumpToken++
  bumping.value = false
  bumpDir.value = null
}
function onValueAnimationEnd(e) {
  const name = typeof e.animationName === 'string' ? e.animationName : ''
  if (name.startsWith(ROLL_PREFIX) && roll.value) {
    rollPending--
    if (rollPending <= 0) clearRoll()
  } else if (name.startsWith(BUMP_PREFIX) && bumping.value) {
    endBump()
  }
}

// ---------- P1 · pulsar el área vacía de la caja enfoca con el cursor al final ----------
let controlEl = null
function onBoxDown(e) {
  if (e.button !== 0 || isDisabled.value) return
  const el = fieldEl.value
  const t = e.target
  if (!el || t === el || (t.closest && t.closest('.g-number-field__steppers'))) return
  e.preventDefault()
  el.focus()
  setSel(el, el.value.length)
}

// ---------- Mínimo publicado en una GFormRow con −/+ (#312) ----------
const canPublish = computed(() => wantsSteppers.value && Boolean(layout && typeof layout.setIntrinsicMin === 'function'))
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
const referenceTexts = computed(() => {
  const { min, max } = limits.value
  const list = []
  if (min !== undefined) list.push(display(min))
  if (max !== undefined) list.push(display(max))
  if (attrs.placeholder) list.push(String(attrs.placeholder))
  if (min === undefined && max === undefined) list.push(info.value ? info.value.digits[8].repeat(4) : '8888')
  return list
})
// Mínimo = lo que hay antes de la celda (borde, relleno, prepend, prefijo, separaciones) + el texto de referencia + lo que
// hay entre la celda y −/+ (sufijo, output) + −/+ con su separación. Se mide por posiciones y no como «caja − celda»:
// con P1 la celda mide su texto y el hueco libre (antes de −/+) no forma parte del mínimo.
let lastTail = 0
function measure() {
  if (!canPublish.value) return publish(0)
  const cell = valueEl.value
  const meas = measureEl.value
  const ctl = cell?.closest('.g-input__control')
  if (!cell || !meas || !ctl || typeof getComputedStyle !== 'function') return
  const cs = getComputedStyle(ctl)
  const rtl = cs.direction === 'rtl'
  const S = (r) => (rtl ? -r.right : r.left)
  const E = (r) => (rtl ? -r.left : r.right)
  const box = ctl.getBoundingClientRect()
  if (!(box.width > 0)) return
  let ref = 0
  for (const t of referenceTexts.value) {
    meas.textContent = t
    ref = Math.max(ref, meas.getBoundingClientRect().width)
  }
  const c = cell.getBoundingClientRect()
  const steps = steppersEl.value
  let lastEnd = E(c)
  for (const k of ctl.children) {
    if (k === cell || k === steps) continue
    const kcs = getComputedStyle(k)
    if (kcs.display === 'none' || kcs.position === 'absolute' || kcs.position === 'fixed') continue
    const r = k.getBoundingClientRect()
    if (r.width > 0) lastEnd = Math.max(lastEnd, E(r))
  }
  const gap = parseFloat(cs.columnGap) || 0
  let tail
  if (steps) {
    tail = gap + (E(box) - S(steps.getBoundingClientRect()))
    lastTail = tail
  } else if (isReadonly.value) {
    // −/+ no se pintan en solo lectura pero cuentan (desbloquear no reparte la fila, #266): lo último medido o, si nunca
    // se pintaron, dos cuadrados del alto de la caja con el piso del área táctil
    const coarse = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches
    tail = lastTail || gap + 2 * Math.max(box.height, coarse ? 44 : 24)
  } else {
    tail = (parseFloat(cs.paddingInlineEnd) || 0) + (parseFloat(cs.borderInlineEndWidth) || 0)
  }
  publish(Math.ceil((S(c) - S(box)) + ref + (lastEnd - E(c)) + tail))
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
  () => [canPublish.value, referenceTexts.value.join('|'), props.prefix, props.suffix, props.prefixLabel, props.suffixLabel, props.output, props.size, props.density, unref(layout?.density), unref(form?.density), isReadonly.value, showSteppers.value],
  () => scheduleMeasure()
)
let offMeasure = null
let offSteppers = null
watch([measureEl, steppersEl], ([m, s]) => {
  offMeasure?.()
  offSteppers?.()
  offMeasure = m ? observeSize(m, scheduleMeasure) : null
  offSteppers = s ? observeSize(s, scheduleMeasure) : null
})
function onFonts() {
  scheduleMeasure()
}

// ---------- Montaje ----------
onMounted(() => {
  const root = valueEl.value?.closest('.g-input')
  domLang.value = root?.closest('[lang]')?.getAttribute('lang') || null
  mounted.value = true
  syncText()
  lastConfirmed = current.value
  controlEl = valueEl.value?.closest('.g-input__control') || null
  controlEl?.addEventListener('pointerdown', onBoxDown)
  if (typeof document !== 'undefined' && document.fonts) {
    document.fonts.ready?.then(onFonts)
    document.fonts.addEventListener?.('loadingdone', onFonts)
  }
  scheduleMeasure()
})
onBeforeUnmount(() => {
  endGesture(false)
  clearRoll()
  endBump()
  controlEl?.removeEventListener('pointerdown', onBoxDown)
  controlEl = null
  if (typeof document !== 'undefined') document.fonts?.removeEventListener?.('loadingdone', onFonts)
  offMeasure?.()
  offSteppers?.()
  publish(0)
})

// ---------- Atributos ----------
const isListener = (k) => /^on[A-Z]/.test(k)
// A GInput: todo salvo escuchas y `type` (la raíz recibe class/style; el resto llega en `bind` al <input>)
const forwardAttrs = computed(() => {
  void attrs.class // lectura que registra la dependencia aunque no haya atributos (attrs no es reactivo por claves)
  const out = {}
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class' || k === 'style' || k === 'type' || isListener(k)) continue
    out[k] = v
  }
  return out
})
// Escuchas del consumidor: al <input> visible, DESPUÉS de los manejadores del contexto y de los propios
const listenerAttrs = computed(() => {
  void attrs.class
  const out = {}
  for (const [k, v] of Object.entries(attrs)) if (isListener(k)) out[k] = v
  return out
})
const ownHandlers = { onInput, onKeydown, onKeyup, onFocus, onBlur, onPaste, onCompositionstart, onCompositionend }

const ariaValue = computed(() => {
  const v = current.value
  const { min, max } = limits.value
  return {
    'aria-valuenow': v != null ? v : undefined,
    'aria-valuetext': v != null ? display(v) : undefined,
    'aria-valuemin': min,
    'aria-valuemax': max
  }
})

/** Propiedades del <input> visible: derivadas › bind de GInput (contexto primero + atributos) › propios › escuchas › fijos. */
function fieldProps(f) {
  ctx = f
  const { name: _n, required: _r, ...bind } = f.bind
  return mergeProps(
    { inputmode: inputmode.value, autocomplete: 'off', spellcheck: 'false', autocorrect: 'off' },
    bind,
    { class: 'g-number-field__field', ...ownHandlers },
    listenerAttrs.value,
    {
      type: 'text',
      role: 'spinbutton',
      dir: 'ltr',
      value: text.value,
      ...ariaValue.value,
      'aria-required': props.required ? 'true' : undefined,
      'aria-readonly': f.readonly ? 'true' : undefined
    }
  )
}

const canonicalValue = computed(() => canonical(current.value))
const mirrorText = computed(() => text.value || (attrs.placeholder != null ? String(attrs.placeholder) : ''))

const rootClasses = computed(() => ['g-number-field', { 'g-number-field--has-steppers': showSteppers.value }, attrs.class])

// ---------- Avisos de montaje (1 a 5 y 8; 6 en normalize y 7 en el watch de locale) ----------
if (isDev) {
  if (!hasLabel.value && !attrs['aria-label'] && !attrs['aria-labelledby']) warnOnce('name', 'necesita label, slot label, aria-label o aria-labelledby para tener un nombre accesible.')
  if (props.steppers && !hasStepLabels.value) warnOnce('steppers', 'steppers necesita decrementLabel e incrementLabel: −/+ no se pintan.')
  if (limits.value.crossed) warnOnce('limits', `min (${props.min}) es mayor que max (${props.max}): se ignoran los dos límites.`)
  if (props.step !== undefined && !(Number.isFinite(props.step) && props.step > 0)) warnOnce('step', `step ${String(props.step)} no es un número mayor que 0: se usa 1.`)
  if (precision.value !== undefined && (decimalsOf(stepSize.value) > precision.value || (limits.value.min !== undefined && decimalsOf(limits.value.min) > precision.value))) {
    warnOnce('precision', `precision ${precision.value} es menor que los decimales de step o de min: los pasos se redondean y pueden salir de la rejilla.`)
  }
  if (attrs.type !== undefined) warnOnce('type', 'type no aplica: el campo es siempre type="text" con role="spinbutton".')
  if (slots.append || slots.action) warnOnce('slots', 'los slots append y action no aplican (el final de la caja es de −/+): no se pintan.')
}
</script>

<template>
  <GInput
    v-bind="forwardAttrs"
    :id="inputId"
    :class="rootClasses"
    :style="attrs.style"
    :name="name"
    :label="label"
    :hint="hint"
    :error="error"
    :warning="warning"
    :valid="valid"
    :output="output"
    :required="required"
    :mark="mark"
    :readonly="readonly"
    :disabled="disabled"
    :size="size"
    :variant="variant"
    :density="density"
    :color="color"
    :rounded="rounded"
    :block="block"
    :prefix="prefix"
    :suffix="suffix"
    :prefix-label="prefixLabel"
    :suffix-label="suffixLabel"
  >
    <template v-if="slots.label" #label><slot name="label" /></template>
    <template v-if="slots.hint" #hint><slot name="hint" /></template>
    <template v-if="slots.error" #error><slot name="error" /></template>
    <template v-if="slots.prepend" #prepend><slot name="prepend" /></template>
    <template #field="f">
      <span
        ref="valueEl"
        :class="['g-number-field__value', { 'is-rolling': Boolean(roll), 'is-bumping': bumping }]"
        :data-bump="bumping ? bumpDir : undefined"
        @animationend="onValueAnimationEnd"
        @animationcancel="onValueAnimationEnd"
      >
        <span class="g-number-field__mirror" aria-hidden="true">{{ mirrorText }}</span>
        <input :ref="setFieldEl" v-bind="fieldProps(f)">
        <span v-if="roll" class="g-number-field__roll" aria-hidden="true" dir="ltr" :data-direction="roll.dir"><template v-for="(c, i) in roll.chars" :key="i"><span v-if="c.changed" class="g-number-field__roll-slot"><span class="g-number-field__roll-new">{{ c.ch }}</span><span v-if="c.old" class="g-number-field__roll-old">{{ c.old }}</span></span><template v-else>{{ c.ch }}</template></template></span>
        <span v-if="canPublish" ref="measureEl" class="g-number-field__measure" aria-hidden="true"></span>
      </span>
      <input v-if="name" type="hidden" :name="name" :value="canonicalValue" :disabled="f.disabled || undefined" :form="attrs.form">
    </template>
    <template v-if="showSteppers" #end>
      <span ref="steppersEl" class="g-number-field__steppers">
        <button
          type="button"
          class="g-number-field__step g-number-field__step--decrement"
          tabindex="-1"
          :aria-controls="inputId"
          v-bind="decNaming"
          :disabled="decDisabled || undefined"
          @pointerdown="onStepDown(-1, $event)"
          @click="onStepClick(-1, $event)"
        ><span :id="`${inputId}-decrement`" class="g-number-field__step-label">{{ decrementLabel }}</span><GIcon name="minus" /></button>
        <button
          type="button"
          class="g-number-field__step g-number-field__step--increment"
          tabindex="-1"
          :aria-controls="inputId"
          v-bind="incNaming"
          :disabled="incDisabled || undefined"
          @pointerdown="onStepDown(1, $event)"
          @click="onStepClick(1, $event)"
        ><span :id="`${inputId}-increment`" class="g-number-field__step-label">{{ incrementLabel }}</span><GIcon name="plus" /></button>
      </span>
    </template>
  </GInput>
</template>
