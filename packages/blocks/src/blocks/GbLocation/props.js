// GbLocation · la `Props` de la sección (dueño: bruno; design/contracts/blocks/location.md, _comun.md §1 regla 3, §15,
// #860, #876). Un solo objeto, importado por las tres variantes.
export const props = {
  title: { type: String, required: true },
  description: { type: String, default: undefined },
  name: { type: String, default: undefined },
  address: { type: Array, default: undefined },
  hours: { type: Array, default: undefined },
  map: { type: Object, default: undefined },
  directions: { type: Object, default: undefined },
  channels: { type: Array, default: undefined },
  points: { type: Array, default: undefined },
  timeZone: { type: String, default: undefined },
  locale: { type: String, default: undefined },
  labels: { type: Object, default: () => ({}) }
}

// `navigate` de los enlaces internos (§4) y `activate` de una acción sin href; `tel:`, `geo:` y los externos no navegan
export const emits = ['navigate', 'activate']

/** Puntos de encuentro recomendados (C7). */
export const MAX_POINTS = 8
