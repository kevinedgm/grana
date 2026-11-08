// Ficha interactiva de GInput. Los controles salen de GInput.meta.json; aquí solo lo que el ejemplo necesita.
import { h } from 'vue'
import { GIcon } from '@grana/vue'

const E = (es, en) => ({ es, en })

export default {
  // output, prefix y suffix tienen su propio caso en la guía; id enlaza etiqueta y ayuda y lo genera el componente.
  exclude: ['id', 'output', 'prefix', 'suffix', 'prefixLabel', 'suffixLabel', 'warning', 'valid'],
  model: { value: '', var: 'correo' },
  text: ['label', 'hint', 'error'],
  base: {
    label: E('Correo', 'Email'),
    hint: E('Te enviaremos el comprobante de tu cita.', 'We will send you the appointment receipt.'),
    showPasswordLabel: E('Mostrar contraseña', 'Show password'),
    hidePasswordLabel: E('Ocultar contraseña', 'Hide password')
  },
  slots: [
    { name: 'prepend', optional: true, on: false, code: '<g-icon name="search" />', render: () => h(GIcon, { name: 'search' }) }
  ],
  cases: [
    {
      title: E('Campo de correo con validación', 'Email field with validation'),
      why: E('type="email" abre el teclado correcto en el móvil; error pinta el aviso y se enlaza al campo, quítalo en cuanto se corrija.', 'type="email" opens the right mobile keyboard; error paints the message and links it to the field, remove it as soon as it is fixed.'),
      props: { type: 'email', required: true, block: true, error: E('Escribe un correo válido, por ejemplo ana@clinica.mx.', 'Enter a valid email, for example ana@clinic.com.') }
    },
    {
      title: E('Contraseña que se puede mostrar', 'Password that can be revealed'),
      why: E('type="password" añade el botón de mostrar; sus dos nombres accesibles los pones tú. No lo uses en códigos de un solo uso, que se ven al teclearlos.', 'type="password" adds the reveal button; you provide its two accessible names. Do not use it for one-time codes, which should be visible while typing.'),
      props: { type: 'password', label: E('Contraseña', 'Password'), hint: '' }
    },
    {
      title: E('Búsqueda con icono', 'Search with an icon'),
      why: E('variant soft y un icono en prepend para una búsqueda dentro de una barra; si el campo vive en un formulario, mejor outline.', 'variant soft and an icon in prepend for a search inside a toolbar; if the field lives in a form, prefer outline.'),
      props: { type: 'search', variant: 'soft', label: E('Buscar paciente', 'Search patient'), hint: '' }, slots: { prepend: true }
    },
    {
      title: E('Comprobando en el servidor', 'Checking on the server'),
      why: E('loading indica una comprobación en curso sin bloquear la escritura; úsalo mientras validas, no para cargar la página.', 'loading signals a check in progress without blocking typing; use it while validating, not for page loading.'),
      props: { loading: true, hint: E('Comprobando que el correo esté libre…', 'Checking that the email is available…') }
    },
    {
      title: E('Dato que no se edita', 'Value that cannot be edited'),
      why: E('readonly se envía y se puede seleccionar y copiar; disabled no se envía. Elige según si el dato debe viajar con el formulario.', 'readonly is submitted and can be selected and copied; disabled is not submitted. Choose by whether the value must travel with the form.'),
      props: { readonly: true, label: E('Folio de la cita', 'Appointment number'), hint: E('Se asigna al confirmar.', 'Assigned on confirmation.') }
    }
  ]
}
