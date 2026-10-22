// GbFaq · la `Props` de la sección (dueño: bruno; design/contracts/blocks/faq.md, _comun.md §1 regla 3, #815, #823). Un
// solo objeto, importado por las tres variantes. Los `labels` solo los usa 03 (el buscador); 01 y 02 los ignoran.
export const props = {
  title: { type: String, required: true },
  description: { type: String, default: undefined },
  items: { type: Array, required: true },
  labels: { type: Object, default: () => ({}) }
}

// Ningún evento propio: abrir y cerrar es estado del acordeón y buscar no es intención para la aplicación (faq.md)
export const emits = []

/** Rango recomendado (C7). */
export const RANGE = [1, 40]

/** La cuenta de la búsqueda se dice 300 ms después de la última tecla (como resource-list.md). */
export const SEARCH_MS = 300
