// Entrada `@grana/vue/sidebar-filter` (dueño: bruno). sidebar.md §«Filtro del índice» «Extensión y conexión», DECISIONS.md
// #1050: la primera extensión de un componente del principal. No exporta componente: el motor del filtro de GSidebar y,
// por defecto, un plugin que lo conecta con todos los GSidebar de la aplicación (`app.provide` de la clave interna de
// utils/sidebarFilter.js, que llega por `__shared` con el mismo Symbol que inyecta GSidebar). Sin el plugin, GSidebar se
// pinta como si `filter` fuera false y avisa (F5). Se construye aparte (vite.sidebar-filter.config.js →
// dist/sidebar-filter.js y dist/sidebar-filter.umd.js, global GranaSidebarFilter) con Vue y `@grana/vue` como externos; la
// normalización (utils/match.js), GLibIcon y el canal de página llegan de `__shared`, sin copia. El CSS sigue en grana.css.
import { createSidebarFilter } from './components/GSidebar/filterEngine.js'
import { sidebarFilterKey } from './utils/sidebarFilter.js'

export { createSidebarFilter }

export function install(app) {
  app.provide(sidebarFilterKey, createSidebarFilter)
}

export default { install }
