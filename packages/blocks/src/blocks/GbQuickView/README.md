# GbQuickView · GbQuickView01, GbQuickView02 y GbQuickView03

Ver un producto y elegirlo **sin salir de la lista**: una superficie (`GDialog`) con lo esencial de la ficha (fotos, precio, opciones, cantidad y «Añadir») y un enlace a la ficha completa. Al cerrar, el foco vuelve a la tarjeta que la abrió y la elección queda en tu aplicación para la próxima vez. Compone `GDialog`, `GGallery` (`@grana/vue/gallery`), `GRadioGroup`, `GNumberField`, `GBtn`, `GPrice` y `GPriceScope` (`@grana/vue/price`), `GText`, `GCard` y `GStack`; no trae color, CSS ni textos propios.

**Etiquetas:** `<gb-quick-view-01>`, `<gb-quick-view-02>`, `<gb-quick-view-03>` · **Estado:** `candidate` (ver «Verificación») · **Desde:** `0.0.0` (paquete privado, aún sin publicar) · **Entrada:** `@grana/blocks/ecommerce`

```js
import { GbQuickView01, GbQuickView02, GbQuickView03 } from '@grana/blocks/ecommerce'
```

> `@grana/blocks` es privado (`0.0.0`) y no se publica con la beta `0.1.0` de `@grana/vue`. Por ahora se usa desde el repositorio (banco real en `packages/blocks/playground/ecommerce/quick-view.html`). Exige `@grana/vue` (peer, `>=0.1.0-beta.0 <1.0.0`) y Vue `^3.5.0`. Además de `@grana/vue`, la aplicación carga las entradas que esta sección compone: `@grana/vue/price` y `@grana/vue/gallery`. Reglas comunes e instalación: [`packages/blocks/README.md`](../../../README.md#ecommerce).

## Qué lo hace distinto

**Mirar no te saca de la lista, y cerrar te devuelve a donde estabas** (DECISIONS #919). El foco vuelve a la tarjeta exacta que abriste (no al principio de la rejilla), y lo que elegiste queda en tu aplicación (`v-model:selection`) para cuando vuelvas a abrirla: la talla no se pierde por haber cerrado para comparar. En el teléfono la hoja sube desde abajo, al alcance del pulgar, y «Elegir y añadir» (03) pide solo lo que falta para añadir, sin repetir la ficha que ya viste en la tarjeta. **Nunca a ciegas:** «Añadir» sin una opción obligatoria no emite, dice qué falta y lleva el foco a esa pregunta.

## Las tres variantes

Las tres reciben la misma `interface Props` (`GbQuickViewProps`, el mismo objeto `props` de `props.js`): los mismos datos de la ficha (`ProductDetail`) que [`GbProductOverview`](../../../../../design/contracts/blocks/product-overview.md), más `open`, `from` y tres textos. Lo que una variante no usa, lo ignora en silencio.

| Variante | Concepto | Compone | Ignora |
| --- | --- | --- | --- |
| `GbQuickView01` | Diálogo: centrado en escritorio y hoja inferior en el teléfono, con las fotos en tira y el panel | `GDialog size="lg" mobile="sheet"` > `GStack gap="md"` > `GGallery appearance="strip"` + el panel + la ficha completa | — |
| `GbQuickView02` | Hoja lateral: una hoja al borde final que deja ver la lista detrás; pantalla completa en el teléfono | `GDialog placement="end" size="md" mobile="fullscreen"` > `GStack gap="md"` > `GGallery` (cuadrícula) + el panel + la ficha completa | — |
| `GbQuickView03` | Elegir y añadir: solo lo que hace falta para añadir | `GDialog size="sm" mobile="sheet"` > `GStack gap="md"` > `GCard level="flat"` con la portada pequeña (que sigue a la elección), `maker` y precio + el panel sin `maker` ni precio + la ficha completa | `labels.photos`, `labels.gallery` y las fotos más allá de la primera |

**03 es el destino de «Elegir opciones»** de la tarjeta compacta ([`GbProductCard03`](../GbProductCard/README.md)): quien ya vio el producto en la lista solo necesita elegir la talla.

**La superficie.** La raíz del bloque es el `GDialog`, con `title` = `product.name`, `closeLabel` = `labels.close`, `from` y `labels.dialog`. El foco al abrir, atrapado, `Esc`, el fondo y la devolución del foco al disparador son de `GDialog`. El título del diálogo es su encabezado; lo de dentro (la galería) va un nivel por debajo. **No cierra sola tras «Añadir»:** tu aplicación sabe si añadió; cierra con `open = false` y da su acuse (por ejemplo con `GToast`), o la deja abierta con el error. Mientras, `busy`.

**El panel** es el de Product overview, sin el texto largo (la descripción, la ficha técnica y los apartados quedan en la ficha completa), en este orden: `maker` y calificación en palabras; el precio de la **variante resuelta** (o el del producto); una pregunta por opción (`GRadioGroup` chip, **sin `name`**: la pregunta no se envía y un `name` legible juntaría los radios de dos bloques de la página, #934); la cantidad (`GNumberField`, con `max` de la variante) y «Añadir». **Nada viene preelegido** (elegir la talla es de la persona). Un valor sin existencias para la elección actual queda deshabilitado y su nombre lo dice («G, agotada»): se ve y se oye, no se esconde. **La foto sigue a la elección:** al elegir un valor con `photo`, la galería (o la portada en 03) pasa a esa foto sin mover el foco.

## Recetas

### Abrir desde una tarjeta y volver a ella

`GbProductCard03` emite `open { event, product }`; tu aplicación guarda el disparador y abre la vista rápida. `event.currentTarget` solo vale dentro del manejador, así que se guarda en el acto:

```vue
<!-- Fragmento: `detalles` (producto por id, con fotos, opciones y variantes), `productos`, `labels` y `agregar` son de tu aplicación -->
<script setup>
import { ref } from 'vue'
import { GbProductCard03, GbQuickView01 } from '@grana/blocks/ecommerce'

const abierta = ref(false)
const disparador = ref(null)
const producto = ref(null)
const seleccion = ref({})
const cantidad = ref(1)

function abrir({ event, product }) {
  disparador.value = event.currentTarget // el foco vuelve aquí al cerrar
  producto.value = detalles[product.id]
  abierta.value = true
}
</script>

<template>
  <GbProductCard03 v-for="p in productos" :key="p.id" :product="p" :labels="labels.card" @open="abrir" />

  <GbQuickView01
    v-if="producto"
    v-model:open="abierta"
    v-model:selection="seleccion"
    v-model:quantity="cantidad"
    :product="producto"
    :from="disparador"
    :prices="{ currency: 'MXN', taxes: 'IVA incluido' }"
    :labels="labels.quickView"
    @add="agregar"
  />
</template>
```

Sin `from` y sin un disparador previo enfocado, el bloque avisa QV1 y el foco vuelve a donde `GDialog` decida.

### Cerrar cuando se añadió

```js
async function agregar({ product, variant, quantity }) {
  await carrito.add(variant?.id ?? product.id, quantity) // tu aplicación
  abierta.value = false                                  // tú cierras; el bloque no lo hace
}
```

## Uso

```vue
<!-- Fragmento: `fotos`, `abierta`, `disparador` y `agregar` son de tu aplicación -->
<script setup>
import { GbQuickView03 } from '@grana/blocks/ecommerce'

const mxn = (amount) => ({ amount, currency: 'MXN' })

const huipil = {
  id: 'huipil-san-antonino',
  name: 'Huipil bordado de San Antonino',
  maker: 'Taller Mendoza · San Antonino Castillo Velasco',
  href: '/tienda/huipil-bordado-de-san-antonino',
  photos: fotos,
  price: { value: mxn(3200), lead: 'desde' },
  options: [
    { key: 'talla', label: 'Talla', values: [{ value: 'm', label: 'M' }, { value: 'g', label: 'G' }] }
  ],
  variants: [
    { id: 'huipil-m', options: { talla: 'm' }, max: 3 },
    { id: 'huipil-g', options: { talla: 'g' }, available: false }
  ]
}

const labels = {
  add: 'Añadir al carrito', busy: 'Añadiendo…',
  quantity: 'Cantidad', decrement: 'Quitar una', increment: 'Añadir una',
  choose: (option) => `Elige ${option}`,
  unavailable: 'No disponible', unavailableValue: (v) => `${v}, agotada`,
  photos: 'Fotos del huipil',
  price: { onRequest: 'Precio a consultar', before: 'Antes', legend: 'Precios en {name} ({code})' },
  close: 'Cerrar', full: 'Ver la ficha completa'
}
</script>

<template>
  <GbQuickView03 v-model:open="abierta" :product="huipil" :from="disparador" :prices="{ currency: 'MXN' }" :labels="labels" @add="agregar" />
</template>
```

La aplicación carga además `@grana/vue/price` (el precio) y `@grana/vue/gallery` (la galería de 01 y 02), y registra los iconos Lucide que use (`createIcons`).

## Ejemplos

### e1 · La vista rápida como diálogo (`GbQuickView01`)

**Por qué:** cuando la lista es una rejilla de escritorio y quien compra quiere ver las fotos grandes antes de elegir. En el teléfono es una hoja inferior, al alcance del pulgar.

```vue
<!-- Fragmento: `producto`, `abierta`, `disparador`, `labels` y `agregar` son de tu aplicación -->
<GbQuickView01 v-model:open="abierta" :product="producto" :from="disparador" :labels="labels" @add="agregar" />
```

### e2 · Una hoja lateral que deja ver la lista (`GbQuickView02`)

**Por qué:** cuando comparar importa: la hoja se abre al borde final y la lista sigue a la vista, así que la persona puede mirar otra tarjeta sin perder dónde estaba. En el teléfono ocupa la pantalla completa.

```vue
<!-- Fragmento: `producto`, `abierta`, `disparador`, `labels` y `agregar` son de tu aplicación -->
<GbQuickView02 v-model:open="abierta" :product="producto" :from="disparador" :labels="labels" @add="agregar" />
```

### e3 · «Elegir opciones» desde la tarjeta compacta (`GbQuickView03`)

**Por qué:** cuando la persona ya vio el producto en la lista y solo le falta la talla. Sin galería: la portada pequeña cambia con el color elegido, y el bloque pide solo opciones, cantidad y «Añadir».

```vue
<!-- Fragmento: `producto`, `abierta`, `disparador`, `labels` y `agregar` son de tu aplicación -->
<GbQuickView03 v-model:open="abierta" :product="producto" :from="disparador" :labels="labels" @add="agregar" />
```

### e4 · La talla que no se pierde

**Por qué:** cuando alguien elige la talla, cierra para comparar con otra tarjeta y vuelve. `v-model:selection` deja la elección en tu aplicación; al reabrir, la talla sigue elegida.

```vue
<!-- Fragmento: `seleccion` (un `ref({})`) y `producto` son de tu aplicación -->
<GbQuickView01 v-model:open="abierta" v-model:selection="seleccion" :product="producto" :labels="labels" />
```

## Props

Una sola interfaz para las tres variantes (`GbQuickViewProps`). Los tipos de datos salen de `@grana/blocks/ecommerce`.

| Prop | Tipo | Descripción |
| --- | --- | --- |
| `product` | `ProductDetail` (requerida) | `name` es el título del diálogo; `href` da la ficha completa. |
| `open` | `boolean` | `v-model:open`; lo pone tu aplicación por un gesto. Sin `v-model`, el bloque guarda su copia (Esc y cerrar la ponen en `false`). |
| `from` | `DialogFrom \| null` | El disparador, tal cual a `from` de `GDialog` (#583): el foco vuelve a él al cerrar; tu aplicación lo toma de `open { event }` (`event.currentTarget`). Sin él y sin un disparador enfocado, QV1. |
| `selection` | `Selection` | `v-model:selection`: la elección queda en tu aplicación para la próxima vez (#919). |
| `quantity` | `number = 1` | `v-model:quantity`. |
| `prices` | `PriceRegion` | Un `GPriceScope` alrededor del precio. |
| `busy` | `boolean = false` | Añadiendo: «Añadir» con `loading`; el bloque no cierra solo. |
| `locale` | `string` | BCP 47; sin él, el `lang` del ancestro al montar. |
| `labels` | `QuickViewLabels` (requerida) | Los de Product overview (`OverviewLabels`) más `close` (obligatorio), `full` (con `product.href`) y `dialog` (a `GDialog`, tal cual). |

## Eventos

| Evento | Carga | Cuándo |
| --- | --- | --- |
| `update:open` | `boolean` | Cerrar (botón, `Esc` o fondo: `GDialog`) |
| `add` | `{ event, product, variant, selection, options, quantity }` (`ProductAdd`) | «Añadir» válido, con todo lo obligatorio elegido y la variante disponible; no cierra |
| `select` | `{ event, product, key, value, variant }` (`OptionSelect`) | Se elige un valor (informativo: la elección ya está en `v-model:selection`) |
| `update:selection` | `Record<string, string \| number>` (objeto nuevo) | Cada elección |
| `update:quantity` | `number` | La cantidad cambia |
| `navigate` | `{ event, href, item }` (`BlockNavigate<Product> \| BlockNavigate<ProductReviewsLink>`) | La ficha completa (`item` = `product`; con `preventDefault()` tu aplicación cierra y navega con su router) o el enlace a las opiniones |

`options` de `add` son las `ChosenOption` en el orden de `product.options`: `{ key, label, value }`, ya dichas («Talla» · «M»). Son las mismas con las que viajan después al carrito, al pedido y al historial.

## Slots

| Slot | Alcance | Qué va |
| --- | --- | --- |
| `panel` | `{ product: ProductDetail, variant: Variant \| null }` | Escape: contenido al final del panel (por ejemplo «Envío a tu código postal» de tu aplicación) |

## Textos (`labels`)

| Clave | Requerido |
| --- | --- |
| `add`, `quantity`, `decrement`, `increment`, `choose`, `photos` | Sí (C5); `photos` no se usa en 03 |
| `close` | Sí (C5): nombra el botón de cerrar |
| `full` | Sí, con `product.href` (C5; sin él, sin enlace) |
| `busy` | Sí, con `busy` (C5) |
| `unavailable` | Sí, con `available: false` sin motivo (C5) |
| `unavailableValue` | Sí, con algún valor sin existencias (C5; sin él, solo `disabled`) |
| `facts`, `details`, `tabs` | Los de la ficha completa; el panel de la vista rápida no los pinta |
| `rating`, `noReviews`, `reviews` | Sí, con `rating` o `product.reviews` (C5) |
| `dialog`, `gallery`, `price` | Los de cada componente (avisan ellos) |

## Teclado y foco

| Tecla | Efecto |
| --- | --- |
| `Tab` | Recorre el diálogo con el foco atrapado: fotos, preguntas, cantidad, «Añadir», ficha completa y cerrar |
| `Esc` | Cierra y devuelve el foco al disparador (`from`) |
| `Flechas` | Dentro de cada pregunta, mueven la elección (radios de `GRadioGroup`) |
| `Intro` en «Añadir» | Con todo elegido emite `add`; con una opción sin elegir no emite y lleva el foco a esa pregunta |

El foco inicial es el primer control del contenido (regla de `GDialog`, #292): con el banco, en 03 es el enlace «Leer las opiniones» (`manual`, comprobado en el sitio el 2026-10-26; el contrato de la sección espera la primera pregunta sin responder, ver «Verificación»). Al cerrar con `Esc`, el foco vuelve al botón disparador (`manual`, mismo día).

## Accesibilidad

Cifras de la auditoría de coco ([`design/lab/blocks/ecommerce/auditoria.md`](../../../../../design/lab/blocks/ecommerce/auditoria.md)), tres motores, tres temas, claro y oscuro (`medido`):

a. La raíz es un `dialog` con el nombre del producto; `Esc` cierra y el foco vuelve a la tarjeta que lo abrió (`medido`).
b. «Nunca a ciegas» (01 y 03): «Añadir» sin talla no emite y lleva el foco a la pregunta, con el error con contraste de al menos 4,5:1.
c. 01 se abre como hoja inferior y 02 como pantalla completa a 390; 03 a 390 × 844 deja visible «Añadir» sin tapar el campo enfocado (2.4.11).
d. Movimiento: abre en 160 ms (escala y desplazamiento); con movimiento reducido solo hay fundido (rúbrica de movimiento: cumple propósito, comodidad, estabilidad, interrupción, control y accesibilidad).
e. Con dos paneles del mismo producto en la página (la ficha y la vista rápida), elegir en uno no desmarca el otro (`prueba`, #934).
f. Sin desplazamiento horizontal a 1440, 390, 320 ni a 320 con el texto al 200 %.

> **Peligro.** El bloque no cierra solo tras «Añadir»: si tu aplicación escucha `add` y no pone `open` en `false`, la persona pulsa «Añadir» y la vista rápida se queda igual, sin acuse. Y sin `from` (o con un `event.currentTarget` leído tarde, fuera del manejador), el foco no vuelve a la tarjeta que abrió la vista: guárdalo en el mismo manejador de `open`.

## Personalidad

La vista rápida llega desde el borde de su variante y se va por donde vino, con las animaciones de `GDialog` (160 ms, escala y desplazamiento); con `prefers-reduced-motion` solo hay fundido, sin desplazamiento ni escala. Lo que la hace distinta no es el movimiento sino la devolución: el foco vuelve a la tarjeta exacta y la elección queda en tu aplicación (#919).

## Avisos de desarrollo

Prefijo `[Grana GbQuickView<NN>]`, una vez por instancia y motivo, solo en desarrollo. Los comunes (C1 a C8, K3, K4, EC1 a EC7) están en [`packages/blocks/README.md`](../../../README.md#avisos-comunes-de-ecommerce). Los de esta sección: C5, K3, K4, EC2, EC4 y los de Product overview (PO2 y PO3). El propio:

| Código | Motivo | Qué pasa |
| --- | --- | --- |
| QV1 | `open` sin `from` y sin un disparador previo enfocado | El foco vuelve a donde `GDialog` decida (una vez por instancia) |

## Banco de datos de ejemplo

`quick-view.bank.js` exporta `{ props, slots }` con el banco de Product overview: el Huipil bordado de San Antonino con nueve fotos agrupadas, opciones Talla (CH, M, G, EG) y Color (Natural, Grana, con foto por color), seis variantes con `max` y una agotada (G Natural), `rating`, `reviews` y `note`; más `open: true` (abierta, para las pruebas y para `?estado=abierta`), `from: 'qv-disparador'`, `prices` MXN y `labels` con `close` y `full`. El playground monta un disparador por variante y abre con `open { event }`. Con él ninguna variante avisa. Banco real: `packages/blocks/playground/ecommerce/quick-view.html` (`?abierta=01|02|03`).

## Peso

`dist/ecommerce.js` pesa **49 557 B gzip** con sus trozos compartidos (`medido` con `node packages/blocks/scripts/measure-entry.mjs ecommerce`, 2026-10-28); tope de la entrada **51 200 B** (DECISIONS #932; no se vuelve a subir). Una variante importada sola (`node packages/blocks/scripts/measure-partial.mjs 7168 ecommerce GbCheckout=9728 +cartTotals=2048`): `GbQuickView01` 5 582 B, `GbQuickView02` 5 614 B, `GbQuickView03` 5 829 B; tope por variante **7 168 B** (#932). `@grana/vue` y sus entradas son *peer*: las paga la aplicación.

## Alcance

- **Ni cierra ni añade por su cuenta:** `add` te da el producto, la variante y la elección; tu aplicación llama a su carrito, cierra y da su acuse (#911, #919).
- **No lleva el texto largo:** la descripción, la ficha técnica y los apartados son de la ficha completa (`full`).
- **Se abre por un gesto:** `open` lo pone tu aplicación; el bloque nunca se abre solo.
- **Comparte el panel con Product overview** ([`GbProductOverview/README.md`](../GbProductOverview/README.md), `candidate` desde que su 01 lleva el panel al lado de las fotos con `GSplit`, #950); Quick view no tiene dos columnas.
- **Sin muestra de color** (EC-L4, reservado): una opción de color se dice con su nombre y, si la opción trae `photo`, con la foto real.
- **Sin CSS ni utilidades** (#763, #807).

## Verificación

| Qué | Resultado | Nivel |
| --- | --- | --- |
| Vitest de `GbQuickView` (las tres con el mismo banco sin avisos; `add` y `select` con las cargas exactas; sin cierre automático tras `add`; el panel es el de Product overview; 03 sin `GGallery` y con la portada que sigue al color; dos paneles del mismo producto no comparten grupo de radios) | `npm test -w @grana/blocks` pasa **1 463 de 1 463** en 40 archivos (todo el paquete, 2026-10-26) | `prueba` |
| Auditoría de coco: 01, 02 y 03 con `?abierta=NN`; `Esc` cierra y el foco vuelve a la tarjeta; hoja inferior y pantalla completa a 390; rúbrica de movimiento | Familia: Chromium 3 248 de 3 275, Firefox 3 189 de 3 216 y WebKit 3 188 de 3 216 al auditar; 3 266 de 3 275 tras el remate de bruno (#945). Veredicto `candidate` | `medido` |

**No verificado:** lector de pantalla real (el anuncio del diálogo, las preguntas y el error); `forced-colors` real y en Firefox y WebKit; teléfono real, puntero grueso y la hoja inferior con el pulgar; rendimiento con el perfilador. **Pendientes abiertos:** el foco inicial (el contrato `quick-view.md` dice «la primera pregunta sin responder»; con el banco cae en el enlace «Leer las opiniones» del panel, que es el primer control; derivado a lima o a bruno para alinear contrato y comportamiento); EC-L4 (muestra de color); los generales, en [`PENDIENTES.md`](../../../../../PENDIENTES.md).

## Fuentes

- Contrato: [`design/contracts/blocks/quick-view.md`](../../../../../design/contracts/blocks/quick-view.md), el panel en [`product-overview.md`](../../../../../design/contracts/blocks/product-overview.md) y [`_comun.md`](../../../../../design/contracts/blocks/_comun.md) (§26 a §39).
- Decisiones: #909 a #914, #918, #919, #932, #934, #936 en `DECISIONS.md`.
- Metadatos: [`GbQuickView.meta.json`](./GbQuickView.meta.json). Pruebas: [`GbQuickView.test.js`](./GbQuickView.test.js). Auditoría: [`design/lab/blocks/ecommerce/auditoria.md`](../../../../../design/lab/blocks/ecommerce/auditoria.md).
