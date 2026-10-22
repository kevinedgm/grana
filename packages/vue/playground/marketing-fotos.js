// Marcadores de foto locales para los bancos de marketing (dueño: bruno). Sin red: cada «foto» es un SVG en data URI con el
// tamaño pedido. Los colores son CONTENIDO (simulan la foto que aporta la aplicación), no tema. Casos extremos para medir:
// 'cielo' (casi blanca), 'noche' (casi negra) y 'papel-picado' (muy contrastada).
;(() => {
  const F = {
    patio: ['#F2C38B', '#5E6B4A', 'Patio con arcos de cantera verde al atardecer'],
    habitacion: ['#EADBC8', '#8C6A4F', 'Habitación con cama de lino y muro de adobe'],
    bano: ['#DDE7EA', '#4E7A86', 'Baño con lavabo de talavera'],
    terraza: ['#1A1F29', '#F5C66B', 'Terraza de noche con faroles'],
    mezcal: ['#2A1E1A', '#C98B4A', 'Copa de mezcal sobre barra de madera'],
    cielo: ['#FBFAF7', '#F1ECE2', 'Cielo despejado sobre muros encalados'],
    noche: ['#0E1116', '#1A1F29', 'Terraza de noche (caso oscuro extremo)'],
    'papel-picado': ['#FFFFFF', '#111111', 'Papel picado de colores (contraste alto)']
  }
  window.foto = (key, w = 1600, h = 1000) => {
    const [a, b] = F[key] || F.patio
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="${w}" height="${h}" fill="url(#g)"/><circle cx="${w * 0.7}" cy="${h * 0.3}" r="${Math.min(w, h) * 0.12}" fill="${b}" opacity=".5"/></svg>`
    return 'data:image/svg+xml,' + encodeURIComponent(svg)
  }
  window.fotoAlt = (key) => (F[key] || F.patio)[2]
  window.fotoMedia = (key, w, h, extra = {}) => ({ src: window.foto(key, w, h), width: w, height: h, alt: window.fotoAlt(key), ...extra })
})()
