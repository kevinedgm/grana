// Uso correcto y erróneo de los tipos de @grana/blocks/ecommerce (src/types.test.js los comprueba con vue-tsc). Cada
// `@ts-expect-error` es un uso erróneo que DEBE fallar. También comprueba la mudanza de #909: los tipos de más de una
// familia (Photo, PriceSpec, Totals…) son LOS MISMOS desde booking y desde ecommerce.
import { createApp } from 'vue'
import { GbProductCard01, GbProductCard02, GbProductCard03, GbPromo03, cartTotals, ecommerce } from '@grana/blocks/ecommerce'
import type { CartLine, CartTotals, ChosenOption, GbProductCardProps, GbPromoProps, Photo, PriceSpec, Product, ProductAdd, Totals, TotalsLine } from '@grana/blocks/ecommerce'
import type { Photo as BookingPhoto, PriceSpec as BookingPriceSpec, Totals as BookingTotals } from '@grana/blocks/booking'
import type { GalleryPhoto as GPhoto } from '@grana/vue/gallery'

createApp({}).use(ecommerce)

// La mudanza no cambia nada para Booking: el mismo tipo con el mismo nombre desde las dos entradas
const photo: Photo = { src: 'a.jpg', width: 1200, height: 1500, alt: 'Rebozo' }
const asBooking: BookingPhoto = photo
const asGallery: GPhoto = asBooking
const spec: PriceSpec = { value: { amount: 1650, currency: 'MXN' }, compareAt: { amount: 1850, currency: 'MXN' }, compareLabel: 'Precio de lista' }
const specBooking: BookingPriceSpec = spec
// Totals de Booking (sin kind ni included) sigue valiendo; el de Ecommerce admite la enmienda de #910
const booked: BookingTotals = { lines: [{ label: 'Hospedaje', amount: { amount: 3700, currency: 'MXN' } }], total: { value: { amount: 4223, currency: 'MXN' }, label: 'por 2 noches' } }
const shop: Totals = booked
const pending: TotalsLine = { label: 'Envío', amount: null, kind: 'shipping' }
const included: TotalsLine = { label: 'Incluye IVA', amount: { amount: 397.24, currency: 'MXN' }, kind: 'tax', included: true }
// @ts-expect-error: kind fuera de la lista
const badKind: TotalsLine = { label: 'x', amount: null, kind: 'tip' }

const product: Product = { id: 'jarro', name: 'Jarro', price: { value: { amount: 480, currency: 'MXN' } }, rating: { average: 4.6, count: 0 } }
// @ts-expect-error: Product sin id (obligatorio, EC5)
const noId: Product = { name: 'Jarro', price: { value: null } }
// @ts-expect-error: un campo de Product mal escrito
const typo: Product = { id: 1, name: 'x', price: { value: null }, precio: 3 }
// @ts-expect-error: rating sin count
const noCount: Product = { id: 1, name: 'x', price: { value: null }, rating: { average: 4 } }

const card: GbProductCardProps = { product, prices: { currency: 'MXN' }, labels: { add: 'Añadir', choose: 'Elegir opciones', rating: (r) => `${r.average} de ${r.max} · ${r.countText}` } }
// @ts-expect-error: product es obligatorio
const noProduct: GbProductCardProps = { labels: {} }
const onAdd = (p: ProductAdd) => p.options.map((o: ChosenOption) => `${o.label}: ${o.value}`)

const promo: GbPromoProps = { title: 'Temporada de muertos', actions: [{ label: 'Ver' }], until: '2026-11-02T23:59', code: { value: 'OAXACA10', label: 'Código' }, labels: { until: (d) => `Hasta el ${d}` } }
// @ts-expect-error: code sin label
const badCode: GbPromoProps = { title: 'x', actions: [], code: { value: 'X' } }

// cartTotals: su firma y su salida
const lines: CartLine[] = [{ id: 'l1', product: { id: 'espadin', name: 'Mezcal' }, quantity: 2, unitPrice: { amount: 890, currency: 'MXN' } }]
const totals: CartTotals = cartTotals(lines, { currency: 'MXN', taxes: [{ label: 'Incluye IVA', rate: 0.16, included: true }], labels: { subtotal: 'Subtotal', total: (n) => `por ${n} piezas` } })
const asTotals: Totals = totals
const left: number = totals.goals.length ? totals.goals[0].remaining.amount : 0
// @ts-expect-error: labels.subtotal es obligatoria
cartTotals(lines, { currency: 'MXN', labels: { total: 'Total' } })
// @ts-expect-error: un descuento lleva amount o percent
cartTotals(lines, { currency: 'MXN', discounts: [{ label: 'X' }], labels: { subtotal: 'S', total: 'T' } })

// Las tres variantes de una sección tienen la MISMA Props
type PropsOf<C> = C extends abstract new (...args: any) => { $props: infer P } ? P : never
type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false
const sameCard: [Same<PropsOf<typeof GbProductCard01>, PropsOf<typeof GbProductCard02>>, Same<PropsOf<typeof GbProductCard02>, PropsOf<typeof GbProductCard03>>] = [true, true]
export { asGallery, specBooking, shop, pending, included, card, onAdd, promo, asTotals, left, sameCard, GbPromo03 }
