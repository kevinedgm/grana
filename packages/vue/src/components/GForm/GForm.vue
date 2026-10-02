<script setup>
// GForm · formulario con contexto: momento de los errores, envío, resumen y estado sucio (dueño: bruno)
// Contrato: design/contracts/form.md §1–§2 · Estructura: design/lab/form/r01/ · Estilo: GForm.css (coco)
// Grana presenta y emite intención; no valida ni guarda: `errors` y `warnings` los calcula la aplicación.
import { computed, inject, mergeProps, nextTick, onBeforeUnmount, provide, reactive, ref, shallowReactive, shallowRef, useAttrs, watch } from 'vue'
import { oneOf } from '../../utils/oneOf.js'
import { byDocument, formKey, isDev, nextFrame, revealAndFocus, spaceUnit } from './formContext.js'

defineOptions({ name: 'GForm', inheritAttrs: false })

const props = defineProps({
  errors: { type: Object, default: () => ({}) },
  warnings: { type: Object, default: () => ({}) },
  showErrorsOn: { type: String, default: 'blur', validator: oneOf(['blur', 'submit']) },
  marks: { type: String, default: 'optional', validator: oneOf(['optional', 'required']) },
  density: { type: String, default: 'default', validator: oneOf(['default', 'comfortable', 'compact']) },
  readonly: Boolean,
  disabled: Boolean,
  headingLevel: { type: Number, default: 3, validator: (v) => Number.isInteger(v) && v >= 2 && v <= 6 },
  dirty: Boolean,
  labels: { type: Object, default: () => ({}) }
})

// Todos declarados: si no, el `submit` del consumidor llegaría también al <form> nativo por $attrs
const emit = defineEmits(['submit', 'invalid', 'reset', 'update:dirty'])

const attrs = useAttrs()
const parent = inject(formKey, null)
const nested = Boolean(parent)
const formEl = ref(null)

// ---------- Avisos de desarrollo (una vez cada uno) ----------
const warned = new Set()
function warnOnce(key, msg) {
  if (!isDev || warned.has(key)) return
  warned.add(key)
  console.warn(`[Grana GForm] ${msg}`)
}
if (isDev) {
  if (nested) warnOnce('nested', 'un GForm dentro de otro GForm: HTML no admite formularios anidados; el interior se pinta como <div> y sigue proveyendo su contexto.')
  if (attrs.action !== undefined || attrs.method !== undefined) warnOnce('action', 'se ignoran `action` y `method`: GForm siempre cancela el envío nativo y emite `submit`.')
}

// ---------- Registro ----------
const entries = shallowReactive(new Map()) // uid → registro (campos con name y GFieldGroup)
function register(entry) {
  if (isDev) {
    for (const n of entry.names()) {
      for (const other of entries.values()) {
        if (other !== entry && other.names().includes(n)) warnOnce(`dup-${n}`, `dos campos registrados con el mismo name («${n}»).`)
      }
    }
  }
  entries.set(entry.uid, entry)
  return () => { if (entries.get(entry.uid) === entry) entries.delete(entry.uid) }
}
const sorted = () => [...entries.values()].sort((a, b) => byDocument(a.root() || a.control(), b.root() || b.control()))

// ---------- Momento de los errores («castigar tarde, premiar pronto», #157) ----------
const edited = reactive(new Set())
const shownErr = reactive(new Set())
const shownWarn = reactive(new Set())
const live = ref('polite')

const textOf = (map, n) => (map && map[n] ? String(map[n]) : '')
function prune() {
  for (const n of [...shownErr]) if (!textOf(props.errors, n)) shownErr.delete(n)
  for (const n of [...shownWarn]) if (!textOf(props.warnings, n)) shownWarn.delete(n)
}
// Corregido = oculto: el próximo error de ese campo espera al siguiente blur o envío
watch(() => props.errors, prune, { deep: true })
watch(() => props.warnings, prune, { deep: true })

function reveal(n) {
  shownErr.add(n)
  shownWarn.add(n)
  // La aplicación puede calcular el error en su propia escucha (que va después): se poda en el tick siguiente
  nextTick(prune)
}
function visible(n, kind) {
  if (kind === 'warning') return shownWarn.has(n) ? textOf(props.warnings, n) : ''
  return shownErr.has(n) ? textOf(props.errors, n) : ''
}
const isShown = (n) => shownErr.has(n) || shownWarn.has(n)

// ---------- Estado sucio ----------
const dirtyLocal = ref(props.dirty)
watch(() => props.dirty, (v) => { dirtyLocal.value = v })
function markDirty() {
  if (dirtyLocal.value) return
  dirtyLocal.value = true
  emit('update:dirty', true)
}

function notifyInput(n) {
  if (n) edited.add(n)
}
function notifyBlur(n) {
  if (n && props.showErrorsOn === 'blur' && edited.has(n)) reveal(n)
}
function notifyChange(n, revealNow) {
  markDirty()
  if (!n) return
  edited.add(n)
  if (revealNow && props.showErrorsOn === 'blur') reveal(n)
}

// ---------- Errores que bloquean ----------
function blocking() {
  const items = []
  const covered = new Set()
  for (const e of sorted()) {
    for (const n of e.names()) covered.add(n)
    if (e.inGroup || e.disabled()) continue
    const b = e.blocking(props.errors)
    if (b) items.push({ key: e.uid, ...b, entry: e })
  }
  for (const [k, v] of Object.entries(props.errors || {})) {
    if (v && !covered.has(k)) items.push({ key: `general:${k}`, name: k, message: String(v), id: null, entry: null })
  }
  return items
}

// Resumen: los errores que bloquearon el último envío o showErrors(), al día (al corregir, el elemento sale)
const snapshot = shallowRef(null)
const summaryItems = computed(() => {
  const keys = snapshot.value
  if (!keys) return []
  return blocking().filter((i) => keys.has(i.key)).map((i) => ({ key: i.key, name: i.name, id: i.id, message: i.message, root: i.entry ? () => i.entry.root() : null }))
})
let summaryApi = null
function registerSummary(api) {
  if (summaryApi && isDev) warnOnce('summaries', 'más de un GErrorSummary en el mismo formulario.')
  summaryApi = api
  return () => { if (summaryApi === api) summaryApi = null }
}

// Revela todos: los mensajes que aparecen por este envío se escriben con la región viva en `off` (#164)
async function revealAll() {
  live.value = 'off'
  for (const e of entries.values()) for (const n of e.names()) { shownErr.add(n); shownWarn.add(n) }
  for (const k of Object.keys(props.errors || {})) shownErr.add(k)
  await nextTick() // la aplicación recalcula `errors`
  prune()
  const list = blocking()
  snapshot.value = new Set(list.map((i) => i.key))
  await nextTick() // mensajes y resumen escritos
  nextFrame(() => { live.value = 'polite' })
  return list
}

function focusFirstError() {
  for (const e of sorted()) {
    if (e.inGroup || e.disabled()) continue
    const t = e.visibleTarget()
    if (t && t.control) {
      revealAndFocus(t.control, t.root)
      return true
    }
  }
  return false
}
function focusAfter(list) {
  if (!list.length) return
  if (summaryApi) {
    summaryApi.focus()
    return
  }
  const first = list.find((i) => i.id)
  if (!first) return
  const control = typeof document !== 'undefined' ? document.getElementById(first.id) : null
  revealAndFocus(control || first.entry?.control(), first.entry?.root())
}

async function showErrors() {
  const list = await revealAll()
  focusAfter(list)
  return list
}

function resetState() {
  edited.clear()
  shownErr.clear()
  shownWarn.clear()
  snapshot.value = null
  dirtyLocal.value = false
  emit('update:dirty', false)
}

// ---------- Envío ----------
function formData(submitter) {
  const f = formEl.value
  if (!f || f.tagName !== 'FORM' || typeof FormData === 'undefined') return typeof FormData === 'undefined' ? null : new FormData()
  try {
    return submitter ? new FormData(f, submitter) : new FormData(f)
  } catch {
    const d = new FormData(f)
    if (submitter && submitter.name) d.append(submitter.name, submitter.value ?? '')
    return d
  }
}
async function onSubmit(event) {
  event.preventDefault()
  const submitter = event.submitter || null
  if (submitter && typeof submitter.hasAttribute === 'function' && submitter.hasAttribute('formnovalidate')) {
    emit('submit', { event, data: formData(submitter), submitter, novalidate: true })
    return
  }
  const list = await revealAll()
  if (list.length) {
    emit('invalid', { event, errors: list.map(({ name, message, id }) => ({ name, message, id })) })
    focusAfter(list)
  } else {
    emit('submit', { event, data: formData(submitter), submitter, novalidate: false })
  }
}
function onReset(event) {
  // Los valores son de la aplicación: el reset nativo los desincronizaría
  event.preventDefault()
  resetState()
  emit('reset', { event })
}

// ---------- Pie fijo: altura publicada y respaldo del foco (WCAG 2.4.11) ----------
const actionsSize = ref(null)
let stickyEl = null
let stickyCount = 0
function registerActions(getEl) {
  stickyCount++
  if (stickyCount > 1) warnOnce('sticky', 'más de un GFormActions sticky en el mismo formulario.')
  stickyEl = getEl
  return () => {
    stickyCount--
    if (stickyEl === getEl) stickyEl = null
    if (!stickyCount) actionsSize.value = null
  }
}
function setActionsSize(px) {
  const v = px === null || px === undefined ? null : Math.round(px)
  if (actionsSize.value !== v) actionsSize.value = v
}
function scrollParent(el) {
  let s = el ? el.parentElement : null
  while (s) {
    const oy = getComputedStyle(s).overflowY
    if (s.scrollHeight > s.clientHeight && /auto|scroll/.test(oy)) return s
    s = s.parentElement
  }
  return document.scrollingElement || document.documentElement
}
// Respaldo JS: WebKit no aplica scroll-margin al enfocar y Chromium lleva a la vista el cursor de un <textarea>
function onFocusin(event) {
  if (actionsSize.value === null || !stickyEl) return
  const bar = stickyEl()
  const t = event.target
  if (!bar || !t || bar.contains(t) || typeof t.getBoundingClientRect !== 'function') return
  const fix = () => {
    const room = bar.getBoundingClientRect().top - spaceUnit(formEl.value) * 4
    const d = t.getBoundingClientRect().bottom - room
    if (d <= 0) return
    const sc = scrollParent(formEl.value)
    if (sc && typeof sc.scrollBy === 'function') sc.scrollBy({ top: d, behavior: 'instant' })
  }
  // Ya (el navegador desplazó al enfocar) y otra vez en el cuadro siguiente, por si el desplazamiento del foco llega después
  fix()
  nextFrame(fix)
}

// ---------- Contexto ----------
provide(formKey, {
  density: computed(() => props.density),
  marks: computed(() => props.marks),
  readonly: computed(() => props.readonly),
  disabled: computed(() => props.disabled),
  labels: computed(() => props.labels || {}),
  headingLevel: computed(() => props.headingLevel),
  live,
  register,
  notifyInput,
  notifyBlur,
  notifyChange,
  isShown,
  visible,
  setActionsSize,
  registerActions,
  registerSummary,
  summaryItems,
  warnOnce
})

if (isDev && props.marks === 'required' && !props.labels?.requiredHint) warnOnce('label-requiredHint', 'falta labels.requiredHint: con marks="required" no se pinta la frase que explica el asterisco.')

onBeforeUnmount(() => { summaryApi = null })

// ---------- Marcado ----------
const classes = computed(() => [
  'g-form',
  `g-form--density-${props.density}`,
  `g-form--marks-${props.marks}`,
  {
    'g-form--readonly': props.readonly,
    'g-form--disabled': props.disabled,
    'g-form--sticky-actions': actionsSize.value !== null
  }
])
const rootBindings = computed(() => {
  const { action: _a, method: _m, class: cls, style, ...rest } = attrs
  return mergeProps(
    { onSubmit, onReset, onInput: markDirty, onChange: markDirty, onFocusin },
    rest,
    {
      class: [classes.value, cls],
      style: [style, actionsSize.value !== null ? { '--g-form-actions-size': `${actionsSize.value}px` } : null]
    }
  )
})

defineExpose({ showErrors, focusFirstError, resetState })
</script>

<template>
  <component :is="nested ? 'div' : 'form'" ref="formEl" v-bind="rootBindings" :novalidate="nested ? undefined : true">
    <p v-if="marks === 'required' && labels && labels.requiredHint" class="g-form__required-hint">{{ labels.requiredHint }}</p>
    <slot />
  </component>
</template>
