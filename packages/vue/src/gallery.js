// Entrada `@grana/vue/gallery` (dueño: bruno). design/contracts/gallery.md «Peso y paquete», DECISIONS.md #742: la galería con
// visor no viaja en `@grana/vue` (#506, #550). Se construye aparte (vite.gallery.config.js → dist/gallery.js y
// dist/gallery.umd.js, global GranaGallery) con Vue y `@grana/vue` como externos: GDialog (con la enmienda bare y from vivo,
// #732), GBtn, GLibIcon, sectionKey, template, liveRegion, sizeObserver y oneOf llegan de `__shared` (src/shared.js), sin
// copia. El CSS sigue en grana.css.
import GGallery from './components/GGallery/GGallery.vue'
import GGalleryViewer from './components/GGallery/GGalleryViewer.vue'

export { GGallery, GGalleryViewer }

export function install(app) {
  if (!app.component('GGallery')) app.component('GGallery', GGallery)
  if (!app.component('GGalleryViewer')) app.component('GGalleryViewer', GGalleryViewer)
}

export default { install }
