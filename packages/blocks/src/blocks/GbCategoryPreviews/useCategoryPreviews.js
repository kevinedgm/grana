// GbCategoryPreviews · lo que comparten las tres variantes (dueño: bruno; category-previews.md «Anatomía», avisos C1 a C7 y
// CP1). Cada categoría lista para pintar: enlace a su página o, vacía (count 0), sin interacción y con `labels.empty` en el
// lugar de la cuenta (una puerta a una sala vacía cuesta un viaje con datos móviles, #917); el título completo con la cuenta lo compone la aplicación (#928).
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
    // El título entero lo compone la aplicación (labels.count / labels.empty con {name}); el bloque no escribe separadores.
    // `title` = [antes, después] alrededor del nombre (el nombre lleva su lang), o null: solo el nombre.
    let title = null
    const t = n === 0 ? L.value.empty : n !== null ? L.value.count : undefined
    const which = n === 0 ? 'empty' : 'count'
    if (n !== null && (typeof t === 'function' || has(t))) {
      const vars = { name: c.name, count: n === null ? '' : countText(n, locale.value) }
      if (typeof t === 'function') {
        const s = String(n === 0 ? t(c.name) : t(c.name, n))
        const i = s.indexOf(c.name)
        if (i >= 0) title = [s.slice(0, i), s.slice(i + c.name.length)]
      } else if (t.includes('{name}')) {
        const [head, ...rest] = t.split('{name}')
        title = [fill(head, vars), fill(rest.join('{name}'), vars)]
      }
      try { if (process.env.NODE_ENV !== 'production' && !title) warn(`CP2:${which}`, `labels.${which} no lleva el nombre (${which === 'count' ? '«{name} · {count} piezas»' : '«{name} · Vuelve pronto»'}): se pinta el nombre solo (CP2).`) } catch {}
    } else {
      try { if (process.env.NODE_ENV !== 'production' && n === 0) warn('C5:empty', 'hay una categoría vacía (count 0) y falta labels.empty («{name} · Vuelve pronto»): se pinta el nombre solo (C5).') } catch {}
      try { if (process.env.NODE_ENV !== 'production' && n !== null && n !== 0) warn('C5:count', 'hay categorías con count y falta labels.count («{name} · {count} piezas»): se pintan sin la cuenta (C5).') } catch {}
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
    return { key: e.key, category: c, media: m, title, card, external, description: description && has(c.description) ? c.description : '' }
  }))
  return { locale, rows }
}
