// Banco único de GbGuestForm (dueño: bruno; guest-form.md «Banco», _comun.md §7 y §20): el mismo juego de datos pasa igual
// por las tres variantes en Vitest, en el playground y en el spec. Sin errores a propósito: con él, ninguna variante
// avisa. La consulta, las filas y los textos de la consulta son los comunes de bank/booking.js. `onSubmit` es la escucha
// mínima (sin ella avisa G6): el playground y las pruebas la sustituyen por la suya.
import { LONG_WORD } from '../bank/fotos.js'
import { BAR_LABELS, PARTY_ROWS, PRICES, PRICE_LABELS, QUERY_LABELS, photos, query } from '../bank/booking.js'

/** Iconos que la página registra con `createIcons` (nombres de lucide-static). */
export const appIcons = ['check']

export const props = {
  title: 'Tus datos',
  description: `Solo lo necesario para guardar tu habitación. ${LONG_WORD}.`,
  groups: [
    { id: 'quien', title: 'Quién viene', description: 'La persona que hace la reserva.' },
    { id: 'llegada', title: 'Tu llegada' }
  ],
  fields: [
    { name: 'nombre', label: 'Nombre', autocomplete: 'given-name', required: true, group: 'quien', row: 'nombre' },
    { name: 'apellidos', label: 'Apellidos', autocomplete: 'family-name', required: true, group: 'quien', row: 'nombre' },
    { name: 'correo', label: 'Correo', type: 'email', autocomplete: 'email', required: true, hint: 'Ahí te llega la confirmación.', group: 'quien' },
    { name: 'telefono', label: 'Teléfono', type: 'tel', autocomplete: 'tel', required: true, why: 'Para avisarte por WhatsApp si cambia algo de tu llegada.', group: 'quien' },
    {
      name: 'hora',
      label: 'Hora estimada de llegada',
      type: 'select',
      required: true,
      placeholder: 'Elige una hora',
      options: [{ value: 'tarde', label: 'De 15:00 a 18:00' }, { value: 'noche', label: 'De 18:00 a 22:00' }, { value: 'madrugada', label: 'Después de las 22:00' }],
      group: 'llegada'
    },
    { name: 'peticiones', label: 'Peticiones', type: 'textarea', hint: 'Cuna, almohada extra, alergias…', group: 'llegada' }
  ],
  party: { label: 'Huéspedes', name: 'huespedes', hint: 'Lo que pediste en la consulta; puedes corregirlo aquí.' },
  partyRows: PARTY_ROWS,
  query: query(),
  consents: [
    { name: 'politica', label: 'Acepto la política de cancelación', required: true, policy: 'cancelacion', link: { label: 'Leer la política de cancelación', href: '#cancelacion' } },
    { name: 'ofertas', label: 'Quiero recibir ofertas por correo (una al mes)' }
  ],
  offer: {
    id: 'suite-jardin',
    name: 'Suite Jardín',
    kind: 'Suite',
    photos: photos(1),
    price: { value: { amount: 1850, currency: 'MXN' }, lead: 'desde', unit: '/ noche', unitLabel: 'por noche', total: { value: { amount: 4100, currency: 'MXN' }, label: 'por 2 noches' } }
  },
  prices: PRICES,
  action: { label: 'Confirmar reserva', icon: 'check' },
  locale: 'es',
  labels: {
    required: 'Escribe {label}.',
    invalid: 'Revisa {label}.',
    consent: 'Marca esta casilla para continuar.',
    next: 'Siguiente',
    back: 'Atrás',
    busy: 'Confirmando…',
    forQuery: 'Para {query}',
    query: QUERY_LABELS,
    form: { optional: 'opcional', error: 'Error: ', warning: 'Aviso: ', valid: 'Listo: ', sectionErrors: (n) => `${n} ${n === 1 ? 'error' : 'errores'}` },
    errorSummary: { title: (n) => `Revisa ${n === 1 ? 'un dato' : `${n} datos`} antes de continuar` },
    stepper: { complete: 'hecho', current: 'paso actual', pending: 'pendiente', error: 'con error', warning: 'con aviso', disabled: 'no disponible', optional: 'opcional', progress: 'Paso {current} de {total}', showAll: 'Ver todos los pasos', hideAll: 'Ocultar los pasos' },
    party: { done: BAR_LABELS.done, separator: QUERY_LABELS.separator },
    price: PRICE_LABELS,
    datePicker: BAR_LABELS.datePicker,
    external: 'se abre en otra pestaña'
  },
  onSubmit: () => {}
}

export const slots = {}

/** Estados de prueba (guest-form.md «Banco»). */
export const states = {
  busy: { busy: true },
  errors: { errors: { telefono: 'Ese número no recibe mensajes; escribe otro.' } },
  error: { error: 'No pudimos guardar tu reserva; inténtalo de nuevo en un momento.' },
  // Todo escrito (playground y spec: Intro envía tras marcar la política)
  full: { values: { nombre: 'Rosa', apellidos: 'Martínez López', correo: 'rosa@correo.mx', telefono: '+52 951 555 0101', hora: 'tarde', peticiones: '' } }
}
