// XSlider (kiwi, r01): prototipo del deslizador. Un solo núcleo (valores, límites, teclado, puntero, formulario) y cuatro
// formas: `concept="base"` (riel convencional, kit neutro), "A" (cinta), "B" (el valor es el asa), "C" (escalones con datos).
// Cada asa es un <input type="range" step="any"> NATIVO, invisible y del tamaño del asa, que da el rol, el ajuste de los
// lectores móviles y el foco; el teclado lo resuelve el componente (mismo resultado en los tres motores); el envío va en
// <input type="hidden">. Integra GForm con el `useFormField` real de @grana/vue. No es código de bruno: es referencia.
;(function () {
  const { defineComponent, ref, computed, watch, onMounted, onBeforeUnmount, nextTick } = Vue
  const { useFormField } = Grana
  const SL = window.SL

  const NAV = new Set(['Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown'])
  const TAP = 10 // px: más allá, el toque es un gesto (desplazar o arrastrar), no un toque
  const FINE_AT = 48 // px de separación vertical de la cinta (A) para el ajuste fino
  const FINE = 0.25
  const TYPE_MS = 900 // B: pausa que confirma lo tecleado

  // Modalidad de la última entrada (amplía utils/keyFocus.js, #441). Medido: los tres motores marcan :focus-visible en el
  // range enfocado por script tras un clic (Chromium, Firefox y WebKit), así que el anillo NO puede venir de :focus-visible.
  // Se pinta con `data-g-key-focus`: al recibir el foco si la última entrada fue una tecla (Tab, o Intro en el enlace del
  // resumen de errores) y al pulsar una tecla de navegación con el foco dentro; se quita con cualquier pointerdown.
  const MOD = new Set(['Shift', 'Alt', 'Control', 'Meta', 'AltGraph', 'CapsLock', 'Fn'])
  let byKey = false
  if (typeof document !== 'undefined') {
    document.addEventListener('keydown', (e) => { if (!MOD.has(e.key)) byKey = true }, true)
    document.addEventListener('pointerdown', () => { byKey = false }, true)
  }

  const XSlider = defineComponent({
    name: 'XSlider',
    props: {
      modelValue: { type: [Number, Array], default: null },
      range: Boolean,
      min: { type: Number, default: 0 },
      max: { type: Number, default: 100 },
      step: { type: Number, default: 1 },
      bigStep: Number,
      minGap: { type: Number, default: 0 },
      marks: { type: [Boolean, Array], default: false },
      snap: { type: String, default: 'step' },
      locale: String,
      format: Object,
      valueText: Function,
      labels: { type: Object, default: () => ({}) },
      name: String,
      label: String,
      hint: String,
      error: { type: String, default: undefined },
      required: Boolean,
      readonly: { type: Boolean, default: undefined },
      disabled: { type: Boolean, default: undefined },
      id: String,
      concept: { type: String, default: 'base' },
      distribution: Array,
      countText: Function,
      profile: { type: String, default: 'flat' },
      pxPerStep: Number
    },
    emits: ['update:modelValue', 'change'],
    setup(props, { emit }) {
      const root = ref(null)
      const area = ref(null)
      const natives = ref([])
      const C = computed(() => (props.concept === 'A' && props.range ? 'base' : props.concept))

      const ff = useFormField({
        name: () => props.name,
        id: () => props.id,
        error: () => props.error,
        required: () => props.required,
        readonly: () => props.readonly,
        disabled: () => props.disabled,
        control: () => natives.value[0] || null,
        root: () => root.value
      })
      const id = computed(() => ff.id.value)
      const ro = computed(() => ff.readonly.value)
      const dis = computed(() => ff.disabled.value)

      // ---- opciones del motor ----
      const marks = computed(() => {
        if (Array.isArray(props.marks)) return props.marks.map((m) => (typeof m === 'number' ? { value: m } : m))
        if (!props.marks) return []
        const n = Math.round((props.max - props.min) / props.step)
        const every = n <= 25 ? props.step : SL.bigStep({ ...props })
        const out = []
        for (let v = props.min; v <= props.max + 1e-9; v += every) out.push({ value: Number(v.toFixed(SL.dec(props.step))) })
        return out
      })
      // Idioma como GNumberField (#310): prop › `lang` del ancestro más cercano › navegador, leído al montar
      const langOf = ref('')
      const o = computed(() => ({
        min: props.min, max: props.max, step: props.step, bigStep: props.bigStep, minGap: props.minGap, marks: marks.value,
        snap: props.snap, locale: props.locale || langOf.value || undefined, format: props.format, valueText: props.valueText, emptyText: props.labels.empty || ''
      }))

      // ---- valores (copia local para responder en el acto; la aplicación manda) ----
      const norm = (mv) => {
        if (props.range) {
          const a = Array.isArray(mv) && mv.length === 2 && mv.every((x) => typeof x === 'number' && isFinite(x)) ? mv : [SL.bottom(o.value), SL.top(o.value)]
          return [Math.min(a[0], a[1]), Math.max(a[0], a[1])]
        }
        return [typeof mv === 'number' && isFinite(mv) ? mv : null]
      }
      const vals = ref(norm(props.modelValue))
      watch(() => props.modelValue, (mv) => { vals.value = norm(mv) }, { deep: true })
      const lim = (i) => SL.limits(vals.value, i, o.value)
      const empty = computed(() => !props.range && vals.value[0] === null)

      function set(i, v) {
        if (vals.value[i] === v) return false
        const next = vals.value.slice()
        next[i] = v
        vals.value = next
        emit('update:modelValue', props.range ? next.slice() : next[0])
        ff.handlers.onInput()
        return true
      }
      function setBoth(a, b) {
        if (vals.value[0] === a && vals.value[1] === b) return
        vals.value = [a, b]
        emit('update:modelValue', [a, b])
        ff.handlers.onInput()
      }
      // `change` una vez por gesto (soltar el puntero, soltar la tecla, un ajuste del lector), como GNumberField (#310)
      let gestureFrom = null
      const startGesture = () => { if (gestureFrom === null) gestureFrom = JSON.stringify(vals.value) }
      function endGesture() {
        if (gestureFrom === null) return
        const changed = gestureFrom !== JSON.stringify(vals.value)
        gestureFrom = null
        if (changed) {
          emit('change', props.range ? vals.value.slice() : vals.value[0])
          ff.notifyChange()
        }
      }

      // ---- textos ----
      const fmt = (v) => SL.format(v, o.value)
      const markOf = (v) => marks.value.find((m) => m.label && Math.abs(m.value - v) < 1e-9)
      const count = computed(() => {
        if (!props.distribution) return null
        const bins = props.distribution
        const w = (props.max - props.min) / bins.length
        const [a, b] = props.range ? vals.value : [props.min, vals.value[0] ?? props.min]
        let n = 0
        bins.forEach((c, k) => { const lo = props.min + k * w, hi = lo + w; if (hi > a + 1e-9 && lo < b - 1e-9) n += c })
        return { n, total: bins.reduce((s, c) => s + c, 0) }
      })
      const countLine = computed(() => (count.value && props.countText ? props.countText(count.value.n, count.value.total) : ''))
      const vtext = (i) => {
        const t = SL.valueText(vals.value[i], o.value)
        return C.value === 'C' && countLine.value && vals.value[i] !== null ? `${t}; ${countLine.value}` : t
      }
      const display = computed(() => {
        if (empty.value) return props.labels.empty || ''
        if (props.range) return [fmt(vals.value[0]), fmt(vals.value[1])]
        const m = markOf(vals.value[0])
        return m && m.label !== fmt(vals.value[0]) ? `${fmt(vals.value[0])} · ${m.label}` : fmt(vals.value[0])
      })
      const thumbName = (i) => (props.range ? (i === 0 ? props.labels.start : props.labels.end) : '')

      // ---- geometría ----
      const rtl = ref(false)
      const tw = ref(0) // ancho del área (riel, cinta o columnas)
      const pw = ref(0) // B: ancho de la píldora (la más ancha de sus textos posibles)
      const frac = (v) => Math.min(1, Math.max(0, (v - props.min) / (props.max - props.min || 1)))
      const discrete = computed(() => Math.round((SL.top(o.value) - props.min) / props.step) + 1 <= 40)
      const cells = computed(() => {
        if (C.value !== 'C') return []
        const n = discrete.value ? Math.round((SL.top(o.value) - props.min) / props.step) + 1 : props.distribution ? props.distribution.length : 24
        const dist = props.distribution
        const peak = dist ? Math.max(...dist, 1) : 1
        const out = []
        for (let k = 0; k < n; k++) {
          const lo = discrete.value ? props.min + k * props.step : props.min + (k * (props.max - props.min)) / n
          const hi = discrete.value ? lo : props.min + ((k + 1) * (props.max - props.min)) / n
          let hgt = 1
          if (dist) hgt = Math.max(0.06, (dist[Math.min(dist.length - 1, Math.floor((k / n) * dist.length))] || 0) / peak)
          else if (props.profile === 'rise') hgt = 0.22 + (0.78 * k) / Math.max(1, n - 1)
          const [a, b] = props.range ? vals.value : [props.min, vals.value[0]]
          const on = b !== null && (discrete.value ? lo >= a - 1e-9 && lo <= b + 1e-9 : hi > a + 1e-9 && lo < b - 1e-9)
          out.push({ k, lo, hgt, on, label: discrete.value ? markOf(lo)?.label : null })
        }
        return out
      })
      // Posición (0..1) del asa i en el área
      const posOf = (v) => {
        if (v === null) return 0.5
        if (C.value === 'C' && discrete.value) return (Math.round((v - props.min) / props.step) + 0.5) / cells.value.length
        return frac(v)
      }
      // B: dónde empieza cada píldora (px desde el borde inicial) y si las dos se juntan
      const pills = computed(() => {
        if (C.value !== 'B' || !tw.value || !pw.value) return null
        const span = Math.max(0, tw.value - pw.value)
        const centers = vals.value.map((v) => pw.value / 2 + frac(v ?? props.min) * span)
        if (props.range && centers[1] - centers[0] < pw.value) {
          const mid = Math.min(tw.value - pw.value, Math.max(pw.value, (centers[0] + centers[1]) / 2))
          return { merged: true, starts: [mid - pw.value, mid], centers }
        }
        return { merged: false, starts: centers.map((c) => c - pw.value / 2), centers }
      })
      // A: px por paso y desplazamiento de la cinta
      const px = computed(() => props.pxPerStep || 12)
      const tapeLen = computed(() => ((SL.top(o.value) - props.min) / props.step) * px.value)
      const tapeX = computed(() => tw.value / 2 - (((vals.value[0] ?? props.min) - props.min) / props.step) * px.value)
      const majors = computed(() => {
        if (C.value !== 'A') return []
        let every = SL.bigStep(o.value)
        while ((every / props.step) * px.value < 56) every *= 2
        const out = []
        for (let v = props.min; v <= SL.top(o.value) + 1e-9; v += every) out.push(Number(v.toFixed(SL.dec(props.step))))
        return out
      })

      // ---- teclado ----
      const typing = ref({ i: -1, text: '' })
      let typeTimer = 0
      const bump = ref('')
      function doBump(dir) {
        bump.value = ''
        nextTick(() => { bump.value = dir > 0 ? 'up' : 'down' })
      }
      function commitTyping() {
        clearTimeout(typeTimer)
        const { i, text } = typing.value
        typing.value = { i: -1, text: '' }
        if (i < 0 || !text) return
        const n = Number(text.replace(',', '.'))
        if (!isFinite(n)) return
        const [lo, hi] = lim(i)
        const v = SL.snap(n, o.value, lo, hi)
        startGesture()
        if (!set(i, v) && v !== n) doBump(n > v ? 1 : -1)
        endGesture()
      }
      function onKey(i, e) {
        const el = e.currentTarget
        if (NAV.has(e.key)) el.setAttribute('data-g-key-focus', '')
        // B: búsqueda por cifras («37» lleva al 37)
        if (C.value === 'B' && !ro.value && !e.ctrlKey && !e.metaKey && !e.altKey) {
          const d = e.key.length === 1 ? SL.latin(e.key) : null
          const sep = (e.key === '.' || e.key === ',') && typing.value.i === i && !/[.,]/.test(typing.value.text)
          const minus = e.key === '-' && typing.value.i !== i && props.min < 0
          if (d !== null || sep || minus) {
            e.preventDefault()
            const base = typing.value.i === i ? typing.value.text : ''
            typing.value = { i, text: base + (d ?? (sep ? '.' : '-')) }
            clearTimeout(typeTimer)
            typeTimer = setTimeout(commitTyping, TYPE_MS)
            return
          }
          if (typing.value.i === i) {
            if (e.key === 'Backspace') { e.preventDefault(); typing.value = { i, text: typing.value.text.slice(0, -1) }; clearTimeout(typeTimer); typeTimer = setTimeout(commitTyping, TYPE_MS); return }
            if (e.key === 'Enter') { e.preventDefault(); commitTyping(); return }
            if (e.key === 'Escape') { e.preventDefault(); clearTimeout(typeTimer); typing.value = { i: -1, text: '' }; return }
            commitTyping()
          }
        }
        const a = SL.keyAction(e, { rtl: rtl.value })
        if (!a) return
        e.preventDefault()
        jumping.value = false
        if (ro.value) return
        startGesture()
        const [lo, hi] = lim(i)
        const cur = vals.value[i]
        let next
        if (a.kind === 'home') next = lo
        else if (a.kind === 'end') next = hi
        else if (cur === null) next = a.dir > 0 ? lo : hi
        else next = SL.move(cur, a.dir, a.kind, o.value, lo, hi)
        if (!set(i, next) && a.dir && (C.value === 'A' || C.value === 'B') && !e.repeat) doBump(a.dir)
      }
      const onKeyup = () => endGesture()
      function onFocus(e) {
        if (byKey) e.currentTarget.setAttribute('data-g-key-focus', '')
      }
      function onBlur(e) {
        e.currentTarget.removeAttribute('data-g-key-focus')
        if (typing.value.i >= 0) commitTyping()
        endGesture()
      }
      // Ajuste que no viene del teclado: lectores móviles (VoiceOver «ajustable», TalkBack) cambian el nativo y llega `input`.
      // Se traduce a UN paso en esa dirección, con la rejilla y los límites del componente
      function onNativeInput(i, e) {
        const el = e.target
        const raw = Number(el.value)
        const cur = vals.value[i]
        if (!ro.value && !dis.value) {
          const [lo, hi] = lim(i)
          const next = cur === null ? SL.snap(raw, o.value, lo, hi) : raw === cur ? cur : SL.move(cur, Math.sign(raw - cur), 'step', o.value, lo, hi)
          startGesture()
          set(i, next)
          endGesture()
        }
        el.value = String(nativeValue(i))
      }
      const nativeValue = (i) => (vals.value[i] === null ? (props.min + props.max) / 2 : vals.value[i])

      // ---- puntero ----
      let drag = null
      const jumping = ref(false)
      const fine = ref(false)
      function valueAt(e) {
        const r = area.value.getBoundingClientRect()
        let x = e.clientX - r.left
        if (rtl.value) x = r.width - x
        if (C.value === 'B' && pw.value) return props.min + Math.min(1, Math.max(0, (x - pw.value / 2) / Math.max(1, r.width - pw.value))) * (props.max - props.min)
        if (C.value === 'C' && discrete.value) {
          const k = Math.min(cells.value.length - 1, Math.max(0, Math.floor((x / r.width) * cells.value.length)))
          return props.min + k * props.step
        }
        return props.min + Math.min(1, Math.max(0, x / r.width)) * (props.max - props.min)
      }
      function focusThumb(i) {
        const el = natives.value[i]
        if (el && document.activeElement !== el) el.focus({ preventScroll: true })
      }
      function onDown(e) {
        if (e.button !== 0 || dis.value || !area.value) return
        const thumbEl = e.target.closest('[data-thumb]')
        const markEl = e.target.closest('[data-value]')
        // Sin preventDefault aquí: el mousedown de compatibilidad debe llegar para que el navegador sepa que fue puntero
        // (:focus-visible); el mousedown se anula aparte (@mousedown.prevent) para que el foco no salte al cuerpo
        natives.value.forEach((n) => n && n.removeAttribute('data-g-key-focus'))
        rtl.value = getComputedStyle(root.value).direction === 'rtl'
        const touch = e.pointerType === 'touch'
        const startY = e.clientY
        const startX = e.clientX
        // A · la cinta: se arrastra la escala, el valor se queda en el centro
        if (C.value === 'A') {
          focusThumb(0)
          if (ro.value) return
          drag = { mode: 'tape', i: 0, x0: startX, y0: startY, v0: vals.value[0] ?? props.min, acc: 0, lastX: startX, moved: false, tapX: startX, mark: markEl }
          try { area.value.setPointerCapture(e.pointerId) } catch (_) { /* puntero sintético */ }
          startGesture()
          return
        }
        const v = markEl ? Number(markEl.dataset.value) : valueAt(e)
        let i = thumbEl ? Number(thumbEl.dataset.thumb) : SL.pick(vals.value, SL.snap(v, o.value))
        // B · arrastrar el tramo entre las dos píldoras lo mueve entero (conserva la anchura)
        const onFill = C.value === 'B' && props.range && e.target.closest('.x-sl__fill') && !(pills.value && pills.value.merged)
        if (thumbEl && props.range && vals.value[0] === vals.value[1]) i = null
        focusThumb(i ?? (vals.value[0] >= SL.top(o.value) ? 0 : 1))
        if (ro.value) return
        try { area.value.setPointerCapture(e.pointerId) } catch (_) { /* puntero sintético */ }
        startGesture()
        if (onFill) {
          drag = { mode: 'window', x0: startX, a0: vals.value[0], b0: vals.value[1] }
          return
        }
        // Táctil fuera del asa: el valor salta solo con un toque (el gesto vertical desplaza la página: touch-action pan-y)
        const pending = touch && !thumbEl
        drag = { mode: 'thumb', i, x0: startX, y0: startY, pending, v }
        if (!pending && i !== null && !thumbEl) jumpTo(i, v)
      }
      function jumpTo(i, v) {
        const [lo, hi] = lim(i)
        jumping.value = vals.value[i] !== null // desde «sin elegir» aparece en su sitio, sin deslizarse
        set(i, SL.snap(v, o.value, lo, hi))
      }
      function onMove(e) {
        if (!drag) return
        const dx = e.clientX - drag.x0
        const dy = e.clientY - drag.y0
        if (drag.mode === 'tape') {
          const rect = area.value.getBoundingClientRect()
          const off = Math.max(0, Math.abs(e.clientY - (rect.top + rect.height / 2)) - rect.height / 2)
          fine.value = off > FINE_AT
          const step = (e.clientX - drag.lastX) * (fine.value ? FINE : 1)
          drag.lastX = e.clientX
          if (Math.abs(dx) > 3) drag.moved = true
          if (!drag.moved) return
          jumping.value = false
          drag.acc += rtl.value ? step : -step
          const raw = drag.v0 + (drag.acc / px.value) * props.step
          const nv = SL.snap(raw, o.value)
          if (nv !== vals.value[0]) set(0, nv)
          return
        }
        if (drag.mode === 'window') {
          const r = area.value.getBoundingClientRect()
          const span = props.max - props.min
          let d = ((rtl.value ? -dx : dx) / Math.max(1, r.width - (pw.value || 0))) * span
          const width = drag.b0 - drag.a0
          let a = SL.snap(drag.a0 + d, o.value)
          a = Math.min(SL.top(o.value) - width, Math.max(SL.bottom(o.value), a))
          jumping.value = false
          setBoth(a, Number((a + width).toFixed(SL.dec(props.step))))
          return
        }
        if (drag.pending) {
          if (Math.abs(dy) > TAP && Math.abs(dy) > Math.abs(dx)) { drag = null; return }
          if (Math.abs(dx) <= TAP) return
          drag.pending = false
        }
        if (drag.i === null) {
          if (Math.abs(dx) < 2) return
          const up = rtl.value ? dx < 0 : dx > 0
          drag.i = up ? 1 : 0
          focusThumb(drag.i)
        }
        jumping.value = false
        const [lo, hi] = lim(drag.i)
        set(drag.i, SL.snap(valueAt(e), o.value, lo, hi))
      }
      function onUp(e) {
        if (!drag) return
        if (drag.mode === 'tape' && !drag.moved) {
          // Toque en la cinta: lleva ese punto (o la marca tocada) bajo la aguja
          const rect = area.value.getBoundingClientRect()
          let x = e.clientX - (rect.left + rect.width / 2)
          if (rtl.value) x = -x
          const target = drag.mark ? Number(drag.mark.dataset.value) : (vals.value[0] ?? props.min) + (x / px.value) * props.step
          jumping.value = true
          set(0, SL.snap(target, o.value))
        } else if (drag.mode === 'thumb' && drag.pending && drag.i !== null) {
          jumpTo(drag.i, drag.v)
        }
        drag = null
        fine.value = false
        endGesture()
      }
      const onCancel = () => { drag = null; fine.value = false; endGesture() }

      // ---- medidas ----
      let ro2 = null
      const measure = () => {
        if (!area.value) return
        tw.value = area.value.getBoundingClientRect().width
        const sizer = root.value.querySelector('.x-sl__sizer')
        if (sizer) pw.value = sizer.getBoundingClientRect().width
        rtl.value = getComputedStyle(root.value).direction === 'rtl'
      }
      onMounted(() => {
        langOf.value = (root.value.closest('[lang]') && root.value.closest('[lang]').lang) || navigator.language
        measure()
        ro2 = new ResizeObserver(measure)
        ro2.observe(area.value)
        const sizer = root.value.querySelector('.x-sl__sizer')
        if (sizer) ro2.observe(sizer)
        if (document.fonts) document.fonts.ready.then(measure)
        ;(window.__sl = window.__sl || new Map()).set(id.value, { vals, pills, tw, pw, cells, typing, fine })
      })
      onBeforeUnmount(() => { ro2 && ro2.disconnect(); clearTimeout(typeTimer) })
      const sizerTexts = computed(() => {
        const vs = [SL.bottom(o.value), SL.top(o.value), (props.min + props.max) / 2]
        if (props.min < 0) vs.push(-Math.abs(props.max))
        return vs.map(fmt)
      })
      const onBumpEnd = () => { bump.value = '' }
      // Marcas: en B, alineadas con el centro de la píldora (el recorrido se recoge media píldora a cada lado)
      const markPos = (v) => (C.value === 'B' && tw.value && pw.value ? (pw.value / 2 + frac(v) * (tw.value - pw.value)) / tw.value : posOf(v))
      const onGlideEnd = () => { jumping.value = false }

      return {
        alertIcon: window.lucide('circle-alert', 'x-sl__icon-svg'),
        root, area, natives, C, ff, id, ro, dis, vals, empty, marks, display, vtext, thumbName, lim, fmt, nativeValue,
        onKey, onKeyup, onFocus, onBlur, onNativeInput, onDown, onMove, onUp, onCancel, jumping, fine, bump, onBumpEnd, onGlideEnd,
        posOf, markPos, frac, pills, pw, tw, cells, discrete, tapeLen, tapeX, majors, px, typing, sizerTexts, countLine, markOf
      }
    },
    template: `
<div ref="root" class="x-sl" :class="['x-sl--' + C, { 'is-range': range, 'is-empty': empty, 'is-readonly': ro, 'is-disabled': dis, 'is-invalid': ff.invalid.value, 'is-jumping': jumping, 'is-fine': fine, 'is-merged': pills && pills.merged }]"
     :data-bump="bump || null" @focusout="ff.handlers.onFocusout" @animationend="onBumpEnd">
  <div class="x-sl__head">
    <label v-if="!range" :id="id + '-label'" :for="id" class="x-sl__label">{{ label }}<span v-if="ff.mark.value === 'required'" class="x-sl__req" aria-hidden="true">*</span><span v-else-if="ff.markText.value" class="x-sl__opt">{{ ' ' + ff.markText.value }}</span></label>
    <span v-else :id="id + '-label'" class="x-sl__label">{{ label }}<span v-if="ff.markText.value" class="x-sl__opt">{{ ' ' + ff.markText.value }}</span></span>
    <span v-if="C !== 'B' && C !== 'A'" class="x-sl__value" aria-hidden="true"><template v-if="Array.isArray(display)"><bdi>{{ display[0] }}</bdi> – <bdi>{{ display[1] }}</bdi></template><bdi v-else>{{ display }}</bdi></span>
  </div>
  <div class="x-sl__row" :role="range ? 'group' : null" :aria-labelledby="range ? id + '-label' : null">
    <!-- A · lectura grande y aguja fijas; la cinta pasa por debajo -->
    <div v-if="C === 'A'" class="x-sl__readout" aria-hidden="true"><bdi class="x-sl__big">{{ display }}</bdi><span v-if="fine" class="x-sl__fine">{{ labels.fine }}</span></div>
    <div ref="area" class="x-sl__area" @mousedown.prevent @pointerdown="onDown" @pointermove="onMove" @pointerup="onUp" @pointercancel="onCancel" @lostpointercapture="onCancel">
      <template v-if="C === 'A'">
        <div class="x-sl__tape" :style="{ '--_x': tapeX + 'px', '--_len': tapeLen + 'px', '--_px': px + 'px' }" @transitionend="onGlideEnd">
          <span v-for="m in majors" :key="m" class="x-sl__major" :data-value="m" :style="{ '--_at': ((m - min) / step * px) + 'px' }">{{ fmt(m) }}</span>
        </div>
        <span class="x-sl__needle"></span>
      </template>
      <template v-else-if="C === 'C'">
        <div class="x-sl__cells" :style="{ '--_n': cells.length }">
          <span v-for="c in cells" :key="c.k" class="x-sl__cell" :class="{ 'is-on': c.on }" :style="{ '--_k': c.hgt }"></span>
        </div>
      </template>
      <template v-else>
        <span class="x-sl__track"></span>
        <span v-if="!empty" class="x-sl__fill" :style="pills ? { insetInlineStart: (range ? pills.centers[0] : 0) + 'px', inlineSize: (range ? pills.centers[1] - pills.centers[0] : pills.centers[0]) + 'px' } : { '--_a': range ? frac(vals[0]) : 0, '--_b': frac(vals[range ? 1 : 0]) }"></span>
      </template>
      <span v-for="(v, i) in vals" :key="i" class="x-sl__thumb" :data-thumb="C === 'A' ? null : i" :class="{ 'is-typing': typing.i === i }"
            :style="pills ? { insetInlineStart: pills.starts[i] + 'px', inlineSize: pw + 'px' } : { '--_f': posOf(v) }" @transitionend="onGlideEnd">
        <span v-if="C === 'B'" class="x-sl__pilltext" dir="auto" aria-hidden="true">{{ typing.i === i ? typing.text : v === null ? '' : fmt(v) }}</span>
        <input :ref="(el) => { if (el) natives[i] = el }" type="range" class="x-sl__native" step="any"
               :id="i === 0 ? id : id + '-end'" :min="lim(i)[0]" :max="lim(i)[1]" :value="nativeValue(i)" :disabled="dis"
               :aria-labelledby="range ? id + '-label ' + id + '-n' + i : null" :aria-valuetext="vtext(i)"
               :aria-describedby="[hint ? id + '-hint' : '', countLine ? id + '-count' : '', ff.message.value ? ff.messageId.value : ''].filter(Boolean).join(' ') || null"
               :aria-invalid="ff.invalid.value ? 'true' : null" :aria-readonly="ro ? 'true' : null"
               @keydown="onKey(i, $event)" @keyup="onKeyup" @focus="onFocus" @blur="onBlur" @input="onNativeInput(i, $event)" @change.stop>
        <span v-if="range" :id="id + '-n' + i" hidden>{{ thumbName(i) }}</span>
      </span>
      <span v-if="C === 'B'" class="x-sl__sizer" aria-hidden="true"><span v-for="t in sizerTexts" :key="t">{{ t }}</span></span>
    </div>
    <div v-if="C === 'A'" class="x-sl__overview" aria-hidden="true"><span :style="{ '--_f': frac(vals[0] ?? min) }"></span></div>
    <div v-if="C !== 'A' && marks.some((m) => m.label || C === 'base')" class="x-sl__marks" aria-hidden="true" @mousedown.prevent @pointerdown="onDown">
      <span v-for="m in marks" :key="m.value" class="x-sl__mark" :class="{ 'has-label': m.label }" :data-value="m.value"
            :style="{ '--_f': markPos(m.value) }"><span v-if="m.label">{{ m.label }}</span></span>
    </div>
    <input v-for="(v, i) in vals" :key="'h' + i" type="hidden" :name="name" :value="v === null ? '' : String(v)" :disabled="dis">
  </div>
  <div class="x-sl__support">
    <p v-if="countLine" :id="id + '-count'" class="x-sl__count">{{ countLine }}</p>
    <p v-if="hint" :id="id + '-hint'" class="x-sl__hint">{{ hint }}</p>
    <div :id="ff.messageId.value" class="x-sl__message" :aria-live="ff.live.value"><template v-if="ff.message.value"><span class="x-sl__icon" v-html="alertIcon"></span><span v-if="ff.message.value.prefix" class="x-sl__sr">{{ ff.message.value.prefix }}</span>{{ ff.message.value.text }}</template></div>
  </div>
</div>`
  })

  window.XSlider = XSlider
})()
