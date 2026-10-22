// GResourceList · r01 (kiwi). Prototipo del block con los componentes reales de @grana/vue (dist/grana.umd.js y
// dist/page-header.umd.js). Dos partes:
//   1. RlResourceList: el BLOCK de laboratorio, con la API que propone declaracion.md (props, eventos de intención, slots).
//      No hace fetch, no valida, no guarda: ensambla GPageHeader + GTable (+ su GFilterBar y su GPagination) + GEmpty +
//      GMenu + GDialog y gestiona solo lo que ninguno de ellos tiene: dónde vive el editor, la confirmación, la huella, la
//      lente, el foco de ida y vuelta y los anuncios de lo que el block hace.
//   2. La página de «la aplicación» (tinas de fermentación): consulta su servidor simulado (tinas.js) y pone el formulario.
// Concepto por ?c=base|A|B|C. Estado público en window.__rl (lo lee verificar.mjs).
;(() => {
  const { createApp, ref, reactive, computed, watch, nextTick, onMounted, onBeforeUnmount } = Vue
  const P = new URLSearchParams(location.search)
  const CONCEPT = ['A', 'B', 'C'].includes(P.get('c')) ? P.get('c') : 'base'
  const DATA = P.get('data') || 'ok'
  if (P.get('dir') === 'rtl') document.documentElement.dir = 'rtl'
  if (P.get('dark') === '1') document.documentElement.dataset.theme = 'dark'
  const { api, ESTADOS, ESTADO, AGAVES, MAESTROS } = window.TINAS
  api.lab.empty = DATA === 'empty'
  api.lab.forbidden = DATA === 'forbidden'
  api.lab.slow = DATA === 'slow'
  api.lab.failNext = DATA === 'fail'
  // Canal cortés de página (#533). En el block real hará falta una vía PÚBLICA (hallazgo L10): __shared es interno.
  const live = Grana.__shared['utils/liveRegion.js']
  const fill = (t, o = {}) => (typeof t === 'function' ? t(o) : String(t ?? '').replace(/\{(\w+)\}/g, (_, k) => (o[k] ?? '')))
  const raf2 = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
  const FOCUSABLE = 'input:not([type=hidden]):not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
  const firstField = (el) => el && [...el.querySelectorAll('input:not([type=hidden]):not([disabled]), select:not([disabled]), textarea:not([disabled]), [role=combobox], [role=spinbutton]')].find((x) => x.offsetParent !== null || x.getClientRects().length)
  const STATE = window.__rl = reactive({ ready: false, concept: CONCEPT, events: [], editor: null, current: null, gone: [], pinned: [], narrow: false, lensNarrow: false, loads: 0 })
  const log = (type, detail = {}) => { STATE.events.push({ type, ...detail, t: Math.round(performance.now()) }) }

  // Disponibilidad de una acción (regla 1 de #643): ausente/true = disponible, false = oculta, String = motivo (aria-disabled)
  const avail = (v, row) => (typeof v === 'function' ? v(row) : v === undefined ? true : v)

  // =========================================================================================================
  // 1. EL BLOCK (prototipo de GResourceList)
  // =========================================================================================================
  const RlResourceList = {
    name: 'RlResourceList',
    props: {
      concept: { type: String, default: 'base' }, // SOLO laboratorio: en el block real, `editor` y `remove` deciden (declaracion §API)
      title: String,
      description: String,
      columns: { type: Array, default: () => [] },
      rows: { type: Array, default: () => [] },
      rowKey: { type: String, default: 'id' },
      total: Number,
      query: { type: Object, required: true }, // v-model:query = { search, filters, sort, page, pageSize }
      pageSizes: { type: Array, default: () => [10, 25, 50] },
      loading: Boolean,
      error: [Boolean, String],
      forbidden: Boolean,
      rowStatus: Function,
      returns: Object, // cuántas tinas volverían quitando solo cada filtro (lo calcula el servidor; GEmpty lo exige, empty.md «La salida»)
      counts: Object, // C: cuentas por faceta que da el servidor (la receta del summary, #601)
      actions: { type: Object, default: () => ({}) }, // { create, edit, duplicate, remove } → true | false | 'motivo' | (row) => …
      labels: { type: Object, default: () => ({}) }
    },
    emits: ['update:query', 'create', 'edit', 'duplicate', 'remove', 'retry', 'open'],
    setup (props, { emit, slots }) {
      const L = computed(() => props.labels)
      const root = ref(null)
      const tableRef = ref(null)
      const titleId = 'rl-title'
      const key = (row) => row && row[props.rowKey]
      const passSlots = computed(() => Object.keys(slots).filter((n) => /^(cell|leading)-/.test(n)))

      // ---- Consulta: el block solo la emite (intención). La búsqueda espera 300 ms; todo cambio vuelve a la página 1 ----
      const search = ref(props.query.search || '')
      let searchTimer = 0
      watch(search, (v) => { clearTimeout(searchTimer); searchTimer = setTimeout(() => setQuery({ search: v, page: 1 }, 'search'), 300) })
      const setQuery = (patch, reason) => {
        commitGone() // A: lo que estaba en huella se aplica al cambiar la consulta (la fila se iría igual)
        STATE.pinned = []
        emit('update:query', { ...props.query, ...patch }, { reason })
        log('query', { reason })
      }

      // ---- Medida propia (ResizeObserver, NO container-type: GPageHeader prohíbe container-type en sus ancestros, regla 7) ----
      // Estimación síncrona ANTES del primer pintado: los hijos (GTable, GPageHeader) miden al montar; si el block cambiara su
      // relleno después, WebKit avisa de un bucle de ResizeObserver. El ResizeObserver del block corrige luego con su ancho real.
      const narrow = ref(typeof window !== 'undefined' && window.innerWidth < 720) // < 720px: teléfono o columna estrecha
      const lensSide = ref(typeof window === 'undefined' || window.innerWidth >= 960) // B: hay sitio para la lente al lado
      let ro = null
      onMounted(() => {
        ro = new ResizeObserver(([e]) => {
          const w = e.contentRect.width
          narrow.value = w < 720
          lensSide.value = w >= 960
          STATE.narrow = narrow.value
          STATE.lensNarrow = !lensSide.value
        })
        ro.observe(root.value)
        STATE.ready = true
      })
      onBeforeUnmount(() => ro && ro.disconnect())

      // ---- Foco: helpers ----
      const doorOf = (k) => root.value?.querySelector(`tr[data-rl-key="${CSS.escape(String(k))}"] .g-table__door`)
      const rowEl = (k) => root.value?.querySelector(`tr[data-rl-key="${CSS.escape(String(k))}"]`)
      // GTable no tiene rowAttrs (reservado, #601): el laboratorio marca cada <tr> con su clave tras pintar (hallazgo L3)
      const tagRows = () => {
        const trs = root.value?.querySelectorAll('.g-table__table tbody tr.g-table__row') || []
        viewRows.value.forEach((r, i) => { if (trs[i]) trs[i].dataset.rlKey = key(r) })
        // B: la fila de la lente lleva aria-current en su puerta (reservado en GTable como v-model:current, #601)
        root.value?.querySelectorAll('.g-table__door[aria-current]').forEach((d) => d.removeAttribute('aria-current'))
        if (lens.key != null) doorOf(lens.key)?.setAttribute('aria-current', 'true')
        // A: huella y fila nueva (GTable no tiene estado de fila retirada ni marca pública de «nueva»: hallazgos L1 y L2)
        trs.forEach((tr) => { tr.classList.remove('rl-gone', 'rl-pinned') })
        STATE.gone.forEach((k) => rowEl(k)?.classList.add('rl-gone'))
        STATE.pinned.forEach((k) => rowEl(k)?.classList.add('rl-pinned'))
      }
      const afterPaint = async () => { await nextTick(); await raf2(); tagRows() }
      // GTable pinta lo que llega al acabar su fase (retraso 200 ms + mínimo 400 ms, #540) y no avisa de cuándo (hallazgo L4):
      // el block espera a que la tabla deje de estar ocupada y a que exista lo que busca, con un tope
      const tableSettled = async (want, ms = 2500) => {
        const t0 = performance.now()
        while (performance.now() - t0 < ms) {
          await afterPaint()
          const busy = root.value?.querySelector('.g-table__table[aria-busy="true"], .g-table.is-loading')
          if (!busy && (!want || want())) return true
          await new Promise((r) => setTimeout(r, 50))
        }
        return false
      }
      let mo = null
      onMounted(() => { mo = new MutationObserver(() => { mo.disconnect(); tagRows(); mo.observe(root.value, { childList: true, subtree: true }) }); mo.observe(root.value, { childList: true, subtree: true }) })
      onBeforeUnmount(() => mo && mo.disconnect())

      const announce = (t) => { if (t) { live.announcePage(t); log('announce', { text: t }) } }

      // ---- Editor: dónde vive depende del concepto (base: diálogo · A: en la fila · B: lente · C: hoja lateral) ----
      const editor = reactive({ open: false, mode: null, item: null, from: null, key: null })
      const draftKey = '__rl-new'
      const draft = computed(() => (CONCEPT_OF() === 'A' && editor.open && editor.mode === 'create' ? { [props.rowKey]: draftKey, __draft: true, codigo: L.value.draftTitle, agave: L.value.draftSubtitle } : null))
      const CONCEPT_OF = () => props.concept
      const editorIn = computed(() => ({ base: 'dialog', A: 'row', B: 'lens', C: 'sheet' })[props.concept])
      const openEditor = async (mode, item, from) => {
        if (editor.open && editorIn.value === 'row') { await cancelEditor({ silent: true }) }
        Object.assign(editor, { open: true, mode, item: item ? { ...item } : null, from: from || document.activeElement, key: item ? key(item) : draftKey })
        STATE.editor = { mode, key: editor.key }
        if (editorIn.value === 'row') {
          expanded.value = [editor.key]
          await afterPaint(); await raf2()
          const body = rowEl(editor.key)?.nextElementSibling
          const f = firstField(body)
          if (f) { f.focus(); log('focus', { to: 'first-field' }) }
        } else if (editorIn.value === 'lens') {
          lens.key = item ? key(item) : null
          lens.mode = 'edit'
          lens.row = item ? { ...item } : null
          await nextTick(); await raf2()
          const f = firstField(lensBody.value)
          if (f) { f.focus(); log('focus', { to: 'first-field' }) }
        }
        // base y C: GDialog enfoca el primer control (#292) y vuelve a `from` al cerrar (#583)
      }
      const onCreate = (e) => {
        const ev = { from: e?.currentTarget || document.activeElement, defaultPrevented: false, preventDefault () { this.defaultPrevented = true } }
        emit('create', ev)
        log('create')
        if (!ev.defaultPrevented) openEditor('create', null, ev.from)
      }
      const onEdit = (row, from) => {
        const ev = { row, from, defaultPrevented: false, preventDefault () { this.defaultPrevented = true } }
        emit('edit', ev)
        log('edit', { key: key(row) })
        if (!ev.defaultPrevented) openEditor('edit', row, from)
      }
      // close({ saved, announce }) del slot `form`: la aplicación ya guardó; el block cierra, enfoca y anuncia
      const closeEditor = async ({ saved, announce: say } = {}) => {
        const where = editorIn.value
        const mode = editor.mode
        const from = editor.from
        const wasKey = editor.key
        editor.open = false
        STATE.editor = null
        log('close', { saved: saved ?? null })
        if (where === 'row') {
          expanded.value = []
          if (saved != null && mode === 'create') STATE.pinned = [saved, ...STATE.pinned.filter((k) => k !== saved)]
          await tableSettled(() => doorOf(saved ?? wasKey))
          const door = doorOf(saved ?? wasKey) || (from && from.isConnected ? from : null)
          ;(door || tableRef.value?.$el?.querySelector('table'))?.focus()
          log('focus', { to: door ? 'door' : 'table' })
        } else if (where === 'lens') {
          if (saved != null) { lens.key = saved; lens.mode = 'read' } else if (lens.key == null) { lens.mode = null } else lens.mode = 'read'
          await nextTick(); await raf2()
          const target = lens.mode === 'read' ? root.value.querySelector('#rl-lens-edit') : (from && from.isConnected ? from : null)
          target?.focus()
          log('focus', { to: lens.mode === 'read' ? 'lens-edit' : 'from' })
        } else if (saved != null) {
          markFresh(saved)
        }
        announce(say)
      }
      const cancelEditor = async ({ silent } = {}) => {
        if (editorIn.value === 'lens' && editor.mode === 'edit') { editor.open = false; STATE.editor = null; lens.mode = 'read'; await nextTick(); await raf2(); root.value.querySelector('#rl-lens-edit, .rl-lens-layer #rl-lens-edit')?.focus(); return }
        if (editorIn.value === 'lens' && editor.mode === 'create') { editor.open = false; STATE.editor = null; lens.mode = null; await nextTick(); (editor.from && editor.from.isConnected ? editor.from : null)?.focus(); return }
        if (silent) { editor.open = false; expanded.value = []; return }
        return closeEditor({})
      }
      const markFresh = async (k) => { await afterPaint(); const tr = rowEl(k); if (tr) { tr.classList.add('rl-fresh'); setTimeout(() => tr.classList.remove('rl-fresh'), 2400) } }

      // ---- A · la fila se abre en su formulario (slot detail de GTable, #599) ----
      const expanded = ref([])
      const onExpanded = (keys) => {
        // La puerta de la fila (divulgación) abre su formulario; plegarla es cancelar
        const opened = keys.find((k) => !expanded.value.includes(k))
        if (opened != null && opened !== draftKey) {
          const row = props.rows.find((r) => key(r) === opened)
          if (STATE.gone.includes(opened)) { expanded.value = []; return }
          if (row && avail(props.actions.edit, row) === true) onEdit(row, doorOf(opened))
          else expanded.value = []
          return
        }
        if (!keys.length && editor.open) { editor.open = false; STATE.editor = null; expanded.value = [] ; if (editor.mode === 'create') nextTick(() => editor.from?.focus()) }
      }
      // Lo creado se queda arriba, en el sitio donde lo creaste, hasta que cambias la consulta (A)
      const viewRows = computed(() => {
        let rows = props.rows
        if (STATE.pinned.length) {
          const pin = STATE.pinned.map((k) => rows.find((r) => key(r) === k) || pinnedRows.get(k)).filter(Boolean)
          rows = [...pin, ...rows.filter((r) => !STATE.pinned.includes(key(r)))]
        }
        // Texto en el DOM, no solo forma (1.4.1): «Nueva» en lo recién registrado y «Dada de baja» en la huella
        rows = rows.map((r) => {
          const k = key(r)
          if (STATE.gone.includes(k)) return { ...r, agave: L.value.goneMark }
          if (STATE.pinned.includes(k)) return { ...r, agave: (r.agave && r.agave !== '—' ? r.agave + ' · ' : '') + L.value.newMark }
          return r
        })
        return draft.value ? [draft.value, ...rows] : rows
      })
      const pinnedRows = new Map()
      watch(() => props.rows, (rows) => { rows.forEach((r) => { if (STATE.pinned.includes(key(r))) pinnedRows.set(key(r), r) }); afterPaint() })

      // ---- Quitar: confirmación (base: alertdialog · B y C: en el sitio) o huella con «Deshacer» (A) ----
      const confirm = reactive({ open: false, rows: [], from: null, inPlace: null })
      const askRemove = async (rows, from) => {
        if (props.concept === 'A') return markGone(rows[0])
        if (props.concept === 'base') { Object.assign(confirm, { open: true, rows, from }); return }
        confirm.inPlace = rows.length === 1 ? key(rows[0]) : '__bulk'
        confirm.rows = rows
        await nextTick(); await raf2()
        root.value.querySelector('.rl-confirm .rl-confirm__cancel')?.focus()
        log('confirm-in-place', { key: confirm.inPlace })
      }
      const cancelRemove = async () => {
        const k = confirm.inPlace
        confirm.inPlace = null
        await nextTick(); await raf2()
        if (k === '__lens') root.value.querySelector('#rl-lens-remove')?.focus()
        else if (k === '__bulk') root.value.querySelector('.rl-bulk__remove')?.focus()
        else rowEl(k)?.querySelector('.g-table__actions button')?.focus()
      }
      const doRemove = (rows) => {
        const ev = { rows, keys: rows.map(key) }
        emit('remove', ev)
        log('remove', { keys: ev.keys })
        confirm.open = false
        confirm.inPlace = null
      }
      // Huella (A): la fila se queda con su contorno y «Deshacer»; NADA se envía hasta que foco y puntero salen de ella
      const goneRows = new Map()
      let hoverKey = null
      const markGone = async (row) => {
        const k = key(row)
        // GMenu devuelve el foco a su disparador al cerrar; se espera a que lo haga antes de sustituirlo por «Deshacer»
        await raf2(); await new Promise((r) => setTimeout(r, 30))
        goneRows.set(k, row)
        STATE.gone = [...STATE.gone, k]
        await afterPaint()
        rowEl(k)?.querySelector('.rl-undo')?.focus()
        announce(fill(L.value.goneAnnounce, { title: row.codigo }))
        log('gone', { key: k })
      }
      const undoGone = async (k) => {
        STATE.gone = STATE.gone.filter((x) => x !== k)
        goneRows.delete(k)
        await afterPaint(); await raf2()
        rowEl(k)?.querySelector('.g-table__actions button')?.focus()
        announce(fill(L.value.restored, { title: k }))
        log('undo', { key: k })
      }
      const commitGone = (only) => {
        const keys = STATE.gone.filter((k) => only == null || k === only)
        if (!keys.length) return
        const rows = keys.map((k) => goneRows.get(k)).filter(Boolean)
        STATE.gone = STATE.gone.filter((k) => !keys.includes(k))
        keys.forEach((k) => goneRows.delete(k))
        doRemove(rows)
      }
      const leaveCheck = () => {
        // Se aplica la huella cuyo <tr> ya no tiene el foco ni el puntero
        setTimeout(() => {
          STATE.gone.forEach((k) => {
            const tr = rowEl(k)
            if (!tr) return
            const ae = document.activeElement
            const focused = tr.contains(ae) || ae === document.body || ae == null
            if (!focused && hoverKey !== k) commitGone(k)
          })
        }, 0)
      }
      // Solo cuenta como «salir» un foco que va a OTRO elemento (relatedTarget); el foco perdido por un nodo retirado no aplica nada
      const onRootFocusout = (e) => { if (props.concept === 'A' && STATE.gone.length && e.relatedTarget) leaveCheck() }
      const onRootPointerover = (e) => {
        if (props.concept !== 'A') return
        const k = e.target.closest?.('tr[data-rl-key]')?.dataset.rlKey ?? null
        if (k !== hoverKey) { const was = hoverKey; hoverKey = k; if (was != null && STATE.gone.includes(was)) leaveCheck() }
      }
      const onRootPointerleave = () => { if (hoverKey != null) { hoverKey = null; leaveCheck() } }

      // ---- Menú de fila (GMenu): disponibilidad con motivo; GMenu solo tiene disabled Boolean (hallazgo L5) ----
      const menus = reactive({})
      const rowItems = (row) => {
        const items = []
        const ed = avail(props.actions.edit, row)
        if (ed !== false) items.push({ id: 'edit', label: L.value.edit, icon: 'pencil', disabled: ed !== true, reason: ed !== true ? ed : undefined })
        const du = avail(props.actions.duplicate, row)
        if (du !== false) items.push({ id: 'duplicate', label: L.value.duplicate, icon: 'copy', disabled: du !== true })
        const rm = avail(props.actions.remove, row)
        if (rm !== false) items.push({ type: 'separator' }, { id: 'remove', label: L.value.remove, icon: 'trash', danger: true, disabled: rm !== true, reason: rm !== true ? rm : undefined })
        return items
      }
      const onRowSelect = (e, row) => {
        const from = rowEl(key(row))?.querySelector('.g-table__actions button')
        if (e.id === 'edit') onEdit(row, from)
        else if (e.id === 'duplicate') { emit('duplicate', { row }); log('duplicate', { key: key(row) }) }
        else if (e.id === 'remove') askRemove([row], from)
      }

      // ---- B · la lente: lista + ficha al lado, en la página (no es una capa) ----
      const lens = reactive({ key: null, mode: null, row: null })
      const lensBody = ref(null)
      const lensTitle = ref(null)
      const lensEditBtn = ref(null)
      const lensRemoveBtn = ref(null)
      const lensRow = computed(() => (lens.key == null ? null : props.rows.find((r) => key(r) === lens.key) || (lens.row && key(lens.row) === lens.key ? lens.row : null)))
      watch(lensRow, (r) => { if (r) lens.row = { ...r } })
      const lensIndex = computed(() => props.rows.findIndex((r) => key(r) === lens.key))
      const lensOpen = computed(() => props.concept === 'B' && lens.mode != null)
      const lensAsLayer = computed(() => lensOpen.value && narrow.value) // en estrecho la lente es una capa a pantalla completa
      const lensLayerOpen = computed({ get: () => lensAsLayer.value, set: (v) => { if (!v) closeLens() } })
      const openLens = async (row, from) => {
        if (editor.open) editor.open = false
        lens.key = key(row); lens.row = { ...row }; lens.mode = 'read'; lens.from = from
        STATE.current = lens.key
        emit('open', { row })
        log('open', { key: lens.key })
        await afterPaint(); await raf2()
        if (!narrow.value) { lensTitle.value?.focus(); log('focus', { to: 'lens-title' }) }
      }
      const closeLens = async () => {
        const k = lens.key
        lens.mode = null; lens.key = null; STATE.current = null; editor.open = false
        await afterPaint(); await raf2()
        ;(doorOf(k) || lens.from)?.focus?.()
        log('focus', { to: 'door' })
      }
      const backToList = async () => { const k = lens.key; await nextTick(); (doorOf(k))?.focus(); log('focus', { to: 'door' }) }
      const step = async (dir) => {
        const i = lensIndex.value + dir
        if (i >= 0 && i < props.rows.length) return openLensKeep(props.rows[i])
        // cruzar de página (C · Lente de table.md, reservada): pide la página siguiente y abre su primera (o última) fila
        const pages = Math.max(1, Math.ceil((props.total || 0) / (props.query.pageSize || 10)))
        const page = props.query.page + dir
        if (page < 1 || page > pages) return
        pendingStep = dir
        emit('update:query', { ...props.query, page }, { reason: 'lens' })
      }
      let pendingStep = 0
      watch(() => props.rows, (rows) => {
        if (!pendingStep || !rows.length) return
        const r = pendingStep > 0 ? rows[0] : rows[rows.length - 1]
        pendingStep = 0
        openLensKeep(r)
      })
      const openLensKeep = async (row) => {
        lens.key = key(row); lens.row = { ...row }; lens.mode = 'read'; STATE.current = lens.key
        await afterPaint()
        announce(fill(L.value.showing, { title: row.codigo }))
      }
      const lensRemove = async () => {
        confirm.inPlace = '__lens'
        confirm.rows = [lensRow.value]
        await nextTick(); await raf2()
        root.value.querySelector('.rl-lens .rl-confirm__cancel, .rl-lens-layer .rl-confirm__cancel')?.focus()
      }
      // Tras dar de baja desde la lente, la lente pasa a la siguiente (o a la anterior): la revisión sigue
      const lensAfterRemove = () => {
        const i = lensIndex.value
        const next = props.rows[i + 1] || props.rows[i - 1]
        doRemove([lensRow.value])
        if (next) { openLensKeep(next).then(async () => { await raf2(); lensTitle.value?.focus() }) } else closeLens()
      }
      const onActivate = (e) => { if (props.concept === 'B') openLens(e.row, e.event?.currentTarget) }
      const onLensKeydown = (e) => {
        if (e.key === 'Escape' && !e.defaultPrevented && lens.mode === 'read' && !narrow.value) { e.preventDefault(); backToList() }
      }

      // ---- C · la consulta se lee como una frase; las facetas cuentan sin su propio filtro ----
      const filterOf = (k) => (props.query.filters || []).find((f) => f.key === k)
      const setFilter = (k, value) => {
        const rest = (props.query.filters || []).filter((f) => f.key !== k)
        const filters = value == null ? rest : [...rest, { key: k, op: k === 'atencion' ? 'is' : 'in', value: k === 'atencion' ? true : [value] }]
        setQuery({ filters, page: 1 }, 'filters')
      }
      const phraseMenus = reactive({ estado: false, agave: false, maestro: false, orden: false })
      const phraseItems = (k, list, anyLabel) => [{ type: 'group', label: L.value.phrase[k], items: [{ id: '__any', type: 'radio', label: anyLabel, checked: !filterOf(k) }, ...list.map((o) => ({ id: o.value ?? o, type: 'radio', label: o.label ?? o, checked: !!filterOf(k) && filterOf(k).value[0] === (o.value ?? o) }))] }]
      const phraseText = (k, list, anyLabel, pre) => { const f = filterOf(k); if (!f) return anyLabel; const o = list.find((x) => (x.value ?? x) === f.value[0]); return (pre || '') + (o?.label ?? o) }
      const ORDERS = computed(() => [{ id: 'atencion', label: L.value.phrase.byAttention, sort: { key: 'atencion', direction: 'ascending' } }, { id: 'dias', label: L.value.phrase.byDays, sort: { key: 'dias', direction: 'descending' } }, { id: 'tina', label: L.value.phrase.byCode, sort: { key: 'tina', direction: 'ascending' } }])
      const orderNow = computed(() => ORDERS.value.find((o) => props.query.sort && o.sort.key === props.query.sort.key && o.sort.direction === props.query.sort.direction))
      const facet = (k) => (k === 'atencion' ? !!filterOf('atencion') : !!filterOf('estado') && filterOf('estado').value[0] === k)
      const toggleFacet = (k) => {
        if (k === 'atencion') return setFilter('atencion', facet('atencion') ? null : true)
        setFilter('estado', facet(k) ? null : k)
      }
      const selected = ref([])
      watch(() => props.rows, () => { selected.value = selected.value.filter((k) => props.rows.some((r) => key(r) === k)) })

      // ---- Tabla: textos y vacíos ----
      const tableLabels = computed(() => ({ ...L.value.table }))
      const emptyFilters = computed(() => {
        const n = (k) => (props.returns ? props.returns[k] : undefined)
        const out = (props.query.filters || []).map((f) => ({ key: f.key, label: L.value.filterLabel(f), count: n(f.key) }))
        if (props.query.search) out.unshift({ key: '__search', label: fill(L.value.searchChip, { q: props.query.search }), count: n('__search') })
        return out
      })
      const relax = (k) => {
        if (k === '__search') { search.value = ''; setQuery({ search: '', page: 1 }, 'search'); return }
        setQuery({ filters: props.query.filters.filter((f) => f.key !== k), page: 1 }, 'filters')
      }
      const clearAll = () => { search.value = ''; setQuery({ search: '', filters: [], page: 1 }, 'filters') }
      const hasQuery = computed(() => !!props.query.search || (props.query.filters || []).length > 0)
      const firstEmpty = computed(() => !props.loading && !props.error && !hasQuery.value && props.total === 0)

      const createAvail = computed(() => avail(props.actions.create))
      const statusFor = (row) => (row.__draft || STATE.gone.includes(key(row)) ? null : props.rowStatus ? props.rowStatus(row) : null)
      const isGone = (row) => STATE.gone.includes(key(row))

      return {
        L, root, tableRef, titleId, passSlots, search, setQuery, narrow, lensSide, editor, editorIn, onCreate, onEdit, closeEditor, cancelEditor,
        expanded, onExpanded, viewRows, draftKey, confirm, askRemove, cancelRemove, doRemove, undoGone, isGone, menus, rowItems, onRowSelect,
        lens, lensBody, lensTitle, lensEditBtn, lensRemoveBtn, lensRow, lensIndex, lensOpen, lensAsLayer, lensLayerOpen, openLens, closeLens, step, lensRemove, lensAfterRemove,
        onActivate, onLensKeydown, backToList, filterOf, setFilter, phraseMenus, phraseItems, phraseText, ORDERS, orderNow, facet, toggleFacet, selected,
        tableLabels, emptyFilters, relax, clearAll, hasQuery, firstEmpty, createAvail, statusFor, key, fill, ESTADOS, AGAVES, MAESTROS, ESTADO,
        onRootFocusout, onRootPointerover, onRootPointerleave, STATE
      }
    },
    template: /* html */ `
<div ref="root" class="rl" :data-concept="concept" :class="{ 'is-narrow': narrow, 'has-lens': lensOpen && !lensAsLayer }" @focusout="onRootFocusout" @pointerover="onRootPointerover" @pointerleave="onRootPointerleave">
  <g-page-header id="rl-ph" :title="title" :description="description" :labels="{ actions: L.pageActions }">
    <template #meta><slot name="meta"></slot></template>
    <template #actions="{ narrow: hn, docked }">
      <slot name="actions" :narrow="hn" :docked="docked"></slot>
      <g-btn v-if="createAvail !== false" id="rl-create" :icon="hn && !docked" :aria-label="hn && !docked ? L.create : undefined" :tooltip="hn && !docked ? L.create : (createAvail !== true ? createAvail : undefined)"
        :aria-disabled="createAvail !== true ? 'true' : undefined" @click="createAvail === true && onCreate($event)">
        <g-icon v-if="hn && !docked" name="plus"></g-icon><template v-else>{{ L.create }}</template>
      </g-btn>
    </template>
    <!-- C: las facetas son el contenido del encabezado (slot por defecto de GPageHeader, el de las métricas) -->
    <div v-if="concept === 'C' && counts" class="rl-facets" role="group" :aria-label="L.facets">
      <button v-for="f in [{ k: 'atencion', label: L.attention, tone: 'warning' }, ...ESTADOS.map(e => ({ k: e.value, label: e.label }))]" :key="f.k" type="button"
        class="rl-facet" :class="['rl-facet--' + (f.tone || 'plain')]" :aria-pressed="facet(f.k) ? 'true' : 'false'" :data-facet="f.k" @click="toggleFacet(f.k)">
        <span class="rl-facet__n">{{ counts[f.k] ?? 0 }}</span><span class="rl-facet__label">{{ f.label }}</span>
      </button>
    </div>
  </g-page-header>

  <div v-if="forbidden" class="rl-forbidden">
    <g-empty cause="forbidden" :title="L.forbiddenTitle" :description="L.forbiddenText" :heading-level="2">
      <template #actions><g-btn variant="outline" color="neutral" @click="$emit('retry')">{{ L.requestAccess }}</g-btn></template>
    </g-empty>
  </div>

  <div v-else class="rl-body">
    <div class="rl-list">
      <!-- La consulta. base, A y B: búsqueda + la barra de filtros de GTable. C: la frase (cada hueco es un GMenu de radios) -->
      <div class="rl-query" role="search" :aria-label="L.searchRegion">
        <p v-if="concept === 'C'" class="rl-phrase" id="rl-phrase"> <span class="rl-phrase__lead">{{ L.phrase.lead }}</span> <g-menu id="rl-ph-estado" v-model="phraseMenus.estado" :items="phraseItems('estado', ESTADOS, L.phrase.anyState)" :label="L.phrase.estado" @select="e => setFilter('estado', e.id === '__any' ? null : e.id)"> <template #trigger="{ attrs }"><button v-bind="attrs" type="button" class="rl-slot" :class="{ 'is-set': !!filterOf('estado') }"><span class="rl-sr">{{ L.phrase.estado }}: </span>{{ phraseText('estado', ESTADOS, L.phrase.anyState) }}<span class="rl-slot__chev" aria-hidden="true" v-html="lucide('chevron-down')"></span></button></template> </g-menu> {{ L.phrase.of }} <g-menu id="rl-ph-agave" v-model="phraseMenus.agave" :items="phraseItems('agave', AGAVES, L.phrase.anyAgave)" :label="L.phrase.agave" @select="e => setFilter('agave', e.id === '__any' ? null : e.id)"> <template #trigger="{ attrs }"><button v-bind="attrs" type="button" class="rl-slot" :class="{ 'is-set': !!filterOf('agave') }"><span class="rl-sr">{{ L.phrase.agave }}: </span>{{ phraseText('agave', AGAVES, L.phrase.anyAgave) }}<span class="rl-slot__chev" aria-hidden="true" v-html="lucide('chevron-down')"></span></button></template> </g-menu> {{ L.phrase.by }} <g-menu id="rl-ph-maestro" v-model="phraseMenus.maestro" :items="phraseItems('maestro', MAESTROS, L.phrase.anyone)" :label="L.phrase.maestro" @select="e => setFilter('maestro', e.id === '__any' ? null : e.id)"> <template #trigger="{ attrs }"><button v-bind="attrs" type="button" class="rl-slot" :class="{ 'is-set': !!filterOf('maestro') }"><span class="rl-sr">{{ L.phrase.maestro }}: </span>{{ phraseText('maestro', MAESTROS, L.phrase.anyone) }}<span class="rl-slot__chev" aria-hidden="true" v-html="lucide('chevron-down')"></span></button></template> </g-menu>, <g-menu id="rl-ph-orden" v-model="phraseMenus.orden" :items="[{ type: 'group', label: L.phrase.order, items: ORDERS.map(o => ({ id: o.id, type: 'radio', label: o.label, checked: orderNow && orderNow.id === o.id })) }]" :label="L.phrase.order" @select="e => setQuery({ sort: ORDERS.find(o => o.id === e.id).sort, page: 1 }, 'sort')"> <template #trigger="{ attrs }"><button v-bind="attrs" type="button" class="rl-slot is-set"><span class="rl-sr">{{ L.phrase.order }}: </span>{{ orderNow ? orderNow.label : L.phrase.byCustom }}<span class="rl-slot__chev" aria-hidden="true" v-html="lucide('chevron-down')"></span></button></template> </g-menu>. </p>
        <g-input id="rl-search" class="rl-search" v-model="search" type="search" :label="concept === 'C' ? L.phrase.contains : L.search" :hint="concept === 'C' ? undefined : L.searchHint">
          <template #prepend><g-icon name="search"></g-icon></template>
        </g-input>
      </div>

      <!-- C: lo seleccionado tiene su barra, con confirmación en el sitio -->
      <div v-if="concept === 'C' && selected.length" class="rl-bulk" role="group" :aria-label="fill(L.selectedCount, { count: selected.length })">
        <span class="rl-bulk__count">{{ fill(L.selectedCount, { count: selected.length }) }}</span>
        <div v-if="confirm.inPlace === '__bulk'" class="rl-confirm" role="group" :aria-label="fill(L.confirmMany, { count: selected.length })">
          <span class="rl-confirm__q" aria-hidden="true">{{ fill(L.confirmMany, { count: selected.length }) }}</span>
          <g-btn class="rl-confirm__cancel" size="sm" variant="ghost" color="neutral" @click="cancelRemove">{{ L.cancel }}</g-btn>
          <g-btn class="rl-confirm__ok" size="sm" color="danger" @click="doRemove(rows.filter(r => selected.includes(key(r)))); selected = []">{{ L.confirmRemove }}</g-btn>
        </div>
        <g-btn v-else class="rl-bulk__remove" size="sm" variant="outline" color="danger" @click="askRemove(rows.filter(r => selected.includes(key(r))))">{{ L.remove }}</g-btn>
        <g-btn size="sm" variant="ghost" color="neutral" @click="selected = []">{{ L.clearSelection }}</g-btn>
      </div>

      <g-table ref="tableRef" id="rl-table" :aria-labelledby="'rl-ph-title'" :columns="columns" :rows="viewRows" :row-key="rowKey"
        sort-mode="external" filter-mode="external" :sort="query.sort" :filters="query.filters" :page="query.page" :page-size="query.pageSize" :page-sizes="pageSizes" :total="total"
        :loading="loading" :error="!!error" :row-status="statusFor" :labels="tableLabels" appearance="lines"
        :selectable="concept === 'C' || concept === 'base'" v-model:selected="selected"
        :activatable="concept === 'B'" :last-opened="concept === 'B' ? lens.key : null"
        :expanded="concept === 'A' ? expanded : undefined" @update:expanded="onExpanded"
        @update:sort="s => setQuery({ sort: s, page: 1 }, 'sort')" @update:filters="f => setQuery({ filters: f, page: 1 }, 'filters')"
        @update:page="p => setQuery({ page: p }, 'page')" @update:page-size="s => setQuery({ pageSize: s }, 'pageSize')"
        @activate="onActivate" @retry="$emit('retry')">
        <template v-for="name in passSlots" #[name]="scope"><slot :name="name" v-bind="scope"></slot></template>
        <template #row-actions="{ row }">
          <span v-if="row.__draft" class="rl-sr">{{ L.draftTitle }}</span>
          <div v-else-if="confirm.inPlace === key(row)" class="rl-confirm" role="group" :aria-label="fill(L.confirmOne, { title: row.codigo })">
            <g-btn class="rl-confirm__cancel" size="sm" variant="ghost" color="neutral" @click="cancelRemove">{{ L.cancel }}</g-btn>
            <g-btn class="rl-confirm__ok" size="sm" color="danger" @click="doRemove([row])">{{ L.confirmRemove }}</g-btn>
          </div>
          <g-btn v-else-if="isGone(row)" class="rl-undo" size="sm" variant="outline" color="neutral" icon :aria-label="fill(L.undoOne, { title: row.codigo })" :tooltip="fill(L.undoOne, { title: row.codigo })" @click="undoGone(key(row))"><g-icon name="undo-2"></g-icon></g-btn>
          <g-menu v-else :id="'rl-m-' + key(row)" v-model="menus[key(row)]" :items="rowItems(row)" :label="fill(L.rowActions, { title: row.codigo })" align="end" @select="e => onRowSelect(e, row)">
            <template #trigger="{ attrs }"><g-btn v-bind="attrs" variant="ghost" color="neutral" size="sm" icon :aria-label="fill(L.rowActions, { title: row.codigo })"><g-icon name="ellipsis-vertical"></g-icon></g-btn></template>
            <!-- GMenu no tiene motivo de deshabilitado (hallazgo L5): el laboratorio lo escribe en el slot item, como texto del nombre -->
            <template #item="{ item }"><span class="rl-mi">{{ item.label }}<span v-if="item.reason" class="rl-mi__why">{{ item.reason }}</span></span></template>
          </g-menu>
        </template>
        <template v-if="concept === 'A'" #detail="{ row, close }">
          <div class="rl-inline">
            <p v-if="isGone(row)" class="rl-inline__gone">{{ fill(L.goneAnnounce, { title: row.codigo }) }}</p>
            <slot v-else-if="editor.open && (row.__draft || editor.key === key(row))" name="form" :mode="editor.mode" :item="editor.item" :close="closeEditor" :cancel="() => cancelEditor()" :where="'row'"></slot>
          </div>
        </template>
        <template #empty="{ filtered, clear }">
          <g-empty v-if="filtered || hasQuery" cause="filtered" :title="L.emptyFiltered" :filters="emptyFilters" :heading-level="2"
            :total="returns && returns.__all" :labels="L.emptyExit" @relax="relax" @clear="clearAll"></g-empty>
          <g-empty v-else cause="none" :title="L.emptyTitle" :description="L.emptyText" :heading-level="2">
            <template #actions><g-btn v-if="createAvail === true" variant="outline" color="brand" @click="onCreate($event)">{{ L.createFirst }}</g-btn></template>
          </g-empty>
        </template>
      </g-table>
    </div>

    <!-- B · la lente, al lado, EN la página: la lista sigue operable (no es modal). En estrecho, una capa (abajo) -->
    <section v-if="lensOpen && !lensAsLayer" class="rl-lens" aria-labelledby="rl-lens-title" @keydown="onLensKeydown">
      <div class="rl-lens__head">
        <h2 id="rl-lens-title" ref="lensTitle" class="rl-lens__title" tabindex="-1">{{ lens.mode === 'edit' && editor.mode === 'create' ? L.draftTitle : (lensRow ? lensRow.codigo : '') }}<span v-if="lens.mode === 'edit'" class="rl-lens__mode">{{ editor.mode === 'create' ? '' : ' · ' + L.editing }}</span></h2>
        <g-btn id="rl-lens-close" variant="ghost" color="neutral" size="sm" icon :aria-label="L.closeLens" :tooltip="L.closeLens" @click="closeLens"><g-icon name="x"></g-icon></g-btn>
      </div>
      <div ref="lensBody" class="rl-lens__body">
        <template v-if="lens.mode === 'read' && lensRow">
          <p class="rl-lens__sub"><span v-if="lensRow.agave && lensRow.agave !== '—'">{{ lensRow.agave }}</span><g-badge variant="soft" size="sm" :color="statusFor(lensRow) ? (statusFor(lensRow).status === 'error' ? 'danger' : 'warning') : 'neutral'">{{ statusFor(lensRow) ? statusFor(lensRow).text : ESTADO[lensRow.estado] }}</g-badge></p>
          <g-data-list :label="fill(L.lensData, { title: lensRow.codigo })" :rows="columns.filter(c => !c.title).map(c => ({ label: c.label, value: c.format ? c.format(lensRow[c.key], lensRow) : (lensRow[c.key] ?? '—') })).concat([{ label: L.lot, value: lensRow.lote }])"></g-data-list>
          <div class="rl-lens__actions">
            <g-btn ref="lensEditBtn" id="rl-lens-edit" variant="outline" color="neutral" :aria-disabled="avail(actions.edit, lensRow) !== true ? 'true' : undefined" :tooltip="avail(actions.edit, lensRow) !== true ? avail(actions.edit, lensRow) : undefined" @click="avail(actions.edit, lensRow) === true && onEdit(lensRow, $event.currentTarget)"><template #prepend><g-icon name="pencil"></g-icon></template>{{ L.edit }}</g-btn>
            <div v-if="confirm.inPlace === '__lens'" class="rl-confirm" role="group" :aria-label="fill(L.confirmOne, { title: lensRow.codigo })">
              <g-btn class="rl-confirm__cancel" size="sm" variant="ghost" color="neutral" @click="cancelRemove">{{ L.cancel }}</g-btn>
              <g-btn class="rl-confirm__ok" size="sm" color="danger" @click="lensAfterRemove">{{ L.confirmRemove }}</g-btn>
            </div>
            <g-btn v-else ref="lensRemoveBtn" id="rl-lens-remove" variant="ghost" color="danger" :aria-disabled="avail(actions.remove, lensRow) !== true ? 'true' : undefined" :tooltip="avail(actions.remove, lensRow) !== true ? avail(actions.remove, lensRow) : undefined" @click="avail(actions.remove, lensRow) === true && lensRemove()"><template #prepend><g-icon name="trash"></g-icon></template>{{ L.remove }}</g-btn>
          </div>
        </template>
        <slot v-else-if="lens.mode === 'edit' && editor.open" name="form" :mode="editor.mode" :item="editor.item" :close="closeEditor" :cancel="() => cancelEditor()" :where="'lens'"></slot>
      </div>
      <nav v-if="lens.mode === 'read'" class="rl-lens__nav" :aria-label="L.lensNav">
        <g-btn id="rl-lens-prev" variant="ghost" color="neutral" size="sm" :aria-disabled="lensIndex <= 0 && query.page <= 1 ? 'true' : undefined" @click="step(-1)"><template #prepend><g-icon name="chevron-left" class="g-icon--flip-rtl"></g-icon></template>{{ L.prev }}</g-btn>
        <span class="rl-lens__pos">{{ fill(L.position, { n: (query.page - 1) * query.pageSize + lensIndex + 1, total }) }}</span>
        <g-btn id="rl-lens-next" variant="ghost" color="neutral" size="sm" @click="step(1)">{{ L.next }}<template #append><g-icon name="chevron-right" class="g-icon--flip-rtl"></g-icon></template></g-btn>
      </nav>
    </section>
  </div>

  <!-- base: editor en diálogo centrado · C: hoja lateral (GDialog placement="end") · B estrecho: la lente como capa -->
  <g-dialog v-if="editorIn === 'dialog' || editorIn === 'sheet'" id="rl-editor" v-model="editor.open" :from="editor.from" :placement="editorIn === 'sheet' ? 'end' : 'center'" size="md"
    :title="editor.mode === 'create' ? L.draftTitle : fill(L.editTitle, { title: editor.item && editor.item.codigo })" :close-label="L.close" mobile="sheet">
    <slot v-if="editor.open" name="form" :mode="editor.mode" :item="editor.item" :close="closeEditor" :cancel="() => cancelEditor()" :where="editorIn"></slot>
  </g-dialog>
  <g-dialog v-if="concept === 'B'" id="rl-lens-layer" class="rl-lens-layer" v-model="lensLayerOpen" :from="lens.from" mobile="fullscreen" size="md" :close-label="L.backToList"
    :title="lens.mode === 'edit' && editor.mode === 'create' ? L.draftTitle : (lensRow ? lensRow.codigo : '')">
    <div ref="lensBody" v-if="lensAsLayer">
      <template v-if="lens.mode === 'read' && lensRow">
        <g-data-list :label="fill(L.lensData, { title: lensRow.codigo })" :rows="columns.filter(c => !c.title).map(c => ({ label: c.label, value: c.format ? c.format(lensRow[c.key], lensRow) : (lensRow[c.key] ?? '—') })).concat([{ label: L.lot, value: lensRow.lote }])"></g-data-list>
        <div class="rl-lens__actions">
          <g-btn ref="lensEditBtn" variant="outline" color="neutral" @click="avail(actions.edit, lensRow) === true && onEdit(lensRow, $event.currentTarget)"><template #prepend><g-icon name="pencil"></g-icon></template>{{ L.edit }}</g-btn>
        </div>
      </template>
      <slot v-else-if="lens.mode === 'edit' && editor.open" name="form" :mode="editor.mode" :item="editor.item" :close="closeEditor" :cancel="() => cancelEditor()" :where="'layer'"></slot>
    </div>
  </g-dialog>
  <!-- base: confirmación explícita en alertdialog, con el foco en la opción que no destruye -->
  <g-dialog v-if="concept === 'base'" id="rl-confirm" v-model="confirm.open" role="alertdialog" size="sm" :from="confirm.from"
    :title="confirm.rows.length > 1 ? fill(L.confirmMany, { count: confirm.rows.length }) : fill(L.confirmOne, { title: confirm.rows[0] && confirm.rows[0].codigo })" :description="L.confirmText">
    <template #footer>
      <g-btn autofocus variant="ghost" color="neutral" @click="confirm.open = false">{{ L.cancel }}</g-btn>
      <g-btn color="danger" id="rl-confirm-ok" @click="doRemove(confirm.rows)">{{ L.confirmRemove }}</g-btn>
    </template>
  </g-dialog>
</div>`,
    methods: { lucide: (n) => window.lucide(n), avail }
  }

  // =========================================================================================================
  // 2. LA APLICACIÓN: tinas de fermentación (PULZ)
  // =========================================================================================================
  const fmtL = (v) => (v == null ? '—' : v.toLocaleString('es-MX') + ' L')
  const COLUMNS = (concept) => {
    const f = (x) => (concept === 'C' ? undefined : x) // en C la frase sustituye a la barra de filtros
    return [
      { key: 'tina', label: 'Tina', title: 'codigo', subtitle: 'agave', primary: true, sortable: true, sortBy: 'codigo', min: 36, filter: f({ type: 'text', fields: ['codigo', 'agave'] }) },
      { key: 'estado', label: 'Estado', format: (v) => ESTADO[v], filter: f({ type: 'enum', options: ESTADOS, suggest: true }) },
      { key: 'dias', label: 'Días', align: 'end', sortable: true, min: 16, format: (v) => (v == null ? '—' : v + ' d'), filter: f({ type: 'number' }) },
      { key: 'temp', label: 'Temp.', align: 'end', sortable: true, min: 18, format: (v) => (v == null ? '—' : v.toFixed(1) + ' °C') },
      { key: 'volumen', label: 'Volumen', align: 'end', sortable: true, min: 20, format: fmtL },
      { key: 'maestro', label: 'Maestro mezcalero', min: 32, filter: f({ type: 'enum', options: MAESTROS, suggest: concept !== 'base' ? false : undefined }) }
    ]
  }
  const OPS = { contains: 'contiene', is: 'es', starts: 'empieza por', gt: 'mayor que', lt: 'menor que', eq: 'igual a', between: 'entre', after: 'después de', before: 'antes de', last: 'últimos', in: 'es cualquiera de' }
  const LABELS = {
    pageActions: 'Acciones de la página', create: 'Registrar tina', createFirst: 'Registrar la primera tina',
    search: 'Buscar', searchHint: 'Tina, agave, maestro o lote', searchRegion: 'Consulta de tinas', searchChip: 'Búsqueda «{q}»',
    edit: 'Editar', duplicate: 'Duplicar', remove: 'Dar de baja', rowActions: 'Acciones de {title}',
    editTitle: 'Editar {title}', draftTitle: 'Tina nueva', draftSubtitle: 'Se numera al guardar', editing: 'editando', close: 'Cerrar',
    confirmOne: '¿Dar de baja la tina {title}?', confirmMany: '¿Dar de baja {count} tinas?', confirmText: 'Sale del inventario del palenque. Sus lecturas se conservan en el historial del lote.',
    confirmRemove: 'Dar de baja', cancel: 'Cancelar', undo: 'Deshacer', goneMark: 'Dada de baja', newMark: 'Nueva', undoOne: 'Deshacer la baja de {title}',
    goneAnnounce: '{title} dada de baja. Puedes deshacerlo en la misma fila mientras sigas en ella.', restored: '{title} sigue en el inventario.',
    emptyTitle: 'Aún no hay tinas registradas', emptyText: 'Registra la primera para empezar a llevar sus fermentaciones.', emptyFiltered: 'Ninguna tina cumple esta consulta', clearFilters: 'Quitar todos',
    emptyExit: { relax: 'Quitar «{label}»', returns: (o) => (o.count === 1 ? 'vuelve 1' : 'vuelven ' + o.count), clear: 'Quitar todos', before: 'Sin filtros hay {total} tinas.' },
    forbiddenTitle: 'No tienes acceso a las tinas de este palenque', forbiddenText: 'Pídelo a la persona que administra el palenque.', requestAccess: 'Pedir acceso',
    filterLabel: (f) => (f.key === 'atencion' ? 'Requieren atención' : (COLUMNS('base').find((c) => c.key === f.key)?.label || f.key) + ': ' + (Array.isArray(f.value) ? f.value.map((v) => ESTADO[v] || v).join(', ') : f.value)),
    selectedCount: (o) => (o.count === 1 ? '1 seleccionada' : o.count + ' seleccionadas'), clearSelection: 'Quitar selección',
    closeLens: 'Cerrar la ficha', backToList: 'Volver a la lista', lensNav: 'Recorrer tinas', prev: 'Anterior', next: 'Siguiente', position: '{n} de {total}', lensData: 'Datos de {title}', lot: 'Lote', showing: 'Mostrando {title}',
    facets: 'Tinas por estado', attention: 'Requieren atención',
    phrase: { lead: 'Tinas', of: 'de', by: 'a cargo de', anyState: 'en cualquier estado', anyAgave: 'cualquier agave', anyone: 'cualquier maestro', estado: 'Estado', agave: 'Agave', maestro: 'Maestro mezcalero', order: 'Orden', byAttention: 'lo que pide atención primero', byDays: 'las de más días primero', byCode: 'por número de tina', byCustom: 'en el orden de la tabla', contains: 'Que contengan' },
    table: {
      selectAll: 'Seleccionar las tinas de esta página', selectRow: 'Seleccionar {title}', rowActions: 'Acciones de {title}', actionsHeader: 'Acciones', selectedCount: '{count} seleccionadas',
      sortBy: 'Ordenar por', ascending: 'ascendente', descending: 'descendente', sorted: 'Ordenado por {label}, {direction}',
      loading: 'Cargando tinas…', slow: 'Sigue cargando las tinas…', results: (o) => (o.count === 1 ? '1 tina' : o.count + ' tinas'), range: 'Tinas {from} a {to} de {total}',
      failed: 'No se pudieron cargar las tinas.', retry: 'Reintentar', empty: 'Aún no hay tinas registradas', emptyFiltered: 'Ninguna tina cumple esta consulta',  clearFilters: 'Quitar todos', detail: 'Tina {title}',
      filters: { group: 'Filtros de tinas', add: 'Agregar filtro', clear: 'Limpiar filtros', filterBy: 'Filtrar por {label}', edit: 'Editar filtro: {summary}', remove: 'Quitar filtro: {summary}', apply: 'Aplicar', cancel: 'Cancelar', required: 'Indica un valor para aplicar el filtro.', range: '«Desde» debe ser menor o igual que «hasta».', rule: 'Regla', value: 'Valor', from: 'Desde', to: 'Hasta', and: 'y', days: '{n} días', results: '{count} tinas', ops: OPS },
      pagination: { nav: 'Páginas de tinas', previous: 'Página anterior', next: 'Página siguiente', page: 'Página {page}', range: '{from}–{to} de {total}', compact: 'Página {page} de {pages}', pageSize: 'Tinas por página' }
    }
  }
  const FORM_LABELS = { optional: '(opcional)', requiredHint: 'Los campos con * son obligatorios.', error: 'Error: ', warning: 'Advertencia: ', valid: 'Correcto: ', sectionErrors: (n) => (n === 1 ? '1 error' : n + ' errores') }

  // El formulario es de la aplicación: el block solo le da { mode, item, close, cancel }
  const TinaForm = {
    props: { mode: String, item: Object, close: Function, cancel: Function, where: String },
    setup (props) {
      const m = reactive(props.item ? { ...props.item } : { agave: '', estado: 'fermentando', volumen: 1500, maestro: '', lote: '' })
      const busy = ref(false)
      const tried = ref(false)
      // Los errores los calcula la aplicación siempre; GForm decide cuándo revelarlos (showErrorsOn) y bloquea el envío
      const errors = computed(() => {
        const e = {}
        if (!m.estado) e.estado = 'Elige el estado de la tina.'
        if ((m.estado === 'fermentando' || m.estado === 'lista') && !m.agave) e.agave = 'Una tina con mosto necesita su agave.'
        if (!m.maestro) e.maestro = 'Indica quién la lleva.'
        return e
      })
      const submit = async () => {
        tried.value = true
        await nextTick()
        if (Object.keys(errors.value).length) return
        busy.value = true
        try {
          const saved = await api.save({ ...m })
          await window.__rlApp.reload()
          props.close({ saved: saved.id, announce: props.mode === 'create' ? `Tina ${saved.id} registrada.` : `${saved.id} guardada.` })
          if (props.where === 'dialog' || props.where === 'sheet') window.__rlToaster.success(props.mode === 'create' ? `Tina ${saved.id} registrada` : `${saved.id} guardada`)
        } catch (err) {
          window.__rlToaster.error('No se pudo guardar', { description: err.message })
        } finally { busy.value = false }
      }
      return { m, busy, errors, submit, tried, AGAVES: AGAVES.map((a) => ({ value: a, label: a })), ESTADOS, MAESTROS: MAESTROS.map((a) => ({ value: a, label: a })), FORM_LABELS }
    },
    template: /* html */ `
<g-form class="rl-form" :aria-label="mode === 'create' ? 'Tina nueva' : 'Editar ' + (item && item.codigo)" :errors="errors" :labels="FORM_LABELS" show-errors-on="submit" @submit="submit" @invalid="tried = true" novalidate>
  <g-form-layout>
    <g-form-row>
      <g-select class="g-form-w-md" label="Estado" name="estado" v-model="m.estado" :options="ESTADOS" required></g-select>
      <g-select class="g-form-w-md" label="Agave" name="agave" v-model="m.agave" :options="AGAVES" placeholder="Elige el agave"></g-select>
    </g-form-row>
    <g-form-row>
      <g-number-field class="g-form-w-sm" label="Volumen" name="volumen" v-model="m.volumen" suffix="L" suffix-label="litros" :min="0" :precision="0"></g-number-field>
      <g-input class="g-form-w-sm" label="Lote" name="lote" v-model="m.lote" hint="Por ejemplo L-26-031"></g-input>
    </g-form-row>
    <g-select label="Maestro mezcalero" name="maestro" v-model="m.maestro" :options="MAESTROS" placeholder="Quién la lleva" required></g-select>
  </g-form-layout>
  <g-form-actions>
    <g-btn type="submit" :loading="busy" loading-text="Guardando…">{{ mode === 'create' ? 'Registrar' : 'Guardar' }}</g-btn>
    <g-btn type="button" variant="ghost" color="neutral" @click="cancel()">Cancelar</g-btn>
  </g-form-actions>
</g-form>`
  }

  const toaster = Grana.createToaster({ position: 'bottom-end', labels: { region: 'Notificaciones ({hotkey})', close: 'Cerrar notificación', types: { info: 'Información', success: 'Correcto', warning: 'Advertencia', error: 'Error', loading: 'En curso' }, repeated: '{count} veces', queued: '{count} más en espera', actionHint: 'Pulsa {hotkey} para {action}.' } })
  window.__rlToaster = toaster

  const App = {
    components: { RlResourceList, TinaForm },
    setup () {
      const query = ref({ search: '', filters: [], sort: CONCEPT === 'C' ? { key: 'atencion', direction: 'ascending' } : null, page: 1, pageSize: 10 })
      const rows = ref([])
      const total = ref(0)
      const counts = ref(null)
      const returns = ref(null)
      const loading = ref(true)
      const error = ref(false)
      const forbidden = ref(false)
      let seq = 0
      const reload = async () => {
        const my = ++seq
        loading.value = true
        STATE.loads++
        try {
          const r = await api.list(query.value, COLUMNS('base'))
          if (my !== seq) return
          rows.value = r.rows; total.value = r.total; counts.value = r.counts; returns.value = r.returns; error.value = false
          if (r.page !== query.value.page) query.value = { ...query.value, page: r.page }
        } catch (e) {
          if (my !== seq) return
          if (e.code === 403) forbidden.value = true
          else error.value = e.message
        } finally { if (my === seq) loading.value = false }
      }
      const onQuery = (q) => { query.value = q; reload() }
      // Quitar: la aplicación lo hace; base y C confirman antes (el block) y ofrecen «Deshacer» en el aviso; A no avisa (huella)
      const onRemove = async ({ rows: gone }) => {
        const removed = await api.remove(gone.map((r) => r.id))
        await reload()
        if (CONCEPT !== 'A') {
          const t = gone.length === 1 ? `${gone[0].codigo} dada de baja` : `${gone.length} tinas dadas de baja`
          toaster.show({ title: t, action: { label: 'Deshacer', onClick: async () => { await api.restore(removed); reload() } } })
        }
      }
      const onDuplicate = async ({ row }) => { const s = await api.save({ ...row, id: undefined }); await reload(); toaster.success(`${s.id} creada como copia de ${row.codigo}`) }
      // Permisos por fila (regla 1 de #643): false = oculta · String = motivo visible · true = disponible
      const actions = {
        create: true,
        edit: (r) => (r.estado === 'destilando' ? 'No se edita mientras destila' : true),
        duplicate: (r) => (r.estado === 'vacia' ? false : true),
        remove: (r) => (r.estado === 'fermentando' || r.estado === 'destilando' ? 'Solo se da de baja una tina sin mosto' : true)
      }
      window.__rlApp = { reload, query, rows, total, api }
      reload()
      return { returns, CONCEPT, DATA, failNext: () => { api.lab.failNext = true }, query, rows, total, counts, loading, error, forbidden, onQuery, onRemove, onDuplicate, actions, LABELS, COLUMNS: COLUMNS(CONCEPT), status: api.status, reload, ESTADO }
    },
    template: /* html */ `
<header class="lab-bar">
  <b class="lab-bar__brand">Palenque Santa Catarina · laboratorio de kiwi</b>
  <nav class="lab-bar__nav" aria-label="Conceptos del laboratorio">
    <a v-for="c in ['base', 'A', 'B', 'C']" :key="c" :href="'?c=' + c" :aria-current="CONCEPT === c ? 'page' : undefined">{{ c === 'base' ? 'Base' : c + ' · ' + ({ A: 'En su sitio', B: 'Lente', C: 'La frase' })[c] }}</a>
  </nav>
  <nav class="lab-bar__nav" aria-label="Datos del laboratorio">
    <a v-for="d in [['ok', 'Datos'], ['empty', 'Vacío'], ['fail', 'Falla'], ['slow', 'Lenta'], ['forbidden', 'Sin acceso']]" :key="d[0]" :href="'?c=' + CONCEPT + '&data=' + d[0]" :aria-current="DATA === d[0] ? 'page' : undefined">{{ d[1] }}</a>
    <button type="button" class="lab-bar__btn" id="lab-fail" @click="failNext">Fallar la siguiente</button>
  </nav>
</header>
<main id="main" class="lab-main" tabindex="-1">
  <rl-resource-list :concept="CONCEPT" title="Tinas de fermentación" description="Palenque Santa Catarina Minas · 46 tinas de madera de sabino."
    :columns="COLUMNS" :rows="rows" :total="total" :query="query" @update:query="onQuery" :loading="loading" :error="error" :forbidden="forbidden"
    :row-status="status" :counts="counts" :returns="returns" :actions="actions" :labels="LABELS" @remove="onRemove" @duplicate="onDuplicate" @retry="error = false; reload()">
    <template #cell-estado="{ row, value }"><span class="rl-estado" :data-estado="value">{{ ESTADO[value] }}</span></template>
    <template #form="{ mode, item, close, cancel, where }"><tina-form :mode="mode" :item="item" :close="close" :cancel="cancel" :where="where"></tina-form></template>
  </rl-resource-list>
</main>
<g-toaster></g-toaster>`
  }
  const app = createApp(App)
  app.config.globalProperties.window = window
  app.config.globalProperties.location = location
  app.use(Grana).use(GranaPageHeader).use(toaster)
  window.__vm = app.mount('#app')
})()
