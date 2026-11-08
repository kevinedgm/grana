// Ficha interactiva de GCombobox. Los controles salen de GCombobox.meta.json.
const E = (es, en) => ({ es, en })

// Los textos son de la aplicación: Grana no trae ninguno. Los objetos de abajo son los que usa la ficha;
// `labelsSrc` repite el mismo literal como texto para el código copiado.
const labelsSrc = {
  es: `{
  clear: 'Quitar', close: 'Cerrar', noResults: 'Sin resultados para «{text}»',
  results: (n) => (n === 1 ? '1 resultado' : \`\${n} resultados\`),
  more: 'Mostrar más ({shown} de {total})',
  useCustom: 'Usar «{text}» como texto libre', custom: 'Texto libre',
  selected: (n) => (n === 1 ? '1 seleccionada' : \`\${n} seleccionadas\`),
  about: (n, list) => \`\${n === 1 ? '1 seleccionada' : \`\${n} seleccionadas\`}: \${list}\`,
  customItem: '{text} (texto libre)',
  added: (label, n) => \`Se agregó \${label}. \${n} seleccionadas.\`,
  removed: (label, n) => \`Se quitó \${label}. \${n} seleccionadas.\`,
  restored: (label, n) => \`Se restauró \${label}. \${n} seleccionadas.\`,
  clearedAll: 'Se quitaron todas', restoredAll: (n) => \`Se restauraron \${n}\`,
  armed: 'Pulsa Retroceso otra vez para quitar {label}', already: '{label} ya está elegida',
  max: 'Máximo {max}: quita una para elegir otra', ofMax: '{count} de {max}',
  chosen: 'Elegidas', rest: '{count} más', showAll: 'Ver las {count}', showLess: 'Ver menos',
  done: 'Listo', preview: 'Vista previa', remove: 'Quitar {label}', undo: 'Deshacer', trace: '{label} quitada'
}`,
  en: `{
  clear: 'Clear', close: 'Close', noResults: 'No results for “{text}”',
  results: (n) => (n === 1 ? '1 result' : \`\${n} results\`),
  more: 'Show more ({shown} of {total})',
  useCustom: 'Use “{text}” as free text', custom: 'Free text',
  selected: (n) => (n === 1 ? '1 selected' : \`\${n} selected\`),
  about: (n, list) => \`\${n === 1 ? '1 selected' : \`\${n} selected\`}: \${list}\`,
  customItem: '{text} (free text)',
  added: (label, n) => \`\${label} added. \${n} selected.\`,
  removed: (label, n) => \`\${label} removed. \${n} selected.\`,
  restored: (label, n) => \`\${label} restored. \${n} selected.\`,
  clearedAll: 'All removed', restoredAll: (n) => \`\${n} restored\`,
  armed: 'Press Backspace again to remove {label}', already: '{label} is already chosen',
  max: 'Maximum {max}: remove one to choose another', ofMax: '{count} of {max}',
  chosen: 'Chosen', rest: '{count} more', showAll: 'Show all {count}', showLess: 'Show less',
  done: 'Done', preview: 'Preview', remove: 'Remove {label}', undo: 'Undo', trace: '{label} removed'
}`
}
const textosEs = {
  clear: 'Quitar', close: 'Cerrar', noResults: 'Sin resultados para «{text}»',
  results: (n) => (n === 1 ? '1 resultado' : `${n} resultados`),
  more: 'Mostrar más ({shown} de {total})',
  useCustom: 'Usar «{text}» como texto libre', custom: 'Texto libre',
  selected: (n) => (n === 1 ? '1 seleccionada' : `${n} seleccionadas`),
  about: (n, list) => `${n === 1 ? '1 seleccionada' : `${n} seleccionadas`}: ${list}`,
  customItem: '{text} (texto libre)',
  added: (label, n) => `Se agregó ${label}. ${n} seleccionadas.`,
  removed: (label, n) => `Se quitó ${label}. ${n} seleccionadas.`,
  restored: (label, n) => `Se restauró ${label}. ${n} seleccionadas.`,
  clearedAll: 'Se quitaron todas', restoredAll: (n) => `Se restauraron ${n}`,
  armed: 'Pulsa Retroceso otra vez para quitar {label}', already: '{label} ya está elegida',
  max: 'Máximo {max}: quita una para elegir otra', ofMax: '{count} de {max}',
  chosen: 'Elegidas', rest: '{count} más', showAll: 'Ver las {count}', showLess: 'Ver menos',
  done: 'Listo', preview: 'Vista previa', remove: 'Quitar {label}', undo: 'Deshacer', trace: '{label} quitada'
}
const textosEn = {
  clear: 'Clear', close: 'Close', noResults: 'No results for “{text}”',
  results: (n) => (n === 1 ? '1 result' : `${n} results`),
  more: 'Show more ({shown} of {total})',
  useCustom: 'Use “{text}” as free text', custom: 'Free text',
  selected: (n) => (n === 1 ? '1 selected' : `${n} selected`),
  about: (n, list) => `${n === 1 ? '1 selected' : `${n} selected`}: ${list}`,
  customItem: '{text} (free text)',
  added: (label, n) => `${label} added. ${n} selected.`,
  removed: (label, n) => `${label} removed. ${n} selected.`,
  restored: (label, n) => `${label} restored. ${n} selected.`,
  clearedAll: 'All removed', restoredAll: (n) => `${n} restored`,
  armed: 'Press Backspace again to remove {label}', already: '{label} is already chosen',
  max: 'Maximum {max}: remove one to choose another', ofMax: '{count} of {max}',
  chosen: 'Chosen', rest: '{count} more', showAll: 'Show all {count}', showLess: 'Show less',
  done: 'Done', preview: 'Preview', remove: 'Remove {label}', undo: 'Undo', trace: '{label} removed'
}

export default {
  // multiple, selection, numbered y max piden un modelo arreglo y la ficha lleva un valor; creatable y los datos de carga son de la aplicación.
  exclude: ['id', 'name', 'multiple', 'selection', 'numbered', 'max', 'custom', 'customName', 'selectedOption', 'selectedOptions', 'creatable', 'total', 'loadError', 'minChars', 'delay', 'limit', 'filter', 'labels', 'warning', 'valid', 'loading', 'rounded'],
  ignore: ['search', 'more', 'create'],
  model: { value: null, var: 'dx' },
  text: ['label', 'hint', 'error'],
  imports: ["import { GCombobox } from '@grana/vue/combobox'"],
  base: {
    label: E('Diagnóstico principal', 'Main diagnosis'),
    hint: E('Prueba «diab» o «I10».', 'Try “diab” or “I10”.'),
    placeholder: E('Código o descripción', 'Code or description'),
    clearable: true,
    options: {
      es: [
        { value: 'E11.9', code: 'E11.9', label: 'Diabetes mellitus tipo 2, sin complicación', description: 'Endocrinas y metabólicas' },
        { value: 'I10', code: 'I10', label: 'Hipertensión esencial (primaria)', description: 'Sistema circulatorio' },
        { value: 'J45.9', code: 'J45.9', label: 'Asma, no especificada', description: 'Sistema respiratorio' },
        { value: 'K29.7', code: 'K29.7', label: 'Gastritis, no especificada', description: 'Sistema digestivo' }
      ],
      en: [
        { value: 'E11.9', code: 'E11.9', label: 'Type 2 diabetes mellitus, uncomplicated', description: 'Endocrine and metabolic' },
        { value: 'I10', code: 'I10', label: 'Essential (primary) hypertension', description: 'Circulatory system' },
        { value: 'J45.9', code: 'J45.9', label: 'Asthma, unspecified', description: 'Respiratory system' },
        { value: 'K29.7', code: 'K29.7', label: 'Gastritis, unspecified', description: 'Digestive system' }
      ]
    },
    labels: { es: textosEs, en: textosEn }
  },
  code: { labels: ':labels="textos"' },
  script: {
    es: `// Los textos son tuyos: Grana no trae ninguno.\nconst textos = ${labelsSrc.es}`,
    en: `// The texts are yours: Grana ships none.\nconst textos = ${labelsSrc.en}`
  },
  cases: [
    {
      title: E('Catálogo que se filtra al escribir', 'Catalog filtered as you type'),
      why: E('El campo se abre y filtra el catálogo que tu aplicación le pasa; para una lista corta y cerrada usa GSelect.', 'The field opens and filters the catalog your app passes it; for a short closed list use GSelect.'),
      props: {}
    },
    {
      title: E('Texto libre cuando no está en la lista', 'Free text when it is not in the list'),
      why: E('allow-custom deja conservar lo escrito como texto libre; úsalo cuando el catálogo no puede ser exhaustivo.', 'allow-custom keeps what was typed as free text; use it when the catalog cannot be exhaustive.'),
      props: { allowCustom: true, label: E('Diagnóstico (puede ser libre)', 'Diagnosis (may be free)'), hint: E('Si no está en la lista, escríbelo.', 'If it is not in the list, type it.') }
    },
    {
      title: E('Paleta con vista previa', 'Palette with a preview'),
      why: E('appearance palette enseña la opción con su descripción en un panel mayor; útil con códigos y detalle, sobra con etiquetas simples.', 'appearance palette shows the option with its description in a larger panel; useful with codes and detail, overkill for plain labels.'),
      props: { appearance: 'palette' }
    },
    {
      title: E('Varias alergias a la vez', 'Several allergies at once'),
      why: E('multiple guarda un arreglo de valores y los muestra en la línea del campo; para una sola elección deja el modo simple.', 'multiple stores an array of values and shows them on the field line; for a single choice keep the simple mode.'),
      props: {
        multiple: true, label: E('Alergias', 'Allergies'), placeholder: E('Buscar alergia', 'Search allergy'), hint: '',
        options: {
          es: [{ value: 'penicilina', label: 'Penicilina' }, { value: 'latex', label: 'Látex' }, { value: 'polen', label: 'Polen' }, { value: 'mariscos', label: 'Mariscos' }, { value: 'ibuprofeno', label: 'Ibuprofeno' }],
          en: [{ value: 'penicilina', label: 'Penicillin' }, { value: 'latex', label: 'Latex' }, { value: 'polen', label: 'Pollen' }, { value: 'mariscos', label: 'Shellfish' }, { value: 'ibuprofeno', label: 'Ibuprofen' }]
        }
      },
      model: ['penicilina', 'latex']
    },
    {
      title: E('Elección obligatoria con error', 'Required choice with an error'),
      why: E('required y error al enviar sin elegir; el aviso se enlaza al campo.', 'required and error on submit without choosing; the message is linked to the field.'),
      props: { required: true, error: E('Elige un diagnóstico del catálogo.', 'Choose a diagnosis from the catalog.') }
    }
  ]
}
