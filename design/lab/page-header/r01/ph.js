// Motor del prototipo de GPageHeader (kiwi r01). No es el componente: demuestra la estructura y el comportamiento
// de la base y de los conceptos A (Relevo), B (Zócalo) y C (Muelle) para que se puedan medir y comparar.
// Parámetros: ?c=base|A|B|C  &zone=brand  &theme=nsa  &tabs=0  &dir=rtl
(() => {
  const qs = new URLSearchParams(location.search)
  const C = ['base', 'A', 'B', 'C'].includes(qs.get('c')) ? qs.get('c') : 'base'
  const ZONE = qs.get('zone') === 'brand'
  const THEME = qs.get('theme') === 'nsa'
  const TABS = qs.get('tabs') !== '0'
  const RTL = qs.get('dir') === 'rtl'
  const FINAL_C = C === 'B' && qs.get('final') === 'C' // recomendación: B, y en estrecho el muelle de C para las acciones
  const root = document.documentElement
  const $ = (s, r = document) => r.querySelector(s)
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v))
  const reduced = matchMedia('(prefers-reduced-motion: reduce)')
  if (THEME) root.classList.add('lab-theme-nsa')
  if (RTL) root.dir = 'rtl'

  // ---------- Iconos (solo Lucide, vía lucide-icons.js) ----------
  document.querySelectorAll('[data-icon]').forEach((el) => el.insertAdjacentHTML('afterbegin', window.lucide(el.dataset.icon)))

  // ---------- Barra del laboratorio ----------
  const href = (patch) => { const n = new URLSearchParams(location.search); for (const [k, v] of Object.entries(patch)) v == null ? n.delete(k) : n.set(k, v); return '?' + n }
  const NAMES = { base: 'Base', A: 'A · Relevo', B: 'B · Zócalo', C: 'C · Muelle' }
  $('#lab-concepts').innerHTML = Object.entries(NAMES).map(([k, t]) => `<a href="${href({ c: k, final: null })}"${k === C && !FINAL_C ? ' aria-current="page"' : ''}>${t}</a>`).join('') + `<a href="${href({ c: 'B', final: 'C' })}"${FINAL_C ? ' aria-current="page"' : ''}>B + muelle (recomendada)</a>`
  $('#lab-toggles').innerHTML = [
    `<a href="${href({ zone: ZONE ? null : 'brand' })}">${ZONE ? 'Sin zona de marca' : 'Zona de marca'}</a>`,
    `<a href="${href({ theme: THEME ? null : 'nsa' })}">${THEME ? 'Tema por defecto' : 'Tema NisaNabani'}</a>`,
    `<a href="${href({ tabs: TABS ? '0' : null })}">${TABS ? 'Sin pestañas' : 'Con pestañas'}</a>`,
    `<a href="${href({ dir: RTL ? null : 'rtl' })}">${RTL ? 'LTR' : 'RTL'}</a>`
  ].join('')

  // ---------- Contenido largo de la página (de la aplicación) ----------
  const para = 'La muestra se procesó en el analizador 2 con control de calidad vigente. Los valores fuera de rango se marcan para validación por el químico responsable; la validación libera el resultado al expediente del paciente y al médico solicitante.'
  const fill = (id, heads) => { $(id).innerHTML = heads.map((h) => `<h2>${h}</h2><p>${para}</p><p>${para}</p><p>${para} <a href="#main">Ver protocolo</a>.</p>`).join('') }
  fill('#p1', ['Datos de la muestra', 'Analitos fuera de rango', 'Observaciones del analista', 'Trazabilidad', 'Cadena de custodia', 'Notas internas'])
  fill('#p2', ['Serie roja', 'Serie blanca', 'Plaquetas', 'Índices'])
  fill('#p3', ['Cambios recientes'])
  fill('#p4', ['Adjuntos', 'Imágenes del frotis'])

  // ---------- Montaje según el concepto ----------
  const ph = $('#ph'), title = $('#ph-title'), actions = $('.ph__actions', ph), slot = $('.ph__actions-slot', ph)
  const band = $('#ph-band'), dock = $('#ph-dock'), base = $('#ph-base')
  ph.dataset.c = C
  if (ZONE) ph.classList.add('lab-zone-brand')
  if (!TABS) {
    $('.ph-tabs', base).remove()
    document.querySelectorAll('.panel').forEach((p, i) => { if (i) p.remove(); else { p.removeAttribute('role'); p.removeAttribute('aria-labelledby'); p.removeAttribute('tabindex'); p.hidden = false } })
  }
  if (C !== 'A') band.remove()
  if (C !== 'C' && !FINAL_C) dock.remove()
  if (C === 'B') { $('.ph__base-host', base).append(actions); slot.remove() } // forma estática de B: las acciones viven en el zócalo
  const home = C === 'B' ? $('.ph__base-host', base) : slot
  if (!$('.ph-tabs', base) && C !== 'B') { base.remove(); ph.classList.add('is-no-base') }
  const bandHost = band && band.isConnected ? $('.ph__band-host', band) : null
  const dockHost = dock && dock.isConnected ? $('.ph__dock-host', dock) : null

  const NOTES = {
    base: '<strong>Base funcional.</strong> El encabezado se va con la página: sin franja. Semántica, orden de lectura, h1 único, ruta, acciones y pestañas. Desplaza para comparar con A, B y C.',
    A: '<strong>A · Relevo.</strong> Al desplazar, la franja baja desde la barra de la aplicación al ritmo del dedo; el título sube a ella y las <em>mismas</em> acciones se mudan (no hay copias). Vuelve arriba y regresan.',
    B: '<strong>B · Zócalo.</strong> Nada encoge ni se copia: el encabezado entero se hunde bajo el borde hasta su última fila (pestañas y acciones), donde aparece el título compacto. Cambia de pestaña pegado: el contenido empieza bajo el zócalo.',
    C: '<strong>C · Muelle.</strong> Arriba no queda nada: la lectura recupera la pantalla. Las mismas acciones bajan a un muelle en la zona del pulgar; los avisos se apilan encima.'
  }
  $('#lab-note').innerHTML = (FINAL_C ? '<strong>Recomendación · B con el muelle de C en estrecho.</strong> En escritorio, el zócalo de B. Cuando el encabezado es estrecho (teléfono), al pegarse el zócalo se queda con las pestañas y las acciones bajan al muelle, en la zona del pulgar. ' : NOTES[C]) + ' Prueba también «Aviso de prueba», la zona de marca y el tema NisaNabani.'

  // ---------- Estado expuesto para verificar.mjs ----------
  const S = window.__ph = { c: C, finalC: FINAL_C, where: C === 'B' ? 'base' : 'head', p: 0, stuck: false, open: false, off: false, moves: 0, deferred: 0, pending: null, top: 0, bandH: 0, baseH: 0, warnings: [], ready: false }
  if (document.querySelectorAll('h1').length !== 1) S.warnings.push('Debe haber un solo h1 en la página')

  // ---------- Medidas (la entrada pública --g-page-header-top se resuelve con una sonda) ----------
  const probe = (prop, val) => { const d = document.createElement('div'); d.style.cssText = `position:absolute;visibility:hidden;${prop}:${val}`; ph.append(d); const cs = getComputedStyle(d); const r = prop === 'transition-duration' ? parseFloat(cs.transitionDuration) * 1000 : d.getBoundingClientRect().height; d.remove(); return r }
  let SPACE6 = 24, DUR = 240, SPRING = 'ease-out'
  const measure = () => {
    S.top = probe('block-size', 'var(--g-page-header-top)')
    SPACE6 = probe('block-size', 'var(--g-space-6)')
    DUR = probe('transition-duration', 'var(--g-duration-slow)')
    SPRING = getComputedStyle(root).getPropertyValue('--g-ease-spring').trim() || 'ease-out'
    ph.toggleAttribute('data-narrow', ph.clientWidth < 600)
    if (band && band.isConnected) { const h = band.hidden; band.hidden = false; S.bandH = band.offsetHeight; band.hidden = h }
    if (base.isConnected) S.baseH = base.offsetHeight
    schedule()
  }

  // ---------- Mudanza de las acciones (mismos nodos: sin copias, sin estado duplicado) ----------
  function relocate (host) {
    if (actions.parentElement === host) { S.pending = null; return }
    if (actions.contains(document.activeElement)) { if (S.pending !== host) S.deferred++; S.pending = host; return } // nunca se mueve lo que tiene el foco
    S.pending = null
    const first = actions.getBoundingClientRect()
    if (home === slot && host !== slot) { slot.style.minBlockSize = slot.offsetHeight + 'px'; slot.style.minInlineSize = slot.offsetWidth + 'px' } // el hueco guarda su tamaño: la página no salta
    host.append(actions)
    if (home === slot && host === slot) { slot.style.minBlockSize = ''; slot.style.minInlineSize = '' }
    S.where = host === slot ? 'head' : host === bandHost ? 'band' : host === dockHost ? 'dock' : 'base'
    S.moves++
    if (!reduced.matches && C === 'A' && host === bandHost) {
      const last = actions.getBoundingClientRect(), lim = S.bandH * 1.5
      const dy = clamp(first.top - last.top, -lim, lim)
      try { actions.animate([{ translate: `0 ${dy}px`, opacity: 0.3 }, { translate: '0 0', opacity: 1 }], { duration: DUR, easing: SPRING }) } catch { /* motor sin linear() */ }
    }
  }
  actions.addEventListener('focusout', () => setTimeout(() => { if (S.pending && !actions.contains(document.activeElement)) relocate(S.pending) }))

  // ---------- Muelle (C, y la forma estrecha de la recomendación) ----------
  function setDock (open, pr) {
    if (open !== S.open) {
      S.open = open
      if (open) { dock.hidden = false; dock.inert = false; void dock.offsetHeight; dock.toggleAttribute('data-open', true) } else {
        dock.inert = true; dock.removeAttribute('data-open')
        const hide = () => { if (!S.open) dock.hidden = true }
        reduced.matches ? hide() : setTimeout(hide, 200)
      }
    }
    relocate(open ? dockHost : home)
    const narrow = ph.hasAttribute('data-narrow')
    const rtl = getComputedStyle(ph).direction === 'rtl'
    if (narrow) { dock.style.setProperty('--_dock-x', pr.left + 'px'); dock.style.setProperty('--_dock-r', (innerWidth - pr.right) + 'px'); dock.style.setProperty('--_dock-max', pr.width + 'px') } else if (rtl) { dock.style.setProperty('--_dock-x', (pr.left + SPACE6) + 'px'); dock.style.setProperty('--_dock-r', 'auto'); dock.style.setProperty('--_dock-max', (pr.width - 2 * SPACE6) + 'px') } else { dock.style.setProperty('--_dock-x', 'auto'); dock.style.setProperty('--_dock-r', (innerWidth - pr.right + SPACE6) + 'px'); dock.style.setProperty('--_dock-max', (pr.width - 2 * SPACE6) + 'px') }
    // La reserva es la del sitio FINAL del muelle (alto de caja, sin la traslación en curso): los avisos no persiguen la animación
    return open ? dock.offsetHeight + (narrow ? 0 : probe('block-size', 'var(--g-space-4)')) + probe('block-size', 'var(--g-space-2)') : 0
  }

  // ---------- Cuadro a cuadro: ligado al desplazamiento, no a temporizadores ----------
  let raf = 0
  function schedule () { if (!raf) raf = requestAnimationFrame(() => { raf = 0; update() }) }
  function update () {
    const top = S.top, vh = innerHeight, pr = ph.getBoundingClientRect(), tr = title.getBoundingClientRect()
    let edgeTop = top, edgeBottom = 0
    if (C === 'A') {
      S.off = S.bandH > vh * 0.25 // la franja nunca ocupa más de un cuarto del alto visible (zoom, teléfono apaisado)
      let p = S.off ? 0 : clamp((top + S.bandH - tr.bottom) / S.bandH, 0, 1)
      if (reduced.matches) p = p >= 0.5 ? 1 : 0
      S.p = p
      band.style.setProperty('--p', p)
      band.style.setProperty('--_band-x', pr.left + 'px')
      band.style.setProperty('--_band-w', pr.width + 'px')
      band.hidden = p === 0
      band.inert = p < 0.5
      relocate((S.where === 'band' ? p > 0.25 : p >= 0.95) ? bandHost : slot)
      S.stuck = S.where === 'band'
      edgeTop = top + p * S.bandH
    } else if (C === 'B') {
      S.off = S.baseH > vh * 0.25
      ph.dataset.band = S.off ? 'off' : 'on'
      const lift = base.offsetTop // ph es sticky: es el offsetParent del zócalo
      ph.style.setProperty('--_lift', lift + 'px')
      S.stuck = !S.off && pr.top <= top - lift + 0.5
      let p = S.off ? 0 : clamp((top - tr.top) / Math.max(1, tr.height), 0, 1)
      if (reduced.matches) p = p >= 0.5 ? 1 : 0
      S.p = p
      ph.style.setProperty('--p', p)
      ph.toggleAttribute('data-stuck', S.stuck)
      edgeTop = S.stuck ? top + S.baseH : top
      if (FINAL_C) edgeBottom = setDock(S.stuck && ph.hasAttribute('data-narrow'), pr)
    } else if (C === 'C') {
      const dh = dock.hidden ? 0 : dock.offsetHeight
      S.off = dh > vh * 0.25
      const open = !S.off && (S.open ? tr.bottom < top + tr.height : tr.bottom <= top)
      edgeBottom = setDock(open, pr)
      S.stuck = open
    }
    // Simula edgeReserve: el borde que la franja o el muelle ocupan, para la isla y los avisos (L9)
    root.style.setProperty('--lab-edge-top', (edgeTop + probe('block-size', 'var(--g-space-2)')) + 'px')
    if (edgeBottom) root.style.setProperty('--lab-edge-bottom', edgeBottom + 'px'); else root.style.removeProperty('--lab-edge-bottom')
  }

  // ---------- Título de la franja o del muelle: lleva al h1 (foco incluido) ----------
  ph.querySelectorAll('a[href="#ph-title"]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); title.scrollIntoView({ block: 'start' }); title.focus({ preventScroll: true }) }))

  // ---------- Pestañas (APG Tabs, activación automática) ----------
  const tabs = [...document.querySelectorAll('[role="tab"]')]
  const select = (t, focus) => {
    tabs.forEach((x) => { const on = x === t; x.setAttribute('aria-selected', on); x.tabIndex = on ? 0 : -1; $('#' + x.getAttribute('aria-controls')).hidden = !on })
    if (focus) t.focus()
    // B: pegado, el contenido nuevo empieza justo bajo el zócalo (no se queda a media página ni salta al principio)
    if (C === 'B' && S.stuck) { const body = $('#contenido'); const y = scrollY + body.getBoundingClientRect().top - S.top - S.baseH; scrollTo(0, y) }
    schedule()
  }
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(t, false))
    t.addEventListener('keydown', (e) => {
      const rtl = getComputedStyle(t).direction === 'rtl'
      const k = { ArrowRight: rtl ? -1 : 1, ArrowLeft: rtl ? 1 : -1, Home: 'first', End: 'last' }[e.key]
      if (k == null) return
      e.preventDefault()
      const n = k === 'first' ? 0 : k === 'last' ? tabs.length - 1 : (i + k + tabs.length) % tabs.length
      select(tabs[n], true)
    })
  })

  // ---------- Aviso de prueba (simula GToaster/GStatusIsland con offset y reserva de borde) ----------
  let tt = 0
  $('#lab-toast-btn').addEventListener('click', () => {
    const t = $('#lab-toast'); t.textContent = 'Resultado guardado'; t.classList.toggle('is-bottom', C === 'C'); t.hidden = false
    clearTimeout(tt); tt = setTimeout(() => { t.hidden = true }, 4000)
  })

  addEventListener('scroll', schedule, { passive: true })
  addEventListener('resize', measure)
  reduced.addEventListener('change', schedule)
  new ResizeObserver(() => requestAnimationFrame(measure)).observe(ph) // medir en el cuadro siguiente (lección de WebKit)
  document.fonts.ready.then(() => { measure(); S.ready = true })
  measure()
})()
