// Base funcional de la isla (kiwi, alert r04, copiada de r03 con su corrección de `resolve` y «vive con su origen»). La comparten D1, D2 y D3.
// Lo que NO cambia respecto al contrato vigente (status.md): condición con clave, orden por gravedad y reciente,
// par propio de canales vivos (cortés + enérgico, 50 ms / 5000 ms, nada al cargar), nunca toma el foco, nunca
// empuja nada (todo es fijo, fuera del flujo), Alt+F8 va y vuelve, Esc repliega sin propagar, el foco nunca acaba en body.
// Lo que SÍ propone r03 (en los tres): medir antes de mostrar (sin franja a todo el ancho al nacer), `resolve` limpia
// la descripción y el detalle, y una condición con `origin` vive con su origen (se retira si el origen sale del DOM).
(function () {
  const RANK = { error: 0, warning: 1, info: 2, success: 3 }
  const TYPES = { error: 'Error', warning: 'Advertencia', info: 'Información', success: 'Correcto' }
  const ICON = { error: 'circle-alert', warning: 'triangle-alert', info: 'info', success: 'circle-check' }
  const q = new URLSearchParams(location.search)
  const T = Number(q.get('t')) || 0 // tiempo de lectura (ms); 0 = el de cada concepto
  const conds = new Map()
  let uid = 0
  let mounted = false
  const listeners = []
  const live = window.__live = []

  // ---------- Canales vivos (par propio, como createLiveWriter) ----------
  const box = document.createElement('div')
  box.className = 'sr x-live'
  const ch = {}
  for (const [k, role] of [['polite', 'status'], ['assertive', 'alert']]) {
    const d = document.createElement('div')
    d.setAttribute('role', role)
    if (k === 'polite') d.setAttribute('aria-live', 'polite')
    d.setAttribute('aria-atomic', 'true')
    box.append(d); ch[k] = d
  }
  const pend = { polite: [], assertive: [] }, wt = {}, ct = {}
  function announce (text, politeness) {
    const k = politeness === 'assertive' ? 'assertive' : 'polite'
    live.push({ text, ch: k, t: Math.round(performance.now()) })
    clearTimeout(ct[k]); ch[k].textContent = ''
    pend[k].push(text); clearTimeout(wt[k])
    wt[k] = setTimeout(() => { ch[k].textContent = pend[k].join(' '); pend[k] = []; ct[k] = setTimeout(() => { ch[k].textContent = '' }, 5000) }, 50)
  }
  const say = (c) => `${TYPES[c.type]}: ${c.title}${c.description ? '. ' + c.description : ''}`

  // ---------- Modelo ----------
  function list (filter) {
    return [...conds.values()].filter((c) => !filter || filter(c)).sort((a, b) => RANK[a.type] - RANK[b.type] || b.since - a.since)
  }
  function emit (ev) { listeners.forEach((fn) => fn(ev)) }
  function set (id, o) {
    const prev = conds.get(id)
    const c = prev ? { ...prev, ...o } : { id, uid: ++uid, type: 'info', ack: false, hidden: false, seen: false, busy: false, since: performance.now(), ...o }
    if (!prev || prev.type !== c.type) { c.since = performance.now(); c.ack = false; c.hidden = false; c.seen = false }
    if (c.persistent === undefined || (prev && o.type && o.persistent === undefined)) c.persistent = c.type !== 'success'
    conds.set(id, c)
    const changed = !prev || prev.type !== c.type || prev.title !== c.title || prev.description !== c.description
    if (mounted && changed) announce(say(c), c.type === 'error' ? 'assertive' : 'polite')
    emit({ kind: prev ? 'change' : 'appear', id, changed, toError: c.type === 'error' && (!prev || prev.type !== 'error'), typeChanged: !!prev && prev.type !== c.type })
    return id
  }
  // r03: resolver limpia lo que pertenecía a la condición (descripción, detalle, acción, origen), no solo el tipo
  function resolve (id, result) {
    if (!conds.has(id)) return false
    if (result === undefined) return remove(id)
    const r = typeof result === 'string' ? { title: result } : result
    return set(id, { type: 'success', persistent: false, description: '', details: undefined, action: undefined, busy: false, ...r })
  }
  function remove (id, reason = 'api') {
    const c = conds.get(id)
    if (!c) return false
    conds.delete(id)
    emit({ kind: 'remove', id, reason })
    return true
  }
  function again (id) {
    const c = conds.get(id)
    if (!c) return false
    c.ack = false; c.hidden = false; c.seen = false
    if (mounted) announce(say(c), c.type === 'error' ? 'assertive' : 'polite')
    emit({ kind: 'announce', id, toError: c.type === 'error' })
    return true
  }
  function patch (id, o) { const c = conds.get(id); if (!c) return; Object.assign(c, o); emit({ kind: 'state', id }) }
  async function act (id) {
    const c = conds.get(id)
    if (!c || !c.action || c.busy) return
    const out = c.action.onClick(c)
    if (!out || typeof out.then !== 'function') return
    patch(id, { busy: true })
    if (c.action.busyLabel) announce(c.action.busyLabel, 'polite')
    try {
      const v = await out
      if (!conds.has(id)) return
      conds.get(id).busy = false
      if (v && typeof v === 'object') set(id, v)
      else emit({ kind: 'state', id })
    } catch {
      if (!conds.has(id)) return
      conds.get(id).busy = false
      again(id)
    }
  }
  // r03: una condición con origen vive con él. Si el origen sale del documento (la persona se fue de la vista), se retira.
  const originWatch = new MutationObserver(() => {
    for (const c of conds.values()) {
      if (!c.origin) continue
      const el = document.getElementById(c.origin.target)
      if (!el || !el.isConnected) remove(c.id, 'origin')
    }
  })

  // ---------- Foco: nunca lo toma; nunca a body ----------
  const TABBABLE = 'a[href],button:not([disabled]),input:not([disabled]):not([type=hidden]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'
  function neighbour (el) {
    const all = [...document.querySelectorAll(TABBABLE)].filter((x) => x.getClientRects().length && !x.closest('[inert],.isle'))
    return all.find((x) => el.compareDocumentPosition(x) & Node.DOCUMENT_POSITION_FOLLOWING) || all[all.length - 1] || null
  }
  let lastPress = null
  document.addEventListener('pointerdown', (e) => { lastPress = e.target }, true)
  function actor () {
    const a = document.activeElement
    if (a && a !== document.body && a !== document.documentElement && !a.closest('.isle')) return a
    return lastPress && lastPress.isConnected && !lastPress.closest('.isle') ? lastPress : null
  }
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches
  const mobile = () => innerWidth < 520

  function icon (name, cls = 'g-icon') {
    return `<svg class="${cls}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${window.LUCIDE_ICONS[name]}</svg>`
  }
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]))

  window.Base = {
    TYPES, ICON, RANK, T, conds, list, set, resolve, remove, again, patch, act, announce, actor, neighbour, reduced, mobile, icon, esc,
    get mounted () { return mounted },
    on (fn) { listeners.push(fn) },
    mount (host) {
      host.append(box)
      originWatch.observe(document.body, { childList: true, subtree: true })
      requestAnimationFrame(() => requestAnimationFrame(() => { mounted = true }))
    },
    // Alt+F8 (exacto, sin componer): ida y vuelta
    hotkey (e) { return e.key === 'F8' && e.altKey && !e.ctrlKey && !e.shiftKey && !e.metaKey && !e.isComposing }
  }
})()
