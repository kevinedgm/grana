# Plan · `@grana/blocks` — bloques de página para Marketing, Ecommerce y Booking

> 2026-10-21. Elaborado a partir de la página de Notion «🧱 Grana Blocks» (estado: prototipo documentado, P0), del inventario de marketing de kiwi (`design/lab/marketing/r01/`), de los contratos vigentes de las primitivas (`stack.md`, `container.md`, `section.md`, `adaptive-layout.md`, `card-group.md`) y de los componentes de marketing ya `candidate` (`GHero`, `GGallery`/`GGalleryViewer`, `GBookingBar`/`GPartyField`). **Estado:** decisiones D1 a D4 tomadas (#764 a #767; D2 enmendada por #814); lote 2 contratado (#815 a #826) y cerrado (#858); **lote 3 (Booking) contratado** (#860 a #877). No toca código.

## 1. Qué cambia respecto a la página de Notion

La página de Notion define Grana Blocks como **capa de composición para pantallas de negocio** (CRUD, detalle, dashboard: `GResourceList`, `GResourceEditor`, `GResourceDetail`, `GDashboard`, `GConfirmAction`). Ese plan sigue vigente y es una **familia más**: *Gestión*. Este documento añade las tres familias que pidió el usuario, **Marketing, Ecommerce y Booking**, con la intención del prompt de «snips»: bloques **puramente estructurales**, con **la misma `interface Props` entre las variantes de una sección**, cero CSS propio y la estética solo por tokens.

Las decisiones de Notion que se mantienen tal cual:

| Decisión de Notion | Cómo aplica a estas tres familias |
| --- | --- |
| Empezar dentro de `@grana/vue` (`packages/vue/src/blocks/`) | **Sustituida por #780 y #814:** los bloques nacen en `@grana/blocks` (`packages/blocks/`), con `@grana/vue` como *peer* |
| Bloques transparentes: props, eventos y slots; sin lógica de negocio | Igual. Un bloque **emite intención** (`select`, `add`, `submit`, `navigate`) y nunca navega ni muta |
| Datos externos al núcleo, sin `fetch` | Igual. Precios, fotos, disponibilidad y opiniones llegan por props |
| Responsive como responsabilidad del bloque | Se cumple **por construcción**: el bloque solo usa `GContainer`, `GStack`, `GSection`, `GAdaptiveLayout`, `GCardGroup`, `GFormLayout`+`GFormRow`; ninguna media query |

## 2. Reglas de arquitectura de un bloque (traducidas a Grana)

Las cuatro reglas del prompt, con lo que **existe de verdad** en Grana:

1. **Cero CSS de layout y cero CSS propio.** Un bloque es un `.vue` sin `<style>` y **sin archivo `.css`**: distribuye con `GContainer` (columna y márgenes, `width`, `prose`, `g-bleed`), `GStack` (un eje, `gap` `none|sm|md|lg`, `divided`), `GSection` (encabezado automático por anidación), `GAdaptiveLayout` (reparto por tamaño con pistas `g-adapt-*`), `GCardGroup` (grupo de tarjetas) y `GFormLayout`+`GFormRow` (campos). Si un bloque «necesita» CSS, es que falta una primitiva o una prop: se anota como hallazgo para lima, no se escribe CSS.
2. **Interfaz compartida.** Cada sección define **una sola `interface Props`** en su contrato (`design/contracts/blocks/<seccion>.md`) y en un único `meta.json` compartido por sus variantes (los `.d.ts` se generan desde ahí, #443). Cambiar `<GbFeatures01>` por `<GbFeatures02>` no toca los datos. Una variante **no añade props**; lo que no usa, lo ignora en silencio.
3. **Accesibilidad y ritmo.** HTML semántico (`section` con nombre vía `GSection`, listas reales, `figure`/`blockquote`/`cite` en opiniones, `address` en ubicación, `dl` en cartas y especificaciones); un solo `h1` por página (el de `GHero`); nada se mueve solo (2.2.2). El aire sale de `gap` de `GStack`/`GAdaptiveLayout` (`sm` «va con lo anterior», `md`, `lg` «otro tema») y de `GSection`, nunca de un número.
4. **Componentes base.** Grana **no tiene componentes de tipografía**: el título lo pone `GSection`/`GCard`/`GHero`, el cuerpo es prosa (`p`, `ul`, `dl`) dentro de `GContainer prose` o del cuerpo de `GSection`. Botones `GBtn` (`variant` `solid|soft|outline|link`), tarjetas `GCard` (`mediaPosition`, `meta`, `badge`, `interaction="link"`), fotos `GGallery`/`GGalleryViewer`, iconos `GIcon` (solo Lucide), etiquetas `GTag`/`GBadge`, avatar `GAvatar`.

**Nombre y prefijo (D1, decidido, #764):** `Gb` + sección + número: `GbFeatures01`, `GbPricing02`, `GbProductGrid01`, `GbRoomList01`. Tag `gb-features-01`. Sin clases `gb-*` (no hay CSS).

**Ubicación (D2, enmendada por #814 tras #780):** los bloques viven en el paquete aparte **`@grana/blocks`**, en `packages/blocks/src/blocks/`, con `@grana/vue` y `vue` como *peer* y una entrada por familia (`@grana/blocks/marketing`, luego `/booking` y `/ecommerce`; #815). Los bloques estructurales de estas tres familias no llevan CSS; los de Gestión con forma propia (`GResourceList`) sí, en `@layer grana.blocks` (`api.md` «Grana Blocks» regla 3). Contratos del lote 2 en `design/contracts/blocks/` (`_comun.md` y uno por sección).

## 3. Lo que ya está y lo que bloquea

**Listo para componer (candidate):** `GHero` (A ventana / B vistas / C umbral), `GGallery` + `GGalleryViewer`, `GBookingBar` + `GPartyField`, `GCard` + `GCardGroup`, `GAccordion`, `GTabs`, `GTable`, `GFilterBar`, `GPagination`, `GForm` y todos los campos, `GStepper`, `GDialog`/`GDialogStep`, `GPageHeader`, `GAppShell`, `GContainer`/`GStack`/`GSection`, `GAdaptiveLayout`, `GSummary`, `GEmpty`/`GLoadRegion`, `GFab`, `GMenu` con enlaces, zona de marca (`data-g-zone="brand"`).

**Bloquea bloques concretos (ya anotado por kiwi en `marketing/r01`, hallazgos M-L1 a M-L7):**

| Falta | Qué bloquea | Dónde está |
| --- | --- | --- |
| **Precio y moneda** (`GPrice` o `formatPrice`, ronda #154) | Pricing, tarjeta de oferta, carta, product card, cart, order summary, room list, tour list | M-L1; la ronda de moneda es **el primer prerrequisito** del plan |
| **Calificación** (`star` de Lucide + patrón de lectura «4,8 de 5») | Testimonials, reviews, product card | M-L2 |
| `lang`/`hreflang` en elementos-enlace de `GMenu` | Header con selector de idioma | M-L3 |
| **`GEmbed`** (fachada de carga a petición: mapa, vídeo) | Location, Contact | ronda futura (kiwi) |
| Cabecera transparente sobre el héroe | Header 02 | H-L6, reservada |
| Motor de carrito (cantidad, quitar, totales) | Cart, Checkout | no existe; el bloque recibe líneas y emite `change`/`remove`, el total lo calcula la aplicación o una utilidad `cartTotals` sin estado |

## 4. Lista de bloques

Por familia: sección, variantes (concepto de layout), `Props` compartida, componentes que compone, dependencias y prioridad. **P0** = componible hoy; **P1** = tras la ronda de moneda; **P2** = necesita un componente o ronda nueva.

### 4.1 Marketing (14 secciones)

> Las nueve secciones P0 tienen contrato en `design/contracts/blocks/` (#815 a #826). Donde difieren de esta tabla manda el contrato (correcciones en `_comun.md` §10: `GCardGroup` no es una rejilla, Newsletter con `GInput` y su slot `action`, sin `eyebrow` en `GSection`, `rating` reservado, FAQ 02 «todo a la vista»).

| # | Sección | Variantes | Props compartida (resumen) | Compone | Dep. | Pri. |
| --- | --- | --- | --- | --- | --- | --- |
| M1 | **Header** (cabecera del sitio) | 01 logo + nav + acción · 02 nav centrada con acción en zona de marca · 03 compacta con cajón móvil | `{ brand: { name, href, logo? }, links: NavLink[], action?: Action, locales?: Locale[] }` | `GAppShell` slot header, `GBtn`, `GMenu` (idiomas), `GSidebar drawer` | M-L3 para idiomas | P0 (idiomas P2) |
| M2 | **Hero** | 01 ventana (`GHero window`) · 02 vistas (`views`) · 03 umbral con consulta (`threshold` + slot) | `{ eyebrow?, title, lead?, aside?, media, detail?, views?, actions: Action[] }` | `GHero`, `GBtn` | — | P0 |
| M3 | **Features** | 01 rejilla de 3 a 6 con icono · 02 lista alternada texto/imagen · 03 una columna de lectura con `dl` | `{ eyebrow?, title, description?, items: Feature[] }` con `Feature = { title, description, icon?, media? }` | `GSection`, `GAdaptiveLayout`, `GCard`, `GIcon`, `GContainer prose` | — | P0 |
| M4 | **Stats** | 01 fila de cifras · 02 cifras dentro de banda de marca · 03 cifras junto a un párrafo | `{ title?, items: Stat[] }` con `Stat = { value, label, hint? }` | `GSection`, `GAdaptiveLayout`, `GMetric` | — | P0 |
| M5 | **Testimonials** | 01 tres tarjetas · 02 una cita grande con foto · 03 lista en acordeón de opiniones | `{ title, items: Testimonial[] }` con `{ quote, author: { name, role?, avatar? }, source?: { label, href }, rating? }` | `GSection`, `GCardGroup`, `GCard` con `figure/blockquote/cite`, `GAvatar` | M-L2 para `rating` | P0 (rating P2) |
| M6 | **Pricing** | 01 tres planes en tarjetas · 02 tabla comparativa (`GTable`) · 03 un plan destacado + lista | `{ title, description?, period?: PeriodToggle, plans: Plan[] }` con `{ name, price: Money, period, features: string[], action, highlighted? }` | `GSection`, `GCardGroup`, `GCard`, `GTable`, `GRadioGroup segmented` (periodo), `GBtn` | **M-L1** | P1 |
| M7 | **CTA** (banda de acción) | 01 banda en zona de marca · 02 tarjeta con imagen · 03 línea sobria con divisor | `{ title, description?, actions: Action[], media? }` | `GSection`, `GContainer`, `GSurface zone="brand"`, `GBtn` | una por página (R5) | P0 |
| M8 | **FAQ** | 01 acordeón · 02 dos columnas pregunta/respuesta · 03 acordeón con buscador | `{ title, items: Faq[] }` con `{ question, answer }` | `GSection`, `GAccordion`, `GInput` (buscar) | — | P0 |
| M9 | **Team** | 01 rejilla de tarjetas · 02 lista con descripción larga · 03 avatares compactos | `{ title, members: Member[] }` con `{ name, role, avatar?, bio?, links? }` | `GSection`, `GCardGroup`, `GCard`, `GAvatar` | — | P0 |
| M10 | **Logos** (clientes/alianzas) | 01 fila · 02 rejilla · 03 fila con cita | `{ title?, logos: Logo[] }` con `{ name, src, href? }` | `GSection`, `GAdaptiveLayout` | sin autoavance | P0 |
| M11 | **Newsletter** | 01 campo + botón en línea · 02 tarjeta · 03 banda de marca | `{ title, description?, field: { label, placeholder? }, action: Action, legal? }` | `GSection`, `GForm`, `GInputGroup`, `GBtn` | — | P0 |
| M12 | **Contact** | 01 formulario + datos · 02 datos + mapa · 03 solo canales (WhatsApp, tel) | `{ title, channels: Channel[], address?, hours?, form?: ContactForm, map?: Media }` | `GSection`, `GForm`, `GCard`, `address`, `GBtn` enlace externo, `GFab` | `GEmbed` para mapa vivo | P0 (mapa P2) |
| M13 | **Blog list** | 01 rejilla de tarjetas · 02 lista con fecha · 03 destacado + lista | `{ title, posts: Post[] }` con `{ title, excerpt, href, date, media?, tags? }` | `GSection`, `GCardGroup`, `GCard interaction="link"`, `GTag` | — | P0 |
| M14 | **Footer** | 01 columnas de enlaces · 02 una línea compacta · 03 con newsletter | `{ brand, groups: LinkGroup[], legal: NavLink[], social?: NavLink[], note? }` | `GAppShell` pie, `GStack`, `GDivider` | — | P0 |

### 4.2 Ecommerce (12 secciones)

| # | Sección | Variantes | Props compartida (resumen) | Compone | Dep. | Pri. |
| --- | --- | --- | --- | --- | --- | --- |
| E1 | **Product card** (pieza base de las listas) | 01 foto arriba · 02 horizontal · 03 compacta con acción rápida | `Product = { id, name, price: Money, compareAt?: Money, media, href, badge?, rating?, variants?, available }` | `GCard`, `GBadge`, `GBtn` | **M-L1**, M-L2 | P1 |
| E2 | **Product grid** | 01 rejilla · 02 rejilla con filtros laterales · 03 lista | `{ title, products: Product[], filters?: FilterDef[], sort?, page?, total? }` emite `filter`, `sort`, `page`, `add` | `GSection`, `GFilterBar`, `GCardGroup`, `GPagination`, `GEmpty`/`GLoadRegion` | E1 | P1 |
| E3 | **Category previews** | 01 tres tarjetas con foto · 02 tira · 03 lista con conteo | `{ title, categories: Category[] }` con `{ name, href, media, count? }` | `GSection`, `GCardGroup`, `GCard media` | — | P0 |
| E4 | **Product overview** (ficha) | 01 galería + panel · 02 galería arriba, panel abajo · 03 tira + pestañas | `{ product: ProductDetail, gallery: Photo[], options: Option[], quantity? }` emite `add`, `select` | `GGallery`, `GRadioGroup chip` (talla/color), `GNumberField`, `GBtn`, `GTabs`, `GAccordion` (detalles), `dl` | **M-L1** | P1 |
| E5 | **Quick view** | 01 diálogo · 02 hoja (`GDialog` móvil) | misma `Props` que E4 + `open` (`v-model`) | `GDialog`, E4 interno | E4 | P1 |
| E6 | **Reviews** | 01 lista con resumen · 02 resumen + distribución · 03 tarjetas | `{ summary: { average, count, distribution? }, reviews: Review[], action?: Action }` | `GSection`, `GProgress` (distribución), `GCard`, `GAvatar`, `GPagination` | M-L2 (`star`) | P2 |
| E7 | **Cart** | 01 lista + resumen lateral · 02 lista con resumen al pie (muelle) · 03 compacta (cajón) | `{ lines: CartLine[], totals: Totals, actions: { checkout: Action, continue?: Action } }` emite `change`, `remove` | `GSection`, `GTable` o lista, `GNumberField`, `GSummary`, `GBtn`, `GEmpty` | **M-L1**; utilidad `cartTotals` | P1 |
| E8 | **Checkout** | 01 pasos (`GStepper`) · 02 una página larga con secciones · 03 dos columnas con resumen pegado | `{ steps: CheckoutStep[], order: OrderSummary, labels }` emite `submit` por paso | `GStepper`, `GForm`, `GFormSection`, `GFormLayout`/`GFormRow`, `GRadioGroup card` (envío/pago), `GSummary` | **M-L1**; sin pago (la app) | P1 |
| E9 | **Order summary** | 01 tarjeta · 02 lista con `dl` · 03 línea compacta | `{ order: OrderSummary }` con líneas, totales, envío, pago | `GCard`, `dl`, `GDivider` | **M-L1** | P1 |
| E10 | **Order history / status** | 01 tabla · 02 tarjetas con `GStepper` de estado · 03 lista | `{ orders: Order[], page?, total? }` emite `open`, `page` | `GTable` (`rowHref`, `detail`), `GBadge`, `GStepper`, `GPagination` | — | P0 |
| E11 | **Promo** (oferta destacada) | 01 banda · 02 tarjeta con imagen de fondo · 03 dos ofertas lado a lado | `{ eyebrow?, title, description?, action, media?, until? }` | `GSection`, `GCard media="background"`, zona de marca, `GBtn` | sin cuenta atrás animada (2.2.2) | P0 |
| E12 | **Trust / incentives** | 01 fila de iconos con texto · 02 tarjetas · 03 lista compacta en pie | `{ items: Incentive[] }` con `{ icon, title, description? }` | `GAdaptiveLayout`, `GIcon` | — | P0 |

### 4.3 Booking (12 secciones)

> Las once secciones propias están contratadas en `design/contracts/blocks/` (#860 a #877; `_comun.md` §14 a §25) y B12 reutiliza `GbTestimonials` (#865). Donde difieren de esta tabla manda el contrato (correcciones en `_comun.md` §23: Search 03 «La que acompaña» con el umbral como receta, `consult` como slot en Offer detail, `GDatePicker` y no `GCalendar` en Availability, Booking summary sin columna pegada ni muelle propio, Guest form con `GStepper` en la página, Itinerary 03 en `GTable`, Policies 02 «todo a la vista»).

| # | Sección | Variantes | Props compartida (resumen) | Compone | Dep. | Pri. |
| --- | --- | --- | --- | --- | --- | --- |
| B1 | **Search** (consulta de disponibilidad) | 01 la frase (`phrase`) · 02 la barra (`bar`) · 03 en el umbral del héroe (`GHero threshold`) | `{ kind: 'stay'|'table'|'tour', title, partyRows, min?, max?, times?, tours?, labels }` emite `submit` (intención) | `GBookingBar`, `GHero` | — | P0 |
| B2 | **Offer list** (habitaciones / mesas / recorridos) | 01 tarjetas con foto · 02 lista horizontal con detalle · 03 rejilla compacta | `{ title, offers: Offer[], query? }` con `{ id, name, media: Photo[], capacity, price?: Money, perks: string[], href, available? }` emite `select`, `photos` | `GSection`, `GCardGroup`, `GCard`, `GGalleryViewer` («Ver fotos»), `GBadge` | **M-L1** (precio) | P1 (sin precio P0) |
| B3 | **Offer detail** (habitación / recorrido) | 01 galería por espacios + ficha · 02 tira + pestañas · 03 lectura larga con acordeón | `{ offer: OfferDetail, gallery: Photo[], consult?: BookingQuery }` emite `book` | `GGallery`, `GSection`, `dl`, `GTabs`/`GAccordion`, `GBookingBar dock` | **M-L1** | P1 |
| B4 | **Availability** | 01 calendario con precio por día · 02 lista de fechas próximas · 03 calendario + resumen | `{ month?, available: (iso) => boolean, prices?: (iso) => Money, selection }` | `GCalendar`/`GDatePicker` slot `day` | **M-L1** para precios | P1 |
| B5 | **Booking summary** (lo que vas a pedir) | 01 tarjeta lateral pegada · 02 muelle al pie · 03 línea en el encabezado | `{ query: BookingQuery, offer?: Offer, totals?: Totals, actions }` | `GSummary`, `GCard`, `GBookingBar dock`, `GBtn` | **M-L1** | P1 |
| B6 | **Guest form** (datos de quien reserva) | 01 una sección · 02 por pasos (`GDialogStep`/`GStepper`) · 03 con resumen pegado | `{ fields: GuestField[], party: PartyRows, policies: Policy[], labels }` emite `submit` | `GForm`, `GFormSection`, `GFormLayout`/`GFormRow`, `GPartyField`, `GCheckbox` (políticas), `GErrorSummary` | — | P0 |
| B7 | **Confirmation** | 01 tarjeta con resumen y acciones · 02 página con pasos siguientes · 03 compacta para WhatsApp | `{ reference, query, offer, contact: Channel[], actions: Action[] }` | `GCard`, `GSummary`, `GStepper` (siguientes pasos), `GBtn` | — | P0 |
| B8 | **Itinerary** (tour por horas) | 01 lista ordenada con hora · 02 por días en acordeón · 03 línea de tiempo en tabla | `{ title, days: ItineraryDay[] }` con `{ label, stops: { time?, title, description?, media? }[] }` | `GSection`, `ol`, `GAccordion`, `GTable` | no `GStepper` (no es un proceso) | P0 |
| B9 | **Menu / carta** (restaurante) | 01 por secciones con `dl` · 02 pestañas por tiempo · 03 tarjetas con foto | `{ title, sections: MenuSection[] }` con `{ name, items: { name, description?, price: Money, tags?, media? }[] }` | `GSection`, `GTabs`, `dl`, `GTag` (sin gluten…), `GCard` | **M-L1** | P1 |
| B10 | **Location** | 01 tarjeta con mapa estático + `address` · 02 dos columnas con cómo llegar · 03 lista de puntos de encuentro | `{ title, address, hours?, map?: Media, directions?: Action, points?: Point[] }` | `GCard`, `address`, `GBtn` enlace externo | `GEmbed` para mapa vivo | P0 (mapa vivo P2) |
| B11 | **Policies** | 01 acordeón · 02 lista `dl` · 03 tarjetas por tema | `{ title, items: Policy[] }` con `{ title, body, icon? }` | `GAccordion`, `dl`, `GCard` | — | P0 |
| B12 | **Reviews** (opiniones del sitio) | reutiliza M5 con `source` obligatorio | misma `Props` que M5 | M5 | M-L2 | P0 (rating P2) |

### 4.4 Dashboards (12 secciones; añadida el 2026-10-23 a petición del usuario)

Familia para **paneles de la aplicación** (gestión, operación, dirección): la pantalla que se abre cada día. Es distinta de la familia Gestión de la página de Notion (`GResourceList` y afines: CRUD de una entidad) y la complementa: un dashboard compone métricas, gráficas, tablas cortas, actividad y accesos, no edita una entidad. Compone lo que Grana ya tiene para paneles: `GWidget`, `GWidgetGrid`, `GWidgetGallery`, `GWidgetConfig`, `GMetric`, `GProgress`, `GTable`, `GDataList`, `GFilterBar`, `GPageHeader`, `GStatusIsland`/`GStatus`, `GEmpty`/`GLoadRegion`, `GCard`, `GAvatar`, `GTag`, `GBadge`, `GMenu`, `GPrice` (importes). Grana **no tiene componente de gráficas**: la gráfica la aporta la aplicación en un slot (receta con un `<figure>` accesible, tabla de datos equivalente oculta o visible) hasta que exista una ronda propia (`GChart`, reservado).

| # | Sección | Variantes | Props compartida (resumen) | Compone | Dep. | Pri. |
| --- | --- | --- | --- | --- | --- | --- |
| D1 | **Dashboard header** (título, periodo, acciones) | 01 título + selector de periodo · 02 con resumen de estado · 03 compacto pegado | `{ title, period?: PeriodOption[], periodValue?, status?: Status, actions: Action[] }` emite `update:period` | `GPageHeader`, `GRadioGroup segmented`/`GSelect`, `GStatus`, `GBtn` | — | P0 |
| D2 | **KPI row** (cifras clave) | 01 fila de métricas · 02 tarjetas con tendencia y mini objetivo · 03 lista compacta | `{ items: Kpi[] }` con `Kpi = { label, value, unit?, delta?, trend?, target?, href?, source? }` | `GAdaptiveLayout`, `GMetric`, `GProgress`, `GPrice` | — | P0 |
| D3 | **Chart card** (gráfica) | 01 una gráfica con leyenda · 02 gráfica + cifra destacada · 03 gráfica + tabla equivalente | `{ title, description?, summary?: Kpi, data: Series[], legend?, table?: boolean }` slot `chart` obligatorio | `GWidget`/`GCard`, `GTable` (equivalente), `GText` | gráfica de la app (`GChart` reservado) | P1 |
| D4 | **Widget grid** (distribución del panel) | 01 rejilla fija por niveles s/m/l · 02 galería configurable por la persona · 03 columnas de prioridad | `{ widgets: WidgetDef[], layout?, editable? }` emite `update:layout` | `GWidgetGrid`, `GWidgetGallery`, `GWidgetConfig` | — | P0 |
| D5 | **Activity feed** (actividad reciente) | 01 lista con avatar y hora · 02 agrupada por día · 03 compacta | `{ title, items: Activity[], page?, total? }` emite `open`, `page` | `GDataList`, `GAvatar`, `time`, `GPagination` | — | P0 |
| D6 | **Table card** (tabla corta con «ver todo») | 01 tabla · 02 tarjetas en estrecho · 03 lista con estado | `{ title, columns, rows, rowHref?, action?: Action, page? }` emite `open`, `page` | `GWidget`, `GTable` (`rowHref`, `rowStatus`), `GBadge`, `GEmpty` | — | P0 |
| D7 | **Goals / progress** (objetivos) | 01 barras con meta · 02 anillos (CSS) · 03 lista con plazo | `{ title, goals: Goal[] }` con `{ label, value, target, unit?, due?, status? }` | `GProgress`, `GMetric`, `GText`, `time` | — | P0 |
| D8 | **Alerts panel** (pendientes y avisos) | 01 lista por severidad · 02 tarjetas con acción · 03 cinta compacta | `{ title, alerts: Alert[] }` emite `resolve`, `open` | `GStatus`, `GBadge`, `GCard`, `GBtn` | sin región viva propia (#792) | P0 |
| D9 | **Quick actions** (accesos) | 01 rejilla de botones con icono · 02 lista · 03 barra | `{ title?, actions: Action[] }` emite `navigate`/`activate` | `GAdaptiveLayout`, `GBtn`, `GIcon` | — | P0 |
| D10 | **Filters bar** (filtros del panel) | 01 barra · 02 chips · 03 editor en hoja (estrecho) | `{ filters: FilterDef[], value, presets? }` emite `update:value` | `GFilterBar`, `GTag facets` | — | P0 |
| D11 | **Recent items** (últimos elementos) | 01 tarjetas · 02 lista · 03 tira | `{ title, items: Item[], action? }` emite `open` | `GCard`, `GAvatar`, `GTag` | — | P0 |
| D12 | **Empty dashboard** (primer uso / sin datos) | 01 molde del panel · 02 pasos de arranque · 03 vacío con una acción | `{ title, description?, steps?: Step[], action?: Action }` | `GEmpty` (molde), `GLoadRegion`, `GStepper` | — | P0 |

**Qué lo hace distinto (propuesta para lima):** «el panel dice qué cambió desde la última vez»: cada bloque con datos recibe `since` (fecha de la visita anterior) y marca lo nuevo sin mover nada; y «ninguna cifra sin su origen» (regla heredada de Stats #820): cada KPI lleva `source`.

**Tipos compartidos entre familias** (un solo archivo `blocks/types.ts` generado desde `meta.json`): `Action = { label, href?, variant?, icon?, external? }`, `NavLink`, `Media = { src, srcset?, sizes?, width, height, alt }`, `Photo` (el de `gallery.md`), `Money = { amount, currency }` (lo define la ronda de moneda), `Party` (el de `GPartyField`), `BookingQuery` (el modelo de `GBookingBar`).

## 5. Orden de trabajo

| Lote | Qué | Por qué en este orden |
| --- | --- | --- |
| **0 · Decisiones** | Hechas: D1 `Gb…` (#764), D2 `packages/blocks/` (#765 enmendada por #814), D3 flujo reducido (#766), D4 moneda primero (#767) | — |
| **1 · Moneda y precio** (#154, M-L1) | `GPrice` o `formatPrice` + `Money` | Desbloquea Pricing, Product, Cart, Checkout, Offer, Menu, Availability |
| **2 · Marketing P0** (9 secciones, 3 variantes cada una; **contratado**, `design/contracts/blocks/`, #815 a #826) | M2 Hero, M3 Features, M7 CTA, M8 FAQ, M5 Testimonials, M4 Stats, M11 Newsletter, M13 Blog, M14 Footer | Todo compone componentes `candidate`; es el **primer sitio real** (hotel de Oaxaca) y prueba la regla «cero CSS» |
| **3 · Booking P0 + P1** | B1 Search, B2 Offer list, B6 Guest form, B7 Confirmation, B8 Itinerary, B10 Location, B11 Policies, luego B3, B5, B9, B4 | Con el lote 1 hecho, cierra las tres plantillas de Oaxaca (hotel, restaurante, tour) |
| **4 · Ecommerce** | E1 Product card, E2 Grid, E3 Categories, E4 Overview, E7 Cart, E9 Summary, E8 Checkout, E10 History, E11 Promo, E12 Trust, E5 Quick view | Depende de lote 1 y de la utilidad `cartTotals` |
| **4b · Dashboards** (añadido 2026-10-23) | D1 Header, D2 KPI row, D4 Widget grid, D5 Activity, D6 Table card, D7 Goals, D8 Alerts, D9 Quick actions, D10 Filters, D11 Recent, D12 Empty; D3 Chart card con la gráfica de la app en slot | Todo compone componentes `candidate`; `GChart` reservado |
| **5 · Lo que necesita componente nuevo** | Calificación (`star`, M-L2) → E6 Reviews y `rating`; `GEmbed` → mapa vivo en M12/B10; `lang`/`hreflang` → idiomas en M1; Header 02 transparente (H-L6) | Cada uno con su ronda de kiwi |
| **6 · CLI** | `grana add block <seccion>` en el CLI | La extracción a `@grana/blocks` (`packages/blocks/`, *peer* `@grana/vue`) ya no espera: los bloques nacen ahí (#780, #814) |

## 6. Flujo por bloque (más corto que el de un componente)

Un bloque no tiene forma propia ni CSS, así que **no aplica «conceptos antes que caja»** de kiwi: las variantes **son** los conceptos. Propuesta de flujo (D3):

1. **lima:** contrato de la sección (`design/contracts/blocks/<seccion>.md`): la `interface Props` única, eventos de intención, slots, qué variante usa qué, y la decisión de personalidad por sección en `DECISIONS.md` (regla de lima).
2. **bruno (Sonnet; Opus si compone tres o más componentes complejos):** las variantes `.vue` sin `<style>`, un `meta.json` por sección, pruebas (la misma batería de datos falsos pasa por todas las variantes; HTML semántico, un `h1`, foco, sin CSS), `Page.vue` de ejemplo en `playground/blocks/<seccion>.html`.
3. **coco (auditoría, sin CSS que escribir):** auditoría previa y posterior de `auditoria-visual.md` sobre el bloque real con dos temas del CLI (rústico y lujo) y rúbrica de movimiento donde haya; cualquier necesidad de CSS se devuelve como hallazgo a lima (prop o primitiva nueva), nunca como CSS del bloque.
4. **mora-docs:** `README.md` por sección con las variantes lado a lado y la `Props`.

Compuertas nuevas en `gates.sh` (#814, `design/contracts/blocks/_comun.md` §9): ningún `.css` bajo `packages/blocks/src/blocks/Gb*` (ningún bloque estructural trae CSS), y un spec que recorre todas las variantes de una sección con la misma `Props` y comprueba que ninguna emite aviso de prop desconocida.

## 7. Preguntas para el usuario

1. **D1 · Nombre:** `GbFeatures01` (recomendado) o `GBlockFeatures01`.
2. ~~**D2 · Ubicación:** `packages/vue/src/blocks/` como dice Notion o `packages/blocks/` desde ya.~~ **`packages/blocks/`** (`@grana/blocks`): decisión del usuario del 2026-10-22 («Vale #780»), #814 enmienda #765.
3. **D3 · Flujo reducido** de §6 (recomendado) o el flujo completo kiwi → lima → coco → bruno → coco → mora-docs por sección.
4. **D4 · Adelantar la ronda de moneda y precio** (#154) como lote 1 (recomendado: sí; sin ella, Pricing, Product, Cart, Checkout, Offer, Menu y Availability no se pueden cerrar).
5. **Alcance de la primera entrega:** recomendado el lote 2 (Marketing P0) completo, con el sitio del hotel como banco real.

## Cumplimientos / Correcciones / Pendientes

**Cumplimientos:** se leyó la página de Notion y su documento relacionado, el inventario de kiwi y los contratos de las primitivas; cada bloque de la lista compone componentes que existen y declara su dependencia cuando no; las cuatro reglas del prompt se tradujeron a lo que Grana tiene (sin inventar componentes de tipografía).

**Correcciones frente al prompt:** Grana no tiene componentes de tipografía ni `variant="primary"`: los títulos van por `GSection`/`GCard`/`GHero` y los botones por `GBtn` con `solid|soft|outline|link`; el carrusel y la cuenta atrás animada no entran (2.2.2); el mapa vivo solo con `GEmbed`.

**Pendientes:** las cinco decisiones de §7; la ronda de moneda; nada de esto está construido ni verificado.
