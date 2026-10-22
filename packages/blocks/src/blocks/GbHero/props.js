// GbHero · la `Props` de la sección (dueño: bruno; design/contracts/blocks/hero.md, _comun.md §1 regla 3, #763, #815).
// Un solo objeto, importado por las tres variantes: su igualdad no depende de copiarlas bien.
export const props = {
  title: { type: String, required: true },
  eyebrow: { type: String, default: undefined },
  lead: { type: String, default: undefined },
  aside: { type: String, default: undefined },
  media: { type: Object, required: true },
  detail: { type: Object, default: undefined },
  views: { type: Array, default: undefined },
  actions: { type: Array, default: () => [] },
  labels: { type: Object, default: () => ({}) }
}

export const emits = ['navigate', 'activate']
