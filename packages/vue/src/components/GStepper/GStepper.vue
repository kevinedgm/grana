<script>
// GStepper · indicador de avance por pasos (dueño: bruno)
// Contrato: design/contracts/stepper.md · Estilo: GStepper.css (coco) · Estructura: design/lab/stepper/r01/.
// Función de render: la lista de pasos se dibuja dos veces (completa y desplegada en el compacto), con el mismo código.
import { defineComponent, h, ref, computed, watch, nextTick, onMounted, onBeforeUnmount, useId } from 'vue'
import { oneOf } from '../../utils/oneOf.js'
import GIcon from '../GIcon/GIcon.vue'

const isDev = typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production'
const COLORS = ['brand', 'accent', 'neutral', 'success', 'warning', 'danger', 'info']
const STATE_KEYS = ['complete', 'current', 'pending', 'error', 'warning', 'disabled', 'optional']

// Una longitud de CSS (px, rem, em) a píxeles; NaN si no se entiende
const toPx = (value) => {
  const n = parseFloat(value)
  if (Number.isNaN(n)) return NaN
  if (/rem\s*$|em\s*$/.test(value)) return n * parseFloat(getComputedStyle(document.documentElement).fontSize)
  return n
}

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
    const space = ref(NaN)
    const open = ref(false)
    const listId = `${useId()}-list`

    const idOf = (step, i) => (step && step.id !== undefined ? step.id : i)
    const count = computed(() => props.steps.length)
    const currentIndex = computed(() => {
      if (!props.steps.length) return -1
      if (props.modelValue === undefined) return 0
      return props.steps.findIndex((s, i) => idOf(s, i) === props.modelValue)
    })

    // ---- Adaptación por el ancho del contenedor (umbrales derivados de space y del número de pasos) ----
    const compactBelow = computed(() => count.value * space.value * 28)
    const condensedBelow = computed(() => count.value * space.value * 32)
    const measured = computed(() => width.value > 0 && !Number.isNaN(space.value))
    const isCompact = computed(() => {
      if (props.responsive === 'compact') return true
      if (props.responsive === 'never' || props.orientation === 'vertical' || !measured.value) return false
      return width.value < compactBelow.value
    })
    const isCondensed = computed(() => props.responsive !== 'never' && props.orientation === 'horizontal' && !isCompact.value && measured.value && width.value < condensedBelow.value)

    let observer = null
    const measure = () => {
      const el = root.value
      if (!el) return
      space.value = toPx(getComputedStyle(el).getPropertyValue('--g-space-1'))
      width.value = el.getBoundingClientRect().width
    }
    onMounted(() => {
      measure()
      if (typeof ResizeObserver !== 'undefined' && root.value) {
        observer = new ResizeObserver((entries) => {
          const w = entries[0] && entries[0].contentRect ? entries[0].contentRect.width : 0
          if (w > 0) width.value = w
          if (Number.isNaN(space.value) && root.value) space.value = toPx(getComputedStyle(root.value).getPropertyValue('--g-space-1'))
        })
        observer.observe(root.value)
      }
    })
    onBeforeUnmount(() => observer && observer.disconnect())

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
        // El botón pulsado deja de serlo al volverse el actual: el foco pasa al paso actual nuevo (WCAG 2.4.3)
        if (currentIndex.value !== i || !root.value) return
        const hit = root.value.querySelector('.g-stepper__step.is-current > .g-stepper__hit')
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
      if (isCondensed.value) classes.push('g-stepper--condensed')
      if (isCompact.value) classes.push('g-stepper--is-compact')
      if (props.disabled) classes.push('is-disabled')
      return h('nav', { ref: root, class: classes }, [
        isCompact.value ? renderCompact() : renderList({ withContent: props.orientation === 'vertical' })
      ])
    }
  }
})
</script>
