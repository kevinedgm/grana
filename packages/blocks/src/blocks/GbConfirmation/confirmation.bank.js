// Banco único de GbConfirmation (dueño: bruno; confirmation.md «Banco», _comun.md §7 y §20): el mismo juego de datos pasa
// igual por las tres variantes en Vitest, en el playground y en el spec. Sin errores a propósito: con él, ninguna variante
// avisa. La consulta, las filas y los textos de la consulta son los comunes de bank/booking.js.
import { PARTY_ROWS, PRICES, PRICE_LABELS, QUERY_LABELS, photos, query } from '../bank/booking.js'

/** Iconos que la página registra con `createIcons` (nombres de lucide-static). */
export const appIcons = ['message-circle', 'phone', 'mail', 'calendar-plus', 'share-2']

export const props = {
  title: 'Reserva confirmada',
  state: 'confirmed',
  reference: { code: 'CA-7K29Q', label: 'Código de reserva' },
  query: query(),
  partyRows: PARTY_ROWS,
  offer: { id: 'suite-jardin', name: 'Suite Jardín', kind: 'Suite', photos: photos(1) },
  totals: {
    lines: [
      { label: 'Viernes 13 y sábado 14 (2 noches)', amount: { amount: 4100, currency: 'MXN' } },
      { label: 'Impuesto de hospedaje', amount: { amount: 123, currency: 'MXN' }, note: '3 %' }
    ],
    total: { value: { amount: 4223, currency: 'MXN' }, label: 'por 2 noches' },
    note: 'Pagas al llegar: no te cobramos nada ahora.'
  },
  prices: PRICES,
  next: [
    { id: 'llegada', title: 'Llegada', description: 'Te esperamos desde las 15:00 en Macedonio Alcalá 307', date: '2026-11-13T15:00:00-06:00' },
    { id: 'registro', title: 'Registro', description: 'Trae una identificación; tarda cinco minutos' },
    { id: 'desayuno', title: 'Desayuno', description: 'En el patio, de 8:00 a 11:00', date: '2026-11-14T08:00:00-06:00' }
  ],
  channels: [
    { label: 'WhatsApp', href: 'https://wa.me/529515550000', external: true, icon: 'message-circle', hint: 'Respuesta en menos de 2 h' },
    { label: '951 555 0000', href: 'tel:+529515550000', icon: 'phone' },
    { label: 'Correo', href: 'mailto:hola@casaalcala.mx', icon: 'mail', hint: 'hola@casaalcala.mx' }
  ],
  actions: [
    { id: 'calendario', label: 'Añadir al calendario', href: '/reservas/CA-7K29Q.ics', icon: 'calendar-plus' },
    { id: 'compartir', label: 'Compartir', icon: 'share-2' }
  ],
  timeZone: 'America/Mexico_City',
  locale: 'es',
  labels: {
    states: { confirmed: 'Confirmada', requested: 'Pendiente de confirmar' },
    query: QUERY_LABELS,
    when: 'Cuándo y quiénes',
    next: 'Lo que sigue',
    channels: 'Escríbenos',
    stepper: { complete: 'hecho', current: 'lo siguiente', pending: 'después', error: 'con error', warning: 'con aviso', disabled: 'no disponible', optional: 'opcional' },
    price: PRICE_LABELS,
    external: 'se abre en otra pestaña'
  }
}

export const slots = {}

/** Estados de prueba (no los usa el banco por defecto). */
export const states = {
  requested: { title: 'Recibimos tu solicitud', state: 'requested' }
}
