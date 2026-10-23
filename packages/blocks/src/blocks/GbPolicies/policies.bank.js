// Banco único de GbPolicies (dueño: bruno; policies.md «Banco», _comun.md §7 y §20): el mismo juego de datos pasa igual por
// las tres variantes en Vitest, en el playground y en el spec. Sin errores a propósito: con él, ninguna variante avisa.
// Casa Alcalá: cancelación (ancla #cancelacion, dos párrafos, enlace interno al documento), llegada y salida, mascotas
// (icono paw-print registrado con createIcons), niños, pagos (enlace externo) y una mínima (title, summary y body); un
// texto largo con una palabra sin espacios (§7).
import { LONG_WORD } from '../bank/fotos.js'

/** Iconos que la página registra con `createIcons` (nombres de lucide-static). */
export const appIcons = ['calendar-x', 'clock', 'paw-print', 'baby', 'credit-card']

export const props = {
  title: 'Antes de reservar',
  description: 'Lo que conviene saber de la casa; cada condición tiene su propio enlace.',
  items: [
    {
      id: 'cancelacion',
      title: 'Cancelación',
      summary: 'Cancelación gratis hasta 48 h antes de la llegada.',
      icon: 'calendar-x',
      body: 'Puedes cancelar sin costo hasta 48 horas antes de las 15:00 del día de llegada. Te devolvemos el anticipo completo en un plazo de cinco días hábiles.\n\nDespués de ese plazo cobramos la primera noche. Si no llegas y no nos avisas, cobramos la estancia completa.',
      link: { label: 'Leer la política completa', href: '/politicas/cancelacion' }
    },
    {
      id: 'llegada',
      title: 'Llegada y salida',
      summary: 'Llegada desde las 15:00; salida hasta las 12:00.',
      icon: 'clock',
      body: 'La recepción atiende las 24 horas. Si llegas antes, guardamos tu equipaje y puedes desayunar en el patio.\n\nLa salida tardía hasta las 15:00 cuesta media noche y depende de la ocupación.'
    },
    {
      id: 'mascotas',
      title: 'Mascotas',
      summary: 'Perros pequeños bienvenidos en las habitaciones de planta baja.',
      icon: 'paw-print',
      body: `Aceptamos un perro de hasta 10 kg por habitación, con aviso previo. Hay un cargo de limpieza por estancia; ${LONG_WORD}.`
    },
    {
      id: 'ninos',
      title: 'Niños',
      summary: 'Menores de 4 años sin costo en la cama de los padres.',
      icon: 'baby',
      body: 'Tenemos cunas sin costo; pídela al reservar. Las suites admiten una cama extra para un niño de hasta 12 años.'
    },
    {
      id: 'pagos',
      title: 'Pagos',
      summary: 'Pagas al llegar con tarjeta o en efectivo.',
      icon: 'credit-card',
      body: 'Aceptamos tarjetas de crédito y débito, transferencia y efectivo en pesos. Los precios incluyen IVA; el impuesto de hospedaje (3 %) se cobra aparte.',
      link: { label: 'Formas de pago del banco', href: 'https://example.com/pagos', external: true }
    },
    { title: 'Silencio', summary: 'De 22:00 a 8:00 la casa descansa.', body: 'El patio se cierra a las 22:00 para que todos duerman.' }
  ],
  labels: { external: 'se abre en otra pestaña' }
}

export const slots = {}
