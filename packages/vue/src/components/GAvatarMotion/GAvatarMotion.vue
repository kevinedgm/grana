<script>
// GAvatarMotion · avatar ilustrado que responde a estados semánticos (dueño: bruno)
// Contrato: design/contracts/avatar-motion.md · Estilo y coreografía: GAvatarMotion.css (coco).
// Dibujo: el del prototipo del usuario (design/lab/avatar-motion/r01/referencia-usuario.html), sin colores:
// cada forma lleva una clase de parte y el color lo pone el CSS con tokens. No es un icono (icons.md, DECISIONS.md #105).
// La API no nombra el motor (SVG + CSS hoy): el consumidor dice qué ocurre (state), el avatar elige la coreografía.
import { defineComponent, h, ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { oneOf } from '../../utils/oneOf.js'

const STATES = ['idle', 'hover', 'attention', 'open', 'thinking', 'working', 'success', 'warning', 'error']
// Estado semántico → coreografía (especificación §27: los estados pueden compartir comportamiento)
const MOTION = { idle: 'idle', hover: 'idle', attention: 'idle', open: 'idle', thinking: 'thinking', working: 'thinking', success: 'success', warning: 'error', error: 'error' }
const FINITE = new Set(['success', 'error'])

const reducedMotion = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
// Duración CSS (`800ms`, `0.8s`) a milisegundos; NaN si no se entiende
const toMs = (value) => {
  const n = parseFloat(value)
  if (Number.isNaN(n)) return NaN
  return /ms\s*$/.test(value) ? n : n * 1000
}

// ---- Dibujo (geometría del prototipo; los atributos de trazo son parte del dibujo, no del tema) ----
const c = (name) => `g-avatar-motion__${name}`
const line = (d) => h('path', { class: c('line'), d, 'stroke-width': 6, 'stroke-linecap': 'round' })
const band = (d) => h('path', { class: c('band'), d, 'stroke-width': 5, 'stroke-linecap': 'round' })
const drawing = () => [
  h('g', { class: [c('antenna'), c('antenna--start')] }, [line('M67 45 Q54 20 42 29'), h('circle', { class: c('tip'), cx: 41, cy: 29, r: 4.5 })]),
  h('g', { class: [c('antenna'), c('antenna--end')] }, [line('M93 45 Q106 20 118 29'), h('circle', { class: c('tip'), cx: 119, cy: 29, r: 4.5 })]),
  h('g', { class: [c('legs'), c('legs--start')] }, [line('M52 75 Q32 68 25 58'), line('M49 92 Q28 94 21 104'), line('M55 110 Q38 121 35 132')]),
  h('g', { class: [c('legs'), c('legs--end')] }, [line('M108 75 Q128 68 135 58'), line('M111 92 Q132 94 139 104'), line('M105 110 Q122 121 125 132')]),
  h('g', { class: c('body') }, [
    h('ellipse', { class: c('shell'), cx: 80, cy: 88, rx: 39, ry: 52 }),
    h('ellipse', { class: c('core'), cx: 80, cy: 88, rx: 31, ry: 44 }),
    band('M51 67 Q80 76 109 67'),
    band('M49 87 Q80 96 111 87'),
    band('M52 107 Q80 116 108 107'),
    h('g', { class: c('eyes') }, [
      h('ellipse', { class: c('eye'), cx: 68, cy: 55, rx: 5, ry: 6 }),
      h('ellipse', { class: c('eye'), cx: 92, cy: 55, rx: 5, ry: 6 }),
      h('circle', { class: c('pupil'), cx: 69, cy: 56, r: 2 }),
      h('circle', { class: c('pupil'), cx: 93, cy: 56, r: 2 })
    ])
  ])
]

export default defineComponent({
  name: 'GAvatarMotion',
  props: {
    state: { type: String, default: 'idle', validator: oneOf(STATES) },
    idleLoop: Boolean,
    size: { type: String, default: 'md', validator: oneOf(['sm', 'md', 'lg', 'xl']) },
    color: { type: String, default: 'brand', validator: oneOf(['brand', 'accent', 'neutral', 'success', 'warning', 'danger', 'info']) },
    label: { type: String, default: undefined }
  },
  emits: ['done', 'update:state'],
  setup(props, { emit }) {
    const root = ref(null)
    const settled = ref(false) // una coreografía finita terminó: se muestra reposo hasta el siguiente estado
    const motion = computed(() => (settled.value ? 'idle' : MOTION[props.state] || 'idle'))
    let timer = null

    const clearTimer = () => { if (timer) { clearTimeout(timer); timer = null } }
    const finish = () => {
      clearTimer()
      if (settled.value || !FINITE.has(MOTION[props.state])) return
      const ended = props.state
      settled.value = true
      emit('done', ended)
      emit('update:state', 'idle')
    }
    // Con movimiento reducido no hay animationend: la pose se mantiene --g-duration-spin y luego termina
    const scheduleReduced = () => {
      clearTimer()
      if (!FINITE.has(MOTION[props.state]) || !reducedMotion()) return
      const ms = root.value ? toMs(getComputedStyle(root.value).getPropertyValue('--g-duration-spin')) : NaN
      timer = setTimeout(finish, Number.isNaN(ms) ? 0 : ms)
    }

    watch(() => props.state, () => {
      settled.value = false
      scheduleReduced()
    })
    onMounted(scheduleReduced)
    onBeforeUnmount(clearTimer)

    const onAnimationEnd = (e) => {
      // Solo la animación finita del svg (las de las partes no cuentan)
      if (e.target !== e.currentTarget) return
      if (FINITE.has(motion.value)) finish()
    }

    return () => {
      const classes = ['g-avatar-motion', `g-avatar-motion--size-${props.size}`, `g-avatar-motion--color-${props.color}`]
      if (props.idleLoop) classes.push('g-avatar-motion--idle-loop')
      const a11y = props.label ? { role: 'img', 'aria-label': props.label } : { 'aria-hidden': 'true' }
      return h('span', { ref: root, class: classes, 'data-motion': motion.value, ...a11y }, [
        h('svg', { viewBox: '0 0 160 160', focusable: 'false', 'aria-hidden': 'true', onAnimationend: onAnimationEnd }, drawing())
      ])
    }
  }
})
</script>
