// GbSearch · la `Props` de la sección (dueño: bruno; design/contracts/blocks/search.md, _comun.md §1 regla 3, §15, #860,
// #867). Un solo objeto, importado por las tres variantes. Todo va tal cual a GBookingBar (mismos nombres que sus props);
// el bloque solo añade `note` y la apariencia.
export const props = {
  kind: { type: String, required: true },
  title: { type: String, required: true },
  partyRows: { type: Array, required: true },
  query: { type: Object, default: null },
  note: { type: String, default: undefined },
  min: { type: String, default: undefined },
  max: { type: String, default: undefined },
  disabledDates: { type: Function, default: undefined },
  disabledNights: { type: Function, default: undefined },
  minNights: { type: Number, default: undefined },
  maxNights: { type: Number, default: undefined },
  times: { type: [Array, Function], default: undefined },
  tours: { type: Array, default: undefined },
  quickDays: { type: Number, default: undefined },
  names: { type: Object, default: undefined },
  pending: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  locale: { type: String, default: undefined },
  labels: { type: Object, required: true }
}

export const emits = ['submit', 'update:query']
