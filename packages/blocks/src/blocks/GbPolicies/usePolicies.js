// GbPolicies · lo que comparten las tres variantes (dueño: bruno; policies.md, modelo faq.md #823; avisos C1 a C3, C7, P1 y
// P2). Cada política lleva su ancla estable (`Policy.id`): en el GAccordionItem (01, abre con #id, #482), en la GSection
// anidada (02) o en la GCard (03). La línea que decide (`summary`) va a la vista en las tres; el texto completo (`body`, en
// párrafos) nunca se recorta.
import { computed } from 'vue'
import { useItems } from '../common/list.js'
import { has, paragraphs } from '../common/text.js'
import { RANGE } from './props.js'

/** Un id que sirve de fragmento: sin espacios ni `#`. */
export const validAnchor = (id) => typeof id === 'string' && /^[^\s#]+$/.test(id)

export function usePolicies(props, warn) {
  const list = useItems(() => props.items, { required: ['title', 'body'], range: RANGE, warn })
  return computed(() => list.value.map((e) => {
    const { item, key } = e
    let anchor
    if (has(item.id) && !validAnchor(item.id)) {
      try { if (process.env.NODE_ENV !== 'production') warn(`P2:${String(item.id)}`, `el id «${String(item.id)}» no sirve de ancla (sin espacios ni #): se pinta sin ancla (P2).`) } catch {}
    } else if (has(item.id) && typeof key === 'string' && key.startsWith('id:')) anchor = item.id // con un id repetido (C3), solo el primero
    const summary = has(item.summary) ? item.summary : ''
    if (!summary) {
      try { if (process.env.NODE_ENV !== 'production') warn('P1', `la política «${item.title}» no lleva summary: 01 asoma el primer párrafo y 02 y 03 no dicen la línea que decide (P1).`) } catch {}
    }
    const paras = paragraphs(item.body)
    const link = item.link && typeof item.link === 'object' && has(item.link.label) && has(item.link.href) ? item.link : null
    return { ...e, anchor, summary, paras, peek: summary || paras[0] || '', link }
  }))
}
