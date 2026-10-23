// Tipos de más de una familia de @grana/blocks (dueño: bruno; design/contracts/blocks/_comun.md §28, #909, #910). Escritos
// a mano; booking.d.ts y ecommerce.d.ts los reexportan CON LOS MISMOS NOMBRES (ninguna importación de la aplicación
// cambia), y scripts/build-types.mjs los copia a dist/types/common.d.ts. Media, Action y NavLink siguen en marketing.d.ts.
// Sin `[key: string]: unknown`: un dato con un nombre mal escrito debe fallar al compilar.
import type { NavLink } from './marketing.js'
import type { Money, PriceLabels, PriceTotal } from '@grana/vue/price'

// ── De @grana/vue, escritos con su forma (una prueba de tipos comprueba que encajan) ──

/** Foto de GGallery (`gallery.md` «Datos de foto»); asignable a `photos` de GGallery/GGalleryViewer. */
export interface Photo {
  src: string
  thumb?: string
  srcset?: string
  sizes?: string
  thumbSrcset?: string
  thumbSizes?: string
  width: number
  height: number
  alt: string
  caption?: string
  group?: string | number
  id?: string | number
}
/** `groups` de GGallery. */
export interface PhotoGroup { value: string | number; label: string; id?: string }

// ── Precio ──

/** Lo que va tal cual a GPrice (sin renombrar: mismas claves que sus props). */
export interface PriceSpec {
  value: Money | Money[] | null
  max?: Money | Money[]
  compareAt?: Money | Money[]
  compareLabel?: string
  lead?: string
  unit?: string
  unitLabel?: string
  total?: PriceTotal
}
/** Lo que va a GPriceScope (una región por lista o tarjeta). */
export interface PriceRegion { currency: string; view?: string; legend?: boolean; taxes?: string; locale?: string }
/** Una línea de `Totals`. Enmienda aditiva de #910: `kind` dice qué es y `included` si ya va en los precios («Incluye IVA
 *  $172»: se dice, no se suma); `amount: null` es «se calcula después» (se pinta con `labels.pending`). Booking no la usa. */
export interface TotalsLine {
  label: string
  amount: Money | Money[] | null
  note?: string
  kind?: 'subtotal' | 'discount' | 'shipping' | 'tax' | 'fee'
  included?: boolean
}
/** Lo que se cobra, ya calculado por la aplicación o por `cartTotals` (los bloques no suman, #769, #911). */
export interface Totals {
  lines?: TotalsLine[]
  total: PriceTotal
  note?: string
}
/** `labels.price` de una región: los de GPriceScope/GPrice y su leyenda. */
export type PriceRegionLabels = PriceLabels & { legend?: string }

// ── Datos de quien reserva o compra ──

/** Lista cerrada; por defecto 'text' (guest-form.md). */
export type GuestFieldType = 'text' | 'email' | 'tel' | 'textarea' | 'select' | 'date'
export interface GuestField {
  name: string
  label: string
  type?: GuestFieldType
  /** Token de HTML (`given-name`, `tel`, `email`…), 1.3.5; obligatorio en la práctica en `email` y `tel` (G2). */
  autocomplete?: string
  required?: boolean
  hint?: string
  placeholder?: string
  /** Por qué se pide («Para avisarte si cambia el clima»); se suma a la ayuda. */
  why?: string
  /** Solo `select`. */
  options?: { value: string; label: string }[]
  /** Grupo (`groups` de la sección). */
  group?: string
  /** Campos con el mismo `row` comparten GFormRow. */
  row?: string
  messages?: { required?: string; invalid?: string }
}
/** policy = id de una Policy (el ancla de GbPolicies); sin `link`, el enlace `#{policy}` con `linkLabel` (#880, G8). */
export interface Consent { name: string; label: string; required?: boolean; link?: NavLink; policy?: string; linkLabel?: string }
export interface Policy { id?: string; title: string; summary?: string; body: string; icon?: string; link?: NavLink }

// ── Referencia de una reserva o un pedido ──

/** «A7K-29Q», «Código de reserva»; «BYA-2611-07», «Pedido». */
export interface Reference { code: string; label: string }
