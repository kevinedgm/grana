# GbProductOverview · GbProductOverview01, GbProductOverview02 y GbProductOverview03

La ficha de un producto: **las fotos, lo que cuesta la combinación que eliges, si queda y el botón que la añade**; luego la descripción, la ficha técnica y los apartados. El bloque resuelve qué variante corresponde a lo elegido (es vista) y emite la intención de añadir; no reserva existencias ni añade nada al carrito. Compone `GSection`, `GStack`, `GSplit`, `GGallery` (`@grana/vue/gallery`), `GRadioGroup`, `GNumberField`, `GBtn`, `GPrice` y `GPriceScope` (`@grana/vue/price`), `GTabs`, `GAccordion` y `GText`; no trae color, CSS ni textos propios.

**Etiquetas:** `<gb-product-overview-01>`, `<gb-product-overview-02>`, `<gb-product-overview-03>` · **Estado:** `candidate` (ver «Verificación») · **Desde:** `0.0.0` (paquete privado, aún sin publicar) · **Entrada:** `@grana/blocks/ecommerce`

```js
import { GbProductOverview01, GbProductOverview02, GbProductOverview03 } from '@grana/blocks/ecommerce'
```

> `@grana/blocks` es privado (`0.0.0`) y no se publica con la beta `0.1.0` de `@grana/vue`. Por ahora se usa desde el repositorio (banco real en `packages/blocks/playground/ecommerce/product-overview.html`). Exige `@grana/vue` (peer, `>=0.1.0-beta.0 <1.0.0`) y Vue `^3.5.0`. Además de `@grana/vue`, la aplicación carga las entradas que esta sección compone: `@grana/vue/price` y `@grana/vue/gallery`. Reglas comunes e instalación: [`packages/blocks/README.md`](../../../README.md#ecommerce).

## Qué lo hace distinto

**La foto enseña lo que elegiste y el botón nunca añade a ciegas** (DECISIONS #918). Al tocar «Grana», la galería pasa a la foto del huipil grana y el precio y las existencias son los de esa combinación; una talla agotada se queda a la vista con «agotada» en su nombre en lugar de desaparecer o de dejarte elegirla para fallar en el carrito. Nada viene preelegido por la tienda (la talla es tuya), y si pulsas «Añadir» sin talla, el botón no finge: te lleva a la pregunta que falta y la dice. Todo con los mismos datos en las tres formas.

## Las tres variantes

Las tres reciben la misma `interface Props` (`GbProductOverviewProps`, el mismo objeto `props` de `props.js`; la vista rápida de [`GbQuickView`](../GbQuickView/README.md) comparte el panel). Lo que una variante no usa, lo ignora en silencio.

| Variante | Concepto | Compone | Ignora |
| --- | --- | --- | --- |
| `GbProductOverview01` | Galería + panel: las fotos y, **al lado** cuando caben, lo que eliges y el botón; debajo, el texto plegado | `GSection` > `GStack gap="lg"` > `GSplit ratio="1:1" collapse="lg" gap="lg"` > [`#start`: `GGallery` en cuadrícula] + [`#end`: el panel] + `GAccordion` (descripción, ficha y un elemento por apartado) | `labels.tabs` |
| `GbProductOverview02` | Galería arriba: una columna, las fotos, luego el panel y el texto plegado (el teléfono primero) | `GSection` > `GStack gap="lg"` > `GGallery` (cuadrícula) + el panel + `GAccordion` como 01 | `labels.tabs` |
| `GbProductOverview03` | Tira + pestañas: la foto grande en una tira, el panel y el texto en pestañas | `GSection` > `GStack gap="lg"` > `GGallery appearance="strip"` + el panel + `GTabs` (descripción, ficha y una pestaña por apartado; contenido en el slot `panel-{id}`) | — |

**01 en dos columnas con `GSplit`** (DECISIONS #950, que cierra EC-L7 y PO-L1): `ratio="1:1" collapse="lg" gap="lg"` pone el panel al lado de las fotos **cuando cada lado cabe en 384 px** y debajo cuando no. Con el tema por defecto, la pareja va al lado a partir de **816 px de caja** (`384 × 2 + 48`): a 1440 son 488 · 488 y a 1024 son 447 · 447; a 768, 390, 320 y con el texto al 200 % queda **apilada**, con el panel a todo el ancho (con `collapse="md"` habría quedado al lado a 329 · 329 en la tablet; se eligió `lg` a propósito). El orden del DOM no cambia nunca: fotos, panel, texto (1.3.2), también apilado. Sin fotos, la región de las fotos no se pinta y el panel ocupa todo el ancho. El umbral crece con el cuerpo de texto del tema ([`GSplit/README.md`](../../../../vue/src/components/GSplit/README.md#cuándo-va-al-lado)). **Sin columna pegada:** el panel no se queda fijo al desplazar (BK-L1, `sticky` de `GSplit` reservado, #951); con una galería larga, «Añadir» sube con la página.

**El panel (común), en este orden del DOM:**

1. El `maker` y la calificación en palabras («4,6 de 5 · 128 opiniones»), con un enlace a las opiniones si hay `product.reviews`.
2. **El precio de la variante resuelta** (o el del producto, que suele llevar «desde») con `GPrice size="lg"` dentro de un `GPriceScope` si hay `prices`.
3. **Una pregunta por opción:** un `GRadioGroup appearance="chip"` por opción, **sin `name`** (la pregunta no se envía y un `name` legible juntaría los radios de dos bloques de la misma página, #934). Un valor sin existencias para la elección actual de las demás opciones queda `disabled` y su nombre lo dice (`labels.unavailableValue`: «G, agotada»).
4. **La cantidad:** `GNumberField` con `min` 1 y `max` de la variante.
5. **«Añadir»:** `GBtn solid block`. Con todo lo obligatorio elegido y la variante disponible emite `add`; con una opción obligatoria sin elegir **no emite**: esa pregunta recibe su error y el foco va a su primer radio. Si el producto o la combinación no se pueden pedir, no hay botón y el motivo sale en texto.
6. La `note` («Hecho a mano: cada pieza cambia un poco»).

**Resolver la variante.** Es la `Variant` cuyas `options` coinciden **exactamente** con la elección en todas las claves; con alguna sin elegir no hay ninguna y el precio es el del producto. **La foto sigue a la elección** sin mover el foco: al elegir un valor con `photo` (o una combinación con `Variant.photo`), la galería pasa a esa foto, y no se desplaza sola a la vista. El texto largo: `description` en `GText as="div"` (párrafos), `facts` en una lista de términos y definiciones nombrada con `labels.facts`, y `sections` con título, texto e `items`.

## Recetas

### Escuchar `add` y dejar la elección en tu aplicación

`v-model:selection` y `v-model:quantity` son opcionales: sin ellos el bloque guarda su copia. Con ellos, la talla y el color viven en tu aplicación y no se pierden si cierras y vuelves. `add` llega con la `Variant` resuelta y las `ChosenOption` ya dichas, las mismas que viajarán al carrito y al pedido ([«La elección que viaja»](../GbOrderSummary/README.md#la-elección-que-viaja)).

```vue
<!-- Fragmento: `ficha`, `precios`, `etiquetas`, `carrito` y `abrirOpiniones` son de tu aplicación -->
<script setup>
import { ref } from 'vue'
import { GbProductOverview01 } from '@grana/blocks/ecommerce'

const eleccion = ref({})
const cantidad = ref(1)
const anadiendo = ref(false)

async function anadir({ product, variant, options, quantity }) {
  anadiendo.value = true
  try {
    await carrito.add({ productId: product.id, variantId: variant?.id, options, quantity })
  } finally {
    anadiendo.value = false
  }
}
</script>

<template>
  <GbProductOverview01 :product="ficha" :prices="precios" :labels="etiquetas" :busy="anadiendo"
    v-model:selection="eleccion" v-model:quantity="cantidad"
    @add="anadir" @navigate="({ event, href }) => { event.preventDefault(); abrirOpiniones(href) }" />
</template>
```

### Un escape para lo que es de tu aplicación

El slot `panel` pone contenido al final del panel («Envío a tu código postal»); `section-{id}` sustituye el contenido de un apartado; `description` la descripción rica. El bloque no lee lo que pongas ahí.

## Uso

Los datos y textos comunes de la tienda (`precios`, `priceLabels`) están en [«Datos comunes de una tienda»](../../../README.md#datos-comunes-de-una-tienda).

```vue
<!-- Fragmento: `fotoDeFrente`, `fotoGrana`, `precios`, `priceLabels` y `anadirAlCarrito` son de tu aplicación -->
<script setup>
import { GbProductOverview01 } from '@grana/blocks/ecommerce'

const mxn = (amount) => ({ amount, currency: 'MXN' })

const ficha = {
  id: 'huipil',
  name: 'Huipil bordado de San Antonino',
  maker: 'Taller Mendoza',
  summary: 'Tres semanas de bordado a mano sobre manta de algodón.',
  price: { value: mxn(3200), lead: 'desde' },
  photos: [
    { id: 'h1', src: fotoDeFrente, width: 1200, height: 1500, alt: 'Huipil natural con flores bordadas, de frente' },
    { id: 'h2', src: fotoGrana, width: 1200, height: 1500, alt: 'Huipil teñido con grana cochinilla, de frente' }
  ],
  options: [
    { key: 'talla', label: 'Talla', values: [{ value: 'ch', label: 'CH' }, { value: 'm', label: 'M' }, { value: 'g', label: 'G' }] },
    { key: 'color', label: 'Color', values: [{ value: 'natural', label: 'Natural', photo: 0 }, { value: 'grana', label: 'Grana', photo: 1 }] }
  ],
  variants: [
    { id: 'm-grana', options: { talla: 'm', color: 'grana' }, price: { value: mxn(3600) }, photo: 1, max: 4 },
    { id: 'g-grana', options: { talla: 'g', color: 'grana' }, price: { value: mxn(3600) }, photo: 1, available: false }
  ],
  description: 'Cada huipil sale del taller de la familia Mendoza.\n\nLas flores cambian un poco de una pieza a otra.',
  facts: [{ label: 'Tela', value: 'Manta de algodón' }, { label: 'Lavado', value: 'A mano, en frío' }],
  note: 'Hecho a mano: cada pieza cambia un poco.'
}

const etiquetas = {
  add: 'Añadir al carrito', busy: 'Añadiendo…', quantity: 'Cantidad', decrement: 'Quitar una', increment: 'Añadir una',
  choose: 'Elige {option}', unavailable: 'No disponible en esta combinación', unavailableValue: '{value}, agotada',
  photos: 'Fotos del huipil', facts: 'Ficha', details: 'Descripción',
  price: priceLabels, external: 'se abre en otra pestaña'
  // `gallery` (los textos de GGallery) no se muestra aquí: ver GGallery/README.md
}
</script>

<template>
  <GbProductOverview01 :product="ficha" :prices="precios" :labels="etiquetas" @add="anadirAlCarrito" />
</template>
```

Sin la escucha de `add`, la persona pulsa «Añadir» y no pasa nada. `labels.gallery` va tal cual a `GGallery` ([`GGallery/README.md`](../../../../vue/src/components/GGallery/README.md)); sin él avisa la galería, no el bloque.

## Ejemplos

### e1 · La ficha con el panel al lado de las fotos (`GbProductOverview01`)

**Por qué:** cuando la persona decide mirando las fotos y eligiendo a la vez (textiles, objetos con variantes de color). En escritorio el botón «Añadir» está junto a las fotos; en la tablet y el teléfono el panel pasa debajo, a todo el ancho.

```vue
<!-- Fragmento: `ficha`, `precios`, `etiquetas` y `anadirAlCarrito` son de tu aplicación -->
<GbProductOverview01 :product="ficha" :prices="precios" :labels="etiquetas" @add="anadirAlCarrito" />
```

### e2 · Una columna para el teléfono primero (`GbProductOverview02`)

**Por qué:** cuando la mayoría de las visitas llega desde el teléfono o la página lleva poco ancho (un cajón, una columna de 640 px): fotos arriba, panel y texto debajo, sin consultar el ancho de nadie.

```vue
<!-- Fragmento: `ficha`, `precios`, `etiquetas` y `anadirAlCarrito` son de tu aplicación -->
<GbProductOverview02 :product="ficha" :prices="precios" :labels="etiquetas" @add="anadirAlCarrito" />
```

### e3 · Tira de fotos y pestañas (`GbProductOverview03`)

**Por qué:** cuando el producto tiene mucho texto (ficha técnica, cuidados, envíos) y pocas fotos grandes. La foto grande va en una tira y el texto largo en pestañas, para que «Añadir» no baje por el contenido. Pasa `labels.tabs` (el nombre del grupo de pestañas).

```vue
<!-- Fragmento: `ficha`, `precios`, `etiquetas` y `anadirAlCarrito` son de tu aplicación -->
<GbProductOverview03 :product="ficha" :prices="precios" :labels="{ ...etiquetas, tabs: 'Sobre el huipil' }" @add="anadirAlCarrito" />
```

## Props

Una sola interfaz para las tres variantes (`GbProductOverviewProps`). Los tipos de datos salen de `@grana/blocks/ecommerce`.

| Prop | Tipo | Descripción |
| --- | --- | --- |
| `product` | `ProductDetail` (requerida) | `name` es el título de la sección (`h2` bajo el `h1` de la aplicación o de `GbHero`); `lang` va a la `GSection`. |
| `selection` | `Selection` | `v-model:selection` (clave de opción → valor). Sin él, el bloque guarda su copia. Nada preelegido salvo una opción de un solo valor; un valor que no está en su opción se ignora (PO2). |
| `quantity` | `number = 1` | `v-model:quantity`; `GNumberField` con `min` 1 y `max` de la variante (PO3). |
| `prices` | `PriceRegion` | Un `GPriceScope` alrededor del precio del panel. |
| `busy` | `boolean = false` | Añadiendo: «Añadir» con `loading` y `loadingText` = `labels.busy`; no emite. |
| `locale` | `string` | BCP 47; sin él, el `lang` del ancestro al montar. |
| `labels` | `OverviewLabels` (requerida) | `add`, `quantity`, `decrement`, `increment`, `choose` y `photos` obligatorios (C5); `busy` con `busy`; `unavailable` y `unavailableValue` con lo agotado; `facts` y `details` con `facts` o descripción; `tabs` en 03; `rating`, `noReviews` y `reviews` con `rating` y `product.reviews`; `gallery` (a `GGallery`) y `price` (a `GPriceScope`) tal cual. |

## Eventos

| Evento | Carga | Cuándo |
| --- | --- | --- |
| `add` | `{ event, product, variant, selection, options, quantity }` (`ProductAdd`) | «Añadir» con todo lo obligatorio elegido y la variante disponible; con una opción obligatoria sin elegir **no emite** (error y foco en esa pregunta) |
| `select` | `{ event, product, key, value, variant }` (`OptionSelect`) | Se elige un valor (informativo: la elección ya está en `v-model:selection`) |
| `update:selection` | `Record<string, string \| number>` (objeto nuevo) | Cada elección |
| `update:quantity` | `number` | La cantidad cambia |
| `navigate` | `{ event, href, item }` (`BlockNavigate<ProductReviewsLink>`) | El enlace a las opiniones (`item` = `product.reviews`), con clic primario |

`options` de `add` son las `ChosenOption` en el orden de `product.options`: `{ key, label, value }` ya dichas («Talla» · «M»), con las que viajan después al carrito y al pedido.

## Slots

| Slot | Alcance | Qué va |
| --- | --- | --- |
| `panel` | `{ product: ProductDetail, variant: Variant \| null }` | Escape: contenido al final del panel (por ejemplo «Envío a tu código postal» de tu aplicación) |
| `section-{id}` | `{ section: ProductSection }` | Escape: el contenido rico de un apartado |
| `description` | — | Escape: la descripción rica |

## Textos (`labels`)

| Clave | Requerido |
| --- | --- |
| `add`, `quantity`, `decrement`, `increment`, `choose`, `photos` | Sí (C5) |
| `busy` | Sí, con `busy` (C5) |
| `unavailable` | Sí, con `available: false` sin motivo (C5) |
| `unavailableValue` | Sí, con algún valor sin existencias (C5; sin él, solo `disabled`) |
| `facts`, `details` | Sí, con `facts` o `description` (C5) |
| `tabs` | Sí, en 03 (C5) |
| `rating`, `noReviews`, `reviews` | Sí, con `rating` o `product.reviews` (C5) |
| `gallery`, `price` | Los de cada componente (avisan ellos) |

`choose` y `unavailableValue` admiten una cadena con `{option}` / `{value}` o una función.

## Teclado y foco

| Tecla | Efecto |
| --- | --- |
| `Tab` | Orden del DOM: fotos, enlace a las opiniones, preguntas, cantidad, «Añadir», texto plegado o pestañas |
| `Flechas` | Dentro de cada pregunta, mueven la elección (radios de `GRadioGroup`) |
| `Intro` en «Añadir» | Con todo elegido emite `add`; con una opción sin elegir no emite y lleva el foco a esa pregunta |
| Teclado de la galería, del acordeón y de las pestañas | El de cada componente ([`GGallery`](../../../../vue/src/components/GGallery/README.md), [`GAccordion`](../../../../vue/src/components/GAccordion/README.md), [`GTabs`](../../../../vue/src/components/GTabs/README.md)) |

Elegir un valor **no mueve el foco** a la galería aunque cambie de foto (en WebKit un clic no enfoca un radio; la comprobación exige que el foco no salte y que la página no se mueva).

## Accesibilidad

Cifras de la auditoría de coco ([`design/lab/blocks/ecommerce/auditoria.md`](../../../../../design/lab/blocks/ecommerce/auditoria.md)), tres motores, tres temas, claro y oscuro (`medido`):

a. Cada opción es un `radiogroup` con nombre (`fieldset` y `legend` de `GRadioGroup`); el error de «Añadir» sin talla llega por `aria-describedby` con contraste de al menos 4,5:1 y el foco va al primer radio.
b. Una talla agotada se queda a la vista, deshabilitada, con «agotada» en su nombre accesible (se ve y se oye).
c. El precio se lee con su frase y cambia sin anunciarse solo: lo anuncia el control que lo cambió (el radio elegido ya se oye y el precio está a un Tab).
d. 01 con las dos columnas medidas con la caja (PO-L1 cerrado por #950, 488 · 488 a 1440); apilado a 1024, 768, 390 y 320 sin desplazamiento horizontal ni solapes, y con el texto al 200 %.
e. 03: la tira enseña la foto de lo elegido (EC-V1, en verde).
f. Movimiento: el acordeón abre en 240 ms con el encabezado quieto y el visor de fotos en 160 ms; con `prefers-reduced-motion` no hay movimiento.
g. Con dos fichas del mismo producto en la página, elegir en una no desmarca la otra (`prueba`, #934).

> **Peligro.** Si tu aplicación escucha `add` y no usa la `Variant` que llega, o recalcula la combinación a partir de `selection` por su cuenta, puede añadir una variante que no es la que la persona ve (otro precio, otro SKU). Usa `variant` y `options` del evento: son lo que el bloque resolvió y mostró. Y los datos de `variants` deben cubrir **todas** las opciones obligatorias (EC4): una variante a la que le falta una `key` se ignora y su combinación queda sin precio propio.

## Avisos de desarrollo

Prefijo `[Grana GbProductOverview<NN>]`, una vez por instancia y motivo, solo en desarrollo. Los comunes (C1 a C8, K3, K4, EC1 a EC7) están en [`packages/blocks/README.md`](../../../README.md#avisos-comunes-de-ecommerce). Los de esta sección: C4 (en la galería avisa `GGallery`), C5, K3, K4, EC2, EC4 y los propios:

| Código | Motivo | Qué pasa |
| --- | --- | --- |
| PO1 | `product.photos` vacío | Se pinta sin galería (en 01 el panel ocupa todo el ancho) |
| PO2 | Un `selection` con un valor que no está en su opción | Se ignora |
| PO3 | `quantity` fuera de `min` o `max` | Lo ajusta `GNumberField` |

## Banco de datos de ejemplo

`product-overview.bank.js` exporta `{ DETAIL, GALLERY_LABELS, OVERVIEW_LABELS, props, slots }`: el Huipil bordado de San Antonino con nueve fotos agrupadas (tres por color, con `group`), opciones Talla (CH, M, G, EG) y Color (Natural, Grana, con foto por color), seis variantes con `max` y una agotada (G Natural), dos combinaciones sin variante (CH y EG en Grana), `facts`, descripción en dos párrafos (uno con una palabra larga para la prueba de 320 px), apartados «Cuidados» y «Envío y devoluciones», `rating`, `reviews`, `note`, región MXN y `labels` completos. Con él ninguna variante avisa. Banco real: `packages/blocks/playground/ecommerce/product-overview.html`.

## Peso

`dist/ecommerce.js` pesa **49 557 B gzip** con sus trozos compartidos (`medido` con `node packages/blocks/scripts/measure-entry.mjs ecommerce`, 2026-10-28, tras recomponer con `GSplit`, que va en `@grana/vue` y es externo); tope de la entrada **51 200 B** (DECISIONS #932; no se vuelve a subir: con más, decide el usuario; margen de 1 643 B). Una variante importada sola (esbuild minificado, `vue` y `@grana/vue*` externos; `node packages/blocks/scripts/measure-partial.mjs 7168 ecommerce GbCheckout=9728 +cartTotals=2048`): `GbProductOverview01` 6 047 B, `GbProductOverview02` 6 016 B, `GbProductOverview03` 6 136 B; tope por variante **7 168 B** (#932). `@grana/vue` y sus entradas son *peer*: las paga la aplicación.

## Alcance

- **No reserva existencias ni añade al carrito:** `add` te da la variante y la elección; tu aplicación llama a su carrito (#911).
- **No calcula precios:** el precio de la variante es el que das (`Variant.price`); no suma, no multiplica y no convierte.
- **Nada preelegido** (salvo una opción de un solo valor): elegir la talla es de la persona (#918).
- **Una opción con descripción por valor (`appearance="card"`)** queda reservada hasta que `OptionValue` la traiga.
- **Sin columna pegada** (BK-L1): el panel no se queda fijo al desplazar; `sticky` de `GSplit` está reservado (#951).
- **Sin muestra de color** (EC-L4, reservado), **sin el nombre del producto como `h1`** (EC-L1) y sin estrellas (M-L2): el `h2` de la sección y la calificación en palabras.
- **Sin CSS ni utilidades** (#763, #807).

## Verificación

| Qué | Resultado | Nivel |
| --- | --- | --- |
| Vitest de `GbProductOverview` (sin preelección salvo la opción de un valor; «Añadir» sin talla no emite, pone el error y enfoca la talla; con todo elegido emite `add` con la variante, la `selection`, las `options` y la `quantity` exactas; elegir Grana pone `index` en su primera foto; G queda `disabled` con «agotada» al elegir Natural y vuelve con Grana; el precio es el de la variante; `max` de la variante; 03 con `GTabs`; 01 con `GSplit`) | **47 de 47** (`npm test -w @grana/blocks`, 2026-10-28) | `prueba` |
| Auditoría de coco: PO-L1 cerrado con `GSplit` (dos columnas a 1440, apilado a 1024, 768, 390 y 320, y con el texto al 200 %, por la caja medida en cada tema y motor) y EC-V1 (la tira enseña lo elegido) en verde | Ecommerce **11 129/11 129** en Chromium, Firefox y WebKit, tres temas, claro y oscuro, `forced-colors` y RTL (addendum del 2026-10-28). Veredicto `candidate` | `medido` |

**No verificado:** lector de pantalla real (el nombre de cada talla con «agotada», el error de «Añadir», el precio de la variante); `forced-colors` real y en Firefox y WebKit; teléfono real y puntero grueso; fotos reales (el banco usa imágenes de ejemplo); rendimiento con el perfilador. **Pendientes abiertos:** columna pegada (BK-L1), muestra de color (EC-L4) y los generales, en [`PENDIENTES.md`](../../../../../PENDIENTES.md).

## Fuentes

- Contrato: [`design/contracts/blocks/product-overview.md`](../../../../../design/contracts/blocks/product-overview.md) y [`_comun.md`](../../../../../design/contracts/blocks/_comun.md) (§26 a §40); `GSplit` en [`design/contracts/split.md`](../../../../../design/contracts/split.md).
- Decisiones: #909 a #914, #918, #932 a #937, #946 a #951 y #955 en `DECISIONS.md`.
- Metadatos: [`GbProductOverview.meta.json`](./GbProductOverview.meta.json). Pruebas: [`GbProductOverview.test.js`](./GbProductOverview.test.js). Auditoría: [`design/lab/blocks/ecommerce/auditoria.md`](../../../../../design/lab/blocks/ecommerce/auditoria.md).
