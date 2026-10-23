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
