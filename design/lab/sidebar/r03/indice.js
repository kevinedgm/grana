// GSidebar appearance="index" · prototipo de kiwi (r03). Lo que se propone a bruno, puesto SOBRE el DOM real de GSidebar
// (no lo sustituye): (1) grupos plegables con botón real (disclosure de APG), hidden="until-found" al asentar y apertura
// por beforematch; (2) el estado plegado: elección del usuario en memoria (vive con la instancia, que en un sitio no se
// vuelve a montar al navegar) + derivado de la ruta (al cambiar el actual, su grupo se abre); (3) el filtro abre los
// grupos con coincidencias y, al vaciarlo, cada grupo vuelve a su estado; (4) I2 · la marca del actual que viaja (una
// capa por <nav>, como la luz de #957 y la marca de GTabs) y representa al actual con un contorno si su grupo está plegado.
// Expone window.IndiceIndex({ items, current, hilo }) → { setCurrent(id), setQuery(q), state() }.
;(() => {
  const CHEV = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + window.LUCIDE_ICONS['chevron-right'] + '</svg>'
  const FIND = typeof document !== 'undefined' && 'onbeforematch' in document.body
  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches
  const token = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim()
  const ms = (v) => (v.endsWith('ms') ? parseFloat(v) : parseFloat(v) * 1000) || 0
  const frames = (n = 2) => new Promise((r) => { const f = () => (--n ? requestAnimationFrame(f) : r()); requestAnimationFrame(f) })

  window.IndiceIndex = function ({ items, current, hilo = true }) {
    const groups = new Map(items.filter((g) => g.items).map((g) => [g.label, g]))
    const chosen = new Map() // elección del usuario: label → abierto
    for (const g of groups.values()) if (g.collapsible) chosen.set(g.label, !g.collapsed)
    let cur = current
    let query = ''
    const groupOf = (id) => [...groups.values()].find((g) => g.items.some((i) => i.id === id))
    const isOpen = (label) => (query ? true : chosen.get(label) !== false)
    const roots = () => [...document.querySelectorAll('.g-sidebar--appearance-index, .g-sidebar__drawer > .g-sidebar')]

    function fold(li, ul, btn, open, animate) {
      btn.setAttribute('aria-expanded', String(open))
      const was = !ul.hasAttribute('hidden') && !li.classList.contains('is-closing')
      if (was === open && !ul._ixAnim) return
      if (ul._ixAnim) { ul._ixAnim.cancel(); ul._ixAnim = null }
      const done = () => { ul._ixAnim = null; ul.classList.remove('is-folding'); li.classList.remove('is-closing'); if (!open) { ul.setAttribute('hidden', FIND ? 'until-found' : ''); li.classList.add('is-closed') } placeAll() }
      if (!animate || reduce()) { if (open) { ul.removeAttribute('hidden'); li.classList.remove('is-closed') } done(); return }
      const from = ul.hidden ? 0 : ul.getBoundingClientRect().height
      if (open) { ul.removeAttribute('hidden'); li.classList.remove('is-closed') } else li.classList.add('is-closing')
      const to = open ? ul.scrollHeight : 0
      ul.classList.add('is-folding')
      ul._ixAnim = ul.animate([{ height: from + 'px' }, { height: to + 'px' }], { duration: ms(token('--g-duration-slow')), easing: token('--g-ease-out') || 'ease-out' })
      ul._ixAnim.onfinish = done
      placeAll()
    }
    function apply(label, animate) {
      for (const root of roots()) {
        for (const li of root.querySelectorAll('.g-sidebar__group')) {
          const btn = li.querySelector(':scope > .g-sidebar__group-title .ix-toggle')
          if (btn && btn.dataset.label === label) fold(li, li.querySelector(':scope > .g-sidebar__list'), btn, isOpen(label), animate)
        }
      }
    }
    function setChosen(label, open, animate = true) { chosen.set(label, open); apply(label, animate) }

    function enhance(root) {
      for (const li of root.querySelectorAll('.g-sidebar__group')) {
        const span = li.querySelector(':scope > .g-sidebar__group-title')
        if (!span || span.querySelector('.ix-toggle')) continue
        const label = span.textContent.trim()
        const g = groups.get(label)
        if (!g || !g.collapsible) continue
        const ul = li.querySelector(':scope > .g-sidebar__list')
        ul.id = span.id + '-list'
        const btn = document.createElement('button')
        btn.type = 'button'
        btn.className = 'ix-toggle'
        btn.dataset.label = label
        btn.setAttribute('aria-controls', ul.id)
        btn.innerHTML = `<span class="ix-toggle__text"></span><span class="ix-toggle__chev" aria-hidden="true">${CHEV}</span>`
        btn.firstChild.textContent = label
        span.textContent = ''
        span.appendChild(btn)
        btn.addEventListener('click', () => { if (!query) setChosen(label, !(chosen.get(label) !== false)) })
        ul.addEventListener('beforematch', () => setChosen(label, true, false))
        fold(li, ul, btn, isOpen(label), false)
      }
      const nav = root.querySelector('.g-sidebar__nav')
      // Cajón: cada vez que se abre, el actual a la vista (87 entradas; el original no lo hacía: SB-B5)
      const dlg = root.closest('.g-sidebar__drawer')
      if (nav && dlg) {
        if (dlg.open && !nav._ixShown) {
          nav._ixShown = true
          const a = nav.querySelector('.g-sidebar__link[aria-current="page"]')
          if (a && !a.closest('[hidden]')) { const nr = nav.getBoundingClientRect(), ar = a.getBoundingClientRect(); if (ar.top < nr.top || ar.bottom > nr.bottom) nav.scrollTop += ar.top - nr.top - (nr.height - ar.height) / 2 }
          place(nav, false)
        } else if (!dlg.open) nav._ixShown = false
      }
      if (hilo && nav && !nav.querySelector(':scope > .ix-mark')) {
        nav.classList.add('ix-hilo')
        const m = document.createElement('span')
        m.className = 'ix-mark'
        m.setAttribute('aria-hidden', 'true')
        nav.appendChild(m)
        place(nav, false)
        frames().then(() => m.classList.add('is-ready'))
      }
    }

    // I2 · la marca: centrada en la fila del actual; si su grupo está plegado, en la fila del título (hueca); oculta si el
    // filtro lo ocultó. Coordenadas del contenido de la región (se desplaza con ella)
    function place(nav, anim = true) {
      const m = nav.querySelector(':scope > .ix-mark')
      if (!m) return
      const a = nav.querySelector('.g-sidebar__link[aria-current="page"]')
      let target = null
      let rep = false
      if (a && a.getClientRects().length && !a.closest('[hidden]')) target = a
      else if (a && !a.closest('li.g-sidebar__item[hidden]')) {
        const li = a.closest('.g-sidebar__group')
        if (li && !li.hidden) { target = li.querySelector(':scope > .g-sidebar__group-title'); rep = true }
      }
      if (!anim) m.classList.remove('is-ready')
      m.classList.toggle('is-on', !!target)
      m.classList.toggle('is-rep', rep)
      if (target) {
        const nr = nav.getBoundingClientRect()
        const tr = target.getBoundingClientRect()
        const h = m.offsetHeight
        m.style.setProperty('--_ix-mark-y', Math.round(tr.top - nr.top + nav.scrollTop + (tr.height - h) / 2) + 'px')
      }
      if (!anim) frames().then(() => m.classList.add('is-ready'))
    }
    function placeAll() { for (const r of roots()) { const n = r.querySelector('.g-sidebar__nav'); n && place(n) } }

    // El drawer monta su contenido al abrirse: se mejora lo nuevo
    let pending = false
    const mo = new MutationObserver(() => { if (pending) return; pending = true; requestAnimationFrame(() => { pending = false; roots().forEach(enhance) }) })
    mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['open'] })
    roots().forEach(enhance)
    addEventListener('resize', () => placeAll())

    return {
      async setCurrent(id) {
        cur = id
        await frames()
        const g = groupOf(id)
        if (g && g.collapsible && chosen.get(g.label) === false) setChosen(g.label, true) // derivado de la ruta
        placeAll()
      },
      async setQuery(q) {
        const before = !!query
        query = (q || '').trim()
        await frames(1)
        if (before !== !!query) for (const label of chosen.keys()) apply(label, false)
        placeAll()
      },
      state: () => Object.fromEntries(chosen),
      toggle: (label) => setChosen(label, !(chosen.get(label) !== false))
    }
  }
})()
