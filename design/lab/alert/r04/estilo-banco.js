// coco · banco de estilo de la cápsula D1 (isla de estado r04). La lógica es la de D1 en r04/index.html (kiwi), copiada sin
// cambios de comportamiento ni de movimiento: forma, relevo, asomo, lista, tiempo y pausa, recogerse, marca y eco, foco y
// teclado. Solo cambia el marcado en tres detalles visuales (estilo.md §5): `data-g-zone="brand"` en la cápsula y en la
// marca en V3; la pista del anillo (`ring__track`); y un envoltorio `d1__tail` para «+N» y el chevrón.
// ?v=V1|V2|V3 · &theme=dark · &vista=galeria|comparativa (los mismos nodos, quietos, para capturas) · &dir=rtl · &t=ms
(function () {
  const B = window.Base
  const q = new URLSearchParams(location.search)
  const V = /^(V[123]|V2C)$/.test((q.get('v') || '').toUpperCase()) ? q.get('v').toUpperCase() : 'V1'
  const VISTA = q.get('vista')
  if (q.get('theme') === 'dark') document.documentElement.dataset.theme = 'dark'
  if (q.get('dir') === 'rtl') document.documentElement.dir = 'rtl'
  if (VISTA) document.documentElement.dataset.vista = VISTA
  const ZONE = (v) => v === 'V3'
  document.getElementById('pick-' + V).setAttribute('aria-current', 'page')
  const themeLink = document.getElementById('pick-theme')
  const dark = q.get('theme') === 'dark'
  themeLink.textContent = dark ? 'Tema claro' : 'Tema oscuro'
  themeLink.href = `?v=${V}${dark ? '' : '&theme=dark'}`
  document.getElementById('pick-gal').href = `?v=${V}${dark ? '&theme=dark' : ''}&vista=galeria`
  const LEAD = {
    V1: 'V1 · Tinta. La superficie inversa de hoy (#325), pulida: más baja y con más aire, título 14/600, insignia de 24 con el anillo de tiempo en la tinta, sombra en dos capas y un filo de luz arriba.',
    V2: 'V2 · Cristal. El material translúcido del sistema: desenfoca lo que pasa por detrás, blanco esmerilado en claro y grafito en oscuro, con un hilo que la delimita y la insignia en el tono suave del tipo.',
    V2C: 'V2C · Cristal corregida. El oscuro de V2 sin cambios; en claro, esmerilado gris en vez de blanco sobre blanco, el disco pleno del tipo y un segundo filo que la separa de una cabecera de marca.',
    V3: 'V3 · Obsidiana. La isla profunda en claro y en oscuro, como la isla dinámica: el tipo es el color del glifo y del anillo, la acción es tinta invertida. La cápsula es una zona de marca.'
  }
  document.getElementById('lead').textContent = LEAD[V] + ' Comportamiento y movimiento: los de D1 (kiwi), sin cambios.'
  const isle = document.getElementById('isle'); isle.dataset.p = 'D1'; isle.dataset.v = V
  const region = document.getElementById('region')
  const mark = document.getElementById('mark-save'); mark.dataset.v = V
  if (ZONE(V)) mark.setAttribute('data-g-zone', 'brand')
  const hdr = document.getElementById('hdr')
  const I = B.icon, E = B.esc
  const TY = B.TYPES
  const readFor = (c) => B.T || Math.min(12000, Math.max(5000, 2000 + 60 * ((c.title || '').length + (c.description || '').length)))
  const setTop = () => isle.style.setProperty('--_top', hdr.getBoundingClientRect().bottom + 'px')
  setTop(); addEventListener('resize', setTop)

  // ---------- Piezas de marcado (las comparten la isla viva y la galería) ----------
  const mmss = (ms) => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` }
  const RING = '<svg class="ring" viewBox="0 0 36 36" aria-hidden="true"><circle class="ring__track" cx="18" cy="18" r="16" pathLength="100"/><circle class="ring__arc" cx="18" cy="18" r="16" pathLength="100"/></svg>'
  const badge = (c, extra = '') => `<span class="badge${c.busy ? ' is-busy' : ''}" data-type="${c.type}" aria-hidden="true">${I(c.busy ? 'loader-circle' : B.ICON[c.type])}${extra}</span>`
  const actBtn = (c, cls = 'ibtn') => c.action ? `<button type="button" class="${cls}" data-do="act" data-id="${E(c.id)}"${c.busy ? ' aria-disabled="true"' : ''}>${E(c.busy ? (c.action.busyLabel || c.action.label) : c.action.label)}</button>` : ''
  const timer = (c, now = Date.now()) => c.deadline ? `<span class="timer" role="timer" aria-live="off" data-deadline="${c.deadline}">${mmss(c.deadline - now)}</span>` : ''
  function itemHTML (c) {
    const a = [actBtn(c)]
    if (c.link) a.push(`<a class="ibtn ibtn--quiet" href="${E(c.link.href)}" data-do="link">${E(c.link.label)}</a>`)
    if (c.origin && c.type !== 'success') a.push(`<button type="button" class="ibtn ibtn--quiet" data-do="origin" data-id="${E(c.id)}">${E(c.origin.label)}</button>`)
    if (c.dismissible) a.push(`<button type="button" class="ibtn ibtn--quiet ibtn--icon" data-do="dismiss" data-id="${E(c.id)}" aria-label="Descartar: ${E(c.title)}">${I('x')}</button>`)
    return `<li class="item" data-type="${c.type}" data-item="${E(c.id)}"${c.busy ? ' aria-busy="true"' : ''}>${badge(c)}<div><p class="item__title"><span class="sr">${TY[c.type]}: </span>${E(c.title)}</p>${c.description ? `<p class="item__desc">${E(c.description)}</p>` : ''}${timer(c)}</div>${a.join('') ? `<div class="item__actions">${a.join('')}</div>` : ''}</li>`
  }
  const listHTML = (all) => `<div class="list-head"><span aria-hidden="true">Pendiente</span><button type="button" class="ibtn" data-do="close">${I('x')} Cerrar</button></div><ul class="items">${all.map(itemHTML).join('')}</ul>`
  // El interior de la cápsula (igual que paintD1 de kiwi; + pista del anillo y envoltorio d1__tail)
  function innerHTML (cur, { list, peek, waiting, roll, total }) {
    const ring = cur.deadline ? '' : RING
    const count = list ? '' : waiting ? `<span class="d1__count"><span aria-hidden="true">+${waiting}</span><span class="sr">, ${waiting} más en espera</span></span>` : ''
    const chev = list ? '' : `<span class="d1__chev" aria-hidden="true">${I('chevron-down')}</span>`
    return `<div class="d1__row"><button type="button" class="d1__summary" aria-expanded="${list || peek}" aria-keyshortcuts="Alt+F8">${badge(cur, ring)}${list ? `<span class="d1__text">Pendiente (${total})</span>` : `<span class="d1__text${roll ? ' roll' : ''}"><span class="sr">${TY[cur.type]}: </span>${E(cur.title)}</span>`}${timer(cur)}</button>${count || chev ? `<span class="d1__tail">${count}${chev}</span>` : ''}</div>
      <div class="d1__more"${list || peek ? '' : ' hidden'}>${list ? listHTML(list) : `${cur.description ? `<p class="d1__desc">${E(cur.description)}</p>` : ''}<div class="d1__acts">${actBtn(cur)}${cur.origin && cur.type !== 'success' ? `<button type="button" class="ibtn ibtn--quiet" data-do="origin" data-id="${E(cur.id)}">${E(cur.origin.label)}</button>` : ''}${cur.link ? `<a class="ibtn ibtn--quiet" href="${E(cur.link.href)}" data-do="link">${E(cur.link.label)}</a>` : ''}<button type="button" class="ibtn ibtn--quiet" data-do="dismiss-view">Ocultar</button></div>`}</div>`
  }
  const markHTML = (c) => `${badge(c)}<span><span class="sr">${TY[c.type]}: </span>${c.type === 'success' ? 'Guardada' : c.busy ? 'Reintentando…' : 'No se guardó'}</span>`
  const newShape = (v) => `<div class="d1 inv"${ZONE(v) ? ' data-g-zone="brand"' : ''}><div class="d1__inner"></div></div>`

  if (VISTA) { gallery(); return }

  // ---------- Estado de la vista (D1 de kiwi) ----------
  let shown = []
  let queue = []
  let list = false
  let peek = false
  let saved = null
  const left = new Map()
  const total = new Map()

  function paused () {
    return list || document.visibilityState === 'hidden' || isle.matches(':hover') || isle.contains(document.activeElement) || mark.matches(':hover,:focus')
  }
  let lastT = performance.now()
  setInterval(() => {
    const now = performance.now(), dt = now - lastT; lastT = now
    const p = paused()
    isle.dataset.paused = String(p)
    for (const id of [...shown]) {
      if (!left.has(id)) continue
      if (!p) left.set(id, left.get(id) - dt)
      const el = region.querySelector('.d1')
      if (el) el.style.setProperty('--_left', Math.max(0, left.get(id) / total.get(id)).toFixed(3))
      if (left.get(id) <= 0) expire(id)
    }
    region.querySelectorAll('[data-deadline]').forEach((t) => { t.textContent = mmss(+t.dataset.deadline - Date.now()) })
  }, 50)
  function arm (id) {
    const c = B.conds.get(id)
    if (!c || c.deadline) { left.delete(id); return }
    const ms = readFor(c); left.set(id, ms); total.set(id, ms)
  }
  const borderW = (el) => parseFloat(getComputedStyle(el).borderTopWidth) || 0

  function paintD1 ({ roll = false } = {}) {
    let shape = region.querySelector('.d1')
    const id = shown[0]
    const c = id && B.conds.get(id)
    if (!list && !c) { if (shape) shape.hidden = true; return }
    if (!shape) { region.innerHTML = newShape(V); shape = region.querySelector('.d1'); shape.hidden = true; watchSize(shape) }
    const inner = shape.firstElementChild
    const cur = c || B.list()[0]
    inner.innerHTML = innerHTML(cur, { list: list ? B.list() : false, peek, waiting: queue.length, roll, total: B.conds.size })
    shape.classList.toggle('is-peek', peek && !list)
    shape.classList.toggle('is-list', list)
    const wasHidden = shape.hidden
    if (wasHidden) { isle.classList.add('no-tr'); shape.style.visibility = 'hidden'; shape.hidden = false }
    const w = inner.offsetWidth + 2 * borderW(shape), h = inner.offsetHeight + 2 * borderW(shape)
    const capsule = wasHidden && !list && !B.reduced()
    shape.style.setProperty('--_w', capsule ? 'calc(var(--g-space-1) * 24)' : w + 'px')
    shape.style.setProperty('--_h', capsule ? 'var(--_row)' : h + 'px')
    if (capsule) shape.classList.add('is-veiled')
    if (wasHidden) {
      void shape.offsetWidth; shape.style.visibility = ''
      requestAnimationFrame(() => isle.classList.remove('no-tr'))
      play(shape, 'is-in', () => { if (leaving) return; shape.style.setProperty('--_w', inner.offsetWidth + 2 * borderW(shape) + 'px'); shape.style.setProperty('--_h', inner.offsetHeight + 2 * borderW(shape) + 'px'); shape.classList.remove('is-veiled') })
    }
  }
  function watchSize (shape) {
    if (typeof ResizeObserver !== 'function') return
    new ResizeObserver(() => {
      if (shape.hidden || leaving || shape.classList.contains('is-veiled')) return
      const inner = shape.firstElementChild, b = borderW(shape)
      shape.style.setProperty('--_w', inner.offsetWidth + 2 * b + 'px')
      shape.style.setProperty('--_h', inner.offsetHeight + 2 * b + 'px')
    }).observe(shape.firstElementChild)
  }
  function paint (o) {
    const keep = isle.contains(document.activeElement) ? document.activeElement : null
    const key = keep && keep.dataset.do ? `[data-do="${keep.dataset.do}"]${keep.dataset.id ? `[data-id="${CSS.escape(keep.dataset.id)}"]` : ''}` : keep && keep.matches('.d1__summary') ? '.d1__summary' : null
    if (leaving) { paintMark(); return }
    isle.dataset.form = list ? 'list' : shown.length ? 'line' : 'empty'
    paintMark()
    paintD1(o)
    if (keep && !keep.isConnected) { const back = key && region.querySelector(key); (back || firstFocusable() || null)?.focus?.() }
  }
  function paintMark () {
    const c = B.conds.get('save')
    if (!c || !document.getElementById('save')) { mark.hidden = true; return }
    mark.hidden = false
    mark.innerHTML = markHTML(c)
  }
  const firstFocusable = () => region.querySelector('.d1__summary')
  function play (el, cls, done) {
    el.classList.remove('is-in', 'is-out'); void el.offsetWidth; el.classList.add(cls)
    let ok = false
    const end = (e) => { if (ok || (e && e.target !== el)) return; ok = true; el.removeEventListener('animationend', end); if (cls === 'is-in') el.classList.remove('is-in'); if (done) done() }
    el.addEventListener('animationend', end); setTimeout(end, 600)
  }
  function focusOut () {
    const t = saved && saved.isConnected && !isle.contains(saved) ? saved : !mark.hidden ? mark : B.neighbour(document.getElementById('sim'))
    if (t) t.focus()
  }
  let leaving = 0
  function leaveAll (after) {
    const shape = region.querySelector('.d1')
    const gone = [...shown]
    const finish = () => { leaving = 0; shown = []; queue = []; list = false; peek = false; gone.forEach(afterGone); paint(); if (after) after() }
    if (!shape || shape.hidden) { finish(); return }
    if (isle.contains(document.activeElement)) focusOut()
    const tok = ++leaving
    if (!B.reduced()) {
      shape.classList.add('is-veiled', 'is-leaving')
      shape.style.setProperty('--_w', 'calc(var(--g-space-1) * 24)'); shape.style.setProperty('--_h', 'var(--_row)')
      setTimeout(() => { if (tok === leaving) play(shape, 'is-out', () => { shape.classList.remove('is-out', 'is-veiled', 'is-leaving'); shape.hidden = true; if (tok === leaving) finish() }) }, 240)
    } else play(shape, 'is-out', () => { shape.classList.remove('is-out'); shape.hidden = true; if (tok === leaving) finish() })
  }
  function afterGone (id) {
    left.delete(id)
    const c = B.conds.get(id); if (!c) return
    if (c.type === 'success' && !c.link) { B.remove(id, 'read'); return }
    if (id === 'save' && !mark.hidden && !B.reduced()) { mark.classList.remove('is-echo'); void mark.offsetWidth; mark.classList.add('is-echo'); setTimeout(() => mark.classList.remove('is-echo'), 900) }
  }
  function expire (id) {
    left.delete(id)
    if (queue.length) { const next = queue.shift(); afterGone(id); shown = [next]; arm(next); paint({ roll: true }); return }
    leaveAll()
  }
  function show (id) {
    if (leaving) { leaving = 0; region.querySelectorAll('.is-out,.is-veiled,.is-leaving').forEach((el) => el.classList.remove('is-out', 'is-veiled', 'is-leaving')); const s = region.querySelector('.d1'); if (s) s.hidden = true; shown = [] }
    if (list) { paint(); return }
    if (!shown.length) { shown = [id]; arm(id); paint(); return }
    if (shown[0] === id) { arm(id); paint(); return }
    queue = queue.filter((x) => x !== id)
    const rank = (x) => B.RANK[(B.conds.get(x) || {}).type] ?? 9
    if (rank(id) < rank(shown[0])) { queue.unshift(shown[0]); shown = [id]; arm(id); paint({ roll: true }); return }
    queue.push(id); queue.sort((a, b) => rank(a) - rank(b))
    paint()
  }
  function openList (focus) {
    if (leaving) { leaving = 0; region.querySelectorAll('.is-out,.is-veiled,.is-leaving').forEach((el) => el.classList.remove('is-out', 'is-veiled', 'is-leaving')) }
    list = true; peek = false; paint()
    if (focus === 'summary') (region.querySelector('.d1__summary') || firstFocusable())?.focus()
    else if (focus) { const t = region.querySelector(`[data-do=act][data-id="${CSS.escape(focus)}"]:not([aria-disabled=true])`) || region.querySelector(`[data-item="${CSS.escape(focus)}"] [data-do]`); (t || firstFocusable())?.focus() }
  }
  function closeAll () { focusOut(); list = false; leaveAll() }

  B.on((ev) => {
    if (!B.mounted) { paint(); return }
    if (ev.kind === 'remove') {
      shown = shown.filter((x) => x !== ev.id); queue = queue.filter((x) => x !== ev.id); left.delete(ev.id)
      if (!shown.length && queue.length) { shown = [queue.shift()]; arm(shown[0]); paint({ roll: true }); return }
      if (!B.conds.size || (!shown.length && !list)) { leaveAll(); return }
      paint(); return
    }
    if (ev.kind === 'state') { paint(); return }
    if (ev.kind === 'appear' || ev.kind === 'announce' || ev.changed) show(ev.id); else paint()
  })

  region.addEventListener('click', (e) => {
    const t = e.target.closest('[data-do],.d1__summary'); if (!t) return
    if (t.matches('.d1__summary')) { if (list) closeAll(); else openList('summary'); return }
    const d = t.dataset.do, id = t.dataset.id
    if (d === 'act') { if (t.getAttribute('aria-disabled') !== 'true') B.act(id) }
    else if (d === 'close') closeAll()
    else if (d === 'dismiss') B.remove(id, 'dismiss')
    else if (d === 'dismiss-view') closeAll()
    else if (d === 'origin') { const c = B.conds.get(id); closeAll(); const el = document.getElementById(c.origin.target); if (el) { if (!el.matches('a,button,input,[tabindex]')) el.tabIndex = -1; el.focus(); el.scrollIntoView({ block: 'nearest' }) } }
    else if (d === 'link') { e.preventDefault(); closeAll() }
  })
  const setPeek = (v) => { if (list || peek === v || !shown.length) return; peek = v; paint() }
  isle.addEventListener('pointerenter', () => setPeek(true), true)
  isle.addEventListener('pointerleave', (e) => { if (e.target === region.querySelector('.d1') && !isle.contains(document.activeElement)) setPeek(false) }, true)
  isle.addEventListener('focusin', () => setPeek(true))
  isle.addEventListener('focusout', () => setTimeout(() => { if (!isle.contains(document.activeElement) && !isle.matches(':hover')) setPeek(false) }, 0))
  isle.addEventListener('keydown', (e) => { if (e.key === 'Escape' && (shown.length || list)) { e.preventDefault(); e.stopPropagation(); closeAll() } })
  document.addEventListener('pointerdown', (e) => { if (list && !isle.contains(e.target) && !mark.contains(e.target)) closeAll() }, true)
  document.addEventListener('keydown', (e) => {
    if (!B.hotkey(e) || !B.conds.size) return
    e.preventDefault()
    if (isle.contains(document.activeElement)) { closeAll(); return }
    saved = document.activeElement
    openList('summary')
  })
  mark.addEventListener('click', () => { saved = mark; if (B.conds.has('save')) openList('save') })

  const wait = (ms) => new Promise((r) => setTimeout(r, ms))
  const fails = document.getElementById('fails')
  const saveReq = () => wait(700).then(() => { if (fails.checked) throw new Error('500'); return { type: 'success', title: 'Factura guardada con el folio F-0042', description: '', details: undefined, action: undefined, link: { label: 'Ver factura', href: '#f-0042' } } })
  document.getElementById('form').addEventListener('submit', () => {
    if (!fails.checked) { B.set('save', { type: 'success', title: 'Factura guardada con el folio F-0042', description: '', action: undefined, link: { label: 'Ver factura', href: '#f-0042' }, origin: { label: 'Ir al formulario', target: 'form' } }); return }
    if (B.conds.has('save') && B.conds.get('save').type === 'error') { B.again('save'); return }
    B.set('save', { type: 'error', title: 'No se pudo guardar la factura', description: 'El servidor no respondió; tus datos siguen en el formulario.', action: { label: 'Reintentar', busyLabel: 'Reintentando…', onClick: saveReq }, origin: { label: 'Ir al formulario', target: 'form' } })
  })
  document.getElementById('s-offline').onclick = () => B.set('offline', { type: 'warning', title: 'Sin conexión', description: 'Los cambios se guardarán al volver.' })
  document.getElementById('s-online').onclick = () => B.resolve('offline', 'Conexión restablecida')
  document.getElementById('s-maint').onclick = () => B.set('maint', { type: 'info', title: 'Mantenimiento esta noche', description: 'De 23:00 a 23:30 no se podrá guardar.', dismissible: true })
  document.getElementById('s-session').onclick = () => B.set('session', { type: 'warning', title: 'La sesión caduca pronto', description: 'Sigue conectado para no perder los cambios.', deadline: Date.now() + 120000, action: { label: 'Seguir conectado', onClick: () => { B.resolve('session', 'Sesión renovada') } } })
  document.getElementById('s-three').onclick = () => { document.getElementById('s-maint').click(); document.getElementById('s-offline').click(); document.getElementById('save').click() }
  document.getElementById('s-clear').onclick = () => { [...B.conds.keys()].forEach((id) => B.remove(id, 'clear')) }
  document.getElementById('explain').textContent = 'Prueba: Guardar (falla) → cae, se lee y se recoge; el error queda en «No se guardó» (eco al recogerse). Púlsala o Alt+F8 para volver a verlo. «Tres a la vez» enseña el relevo. «Sesión por caducar» se queda hasta actuar. Cambia de variante o de tema arriba.'
  window.__S = { B, V, get shown () { return shown }, get queue () { return queue }, get list () { return list }, openList, closeAll, paint }
  B.mount(isle)
  paint()
  requestAnimationFrame(() => requestAnimationFrame(() => isle.classList.add('is-ready')))

  // ---------- Galería: los mismos nodos, quietos, sobre tres fondos ----------
  function gallery () {
    const gal = document.getElementById('gal')
    const NOW = Date.now()
    const S = {
      error: { id: 'save', type: 'error', title: 'No se pudo guardar la factura', description: 'El servidor no respondió; tus datos siguen en el formulario.', action: { label: 'Reintentar' }, origin: { label: 'Ir al formulario', target: 'form' } },
      warning: { id: 'offline', type: 'warning', title: 'Sin conexión', description: 'Los cambios se guardarán al volver.' },
      info: { id: 'maint', type: 'info', title: 'Mantenimiento esta noche', description: 'De 23:00 a 23:30 no se podrá guardar.', dismissible: true },
      success: { id: 'ok', type: 'success', title: 'Factura guardada con el folio F-0042', link: { label: 'Ver factura', href: '#f' } },
      busy: { id: 'save', type: 'error', title: 'No se pudo guardar la factura', description: 'El servidor no respondió; tus datos siguen en el formulario.', action: { label: 'Reintentar', busyLabel: 'Reintentando…' }, busy: true, origin: { label: 'Ir al formulario', target: 'form' } },
      session: { id: 'session', type: 'warning', title: 'La sesión caduca pronto', description: 'Sigue conectado para no perder los cambios.', deadline: NOW + 107000, action: { label: 'Seguir conectado' } }
    }
    const ALL = [S.error, S.warning, S.info, S.success]
    // una cápsula quieta: el mismo marcado que la viva, medida igual (inner + 2 bordes)
    const capsule = (v, cur, o = {}) => {
      const wrap = document.createElement('div')
      wrap.className = 'isle isle--static'; wrap.dataset.v = v; wrap.dataset.p = 'D1'
      wrap.dataset.paused = String(!!o.paused)
      wrap.dataset.form = o.list ? 'list' : 'line'
      wrap.innerHTML = newShape(v)
      const shape = wrap.firstElementChild
      shape.firstElementChild.innerHTML = innerHTML(cur, { list: o.list ? ALL : false, peek: !!o.peek, waiting: o.waiting || 0, total: ALL.length })
      shape.classList.toggle('is-peek', !!o.peek); shape.classList.toggle('is-list', !!o.list)
      if (o.focus) shape.classList.add('is-focus-demo')
      shape.style.setProperty('--_left', String(o.left ?? 0.62))
      return wrap
    }
    const size = () => gal.querySelectorAll('.isle--static .d1').forEach((shape) => {
      const inner = shape.firstElementChild, b = parseFloat(getComputedStyle(shape).borderTopWidth) || 0
      shape.style.setProperty('--_w', inner.offsetWidth + 2 * b + 'px'); shape.style.setProperty('--_h', inner.offsetHeight + 2 * b + 'px')
    })
    const cap = (label, el) => { const d = document.createElement('div'); d.className = 'gal__cap'; d.append(el); const s = document.createElement('span'); s.textContent = label; d.append(s); return d }
    const markEl = (v, c) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'mark'; b.dataset.v = v; if (ZONE(v)) b.setAttribute('data-g-zone', 'brand'); b.innerHTML = markHTML(c); return b }
    const TABLE = '<table class="x-table"><thead><tr><th>Folio</th><th>Cliente</th><th>Total</th><th>Estado</th></tr></thead><tbody>' +
      ['F-0040 Clínica Norte $1,200 Pagada', 'F-0041 Laboratorio Sur $860 Pendiente', 'F-0042 Hospital Centro $2,430 Pagada', 'F-0043 Farmacia Río $310 Vencida', 'F-0044 Consultorio Uno $1,050 Pagada'].map((r) => { const [f, a, b, t, e] = r.split(' '); return `<tr><td>${f}</td><td>${a} ${b}</td><td>${t}</td><td>${e}</td></tr>` }).join('') + '</tbody></table>'
    const panel = (kind, title, items) => {
      const p = document.createElement('section'); p.className = `gal__panel gal__panel--${kind}`; p.dataset.bg = kind
      if (kind === 'table') p.innerHTML = `<div class="gal__bg gal__bg--table">${TABLE}${TABLE}</div>`
      if (kind === 'zone') p.innerHTML = '<div class="gal__bg gal__bg--zone" data-g-zone="brand"></div>'
      const h = document.createElement('h3'); h.textContent = title
      const st = document.createElement('div'); st.className = 'gal__stack'; st.append(...items)
      const outer = document.createElement('div'); outer.append(h, p); p.append(st)
      return outer
    }
    const vs = VISTA === 'comparativa' ? ['V1', 'V2', 'V2C', 'V3'] : VISTA === 'cristal' ? ['V2', 'V2C'] : [V]
    const NAME = { V1: 'V1 · Tinta', V2: 'V2 · Cristal', V2C: 'V2C · Cristal corregida', V3: 'V3 · Obsidiana' }
    if (VISTA === 'comparativa' || VISTA === 'cristal') {
      const h = document.createElement('h2'); h.textContent = `${VISTA === 'cristal' ? 'Cristal y Cristal corregida' : 'Comparativa'} · ${dark ? 'oscuro' : 'claro'}`; gal.append(h)
      const row = document.createElement('div'); row.className = 'gal__cmp'; row.style.setProperty('--_cols', String(vs.length))
      for (const v of vs) {
        const col = document.createElement('div'); col.className = 'gal__col'
        const t = document.createElement('h3'); t.textContent = NAME[v]; col.append(t)
        col.append(panel('page', 'Página', [cap('Titular · +2 en espera', capsule(v, S.error, { waiting: 2 })), cap('Asomo (puntero o foco)', capsule(v, S.error, { peek: true }))]))
        col.append(panel('table', 'Sobre una tabla', [cap('Titular', capsule(v, S.warning, { left: 0.4 }))]))
        col.append(panel('zone', 'Sobre la zona de marca', [cap('Titular', capsule(v, S.info, { left: 0.8 }))]))
        row.append(col)
      }
      gal.append(row)
    } else {
      const v = V
      const h = document.createElement('h2'); h.textContent = `${NAME[v]} · ${dark ? 'oscuro' : 'claro'}`; gal.append(h)
      const grid = document.createElement('div'); grid.className = 'gal__grid'
      grid.append(panel('page', 'Página · estados de la línea', [
        cap('Error · el anillo es el tiempo que queda', capsule(v, S.error, { left: 0.7 })),
        cap('Advertencia · +2 en espera', capsule(v, S.warning, { waiting: 2, left: 0.45 })),
        cap('Información · en pausa (puntero o foco)', capsule(v, S.info, { paused: true, left: 0.55 })),
        cap('Correcto · con enlace', capsule(v, S.success, { left: 0.2 })),
        cap('Ocupado · Reintentando…', capsule(v, S.busy, { left: 0.9 })),
        cap('Cuenta atrás (deadline) · en lugar del anillo', capsule(v, S.session)),
      ]))
      grid.append(panel('page', 'Página · asomo y lista', [
        cap('Asomo · descripción y acciones', capsule(v, S.error, { peek: true, paused: true, left: 0.5 })),
        cap('Asomo con el foco en el resumen (enfocar abre el asomo)', capsule(v, S.warning, { peek: true, paused: true, focus: true, left: 0.6 })),
        cap('Lista «Pendiente» (Alt+F8, marca o pulsar)', capsule(v, S.error, { list: true })),
        cap('Marca junto al origen', markEl(v, S.error))
      ]))
      grid.append(panel('table', 'Sobre una tabla (lo que pasa por detrás)', [
        cap('Titular', capsule(v, S.error, { waiting: 1, left: 0.7 })),
        cap('Asomo', capsule(v, S.warning, { peek: true, paused: true, left: 0.4 }))
      ]))
      grid.append(panel('zone', 'Sobre la zona de marca (cabecera)', [
        cap('Titular', capsule(v, S.info, { left: 0.8 })),
        cap('Asomo', capsule(v, S.error, { peek: true, paused: true, left: 0.5 }))
      ]))
      gal.append(grid)
    }
    size()
    document.fonts && document.fonts.ready.then(size)
    window.__G = { ready: true, size }
  }
})()
