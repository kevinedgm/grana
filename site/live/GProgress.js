// Ficha interactiva de GProgress.
export default {
  exclude: [],
  text: ['label', 'valueText'],
  base: {
    label: { es: 'Meta de ventas de octubre', en: 'October sales goal' },
    valueText: { es: '64 de 100 pólizas', en: '64 of 100 policies' },
    value: 64
  },
  cases: [
    {
      title: { es: 'Meta con texto propio', en: 'Goal with its own text' },
      why: { es: 'valueText dice el avance en palabras de tu dominio (pólizas, no %); el lector oye eso y no el porcentaje.', en: 'valueText states progress in your domain words (policies, not %); the reader hears that rather than the percentage.' },
      props: { value: 82, valueText: { es: '82 de 100 pólizas', en: '82 of 100 policies' } }
    },
    {
      title: { es: 'Almacenamiento casi lleno', en: 'Storage nearly full' },
      why: { es: 'color warning y size sm en una barra de ajustes; el color acompaña al texto, no lo sustituye.', en: 'warning color and size sm in a settings bar; color accompanies the text, it does not replace it.' },
      props: { value: 8.2, max: 10, color: 'warning', size: 'sm', label: { es: 'Almacenamiento usado', en: 'Storage used' }, valueText: { es: '8.2 de 10 GB', en: '8.2 of 10 GB' } }
    },
    {
      title: { es: 'Barra con etiqueta solo para el lector', en: 'Bar with a screen-reader-only label' },
      why: { es: 'showLabel y showValue en false cuando el contexto ya rotula la barra (p. ej. dentro de una fila de tabla).', en: 'showLabel and showValue off when the context already names the bar (e.g. inside a table row).' },
      props: { value: 40, showLabel: false, showValue: false, valueText: { es: '40 de 100', en: '40 of 100' } }
    }
  ]
}
