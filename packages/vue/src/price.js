// Entrada `@grana/vue/price` (dueño: bruno). design/contracts/price.md «Paquete y peso», DECISIONS.md #776: el precio no viaja
// en `@grana/vue` (#506, #550). Se construye aparte (vite.price.config.js → dist/price.js y dist/price.umd.js, global
// GranaPrice) con Vue y `@grana/vue` como externos: los datos de la moneda (utils/currency.js con la tabla de símbolos, que
// también usa GNumberField currency), template, oneOf, nextFrame y GLibIcon llegan de `__shared` (src/shared.js), sin copia.
// La regla (utils/price.js, formatPrice) y la clave de la región viven aquí. El CSS sigue en grana.css.
import GPrice from './components/GPrice/GPrice.vue'
import GPriceScope from './components/GPriceScope/GPriceScope.vue'
import { formatPrice } from './utils/price.js'
import { currencyDigits } from './utils/currency.js'

export { GPrice, GPriceScope, formatPrice, currencyDigits }

export function install(app) {
  if (!app.component('GPrice')) app.component('GPrice', GPrice)
  if (!app.component('GPriceScope')) app.component('GPriceScope', GPriceScope)
}

export default { install }
