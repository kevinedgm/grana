// r01 (kiwi): BASE FUNCIONAL del campo de archivos con la forma convencional a propósito (zona rectangular).
// La identidad se decide en ../r02/. Referencia de comportamiento sobre GSummary, GProgress, GBtn, GIcon, GForm y
// useFormField REALES de dist/. Expone window.XFileField.
(function () {
  const { ref, computed, h } = Vue
  const { useFiles } = FF
  const { XFileItem, icon } = FFParts

  const XFileField = {
    name: 'XFileField',
    inheritAttrs: false,
    props: {
      label: String, name: String, help: String, accept: String, maxSize: Number, max: Number, multiple: Boolean,
      required: Boolean, readonly: { type: Boolean, default: undefined }, disabled: { type: Boolean, default: undefined },
      error: { type: String, default: undefined }, uploader: Function, modelValue: Array, locale: { type: String, default: 'es-MX' }, concurrency: Number
    },
    emits: ['update:modelValue'],
    setup(props, { emit, expose, attrs }) {
      let ffApi = null
      const ctl = ref(null), rootEl = ref(null)
      const ff = Grana.useFormField({ name: () => props.name, required: () => props.required, readonly: () => props.readonly, disabled: () => props.disabled,
        error: () => props.error, trigger: 'change', control: ctl, root: rootEl })
      // readonly/disabled resueltos con la precedencia de GForm (prop › contexto › false)
      const eff = new Proxy(props, { get: (t, k) => (k === 'readonly' ? ff.readonly.value : k === 'disabled' ? ff.disabled.value : t[k]) })
      const f = useFiles(eff, emit, { onChange: () => ff.notifyChange() })
      ffApi = f
      expose({ add: (files, via) => f.add(files, via), api: f })
      const descr = computed(() => [f.id + '-hint', f.id + '-status', ff.message.value ? ff.messageId.value : null].filter(Boolean).join(' '))
      return () => {
        // El <input> real es el control: input.value y root.value del motor apuntan a los mismos elementos que useFormField
        const setInput = (el) => { f.input.value = el; ctl.value = el }
        const setRoot = (el) => { f.root.value = el; rootEl.value = el }
        const s = f
        const zoneText = s.over.on ? (s.over.valid ? (s.over.count > 1 ? `Suelta para añadir ${s.over.count} archivos` : 'Suelta para añadir') : s.over.full ? 'Límite alcanzado' : 'Aquí no se admite este archivo')
          : eff.readonly ? 'Solo lectura' : s.full.value ? 'Límite alcanzado: quita uno para añadir otro' : null
        return h('div', { ...attrs, ref: setRoot, class: ['ff', attrs.class, { 'is-over': s.over.on, 'is-over-invalid': s.over.on && !s.over.valid, 'is-full': s.full.value, 'is-readonly': eff.readonly, 'is-disabled': eff.disabled, 'is-invalid': ff.invalid.value, 'has-files': s.count.value }],
          onPaste: s.onPaste, 'data-field': props.name }, [
          h('label', { class: 'ff__label', for: ff.id.value }, [props.label, ff.mark.value === 'required' ? h('span', { class: 'ff__req', 'aria-hidden': 'true' }, ' *') : null, ff.markText.value ? h('span', { class: 'ff__opt' }, ' ' + ff.markText.value) : null]),
          h('div', { class: 'ff__zone', ...s.zone, onClick: (ev) => { if (ev.target !== s.input.value) s.open() } }, [
            h('input', { ref: setInput, type: 'file', class: 'ff__input', id: ff.id.value, name: props.uploader ? undefined : props.name, accept: props.accept, multiple: props.multiple,
              disabled: eff.disabled, 'aria-disabled': eff.readonly || s.full.value ? 'true' : undefined, 'aria-required': props.required ? 'true' : undefined,
              'aria-describedby': descr.value, onChange: s.onChange, onClick: s.onClick }),
            h('span', { class: 'ff__zone-icon', innerHTML: icon(s.over.on && !s.over.valid ? 'circle-alert' : eff.readonly ? 'lock' : 'inbox') }),
            h('span', { class: 'ff__zone-text' }, zoneText ? zoneText : [h('span', { class: 'ff__choose' }, props.multiple ? 'Elegir archivos' : 'Elegir archivo'), ' o arrastrar aquí']),
            h('span', { class: 'ff__hint', id: s.id + '-hint' }, props.help || s.hint.value)
          ]),
          h('p', { class: 'ff__status', id: s.id + '-status' }, s.statusText.value),
          s.notice.value ? h('div', { class: 'ff__notice', role: 'group', 'aria-label': 'Archivos no añadidos' }, [
            h('span', { class: 'ff__notice-icon', innerHTML: icon('triangle-alert') }),
            h('ul', { class: 'ff__notice-list' }, s.notice.value.items.map((r) => h('li', null, [h('strong', null, r.name), ': ' + r.text]))),
            h(Grana.GBtn, { class: 'ff__notice-close', variant: 'ghost', color: 'neutral', size: 'sm', icon: true, title: 'Descartar aviso', 'aria-label': 'Descartar aviso de archivos no añadidos', onClick: () => { s.notice.value = null; s.input.value?.focus() } }, () => h(Grana.GIcon, { name: 'x' }))
          ]) : null,
          s.count.value ? h('ul', { class: 'ff__list', 'aria-label': 'Archivos de ' + props.label }, s.entries.map((e) => h(XFileItem, { key: e.key, e, uploader: props.uploader, blocked: eff.readonly || eff.disabled, preview: s.preview(e), locale: props.locale,
            onRemove: (k, how) => s.remove(k, how), onRetry: (k) => s.retry(k) }))) : null,
          // Con adaptador, el envío lleva lo que devolvió el servidor (un campo oculto por archivo subido); el binario no viaja
          props.uploader && props.name ? s.entries.filter((e) => e.state === 'done' && e.value != null).map((e) => h('input', { type: 'hidden', name: props.name, value: e.value, disabled: eff.disabled, key: 'v' + e.key })) : null,
          h('div', { class: 'ff__msg', id: ff.messageId.value }, ff.message.value ? [ff.message.value.prefix ? h('span', { class: 'ff-sr' }, ff.message.value.prefix + ' ') : null, h('span', { innerHTML: icon('circle-alert') }), ' ' + ff.message.value.text] : null),
          h('div', { class: 'ff-sr ff__live', 'aria-live': 'polite', 'aria-atomic': 'true' }, s.live.text.value)
        ])
      }
    }
  }
  window.XFileField = XFileField
})()
