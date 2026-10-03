<script setup>
// GFormReveal · bloque condicional de un formulario (Fase 3) (dueño: bruno)
// Contrato: design/contracts/form.md §14 y §2 «Registro inactivo» (DECISIONS.md #274 a #280) · Estructura:
// design/lab/form-reveal/r01/ (kiwi) · Estilo: GFormReveal.css (coco)
// Raíz <div> sin rol (rejilla 0fr → 1fr, inert cerrado) + cuerpo <fieldset role="none"> (disabled cerrado: fuera de
// FormData y de la validación nativa). El contenido NUNCA se desmonta (conserva lo escrito, WCAG 3.3.7). Sin eventos:
// la aplicación ya sabe cuándo cambia `when`; quien necesite el final de la animación escucha `transitionend` nativo.
import { computed, inject, nextTick, onBeforeUnmount, onMounted, provide, ref, unref, watch } from 'vue'
import { formKey, isDev, layoutKey, nextFrame, revealKey } from '../GForm/formContext.js'
import { rowRoots } from '../GFormRow/rowEngine.js'
import { observeParent, rowGapOf } from './revealGap.js'

defineOptions({ name: 'GFormReveal' })

const props = defineProps({
  when: { type: Boolean, default: false }
})

const form = inject(formKey, null)
const layout = inject(layoutKey, null)
const parentReveal = inject(revealKey, null)

// Activo = when y todos sus bloques ancestros activos (un anidado conserva su is-open dentro de un padre cerrado)
const active = computed(() => props.when && (parentReveal ? Boolean(unref(parentReveal.active)) : true))
provide(revealKey, { active })

// Pila como GFormLayout (#278): densidad del sub‑contexto de distribución › GForm › default; re‑provee layoutKey
const density = computed(() => unref(layout?.density) ?? unref(form?.density) ?? 'default')
provide(layoutKey, { block: true, density, stack: layout?.stack, readonly: layout?.readonly, disabled: layout?.disabled })

const root = ref(null)
const animating = ref(false)
const ready = ref(false) // tras el primer pintado: sin transición al montar (plan 012)
const gap = ref(null) // px del row-gap del padre; null hasta montar (SSR: sin variable en línea)

// ---------- Separación del contenedor (--_reveal-gap) ----------
function readGap() {
  const p = root.value && root.value.parentElement
  if (!p) return
  const g = rowGapOf(p)
  if (gap.value !== g) gap.value = g
}

// ---------- Fase is-animating ----------
let timer = null
function settle() {
  clearTimeout(timer)
  timer = null
  if (animating.value) animating.value = false
}
/** Mayor duration + delay de las transiciones calculadas de la raíz, en ms. */
function longest(el) {
  if (!el || typeof getComputedStyle !== 'function') return 0
  const cs = getComputedStyle(el)
  const ms = (v) => {
    const t = String(v).trim()
    const n = parseFloat(t)
    if (!Number.isFinite(n)) return 0
    return /ms$/.test(t) ? n : n * 1000
  }
  const d = String(cs.transitionDuration || '').split(',').map(ms)
  const l = String(cs.transitionDelay || '').split(',').map(ms)
  let max = 0
  d.forEach((x, i) => { max = Math.max(max, x + (l.length ? l[i % l.length] : 0)) })
  return max
}
function onTransitionend(event) {
  if (event.target === event.currentTarget && event.propertyName === 'grid-template-rows') settle()
}

// ---------- Foco al cerrar con el foco dentro (#275; WCAG 2.4.3: nunca a <body>) ----------
const FOCUSABLE = 'input:not([type="hidden"]),select,textarea,button,a[href],[tabindex],[contenteditable=""],[contenteditable="true"]'
function candidate(el, rootEl) {
  if (rootEl.contains(el)) return false
  if (el.getAttribute('tabindex') === '-1') return false
  try { if (el.matches(':disabled')) return false } catch { if (el.disabled) return false }
  if (el.closest('[inert]')) return false
  return typeof el.getClientRects === 'function' && el.getClientRects().length > 0
}
function focusTarget(rootEl) {
  const all = [...document.querySelectorAll(FOCUSABLE)].filter((el) => candidate(el, rootEl))
  let prev = null
  let next = null
  for (const el of all) {
    const pos = rootEl.compareDocumentPosition(el)
    if (pos & 2 /* PRECEDING */) prev = el
    else if (pos & 4 /* FOLLOWING */ && !next) next = el
  }
  let el = prev || next
  // Grupo de radios: la opción elegida (mismo name y mismo formulario), si la hay
  if (el && el.tagName === 'INPUT' && el.type === 'radio' && el.name) {
    const scope = el.form || document
    const chosen = [...scope.querySelectorAll('input[type="radio"]')].find((r) => r.name === el.name && r.form === el.form && r.checked && candidate(r, rootEl))
    if (chosen) el = chosen
  }
  return el
}

// Antes de aplicar inert y disabled (flush 'pre': antes de que Vue actualice el DOM y antes de pintar)
watch(() => props.when, (v) => {
  const el = root.value
  if (!el) return
  readGap()
  if (!v && typeof document !== 'undefined' && el.contains(document.activeElement)) {
    const t = focusTarget(el)
    if (t && typeof t.focus === 'function') t.focus({ preventScroll: true })
  }
  animating.value = true
  clearTimeout(timer)
  // Respaldo del transitionend (una transición de 0s no lo emite: movimiento reducido): con el DOM ya actualizado
  nextTick(() => {
    clearTimeout(timer)
    timer = setTimeout(settle, longest(root.value) + 50)
  })
})

// ---------- Avisos de desarrollo (#279; una vez por instancia, al montar) ----------
function check(el) {
  const warn = (m) => console.warn(`[Grana GFormReveal] ${m}`)
  const p = el.parentElement
  // La fila se registra en rowRoots en su propio onMounted, que llega después del de sus hijos: también por la clase
  if (p && (rowRoots.has(p) || p.classList.contains('g-form-row'))) warn('va dentro de una GFormRow: ocupa su propia fila y contiene filas; colócalo después de la fila de la pregunta.')
  if (!el.previousElementSibling) warn('no tiene hermano anterior: debe ir justo después de la pregunta que lo condiciona.')
}

let stopObserve = null
onMounted(() => {
  const el = root.value
  if (!el) return
  readGap()
  stopObserve = observeParent(el.parentElement, readGap)
  nextFrame(() => nextFrame(() => { ready.value = true }))
  if (isDev) check(el)
})
onBeforeUnmount(() => {
  stopObserve?.()
  clearTimeout(timer)
})

const classes = computed(() => [
  'g-form-reveal',
  `g-form-reveal--density-${density.value}`,
  { 'is-open': props.when, 'is-animating': animating.value, 'is-ready': ready.value }
])
const style = computed(() => (gap.value === null ? undefined : { '--_reveal-gap': `${gap.value}px` }))
</script>

<template>
  <div ref="root" :class="classes" :style="style" :inert="when ? undefined : ''" @transitionend="onTransitionend">
    <fieldset class="g-form-reveal__body" role="none" :disabled="!when"><slot /></fieldset>
  </div>
</template>
