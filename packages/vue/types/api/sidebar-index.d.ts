// API de la entrada `@grana/vue/sidebar-index` (dueño: bruno). sidebar.md §«Apariencia `index`» «Extensión y conexión», #1069.
// Es una extensión de GSidebar: no registra componentes (nada en GlobalComponents) y solo exporta el plugin por defecto.
import type { App, Plugin } from 'vue'

/** Conecta la apariencia `index`, los grupos plegables, la marca y el cajón que abre en el actual con todos los `GSidebar`. */
declare const SidebarIndex: Plugin & { install(app: App): void }
export default SidebarIndex
