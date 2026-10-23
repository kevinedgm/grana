// GbPromo · la `Props` de la sección (dueño: bruno; design/contracts/blocks/promo.md, _comun.md §1 regla 3, §27, #909,
// #925). Un solo objeto, importado por las tres variantes. `media` solo la usa 02.
export const props = {
  title: { type: String, required: true },
  description: { type: String, default: undefined },
  media: { type: Object, default: undefined },
  actions: { type: Array, required: true },
  until: { type: String, default: undefined },
  timeZone: { type: String, default: undefined },
  code: { type: Object, default: undefined },
  terms: { type: String, default: undefined },
  locale: { type: String, default: undefined },
  labels: { type: Object, default: () => ({}) }
}

export const emits = ['navigate', 'activate']
