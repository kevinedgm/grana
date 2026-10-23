# Contrato · Offer detail (`GbOfferDetail01` · `02` · `03`)

**Dueño:** lima · **Estado:** contratado (DECISIONS.md #860 a #866 y #869, 2026-10-22) · **Plan:** B3 (§4.3) · **Entrada:** `@grana/blocks/booking` · **Común:** `_comun.md` §1 a §5 y §14 a §25 · **Compone:** `GSection`, `GStack`, `GAdaptiveLayout`, `GContainer`, `GGallery` (`@grana/vue/gallery`), `GCard`, `GPrice` + `GPriceScope`, `GTabs` + `GTabPanel`, `GAccordion` + `GAccordionItem`, `GText`, `GBtn`, `describeQuery` · **Parte de bruno:** B · **bruno y coco en Opus** (galería, pestañas, acordeón y precio a la vez)

## Promesa

La página de una habitación, una mesa o un recorrido: **sus fotos ordenadas por lo que se vende**, una ficha con lo que incluye y lo que cuesta, el texto largo, y **la consulta o el botón de reservar** junto al precio. Las tres formas con los mismos datos.

## Props

```ts
interface GbOfferDetailProps {
  offer: OfferDetail                     // name es el título de la sección
  query?: BookingQuery | null
  partyRows?: PartyRow[]
  context?: Omit<QueryContext, 'partyRows'>
  prices?: PriceRegion
  locale?: string
  labels: {
    photos: string                       // título de la galería («Fotos de la suite»)
    facts: string                        // título de la ficha («La suite»)
    perks?: string                       // nombre de la lista de lo que incluye («Incluye»)
    book?: string                        // «Reservar esta suite» (sin slot `consult`)
    unavailable?: string
    showPhotos?: string | ((group: string) => string)   // «Ver {group}» (enlace de un dato a su espacio)
    details?: string                     // nombre de la pestaña o del elemento del texto largo («Descripción»)
    tabs?: string                        // nombre del tablist (02)
    forQuery?: string; query?: QueryLabels
    gallery?: GranaLabels                // a GGallery, tal cual
    price?: PriceLabels & { legend?: string }
  }
}
```

## Piezas (comunes)

- **Galería:** `GGallery` con `photos`, `groups` (A · recorrido por espacios cuando las fotos traen `group`), `title` = `labels.photos`, `labels` = `labels.gallery`, `headingLevel` un nivel por debajo de la sección. El visor, el foco devuelto y el hilo son de `GGallery`.
- **Ficha** (`GCard level="outlined" as="section"`, `title` = `labels.facts` al nivel de dentro): sin `meta` (en `GCard` el `meta` es solo texto y sale después del cuerpo); cuerpo: `GText as="div" size="body-sm"` con **primero** los `facts` (`dl`, #863), luego la lista de `perks` (`ul`, nombre `labels.perks` por `aria-label`), la línea de la consulta (con `query`) y `GPrice size="lg"` con el `PriceSpec` (con `total`, la cuenta) dentro de un `GPriceScope` si hay `prices`; `actions`: el slot `consult` **o** `GBtn solid` `labels.book` → `book` (no disponible: sin botón y el motivo en texto).
- **Un dato que se enseña** (`OfferFact.group`): con `group` y ese espacio en `groups` (con su `id`), el valor del dato lleva al lado un `GBtn variant="link"` `labels.showPhotos(groupLabel)` con `href="#{group.id}"` (el ancla del espacio en `GGallery`, `gallery.md` «Reglas de props»): de «Baño: regadera de piedra» a las fotos del baño en un toque. En 02 (tira) el enlace abre el visor en la primera foto del espacio (`v-model:index` y `open` de `GGallery`).
- **Texto largo:** `description` en `GText as="div"` (párrafos) y `sections` (`OfferSection`: `title`, `body` en párrafos, `items` en `ul`).

## Variantes

| Variante | Concepto | Compone | Ignora |
| --- | --- | --- | --- |
| **01 · Espacios + ficha** | El recorrido por espacios a todo lo ancho y, debajo, la ficha junto al texto | `GSection` (`title` = `offer.name`, `description` = `summary`) › `GStack gap="lg"` › `GGallery` (A) + `GAdaptiveLayout gap="lg"` › [`div` `g-adapt-wide`: descripción + una `GSection` anidada por `sections`] + [`div` `g-adapt-standard` con la ficha dentro: la pista va en un `div`, no en el `section` de la ficha, #889] | — |
| **02 · Tira + pestañas** | La foto grande ya en la página en una tira y, debajo, la ficha y el texto en pestañas | `GSection` › `GStack gap="lg"` › `GGallery appearance="strip"` + ficha + `GTabs` (`label` = `labels.tabs`; una pestaña `labels.details` con la descripción y una por `sections`, `id` = `section.id`) con su contenido en el slot `panel-{id}` de `GTabs` (no `GTabPanel`, #889) | — |
| **03 · Lectura larga** | Una columna de lectura: la descripción, los apartados plegados, las fotos y al final la ficha | `GSection` › `GContainer width="reading" horizontal="start"` (#845) › `GStack gap="lg"` › descripción + `GAccordion` (un `GAccordionItem` por `sections`, `id`, `peek` = primer párrafo) + `GGallery` (cuadrícula, A si hay grupos) + ficha | — |

**Orden de lectura = orden del DOM** en las tres (1.3.2): en 01 y 02 las fotos van primero porque la promesa es «cómo es»; en 03 el texto va primero porque la promesa es la lectura.

## Eventos

| Evento | Carga | Cuándo |
| --- | --- | --- |
| `book` | `{ event, offer, query }` | «Reservar» de la ficha (sin slot `consult`, oferta disponible) |

Sin `navigate`: la ficha no tiene enlaces de navegación propios (`offer.href` es la página misma y se ignora; los enlaces a un espacio son anclas de la propia página).

## Slots

| Slot | Qué va |
| --- | --- |
| `consult` | La consulta junto al precio (p. ej. `GbSearch03` o un `GBookingBar`): **sustituye** al botón «Reservar» (una sola acción principal, como #762) |
| `facts` | Escape: ficha propia en lugar de `meta` |
| `section-{id}` | Escape: cuerpo rico de un apartado |

## Qué lo hace distinto (#869)

**La ficha enseña lo que dice.** Un dato de la ficha («Baño: regadera de piedra», «Vista: al jardín») lleva directo a **las fotos de ese espacio** —el ancla del recorrido de `GGallery`, la misma que se puede compartir—, así que la respuesta a «¿cómo es el baño?» está a un toque desde la frase que la promete. Con consulta, la ficha dice **lo que cuesta lo que pediste** y la reserva está junto al precio (la consulta en el slot o un solo botón), nunca dos botones sólidos que compiten. Lo que no está libre en tus fechas lo dice en palabras y la página se sigue pudiendo leer.

## Textos (`labels`)

| Clave | Requerido |
| --- | --- |
| `photos`, `facts` | Sí (C5) |
| `perks` | Sí, con `perks` |
| `book` | Sí, sin slot `consult` |
| `unavailable` | Sí, con `available: false` |
| `showPhotos` | Sí, con algún `OfferFact.group` válido (C5; sin él, no hay enlace) |
| `details`, `tabs` | Sí, en 02 |
| `forQuery`, `query` | Sí, con `query` (K2) |
| `gallery`, `price` | Los de cada componente |

## Avisos propios (`[Grana GbOfferDetail<NN>]`)

C4 a C7, K1 a K5. Además: **D1** · `OfferFact.group` que no está en `groups` o sin `id` (sin enlace), **D2** · `offer.photos` vacío (sin galería; la ficha sigue), **D3** · `section.id` repetido (02 y 03 lo necesitan únicos; se usa el índice).

## Banco (`offer-detail.bank.js`)

Suite Jardín: nueve fotos en cuatro espacios (Habitación, Baño con `id: 'fotos-bano'`, Terraza, Jardín), `facts` (capacidad, 38 m², cama king, baño con `group`), `perks`, `description` en dos párrafos, tres `sections` (Qué incluye con `items`, La cama, Llegada), `price` con `total` para la consulta común, `prices` MXN, la consulta común; slot `consult` con un `GbSearch01` del banco de Search (solo en el playground y en un caso de Vitest; el banco base va sin slot y con «Reservar»).

## Verificación propia

Vitest: la galería con `groups` y el nivel de encabezado de dentro; el enlace de un dato lleva a `#fotos-bano` (01, 03) y abre el visor en la primera foto del espacio (02); con `consult` no hay botón «Reservar» y sin él hay uno `solid`; `book` con su carga; 02 con una pestaña por apartado más la descripción; 03 con un `GAccordionItem` por apartado y el texto antes que las fotos; no disponible sin botón y con motivo. Chromium: 01 con la ficha al lado del texto a 1440 y debajo a 390; la tira de 02 a 320 sin desbordar; el ancla del espacio desplaza a su grupo; un solo `h2` de sección.

## Enmiendas del remate de Booking B (#889, #891)

- **Ficha:** los `facts` van en un `dl` de `GText` **al principio del cuerpo** de la ficha (el orden de lectura es dato, apoyos, consulta, precio, acción); `meta` de `GCard` no se usa.
- **Pista de ancho:** `GAdaptiveLayout` trata un `section` o un hijo con varios controles como línea entera (#361): la ficha va en un `div` con `g-adapt-standard`. Con la consulta en el slot `consult`, la ficha pasa **debajo** del texto y sin pista.
- **Pestañas (02):** el contenido va en los slots `panel-{id}` de `GTabs`.
- **`Offer.lang`** (#891): marca la raíz de la sección y vale también para sus `labels`.
