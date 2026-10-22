// Entrada `@grana/vue/app-shell` (dueño: bruno). design/contracts/app-shell.md «Paquete y peso», DECISIONS.md #716: el
// chasis de aplicación no viaja en `@grana/vue` (#550: el margen del principal está agotado); quien no lo usa no lo paga.
// Se construye aparte (vite.app-shell.config.js → dist/app-shell.js y dist/app-shell.umd.js, global GranaAppShell) con Vue
// y `@grana/vue` como externos: el registro de reservas de borde (utils/edgeReserve.js, obligatorio: uno por documento),
// el canal con GPageHeader (utils/appShell.js, appShellKey: la misma clave que inyecta el encabezado), el observador de
// tamaño y spaceUnit y nextFrame llegan de `@grana/vue` vía `__shared` (src/shared.js), sin copia. El CSS sigue en
// grana.css. Lo único que crece en el principal es EDGE_ORDER.appShell y la clave del canal.
import GAppShell from './components/GAppShell/GAppShell.vue'

export { GAppShell }

export function install(app) {
  if (!app.component('GAppShell')) app.component('GAppShell', GAppShell)
}

export default { install }
