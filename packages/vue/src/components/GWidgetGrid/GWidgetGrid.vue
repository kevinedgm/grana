<script>
// GWidgetGrid · rejilla del dashboard (dueño: bruno)
// Contrato: design/contracts/widget-grid.md · Estructura: design/lab/widget/r01/ · Estilo: GWidgetGrid.css (coco)
// El layout es un dato ([{ id, w, h }]): la posición se deriva del orden. Se previsualiza un movimiento (puntero o
// teclado) y se emite al confirmar; si el prop no se actualiza, la rejilla vuelve al valor del prop. El orden visual se
// da con `order` mientras dura el movimiento; al confirmar, el DOM sigue al layout (el foco se restaura).
import { computed, defineComponent, h, nextTick, onBeforeUnmount, onBeforeUpdate, onMounted, onUpdated, provide, ref, useAttrs, useSlots, watch } from 'vue'
import { oneOf } from '../../utils/oneOf.js'
import GIcon from '../GIcon/GIcon.vue'
import { GRID_KEY, ITEM_KEY } from '../../utils/widgetContext.js'

const isDev = typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production'
const DEFAULT_PRESETS = [{ id: 's', w: 1, h: 1 }, { id: 'm', w: 2, h: 1 }, { id: 'l', w: 2, h: 2 }, { id: 'wide', w: 4, h: 1 }, { id: 'tall', w: 1, h: 2 }]
const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
const fill = (tpl, vars) => (typeof tpl === 'string' ? tpl.replace(/\{(title|position|count|columns|rows)\}/g, (_, k) => String(vars[k] ?? '')) : '')

// Envoltorio de cada celda: da su id a los widgets de dentro (provide/inject)
const GridItem = defineComponent({
  name: 'GWidgetGridItem',
  props: { id: { type: [String, Number], required: true } },
  setup(props, { slots }) {
    provide(ITEM_KEY, { get id() { return props.id } })
    return () => slots.default?.()
  }
})

export default defineComponent({
  name: 'GWidgetGrid',
  inheritAttrs: false,
  props: {
    modelValue: { type: Array, default: () => [] },
    label: { type: String, default: undefined },
    editable: Boolean,
    columns: { type: Number, default: undefined, validator: (v) => Number.isInteger(v) && v >= 1 && v <= 4 },
    maxColumns: { type: Number, default: 4, validator: (v) => Number.isInteger(v) && v >= 1 && v <= 4 },
    maxRows: { type: Number, default: 4, validator: (v) => Number.isInteger(v) && v >= 1 && v <= 6 },
    presets: { type: Array, default: () => DEFAULT_PRESETS },
    labels: { type: Object, default: () => ({}) },
    density: { type: String, default: 'default', validator: oneOf(['default', 'comfortable', 'compact']) }
  },
  emits: ['update:modelValue', 'change', 'remove-request'],
  setup(props, { emit, slots, expose }) {
    const attrs = useAttrs()
    const useSlotsRef = useSlots()
    const L = computed(() => props.labels || {})
    const warned = new Set()
    const warnOnce = (key, msg) => {
      if (!isDev || warned.has(key)) return
      warned.add(key)
      console.warn(`[Grana] <GWidgetGrid> ${msg}`)
    }

    // ---------- Layout ----------
    const base = computed(() => {
      const seen = new Set()
      const out = []
      for (const e of props.modelValue) {
        if (!e || typeof e !== 'object' || e.id === undefined || e.id === null || !Number.isInteger(e.w) || e.w < 1 || !Number.isInteger(e.h) || e.h < 1) {
          warnOnce('bad', 'una entrada del layout sin id o con w/h inválidos se ignora.')
          continue
        }
        if (seen.has(e.id)) { warnOnce(`dup-${e.id}`, `hay dos entradas con el mismo id (${String(e.id)}).`); continue }
        seen.add(e.id)
        out.push({ ...e })
      }
      return out
    })
    const preview = ref(null)
    const eff = computed(() => preview.value ?? base.value)
    const count = computed(() => eff.value.length)
    const indexOf = (id) => eff.value.findIndex((e) => e.id === id)

    // ---------- Columnas por el ancho de la propia rejilla ----------
    const rootEl = ref(null)
    const listEl = ref(null)
    const width = ref(0)
    const unit = ref(4)
    let ro = null
    const measure = () => {
      if (!rootEl.value) return
      const v = typeof getComputedStyle !== 'undefined' ? getComputedStyle(rootEl.value).getPropertyValue('--g-space-1').trim() : ''
      const n = parseFloat(v)
      if (n) unit.value = v.endsWith('rem') ? n * (parseFloat(getComputedStyle(document.documentElement).fontSize) || 16) : n
      width.value = rootEl.value.getBoundingClientRect().width
    }
    const cols = computed(() => {
      if (props.columns) return props.columns
      if (!width.value) return 4
      if (width.value >= unit.value * 240) return 4
      if (width.value >= unit.value * 140) return 2
      return 1
    })
    const maxSpan = computed(() => Math.min(cols.value, props.maxColumns))
    const spanOf = (e) => Math.min(e.w, maxSpan.value)
    const rowsOf = (e) => Math.min(e.h, props.maxRows)

    // ---------- Títulos y menús que registran los widgets de las celdas ----------
    const tick = ref(0)
    const titles = {}
    const menus = {}
    const registerTitle = (id, t) => {
      if (titles[id] === t) return
      titles[id] = t
      Promise.resolve().then(() => { tick.value++ })
    }
    const registerMenu = (id, getter) => { menus[id] = getter }
    const titleOf = (id) => titles[id] ?? base.value.find((e) => e.id === id)?.title ?? String(id)

    // ---------- Anuncios ----------
    const live = ref('')
    const announce = (key, vars) => {
      const tpl = L.value[key]
      if (!tpl) return
      const text = fill(tpl, vars)
      live.value = ''
      nextTick(() => { live.value = text })
    }
    const posVars = (id) => ({ title: titleOf(id), position: indexOf(id) + 1, count: count.value })
    const sizeVars = (e) => ({ title: titleOf(e.id), columns: spanOf(e), rows: rowsOf(e) })

    // ---------- Confirmar ----------
    const emitLayout = (next, reason, id) => {
      emit('update:modelValue', next)
      emit('change', { layout: next, reason, id })
      preview.value = null
    }
    const itemEl = (id) => [...(rootEl.value?.querySelectorAll('.g-widget-grid__item') ?? [])].find((li) => li.dataset.id === String(id)) || null
    const focusHandle = (id, what = 'grab') => {
      nextTick(() => nextTick(() => itemEl(id)?.querySelector(`.g-widget-grid__${what}`)?.focus()))
    }
    const focusMenu = (id) => nextTick(() => nextTick(() => menus[id]?.()?.focus()))

    // ---------- Mover ----------
    const movePreview = (id, delta) => {
      const arr = (preview.value ?? base.value).map((e) => ({ ...e }))
      const i = arr.findIndex((e) => e.id === id)
      const j = clamp(i + delta, 0, arr.length - 1)
      if (i < 0 || i === j) return false
      const [it] = arr.splice(i, 1)
      arr.splice(j, 0, it)
      preview.value = arr
      return true
    }
    const sameOrder = (a, b) => a.length === b.length && a.every((e, i) => e.id === b[i].id)
    const commitMove = (id) => {
      const next = preview.value
      if (next && !sameOrder(next, base.value)) { emitLayout(next, 'move', id); return next }
      preview.value = null
      return null
    }

    const grab = ref(null)
    const drag = ref(null)

    const onGrabKeydown = (e, id) => {
      const k = e.key
      if (k === ' ' || k === 'Enter') {
        e.preventDefault()
        if (!grab.value) {
          grab.value = { id, from: indexOf(id) }
          announce('grabbed', posVars(id))
        } else {
          grab.value = null
          const done = commitMove(id)
          announce('dropped', { title: titleOf(id), position: (done ?? base.value).findIndex((x) => x.id === id) + 1, count: count.value })
          focusHandle(id)
        }
      } else if (grab.value && grab.value.id === id && ['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown'].includes(k)) {
        e.preventDefault()
        const d = k === 'ArrowLeft' || k === 'ArrowUp' ? -1 : 1
        const moved = movePreview(id, d)
        if (moved) announce('moved', posVars(id))
      } else if (grab.value && grab.value.id === id && k === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        grab.value = null
        preview.value = null
        announce('cancelled', { title: titleOf(id), position: indexOf(id) + 1, count: count.value })
        focusHandle(id)
      }
    }
    const onGrabBlur = (e, id) => {
      // Perder el foco hacia otro elemento cancela el movimiento recogido con el teclado
      if (grab.value && grab.value.id === id && e.relatedTarget && !itemEl(id)?.contains(e.relatedTarget)) {
        grab.value = null
        preview.value = null
      }
    }
    const onGrabPointerdown = (e, id) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return
      e.preventDefault()
      drag.value = { id }
      try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* sin puntero real */ }
      const move = (ev) => {
        const t = document.elementFromPoint(ev.clientX, ev.clientY)?.closest?.('.g-widget-grid__item')
        if (!t) return
        const tid = base.value.find((x) => String(x.id) === t.dataset.id)?.id
        if (tid === undefined || tid === id) return
        const arr = preview.value ?? base.value
        const from = arr.findIndex((x) => x.id === id)
        const to = arr.findIndex((x) => x.id === tid)
        if (from >= 0 && to >= 0 && from !== to) movePreview(id, to - from)
      }
      const up = () => {
        window.removeEventListener('pointermove', move)
        window.removeEventListener('pointerup', up)
        window.removeEventListener('pointercancel', up)
        drag.value = null
        const moved = commitMove(id)
        if (moved) announce('dropped', { title: titleOf(id), position: moved.findIndex((x) => x.id === id) + 1, count: count.value })
      }
      window.addEventListener('pointermove', move)
      window.addEventListener('pointerup', up)
      window.addEventListener('pointercancel', up)
    }

    // ---------- Redimensionar ----------
    const setSize = (id, w, hh, commit) => {
      const arr = (preview.value ?? base.value).map((e) => ({ ...e }))
      const it = arr.find((e) => e.id === id)
      if (!it) return false
      const nw = clamp(w, 1, maxSpan.value)
      const nh = clamp(hh, 1, props.maxRows)
      if (spanOf(it) === nw && rowsOf(it) === nh && it.w === nw && it.h === nh) return false
      it.w = nw
      it.h = nh
      if (commit) emitLayout(arr, 'resize', id)
      else preview.value = arr
      return true
    }
    const onResizeKeydown = (e, id) => {
      const m = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowDown: [0, 1], ArrowUp: [0, -1] }[e.key]
      if (!m) return
      e.preventDefault()
      const it = eff.value.find((x) => x.id === id)
      if (!it) return
      if (setSize(id, spanOf(it) + m[0], rowsOf(it) + m[1], true)) {
        const next = base.value.find((x) => x.id === id) || it
        announce('resized', sizeVars({ ...next, w: clamp(spanOf(it) + m[0], 1, maxSpan.value), h: clamp(rowsOf(it) + m[1], 1, props.maxRows) }))
      }
    }
    const onResizePointerdown = (e, id) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return
      e.preventDefault()
      const it = eff.value.find((x) => x.id === id)
      const ul = listEl.value
      if (!it || !ul) return
      const cs = getComputedStyle(ul)
      const gap = parseFloat(cs.columnGap) || 0
      const rowH = (parseFloat(cs.gridAutoRows) || 0) + (parseFloat(cs.rowGap) || 0)
      const colW = (ul.clientWidth - gap * (cols.value - 1)) / cols.value + gap
      const rtl = cs.direction === 'rtl'
      const w0 = spanOf(it)
      const h0 = rowsOf(it)
      const x0 = e.clientX
      const y0 = e.clientY
      try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* sin puntero real */ }
      const move = (ev) => {
        const dx = (rtl ? -1 : 1) * (ev.clientX - x0)
        const dy = ev.clientY - y0
        setSize(id, w0 + Math.round(dx / (colW || 1)), h0 + Math.round(dy / (rowH || 1)), false)
      }
      const up = () => {
        window.removeEventListener('pointermove', move)
        window.removeEventListener('pointerup', up)
        window.removeEventListener('pointercancel', up)
        const next = preview.value
        if (next) {
          const it2 = next.find((x) => x.id === id)
          const vars = sizeVars(it2)
          emitLayout(next, 'resize', id)
          announce('resized', vars)
        }
      }
      window.addEventListener('pointermove', move)
      window.addEventListener('pointerup', up)
      window.addEventListener('pointercancel', up)
    }

    // ---------- Acciones del menú de cada widget ----------
    let pendingRemoval = null
    const run = (id, action) => {
      if (action === 'before' || action === 'after') {
        movePreview(id, action === 'before' ? -1 : 1)
        const moved = commitMove(id)
        if (moved) announce('moved', { title: titleOf(id), position: moved.findIndex((x) => x.id === id) + 1, count: count.value })
        focusMenu(id)
      } else if (action.startsWith('size:')) {
        const p = props.presets.find((x) => x.id === action.slice(5))
        if (!p) return
        setSize(id, p.w, p.h, true)
        announce('resized', sizeVars({ id, w: clamp(p.w, 1, maxSpan.value), h: clamp(p.h, 1, props.maxRows) }))
        focusMenu(id)
      } else if (action === 'remove') {
        pendingRemoval = { id, index: indexOf(id), title: titleOf(id) }
        emit('remove-request', { id })
      }
    }
    watch(base, (b) => {
      if (!pendingRemoval || b.some((e) => e.id === pendingRemoval.id)) return
      const { index, title } = pendingRemoval
      pendingRemoval = null
      announce('removed', { title, position: index + 1, count: b.length })
      const next = b[Math.min(index, b.length - 1)]
      if (next) focusMenu(next.id)
    })

    // ---------- Animación del reordenamiento (FLIP) ----------
    // Antes de pintar se guardan las posiciones; después se anima cada celda desde su sitio anterior al nuevo con la
    // Web Animations API. Duración y curva salen de los tokens (--g-duration-press, --g-ease-out); se omite con
    // prefers-reduced-motion, sin API de animación o sin duración legible.
    let firstRects = null
    const itemEls = () => (listEl.value ? [...listEl.value.children].filter((n) => n.dataset && n.dataset.id !== undefined) : [])
    onBeforeUpdate(() => {
      firstRects = new Map(itemEls().map((el) => [el.dataset.id, el.getBoundingClientRect()]))
    })
    onUpdated(() => {
      const before = firstRects
      firstRects = null
      if (!before || typeof window === 'undefined' || typeof window.matchMedia === 'undefined') return
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
      const cs = getComputedStyle(rootEl.value)
      const raw = cs.getPropertyValue('--g-duration-press').trim()
      const ms = raw.endsWith('ms') ? parseFloat(raw) : raw.endsWith('s') ? parseFloat(raw) * 1000 : NaN
      const easing = cs.getPropertyValue('--g-ease-out').trim() || 'ease-out'
      if (!(ms > 0)) return
      for (const el of itemEls()) {
        if (typeof el.animate !== 'function') return
        const from = before.get(el.dataset.id)
        if (!from) continue
        const to = el.getBoundingClientRect()
        const dx = from.left - to.left
        const dy = from.top - to.top
        if (!dx && !dy) continue
        el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: ms, easing })
      }
    })

    // ---------- Contexto para los widgets ----------
    provide(GRID_KEY, {
      editing: computed(() => props.editable),
      labels: L,
      presets: computed(() => props.presets),
      count,
      indexOf,
      sizeOf: (id) => { const e = base.value.find((x) => x.id === id); return e ? { w: e.w, h: e.h } : null },
      registerTitle,
      registerMenu,
      run
    })

    onMounted(() => {
      measure()
      if (typeof ResizeObserver !== 'undefined') {
        ro = new ResizeObserver(() => measure())
        ro.observe(rootEl.value)
      }
      tick.value++
    })
    onBeforeUnmount(() => ro?.disconnect())

    // ---------- Avisos de desarrollo ----------
    if (isDev) {
      if (!props.label && !attrs['aria-label']) warnOnce('label', 'necesita label (nombre accesible de la lista).')
      if (!useSlotsRef.item) warnOnce('item', 'necesita el slot item (el contenido de cada celda).')
      if (props.editable && (!L.value.grab || !L.value.resize)) warnOnce('labels', 'con editable necesita labels.grab y labels.resize.')
    }

    expose({ focusMenu, focusHandle })

    // ---------- Render ----------
    const cls = (...a) => a.filter(Boolean).join(' ')
    return () => {
      void tick.value
      const { class: klass, ...rest } = attrs
      const layout = base.value
      const items = layout.map((e) => {
        const idx = indexOf(e.id)
        const i = idx < 0 ? layout.indexOf(e) : idx
        const isHeld = grab.value?.id === e.id
        const isDrag = drag.value?.id === e.id
        const eff1 = eff.value.find((x) => x.id === e.id) || e
        const vars = { title: titleOf(e.id), position: i + 1, count: count.value, columns: spanOf(eff1), rows: rowsOf(eff1) }
        const controls = props.editable
          ? [
              h('div', { class: 'g-widget-grid__controls', key: 'c' }, [
                h('button', {
                  type: 'button',
                  class: 'g-widget-grid__grab',
                  'aria-roledescription': L.value.grabRole || undefined,
                  'aria-pressed': isHeld ? 'true' : 'false',
                  'aria-label': fill(L.value.grab, vars),
                  onKeydown: (ev) => onGrabKeydown(ev, e.id),
                  onBlur: (ev) => onGrabBlur(ev, e.id),
                  onPointerdown: (ev) => onGrabPointerdown(ev, e.id)
                }, [h(GIcon, { name: 'grip-vertical' })])
              ]),
              h('button', {
                type: 'button',
                class: 'g-widget-grid__resize',
                key: 'r',
                'aria-label': fill(L.value.resize, vars),
                onKeydown: (ev) => onResizeKeydown(ev, e.id),
                onPointerdown: (ev) => onResizePointerdown(ev, e.id)
              }, [h(GIcon, { name: 'move-diagonal-2' })])
            ]
          : []
        return h('li', {
          key: e.id,
          class: cls('g-widget-grid__item', isHeld && 'is-grabbed', isDrag && 'is-dragging'),
          'data-id': String(e.id),
          style: { gridColumn: `span ${spanOf(eff1)}`, gridRow: `span ${rowsOf(eff1)}`, order: i }
        }, [
          h(GridItem, { id: e.id }, { default: () => slots.item?.({ id: e.id, index: i, count: count.value, editing: props.editable }) }),
          ...controls
        ])
      })
      return h('div', {
        ...rest,
        ref: rootEl,
        class: cls('g-widget-grid', `g-widget-grid--density-${props.density}`, props.editable && 'is-editing', klass)
      }, [
        layout.length
          ? h('ul', { ref: listEl, class: 'g-widget-grid__list', role: 'list', 'aria-label': props.label || attrs['aria-label'], style: { '--_cols': cols.value } }, items)
          : h('div', { class: 'g-widget-grid__empty' }, slots.empty ? slots.empty() : L.value.empty),
        h('div', { class: 'g-widget-grid__sr', role: 'status', 'aria-live': 'polite' }, live.value)
      ])
    }
  }
})
</script>
