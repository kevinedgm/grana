// API de la entrada `@grana/vue/tag` que no son componentes (dueño: bruno). tag.md §«Paquete», #472.
import type { App } from 'vue'

/** Registra `<g-tag>` y `<g-tag-group>` si no lo estaban. */
export declare function install(app: App): void
declare const Tag: { install(app: App): void }
export default Tag
