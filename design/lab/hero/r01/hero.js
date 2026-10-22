// Prototipo del héroe de marketing (kiwi r01). Solo laboratorio: monta la base o el concepto pedido.
// ?c=base|A|B|C  &tpl=hotel|restaurante|tour  &theme=minimal|rustico|lujo  &motion=1  &photo=<clave>  &dir=rtl
(() => {
  const q = new URLSearchParams(location.search)
  const C = ['base', 'A', 'B', 'C'].includes(q.get('c')) ? q.get('c') : 'A'
  const TPL = ['hotel', 'restaurante', 'tour'].includes(q.get('tpl')) ? q.get('tpl') : 'hotel'
  const THEME = ['minimal', 'rustico', 'lujo'].includes(q.get('theme')) ? q.get('theme') : 'minimal'
  const MOTION = q.get('motion') === '1'
  const root = document.documentElement
  root.dataset.theme = THEME === 'minimal' ? 'light' : 'light'
  root.dataset.lab = THEME
  if (q.get('dir') === 'rtl') root.dir = 'rtl'
  const icon = (n) => window.lucide(n)
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches

  // ---------- Barra de laboratorio (de la aplicación) ----------
  const link = (k, v, label, cur) => { const u = new URLSearchParams(q); u.set(k, v); return `<a href="?${u}"${cur ? ' aria-current="true"' : ''}>${label}</a>` }
  document.getElementById('lab-concepts').innerHTML = ['base', 'A', 'B', 'C'].map((c) => link('c', c, { base: 'Base', A: 'A · La ventana', B: 'B · Vistas a elegir', C: 'C · El umbral' }[c], c === C)).join('')
  document.getElementById('lab-tpl').innerHTML = ['hotel', 'restaurante', 'tour'].map((t) => link('tpl', t, { hotel: 'Hotel', restaurante: 'Restaurante', tour: 'Tour' }[t], t === TPL)).join('')
  document.getElementById('lab-theme').innerHTML = ['minimal', 'rustico', 'lujo'].map((t) => link('theme', t, { minimal: 'Minimalista (por defecto)', rustico: 'Rústico', lujo: 'Lujo' }[t], t === THEME)).join('')
  document.getElementById('lab-extra').innerHTML = link('motion', MOTION ? '0' : '1', 'foto en movimiento', MOTION) + link('dir', q.get('dir') === 'rtl' ? 'ltr' : 'rtl', 'RTL', q.get('dir') === 'rtl') + link('photo', 'cielo', 'foto clara extrema', q.get('photo') === 'cielo') + link('photo', 'noche', 'foto oscura extrema', q.get('photo') === 'noche')

  // ---------- Contenido de la plantilla (lo aporta la aplicación) ----------
  const T = {
    hotel: { site: 'Casa Cantera', eyebrow: 'Hotel boutique · Centro histórico de Oaxaca', title: 'Casa Cantera', lead: 'Doce habitaciones alrededor de un patio de cantera verde, a dos calles de Santo Domingo.', cta: 'Reservar estancia', sec: 'Ver habitaciones', aside: 'Desayuno oaxaqueño incluido · Llegada desde las 15:00', photos: [['patio', 'Patio'], ['habitacion', 'Habitación'], ['noche', 'Terraza de noche']], detail: 'mezcal', ask: ['Llegada', 'Noches', 'Huéspedes'], vals: ['vie 13 nov', '2 noches', '2 adultos'] },
    restaurante: { site: 'Comal de Barro', eyebrow: 'Cocina oaxaqueña de temporada · Jalatlaco', title: 'Comal de Barro', lead: 'Moles de la casa y maíz nixtamalizado cada mañana. Mesa para hoy desde las 13:00.', cta: 'Reservar mesa', sec: 'Ver la carta', aside: 'Martes a domingo · 13:00 a 22:30', photos: [['mole', 'Mole negro'], ['mezcal', 'Barra de mezcal'], ['mercado', 'Del mercado']], detail: 'mezcal', ask: ['Día', 'Hora', 'Personas'], vals: ['hoy', '20:30', '4 personas'] },
    tour: { site: 'Valles a Pie', eyebrow: 'Recorridos de un día desde Oaxaca', title: 'Valles Centrales a pie', lead: 'Monte Albán, Hierve el Agua y un palenque familiar, en grupos de ocho como máximo.', cta: 'Elegir fecha', sec: 'Ver itinerario', aside: 'Salida 8:00 desde el zócalo · 9 horas', photos: [['monte-alban', 'Monte Albán'], ['hierve', 'Hierve el Agua'], ['mercado', 'Mercado de Tlacolula']], detail: 'hierve', ask: ['Fecha', 'Recorrido', 'Personas'], vals: ['sáb 14 nov', 'Valles Centrales', '2 personas'] },
  }[TPL]
  if (q.get('photo')) T.photos = [[q.get('photo'), 'Caso extremo'], ...T.photos.slice(1)]
  document.getElementById('site-brand').textContent = T.site

  // ---------- Piezas del héroe ----------
  const btn = (label, variant, extra = '') => `<a href="#main" class="g-btn g-btn--variant-${variant} g-btn--size-lg g-btn--color-brand g-btn--density-default"${extra}><span class="g-btn__label">${label}</span></a>`
  const content = (opts = {}) => `
    <div class="hero__content" id="content">
      <p class="hero__eyebrow" id="eyebrow">${T.eyebrow}</p>
      <h1 class="hero__title" id="title" dir="auto">${T.title}</h1>
      <p class="hero__lead" id="lead">${T.lead}</p>
      ${opts.slot || ''}
      <div class="hero__actions" id="actions">${btn(T.cta, 'solid', ' id="cta"')}${btn(T.sec, opts.secVariant || 'outline', ' id="sec"')}</div>
      <p class="hero__aside" id="aside">${T.aside}</p>
    </div>`
  const img = (key, aw, ah, extra = '') => `<img class="hero__img" id="img" src="${window.foto(key, aw, ah)}" alt="${window.fotoAlt(key)}" width="${aw * 400}" height="${ah * 400}" loading="eager" fetchpriority="high" decoding="async"${extra}>`
  const motionBtn = () => MOTION ? `<button type="button" class="hero__motion" id="motion" aria-pressed="false">${icon('pause')}<span class="hero__motion-text">Pausar movimiento</span></button>` : ''
  const credit = `<figcaption class="hero__credit" id="credit">Foto: archivo de la casa</figcaption>`

  let html = ''
  if (C === 'base') {
    html = `<section class="hero hero--base${MOTION ? ' has-motion' : ''}" id="hero" aria-labelledby="title">
      ${content()}
      <figure class="hero__media" id="media">${img(T.photos[0][0], 4, 3)}${motionBtn()}${credit}</figure>
    </section>`
  } else if (C === 'A') {
    html = `<section class="hero hero--window${MOTION ? ' has-motion' : ''}" id="hero" aria-labelledby="title">
      ${content({ secVariant: 'link' })}
      <figure class="hero__media hero__window" id="media">
        <div class="hero__frame" id="frame">${img(T.photos[0][0], 4, 5)}</div>
        <div class="hero__frame hero__frame--detail" id="detail" aria-hidden="true"><img class="hero__img" src="${window.foto(T.detail, 1, 1)}" alt="" width="400" height="400" loading="eager" decoding="async"></div>
        ${motionBtn()}${credit}
      </figure>
    </section>`
  } else if (C === 'B') {
    const views = T.photos.map(([k, name], i) => `<label class="hero__view"><input type="radio" name="view" value="${k}" ${i === 0 ? 'checked' : ''}><span class="hero__view-thumb" aria-hidden="true"><img src="${window.foto(k, 4, 3)}" alt="" width="160" height="120" loading="eager" decoding="async"></span><span class="hero__view-name">${name}</span></label>`).join('')
    html = `<section class="hero hero--views${MOTION ? ' has-motion' : ''}" id="hero" aria-labelledby="title">
      <figure class="hero__media hero__stage" id="media">
        ${T.photos.map(([k], i) => `<img class="hero__img hero__layer${i === 0 ? ' is-current' : ''}" ${i === 0 ? 'id="img"' : ''} data-key="${k}" src="${window.foto(k, 16, 9)}" alt="${i === 0 ? window.fotoAlt(k) : ''}" ${i === 0 ? '' : 'aria-hidden="true"'} width="1600" height="900" loading="eager" ${i === 0 ? 'fetchpriority="high"' : ''} decoding="async">`).join('')}
        ${motionBtn()}${credit}
      </figure>
      <div class="hero__placard" id="plate" data-g-zone="brand">
        ${content({ secVariant: 'outline' })}
        <fieldset class="hero__views" id="views"><legend class="hero__views-legend">Vistas</legend>${views}</fieldset>
      </div>
    </section>`
  } else {
    const ask = T.ask.map((a, i) => `<button type="button" class="hero__ask" aria-haspopup="dialog"><span class="hero__ask-label">${a}</span><span class="hero__ask-value">${T.vals[i]}</span></button>`).join('')
    html = `<section class="hero hero--threshold${MOTION ? ' has-motion' : ''}" id="hero" aria-labelledby="title">
      <figure class="hero__media hero__band" id="media">${img(T.photos[0][0], 16, 7)}${motionBtn()}${credit}</figure>
      <div class="hero__card" id="plate">
        ${content({ secVariant: 'link', slot: `<div class="hero__slot" id="slot" role="group" aria-label="Consulta rápida (hueco: GBookingBar)">${ask}</div>` })}
      </div>
    </section>`
  }
  document.getElementById('hero-slot').innerHTML = html
  document.querySelectorAll('[data-icon]').forEach((el) => el.insertAdjacentHTML('afterbegin', icon(el.dataset.icon)))

  // ---------- Comportamiento ----------
  // Movimiento de la foto (marcador de un vídeo de fondo): pausa visible siempre (WCAG 2.2.2); con movimiento reducido arranca en pausa.
  const motion = document.getElementById('motion')
  const hero = document.getElementById('hero')
  const setPaused = (p) => {
    hero.classList.toggle('is-paused', p)
    if (!motion) return
    motion.setAttribute('aria-pressed', String(p))
    motion.querySelector('.hero__motion-text').textContent = p ? 'Reanudar movimiento' : 'Pausar movimiento'
    motion.querySelector('svg').outerHTML = icon(p ? 'play' : 'pause')
  }
  if (motion) {
    setPaused(reduced)
    motion.addEventListener('click', () => setPaused(!hero.classList.contains('is-paused')))
  }

  // B: la persona elige la vista; nunca cambia sola. La foto que entra lleva el alt; las demás quedan ocultas al árbol.
  if (C === 'B') {
    // WebKit no aplica :focus-visible al mover con flechas entre radios: modalidad del foco como utils/keyFocus.js (#441, #450)
    const views = document.getElementById('views')
    views.addEventListener('keydown', () => { views.dataset.keyFocus = '' })
    views.addEventListener('pointerdown', () => { delete views.dataset.keyFocus })
    views.addEventListener('change', (e) => {
      const key = e.target.value
      document.querySelectorAll('.hero__layer').forEach((el) => {
        const on = el.dataset.key === key
        el.classList.toggle('is-current', on)
        el.alt = on ? window.fotoAlt(key) : ''
        if (on) { el.removeAttribute('aria-hidden'); el.id = 'img' } else { el.setAttribute('aria-hidden', 'true'); el.removeAttribute('id') }
      })
    })
  }
  window.__hero = { ready: true, C, TPL, THEME }
})()
