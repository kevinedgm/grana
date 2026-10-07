// Prototipo de la etiqueta (GTag, nombre de trabajo) · kiwi r01. Solo para medir estructura y comportamiento: no es el
// componente. Sin dependencias: pinta con el CSS real de Grana (grana.css, tokens del tema por defecto) y los iconos de
// Lucide de design/lab/lucide-icons.js. window.Tag.group(raíz, opciones) monta un grupo; window.__tag expone el estado.
(function () {
  const L = (n, cls = '', filled = false) => window.lucide(n, cls, filled)
  const fill = (t, o) => String(t).replace(/\{(\w+)\}/g, (_, k) => (o[k] ?? ''))
  let uid = 0

  // ---------- Color por categoría: el mismo hash que GAvatar (avatar.md «Hash», #294): FNV-1a 32 bits sobre UTF-8 + fmix32 ----------
  function category(key, n) {
    const s = String(key).normalize('NFC').trim().replace(/\s+/gu, ' ').toLowerCase()
    if (!s || !n) return null
    let h = 0x811c9dc5
    for (const b of new TextEncoder().encode(s)) { h ^= b; h = Math.imul(h, 0x01000193) }
    h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16
    return ((h >>> 0) % n) + 1
  }
  const catOf = (it, g) => it.color != null ? Number(it.color) : (g.categories ? category(it.colorKey ?? it.facet ?? it.label, g.categories) : null)

  // ---------- Un solo canal vivo cortés por página (patrón de liveRegion.js: vaciar y escribir en el ciclo siguiente) ----------
  let live, clearT, writeT
  function announce(text) {
    if (!live) { live = document.createElement('div'); live.className = 't-sr'; live.id = 't-live'; live.setAttribute('aria-live', 'polite'); live.setAttribute('aria-atomic', 'true'); document.body.append(live) }
    clearTimeout(clearT); clearTimeout(writeT); live.textContent = ''
    writeT = setTimeout(() => { live.textContent = text; clearT = setTimeout(() => { live.textContent = '' }, 5000) }, 50)
  }

  // ---------- Pista visual del texto recortado (modo visual del motor de GTooltip, #433: aria-hidden; el nombre ya es el texto entero) ----------
  let tip
  function showTip(el) {
    // Botón de solo icono: la pista es su nombre, siempre (#433). Cuerpo: solo si su texto está recortado
    const tag = el.closest('.t-tag'), text = tag && tag.querySelector('.t-text')
    const cut = text && text.scrollWidth > text.clientWidth + 1
    const label = el.hasAttribute('data-tip-label') ? el.getAttribute('aria-label') : cut ? text.textContent : ''
    if (!label) return hideTip()
    if (!tip) { tip = document.createElement('div'); tip.className = 't-tip'; tip.setAttribute('aria-hidden', 'true'); document.body.append(tip) }
    tip.textContent = label
    const r = el.getBoundingClientRect()
    tip.style.insetInlineStart = '0px'; tip.hidden = false
    const w = tip.offsetWidth, rtl = getComputedStyle(el).direction === 'rtl'
    const x = Math.max(8, Math.min(innerWidth - w - 8, rtl ? r.right - w : r.left))
    tip.style.left = x + scrollX + 'px'; tip.style.top = r.bottom + scrollY + 6 + 'px'; tip.style.insetInlineStart = ''
  }
  const hideTip = () => { if (tip) tip.hidden = true }

  // ---------- Grupo ----------
  // opciones: { concept: 'base'|'A'|'B'|'C', label, items, categories, size, limit, emptyFocus, clearAll, labels, kind: 'list'|'toggles' }
  // item: { id, label, color?, colorKey?, facet?, href?, pressed?, removable?, avatar?, disabled? }
  const DEF = { remove: 'Quitar {label}', removeIn: 'Quitar {label} de {facet}', removeShort: 'Quitar', removed: '{label} quitada', removedIn: '{label} quitada de {facet}', removedUndo: '{label} quitada. Deshacer disponible', undo: 'Deshacer: quitar {label}', restored: '{label} restaurada', more: 'Ver {n} más', less: 'Ver menos', clearAll: 'Quitar todas', cleared: 'Se quitaron {n} etiquetas', undoAll: 'Deshacer: volver a poner {n}', empty: 'Sin etiquetas' }
  const groups = new Map()

  function group(root, o) {
    const g = { root, concept: o.concept || 'base', label: o.label, items: o.items.map((x) => ({ ...x })), categories: o.categories || 0, size: o.size || 'md', limit: o.limit || 0, expanded: false, emptyFocus: o.emptyFocus, clearAll: !!o.clearAll, labels: { ...DEF, ...(o.labels || {}) }, kind: o.kind || 'list', cleared: null, log: [] }
    g.id = root.id || 'tg' + ++uid
    groups.set(g.id, g)
    render(g)
    root.addEventListener('click', (e) => onClick(g, e))
    root.addEventListener('keydown', (e) => onKey(g, e))
    root.addEventListener('pointerover', (e) => { const t = e.target.closest('[data-tip]'); if (t) showTip(t) })
    root.addEventListener('pointerout', (e) => { if (e.target.closest('[data-tip]')) hideTip() })
    root.addEventListener('focusin', (e) => { const t = e.target.closest('[data-tip]'); if (t) showTip(t); else hideTip() })
    root.addEventListener('focusout', () => {
      hideTip()
      if (g.concept === 'A') setTimeout(() => settle(g), 0)
      // «Deshacer» de «Quitar todas» dura mientras sigas en el grupo
      setTimeout(() => { if (g.cleared && !root.contains(document.activeElement)) { g.cleared = null; render(g) } }, 0)
    })
    // C · al tocar una palabra quitable (táctil, sin hover), el foco va a su «Quitar» y la pestaña aparece; un segundo toque quita
    if (g.concept === 'C') root.addEventListener('pointerdown', (e) => {
      g.arming = null
      if (e.pointerType === 'mouse') return
      const b = e.target.closest('.t-body--static'); const x = b && b.closest('.t-tag')?.querySelector('[data-part="remove"]')
      // El clic de este mismo gesto no debe quitar aunque la pestaña aparezca bajo el dedo: se marca y se ignora una vez
      if (x) { e.preventDefault(); x.focus(); g.arming = x }
    })
    if (g.concept === 'A') {
      root.addEventListener('pointerleave', () => settle(g, 'left')) // Firefox aún da :hover dentro de pointerleave
      document.addEventListener('pointerdown', (e) => { if (!root.contains(e.target)) settle(g, true) })
    }
    return g
  }

  const removeName = (g, it) => fill(it.facet && g.concept === 'B' ? g.labels.removeIn : g.labels.remove, it)
  const avatar = (it, cat) => it.avatar ? `<span class="g-avatar g-avatar--size-xs g-avatar--shape-circle t-avatar"${cat ? ` data-cat="${cat}"` : ''} aria-hidden="true"><span class="g-avatar__initials" translate="no">${it.avatar}</span></span>` : ''

  // C: la marca de la palabra. Alternar: circle vacío → check (la forma cambia, no solo el color); el resto, punto relleno de su categoría
  const markC = (it) => it.pressed != null ? (it.pressed ? L('check') : L('circle')) : L('circle', '', true)
  // La parte que actúa (cuerpo) de una etiqueta: texto, enlace o botón de alternar
  function body(g, it, cat) {
    const mark = g.concept === 'C' ? `<span class="t-mark" aria-hidden="true">${markC(it)}</span>` : ''
    const text = `<span class="t-text" dir="auto">${it.label}</span>`
    if (it.href) return `<a class="t-body t-body--link" href="${it.href}" data-part="body" data-tip>${mark}${avatar(it, cat)}${text}</a>`
    if (it.pressed != null) return `<button class="t-body t-body--toggle" type="button" aria-pressed="${it.pressed}" data-part="body"${it.disabled ? ' disabled' : ''} data-tip>${g.concept === 'C' ? mark : `<span class="t-check" aria-hidden="true">${L('check')}</span>`}${avatar(it, cat)}${text}</button>`
    return `<span class="t-body t-body--static">${mark}${avatar(it, cat)}${text}</span>`
  }
  // C · la acción vive en una pestaña con texto visible («Quitar»): el nombre accesible la contiene (WCAG 2.5.3), sin pista
  const removeBtn = (g, it) => g.concept === 'C'
    ? `<button class="t-remove" type="button" aria-label="${removeName(g, it)}" aria-keyshortcuts="Delete" data-part="remove"${it.disabled ? ' disabled' : ''}>${L('x')}<span aria-hidden="true">${g.labels.removeShort}</span></button>`
    : `<button class="t-remove" type="button" aria-label="${removeName(g, it)}" aria-keyshortcuts="Delete" data-part="remove"${it.disabled ? ' disabled' : ''} data-tip data-tip-label>${L('x')}</button>`

  function tagHTML(g, it) {
    const cat = catOf(it, g)
    const cls = ['t-tag', `t-tag--${g.size}`, it.removable ? 'is-removable' : '', it.pressed ? 'is-pressed' : '', it.href ? 'is-link' : '', it.pressed != null ? 'is-toggle' : '', it.ghost ? 'is-ghost' : ''].filter(Boolean).join(' ')
    if (it.ghost) return `<span class="${cls}"${cat ? ` data-cat="${cat}"` : ''}><span class="t-body t-body--static" aria-hidden="true"><span class="t-text" dir="auto">${it.label}</span></span><button class="t-undo" type="button" aria-label="${fill(g.labels.undo, it)}" data-part="undo" data-tip data-tip-label>${L('undo-2')}</button></span>`
    return `<span class="${cls}"${cat ? ` data-cat="${cat}"` : ''}>${body(g, it, cat)}${it.removable ? removeBtn(g, it) : ''}</span>`
  }

  function render(g) {
    const { root } = g
    root.classList.add('t-group', `t-group--${g.concept}`)
    if (g.concept === 'B') return renderB(g)
    const visible = g.limit && !g.expanded ? g.items.slice(0, g.limit) : g.items
    const hiddenN = g.items.length - visible.length
    const name = g.label ? ` aria-label="${g.label}"` : ''
    let html
    if (g.kind === 'toggles') html = `<div class="t-list" role="group"${name}>${visible.map((it) => `<span class="t-item" data-id="${it.id}">${tagHTML(g, it)}</span>`).join('')}</div>`
    else {
      // En una frase (raíz <span>, C) la lista no puede ser <ul> dentro de <p>: <span role="list"> + <span role="listitem">
      const inl = root.tagName === 'SPAN', UL = inl ? 'span' : 'ul', LI = inl ? 'span' : 'li', liRole = inl ? ' role="listitem"' : ''
      html = `<${UL} class="t-list" role="list"${name} id="${g.id}-list">${g.items.map((it, i) => `<${LI}${liRole} class="t-item${it.ghost ? ' is-ghost' : ''}" data-id="${it.id}"${g.limit && !g.expanded && i >= g.limit ? ' hidden' : ''}>${tagHTML(g, it)}</${LI}>`).join(g.concept === 'C' ? ' ' : '')}</${UL}>` // C: un espacio real entre palabras (corte de línea)
    }
    const tools = []
    if (g.limit && g.items.length > g.limit) tools.push(`<button class="t-more" type="button" aria-expanded="${g.expanded}" aria-controls="${g.id}-list" data-part="more">${g.expanded ? g.labels.less : fill(g.labels.more, { n: hiddenN })}</button>`)
    if (g.clearAll && g.cleared) tools.push(`<button class="t-clear" type="button" data-part="undo-all">${L('undo-2')}<span>${fill(g.labels.undoAll, { n: g.cleared.length })}</span></button>`)
    else if (g.clearAll && g.items.filter((x) => x.removable && !x.ghost).length > 1) tools.push(`<button class="t-clear" type="button" data-part="clear">${g.labels.clearAll}</button>`)
    if (!g.items.length && !g.cleared) html = `<p class="t-empty">${g.labels.empty}</p>`
    root.innerHTML = html + (tools.length ? `<span class="t-tools">${tools.join('')}</span>` : '')
  }

  // B · Racimo: las etiquetas con la misma faceta forman un bloque con lomo de color y el nombre de la faceta una vez
  function renderB(g) {
    const order = [], by = new Map()
    for (const it of g.items) { const k = it.facet || '\u0000' + it.id; if (!by.has(k)) { by.set(k, []); order.push(k) } by.get(k).push(it) }
    const name = g.label ? ` aria-label="${g.label}"` : ''
    const html = `<ul class="t-list" role="list"${name}>${order.map((k, ri) => {
      const its = by.get(k), f = its[0].facet, cat = catOf(its[0], g), fid = `${g.id}-f${ri}`
      const toggles = its.every((x) => x.pressed != null)
      const vals = its.map((it) => `<${toggles ? 'span' : 'li'} class="t-val" data-id="${it.id}">${tagHTML(g, it)}</${toggles ? 'span' : 'li'}>`).join('')
      const inner = toggles ? `<span class="t-vals" role="group" aria-labelledby="${fid}">${vals}</span>` : `<ul class="t-vals" role="list"${f ? ` aria-labelledby="${fid}"` : ''}>${vals}</ul>`
      return `<li class="t-racimo${f ? '' : ' is-loose'}"${cat ? ` data-cat="${cat}"` : ''} data-facet="${f || ''}">${f ? `<span class="t-facet" id="${fid}" dir="auto">${f}</span>` : ''}${inner}</li>`
    }).join('')}</ul>`
    g.root.innerHTML = g.items.length ? html : `<p class="t-empty">${g.labels.empty}</p>`
  }

  // ---------- Foco ----------
  const focusPart = (g, id, part) => { const el = g.root.querySelector(`[data-id="${id}"] [data-part="${part}"]`); if (el) { el.focus(); return true } return false }
  function focusAfterRemove(g, idx, part, facet) {
    const alive = g.items.filter((x) => !x.ghost)
    // B: primero dentro del mismo racimo, después el racimo siguiente o el anterior
    if (g.concept === 'B' && facet) {
      const same = g.items.filter((x) => x.facet === facet)
      const i = Math.min(idx, same.length - 1)
      if (same.length && focusPart(g, same[i].id, part)) return
    }
    // La siguiente con un control (el equivalente primero); si no hay, la anterior más cercana
    const order = [...alive.slice(idx), ...alive.slice(0, idx).reverse()]
    for (const it of order) if (focusPart(g, it.id, part) || focusPart(g, it.id, 'remove') || focusPart(g, it.id, 'body')) return
    const target = g.emptyFocus && document.querySelector(g.emptyFocus)
    if (target) return target.focus()
    // Sin destino de la aplicación: el propio grupo (lee su nombre y «Sin etiquetas»), nunca <body>
    g.root.tabIndex = -1; g.root.focus()
  }

  // ---------- Quitar, deshacer, asentar ----------
  function remove(g, id, part) {
    const i = g.items.findIndex((x) => x.id === id), it = g.items[i]
    if (!it || it.disabled) return
    g.log.push({ type: 'remove', id })
    if (g.concept === 'A') {
      // A · Huella: la etiqueta no se va; deja su hueco con «Deshacer» en el mismo sitio, con el foco
      it.ghost = true; render(g); focusPart(g, id, 'undo')
      announce(fill(g.labels.removedUndo, it))
      return
    }
    const sameFacet = g.concept === 'B' && it.facet ? g.items.filter((x) => x.facet === it.facet).indexOf(it) : -1
    g.items.splice(i, 1); render(g)
    if (g.concept === 'B' && it.facet) {
      const rest = g.items.filter((x) => x.facet === it.facet)
      if (rest.length) { focusPart(g, rest[Math.min(sameFacet, rest.length - 1)].id, part); announce(fill(g.labels.removedIn, it)); return }
    }
    const alive = g.items.filter((x) => !x.ghost)
    const ni = Math.min(i, alive.length) // índice de la siguiente
    focusAfterRemove(g, ni, part)
    announce(fill(it.facet && g.concept === 'B' ? g.labels.removedIn : g.labels.removed, it))
  }
  function undo(g, id) {
    const it = g.items.find((x) => x.id === id); if (!it) return
    it.ghost = false; g.log.push({ type: 'undo', id }); render(g); focusPart(g, id, 'remove'); announce(fill(g.labels.restored, it))
  }
  // A: los huecos se recogen cuando el puntero ya no está en el grupo y el foco tampoco (nadie apunta a lo que se movería)
  function settle(g, force) {
    const ghosts = g.items.filter((x) => x.ghost)
    if (!ghosts.length) return
    if (g.root.contains(document.activeElement)) return
    if (!force && g.root.matches(':hover')) return
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    const lis = ghosts.map((x) => g.root.querySelector(`[data-id="${x.id}"]`)).filter(Boolean)
    const done = () => { g.items = g.items.filter((x) => !x.ghost); render(g); g.log.push({ type: 'settle', n: ghosts.length }) }
    if (reduce || !lis.length) return done()
    for (const li of lis) { li.style.inlineSize = li.offsetWidth + 'px'; li.offsetWidth; li.classList.add('is-collapsing') }
    setTimeout(done, parseFloat(getComputedStyle(lis[0]).transitionDuration) * 1000 + 30 || 150)
  }
  function clearAll(g) {
    const gone = g.items.filter((x) => x.removable && !x.disabled)
    g.cleared = g.items.map((x, i) => ({ ...x, i })).filter((x) => x.removable && !x.disabled)
    g.items = g.items.filter((x) => !(x.removable && !x.disabled))
    render(g); announce(fill(g.labels.cleared, { n: gone.length }))
    // «La acción contraria aparece donde actuaste»: el botón se vuelve «Deshacer» en su sitio, con el foco
    g.root.querySelector('[data-part="undo-all"]')?.focus()
  }
  function undoAll(g) {
    for (const x of g.cleared) g.items.splice(Math.min(x.i, g.items.length), 0, (({ i, ...r }) => r)(x))
    const n = g.cleared.length; g.cleared = null; render(g)
    g.root.querySelector('[data-part="clear"]')?.focus(); announce(`${n} etiquetas restauradas`)
  }

  function onClick(g, e) {
    const el = e.target.closest('[data-part]'); if (!el || el.disabled) return
    const id = el.closest('[data-id]')?.dataset.id
    const part = el.dataset.part
    if (part === 'remove') { if (g.arming === el) { g.arming = null; return } remove(g, id, 'remove') }
    else if (part === 'undo') undo(g, id)
    else if (part === 'more') { g.expanded = !g.expanded; render(g); g.root.querySelector('[data-part="more"]').focus() }
    else if (part === 'clear') clearAll(g)
    else if (part === 'undo-all') undoAll(g)
    else if (part === 'body' && el.getAttribute('aria-pressed') != null) {
      const it = g.items.find((x) => x.id === id); it.pressed = !it.pressed
      el.setAttribute('aria-pressed', it.pressed); el.closest('.t-tag').classList.toggle('is-pressed', it.pressed)
      if (g.concept === 'C') el.querySelector('.t-mark').innerHTML = markC(it)
      g.log.push({ type: 'toggle', id, pressed: it.pressed })
    } else if (part === 'body' && el.tagName === 'A' && el.getAttribute('href').startsWith('#')) { e.preventDefault(); g.log.push({ type: 'link', id }) }
  }
  function onKey(g, e) {
    // Supr / Retroceso sobre cualquier control de una etiqueta quitable = «Quitar» (atajo; el botón con nombre sigue siendo la vía principal)
    if (e.key !== 'Delete' && e.key !== 'Backspace') return
    const el = e.target.closest('[data-part="body"], [data-part="remove"]'); if (!el) return
    const li = el.closest('[data-id]'); const it = g.items.find((x) => x.id === li?.dataset.id)
    if (!it || !it.removable) return
    e.preventDefault(); remove(g, it.id, el.dataset.part)
  }

  window.Tag = { group, category, groups, announce }
  window.__tag = groups
})()
