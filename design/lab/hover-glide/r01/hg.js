/* Ronda r01 «una sola luz» (kiwi). Motor de LABORATORIO que simula lo que bruno escribiría en utils/glide.js
   (declaracion.md §4): una luz por lista que sigue al PUNTERO (no al foco), sobre los componentes reales de dist/.
   - Solo ratón y lápiz (pointerType); el toque no hace nada.
   - Un único manejador por anfitrión (delegado), con rAF; se escribe solo lo que cambia.
   - Datos en el anfitrión: --_highlight-x/-y/-w/-h (px, respecto de su caja de relleno + scroll), has-highlight,
     is-highlight-instant (primera colocación de cada sesión del puntero y recolocaciones sin gesto; dos cuadros).
   - Con un botón pulsado la luz no se mueve (lo pulsado sigue iluminado hasta soltar).
   - Al desplazarse con el puntero quieto, vuelve a mirar qué hay bajo el puntero, al instante.
   En el componente real la capa la pinta el propio .vue (como g-menu__highlight); aquí se inserta en el DOM. */
(function () {
  const raf = (f) => requestAnimationFrame(f)

  function glide(host, opts) {
    const { target, accept = () => true, box = (el) => el, off = () => false, layerClass, layerTag = 'div', layerParent = host } = opts
    if (!host.querySelector(':scope > .' + layerClass)) {
      const layer = document.createElement(layerTag)
      layer.className = layerClass
      layer.setAttribute('aria-hidden', 'true')
      if (layerTag === 'li') layer.setAttribute('role', 'none')
      layerParent.prepend(layer)
    }
    const cl = host.classList
    let pt = null, cur = null, pressed = false, frame = 0, turn = 0
    const set = (k, v) => { if (host.style.getPropertyValue(k) !== v) host.style.setProperty(k, v) }
    const instant = () => {
      const t = ++turn
      cl.add('is-highlight-instant')
      raf(() => raf(() => { if (t === turn) cl.remove('is-highlight-instant') }))
    }
    function place(el, still) {
      if (!el) { cur = null; if (cl.contains('has-highlight')) cl.remove('has-highlight'); return }
      const first = !cl.contains('has-highlight')
      if (first || still) instant()
      const b = box(el).getBoundingClientRect()
      const h = host.getBoundingClientRect()
      set('--_highlight-x', Math.round(b.left - h.left - host.clientLeft + host.scrollLeft) + 'px')
      set('--_highlight-y', Math.round(b.top - h.top - host.clientTop + host.scrollTop) + 'px')
      set('--_highlight-w', Math.round(b.width) + 'px')
      set('--_highlight-h', Math.round(b.height) + 'px')
      cur = el
      if (first) cl.add('has-highlight')
    }
    function hit(still) {
      if (!pt || !document.body.classList.contains('hg-on')) return place(null)
      if (off()) return place(null)
      const n = document.elementFromPoint(pt.x, pt.y)
      const el = n && n.closest(target)
      place(el && host.contains(el) && accept(el) ? el : null, still)
    }
    const schedule = (still) => { if (frame) return; frame = raf(() => { frame = 0; hit(still) }) }
    host.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return
      pt = { x: e.clientX, y: e.clientY }
      if (!pressed) schedule(false)
    })
    host.addEventListener('pointerleave', (e) => { if (e.pointerType === 'touch') return; pt = null; place(null) })
    host.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'touch') pressed = true })
    addEventListener('pointerup', () => { if (pressed) { pressed = false; schedule(false) } })
    addEventListener('scroll', () => { if (pt) schedule(true) }, { capture: true, passive: true })
    new ResizeObserver(() => { if (cur) place(cur.isConnected ? cur : null, true) }).observe(host)
    return { refresh: () => pt && schedule(true) }
  }

  // ---------- Montaje sobre los componentes reales ----------
  function mountSidebar(root) {
    // Una lista por grupo (el título y el margen del grupo la separan); los hijos de un padre son de la lista del padre
    root.querySelectorAll('.g-sidebar__list').forEach((ul) => glide(ul, {
      target: '.g-sidebar__link',
      accept: (el) => el.getAttribute('aria-disabled') !== 'true' && !el.closest('[inert]'),
      off: () => root.classList.contains('g-sidebar--mode-navbar'),
      layerClass: 'g-sidebar__highlight',
      layerTag: 'li'
    }))
  }
  function mountTable(root) {
    const scroll = root.querySelector('.g-table__scroll')
    const door = () => root.classList.contains('has-door') && !root.classList.contains('has-detail')
    glide(scroll, {
      // A · la puerta: solo la celda principal de una fila con puerta; B y tabla llana: la fila entera
      target: 'td.g-table__cell--primary, tr.g-table__row',
      accept: (el) => {
        if (el.matches('td')) return door() && !!el.querySelector('.g-table__door')
        if (door()) return false
        return !el.querySelector(':scope > td > .g-table__skeleton') && !el.classList.contains('g-table__detail')
      },
      box: (el) => el,
      off: () => root.matches('.g-table--mode-cards, .g-table--appearance-surface, .is-loading, .is-pending'),
      layerClass: 'g-table__highlight'
    })
  }

  // ---------- Medidor visible (para el usuario y para verificar.mjs) ----------
  function meter() {
    const out = document.getElementById('hg-meter')
    if (!out) return
    let max = 0
    const own = () => {
      const tds = [...document.querySelectorAll('.g-table__row:not(.is-selected) > td')].filter((td) => {
        const c = getComputedStyle(td).backgroundColor
        return c !== 'rgba(0, 0, 0, 0)' && c !== 'transparent'
      })
      const rows = new Set(tds.map((td) => td.parentElement)).size
      const links = [...document.querySelectorAll('.g-sidebar__link')].filter((a) => {
        const c = getComputedStyle(a).backgroundColor
        return c !== 'rgba(0, 0, 0, 0)' && c !== 'transparent'
      }).length
      return rows + links
    }
    const tick = () => {
      const n = own(); max = Math.max(max, n)
      const lights = document.querySelectorAll('.has-highlight').length
      out.innerHTML = 'Filas con fondo propio ahora: <b>' + n + '</b> · máximo visto: <b>' + max + '</b> · luces encendidas: <b>' + lights + '</b>'
      raf(tick)
    }
    raf(tick)
  }

  window.HG = { glide, mountSidebar, mountTable, meter }
})()
