<script>
// GMenu · menú de acciones anclado a un botón de menú (dueño: bruno)
// Contrato: design/contracts/menu.md · Estructura: design/lab/menu/r01/ · Estilo: GMenu.css (coco)
// Patrón Menu Button y Menu de APG. Presenta y emite intención: `checked` viene de `items` y la aplicación lo actualiza.
// Las marcas (check, circle, chevron-right, triangle-alert, external-link) son iconos de Lucide (GIcon, docs/contract/icons.md).
// Elementos-enlace (menu.md «Elementos-enlace», #571 a #579; ronda design/lab/menu/r02/): `<a role="menuitem">` con
// `navigate`, marca «sale de aquí», página actual, B · pie de destino y C · varias pestañas.
import { defineComponent, h, nextTick, onBeforeUnmount, onMounted, onUpdated, ref, useAttrs, useId, watch } from 'vue'
import { oneOf } from '../../utils/oneOf.js'
import GIcon from '../GIcon/GLibIcon.js'
import GAppIcon from '../GIcon/GIcon.vue'
import { transitionMs } from '../../utils/motion.js'
import { anchorGone, followFrame, placeBlock, placeSubmenu, px, setVar, stickySide, viewport } from '../../utils/anchor.js'
import { spaceUnit } from '../GForm/formContext.js'
import { otherContext, newTab } from '../../utils/link.js'
import { acquirePageLive, announcePage } from '../../utils/liveRegion.js'

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
    labels: { type: Object, default: () => ({}) },
    id: { type: String, default: undefined }
  },
  emits: ['update:modelValue', 'select', 'navigate', 'open', 'closed'],
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
    // nodo: { key, type, raw, parent (grupo), path (claves de los submenús antecesores), children, link }
    // link (elemento-enlace, #572): { href, target, rel, current, ext (otro sitio), tab (otra pestaña), leaves }
    // `scan` reúne, por render, lo que piden los avisos E3 a E6 y la rama de la página actual (#576)
    let scan = null
    const linkOf = (raw, path, isLinkable) => {
      const href = typeof raw.href === 'string' && raw.href.trim() && raw.href
      if (href && !isLinkable) warnOnce('e1', 'ignora `href` en casilla, opción, grupo, separador o padre de submenú (E1).')
      if (!href || !isLinkable) {
        if (['target', 'rel', 'external', 'current'].some((k) => raw[k])) warnOnce('e2', 'ignora target, rel, external y current sin href (E2).')
        return null
      }
      let current = Boolean(raw.current)
      if (current && scan.current) { warnOnce('e3', 'solo el primer `current` es la página actual (E3).'); current = false }
      if (current) { scan.current = true; path.forEach((k) => scan.branch.add(k)) }
      const ext = Boolean(raw.external)
      const tab = newTab(raw.target)
      scan.ext ||= ext
      scan.tab ||= tab
      scan.solo ||= ext && !tab // otro sitio en la misma pestaña: su pie dice labels.destExternal
      scan.live ||= !raw.disabled
      return { href, target: raw.target || undefined, rel: raw.rel || undefined, current, ext, tab, leaves: ext || tab }
    }
    const normalize = (list, path, group, prefix) => {
      const out = []
      ;(list || []).forEach((raw, i) => {
        if (!raw || typeof raw !== 'object') { warnOnce('item', 'ignora un elemento inválido de `items`.'); return }
        const type = raw.type ?? 'item'
        if (!TYPES.includes(type)) { warnOnce(`type-${type}`, `ignora un elemento de tipo desconocido («${type}»).`); return }
        const key = `${prefix}${i}`
        if (type === 'separator') { linkOf(raw, path, false); out.push({ key, type, raw }); return }
        if (typeof raw.label !== 'string' || !raw.label) { warnOnce('label', 'ignora un elemento sin `label`.'); return }
        if (type === 'group') { linkOf(raw, path, false); out.push({ key, type, raw, children: normalize(raw.items, path, raw, `${key}.`) }); return }
        const isParent = Array.isArray(raw.items) && raw.items.length > 0
        // Un padre de submenú no emite `select`: su `id` es opcional
        if (!isParent && (raw.id === undefined || raw.id === null)) { warnOnce('id', 'ignora un elemento sin `id`.'); return }
        const node = { key, type, raw, parent: group, path, link: linkOf(raw, path, type === 'item' && !isParent) }
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
        paintDest(menu, active)
      }
    }
    // focusout y focusin llegan seguidos al mover el foco: se calcula una vez, ya con el foco en su sitio
    const queueHighlights = () => {
      if (hlQueued) return
      hlQueued = true
      queueMicrotask(updateHighlights)
    }
    onUpdated(queueHighlights)

    // ---------- B · pie de destino (#578) ----------
    // Último hijo de cada lista que contiene directamente un enlace que sale de la aplicación. Dice el destino del activo
    // de esa lista (el de M1), resuelto solo en el cliente y al cambiar el activo; sin enlace habilitado activo, `is-empty`
    // (el texto anterior queda, transparente: el pie no cambia de alto). Se escribe en el DOM: no vuelve a pintar el menú.
    // El texto se escribe ANTES de quitar is-empty (coco: así se ve el fundido)
    const paintDest = (menu, el) => {
      const d = menu.lastElementChild
      if (!d?.matches('.g-menu__dest')) return
      const node = el?.matches('a[href]') && nodeOf(el)
      if (!node) { d.classList.add('is-empty'); return }
      const { href, leaves, tab, ext } = node.link
      const [icon, host, path, tag] = d.children
      // Otro origen http(s): host (punycode) y ruta sin barra final; mismo origen: la ruta (o el #hash en la misma página);
      // otro esquema (mailto:, tel:…) o URL inválida: el href tal cual
      let at = ['', href]
      try {
        const u = new URL(href, document.baseURI)
        if (u.protocol.startsWith('http')) {
          at = u.origin === location.origin
            ? ['', (u.pathname === location.pathname && u.hash) || u.pathname + u.search]
            : [u.host, (u.pathname + u.search).replace(/\/$/, '')]
        }
      } catch { /* el href tal cual */ }
      host.textContent = at[0]
      path.textContent = at[1]
      tag.textContent = (tab ? props.labels.destNewTab : ext && props.labels.destExternal) || ''
      icon.replaceChildren(...(leaves ? [menu.querySelector('.g-menu__leave svg').cloneNode(true)] : []))
      d.classList.remove('is-empty')
    }

    // ---------- Posición ----------
    // Panel estable al desplazar (reporte del usuario sobre GCombobox; utils/anchor.js). Colocación completa (`place`) al
    // abrir la lista o un submenú, al cambiar `items`, en resize y al cambiar de lado: mide el alto natural (--_max a
    // 9999px), decide el lado y fija --_max. El lado de la lista principal se decide al abrir y se conserva (con `side`
    // auto, solo cambia si el actual baja de space × 40 y el otro ofrece space × 12 más). Durante el desplazamiento
    // (`follow`) solo se mueve la posición, una vez por cuadro y solo si cambia: el desfase respecto del ancla medido en la
    // colocación completa se conserva, sin volver a medir la lista. Si el disparador sale del visor, el menú se cierra.
    const GAP = 4
    const PAD = 8
    const placed = new WeakMap() // lista → { side, dx, dy } respecto del ancla
    const roomsOf = (a, vh) => ({ below: vh - a.bottom - PAD - GAP, above: a.top - PAD - GAP })
    const place = (menu, anchor, sub) => {
      if (!menu || !anchor) return
      const scroll = menu.scrollTop
      menu.style.setProperty('--_max', '9999px')
      if (typeof menu.showPopover === 'function' && !menu.matches?.(':popover-open')) menu.showPopover()
      const a = anchor.getBoundingClientRect()
      const { width: vw, height: vh } = viewport()
      const rtl = getComputedStyle(anchor).direction === 'rtl'
      const opts = { width: menu.offsetWidth, naturalHeight: menu.scrollHeight + 4, vw, vh, rtl, pad: PAD }
      let side = props.side
      const before = placed.get(menu)
      if (!sub && side === 'auto' && before) side = stickySide(before.side, { ...roomsOf(a, vh), unit: spaceUnit(menu) })
      const { x, y, room } = sub ? placeSubmenu(a, opts) : placeBlock(a, { ...opts, gap: GAP, align: props.align, side })
      const usedSide = sub ? 'bottom' : (y >= a.bottom ? 'bottom' : 'top')
      menu.dataset.side = usedSide
      menu.dataset.align = sub
        ? (x >= a.left ? 'left' : 'right')
        : (Math.abs(x - a.left) <= Math.abs(x + opts.width - a.right) ? 'left' : 'right')
      placed.set(menu, { side: usedSide, dx: x - a.left, dy: y - (sub || usedSide === 'top' ? a.top : a.bottom) })
      menu.style.setProperty('--_max', px(Math.max(96, room)))
      setVar(menu, '--_x', px(x))
      setVar(menu, '--_y', px(y))
      menu.scrollTop = scroll
    }
    // Solo la posición: el ancla se movió, la lista conserva su lado, su alto y su desfase
    const follow = (menu, anchor, sub) => {
      const at = placed.get(menu)
      if (!menu || !anchor || !at) return
      const a = anchor.getBoundingClientRect()
      if (!sub && props.side === 'auto' && stickySide(at.side, { ...roomsOf(a, viewport().height), unit: spaceUnit(menu) }) !== at.side) {
        place(menu, anchor, false) // cambia de lado: colocación completa (fija --_max)
        return
      }
      // Un submenú se ancla por arriba a su padre (placeSubmenu): el desfase cuenta desde a.top
      setVar(menu, '--_x', px(a.left + at.dx))
      setVar(menu, '--_y', px((sub || at.side === 'top' ? a.top : a.bottom) + at.dy))
    }
    const each = (fn) => {
      const root = listRef.value
      if (!root) return
      fn(root, trigger(), false)
      root.querySelectorAll('[role="menu"]').forEach((m) => {
        const parent = document.getElementById(m.getAttribute('aria-labelledby'))
        if (parent) fn(m, parent, true)
      })
    }
    const placeAll = () => each(place)
    // Fuera del visor (o de su contenedor con desplazamiento), el menú se cierra sin devolver el foco
    const followAll = followFrame((scroller) => {
      if (!props.modelValue) return
      if (anchorGone(trigger(), scroller)) { close(false); return }
      each(follow)
    })
    const onResize = () => { if (props.modelValue) placeAll() }
    const onScroll = (e) => {
      if (!props.modelValue || (e && e.target && e.target.nodeType === 1 && listRef.value?.contains(e.target))) return
      followAll.schedule(e && e.target)
    }
    // Contenido nuevo con el menú abierto: colocación completa (el lado se conserva)
    watch(() => props.items, () => { if (props.modelValue && listRef.value) nextTick(placeAll) }, { flush: 'post' })

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
      window.addEventListener('blur', offMod)
      window.addEventListener('resize', onResize)
      window.addEventListener('scroll', onScroll, true)
    }
    const unlisten = () => {
      if (!listening) return
      listening = false
      document.removeEventListener('pointerdown', onOutside, true)
      window.removeEventListener('blur', offMod)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scroll', onScroll, true)
      followAll.cancel()
    }
    function close(focusTrigger) {
      if (!props.modelValue) return
      setMod(false)
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
        placed.delete(root) // reabierto durante la salida: el lado se decide de nuevo
        placeAll()
        listen()
        // Canal cortés de página para los anuncios de C (#533): existe antes del primer gesto
        if (!releaseLive && (hasPair('opened') || hasPair('copied'))) releaseLive = acquirePageLive()
        emit('open')
        const its = itemsOf(root)
        focusItem(pendingFocus === 'last' ? its[its.length - 1] : its[0])
        pendingFocus = 'first'
      } else {
        unlisten()
        clearTimeout(hoverTimer)
        resetPointer()
        setMod(false)
        if (Object.keys(traces.value).length) traces.value = {}
        path.value = []
        emit('closed')
        if (returnFocus) trigger()?.focus()
        returnFocus = false
      }
    }, { flush: 'post' })
    onBeforeUnmount(() => { if (releaseLive) releaseLive(); unlisten(); clearTimeout(hoverTimer); clearTimeout(holdTimer); clearTimeout(typedTimer); clearTimeout(leaveTimer) })

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
    // ---------- Elementos-enlace: navigate (#573, #574) y C · varias pestañas (#577) ----------
    // Textos de `labels` (sin valores por defecto, #226); los de anuncio admiten {label} o una función ({ label, item })
    const say = (k, { raw }) => {
      const v = props.labels[k]
      return typeof v === 'function' ? v({ label: raw.label, item: raw }) : String(v).replace('{label}', raw.label)
    }
    // C solo con sus dos textos (visible y anuncio); sin ellos, el gesto cae al comportamiento nativo (E6)
    const hasPair = (k) => Boolean(props.labels[k] && props.labels[`${k}Live`])
    const traces = ref({}) // clave del elemento → huella visible («Abierta», «Enlace copiado»); se vacía al cerrar
    const trace = (node, k) => {
      traces.value = { ...traces.value, [node.key]: say(k, node) }
      announcePage(say(`${k}Live`, node))
    }
    const isMod = (e) => e.ctrlKey || e.metaKey
    // Clic, Intro y Espacio (clic sintético) llegan por `click`; el clic central, por `auxclick` (botón 1)
    const onLink = (node, e) => {
      if (node.raw.disabled) { e.preventDefault(); return }
      const bg = isMod(e) || e.button === 1
      // Guarda común (api.md «Enlaces y navigate»): clic primario o Intro/Espacio sin modificadores, sin cancelar y sin
      // `target` de otro contexto. preventDefault() en navigate = «navego yo»: no impide el cierre
      if (e.button === 0 && !bg && !e.shiftKey && !e.altKey && !e.defaultPrevented && !otherContext(node.link.target)) {
        emit('navigate', { id: node.raw.id, item: node.raw, event: e })
        if (shouldClose('item')) close(true)
        return
      }
      // Lo hace el navegador: Ctrl/⌘ (pestaña en segundo plano) deja el menú abierto con huella (C); Mayús y Alt cierran
      if (bg && hasPair('opened')) { trace(node, 'opened'); return }
      if (bg || e.shiftKey || e.altKey || shouldClose('item')) close(true)
    }
    // Vista previa del modificador (C): con Ctrl/⌘ pulsado, cada lista abierta lleva is-modifier
    let modOn = false
    const setMod = (on) => {
      on = on && hasPair('opened')
      if (on === modOn) return
      modOn = on
      for (const m of menus()) m.classList.toggle('is-modifier', on)
    }
    const offMod = () => setMod(false)
    let releaseLive = null

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
      setMod(isMod(e))
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
      if (e.key === 'Control' || e.key === 'Meta') { setMod(true); return }
      const el = e.target.closest?.('.g-menu__item')
      const menu = el && menuOf(el)
      if (!el || !menu) return
      // El teclado manda: la espera pendiente del puntero (HOVER_MS, o la de la diagonal) ya no aplica. Si venciera
      // después, abriría o cerraría submenús por un elemento sobre el que el puntero solo se quedó quieto.
      clearTimeout(hoverTimer); clearTimeout(holdTimer); holdTimer = null; holdEl = null
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
      if (node?.link) {
        const mod = isMod(e)
        // Espacio no activa un <a> y desplazaría la página: se cancela y, sin modificadores, es un clic primario (L9)
        if (k === ' ') {
          e.preventDefault()
          if (!node.raw.disabled && !mod && !e.shiftKey && !e.altKey) el.click()
          return
        }
        // Ctrl/⌘+C copia la URL absoluta (C), sin texto seleccionado y con portapapeles; si no, la tecla sigue su curso
        const cb = typeof navigator !== 'undefined' && navigator.clipboard
        if (mod && !e.shiftKey && !e.altKey && k.toLowerCase() === 'c' && !node.raw.disabled && hasPair('copied') && cb && !String(window.getSelection?.() || '')) {
          e.preventDefault()
          Promise.resolve()
            .then(() => cb.writeText(new URL(node.link.href, document.baseURI).href))
            .then(() => trace(node, 'copied'), () => warnOnce('e7', 'navigator.clipboard.writeText se rechazó (E7).'))
          return
        }
      }
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
    // B: el pie de destino, último hijo de una lista con algún enlace que sale de la aplicación (su contenido, paintDest)
    const leavesIn = (nodes) => nodes.some((n) => n.link?.leaves || (n.type === 'group' && leavesIn(n.children)))
    const destEl = (nodes) => (leavesIn(nodes)
      ? h('li', { class: 'g-menu__dest is-empty', role: 'none', 'aria-hidden': 'true', key: 'g-dest' },
[
          h('span', { class: 'g-menu__dest-icon' }),
          h('span', { class: 'g-menu__dest-host', dir: 'ltr' }),
          h('span', { class: 'g-menu__dest-path', dir: 'ltr' }),
          h('span', { class: 'g-menu__dest-tag' })
        ])
      : null)
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
      const lk = node.link
      const expanded = path.value.includes(node.key)
      // Texto oculto dentro del nombre (L8): labels.external y labels.newTab tal cual, sin puntuación añadida
      const sr = lk && [lk.ext && props.labels.external, lk.tab && props.labels.newTab].filter((t) => typeof t === 'string').join('')
      const srEl = sr ? h('span', { class: 'g-menu__sr' }, sr) : null
      const role = node.type === 'checkbox' ? 'menuitemcheckbox' : node.type === 'radio' ? 'menuitemradio' : 'menuitem'
      const toggle = node.type === 'checkbox' || node.type === 'radio'
      const content = slots.item
        ? [slots.item({ item: it, active: false, checked: Boolean(it.checked) }), srEl]
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
            srEl,
            it.shortcut ? h('span', { class: 'g-menu__shortcut', 'aria-hidden': 'true' }, it.shortcut) : null
          ]
      // Enlace (#572): sin href, target ni rel si está deshabilitado (no se abre aparte ni se copia); huella y marca al final
      const on = !it.disabled
      const button = h(lk ? 'a' : 'button', {
        ...(lk
          ? { href: on ? lk.href : undefined, target: on ? lk.target : undefined, rel: on ? lk.rel : undefined, 'aria-current': lk.current ? 'page' : undefined, onAuxclick: (e) => e.button === 1 && onLink(node, e) }
          : { type: 'button' }),
        id: `${rootId}-i-${node.key}`,
        class: cls('g-menu__item', it.danger && 'g-menu__item--danger', expanded && 'is-expanded', node.children && scan.branch.has(node.key) && 'is-branch'),
        role,
        tabindex: -1,
        'data-key': node.key,
        'aria-disabled': it.disabled ? 'true' : undefined,
        'aria-checked': toggle ? String(Boolean(it.checked)) : undefined,
        'aria-keyshortcuts': it.keyshortcuts || undefined,
        'aria-haspopup': node.children ? 'menu' : undefined,
        'aria-expanded': node.children ? String(expanded) : undefined,
        'aria-controls': node.children ? `${rootId}-m-${node.key}` : undefined,
        onClick: (e) => (lk ? onLink(node, e) : activate(node, e)),
        onPointerenter: (e) => onItemEnter(e, node),
        onPointerleave: onItemLeave
      }, [
        ...content,
        lk ? h('span', { class: 'g-menu__trace', 'aria-hidden': 'true' }, traces.value[node.key] || '') : null,
        lk?.leaves ? h('span', { class: 'g-menu__leave', 'aria-hidden': 'true' }, [h(GIcon, { name: 'external-link' })]) : null,
        node.children ? h(GIcon, { class: 'g-menu__chevron', name: 'chevron-right' }) : null
      ])
      const sub = node.children && expanded
        ? h('ul', { class: 'g-menu__list', id: `${rootId}-m-${node.key}`, role: 'menu', popover: 'manual', 'aria-labelledby': `${rootId}-i-${node.key}` },
            [highlightEl(), ...node.children.map((c) => renderNode(c, `${rootId}-m-${node.key}`)), destEl(node.children)])
        : null
      return h('li', { role: 'none', key: node.key }, [button, sub])
    }

    return () => {
      scan = { branch: new Set() }
      tree = normalize(props.items, [], null, 'i')
      const L = props.labels
      if ((scan.ext && !L.external) || (scan.tab && !L.newTab)) warnOnce('e4', 'falta labels.external o labels.newTab (E4).')
      if ((scan.solo && !L.destExternal) || (scan.tab && !L.destNewTab)) warnOnce('e5', 'falta labels.destExternal o labels.destNewTab (E5).')
      if (scan.live && !(hasPair('opened') && hasPair('copied'))) warnOnce('e6', 'falta labels.opened/openedLive o copied/copiedLive: ese gesto queda en el del navegador (E6).')
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
          onKeyup: (e) => { if (e.key === 'Control' || e.key === 'Meta') setMod(false) },
          onFocusin: queueHighlights,
          onFocusout: queueHighlights,
          onPointermove: onPointer
        }, [highlightEl(), ...tree.map((n) => renderNode(n, listId)), destEl(tree)]))
      }
      return out
    }
  }
})
</script>
