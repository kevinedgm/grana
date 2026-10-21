// Prototipo de GGallery (kiwi r01): base, A · El recorrido, B · La tira, C · Se abre en su sitio, y el visor común. Solo laboratorio.
// ?c=base|A|B|C  &set=hotel|restaurante  &dir=rtl  &broken=1 (la 4.ª foto falla)  &one=1 (una sola foto)
(() => {
  const q = new URLSearchParams(location.search)
  const C = ['base', 'A', 'B', 'C'].includes(q.get('c')) ? q.get('c') : 'A'
  const SET = q.get('set') === 'restaurante' ? 'restaurante' : 'hotel'
  if (q.get('dir') === 'rtl') document.documentElement.dir = 'rtl'
  const RTL = () => getComputedStyle(document.documentElement).direction === 'rtl'
  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches
  const icon = (n) => window.lucide(n)

  // ---------- Datos que aporta la aplicación (alt, caption, grupo, proporción) ----------
  const SETS = {
    hotel: {
      title: 'Habitación Jardín', page: 'Casa Cantera · hotel boutique en el centro de Oaxaca',
      items: [
        ['habitacion', 3, 2, 'Cama king con sábanas de lino crudo y muro de adobe', 'Cama king, lino crudo de Teotitlán', 'Habitación'],
        ['cielo', 3, 4, 'Muro encalado con nicho y luz de la mañana', 'Luz de mañana en el nicho', 'Habitación'],
        ['noche', 3, 2, 'Lámparas de barro encendidas junto a la cama', 'Barro negro de San Bartolo Coyotepec', 'Habitación'],
        ['hierve', 3, 4, 'Regadera de piedra con agua caliente de manantial', 'Regadera de piedra volcánica', 'Baño'],
        ['mercado', 1, 1, 'Toallas y jabones artesanales sobre lavabo de talavera', 'Jabones de Tlacolula', 'Baño'],
        ['patio', 3, 2, 'Terraza privada con arcos de cantera verde al atardecer', 'Terraza privada, 18 m²', 'Terraza'],
        ['mezcal', 4, 5, 'Copa de mezcal de bienvenida sobre la mesa de la terraza', 'Mezcal de bienvenida', 'Terraza'],
        ['monte-alban', 16, 9, 'Vista a Monte Albán desde la terraza al amanecer', 'Monte Albán al amanecer', 'Vista'],
        ['papel-picado', 3, 2, 'Calle con papel picado frente a la entrada del hotel', 'La calle Macedonio Alcalá', 'Vista'],
        ['mole', 1, 1, 'Desayuno con mole negro, pan de yema y chocolate', 'Desayuno incluido', 'Desayuno'],
      ],
    },
    restaurante: {
      title: 'La carta', page: 'Comal · cocina oaxaqueña de temporada',
      items: [
        ['mole', 1, 1, 'Mole negro con pierna de pollo, ajonjolí y arroz', 'Mole negro · $320', 'Platos fuertes'],
        ['mercado', 1, 1, 'Tlayuda con asiento, quesillo y chapulines', 'Tlayuda de asiento · $240', 'Para empezar'],
        ['noche', 3, 2, 'Memelas con salsa de chile pasilla en comal de barro', 'Memelas · $160', 'Para empezar'],
        ['mezcal', 4, 5, 'Mezcal espadín servido en jícara con naranja y sal de gusano', 'Espadín de Santiago Matatlán · $120', 'Mezcales'],
        ['hierve', 3, 4, 'Agua de chilacayota con hielo en jarra de vidrio soplado', 'Agua de chilacayota · $60', 'Bebidas'],
        ['patio', 3, 2, 'Patio del restaurante con mesas bajo los arcos', 'El patio', 'El lugar'],
      ],
    },
  }
  const S = SETS[SET]
  let ITEMS = S.items.map(([key, aw, ah, alt, caption, group], i) => ({ i, key, aw, ah, alt, caption, group, src: window.foto(key, aw, ah) }))
  if (q.get('one') === '1') ITEMS = ITEMS.slice(0, 1)
  if (q.get('broken') === '1' && ITEMS[3]) ITEMS[3].src = 'data:image/png;base64,AAAA' // falla al cargar: estado de error
  const N = ITEMS.length
  const GROUPS = [...new Set(ITEMS.map((it) => it.group))].map((g) => ({ name: g, items: ITEMS.filter((it) => it.group === g) }))
  const groupOf = (i) => GROUPS.findIndex((g) => g.items.some((it) => it.i === i))
  const slug = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-')

  // Textos: el componente no trae textos propios (#226); aquí son las labels de la aplicación
  const L = {
    total: (n) => (n === 1 ? '1 foto' : `${n} fotos`), count: (i, n) => `${i} de ${n}`,
    prev: 'Foto anterior', next: 'Foto siguiente', close: 'Cerrar galería', zoomIn: 'Ampliar', zoomOut: 'Reducir',
    open: 'Ver en grande', first: 'Primera foto', last: 'Última foto', broken: 'No se pudo cargar esta foto', groups: 'Espacios',
    fullscreen: 'Pantalla completa', closeDetail: 'Cerrar detalle', viewer: (t) => `${t}, galería`,
  }
  const btn = (cls, name, label, extra = '') => `<button type="button" class="g-btn g-btn--variant-ghost g-btn--size-md g-btn--color-neutral g-btn--density-default g-btn--icon ${cls}" aria-label="${label}" ${extra}><span class="g-btn__label">${icon(name)}</span></button>`
  const textBtn = (cls, name, label, variant = 'outline') => `<button type="button" class="g-btn g-btn--variant-${variant} g-btn--size-md g-btn--color-neutral g-btn--density-default ${cls}"><span class="g-btn__prepend" aria-hidden="true">${icon(name)}</span><span class="g-btn__label">${label}</span></button>`
  const img = (it, eager) => `<img src="${it.src}" alt="${it.alt}" width="${it.aw * 100}" height="${it.ah * 100}" ${eager ? '' : 'loading="lazy"'} decoding="async">`
  const thumb = (it, tag = 'a', extra = '') => tag === 'a'
    ? `<a class="gal__thumb" href="${it.src}" data-i="${it.i}" aria-haspopup="dialog" ${extra}>${img(it, it.i < 4)}</a>`
    : `<button type="button" class="gal__thumb" data-i="${it.i}" ${extra}>${img(it, it.i < 4)}</button>`

  // ---------- Barra del laboratorio ----------
  const link = (k, v, label, cur) => { const u = new URLSearchParams(q); u.set(k, v); return `<a href="?${u}"${cur ? ' aria-current="true"' : ''}>${label}</a>` }
  document.getElementById('lab-concepts').innerHTML = ['base', 'A', 'B', 'C'].map((c) => link('c', c, { base: 'Base', A: 'A · El recorrido', B: 'B · La tira', C: 'C · En su sitio' }[c], c === C)).join(' ')
  document.getElementById('lab-opts').innerHTML = link('set', SET === 'hotel' ? 'restaurante' : 'hotel', SET === 'hotel' ? 'ver restaurante' : 'ver hotel', false) + ' ' + link('dir', RTL() ? 'ltr' : 'rtl', RTL() ? 'LTR' : 'RTL', false) + ' ' + link('broken', q.get('broken') === '1' ? '0' : '1', 'foto que falla', q.get('broken') === '1')

  // ---------- La galería por concepto ----------
  const head = (right = '') => `<div class="gal__head"><h2 class="gal__title" id="gal-title">${S.title}</h2><p class="gal__total">${L.total(N)}</p>${right}</div>`
  const root = document.getElementById('gal')
  root.className = 'gal gal--' + C.toLowerCase()
  root.setAttribute('aria-labelledby', 'gal-title')
  if (C === 'base') {
    root.innerHTML = head() + `<ul class="gal__grid" role="list">${ITEMS.map((it) => `<li>${thumb(it)}</li>`).join('')}</ul>`
  } else if (C === 'A') {
    root.innerHTML = head() +
      (GROUPS.length > 1 ? `<nav class="gal__index" aria-label="${L.groups}"><ul role="list">${GROUPS.map((g) => `<li><a href="#gal-g-${slug(g.name)}">${g.name} <span aria-hidden="true">${g.items.length}</span><span class="lab-sr">, ${L.total(g.items.length)}</span></a></li>`).join('')}</ul></nav>` : '') +
      `<div class="gal__groups">${GROUPS.map((g) => `<div class="gal__group" id="gal-g-${slug(g.name)}" role="group" aria-labelledby="gal-h-${slug(g.name)}"><h3 class="gal__group-title" id="gal-h-${slug(g.name)}">${g.name}<span>${L.total(g.items.length)}</span></h3><ul class="gal__mosaic" role="list">${g.items.map((it) => `<li>${thumb(it)}</li>`).join('')}</ul></div>`).join('')}</div>`
  } else if (C === 'B') {
    root.setAttribute('aria-roledescription', 'carrusel')
    root.innerHTML = head(`<div class="gal__ctrl">${btn('gal__prev', RTL() ? 'chevron-right' : 'chevron-left', L.prev, 'aria-controls="gal-strip"')}<output id="gal-out" aria-hidden="true">1 / ${N}</output>${btn('gal__next', RTL() ? 'chevron-left' : 'chevron-right', L.next, 'aria-controls="gal-strip"')}</div>`) +
      `<ul class="gal__strip" id="gal-strip" role="list">${ITEMS.map((it) => `<li class="gal__slide${it.i === 0 ? ' is-current' : ''}" role="group" aria-roledescription="diapositiva" aria-label="${L.count(it.i + 1, N)}" style="--_ar: ${it.aw} / ${it.ah}">${thumb(it, 'button', `aria-haspopup="dialog" tabindex="${it.i === 0 ? 0 : -1}"`)}<p class="gal__slide-cap" aria-hidden="true">${it.caption}</p></li>`).join('')}</ul>` +
      `<p class="lab-sr" id="gal-live" aria-live="polite" aria-atomic="true"></p>`
  } else {
    root.innerHTML = head() + `<ul class="gal__grid" role="list" id="gal-grid">${ITEMS.map((it) => `<li class="gal__cell">${thumb(it, 'button', 'aria-expanded="false" aria-controls="gal-detail"')}</li>`).join('')}</ul>`
  }
  root.querySelectorAll('img').forEach((im) => im.addEventListener('error', () => im.closest('.gal__thumb')?.classList.add('is-broken'), { once: true }))

  // ---------- El visor común (en el componente: GDialog / topModal; aquí <dialog> nativo) ----------
  const gv = document.createElement('dialog')
  gv.className = 'gv'
  gv.dataset.gZone = 'brand'
  gv.setAttribute('aria-label', L.viewer(S.title))
  gv.innerHTML = `
    <div class="gv__bar">
      <h2 class="gv__title" id="gv-title" aria-hidden="true">${S.title}</h2>
      <p class="gv__count" id="gv-count" aria-hidden="true"></p>
      ${btn('gv__zoom', 'zoom-in', L.zoomIn, 'aria-pressed="false"')}
      ${btn('gv__close', 'x', L.close)}
    </div>
    <div class="gv__stage"><img class="gv__img" alt="" draggable="false"><p class="gv__broken"><span>${icon('image')}</span><span class="gv__broken-text"></span></p></div>
    <p class="gv__caption" aria-hidden="true"></p>
    <div class="gv__nav">
      ${btn('gv__prev', RTL() ? 'chevron-right' : 'chevron-left', L.prev)}
      ${C === 'A' && GROUPS.length > 1 ? `<nav class="gv__groups" aria-label="${L.groups}">${GROUPS.map((g, k) => `<button type="button" data-g="${k}">${g.name}</button>`).join('')}</nav>` : ''}
      ${btn('gv__next', RTL() ? 'chevron-left' : 'chevron-right', L.next, 'autofocus')}
    </div>
    <p class="lab-sr gv__live" aria-live="polite" aria-atomic="true"></p>`
  document.body.append(gv)
  const $ = (s) => gv.querySelector(s)
  const stage = $('.gv__stage'), gimg = $('.gv__img'), live = $('.gv__live')
  let cur = 0, opener = null, zoomed = false

  const describe = (i) => {
    const it = ITEMS[i]
    if (C === 'A' && GROUPS.length > 1) { const g = GROUPS[groupOf(i)]; const k = g.items.indexOf(it) + 1; return `${g.name}, ${L.count(k, g.items.length)}. ${it.alt}.` }
    return `${L.count(i + 1, N)}. ${it.alt}.`
  }
  const setZoom = (on, x = 0.5, y = 0.5) => {
    zoomed = on
    stage.classList.toggle('is-zoomed', on)
    const z = $('.gv__zoom')
    z.setAttribute('aria-pressed', String(on)); z.setAttribute('aria-label', on ? L.zoomOut : L.zoomIn)
    z.querySelector('.g-btn__label').innerHTML = icon(on ? 'zoom-out' : 'zoom-in')
    if (on) requestAnimationFrame(() => { stage.scrollLeft = (stage.scrollWidth - stage.clientWidth) * (RTL() ? x - 1 : x); stage.scrollTop = (stage.scrollHeight - stage.clientHeight) * y })
  }
  const show = (i, from = 0, announce = true) => {
    cur = Math.max(0, Math.min(N - 1, i))
    const it = ITEMS[cur]
    if (zoomed) setZoom(false)
    stage.classList.remove('is-broken')
    gimg.classList.remove('is-moving', 'is-from-next', 'is-from-prev')
    if (from) gimg.classList.add(from > 0 ? 'is-from-next' : 'is-from-prev')
    gimg.onerror = () => { stage.classList.add('is-broken'); $('.gv__broken-text').textContent = `${L.broken}: ${it.alt}` }
    gimg.src = it.src
    gimg.alt = it.alt
    gimg.width = it.aw * 100; gimg.height = it.ah * 100
    if (from) requestAnimationFrame(() => requestAnimationFrame(() => { gimg.classList.add('is-moving'); gimg.classList.remove('is-from-next', 'is-from-prev') }))
    $('.gv__caption').textContent = it.caption
    const g = groupOf(cur)
    $('.gv__count').textContent = C === 'A' && GROUPS.length > 1 ? `${GROUPS[g].name} · ${L.count(GROUPS[g].items.indexOf(it) + 1, GROUPS[g].items.length)}` : L.count(cur + 1, N)
    gv.querySelectorAll('.gv__groups button').forEach((b) => { const on = Number(b.dataset.g) === g; b.setAttribute('aria-current', String(on)); if (on) { const nav = b.parentElement, br = b.getBoundingClientRect(), nr = nav.getBoundingClientRect(); if (br.left < nr.left || br.right > nr.right) nav.scrollBy({ left: br.left < nr.left ? br.left - nr.left : br.right - nr.right, behavior: 'instant' }) } })
    const prev = $('.gv__prev'), next = $('.gv__next')
    prev.setAttribute('aria-disabled', String(cur === 0)); next.setAttribute('aria-disabled', String(cur === N - 1))
    prev.hidden = next.hidden = N === 1
    $('.gv__zoom').hidden = false
    if (ITEMS[cur + 1]) new Image().src = ITEMS[cur + 1].src // precarga solo la vecina
    if (announce) live.textContent = describe(cur) + (cur === N - 1 && from > 0 ? ` ${L.last}.` : '')
    syncHost()
  }
  const go = (d) => {
    const t = cur + d
    if (t < 0 || t > N - 1) { live.textContent = (t < 0 ? L.first : L.last) + '.'; return }
    show(t, d)
  }
  const open = (i, from) => {
    opener = from || null
    gv.showModal()
    show(i, 0, false)
    // Anuncio de llegada: el nombre del diálogo + la foto (el foco va a «siguiente», que no dice qué se ve)
    live.textContent = ''
    setTimeout(() => { live.textContent = describe(cur) }, 60)
    if (N === 1) $('.gv__close').focus()
  }
  gv.addEventListener('close', () => {
    if (zoomed) setZoom(false)
    // El foco vuelve a la miniatura de la foto que se estaba viendo (no a la que abrió)
    const back = returnTarget()
    if (back) { back.focus({ preventScroll: true }); back.scrollIntoView({ block: 'nearest', inline: 'nearest' }) }
  })
  gv.addEventListener('cancel', (e) => { if (zoomed) { e.preventDefault(); setZoom(false) } }) // Esc escalonado: primero reduce
  $('.gv__close').addEventListener('click', () => gv.close())
  $('.gv__prev').addEventListener('click', () => go(-1))
  $('.gv__next').addEventListener('click', () => go(1))
  $('.gv__zoom').addEventListener('click', () => setZoom(!zoomed))
  gv.querySelectorAll('.gv__groups button').forEach((b) => b.addEventListener('click', () => { const g = GROUPS[Number(b.dataset.g)]; show(g.items[0].i, Math.sign(g.items[0].i - cur)) }))
  gv.addEventListener('keydown', (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return
    const fwd = RTL() ? 'ArrowLeft' : 'ArrowRight', back = RTL() ? 'ArrowRight' : 'ArrowLeft'
    if (zoomed && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return // ampliada: las flechas recorren la foto (desplazamiento nativo)
    if (e.key === fwd) { e.preventDefault(); go(1) }
    else if (e.key === back) { e.preventDefault(); go(-1) }
    else if (e.key === 'Home') { e.preventDefault(); if (cur !== 0) show(0, -1) }
    else if (e.key === 'End') { e.preventDefault(); if (cur !== N - 1) show(N - 1, 1) }
    else if (C === 'A' && (e.key === 'PageDown' || e.key === 'PageUp')) { e.preventDefault(); const g = groupOf(cur) + (e.key === 'PageDown' ? 1 : -1); if (GROUPS[g]) show(GROUPS[g].items[0].i, Math.sign(g - groupOf(cur))) }
    else if (e.key === '+' || e.key === '=') { e.preventDefault(); if (!zoomed) setZoom(true) }
    else if (e.key === '-') { e.preventDefault(); if (zoomed) setZoom(false) }
  })
  // Gesto: deslizar en horizontal pasa de foto; hacia abajo cierra; doble toque o doble clic amplía
  let p0 = null
  stage.addEventListener('pointerdown', (e) => { if (zoomed || e.button > 0) return; p0 = { x: e.clientX, y: e.clientY, id: e.pointerId, t: performance.now() }; stage.setPointerCapture(e.pointerId) })
  stage.addEventListener('pointermove', (e) => {
    if (!p0 || e.pointerId !== p0.id || reduce()) return
    const dx = e.clientX - p0.x, dy = e.clientY - p0.y
    if (Math.abs(dx) >= Math.abs(dy)) { gimg.style.setProperty('--_drag', dx + 'px'); gimg.style.removeProperty('--_drag-y') } else if (dy > 0) gimg.style.setProperty('--_drag-y', dy + 'px')
  })
  const end = (e) => {
    if (!p0 || e.pointerId !== p0.id) return
    const dx = e.clientX - p0.x, dy = e.clientY - p0.y, w = stage.clientWidth, h = stage.clientHeight, fast = performance.now() - p0.t < 250
    gimg.style.removeProperty('--_drag'); gimg.style.removeProperty('--_drag-y')
    p0 = null
    if (Math.abs(dx) > Math.abs(dy) && (Math.abs(dx) > w * 0.18 || (fast && Math.abs(dx) > 40))) go((dx < 0) !== RTL() ? 1 : -1)
    else if (dy > h * 0.22 && dy > Math.abs(dx)) gv.close()
  }
  stage.addEventListener('pointerup', end)
  stage.addEventListener('dragstart', (e) => e.preventDefault())
  stage.addEventListener('pointercancel', (e) => { p0 = null; gimg.style.removeProperty('--_drag'); gimg.style.removeProperty('--_drag-y') })
  stage.addEventListener('dblclick', (e) => { const r = gimg.getBoundingClientRect(); setZoom(!zoomed, (e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height) })

  // ---------- Enlace galería ↔ visor por concepto ----------
  const thumbs = () => [...root.querySelectorAll('.gal__thumb')]
  const thumbAt = (i) => root.querySelector(`.gal__thumb[data-i="${i}"]`)
  let returnTarget = () => thumbAt(cur)
  let syncHost = () => {}
  if (C === 'base' || C === 'A') {
    thumbs().forEach((t) => t.addEventListener('click', (e) => { if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return; e.preventDefault(); open(Number(t.dataset.i), t) }))
  }
  if (C === 'B') {
    const strip = root.querySelector('.gal__strip'), out = root.querySelector('#gal-out'), glive = root.querySelector('#gal-live')
    // Mientras la tira va hacia una foto pedida (botón, flecha, visor), el desplazamiento no recalcula «la actual» hasta llegar
    let at = 0, target = null, guard = 0
    const steer = () => { target = at; clearTimeout(guard); guard = setTimeout(() => { target = null }, 1500) }
    const arrived = () => { const sr = strip.getBoundingClientRect(), r = thumbAt(target).closest('.gal__slide').getBoundingClientRect(); const max = strip.scrollWidth - strip.clientWidth; return Math.abs((RTL() ? r.right - sr.right : r.left - sr.left)) < 2 || Math.abs(Math.abs(strip.scrollLeft) - max) < 2 }
    strip.addEventListener('scrollend', () => { if (target !== null) { if (arrived()) target = null; return } sync() })
    const setAt = (i, { scroll = false, focus = false, announce = false } = {}) => {
      at = Math.max(0, Math.min(N - 1, i))
      root.querySelectorAll('.gal__slide').forEach((s, k) => { s.classList.toggle('is-current', k === at); s.querySelector('.gal__thumb').tabIndex = k === at ? 0 : -1 })
      out.textContent = `${at + 1} / ${N}`
      root.querySelector('.gal__prev').setAttribute('aria-disabled', String(at === 0))
      root.querySelector('.gal__next').setAttribute('aria-disabled', String(at === N - 1))
      const s = thumbAt(at).closest('.gal__slide')
      if (scroll) { steer(); s.scrollIntoView({ behavior: reduce() ? 'instant' : 'smooth', block: 'nearest', inline: 'start' }) }
      if (focus) thumbAt(at).focus({ preventScroll: true })
      if (announce) glive.textContent = `${L.count(at + 1, N)}. ${ITEMS[at].alt}.`
    }
    setAt(0)
    const step = (d) => { if (at + d < 0 || at + d > N - 1) { glive.textContent = (d < 0 ? L.first : L.last) + '.'; return } setAt(at + d, { scroll: true, announce: true }) }
    root.querySelector('.gal__prev').addEventListener('click', () => step(-1))
    root.querySelector('.gal__next').addEventListener('click', () => step(1))
    strip.addEventListener('keydown', (e) => {
      const fwd = RTL() ? 'ArrowLeft' : 'ArrowRight', back = RTL() ? 'ArrowRight' : 'ArrowLeft'
      let t = null
      if (e.key === fwd) t = at + 1; else if (e.key === back) t = at - 1; else if (e.key === 'Home') t = 0; else if (e.key === 'End') t = N - 1
      if (t === null) return
      e.preventDefault()
      if (t < 0 || t > N - 1) return
      setAt(t, { scroll: true, focus: true })
    })
    // El desplazamiento táctil o con rueda mueve «la actual» sin anunciar (lo pidió la persona y lo está viendo)
    let tick = 0
    const sync = () => {
      const sr = strip.getBoundingClientRect(), edge = RTL() ? sr.right : sr.left
      const cr = thumbAt(at).closest('.gal__slide').getBoundingClientRect()
      if (cr.left >= sr.left - 1 && cr.right <= sr.right + 1 && Math.abs(strip.scrollLeft) > 1) return // la actual sigue entera a la vista: no cambia
      let best = 0, d = Infinity
      root.querySelectorAll('.gal__slide').forEach((s, k) => { const r = s.getBoundingClientRect(); const dd = Math.abs((RTL() ? r.right : r.left) - edge); if (dd < d) { d = dd; best = k } })
      if (best !== at) setAt(best)
    }
    strip.addEventListener('scroll', () => { if (target !== null) { if (arrived()) target = null; return } cancelAnimationFrame(tick); tick = requestAnimationFrame(sync) }, { passive: true })
    thumbs().forEach((t) => t.addEventListener('click', () => { setAt(Number(t.dataset.i)); open(Number(t.dataset.i), t) }))
    // Un estado, dos profundidades: lo que se recorre en el visor deja la tira en esa foto
    syncHost = () => { if (gv.open) setAt(cur) }
    returnTarget = () => { setAt(cur, { scroll: true }); return thumbAt(cur) }
  }
  if (C === 'C') {
    const grid = root.querySelector('#gal-grid')
    const row = document.createElement('li')
    row.className = 'gal__detail-row'
    row.innerHTML = `<div class="gal__detail" id="gal-detail" role="region" tabindex="-1" aria-labelledby="gal-detail-title">
        <img alt="">
        <div class="gal__detail-side">
          <h3 class="gal__detail-title" id="gal-detail-title"></h3>
          <p class="gal__detail-text"></p>
          <p class="gal__detail-count"></p>
          <div class="gal__detail-actions">
            ${btn('gal__dprev', RTL() ? 'chevron-right' : 'chevron-left', L.prev)}${btn('gal__dnext', RTL() ? 'chevron-left' : 'chevron-right', L.next)}
            ${textBtn('gal__dfull', 'maximize-2', L.fullscreen)}
            ${btn('gal__dclose', 'x', L.closeDetail)}
          </div>
          <p class="lab-sr" id="gal-dlive" aria-live="polite" aria-atomic="true"></p>
        </div></div>`
    const panel = row.querySelector('.gal__detail'), dlive = row.querySelector('#gal-dlive')
    let at = -1
    const lastInRow = (i) => { const cells = [...grid.querySelectorAll('.gal__cell')]; const top = cells[i].offsetTop; let k = i; while (cells[k + 1] && cells[k + 1].offsetTop === top) k++; return cells[k] }
    const place = (i, { focusPanel = false, announce = false } = {}) => {
      at = i
      const it = ITEMS[i]
      thumbs().forEach((t) => t.setAttribute('aria-expanded', String(Number(t.dataset.i) === i)))
      row.remove()
      lastInRow(i).after(row)
      const im = panel.querySelector('img'); im.src = it.src; im.alt = it.alt
      panel.querySelector('.gal__detail-title').textContent = it.caption
      panel.querySelector('.gal__detail-text').textContent = it.alt
      panel.querySelector('.gal__detail-count').textContent = L.count(i + 1, N)
      panel.querySelector('.gal__dprev').setAttribute('aria-disabled', String(i === 0))
      panel.querySelector('.gal__dnext').setAttribute('aria-disabled', String(i === N - 1))
      if (focusPanel) panel.focus({ preventScroll: true })
      panel.scrollIntoView({ block: 'nearest', behavior: reduce() ? 'instant' : 'smooth' })
      if (announce) dlive.textContent = `${L.count(i + 1, N)}. ${it.caption}.`
    }
    const closeDetail = () => { const back = thumbAt(at); row.remove(); thumbs().forEach((t) => t.setAttribute('aria-expanded', 'false')); at = -1; back?.focus() }
    thumbs().forEach((t) => t.addEventListener('click', () => { const i = Number(t.dataset.i); if (i === at) closeDetail(); else place(i, { focusPanel: true }) }))
    const stepD = (d) => { if (at + d < 0 || at + d > N - 1) { dlive.textContent = (d < 0 ? L.first : L.last) + '.'; return } const keep = document.activeElement; place(at + d, { announce: true }); keep?.focus({ preventScroll: true }) }
    row.querySelector('.gal__dprev').addEventListener('click', () => stepD(-1))
    row.querySelector('.gal__dnext').addEventListener('click', () => stepD(1))
    row.querySelector('.gal__dclose').addEventListener('click', closeDetail)
    row.querySelector('.gal__dfull').addEventListener('click', () => open(at, row.querySelector('.gal__dfull')))
    panel.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { e.preventDefault(); closeDetail(); return }
      if (e.target.closest('button') && !['ArrowLeft', 'ArrowRight'].includes(e.key)) return
      const fwd = RTL() ? 'ArrowLeft' : 'ArrowRight', back = RTL() ? 'ArrowRight' : 'ArrowLeft'
      if (e.key === fwd) { e.preventDefault(); stepD(1) } else if (e.key === back) { e.preventDefault(); stepD(-1) }
    })
    // Al volver del visor, el panel queda en la foto donde se cerró y el foco en «Pantalla completa»
    syncHost = () => {}
    returnTarget = () => { if (at !== cur) place(cur); return row.querySelector('.gal__dfull') }
    // Al cambiar el ancho, el panel se recoloca tras la fila de su miniatura
    new ResizeObserver(() => { if (at >= 0 && row.isConnected) { const keep = document.activeElement; row.remove(); lastInRow(at).after(row); if (keep && row.contains(keep)) keep.focus({ preventScroll: true }) } }).observe(grid)
  }

  document.title = `Galería · ${({ base: 'base', A: 'A · El recorrido', B: 'B · La tira', C: 'C · En su sitio' })[C]} · r01`
  window.__gal = { ready: true, C, N, open, get cur () { return cur }, groups: GROUPS.length }
})()
