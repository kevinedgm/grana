<script>
// GStepper · indicador de avance por pasos (dueño: bruno)
// Contrato: design/contracts/stepper.md · Estilo: GStepper.css (coco) · Estructura: design/lab/stepper/r01/.
// Función de render: la lista de pasos se dibuja dos veces (completa y desplegada en el compacto), con el mismo código.
// La lista completa existe siempre (en compacto, oculta por el CSS) para poder medir su ancho natural (DECISIONS.md #151).
import { defineComponent, h, ref, computed, watch, nextTick, onMounted, onBeforeUpdate, onUpdated, onBeforeUnmount, useId } from 'vue'
import { oneOf } from '../../utils/oneOf.js'
import GIcon from '../GIcon/GIcon.vue'

const isDev = typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production'
const COLORS = ['brand', 'accent', 'neutral', 'success', 'warning', 'danger', 'info']
const STATE_KEYS = ['complete', 'current', 'pending', 'error', 'warning', 'disabled', 'optional']
// Clases de tramo que el CSS de coco consume; MEASURE solo existe durante una lectura síncrona
const TIER_CLASS = { condensed: 'g-stepper--condensed', current: 'g-stepper--current-only', compact: 'g-stepper--is-compact' }
const MEASURE = 'g-stepper--measure'

export default defineComponent({
  name: 'GStepper',
  props: {
    steps: { type: Array, default: () => [] },
    modelValue: { type: [String, Number], default: undefined },
    orientation: { type: String, default: 'horizontal', validator: oneOf(['horizontal', 'vertical']) },
    indicator: { type: String, default: 'number', validator: oneOf(['number', 'dot', 'icon', 'segment', 'line']) },
    navigation: { type: String, default: 'none', validator: oneOf(['none', 'back', 'free']) },
    responsive: { type: String, default: 'auto', validator: oneOf(['auto', 'never', 'compact']) },
    color: { type: String, default: 'brand', validator: oneOf(COLORS) },
    size: { type: String, default: 'md', validator: oneOf(['sm', 'md', 'lg']) },
    density: { type: String, default: 'default', validator: oneOf(['default', 'comfortable', 'compact']) },
    disabled: Boolean,
    expandAll: Boolean,
    labels: { type: Object, default: () => ({}) }
  },
  emits: ['update:modelValue', 'select'],
  setup(props, { emit, slots, attrs }) {
    const root = ref(null)
    const width = ref(0) // 0 = sin medir (SSR o sin ResizeObserver): se renderiza completo
    // Ancho natural de la lista en cada tramo (completo, sin descripciones, solo el actual con texto); null = sin medir
    const needs = ref(null)
    const open = ref(false)
    const listId = `${useId()}-list`
    // is-ready: dos cuadros después de montar (ya aplicado el primer tramo); las entradas de coco solo existen con él
    const ready = ref(false)
    let unmounted = false

    const idOf = (step, i) => (step && step.id !== undefined ? step.id : i)
    const count = computed(() => props.steps.length)
    const currentIndex = computed(() => {
      if (!props.steps.length) return -1
      if (props.modelValue === undefined) return 0
      return props.steps.findIndex((s, i) => idOf(s, i) === props.modelValue)
    })

    // ---- Adaptación por el ancho del contenedor (DECISIONS.md #151) ----
    // Tramos: completo → condensado (sin descripciones) → solo el actual con texto → compacto. Se elige el primero
    // cuya lista, a su ancho natural, cabe en el contenedor. El ancho natural se lee del propio DOM con la clase de
    // medición de coco, así depende del texto, la fuente, size, density e indicator, y no de un múltiplo fijo de space.
    const adaptive = computed(() => props.responsive === 'auto' && props.orientation === 'horizontal')
    const tier = computed(() => {
      if (props.responsive === 'compact') return 'compact'
      if (!adaptive.value || !(width.value > 0) || !needs.value) return 'full'
      const w = width.value
      const n = needs.value
      if (w >= n.full) return 'full'
      if (w >= n.condensed) return 'condensed'
      if (w >= n.current) return 'current'
      return 'compact'
    })
    const isCompact = computed(() => tier.value === 'compact')

    // Lectura síncrona: quita los tramos, pone la clase de medición y lee la lista en cada tramo; deja la raíz como estaba
    const measureNeeds = () => {
      const el = root.value
      if (!el || !adaptive.value) return
      const list = el.querySelector(':scope > .g-stepper__list')
      if (!list) return
      const original = el.className
      const read = () => Math.ceil(list.getBoundingClientRect().width)
      el.classList.remove(TIER_CLASS.condensed, TIER_CLASS.current, TIER_CLASS.compact)
      el.classList.add(MEASURE)
      const full = read()
      el.classList.add(TIER_CLASS.condensed)
      const condensed = read()
      el.classList.remove(TIER_CLASS.condensed)
      el.classList.add(TIER_CLASS.current)
      const current = read()
      el.className = original
      if (!(full > 0)) return // sin maquetación (SSR, jsdom sin simular): se queda completo
      const prev = needs.value
      if (!prev || prev.full !== full || prev.condensed !== condensed || prev.current !== current) needs.value = { full, condensed, current }
    }
    const measure = () => {
      const el = root.value
      if (!el) return
      width.value = el.getBoundingClientRect().width
      measureNeeds()
    }

    let observer = null
    let frame = 0
    const onFonts = () => measureNeeds()
    // El cambio de tramo cambia la altura de la raíz observada: aplicarlo dentro del callback provoca
    // «ResizeObserver loop completed with undelivered notifications» (WebKit). Se aplica en el cuadro siguiente.
    const nextFrame = (fn) => (typeof requestAnimationFrame === 'function' ? requestAnimationFrame(fn) : (fn(), 0))
    onMounted(() => {
      measure()
      if (typeof ResizeObserver !== 'undefined' && root.value) {
        observer = new ResizeObserver((entries) => {
          const w = entries[0] && entries[0].contentRect ? entries[0].contentRect.width : 0
          if (frame && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(frame)
          frame = nextFrame(() => {
            frame = 0
            if (w > 0) width.value = w
            measureNeeds() // un cambio de tema o de fuente también mueve el tamaño de la raíz
          })
        })
        observer.observe(root.value)
      }
      if (typeof document !== 'undefined' && document.fonts && document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', onFonts)
      nextFrame(() => nextFrame(() => { if (!unmounted) ready.value = true }))
    })
    // Cualquier cambio de pasos, textos, paso actual o props visuales vuelve a renderizar: se mide de nuevo
    onUpdated(measureNeeds)

    // ---- Continuidad del indicador (plan 005) ----
    // Un paso que pasa de botón a texto (o al revés) cambia de etiqueta y Vue rehace su indicador: el nuevo nace con su
    // estilo final y la transición de coco no corre. Se continúa desde el aspecto del viejo con la Web Animations API
    // (como GWidgetGrid, #91). Duración y curva de los tokens; con movimiento reducido solo los colores.
    const CONTINUE = ['backgroundColor', 'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor', 'color', 'boxShadow', '--_stepper-fill']
    const toMs = (raw) => (raw.endsWith('ms') ? parseFloat(raw) : raw.endsWith('s') ? parseFloat(raw) * 1000 : NaN)
    const readStyle = (cs, p) => (p.startsWith('--') ? cs.getPropertyValue(p).trim() : cs[p])
    const shownIndicators = () => {
      const el = root.value
      if (!el) return []
      // La clase de la raíz (no isCompact) dice qué lista está pintada ahora mismo: antes del parche es la vieja
      const scope = el.classList.contains(TIER_CLASS.compact) ? '.g-stepper__compact > .g-stepper__list' : ':scope > .g-stepper__list'
      return [...el.querySelectorAll(`${scope} > .g-stepper__step > .g-stepper__hit > .g-stepper__indicator`)]
    }
    let lastIndicators = null
    onBeforeUpdate(() => {
      lastIndicators = null
      if (!ready.value || typeof window === 'undefined' || typeof window.getComputedStyle !== 'function') return
      lastIndicators = shownIndicators().map((node) => {
        const cs = window.getComputedStyle(node)
        const frame = {}
        for (const p of CONTINUE) frame[p] = readStyle(cs, p)
        return { node, frame, transform: cs.transform }
      })
    })
    onUpdated(() => {
      const prev = lastIndicators
      lastIndicators = null
      if (!prev || !prev.length || !root.value || typeof window.matchMedia !== 'function') return
      const now = shownIndicators()
      if (now.length !== prev.length) return // otro tramo u otros pasos: nada que continuar
      const cs = window.getComputedStyle(root.value)
      const fast = toMs(cs.getPropertyValue('--g-duration-fast').trim())
      const press = toMs(cs.getPropertyValue('--g-duration-press').trim())
      const standard = cs.getPropertyValue('--g-ease-standard').trim() || 'ease'
      const out = cs.getPropertyValue('--g-ease-out').trim() || 'ease-out'
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      now.forEach((node, i) => {
        const { node: old, frame, transform } = prev[i]
        if (node === old || typeof node.animate !== 'function') return // el mismo elemento: lo anima la transición de coco
        const to = window.getComputedStyle(node)
        const from = {}
        const end = {}
        let changed = false
        for (const p of CONTINUE) {
          const a = frame[p]
          const b = readStyle(to, p)
          if (!a || !b) continue
          from[p] = a
          end[p] = b
          if (a !== b) changed = true
        }
        if (changed && fast > 0) node.animate([from, end], { duration: fast, easing: standard })
        if (!reduce && transform && transform !== 'none' && press > 0) {
          node.animate([{ transform }, { transform: 'none' }], { duration: press, easing: out })
        }
      })
    })
    onBeforeUnmount(() => {
      unmounted = true
      if (observer) observer.disconnect()
      if (frame && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(frame)
      if (typeof document !== 'undefined' && document.fonts && document.fonts.removeEventListener) document.fonts.removeEventListener('loadingdone', onFonts)
    })

    // ---- Avisos de desarrollo (una vez por instancia) ----
    const warned = new Set()
    const warnOnce = (key, msg) => {
      if (!isDev || warned.has(key)) return
      warned.add(key)
      console.warn(`[Grana] <GStepper> ${msg}`)
    }
    if (isDev) {
      if (!attrs['aria-label'] && !attrs['aria-labelledby']) warnOnce('nav', 'necesita un nombre accesible: pasa aria-label o aria-labelledby.')
      const missing = STATE_KEYS.filter((k) => !props.labels[k])
      if (missing.length) warnOnce('labels', `faltan textos de estado en labels (${missing.join(', ')}): esos estados no se anunciarán.`)
    }
    watch(currentIndex, (i) => {
      if (i < 0 && props.steps.length) warnOnce('model', 'modelValue no coincide con ningún paso: ninguno será el actual.')
    }, { immediate: true })
    watch(isCompact, (c) => {
      if (c && !props.labels.showAll) warnOnce('showAll', 'en compacto necesita labels.showAll para el botón que muestra todos los pasos.')
      if (!c) open.value = false
    }, { immediate: true })

    // ---- Lógica de pasos ----
    const stateOf = (i) => (i < currentIndex.value ? 'complete' : i === currentIndex.value ? 'current' : 'pending')
    const isNavigable = (step, i) => {
      if (props.disabled || props.navigation === 'none' || step.disabled || i === currentIndex.value) return false
      return props.navigation === 'free' || (props.navigation === 'back' && i < currentIndex.value)
    }
    const segmentState = (i) => (i < currentIndex.value ? 'is-done' : i === currentIndex.value ? 'is-toward' : 'is-pending')
    const statusText = (step, state) => {
      const keys = [state]
      if (step.status === 'error' || step.status === 'warning') keys.push(step.status)
      if (step.disabled) keys.push('disabled')
      if (step.optional) keys.push('optional')
      const texts = keys.map((k) => props.labels[k]).filter(Boolean)
      return texts.length ? `, ${texts.join(', ')}` : ''
    }

    const activate = (step, i) => {
      let prevented = false
      emit('select', { id: idOf(step, i), index: i, preventDefault: () => { prevented = true } })
      if (prevented) return
      emit('update:modelValue', idOf(step, i))
      nextTick(() => {
        // El botón pulsado deja de serlo al volverse el actual: el foco pasa al paso actual nuevo (WCAG 2.4.3),
        // dentro de la lista visible (en compacto, la desplegada; la completa está oculta)
        if (currentIndex.value !== i || !root.value) return
        const scope = isCompact.value ? '.g-stepper__compact > .g-stepper__list' : ':scope > .g-stepper__list'
        const hit = root.value.querySelector(`${scope} > .g-stepper__step.is-current > .g-stepper__hit`)
        if (hit) {
          hit.setAttribute('tabindex', '-1')
          hit.focus()
        }
      })
    }

    const indicatorContent = (step, i, state, plainNumber) => {
      if (step.status === 'error') return [h(GIcon, { name: 'circle-alert' })]
      if (step.status === 'warning') return [h(GIcon, { name: 'triangle-alert' })]
      if (step.disabled) return [h(GIcon, { name: 'lock' })]
      if (state === 'complete') return [h(GIcon, { name: 'check' })]
      if (!plainNumber && props.indicator === 'icon' && slots.icon) {
        const custom = slots.icon({ step, index: i, state })
        if (custom && custom.length) return custom
      }
      return [String(i + 1)]
    }

    const renderStep = (step, i, { plainNumber = false, withContent = false } = {}) => {
      const state = stateOf(i)
      const classes = ['g-stepper__step', `is-${state}`]
      if (step.status === 'error' || step.status === 'warning') classes.push(`is-${step.status}`)
      if (step.disabled) classes.push('is-disabled')
      if (step.optional) classes.push('is-optional')
      const navigable = isNavigable(step, i)
      const scope = { step, index: i, state }
      const status = statusText(step, state)
      const text = [
        h('span', { class: 'g-stepper__label' }, slots.label ? slots.label(scope) : step.label),
        step.optional && props.labels.optional ? h('span', { class: 'g-stepper__optional' }, `(${props.labels.optional})`) : null,
        step.description || slots.description
          ? h('span', { class: 'g-stepper__description' }, slots.description ? slots.description(scope) : step.description)
          : null,
        status ? h('span', { class: 'g-stepper__status' }, status) : null
      ]
      const hitProps = { class: 'g-stepper__hit' }
      if (state === 'current') hitProps['aria-current'] = 'step'
      if (navigable) {
        hitProps.type = 'button'
        hitProps.onClick = () => activate(step, i)
      }
      const kids = [
        h(navigable ? 'button' : 'span', hitProps, [
          h('span', { class: 'g-stepper__indicator', 'aria-hidden': 'true' }, indicatorContent(step, i, state, plainNumber)),
          h('span', { class: 'g-stepper__text' }, text)
        ]),
        h('span', { class: ['g-stepper__connector', segmentState(i)], 'aria-hidden': 'true' })
      ]
      if (withContent && slots.content && (props.expandAll || state === 'current')) {
        kids.push(h('div', { class: 'g-stepper__content' }, slots.content(scope)))
      }
      return h('li', { class: classes, key: idOf(step, i) }, kids)
    }

    const renderList = (opts = {}, id) =>
      h('ol', { class: 'g-stepper__list', id }, props.steps.map((s, i) => renderStep(s, i, opts)))

    const renderCompact = () => {
      const cur = currentIndex.value
      const name = cur >= 0 ? props.steps[cur].label : ''
      const counter = props.labels.progress
        ? props.labels.progress.replace('{current}', cur + 1).replace('{total}', count.value)
        : `${cur + 1}/${count.value}`
      const showLabel = open.value && props.labels.hideAll ? props.labels.hideAll : props.labels.showAll
      return h('div', { class: 'g-stepper__compact' }, [
        h('div', { class: 'g-stepper__summary' }, [
          h('span', { class: 'g-stepper__summary-name' }, name),
          h('span', { class: 'g-stepper__summary-count' }, counter)
        ]),
        h('div', { class: 'g-stepper__bar', 'aria-hidden': 'true' },
          props.steps.map((s, i) => h('span', { class: ['g-stepper__bar-seg', segmentState(i)], key: idOf(s, i) }))),
        props.labels.showAll
          ? h('button', { class: 'g-stepper__toggle', type: 'button', 'aria-expanded': String(open.value), 'aria-controls': listId, onClick: () => { open.value = !open.value } }, showLabel)
          : null,
        open.value ? renderList({ plainNumber: true }, listId) : null
      ])
    }

    return () => {
      const classes = [
        'g-stepper',
        `g-stepper--${props.orientation}`,
        `g-stepper--indicator-${props.indicator}`,
        `g-stepper--color-${props.color}`,
        `g-stepper--size-${props.size}`,
        `g-stepper--density-${props.density}`
      ]
      if (props.navigation !== 'none' && !props.disabled) classes.push('g-stepper--navigable')
      if (TIER_CLASS[tier.value]) classes.push(TIER_CLASS[tier.value])
      if (props.disabled) classes.push('is-disabled')
      if (ready.value) classes.push('is-ready')
      // La lista completa va siempre (en compacto la oculta el CSS y sirve para medir); el resumen, solo en compacto
      return h('nav', { ref: root, class: classes }, [
        isCompact.value ? renderCompact() : null,
        renderList({ withContent: props.orientation === 'vertical' && !isCompact.value })
      ])
    }
  }
})
</script>
