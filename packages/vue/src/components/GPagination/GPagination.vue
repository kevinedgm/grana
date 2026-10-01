<script>
// GPagination · paginación de una colección (dueño: bruno)
// Contrato: design/contracts/pagination.md · Estilo: GPagination.css (coco) · Estructura: design/lab/table/r01/.
import { defineComponent, h, ref, computed, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { oneOf } from '../../utils/oneOf.js'
import { fill } from '../../utils/template.js'
import GIcon from '../GIcon/GIcon.vue'

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
    siblings: { type: Number, default: 1, validator: (v) => v >= 0 },
    responsive: { type: String, default: 'auto', validator: oneOf(['auto', 'full', 'compact']) },
    labels: { type: Object, default: () => ({}) }
  },
  emits: ['update:page'],
  setup(props, { emit }) {
    if (isDev && !props.labels.nav) console.warn('[Grana] <GPagination> necesita labels.nav (nombre de la navegación).')
    const root = ref(null)
    const width = ref(0)
    const space = ref(NaN)
    const pages = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)))
    const current = computed(() => Math.min(Math.max(1, props.page), pages.value))
    const items = computed(() => pageItems(current.value, pages.value, props.siblings))
    const compact = computed(() => {
      if (props.responsive !== 'auto') return props.responsive === 'compact'
      if (!width.value || Number.isNaN(space.value)) return false
      return width.value < (items.value.length + 4) * space.value * 9
    })

    let observer = null
    onMounted(() => {
      if (!root.value) return
      space.value = toPx(getComputedStyle(root.value).getPropertyValue('--g-space-1'))
      width.value = root.value.getBoundingClientRect().width
      if (typeof ResizeObserver !== 'undefined') {
        observer = new ResizeObserver((e) => { if (e[0]?.contentRect?.width) width.value = e[0].contentRect.width })
        observer.observe(root.value)
      }
    })
    onBeforeUnmount(() => observer && observer.disconnect())

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
      const from = props.total ? (current.value - 1) * props.pageSize + 1 : 0
      const to = Math.min(current.value * props.pageSize, props.total)
      const step = (dir) => h('button', {
        type: 'button',
        class: 'g-pagination__step',
        'aria-label': dir < 0 ? L.previous : L.next,
        disabled: dir < 0 ? current.value <= 1 : current.value >= pages.value,
        onClick: () => go(current.value + dir)
      }, [h(GIcon, { name: dir < 0 ? 'chevron-left' : 'chevron-right' })])
      return h('nav', { ref: root, class: ['g-pagination', { 'g-pagination--compact': compact.value }], 'aria-label': L.nav }, [
        h('span', { class: 'g-pagination__range', role: 'status' }, L.range ? fill(L.range, { from, to, total: props.total }) : `${from}–${to} / ${props.total}`),
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
