// Entrada `@grana/vue/fab` (dueño: bruno). design/contracts/fab.md «Paquete y peso», DECISIONS.md #656: el botón flotante
// con acciones no viaja en `@grana/vue` (#550: el margen del principal está agotado); quien no lo usa no lo paga. Se
// construye aparte (vite.fab.config.js → dist/fab.js y dist/fab.umd.js, global GranaFab) con Vue y `@grana/vue` como
// externos: GBtn, GTooltip, los dos GIcon, el motor de menú compartido con GMenu (utils/menuNav.js, #657), el registro de
// reservas de borde (utils/edgeReserve.js con EDGE_ORDER.fab, obligatorio: uno por documento), el modal superior, el canal
// de página y las utilidades de posición llegan de `@grana/vue` vía `__shared` (src/shared.js), sin copia. El CSS sigue en
// grana.css. Sin gestor: no es un servicio. En el principal solo crecen el motor extraído y EDGE_ORDER.fab.
import GFab from './components/GFab/GFab.vue'

export { GFab }

export function install(app) {
  if (!app.component('GFab')) app.component('GFab', GFab)
}

export default { install }
