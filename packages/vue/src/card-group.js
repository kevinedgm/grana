// Entrada `@grana/vue/card-group` (dueño: bruno). design/contracts/card-group.md «Paquete, meta.json y tipos», DECISIONS.md
// #610: el grupo de tarjetas que filtran no viaja en `@grana/vue` (el margen del principal está agotado, #550); quien no lo usa
// no lo paga. Se construye aparte (vite.card-group.config.js → dist/card-group.js y dist/card-group.umd.js, global
// GranaCardGroup) con Vue y `@grana/vue` como externos: la clave del contexto (utils/cardGroup.js, el mismo Symbol que lee
// GCard) y transitionMs (utils/motion.js) llegan de `@grana/vue` vía `__shared` (src/shared.js), sin copia. GCard sigue en el
// principal. El CSS sigue en grana.css. Sin gestor: no es un servicio.
import GCardGroup from './components/GCardGroup/GCardGroup.vue'

export { GCardGroup }

export function install(app) {
  if (!app.component('GCardGroup')) app.component('GCardGroup', GCardGroup)
}

export default { install }
