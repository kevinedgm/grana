// Motor del filtro del índice de GSidebar (dueño: bruno). Viaja SOLO en la entrada `@grana/vue/sidebar-filter` (#1050):
// sidebar.md §«Filtro del índice» (#1035), «Extensión y conexión». GSidebar lo llama en su setup con el enganche interno
// (`c`, no es API pública): sus props, emit, el modelo, los textos, los nodos y las acciones de formato. Devuelve
// `state` (consulta plegada, ocultos y padres abiertos), `head(kind, rail, scope)` (el campo o el botón del riel),
// `up(e, nav, i)` (↑ en el primero vuelve al campo) y `focus()` (focusFilter). Normalización, icono y canal de página
// llegan del principal por `__shared`, sin copia.
import { computed, h, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { fold } from '../../utils/match.js'
import { acquirePageLive, announcePage } from '../../utils/liveRegion.js'
import GIcon from '../GIcon/GLibIcon.js'

const FIELD = '.g-sidebar__filter-input'

export function createSidebarFilter(c) {
  const { props, emit, L } = c
  const warned = new Set()
  const warn = (k, m) => { try { if (process.env.NODE_ENV !== 'production' && !warned.has(k)) { warned.add(k); console.warn(`[Grana] <GSidebar> ${m}`) } } catch {} }
  try {
    if (process.env.NODE_ENV !== 'production' && props.filter) {
      const l = props.labels || {}
      if (!l.filter || !l.filterCount || !l.filterNone || !l.filterClear) warn('f3', 'con filter necesita labels.filter, filterCount, filterNone y filterClear (F3).')
    }
  } catch {}

  // Etiquetas y alias plegados, una vez por cambio de `items` (F4: keywords que no es un arreglo de cadenas se ignora)
  const folded = computed(() => {
    const m = new Map()
    const add = (it) => {
      let kw = it.raw.keywords
      if (kw && !(Array.isArray(kw) && kw.every((k) => typeof k === 'string'))) {
        try { if (process.env.NODE_ENV !== 'production') warn('f4', 'keywords no es un arreglo de cadenas: se ignora (F4).') } catch {}
        kw = 0
      }
      m.set(it, [fold(it.label), (kw || []).map(fold)])
      it.children.forEach(add)
    }
    c.model.value.forEach((g) => g.items.forEach(add))
    return m
  })
  const q = ref(props.query || '')
  watch(() => props.query, (v) => { q.value = v || '' })
  const setQuery = (v) => { if (v === q.value) return; q.value = v; emit('update:query', v) }
  const hit = (it, f) => {
    if (/^\d{1,3}$/.test(f)) return Boolean(it.code && (it.code.startsWith(f) || (/^\d+$/.test(it.code) && +it.code === +f)))
    const [lf, kw] = folded.value.get(it)
    return lf.includes(f) || kw.some((k) => k.includes(f)) || (it.code !== null && fold(it.code) === f)
  }
  // Lo que no coincide se oculta (hidden en su <li>, sin desmontar); un grupo sin nada visible, entero; con consulta, todo
  // padre visible está abierto. Cuenta destinos: sin padres, deshabilitados ni `filterable: false`
  const state = computed(() => {
    const f = props.filter ? fold(q.value.trim()) : ''
    const hide = new Set()
    const open = new Set()
    const r = { f, hide, open, total: 0, shown: 0 }
    const see = (it, fixed, v) => {
      if (!fixed && !it.disabled && !it.children.length) { r.total++; if (v) r.shown++ }
      if (!v) hide.add(it.id)
      return v
    }
    for (const g of c.model.value) {
      let any = false
      for (const it of g.items) {
        const fixed = g.fixed || it.raw.filterable === false
        const self = !f || fixed || hit(it, f)
        let vis = self
        for (const ch of it.children) if (see(ch, fixed || ch.raw.filterable === false, self || fixed || ch.raw.filterable === false || hit(ch, f))) vis = true
        if (vis && f && it.children.length) open.add(it.id)
        if (see(it, fixed, vis)) any = true
      }
      if (f && !any) hide.add(g)
    }
    return r
  })
  const countText = computed(() => {
    const { f, shown, total } = state.value
    const fn = f && !shown ? L.value.filterNone : L.value.filterCount
    if (typeof fn !== 'function') return ''
    return f && !shown ? fn(q.value.trim()) : fn(f ? shown : total, total)
  })

  // Todas las cabeceras y regiones montadas (la en línea y la del drawer)
  const scopes = () => [c.rootEl.value, c.dlgRef.value].filter(Boolean)
  const inputOf = () => c.rootEl.value?.querySelector(FIELD) || c.dlgRef.value?.querySelector(FIELD)
  let annT = null
  let release = null
  // Al montar: el canal de página existe antes del primer gesto y los alias se pliegan ya (F4 sale aunque no se escriba)
  onMounted(() => { if (props.filter) { void folded.value; release = acquirePageLive() } })
  onBeforeUnmount(() => { clearTimeout(annT); release?.() })
  watch(() => state.value.f, (f, old) => {
    // Cada cambio: la luz se apaga y la región vuelve al principio (en el cuadro siguiente, con la disposición que el
    // navegador hará de todos modos); al vaciar, el actual a la vista y sin anuncio
    for (const r of scopes()) r.querySelectorAll('.g-sidebar__list, .g-sidebar__fly-list').forEach((l) => l._glide?.clear())
    requestAnimationFrame(() => scopes().forEach((r) => r.querySelectorAll('.g-sidebar__nav').forEach((n) => { n.scrollTop = 0 })))
    clearTimeout(annT)
    if (!f) {
      if (old) nextTick(() => scopes().forEach((r) => r.querySelector('.g-sidebar__nav [aria-current="page"]')?.scrollIntoView?.({ block: 'nearest' })))
      return
    }
    release ||= acquirePageLive()
    annT = setTimeout(() => announcePage(countText.value), 600)
  }, { flush: 'post' })

  const firstLink = (root, dest) => [...(root?.querySelectorAll('.g-sidebar__nav .g-sidebar__link') || [])]
    .find((x) => x.getAttribute('aria-disabled') !== 'true' && !x.closest('[hidden], [inert]') && !(dest && x.classList.contains('g-sidebar__parent')))
  const onKeydown = (e) => {
    const k = e.key
    const root = e.currentTarget.closest('.g-sidebar')
    if (k === 'Enter') {
      if (e.isComposing || e.keyCode === 229 || !state.value.f) return
      e.preventDefault()
      firstLink(root, true)?.click()
    } else if (k === 'ArrowDown') {
      const to = firstLink(root)
      if (to) { e.preventDefault(); to.focus() }
    } else if (k === 'Escape' && q.value) {
      // Con texto: vacía y no se propaga (no cierra el drawer); vacío, sigue su curso
      e.preventDefault()
      e.stopPropagation()
      setQuery('')
    }
  }
  const focusInput = () => { const i = inputOf(); if (i) { i.focus(); i.select() } }
  // Riel: lo del botón de expandir y después el campo
  const fromRail = () => { c.expand(); nextTick(focusInput) }

  return {
    state,
    up(e, nav, i) {
      const field = !i && nav.parentElement.querySelector(FIELD)
      if (field) { e.preventDefault(); field.focus() }
      return Boolean(field)
    },
    focus() {
      const f = c.format.value
      if (f === 'rail') fromRail()
      else if (f === 'expanded') focusInput()
      else {
        c.setDrawer(true)
        nextTick(() => nextTick(() => { if (c.dlgRef.value?.open) focusInput() }))
      }
    },
    head(kind, rail, scope) {
      const filtering = Boolean(state.value.f)
      const fid = `${c.baseId}-${kind}-filter`
      const icon = c.slots['search-icon'] ? c.slots['search-icon'](scope) : null
      return rail
        // Riel: botón del filtro con la anatomía de g-sidebar__search; la consulta se conserva y su recuento va oculto
        ? h('button', { type: 'button', class: ['g-sidebar__search', filtering && 'is-filtering'], 'data-g-tooltip': '', onClick: fromRail }, [
            h('span', { class: 'g-sidebar__icon', 'aria-hidden': 'true' }, icon),
            h('span', { class: 'g-sidebar__label' }, L.value.filter),
            filtering ? h('span', { class: 'g-sidebar__sr' }, `, ${countText.value}`) : null
          ])
        : h('div', { class: 'g-sidebar__filter' }, [
            h('div', { class: 'g-sidebar__filter-box' }, [
              h('label', { class: 'g-sidebar__sr', for: fid }, L.value.filter),
              h('span', { class: 'g-sidebar__filter-icon', 'aria-hidden': 'true' }, icon),
              h('input', {
                class: 'g-sidebar__filter-input',
                id: fid,
                type: 'search',
                value: q.value,
                placeholder: L.value.filterPlaceholder,
                autocomplete: 'off',
                spellcheck: 'false',
                enterkeyhint: 'go',
                'aria-describedby': `${fid}-count`,
                'aria-controls': `${c.baseId}-${kind}-nav`,
                'aria-keyshortcuts': props.filterKeyshortcuts || undefined,
                onInput: (e) => setQuery(e.target.value),
                onKeydown
              }),
              !q.value && L.value.filterHint ? h('kbd', { class: 'g-sidebar__filter-hint', 'aria-hidden': 'true' }, L.value.filterHint) : null,
              q.value
                ? h('button', { type: 'button', class: 'g-sidebar__filter-clear', 'aria-label': L.value.filterClear, onClick: (e) => { setQuery(''); e.currentTarget.parentElement.querySelector(FIELD).focus() } }, [h(GIcon, { name: 'x' })])
                : null
            ]),
            h('p', { class: ['g-sidebar__filter-count', filtering && !state.value.shown && 'is-empty'], id: `${fid}-count` }, countText.value)
          ])
    }
  }
}
