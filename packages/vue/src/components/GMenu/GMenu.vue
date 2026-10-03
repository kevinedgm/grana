<script>
// GMenu · menú de acciones anclado a un botón de menú (dueño: bruno)
// Contrato: design/contracts/menu.md · Estructura: design/lab/menu/r01/ · Estilo: GMenu.css (coco)
// Patrón Menu Button y Menu de APG. Presenta y emite intención: `checked` viene de `items` y la aplicación lo actualiza.
// Las marcas (check, circle, chevron-right, triangle-alert) son iconos de Lucide (GIcon, docs/contract/icons.md).
import { defineComponent, h, nextTick, onBeforeUnmount, onMounted, onUpdated, ref, useAttrs, useId, watch } from 'vue'
import { oneOf } from '../../utils/oneOf.js'
import GIcon from '../GIcon/GLibIcon.js'
import GAppIcon from '../GIcon/GIcon.vue'
import { transitionMs } from '../../utils/motion.js'
import { placeBlock, placeSubmenu, viewport } from '../../utils/anchor.js'

const isDev = typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production'
const TYPES = ['item', 'checkbox', 'radio', 'separator', 'group']
const cls = (...v) => v.filter(Boolean)
// Pausa del puntero: abre un submenú y, en M4, cambia de elemento si el puntero se para (constante neutra, #187)
const HOVER_MS = 180

export default defineComponent({
  name: 'GMenu',
  inheritAttrs: false,
  props: {
    modelValue: Boolean,
    items: { type: Array, default: () => [] },
    label: { type: String, default: undefined },
    align: { type: String, default: 'start', validator: oneOf(['start', 'end']) },
    side: { type: String, default: 'auto', validator: oneOf(['auto', 'bottom', 'top']) },
    closeOnSelect: { type: String, default: 'auto', validator: oneOf(['auto', 'always', 'never']) },
    density: { type: String, default: 'default', validator: oneOf(['default', 'comfortable', 'compact']) },
    id: { type: String, default: undefined }
  },
  emits: ['update:modelValue', 'select', 'open', 'closed'],
  setup(props, { emit, slots }) {
    const attrs = useAttrs()
    const uid = useId()
    const rootId = `${props.id || `g-menu-${uid}`}`
    const triggerId = `${rootId}-trigger`
    const listId = `${rootId}-list`
    // Salida: la lista oculta sigue montada (e inerte) lo que dura su transición calculada; 0 → se desmonta ya
    const leaving = ref(false)
    let leaveTimer = null
    watch(() => props.modelValue, (isOpen) => {
      clearTimeout(leaveTimer)
      leaveTimer = null
      if (isOpen) { leaving.value = false; return }
      const el = listRef.value
      if (!el) return
      if (typeof el.hidePopover === 'function' && el.matches?.(':popover-open')) el.hidePopover()
      const ms = transitionMs(el)
      if (ms <= 0) { leaving.value = false; return }
      leaving.value = true
      leaveTimer = setTimeout(() => { leaveTimer = null; leaving.value = false }, ms)
    }, { flush: 'pre' })

    const warned = new Set()
    const warnOnce = (key, msg) => {
      if (!isDev || warned.has(key)) return
      warned.add(key)
      console.warn(`[Grana] <GMenu> ${msg}`)
    }

    // ---------- Datos: árbol normalizado ----------
    // nodo: { key, type, raw, parent (grupo), path (claves de los submenús antecesores), children }
    const normalize = (list, path, group, prefix) => {
      const out = []
      ;(list || []).forEach((raw, i) => {
        if (!raw || typeof raw !== 'object') { warnOnce('item', 'ignora un elemento inválido de `items`.'); return }
        const type = raw.type ?? 'item'
        if (!TYPES.includes(type)) { warnOnce(`type-${type}`, `ignora un elemento de tipo desconocido («${type}»).`); return }
        const key = `${prefix}${i}`
        if (type === 'separator') { out.push({ key, type, raw }); return }
        if (typeof raw.label !== 'string' || !raw.label) { warnOnce('label', 'ignora un elemento sin `label`.'); return }
        if (type === 'group') { out.push({ key, type, raw, children: normalize(raw.items, path, raw, `${key}.`) }); return }
        const isParent = Array.isArray(raw.items) && raw.items.length > 0
        // Un padre de submenú no emite `select`: su `id` es opcional
        if (!isParent && (raw.id === undefined || raw.id === null)) { warnOnce('id', 'ignora un elemento sin `id`.'); return }
        const node = { key, type, raw, parent: group, path }
        if (isParent) node.children = normalize(raw.items, [...path, key], null, `${key}.`)
        out.push(node)
      })
      return out
    }

    // ---------- Estado ----------
    const listRef = ref(null)
    const path = ref([]) // claves de los submenús abiertos (de fuera hacia dentro)
    let triggerEl = null
    let pendingFocus = 'first'
    let returnFocus = false
    let typed = ''
    let typedTimer = null
    let hoverTimer = null
    let listening = false

    // El disparador puede ser un componente (GBtn): su ref es la instancia y su elemento, `$el`. Si el componente tiene
    // varias raíces (GBtn: el botón y su región de estado), `$el` es el ancla vacía del fragmento y el elemento es el
    // primer hermano elemento. Antes se recurría entonces a buscar `{id}-trigger`: con un `id` propio en el disparador
    // no había ancla, `place` no llamaba a `showPopover` y el menú no se abría, en silencio (kiwi, hallazgo 8; #305).
    const elementOf = (x) => {
      if (!x || typeof Element === 'undefined') return null
      if (x instanceof Element) return x
      let n = x.$el
      while (n && n.nodeType !== 1) n = n.nextSibling
      return n instanceof Element && !n.classList.contains('g-menu__list') ? n : null
    }
    const trigger = () => elementOf(triggerEl) || (typeof document !== 'undefined' ? document.getElementById(triggerId) : null)
    // El `id` del disparador es del menú (`{id}-trigger`): la aplicación elige `{id}` con la prop `id` (#305)
    const checkTriggerId = () => {
      if (!isDev || warned.has('trigger-id')) return
      const id = elementOf(triggerEl)?.getAttribute('id')
      if (!id || id === triggerId) return
      warned.add('trigger-id')
      console.warn(`[Grana GMenu] el disparador tiene id="${id}"; GMenu necesita "${triggerId}" (usa la prop \`id\` de GMenu).`)
    }
    onMounted(checkTriggerId)
    const menus = () => (listRef.value ? [listRef.value, ...listRef.value.querySelectorAll('[role="menu"]')] : [])
    const itemsOf = (menu) => [...menu.querySelectorAll('.g-menu__item')].filter((el) => el.closest('[role="menu"]') === menu)
    const menuOf = (el) => el.closest('[role="menu"]')
    const itemByKey = (key) => listRef.value?.querySelector(`[data-key="${key}"]`)

    // Foco del *roving tabindex*. Con el puntero (M1): sin desplazar la lista y sin pedir el anillo de :focus-visible
    const focusItem = (el, byPointer = false) => {
      if (!el) return
      itemsOf(menuOf(el)).forEach((x) => { x.tabIndex = -1 })
      el.tabIndex = 0
      if (byPointer) { el.focus({ preventScroll: true, focusVisible: false }); return }
      el.focus()
      el.scrollIntoView?.({ block: 'nearest' })
    }

    // ---------- M1 · una sola luz que viaja (menu.md «Personalidad», #305) ----------
    // Activo de cada lista: el elemento enfocado en ella; con el foco en un submenú, el padre expandido. Datos para el
    // CSS (coco), en cada g-menu__list: --_active-y y --_active-h (px, respecto de la lista: el resaltado se desplaza
    // con el contenido) y has-highlight mientras haya activo; is-highlight-instant en la primera colocación (tras abrir
    // o tras no tener activo), retirada a los dos cuadros. Se escribe solo lo que cambia.
    const raf = (fn) => (typeof requestAnimationFrame === 'function' ? requestAnimationFrame(fn) : setTimeout(fn, 16))
    const instantTurn = new WeakMap()
    const offsetIn = (el, menu) => {
      let y = 0
      for (let n = el; n && n !== menu; n = n.offsetParent) {
        // La lista no es el contenedor de posición de sus elementos: por geometría
        if (!n.offsetParent || !menu.contains(n.offsetParent)) {
          return el.getBoundingClientRect().top - menu.getBoundingClientRect().top - menu.clientTop + menu.scrollTop
        }
        y += n.offsetTop
      }
      return y
    }
    const setVar = (menu, name, value) => { if (menu.style.getPropertyValue(name) !== value) menu.style.setProperty(name, value) }
    const highlight = (menu, el) => {
      const cl = menu.classList
      if (!el) { if (cl.contains('has-highlight')) cl.remove('has-highlight'); return }
      const first = !cl.contains('has-highlight')
      if (first) {
        const turn = (instantTurn.get(menu) || 0) + 1
        instantTurn.set(menu, turn)
        cl.add('is-highlight-instant')
        raf(() => raf(() => { if (instantTurn.get(menu) === turn) menu.classList.remove('is-highlight-instant') }))
      }
      setVar(menu, '--_active-y', `${Math.round(offsetIn(el, menu))}px`)
      setVar(menu, '--_active-h', `${el.offsetHeight}px`)
      if (first) cl.add('has-highlight')
    }
    let hlQueued = false
    const updateHighlights = () => {
      hlQueued = false
      const root = listRef.value
      // Al cerrar, el resaltado se queda donde estaba mientras la lista sale
      if (!root || !props.modelValue) return
      const a = document.activeElement
      const focused = a && root.contains(a) ? a.closest('.g-menu__item') : null
      for (const menu of menus()) {
        let active = null
        if (focused && menu.contains(focused)) {
          active = menuOf(focused) === menu ? focused : (itemsOf(menu).find((x) => x.parentElement.contains(focused)) || null)
        }
        highlight(menu, active)
      }
    }
    // focusout y focusin llegan seguidos al mover el foco: se calcula una vez, ya con el foco en su sitio
    const queueHighlights = () => {
      if (hlQueued) return
      hlQueued = true
      queueMicrotask(updateHighlights)
    }
    onUpdated(queueHighlights)

    // ---------- Posición ----------
    const place = (menu, anchor, sub) => {
      if (!menu || !anchor) return
      const scroll = menu.scrollTop
      menu.style.setProperty('--_max', '9999px')
      if (typeof menu.showPopover === 'function' && !menu.matches?.(':popover-open')) menu.showPopover()
      const a = anchor.getBoundingClientRect()
      const { width: vw, height: vh } = viewport()
      const rtl = getComputedStyle(anchor).direction === 'rtl'
      const opts = { width: menu.offsetWidth, naturalHeight: menu.scrollHeight + 4, vw, vh, rtl }
      const { x, y, room } = sub ? placeSubmenu(a, opts) : placeBlock(a, { ...opts, align: props.align, side: props.side })
      menu.dataset.side = sub ? 'bottom' : (y >= a.bottom ? 'bottom' : 'top')
      menu.dataset.align = sub
        ? (x >= a.left ? 'left' : 'right')
        : (Math.abs(x - a.left) <= Math.abs(x + opts.width - a.right) ? 'left' : 'right')
      menu.style.setProperty('--_max', `${Math.max(96, room)}px`)
      menu.style.setProperty('--_x', `${x}px`)
      menu.style.setProperty('--_y', `${y}px`)
      menu.scrollTop = scroll
    }
    const placeAll = () => {
      const root = listRef.value
      if (!root) return
      place(root, trigger(), false)
      root.querySelectorAll('[role="menu"]').forEach((m) => {
        const parent = document.getElementById(m.getAttribute('aria-labelledby'))
        if (parent) place(m, parent, true)
      })
    }
    const reposition = (e) => {
      if (!props.modelValue || (e && e.target && e.target.nodeType === 1 && listRef.value?.contains(e.target))) return
      const t = trigger()
      if (t) {
        const r = t.getBoundingClientRect()
        if (r.bottom < 0 || r.top > window.innerHeight || r.right < 0 || r.left > window.innerWidth) { close(false); return }
      }
      placeAll()
    }

    // ---------- Abrir y cerrar ----------
    const onOutside = (e) => {
      const t = trigger()
      if (listRef.value?.contains(e.target) || t?.contains(e.target)) return
      close(false)
    }
    const listen = () => {
      if (listening) return
      listening = true
      document.addEventListener('pointerdown', onOutside, true)
      window.addEventListener('resize', reposition)
      window.addEventListener('scroll', reposition, true)
    }
    const unlisten = () => {
      if (!listening) return
      listening = false
      document.removeEventListener('pointerdown', onOutside, true)
      window.removeEventListener('resize', reposition)
      window.removeEventListener('scroll', reposition, true)
    }
    function close(focusTrigger) {
      if (!props.modelValue) return
      returnFocus = Boolean(focusTrigger)
      emit('update:modelValue', false)
    }
    const requestOpen = (at) => {
      if (props.modelValue) return
      pendingFocus = at
      emit('update:modelValue', true)
    }

    watch(() => props.modelValue, async (isOpen) => {
      if (isOpen) {
        path.value = []
        await nextTick()
        const root = listRef.value
        if (!root) return
        checkTriggerId()
        placeAll()
        listen()
        emit('open')
        const its = itemsOf(root)
        focusItem(pendingFocus === 'last' ? its[its.length - 1] : its[0])
        pendingFocus = 'first'
      } else {
        unlisten()
        clearTimeout(hoverTimer)
        resetPointer()
        path.value = []
        emit('closed')
        if (returnFocus) trigger()?.focus()
        returnFocus = false
      }
    }, { flush: 'post' })
    onBeforeUnmount(() => { unlisten(); clearTimeout(hoverTimer); clearTimeout(holdTimer); clearTimeout(typedTimer); clearTimeout(leaveTimer) })

    // ---------- Submenús ----------
    const openSub = async (node, focusFirst) => {
      path.value = [...node.path, node.key]
      await nextTick()
      const parent = itemByKey(node.key)
      const sub = document.getElementById(`${rootId}-m-${node.key}`)
      if (!parent || !sub) return
      place(sub, parent, true)
      if (focusFirst) focusItem(itemsOf(sub)[0])
    }
    const closeSub = (node, focusParent) => {
      path.value = node.path
      if (focusParent) nextTick(() => focusItem(itemByKey(node.key)))
    }

    // ---------- Activar ----------
    const shouldClose = (type) => props.closeOnSelect === 'always' || (props.closeOnSelect === 'auto' && type === 'item')
    const activate = (node, event) => {
      if (node.raw.disabled) return
      if (node.children) { openSub(node, true); return }
      const type = node.type
      const payload = {
        id: node.raw.id,
        item: node.raw,
        type,
        checked: type === 'checkbox' ? !node.raw.checked : type === 'radio' ? true : undefined,
        group: node.parent,
        event
      }
      emit('select', payload)
      if (!event?.defaultPrevented && shouldClose(type)) close(true)
    }
    // Puntero sobre un elemento: abre su submenú, o cierra los de otros, tras HOVER_MS (como siempre)
    const hoverAction = (node) => { if (node.children) openSub(node, false); else path.value = node.path }
    const onEnter = (node) => {
      clearTimeout(hoverTimer)
      if (node.raw.disabled) return
      hoverTimer = setTimeout(() => hoverAction(node), HOVER_MS)
    }

    // ---------- Puntero: mueve el foco (M1) y respeta la diagonal hacia un submenú abierto (M4, #305) ----------
    // Solo ratón y lápiz: el toque y el teclado no cambian. Se actúa solo si el puntero se movió (un elemento que pasa
    // bajo el puntero quieto, al desplazar la lista o al abrirla, no le quita el foco al teclado).
    let lastPt = null // última posición del puntero sobre el menú (o la del clic que lo abrió)
    let hovered = null // elemento al que el puntero ya movió el foco
    let holdEl = null // elemento cruzado de camino a un submenú (M4)
    let holdTimer = null
    const resetPointer = () => { clearTimeout(holdTimer); holdTimer = null; holdEl = null; hovered = null; lastPt = null }
    const cross = (p, q, r) => (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x)
    const inTriangle = (p, a, b, c) => {
      const d1 = cross(p, a, b)
      const d2 = cross(p, b, c)
      const d3 = cross(p, c, a)
      return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0))
    }
    // M4: esquinas del borde cercano del submenú abierto desde otro elemento de la misma lista. El lado se mide (final
    // en LTR, inicio en RTL, o el contrario si cambió de lado por falta de sitio); si el submenú tapa el centro de su
    // padre (cascada en pantallas estrechas), no hay triángulo.
    const aimCorners = (menu, el) => {
      const parent = itemsOf(menu).find((x) => x !== el && x.getAttribute('aria-expanded') === 'true')
      const sub = parent && document.getElementById(parent.getAttribute('aria-controls'))
      if (!sub) return null
      const s = sub.getBoundingClientRect()
      const p = parent.getBoundingClientRect()
      const mid = (p.left + p.right) / 2
      const x = s.left >= mid ? s.left : s.right <= mid ? s.right : null
      return x === null ? null : [{ x, y: s.top }, { x, y: s.bottom }]
    }
    const pointTo = (el, node, now) => {
      clearTimeout(holdTimer); holdTimer = null; holdEl = null
      hovered = el
      // Sobre un deshabilitado, el puntero no mueve foco ni resaltado
      if (node.raw.disabled) { clearTimeout(hoverTimer); return }
      if (document.activeElement !== el) focusItem(el, true)
      if (now) { clearTimeout(hoverTimer); hoverAction(node) } else onEnter(node)
    }
    // Dentro del triángulo, cruzar un elemento no cambia nada; si el puntero se para HOVER_MS sobre él, cambia
    const hold = (el, node) => {
      clearTimeout(holdTimer)
      holdEl = el
      holdTimer = setTimeout(() => { holdTimer = null; pointTo(el, node, true) }, HOVER_MS)
    }
    const onPointer = (e) => {
      if (e.pointerType === 'touch') return
      const pt = { x: e.clientX, y: e.clientY }
      const prev = lastPt
      lastPt = pt
      if (prev && prev.x === pt.x && prev.y === pt.y) return
      const el = e.target?.closest?.('.g-menu__item')
      if (!el || !listRef.value?.contains(el)) return
      if (el === hovered) {
        // El teclado se llevó el foco y el puntero vuelve a moverse sobre este elemento: lo recupera
        if (!el.matches('[aria-disabled="true"]') && document.activeElement !== el) focusItem(el, true)
        return
      }
      const node = nodeOf(el)
      if (!node) return
      const corners = prev && aimCorners(menuOf(el), el)
      if (corners && inTriangle(pt, prev, corners[0], corners[1])) { hold(el, node); return }
      pointTo(el, node, false)
    }
    const onItemEnter = (e, node) => {
      if (e.pointerType === 'touch') { onEnter(node); return }
      onPointer(e)
    }
    const onItemLeave = (e) => {
      const el = e.currentTarget
      if (holdEl === el) { clearTimeout(holdTimer); holdTimer = null; holdEl = null }
      if (hovered === el) hovered = null
    }

    // ---------- Teclado ----------
    const onTriggerKeydown = (e) => {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (!props.modelValue) requestOpen('first') }
      else if (e.key === 'ArrowUp') { e.preventDefault(); if (!props.modelValue) requestOpen('last') }
    }
    const nodeOf = (el) => {
      const key = el?.getAttribute?.('data-key')
      let found = null
      const walk = (list) => { for (const n of list) { if (n.key === key) { found = n; return } if (n.children) walk(n.children); if (found) return } }
      walk(tree)
      return found
    }
    let tree = []
    const onKeydown = (e) => {
      const el = e.target.closest?.('.g-menu__item')
      const menu = el && menuOf(el)
      if (!el || !menu) return
      const list = itemsOf(menu)
      const i = list.indexOf(el)
      const rtl = getComputedStyle(menu).direction === 'rtl'
      const go = (n) => { e.preventDefault(); e.stopPropagation(); focusItem(list[(n + list.length) % list.length]) }
      const k = e.key
      if (k === 'ArrowDown') return go(i + 1)
      if (k === 'ArrowUp') return go(i - 1)
      if (k === 'Home') return go(0)
      if (k === 'End') return go(list.length - 1)
      const openKey = rtl ? 'ArrowLeft' : 'ArrowRight'
      const closeKey = rtl ? 'ArrowRight' : 'ArrowLeft'
      const node = nodeOf(el)
      if (k === openKey && node?.children) {
        e.preventDefault(); e.stopPropagation()
        if (!node.raw.disabled) openSub(node, true)
        return
      }
      const isSub = menu !== listRef.value
      if ((k === closeKey && isSub) || (k === 'Escape' && isSub)) {
        e.preventDefault(); e.stopPropagation()
        const parent = nodeOf(document.getElementById(menu.getAttribute('aria-labelledby')))
        if (parent) closeSub(parent, true)
        return
      }
      if (k === 'Escape') { e.preventDefault(); e.stopPropagation(); close(true); return }
      if (k === 'Tab') { close(false); return }
      if (k.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey && k !== ' ') {
        typed += k.toLowerCase()
        clearTimeout(typedTimer)
        typedTimer = setTimeout(() => { typed = '' }, 500)
        const from = typed.length > 1 ? i : i + 1
        const order = [...list.slice(from), ...list.slice(0, from)]
        const hit = order.find((x) => x.querySelector('.g-menu__label')?.textContent.trim().toLowerCase().startsWith(typed))
        if (hit) { e.preventDefault(); focusItem(hit) }
      }
    }

    // ---------- Marcado ----------
    // M1: el resaltado único de cada lista (lo coloca y anima GMenu.css con --_active-y/h y has-highlight)
    const highlightEl = () => h('li', { class: 'g-menu__highlight', role: 'none', 'aria-hidden': 'true', key: 'g-highlight' })
    const renderNode = (node, menuId) => {
      if (node.type === 'separator') return h('li', { role: 'none', key: node.key }, [h('div', { class: 'g-menu__separator', role: 'separator' })])
      if (node.type === 'group') {
        const gid = `${rootId}-g-${node.key}`
        return h('li', { role: 'none', key: node.key }, [
          h('div', { class: 'g-menu__group-title', id: gid, role: 'presentation' }, node.raw.label),
          h('ul', { role: 'group', 'aria-labelledby': gid }, node.children.map((c) => renderNode(c, menuId)))
        ])
      }
      const it = node.raw
      const expanded = path.value.includes(node.key)
      const role = node.type === 'checkbox' ? 'menuitemcheckbox' : node.type === 'radio' ? 'menuitemradio' : 'menuitem'
      const toggle = node.type === 'checkbox' || node.type === 'radio'
      const content = slots.item
        ? slots.item({ item: it, active: false, checked: Boolean(it.checked) })
        : [
            toggle
              ? h('span', { class: 'g-menu__mark', 'aria-hidden': 'true' }, [
                  node.type === 'checkbox' ? h(GIcon, { name: 'check' }) : h(GIcon, { name: 'circle', filled: true })
                ])
              : slots.icon
                ? (it.icon !== undefined ? h('span', { class: 'g-menu__icon', 'aria-hidden': 'true' }, slots.icon({ item: it })) : null)
                // «Dato → nombre» (#202): `icon` cadena sin slot dibuja GIcon con ese nombre (resolución de la aplicación)
                : (typeof it.icon === 'string' && it.icon !== '' ? h('span', { class: 'g-menu__icon', 'aria-hidden': 'true' }, [h(GAppIcon, { name: it.icon })]) : null),
            h('span', { class: 'g-menu__label' }, [it.danger ? h(GIcon, { class: 'g-menu__danger-icon', name: 'triangle-alert' }) : null, it.label]),
            it.shortcut ? h('span', { class: 'g-menu__shortcut', 'aria-hidden': 'true' }, it.shortcut) : null
          ]
      const button = h('button', {
        type: 'button',
        id: `${rootId}-i-${node.key}`,
        class: cls('g-menu__item', it.danger && 'g-menu__item--danger', expanded && 'is-expanded'),
        role,
        tabindex: -1,
        'data-key': node.key,
        'aria-disabled': it.disabled ? 'true' : undefined,
        'aria-checked': toggle ? String(Boolean(it.checked)) : undefined,
        'aria-keyshortcuts': it.keyshortcuts || undefined,
        'aria-haspopup': node.children ? 'menu' : undefined,
        'aria-expanded': node.children ? String(expanded) : undefined,
        'aria-controls': node.children ? `${rootId}-m-${node.key}` : undefined,
        onClick: (e) => activate(node, e),
        onPointerenter: (e) => onItemEnter(e, node),
        onPointerleave: onItemLeave
      }, [...(Array.isArray(content) ? content : [content]), node.children ? h(GIcon, { class: 'g-menu__chevron', name: 'chevron-right' }) : null])
      const sub = node.children && expanded
        ? h('ul', { class: 'g-menu__list', id: `${rootId}-m-${node.key}`, role: 'menu', popover: 'manual', 'aria-labelledby': `${rootId}-i-${node.key}` },
            [highlightEl(), ...node.children.map((c) => renderNode(c, `${rootId}-m-${node.key}`))])
        : null
      return h('li', { role: 'none', key: node.key }, [button, sub])
    }

    return () => {
      tree = normalize(props.items, [], null, 'i')
      const isOpen = props.modelValue
      const triggerAttrs = {
        id: triggerId,
        'aria-haspopup': 'menu',
        'aria-expanded': isOpen ? 'true' : 'false',
        'aria-controls': listId,
        ref: (el) => { triggerEl = el },
        onClick: (e) => {
          if (props.modelValue) { close(true); return }
          // Posición del clic: si la lista aparece bajo el puntero quieto, no le quita el foco al primer elemento
          if (e && e.detail > 0) lastPt = { x: e.clientX, y: e.clientY }
          requestOpen('first')
        },
        onKeydown: onTriggerKeydown
      }
      const out = []
      if (slots.trigger) out.push(...[].concat(slots.trigger({ open: isOpen, attrs: triggerAttrs })))
      else warnOnce('trigger', 'necesita el slot `trigger` (el botón que abre el menú).')
      if (isOpen || leaving.value) {
        out.push(h('ul', {
          ...attrs,
          ref: listRef,
          id: listId,
          class: cls('g-menu__list', `g-menu__list--density-${props.density}`, attrs.class),
          role: 'menu',
          popover: 'manual',
          inert: isOpen ? undefined : true,
          'aria-label': props.label || undefined,
          // Con un `id` propio en el disparador (aviso de desarrollo), la lista conserva su nombre
          'aria-labelledby': props.label ? undefined : (elementOf(triggerEl)?.id || triggerId),
          onKeydown,
          onFocusin: queueHighlights,
          onFocusout: queueHighlights,
          onPointermove: onPointer
        }, [highlightEl(), ...tree.map((n) => renderNode(n, listId))]))
      }
      return out
    }
  }
})
</script>
