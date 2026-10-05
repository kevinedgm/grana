// r02 (kiwi): tres conceptos DIVERGENTES del campo de archivos sobre el motor común (../engine.js) y componentes reales
// de dist/ (GSummary, GProgress, GBtn, GIcon, GForm, GFormRow, GInput, GErrorSummary), con los TOKENS del tema por defecto.
//   A · Línea de adjuntos      B · Mesa de luz      C · Lo que falta
// Referencia de comportamiento, no de implementación. Expone window.FFConcepts.
(function () {
  const { ref, computed, h, reactive, nextTick, watch } = Vue
  const { useFiles, fmtSize, extOf, isImage, iconOf, accepts, describeAccept, plural, page } = FF
  const { facts, statusOf, valueText, icon } = FFParts

  const PROPS = {
    label: String, name: String, help: String, accept: String, maxSize: Number, max: Number, multiple: Boolean,
    required: Boolean, readonly: { type: Boolean, default: undefined }, disabled: { type: Boolean, default: undefined },
    error: { type: String, default: undefined }, uploader: Function, modelValue: Array, locale: { type: String, default: 'es-MX' }, concurrency: Number
  }
  // useFormField (real) + motor: lo común a los tres
  function useField(props, emit, opts = {}) {
    const ctl = ref(null), rootEl = ref(null)
    const ff = Grana.useFormField({ name: () => props.name, required: () => props.required, readonly: () => props.readonly, disabled: () => props.disabled,
      error: () => props.error, trigger: 'change', control: ctl, root: rootEl })
    const eff = new Proxy(props, { get: (t, k) => (k === 'readonly' ? ff.readonly.value : k === 'disabled' ? ff.disabled.value : t[k]) })
    const f = useFiles(eff, emit, { onChange: () => ff.notifyChange(), ...opts })
    const setInput = (el) => { f.input.value = el; ctl.value = el }
    const setRoot = (el) => { f.root.value = el; rootEl.value = el }
    const descr = (...extra) => [f.id + '-hint', f.id + '-status', ...extra, ff.message.value ? ff.messageId.value : null].filter(Boolean).join(' ')
    const fileInput = (extra = {}) => h('input', { ref: setInput, type: 'file', class: 'ffx-input', id: ff.id.value, name: props.uploader ? undefined : props.name, accept: props.accept,
      multiple: props.multiple, disabled: eff.disabled, 'aria-disabled': eff.readonly || f.full.value ? 'true' : undefined, 'aria-required': props.required ? 'true' : undefined,
      'aria-describedby': descr(), onChange: f.onChange, onClick: f.onClick, ...extra })
    const hidden = () => (props.uploader && props.name ? f.entries.filter((e) => e.state === 'done' && e.value != null).map((e) => h('input', { type: 'hidden', name: props.name, value: e.value, disabled: eff.disabled, key: 'v' + e.key })) : null)
    const message = () => h('div', { class: 'ffx-msg', id: ff.messageId.value }, ff.message.value ? [ff.message.value.prefix ? h('span', { class: 'ff-sr' }, ff.message.value.prefix + ' ') : null, h('span', { innerHTML: icon('circle-alert') }), ' ' + ff.message.value.text] : null)
    const liveEl = () => h('div', { class: 'ff-sr ffx-live', 'aria-live': 'polite', 'aria-atomic': 'true' }, f.live.text.value)
    const notice = () => (f.notice.value ? h('div', { class: 'ffx-notice', role: 'group', 'aria-label': 'Archivos no añadidos' }, [
      h('span', { class: 'ffx-notice__icon', innerHTML: icon('triangle-alert') }),
      h('ul', { class: 'ffx-notice__list' }, f.notice.value.items.map((r) => h('li', null, [h('strong', null, r.name), ': ' + r.text]))),
      h(Grana.GBtn, { variant: 'ghost', color: 'neutral', size: 'sm', icon: true, title: 'Descartar aviso', 'aria-label': 'Descartar aviso de archivos no añadidos', onClick: () => { f.notice.value = null; f.input.value?.focus() } }, () => h(Grana.GIcon, { name: 'x' }))
    ]) : null)
    const label = (cls) => h('label', { class: cls, for: ff.id.value }, [props.label, ff.mark.value === 'required' ? h('span', { class: 'ffx-req', 'aria-hidden': 'true' }, ' *') : null, ff.markText.value ? h('span', { class: 'ffx-opt' }, ' ' + ff.markText.value) : null])
    const srProgress = (e) => (e.state === 'uploading' || e.state === 'queued' ? h('span', { class: 'ff-sr' }, h(Grana.GProgress, { size: 'sm', value: Math.round(e.progress * 100), label: 'Subida de ' + e.name, valueText: e.state === 'queued' ? 'En cola' : valueText(e, props.locale), showValue: false })) : null)
    const removeBtn = (e, size = 'xs') => {
      const up = e.state === 'uploading' || e.state === 'queued'
      return h(Grana.GBtn, { 'data-act': 'remove', variant: 'ghost', color: 'neutral', size, icon: true, title: up ? 'Cancelar subida' : 'Quitar', 'aria-label': (up ? 'Cancelar subida de ' : 'Quitar ') + e.name, onClick: () => f.remove(e.key, up ? 'cancel' : 'remove') }, () => h(Grana.GIcon, { name: 'x' }))
    }
    const retryBtn = (e, size = 'xs') => h(Grana.GBtn, { 'data-act': 'retry', variant: 'ghost', color: 'neutral', size, icon: true, title: 'Reintentar', 'aria-label': 'Reintentar ' + e.name, 'aria-describedby': e.key + '-err', onClick: () => f.retry(e.key) }, () => h(Grana.GIcon, { name: 'refresh-cw' }))
    const errText = (e) => (e.state === 'error' ? h('span', { class: 'ff-sr', id: e.key + '-err' }, 'Error: ' + e.error) : null)
    return { f, ff, eff, setInput, setRoot, descr, fileInput, hidden, message, liveEl, notice, label, srProgress, removeBtn, retryBtn, errText }
  }
  // Recién añadidos: aterrizan una vez (la clase se retira sola al acabar la animación)
  const landed = new WeakSet()
  const landing = (e) => { if (!e.isNew || landed.has(e)) return false; landed.add(e); return true }
  const onLand = (ev) => ev.target.classList.remove('is-landing')

  // =====================================================================================================================
  // A · LÍNEA DE ADJUNTOS. El campo es un campo: mismo alto que GInput, comparte fila; los archivos son fichas en la caja.
  // No hay zona de soltar: cuando se arrastran archivos sobre la PÁGINA, cada campo que los admite muestra su destino.
  // =====================================================================================================================
  const XFieldA = {
    name: 'XFieldA', inheritAttrs: false, props: PROPS, emits: ['update:modelValue'],
    setup(props, { emit, expose, attrs }) {
      const c = useField(props, emit)
      const { f, ff, eff } = c
      expose({ add: (x, v) => f.add(x, v), api: f })
      const pageOk = computed(() => {
        if (!page.dragging) return null
        return !f.full.value && FF.dragAccepts(page.types, props.accept)
      })
      return () => {
        const awake = page.dragging && !f.blocked.value
        const chips = f.entries.map((e) => {
          const pv = f.preview(e), land = landing(e)
          return h('li', { key: e.key, class: ['ffa-chip', 'is-' + e.state, { 'is-landing': land }], 'data-key': e.key, 'data-state': e.state, style: { '--_p': e.progress }, onAnimationend: onLand }, [
            h(Grana.GSummary, { class: 'ffa-chip__sum', layout: 'inline', size: 'xs', title: e.name, facts: e.state === 'error' ? [{ label: 'Error', value: e.error, bare: true }] : [], subtitle: fmtSize(e.size, props.locale),
              avatar: pv ? { src: pv, shape: 'square', icon: 'image', name: e.name } : false, icon: pv ? null : iconOf(e) }),
            c.errText(e), c.srProgress(e),
            eff.readonly || eff.disabled ? null : [e.state === 'error' ? c.retryBtn(e) : null, c.removeBtn(e)]
          ])
        })
        const addText = eff.readonly ? (f.count.value ? 'Solo lectura' : 'Sin archivos') : f.full.value ? `${f.count.value} de ${f.max.value}` : f.count.value ? (props.multiple ? 'Adjuntar más' : 'Cambiar') : (props.multiple ? 'Adjuntar archivos' : 'Adjuntar archivo')
        return h('div', { ...attrs, ref: c.setRoot, class: ['ffa', attrs.class, { 'is-awake': awake, 'is-awake-ok': awake && pageOk.value, 'is-awake-no': awake && pageOk.value === false, 'is-over': f.over.on, 'is-over-invalid': f.over.on && !f.over.valid,
          'is-readonly': eff.readonly, 'is-disabled': eff.disabled, 'is-invalid': ff.invalid.value, 'is-full': f.full.value, 'has-files': f.count.value }], 'data-field': props.name, onPaste: f.onPaste, ...f.zone }, [
          c.label('ffa__label'),
          h('div', { class: 'ffa__box', onClick: (ev) => { if (ev.target.closest('button,input,.ffa-chip')) return; f.open() } }, [
            f.count.value ? h('ul', { class: 'ffa__chips', 'aria-label': 'Archivos de ' + props.label }, chips) : null,
            addText === null ? null : h('span', { class: 'ffa__add' }, [c.fileInput(), h('span', { class: 'ffa__add-icon', innerHTML: icon(eff.readonly ? 'lock' : f.full.value ? 'check' : 'plus') }), h('span', { class: 'ffa__add-text' }, addText),
              !f.count.value && !eff.readonly ? h('span', { class: 'ffa__add-hint', 'aria-hidden': 'true' }, props.help || f.hint.value) : null]),
            // Destino de soltar: capa encima de la caja, más grande que ella, solo pintura (la caja no cambia de tamaño)
            h('div', { class: 'ffa__portal', 'aria-hidden': 'true' }, [h('span', { class: 'ffa__portal-text' }, f.over.on ? (f.over.valid ? `Soltar en ${props.label}` : `${props.label} no admite estos archivos`) : pageOk.value === false ? `No admite estos archivos` : `Soltar aquí · ${describeAccept(props.accept) || 'archivos'}`)])
          ]),
          h('div', { class: 'ffa__foot' }, [
            h('p', { class: 'ffa__meta' }, [h('span', { id: f.id + '-hint', class: f.count.value || eff.readonly ? '' : 'ff-sr' }, props.help || f.hint.value), h('span', { id: f.id + '-status', class: 'ffa__status' }, f.statusText.value)]),
            c.notice(), c.message(), c.hidden(), c.liveEl()
          ])
        ])
      }
    }
  }

  // =====================================================================================================================
  // B · MESA DE LUZ. Los archivos son objetos en una mesa: miniaturas cuadradas en rejilla. Añadir es una pieza más de
  // la mesa, en el sitio donde aparecerá lo nuevo. Subir es revelar: el velo se retira de abajo arriba.
  // =====================================================================================================================
  const XFieldB = {
    name: 'XFieldB', inheritAttrs: false, props: PROPS, emits: ['update:modelValue'],
    setup(props, { emit, expose, attrs }) {
      const c = useField(props, emit)
      const { f, ff, eff } = c
      expose({ add: (x, v) => f.add(x, v), api: f })
      return () => {
        const tiles = f.entries.map((e) => {
          const pv = f.preview(e), up = e.state === 'uploading' || e.state === 'queued', land = landing(e)
          return h('li', { key: e.key, class: ['ffb-tile', 'is-' + e.state, { 'is-landing': land }], 'data-key': e.key, 'data-state': e.state, style: { '--_p': e.progress }, onAnimationend: onLand }, [
            h('div', { class: 'ffb-tile__media', 'aria-hidden': 'true' }, pv ? h('img', { src: pv, alt: '', class: 'ffb-tile__img' }) : h('span', { class: 'ffb-tile__doc' }, [h('span', { innerHTML: icon('file-text') }), h('span', { class: 'ffb-tile__ext' }, extOf(e.name) || 'ARCHIVO')])),
            up ? h('div', { class: 'ffb-tile__veil', 'aria-hidden': 'true' }, h('span', { class: 'ffb-tile__pct' }, e.state === 'queued' ? 'En cola' : Math.round(e.progress * 100) + ' %')) : null,
            h(Grana.GSummary, { class: 'ffb-tile__cap', layout: 'row', lines: 2, size: 'xs', title: e.name, facts: e.state === 'error' ? [] : [facts(e, props.locale)[0]], subtitle: e.state === 'error' ? e.error : null,
              status: e.state === 'done' && e.isNew && props.uploader ? { label: 'Subido', color: 'success' } : e.state === 'error' ? { label: 'Error', color: 'danger' } : null }),
            c.errText(e), c.srProgress(e),
            eff.readonly || eff.disabled ? null : h('div', { class: 'ffb-tile__acts' }, [e.state === 'error' ? c.retryBtn(e, 'sm') : null, c.removeBtn(e, 'sm')])
          ])
        })
        const addText = f.over.on ? (f.over.valid ? (f.over.count > 1 ? `Soltar ${f.over.count}` : 'Soltar aquí') : f.over.full ? 'Mesa llena' : 'No se admite') : eff.readonly ? 'Solo lectura' : f.full.value ? 'Mesa llena' : (props.multiple ? 'Añadir' : f.count.value ? 'Cambiar' : 'Añadir')
        return h('div', { ...attrs, ref: c.setRoot, class: ['ffb', attrs.class, { 'is-over': f.over.on, 'is-over-invalid': f.over.on && !f.over.valid, 'is-readonly': eff.readonly, 'is-disabled': eff.disabled, 'is-invalid': ff.invalid.value, 'is-full': f.full.value, 'is-awake': page.dragging && !f.blocked.value }],
          'data-field': props.name, onPaste: f.onPaste, ...f.zone }, [
          c.label('ffb__label'),
          h('p', { class: 'ffb__meta' }, [h('span', { id: f.id + '-hint' }, props.help || f.hint.value), h('span', { class: 'ffb__status', id: f.id + '-status' }, f.statusText.value)]),
          h('div', { class: 'ffb__table' }, [
            f.count.value ? h('ul', { class: 'ffb__grid', 'aria-label': 'Archivos de ' + props.label }, tiles) : null,
            h('div', { class: 'ffb-add', onClick: (ev) => { if (ev.target.tagName !== 'INPUT') f.open() } }, [c.fileInput(),
              h('span', { class: 'ffb-add__icon', innerHTML: icon(f.over.on && !f.over.valid ? 'circle-alert' : eff.readonly ? 'lock' : f.full.value ? 'check' : 'plus') }),
              h('span', { class: 'ffb-add__text' }, addText), props.max > 1 && !eff.readonly ? h('span', { class: 'ffb-add__count', 'aria-hidden': 'true' }, `${f.count.value} / ${props.max}`) : null])
          ]),
          c.notice(), c.message(), c.hidden(), c.liveEl()
        ])
      }
    }
  }

  // =====================================================================================================================
  // C · LO QUE FALTA. El campo sabe qué espera: una casilla con nombre por documento. Cada casilla es su propio
  // <input type="file"> (name con la clave), con su estado y su error. Soltar varios en el grupo los reparte.
  // =====================================================================================================================
  const XSlot = {
    name: 'XSlot', inheritAttrs: false,
    props: { ...PROPS, slotKey: String, assigned: Boolean },
    emits: ['update:modelValue', 'zone'],
    setup(props, { emit, expose }) {
      const c = useField(props, emit)
      const { f, ff, eff } = c
      expose({ add: (x, v) => f.add(x, v), api: f, accepts: (file) => accepts(file, props.accept) && (!props.maxSize || file.size <= props.maxSize), get empty() { return !f.count.value || (props.multiple && !f.full.value) } })
      return () => {
        const e = f.entries[0], filled = !!f.count.value
        const state = !filled ? (ff.invalid.value ? 'missing' : 'empty') : f.entries.some((x) => x.state === 'error') ? 'error' : f.entries.some((x) => x.state === 'uploading' || x.state === 'queued') ? 'uploading' : 'filled'
        const mark = { empty: 'circle', missing: 'circle-alert', error: 'circle-alert', uploading: 'loader-circle', filled: 'circle-check' }[state]
        const many = props.multiple
        return h('li', { ref: c.setRoot, class: ['ffc-slot', 'is-' + state, { 'is-over': f.over.on, 'is-over-invalid': f.over.on && !f.over.valid, 'is-assigned': props.assigned, 'is-many': many, 'is-readonly': eff.readonly }],
          'data-slot': props.slotKey, 'data-field': props.name, onPaste: f.onPaste, ...f.zone }, [
          h('span', { class: ['ffc-slot__mark', 'is-' + state], innerHTML: icon(mark), 'aria-hidden': 'true' }),
          h('div', { class: 'ffc-slot__head' }, [c.label('ffc-slot__label'), h('span', { class: 'ffc-slot__hint', id: f.id + '-hint' }, props.help || f.hint.value), h('span', { class: 'ff-sr', id: f.id + '-status' }, filled ? f.statusText.value : 'Falta')]),
          h('div', { class: 'ffc-slot__body' }, [
            (filled ? f.entries : []).map((x) => {
              const pv = f.preview(x), land = landing(x)
              return h('div', { key: x.key, class: ['ffc-file', 'is-' + x.state, { 'is-landing': land }], 'data-key': x.key, 'data-state': x.state, onAnimationend: onLand }, [
                h(Grana.GSummary, { class: 'ffc-file__sum', layout: 'row', lines: 2, size: 'sm', title: x.name, facts: x.state === 'error' ? [] : facts(x, props.locale), subtitle: x.state === 'error' ? x.error : null,
                  status: statusOf(x, props.uploader), avatar: pv ? { src: pv, shape: 'square', icon: 'image', name: x.name } : false, icon: pv ? null : iconOf(x) }),
                c.errText(x),
                eff.readonly || eff.disabled ? null : h('div', { class: 'ffc-file__acts' }, [x.state === 'error' ? c.retryBtn(x, 'sm') : null, c.removeBtn(x, 'sm')]),
                x.state === 'uploading' || x.state === 'queued' ? h('span', { class: 'ffc-file__rail' }, h(Grana.GProgress, { size: 'sm', color: 'accent', value: Math.round(x.progress * 100), label: 'Subida de ' + x.name, valueText: x.state === 'queued' ? 'En cola' : valueText(x, props.locale), showValue: false })) : null
              ])
            }),
            h('span', { class: ['ffc-slot__pick', { 'is-quiet': filled && !many }], onClick: (ev) => { if (ev.target.tagName !== 'INPUT') f.open() } }, [c.fileInput(),
              h('span', { innerHTML: icon(f.over.on ? (f.over.valid ? 'arrow-down' : 'circle-alert') : eff.readonly ? 'lock' : filled && !many ? 'refresh-cw' : 'plus') }),
              h('span', null, f.over.on ? (f.over.valid ? 'Soltar aquí' : 'No se admite') : eff.readonly ? (filled ? 'Solo lectura' : 'Sin archivo') : filled ? (many ? 'Añadir otra' : 'Cambiar') : (many ? 'Añadir' : 'Elegir archivo'))])
          ]),
          h('div', { class: 'ffc-slot__foot' }, [c.notice(), c.message(), c.hidden(), c.liveEl()])
        ])
      }
    }
  }

  const XFieldC = {
    name: 'XFieldC', inheritAttrs: false,
    props: { label: String, name: String, help: String, slots: Array, modelValue: Object, uploader: Function, readonly: { type: Boolean, default: undefined }, disabled: { type: Boolean, default: undefined }, maxSize: Number, locale: { type: String, default: 'es-MX' } },
    emits: ['update:modelValue'],
    setup(props, { emit, expose, attrs }) {
      const refs = {}, assigned = reactive({}), live = ref('')
      let lt = null
      const say = (t) => { live.value = ''; clearTimeout(lt); lt = setTimeout(() => { live.value = t; FF.log && FF.log(props.label, t) }, 60) }
      const val = computed(() => props.modelValue || {})
      const set = (k, v) => emit('update:modelValue', { ...val.value, [k]: v })
      // Una casilla cuenta como hecha cuando su archivo está listo (sin subidas en curso ni errores)
      const ok = (s) => { const v = val.value[s.key] || []; return v.length && v.every((x) => x.state === 'done' || x.state === 'ready') }
      const filledCount = computed(() => props.slots.filter((s) => !s.optional && ok(s)).length)
      const needed = computed(() => props.slots.filter((s) => !s.optional).length)
      const missing = computed(() => props.slots.filter((s) => !s.optional && !ok(s)).map((s) => s.label))
      // Reparto: cada archivo a la primera casilla libre que lo admite; si el nombre del archivo contiene palabras del nombre
      // de una casilla («reverso»), esa gana. Lo que no tiene sitio se dice y no se pierde: se queda sin asignar.
      const words = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2)
      function distribute(files) {
        const taken = new Set(), out = [], left = []
        for (const file of files) {
          const fw = words(file.name)
          const cands = props.slots.filter((s) => refs[s.key] && !taken.has(s.key) && refs[s.key].empty && refs[s.key].accepts(file))
          const best = cands.map((s) => ({ s, score: words(s.label).filter((w) => fw.includes(w)).length })).sort((a, b) => b.score - a.score)[0]
          if (!best) { left.push(file.name); continue }
          if (!best.s.multiple) taken.add(best.s.key)
          refs[best.s.key].add([file], 'drop'); out.push([file.name, best.s.label]); assigned[best.s.key] = Date.now()
        }
        setTimeout(() => { for (const k in assigned) if (Date.now() - assigned[k] > 1500) delete assigned[k] }, 1600)
        const parts = out.map(([n, l]) => `${n} → ${l}`)
        if (left.length) parts.push(`Sin casilla libre para ${left.join(', ')}`)
        say(parts.join('. ') + '.')
        return { out, left }
      }
      const over = ref(false)
      let depth = 0
      const hasFiles = (e) => [...(e.dataTransfer?.types || [])].includes('Files')
      const inSlot = (e) => e.target.closest && e.target.closest('.ffc-slot')
      const zone = {
        onDragenter: (e) => { if (!hasFiles(e)) return; depth++; over.value = true; e.preventDefault() },
        onDragleave: (e) => { if (!hasFiles(e)) return; depth = Math.max(0, depth - 1); if (!depth) over.value = false },
        onDragover: (e) => { if (hasFiles(e) && !inSlot(e)) { e.preventDefault(); e.dataTransfer.dropEffect = 'copy' } },
        onDrop: (e) => { depth = 0; over.value = false; if (!hasFiles(e) || inSlot(e) || props.readonly || props.disabled) return; e.preventDefault(); distribute([...e.dataTransfer.files]) }
      }
      expose({ distribute, refs })
      return () => h('fieldset', { ...attrs, class: ['ffc', attrs.class, { 'is-over': over.value, 'is-awake': page.dragging && !props.readonly && !props.disabled, 'is-complete': !missing.value.length }], 'data-field': props.name, ...zone }, [
        h('legend', { class: 'ffc__legend' }, props.label),
        h('div', { class: 'ffc__progress' }, [
          h('span', { class: 'ffc__count' }, `${filledCount.value} de ${needed.value}`),
          h('span', { class: 'ffc__bar', 'aria-hidden': 'true' }, props.slots.filter((s) => !s.optional).map((s) => h('span', { class: ['ffc__seg', { 'is-on': ok(s) }] }))),
          h('span', { class: 'ffc__missing' }, missing.value.length ? 'Pendiente: ' + missing.value.join(', ') : 'Completo')
        ]),
        props.help ? h('p', { class: 'ffc__help' }, props.help) : null,
        h('ul', { class: 'ffc__slots' }, props.slots.map((s) => h(XSlot, { key: s.key, ref: (r) => { if (r) refs[s.key] = r; else delete refs[s.key] }, slotKey: s.key, label: s.label, name: `${props.name}[${s.key}]`,
          accept: s.accept, maxSize: s.maxSize || props.maxSize, multiple: !!s.multiple, max: s.max, required: !s.optional, help: s.help, uploader: props.uploader, readonly: props.readonly, disabled: props.disabled,
          locale: props.locale, assigned: !!assigned[s.key], modelValue: val.value[s.key] || [], 'onUpdate:modelValue': (v) => set(s.key, v) }))),
        h('div', { class: 'ffc__drop', 'aria-hidden': 'true' }, 'Suelta aquí para repartir en las casillas libres'),
        h('div', { class: 'ff-sr', 'aria-live': 'polite', 'aria-atomic': 'true' }, live.value)
      ])
    }
  }

  window.FFConcepts = { XFieldA, XFieldB, XFieldC, XSlot }
})()
