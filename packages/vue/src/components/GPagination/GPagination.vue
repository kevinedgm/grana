<script>
// GPagination · paginación de una colección (dueño: bruno)
// Contrato: design/contracts/pagination.md · Estilo: GPagination.css (coco) · Estructura: design/lab/table/r01/ y
// design/lab/pagination/r02/ (B «Pie que acompaña»: filas por página como radios nativos, #592 a #596).
import { defineComponent, h, ref, computed, watch, nextTick, onMounted, onBeforeUnmount, inject, useId } from 'vue'
import { oneOf } from '../../utils/oneOf.js'
import { fill } from '../../utils/template.js'
import { useKeyFocus } from '../../utils/keyFocus.js'
import { pagerKey, pageSizeList } from '../../utils/tablePager.js'
import GIcon from '../GIcon/GLibIcon.js'

const isDev = typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production'
const toPx = (value) => {
  const n = parseFloat(value)
  if (Number.isNaN(n)) return NaN
  if (/rem\s*$|em\s*$/.test(value)) return n * parseFloat(getComputedStyle(document.documentElement).fontSize)
  return n
}

/** Páginas visibles: primera, última, la actual y `siblings` a cada lado; null = salto (elipsis) */
export function pageItems(page, pages, siblings) {
  if (pages <= 0) return []
  const set = new Set([1, pages])
  for (let p = page - siblings; p <= page + siblings; p++) if (p >= 1 && p <= pages) set.add(p)
  const sorted = [...set].sort((a, b) => a - b)
  const out = []
  sorted.forEach((p, i) => {
    if (i > 0) {
      const gap = p - sorted[i - 1]
      if (gap === 2) out.push(p - 1)          // un solo hueco: se muestra la página, no una elipsis
      else if (gap > 2) out.push(null)
    }
    out.push(p)
  })
  return out
}

export default defineComponent({
  name: 'GPagination',
  props: {
    page: { type: Number, default: 1 },
    total: { type: Number, default: 0 },
    pageSize: { type: Number, default: 10, validator: (v) => v >= 1 },
    pageSizes: { type: Array, default: undefined },
    siblings: { type: Number, default: 1, validator: (v) => v >= 0 },
    responsive: { type: String, default: 'auto', validator: oneOf(['auto', 'full', 'compact']) },
    labels: { type: Object, default: () => ({}) }
  },
  emits: ['update:pageSize', 'update:page'],
  setup(props, { emit }) {
    if (isDev && !props.labels.nav) console.warn('[Grana] <GPagination> necesita labels.nav (nombre de la navegación).')
    const root = ref(null)
    const width = ref(0)
    const space = ref(NaN)
    // Contexto interno de GTable (#594): ancla, acople y anuncio del rango. Sola, null
    const table = inject(pagerKey, null)
    const uid = useId()
    // Tamaño: espejo de la prop (sin v-model, el radio marcado sigue siendo el real)
    const sizeState = ref(props.pageSize)
    watch(() => props.pageSize, (v) => { sizeState.value = v })
    const warned = new Set()
    const warnOnce = (id, msg) => {
      if (!isDev || warned.has(id)) return
      warned.add(id)
      console.warn(`[Grana] <GPagination> ${msg}`)
    }
    // Lista depurada y ordenada; un pageSize fuera de ella se añade en su orden (WCAG 4.1.2)
    const sizeList = computed(() => pageSizeList(props.pageSizes, sizeState.value))
    const sizes = computed(() => sizeList.value.sizes)
    watch(sizeList, (l) => {
      if (l.dropped) warnOnce('sizes', 'pageSizes con valores repetidos o no válidos (enteros ≥ 1): se han depurado.')
      if (l.added) warnOnce('outside', `pageSize ${sizeState.value} no está en pageSizes: se ha añadido a la lista.`)
      if (l.sizes.length && !props.labels.pageSize && !table) warnOnce('label', 'con pageSizes: define labels.pageSize (nombre del selector de filas por página).')
    }, { immediate: true })
    const keyFocus = useKeyFocus(() => sizes.value.length > 0)
    const pages = computed(() => Math.max(1, Math.ceil(props.total / sizeState.value)))
    const current = computed(() => Math.min(Math.max(1, props.page), pages.value))
    const items = computed(() => pageItems(current.value, pages.value, props.siblings))
    const compact = computed(() => {
      if (props.responsive !== 'auto') return props.responsive === 'compact'
      if (!width.value || Number.isNaN(space.value)) return false
      return width.value < (items.value.length + 4) * space.value * 9
    })

    let observer = null
    let frame = 0
    let pending = 0
    const raf = (f) => (typeof requestAnimationFrame === 'function' ? requestAnimationFrame(f) : setTimeout(f, 16))
    const caf = (id) => (typeof cancelAnimationFrame === 'function' ? cancelAnimationFrame(id) : clearTimeout(id))
    onMounted(() => {
      if (!root.value) return
      space.value = toPx(getComputedStyle(root.value).getPropertyValue('--g-space-1'))
      width.value = root.value.getBoundingClientRect().width
      if (typeof ResizeObserver !== 'undefined') {
        // La escritura va al cuadro siguiente y solo si cambia: dentro de la devolución, WebKit avisa «ResizeObserver loop completed» (#169)
        observer = new ResizeObserver((e) => {
          const w = e[e.length - 1]?.contentRect?.width
          if (!w) return
          pending = w
          if (frame) return
          frame = raf(() => {
            frame = 0
            if (pending && pending !== width.value) width.value = pending
            pending = 0
          })
        })
        observer.observe(root.value)
      }
    })
    onBeforeUnmount(() => { if (observer) observer.disconnect(); if (frame) caf(frame) })

    // Cambio de tamaño (#594): página = ⌊índice del ancla ÷ tamaño nuevo⌋ + 1. Sola, el ancla es la primera fila de la página;
    // dentro de GTable, la decide la tabla (se pide UNA vez). update:pageSize y después update:page, síncronos en el mismo
    // manejador. El foco se queda en el radio (los radios no se recrean)
    const choose = (n) => {
      if (!Number.isInteger(n) || n === sizeState.value) return
      const a = table && typeof table.anchor === 'function' ? table.anchor() : null
      const index = a && Number.isFinite(a.index) ? a.index : (current.value - 1) * sizeState.value
      const next = Math.floor(Math.max(0, index) / n) + 1
      const before = current.value
      sizeState.value = n
      emit('update:pageSize', n)
      if (next !== before) emit('update:page', next)
    }

    const go = (p) => {
      if (p < 1 || p > pages.value || p === current.value) return
      const hadFocus = root.value?.contains(document.activeElement)
      emit('update:page', p)
      // Tras cambiar, el foco va a la página actual (o se queda en el control si sigue existiendo)
      nextTick(() => {
        if (!hadFocus || !root.value || root.value.contains(document.activeElement) && !document.activeElement.disabled) return
        root.value.querySelector('[aria-current="page"]')?.focus()
      })
    }

    return () => {
      const L = props.labels
      const size = sizeState.value
      const from = props.total ? (current.value - 1) * size + 1 : 0
      const to = Math.min(current.value * size, props.total)
      const step = (dir) => h('button', {
        type: 'button',
        class: 'g-pagination__step',
        'aria-label': dir < 0 ? L.previous : L.next,
        disabled: dir < 0 ? current.value <= 1 : current.value >= pages.value,
        onClick: () => go(current.value + dir)
      }, [h(GIcon, { name: dir < 0 ? 'chevron-left' : 'chevron-right' })])
      // Dentro de GTable con labels.range, la tabla anuncia el rango: el del pie va sin role="status" (#596)
      const range = h('span', { class: 'g-pagination__range', role: table && table.announcesRange ? undefined : 'status' }, L.range ? fill(L.range, { from, to, total: props.total }) : `${from}–${to} / ${props.total}`)
      const name = `${uid}-size`
      const list = sizes.value
      return h('nav', {
        ref: root,
        class: ['g-pagination', { 'g-pagination--compact': compact.value, 'g-pagination--dock': Boolean(table && table.dock), 'is-stuck': Boolean(table && table.dock && table.stuck) }],
        'aria-label': L.nav
      }, [
        list.length
          ? h('div', { class: 'g-pagination__meta' }, [
              h('div', { class: 'g-pagination__size', role: 'radiogroup', 'aria-labelledby': `${uid}-size-label` }, [
                h('span', { class: 'g-pagination__size-label', id: `${uid}-size-label` }, L.pageSize),
                h('span', { class: 'g-pagination__sizes' }, list.map((n) => h('label', { class: 'g-pagination__size-option', key: n }, [
                  h('input', {
                    class: 'g-pagination__size-input', type: 'radio', name, value: String(n), checked: n === size,
                    onChange: () => choose(n), onFocus: keyFocus.onFocus, onBlur: keyFocus.onBlur
                  }),
                  h('span', { class: 'g-pagination__size-text' }, String(n))
                ])))
              ]),
              range
            ])
          : range,
        h('div', { class: 'g-pagination__controls' }, [
          step(-1),
          h('ol', { class: 'g-pagination__pages' }, items.value.map((p, i) => h('li', { key: p ?? `gap-${i}` }, [
            p === null
              ? h('span', { class: 'g-pagination__ellipsis', 'aria-hidden': 'true' }, '…')
              : h('button', {
                type: 'button',
                class: 'g-pagination__page',
                'aria-current': p === current.value ? 'page' : undefined,
                'aria-label': L.page ? fill(L.page, { page: p }) : undefined,
                onClick: () => go(p)
              }, String(p))
          ]))),
          compact.value ? h('span', { class: 'g-pagination__compact' }, L.compact ? fill(L.compact, { page: current.value, pages: pages.value }) : `${current.value} / ${pages.value}`) : null,
          step(1)
        ])
      ])
    }
  }
})
</script>
