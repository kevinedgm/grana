// GbMenu · la `Props` de la sección (dueño: bruno; design/contracts/blocks/menu.md, _comun.md §1 regla 3, §15, #860,
// #875). Un solo objeto, importado por las tres variantes.
export const props = {
  title: { type: String, required: true },
  description: { type: String, default: undefined },
  sections: { type: Array, required: true },
  prices: { type: Object, required: true },
  locale: { type: String, default: undefined },
  labels: { type: Object, required: true }
}

// La carta no tiene intención (pedir es de la aplicación): ningún evento
export const emits = []

/** Topes recomendados (C7): tiempos por carta y platos por tiempo. */
export const MAX_SECTIONS = 12
export const MAX_ITEMS = 40
