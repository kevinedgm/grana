// Banco de coco para GDocumentPreview.css (ver estilo-banco.html). Emite el marcado del contrato y hace SOLO lo que el
// estilo necesita. No es el .vue de bruno: sin motor de carga, sin acciones reales, sin anuncios.
;(async function () {
  const { createApp, h, reactive, ref, computed, watch, onMounted, onBeforeUnmount, nextTick, defineComponent } = Vue
  const { GBtn, GMenu, GDialog, GEmpty, GSummary, GProgress, GInput } = Grana
  const Q = new URLSearchParams(location.search)
  const html = document.documentElement
  if (Q.get('dark')) html.dataset.theme = 'dark'
  if (Q.get('dir') === 'rtl') html.dir = 'rtl'
  if (Q.get('theme')) document.getElementById('gen').href = `../tema-oscuro/dark-color-presence/generated/${Q.get('theme')}.css`
  if (Q.get('slow')) document.getElementById('slow-css').textContent = ':root{--g-duration-fast:calc(120ms*5);--g-duration-press:calc(160ms*5);--g-duration-slow:calc(240ms*5)}'
  const tog = (id, fn) => document.getElementById(id).addEventListener('click', fn)
  tog('t-dark', () => { html.dataset.theme = html.dataset.theme === 'dark' ? 'light' : 'dark' })
  tog('t-rtl', () => { html.dir = html.dir === 'rtl' ? 'ltr' : 'rtl' })

  // Iconos que aún no están en la lista de la librería (los añade bruno, icons.md v0.12): desde lucide-static
  const LS = '../../../node_modules/lucide-static/dist/esm/icons/'
  const NEED = ['download', 'printer', 'zoom-in', 'zoom-out', 'maximize-2', 'minimize-2', 'file-lock', 'wifi-off', 'file-question-mark', 'file-exclamation-point', 'panel-left', 'ellipsis-vertical', 'loader-circle', 'circle-check', 'circle-alert', 'file-text', 'rotate-cw']
  await Promise.all(NEED.filter((n) => !window.LUCIDE_ICONS[n]).map(async (n) => {
    const { default: src } = await import(LS + n + '.mjs')
    const m = src.match(/<svg[^>]*>([\s\S]*?)<\/svg>/)
    window.LUCIDE_ICONS[n] = m[1].replace(/\s+/g, ' ').trim()
  }))
  const Ic = (n) => h('span', { style: 'display:contents', innerHTML: window.lucide(n) })

  // Medida de space (para is-narrow y is-dense), como hará el .vue con sizeObserver
  const probe = document.createElement('div')
  probe.style.cssText = 'position:absolute;visibility:hidden;inline-size:var(--g-space-1)'
  document.body.append(probe)
  const space = () => probe.getBoundingClientRect().width

  // Página simulada: papel y tinta del documento (píxeles del documento, no del tema)
  const PAGE = { w: 612, h: 792 }
  function drawPage (cv, i, n, scale) {
    const dpr = Math.min(2, devicePixelRatio || 1)
    cv.width = Math.round(PAGE.w * scale * dpr); cv.height = Math.round(PAGE.h * scale * dpr)
    const c = cv.getContext('2d'); c.setTransform(scale * dpr, 0, 0, scale * dpr, 0, 0)
    c.fillStyle = '#fff'; c.fillRect(0, 0, PAGE.w, PAGE.h)
    c.fillStyle = '#222'; c.font = 'bold 22px sans-serif'; c.fillText(i === 1 ? 'Contrato de arrendamiento' : `Cláusula ${i}`, 60, 90)
    c.fillStyle = '#888'
    for (let y = 130; y < PAGE.h - 80; y += 22) c.fillRect(60, y, 492 - ((y * 7 + i * 13) % 120), 8)
    c.fillStyle = '#555'; c.font = '14px sans-serif'; c.fillText(`${i} / ${n}`, PAGE.w / 2 - 14, PAGE.h - 36)
  }
  function drawPlan (cv) {
    cv.width = 900; cv.height = 600
    const c = cv.getContext('2d'); c.fillStyle = '#f4f1ea'; c.fillRect(0, 0, 900, 600)
    c.strokeStyle = '#2a3b5c'; c.lineWidth = 4; c.strokeRect(60, 60, 780, 480); c.strokeRect(60, 60, 380, 260); c.strokeRect(440, 60, 400, 480)
    c.fillStyle = '#2a3b5c'; c.font = '20px sans-serif'; c.fillText('Planta baja', 80, 570)
  }
  let planURL = null
  const plan = () => planURL || (planURL = (() => { const cv = document.createElement('canvas'); drawPlan(cv); return cv.toDataURL('image/png') })())

  const ERR = {
    network: ['error', 'wifi-off', 'Sin conexión', 'No pudimos traer el documento. Lo intentamos solos al volver la conexión.', true],
    'not-found': ['error', null, 'No encontramos este documento', 'Puede que lo hayan movido o eliminado.', true],
    forbidden: ['forbidden', null, 'No tienes acceso a este documento', 'Pide acceso a quien lo compartió.', false],
    corrupt: ['error', 'file-exclamation-point', 'El archivo está dañado', 'Descárgalo para abrirlo con otra aplicación.', false],
    empty: ['error', 'file-exclamation-point', 'El archivo está vacío', 'No tiene contenido que mostrar (0 bytes).', false]
  }
  const pct = (s) => new Intl.NumberFormat('es-MX', { style: 'percent', maximumFractionDigits: 0 }).format(s)
  let uid = 0

  // ---------------- El cuerpo (lomo, escenario, sello): dos instancias sobre un estado ----------------
  const Body = defineComponent({
    props: { s: Object, inDialog: Boolean },
    setup (props) {
      const s = props.s
      const body = ref(null); const stage = ref(null); const rail = ref(null); const seal = ref(null); const peekCv = ref(null)
      const local = reactive({ sealSize: 0, stageW: 0, railH: 0, arriving: false, peek: { show: false, page: 1 } })
      let ro, arriveT, typeT
      const yOf = (p) => ((p - 0.5) / s.pages) * 100 + '%'
      const scale = computed(() => s.kind === 'image' ? s.zoom : (s.zoom === 'fit' ? Math.max(0.2, (local.stageW - space() * 8) / PAGE.w) : s.zoom))
      const active = () => !s.dialogOpen || props.inDialog
      function arrive (p) {
        if (p === s.page) return
        local.arriving = true; s.page = p
        clearTimeout(arriveT); arriveT = setTimeout(() => { local.arriving = false }, 400)
        scrollToPage(p)
      }
      function scrollToPage (p) {
        const el = stage.value?.querySelector(`[data-page="${p}"]`)
        if (el) stage.value.scrollTop = el.offsetTop - space() * 4
      }
      function onScroll () {
        if (!active()) return
        const st = stage.value; const line = st.scrollTop + st.clientHeight * 0.3
        let cur = 1
        st.querySelectorAll('[data-page]').forEach((el) => { if (el.offsetTop <= line) cur = +el.dataset.page })
        if (cur !== s.page && !local.arriving) s.page = cur
      }
      const pageAt = (e) => { const r = rail.value; const b = r.getBoundingClientRect(); const y = e.clientY - b.top - r.clientTop; return Math.min(s.pages, Math.max(1, Math.ceil((y / r.clientHeight) * s.pages))) }
      function showPeek (p) { local.peek.page = p; local.peek.show = true; nextTick(() => { if (peekCv.value) drawPage(peekCv.value, p, s.pages, (space() * 30) / PAGE.w) }) }
      function onKey (e) {
        const k = e.key; let p = null
        if (/^[0-9]$/.test(k)) { s.typed = (s.typed || '') + k; clearTimeout(typeT); typeT = setTimeout(commit, 900); e.preventDefault(); return }
        if (k === 'Escape' && s.typed) { s.typed = ''; return }
        if (k === 'Enter' && s.typed) { commit(); return }
        const rtl = getComputedStyle(rail.value).direction === 'rtl'
        if (k === 'ArrowDown' || k === (rtl ? 'ArrowLeft' : 'ArrowRight')) p = s.page + 1
        else if (k === 'ArrowUp' || k === (rtl ? 'ArrowRight' : 'ArrowLeft')) p = s.page - 1
        else if (k === 'PageDown') p = s.page + Math.max(1, Math.round(s.pages / 10))
        else if (k === 'PageUp') p = s.page - Math.max(1, Math.round(s.pages / 10))
        else if (k === 'Home') p = 1
        else if (k === 'End') p = s.pages
        if (p != null) { e.preventDefault(); p = Math.min(s.pages, Math.max(1, p)); arrive(p); showPeek(p) }
      }
      function commit () { clearTimeout(typeT); if (!s.typed) return; const p = Math.min(s.pages, Math.max(1, +s.typed)); s.typed = ''; arrive(p) }
      onMounted(() => {
        ro = new ResizeObserver(() => {
          if (seal.value) local.sealSize = seal.value.offsetHeight
          if (stage.value) local.stageW = stage.value.clientWidth
          local.railH = body.value ? body.value.clientHeight - space() * 30 : 0
        })
        if (seal.value) ro.observe(seal.value)
        if (stage.value) ro.observe(stage.value)
        if (body.value) ro.observe(body.value)
      })
      onBeforeUnmount(() => ro?.disconnect())
      watch(() => [scale.value, s.rotation, s.phase], () => nextTick(() => stage.value?.querySelectorAll('canvas[data-c]').forEach((cv) => drawPage(cv, +cv.dataset.c, s.pages, scale.value))), { flush: 'post', immediate: true })
      const thumbCv = (el, i) => { if (el && !el.dataset.d) { el.dataset.d = 1; drawPage(el, i, s.pages, 0.16) } }

      return () => {
        const ready = s.phase === 'ready'
        const hasRail = ready && s.kind === 'canvas' && s.pages > 1
        const dense = hasRail && local.railH > 0 && s.pages * space() > local.railH
        const spine = ready && s.kind !== 'frame' ? h('div', { class: 'g-document-preview__spine', role: 'group', 'aria-label': 'Navegación del documento' }, [
          hasRail ? h(GBtn, { class: 'g-document-preview__thumbs-toggle', icon: true, variant: 'ghost', size: 'sm', 'aria-label': 'Miniaturas', 'aria-pressed': String(s.thumbs), onClick: () => { s.thumbs = !s.thumbs } }, () => Ic('panel-left')) : null,
          hasRail && !s.thumbs ? h('div', {
            ref: rail, class: ['g-document-preview__rail', dense && 'is-dense', s.typed && 'is-typing'], role: 'slider', tabindex: 0, 'aria-orientation': 'vertical', 'aria-label': 'Página',
            'aria-valuemin': 1, 'aria-valuemax': s.pages, 'aria-valuenow': s.page, 'aria-valuetext': `Página ${s.page} de ${s.pages}`,
            onKeydown: onKey, onFocus: () => showPeek(s.page), onBlur: () => { commit(); local.peek.show = false },
            onPointermove: (e) => showPeek(pageAt(e)), onPointerleave: () => { if (document.activeElement !== rail.value) local.peek.show = false },
            onPointerdown: (e) => arrive(pageAt(e))
          }, [
            ...Array.from({ length: s.pages }, (_, i) => h('span', { class: ['g-document-preview__tick', i + 1 === s.page && 'is-current'], 'aria-hidden': 'true' })),
            h('span', { class: ['g-document-preview__mark', local.arriving && 'is-arriving'], style: { '--_y': yOf(s.page) }, 'aria-hidden': 'true' }, s.typed || String(s.page)),
            h('span', { class: ['g-document-preview__peek', local.peek.show && 'is-shown'], style: { '--_y': yOf(local.peek.page) }, 'aria-hidden': 'true' }, [h('canvas', { ref: peekCv }), h('span', { class: 'g-document-preview__peek-label' }, `Página ${local.peek.page} de ${s.pages}`)])
          ]) : null,
          hasRail && s.thumbs ? h('nav', { class: 'g-document-preview__thumbs', 'aria-label': 'Páginas' }, h('ol', { tabindex: -1 },
            Array.from({ length: s.pages }, (_, i) => h('li', null, h('button', { type: 'button', class: 'g-document-preview__thumb', tabindex: i + 1 === s.page ? 0 : -1, 'aria-current': i + 1 === s.page ? 'page' : undefined, 'aria-label': `Página ${i + 1} de ${s.pages}`, onClick: () => arrive(i + 1) }, [
              h('canvas', { ref: (el) => thumbCv(el, i + 1), 'aria-hidden': 'true' }), h('span', { class: 'g-document-preview__thumb-label', 'aria-hidden': 'true' }, String(i + 1))
            ]))))) : null,
          h('div', { class: 'g-document-preview__zoom', role: 'toolbar', 'aria-orientation': 'vertical', 'aria-label': 'Zoom' }, [
            h(GBtn, { icon: true, variant: 'ghost', size: 'sm', 'aria-label': 'Acercar', onClick: () => { s.zoom = Math.min(4, (s.zoom === 'fit' ? scale.value : s.zoom) * 1.25) } }, () => Ic('zoom-in')),
            h(GMenu, { label: 'Zoom', items: [{ type: 'group', label: 'Zoom', items: [{ type: 'radio', id: 'fit', label: 'Ajustar al ancho', checked: s.zoom === 'fit' }, ...[0.5, 1, 2].map((z) => ({ type: 'radio', id: 'z' + z, label: pct(z), checked: s.zoom === z }))] }], closeOnSelect: 'always', onSelect: ({ id }) => { s.zoom = id === 'fit' ? 'fit' : +id.slice(1) } }, {
              trigger: ({ attrs }) => h('button', { ...attrs, type: 'button', class: 'g-document-preview__zoom-value', 'aria-label': `Zoom: ${pct(scale.value)}` }, pct(scale.value))
            }),
            h(GBtn, { icon: true, variant: 'ghost', size: 'sm', 'aria-label': 'Alejar', onClick: () => { s.zoom = Math.max(0.25, (s.zoom === 'fit' ? scale.value : s.zoom) / 1.25) } }, () => Ic('zoom-out'))
          ])
        ]) : null

        let inner
        if (s.phase === 'ready' && s.kind === 'canvas') {
          const sc = scale.value
          inner = h('div', { class: 'g-document-preview__pages' }, Array.from({ length: s.pages }, (_, i) => h('div', { class: 'g-document-preview__page', 'data-page': i + 1, 'data-drawn': '', role: 'img', 'aria-label': `Página ${i + 1} de ${s.pages}`, style: { '--_w': PAGE.w * sc + 'px', '--_h': PAGE.h * sc + 'px' } },
            h('canvas', { 'data-c': i + 1, 'aria-hidden': 'true' }))))
        } else if (s.phase === 'ready' && s.kind === 'image') {
          const z = s.zoom === 'fit' ? Math.min(1, (local.stageW - space() * 8) / 900) : s.zoom
          const rot = s.rotation % 180 !== 0
          inner = h('div', { class: 'g-document-preview__pages' }, h('div', { class: 'g-document-preview__page', 'data-page': 1, 'data-drawn': '', 'data-rotation': s.rotation || undefined, role: 'img', 'aria-label': 'Plano planta baja.png', style: { '--_w': (rot ? 600 : 900) * z + 'px', '--_h': (rot ? 900 : 600) * z + 'px' } },
            h('img', { class: 'g-document-preview__image', src: plan(), alt: '' })))
        } else if (s.phase === 'ready' && s.kind === 'frame') {
          inner = h('iframe', { class: 'g-document-preview__frame', title: 'Vista previa de Contrato.pdf', srcdoc: '<body style="margin:0;font:14px sans-serif;background:#525659;color:#fff;display:grid;place-items:center;height:100vh">Visor PDF del navegador</body>' })
        } else if (s.phase === 'loading') {
          inner = [h('div', { class: ['g-document-preview__mold', 'is-shown'], 'aria-hidden': 'true' }),
            s.progress ? h('div', { class: 'g-document-preview__progress' }, h(GProgress, { value: 42, max: 100, label: 'Cargando Contrato.pdf', showLabel: true })) : null,
            s.long ? h('div', { class: 'g-document-preview__long' }, [h('p', null, 'Contrato.pdf sigue cargando. Puedes cancelar o esperar.'), h(GBtn, { variant: 'outline', size: 'sm' }, () => 'Cancelar')]) : null]
        } else if (s.phase === 'password') {
          inner = h('div', { class: 'g-document-preview__password', role: 'group', 'aria-label': 'Este documento tiene contraseña' }, [
            h('p', { class: 'g-document-preview__password-title' }, 'Este documento tiene contraseña'),
            h(GInput, { type: 'password', label: 'Contraseña del documento', modelValue: '', error: s.wrong ? 'La contraseña no es correcta' : undefined }),
            h(GBtn, { size: 'sm' }, () => 'Abrir')
          ])
        } else if (s.phase === 'error') {
          const [cause, icon, t, d, retry] = ERR[s.err]
          inner = h(GEmpty, { class: 'g-document-preview__empty', cause, title: t, description: d }, {
            ...(icon ? { icon: () => Ic(icon) } : {}),
            ...(retry ? { actions: () => h(GBtn, { variant: 'outline', size: 'sm' }, () => 'Reintentar') } : s.err === 'corrupt' ? { actions: () => h(GBtn, { variant: 'outline', size: 'sm' }, () => 'Descargar el original') } : {})
          })
        } else if (['unsupported', 'too-large', 'no-inline'].includes(s.phase)) {
          const M = { unsupported: ['file-question-mark', 'Este tipo de archivo no tiene vista previa', 'Descárgalo para abrirlo con su aplicación.'], 'too-large': ['file-exclamation-point', 'Es demasiado grande para verlo aquí', 'El límite es 20 MB.'], 'no-inline': ['file-question-mark', 'Tu navegador no muestra PDF en la página', 'Descárgalo o abre el original.'] }[s.phase]
          inner = h(GEmpty, { class: 'g-document-preview__empty', cause: 'none', title: M[1], description: M[2] }, { icon: () => Ic(M[0]), actions: () => h(GBtn, { variant: 'outline', size: 'sm' }, () => 'Descargar') })
        }
        const docStage = ready && s.kind !== 'frame'
        const stageEl = h('div', {
          ref: stage, class: ['g-document-preview__stage', s.kind === 'image' && ready && s.zoom !== 'fit' && 'is-pannable'], role: docStage ? 'document' : 'group', tabindex: docStage ? 0 : undefined,
          'aria-label': 'Vista previa de Contrato.pdf', 'aria-describedby': s.ids.status, 'aria-busy': s.phase === 'loading' ? 'true' : undefined, onScroll,
          onKeydown: (e) => { if (e.key === '+' || e.key === '=') s.zoom = Math.min(4, scale.value * 1.25); else if (e.key === '-') s.zoom = Math.max(0.25, scale.value / 1.25); else if (e.key === '0') s.zoom = 'fit' }
        }, inner)
        const r = s.receipt
        const facts = s.kind === 'image' ? [{ label: 'Tipo', value: 'PNG', priority: 1 }, { label: 'Tamaño', value: '1,2 MB', priority: 2 }] : [{ label: 'Tipo', value: 'PDF', priority: 1 }, { label: 'Páginas', value: `${s.pages} págs.`, priority: 2 }, { label: 'Tamaño', value: '2,4 MB', priority: 3 }]
        const sealEl = h('div', { ref: seal, class: 'g-document-preview__seal', role: 'toolbar', 'aria-label': 'Archivo y acciones' }, [
          h(GSummary, { layout: 'inline', size: 'sm', icon: s.kind === 'image' ? 'image' : 'file-text', title: s.kind === 'image' ? 'Plano planta baja.png' : 'Contrato de arrendamiento del local 4.pdf', facts: r ? [] : facts }),
          r ? h('span', { class: ['g-document-preview__receipt', 'is-' + r] }, [
            Ic(r === 'busy' ? 'loader-circle' : r === 'failed' ? 'circle-alert' : 'circle-check'),
            h('span', { class: 'g-document-preview__receipt-text' }, r === 'busy' ? 'Enviando…' : r === 'failed' ? 'No se envió' : 'Enviado a ana.ruiz@ejemplo.mx'),
            r === 'failed' ? h(GBtn, { variant: 'link', size: 'sm' }, () => 'Reintentar') : null
          ]) : null,
          h('div', { class: 'g-document-preview__actions' }, [
            h(GBtn, { icon: true, variant: 'ghost', size: 'sm', 'aria-label': 'Descargar' }, () => Ic('download')),
            s.kind !== 'image' || true ? h(GBtn, { icon: true, variant: 'ghost', size: 'sm', 'aria-label': 'Imprimir', 'aria-disabled': s.phase === 'loading' ? 'true' : undefined }, () => Ic('printer')) : null,
            h(GMenu, { label: 'Más acciones', align: 'end', items: [{ id: 'rotate', label: 'Girar a la derecha' }, { id: 'details', type: 'checkbox', label: 'Detalles', checked: s.details }], onSelect: ({ id }) => { if (id === 'details') s.details = !s.details; if (id === 'rotate') s.rotation = (s.rotation + 90) % 360 } }, {
              trigger: ({ attrs }) => h(GBtn, { ...attrs, icon: true, variant: 'ghost', size: 'sm', 'aria-label': 'Más acciones' }, () => Ic('ellipsis-vertical'))
            }),
            props.inDialog
              ? (s.phone ? null : h(GBtn, { icon: true, variant: 'ghost', size: 'sm', 'aria-label': 'Pantalla completa', 'aria-pressed': String(s.depth === 'fullscreen'), onClick: () => { s.depth = s.depth === 'fullscreen' ? 'dialog' : 'fullscreen' } }, () => Ic(s.depth === 'fullscreen' ? 'minimize-2' : 'maximize-2')))
              : h(GBtn, { icon: true, variant: 'ghost', size: 'sm', 'aria-label': 'Ampliar', 'aria-haspopup': 'dialog', onClick: () => { s.depth = 'dialog' } }, () => Ic('maximize-2'))
          ])
        ])
        return h('div', { ref: body, class: ['g-document-preview__body', props.inDialog && 'is-in-dialog', s.thumbs && 'is-thumbs'], style: local.sealSize ? { '--_seal-size': local.sealSize + 'px' } : null }, [spine, stageEl, s.phase === 'idle' ? null : sealEl])
      }
    }
  })

  const XPreview = defineComponent({
    props: { pages: { type: Number, default: 12 }, kind: { type: String, default: 'canvas' }, phase: { type: String, default: 'ready' }, variant: { type: String, default: 'embedded' }, height: String,
      thumbsOpen: Boolean, receipt: String, err: String, progress: Boolean, long: Boolean, vid: String },
    setup (props) {
      const id = 'dp' + (++uid)
      const s = reactive({ pages: props.pages, kind: props.kind, phase: props.phase, err: props.err, progress: props.progress, long: props.long, page: 1, zoom: props.kind === 'image' ? 'fit' : 'fit', rotation: 0,
        thumbs: props.thumbsOpen, receipt: props.receipt || null, details: false, depth: 'inline', typed: '', wrong: false, ids: { status: id + '-status', meta: id + '-meta' }, phone: false,
        get dialogOpen () { return this.depth !== 'inline' } })
      const root = ref(null); const narrow = ref(false)
      let ro
      onMounted(() => { ro = new ResizeObserver(() => { narrow.value = root.value.getBoundingClientRect().width < space() * 120 }); ro.observe(root.value); s.phone = matchMedia('(max-width: 520px)').matches })
      onBeforeUnmount(() => ro?.disconnect())
      window.__dp = window.__dp || {}; window.__dp[props.vid] = s
      return () => h('section', {
        ref: root, class: ['g-document-preview', `g-document-preview--variant-${props.variant}`, 'g-document-preview--appearance-spine', narrow.value && 'is-narrow'], 'data-phase': s.phase,
        'aria-label': 'Vista previa de Contrato.pdf', tabindex: -1, style: props.height ? { '--_height': props.height } : null, 'data-vid': props.vid
      }, [
        h(Body, { s }),
        s.details ? h('div', { class: 'g-document-preview__meta', id: s.ids.meta }, h(GSummary, { layout: 'stack', size: 'md', icon: 'file-text', title: 'Contrato de arrendamiento del local 4.pdf', facts: [{ label: 'Tipo', value: 'PDF' }, { label: 'Páginas', value: String(s.pages) }, { label: 'Tamaño', value: '2,4 MB' }, { label: 'Modificado', value: '3 oct 2026, 10:42' }] })) : null,
        h('span', { class: 'g-document-preview__status', id: s.ids.status }, `Página ${s.page} de ${s.pages}. Ajustado al ancho. El texto de este documento no llega al lector de pantalla.`),
        h(GDialog, { class: 'g-document-preview__dialog', modelValue: s.depth !== 'inline', 'onUpdate:modelValue': (v) => { if (!v) s.depth = 'inline' }, size: 'lg', mobile: 'fullscreen', fullscreen: s.depth === 'fullscreen', title: 'Contrato de arrendamiento del local 4.pdf', description: 'PDF · 12 páginas · 2,4 MB', closeLabel: 'Cerrar' },
          () => s.depth !== 'inline' ? h(Body, { s, inDialog: true }) : null)
      ])
    }
  })

  const app = createApp({})
  app.component('XPreview', XPreview)
  app.mount('#app')
  window.__ready = true
})()
