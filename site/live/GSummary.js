// Ficha interactiva de GSummary.
const facts = [
  { label: 'Expediente', short: 'Exp.', value: '001000', priority: 1 },
  { label: 'Edad', value: '22 años', bare: true },
  { label: 'Última visita', value: '03/02/2026' },
  { label: 'Médico', value: 'Dra. Ruiz', bare: true }
]

export default {
  exclude: ['icon', 'diff', 'highlight', 'placeholder', 'lines', 'status', 'avatar', 'size'],
  text: ['title', 'subtitle', 'code'],
  base: {
    title: { es: 'María García López', en: 'María García López' },
    avatar: true,
    status: { label: 'Activo', color: 'success' },
    facts
  },
  code: { avatar: 'avatar', status: ':status="status"', facts: ':facts="facts"' },
  cases: [
    {
      title: { es: 'Fila de paciente en una lista', en: 'Patient row in a list' },
      why: { es: 'row (por defecto): título, estado y datos que ceden por prioridad según el ancho; el identificador no se pierde.', en: 'row (default): title, status and facts that yield by priority with the width; the identifier is never lost.' },
      props: { layout: 'row' }
    },
    {
      title: { es: 'Línea dentro de un texto o un campo', en: 'Line inside text or a field' },
      why: { es: 'inline es la ficha más baja (xs): cabe en una opción de menú o de combobox; no la uses si hay más de tres datos.', en: 'inline is the lowest card (xs): it fits a menu or combobox option; do not use it with more than three facts.' },
      props: { layout: 'inline' }
    },
    {
      title: { es: 'Diagnóstico como ficha apilada', en: 'Diagnosis as a stacked card' },
      why: { es: 'stack con code y subtitle para entidades que se abren aparte; ancho cómodo, no para filas repetidas.', en: 'stack with code and subtitle for entities that open elsewhere; comfortable width, not for repeated rows.' },
      props: {
        layout: 'stack', title: { es: 'Diabetes mellitus tipo 2', en: 'Type 2 diabetes mellitus' }, code: 'E11.9',
        subtitle: { es: 'Sin complicaciones', en: 'Without complications' }, avatar: false, status: null
      }
    }
  ]
}
