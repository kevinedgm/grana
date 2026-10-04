// Entrada `@grana/vue/status` (dueño: bruno). design/contracts/status.md, DECISIONS.md #328: la isla de estado no viaja
// en `@grana/vue` (pesaba +14,7 KB gzip, por encima de la compuerta de #317); quien no la usa no la paga. Se construye
// aparte (vite.status.config.js → dist/status.js y dist/status.umd.js, global GranaStatus) con Vue y `@grana/vue` como
// externos: lo compartido con el paquete principal (GBtn, GDialog, GIcon interno, topModal, reservas de borde, canales…)
// llega de `@grana/vue` vía `__shared` (src/shared.js), sin copia. El CSS de la isla sigue en grana.css.
import { createStatus as createManager, useStatus, statusKey } from './components/GStatusIsland/status.js'
import GStatusIsland from './components/GStatusIsland/GStatusIsland.vue'
import GStatusMark from './components/GStatusMark/GStatusMark.vue'
import GStatus from './components/GStatus/GStatus.vue'

const components = { GStatusIsland, GStatusMark, GStatus }

// El gestor es también plugin: `app.use(status)` lo provee y registra sus tres componentes si no lo estaban.
export function createStatus(options) {
  const status = createManager(options)
  const provide = status.install
  status.install = function install(app) {
    provide(app)
    for (const [name, component] of Object.entries(components)) {
      if (!app.component(name)) app.component(name, component)
    }
  }
  return status
}

export { useStatus, statusKey, GStatusIsland, GStatusMark, GStatus }
