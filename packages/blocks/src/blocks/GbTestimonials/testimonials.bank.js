// Banco único de GbTestimonials (dueño: bruno; testimonials.md «Banco», _comun.md §7): el mismo juego de datos pasa igual
// por las tres variantes en Vitest, en el playground y en el spec. Cuatro opiniones: dos en español (Google; TripAdvisor
// con href externo), una en inglés con lang="en" y dos párrafos, y una mínima (quote, author.name y source.label sin
// href, sin foto). Sin errores a propósito: con él, ninguna variante avisa.
import { LONG_WORD, foto } from '../bank/fotos.js'

export const props = {
  title: 'Lo que dicen quienes ya vinieron',
  description: 'Opiniones enteras, en su idioma y con su fuente.',
  items: [
    {
      id: 'lucia',
      quote: `Despertar con el patio lleno de luz y el chocolate de metate ya servido. Nos ayudaron con todo, hasta con el mezcal para llevar; ${LONG_WORD}.`,
      author: { name: 'Lucía Hernández', role: 'Viajó en pareja', avatar: foto('patio', 160, 160) },
      source: { label: 'Google, septiembre de 2026', href: '#opiniones-google' }
    },
    {
      id: 'marco',
      quote: 'La terraza al atardecer vale el viaje. Habitación tranquila aunque está a dos calles de Santo Domingo.',
      author: { name: 'Marco Ruiz', role: 'Viaje de trabajo', avatar: foto('terraza', 160, 160) },
      source: { label: 'TripAdvisor', href: 'https://www.tripadvisor.com/', external: true }
    },
    {
      id: 'emily',
      lang: 'en',
      quote: 'We booked two nights and stayed five. The staff walked us to the market on our first morning and wrote down where to eat.\n\nThe rooms are quiet, the beds are wonderful, and the rooftop at sunset is the best view in the city.',
      author: { name: 'Emily Clarke', role: 'Toronto' },
      source: { label: 'Google, August 2026', href: 'https://maps.google.com/?q=Casa+Alcala+Oaxaca', external: true }
    },
    {
      quote: 'Volveríamos mañana.',
      author: { name: 'Rosa' },
      source: { label: 'Libro de visitas de la casa' }
    }
  ],
  labels: { external: 'se abre en otra pestaña' }
}

export const slots = {}
