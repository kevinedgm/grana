// Tipos de Ecommerce (dueño: bruno; design/contracts/blocks/_comun.md §28 a §31, #909 a #914). Escritos a mano y
// reexportados desde dist/ecommerce.d.ts (scripts/build-types.mjs los copia a dist/types/ecommerce.d.ts junto a
// dist/types/common.d.ts —los de más de una familia: Photo, PriceSpec, Totals…— y dist/types/marketing.d.ts —Media,
// Action, NavLink y los tipos de bloque de §2—). Sin `[key: string]: unknown`: un dato de la tienda con un nombre mal
// escrito debe fallar al compilar.
//
// Las partes B y C del lote añaden aquí los tipos de sus secciones (al final, en su apartado).
import type { Action, BlockActivate, BlockComponent, BlockNavigate, BlockSlotContent, Media, NavLink } from './marketing.js'
import type { GranaLabels } from '@grana/vue'
import type { Money, PriceLabels, PriceTotal } from '@grana/vue/price'
import type { Consent, GuestField, Photo, PhotoGroup, Policy, PriceRegion, PriceRegionLabels, PriceSpec, Reference, Totals, TotalsLine } from './common.js'

export type { Action, BlockActivate, BlockComponent, BlockNavigate, BlockSlotContent, Media, NavLink } from './marketing.js'
export type { Money, PriceLabels, PriceTotal } from '@grana/vue/price'
export type { GranaLabels } from '@grana/vue'
// Tipos de más de una familia (#909): viven en common.d.ts y se reexportan con los mismos nombres que en Booking
export type { Consent, GuestField, GuestFieldType, Photo, PhotoGroup, Policy, PriceRegion, PriceRegionLabels, PriceSpec, Reference, Totals, TotalsLine } from './common.js'

// ── Producto (§28) ──

/** max por defecto 5; `average` lo da la aplicación (no se calcula). Se dice en palabras: «4,8 de 5 · 312 opiniones» (#912). */
export interface Rating { average: number; max?: number; count: number }
/** Ya formateado: «Contenido» → «750 ml». */
export interface ProductFact { label: string; value: string }
export interface OptionValue {
  value: string | number
  label: string
  /** false o el motivo («Vuelve el 2 de diciembre»). */
  available?: boolean | string
  /** Índice en ProductDetail.photos. */
  photo?: number
}
export interface ProductOption {
  key: string
  label: string
  values: OptionValue[]
  /** Por defecto true: sin elegir, «Añadir» no emite (§27 regla 3). */
  required?: boolean
}
export interface Product {
  /** Obligatorio: identidad en add/open (EC5). */
  id: string | number
  name: string
  /** Idioma del nombre y del resumen si no es el de la página (3.1.2). */
  lang?: string
  /** Antetítulo: quien lo hace o la línea («Taller Mendoza · Teotitlán»). */
  maker?: string
  /** Una línea. */
  summary?: string
  /** La ficha (la tarjeta es enlace). */
  href?: string
  external?: boolean
  /** La primera es la portada. */
  photos?: Photo[]
  /** value, compareAt + compareLabel (C de price.md), lead («desde»), unit. */
  price: PriceSpec
  /** «Nuevo», «Últimas 3 piezas»: texto corto que da la aplicación, nunca solo color. */
  badge?: string
  rating?: Rating
  /** ≤ 2 a la vista en la tarjeta; la ficha los enseña todos. */
  facts?: ProductFact[]
  /** «3 colores · 4 tallas» (texto de la aplicación). */
  optionsSummary?: string
  /** Con alguna obligatoria, la acción rápida es «Elegir opciones» (§27 regla 3). */
  options?: ProductOption[]
  /** false: labels.unavailable; String: el motivo («Vuelve el 2 de diciembre»). */
  available?: boolean | string
}
export interface Variant {
  id: string | number
  /** Una entrada por ProductOption.key. */
  options: Record<string, string | number>
  /** Sin él, el de Product. */
  price?: PriceSpec
  available?: boolean | string
  /** Existencias o tope por pedido (GNumberField max). */
  max?: number
  photo?: number
  sku?: string
}
/** «Cuidados», «Envío y devoluciones». */
export interface ProductSection { id?: string; title: string; body?: string; items?: string[] }
export type ProductDetail = Product & {
  /** Obligatorio en la ficha (≥ 1). */
  photos: Photo[]
  groups?: PhotoGroup[]
  /** Párrafos separados por una línea en blanco. */
  description?: string
  variants?: Variant[]
  sections?: ProductSection[]
  /** «Hecho a mano: cada pieza cambia un poco», «Envío en 2 días hábiles». */
  note?: string
  /** Ancla a la sección de opiniones («#opiniones»). */
  reviews?: { href: string; label?: string }
}
/** La elección, tal como viaja (§27 regla 3): ya formateada para leerla igual en todas partes. «Talla» · «M». */
export interface ChosenOption { key?: string; label: string; value: string }
/** La elección en bruto: `{ [ProductOption.key]: OptionValue.value }` (v-model:selection). */
export type Selection = Record<string, string | number>

// ── Categorías, promociones, confianza (§28) ──

export interface Category {
  id?: string | number
  name: string
  lang?: string
  href: string
  description?: string
  media?: Media
  /** Piezas dentro; 0: «Vuelve pronto» y sin enlace (category-previews.md). */
  count?: number
  external?: boolean
}
/** «OAXACA10», «Código». */
export interface PromoCode { value: string; label: string }
/** policy: id de una Policy (ancla #policy de GbPolicies). */
export interface Incentive { id?: string | number; icon?: string; title: string; description?: string; action?: Action; policy?: string }

// ── Carrito (§28, §29) ──

export interface CartLine {
  /** Obligatorio (EC5). */
  id: string | number
  product: Pick<Product, 'id' | 'name' | 'lang' | 'href' | 'photos' | 'maker'>
  /** Variant.id elegida. */
  variant?: string | number
  /** La elección, como se leerá. */
  options?: ChosenOption[]
  /** Entero ≥ 0 (0 = quitar). */
  quantity: number
  /** Por defecto 1. */
  min?: number
  /** Existencias o tope por pedido. */
  max?: number
  unitPrice: Money | Money[]
  compareAt?: Money | Money[]
  compareLabel?: string
  /** Total de la línea; de la aplicación o de `cartTotals` (byLine). Sin él, solo el unitario. */
  total?: Money | Money[]
  /** false/motivo: «Ya no queda»; no entra en el total. */
  available?: boolean | string
  /** «Hecho a pedido: sale en 10 días». */
  note?: string
}
/** Salida de cartTotals (§29): un umbral («envío gratis desde $3,000»). */
export interface CartGoal { id: string; label: string; reached: boolean; remaining: Money; target: Money; value: Money }

/** Un descuento ya validado por la aplicación (cupón), por importe o por porcentaje del subtotal. */
export type CartDiscount = { id?: string; label: string } & ({ amount: Money } | { percent: number })
export interface CartTotalsOptions {
  /** La moneda del carrito (ISO 4217); obligatoria (CT1). */
  currency: string
  /** En orden; los da la aplicación (cupón ya validado). */
  discounts?: CartDiscount[]
  /** amount null: «se calcula después» (pending). */
  shipping?: { label: string; amount: Money | null; note?: string }
  /** rate en fracción (0.16) o amount ya calculado; included: ya va en los precios (se dice, no se suma). */
  taxes?: { label: string; rate?: number; amount?: Money; included?: boolean }[]
  /** Umbrales («envío gratis desde $3,000»). */
  goals?: { id: string; label: string; target: Money }[]
  /** total = PriceTotal.label («por 3 piezas»). */
  labels: { subtotal: string; total: string | ((count: number) => string) }
}
export type CartTotals = Totals & {
  /** Piezas que entran (suma de quantity de las líneas disponibles). */
  count: number
  subtotal: Money
  /** Total de cada línea, por String(id): para CartLine.total. */
  byLine: Record<string, Money>
  /** Ids que no entran: no disponibles, de otra moneda o con quantity inválida. */
  excluded: (string | number)[]
  /** Hay un importe por calcular (envío null). */
  pending: boolean
  /** Algún importe usado era `approximate`. */
  approximate: boolean
  goals: CartGoal[]
}

// ── Pago, pedido, historial (§28) ──

/** «Pago» · «Tarjeta terminada en 4242» (texto de la aplicación; nunca el número). */
export interface PaymentSummary { label: string; value: string }
/** date ISO (entrega estimada). */
export interface ShippingSummary { label: string; method?: string; address?: string[]; date?: string; note?: string }
export interface OrderLine {
  id: string | number
  name: string
  lang?: string
  href?: string
  photo?: Photo
  options?: ChosenOption[]
  quantity: number
  unitPrice?: Money | Money[]
  total: Money | Money[]
}
export interface OrderSummary {
  reference?: Reference
  placedAt?: string
  lines: OrderLine[]
  totals: Totals
  shipping?: ShippingSummary
  payment?: PaymentSummary
  note?: string
}
export type OrderStatus = 'pending' | 'paid' | 'preparing' | 'shipped' | 'delivered' | 'cancelled' | 'returned'
/** La aplicación da los pasos y el actual. */
export interface OrderProgress { steps: { id: string; label: string; date?: string }[]; current: string }
export interface Order {
  id: string | number
  reference: Reference
  placedAt: string
  status: OrderStatus
  statusText: string
  total: Money | Money[]
  count: number
  lines?: OrderLine[]
  href?: string
  tracking?: NavLink
  progress?: OrderProgress
  note?: string
}

// ── Checkout (§28) ──

export interface ChoiceOption { value: string; label: string; description?: string; price?: PriceSpec; disabled?: boolean | string }
export type CheckoutField = GuestField | (Omit<GuestField, 'type' | 'options' | 'autocomplete' | 'placeholder'> & { type: 'choice'; options: ChoiceOption[] })
export interface CheckoutStep {
  /** Obligatorio: v-model:step y slot `step-{id}` (EC5: sin él, el paso se omite). */
  id: string
  title: string
  description?: string
  /** Sin `fields`: un paso de la aplicación (slot `step-{id}`, p. ej. el pago). */
  fields?: CheckoutField[]
  /** Grupos dentro del paso (GFormSection), por `name`. */
  groups?: { id: string; title: string; fields: string[] }[]
  /** Casillas del paso, nunca marcadas. */
  consents?: Consent[]
  /** Texto del botón del paso («Continuar al envío», «Confirmar pedido»). */
  action: string
  /** Resumen del paso hecho que da la aplicación. */
  summary?: string
}

// ── Opiniones (§28) ──

/** value 1..max; la aplicación da las cuentas. */
export type ReviewSummary = Rating & { distribution?: { value: number; count: number }[] }
export interface Review {
  id?: string | number
  /** 1..max. */
  rating: number
  title?: string
  /** Párrafos separados por una línea en blanco. */
  quote: string
  lang?: string
  author: { name: string; avatar?: string; place?: string }
  /** ISO. */
  date: string
  /** true: labels.verified («Compra verificada»); String: ese texto. */
  verified?: boolean | string
  /** Lo que compró («Talla M»). */
  options?: ChosenOption[]
  /** Si la opinión viene de otro sitio. */
  source?: { label: string; href?: string; external?: boolean }
  /** La respuesta de la tienda, a la vista. */
  reply?: { author: string; quote: string; date?: string }
}

// ── Intenciones de Ecommerce (§30) ──

/** `add`: el producto, la variante resuelta (o null), la elección en bruto y ya dicha, y la cantidad. */
export interface ProductAdd {
  event: MouseEvent | KeyboardEvent
  product: Product
  variant: Variant | null
  selection: Selection
  options: ChosenOption[]
  quantity: number
}
/** `open` de una tarjeta (vista rápida o «Elegir opciones»). */
export interface ProductOpen { event: MouseEvent | KeyboardEvent; product: Product }
/** `open` de un pedido sin href (Order history). */
export interface OrderOpen { event: MouseEvent | KeyboardEvent; order: Order }
/** `change` de una línea: por gesto (el `change` de GNumberField). */
export interface CartLineChange { event: Event; line: CartLine; quantity: number }
/** `remove` y `restore` de una línea («Quitar» o cantidad 0; «Deshacer» de la huella, a la misma posición). */
export interface CartLineEvent { event: Event; line: CartLine; index: number }
/** `select` de una opción (informativo: la elección ya está en v-model:selection). */
export interface OptionSelect { event: Event; product: Product; key: string; value: string | number; variant: Variant | null }
/** `retry` de la región que falló. */
export interface BlockRetry { event: Event }

// ── E1 Product card (product-card.md) ──

/** El mismo tipo en Product card, Product grid (`labels.card`) y Cart: la tarjeta se lee igual en todas partes. */
export interface ProductCardLabels {
  /** «Añadir al carrito» (03). */
  add?: string
  /** «Elegir opciones» (03, producto con opciones obligatorias; EC3). */
  choose?: string
  /** «Añadiendo…» (loadingText de GBtn). */
  busy?: string
  /** «No disponible» (available: false). */
  unavailable?: string
  /** «{average} de {max} · {count} opiniones»; {count} con agrupación del idioma. */
  rating?: string | ((r: { average: string; max: string; count: number; countText: string }) => string)
  /** «Todavía sin opiniones» (rating con count 0). */
  noReviews?: string
  price?: PriceRegionLabels
  external?: string
}

// ── E3 Category previews (category-previews.md) ──

export interface CategoryPreviewsLabels {
  /** «{count} piezas»; {count} con agrupación del idioma. */
  count?: string | ((count: number) => string)
  /** «Vuelve pronto» (count: 0). */
  empty?: string
  external?: string
}

// ── E12 Trust (trust.md) ──

export interface TrustLabels {
  /** «Ver la política» / «Ver {title}» (enlace de `policy`). */
  policy?: string | ((title: string) => string)
  external?: string
}

// ── E11 Promo (promo.md) ──

export interface PromoLabels {
  /** «Hasta el {date}». */
  until?: string | ((date: string) => string)
  /** «Copiar código». */
  copy?: string
  external?: string
}
/** Las acciones de la sección (`navigate`/`activate`) y «Copiar código» (`activate` con el código). */
export type PromoActivate = BlockActivate<Action> | BlockActivate<PromoCode>

// ── E2 Product grid (product-grid.md) ──

/** Un filtro de la vista: los valores con cuántos quedarían eligiendo cada uno (lo da la aplicación). */
export interface Facet {
  key: string
  /** «Material». */
  label: string
  options: { value: string | number; label: string; count?: number }[]
}
export interface SortOption { value: string; label: string }
export interface ProductGridLabels {
  /** «{count} productos»; {count} con agrupación del idioma. */
  count: string | ((count: number) => string)
  /** Nombre del grupo de facetas («Filtrar»). */
  facets?: string
  /** «Quitar filtros». */
  clear?: string
  /** Rótulo del orden («Ordenar por»). */
  sort?: string
  /** Sin productos y sin filtros. */
  empty: { title: string; description?: string }
  /** Sin productos por los filtros. */
  emptyFiltered?: { title: string; description?: string }
  /** Los de la tarjeta (product-card.md), tal cual. */
  card: ProductCardLabels
  /** A GLoadRegion (loading, loaded, slow, refreshing, failed, retry). */
  region?: GranaLabels
  /** A GEmpty (relax, returns, clear, before). */
  emptyLabels?: GranaLabels
  /** A GTagGroup. */
  tags?: GranaLabels
  /** A GPagination. */
  pagination?: GranaLabels
}

// ── E4 Product overview (product-overview.md) ──

/** El enlace a las opiniones de la ficha («#opiniones»): el `item` de su `navigate`. */
export type ProductReviewsLink = NonNullable<ProductDetail['reviews']>
export interface OverviewLabels {
  /** «Añadir al carrito». */
  add: string
  /** «Añadiendo…». */
  busy?: string
  /** Rótulo de la cantidad («Cantidad»). */
  quantity: string
  /** Botones de GNumberField («Quitar una», «Añadir una»). */
  decrement: string
  increment: string
  /** Error de una opción sin elegir: «Elige {option}». */
  choose: string | ((option: string) => string)
  /** El producto o la combinación no se puede pedir. */
  unavailable?: string
  /** Nombre de un valor sin existencias: «{value}, agotada». */
  unavailableValue?: string | ((value: string) => string)
  /** Título de la galería («Fotos del rebozo»). */
  photos: string
  /** Nombre de la ficha técnica («Ficha»). */
  facts?: string
  /** Nombre de la descripción («Descripción»). */
  details?: string
  /** Nombre del tablist (03). */
  tabs?: string
  rating?: ProductCardLabels['rating']
  noReviews?: string
  /** Texto del enlace a las opiniones («Leer las opiniones»). */
  reviews?: string
  /** A GGallery, tal cual. */
  gallery?: GranaLabels
  price?: PriceRegionLabels
  external?: string
}

// ── E5 Quick view (quick-view.md) ──

/** El disparador, tal cual a `from` de GDialog (#583): `id` o elemento. */
export type DialogFrom = string | HTMLElement
export type QuickViewLabels = OverviewLabels & {
  /** Nombre del botón de cerrar (closeLabel de GDialog). */
  close: string
  /** «Ver la ficha completa» (con product.href). */
  full?: string
  /** A GDialog, tal cual. */
  dialog?: GranaLabels
}

// ── E6 Reviews (reviews.md) ──

export interface ReviewsLabels {
  /** Rótulo de GMetric («Calificación media»). */
  average: string
  /** Unidad del promedio: «de {max}». */
  outOf: string | ((max: string) => string)
  /** Contexto de GMetric: «{count} opiniones». */
  count: string | ((count: number) => string)
  /** «Todavía sin opiniones». */
  noReviews: string
  /** La de cada opinión: «{value} de {max}». */
  score: string | ((r: { value: string; max: string }) => string)
  /** Fila de la distribución: «{value} de {max}: {count} ({percent})». */
  row?: string | ((r: { value: string; max: string; count: number; countText: string; percent: string }) => string)
  /** Nombre de la lista de la distribución («Cómo se reparten»). */
  distribution?: string
  /** «Compra verificada» (verified: true). */
  verified?: string
  /** Rótulo de lo que compró («Compró»). */
  bought?: string
  /** «Respuesta de {author}». */
  reply?: string | ((author: string) => string)
  /** A GPagination. */
  pagination?: GranaLabels
  external?: string
}

// ── E9 Order summary (order-summary.md) ──

export interface OrderSummaryLabels {
  /** Nombre de la lista de lo comprado («Lo que compraste»). */
  lines: string
  /** «{count} piezas» (y la cuenta de 03). */
  quantity: string | ((count: number) => string)
  /** Término del total («Total»): el último par del desglose. */
  total: string
  /** Una línea de Totals con amount null («Se calcula en el siguiente paso»). */
  pending?: string
  /** «Pedido el {date}» (placedAt, en la zona de la tienda). */
  placedAt?: string | ((date: string) => string)
  /** «Llega el {date}» (shipping.date). */
  delivery?: string | ((date: string) => string)
  /** Rótulo del código si `reference` no trae `label` («Número de pedido»). */
  reference?: string
  price?: PriceRegionLabels
  external?: string
}

// ── E7 Cart (cart.md) ──

/** 03: el disparador del cajón, tal cual a `from` de GDialog (#583): `id` o elemento. */
export type CartFrom = string | HTMLElement

export interface CartLabels {
  /** Nombre del campo de cantidad: «Cantidad de {name}». */
  quantity: string | ((name: string) => string)
  /** Escalones de GNumberField («Quitar una», «Añadir una»). */
  decrement: string
  increment: string
  /** Nombre accesible de «Quitar»: «Quitar {name}». */
  remove: string | ((name: string) => string)
  /** Texto visible de «Quitar» (obligatorio si `remove` es una función). */
  removeText?: string
  /** La huella: «Quitaste {name}». */
  removed: string | ((name: string) => string)
  /** «Deshacer» (con escucha de `restore`). */
  undo: string
  /** Una línea con available: false («Ya no está disponible»). */
  unavailable?: string
  /** Lo que no entra: «{count} artículos no entran en tu pedido». */
  excluded?: string | ((count: number) => string)
  /** Unidad del total de la línea: «por {count} piezas». */
  forQuantity?: string | ((count: number) => string)
  /** Unidad visible del unitario («c/u») y su lectura («cada una»). */
  each?: string
  eachLabel?: string
  /** Título del resumen («Resumen»). */
  summary: string
  /** Término del total («Total»). */
  total: string
  /** Una línea de Totals con amount null («Se calcula en el siguiente paso»). */
  pending?: string
  /** El umbral: «Te faltan {remaining} para {label}» y «Ya tienes {label}». */
  goal?: string | ((g: { label: string; remaining: string }) => string)
  goalReached?: string | ((label: string) => string)
  /** El carrito vacío (GEmpty). */
  empty: { title: string; description?: string }
  /** 03: nombre del cierre del cajón y los textos de GDialog. */
  close?: string
  dialog?: GranaLabels
  price?: PriceRegionLabels
  external?: string
}

// ── E8 Checkout (checkout.md) ──

export interface CheckoutLabels {
  /** «Escribe {label}» / «Revisa {label}» / «Elige {label}» (el motor de campos de Guest form). */
  required: string
  invalid: string
  choose?: string
  /** El mensaje de un consentimiento obligatorio y el título de su grupo. */
  consent?: string
  consents?: string
  /** «Atrás» (01, 03). */
  back: string
  /** «Cambiar {step}» (el resumen de un paso hecho). */
  edit: string | ((step: string) => string)
  /** Título del pedido («Tu pedido»). */
  order: string
  /** Término del total («Total»): el pie y el desglose del pedido. */
  total: string
  /** loadingText del botón con `busy`. */
  busy?: string
  /** Los de Order summary para el pedido. */
  lines?: string
  quantity?: string | ((count: number) => string)
  pending?: string
  placedAt?: string | ((date: string) => string)
  delivery?: string | ((date: string) => string)
  reference?: string
  /** A sus componentes, tal cual. */
  form?: GranaLabels
  errorSummary?: GranaLabels
  stepper?: GranaLabels
  datePicker?: GranaLabels
  price?: PriceRegionLabels
  external?: string
}
/** `submit` de un paso: síncrono y cancelable (sin preventDefault(), el bloque avanza al siguiente). */
export interface CheckoutSubmit {
  event: SubmitEvent | Event
  step: string
  data: FormData | null
  values: Record<string, string>
  consents: Record<string, boolean>
  final: boolean
  preventDefault(): void
  defaultPrevented: boolean
}

// ── E10 Order history (order-history.md) ──

export interface OrderHistoryLabels {
  /** Columnas y rótulos («Pedido», «Fecha», «Estado», «Total»). */
  reference: string
  date: string
  status: string
  total: string
  /** «{count} piezas». */
  count: string | ((count: number) => string)
  /** «Ver el pedido {reference}». */
  open: string | ((reference: string) => string)
  /** «Seguir el envío» (con tracking). */
  tracking?: string
  /** Nombre del GStepper de 02: «Seguimiento del pedido {reference}». */
  progress?: string | ((reference: string) => string)
  /** A GTable labels.detail (01, con lines): «Pedido {title}». */
  detail?: string
  /** El vacío (GEmpty). */
  empty: { title: string; description?: string }
  /** A sus componentes, tal cual: GTable (01), GLoadRegion (02, 03), GPagination, GStepper (02). */
  table?: GranaLabels
  region?: GranaLabels
  pagination?: GranaLabels
  stepper?: GranaLabels
  price?: PriceRegionLabels
  external?: string
}
