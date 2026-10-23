// Uso correcto y erróneo de los tipos de @grana/blocks/booking (src/types.test.js los comprueba con vue-tsc). Cada
// `@ts-expect-error` es un uso erróneo que DEBE fallar.
import { createApp } from 'vue'
import { GbConfirmation01, GbGuestForm02, GbOfferList01, GbOfferList02, GbOfferList03, GbSearch01, GbSearch03, booking } from '@grana/blocks/booking'
import type { BookingQuery, GbConfirmationProps, GbGuestFormProps, GbOfferListProps, GbSearchProps, GuestField, Offer, OfferSelect, PartyRow, Photo, PriceSpec, Totals } from '@grana/blocks/booking'
import type { PartyRow as VuePartyRow } from '@grana/vue/booking'
import type { GalleryPhoto as GPhoto } from '@grana/vue/gallery'

createApp({}).use(booking)

// Photo y PartyRow, escritos a mano, encajan en los de @grana/vue (y al revés)
const photo: Photo = { src: 'a.jpg', width: 1600, height: 1000, alt: 'Patio', group: 'patio' }
const asGallery: GPhoto = photo
const fromGallery: Photo = asGallery
const row: PartyRow = { key: 'adults', label: 'Adultos', min: 1, max: (v) => v.rooms ?? 6, unit: (n) => `${n} adultos`, decrementLabel: '−', incrementLabel: '+' }
const asVueRow: VuePartyRow = row
const fromVueRow: PartyRow = asVueRow

const query: BookingQuery = { kind: 'stay', from: '2026-11-13', to: '2026-11-15', party: { adults: 2 } }
const table: BookingQuery = { kind: 'table', date: '2026-11-13', time: '20:00', party: { adults: 2 } }
// @ts-expect-error: una estancia no lleva time
const badStay: BookingQuery = { kind: 'stay', from: null, to: null, time: '20:00', party: {} }
// @ts-expect-error: kind fuera de la lista
const badKind: BookingQuery = { kind: 'hotel', party: {} }

const price: PriceSpec = { value: { amount: 1850, currency: 'MXN' }, lead: 'desde', total: { value: { amount: 4100, currency: 'MXN' }, label: 'por 2 noches' } }
const onRequest: PriceSpec = { value: null }
// @ts-expect-error: PriceSpec sin value
const noValue: PriceSpec = { lead: 'desde' }
const offer: Offer = { id: 'suite', name: 'Suite Jardín', photos: [photo], price, available: 'No quedan', facts: [{ label: 'Personas', value: '3' }] }
// @ts-expect-error: Offer sin id (obligatorio para select, K5)
const noId: Offer = { name: 'Suite' }
// @ts-expect-error: un campo de Offer mal escrito
const typo: Offer = { id: 1, name: 'x', precio: price }

const search: GbSearchProps = { kind: 'stay', title: 'Consulta', partyRows: [row], query, labels: { bar: { separator: ' · ' } }, disabledNights: (iso, q) => iso === q.kind }
// @ts-expect-error: labels.bar es obligatorio
const noBar: GbSearchProps = { kind: 'stay', title: 'x', partyRows: [row], labels: {} }
const list: GbOfferListProps = { title: 'Habitaciones', offers: [offer], query, partyRows: [row], prices: { currency: 'MXN' }, labels: { photos: (n) => `Ver ${n}`, query: { nights: '{count} noches', separator: ' · ' } } }
const onSelect = (p: OfferSelect) => p.offer.id
const field: GuestField = { name: 'tel', label: 'Teléfono', type: 'tel', autocomplete: 'tel', why: 'Para avisarte' }
// @ts-expect-error: type fuera de la lista cerrada
const badField: GuestField = { name: 'c', label: 'C', type: 'color' }
const form: GbGuestFormProps = { title: 'Tus datos', fields: [field], action: { label: 'Confirmar' }, labels: { required: 'Escribe {label}', invalid: 'Revisa {label}' } }
// @ts-expect-error: labels.required es obligatoria
const noRequired: GbGuestFormProps = { title: 'x', fields: [field], action: { label: 'x' }, labels: { invalid: 'x' } }
const totals: Totals = { total: { value: { amount: 4223, currency: 'MXN' }, label: 'por 2 noches' } }
const done: GbConfirmationProps = { title: 'Reserva confirmada', state: 'confirmed', reference: { code: 'CA-7K29Q', label: 'Código' }, query, partyRows: [row], totals, labels: { states: { confirmed: 'Confirmada', requested: 'Pendiente' }, query: { nights: '{count} noches', separator: ' · ' } } }
// @ts-expect-error: state fuera de la lista
const badState: GbConfirmationProps = { ...done, state: 'paid' }

// Las tres variantes de una sección tienen la MISMA Props
type PropsOf<C> = C extends abstract new (...args: any) => { $props: infer P } ? P : never
type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false
const sameList: [Same<PropsOf<typeof GbOfferList01>, PropsOf<typeof GbOfferList02>>, Same<PropsOf<typeof GbOfferList02>, PropsOf<typeof GbOfferList03>>] = [true, true]
const sameSearch: Same<PropsOf<typeof GbSearch01>, PropsOf<typeof GbSearch03>> = true
export { search, list, onSelect, form, done, table, onRequest, GbConfirmation01, GbGuestForm02, fromGallery, fromVueRow, sameList, sameSearch }

// ── Parte B: Itinerary, Location, Policies y Offer detail ──
import { GbItinerary01, GbItinerary03, GbLocation01, GbLocation03, GbOfferDetail01, GbOfferDetail02, GbPolicies01, GbPolicies03 } from '@grana/blocks/booking'
import type { GbItineraryProps, GbLocationProps, GbOfferDetailProps, GbPoliciesProps, ItineraryDay, OfferBook, OfferDetail, Point, Policy } from '@grana/blocks/booking'

const tourDay: ItineraryDay = { label: 'Día 1', date: '2026-11-14', stops: [{ time: '07:45', title: 'Punto de encuentro', place: 'Zócalo' }] }
// @ts-expect-error: una parada sin title
const noStopTitle: ItineraryDay = { label: 'x', stops: [{ time: '07:45' }] }
const itinerary: GbItineraryProps = { title: 'Programa', days: [tourDay], timeZone: 'America/Mexico_City', labels: { now: 'Ahora', next: 'Siguiente' } }
// @ts-expect-error: un campo de labels mal escrito
const badItin: GbItineraryProps = { title: 'x', days: [tourDay], labels: { ahora: 'Ahora' } }
const point: Point = { name: 'Zócalo', time: '07:45', address: ['Centro'], directions: { label: 'Cómo llegar', href: 'https://maps.example.com', external: true } }
const location: GbLocationProps = { title: 'Dónde estamos', address: ['Alcalá 307'], points: [point], channels: [{ label: 'WhatsApp', href: 'https://wa.me/1', external: true, icon: 'message-circle' }], labels: { points: 'Puntos de encuentro' } }
// @ts-expect-error: address son líneas (string[]), no un texto
const badAddress: GbLocationProps = { title: 'x', address: 'Alcalá 307' }
const policy: Policy = { id: 'cancelacion', title: 'Cancelación', summary: 'Gratis hasta 48 h antes', body: 'Texto.' }
const policies: GbPoliciesProps = { title: 'Antes de reservar', items: [policy] }
// @ts-expect-error: una política sin body
const noBody: Policy = { title: 'x', summary: 'y' }
const detail: OfferDetail = { ...offer, groups: [{ value: 'bano', label: 'El baño', id: 'fotos-bano' }], sections: [{ id: 'incluye', title: 'Qué incluye', items: ['Desayuno'] }], facts: [{ label: 'Baño', value: 'Regadera', group: 'bano' }] }
const offerDetail: GbOfferDetailProps = { offer: detail, query, partyRows: [row], prices: { currency: 'MXN' }, labels: { photos: 'Fotos', facts: 'La suite', showPhotos: (g) => `Ver ${g}` } }
// @ts-expect-error: labels.facts es obligatoria
const noFacts: GbOfferDetailProps = { offer: detail, labels: { photos: 'Fotos' } }
const onBook = (p: OfferBook) => p.offer.sections?.length
const sameItin: Same<PropsOf<typeof GbItinerary01>, PropsOf<typeof GbItinerary03>> = true
const sameLoc: Same<PropsOf<typeof GbLocation01>, PropsOf<typeof GbLocation03>> = true
const samePol: Same<PropsOf<typeof GbPolicies01>, PropsOf<typeof GbPolicies03>> = true
const sameDetail: Same<PropsOf<typeof GbOfferDetail01>, PropsOf<typeof GbOfferDetail02>> = true
export { itinerary, location, policies, offerDetail, onBook, sameItin, sameLoc, samePol, sameDetail }
