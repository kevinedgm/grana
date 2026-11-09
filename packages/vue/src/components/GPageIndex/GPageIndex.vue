<script>
// GPageIndex · índice de la página con la sección actual siguiendo la lectura (dueño: bruno)
// Contrato: design/contracts/page-index.md (#1038 a #1040, #1042, #1047) · Estructura: design/lab/sitio/r01/ (A) ·
// Estilo: GPageIndex.css (coco). Forma `relay`: un botón de menú cuyo texto dice dónde estás; la lista es GMenu con
// elementos-enlace (`current: 'location'`). Motor: la línea de lectura de api.md «Lugar actual» (#1039), leída en un cuadro
// por desplazamiento (todas las cajas antes de escribir, #964). Entrada propia `@grana/vue/page-index`: GMenu, GLibIcon y
// transitionMs llegan de `__shared`, sin copia.
import { computed, defineComponent, h, inject, nextTick, onBeforeUnmount, onMounted, ref, useAttrs, useId, watch } from 'vue'
import GMenu from '../GMenu/GMenu.vue'
import GIcon from '../GIcon/GLibIcon.js'
import { transitionMs } from '../../utils/motion.js'
import { pageIndexListKey } from '../../utils/pageIndexList.js'

const BURST = 600 // ventana de ráfaga (la de GTooltip)
const SETTLE = 150 // fin del desplazamiento donde no hay scrollend

export default defineComponent({
  name: 'GPageIndex',
  inheritAttrs: false,
  props: {
    items: { type: Array, default: () => [] },
    modelValue: { type: String, default: null },
    track: { type: Boolean, default: true },
    scroller: { type: [String, Object], default: null },
    appearance: { type: String, default: 'relay' },
    fold: Boolean,
    label: String,
    align: { type: String, default: 'end' },
    labels: { type: Object, default: () => ({}) },
    id: String
  },
  emits: ['update:modelValue', 'navigate'],
  setup(props, { emit, expose }) {
    const attrs = useAttrs()
    const rid = props.id || `g-page-index-${useId()}`
    // Forma `list` (#1054): la pinta la extensión `@grana/vue/page-index-list`; aquí solo la conexión
    const List = inject(pageIndexListKey, null)
    const isList = () => List && props.appearance == 'list'
    // ctl.gate lo pone la forma: PI-L5, la instancia sin cajas no lee ni emite
    const ctl = { go(id, event) { onNavigate({ id, event }); onClosed() } }
    const warned = new Set()
    const warn = (k, m) => { try { if (process.env.NODE_ENV !== 'production' && !warned.has(k)) { warned.add(k); console.warn(`[Grana GPageIndex] ${m} (aviso ${k[0]}).`) } } catch {} }
    try {
      if (process.env.NODE_ENV !== 'production') {
        const a = props.appearance
        if (a != 'relay' && !isList()) warn(a == 'list' ? '7' : '4', a == 'list' ? 'list sin @grana/vue/page-index-list: relay' : 'appearance fuera de lista: relay')
        if (props.fold && a != 'list') warn('8', 'fold sin list: se ignora')
        if (!props.label) warn('5', 'falta label')
      }
    } catch {}

    // ---------- Modelo: sin id o sin label se ignora (1); id repetido, gana el primero (2) ----------
    const byId = computed(() => {
      const m = new Map()
      for (const it of props.items || []) {
        if (!it?.id || !String(it.label ?? '').trim()) {
          try { if (process.env.NODE_ENV !== 'production') warn('1', 'elemento sin id o sin label: se ignora') } catch {}
        } else if (it.level === 3 && !isList()) {
          // en relay los 3 no se pintan (#1054)
        } else if (m.has(it.id)) {
          try { if (process.env.NODE_ENV !== 'production') warn(`2${it.id}`, `id «${it.id}» repetido: gana el primero`) } catch {}
        } else m.set(it.id, it)
      }
      return m
    })
    let list = [...byId.value.values()]
    const valid = (id) => (id && byId.value.has(id) ? id : null)
    const labelOf = (id) => (id ? byId.value.get(id).label : '')
    const indexOf = (id) => list.findIndex((it) => it.id === id)

    // ---------- Estado ----------
    const open = ref(false)
    const cur = ref(valid(props.modelValue))
    const shown = ref(labelOf(cur.value)) // el texto de __current (cambia en la fase in del relevo)
    const phase = ref(null)
    const dir = ref(null)
    const burst = ref(false)
    const curEl = ref(null)
    let quiet = true // el primer valor (y el primero tras cambiar de página) se pinta sin transición
    let last = 0
    let pending = null
    let seq = 0
    let outT = null

    // ---------- Relevo (#1040, #1047): sale → cambia el texto con `in` → reposo en el cuadro siguiente ----------
    const settle = () => {
      clearTimeout(outT)
      outT = null
      if (phase.value !== 'out') return
      const s = ++seq
      shown.value = labelOf(pending)
      phase.value = 'in'
      nextTick(() => {
        void curEl.value?.offsetWidth // fuerza el estilo de partida antes de quitar la fase
        requestAnimationFrame(() => { if (s === seq) { phase.value = null; dir.value = null } })
      })
    }
    const relay = (id, old) => {
      const now = Date.now()
      const quick = now - last < BURST
      last = now
      if (quiet || quick) {
        seq++
        clearTimeout(outT)
        phase.value = dir.value = null
        burst.value = quick && !quiet
        shown.value = labelOf(id)
        return
      }
      burst.value = false
      pending = id
      dir.value = indexOf(id) >= indexOf(old) ? 'down' : 'up'
      if (phase.value === 'out') return // durante la salida gana el último destino
      seq++
      phase.value = 'out'
      nextTick(() => {
        const ms = transitionMs(curEl.value)
        if (ms) outT = setTimeout(settle, ms + 16)
        else settle()
      })
    }
    // Desde la lectura o la elección se emite; desde `modelValue`, no
    const set = (id, quietly) => {
      id = valid(id)
      const old = cur.value
      if (id === old) return
      cur.value = id
      if (!quietly) emit('update:modelValue', id)
      relay(id, old)
    }
    watch(() => props.modelValue, (v) => set(v, 1))

    // ---------- Línea de lectura (api.md «Lugar actual», #1039) ----------
    let sc = null
    let raf = 0
    // paused: el salto de una elección está en curso; held: terminó y la elegida se sostiene hasta el primer `scroll`
    // posterior (#1048), que reanuda la lectura en ese cuadro. refresh() no la suelta; un cambio de `items`, sí
    let paused = false
    let held = false
    let pauseT = null
    let on = false
    const target = () => sc || window
    const read = () => {
      raf = 0
      if (paused || held || !props.track || (ctl.gate && ctl.gate())) return
      const root = sc || document.scrollingElement || document.documentElement
      const pad = parseFloat(getComputedStyle(root).scrollPaddingBlockStart) || 0
      const top = sc ? sc.getBoundingClientRect().top + sc.clientTop : 0
      const hgt = sc ? sc.clientHeight : document.documentElement.clientHeight
      const line = top + pad + (hgt - pad) / 3
      const end = root.scrollTop + root.clientHeight >= root.scrollHeight - 1
      const rects = list.map((it) => { const el = document.getElementById(it.id); return el && el.getBoundingClientRect() })
      let at = -1
      rects.forEach((r, i) => {
        if (r && (r.top <= line || (end && r.top < top + hgt && r.bottom > top + pad))) at = i
      })
      const was = quiet
      set(at < 0 ? null : list[at].id)
      if (was) quiet = false
    }
    const schedule = () => { if (!raf && on) raf = requestAnimationFrame(read) }
    const unpause = () => { clearTimeout(pauseT); if (paused) held = true; paused = false }
    const onScroll = () => {
      if (paused) { clearTimeout(pauseT); pauseT = setTimeout(unpause, SETTLE) }
      else { held = false; schedule() }
    }
    const listen = (yes) => {
      if (yes === on) return
      on = yes
      const fn = yes ? 'addEventListener' : 'removeEventListener'
      target()[fn]('scroll', onScroll, { passive: true })
      target()[fn]('scrollend', unpause)
      window[fn]('resize', schedule)
    }
    onMounted(() => {
      const s = props.scroller
      sc = typeof s === 'string' ? document.querySelector(s) : s
      try { if (process.env.NODE_ENV !== 'production' && s && !sc) warn('3', 'scroller no encontrado: el documento') } catch {}
      const hash = decodeURIComponent(location.hash.slice(1))
      if (valid(hash)) set(hash)
      quiet = props.track // sin lectura, ya no hay primer valor que esperar
      try { if (process.env.NODE_ENV !== 'production' && props.track && list.length && !list.some((it) => document.getElementById(it.id))) warn('6', 'ningún id de items está en el documento') } catch {}
      listen(props.track)
      schedule()
    })
    watch(() => props.track, (v) => { listen(v); schedule() })
    onBeforeUnmount(() => { listen(false); cancelAnimationFrame(raf); clearTimeout(pauseT); clearTimeout(outT) })
    // Otra página (otros id): se descarta la actual y se lee en el cuadro siguiente, sin transición
    watch(() => [...byId.value.keys()].join('\n'), () => {
      list = [...byId.value.values()]
      quiet = true
      held = paused = false
      set(null)
      quiet = props.track
      schedule()
    })

    // ---------- Elegir una sección ----------
    let focusTo = null
    const onNavigate = ({ id, event }) => {
      emit('navigate', { item: byId.value.get(id), event })
      if (event.defaultPrevented) return
      paused = true
      clearTimeout(pauseT)
      pauseT = setTimeout(unpause, SETTLE)
      set(id)
      focusTo = document.getElementById(id)
      try { if (process.env.NODE_ENV !== 'production' && !focusTo) warn(`6${id}`, `#${id} no está en el documento`) } catch {}
    }
    // GMenu devuelve el foco al disparador justo después de `closed`: el destino lo recibe a continuación
    const onClosed = () => {
      const el = focusTo
      focusTo = null
      if (el) {
        queueMicrotask(() => {
          if (el.tabIndex < 0 && !el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1')
          el.focus({ preventScroll: true })
        })
      }
    }

    expose({ refresh: schedule })

    return () => {
      const all = [...byId.value.values()]
      if (isList()) return h(List, { p: props, cur: cur.value, all, rid, attrs, ctl })
      const items = all.map((it) => ({ id: it.id, label: it.label, href: it.href || `#${it.id}`, current: it.id === cur.value ? 'location' : undefined }))
      return h('nav', { ...attrs, id: rid, class: ['g-page-index g-page-index--appearance-relay', !cur.value && 'is-empty', attrs.class], 'aria-label': props.label }, [
        h(GMenu, {
          id: rid,
          modelValue: open.value,
          'onUpdate:modelValue': (v) => { open.value = v },
          items,
          align: props.align,
          labels: props.labels,
          onNavigate,
          onClosed
        }, {
          trigger: ({ attrs: a }) => h('button', { ...a, type: 'button', class: 'g-page-index__trigger' }, [
            h('span', { class: 'g-page-index__key', dir: 'auto' }, props.label),
            ' ',
            h('span', { class: 'g-page-index__value' }, [
              h('span', { class: 'g-page-index__stack', 'aria-hidden': 'true' }, all.map((it) => h('span', { class: 'g-page-index__ghost', dir: 'auto', key: it.id }, it.label))),
              h('span', {
                ref: curEl,
                class: ['g-page-index__current', burst.value && 'is-burst'],
                dir: 'auto',
                'data-dir': dir.value || undefined,
                'data-phase': phase.value || undefined,
                onTransitionend: (e) => { if (e.target === e.currentTarget && e.propertyName === 'opacity') settle() }
              }, shown.value)
            ]),
            h('span', { class: 'g-page-index__icon', 'aria-hidden': 'true' }, [h(GIcon, { name: 'chevrons-up-down' })])
          ])
        })
      ])
    }
  }
})
</script>
