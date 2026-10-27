# @grana/blocks

Capa de composición sobre `@grana/vue`: secciones y pantallas armadas con los componentes de Grana, con props, eventos de intención y slots. Un block no hace `fetch`, no valida ni guarda y no conoce endpoints; lo que la persona decide sale como evento y lo resuelve tu aplicación.

**Estado: en construcción.** Paquete privado (`0.0.0`); no se publica con la beta `0.1.0` de `@grana/vue`. Cuatro entradas, una por familia:

| Entrada | Qué trae | Estado |
| --- | --- | --- |
| `@grana/blocks/marketing` | **Marketing P0**: 9 secciones, cada una con 3 variantes (27 componentes) | Las 9 secciones `candidate` (tabla abajo) |
| `@grana/blocks/booking` | **Booking**: 11 secciones, cada una con 3 variantes (33 componentes), para sitios de hospedaje, restaurante y recorridos | Las 11 secciones `candidate` (tabla en «Booking») |
| `@grana/blocks/ecommerce` | **Ecommerce**: 12 secciones, cada una con 3 variantes (36 componentes), más `cartTotals`, para tiendas | 9 secciones `candidate` y 3 en `draft` (tabla en «Ecommerce») |
| `@grana/blocks` | Gestión (CRUD, editor, detalle, dashboard). **Sin componentes todavía**: `dist/blocks.js` no exporta ninguno | `GResourceList` tiene contrato y CSS (`GResourceList.css`, de coco), pero aún no tiene `.vue` ni `meta.json` ni README |

## Marketing P0

Entrada `@grana/blocks/marketing`. Los bloques son **estructurales** (DECISIONS #763): sin CSS, sin `<style>` y sin clases utilitarias. Toda la forma sale de las primitivas de `@grana/vue` y del tema, así que cualquier tema de tu proyecto los viste.

| Sección | Variantes | Estado | README |
| --- | --- | --- | --- |
| `GbHero` | `GbHero01` La ventana, `02` Vistas, `03` El umbral | `candidate` | [`GbHero/README.md`](./src/blocks/GbHero/README.md) |
| `GbFeatures` | `GbFeatures01` Rejilla, `02` Alternada, `03` Lectura | `candidate` | [`GbFeatures/README.md`](./src/blocks/GbFeatures/README.md) |
| `GbBlogList` | `GbBlogList01` Rejilla, `02` Lista con fecha, `03` Destacada y lista | `candidate` | [`GbBlogList/README.md`](./src/blocks/GbBlogList/README.md) |
| `GbStats` | `GbStats01` Fila, `02` Banda, `03` Junto a un párrafo | `candidate` | [`GbStats/README.md`](./src/blocks/GbStats/README.md) |
| `GbTestimonials` | `GbTestimonials01` Tarjetas, `02` La voz, `03` Avance | `candidate` | [`GbTestimonials/README.md`](./src/blocks/GbTestimonials/README.md) |
| `GbCta` | `GbCta01` Banda de marca, `02` Tarjeta con imagen, `03` Línea sobria | `candidate` | [`GbCta/README.md`](./src/blocks/GbCta/README.md) |
| `GbFaq` | `GbFaq01` Acordeón, `02` Todo a la vista, `03` Con buscador | `candidate` | [`GbFaq/README.md`](./src/blocks/GbFaq/README.md) |
| `GbNewsletter` | `GbNewsletter01` En línea, `02` Tarjeta, `03` Banda de marca | `candidate` | [`GbNewsletter/README.md`](./src/blocks/GbNewsletter/README.md) |
| `GbFooter` | `GbFooter01` Columnas, `02` Una línea, `03` Con suscripción | `candidate` | [`GbFooter/README.md`](./src/blocks/GbFooter/README.md) |

Las nueve secciones están en `candidate` tras la auditoría de coco ([`design/lab/blocks/marketing/auditoria.md`](../../design/lab/blocks/marketing/auditoria.md)): 4327/4327 comprobaciones en Chromium, Firefox y WebKit, con el tema por defecto, rústico y lujo, claro y oscuro (`medido`, tras baea37f). Las seis últimas (Stats, Testimonials, CTA, FAQ, Newsletter y Footer) esperaron a `GText` (DECISIONS #841, #851 a #856), la primitiva de texto suelto de `@grana/vue` ([`GText/README.md`](../vue/src/components/GText/README.md)), que sustituye al `p` desnudo con márgenes y cursivas del navegador.

### Instalación

`@grana/vue` y `vue` son *peer dependencies* y externos en el build: el paquete no lleva copia de ninguno. Las entradas de `@grana/vue` que un bloque compone también son *peer* (`@grana/vue/hero`, `@grana/vue/tag`); las paga tu aplicación.

```js
import { createApp } from 'vue'
import Grana from '@grana/vue'
import '@grana/vue/style.css'
import { marketing } from '@grana/blocks/marketing'

createApp(App).use(Grana).use(marketing).mount('#app') // registra <gb-hero-01> ... <gb-footer-03>
```

Para pagar solo lo que usas, importa la variante por nombre: `import { GbHero01 } from '@grana/blocks/marketing'` (cada variante está marcada como pura para la importación parcial). Hasta publicarse se usa desde el repositorio, con el `dist/` construido (ver «Comandos»).

### Una página con bloques

```vue
<script setup>
import { GContainer } from '@grana/vue'
import { GbHero01, GbFeatures01 } from '@grana/blocks/marketing'
import { hero, features } from './datos.js'
</script>

<template>
  <GContainer>
    <GbHero01 v-bind="hero" />
    <GbFeatures01 v-bind="features" />
  </GContainer>
</template>
```

Cambiar `GbFeatures01` por `GbFeatures02` no toca los datos: las tres variantes de una sección comparten la misma interfaz.

## Booking

Entrada `@grana/blocks/booking` (DECISIONS #860 a #907). Once secciones para una página de reserva de un hotel, un restaurante o un recorrido, con **la consulta como hilo**: la búsqueda emite una `BookingQuery` y las demás secciones la reciben y la dicen con las mismas palabras. Como Marketing, son **estructurales** (sin CSS, sin `<style>`, sin utilidades): toda la forma sale de las primitivas de `@grana/vue` y del tema. No reservan, no cobran y no hacen `fetch`: emiten intenciones (`submit`, `select`, `book`, `photos`, `navigate`, `activate`) y tu aplicación decide.

| Sección | Variantes | Estado | README |
| --- | --- | --- | --- |
| `GbSearch` | `GbSearch01` La frase, `02` La barra, `03` La que acompaña | `candidate` | [`GbSearch/README.md`](./src/blocks/GbSearch/README.md) |
| `GbOfferList` | `GbOfferList01` Tarjetas, `02` Renglones, `03` Rejilla compacta | `candidate` | [`GbOfferList/README.md`](./src/blocks/GbOfferList/README.md) |
| `GbOfferDetail` | `GbOfferDetail01` Espacios + ficha, `02` Tira + pestañas, `03` Lectura larga | `candidate` | [`GbOfferDetail/README.md`](./src/blocks/GbOfferDetail/README.md) |
| `GbAvailability` | `GbAvailability01` Calendario con precio, `02` Próximas fechas, `03` Calendario + resumen | `candidate` | [`GbAvailability/README.md`](./src/blocks/GbAvailability/README.md) |
| `GbBookingSummary` | `GbBookingSummary01` Tarjeta, `02` El recibo, `03` Línea | `candidate` | [`GbBookingSummary/README.md`](./src/blocks/GbBookingSummary/README.md) |
| `GbGuestForm` | `GbGuestForm01` Una página, `02` Por pasos, `03` Con lo pedido a la vista | `candidate` | [`GbGuestForm/README.md`](./src/blocks/GbGuestForm/README.md) |
| `GbConfirmation` | `GbConfirmation01` Tarjeta, `02` Lo que sigue, `03` Captura | `candidate` | [`GbConfirmation/README.md`](./src/blocks/GbConfirmation/README.md) |
| `GbItinerary` | `GbItinerary01` Lista con hora, `02` Por días, `03` Tabla | `candidate` | [`GbItinerary/README.md`](./src/blocks/GbItinerary/README.md) |
| `GbMenu` | `GbMenu01` Carta, `02` Por tiempos, `03` Platos con foto | `candidate` | [`GbMenu/README.md`](./src/blocks/GbMenu/README.md) |
| `GbLocation` | `GbLocation01` Tarjeta con mapa, `02` Dos columnas, `03` Puntos de encuentro | `candidate` | [`GbLocation/README.md`](./src/blocks/GbLocation/README.md) |
| `GbPolicies` | `GbPolicies01` Avance, `02` Todo a la vista, `03` Tarjetas | `candidate` | [`GbPolicies/README.md`](./src/blocks/GbPolicies/README.md) |

Las opiniones (B12) **no tienen sección propia**: se usa `GbTestimonials` de `@grana/blocks/marketing` tal cual, con `source` obligatoria (DECISIONS #865; receta en [`GbOfferDetail/README.md`](./src/blocks/GbOfferDetail/README.md#opiniones-con-gbtestimonials)). Quien usa Booking y opiniones carga las dos entradas.

Las once están en `candidate` tras la auditoría de coco ([`design/lab/blocks/booking/auditoria.md`](../../design/lab/blocks/booking/auditoria.md)) y su addendum del 2026-10-23, que cierra los hallazgos que bloqueaban (BK-B1, BK-B4, BK-B5, AV-L1 y BS-L1). Pasada completa con el verificador propio en Chromium, Firefox y WebKit, tema por defecto, rústico y lujo, claro y oscuro: 6000/6045, con los 45 fallos en un error del propio verificador (corregido; `--solo=shapes` 396/396 en los tres motores); no se repitió la pasada completa tras esa última corrección (`medido`).

### Instalación

`@grana/vue` y `vue` son *peer dependencies*. Booking compone además cuatro entradas de `@grana/vue` que **paga tu aplicación**: `@grana/vue/booking` (`GBookingBar`, `GPartyField`, `describeQuery`), `@grana/vue/gallery` (`GGallery`, el visor), `@grana/vue/price` (`GPrice`, `GPriceScope`) y `@grana/vue/tag` (`GTag`); `GbHero03` de Marketing suma `@grana/vue/hero` en la receta del umbral. Cada README de sección dice cuáles carga esa sección.

```js
import { createApp } from 'vue'
import Grana from '@grana/vue'
import Booking from '@grana/vue/booking'
import Gallery from '@grana/vue/gallery'
import Price from '@grana/vue/price'
import Tag from '@grana/vue/tag'
import '@grana/vue/style.css'
import { booking } from '@grana/blocks/booking'

createApp(App).use(Grana).use(Booking).use(Gallery).use(Price).use(Tag).use(booking).mount('#app') // registra <gb-search-01> ... <gb-availability-03>
```

Para pagar solo lo que usas, importa la variante por nombre (`import { GbSearch01 } from '@grana/blocks/booking'`). Registra con `createIcons` los iconos Lucide que uses en `icon` (acciones, canales, políticas).

### Datos comunes de una reserva

Las secciones reciben **el mismo objeto de consulta**, las mismas filas del grupo de personas y los mismos textos para decirla, para que digan lo mismo con las mismas palabras. Los README de sección importan estos datos de un `reserva.js` de tu aplicación (en el repositorio son los del banco, `src/blocks/bank/booking.js`):

```js
// reserva.js · lo que comparten las secciones de Booking (Casa Alcalá)
export const consulta = { kind: 'stay', from: '2026-11-13', to: '2026-11-15', party: { adults: 2, children: 1, rooms: 1 } }

export const partyRows = [ // las filas de GPartyField
  { key: 'adults', label: 'Adultos', min: 1, max: 6, default: 2, unit: (n) => `${n} ${n === 1 ? 'adulto' : 'adultos'}`, decrementLabel: 'Un adulto menos', incrementLabel: 'Un adulto más' },
  { key: 'children', label: 'Niños', hint: 'De 0 a 12 años', min: 0, max: 4, unit: (n) => `${n} ${n === 1 ? 'niño' : 'niños'}`, decrementLabel: 'Un niño menos', incrementLabel: 'Un niño más' },
  { key: 'rooms', label: 'Habitaciones', hint: 'Hasta una por adulto', min: 1, max: (v) => v.adults, unit: (n) => `${n} ${n === 1 ? 'habitación' : 'habitaciones'}`, decrementLabel: 'Una habitación menos', incrementLabel: 'Una habitación más' }
]

export const queryLabels = { // para decir la consulta (describeQuery)
  nights: (n) => `${n} ${n === 1 ? 'noche' : 'noches'}`,
  separator: ' · ',
  checkout: 'Salida el {date}',
  noDates: 'Sin fechas', noDate: 'Sin fecha', noTime: 'Sin hora', noTour: 'Sin recorrido'
}

export const barLabels = { // labels de GBookingBar: ver GBookingBar/README.md
  ...queryLabels,
  phrase: 'Llego el {from}, me quedo {nights} y somos {party}.',
  fields: { from: 'Llegada', to: 'Salida', nights: 'Noches', date: 'Día', time: 'Hora', tour: 'Recorrido', party: 'Huéspedes' },
  empty: { from: '¿qué día?', nights: '¿cuántas noches?', date: '¿qué día?', time: '¿a qué hora?', tour: '¿cuál?' },
  summaryTitle: 'Tu consulta', change: 'Cambiar', submit: 'Ver disponibilidad', pending: 'Consultando...', close: 'Cerrar', done: 'Listo',
  otherDay: 'Otro día', full: 'lleno', decrement: 'Una noche menos', increment: 'Una noche más',
  errors: { dates: 'Elige las fechas.', night: 'No quedan habitaciones la noche del {date}.', nights: 'Elige entre 1 y 14 noches.', date: 'Elige el día.', time: 'Elige la hora.', tour: 'Elige el recorrido.' },
  missing: (n, v) => `${n === 1 ? 'Falta un dato' : `Faltan ${v.count} datos`}: ${v.list}`,
  datePicker: { prev: 'Mes anterior', next: 'Mes siguiente', dialog: 'Elegir fechas', close: 'Cerrar', today: 'hoy', selected: 'elegida', unavailable: 'no disponible', rangeStart: 'llegada', rangeEnd: 'salida', rangeSingle: 'llegada y salida', inRange: 'dentro de la estancia', clear: 'Borrar', done: 'Listo' }
}

export const precios = { currency: 'MXN', taxes: 'IVA incluido' } // una región de precios: la moneda se dice una vez
export const priceLabels = { onRequest: 'Precio a consultar', approx: 'aprox.', total: 'Total', free: 'Gratis', before: 'Antes', range: '{min} a {max}', legend: 'Precios en {name} ({code})' }
```

### La consulta es el hilo

`GbSearch` emite una `BookingQuery` con su `kind` (`stay`, `table` o `tour`). Tu aplicación la guarda y se la pasa a las demás secciones (`query`, `partyRows`, `labels.query`): ninguna vuelve a formatear fechas, noches ni personas, todas llaman a `describeQuery` de `@grana/vue/booking`. El flujo completo, con código, está en [«La consulta que viaja»](./src/blocks/GbSearch/README.md#la-consulta-que-viaja). Reglas que comparten:

1. **Precios solo con `GPrice`.** Un precio de dato es un `PriceSpec` que va tal cual a `GPrice`; una lista o tarjeta de precios lleva una región (`prices`, un `GPriceScope`) y la moneda se dice una vez. **Grana no suma, no multiplica ni convierte** (#769): el total (`PriceTotal`, `Totals`) lo da tu aplicación.
2. **Fechas y horas en `<time datetime>`.** El texto sale de `Intl.DateTimeFormat(locale)`; sin `locale`, el `lang` del ancestro al montar. En el servidor sin `locale`, la fecha ISO y se reformatea al montar. Las horas del lugar (Itinerary, Location, Confirmation) se dicen en la zona del lugar (`timeZone`), no en la del teléfono.
3. **Lo no disponible se dice, no se esconde.** Una oferta, un plato, un turno o un día que no se puede elegir sigue a la vista con su motivo en texto y sin acción de elegir (nunca solo atenuado).
4. **Una activación por gesto** en lo que abre algo (el visor de fotos).
5. **Estado de vista, sí; de negocio, no.** Un bloque puede guardar la pestaña, el paso o los valores que se escriben y los emite con `update:*` (`v-model:query`, `values`, `value`, `step`); no calcula disponibilidad, precios ni totales.
6. **Textos en `labels`, sin valores por defecto**, y pasos directos: `labels.price` va a la región de precios, `labels.gallery` a la galería, `labels.datePicker` a `GDatePicker`, `labels.bar` a `GBookingBar`, `labels.party` a `GPartyField`, `labels.form` a `GForm`; el bloque no los completa y avisa el componente con su prefijo.
7. **Ningún bloque de Booking pinta `h1`**; el de la página es de `GbHero` o de tu cabecera.

### Eventos de intención

| Evento | Carga | Secciones |
| --- | --- | --- |
| `submit` | Search: la carga de `GBookingBar` tal cual. Guest form: `{ event, data, values, party, consents, query }` | `GbSearch`, `GbGuestForm` |
| `select` | `{ event, offer, query }` (Offer list) · `{ event, kind, value, day, query }` (Availability) | `GbOfferList`, `GbAvailability` |
| `book` | `{ event, offer, query }` | `GbOfferDetail` |
| `photos` | `{ event, offer, index }` (informativo: el bloque ya abre el visor) | `GbOfferList` |
| `update:query`, `update:values`, `update:value`, `update:step` | el valor | `GbSearch`, `GbGuestForm`, `GbAvailability` |
| `navigate`, `activate` | como en Marketing (enlaces y acciones sin `href`) | las que tienen acciones o enlaces |

### Avisos comunes de Booking

Prefijo `[Grana Gb<Sección><NN>]`, una vez por instancia y motivo, solo en desarrollo. Valen los C1 a C8 de Marketing y además:

| Código | Motivo | Qué pasa |
| --- | --- | --- |
| K1 | `query` sin `kind` o con forma inválida para su `kind` | Se trata como sin consulta |
| K2 | `query` sin `partyRows` o sin `labels.query` | La línea de la consulta no se pinta |
| K3 | Un `PriceSpec` sin `value` (ni `null` explícito) o una lista con precios y sin `prices` | Se pinta sin región (cada `GPrice` con su código de moneda) |
| K4 | `available` que no es booleano ni texto | Cuenta como disponible |
| K5 | Una `Offer` sin `id` | Se usa el índice y avisa |

### Recetas

- **El umbral:** `GbHero03` con `GbSearch01` en el slot `consult` ([`GbSearch/README.md`](./src/blocks/GbSearch/README.md#el-umbral-la-consulta-en-la-portada)).
- **La consulta que viaja:** el mismo objeto de la búsqueda a la oferta, el resumen, el formulario y la confirmación ([`GbSearch/README.md`](./src/blocks/GbSearch/README.md#la-consulta-que-viaja)).
- **Columna pegada con CSS de tu aplicación** (BK-L1): [`GbBookingSummary/README.md`](./src/blocks/GbBookingSummary/README.md#columna-pegada-con-css-de-tu-aplicación).
- **Opiniones con `GbTestimonials`:** [`GbOfferDetail/README.md`](./src/blocks/GbOfferDetail/README.md#opiniones-con-gbtestimonials).
- **Montaje en columna** (BK-L13): `GbConfirmation01`, `GbLocation01` y `GbBookingSummary01` son tarjetas pensadas para una columna de 360 a 640 px; a todo el ancho de 1440 su foto mide de 560 a 700 px de alto y baja lo importante del primer pantallazo ([`GbConfirmation`](./src/blocks/GbConfirmation/README.md#montaje-en-columna-bk-l13), [`GbLocation`](./src/blocks/GbLocation/README.md#montaje-en-columna-bk-l13), [`GbBookingSummary`](./src/blocks/GbBookingSummary/README.md#columna-pegada-con-css-de-tu-aplicación)).

### Peso

Medido con `gzip -c` (2026-10-23): `dist/booking.js` **36 851 B** con su trozo compartido de `common/` (`node scripts/measure-entry.mjs booking`), con tope de **37 888 B** (DECISIONS #907, no se vuelve a subir); una variante importada sola de 1837 B (`GbSearch01`) a 6940 B (`GbGuestForm03`), con tope de **5120 B** y de 7168 B para `GbGuestForm` (#887; `node scripts/measure-partial.mjs 5120 booking GbGuestForm=7168`). El tope de `@grana/vue/booking` es de 15 KiB (15 360 B) por `describeQuery` (#878). `dist/marketing.js` y `dist/blocks.js` no crecen por Booking: las compuertas lo vigilan.

### Qué no hay todavía

Reservado (`design/contracts/blocks/_comun.md` §22 y §24): mapa vivo (`GEmbed`, BK-L5), calificación con estrellas (M-L2), pago y carrito (la aplicación; Ecommerce), edades de los niños (`childAges` de `GPartyField`), el conserje de la consulta (`appearance="guided"`), un muelle genérico para el total (BK-L2) y una columna pegada (BK-L1). Nada de eso se documenta como disponible.

## Ecommerce

Entrada `@grana/blocks/ecommerce` (DECISIONS #909 a #945). Doce secciones para la tienda de un taller, un restaurante con venta o un comercio pequeño: del escaparate al historial de pedidos, con **la elección como hilo**. La talla y el color que se eligen en la ficha son las mismas `{ label, value }` que se leen en la línea del carrito, en el resumen del pedido y en el historial, con las mismas palabras. Como Marketing y Booking, son **estructurales** (sin CSS, sin `<style>`, sin utilidades): toda la forma sale de las primitivas de `@grana/vue` y del tema. No cobran, no validan cupones, no calculan el envío y no hacen `fetch`: emiten intenciones (`add`, `open`, `navigate`, `update:filters`, `update:page`, `retry`) y tu aplicación decide. **Nueve secciones son `candidate` y tres siguen en `draft`** (tabla abajo).

| Sección | Variantes | Estado | README |
| --- | --- | --- | --- |
| `GbProductCard` | `GbProductCard01` Foto arriba, `02` Horizontal, `03` Compacta con acción rápida | `candidate` | [`GbProductCard/README.md`](./src/blocks/GbProductCard/README.md) |
| `GbCategoryPreviews` | `GbCategoryPreviews01` Puertas con foto, `02` Tira, `03` Lista con cuenta | `candidate` | [`GbCategoryPreviews/README.md`](./src/blocks/GbCategoryPreviews/README.md) |
| `GbTrust` | `GbTrust01` Fila, `02` Tarjetas, `03` Lista al pie | `candidate` | [`GbTrust/README.md`](./src/blocks/GbTrust/README.md) |
| `GbPromo` | `GbPromo01` Banda, `02` Tarjeta con imagen, `03` Línea | `candidate` | [`GbPromo/README.md`](./src/blocks/GbPromo/README.md) |
| `GbProductGrid` | `GbProductGrid01` Rejilla, `02` Con filtros al lado, `03` Renglones | `candidate` | [`GbProductGrid/README.md`](./src/blocks/GbProductGrid/README.md) |
| `GbQuickView` | `GbQuickView01` Diálogo, `02` Hoja lateral, `03` Elegir y añadir | `candidate` | [`GbQuickView/README.md`](./src/blocks/GbQuickView/README.md) |
| `GbReviews` | `GbReviews01` Lista con resumen, `02` Resumen y distribución, `03` Tarjetas | `candidate` | [`GbReviews/README.md`](./src/blocks/GbReviews/README.md) |
| `GbOrderSummary` | `GbOrderSummary01` Tarjeta, `02` El recibo, `03` Línea | `candidate` | [`GbOrderSummary/README.md`](./src/blocks/GbOrderSummary/README.md) |
| `GbOrderHistory` | `GbOrderHistory01` Tabla, `02` Tarjetas con seguimiento, `03` Lista | `candidate` | [`GbOrderHistory/README.md`](./src/blocks/GbOrderHistory/README.md) |
| `GbProductOverview` | `GbProductOverview01` Galería + panel, `02` Galería arriba, `03` Tira + pestañas | `draft` (EC-L7) | Sin README todavía |
| `GbCart` | `GbCart01` Lista + resumen al lado, `02` Resumen al pie, `03` Cajón | `draft` (EC-L7) | Sin README todavía |
| `GbCheckout` | `GbCheckout01` Por pasos, `02` Se pliega lo hecho, `03` Con el pedido al lado | `draft` (EC-L7) | Sin README todavía |

Las nueve `candidate` pasaron la auditoría de coco ([`design/lab/blocks/ecommerce/auditoria.md`](../../design/lab/blocks/ecommerce/auditoria.md)) sobre las 36 variantes reales, en Chromium, Firefox y WebKit, con el tema por defecto, rústico y lujo, claro y oscuro: 3 248 de 3 275, 3 189 de 3 216 y 3 188 de 3 216 al auditar (0aa51df); tras el remate de bruno (b663be5) quedaron 3 266 de 3 275 en la familia, con los 9 fallos restantes solo de PO-L1, CR-L1 y CK-L1, los de las tres secciones `draft` (DECISIONS #945; `medido`).

**Por qué tres siguen en `draft`.** `GbProductOverview`, `GbCart` y `GbCheckout` ponen un panel o un resumen **al lado** de otra cosa (las fotos, la lista o el formulario), y `GAdaptiveLayout` pone en línea propia todo hijo con varios controles, una `section` o una `table`; sin CSS (#763) un bloque no puede poner un panel al lado de otra cosa. La recomendación de lima es una primitiva nueva, `GSplit` (dos regiones con proporción que se apilan cuando no caben), y **está pendiente de la decisión del usuario** (EC-L7, DECISIONS #933, enmendada por #942). Mientras tanto, esas tres secciones se pintan en una columna, que no es un defecto, y no tienen README: el estado y las medidas de sus variantes están en sus `meta.json`. `GbProductGrid` 02 sí deja las facetas al lado a 1440 y es `candidate` (#942).

### Instalación

`@grana/vue` y `vue` son *peer dependencies*. Ecommerce compone además cuatro entradas de `@grana/vue` que **paga tu aplicación**: `@grana/vue/price` (`GPrice`, `GPriceScope`), `@grana/vue/gallery` (`GGallery`, el visor), `@grana/vue/tag` (`GTag`, `GTagGroup`) y `@grana/vue/load-region` (`GLoadRegion`). **No** carga `@grana/vue/booking`: Ecommerce no tiene consulta. Cada README de sección dice cuáles carga esa sección.

```js
import { createApp } from 'vue'
import Grana from '@grana/vue'
import Price from '@grana/vue/price'
import Gallery from '@grana/vue/gallery'
import Tag from '@grana/vue/tag'
import LoadRegion from '@grana/vue/load-region'
import '@grana/vue/style.css'
import { ecommerce } from '@grana/blocks/ecommerce'

createApp(App).use(Grana).use(Price).use(Gallery).use(Tag).use(LoadRegion).use(ecommerce).mount('#app') // registra <gb-product-card-01> ... <gb-order-history-03>
```

Para pagar solo lo que usas, importa la variante por nombre (`import { GbProductCard01 } from '@grana/blocks/ecommerce'`). Registra con `createIcons` los iconos Lucide que uses (`icon` de las promesas de `GbTrust`). Las políticas de la tienda son [`GbPolicies`](./src/blocks/GbPolicies/README.md) de `@grana/blocks/booking`, que no se reexporta aquí: quien usa las dos secciones carga las dos entradas.

### Datos comunes de una tienda

Las secciones reciben **la misma región de precios y los mismos textos de tarjeta, calificación y precio**, para que una tarjeta se lea igual en una rejilla, en un resultado y en el carrito. Los README de sección importan estos datos de un `tienda.js` de tu aplicación (en el repositorio son los del banco, `src/blocks/bank/ecommerce.js`):

```js
// tienda.js · lo que comparten las secciones de Ecommerce (Barro y Agave)
export const precios = { currency: 'MXN', taxes: 'IVA incluido' } // una región de precios: la moneda se dice una vez
export const priceLabels = {
  onRequest: 'Precio a consultar', approx: 'aprox.', total: 'Total', free: 'Gratis', before: 'Antes',
  range: '{min} a {max}', saving: 'Ahorras {amount}', legend: 'Precios en {name} ({code})'
}

// La calificación en palabras, con singular y plural: «4,8 de 5 · 312 opiniones»
export const rating = (r) => `${r.average} de ${r.max} · ${r.countText} ${r.count === 1 ? 'opinión' : 'opiniones'}`

// `ProductCardLabels`: el mismo juego en GbProductCard, GbProductGrid (`labels.card`) y el carrito
export const cardLabels = {
  add: 'Añadir al carrito', choose: 'Elegir opciones', busy: 'Añadiendo…', unavailable: 'No disponible',
  rating, noReviews: 'Todavía sin opiniones', price: priceLabels, external: 'se abre en otra pestaña'
}

export const piezas = (n) => `${n} ${n === 1 ? 'pieza' : 'piezas'}`
export const zonaDeLaTienda = 'America/Mexico_City' // las fechas de un pedido o una oferta se dicen en la hora de la tienda
```

### La tienda en una página

Cada sección es una pieza; la página es tuya. Una portada y una categoría con tres de ellas:

```vue
<!-- Fragmento: `portada`, `categorias`, `promesas`, `textiles` y `abrirVistaRapida` son de tu aplicación -->
<script setup>
import { GContainer } from '@grana/vue'
import { GbPromo01, GbCategoryPreviews01, GbTrust01, GbProductGrid02 } from '@grana/blocks/ecommerce'
</script>

<template>
  <GContainer>
    <GbPromo01 v-bind="portada" />
    <GbCategoryPreviews01 v-bind="categorias" />
    <GbTrust01 v-bind="promesas" />
    <GbProductGrid02 v-bind="textiles" @open="abrirVistaRapida" />
  </GContainer>
</template>
```

### Reglas de la familia

1. **Precios solo con `GPrice`** y **una región por lista** (`prices`, un `GPriceScope`): la moneda se dice una vez. En Ecommerce la región es obligatoria donde hay más de un precio de la misma moneda (rejilla, carrito, pedido). **Grana suma una sola vez, en un solo sitio** (#911): los bloques no suman, no multiplican ni redondean; el total llega hecho (`CartLine.total`, `Totals`), de [`cartTotals`](#carttotals) o de tu servidor.
2. **Nada se pierde al volver** (#913). **La elección viaja** (las mismas `ChosenOption` de la ficha al carrito, al pedido y al historial); **quitar deja huella** (el carrito); **volver no borra** (el pago); **cerrar devuelve** (la vista rápida devuelve el foco a su tarjeta y deja la elección en tu aplicación); **nunca a ciegas** (una acción rápida no añade un producto con opciones sin elegir).
3. **La calificación se dice en palabras** (#912): «4,8 de 5 · 312 opiniones», con su cuenta siempre y con el decimal del idioma de `Intl` (#929: «4,8» en `es`, «4.8» en `es-MX`). Sin opiniones, «Todavía sin opiniones», nunca «0 de 5». **Sin estrellas** (M-L2 reservado).
4. **El pago es de la aplicación** (#922). Ningún bloque pide, pinta, valida ni transmite datos de tarjeta, cuenta o identidad fiscal; los bloques solo muestran lo que la aplicación ya resumió («Tarjeta terminada en 4242»). Un campo con `autocomplete` `cc-*` o `name` que empieza por `card` no se pinta (EC6), y una compuerta lo vigila.
5. **Urgencia honesta.** Sin cuenta atrás, sin «quedan 5 minutos», sin contadores de personas viendo: una oferta dice **hasta qué fecha** (en `<time>` y en la hora de la tienda), una existencia baja es una insignia de texto que da tu aplicación y una referencia de precio siempre lleva su nombre (`compareLabel`).
6. **Lo no disponible se dice, no se esconde:** un producto, un valor, una línea o una categoría que no se puede pedir sigue a la vista con su motivo en texto y sin la acción de pedirla.
7. **Una pregunta que no es un campo no lleva `name`** (#934): las opciones de la ficha y de la vista rápida se eligen por `v-model`, no se envían, y `GRadioGroup` genera un `name` único; así la ficha y la vista rápida del mismo producto no comparten grupo de radios.
8. **Ningún bloque de Ecommerce pinta `h1`:** el de la página es de `GbHero` o de tu cabecera; el título de cada sección baja un nivel por anidación.

### Eventos de intención

| Evento | Carga | Secciones (`candidate`) |
| --- | --- | --- |
| `add` | `{ event, product, variant, selection, options, quantity }` (la `Variant` resuelta o `null`; `options` ya dichas) | `GbProductCard` (03: `variant: null`, `selection: {}`), `GbProductGrid` (02), `GbQuickView` |
| `open` | `{ event, product }` · `{ event, order }` | `GbProductCard`, `GbProductGrid` · `GbOrderHistory` |
| `select` | `{ event, product, key, value, variant }` (informativo: la elección ya está en `v-model:selection`) | `GbQuickView` |
| `update:filters`, `update:sort`, `update:page` | el valor (un objeto nuevo en `filters`) | `GbProductGrid`; `update:page` también en `GbReviews` y `GbOrderHistory` |
| `update:open`, `update:selection`, `update:quantity` | el valor | `GbQuickView` |
| `retry` | `{ event: null }` | `GbProductGrid`, `GbOrderHistory` |
| `navigate`, `activate` | como en Marketing (enlaces y acciones sin `href`) | las que tienen acciones o enlaces |

`event: null` (#936): cuando el componente compuesto no entrega un evento del DOM (`retry` de `GLoadRegion` y `GTable`), la carga lleva `event: null` y nunca un evento fabricado. Una activación por gesto (#661) en lo que abre algo (la vista rápida): la cumple `GDialog`. Las tres secciones en `draft` suman `change`, `remove` y `restore` (`GbCart`) y `submit` (`GbCheckout`), cuyas cargas se documentarán con su README.

### Avisos comunes de Ecommerce

Prefijo `[Grana Gb<Sección><NN>]`, una vez por instancia y motivo, solo en desarrollo. Valen los C1 a C8 de Marketing, K3 y K4 de Booking y además:

| Código | Motivo | Qué pasa |
| --- | --- | --- |
| EC1 | Una lista con precios y sin `prices` (región obligatoria) | Se pinta sin región (cada `GPrice` con su código) |
| EC2 | `rating` con `average` fuera de `0..max`, o sin `count` | No se pinta la calificación |
| EC3 | Un producto con opciones obligatorias y la acción «Añadir» sin `labels.choose` | La acción rápida no se pinta (nunca se añade a ciegas) |
| EC4 | `variants` cuya `options` no cubre todas las `ProductOption.key`, o dos con la misma combinación | Esa variante se ignora |
| EC5 | Falta el `id` obligatorio (`Product`, `Order`, `CartLine`, `CheckoutStep`) | Se usa el índice (o el paso se omite) |
| EC6 | Un dato de tarjeta en un campo del bloque (`autocomplete` `cc-*` o `name` que empieza por `card`) | El campo **no se pinta** |
| EC7 | `until` en el pasado al montar (`GbPromo`) | Se pinta igual (tu aplicación decide quitarla) |

### `cartTotals`

La aritmética del carrito vive **solo aquí** (DECISIONS #911) y no en `@grana/vue/price`, que mantiene «Grana nunca calcula totales». Es una utilidad **pura** (sin DOM, sin estado, sin Vue) que tu aplicación llama, o no: tu servidor puede dar los mismos `Totals`. Se importa de la entrada, sin arrastrar Vue (`cartTotals` sola pesa 1 917 B gzip, con un tope de 2 048 B):

```js
import { cartTotals } from '@grana/blocks/ecommerce'

const mxn = (amount) => ({ amount, currency: 'MXN' })

const t = cartTotals(
  [
    { id: 'l1', product: { id: 'espadin', name: 'Mezcal espadín' }, quantity: 2, unitPrice: mxn(890) },
    { id: 'l2', product: { id: 'rebozo', name: 'Rebozo de algodón' }, quantity: 1, unitPrice: mxn(2400) },
    { id: 'l3', product: { id: 'plato', name: 'Plato de barro verde' }, quantity: 1, unitPrice: mxn(350), available: 'Ya no queda' }
  ],
  {
    currency: 'MXN',
    shipping: { label: 'Envío', amount: null, note: 'Se calcula con tu código postal' },
    taxes: [{ label: 'Incluye IVA', rate: 0.16, included: true }],
    goals: [{ id: 'envio-gratis', label: 'Envío gratis desde $3,000', target: mxn(3000) }],
    labels: { subtotal: 'Subtotal', total: (n) => `por ${n} ${n === 1 ? 'pieza' : 'piezas'}` }
  }
)
```

Con esos datos devuelve (`medido`, ejecutado el 2026-10-26): `t.total` = 4 180 MXN «por 3 piezas»; `t.count` 3; `t.byLine` `{ l1: 1 780, l2: 2 400 }`; `t.excluded` `['l3']` (no disponible: no entra en el total ni en la cuenta); `t.pending` `true` (el envío es `null`); `t.lines` con el subtotal, el envío «por calcular» con su nota y «Incluye IVA» de 576,55 MXN con `included: true` (se dice, no se suma); y `t.goals[0]` `{ reached: true, remaining: 0 }`. Un carrito que ya pasó el umbral del envío gratis y con el envío por calcular dice «Ya tienes el envío gratis» y, debajo, «Envío · Se calcula en el siguiente paso»: es lo que dicen los datos, no un defecto del bloque (EC-N2).

**Reglas.** (1) **Enteros escalados:** cada importe pasa a unidades menores con `currencyDigits` antes de operar; nunca se suma coma flotante. (2) **Entra una línea** disponible, con `quantity` entera mayor que 0 y precio en `currency`; su total es `CartLine.total` si tu aplicación lo dio (gana: descuentos por línea, precios por volumen) o `unitPrice × quantity`. (3) **Orden:** subtotal, descuentos en su orden (`percent` sobre el subtotal o `amount`; nunca por debajo de 0), envío, impuestos no incluidos y total; los impuestos incluidos se calculan como `base − base / (1 + rate)` para decirlos y **no se suman**. (4) **Redondeo** a la unidad menor, mitad hacia fuera de cero, **una vez por operación**. Una regla fiscal distinta (por línea, al par, impuestos sobre el envío) la aplica tu aplicación y pasa `amount`. (5) **`approximate` se contagia** al subtotal, a las líneas y al total. (6) **Nunca lanza:** con una moneda mal formada, todo a 0 y aviso.

**Avisos** (`[Grana cartTotals]`, una vez por motivo, solo en desarrollo): CT1 moneda inválida, CT2 línea de otra moneda o `quantity` no entera, CT3 descuentos mayores que el subtotal, CT4 impuesto sin `rate` ni `amount`, CT5 `percent` fuera de 0 a 100. **Lo que no hace:** convertir divisas, validar cupones, decidir existencias, calcular el envío ni decidir qué impuesto aplica.

### Pruebas, peso y límites medidos

`npm test -w @grana/blocks` pasa **1 463 pruebas en 40 archivos** (`medido`, 2026-10-26). Las compuertas del paquete (`bash packages/blocks/scripts/gates.sh`) pasan **40 de 40**, incluidas las de Ecommerce: la entrada y su `.d.ts` existen, sin `createApp` ni `__shared` ni clases internas ni `fetch`, `XMLHttpRequest` o `sendBeacon`, sin `describeQuery` (Ecommerce no carga Booking), ningún campo de tarjeta, y los topes de peso. **Pesos** (`medido` con `gzip -c`, 2026-10-26): `dist/ecommerce.js` **49 537 B de 51 200 B** (gzip, 2026-10-26) con sus trozos compartidos (`node scripts/measure-entry.mjs ecommerce`); el tope es de DECISIONS #932, no se vuelve a subir: con más, decide el usuario; una variante importada sola de 2 653 B (`GbTrust03`) a 9 195 B (`GbCheckout03`), con tope de **7 168 B** y excepción de **9 728 B** para `GbCheckout` (formulario por pasos, copia del motor de campos, pedido y hueco del pago; #941); `cartTotals` sola **1 917 B** de 2 048 B (`node scripts/measure-partial.mjs 7168 ecommerce GbCheckout=9728 +cartTotals=2048`). `dist/marketing.js` y `dist/booking.js` no crecen por Ecommerce: las compuertas lo vigilan. **Cifra de los `meta.json`:** el `bundle.measured` de los doce coincide con la medida de hoy (49 537 B la entrada; margen de 1 663 B).

### Recetas

- **La elección que viaja:** de la ficha al pedido con las mismas `ChosenOption` ([`GbOrderSummary/README.md`](./src/blocks/GbOrderSummary/README.md#la-elección-que-viaja)).
- **`cartTotals` o el servidor:** los mismos `Totals` pintan igual de los dos lados ([`GbOrderSummary/README.md`](./src/blocks/GbOrderSummary/README.md#carttotals-o-el-servidor)).
- **Abrir la vista rápida y volver a la tarjeta:** [`GbQuickView/README.md`](./src/blocks/GbQuickView/README.md#abrir-desde-una-tarjeta-y-volver-a-ella).
- **Dos promociones lado a lado:** dos `GbPromo02` en una rejilla de la aplicación ([`GbPromo/README.md`](./src/blocks/GbPromo/README.md#dos-promociones-lado-a-lado)).
- **Políticas de la tienda con `GbPolicies`:** el ancla que cita cada promesa ([`GbTrust/README.md`](./src/blocks/GbTrust/README.md#políticas-de-la-tienda-con-gbpolicies)).
- **Tu propia rejilla de tarjetas** y qué pasa con la última fila (EC-N1): [`GbProductCard/README.md`](./src/blocks/GbProductCard/README.md#tu-propia-rejilla-y-qué-hace-la-última-fila).

### Qué no hay todavía

Reservado (`design/contracts/blocks/_comun.md` §35 y §37): **dos columnas** (EC-L7, `GSplit`: la ficha con el panel al lado, el carrito con el resumen al lado, el pago con el pedido al lado; pendiente de la decisión del usuario), calificación con estrellas (M-L2), el nombre del producto como `h1` (EC-L1), `GProgress` como medidor (EC-L2), el anuncio del recuento al filtrar sin carga (EC-L3, `announce`), la muestra de color (EC-L4), políticas en una entrada común (EC-L5), el acuse «Copiado» en el sitio (EC-L6), `focus()` público en `GRadioGroup` (CK-L1), el renglón término-importe del desglose (EC-L2 de la auditoría, `data-g-receipt`), el rótulo corto de la cantidad (EC-L3 de la auditoría, `labels.quantityShort`), un muelle genérico y una columna pegada (BK-L1, BK-L2), lista de deseos, comparador, búsqueda con sugerencias (receta con `GCombobox`), mini carrito en la cabecera (receta con `GBadge` sobre el `GBtn` del carrito y `GbCart03`, cuando `GbCart` salga de `draft`), pago y pasarela (slot de la aplicación) y mapa de la tienda (`GEmbed`). Nada de eso se documenta como disponible. Los códigos `EC-L1` a `EC-L7` son los de `_comun.md` §37; la auditoría de coco reutiliza `EC-L1` a `EC-L3` para otros hallazgos (por eso los dos últimos de la lista llevan «de la auditoría»).

## Reglas de bloque estructural

Valen para todo bloque de Marketing y, ampliadas, de Booking y de Ecommerce (`design/contracts/blocks/_comun.md` §1 a §13, §15 y §27, `docs/contract/api.md` «Grana Blocks»):

1. **Una sola `interface Props` por sección** (#763): las tres variantes importan el mismo objeto `props` y el mismo `emits`. Una variante no añade props; lo que no usa lo ignora en silencio, también frente a lo que compone, para que los mismos datos no hagan avisar a ninguna.
2. **Sin CSS ni utilidades** (#763, #807): lo que falte de forma es un hallazgo para el contrato o para el componente, nunca CSS del bloque. Las únicas clases que escribe son las pistas `g-adapt-*` de `GAdaptiveLayout`.
3. **Solo API pública de `@grana/vue`** (#792): nunca `__shared`, clases internas ni el DOM de lo que compone.
4. **Acciones por posición:** como mucho dos; la primera es la principal. El dato no dice cuál manda.
5. **Eventos de intención:** `navigate` (clic primario sin modificadores, nunca con `external` ni con `tel:`, `mailto:` o `sms:`; `event.preventDefault()` deja la navegación a tu router) y `activate` (una acción sin `href`). `item` es el elemento de datos que lleva el enlace.
6. **Encabezados por anidación:** el título de la sección lo pone su `GSection`; lo de dentro baja un nivel (`useSectionLevel()`). El único `h1` de la página es el de `GbHero` (o el de tu cabecera).
7. **Nada se mueve solo:** el único movimiento es el de los componentes que compone, con su movimiento reducido.
8. **Textos en `labels`, sin valores por defecto.** Falta uno que el estado necesita: aviso `C5` en desarrollo.
9. **Raíz con `data-gb="<sección>-<nn>"`** (identifica el bloque para pruebas, no es un gancho de estilo) y `$attrs` (`class`, `id`, `aria-*`, `data-*`).
10. **Avisos de desarrollo** con prefijo `[Grana Gb<Sección><NN>]`, una vez por instancia y motivo. Los comunes son C1 (lista vacía), C2 (elemento sin campo obligatorio), C3 (`id` repetido), C4 (`Media` sin tamaño o sin `alt`), C5 (falta un texto de `labels`), C6 (`href` `javascript:`), C7 (más elementos de los recomendados) y C8 (más de dos acciones).

## Tipos

Un `.d.ts` por entrada, generado en `npm run build` desde los `*.meta.json` (contrato de tipos #443) y los tipos compartidos de `types/marketing.d.ts`, `types/booking.d.ts`, `types/ecommerce.d.ts` y `types/common.d.ts` (los de más de una familia: `Photo`, `PriceSpec`, `Totals`, `Reference`…, con los mismos nombres en Booking y Ecommerce). Cada sección tiene su `Gb<Sección>Props`, y las 27 variantes y el plugin `marketing` (las 33 y el plugin `booking`, y las 36 y el plugin `ecommerce` con `cartTotals`) amplían `GlobalComponents`. `dist/blocks.d.ts` (Gestión) sigue siendo mínimo. Los datos de marketing, de Booking y de Ecommerce son estrictos (sin `[key: string]: unknown`): un campo mal escrito falla al compilar.

## Playground

Un banco por sección con los bloques reales y el banco de datos de la sección (`src/blocks/Gb<Sección>/<seccion>.bank.js`), en `playground/marketing/<seccion>.html`, `playground/booking/<seccion>.html` (más `umbral.html`, la receta del héroe con la consulta) y `playground/ecommerce/<seccion>.html`. Desde la raíz del repositorio, con `@grana/vue` y este paquete construidos:

```bash
python3 -m http.server 4213
# http://localhost:4213/packages/blocks/playground/marketing/hero.html
# http://localhost:4213/packages/blocks/playground/booking/search.html
# http://localhost:4213/packages/blocks/playground/ecommerce/product-grid.html
```

Parámetros: `?tema=defecto|rustico|lujo` (los dos últimos son temas generados con `@grana/cli`), `?dark=1`, `?v=01|02|03` (una sola variante; el héroe la exige, una página tiene un `h1`), `?zoom=2` (texto al 200 %), `?anidado=1` (los bloques dentro de una `GSection`). El de Booking añade `?estado=<clave>` (un estado del banco: `busy`, `requested`, `mesa`...) y `?alto=1` (una página larga para el muelle de `GbSearch03`); Itinerary acepta `?hoy=1`. El de Ecommerce acepta `?estado=<clave>` del banco de la sección (Product grid: `carga`, `refresco`, `error`, `vacio`, `filtrado`; Order history: `cargando`, `error`, `vacio`; Reviews: `vacio`) y `?abierta=01|02|03` para abrir una vista rápida; monta una tarjeta por producto en Product card.

## Comandos

```bash
npm test -w @grana/blocks         # vitest: 1463 pruebas en 40 archivos (2026-10-26)
npm run build -w @grana/blocks    # vite build + tipos (scripts/build-types.mjs)
bash packages/blocks/scripts/gates.sh   # compuertas del paquete (tras el build); también las corre .github/scripts/gates.sh
```

Las compuertas (40 en 2026-10-26, todas superadas) vigilan que ningún bloque estructural lleve CSS, `<style>` ni utilidades, que `dist/marketing.js`, `dist/booking.js` y `dist/ecommerce.js` no incluyan Vue, `__shared` ni clases internas, que Gestión, Marketing, Booking y Ecommerce no se arrastren entre sí (Ecommerce no carga `describeQuery`; `cartTotals` solo vive en Ecommerce), que ningún bloque pinte un campo de tarjeta y los topes de peso.

## Peso

Medido con `gzip -c` (2026-10-23, `node scripts/measure-entry.mjs marketing` y `scripts/measure-partial.mjs`): `dist/marketing.js` **17 630 B** con su trozo compartido de `common/` y tope de **18 432 B** (DECISIONS #844); una variante importada sola, de 1265 B (`GbStats01`) a 3331 B (`GbFooter03`) entre las nueve secciones (tope **4096 B**). La cifra de la entrada sube respecto de las anotadas en los `meta.json` de Marketing el 2026-10-22 (17 446 B; `_comun.md` §19 ya cita 17 630 B). `dist/blocks.js` tiene su propio tope de 8 KiB (#793). `dist/ecommerce.js` pesa **49 537 B** con tope de **51 200 B** (#932; ver «Ecommerce»).

## Qué no hay todavía

Reservado (`design/contracts/blocks/_comun.md` §11): el nivel de encabezado propio de un acordeón en una sección (B-L4), la línea entre tarjetas planas (B-L6) y las secciones fuera del lote 2 (por ejemplo, `Member` para un bloque de equipo). Nada de eso se documenta como disponible.
