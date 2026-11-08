// Ficha interactiva de GAccordion. Controles desde GAccordion.meta.json; los elementos van en el slot por defecto.
import { h } from 'vue'
import { GAccordionItem, GBtn } from '@grana/vue'

const en = () => typeof document !== 'undefined' && document.documentElement.lang.startsWith('en')
const T = (es, e) => (en() ? e : es)

export default {
  // sticky pide la receta de cabecera fija (README); el modelo es la lista de abiertos.
  exclude: ['sticky'],
  model: { prop: 'modelValue', value: ['pago'], var: 'abiertos' },
  block: true,
  slots: [
    {
      name: 'default',
      code: {
        es: `<g-accordion-item value="pago" title="¿Cómo puedo pagar?"
  peek="Aceptamos tarjeta, transferencia y pago en la primera cita.">
  <p>Aceptamos tarjeta, transferencia y pago en la primera cita.</p>
  <p>Si prefieres otra forma de pago, escríbenos antes de reservar.</p>
</g-accordion-item>
<g-accordion-item value="cancelar" title="¿Puedo cancelar?" meta="Hasta 24 h antes"
  peek="Sí, sin costo hasta 24 horas antes de la cita.">
  <p>Sí, sin costo hasta 24 horas antes de la cita.</p>
  <p>Después de ese plazo se cobra el 50 % de la consulta.</p>
</g-accordion-item>
<g-accordion-item value="notif" title="Notificaciones" meta="2 activas"
  peek="Recibes avisos por correo y push.">
  <template #actions><g-btn size="sm" variant="ghost" color="neutral">Restablecer</g-btn></template>
  <p>Elige por qué canal quieres recibir los avisos.</p>
</g-accordion-item>`,
        en: `<g-accordion-item value="pago" title="How can I pay?"
  peek="We accept card, transfer and payment at the first visit.">
  <p>We accept card, transfer and payment at the first visit.</p>
  <p>If you prefer another way to pay, write to us before booking.</p>
</g-accordion-item>
<g-accordion-item value="cancelar" title="Can I cancel?" meta="Up to 24 h before"
  peek="Yes, free of charge up to 24 hours before the visit.">
  <p>Yes, free of charge up to 24 hours before the visit.</p>
  <p>After that, 50% of the consultation is charged.</p>
</g-accordion-item>
<g-accordion-item value="notif" title="Notifications" meta="2 active"
  peek="You get alerts by email and push.">
  <template #actions><g-btn size="sm" variant="ghost" color="neutral">Reset</g-btn></template>
  <p>Choose which channel you want alerts on.</p>
</g-accordion-item>`
      },
      render: () => [
        h(GAccordionItem, {
          value: 'pago', title: T('¿Cómo puedo pagar?', 'How can I pay?'),
          peek: T('Aceptamos tarjeta, transferencia y pago en la primera cita.', 'We accept card, transfer and payment at the first visit.')
        }, () => [
          h('p', T('Aceptamos tarjeta, transferencia y pago en la primera cita.', 'We accept card, transfer and payment at the first visit.')),
          h('p', T('Si prefieres otra forma de pago, escríbenos antes de reservar.', 'If you prefer another way to pay, write to us before booking.'))
        ]),
        h(GAccordionItem, {
          value: 'cancelar', title: T('¿Puedo cancelar?', 'Can I cancel?'), meta: T('Hasta 24 h antes', 'Up to 24 h before'),
          peek: T('Sí, sin costo hasta 24 horas antes de la cita.', 'Yes, free of charge up to 24 hours before the visit.')
        }, () => [
          h('p', T('Sí, sin costo hasta 24 horas antes de la cita.', 'Yes, free of charge up to 24 hours before the visit.')),
          h('p', T('Después de ese plazo se cobra el 50 % de la consulta.', 'After that, 50% of the consultation is charged.'))
        ]),
        h(GAccordionItem, {
          value: 'notif', title: T('Notificaciones', 'Notifications'), meta: T('2 activas', '2 active'),
          peek: T('Recibes avisos por correo y push.', 'You get alerts by email and push.')
        }, {
          actions: () => h(GBtn, { size: 'sm', variant: 'ghost', color: 'neutral' }, () => T('Restablecer', 'Reset')),
          default: () => h('p', T('Elige por qué canal quieres recibir los avisos.', 'Choose which channel you want alerts on.'))
        })
      ]
    }
  ],
  cases: [
    {
      title: { es: 'Preguntas frecuentes con avance', en: 'FAQ with a preview line' },
      why: {
        es: 'Con peek la pregunta cerrada enseña la primera línea de la respuesta y al abrir no se mueve. Úsalo cuando se lee antes de decidir abrir; si no, el título basta.',
        en: 'With peek the closed question shows the first line of the answer and does not move on opening. Use it when people read before deciding to open; otherwise the title is enough.'
      },
      props: {}
    },
    {
      title: { es: 'Un panel a la vez', en: 'One panel at a time' },
      why: {
        es: 'exclusive cierra el anterior al abrir otro: para secciones que se comparan una a una. Si el usuario necesita cotejar dos, déjalos abrir varios.',
        en: 'exclusive closes the previous one when another opens: for sections compared one by one. If people need to compare two, let several open.'
      },
      props: { exclusive: true }
    },
    {
      title: { es: 'Secciones de una página de ayuda', en: 'Sections of a help page' },
      why: {
        es: 'headingLevel 2 hace de cada título un h2 del esquema de la página; elige el nivel que sigue al encabezado que tienes encima, sin saltarte ninguno.',
        en: 'headingLevel 2 makes each title an h2 in the page outline; pick the level right below the heading above, skipping none.'
      },
      props: { headingLevel: 2 }
    }
  ]
}
