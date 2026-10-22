// Banco único de GbStats (dueño: bruno; stats.md «Banco», _comun.md §7): el mismo juego de datos pasa igual por las tres
// variantes. Cifras ya formateadas por la aplicación en su idioma; todas con su origen (sin `source` avisaría S1).
import { LONG_WORD } from '../bank/fotos.js'

export const props = {
  title: 'Casa Alcalá en cifras',
  description: `Una casa pequeña, con los mismos dueños desde que abrió. Las cifras salen de la casa y de las opiniones públicas; ${LONG_WORD}.\n\nNada de esto cuenta hacia arriba: se lee igual en una captura.`,
  items: [
    { id: 'habitaciones', value: 12, unit: 'habitaciones', label: 'Casa pequeña', source: 'Registro de la casa, 2026' },
    { id: 'google', value: '4,8', unit: 'de 5', label: 'Calificación de huéspedes', source: '312 opiniones en Google, octubre de 2026' },
    { id: 'desde', value: '1998', label: 'Abierta desde', source: 'Acta de apertura' },
    { id: 'santo-domingo', value: '3', unit: 'min a pie', label: 'Hasta Santo Domingo', source: 'Google Maps, a pie' }
  ]
}

export const slots = {}
