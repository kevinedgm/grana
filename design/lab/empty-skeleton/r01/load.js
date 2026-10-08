// Motor del prototipo de kiwi (empty-skeleton r01): fases de carga, retraso y tiempo mínimo, anuncios,
// foco, vacío con causa y los conceptos A/B/C. No es el .vue: lo escribe bruno desde el contrato de lima.
// Sin dependencias; iconos solo Lucide vía window.lucide (design/lab/lucide-icons.js).
(() => {
  const Q = new URLSearchParams(location.search)
  const C = ['base', 'A', 'B', 'C'].includes(Q.get('c')) ? Q.get('c') : 'base'
  // Constantes propuestas (punto 6 de la declaración): retraso, tiempo mínimo a la vista, espera larga.
  const T = { delay: 200, minimum: 400, slow: 5000 }
  const $ = (s, r = document) => r.querySelector(s)
  const $$ = (s, r = document) => [...r.querySelectorAll(s)]
  const now = () => performance.now()
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
  const ic = (n) => window.lucide(n)
  const ms = (v) => { const s = String(v).trim(); return s.endsWith('ms') ? parseFloat(s) : parseFloat(s) * 1000 }

  document.documentElement.dataset.c = C
  const lab = (window.__lab = { C, T, latency: Number(Q.get('lat')) || 900, outcome: Q.get('out') || 'data', filters: [], log: [], spoken: [] })

  // ───────────── Datos de ejemplo ─────────────
  const ALL = [
    { id: 'm7', code: 'M-0007', who: 'AR', name: 'Suero · Ana Ruiz', meta: 'Recibida el 7 oct · Lote 2026-0412', status: 'En análisis', urg: true, lot: '0412' },
    { id: 'm8', code: 'M-0008', who: 'JP', name: 'Orina · Jorge Pérez', meta: 'Recibida el 7 oct · Lote 2026-0412', status: 'Pendiente', urg: false, lot: '0412' },
    { id: 'm9', code: 'M-0009', who: 'LG', name: 'Plasma · Lucía Gómez Fernández', meta: 'Recibida el 8 oct · Lote 2026-0413', status: 'Validada', urg: true, lot: '0413' },
    { id: 'm10', code: 'M-0010', who: 'IS', name: 'Sangre total · Iker Sanz', meta: 'Recibida el 8 oct · Lote 2026-0413', status: 'Pendiente', urg: false, lot: '0413', late: true }
  ]
  const SAMPLE = [
    { id: 's1', code: 'M-0000', who: 'AA', name: 'Tipo · Nombre Apellido', meta: 'Recibida el 0 oct · Lote 0000-0000', status: 'Estado' },
    { id: 's2', code: 'M-0000', who: 'AA', name: 'Tipo · Nombre Apellido', meta: 'Recibida el 0 oct · Lote 0000-0000', status: 'Estado largo' },
    { id: 's3', code: 'M-0000', who: 'AA', name: 'Tipo largo · Nombre Apellido Apellido', meta: 'Recibida el 0 oct · Lote 0000-0000', status: 'Estado' }
  ]
  const FILTERS = { urg: { label: 'Urgentes', test: (r) => r.urg }, closed: { label: 'Cerradas', test: () => false }, l13: { label: 'Lote 2026-0413', test: (r) => r.lot === '0413' } }
  const TILES = {
    t1: { label: 'Muestras hoy', value: '128', note: '12 más que ayer' },
    t2: { label: 'Pendientes', value: '14', note: '3 urgentes' },
    t3: { label: 'Tiempo medio', value: '3 h 20 min', note: 'Objetivo: 4 h' }
  }
  const DETAIL = {
    title: 'Lote 2026-0412',
    body: 'Doce muestras de suero y orina recibidas el 7 de octubre desde el Centro de Salud Norte. Dos llegaron fuera de la temperatura indicada y están en revisión.',
    facts: [['Origen', 'Centro de Salud Norte'], ['Responsable', 'Laura Ortiz'], ['Estado', 'En análisis']]
  }
  const DETAIL_SAMPLE = {
    title: 'Lote 0000-0000',
    body: 'Texto de ejemplo con la longitud habitual de una descripción de lote, dos o tres líneas en una ficha de anchura media, sin datos de ninguna persona ni de ningún lote real.',
    facts: [['Origen', 'Centro de ejemplo'], ['Responsable', 'Nombre Apellido'], ['Estado', 'Estado']]
  }

  // ───────────── Plantillas reales (lo que pinta la aplicación) ─────────────
  const tpl = {
    list: (items) => `<ul class="rows">${items.map((r) => `<li class="row" data-key="${r.id}"${r.isNew ? ' data-new' : ''}><span class="row-av" aria-hidden="true">${esc(r.who)}</span><span class="row-main"><a class="row-title" href="#${r.id}" dir="auto">${esc(r.name)}</a>${r.isNew ? '<span class="row-new">Nueva</span>' : ''}<span class="row-meta" dir="auto">${esc(r.code)} · ${esc(r.meta)}</span></span><span class="row-status">${esc(r.status)}</span></li>`).join('')}</ul>`,
    tile: (t) => `<p class="tile-label known">${esc(t.label)}</p><p class="tile-value">${esc(t.value)}</p><p class="tile-note">${esc(t.note)}</p>`,
    detail: (d) => `<article class="detail"><h3>${esc(d.title)}</h3><p>${esc(d.body)}</p><dl>${d.facts.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl></article>`
  }

  // ───────────── Anuncios: un canal cortés compartido, con fusión en el mismo ciclo ─────────────
  const live = $('#ld-live')
  let pend = [], wt = null, ct = null
  function say (text, src) {
    lab.log.push({ t: Math.round(now()), src, text }); drawLog()
    clearTimeout(ct); live.textContent = ''
    if (!pend.includes(text)) pend.push(text)
    clearTimeout(wt)
    wt = setTimeout(() => {
      live.textContent = pend.join('. '); lab.spoken.push(live.textContent); pend = []
      ct = setTimeout(() => { live.textContent = '' }, 5000)
    }, 50)
  }
  function drawLog () {
    const ol = $('#log-list'); if (!ol) return
    ol.innerHTML = lab.log.slice(-8).map((l) => `<li><code>${l.src}</code> ${esc(l.text)}</li>`).join('')
  }

  // ───────────── Botones (marcado real de GBtn) ─────────────
  const btn = (label, act, variant = 'outline', extra = '') => `<button type="button" class="g-btn g-btn--color-${variant === 'solid' ? 'brand' : 'neutral'} g-btn--variant-${variant} g-btn--size-sm g-btn--density-default e-act" data-act="${act}"${extra}><span class="g-btn__label">${label}</span></button>`

  // ───────────── Vacío con causa ─────────────
  const filterNames = () => lab.filters.map((f) => `«${FILTERS[f].label}»`).join(' y ')
  const E = {
    none: { icon: 'inbox', title: 'Aún no hay muestras', desc: 'Aparecen aquí al registrarlas o importarlas.', acts: [['Registrar muestra', 'new', 'solid'], ['Importar CSV', 'import', 'ghost']] },
    filtered: { icon: 'search', title: 'Ninguna muestra con estos filtros', desc: () => `Filtros activos: ${filterNames()}.`, acts: [['Quitar filtros', 'clear', 'outline']] },
    error: { icon: 'circle-alert', title: 'No se pudieron cargar las muestras', desc: 'El servidor no respondió (503).', acts: [['Reintentar', 'retry', 'outline']] },
    forbidden: { icon: 'lock', title: 'No tienes permiso para ver estas muestras', desc: 'Pídeselo a la responsable del laboratorio, Laura Ortiz.', acts: [['Pedir acceso', 'ask', 'link']] }
  }
  const txt = (v) => (typeof v === 'function' ? v() : v)

  function emptyHTML (r, cause, ctx = {}) {
    const e = E[cause]
    const acts = e.acts.map(([l, a, v]) => btn(l, a, v)).join('')
    if (C === 'A') {
      return `<div class="e-slot" data-cause="${cause}" style="--_slot:${r.rowH || 0}px"><span class="e-icon" aria-hidden="true">${ic(e.icon)}</span><div><p class="e-title">${e.title}</p><p class="e-desc">${txt(e.desc)}</p></div><div class="e-actions">${acts}</div></div>`
    }
    if (C === 'B') {
      if (cause === 'filtered') {
        // Solo se ofrece lo que devuelve algo, de más a menos; si nada devuelve, «Quitar todos»
        const relax = lab.filters
          .map((f) => ({ f, n: ctx.pool.filter((x) => lab.filters.filter((g) => g !== f).every((g) => FILTERS[g].test(x))).length }))
          .filter((x) => x.n > 0).sort((a, b) => b.n - a.n)
          .map(({ f, n }) => btn(`Quitar «${FILTERS[f].label}»<span class="b-count">· ${n}</span>`, 'relax', 'outline', ` data-f="${f}"`)).join('')
        const before = r.lastItems ? r.lastItems.length : ctx.pool.length
        return `<div class="b-exit" data-cause="filtered"><p class="e-title">${e.title}</p><p class="b-trace">Antes había <strong>${before}</strong>; con ${filterNames()}, ninguna. Cada botón dice cuántas vuelven.</p><div class="e-actions">${relax}${lab.filters.length > 1 || !relax ? btn('Quitar todos', 'clear', relax ? 'ghost' : 'outline') : ''}</div></div>`
      }
      return `<div class="b-exit" data-cause="${cause}"><p class="e-title">${e.title}</p><p class="b-trace">${txt(e.desc)}</p><div class="e-actions">${acts}</div></div>`
    }
    if (C === 'C') {
      return `<div class="e-say" data-cause="${cause}"><span class="e-tile" aria-hidden="true">${ic(e.icon)}</span><p><span class="e-title">${e.title}.</span><span class="e-desc">${txt(e.desc)}</span></p><span class="e-actions">${e.acts.map(([l, a]) => btn(l, a, 'link')).join('')}</span></div>`
    }
    return `<div class="e-poster" data-cause="${cause}"><span class="e-icon" aria-hidden="true">${ic(e.icon)}</span><p class="e-title">${e.title}</p><p class="e-desc">${txt(e.desc)}</p><div class="e-actions">${acts}</div></div>`
  }

  // ───────────── Esqueletos ─────────────
  const LINES = { list: [['62%', '38%'], ['48%', '30%'], ['70%', '42%']] }
  function bars (kind, n) {
    if (kind === 'list') {
      return Array.from({ length: n }, (_, i) => { const [a, b] = LINES.list[i % 3]; return `<div class="sk-row"><span class="sk sk-circle"></span><span class="sk-lines"><span class="sk-line sk-line--body"><span class="sk" style="--w:${a}"></span></span><span class="sk-line sk-line--sm"><span class="sk" style="--w:${b}"></span></span></span></div>` }).join('')
    }
    if (kind === 'tile') return '<div class="sk-tile"><span class="sk-line sk-line--sm"><span class="sk" style="--w:45%"></span></span><span class="sk-line sk-line--lg"><span class="sk" style="--w:55%"></span></span><span class="sk-line sk-line--cap"><span class="sk" style="--w:65%"></span></span></div>'
    return `<div class="sk-card"><span class="sk-line sk-line--title"><span class="sk" style="--w:40%"></span></span>${['100%', '96%', '88%', '60%'].map((w) => `<span class="sk-line sk-line--body"><span class="sk" style="--w:${w}"></span></span>`).join('')}${['55%', '50%', '45%'].map((w) => `<span class="sk-line sk-line--sm"><span class="sk" style="--w:${w}"></span></span>`).join('')}</div>`
  }

  // ───────────── La región ─────────────
  class Region {
    constructor (id, o) {
      Object.assign(this, o); this.id = id; this.el = document.getElementById(id)
      this.lastItems = null; this.ev = []; this.timers = []; this.run = 0; this.lastH = 0; this.rowH = 0
      this.el.dataset.phase = 'idle'; this.el.setAttribute('aria-busy', 'false')
      lab[id] = this
    }
    y () { const a = document.getElementById(this.after); return a ? Math.round(a.getBoundingClientRect().top + scrollY) : 0 }
    mark (what) { this.ev.push({ t: Math.round(now() - this.t0), what, y: this.y(), h: Math.round(this.el.getBoundingClientRect().height) }) }
    clear () { this.timers.forEach(clearTimeout); this.timers = [] }
    set (html, phase) {
      const pill = C === 'B' ? `<span class="b-pill" aria-hidden="true">${ic('refresh-cw')}${this.labels.refreshing || 'Actualizando'}</span>` : ''
      this.el.innerHTML = `<div class="ld-content">${html}</div><p class="ld-slow">${this.labels.slow || ''}…</p>${pill}`
      this.el.dataset.phase = phase
    }
    sampleItems () { return this.lastItems || this.sample }
    measure (items) {
      const m = document.createElement('div')
      m.className = 'ld-measure mold'; m.setAttribute('aria-hidden', 'true'); m.inert = true
      m.style.cssText = 'position:absolute;inset-inline:0;inset-block-start:0;visibility:hidden'
      m.innerHTML = this.tpl(items); this.el.append(m)
      const h = m.getBoundingClientRect().height
      const row = m.querySelector('.row'); if (row) this.rowH = row.getBoundingClientRect().height
      m.remove(); return Math.round(h)
    }
    ghost (items) {
      if (C === 'A') return `<div class="ld-ghost mold" aria-hidden="true" inert>${this.tpl(items)}</div>`
      if (C === 'C') {
        const h = this.lastH || this.measure(items)
        const known = this.kind === 'tile' ? `<p class="tile-label known">${esc(this.sample[0].label)}</p>` : ''
        return `<div class="ld-ghost say" aria-hidden="true" style="--_reserve:${h}px">${known}<p class="say-line"><span class="say-icon">${ic('loader-circle')}</span><span class="say-text">${this.labels.loading}…</span></p></div>`
      }
      return `<div class="ld-ghost" aria-hidden="true" inert>${bars(this.kind, Array.isArray(items) ? items.length : 1)}</div>`
    }
    start ({ refresh = false } = {}) {
      this.clear(); const run = ++this.run
      this.t0 = now(); this.ev = []; this.shownAt = 0; this.el.removeAttribute('data-slow')
      this.el.setAttribute('aria-busy', 'true')
      const content = $('.ld-content', this.el)
      const had = refresh && this.lastItems && this.el.dataset.phase === 'content'
      // Foco: si estaba dentro de lo que va a quedar inerte o a desaparecer, pasa a la región (nunca a body)
      const ae = document.activeElement
      this.focusKey = null; this.focusIn = false
      if (ae && ae !== this.el && this.el.contains(ae)) {
        const k = ae.closest('[data-key]'); this.focusKey = k ? k.dataset.key : null; this.focusIn = true
        this.el.focus({ preventScroll: true })
      }
      if (had || (refresh && content && this.el.dataset.phase !== 'idle')) {
        if (content) content.inert = true // lo que había sigue a la vista durante el retraso, sin poder usarse
        this.el.dataset.phase = 'pending-keep'
      } else {
        this.set(this.ghost(this.sampleItems()), 'pending') // reserva el sitio, invisible hasta el retraso
      }
      this.mark('busy')
      this.timers.push(setTimeout(() => run === this.run && this.show(had), T.delay))
      this.timers.push(setTimeout(() => run === this.run && this.slow(), T.slow))
      const latency = this.latency()
      this.timers.push(setTimeout(() => run === this.run && this.arrive(this.fetch(refresh)), latency))
    }
    show (had) {
      if (C === 'B' && had) {
        this.el.dataset.phase = 'stale'
        if (!$('.b-pill', this.el)) this.el.insertAdjacentHTML('beforeend', `<span class="b-pill" aria-hidden="true">${ic('refresh-cw')}${this.labels.refreshing}</span>`)
      } else if (this.el.dataset.phase === 'pending-keep') {
        this.set(this.ghost(this.sampleItems()), 'skeleton')
      } else {
        this.el.dataset.phase = 'skeleton'
      }
      this.shownAt = now(); this.mark(this.el.dataset.phase)
      if (this.group) this.group.shown(this)
      else if (this.labels.loading) say(this.labels.loading, this.id)
    }
    slow () {
      this.el.setAttribute('data-slow', ''); this.mark('slow')
      const t = $('.say-text', this.el); if (t) t.textContent = `${this.labels.slow} · tarda más de lo normal`
      if (!this.group && this.labels.slow) say(this.labels.slow, this.id)
    }
    arrive (result) {
      const run = this.run
      this.timers.forEach(clearTimeout); this.timers = []
      this.mark('arrive')
      const wait = this.shownAt ? Math.max(0, T.minimum - (now() - this.shownAt)) : 0
      this.timers.push(setTimeout(() => run === this.run && this.finish(result), wait))
    }
    finish (res) {
      const prevKeys = new Set((this.lastItems || []).map((x) => x.id))
      let spoken = ''
      if (res.type === 'data') {
        const items = res.items.map((x) => ({ ...x, isNew: C === 'B' && this.lastItems && !prevKeys.has(x.id) }))
        this.set(this.tpl(items), 'content')
        if (C === 'A') this.reveal()
        this.lastItems = items
        const k = items.filter((x) => x.isNew).length
        spoken = this.labels.loaded(items.length, k)
      } else if (res.type === 'error' && C === 'B' && this.lastItems) {
        // B: el error no borra lo conocido; lo marca y ofrece reintentar
        const content = $('.ld-content', this.el); if (content) content.inert = false
        this.el.dataset.phase = 'content'
        content.insertAdjacentHTML('afterbegin', `<div class="b-fail" data-cause="error"><span aria-hidden="true">${ic('circle-alert')}</span><p>No se pudo actualizar. Lo que ves es lo último que llegó.</p>${btn('Reintentar', 'retry', 'outline')}</div>`)
        $('.b-pill', this.el)?.remove()
        spoken = 'No se pudo actualizar la lista'
      } else {
        const cause = res.type === 'empty' ? res.cause : res.type
        if (!this.rowH) this.measure(this.sample)
        this.set(emptyHTML(this, cause, res), 'empty')
        this.el.dataset.cause = cause
        if (cause !== 'filtered') this.lastItems = cause === 'forbidden' || cause === 'none' ? null : this.lastItems
        spoken = E[cause].title
      }
      if (res.type === 'data') delete this.el.dataset.cause
      this.el.setAttribute('aria-busy', 'false'); this.el.removeAttribute('data-slow')
      this.lastH = Math.round($('.ld-content', this.el).getBoundingClientRect().height)
      this.mark(this.el.dataset.phase)
      // Foco: vuelve al mismo elemento (por clave) si sigue; si no, se queda en la región; nunca en body
      if (this.focusKey) {
        const t = $(`[data-key="${this.focusKey}"] a, [data-key="${this.focusKey}"] button`, this.el)
        if (t) t.focus({ preventScroll: true })
      }
      if (this.focusIn && (document.activeElement === document.body || !document.activeElement)) this.el.focus({ preventScroll: true })
      if (this.group) this.group.done(this)
      else if (spoken) say(spoken, this.id)
    }
    reveal () {
      const c = $('.ld-content', this.el)
      c.classList.add('mold'); void c.offsetWidth
      $$('*', c).forEach((n) => getComputedStyle(n).color)
      c.classList.add('reveal'); c.classList.remove('mold')
      const d = ms(getComputedStyle(c.querySelector('*') || c).transitionDuration.split(',')[0])
      setTimeout(() => c.classList.remove('reveal'), d + 80)
    }
  }

  // Grupo: varias regiones que cargan juntas se anuncian una vez (al empezar y al terminar todas)
  class Group {
    constructor (id, labels) { this.id = id; this.labels = labels; this.members = []; this.said = false; this.pending = 0 }
    start () { this.said = false; this.pending = this.members.length; this.members.forEach((m) => m.start({ refresh: !!m.lastItems })) }
    shown () { if (!this.said) { this.said = true; say(this.labels.loading, this.id) } }
    done () { if (--this.pending === 0) say(this.labels.loaded, this.id) }
  }

  // ───────────── Regiones del laboratorio ─────────────
  const pool = (refresh) => ALL.filter((r) => refresh || !r.late)
  const list = new Region('list', {
    kind: 'list', tpl: tpl.list, sample: SAMPLE, after: 'list-after',
    labels: { loading: 'Cargando muestras', slow: 'Sigue cargando muestras', refreshing: 'Actualizando', loaded: (n, k) => `${n} muestras${k ? `, ${k} ${k === 1 ? 'nueva' : 'nuevas'}` : ''}` },
    latency: () => lab.latency,
    fetch: (refresh) => {
      if (lab.outcome === 'error') return { type: 'error' }
      if (lab.outcome === 'forbidden') return { type: 'forbidden' }
      if (lab.outcome === 'none') return { type: 'empty', cause: 'none' }
      const p = pool(refresh || !!list.lastItems)
      const items = p.filter((r) => lab.filters.every((f) => FILTERS[f].test(r)))
      return items.length ? { type: 'data', items } : { type: 'empty', cause: 'filtered', pool: p }
    }
  })
  const dash = new Group('dash', { loading: 'Cargando el panel', loaded: 'Panel actualizado' })
  ;['t1', 't2', 't3'].forEach((id, i) => {
    const r = new Region(id, {
      kind: 'tile', tpl: (items) => tpl.tile(Array.isArray(items) ? items[0] : items), sample: [{ label: TILES[id].label, value: '000', note: 'Comparación' }], after: 'dash-after', group: dash,
      labels: { loading: 'Cargando', slow: 'Sigue cargando', refreshing: 'Actualizando', loaded: () => '' },
      latency: () => lab.latency * [0.5, 1, 1.6][i],
      fetch: () => ({ type: 'data', items: [{ id, ...TILES[id] }] })
    })
    dash.members.push(r)
  })
  const detail = new Region('detail', {
    kind: 'detail', tpl: (items) => tpl.detail(Array.isArray(items) ? items[0] : items), sample: [DETAIL_SAMPLE], after: 'detail-after',
    labels: { loading: 'Cargando el lote', slow: 'Sigue cargando el lote', refreshing: 'Actualizando', loaded: () => 'Lote cargado' },
    latency: () => lab.latency,
    fetch: () => ({ type: 'data', items: [{ id: 'd', ...DETAIL }] })
  })

  // ───────────── Controles del laboratorio ─────────────
  lab.loadAll = () => { [list, detail, ...dash.members].forEach((r) => { r.lastItems = null; r.lastH = 0 }); list.start(); dash.start(); detail.start() }
  lab.refresh = () => list.start({ refresh: true })
  lab.setLatency = (v) => { lab.latency = v; $$('[data-lat]').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.lat) === v))) }
  lab.syncFilters = () => $$('[data-f-toggle]').forEach((b) => b.setAttribute('aria-pressed', String(lab.filters.includes(b.dataset.fToggle))))

  document.addEventListener('click', (ev) => {
    const b = ev.target.closest('button'); if (!b) return
    if (b.dataset.lat) lab.setLatency(Number(b.dataset.lat))
    if (b.id === 'go-load') lab.loadAll()
    if (b.id === 'go-refresh') lab.refresh()
    if (b.id === 'go-auto') setTimeout(lab.refresh, 1000)
    if (b.dataset.fToggle) {
      const f = b.dataset.fToggle
      lab.filters = lab.filters.includes(f) ? lab.filters.filter((x) => x !== f) : [...lab.filters, f]
      lab.syncFilters(); lab.refresh()
    }
    const act = b.dataset.act
    if (act === 'clear') { lab.filters = []; lab.syncFilters(); lab.refresh() }
    if (act === 'relax') { lab.filters = lab.filters.filter((x) => x !== b.dataset.f); lab.syncFilters(); lab.refresh() }
    if (act === 'retry') { lab.outcome = 'data'; $('#out').value = 'data'; lab.refresh() }
    if (act && !['clear', 'relax', 'retry'].includes(act)) lab.log.push({ t: Math.round(now()), src: 'acción', text: act })
  })
  $('#out').addEventListener('change', (e) => { lab.outcome = e.target.value })
  $('#out').value = lab.outcome
  lab.setLatency(lab.latency)
  lab.ready = true
  if (!Q.has('manual')) lab.loadAll()
})()
