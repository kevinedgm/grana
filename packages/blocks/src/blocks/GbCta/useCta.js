// Lógica común de las tres variantes de GbCta (dueño: bruno; cta.md, #822). Avisos propios A1 y A2; C2, C5, C6 y C8 los
// da GbActions al pintar las acciones; C4, la variante 02 (la única que pinta `media`).
import { computed, onMounted, useId } from 'vue'
import { has } from '../common/text.js'

export function useCta(props, warn) {
  const uid = useId()
  // `assurance` va unida a la acción principal: aria-describedby del primer GBtn apunta a este id
  const assuranceId = computed(() => (has(props.assurance) ? `${uid}-assurance` : undefined))
  const actions = computed(() => {
    const list = Array.isArray(props.actions) ? props.actions : []
    try { if (process.env.NODE_ENV !== 'production' && !list.length) warn('A1', 'actions está vacía: se pinta sin acción, y una llamada a la acción sin acción no sirve (A1).') } catch {}
    return list
  })
  // A2: una sola llamada a la acción por página además del héroe, y una sola banda de marca (R5)
  onMounted(() => {
    try {
      if (process.env.NODE_ENV !== 'production' && typeof document !== 'undefined') {
        const ctas = document.querySelectorAll('[data-gb^="cta-"]').length
        const bands = document.querySelectorAll('[data-gb="cta-01"], [data-gb="stats-02"]').length
        if (ctas > 1 || bands > 1) warn('A2', 'hay más de un GbCta, o un GbCta01 junto a un GbStats02, en el documento: una sola llamada a la acción por página y una sola banda de marca (A2).')
      }
    } catch {}
  })
  return { actions, assuranceId }
}
