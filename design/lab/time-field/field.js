// XTimeField · prototipo de kiwi del campo de hora (BASE funcional, r01; los conceptos de r02 la extienden).
// COMPONE el GInput REAL de dist/ con sus slots internos `field` (el <input role="spinbutton"> y el oculto canónico) y
// `end` (a. m./p. m. en 12 h), igual que GNumberField (#309): caja, etiqueta, pie, mensaje, contexto de GForm, colocación
// en GFormRow, is-ready e is-rejected son los de GInput. Clases x-tf__*: de prototipo; el CSS definitivo es de coco.
// Expone window.XTimeField y un registro window.__tf (id → estado) para la verificación.
(function () {
  const { computed, ref, watch, onMounted, onBeforeUnmount, mergeProps, useAttrs, getCurrentInstance } = Vue
  const T = window.TF
  window.__tf = window.__tf || new Map()

  const oneOf = (l) => (v) => l.includes(v)
  const props = {
    modelValue: { type: String, default: null },
    min: String, max: String,
    step: { type: Number, default: 1 },
    seconds: Boolean,
    locale: String,
    hourCycle: { type: String, default: undefined, validator: oneOf(['h12', 'h23']) },
    labels: { type: Object, default: () => ({}) },
    name: String, label: String, hint: String, error: String, warning: String, valid: String, output: String,
    required: Boolean, mark: { type: Boolean, default: undefined },
    readonly: { type: Boolean, default: undefined }, disabled: { type: Boolean, default: undefined },
    size: { type: String, default: 'md' }, variant: { type: String, default: 'outline' },
    density: { type: String, default: undefined }, color: String, rounded: String, block: { type: Boolean, default: undefined },
    prefix: String, suffix: String, prefixLabel: String, suffixLabel: String,
    id: String,
    // Solo prototipo (conceptos de r02): escribir la franja en palabras (A) y admitir «+duración» (fin de un tramo, C)
    words: Boolean, durationFrom: { type: String, default: undefined }
  }

  // Lógica compartida por la base y los conceptos: devuelve el estado y los manejadores del campo
  function useTimeField(props, emit, extra = {}) {
    const attrs = useAttrs()
    const inst = getCurrentInstance()
    const uid = 'tf-' + Math.random().toString(36).slice(2, 8)
    const inputId = computed(() => props.id || uid)
    const fieldEl = ref(null)
    const lang = ref(props.locale || document.documentElement.lang || 'es')
    const info = computed(() => T.localeInfo(lang.value, props.hourCycle))
    const sec = (v) => T.fromCanonical(v)
    const min = computed(() => sec(props.min)), max = computed(() => sec(props.max))
    const opts = computed(() => ({ step: props.step, min: min.value, max: max.value, seconds: props.seconds }))
    const current = ref(sec(props.modelValue))
    const text = ref(T.format(current.value, info.value, props.seconds))
    const focused = ref(false)
    const unparsedShown = ref(false)
    let focusPrev = current.value
    let lastChanged = current.value
    let pendingHalf = null
    let ctx = null // slot props de GInput (notifyInput, notifyChange, setControl…)
    const amb = ref(null) // { value, alt } mientras una hora 1–12 sin marcador está abierta (12 h)

    const emitModel = (v) => {
      const c = v == null ? null : T.canonical(v, props.seconds)
      if (c !== (props.modelValue ?? null)) emit('update:modelValue', c)
    }
    const setValue = (v, { reformat = true, input = true } = {}) => {
      current.value = v
      focusPrev = v // la «hora anterior» de la regla de 12 h es la última que se vio entera
      if (reformat) text.value = T.format(v, info.value, props.seconds)
      unparsedShown.value = false
      amb.value = null
      emitModel(v)
      if (input) ctx?.notifyInput()
    }
    const parseOpts = () => ({ seconds: props.seconds, prev: pendingHalf != null ? pendingHalf : focusPrev, min: min.value, max: max.value, words: props.words })
    function interpret(t) {
      if (props.durationFrom !== undefined && /^\s*\+/.test(t)) {
        const base = sec(props.durationFrom), d = T.parseDuration(t, info.value)
        if (base != null && d != null) return { status: 'ok', value: (base + d) % T.DAY, fromDuration: d }
        return { status: 'invalid', value: null }
      }
      return T.parse(t, info.value, parseOpts())
    }

    // Cambio desde la aplicación: se reescribe el texto solo si no coincide con lo escrito (no se pierde lo que se teclea)
    watch(() => props.modelValue, (v) => {
      const s = sec(v)
      const r = interpret(text.value)
      if ((r.status === 'ok' ? r.value : null) === s) return
      current.value = s
      if (!focused.value || s != null) text.value = T.format(s, info.value, props.seconds)
      lastChanged = s
    })
    watch(info, () => { if (current.value != null && !focused.value) text.value = T.format(current.value, info.value, props.seconds) })

    function onInput(e) {
      const el = e.target
      if (e.isComposing) return
      const f = T.filterTyped(el.value, info.value, { words: props.words, duration: props.durationFrom !== undefined })
      if (f !== el.value) { const pos = Math.max(0, (el.selectionStart || 0) - (el.value.length - f.length)); el.value = f; el.setSelectionRange(pos, pos) }
      text.value = f
      const r = interpret(f)
      unparsedShown.value = false
      if (r.status === 'ok') { current.value = r.value; amb.value = r.ambiguous ? { value: r.value, alt: r.alt } : null; emitModel(r.value) }
      else { current.value = null; amb.value = null; emitModel(null) }
      ctx?.notifyInput()
    }
    function commit() {
      const r = interpret(text.value)
      if (r.status === 'ok') { current.value = r.value; text.value = T.format(r.value, info.value, props.seconds); unparsedShown.value = false; emitModel(r.value) }
      else if (r.status === 'empty') { current.value = null; text.value = ''; unparsedShown.value = false; emitModel(null) }
      else { current.value = null; unparsedShown.value = true; emitModel(null) } // lo escrito se conserva: no se borra en silencio
      amb.value = null
      pendingHalf = null
      if (current.value !== lastChanged) { lastChanged = current.value; emit('change', current.value == null ? null : T.canonical(current.value, props.seconds)) }
    }
    let stepping = false
    function step(dir, big) {
      const r = interpret(text.value)
      const from = r.status === 'ok' ? r.value : null
      const next = T.stepValue(from, dir, { ...opts.value, big })
      stepping = true
      if (next === from) { extra.onLimit?.(dir); return }
      extra.onStep?.(from, next, dir)
      setValue(next)
      requestAnimationFrame(() => { const el = fieldEl.value; if (el && document.activeElement === el) { const n = el.value.length; el.setSelectionRange(n, n) } })
    }
    function setHalf(half) {
      if (current.value == null) { pendingHalf = half === 'pm' ? 12 * 3600 : 0; return }
      const isPm = current.value >= 12 * 3600
      if ((half === 'pm') === isPm) return
      setValue((current.value + 12 * 3600) % T.DAY, { input: false })
      ctx?.notifyChange()
      if (current.value !== lastChanged && !focused.value) { lastChanged = current.value; emit('change', T.canonical(current.value, props.seconds)) }
    }
    function onKeydown(e) {
      if (isReadonly()) return
      if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && !e.altKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault(); step(e.key === 'ArrowUp' ? 1 : -1, e.shiftKey)
      } else if (e.key === 'PageUp' || e.key === 'PageDown') {
        e.preventDefault(); step(e.key === 'PageUp' ? 1 : -1, true)
      } else if (e.key === 'Enter') {
        commit()
      } else if (info.value.cycle === 'h12' && e.key.length === 1 && !e.ctrlKey && !e.metaKey && current.value != null && text.value === T.format(current.value, info.value, props.seconds)) {
        // Con la hora ya escrita entera, «a»/«p» (o la primera letra del marcador del idioma) cambian la mitad del día
        const k = e.key.toLowerCase()
        const isA = k === 'a' || k === info.value.amKey[0], isP = k === 'p' || k === info.value.pmKey[0]
        if (isA !== isP) { e.preventDefault(); setHalf(isP ? 'pm' : 'am') }
      }
      extra.onKeydown?.(e)
    }
    function onKeyup(e) {
      if (stepping && ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown'].includes(e.key)) {
        stepping = false
        if (current.value !== lastChanged) { lastChanged = current.value; emit('change', current.value == null ? null : T.canonical(current.value, props.seconds)) }
      }
    }
    function onFocus() { focused.value = true; focusPrev = current.value }
    function onBlur() { focused.value = false; commit() }
    const onPaste = (e) => {
      const t = (e.clipboardData || window.clipboardData)?.getData('text') || ''
      const r = interpret(t)
      if (r.status === 'ok') { e.preventDefault(); setValue(r.value) }
    }
    const isReadonly = () => Boolean(ctx?.readonly)

    const ariaValue = computed(() => {
      const v = current.value
      const a = {}
      if (v != null) { a['aria-valuenow'] = props.seconds ? v : Math.floor(v / 60); a['aria-valuetext'] = extra.valueText ? extra.valueText(v) : T.format(v, info.value, props.seconds) }
      else if (text.value) a['aria-valuetext'] = text.value // lo escrito sin interpretar: el lector dice lo que hay en la caja
      if (min.value != null && max.value != null && min.value <= max.value) {
        const k = props.seconds ? 1 : 60; a['aria-valuemin'] = Math.floor(min.value / k); a['aria-valuemax'] = Math.floor(max.value / k)
      }
      return a
    })
    const ownError = computed(() => (unparsedShown.value && text.value ? props.labels.invalid || ' ' : undefined))

    function fieldProps(f) {
      ctx = f
      const { name: _n, required: _r, ...bind } = f.bind
      return mergeProps(
        { inputmode: props.words ? 'text' : 'numeric', autocomplete: 'off', spellcheck: 'false', autocorrect: 'off' },
        bind,
        { class: 'x-tf__field', onInput, onKeydown, onKeyup, onFocus, onBlur, onPaste },
        extra.fieldAttrs ? extra.fieldAttrs() : {},
        {
          type: 'text', role: 'spinbutton', dir: info.value.dir, value: text.value, ...ariaValue.value,
          'aria-required': props.required ? 'true' : undefined,
          'aria-readonly': f.readonly ? 'true' : undefined
        }
      )
    }
    const setFieldEl = (el) => { fieldEl.value = el; ctx?.setControl(el) }

    onMounted(() => {
      const root = inst?.proxy?.$el
      const resolved = T.resolveLocale(root?.nodeType === 1 ? root : root?.parentElement, props.locale)
      if (resolved !== lang.value) lang.value = resolved
      text.value = T.format(current.value, info.value, props.seconds)
      window.__tf.set(inputId.value, { current, text, info, amb, unparsedShown, setHalf })
    })
    onBeforeUnmount(() => window.__tf.delete(inputId.value))

    const canonicalValue = computed(() => T.canonical(current.value, props.seconds))
    const forwardAttrs = computed(() => { const { class: _c, style: _s, ...rest } = attrs; return rest })
    return { attrs, info, inputId, current, text, focused, amb, min, max, opts, ownError, canonicalValue, forwardAttrs, fieldProps, setFieldEl, setHalf, setValue, step, commit, isReadonly, fieldEl, getCtx: () => ctx }
  }

  // Botones a. m./p. m. (12 h): fuera del orden de Tab (el teclado escribe «a»/«p»), en el árbol, sin mover el foco
  function periodButtons(s, readonlyNow, disabledNow, ids = {}) {
    const i = s.info.value
    if (i.cycle !== 'h12' || readonlyNow) return null
    const v = s.current.value
    const btn = (half, txt) => Vue.h('button', {
      type: 'button', class: ['x-tf__half', { 'is-on': v != null && (half === 'pm') === (v >= 12 * 3600) }], tabindex: '-1',
      'aria-pressed': v == null ? 'false' : String((half === 'pm') === (v >= 12 * 3600)),
      'aria-controls': s.inputId.value, 'aria-labelledby': `${s.inputId.value}-${half} ${s.inputId.value}-label`, disabled: disabledNow || undefined,
      'data-half': half,
      onPointerdown: (e) => { if (e.button === 0) e.preventDefault() },
      onClick: () => s.setHalf(half)
    }, [Vue.h('span', { id: `${s.inputId.value}-${half}` }, txt)])
    const pair = [btn('am', i.am), btn('pm', i.pm)]
    return Vue.h('span', { class: 'x-tf__halves', ...ids }, pair)
  }

  const XTimeField = {
    name: 'XTimeField',
    inheritAttrs: false,
    props,
    emits: ['update:modelValue', 'change'],
    setup(props, { emit, slots }) {
      const s = useTimeField(props, emit)
      return () => Vue.h(Grana.GInput, {
        ...s.forwardAttrs.value,
        id: s.inputId.value, class: ['x-tf', { 'x-tf--h12': s.info.value.cycle === 'h12' }, s.attrs.class], style: s.attrs.style,
        name: props.name, label: props.label, hint: props.hint, error: props.error || s.ownError.value, warning: props.warning, valid: props.valid,
        output: props.output, required: props.required, mark: props.mark, readonly: props.readonly, disabled: props.disabled,
        size: props.size, variant: props.variant, density: props.density, color: props.color, rounded: props.rounded, block: props.block,
        prefix: props.prefix, suffix: props.suffix, prefixLabel: props.prefixLabel, suffixLabel: props.suffixLabel
      }, {
        ...(slots.prepend ? { prepend: slots.prepend } : {}),
        field: (f) => [
          Vue.h('input', { ...s.fieldProps(f), ref: s.setFieldEl }),
          props.name ? Vue.h('input', { type: 'hidden', name: props.name, value: s.canonicalValue.value, disabled: f.disabled || undefined }) : null
        ],
        end: (e) => periodButtons(s, e.readonly, e.disabled)
      })
    }
  }

  window.XTimeField = XTimeField
  window.XTF = { useTimeField, periodButtons, props }
})()
