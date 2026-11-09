// Motor de la apariencia `index`, de los grupos plegables y de la marca del actual de GSidebar (dueño: bruno). Viaja en la
// entrada `@grana/vue/sidebar-index` (sidebar.md §«Apariencia `index`» «Extensión y conexión», DECISIONS.md #1060 a #1069);
// no es API pública. GSidebar lo inyecta y llama `createSidebarIndex(c)` en su setup; devuelve:
//   link(item) / parent(item)  contenido de una fila de `index` (sin asiento, número al final: «GCombobox, 24»)
//   group(g, kind, titleId, list)  el <li> de un grupo (plegable o fijo) en las dos apariencias
//   mark()               la capa de la marca (última hija del <nav>, solo en `index`)
//   opened(dialog)       el drawer se acaba de abrir: el actual a la vista (I5) y la marca en su sitio
// Grupos: APG Disclosure, estado interno (de `collapsed`) o controlado (`closedGroups`), la ruta abre el del actual,
// `beforematch` y `hidden="until-found"` en g-sidebar__group-body, regla 5 del filtro (abierto, sin emitir, aria-disabled).
// El plegado es la rejilla de coco con el motor por grupo de abajo (createCollapse: el de utils/collapse.js sin ciclo de vida).
import { computed, h, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import GIcon from '../GIcon/GLibIcon.js'
import { nextFrame } from '../GForm/formContext.js'
import { transitionMs } from '../../utils/motion.js'

// Plegado de un panel (el de utils/collapse.js, #486, sin ganchos de ciclo de vida; `panel` y `toggle` son funciones)
function createCollapse(panel, toggle, onSettle) {
  const animating = ref(false)
  const instant = ref(false)
  let timer = null
  const settle = () => {
    clearTimeout(timer)
    animating.value = false
    onSettle()
  }
  // Respaldo del transitionend: si la transición de altura sigue (empezó tarde con el hilo ocupado), espera
  const fallback = () => {
    const p = panel()
    if (p?.getAnimations?.().some((a) => a.transitionProperty === 'grid-template-rows' && a.playState === 'running')) timer = setTimeout(fallback, 50)
    else settle()
  }
  return {
    animating,
    instant,
    settle,
    start() {
      animating.value = true
      nextTick(() => { clearTimeout(timer); timer = setTimeout(fallback, transitionMs(panel()) + 50) })
    },
    instantly() {
      clearTimeout(timer)
      instant.value = true
      nextFrame(() => nextFrame(() => { instant.value = false }))
      settle()
    },
    onTransitionend(e) { if (e.target === e.currentTarget && e.propertyName === 'grid-template-rows') settle() },
    // Plegar con el foco dentro: al botón antes de inert/hidden, sin desplazar (2.4.3)
    focusOut() { if (panel()?.contains(document.activeElement)) toggle()?.focus({ preventScroll: true }) },
    dispose: () => clearTimeout(timer)
  }
}

const IX_MODE = { rail: 'expanded', navbar: 'drawer' }

export function createSidebarIndex(c) {
  const { props, emit, model, filt, format, L, baseId } = c
  const on = () => props.appearance === 'index'
  const raw = (g) => g?.raw || {}
  const cls = (...a) => a.filter(Boolean).join(' ')
  const warn = (k, m) => { try { if (process.env.NODE_ENV !== 'production') c.warnOnce(k, m) } catch {} }
  try {
    if (process.env.NODE_ENV !== 'production' && on()) {
      if (IX_MODE[props.mode]) warn('a1', `appearance="index" no tiene riel ni navbar: mode="${props.mode}" se pinta ${IX_MODE[props.mode] === 'expanded' ? 'expandida' : 'drawer'} (A1).`)
      if (c.slots.icon || props.items.some((g) => (g?.items || [g]).some((it) => it?.icon))) warn('a2', 'appearance="index" no pinta iconos: icon y el slot icon se ignoran (A2).')
    }
  } catch {}

  // ---------- Grupos plegables (#1061): estado = closedGroups o interno (de `collapsed`), menos el grupo que la ruta abrió ----------
  const foldable = computed(() => model.value.filter((g) => {
    const r = raw(g)
    const ok = r.collapsible && r.id != null && r.id !== ''
    try { if (process.env.NODE_ENV !== 'production' && r.collapsible && !ok) warn('a3', `el grupo «${g.label}» es collapsible sin id: no se pliega (A3).`) } catch {}
    return ok && g.label
  }))
  const local = ref([])
  const seen = new Set()
  watch(foldable, (gs) => {
    const add = gs.filter((g) => !seen.has(raw(g).id) && seen.add(raw(g).id) && g.raw.collapsed).map((g) => raw(g).id)
    if (add.length) local.value = [...local.value, ...add]
  }, { immediate: true })
  const ctl = () => Array.isArray(props.closedGroups)
  const routeOpen = ref(null)
  const closedSet = computed(() => {
    const ok = new Set(foldable.value.map((g) => raw(g).id))
    const s = new Set((ctl() ? props.closedGroups : local.value).filter((id) => ok.has(id)))
    s.delete(routeOpen.value)
    return s
  })
  watch(() => props.closedGroups, (v) => { if (!v?.includes(routeOpen.value)) routeOpen.value = null })
  const groupOf = (id) => model.value.find((g) => g.items.some((it) => it.id === id || it.children.some((x) => x.id === id)))
  const filtering = () => Boolean(filt.value.f)
  const animIds = new Set()
  const setClosed = (next, id, anim) => {
    if (anim) animIds.add(id)
    if (!ctl()) local.value = next
    emit('update:closedGroups', next)
  }
  const setGroup = (id, open, anim) => {
    if (routeOpen.value === id) routeOpen.value = null
    const cur = [...closedSet.value]
    if (open === cur.includes(id)) setClosed(open ? cur.filter((x) => x !== id) : [...cur, id], id, anim)
  }
  // La ruta abre el grupo del actual: al montar se pinta abierto y emite tras montar; al cambiar modelValue, emite y anima
  let routeEmit = null
  const openRoute = (now) => {
    const g = props.modelValue == null ? null : groupOf(props.modelValue)
    const id = raw(g).id
    if (!g || !closedSet.value.has(id)) return
    const next = [...closedSet.value].filter((x) => x !== id)
    if (ctl()) routeOpen.value = id
    if (now) setClosed(next, id, true)
    else if (ctl()) routeEmit = next
    else local.value = next
  }
  openRoute()
  watch(() => props.modelValue, () => openRoute(1))
  // Plegado efectivo (con consulta o en el riel, todo abierto); asentado = lleva hidden="until-found" (también en SSR)
  const closedNow = computed(() => {
    const open = filtering() || format.value === 'rail'
    return new Map(foldable.value.map((g) => [raw(g).id, !open && closedSet.value.has(raw(g).id)]))
  })
  const settled = reactive(new Set([...closedNow.value].filter((e) => e[1]).map((e) => e[0])))
  const kindNow = () => (format.value === 'drawer' || format.value === 'navbar' ? 'drawer' : 'side')
  const motors = new Map()
  let faded = false
  const motor = (id) => {
    let m = motors.get(id)
    if (!m) {
      const el = (part) => () => document.getElementById(`${baseId}-${kindNow()}-${foldable.value.find((x) => raw(x).id === id)?.key}${part}`)
      motors.set(id, (m = createCollapse(el('-body'), el(''), () => {
        if (closedNow.value.get(id)) settled.add(id)
        if (faded) { faded = false; nextTick(() => placeMark()) }
      })))
    }
    return m
  }
  watch(closedNow, (now, old) => {
    const cg = groupOf(props.modelValue)
    const at = model.value.indexOf(cg)
    let how
    for (const [id, closed] of now) {
      if (old.get(id) === undefined || old.get(id) === closed) continue
      const m = motor(id)
      if (closed) m.focusOut()
      else settled.delete(id)
      if (animIds.has(id) && c.ready()) {
        m.start()
        // El grupo del actual: la marca viaja; uno por encima empuja su fila: la marca se funde y vuelve al asentar
        if (raw(cg).id === id) how = 'travel'
        else if (at > model.value.findIndex((g) => raw(g).id === id)) faded = true
      } else m.instantly()
    }
    animIds.clear()
    nextTick(() => placeMark(faded ? 'fade' : how))
  })

  // ---------- La marca del actual de `index` (#1062): una capa por <nav>; llena en la fila del actual, hueca en el botón de
  // su grupo plegado (o en el padre de su submenú cerrado). Lee las dos cajas antes de escribir (#964); clases y geometría
  // directas en el DOM (vnodes de clase fija): colocarla no vuelve a pintar las filas ----------
  const visibleNav = () => (kindNow() === 'drawer' ? (c.dlg()?.open ? c.dlg() : null) : c.rootEl.value)?.querySelector('.g-sidebar__nav')
  const markTarget = (nav) => {
    const a = nav.querySelector('[aria-current="page"]')
    if (!a || a.closest('li[hidden]')) return null
    const g = a.closest('.g-sidebar__group.is-closed')
    const sub = a.closest('.g-sidebar__sub:not(.is-open)')
    return g ? [g.firstChild, 1] : sub ? [sub.previousElementSibling, 1] : [a, 0]
  }
  let markTok = 0
  const placeMark = (how) => {
    const nav = on() && visibleNav()
    const m = nav?.lastElementChild
    if (!m) return
    const t = how !== 'fade' && markTarget(nav)
    const nr = t && nav.getBoundingClientRect()
    const r = t && t[0].getBoundingClientRect()
    const py = parseFloat(m.style.getPropertyValue('--_mark-y'))
    m.classList.remove('is-full', 'is-hollow')
    if (!r?.height) return
    if (how !== 'travel' || !nav.classList.contains('has-mark')) {
      const k = ++markTok
      m.classList.add('is-instant')
      nextFrame(() => nextFrame(() => k === markTok && m.classList.remove('is-instant')))
    }
    const y = Math.round(r.top - nr.top - nav.clientTop + nav.scrollTop)
    const h = Math.round(r.height)
    // Viaje largo (#1071): más de 1,5 filas de salto
    m.classList.toggle('is-far', how === 'travel' && Math.abs(y - py) > 1.5 * h)
    m.style.cssText = `--_mark-y:${y}px;--_mark-h:${h}px`
    m.classList.add(t[1] ? 'is-hollow' : 'is-full')
    nav.classList.add('has-mark')
  }
  watch(() => props.modelValue, () => nextTick(() => placeMark('travel')))
  watch([filt, model, format, on], () => nextTick(placeMark), { flush: 'post' })
  // Cambios de tamaño de la lista (fuentes, ancho): sin viaje; durante un plegado no (al asentar se recoloca)
  let ro = null
  const observe = () => {
    ro?.disconnect()
    const list = on() && typeof ResizeObserver !== 'undefined' && visibleNav()?.firstChild
    ro = list ? new ResizeObserver(() => { if (!faded && ![...motors.values()].some((x) => x.animating.value)) placeMark() }) : null
    ro?.observe(list)
  }
  watch([format, on, c.open], () => nextTick(observe), { flush: 'post' })
  onMounted(() => {
    if (routeEmit) emit('update:closedGroups', routeEmit)
    placeMark()
    observe()
  })
  onBeforeUnmount(() => {
    ro?.disconnect()
    for (const m of motors.values()) m.dispose()
  })

  // ---------- Render ----------
  // index (#1063): el número al final de la fila y su texto oculto después de la etiqueta («GCombobox, 24»)
  const label = (item) => h('span', { class: 'g-sidebar__label' }, item.label)
  const code = (item) => (item.code ? [h('span', { class: 'g-sidebar__code', 'aria-hidden': 'true' }, item.code), h('span', { class: 'g-sidebar__sr' }, `, ${item.code}`)] : [])

  return {
    link: (item) => [label(item), ...c.badges(item), ...code(item)],
    parent: (item) => [label(item), ...code(item), h(GIcon, { class: 'g-sidebar__chevron', name: 'chevron-right' })],
    mark: () => (on() ? h('span', { class: 'g-sidebar__mark', 'aria-hidden': 'true' }) : null),
    // El actual a la vista al abrir el drawer (I5, SB-B5; las dos apariencias): centrado si cabe, sin animación, antes de pintarse
    opened(d) {
      const nav = d.querySelector('.g-sidebar__nav')
      const t = markTarget(nav)
      const nr = t && nav.getBoundingClientRect()
      const r = t && t[0].getBoundingClientRect()
      if (r?.height) nav.scrollTop += r.top - nr.top - (nr.height - r.height) / 2
      placeMark()
    },
    // Grupo plegable (#1061): botón de APG Disclosure + envoltorio con hidden="until-found" al asentar (SB-B4); en el riel,
    // título span y todo abierto (el estado se conserva); con consulta, abierto y el botón en aria-disabled
    group(g, kind, titleId, list) {
      const id = raw(g).id
      const can = foldable.value.includes(g)
      const fold = can && !(kind === 'side' && format.value === 'rail')
      const closed = fold && closedNow.value.get(id)
      const done = closed && settled.has(id)
      const m = fold && motor(id)
      const cur = g === groupOf(props.modelValue)
      const bid = `${titleId}-body`
      return h('li', {
        class: cls('g-sidebar__group', fold && 'is-collapsible', closed && 'is-closed', cur && 'has-current', m && m.animating.value && 'is-animating', m && m.instant.value && 'is-instant'),
        role: 'presentation',
        key: g.key,
        hidden: filt.value.hide.has(g) || undefined
      }, [
        fold
          ? h('button', {
              type: 'button',
              class: 'g-sidebar__group-title',
              id: titleId,
              'aria-expanded': String(!closed),
              'aria-controls': bid,
              'aria-disabled': filtering() ? 'true' : undefined,
              onClick: () => filtering() || setGroup(id, closed, true)
            }, [
              g.label,
              h('span', { class: 'g-sidebar__chevron', 'aria-hidden': 'true' }, [h(GIcon, { class: 'g-icon--flip-rtl', name: 'chevron-right' })]),
              closed && cur && L.value.groupCurrent ? h('span', { class: 'g-sidebar__sr' }, `, ${L.value.groupCurrent}`) : null
            ])
          : g.label ? h('span', { class: 'g-sidebar__group-title', id: titleId }, g.label) : null,
        can
          ? h('div', {
              class: 'g-sidebar__group-body',
              id: bid,
              '^hidden': done ? 'until-found' : undefined,
              inert: closed && !done ? '' : undefined,
              onBeforematch: () => setGroup(id, true),
              onTransitionend: m ? m.onTransitionend : undefined
            }, [list])
          : list
      ])
    }
  }
}
