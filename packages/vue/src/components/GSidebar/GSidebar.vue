<script>
// GSidebar · navegación lateral que se transforma: expandida, riel, navbar inferior y drawer (dueño: bruno)
// Contrato: design/contracts/sidebar.md · Estructura: design/lab/sidebar/r01/ · Estilo: GSidebar.css (coco)
// Patrón: disclosure navigation (WAI-ARIA APG). Un solo estado de navegación (destino actual y ramas abiertas)
// compartido por los cuatro formatos. La raíz de cada formato es estable: al contraer, expandir, navegar o abrir un
// submenú solo se alternan clases y atributos sobre el mismo DOM (así corren las transiciones de coco).
// Pista del riel (#436, cierra #113): motor de GTooltip en modo visual (utils/visualTip.js, tooltip.md §«Modo visual»).
import { Fragment, computed, defineComponent, h, nextTick, onBeforeUnmount, onMounted, ref, useAttrs, useId, useSlots, watch } from 'vue'
import { oneOf } from '../../utils/oneOf.js'
import GIcon from '../GIcon/GLibIcon.js'
import GAppIcon from '../GIcon/GIcon.vue'
import { useVisualTips } from '../../utils/visualTip.js'
// Activación primaria de un enlace (#505): botón principal, sin modificadores y sin cancelar (Intro llega como clic primario)
const primaryActivation = (e) => e.button === 0 && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey && !e.defaultPrevented

const isDev = typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production'
const COLORS = ['brand', 'accent', 'neutral', 'success', 'warning', 'danger', 'info']

export default defineComponent({
  name: 'GSidebar',
  inheritAttrs: false,
  props: {
    items: { type: Array, default: () => [] },
    modelValue: { type: [String, Number], default: null },
    label: { type: String, default: undefined },
    mode: { type: String, default: 'auto', validator: oneOf(['auto', 'expanded', 'rail', 'navbar', 'drawer']) },
    mobile: { type: String, default: 'navbar', validator: oneOf(['navbar', 'drawer']) },
    collapsed: Boolean,
    open: Boolean,
    container: { type: [String, Object], default: undefined },
    contained: Boolean,
    variant: { type: String, default: 'fixed', validator: oneOf(['fixed', 'floating']) },
    overlay: Boolean,
    barCount: { type: Number, default: 4, validator: (v) => v === 3 || v === 4 || v === 5 },
    search: Boolean,
    closeOnNavigate: { type: Boolean, default: true },
    color: { type: String, default: 'brand', validator: oneOf(COLORS) },
    density: { type: String, default: 'default', validator: oneOf(['default', 'comfortable', 'compact']) },
    labels: { type: Object, default: () => ({}) }
  },
  // Solo estos eventos se declaran: el resto llega a la raíz por $attrs.
  emits: ['update:modelValue', 'update:collapsed', 'update:open', 'navigate', 'mode-change', 'search'],
  setup(props, { emit, expose }) {
    const attrs = useAttrs()
    const slots = useSlots()
    const uid = useId()
    const baseId = `g-sidebar-${uid}`
    const L = computed(() => props.labels || {})

    const warned = new Set()
    const warnOnce = (key, msg) => {
      if (!isDev || warned.has(key)) return
      warned.add(key)
      console.warn(`[Grana] <GSidebar> ${msg}`)
    }

    // ---------- Modelo de items ----------
    const model = computed(() => {
      const seen = new Set()
      const mk = (raw, level) => {
        if (!raw || typeof raw !== 'object' || raw.id === undefined || raw.id === null || typeof raw.label !== 'string') {
          warnOnce('bad-item', 'un item sin id o sin label se ignora.')
          return null
        }
        if (seen.has(raw.id)) warnOnce(`dup-${raw.id}`, `hay dos items con el mismo id (${String(raw.id)}).`)
        seen.add(raw.id)
        if ((raw.badge !== undefined || raw.dot) && !raw.badgeLabel) warnOnce(`badge-${raw.id}`, `el item «${raw.id}» tiene badge o dot sin badgeLabel (texto para lectores).`)
        const item = { id: raw.id, label: raw.label, href: raw.href, icon: raw.icon, badge: raw.badge, badgeLabel: raw.badgeLabel, dot: Boolean(raw.dot), disabled: Boolean(raw.disabled), primary: Boolean(raw.primary), raw, level, children: [] }
        if (level === 0 && Array.isArray(raw.children)) {
          item.children = raw.children.map((c) => {
            if (c && Array.isArray(c.children) && c.children.length) warnOnce('grandchildren', 'los nietos se ignoran: solo hay un nivel de hijos.')
            return mk(c, 1)
          }).filter(Boolean)
        }
        return item
      }
      const groups = []
      let loose = null
      props.items.forEach((el, i) => {
        if (el && Array.isArray(el.items)) {
          loose = null
          groups.push({ key: `g${i}`, label: typeof el.label === 'string' ? el.label : undefined, items: el.items.map((x) => mk(x, 0)).filter(Boolean) })
        } else {
          const it = mk(el, 0)
          if (!it) return
          if (!loose) { loose = { key: `g${i}`, label: undefined, items: [] }; groups.push(loose) }
          loose.items.push(it)
        }
      })
      return groups
    })
    const topItems = computed(() => model.value.flatMap((g) => g.items))
    const findItem = (id) => {
      for (const it of topItems.value) {
        if (it.id === id) return it
        const c = it.children.find((x) => x.id === id)
        if (c) return c
      }
      return null
    }
    const branchOf = (id) => topItems.value.find((it) => it.children.some((c) => c.id === id)) || null
    const topOf = (id) => topItems.value.find((it) => it.id === id || it.children.some((c) => c.id === id)) || null

    // ---------- Formato: por el ancho del contenedor ----------
    const rootEl = ref(null)
    const containerW = ref(null)
    const unit = ref(4)
    let ro = null
    let containerEl = null
    const klass = computed(() => {
      if (containerW.value === null) return 'expanded'
      const w = containerW.value
      if (w >= unit.value * 240) return 'expanded'
      if (w >= unit.value * 150) return 'rail'
      return 'mobile'
    })
    const base = computed(() => (props.mode === 'auto' ? (klass.value === 'mobile' ? props.mobile : klass.value) : props.mode))
    const manual = ref(props.collapsed ? 'rail' : null)
    const format = computed(() => (base.value === 'expanded' || base.value === 'rail' ? (manual.value || base.value) : base.value))
    const overlayOn = computed(() => props.overlay && base.value === 'rail' && format.value === 'expanded')
    const collapsedNow = computed(() => format.value === 'rail')

    // Un cambio de clase de ancho (solo en `auto`) o de `mode` descarta la elección manual
watch(klass, () => { if (props.mode === 'auto') manual.value = null })
    watch(() => props.mode, () => { manual.value = null })
    watch(() => props.collapsed, (v) => {
      if (base.value !== 'expanded' && base.value !== 'rail') return
      const want = v ? 'rail' : 'expanded'
      if (format.value !== want) manual.value = want
    })

    const measureUnit = () => {
      if (typeof getComputedStyle === 'undefined' || !rootEl.value) return
      const v = getComputedStyle(rootEl.value).getPropertyValue('--g-space-1').trim()
      const n = parseFloat(v)
      if (!n) return
      unit.value = v.endsWith('rem') ? n * (parseFloat(getComputedStyle(document.documentElement).fontSize) || 16) : n
    }
    const resolveContainer = () => {
      const c = props.container
      if (c && typeof c === 'string') return document.querySelector(c)
      if (c && typeof c === 'object') return c
      return rootEl.value?.parentElement || null
    }
    const measure = () => {
      if (!containerEl) return
      measureUnit()
      containerW.value = containerEl.getBoundingClientRect().width
    }
    const observe = () => {
      ro?.disconnect()
      containerEl = resolveContainer()
      if (!containerEl) return
      measure()
      if (typeof ResizeObserver !== 'undefined') {
        ro = new ResizeObserver(() => measure())
        ro.observe(containerEl)
      }
    }
    watch(() => props.container, () => nextTick(observe))
    watch([format, overlayOn], ([f, o]) => emit('mode-change', { mode: f, overlay: o }))

    // ---------- Estado de navegación compartido ----------
    const openIds = ref([])
    const openSet = computed(() => new Set(openIds.value))
    const ensureOpen = (id) => { if (id !== undefined && id !== null && !openIds.value.includes(id)) openIds.value = [...openIds.value, id] }
    const syncBranch = () => { const b = branchOf(props.modelValue); if (b) ensureOpen(b.id) }
    watch(() => props.modelValue, syncBranch)
    syncBranch()
    const toggleOpen = (id) => { openIds.value = openIds.value.includes(id) ? openIds.value.filter((x) => x !== id) : [...openIds.value, id] }

    // ---------- Drawer ----------
    const drawer = ref(props.open)
    const dlgRef = ref(null)
    let opener = null
    watch(() => props.open, (v) => { drawer.value = v })
    const setDrawer = (v, from = null) => {
      if (v && from) opener = from
      if (drawer.value === v) return
      drawer.value = v
      emit('update:open', v)
    }
    const applyDrawer = () => {
      const d = dlgRef.value
      if (!d) return
      if (drawer.value && !d.open && typeof d.showModal === 'function') d.showModal()
      else if (!drawer.value && d.open && typeof d.close === 'function') d.close()
    }
    watch(drawer, () => nextTick(applyDrawer), { flush: 'post' })
    const onDialogClose = () => {
      if (drawer.value) { drawer.value = false; emit('update:open', false) }
      const o = opener
      opener = null
      if (o && o.isConnected && typeof o.focus === 'function') o.focus()
    }
    const onDialogClick = (e) => { if (e.target === dlgRef.value) setDrawer(false) }

    // ---------- Navegar ----------
    // Devuelve true si la navegación sigue en esta página (para cerrar el menú flotante)
    const navigateTo = (item, event) => {
      if (item.disabled) { event.preventDefault(); return false }
      // Un enlace con Ctrl/⌘/Mayús/Alt, otro botón o ya cancelado (#505, api.md «Enlaces y navigate»): el navegador abre la
      // pestaña o ventana nueva por su cuenta; no se emite ni cambia el elemento actual. Un elemento sin href (botón), igual
      if (item.href && !primaryActivation(event)) return false
      emit('navigate', { item: item.raw, event })
      if (event.defaultPrevented) return false
      const wasDrawer = drawer.value
      emit('update:modelValue', item.id)
      if (wasDrawer && props.closeOnNavigate) setDrawer(false)
      return true
    }

    // ---------- Pista del riel (sidebar.md §«Pista del riel», #436) ----------
    // Un nodo por control del riel (items de primer nivel, padres incluidos, búsqueda y contraer/expandir), al final de la
    // raíz; existen en expandida y en riel (misma raíz) y solo se activan en el riel. Lado: derecha lógica.
    const SEARCH_TIP = 'search'
    const TOGGLE_TIP = 'toggle'
    const itemTip = (item) => `i:${String(item.id)}`
    const tips = useVisualTips({
      find(key) {
        const root = rootEl.value
        if (!root || root.hidden) return null
        if (key === SEARCH_TIP) { const b = root.querySelector(':scope > .g-sidebar__head .g-sidebar__search'); return b ? { ctrl: b } : null }
        if (key === TOGGLE_TIP) { const b = root.querySelector(':scope > .g-sidebar__head .g-sidebar__toggle'); return b ? { ctrl: b } : null }
        const el = [...root.querySelectorAll(':scope > .g-sidebar__nav .g-sidebar__item > .g-sidebar__link')].find((x) => `i:${x.dataset.id}` === key)
        return el ? { ctrl: el } : null
      },
      disabled: () => format.value !== 'rail',
      placement: () => 'right'
    })

    // ---------- Panel flotante (riel) ----------
    const flyEl = ref(null)
    const flyItem = ref(null)
    const flyOpen = ref(false)
    let flyBtn = null
    let flyPinned = false
    let hoverT = null
    let leaveT = null
    let outsideHandler = null
    const dirOf = (el) => (getComputedStyle(el).direction === 'rtl')

    const placeFly = (el) => {
      const f = flyEl.value
      if (!f || !el) return
      const r = el.getBoundingClientRect()
      const rtl = dirOf(el)
      const vw = document.documentElement.clientWidth || window.innerWidth
      const vh = window.innerHeight
      f.style.setProperty('--_max', 'none')
      const top = Math.max(8, Math.min(r.top - 6, vh - f.offsetHeight - 8))
      f.style.setProperty('--_x', `${rtl ? vw - (r.left - 4) : r.right + 4}px`)
      f.style.setProperty('--_top', `${top}px`)
      f.style.setProperty('--_bottom', 'auto')
      f.style.setProperty('--_max', `${Math.max(vh - top - 8, 0)}px`)
      f.style.setProperty('--_notch', `${r.top + r.height / 2 - top - 5}px`)
    }
    const closeFly = (returnFocus = false) => {
      clearTimeout(hoverT)
      clearTimeout(leaveT)
      const f = flyEl.value
      const btn = flyBtn
      if (f && typeof f.hidePopover === 'function' && f.matches?.(':popover-open')) f.hidePopover()
      flyOpen.value = false
      flyPinned = false
      if (outsideHandler) { document.removeEventListener('pointerdown', outsideHandler); outsideHandler = null }
      if (btn) { btn.setAttribute('aria-expanded', 'false') }
      flyBtn = null
      tips.check()
      if (returnFocus && btn && typeof btn.focus === 'function') btn.focus()
    }
    const openFly = async (item, btn, byKey) => {
      if (format.value !== 'rail') return
      closeFly()
      flyItem.value = item
      flyBtn = btn
      flyPinned = byKey
      flyOpen.value = true
      btn.setAttribute('aria-expanded', 'true')
      // La pista del padre se cierra al abrirse su panel (aria-expanded="true")
      tips.check()
      await nextTick()
      const f = flyEl.value
      if (!f) return
      if (typeof f.showPopover === 'function') f.showPopover()
      placeFly(btn)
      outsideHandler = (ev) => {
        if (f.contains(ev.target) || (flyBtn && flyBtn.contains(ev.target))) return
        closeFly()
      }
      document.addEventListener('pointerdown', outsideHandler)
      if (byKey) (f.querySelector('[aria-current]') || f.querySelector('a, button'))?.focus()
    }
    // El panel por puntero: solo ratón o lápiz (una pulsación larga táctil sobre un padre muestra su pista y no abre el panel)
    const onLinkEnter = (item, e) => {
      if (format.value !== 'rail' || e.pointerType === 'touch') return
      clearTimeout(leaveT)
      const btn = e.currentTarget
      if (item.children.length) {
        clearTimeout(hoverT)
        hoverT = setTimeout(() => openFly(item, btn, false), 150)
      }
    }
    const onLinkLeave = (e) => {
      if (e && e.pointerType === 'touch') return
      clearTimeout(hoverT)
      if (flyOpen.value) {
        clearTimeout(leaveT)
        leaveT = setTimeout(() => { if (!flyPinned) closeFly() }, 220)
      }
    }
    const onFlyKeydown = (e) => {
      const f = flyEl.value
      if (!f) return
      const links = [...f.querySelectorAll('a, button')].filter((x) => x.getAttribute('aria-disabled') !== 'true')
      const i = links.indexOf(document.activeElement)
      const k = e.key
      // Un Esc que ya cerró una pista (motor, en captura) no cierra además el panel
      if (k === 'Escape' && e.defaultPrevented) return
      if (k === 'Escape' || k === 'ArrowLeft') {
        // Esc cierra solo el panel: no debe llegar a un GDialog ni a otro ancestro
        e.preventDefault()
        e.stopPropagation()
        closeFly(true)
      } else if (k === 'ArrowDown') { e.preventDefault(); links[Math.min(links.length - 1, i + 1)]?.focus() }
      else if (k === 'ArrowUp') { e.preventDefault(); links[Math.max(0, i - 1)]?.focus() }
      else if (k === 'Home') { e.preventDefault(); links[0]?.focus() }
      else if (k === 'End') { e.preventDefault(); links[links.length - 1]?.focus() }
    }
    const onFlyFocusout = (e) => {
      const r = e.relatedTarget
      const f = flyEl.value
      if (r && f && !f.contains(r) && r !== flyBtn) closeFly()
    }
    // Al salir del riel se cierran el panel y la pista abierta
    watch(format, (f) => { if (f !== 'rail') { closeFly(); tips.hide() } })

    // ---------- Teclado en la región de navegación ----------
    const onNavKeydown = (e) => {
      const link = e.target.closest?.('.g-sidebar__link')
      if (!link) return
      const k = e.key
      if (k === 'ArrowRight' && format.value === 'rail' && link.classList.contains('g-sidebar__parent')) {
        e.preventDefault()
        const item = topItems.value.find((x) => String(x.id) === link.dataset.id)
        if (item) openFly(item, link, true)
        return
      }
      if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(k)) return
      const nav = e.currentTarget
      const all = [...nav.querySelectorAll('.g-sidebar__link')].filter((x) => x.getAttribute('aria-disabled') !== 'true' && !x.closest('[inert]') && !x.closest('.g-sidebar__fly'))
      const i = all.indexOf(link)
      const n = k === 'ArrowDown' ? i + 1 : k === 'ArrowUp' ? i - 1 : k === 'Home' ? 0 : all.length - 1
      e.preventDefault()
      all[Math.max(0, Math.min(all.length - 1, n))]?.focus()
    }
    const onBarKeydown = (e) => {
      const k = e.key
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(k)) return
      const all = [...e.currentTarget.querySelectorAll('.g-sidebar__tab')]
      const i = all.indexOf(document.activeElement)
      if (i < 0) return
      const rtl = dirOf(e.currentTarget)
      const d = k === 'ArrowRight' ? (rtl ? -1 : 1) : k === 'ArrowLeft' ? (rtl ? 1 : -1) : 0
      e.preventDefault()
      all[k === 'Home' ? 0 : k === 'End' ? all.length - 1 : Math.max(0, Math.min(all.length - 1, i + d))]?.focus()
    }

    // ---------- Navbar ----------
    const barItems = computed(() => {
      const flagged = topItems.value.filter((i) => i.primary)
      const pool = flagged.length ? flagged : topItems.value.filter((i) => !i.disabled)
      return pool.slice(0, props.barCount)
    })
    const entering = ref(false)
    let enterT = null
    watch(format, (f, old) => {
      if (f === 'navbar' && old !== 'navbar') {
        entering.value = true
        clearTimeout(enterT)
        enterT = setTimeout(() => { entering.value = false }, 600)
      }
    })

    // is-ready: dos cuadros después de montar; las entradas de coco (insignias) solo existen con él
    const ready = ref(false)
    let unmountedFlag = false
    // is-expanding: al pasar de riel a expandida ya montada; las etiquetas entran solo entonces (no al cargar)
    const expanding = ref(false)
    let expandT = null
    watch(format, (f, old) => {
      if (ready.value && f === 'expanded' && old === 'rail') {
        expanding.value = true
        clearTimeout(expandT)
        expandT = setTimeout(() => { expanding.value = false }, 600)
      }
    })

    // ---------- Contraer y expandir ----------
    const toggleCollapsed = () => {
      const to = format.value === 'rail' ? 'expanded' : 'rail'
      manual.value = to
      emit('update:collapsed', to === 'rail')
    }

    // ---------- Ciclo de vida ----------
    onMounted(() => {
      observe()
      emit('mode-change', { mode: format.value, overlay: overlayOn.value })
      applyDrawer()
      const raf = typeof requestAnimationFrame === 'function' ? requestAnimationFrame : (fn) => setTimeout(fn, 16)
      raf(() => raf(() => { if (!unmountedFlag) ready.value = true }))
    })
    onBeforeUnmount(() => {
      unmountedFlag = true
      clearTimeout(expandT)
      ro?.disconnect()
      closeFly()
      clearTimeout(enterT)
      if (drawer.value && dlgRef.value?.open) dlgRef.value.close()
    })

    // ---------- Avisos de desarrollo ----------
    if (isDev) {
      if (!props.label && !attrs['aria-label'] && !attrs['aria-labelledby']) warnOnce('label', 'necesita label (nombre accesible del <nav>).')
      const l = props.labels || {}
      if (!l.collapse || !l.expand) warnOnce('toggle', 'necesita labels.collapse y labels.expand (nombre del botón de contraer y expandir).')
      if (!l.drawer) warnOnce('drawer', 'necesita labels.drawer (nombre accesible del drawer).')
      if (!l.more) warnOnce('more', 'necesita labels.more (texto del botón «Más» del navbar).')
      if (props.search && !l.search && !slots.search) warnOnce('search', 'con search necesita labels.search.')
    }

    // ---------- Render ----------
    const cls = (...a) => a.filter(Boolean).join(' ')
    // Con slot `icon`, manda el slot; sin él, un `icon` cadena dibuja GIcon con ese nombre (#202; solo primer nivel)
    const iconNode = (item) => (slots.icon
      ? slots.icon({ item: item.raw })
      : (item.level === 0 && typeof item.icon === 'string' && item.icon !== '' ? [h(GAppIcon, { name: item.icon })] : null))
    const badgeNodes = (item) => {
      const out = []
      if (item.badge !== undefined && item.badge !== null) out.push(h('span', { class: 'g-sidebar__badge', 'aria-hidden': 'true' }, String(item.badge)))
      else if (item.dot) out.push(h(GIcon, { class: 'g-sidebar__badge g-sidebar__badge--dot', name: 'circle', filled: true }))
      if (item.badgeLabel) out.push(h('span', { class: 'g-sidebar__sr' }, `, ${item.badgeLabel}`))
      return out
    }
    const isCurrent = (item) => props.modelValue !== null && props.modelValue !== undefined && props.modelValue === item.id
    const isBranch = (item) => item.children.some((c) => c.id === props.modelValue)

    const renderLink = (item, level, kind) => {
      const rail = kind === 'side' && format.value === 'rail'
      const cur = isCurrent(item)
      const content = slots.item
        ? [slots.item({ item: item.raw, active: cur, collapsed: rail, level })]
        : [
            level === 0 ? h('span', { class: 'g-sidebar__icon', 'aria-hidden': 'true' }, iconNode(item)) : null,
            h('span', { class: 'g-sidebar__label' }, item.label),
            ...badgeNodes(item)
          ]
      // El panel por puntero solo aplica a los items del riel (no a los del panel ni a los del drawer); la pista, a los de
      // primer nivel en la navegación en línea (#436)
      const events = kind === 'side'
        ? { onPointerenter: (e) => onLinkEnter(item, e), onPointerleave: onLinkLeave }
        : {}
      const tip = kind === 'side' && level === 0 ? { 'data-g-tooltip': '' } : {}
      if (item.children.length) {
        const branch = isBranch(item)
        const expanded = rail ? flyOpen.value && flyItem.value?.id === item.id : openSet.value.has(item.id)
        return h('button', {
          type: 'button',
          class: cls('g-sidebar__link g-sidebar__parent', branch && 'is-branch'),
          'data-id': String(item.id),
          'aria-expanded': expanded ? 'true' : 'false',
          'aria-controls': rail ? undefined : `${baseId}-${kind}-${item.id}`,
          'aria-haspopup': rail ? 'true' : undefined,
          ...tip,
          ...events,
          onClick: (e) => {
            e.preventDefault()
            if (rail) {
              if (flyOpen.value && flyItem.value?.id === item.id) closeFly(true)
              else openFly(item, e.currentTarget, true)
            } else toggleOpen(item.id)
          }
        }, [
          level === 0 ? h('span', { class: 'g-sidebar__icon', 'aria-hidden': 'true' }, iconNode(item)) : null,
          h('span', { class: 'g-sidebar__label' }, item.label),
          h(GIcon, { class: 'g-sidebar__chevron', name: 'chevron-right' })
        ])
      }
      if (item.disabled) {
        return h('a', { class: 'g-sidebar__link', role: 'link', 'aria-disabled': 'true', 'data-id': String(item.id), ...tip }, content)
      }
      const common = {
        class: cls('g-sidebar__link', cur && 'is-active'),
        'data-id': String(item.id),
        'aria-current': cur ? 'page' : undefined,
        ...tip,
        ...events,
        onClick: (e) => {
          if (navigateTo(item, e) && kind === 'fly') closeFly()
        }
      }
      if (item.href) return h('a', { ...common, href: item.href }, content)
      return h('button', { ...common, type: 'button' }, content)
    }

    const renderGroups = (kind) => model.value.map((g) => {
      const titleId = `${baseId}-${kind}-${g.key}`
      const list = h('ul', { class: 'g-sidebar__list', 'aria-labelledby': g.label ? titleId : undefined }, g.items.map((item) => {
        const children = item.children.length
          ? h('ul', {
              class: cls('g-sidebar__sub', kind === 'side' && format.value === 'rail' ? '' : openSet.value.has(item.id) && 'is-open'),
              id: `${baseId}-${kind}-${item.id}`,
              inert: kind === 'side' && format.value === 'rail' ? '' : !openSet.value.has(item.id) ? '' : undefined
            }, item.children.map((c) => h('li', { key: c.id }, [renderLink(c, 1, kind)])))
          : null
        return h('li', { class: 'g-sidebar__item', key: item.id }, [renderLink(item, 0, kind), children])
      }))
      return h('li', { class: 'g-sidebar__group', role: 'presentation', key: g.key }, [
        g.label ? h('span', { class: 'g-sidebar__group-title', id: titleId }, g.label) : null,
        list
      ])
    })

    const renderHead = (kind) => {
      const rail = kind === 'side' && format.value === 'rail'
      const scope = { collapsed: rail }
      const top = h('div', { class: 'g-sidebar__top' }, [
        h('div', { class: 'g-sidebar__logo' }, slots.logo ? slots.logo(scope) : null),
        kind === 'side'
          ? h('button', {
              type: 'button',
              class: 'g-sidebar__toggle',
              'aria-expanded': rail ? 'false' : 'true',
              'aria-label': rail ? L.value.expand : L.value.collapse,
              'data-g-tooltip': '',
              onClick: toggleCollapsed
            }, slots['toggle-icon'] ? slots['toggle-icon'](scope) : null)
          : (L.value.close
              ? h('button', { type: 'button', class: 'g-sidebar__toggle', 'aria-label': L.value.close, onClick: () => setDrawer(false) }, [h(GIcon, { name: 'x' })])
              : null)
      ])
      let search = null
      if (props.search || slots.search) {
        search = slots.search
          ? slots.search(scope)
          : h('button', { type: 'button', class: 'g-sidebar__search', 'aria-haspopup': 'dialog', 'data-g-tooltip': kind === 'side' ? '' : undefined, onClick: () => emit('search') }, [
              h('span', { class: 'g-sidebar__icon', 'aria-hidden': 'true' }, slots['search-icon'] ? slots['search-icon'](scope) : null),
              h('span', { class: 'g-sidebar__label' }, L.value.search),
              L.value.searchHint ? h('kbd', { class: 'g-sidebar__hint', 'aria-hidden': 'true' }, L.value.searchHint) : null
            ])
      }
      return h('div', { class: 'g-sidebar__head' }, [top, slots.header ? slots.header(scope) : null, search])
    }

    const modeClasses = (mode) => [
      'g-sidebar',
      `g-sidebar--mode-${mode}`,
      `g-sidebar--variant-${props.variant}`,
      `g-sidebar--color-${props.color}`,
      `g-sidebar--density-${props.density}`,
      overlayOn.value && mode === 'expanded' ? 'g-sidebar--overlay' : null
    ]

    const renderSide = (kind) => {
      // kind: 'side' (en línea: expandida o riel) | 'drawer' (siempre expandida dentro del <dialog>)
      const mode = kind === 'drawer' ? 'expanded' : format.value
      const rail = mode === 'rail'
      const scope = { collapsed: rail }
      const children = [
        renderHead(kind),
        h('nav', { class: 'g-sidebar__nav', 'aria-label': props.label || attrs['aria-label'], onKeydown: onNavKeydown }, [
          h('ul', { class: 'g-sidebar__groups', role: 'list' }, renderGroups(kind))
        ]),
        slots.user ? h('div', { class: 'g-sidebar__foot' }, slots.user(scope)) : null
      ]
      if (kind === 'side' && rail) {
        children.push(
          h('div', {
            ref: flyEl,
            class: 'g-sidebar__fly',
            popover: 'manual',
            role: 'group',
            'aria-label': flyItem.value?.label,
            onKeydown: onFlyKeydown,
            onFocusout: onFlyFocusout,
            onPointerenter: () => clearTimeout(leaveT),
            onPointerleave: () => { leaveT = setTimeout(() => { if (!flyPinned) closeFly() }, 220) }
          }, flyItem.value
            ? [
                h('div', { class: 'g-sidebar__fly-title' }, flyItem.value.label),
                h('ul', {}, flyItem.value.children.map((c) => h('li', { key: c.id }, [renderLink(c, 1, 'fly')])))
              ]
            : [])
        )
      }
      // Pistas del riel (#436): al final de la raíz, en el orden del documento (contraer, búsqueda y los items)
      if (kind === 'side') {
        children.push(tips.node(TOGGLE_TIP, rail ? L.value.expand : L.value.collapse))
        if (props.search && !slots.search) children.push(tips.node(SEARCH_TIP, L.value.search))
        for (const g of model.value) for (const item of g.items) children.push(tips.node(itemTip(item), item.label))
      }
      const own = kind === 'side' ? { ref: rootEl, ...rootAttrs() } : {}
      return h('div', { ...own, class: cls(...modeClasses(mode), ready.value && 'is-ready', kind === 'side' && expanding.value && 'is-expanding', kind === 'side' ? attrs.class : null), 'data-mode': mode }, children)
    }

    const renderNavbar = () => {
      const inBar = new Set(barItems.value.map((i) => i.id))
      const top = topOf(props.modelValue)
      const moreActive = Boolean(top && !inBar.has(top.id))
      const curKey = top && inBar.has(top.id) ? top.id : moreActive ? '__more' : null
      const tab = (key, current, node) => h('li', { key, class: current ? 'is-current' : undefined }, [node])
      const lab = (text, current) => h('span', { class: cls('g-sidebar__label', !current && 'g-sidebar__label--hidden') }, text)
      const li = barItems.value.map((item) => {
        const current = curKey === item.id
        const branch = isBranch(item)
        if (item.children.length) {
          return tab(item.id, current, h('button', {
            type: 'button',
            class: cls('g-sidebar__tab', branch && 'is-branch'),
            'data-id': String(item.id),
            'aria-haspopup': 'dialog',
            onClick: (e) => { ensureOpen(item.id); setDrawer(true, e.currentTarget) }
          }, [
            h('span', { class: 'g-sidebar__icon', 'aria-hidden': 'true' }, iconNode(item)),
            lab(item.label, current),
            branch && L.value.moreActive ? h('span', { class: 'g-sidebar__sr' }, `, ${L.value.moreActive}`) : null
          ]))
        }
        const common = {
          class: 'g-sidebar__tab',
          'data-id': String(item.id),
          'aria-current': isCurrent(item) ? 'page' : undefined,
          onClick: (e) => navigateTo(item, e)
        }
        const content = [h('span', { class: 'g-sidebar__icon', 'aria-hidden': 'true' }, iconNode(item)), lab(item.label, current), ...badgeNodes(item)]
        return tab(item.id, current, item.href ? h('a', { ...common, href: item.href }, content) : h('button', { ...common, type: 'button' }, content))
      })
      li.push(tab('__more', curKey === '__more', h('button', {
        type: 'button',
        class: cls('g-sidebar__tab g-sidebar__more', moreActive && 'is-branch'),
        'aria-haspopup': 'dialog',
        onClick: (e) => setDrawer(true, e.currentTarget)
      }, [
        h('span', { class: 'g-sidebar__icon', 'aria-hidden': 'true' }, slots['more-icon'] ? slots['more-icon']({}) : null),
        lab(L.value.more, curKey === '__more'),
        moreActive && L.value.moreActive ? h('span', { class: 'g-sidebar__sr' }, `, ${L.value.moreActive}`) : null
      ])))
      return h('nav', {
        ref: rootEl,
        ...rootAttrs(),
        class: cls(...modeClasses('navbar'), props.contained && 'g-sidebar--contained', ready.value && 'is-ready', entering.value && 'is-entering', attrs.class),
        'aria-label': props.label || attrs['aria-label'],
        'data-mode': 'navbar'
      }, [h('ul', { class: 'g-sidebar__bar', role: 'list', onKeydown: onBarKeydown }, li)])
    }

    const renderDrawer = () => h('dialog', {
      ref: dlgRef,
      class: 'g-sidebar__drawer',
      'aria-label': L.value.drawer,
      onClose: onDialogClose,
      onClick: onDialogClick
    }, [renderSide('drawer')])

    function rootAttrs() {
      const { class: _c, 'aria-label': _l, ...rest } = attrs
      return rest
    }

    expose({
      open: () => setDrawer(true),
      close: () => setDrawer(false),
      toggle: toggleCollapsed,
      focus: () => rootEl.value?.querySelector('.g-sidebar__link, .g-sidebar__tab')?.focus()
    })

    return () => {
      const f = format.value
      if (f === 'navbar') return h(Fragment, [renderNavbar(), renderDrawer()])
      if (f === 'drawer') return h(Fragment, [h('span', { ref: rootEl, hidden: true, 'aria-hidden': 'true', style: attrs.style, class: attrs.class }), renderDrawer()])
      return renderSide('side')
    }
  }
})
</script>
