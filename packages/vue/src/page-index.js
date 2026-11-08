// Entrada `@grana/vue/page-index` (dueño: bruno). design/contracts/page-index.md «Paquete y peso», DECISIONS.md #1042: el
// índice de la página no viaja en `@grana/vue` (el margen del principal está agotado, #550). Se construye aparte
// (vite.page-index.config.js → dist/page-index.js y dist/page-index.umd.js, global GranaPageIndex) con Vue y `@grana/vue`
// como externos: GMenu (con utils/menuNav.js dentro), GLibIcon y transitionMs llegan de `__shared` (src/shared.js), sin
// copia. El CSS sigue en grana.css (GPageIndex.css después de GMenu.css).
import GPageIndex from './components/GPageIndex/GPageIndex.vue'

export { GPageIndex }

export function install(app) {
  if (!app.component('GPageIndex')) app.component('GPageIndex', GPageIndex)
}

export default { install }
