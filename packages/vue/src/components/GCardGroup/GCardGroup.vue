<script>
// GCardGroup · fila de tarjetas de métrica que filtran la región de debajo (dueño: bruno). Estilo: GCardGroup.css (coco).
// Contrato: design/contracts/card-group.md · DECISIONS.md #603 a #611 · api.md #570 (tira desplazable con tabindex="-1").
// Estructura: design/lab/card-group/r01/ (kiwi; forma A «Lengüeta», #611).
// Coordinador, no tarjeta: no dibuja tarjetas. Las GCard hijas leen el contexto (utils/cardGroup.js) y el grupo les da
// exclusividad (`v-model`), una sola parada de Tab (foco itinerante, APG Toolbar) y `aria-controls`; la tarjeta pone su
// `aria-describedby` con el contenido (#606). El grupo no anuncia, no conoce la tabla y no escribe texto.
// Rendimiento (lección de bd888df): nada mide en cada render del padre. Se mide con ResizeObserver, al cargar las fuentes y
// cuando cambia la firma (cadena) de lo pulsado; los puentes solo se reescriben si cambian.
import { Fragment, computed, defineComponent, h, inject, nextTick, onBeforeUnmount, onMounted, onUpdated, provide, ref, shallowRef, useAttrs, useId, useSlots, watch } from 'vue'
import { cardGroupKey } from '../../utils/cardGroup.js'
import { transitionMs } from '../../utils/motion.js'
import { isPressed, keyTarget, normalizeModel, revealDelta, toggleModel } from './model.js'

const FOCUSABLE = 'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"]), summary'
const raf = (f) => (typeof requestAnimationFrame === 'function' ? requestAnimationFrame(f) : setTimeout(f, 16))
const caf = (id) => (typeof cancelAnimationFrame === 'function' ? cancelAnimationFrame(id) : clearTimeout(id))
const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
const r2 = (n) => Math.round(n * 100) / 100
const keyOf = (v) => `${typeof v}:${String(v)}`

// El panel no pertenece a la barra: una GCard (o un GCardGroup) dentro de la región filtrada no se registra en este grupo
const PanelScope = defineComponent({
  name: 'GCardGroupPanelScope',
  setup(_, { slots }) {
    provide(cardGroupKey, null)
    return () => (slots.default ? slots.default() : null)
  }
})

export default defineComponent({
  name: 'GCardGroup',
  inheritAttrs: false,
  props: {
    modelValue: { type: [String, Number, Array], default: null },
    multiple: { type: Boolean, default: false },
    label: { type: String, default: undefined },
    labelledby: { type: String, default: undefined },
    controls: { type: String, default: undefined },
    id: { type: String, default: undefined }
  },
  emits: ['update:modelValue', 'change'],
  setup(props, { emit }) {
    const attrs = useAttrs()
    const slots = useSlots()
    const uid = useId()
    const rootId = computed(() => props.id || `g-card-group-${uid}`)
    const panelId = computed(() => `${rootId.value}-panel`)
    const stripEl = ref(null)

    const warned = new Set()
    const warn = (key, msg) => {
      try {
        if (process.env.NODE_ENV !== 'production' && !warned.has(key)) {
          warned.add(key)
          console.warn(`[Grana GCardGroup] ${msg}`)
        }
      } catch {}
    }

    // G8: un grupo dentro de otro (en la barra; el panel corta el contexto)
    try { if (process.env.NODE_ENV !== 'production' && inject(cardGroupKey, null)) warn('G8', 'un GCardGroup dentro de otro GCardGroup: cada GCard pertenece al grupo más cercano.') } catch {}

    // ---------- Modelo ----------
    const norm = computed(() => normalizeModel(props.modelValue, props.multiple))
    watch(norm, (n) => {
      try { if (process.env.NODE_ENV !== 'production' && n.bad) warn('G7', props.multiple
        ? 'con multiple, modelValue debe ser un arreglo ([] sin ninguna pulsada, nunca null); se trata como [].'
        : 'sin multiple, modelValue es el value de una tarjeta o null; un arreglo se trata como null.') } catch {}
    }, { immediate: true })

    // ---------- Tarjetas registradas (en el orden del documento) ----------
    let seq = 0
    const cards = shallowRef([])
    // Estado de cada tarjeta según la tabla de «Tarjetas hijas» (#605): managed | none | kind (G2) | no-value (G3) | dup (G4)
    const status = computed(() => {
      const m = new Map()
      const seen = new Set()
      for (const e of cards.value) {
        const i = e.interaction()
        const v = e.value()
        let s = 'none'
        if (i === 'auto' || i === 'toggle') {
          if (v === undefined || v === null) s = i === 'toggle' ? 'no-value' : 'none'
          else if (seen.has(keyOf(v))) s = 'dup'
          else { seen.add(keyOf(v)); s = 'managed' }
        } else if (i !== 'none') s = 'kind'
        m.set(e.uid, s)
      }
      return m
    })
    const managed = computed(() => cards.value.filter((e) => status.value.get(e.uid) === 'managed'))
    const eligible = computed(() => managed.value.filter((e) => !e.disabled() && !e.loading()))
    const pressedOf = (e) => status.value.get(e.uid) === 'managed' && isPressed(norm.value.value, e.value(), props.multiple)
    const filtered = computed(() => managed.value.some(pressedOf))

    // ---------- Foco itinerante (APG Toolbar) ----------
    const focusUid = ref(0) // la enfocada mientras el foco está dentro
    const lastUid = ref(0) // la última enfocada
    // Una sola parada: con el foco dentro, la enfocada; si no, la primera pulsada elegible → la última enfocada → la primera
    const tabStop = computed(() => {
      const list = eligible.value
      if (!list.length) return 0
      const has = (u) => u && list.some((e) => e.uid === u)
      if (has(focusUid.value)) return focusUid.value
      const p = list.find(pressedOf)
      if (p) return p.uid
      if (has(lastUid.value)) return lastUid.value
      return list[0].uid
    })

    const rtl = () => {
      const s = stripEl.value
      return Boolean(s && typeof getComputedStyle === 'function' && getComputedStyle(s).direction === 'rtl')
    }
    const isScroller = () => {
      const s = stripEl.value
      return Boolean(s && s.scrollWidth > s.clientWidth + 1)
    }
    // L7: la tarjeta ENTERA, no el principal (el botón estirado mide solo el título; en WebKit dejaba la tarjeta a medias)
    const revealCard = (e) => {
      const el = e.el()
      if (!el || typeof el.scrollIntoView !== 'function') return
      el.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: reduced() ? 'auto' : 'smooth' })
    }
    // Un cambio desde fuera (o al montar): solo la tira, por cálculo, sin desplazar la página
    const revealInStrip = (e, smooth) => {
      const s = stripEl.value
      const el = e && e.el()
      if (!s || !el || !isScroller()) return
      const d = revealDelta(s.getBoundingClientRect(), s.clientLeft, s.clientWidth, el.getBoundingClientRect())
      if (!d) return
      if (typeof s.scrollBy === 'function') s.scrollBy({ left: d, behavior: smooth && !reduced() ? 'smooth' : 'auto' })
      else s.scrollLeft += d
    }
    const moveTo = (e) => {
      const b = e.primary()
      if (!b) return
      lastUid.value = e.uid
      focusUid.value = e.uid
      b.focus({ preventScroll: true })
      revealCard(e)
    }
    const entryOf = (node) => (node ? cards.value.find((e) => e.primary() === node) : undefined)

    const onKeydown = (ev) => {
      if (ev.altKey || ev.ctrlKey || ev.metaKey) return
      const list = eligible.value
      const i = list.findIndex((e) => e.primary() === ev.target)
      if (i < 0) return
      const t = keyTarget(ev.key, i, list.length, rtl())
      if (t === null) return
      ev.preventDefault()
      moveTo(list[t])
    }
    // Un clic también enfoca (salvo WebKit): sin traer la tarjeta a la vista entre pulsar y soltar (el clic se perdería)
    let pointing = false
    const onPointerdown = () => {
      pointing = true
      setTimeout(() => { pointing = false }, 0)
    }
    const onFocusin = (ev) => {
      const e = entryOf(ev.target)
      if (!e) return
      const s = stripEl.value
      const entering = !ev.relatedTarget || !s || !s.contains(ev.relatedTarget)
      focusUid.value = e.uid
      lastUid.value = e.uid
      if (entering && !pointing) revealCard(e)
    }
    const onFocusout = (ev) => {
      const s = stripEl.value
      if (!ev.relatedTarget || !s || !s.contains(ev.relatedTarget)) focusUid.value = 0
    }
    // Si la enfocada deja de ser elegible (disabled, loading, desmontada), el foco pasa a la siguiente elegible o a la anterior
    const rescue = (idx, snapshot) => {
      const ok = new Set(eligible.value)
      const next = snapshot.slice(idx + 1).find((e) => ok.has(e)) || snapshot.slice(0, Math.max(0, idx)).reverse().find((e) => ok.has(e))
      if (next) moveTo(next)
    }
    // La tarjeta lo llama antes de repintarse (onBeforeUpdate): el botón aún tiene el foco y sus props ya cambiaron
    const check = (e) => {
      const b = e.primary()
      if (!b || typeof document === 'undefined' || document.activeElement !== b) return
      if (status.value.get(e.uid) === 'managed' && !e.disabled() && !e.loading()) return
      const snapshot = cards.value
      const idx = snapshot.indexOf(e)
      nextTick(() => rescue(idx, snapshot))
    }

    // ---------- Alternar (lo llama la GCard gestionada; ella no emite) ----------
    let internal = false
    const toggle = (e) => {
      if (status.value.get(e.uid) !== 'managed' || e.disabled() || e.loading()) return
      const v = e.value()
      const was = pressedOf(e)
      const next = toggleModel(norm.value.value, v, props.multiple, managed.value.map((x) => x.value()))
      internal = true
      emit('update:modelValue', next)
      emit('change', { value: v, pressed: !was })
      nextTick(() => { internal = false })
    }

    // ---------- Orden del documento ----------
    const sortCards = () => {
      const list = cards.value
      if (list.length < 2) return
      const sorted = [...list].sort((a, b) => {
        const x = a.el()
        const y = b.el()
        if (!x || !y || x === y) return 0
        return x.compareDocumentPosition(y) & 4 ? -1 : 1 // 4 = DOCUMENT_POSITION_FOLLOWING
      })
      if (sorted.some((e, i) => e !== list[i])) cards.value = sorted
    }

    // ---------- Puentes (solo con panel) ----------
    // { k, x, w, leaving }: x y w en px contra la caja de relleno de la tira, con su desplazamiento; en RTL, x desde la derecha
    const bridges = shallowRef([])
    const ready = ref(false)
    let unmounted = false
    let readyScheduled = false
    const scheduleReady = () => {
      if (ready.value || readyScheduled) return
      readyScheduled = true
      raf(() => raf(() => { readyScheduled = false; if (!unmounted) ready.value = true }))
    }
    const leaveTimers = new Map()
    const dropLeaving = (k) => {
      leaveTimers.delete(k)
      const list = bridges.value
      if (list.some((b) => b.k === k && b.leaving)) bridges.value = list.filter((b) => !(b.k === k && b.leaving))
    }
    const scheduleLeave = (k) => {
      if (leaveTimers.has(k)) return
      leaveTimers.set(k, -1)
      nextTick(() => {
        if (unmounted) return
        const node = stripEl.value && [...stripEl.value.children].find((n) => n.dataset && n.dataset.bridge === k)
        const ms = transitionMs(node)
        if (!ms) { dropLeaving(k); return }
        leaveTimers.set(k, setTimeout(() => dropLeaving(k), ms + 34))
      })
    }
    const measure = () => {
      const s = stripEl.value
      if (!s || !slots.panel || typeof s.getBoundingClientRect !== 'function') {
        if (bridges.value.length) bridges.value = []
        return
      }
      const a = s.getBoundingClientRect()
      const kx = s.offsetWidth && a.width ? a.width / s.offsetWidth : 1
      const isRtl = rtl()
      const endBorder = s.offsetWidth - s.clientWidth - s.clientLeft
      const now = []
      for (const e of managed.value) {
        if (!pressedOf(e)) continue
        const el = e.el()
        if (!el) continue
        const b = el.getBoundingClientRect()
        const x = isRtl ? (a.right - b.right) / kx - endBorder - s.scrollLeft : (b.left - a.left) / kx - s.clientLeft + s.scrollLeft
        now.push({ k: props.multiple ? keyOf(e.value()) : 'one', x: r2(x), w: r2(b.width / kx), leaving: false })
      }
      const prev = bridges.value
      const next = [...now]
      for (const p of prev) {
        if (now.some((n) => n.k === p.k)) continue
        next.push(p.leaving ? p : { ...p, leaving: true })
      }
      // Orden estable: el de antes y, al final, los nuevos
      next.sort((x, y) => {
        const i = prev.findIndex((p) => p.k === x.k)
        const j = prev.findIndex((p) => p.k === y.k)
        return (i < 0 ? Infinity : i) - (j < 0 ? Infinity : j)
      })
      const same = next.length === prev.length && next.every((n, i) => {
        const p = prev[i]
        return p.k === n.k && p.leaving === n.leaving && Math.abs(p.x - n.x) < 0.01 && Math.abs(p.w - n.w) < 0.01
      })
      if (!same) {
        bridges.value = next
        for (const n of next) {
          if (n.leaving) scheduleLeave(n.k)
          else if (leaveTimers.has(n.k)) { clearTimeout(leaveTimers.get(n.k)); leaveTimers.delete(n.k) }
        }
      }
    }
    let frame = 0
    const remeasure = () => { caf(frame); frame = raf(measure) }

    let ro = null
    const observe = (e) => {
      const el = e.el()
      if (ro && el && !e.observed) { ro.observe(el); e.observed = el }
    }

    // ---------- Registro (lo llama GCard en su setup) ----------
    const register = (spec) => {
      const e = { uid: ++seq, observed: null, ...spec }
      cards.value = [...cards.value, e]
      e.managed = computed(() => status.value.get(e.uid) === 'managed')
      e.pressed = computed(() => pressedOf(e))
      e.stop = computed(() => tabStop.value === e.uid)
      nextTick(() => {
        if (unmounted || !cards.value.includes(e)) return
        sortCards()
        observe(e)
        checkCards()
      })
      return e
    }
    const unregister = (e) => {
      const el = e.el()
      const had = Boolean(el && typeof document !== 'undefined' && el.contains(document.activeElement))
      const snapshot = cards.value
      const idx = snapshot.indexOf(e)
      cards.value = snapshot.filter((x) => x !== e)
      if (ro && e.observed) ro.unobserve(e.observed)
      if (focusUid.value === e.uid) focusUid.value = 0
      if (lastUid.value === e.uid) lastUid.value = 0
      if (had) nextTick(() => rescue(idx, snapshot))
    }
    const controlsId = () => props.controls || (slots.panel ? panelId.value : undefined)
    provide(cardGroupKey, { register, unregister, toggle, check, controls: controlsId })

    // ---------- Avisos de las tarjetas (G2 a G6) ----------
    const checkCards = () => {
      try {
        if (process.env.NODE_ENV !== 'production') {
          for (const e of cards.value) {
            const s = status.value.get(e.uid)
            const t = e.title() ? `«${e.title()}»` : 'sin título'
            if (s === 'kind') warn('G2', `una tarjeta (${t}) con interaction="${e.interaction()}" cae a "none": en la barra solo hay tarjetas de alternar.`)
            else if (s === 'no-value') warn('G3', `una tarjeta (${t}) con interaction="toggle" sin value cae a "none".`)
            else if (s === 'dup') warn('G4', `value repetido entre tarjetas (${t}): la segunda y siguientes caen a "none".`)
            if (s !== 'managed') continue
            if (e.bound()) warn('G6', `v-model/modelValue en una tarjeta gestionada (${t}) se ignora: el estado es el v-model del grupo.`)
            const content = e.el()?.querySelector?.('.g-card__content')
            if (e.secondary() || (content && content.querySelector(FOCUSABLE))) {
              warn('G5', `la tarjeta ${t} tiene controles secundarios (menú, casilla, «Mostrar más», actions, footer, more o enfocables): no admitidos en v1 en una barra de una parada.`)
            }
          }
        }
      } catch {}
    }
    try {
      if (process.env.NODE_ENV !== 'production') {
        const statusSig = computed(() => cards.value.map((e) => `${e.uid}:${status.value.get(e.uid)}`).join(','))
        watch(statusSig, () => nextTick(checkCards))
      }
    } catch {}

    // ---------- Medir solo cuando cambia algo medible ----------
    const pressedSig = computed(() => managed.value.map((e) => (pressedOf(e) ? e.uid : '')).join(',') + (props.multiple ? 'm' : ''))
    watch(pressedSig, () => measure(), { flush: 'post' })
    // Un cambio de modelValue desde fuera: sin change ni foco; desplaza solo la tira para que la (primera) pulsada se vea entera
    watch(() => props.modelValue, () => {
      if (internal) return
      revealInStrip(managed.value.find(pressedOf), true)
    }, { flush: 'post' })

    const onFonts = () => remeasure()
    onMounted(() => {
      sortCards()
      if (typeof ResizeObserver !== 'undefined' && stripEl.value) {
        ro = new ResizeObserver(remeasure)
        ro.observe(stripEl.value)
        for (const e of cards.value) observe(e)
      }
      if (typeof document !== 'undefined' && document.fonts) {
        document.fonts.ready?.then(() => { if (!unmounted) remeasure() })
        document.fonts.addEventListener?.('loadingdone', onFonts)
      }
      measure()
      scheduleReady()
      revealInStrip(managed.value.find(pressedOf), false)
      try {
        if (process.env.NODE_ENV !== 'production') {
          if (!props.label && !props.labelledby) warn('G1', 'necesita label o labelledby: es el nombre de la barra (role="toolbar").')
          if (attrs['aria-label'] !== undefined || attrs['aria-labelledby'] !== undefined) warn('G1b', 'aria-label/aria-labelledby no se copian a la barra: usa las props label o labelledby.')
          nextTick(() => {
            if (props.controls && typeof document !== 'undefined' && !document.getElementById(props.controls)) {
              warn('G9', `controls="${props.controls}" no existe en el documento.`)
            }
            checkCards()
          })
        }
      } catch {}
    })
    // Reordenar (v-for con otra clave) solo compara posiciones del documento: no mide ni fuerza el diseño
    onUpdated(sortCards)
    onBeforeUnmount(() => {
      unmounted = true
      ro?.disconnect()
      caf(frame)
      for (const t of leaveTimers.values()) clearTimeout(t)
      leaveTimers.clear()
      if (typeof document !== 'undefined') document.fonts?.removeEventListener?.('loadingdone', onFonts)
    })

    return () => {
      const hasPanel = Boolean(slots.panel)
      const isFiltered = filtered.value
      const { class: klass, 'aria-label': _al, 'aria-labelledby': _alb, ...rest } = attrs
      const kids = slots.default ? slots.default() : []
      const strip = h('div', {
        ref: stripEl,
        class: 'g-card-group__strip',
        role: 'toolbar',
        'aria-label': props.label,
        'aria-labelledby': props.labelledby,
        // #570: la tira desplazable no es una parada (Firefox la haría enfocable)
        tabindex: hasPanel ? '-1' : undefined,
        onKeydown,
        onFocusin,
        onFocusout,
        onPointerdown
      }, [
        h(Fragment, { key: 'cards' }, kids),
        ...(hasPanel
          ? bridges.value.map((b) => h('span', {
              key: b.k,
              class: ['g-card-group__bridge', b.leaving && 'is-leaving'],
              'aria-hidden': 'true',
              'data-bridge': b.k,
              style: { '--_bridge-x': `${b.x}px`, '--_bridge-w': `${b.w}px` }
            }))
          : [])
      ])
      return h('div', {
        ...rest,
        id: rootId.value,
        class: ['g-card-group', hasPanel && 'has-panel', isFiltered && 'is-filtered', props.multiple && 'is-multiple', ready.value && 'is-ready', klass]
      }, [
        strip,
        hasPanel
          ? h('div', { id: panelId.value, class: ['g-card-group__panel', isFiltered && 'is-filtered'] }, [
              h(PanelScope, null, { default: () => slots.panel({ filtered: isFiltered }) })
            ])
          : null
      ])
    }
  }
})
</script>
