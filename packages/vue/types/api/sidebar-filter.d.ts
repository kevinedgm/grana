// API de la entrada `@grana/vue/sidebar-filter` (dueño: bruno). sidebar.md §«Filtro del índice» «Extensión y conexión», #1050.
// Es una extensión de GSidebar: no registra componentes (nada en GlobalComponents).
import type { App, Plugin } from 'vue'

/** Motor del filtro del índice que GSidebar llama con su enganche interno. No es API estable: se usa a través del plugin. */
export declare function createSidebarFilter(hook: unknown): unknown
/** Conecta el motor con todos los `GSidebar` de la aplicación. */
export declare function install(app: App): void
declare const SidebarFilter: Plugin & { install(app: App): void }
export default SidebarFilter
