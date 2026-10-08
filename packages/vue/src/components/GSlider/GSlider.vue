<script setup>
// GSlider · deslizador de un valor o de un rango, forma B «El valor es el asa» (dueño: bruno)
// Contrato: design/contracts/slider.md (DECISIONS.md #445 a #457) · Estructura: design/lab/slider/r01/?v=B (kiwi)
// Estilo: GSlider.css (coco; «Para bruno» en design/lab/slider/estilo.md). Motor: utils/slider.js (interno, #456).
// Cada asa es un <input type="range" step="any"> NATIVO, invisible y del tamaño del interior de la píldora (#446): da el
// rol, el foco y el ajuste de los lectores móviles; el teclado y el puntero los resuelve el componente; el envío va en
// <input type="hidden"> canónicos. Va en su propia entrada, `@grana/vue/slider` (#455).
import { computed, inject, nextTick, onBeforeUnmount, onMounted, ref, useAttrs, useSlots, watch } from 'vue'
import { oneOf } from '../../utils/oneOf.js'
import {
  ACTION_KEYS, acceptTyped, bottom, decimalSeparator, format as formatValue, frac as fracOf, isMultiple, isValidFormat,
  isValidLocale, keyAction, latin, limits, merged as areMerged, move, normalizeMarks, parseTyped, pick, refValues, snap, top,
  valueText as readValue, windowMove
} from '../../utils/slider.js'
import { observeSize } from '../../utils/sizeObserver.js'
import { useKeyFocus } from '../../utils/keyFocus.js'
import GIcon from '../GIcon/GLibIcon.js'
import { layoutKey, messageIcon, nextFrame, spaceUnit, useFormField } from '../GForm/formContext.js'

defineOptions({ name: 'GSlider', inheritAttrs: false })

const COLORS = ['brand', 'accent', 'neutral', 'success', 'warning', 'danger', 'info']
const props = defineProps({
  modelValue: { type: [Number, Array], default: null },
  range: Boolean,
  min: { type: Number, default: 0 },
  max: { type: Number, default: 100 },
  step: { type: Number, default: 1, validator: (v) => Number.isFinite(v) && v > 0 },
  bigStep: { type: Number, default: undefined },
  minGap: { type: Number, default: 0 },
  marks: { type: [Boolean, Array], default: false },
  snap: { type: String, default: 'step', validator: oneOf(['step', 'marks']) },
  locale: { type: String, default: undefined },
  format: { type: Object, default: undefined },
  valueText: { type: Function, default: undefined },
  labels: { type: Object, default: () => ({}) },
  name: { type: String, default: undefined },
  label: { type: String, default: undefined },
  hint: { type: String, default: undefined },
  error: { type: String, default: undefined },
  warning: { type: String, default: undefined },
  valid: { type: String, default: undefined },
  required: Boolean,
  mark: { type: Boolean, default: undefined },
  readonly: { type: Boolean, default: undefined },
  disabled: { type: Boolean, default: undefined },
  density: { type: String, default: undefined, validator: oneOf(['default', 'comfortable', 'compact']) },
  color: { type: String, default: 'brand', validator: oneOf(['brand', 'accent', 'neutral', 'success', 'warning', 'danger', 'info']) },
  id: { type: String, default: undefined }
})

// `change` propio, una vez por gesto (#448): declarado para que la escucha del consumidor no llegue a ningún nativo
const emit = defineEmits(['update:modelValue', 'change'])

const attrs = useAttrs()
const slots = useSlots()

// Constantes neutras de JS (tokens.md §29.6, #454): no son tema
const TAP = 10 // px: por debajo, un toque; por encima, un gesto
const TIE = 2 // px: el primer movimiento que decide qué asa se mueve cuando coinciden
const TYPE_MS = 900 // pausa que confirma la cifra tecleada (B4)
const BUMP_PREFIX = 'g-slider-bump'
// Nombres reservados (#457): si llegan por $attrs, avisan y no se aplican
const RESERVED = ['appearance', 'distribution', 'countText', 'count-text', 'pxPerStep', 'px-per-step', 'orientation', 'clearable', 'size']

// ---------- Avisos (una vez por instancia) ----------
const isDev = typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production'
const warned = new Set()
function warnOnce(key, text) {
  if (!isDev || warned.has(key)) return
  warned.add(key)
  console.warn(`[Grana GSlider] ${text}`)
}

// ---------- Elementos ----------
const rootEl = ref(null)
const areaEl = ref(null)
const natives = []
const setNative = (i) => (el) => { natives[i] = el || null }

// ---------- GForm (form.md §1 y §2): control de elección, el error se revela al cambiar ----------
const ff = useFormField({
  name: () => props.name,
  id: () => props.id,
  error: () => props.error,
  warning: () => props.warning,
  valid: () => props.valid,
  required: () => props.required,
  mark: () => props.mark,
  readonly: () => props.readonly,
  disabled: () => props.disabled,
  density: () => props.density,
  trigger: 'change',
  control: () => natives[0] || null,
  root: rootEl
})
const id = ff.id
const isReadonly = ff.readonly
const isDisabled = ff.disabled
const message = ff.message
const layout = inject(layoutKey, null)

// ---------- Opciones del motor ----------
const minV = computed(() => (Number.isFinite(props.min) ? props.min : 0))
const maxV = computed(() => (Number.isFinite(props.max) ? props.max : 100))
const stepV = computed(() => {
  if (Number.isFinite(props.step) && props.step > 0) return props.step
  warnOnce('step', `step ${String(props.step)} no es un número positivo: se usa 1.`)
  return 1
})
const travel = computed(() => maxV.value > minV.value)
watch(travel, (t) => { if (!t) warnOnce('travel', `min (${minV.value}) ≥ max (${maxV.value}): el control queda sin recorrido.`) }, { immediate: true })
const markInfo = computed(() => normalizeMarks(props.marks, { min: minV.value, max: maxV.value, step: stepV.value }))
watch(markInfo, (m) => {
  if (m.outside.length) warnOnce('marks-out', `marks con valores fuera de [min, max] (${m.outside.join(', ')}): se ignoran.`)
  if (m.duplicates.length) warnOnce('marks-dup', `marks con valores repetidos (${m.duplicates.join(', ')}): se usa el primero.`)
}, { immediate: true })
const snapMode = computed(() => {
  if (props.snap !== 'marks') return 'step'
  if (Array.isArray(props.marks) && markInfo.value.list.length) return 'marks'
  warnOnce('snap', 'snap="marks" sin un arreglo de marcas: se usa "step".')
  return 'step'
})
const base = computed(() => ({ min: minV.value, max: maxV.value, step: stepV.value, marks: markInfo.value.list, snap: snapMode.value }))
const bigStepV = computed(() => {
  const b = props.bigStep
  if (b === undefined || b === null) return undefined
  if (isMultiple(b, stepV.value)) return b
  warnOnce('bigStep', `bigStep ${String(b)} no es un múltiplo positivo de step (${stepV.value}): se usa una décima del recorrido.`)
  return undefined
})
const gapV = computed(() => {
  const g = props.minGap
  if (!props.range || !g) return 0
  if (!Number.isFinite(g) || g < 0 || g > top(base.value) - bottom(base.value)) {
    warnOnce('minGap', `minGap ${String(g)} es negativo o mayor que el recorrido: se usa 0.`)
    return 0
  }
  return g
})

// ---------- Idioma (#310, como GNumberField): prop › lang del ancestro más cercano › navigator.language ----------
const mounted = ref(false)
const domLang = ref(null)
watch(() => props.locale, (l) => {
  if (l && !isValidLocale(l)) warnOnce('locale', `locale «${l}» no lo acepta Intl: se usa el idioma del documento.`)
}, { immediate: true })
// null = el canónico (SSR y primer render sin locale); undefined = el idioma por defecto de Intl
const locale = computed(() => {
  if (props.locale && isValidLocale(props.locale)) return props.locale
  if (!mounted.value) return null
  const nav = typeof navigator !== 'undefined' ? navigator.language : undefined
  for (const c of [domLang.value, nav]) if (c && isValidLocale(c)) return c
  return undefined
})
const formatV = computed(() => {
  const f = props.format
  if (!f) return undefined
  if (!isValidFormat(locale.value || undefined, f)) {
    warnOnce('format', 'format lo rechaza Intl.NumberFormat: se usa {}.')
    return undefined
  }
  if (f.style === 'percent' && maxV.value > 1) warnOnce('percent', `format.style "percent" con max > 1: el modelo 40 se leería 4000 %; usa { style: 'unit', unit: 'percent' }.`)
  return f
})
const opts = computed(() => ({ ...base.value, bigStep: bigStepV.value, minGap: gapV.value, locale: locale.value, format: formatV.value, emptyText: props.labels?.empty || '' }))

// valueText de la aplicación: lo mismo en la píldora y en aria-valuetext; si no da una cadena no vacía, el texto por defecto
function ownText(v) {
  if (typeof props.valueText !== 'function' || v === null) return null
  const t = props.valueText(v)
  if (typeof t === 'string' && t) return t
  warnOnce('valueText', 'valueText no devolvió una cadena no vacía: se usa el texto por defecto.')
  return null
}
const pillTextOf = (v) => (v === null ? '' : ownText(v) ?? formatValue(v, opts.value))
const ariaTextOf = (v) => (v === null ? opts.value.emptyText : ownText(v) ?? readValue(v, opts.value))

// ---------- Valores (copia local que responde en el acto; la aplicación manda) ----------
const finite = (x) => typeof x === 'number' && Number.isFinite(x)
function readModel(mv) {
  const b = bottom(base.value)
  const t = top(base.value)
  if (props.range) {
    if (mv === null || mv === undefined) return [b, t]
    if (!Array.isArray(mv) || mv.length !== 2 || !mv.every(finite)) {
      warnOnce('model-range', 'modelValue con range debe ser [inicio, fin] con dos números finitos: se dibuja el recorrido entero.')
      return [b, t]
    }
    if (mv[0] > mv[1]) {
      warnOnce('model-order', `modelValue [${mv[0]}, ${mv[1]}] está desordenado: se dibuja ordenado.`)
      return [mv[1], mv[0]]
    }
    return [mv[0], mv[1]]
  }
  if (mv === null || mv === undefined) return [null]
  if (!finite(mv)) {
    warnOnce('model', `modelValue ${Array.isArray(mv) ? 'arreglo sin range' : String(mv)} no es un número finito: se lee como sin elegir (null).`)
    return [null]
  }
  return [mv]
}
const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i])
const vals = ref(readModel(props.modelValue))
watch(() => [props.modelValue, props.range, base.value], () => {
  const next = readModel(props.modelValue)
  if (!same(next, vals.value)) vals.value = next
}, { deep: true })
watch(vals, (vs) => {
  if (travel.value && vs.some((v) => v !== null && (v < minV.value || v > maxV.value))) warnOnce('outside', `modelValue fuera de [${minV.value}, ${maxV.value}]: se dibuja en el extremo; el modelo no se toca.`)
  if (!props.range && vs[0] === null && !props.labels?.empty) warnOnce('empty', 'valor sin elegir (null) sin labels.empty: «sin elegir» no tiene texto a la vista ni para los lectores.')
}, { immediate: true })
const empty = computed(() => !props.range && vals.value[0] === null)
const lim = (i) => (travel.value ? limits(vals.value, i, opts.value) : [minV.value, minV.value])
const fracs = computed(() => vals.value.map((v) => fracOf(v, base.value)))

function set(i, v) {
  if (vals.value[i] === v) return false
  const next = vals.value.slice()
  next[i] = v
  vals.value = next
  emit('update:modelValue', props.range ? next.slice() : next[0])
  return true
}
function setBoth(a, b) {
  if (vals.value[0] === a && vals.value[1] === b) return false
  vals.value = [a, b]
  emit('update:modelValue', [a, b])
  return true
}

// `change` una vez por gesto (#448): al soltar la tecla o el puntero, al confirmar la cifra, por cada ajuste del lector y
// al perder el foco con un gesto abierto. GForm recibe el cambio en el mismo momento (notifyChange, nunca notifyInput)
let gestureFrom = null
const startGesture = () => { if (gestureFrom === null) gestureFrom = vals.value.slice() }
function endGesture() {
  if (gestureFrom === null) return
  const changed = !same(gestureFrom, vals.value)
  gestureFrom = null
  if (!changed) return
  emit('change', props.range ? vals.value.slice() : vals.value[0])
  ff.notifyChange()
}

// ---------- Textos ----------
const pillTexts = computed(() => vals.value.map(pillTextOf))
const ariaTexts = computed(() => vals.value.map(ariaTextOf))
const refTexts = computed(() => [...new Set([...refValues(base.value).map(pillTextOf), ...pillTexts.value].filter(Boolean))])
const nativeValue = (i) => {
  if (!travel.value) return minV.value
  const v = vals.value[i]
  return v === null ? (minV.value + maxV.value) / 2 : v
}

// ---------- Nombres y descripción ----------
const hasLabel = computed(() => Boolean(props.label || slots.label))
const hasHint = computed(() => Boolean(props.hint || slots.hint))
const hintId = computed(() => `${id.value}-hint`)
const labelId = computed(() => `${id.value}-label`)
const nativeId = (i) => (i === 0 ? id.value : `${id.value}-end`)
const nameId = (i) => `${id.value}-n${i}`
const thumbName = (i) => (i === 0 ? props.labels?.start : props.labels?.end) || ''
const describedBy = computed(() => [hasHint.value && hintId.value, attrs['aria-describedby'], ff.messageId.value].filter(Boolean).join(' '))
const groupNaming = computed(() => {
  if (!props.range) return {}
  if (hasLabel.value) return { role: 'group', 'aria-labelledby': labelId.value }
  return { role: 'group', 'aria-labelledby': attrs['aria-labelledby'] || undefined, 'aria-label': attrs['aria-labelledby'] ? undefined : attrs['aria-label'] || undefined }
})
function thumbNaming(i) {
  if (!props.range) return hasLabel.value ? {} : { 'aria-labelledby': attrs['aria-labelledby'] || undefined, 'aria-label': attrs['aria-labelledby'] ? undefined : attrs['aria-label'] || undefined }
  if (hasLabel.value) return { 'aria-labelledby': `${labelId.value} ${nameId(i)}` }
  if (attrs['aria-labelledby']) return { 'aria-labelledby': `${attrs['aria-labelledby']} ${nameId(i)}` }
  if (attrs['aria-label']) return { 'aria-label': `${attrs['aria-label']} ${thumbName(i)}`.trim() }
  return { 'aria-labelledby': nameId(i) }
}
function nativeAttrs(i) {
  return {
    id: nativeId(i),
    min: lim(i)[0],
    max: lim(i)[1],
    value: nativeValue(i),
    disabled: isDisabled.value || undefined,
    autofocus: i === 0 && attrs.autofocus !== undefined && attrs.autofocus !== false ? true : undefined,
    'aria-valuetext': ariaTexts.value[i],
    'aria-describedby': describedBy.value || undefined,
    'aria-invalid': ff.invalid.value ? 'true' : undefined,
    'aria-readonly': isReadonly.value ? 'true' : undefined,
    ...thumbNaming(i)
  }
}
function focusStart() {
  natives[0]?.focus()
}

// ---------- Atributos: class y style a la raíz; los del nombre y la descripción a los nativos; form a los ocultos ----------
const OWN_ATTRS = new Set(['class', 'style', 'aria-label', 'aria-labelledby', 'aria-describedby', 'autofocus', 'form'])
const rootAttrs = computed(() => {
  const out = {}
  for (const [k, v] of Object.entries(attrs)) if (!OWN_ATTRS.has(k) && !RESERVED.includes(k)) out[k] = v
  return out
})
watch(() => RESERVED.filter((k) => attrs[k] !== undefined), (list) => {
  if (list.length) warnOnce('reserved', `${list.join(', ')}: nombres reservados (#457), no se aplican.`)
}, { immediate: true })

// Avisos 1 a 3 (sin nombre accesible, rango sin nombres de asa, sin elegir sin labels.empty)
onMounted(() => {
  if (!hasLabel.value && !attrs['aria-label'] && !attrs['aria-labelledby']) warnOnce('name', 'sin nombre accesible: falta label, el slot label, aria-label o aria-labelledby.')
  if (props.range && (!props.labels?.start || !props.labels?.end)) warnOnce('labels-range', 'range sin labels.start o labels.end: las dos asas se llamarían igual.')
})

// ---------- Medidas: ancho del área, --_pill-w y la fusión (B1, B2) ----------
const tw = ref(0)
const pw = ref(0)
const isMerged = computed(() => props.range && areMerged(fracs.value[0], fracs.value[1], tw.value, pw.value))
const mid = computed(() => (fracs.value[0] + fracs.value[1]) / 2)
let measureQueued = false
function scheduleMeasure() {
  if (measureQueued) return
  measureQueued = true
  nextFrame(() => {
    measureQueued = false
    measure()
  })
}
function measure() {
  const root = rootEl.value
  const area = areaEl.value
  if (!root || !area) return
  tw.value = area.getBoundingClientRect().width
  const pills = root.querySelectorAll('.g-slider__pill')
  if (pills.length) {
    // Con --_pill-w: 0px puesto: la píldora lleva min-inline-size: var(--_pill-w) y, medida con el valor anterior, nunca
    // encogería (estilo.md «Para bruno» 2)
    root.style.setProperty('--_pill-w', '0px')
    let w = 0
    for (const p of pills) w = Math.max(w, p.getBoundingClientRect().width)
    root.style.setProperty('--_pill-w', `${w}px`)
    pw.value = w
  }
  publishMin()
}

// ---------- Mínimo en una GFormRow (#453) ----------
let published = 0
function publishMin() {
  if (!layout || typeof layout.setIntrinsicMin !== 'function') return
  const root = rootEl.value
  if (!root) return
  const unit = spaceUnit(root)
  let px = unit * 40
  if (pw.value) px = Math.max(px, (props.range ? 4 : 3) * pw.value)
  const named = root.querySelectorAll('.g-slider__mark-label')
  if (named.length) {
    let sum = unit * 2 * (named.length - 1)
    for (const l of named) sum += l.getBoundingClientRect().width
    px = Math.max(px, sum)
  }
  px = Math.ceil(px)
  if (Math.abs(px - published) < 0.5) return
  published = px
  layout.setIntrinsicMin(root, px)
}

// ---------- Estados de gesto ----------
const ready = ref(false)
const dragging = ref(false)
const jumping = ref(false)
const bumpDir = ref(null)
let bumpToken = 0
let jumpToken = 0
const typing = ref({ i: -1, text: '', shown: '' })
let typeTimer = null

const isRtl = () => Boolean(rootEl.value && typeof getComputedStyle === 'function' && getComputedStyle(rootEl.value).direction === 'rtl')
const thumbOf = (i) => natives[i]?.parentElement || null
const parseTime = (x) => {
  const n = parseFloat(x)
  return Number.isFinite(n) ? (String(x).trim().endsWith('ms') ? n : n * 1000) : 0
}
// ¿El asa tiene calculada una animación del tope? (movimiento reducido, sin CSS o jsdom: no, y el dato se quita en el acto)
function bumpComputed(el) {
  if (!el || typeof getComputedStyle !== 'function') return false
  const cs = getComputedStyle(el)
  const names = String(cs.animationName || '').split(',').map((s) => s.trim())
  const durs = String(cs.animationDuration || '').split(',')
  return names.some((n, k) => n.startsWith(BUMP_PREFIX) && parseTime(durs[k % durs.length]) > 0)
}
// B5 · el tope: data-bump en la raíz; coco anima el asa enfocada. Una pulsación nueva lo quita y lo vuelve a poner en el
// cuadro siguiente
function bump(dir, i) {
  const token = ++bumpToken
  bumpDir.value = null
  nextFrame(() => {
    if (token !== bumpToken) return
    bumpDir.value = dir > 0 ? 'up' : 'down'
    nextTick(() => {
      if (token === bumpToken && !bumpComputed(thumbOf(i))) endBump()
    })
  })
}
function endBump() {
  bumpToken++
  bumpDir.value = null
}
function onAnimationEnd(e) {
  ff.onRejectEnd(e)
  if (typeof e.animationName === 'string' && e.animationName.startsWith(BUMP_PREFIX) && bumpDir.value) endBump()
}

// B6 · el salto se desliza: is-jumping hasta el transitionend del asa (filtrado por el elemento: el nombre de la propiedad
// cambia por motor; se descartan los de color, sombra y esquinas), o en el acto si no hay transición de posición calculada
const MOVING = /inset|left|right|all/
function transitionsPosition(el) {
  if (!el || typeof getComputedStyle !== 'function') return false
  const cs = getComputedStyle(el)
  const propsList = String(cs.transitionProperty || '').split(',').map((s) => s.trim())
  const durs = String(cs.transitionDuration || '').split(',')
  return propsList.some((p, k) => MOVING.test(p) && parseTime(durs[k % durs.length]) > 0)
}
function startJump(i) {
  const token = ++jumpToken
  jumping.value = true
  nextTick(() => {
    if (token === jumpToken && jumping.value && !transitionsPosition(thumbOf(i))) jumping.value = false
  })
}
function stopJump() {
  jumpToken++
  jumping.value = false
}
function onTransitionEnd(e) {
  const t = e.target
  if (!jumping.value || !t || !t.classList || !t.classList.contains('g-slider__thumb')) return
  if (/radius|color|shadow/.test(String(e.propertyName || ''))) return
  stopJump()
}

// ---------- Teclado (#449; APG Slider y Multi-Thumb Slider) ----------
const keyFocus = useKeyFocus()
const editable = computed(() => travel.value && !isReadonly.value && !isDisabled.value)
let keyGesture = false

function cancelTyping() {
  clearTimeout(typeTimer)
  typeTimer = null
  if (typing.value.i >= 0) typing.value = { i: -1, text: '', shown: '' }
}
function restartTypeTimer() {
  clearTimeout(typeTimer)
  typeTimer = setTimeout(commitTyping, TYPE_MS)
}
// Confirmar la cifra tecleada (B4): al punto de la rejilla más cercano dentro de los límites del asa; fuera de ellos, al
// límite con el tope. Una confirmación es un gesto
function commitTyping() {
  const { i, text } = typing.value
  cancelTyping()
  if (i < 0) return
  const n = parseTyped(text)
  if (n === null) return
  const [lo, hi] = lim(i)
  stopJump()
  startGesture()
  set(i, snap(n, opts.value, lo, hi))
  if (n > hi + 1e-9 || n < lo - 1e-9) bump(n > hi ? 1 : -1, i)
  endGesture()
}
function typedKey(key) {
  if (key === '-' || key === '−') return '-'
  if (key === '.' || key === ',' || key === '٫' || key === decimalSeparator(locale.value || undefined)) return '.'
  return latin(key)
}

function onKeydown(i, e) {
  keyFocus.onKeydown(e)
  if (e.isComposing || e.keyCode === 229) return
  if (e.altKey || e.ctrlKey || e.metaKey) return
  // B4 · teclear la cifra (cifras latinas o del idioma, un separador con decimales, «-» primero con min < 0)
  if (editable.value) {
    const open = typing.value.i === i
    const t = typedKey(e.key)
    if (t !== null) {
      const text = open ? typing.value.text : ''
      if (acceptTyped(text, t, opts.value)) {
        e.preventDefault()
        stopJump()
        typing.value = { i, text: text + t, shown: (open ? typing.value.shown : '') + (t === '-' ? '-' : e.key) }
        restartTypeTimer()
        return
      }
      if (open) {
        e.preventDefault()
        return
      }
    } else if (open) {
      if (e.key === 'Backspace') {
        e.preventDefault()
        const text = typing.value.text.slice(0, -1)
        if (!text) cancelTyping()
        else {
          typing.value = { i, text, shown: [...typing.value.shown].slice(0, -1).join('') }
          restartTypeTimer()
        }
        return
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        commitTyping()
        return
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        cancelTyping()
        return
      }
      // Cualquier otra tecla confirma y luego actúa (una flecha confirma y da su paso)
      commitTyping()
    }
  }
  const a = keyAction(e, { rtl: isRtl() })
  if (!a) return
  e.preventDefault()
  stopJump()
  if (!editable.value) return
  const [lo, hi] = lim(i)
  const cur = vals.value[i]
  let next
  if (a.kind === 'home') next = lo
  else if (a.kind === 'end') next = hi
  else if (cur === null) next = a.dir > 0 ? lo : hi
  else if ((a.dir > 0 && cur >= hi) || (a.dir < 0 && cur <= lo)) next = cur
  else next = move(cur, a.dir, a.kind, opts.value, lo, hi)
  keyGesture = true
  startGesture()
  if (!set(i, next) && !e.repeat) bump(a.dir, i)
}
function onKeyup(e) {
  if (!keyGesture || !ACTION_KEYS.has(e.key)) return
  keyGesture = false
  endGesture()
}
function onFocus(e) {
  keyFocus.onFocus(e)
}
function onBlur(i, e) {
  keyFocus.onBlur(e)
  if (typing.value.i === i) commitTyping()
  if (keyGesture) {
    keyGesture = false
    endGesture()
  }
}
// Ajuste del lector de pantalla (VoiceOver «ajustable», TalkBack): llega `input` al nativo. UN paso en esa dirección con la
// rejilla y los límites del componente; el evento no burbujea
function onNativeInput(i, e) {
  e.stopPropagation()
  const el = e.target
  const raw = Number(el.value)
  if (editable.value && Number.isFinite(raw)) {
    const [lo, hi] = lim(i)
    const cur = vals.value[i]
    let next = cur
    if (cur === null) next = snap(raw, opts.value, lo, hi)
    else if (Math.abs(raw - cur) > 1e-9) next = move(cur, Math.sign(raw - cur), 'step', opts.value, lo, hi)
    startGesture()
    set(i, next)
    endGesture()
  }
  el.value = String(nativeValue(i))
}

// ---------- Puntero y táctil (#449) ----------
let drag = null
function valueAt(e) {
  const r = areaEl.value.getBoundingClientRect()
  let x = e.clientX - r.left
  if (isRtl()) x = r.width - x
  const p = Math.min(pw.value, r.width)
  const f = Math.min(1, Math.max(0, (x - p / 2) / Math.max(1, r.width - p)))
  return minV.value + f * (maxV.value - minV.value)
}
function focusThumb(i) {
  const el = natives[i]
  if (el && typeof document !== 'undefined' && document.activeElement !== el) el.focus({ preventScroll: true })
}
function jumpTo(i, v, exact) {
  const [lo, hi] = lim(i)
  const target = exact ? Math.min(hi, Math.max(lo, v)) : snap(v, opts.value, lo, hi)
  const from = vals.value[i]
  // Desde «sin elegir» aparece en su sitio, sin deslizarse
  if (from !== null && fracOf(from, base.value) !== fracOf(target, base.value)) startJump(i)
  set(i, target)
}
function onDown(e) {
  if (e.button !== 0 || isDisabled.value || !areaEl.value) return
  const touch = e.pointerType === 'touch'
  const t = e.target
  const thumbEl = !empty.value && t.closest ? t.closest('.g-slider__thumb') : null
  const markLabel = t.closest ? t.closest('.g-slider__mark-label') : null
  const markValue = markLabel ? Number(markLabel.parentElement?.dataset.value) : NaN
  const exact = Number.isFinite(markValue)
  const onFill = props.range && !isMerged.value && Boolean(t.closest && t.closest('.g-slider__fill'))
  const v = exact ? markValue : valueAt(e)
  let i = thumbEl ? Number(thumbEl.dataset.thumb) : pick(vals.value, snap(v, opts.value))
  if (thumbEl && props.range && vals.value[0] === vals.value[1]) i = null
  focusThumb(i ?? (vals.value[0] >= top(base.value) ? 0 : 1))
  if (isReadonly.value || !travel.value) return
  cancelTyping()
  stopJump()
  try { areaEl.value.setPointerCapture(e.pointerId) } catch { /* puntero sintético */ }
  startGesture()
  if (onFill) {
    // B3 · el tramo: en suspenso hasta TAP (toque = el asa más cercana; arrastre horizontal = las dos asas)
    drag = { mode: 'window', x0: e.clientX, y0: e.clientY, a0: vals.value[0], b0: vals.value[1], pending: true, touch, v, exact: false }
    return
  }
  if (thumbEl) {
    drag = { mode: 'thumb', i, x0: e.clientX, y0: e.clientY, pending: false, touch, v, exact: false }
    dragging.value = true
    return
  }
  // Riel o marca: con ratón y lápiz el asa más cercana va ahí y el arrastre sigue; en táctil, solo con un toque
  drag = { mode: 'thumb', i, x0: e.clientX, y0: e.clientY, pending: touch, touch, v, exact }
  if (!touch && i !== null) jumpTo(i, v, exact)
}
function onMove(e) {
  if (!drag) return
  const dx = e.clientX - drag.x0
  const dy = e.clientY - drag.y0
  if (drag.pending) {
    // En táctil, el gesto vertical desplaza la página (touch-action: pan-y): el componente lo abandona
    if (drag.touch && Math.abs(dy) > TAP && Math.abs(dy) > Math.abs(dx)) {
      drag = null
      gestureFrom = null
      return
    }
    if (Math.abs(dx) <= TAP) return
    drag.pending = false
  }
  stopJump()
  if (drag.mode === 'window') {
    dragging.value = true
    const r = areaEl.value.getBoundingClientRect()
    const d = ((isRtl() ? -dx : dx) / Math.max(1, r.width - pw.value)) * (maxV.value - minV.value)
    const [a, b] = windowMove(drag.a0, drag.b0, d, opts.value)
    setBoth(a, b)
    return
  }
  if (drag.i === null) {
    if (Math.abs(dx) < TIE) return
    drag.i = (isRtl() ? dx < 0 : dx > 0) ? 1 : 0
    focusThumb(drag.i)
  }
  dragging.value = true
  const [lo, hi] = lim(drag.i)
  set(drag.i, snap(valueAt(e), opts.value, lo, hi))
}
function onUp() {
  if (!drag) return
  const d = drag
  drag = null
  if (d.pending) {
    // Un toque: el riel, la marca o el tramo llevan el asa más cercana a ese punto (WCAG 2.5.7)
    let i = d.mode === 'window' ? pick(vals.value, snap(d.v, opts.value)) : d.i
    if (i === null) i = pick(vals.value, d.v)
    if (i !== null) {
      focusThumb(i)
      jumpTo(i, d.v, d.exact)
    }
  }
  dragging.value = false
  endGesture()
}
function onCancel() {
  if (drag) drag = null
  dragging.value = false
  endGesture()
}
watch([isDisabled, isReadonly], () => {
  if (drag) onCancel()
  cancelTyping()
})

// ---------- Montaje ----------
let offArea = null
let offPill = null
let offMarks = null
let unmounted = false
function observe() {
  offPill?.()
  offMarks?.()
  const root = rootEl.value
  offPill = root ? observeSize(root.querySelector('.g-slider__pill'), scheduleMeasure) : null
  offMarks = root ? observeSize(root.querySelector('.g-slider__marks'), scheduleMeasure) : null
}
function onFonts() {
  scheduleMeasure()
}
watch(() => [refTexts.value.join('|'), empty.value, props.range, ff.density.value, markInfo.value.list.length, locale.value], () => nextTick(() => {
  observe()
  scheduleMeasure()
}))
onMounted(() => {
  domLang.value = rootEl.value?.closest('[lang]')?.getAttribute('lang') || null
  mounted.value = true
  nextTick(() => {
    if (unmounted) return
    measure()
    offArea = observeSize(areaEl.value, scheduleMeasure)
    observe()
    // is-ready tras medir (dos cuadros): nada se anima al montar (#299 (4))
    nextFrame(() => nextFrame(() => { if (!unmounted) ready.value = true }))
  })
  if (typeof document !== 'undefined' && document.fonts) {
    document.fonts.ready?.then(onFonts)
    document.fonts.addEventListener?.('loadingdone', onFonts)
  }
})
onBeforeUnmount(() => {
  unmounted = true
  clearTimeout(typeTimer)
  endBump()
  stopJump()
  drag = null
  offArea?.()
  offPill?.()
  offMarks?.()
  if (typeof document !== 'undefined') document.fonts?.removeEventListener?.('loadingdone', onFonts)
  if (published && layout && typeof layout.setIntrinsicMin === 'function') layout.setIntrinsicMin(rootEl.value, 0)
  published = 0
})

// ---------- Clases y datos (contrato bruno ↔ coco) ----------
const classes = computed(() => [
  'g-slider',
  `g-slider--color-${COLORS.includes(props.color) ? props.color : 'brand'}`,
  `g-slider--density-${ff.density.value}`,
  attrs.class,
  {
    'g-slider--range': props.range,
    'is-empty': empty.value,
    'is-readonly': isReadonly.value,
    'is-disabled': isDisabled.value,
    'is-invalid': ff.invalid.value,
    'is-warning': ff.ownMessage.value?.type === 'warning',
    'is-valid': ff.ownMessage.value?.type === 'valid',
    'is-rejected': ff.rejected.value,
    'is-ready': ready.value,
    'is-dragging': dragging.value,
    'is-jumping': jumping.value,
    'is-merged': isMerged.value
  }
])
const rootStyle = computed(() => [attrs.style, { '--_pill-w': `${pw.value}px`, '--_mid': isMerged.value ? String(mid.value) : undefined }])
const fillStyle = computed(() => ({ '--_from': String(props.range ? fracs.value[0] : 0), '--_to': String(fracs.value[props.range ? 1 : 0]) }))
const hiddenValue = (v) => (v === null ? '' : String(v))
const visibleMarks = computed(() => markInfo.value.list)
</script>

<template>
  <div ref="rootEl" v-bind="rootAttrs" :class="classes" :style="rootStyle" :data-bump="bumpDir || undefined" @animationend="onAnimationEnd" @animationcancel="onAnimationEnd" @transitionend="onTransitionEnd" @focusout="ff.handlers.onFocusout">
    <div class="g-slider__head"><label v-if="hasLabel && !range" :id="labelId" class="g-slider__label" :for="id"><slot name="label">{{ label }}</slot><template v-if="ff.mark.value === 'optional' && ff.markText.value">{{ ' ' }}<span class="g-slider__optional">{{ ff.markText.value }}</span></template><span v-if="ff.mark.value === 'required'" class="g-slider__required" aria-hidden="true">*</span></label><span v-else-if="hasLabel" :id="labelId" class="g-slider__label" @click="focusStart"><slot name="label">{{ label }}</slot><template v-if="ff.mark.value === 'optional' && ff.markText.value">{{ ' ' }}<span class="g-slider__optional">{{ ff.markText.value }}</span></template><span v-if="ff.mark.value === 'required'" class="g-slider__required" aria-hidden="true">*</span></span><span v-if="empty" class="g-slider__value" aria-hidden="true"><bdi>{{ labels.empty }}</bdi></span></div>
    <div class="g-slider__row" v-bind="groupNaming">
      <div ref="areaEl" class="g-slider__area" @mousedown.prevent @pointerdown="onDown" @pointermove="onMove" @pointerup="onUp" @pointercancel="onCancel" @lostpointercapture="onCancel">
        <span class="g-slider__track"></span>
        <span v-if="!empty" class="g-slider__fill" :style="fillStyle"></span>
        <span v-for="(v, i) in vals" :key="i" class="g-slider__thumb" :class="{ 'is-typing': typing.i === i }" :data-thumb="i" :style="empty ? undefined : { '--_at': String(fracs[i]) }">
          <span v-if="!empty" class="g-slider__pill" aria-hidden="true"><span class="g-slider__pill-text" dir="auto">{{ typing.i === i ? typing.shown : pillTexts[i] }}</span><span class="g-slider__pill-ref"><span v-for="t in refTexts" :key="t">{{ t }}</span></span></span>
          <input :ref="setNative(i)" class="g-slider__native" type="range" step="any" v-bind="nativeAttrs(i)" @keydown="onKeydown(i, $event)" @keyup="onKeyup" @focus="onFocus" @blur="onBlur(i, $event)" @input="onNativeInput(i, $event)" @change.stop>
          <span v-if="range" :id="nameId(i)" class="g-slider__thumb-name" hidden>{{ thumbName(i) }}</span>
        </span>
      </div>
      <div v-if="visibleMarks.length" class="g-slider__marks" aria-hidden="true" @mousedown.prevent @pointerdown="onDown">
        <span v-for="m in visibleMarks" :key="m.value" class="g-slider__mark" :class="{ 'has-label': Boolean(m.label) }" :data-value="m.value" :style="{ '--_at': String(fracOf(m.value, base)) }"><span v-if="m.label" class="g-slider__mark-label">{{ m.label }}</span></span>
      </div>
      <input v-for="(v, i) in vals" :key="`h${i}`" type="hidden" :name="name" :value="hiddenValue(v)" :disabled="isDisabled || undefined" :form="attrs.form">
    </div>
    <div class="g-slider__support">
      <p v-if="hasHint" :id="hintId" class="g-slider__hint"><slot name="hint">{{ hint }}</slot></p>
      <div :id="ff.messageId.value" class="g-slider__message" :aria-live="ff.live.value"><template v-if="message"><GIcon class="g-slider__message-icon" :name="messageIcon(message.type)" /><span v-if="message.prefix" class="g-slider__sr">{{ message.prefix }} </span><slot v-if="message.type === 'error'" name="error">{{ message.text }}</slot><template v-else>{{ message.text }}</template></template></div>
    </div>
  </div>
</template>
