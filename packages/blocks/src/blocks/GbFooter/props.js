// GbFooter · la `Props` de la sección (dueño: bruno; design/contracts/blocks/footer.md, _comun.md §1 regla 3, #815, #826).
// Un solo objeto, importado por las tres variantes.
export const props = {
  brand: { type: Object, required: true },
  contact: { type: Object, default: undefined },
  groups: { type: Array, default: undefined },
  legal: { type: Array, default: undefined },
  social: { type: Array, default: undefined },
  note: { type: String, default: undefined },
  // 'footer' suelto; 'div' dentro del slot footer de GAppShell, que ya da el contentinfo (aviso O1)
  as: { type: String, default: 'footer', validator: (v) => ['footer', 'div'].includes(v) },
  labels: { type: Object, default: () => ({}) }
}

export const emits = ['navigate']

/** Tope recomendado de columnas (C7). */
export const MAX_GROUPS = 5
