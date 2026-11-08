// GPageIndex appearance="list" · prototipo de kiwi r01 (no es el .vue: lo construye bruno desde el contrato de lima).
// Columna «En esta página» que calca la del sitio anterior, con el motor del contrato (línea de lectura de #1039,
// la elegida se sostiene de #1048) y su forma plegada (fold) para la barra local en estrecho.
// Personalidad de comportamiento (no cambia el aspecto): PI-P1 la lista se sigue sola, PI-P2 llegada al destino.
// Usa utilidades internas reales (Grana.__shared: landing.js). Expone window.BancoPageIndex.
;(() => {
  const { h, ref, computed, watch, onMounted, onBeforeUnmount, nextTick, defineComponent } = Vue
  const landing = Grana.__shared['utils/landing.js']
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches

  // Árbol de dos niveles desde una lista plana con level 2/3 (un h3 sin h2 previo cuelga de la raíz)
  const tree = (items) => {
    const out = []
    for (const it of items) {
      if (!it || !it.id || !(it.label || '').trim()) continue
      if (it.level === 3 && out.length) (out[out.length - 1].children ||= []).push(it)
      else out.push({ ...it, children: undefined })
    }
    return out
  }

  window.BancoPageIndex = defineComponent({
    name: 'BancoPageIndex',
    props: {
      items: { type: Array, default: () => [] },
      modelValue: { type: String, default: null },
      label: { type: String, required: true },
      labels: { type: Object, default: () => ({}) },
      fold: { type: Boolean, default: false },
      align: { type: String, default: 'end' },
      follow: { type: Boolean, default: true },
      landing: { type: Boolean, default: false },
      id: { type: String, default: 'pi' }
    },
    emits: ['update:modelValue', 'navigate'],
    setup(props, { emit, expose }) {
      const root = ref(null)
      const scroller = ref(null)
      const drop = ref(null)
      const btn = ref(null)
      const open = ref(false)
      const current = ref(props.modelValue)
      const held = ref(null) // la elegida sostenida (#1048)
      let jumping = false
      let jumpTimer = 0
      const nodes = computed(() => tree(props.items))
      const flat = computed(() => props.items.filter((i) => i && i.id && (i.label || '').trim()))
      watch(() => props.modelValue, (v) => { current.value = v })

      // ---------- Línea de lectura (#1039): leer todas las cajas en un cuadro, escribir después ----------
      let frame = 0
      const read = () => {
        frame = 0
        // Una instancia que no se pinta (la otra forma, oculta por la maqueta) no lee ni emite: no gasta ni pelea
        if (jumping || held.value || !root.value || !root.value.getClientRects().length) return
        const doc = document.scrollingElement
        const pad = parseFloat(getComputedStyle(document.documentElement).scrollPaddingBlockStart) || 0
        const line = pad + (innerHeight - pad) / 3
        const tops = flat.value.map((it) => { const el = document.getElementById(it.id); return el ? el.getBoundingClientRect().top : Infinity })
        let id = null
        const atEnd = Math.abs(doc.scrollTop + innerHeight - doc.scrollHeight) <= 1
        if (atEnd) { for (let i = tops.length - 1; i >= 0; i--) if (tops[i] < innerHeight) { id = flat.value[i].id; break } }
        else for (let i = 0; i < tops.length; i++) if (tops[i] <= line) id = flat.value[i].id
        if (id !== current.value) { current.value = id; emit('update:modelValue', id) }
      }
      const schedule = () => { if (!frame) frame = requestAnimationFrame(read) }
      const onScroll = () => {
        if (jumping) { clearTimeout(jumpTimer); jumpTimer = setTimeout(endJump, 150); return }
        if (held.value) { held.value = null } // primer desplazamiento tras el salto: la lectura vuelve en este cuadro
        schedule()
      }
      const endJump = () => { jumping = false }

      // ---------- Marcador: posición de la fila actual dentro de la columna ----------
      const placeMarker = (instant, fromInner) => {
        const r = root.value
        if (!r || props.fold) return
        const a = current.value && r.querySelector(`.g-page-index__link[data-id="${CSS.escape(current.value)}"]`)
        r.classList.toggle('has-current', !!a)
        if (!a) return
        const body = r.querySelector('.g-page-index__body')
        const ab = a.getBoundingClientRect(); const bb = body.getBoundingClientRect()
        const mk = r.querySelector('.g-page-index__marker')
        if (instant) { r.classList.add('is-instant'); requestAnimationFrame(() => requestAnimationFrame(() => r.classList.remove('is-instant'))) }
        // Contrato del banco (GPageIndex.css): la fila del actual (borde superior y alto) EN LA CAPA; el CSS dibuja 2 × 18 centrado
        mk.style.setProperty('--_marker-y', `${Math.round(ab.top - bb.top)}px`)
        mk.style.setProperty('--_marker-h', `${Math.round(ab.height)}px`)
        // Fuera de la vista de la columna, el marcador no se pinta encima del título ni bajo la lista
        const sv = scroller.value && scroller.value.getBoundingClientRect()
        if (sv && (ab.bottom <= sv.top + 1 || ab.top >= sv.bottom - 1)) r.classList.remove('has-current')
        // PI-P1 · la lista se sigue sola: el actual vuelve a la vista DENTRO de la columna, nunca la página, y nunca
        // con el puntero o el foco dentro (quien está mirando la lista manda; regla 4 de #358)
        const sc = scroller.value
        if (props.follow && !fromInner && sc && !sc.matches(':hover') && !sc.contains(document.activeElement)) {
          const sb = sc.getBoundingClientRect()
          const margin = ab.height * 2
          let d = 0
          if (ab.top < sb.top + margin) d = ab.top - sb.top - margin
          else if (ab.bottom > sb.bottom - margin) d = ab.bottom - sb.bottom + margin
          // Un salto largo (más que la columna) se hace sin animar: no se recorre media lista para llegar
          if (d) sc.scrollBy({ top: d, behavior: reduced() || instant || Math.abs(d) > sb.height ? 'instant' : 'smooth' })
        }
      }
      watch(current, () => nextTick(() => placeMarker(false)))

      // ---------- Elegir una sección ----------
      const choose = (it, e) => {
        const plain = e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey
        if (!plain) return
        emit('navigate', { item: it, event: e })
        if (e.defaultPrevented) return
        jumping = true; clearTimeout(jumpTimer); jumpTimer = setTimeout(endJump, 150)
        current.value = it.id; held.value = it.id
        emit('update:modelValue', it.id)
        if (open.value) open.value = false
        // El navegador sigue el #id; el foco va al destino cuando ha terminado de saltar (tabindex -1 si hace falta)
        requestAnimationFrame(() => {
          const t = document.getElementById(it.id)
          if (!t) return
          if (!t.matches('a[href], button, input, select, textarea, [tabindex]')) t.setAttribute('tabindex', '-1')
          t.focus({ preventScroll: true })
          if (props.landing) landing.land(t) // PI-P2 · llegada: el destino se marca un instante (decorativo)
        })
      }
      const toTop = (e) => {
        if (e.button !== 0) return
        e.preventDefault(); open.value = false
        window.scrollTo({ top: 0 })
        const h1 = document.querySelector('main h1')
        if (h1) { if (!h1.hasAttribute('tabindex')) h1.setAttribute('tabindex', '-1'); h1.focus({ preventScroll: true }) }
      }

      // ---------- Plegada: disclosure ----------
      const onDoc = (e) => { if (open.value && root.value && !root.value.contains(e.target)) open.value = false }
      const onKey = (e) => { if (e.key === 'Escape' && open.value) { e.preventDefault(); open.value = false; btn.value && btn.value.focus() } }

      onMounted(() => {
        addEventListener('scroll', onScroll, { passive: true })
        addEventListener('resize', schedule)
        document.addEventListener('pointerdown', onDoc, true)
        document.addEventListener('keydown', onKey)
        const hash = decodeURIComponent(location.hash.slice(1))
        if (hash && flat.value.some((i) => i.id === hash)) current.value = hash
        else read()
        nextTick(() => placeMarker(true))
      })
      onBeforeUnmount(() => {
        removeEventListener('scroll', onScroll); removeEventListener('resize', schedule)
        document.removeEventListener('pointerdown', onDoc, true); document.removeEventListener('keydown', onKey)
      })
      expose({ refresh: () => { if (!held.value) schedule() } })

      const link = (it) => h('a', {
        class: 'g-page-index__link', href: `#${it.id}`, 'data-id': it.id, dir: 'auto', title: it.label,
        'aria-current': it.id === current.value ? 'location' : null,
        onClick: (e) => choose(it, e)
      }, it.label)
      const list = (cls) => h('ul', { class: cls }, nodes.value.map((n) => h('li', { key: n.id }, [link(n), n.children ? h('ul', { class: 'g-page-index__sub' }, n.children.map((c) => h('li', { key: c.id }, [link(c)]))) : null])))

      return () => props.fold
        ? h('nav', { ref: root, class: ['g-page-index g-page-index--appearance-list g-page-index--fold', `g-page-index--align-${props.align === 'start' ? 'start' : 'end'}`, { 'is-open': open.value }], 'aria-labelledby': `${props.id}-fold`, id: props.id }, [
            h('button', { ref: btn, class: 'g-page-index__fold', id: `${props.id}-fold`, type: 'button', 'aria-expanded': String(open.value), 'aria-controls': `${props.id}-drop`, onClick: () => (open.value = !open.value) }, [
              h('span', { dir: 'auto' }, props.label),
              h('span', { class: 'g-page-index__chev', 'aria-hidden': 'true' }, [h(Vue.resolveComponent('g-icon'), { name: 'chevron-right', class: 'g-icon--flip-rtl' })])
            ]),
            h('div', { ref: drop, class: 'g-page-index__drop', id: `${props.id}-drop`, hidden: !open.value }, [
              h('a', { class: 'g-page-index__top', href: '#', onClick: toTop }, props.labels.top),
              list('g-page-index__list')
            ])
          ])
        : h('nav', { ref: root, class: 'g-page-index g-page-index--appearance-list', 'aria-labelledby': `${props.id}-title`, id: props.id }, [
            h('div', { class: 'g-page-index__body' }, [
              h('span', { class: 'g-page-index__marker', 'aria-hidden': 'true' }),
              h('p', { class: 'g-page-index__title', id: `${props.id}-title`, dir: 'auto' }, props.label),
              h('div', { ref: scroller, class: 'g-page-index__scroll', tabindex: '-1', onScroll: () => placeMarker(true, true) }, [list('g-page-index__list')])
            ])
          ])
    }
  })
})()
