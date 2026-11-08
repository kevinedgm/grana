// Ficha interactiva de GText.
export default {
  exclude: [],
  text: [],
  base: {},
  slots: [{ name: 'default', text: { es: 'Sin pago ahora · Respuesta por WhatsApp en menos de 2 h', en: 'No payment now · WhatsApp reply in under 2 h' } }],
  cases: [
    {
      title: { es: 'La garantía bajo una llamada a la acción', en: 'The guarantee under a call to action' },
      why: { es: 'Texto de apoyo: pesa menos que lo que apoya (body-sm, muted). Si es descripción de una sección, usa la prop description de la sección.', en: 'Supporting text: it weighs less than what it supports (body-sm, muted). For a section description use the section description prop.' },
      props: { size: 'body-sm', tone: 'muted' }
    },
    {
      title: { es: 'Pie de una figura', en: 'Figure caption' },
      why: { es: 'as="small" con caption y muted para créditos y fuentes; no lo uses para información que el usuario necesita para decidir.', en: 'as="small" with caption and muted for credits and sources; do not use it for information the user needs to decide.' },
      props: { as: 'small', size: 'caption', tone: 'muted' }
    },
    {
      title: { es: 'Párrafo de cuerpo', en: 'Body paragraph' },
      why: { es: 'El valor por defecto (p, body, default) para texto corrido; as="div" si dentro llevas varios párrafos.', en: 'The default (p, body, default) for running text; as="div" when you carry several paragraphs inside.' },
      props: {}
    }
  ]
}
