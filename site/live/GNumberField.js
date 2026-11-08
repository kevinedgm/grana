// Ficha interactiva de GNumberField. Los controles salen de GNumberField.meta.json.
const E = (es, en) => ({ es, en })

export default {
  // currency y output tienen su sección en el README; los rótulos de unidad van en los casos.
  exclude: ['id', 'name', 'currency', 'output', 'warning', 'valid', 'prefix', 'suffix', 'prefixLabel', 'suffixLabel', 'precision', 'min', 'max', 'step', 'locale'],
  model: { value: 72.5, var: 'peso' },
  text: ['label', 'hint', 'error'],
  base: {
    label: E('Peso', 'Weight'),
    hint: E('Con coma o con punto: ambos valen.', 'With a comma or a point: both work.'),
    locale: E('es-MX', 'en-US'),
    min: 0, max: 400, step: 0.1, precision: 1,
    suffix: E('kg', 'kg'), suffixLabel: E('kilogramos', 'kilograms'),
    decrementLabel: E('Menos', 'Less'), incrementLabel: E('Más', 'More')
  },
  cases: [
    {
      title: E('Medida con unidad pegada', 'Measure with an attached unit'),
      why: E('suffix y suffix-label: la unidad se ve junto al número y el lector la dice con su nombre completo.', 'suffix and suffix-label: the unit sits next to the number and the screen reader says its full name.'),
      props: {}
    },
    {
      title: E('Cantidad que sube de uno en uno', 'Quantity that goes up one at a time'),
      why: E('steppers añade − y +; úsalo para cantidades pequeñas, no para cifras de varios dígitos que se teclean.', 'steppers adds − and +; use it for small quantities, not for multi-digit numbers that get typed.'),
      props: { steppers: true, label: E('Dosis diaria', 'Daily dose'), hint: '', suffix: E('tabletas', 'tablets'), suffixLabel: E('tabletas', 'tablets'), step: 1, precision: 0, min: 0, max: 6 }
    },
    {
      title: E('Valor fuera de rango', 'Value out of range'),
      why: E('error lo dice con palabras y el modelo no se recorta solo: tu aplicación decide qué hacer con un 130.', 'error says it in words and the model is not clamped for you: your app decides what to do with a 130.'),
      props: { label: E('Edad', 'Age'), hint: '', suffix: E('años', 'years'), suffixLabel: E('años', 'years'), precision: 0, step: 1, max: 120, error: E('La edad debe estar entre 0 y 120 años.', 'Age must be between 0 and 120 years.') }
    },
    {
      title: E('Dato calculado', 'Calculated value'),
      why: E('readonly muestra una cifra que el usuario puede copiar pero no cambiar; el formato sigue al idioma.', 'readonly shows a figure the user can copy but not change; the format follows the language.'),
      props: { readonly: true, label: E('Peso registrado', 'Recorded weight'), hint: '' }
    }
  ]
}
