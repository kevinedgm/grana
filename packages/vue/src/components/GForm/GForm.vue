<script setup>
// GForm · formulario con contexto: momento de los errores, envío, resumen y estado sucio (dueño: bruno)
// Contrato: design/contracts/form.md §1–§2 · Estructura: design/lab/form/r01/ · Estilo: GForm.css (coco)
// Grana presenta y emite intención; no valida ni guarda: `errors` y `warnings` los calcula la aplicación.
import { computed, inject, mergeProps, provide, ref, useAttrs, watch } from 'vue'
import { oneOf } from '../../utils/oneOf.js'
import { formKey, nextFrame, spaceUnit } from './formContext.js'
import { createFormEngine } from './formEngine.js'

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
  try {
    if (process.env.NODE_ENV !== 'production' && !warned.has(key)) {
      warned.add(key)
      console.warn(`[Grana GForm] ${msg}`)
    }
  } catch {}
}
try {
  if (process.env.NODE_ENV !== 'production') {
    if (nested) warnOnce('nested', 'un GForm dentro de otro GForm: HTML no admite formularios anidados; el interior se pinta como <div> y sigue proveyendo su contexto.')
    if (attrs.action !== undefined || attrs.method !== undefined) warnOnce('action', 'se ignoran `action` y `method`: GForm siempre cancela el envío nativo y emite `submit`.')
  }
} catch {}

// ---------- Motor compartido con GFormFold (formEngine.js, form.md §15, #588) ----------
const engine = createFormEngine({
  errors: () => props.errors,
  warnings: () => props.warnings,
  showErrorsOn: () => props.showErrorsOn,
  root: () => formEl.value,
  warnOnce,
  onDirty: () => markDirty()
})
const { live, register, revealAll, reject, focusAfter } = engine
const focusFirstError = engine.focusFirstError

// ---------- Estado sucio ----------
const dirtyLocal = ref(props.dirty)
watch(() => props.dirty, (v) => { dirtyLocal.value = v })
// L1 (design/lab/dialog/r02): un GDialog dentro del formulario es otro contexto (corta formKey y los demás). Sus eventos
// burbujean igual por el DOM hasta este <form>: los que vienen de un <dialog> interior no son de este formulario.
function fromInnerDialog(event) {
  const t = event && event.target
  const d = t && typeof t.closest === 'function' ? t.closest('dialog') : null
  return Boolean(d && formEl.value && formEl.value !== d && formEl.value.contains(d))
}
// Un GFormFold es otro formulario (form.md §15, #588): lo que se escribe en él no ensucia este
function fromFold(event) {
  const t = event && event.target
  const f = t && typeof t.closest === 'function' ? t.closest('.g-form-fold') : null
  return Boolean(f && formEl.value && formEl.value.contains(f))
}
function markDirty(event) {
  if (fromInnerDialog(event) || fromFold(event)) return
  if (dirtyLocal.value) return
  dirtyLocal.value = true
  emit('update:dirty', true)
}

async function showErrors() {
  const list = await revealAll()
  reject(list)
  await focusAfter(list)
  return list
}

function resetState() {
  engine.clearState()
  dirtyLocal.value = false
  emit('update:dirty', false)
}

// ---------- Envío ----------
// Sin los controles de los GFormFold abiertos (form.md §15, #588; también con formnovalidate): sus fieldset se deshabilitan
// de forma síncrona solo mientras se construye y se restauran en el acto (nada se pinta en medio)
function formData(submitter) {
  const f = formEl.value
  if (!f || f.tagName !== 'FORM' || typeof FormData === 'undefined') return typeof FormData === 'undefined' ? null : new FormData()
  const off = engine.excluded().filter((el) => !el.disabled)
  for (const el of off) el.disabled = true
  try {
    return submitter ? new FormData(f, submitter) : new FormData(f)
  } catch {
    const d = new FormData(f)
    if (submitter && submitter.name) d.append(submitter.name, submitter.value ?? '')
    return d
  } finally {
    for (const el of off) el.disabled = false
  }
}
async function onSubmit(event) {
  // El envío de un GForm interior (en un GDialog escrito dentro de este) burbujea hasta aquí: no es nuestro (L1)
  if (event.target !== formEl.value) return
  event.preventDefault()
  const submitter = event.submitter || null
  if (submitter && typeof submitter.hasAttribute === 'function' && submitter.hasAttribute('formnovalidate')) {
    emit('submit', { event, data: formData(submitter), submitter, novalidate: true })
    return
  }
  const list = await revealAll()
  if (list.length) {
    emit('invalid', { event, errors: list.map(({ name, message, id }) => ({ name, message, id })) })
    reject(list)
    focusAfter(list)
  } else {
    emit('submit', { event, data: formData(submitter), submitter, novalidate: false })
  }
}
function onReset(event) {
  if (event.target !== formEl.value) return // reset de un formulario interior (L1)
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
  try { if (process.env.NODE_ENV !== 'production' && stickyCount > 1) warnOnce('sticky', 'más de un GFormActions sticky en el mismo formulario.') } catch {}
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
  if (actionsSize.value === null || !stickyEl || fromInnerDialog(event)) return
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
  // Interno: lo hereda un GFormFold (form.md §15 «Lo que hereda del GForm de fuera»)
  showErrorsOn: computed(() => props.showErrorsOn),
  ...engine.context,
  setActionsSize,
  registerActions
})

try { if (process.env.NODE_ENV !== 'production' && props.marks === 'required' && !props.labels?.requiredHint) warnOnce('label-requiredHint', 'falta labels.requiredHint: con marks="required" no se pinta la frase que explica el asterisco.') } catch {}

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
