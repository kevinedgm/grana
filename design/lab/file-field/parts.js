// Piezas compartidas del prototipo del campo de archivos (kiwi): la fila de un archivo sobre componentes REALES de dist/
// (GSummary, GProgress, GBtn, GIcon). Clases ff-*: de prototipo; el CSS definitivo es de coco. Expone window.FFParts.
(function () {
  const { h, computed } = Vue
  const { fmtSize, extOf, isImage, iconOf } = FF

  const facts = (e, locale) => [
    { label: 'Tamaño', value: fmtSize(e.size, locale), priority: 1, bare: true },
    { label: 'Tipo', value: extOf(e.name) || 'Archivo', priority: 2, bare: true }
  ]
  const STATUS = {
    queued: { label: 'En cola', color: 'neutral' },
    uploading: null, // el porcentaje
    done: { label: 'Subido', color: 'success' },
    error: { label: 'Error', color: 'danger' }
  }
  function statusOf(e, uploader) {
    if (!uploader) return null
    if (e.state === 'uploading') return { label: Math.round(e.progress * 100) + ' %', color: 'info' }
    if (e.state === 'done' && !e.isNew) return null // ya era parte del registro
    return STATUS[e.state] || null
  }
  const valueText = (e, locale) => `${Math.round(e.progress * 100)} %, ${fmtSize(e.loaded || 0, locale)} de ${fmtSize(e.size, locale)}`

  // Fila de un archivo: ficha (nombre, tamaño, tipo, estado, miniatura) + acciones + carril de progreso sin alto propio
  const XFileItem = {
    name: 'XFileItem',
    props: { e: Object, uploader: Function, blocked: Boolean, preview: String, locale: String, size: { type: String, default: 'md' } },
    emits: ['remove', 'retry'],
    setup(props, { emit }) {
      const up = computed(() => props.e.state === 'uploading' || props.e.state === 'queued')
      return () => {
        const e = props.e, err = e.state === 'error'
        const avatar = props.preview ? { src: props.preview, shape: 'square', icon: 'image', name: e.name } : false
        return h('li', { class: ['ff-item', 'is-' + e.state], 'data-key': e.key, 'data-state': e.state }, [
          h(Grana.GSummary, { class: 'ff-item__sum', layout: 'row', lines: 2, size: props.size, title: e.name,
            facts: err ? [] : facts(e, props.locale), subtitle: err ? e.error : null, status: statusOf(e, props.uploader), avatar, icon: avatar ? null : iconOf(e) }),
          err ? h('span', { class: 'ff-sr', id: e.key + '-err' }, 'Error: ' + e.error) : null,
          props.blocked ? null : h('div', { class: 'ff-item__acts' }, [
            err ? h(Grana.GBtn, { 'data-act': 'retry', variant: 'ghost', color: 'neutral', size: 'sm', icon: true, title: 'Reintentar', 'aria-label': 'Reintentar ' + e.name, 'aria-describedby': e.key + '-err', onClick: () => emit('retry', e.key) }, () => h(Grana.GIcon, { name: 'refresh-cw' })) : null,
            h(Grana.GBtn, { 'data-act': 'remove', variant: 'ghost', color: 'neutral', size: 'sm', icon: true, title: up.value ? 'Cancelar subida' : 'Quitar',
              'aria-label': (up.value ? 'Cancelar subida de ' : 'Quitar ') + e.name, onClick: () => emit('remove', e.key, up.value ? 'cancel' : 'remove') }, () => h(Grana.GIcon, { name: 'x' }))
          ]),
          up.value ? h('span', { class: 'ff-item__rail' }, h(Grana.GProgress, { size: 'sm', color: 'accent', value: Math.round(e.progress * 100), label: 'Subida de ' + e.name, valueText: e.state === 'queued' ? 'En cola' : valueText(e, props.locale), showValue: false })) : null
        ])
      }
    }
  }

  // Icono de Lucide desde design/lab/lucide-icons.js (solo para lo que no es un componente: caras del prototipo)
  const icon = (name, cls = '') => window.lucide(name, 'ff-ico ' + cls)

  // Iconos que pone «la aplicación» (no están en la lista de la librería): cadenas con la marca de lucide-static, como en
  // una aplicación real con createIcons (icons.md §5). El dibujo sale de design/lab/lucide-icons.js (Lucide, generado).
  const APP_ICONS = ['file-text', 'image', 'inbox', 'folder', 'list', 'table']
  const appIcons = () => Grana.createIcons(APP_ICONS.map((n) => `<svg class="lucide lucide-${n}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">${window.LUCIDE_ICONS[n]}</svg>`))

  window.FFParts = { XFileItem, facts, statusOf, valueText, icon, appIcons }
})()
