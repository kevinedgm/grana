<script>
// GTabs · navegación entre vistas del mismo nivel (dueño: bruno)
// Contrato: design/contracts/tabs.md · Estructura: design/lab/tabs/r02/ · Estilo: GTabs.css (coco)
// Patrón Tabs de APG. Presenta y emite intención: `modelValue` es la pestaña activa y nunca cambia por su cuenta.
// Iconos: GIcon (Lucide). Contador e insignia: GBadge. Menú «Más»: GMenu.
import { computed, defineComponent, h, inject, mergeProps, nextTick, onBeforeUnmount, onMounted, onUpdated, provide, reactive, ref, useId, watch } from 'vue'
import { oneOf } from '../../utils/oneOf.js'
import { fill } from '../../utils/template.js'
import { TABS_NEST, hasFocusable, isRtl, panelDomId, tabDomId } from '../../utils/tabs.js'
import GIcon from '../GIcon/GLibIcon.js'
import GAppIcon from '../GIcon/GIcon.vue'
import GBadge from '../GBadge/GBadge.vue'
import GMenu from '../GMenu/GMenu.vue'

const isDev = typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production'
const cls = (...v) => v.filter(Boolean)
const hasIconValue = (v) => v !== undefined && v !== null
// «Dato → nombre» (#202): un `icon` cadena sin slot `icon` dibuja GIcon con ese nombre (resolución de la aplicación)
const isIconName = (v) => typeof v === 'string' && v !== ''
const reduceMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
const px = (n) => `${Math.round(n * 100) / 100}px`

export default defineComponent({
  name: 'GTabs',
  inheritAttrs: false,
  props: {
    items: { type: Array, default: () => [] },
    modelValue: { type: [String, Number], default: undefined },
    appearance: { type: String, default: 'underline', validator: oneOf(['underline', 'pill', 'segmented', 'contained']) },
    orientation: { type: String, default: 'horizontal', validator: oneOf(['horizontal', 'vertical']) },
    color: { type: String, default: 'brand', validator: oneOf(['brand', 'accent', 'neutral']) },
    density: { type: String, default: 'default', validator: oneOf(['default', 'comfortable', 'compact']) },
    align: { type: String, default: 'start', validator: oneOf(['start', 'center', 'distribute', 'fill']) },
    activation: { type: String, default: 'auto', validator: oneOf(['auto', 'manual']) },
    overflow: { type: String, default: 'scroll', validator: oneOf(['scroll', 'arrows', 'more']) },
    labelMode: { type: String, default: 'full', validator: oneOf(['full', 'icon', 'auto']) },
    snap: Boolean,
    lazy: Boolean,
    responsive: { type: String, default: 'auto', validator: oneOf(['auto', 'never']) },
    detached: Boolean,
    disabled: Boolean,
    label: { type: String, default: undefined },
    labelledby: { type: String, default: undefined },
    labels: { type: Object, default: () => ({}) },
    id: { type: String, default: undefined }
  },
  emits: ['update:modelValue', 'change'],
  setup(props, { emit, slots, attrs }) {
    const uid = useId()
    const rootId = computed(() => props.id || `g-tabs-${uid}`)

    // ---------- Avisos de desarrollo ----------
    const warned = new Set()
    const warnOnce = (key, msg) => {
      if (!isDev || warned.has(key)) return
      warned.add(key)
      console.warn(`[Grana] <GTabs> ${msg}`)
    }
    // Un GTabs dentro del panel de otro es un error de uso (un solo nivel)
    const nested = inject(TABS_NEST, false)
    provide(TABS_NEST, true)
    if (isDev && nested) warnOnce('nested', 'no se anida dentro de otro GTabs ni de un panel: es un solo nivel (usa GSidebar, secciones o GStepper para la subnavegación).')

    // ---------- Datos ----------
    // Pestañas válidas: sin `id` se ignoran; los ids repetidos conservan la primera
    const entries = computed(() => {
      const seen = new Set()
      const out = []
      for (const raw of Array.isArray(props.items) ? props.items : []) {
        if (!raw || typeof raw !== 'object' || raw.id === undefined || raw.id === null || raw.id === '') continue
        if (seen.has(raw.id)) continue
        seen.add(raw.id)
        out.push(raw)
      }
      return out
    })
    const labelOf = (e) => (typeof e.label === 'string' && e.label ? e.label : String(e.id))
    const indexOf = (id) => entries.value.findIndex((e) => e.id === id)

    // Activa: `modelValue` (si es una pestaña habilitada); sin valor, la primera habilitada; si no es válido, ninguna
    const activeId = computed(() => {
      const list = entries.value
      if (props.modelValue === undefined || props.modelValue === null) return list.find((e) => !e.disabled)?.id
      const hit = list.find((e) => e.id === props.modelValue)
      return hit && !hit.disabled ? hit.id : undefined
    })
    const tabbableId = computed(() => activeId.value ?? entries.value.find((e) => !e.disabled)?.id)

    // ---------- Estado de medición ----------
    const rootEl = ref(null)
    const scrollerEl = ref(null)
    const containerW = ref(0)
    const spacePx = ref(4)
    const canStart = ref(false)
    const canEnd = ref(false)
    const overflowing = ref(false)
    const ready = ref(false)
    const measuring = ref(false) // mientras se mide: todas las pestañas, etiquetas completas, alineación al inicio
    const autoReduced = ref(false) // labelMode="auto": las inactivas pasan a solo icono
    const visibleIds = ref(null) // overflow="more": ids dentro de la barra (null = todas)
    const mark = ref({ x: 0, y: 0, w: 0, h: 0 })
    const moreOpen = ref(false)
    const liveText = ref('')

    // ---------- Valores efectivos ----------
    const threshold = computed(() => spacePx.value * 120)
    const orientation = computed(() => {
      let o = props.orientation
      if (o === 'vertical' && (props.appearance === 'segmented' || props.appearance === 'contained')) o = 'horizontal'
      if (o === 'vertical' && props.responsive === 'auto' && containerW.value > 0 && containerW.value < threshold.value) o = 'horizontal'
      return o
    })
    const vertical = computed(() => orientation.value === 'vertical')
    const overflowMode = computed(() => {
      if (vertical.value || props.appearance === 'segmented') return 'scroll'
      if (props.overflow === 'more' && !(props.labels && props.labels.more)) return 'scroll'
      return props.overflow
    })
    const moreWanted = computed(() => overflowMode.value === 'more')
    const allIcons = computed(() => entries.value.length > 0 && entries.value.every(tabHasIcon))
    const autoWanted = computed(() => props.labelMode === 'auto' && allIcons.value && !vertical.value)
    const alignMode = computed(() => {
      if (measuring.value) return 'start'
      return overflowing.value && props.align !== 'start' ? 'start' : props.align
    })
    // Una pestaña «tiene icono» con slot `icon` e `item.icon` con valor, o sin slot e `item.icon` cadena (tabs.md, #202)
    function tabHasIcon(e) { return slots.icon ? hasIconValue(e.icon) : isIconName(e.icon) }

    const iconOnlyOf = (e, active) => {
      if (!tabHasIcon(e)) return false // sin icono, conserva su etiqueta visible
      if (props.labelMode === 'icon') return true
      if (props.labelMode === 'auto' && autoReduced.value && !active) return true
      return false
    }
    const anyIconOnly = computed(() => {
      if (props.labelMode === 'icon') return entries.value.some(tabHasIcon)
      return props.labelMode === 'auto' && autoReduced.value
    })

    // Qué pestañas se dibujan en el tablist
    const rendered = computed(() => {
      const all = entries.value
      if (!moreWanted.value || measuring.value || !visibleIds.value) return all
      return all.filter((e) => visibleIds.value.has(e.id))
    })
    const hidden = computed(() => (moreWanted.value && !measuring.value && visibleIds.value ? entries.value.filter((e) => !visibleIds.value.has(e.id)) : []))

    // ---------- Avisos de validación ----------
    function validate() {
      if (!isDev) return
      if (!props.label && !props.labelledby) warnOnce('name', 'necesita `label` o `labelledby` para nombrar el tablist (los textos los pone la aplicación).')
      const raws = Array.isArray(props.items) ? props.items : []
      if (!raws.length) warnOnce('empty', 'no recibió `items`: no dibuja el tablist (usa el slot `empty`).')
      const seen = new Set()
      for (const raw of raws) {
        if (!raw || typeof raw !== 'object' || raw.id === undefined || raw.id === null || raw.id === '') { warnOnce('id', 'ignora una pestaña sin `id` (el `id` es obligatorio y único).'); continue }
        if (seen.has(raw.id)) { warnOnce(`dup-${raw.id}`, `ignora la pestaña repetida con id «${raw.id}» (los ids son únicos).`); continue }
        seen.add(raw.id)
        if (typeof raw.label !== 'string' || !raw.label) warnOnce(`label-${raw.id}`, `la pestaña «${raw.id}» necesita \`label\` (es su nombre accesible).`)
        if (raw.count !== undefined && raw.count !== null && !raw.countLabel) warnOnce(`count-${raw.id}`, `la pestaña «${raw.id}» tiene \`count\` sin \`countLabel\` (texto accesible obligatorio).`)
        if (raw.status && !raw.statusLabel) warnOnce(`status-${raw.id}`, `la pestaña «${raw.id}» tiene \`status\` sin \`statusLabel\` (texto accesible obligatorio).`)
        if (raw.status && raw.status !== 'loading' && raw.status !== 'attention') warnOnce(`statusv-${raw.id}`, `la pestaña «${raw.id}» tiene un \`status\` desconocido («${raw.status}»): usa loading o attention.`)
        const secondary = [raw.status, raw.badge, raw.count !== undefined && raw.count !== null ? raw.count : undefined].filter((v) => v !== undefined && v !== null && v !== '').length
        if (secondary > 1) warnOnce(`secondary-${raw.id}`, `la pestaña «${raw.id}» combina más de una información secundaria (estado, insignia, contador): usa solo una.`)
        if (raw.closable !== undefined || raw.closeLabel !== undefined) warnOnce('closable', '`closable` y `closeLabel` están reservados y no se publican en v0.1: se ignoran.')
        if ((props.labelMode === 'icon' || props.labelMode === 'auto') && !tabHasIcon(raw)) warnOnce('labelmode-icon', '`labelMode` solo icono necesita `icon` en cada pestaña (un nombre de Lucide, o cualquier valor con el slot `icon`); la que no lo tenga conserva su etiqueta visible.')
      }
      if (raws.length && props.modelValue !== undefined && props.modelValue !== null) {
        const hit = raws.find((r) => r && r.id === props.modelValue)
        if (!hit) warnOnce('model-unknown', `\`modelValue\` («${String(props.modelValue)}») no coincide con ninguna pestaña: ninguna queda activa.`)
        else if (hit.disabled) warnOnce('model-disabled', `\`modelValue\` («${String(props.modelValue)}») apunta a una pestaña deshabilitada: ninguna queda activa.`)
      }
      if (props.orientation === 'vertical' && (props.appearance === 'segmented' || props.appearance === 'contained')) warnOnce('vertical', `\`appearance="${props.appearance}"\` no admite \`orientation="vertical"\`: se dibuja horizontal.`)
      if (props.appearance === 'segmented' && entries.value.length > 6) warnOnce('segmented-count', '`appearance="segmented"` está pensado para 2 a 6 opciones; con más, degrada a scroll.')
      if (props.overflow === 'more' && !(props.labels && props.labels.more)) warnOnce('more', '`overflow="more"` necesita `labels.more` (nombre del botón «Más»); sin él cae a `scroll`.')
      if (entries.value.some((e) => e.status === 'loading') && !(props.labels && props.labels.loading)) warnOnce('loading', 'hay una pestaña en `loading` sin `labels.loading`: no se anuncia el inicio de la carga.')
    }
    watch(() => [props.items, props.modelValue, props.labelMode, props.appearance, props.orientation, props.overflow, props.labels, props.label, props.labelledby], validate, { immediate: true, deep: true })

    // ---------- Dirección del cambio de activa (tabs.md «Personalidad», #302) ----------
    // `forward` / `back` según el orden lógico de `items` (el del DOM; en RTL lo espeja el CSS con `--_dir`).
    // Watcher `pre`: queda escrita en el mismo render que cambia la activa, por cualquier vía (clic, teclado,
    // «Más», `modelValue` externo). Ausente al montar y sin activa anterior; se conserva hasta el siguiente cambio.
    const direction = ref(undefined)
    watch(activeId, (now, before) => {
      if (now === undefined) return
      const from = before === undefined ? -1 : indexOf(before)
      const to = indexOf(now)
      direction.value = from < 0 || to < 0 || from === to ? undefined : to > from ? 'forward' : 'back'
      // `detached` con el GTabPanel antes que el GTabs en el árbol: ese panel ya se mostró en este ciclo y la copiará
      // después; se le adelanta aquí para que ninguna medición intermedia lo vea visible sin dirección
      if (props.detached && typeof document !== 'undefined') {
        const panel = document.getElementById(panelDomId(rootId.value, now))
        if (panel && !panel.hidden) {
          if (direction.value) panel.setAttribute('data-direction', direction.value)
          else panel.removeAttribute('data-direction')
          panel.setAttribute('data-orientation', orientation.value)
        }
      }
    })

    // ---------- Panel: ¿tiene algo enfocable? ----------
    const mounted = ref(new Set())
    watch(activeId, (id) => { if (id !== undefined && !mounted.value.has(id)) mounted.value = new Set([...mounted.value, id]) }, { immediate: true })
    const panelFocus = reactive({})
    const evalPanel = () => {
      const id = activeId.value
      if (id === undefined || typeof document === 'undefined') return
      const el = document.getElementById(panelDomId(rootId.value, id))
      if (el) panelFocus[id] = hasFocusable(el)
    }
    watch(activeId, () => nextTick(evalPanel), { flush: 'post' })

    // ---------- Anuncios (loading / loaded) ----------
    let prevLoading = new Map()
    const loadingMap = computed(() => new Map(entries.value.map((e) => [e.id, e.status === 'loading'])))
    watch(loadingMap, (now) => {
      const parts = []
      const L = props.labels || {}
      for (const e of entries.value) {
        const was = prevLoading.get(e.id)
        if (now.get(e.id) && was === false) { if (L.loading) parts.push(fill(L.loading, { label: labelOf(e) })) }
        else if (!now.get(e.id) && was === true && L.loaded) parts.push(fill(L.loaded, { label: labelOf(e) }))
      }
      prevLoading = now
      if (parts.length) liveText.value = parts.join('. ')
    }, { flush: 'post' })
    // El estado inicial no se anuncia (la región existe antes del cambio): se registra sin avisar
    prevLoading = new Map(loadingMap.value)

    // ---------- Medición ----------
    let ro = null
    let observedScroller = null
    let observedList = null
    let animHost = null
    let unmounted = false
    const listEl = () => rootEl.value?.querySelector('.g-tabs__list') || null
    const headerEl = () => rootEl.value?.querySelector('.g-tabs__header') || null
    const tabEls = () => (listEl() ? [...listEl().querySelectorAll('[role="tab"]')] : [])

    function refreshCues() {
      const sc = scrollerEl.value
      if (!sc) return
      const v = vertical.value
      const pos = Math.abs(v ? sc.scrollTop : sc.scrollLeft)
      const max = v ? sc.scrollHeight - sc.clientHeight : sc.scrollWidth - sc.clientWidth
      const start = pos > 1
      const end = max - pos > 1
      if (start !== canStart.value) canStart.value = start
      if (end !== canEnd.value) canEnd.value = end
      const over = max > 1 || hidden.value.length > 0
      if (over !== overflowing.value) overflowing.value = over
    }

    let readyScheduled = false
    function scheduleReady() {
      if (ready.value || readyScheduled) return
      readyScheduled = true
      const raf = typeof requestAnimationFrame === 'function' ? requestAnimationFrame : (f) => setTimeout(f, 16)
      raf(() => raf(() => { readyScheduled = false; if (!unmounted) ready.value = true }))
    }

    // Convención de la marca (tabs.md): px, caja de relleno del scroller, con su desplazamiento; en RTL, x desde la derecha
    function refreshMark() {
      const sc = scrollerEl.value
      const list = listEl()
      if (!sc || !list) return
      const tab = list.querySelector('[role="tab"][aria-selected="true"]')
      let next = { x: 0, y: 0, w: 0, h: 0 }
      if (tab) {
        const a = sc.getBoundingClientRect()
        const b = tab.getBoundingClientRect()
        // Compensa una transformación del anfitrión (p. ej. la entrada de un diálogo)
        const kx = sc.offsetWidth && a.width ? a.width / sc.offsetWidth : 1
        const ky = sc.offsetHeight && a.height ? a.height / sc.offsetHeight : 1
        const rtl = isRtl(rootEl.value)
        const x = rtl ? (a.right - b.right) / kx - sc.scrollLeft : (b.left - a.left) / kx - sc.clientLeft + sc.scrollLeft
        const y = (b.top - a.top) / ky - sc.clientTop + sc.scrollTop
        next = { x, y, w: b.width / kx, h: b.height / ky }
      }
      const cur = mark.value
      if (Math.abs(cur.x - next.x) > 0.01 || Math.abs(cur.y - next.y) > 0.01 || Math.abs(cur.w - next.w) > 0.01 || Math.abs(cur.h - next.h) > 0.01) mark.value = next
      if (tab) scheduleReady()
    }
    const refresh = () => { refreshCues(); refreshMark() }

    function readSpace() {
      const el = rootEl.value
      if (!el || typeof getComputedStyle !== 'function') return 4
      const raw = getComputedStyle(el).getPropertyValue('--g-space-1').trim()
      const n = parseFloat(raw)
      if (!(n > 0)) return 4
      if (/rem$/.test(raw)) return n * (parseFloat(getComputedStyle(document.documentElement).fontSize) || 16)
      if (/em$/.test(raw)) return n * (parseFloat(getComputedStyle(el).fontSize) || 16)
      return n
    }

    // Mide con todas las pestañas y las etiquetas completas: decide labelMode="auto" y los ids que caben en «Más»
    async function dance() {
      autoReduced.value = false
      measuring.value = true
      await nextTick()
      const hdr = headerEl()
      const list = listEl()
      if (!hdr || !list) { measuring.value = false; return }
      const measure = () => {
        const els = tabEls()
        const cs = getComputedStyle(list)
        return {
          els,
          widths: els.map((t) => t.offsetWidth),
          gap: parseFloat(cs.columnGap) || 0,
          pad: (parseFloat(cs.paddingInlineStart) || 0) + (parseFloat(cs.paddingInlineEnd) || 0)
        }
      }
      const total = (m, ws = m.widths) => m.pad + ws.reduce((s, w) => s + w, 0) + m.gap * Math.max(0, ws.length - 1)
      let m = measure()
      const edges = [...hdr.querySelectorAll('.g-tabs__edge')].reduce((s, b) => s + b.offsetWidth, 0)
      if (autoWanted.value && total(m) > hdr.clientWidth - edges + 1) {
        autoReduced.value = true
        await nextTick()
        m = measure()
      }
      let chosen = null
      if (moreWanted.value) {
        const btn = hdr.querySelector('.g-tabs__more')
        const moreW = btn ? btn.offsetWidth + (parseFloat(getComputedStyle(btn).marginInlineStart) || 0) : 0
        if (total(m) > hdr.clientWidth + 1) {
          const avail = hdr.clientWidth - moreW
          const ids = m.els.map((el) => entries.value.find((e) => tabDomId(rootId.value, e.id) === el.id)?.id)
          const act = activeId.value
          const picked = new Set()
          let sum = m.pad
          let count = 0
          const add = (i) => { sum += m.widths[i] + (count ? m.gap : 0); count++; picked.add(ids[i]) }
          if (act !== undefined && ids.includes(act)) add(ids.indexOf(act))
          for (let i = 0; i < ids.length; i++) {
            if (picked.has(ids[i])) continue
            if (sum + m.widths[i] + (count ? m.gap : 0) > avail) break
            add(i)
          }
          if (!picked.size && ids.length) picked.add(tabbableId.value ?? ids[0])
          chosen = picked
        }
      }
      const same = (a, b) => (a === null && b === null) || (a && b && a.size === b.size && [...a].every((x) => b.has(x)))
      if (!same(chosen, visibleIds.value)) visibleIds.value = chosen
      measuring.value = false
    }

    let fitting = false
    let again = false
    async function fit() {
      if (unmounted || !rootEl.value) return
      if (fitting) { again = true; return }
      fitting = true
      try {
        do {
          again = false
          spacePx.value = readSpace()
          const w = rootEl.value.clientWidth
          if (w !== containerW.value) { containerW.value = w; await nextTick() }
          if (!rootEl.value) break
          if (moreWanted.value || autoWanted.value) await dance()
          else {
            if (visibleIds.value !== null) visibleIds.value = null
            if (autoReduced.value) autoReduced.value = false
          }
          await nextTick()
          if (!rootEl.value) break
          refresh()
        } while (again && !unmounted)
      } finally { fitting = false }
    }

    // La activa siempre queda visible: se desplaza el scroller (nunca la página)
    function reveal(tab, instant) {
      const sc = scrollerEl.value
      if (!sc || !tab || typeof sc.scrollBy !== 'function') return
      const cs = getComputedStyle(sc)
      const pad = parseFloat(vertical.value ? cs.scrollPaddingBlockStart : cs.scrollPaddingInlineStart) || 0
      const a = sc.getBoundingClientRect()
      const b = tab.getBoundingClientRect()
      let d = 0
      if (vertical.value) d = b.top < a.top + pad ? b.top - (a.top + pad) : b.bottom > a.bottom - pad ? b.bottom - (a.bottom - pad) : 0
      else d = b.left < a.left + pad ? b.left - (a.left + pad) : b.right > a.right - pad ? b.right - (a.right - pad) : 0
      if (!d) return
      sc.scrollBy({ [vertical.value ? 'top' : 'left']: d, behavior: instant || reduceMotion() ? 'auto' : 'smooth' })
    }
    const revealActive = (instant) => {
      const tab = listEl()?.querySelector('[role="tab"][aria-selected="true"]')
      if (tab) reveal(tab, instant)
    }

    onMounted(() => {
      unmounted = false
      if (typeof ResizeObserver !== 'undefined') {
        ro = new ResizeObserver(() => fit())
        ro.observe(rootEl.value)
        if (scrollerEl.value) { ro.observe(scrollerEl.value); observedScroller = scrollerEl.value }
        observedList = listEl()
        if (observedList) ro.observe(observedList) // el ancho de las pestañas cambia (p. ej. otra fuente) sin cambiar raíz ni scroller
      }
      if (typeof document !== 'undefined' && document.fonts) {
        document.fonts.ready?.then(() => fit())
        document.fonts.addEventListener?.('loadingdone', fit)
      }
      // Dentro de un diálogo, la entrada anima una transformación: se vuelve a medir cuando termina
      animHost = rootEl.value?.closest?.('dialog') || null
      animHost?.addEventListener('animationend', refresh)
      evalPanel()
      fit().then(() => revealActive(true))
    })
    onUpdated(() => {
      if (ro && scrollerEl.value !== observedScroller) {
        if (observedScroller) ro.unobserve(observedScroller)
        if (scrollerEl.value) ro.observe(scrollerEl.value)
        observedScroller = scrollerEl.value
      }
      if (ro && listEl() !== observedList) {
        if (observedList) ro.unobserve(observedList)
        observedList = listEl()
        if (observedList) ro.observe(observedList)
      }
      refresh()
    })
    onBeforeUnmount(() => {
      unmounted = true
      ro?.disconnect()
      animHost?.removeEventListener('animationend', refresh)
      if (typeof document !== 'undefined') document.fonts?.removeEventListener?.('loadingdone', fit)
    })

    // Cambios que obligan a medir de nuevo
    const layoutSig = computed(() => JSON.stringify([
      entries.value.map((e) => [e.id, e.label, e.disabled, e.count, e.badge, e.status, tabHasIcon(e)]),
      props.density, props.appearance, props.orientation, props.overflow, props.labelMode, props.responsive, props.align, props.labels?.more, activeId.value
    ]))
    watch(layoutSig, () => fit(), { flush: 'post' })
    // Sin animar el cambio de apariencia, densidad u orientación: la marca salta y vuelve a animar
    watch([() => props.appearance, () => props.density, orientation], () => {
      ready.value = false
      readyScheduled = false
      nextTick(() => { refreshMark(); scheduleReady() })
    }, { flush: 'post' })
    // Un cambio de modelValue desde fuera desplaza la lista para mostrar la activa (sin foco ni evento)
    watch(activeId, () => nextTick(() => revealActive(false)), { flush: 'post' })

    // ---------- Activar ----------
    const focusTab = (el) => {
      if (!el) return
      el.focus({ preventScroll: true })
      reveal(el, false)
    }
    const tabElOf = (id) => tabEls().find((el) => el.id === tabDomId(rootId.value, id))
    const idOfEl = (el) => entries.value.find((e) => tabDomId(rootId.value, e.id) === el.id)?.id

    // Emite `change` (cancelable) y, si nadie lo impide, `update:modelValue`. Devuelve si se activó.
    function activate(id, source) {
      const index = indexOf(id)
      const item = entries.value[index]
      if (!item || item.disabled || props.disabled || id === activeId.value) return false
      let prevented = false
      emit('change', {
        id,
        index,
        source,
        preventDefault() { prevented = true },
        get defaultPrevented() { return prevented }
      })
      if (prevented) return false
      emit('update:modelValue', id)
      return true
    }
    const onClick = (e, item) => {
      if (props.disabled) return
      activate(item.id, 'pointer')
    }

    // ---------- Teclado ----------
    const isDisabledEl = (el) => el.getAttribute('aria-disabled') === 'true'
    function onKeydown(e) {
      const el = e.target.closest?.('[role="tab"]')
      if (!el || e.ctrlKey || e.metaKey || e.altKey) return
      if (props.disabled) return
      const all = tabEls()
      const enabled = all.filter((t) => !isDisabledEl(t) && entries.value.find((x) => x.id === idOfEl(t))?.disabled !== true)
      const from = all.indexOf(el)
      const rtl = isRtl(rootEl.value)
      const v = vertical.value
      const next = v ? 'ArrowDown' : rtl ? 'ArrowLeft' : 'ArrowRight'
      const prev = v ? 'ArrowUp' : rtl ? 'ArrowRight' : 'ArrowLeft'
      const k = e.key
      let target = null
      const step = (dir) => {
        for (let n = 1; n <= all.length; n++) {
          const cand = all[(((from + dir * n) % all.length) + all.length) % all.length]
          if (enabled.includes(cand)) return cand
        }
        return null
      }
      if (k === next) target = step(1)
      else if (k === prev) target = step(-1)
      else if (k === 'Home') target = enabled[0] || null
      else if (k === 'End') target = enabled[enabled.length - 1] || null
      else if (k === 'Enter' || k === ' ') {
        e.preventDefault()
        const id = idOfEl(el)
        if (id !== undefined) activate(id, 'keyboard')
        return
      } else return
      e.preventDefault()
      if (!target || target === el) return
      if (props.activation === 'manual') { focusTab(target); return }
      // auto: enfocar activa. Si `change` se cancela, ni el valor ni el foco se mueven.
      const id = idOfEl(target)
      if (id === activeId.value) { focusTab(target); return }
      if (activate(id, 'keyboard')) focusTab(target)
    }
    // Espacio activa en keydown; se evita el clic sintético que algunos motores lanzan al soltarlo
    const onKeyup = (e) => { if (e.key === ' ' && e.target.closest?.('[role="tab"]')) e.preventDefault() }

    // ---------- Rueda y botones de borde ----------
    function onWheel(e) {
      if (overflowMode.value !== 'scroll' || vertical.value) return
      const sc = scrollerEl.value
      if (!sc || sc.scrollWidth <= sc.clientWidth + 1) return
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return
      const rtl = isRtl(rootEl.value)
      const max = sc.scrollWidth - sc.clientWidth
      const pos = Math.abs(sc.scrollLeft)
      const toEnd = e.deltaY > 0
      if (toEnd ? pos >= max - 1 : pos <= 1) return // en el tope: la página sigue desplazándose
      const dx = e.deltaY * (e.deltaMode === 1 ? 16 : 1) * (rtl ? -1 : 1)
      e.preventDefault()
      sc.scrollLeft += dx
    }
    function onEdge(dir) {
      const sc = scrollerEl.value
      if (!sc || typeof sc.scrollBy !== 'function') return
      sc.scrollBy({ left: dir * sc.clientWidth * 0.6 * (isRtl(rootEl.value) ? -1 : 1), behavior: reduceMotion() ? 'auto' : 'smooth' })
    }

    // ---------- Menú «Más» ----------
    let focusAfterMenu
    function onMenuSelect(payload) {
      const id = payload.id
      if (id === activeId.value || activate(id, 'menu')) focusAfterMenu = id
    }
    function onMenuClosed() {
      if (focusAfterMenu === undefined) return
      const id = focusAfterMenu
      focusAfterMenu = undefined
      // Por encima de la devolución de foco de GMenu (al botón): la pestaña elegida entra en la barra y recibe el foco
      setTimeout(async () => {
        if (unmounted) return
        await fit()
        focusTab(tabElOf(id))
      }, 0)
    }

    // ---------- Marcado ----------
    const secondaryOf = (e) => {
      const out = []
      if (e.count !== undefined && e.count !== null) out.push(h(GBadge, { variant: 'soft', color: 'neutral', size: 'sm', count: e.count, label: e.countLabel || undefined }))
      else if (e.badge) out.push(h(GBadge, { variant: 'soft', color: 'neutral', size: 'sm', label: e.badgeLabel || undefined }, () => e.badge))
      return out
    }
    const statusOf = (e) => (e.status === 'loading' || e.status === 'attention' ? e.status : null)
    const statusParts = (status, text, key) => [
      h('span', { class: 'g-tabs__status', 'aria-hidden': 'true', key: `${key}-i` }, [h(GIcon, { name: status === 'loading' ? 'loader-circle' : 'circle-alert' })]),
      text ? h('span', { class: 'g-tabs__sr', key: `${key}-t` }, `, ${text}`) : null
    ]

    const renderTab = (e, index, setsize) => {
      const active = e.id === activeId.value
      const status = statusOf(e)
      const iconOnly = iconOnlyOf(e, active)
      const label = labelOf(e)
      const ctx = { item: e, index, active }
      const mountedPanel = props.detached || !props.lazy || mounted.value.has(e.id)
      const children = []
      if (slots.icon && hasIconValue(e.icon)) children.push(h('span', { class: 'g-tabs__icon', 'aria-hidden': 'true' }, slots.icon(ctx)))
      else if (!slots.icon && isIconName(e.icon)) children.push(h('span', { class: 'g-tabs__icon', 'aria-hidden': 'true' }, [h(GAppIcon, { name: e.icon })]))
      children.push(h('span', { class: 'g-tabs__label', 'data-text': label }, slots.label ? slots.label(ctx) : label))
      if (status) children.push(...statusParts(status, e.statusLabel, e.id))
      children.push(...secondaryOf(e))
      // Con el slot `label` el nombre sigue saliendo de `item.label`
      const name = slots.label
        ? [label, status && e.statusLabel, e.count !== undefined && e.count !== null && e.count !== 0 ? e.countLabel : null, e.badge ? e.badgeLabel || e.badge : null].filter(Boolean).join(', ')
        : undefined
      return h('button', {
        key: e.id,
        type: 'button',
        role: 'tab',
        id: tabDomId(rootId.value, e.id),
        class: cls('g-tabs__tab', active && 'is-active', e.disabled && 'is-disabled', status === 'loading' && 'is-loading', status === 'attention' && 'is-attention', iconOnly && 'is-icon-only'),
        'aria-selected': active ? 'true' : 'false',
        'aria-controls': mountedPanel ? panelDomId(rootId.value, e.id) : undefined,
        'aria-disabled': e.disabled || props.disabled ? 'true' : undefined,
        'aria-label': name,
        'aria-setsize': setsize ? entries.value.length : undefined,
        'aria-posinset': setsize ? index + 1 : undefined,
        tabindex: e.id === tabbableId.value ? 0 : -1,
        onClick: (ev) => onClick(ev, e),
        onFocus: (ev) => reveal(ev.currentTarget, false)
      }, children)
    }

    const renderEdge = (dir) => h('button', {
      class: ['g-tabs__edge', dir < 0 ? 'g-tabs__edge--prev' : 'g-tabs__edge--next'],
      type: 'button',
      tabindex: -1,
      'aria-hidden': 'true',
      onClick: () => onEdge(dir)
    }, [h(GIcon, { name: dir < 0 ? 'chevron-left' : 'chevron-right' })])

    const renderMore = () => {
      const L = props.labels || {}
      const list = hidden.value
      const flagged = list.find((e) => e.status === 'attention') || list.find((e) => e.status === 'loading')
      const flag = flagged && statusOf(flagged)
      const items = entries.value.map((e) => ({ type: 'radio', id: e.id, label: labelOf(e), checked: e.id === activeId.value, disabled: Boolean(e.disabled || props.disabled) }))
      return h(GMenu, {
        modelValue: moreOpen.value,
        'onUpdate:modelValue': (v) => { moreOpen.value = v },
        items,
        label: L.menu || undefined,
        align: 'end',
        closeOnSelect: 'always',
        onSelect: onMenuSelect,
        onClosed: onMenuClosed
      }, {
        trigger: ({ attrs: t }) => h('button', {
          ...t,
          class: 'g-tabs__more',
          type: 'button',
          'aria-label': flag && flagged.statusLabel ? `${L.more}, ${flagged.statusLabel}` : L.more
        }, [
          h(GIcon, { name: 'chevron-down' }),
          flag ? h('span', { class: 'g-tabs__status', 'aria-hidden': 'true' }, [h(GIcon, { name: flag === 'loading' ? 'loader-circle' : 'circle-alert' })]) : null
        ])
      })
    }

    const renderPanels = () => h('div', { class: 'g-tabs__panels' }, entries.value.map((e) => {
      if (props.lazy && !mounted.value.has(e.id)) return null // sin montar: no se renderiza (y su pestaña no lleva aria-controls)
      const active = e.id === activeId.value
      const slot = slots[`panel-${e.id}`] || slots.panel
      return h('div', {
        key: e.id,
        class: 'g-tabs__panel',
        role: 'tabpanel',
        id: panelDomId(rootId.value, e.id),
        'aria-labelledby': tabDomId(rootId.value, e.id),
        tabindex: active && !panelFocus[e.id] ? 0 : undefined,
        hidden: active ? undefined : true,
        'aria-busy': active && e.status === 'loading' ? 'true' : undefined
      }, slot ? slot({ item: e, active }) : undefined)
    }))

    return () => {
      const list = rendered.value
      const setsize = hidden.value.length > 0
      const o = orientation.value
      const rootClass = cls(
        'g-tabs',
        `g-tabs--appearance-${props.appearance}`,
        `g-tabs--orientation-${o}`,
        `g-tabs--color-${props.color}`,
        `g-tabs--density-${props.density}`,
        `g-tabs--align-${alignMode.value}`,
        `g-tabs--overflow-${overflowMode.value}`,
        anyIconOnly.value && 'g-tabs--icon-only',
        props.snap && 'g-tabs--snap',
        ready.value && 'is-ready',
        props.disabled && 'is-disabled',
        canStart.value && 'is-scrollable-start',
        canEnd.value && 'is-scrollable-end'
      )
      const m = mark.value
      const rootProps = mergeProps(attrs, {
        ref: (el) => { rootEl.value = el },
        id: rootId.value,
        class: rootClass,
        'data-direction': direction.value,
        // Orientación real del diseño (#306): la de `aria-orientation`; GTabPanel la copia al activarse
        'data-orientation': o,
        style: { '--_mark-x': px(m.x), '--_mark-y': px(m.y), '--_mark-w': px(m.w), '--_mark-h': px(m.h) }
      })

      const out = []
      if (!entries.value.length) {
        out.push(slots.empty ? slots.empty() : null)
      } else {
        const arrows = overflowMode.value === 'arrows'
        out.push(h('div', { class: 'g-tabs__header' }, [
          arrows ? renderEdge(-1) : null,
          h('div', { class: 'g-tabs__scroller', ref: (el) => { scrollerEl.value = el }, onScroll: refreshCues, onWheel }, [
            h('div', {
              class: 'g-tabs__list',
              role: 'tablist',
              'aria-orientation': o,
              'aria-label': props.label || undefined,
              'aria-labelledby': props.label ? undefined : props.labelledby || undefined,
              onKeydown,
              onKeyup
            }, list.map((e) => renderTab(e, indexOf(e.id), setsize))),
            h('span', { class: 'g-tabs__mark', 'aria-hidden': 'true' })
          ]),
          arrows ? renderEdge(1) : null,
          moreWanted.value && (hidden.value.length > 0 || measuring.value) ? renderMore() : null
        ]))
        if (!props.detached) out.push(renderPanels())
      }
      out.push(h('div', { class: 'g-tabs__live', role: 'status' }, liveText.value))
      return h('div', rootProps, out)
    }
  }
})
</script>
