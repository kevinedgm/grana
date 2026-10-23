// GbCategoryPreviews · lo que comparten las tres variantes (dueño: bruno; category-previews.md «Anatomía», avisos C1 a C7 y
// CP1). Cada categoría lista para pintar: enlace a su página o, vacía (count 0), sin interacción y con `labels.empty` en el
// lugar de la cuenta (una puerta a una sala vacía cuesta un viaje con datos móviles, #917); la cuenta con el idioma.
import { computed } from 'vue'
import { useItems } from '../common/list.js'
import { useLocale, fill } from '../common/locale.js'
import { checkMedia } from '../common/media.js'
import { isUnsafeHref, safeHref } from '../common/navigate.js'
import { countText } from '../common/ecommerce.js'
import { has } from '../common/text.js'
import { MAX_CATEGORIES } from './props.js'

/** `media`: si la variante pinta la foto (01, 02; CP1 sin ella). `description`: si la pinta (02 la ignora). */
export function useCategoryPreviews(props, warn, { media = true, description = true } = {}) {
  const locale = useLocale(props)
  const L = computed(() => props.labels || {})
  const list = useItems(() => props.categories, { required: ['name', 'href'], what: 'categories', range: [1, MAX_CATEGORIES], warn })
  const rows = computed(() => list.value.map((e) => {
    const c = e.item
    const at = `categories[${e.index}]`
    const m = media && c.media && typeof c.media === 'object' && has(c.media.src) ? c.media : null
    if (m) checkMedia(m, `${at}.media`, warn)
    try { if (process.env.NODE_ENV !== 'production' && media && !m) warn(`CP1:${e.index}`, `${at} sin media: se pinta sin media (CP1).`) } catch {}
    const n = Number.isInteger(c.count) && c.count >= 0 ? c.count : null
    let count = ''
    if (n === 0) {
      count = has(L.value.empty) ? L.value.empty : ''
      try { if (process.env.NODE_ENV !== 'production' && !count) warn('C5:empty', 'hay una categoría vacía (count 0) y falta labels.empty («Vuelve pronto»): se pinta sin el aviso (C5).') } catch {}
    } else if (n !== null) {
      const t = L.value.count
      count = typeof t === 'function' ? String(t(n)) : has(t) ? fill(t, { count: countText(n, locale.value) }) : ''
      try { if (process.env.NODE_ENV !== 'production' && !count) warn('C5:count', 'hay categorías con count y falta labels.count («{count} piezas»): se pintan sin la cuenta (C5).') } catch {}
    }
    // Vacía: sin interacción (no es enlace). Sin count no se sabe y la tarjeta es enlace.
    let card = { interaction: 'none' }
    let external = false
    const href = safeHref(c.href)
    if (!href) {
      try { if (process.env.NODE_ENV !== 'production' && isUnsafeHref(c.href)) warn(`C6:${at}`, `${at} tiene un href javascript:; la tarjeta queda sin interacción (C6).`) } catch {}
    } else if (n !== 0) {
      if (c.external) {
        external = true
        card = { interaction: 'link', href, target: '_blank', rel: 'noopener' }
        try { if (process.env.NODE_ENV !== 'production' && !has(L.value.external)) warn('C5:external', 'hay una categoría externa y falta labels.external («se abre en otra pestaña»): la marca queda decorativa (C5).') } catch {}
      } else card = { interaction: 'link', href }
    }
    return { key: e.key, category: c, media: m, count, card, external, description: description && has(c.description) ? c.description : '' }
  }))
  return { locale, rows }
}
