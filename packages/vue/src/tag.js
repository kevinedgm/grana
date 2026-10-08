// Entrada `@grana/vue/tag` (dueño: bruno). design/contracts/tag.md §«Paquete», DECISIONS.md #472: las etiquetas no viajan
// en `@grana/vue` (medidas: +9,2 KB gzip en grana.js, por encima del tope de 8 KB); quien no las usa no las paga. Se
// construye aparte (vite.tag.config.js → dist/tag.js y dist/tag.umd.js, global GranaTag) con Vue y `@grana/vue` como
// externos: lo compartido (GBtn, GAvatar, GIcon público e interno, visualTip, liveRegion, template, categoryHash) llega de
// `@grana/vue` vía `__shared` (src/shared.js), sin copia. El CSS sigue en grana.css. Sin gestor: no es un servicio.
import GTag from './components/GTag/GTag.vue'
import GTagGroup from './components/GTagGroup/GTagGroup.vue'

export { GTag, GTagGroup }

export function install(app) {
  if (!app.component('GTag')) app.component('GTag', GTag)
  if (!app.component('GTagGroup')) app.component('GTagGroup', GTagGroup)
}

export default { install }
