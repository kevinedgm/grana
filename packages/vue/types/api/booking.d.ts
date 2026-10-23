// API de la entrada `@grana/vue/booking` que no son componentes (dueño: bruno). DECISIONS.md #742, #862.
import type { App } from 'vue'
import type { DescribeQueryOptions, DescribedQuery, DescribeQueryInput } from '../shared.js'

/**
 * La consulta en palabras, exactamente como el resumen de `GBookingBar` (#862): rango, noches contadas, grupo, lo que
 * falta con `no*`, unido por `labels.separator`. Pura (sin DOM), SSR, nunca lanza y sin avisos propios.
 */
export declare function describeQuery(query: DescribeQueryInput, options: DescribeQueryOptions): DescribedQuery
/** Registra `<g-booking-bar>` y `<g-party-field>` si no lo estaban. */
export declare function install(app: App): void
declare const Booking: { install(app: App): void }
export default Booking
