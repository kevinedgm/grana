// GNavBar · prototipo de kiwi r01 (no es el .vue: lo construye bruno desde el contrato de lima).
// Barra superior de navegación del sitio: marca, búsqueda, enlaces de sección con la actual (activeMatch), acciones
// (idioma, tema, redes), «…» para lo que no cabe y pantalla de menú en estrecho. Calca la del sitio anterior.
// Usa utilidades internas reales del paquete (Grana.__shared: glide.js para P1). Expone window.ProtoNavBar.
;(() => {
  const { h, ref, computed, watch, onMounted, onBeforeUnmount, nextTick, defineComponent } = Vue
  const glide = Grana.__shared['utils/glide.js']

  // ¿Es la actual? activeMatch (cadena RegExp) contra la ruta de la aplicación; sin él, el href exacto.
  // SSR: solo props (ni location ni matchMedia en el primer render; N3).
  const isCurrent = (item, current) => {
    if (!current || item.external) return false
    if (item.activeMatch) { try { return new RegExp(item.activeMatch).test(current) } catch { return false } }
    return item.href === current
  }
  // Guarda común de #505 con #574: solo clic primario sin modificadores y sin otro contexto de navegación
  const plainClick = (e, item) => e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey && !(item.target && item.target !== '_self')

  window.ProtoNavBar = defineComponent({
    name: 'ProtoNavBar',
    props: {
      items: { type: Array, default: () => [] },
      current: { type: String, default: '' },
      label: { type: String, required: true },
      labels: { type: Object, default: () => ({}) },
      glide: { type: Boolean, default: false },
      mark: { type: Boolean, default: false },
      id: { type: String, default: 'nb' }
    },
    emits: ['navigate', 'update:open'],
    setup(props, { slots, emit, expose }) {
      const list = ref(null)
      const moreOpen = ref(false)
      const screenOpen = ref(false)
      const moreBtn = ref(null)
      const toggle = ref(null)
      const screen = ref(null)
      const L = computed(() => props.labels)
      const items = computed(() => props.items.filter((i) => i && i.id && i.label && i.href))
      const currentId = computed(() => (items.value.find((i) => isCurrent(i, props.current)) || {}).id || null)

      // ---------- P2 · la marca de la actual (viaja al cambiar; instantánea la primera vez y con reduced motion) ----------
      const placeMark = (instant) => {
        const ul = list.value
        if (!ul) return
        const markEl = ul.querySelector('.nb__mark')
        const a = currentId.value && ul.querySelector(`[data-id="${currentId.value}"]`)
        if (!a || !props.mark) { ul.classList.remove('has-mark'); return }
        const b = a.getBoundingClientRect(); const o = ul.getBoundingClientRect()
        const first = !ul.classList.contains('has-mark')
        if (first || instant) { ul.classList.add('is-mark-instant'); requestAnimationFrame(() => requestAnimationFrame(() => ul.classList.remove('is-mark-instant'))) }
        // La línea cubre el texto (sin el relleno de 12 a cada lado)
        const pad = parseFloat(getComputedStyle(a).paddingInlineStart) || 0
        markEl.style.setProperty('--_mark-x', `${Math.round(b.left - o.left + pad)}px`)
        markEl.style.setProperty('--_mark-w', `${Math.round(b.width - pad * 2)}px`)
        ul.classList.add('has-mark')
      }
      watch(currentId, () => nextTick(() => placeMark(false)))
      watch(() => props.mark, () => nextTick(() => placeMark(true)))

      // ---------- P1 · una sola luz (glide.js real) ----------
      // createPointerGlide no viaja en __shared (solo aimed y placeHighlight): el prototipo hace la sesión mínima del
      // puntero con placeHighlight real; GNavBar usará createPointerGlide entero (bruno).
      let glider = null
      const setupGlide = () => {
        if (glider) { glider.destroy(); glider = null }
        const ul = list.value
        if (!props.glide || !ul) return
        let raf = 0; let last = null
        const move = (e) => {
          if (!glide.aimed(e)) return
          last = e.target.closest && e.target.closest('.nb__link')
          if (!raf) raf = requestAnimationFrame(() => { raf = 0; glide.placeHighlight(ul, last, { layer: ul.firstElementChild }) })
        }
        const leave = (e) => { if (glide.aimed(e)) { last = null; glide.placeHighlight(ul, null, { layer: ul.firstElementChild }) } }
        ul.addEventListener('pointermove', move); ul.addEventListener('pointerleave', leave)
        glider = { destroy: () => { ul.removeEventListener('pointermove', move); ul.removeEventListener('pointerleave', leave) } }
      }
      watch(() => props.glide, () => nextTick(setupGlide))

      // ---------- Disclosure «…» ----------
      const closeMore = (focusBack) => { moreOpen.value = false; if (focusBack) moreBtn.value && moreBtn.value.focus() }
      const onDocDown = (e) => {
        if (moreOpen.value && !e.target.closest('.nb__more')) closeMore(false)
      }

      // ---------- Pantalla en estrecho: disclosure con el foco en bucle botón ↔ pantalla ----------
      const setScreen = (v, focusBack) => {
        screenOpen.value = v
        emit('update:open', v)
        if (v) nextTick(() => { const f = screen.value && screen.value.querySelector('a, button, input, [tabindex="0"]'); f && f.focus() })
        else if (focusBack) toggle.value && toggle.value.focus()
      }
      const focusables = () => [toggle.value, ...(screen.value ? screen.value.querySelectorAll('a[href], button:not([disabled]), input, [tabindex="0"]') : [])].filter((x) => x && x.getClientRects().length)
      const onKey = (e) => {
        if (e.key === 'Escape') {
          if (screenOpen.value) { e.preventDefault(); setScreen(false, true) }
          else if (moreOpen.value) { e.preventDefault(); closeMore(true) }
          return
        }
        if (e.key === 'Tab' && screenOpen.value) {
          const f = focusables(); if (!f.length) return
          const i = f.indexOf(document.activeElement)
          if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus() }
          else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus() }
        }
      }
      // Al pasar a ancho, la pantalla se cierra sola (y el foco vuelve a algo visible)
      let mq = null
      const onMq = () => { if (mq.matches && screenOpen.value) setScreen(false, false) }

      const onLink = (item, e) => {
        const ev = { item, event: e }
        if (plainClick(e, item) && !item.external) emit('navigate', ev)
        // Elegir un destino cierra la pantalla y el «…» (también si la aplicación cancela y navega con su router)
        if (screenOpen.value) setScreen(false, false)
        if (moreOpen.value) closeMore(false)
      }

      onMounted(() => {
        placeMark(true)
        setupGlide()
        document.addEventListener('pointerdown', onDocDown, true)
        document.addEventListener('keydown', onKey)
        mq = matchMedia('(width >= 48rem)'); mq.addEventListener('change', onMq)
        window.addEventListener('resize', () => placeMark(true))
        if (document.fonts) document.fonts.ready.then(() => placeMark(true))
      })
      onBeforeUnmount(() => {
        document.removeEventListener('pointerdown', onDocDown, true)
        document.removeEventListener('keydown', onKey)
        mq && mq.removeEventListener('change', onMq)
        glider && glider.destroy()
      })
      expose({ closeMenus: () => { setScreen(false, false); closeMore(false) } })

      const icon = (name) => h(Vue.resolveComponent('g-icon'), { name })
      const extIcon = () => h('span', { class: 'nb__ext', 'aria-hidden': 'true', innerHTML: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${window.LUCIDE_ICONS['arrow-up-right']}</svg>` })
      const linkAttrs = (item, cls) => ({
        class: cls,
        href: item.href,
        'data-id': item.id,
        'aria-current': item.id === currentId.value ? 'page' : null,
        target: item.external ? '_blank' : item.target || null,
        rel: item.external ? 'noreferrer' : item.rel || null,
        onClick: (e) => onLink(item, e)
      })
      const linkBody = (item) => [h('span', { dir: 'auto' }, item.label), item.external ? [extIcon(), h('span', { class: 'nb-sr' }, ` (${L.value.newTab})`)] : null]

      return () => h('div', { class: ['nb', { 'nb--glide': props.glide, 'nb--mark': props.mark, 'is-open': screenOpen.value }], id: props.id }, [
        slots.brand ? h('div', { class: 'nb__brand' }, slots.brand()) : null,
        h('div', { class: 'nb__search' }, slots.search ? slots.search() : null),
        h('nav', { class: 'nb__nav', 'aria-label': props.label }, [
          h('ul', { class: 'nb__list', ref: list }, [
            h('li', { class: 'nb__light', 'aria-hidden': 'true', role: 'none' }),
            ...items.value.map((item) => h('li', { key: item.id }, [h('a', linkAttrs(item, 'nb__link'), linkBody(item))])),
            h('li', { class: 'nb__mark', 'aria-hidden': 'true', role: 'none' })
          ])
        ]),
        slots.actions ? h('div', { class: 'nb__actions' }, slots.actions({ place: 'bar' })) : null,
        slots.actions ? h('div', { class: 'nb__more' }, [
          h('button', { ref: moreBtn, class: 'nb__iconbtn', type: 'button', 'aria-label': L.value.more, 'aria-expanded': String(moreOpen.value), 'aria-controls': `${props.id}-more`, onClick: () => (moreOpen.value = !moreOpen.value) }, [icon('ellipsis')]),
          h('div', { class: 'nb__panel', id: `${props.id}-more`, hidden: !moreOpen.value }, slots.actions({ place: 'more' }))
        ]) : null,
        h('div', { class: 'nb__toggle' }, [
          h('button', { ref: toggle, class: 'nb__iconbtn', type: 'button', 'aria-label': L.value.menu, 'aria-expanded': String(screenOpen.value), 'aria-controls': `${props.id}-screen`, onClick: () => setScreen(!screenOpen.value, false) }, [icon(screenOpen.value ? 'x' : 'menu')])
        ]),
        h('div', { ref: screen, class: 'nb__screen', id: `${props.id}-screen`, hidden: !screenOpen.value }, [
          h('nav', { 'aria-label': props.label }, [
            h('ul', { class: 'nb__screen-list' }, items.value.map((item) => h('li', { key: item.id }, [h('a', linkAttrs(item, 'nb__screen-link'), linkBody(item))])))
          ]),
          slots.actions ? h('div', { class: 'nb__screen-actions' }, slots.actions({ place: 'screen' })) : null
        ])
      ])
    }
  })
})()
