// Ficha interactiva de GTextarea. Los controles salen de GTextarea.meta.json.
const E = (es, en) => ({ es, en })

export default {
  // counterText es una función de la aplicación y el contador se enseña en su caso.
  exclude: ['id', 'warning', 'valid', 'counterText'],
  model: { value: '', var: 'notas' },
  text: ['label', 'hint', 'error'],
  base: {
    label: E('Notas de la consulta', 'Visit notes'),
    hint: E('Lo que escribas queda en el expediente.', 'What you write goes into the record.')
  },
  cases: [
    {
      title: E('Notas que crecen con el texto', 'Notes that grow with the text'),
      why: E('autosize evita la barra de desplazamiento en textos cortos y max-rows lo detiene en un tope; si el campo es de una línea, usa GInput.', 'autosize avoids a scrollbar on short texts and max-rows stops it at a cap; for a one-line field use GInput.'),
      props: { autosize: true, rows: 2, maxRows: 8, block: true }
    },
    {
      title: E('Campo obligatorio con error', 'Required field with an error'),
      why: E('required marca el campo y error lo explica; el aviso se enlaza con aria-describedby y debe decir cómo corregirlo.', 'required marks the field and error explains it; the message is linked with aria-describedby and should say how to fix it.'),
      props: { required: true, error: E('Escribe al menos una nota antes de guardar.', 'Write at least one note before saving.') }
    },
    {
      title: E('Texto fijo de lectura', 'Fixed reading text'),
      why: E('readonly con resize none para mostrar un texto que se puede copiar pero no cambiar.', 'readonly with resize none to show text that can be copied but not changed.'),
      props: { readonly: true, resize: 'none', rows: 4 }
    },
    {
      title: E('Guardando', 'Saving'),
      why: E('loading señala un guardado en curso sin quitar el foco al campo.', 'loading signals a save in progress without taking focus from the field.'),
      props: { loading: true, hint: E('Guardando en el expediente…', 'Saving to the record…') }
    }
  ]
}
