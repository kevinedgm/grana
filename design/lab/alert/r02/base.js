// Base funcional de r01 (kiwi), compartida por los tres conceptos de r02. No es propuesta de forma.
// Canal vivo por anfitrión, foco vecino, «lo que la persona está usando», compensación de desplazamiento.
(function () {
  const liveLog = window.__live = []
  const announcers = new WeakMap()
  function announcerFor(host) {
    let a = announcers.get(host)
    if (a && a.box.isConnected) return a
    const box = document.createElement('div')
    box.className = 'x-live sr'
    const mk = (role, live) => { const d = document.createElement('div'); d.setAttribute('role', role); if (live) d.setAttribute('aria-live', live); d.setAttribute('aria-atomic', 'true'); box.append(d); return d }
    const node = { polite: mk('status', 'polite'), assertive: mk('alert') }
    host.append(box)
    const pending = { polite: [], assertive: [] }, wt = {}, ct = {}
    a = {
      box,
      announce(text, politeness) {
        const ch = politeness === 'assertive' ? 'assertive' : 'polite'
        liveLog.push({ text, ch, host: host === document.body ? 'body' : 'dialog' })
        clearTimeout(ct[ch]); node[ch].textContent = ''
        pending[ch].push(text)
        clearTimeout(wt[ch])
        wt[ch] = setTimeout(() => { node[ch].textContent = pending[ch].join(' '); pending[ch] = []; ct[ch] = setTimeout(() => { node[ch].textContent = '' }, 5000) }, 50)
      }
    }
    announcers.set(host, a)
    return a
  }
  announcerFor(document.body)
  /** Anuncia en el canal del diálogo modal abierto (si lo hay) o del body. error → enérgico. */
  function tell(type, text) {
    const d = document.querySelector('dialog[open]')
    announcerFor(d || document.body).announce(text, type === 'error' ? 'assertive' : 'polite')
  }

  const TABBABLE = 'a[href],button:not([disabled]),input:not([disabled]):not([type=hidden]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'
  function neighbour(el) {
    const scope = el.closest('dialog') || document
    const all = [...scope.querySelectorAll(TABBABLE)].filter((x) => !el.contains(x) && x.getClientRects().length && !x.closest('[inert]'))
    const next = all.find((x) => el.compareDocumentPosition(x) & Node.DOCUMENT_POSITION_FOLLOWING)
    return next || all[all.length - 1] || null
  }
  let lastPress = null
  document.addEventListener('pointerdown', (e) => { lastPress = { el: e.target, t: performance.now() } }, true)
  function actor() {
    const ae = document.activeElement
    if (ae && ae !== document.body && ae !== document.documentElement) return ae
    if (lastPress && lastPress.el.isConnected && performance.now() - lastPress.t < 1500) return lastPress.el
    return null
  }
  function scrollerOf(el) {
    for (let p = el.parentElement; p && p !== document.body && p !== document.documentElement; p = p.parentElement) {
      const o = getComputedStyle(p).overflowY
      if ((o === 'auto' || o === 'scroll') && p.scrollHeight - p.clientHeight > 1) return p
    }
    return document.scrollingElement
  }
  // Tokens de movimiento reales del tema: se leen resueltos desde una sonda
  const probe = document.createElement('i')
  probe.style.cssText = 'position:absolute;inline-size:0;block-size:0;visibility:hidden'
  document.documentElement.append(probe)
  function token(duration, ease) {
    probe.style.transition = `opacity var(${duration}) var(${ease})`
    const cs = getComputedStyle(probe)
    const d = cs.transitionDuration
    return { ms: /ms$/.test(d) ? parseFloat(d) : parseFloat(d) * 1000, easing: cs.transitionTimingFunction }
  }
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches
  const slow = () => (window.__slow ? 5 : 1)

  /** Durante `ms`, corrige el desplazamiento para que el elemento que la persona usa no cambie de sitio en pantalla. */
  function holdStill(ms, el) {
    const a = el || actor()
    if (!a || !a.isConnected) return
    const sc = scrollerOf(a)
    const isDoc = sc === document.scrollingElement
    const els = isDoc ? [document.documentElement, document.body] : [sc]
    const prev = els.map((e) => e.style.overflowAnchor)
    els.forEach((e) => { e.style.overflowAnchor = 'none' })
    const y0 = a.getBoundingClientRect().top
    const t0 = performance.now()
    const fix = () => { if (!a.isConnected) return; const d = a.getBoundingClientRect().top - y0; if (Math.abs(d) >= 0.5) sc.scrollTop += d }
    const loop = () => { fix(); if (performance.now() - t0 < ms + 60) requestAnimationFrame(loop); else els.forEach((e, i) => { e.style.overflowAnchor = prev[i] }) }
    fix(); requestAnimationFrame(loop)
  }

  /** Entrada o salida en altura (ganchos de <Transition :css="false">), con los tokens del tema. */
  function sizeIn(el, done) { runSize(el, true, done) }
  function sizeOut(el, done) { if (el.contains(document.activeElement)) { const t = neighbour(el); if (t) t.focus({ preventScroll: true }) } el.inert = true; runSize(el, false, done) }
  function runSize(el, entering, done) {
    const H = el.getBoundingClientRect().height
    // La separación del contenedor (flex o grid con row-gap) también entra y sale: sin esto hay un salto de un cuadro
    const pcs = el.parentElement ? getComputedStyle(el.parentElement) : null
    const gap = pcs && /flex|grid/.test(pcs.display) ? (parseFloat(pcs.rowGap) || 0) : 0
    const collapsed = { height: '0px', marginBlockEnd: -gap + 'px', opacity: '0' }, full = { height: H + 'px', marginBlockEnd: '0px', opacity: '1' }
    const from = entering ? collapsed : full, to = entering ? full : collapsed
    const t = token('--g-duration-slow', '--g-ease-out')
    const ms = reduced() ? 0 : t.ms * slow()
    el.style.overflow = 'clip'
    Object.assign(el.style, from)
    holdStill(ms)
    const clear = () => { el.style.height = el.style.marginBlockEnd = el.style.opacity = el.style.overflow = '' }
    if (!ms) { if (entering) clear(); else Object.assign(el.style, to); done(); return }
    let anim
    try { anim = el.animate([from, to], { duration: ms, easing: t.easing, fill: 'both' }) } catch { anim = el.animate([from, to], { duration: ms, easing: 'ease-out', fill: 'both' }) }
    anim.finished.then(() => { if (entering) clear(); else Object.assign(el.style, to); anim.cancel(); done() }, () => done())
  }

  window.Base = { announcerFor, tell, neighbour, actor, scrollerOf, token, reduced, slow, holdStill, sizeIn, sizeOut }
})()
