// Ficha interactiva de GSelect. Controles desde GSelect.meta.json.
export default {
  exclude: ['id', 'name', 'warning', 'valid', 'createLabel', 'clearLabel', 'emptyText'],
  ignore: ['create'], // con escucha de create la lista ofrece «crear»; se enseña aparte en el README
  model: { value: 'cardio', var: 'area' },
  text: ['label', 'placeholder', 'hint', 'error'],
  base: {
    label: { es: 'Área', en: 'Department' },
    placeholder: { es: 'Elige un área', en: 'Choose a department' },
    clearLabel: { es: 'Quitar área', en: 'Clear department' },
    options: [
      { value: 'cardio', label: 'Cardiología' },
      { value: 'pedia', label: 'Pediatría' },
      { value: 'farma', label: 'Farmacia' },
      { value: 'urgencias', label: 'Urgencias', disabled: true }
    ]
  },
  cases: [
    {
      title: { es: 'Campo de formulario con ayuda', en: 'Form field with a hint' },
      why: { es: 'label siempre (Grana no trae texto), hint para lo que el usuario necesita saber antes de elegir.', en: 'Always a label (Grana ships no text), hint for what the user needs before choosing.' },
      props: { hint: { es: 'Escribe para saltar a una opción.', en: 'Type to jump to an option.' } }
    },
    {
      title: { es: 'Filtro opcional que se puede vaciar', en: 'Optional filter that can be cleared' },
      why: { es: 'clearable con clear-label: el botón de quitar necesita nombre accesible.', en: 'clearable with clear-label: the clear button needs an accessible name.' },
      props: { clearable: true, variant: 'soft' }
    },
    {
      title: { es: 'Error de validación', en: 'Validation error' },
      why: { es: 'error pinta el aviso y lo enlaza al campo con aria-describedby; quítalo en cuanto se corrija.', en: 'error paints the message and links it with aria-describedby; remove it once fixed.' },
      props: { error: { es: 'Elige un área para continuar.', en: 'Choose a department to continue.' }, required: true }
    }
  ]
}
