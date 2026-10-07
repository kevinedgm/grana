// Banco de estilo de GBreadcrumbs (coco): emite el marcado EXACTO de design/contracts/breadcrumbs.md («Estructura accesible»
// y «Clases y datos») y hace SOLO lo que el estilo necesita para verse y medirse: etapas por lotes con una lista de medida
// (aria-hidden, inert, sin ids, con su data-stage), data-clipped, is-ready, la cara de B con su escalera, puertas con su
// panel (popover="manual", --_x/--_y/--_max y data-side), teclado mínimo de los paneles, foco conservado por nivel y la regla
// de subir o bajar (is-entering / copia saliente is-leaving). No es la implementación de bruno ni documentación.
// La pista visual (motor del tooltip, modo visual) NO se emula: su CSS es el de GTooltip, no el de este componente.
// Iconos: solo Lucide (design/lab/lucide-icons.js).
(function () {
  'use strict'
  let uid = 0
  const fill = (s, label) => String(s || '').replace(/\{label\}/g, label)
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches
  const rtlOf = (n) => getComputedStyle(n).direction === 'rtl'
  const STAGES = ['liquid', 'root-icon', 'shrink', 'step']

  function h(tag, attrs = {}, kids = []) {
    const e = document.createElement(tag)
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue
      if (k === 'class') e.className = v
      else if (k === 'text') e.textContent = v
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), v)
      else e.setAttribute(k, v === true ? '' : v)
    }
    for (const c of [].concat(kids)) if (c != null) e.append(c)
    return e
  }
  function icon(name, cls) {
    const t = document.createElement('template')
    t.innerHTML = window.lucide(name, cls)
    return t.content.firstChild
  }

  function mount(host, opt) {
    const id = opt.id || 'bc' + ++uid
    const S = { items: opt.items.map((x) => ({ ...x })), labels: opt.labels, stage: null, open: null, ready: false }
    const nav = h('nav', { class: 'g-breadcrumbs', 'aria-label': S.labels.nav, id, 'data-stage': 'liquid' })
    host.append(nav)
    const go = (e) => e.preventDefault() // el banco no navega

    // ---------- piezas ----------
    function label(text) { return h('span', { class: 'g-breadcrumbs__label', dir: 'auto', text }) }
    function dest(item, i, { current = false, here = false, measure = false } = {}) {
      const kids = []
      if (item.icon) kids.push(h('span', { class: 'g-breadcrumbs__icon', 'aria-hidden': 'true' }, [icon(item.icon)]))
      kids.push(label(item.label))
      if (here) kids.push(icon('check', 'g-breadcrumbs__here'))
      let el
      if (item.href) el = h('a', { class: 'g-breadcrumbs__link', href: item.href, 'aria-current': current ? 'page' : here ? 'true' : null, tabindex: measure ? '-1' : null, onclick: measure ? null : go }, kids)
      else el = h('span', { class: 'g-breadcrumbs__link g-breadcrumbs__link--text', 'aria-current': current ? 'page' : null }, kids)
      el._i = i
      return el
    }
    const roleOf = (i, n) => (n === 1 ? ['is-current'] : i === n - 1 ? ['is-current'] : i === 0 ? (n === 2 ? ['is-root', 'is-parent'] : ['is-root']) : i === n - 2 ? ['is-parent'] : ['is-mid'])

    function rowList(stage, { measure = false } = {}) {
      const n = S.items.length
      const ol = measure
        ? h('ol', { class: 'g-breadcrumbs__measure', 'aria-hidden': 'true', inert: true, 'data-stage': stage })
        : h('ol', { class: 'g-breadcrumbs__list' })
      for (let i = 0; i < n; i++) {
        const it = S.items[i]
        const li = h('li', { class: ['g-breadcrumbs__item', ...roleOf(i, n)].join(' ') })
        if (i === 0 && it.icon && (stage === 'root-icon' || stage === 'shrink')) li.classList.add('is-icon')
        if (i > 0) {
          const prev = S.items[i - 1]
          if (prev.children && prev.children.length) li.append(...door(i, prev, measure))
          else li.append(icon('chevron-right', 'g-breadcrumbs__sep g-icon--flip-rtl'))
        }
        li.append(dest(it, i, { current: i === n - 1, measure }))
        li._i = i
        ol.append(li)
      }
      return ol
    }
    function door(i, prev, measure) {
      const pid = `${id}-door-${i}`
      const btn = h('button', { type: 'button', class: 'g-breadcrumbs__door', 'aria-expanded': 'false', 'aria-controls': measure ? null : pid, 'aria-label': fill(S.labels.children, prev.label), tabindex: measure ? '-1' : null }, [icon('chevron-right', 'g-icon--flip-rtl')])
      btn._i = i
      if (measure) return [btn]
      const here = S.items[i]
      const match = (c) => (c.href && here.href ? c.href === here.href : c.label === here.label)
      const panel = h('ul', { class: 'g-breadcrumbs__panel', id: pid, popover: 'manual' }, prev.children.map((c, j) => h('li', {}, [dest(c, `${i}.${j}`, { here: match(c) })])))
      disclosure(btn, panel, '[aria-current="true"]')
      return [btn, panel]
    }
    function face() {
      const n = S.items.length
      const cur = S.items[n - 1]
      const out = []
      const f = h('div', { class: 'g-breadcrumbs__face' })
      let up = null
      for (let i = n - 2; i >= 0; i--) if (S.items[i].href) { up = i; break }
      if (up != null) {
        const a = h('a', { class: 'g-breadcrumbs__up', href: S.items[up].href, 'aria-label': fill(S.labels.up, S.items[up].label), onclick: go }, [icon('arrow-up'), label(S.items[up].label)])
        a._i = up
        f.append(a)
      }
      const pid = `${id}-stairs`
      const t = h('button', { type: 'button', class: 'g-breadcrumbs__toggle', 'aria-expanded': 'false', 'aria-controls': pid, 'aria-label': fill(S.labels.path, cur.label) }, [label(cur.label), icon('chevron-down', 'g-breadcrumbs__chevron')])
      t._i = 'toggle'
      f.append(t)
      const stairs = h('ol', { class: 'g-breadcrumbs__stairs', id: pid, popover: 'manual' }, S.items.map((it, i) => {
        const li = h('li', { class: 'g-breadcrumbs__stair' + (i === n - 1 ? ' is-current' : ''), style: `--_depth:${i}` }, [dest(it, i, { current: i === n - 1 })])
        return li
      }))
      disclosure(t, stairs, null)
      out.push(f, stairs)
      return out
    }

    // ---------- paneles: divulgación APG, capa superior, colocación de prueba (la real es placeBlock de bruno) ----------
    function disclosure(trigger, panel, entry) {
      trigger.addEventListener('click', () => (S.open && S.open.panel === panel ? close() : open(trigger, panel)))
      trigger.addEventListener('keydown', (e) => {
        if (e.key !== 'ArrowDown') return
        e.preventDefault()
        if (!S.open || S.open.panel !== panel) open(trigger, panel)
        const links = [...panel.querySelectorAll('a.g-breadcrumbs__link')]
        ;((entry && panel.querySelector(entry)) || links[0])?.focus()
      })
      panel.addEventListener('keydown', (e) => {
        const links = [...panel.querySelectorAll('a.g-breadcrumbs__link')]
        const k = links.indexOf(document.activeElement)
        if (k < 0) return
        const to = { ArrowDown: links[(k + 1) % links.length], ArrowUp: links[(k - 1 + links.length) % links.length], Home: links[0], End: links[links.length - 1] }[e.key]
        if (to) { e.preventDefault(); to.focus() }
      })
    }
    function place(trigger, panel) {
      const m = parseFloat(getComputedStyle(nav).getPropertyValue('--g-space-1')) || 4
      const r = trigger.getBoundingClientRect()
      const w = panel.offsetWidth, ph = panel.scrollHeight
      const rtl = rtlOf(nav)
      let x = rtl ? r.right - w : r.left
      if (!rtl && x + w > innerWidth - m * 2) x = r.right - w
      if (rtl && x < m * 2) x = r.left
      x = Math.max(m * 2, Math.min(x, innerWidth - w - m * 2))
      const below = innerHeight - r.bottom - m * 3, above = r.top - m * 3
      const side = ph <= below || below >= above ? 'bottom' : 'top'
      const max = Math.max(0, side === 'bottom' ? below : above)
      const hh = Math.min(ph, max)
      const y = side === 'bottom' ? r.bottom + m : r.top - m - hh
      panel.style.setProperty('--_x', x + 'px')
      panel.style.setProperty('--_y', y + 'px')
      panel.style.setProperty('--_max', max + 'px')
      panel.dataset.side = side
    }
    function open(trigger, panel) {
      close()
      trigger.setAttribute('aria-expanded', 'true')
      panel.style.setProperty('--_x', '0px'); panel.style.setProperty('--_y', '0px'); panel.style.setProperty('--_max', innerHeight + 'px')
      panel.showPopover()
      place(trigger, panel)
      S.open = { trigger, panel }
    }
    function close(back = false) {
      if (!S.open) return
      const { trigger, panel } = S.open
      trigger.setAttribute('aria-expanded', 'false')
      if (panel.matches(':popover-open')) panel.hidePopover()
      S.open = null
      if (back) trigger.focus()
    }
    nav.addEventListener('keydown', (e) => { if (e.key === 'Escape' && S.open) { e.preventDefault(); e.stopPropagation(); close(true) } })
    nav.addEventListener('focusout', (e) => {
      const to = e.relatedTarget
      if (S.open && to && !(S.open.panel.contains(to) || S.open.trigger === to)) close()
    })
    const outside = (e) => { if (S.open && !S.open.panel.contains(e.target) && !S.open.trigger.contains(e.target)) close() }
    document.addEventListener('pointerdown', outside)

    // ---------- etapas por lotes ----------
    const fits = (ol) => {
      const w = ol.getBoundingClientRect().width
      let sum = 0
      for (const li of ol.children) sum += li.getBoundingClientRect().width
      return sum <= w + 0.5
    }
    function choose() {
      const n = S.items.length
      const tries = ['liquid']
      if (S.items[0].icon && n > 1) tries.push('root-icon')
      tries.push('shrink')
      let probe = null, chosen = null
      for (const st of tries) {
        const m = rowList(st, { measure: true })
        if (probe) probe.replaceWith(m); else nav.append(m)
        probe = m
        if (fits(m)) { chosen = st; break }
      }
      probe.remove()
      return chosen || (n >= 2 ? 'step' : 'shrink')
    }
    function markClipped() {
      for (const li of nav.querySelectorAll('.g-breadcrumbs__list > .g-breadcrumbs__item:not(.is-leaving)')) {
        const l = li.querySelector('.g-breadcrumbs__label')
        const c = !li.classList.contains('is-icon') && l && l.scrollWidth > l.clientWidth + 1
        if (c) li.setAttribute('data-clipped', ''); else li.removeAttribute('data-clipped')
      }
    }
    function focusKey() {
      const a = document.activeElement
      if (!a || !nav.contains(a)) return null
      if (a.classList.contains('g-breadcrumbs__toggle')) return { kind: 'toggle' }
      if (a.closest('.g-breadcrumbs__stairs')) return { kind: 'stairs', i: a._i }
      if (a.classList.contains('g-breadcrumbs__door')) return { kind: 'door', i: a._i }
      return { kind: 'link', i: a._i }
    }
    function restore(k, stage) {
      if (!k) return
      const n = S.items.length
      let el = null
      if (stage === 'step') {
        const up = nav.querySelector('.g-breadcrumbs__up')
        el = k.kind === 'link' && up && up._i === k.i ? up : nav.querySelector('.g-breadcrumbs__toggle')
      } else {
        const links = [...nav.querySelectorAll('.g-breadcrumbs__list .g-breadcrumbs__item > a.g-breadcrumbs__link')]
        if (k.kind === 'door') el = [...nav.querySelectorAll('.g-breadcrumbs__list .g-breadcrumbs__door')].find((x) => x._i === k.i)
        const i = k.kind === 'link' || k.kind === 'stairs' || k.kind === 'door' ? k.i : n - 1
        el = el || links.find((x) => x._i === i) || links[links.length - 1]
      }
      el?.focus({ preventScroll: true })
    }
    function layout(force = false) {
      const st = choose()
      if (!force && st === S.stage) { markClipped(); return false }
      const k = focusKey()
      close()
      for (const x of nav.querySelectorAll('.g-breadcrumbs__list, .g-breadcrumbs__face, .g-breadcrumbs__stairs')) x.remove()
      if (st === 'step') nav.prepend(...face())
      else nav.prepend(rowList(st))
      nav.dataset.stage = st
      S.stage = st
      restore(k, st)
      markClipped()
      if (!S.ready) { S.ready = true; requestAnimationFrame(() => nav.classList.add('is-ready')) }
      return true
    }
    // El despliegue por foco cambia los anchos de las vecinas: data-clipped otra vez (solo cambia el fondo)
    nav.addEventListener('focusin', () => requestAnimationFrame(markClipped))
    nav.addEventListener('focusout', () => requestAnimationFrame(markClipped))

    let raf = 0
    const ro = new ResizeObserver(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => layout()) })
    if (opt.measure !== false) {
      layout(true)
      ro.observe(nav)
      if (document.fonts) { document.fonts.ready.then(() => layout(true)); document.fonts.addEventListener('loadingdone', () => layout(true)) }
    } else {
      // Etapa forzada (para el banco): sin medida
      const st = opt.stage || 'liquid'
      if (st === 'step') nav.prepend(...face()); else nav.prepend(rowList(st))
      nav.dataset.stage = st; S.stage = st
      requestAnimationFrame(() => { markClipped(); nav.classList.add('is-ready') })
    }

    // ---------- bajar y subir (regla de L13): entra el último o sale una copia inerte ----------
    function push(item) {
      S.items.push({ ...item })
      layout(true)
      if (S.stage === 'step' || !S.ready) return
      const li = [...nav.querySelectorAll('.g-breadcrumbs__list > .g-breadcrumbs__item')].pop()
      li.classList.add('is-entering')
      const done = (e) => { if (e.target === li && e.animationName === 'g-breadcrumbs-enter') { li.classList.remove('is-entering'); li.removeEventListener('animationend', done) } }
      li.addEventListener('animationend', done)
      setTimeout(() => li.classList.remove('is-entering'), 1000)
    }
    function pop() {
      if (S.items.length <= 1) return
      const before = S.stage
      const old = [...nav.querySelectorAll('.g-breadcrumbs__list > .g-breadcrumbs__item')].pop()
      const copy = before !== 'step' && !reduced() && old ? old.cloneNode(true) : null
      S.items.pop()
      layout(true)
      if (!copy || S.stage === 'step') return
      copy.classList.add('is-leaving')
      copy.setAttribute('aria-hidden', 'true')
      copy.inert = true
      copy.removeAttribute('data-clipped')
      for (const x of copy.querySelectorAll('[id]')) x.removeAttribute('id')
      for (const x of copy.querySelectorAll('[aria-controls]')) x.removeAttribute('aria-controls')
      for (const x of copy.querySelectorAll('[popover]')) x.remove()
      for (const x of copy.querySelectorAll('[aria-current]')) x.removeAttribute('aria-current')
      nav.querySelector('.g-breadcrumbs__list').append(copy)
      const done = () => copy.remove()
      copy.addEventListener('animationend', (e) => { if (e.animationName.startsWith('g-breadcrumbs-leave')) done() })
      copy.addEventListener('animationcancel', done)
      setTimeout(done, 600)
    }
    const ctrl = { id, nav, S, push, pop, close, open: (sel) => { const t = nav.querySelector(sel); t && t.click() }, relayout: () => { if (opt.measure !== false) layout(true) }, destroy() { ro.disconnect(); document.removeEventListener('pointerdown', outside); nav.remove() } }
    ;(window.__bc = window.__bc || new Map()).set(id, ctrl)
    return ctrl
  }
  window.XCrumbs = { mount, STAGES }
})()
