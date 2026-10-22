// Banco único de GbBlogList (dueño: bruno; blog-list.md «Banco», _comun.md §7): el mismo juego de datos pasa igual por las
// tres variantes. La primera nota (la destacada de 03) trae foto y etiquetas. Sin errores a propósito: con él, ninguna
// variante avisa.
import { LONG_WORD, media } from '../bank/fotos.js'

export const props = {
  title: 'Para preparar tu viaje',
  description: 'Guías cortas escritas por la casa.',
  posts: [
    { id: 'guelaguetza', title: 'Guelaguetza 2026: fechas, boletos y dónde verla', href: '/notas/guelaguetza-2026', date: '2026-06-12', excerpt: 'Los dos lunes del cerro, cómo conseguir lugar en el auditorio y qué hacer si no alcanzas boleto.', media: media('calle', 1200, 800), tags: ['Fiestas', 'Julio'] },
    { id: 'aeropuerto', title: 'Cómo llegar desde el aeropuerto', href: '/notas/como-llegar', date: '2025-11-20', updated: '2026-10-03', excerpt: 'Taxi autorizado, colectivo o el traslado de la casa: tiempos y precios de esta temporada.' },
    { id: 'mezcal', title: 'Mezcal en Santiago Matatlán', href: '/notas/mezcal-matatlan', date: '2026-04-02T10:30:00-06:00', excerpt: 'Un día entre palenques, a 45 minutos de la ciudad.', media: media('mezcal', 1200, 800) },
    { id: 'palabra', title: `Glosario para el viajero: ${LONG_WORD}`, href: '/notas/glosario', date: '2026-02-14', excerpt: `Palabras que vas a oír en el mercado; ${LONG_WORD}.` },
    { id: 'revista', title: 'Casa Alcalá en la guía de hoteles pequeños de México', href: 'https://revista.example.com/oaxaca/casa-alcala', date: '2026-08-30', excerpt: 'La reseña de la revista, con fotos de la terraza.', external: true },
    { title: 'Horarios de Semana Santa', href: '/notas/semana-santa', date: '2026-03-01' }
  ],
  locale: 'es-MX',
  labels: { updated: 'Actualizado {date}', external: 'se abre en otra pestaña' }
}

export const slots = {}
