// Conceptos de forma del campo de hora (kiwi, r02): A · La hora dicha, B · Rejilla del día, C · Tramo.
// Los tres parten de la base de r01 (useTimeField sobre el GInput REAL) y no reabren su semántica. Clases x-tfa/x-tfb/x-tfc:
// de prototipo, con tokens del tema por defecto (concepts.css); el CSS definitivo es de coco. Expone window.TFConcepts.
(function () {
  const { computed, ref, watch, nextTick, onMounted, onBeforeUnmount, h } = Vue
  const T = window.TF
  const { useTimeField, periodButtons, props: baseProps } = window.XTF

  const ginputProps = (props, s, extra = {}) => ({
    ...s.forwardAttrs.value,
    id: s.inputId.value, class: [extra.cls, { 'x-tf--h12': extra.halves && s.info.value.cycle === 'h12' }, s.attrs.class], style: s.attrs.style,
    name: props.name, label: props.label, hint: props.hint, error: props.error || s.ownError.value, warning: props.warning, valid: props.valid,
    output: extra.output !== undefined ? extra.output : props.output, required: props.required, mark: props.mark, readonly: props.readonly, disabled: props.disabled,
    size: props.size, variant: props.variant, density: props.density, color: props.color, rounded: props.rounded, block: props.block,
    prefix: props.prefix, suffix: props.suffix, prefixLabel: props.prefixLabel, suffixLabel: props.suffixLabel
  })
  const hidden = (props, s, f) => (props.name ? h('input', { type: 'hidden', name: props.name, value: s.canonicalValue.value, disabled: f.disabled || undefined }) : null)

  // =====================================================================================================================
  // A · La hora dicha: se escribe como se dice («930», «9 noche», «mediodía») y el campo devuelve la lectura en palabras
  // pegada a la hora; una hora a secas que puede ser de mañana o de noche muestra las dos lecturas para elegir de un toque.
  // =====================================================================================================================
  const XTimeFieldA = {
    name: 'XTimeFieldA', inheritAttrs: false, props: baseProps, emits: ['update:modelValue', 'change'],
    setup(props, { emit }) {
      let sref = null
      const s = useTimeField(propsProxy(props), emit, {
        valueText: (v) => T.reading(v, sref.info.value, props.seconds)
      })
      sref = s
      // Ambigüedad: en 12 h, la de la base (1–12 sin marcador). En 24 h, una hora a secas de 1 a 11 sin cero delante
      // («9», «9:30») se lee literal (9:00) pero se ofrece la otra mitad: es como se dice en voz alta.
      const ambA = computed(() => {
        if (!s.focused.value || s.current.value == null) return null
        if (s.amb.value) return s.amb.value
        if (s.info.value.cycle === 'h12') return null
        const t = T.toLatin(s.text.value, s.info.value).trim()
        const m = /^([1-9]|1[01])(?:\D?(\d{2}))?$/.exec(t)
        if (!m) return null
        return { value: s.current.value, alt: (s.current.value + 12 * 3600) % T.DAY }
      })
      const formatted = computed(() => T.format(s.current.value, s.info.value, props.seconds))
      // La lectura: la franja en palabras; mientras se escribe algo que aún no es la forma final, la hora entendida delante
      const reading = computed(() => {
        const v = s.current.value
        if (v == null) return ''
        const word = T.period(v, s.info.value)
        return s.focused.value && s.text.value.trim() !== formatted.value ? `${formatted.value} · ${word}` : word
      })
      return () => h(Grana.GInput, ginputProps(props, s, { cls: ['x-tfa', { 'has-choice': Boolean(ambA.value) }] }), {
        field: (f) => [
          h('span', { class: 'x-tfa__value' }, [
            h('span', { class: 'x-tfa__mirror', 'aria-hidden': 'true' }, s.text.value || (s.attrs.placeholder ?? '')),
            h('input', { ...s.fieldProps(f), ref: s.setFieldEl })
          ]),
          reading.value ? h('span', { class: 'x-tfa__reading', 'aria-hidden': 'true', key: reading.value, 'data-reading': '', 'data-anim': s.focused.value ? '' : undefined, onClick: () => s.fieldEl.value?.focus() }, reading.value) : null,
          hidden(props, s, f)
        ],
        end: (e) => {
          const a = ambA.value
          if (!a || e.readonly) return null
          const opt = (v, on) => h('button', {
            type: 'button', class: ['x-tfa__choice', { 'is-on': on }], tabindex: '-1', 'aria-pressed': String(on), 'aria-controls': s.inputId.value,
            'data-choice': T.canonical(v), disabled: e.disabled || undefined,
            onPointerdown: (ev) => { if (ev.button === 0) ev.preventDefault() },
            onClick: () => { s.setValue(v); s.getCtx()?.notifyChange() }
          }, [h('span', { class: 'x-tfa__sr' }, T.format(v, s.info.value, props.seconds) + ' '), T.period(v, s.info.value)])
          return h('span', { class: 'x-tfa__choices', role: 'group', 'aria-label': props.labels.choose || undefined }, [opt(a.value, true), opt(a.alt, false)])
        }
      })
    }
  }
  function propsProxy(props) { return new Proxy(props, { get: (t, k) => (k === 'words' ? true : t[k]) }) }

  // =====================================================================================================================
  // B · Rejilla del día: un botón (fuera del Tab; Alt+↓ desde el campo) abre un diálogo no modal con las horas habituales
  // de la aplicación arriba y el día en cuatro filas de seis horas (madrugada, mañana, tarde, noche). Elegir una hora
  // despliega sus minutos debajo, según `step`. Dos toques para cualquier hora; mañana y noche nunca están en la misma fila.
  // =====================================================================================================================
  const XTimeFieldB = {
    name: 'XTimeFieldB', inheritAttrs: false,
    props: { ...baseProps, suggestions: { type: Array, default: () => [] } },
    emits: ['update:modelValue', 'change'],
    setup(props, { emit }) {
      const open = ref(false)
      const s = useTimeField(props, emit, {
        onKeydown: (e) => { if (e.altKey && e.key === 'ArrowDown') { e.preventDefault(); show() } },
        fieldAttrs: () => ({ 'aria-keyshortcuts': 'Alt+ArrowDown' })
      })
      const popId = computed(() => s.inputId.value + '-pop')
      const pop = ref(null), rootRef = ref(null)
      const pickedHour = ref(null) // hora elegida en el diálogo (despliega sus minutos)
      const focusHour = ref(9)
      const sheet = ref(false)
      const L = computed(() => props.labels)
      const info = s.info
      const minuteStep = computed(() => Math.max(props.step, 5) >= 60 ? 60 : Math.max(5, props.step))
      const allowed = (sec) => T.inArc(sec, s.min.value, s.max.value)
      const hourOpen = (hh) => { for (let m = 0; m < 60; m += minuteStep.value) if (allowed(hh * 3600 + m * 60)) return true; return false }
      const minutes = computed(() => { const out = []; for (let m = 0; m < 60; m += minuteStep.value) out.push(m); return out })
      const nowH = computed(() => Math.floor(T.nowSec() / 3600))
      const fmtHour = (hh) => {
        const p = new Intl.DateTimeFormat(info.value.locale, { hour: 'numeric', hourCycle: info.value.cycle, timeZone: 'UTC' }).formatToParts(T.utc(hh * 3600))
        return p.find((x) => x.type === 'hour').value
      }
      const rowsLabels = computed(() => L.value.rows || [])

      function place() {
        const el = pop.value, box = rootRef.value?.$el?.querySelector('.g-input__control')
        if (!el || !box) return
        sheet.value = window.innerWidth <= 520
        if (sheet.value) { el.style.setProperty('--_x', '0px'); el.style.setProperty('--_y', 'auto'); return }
        const r = box.getBoundingClientRect(), w = el.offsetWidth
        const rtl = getComputedStyle(box).direction === 'rtl'
        let x = rtl ? r.right - w : r.left
        x = Math.max(8, Math.min(x, window.innerWidth - w - 8))
        const below = window.innerHeight - r.bottom
        const y = below >= el.offsetHeight + 8 || below > r.top ? r.bottom + 4 : r.top - el.offsetHeight - 4
        el.style.setProperty('--_x', x + 'px'); el.style.setProperty('--_y', y + 'px')
        if (r.bottom < 0 || r.top > window.innerHeight) hide(false) // el ancla salió de la vista: se cierra sin devolver el foco (#358)
      }
      function show() {
        if (s.isReadonly() || open.value) return
        const v = s.current.value
        pickedHour.value = null
        focusHour.value = v != null ? Math.floor(v / 3600) : (s.min.value != null ? Math.floor(s.min.value / 3600) : nowH.value)
        open.value = true
        nextTick(() => {
          pop.value.showPopover?.(); place()
          pop.value.querySelector(`[data-hour="${focusHour.value}"]`)?.focus()
          window.addEventListener('scroll', place, true); window.addEventListener('resize', place)
        })
      }
      function hide(returnFocus = true) {
        if (!open.value) return
        open.value = false
        try { pop.value?.hidePopover?.() } catch { /* ya cerrado */ }
        window.removeEventListener('scroll', place, true); window.removeEventListener('resize', place)
        if (returnFocus) s.fieldEl.value?.focus()
      }
      onBeforeUnmount(() => hide(false))
      function choose(sec) {
        s.setValue(sec); s.getCtx()?.notifyChange()
        hide(true)
        s.commit()
      }
      function pickHour(hh) {
        if (!hourOpen(hh)) return
        pickedHour.value = hh
        const v = s.current.value
        const m = v != null && Math.floor(v / 3600) === hh ? Math.floor((v % 3600) / 60) : minutes.value.find((mm) => allowed(hh * 3600 + mm * 60))
        nextTick(() => pop.value?.querySelector(`[data-minute="${m - (m % minuteStep.value)}"]`)?.focus())
      }
      function gridKey(e, hh) {
        const rtl = getComputedStyle(e.currentTarget).direction === 'rtl'
        const map = { ArrowRight: rtl ? -1 : 1, ArrowLeft: rtl ? 1 : -1, ArrowDown: 6, ArrowUp: -6 }
        let n = null
        if (map[e.key] != null) n = hh + map[e.key]
        else if (e.key === 'Home') n = hh - (hh % 6)
        else if (e.key === 'End') n = hh - (hh % 6) + 5
        else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); hide(true); return }
        if (n == null) return
        e.preventDefault()
        if (n < 0 || n > 23) return
        focusHour.value = n
        pop.value.querySelector(`[data-hour="${n}"]`)?.focus()
      }
      function minuteKey(e, m) {
        const rtl = getComputedStyle(e.currentTarget).direction === 'rtl'
        const st = minuteStep.value, cols = 6
        const map = { ArrowRight: rtl ? -st : st, ArrowLeft: rtl ? st : -st, ArrowDown: st * cols, ArrowUp: -st * cols }
        if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); const hh = pickedHour.value; pickedHour.value = null; nextTick(() => pop.value.querySelector(`[data-hour="${hh}"]`)?.focus()); return }
        if (map[e.key] == null) return
        e.preventDefault()
        const n = m + map[e.key]
        if (n < 0 || n >= 60) return
        pop.value.querySelector(`[data-minute="${n}"]`)?.focus()
      }
      function onPopFocusout(e) { if (open.value && !pop.value.contains(e.relatedTarget) && e.relatedTarget !== s.fieldEl.value && e.relatedTarget) hide(false) }
      function onDocDown(e) { if (open.value && !pop.value.contains(e.target) && !rootRef.value?.$el?.contains(e.target)) hide(false) }
      onMounted(() => document.addEventListener('pointerdown', onDocDown, true))
      onBeforeUnmount(() => document.removeEventListener('pointerdown', onDocDown, true))

      const name = (sec) => T.reading(sec, info.value, false)
      const panel = () => h('div', {
        ref: pop, id: popId.value, class: ['x-tfb__pop', { 'is-sheet': sheet.value }], role: 'dialog', 'aria-label': L.value.dialog, popover: 'manual',
        onFocusout: onPopFocusout, onKeydown: (e) => { if (e.key === 'Escape') { e.preventDefault(); hide(true) } }
      }, open.value ? [
        props.suggestions.length || L.value.now ? h('div', { class: 'x-tfb__habits', role: 'group', 'aria-label': L.value.suggestions }, [
          h('span', { class: 'x-tfb__habits-title', 'aria-hidden': 'true' }, L.value.suggestions),
          ...(L.value.now ? [{ time: T.canonical(T.stepValue(null, 1, { step: props.step })), label: L.value.now, now: true }] : []).concat(props.suggestions).map((sg) => {
            const v = T.fromCanonical(sg.time)
            const off = !allowed(v)
            return h('button', { type: 'button', class: ['x-tfb__habit', { 'is-on': v === s.current.value }], 'data-suggest': sg.time, 'aria-disabled': off ? 'true' : undefined,
              onClick: () => { if (!off) choose(v) } }, [
              h('span', { class: 'x-tfb__habit-time' }, T.format(v, info.value)),
              sg.label ? h('span', { class: 'x-tfb__habit-label' }, sg.label) : null
            ])
          })
        ]) : null,
        h('div', { class: 'x-tfb__grid', role: 'grid', 'aria-label': L.value.hours }, [0, 1, 2, 3].map((r) => h('div', { class: 'x-tfb__row', role: 'row' }, [
          h('span', { class: 'x-tfb__rowhead', role: 'rowheader' }, rowsLabels.value[r] || ''),
          ...[0, 1, 2, 3, 4, 5].map((c) => {
            const hh = r * 6 + c, open_ = hourOpen(hh), cur = s.current.value != null && Math.floor(s.current.value / 3600) === hh
            return h('span', { role: 'gridcell', class: 'x-tfb__cell', 'aria-selected': cur ? 'true' : undefined }, h('button', {
              type: 'button', class: ['x-tfb__hour', { 'is-on': cur, 'is-picked': pickedHour.value === hh, 'is-now': hh === nowH.value, 'is-off': !open_ }],
              'data-hour': hh, tabindex: hh === focusHour.value ? '0' : '-1', 'aria-disabled': open_ ? undefined : 'true',
              'aria-label': name(hh * 3600) + (hh === nowH.value && L.value.nowMark ? `, ${L.value.nowMark}` : ''),
              onClick: () => pickHour(hh), onKeydown: (e) => gridKey(e, hh), onFocus: () => { focusHour.value = hh }
            }, [fmtHour(hh), info.value.cycle === 'h12' && (hh % 12 === 0) ? h('span', { class: 'x-tfb__hour-half' }, hh < 12 ? info.value.am : info.value.pm) : null]))
          })
        ]))),
        h('div', { class: ['x-tfb__minutes-wrap', { 'is-open': pickedHour.value != null }] }, h('div', { class: 'x-tfb__minutes-in' },
          pickedHour.value == null ? null : h('div', { class: 'x-tfb__minutes', role: 'group', 'aria-label': `${L.value.minutes || ''} ${name(pickedHour.value * 3600)}`.trim() }, minutes.value.map((m) => {
            const v = pickedHour.value * 3600 + m * 60, ok = allowed(v), cur = v === s.current.value
            return h('button', { type: 'button', class: ['x-tfb__minute', { 'is-on': cur, 'is-off': !ok }], 'data-minute': m, 'aria-disabled': ok ? undefined : 'true',
              'aria-label': name(v), onClick: () => { if (ok) choose(v) }, onKeydown: (e) => minuteKey(e, m) }, T.format(v, info.value))
          })))),
        props.step < 5 ? h('p', { class: 'x-tfb__note' }, L.value.exact || '') : null
      ] : [])

      return () => [h(Grana.GInput, { ...ginputProps(props, s, { cls: 'x-tfb', halves: false }), ref: rootRef }, {
        field: (f) => [h('input', { ...s.fieldProps(f), ref: s.setFieldEl }), hidden(props, s, f)],
        end: (e) => e.readonly ? null : h('button', {
          type: 'button', class: 'x-tfb__open', tabindex: '-1', 'aria-haspopup': 'dialog', 'aria-expanded': String(open.value), 'aria-controls': popId.value,
          'aria-label': L.value.open, disabled: e.disabled || undefined, onPointerdown: (ev) => { if (ev.button === 0) ev.preventDefault() },
          onClick: () => (open.value ? hide(true) : show())
        }, h('span', { class: 'x-tfb__open-ico', innerHTML: window.lucide('chevron-down') }))
      }), panel()]
    }
  }

  // =====================================================================================================================
  // C · Tramo: inicio y fin juntos, con lo que dura entre los dos y una regla del día. El fin admite una duración
  // («+8», «+1:30»); mover el inicio conserva la duración; un fin anterior al inicio es «el día siguiente», dicho en texto.
  // =====================================================================================================================
  const XTimeRange = {
    name: 'XTimeRange', inheritAttrs: false,
    props: {
      modelValue: { type: Object, default: () => ({ start: null, end: null }) },
      label: String, name: String, labelStart: String, labelEnd: String, hint: String, step: { type: Number, default: 15 },
      min: String, max: String, locale: String, durations: { type: Array, default: () => [] }, labels: { type: Object, default: () => ({}) },
      readonly: Boolean, disabled: Boolean, id: String
    },
    emits: ['update:modelValue'],
    setup(props, { emit, attrs }) {
      const uid = props.id || 'tr-' + Math.random().toString(36).slice(2, 7)
      const start = computed(() => T.fromCanonical(props.modelValue?.start)), end = computed(() => T.fromCanonical(props.modelValue?.end))
      const lang = ref(props.locale || document.documentElement.lang || 'es')
      const root = ref(null)
      onMounted(() => { const r = T.resolveLocale(root.value, props.locale); if (r !== lang.value) lang.value = r })
      const info = computed(() => T.localeInfo(lang.value))
      const dur = computed(() => T.duration(start.value, end.value))
      const nextDay = computed(() => start.value != null && end.value != null && end.value < start.value)
      let keepDur = dur.value
      const set = (k, v) => emit('update:modelValue', { ...props.modelValue, [k]: v })
      // Mover el inicio conserva la duración (el fin se desplaza con él)
      const onStart = (v) => {
        const s = T.fromCanonical(v)
        if (s != null && keepDur != null && end.value != null) emit('update:modelValue', { start: v, end: T.canonical((s + keepDur) % T.DAY) })
        else set('start', v)
      }
      const onEnd = (v) => set('end', v)
      watch([start, end], () => { if (dur.value != null) keepDur = dur.value })
      const out = computed(() => {
        if (dur.value == null) return ''
        const d = dur.value === 0 && start.value != null ? '' : T.formatDuration(dur.value, info.value.locale)
        return [d, nextDay.value ? props.labels.nextDay : ''].filter(Boolean).join(' · ')
      })
      // Regla del día: un tramo que cruza medianoche se pinta en dos piezas (de inicio a 24 y de 0 a fin)
      const pieces = computed(() => {
        if (start.value == null || end.value == null || dur.value === 0) return []
        const p = (a, b) => ({ a: (a / T.DAY) * 100, w: ((b - a) / T.DAY) * 100 })
        return nextDay.value ? [p(start.value, T.DAY), p(0, end.value)] : [p(start.value, end.value)]
      })
      const ticks = computed(() => [0, 6, 12, 18, 24].map((hh) => ({ hh, at: (hh / 24) * 100, txt: T.hourLabel(hh % 24, info.value) })))
      const applyDur = (mins) => { if (start.value == null) return; set('end', T.canonical((start.value + mins * 60) % T.DAY)) }
      const durLabel = (mins) => '+' + T.formatDuration(mins * 60, info.value.locale)
      const common = () => ({ style: { '--g-form-min': info.value.cycle === 'h12' ? 56 : 40 }, step: props.step, min: props.min, max: props.max, locale: props.locale, labels: props.labels, readonly: props.readonly, disabled: props.disabled })
      return () => h('div', { ref: root, class: ['x-tfc', { 'is-next-day': nextDay.value }], role: 'group', 'aria-labelledby': uid + '-legend', id: uid, ...attrs }, [
        h('span', { class: 'x-tfc__legend', id: uid + '-legend' }, props.label),
        h(Grana.GFormRow, { class: 'x-tfc__row' }, () => [
          h(window.XTimeField, { ...common(), class: 'g-form-w-sm', id: uid + '-start', label: props.labelStart, name: props.name ? props.name + '-start' : undefined, modelValue: props.modelValue?.start ?? null, 'onUpdate:modelValue': onStart }),
          h(window.XTimeField, { ...common(), class: 'g-form-w-sm', id: uid + '-end', label: props.labelEnd, name: props.name ? props.name + '-end' : undefined, modelValue: props.modelValue?.end ?? null, 'onUpdate:modelValue': onEnd,
            durationFrom: props.modelValue?.start ?? '', output: out.value, hint: props.hint })
        ]),
        h('div', { class: 'x-tfc__ruler', 'aria-hidden': 'true' }, [
          h('div', { class: 'x-tfc__track' }, [
            ...pieces.value.map((p, i) => h('span', { class: ['x-tfc__span', { 'is-wrap': pieces.value.length > 1 }], 'data-piece': i, style: { '--_a': p.a + '%', '--_w': p.w + '%' } })),
            nextDay.value ? h('span', { class: 'x-tfc__seam' }) : null
          ]),
          h('div', { class: 'x-tfc__ticks' }, ticks.value.map((t) => h('span', { class: 'x-tfc__tick', style: { '--_a': t.at + '%' } }, t.txt)))
        ]),
        props.durations.length && !props.readonly ? h('div', { class: 'x-tfc__durs', role: 'group', 'aria-label': props.labels.durations }, props.durations.map((m) =>
          h(Grana.GBtn, { size: 'sm', variant: 'soft', color: 'neutral', 'data-dur': m, disabled: start.value == null || props.disabled, onClick: () => applyDur(m) }, () => durLabel(m)))) : null
      ])
    }
  }

  window.TFConcepts = { XTimeFieldA, XTimeFieldB, XTimeRange }
})()
