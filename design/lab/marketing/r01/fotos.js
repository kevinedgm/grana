// Marcadores de fotografía locales para las rondas de marketing de kiwi (r01). Solo laboratorio.
// Sin recursos externos: cada «foto» es un SVG generado aquí y servido como data URI.
// Los colores son CONTENIDO (simulan la foto que aporta la aplicación), no tema: por eso hay literales.
// Uso: window.foto('patio', 16, 9) → 'data:image/svg+xml,…'  ·  window.FOTOS → lista de claves con su descripción.
// Incluye casos extremos para medir el velo del texto: 'cielo' (casi blanca) y 'noche' (casi negra) y 'papel-picado' (muy contrastada).
(() => {
  const F = {
    patio:        { alt: 'Patio con arcos de cantera verde al atardecer', sky: ['#F2C38B', '#E9946A'], ground: ['#5E6B4A', '#3E4A33'], sun: '#FFE7B8', shape: 'arcos' },
    habitacion:   { alt: 'Habitación con cama de lino y muro de adobe', sky: ['#EADBC8', '#D7BFA3'], ground: ['#8C6A4F', '#6E4F3A'], sun: '#FFF4E0', shape: 'cama' },
    mezcal:       { alt: 'Copa de mezcal sobre barra de madera oscura', sky: ['#2A1E1A', '#1A1310'], ground: ['#4A2F22', '#2C1B14'], sun: '#C98B4A', shape: 'copa' },
    mole:         { alt: 'Plato de mole negro con ajonjolí', sky: ['#3B2A22', '#22160F'], ground: ['#7A3B22', '#4C2213'], sun: '#E8C9A0', shape: 'plato' },
    'monte-alban':{ alt: 'Monte Albán al amanecer con el valle al fondo', sky: ['#9CC3D9', '#F3D2A8'], ground: ['#7E8C5A', '#59663D'], sun: '#FFF1C9', shape: 'piramide' },
    mercado:      { alt: 'Mercado con canastas de chiles y flores', sky: ['#E4572E', '#F2A541'], ground: ['#2E86AB', '#1B5E7A'], sun: '#F6E27F', shape: 'canastas' },
    hierve:       { alt: 'Cascadas petrificadas de Hierve el Agua', sky: ['#A8D5E2', '#E8F1F2'], ground: ['#C9B79C', '#A68A64'], sun: '#FFFFFF', shape: 'cascada' },
    cielo:        { alt: 'Cielo despejado sobre muros encalados (caso claro extremo)', sky: ['#FBFAF7', '#F1ECE2'], ground: ['#E9E2D3', '#DCD2BF'], sun: '#FFFFFF', shape: 'muro' },
    noche:        { alt: 'Terraza de noche con faroles (caso oscuro extremo)', sky: ['#0E1116', '#1A1F29'], ground: ['#0A0C10', '#14171D'], sun: '#F5C66B', shape: 'faroles' },
    'papel-picado': { alt: 'Papel picado de colores sobre una calle (caso de contraste alto)', sky: ['#FFFFFF', '#FFFFFF'], ground: ['#111111', '#111111'], sun: '#FF2D55', shape: 'picado' },
  }
  const shapes = {
    arcos: (w, h, c) => [0.18, 0.5, 0.82].map((x) => `<path d="M${w * x - w * 0.11} ${h} V${h * 0.55} a${w * 0.11} ${w * 0.11} 0 0 1 ${w * 0.22} 0 V${h}" fill="${c.sky[0]}" opacity=".55"/>`).join('') + `<rect x="0" y="${h * 0.42}" width="${w}" height="${h * 0.06}" fill="${c.ground[1]}" opacity=".6"/>`,
    cama: (w, h, c) => `<rect x="${w * 0.15}" y="${h * 0.58}" width="${w * 0.7}" height="${h * 0.22}" rx="${h * 0.03}" fill="#F7F1E8"/><rect x="${w * 0.15}" y="${h * 0.5}" width="${w * 0.7}" height="${h * 0.1}" rx="${h * 0.03}" fill="${c.ground[0]}"/><rect x="${w * 0.66}" y="${h * 0.16}" width="${w * 0.14}" height="${h * 0.24}" fill="${c.sun}" opacity=".7"/>`,
    copa: (w, h, c) => `<ellipse cx="${w * 0.5}" cy="${h * 0.48}" rx="${w * 0.09}" ry="${h * 0.05}" fill="${c.sun}" opacity=".9"/><path d="M${w * 0.41} ${h * 0.48} Q${w * 0.5} ${h * 0.8} ${w * 0.59} ${h * 0.48}" fill="${c.sun}" opacity=".55"/><rect x="0" y="${h * 0.78}" width="${w}" height="${h * 0.22}" fill="${c.ground[0]}"/>`,
    plato: (w, h, c) => `<ellipse cx="${w * 0.5}" cy="${h * 0.6}" rx="${w * 0.3}" ry="${h * 0.2}" fill="#EFE6D8"/><ellipse cx="${w * 0.5}" cy="${h * 0.6}" rx="${w * 0.2}" ry="${h * 0.12}" fill="#2B1710"/><circle cx="${w * 0.47}" cy="${h * 0.58}" r="${h * 0.012}" fill="${c.sun}"/><circle cx="${w * 0.53}" cy="${h * 0.62}" r="${h * 0.012}" fill="${c.sun}"/>`,
    piramide: (w, h, c) => `<path d="M${w * 0.2} ${h * 0.72} L${w * 0.35} ${h * 0.45} H${w * 0.6} L${w * 0.75} ${h * 0.72} Z" fill="#B59E7A"/><path d="M${w * 0.3} ${h * 0.55} H${w * 0.65}" stroke="#8E7856" stroke-width="${h * 0.01}"/>`,
    canastas: (w, h, c) => [0.15, 0.38, 0.62, 0.85].map((x, i) => `<ellipse cx="${w * x}" cy="${h * 0.7}" rx="${w * 0.1}" ry="${h * 0.12}" fill="${['#C0392B', '#F39C12', '#8E44AD', '#27AE60'][i]}"/>`).join(''),
    cascada: (w, h, c) => `<path d="M${w * 0.3} ${h * 0.35} C${w * 0.32} ${h * 0.6} ${w * 0.28} ${h * 0.8} ${w * 0.3} ${h} H${w * 0.55} C${w * 0.52} ${h * 0.75} ${w * 0.56} ${h * 0.55} ${w * 0.5} ${h * 0.35} Z" fill="#F4F1EA"/>`,
    muro: (w, h, c) => `<rect x="${w * 0.1}" y="${h * 0.3}" width="${w * 0.8}" height="${h * 0.7}" fill="#FFFFFF"/><rect x="${w * 0.44}" y="${h * 0.55}" width="${w * 0.12}" height="${h * 0.45}" fill="#EDE6D9"/>`,
    faroles: (w, h, c) => [0.2, 0.4, 0.6, 0.8].map((x) => `<circle cx="${w * x}" cy="${h * 0.3}" r="${h * 0.035}" fill="${c.sun}"/><circle cx="${w * x}" cy="${h * 0.3}" r="${h * 0.09}" fill="${c.sun}" opacity=".12"/>`).join(''),
    picado: (w, h, c) => Array.from({ length: 12 }, (_, i) => `<rect x="${(w / 12) * i}" y="0" width="${w / 12}" height="${h * 0.5}" fill="${['#FF2D55', '#FFCC00', '#34C759', '#007AFF', '#AF52DE', '#FFFFFF'][i % 6]}"/>`).join('') + `<rect x="0" y="${h * 0.5}" width="${w}" height="${h * 0.5}" fill="#111"/><rect x="0" y="${h * 0.62}" width="${w}" height="${h * 0.04}" fill="#FFF"/>`,
  }
  window.FOTOS = Object.fromEntries(Object.entries(F).map(([k, v]) => [k, v.alt]))
  window.foto = (key, aw = 3, ah = 2) => {
    const c = F[key] || F.patio
    const w = 1200, h = Math.round((1200 * ah) / aw)
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice"><defs>` +
      `<linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.sky[0]}"/><stop offset="1" stop-color="${c.sky[1]}"/></linearGradient>` +
      `<linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.ground[0]}"/><stop offset="1" stop-color="${c.ground[1]}"/></linearGradient></defs>` +
      `<rect width="${w}" height="${h}" fill="url(#s)"/><circle cx="${w * 0.72}" cy="${h * 0.26}" r="${h * 0.09}" fill="${c.sun}" opacity=".85"/>` +
      `<path d="M0 ${h * 0.7} Q${w * 0.25} ${h * 0.58} ${w * 0.5} ${h * 0.68} T${w} ${h * 0.64} V${h} H0 Z" fill="url(#g)"/>` +
      (shapes[c.shape] ? shapes[c.shape](w, h, c) : '') + '</svg>'
    return 'data:image/svg+xml,' + encodeURIComponent(svg)
  }
  window.fotoAlt = (key) => (F[key] || F.patio).alt
})()
