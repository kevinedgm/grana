# GbOfferDetail · GbOfferDetail01, GbOfferDetail02 y GbOfferDetail03

La página de una habitación, una mesa o un recorrido: **sus fotos ordenadas por lo que se vende**, una ficha con lo que incluye y lo que cuesta, el texto largo, y **la consulta o el botón de reservar junto al precio**. Las tres formas reciben los mismos datos. El bloque emite `book` y tu aplicación decide el siguiente paso; no calcula precios ni disponibilidad. Compone `GSection`, `GStack`, `GAdaptiveLayout`, `GContainer`, `GGallery` (`@grana/vue/gallery`), `GCard`, `GPrice` y `GPriceScope` (`@grana/vue/price`), `GTabs`, `GAccordion` y `GAccordionItem`, `GText` y `GBtn`; no trae color, CSS ni textos propios.

**Etiquetas:** `<gb-offer-detail-01>`, `<gb-offer-detail-02>`, `<gb-offer-detail-03>` · **Estado:** `candidate` (ver «Verificación») · **Desde:** `0.0.0` (paquete privado, aún sin publicar) · **Entrada:** `@grana/blocks/booking`

```js
import { GbOfferDetail01, GbOfferDetail02, GbOfferDetail03 } from '@grana/blocks/booking'
```

> `@grana/blocks` es privado (`0.0.0`) y no se publica con la beta `0.1.0` de `@grana/vue`. Por ahora se usa desde el repositorio (banco real en `packages/blocks/playground/booking/offer-detail.html`). Exige `@grana/vue` (peer, `>=0.1.0-beta.0 <1.0.0`) y Vue `^3.5.0`. Además de `@grana/vue`, la aplicación carga las entradas que esta sección compone: `@grana/vue/booking`, `@grana/vue/gallery`, `@grana/vue/price`. Reglas comunes e instalación: [`packages/blocks/README.md`](../../../README.md).

## Qué lo hace distinto

**La ficha enseña lo que dice** (DECISIONS #869). Un dato de la ficha («Baño: regadera de piedra») lleva directo a **las fotos de ese espacio** —el ancla del recorrido de `GGallery`, la misma que se puede compartir—, así que la respuesta a «¿cómo es el baño?» está a un toque de la frase que la promete. Con consulta, la ficha dice **lo que cuesta lo que pediste** y la reserva está junto al precio (la consulta en el slot o un solo botón), nunca dos botones sólidos que compiten. Lo que no está libre en tus fechas lo dice en palabras y la página se sigue pudiendo leer.

## Las tres variantes

Las tres reciben la misma `interface Props` (`GbOfferDetailProps`, el mismo objeto `props` de `props.js`). Lo que una variante no usa, lo ignora en silencio.

| Variante | Concepto | Compone | Ignora |
| --- | --- | --- | --- |
| `GbOfferDetail01` | Espacios + ficha: el recorrido por espacios a todo lo ancho y, debajo, la ficha junto al texto | `GSection` (`title` = `offer.name`, `description` = `offer.summary`) > `GStack gap="lg"` > `GGallery` (recorrido por espacios) + `GAdaptiveLayout gap="lg"` > [`div g-adapt-wide`: descripción y una `GSection` anidada por apartado] + [`div g-adapt-standard` con la ficha dentro] | — |
| `GbOfferDetail02` | Tira + pestañas: la foto grande ya en la página, en una tira, y debajo la ficha y el texto en pestañas | `GSection` > `GStack gap="lg"` > `GGallery appearance="strip"` + la ficha + `GTabs` (`label` = `labels.tabs`; una pestaña `labels.details` con la descripción y una por apartado, `id` = `section.id`, el contenido en los slots `panel-{id}`) | — |
| `GbOfferDetail03` | Lectura larga: una columna de lectura con la descripción, los apartados plegados, las fotos y, al final, la ficha | `GSection` > `GContainer width="reading" horizontal="start"` > `GStack gap="lg"` > descripción + `GAccordion` (un `GAccordionItem` por apartado, `peek` = primer párrafo) + `GGallery` (cuadrícula) + la ficha | — |

**Orden de lectura = orden del DOM** (1.3.2): en 01 y 02 las fotos van primero porque la promesa es «cómo es»; en 03 el texto va primero porque la promesa es la lectura.

**La ficha** (`GCard level="outlined" as="section"`, `title` = `labels.facts`): en el cuerpo, **primero** los `facts` (un `dl` en `GText`), luego la lista de `perks` (con `labels.perks` como nombre), la línea de la consulta (con `query`) y el `GPrice size="lg"` con el `PriceSpec` (con `total`, la cuenta) dentro de un `GPriceScope` si hay `prices`. Las acciones: el slot `consult` **o** un `GBtn solid` con `labels.book` que emite `book` (no disponible: sin botón y con el motivo en texto).

**Un dato que enseña** (`OfferFact.group`): con `group` y ese espacio en `groups` (con su `id`), el valor lleva al lado un `GBtn variant="link"` con `labels.showPhotos(groupLabel)` y `href="#{group.id}"`. En 01 y 03 salta al espacio de la galería; en 02 (tira) abre el visor en la primera foto del espacio. Si el `group` no existe o el espacio no tiene `id`, no hay enlace (aviso D1).

**Con el slot `consult`** (por ejemplo `GbSearch03` o un `GBookingBar`), la consulta sustituye al botón «Reservar» y la ficha pasa **debajo** del texto, sin pista de ancho. La consulta tiene sus props propias (`partyRows`, límites, `labels.bar`): duplicarlas en la ficha engordaría la `interface` y crearía dos fuentes de la misma consulta (#866).

**`Offer.lang`** (#885, #891): si el nombre y el texto no están en el idioma de la página, `lang` marca la raíz de la sección y vale también para sus `labels`.

## Recetas

### La consulta junto al precio

El slot `consult` recibe `{ offer }` y sustituye al botón «Reservar». Una sola acción principal por ficha:

```vue
<!-- Fragmento: `suite`, `consulta`, `partyRows`, `barLabels` y `reservar` son de tu aplicación -->
<GbOfferDetail01 v-bind="suite" :query="consulta" :party-rows="partyRows" @book="reservar">
  <template #consult>
    <GbSearch01 kind="stay" title="Consulta disponibilidad" v-model:query="consulta" :party-rows="partyRows" :labels="{ bar: barLabels }" />
  </template>
</GbOfferDetail01>
```

Sin el slot, «Reservar» emite `book` con la oferta y la consulta. Es la misma `BookingQuery` de [`GbSearch`](../GbSearch/README.md#la-consulta-que-viaja).

### Opiniones con `GbTestimonials`

Las opiniones de una oferta no tienen sección propia en Booking: se usa `GbTestimonials` de `@grana/blocks/marketing` tal cual (DECISIONS #865, B12). Esa entrada **no** se reexporta desde Booking: quien usa las dos importa las dos. Para que una opinión nunca llegue sin fuente, `Testimonial.source` es **obligatoria** en el tipo (sin TypeScript, una opinión sin `source` avisa T1). La calificación con estrellas no existe (queda reservada, M-L2).

```vue
<!-- Fragmento: `suite` y `reservar` son de tu aplicación -->
<script setup>
import { GbOfferDetail01 } from '@grana/blocks/booking'
import { GbTestimonials01 } from '@grana/blocks/marketing'

const opiniones = {
  title: 'Lo que dicen quienes ya vinieron',
  items: [
    {
      id: 'lucia',
      quote: 'Despertar con el patio lleno de luz y el chocolate de metate ya servido.',
      author: { name: 'Lucía Hernández', role: 'Viajó en pareja' },
      source: { label: 'Google, septiembre de 2026', href: 'https://maps.google.com/?q=Casa+Alcala+Oaxaca', external: true }
    },
    { quote: 'Volveríamos mañana.', author: { name: 'Rosa' }, source: { label: 'Libro de visitas de la casa' } }
  ],
  labels: { external: 'se abre en otra pestaña' }
}
</script>

<template>
  <GbOfferDetail01 v-bind="suite" @book="reservar" />
  <GbTestimonials01 v-bind="opiniones" />
</template>
```

Cada opinión lleva su texto entero, su autor y dónde se publicó. Mira [`GbTestimonials/README.md`](../GbTestimonials/README.md).

### Columna pegada

La ficha (y el resumen de [`GbBookingSummary`](../GbBookingSummary/README.md#columna-pegada-con-css-de-tu-aplicación)) piden una columna que se queda a la vista mientras se lee, en escritorio. Un bloque no puede pegarse: no hay primitiva de columna pegada (BK-L1). La receta está en el README de Booking summary.

## Uso

Los datos comunes (`consulta`, `partyRows`, `queryLabels`, `precios`, `priceLabels`) están en [«Datos comunes de una reserva»](../../../README.md#datos-comunes-de-una-reserva).

```vue
<!-- Fragmento: `fotosSuite`, `textosVisor` e `irAlFormulario` son de tu aplicación -->
<script setup>
import { GbOfferDetail01 } from '@grana/blocks/booking'
import { consulta, partyRows, queryLabels, precios, priceLabels } from './reserva.js'

const mxn = (amount) => ({ amount, currency: 'MXN' })

const suite = {
  offer: {
    id: 'suite-jardin',
    name: 'Suite Jardín',
    kind: 'Suite',
    summary: 'La más amplia de la casa, con jardín privado y terraza a la cúpula.',
    photos: fotosSuite, // [{ id, src, thumb, width, height, alt, group }]
    groups: [
      { value: 'habitacion', label: 'La habitación', id: 'fotos-habitacion' },
      { value: 'bano', label: 'El baño', id: 'fotos-bano' }
    ],
    facts: [
      { label: 'Personas', value: 'Hasta 3' },
      { label: 'Tamaño', value: '38 m²' },
      { label: 'Baño', value: 'Regadera de piedra', group: 'bano' }
    ],
    perks: ['Desayuno incluido', 'Cancelación gratis hasta 48 h antes'],
    price: { value: mxn(1850), lead: 'desde', unit: '/ noche', unitLabel: 'por noche', total: { value: mxn(4100), label: 'por 2 noches' } },
    description: 'La Suite Jardín ocupa la antigua sala de la casa.\n\nDesde la terraza se ve la cúpula de Santo Domingo.',
    sections: [
      { id: 'incluye', title: 'Qué incluye', items: ['Desayuno oaxaqueño en el jardín', 'Wifi en toda la casa'] },
      { id: 'cama', title: 'La cama', body: 'Colchón firme de 2 × 2 m con sábanas de lino lavado.' }
    ]
  },
  query: consulta,
  partyRows,
  prices: precios,
  locale: 'es',
  labels: {
    photos: 'Fotos de la suite',
    facts: 'La suite',
    perks: 'Incluye',
    book: 'Reservar esta suite',
    unavailable: 'No disponible en tus fechas',
    showPhotos: (grupo) => `Ver ${grupo.toLowerCase()}`,
    details: 'Descripción',
    tabs: 'Sobre la suite',
    forQuery: 'Para {query}',
    query: queryLabels,
    gallery: textosVisor, // los de GGallery, tal cual
    price: priceLabels
  }
}

function reservar({ offer, query }) {
  irAlFormulario(offer.id, query) // tu aplicación sigue
}
</script>

<template>
  <GbOfferDetail01 v-bind="suite" @book="reservar" />
</template>
```

La aplicación carga además `@grana/vue/gallery`, `@grana/vue/price` y `@grana/vue/booking` (para decir la consulta).

## Ejemplos

### e1 · La habitación con sus espacios y su ficha (`GbOfferDetail01`)

**Por qué:** cuando las fotos vienen agrupadas por espacio (habitación, baño, terraza). La galería recorre los espacios y la ficha, al lado del texto, enlaza cada dato a sus fotos.

```vue
<!-- Fragmento: `reservar`, `suite` son de tu aplicación -->
<GbOfferDetail01 v-bind="suite" @book="reservar" />
```

### e2 · Una tira de fotos y la información en pestañas (`GbOfferDetail02`)

**Por qué:** cuando quieres la foto grande ya en la página y la descripción, lo que incluye y las condiciones separadas en pestañas. Cada apartado necesita un `id` único (D3).

```vue
<!-- Fragmento: `reservar`, `suite` son de tu aplicación -->
<GbOfferDetail02 v-bind="suite" @book="reservar" />
```

### e3 · Una columna de lectura (`GbOfferDetail03`)

**Por qué:** cuando la oferta se explica con texto largo (un recorrido, una mesa de degustación). El texto va primero, los apartados se pliegan y la ficha cierra la columna.

```vue
<!-- Fragmento: `reservar`, `suite` son de tu aplicación -->
<GbOfferDetail03 v-bind="suite" @book="reservar" />
```

### e4 · Una oferta que no está libre en tus fechas

**Por qué:** cuando la persona llegó con una consulta y la oferta ya no tiene sitio. La ficha lo dice en palabras, sin botón de reservar, y la página sigue pudiéndose leer.

```vue
<GbOfferDetail01 v-bind="{ ...suite, offer: { ...suite.offer, available: 'No quedan para el 14 de noviembre' } }" />
```

## Props

Una sola interfaz para las tres variantes (`GbOfferDetailProps`). Los tipos de datos salen de `@grana/blocks/booking`.

| Prop | Tipo | Descripción |
| --- | --- | --- |
| `offer` | `OfferDetail` (requerida) | name es el título de la sección; photos y groups a GGallery; facts (≤ 6, C7) con group para enlazar el espacio (D1); price tal cual a GPrice (la cuenta solo con query); available false o motivo (K4); sections con id único (D3); lang a la raíz de la sección y vale también para sus labels (#885, #891); href se ignora (es la página misma) |
| `query` | `BookingQuery \| null` | Dicha con describeQuery (#862) en la ficha: «Para {query}» y la salida en palabras |
| `partyRows` | `PartyRow[]` | Necesarias para decir la consulta (K2) |
| `context` | `QueryContextExtra` | `times` y `tours` para decir una consulta `table` o `tour`. |
| `prices` | `PriceRegion` | Una GPriceScope alrededor del precio de la ficha (K3 sin ella) |
| `locale` | `string` | BCP 47; sin él, el `lang` del ancestro al montar. |
| `labels` | `OfferDetailLabels` (requerida) | photos y facts (C5); perks (con perks), book (sin slot consult), unavailable (con available false), showPhotos (con un dato con espacio), details y tabs (02), forQuery y query (con query, K2), gallery (a GGallery tal cual), price (a GPriceScope); sin valores por defecto |

## Eventos

| Evento | Carga | Cuándo |
| --- | --- | --- |
| `book` | `{ event, offer, query }` (`OfferBook`) | «Reservar» de la ficha (sin slot consult y con la oferta disponible) |

No hay `navigate`: la ficha no tiene enlaces de navegación propios (`offer.href` es la página misma y se ignora; los enlaces a un espacio son anclas de la propia página). Con el slot `consult`, no hay botón «Reservar» y por eso no hay `book`.

## Slots

| Slot | Alcance | Qué va |
| --- | --- | --- |
| `consult` | `{ offer: OfferDetail }` | La consulta junto al precio (GbSearch03 o un GBookingBar): sustituye al botón «Reservar» (una sola acción principal) |
| `facts` | `{ offer: OfferDetail }` | Escape: lo que va al principio del cuerpo de la ficha en lugar del dl de facts (#889) |
| `section-{id}` | `{ section: OfferSection }` | Escape: cuerpo rico de un apartado (por su id) |

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
| `gallery`, `price` | Los de cada componente (avisan ellos) |

## Teclado y foco

| Tecla | Efecto |
| --- | --- |
| `Tab` | Recorre la galería, la ficha (el enlace de cada dato con espacio y la acción) y el contenido de las pestañas o del acordeón |
| Flechas izquierda y derecha en las pestañas de 02 | Pasan a la pestaña anterior o siguiente (el teclado de `GTabs`) |
| `Intro` o `Espacio` en un apartado de 03 | Abre o cierra el apartado (el teclado de `GAccordion`) |

El visor de fotos es el de `GGallery` ([`GGallery/README.md`](../../../../vue/src/components/GGallery/README.md)).

## Accesibilidad

Cifras de la auditoría de coco ([`design/lab/blocks/booking/auditoria.md`](../../../../../design/lab/blocks/booking/auditoria.md)), tres motores, tres temas, claro y oscuro (`medido`):

a. La galería lleva su `groups` y el nivel de encabezado de dentro; un solo `h2` de sección (`prueba`, Vitest).
b. El enlace de un dato lleva a `#fotos-bano` (01 y 03) y abre el visor en la primera foto del espacio (02) (`prueba`).
c. La consulta en la ficha se dice con las mismas palabras que el resumen de `GBookingBar`.
d. Las pestañas de 02 cambian (BK-B5, cerrado: antes la pestaña seleccionada no cambiaba).
e. 03: plegado de 240 ms; con movimiento reducido no hay desplazamiento.
f. No disponible: sin botón y con el motivo en texto.
g. Sin desplazamiento horizontal a 1440, 390, 320 ni a 320 con el texto al 200 %; la tira de 02 a 320 no desborda.

> **Peligro.** Cada apartado de `sections` necesita un `id` **único** (D3): 02 lo usa como `id` de la pestaña y de su slot `panel-{id}`, y 03 como `id` del elemento del acordeón. Con un `id` repetido, el bloque usa el índice y avisa; los slots `section-{id}` que escribas con tu `id` dejan de coincidir.

## Avisos de desarrollo

Prefijo `[Grana GbOfferDetail<NN>]`, una vez por instancia y motivo, solo en desarrollo. Los comunes (C4 a C7, K1 a K5) están en [`packages/blocks/README.md`](../../../README.md#avisos-comunes-de-booking); las fotos las avisa `GGallery`. Los propios:

| Código | Motivo | Qué pasa |
| --- | --- | --- |
| D1 | `OfferFact.group` que no está en `groups` o sin `id` | Sin enlace a las fotos de ese espacio |
| D2 | `offer.photos` vacío | Sin galería; la ficha sigue |
| D3 | `section.id` repetido | Se usa el índice |

## Banco de datos de ejemplo

`offer-detail.bank.js` exporta `{ PHOTOS, props, slots }`: la Suite Jardín con nueve fotos en cuatro espacios (La habitación, El baño con `id: 'fotos-bano'`, La terraza, El jardín), `facts` (personas, 38 m², cama king y el baño con su `group`), `perks`, `description` en dos párrafos, tres `sections` (Qué incluye con `items`, La cama, Llegada), `price` con `total` para la consulta común, `prices` MXN y `labels` completos. El banco base va sin slot `consult` y con «Reservar»; el caso con `GbSearch01` en el slot va en Vitest y en el playground (`?consult=1`). Banco real: `packages/blocks/playground/booking/offer-detail.html`.

## Peso

`dist/booking.js` pesa **36 851 B gzip** con su trozo compartido de `common/` (las 11 secciones y 33 variantes; `medido` con `node packages/blocks/scripts/measure-entry.mjs booking`  2026-10-23); tope de la entrada **37 888 B** (DECISIONS #907; el tope inicial de 36 KiB no se vuelve a subir). Una variante importada sola (esbuild minificado  `vue` y `@grana/vue*` externos; `node packages/blocks/scripts/measure-partial.mjs 5120 booking GbGuestForm=7168`): `GbOfferDetail01` 4 049 B  `GbOfferDetail02` 4 273 B  `GbOfferDetail03` 4 038 B; tope por variante **5 120 B** (#887). `@grana/vue` y sus entradas son *peer*: las paga la aplicación.

## Alcance

- **No reserva:** `book` entrega la oferta y la consulta; la reserva es de tu aplicación.
- **No calcula el total:** `price.total` lo da tu aplicación para esa consulta (#769).
- **Sin calificación** (M-L2) ni mapa vivo (BK-L5).
- **Columna pegada (BK-L1):** sin CSS, la ficha no se pega; receta en el README de [`GbBookingSummary`](../GbBookingSummary/README.md#columna-pegada-con-css-de-tu-aplicación).
- **Pista de ancho (#889):** `GAdaptiveLayout` trata un `section` o un hijo con varios controles como línea entera, por eso la ficha va en un `div` con `g-adapt-standard`.
- **Sin CSS ni utilidades** (#763, #807).

## Verificación

| Qué | Resultado | Nivel |
| --- | --- | --- |
| Vitest de `GbOfferDetail` (la galería con `groups`; el enlace de un dato lleva a `#fotos-bano` en 01 y 03 y abre el visor en 02; con `consult` no hay botón y sin él un `solid`; `book` con su carga; 02 con una pestaña por apartado; 03 con un `GAccordionItem` por apartado y el texto antes que las fotos; no disponible sin botón) | 44/44 (`npm test -w @grana/blocks`, 2026-10-23) | `prueba` |
| Auditoría de coco: Offer detail 01, 02 y 03; BK-B5 (las pestañas de 02 cambian) cerrado en verde en los tres motores | Veredicto `candidate` tras el remate de bruno (addendum del 2026-10-23) | `medido` |

**No verificado:** lector de pantalla real (la galería por espacios, el visor, el nombre de las pestañas); `forced-colors` real; teléfono real y puntero grueso; rendimiento con el perfilador (galería de muchas fotos). **Pendientes abiertos:** BK-L1 (columna pegada); los generales, en [`PENDIENTES.md`](../../../../../PENDIENTES.md).

## Fuentes

- Contrato: [`design/contracts/blocks/offer-detail.md`](../../../../../design/contracts/blocks/offer-detail.md) y [`_comun.md`](../../../../../design/contracts/blocks/_comun.md) (§15 a §25); [`gallery.md`](../../../../../design/contracts/gallery.md) para la galería.
- Decisiones: #860 a #866, #869, #885, #889, #891, #907 en `DECISIONS.md`.
- Metadatos: [`GbOfferDetail.meta.json`](./GbOfferDetail.meta.json). Pruebas: [`GbOfferDetail.test.js`](./GbOfferDetail.test.js). Auditoría: [`design/lab/blocks/booking/auditoria.md`](../../../../../design/lab/blocks/booking/auditoria.md).
