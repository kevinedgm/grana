// GbItinerary · la `Props` de la sección (dueño: bruno; design/contracts/blocks/itinerary.md, _comun.md §1 regla 3, §15,
// #860, #874). Un solo objeto, importado por las tres variantes.
export const props = {
  title: { type: String, required: true },
  description: { type: String, default: undefined },
  days: { type: Array, required: true },
  timeZone: { type: String, default: undefined },
  locale: { type: String, default: undefined },
  labels: { type: Object, default: () => ({}) }
}

// Ninguno: un programa no tiene intención que atender (los textos de las paradas son texto plano, sin enlaces)
export const emits = []

/** Rangos recomendados (C7): días por itinerario y paradas por día. */
export const DAYS = [1, 14]
export const STOPS = [1, 30]
