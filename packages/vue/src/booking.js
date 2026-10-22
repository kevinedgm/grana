// Entrada `@grana/vue/booking` (dueño: bruno). design/contracts/booking-bar.md «Peso y paquete», DECISIONS.md #742: la consulta
// de reserva y el campo de grupo no viajan en `@grana/vue` (#506, #550). Se construye aparte (vite.booking.config.js →
// dist/booking.js y dist/booking.umd.js, global GranaBooking) con Vue y `@grana/vue` como externos: GDatePicker, GNumberField,
// GSelect, GRadioGroup, GDialog, GBtn, GLibIcon, useFormField con las claves de contexto, el registro de reservas de borde
// (edgeReserve con EDGE_ORDER.bookingDock: uno por documento), anchor, liveRegion, template, dates, sizeObserver y oneOf llegan
// de `__shared` (src/shared.js), sin copia. No importa GTimeField (#737). El CSS sigue en grana.css.
import GBookingBar from './components/GBookingBar/GBookingBar.vue'
import GPartyField from './components/GPartyField/GPartyField.vue'

export { GBookingBar, GPartyField }

export function install(app) {
  if (!app.component('GBookingBar')) app.component('GBookingBar', GBookingBar)
  if (!app.component('GPartyField')) app.component('GPartyField', GPartyField)
}

export default { install }
