// Entrada `@grana/vue/combobox` (dueño: bruno). design/contracts/combobox.md «Entrega y empaquetado», DECISIONS.md #337:
// el campo de búsqueda en catálogo no viaja en `@grana/vue` (dos presentaciones, motor de datos, ficha y fantasma: supera
// el tope de 8 KB gzip de #328); quien no lo usa no lo paga. Se construye aparte (vite.combobox.config.js →
// dist/combobox.js y dist/combobox.umd.js, global GranaCombobox) con Vue y `@grana/vue` como externos: lo compartido
// (GInput, GAvatar, GDialog, GIcon público e interno, anchor, liveRegion, template, oneOf) llega de `@grana/vue` vía
// `__shared` (src/shared.js), sin copia. El CSS sigue en grana.css. Sin gestor: no es un servicio.
import GCombobox from './components/GCombobox/GCombobox.vue'

export { GCombobox }

export function install(app) {
  if (!app.component('GCombobox')) app.component('GCombobox', GCombobox)
}

export default { install }
