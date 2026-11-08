// Ficha interactiva de GMetric. direction dice hacia dónde, trendColor si es bueno o malo.
export default {
  exclude: [],
  text: ['label', 'value', 'unit', 'trend', 'context'],
  base: {
    label: { es: 'Ingresos', en: 'Revenue' },
    value: '128,400',
    unit: 'MXN',
    trend: '+12 %',
    context: { es: 'frente a septiembre', en: 'vs. September' },
    direction: 'up',
    trendColor: 'success'
  },
  cases: [
    {
      title: { es: 'Cifra que sube y es buena noticia', en: 'Figure that rises and is good news' },
      why: { es: 'direction up y trendColor success: la flecha dice hacia dónde va, el color si es bueno.', en: 'direction up and trendColor success: the arrow says where it goes, the color whether it is good.' },
      props: { size: 'lg' }
    },
    {
      title: { es: 'Costo que sube: mala noticia', en: 'Cost that rises: bad news' },
      why: { es: 'Una subida no es siempre buena: direction up con trendColor danger. No reutilices la flecha como juicio.', en: 'A rise is not always good: direction up with trendColor danger. Do not reuse the arrow as a judgement.' },
      props: { label: { es: 'Costos', en: 'Costs' }, value: '52,300', trend: '+8 %', direction: 'up', trendColor: 'danger' }
    },
    {
      title: { es: 'Cifra sin comparación', en: 'Figure without comparison' },
      why: { es: 'Sin trend ni context queda solo etiqueta y valor; para un conteo que no tiene periodo previo.', en: 'Without trend or context only label and value remain; for a count with no previous period.' },
      props: { label: { es: 'Clientes activos', en: 'Active customers' }, value: '1,240', unit: '', trend: '', context: '', direction: 'flat', trendColor: 'neutral', size: 'sm' }
    }
  ]
}
