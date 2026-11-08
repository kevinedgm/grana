// Ficha interactiva de GSwitch. Controles desde GSwitch.meta.json.
export default {
  exclude: ['id', 'warning', 'valid'],
  model: { value: true, var: 'activo' },
  text: ['label', 'hint', 'error'],
  base: { label: { es: 'Guardado automático', en: 'Autosave' }, hint: { es: 'El cambio se aplica al instante.', en: 'The change applies at once.' } },
  cases: [
    {
      title: { es: 'Ajuste que se aplica al instante', en: 'Setting that applies at once' },
      why: { es: 'Un interruptor es efecto inmediato: si el cambio necesita «Guardar», usa GCheckbox.', en: 'A switch is an immediate effect: if the change needs “Save”, use GCheckbox.' },
      props: {}
    },
    {
      title: { es: 'Guardando en el servidor', en: 'Saving to the server' },
      why: { es: 'loading no bloquea el interruptor: tu aplicación decide si revierte cuando falla.', en: 'loading does not block the switch: your app decides whether to revert on failure.' },
      props: { loading: true }
    },
    {
      title: { es: 'Ajuste con riesgo', en: 'Risky setting' },
      why: { es: 'color danger y la etiqueta delante (label-position start) en una lista de ajustes alineada a la derecha.', en: 'danger color and the label first (label-position start) in a right-aligned settings list.' },
      props: { color: 'danger', labelPosition: 'start' }
    }
  ]
}
