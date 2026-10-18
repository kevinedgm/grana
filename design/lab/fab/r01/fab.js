// Prototipo de kiwi (r01) del botón flotante con acciones. NO es el .vue de bruno: es un banco para decidir estructura.
// Un solo motor para la base y los tres conceptos (A · la pila que crece, B · arco con gesto, C · acción con cola).
// Semántica común: APG *Menu Button* + *Menu* (el motor que hoy tiene GMenu), con lo que el FAB añade: sitio en el borde,
// «se aparta», confirmación en el sitio, acuse en el FAB, velo táctil, regla de una activación por gesto.
// Iconos: solo Lucide (design/lab/lucide-icons.js). Colores, medidas y tiempos: tokens del tema por defecto.
;(function () {
  const Q = new URLSearchParams(location.search)
  if (Q.get('dir') === 'rtl') document.documentElement.dir = 'rtl'
  if (Q.get('theme') === 'dark') document.documentElement.dataset.theme = 'dark'

  const root = document.documentElement
  const css = (n) => getComputedStyle(root).getPropertyValue(n).trim()
  const SP = () => parseFloat(css('--g-space-1'))
  const msOf = (n) => { const v = css(n); return v.endsWith('ms') ? parseFloat(v) : parseFloat(v) * 1000 }
  const rtl = () => getComputedStyle(root).direction === 'rtl'
  const coarse = () => matchMedia('(pointer: coarse)').matches
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
  const norm = (s) => String(s).normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
  const ICONS = window.LUCIDE_ICONS
  const icon = (n, cls = '') => `<svg class="lab-ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICONS[n] || ''}</svg>`
  const hit = (a, b, g = 0) => a.left < b.right + g && a.right > b.left - g && a.top < b.bottom + g && a.bottom > b.top - g
  const box = (l, t, w, h) => ({ left: l, top: t, right: l + w, bottom: t + h, width: w, height: h })
  const raf2 = (fn) => requestAnimationFrame(() => requestAnimationFrame(fn))

  // ---------- Canal cortés de página (emula announcePage de utils/liveRegion.js, #533: 50 ms / 5000 ms) ----------
  const live = document.createElement('div')
  live.id = 'lab-live'; live.className = 'lab-sr'; live.setAttribute('role', 'status'); live.setAttribute('aria-live', 'polite')
  document.body.append(live)
  let liveT1 = 0, liveT2 = 0
  window.__announced = []
  function announce(text) {
    clearTimeout(liveT1); clearTimeout(liveT2)
    live.textContent = ''
    liveT1 = setTimeout(() => { live.textContent = text; window.__announced.push(text) }, 50)
    liveT2 = setTimeout(() => { live.textContent = '' }, 5000)
  }

  // ---------- Avisos de desarrollo (el componente real: console.warn con la guarda de #653) ----------
  window.__fabWarnings = []
  const seen = new Set()
  const warn = (owner, msg) => { const k = owner + '|' + msg; if (seen.has(k)) return; seen.add(k); window.__fabWarnings.push({ owner, msg }); console.info(`[Lab GFab] ${owner}: ${msg}`) }

  // ---------- Bordes compartidos (emula utils/edgeReserve.js con el orden propuesto, L6) ----------
  const EDGE_ORDER = { speech: 10, pageHeader: 15, status: 20, fab: 25 }
  const edges = new Map()
  const subs = new Set()
  window.labEdge = {
    EDGE_ORDER,
    set(owner, edge, px, order) { if (!(px > 0)) edges.delete(owner); else edges.set(owner, { edge, px, order }); subs.forEach((f) => f()) },
    sum(edge, before) { let t = 0; for (const v of edges.values()) if (v.edge === edge && (before === undefined || v.order < before)) t += v.px; return t },
    sub(f) { subs.add(f) }
  }

  // ---------- Validación (nunca se descarta en silencio; nunca lanza) ----------
  function normalize(raw, owner, concept) {
    const out = []
    const ids = new Map()
    if (!Array.isArray(raw)) { warn(owner, '`items` debe ser un arreglo'); return out }
    raw.forEach((it, i) => {
      if (!it || typeof it.label !== 'string' || !it.label.trim()) { warn(owner, `elemento ${i} sin \`label\`: no se pinta (una acción sin nombre no se puede anunciar ni operar)`); return }
      if (it.id === undefined || it.id === null || it.id === '') { warn(owner, `«${it.label}» sin \`id\`: no se pinta`); return }
      if (ids.has(it.id)) warn(owner, `\`id\` duplicado «${it.id}» («${ids.get(it.id)}» y «${it.label}»): se pintan los dos; \`select\` lleva \`item\` para distinguirlos`)
      else ids.set(it.id, it.label)
      if (it.icon && !ICONS[it.icon]) warn(owner, `icono «${it.icon}» fuera de la lista: «${it.label}» sin icono`)
      if (it.danger && it.confirm === undefined) warn(owner, `«${it.label}» es peligrosa sin \`confirm\`: se confirma con su etiqueta como pregunta`)
      out.push({ ...it, _k: String(i) })
    })
    if (out.length > 15) warn(owner, `${out.length} acciones (más de 15): se pintan todas, en panel; con tantas, valora una página de acciones o \`GMenu\` con submenús`)
    if (concept === 'B' && out.some((x) => !x.icon || !ICONS[x.icon])) warn(owner, 'el arco necesita icono en cada acción: se resuelve a pila')
    return out
  }

  let uid = 0
  function create(host, o) {
    const id = o.id || `lab-fab-${++uid}`
    const concept = o.concept
    const L = o.labels
    const position = o.position || 'bottom-end'
    const [edge, align] = position.split('-')
    const outUp = edge === 'bottom'
    const anchor = o.anchor || 'container'
    const items = normalize(o.items, id, concept)
    const main = concept === 'C' && o.main != null ? items.find((x) => x.id === o.main) || null : null
    const rest = main ? items.filter((x) => x !== main) : items
    const physRight = () => (align === 'end') !== rtl()
    const st = { open: false, phase: 'closed', sub: false, confirm: null, buf: '', bufT: 0, find: '', busy: new Map(), failed: new Map(), ack: null, ackT: 0, tuck: false, appearance: null, gesture: null, suppress: false, aimed: null, closeT: 0 }

    const el = document.createElement('div')
    el.className = 'lab-fab'; el.id = id
    Object.assign(el.dataset, { concept, position, anchor, state: 'closed' })
    host.append(el)
    const api = { id, el, st, items, open: () => openMenu({}), close: () => closeMenu({ focus: true }) }
    ;(window.__fabs ||= {})[id] = api

    // ---------------- Disparador ----------------
    const single = items.length === 1 || (main && rest.length === 0)
    const status = `<span class="lab-sr" id="${id}-status"></span>`
    const badge = '<span class="lab-fab__badge" aria-hidden="true"></span>'
    let trigger, mainBtn
    if (items.length === 0) {
      // Sin acciones: no hay botón ni panel vacío (los permisos pueden quitarlas todas: sin aviso)
      el.dataset.empty = ''
      api.appearance = 'empty'
      return api
    }
    if (single) {
      const it = main || items[0]
      const why = reasonOf(it)
      el.innerHTML = `<button type="button" class="lab-fab__trigger lab-fab__trigger--single" id="${id}-trigger" aria-describedby="${id}-status"${why ? ' aria-disabled="true"' : ''}>${icon(it.icon, 'lab-fab__ic-open')}<span class="lab-sr">${esc(it.label)}</span>${badge}</button>${status}`
      trigger = el.querySelector('.lab-fab__trigger')
      if (why) el.querySelector(`#${id}-status`).textContent = why
      trigger.addEventListener('click', (e) => { if (e.detail > 1 || trigger.getAttribute('aria-disabled') === 'true') return; selectItem(it, e) })
      st.appearance = 'single'
    } else if (main) {
      el.innerHTML = `<div class="lab-fab__split" role="group" aria-label="${esc(o.label)}"><button type="button" class="lab-fab__main" id="${id}-main" aria-describedby="${id}-status">${icon(main.icon)}<span class="lab-fab__main-label">${esc(main.label)}</span>${badge}</button><button type="button" class="lab-fab__trigger" id="${id}-trigger" aria-haspopup="menu" aria-expanded="false" aria-controls="${id}-menu">${icon('ellipsis-vertical', 'lab-fab__ic-open')}${icon('x', 'lab-fab__ic-close')}<span class="lab-sr">${esc(L.moreShort)}</span></button></div>${status}`
      mainBtn = el.querySelector('.lab-fab__main')
      trigger = el.querySelector('.lab-fab__trigger')
      mainBtn.addEventListener('click', (e) => { if (e.detail > 1 || st.busy.has(main.id)) return; selectItem(main, e) })
    } else {
      el.innerHTML = `<button type="button" class="lab-fab__trigger" id="${id}-trigger" aria-haspopup="menu" aria-expanded="false" aria-controls="${id}-menu" aria-describedby="${id}-status">${icon(o.icon || 'plus', 'lab-fab__ic-open')}${icon('x', 'lab-fab__ic-close')}<span class="lab-sr">${esc(o.label)}</span>${badge}</button>${status}`
      trigger = el.querySelector('.lab-fab__trigger')
    }
    api.trigger = trigger
    const statusEl = el.querySelector(`#${id}-status`)

    // ---------------- Listas (popover manual en la capa superior; en el DOM, justo después del disparador) ----------------
    const menu = document.createElement('ul')
    menu.className = 'lab-fab__menu'; menu.id = `${id}-menu`; menu.setAttribute('role', 'menu'); menu.setAttribute('popover', 'manual')
    menu.setAttribute('aria-labelledby', `${id}-trigger`); menu.dataset.concept = concept; menu.dataset.state = 'closed'
    const sub = document.createElement('ul')
    sub.className = 'lab-fab__menu lab-fab__menu--panel'; sub.id = `${id}-more`; sub.setAttribute('role', 'menu'); sub.setAttribute('popover', 'manual')
    sub.setAttribute('aria-labelledby', `${id}-tail`); sub.dataset.concept = concept === 'C' ? 'C-sub' : concept; sub.dataset.state = 'closed'
    const scrim = document.createElement('div')
    scrim.className = 'lab-fab__scrim'; scrim.setAttribute('popover', 'manual'); scrim.setAttribute('aria-hidden', 'true')
    // Contenedor desplazable con foco itinerante: tabindex=-1 (#570); si no, Chromium hace del panel una parada de Tab
    menu.tabIndex = -1; sub.tabIndex = -1
    el.after(menu); menu.after(sub); sub.after(scrim)
    Object.assign(api, { menu, sub, scrim })

    // ---------------- Estado de cada acción ----------------
    function reasonOf(it) { return typeof it.disabled === 'string' ? it.disabled : st && st.busy && st.busy.get(it.id) }
    function isOff(it) { return Boolean(it.disabled) || st.busy.has(it.id) }
    const byK = (k) => items.find((x) => x._k === k)

    function itemHTML(it, { more = false, count = 0, panel = false } = {}) {
      if (more) {
        return `<li role="none" data-k="more"><button type="button" role="menuitem" tabindex="-1" class="lab-fab__item lab-fab__item--more" data-k="more" id="${id}-tail" aria-haspopup="menu" aria-expanded="false" aria-controls="${id}-more">${icon('ellipsis-vertical')}<span class="lab-fab__text"><span class="lab-fab__label">${esc(L.more.replace('{count}', count))}</span></span></button></li>`
      }
      const off = isOff(it)
      const why = reasonOf(it) || st.failed.get(it.id) || ''
      const dId = `${id}-d-${it._k}`, wId = `${id}-w-${it._k}`
      const desc = panel && it.description ? `<span class="lab-fab__desc" id="${dId}">${esc(it.description)}</span>` : (it.description ? `<span class="lab-fab__desc" id="${dId}">${esc(it.description)}</span>` : '')
      const whyEl = why ? `<span class="lab-fab__desc lab-fab__why" id="${wId}" style="display:block">${esc(why)}</span>` : ''
      const by = [it.description ? dId : '', why ? wId : ''].filter(Boolean).join(' ')
      return `<li role="none" data-k="${it._k}"><button type="button" role="menuitem" tabindex="-1" class="lab-fab__item${it.danger ? ' lab-fab__item--danger' : ''}" data-k="${it._k}"${off ? ' aria-disabled="true"' : ''}${by ? ` aria-describedby="${by}"` : ''}>${icon(it.icon)}<span class="lab-fab__text"><span class="lab-fab__label">${esc(it.label)}</span>${desc}${whyEl}</span>${it.danger ? icon('triangle-alert', 'lab-fab__mark') : ''}</button></li>`
    }
    function panelHTML(list, { find = false } = {}) {
      const order = []
      const groups = new Map()
      for (const it of list) { const g = it.group || ''; if (!groups.has(g)) { groups.set(g, []); order.push(g) } groups.get(g).push(it) }
      let h = find ? `<li role="none" class="lab-fab__find" aria-hidden="true"><span class="lab-fab__find-text">${esc(L.findHint)}</span></li>` : ''
      order.sort((a, b) => (a === '' ? -1 : b === '' ? 1 : 0))
      order.forEach((g, gi) => {
        const body = groups.get(g).map((it) => itemHTML(it, { panel: true })).join('')
        if (!g) h += body
        else h += `<li role="none" data-group="${gi}"><div class="lab-fab__group-title" id="${id}-g${gi}${find ? '' : '-s'}" role="presentation">${esc(g)}</div><ul role="group" aria-labelledby="${id}-g${gi}${find ? '' : '-s'}">${body}</ul></li>`
      })
      return h
    }
    const focusables = (ul) => [...ul.querySelectorAll('.lab-fab__item')].filter((b) => !b.closest('[hidden]') && b.getClientRects().length)

    // ---------------- Geometría ----------------
    function bounds() {
      const p = SP() * 4
      const r = anchor === 'viewport' ? { left: 0, top: 0, right: innerWidth, bottom: innerHeight } : o.container.getBoundingClientRect()
      const l = Math.max(r.left, 0), t = Math.max(r.top, 0) + (anchor === 'viewport' ? labEdge.sum('top') : 0), rr = Math.min(r.right, innerWidth), b = Math.min(r.bottom, innerHeight)
      return { left: l + p, top: t + p, right: rr - p, bottom: b - p, width: rr - l - 2 * p, height: b - t - 2 * p, narrow: r.right - r.left < SP() * 130, raw: r }
    }
    // Caja natural del FAB (sin el desplazamiento de «se aparta»): sale de las reglas de anclaje, no de la caja pintada
    function rootRect() {
      const p = SP() * 4
      const c = o.container
      // El FAB se coloca respecto de la caja de relleno del contenedor (dentro de su borde)
      const r = anchor === 'viewport' ? { left: 0, top: 0, right: innerWidth, bottom: innerHeight } : (() => { const b = c.getBoundingClientRect(); const l = b.left + c.clientLeft, t = b.top + c.clientTop; return { left: l, top: t, right: l + c.clientWidth, bottom: t + c.clientHeight } })()
      const w = el.offsetWidth, h = el.offsetHeight, res = parseFloat(el.style.getPropertyValue('--_reserve')) || 0
      const top = outUp ? r.bottom - p - res - h : r.top + p + res
      const left = align === 'center' ? (r.left + r.right) / 2 - w / 2 : physRight() ? r.right - p - w : r.left + p
      return box(left, top, w, h)
    }
    function triggerRect() { const rr = rootRect(); return box(rr.left + trigger.offsetLeft, rr.top + trigger.offsetTop, trigger.offsetWidth, trigger.offsetHeight) }
    const setVars = (n, vars) => { for (const [k, v] of Object.entries(vars)) n.style.setProperty(k, typeof v === 'number' ? `${Math.round(v * 100) / 100}px` : v) }
    const pillH = () => (coarse() ? 44 : Math.max(SP() * 10, 24))

    // Pila: cuántas caben (≤ 5) entre el FAB y el margen seguro
    function stackFit(n) {
      const b = bounds(), f = rootRect(), gap = SP() * 2
      const avail = outUp ? f.top - SP() * 3 - b.top : b.bottom - f.bottom - SP() * 3
      return Math.max(0, Math.min(n, 5, Math.floor((avail + gap) / (pillH() + gap))))
    }
    function placeStack() {
      const b = bounds(), f = rootRect()
      const mr = menu.getBoundingClientRect(), w = mr.width, h = mr.height // caja fraccionaria: los bordes de las píldoras quedan exactos
      let x = align === 'center' ? f.left + f.width / 2 - w / 2 : physRight() ? f.right - w : f.left
      x = Math.min(Math.max(x, b.left), b.right - w)
      const y = outUp ? f.top - SP() * 3 - h : f.bottom + SP() * 3
      setVars(menu, { '--_x': x, '--_y': y })
      // Cada acción sale del centro del FAB (vector hasta su sitio, sin contar transformaciones en curso) y la más cercana primero
      const lis = [...menu.children]
      const cx = f.left + f.width / 2, cy = f.top + f.height / 2
      const near = outUp ? lis.slice().reverse() : lis
      near.forEach((li, i) => {
        const lx = x + li.offsetLeft + li.offsetWidth / 2, ly = y + li.offsetTop + li.offsetHeight / 2
        setVars(li, { '--_fx': cx - lx, '--_fy': cy - ly })
        li.style.setProperty('--_i', String(Math.min(i, 4)))
      })
    }
    function placePanel(ul, from) {
      const b = bounds(), f = rootRect()
      const w = b.narrow ? b.width : Math.min(SP() * 80, b.width)
      setVars(ul, { '--_w': w })
      const avail = Math.max(SP() * 20, outUp ? from.top - SP() * 3 - b.top : b.bottom - from.bottom - SP() * 3)
      setVars(ul, { '--_max': avail })
      const h = Math.min(ul.scrollHeight, avail)
      let x = b.narrow ? b.left : align === 'center' ? f.left + f.width / 2 - w / 2 : physRight() ? f.right - w : f.left
      x = Math.min(Math.max(x, b.left), b.right - w)
      const y = outUp ? from.top - SP() * 3 - h : from.bottom + SP() * 3
      setVars(ul, { '--_x': x, '--_y': y })
      return { x, y, w, h }
    }
    // Arco: radio mínimo que separa círculos y etiquetas sin solaparse y sin salir de los límites; si no hay, null
    function arcLayout(lis, rLimit) {
      const b = bounds(), f = triggerRect()
      const cx = f.left + f.width / 2, cy = f.top + f.height / 2
      const d = 44
      const n = lis.length
      // Esquina: cuarto de círculo desde «arriba» hacia el interior; centro: semicírculo de un lado al otro
      let a0 = 90, a1 = physRight() ? 180 : 0
      if (align === 'center') { a0 = rtl() ? 0 : 180; a1 = rtl() ? 180 : 0 }
      const sgn = outUp ? 1 : -1
      const step = n > 1 ? (a1 - a0) / (n - 1) : 0
      const sizes = lis.map((li) => { const s = li.querySelector('.lab-fab__label'); return { w: s.offsetWidth, h: s.offsetHeight } })
      const rMin = Math.max(f.width / 2 + d / 2 + SP() * 3, n > 1 ? (d + SP() * 2) / (2 * Math.sin((Math.abs(step) * Math.PI) / 360)) : 0)
      const fab = box(f.left - SP(), f.top - SP(), f.width + SP() * 2, f.height + SP() * 2)
      let why = ''
      for (let r = rMin; r <= rLimit; r += 4) {
        const out = []
        let ok = true
        for (let i = 0; i < n && ok; i++) {
          const a = ((a0 + step * i) * Math.PI) / 180
          const c = Math.cos(a), s = Math.sin(a) * sgn
          const ix = cx + r * c, iy = cy - r * s
          const ib = box(ix - d / 2, iy - d / 2, d, d)
          const off = d / 2 / Math.max(Math.abs(c), Math.abs(s)) + SP() * 2 // la esquina de la etiqueta libra la caja del círculo
          const px = ix + off * c, py = iy - off * s
          const { w, h } = sizes[i]
          // Etiqueta por fuera: hacia el lado del ángulo; casi vertical, hacia el interior (en una esquina) o centrada
          const inward = align === 'center' ? px - w / 2 : physRight() ? px + d / 2 - w : px - d / 2
          let lx = c < -0.35 ? px - w : c > 0.35 ? px : inward
          let ly = s > 0.35 ? py - h : s < -0.35 ? py : py - h / 2
          lx = Math.min(Math.max(lx, b.left), b.right - w)
          ly = Math.min(Math.max(ly, b.top), b.bottom - h)
          const lb = box(lx, ly, w, h)
          for (const q of [ib, lb]) if (q.left < b.left || q.top < b.top || q.right > b.right || q.bottom > b.bottom) { ok = false; why ||= `fuera de los límites (r ${Math.round(r)}, ${i})` } else if (hit(q, fab)) { ok = false; why ||= `sobre el FAB (r ${Math.round(r)}, ${i})` }
          if (hit(ib, lb)) { ok = false; why ||= `etiqueta sobre su círculo (r ${Math.round(r)}, ${i})` }
          for (const p of out) if (hit(ib, p.ib, 2) || hit(lb, p.lb, 2) || hit(ib, p.lb, 2) || hit(lb, p.ib, 2)) { ok = false; why ||= `solape (r ${Math.round(r)}, ${i})` }
          out.push({ ib, lb, ix, iy })
        }
        if (ok) { st.arcWhy = ''; return { r, cx, cy, d, b, out } }
      }
      st.arcWhy = why || `radio mínimo ${Math.round(rMin)}px > ${Math.round(rLimit)}px` // por qué no cupo (el último intento): queda en data-fallback-why para la verificación
      return null
    }

    // ---------------- Pintado según la forma resuelta ----------------
    // Política `auto` (medible): 0 → nada; 1 → botón que ejecuta; base: ≤ 5 y caben → pila, si no → caja;
    // A: pila de las que caben (≤ 5), con cola «N más» si sobran; B: arco solo si se pide y cabe (si no, pila de A);
    // C: la principal en el FAB y el resto en el panel.
    function render() {
      menu.innerHTML = ''
      menu.classList.remove('lab-fab__menu--stack', 'lab-fab__menu--panel', 'lab-fab__menu--arc')
      st.overflow = []
      st.fallback = ''
      let ap
      const iconsOk = rest.every((x) => x.icon && ICONS[x.icon])
      if (concept === 'C') ap = 'panel'
      else if (concept === 'base') ap = rest.length <= 5 && stackFit(rest.length) >= rest.length ? 'stack' : 'panel'
      else if (concept === 'B' && iconsOk && !bounds().narrow) ap = 'arc' // en móvil (< space × 130), lista antes que radial
      else ap = 'stack'
      if (concept === 'B' && ap !== 'arc') st.fallback = 'arc'
      if (ap === 'arc') {
        const ok = renderArc()
        if (!ok) { st.fallback = 'arc'; ap = 'stack'; menu.innerHTML = '' }
      }
      if (ap === 'stack' && concept !== 'base') {
        const k = stackFit(rest.length)
        if (k <= 1 && rest.length > 1) ap = 'panel'
        else renderStack(k)
      } else if (ap === 'stack') renderStack(5)
      if (ap === 'panel') renderPanel()
      st.appearance = ap
      el.dataset.appearance = ap
      menu.dataset.appearance = ap
      if (st.fallback) { el.dataset.fallback = st.fallback; el.dataset.fallbackWhy = st.arcWhy || (bounds().narrow ? 'móvil (< space × 130)' : '') } else { delete el.dataset.fallback; delete el.dataset.fallbackWhy }
    }
    function coarseNarrow() { return bounds().narrow && coarse() }
    function renderStack(k) {
      menu.classList.add('lab-fab__menu--stack')
      menu.dataset.align = align
      const shown = rest.length > k ? rest.slice(0, Math.max(k - 1, 0)) : rest
      st.overflow = rest.length > k ? rest.slice(shown.length) : []
      const parts = shown.map((it) => itemHTML(it))
      if (st.overflow.length) parts.push(itemHTML(null, { more: true, count: st.overflow.length }))
      // El orden nace del FAB: la primera acción es la más cercana. Si la pila sube, el DOM va de arriba abajo
      // (lo lejano primero) y la más importante queda la última, junto al FAB (como iOS con `.priority`).
      menu.innerHTML = (outUp ? parts.reverse() : parts).join('')
    }
    function renderPanel() {
      menu.classList.add('lab-fab__menu--panel')
      menu.innerHTML = panelHTML(rest, { find: concept === 'C' })
    }
    // Arco: alcance del pulgar. Prueba con todas las que admite (≤ 6, sin peligrosas) y quita de una en una hacia «Más»
    // hasta que el radio que separa círculos y etiquetas quepa en `space × 50` (200px, alcance del pulgar desde la esquina; `?reach=` lo cambia en el laboratorio); si ni con dos cabe, no hay arco.
    function renderArc() {
      menu.classList.add('lab-fab__menu--arc')
      const eligible = rest.filter((x) => !x.danger)
      const danger = rest.filter((x) => x.danger)
      const b = bounds()
      setVars(menu, { '--_x': b.left, '--_y': b.top, '--_w': b.width })
      menu.style.setProperty('block-size', `${b.height}px`)
      for (let m = Math.min(eligible.length, 6); m >= 2; m--) {
        let shown = eligible.slice(0, m), over = eligible.slice(m).concat(danger)
        if (over.length && shown.length + 1 > 6) { shown = shown.slice(0, 5); over = eligible.slice(5).concat(danger) }
        const parts = shown.map((it) => itemHTML(it))
        if (over.length) parts.push(itemHTML(null, { more: true, count: over.length }))
        menu.innerHTML = parts.join('')
        if (!menu.matches(':popover-open')) { menu.style.visibility = 'hidden'; menu.showPopover() }
        const lay = arcLayout([...menu.children], SP() * Number(new URLSearchParams(location.search).get("reach") || 50))
        menu.style.visibility = ''
        if (!lay) continue
        st.overflow = over
        ;[...menu.children].forEach((li, i) => {
          const q = lay.out[i]
          setVars(li, { '--_ix': q.ib.left - lay.b.left, '--_iy': q.ib.top - lay.b.top, '--_d': lay.d, '--_fx': lay.cx - q.ix, '--_fy': lay.cy - q.iy })
          li.style.setProperty('--_i', String(Math.min(i, 4)))
          const lab = li.querySelector('.lab-fab__label')
          setVars(lab, { '--_lx': q.lb.left - q.ib.left, '--_ly': q.lb.top - q.ib.top })
        })
        st.arc = lay
        el.dataset.arcRadius = String(Math.round(lay.r))
        el.dataset.arcCount = String(shown.length)
        return true
      }
      if (menu.matches(':popover-open')) menu.hidePopover()
      menu.style.removeProperty('block-size'); menu.classList.remove('lab-fab__menu--arc')
      return false
    }
    function place() {
      if (st.appearance === 'stack') placeStack()
      else if (st.appearance === 'panel') placePanel(menu, triggerRect())
      if (st.sub) placeSub()
      if (st.scrimOn) placeScrim()
    }

    // ---------------- Abrir y cerrar ----------------
    // Mientras se cierra, la lista es inerte: ni el Tab ni un clic tardío llegan a ella (sin estados a medias)
    function setPhase(p) { st.phase = p; el.dataset.state = p; menu.dataset.state = p; menu.inert = p === 'closing' }
    function openMenu({ at = 'first', viaGesture = false } = {}) {
      if (single) return
      clearTimeout(st.closeT)
      const wasOpen = st.open
      st.open = true
      setTuck(false)
      trigger.setAttribute('aria-expanded', 'true')
      if (!wasOpen) {
        if (coarse()) showScrim()
        if (menu.matches(':popover-open')) menu.hidePopover()
        render()
        if (!menu.matches(':popover-open')) menu.showPopover()
        setPhase('opening')
        place()
        if (concept === 'C' && st.appearance === 'panel') clipFrom()
        menu.getBoundingClientRect()
        raf2(() => { if (st.open) setPhase('open') })
      } else setPhase('open')
      if (!viaGesture) {
        const els = focusables(menu)
        // Pila que sube: la primera acción es la última del DOM (junto al FAB); panel y arco: la primera
        const nearest = st.appearance === 'stack' && outUp ? els[els.length - 1] : els[0]
        const far = st.appearance === 'stack' && outUp ? els[0] : els[els.length - 1]
        focusEl(at === 'far' ? far : nearest)
      }
      if (o.onOpen) o.onOpen()
    }
    function closeMenu({ focus = false } = {}) {
      if (!st.open) return
      st.open = false
      st.confirm = null; st.find = ''; st.buf = ''
      closeSub(false)
      for (const ul of [menu, sub]) for (const x of ul.querySelectorAll('.lab-fab__item')) x.tabIndex = -1 // nada de la lista que se cierra queda en el Tab
      trigger.setAttribute('aria-expanded', 'false')
      setPhase('closing')
      hideScrim()
      if (focus) trigger.focus({ preventScroll: true })
      st.closeT = setTimeout(() => { if (!st.open) { if (menu.matches(':popover-open')) menu.hidePopover(); setPhase('closed'); menu.style.removeProperty('block-size') } }, msOf('--g-duration-press') + 20)
      if (o.onClose) o.onClose()
    }
    // C: el panel nace con el tamaño de la cola, en su borde más cercano, y crece hasta su caja (transformación de contenedor)
    function clipFrom() {
      const t = triggerRect()
      const x = parseFloat(menu.style.getPropertyValue('--_x')), w = menu.offsetWidth, h = menu.offsetHeight
      const left = Math.min(Math.max(t.left - x, 0), Math.max(w - t.width, 0))
      const right = Math.max(w - t.width - left, 0)
      const top = outUp ? Math.max(h - t.height, 0) : 0, bottom = outUp ? 0 : Math.max(h - t.height, 0)
      menu.style.setProperty('--_clip-from', `inset(${top}px ${right}px ${bottom}px ${left}px round var(--g-radius-pill))`)
    }
    function openSub(focusFirst) {
      if (!st.overflow.length) return
      st.sub = true
      const tail = menu.querySelector('[data-k="more"] .lab-fab__item')
      tail.setAttribute('aria-expanded', 'true')
      sub.innerHTML = panelHTML(st.overflow)
      if (!sub.matches(':popover-open')) sub.showPopover()
      sub.dataset.state = 'opening'
      placeSub()
      raf2(() => { if (st.sub) sub.dataset.state = 'open' })
      if (focusFirst) focusEl(focusables(sub)[0])
    }
    function placeSub() {
      const b = bounds()
      let from = st.appearance === 'stack' ? menu.getBoundingClientRect() : triggerRect()
      const room = outUp ? from.top - b.top : b.bottom - from.bottom
      const stack = st.appearance === 'stack' ? menu.getBoundingClientRect() : null
      // Poco sitio: el panel cubre la pila entera (cascada, como GMenu) y no deja píldoras asomando
      const cover = room < SP() * 40
      setVars(sub, { '--_minh': cover && stack ? stack.height + SP() : 0 }) // + space × 1: la sombra de las píldoras tampoco asoma
      if (cover) from = triggerRect()
      placePanel(sub, from)
    }
    function closeSub(focusTail) {
      if (!st.sub) return
      st.sub = false
      const tail = menu.querySelector('[data-k="more"] .lab-fab__item')
      if (tail) tail.setAttribute('aria-expanded', 'false')
      if (sub.matches(':popover-open')) sub.hidePopover()
      sub.dataset.state = 'closed'
      if (focusTail && tail) focusEl(tail)
    }
    function showScrim() {
      st.scrimOn = true
      clearTimeout(st.scrimT)
      placeScrim()
      if (!scrim.matches(':popover-open')) scrim.showPopover()
    }
    // El velo cubre la pantalla (o el contenedor) salvo el FAB: el FAB sigue siendo el cierre (hueco con clip-path evenodd)
    function placeScrim() {
      const r = anchor === 'viewport' ? { left: 0, top: 0, width: innerWidth, height: innerHeight } : o.container.getBoundingClientRect()
      setVars(scrim, { '--_x': r.left, '--_y': r.top, '--_w': r.width, '--_h': r.height })
      const f = rootRect(), g = SP()
      const x = f.left - r.left - g, y = f.top - r.top - g, w = f.width + 2 * g, h = f.height + 2 * g
      scrim.style.clipPath = `path(evenodd, 'M0 0 H${r.width} V${r.height} H0 Z M${x} ${y} h${w} v${h} h${-w} Z')`
    }
    // El velo se retira un poco después de cerrar: el clic que sigue al toque cae en él y no en lo de debajo
    function hideScrim() { st.scrimOn = false; clearTimeout(st.scrimT); st.scrimT = setTimeout(() => { if (!st.scrimOn && scrim.matches(':popover-open')) scrim.hidePopover() }, 400) }
    scrim.addEventListener('pointerdown', (e) => { e.preventDefault() })
    scrim.addEventListener('pointerup', () => { if (st.open) closeMenu({ focus: false }) })
    scrim.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); if (st.open) closeMenu({ focus: false }) })

    // ---------------- Foco ----------------
    function focusEl(b) {
      if (!b) return
      for (const ul of [menu, sub]) for (const x of ul.querySelectorAll('.lab-fab__item')) x.tabIndex = -1
      b.tabIndex = 0
      b.focus({ preventScroll: true })
      const sc = b.closest('.lab-fab__menu--panel')
      if (sc) { const r = b.getBoundingClientRect(), s = sc.getBoundingClientRect(); if (r.top < s.top) sc.scrollTop -= s.top - r.top + SP() * 2; else if (r.bottom > s.bottom) sc.scrollTop += r.bottom - s.bottom + SP() * 2 }
    }

    // ---------------- Activar ----------------
    function onItemClick(e) {
      const b = e.target.closest('.lab-fab__item')
      if (!b) return
      if (e.detail > 1) return // segundo clic de un doble clic: nunca una segunda acción
      if (st.phase === 'closing' || !st.open) return
      const k = b.dataset.k
      if (k === 'more') { st.sub ? closeSub(true) : openSub(true); return }
      if (b.dataset.role === 'cancel') { disarm(true); return }
      if (b.dataset.role === 'confirm') { const it = byK(st.confirm); st.confirm = null; selectItem(it, e); return }
      const it = byK(k)
      if (!it || b.getAttribute('aria-disabled') === 'true') return
      if (it.danger && it.confirm !== false) { arm(it, b, e); return }
      selectItem(it, e)
    }
    menu.addEventListener('click', onItemClick)
    sub.addEventListener('click', onItemClick)

    // Confirmación en el sitio: la fila se parte en «Cancelar» (bajo el puntero, con el foco) y la confirmación al lado
    function arm(it, b, e) {
      const li = b.closest('li')
      const r = b.getBoundingClientRect()
      const px = e && e.detail > 0 && typeof e.clientX === 'number' ? e.clientX : null
      const startHalf = px == null ? true : (px < r.left + r.width / 2) !== rtl()
      const cancel = `<li role="none"><button type="button" role="menuitem" tabindex="-1" class="lab-fab__item" data-role="cancel" data-k="${it._k}">${icon('x')}<span class="lab-fab__label">${esc(L.cancel)}</span></button></li>`
      const ok = `<li role="none"><button type="button" role="menuitem" tabindex="-1" class="lab-fab__item lab-fab__item--danger" data-role="confirm" data-k="${it._k}">${icon(it.icon)}<span class="lab-fab__label">${esc(it.confirmLabel || it.label)}</span></button></li>`
      li.innerHTML = `<ul role="group" class="lab-fab__confirm" aria-label="${esc(it.confirm || it.label)}">${startHalf ? cancel + ok : ok + cancel}</ul>`
      st.confirm = it._k
      st.armedAt = px == null ? null : { x: e.clientX, y: e.clientY }
      if (li.closest('.lab-fab__menu') === menu && st.appearance === 'stack') placeStack()
      focusEl(li.querySelector('[data-role="cancel"]'))
    }
    function disarm(refocus) {
      const k = st.confirm
      if (k == null) return
      st.confirm = null
      for (const ul of [menu, sub]) {
        const g = ul.querySelector('.lab-fab__confirm')
        if (!g) continue
        const li = g.parentElement
        const wrap = document.createElement('ul')
        wrap.innerHTML = itemHTML(byK(k), { panel: ul.classList.contains('lab-fab__menu--panel') })
        li.replaceWith(wrap.firstElementChild)
        if (ul === menu && st.appearance === 'stack') placeStack()
        if (refocus) focusEl(ul.querySelector(`.lab-fab__item[data-k="${k}"]`))
      }
    }
    // Orden de GMenu (#573): emitir, cerrar, foco al disparador si sigue en la lista. Medido con GMenu + GDialog reales
    // (frontera.html): un diálogo abierto en `select` devuelve el foco al disparador al cerrarse; no hace falta otro orden.
    function selectItem(it, ev) {
      const keep = o.closeOnSelect === 'never'
      const payload = { id: it.id, item: it, event: ev, defaultPrevented: false, preventDefault() { this.defaultPrevented = true }, ticket: ticketFor(it) }
      if (o.onSelect) o.onSelect(payload)
      if (single || it === main || keep || payload.defaultPrevented) return
      const a = document.activeElement
      closeMenu({ focus: !a || a === document.body || menu.contains(a) || sub.contains(a) })
    }

    // ---------------- Acuse de la acción en curso (#643: busy, done, failed, cancel) ----------------
    function ticketFor(it) {
      return {
        busy(text) { st.busy.set(it.id, text); st.failed.delete(it.id); setAck('busy', text); announce(text); refresh() },
        done(text) { st.busy.delete(it.id); st.failed.delete(it.id); setAck(st.busy.size ? 'busy' : 'done', text); if (text) announce(text); refresh(); clearTimeout(st.ackT); st.ackT = setTimeout(() => { if (st.ack === 'done') setAck(null, '') }, 2000) },
        failed(text) { st.busy.delete(it.id); st.failed.set(it.id, text); setAck('failed', text); announce(text); refresh() },
        cancel() { st.busy.delete(it.id); setAck(st.busy.size ? 'busy' : null, ''); refresh() }
      }
    }
    function setAck(kind, text) {
      st.ack = kind
      if (kind) el.dataset.ack = kind; else delete el.dataset.ack
      const b = el.querySelector('.lab-fab__badge')
      if (b) b.innerHTML = kind ? icon(kind === 'busy' ? 'loader-circle' : kind === 'done' ? 'check' : 'circle-alert') : ''
      statusEl.textContent = text || ''
    }
    function refresh() {
      if (!st.open) return
      const k = document.activeElement && document.activeElement.dataset && document.activeElement.dataset.k
      render(); place()
      if (k) focusEl(menu.querySelector(`.lab-fab__item[data-k="${k}"]`))
    }

    // ---------------- Teclado ----------------
    trigger.addEventListener('click', (e) => {
      if (single) return
      if (st.suppress) { st.suppress = false; return }
      if (e.detail > 1) return // doble clic: el segundo no deshace la apertura
      st.open ? closeMenu({ focus: true }) : openMenu({})
    })
    trigger.addEventListener('keydown', (e) => {
      if (single) return
      const toward = outUp ? 'ArrowUp' : 'ArrowDown', away = outUp ? 'ArrowDown' : 'ArrowUp'
      if (e.key === 'Escape' && st.open) { e.preventDefault(); e.stopPropagation(); closeMenu({ focus: true }); return } // el foco volvió al FAB con la lista abierta (p. ej. tras un segundo clic)
      if (e.key === toward || e.key === away) { e.preventDefault(); openMenu({ at: e.key === toward ? 'first' : 'far' }) }
    })
    // Esc con la lista abierta y el foco perdido (WebKit no enfoca el botón al pulsarlo: un segundo clic deja el foco en body)
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && st.open && (e.target === document.body || e.target === document.documentElement)) { e.preventDefault(); closeMenu({ focus: true }) } })
    // Una activación por pulsación: mantener Intro o Espacio no repite (ni la acción ni la reapertura del FAB)
    document.addEventListener('keydown', (e) => { if (e.repeat && (e.key === 'Enter' || e.key === ' ') && (el.contains(e.target) || menu.contains(e.target) || sub.contains(e.target))) e.preventDefault() }, true)
    function onKey(e) {
      const ul = e.currentTarget
      const els = focusables(ul)
      const a = document.activeElement
      const i = els.indexOf(a)
      const k = e.key
      const R = rtl()
      const arc = ul === menu && st.appearance === 'arc'
      const fwd = R ? 'ArrowLeft' : 'ArrowRight', back = R ? 'ArrowRight' : 'ArrowLeft'
      let next = null
      if (k === 'ArrowDown' || k === 'ArrowUp' || (arc && (k === fwd || k === back))) {
        const dir = k === 'ArrowDown' || k === fwd ? 1 : -1
        next = els[(i + dir + els.length) % els.length]
      } else if (k === 'Home') next = els[0]
      else if (k === 'End') next = els[els.length - 1]
      else if (k === fwd && a && a.dataset.k === 'more') { e.preventDefault(); openSub(true); return }
      else if (k === back && ul === sub) { e.preventDefault(); closeSub(true); return }
      else if (k === 'Escape') {
        e.preventDefault(); e.stopPropagation()
        if (st.confirm != null) disarm(true)
        else if (st.find) setFind('')
        else if (ul === sub) closeSub(true)
        else closeMenu({ focus: true })
        return
      } else if (k === 'Tab') { closeMenu({ focus: false }); trigger.focus({ preventScroll: true }); return } // el Tab sigue su curso desde el FAB
      else if (k === 'Backspace' && st.find && ul === menu && concept === 'C') { e.preventDefault(); setFind(st.find.slice(0, -1)); return }
      else if (k.length === 1 && k !== ' ' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault()
        if (concept === 'C' && ul === menu) { setFind(st.find + k); return }
        // Letra (como GMenu): salta a la siguiente que empieza por lo escrito (500 ms)
        clearTimeout(st.bufT); st.buf += norm(k); st.bufT = setTimeout(() => { st.buf = '' }, 500)
        const order = els.slice(i + 1).concat(els.slice(0, i + 1))
        next = order.find((b) => norm(b.querySelector('.lab-fab__label').textContent).startsWith(st.buf)) || null
      }
      if (next) { e.preventDefault(); focusEl(next) }
    }
    menu.addEventListener('keydown', onKey)
    sub.addEventListener('keydown', onKey)
    // Confirmación: el foco que sale del par la deshace (sin temporizador: 2.2.1)
    for (const ul of [menu, sub]) ul.addEventListener('focusin', (e) => { if (st.confirm != null && !e.target.closest('.lab-fab__confirm')) disarm(false) })
    // El puntero mueve el foco (M1 de GMenu, #305)
    for (const ul of [menu, sub]) ul.addEventListener('pointermove', (e) => { if (e.pointerType === 'touch') return; const b = e.target.closest('.lab-fab__item'); if (b && document.activeElement !== b && !b.closest('.lab-fab__confirm')) focusEl(b) })

    // C · buscar sin campo: lo escrito filtra por etiqueta y descripción, y se ve en la cabecera del panel
    function setFind(q) {
      const lis = [...menu.querySelectorAll('li[data-k]')]
      const test = (li) => { const it = byK(li.dataset.k); return norm(`${it.label} ${it.description || ''}`).includes(norm(q)) }
      const hits = q ? lis.filter(test) : lis
      const head = menu.querySelector('.lab-fab__find-text')
      if (q && !hits.length) { head.innerHTML = `${esc(L.none)} <b>«${esc(q)}»</b>`; announce(L.none); return }
      st.find = q
      for (const li of lis) li.hidden = Boolean(q) && !hits.includes(li)
      for (const g of menu.querySelectorAll('li[data-group]')) g.hidden = ![...g.querySelectorAll('li[data-k]')].some((li) => !li.hidden)
      head.innerHTML = q ? `<b>«${esc(q)}»</b> · ${esc(hits.length === 1 ? L.matchesOne : L.matches.replace('{count}', hits.length))}` : esc(L.findHint)
      if (q) announce(hits.length === 1 ? L.matchesOne : L.matches.replace('{count}', hits.length))
      const first = focusables(menu)[0]
      if (first) focusEl(first)
    }

    // ---------------- B · gesto de marca: pulsar, deslizar hacia la acción, soltar ----------------
    if (concept === 'B' && !single) {
      trigger.style.touchAction = 'none'
      trigger.addEventListener('pointerdown', (e) => {
        if (e.button !== 0) return
        st.gesture = { x: e.clientX, y: e.clientY, id: e.pointerId, drag: false }
        try { trigger.setPointerCapture(e.pointerId) } catch {}
      })
      trigger.addEventListener('pointermove', (e) => {
        const g = st.gesture
        if (!g || e.pointerId !== g.id) return
        if (!g.drag && Math.hypot(e.clientX - g.x, e.clientY - g.y) > 10) { g.drag = true; if (!st.open) openMenu({ viaGesture: true }) }
        if (g.drag && st.appearance === 'arc') aim(e.clientX, e.clientY)
      })
      const end = (e, cancel) => {
        const g = st.gesture
        st.gesture = null
        if (!g || !g.drag) return
        st.suppress = true
        setTimeout(() => { st.suppress = false }, 400)
        const b = st.aimed
        clearAim()
        if (cancel || st.appearance !== 'arc') return
        if (b) { if (b.dataset.k === 'more') openSub(true); else if (b.getAttribute('aria-disabled') !== 'true') selectItem(byK(b.dataset.k), e); else focusEl(b) }
        else closeMenu({ focus: true }) // soltar en el centro: cancela (WCAG 2.5.2)
      }
      trigger.addEventListener('pointerup', (e) => end(e, false))
      trigger.addEventListener('pointercancel', (e) => end(e, true))
      trigger.addEventListener('contextmenu', (e) => { if (st.gesture) e.preventDefault() })
    }
    function aim(x, y) {
      const lay = st.arc
      if (!lay) return
      const dist = Math.hypot(x - lay.cx, y - lay.cy)
      let best = null
      if (dist > trigger.offsetWidth / 2 + SP() * 2) {
        const ang = Math.atan2(lay.cy - y, x - lay.cx)
        let bd = Infinity
        lay.out.forEach((q, i) => { const a = Math.atan2(lay.cy - q.iy, q.ix - lay.cx); let dd = Math.abs(a - ang); if (dd > Math.PI) dd = 2 * Math.PI - dd; if (dd < bd) { bd = dd; best = menu.children[i].querySelector('.lab-fab__item') } })
      }
      if (best === st.aimed) return
      clearAim()
      st.aimed = best
      if (best) { best.classList.add('is-aimed'); focusEl(best) }
    }
    function clearAim() { if (st.aimed) st.aimed.classList.remove('is-aimed'); st.aimed = null }

    // ---------------- Fuera, modal, desplazamiento, tamaño ----------------
    document.addEventListener('pointerdown', (e) => {
      if (!st.open) return
      const t = e.target
      if (el.contains(t) || menu.contains(t) || sub.contains(t) || t === scrim) return
      closeMenu({ focus: false }) // clic fuera: cierra sin robar el foco (como GMenu)
    }, true)
    new MutationObserver(() => {
      const m = [...document.querySelectorAll('dialog[open]')].find((d) => d.matches(':modal') && !d.contains(el))
      if (m && st.open) closeMenu({ focus: false }) // bajo un modal el FAB queda inerte y su lista se cierra (no se traslada)
    }).observe(document.documentElement, { subtree: true, attributes: true, attributeFilter: ['open'] })
    let scrollRaf = 0
    window.addEventListener('scroll', () => {
      if (scrollRaf) return
      scrollRaf = requestAnimationFrame(() => {
        scrollRaf = 0
        if (st.open && anchor === 'container') {
          const f = triggerRect()
          if (f.bottom < 0 || f.top > innerHeight) closeMenu({ focus: false }) // regla 3 de #358: el ancla salió del visor
          else if (st.appearance !== 'arc') place() // reglas 1 y 2: solo cambia la posición
          else { closeMenu({ focus: false }) }
        }
        checkTuck()
      })
    }, true)
    window.addEventListener('resize', () => { if (st.open) { closeSub(false); render(); place(); focusEl(focusables(menu)[0]) } checkTuck(); publish() })

    // ---------------- Se aparta: nunca tapa lo que tiene el foco (WCAG 2.4.11) ----------------
    function setTuck(v) {
      if (st.tuck === v) return
      st.tuck = v
      el.classList.toggle('is-tucked', v)
      const shift = v ? el.offsetWidth - 24 + SP() * 4 : 0
      el.style.setProperty('--_tuck', `${align === 'center' ? 0 : physRight() ? shift : -shift}px`)
      if (align === 'center') el.style.translate = v ? `${rtl() ? '50%' : '-50%'} ${outUp ? '' : '-'}${el.offsetHeight - 24 + SP() * 4}px` : ''
    }
    function checkTuck() {
      if (st.open) return setTuck(false)
      const a = document.activeElement
      let want = false
      if (a && a !== document.body && !el.contains(a) && !menu.contains(a) && !sub.contains(a)) {
        const r = a.getBoundingClientRect()
        const f = rootRect()
        if (r.width && hit(r, box(f.left - SP(), f.top - SP(), f.width + SP() * 2, f.height + SP() * 2))) want = true
        if (coarse() && a.matches('input:not([type="checkbox"]):not([type="radio"]), textarea, [contenteditable="true"]')) want = true // teclado en pantalla
      }
      setTuck(want)
    }
    document.addEventListener('focusin', () => requestAnimationFrame(checkTuck))
    document.addEventListener('focusout', () => requestAnimationFrame(checkTuck))

    // ---------------- Borde compartido (solo fijo al visor) ----------------
    function publish() {
      if (anchor !== 'viewport') return
      const res = labEdge.sum(edge, EDGE_ORDER.fab)
      el.style.setProperty('--_reserve', `${res}px`)
      labEdge.set(id, edge, el.offsetHeight + SP() * 4, EDGE_ORDER.fab)
    }
    if (anchor === 'viewport') { labEdge.sub(() => { const r = labEdge.sum(edge, EDGE_ORDER.fab); if (parseFloat(el.style.getPropertyValue('--_reserve')) !== r) el.style.setProperty('--_reserve', `${r}px`) }); publish() }

    return api
  }

  window.LabFab = { create, announce, EDGE_ORDER }
})()
