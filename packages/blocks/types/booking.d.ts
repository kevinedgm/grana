// Tipos compartidos de Booking (dueño: bruno; design/contracts/blocks/_comun.md §16, #860, #861). Escritos a mano y
// reexportados desde dist/booking.d.ts (scripts/build-types.mjs los copia a dist/types/booking.d.ts junto a
// dist/types/marketing.d.ts, de donde vienen Media, Action, NavLink y los tipos de bloque de §2). Sin
// `[key: string]: unknown`: un dato de reserva con un nombre mal escrito debe fallar al compilar.
//
// Las partes B y C del lote añaden aquí los tipos de sus secciones (al final, en su apartado).
import type { Action, BlockActivate, BlockComponent, BlockNavigate, BlockSlotContent, Media, NavLink } from './marketing.js'
import type { GranaLabels } from '@grana/vue'
import type { BookingSubmitEvent } from '@grana/vue/booking'
import type { GalleryLabels } from '@grana/vue/gallery'
import type { Money, PriceLabels, PriceTotal } from '@grana/vue/price'

export type { Action, BlockActivate, BlockComponent, BlockNavigate, BlockSlotContent, Media, NavLink } from './marketing.js'
export type { Money, PriceLabels, PriceTotal } from '@grana/vue/price'
export type { GranaLabels } from '@grana/vue'
export type { GalleryLabels } from '@grana/vue/gallery'

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

/** Fila de GPartyField (`booking-bar.md` «Filas»); asignable a `rows` de GPartyField y `partyRows` de GBookingBar. */
export interface PartyRow {
  key: string
  label: string
  hint?: string
  min?: number
  max?: number | ((value: Record<string, number>) => number)
  default?: number
  unit?: string | ((count: number) => string)
  decrementLabel: string
  incrementLabel: string
}
/** El modelo de GPartyField. */
export type Party = Record<string, number>

// ── La consulta (el hilo, #864) ──

export type BookingKind = 'stay' | 'table' | 'tour'
/** El modelo de GBookingBar con su `kind`: lo que sale del `submit` sin `event` ni funciones. Fechas ISO sin zona. */
export type BookingQuery =
  | { kind: 'stay'; from: string | null; to: string | null; party: Party }
  | { kind: 'table'; date: string | null; time: string | null; party: Party }
  | { kind: 'tour'; tour: string | number | null; date: string | null; party: Party }
/** Textos para decir la consulta: las claves de GBookingBar con el mismo significado (#862). */
export interface QueryLabels {
  nights: string | ((n: number) => string)
  separator: string
  checkout?: string
  noDates?: string
  noDate?: string
  noTime?: string
  noTour?: string
}
export interface QueryContext {
  partyRows: PartyRow[]
  times?: { value: string; label?: string }[]
  tours?: { value: string | number; label: string }[]
}
/** `context` de una sección (las filas del grupo van en su prop `partyRows`). */
export type QueryContextExtra = Omit<QueryContext, 'partyRows'>

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
/** Lo que cobra el lugar, ya calculado por la aplicación (Grana no suma, #769). */
export interface Totals {
  lines?: { label: string; amount: Money | Money[]; note?: string }[]
  total: PriceTotal
  note?: string
}
/** `labels.price` de una región: los de GPriceScope/GPrice y su leyenda. */
export type PriceRegionLabels = PriceLabels & { legend?: string }

// ── Ofertas ──

/** Ya formateado; `group` = espacio de la galería que lo enseña. */
export interface OfferFact { label: string; value: string; group?: string | number }
export interface Offer {
  /** Obligatorio: identidad en `select` (K5). */
  id: string | number
  name: string
  /** Antetítulo: «Suite», «Mesa en terraza», «Recorrido a pie». */
  kind?: string
  /** Una línea. */
  summary?: string
  /** La primera es la portada; «Ver fotos» con dos o más. */
  photos?: Photo[]
  /** Capacidad, m², cama, duración (≤ 4 a la vista; C7 por encima de 6). */
  facts?: OfferFact[]
  /** «Desayuno incluido», «Cancelación gratis». */
  perks?: string[]
  price?: PriceSpec
  /** Texto corto («La más pedida»); nunca solo color. */
  badge?: string
  /** false: labels.unavailable; String: el motivo visible. */
  available?: boolean | string
  /** Página de la oferta (la tarjeta es enlace). */
  href?: string
  external?: boolean
  /** Idioma del nombre, el resumen y los detalles si no es el de la página (3.1.2, #885); va a la raíz de lo que los pinta. */
  lang?: string
}
/** Lo que una sección necesita de una oferta ya elegida (Guest form, Confirmation). */
export type OfferRef = Pick<Offer, 'id' | 'name' | 'kind' | 'photos' | 'price'>
/** «Qué incluye», «No incluye», «La cama». */
export interface OfferSection { id?: string; title: string; body?: string; items?: string[] }
export type OfferDetail = Offer & { description?: string; groups?: PhotoGroup[]; sections?: OfferSection[] }

// ── Disponibilidad ──

export type DayStatus = 'open' | 'few' | 'full' | 'closed'
/** note: «Quedan 2», «Solo terraza». */
export interface AvailabilityDay { date: string; status: DayStatus; price?: PriceSpec; note?: string }

// ── Datos de quien reserva ──

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
export interface GuestGroup { id: string; title: string; description?: string }
/** policy = id de una Policy (el ancla de GbPolicies). */
export interface Consent { name: string; label: string; required?: boolean; link?: NavLink; policy?: string }
export interface Policy { id?: string; title: string; summary?: string; body: string; icon?: string; link?: NavLink }

// ── Confirmación y contacto ──

/** «A7K-29Q», «Código de reserva». */
export interface Reference { code: string; label: string }
/** WhatsApp, tel:, mailto:; hint: «Respuesta en menos de 2 h». */
export type Channel = NavLink & { icon?: string; hint?: string }
export interface NextStep { id?: string | number; title: string; description?: string; date?: string }

// ── Itinerario, carta, ubicación (partes B y C) ──

/** time/end: HH:mm del lugar. */
export interface Stop { id?: string | number; time?: string; end?: string; title: string; description?: string; place?: string; media?: Media }
export interface ItineraryDay { id?: string | number; label: string; date?: string; summary?: string; stops: Stop[] }
export interface MenuItem {
  id?: string | number
  name: string
  lang?: string
  description?: string
  price?: PriceSpec
  tags?: string[]
  media?: Media
  available?: boolean | string
}
export interface MenuSection { id?: string; name: string; description?: string; hours?: string; items: MenuItem[] }
export interface Point { id?: string | number; name: string; address?: string[]; time?: string; description?: string; directions?: Action; media?: Media }

// ── Intenciones de Booking (_comun.md §17) ──

/** `select` de Offer list: la oferta entera y la consulta. */
export interface OfferSelect { event: MouseEvent | KeyboardEvent; offer: Offer; query: BookingQuery | null }
/** `photos` de Offer list (informativo: el bloque ya abre el visor). */
export interface OfferPhotos { event: MouseEvent | KeyboardEvent; offer: Offer; index: number }

// ── B1 Search (search.md) ──

/** `labels` de GBookingBar (booking-bar.md «Textos»), tal cual. */
export type GBookingBarLabels = GranaLabels
export interface SearchLabels { bar: GBookingBarLabels }
/** `(iso, query) => boolean` de GBookingBar (`disabledDates`, `disabledNights`). */
export type DateRule = (iso: string, query: BookingQuery) => boolean
export interface BookingTime { value: string; label?: string; disabled?: boolean | string }
export interface BookingTour { value: string | number; label: string; description?: string; disabled?: boolean | string }
/** `times` de GBookingBar: lista o función del día. */
export type BookingTimes = BookingTime[] | ((date: string) => BookingTime[])
export interface BookingNames { from?: string; to?: string; nights?: string; date?: string; time?: string; tour?: string; party?: string }
/** `submit` de Search: la carga de GBookingBar tal cual. */
export type SearchSubmit = BookingSubmitEvent

// ── B2 Offer list (offer-list.md) ──

export interface OfferListLabels {
  /** «Elegir». */
  select?: string
  /** «Ver {count} fotos». */
  photos?: string | ((count: number) => string)
  /** «No disponible en tus fechas». */
  unavailable?: string
  /** «Para {query}». */
  forQuery?: string
  query?: QueryLabels
  price?: PriceRegionLabels
  gallery?: GalleryLabels
  external?: string
}

// ── B6 Guest form (guest-form.md) ──

/** Con `query.party` y `partyRows`: el GPartyField del grupo. */
export interface GuestParty { label: string; name?: string; hint?: string }
export interface GuestFormLabels {
  /** «Escribe {label}». */
  required: string
  /** «Revisa {label}». */
  invalid: string
  /** «Marca esta casilla para continuar». */
  consent?: string
  next?: string
  back?: string
  busy?: string
  forQuery?: string
  query?: QueryLabels
  form?: GranaLabels
  errorSummary?: GranaLabels
  stepper?: GranaLabels
  party?: GranaLabels
  price?: PriceRegionLabels
  datePicker?: GranaLabels
  external?: string
}
/** `submit` de Guest form: envío sin errores. */
export interface GuestSubmit {
  event: Event
  data: FormData | null
  /** Recortados. */
  values: Record<string, string>
  party: Party | null
  consents: Record<string, boolean>
  /** Con la `party` corregida. */
  query: BookingQuery | null
}
/** Alcance del slot `field-{name}`. */
export interface GuestFieldSlot { field: GuestField; value: string; error: string | undefined; id: string }

// ── B7 Confirmation (confirmation.md) ──

export type ConfirmationState = 'confirmed' | 'requested'
export interface ConfirmationLabels {
  states: { confirmed: string; requested: string }
  query: QueryLabels
  /** «Cuándo y quiénes». */
  when?: string
  next?: string
  channels?: string
  stepper?: GranaLabels
  price?: PriceRegionLabels
  external?: string
}

// ── B8 Itinerary (itinerary.md; parte B) ──

export interface ItineraryLabels {
  /** «Ahora»; con algún `date` (C5 al marcar; sin él, solo aria-current). */
  now?: string
  /** «Siguiente». */
  next?: string
  /** Cabeceras de columna de 03: «Hora», «Parada», «Lugar» (C5 en 03). */
  time?: string
  stop?: string
  place?: string
  external?: string
}

// ── B10 Location (location.md; parte B) ──

export interface LocationLabels {
  /** Nombre de la tarjeta del mapa en 02 («Mapa de la zona»). */
  map?: string
  /** Título de los puntos de encuentro en 03. */
  points?: string
  /** Rótulo del horario («Horario»). */
  hours?: string
  /** Nombre de la lista de canales («Escríbenos»). */
  channels?: string
  external?: string
}

// ── B11 Policies (policies.md; parte B) ──

export interface PoliciesLabels { external?: string }

// ── B3 Offer detail (offer-detail.md; parte B) ──

export interface OfferDetailLabels {
  /** Título de la galería («Fotos de la suite»). */
  photos: string
  /** Título de la ficha («La suite»). */
  facts: string
  /** Nombre de la lista de lo que incluye («Incluye»), con perks. */
  perks?: string
  /** «Reservar esta suite» (sin slot `consult`). */
  book?: string
  unavailable?: string
  /** «Ver {group}»: el enlace de un dato a las fotos de su espacio. */
  showPhotos?: string | ((group: string) => string)
  /** Pestaña de la descripción (02). */
  details?: string
  /** Nombre del grupo de pestañas (02). */
  tabs?: string
  /** «Para {query}». */
  forQuery?: string
  query?: QueryLabels
  /** A GGallery, tal cual. */
  gallery?: GalleryLabels
  price?: PriceRegionLabels
}
/** `book` de Offer detail: la oferta entera y la consulta. */
export interface OfferBook { event: MouseEvent | KeyboardEvent; offer: OfferDetail; query: BookingQuery | null }
