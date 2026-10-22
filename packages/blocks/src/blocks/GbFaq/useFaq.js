// Lógica común de las tres variantes de GbFaq (dueño: bruno; faq.md, #823). Avisos C1 a C3, C7, Q1 y Q2. Cada pregunta
// lleva su ancla estable (`faq.id`) en el GAccordionItem (01, 03; abre con #id, #482) o en la GSection anidada (02).
import { computed } from 'vue'
import { useItems } from '../common/list.js'
import { has, paragraphs } from '../common/text.js'
import { RANGE } from './props.js'

/** Un id que sirve de fragmento: sin espacios ni `#`. */
export const validAnchor = (id) => typeof id === 'string' && /^[^\s#]+$/.test(id)

/** Texto para buscar: sin mayúsculas ni diacríticos (NFD sin marcas). */
export const fold = (s) => String(s).normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()

export function useFaq(props, warn) {
  const list = useItems(() => props.items, { required: ['question', 'answer'], range: RANGE, warn })
  return computed(() => list.value.map((e) => {
    const { item, key } = e
    let anchor
    if (!has(item.id)) {
      try { if (process.env.NODE_ENV !== 'production') warn('Q1', `la pregunta «${item.question}» no lleva id: sin ancla estable no se puede enlazar (Q1).`) } catch {}
    } else if (!validAnchor(item.id)) {
      try { if (process.env.NODE_ENV !== 'production') warn(`Q2:${String(item.id)}`, `el id «${String(item.id)}» no es un identificador de fragmento válido (sin espacios ni #): se pinta sin ancla (Q2).`) } catch {}
    } else if (typeof key === 'string' && key.startsWith('id:')) {
      // Con un id repetido (C3) solo el primero lleva el ancla
      anchor = item.id
    }
    const paras = paragraphs(item.answer)
    return { ...e, anchor, paras, peek: paras[0] || item.answer, hay: fold(`${item.question}\n${item.answer}`) }
  }))
}
