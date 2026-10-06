<script setup>
// GCombobox · elegir una opción de un catálogo grande escribiendo (dueño: bruno)
// Contrato: design/contracts/combobox.md (DECISIONS.md #329 a #338) · Estructura: design/lab/combobox/r01 y r02 (kiwi)
// Estilo: GCombobox.css (coco). COMPONE GInput (#330, como GNumberField #309) con sus slots internos `field` (la celda
// `g-combobox__value` con el <input role="combobox">, las capas fantasma y ficha, la descripción oculta y los ocultos) y
// `end` (limpiar y flecha). Región viva, panel (popover) y superficie (GDialog real) se trasladan a la raíz de GInput con
// <Teleport>: quedan como hijos de la raíz, fuera de flujo, tal como fija el contrato, sin tocar GInput.
// Sin fetch (#332): emite `search`, `more` y `create`; la aplicación entrega options, loading, total y loadError.
// APG «Combobox with list autocomplete»: el foco nunca sale del campo; la opción activa va por aria-activedescendant.
// Fichas (#356, summary.md «Adopción en GCombobox»): la opción por defecto, la ficha del valor y la vista previa se
// pintan con GSummary (row lines 2 · inline · stack); el contraste entre homónimas (summaryDiff) se calcula sobre las
// opciones PINTADAS. Los slots option, value y preview siguen ganando. GSummary, summaryDiff y utils/match.js viven en
// el paquete principal y llegan aquí por `__shared` (vite.combobox.config.js), sin copia.
// Fase 2 · `multiple` (combobox.md «Fase 2 · Selección múltiple», #417 a #428): un modo del mismo componente, leído al
// montar. A · la frase (selection="inline"), B · la receta (selection="list", en el slot interno `below` de GInput, N5),
// C · la cesta (appearance="palette"). El modelo son dos arreglos (valores y textos libres); cada gesto emite una vez.
// Sin `multiple`, todo lo de la Fase 1 queda igual (sus pruebas lo vigilan).
import { Fragment, computed, h, inject, mergeProps, nextTick, onBeforeUnmount, onMounted, reactive, ref, shallowRef, unref, useAttrs, useId, useSlots, watch } from 'vue'
import { oneOf } from '../../utils/oneOf.js'
import { fill } from '../../utils/template.js'
import { placeBlock } from '../../utils/anchor.js'
import { createLiveWriter } from '../../utils/liveRegion.js'
import { fold, tokens } from '../../utils/match.js'
import GInput from '../GInput/GInput.vue'
import GDialog from '../GDialog/GDialog.vue'
import GSummary from '../GSummary/GSummary.vue'
import GBtn from '../GBtn/GBtn.vue'
import { observeSize } from '../../utils/sizeObserver.js'
import { summaryDiff } from '../GSummary/diff.js'
import GIcon from '../GIcon/GLibIcon.js'    // iconos propios: SOLO la lista de la librería
import { formKey, layoutKey, nextFrame, spaceUnit } from '../GForm/formContext.js'
import { completion, matches, secondary, validOption, visibleFact } from './engine.js'
import { keyOf, keyOfText, normCustom, normValues, reconcile, resolveWidth, sameList } from './multi.js'

defineOptions({ name: 'GCombobox', inheritAttrs: false })

const props = defineProps({
  modelValue: { type: [String, Number, Array], default: null },
  custom: { type: [String, Array], default: '' },
  options: { type: Array, default: () => [] },
  selectedOption: { type: Object, default: null },
  appearance: { type: String, default: 'field', validator: oneOf(['field', 'palette']) },
  filter: { type: [Boolean, Function], default: true },
  loading: Boolean,
  total: { type: Number, default: null },
  loadError: { type: String, default: undefined },
  minChars: { type: Number, default: 0, validator: (v) => Number.isInteger(v) && v >= 0 },
  delay: { type: Number, default: 250, validator: (v) => Number.isFinite(v) && v >= 0 },
  limit: { type: Number, default: 50, validator: (v) => Number.isInteger(v) && v >= 1 },
  allowCustom: Boolean,
  customName: { type: String, default: undefined },
  creatable: Boolean,
  clearable: Boolean,
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
  size: { type: String, default: 'md', validator: oneOf(['xs', 'sm', 'md', 'lg', 'xl']) },
  variant: { type: String, default: 'outline', validator: oneOf(['outline', 'soft']) },
  density: { type: String, default: undefined, validator: oneOf(['default', 'comfortable', 'compact']) },
  color: { type: String, default: undefined, validator: oneOf(['brand', 'accent', 'neutral', 'success', 'warning', 'danger', 'info']) },
  rounded: { type: String, default: undefined, validator: oneOf(['none', 'xs', 'sm', 'md', 'lg', 'xl', 'pill']) },
  block: { type: Boolean, default: undefined },
  id: { type: String, default: undefined },
  // Fase 2 (#417 a #428): solo con `multiple`; sin él se ignoran con aviso 15
  multiple: Boolean,
  selectedOptions: { type: Array, default: () => [] },
  selection: { type: String, default: 'inline', validator: oneOf(['inline', 'list']) },
  numbered: Boolean,
  max: { type: Number, default: undefined, validator: (v) => Number.isInteger(v) && v >= 1 }
})

// Todos declarados (lección de `emits`): el @change del consumidor recibe el objeto y no llega al <input> nativo
const emit = defineEmits(['update:modelValue', 'update:custom', 'change', 'search', 'more', 'create', 'open', 'close'])

const attrs = useAttrs()
const slots = useSlots()
const uid = useId()
const baseId = computed(() => props.id || `g-combobox-${uid}`)
const sub = (s) => `${baseId.value}-${s}`

// Constantes neutras de JS (tokens.md §32): no son tema
const ANNOUNCE_MS = 600   // retardo del anuncio, para no pisar el eco de escritura
const LIVE_GAP = 50       // el canal se vacía y se escribe en el ciclo siguiente (liveRegion.js)
const LIVE_CLEAR = 5000
const PAGE_ROWS = 10      // Av Pág / Re Pág
const UP_BELOW = 240      // «abre hacia arriba» si debajo queda menos (o menos que el alto natural)
const MIN_ROOM = 96       // alto disponible mínimo que se publica en --_max
const EDGE = 8            // margen con el visor
const SIDE_MIN_SPACES = 40  // el lado elegido deja de ser útil por debajo de space × 40…
const SIDE_FLIP_SPACES = 12 // …y solo se cambia si el otro ofrece al menos space × 12 más (histéresis)
const PHONE_QUERY = '(max-width: 520px)' // umbral literal de #42 y #56
const ARRIVE_PREFIX = 'g-combobox-arrive'
const PIN_CAP = 12          // filas de «Elegidas» y renglones de la cesta antes de «Ver las N» (constante de diseño, #425)
const ROWS_CAP = 6          // renglones de la receta en reposo antes de «Ver los N» (#426)

// `multiple` se lee AL MONTAR (#338, aviso 13): cambiarlo después no tiene efecto; para cambiar de modo, la `key`
const M = Boolean(props.multiple)

// ---------- Avisos (una vez por instancia y motivo) ----------
const isDev = typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production'
const warned = new Set()
function warnOnce(key, text) {
  if (!isDev || warned.has(key)) return
  warned.add(key)
  console.warn(`[Grana GCombobox] ${text}`)
}
const L = computed(() => props.labels || {})
/** Texto de labels que hace falta ahora: si no está, avisa una vez y devuelve '' */
function need(key, why) {
  const v = L.value[key]
  if (v === undefined || v === null || v === '') {
    warnOnce(`label:${key}`, `falta labels.${key}${why ? ` (${why})` : ''}: los textos los pone la aplicación.`)
    return ''
  }
  return v
}
/** Texto contado o con marcadores: String con `fill` o Function con `args` (plural y género los pone la aplicación) */
function tx(key, why, vars, ...args) {
  const v = L.value[key]
  if (typeof v === 'function') return String(v(...args) ?? '')
  return fill(need(key, why), vars)
}

// ---------- Contexto (como GNumberField: el campo lo registra GInput; aquí solo se resuelven readonly y disabled) ----------
const form = inject(formKey, null)
const layout = inject(layoutKey, null)
const isReadonly = computed(() => props.readonly ?? unref(layout?.readonly) ?? unref(form?.readonly) ?? false)
const isDisabled = computed(() => props.disabled ?? unref(layout?.disabled) ?? unref(form?.disabled) ?? false)
const editable = computed(() => !isDisabled.value && !isReadonly.value)

// ---------- Props resueltas ----------
const remote = computed(() => props.filter === false)
const limit = computed(() => (Number.isInteger(props.limit) && props.limit >= 1 ? props.limit : 50))
const delay = computed(() => (Number.isFinite(props.delay) && props.delay >= 0 ? props.delay : 250))
const minChars = computed(() => (Number.isInteger(props.minChars) && props.minChars >= 0 ? props.minChars : 0))
const hasLabel = computed(() => Boolean(props.label || slots.label))

// ---------- Opciones ----------
const flat = computed(() => {
  const out = []
  const seen = new Set()
  let g = 0
  const add = (o, group) => {
    if (!validOption(o)) {
      warnOnce('option-invalid', 'hay una opción sin value (String o Number) o sin label: se ignora.')
      return
    }
    if (seen.has(o.value)) warnOnce(`option-dup:${String(o.value)}`, `dos opciones tienen el mismo value (${String(o.value)}): debe ser único.`)
    seen.add(o.value)
    // Dato sin label (#335, #356 «Dato visible»): no se pinta, no se busca ni se anuncia. Aviso propio aunque la opción
    // no llegue a pintarse (o la pinte el slot option, sin GSummary que avise)
    if (isDev && Array.isArray(o.facts) && o.facts.some((f) => f && typeof f === 'object' && !visibleFact({ label: f.label, value: 'x' })) /* rótulo ausente, misma regla */) {
      warnOnce('fact-label', 'una opción tiene un dato de facts sin label: no se pinta, no se busca ni se lee en la descripción accesible. El rótulo es obligatorio.')
    }
    out.push({ o, group })
  }
  for (const o of props.options || []) {
    if (o && Array.isArray(o.options)) {
      const group = { n: g++, label: String(o.label ?? '') }
      for (const child of o.options) add(child, group)
    } else add(o, null)
  }
  return out
})

// El componente recuerda toda opción elegida que haya pintado (búsqueda remota: la elegida deja de estar en `options`)
const known = new Map()
const selected = computed(() => {
  const v = props.modelValue
  if (M || v === null || v === undefined) return null
  const hit = flat.value.find((x) => x.o.value === v)
  if (hit) {
    known.set(v, hit.o)
    return hit.o
  }
  const so = props.selectedOption
  if (so && so.value === v && validOption(so)) return so
  return known.get(v) || null
})
const hasModel = computed(() => !M && props.modelValue !== null && props.modelValue !== undefined)
// Texto libre efectivo: solo con allowCustom y sin opción (con los dos, gana modelValue)
const customText = computed(() => (props.allowCustom && !hasModel.value && typeof props.custom === 'string' ? props.custom : ''))
const hasValue = computed(() => Boolean(selected.value) || customText.value !== '')
const displayText = computed(() => (selected.value ? selected.value.label : customText.value))

// ---------- Estado ----------
const narrow = ref(false)   // visor por debajo del umbral móvil: se resuelve al montar (SSR pinta según appearance)
const surface = computed(() => props.appearance === 'palette' || narrow.value)
const opened = ref(false)   // abierto en sentido lógico; el panel de `field` solo se ve si además hay filas o estado
const up = ref(false)
const text = ref(displayText.value)   // texto del <input> visible
const typed = ref(false)              // hay texto a medio escribir (sin confirmar)
const query = ref('')                 // texto del campo de búsqueda de la superficie
const q = ref('')                     // texto buscado (el que filtra y se marca); `→` cambia `text` sin cambiar `q`
const shown = ref(limit.value)        // tope de pintado con filtro local
const focused = ref(false)
const composing = ref(false)
const caretEnd = ref(true)
const active = shallowRef(null)       // identidad `k` de la fila activa (opción, elegida de «Elegidas» o fila de acción)
const auto = ref(false)               // la activa la puso el componente (resaltada sola), no la persona
const debouncing = ref(false)
const awaiting = ref(false)           // se emitió search o more y la aplicación aún no respondió
let needsSettle = false
let moreFrom = null
let timer = null
let annTimer = null

const fieldEl = ref(null)
const valueEl = ref(null)
const tokenEl = ref(null)
const popupEl = ref(null)
const host = shallowRef(null)         // raíz de GInput: destino del Teleport
const domLang = ref(null)

const qTrim = computed(() => q.value.trim())
const short = computed(() => minChars.value > 0 && qTrim.value.length > 0 && qTrim.value.length < minChars.value)
// Pendiente (#332): solo con filter: false. Antirrebote en curso, loading, o emitido y sin respuesta
const pending = computed(() => remote.value && (debouncing.value || props.loading || awaiting.value))
const busy = computed(() => props.loading || pending.value)

// ---------- Cifras: Intl.NumberFormat del lang del ancestro más cercano (como GNumberField; sin prop locale) ----------
const numberFormat = computed(() => {
  try { return new Intl.NumberFormat(domLang.value || undefined) } catch { return new Intl.NumberFormat() }
})
const nf = (n) => numberFormat.value.format(n)

// ---------- Fase 2 · modelo (#420): dos arreglos; lo elegido = los valores en su orden y después los textos libres ----------
const optionMap = computed(() => {
  const m = new Map()
  for (const { o } of flat.value) if (!m.has(o.value)) m.set(o.value, o)
  return m
})
const soMap = computed(() => {
  const m = new Map()
  if (M) for (const o of props.selectedOptions || []) if (validOption(o)) m.set(o.value, o)
  return m
})
const optionOf = (v) => optionMap.value.get(v) || soMap.value.get(v) || known.get(v) || null
const warnModel = (k) => warnOnce(`m-${k}`, k === 'array' ? 'con multiple, modelValue y custom son arreglos: se normalizan.' : 'con multiple, un elemento repetido se pinta y se envía una vez.')
const values = computed(() => (M ? normValues(props.modelValue, warnModel) : []))
const customs = computed(() => {
  if (!M) return []
  const c = normCustom(props.custom, warnModel)
  if (c.length && !props.allowCustom) {
    warnOnce('custom-off', 'custom tiene valor sin allowCustom: se ignora.')
    return []
  }
  return c
})
const chosen = computed(() => [
  ...values.value.map((v) => {
    const o = optionOf(v)
    if (o) known.set(v, o)
    else warnOnce(`unknown:${keyOf(v)}`, `modelValue incluye ${String(v)}, sin opción conocida ni en selectedOptions: se pinta con String(value), se puede quitar y se envía.`)
    return { key: keyOf(v), value: v, option: o, label: o ? o.label : String(v) }
  }),
  ...customs.value.map((t) => ({ key: keyOfText(t), text: t, label: t }))
])
const count = computed(() => chosen.value.length)
const maxN = computed(() => (M && Number.isInteger(props.max) && props.max >= 1 ? props.max : 0))
const isFull = computed(() => maxN.value > 0 && count.value >= maxN.value)
const valueSet = computed(() => new Set(values.value))
const customSet = computed(() => new Set(customs.value.map(keyOfText)))
const isChosen = (it) => (it.text != null ? customSet.value.has(it.key) : valueSet.value.has(it.value))
const itemOf = (o) => ({ key: keyOf(o.value), value: o.value, option: o, label: o.label })
/** Nombre de un elemento (#423): `code` + espacio + `label`, o `label`; un texto libre, labels.customItem con {text} */
const nameOf = (it) => (it.text != null ? (L.value.customItem ? fill(L.value.customItem, { text: it.text }) : it.text) : it.option && it.option.code ? `${it.option.code} ${it.label}` : it.label)
/** En la frase (#425): el `code` si lo hay (así se escriben los diagnósticos), si no `label`; un texto libre, su texto */
const shortOf = (it) => (it.text != null ? it.text : it.option && it.option.code ? it.option.code : it.label)
/** Elemento de `change` (#421): la forma del `change` de la Fase 1 */
const elementOf = (it) => (it.text != null ? { value: null, custom: it.text, option: null } : { value: it.value, custom: '', option: it.option })
const listFormat = computed(() => {
  try { return new Intl.ListFormat(domLang.value || undefined, { type: 'conjunction' }) } catch { return null }
})
const aboutMulti = computed(() => {
  if (!count.value) return ''
  const words = chosen.value.map(nameOf)
  const list = listFormat.value ? listFormat.value.format(words) : words.join(', ')
  const v = L.value.about
  if (typeof v === 'function') return String(v(count.value, list) ?? '')
  if (!v) {
    warnOnce('label:about', 'falta labels.about: la descripción accesible dice solo la lista.')
    return list
  }
  return fill(v, { count: nf(count.value), list })
})
/** Recuento de la cesta y del pie: `ofMax` con tope (sin él, `selected`) */
const tally = computed(() => (maxN.value && L.value.ofMax ? tx('ofMax', '', { count: nf(count.value), max: nf(maxN.value) }, count.value, maxN.value) : tx('selected', 'recuento', { count: nf(count.value) }, count.value)))
// «Elegidas» (#425): instantánea de lo elegido al abrir con el texto vacío (y cada vez que vuelve a quedar vacío); con
// texto, ninguna. En `field` con la frase y en la hoja móvil (con la receta, lo elegido ya está debajo; en la paleta, la cesta)
const snapshot = shallowRef(null)
const pinAll = ref(false)
const pinMode = computed(() => M && (narrow.value || (props.appearance !== 'palette' && props.selection !== 'list')))
function snap() {
  pinAll.value = false
  snapshot.value = pinMode.value && opened.value && !qTrim.value && count.value ? chosen.value.slice() : null
}

// ---------- Filas ----------
const matched = computed(() => {
  if (remote.value) return flat.value
  const t = qTrim.value
  if (!t) return flat.value
  if (typeof props.filter === 'function') return flat.value.filter(({ o }) => Boolean(props.filter(o, t)))
  const toks = tokens(t)
  return flat.value.filter(({ o }) => matches(o, toks))
})
// Lo que está en «Elegidas» no se repite en los grupos del catálogo de debajo (#418)
const pool = computed(() => {
  const s = M && opened.value && snapshot.value
  if (!s) return matched.value
  const pinned = new Set(s.filter((it) => it.text == null).map((it) => it.value))
  return matched.value.filter(({ o }) => !pinned.has(o.value))
})
const visible = computed(() => (short.value ? [] : remote.value ? pool.value : pool.value.slice(0, shown.value)))
const totalCount = computed(() => {
  if (!remote.value) return pool.value.length
  return Number.isFinite(props.total) && props.total >= 0 ? props.total : pool.value.length
})
const rows = computed(() => {
  const blocks = []
  const all = []
  const optionRows = []
  const add = (b, row) => {
    row.index = all.length
    b.rows.push(row)
    all.push(row)
    if (row.kind === 'option') optionRows.push(row)
  }
  const full = isFull.value
  // «Elegidas» (multiple): primer grupo, instantánea; ids propios ID-opt-c{n}; tope de 12 con «Ver las N» al final
  const s = M && opened.value ? snapshot.value : null
  if (s && s.length) {
    const b = { key: 'gc', chosen: true, gid: sub('grp-chosen'), rows: [] }
    blocks.push(b)
    const cut = !pinAll.value && s.length > PIN_CAP && need('showAll', '«Ver las N» de «Elegidas»')
    s.forEach((it, n) => {
      if (cut && n >= PIN_CAP && armed.value !== it.key) return // el marcado por Retroceso se saca a la vista
      const sel = isChosen(it)
      add(b, { kind: 'option', k: it.key, id: sub(`opt-c${n}`), o: it.option || { value: it.value, label: it.label }, item: it, selected: sel, blocked: full && !sel })
    })
    if (cut) add(b, { kind: 'action', action: 'all', k: 'a:all', id: sub('opt-all'), icon: 'chevron-down', label: tx('showAll', '«Ver las N»', { count: nf(s.length) }, s.length) })
  }
  let k = 0
  for (const { o, group } of visible.value) {
    let b = blocks[blocks.length - 1]
    if (!b || b.group !== group || b.chosen) {
      b = { key: group ? `g${group.n}` : `p${blocks.length}`, group, gid: group ? sub(`grp-${group.n}`) : null, rows: [] }
      blocks.push(b)
    }
    const sel = M ? valueSet.value.has(o.value) : hasModel.value && o.value === props.modelValue
    add(b, { kind: 'option', k: keyOf(o.value), id: sub(`opt-${k++}`), o, disabled: Boolean(o.disabled), selected: sel, blocked: full && !sel })
  }
  // Filas de acción (#57): hijas directas del listbox, fuera de los grupos y siempre al final
  const t = qTrim.value
  const acts = []
  let hasMore = false
  if (props.loadError) acts.push({ action: 'retry', icon: 'rotate-ccw', label: need('retry', 'fila «Reintentar»') })
  else if (!short.value && visible.value.length < totalCount.value) {
    hasMore = true
    acts.push({ action: 'more', icon: 'chevron-down', label: fill(need('more', 'fila «Mostrar más»'), { shown: nf(visible.value.length), total: nf(totalCount.value) }) })
  }
  if (t && !short.value) {
    if (props.allowCustom && L.value.useCustom) {
      const ft = fold(t)
      // Con multiple, tampoco si el texto ya está en `custom`; con el tope, deshabilitada pero recorrible (#422)
      if (!optionRows.some((r) => fold(r.o.label) === ft) && !(M && customSet.value.has(keyOfText(t)))) acts.push({ action: 'custom', icon: 'pencil', label: fill(L.value.useCustom, { text: t }), blocked: full })
    }
    if (props.creatable && L.value.create) acts.push({ action: 'create', icon: 'plus', label: fill(L.value.create, { text: t }) })
  }
  const actions = acts.map((a) => {
    const row = { kind: 'action', k: `a:${a.action}`, id: sub(`opt-${a.action}`), index: all.length, ...a }
    all.push(row)
    return row
  })
  return { blocks, all, optionRows, actions, hasMore, nav: all.filter((r) => !r.disabled) }
})
const activeRow = computed(() => {
  const a = active.value
  if (!a) return null
  return rows.value.nav.find((r) => r.k === a) || null
})
const status = computed(() => {
  if (props.loadError) return { kind: 'error', icon: 'circle-alert', text: props.loadError }
  if (isFull.value) return { kind: 'max', icon: 'triangle-alert', text: tx('max', 'estado del tope', { max: nf(maxN.value) }, maxN.value) }
  if (short.value) return { kind: 'hint', icon: 'search', text: fill(need('minChars', 'pista de mínimo'), { count: nf(minChars.value) }) }
  if (rows.value.optionRows.length) return null
  if (busy.value) return { kind: 'loading', icon: 'loader-circle', text: need('loading', 'estado «Buscando…»') }
  if (qTrim.value) return { kind: 'empty', icon: 'search', text: fill(slots.empty ? L.value.noResults : need('noResults', 'estado sin resultados'), { text: qTrim.value }) }
  return null
})
const hasPanel = computed(() => Boolean(status.value) || rows.value.all.length > 0)
const panelVisible = computed(() => opened.value && (surface.value || hasPanel.value))
const listOpen = computed(() => opened.value && !surface.value && hasPanel.value)

// La activa se lleva a la vista SOLO si la puso el teclado o un cambio de resultados; la del puntero nunca desplaza la
// lista (saltaría bajo el puntero)
let revealActive = false
function setActive(row, byComponent, reveal = true) {
  revealActive = Boolean(row) && reveal
  active.value = row ? row.k : null
  auto.value = Boolean(row) && byComponent
}

// ---------- Texto fantasma (A, #333) y ficha (C) ----------
const ghost = computed(() => {
  if (surface.value || !opened.value || !typed.value || pending.value || composing.value || !caretEnd.value || !text.value) return null
  const first = rows.value.nav.find((r) => r.kind === 'option')
  if (!first || activeRow.value !== first) return null
  const rest = completion(first.o.label, text.value)
  if (rest === null) return null
  // Única: ninguna otra opción a la vista se llama igual y no quedan resultados sin pintar (no hay «Mostrar más»)
  const fl = fold(first.o.label)
  const unique = !rows.value.hasMore && rows.value.optionRows.filter((r) => fold(r.o.label) === fl).length === 1
  return { row: first, rest, unique }
})
const showToken = computed(() => hasValue.value && !typed.value && !(opened.value && !surface.value))
const isCustom = computed(() => !selected.value && customText.value !== '')
const about = computed(() => {
  if (M) return aboutMulti.value
  if (!hasValue.value || typed.value) return ''
  if (selected.value) return secondary(selected.value)
  return L.value.custom || ''
})

// ---------- Contexto de GInput (slot interno `field`) ----------
let ctx = null
function setFieldEl(el) {
  fieldEl.value = el || null
  ctx?.setControl(el || null)
}
function writeText(t) {
  text.value = t
  const el = fieldEl.value
  if (el && el.value !== t) el.value = t
}
function readCaret(el) {
  let end = true
  try { end = el.selectionStart === el.value.length && el.selectionEnd === el.value.length } catch { /* sin selección */ }
  caretEnd.value = end
}
function selectAll() {
  const el = fieldEl.value
  if (el && focused.value && el.value) {
    try { el.select() } catch { /* sin selección */ }
  }
}
// El texto sigue a las props mientras no se escribe (el componente no guarda copia del valor: pinta las props)
watch(displayText, (t) => {
  if (typed.value && focused.value) return
  typed.value = false
  writeText(t)
})

// ---------- Modelo (#331) ----------
function commitValue(value, custom, option) {
  const curValue = hasModel.value ? props.modelValue : null
  const curCustom = typeof props.custom === 'string' ? props.custom : ''
  let changed = false
  if (value !== curValue) { emit('update:modelValue', value); changed = true }
  if (custom !== curCustom) { emit('update:custom', custom); changed = true }
  if (!changed) return
  emit('change', { value, custom, option })
  ctx?.notifyChange()
}
// Tras confirmar, el texto vuelve a ser el de las props (si la aplicación no aceptó el cambio, se ve)
function syncSoon() {
  nextTick(() => { if (!typed.value) writeText(displayText.value) })
}

// ---------- Fase 2 · gestos (#421): un gesto = a lo sumo un update:modelValue, un update:custom y un change ----------
const armed = ref(null)       // clave del elemento marcado por la primera pulsación de Retroceso
let lastRemoved = null        // { memo: [{ it, at }], all } · deshacer de un nivel (#419)
let ownSig = null             // firma del modelo que emitió el último gesto: otra firma es un cambio de la aplicación
const sigOf = () => JSON.stringify([values.value, customs.value])
const ticking = ref(null)     // fila cuya casilla salta (is-ticking)
const rolling = ref(false)    // cifras que ruedan (is-rolling)
const rollKey = ref(0)        // cada gesto vuelve a crear las cifras: la animación arranca de nuevo
/** Cifra de un recuento (`__num`): rueda tras un gesto */
const num = (t) => h('span', { key: rollKey.value, class: ['g-combobox__num', { 'is-rolling': rolling.value }] }, t)
// El anuncio de un gesto va en el acto (un anuncio por gesto) y sustituye a lo que esperaba escribirse: el recuento de
// resultados pendiente (el de los 600 ms) y el de un gesto anterior del mismo ciclo, ya obsoletos
function say(t) {
  clearTimeout(annTimer)
  annTimer = null
  writer.dispose()
  if (t) writer.announce(t, 'polite')
}
function commitMulti(v, c, added, removed) {
  const vc = !sameList(v, values.value)
  const cc = !sameList(c, customs.value)
  if (!vc && !cc) return false
  lastRemoved = null
  ownSig = JSON.stringify([v, c])
  if (vc) emit('update:modelValue', v)
  if (cc) emit('update:custom', c)
  emit('change', { value: v, custom: c, options: v.map((x) => optionOf(x)), added: added.map(elementOf), removed: removed.map(elementOf) })
  ctx?.notifyChange()
  rollKey.value++
  rolling.value = true
  afterAnim('.g-combobox__num.is-rolling', 'g-combobox-roll', () => { rolling.value = false })
  nextTick(() => { ledger.value = reconcile(ledger.value, chosen.value, newEntry) }) // si la aplicación no aceptó el cambio
  return true
}
function addItem(it, from) {
  if (isChosen(it)) return
  if (isFull.value) return say(tx('max', 'anuncio del tope', { max: nf(maxN.value) }, maxN.value))
  if (it.option) known.set(it.value, it.option)
  const v = values.value.slice()
  const c = customs.value.slice()
  if (it.text != null) c.push(it.text)
  else v.push(it.value)
  // El renglón nuevo: «Nueva» y crece en la receta; en la cesta, viaja desde la fila marcada (#427)
  fresh.set(it.key, { from })
  if (commitMulti(v, c, [it], [])) {
    const n = count.value + 1
    say(tx('added', 'anuncio al agregar', { label: nameOf(it), count: nf(n) }, nameOf(it), n))
  } else fresh.delete(it.key)
}
/** Quita `items` en un gesto; con renglones, cada uno pasa a rastro en su sitio */
function removeItems(items, all = false) {
  const memo = items.map((it) => ({ it, at: it.text != null ? customs.value.indexOf(it.text) : values.value.indexOf(it.value) })).filter((m) => m.at >= 0)
  if (!memo.length) return false
  const out = new Set(memo.map((m) => m.it.key))
  if (tracing.value) {
    for (const e of ledger.value) {
      const m = memo.find((x) => x.it.key === e.key)
      if (!m) continue
      // --_row-h (#429): el alto medido del renglón, antes de cambiar su contenido; el rastro mide lo mismo (Δ0)
      const el = host.value && host.value.querySelector(`[data-uid="${e.uid}"]`)
      const hgt = el ? el.getBoundingClientRect().height : 0
      e.rowH = hgt > 0 ? px(hgt) : null
      e.trace = m
    }
  }
  if (!commitMulti(values.value.filter((v) => !out.has(keyOf(v))), customs.value.filter((t) => !out.has(keyOfText(t))), [], memo.map((m) => m.it))) return false
  lastRemoved = { memo, all }
  const n = count.value - memo.length
  say(all
    ? tx('clearedAll', 'anuncio de «Quitar todas»', { count: nf(memo.length) }, memo.length)
    : tx('removed', 'anuncio al quitar', { label: nameOf(memo[0].it), count: nf(n) }, nameOf(memo[0].it), n))
  return true
}
/** Devuelve lo quitado a su posición (Ctrl/⌘+Z o «Deshacer»), si cabe en `max` */
function restore(memo, all = false) {
  lastRemoved = null
  const v = values.value.slice()
  const c = customs.value.slice()
  const back = memo.filter((m) => !isChosen(m.it))
  if (!back.length) return false
  if (maxN.value && count.value + back.length > maxN.value) {
    say(tx('max', 'anuncio del tope', { max: nf(maxN.value) }, maxN.value))
    return false
  }
  for (const m of back.slice().sort((a, b) => a.at - b.at)) {
    const arr = m.it.text != null ? c : v
    arr.splice(Math.min(m.at, arr.length), 0, m.it.text != null ? m.it.text : m.it.value)
  }
  if (!commitMulti(v, c, back.map((m) => m.it), [])) return false
  const n = count.value + back.length
  say(all
    ? tx('restoredAll', 'anuncio al deshacer «Quitar todas»', { count: nf(back.length) }, back.length)
    : tx('restored', 'anuncio al deshacer', { label: nameOf(back[0].it), count: nf(n) }, nameOf(back[0].it), n))
  return true
}
/** Marca o desmarca una fila (Intro o clic): la lista sigue abierta, la activa no se mueve y el texto queda seleccionado */
function toggleRow(row, el) {
  setActive(row, false, false)
  if (row.blocked) say(tx('max', 'anuncio del tope', { max: nf(maxN.value) }, maxN.value))
  else if (row.selected) removeItems([row.item || itemOf(row.o)])
  else {
    let from = null
    const src = el || (typeof document !== 'undefined' ? document.getElementById(row.id) : null)
    if (src && basketShown.value) from = (src.querySelector('.g-summary') || src).getBoundingClientRect()
    addItem(row.item || itemOf(row.o), from)
    ticking.value = row.k
    afterAnim('.g-combobox__box.is-ticking', 'g-combobox-tick', () => { ticking.value = null })
  }
  selectQuery()
}
function selectQuery() {
  const el = surface.value ? (typeof document !== 'undefined' ? document.getElementById(sub('search')) : null) : fieldEl.value
  if (el && el.value) nextTick(() => { try { el.select() } catch { /* sin selección */ } })
}
/** Retroceso con el campo vacío (#418): la primera pulsación marca el último elemento; la segunda lo quita. Sostenido, nada */
function backspace(e) {
  if (e.target.value !== '' || !count.value) return
  if (e.repeat) return e.preventDefault()
  e.preventDefault()
  const last = chosen.value[count.value - 1]
  if (armed.value === last.key) return removeItems([last])
  armed.value = last.key
  say(tx('armed', 'anuncio de Retroceso', { label: nameOf(last) }, nameOf(last)))
}
/** Teclas propias de `multiple`, comunes al campo y al campo de búsqueda. Devuelve si la trató */
function multiKey(e) {
  const k = e.key
  if (k !== 'Backspace') armed.value = null
  if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && (k === 'z' || k === 'Z')) {
    // Si lo último fue quitar, lo devuelve; si no (o ya caducó), el deshacer nativo del texto
    if (lastRemoved) {
      e.preventDefault()
      restore(lastRemoved.memo, lastRemoved.all)
    }
    return true
  }
  if (k === 'Backspace') {
    backspace(e)
    return e.defaultPrevented
  }
  return false
}

// ---------- Fase 2 · renglones de la receta (B) y de la cesta (C) con rastro (#419, #426) ----------
const ledger = shallowRef([])   // { key, item, uid, trace, fresh, enter, leave, arrive }
let rowUid = 0
const fresh = new Map()          // clave → { from }: lo que acaba de agregar un gesto
const rowsOpen = ref(false)      // «Ver los N» de la receta
const basketOpen = ref(false)    // «Ver las N» de la cesta
const basketShown = computed(() => M && surfaceOpen.value && props.appearance === 'palette' && !narrow.value)
const tracing = computed(() => Boolean(L.value.undo && L.value.trace) && (props.selection === 'list' || basketShown.value))
function newEntry(it) {
  const f = fresh.get(it.key)
  fresh.delete(it.key)
  const e = reactive({ key: it.key, item: it, uid: ++rowUid, trace: null, fresh: false, enter: false, leave: false, arrive: null, rowH: null })
  if (f) {
    if (basketShown.value) {
      if (f.from) arriveRow(e, f.from)
    } else if (props.selection === 'list') {
      e.fresh = true
      e.enter = true
      afterAnim('.g-combobox__row.is-entering', 'g-combobox-row', () => { e.enter = false })
    }
  }
  return e
}
ledger.value = reconcile([], chosen.value, newEntry)
/** Tras el render: si ningún elemento de `sel` tiene una animación `prefix…` calculada (sin CSS, movimiento reducido,
 * jsdom), `done` en el acto; si la tiene, la retira su animationend (patrón de GNumberField, #313) */
function afterAnim(sel, prefix, done) {
  nextTick(() => {
    const els = host.value ? host.value.querySelectorAll(sel) : []
    for (const el of els) if (computedAnimations(el, prefix)) return
    done()
  })
}
/** C · lo marcado viaja a la cesta (#427): vector desde la ficha de la fila marcada hasta la del renglón nuevo */
function arriveRow(e, from) {
  nextTick(() => {
    const el = host.value && host.value.querySelector(`.g-combobox__basket [data-uid="${e.uid}"]`)
    if (!el) return
    const to = (el.querySelector('.g-summary') || el).getBoundingClientRect()
    e.arrive = { x: px(from.left - to.left), y: px(from.top - to.top) }
    afterAnim('.g-combobox__row.is-arriving', ARRIVE_PREFIX, () => { e.arrive = null })
  })
}
/** Pasada nueva (B, #419): al volver a escribir tras salir del componente, los rastros se pliegan y «Nueva» se retira */
let left = true
const dropLeaving = () => { ledger.value = ledger.value.filter((e) => !e.leave) }
function newPass() {
  let any = false
  for (const e of ledger.value) {
    e.fresh = false
    if (e.trace) any = e.leave = true
  }
  if (any) afterAnim('.g-combobox__row.is-leaving', 'g-combobox-', dropLeaving)
}
function onAnimEnd(e) {
  const n = String(e.animationName || '')
  if (n.startsWith('g-combobox-roll')) rolling.value = false
  else if (n.startsWith('g-combobox-tick')) ticking.value = null
  const row = e.target.closest && e.target.closest('.g-combobox__row')
  const ent = row && ledger.value.find((x) => String(x.uid) === row.dataset.uid)
  if (!ent || !n.startsWith('g-combobox-')) return
  if (ent.leave) dropLeaving()
  else if (n.startsWith('g-combobox-row')) ent.enter = false
  else if (n.startsWith(ARRIVE_PREFIX)) ent.arrive = null
}
function onRootFocusOut(e) {
  const to = e.relatedTarget
  if (!to || !host.value || !host.value.contains(to)) left = true
}
// Un cambio del modelo desarma Retroceso; uno que el componente no emitió (la aplicación reinicia el formulario) además
// caduca el deshacer y retira rastros y «Nueva», sin animación
if (M) {
  watch(sigOf, (sig) => {
    const own = sig === ownSig
    ownSig = null
    armed.value = null
    let prev = ledger.value
    if (!own) {
      lastRemoved = null
      fresh.clear()
      prev = prev.filter((e) => !e.trace)
      for (const e of prev) e.fresh = e.enter = false
    }
    ledger.value = reconcile(prev, chosen.value, newEntry)
  })
}
function removeRow(e) {
  const keep = tracing.value
  removeItems([e.item])
  nextTick(() => focusIn(keep && `[data-uid="${e.uid}"] .g-combobox__undo`))
}
function undoRow(e) {
  if (e.trace && restore([e.trace])) nextTick(() => focusIn(`[data-uid="${e.uid}"] .g-combobox__remove`))
}
function focusIn(sel) {
  const el = sel && host.value ? host.value.querySelector(sel) : null
  if (el) return el.focus()
  const f = surface.value && opened.value && typeof document !== 'undefined' ? document.getElementById(sub('search')) : fieldEl.value
  f?.focus()
}

// ---------- Fase 2 · A · la frase (#425): Intl.ListFormat que cede por el final y por texto, medida por lotes ----------
const sentenceEl = ref(null)
const fitK = ref(null)   // cuántos elementos se ven antes de «y N más»; null = todos (servidor y antes de medir)
const hasSentence = computed(() => M && props.selection !== 'list' && count.value > 0)
/** Los que se ven: los k primeros; el marcado por Retroceso se saca a la vista si estaba cedido */
function sentenceWords(items, k) {
  const ai = armed.value ? items.findIndex((x) => x.key === armed.value) : -1
  const vis = ai >= k ? [...items.slice(0, k - 1), items[ai]] : items.slice(0, k)
  const w = vis.map(shortOf)
  if (k < items.length) w.push(tx('rest', 'la frase cedida', { count: nf(items.length - k) }, items.length - k))
  return { vis, w }
}
const listParts = (w) => (listFormat.value ? listFormat.value.formatToParts(w) : w.flatMap((x, i) => (i ? [{ type: 'literal', value: ', ' }, { type: 'element', value: x }] : [{ type: 'element', value: x }])))
const sentence = computed(() => {
  if (!hasSentence.value) return null
  const items = chosen.value
  const n = items.length
  const k = L.value.rest && fitK.value !== null ? Math.max(1, Math.min(n, fitK.value)) : n
  const { vis, w } = sentenceWords(items, k)
  let i = 0
  return listParts(w).map((p) => {
    if (p.type !== 'element') return { sep: p.value }
    const it = vis[i++]
    if (it) return { t: p.value, custom: it.text != null, armed: armed.value === it.key }
    // «y 3 más»: la cifra en __num (con una función en labels.rest, el texto entero)
    const r = L.value.rest
    const at = typeof r === 'string' ? r.indexOf('{count}') : -1
    return at < 0 ? { rest: true, n: p.value } : { rest: true, a: fill(r.slice(0, at), {}), n: nf(n - k), b: fill(r.slice(at + 7), {}) }
  })
})
let fitQueued = false
let canvas = null
function scheduleFit() {
  if (!M || fitQueued || typeof window === 'undefined') return
  fitQueued = true
  nextTick(() => nextFrame(() => {
    fitQueued = false
    fit()
  }))
}
/** Una lectura (el ancho que la celda le deja a la frase y su tipografía) y una escritura (cuántos caben) */
function fit() {
  const el = sentenceEl.value
  const cell = valueEl.value
  if (!el || !cell || !L.value.rest) return
  const cw = cell.clientWidth
  if (!cw) return
  const cs = getComputedStyle(el)
  const width = resolveWidth(cs.maxWidth, cw) - 1
  if (!canvas) {
    try { canvas = document.createElement('canvas').getContext('2d') } catch { /* sin canvas */ }
    if (!canvas) return
  }
  canvas.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`
  const fs = parseFloat(cs.fontSize) || 16
  const items = chosen.value
  // El lápiz de cada texto libre; el resto (peso de acción de «y N más», espaciado) lo corrige la calibración
  const measure = (k) => {
    const { vis, w } = sentenceWords(items, k)
    return [canvas.measureText(listFormat.value ? listFormat.value.format(w) : w.join(', ')).width, vis.filter((x) => x.text != null).length * fs * 1.25]
  }
  // Calibración con lo pintado (la misma lectura): ancho real ÷ ancho del lienzo de la frase que se ve ahora
  // (con uno solo y «y N más», el primero puede ir recortado: entonces no se calibra)
  const shownK = fitK.value === null ? items.length : Math.max(1, Math.min(items.length, fitK.value))
  const now = measure(shownK)
  const ratio = el.scrollWidth > 0 && now[0] > 0 && (shownK > 1 || shownK === items.length) ? Math.min(1.25, Math.max(0.9, (el.scrollWidth - now[1]) / now[0])) : 1
  let k = items.length
  for (; k > 1; k--) {
    const [t, extra] = measure(k)
    if (t * ratio + extra <= width) break
  }
  if (fitK.value !== k) fitK.value = k
}

// ---------- Anuncios (región viva educada; WCAG 4.1.3) ----------
const live = reactive({ polite: '', assertive: '' })
const writer = createLiveWriter(live, { delay: LIVE_GAP, clear: LIVE_CLEAR })
function counted(key, why, count, total) {
  const v = L.value[key]
  if (typeof v === 'function') return String(v(count, total) ?? '')
  return fill(need(key, why), { count: nf(count), total: total === undefined ? undefined : nf(total) })
}
function scheduleAnnounce() {
  clearTimeout(annTimer)
  annTimer = setTimeout(() => {
    annTimer = null
    if (!opened.value) return
    if (props.loadError) return writer.announce(props.loadError, 'polite')
    if (short.value || pending.value) return
    const n = rows.value.optionRows.length
    const tot = totalCount.value
    if (!n) {
      if (qTrim.value) {
        const t = fill(need('noResults', 'anuncio sin resultados'), { text: qTrim.value })
        if (t) writer.announce(t, 'polite')
      }
      return
    }
    let t
    if (tot > n) {
      if (L.value.partial === undefined || L.value.partial === null || L.value.partial === '') {
        warnOnce('label:partial', 'falta labels.partial (anuncio con más resultados que los pintados): se usa labels.results.')
        t = counted('results', 'anuncio del recuento', n)
      } else t = counted('partial', 'anuncio parcial', n, tot)
    } else t = counted('results', 'anuncio del recuento', n)
    if (t) writer.announce(t, 'polite')
  }, ANNOUNCE_MS - LIVE_GAP)
}

// ---------- Búsqueda: antirrebote propio; `search` siempre lleva el texto actual recortado ----------
const currentText = () => (surface.value ? query.value : typed.value ? text.value : '')
function ask(now) {
  clearTimeout(timer)
  timer = null
  const t = currentText().trim()
  if (minChars.value > 0 && t.length > 0 && t.length < minChars.value) {
    debouncing.value = false
    return
  }
  const go = () => {
    timer = null
    if (remote.value) expectReply()
    debouncing.value = false
    emit('search', t)
  }
  if (now || !delay.value) return go()
  debouncing.value = true
  timer = setTimeout(go, delay.value)
}
// Tramo emitir → respuesta (#332): pendiente hasta que la aplicación ponga loading o cambien options, total o loadError
function expectReply() {
  awaiting.value = true
  needsSettle = true
  nextTick(() => {
    if (awaiting.value && !props.loading) {
      warnOnce('no-reply', 'filter es false y, tras emitir search o more, la aplicación no respondió en el siguiente ciclo: pon loading a true en el mismo manejador (y a false al terminar). Mientras tanto, Intro no elige la opción resaltada sola.')
    }
  })
}
/** Asentar: la primera opción habilitada queda activa sola si hay texto; se programa el anuncio */
function settle() {
  needsSettle = false
  if (!opened.value) return
  const r = rows.value
  if (moreFrom !== null) {
    const next = r.optionRows.slice(moreFrom).find((x) => !x.disabled)
    moreFrom = null
    if (next) setActive(next, false)
  } else {
    const first = r.nav.find((x) => x.kind === 'option')
    const keep = activeRow.value && !auto.value // la que puso la persona se respeta si sigue a la vista
    if (!keep) {
      if (qTrim.value && first) setActive(first, true)
      else if (!activeRow.value) setActive(null)
    }
  }
  scheduleAnnounce()
  nextTick(place)
}
function maybeSettle() {
  if (needsSettle && !pending.value) settle()
}
watch(pending, maybeSettle)
watch(() => props.loading, (v) => { if (v) awaiting.value = false })
watch(() => [props.options, props.total, props.loadError], () => {
  if (awaiting.value) awaiting.value = false
  if (!opened.value) return
  if (remote.value) {
    if (needsSettle) maybeSettle()
    else {
      if (active.value && !activeRow.value) setActive(null)
      nextTick(place)
    }
  } else settle()
})
watch(() => props.loadError, (v) => {
  if (v && opened.value) {
    scheduleAnnounce()
    nextTick(place)
  }
})

// ---------- Colocación de la forma de A (anchor.js, sin separación): variables en línea sobre el popup ----------
// El lado (abajo o arriba) se decide AL ABRIR y se conserva: solo cambia si deja de ser útil (menos de space × 40) y el
// otro ofrece claramente más (space × 12), nunca en cada cuadro. --_max se fija al abrir, al cambiar los resultados, en
// resize y al cambiar de lado. Durante el desplazamiento de la página solo se actualiza la posición, una vez por cuadro
// y solo si cambia (style.setProperty: el render no toca el atributo style). Si la caja sale del visor o de su
// contenedor con desplazamiento, la lista se cierra.
const px = (n) => `${Math.round(n * 100) / 100}px`
const controlEl = () => valueEl.value?.closest('.g-input__control') || null
let side = null // 'down' | 'up' mientras está abierta
let written = {}
let followFrame = 0
function writeVar(name, value) {
  const pop = popupEl.value
  if (!pop || written[name] === value) return
  written[name] = value
  pop.style.setProperty(name, value)
}
const roomOf = (r, vh, which) => (which === 'up' ? r.top - EDGE : vh - r.bottom - EDGE)
function flipIfUseless(box, r, vh) {
  const unit = spaceUnit(box)
  const other = side === 'up' ? 'down' : 'up'
  const cur = roomOf(r, vh, side)
  if (cur >= unit * SIDE_MIN_SPACES || roomOf(r, vh, other) < cur + unit * SIDE_FLIP_SPACES) return false
  side = other
  return true
}
function writeSide(r, vh) {
  up.value = side === 'up'
  writeVar('--_max', px(Math.max(MIN_ROOM, roomOf(r, vh, side))))
}
function writePosition(r, vh) {
  writeVar('--_x', px(r.left))
  writeVar('--_top', side === 'up' ? 'auto' : px(r.top))
  writeVar('--_bottom', side === 'up' ? px(vh - r.bottom) : 'auto')
}
/** Colocación completa: al abrir, al cambiar los resultados y en resize */
function place() {
  const pop = popupEl.value
  const box = controlEl()
  if (!opened.value || surface.value || !pop || !box || typeof window === 'undefined') return
  const r = box.getBoundingClientRect()
  const vh = window.innerHeight
  if (!side) {
    const panel = pop.querySelector('.g-combobox__panel')
    const natural = panel ? panel.scrollHeight : 0
    const vw = document.documentElement.clientWidth || window.innerWidth
    const at = placeBlock(r, { width: r.width, naturalHeight: Math.min(natural, UP_BELOW), vw, vh, pad: EDGE, gap: 0 })
    side = at.y < r.bottom ? 'up' : 'down'
  } else flipIfUseless(box, r, vh)
  writeVar('--_w', px(r.width))
  writeVar('--_field-h', px(r.height))
  writeSide(r, vh)
  writePosition(r, vh)
}
/** Durante el desplazamiento: solo la posición (y el lado, con histéresis); fuera de la vista, se cierra */
function follow(scroller) {
  followFrame = 0
  const box = controlEl()
  if (!opened.value || surface.value || !popupEl.value || !box) return
  const r = box.getBoundingClientRect()
  const vh = window.innerHeight
  const vw = document.documentElement.clientWidth || window.innerWidth
  let gone = r.bottom <= 0 || r.top >= vh || r.right <= 0 || r.left >= vw
  if (!gone && scroller && scroller.nodeType === 1 && scroller !== document.documentElement && scroller !== document.body && scroller.contains(box)) {
    const c = scroller.getBoundingClientRect()
    gone = r.bottom <= c.top || r.top >= c.bottom || r.right <= c.left || r.left >= c.right
  }
  if (gone) return closeList()
  if (flipIfUseless(box, r, vh)) writeSide(r, vh)
  writePosition(r, vh)
}
function onScroll(event) {
  const t = event && event.target
  if (t && popupEl.value && popupEl.value.contains?.(t)) return // el propio panel se desplaza
  if (followFrame) return
  const run = () => follow(t)
  followFrame = typeof requestAnimationFrame === 'function' ? requestAnimationFrame(run) : setTimeout(run, 16)
}
function stopFollow() {
  if (!followFrame) return
  if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(followFrame)
  clearTimeout(followFrame)
  followFrame = 0
}
function listen(on) {
  if (typeof window === 'undefined') return
  const fn = on ? 'addEventListener' : 'removeEventListener'
  window[fn]('resize', place)
  window[fn]('scroll', onScroll, true)
  if (!on) stopFollow()
}
// La activa siempre a la vista desplazando EL PANEL, nunca la página (sin scrollIntoView)
function scrollActive() {
  const row = activeRow.value
  if (!row || typeof document === 'undefined') return
  const el = document.getElementById(row.id)
  if (!el) return
  let sc = el.parentElement
  while (sc && !sc.matches('.g-combobox__popup, dialog')) {
    if (sc.scrollHeight > sc.clientHeight + 1 && /auto|scroll/.test(getComputedStyle(sc).overflowY)) break
    sc = sc.parentElement
  }
  if (!sc || sc.matches('.g-combobox__popup, dialog')) sc = el.closest('.g-combobox__panel')
  if (!sc) return
  const a = el.getBoundingClientRect()
  const b = sc.getBoundingClientRect()
  if (a.top < b.top) sc.scrollTop -= b.top - a.top
  else if (a.bottom > b.bottom) sc.scrollTop += a.bottom - b.bottom
}
watch(activeRow, (r) => { if (r && revealActive) nextTick(scrollActive) }, { flush: 'post' })
watch(() => (opened.value && !surface.value ? [hasPanel.value, rows.value.all.length, status.value?.kind].join('|') : ''), (v) => { if (v) nextTick(place) }, { flush: 'post' })

// ---------- Abrir y cerrar ----------
function show(seed, byTyping = false) {
  if (!editable.value || opened.value) return
  shown.value = limit.value
  setActive(null)
  moreFrom = null
  lastX = lastY = null
  if (surface.value) {
    query.value = seed || ''
    q.value = query.value
    opened.value = true
    snap()
  } else {
    q.value = typed.value ? text.value : ''
    opened.value = true
    snap()
    const pop = popupEl.value
    if (pop && typeof pop.showPopover === 'function' && !pop.matches(':popover-open')) {
      try { pop.showPopover() } catch { /* ya abierto o sin soporte */ }
    }
    place()
    listen(true)
    nextTick(place)
  }
  // Abrir emite sin esperar; si se abre escribiendo, es escritura: con antirrebote
  if (remote.value) ask(!byTyping)
  else {
    settle()
    if (byTyping || (surface.value && q.value)) ask(false)
  }
  // Sin texto: la elegida, si está a la vista, es la activa (con multiple no: ↓ y ↑ van a la primera y a la última)
  if (!M && !qTrim.value && !activeRow.value) {
    const sel = rows.value.nav.find((r) => r.selected)
    if (sel) setActive(sel, false)
  }
}
function closeList() {
  if (!opened.value) return
  const wasSurface = surface.value
  opened.value = false
  setActive(null)
  moreFrom = null
  clearTimeout(timer)
  timer = null
  clearTimeout(annTimer)
  annTimer = null
  debouncing.value = false
  awaiting.value = false
  needsSettle = false
  snapshot.value = null
  armed.value = null
  if (M && wasSurface) {
    // Cerrar la superficie conserva lo elegido (sin borrador, #424); los rastros de la cesta duran hasta aquí
    basketOpen.value = false
    for (const e of ledger.value) e.fresh = false
    ledger.value = ledger.value.filter((e) => !e.trace)
  }
  if (wasSurface) {
    query.value = ''
    q.value = ''
  } else {
    listen(false)
    const pop = popupEl.value
    if (pop && typeof pop.hidePopover === 'function' && pop.matches?.(':popover-open')) {
      try { pop.hidePopover() } catch { /* ya cerrado */ }
    }
    up.value = false
    side = null
    written = {}
  }
}
watch(panelVisible, (v) => emit(v ? 'open' : 'close'))
watch(() => props.appearance, () => closeList())
watch(editable, (v) => { if (!v) closeList() })

// La superficie es un GDialog real: su v-model es `opened` mientras el campo actúa de disparador
const surfaceOpen = computed({
  get: () => opened.value && surface.value,
  set: (v) => { if (!v) closeList() }
})
const surfaceTitle = computed(() => props.label || attrs['aria-label'] || L.value.surfaceTitle || undefined)

// ---------- Al salir del campo (#331): vacío borra; sin coincidencia se descarta; allowCustom conserva ----------
function commitText() {
  if (!typed.value) return
  const t = text.value.trim()
  const s = selected.value
  typed.value = false
  if (!t) commitValue(null, '', null)
  else if (props.allowCustom && !(s && s.label === t)) {
    writeText(t)
    commitValue(null, t, null)
  }
  syncSoon()
}

// ---------- C · la ficha llega (#336) ----------
const arriving = ref(null) // { x, y } en px mientras llega
let arriveToken = 0
const parseTime = (x) => {
  const n = parseFloat(x)
  return Number.isFinite(n) ? (String(x).trim().endsWith('ms') ? n : n * 1000) : 0
}
// Animaciones calculadas con ese prefijo en el elemento y sus descendientes (duración > 0). Sin CSS, con movimiento
// reducido o en jsdom: 0, y la clase se retira en el acto (patrón de GNumberField, #313): el JS no tiene duraciones.
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
function endArrive() {
  arriveToken++
  if (arriving.value) arriving.value = null
}
function startArrive(from) {
  endArrive()
  if (!from) return
  const token = ++arriveToken
  nextTick(() => {
    if (token !== arriveToken) return
    const el = tokenEl.value
    if (!el) return
    const to = el.getBoundingClientRect()
    arriving.value = { x: px(from.left - to.left), y: px(from.top - to.top) }
    nextTick(() => {
      if (token !== arriveToken) return
      if (!computedAnimations(tokenEl.value, ARRIVE_PREFIX)) endArrive()
    })
  })
}
function onTokenAnimationEnd(e) {
  const name = typeof e.animationName === 'string' ? e.animationName : ''
  if (name.startsWith(ARRIVE_PREFIX) && arriving.value) endArrive()
}
const tokenStyle = computed(() => (arriving.value ? { '--_travel-x': arriving.value.x, '--_travel-y': arriving.value.y } : undefined))

// ---------- Elegir ----------
function pick(row, { el = null, leaving = false } = {}) {
  if (!row || row.disabled || !editable.value) return
  if (row.kind === 'action') return runAction(row)
  if (M) return toggleRow(row, el)
  const o = row.o
  const wasSurface = surface.value
  let from = null
  if (!wasSurface && typeof document !== 'undefined') {
    // El origen del viaje es la ficha de la fila elegida (#356); con el slot `option`, la fila entera
    const rowEl = el || document.getElementById(row.id)
    const src = rowEl && (rowEl.querySelector('.g-summary') || rowEl)
    if (src && src.getBoundingClientRect) from = src.getBoundingClientRect()
  }
  known.set(o.value, o)
  typed.value = false
  writeText(o.label)
  commitValue(o.value, '', o) // elegir la ya elegida no emite
  closeList()
  syncSoon()
  if (!wasSurface) {
    if (!leaving) nextTick(selectAll) // como al entrar: lo siguiente que se teclee reemplaza
    startArrive(from)
  }
}
function runAction(row) {
  const t = qTrim.value
  if (row.action === 'retry') return ask(true)
  if (row.action === 'more') {
    moreFrom = rows.value.optionRows.length
    if (remote.value) {
      expectReply()
      emit('more', currentText().trim())
    } else {
      shown.value += limit.value
      settle()
    }
    return
  }
  if (row.action === 'all') {
    // «Ver las N» de «Elegidas»: pinta el resto y deja activa la fila 13
    pinAll.value = true
    return nextTick(() => {
      const b = rows.value.blocks[0]
      if (b && b.chosen && b.rows[PIN_CAP]) setActive(b.rows[PIN_CAP], false)
    })
  }
  if (row.action === 'custom' && M) {
    // Con multiple agrega el texto a `custom` y la lista sigue abierta (#418); con el tope, lo dice
    if (row.blocked) say(tx('max', 'anuncio del tope', { max: nf(maxN.value) }, maxN.value))
    else addItem({ key: keyOfText(t), text: t, label: t })
    return selectQuery()
  }
  if (row.action === 'custom') {
    typed.value = false
    writeText(t)
    commitValue(null, t, null)
    closeList()
    syncSoon()
    if (!surface.value) nextTick(selectAll)
    return
  }
  if (row.action === 'create') {
    // #57: cierra, deja el foco en el campo y DESPUÉS emite (un diálogo de la aplicación devolverá el foco aquí)
    const wasSurface = surface.value
    typed.value = false
    writeText(displayText.value)
    closeList()
    if (!wasSurface) {
      fieldEl.value?.focus()
      emit('create', t)
    } else {
      nextTick(() => {
        fieldEl.value?.focus({ preventScroll: true })
        emit('create', t)
      })
    }
  }
}
function clear() {
  if (!editable.value) return
  if (M) removeItems(chosen.value.slice(), true) // «Quitar todas» (#418): un gesto, se deshace con Ctrl/⌘+Z
  typed.value = false
  writeText('')
  if (!M) commitValue(null, '', null)
  closeList()
  syncSoon()
  fieldEl.value?.focus()
}

// ---------- Entrada ----------
function afterType() {
  setActive(null)
  shown.value = limit.value
  if (M) lastRemoved = null // escribir caduca el deshacer (#419)
  if (!opened.value) return show(undefined, true)
  q.value = surface.value ? query.value : text.value
  if (M) snap() // el texto vuelve a quedar vacío con la lista abierta: «Elegidas» otra vez arriba
  if (remote.value) {
    needsSettle = true
    ask(false)
  } else {
    settle()
    ask(false)
  }
}
/** El campo de la página como disparador (paleta y móvil): lo tecleado o pegado es el texto inicial de la búsqueda */
function seedFromTrigger(el) {
  const v = el.value
  const shownText = text.value
  const seed = shownText && v.startsWith(shownText) && v.length > shownText.length ? v.slice(shownText.length) : v
  el.value = shownText
  if (!editable.value) return
  if (!opened.value) show(seed)
}
function onInput(e) {
  const el = e.target
  if (surface.value) {
    if (!composing.value) seedFromTrigger(el)
    return
  }
  text.value = el.value
  typed.value = true
  readCaret(el)
  if (M && left) {
    left = false
    newPass()
  }
  if (composing.value || e.isComposing) return
  afterType()
}
function onCompositionstart() {
  composing.value = true
}
function onCompositionend(e) {
  composing.value = false
  const el = e.target
  if (surface.value) return seedFromTrigger(el)
  if (el.value === text.value && !typed.value) return
  text.value = el.value
  typed.value = true
  readCaret(el)
  afterType()
}
function move(d) {
  const list = rows.value.nav
  if (!list.length) return
  const cur = activeRow.value
  const i = cur ? list.indexOf(cur) : -1
  const n = i === -1 ? (d > 0 ? 0 : list.length - 1) : Math.min(list.length - 1, Math.max(0, i + d))
  setActive(list[n], false)
}
/** Teclas de lista, comunes al campo de `field` y al campo de búsqueda de la superficie. Devuelve si la trató. */
function listKey(e) {
  const k = e.key
  if (k === 'ArrowDown') {
    e.preventDefault()
    if (!e.altKey) move(1)
  } else if (k === 'ArrowUp') {
    e.preventDefault()
    if (e.altKey) closeList()
    else move(-1)
  } else if (k === 'PageDown') {
    e.preventDefault()
    move(PAGE_ROWS)
  } else if (k === 'PageUp') {
    e.preventDefault()
    move(-PAGE_ROWS)
  } else if (k === 'Enter') {
    e.preventDefault()
    const r = activeRow.value
    // #333: Intro no elige un resultado obsoleto (resaltado solo, con búsqueda pendiente)
    if (!r || (auto.value && pending.value)) return true
    // Con multiple, Intro sobre una elegida que quedó activa sola no la quita: lo dice (#418)
    if (M && r.kind === 'option' && auto.value && r.selected) {
      say(tx('already', 'anuncio de ya elegida', { label: nameOf(r.item || itemOf(r.o)) }, nameOf(r.item || itemOf(r.o))))
      selectQuery()
    } else pick(r)
  } else return false
  return true
}
function onKeydown(e) {
  if (!editable.value || composing.value || e.isComposing) return
  if (M && multiKey(e)) return
  const k = e.key
  if (surface.value) {
    // Disparador: Intro, Espacio, ↓, ↑, Alt+↓ o un carácter abren la superficie (la primera tecla no se pierde)
    if (opened.value || e.ctrlKey || e.metaKey) return
    if (k === 'Enter' || k === ' ' || k === 'ArrowDown' || k === 'ArrowUp') {
      e.preventDefault()
      show()
    } else if (k.length === 1 && !e.altKey) {
      e.preventDefault()
      show(k)
    }
    return
  }
  if (!listOpen.value) {
    if (k === 'ArrowDown' || k === 'ArrowUp') {
      if (e.ctrlKey || e.metaKey) return
      e.preventDefault()
      if (k === 'ArrowUp' && e.altKey) return
      if (!opened.value) show()
      if (!e.altKey && !activeRow.value) move(k === 'ArrowDown' ? 1 : -1)
    } else if (k === 'Escape' && typed.value) {
      // Texto sin confirmar: restaura el de la opción elegida y lo selecciona (sin propagar)
      e.preventDefault()
      e.stopPropagation()
      typed.value = false
      writeText(displayText.value)
      closeList()
      nextTick(selectAll)
    }
    return
  }
  if (listKey(e)) return
  if (k === 'Escape') {
    // Cierra y conserva el texto; no llega a un GDialog anfitrión
    e.preventDefault()
    e.stopPropagation()
    closeList()
  } else if (k === 'Tab') {
    // Tab NO elige, salvo el texto fantasma con etiqueta única y lista completa (#333)
    const g = ghost.value
    if (!M && g && g.unique) pick(g.row, { leaving: true }) // con multiple, Tab nunca elige
    else closeList()
  } else if (k === 'ArrowRight' && !e.shiftKey && !e.altKey && !e.ctrlKey && !e.metaKey) {
    const g = ghost.value
    const el = e.target
    if (!g || el.selectionStart !== el.value.length || el.selectionEnd !== el.value.length) return
    // Acepta el texto sin elegir y sin nueva búsqueda; la opción pasa a contar como activada por la persona
    e.preventDefault()
    writeText(g.row.o.label)
    try { el.setSelectionRange(el.value.length, el.value.length) } catch { /* sin selección */ }
    caretEnd.value = true
    auto.value = false
  }
}
function onKeyup(e) {
  readCaret(e.target)
}
function onSelect(e) {
  readCaret(e.target)
}
function onFocus() {
  focused.value = true
  if (hasValue.value && !typed.value) nextTick(selectAll)
}
function onBlur() {
  focused.value = false
  if (surface.value) return
  closeList()
  if (!M) return commitText()
  // Con multiple, salir descarta el texto a medio escribir: nunca se agrega al pasar (#418)
  typed.value = false
  writeText('')
}
function onClick(e) {
  readCaret(e.target)
  if (!editable.value || opened.value) return
  show()
  // Con valor y sin escribir, el texto queda seleccionado también al entrar con el puntero
  if (!surface.value && hasValue.value && !typed.value) {
    selectAll()
    // WebKit coloca el cursor después del clic y deshace la selección: se repite en el ciclo siguiente
    setTimeout(() => { if (opened.value && !typed.value) selectAll() }, 0)
  }
}
// Pulsar el área vacía de la caja (prefijo, hueco) enfoca el campo y abre
function onBoxDown(e) {
  if (e.button !== 0 || isDisabled.value) return
  const el = fieldEl.value
  const t = e.target
  if (!el || t === el || (t.closest && t.closest('.g-combobox__clear, .g-combobox__arrow, .g-combobox__popup, dialog'))) return
  e.preventDefault()
  el.focus()
  if (editable.value && !opened.value) show()
}
function toggle() {
  if (!editable.value) return
  if (opened.value) return closeList()
  fieldEl.value?.focus()
  show()
}
const keep = (e) => e.preventDefault() // el panel, limpiar y la flecha no quitan el foco del campo
// Puntero en la flecha, limpiar y las opciones. El preventDefault de pointerdown deja el foco en el campo, pero en WebKit
// táctil también cancela el click: con toque se actúa en touchend (con preventDefault, que quita el click de
// compatibilidad: abrir la hoja o cerrar la lista no deja un click fantasma sobre lo que quede debajo) y con lápiz en
// pointerup, solo si el gesto empezó en la pieza y no se desplazó. Con ratón, la flecha y limpiar actúan al bajar (como
// los −/+ de GNumberField) y la opción con su clic. El click sin puntero (detail 0: Intro o Espacio en limpiar, tecnología
// de apoyo) actúa siempre; el de un gesto de puntero, nunca (ese gesto ya actuó)
const MOVE_TOLERANCE = 10
let gesture = null // { kind: 'touch' | 'pen', id, x, y, act }
function downOn(e, act) {
  keep(e)
  gesture = null
  if (e.button !== 0) return false
  if (e.pointerType === 'touch' || e.pointerType === 'pen') {
    gesture = { kind: e.pointerType, id: e.pointerId, x: e.clientX, y: e.clientY, act }
    return false
  }
  return true // ratón
}
function endGesture(kind, x, y, id) {
  const g = gesture
  if (!g || g.kind !== kind || (kind === 'pen' && id !== g.id)) return null
  gesture = null
  return Math.hypot(x - g.x, y - g.y) > MOVE_TOLERANCE ? null : g // un desplazamiento no es un toque
}
function onGestureTouchend(e) {
  const t = e.changedTouches?.[0]
  const g = t ? endGesture('touch', t.clientX, t.clientY) : null
  if (!g) return
  if (e.cancelable) e.preventDefault()
  g.act(e)
}
function onGesturePointerup(e) {
  const g = e.pointerType === 'pen' ? endGesture('pen', e.clientX, e.clientY, e.pointerId) : null
  if (g) g.act(e)
}
function onGestureCancel() {
  gesture = null
}
function onArrowDown(e) {
  if (downOn(e, toggle)) toggle()
}
function onArrowClick(e) {
  if (e.detail === 0) toggle()
}
function onClearDown(e) {
  if (downOn(e, clear)) clear()
}
function onClearClick(e) {
  if (e.detail === 0) clear()
}

// ---------- Campo de búsqueda de la superficie ----------
// El foco inicial es el campo de búsqueda (#292). GDialog no roba un foco que ya está dentro, y al reabrir durante la
// salida (el contenido sigue montado) el navegador enfoca el botón de cierre, que va antes en el DOM: se fija aquí.
function focusSearch() {
  nextTick(() => {
    const el = typeof document !== 'undefined' ? document.getElementById(sub('search')) : null
    if (el && opened.value && document.activeElement !== el) el.focus({ preventScroll: true })
  })
}
function onSearchInput(e) {
  query.value = e.target.value
  if (M) lastRemoved = null
  if (composing.value || e.isComposing) return
  afterType()
}
function onSearchCompositionend(e) {
  composing.value = false
  query.value = e.target.value
  afterType()
}
function onSearchKeydown(e) {
  if (composing.value || e.isComposing) return
  if (M && multiKey(e)) return
  listKey(e) // Esc lo trata GDialog (un nivel: no llega al anfitrión, que ve defaultPrevented); Tab se mueve dentro
}

// ---------- Panel: puntero ----------
function rowFromEvent(e) {
  const li = e.target.closest?.('[role="option"]')
  if (!li) return null
  const row = rows.value.all[Number(li.dataset.index)]
  return row ? { row, el: li } : null
}
// Una opción: con toque o lápiz, al soltar sin desplazarse (elegir al bajar impediría desplazar la lista); con ratón, con
// su clic, solo si el gesto empezó en una opción del panel (el click que sigue a abrir con la flecha no elige lo de debajo)
let mouseDownInPanel = false
const pickFrom = (e) => {
  const hit = rowFromEvent(e)
  if (hit) pick(hit.row, { el: hit.el })
}
function onPanelDown(e) {
  const onRow = Boolean(rowFromEvent(e))
  const mouse = downOn(e, pickFrom) // siempre: preventDefault (el foco sigue en el campo) aunque no sea sobre una opción
  if (!onRow) gesture = null
  mouseDownInPanel = onRow && mouse
}
function onPanelClick(e) {
  const mouse = mouseDownInPanel
  mouseDownInPanel = false
  if (e.detail === 0 || mouse) pickFrom(e)
}
let lastX = null
let lastY = null
function onPanelMove(e) {
  // Solo un movimiento REAL del puntero activa: el primer evento tras abrir solo anota dónde está (un resultado que
  // aparece bajo el puntero quieto no roba la activa al teclado) y uno sin desplazamiento se ignora (la lista que se
  // mueve bajo el puntero). La activación por puntero nunca desplaza la lista.
  const still = lastX === null || (e.clientX === lastX && e.clientY === lastY)
  lastX = e.clientX
  lastY = e.clientY
  if (still) return
  const hit = rowFromEvent(e)
  if (hit && !hit.row.disabled && activeRow.value !== hit.row) setActive(hit.row, false, false)
}

// ---------- Piezas de pintado: la ficha (GSummary, #356) ----------
// Traducción de la opción (#335 intacto): label → title; description → subtitle SOLO sin facts (con facts no se pinta
// ni se lee dos veces; sigue alimentando ID-about por `secondary`); code, avatar, icon y facts tal cual (priority, short
// y bare son opcionales y aditivos; un dato sin label lo omite la ficha y avisa). value, disabled y los campos de más
// no llegan a la ficha. La identidad y el texto oculto accesible los pone la ficha.
// Dato visible = visibleFact de engine.js: la misma regla filtra la búsqueda y la línea secundaria (combobox.md «Dato visible»)
const hasFacts = (o) => Array.isArray(o.facts) && o.facts.some(visibleFact)
function summaryProps(o) {
  const out = { title: o.label }
  if (typeof o.code === 'string' && o.code) out.code = o.code
  if (o.avatar) out.avatar = o.avatar
  if (typeof o.icon === 'string' && o.icon) out.icon = o.icon
  if (hasFacts(o)) out.facts = o.facts
  else if (typeof o.description === 'string' && o.description) out.subtitle = o.description
  return out
}
/** Slot `lead` de GCombobox ({ option }) → slot `lead` de la ficha (manda sobre avatar e icon; vacío, la ficha decide) */
const leadSlot = (o) => (slots.lead ? { lead: () => slots.lead({ option: o }) } : undefined)
// Tamaño de la ficha de opción: md; con el campo en xs o sm, sm (combobox.md «Fichas con GSummary»)
const optionSize = computed(() => (props.size === 'xs' || props.size === 'sm' ? 'sm' : 'md'))
// Contraste entre homónimas (#354) sobre las opciones PINTADAS, por identidad de fila. Se recalcula solo cuando cambian
// las filas
const diffMap = (list) => {
  const m = new Map()
  if (list.length > 1) summaryDiff(list.map((r) => ({ title: r.o.label, facts: r.o.facts }))).forEach((d, i) => { if (d) m.set(list[i].k, d) })
  return m
}
const diffs = computed(() => diffMap(rows.value.optionRows))
const diffOf = (row) => (row ? diffs.value.get(row.k) : undefined)
/** Ficha de un texto libre: el texto como título, labels.custom como línea secundaria y el lápiz en el hueco inicial */
const customSummary = (text, size) => h(GSummary, { title: text, subtitle: L.value.custom || undefined, layout: 'row', lines: 2, size }, { lead: () => h(GIcon, { name: 'pencil' }) })
function optionContent(row) {
  const o = row.o
  const qq = qTrim.value
  const isActive = activeRow.value === row
  if (slots.option) return slots.option({ option: o, active: isActive, selected: row.selected, query: qq })
  if (row.item && row.item.text != null) return customSummary(row.item.text, optionSize.value)
  return h(GSummary, { ...summaryProps(o), layout: 'row', lines: 2, size: optionSize.value, highlight: qq || undefined, diff: diffOf(row) }, leadSlot(o))
}
function rowNode(row) {
  const isActive = activeRow.value === row
  if (row.kind === 'action') {
    return h('li', {
      key: row.id, id: row.id, role: 'option', 'aria-selected': 'false', 'aria-disabled': row.blocked ? 'true' : undefined, 'data-index': row.index,
      class: ['g-combobox__option', 'g-combobox__action', `g-combobox__action--${row.action}`, { 'is-active': isActive }]
    }, [
      h('span', { class: 'g-combobox__lead', 'aria-hidden': 'true' }, [h(GIcon, { name: row.icon })]),
      h('span', { class: 'g-combobox__main' }, [h('span', { class: 'g-combobox__label' }, row.label)])
    ])
  }
  // Con multiple (#418): casilla decorativa al inicio (no se pinta el check del final); con el tope, las no elegidas
  // llevan aria-disabled y se siguen recorriendo; la de «Elegidas» marcada por Retroceso, is-armed
  return h('li', {
    key: row.id, id: row.id, role: 'option', 'data-index': row.index,
    'aria-selected': row.selected ? 'true' : 'false',
    'aria-disabled': row.disabled || row.blocked ? 'true' : undefined,
    class: ['g-combobox__option', { 'is-active': isActive, 'is-armed': Boolean(row.item) && armed.value === row.item.key }]
  }, M
    ? [h('span', { class: ['g-combobox__box', { 'is-ticking': ticking.value === row.k }], 'aria-hidden': 'true' }, [h(GIcon, { name: 'check' })]), optionContent(row)]
    : [
        optionContent(row),
        row.selected ? h('span', { class: 'g-combobox__check', 'aria-hidden': 'true' }, [h(GIcon, { name: 'check' })]) : null
      ])
}
const listLabel = computed(() => {
  if (hasLabel.value) return { 'aria-labelledby': sub('label') }
  if (attrs['aria-label']) return { 'aria-label': attrs['aria-label'] }
  return { 'aria-labelledby': attrs['aria-labelledby'] }
})
function statusContent(s) {
  if (s.kind === 'empty' && slots.empty) return slots.empty({ query: qTrim.value })
  if (s.kind === 'error' && slots['load-error']) return slots['load-error']({ message: s.text, query: qTrim.value })
  return s.text
}
/** Panel común a la lista de `field` y a la superficie: estado (fuera del listbox) + listbox con grupos */
const NO_ROWS = { blocks: [], all: [], actions: [] }
const Panel = () => {
  // Cerrado no se pinta ninguna fila (ni se filtra): el listbox existe, vacío, para que aria-controls apunte a algo
  const r = opened.value ? rows.value : NO_ROWS
  const s = opened.value ? status.value : null
  return h('div', { class: 'g-combobox__panel', onPointerdown: onPanelDown, onTouchend: onGestureTouchend, onPointerup: onGesturePointerup, onPointercancel: onGestureCancel, onMousedown: keep, onClick: onPanelClick, onPointermove: onPanelMove }, [
    s
      ? h('p', { class: ['g-combobox__status', `g-combobox__status--${s.kind}`], id: sub('status') }, [h(GIcon, { name: s.icon, key: s.icon }), h('span', null, statusContent(s))])
      : null,
    h('ul', { class: 'g-combobox__list', id: sub('list'), role: 'listbox', 'aria-multiselectable': M ? 'true' : undefined, ...listLabel.value, 'aria-busy': busy.value ? 'true' : undefined, hidden: r.all.length ? undefined : true }, [
      ...r.blocks.map((b) => (b.group || b.chosen
        ? h('li', { key: b.key, role: 'presentation' }, [
            h('ul', { class: ['g-combobox__group', { 'is-chosen': b.chosen }], role: 'group', 'aria-labelledby': b.gid }, [
              h('li', { class: 'g-combobox__group-label', id: b.gid, role: 'presentation' }, b.chosen
                ? [L.value.chosen, ' ', h('span', { class: 'g-combobox__group-tally' }, [num(maxN.value && L.value.ofMax ? tally.value : nf(count.value))])]
                : b.group.label),
              ...b.rows.map(rowNode)
            ])
          ])
        : h(Fragment, { key: b.key }, b.rows.map(rowNode)))),
      ...r.actions.map(rowNode)
    ])
  ])
}
/** Vista previa de la opción activa (paleta): slot `preview` o, por defecto, la ficha en `stack` con los datos de la
 * fila (#335) y su mismo `diff`; sin `highlight`. Con `key` por opción: el contenido se vuelve a crear al cambiar la
 * activa (coco puede hacerlo entrar con un fundido) */
const previewRow = computed(() => (activeRow.value && activeRow.value.kind === 'option' ? activeRow.value : null))
const Preview = () => {
  const row = previewRow.value
  if (!row) return L.value.previewEmpty ? h('p', { class: 'g-combobox__preview-empty' }, L.value.previewEmpty) : null
  const o = row.o
  if (slots.preview) return slots.preview({ option: o })
  return h(GSummary, { key: String(o.value), ...summaryProps(o), layout: 'stack', size: 'lg', diff: diffOf(row) }, leadSlot(o))
}
/** Ficha del valor (C): la opción elegida en `inline`; con texto libre, el texto como título, labels.custom como línea
 * secundaria y el lápiz en el hueco inicial (la cursiva cuelga de is-custom, en el CSS) */
const TokenCard = () => {
  const o = selected.value
  if (o) return h(GSummary, { ...summaryProps(o), layout: 'inline', size: 'xs' }, leadSlot(o))
  return h(GSummary, { title: customText.value, subtitle: L.value.custom || undefined, layout: 'inline', size: 'xs' }, { lead: () => h(GIcon, { name: 'pencil' }) })
}
const hasPreview = computed(() => !M && props.appearance === 'palette' && !narrow.value)

// ---------- Fase 2 · renglones (receta B y cesta C), cesta y pie de la superficie ----------
function rowLi(e, n, basket, dm) {
  const it = e.item
  const nm = nameOf(it)
  const custom = it.text != null
  if (e.trace) {
    const tid = sub(`trace-${e.uid}`)
    return h('li', { key: e.uid, 'data-uid': e.uid, class: ['g-combobox__row', 'is-trace', { 'is-custom': custom, 'is-leaving': e.leave }], style: e.rowH ? { '--_row-h': e.rowH } : undefined }, [
      h('span', { class: 'g-combobox__trace', id: tid }, tx('trace', 'rastro', { label: nm }, nm)),
      h('button', { type: 'button', class: 'g-combobox__undo', 'aria-describedby': tid, onClick: () => undoRow(e) }, [h(GIcon, { name: 'undo-2' }), L.value.undo])
    ])
  }
  const o = it.option || { value: it.value, label: it.label }
  const removeLabel = editable.value ? need('remove', '«Quitar» de un renglón') : ''
  return h('li', {
    key: e.uid, 'data-uid': e.uid,
    class: ['g-combobox__row', { 'is-fresh': !basket && e.fresh, 'is-armed': armed.value === e.key, 'is-custom': custom, 'is-entering': !basket && e.enter, 'is-arriving': basket && Boolean(e.arrive) }],
    style: basket && e.arrive ? { '--_travel-x': e.arrive.x, '--_travel-y': e.arrive.y } : undefined
  }, [
    props.numbered ? h('span', { class: 'g-combobox__row-number' }, nf(n)) : null,
    slots.chosen
      ? slots.chosen({ option: custom ? null : o, custom: custom ? it.text : '' })
      : custom ? customSummary(it.text, 'md') : h(GSummary, { ...summaryProps(o), layout: 'row', lines: 2, size: 'md', diff: dm.get(e.key) }, leadSlot(o)),
    !basket && e.fresh && L.value.fresh ? h('span', { class: 'g-combobox__row-fresh' }, L.value.fresh) : null,
    removeLabel ? h('button', { type: 'button', class: 'g-combobox__remove', 'aria-label': fill(removeLabel, { label: nm }), onClick: () => removeRow(e) }, [h(GIcon, { name: 'x' })]) : null
  ])
}
/** Renglones con tope (6 en la receta, 12 en la cesta): los primeros en orden más los nuevos, los rastros y el marcado */
function Rows(basket) {
  const cap = basket ? PIN_CAP : ROWS_CAP
  const open = basket ? basketOpen.value : rowsOpen.value
  const cut = !open && Boolean(L.value.showAll)
  const list = ledger.value
  const live = list.filter((e) => !e.trace)
  const nOf = new Map(live.map((e, i) => [e, i + 1]))
  const shownList = list.filter((e) => e.trace || !cut || nOf.get(e) <= cap || (!basket && e.fresh) || e.key === armed.value)
  const dm = diffMap(shownList.filter((e) => !e.trace).map((e) => ({ k: e.key, o: e.item.option || { label: e.item.label } })))
  const id = sub(basket ? 'basket-rows' : 'rows')
  const more = live.length > cap && (open ? need('showLess', '«Ver menos»') : need('showAll', '«Ver los N»'))
  return [
    h('ul', { key: 'rows', class: 'g-combobox__rows', id, ...(basket ? { 'aria-labelledby': sub('basket-title') } : listLabel.value) }, shownList.map((e) => rowLi(e, nOf.get(e), basket, dm))),
    more
      ? h('button', { key: 'all', type: 'button', class: 'g-combobox__rows-all', 'aria-expanded': open ? 'true' : 'false', 'aria-controls': id, onClick: () => { if (basket) basketOpen.value = !open; else rowsOpen.value = !open } }, [
          h(GIcon, { name: 'chevron-down' }),
          open ? more : tx('showAll', '', { count: nf(live.length) }, live.length)
        ])
      : null
  ]
}
const Receta = () => Rows(false)
const Basket = () => h('section', { class: 'g-combobox__basket', 'aria-labelledby': sub('basket-title') }, [
  h('h3', { class: 'g-combobox__basket-title', id: sub('basket-title') }, [L.value.chosen, ' ', h('span', { class: 'g-combobox__basket-tally' }, [num(tally.value)])]),
  ...(ledger.value.length ? Rows(true) : [L.value.basketEmpty ? h('p', { class: 'g-combobox__basket-empty' }, L.value.basketEmpty) : null])
])
const Foot = () => h('div', { class: 'g-combobox__foot' }, [
  h('span', { class: 'g-combobox__foot-tally' }, [num(tally.value)]),
  L.value.done ? h(GBtn, { class: 'g-combobox__done', size: props.size, onClick: closeList }, () => L.value.done) : null
])

/**
 * Lo que queda fuera de flujo como hijo de la raíz: región viva, y la superficie (GDialog real) o el popover de A.
 * Antes de montar (servidor e hidratación) se pinta en la celda; al montar, <Teleport> lo lleva a la raíz de GInput.
 */
const Extras = () => [
  h('div', { key: 'live', id: sub('live'), class: 'g-combobox__live', role: 'status', 'aria-live': 'polite', 'aria-atomic': 'true' }, surfaceOpen.value ? '' : live.polite),
  surface.value
    ? h(GDialog, {
        key: 'surface',
        id: sub('surface'),
        modelValue: surfaceOpen.value,
        'onUpdate:modelValue': (v) => { surfaceOpen.value = v },
        onOpen: focusSearch,
        class: ['g-combobox-surface', narrow.value ? 'g-combobox-surface--sheet' : 'g-combobox-surface--palette'],
        size: 'lg',
        mobile: 'sheet',
        title: surfaceTitle.value,
        closeLabel: L.value.close
      }, {
        default: () => [
          h('div', { class: 'g-combobox__search' }, [
            h('span', { class: 'g-combobox__search-icon', 'aria-hidden': 'true' }, [h(GIcon, { name: 'search' })]),
            h('input', {
              id: sub('search'),
              class: 'g-combobox__search-field',
              type: 'text',
              role: 'combobox',
              'aria-autocomplete': 'list',
              'aria-expanded': 'true',
              'aria-controls': sub('list'),
              'aria-activedescendant': activeRow.value ? activeRow.value.id : undefined,
              'aria-labelledby': sub('surface-title'),
              value: query.value,
              placeholder: selected.value ? selected.value.label : attrs.placeholder,
              autocomplete: 'off',
              autocapitalize: 'none',
              spellcheck: 'false',
              enterkeyhint: 'search',
              onInput: onSearchInput,
              onKeydown: onSearchKeydown,
              onCompositionstart,
              onCompositionend: onSearchCompositionend
            }),
            busy.value ? h('span', { class: 'g-combobox__search-loader', 'aria-hidden': 'true' }, [h(GIcon, { name: 'loader-circle' })]) : null
          ]),
          h('div', { class: ['g-combobox__surface-body', { 'has-preview': hasPreview.value, 'has-basket': basketShown.value }] }, [
            h(Panel),
            hasPreview.value ? h('aside', { id: sub('preview'), class: 'g-combobox__preview', 'aria-label': L.value.preview }, [h(Preview)]) : null,
            basketShown.value ? h(Basket) : null
          ]),
          h('div', { class: 'g-combobox__live', role: 'status', 'aria-live': 'polite', 'aria-atomic': 'true' }, live.polite),
          M ? h(Foot) : null // último hijo de g-dialog__body (coco)
        ]
      })
    : h('div', { key: 'popup', id: sub('popup'), ref: popupEl, class: ['g-combobox__popup', { 'is-empty': !opened.value || !hasPanel.value }], popover: 'manual' }, [
        h('div', { class: 'g-combobox__popup-body' }, [h(Panel)])
      ])
]

// ---------- Limpiar y flecha ----------
const showClear = computed(() => props.clearable && Boolean(L.value.clear) && (hasModel.value || customText.value !== '' || count.value > 0) && editable.value)
const clearNaming = computed(() => {
  const own = sub('clear-text')
  if (hasLabel.value) return { 'aria-labelledby': `${own} ${sub('label')}` }
  if (attrs['aria-labelledby']) return { 'aria-labelledby': `${own} ${attrs['aria-labelledby']}` }
  if (attrs['aria-label']) return { 'aria-label': `${L.value.clear} ${attrs['aria-label']}` }
  return { 'aria-labelledby': own }
})

// ---------- Atributos ----------
const isListener = (k) => /^on[A-Z]/.test(k)
const OMIT = new Set(['class', 'style', 'type', 'multiple'])
// A GInput: todo salvo escuchas, `type` y `multiple` (la raíz recibe class/style; el resto llega en `bind` al <input>)
const forwardAttrs = computed(() => {
  void attrs.class // lectura que registra la dependencia aunque no haya atributos
  const out = {}
  for (const [k, v] of Object.entries(attrs)) {
    if (OMIT.has(k) || isListener(k)) continue
    out[k] = v
  }
  return out
})
// Escuchas del consumidor: al <input> visible, DESPUÉS de los manejadores del contexto y de los propios (C8)
const listenerAttrs = computed(() => {
  void attrs.class
  const out = {}
  for (const [k, v] of Object.entries(attrs)) if (isListener(k)) out[k] = v
  return out
})
const ownHandlers = { onInput, onKeydown, onKeyup, onSelect, onFocus, onBlur, onClick, onCompositionstart, onCompositionend }

/** Propiedades del <input> visible: fijos previos › bind de GInput (contexto primero + atributos) › propios › escuchas › patrón. */
function fieldProps(f) {
  ctx = f
  const { name: _n, required: _r, ...bind } = f.bind
  const isSurface = surface.value
  const describedBy = [about.value ? sub('about') : null, bind['aria-describedby']].filter(Boolean).join(' ') || undefined
  return mergeProps(
    { autocomplete: 'off', autocapitalize: 'none', spellcheck: 'false' },
    bind,
    { class: 'g-combobox__field', ...ownHandlers },
    listenerAttrs.value,
    {
      type: 'text',
      role: 'combobox',
      value: text.value,
      inputmode: isSurface ? 'none' : bind.inputmode,
      'aria-autocomplete': isSurface ? undefined : 'list',
      'aria-haspopup': isSurface ? 'dialog' : 'listbox',
      'aria-expanded': panelVisible.value ? 'true' : 'false',
      'aria-controls': isSurface ? sub('surface') : sub('list'),
      'aria-activedescendant': !isSurface && listOpen.value && activeRow.value ? activeRow.value.id : undefined,
      'aria-required': props.required ? 'true' : undefined,
      'aria-readonly': f.readonly ? 'true' : undefined,
      'aria-describedby': describedBy,
      // A: con la frase en la celda, el placeholder no se pinta (sin elegidos, la celda es toda del campo)
      ...(hasSentence.value ? { placeholder: undefined } : null)
    }
  )
}

const hiddenValue = computed(() => (hasModel.value ? String(props.modelValue) : ''))
const rootClasses = computed(() => [
  'g-combobox',
  `g-combobox--appearance-${props.appearance === 'palette' ? 'palette' : 'field'}`,
  M && ['g-combobox--multiple', `g-combobox--selection-${props.selection === 'list' ? 'list' : 'inline'}`, { 'has-chosen': count.value > 0, 'is-full': isFull.value }],
  {
    'is-open': listOpen.value,
    'is-up': listOpen.value && up.value,
    'is-surface': surface.value,
    'is-token': showToken.value,
    'is-custom': isCustom.value
  },
  attrs.class
])

// ---------- Montaje ----------
let mq = null
function onMq() {
  if (opened.value) closeList() // cruzar el umbral con la lista abierta la cierra
  narrow.value = mq.matches
}
let boxEl = null
onMounted(() => {
  const root = valueEl.value?.closest('.g-input') || null
  host.value = root
  domLang.value = root?.closest('[lang]')?.getAttribute('lang') || null
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    mq = window.matchMedia(PHONE_QUERY)
    narrow.value = mq.matches
    mq.addEventListener?.('change', onMq)
  }
  boxEl = controlEl()
  boxEl?.addEventListener('pointerdown', onBoxDown)
  if (M && root) {
    root.addEventListener('focusout', onRootFocusOut)
    root.addEventListener('pointerdown', disarm, true)
    root.addEventListener('animationend', onAnimEnd)
    root.addEventListener('animationcancel', onAnimEnd)
    // La frase se mide al montar, al cambiar el tamaño de la celda, lo elegido, el foco o el lang, y con las fuentes
    stopSize = observeSize(valueEl.value, scheduleFit)
    // y la frase misma: su máximo cambia con el foco y al abrir (coco)
    watch(sentenceEl, (el, _, onClean) => { if (el) onClean(observeSize(el, scheduleFit)) }, { immediate: true })
    document.fonts?.ready?.then(scheduleFit)
    scheduleFit()
  }
  if (isDev && root && root.closest('.g-input-group')) warnOnce('input-group', 'no se admite dentro de un GInputGroup en v0.1 (reservado, #338).')
})
const disarm = () => { armed.value = null }
let stopSize = null
if (M) watch(() => [chosen.value, focused.value, opened.value, armed.value, domLang.value, L.value.rest], scheduleFit)
onBeforeUnmount(() => {
  stopSize?.()
  clearTimeout(timer)
  clearTimeout(annTimer)
  writer.dispose()
  listen(false)
  endArrive()
  mq?.removeEventListener?.('change', onMq)
  boxEl?.removeEventListener('pointerdown', onBoxDown)
  boxEl = null
  const pop = popupEl.value
  if (pop && typeof pop.hidePopover === 'function' && pop.matches?.(':popover-open')) {
    try { pop.hidePopover() } catch { /* ya cerrado */ }
  }
})

// ---------- Avisos de desarrollo (combobox.md «Avisos», 1 a 11) ----------
if (isDev) {
  if (!hasLabel.value && !attrs['aria-label'] && !attrs['aria-labelledby']) warnOnce('name', 'necesita label, slot label, aria-label o aria-labelledby para tener un nombre accesible.')
  if (!L.value.close) warnOnce('label:close', 'falta labels.close: la superficie (paleta y hoja móvil) queda sin botón de cierre.')
  if (props.clearable && !L.value.clear) warnOnce('label:clear', 'clearable necesita labels.clear: el botón de limpiar no se pinta.')
  if (props.allowCustom && !L.value.useCustom) warnOnce('label:useCustom', 'allowCustom necesita labels.useCustom: la fila de texto libre no se pinta.')
  if (props.allowCustom && !L.value.custom) warnOnce('label:custom', 'allowCustom necesita labels.custom: la ficha de texto libre queda sin marca.')
  if (props.creatable && !L.value.create) warnOnce('label:create', 'creatable necesita labels.create: la fila de agregar no se pinta.')
  if (minChars.value > 0 && !L.value.minChars) warnOnce('label:minChars', 'minChars necesita labels.minChars para la pista de mínimo.')
  if (!M && props.appearance === 'palette' && !L.value.preview) warnOnce('label:preview', 'appearance="palette" necesita labels.preview: la vista previa queda sin nombre.')
  if (!props.label && !attrs['aria-label'] && !L.value.surfaceTitle) warnOnce('label:surfaceTitle', 'sin label ni aria-label, la superficie necesita labels.surfaceTitle para su título.')
  if (props.allowCustom && props.name && !props.customName) warnOnce('custom-name', 'allowCustom con name y sin customName: el texto libre no viaja en FormData.')
  if (attrs.type !== undefined) warnOnce('type', 'type no aplica: el campo es siempre type="text" con role="combobox".')
  if (slots.append || slots.action) warnOnce('slots', 'los slots append y action no aplican (el final de la caja es de limpiar y flecha): no se pintan.')
  if (slots.preview && props.appearance !== 'palette') warnOnce('preview-slot', 'el slot preview solo se pinta con appearance="palette".')
  // Fase 2 (avisos 13 a 17)
  watch(() => props.multiple, (v) => { if (Boolean(v) !== M) warnOnce('multiple-late', 'multiple se lee al montar: cambiarlo después no tiene efecto (cambia la key para cambiar de modo).') })
  if (M) {
    if (props.selectedOption) warnOnce('m-selected-option', 'selectedOption no aplica con multiple: se ignora (usa selectedOptions).')
    if (props.numbered && props.selection !== 'list' && props.appearance !== 'palette') warnOnce('m-numbered', 'numbered numera renglones: con selection="inline" y appearance="field" no hay renglones; se ignora.')
    if (slots.value) warnOnce('m-value-slot', 'el slot value no aplica con multiple (no hay ficha): se ignora.')
    if (slots.preview && props.appearance === 'palette') warnOnce('m-preview-slot', 'con multiple, la cesta ocupa el sitio de la vista previa: el slot preview no se pinta.')
    for (const k of ['selected', 'chosen', 'done']) if (!L.value[k]) warnOnce(`label:${k}`, `falta labels.${k}: los textos los pone la aplicación (multiple).`)
    if (props.allowCustom && !L.value.customItem) warnOnce('label:customItem', 'allowCustom con multiple necesita labels.customItem: un texto libre se nombra solo con su texto.')
    if (props.selection !== 'list' && !L.value.rest) warnOnce('label:rest', 'selection="inline" necesita labels.rest: la frase se recorta con elipsis sin decir cuántas faltan.')
    if (props.selection === 'list' && !L.value.fresh) warnOnce('label:fresh', 'selection="list" necesita labels.fresh: lo nuevo lleva solo la barra.')
    if (props.appearance === 'palette' && !L.value.basketEmpty) warnOnce('label:basketEmpty', 'appearance="palette" con multiple necesita labels.basketEmpty: la cesta vacía queda sin texto.')
    if ((props.selection === 'list' || props.appearance === 'palette') && (!L.value.undo || !L.value.trace)) warnOnce('label:trace', 'los renglones necesitan labels.undo y labels.trace: sin ellos, quitar no deja rastro (Ctrl/⌘+Z sigue).')
    if (props.max !== undefined && !(Number.isInteger(props.max) && props.max >= 1)) warnOnce('max', `max ${String(props.max)} no es un entero ≥ 1: sin límite.`)
    if (maxN.value) {
      if (!L.value.max) warnOnce('label:max', 'max necesita labels.max para el estado y el anuncio del tope.')
      if (!L.value.ofMax) warnOnce('label:ofMax', 'max necesita labels.ofMax para el recuento con tope: se usa labels.selected.')
    }
    watch(count, (n) => { if (maxN.value && n > maxN.value) warnOnce('over-max', `hay ${n} elegidos y max es ${maxN.value}: se pintan y se envían todos.`) }, { immediate: true })
  } else {
    if (props.selectedOptions && props.selectedOptions.length) warnOnce('selected-options', 'selectedOptions solo aplica con multiple: se ignora.')
    if (props.selection !== 'inline' || props.numbered || props.max !== undefined) warnOnce('single-props', 'selection, numbered y max solo aplican con multiple: se ignoran.')
    if (slots.chosen) warnOnce('chosen-slot', 'el slot chosen solo aplica con multiple: se ignora.')
  }
  if (!(Number.isInteger(props.limit) && props.limit >= 1)) warnOnce('limit', `limit ${String(props.limit)} no es un entero ≥ 1: se usa 50.`)
  if (!(Number.isFinite(props.delay) && props.delay >= 0)) warnOnce('delay', `delay ${String(props.delay)} no es un número ≥ 0: se usa 250.`)
  if (!(Number.isInteger(props.minChars) && props.minChars >= 0)) warnOnce('minChars', `minChars ${String(props.minChars)} no es un entero ≥ 0: se usa 0.`)
  if (!M) watch(() => [props.modelValue, props.custom, props.allowCustom, selected.value, props.selectedOption], () => {
    const so = props.selectedOption
    if (so && hasModel.value && so.value !== props.modelValue) warnOnce('selected-option', 'selectedOption.value no es modelValue: se ignora.')
    if (hasModel.value && !selected.value) warnOnce(`unknown:${String(props.modelValue)}`, `modelValue (${String(props.modelValue)}) no corresponde a ninguna opción conocida ni a selectedOption: el campo queda vacío, pero el valor se envía.`)
    if (props.custom) {
      if (!props.allowCustom) warnOnce('custom-off', 'custom tiene valor sin allowCustom: se ignora.')
      else if (hasModel.value) warnOnce('both', 'modelValue y custom tienen valor a la vez: gana modelValue.')
    }
  }, { immediate: true })
  watch(() => [props.total, remote.value, flat.value.length], () => {
    if (props.total === null || props.total === undefined) return
    if (!remote.value) warnOnce('total-local', 'total solo cuenta con filter: false; con filtro local se ignora (lo cuenta el componente).')
    else if (props.total < flat.value.length) warnOnce('total-less', `total (${props.total}) es menor que las opciones entregadas (${flat.value.length}).`)
  }, { immediate: true })
}
</script>

<template>
  <GInput
    v-bind="forwardAttrs"
    :id="baseId"
    :class="rootClasses"
    :style="attrs.style"
    :name="name"
    :label="label"
    :hint="hint"
    :error="error"
    :warning="warning"
    :valid="valid"
    :required="required"
    :mark="mark"
    :readonly="readonly"
    :disabled="disabled"
    :loading="loading && !surface"
    :size="size"
    :variant="variant"
    :density="density"
    :color="color"
    :rounded="rounded"
    :block="block"
  >
    <template v-if="slots.label" #label><slot name="label" /></template>
    <template v-if="slots.hint" #hint><slot name="hint" /></template>
    <template v-if="slots.error" #error><slot name="error" /></template>
    <template v-if="slots.prepend" #prepend><slot name="prepend" /></template>
    <template #field="f">
      <span ref="valueEl" class="g-combobox__value">
        <span v-if="sentence" ref="sentenceEl" class="g-combobox__sentence" aria-hidden="true"><template v-for="(p, i) in sentence" :key="i"><span v-if="p.sep !== undefined" class="g-combobox__sentence-sep">{{ p.sep }}</span><span v-else-if="p.rest" class="g-combobox__sentence-rest">{{ p.a }}<span :key="rollKey" :class="['g-combobox__num', { 'is-rolling': rolling }]">{{ p.n }}</span>{{ p.b }}</span><span v-else :class="['g-combobox__sentence-item', { 'is-custom': p.custom, 'is-armed': p.armed }]"><span v-if="p.custom" class="g-combobox__sentence-icon"><GIcon name="pencil" /></span>{{ p.t }}</span></template></span>
        <input :ref="setFieldEl" v-bind="fieldProps(f)">
        <span v-if="ghost" class="g-combobox__ghost" aria-hidden="true"><span class="g-combobox__ghost-typed">{{ text }}</span><span class="g-combobox__ghost-rest">{{ ghost.rest }}</span></span>
        <span
          v-if="showToken"
          ref="tokenEl"
          :class="['g-combobox__token', { 'is-arriving': Boolean(arriving) }]"
          :style="tokenStyle"
          aria-hidden="true"
          @animationend="onTokenAnimationEnd"
          @animationcancel="onTokenAnimationEnd"
        >
          <slot name="value" :option="selected" :custom="customText"><TokenCard /></slot>
        </span>
        <span v-if="about" :id="sub('about')" class="g-combobox__about">{{ about }}</span>
        <template v-if="M">
          <template v-if="name"><input v-for="v in values" :key="keyOf(v)" type="hidden" :name="name" :value="String(v)" :disabled="f.disabled || undefined" :form="attrs.form"></template>
          <template v-if="customName"><input v-for="t in customs" :key="t" type="hidden" :name="customName" :value="t" :disabled="f.disabled || undefined" :form="attrs.form"></template>
        </template>
        <template v-else>
          <input v-if="name" type="hidden" :name="name" :value="hiddenValue" :disabled="f.disabled || undefined" :form="attrs.form">
          <input v-if="customName" type="hidden" :name="customName" :value="customText" :disabled="f.disabled || undefined" :form="attrs.form">
        </template>
        <Extras v-if="!host" />
        <Teleport v-else :to="host"><Extras /></Teleport>
      </span>
    </template>
    <template v-if="M && selection === 'list'" #below>
      <div v-if="ledger.length" class="g-combobox__chosen"><Receta /></div>
    </template>
    <template #end="e">
      <button
        v-if="showClear"
        :id="sub('clear')"
        type="button"
        class="g-combobox__clear"
        v-bind="clearNaming"
        @pointerdown="onClearDown"
        @touchend="onGestureTouchend"
        @pointerup="onGesturePointerup"
        @pointercancel="onGestureCancel"
        @mousedown="keep"
        @click="onClearClick"
      ><span :id="sub('clear-text')" class="g-combobox__clear-text">{{ L.clear }}</span><GIcon name="x" /></button>
      <span v-if="!e.readonly && !e.disabled" class="g-combobox__arrow" aria-hidden="true" @pointerdown="onArrowDown" @touchend="onGestureTouchend" @pointerup="onGesturePointerup" @pointercancel="onGestureCancel" @mousedown="keep" @click="onArrowClick"><GIcon :name="surface ? 'chevrons-up-down' : 'chevron-down'" /></span>
    </template>
  </GInput>
</template>
