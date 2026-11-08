// Ficha interactiva de GDataList. Controles desde GDataList.meta.json.
export default {
  text: ['label'],
  block: true,
  base: {
    label: { es: 'Visitas por canal', en: 'Visits by channel' },
    rows: [
      { label: 'Directo', value: '48%' },
      { label: 'Búsqueda', value: '31%' },
      { label: 'Referidos', value: '14%' },
      { label: 'Correo', value: '7%' }
    ]
  },
  code: { rows: ':rows="rows"' },
  cases: [
    {
      title: { es: 'Distribución con color por fila', en: 'Distribution with a color per row' },
      why: { es: 'swatches pone una muestra de color que enlaza cada fila con una gráfica; sin gráfica al lado, no hace falta.', en: 'swatches adds a color sample that links each row to a chart; without a chart beside it, it is not needed.' },
      props: { swatches: true }
    },
    {
      title: { es: 'Detalles de un pedido', en: 'Order details' },
      why: { es: 'Pares etiqueta–valor sin muestras: una ficha de datos para leer, no una tabla para ordenar.', en: 'Label–value pairs without swatches: a data sheet to read, not a table to sort.' },
      props: { label: { es: 'Detalles del pedido', en: 'Order details' }, rows: [{ label: 'Pedido', value: '#10482' }, { label: 'Fecha', value: '12 oct 2026' }, { label: 'Envío', value: 'Paquetería estándar' }] }
    }
  ]
}
