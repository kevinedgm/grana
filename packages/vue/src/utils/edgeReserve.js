// Registro de reservas de borde del visor (interno; dueño: bruno). speech.md §6.7, toast.md «Convivencia», status.md
// «Borde compartido», DECISIONS.md #225, #322 y #699.
// Los elementos PERSISTENTES (la pill flotante de GSpeechHost, el encabezado de página, el FAB) conservan su borde y
// publican aquí su reserva (alto + margen); la isla de estado, transitoria, publica solo mientras se ve; el TRANSITORIO
// (GToaster) con el mismo borde efectivo suma todas a su `offset` de ese borde. Cada reserva lleva su `order` (menor = más
// cerca del borde): quien va después lee solo las anteriores (`before`), así el orden voz → encabezado de página → FAB →
// isla → avisos es por prioridad y no por montaje. No es API pública ni opción de ningún servicio.
// Un registro por documento (el visor es compartido aunque haya varias aplicaciones montadas). Solo en el cliente: se
// crea al primer uso y solo lo usan componentes montados. Reactivo (Vue): quien lee `edgeReserve` en un `computed`
// se actualiza al cambiar la reserva.
import { reactive } from 'vue'

/** Orden desde el borde: menor = más cerca. Los avisos (GToaster) no publican. El chasis (GAppShell: banda de cabecera
 * arriba, reserva del navbar abajo) es lo más cercano al borde (#714). GPageHeader (zócalo pegado arriba, muelle
 * abajo) va después de la voz (#631); el muelle de GBookingBar (abajo, mientras se ve) después del encabezado (#740); el FAB contraído (GFab, `anchor="viewport"`), después (#659); la isla de estado, que
 * es transitoria, detrás del FAB (#699: lo persistente conserva el borde y lo transitorio se apila por dentro, #225). */
export const EDGE_ORDER = Object.freeze({ appShell: 5, speech: 10, pageHeader: 15, bookingDock: 20, fab: 25, status: 30 })

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
