// API de la entrada `@grana/vue/page-index-list` (dueño: bruno). page-index.md «Extensión», #1054.
// Es una extensión de GPageIndex: no registra componentes (nada en GlobalComponents).
import type { App, Plugin } from 'vue'

/** Conecta la forma `list` (con `fold` y `level`) con todos los `GPageIndex` de la aplicación. */
export declare function install(app: App): void
declare const PageIndexList: Plugin & { install(app: App): void }
export default PageIndexList
