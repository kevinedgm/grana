// Horas del lugar en `HH:mm` (dueño: bruno; _comun.md §15 regla 6, §16 `Stop`, `Point`): el dato llega ya en la hora del
// lugar; el bloque solo lo dice en el formato del idioma (12 h o 24 h). Lo usan Itinerary y Location (parte B).
import { has } from './text.js'

const HM = /^([01]\d|2[0-3]):([0-5]\d)$/
/** Minutos desde las 00:00 de un `HH:mm`, o null. */
export const minutes = (t) => {
  const m = typeof t === 'string' ? HM.exec(t.trim()) : null
  return m ? Number(m[1]) * 60 + Number(m[2]) : null
}

/** El texto de un `HH:mm` en el formato del idioma; sin idioma resuelto (SSR), tal cual. Lo que no es `HH:mm`, tal cual. */
export function clock(t, locale) {
  const m = minutes(t)
  if (m === null) return t
  if (!has(locale)) return t.trim()
  try {
    return new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' }).format(new Date(Date.UTC(2000, 0, 1, Math.floor(m / 60), m % 60)))
  } catch { return t.trim() }
}
