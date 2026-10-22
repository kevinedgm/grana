// API de la entrada `@grana/vue/booking` que no son componentes (dueño: bruno). DECISIONS.md #742.
import type { App } from 'vue'

/** Registra `<g-booking-bar>` y `<g-party-field>` si no lo estaban. */
export declare function install(app: App): void
declare const Booking: { install(app: App): void }
export default Booking
