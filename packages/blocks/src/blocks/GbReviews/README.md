# GbReviews · GbReviews01, GbReviews02 y GbReviews03

Lo que opinan quienes compraron este producto: **la calificación en palabras con cuántas personas la sostienen, cómo se reparten (también los «1 de 5») y cada opinión entera, con su fecha, lo que compró y la respuesta de la tienda**. Sin estrellas: la distribución se lee como texto y sus barras son decorativas. Compone `GSection`, `GStack`, `GAdaptiveLayout`, `GCard`, `GMetric`, `GProgress` (decorativa), `GAvatar`, `GText`, `GBtn`, `GPagination` y `GEmpty`; no trae color, CSS ni textos propios, y no necesita ninguna entrada extra de `@grana/vue`.

**Etiquetas:** `<gb-reviews-01>`, `<gb-reviews-02>`, `<gb-reviews-03>` · **Estado:** `candidate` (ver «Verificación») · **Desde:** `0.0.0` (paquete privado, aún sin publicar) · **Entrada:** `@grana/blocks/ecommerce`

```js
import { GbReviews01, GbReviews02, GbReviews03 } from '@grana/blocks/ecommerce'
```

> `@grana/blocks` es privado (`0.0.0`) y no se publica con la beta `0.1.0` de `@grana/vue`. Por ahora se usa desde el repositorio (banco real en `packages/blocks/playground/ecommerce/reviews.html`). Exige `@grana/vue` (peer, `>=0.1.0-beta.0 <1.0.0`) y Vue `^3.5.0`; esta sección no compone ninguna entrada propia de `@grana/vue`. Reglas comunes e instalación: [`packages/blocks/README.md`](../../../README.md#ecommerce).

## Qué lo hace distinto

**La calificación se dice en palabras con cuántas la sostienen, y lo malo no se esconde** (DECISIONS #920, #912). «4,6 de 5 · 128 opiniones», sin estrellas que el lector no ve ni medias estrellas que nadie distingue; la distribución enseña también los «1 de 5» aunque sean pocos, y cada opinión dice qué compró quien la escribe («Talla M · Color Grana») y si su compra está verificada, que es lo que de verdad ayuda a elegir talla en el teléfono. Si la tienda respondió, la respuesta va junto a la opinión, no en otra página. **Ninguna opinión se recorta**: recortar cambia lo que dice. Sin opiniones, el bloque dice «Todavía sin opiniones», nunca «0 de 5». La forma visual con estrellas está reservada (M-L2); cuando llegue irá **junto** al texto, nunca en su lugar.

## Las tres variantes

Las tres reciben la misma `interface Props` (`GbReviewsProps`, el mismo objeto `props` de `props.js`). Lo que una variante no usa, lo ignora en silencio.

| Variante | Concepto | Compone | Ignora |
| --- | --- | --- | --- |
| `GbReviews01` | Lista con resumen: el resumen en una línea y, debajo, las opiniones una tras otra | `GSection` > `GStack gap="lg"` > `GMetric` + la acción + `GStack as="ul" divided` > `li` > la opinión + `GPagination` | `summary.distribution` |
| `GbReviews02` | Resumen y distribución: a un lado cuánto y cómo se reparte; al otro, las opiniones | `GSection` > `GAdaptiveLayout gap="lg"` > [`div class="g-adapt-short"` > `GMetric` + distribución + acción] + [`div class="g-adapt-wide"` > `GStack as="ul" divided` > opiniones + `GPagination`] | — |
| `GbReviews03` | Tarjetas: cada opinión en su tarjeta, en rejilla | `GSection` > `GStack gap="lg"` > `GMetric` + la acción + `GAdaptiveLayout role="list"` > `div role="listitem" class="g-adapt-wide"` > `GCard as="div" role="group"` (nombrada por el autor, con un `GAvatar` decorativo) con la opinión en el cuerpo + `GPagination` | `summary.distribution` |

**La opinión (común)** es la misma anatomía que `GbTestimonials`: una `figure` con la cita entera en `blockquote` (con `lang` si no es del idioma de la página) y un `figcaption` con el autor (y su lugar), la fecha en `<time datetime>`, si la compra está verificada y lo que compró. **La puntuación de cada opinión va en palabras antes de la cita** («5 de 5»): es lo primero que se busca y lo primero que se oye. Si viene de otro sitio (`source`), el `figcaption` lo cita con su enlace. **La respuesta de la tienda** (`reply`) va después de la `figure`, fuera de ella (no es parte de la cita), con su autor y su fecha.

**El resumen** es un `GMetric` (rótulo `labels.average`, el promedio con un decimal del idioma, unidad `labels.outOf` y contexto `labels.count`); con `count: 0` dice `labels.noReviews`. **La distribución** (01 y 03 la ignoran) es una lista de `max` a 1, **con todas las filas aunque cuenten 0**, cada una con su texto (`labels.row`: valor, cuenta y porcentaje con `Intl`) y una barra `GProgress` dentro de un `div aria-hidden`: una distribución no es un progreso, y `role="progressbar"` mentiría al lector (hallazgo EC-L2 de `_comun.md` §37). **Vacío:** `GEmpty` con `labels.noReviews` y la acción «Escribir una opinión».

## Recetas

### Opiniones del producto y lo que dicen de la tienda

`GbReviews` es para las opiniones **de un producto**: lleva calificación por opinión, fecha, compra verificada, lo que se compró, la respuesta de la tienda y la distribución. Lo que dicen de la tienda en general (sin producto) es [`GbTestimonials`](../GbTestimonials/README.md) de `@grana/blocks/marketing`, con su `source` obligatoria; comparten la anatomía de la cita pero no el dato.

### Paginar desde el servidor

El bloque no ordena ni pagina. Pasa la página actual (`reviews`), el `total` y el `pageSize`, y vuelve a pedir cuando llegue `update:page`:

```vue
<!-- Fragmento: `resena` (resumen y página), `pedirOpiniones` y `escribir` son de tu aplicación -->
<script setup>
import { ref } from 'vue'
import { GbReviews02 } from '@grana/blocks/ecommerce'
const page = ref(1)
</script>

<template>
  <GbReviews02 v-bind="resena" v-model:page="page" @update:page="pedirOpiniones" @navigate="escribir" />
</template>
```

## Uso

```vue
<!-- Fragmento: `escribir` es de tu aplicación -->
<script setup>
import { GbReviews01 } from '@grana/blocks/ecommerce'

const reseñas = {
  title: 'Opiniones',
  description: 'De quienes compraron este huipil.',
  summary: {
    average: 4.6, count: 128, // los da tu aplicación; el bloque no calcula el promedio
    distribution: [{ value: 5, count: 92 }, { value: 4, count: 21 }, { value: 3, count: 8 }, { value: 2, count: 3 }, { value: 1, count: 4 }]
  },
  reviews: [
    {
      id: 'r1', rating: 5, title: 'Igual que en la foto',
      quote: 'El bordado es todavía más bonito en persona.',
      author: { name: 'Mariana López', place: 'Monterrey' },
      date: '2026-10-12', verified: true,
      options: [{ key: 'talla', label: 'Talla', value: 'M' }, { key: 'color', label: 'Color', value: 'Grana' }]
    },
    {
      id: 'r3', rating: 2, quote: 'La talla G me quedó chica; tuve que cambiarla.',
      author: { name: 'Rocío Hernández', place: 'Puebla' }, date: '2026-09-02', verified: true,
      reply: { author: 'Barro y Agave', quote: 'Gracias por contarnos, Rocío. Ya ajustamos la tabla de medidas.', date: '2026-09-03' }
    }
  ],
  total: 128, page: 1, pageSize: 5,
  action: { label: 'Escribir una opinión', href: '/tienda/huipil/opinar' },
  locale: 'es-MX',
  labels: {
    average: 'Calificación media',
    outOf: 'de {max}',
    count: (n) => `${n} ${n === 1 ? 'opinión' : 'opiniones'}`,
    noReviews: 'Todavía sin opiniones',
    score: '{value} de {max}',
    row: (r) => `${r.value} de ${r.max}: ${r.countText} (${r.percent})`,
    distribution: 'Cómo se reparten',
    verified: 'Compra verificada',
    bought: 'Compró',
    reply: (autor) => `Respuesta de ${autor}`,
    pagination: { nav: 'Páginas de opiniones', previous: 'Página anterior', next: 'Página siguiente', page: 'Página {page}', range: 'Opiniones {from} a {to} de {total}', compact: 'Página {page} de {pages}' },
    external: 'se abre en otra pestaña'
  }
}
</script>

<template>
  <GbReviews01 v-bind="reseñas" @navigate="({ event, href }) => { event.preventDefault(); escribir(href) }" />
</template>
```

`distribution` solo lo pinta 02. `average` y `count` son datos: si tu promedio no coincide con la suma de la distribución, el bloque pinta lo dado y avisa RV2.

## Ejemplos

### e1 · Lista con el resumen arriba (`GbReviews01`)

**Por qué:** cuando la ficha de producto ya es larga y las opiniones van al final como una lectura: el promedio en una línea y cada opinión entera debajo, separadas por una línea.

```vue
<!-- Fragmento: `reseñas` es de tu aplicación -->
<GbReviews01 v-bind="reseñas" />
```

### e2 · Resumen y distribución (`GbReviews02`)

**Por qué:** cuando decidir depende de cómo se reparten las notas, no solo del promedio. A 1440 el resumen y la distribución van a un lado y las opiniones al otro; en estrecho, una columna. Las filas de la distribución se leen como texto aunque las barras no estén en el árbol de accesibilidad.

```vue
<!-- Fragmento: `reseñas` es de tu aplicación -->
<GbReviews02 v-bind="reseñas" />
```

### e3 · Cada opinión en su tarjeta (`GbReviews03`)

**Por qué:** cuando las opiniones son pocas y cortas y conviene verlas de un vistazo en rejilla. Cada tarjeta es un grupo nombrado por su autor y lleva el avatar decorativo.

```vue
<!-- Fragmento: `reseñas` es de tu aplicación -->
<GbReviews03 v-bind="reseñas" />
```

### e4 · Una opinión que viene de otro sitio, con su respuesta

**Por qué:** cuando la tienda recoge opiniones de Google y responde. `source` cita de dónde viene (con marca de externo si lo es) y `reply` va junto a la opinión con el nombre de la tienda, no en otra página.

```vue
<!-- Fragmento: `reseñas` es de tu aplicación -->
<GbReviews01 v-bind="{ ...reseñas, reviews: [{
  rating: 4, quote: 'Beautiful embroidery and a lovely, soft cotton.', lang: 'en',
  author: { name: 'Emily Carter', place: 'Portland' }, date: '2026-09-28',
  source: { label: 'Google', href: 'https://www.google.com/maps/place/barro-y-agave', external: true },
  reply: { author: 'Barro y Agave', quote: 'Thank you, Emily.' }
}] }" />
```

### e5 · Todavía sin opiniones

**Por qué:** cuando el producto es nuevo. Con `summary.count` en 0 (o sin `summary`) y sin `reviews`, el bloque dice «Todavía sin opiniones» y ofrece «Escribir una opinión»; nunca «0 de 5».

```vue
<!-- Fragmento: `reseñas` es de tu aplicación -->
<GbReviews01 v-bind="{ ...reseñas, summary: { average: 0, count: 0 }, reviews: [], total: 0 }" />
```

## Props

Una sola interfaz para las tres variantes (`GbReviewsProps`). Los tipos de datos salen de `@grana/blocks/ecommerce`.

| Prop | Tipo | Descripción |
| --- | --- | --- |
| `title` | `string` (requerida) | El título de la sección. |
| `description` | `string` | Descripción de la `GSection`; el slot `description` la sustituye. |
| `summary` | `ReviewSummary` | `average`, `max` (5), `count` y `distribution` de tu aplicación; `count: 0` = sin opiniones (`labels.noReviews`, nunca «0 de 5»). |
| `reviews` | `Review[]` (requerida) | La página (0 a 20; C7 por encima); cada cita entera, sin recortar. |
| `total` | `number` | Opiniones en total (paginación). |
| `page` | `number = 1` | `v-model:page`. |
| `pageSize` | `number` | Opiniones por página; con `total`, hay paginación. |
| `action` | `Action` | «Escribir una opinión» (secundaria, `outline`); sin opiniones, va en el slot `actions` de `GEmpty`. |
| `locale` | `string` | BCP 47; formatea el promedio, las cuentas y las fechas. |
| `labels` | `ReviewsLabels` (requerida) | `average`, `outOf`, `count`, `noReviews` y `score` obligatorios; `row` y `distribution` con `distribution`; `verified`, `bought`, `reply` y `external` con su dato; `pagination` a `GPagination`. |

## Eventos

| Evento | Carga | Cuándo |
| --- | --- | --- |
| `update:page` | `number` | `GPagination` |
| `navigate` | `{ event, href, item }` (`BlockNavigate<Action> \| BlockNavigate<Review>`) | La acción con `href` o la fuente interna de una opinión (§4) |
| `activate` | `{ event, item }` (`BlockActivate<Action>`) | La acción sin `href` |

## Slots

| Slot | Alcance | Qué va |
| --- | --- | --- |
| `quote` | `{ item: Review }` | Escape: contenido rico dentro del `blockquote` (como en `GbTestimonials`) |
| `description` | — | Sustituye a la prop `description` de la `GSection` |

## Textos (`labels`)

| Clave | Requerido |
| --- | --- |
| `average`, `outOf`, `count`, `noReviews`, `score` | Sí (C5) |
| `row`, `distribution` | Sí, con `summary.distribution` (C5). `row` recibe `{ value, max, count, countText, percent }` |
| `verified` | Sí, con alguna `verified: true` (C5) |
| `bought` | Sí, con alguna `options` (C5) |
| `reply` | Sí, con alguna `reply` (C5). Plantilla con `{author}` o función `(author) => string` |
| `pagination` | Los de `GPagination` (avisa él) |
| `external` | Sí, con una `source` externa (C5) |

## Teclado y foco

| Tecla | Efecto |
| --- | --- |
| `Tab` | Recorre la acción, los enlaces de `source` y la paginación; las opiniones no son controles |
| `Intro` | Sigue el enlace o activa la acción |

## Accesibilidad

Cifras de la auditoría de coco ([`design/lab/blocks/ecommerce/auditoria.md`](../../../../../design/lab/blocks/ecommerce/auditoria.md)), tres motores, tres temas, claro y oscuro (`medido`):

a. Cada opinión es una `figure` con `blockquote` (con `lang`) y `figcaption` con `time`; la respuesta de la tienda va fuera de la cita; las barras de la distribución están en `aria-hidden` (`prueba`; `medido`).
b. La calificación es texto: ningún `img`, icono ni `role="progressbar"` en el árbol de accesibilidad (`prueba`, Vitest).
c. Con el vacío dice «Todavía sin opiniones», nunca «0 de 5»; todas las filas de la distribución están, también las de 0 (`prueba`).
d. 02 deja el resumen y las opiniones en dos columnas a 1440 y en una a 390; las filas de la distribución no desbordan a 320 con el texto al 200 %.
e. Ningún `h1`; el título de la sección baja un nivel por anidación.

> **Peligro.** El bloque **no calcula** el promedio ni la distribución: `summary.average`, `summary.count` y `distribution` los da tu aplicación. Si no coinciden con la suma de `distribution`, el bloque pinta lo dado (y avisa RV2 en desarrollo), y la persona lee un promedio que no cuadra con las barras. Y cada opinión necesita `quote`, `author.name`, `date` y `rating` (C2); sin alguno, se omite.

## Personalidad

Nada se mueve: las opiniones no animan nada propio. La personalidad es de contenido (#920): la calificación en palabras, lo malo a la vista, lo que compró quien opina y la respuesta de la tienda junto a la opinión. Con movimiento reducido no cambia nada.

## Avisos de desarrollo

Prefijo `[Grana GbReviews<NN>]`, una vez por instancia y motivo, solo en desarrollo. Los comunes (C1 a C8, K3, K4, EC1 a EC7) están en [`packages/blocks/README.md`](../../../README.md#avisos-comunes-de-ecommerce). Los de esta sección: C1 (sin aviso si hay `summary` con `count: 0`: es el vacío), C2 (opinión sin `quote`, `author.name`, `date` o `rating`), C3, C5, C6, C7 (más de 20), EC2. Los propios:

| Código | Motivo | Qué pasa |
| --- | --- | --- |
| RV1 | `rating` de una opinión fuera de 1..`max` | No se pinta la puntuación |
| RV2 | `distribution` cuya suma no es `summary.count` | Se pinta lo dado; la barra usa `summary.count` como máximo |
| RV3 | Una cita de más de 1 200 caracteres | Se pinta entera |

## Banco de datos de ejemplo

`reviews.bank.js` exporta `{ props, slots, states }` con las opiniones del huipil: `summary` 4,6 de 5 con 128 opiniones y su distribución (5: 92, 4: 21, 3: 8, 2: 3, 1: 4); cinco opiniones (una con `title`, una en inglés con `lang="en"` y dos párrafos que viene de otro sitio con enlace externo, una de 2 de 5 con la respuesta de la tienda, una verificada con lo que compró —Talla M · Color Grana—, una mínima con la palabra larga de la prueba de 320 px); `total` 128, `pageSize` 5 y la acción «Escribir una opinión». `states.vacio` es el estado sin opiniones (`?estado=vacio`). Con él ninguna variante avisa. Banco real: `packages/blocks/playground/ecommerce/reviews.html`.

## Peso

`dist/ecommerce.js` pesa **49 328 B gzip** con sus trozos compartidos (`medido` con `node packages/blocks/scripts/measure-entry.mjs ecommerce`, 2026-10-26); tope de la entrada **51 200 B** (DECISIONS #932; no se vuelve a subir). Una variante importada sola (`node packages/blocks/scripts/measure-partial.mjs 7168 ecommerce GbCheckout=9728 +cartTotals=2048`): `GbReviews01` 5 310 B, `GbReviews02` 5 376 B, `GbReviews03` 5 407 B; tope por variante **7 168 B** (#932). `@grana/vue` es *peer*: lo paga la aplicación.

## Alcance

- **Sin estrellas** (M-L2, reservado): la forma visual irá junto al texto cuando llegue; el dato (`Rating`) no cambia.
- **Sin cálculo:** el promedio y las cuentas los da tu aplicación; el único cálculo del bloque es el porcentaje de cada fila de la distribución (de vista, #911).
- **La distribución como medidor** (EC-L2 de `_comun.md` §37, reservado): hoy `GProgress` es siempre un `progressbar`, así que sus barras van decorativas y el texto dice el dato; un `role="meter"` cambiaría la v1.
- **No escribe opiniones:** `action` emite `navigate` o `activate`; el formulario es de tu aplicación.
- **Sin recorte de la cita** (ni «Leer más»): una cita de más de 1 200 caracteres se pinta entera (RV3).
- **Sin CSS ni utilidades** (#763, #807).

## Verificación

| Qué | Resultado | Nivel |
| --- | --- | --- |
| Vitest de `GbReviews` (la puntuación y el resumen en texto con `Intl` en `es-MX` y `en-US`; ningún `img`, icono ni `progressbar` en el árbol; todas las filas de la distribución, también las de 0; el porcentaje redondeado; `reply` fuera de la `figure`; `time` con `datetime`; la cita entera; 03 con `role="group"` nombrado por el autor; avisos RV1 a RV3) | `npm test -w @grana/blocks` pasa **1 463 de 1 463** en 40 archivos (todo el paquete, 2026-10-26) | `prueba` |
| Auditoría de coco: 01, 02 y 03; la anatomía de cita con `lang`; vacío; 02 en dos columnas a 1440 | Familia: Chromium 3 248 de 3 275, Firefox 3 189 de 3 216 y WebKit 3 188 de 3 216 al auditar; 3 266 de 3 275 tras el remate de bruno (#945). Veredicto `candidate` | `medido` |

**No verificado:** lector de pantalla real (la puntuación antes de la cita, la distribución como lista); `forced-colors` real; teléfono real; rendimiento con el perfilador. **Pendientes abiertos:** M-L2 (estrellas) y EC-L2 de `_comun.md` §37 (`GProgress` como medidor), ambos reservados; los generales, en [`PENDIENTES.md`](../../../../../PENDIENTES.md).

## Fuentes

- Contrato: [`design/contracts/blocks/reviews.md`](../../../../../design/contracts/blocks/reviews.md), la anatomía de la cita en [`testimonials.md`](../../../../../design/contracts/blocks/testimonials.md) y [`_comun.md`](../../../../../design/contracts/blocks/_comun.md) (§26 a §39).
- Decisiones: #909 a #914, #912, #920, #932 en `DECISIONS.md`.
- Metadatos: [`GbReviews.meta.json`](./GbReviews.meta.json). Pruebas: [`GbReviews.test.js`](./GbReviews.test.js). Auditoría: [`design/lab/blocks/ecommerce/auditoria.md`](../../../../../design/lab/blocks/ecommerce/auditoria.md).
