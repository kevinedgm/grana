// GbMenu · lo que comparten las tres variantes (dueño: bruno; menu.md «Un plato», avisos C1 a C4, C7, K3, M1 y M2).
// Cada tiempo con su ancla (`id`) y sus platos listos para pintar: el precio tal cual a GPrice (PriceSpec), los avisos en
// palabras (GTag estáticas y neutras), el idioma del nombre (`lang`, 3.1.2) y lo agotado hoy con su motivo (§15 regla 7).
// `variant`: '01' | '02' | '03'; solo 03 pinta `media` (C4 solo ahí).
import { computed } from 'vue'
import { availability, checkRegion, priceSpec } from '../common/booking.js'
import { entries, useItems } from '../common/list.js'
import { checkMedia } from '../common/media.js'
import { has } from '../common/text.js'
import { MAX_ITEMS, MAX_SECTIONS } from './props.js'

const moneys = (v) => (Array.isArray(v) ? v : v && typeof v === 'object' ? [v] : [])

export function useMenu(props, warn, variant) {
  const L = computed(() => props.labels || {})
  const list = useItems(() => props.sections, { required: ['name'], what: 'sections', range: [1, MAX_SECTIONS], warn })

  const sections = computed(() => {
    const ids = new Set()
    let anyTags = false
    let anyHours = false
    const out = list.value.map((e) => {
      const s = e.item
      const at = `sections[${e.index}]`
      // Ancla y pestaña: `id` del tiempo; en 02, ausente o repetido usa el índice (M2)
      let id = has(s.id) ? String(s.id) : ''
      if (!id || ids.has(id)) {
        try { if (process.env.NODE_ENV !== 'production' && variant === '02') warn(`M2:${e.index}`, `${at}.id ${id ? `«${id}» repetido` : 'ausente'}: la pestaña usa el índice (M2).`) } catch {}
        id = ''
      } else ids.add(id)
      const raw = Array.isArray(s.items) ? s.items : []
      try { if (process.env.NODE_ENV !== 'production' && raw.length > MAX_ITEMS) warn(`C7:${at}`, `${at}.items con ${raw.length} platos; se recomiendan hasta ${MAX_ITEMS}: se pintan todos (C7).`) } catch {}
      const items = entries(raw, ['name'], `${at}.items`, warn).map((d) => {
        const it = d.item
        const where = `${at}.items[${d.index}]`
        const price = priceSpec(it.price, `${where}.price`, warn)
        const cur = props.prices && props.prices.currency
        if (price && has(cur) && moneys(price.value).length && !moneys(price.value).some((m) => m && m.currency === cur)) {
          try { if (process.env.NODE_ENV !== 'production') warn(`M1:${where}`, `${where}.price en otra moneda que prices.currency («${cur}»): se pinta con su código (M1).`) } catch {}
        }
        const tags = Array.isArray(it.tags) ? it.tags.filter(has) : []
        if (tags.length) anyTags = true
        const media = variant === '03' && it.media && has(it.media.src) ? it.media : null
        if (media) checkMedia(media, `${where}.media`, warn)
        return { key: d.key, item: it, lang: has(it.lang) ? it.lang : undefined, price, tags, media, available: availability(it, L.value, where, warn) }
      })
      if (has(s.hours)) anyHours = true
      return { key: e.key, index: e.index, section: s, id, tab: id || `t${e.index}`, items }
    })
    try {
      if (process.env.NODE_ENV !== 'production') {
        if (anyTags && !has(L.value.tags)) warn('C5:tags', 'hay platos con tags y falta labels.tags («Contiene»): la lista de avisos va sin nombre (C5).')
        if (anyHours && !has(L.value.hours)) warn('C5:hours', 'hay tiempos con hours y falta labels.hours («Se sirve»): el horario va sin rótulo (C5).')
      }
    } catch {}
    return out
  })
  const region = computed(() => checkRegion(props.prices, sections.value.some((s) => s.items.some((d) => d.price)), warn))
  /** «Se sirve de 8:00 a 12:00»: el rótulo y el horario del tiempo (texto de la aplicación). */
  const hours = (s) => (has(s.hours) ? [L.value.hours, s.hours].filter(has).join(' ') : '')
  return { sections, region, hours }
}
