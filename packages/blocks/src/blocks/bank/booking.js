// Lo común de los bancos de Booking (dueño: bruno; _comun.md §20, #864): LA MISMA consulta, las mismas filas del grupo y
// los mismos textos para decirla en todas las secciones, para que las pruebas comparen la misma línea en todas. Solo bancos
// (Vitest, playground y spec): no lo importa ningún bloque ni la entrada. Casa Alcalá (hotel boutique de Oaxaca).
import { foto } from './fotos.js'

/** La consulta común (estancia del viernes 13 al domingo 15 de noviembre de 2026; 2 adultos, 1 niño, 1 habitación). */
export const QUERY = Object.freeze({ kind: 'stay', from: '2026-11-13', to: '2026-11-15', party: Object.freeze({ adults: 2, children: 1, rooms: 1 }) })

/** Copia de la consulta (las pruebas y el playground la mutan con v-model). */
export const query = () => ({ ...QUERY, party: { ...QUERY.party } })

/** Las filas de GPartyField (adultos 1–6, niños 0–4 con su ayuda, habitaciones ≤ adultos). */
export const PARTY_ROWS = [
  { key: 'adults', label: 'Adultos', min: 1, max: 6, default: 2, unit: (n) => `${n} ${n === 1 ? 'adulto' : 'adultos'}`, decrementLabel: 'Un adulto menos', incrementLabel: 'Un adulto más' },
  { key: 'children', label: 'Niños', hint: 'De 0 a 12 años', min: 0, max: 4, unit: (n) => `${n} ${n === 1 ? 'niño' : 'niños'}`, decrementLabel: 'Un niño menos', incrementLabel: 'Un niño más' },
  { key: 'rooms', label: 'Habitaciones', hint: 'Hasta una por adulto', min: 1, max: (v) => v.adults, unit: (n) => `${n} ${n === 1 ? 'habitación' : 'habitaciones'}`, decrementLabel: 'Una habitación menos', incrementLabel: 'Una habitación más' }
]

/** Textos para decir la consulta (las claves de GBookingBar, #862). */
export const QUERY_LABELS = {
  nights: (n) => `${n} ${n === 1 ? 'noche' : 'noches'}`,
  separator: ' · ',
  checkout: 'Salida el {date}',
  noDates: 'Sin fechas',
  noDate: 'Sin fecha',
  noTime: 'Sin hora',
  noTour: 'Sin recorrido'
}

/** Textos de GBookingBar completos (frase en español, campos, errores y GDatePicker). */
export const BAR_LABELS = {
  ...QUERY_LABELS,
  phrase: 'Llego el {from}, me quedo {nights} y somos {party}.',
  fields: { from: 'Llegada', to: 'Salida', nights: 'Noches', date: 'Día', time: 'Hora', tour: 'Recorrido', party: 'Huéspedes' },
  empty: { from: '¿qué día?', nights: '¿cuántas noches?', date: '¿qué día?', time: '¿a qué hora?', tour: '¿cuál?' },
  summaryTitle: 'Tu consulta',
  change: 'Cambiar',
  submit: 'Ver disponibilidad',
  pending: 'Consultando…',
  close: 'Cerrar',
  done: 'Listo',
  otherDay: 'Otro día',
  full: 'lleno',
  decrement: 'Una noche menos',
  increment: 'Una noche más',
  errors: { dates: 'Elige las fechas.', night: 'No quedan habitaciones la noche del {date}.', nights: 'Elige entre 1 y 14 noches.', date: 'Elige el día.', time: 'Elige la hora.', tour: 'Elige el recorrido.' },
  missing: (n, v) => `${n === 1 ? 'Falta un dato' : `Faltan ${v.count} datos`}: ${v.list}`,
  datePicker: {
    prev: 'Mes anterior', next: 'Mes siguiente', dialog: 'Elegir fechas', close: 'Cerrar', today: 'hoy', selected: 'elegida',
    rangeStart: 'llegada', rangeEnd: 'salida', rangeSingle: 'llegada y salida', inRange: 'dentro de la estancia', unavailable: 'no disponible',
    clear: 'Borrar', done: 'Listo'
  }
}

/** Precios de la región (MXN, impuestos incluidos) y sus textos. */
export const PRICES = { currency: 'MXN', taxes: 'IVA incluido' }
export const PRICE_LABELS = { onRequest: 'Precio a consultar', approx: 'aprox.', total: 'Total', free: 'Gratis', before: 'Antes', range: '{min} a {max}', legend: 'Precios en {name} ({code})' }

const PH = [
  ['patio', 'Patio con arcos de cantera al atardecer', 'patio'],
  ['habitacion', 'Cama de lino junto al muro de adobe', 'cuarto'],
  ['terraza', 'Terraza de noche con faroles', 'terraza'],
  ['desayuno', 'Desayuno oaxaqueño en el patio', 'patio'],
  ['mezcal', 'Copa de mezcal en la barra', 'terraza'],
  ['calle', 'Calle empedrada hacia Santo Domingo', 'barrio'],
  ['traslado', 'Camioneta de la casa en la puerta', 'barrio'],
  ['habitacion', 'Baño con regadera de lluvia', 'cuarto'],
  ['patio', 'Jardín de la suite con buganvilia', 'patio']
]
/** `n` fotos de GGallery (alt obligatorio; con grupo). */
export const photos = (n = 1, w = 1600, h = 1066) => PH.slice(0, n).map(([key, alt, group], i) => ({ id: `f${i + 1}`, src: foto(key, w, h), thumb: foto(key, 320, 213), width: w, height: h, alt, group }))

/** Espacios de la galería (los `group` de `photos`). */
export const PHOTO_GROUPS = [
  { value: 'cuarto', label: 'La habitación' },
  { value: 'patio', label: 'El patio' },
  { value: 'terraza', label: 'La terraza' },
  { value: 'barrio', label: 'El barrio' }
]

/** Textos de GGalleryViewer (gallery.md «Textos»). */
export const GALLERY_LABELS = {
  total: (n) => `${n} ${n === 1 ? 'foto' : 'fotos'}`,
  count: '{index} de {total}',
  groupCount: '{group} · {index} de {total}',
  position: '{index} de {total}',
  announce: '{position}. {alt}.',
  first: 'Primera foto',
  last: 'Última foto',
  prev: 'Foto anterior',
  next: 'Foto siguiente',
  close: 'Cerrar',
  zoom: 'Ampliar',
  viewer: '{title}, galería',
  groups: 'Espacios',
  groupLink: (n, v) => `${v.group}, ${n} ${n === 1 ? 'foto' : 'fotos'}`,
  broken: 'No se pudo cargar esta foto: {alt}',
  carousel: 'carrusel',
  slide: 'foto'
}
