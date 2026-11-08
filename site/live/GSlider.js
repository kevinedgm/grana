// Ficha interactiva de GSlider. Los controles salen de GSlider.meta.json.
const E = (es, en) => ({ es, en })
const marks = {
  es: [{ value: 0, label: 'Sin dolor' }, { value: 5, label: 'Moderado' }, { value: 10, label: 'El peor' }],
  en: [{ value: 0, label: 'No pain' }, { value: 5, label: 'Moderate' }, { value: 10, label: 'Worst' }]
}

export default {
  // range pide un modelo arreglo y la ficha lleva uno solo: se ve en el README; los límites van en los casos.
  exclude: ['id', 'name', 'range', 'min', 'max', 'step', 'bigStep', 'minGap', 'format', 'valueText', 'locale', 'labels', 'warning', 'valid', 'marks'],
  model: { value: 5, var: 'dolor' },
  text: ['label', 'hint', 'error'],
  imports: ["import { GSlider } from '@grana/vue/slider'"],
  base: {
    label: E('Intensidad del dolor', 'Pain intensity'),
    hint: E('Haz clic en el riel o usa las flechas.', 'Click the rail or use the arrow keys.'),
    locale: E('es-MX', 'en-US'),
    max: 10,
    marks,
    labels: { es: { empty: 'Sin elegir' }, en: { empty: 'Not chosen' } }
  },
  code: { marks: ':marks="marcas"', labels: ':labels="{ empty: \'Sin elegir\' }"' },
  script: "const marcas = [{ value: 0, label: 'Sin dolor' }, { value: 5, label: 'Moderado' }, { value: 10, label: 'El peor' }]",
  cases: [
    {
      title: E('Escala subjetiva con marcas', 'Subjective scale with marks'),
      why: E('marks con texto en los extremos y el centro; es una escala de 0 a 10, no una cifra exacta.', 'marks with text at the ends and middle; it is a 0 to 10 scale, not an exact figure.'),
      props: {}
    },
    {
      title: E('Duración en minutos', 'Duration in minutes'),
      why: E('min, max y step acotan la elección; úsalo cuando valores intermedios tengan sentido, si no usa GRadioGroup.', 'min, max and step bound the choice; use it when in-between values make sense, otherwise use GRadioGroup.'),
      props: { label: E('Duración de la sesión', 'Session length'), hint: '', marks: [], min: 0, max: 480, step: 5, color: 'accent' }
    },
    {
      title: E('Rango de precio', 'Price range'),
      why: E('range con un modelo de dos valores y min-gap para que no se crucen; sirve para filtrar entre un mínimo y un máximo.', 'range with a two-value model and min-gap so the handles do not cross; it filters between a minimum and a maximum.'),
      props: { range: true, label: E('Precio de la consulta', 'Consultation price'), hint: '', marks: [], max: 5000, step: 50, minGap: 100, labels: { es: { start: 'mínimo', end: 'máximo' }, en: { start: 'minimum', end: 'maximum' } } },
      model: [800, 2400]
    },
    {
      title: E('Solo las marcas', 'Marks only'),
      why: E('snap="marks" salta de marca en marca cuando solo esos valores son válidos.', 'snap="marks" jumps from mark to mark when only those values are valid.'),
      props: { snap: 'marks' }
    },
    {
      title: E('Control obligatorio sin elegir', 'Required control left unchosen'),
      why: E('required y error al enviar sin haber movido el asa; el aviso se enlaza al control.', 'required and error on submit without moving the handle; the message is linked to the control.'),
      props: { required: true, error: E('Indica la intensidad antes de continuar.', 'State the intensity before continuing.') }
    }
  ]
}
