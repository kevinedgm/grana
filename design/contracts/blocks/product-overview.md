# Contrato · Product overview (`GbProductOverview01` · `02` · `03`)

**Dueño:** lima · **Estado:** contratado (DECISIONS.md #909 a #914 y #918, 2026-10-23; #932 a #937) · **Remates #932 a #941 (2026-10-26):** sigue en `draft` hasta la decisión del usuario sobre las dos columnas (EC-L7, #933) · **Plan:** E4 (§4.2) · **Entrada:** `@grana/blocks/ecommerce` · **Común:** `_comun.md` §1 a §5 y §26 a §38 · **Compone:** `GSection`, `GStack`, `GAdaptiveLayout`, `GGallery` (`@grana/vue/gallery`), `GRadioGroup` (`chip`, `card`), `GNumberField`, `GBtn`, `GPrice` + `GPriceScope` (`@grana/vue/price`), `GTabs`, `GAccordion` + `GAccordionItem`, `GText` (con `dl`, #863) · **Parte de bruno:** B · **Compleja: coco y bruno en Opus** (galería que sigue a la elección, opciones con variantes, cantidad y precio a la vez)

## Promesa

La ficha de un producto: **las fotos, lo que cuesta la combinación que eliges, si queda y el botón que la añade**; luego la descripción, la ficha técnica y los cuidados. El bloque resuelve qué variante corresponde a lo elegido (vista); no reserva existencias ni añade nada.

## Props

```ts
interface GbProductOverviewProps {
  product: ProductDetail               // name es el título de la sección
  selection?: Record<string, string | number>   // v-model:selection (clave de opción → valor)
  quantity?: number                    // v-model:quantity (1 por defecto)
  prices?: PriceRegion
  busy?: boolean                       // añadiendo
  locale?: string
  labels: OverviewLabels
}
type OverviewLabels = {
  add: string                          // «Añadir al carrito»
  busy?: string                        // «Añadiendo…»
  quantity: string                     // rótulo del campo («Cantidad»)
  decrement: string; increment: string // botones de GNumberField («Quitar una», «Añadir una»)
  choose: string | ((option: string) => string)   // error de una opción sin elegir («Elige {option}»)
  unavailable?: string                 // el producto o la combinación no se puede pedir
  unavailableValue?: string | ((value: string) => string)   // nombre de un valor sin existencias («{value}, agotada»)
  photos: string                       // título de la galería («Fotos del rebozo»)
  facts?: string                       // nombre de la ficha técnica («Ficha»)
  details?: string                     // nombre de la pestaña o del elemento de la descripción («Descripción»)
  tabs?: string                        // nombre del tablist (03)
  rating?: ProductCardLabels['rating']; noReviews?: string
  reviews?: string                     // texto del enlace a las opiniones («Leer las opiniones»)
  gallery?: GranaLabels                // a GGallery, tal cual
  price?: PriceLabels & { legend?: string }
  external?: string
}
```

## Piezas (comunes)

- **Galería**: `GGallery` con `photos`, `groups`, `title` = `labels.photos`, `labels` = `labels.gallery`, `headingLevel` un nivel por debajo de la sección y **`v-model:index`** del bloque. **La foto sigue a la elección**: al elegir un valor con `photo` (o una combinación cuya `Variant.photo` existe), el bloque pone `index` en esa foto **sin mover el foco** (el cambio lo causó el gesto de la persona, en otra parte de la pantalla; la galería no se desplaza sola a la vista).
- **El panel** (`GStack gap="md"`, en este orden de DOM):
  1. `maker` en `GText size="body-sm" tone="muted"`; la calificación en palabras (como la tarjeta) con, si hay `product.reviews`, un `GBtn variant="link"` `labels.reviews` → `href` del ancla (`navigate`).
  2. **El precio** de la **variante resuelta** (o el de `product`), `GPrice size="lg"` dentro de un `GPriceScope` con `prices`; con `compareAt`, C nombrada.
  3. **Una pregunta por opción**: `GRadioGroup` con `label` = `option.label`, **sin `name`** (lo genera el componente, único por instancia: la pregunta no se envía y un `name` legible juntaría los radios de dos bloques de la página, #934), `options` = sus valores, `v-model` → `update:selection` (objeto nuevo) y `select { event, product, key, value, variant }`. **`appearance="chip"`** siempre (valores cortos: talla, tinte, presentación); `appearance="card"` queda reservada para cuando `OptionValue` traiga una descripción (no la tiene en v1). Un valor sin existencias **para la elección actual de las demás opciones** (ninguna variante disponible con él) queda `disabled` y su nombre lo dice (`labels.unavailableValue`: «G, agotada»): se ve y se oye, no se esconde. Sin `selection` para una opción obligatoria, **ningún valor preelegido** (elegir la talla es de la persona), salvo una opción de **un solo valor**, que se elige sola.
  4. **Cantidad**: `GNumberField` (`label` = `labels.quantity`, `min` 1, `max` = `Variant.max`, `step` 1, `precision` 0, steppers con `decrementLabel`/`incrementLabel`, `v-model` → `update:quantity`).
  5. **«Añadir»**: `GBtn solid block` `labels.add` (`loading` = `busy`, `loadingText` = `labels.busy`). Con todo lo obligatorio elegido y la variante disponible → `add { event, product, variant, selection, options, quantity }` (`options` = las `ChosenOption` en el orden de `product.options`: `{ key, label: option.label, value: valor.label }`). **Con una opción obligatoria sin elegir: no emite**; esa pregunta recibe `error` = `labels.choose(option.label)` y el foco va a su primer radio (§27 regla 3). Variante o producto no disponible: sin botón y el motivo en texto (`available` String o `labels.unavailable`).
  6. `note` en `GText size="body-sm"` («Hecho a mano: cada pieza cambia un poco»).
- **Resolver la variante** (vista, §27 regla 4): la `Variant` cuya `options` coincide **exactamente** con `selection` en todas las claves; con alguna sin elegir, ninguna (el precio es el de `product`, que suele llevar `lead` «desde»). EC4 para variantes mal formadas.
- **El texto largo**: `description` en `GText as="div"` (párrafos); `facts` en `GText as="div" size="body-sm"` › `dl` (#863), con nombre `labels.facts`; `sections` (`ProductSection`) con `title`, `body` en párrafos e `items` en `ul`.

## Variantes

| Variante | Concepto | Compone | Ignora |
| --- | --- | --- | --- |
| **01 · Galería + panel** | Las fotos y, a su lado, lo que se elige y el botón; debajo, el texto plegado | `GSection` (`title` = `name`, `description` = `summary`) › `GStack gap="lg"` › `GAdaptiveLayout gap="lg"` › [`div class="g-adapt-wide"` › `GGallery` (cuadrícula)] + [`div class="g-adapt-standard"` › panel] + `GAccordion` (descripción, ficha y un elemento por `sections`; `id` = `section.id`) | `labels.tabs` |
| **02 · Galería arriba** | Una columna: las fotos, luego el panel y el texto plegado (el teléfono primero) | `GSection` › `GStack gap="lg"` › `GGallery` (cuadrícula) + panel + `GAccordion` como 01 | `labels.tabs` |
| **03 · Tira + pestañas** | La foto grande en una tira, el panel y el texto en pestañas | `GSection` › `GStack gap="lg"` › `GGallery appearance="strip"` + panel + `GTabs` (`label` = `labels.tabs`; pestañas: descripción, ficha y una por `sections`, contenido en el slot `panel-{id}`, #889) | — |

**Orden de lectura = orden del DOM** (1.3.2): fotos → panel → texto en las tres; en 01 el panel debería quedar al lado de las fotos en ancho y debajo en estrecho, pero `GAdaptiveLayout` pone el panel (varios controles) en línea propia (PO-L1): **hoy va debajo también en ancho**, y el «al lado» espera la decisión del usuario sobre EC-L7 (#933; recomendación `GSplit`). Sin columna pegada: BK-L1.

## Eventos

| Evento | Carga | Cuándo |
| --- | --- | --- |
| `add` | `{ event, product, variant, selection, options, quantity }` | «Añadir» válido |
| `select` | `{ event, product, key, value, variant }` | Se elige un valor (informativo) |
| `update:selection` | `Record<string, string\|number>` | Cada elección |
| `update:quantity` | `number` | La cantidad cambia |
| `navigate` | `{ event, href, item }` | El enlace a las opiniones (`item` = `product.reviews`) |

## Slots

`panel` `{ product, variant }` (escape: contenido al final del panel, p. ej. «Envío a tu código postal» de la aplicación), `section-{id}` `{ section }` (escape: el contenido rico de un apartado), `description`.

## Estructura accesible

`GSection` con el nombre del producto como título (`h2` bajo el `h1` de la aplicación; EC-L1); la galería con su título un nivel por debajo; cada opción es un `radiogroup` con nombre (`fieldset`/`legend` de `GRadioGroup`); el error de una opción por `GRadioGroup` (`aria-describedby`); el precio se lee con su frase y **cambia sin anunciarse solo** (principio 5 de `price.md`: lo anuncia el control que lo cambió: el radio elegido ya se oye, y el precio está a un Tab); sin `h1`.

## Qué lo hace distinto (#918)

**La foto enseña lo que elegiste y el botón nunca añade a ciegas.** Al tocar «Añil», la galería pasa a la foto del rebozo añil y el precio y las existencias son los de esa combinación; una talla agotada se queda a la vista con «agotada» en su nombre en lugar de desaparecer o de dejarte elegirla para fallar en el carrito. Nada viene preelegido por la tienda (la talla es tuya), y si pulsas «Añadir» sin talla, el botón no finge: te lleva a la pregunta que falta y la dice. Todo con los mismos datos en las tres formas.

## Textos (`labels`)

| Clave | Requerido |
| --- | --- |
| `add`, `quantity`, `decrement`, `increment`, `choose`, `photos` | Sí (C5) |
| `busy` | Sí, con `busy` (C5) |
| `unavailable` | Sí, con `available: false` sin motivo (C5) |
| `unavailableValue` | Sí, con algún valor sin existencias (C5; sin él, solo `disabled`) |
| `facts`, `details` | Sí, con `facts` o `description` (C5) |
| `tabs` | Sí, en 03 (C5) |
| `rating`, `noReviews`, `reviews` | Sí, con `rating` / `product.reviews` (C5) |
| `gallery`, `price` | Los de cada componente (avisan ellos) |

## Avisos propios (`[Grana GbProductOverview<NN>]`)

C4 (en la galería avisa `GGallery`), C5, K3, K4, EC2, EC4. Además: **PO1** · `product.photos` vacío (sin galería), **PO2** · un `selection` con un valor que no está en su opción (se ignora), **PO3** · `quantity` fuera de `min`/`max` (lo ajusta `GNumberField`).

## Banco (`product-overview.bank.js`)

El Huipil bordado de San Antonino del banco común: nueve fotos (tres por color, con `group`), opciones Talla (CH/M/G/EG) y Color (Natural/Grana), seis variantes con `max` y una agotada (G Natural), `facts` (algodón, bordado a mano, largo), `sections` «Cuidados» y «Envío y devoluciones», `rating`, `reviews: { href: '#opiniones' }`, `note`; `prices` MXN; `labels` completos.

## Verificación propia

Vitest: sin preelección (salvo la opción de un valor); «Añadir» sin talla no emite, pone el error y enfoca la talla; con todo elegido emite `add` con la variante, `selection`, `options` y `quantity` exactos; elegir Grana pone `index` en su primera foto sin mover el foco; G se queda `disabled` con «agotada» al elegir Natural y vuelve al elegir Grana; el precio es el de la variante; `max` de la variante en `GNumberField`; 03 con `GTabs` y su contenido en `panel-{id}`. Chromium: 01 con el panel debajo a 390 (el «al lado» a 1440 **no se verifica** hasta #933); con dos paneles del mismo producto en la página, elegir en uno no desmarca el otro (#934); la galería en tira (02) sigue a la elección sin mover el foco (#937); los chips de talla en una línea a 320 sin desbordar; el cambio de color no desplaza la página (Δ0 del panel).
