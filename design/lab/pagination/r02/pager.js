// Prototipo de kiwi · paginación r02 · selector de filas por página (base y conceptos A, B, C).
// Motor del laboratorio, no del componente: datos, ancla, carga simulada del servidor, anuncios y los tres conceptos.
// El DOM de la tabla y de la paginación repite las clases reales de GTable y GPagination (su CSS llega de dist/grana.css).
(() => {
  const Q = new URLSearchParams(location.search)
  const C = ['base', 'A', 'B', 'C'].includes(Q.get('c')) ? Q.get('c') : 'base'
  const S = {
    c: C, page: 1, size: 10, sizes: [10, 25, 50, 100],
    server: Q.get('server') === '1', limited: Q.get('h') === '1', filtered: false,
    loading: false, pending: false, token: 0, shown: new Set(), lastHold: null, events: []
  }
  const LATENCY = 700 // ms del servidor simulado
  const L = {
    nav: 'Paginación de lotes', previous: 'Página anterior', next: 'Página siguiente', page: 'Página {page}',
    range: '{from}–{to} de {total}', compact: 'Página {page} de {pages}', pageSize: 'Filas por página',
    sizeOption: '{size} por página', all: 'todas', loading: 'Cargando lotes…', results: '{count} resultados',
    rangeSaid: 'Filas {from}–{to} de {total}'
  }
  const fill = (t, v) => t.replace(/\{(\w+)\}/g, (_, k) => (v[k] ?? ''))
  const icon = (name, cls = 'pg-icon') => `<svg class="g-icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${window.LUCIDE_ICONS[name]}</svg>`
  const $ = (s, el = document) => el.querySelector(s)

  // ---------- Datos: 240 lotes; 38 «caducados» (el filtro del laboratorio) ----------
  const PRODUCTS = ['Reactivo de Biuret', 'Agar MacConkey', 'Tubo EDTA 4 ml', 'Puntas 200 µl', 'Solución salina', 'Kit PCR SARS', 'Guantes nitrilo M', 'Etanol 70 %', 'Medio Sabouraud', 'Tiras de glucosa']
  const DATA = Array.from({ length: 240 }, (_, i) => ({
    id: `LT-${String(i + 1).padStart(4, '0')}`,
    product: PRODUCTS[(i * 7) % PRODUCTS.length],
    lot: `${2026 - (i % 3)}-${String(400 + ((i * 37) % 600)).padStart(4, '0')}`,
    expiry: `${String(1 + (i * 11) % 28).padStart(2, '0')}/${String(1 + (i * 5) % 12).padStart(2, '0')}/${2026 + (i % 2)}`,
    stock: (i * 53) % 480,
    expired: i % 13 === 0 || i % 13 === 5
  }))
  const all = () => (S.filtered ? DATA.filter((r) => r.expired) : DATA)
  const total = () => all().length
  const pages = () => Math.max(1, Math.ceil(total() / S.size))
  const pageRows = (page = S.page, size = S.size) => all().slice((page - 1) * size, page * size)
  const rangeOf = (page, size) => {
    const t = total()
    return { from: t ? (page - 1) * size + 1 : 0, to: Math.min(page * size, t), total: t }
  }
  const COLS = [
    { key: 'id', label: 'Código', primary: true },
    { key: 'product', label: 'Producto' },
    { key: 'lot', label: 'Lote' },
    { key: 'expiry', label: 'Caducidad' },
    { key: 'stock', label: 'Existencias', end: true }
  ]

  // ---------- Esqueleto del DOM (una vez) ----------
  const frame = $('#frame')
  frame.innerHTML = `
    <div class="g-table g-table--mode-table g-table--appearance-lines g-table--density-default" id="tbl">
      <div class="g-table__scroll"${S.limited ? ' style="--_max-height: 22rem"' : ''}>
        <table class="g-table__table" role="table" tabindex="-1" aria-label="Lotes en inventario">
          <thead role="rowgroup"><tr role="row">${COLS.map((c) => `<th role="columnheader" scope="col"${c.end ? ' class="g-table__cell--end"' : ''}>${c.label}</th>`).join('')}</tr></thead>
          <tbody role="rowgroup"></tbody>
        </table>
      </div>
      ${S.c === 'C' ? '<div class="pgC-edge" id="edge"></div>' : ''}
      <nav class="g-pagination" aria-label="${L.nav}">
        <div class="pg-meta"></div>
        <div class="g-pagination__controls"></div>
      </nav>
      <p class="g-table__sr" aria-live="polite" id="live"></p>
    </div>`
  const root = $('#tbl')
  const scroll = $('.g-table__scroll', root)
  const table = $('table', root)
  const tbody = $('tbody', root)
  const nav = $('nav', root)
  const meta = $('.pg-meta', nav)
  const controls = $('.g-pagination__controls', nav)
  const live = $('#live')
  const logList = $('#log')
  const space = () => parseFloat(getComputedStyle(root).getPropertyValue('--g-space-1')) * (/rem/.test(getComputedStyle(root).getPropertyValue('--g-space-1')) ? parseFloat(getComputedStyle(document.documentElement).fontSize) : 1)

  // ---------- Registro: anuncios y eventos ----------
  const t0 = performance.now()
  const log = (kind, text) => {
    S.events.push({ kind, text, t: Math.round(performance.now() - t0) })
    const li = document.createElement('li')
    li.textContent = `${kind === 'say' ? 'Anuncio' : 'Evento'} · ${text}`
    logList.prepend(li)
    while (logList.children.length > 12) logList.lastChild.remove()
  }
  let sayTimer = 0
  const say = (text) => {
    clearTimeout(sayTimer)
    live.textContent = ''
    sayTimer = setTimeout(() => { live.textContent = text; log('say', text) }, 60)
  }
  const emit = (name, v) => log('emit', `${name} ${v}`)

  // ---------- Pintado de filas ----------
  const rowHtml = (r, i, cls = '') => `<tr role="row" class="g-table__row${cls}" data-key="${r.id}" data-index="${i}">${COLS.map((c) =>
    `<td role="cell" class="g-table__cell${c.primary ? ' g-table__cell--primary' : ''}${c.end ? ' g-table__cell--end' : ''}"><span class="g-table__label" aria-hidden="true">${c.label}</span>${r[c.key]}</td>`).join('')}</tr>`
  const paintRows = () => {
    const first = (S.page - 1) * S.size
    const rows = pageRows()
    const fresh = S.c === 'B' && S.shown.size > 0
    tbody.innerHTML = rows.map((r, j) => rowHtml(r, first + j, fresh && !S.shown.has(r.id) ? ' pgB-new' : '')).join('')
    S.shown = new Set(rows.map((r) => r.id))
    tbody.inert = false
  }
  const expectedCount = () => Math.max(0, Math.min(S.size, total() - (S.page - 1) * S.size))
  const paintSkeleton = (n) => {
    tbody.innerHTML = Array.from({ length: n }, (_, i) => `<tr role="row" class="g-table__row" aria-hidden="true" data-slot="${i}">${COLS.map((c) =>
      `<td role="cell" class="g-table__cell${c.primary ? ' g-table__cell--primary' : ''}${c.end ? ' g-table__cell--end' : ''}"><span class="g-table__skeleton"></span></td>`).join('')}</tr>`).join('')
  }

  // ---------- El ancla: la primera fila A LA VISTA (no la primera de la página) ----------
  const scroller = () => (scroll.scrollHeight > scroll.clientHeight + 1 && getComputedStyle(scroll).overflowY !== 'visible' ? scroll : null)
  const viewBox = () => {
    const sc = scroller()
    let top = 0
    let bottom = innerHeight
    if (sc) {
      const r = sc.getBoundingClientRect()
      top = Math.max(top, r.top + $('thead', table).getBoundingClientRect().height)
      bottom = Math.min(bottom, r.bottom)
    }
    if (nav.classList.contains('is-stuck')) bottom = Math.min(bottom, nav.getBoundingClientRect().top)
    return { top, bottom }
  }
  function capture() {
    const { top, bottom } = viewBox()
    for (const tr of tbody.rows) {
      if (!tr.dataset.key) continue
      const r = tr.getBoundingClientRect()
      // La primera fila visible al menos a medias
      if (r.bottom - Math.max(r.top, top) >= r.height / 2 && r.top < bottom) return { key: tr.dataset.key, index: Number(tr.dataset.index), top: r.top }
    }
    return null // la tabla no está a la vista: ancla = primera fila de la página, sin sujetar nada
  }
  const scrollByY = (dy) => { const sc = scroller(); if (sc) sc.scrollTop += dy; else scrollBy(0, dy) }
  function hold(a, el) {
    if (!a || !el) return
    const dy = el.getBoundingClientRect().top - a.top
    if (Math.abs(dy) > 0.5) scrollByY(dy)
  }
  // Si el control con el foco salió de la pantalla, el control gana (base, A y C; en B el pie acoplado no sale)
  function keepControl() {
    const el = document.activeElement
    if (!el || !(nav.contains(el) || $('#edge')?.contains(el))) return false
    const r = el.getBoundingClientRect()
    if (r.bottom > innerHeight || r.top < 0) { el.scrollIntoView({ block: 'nearest' }); return true }
    return false
  }
  function measureHold(a) {
    if (!a) { S.lastHold = null; return }
    const el = tbody.querySelector(`tr[data-key="${a.key}"]`)
    S.lastHold = { key: a.key, before: a.top, after: el ? el.getBoundingClientRect().top : null }
  }
  function mark(a) {
    if (S.c !== 'B' || !a) return
    const el = tbody.querySelector(`tr[data-key="${a.key}"]`)
    if (!el) return
    el.classList.add('pgB-here')
    setTimeout(() => el.classList.remove('pgB-here'), 1300)
  }

  // ---------- Cambios: tamaño y página ----------
  function targetPage(n, a) {
    const first = a ? a.index : (S.page - 1) * S.size
    return Math.floor(first / n) + 1
  }
  function changeSize(n, promised) {
    n = Number(n)
    if (n === S.size) return
    const a = promised !== undefined ? promised : capture() // A: el ancla de la vista previa (lo prometido se cumple)
    const page = targetPage(n, a)
    S.size = n
    emit('update:pageSize', n)
    if (page !== S.page) { S.page = page; emit('update:page', page) }
    commit(a)
  }
  function goPage(p) {
    if (p < 1 || p > pages() || p === S.page) return
    const hadFocus = nav.contains(document.activeElement)
    S.page = p
    emit('update:page', p)
    commit(null)
    if (hadFocus) $('[aria-current="page"]', controls)?.focus()
  }
  function commit(a) {
    renderPager()
    if (S.server) { load(a); return }
    paintRows()
    hold(a, a && tbody.querySelector(`tr[data-key="${a.key}"]`))
    const moved = keepControl()
    measureHold(a)
    S.lastHold && (S.lastHold.controlWon = moved)
    mark(a)
    say(fill(L.rangeSaid, rangeOf(S.page, S.size)))
  }
  // Servidor simulado con el motor de carga de la tabla (#540): 200 ms inertes, esqueleto con las filas QUE VAN A LLEGAR
  // (L4) y con la ranura del ancla en su sitio, llegada a los 700 ms, ancla sujeta por rowKey
  function load(a) {
    const token = ++S.token
    S.loading = true; S.pending = true
    root.classList.add('is-loading', 'is-pending')
    table.setAttribute('aria-busy', 'true')
    tbody.inert = true
    live.textContent = ''
    setTimeout(() => {
      if (token !== S.token) return
      S.pending = false
      root.classList.remove('is-pending')
      paintSkeleton(expectedCount())
      if (a) hold(a, tbody.rows[a.index - (S.page - 1) * S.size])
      keepControl()
      say(L.loading)
    }, 200)
    setTimeout(() => {
      if (token !== S.token) return
      S.loading = false
      root.classList.remove('is-loading', 'is-pending')
      table.setAttribute('aria-busy', 'false')
      paintRows()
      hold(a, a && tbody.querySelector(`tr[data-key="${a.key}"]`))
      const moved = keepControl()
      measureHold(a)
      S.lastHold && (S.lastHold.controlWon = moved)
      mark(a)
      say(fill(L.rangeSaid, rangeOf(S.page, S.size)))
    }, LATENCY)
  }

  // ---------- La paginación (controles reconstruidos; el selector es persistente: no pierde el foco) ----------
  function pageItems(page, n, sib = 1) {
    const set = new Set([1, n])
    for (let p = page - sib; p <= page + sib; p++) if (p >= 1 && p <= n) set.add(p)
    const sorted = [...set].sort((a, b) => a - b)
    const out = []
    sorted.forEach((p, i) => { if (i > 0) { const g = p - sorted[i - 1]; if (g === 2) out.push(p - 1); else if (g > 2) out.push(null) } out.push(p) })
    return out
  }
  const rangeEl = document.createElement('span')
  rangeEl.className = 'g-pagination__range pg-range'
  let sizeEl = null
  function renderPager() {
    S.page = Math.min(Math.max(1, S.page), pages())
    const r = rangeOf(S.page, S.size)
    const items = pageItems(S.page, pages())
    const w = root.getBoundingClientRect().width
    const compact = w > 0 && w < (items.length + 4) * space() * 9
    nav.classList.toggle('g-pagination--compact', compact)
    rangeEl.textContent = fill(L.range, r)
    controls.innerHTML = `
      <button type="button" class="g-pagination__step" data-go="${S.page - 1}" aria-label="${L.previous}"${S.page <= 1 ? ' disabled' : ''}>${icon('chevron-left', '')}</button>
      <ol class="g-pagination__pages">${items.map((p) => p === null
        ? '<li><span class="g-pagination__ellipsis" aria-hidden="true">…</span></li>'
        : `<li><button type="button" class="g-pagination__page" data-go="${p}"${p === S.page ? ' aria-current="page"' : ''} aria-label="${fill(L.page, { page: p })}">${p}</button></li>`).join('')}</ol>
      ${compact ? `<span class="g-pagination__compact">${fill(L.compact, { page: S.page, pages: pages() })}</span>` : ''}
      <button type="button" class="g-pagination__step" data-go="${S.page + 1}" aria-label="${L.next}"${S.page >= pages() ? ' disabled' : ''}>${icon('chevron-right', '')}</button>`
    updateSize()
  }
  controls.addEventListener('click', (e) => { const b = e.target.closest('[data-go]'); if (b && !b.disabled) goPage(Number(b.dataset.go)) })

  // ---------- Base · <select> nativo ----------
  function buildBase() {
    sizeEl = document.createElement('label')
    sizeEl.className = 'pgBase-size'
    sizeEl.innerHTML = `<span>${L.pageSize}</span><span class="pgBase-box"><select>${S.sizes.map((n) => `<option value="${n}">${n}</option>`).join('')}</select>${icon('chevron-down')}</span>`
    $('select', sizeEl).addEventListener('change', (e) => changeSize(e.target.value))
    meta.append(sizeEl, rangeEl)
  }

  // ---------- A · El rango se abre ----------
  let menu = null
  let btn = null
  function buildA() {
    sizeEl = document.createElement('span')
    sizeEl.className = 'pgA-wrap'
    sizeEl.innerHTML = `<button type="button" class="pgA-range" aria-haspopup="menu" aria-expanded="false" aria-controls="pgA-menu"></button>
      <div class="pgA-menu" id="pgA-menu" role="menu" aria-label="${L.pageSize}" hidden></div>`
    btn = $('.pgA-range', sizeEl)
    menu = $('.pgA-menu', sizeEl)
    meta.append(sizeEl)
    btn.addEventListener('click', () => (menu.hidden ? openMenu() : closeMenu(true)))
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); openMenu(e.key === 'ArrowUp' ? 'last' : null) }
    })
    menu.addEventListener('click', (e) => { const it = e.target.closest('[role="menuitemradio"]'); if (it) choose(it) })
    menu.addEventListener('keydown', onMenuKey)
    document.addEventListener('pointerdown', (e) => { if (!menu.hidden && !sizeEl.contains(e.target)) closeMenu(false) })
  }
  let typed = ''
  let typedAt = 0
  let promised = null
  function openMenu(where) {
    const a = promised = capture() // la vista previa usa la fila que se ve AHORA, y el cambio la cumple
    menu.innerHTML = `<p class="pgA-head" aria-hidden="true">${L.pageSize}</p>` + S.sizes.map((n) => {
      const p = n === S.size ? S.page : targetPage(n, a)
      const r = rangeOf(p, n)
      const allRows = r.from === 1 && r.to === r.total
      const to = `${fill('{from}–{to}', r)}${allRows ? ` · ${L.all}` : ''}`
      return `<button type="button" class="pgA-item" role="menuitemradio" tabindex="-1" data-size="${n}" aria-checked="${n === S.size}">
        <span>${n === S.size ? icon('check') : ''}</span><span>${fill(L.sizeOption, { size: n })}</span><span class="pgA-to">${to}</span></button>`
    }).join('')
    menu.hidden = false
    btn.setAttribute('aria-expanded', 'true')
    const its = [...menu.querySelectorAll('[role="menuitemradio"]')]
    ;(where === 'last' ? its[its.length - 1] : its.find((i) => i.getAttribute('aria-checked') === 'true') || its[0]).focus({ preventScroll: true })
  }
  function closeMenu(focusBtn) {
    if (menu.hidden) return
    menu.hidden = true
    btn.setAttribute('aria-expanded', 'false')
    if (focusBtn) btn.focus({ preventScroll: true })
  }
  function choose(it) { const n = Number(it.dataset.size); closeMenu(true); changeSize(n, promised) }
  function onMenuKey(e) {
    const its = [...menu.querySelectorAll('[role="menuitemradio"]')]
    const i = its.indexOf(document.activeElement)
    const go = (j) => { e.preventDefault(); its[(j + its.length) % its.length].focus({ preventScroll: true }) }
    if (e.key === 'ArrowDown') go(i + 1)
    else if (e.key === 'ArrowUp') go(i - 1)
    else if (e.key === 'Home') go(0)
    else if (e.key === 'End') go(its.length - 1)
    else if (e.key === 'Escape') { e.preventDefault(); closeMenu(true) }
    else if (e.key === 'Tab') closeMenu(false)
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (i >= 0) choose(its[i]) }
    else if (/^\d$/.test(e.key)) { // escribir la cifra: «5» → 50, «1», «0», «0» → 100
      const now = performance.now()
      typed = now - typedAt < 700 ? typed + e.key : e.key
      typedAt = now
      const hit = its.find((it) => it.dataset.size.startsWith(typed))
      if (hit) { e.preventDefault(); hit.focus({ preventScroll: true }) }
    }
  }

  // ---------- B · Pie que acompaña ----------
  function buildB() {
    sizeEl = document.createElement('div')
    sizeEl.className = 'pgB-size'
    sizeEl.setAttribute('role', 'radiogroup')
    sizeEl.setAttribute('aria-labelledby', 'pgB-l')
    sizeEl.innerHTML = `<span id="pgB-l">${L.pageSize}</span><span class="pgB-track">${S.sizes.map((n) =>
      `<label class="pgB-seg"><input type="radio" name="pg-size" value="${n}"><span>${n}</span></label>`).join('')}</span>`
    sizeEl.addEventListener('change', (e) => changeSize(e.target.value))
    meta.append(sizeEl, rangeEl)
    nav.classList.add('pgB-dock')
    const stuck = () => {
      const n = nav.getBoundingClientRect()
      const t = root.getBoundingClientRect()
      const on = n.bottom >= innerHeight - 1 && t.bottom > innerHeight + 1
      nav.classList.toggle('is-stuck', on)
      // Receta (como #515 para la cabecera): el foco no queda debajo del pie acoplado
      document.documentElement.style.scrollPaddingBlockEnd = `${n.height}px`
    }
    addEventListener('scroll', stuck, { passive: true })
    addEventListener('resize', stuck)
    S.afterRender = stuck
  }

  // ---------- C · Tirar del borde ----------
  let grip = null
  function buildC() {
    const edge = $('#edge')
    edge.innerHTML = `<span class="pgC-grip" role="slider" tabindex="0" aria-label="${L.pageSize}" aria-valuemin="${S.sizes[0]}" aria-valuemax="${S.sizes[S.sizes.length - 1]}">${icon('chevrons-up-down')}<span class="pgC-val"></span></span>
      <span class="pgC-ticks" aria-hidden="true">${S.sizes.map((n) => `<button type="button" class="pgC-tick" tabindex="-1" data-size="${n}">${n}</button>`).join('')}</span>
      <div class="pgC-ghost" hidden><span></span></div>`
    grip = $('.pgC-grip', edge)
    meta.append(rangeEl)
    sizeEl = edge
    const idx = () => S.sizes.indexOf(S.size)
    grip.addEventListener('keydown', (e) => {
      const k = e.key
      let j = idx()
      if (k === 'ArrowRight' || k === 'ArrowUp' || k === 'PageUp') j++
      else if (k === 'ArrowLeft' || k === 'ArrowDown' || k === 'PageDown') j--
      else if (k === 'Home') j = 0
      else if (k === 'End') j = S.sizes.length - 1
      else return
      e.preventDefault()
      j = Math.max(0, Math.min(S.sizes.length - 1, j))
      changeSize(S.sizes[j])
    })
    $('.pgC-ticks', edge).addEventListener('click', (e) => { const t = e.target.closest('[data-size]'); if (t) changeSize(t.dataset.size) })
    // Arrastre vertical con muescas cada space × 12: abajo = más filas; Esc cancela
    const ghost = $('.pgC-ghost', edge)
    let drag = null
    const notch = () => space() * 12
    grip.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return
      grip.setPointerCapture(e.pointerId)
      drag = { y: e.clientY, from: idx(), to: idx() }
      grip.classList.add('is-dragging')
    })
    grip.addEventListener('pointermove', (e) => {
      if (!drag) return
      const steps = Math.round((e.clientY - drag.y) / notch())
      drag.to = Math.max(0, Math.min(S.sizes.length - 1, drag.from + steps))
      const shown = drag.to - drag.from
      ghost.hidden = shown === 0
      ghost.style.setProperty('--_dy', `${shown * notch()}px`)
      const n = S.sizes[drag.to]
      $('span', ghost).textContent = `${fill(L.sizeOption, { size: n })} · ${fill('{from}–{to}', rangeOf(targetPage(n, capture()), n))}`
    })
    const end = (apply) => {
      if (!drag) return
      const d = drag
      drag = null
      ghost.hidden = true
      grip.classList.remove('is-dragging')
      if (apply && d.to !== d.from) changeSize(S.sizes[d.to])
    }
    grip.addEventListener('pointerup', () => end(true))
    grip.addEventListener('pointercancel', () => end(false))
    grip.addEventListener('keydown', (e) => { if (e.key === 'Escape' && drag) { e.preventDefault(); end(false) } })
  }

  // ---------- Estado del selector en cada concepto ----------
  function updateSize() {
    const sizeTxt = fill(L.sizeOption, { size: S.size })
    if (S.c === 'base') $('select', sizeEl).value = String(S.size)
    if (S.c === 'A') {
      btn.innerHTML = `<span>${rangeEl.textContent}</span><span class="pgA-size">${sizeTxt}</span>${icon('chevron-down')}`
    }
    if (S.c === 'B') sizeEl.querySelectorAll('input').forEach((i) => { i.checked = Number(i.value) === S.size })
    if (S.c === 'C') {
      grip.setAttribute('aria-valuenow', String(S.size))
      grip.setAttribute('aria-valuetext', sizeTxt)
      $('.pgC-val', grip).textContent = sizeTxt
      sizeEl.querySelectorAll('.pgC-tick').forEach((t) => t.toggleAttribute('data-on', Number(t.dataset.size) === S.size))
    }
    S.afterRender && S.afterRender()
  }

  // ---------- Modo tabla / tarjetas y compacta por el ancho (como GTable y GPagination) ----------
  function layout() {
    const w = root.getBoundingClientRect().width
    const cards = w > 0 && w < COLS.length * 24 * space()
    root.classList.toggle('g-table--mode-cards', cards)
    root.classList.toggle('g-table--mode-table', !cards)
    renderPager()
  }
  let raf = 0
  new ResizeObserver(() => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; layout() }) }).observe(root)

  // ---------- Laboratorio: filtro, servidor, ancho ----------
  window.__pgFilter = () => {
    S.filtered = !S.filtered
    S.page = 1
    emit('update:filters', S.filtered ? '[caducados]' : '[]')
    emit('update:page', 1)
    renderPager()
    if (S.server) load(null)
    else { paintRows(); say(fill(L.results, { count: total() })) }
    return total()
  }

  ;({ base: buildBase, A: buildA, B: buildB, C: buildC })[S.c]()
  paintRows()
  layout()
  window.__pg = { S, capture, changeSize, goPage, total, rangeOf, targetPage, L, ready: true }
})()
