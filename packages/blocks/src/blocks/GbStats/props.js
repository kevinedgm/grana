// GbStats · la `Props` de la sección (dueño: bruno; design/contracts/blocks/stats.md, _comun.md §1 regla 3, #815).
// Un solo objeto, importado por las tres variantes. Sin eventos ni `labels`: todo el texto viene en los datos.
export const props = {
  title: { type: String, required: true },
  description: { type: String, default: undefined },
  items: { type: Array, required: true }
}

export const emits = []

/** Rango recomendado (C7). */
export const RANGE = [2, 6]
