<script setup>
// GFormRow · fila de campos que van juntos (dueño: bruno)
// Contrato: design/contracts/form.md §4 (DECISIONS.md #173 a #176, #188) · Estilo: GFormRow.css (coco)
// Mide su ancho propio (un ResizeObserver compartido), reparte sus hijos en líneas contiguas en orden del DOM
// (formRowPlan.js) y escribe la colocación: en la raíz --_form-row-columns, --_form-row-rows y data-lines; en cada hijo
// --_form-row-column, --_form-row-line y data-line. Antes de medir, en SSR o sin ResizeObserver no escribe nada: el CSS
// pone un hijo por línea (nunca desborda).
import { computed, inject, onBeforeUnmount, onMounted, provide, ref, unref, watch } from 'vue'
import { oneOf } from '../../utils/oneOf.js'
import { formKey, isDev, layoutKey, spaceUnit } from '../GForm/formContext.js'
import { MAX_CHILDREN, SIZES, placement, planLines, sizeOf } from './formRowPlan.js'
import { knownWidth, observeRow, rowRoots, scheduleRow } from './rowEngine.js'

defineOptions({ name: 'GFormRow' })

const props = defineProps({
  keep: Boolean,
  density: { type: String, default: undefined, validator: oneOf(['default', 'comfortable', 'compact']) }
})

const form = inject(formKey, null)
const parent = inject(layoutKey, null)
const density = computed(() => props.density ?? unref(parent?.density) ?? unref(form?.density) ?? 'default')
const stack = computed(() => Boolean(unref(parent?.stack)) && !props.keep)

// Sub‑contexto: los campos de la fila llenan su sitio (block); readonly y disabled siguen los del contenedor
provide(layoutKey, { block: true, density, stack: parent?.stack, readonly: parent?.readonly, disabled: parent?.disabled })

const root = ref(null)
const columns = ref(null)
const rows = ref(null)
const lines = ref(null)

const NOT_ADMITTED = '.g-field-group, .g-checkbox-group, .g-checkbox, .g-switch, .g-datepicker--inline, .g-datepicker--split, .g-form-actions, .g-form-layout'

function readItems(kids, unit) {
  return kids.map((el) => {
    const { size } = sizeOf(el.classList)
    let own = 0
    if (typeof getComputedStyle === 'function') own = parseFloat(getComputedStyle(el).getPropertyValue('--g-form-min')) || 0
    const s = SIZES[size]
    return { w: s.weight, m: Math.max(s.min, own > 0 ? own : 0) * unit }
  })
}

function setIf(el, prop, value) {
  if (el.style.getPropertyValue(prop) !== value) el.style.setProperty(prop, value)
}

function run(width) {
  const el = root.value
  if (!el || !(width > 0)) return
  const kids = [...el.children]
  if (isDev) checkChildren(kids)
  if (!kids.length) return
  const cs = typeof getComputedStyle === 'function' ? getComputedStyle(el) : null
  const g = cs ? parseFloat(cs.getPropertyValue('--_form-row-gap')) || 0 : 0
  const items = readItems(kids, spaceUnit(el))
  const plan = placement(items, planLines(items, width, g, { keep: props.keep, stack: stack.value }), width, g)
  // Raíz: por Vue (se fusiona con el style del consumidor), solo si cambia
  if (columns.value !== plan.columns) columns.value = plan.columns
  if (rows.value !== plan.rows) rows.value = plan.rows
  if (lines.value !== plan.lines) lines.value = plan.lines
  // Hijos (contenido del slot): en el DOM, solo si cambia
  for (const k of plan.kids) {
    const kid = kids[k.index]
    setIf(kid, '--_form-row-column', k.column)
    setIf(kid, '--_form-row-line', k.row)
    if (kid.getAttribute('data-line') !== String(k.line)) kid.setAttribute('data-line', String(k.line))
  }
}

// ---------- Avisos de desarrollo (una vez por fila y por mensaje) ----------
const warned = new Set()
function warn(key, msg) {
  if (warned.has(key)) return
  warned.add(key)
  console.warn(`[Grana GFormRow] ${msg}`)
}
function checkChildren(kids) {
  if (kids.length > MAX_CHILDREN) warn('many', `tiene ${kids.length} hijos (más de ${MAX_CHILDREN}): divide la fila en filas por idea.`)
  const cs = typeof getComputedStyle === 'function' ? getComputedStyle : null
  for (const kid of kids) {
    const { all, unknown } = sizeOf(kid.classList)
    if (cs) {
      const order = cs(kid).order
      if (order && order !== '0') warn('order', 'un hijo tiene `order` distinto de 0: rompería orden del DOM = lectura = Tab = visual.')
    }
    if (all.length > 1) warn(`two-${all.join()}`, `un hijo tiene dos clases de tamaño (${all.join(', ')}).`)
    for (const u of unknown) warn(`unknown-${u}`, `clase de tamaño desconocida «${u}»: cuenta como g-form-w-md${u === 'g-form-w-full' ? ' (g-form-w-full se retiró en r02: un campo suelto ya ocupa el ancho entero)' : ''}.`)
    if (kids.length > 1 && (kid.matches(NOT_ADMITTED) || rowRoots.has(kid))) {
      warn(`not-admitted-${kid.className}`, `«${kid.className.split(' ')[0]}» no comparte línea: va en su propia fila (hijo directo de GFormLayout).`)
    }
    const raw = kid.style ? kid.style.getPropertyValue('--g-form-min').trim() : ''
    if (raw && !(Number(raw) > 0)) warn(`min-${raw}`, `--g-form-min debe ser un número positivo (múltiplos de space), no «${raw}».`)
  }
  if (kids.length === 1) {
    const { size } = sizeOf(kids[0].classList)
    if (size === 'xs' || size === 'sm') warn('alone', 'un campo compacto solo en su fila ocupa el ancho entero: agrúpalo con los campos que lo acompañan.')
  }
}

// ---------- Ciclo de vida ----------
let stop = null
let mo = null
onMounted(() => {
  const el = root.value
  if (!el) return
  rowRoots.add(el)
  if (isDev) checkChildren([...el.children])
  stop = observeRow(el, run)
  // Hijos o sus clases/estilos cambian (v-if, g-form-w-*, --g-form-min): se recalcula con el último ancho medido
  if (typeof MutationObserver !== 'undefined') {
    mo = new MutationObserver((records) => {
      const relevant = records.some((r) => r.target === el || (r.type === 'attributes' && r.target.parentElement === el))
      if (relevant && knownWidth(el)) scheduleRow(el)
    })
    mo.observe(el, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style'] })
  }
})
watch([() => props.keep, stack, density], () => { if (root.value && knownWidth(root.value)) scheduleRow(root.value) })
onBeforeUnmount(() => {
  stop?.()
  mo?.disconnect()
})

const classes = computed(() => ['g-form-row', `g-form-row--density-${density.value}`, { 'g-form-row--keep': props.keep }])
const style = computed(() => (columns.value ? { '--_form-row-columns': columns.value, '--_form-row-rows': rows.value } : undefined))
</script>

<template>
  <div ref="root" :class="classes" :style="style" :data-lines="lines ?? undefined"><slot /></div>
</template>
