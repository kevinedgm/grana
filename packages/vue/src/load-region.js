// Entrada `@grana/vue/load-region` (dueño: bruno). design/contracts/load-region.md «Paquete y peso», DECISIONS.md #530: la
// región que carga no viaja en `@grana/vue` (el principal ya creció ≈ 12 KB gzip en la Fase C, #506); quien no la usa no la
// paga. Se construye aparte (vite.load-region.config.js → dist/load-region.js y dist/load-region.umd.js, global
// GranaLoadRegion) con Vue y `@grana/vue` como externos: GEmpty, GBtn, el GIcon interno, el motor (utils/loadPhase.js, con
// la clave loadRegionKey: una copia crearía otro Symbol y el GEmpty del principal no vería su región), el canal de página
// (utils/liveRegion.js), oneOf y template llegan de `@grana/vue` vía `__shared` (src/shared.js), sin copia. El CSS sigue en
// grana.css. Sin gestor: no es un servicio.
import GLoadRegion from './components/GLoadRegion/GLoadRegion.vue'

export { GLoadRegion }

export function install(app) {
  if (!app.component('GLoadRegion')) app.component('GLoadRegion', GLoadRegion)
}

export default { install }
