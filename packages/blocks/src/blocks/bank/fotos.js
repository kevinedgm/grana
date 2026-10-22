// Fotos falsas de los bancos de Marketing (dueño: bruno; _comun.md §7). Solo bancos (Vitest, playground y spec): no lo
// importa ningún bloque ni la entrada. Sin red: cada «foto» es un SVG en data URI con el tamaño pedido (proporciones de
// design/lab/marketing/r01/fotos.js). Los colores son CONTENIDO (simulan la foto de la aplicación), no tema.
const F = {
  patio: ['#F2C38B', '#5E6B4A', 'Patio con arcos de cantera verde al atardecer'],
  habitacion: ['#EADBC8', '#8C6A4F', 'Habitación Cantera con cama de lino y muro de adobe'],
  terraza: ['#1A1F29', '#F5C66B', 'Terraza de noche con faroles y la cúpula de Santo Domingo'],
  mezcal: ['#2A1E1A', '#C98B4A', 'Copa de mezcal sobre barra de madera'],
  desayuno: ['#F3E3C3', '#7A3B22', 'Desayuno oaxaqueño con chocolate y pan de yema'],
  calle: ['#9CC3D9', '#59663D', 'Calle empedrada hacia Santo Domingo'],
  traslado: ['#DDE7EA', '#4E7A86', 'Camioneta de la casa en la puerta']
}

export function foto(key, w = 1600, h = 1000) {
  const [a, b] = F[key] || F.patio
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="${w}" height="${h}" fill="url(#g)"/><circle cx="${w * 0.7}" cy="${h * 0.3}" r="${Math.min(w, h) * 0.12}" fill="${b}" opacity=".5"/></svg>`
  return 'data:image/svg+xml,' + encodeURIComponent(svg)
}

/** `Media` completa (alt informativo) con el tamaño pedido. */
export const media = (key, w, h, extra = {}) => ({ src: foto(key, w, h), width: w, height: h, alt: (F[key] || F.patio)[2], ...extra })

/** Palabra sin espacios para la prueba de 320 px (§7). */
export const LONG_WORD = 'Donaudampfschifffahrtsgesellschaftskapitänsmütze'
