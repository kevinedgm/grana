// Registro de reservas de borde del visor (interno; dueño: bruno). speech.md §6.7, toast.md «Convivencia», DECISIONS.md #225.
// El elemento PERSISTENTE (la pill flotante de GSpeechHost) conserva su borde y publica aquí su reserva (alto + margen);
// el TRANSITORIO (GToaster) con el mismo borde efectivo la suma a su `offset` de ese borde. No es API pública ni opción
// de ningún servicio.
// Un registro por documento (el visor es compartido aunque haya varias aplicaciones montadas). Solo en el cliente: se
// crea al primer uso y solo lo usan componentes montados. Reactivo (Vue): quien lee `edgeReserve` en un `computed`
// se actualiza al cambiar la reserva.
import { reactive } from 'vue'

const registries = new WeakMap() // document → Map(dueño → { edge, px })

function registryOf(doc) {
  if (!doc) return null
  let r = registries.get(doc)
  if (!r) {
    r = reactive(new Map())
    registries.set(doc, r)
  }
  return r
}
const currentDoc = () => (typeof document !== 'undefined' ? document : null)

/** Publica (o actualiza) la reserva de `owner` en `edge` ('top' | 'bottom'). `px` ≤ 0 o sin borde: la retira. */
export function setEdgeReserve(owner, edge, px, doc = currentDoc()) {
  const r = registryOf(doc)
  if (!r) return
  if ((edge !== 'top' && edge !== 'bottom') || !(px > 0)) {
    r.delete(owner)
    return
  }
  const prev = r.get(owner)
  if (prev && prev.edge === edge && prev.px === px) return
  r.set(owner, { edge, px })
}

/** Retira la reserva de `owner` (al ocultarse o desmontarse). */
export function clearEdgeReserve(owner, doc = currentDoc()) {
  const r = registryOf(doc)
  if (r) r.delete(owner)
}

/** Suma de las reservas de un borde, en px (0 sin reservas). Reactivo. `except`: un dueño que no cuenta (el propio). */
export function edgeReserve(edge, { doc = currentDoc(), except } = {}) {
  const r = registryOf(doc)
  if (!r) return 0
  let total = 0
  for (const [owner, v] of r) if (owner !== except && v.edge === edge) total += v.px
  return total
}
