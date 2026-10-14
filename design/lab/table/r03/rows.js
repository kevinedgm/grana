// GTable r03 (kiwi) · activación de fila, estado de fila y summary del servidor. Prototipo de estructura: DOM y clases
// reales de GTable (grana.css) y tokens del tema por defecto. Sin dependencias; iconos solo Lucide (window.lucide).
// ?c=base|A|B|C · ?w=360 (tarjetas) · ?dir=rtl · ?theme=dark · ?lat=0 (sin latencia, para verificar)
;(() => {
  const q = new URLSearchParams(location.search)
  const C = ['base', 'A', 'B', 'C'].includes(q.get('c')) ? q.get('c') : 'base'
  const LAT = q.has('lat') ? Number(q.get('lat')) : 250
  document.body.dataset.c = C
  if (q.get('w') === '360') document.body.dataset.w = '360'
  if (q.get('dir') === 'rtl') document.documentElement.dir = 'rtl'
  if (q.get('theme') === 'dark') document.documentElement.dataset.theme = 'dark'
  const ic = (n, cls = '') => window.lucide(n, cls)
  const $ = (s, r = document) => r.querySelector(s)
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

  // ---------- Página: enlaces, textos ----------
  const keep = (k, v) => { const p = new URLSearchParams(location.search); if (v == null) p.delete(k); else p.set(k, v); return '?' + p }
  document.querySelectorAll('.lab-links a').forEach((a) => {
    const t = new URLSearchParams(a.getAttribute('href'))
    if (t.has('c')) { a.href = keep('c', t.get('c')); if (t.get('c') === C) a.setAttribute('aria-current', 'page') }
  })
  $('#w-link').href = keep('w', q.get('w') === '360' ? null : '360')
  $('#w-link').textContent = q.get('w') === '360' ? 'Ancho completo (tabla)' : 'Ancho 360 (tarjetas)'
  $('#rtl-link').href = keep('dir', q.get('dir') === 'rtl' ? null : 'rtl')
  $('#rtl-link').textContent = q.get('dir') === 'rtl' ? 'Ver en LTR' : 'Ver en RTL'
  $('#dark-link').href = keep('theme', q.get('theme') === 'dark' ? null : 'dark')
  const TXT = {
    base: ['Base funcional', 'Lo que no se discute, con la forma convencional a propósito: cada fila tiene una puerta real (un enlace o un botón) en su nombre; Intro, clic central y «abrir en pestaña» son nativos. El clic en el resto de la fila se delega a la puerta, salvo sobre otro control, con texto seleccionado, al arrastrar o en el segundo clic de un doble clic. El estado de la fila es semántico: tono del tema, texto y forma.', 'Pulsa una fila, o Tab hasta un lote e Intro. Ctrl/⌘+clic o clic central sobre el código abre otra pestaña. La casilla y el menú no abren nada.'],
    A: ['A · La puerta', 'La fila no se pulsa: se lee. La celda principal entera es la puerta (un enlace real cubre toda la celda) y el resto de la fila queda libre para leer, seleccionar y copiar (códigos, ubicaciones). Al pasar por la fila o enfocarla, la puerta se delata con una flecha que asoma. Al volver de la ficha, la fila se ilumina y se asienta: te dice dónde estabas. El estado va en el lomo de la fila, con una forma por estado, y en una etiqueta junto al nombre.', 'Selecciona con un doble clic la ubicación o la caducidad: no se abre nada. Pulsa cualquier punto de la celda «Lote»: se abre. Clic central en la celda: otra pestaña.'],
    B: ['B · Despliegue', 'Activar una fila no te saca de la lista: su ficha se despliega debajo, en su sitio, sin perder la página del servidor ni el desplazamiento. La puerta es un botón de divulgación (aria-expanded) y la ficha completa sigue a un enlace real de distancia. El estado no tiñe la fila: se sella en la celda que lo causa (la caducidad, la ubicación de cuarentena), que es la respuesta a «¿por qué?».', 'Pulsa una fila: se despliega. Doble clic: no se cierra (el segundo clic se ignora). Esc dentro de la ficha la pliega y devuelve el foco a la fila.'],
    C: ['C · Lente', 'Activar una fila la apunta: pasa al inspector junto a la tabla, y la lista sigue a la vista. «Anterior» y «Siguiente» recorren las filas y cruzan las páginas del servidor sin volver a la tabla. Encima de la tabla, el recuento de lo que pide atención en esta página y un salto «Ir al siguiente con aviso». La puerta sigue siendo un enlace real: clic central abre la ficha completa en otra pestaña.', 'Pulsa una fila y recorre con «Siguiente» hasta la página 2. Prueba «Ir al siguiente con aviso».']
  }
  $('#t-title').textContent = TXT[C][0]
  $('#t-lead').textContent = TXT[C][1]
  $('#t-how').textContent = TXT[C][2]

  // ---------- Datos (inventario de lotes; «hoy» fijo para que el estado sea determinista) ----------
  const TODAY = new Date('2026-10-13T12:00:00')
  const P = [
    ['Ácido clorhídrico 37 %', 'L'], ['Etanol absoluto', 'L'], ['Agar Mueller-Hinton', 'kg'], ['Puntas de pipeta 200 µL', 'cajas'],
    ['Tris-HCl 1 M', 'L'], ['Kit de extracción de ADN', 'kits'], ['Guantes de nitrilo M', 'cajas'], ['Buffer PBS 10×', 'L'],
    ['Cloruro de sodio', 'kg'], ['Medio LB', 'kg'], ['Tubos Falcon 50 mL', 'bolsas'], ['Glicerol', 'L']
  ]
  const LOC = ['Refrigerador 1 · A2', 'Anaquel 3 · B1', 'Congelador −20 · C4', 'Anaquel 1 · A1', 'Refrigerador 2 · B3', 'Gabinete de ácidos · 1']
  const add = (d) => { const x = new Date(TODAY); x.setDate(x.getDate() + d); return x }
  const OFF = [-12, 140, 9, 320, -3, 25, 410, 60, 18, 210, 95, -40, 180, 6, 300, 75, 33, 260, 14, 500, 120, 45, 220]
  const DATA = OFF.map((d, i) => {
    const [product, unit] = P[i % P.length]
    const quarantine = i === 7 || i === 16
    return {
      id: 'l' + (2040 + i), code: 'L-' + (2040 + i), product, unit,
      location: quarantine ? 'Cuarentena · R2' : LOC[i % LOC.length],
      qty: ((i * 7) % 23) + 1, expiry: add(d), quarantine
    }
  })
  const days = (d) => Math.round((d - TODAY) / 864e5)
  const fmtDate = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
  // rowStatus(row) → { status, text, key } | null: lo que se propone a lima (sin clase libre)
  const rowStatus = (r) => {
    const n = days(r.expiry)
    if (n < 0) return { status: 'error', text: 'Caducado', key: 'caducidad' }
    if (n <= 30) return { status: 'warning', text: `Caduca en ${n} días`, key: 'caducidad' }
    if (r.quarantine) return { status: 'info', text: 'En cuarentena', key: 'ubicacion' }
    return null
  }
  const TONE = { error: ['danger', 'circle-alert'], warning: ['warning', 'triangle-alert'], info: ['info', 'info'] }
  const COLS = [
    { key: 'lote', label: 'Lote', min: 40, primary: true },
    { key: 'ubicacion', label: 'Ubicación', min: 24, value: (r) => r.location },
    { key: 'existencias', label: 'Existencias', min: 24, end: true, value: (r) => `${r.qty} ${r.unit}` },
    { key: 'caducidad', label: 'Caducidad', min: 24, end: true, value: (r) => fmtDate.format(r.expiry) }
  ]
  const QUICK = [
    { id: 'error', label: 'Caducados', icon: 'circle-alert' },
    { id: 'warning', label: 'Por caducar (30 días)', icon: 'triangle-alert' },
    { id: 'info', label: 'En cuarentena', icon: 'info' }
  ]

  // ---------- «Servidor»: página + total + summary (sobre toda la búsqueda; cada cuenta, sin su propio filtro) ----------
  const server = ({ page, size, quick }) => new Promise((res) => {
    const all = DATA
    const rows = quick ? all.filter((r) => rowStatus(r)?.status === quick) : all
    const summary = { total: all.length }
    QUICK.forEach((k) => { summary[k.id] = all.filter((r) => rowStatus(r)?.status === k.id).length })
    const out = { rows: rows.slice((page - 1) * size, page * size), total: rows.length, summary }
    LAT ? setTimeout(() => res(out), LAT) : res(out)
  })

  // ---------- Estado de la «aplicación» ----------
  const S = { page: 1, size: 8, quick: null, rows: [], total: 0, summary: null, selected: new Set(), expanded: new Set(), current: null, last: null, loading: false }
  const logEl = $('#log')
  const log = (name, payload) => {
    const li = document.createElement('li')
    li.textContent = `${name} ${JSON.stringify(payload)}`
    logEl.prepend(li)
    while (logEl.children.length > 8) logEl.lastChild.remove()
  }

  // ---------- Tabla (DOM real de GTable) ----------
  const tb = $('#tb')
  tb.innerHTML = `
    <div class="g-table__bar" id="tb-bar"></div>
    ${C === 'C' ? '<p class="r3-tally" id="tally"></p>' : ''}
    <div class="g-table__scroll">
      <table class="g-table__table" role="table" tabindex="-1" aria-busy="false">
        <caption class="g-table__caption">Lotes en inventario</caption>
        <thead role="rowgroup"></thead>
        <tbody role="rowgroup"></tbody>
      </table>
    </div>
    <p class="g-table__sr" aria-live="polite" id="tb-live"></p>`
  const thead = $('thead', tb)
  const tbody = $('tbody', tb)
  const live = $('#tb-live')
  const say = (t) => { live.textContent = ''; setTimeout(() => { live.textContent = t }, 30) }
  const nCols = COLS.length + 2
  thead.innerHTML = `<tr role="row">
    <th role="columnheader" scope="col" class="g-table__select"><input type="checkbox" id="all" aria-label="Seleccionar todos los lotes de la página"></th>
    ${COLS.map((c) => `<th role="columnheader" scope="col"${c.end ? ' class="g-table__cell--end"' : ''}>${c.label}</th>`).join('')}
    <th role="columnheader" scope="col" class="g-table__actions"><span class="g-table__sr">Acciones</span></th></tr>`

  const tag = (st, id) => {
    const [color, icon] = TONE[st.status]
    return `<span class="g-badge g-badge--variant-soft g-badge--color-${color} g-badge--size-sm g-badge--kind-text r3-tag" id="${id}"><span class="g-badge__icon" aria-hidden="true">${ic(icon)}</span><span class="g-badge__text">${esc(st.text)}</span></span>`
  }
  const door = (r, st) => {
    const desc = st ? ` aria-describedby="st-${r.id}"` : ''
    if (C === 'B') return `<button type="button" class="r3-door" aria-expanded="${S.expanded.has(r.id)}" aria-controls="det-${r.id}"${desc}>${r.code}</button>`
    const cur = C === 'C' && S.current === r.id ? ' aria-current="true"' : ''
    return `<a class="r3-door" href="#lote/${r.code}"${desc}${cur}>${r.code}</a>`
  }
  const rowHtml = (r) => {
    const st = rowStatus(r)
    const sel = S.selected.has(r.id)
    const causeHere = (k) => C === 'B' && st && st.key === k
    const cls = ['g-table__row', sel && 'is-selected', C === 'B' && S.expanded.has(r.id) && 'is-open', C === 'C' && S.current === r.id && 'is-current', C === 'A' && S.last === r.id && 'is-last'].filter(Boolean).join(' ')
    const cells = COLS.map((c) => {
      if (c.primary) {
        return `<td role="cell" class="g-table__cell g-table__cell--composite g-table__cell--primary"><span class="g-table__label" aria-hidden="true">${c.label}</span><span class="g-table__composite"><span class="g-table__text"><span class="g-table__title">${door(r, st)}</span><span class="g-table__subtitle">${esc(r.product)}</span></span>${st && C !== 'B' ? tag(st, 'st-' + r.id) : ''}${C === 'A' ? `<span class="r3-arrow" aria-hidden="true">${ic('arrow-right')}</span>` : ''}${C === 'B' ? `<span class="r3-chev" aria-hidden="true">${ic('chevron-right')}</span>` : ''}${C === 'C' ? `<span class="r3-cur" aria-hidden="true">${ic('chevron-right')}</span>` : ''}</span></td>`
      }
      const v = esc(c.value(r))
      if (causeHere(c.key)) return `<td role="cell" class="g-table__cell is-cause${c.end ? ' g-table__cell--end' : ''}" data-status="${st.status}"><span class="g-table__label" aria-hidden="true">${c.label}</span><span class="r3-cause">${v} ${tag(st, 'st-' + r.id)}</span></td>`
      return `<td role="cell" class="g-table__cell${c.end ? ' g-table__cell--end' : ''}"><span class="g-table__label" aria-hidden="true">${c.label}</span>${v}</td>`
    }).join('')
    const main = `<tr role="row" class="${cls}" data-key="${r.id}"${st ? ` data-status="${st.status}"` : ''}>
      <td role="cell" class="g-table__select"><input type="checkbox" aria-label="Seleccionar ${r.code}"${sel ? ' checked' : ''}></td>${cells}
      <td role="cell" class="g-table__actions"><button type="button" class="g-btn g-btn--color-neutral g-btn--variant-ghost g-btn--size-sm g-btn--density-default g-btn--icon r3-more" aria-label="Acciones de ${r.code}">${ic('ellipsis-vertical')}</button></td></tr>`
    if (C !== 'B') return main
    const open = S.expanded.has(r.id)
    return main + `<tr role="row" class="r3-detail${open ? ' is-in' : ''}" id="det-${r.id}" data-for="${r.id}"${open ? '' : ' hidden'}><td role="cell" colspan="${nCols}"><div class="r3-detail__clip"><div class="r3-detail__in">${detailBody(r, st)}</div></div></td></tr>`
  }
  const facts = (r, st) => `<dt>Producto</dt><dd>${esc(r.product)}</dd><dt>Ubicación</dt><dd>${esc(r.location)}</dd><dt>Existencias</dt><dd>${r.qty} ${r.unit}</dd><dt>Caducidad</dt><dd>${fmtDate.format(r.expiry)}${st ? ' · ' + esc(st.text) : ''}</dd>`
  const detailBody = (r, st) => `<div class="r3-detail__body" role="group" aria-labelledby="dh-${r.id}">
      <h3 class="r3-detail__h" id="dh-${r.id}">Lote ${r.code}</h3>
      <dl class="r3-facts">${facts(r, st)}</dl>
      <div class="r3-actions">
        <a class="r3-link" href="#lote/${r.code}/ficha">Abrir ficha completa ${ic('arrow-right')}</a>
        <button type="button" class="g-btn g-btn--color-neutral g-btn--variant-soft g-btn--size-sm g-btn--density-default" data-act="baja"><span class="g-btn__label">Registrar baja</span></button>
      </div></div>`

  const bar = () => {
    const n = S.selected.size
    $('#tb-bar').innerHTML = `<span class="g-table__count" role="status">${n ? `${n} seleccionados` : ''}</span>`
  }
  const tally = () => {
    if (C !== 'C') return
    const c = { error: 0, warning: 0, info: 0 }
    S.rows.forEach((r) => { const s = rowStatus(r); if (s) c[s.status]++ })
    const parts = [c.error && `${c.error} caducado${c.error > 1 ? 's' : ''}`, c.warning && `${c.warning} por caducar`, c.info && `${c.info} en cuarentena`].filter(Boolean)
    $('#tally').innerHTML = parts.length
      ? `<span>En esta página: ${parts.join(' · ')}</span><button type="button" class="g-btn g-btn--color-neutral g-btn--variant-soft g-btn--size-sm g-btn--density-default" id="next-flag"><span class="g-btn__label">Ir al siguiente con aviso</span></button>`
      : '<span>En esta página no hay avisos.</span>'
  }
  const render = () => {
    tbody.innerHTML = S.rows.map(rowHtml).join('')
    const keys = S.rows.map((r) => r.id)
    const n = keys.filter((k) => S.selected.has(k)).length
    $('#all').checked = n > 0 && n === keys.length
    $('#all').indeterminate = n > 0 && n < keys.length
    bar(); tally(); pager(); summary(); measure()
  }

  // ---------- Carga (paginación del servidor) con foco por rowKey ----------
  const load = async (patch = {}) => {
    Object.assign(S, patch)
    S.loading = true
    $('table', tb).setAttribute('aria-busy', 'true')
    tbody.inert = true
    const a = document.activeElement
    const tr = a && tbody.contains(a) ? a.closest('tr[data-key]') : null
    const mem = tr ? { key: tr.dataset.key, sel: a.matches('.r3-door') ? '.r3-door' : null } : null
    const out = await server(S)
    S.rows = out.rows; S.total = out.total; S.summary = out.summary
    if (C === 'B') S.expanded = new Set([...S.expanded].filter((k) => S.rows.some((r) => r.id === k)))
    S.loading = false
    tbody.inert = false
    $('table', tb).setAttribute('aria-busy', 'false')
    render()
    if (mem) { const back = tbody.querySelector(`tr[data-key="${mem.key}"] ${mem.sel || '.r3-door'}`); (back || $('table', tb)).focus() }
    say(`${S.total} lotes`)
  }

  // ---------- Paginación (el selector de filas por página es de pagination/r02; aquí solo su sitio) ----------
  const pages = () => Math.max(1, Math.ceil(S.total / S.size))
  const pager = () => {
    const from = S.total ? (S.page - 1) * S.size + 1 : 0
    const to = Math.min(S.page * S.size, S.total)
    $('#pager').innerHTML = `<nav aria-label="Paginación de lotes" class="r3-pager">
      <button type="button" class="g-btn g-btn--color-neutral g-btn--variant-ghost g-btn--size-sm g-btn--density-default" id="pg-prev"${S.page <= 1 ? ' disabled' : ''}><span class="g-btn__prepend">${ic('chevron-left')}</span><span class="g-btn__label">Anterior</span></button>
      <span class="r3-pager__range">${from}–${to} de ${S.total}</span>
      <button type="button" class="g-btn g-btn--color-neutral g-btn--variant-ghost g-btn--size-sm g-btn--density-default" id="pg-next"${S.page >= pages() ? ' disabled' : ''}><span class="g-btn__label">Siguiente</span><span class="g-btn__append">${ic('chevron-right')}</span></button>
      </nav><span class="r3-pager__slot">Aquí va el selector de filas por página (pagination r02)</span>`
  }
  $('#pager').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return
    const page = S.page + (b.id === 'pg-next' ? 1 : -1)
    log('update:page', page)
    load({ page }).then(() => $(`#${b.id}`)?.focus())
  })

  // ---------- Summary: filtros rápidos con cuentas sobre toda la búsqueda ----------
  const summary = () => {
    const s = S.summary; if (!s) return
    $('#sum-tiles').innerHTML = QUICK.map((k) => `<button type="button" class="r3-tile" data-quick="${k.id}" aria-pressed="${S.quick === k.id}"><span class="r3-tile__label">${ic(k.icon)}${k.label}</span><span class="r3-tile__value">${s[k.id]}</span></button>`).join('')
      + `<div class="r3-tile"><span class="r3-tile__label">Lotes en la búsqueda</span><span class="r3-tile__value">${s.total}</span></div>`
  }
  $('#sum-tiles').addEventListener('click', (e) => {
    const b = e.target.closest('[data-quick]'); if (!b) return
    const quick = S.quick === b.dataset.quick ? null : b.dataset.quick
    log('update:filters', quick ? [{ key: 'estado', op: 'in', value: [quick] }] : [])
    load({ quick, page: 1 }).then(() => $(`[data-quick="${b.dataset.quick}"]`)?.focus())
  })

  // ---------- Modo tabla / tarjetas: la regla real (suma de min + 10 + 10) × space ----------
  const measure = () => {
    const space = parseFloat(getComputedStyle(tb).getPropertyValue('--g-space-1')) || 4
    const need = (COLS.reduce((s, c) => s + c.min, 0) + 20) * space
    const w = tb.getBoundingClientRect().width
    const mode = w && w < need ? 'cards' : 'table'
    tb.classList.toggle('g-table--mode-cards', mode === 'cards')
    tb.classList.toggle('g-table--mode-table', mode === 'table')
  }
  new ResizeObserver(() => requestAnimationFrame(measure)).observe(tb)

  // ---------- Selección y menú: nunca activan la fila ----------
  tbody.addEventListener('change', (e) => {
    const box = e.target.closest('.g-table__select input'); if (!box) return
    const k = box.closest('tr').dataset.key
    box.checked ? S.selected.add(k) : S.selected.delete(k)
    box.closest('tr').classList.toggle('is-selected', box.checked)
    log('update:selected', [...S.selected])
    bar()
    const keys = S.rows.map((r) => r.id); const n = keys.filter((x) => S.selected.has(x)).length
    $('#all').checked = n === keys.length; $('#all').indeterminate = n > 0 && n < keys.length
  })
  $('#all').addEventListener('change', (e) => {
    S.rows.forEach((r) => (e.target.checked ? S.selected.add(r.id) : S.selected.delete(r.id)))
    log('update:selected', [...S.selected]); render()
  })

  // ---------- La puerta ----------
  const rowOf = (k) => S.rows.find((r) => r.id === k)
  const dlg = $('#dlg')
  let openedFrom = null
  const openDialog = (r) => {
    $('#dlg-h').textContent = `Lote ${r.code}`
    $('#dlg-facts').innerHTML = facts(r, rowStatus(r))
    openedFrom = r.id
    dlg.showModal()
  }
  dlg.addEventListener('close', () => {
    const tr = tbody.querySelector(`tr[data-key="${openedFrom}"]`)
    if (!tr) return
    $('.r3-door', tr).focus()
    if (C === 'A') {
      // El rastro: la fila se ilumina y se asienta; la flecha queda a la vista en la última abierta
      tbody.querySelectorAll('.is-last').forEach((x) => x.classList.remove('is-last'))
      S.last = openedFrom
      tr.classList.add('is-last', 'is-trail')
      requestAnimationFrame(() => requestAnimationFrame(() => { tr.classList.add('is-settle'); tr.classList.remove('is-trail') }))
      setTimeout(() => tr.classList.remove('is-settle'), 1200)
    }
  })
  // Regla de #505: solo el clic primario sin modificadores emite; con Ctrl/⌘/Mayús/Alt o botón central, el navegador
  tbody.addEventListener('click', (e) => {
    const d = e.target.closest('.r3-door'); if (!d) return
    const k = d.closest('tr').dataset.key, r = rowOf(k)
    if (C === 'B') {
      if (e.detail > 1) return // el segundo clic de un doble clic no deshace el primero
      return toggle(k)
    }
    if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return
    e.preventDefault() // la «aplicación» cancela navigate y abre su detalle (router, diálogo o inspector)
    log('navigate', { key: k, href: d.getAttribute('href') })
    if (e.detail > 1) return
    if (C === 'C') return setCurrent(k, { announce: true })
    openDialog(r)
  })

  // ---------- Delegación de la fila (base, B y C; A no la tiene) ----------
  const INTERACTIVE = 'a[href],button,input,select,textarea,label,summary,[contenteditable],[tabindex]:not([tabindex="-1"]),[role="button"],[role="link"]'
  let down = null
  tbody.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY } })
  tbody.addEventListener('click', (e) => {
    if (C === 'A') return
    const tr = e.target.closest('tr.g-table__row'); if (!tr || !tbody.contains(tr)) return
    if (e.target.closest(INTERACTIVE)) return // otro control (o la propia puerta): manda él
    if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return
    if (e.detail > 1) return
    const sel = getSelection()
    if (sel && !sel.isCollapsed && String(sel).trim() && tr.contains(sel.anchorNode)) return // está copiando
    if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 5) return // arrastró
    const d = $('.r3-door', tr)
    d.focus({ preventScroll: true }) // la puerta recibe el foco: el detalle sabrá a dónde devolverlo
    d.click()
  })

  // ---------- B · despliegue ----------
  function toggle (k, { focusDoor = false } = {}) {
    const open = !S.expanded.has(k)
    open ? S.expanded.add(k) : S.expanded.delete(k)
    log('update:expanded', [...S.expanded])
    const tr = tbody.querySelector(`tr[data-key="${k}"]`)
    const det = $(`#det-${k}`)
    tr.classList.toggle('is-open', open)
    $('.r3-door', tr).setAttribute('aria-expanded', String(open))
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    if (open) {
      det.hidden = false
      requestAnimationFrame(() => requestAnimationFrame(() => det.classList.add('is-in')))
    } else {
      det.classList.remove('is-in')
      const done = () => { if (!S.expanded.has(k)) det.hidden = true }
      reduce ? done() : setTimeout(done, 320)
    }
    if (focusDoor) $('.r3-door', tr).focus()
  }
  tbody.addEventListener('keydown', (e) => {
    if (C !== 'B' || e.key !== 'Escape') return
    const det = e.target.closest('.r3-detail'); if (!det) return
    e.preventDefault(); e.stopPropagation()
    toggle(det.dataset.for, { focusDoor: true })
  })
  tbody.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act="baja"]'); if (!b) return
    log('action', { id: 'baja', key: b.closest('.r3-detail').dataset.for })
  })
  tbody.addEventListener('click', (e) => {
    const m = e.target.closest('.r3-more'); if (!m) return
    log('menú de fila (GMenu)', { key: m.closest('tr').dataset.key })
  })

  // ---------- C · lente ----------
  const ins = $('#inspector')
  function setCurrent (k, { announce = false } = {}) {
    S.current = k
    log('update:current', k)
    tbody.querySelectorAll('tr.is-current').forEach((tr) => { tr.classList.remove('is-current'); $('.r3-door', tr).removeAttribute('aria-current') })
    const tr = tbody.querySelector(`tr[data-key="${k}"]`)
    if (tr) {
      tr.classList.add('is-current'); $('.r3-door', tr).setAttribute('aria-current', 'true')
      tr.scrollIntoView({ block: 'nearest' })
    }
    const r = rowOf(k); const st = rowStatus(r)
    const i = S.rows.indexOf(r) + (S.page - 1) * S.size
    ins.hidden = false
    ins.innerHTML = `<p class="r3-inspector__eyebrow">Inspector · ${i + 1} de ${S.total}</p>
      <h2 class="r3-inspector__h" id="ins-h">Lote ${r.code}</h2>
      ${st ? tag(st, 'ins-st') : ''}
      <dl class="r3-facts">${facts(r, st)}</dl>
      <div class="r3-actions"><a class="r3-link" href="#lote/${r.code}/ficha">Abrir ficha completa ${ic('arrow-right')}</a></div>
      <div class="r3-inspector__walk">
        <button type="button" class="g-btn g-btn--color-neutral g-btn--variant-soft g-btn--size-sm g-btn--density-default" id="walk-prev"${i <= 0 ? ' disabled' : ''}><span class="g-btn__prepend">${ic('chevron-left')}</span><span class="g-btn__label">Anterior</span></button>
        <button type="button" class="g-btn g-btn--color-neutral g-btn--variant-soft g-btn--size-sm g-btn--density-default" id="walk-next"${i >= S.total - 1 ? ' disabled' : ''}><span class="g-btn__label">Siguiente</span><span class="g-btn__append">${ic('chevron-right')}</span></button>
      </div>`
    if (announce) say(`Lote ${r.code} en el inspector`)
  }
  ins.addEventListener('click', async (e) => {
    const b = e.target.closest('#walk-prev, #walk-next'); if (!b) return
    const dir = b.id === 'walk-next' ? 1 : -1
    const idx = S.rows.findIndex((r) => r.id === S.current) + dir
    if (idx >= 0 && idx < S.rows.length) { setCurrent(S.rows[idx].id, { announce: true }) } else {
      const page = S.page + dir
      log('update:page', page)
      await load({ page })
      setCurrent(S.rows[dir > 0 ? 0 : S.rows.length - 1].id)
      say(`Página ${page}. Lote ${rowOf(S.current).code} en el inspector`)
    }
    $(`#${b.id}`)?.focus()
  })
  tb.addEventListener('click', (e) => {
    if (!e.target.closest('#next-flag')) return
    const start = Math.max(-1, S.rows.findIndex((r) => r.id === S.current))
    for (let j = 1; j <= S.rows.length; j++) {
      const r = S.rows[(start + j) % S.rows.length]
      if (rowStatus(r)) { setCurrent(r.id); say(`Lote ${r.code}, ${rowStatus(r).text}, en el inspector`); break }
    }
  })

  load()
  window.r3 = { S, rowStatus, load }
})()
