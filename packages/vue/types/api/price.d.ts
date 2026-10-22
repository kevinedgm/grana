// API de la entrada `@grana/vue/price` que no son componentes (dueño: bruno). price.md «formatPrice» y «Paquete y peso» (#776).
import type { App } from 'vue'
import type { FormattedPrice, Money, PriceOptions } from '../shared.js'

/** La regla del precio: lo visible, la frase con el nombre de la moneda y las partes. Pura; nunca lanza. */
export declare function formatPrice(money: Money | Money[] | null, options?: PriceOptions): FormattedPrice
/** Decimales de la moneda (MXN 2, JPY 0, KWD 3). */
export declare function currencyDigits(currency: string, locale?: string): number
/** Registra `<g-price>` y `<g-price-scope>` si no lo estaban. */
export declare function install(app: App): void
declare const Price: { install(app: App): void }
export default Price
