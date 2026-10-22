// Banco único de GbNewsletter (dueño: bruno; newsletter.md «Banco», _comun.md §7): el mismo juego de datos pasa igual por
// las tres variantes en Vitest, en el playground y en el spec. Sin errores a propósito: con él, ninguna variante avisa.
// `mail` lo registra la página con createIcons (cadena de lucide-static; ver `appIcons`). `onSubmit` es la escucha mínima
// (sin ella avisa N3): el playground y las pruebas la sustituyen por la suya.
import { LONG_WORD } from '../bank/fotos.js'

/** Iconos que la página registra con `createIcons` (nombres de lucide-static). */
export const appIcons = ['mail']

export const props = {
  title: 'Fechas libres, primero para ti',
  description: `Cuando se abre una habitación en temporada alta (Guelaguetza, Día de Muertos), te escribimos antes que a nadie. ${LONG_WORD}.`,
  field: {
    label: 'Tu correo',
    hint: 'Un correo al mes con fechas libres y nada más.',
    placeholder: 'nombre@correo.com',
    name: 'email'
  },
  action: { label: 'Suscribirme', icon: 'mail' },
  legal: {
    text: 'Puedes darte de baja cuando quieras.',
    link: { label: 'Aviso de privacidad', href: '/privacidad' }
  },
  labels: { busy: 'Suscribiendo…', external: 'se abre en otra pestaña' },
  onSubmit: () => {}
}

export const slots = {}

/** Estados de prueba (no los usa el banco por defecto). */
export const states = {
  busy: { busy: true },
  error: { error: 'No pudimos suscribirte; inténtalo de nuevo.' },
  done: { done: 'Listo: revisa tu correo para confirmar.' }
}
