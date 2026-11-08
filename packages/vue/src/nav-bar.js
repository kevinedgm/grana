// Entrada `@grana/vue/nav-bar` (dueño: bruno). design/contracts/nav-bar.md «Paquete y peso», DECISIONS.md #1053 y #1059: la
// barra de un sitio no viaja en `@grana/vue` (#506, #550). Se construye aparte (vite.nav-bar.config.js → dist/nav-bar.js y
// dist/nav-bar.umd.js, global GranaNavBar) con Vue y `@grana/vue` como externos: GLibIcon, la luz (utils/glide.js), la
// guarda de `target` (utils/link.js) y el canal del chasis (utils/appShell.js) llegan de `__shared` (src/shared.js), sin
// copia. El CSS sigue en grana.css.
import GNavBar from './components/GNavBar/GNavBar.vue'

export { GNavBar }

export function install(app) {
  if (!app.component('GNavBar')) app.component('GNavBar', GNavBar)
}

export default { install }
