// Página del laboratorio del botón flotante (kiwi r01): datos, marcos de la galería y modo `?solo=` fijo al visor.
;(function () {
  const Q = new URLSearchParams(location.search)
  const ic = (n) => `<svg class="lab-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${window.LUCIDE_ICONS[n]}</svg>`

  // ---------------- Datos: el lanzador «Crear y capturar» de un laboratorio clínico (orden = frecuencia) ----------------
  const ALL = [
    { id: 'muestra', label: 'Nueva muestra', icon: 'file-text', group: 'Crear', description: 'Registra la muestra y genera su etiqueta' },
    { id: 'paciente', label: 'Nuevo paciente', icon: 'user-plus', group: 'Crear', description: 'Alta con datos de contacto' },
    { id: 'foto', label: 'Tomar foto', icon: 'camera', group: 'Capturar', description: 'Adjunta una imagen a la muestra abierta' },
    { id: 'cita', label: 'Agendar cita', icon: 'calendar', group: 'Crear', description: 'Toma a domicilio o en sucursal' },
    { id: 'nota', label: 'Nueva nota', icon: 'pencil', group: 'Crear', description: 'Interna: el paciente no la ve' },
    { id: 'dictar', label: 'Dictar nota', icon: 'mic', group: 'Capturar', description: 'Convierte tu voz en texto' },
    { id: 'adjuntar', label: 'Adjuntar archivo', icon: 'paperclip', group: 'Capturar', description: 'PDF o imagen de hasta 10 MB' },
    { id: 'correo', label: 'Enviar resultados', icon: 'mail', group: 'Compartir', description: 'Por correo al paciente' },
    { id: 'compartir', label: 'Compartir', icon: 'share-2', group: 'Compartir', description: 'Con otro laboratorio de la red' },
    { id: 'enlace', label: 'Copiar enlace', icon: 'link', group: 'Compartir', description: 'Consulta válida 7 días' },
    { id: 'imprimir', label: 'Imprimir etiqueta', icon: 'printer', group: 'Compartir', disabled: 'Sin impresora conectada' },
    { id: 'exportar', label: 'Exportar CSV', icon: 'download', group: 'Compartir', description: 'Las muestras de hoy' },
    { id: 'etiquetar', label: 'Etiquetar', icon: 'tag', group: 'Organizar' },
    { id: 'marcar', label: 'Marcar urgente', icon: 'flag', group: 'Organizar', description: 'Sube la prioridad en la cola' },
    { id: 'eliminar', label: 'Eliminar borrador', icon: 'trash', group: 'Organizar', danger: true, confirm: '¿Eliminar el borrador? No se puede deshacer.', confirmLabel: 'Sí, eliminar' }
  ]
  const pick = (ids) => ids.map((i) => ALL.find((x) => x.id === i))
  // Subconjuntos que conservan el orden relativo: las frecuentes son las mismas en 3, 6, 10 y 15
  const SETS = {
    0: [],
    1: pick(['muestra']),
    3: pick(['muestra', 'paciente', 'foto']),
    6: pick(['muestra', 'paciente', 'foto', 'cita', 'exportar', 'eliminar']),
    10: pick(['muestra', 'paciente', 'foto', 'cita', 'nota', 'dictar', 'correo', 'imprimir', 'exportar', 'eliminar']),
    15: ALL
  }
  // Error de configuración: id duplicado, uno sin etiqueta y 17 en total (> 15)
  const BAD = [...ALL, { id: 'foto', label: 'Foto rápida', icon: 'camera', group: 'Capturar' }, { id: 'x1', icon: 'tag' }, { id: 'buscar', label: 'Buscar muestra', icon: 'search', group: 'Organizar' }]
  const LABELS = { more: 'Más acciones ({count})', moreShort: 'Más acciones', cancel: 'Cancelar', findHint: 'Escribe para buscar', matches: '{count} acciones', matchesOne: '1 acción', none: 'Sin coincidencias:' }
  const LAUNCH = { A: 'Crear y capturar', B: 'Crear y capturar', base: 'Crear y capturar', C: 'Crear y capturar' }
  window.__selects = []

  function onSelect(log) {
    return (p) => {
      window.__selects.push(p.id)
      if (log) log.textContent = `select · ${p.id} («${p.item.label}»)`
      if (p.id === 'exportar' || p.id === 'correo') {
        p.ticket.busy(p.id === 'exportar' ? 'Exportando CSV…' : 'Enviando resultados…')
        setTimeout(() => p.ticket.done(p.id === 'exportar' ? 'CSV exportado' : 'Resultados enviados'), 1200)
      } else if (p.id === 'enlace') p.ticket.done('Enlace copiado')
      else if (p.id === 'compartir') { p.ticket.busy('Compartiendo…'); setTimeout(() => p.ticket.failed('No se pudo compartir: sin conexión'), 600) }
    }
  }
  const rows = (n) => Array.from({ length: n }, (_, i) => `<a class="lab-row" href="#m${1041 + i}"><span>Muestra M-${1041 + i}</span><span>${['Sangre', 'Orina', 'Hisopado', 'Biopsia'][i % 4]}</span></a>`).join('')
  const content = (n) => `<p class="cap" style="margin-top:0">Muestras de hoy</p>${rows(n)}<label class="cap" style="display:block;margin-top:var(--g-space-4)">Observación rápida<input class="lab-field" type="text" name="obs"></label><a class="lab-row" href="#fin"><span>Ver todas las muestras</span><span>30 más</span></a>`

  function mountFab(frame, concept, n, extra = {}) {
    const old = frame.__fab
    if (old) { old.el.remove(); old.menu.remove(); old.sub.remove(); old.scrim.remove() }
    const log = frame.parentElement.querySelector('.lab-log')
    const fab = LabFab.create(frame, { concept, id: `${frame.id}-fab`, items: n === 'bad' ? BAD : SETS[n], label: LAUNCH[concept], icon: 'plus', labels: LABELS, main: concept === 'C' ? 'muestra' : undefined, container: frame, anchor: 'container', onSelect: onSelect(log), ...extra })
    frame.__fab = fab
    frame.dataset.count = n
    if (log) log.textContent = n === 0 ? 'Sin acciones: no se pinta nada (ni botón ni panel vacío).' : ''
    return fab
  }

  function gallery() {
    for (const sec of document.querySelectorAll('[data-gallery]')) {
      const concept = sec.dataset.gallery
      const frames = [...sec.querySelectorAll('.frame')]
      for (const f of frames) f.querySelector('.frame__scroll').innerHTML = content(14)
      const counts = sec.querySelector('.counts')
      const set = (n) => {
        for (const b of counts.querySelectorAll('button')) b.setAttribute('aria-pressed', String(b.dataset.n === String(n)))
        for (const f of frames) mountFab(f, concept, n)
      }
      counts.addEventListener('click', (e) => { const b = e.target.closest('button[data-n]'); if (b) set(Number(b.dataset.n)) })
      set(Number(sec.dataset.n || 6))
    }
    const bad = document.getElementById('f-bad')
    if (bad) { bad.querySelector('.frame__scroll').innerHTML = content(8); mountFab(bad, 'A', 'bad'); document.getElementById('bad-list').innerHTML = window.__fabWarnings.filter((w) => w.owner === 'f-bad-fab').map((w) => `<li>${w.msg.replace(/</g, '&lt;')}</li>`).join('') }
    const empty = document.getElementById('f-empty')
    if (empty) { empty.querySelector('.frame__scroll').innerHTML = content(6); mountFab(empty, 'A', 0) }
    const off = document.getElementById('f-off')
    if (off) { off.querySelector('.frame__scroll').innerHTML = content(6); mountFab(off, 'A', 1, { items: [{ ...ALL[10] }] }) }
  }

  // ---------------- Modo `?solo=`: un FAB fijo al visor, bordes compartidos y un modal real ----------------
  function solo() {
    const concept = Q.get('solo')
    const n = Number(Q.get('n') || 10)
    const pos = Q.get('pos') || 'bottom-end'
    document.body.classList.add('is-solo')
    document.querySelector('main').innerHTML = `<h1>${concept} · ${n} acciones · ${pos}</h1><p class="lead">El FAB fijo al visor (<code>anchor="viewport"</code>). <button type="button" class="lab-row" id="open-modal" style="display:inline-flex;border:1px solid var(--g-color-border-control);border-radius:var(--g-radius-md);background:var(--g-color-surface)">Abrir diálogo modal</button></p><p class="lab-log" id="solo-log"></p>${content(30)}<dialog id="modal" aria-labelledby="modal-t"><h2 id="modal-t">Diálogo modal</h2><p>Bajo un modal el FAB queda inerte y su lista se cierra.</p><button type="button" id="close-modal">Cerrar</button></dialog>`
    const E = LabFab.EDGE_ORDER
    if (Q.get('speech')) { const s = document.createElement('div'); s.className = 'lab-speech'; s.id = 'lab-speech'; s.textContent = 'Escuchando… 0:04'; s.style.setProperty('--_speech-before', '0px'); document.body.append(s); requestAnimationFrame(() => labEdge.set('speech', 'bottom', s.offsetHeight + 16, E.speech)) }
    if (Q.get('dock')) { const d = document.createElement('div'); d.className = 'lab-dock'; d.id = 'lab-dock'; d.innerHTML = '<span class="cap">Muelle de GPageHeader (acciones de página)</span>'; document.body.append(d); requestAnimationFrame(() => { d.style.insetBlockEnd = `${labEdge.sum('bottom', E.pageHeader)}px`; labEdge.set('dock', 'bottom', d.offsetHeight, E.pageHeader) }) }
    const fab = LabFab.create(document.body, { concept, id: 'solo-fab', items: SETS[n], label: LAUNCH[concept], icon: 'plus', labels: LABELS, main: concept === 'C' ? 'muestra' : undefined, anchor: 'viewport', position: pos, onSelect: onSelect(document.getElementById('solo-log')) })
    if (Q.get('toast')) {
      const t = document.createElement('div'); t.className = 'lab-toast'; t.id = 'lab-toast'; t.setAttribute('role', 'status'); t.textContent = 'Muestra M-1041 guardada'
      document.body.append(t)
      const sync = () => t.style.setProperty('--_toast-offset', `${labEdge.sum('bottom')}px`) // GToaster suma todas las reservas de su borde
      labEdge.sub(sync); requestAnimationFrame(sync)
    }
    const m = document.getElementById('modal')
    document.getElementById('open-modal').addEventListener('click', () => m.showModal())
    document.getElementById('close-modal').addEventListener('click', () => m.close())
    return fab
  }

  if (Q.get('solo')) solo(); else gallery()
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__ready = true }))
})()
