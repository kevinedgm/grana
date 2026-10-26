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
  traslado: ['#DDE7EA', '#4E7A86', 'Camioneta de la casa en la puerta'],
  // Barro y Agave (Ecommerce, _comun.md §33)
  espadin: ['#E9DCC4', '#6B4A2B', 'Botella de mezcal espadín con etiqueta de papel amate'],
  tobala: ['#D9CBB0', '#3F2E20', 'Botella de mezcal tobalá junto a una jícara'],
  rebozoGrana: ['#F1D3D3', '#9B1B30', 'Rebozo de algodón teñido con grana cochinilla, doblado'],
  rebozoAnil: ['#D3DDF1', '#1F3A7A', 'Rebozo de algodón teñido con añil, doblado'],
  rebozoNatural: ['#F2ECE0', '#B9A88C', 'Rebozo de algodón en su color natural, doblado'],
  huipil: ['#F6EFE4', '#8E2F3C', 'Huipil de manta natural con flores bordadas de San Antonino'],
  jarro: ['#4A4A4A', '#121212', 'Jarro de barro negro bruñido de San Bartolo Coyotepec'],
  plato: ['#CFE3C2', '#3E6B34', 'Plato de barro verde vidriado de Atzompa'],
  textiles: ['#E8D5C8', '#7A2E3A', 'Telar de cintura con hilos teñidos'],
  cocina: ['#F3E0C0', '#8A4B1C', 'Molcajete con chiles y chocolate de metate'],
  regalos: ['#E6E0F0', '#5B4A7A', 'Caja de regalo con papel picado']
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
