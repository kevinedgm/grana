// Registro de reservas de borde del visor (interno; dueño: bruno). speech.md §6.7, toast.md «Convivencia», status.md
// «Borde compartido», DECISIONS.md #225 y #322.
// Los elementos PERSISTENTES (la pill flotante de GSpeechHost, la isla de estado) conservan su borde y publican aquí su
// reserva (alto + margen); el TRANSITORIO (GToaster) con el mismo borde efectivo suma todas a su `offset` de ese borde.
// Cada reserva lleva su `order` (menor = más cerca del borde): quien va después lee solo las anteriores (`before`), así
// el orden voz → isla → avisos es por prioridad y no por montaje. No es API pública ni opción de ningún servicio.
// Un registro por documento (el visor es compartido aunque haya varias aplicaciones montadas). Solo en el cliente: se
// crea al primer uso y solo lo usan componentes montados. Reactivo (Vue): quien lee `edgeReserve` en un `computed`
// se actualiza al cambiar la reserva.
import { reactive } from 'vue'

/** Orden desde el borde: menor = más cerca. Los avisos (GToaster) no publican. */
export const EDGE_ORDER = Object.freeze({ speech: 10, status: 20 })

const registries = new WeakMap() // document → Map(dueño → { edge, px, order })

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
export function setEdgeReserve(owner, edge, px, { order = 0 } = {}, doc = currentDoc()) {
  const r = registryOf(doc)
  if (!r) return
  if ((edge !== 'top' && edge !== 'bottom') || !(px > 0)) {
    r.delete(owner)
    return
  }
  const prev = r.get(owner)
  if (prev && prev.edge === edge && prev.px === px && prev.order === order) return
  r.set(owner, { edge, px, order })
}

/** Retira la reserva de `owner` (al ocultarse o desmontarse). */
export function clearEdgeReserve(owner, doc = currentDoc()) {
  const r = registryOf(doc)
  if (r) r.delete(owner)
}

/**
 * Suma de las reservas de un borde, en px (0 sin reservas). Reactivo. `except`: un dueño que no cuenta (el propio).
 * `before`: solo cuentan las reservas con `order` menor (las que están más cerca del borde).
 */
export function edgeReserve(edge, { doc = currentDoc(), except, before } = {}) {
  const r = registryOf(doc)
  if (!r) return 0
  let total = 0
  for (const [owner, v] of r) {
    if (owner === except || v.edge !== edge) continue
    if (before !== undefined && !(v.order < before)) continue
    total += v.px
  }
  return total
}
