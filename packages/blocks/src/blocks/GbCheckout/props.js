// GbCheckout · la `Props` de la sección (dueño: bruno; design/contracts/blocks/checkout.md, _comun.md §1 regla 3, §27,
// #909, #913, #922). Un solo objeto, importado por las tres variantes.
export const props = {
  title: { type: String, required: true },
  steps: { type: Array, required: true },
  step: { type: String, default: undefined },
  values: { type: Object, default: undefined },
  order: { type: Object, required: true },
  prices: { type: Object, required: true },
  busy: { type: Boolean, default: false },
  errors: { type: Object, default: undefined },
  error: { type: String, default: undefined },
  locale: { type: String, default: undefined },
  labels: { type: Object, required: true }
}

export const emits = ['submit', 'update:step', 'update:values', 'navigate']

/** Tipos de campo de Checkout: los de Guest form más `choice` (GRadioGroup appearance="card" con precio, §28). */
export const TYPES = ['text', 'email', 'tel', 'textarea', 'select', 'date', 'choice']
/** Pasos recomendados (C7: de 2 a 5). */
export const STEPS_RANGE = [2, 5]
