// Entrada `@grana/vue/page-header` (dueño: bruno). design/contracts/page-header.md «Paquete y peso», DECISIONS.md #633: el
// encabezado de página no viaja en `@grana/vue` (#550: el margen del principal está agotado); quien no lo usa no lo paga.
// Se construye aparte (vite.page-header.config.js → dist/page-header.js y dist/page-header.umd.js, global GranaPageHeader)
// con Vue y `@grana/vue` como externos: el registro de reservas de borde (utils/edgeReserve.js, obligatorio: un solo
// registro por documento para que la isla y los avisos vean el zócalo y el muelle), el observador de tamaño, spaceUnit y
// nextFrame y transitionMs llegan de `@grana/vue` vía `__shared` (src/shared.js), sin copia. El CSS sigue en grana.css.
// Sin gestor: no es un servicio. Lo único que crece en el principal es EDGE_ORDER.pageHeader.
import GPageHeader from './components/GPageHeader/GPageHeader.vue'

export { GPageHeader }

export function install(app) {
  if (!app.component('GPageHeader')) app.component('GPageHeader', GPageHeader)
}

export default { install }
