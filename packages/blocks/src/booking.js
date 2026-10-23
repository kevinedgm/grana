// @grana/blocks/booking · entrada de la familia Booking (dueño: bruno; _comun.md §19, #860). Sin efectos en el nivel
// superior (#444) y sin CSS (los bloques estructurales no llevan, #763): quien importa solo `GbSearch01` no arrastra las
// demás variantes. `vue`, `@grana/vue` y sus entradas `/booking`, `/gallery`, `/price`, `/hero` y `/tag` son *peer* y
// externos. B12 Reviews es GbTestimonials de @grana/blocks/marketing y no se reexporta aquí (#865).
//
// Añadir una sección: importar sus variantes, exportarlas por nombre y añadirlas a `variants` (el plugin las registra).
// scripts/build-types.mjs se detiene si una variante del meta.json no se exporta aquí o al revés.
import GbSearch01 from './blocks/GbSearch/GbSearch01.vue'
import GbSearch02 from './blocks/GbSearch/GbSearch02.vue'
import GbSearch03 from './blocks/GbSearch/GbSearch03.vue'
import GbOfferList01 from './blocks/GbOfferList/GbOfferList01.vue'
import GbOfferList02 from './blocks/GbOfferList/GbOfferList02.vue'
import GbOfferList03 from './blocks/GbOfferList/GbOfferList03.vue'
import GbGuestForm01 from './blocks/GbGuestForm/GbGuestForm01.vue'
import GbGuestForm02 from './blocks/GbGuestForm/GbGuestForm02.vue'
import GbGuestForm03 from './blocks/GbGuestForm/GbGuestForm03.vue'
import GbConfirmation01 from './blocks/GbConfirmation/GbConfirmation01.vue'
import GbConfirmation02 from './blocks/GbConfirmation/GbConfirmation02.vue'
import GbConfirmation03 from './blocks/GbConfirmation/GbConfirmation03.vue'
import GbItinerary01 from './blocks/GbItinerary/GbItinerary01.vue'
import GbItinerary02 from './blocks/GbItinerary/GbItinerary02.vue'
import GbItinerary03 from './blocks/GbItinerary/GbItinerary03.vue'
import GbLocation01 from './blocks/GbLocation/GbLocation01.vue'
import GbLocation02 from './blocks/GbLocation/GbLocation02.vue'
import GbLocation03 from './blocks/GbLocation/GbLocation03.vue'
import GbPolicies01 from './blocks/GbPolicies/GbPolicies01.vue'
import GbPolicies02 from './blocks/GbPolicies/GbPolicies02.vue'
import GbPolicies03 from './blocks/GbPolicies/GbPolicies03.vue'
import GbOfferDetail01 from './blocks/GbOfferDetail/GbOfferDetail01.vue'
import GbOfferDetail02 from './blocks/GbOfferDetail/GbOfferDetail02.vue'
import GbOfferDetail03 from './blocks/GbOfferDetail/GbOfferDetail03.vue'
import GbBookingSummary01 from './blocks/GbBookingSummary/GbBookingSummary01.vue'
import GbBookingSummary02 from './blocks/GbBookingSummary/GbBookingSummary02.vue'
import GbBookingSummary03 from './blocks/GbBookingSummary/GbBookingSummary03.vue'
import GbMenu01 from './blocks/GbMenu/GbMenu01.vue'
import GbMenu02 from './blocks/GbMenu/GbMenu02.vue'
import GbMenu03 from './blocks/GbMenu/GbMenu03.vue'
import GbAvailability01 from './blocks/GbAvailability/GbAvailability01.vue'
import GbAvailability02 from './blocks/GbAvailability/GbAvailability02.vue'
import GbAvailability03 from './blocks/GbAvailability/GbAvailability03.vue'

export {
  GbSearch01, GbSearch02, GbSearch03,
  GbOfferList01, GbOfferList02, GbOfferList03,
  GbGuestForm01, GbGuestForm02, GbGuestForm03,
  GbConfirmation01, GbConfirmation02, GbConfirmation03,
  GbItinerary01, GbItinerary02, GbItinerary03,
  GbLocation01, GbLocation02, GbLocation03,
  GbPolicies01, GbPolicies02, GbPolicies03,
  GbOfferDetail01, GbOfferDetail02, GbOfferDetail03,
  GbBookingSummary01, GbBookingSummary02, GbBookingSummary03,
  GbMenu01, GbMenu02, GbMenu03,
  GbAvailability01, GbAvailability02, GbAvailability03
}

/** Plugin: `app.use(booking)` registra todas las variantes (`<gb-search-01>`, `<GbSearch01>`…). */
export const booking = {
  install(app) {
    const variants = {
      GbSearch01, GbSearch02, GbSearch03,
      GbOfferList01, GbOfferList02, GbOfferList03,
      GbGuestForm01, GbGuestForm02, GbGuestForm03,
      GbConfirmation01, GbConfirmation02, GbConfirmation03,
      GbItinerary01, GbItinerary02, GbItinerary03,
      GbLocation01, GbLocation02, GbLocation03,
      GbPolicies01, GbPolicies02, GbPolicies03,
      GbOfferDetail01, GbOfferDetail02, GbOfferDetail03,
      GbBookingSummary01, GbBookingSummary02, GbBookingSummary03,
      GbMenu01, GbMenu02, GbMenu03,
      GbAvailability01, GbAvailability02, GbAvailability03
    }
    for (const [name, component] of Object.entries(variants)) app.component(name, component)
  }
}
