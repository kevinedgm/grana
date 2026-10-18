// Banco de estilo de GFab (coco). XFab: lo que hará GFab.vue y SOLO lo que el estilo necesita (ver estilo-banco.html).
// Geometría portada de design/lab/fab/r01/fab.js (kiwi) con los nombres de clases y datos de design/contracts/fab.md.
const Q = new URLSearchParams(location.search)
const THEME = Q.get('theme') || ''
if (Q.get('dark') === '1') document.documentElement.setAttribute('data-theme', 'dark')
if (Q.get('rtl') === '1') document.documentElement.setAttribute('dir', 'rtl')
if (THEME === 'nsa') document.getElementById('gen').href = '../page-header/r01/nsa-tokens.css'
else if (THEME) document.getElementById('gen').href = `../tema-oscuro/dark-color-presence/generated/${THEME}.css`
if (Q.get('slow') === '1') document.getElementById('slow-css').textContent = ':root{--g-duration-fast:600ms;--g-duration-press:800ms}'

const { createApp, defineComponent, ref, reactive, computed, nextTick, onMounted, h } = Vue
const svg = (n) => window.lucide(n)
const I = (n) => h('span', { innerHTML: svg(n), style: 'display:contents' })

const ALL = [
  { id: 'sample', label: 'Nueva muestra', icon: 'file-text', description: 'Registro con código de barras' },
  { id: 'photo', label: 'Tomar foto', icon: 'camera' },
  { id: 'note', label: 'Dictar nota', icon: 'mic' },
  { id: 'upload', label: 'Subir archivo', icon: 'upload', description: 'PDF, imagen o CSV' },
  { id: 'agenda', label: 'Programar toma', icon: 'calendar' },
  { id: 'csv', label: 'Exportar CSV', icon: 'download', group: 'Exportar', description: 'Lo filtrado, en UTF-8' },
  { id: 'print', label: 'Imprimir etiquetas', icon: 'printer', group: 'Exportar' },
  { id: 'share', label: 'Compartir lote', icon: 'share-2', group: 'Compartir', description: 'Con el equipo del laboratorio' },
  { id: 'mail', label: 'Enviar por correo', icon: 'mail', group: 'Compartir' },
  { id: 'tag', label: 'Etiquetar', icon: 'tag', group: 'Organizar' },
  { id: 'move', label: 'Mover a carpeta', icon: 'folder', group: 'Organizar' },
  { id: 'copy', label: 'Duplicar', icon: 'copy', group: 'Organizar' },
  { id: 'link', label: 'Copiar enlace', icon: 'link', group: 'Compartir' },
  { id: 'prefs', label: 'Preferencias', icon: 'settings', group: 'Mantenimiento', disabled: 'Solo para coordinación' },
  { id: 'purge', label: 'Vaciar borradores', icon: 'trash', group: 'Mantenimiento', danger: true, confirm: '¿Vaciar los 12 borradores?', confirmLabel: 'Vaciar' }
]
const SCENES = {
  a3: () => ({ items: [ALL[0], ALL[1], { ...ALL[14], group: undefined }] }),
  a6: () => ({ items: ALL.slice(0, 5).concat(ALL[14]) }),
  a15: () => ({ items: ALL }),
  panel: () => ({ items: ALL.slice(0, 9).concat(ALL[13], ALL[14]), appearance: 'panel' }),
  c: () => ({ items: ALL, main: 'sample' }),
  single: () => ({ items: [ALL[1]] }),
  main1: () => ({ items: [ALL[0]], main: 'sample' })
}
const LABELS = { more: 'Más acciones ({count})', moreShort: 'Más acciones', cancel: 'Cancelar', findHint: 'Escribe para buscar', matches: '{count} acciones', matchesOne: '1 acción', none: 'Ninguna acción con', busy: 'Exportando…', done: 'CSV exportado', failed: 'No se pudo exportar' }
const raf2 = (fn) => requestAnimationFrame(() => requestAnimationFrame(fn))
const SP = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--g-space-1')) || 4
const ms = (v) => { const n = parseFloat(v); return String(v).trim().endsWith('ms') ? n : n * 1000 }
const fmt = (s, n) => s.replace('{count}', n)

const XFab = defineComponent({
  props: { items: Array, label: String, main: String, appearance: { type: String, default: 'auto' }, position: { type: String, default: 'bottom-end' }, anchor: { type: String, default: 'viewport' }, coarse: Boolean, id: { type: String, default: 'fab' } },
  setup(props) {
    const root = ref(null), menu = ref(null), sub = ref(null), scrim = ref(null)
    const st = reactive({ phase: 'closed', open: false, shape: 'stack', k: 5, overflow: [], sub: false, subPhase: 'closed', armed: null, ack: null, ackId: null, tucked: false, find: '', findEmpty: false, focusKey: null })
    const isC = computed(() => !!props.main && props.items.length > 1)
    const mainItem = computed(() => props.items.find((x) => x.id === props.main))
    const rest = computed(() => (props.main ? props.items.filter((x) => x.id !== props.main) : props.items))
    const single = computed(() => props.items.length === 1)
    const outUp = computed(() => props.position.startsWith('bottom'))
    const coarse = () => props.coarse || matchMedia('(pointer: coarse)').matches
    const kSide = () => parseFloat(getComputedStyle(root.value).getPropertyValue('--_k')) || 0
    const box = (l, t, w, hh) => ({ left: l, top: t, width: w, height: hh, right: l + w, bottom: t + hh })
    function bounds() {
      const p = SP() * 4
      const c = props.anchor === 'viewport' ? { left: 0, top: 0, right: innerWidth, bottom: innerHeight } : root.value.parentElement.getBoundingClientRect()
      const r = { left: Math.max(c.left, 0), top: Math.max(c.top, 0), right: Math.min(c.right, innerWidth), bottom: Math.min(c.bottom, innerHeight) }
      return { left: r.left + p, top: r.top + p, right: r.right - p, bottom: r.bottom - p, width: r.right - r.left - 2 * p, height: r.bottom - r.top - 2 * p, narrow: c.right - c.left < SP() * 130, raw: r }
    }
    const fRect = () => { const r = root.value.getBoundingClientRect(); return box(r.left, r.top, r.width, r.height) }
    const triggerEl = () => root.value.querySelector(isC.value ? '.g-fab__main-group > button:last-of-type' : ':scope > button')
    const tRect = () => { const r = triggerEl().getBoundingClientRect(); return box(r.left, r.top, r.width, r.height) }
    const pillH = () => (coarse() ? 44 : Math.max(SP() * 10, 24))
    function stackFit(n) {
      const b = bounds(), f = fRect(), g = SP() * 2
      const avail = outUp.value ? f.top - SP() * 3 - b.top : b.bottom - f.bottom - SP() * 3
      return Math.max(0, Math.min(n, 5, Math.floor((avail + g) / (pillH() + g))))
    }
    function resolveShape() {
      st.overflow = []
      if (isC.value || props.appearance === 'panel') { st.shape = 'panel'; return }
      const n = rest.value.length, k = stackFit(n)
      st.k = k
      if (k <= 1 && n > 1) st.shape = 'panel'
      else { st.shape = 'stack'; if (n > k) st.overflow = rest.value.slice(k - 1) }
    }
    const shown = computed(() => (st.shape === 'stack' ? rest.value.slice(0, rest.value.length - st.overflow.length) : rest.value))
    const set = (n, vars) => { for (const [k, v] of Object.entries(vars)) n.style.setProperty(k, typeof v === 'number' ? `${Math.round(v * 100) / 100}px` : v) }
    function placeStack() {
      const ul = menu.value, b = bounds(), f = fRect(), k = kSide()
      const mr = ul.getBoundingClientRect(), w = mr.width, hh = mr.height
      let x = k > 0 ? f.right - w : k < 0 ? f.left : f.left + f.width / 2 - w / 2
      x = Math.min(Math.max(x, b.left), b.right - w)
      const y = outUp.value ? f.top - SP() * 3 - hh : f.bottom + SP() * 3
      set(ul, { '--_x': x, '--_y': y })
      const lis = [...ul.children], cx = f.left + f.width / 2, cy = f.top + f.height / 2
      const near = outUp.value ? lis.slice().reverse() : lis
      near.forEach((li, i) => {
        set(li, { '--_fx': cx - (x + li.offsetLeft + li.offsetWidth / 2), '--_fy': cy - (y + li.offsetTop + li.offsetHeight / 2) })
        li.style.setProperty('--_i', String(Math.min(i, 4)))
      })
    }
    function placePanel(ul, from) {
      const b = bounds(), f = fRect(), k = kSide()
      const w = b.narrow ? b.width : Math.min(SP() * 80, b.width)
      set(ul, { '--_w': w })
      const avail = Math.max(SP() * 20, outUp.value ? from.top - SP() * 3 - b.top : b.bottom - from.bottom - SP() * 3)
      set(ul, { '--_max': avail })
      const hh = Math.min(ul.offsetHeight, avail) // como el .vue: la caja ya con min-block-size (--_minh) y --_max
      let x = b.narrow ? b.left : k > 0 ? f.right - w : k < 0 ? f.left : f.left + f.width / 2 - w / 2
      x = Math.min(Math.max(x, b.left), b.right - w)
      const y = outUp.value ? from.top - SP() * 3 - hh : from.bottom + SP() * 3
      set(ul, { '--_x': x, '--_y': y })
      return { x, y, w, h: hh }
    }
    function clipFrom() {
      const ul = menu.value, t = tRect()
      const x = parseFloat(ul.style.getPropertyValue('--_x')), w = ul.offsetWidth, hh = ul.offsetHeight
      const left = Math.min(Math.max(t.left - x, 0), Math.max(w - t.width, 0)), right = Math.max(w - t.width - left, 0)
      const top = outUp.value ? Math.max(hh - t.height, 0) : 0, bottom = outUp.value ? 0 : Math.max(hh - t.height, 0)
      ul.style.setProperty('--_clip-from', `inset(${top}px ${right}px ${bottom}px ${left}px round var(--g-radius-pill))`)
    }
    // Velo (#668): siempre el visor entero (también con anchor="container"; sin --_x/--_y/--_w/--_h). La ventana es la caja
    // del disparador contraído (A y single: el FAB; C: principal + cola) más el anillo de coco (space × 1 por lado), en px
    // enteros del visor redondeados hacia fuera (floor del origen, ceil del extremo)
    function placeScrim() {
      const s = scrim.value, f = fRect(), g = SP()
      const x = Math.floor(f.left - g), y = Math.floor(f.top - g)
      set(s, { '--_hole-x': x, '--_hole-y': y, '--_hole-w': Math.ceil(f.right + g) - x, '--_hole-h': Math.ceil(f.bottom + g) - y })
    }
    function place() {
      if (st.shape === 'stack') placeStack(); else { placePanel(menu.value, isC.value ? tRect() : fRect()); if (isC.value) clipFrom() }
      if (st.sub) placeSub()
      if (coarse() && scrim.value.matches(':popover-open')) placeScrim()
    }
    function placeSub() {
      const b = bounds(), stack = menu.value.getBoundingClientRect()
      const room = outUp.value ? stack.top - b.top : b.bottom - stack.bottom
      const cover = room < SP() * 40
      // --_minh exacto (#677): el alto de la caja de la pila, sin margen; solo cuando la cubre
      if (cover) set(sub.value, { '--_minh': stack.height }); else sub.value.style.removeProperty('--_minh')
      placePanel(sub.value, cover ? fRect() : box(stack.left, stack.top, stack.width, stack.height))
    }
    const focusables = (ul) => [...ul.querySelectorAll('.g-fab__item, .g-fab__cancel, .g-fab__confirm-action')].filter((b) => !b.closest('[hidden]'))
    function focusEl(b) { if (!b) return; for (const x of b.closest('ul.g-fab__list').querySelectorAll('[role="menuitem"]')) x.tabIndex = -1; b.tabIndex = 0; b.focus({ preventScroll: true }) }
    async function open({ at = 'first' } = {}) {
      if (single.value) return
      st.tucked = false
      if (!st.open) {
        st.open = true
        resolveShape()
        await nextTick()
        if (coarse()) { scrim.value.showPopover(); placeScrim() }
        menu.value.showPopover()
        st.phase = 'opening'
        await nextTick()
        place()
        menu.value.getBoundingClientRect()
        raf2(() => { if (st.open) st.phase = 'open' })
      }
      const els = focusables(menu.value)
      const nearest = st.shape === 'stack' && outUp.value ? els[els.length - 1] : els[0]
      const far = st.shape === 'stack' && outUp.value ? els[0] : els[els.length - 1]
      focusEl(at === 'far' ? far : nearest)
    }
    function close({ focus = true } = {}) {
      if (!st.open) return
      st.open = false; unarm(); st.find = ''; st.findEmpty = false
      closeSub()
      for (const x of menu.value.querySelectorAll('[role="menuitem"]')) x.tabIndex = -1
      st.phase = 'closing'
      if (focus) triggerEl().focus({ preventScroll: true })
      const d = Math.max(...getComputedStyle(menu.value).transitionDuration.split(',').map(ms), ...[...menu.value.children].map((li) => Math.max(...getComputedStyle(li).transitionDuration.split(',').map(ms))))
      setTimeout(() => { if (!st.open) { menu.value.matches(':popover-open') && menu.value.hidePopover(); scrim.value.matches(':popover-open') && scrim.value.hidePopover(); st.phase = 'closed' } }, d + 40)
    }
    async function openSub() {
      if (!st.overflow.length) return
      st.sub = true
      await nextTick()
      sub.value.showPopover(); st.subPhase = 'opening'
      placeSub()
      raf2(() => { if (st.sub) st.subPhase = 'open' })
      focusEl(focusables(sub.value)[0])
    }
    function closeSub() { if (!st.sub) return; st.sub = false; sub.value.matches(':popover-open') && sub.value.hidePopover(); st.subPhase = 'closed' }
    function highlight(btn, instant) {
      const ul = btn.closest('.g-fab__list--panel'); if (!ul) return
      ul.classList.toggle('is-highlight-instant', !!instant || !ul.classList.contains('has-highlight'))
      set(ul, { '--_active-y': btn.offsetTop, '--_active-h': btn.offsetHeight })
      ul.classList.add('has-highlight')
    }
    function onFocusIn(e) { const b = e.target.closest('.g-fab__item'); if (b) highlight(b) }
    function onPointerOver(e) { const b = e.target.closest('.g-fab__item'); if (b && b.getAttribute('aria-disabled') !== 'true' && document.activeElement !== b) focusEl(b) }
    function onKey(e) {
      const ul = e.target.closest('ul.g-fab__list'); if (!ul) return
      const els = focusables(ul), i = els.indexOf(e.target)
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); focusEl(els[(i + (e.key === 'ArrowDown' ? 1 : -1) + els.length) % els.length]) }
      else if (e.key === 'Escape') { e.preventDefault(); if (st.armed) { const id = st.armed; unarm(); nextTick(() => focusEl(root.value.querySelector(`[data-id="${id}"]`))) } else if (st.sub) { closeSub(); focusEl(menu.value.querySelector('.g-fab__item--more')) } else close() }
    }
    // Fila armada (#677): el ancho de la píldora al armarse en --_armed-w de su li (el CSS lo aplica como min-inline-size);
    // se retira al deshacer o confirmar
    async function arm(id) {
      const b = root.value.querySelector(`.g-fab__list [data-id="${id}"]`)
      if (b) set(b.closest('li'), { '--_armed-w': b.getBoundingClientRect().width })
      st.armed = id; await nextTick(); focusEl(root.value.querySelector('.g-fab__cancel'))
    }
    function unarm() {
      if (!st.armed) return
      for (const li of root.value.querySelectorAll('.g-fab__list li')) li.style.removeProperty('--_armed-w')
      st.armed = null
    }
    function onClick(e) {
      const b = e.target.closest('button[role="menuitem"]'); if (!b) return
      if (b.classList.contains('g-fab__item--more')) return openSub()
      if (b.classList.contains('g-fab__cancel')) { const id = st.armed; unarm(); return nextTick(() => focusEl(root.value.querySelector(`[data-id="${id}"]`))) }
      const it = props.items.find((x) => x.id === b.dataset.id)
      if (it && it.danger && !b.classList.contains('g-fab__confirm-action')) return arm(it.id)
      if (b.getAttribute('aria-disabled') !== 'true') close()
    }
    function onTrigger(e) {
      if (st.tucked) { st.tucked = false; return }
      if (e.detail > 1) return
      st.open ? close() : open()
    }
    function setAck(state, id = 'csv') { st.ack = state || null; st.ackId = state ? id : null }
    async function setFind(q, empty = false) { st.find = q; st.findEmpty = empty; await nextTick(); const els = focusables(menu.value); if (!empty || !els.includes(document.activeElement)) focusEl(els[0]) }
    onMounted(() => {
      window.__fab = { open, close, openSub, arm, setAck, setFind, place, st, root, menu, sub, scrim, tuck: (v) => { st.tucked = v }, focusEl, focusables }
      document.fonts.ready.then(() => { window.__fabReady = true })
    })

    // ---------- Pintado ----------
    // Acuse por elemento (#669): data-ack="busy|failed" en el elemento que ejecuta; en curso sigue aria-disabled con su
    // texto; fallida, habilitada con el texto del fallo como motivo
    const ackOf = (id) => (st.ackId === id && (st.ack === 'busy' || st.ack === 'failed') ? st.ack : undefined)
    const reasonOf = (it) => (ackOf(it.id) === 'busy' ? LABELS.busy : ackOf(it.id) === 'failed' ? LABELS.failed : typeof it.disabled === 'string' ? it.disabled : '')
    const offOf = (it) => ackOf(it.id) === 'busy' || (typeof it.disabled === 'string' && ackOf(it.id) !== 'failed')
    function itemBtn(it, { inPanel }) {
      if (st.armed === it.id) {
        return h('div', { class: 'g-fab__confirm', role: 'group', 'aria-label': it.confirm || it.label }, [
          h('button', { type: 'button', role: 'menuitem', tabindex: -1, class: 'g-fab__cancel' }, LABELS.cancel),
          h('button', { type: 'button', role: 'menuitem', tabindex: -1, class: 'g-fab__confirm-action', 'data-id': it.id }, it.confirmLabel || it.label)
        ])
      }
      const reason = reasonOf(it), disabled = offOf(it)
      const did = `${props.id}-d-${it.id}`, rid = `${props.id}-r-${it.id}`
      return h('button', {
        type: 'button', role: 'menuitem', tabindex: -1, 'data-id': it.id, 'data-ack': ackOf(it.id),
        class: ['g-fab__item', it.danger && 'g-fab__item--danger'],
        'aria-disabled': disabled ? 'true' : undefined,
        'aria-describedby': [it.description && did, reason && rid].filter(Boolean).join(' ') || undefined
      }, [
        h('span', { class: 'g-fab__icon', 'aria-hidden': 'true', innerHTML: it.icon ? svg(it.icon) : '' }),
        h('span', { class: 'g-fab__label' }, it.label),
        it.description && h('span', { id: did, class: ['g-fab__desc', !inPanel && 'g-fab__sr'] }, it.description),
        reason && h('span', { id: rid, class: 'g-fab__reason' }, reason),
        it.danger && h('span', { class: 'g-fab__mark', 'aria-hidden': 'true', innerHTML: svg('triangle-alert') })
      ])
    }
    function moreBtn(n) {
      return h('button', { type: 'button', role: 'menuitem', tabindex: -1, id: `${props.id}-tail`, class: ['g-fab__item', 'g-fab__item--more', st.sub && 'is-expanded'], 'aria-haspopup': 'menu', 'aria-expanded': String(st.sub), 'aria-controls': `${props.id}-more` }, [
        h('span', { class: 'g-fab__icon', 'aria-hidden': 'true', innerHTML: svg('ellipsis-vertical') }),
        h('span', { class: 'g-fab__label' }, fmt(LABELS.more, n))
      ])
    }
    function panelChildren(list, withFind) {
      const out = []
      if (withFind) {
        const q = st.find, n = list.length
        out.push(h('li', { class: ['g-fab__find', st.findEmpty && 'is-empty-result'], role: 'none', 'aria-hidden': 'true' },
          !q ? [h('span', null, LABELS.findHint)]
            : st.findEmpty ? [h('span', null, LABELS.none), h('span', { class: 'g-fab__find-query' }, q)]
              : [h('span', { class: 'g-fab__find-query' }, q), h('span', { class: 'g-fab__find-count' }, n === 1 ? LABELS.matchesOne : fmt(LABELS.matches, n))]))
      }
      const groups = []; const loose = []
      for (const it of list) { if (!it.group) loose.push(it); else { let g = groups.find((x) => x.name === it.group); if (!g) groups.push((g = { name: it.group, items: [] })); g.items.push(it) } }
      for (const it of loose) out.push(h('li', { role: 'none', key: it.id }, [itemBtn(it, { inPanel: true })]))
      groups.forEach((g, i) => out.push(h('li', { role: 'none', key: 'g' + i }, [
        h('div', { class: 'g-fab__group-title', id: `${props.id}-g${i}`, role: 'presentation' }, g.name),
        h('ul', { role: 'group', 'aria-labelledby': `${props.id}-g${i}` }, g.items.map((it) => h('li', { role: 'none', key: it.id }, [itemBtn(it, { inPanel: true })])))
      ])))
      return out
    }
    const filtered = computed(() => {
      if (!st.find || st.findEmpty) return rest.value
      const n = (s) => (s || '').toLocaleLowerCase().normalize('NFD').replace(/\p{M}/gu, '')
      return rest.value.filter((it) => n(it.label).includes(n(st.find)) || n(it.description).includes(n(st.find)))
    })
    const badge = () => h('span', { class: 'g-fab__badge', 'aria-hidden': 'true', innerHTML: st.ack ? svg(st.ack === 'busy' ? 'loader-circle' : st.ack === 'done' ? 'check' : 'circle-alert') : '' })
    const glyphs = (restIcon) => [h('span', { class: 'g-fab__glyph g-fab__glyph--rest', 'aria-hidden': 'true', innerHTML: svg(restIcon) }), h('span', { class: 'g-fab__glyph g-fab__glyph--open', 'aria-hidden': 'true', innerHTML: svg('x') })]

    return () => {
      const appearance = single.value ? 'single' : isC.value ? 'main' : st.shape
      const trigAttrs = single.value ? {} : { 'aria-haspopup': 'menu', 'aria-expanded': String(st.open), 'aria-controls': `${props.id}-menu` }
      const detail = st.ack ? LABELS[st.ack] : undefined
      let head
      if (isC.value || (props.main && single.value)) {
        const m = mainItem.value
        head = h('div', { class: 'g-fab__main-group', role: 'group', 'aria-label': props.label }, [
          h(Grana.GBtn, { class: 'g-fab__main', id: `${props.id}-main`, size: 'xl', rounded: 'pill', color: 'brand', variant: 'solid', tooltip: detail || (typeof m.disabled === 'string' ? m.disabled : undefined), 'data-ack': ackOf(m.id), 'aria-disabled': ackOf(m.id) === 'busy' || m.disabled ? 'true' : undefined }, { prepend: () => I(m.icon), default: () => [m.label, badge()] }),
          !single.value && h(Grana.GBtn, { id: `${props.id}-trigger`, icon: true, size: 'xl', rounded: 'pill', color: 'brand', variant: 'solid', tooltip: LABELS.moreShort, ...trigAttrs, onClick: onTrigger }, { default: () => glyphs('ellipsis-vertical') })
        ])
      } else {
        const one = single.value ? props.items[0] : null
        const oneAttrs = one ? { 'data-ack': ackOf(one.id), 'aria-disabled': ackOf(one.id) === 'busy' || one.disabled ? 'true' : undefined } : {}
        head = h(Grana.GBtn, { id: `${props.id}-trigger`, icon: true, size: 'xl', rounded: 'pill', color: 'brand', variant: 'solid', tooltip: single.value ? props.items[0].label : props.label, ...trigAttrs, ...oneAttrs, onClick: onTrigger }, { default: () => [...(single.value ? [h('span', { class: 'g-fab__glyph', innerHTML: svg(props.items[0].icon) })] : glyphs('plus')), badge()] })
      }
      const list = isC.value ? filtered.value : shown.value
      let listChildren
      if (st.shape === 'stack') {
        const parts = list.map((it) => h('li', { role: 'none', key: it.id }, [itemBtn(it, { inPanel: false })]))
        if (st.overflow.length) parts.push(h('li', { role: 'none', key: 'more' }, [moreBtn(st.overflow.length)]))
        listChildren = outUp.value ? parts.reverse() : parts
      } else listChildren = panelChildren(list, isC.value)
      return h('div', {
        ref: root, id: props.id,
        class: ['g-fab', st.tucked && 'is-tucked', props.coarse && 'is-coarse'],
        'data-position': props.position, 'data-anchor': props.anchor, 'data-appearance': appearance, 'data-state': st.phase, 'data-ack': st.ack || undefined,
        onFocusin: onFocusIn, onPointerover: onPointerOver, onKeydown: onKey, onClick
      }, [
        head,
        !single.value && h('ul', { ref: menu, id: `${props.id}-menu`, class: ['g-fab__list', `g-fab__list--${st.shape}`], role: 'menu', popover: 'manual', tabindex: -1, 'aria-labelledby': `${props.id}-trigger`, 'data-state': st.phase, 'data-appearance': st.shape, inert: st.phase === 'closing' || undefined }, listChildren),
        !single.value && !isC.value && h('ul', { ref: sub, id: `${props.id}-more`, class: 'g-fab__list g-fab__list--panel', role: 'menu', popover: 'manual', tabindex: -1, 'aria-labelledby': `${props.id}-tail`, 'data-state': st.subPhase, 'data-appearance': 'panel' }, st.sub ? panelChildren(st.overflow, false) : []),
        !single.value && h('div', { ref: scrim, class: 'g-fab__scrim', popover: 'manual', 'aria-hidden': 'true', onClick: () => close() }, [h('span', { class: 'g-fab__scrim-part' })])
      ])
    }
  }
})

const PARA = Array.from({ length: 10 }, (_, i) => `Fila ${i + 1}: contenido de la página para comprobar que el FAB no tapa lo que tiene el foco y que la pila flota sobre lo que hay debajo.`)
const scene = (SCENES[Q.get('scene')] || SCENES.a6)()
// ?off=1: la acción de single (o la principal de C) deshabilitada con su motivo (#678 (3)); ?long=1: «Nueva muestra» con
// una etiqueta larga (pila más ancha que el panel de space × 80 que la cubre)
if (Q.get('off') === '1') scene.items = scene.items.map((it) => (scene.items.length === 1 || it.id === scene.main ? { ...it, disabled: 'Solo para coordinación' } : it))
if (Q.get('long') === '1') scene.items = scene.items.map((it) => (it.id === 'sample' ? { ...it, label: 'Nueva muestra con código de barras del lote completo' } : it))
const CONTAINER = Q.get('anchor') === 'container'
createApp({
  components: { XFab },
  setup() {
    const frame = ref(null)
    onMounted(async () => {
      await document.fonts.ready
      await new Promise((r) => setTimeout(r, 30))
      const F = window.__fab
      if (Q.get('tuck') === '1') F.tuck(true)
      if (Q.get('ack')) F.setAck(Q.get('ack'), Q.get('ackid') || (scene.main && Q.get('ackmain') ? scene.main : 'csv'))
      if (Q.get('open') === '1' || Q.get('more') || Q.get('arm') || Q.get('find')) {
        await F.open()
        if (Q.get('more') === '1') await F.openSub()
        if (Q.get('arm')) await F.arm(Q.get('arm'))
        if (Q.get('find')) await F.setFind(Q.get('find'), Q.get('find') === 'zzz')
      }
    })
    return { PARA, scene, CONTAINER, frame, pos: Q.get('pos') || 'bottom-end', coarse: Q.get('coarse') === '1', zone: Q.get('zone') === '1' }
  },
  template: `
  <div :class="{ 'zone-wrap': zone }" :data-g-zone="zone ? 'brand' : undefined">
    <div class="bar" role="group" aria-label="Controles del banco"><b>GFab · banco (coco)</b></div>
    <main id="main">
      <h1>Muestras del lote 2026-0412</h1>
      <p v-for="p in PARA.slice(0, 3)" :key="p">{{ p }}</p>
      <div v-if="CONTAINER" ref="frame" class="frame" id="frame"><div class="frame__scroll"><a v-for="(p, i) in PARA" :key="i" class="row" href="#x"><span>Muestra M-{{ 100 + i }}</span><span>En análisis</span></a></div>
        <XFab :items="scene.items" :main="scene.main" :appearance="scene.appearance || 'auto'" label="Crear y capturar" :position="pos" anchor="container" :coarse="coarse" />
      </div>
      <a v-for="(p, i) in PARA" :key="'r' + i" class="row" href="#x" :id="'row' + i"><span>Muestra M-{{ i }}</span><span>En análisis</span></a>
      <label style="display:block;margin-block:16px">Nota <input id="field" style="inline-size:100%;min-block-size:44px"></label>
      <a class="row" href="#x" id="last"><span>Última fila</span><span>junto al borde</span></a>
    </main>
    <XFab v-if="!CONTAINER" :items="scene.items" :main="scene.main" :appearance="scene.appearance || 'auto'" label="Crear y capturar" :position="pos" :coarse="coarse" />
  </div>`
}).mount('#app')
