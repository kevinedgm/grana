// API de la entrada `@grana/vue/gallery` que no son componentes (dueño: bruno). DECISIONS.md #742.
import type { App } from 'vue'

/** Registra `<g-gallery>` y `<g-gallery-viewer>` si no lo estaban. */
export declare function install(app: App): void
declare const Gallery: { install(app: App): void }
export default Gallery
