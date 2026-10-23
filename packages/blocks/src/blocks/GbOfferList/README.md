# GbOfferList · GbOfferList01, GbOfferList02 y GbOfferList03

Las habitaciones, mesas o recorridos que se pueden pedir, **con su foto, lo que incluyen, su precio y, si ya hay consulta, lo que cuestan para esa consulta**. Cada una se elige o se abre; lo no disponible se queda a la vista con su motivo; las fotos se ven en un visor sin salir de la lista. El bloque emite `select` y tu aplicación decide qué hacer (ir al formulario, a su motor, a WhatsApp); no calcula precios. Compone `GSection`, `GAdaptiveLayout`, `GStack`, `GCard`, `GPrice` y `GPriceScope` (`@grana/vue/price`), `GGalleryViewer` (`@grana/vue/gallery`), `GBtn` y `GText`; no trae color, CSS ni textos propios.

**Etiquetas:** `<gb-offer-list-01>`, `<gb-offer-list-02>`, `<gb-offer-list-03>` · **Estado:** `candidate` (ver «Verificación») · **Desde:** `0.0.0` (paquete privado, aún sin publicar) · **Entrada:** `@grana/blocks/booking`

```js
import { GbOfferList01, GbOfferList02, GbOfferList03 } from '@grana/blocks/booking'
```

> `@grana/blocks` es privado (`0.0.0`) y no se publica con la beta `0.1.0` de `@grana/vue`. Por ahora se usa desde el repositorio (banco real en `packages/blocks/playground/booking/offer-list.html`). Exige `@grana/vue` (peer, `>=0.1.0-beta.0 <1.0.0`) y Vue `^3.5.0`. Además de `@grana/vue`, la aplicación carga las entradas que esta sección compone: `@grana/vue/booking`, `@grana/vue/price`, `@grana/vue/gallery`. Reglas comunes e instalación: [`packages/blocks/README.md`](../../../README.md).

## Qué lo hace distinto

**Cada oferta responde a tu consulta** (DECISIONS #868). Con la consulta, la lista dice una vez **para qué** responde («Para 13–15 nov · 2 noches · 2 adultos · 1 niño · Salida el domingo, 15 de noviembre») y cada tarjeta enseña **lo que cuesta lo que pediste**: el total que da el lugar (Grana no multiplica tarifas, #769) con la tarifa por noche como contexto. Lo que no está libre en tus fechas **se queda en la lista** con el motivo en palabras, en lugar de desaparecer y hacerte dudar de si existe. Las fotos se abren en un visor sin perder la lista: al cerrar, el foco vuelve al botón de esa oferta.

**Una sola acción principal por tarjeta:** la tarjeta es el enlace o el botón, y «Elegir» va como acción secundaria. Nunca un `GBtn solid` por tarjeta (seis ofertas no compiten con seis botones principales).

## Las tres variantes

Las tres reciben la misma `interface Props` (`GbOfferListProps`, el mismo objeto `props` de `props.js`). Lo que una variante no usa, lo ignora en silencio.

| Variante | Concepto | Compone | Ignora |
| --- | --- | --- | --- |
| `GbOfferList01` | Tarjetas: una rejilla de tarjetas iguales con la foto arriba | `GSection` > [línea de la consulta] + `GPriceScope` > `GAdaptiveLayout role="list"` > `div role="listitem" class="g-adapt-standard"` > `GCard as="div" mediaPosition="top"` | — |
| `GbOfferList02` | Renglones: una oferta por renglón, foto al lado y todo el detalle a la vista | `GSection` > [línea] + `GPriceScope` > `GStack as="ul" gap="md"` > `GCard as="li" orientation="auto" mediaPosition="start"` (con `facts` y `perks` completos) | — |
| `GbOfferList03` | Rejilla compacta: muchas ofertas en poco sitio, sin foto | `GSection` > [línea] + `GPriceScope` > `GAdaptiveLayout role="list"` > `div role="listitem" class="g-adapt-short"` > `GCard as="div" density="compact"` sin `media` | La portada (`media`), `perks` y los `facts` más allá de dos. «Ver fotos» se queda |

**La tarjeta (común):** `GCard` con `eyebrow` = `offer.kind`, `title` = `offer.name` (un nivel por debajo de la sección), `description` = `offer.summary`, `badge` = `offer.badge`, `facts` en el `dl` de la tarjeta, la lista de `perks` y el `GPrice` del `PriceSpec` tal cual. Con `href`, la tarjeta es el enlace a la página de la oferta (`navigate`) y «Elegir» va como botón secundario; sin `href`, la tarjeta entera es el botón «elegir esta» y no se pinta «Elegir». **Con `query` y `price.total`** (que calcula tu aplicación para esa consulta), la tarjeta muestra la cuenta: el total arriba y la tarifa como contexto.

**No disponible:** sin «Elegir», sin interacción de elegir (con `href` sigue siendo enlace: se puede leer la oferta), el motivo en texto en el cuerpo y el precio a la vista. `available: false` dice `labels.unavailable`; un texto dice ese motivo.

**«Ver fotos»** abre **un solo** `GGalleryViewer` de la sección con las `photos` de esa oferta (`title` = `offer.name`, el foco vuelve al botón); con una sola foto no hay botón, la portada basta.

## Recetas

### La consulta que viaja

La lista recibe **la misma `BookingQuery`** que emitió [`GbSearch`](../GbSearch/README.md#la-consulta-que-viaja) y la dice con las mismas palabras (`describeQuery`). Para decirla necesita `partyRows` y `labels.query` (sin ellos avisa K2 y no pinta la línea). Cuando la persona elige, `select` te devuelve la oferta entera y la consulta, para armar tu enlace al motor o a WhatsApp sin volver a buscarla.

### Montaje en columnas

`GbOfferList01` reparte las tarjetas con `GAdaptiveLayout`: la última tarjeta sola ocupa la fila entera (límite BK-L7, abajo). Si quieres un tope, monta el bloque en una columna de lectura:

```vue
<!-- Fragmento: `habitaciones`, `consulta`, `partyRows` y `elegir` son de tu aplicación -->
<GContainer width="reading">
  <GbOfferList01 v-bind="habitaciones" :query="consulta" :party-rows="partyRows" @select="elegir" />
</GContainer>
```

## Uso

Los datos comunes (`consulta`, `partyRows`, `queryLabels`, `precios`, `priceLabels`) están en [«Datos comunes de una reserva»](../../../README.md#datos-comunes-de-una-reserva).

```vue
<!-- Fragmento: `fotosSuite`, `fotosSencilla`, `textosVisor` e `irAlFormulario` son de tu aplicación -->
<script setup>
import { GbOfferList01 } from '@grana/blocks/booking'
import { consulta, partyRows, queryLabels, precios, priceLabels } from './reserva.js'

const mxn = (amount) => ({ amount, currency: 'MXN' })

const habitaciones = {
  title: 'Habitaciones',
  description: 'Cinco habitaciones alrededor de un patio de cantera, a dos calles de Santo Domingo.',
  query: consulta,
  partyRows,
  prices: precios,
  locale: 'es',
  offers: [
    {
      id: 'suite-jardin',
      name: 'Suite Jardín',
      kind: 'Suite',
      summary: 'La más amplia, con jardín privado y tina.',
      photos: fotosSuite, // [{ id, src, thumb, width, height, alt }]
      badge: 'La más pedida',
      facts: [{ label: 'Personas', value: 'Hasta 3' }, { label: 'Tamaño', value: '42 m²' }, { label: 'Cama', value: 'King' }],
      perks: ['Desayuno incluido', 'Cancelación gratis hasta 48 h antes'],
      price: { value: mxn(1850), lead: 'desde', unit: '/ noche', unitLabel: 'por noche', total: { value: mxn(4100), label: 'por 2 noches' } }
    },
    {
      id: 'sencilla-cantera',
      name: 'Sencilla Cantera',
      kind: 'Habitación sencilla',
      photos: fotosSencilla,
      available: 'No quedan para el 14 de noviembre',
      price: { value: mxn(980), unit: '/ noche', unitLabel: 'por noche' }
    }
  ],
  labels: {
    select: 'Elegir',
    photos: (n) => `Ver ${n} fotos`,
    unavailable: 'No disponible en tus fechas',
    forQuery: 'Para {query}',
    query: queryLabels,
    price: priceLabels,
    gallery: textosVisor, // los de GGalleryViewer, tal cual
    external: 'se abre en otra pestaña'
  }
}

function elegir({ offer, query }) {
  irAlFormulario(offer.id, query) // tu aplicación lleva la elección a donde corresponda
}
</script>

<template>
  <GbOfferList01 v-bind="habitaciones" @select="elegir" />
</template>
```

La aplicación carga además `@grana/vue/price` (el precio) y `@grana/vue/gallery` (el visor), y registra los iconos Lucide que use (`createIcons`).

## Ejemplos

### e1 · Habitaciones de un hotel como tarjetas (`GbOfferList01`)

**Por qué:** cuando la foto vende y hay entre tres y ocho opciones. Las tarjetas miden lo mismo en cada fila y el precio queda a la vista.

```vue
<!-- Fragmento: `elegir`, `habitaciones` son de tu aplicación -->
<GbOfferList01 v-bind="habitaciones" @select="elegir" />
```

### e2 · Renglones con todo el detalle (`GbOfferList02`)

**Por qué:** cuando comparar importa más que mirar: cada oferta muestra datos y ventajas completos, con la foto al lado (arriba en estrecho).

```vue
<!-- Fragmento: `elegir`, `habitaciones` son de tu aplicación -->
<GbOfferList02 v-bind="habitaciones" @select="elegir" />
```

### e3 · Muchas mesas o recorridos en poco sitio (`GbOfferList03`)

**Por qué:** cuando hay más de ocho ofertas o ninguna foto que enseñar. Cada tarjeta lleva lo esencial y el precio; «Ver fotos» sigue ahí si la oferta tiene dos o más.

```vue
<!-- Fragmento: `recorridos` es de tu aplicación (mismas props que `habitaciones`) -->
<GbOfferList03 v-bind="recorridos" @select="elegir" />
```

### e4 · Una oferta con página propia

**Por qué:** cuando la oferta tiene una página de detalle (`GbOfferDetail`, por ejemplo). Con `href` la tarjeta entera es el enlace y «Elegir» va aparte; escucha `navigate` si tu router quiere la navegación.

```vue
<!-- Fragmento: `router` es de tu aplicación -->
<GbOfferList01 v-bind="habitaciones" @navigate="({ event, href }) => { event.preventDefault(); router.push(href) }" @select="elegir" />
```

## Props

Una sola interfaz para las tres variantes (`GbOfferListProps`). Los tipos de datos salen de `@grana/blocks/booking`.

| Prop | Tipo | Descripción |
| --- | --- | --- |
| `title` | `string` (requerida) | El título de la lista (de la `GSection`). |
| `description` | `string` | Descripción de la `GSection`; el slot `description` la sustituye. |
| `offers` | `Offer[]` (requerida) | 1 a 24 (C7 por encima de 24). id obligatorio (K5); lang a la raíz de su tarjeta y vale para los labels que pinta (#885, #891) |
| `query` | `BookingQuery \| null` | La consulta que la lista responde (K1, K2): se dice una vez bajo el título y, con price.total, cada tarjeta enseña la cuenta |
| `partyRows` | `PartyRow[]` | Para decir la consulta (con query) |
| `context` | `QueryContextExtra` | times/tours para decir una consulta table/tour |
| `prices` | `PriceRegion` | Una GPriceScope alrededor de la lista (la moneda se dice una vez, #772); con precios y sin ella, K3 |
| `locale` | `string` | BCP 47; sin él, el lang del ancestro al montar |
| `labels` | `OfferListLabels = {}` | select (con href y disponible), photos (dos o más fotos), unavailable (available: false), forQuery y query (con query, K2), price, gallery (tal cual a GGalleryViewer), external; sin valores por defecto (C5) |

## Eventos

| Evento | Carga | Cuándo |
| --- | --- | --- |
| `select` | `{ event, offer, query }` (`OfferSelect`) | «Elegir» (tarjeta-enlace) o la tarjeta-botón, con la oferta disponible |
| `photos` | `{ event, offer, index: 0 }` (`OfferPhotos`) | Al abrir el visor (informativo: el bloque ya lo abre) |
| `navigate` | `{ event, href, item: offer }` (`BlockNavigate<Offer>`) | La tarjeta-enlace con clic primario (reemite el de GCard, #505, #574; nunca con external) |

«Elegir» y la tarjeta-botón emiten `select` solo con la oferta disponible. `photos` es informativo: el bloque ya abre el visor. Una oferta con `external` no emite `navigate`. Una escucha de `select` es la única forma de que la elección llegue a tu aplicación.

## Slots

| Slot | Alcance | Qué va |
| --- | --- | --- |
| `offer` | `{ offer: Offer }` | Escape: contenido extra al final del cuerpo de la tarjeta, después del precio |
| `description` | — | Sustituye a la prop description de la GSection |

## Textos (`labels`)

| Clave | Requerido |
| --- | --- |
| `select` | Sí, con alguna oferta con `href` y disponible (C5) |
| `photos` | Sí, con alguna oferta con dos o más fotos (C5; sin él, no hay botón) |
| `unavailable` | Sí, con `available: false` (C5) |
| `forQuery`, `query` | Sí, con `query` (K2) |
| `price` | Los de `GPriceScope` y `GPrice` (los avisa `GPrice`) |
| `gallery` | Los de `GGalleryViewer`, tal cual (los avisa el visor) |
| `external` | Sí, con una oferta `external` (C5) |

## Teclado y foco

| Tecla | Efecto |
| --- | --- |
| `Tab` | Recorre, por tarjeta, la tarjeta (enlace o botón), «Elegir» y «Ver fotos» |
| `Intro` o `Espacio` | Activa la tarjeta-botón (`select`) o el botón enfocado; en la tarjeta-enlace, `Intro` navega |
| `Esc` en el visor de fotos | Cierra y devuelve el foco al botón «Ver fotos» de esa oferta |

El resto de las teclas del visor son las de `GGalleryViewer` ([`GGallery/README.md`](../../../../vue/src/components/GGallery/README.md)).

## Accesibilidad

Cifras de la auditoría de coco ([`design/lab/blocks/booking/auditoria.md`](../../../../../design/lab/blocks/booking/auditoria.md)), tres motores, tres temas, claro y oscuro (`medido`):

a. La lista es una lista real (`ul` o `role="list"` con `listitem`); cada tarjeta tiene una sola acción principal y ningún `GBtn solid` (`prueba`, Vitest).
b. Lo no disponible sigue en el DOM con su motivo en texto (≥ 4,5:1), sin «Elegir» y sin tarjeta-botón (1.4.1): nunca solo atenuado.
c. La línea «Para ...» es exactamente `describeQuery(...)`, igual que el resumen de `GBookingBar` (`prueba`; `medido` a 1440 y 390).
d. El visor de fotos: `Esc` cierra y el foco vuelve a «Ver fotos»; abre en 160 ms (escala y desplazamiento) y con movimiento reducido no se mueve.
e. Un `GPriceScope` por lista; ningún precio fuera de `GPrice`; la leyenda de moneda se dice una vez.
f. Sin desplazamiento horizontal a 1440, 390, 320 ni a 320 con el texto al 200 %.

> **Peligro.** Cada `Offer` necesita un `id` (K5): `select` lo devuelve como identidad de lo elegido. Sin él, el bloque usa el índice y avisa, y tu aplicación recibirá un número que cambia si reordenas la lista. Y sin `labels.select` (con una oferta con `href` y disponible) no hay botón «Elegir»: la persona ve una tarjeta-enlace y no puede elegir.

## Avisos de desarrollo

Prefijo `[Grana GbOfferList<NN>]`, una vez por instancia y motivo, solo en desarrollo. Los comunes (C1 a C8, K1 a K5) están en [`packages/blocks/README.md`](../../../README.md#avisos-comunes-de-booking). El propio:

| Código | Motivo | Qué pasa |
| --- | --- | --- |
| OL1 | Una oferta sin `photos` en 01 o 02 | Se pinta sin `media`; la tarjeta no reserva un hueco vacío |

C1 (lista vacía) y C7 (más de 24 ofertas) son de esta sección; K5 (oferta sin `id`) también.

## Banco de datos de ejemplo

`offer-list.bank.js` exporta `{ props, slots }`: Casa Alcalá con cinco habitaciones (Suite Jardín con nueve fotos agrupadas, `badge`, `facts`, `perks` y `price` con `total` para la consulta común; Doble Patio con `href` y un precio en dos monedas con `approximate`; Sencilla Cantera con `available: 'No quedan para el 14 de noviembre'`; Terraza con precio `null` («a consultar»); y una mínima con `lang: 'en'`, `id`, `name` y una foto), `prices` `{ currency: 'MXN', taxes: 'IVA incluido' }`, la consulta común y `labels` completos. Con él ninguna variante avisa. Banco real: `packages/blocks/playground/booking/offer-list.html`.

## Peso

`dist/booking.js` pesa **36 851 B gzip** con su trozo compartido de `common/` (las 11 secciones y 33 variantes; `medido` con `node packages/blocks/scripts/measure-entry.mjs booking`  2026-10-23); tope de la entrada **37 888 B** (DECISIONS #907; el tope inicial de 36 KiB no se vuelve a subir). Una variante importada sola (esbuild minificado  `vue` y `@grana/vue*` externos; `node packages/blocks/scripts/measure-partial.mjs 5120 booking GbGuestForm=7168`): `GbOfferList01` 4 157 B  `GbOfferList02` 4 141 B  `GbOfferList03` 4 167 B; tope por variante **5 120 B** (#887). `@grana/vue` y sus entradas son *peer*: las paga la aplicación.

## Alcance

- **No calcula el total:** `price.total` lo da tu aplicación para esa consulta (#769); sin él, la tarifa sola.
- **No reserva:** `select` te da la oferta y la consulta; el siguiente paso es tuyo.
- **Fotos:** un visor por sección, no uno por tarjeta; no hay `GGalleryViewer` propio de la tarjeta.
- **Límite aceptado BK-L7 (#904):** en 01 la última tarjeta sola llena la fila (1024 px frente a 244 de las demás) y su foto crece (575 px de alto frente a 136). Es el reparto de `GAdaptiveLayout` y se acepta; no se cambia a `g-adapt-short`. Para un tope, monta el bloque en una columna (receta arriba) o en una rejilla propia. **Reservado:** un máximo de familia para `standard`, en una ronda de kiwi si lo pides.
- **`Offer.lang` (#885, #891):** si el nombre y el resumen no están en el idioma de la página, `lang` va a la raíz de la tarjeta y los `labels` que pinta se esperan en ese mismo idioma.
- **Sin CSS ni utilidades** (#763, #807).

## Verificación

| Qué | Resultado | Nivel |
| --- | --- | --- |
| Vitest de `GbOfferList` (una sola acción principal por tarjeta y ningún `GBtn solid`; «Elegir» solo con `href` y disponible; no disponible con su motivo y sin `select`; un solo `GGalleryViewer`, `from` = el botón; línea de la consulta igual a `describeQuery`; `GPrice` con el `PriceSpec` y un `GPriceScope`; 03 sin `media`; avisos) | 44/44 (`npm test -w @grana/blocks`, 2026-10-23) | `prueba` |
| Auditoría de coco: Offer list 01, 02 y 03; el visor abre y vuelve al botón; no disponible con su motivo; BK-L7 anotado como límite | Veredicto `candidate` (tres motores, tres temas); BK-L7 aceptado en #904 | `medido` |

**No verificado:** lector de pantalla real (el nombre de la tarjeta-botón, la línea de la consulta, la cuenta de `GPrice`); `forced-colors` real; teléfono real y puntero grueso; rendimiento con el perfilador. **Pendientes abiertos:** BK-L7 (límite aceptado); los generales, en [`PENDIENTES.md`](../../../../../PENDIENTES.md).

## Fuentes

- Contrato: [`design/contracts/blocks/offer-list.md`](../../../../../design/contracts/blocks/offer-list.md) y [`_comun.md`](../../../../../design/contracts/blocks/_comun.md) (§15 a §25).
- Decisiones: #860 a #866, #868, #884, #885, #891, #904 en `DECISIONS.md`.
- Metadatos: [`GbOfferList.meta.json`](./GbOfferList.meta.json). Pruebas: [`GbOfferList.test.js`](./GbOfferList.test.js). Auditoría: [`design/lab/blocks/booking/auditoria.md`](../../../../../design/lab/blocks/booking/auditoria.md).
