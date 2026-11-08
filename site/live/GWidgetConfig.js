// Ficha interactiva de GWidgetConfig. Controles desde GWidgetConfig.meta.json. Es un diálogo: un botón lo abre.
import { h } from 'vue'
import { GInput, GMetric, GNumberField, GWidget } from '@grana/vue'

const widgetLabels = { actions: 'Acciones de' }
const vista = () => h(GWidget, { title: 'Ingresos', eyebrow: 'Finanzas', description: 'Últimos 30 días', level: 'm', labels: widgetLabels }, () => h(GMetric, { label: 'Ingresos', value: '$48.2k', size: 'lg' }))

export default {
  exclude: ['id', 'tab', 'errors'],
  controls: ['size', 'density', 'dirty', 'resettable', 'applying'],
  text: ['title', 'description'],
  model: { value: false, var: 'abierto' },
  trigger: { label: { es: 'Configurar widget', en: 'Configure widget' }, value: true },
  base: {
    title: { es: 'Configurar Ingresos', en: 'Configure Revenue' },
    description: { es: 'Los cambios se ven en la vista previa antes de aplicarlos.', en: 'Changes show in the preview before you apply them.' },
    tabs: [{ id: 'data', label: 'Datos' }, { id: 'set', label: 'Ajustes' }],
    labels: {
      tabs: 'Secciones de la configuración', apply: 'Aplicar', cancel: 'Cancelar', close: 'Cerrar sin aplicar', reset: 'Restablecer',
      discardTitle: '¿Descartar los cambios?', keepEditing: 'Seguir editando', discard: 'Descartar',
      errorSummary: 'Campos por corregir: {count}', errorCount: 'Errores: {count}'
    }
  },
  code: { tabs: ':tabs="tabs"', labels: ':labels="textos"' },
  script: "const tabs = [{ id: 'data', label: 'Datos' }, { id: 'set', label: 'Ajustes' }]\n// textos: tus labels ({ tabs, apply, cancel, close, reset, discardTitle, keepEditing, discard, … })",
  slots: [
    {
      name: 'preview',
      code: '<g-widget title="Ingresos" level="m" :labels="{ actions: \'Acciones de\' }">\n  <g-metric label="Ingresos" value="$48.2k" size="lg" />\n</g-widget>',
      render: vista
    },
    {
      name: 'tab-data',
      code: '<g-number-field id="cfg-goal" v-model="meta" label="Meta mensual" prefix="$" :min="0" />',
      render: () => h(GNumberField, { id: 'cfg-goal', label: 'Meta mensual', prefix: '$', min: 0, precision: 0, locale: 'es-MX', modelValue: 50000 })
    },
    {
      name: 'tab-set',
      code: '<g-input id="cfg-title" v-model="titulo" label="Título" />',
      render: () => h(GInput, { id: 'cfg-title', label: 'Título', modelValue: 'Ingresos' })
    }
  ],
  cases: [
    {
      title: { es: 'Editar un widget con vista previa', en: 'Editing a widget with a preview' },
      why: { es: 'Los campos van en un borrador y la vista previa lo refleja: el usuario ve el resultado antes de Aplicar. Tu aplicación guarda; el diálogo solo emite apply.', en: 'Fields go into a draft and the preview reflects it: the user sees the result before Apply. Your app saves; the dialog only emits apply.' },
      props: {}
    },
    {
      title: { es: 'Con cambios sin aplicar', en: 'With unapplied changes' },
      why: { es: 'dirty hace que cerrar pida confirmación («¿Descartar los cambios?»); resettable añade «Restablecer». Sin cambios, cerrar es inmediato.', en: 'dirty makes closing ask for confirmation (“Discard changes?”); resettable adds “Reset”. With no changes, closing is immediate.' },
      props: { dirty: true, resettable: true }
    },
    {
      title: { es: 'Aplicando en el servidor', en: 'Applying on the server' },
      why: { es: 'applying pone la acción en carga mientras tu aplicación guarda; cierra el diálogo tú cuando termine.', en: 'applying puts the action in loading while your app saves; close the dialog yourself when it finishes.' },
      props: { dirty: true, applying: true }
    },
    {
      title: { es: 'Corrección de campos', en: 'Fixing fields' },
      why: { es: 'errors lista los campos inválidos con su pestaña: el resumen enlaza cada error con su campo y cuenta los errores por pestaña.', en: 'errors lists the invalid fields with their tab: the summary links each error to its field and counts errors per tab.' },
      props: { dirty: true, errors: [{ tab: 'data', field: 'cfg-goal', message: 'La meta debe ser un número mayor que 0.' }] }
    }
  ]
}
