// Ficha interactiva de GDialog. Controles desde GDialog.meta.json.
import { h } from 'vue'
import { GBtn } from '@grana/vue'

const en = () => typeof document !== 'undefined' && document.documentElement.lang.startsWith('en')

export default {
  // bare ignora el pie y avisa; steps, from e id son de los niveles anidados y del foco de retorno.
  exclude: ['bare', 'steps', 'from', 'id', 'labels'],
  model: { prop: 'modelValue', value: false, var: 'abierto' },
  trigger: { label: { es: 'Abrir diálogo', en: 'Open dialog' }, value: true },
  text: ['title', 'description', 'closeLabel'],
  base: {
    title: { es: 'Editar contacto', en: 'Edit contact' },
    description: { es: 'Se actualiza en las citas futuras.', en: 'Applies to future appointments.' },
    closeLabel: { es: 'Cerrar', en: 'Close' }
  },
  slots: [
    { name: 'default', text: { es: 'Lucía Fernández · 5512345678', en: 'Lucía Fernández · 5512345678' } },
    {
      name: 'footer', scope: '{ close }', optional: true, on: true,
      code: {
        es: '<g-btn variant="outline" @click="close">Cancelar</g-btn>\n<g-btn @click="close">Guardar</g-btn>',
        en: '<g-btn variant="outline" @click="close">Cancel</g-btn>\n<g-btn @click="close">Save</g-btn>'
      },
      render: ({ close }) => [
        h(GBtn, { variant: 'outline', onClick: close }, () => (en() ? 'Cancel' : 'Cancelar')),
        h(GBtn, { onClick: close }, () => (en() ? 'Save' : 'Guardar'))
      ]
    }
  ],
  cases: [
    {
      title: { es: 'Formulario corto con su contexto', en: 'Short form with context' },
      why: {
        es: 'size sm, título y descripción: el título nombra la tarea y la descripción dice qué cambia. Si el formulario necesita varias pantallas, usa niveles o una página.',
        en: 'size sm, title and description: the title names the task and the description says what changes. If the form needs several screens, use steps or a page.'
      },
      props: { size: 'sm' }
    },
    {
      title: { es: 'Confirmar una baja', en: 'Confirm a removal' },
      why: {
        es: 'role alertdialog y closeOnBackdrop apagado: un clic perdido en el fondo no debe descartar una decisión grave. Úsalo solo para confirmar; para informar, un aviso.',
        en: 'role alertdialog with closeOnBackdrop off: a stray click on the backdrop must not dismiss a serious decision. Use it only to confirm; to inform, use a toast.'
      },
      props: {
        role: 'alertdialog', size: 'sm', closeOnBackdrop: false,
        title: { es: '¿Dar de baja a Lucía Fernández?', en: 'Remove Lucía Fernández?' },
        description: { es: 'Sus citas futuras se cancelarán.', en: 'Their future appointments will be canceled.' }
      }
    },
    {
      title: { es: 'Guardando en el servidor', en: 'Saving to the server' },
      why: {
        es: 'loading marca aria-busy y una barra quieta; no bloquea nada: deshabilita tú las acciones mientras dura.',
        en: 'loading sets aria-busy and a still bar; it blocks nothing: disable the actions yourself while it lasts.'
      },
      props: { loading: true, size: 'sm' }
    },
    {
      title: { es: 'Panel lateral para revisar sin perder la página', en: 'Side panel to review without leaving the page' },
      why: {
        es: 'placement end y size lg para detalle largo; en teléfono pasa a pantalla completa. Si el contenido es corto, el centrado basta.',
        en: 'placement end and size lg for long detail; on phones it becomes full screen. If the content is short, centered is enough.'
      },
      props: { placement: 'end', size: 'lg', mobile: 'fullscreen' }
    }
  ]
}
