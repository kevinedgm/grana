// GbPolicies · la `Props` de la sección (dueño: bruno; design/contracts/blocks/policies.md, _comun.md §1 regla 3, §15,
// #860, #877). Un solo objeto, importado por las tres variantes.
export const props = {
  title: { type: String, required: true },
  description: { type: String, default: undefined },
  items: { type: Array, required: true },
  labels: { type: Object, default: () => ({}) }
}

// `navigate` de los `link` internos (§4); los externos no emiten (#574)
export const emits = ['navigate']

/** Rango recomendado (C7). */
export const RANGE = [1, 20]
