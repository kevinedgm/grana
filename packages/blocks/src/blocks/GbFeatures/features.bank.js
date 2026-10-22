// Banco único de GbFeatures (dueño: bruno; features.md «Banco», _comun.md §7): el mismo juego de datos pasa igual por las
// tres variantes en Vitest, en el playground y en el spec. Sin errores a propósito: con él, ninguna variante avisa.
// Iconos: `image` y `globe` son de la lista de la librería; `coffee` y `wifi` los registra la página con createIcons
// (cadenas de lucide-static; ver `appIcons`).
import { LONG_WORD, media } from '../bank/fotos.js'

/** Iconos que la página registra con `createIcons` (nombres de lucide-static). */
export const appIcons = ['coffee', 'wifi']

export const props = {
  title: 'Por qué Casa Alcalá',
  description: 'Lo que encuentras al llegar, contado en corto.',
  items: [
    { id: 'patio', title: 'Patio de cantera verde', description: `Doce habitaciones alrededor de un patio con naranjos y fuente. ${LONG_WORD}.`, media: media('patio', 1200, 900) },
    { id: 'terraza', title: 'Terraza con vista a Santo Domingo', description: 'Al atardecer, con mezcal de la casa.', icon: 'image', media: media('terraza', 1200, 900), action: { label: 'Ver las fotos de la terraza', href: '#fotos-terraza' } },
    { id: 'desayuno', title: 'Desayuno oaxaqueño', description: 'Chocolate de metate, pan de yema y fruta del mercado.', icon: 'coffee', media: media('desayuno', 1200, 900) },
    { id: 'ubicacion', title: 'A dos calles de Santo Domingo', description: 'Todo el centro histórico a pie.', icon: 'globe', action: { label: 'Abrir en Google Maps', href: 'https://maps.google.com/?q=Casa+Alcala+Oaxaca', external: true } },
    { id: 'wifi', title: 'Wifi en toda la casa', icon: 'wifi' },
    { id: 'traslado', title: 'Traslado desde el aeropuerto', description: 'Con reserva previa; te espera en la puerta.', media: media('traslado', 1200, 900) }
  ],
  labels: { external: 'se abre en otra pestaña' }
}

export const slots = {}
