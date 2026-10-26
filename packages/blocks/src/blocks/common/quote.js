// La anatomía de una cita (dueño: bruno; testimonials.md «Anatomía de una opinión», reviews.md «Anatomía de una opinión»,
// _comun.md §11 B-L5 y §32). Interno del paquete: la usa Reviews (E6) y es la misma de Testimonials (Marketing), que hoy
// la escribe en su TestimonialFigure.js (llevarla aquí cambiaría dist/marketing.js; pendiente para el cierre del lote).
//   GText as="figure" (size body-sm en tarjeta)
//   ├─ [antes] lo que va delante de la cita dentro de la figura (la puntuación en palabras de una opinión)
//   ├─ GText as="blockquote" [lang] [cite]   ← párrafos (o el contenido rico de la aplicación), nunca recortados
//   └─ GText as="figcaption" size="body-sm" tone="muted"
import { h } from 'vue'
import { GText } from '@grana/vue'

/** La `figure` de una cita. `body` y `caption` son hijos ya pintados; `before`, lo que va antes del `blockquote`. */
export function quoteFigure({ card = false, lang, cite, before, body, caption }) {
  const size = card ? 'body-sm' : 'body'
  return h(GText, { as: 'figure', size }, () => [
    before || null,
    h(GText, { as: 'blockquote', size, lang, cite }, () => body),
    h(GText, { as: 'figcaption', size: 'body-sm', tone: 'muted' }, () => caption)
  ])
}
