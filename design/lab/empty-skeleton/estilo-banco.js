// Banco de estilo de GEmpty, GLoadRegion y la carga de GTable (coco): emite el marcado EXACTO de los contratos
// (empty.md «Estructura accesible», load-region.md «Estructura accesible» y «Clases y datos», table.md «Carga, vacío y
// error» + «Clases») y pone SOLO las clases de fase que el estilo necesita. No es el motor de bruno: sin retraso ni mínimo
// reales, sin anuncios ni foco. Iconos: solo Lucide (design/lab/lucide-icons.js).
(function () {
  'use strict'
  function h(tag, attrs = {}, kids = []) {
    const e = document.createElement(tag)
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue
      if (k === 'class') e.className = v
      else if (k === 'text') e.textContent = v
      else if (k === 'style') e.setAttribute('style', v)
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
  const raf2 = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))

  // ---------- GBtn (marcado real de GBtn.vue: etiqueta + indicador de carga siempre presente) ----------
  function btn(kids, { color = 'brand', variant = 'outline', size = 'sm', cls = '', onclick } = {}) {
    return h('button', { type: 'button', class: `g-btn g-btn--color-${color} g-btn--variant-${variant} g-btn--size-${size} g-btn--density-default${cls ? ' ' + cls : ''}`, onclick }, [
      h('span', { class: 'g-btn__label' }, [].concat(kids)),
      icon('loader-circle', 'g-btn__loader')
    ])
  }

  // ---------- GEmpty (empty.md) ----------
  const ICONS = { filtered: 'search', error: 'circle-alert', forbidden: 'lock' }
  const fill = (s, o) => String(s).replace(/\{(\w+)\}/g, (_, k) => (k in o ? o[k] : ''))
  function empty(o) {
    const lang = o.locale || 'es'
    const nf = new Intl.NumberFormat(lang)
    const exit = o.cause === 'filtered' && o.filters && o.filters.length > 0
    const root = h('div', { class: `g-empty g-empty--cause-${o.cause}${exit ? ' is-exit' : ''}` })
    const hole = h('span', { class: 'g-empty__icon', 'aria-hidden': 'true' })
    if (o.icon) hole.append(icon(o.icon)); else if (ICONS[o.cause]) hole.append(icon(ICONS[o.cause]))
    const text = h('div', { class: 'g-empty__text' }, [
      h(o.headingLevel ? 'h' + o.headingLevel : 'p', { class: 'g-empty__title', dir: 'auto', text: o.title }),
      o.description ? h('p', { class: 'g-empty__description', dir: 'auto', text: o.description }) : null,
      exit && o.total != null ? h('p', { class: 'g-empty__trace', text: fill(o.labels.before, { total: nf.format(o.total), filters: new Intl.ListFormat(lang, { type: 'conjunction' }).format(o.filters.map((f) => '«' + f.label + '»')) }) }) : null
    ])
    const acts = []
    if (exit) {
      const loose = o.filters.filter((f) => f.count > 0).sort((a, b) => b.count - a.count)
      for (const f of loose) {
        acts.push(btn([fill(o.labels.relax, { label: f.label }), h('span', { class: 'g-empty__count', 'aria-hidden': 'true', text: nf.format(f.count) }), h('span', { class: 'g-empty__sr', text: ' ' + fill(o.labels.returns, { count: nf.format(f.count) }) })], { cls: 'g-empty__relax' }))
      }
      if (o.filters.length > 1 || !loose.length) acts.push(btn(o.labels.clear, { variant: loose.length ? 'ghost' : 'outline' }))
    }
    for (const a of o.actions || []) acts.push(btn(a.label, { variant: a.variant || 'outline', color: a.color || 'brand' }))
    root.append(hole, text)
    if (acts.length) root.append(h('div', { class: 'g-empty__actions' }, acts))
    return root
  }

  // ---------- Plantillas de «la aplicación» ----------
  const IMG = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#7a8"/><circle cx="32" cy="26" r="12" fill="#fff"/></svg>')
  const T = {
    list(items, { fresh }) {
      return h('ul', { class: 'rows' }, items.map((it) => h('li', { class: 'row', 'data-g-key': it.id, 'data-g-fresh': fresh.has(it.id) ? '' : null }, [
        h('span', { class: 'row-av', 'aria-hidden': 'true', text: it.av }),
        h('span', { class: 'row-main' }, [
          h('a', { class: 'row-title', href: '#' + it.id, dir: 'auto', text: it.title, onclick: (e) => e.preventDefault() }),
          fresh.has(it.id) ? h('span', { class: 'row-new', text: it.newLabel || 'Nueva' }) : null,
          h('span', { class: 'row-meta', dir: 'auto', text: it.meta })
        ]),
        h('span', { class: 'row-status', text: it.status })
      ])))
    },
    tiles(items) {
      return h('div', { class: 'tiles' }, items.map((it) => h('div', { class: 'tile-box', 'data-g-key': it.id }, [
        h('p', { class: 'tile-label', 'data-g-known': '' }, [icon(it.icon), h('span', { text: it.label })]),
        h('p', { class: 'tile-value', text: it.value }),
        h('p', { class: 'tile-note', text: it.note })
      ])))
    },
    // Muestras de color sólidas (solo para medir el contraste de lo de antes sin saturación, por píxeles)
    swatch(items) {
      return h('div', { class: 'swatches', 'data-g-key': 'sw' }, items.map((t) => h('span', { class: 'sw', 'data-tok': t, style: 'background: var(' + t + ')' })))
    },
    detail(items) {
      const it = items[0]
      return h('article', { class: 'detail', 'data-g-key': it.id }, [
        h('img', { src: IMG, alt: '' }),
        h('div', {}, [
          h('h3', { text: it.title }),
          h('p', { text: it.body }),
          h('dl', {}, it.facts.flatMap(([k, v]) => [h('dt', { text: k }), h('dd', { text: v })]))
        ])
      ])
    }
  }

  const SAMPLE = {
    list: [
      { id: 's1', av: 'NA', title: 'Tipo · Nombre Apellido', meta: 'Lote 0000-0000 · 00:00', status: 'Estado' },
      { id: 's2', av: 'NA', title: 'Tipo largo · Nombre Apellido', meta: 'Lote 0000-0000 · 00:00', status: 'Estado' },
      { id: 's3', av: 'NA', title: 'Tipo · Nombre', meta: 'Lote 0000-0000 · 00:00', status: 'Estado' },
      { id: 's4', av: 'NA', title: 'Tipo · Nombre Apellido', meta: 'Lote 0000-0000 · 00:00', status: 'Estado' }
    ],
    tiles: [
      { id: 'a', icon: 'flag', label: 'Muestras hoy', value: '000', note: '+00 desde ayer' },
      { id: 'b', icon: 'circle-alert', label: 'Urgentes', value: '00', note: '0 sin asignar' },
      { id: 'c', icon: 'circle-check', label: 'Validadas', value: '000', note: '00 % del total' }
    ],
    detail: [{ id: 'd', title: 'Tipo · Nombre Apellido', body: 'Texto de muestra del largo típico de una observación: dos o tres líneas que dicen qué se pidió, quién lo pidió y qué falta por hacer, con algún dato entre medias para que la línea se parta como se partirá la real.', facts: [['Lote', '0000-0000'], ['Recibida', '00/00/0000 00:00'], ['Responsable', 'Nombre Apellido']] }]
  }
  const REAL = {
    list: [
      { id: 'M-0008', av: 'AT', title: 'Hemograma · Ana Torres', meta: 'Lote 2026-0412 · 09:12', status: 'Abierta' },
      { id: 'M-0009', av: 'LO', title: 'Perfil lipídico · Laura Ortiz', meta: 'Lote 2026-0413 · 09:40', status: 'Urgente' },
      { id: 'M-0010', av: 'JR', title: 'Glucosa · Juan Ruiz', meta: 'Lote 2026-0413 · 10:05', status: 'Cerrada' },
      { id: 'M-0011', av: 'MP', title: 'Orina · Marta Pérez', meta: 'Lote 2026-0414 · 10:31', status: 'Abierta' }
    ],
    list2: [
      { id: 'M-0013', av: 'CS', title: 'Coagulación · Carlos Sanz', meta: 'Lote 2026-0415 · 11:02', status: 'Abierta' },
      { id: 'M-0008', av: 'AT', title: 'Hemograma · Ana Torres', meta: 'Lote 2026-0412 · 09:12', status: 'Cerrada' },
      { id: 'M-0009', av: 'LO', title: 'Perfil lipídico · Laura Ortiz', meta: 'Lote 2026-0413 · 09:40', status: 'Urgente' },
      { id: 'M-0010', av: 'JR', title: 'Glucosa · Juan Ruiz', meta: 'Lote 2026-0413 · 10:05', status: 'Cerrada' }
    ],
    tiles: [
      { id: 'a', icon: 'flag', label: 'Muestras hoy', value: '128', note: '+12 desde ayer' },
      { id: 'b', icon: 'circle-alert', label: 'Urgentes', value: '7', note: '2 sin asignar' },
      { id: 'c', icon: 'circle-check', label: 'Validadas', value: '96', note: '75 % del total' }
    ],
    detail: [{ id: 'd', title: 'Hemograma · Ana Torres', body: 'Pedido por la Dra. Laura Ortiz para el control de anemia del lunes; la muestra llegó refrigerada y el tubo de EDTA está completo. Falta validar el recuento de plaquetas antes de enviar el informe.', facts: [['Lote', '2026-0412'], ['Recibida', '08/10/2026 09:12'], ['Responsable', 'Marta Pérez']] }]
  }
  const RTL = {
    sample: [
      { id: 'r1', av: 'ن', title: 'نوع · اسم العائلة', meta: 'دفعة ٠٠٠٠ · ٠٠:٠٠', status: 'الحالة' },
      { id: 'r2', av: 'ن', title: 'نوع طويل · اسم العائلة', meta: 'دفعة ٠٠٠٠ · ٠٠:٠٠', status: 'الحالة' }
    ],
    real: [
      { id: 'R-1', av: 'ع', title: 'تحليل الدم · علياء حسن', meta: 'دفعة ٢٠٢٦ · ٠٩:١٢', status: 'مفتوحة', newLabel: 'جديدة' },
      { id: 'R-2', av: 'س', title: 'سكر الدم · سامي يوسف', meta: 'دفعة ٢٠٢٦ · ٠٩:٤٠', status: 'مغلقة' }
    ]
  }

  // ---------- GLoadRegion (load-region.md «Estructura accesible») ----------
  const regions = new Map()
  function region(host, { id, label, kind, sample, items, labels }) {
    const root = h('div', { class: 'g-load-region', role: 'group', 'aria-label': label, tabindex: '-1', 'aria-busy': 'false', id })
    const body = h('div', { class: 'g-load-region__body' })
    root.append(body)
    host.append(root)
    const S = { known: items, prev: new Set(items.map((x) => x.id)) }
    const tpl = T[kind]
    function paint(list, { fresh = new Set() } = {}) { body.replaceChildren(tpl(list, { fresh })) }
    function set(classes, { inert = false, mold = false } = {}) {
      root.className = ['g-load-region', ...classes].join(' ')
      root.setAttribute('aria-busy', classes.includes('is-busy') ? 'true' : 'false')
      body.inert = inert || mold
      if (mold) body.setAttribute('aria-hidden', 'true'); else body.removeAttribute('aria-hidden')
      for (const x of root.querySelectorAll(':scope > .g-load-region__failed, :scope > .g-load-region__slow, :scope > .g-load-region__pill')) x.remove()
      if (classes.includes('is-failed')) root.prepend(h('div', { class: 'g-load-region__failed' }, [
        h('span', { class: 'g-load-region__failed-icon', 'aria-hidden': 'true' }, [icon('circle-alert')]),
        h('p', { class: 'g-load-region__failed-text', text: labels.failed }),
        btn(labels.retry, { color: 'neutral', variant: 'soft' })
      ]))
      if (classes.includes('is-slow')) root.append(h('p', { class: 'g-load-region__slow', text: labels.slow }))
      if (classes.includes('is-stale')) root.append(h('span', { class: 'g-load-region__pill', 'aria-hidden': 'true' }, [icon('refresh-cw'), h('span', { text: labels.refreshing })]))
    }
    const ctrl = {
      id, root, body, S,
      idle() { set([]); paint(S.known) },
      firstPending() { set(['is-busy', 'is-pending', 'is-mold'], { mold: true }); paint(sample) },
      mold() { set(['is-busy', 'is-mold'], { mold: true }); paint(sample) },
      slow() { set(['is-busy', 'is-mold', 'is-slow'], { mold: true }); paint(sample) },
      // Llegada con revelado: un cuadro en molde con los datos reales y is-revealing; luego fuera is-mold
      async reveal(list = S.known) {
        set(['is-mold'], { mold: true }); paint(list)
        await raf2()
        set(['is-mold', 'is-revealing'])
        S.known = list
        clearTimeout(S.t)
        S.t = setTimeout(() => { if (root.classList.contains('is-revealing')) set([]) }, 700)
      },
      stalePending() { set(['is-busy', 'is-pending'], { inert: true }) },
      stale() { set(['is-busy', 'is-stale'], { inert: true }) },
      arrive(list) { const fresh = new Set(list.filter((x) => !S.prev.has(x.id)).map((x) => x.id)); S.prev = new Set(list.map((x) => x.id)); S.known = list; set([]); paint(list, { fresh }) },
      failed() { set(['is-failed']); paint(S.known) },
      replace() { set(['is-busy', 'is-mold'], { mold: true }); paint(S.known) },
      empty(o) {
        const first = body.querySelector('[data-g-key]')
        if (first) root.style.setProperty('--_load-slot', first.getBoundingClientRect().height + 'px')
        set([]); body.replaceChildren(empty(o))
      }
    }
    regions.set(id, ctrl)
    ctrl.idle()
    return ctrl
  }
  function controls(host, r, extra = {}) {
    const b = (t, f) => host.append(h('button', { type: 'button', text: t, onclick: f }))
    b('Primera carga (molde)', () => r.mold())
    b('Retraso (invisible)', () => r.firstPending())
    b('Espera larga (5 s)', () => r.slow())
    b('Llega (revelado)', () => r.reveal())
    b('Refrescar (B)', () => r.stale())
    if (extra.list2) b('Llega con una nueva', () => r.arrive(extra.list2))
    b('Falla al refrescar', () => r.failed())
    b('Refrescar (replace)', () => r.replace())
    b('Reposo', () => r.idle())
  }

  // ---------- GTable (marcado de GTable.vue + table.md «Carga, vacío y error») ----------
  const tables = new Map()
  const COLS = [['Muestra', 'primary'], ['Paciente'], ['Estado'], ['Recibida', 'end']]
  const ROWS = [['M-0008', 'Ana Torres', 'Abierta', '09:12'], ['M-0009', 'Laura Ortiz', 'Urgente', '09:40'], ['M-0010', 'Juan Ruiz', 'Cerrada', '10:05'], ['M-0011', 'Marta Pérez', 'Abierta', '10:31']]
  function table(host, { id, caption }) {
    const root = h('div', { class: 'g-table g-table--mode-table g-table--appearance-lines g-table--density-default', id })
    host.append(root)
    const S = { rows: ROWS.slice() }
    function head() {
      return h('thead', { role: 'rowgroup' }, [h('tr', { role: 'row' }, [
        h('th', { role: 'columnheader', scope: 'col', class: 'g-table__select' }, [h('input', { type: 'checkbox', 'aria-label': 'Seleccionar todo' })]),
        ...COLS.map(([l, k]) => h('th', { role: 'columnheader', scope: 'col', class: k === 'end' ? 'g-table__cell--end' : null, text: l }))
      ])])
    }
    function rowsOf(list) {
      return list.map((r) => h('tr', { role: 'row', class: 'g-table__row', 'data-key': r[0] }, [
        h('td', { role: 'cell', class: 'g-table__select' }, [h('input', { type: 'checkbox', 'aria-label': 'Seleccionar ' + r[0] })]),
        ...r.map((v, i) => h('td', { role: 'cell', class: 'g-table__cell' + (i === 0 ? ' g-table__cell--primary' : '') + (COLS[i][1] === 'end' ? ' g-table__cell--end' : ''), text: v }))
      ]))
    }
    function skeleton(n) {
      return Array.from({ length: n }, () => h('tr', { role: 'row', class: 'g-table__row', 'aria-hidden': 'true' }, [
        h('td', { role: 'cell', class: 'g-table__select' }),
        ...COLS.map((c, i) => h('td', { role: 'cell', class: 'g-table__cell' + (i === 0 ? ' g-table__cell--primary' : '') + (c[1] === 'end' ? ' g-table__cell--end' : '') }, [h('span', { class: 'g-table__skeleton' })]))
      ]))
    }
    function emptyRow(node) { return [h('tr', { role: 'row' }, [h('td', { role: 'cell', class: 'g-table__empty', colspan: String(COLS.length + 1) }, [node])])] }
    function render({ classes = [], body, failed = false, slow = false, busy = false }) {
      root.className = ['g-table g-table--mode-table g-table--appearance-lines g-table--density-default', ...classes].join(' ')
      const tbody = h('tbody', { role: 'rowgroup', inert: classes.includes('is-pending') && !classes.includes('is-first') ? true : null }, body)
      const scroll = h('div', { class: 'g-table__scroll' }, [
        h('table', { class: 'g-table__table', role: 'table', tabindex: '-1', 'aria-busy': busy ? 'true' : 'false' }, [h('caption', { class: 'g-table__caption', text: caption }), head(), tbody]),
        slow ? h('p', { class: 'g-table__slow', text: 'Sigue cargando las muestras; tarda más de lo normal.' }) : null
      ])
      root.replaceChildren(...[
        failed ? h('div', { class: 'g-table__failed' }, [
          h('span', { class: 'g-table__failed-icon', 'aria-hidden': 'true' }, [icon('circle-alert')]),
          h('p', { class: 'g-table__failed-text', text: 'No se pudo actualizar. Lo que ves es lo último que llegó.' }),
          btn('Reintentar', { color: 'neutral', variant: 'soft' })
        ]) : null,
        scroll,
        h('p', { class: 'g-table__sr', 'aria-live': 'polite' })
      ].filter(Boolean))
    }
    const ctrl = {
      id, root,
      idle() { render({ body: rowsOf(S.rows) }) },
      firstPending() { render({ classes: ['is-loading', 'is-pending'], body: skeleton(3), busy: true }) },
      skeleton(n = S.rows.length) { render({ classes: ['is-loading'], body: skeleton(n), busy: true }) },
      slow(n = S.rows.length) { render({ classes: ['is-loading', 'is-slow'], body: skeleton(n), slow: true, busy: true }) },
      refreshPending() { render({ classes: ['is-loading', 'is-pending'], body: rowsOf(S.rows), busy: true }) },
      failed() { render({ classes: ['is-failed'], body: rowsOf(S.rows), failed: true }) },
      empty() { render({ body: emptyRow(empty({ cause: 'none', title: 'Aún no hay muestras', description: 'Las muestras que registres aparecerán aquí.', actions: [{ label: 'Registrar muestra', variant: 'solid' }] })) }) },
      emptyFiltered() { render({ body: emptyRow(empty({ cause: 'filtered', title: 'Ninguna muestra con estos filtros', actions: [{ label: 'Limpiar filtros' }] })) }) },
      errorNoRows() { render({ body: emptyRow(empty({ cause: 'error', title: 'No se pudieron cargar las muestras', actions: [{ label: 'Reintentar' }] })) }) }
    }
    tables.set(id, ctrl)
    ctrl.idle()
    return ctrl
  }

  const LABELS = { failed: 'No se pudo actualizar. Lo que ves es lo último que llegó.', retry: 'Reintentar', slow: 'Sigue cargando las muestras; tarda más de lo normal.', refreshing: 'Actualizando' }
  const EXIT = { relax: 'Quitar «{label}»', returns: '{count} vuelven', clear: 'Quitar todos', before: 'Antes había {total}; con {filters}, ninguna.' }
  const CAUSES = [
    { cause: 'none', title: 'Aún no hay muestras', description: 'Las muestras que registres aparecerán aquí, la más reciente arriba.', actions: [{ label: 'Registrar muestra', variant: 'solid' }] },
    { cause: 'filtered', title: 'Ninguna muestra con estos filtros', description: 'Prueba con otro texto o quita algún filtro.', actions: [{ label: 'Limpiar filtros' }] },
    { cause: 'error', title: 'No se pudieron cargar las muestras', description: 'El servidor no respondió (503).', actions: [{ label: 'Reintentar' }] },
    { cause: 'forbidden', title: 'No tienes permiso para ver estas muestras', description: 'Pídeselo a la responsable del laboratorio, Laura Ortiz.' }
  ]

  function build() {
    const $ = (s) => document.querySelector(s)
    for (const host of [$('#s1'), $('#s1n')]) for (const c of CAUSES) { host.append(h('p', { class: 'tag', text: c.cause })); host.append(Object.assign(empty(c), { id: host.id + '-' + c.cause })) }
    for (const host of [$('#s2'), $('#s2n')]) {
      host.append(h('p', { class: 'tag', text: 'tres filtros, dos devuelven algo' }))
      host.append(Object.assign(empty({ cause: 'filtered', title: 'Ninguna muestra con estos filtros', total: 4, filters: [{ key: 'u', label: 'Urgentes', count: 0 }, { key: 'c', label: 'Cerradas', count: 2 }, { key: 'h', label: 'Hoy', count: 12 }], labels: EXIT }), { id: host.id + '-exit' }))
      host.append(h('p', { class: 'tag', text: 'un filtro sin cuenta: solo «Quitar todos»' }))
      host.append(Object.assign(empty({ cause: 'filtered', title: 'Ninguna muestra con «Laura»', total: 4, filters: [{ key: 'q', label: 'Laura' }], labels: EXIT }), { id: host.id + '-exit1' }))
    }
    const s3 = $('#s3')
    s3.append(Object.assign(empty({ cause: 'error', title: 'تعذّر تحميل العينات', description: 'لم يستجب الخادم (503).', actions: [{ label: 'إعادة المحاولة' }] }), { id: 's3-error' }))
    s3.append(h('p', { class: 'tag', text: 'filtered' }))
    s3.append(Object.assign(empty({ cause: 'filtered', title: 'لا توجد عينات بهذه المرشحات', total: 4, filters: [{ key: 'c', label: 'مغلقة', count: 2 }, { key: 'h', label: 'اليوم', count: 5 }], labels: { relax: 'إزالة «{label}»', returns: '{count} تعود', clear: 'إزالة الكل', before: 'كان هناك {total}؛ مع {filters}، لا شيء.' }, locale: 'ar' }), { id: 's3-exit' }))

    const r4 = region($('#s4'), { id: 'r-list', label: 'Muestras', kind: 'list', sample: SAMPLE.list, items: REAL.list, labels: LABELS })
    controls($('#c4'), r4, { list2: REAL.list2 })
    const r5 = region($('#s5'), { id: 'r-tiles', label: 'Panel', kind: 'tiles', sample: SAMPLE.tiles, items: REAL.tiles, labels: LABELS })
    controls($('#c5'), r5)
    const r6 = region($('#s6'), { id: 'r-detail', label: 'Ficha', kind: 'detail', sample: SAMPLE.detail, items: REAL.detail, labels: LABELS })
    controls($('#c6'), r6)
    const r7 = region($('#s7'), { id: 'r-empty', label: 'Muestras filtradas', kind: 'list', sample: SAMPLE.list, items: REAL.list, labels: LABELS })
    r7.empty({ cause: 'filtered', title: 'Ninguna muestra con estos filtros', total: 4, filters: [{ key: 'c', label: 'Cerradas', count: 2 }, { key: 'u', label: 'Urgentes', count: 1 }], labels: EXIT })
    const r8 = region($('#s8'), { id: 'r-rtl', label: 'عينات', kind: 'list', sample: RTL.sample, items: RTL.real, labels: { ...LABELS, refreshing: 'جارٍ التحديث' } })
    r8.S.prev = new Set(['R-2'])
    r8.arrive(RTL.real)
    const t9 = table($('#s9'), { id: 't-load', caption: 'Muestras' })
    const c9 = $('#c9')
    for (const [t, f] of [['Primera carga: retraso', () => t9.firstPending()], ['Esqueleto', () => t9.skeleton()], ['Espera larga', () => t9.slow()], ['Refresco: retraso (filas inertes)', () => t9.refreshPending()], ['Fallo con filas', () => t9.failed()], ['Reposo', () => t9.idle()]]) c9.append(h('button', { type: 'button', text: t, onclick: f }))
    const s10 = $('#s10')
    table(s10, { id: 't-empty', caption: 'Sin muestras' }).empty()
    table(s10, { id: 't-filtered', caption: 'Filtradas' }).emptyFiltered()
    table(s10, { id: 't-error', caption: 'Con error y sin filas' }).errorNoRows()
    table(s10, { id: 't-failed', caption: 'Con error y filas' }).failed()
  }

  window.XBench = { build, empty, region, table, regions, tables, REAL, SAMPLE }
})()
