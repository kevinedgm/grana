// Entrada `@grana/vue/sidebar-index` (dueño: bruno). sidebar.md §«Apariencia `index`» «Extensión y conexión», DECISIONS.md
// #1069, con el patrón de `sidebar-filter` (#1050): exporta solo un plugin por defecto que conecta la apariencia `index`, los
// grupos plegables (en las dos apariencias), la marca del actual y el cajón que abre en el actual con todos los GSidebar de
// la aplicación (`app.provide` de la clave interna de utils/sidebarIndex.js, el mismo Symbol que inyecta GSidebar, por
// `__shared`). Sin el plugin, `index` se pinta `default`, los grupos `collapsible` quedan fijos y abiertos y avisa A5. Se
// construye aparte (vite.sidebar-index.config.js → dist/sidebar-index.js y .umd.js, global GranaSidebarIndex); el CSS sigue
// en grana.css.
import { createSidebarIndex } from './components/GSidebar/indexEngine.js'
import { sidebarIndexKey } from './utils/sidebarIndex.js'

export default {
  install(app) {
    app.provide(sidebarIndexKey, createSidebarIndex)
  }
}
