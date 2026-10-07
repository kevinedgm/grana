// Motor del prototipo de migas de pan (kiwi r01). Referencia de COMPORTAMIENTO, no de código: el componente real lo
// escribe bruno desde el contrato de lima. Sin dependencias; iconos solo Lucide vía window.lucide (design/lab/lucide-icons.js).
//
// Crumbs.mount(host, { items, concept: 'base'|'A'|'B'|'C', labels, onNavigate }) → controlador
//   items: [{ label, href?, icon?, children?: [{ label, href }] }]  (el último es la página actual)
//   labels: { nav, more ('{count} niveles más'), up ('Subir a {label}'), path ('Ruta hasta {label}'), children ('Otras páginas en {label}') }
(function () {
  'use strict'
  let uid = 0
  const tpl = (s, vars) => String(s || '').replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ''))
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches
  const isRtl = (node) => getComputedStyle(node).direction === 'rtl'

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

  // Etapas de cesión (base y C): el último (actual), el padre (subir uno) y la raíz se quedan; ceden los de en medio
  // empezando por la raíz; luego el actual se acorta (repite el título de la página), la raíz se queda en su icono,
  // cede el padre y por último la raíz.
  function stagesBase(n, rootIcon) {
    const out = [{ key: 'all' }]
    for (let k = 1; k <= n - 3; k++) out.push({ key: 'mid' + k, hide: [1, k] })
    const mid = n >= 4 ? [1, n - 3] : null
    out.push({ key: 'shrink', hide: mid, shrink: true })
    if (rootIcon) out.push({ key: 'rooticon', hide: mid, rootIcon: true, shrink: true })
    if (n >= 3) out.push({ key: 'parent', hide: [1, n - 2], rootIcon, shrink: true })
    if (n >= 2) out.push({ key: 'root', hide: [0, n - 2], shrink: true })
    return out
  }
  // A: la cesión es líquida (CSS: pesos de flex-shrink y mínimos; en medio y luego el padre). La raíz nunca se corta a
  // medias: entera o su icono. El actual (estás aquí) se acorta el último, en una etapa propia (un peso < 1 no basta:
  // CSS Flexbox reparte solo esa fracción del espacio negativo). Solo cuando ni las pastillas caben, se agrupan en +N (o, con
  // final: 'B', la cara de B).
  function stagesA(n, final, rootIcon) {
    const out = [{ key: 'liquid' }]
    if (rootIcon) out.push({ key: 'rooticon', rootIcon: true })
    out.push({ key: 'current', rootIcon, shrink: true })
    // Recomendación de kiwi: cuando ni las pastillas caben, la cara de B (subir + ruta) en lugar de «+N»
    if (final === 'B' && n >= 2) { out.push({ key: 'escalon', escalon: true }); return out }
    if (n >= 4) out.push({ key: 'mid', hide: [1, n - 3], rootIcon, shrink: true })
    if (n >= 3) out.push({ key: 'parent', hide: [1, n - 2], rootIcon, shrink: true })
    if (n >= 2) out.push({ key: 'root', hide: [0, n - 2], shrink: true })
    return out
  }

  function mount(host, opt) {
    const id = opt.id || 'bc' + ++uid
    const S = { items: opt.items.map((x) => ({ ...x })), concept: opt.concept || 'base', labels: opt.labels || {}, stage: null, open: null, tipTimer: 0 }
    if (!S.labels.nav && typeof console !== 'undefined') console.warn('[migas] falta labels.nav: el <nav> no tendría nombre')
    const nav = h('nav', { class: `bc bc--${S.concept}`, 'aria-label': S.labels.nav, id, 'data-concept': S.concept })
    const tip = h('div', { class: 'bc-tip', 'aria-hidden': 'true', hidden: true })
    host.append(nav)

    const go = (item, index, event) => { if (opt.onNavigate) opt.onNavigate({ item, index, event, id }) }

    // ---------- piezas ----------
    function link(item, i, { current = false, measure = false, here = false } = {}) {
      const kids = []
      if (item.icon) kids.push(icon(item.icon, 'bc__icon'))
      kids.push(h('span', { class: 'bc__label', dir: 'auto', text: item.label }))
      if (here) kids.push(icon('check', 'bc__here'))
      const base = { class: 'bc__link', 'aria-current': current ? 'page' : here ? 'true' : null, 'data-i': i }
      if (item.href) return h('a', { ...base, href: item.href, tabindex: measure ? '-1' : null, onclick: measure ? null : (e) => go(item, i, e) }, kids)
      base.class += ' bc__link--text'
      return h('span', base, kids)
    }
    const sep = () => icon('chevron-right', 'bc__sep g-icon--flip-rtl')

    // Divulgación (APG Disclosure Navigation): el foco se queda en el disparador; ↓ entra en la lista; Esc cierra y
    // devuelve el foco; salir con el foco, pulsar fuera o cambiar de etapa cierran.
    function disclosure(trigger, pop, { entry } = {}) {
      trigger.addEventListener('click', () => (S.open && S.open.pop === pop ? close() : open(trigger, pop)))
      trigger.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown') {
          e.preventDefault()
          if (!S.open || S.open.pop !== pop) open(trigger, pop)
          const links = [...pop.querySelectorAll('a.bc__link')]
          const first = (entry && pop.querySelector(entry)) || links[0]
          if (first) first.focus()
        }
      })
      pop.addEventListener('keydown', (e) => {
        const links = [...pop.querySelectorAll('a.bc__link')]
        const k = links.indexOf(document.activeElement)
        if (k < 0) return
        let to = null
        if (e.key === 'ArrowDown') to = links[(k + 1) % links.length]
        else if (e.key === 'ArrowUp') to = links[(k - 1 + links.length) % links.length]
        else if (e.key === 'Home') to = links[0]
        else if (e.key === 'End') to = links[links.length - 1]
        if (to) { e.preventDefault(); to.focus() }
      })
    }
    function open(trigger, pop) {
      close()
      hideTip()
      trigger.setAttribute('aria-expanded', 'true')
      pop.hidden = false
      pop.classList.remove('is-end')
      // Prototipo: alinear con el inicio del disparador y, si se sale del visor, con su final (el real: placeAround, #358)
      const r = pop.getBoundingClientRect()
      const rtl = isRtl(nav)
      if ((!rtl && r.right > innerWidth - 8) || (rtl && r.left < 8)) pop.classList.add('is-end')
      S.open = { trigger, pop }
    }
    function close(focusBack = false) {
      if (!S.open) return
      const { trigger, pop } = S.open
      trigger.setAttribute('aria-expanded', 'false')
      pop.hidden = true
      S.open = null
      if (focusBack) trigger.focus()
    }

    // ---------- base, A y C: lista horizontal ----------
    function renderList(stage, { measure = false } = {}) {
      const n = S.items.length
      const ol = h('ol', { class: 'bc__list' + (stage.shrink ? ' is-shrink' : '') + (stage.tight ? ' is-tight' : '') + (measure ? ' bc__measure' : ''), 'aria-hidden': measure ? 'true' : null, inert: measure ? true : null })
      let first = true
      for (let i = 0; i < n; i++) {
        const hidden = stage.hide && i >= stage.hide[0] && i <= stage.hide[1]
        if (hidden) {
          if (i === stage.hide[0]) { ol.append(moreItem(stage.hide, first, measure)); first = false }
          continue
        }
        const role = i === n - 1 ? 'is-current' : i === 0 ? 'is-root' : i === n - 2 ? 'is-parent' : 'is-mid'
        const li = h('li', { class: `bc__item ${role}` + (i === 0 && stage.rootIcon && S.items[0].icon ? ' is-icon' : ''), 'data-i': i })
        if (!first) li.append(...separatorOrDoor(i, measure))
        li.append(link(S.items[i], i, { current: i === n - 1, measure }))
        ol.append(li)
        first = false
      }
      if (S.concept === 'base' || S.concept === 'C') {
        // El actual se acorta como mucho hasta ~10ch (o su ancho natural si es más corto)
        ol.style.setProperty('--_cur-min', stage.tight ? '0px' : 'var(--_cur-floor)')
      }
      return ol
    }
    function separatorOrDoor(i, measure) {
      const parent = S.items[i - 1]
      if (S.concept !== 'C' || !parent.children || !parent.children.length) return [sep()]
      const pid = `${id}-kids-${i}`
      const door = h('button', { type: 'button', class: 'bc__door', 'aria-expanded': 'false', 'aria-controls': measure ? null : pid, 'aria-label': tpl(S.labels.children, { label: parent.label }), tabindex: measure ? '-1' : null }, [icon('chevron-right', 'g-icon--flip-rtl')])
      if (measure) return [door]
      const here = S.items[i]
      const pop = h('ul', { class: 'bc__pop', id: pid, hidden: true }, parent.children.map((c, j) => h('li', {}, [link(c, `${i}.${j}`, { here: c.href === here.href })])))
      disclosure(door, pop, { entry: '[aria-current="true"]' })
      return [door, pop]
    }
    function moreItem(range, first, measure) {
      const count = range[1] - range[0] + 1
      const li = h('li', { class: 'bc__item is-more' })
      if (!first) li.append(sep())
      const pid = `${id}-more`
      const btn = h('button', { type: 'button', class: 'bc__more', 'aria-expanded': 'false', 'aria-controls': measure ? null : pid, 'aria-label': tpl(S.labels.more, { count }), tabindex: measure ? '-1' : null, text: '+' + count })
      li.append(btn)
      if (!measure) {
        const pop = h('ol', { class: 'bc__pop', id: pid, hidden: true }, S.items.slice(range[0], range[1] + 1).map((it, k) => h('li', {}, [link(it, range[0] + k)])))
        li.append(pop)
        disclosure(btn, pop)
      }
      return li
    }

    // Mide el suelo del actual (~10ch o su ancho natural) una vez por datos
    function curFloor(list) {
      const cur = list.querySelector('.is-current')
      if (!cur) return
      const label = cur.querySelector('.bc__label')
      const ch = parseFloat(getComputedStyle(label).fontSize) * 0.55
      const extra = cur.getBoundingClientRect().width - label.getBoundingClientRect().width
      const floor = Math.min(cur.getBoundingClientRect().width, extra + ch * 10)
      nav.style.setProperty('--_cur-floor', floor + 'px')
    }

    const fits = (ol) => {
      const w = ol.getBoundingClientRect().width
      let sum = 0
      for (const li of ol.children) sum += li.getBoundingClientRect().width
      return sum <= w + 0.5
    }

    function layout() {
      if (S.concept === 'B') return
      const n = S.items.length
      const stages = S.concept === 'A' ? stagesA(n, opt.final, !!S.items[0].icon) : stagesBase(n, !!S.items[0].icon)
      // Pruebas en una lista de medida (aria-hidden, inert, sin ids): el DOM real solo cambia si cambia la etapa
      let chosen = null
      let probe = null
      for (const st of stages) {
        if (st.escalon) { chosen = st; break }
        const m = renderList(st, { measure: true })
        if (probe) probe.replaceWith(m); else nav.append(m)
        probe = m
        if (st.key === stages[0].key && S.concept !== 'A') curFloor(m)
        if (fits(m)) { chosen = st; break }
      }
      if (!chosen) chosen = { ...stages[stages.length - 1], tight: true }
      if (probe) probe.remove()
      const key = chosen.key + (chosen.tight ? '-tight' : '') + ':' + n
      if (S.stage === key) { markChips(); return }
      // Cambia la etapa: se conserva el foco (por índice) y se cierra lo abierto
      const act = document.activeElement
      const had = !!(act && nav.contains(act))
      const keep = had ? (act.classList.contains('bc__more') ? 'more' : act.getAttribute('data-i')) : null
      close()
      nav.querySelectorAll('.bcb, .bcb__stairs').forEach((x) => x.remove())
      const old = nav.querySelector('.bc__list:not(.bc__measure)')
      if (chosen.escalon) {
        if (old) old.remove()
        nav.prepend(...escalon())
        nav.classList.add('is-escalon')
      } else {
        nav.classList.remove('is-escalon')
        const ol = renderList(chosen)
        if (old) old.replaceWith(ol); else nav.prepend(ol)
      }
      if (!tip.isConnected) nav.append(tip)
      S.stage = key
      nav.dataset.stage = chosen.key + (chosen.tight ? '-tight' : '')
      if (had) {
        const back = keep === 'more' ? nav.querySelector('.bc__more') : keep != null ? nav.querySelector(`.bc__list:not(.bc__measure) .bc__link[data-i="${keep}"], .bcb [data-i="${keep}"]`) : null
        ;(back || nav.querySelector('.bc__more, .bcb__toggle') || nav.querySelector('.bc__link'))?.focus({ preventScroll: true })
      }
      markChips()
    }
    // A: una miga comprimida se pinta como pastilla (mismo relleno: solo cambia el fondo, sin bucle de medida)
    function markChips() {
      if (S.concept !== 'A') return
      for (const li of nav.querySelectorAll('.bc__list:not(.bc__measure) > .bc__item')) {
        const label = li.querySelector('.bc__label')
        li.classList.toggle('is-chip', !!label && !li.classList.contains('is-icon') && label.scrollWidth > label.clientWidth + 1)
      }
    }

    // ---------- B: escalón ----------
    function escalon() {
      const n = S.items.length
      const cur = S.items[n - 1]
      // Subir: el antepasado más cercano con página
      let up = null
      for (let i = n - 2; i >= 0; i--) if (S.items[i].href) { up = { item: S.items[i], i }; break }
      const face = h('div', { class: 'bcb' })
      if (up) {
        face.append(h('a', { class: 'bcb__up', href: up.item.href, 'aria-label': tpl(S.labels.up, { label: up.item.label }), 'data-i': up.i, onclick: (e) => go(up.item, up.i, e) }, [icon('arrow-up', 'bcb__icon'), h('span', { class: 'bc__label', dir: 'auto', text: up.item.label })]))
      }
      const pid = `${id}-path`
      const toggle = h('button', { type: 'button', class: 'bcb__toggle', 'aria-expanded': 'false', 'aria-controls': pid, 'aria-label': tpl(S.labels.path, { label: cur.label }) }, [h('span', { class: 'bc__label', dir: 'auto', text: cur.label }), icon('chevron-down', 'bcb__chev')])
      face.append(toggle)
      const stairs = h('ol', { class: 'bcb__stairs', id: pid, hidden: true }, S.items.map((it, i) => h('li', { class: 'bcb__step' + (i === n - 1 ? ' is-current' : ''), style: `--_d:${i}` }, [link(it, i, { current: i === n - 1 })])))
      disclosure(toggle, stairs)
      return [face, stairs]
    }
    function renderB() {
      nav.textContent = ''
      nav.append(...escalon(), tip)
      S.stage = 'B'
      nav.dataset.stage = 'B'
    }

    // ---------- pista visual (modo visual del motor, #433): solo enseña lo que ya está entero en el árbol ----------
    function truncatedText(a) {
      if (!a || !nav.contains(a) || a.closest('.bc__pop, .bcb__stairs, .bc__measure')) return null
      const label = a.querySelector('.bc__label')
      if (!label) return null
      const li = a.closest('.bc__item')
      if ((li && li.classList.contains('is-icon')) || label.scrollWidth > label.clientWidth + 1) return label.textContent
      return null
    }
    function showTip(a, text) {
      tip.textContent = text
      tip.hidden = false
      const n = nav.getBoundingClientRect(), r = a.getBoundingClientRect()
      tip.style.top = (r.bottom - n.top + 4) + 'px'
      if (isRtl(nav)) { tip.style.left = ''; tip.style.right = (n.right - r.right) + 'px' } else { tip.style.right = ''; tip.style.left = (r.left - n.left) + 'px' }
    }
    function hideTip() { clearTimeout(S.tipTimer); tip.hidden = true }

    nav.addEventListener('pointerover', (e) => {
      const a = e.target.closest('.bc__link, .bcb__up, .bcb__toggle')
      const text = truncatedText(a)
      clearTimeout(S.tipTimer)
      if (!text) { if (!e.target.closest('.bc-tip')) S.tipTimer = setTimeout(hideTip, 100); return }
      S.tipTimer = setTimeout(() => showTip(a, text), 350)
    })
    nav.addEventListener('pointerleave', () => { clearTimeout(S.tipTimer); S.tipTimer = setTimeout(hideTip, 100) })
    nav.addEventListener('focusin', (e) => {
      const a = e.target
      // A: la miga que recibe el foco por teclado se despliega en su sitio (los demás se comprimen más)
      if (S.concept === 'A' && a.matches('.bc__link') && a.matches(':focus-visible') && !a.closest('.bc__pop')) {
        nav.querySelectorAll('.is-unfold').forEach((x) => x.classList.remove('is-unfold'))
        a.closest('.bc__item')?.classList.add('is-unfold')
        hideTip()
        // Si ni desplegada cabe entera, la pista dice el nombre (el árbol ya lo tiene entero)
        requestAnimationFrame(() => { markChips(); if (document.activeElement === a) { const t = truncatedText(a); if (t) showTip(a, t) } })
        return
      }
      const text = a.matches(':focus-visible') ? truncatedText(a) : null
      if (text) showTip(a, text); else hideTip()
    })
    nav.addEventListener('focusout', (e) => {
      const to = e.relatedTarget
      if (S.concept === 'A') {
        const li = e.target.closest('.bc__item')
        if (li && !(to && li.contains(to))) { li.classList.remove('is-unfold'); requestAnimationFrame(markChips) }
      }
      hideTip()
      if (S.open && !(to && (S.open.pop.contains(to) || S.open.trigger === to))) {
        // Salir con el foco de la divulgación la cierra (el foco sigue su curso)
        if (to) close()
      }
    })
    nav.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return
      if (S.open) { e.preventDefault(); close(true); return }
      if (!tip.hidden) { e.preventDefault(); hideTip() }
    })
    const outside = (e) => { if (S.open && !S.open.pop.contains(e.target) && !S.open.trigger.contains(e.target)) close() }
    document.addEventListener('pointerdown', outside)

    // ---------- arranque ----------
    let ro = null
    if (S.concept === 'B') renderB()
    else {
      nav.append(tip)
      layout()
      // Medir fuera de la entrega del observador (un cuadro después): cambiar la lista dentro del callback provoca
      // «ResizeObserver loop» en WebKit
      let raf = 0
      ro = new ResizeObserver(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(layout) })
      ro.observe(nav)
      // Las medidas cambian al cargar la fuente sin que cambie el ancho del nav: volver a medir (también el real)
      if (document.fonts) { document.fonts.ready.then(() => { S.stage = null; layout() }); document.fonts.addEventListener('loadingdone', () => { S.stage = null; layout() }) }
    }

    // A: la ruta se extiende al bajar un nivel y se recoge al subir (navegación dentro de una SPA)
    function push(item) {
      S.items.push({ ...item })
      S.stage = null
      layout()
      const li = nav.querySelector('.bc__list:not(.bc__measure) > .bc__item:last-child')
      if (!li || reduced()) return
      li.classList.add('is-entering')
      const done = () => li.classList.remove('is-entering')
      li.addEventListener('animationend', done, { once: true })
      li.addEventListener('animationcancel', done, { once: true })
    }
    function pop() {
      if (S.items.length <= 1) return
      const li = nav.querySelector('.bc__list:not(.bc__measure) > .bc__item:last-child')
      const finish = () => { S.items.pop(); S.stage = null; layout() }
      if (!li || reduced()) return finish()
      li.classList.add('is-leaving')
      if (!li.getAnimations().length) return finish()
      li.addEventListener('animationend', finish, { once: true })
    }

    const ctrl = { id, nav, state: S, push, pop, close, relayout: () => { S.stage = null; layout() }, destroy() { ro && ro.disconnect(); document.removeEventListener('pointerdown', outside); nav.remove() } }
    ;(window.__bc = window.__bc || new Map()).set(id, ctrl)
    return ctrl
  }

  window.Crumbs = { mount, stagesBase, stagesA }
})()
