// Banco único de GbCta (dueño: bruno; cta.md «Banco», _comun.md §7): el mismo juego de datos pasa igual por las tres
// variantes en Vitest, en el playground y en el spec. Sin errores a propósito: con él, ninguna variante avisa (montada
// sola: dos GbCta en el mismo documento avisan A2, por eso el playground las monta de una en una con ?v=).
import { LONG_WORD, media } from '../bank/fotos.js'

export const props = {
  title: 'Reserva directo y te esperamos con mezcal',
  description: `Las mismas habitaciones que en las agencias, con desayuno incluido y la copa de bienvenida; ${LONG_WORD}.`,
  actions: [
    { id: 'reservar', label: 'Reservar', href: '#reservar' },
    { id: 'whatsapp', label: 'Escríbenos por WhatsApp', href: 'https://wa.me/529510000000', external: true }
  ],
  assurance: 'Sin pago ahora · Respuesta por WhatsApp en menos de 2 h',
  media: media('mezcal', 1200, 900),
  labels: { actions: 'Reservar o escribir', external: 'se abre en otra pestaña' }
}

export const slots = {}
