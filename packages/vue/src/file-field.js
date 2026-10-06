// Entrada `@grana/vue/file-field` (dueño: bruno). design/contracts/file-field.md «Entrega y empaquetado», DECISIONS.md #367:
// el campo de archivos no viaja en `@grana/vue` (cola de subida, adaptador, arrastre de página, vista previa y anuncios; no
// todos los formularios adjuntan archivos): quien no lo usa no lo paga. Se construye aparte (vite.file-field.config.js →
// dist/file-field.js y dist/file-field.umd.js, global GranaFileField) con Vue y `@grana/vue` como externos: lo compartido
// (GSummary, GProgress, GBtn, GIcon interno, useFormField con las claves de contexto, liveRegion, topModal, template, oneOf)
// llega de `@grana/vue` vía `__shared` (src/shared.js), sin copia: una copia propia de formContext.js crearía otro Symbol y el
// campo no vería su GForm. El módulo de arrastre de página (utils/fileDrag.js) vive aquí. El CSS sigue en grana.css. Sin
// gestor: no es un servicio.
import GFileField from './components/GFileField/GFileField.vue'
import { formatFileSize } from './components/GFileField/engine.js'

export { GFileField, formatFileSize }

export function install(app) {
  if (!app.component('GFileField')) app.component('GFileField', GFileField)
}

export default { install }
