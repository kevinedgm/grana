// Ficha interactiva de GBadge. Controles desde GBadge.meta.json.
import { h } from 'vue'
import { GAvatar, GIcon } from '@grana/vue'

export default {
  exclude: ['placement'],
  text: [],
  base: {},
  slots: [
    { name: 'default', text: { es: 'Pendiente', en: 'Pending' } },
    { name: 'icon', optional: true, on: false, code: '<g-icon name="clock" />', render: () => h(GIcon, { name: 'clock' }) },
    {
      name: 'anchor', optional: true, on: false, code: '<g-avatar name="Luis Torres" />',
      render: () => h(GAvatar, { name: 'Luis Torres', size: 'lg' })
    }
  ],
  cases: [
    {
      title: { es: 'Estado de un registro', en: 'Status of a record' },
      why: { es: 'Texto corto con color semántico: el color nunca va solo, siempre acompaña a la palabra.', en: 'Short text with a semantic color: color never stands alone, it always accompanies the word.' },
      props: { color: 'warning', variant: 'soft' }
    },
    {
      title: { es: 'Contador de notificaciones sobre un avatar', en: 'Notification counter over an avatar' },
      why: { es: 'count con tope (max) y label para el lector; anclada con el slot anchor. Si no hay nada que contar, no se pinta (showZero lo cambia).', en: 'count with a cap (max) and a label for the reader; anchored with the anchor slot. With nothing to count it is not drawn (showZero changes that).' },
      props: { count: 128, max: 99, color: 'danger', variant: 'solid', size: 'sm', label: { es: '128 mensajes sin leer', en: '128 unread messages' } },
      slots: { default: false, anchor: true }
    },
    {
      title: { es: 'Presencia anclada al avatar', en: 'Presence anchored to an avatar' },
      why: { es: 'Solo figura (shape) con label: la forma distingue sin depender del color. Para texto largo usa un texto, no una figura.', en: 'Figure only (shape) with a label: the shape distinguishes without relying on color. For long text use text, not a figure.' },
      props: { shape: 'circle', color: 'success', variant: 'solid', size: 'sm', label: { es: 'En línea', en: 'Online' }, placement: 'bottom-end' },
      slots: { default: false, anchor: true }
    },
    {
      title: { es: 'Texto con figura de estado', en: 'Text with a state figure' },
      why: { es: 'La figura repite el estado en forma (diamante = aviso) para quien no distingue colores; úsala cuando el estado es lo importante de la fila.', en: 'The figure repeats the state as a shape (diamond = warning) for people who cannot tell colors apart; use it when the state is what matters in the row.' },
      props: { shape: 'diamond', color: 'warning', variant: 'outline' }
    }
  ]
}
