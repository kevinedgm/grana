<script>
// GMenu · menú de acciones anclado a un botón de menú (dueño: bruno)
// Contrato: design/contracts/menu.md · Estructura: design/lab/menu/r01/ · Estilo: GMenu.css (coco)
// Patrón Menu Button y Menu de APG. Presenta y emite intención: `checked` viene de `items` y la aplicación lo actualiza.
// Las marcas (check, circle, chevron-right, triangle-alert) son iconos de Lucide (GIcon, docs/contract/icons.md).
import { defineComponent, h, nextTick, onBeforeUnmount, ref, useAttrs, useId, watch } from 'vue'
import { oneOf } from '../../utils/oneOf.js'
import GIcon from '../GIcon/GIcon.vue'

const isDev = typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production'
const TYPES = ['item', 'checkbox', 'radio', 'separator', 'group']
const cls = (...v) => v.filter(Boolean)

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

    // El disparador puede ser un componente (GBtn): su ref es la instancia, cuyo elemento raíz es `$el`
    const trigger = () => {
      const el = triggerEl && (triggerEl.$el ?? triggerEl)
      return typeof Element !== 'undefined' && el instanceof Element ? el : document.getElementById(triggerId)
    }
    const menus = () => (listRef.value ? [listRef.value, ...listRef.value.querySelectorAll('[role="menu"]')] : [])
    const itemsOf = (menu) => [...menu.querySelectorAll('.g-menu__item')].filter((el) => el.closest('[role="menu"]') === menu)
    const menuOf = (el) => el.closest('[role="menu"]')
    const itemByKey = (key) => listRef.value?.querySelector(`[data-key="${key}"]`)

    const focusItem = (el) => {
      if (!el) return
      itemsOf(menuOf(el)).forEach((x) => { x.tabIndex = -1 })
      el.tabIndex = 0
      el.focus()
      el.scrollIntoView?.({ block: 'nearest' })
    }

    // ---------- Posición ----------
    const place = (menu, anchor, sub) => {
      if (!menu || !anchor) return
      const scroll = menu.scrollTop
      menu.style.setProperty('--_max', '9999px')
      if (typeof menu.showPopover === 'function' && !menu.matches?.(':popover-open')) menu.showPopover()
      const a = anchor.getBoundingClientRect()
      const vw = window.innerWidth
      const vh = window.innerHeight
      const pad = 8
      const rtl = getComputedStyle(anchor).direction === 'rtl'
      const mw = menu.offsetWidth
      const nat = menu.scrollHeight + 4
      let x, y, room
      if (sub) {
        x = rtl ? a.left - mw + 4 : a.right - 4
        if (!rtl && x + mw > vw - pad) x = Math.max(pad, a.left - mw + 4)
        if (rtl && x < pad) x = Math.min(vw - pad - mw, a.right - 4)
        room = vh - 2 * pad
        const hh = Math.min(nat, room)
        y = a.top - 6
        if (y + hh > vh - pad) y = vh - pad - hh
      } else {
        const atEnd = props.align === 'end'
        const left = (rtl ? !atEnd : atEnd) ? a.right - mw : a.left
        x = Math.min(Math.max(pad, left), vw - pad - mw)
        const below = vh - a.bottom - pad - 4
        const above = a.top - pad - 4
        const preferTop = props.side === 'top' || (props.side === 'auto' && nat > below && above > below)
        if (!preferTop) { room = below; y = a.bottom + 4 } else { room = above; y = a.top - 4 - Math.min(nat, above) }
      }
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
        placeAll()
        listen()
        emit('open')
        const its = itemsOf(root)
        focusItem(pendingFocus === 'last' ? its[its.length - 1] : its[0])
        pendingFocus = 'first'
      } else {
        unlisten()
        clearTimeout(hoverTimer)
        path.value = []
        emit('closed')
        if (returnFocus) trigger()?.focus()
        returnFocus = false
      }
    }, { flush: 'post' })
    onBeforeUnmount(() => { unlisten(); clearTimeout(hoverTimer); clearTimeout(typedTimer) })

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
    const onEnter = (node) => {
      clearTimeout(hoverTimer)
      if (node.raw.disabled) return
      hoverTimer = setTimeout(() => {
        if (node.children) openSub(node, false)
        else path.value = node.path
      }, 180)
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
              : (slots.icon && it.icon !== undefined ? h('span', { class: 'g-menu__icon', 'aria-hidden': 'true' }, slots.icon({ item: it })) : null),
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
        onPointerenter: () => onEnter(node)
      }, [...(Array.isArray(content) ? content : [content]), node.children ? h(GIcon, { class: 'g-menu__chevron', name: 'chevron-right' }) : null])
      const sub = node.children && expanded
        ? h('ul', { class: 'g-menu__list', id: `${rootId}-m-${node.key}`, role: 'menu', popover: 'manual', 'aria-labelledby': `${rootId}-i-${node.key}` },
            node.children.map((c) => renderNode(c, `${rootId}-m-${node.key}`)))
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
        onClick: () => (props.modelValue ? close(true) : requestOpen('first')),
        onKeydown: onTriggerKeydown
      }
      const out = []
      if (slots.trigger) out.push(...[].concat(slots.trigger({ open: isOpen, attrs: triggerAttrs })))
      else warnOnce('trigger', 'necesita el slot `trigger` (el botón que abre el menú).')
      if (isOpen) {
        out.push(h('ul', {
          ...attrs,
          ref: listRef,
          id: listId,
          class: cls('g-menu__list', `g-menu__list--density-${props.density}`, attrs.class),
          role: 'menu',
          popover: 'manual',
          'aria-label': props.label || undefined,
          'aria-labelledby': props.label ? undefined : triggerId,
          onKeydown
        }, tree.map((n) => renderNode(n, listId))))
      }
      return out
    }
  }
})
</script>
