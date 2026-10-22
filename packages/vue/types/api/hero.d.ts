// API de la entrada `@grana/vue/hero` que no son componentes (dueño: bruno). DECISIONS.md #742.
import type { App } from 'vue'

/** Registra `<g-hero>` si no lo estaban. */
export declare function install(app: App): void
declare const Hero: { install(app: App): void }
export default Hero
