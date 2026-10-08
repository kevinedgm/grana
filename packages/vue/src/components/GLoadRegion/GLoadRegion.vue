<script>
// GLoadRegion · la región que carga (dueño: bruno). Contrato: design/contracts/load-region.md (DECISIONS.md #529 a #548) ·
// Estilo: GLoadRegion.css (coco; estilo.md «Para bruno») · Estructura: design/lab/empty-skeleton/r01/ (kiwi, load.js).
// Entrada propia `@grana/vue/load-region` (#530): GEmpty, GBtn, GLibIcon, el motor (utils/loadPhase.js), el canal de
// página (utils/liveRegion.js) y la clave loadRegionKey llegan del principal por __shared, sin copia.
//
// A «Molde» en la primera carga: el slot se pinta con la muestra (`mold: true`) en un cuerpo aria-hidden + inert y el CSS
// le quita la tinta; al llegar, la tinta llega a su sitio (revelado: is-mold → is-mold + is-revealing → nada, #545).
// B «Lo último conocido» al refrescar (`refresh="keep"`): lo de antes sigue a la vista, inerte, con filo y píldora; lo
// nuevo llega marcado (data-g-fresh, fresh()); si falla, lo conocido se queda con la barra de fallo. `replace`: molde de
// lo último conocido. La región pinta SU COPIA: lo pintado cambia solo al terminar la fase (#531).
// Anuncios por el canal cortés de página (#533): al verse, a los 5 s y al terminar; solo habla la región más externa con
// labels.loading; una región sin carga propia que contiene regiones que cargan habla por ellas (grupo).
// Foco (#534): el molde nunca lo toma y la carga nunca lo roba; si estaba dentro, pasa a la raíz y vuelve por clave e índice;
// nunca a <body>, tampoco fuera de una carga. Sin fetch.
import { defineComponent, h, ref, shallowRef, computed, watch, nextTick, inject, provide, onMounted, onUpdated, onBeforeUnmount } from 'vue'
import { oneOf } from '../../utils/oneOf.js'
import { fill } from '../../utils/template.js'
import { createLoadPhase, loadRegionKey, rememberFocus, restoreFocus } from '../../utils/loadPhase.js'
import { acquirePageLive, announcePage } from '../../utils/liveRegion.js'
import GBtn from '../GBtn/GBtn.vue'
import GIcon from '../GIcon/GLibIcon.js'

const isDev = typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production'
const raf = (f) => (typeof requestAnimationFrame === 'function' ? requestAnimationFrame(f) : setTimeout(f, 16))
const caf = (id) => (typeof cancelAnimationFrame === 'function' ? cancelAnimationFrame(id) : clearTimeout(id))
const known = (v) => (Array.isArray(v) ? v.length > 0 : v != null)
const asList = (v) => (Array.isArray(v) ? v : v != null ? [v] : [])
// Margen sobre la duración del revelado cuando no llega transitionend (estilo.md «Para bruno», 1)
const REVEAL_MARGIN = 80
const ms = (v) => {
  const s = String(v || '').trim()
  if (!s) return 0
  const n = parseFloat(s)
  if (Number.isNaN(n)) return 0
  return s.endsWith('ms') ? n : n * 1000
}

export default defineComponent({
  name: 'GLoadRegion',
  props: {
    loading: Boolean,
    items: { type: [Array, Object], default: null },
    sample: { type: [Array, Object], default: null },
    keyBy: { type: [String, Function], default: 'id' },
    refresh: { type: String, default: 'keep', validator: oneOf(['keep', 'replace']) },
    error: { type: [Boolean, String], default: false },
    announceError: { type: Boolean, default: true },
    label: { type: String, default: undefined },
    labelledby: { type: String, default: undefined },
    labels: { type: Object, default: () => ({}) }
  },
  emits: ['retry'],
  setup(props, { emit, slots }) {
    const root = ref(null)
    const body = ref(null)
    const warned = new Set()
    const warn = (id, msg) => {
      if (!isDev || warned.has(id)) return
      warned.add(id)
      console.warn(`[Grana] <GLoadRegion> ${msg}`)
    }
    const L = () => props.labels || {}

    // ---------- Anidación (#533): solo habla la más externa con labels.loading; una sin carga propia es grupo ----------
    const parent = inject(loadRegionKey, null)
    const ancestors = () => { const out = []; for (let p = parent; p; p = p.parent) out.push(p); return out }
    // La región que habla por esta: la más externa de las que la contienen con labels.loading (o ninguna)
    const speaker = () => { let s = null; for (const a of ancestors()) if (a.speaks()) s = a; return s }

    // ---------- Estado ----------
    const painted = shallowRef(props.items) // la copia que se pinta (#531)
    const appliedError = shallowRef(props.error) // el error se aplica al terminar la carga
    const startedFirst = ref(false) // la carga en curso empezó sin nada conocido (molde de la muestra)
    const freshKeys = shallowRef(new Set())
    const revealing = ref(0) // 0 nada · 1 cuadro en molde con los datos · 2 la tinta llega
    const slotPx = ref(null)
    const empties = [] // GEmpty registrados en la plantilla (#533)
    let focusMem = null // { key, index } recordado al empezar (#534)
    let lastFocus = null // el último foco dentro de la región (para la regla fuera de una carga)
    let releaseLive = null
    let arrivedOnce = false

    const keyOf = (item) => {
      try { return typeof props.keyBy === 'function' ? props.keyBy(item) : item?.[props.keyBy] } catch { return undefined }
    }
    const keysOf = (v) => asList(v).map(keyOf)

    // ---------- Motor (#532) ----------
    const phase = createLoadPhase({ onShow, onSlow, onArrive })
    const ph = phase.state
    const replace = computed(() => props.refresh === 'replace')
    // El molde: en la primera carga desde el inicio (invisible dentro del retraso); con `replace`, desde que se ve
    const mold = computed(() => ph.busy && (startedFirst.value || (replace.value && ph.shown)))
    const stale = computed(() => ph.busy && ph.shown && !mold.value && !startedFirst.value)
    const failed = computed(() => !ph.busy && Boolean(appliedError.value) && known(painted.value))
    const errorText = () => (typeof appliedError.value === 'string' && appliedError.value ? appliedError.value : L().failed || '')

    // ---------- Anuncios ----------
    const silent = () => Boolean(speaker())
    const say = (text) => { if (text) announcePage(text) }
    const loadedText = (vars) => {
      const t = L().loaded
      if (typeof t === 'function') return t(vars)
      return fill(t, vars)
    }
    function onShow() {
      const s = speaker()
      if (s) s.groupEvent('shown', ctx)
      else say(L().loading)
    }
    function onSlow() {
      if (!silent()) say(L().slow)
    }
    function announceEnd() {
      const s = speaker()
      if (s) { s.groupEvent('end', ctx); return }
      if (failed.value) { if (props.announceError) say(errorText()); return }
      const e = empties[0]
      if (e) {
        if (e.cause === 'error' && !props.announceError) return
        say(e.title)
        return
      }
      if (appliedError.value) { if (props.announceError) say(errorText()); return }
      const list = painted.value
      say(loadedText({ count: Array.isArray(list) ? list.length : undefined, fresh: freshKeys.value.size }))
    }

    // ---------- Grupo: una región sin carga propia habla por las que contiene (#533) ----------
    const groupBusy = new Set()
    let groupSaid = false
    const ctx = {
      parent,
      speaks: () => Boolean(L().loading),
      registerEmpty(entry) { if (!empties.includes(entry)) empties.push(entry) },
      unregisterEmpty(entry, hadFocus) {
        const i = empties.indexOf(entry)
        if (i >= 0) empties.splice(i, 1)
        // El vacío se va con el foco dentro (quitar un filtro): la región lo recoge si cae en <body> (#534)
        if (hadFocus) nextTick(() => { if (!ph.busy) restoreFocus(root.value, null, null) })
      },
      groupEvent(type, child) {
        if (type === 'start' || type === 'shown') groupBusy.add(child)
        if (ph.busy) { if (type === 'end' || type === 'gone') groupBusy.delete(child); return } // habla su propia carga
        if (type === 'shown' && !groupSaid) { groupSaid = true; say(L().loading) }
        if (type === 'end' || type === 'gone') {
          const had = groupBusy.delete(child)
          if (had && type === 'end' && !groupBusy.size) {
            groupSaid = false
            say(loadedText({ count: undefined, fresh: undefined }))
          }
        }
      }
    }
    provide(loadRegionKey, ctx)

    // ---------- Foco (#534) ----------
    const itemOf = (el) => {
      const b = body.value
      if (!b || !el) return null
      const item = el.closest('[data-g-key]')
      return item && b.contains(item) ? item : null
    }
    const findKey = (key) => {
      const b = body.value
      if (!b) return null
      for (const n of b.querySelectorAll('[data-g-key]')) if (n.getAttribute('data-g-key') === String(key)) return n
      return null
    }
    const memoryOf = (el) => {
      const item = itemOf(el)
      return item ? rememberFocus(item, item.getAttribute('data-g-key'), el) : { key: null, index: 0 }
    }
    const captureFocus = () => {
      const r = root.value
      if (!r || typeof document === 'undefined') return
      const a = document.activeElement
      if (!a || a === r || !r.contains(a)) return
      focusMem = memoryOf(a)
      r.focus({ preventScroll: true })
    }
    const onFocusIn = (e) => {
      const r = root.value
      lastFocus = e.target && e.target !== r ? { el: e.target, ...memoryOf(e.target) } : null
    }
    const onFocusOut = (e) => {
      const r = root.value
      if (e.relatedTarget && r && !r.contains(e.relatedTarget)) lastFocus = null
    }

    // ---------- Revelado (#535, #545): is-mold → is-mold + is-revealing → nada ----------
    let revealFrame = 0
    let revealTimer = 0
    const stopReveal = () => {
      caf(revealFrame)
      clearTimeout(revealTimer)
      revealFrame = 0
      revealTimer = 0
      revealing.value = 0
    }
    const onTransitionEnd = (e) => {
      if (revealing.value === 2 && e.propertyName === 'color') stopReveal()
    }
    function startReveal() {
      stopReveal()
      revealing.value = 1
      nextTick(() => {
        revealFrame = raf(() => {
          revealFrame = 0
          if (revealing.value !== 1) return
          const b = body.value
          if (b) void b.offsetWidth // el cuadro en molde con los datos queda calculado antes de soltar la tinta
          revealing.value = 2
          nextTick(() => {
            const first = body.value && body.value.querySelector('*')
            let d = 0
            if (first && typeof getComputedStyle === 'function') {
              const cs = getComputedStyle(first)
              d = Math.max(0, ...String(cs.transitionDuration || '').split(',').map(ms))
              d += Math.max(0, ...String(cs.transitionDelay || '').split(',').map(ms))
            }
            revealTimer = setTimeout(stopReveal, d + REVEAL_MARGIN)
          })
        })
      })
    }

    // ---------- Primer hueco (#535): alto del primer [data-g-key] en px, en línea como --_load-slot ----------
    const measure = () => {
      const b = body.value
      if (!b) return
      const el = b.querySelector('[data-g-key]')
      if (!el) return
      const hgt = Math.round(el.getBoundingClientRect().height * 100) / 100
      if (hgt > 0 && hgt !== slotPx.value) slotPx.value = hgt
    }

    // ---------- Avisos de desarrollo ----------
    const checkKeys = (list, what) => {
      if (!Array.isArray(list)) return
      const seen = new Set()
      for (const it of list) {
        const k = keyOf(it)
        if (k === undefined || k === null) { warn('key-undefined', `keyBy devuelve undefined en ${what}: cada elemento necesita una clave (data-g-key, foco y lo nuevo).`); return }
        if (seen.has(k)) { warn('key-dup', `keyBy devuelve claves repetidas en ${what}.`); return }
        seen.add(k)
      }
    }
    const checkLabels = () => {
      const l = L()
      if ((l.loading && (!l.loaded || !l.slow)) || (!l.loading && (l.loaded || l.slow))) {
        warn('labels-trio', 'labels.loading, labels.loaded y labels.slow van juntos (al verse, al terminar y a los 5 s).')
      }
    }
    if (!props.label && !props.labelledby) warn('name', 'sin label ni labelledby: la raíz no lleva role="group" y, si recibe el foco, no tiene nombre.')
    checkLabels()
    watch(() => props.items, (v) => checkKeys(v, 'items'), { immediate: true })
    watch(() => props.sample, (v) => checkKeys(v, 'sample'), { immediate: true })

    // ---------- Ciclo de carga ----------
    function begin(arm) {
      const kind = phase.start({ arm })
      if (kind !== 'new') return
      startedFirst.value = painted.value === null
      stopReveal()
      captureFocus()
      if (!L().loading && !silent()) warn('no-loading', 'una carga sin labels.loading: se carga en silencio (solo vale en regiones secundarias).')
      if (startedFirst.value && !props.sample) warn('no-sample', 'primera carga sin sample: el molde no tiene forma que pintar.')
      // Una primera carga con [] se toma por «respondió vacío» y no pinta molde
      if (!arrivedOnce && Array.isArray(props.items) && props.items.length === 0) warn('first-empty', 'primera carga con items = []: pasa null hasta la primera respuesta ([] es «respondió vacío»).')
      const s = speaker()
      if (s) s.groupEvent('start', ctx)
    }
    function onArrive({ seen }) {
      const wasMold = seen && (startedFirst.value || replace.value)
      const prev = painted.value
      const next = props.items
      if (prev != null && Array.isArray(next)) {
        const old = new Set(keysOf(prev))
        freshKeys.value = new Set(keysOf(next).filter((k) => !old.has(k)))
      } else {
        freshKeys.value = new Set()
      }
      painted.value = next
      appliedError.value = props.error
      startedFirst.value = false
      arrivedOnce = true
      if (failed.value) {
        if (!L().failed && !(typeof props.error === 'string' && props.error)) warn('failed', 'barra de fallo sin labels.failed (ni error como texto).')
        if (!L().retry && !slots.failed) warn('retry', 'barra de fallo sin labels.retry.')
      }
      if (wasMold) startReveal()
      nextTick(() => {
        measure()
        announceEnd()
        if (focusMem) { restoreFocus(root.value, focusMem, findKey); focusMem = null }
      })
    }
    if (props.loading) begin(false)
    watch(() => props.loading, (on) => {
      if (on) begin(true)
      else phase.stop()
    })
    // Fuera de una carga, items y error se aplican al cambiar
    // (la llegada ya lo aplicó si este cambio llegó con el fin de la carga: lo nuevo no se pierde)
    watch(() => props.items, (v) => { if (!ph.busy && v !== painted.value) { painted.value = v; freshKeys.value = new Set() } })
    watch(() => props.error, (v) => { if (!ph.busy) appliedError.value = v })
    watch(stale, (on) => { if (on && !L().refreshing) warn('refreshing', 'refresco keep a la vista sin labels.refreshing (texto de la píldora).') })

    onMounted(() => {
      releaseLive = acquirePageLive()
      if (props.loading) phase.arm()
      measure()
    })
    onUpdated(() => {
      measure()
      // Fuera de una carga: si la plantilla cambió y el foco que estaba dentro cayó en <body>, vuelve por clave o a la raíz
      if (!ph.busy && lastFocus && !lastFocus.el.isConnected && typeof document !== 'undefined' && (!document.activeElement || document.activeElement === document.body)) {
        const mem = lastFocus
        lastFocus = null
        restoreFocus(root.value, mem, findKey)
      }
    })
    onBeforeUnmount(() => {
      phase.dispose()
      stopReveal()
      const s = speaker()
      if (s) s.groupEvent('gone', ctx)
      if (releaseLive) releaseLive()
    })

    // ---------- Render ----------
    const retry = () => emit('retry')
    const fresh = (item) => freshKeys.value.has(keyOf(item))
    const itemAttrs = (item) => {
      const k = keyOf(item)
      return { 'data-g-key': k === undefined || k === null ? undefined : String(k), 'data-g-fresh': !mold.value && revealing.value === 0 && fresh(item) ? '' : undefined }
    }
    const failedBar = () => {
      const text = errorText()
      return h('div', { class: 'g-load-region__failed' }, slots.failed
        ? slots.failed({ retry, text })
        : [
            h('span', { class: 'g-load-region__failed-icon', 'aria-hidden': 'true' }, [h(GIcon, { name: 'circle-alert' })]),
            h('p', { class: 'g-load-region__failed-text' }, text),
            h(GBtn, { size: 'sm', variant: 'soft', color: 'neutral', onClick: retry }, () => L().retry)
          ])
    }
    return () => {
      const inMold = mold.value
      const hidden = inMold || revealing.value === 1
      const scope = {
        items: inMold ? (startedFirst.value ? props.sample : painted.value) : painted.value,
        mold: inMold,
        fresh,
        itemAttrs
      }
      const named = Boolean(props.label || props.labelledby)
      return h('div', {
        ref: root,
        class: ['g-load-region', {
          'is-busy': ph.busy,
          'is-pending': ph.pending,
          'is-mold': inMold || revealing.value > 0,
          'is-stale': stale.value,
          'is-slow': ph.slow,
          'is-revealing': revealing.value === 2,
          'is-failed': failed.value
        }],
        role: named ? 'group' : undefined,
        'aria-label': props.label,
        'aria-labelledby': props.labelledby,
        tabindex: '-1',
        'aria-busy': ph.busy ? 'true' : 'false',
        style: slotPx.value ? { '--_load-slot': `${slotPx.value}px` } : undefined,
        onFocusin: onFocusIn,
        onFocusout: onFocusOut
      }, [
        failed.value ? failedBar() : null,
        h('div', {
          ref: body,
          class: 'g-load-region__body',
          'aria-hidden': hidden ? 'true' : undefined,
          inert: ph.busy || hidden ? '' : undefined,
          onTransitionend: onTransitionEnd
        }, slots.default ? slots.default(scope) : undefined),
        L().slow ? h('p', { class: 'g-load-region__slow' }, L().slow) : null,
        stale.value ? h('span', { class: 'g-load-region__pill', 'aria-hidden': 'true' }, [h(GIcon, { name: 'refresh-cw' }), L().refreshing]) : null
      ])
    }
  }
})
</script>
