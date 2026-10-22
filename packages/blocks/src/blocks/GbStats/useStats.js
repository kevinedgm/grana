// Lógica común de las tres variantes de GbStats (dueño: bruno; stats.md). Avisos C1 a C3, C7, S1 y S2.
import { computed, onMounted } from 'vue'
import { useItems } from '../common/list.js'
import { has } from '../common/text.js'
import { RANGE } from './props.js'

export function useStats(props, warn) {
  const list = useItems(() => props.items, { required: ['label', 'value'], range: RANGE, warn })
  // El valor se pinta tal cual: el bloque no formatea, no redondea y no anima (#820)
  const rows = computed(() => list.value.map((e) => {
    try { if (process.env.NODE_ENV !== 'production' && !has(e.item.source)) warn('S1', `la cifra «${e.item.label}» no lleva source: se pinta igual, pero sin su origen (S1).`) } catch {}
    return { ...e, value: String(e.item.value), context: has(e.item.source) ? e.item.source : undefined }
  }))
  // S2: dos bandas de marca compiten (R5)
  onMounted(() => {
    try {
      if (process.env.NODE_ENV !== 'production' && typeof document !== 'undefined' && document.querySelectorAll('[data-gb="stats-02"], [data-gb="cta-01"]').length > 1) {
        warn('S2', 'hay más de una banda de marca (GbStats02 o GbCta01) en el documento: compiten por la atención (S2).')
      }
    } catch {}
  })
  return rows
}
