// GbItinerary · lo que comparten las tres variantes (dueño: bruno; itinerary.md, avisos C1 a C4, C7, I1 a I3 y C5 de
// now/next y de las cabeceras de 03).
//
// «Ahora» por la hora del lugar (itinerary.md «Ahora…», #874): solo si algún día tiene `date` igual a HOY en `timeZone`
// (sin `timeZone`, la del navegador, I1). Se calcula en `onMounted` y al volver la página a primer plano
// (`visibilitychange` a `visible`); NUNCA con un temporizador (2.2.2) ni en el servidor (SSR sin marca). La parada cuyo
// intervalo [time, end ?? siguiente time) contiene la hora del lugar es «ahora» y la siguiente, «siguiente»; antes de la
// primera, solo «siguiente» en la primera; después de la última (o en una última parada sin `end`, sin límite), nada. No
// desplaza la página ni abre nada.
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { dateTime, useLocale } from '../common/booking.js'
import { entries, useItems } from '../common/list.js'
import { checkMedia } from '../common/media.js'
import { has } from '../common/text.js'
import { clock, minutes } from '../common/clock.js'
import { DAYS, STOPS } from './props.js'

export { clock, minutes }

/** Hoy (AAAA-MM-DD) y la hora (minutos) en `timeZone` (o en la del navegador). */
export function placeNow(timeZone, now = new Date()) {
  const o = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }
  let parts
  try { parts = new Intl.DateTimeFormat('en-CA', has(timeZone) ? { ...o, timeZone } : o).formatToParts(now) } catch { parts = new Intl.DateTimeFormat('en-CA', o).formatToParts(now) }
  const p = Object.fromEntries(parts.map((x) => [x.type, x.value]))
  return { date: `${p.year}-${p.month}-${p.day}`, minutes: (Number(p.hour) % 24) * 60 + Number(p.minute) }
}

/** La marca de un día: `{ now, next }` (claves de parada) para la hora `m`. `stops`: [{ key, start, end }] en orden. */
export function markDay(stops, m) {
  const timed = stops.filter((s) => s.start !== null)
  for (let i = 0; i < timed.length; i++) {
    const s = timed[i]
    const end = s.end !== null ? s.end : (timed[i + 1] ? timed[i + 1].start : null)
    if (m < s.start) return { now: null, next: s.key }
    if (end !== null && m < end) return { now: s.key, next: timed[i + 1] ? timed[i + 1].key : null }
  }
  return { now: null, next: null }
}

export function useItinerary(props, warn, variant) {
  const locale = useLocale(props)
  const L = computed(() => props.labels || {})
  const list = useItems(() => props.days, { required: ['label'], what: 'days', range: DAYS, warn })

  const days = computed(() => {
    const loc = locale.value
    try { if (process.env.NODE_ENV !== 'production' && !has(props.timeZone) && list.value.some((e) => has(e.item.date))) warn('I1', 'hay días con date y falta timeZone: el «ahora» se calcula con la zona del navegador, que puede no ser la del lugar (I1).') } catch {}
    return list.value.map((e) => {
      const day = e.item
      const at = `days[${e.index}].stops`
      const raw = Array.isArray(day.stops) ? day.stops : []
      try { if (process.env.NODE_ENV !== 'production' && (raw.length < STOPS[0] || raw.length > STOPS[1])) warn(`C7:${at}`, `${at} con ${raw.length} paradas; se recomiendan de ${STOPS[0]} a ${STOPS[1]} (C7).`) } catch {}
      let last = -1
      const stops = entries(raw, ['title'], at, warn).map((s) => {
        const stop = s.item
        const start = minutes(stop.time)
        const end = has(stop.end) ? minutes(stop.end) : null
        try {
          if (process.env.NODE_ENV !== 'production') {
            if ((has(stop.time) && start === null) || (has(stop.end) && end === null)) warn(`I2:${at}[${s.index}]`, `${at}[${s.index}]: time/end «${stop.time || stop.end}» no es HH:mm; se pinta tal cual y sin «ahora» para esa parada (I2).`)
            if (start !== null && start < last) warn(`I3:${at}`, `${at}: paradas fuera de orden por time; se pintan en el orden del arreglo (I3).`)
          }
        } catch {}
        if (start !== null) last = start
        if (variant !== '03' && stop.media && has(stop.media.src)) checkMedia(stop.media, `${at}[${s.index}].media`, warn)
        const valid = start !== null && (!has(stop.end) || end !== null)
        return {
          key: s.key,
          stop,
          start: valid ? start : null,
          end: valid ? end : null,
          time: has(stop.time) ? { datetime: start !== null ? stop.time.trim() : undefined, text: clock(stop.time, loc) } : null,
          until: has(stop.end) ? { datetime: end !== null ? stop.end.trim() : undefined, text: clock(stop.end, loc) } : null,
          media: variant !== '03' && stop.media && has(stop.media.src) ? stop.media : null
        }
      })
      return { key: e.key, day, date: has(day.date) ? dateTime(day.date, { locale: loc }) : null, stops }
    })
  })

  // La marca: solo en el cliente, al montar y al volver a la página; nunca con temporizador
  const mark = ref({ day: null, now: null, next: null })
  function compute() {
    const today = placeNow(props.timeZone)
    const d = days.value.find((x) => x.day.date === today.date)
    mark.value = d ? { day: d.key, ...markDay(d.stops, today.minutes) } : { day: null, now: null, next: null }
  }
  const onVisible = () => { if (document.visibilityState === 'visible') compute() }
  onMounted(() => {
    compute()
    document.addEventListener('visibilitychange', onVisible)
  })
  onBeforeUnmount(() => { if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', onVisible) })

  /** «now» | «next» | null de una parada. */
  const markOf = (dayKey, stopKey) => (mark.value.day !== dayKey ? null : mark.value.now === stopKey ? 'now' : mark.value.next === stopKey ? 'next' : null)
  /** El texto de la insignia (labels.now / labels.next); C5 al necesitarlo. */
  const badge = (m) => {
    if (!m) return ''
    const t = L.value[m]
    if (!has(t)) {
      try { if (process.env.NODE_ENV !== 'production') warn(`C5:${m}`, `falta labels.${m}: la parada lleva aria-current pero sin insignia (C5).`) } catch {}
      return ''
    }
    return t
  }
  return { locale, days, mark, markOf, badge, compute }
}
