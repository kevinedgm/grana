// GCalendar · motor de layout, disponibilidad y conflictos (dueño: bruno)
// Puro y sin DOM: el mismo cálculo para todas las vistas.
import { addDays, dayKey, dow, hhmmToMin, zoned } from './time.js'

/** Tramo de un evento dentro de un día, en minutos desde las 00:00 de ese día (zona `tz`). */
export function segmentOf(ev, key, tz, now) {
  const ds = zoned(key, 0, tz)
  const de = zoned(addDays(key, 1), 0, tz)
  const s = +ev.start
  // Evento abierto: de su inicio a la hora actual (mínimo 30 minutos)
  const e = ev.end ? +ev.end : Math.max(+now, s + 30 * 60000)
  if (e <= +ds || s >= +de) return null
  const cs = Math.max(s, +ds)
  const ce = Math.min(e, +de)
  return { ev, startMin: (cs - +ds) / 60000, endMin: (ce - +ds) / 60000, continuesBefore: s < +ds, continuesAfter: e > +de, open: !ev.end, start: new Date(cs), end: new Date(ce) }
}

/**
 * Reparte los tramos en carriles dentro de su grupo de conflicto (traslape).
 * `minMin` es el alto mínimo visual en minutos: cuenta para que un evento corto no se dibuje encima de otro.
 * No mezcla, oculta ni desplaza artificialmente.
 */
export function assignLanes(segs, minMin) {
  segs.sort((a, b) => a.startMin - b.startMin || b.endMin - a.endMin)
  let cluster = []
  let clusterEnd = -1
  let laneEnds = []
  const close = () => {
    for (const s of cluster) s.lanes = laneEnds.length
    cluster = []
    laneEnds = []
    clusterEnd = -1
  }
  for (const s of segs) {
    if (cluster.length && s.startMin >= clusterEnd) close()
    const visualEnd = Math.max(s.endMin, s.startMin + minMin)
    let lane = laneEnds.findIndex((end) => end <= s.startMin)
    if (lane < 0) {
      lane = laneEnds.length
      laneEnds.push(0)
    }
    laneEnds[lane] = visualEnd
    s.lane = lane
    cluster.push(s)
    clusterEnd = Math.max(clusterEnd, visualEnd)
  }
  close()
  return segs
}

/**
 * Franjas NO disponibles de un recurso en un día, en minutos, recortadas a [fromMin, toMin].
 * - Sin reglas para el recurso: sin restricciones (lista vacía).
 * - Una regla con `date` sustituye a las de `dayOfWeek` ese día; `available: false` = día sin disponibilidad.
 */
export function unavailableBands(rules, resourceId, key, fromMin, toMin) {
  const mine = rules.filter((r) => r.resourceId === resourceId)
  if (!mine.length) return []
  const dated = mine.filter((r) => r.date === key)
  const applicable = dated.length ? dated : mine.filter((r) => !r.date && (r.dayOfWeek == null || r.dayOfWeek === dow(key)))
  const windows = []
  for (const r of applicable) {
    if (r.available === false) continue
    let open = [[hhmmToMin(r.startTime), hhmmToMin(r.endTime)]]
    for (const p of r.pauses || []) {
      const a = hhmmToMin(p.startTime)
      const b = hhmmToMin(p.endTime)
      open = open.flatMap(([s, e]) => (b <= s || a >= e ? [[s, e]] : [[s, Math.min(a, e)], [Math.max(b, s), e]].filter(([x, y]) => y > x)))
    }
    windows.push(...open)
  }
  windows.sort((a, b) => a[0] - b[0])
  const bands = []
  let cursor = fromMin
  for (const [s, e] of windows) {
    if (s > cursor) bands.push([cursor, Math.min(s, toMin)])
    cursor = Math.max(cursor, e)
    if (cursor >= toMin) break
  }
  if (cursor < toMin) bands.push([cursor, toMin])
  return bands.filter(([a, b]) => b > a)
}

/** ¿Está disponible el recurso durante [start, end)? (sin reglas: sí). */
export function isWithinAvailability(rules, resourceId, start, end, tz) {
  const mine = rules.filter((r) => r.resourceId === resourceId)
  if (!mine.length) return true
  const key = dayKey(start, tz)
  const ds = zoned(key, 0, tz)
  const sMin = (+start - +ds) / 60000
  const eMin = (+end - +ds) / 60000
  if (eMin > 1440) return false
  return unavailableBands(rules, resourceId, key, 0, 1440).every(([a, b]) => eMin <= a || sMin >= b)
}

/**
 * Conflictos de un cambio propuesto (crear, mover o redimensionar).
 * Devuelve `[{ type, conflictingEvents? }]`. El componente solo informa; la aplicación decide.
 */
export function detectConflicts({ event, start, end, resourceId, events, blocks, availability, tz }) {
  const out = []
  if (!(+end > +start) || +end - +start < 60000) out.push({ type: 'invalidDuration' })
  const others = events.filter((o) => o.id !== event.id && o.end && !o.allDay && o.resources.includes(resourceId))
  const hit = others.filter((o) => +start < +o.end && +end > +o.start)
  if (hit.length) out.push({ type: 'overlap', conflictingEvents: hit.map((o) => o.raw) })
  if (blocks.some((b) => b.resourceId === resourceId && +start < +b.end && +end > +b.start)) out.push({ type: 'blockedTime' })
  if (!isWithinAvailability(availability, resourceId, start, end, tz)) out.push({ type: 'outsideAvailability' })
  // Un evento con varios recursos: el mismo periodo debe caber en cada uno de ellos
  if (event.resources.length > 1) {
    const clash = event.resources.filter((r) => r !== resourceId && events.some((o) => o.id !== event.id && o.end && o.resources.includes(r) && +start < +o.end && +end > +o.start))
    if (clash.length) out.push({ type: 'resourceConflict', conflictingResources: clash })
  }
  return out
}
