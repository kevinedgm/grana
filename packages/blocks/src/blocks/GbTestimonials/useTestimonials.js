// Lógica común de las tres variantes de GbTestimonials (dueño: bruno; testimonials.md, #821). Avisos C1 a C3, C7, T1 y
// T2 (C5 y C6 los da GbActions al pintar la fuente). La cita no se recorta nunca: se parte en párrafos y se pinta entera.
import { computed } from 'vue'
import { useItems } from '../common/list.js'
import { safeHref } from '../common/navigate.js'
import { has, paragraphs } from '../common/text.js'
import { LONG_QUOTE, RANGE } from './props.js'

export function useTestimonials(props, warn) {
  const list = useItems(() => props.items, { required: ['quote', 'author'], range: RANGE, warn })
  return computed(() => list.value.flatMap((e) => {
    const { item, index } = e
    // `author.name` es obligatorio (C2), como `quote`
    if (!item.author || typeof item.author !== 'object' || !has(item.author.name)) {
      try { if (process.env.NODE_ENV !== 'production') warn(`C2:items:${index}`, `items[${index}] sin author.name: se omite (C2).`) } catch {}
      return []
    }
    const source = item.source && typeof item.source === 'object' && has(item.source.label) ? item.source : null
    try { if (process.env.NODE_ENV !== 'production' && !source) warn('T1', `la opinión de «${item.author.name}» no lleva source: se pinta, pero no se puede comprobar (T1).`) } catch {}
    try { if (process.env.NODE_ENV !== 'production' && item.quote.length > LONG_QUOTE) warn('T2', `la cita de «${item.author.name}» pasa de ${LONG_QUOTE} caracteres: se pinta entera; mejor un fragmento con el enlace a la opinión completa (T2).`) } catch {}
    const paras = paragraphs(item.quote)
    // La fuente como acción de GbActions: enlace (`navigate` o externa) o, con javascript:, GBtn deshabilitado (C6)
    const sourceAction = source && has(source.href) ? [{ label: source.label, href: source.href, external: Boolean(source.external) }] : null
    const cite = (source && safeHref(source.href)) || undefined
    return [{ ...e, paras, first: paras[0] || item.quote, source, sourceAction, cite, lang: has(item.lang) ? item.lang : undefined }]
  }))
}
