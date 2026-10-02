<script>
// GWidget · carcasa reutilizable de widgets (dueño: bruno)
// Contrato: design/contracts/widget.md · Estructura: design/lab/widget/r01/ · Estilo: GWidget.css (coco)
// La carcasa no interpreta su contenido: lo entrega la aplicación por slots según el nivel (s, m, l) que el propio
// widget mide. Dentro de un GWidgetGrid añade a su menú las acciones de la rejilla (provide/inject).
import { Comment, Fragment, Text, computed, defineComponent, h, inject, nextTick, onBeforeUnmount, onMounted, ref, useAttrs, useId, useSlots, watch } from 'vue'
import { oneOf } from '../../utils/oneOf.js'
import GIcon from '../GIcon/GLibIcon.js'
import GMenu from '../GMenu/GMenu.vue'
import { GRID_KEY, ITEM_KEY } from '../../utils/widgetContext.js'

const isDev = typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production'
const COLORS = ['brand', 'accent', 'neutral', 'success', 'warning', 'danger', 'info']
const isEmptyNode = (v) => v.type === Comment || (v.type === Text && !String(v.children ?? '').trim()) || (v.type === Fragment && (!Array.isArray(v.children) || v.children.every(isEmptyNode)))
const nodes = (slot, scope) => (slot ? slot(scope).filter((v) => !isEmptyNode(v)) : [])

export default defineComponent({
  name: 'GWidget',
  inheritAttrs: false,
  props: {
    title: { type: String, default: undefined },
    eyebrow: { type: String, default: undefined },
    description: { type: String, default: undefined },
    headingLevel: { type: Number, default: 3, validator: (v) => Number.isInteger(v) && v >= 2 && v <= 6 },
    state: { type: String, default: 'populated', validator: oneOf(['populated', 'loading', 'empty', 'error', 'stale', 'disabled']) },
    level: { type: String, default: 'auto', validator: oneOf(['auto', 's', 'm', 'l']) },
    badge: { type: [String, Number], default: undefined },
    badgeColor: { type: String, default: 'neutral', validator: oneOf(COLORS) },
    actions: { type: Array, default: () => [] },
    href: { type: String, default: undefined },
    drilldownLabel: { type: String, default: undefined },
    updatedText: { type: String, default: undefined },
    density: { type: String, default: 'default', validator: oneOf(['default', 'comfortable', 'compact']) },
    headless: Boolean,
    labels: { type: Object, default: () => ({}) },
    id: { type: String, default: undefined }
  },
  emits: ['action', 'retry', 'drilldown'],
  setup(props, { emit, expose }) {
    const attrs = useAttrs()
    const slots = useSlots()
    const uid = useId()
    const rootId = computed(() => props.id || `g-widget-${uid}`)
    const titleId = computed(() => `${rootId.value}-title`)
    const menuId = computed(() => `${rootId.value}-menu`)
    const L = computed(() => props.labels || {})
    const grid = inject(GRID_KEY, null)
    const item = inject(ITEM_KEY, null)

    const warned = new Set()
    const warnOnce = (key, msg) => {
      if (!isDev || warned.has(key)) return
      warned.add(key)
      console.warn(`[Grana] <GWidget> ${msg}`)
    }

    // ---------- Nivel y forma: el widget mide su propio tamaño ----------
    const rootEl = ref(null)
    const size = ref({ w: 0, h: 0 })
    const unit = ref(4)
    let ro = null
    const measureUnit = () => {
      if (typeof getComputedStyle === 'undefined' || !rootEl.value) return
      const v = getComputedStyle(rootEl.value).getPropertyValue('--g-space-1').trim()
      const n = parseFloat(v)
      if (!n) return
      unit.value = v.endsWith('rem') ? n * (parseFloat(getComputedStyle(document.documentElement).fontSize) || 16) : n
    }
    const measure = () => {
      if (!rootEl.value) return
      measureUnit()
      const r = rootEl.value.getBoundingClientRect()
      size.value = { w: r.width, h: r.height }
    }
    const levelAuto = computed(() => {
      const w = size.value.w
      if (!w) return 'm'
      const h = size.value.h
      // el alto también limita el nivel (DECISIONS #90): con poca altura el cuerpo se quedaría en 0
      if (w < unit.value * 60 || (h && h < unit.value * 36)) return 's'
      if (w < unit.value * 110 || (h && h < unit.value * 64)) return 'm'
      return 'l'
    })
    const level = computed(() => (props.level === 'auto' ? levelAuto.value : props.level))
    const shape = computed(() => {
      const { w, h } = size.value
      if (!w || !h) return 'square'
      if (w >= h * 1.9) return 'wide'
      if (h >= w * 1.3 && h >= unit.value * 80) return 'tall'
      return 'square'
    })
    onMounted(() => {
      measure()
      if (typeof ResizeObserver !== 'undefined') {
        ro = new ResizeObserver(() => measure())
        ro.observe(rootEl.value)
      }
    })
    onBeforeUnmount(() => { ro?.disconnect() })

    // ---------- Contexto de la rejilla ----------
    const editing = computed(() => Boolean(grid && grid.editing.value))
    watch(() => props.title, (t) => { if (grid && item) grid.registerTitle(item.id, t) }, { immediate: true })

    // ---------- Menú de acciones (GMenu, design/contracts/menu.md) ----------
    const btnEl = ref(null)
    const menuOpen = ref(false)
    const gridActions = computed(() => {
      if (!grid || !item || !grid.editing.value) return []
      const gl = grid.labels.value
      const i = grid.indexOf(item.id)
      const cur = grid.sizeOf?.(item.id)
      return [
        { type: 'separator' },
        { id: 'grid:before', label: gl.moveBefore, disabled: i <= 0 },
        { id: 'grid:after', label: gl.moveAfter, disabled: i >= grid.count.value - 1 },
        { type: 'separator' },
        {
          type: 'group',
          label: gl.size,
          items: grid.presets.value.map((p) => ({
            type: 'radio',
            id: `grid:size:${p.id}`,
            label: `${gl.presets?.[p.id] ?? p.id} (${p.w} × ${p.h})`,
            checked: Boolean(cur) && cur.w === p.w && cur.h === p.h
          }))
        },
        { type: 'separator' },
        { id: 'grid:remove', label: gl.remove, danger: true }
      ]
    })
    const menuItems = computed(() => {
      const own = props.actions.filter((a) => a && typeof a === 'object')
      return own.length || gridActions.value.length ? [...own, ...gridActions.value] : []
    })
    const hasMenu = computed(() => menuItems.value.length > 0 && !props.headless)
    const menuLabel = computed(() => `${L.value.actions ?? ''} ${props.title ?? ''}`.trim())
    const onSelect = (e) => {
      const id = String(e.id)
      if (id.startsWith('grid:')) {
        grid.run(item.id, id.slice(5))
        return
      }
      emit('action', e.checked === undefined ? { id: e.id } : { id: e.id, checked: e.checked })
    }
    watch(hasMenu, (v) => { if (!v) menuOpen.value = false })
    if (grid && item) grid.registerMenu(item.id, () => btnEl.value)

    // ---------- Contenido por nivel ----------
    const scope = computed(() => ({ level: level.value, shape: shape.value, state: props.state }))
    const levelContent = () => {
      const lv = level.value
      const order = lv === 's' ? ['compact', 'default'] : lv === 'l' ? ['detail', 'default'] : ['default']
      for (const n of order) {
        const out = nodes(slots[n], scope.value)
        if (out.length) return out
      }
      return []
    }
    const skeleton = () => {
      if (slots.loading) return slots.loading({ level: level.value, shape: shape.value })
      const n = level.value === 's' ? 2 : level.value === 'm' ? 2 : 4
      return h('div', { class: 'g-widget__skeleton', 'aria-hidden': 'true' }, [
        ...Array.from({ length: n }, (_, i) => h('span', { class: 'g-widget__line', key: i })),
        level.value === 's' ? null : h('span', { class: 'g-widget__block' })
      ])
    }

    // ---------- Avisos de desarrollo ----------
    if (isDev) {
      if (!props.title && !slots.title && !attrs['aria-label'] && !attrs['aria-labelledby']) warnOnce('title', 'necesita title (nombre accesible).')
      const l = props.labels || {}
      if ((props.actions.length || grid) && !l.actions) warnOnce('actions', 'necesita labels.actions (nombre del botón de menú).')
      if (props.state === 'loading' && !l.loading) warnOnce('loading', 'con state="loading" necesita labels.loading.')
      if (props.state === 'error' && !l.retry && !slots.error) warnOnce('retry', 'con state="error" necesita labels.retry.')
      if (props.state === 'stale' && !l.stale) warnOnce('stale', 'con state="stale" necesita labels.stale.')
    }

    // ---------- Render ----------
    const cls = (...a) => a.filter(Boolean).join(' ')
    const renderHead = () => {
      const lv = level.value
      const st = props.state
      const bText = st === 'stale' ? L.value.stale : st === 'disabled' ? L.value.disabled : st === 'error' ? L.value.error : props.badge
      const bColor = st === 'error' ? 'danger' : st === 'stale' ? 'warning' : props.badgeColor
      const badge = lv === 's'
        ? null
        : slots.badge
          ? slots.badge({ state: st })
          : (bText !== undefined && bText !== null && bText !== '' ? h('span', { class: cls('g-widget__badge', `g-widget__badge--color-${bColor}`) }, String(bText)) : null)
      const icon = nodes(slots.icon, { level: lv })
      const Tag = `h${props.headingLevel}`
      return h('header', { class: 'g-widget__head' }, [
        icon.length ? h('span', { class: 'g-widget__icon', 'aria-hidden': 'true' }, icon) : null,
        h('div', { class: 'g-widget__titles' }, [
          lv !== 's' && (slots.eyebrow || props.eyebrow) ? h('span', { class: 'g-widget__eyebrow' }, slots.eyebrow ? slots.eyebrow() : props.eyebrow) : null,
          h(Tag, { class: 'g-widget__title', id: titleId.value }, slots.title ? slots.title() : props.title),
          lv !== 's' && props.description ? h('p', { class: 'g-widget__sub' }, props.description) : null
        ]),
        badge,
        hasMenu.value
          ? (slots.actions
              ? slots.actions()
              : h(GMenu, {
                  modelValue: menuOpen.value,
                  'onUpdate:modelValue': (open) => { menuOpen.value = open },
                  items: menuItems.value,
                  align: 'end',
                  closeOnSelect: 'always',
                  onSelect
                }, {
                  trigger: ({ attrs: t }) => h('button', {
                    ...t,
                    ref: (el) => { t.ref?.(el); btnEl.value = el },
                    type: 'button',
                    class: 'g-widget__menu',
                    'aria-label': menuLabel.value
                  }, [h(GIcon, { name: 'ellipsis-vertical' })])
                }))
          : null
      ])
    }

    const renderBody = () => {
      const st = props.state
      const lv = level.value
      if (st === 'loading') return [h('span', { class: 'g-widget__sr', role: 'status' }, L.value.loading), skeleton()]
      if (st === 'empty') {
        const c = nodes(slots.empty, { level: lv })
        return [h('div', { class: 'g-widget__state' }, c.length ? c : [L.value.empty ? h('span', L.value.empty) : null])]
      }
      if (st === 'error') {
        const retry = () => emit('retry')
        const c = nodes(slots.error, { level: lv, retry })
        return [h('div', { class: 'g-widget__state', role: 'alert' }, c.length ? c : [
          L.value.error ? h('strong', L.value.error) : null,
          L.value.retry ? h('button', { type: 'button', onClick: retry }, L.value.retry) : null
        ])]
      }
      const content = levelContent()
      return content
    }

    const onDrill = (e) => {
      emit('drilldown', { event: e })
    }
    const renderFoot = () => {
      const lv = level.value
      if (lv === 's') return null
      if (slots.footer) return h('footer', { class: 'g-widget__foot' }, slots.footer({ level: lv, state: props.state }))
      if (props.state === 'loading') return h('footer', { class: 'g-widget__foot' }, [h('span', { class: 'g-widget__line', 'aria-hidden': 'true', style: { inlineSize: '40%' } })])
      const link = props.drilldownLabel
        ? (props.href
            ? h('a', { class: 'g-widget__link', href: props.href, onClick: onDrill }, props.drilldownLabel)
            : h('button', { type: 'button', class: 'g-widget__link', onClick: onDrill }, props.drilldownLabel))
        : null
      // Desactualizado: la hora del dato sustituye al texto de actualización en el pie, sin añadir una línea al cuerpo (DECISIONS #90)
      const stale = props.state === 'stale' && L.value.staleText
      const note = stale ? h('span', { class: 'g-widget__stale' }, L.value.staleText) : h('span', props.updatedText)
      if (!stale && !props.updatedText && !link) return null
      return h('footer', { class: 'g-widget__foot' }, [note, props.state === 'populated' || props.state === 'stale' ? link : null])
    }

    expose({ focusMenu: () => btnEl.value?.focus(), level, shape })

    return () => {
      const st = props.state
      const { class: klass, ...rest } = attrs
      const body = renderBody()
      const disabled = st === 'disabled'
      return h('article', {
        ...rest,
        ref: rootEl,
        id: rootId.value,
        class: cls('g-widget', `g-widget--level-${level.value}`, `g-widget--shape-${shape.value}`, `g-widget--state-${st}`, `g-widget--density-${props.density}`, props.headless && 'g-widget--headless', editing.value && 'is-editing', klass),
        'data-level': level.value,
        'data-shape': shape.value,
        'aria-labelledby': props.headless ? (attrs['aria-labelledby'] || undefined) : titleId.value,
        'aria-label': props.headless ? (attrs['aria-label'] || props.title) : undefined,
        'aria-busy': st === 'loading' ? 'true' : undefined,
        'aria-disabled': disabled ? 'true' : undefined
      }, [
        props.headless ? null : renderHead(),
        h('div', { class: 'g-widget__body', inert: disabled ? '' : undefined }, body),
        renderFoot()
      ])
    }
  }
})
</script>
