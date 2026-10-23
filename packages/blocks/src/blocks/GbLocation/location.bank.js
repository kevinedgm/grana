// Banco único de GbLocation (dueño: bruno; location.md «Banco», _comun.md §7 y §20): el mismo juego de datos pasa igual por
// las tres variantes en Vitest, en el playground y en el spec. Sin errores a propósito: con él, ninguna variante avisa (01 y
// 02 ignoran los puntos en silencio porque hay dirección; L3 solo con puntos y sin dirección). Casa Alcalá: name, dos
// líneas de dirección (una calle larga sin espacios, prueba de 320 px), horario, mapa 1200 × 800 con alt que describe el
// sitio, «Cómo llegar» externo a un mapa, canales (WhatsApp externo y tel:); tres puntos del tour en America/Mexico_City
// (Zócalo 07:45, el hotel 08:00 y uno mínimo con solo name); un texto en inglés con lang (§7: el del canal de correo).
import { LONG_WORD, media } from '../bank/fotos.js'

/** Iconos que la página registra con `createIcons` (nombres de lucide-static). */
export const appIcons = ['message-circle', 'phone', 'mail', 'navigation']

export const props = {
  title: 'Dónde estamos',
  description: 'En el centro de Oaxaca, a dos calles de Santo Domingo.',
  name: 'Casa Alcalá',
  address: ['Macedonio Alcalá 307, Centro', `68000 Oaxaca de Juárez, Oax. (${LONG_WORD})`],
  hours: ['Recepción las 24 horas', 'Desayuno de 8:00 a 11:00'],
  map: media('calle', 1200, 800, { alt: 'Casa Alcalá, a dos calles de Santo Domingo, en la esquina de Alcalá con Murguía' }),
  directions: { id: 'llegar', label: 'Cómo llegar', href: 'https://maps.example.com/?q=Casa+Alcala+Oaxaca', external: true, icon: 'navigation' },
  channels: [
    { label: 'WhatsApp', href: 'https://wa.me/529515550000', external: true, icon: 'message-circle', hint: 'Respuesta en menos de 2 h' },
    { label: '951 555 0000', href: 'tel:+529515550000', icon: 'phone' },
    { label: 'Write to us', href: 'mailto:hola@casaalcala.mx', icon: 'mail', lang: 'en', hint: 'hola@casaalcala.mx' }
  ],
  points: [
    {
      id: 'zocalo',
      name: 'Zócalo, frente a la Catedral',
      time: '07:45',
      description: 'Busca la camioneta blanca con el letrero de Casa Alcalá.',
      address: ['Av. de la Independencia s/n', 'Centro, Oaxaca'],
      directions: { label: 'Cómo llegar al Zócalo', href: 'https://maps.example.com/?q=Zocalo+Oaxaca', external: true },
      media: media('patio', 1200, 800, { alt: 'La Catedral de Oaxaca vista desde el Zócalo' })
    },
    {
      id: 'hotel',
      name: 'Casa Alcalá',
      time: '08:00',
      description: 'Si te hospedas con nosotros, te esperamos en la puerta.',
      address: ['Macedonio Alcalá 307, Centro'],
      directions: { label: 'Ver en el plano de la casa', href: '/llegar#puerta' }
    },
    { name: 'Mercado de Abastos (a petición)' }
  ],
  timeZone: 'America/Mexico_City',
  locale: 'es',
  labels: {
    map: 'Mapa de la zona',
    points: 'Puntos de encuentro',
    hours: 'Horario',
    channels: 'Escríbenos',
    external: 'se abre en otra pestaña'
  }
}

export const slots = {}
