// GbBlogList · las notas listas para pintar, compartido por las tres variantes (dueño: bruno; blog-list.md «Fechas»,
// «Tarjeta = enlace», avisos C1 a C7, P1 y P2; #825 «lo vigente se distingue de lo viejo»).
// Fecha: `<time datetime="{iso}">` con `Intl.DateTimeFormat(locale, { dateStyle: 'long' })`. Se lee la fecha tal como la
// escribió la aplicación (AAAA-MM-DD del principio del ISO, con hora o sin ella) y se formatea en UTC: así «2026-10-03» es
// el 3 de octubre en cualquier zona horaria y el servidor y el navegador dicen lo mismo (con el mismo `locale`).
import { computed } from 'vue'
import { useItems } from '../common/list.js'
import { checkMedia } from '../common/media.js'
import { isUnsafeHref, safeHref } from '../common/navigate.js'
import { has } from '../common/text.js'
import { MAX_POSTS } from './props.js'

const ISO = /^(\d{4})-(\d{2})-(\d{2})(?:$|[T\s])/

/** La fecha (día) de un ISO 8601, o null si `Date` no la lee. */
export function readDate(iso) {
  if (typeof iso !== 'string') return null
  const s = iso.trim()
  const m = ISO.exec(s)
  if (!m || Number.isNaN(Date.parse(s))) return null
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])))
  return d.getUTCMonth() === Number(m[2]) - 1 && d.getUTCDate() === Number(m[3]) ? d : null
}

/** Fecha larga en el idioma pedido (sin valor o con uno que Intl no admite, el del entorno). */
export function formatDate(d, locale) {
  const opts = { dateStyle: 'long', timeZone: 'UTC' }
  try { return new Intl.DateTimeFormat(locale || undefined, opts).format(d) } catch { return new Intl.DateTimeFormat(undefined, opts).format(d) }
}

const fill = (label, date) => (typeof label === 'function' ? label({ date }) : String(label).replace(/\{date\}/g, date))

/** `media`: 'all' (01), 'first' (03: solo la destacada) o 'none' (02); solo se comprueba (C4) la foto que se pinta. */
export function usePosts(props, warn, { media = 'none' } = {}) {
  const list = useItems(() => props.posts, { required: ['title', 'href', 'date'], what: 'posts', range: [1, MAX_POSTS], warn })
  return computed(() => list.value.map((e, position) => {
    const p = e.item
    const at = `posts[${e.index}]`
    // Fecha visible: la de `updated` si existe (con «Actualizado …»), si no la de publicación
    const published = readDate(p.date)
    const updated = has(p.updated) ? readDate(p.updated) : null
    const iso = has(p.updated) ? p.updated : p.date
    const read = has(p.updated) ? updated : published
    let text = read ? formatDate(read, props.locale) : String(iso)
    try {
      if (process.env.NODE_ENV !== 'production') {
        if (!published) warn(`P1:${at}:date`, `${at}.date «${p.date}» no es una fecha que se lea: se pinta tal cual (P1).`)
        if (has(p.updated) && !updated) warn(`P1:${at}:updated`, `${at}.updated «${p.updated}» no es una fecha que se lea: se pinta tal cual (P1).`)
        if (published && updated && updated < published) warn(`P2:${at}`, `${at}.updated es anterior a date (P2).`)
      }
    } catch {}
    if (has(p.updated)) {
      const label = props.labels && props.labels.updated
      if (typeof label === 'function' || has(label)) text = fill(label, text)
      else {
        try { if (process.env.NODE_ENV !== 'production') warn('C5:updated', 'hay notas con updated y falta labels.updated («Actualizado {date}»): se pinta la fecha sin prefijo (C5).') } catch {}
      }
    }
    const time = { datetime: read ? String(iso).trim() : undefined, text }

    // Tarjeta = enlace (GCard interaction="link"); externa: otra pestaña y sin navigate (#574); javascript: sin enlace (C6)
    const href = safeHref(p.href)
    let card = { interaction: 'none' }
    let external = false
    let externalLabel
    if (!href) {
      try { if (process.env.NODE_ENV !== 'production' && isUnsafeHref(p.href)) warn(`C6:${at}`, `${at}.href es javascript:; la tarjeta se pinta sin enlace (C6).`) } catch {}
    } else if (p.external) {
      externalLabel = props.labels && has(props.labels.external) ? props.labels.external : undefined
      try { if (process.env.NODE_ENV !== 'production' && !externalLabel) warn('C5:external', 'hay una nota externa y falta labels.external («se abre en otra pestaña»): la marca queda decorativa (C5).') } catch {}
      card = { interaction: 'link', href, target: '_blank', rel: 'noopener' }
      external = true
    } else card = { interaction: 'link', href }

    const m = p.media && typeof p.media === 'object' && has(p.media.src) ? p.media : null
    const withMedia = media === 'all' || (media === 'first' && position === 0)
    if (m && withMedia) checkMedia(m, `${at}.media`, warn)
    const tags = Array.isArray(p.tags) ? p.tags.filter(has) : []
    return { ...e, time, card, external, externalLabel, media: withMedia ? m : null, tags }
  }))
}
