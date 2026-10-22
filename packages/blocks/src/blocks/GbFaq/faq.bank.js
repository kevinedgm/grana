// Banco único de GbFaq (dueño: bruno; faq.md «Banco», _comun.md §7): el mismo juego de datos pasa igual por las tres
// variantes en Vitest, en el playground y en el spec. Ocho preguntas con id, una respuesta de tres párrafos, una en
// inglés con la palabra larga, una mínima de una frase; labels completos. Sin errores a propósito: con él, ninguna
// variante avisa. Búsquedas de prueba: «mascota» (1), «MASCOTA» (1), «nino» con «niños» en el texto (1), «xyz» (vacío).
import { LONG_WORD } from '../bank/fotos.js'

export const props = {
  title: 'Preguntas frecuentes',
  description: 'Lo que suelen preguntarnos por WhatsApp antes de llegar.',
  items: [
    { id: 'mascotas', question: '¿Aceptan perros o gatos?', answer: 'Sí, una mascota pequeña por habitación, avisando al reservar.\n\nNo cobramos suplemento; solo pedimos que no se quede sola en el cuarto.' },
    { id: 'estacionamiento', question: '¿Hay estacionamiento?', answer: 'No en la casa. Hay un estacionamiento público a una calle, abierto las 24 horas, y te damos el pase con descuento al llegar.' },
    { id: 'llegada', question: '¿A qué hora puedo llegar?', answer: 'La habitación está lista a partir de las 15:00.\n\nSi llegas antes, guardamos tus maletas y te servimos un café en el patio mientras tanto.\n\nPara llegar después de las 23:00, escríbenos por WhatsApp y te dejamos la llave en la recepción.' },
    { id: 'desayuno', question: '¿El desayuno está incluido?', answer: 'Sí: chocolate de metate, pan de yema, fruta del mercado y un plato caliente del día, de 8:00 a 11:00.' },
    { id: 'ninos', question: '¿Pueden venir los pequeños?', answer: 'Claro. Los niños menores de cinco años no pagan, y tenemos cuna bajo petición.' },
    { id: 'cancelacion', question: '¿Puedo cancelar?', answer: 'Sin costo hasta 72 horas antes de la llegada. Después cobramos la primera noche.' },
    { id: 'factura', question: '¿Emiten factura?', answer: 'Sí.' },
    { id: 'idiomas', question: 'Do you speak English?', answer: `Yes, the whole team speaks English, and we are happy to help you plan your days in Oaxaca; ${LONG_WORD}.` }
  ],
  labels: {
    search: 'Buscar en las preguntas',
    matches: '{count} de {total} preguntas',
    none: 'Ninguna pregunta coincide',
    clear: 'Borrar búsqueda'
  }
}

export const slots = {}
