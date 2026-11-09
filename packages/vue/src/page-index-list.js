// Extensión `@grana/vue/page-index-list` (dueño: bruno). page-index.md «Extensión `@grana/vue/page-index-list`», DECISIONS.md
// #1054, con el patrón de #1050 (sidebar-filter): la prop `appearance="list"` (con `fold` y `level`) sigue en GPageIndex;
// la forma va aquí. No exporta componente: el plugin por defecto hace `app.provide` de la clave interna de
// utils/pageIndexList.js (llega por `__shared` con el mismo Symbol que inyecta GPageIndex). Sin el plugin, `list` se pinta
// como `relay` y avisa (7). Se construye aparte (vite.page-index-list.config.js → dist/page-index-list.js y
// dist/page-index-list.umd.js, global GranaPageIndexList) con Vue y `@grana/vue` como externos; el motor de lectura se queda
// en page-index.js y GLibIcon llega de `__shared`, sin copia. El CSS sigue en grana.css.
import GPageIndexList from './components/GPageIndex/GPageIndexList.js'
import { pageIndexListKey } from './utils/pageIndexList.js'

export function install(app) {
  app.provide(pageIndexListKey, GPageIndexList)
}

export default { install }
