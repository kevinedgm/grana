// Banco único de GbItinerary (dueño: bruno; itinerary.md «Banco», _comun.md §7 y §20): el mismo juego de datos pasa igual por
// las tres variantes en Vitest, en el playground y en el spec. Sin errores a propósito: con él, ninguna variante avisa.
// Tour Monte Albán (America/Mexico_City): dos días con date; el primero con seis paradas (07:45 punto de encuentro, 08:30
// llegada… 13:00 comida con end), una con foto y place, una con un nombre largo sin espacios; un texto en inglés (§7: en la
// descripción no hay idioma; va en el place del segundo día, que la aplicación da en español). `labels` completos.
import { LONG_WORD, media } from '../bank/fotos.js'

export const props = {
  title: 'Programa del recorrido',
  description: 'Monte Albán y Arrazola en dos días; todas las horas son de Oaxaca.',
  timeZone: 'America/Mexico_City',
  locale: 'es',
  days: [
    {
      id: 'dia-1',
      label: 'Día 1 · Monte Albán',
      date: '2026-11-14',
      summary: 'Zona arqueológica por la mañana y comida en Arrazola',
      stops: [
        { id: 'encuentro', time: '07:45', title: 'Punto de encuentro', description: 'Frente a la puerta de Casa Alcalá', place: 'Macedonio Alcalá 307' },
        { id: 'llegada', time: '08:30', title: 'Llegada a Monte Albán', description: 'Entramos antes que los grupos grandes', place: 'Acceso principal', media: media('calle', 1200, 800) },
        { id: 'plaza', time: '09:00', end: '10:30', title: 'Gran Plaza', description: 'Recorrido guiado por los edificios principales' },
        { id: 'museo', time: '10:45', title: 'Museo de sitio', description: `Piezas de la tumba 7; ${LONG_WORD}` },
        { id: 'arrazola', time: '12:00', title: 'Taller de alebrijes', place: 'San Antonio Arrazola' },
        { id: 'comida', time: '13:00', end: '14:30', title: 'Comida', description: 'Mole negro en casa de la familia Morales', place: 'Arrazola' }
      ]
    },
    {
      id: 'dia-2',
      label: 'Día 2 · Mercado',
      date: '2026-11-15',
      stops: [
        { id: 'mercado', time: '09:00', end: '11:00', title: 'Mercado 20 de Noviembre', place: 'Centro histórico' },
        { id: 'regreso', time: '11:15', end: '11:30', title: 'Regreso al hotel' }
      ]
    }
  ],
  labels: {
    now: 'Ahora',
    next: 'Siguiente',
    time: 'Hora',
    stop: 'Parada',
    place: 'Lugar'
  }
}

export const slots = {}
