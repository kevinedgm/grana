// GMenu r02 · elementos-enlace (kiwi). Prototipo del comportamiento: NO es GMenu.vue (ese es de bruno).
// Reproduce lo necesario de GMenu (roving tabindex, M1 «el puntero mueve el foco», Esc/Tab, clic fuera) y añade
// el elemento-enlace <a role="menuitem">, la regla de navigate (#505) y los conceptos A, B y C.
// window.__r02 expone el estado para verificar.mjs.
(function () {
  const L = window.lucide
  const qs = new URLSearchParams(location.search)
  const CONCEPT = ['A', 'B', 'C'].includes(qs.get('c')) ? qs.get('c') : 'base'
  if (qs.get('dir') === 'rtl') document.documentElement.dir = 'rtl'

  // Textos de la aplicación (Grana no trae textos: labels)
  const LABELS = {
    external: 'otro sitio',
    newTab: 'abre en una pestaña nueva',
    opened: 'Abierta',
    openedLive: '{label} abierta en otra pestaña',
    copied: 'Enlace copiado',
    copiedLive: 'Enlace de {label} copiado',
    tagExternal: 'Otro sitio',
    tagNewTab: 'Pestaña nueva'
  }

  const ACCOUNT = [
    { id: 'perfil', label: 'Mi perfil', icon: 'user', href: '#/perfil', current: true },
    { id: 'ajustes', label: 'Ajustes', icon: 'settings', href: '#/ajustes', shortcut: 'Ctrl+,' },
    { id: 'invitar', label: 'Invitar al equipo', icon: 'user-plus' },
    { type: 'separator' },
    { id: 'docs', label: 'Documentación', icon: 'file-text', href: 'https://example.org/docs/grana/menu', target: '_blank', external: true },
    { id: 'estado', label: 'Estado del servicio', icon: 'activity', href: 'https://status.example.org/', external: true },
    { id: 'factura', label: 'Facturación', icon: 'credit-card', href: '#/facturacion', disabled: true },
    { type: 'separator' },
    { id: 'oscuro', type: 'checkbox', label: 'Tema oscuro', checked: false },
    { type: 'separator' },
    { id: 'salir', label: 'Cerrar sesión', icon: 'unplug', href: '#/salir' }
  ]
  const FILE = [
    { id: 'abrir', label: 'Abrir ficha', icon: 'file', href: '#/muestras/m-0007' },
    { id: 'historial', label: 'Historial', icon: 'list', href: '#/muestras/m-0007/historial' },
    { id: 'duplicar', label: 'Duplicar', icon: 'copy' },
    { id: 'mover', label: 'Mover a…', icon: 'folder', disabled: true },
    { type: 'separator' },
    { id: 'eliminar', label: 'Eliminar', icon: 'trash', danger: true }
  ]

  const log = []
  const logEl = document.getElementById('log-list')
  const say = (kind, text) => {
    log.push({ kind, text })
    const li = document.createElement('li')
    li.textContent = `${kind} · ${text}`
    logEl.prepend(li)
    while (logEl.children.length > 8) logEl.lastChild.remove()
  }
  const live = document.getElementById('live')
  const announce = (t) => { live.textContent = ''; setTimeout(() => { live.textContent = t }, 50) }
  const routerSim = () => document.getElementById('router').checked

  const isLink = (it) => typeof it.href === 'string' && it.href.trim() !== '' && (it.type || 'item') === 'item'
  const leaves = (it) => isLink(it) && (it.external || (it.target && it.target !== '_self'))
  const hostOf = (href) => { try { const u = new URL(href, location.href); return u.origin === location.origin ? { host: '', path: u.hash || u.pathname } : { host: u.host, path: (u.pathname + u.search).replace(/\/$/, '') || '' } } catch { return { host: '', path: href } } }

  let uid = 0
  function createMenu(root, items, triggerLabel) {
    const id = `m${++uid}`
    const trigger = document.createElement('button')
    trigger.type = 'button'
    trigger.id = `${id}-trigger`
    trigger.className = 'g-btn g-btn--variant-outline g-btn--color-neutral g-btn--density-default g-btn--rounded-md'
    trigger.setAttribute('aria-haspopup', 'menu')
    trigger.setAttribute('aria-expanded', 'false')
    trigger.setAttribute('aria-controls', `${id}-list`)
    trigger.innerHTML = `<span class="g-btn__label">${triggerLabel}</span>` + L('chevron-down', 'g-btn__append')
    const list = document.createElement('ul')
    list.className = 'g-menu__list'
    list.id = `${id}-list`
    list.setAttribute('role', 'menu')
    list.setAttribute('popover', 'manual')
    list.setAttribute('aria-labelledby', trigger.id)
    const hl = document.createElement('li')
    hl.className = 'g-menu__highlight'; hl.setAttribute('role', 'none'); hl.setAttribute('aria-hidden', 'true')
    list.append(hl)

    const nodes = []
    items.forEach((it, i) => {
      const li = document.createElement('li')
      li.setAttribute('role', 'none')
      if (it.type === 'separator') { li.innerHTML = '<div class="g-menu__separator" role="separator"></div>'; list.append(li); return }
      const link = isLink(it)
      const el = document.createElement(link ? 'a' : 'button')
      el.className = 'g-menu__item' + (it.danger ? ' g-menu__item--danger' : '')
      el.id = `${id}-i-${i}`
      el.tabIndex = -1
      el.dataset.id = it.id
      if (link) {
        el.setAttribute('role', 'menuitem')
        if (!it.disabled) el.setAttribute('href', it.href) // deshabilitado: sin href (no se abre, no se copia, no va a otra pestaña)
        if (it.target) el.setAttribute('target', it.target)
        if (it.rel) el.setAttribute('rel', it.rel)
        if (it.current) el.setAttribute('aria-current', 'page')
      } else {
        el.type = 'button'
        el.setAttribute('role', it.type === 'checkbox' ? 'menuitemcheckbox' : 'menuitem')
        if (it.type === 'checkbox') el.setAttribute('aria-checked', String(!!it.checked))
      }
      if (it.disabled) el.setAttribute('aria-disabled', 'true')
      const sr = []
      if (link && it.external) sr.push(LABELS.external)
      if (link && it.target === '_blank') sr.push(LABELS.newTab)
      el.innerHTML =
        (it.type === 'checkbox'
          ? `<span class="g-menu__mark" aria-hidden="true">${L('check')}</span>`
          : `<span class="g-menu__icon" aria-hidden="true">${it.icon ? L(it.icon) : ''}</span>`) +
        `<span class="g-menu__label">${it.danger ? L('triangle-alert', 'g-menu__danger-icon') : ''}${it.label}</span>` +
        (sr.length ? `<span class="r02-sr">, ${sr.join(', ')}</span>` : '') +
        (it.shortcut ? `<span class="g-menu__shortcut" aria-hidden="true">${it.shortcut}</span>` : '') +
        (CONCEPT === 'C' ? '<span class="r02-trace" aria-hidden="true"></span>' : '') +
        (leaves(it) ? `<span class="r02-leave" aria-hidden="true">${L('globe')}</span>` : '')
      li.append(el)
      list.append(li)
      nodes.push({ it, el, link })
    })

    // B · pie de destino: solo si algún elemento sale de la aplicación (otro sitio o pestaña nueva)
    let dest = null
    if (CONCEPT === 'B' && items.some(leaves)) {
      dest = document.createElement('li')
      dest.className = 'r02-dest'
      dest.setAttribute('role', 'none')
      dest.setAttribute('aria-hidden', 'true')
      dest.dataset.empty = ''
      dest.innerHTML = `<span class="r02-dest__body"><span class="r02-dest__icon"></span><span class="r02-dest__host"></span><span class="r02-dest__path"></span><span class="r02-dest__tag"></span></span>`
      list.append(dest)
    }

    root.append(trigger, list)
    const itemsEls = () => nodes.map((n) => n.el)
    const nodeOf = (el) => nodes.find((n) => n.el === el)
    let open = false
    let active = null
    let instant = true

    const setActive = (el) => {
      active = el
      itemsEls().forEach((x) => { x.tabIndex = x === el ? 0 : -1 })
      if (el) {
        if (instant) { list.classList.add('is-highlight-instant'); requestAnimationFrame(() => requestAnimationFrame(() => list.classList.remove('is-highlight-instant'))); instant = false }
        list.style.setProperty('--_active-y', el.offsetTop + 'px')
        list.style.setProperty('--_active-h', el.offsetHeight + 'px')
        list.classList.add('has-highlight')
      } else { list.classList.remove('has-highlight'); instant = true }
      if (dest) paintDest(el && nodeOf(el))
    }
    const paintDest = (n) => {
      if (!n || !n.link || n.it.disabled) { dest.dataset.empty = ''; return }
      delete dest.dataset.empty
      const { host, path } = hostOf(n.it.href)
      const tag = n.it.target === '_blank' ? LABELS.tagNewTab : n.it.external ? LABELS.tagExternal : ''
      dest.querySelector('.r02-dest__icon').innerHTML = L(n.it.external ? 'globe' : 'arrow-right')
      dest.querySelector('.r02-dest__host').textContent = host
      dest.querySelector('.r02-dest__path').textContent = path
      dest.querySelector('.r02-dest__tag').textContent = tag ? '· ' + tag : ''
    }
    const focusItem = (el) => { if (!el) return; el.focus({ preventScroll: false }); setActive(el) }

    const place = () => {
      const r = trigger.getBoundingClientRect()
      const rtl = getComputedStyle(trigger).direction === 'rtl'
      const gap = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--g-space-1')) || 4
      const w = list.offsetWidth
      let x = rtl ? r.right - w : r.left
      x = Math.max(gap * 2, Math.min(x, innerWidth - w - gap * 2))
      list.style.setProperty('--_x', x + 'px')
      list.style.setProperty('--_y', r.bottom + gap + 'px')
      list.style.setProperty('--_max', Math.max(160, innerHeight - r.bottom - gap * 4) + 'px')
      list.dataset.side = 'bottom'
      list.dataset.align = rtl ? 'right' : 'left'
    }
    const openMenu = (at = 'first') => {
      if (open) return
      open = true
      trigger.setAttribute('aria-expanded', 'true')
      list.showPopover()
      place()
      const els = itemsEls()
      focusItem(at === 'last' ? els[els.length - 1] : els[0])
      document.addEventListener('pointerdown', outside, true)
    }
    const close = (toTrigger, why) => {
      if (!open) return
      open = false
      trigger.setAttribute('aria-expanded', 'false')
      list.hidePopover()
      setActive(null)
      delete list.dataset.mod
      list.querySelectorAll('.r02-trace').forEach((t) => { t.textContent = '' })
      document.removeEventListener('pointerdown', outside, true)
      if (toTrigger) trigger.focus()
      if (why) say('cierre', why + (toTrigger ? ' · foco al disparador' : ''))
    }
    const outside = (e) => { if (!list.contains(e.target) && !trigger.contains(e.target)) close(false, 'clic fuera') }

    trigger.addEventListener('click', () => { open ? close(true, 'segundo clic') : openMenu('first') })
    trigger.addEventListener('keydown', (e) => {
      if (['ArrowDown', 'Enter', ' '].includes(e.key)) { e.preventDefault(); openMenu('first') }
      if (e.key === 'ArrowUp') { e.preventDefault(); openMenu('last') }
    })

    // C · huella en el sitio + anuncio cortés (texto de la aplicación)
    const trace = (n, text, liveText) => {
      if (CONCEPT !== 'C') return
      n.el.querySelector('.r02-trace').textContent = text
      announce(liveText.replace('{label}', n.it.label))
    }

    let typed = ''
    let typedTimer
    list.addEventListener('keydown', (e) => {
      const el = e.target.closest('.g-menu__item')
      if (!el) return
      const els = itemsEls()
      const i = els.indexOf(el)
      const go = (k) => { e.preventDefault(); focusItem(els[(k + els.length) % els.length]) }
      if (e.key === 'ArrowDown') return go(i + 1)
      if (e.key === 'ArrowUp') return go(i - 1)
      if (e.key === 'Home') return go(0)
      if (e.key === 'End') return go(els.length - 1)
      if (e.key === 'Escape') { e.preventDefault(); return close(true, 'Esc') }
      if (e.key === 'Tab') return close(false, 'Tab')
      const n = nodeOf(el)
      // Espacio en un enlace: el navegador no lo activa (y desplazaría la página). GMenu lo trata como Intro sin modificadores.
      if (e.key === ' ' && n.link) {
        e.preventDefault()
        if (!e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey && !n.it.disabled) el.click()
        return
      }
      // C · Ctrl/⌘ pulsado: vista previa de lo que puede abrirse aparte; Ctrl/⌘+C copia el enlace enfocado
      if (CONCEPT === 'C' && (e.key === 'Control' || e.key === 'Meta')) { list.dataset.mod = ''; return }
      if (CONCEPT === 'C' && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c' && n.link && !n.it.disabled) {
        e.preventDefault()
        const url = new URL(n.it.href, location.href).href
        window.__r02.copied = url
        try { navigator.clipboard && navigator.clipboard.writeText(url).catch(() => {}) } catch {}
        trace(n, LABELS.copied, LABELS.copiedLive)
        say('copiar', url)
        return
      }
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey && e.key !== ' ') {
        typed += e.key.toLowerCase()
        clearTimeout(typedTimer); typedTimer = setTimeout(() => { typed = '' }, 500)
        const from = typed.length > 1 ? i : i + 1
        const order = [...els.slice(from), ...els.slice(0, from)]
        const hit = order.find((x) => x.querySelector('.g-menu__label').textContent.trim().toLowerCase().startsWith(typed))
        if (hit) { e.preventDefault(); focusItem(hit) }
      }
    })
    list.addEventListener('keyup', (e) => { if (e.key === 'Control' || e.key === 'Meta') delete list.dataset.mod })

    // M1: el puntero mueve el foco (ratón y lápiz; no sobre deshabilitados)
    list.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return
      const el = e.target.closest('.g-menu__item')
      if (CONCEPT === 'C') { if (e.ctrlKey || e.metaKey) list.dataset.mod = ''; else delete list.dataset.mod }
      if (!el || el === active || el.getAttribute('aria-disabled') === 'true') return
      el.focus({ preventScroll: true }); setActive(el)
    })

    // Activación (clic, Intro nativo en <a> y <button>, Espacio)
    list.addEventListener('click', (e) => {
      const el = e.target.closest('.g-menu__item')
      if (!el) return
      const n = nodeOf(el)
      if (n.it.disabled) { e.preventDefault(); say('nada', `${n.it.label} deshabilitado`); return }
      if (!n.link) {
        if (n.it.type === 'checkbox') {
          n.it.checked = !n.it.checked; el.setAttribute('aria-checked', String(n.it.checked))
          say('select', `${n.it.id} (casilla: ${n.it.checked}) · el menú sigue abierto`)
          return
        }
        say('select', n.it.id)
        return close(true, 'acción')
      }
      const mod = e.ctrlKey || e.metaKey || e.shiftKey || e.altKey
      if (e.button !== 0 || mod || e.defaultPrevented) {
        // El navegador hace lo suyo: pestaña (Ctrl/⌘), ventana (Mayús), descarga (Alt en algunos). Sin navigate (#505).
        const bg = e.ctrlKey || e.metaKey
        if (bg && CONCEPT === 'C') {
          trace(n, LABELS.opened, LABELS.openedLive)
          say('navegador', `${n.it.label}: pestaña en segundo plano · sin navigate · el menú sigue abierto`)
          return
        }
        say('navegador', `${n.it.label}: ${bg ? 'pestaña en segundo plano' : e.shiftKey ? 'ventana nueva' : 'gesto del navegador'} · sin navigate`)
        return close(true, 'enlace con modificador')
      }
      if (n.it.target && n.it.target !== '_self') {
        // Como RouterLink: un destino en otra pestaña no pasa por el router
        say('navegador', `${n.it.label}: target=${n.it.target} · sin navigate`)
        return close(true, 'enlace a otra pestaña')
      }
      const ev = { id: n.it.id, item: n.it, event: e }
      window.__r02.navigates.push({ id: n.it.id, href: n.it.href })
      if (routerSim()) e.preventDefault()
      say('navigate', `${n.it.id} → ${n.it.href}${routerSim() ? ' · preventDefault (router)' : ' · el navegador sigue el href'}`)
      void ev
      close(true, 'navigate')
    })
    // Clic central: auxclick (no hay click). El navegador abre en segundo plano.
    list.addEventListener('auxclick', (e) => {
      const el = e.target.closest('.g-menu__item')
      if (!el || e.button !== 1) return
      const n = nodeOf(el)
      if (!n.link || n.it.disabled) return
      if (CONCEPT === 'C') { trace(n, LABELS.opened, LABELS.openedLive); say('navegador', `${n.it.label}: clic central · el menú sigue abierto`); return }
      say('navegador', `${n.it.label}: clic central · sin navigate`)
      close(true, 'clic central')
    })
    // Menú contextual del navegador: GMenu no lo intercepta (abrir en pestaña, copiar enlace…). El menú sigue abierto.
    list.addEventListener('contextmenu', (e) => {
      const el = e.target.closest('.g-menu__item')
      if (el) say('navegador', `menú contextual sobre ${nodeOf(el).it.label} (${nodeOf(el).link ? 'de enlace' : 'genérico'})`)
    })

    return { trigger, list, open: () => openMenu(), close, isOpen: () => open, dest: () => dest }
  }

  window.__r02 = { concept: CONCEPT, log, navigates: [], copied: null, menus: {} }
  window.__r02.menus.account = createMenu(document.getElementById('demo-account'), ACCOUNT, 'Kevin García')
  window.__r02.menus.file = createMenu(document.getElementById('demo-file'), FILE, 'Muestra M-0007')
  window.__r02.ready = true
})()
