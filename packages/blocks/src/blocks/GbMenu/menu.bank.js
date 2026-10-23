// Banco único de GbMenu (dueño: bruno; menu.md «Banco», _comun.md §7 y §20): el mismo juego de datos pasa igual por las
// tres variantes en Vitest, en el playground y en el spec. Sin errores a propósito: con él, ninguna variante avisa. El
// restaurante de la casa (carta, sin consulta): tres tiempos y nueve platos; uno con el nombre en zapoteco (`lang`), uno
// con tres avisos, uno agotado hoy, uno con precio «a consultar» (null), uno «por pieza», tres con foto y una palabra
// sin espacios para la prueba de 320 px.
import { LONG_WORD, media } from '../bank/fotos.js'
import { PRICE_LABELS } from '../bank/booking.js'

const mxn = (amount) => ({ amount, currency: 'MXN' })

export const props = {
  title: 'La carta',
  description: 'Cocina oaxaqueña de temporada; el maíz es criollo y se nixtamaliza en casa.',
  prices: { currency: 'MXN', taxes: 'IVA incluido' },
  locale: 'es',
  sections: [
    {
      id: 'desayuno',
      name: 'Desayuno',
      hours: 'de 8:00 a 12:00',
      items: [
        { id: 'chocolate', name: 'Chocolate de agua con pan de yema', description: 'Molido en metate; el pan, de la panadería de la esquina.', price: { value: mxn(95) }, media: media('desayuno', 1200, 800) },
        { id: 'enfrijoladas', name: 'Enfrijoladas', description: 'Con cecina, quesillo y cebolla morada.', price: { value: mxn(165) }, tags: ['Contiene lácteos', 'Picante', 'Sin gluten'] },
        { id: 'memelas', name: 'Memelas', description: 'Con asiento y frijol; se piden sueltas.', price: { value: mxn(38), unit: 'por pieza', unitLabel: 'por pieza' } }
      ]
    },
    {
      id: 'comida',
      name: 'Comida',
      description: 'Desde las 13:00, mientras haya.',
      items: [
        { id: 'mole', name: 'Mole negro', description: 'Con pollo de rancho y arroz blanco.', price: { value: mxn(245) }, tags: ['Contiene nuez'], media: media('patio', 1200, 800) },
        { id: 'tlayuda', name: 'Tlayuda', description: `Con tasajo, quesillo y chepiche; ${LONG_WORD}.`, price: { value: mxn(210) }, available: 'Agotado hoy' },
        { id: 'nicuatole', name: 'Nicuatole', lang: 'zap', description: 'Postre de maíz y grana cochinilla.', price: { value: mxn(70) }, tags: ['Sin gluten'] }
      ]
    },
    {
      id: 'cena',
      name: 'Cena',
      items: [
        { id: 'pesca', name: 'Pesca del día', description: 'Llega de Puerto Ángel por la mañana; pregunta cuál es.', price: { value: null } },
        { id: 'mezcal', name: 'Copa de mezcal', description: 'Espadín o tobalá de la casa.', price: { value: mxn(120) }, media: media('mezcal', 1200, 800) },
        { id: 'minimo', name: 'Agua de jamaica' }
      ]
    }
  ],
  labels: {
    tabs: 'Tiempos de la carta',
    tags: 'Contiene',
    unavailable: 'Agotado hoy',
    hours: 'Se sirve',
    price: { ...PRICE_LABELS, onRequest: 'Precio del día' }
  }
}

export const slots = {}
