// GbLocation · lo que comparten las tres variantes (dueño: bruno; location.md, avisos C4 a C7, L1 a L3). La dirección es
// texto que se copia (1.1.1, 1.4.5); el mapa, una imagen estática con un alt que DICE el sitio (L2); «Cómo llegar», la
// primera acción del bloque. `variant`: '01' | '02' | '03' (01 y 02 ignoran `points` con L3; 03 ignora `map`).
import { computed } from 'vue'
import { dateTime, useLocale } from '../common/booking.js'
import { entries } from '../common/list.js'
import { checkMedia } from '../common/media.js'
import { has } from '../common/text.js'
import { clock, minutes } from '../common/clock.js'
import { MAX_POINTS } from './props.js'

const lines = (v) => (Array.isArray(v) ? v.filter(has) : [])
/** Un alt que solo dice «mapa» no describe el sitio (R8). */
export const bareMapAlt = (alt) => !has(alt) || /^\s*(mapa|map|mapa del lugar|mapa de ubicaci[oó]n|location map)\s*\.?\s*$/i.test(alt)

export function useLocation(props, warn, variant) {
  const locale = useLocale(props)
  const L = computed(() => props.labels || {})

  const points = computed(() => {
    const raw = Array.isArray(props.points) ? props.points : []
    if (variant !== '03') return []
    try { if (process.env.NODE_ENV !== 'production' && raw.length > MAX_POINTS) warn('C7', `points con ${raw.length} puntos; se recomiendan hasta ${MAX_POINTS}: se pintan todos (C7).`) } catch {}
    return entries(raw, ['name'], 'points', warn).map((e) => {
      const p = e.item
      if (p.media && has(p.media.src)) checkMedia(p.media, `points[${e.index}].media`, warn)
      // La hora del lugar: HH:mm tal cual en el formato del idioma; una fecha y hora ISO, en la zona del lugar
      let time = null
      if (has(p.time)) time = minutes(p.time) !== null ? { datetime: p.time.trim(), text: clock(p.time, locale.value) } : dateTime(p.time, { locale: locale.value, timeZone: props.timeZone, weekday: false })
      return { ...e, time, address: lines(p.address), media: p.media && has(p.media.src) ? p.media : null, directions: p.directions && typeof p.directions === 'object' ? [p.directions] : [] }
    })
  })

  const address = computed(() => lines(props.address))
  /** C5: falta el texto que el estado necesita; se pinta sin él. */
  const label = (key, when) => {
    if (!when) return ''
    if (has(L.value[key])) return L.value[key]
    try { if (process.env.NODE_ENV !== 'production') warn(`C5:${key}`, `falta labels.${key}: se pinta sin ese texto (C5).`) } catch {}
    return ''
  }
  const hours = computed(() => {
    const list = lines(props.hours)
    return { list, label: label('hours', list.length) }
  })
  const channels = computed(() => {
    const list = entries(props.channels, ['label', 'href'], 'channels', warn)
    return { list, label: label('channels', list.length) }
  })
  const map = computed(() => {
    if (variant === '03' || !props.map || !has(props.map.src)) return null
    checkMedia(props.map, 'map', warn)
    try { if (process.env.NODE_ENV !== 'production' && !props.map.decorative && bareMapAlt(props.map.alt)) warn('L2', `map.alt «${props.map.alt || ''}» no describe el sitio: di dónde está («A dos calles de Santo Domingo, esquina con Alcalá»), no «mapa» (L2).`) } catch {}
    return { media: props.map, label: label('map', variant === '02') }
  })
  const pointsTitle = computed(() => label('points', variant === '03' && points.value.length))
  const directions = computed(() => (props.directions && typeof props.directions === 'object' ? [props.directions] : []))
  try {
    if (process.env.NODE_ENV !== 'production') {
      const pts = Array.isArray(props.points) && props.points.length
      if (!lines(props.address).length && !pts) warn('L1', 'sin address ni points: no hay a dónde ir; se pinta lo que haya (L1).')
      // L3 solo cuando los puntos son todo lo que hay (sin address): el mismo banco pasa por las tres sin avisar (§1 regla 3)
      else if (variant !== '03' && pts && !lines(props.address).length) warn('L3', `points no se usa en ${variant} y no hay address: no queda a dónde ir; para un recorrido, 03 · Puntos de encuentro (L3).`)
    }
  } catch {}
  return { locale, L, address, hours, channels, map, directions, points, pointsTitle }
}
