// Banco de estilo del calco (coco): GNavBar con el MARCADO DEL CONTRATO (design/contracts/nav-bar.md «Anatomía» y «Clases y
// datos»), para medir GNavBar.css antes de que exista el .vue (lo construye bruno). Comportamiento mínimo: actual por
// activeMatch, P1 con glide.js real (placeHighlight en la capa, #964), «…» en popover="auto" con aria-expanded por `toggle`,
// pantalla con --_screen-top medido al abrir y bucle de foco. Expone window.BancoNavBar.
;(() => {
  const { h, ref, computed, onMounted, onBeforeUnmount, nextTick, defineComponent, resolveComponent } = Vue
  const glide = Grana.__shared['utils/glide.js']
  const isCurrent = (item, current) => {
    if (!current || item.external) return false
    if (item.activeMatch) { try { return new RegExp(item.activeMatch).test(current) } catch { return false } }
    return item.href === current
  }
  window.BancoNavBar = defineComponent({
    name: 'BancoNavBar',
    props: { items: Array, current: String, label: String, labels: Object, id: { type: String, default: 'nb' } },
    setup(props, { slots }) {
      const list = ref(null); const screen = ref(null); const toggle = ref(null); const panel = ref(null); const moreBtn = ref(null)
      const open = ref(false); const moreOpen = ref(false)
      const currentId = computed(() => (props.items.find((i) => isCurrent(i, props.current)) || {}).id || null)
      let raf = 0; let last = null
      const move = (e) => { if (!glide.aimed(e)) return; last = e.target.closest && e.target.closest('.g-nav-bar__link'); if (!raf) raf = requestAnimationFrame(() => { raf = 0; glide.placeHighlight(list.value, last, { layer: list.value.firstElementChild }) }) }
      const leave = (e) => { if (glide.aimed(e)) glide.placeHighlight(list.value, null, { layer: list.value.firstElementChild }) }
      const setScreen = (v, back) => {
        if (v) { const band = document.querySelector('.g-app-shell__header'); const b = band ? band.getBoundingClientRect().bottom : 0; screen.value.style.setProperty('--_screen-top', `${Math.max(0, Math.round(b))}px`) }
        open.value = v
        if (v) nextTick(() => { const f = screen.value.querySelector('a[href]'); f && f.focus() })
        else if (back) toggle.value.focus()
      }
      const onKey = (e) => {
        if (e.key === 'Escape' && open.value) { e.preventDefault(); setScreen(false, true) }
        if (e.key === 'Tab' && open.value) {
          const f = [toggle.value, ...screen.value.querySelectorAll('a[href], button, input')].filter((x) => x.getClientRects().length)
          const i = f.indexOf(document.activeElement)
          if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus() } else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus() }
        }
      }
      onMounted(() => {
        list.value.addEventListener('pointermove', move); list.value.addEventListener('pointerleave', leave)
        document.addEventListener('keydown', onKey)
        panel.value.addEventListener('toggle', (e) => { moreOpen.value = e.newState === 'open' })
      })
      onBeforeUnmount(() => document.removeEventListener('keydown', onKey))
      const icon = (name, cls) => h(resolveComponent('g-icon'), { name, class: cls })
      const body = (item) => [item.label, item.external ? [h('span', { class: 'g-nav-bar__ext', 'aria-hidden': 'true' }, [icon('arrow-up-right', 'g-icon--flip-rtl')]), h('span', { class: 'g-nav-bar__sr' }, ` ${props.labels.newTab}`)] : null]
      const attrs = (item, cls) => ({ class: [cls, item.external && cls === 'g-nav-bar__link' ? 'g-nav-bar__link--external' : null], href: item.href, 'aria-current': item.id === currentId.value ? 'page' : null, target: item.external ? '_blank' : null, rel: item.external ? 'noreferrer' : null, onClick: (e) => { e.preventDefault(); if (open.value) setScreen(false) } })
      const sepd = (nodes) => nodes.flatMap((n) => [h('span', { class: 'g-nav-bar__sep', 'aria-hidden': 'true' }), n])
      return () => h('div', { class: ['g-nav-bar', { 'is-open': open.value }], id: props.id }, [
        h('div', { class: 'g-nav-bar__brand' }, slots.brand()),
        h('div', { class: 'g-nav-bar__search' }, slots.search()),
        h('nav', { class: 'g-nav-bar__nav', 'aria-label': props.label }, [
          h('ul', { class: 'g-nav-bar__list', ref: list }, [
            h('li', { class: 'g-nav-bar__highlight', 'aria-hidden': 'true', role: 'none' }),
            ...props.items.map((item) => h('li', { key: item.id }, [h('a', attrs(item, 'g-nav-bar__link'), body(item))]))
          ])
        ]),
        h('div', { class: 'g-nav-bar__actions' }, sepd(slots.actions({ place: 'bar' }).flatMap((n) => (n.type === Vue.Fragment ? n.children : [n])).filter((n) => n.type !== Vue.Comment))),
        h('div', { class: 'g-nav-bar__more' }, [
          h('button', { ref: moreBtn, class: 'g-nav-bar__more-btn', type: 'button', id: `${props.id}-more-btn`, 'aria-label': props.labels.more, 'aria-expanded': String(moreOpen.value), 'aria-controls': `${props.id}-more`, popovertarget: `${props.id}-more` }, [icon('ellipsis')]),
          h('div', { ref: panel, class: 'g-nav-bar__more-panel', id: `${props.id}-more`, popover: 'auto' }, slots.actions({ place: 'more' }))
        ]),
        h('button', { ref: toggle, class: 'g-nav-bar__toggle', type: 'button', id: `${props.id}-toggle`, 'aria-label': props.labels.menu, 'aria-expanded': String(open.value), 'aria-controls': `${props.id}-screen`, onClick: () => setScreen(!open.value) }, [icon(open.value ? 'x' : 'menu')]),
        h('div', { ref: screen, class: 'g-nav-bar__screen', id: `${props.id}-screen`, hidden: !open.value }, [
          h('nav', { class: 'g-nav-bar__screen-nav', 'aria-label': props.label }, [h('ul', { class: 'g-nav-bar__screen-list' }, props.items.map((item) => h('li', { key: item.id }, [h('a', attrs(item, 'g-nav-bar__screen-link'), body(item))])))]),
          h('div', { class: 'g-nav-bar__screen-actions' }, slots.actions({ place: 'screen' }))
        ])
      ])
    }
  })
})()
