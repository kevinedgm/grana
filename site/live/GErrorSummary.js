// Ficha interactiva de GErrorSummary. Fuera de GForm recibe `errors`.
export default {
  exclude: ['errors', 'headingLevel', 'labels'],
  block: true,
  ignore: ['navigate'],
  base: {
    errors: [
      { name: 'titular', message: { es: 'Escribe el nombre del titular', en: 'Enter the cardholder name' } },
      { name: 'vigencia', message: { es: 'Escribe la vigencia con el formato MM/AA', en: 'Enter the expiry as MM/YY' } }
    ],
    labels: { title: { es: 'Hay {count} problemas con el registro', en: 'There are {count} problems with the registration' } }
  },
  cases: [
    {
      title: { es: 'Resumen al inicio del formulario', en: 'Summary at the top of the form' },
      why: { es: 'Un enlace por pregunta con el mismo texto que el error en línea; tras un envío con errores recibe el foco. Dentro de GForm no se pasa `errors`: los lee solo.', en: 'One link per question with the same text as the inline error; after a failed submit it receives focus. Inside GForm you do not pass `errors`: it reads them itself.' }
    },
    {
      title: { es: 'Con un solo error', en: 'With a single error' },
      why: { es: 'El título lleva la cantidad; con un error, escribe el singular con labels.title como función.', en: 'The title carries the count; with one error, write the singular with labels.title as a function.' },
      props: { errors: [{ name: 'acepto', message: { es: 'Acepta el aviso de privacidad para continuar', en: 'Accept the privacy notice to continue' } }], labels: { title: { es: 'Hay {count} problema con el registro', en: 'There is {count} problem with the registration' } } }
    }
  ]
}
