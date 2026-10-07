// XAccordion / XAccordionItem: PROTOTIPO de kiwi para la ronda r01 del acordeón (no es el componente; eso es de bruno).
// Propone estructura y comportamiento: h{N} > button[aria-expanded][aria-controls] + contenido role="region" (regla de
// APG) con hidden="until-found" cuando está plegado y asentado; rejilla 0fr → 1fr (el motor de GFormSection/GFormReveal);
// Δ0 del encabezado que se toca; flechas entre encabezados; v-model de abiertos; carga diferida; #hash; OPEN_REQUEST.
// Conceptos: base · A «Avance» · B «Hilo» · C «Índice». Los valores de forma salen de los tokens reales del tema.
(function () {
  const { defineComponent, ref, computed, provide, inject, onMounted, onBeforeUnmount, nextTick, watch, getCurrentInstance } = Vue
  const KEY = Symbol('x-accordion')
  const OPEN_REQUEST = 'g-open-request' // el mismo evento interno que usa GForm para abrir GFormSection (#287)
  let uid = 0
  const icon = (n, cls = '', filled = false) => window.lucide(n, cls, filled)
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches
  const nextFrame = (fn) => requestAnimationFrame(() => requestAnimationFrame(fn))
  function transitionMs(el) { // igual que utils/motion.js
    if (!el) return 0
    const cs = getComputedStyle(el)
    const list = (v) => String(v || '').split(',').map((x) => { const n = parseFloat(x); return Number.isFinite(n) ? (x.trim().endsWith('ms') ? n : n * 1000) : 0 })
    const d = list(cs.transitionDuration), dl = list(cs.transitionDelay)
    return d.reduce((m, v, i) => Math.max(m, v + (dl[i % dl.length] || 0)), 0)
  }
  // Registro de medidas para la verificación (no es API)
  window.__acc = { log: [], mounts: {} }

  // ---------- Δ0: el encabezado que tocaste no se mueve ----------
  // Se mide su borde superior ANTES del cambio y, mientras dura el movimiento, cada cuadro desplaza la página lo que se
  // haya movido (en el mismo cuadro, antes de pintar). Sustituye al anclaje de desplazamiento del navegador
  // (overflow-anchor), que WebKit no tiene y que en Chromium/Firefox elige el ancla por su cuenta.
  let keepRaf = 0
  function keepInPlace(el, getMs, enabled) {
    if (!enabled || !el) return
    const y0 = el.getBoundingClientRect().top
    let end = 0
    cancelAnimationFrame(keepRaf)
    const step = () => {
      if (!end) end = performance.now() + getMs() + 80 // la duración se lee ya con el cambio aplicado
      const d = el.getBoundingClientRect().top - y0
      if (Math.abs(d) >= 0.5) window.scrollBy({ top: d, left: 0, behavior: 'instant' })
      if (performance.now() < end) keepRaf = requestAnimationFrame(step)
    }
    keepRaf = requestAnimationFrame(step)
  }

  // ---------- Grupo ----------
  const XAccordion = defineComponent({
    name: 'XAccordion',
    props: {
      modelValue: { type: Array, default: undefined },
      exclusive: { type: Boolean, default: false },
      headingLevel: { type: Number, default: 3 },
      arrows: { type: Boolean, default: true },
      concept: { type: String, default: 'base' },
      compensate: { type: Boolean, default: true }, // solo para enseñar el problema; en la propuesta siempre está
      sticky: { type: Boolean, default: undefined } // B lo trae por defecto
    },
    emits: ['update:modelValue'],
    setup(props, { emit }) {
      const root = ref(null)
      const local = ref(Array.isArray(props.modelValue) ? [...props.modelValue] : [])
      watch(() => props.modelValue, (v) => { if (Array.isArray(v)) local.value = props.exclusive ? v.slice(-1) : [...v] })
      const items = ref([]) // valores registrados, para la regla de region
      const sticky = computed(() => props.sticky ?? props.concept === 'B')
      // APG: role="region" salvo que haya más de ~6 paneles que puedan estar abiertos a la vez (proliferación de regiones)
      const regionOK = computed(() => props.exclusive || items.value.length <= 6)
      function isOpen(v) { return local.value.includes(v) }
      function set(v, open) {
        let next
        if (open) next = props.exclusive ? [v] : [...local.value.filter((x) => x !== v), v]
        else next = local.value.filter((x) => x !== v)
        // orden del documento, no de apertura: el modelo no depende de la historia
        const order = triggers().map((b) => b.closest('.x-acc__item').dataset.value)
        next.sort((a, b) => order.indexOf(a) - order.indexOf(b))
        local.value = next
        emit('update:modelValue', [...next])
      }
      function triggers() {
        return root.value ? [...root.value.querySelectorAll('.x-acc__trigger')].filter((b) => b.closest('.x-acc') === root.value) : []
      }
      // Flechas (APG Accordion, opcionales): ↓/↑ al encabezado siguiente/anterior, Inicio/Fin; sin vuelta al otro extremo.
      // Solo cuando el foco está en un encabezado del grupo (nunca dentro de un panel). Tab sigue pasando por todos.
      function onKeydown(e) {
        if (!props.arrows || e.altKey || e.ctrlKey || e.metaKey) return
        const list = triggers()
        const i = list.indexOf(e.target)
        if (i < 0) return
        let j = -1
        if (e.key === 'ArrowDown') j = Math.min(i + 1, list.length - 1)
        else if (e.key === 'ArrowUp') j = Math.max(i - 1, 0)
        else if (e.key === 'Home') j = 0
        else if (e.key === 'End') j = list.length - 1
        else return
        e.preventDefault()
        if (j !== i) list[j].focus()
      }
      provide(KEY, { props, isOpen, set, regionOK, sticky, items, root })
      return { root, onKeydown, sticky }
    },
    template: `<div ref="root" class="x-acc" :class="['x-acc--' + concept, { 'is-sticky': sticky, 'is-exclusive': exclusive }]" @keydown="onKeydown"><slot /></div>`
  })

  // ---------- Elemento ----------
  const XAccordionItem = defineComponent({
    name: 'XAccordionItem',
    props: {
      value: { type: String, default: undefined },
      id: { type: String, default: undefined },
      title: { type: String, default: '' },
      peek: { type: String, default: '' }, // A: avance (resumen o primera línea)
      meta: { type: String, default: '' }, // dato corto dentro del botón (no interactivo)
      disabled: { type: Boolean, default: false },
      lazy: { type: Boolean, default: false },
      headingLevel: { type: Number, default: undefined },
      open: { type: Boolean, default: undefined }, // suelto: v-model:open
      index: { type: Number, default: undefined } // C: número del índice (lo pondría el grupo)
    },
    emits: ['update:open'],
    setup(props, { emit, slots }) {
      const g = inject(KEY, null)
      const n = ++uid
      const baseId = props.id || `acc-${n}`
      const val = props.value || baseId
      const concept = computed(() => (g ? g.props.concept : 'base'))
      const level = computed(() => props.headingLevel || (g ? g.props.headingLevel : 3))
      const localOpen = ref(Boolean(props.open))
      watch(() => props.open, (v) => { if (v !== undefined) localOpen.value = v })
      const isOpen = computed(() => (g ? g.isOpen(val) : localOpen.value))
      const regionOK = computed(() => (g ? g.regionOK.value : true))
      const hiddenUF = ref(!isOpen.value)
      const everOpened = ref(isOpen.value)
      const animating = ref(false)
      const instant = ref(false)
      const ready = ref(false)
      const item = ref(null), btn = ref(null), panel = ref(null), content = ref(null)
      const hasPeek = computed(() => concept.value === 'A' && Boolean(props.peek || slots.peek))
      if (g) g.items.value.push(val)
      onBeforeUnmount(() => { if (g) g.items.value.splice(g.items.value.indexOf(val), 1) })

      let timer = 0
      function settle() {
        clearTimeout(timer); timer = 0
        animating.value = false
        if (!isOpen.value) hiddenUF.value = true // asentado y plegado: búsqueda en la página lo encuentra y lo abre
        window.__acc.log.push({ id: baseId, settled: isOpen.value ? 'open' : 'closed', t: performance.now() })
      }
      function onEnd(e) { if (e.target === panel.value && e.propertyName === 'grid-template-rows') settle() }
      watch(isOpen, (open, was) => {
        if (open === was) return
        if (open) { hiddenUF.value = false; everOpened.value = true }
        else if (content.value && content.value.contains(document.activeElement)) {
          // plegar con el foco dentro (por programa): al botón ANTES de ocultar; nunca a <body>
          btn.value && btn.value.focus({ preventScroll: true })
        }
        if (instant.value || !ready.value || reduced()) {
          animating.value = false
          if (!open) nextTick(() => { hiddenUF.value = true })
          nextFrame(() => { instant.value = false })
          return
        }
        animating.value = true
        nextTick(() => { clearTimeout(timer); timer = setTimeout(settle, transitionMs(panel.value) + 50) })
      })
      function request(open, { instant: inst = false, keep = true } = {}) {
        if (props.disabled) return
        const el = btn.value
        const header = el && el.closest('.x-acc__heading')
        // B: cerrar con el encabezado pegado y el principio del elemento fuera de la vista → sin animar, y el
        // encabezado se queda donde estaba (no te manda al final de lo que leías)
        const above = item.value && item.value.getBoundingClientRect().top < -1
        if (inst || (!open && above)) instant.value = true
        const getMs = () => (instant.value ? 0 : Math.max(...[...(g ? g.root.value : item.value).querySelectorAll('.x-acc__panel, .x-acc__rail-fill')].map(transitionMs), 0))
        const run = () => {
          if (g) g.set(val, open)
          else { localOpen.value = open; emit('update:open', open) }
        }
        if (concept.value === 'C' && g && !instant.value) { window.xFlip(g.root.value, run, header); return log(open) }
        if (keep) keepInPlace(header, getMs, g ? g.props.compensate : true)
        run()
        log(open)
      }
      function log(open) {
        window.__acc.log.push({ id: baseId, request: open, instant: instant.value, t: performance.now() })
      }
      function onClick() { if (!props.disabled) request(!isOpen.value) }
      // La página encontró texto aquí (Ctrl+F, #:~:text=, #id dentro): el navegador ya quitó hidden; abrir en el acto
      function onMatch() { if (!isOpen.value) request(true, { instant: true, keep: false }) }
      // GForm (o quien sea) pide abrir antes de enfocar un control de dentro (OPEN_REQUEST, #287)
      function onOpenRequest(e) { if (!isOpen.value) { request(true, { instant: true, keep: false }); e.preventDefault() } }
      // #hash con el id del elemento: abrir en el acto y llevar el encabezado a la vista (sin mover el foco)
      function onHash() {
        if (location.hash && decodeURIComponent(location.hash.slice(1)) === baseId) {
          if (!isOpen.value) request(true, { instant: true, keep: false })
          nextTick(() => item.value && item.value.scrollIntoView({ block: 'start', behavior: 'instant' }))
        }
      }
      onMounted(() => {
        window.__acc.mounts[baseId] = window.__acc.mounts[baseId] || 0
        onHash()
        window.addEventListener('hashchange', onHash)
        nextFrame(() => { ready.value = true })
      })
      onBeforeUnmount(() => { window.removeEventListener('hashchange', onHash); clearTimeout(timer) })
      const iconHtml = computed(() => {
        if (concept.value === 'B') return '<span class="x-acc__node">' + icon('plus', 'x-acc__node-plus') + icon('minus', 'x-acc__node-minus') + '</span>'
        return icon('chevron-right', 'x-acc__chevron')
      })
      const num = computed(() => (props.index != null ? String(props.index).padStart(2, '0') : ''))
      return { g, baseId, val, concept, level, isOpen, regionOK, hiddenUF, everOpened, animating, instant, ready, item, btn, panel, content, hasPeek, onEnd, onClick, onMatch, onOpenRequest, iconHtml, num }
    },
    template: `
<div ref="item" class="x-acc__item" :id="baseId" :data-value="val"
  :class="{ 'is-open': isOpen, 'is-animating': animating, 'is-instant': instant, 'is-ready': ready, 'is-disabled': disabled, 'has-peek': hasPeek, 'has-actions': !!$slots.actions }">
  <span v-if="concept === 'B'" class="x-acc__rail" aria-hidden="true"><span class="x-acc__rail-fill"></span></span>
  <component :is="'h' + level" class="x-acc__heading">
    <button ref="btn" type="button" class="x-acc__trigger" :id="baseId + '-btn'"
      :aria-expanded="isOpen ? 'true' : 'false'" :aria-controls="baseId + '-content'"
      :aria-disabled="disabled ? 'true' : undefined"
      :aria-describedby="hasPeek && !isOpen ? baseId + '-peek' : undefined"
      @click="onClick">
      <span v-if="num" class="x-acc__num" aria-hidden="true">{{ num }}</span>
      <span class="x-acc__icon" aria-hidden="true" v-html="iconHtml"></span>
      <span class="x-acc__title" dir="auto"><slot name="title">{{ title }}</slot></span>
      <span v-if="meta || $slots.meta" class="x-acc__meta"><slot name="meta">{{ meta }}</slot></span>
    </button>
  </component>
  <div v-if="$slots.actions" class="x-acc__actions"><slot name="actions" /></div>
  <p v-if="hasPeek" class="x-acc__peek" :id="baseId + '-peek'" dir="auto"><slot name="peek">{{ peek }}</slot></p>
  <div ref="panel" class="x-acc__panel" :inert="!isOpen && !hiddenUF ? '' : undefined" @transitionend="onEnd" @g-open-request="onOpenRequest">
    <div ref="content" class="x-acc__content" :id="baseId + '-content'"
      :role="regionOK ? 'region' : undefined" :aria-labelledby="regionOK ? baseId + '-btn' : undefined"
      :^hidden="hiddenUF ? 'until-found' : undefined" @beforematch="onMatch">
      <div class="x-acc__body"><slot v-if="!lazy || everOpened" /></div>
    </div>
  </div>
</div>`
  })

  // ---------- C: el índice reordena con FLIP y conserva la altura del encabezado tocado ----------
  // Lo hace la página para el prototipo (envuelve set del grupo); en el componente sería del grupo con layout="index".
  window.XAccordion = XAccordion
  window.XAccordionItem = XAccordionItem
  window.XAccordionKey = KEY
  window.xFlip = function xFlip(rootEl, run, clickedHeading) {
    const heads = [...rootEl.querySelectorAll(':scope > .x-acc__item > .x-acc__heading')]
    const before = new Map(heads.map((h) => [h, h.getBoundingClientRect()]))
    run()
    nextTick(() => {
      // 1) altura: lo que bajó o subió el encabezado tocado se compensa con el desplazamiento (Δ0 vertical)
      const nb = clickedHeading.getBoundingClientRect()
      const dy = nb.top - before.get(clickedHeading).top
      if (Math.abs(dy) >= 0.5) window.scrollBy({ top: dy, left: 0, behavior: 'instant' })
      if (reduced()) return
      // 2) lo demás viaja desde donde estaba (FLIP) con el muelle; el tocado solo se desliza en horizontal
      for (const h of heads) {
        const a = before.get(h), b = h.getBoundingClientRect()
        const ox = a.left - b.left, oy = a.top - b.top + (h === clickedHeading ? 0 : 0)
        if (Math.abs(ox) < 0.5 && Math.abs(oy) < 0.5) continue
        h.style.transition = 'none'
        h.style.translate = `${ox}px ${oy}px`
        h.getBoundingClientRect()
        h.style.transition = ''
        h.classList.add('is-flip')
        requestAnimationFrame(() => { h.style.translate = '' })
        h.addEventListener('transitionend', function done(ev) { if (ev.propertyName === 'translate') { h.classList.remove('is-flip'); h.removeEventListener('transitionend', done) } })
      }
    })
  }
})()
