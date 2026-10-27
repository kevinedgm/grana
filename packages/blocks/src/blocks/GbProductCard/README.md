# GbProductCard · GbProductCard01, GbProductCard02 y GbProductCard03

Un producto en una tarjeta: **su foto, su nombre, lo que cuesta de verdad (la referencia de precio siempre nombrada), cuántas personas lo calificaron dicho en palabras y si se puede pedir**. Un toque lleva a su ficha; en la compacta, la acción rápida nunca añade un producto sin sus opciones obligatorias: dice «Elegir opciones» y abre la elección. Es la pieza de `GbProductGrid` y la que tu aplicación pone en sus propias rejillas (relacionados, «lo que viste»). Compone `GCard`, `GPrice` y `GPriceScope` (`@grana/vue/price`), `GBadge`, `GBtn`, `GText` y `GIcon`; no trae color, CSS ni textos propios.

**Etiquetas:** `<gb-product-card-01>`, `<gb-product-card-02>`, `<gb-product-card-03>` · **Estado:** `candidate` (ver «Verificación») · **Desde:** `0.0.0` (paquete privado, aún sin publicar) · **Entrada:** `@grana/blocks/ecommerce`

```js
import { GbProductCard01, GbProductCard02, GbProductCard03 } from '@grana/blocks/ecommerce'
```

> `@grana/blocks` es privado (`0.0.0`) y no se publica con la beta `0.1.0` de `@grana/vue`. Por ahora se usa desde el repositorio (banco real en `packages/blocks/playground/ecommerce/product-card.html`). Exige `@grana/vue` (peer, `>=0.1.0-beta.0 <1.0.0`) y Vue `^3.5.0`. Además de `@grana/vue`, la aplicación carga la entrada que esta sección compone: `@grana/vue/price`. Reglas comunes e instalación: [`packages/blocks/README.md`](../../../README.md#ecommerce).

## Qué lo hace distinto

**Lo que cuesta de verdad, cuántos lo dicen y nunca a ciegas** (DECISIONS #915). Una referencia de precio siempre lleva su nombre («Precio de lista $1,850 → $1,650 · Ahorras $200»), nunca un tachado sin origen: sin `compareLabel` ni `labels.price.before`, la referencia no se pinta. La calificación dice cuántas personas la sostienen («4,8 de 5 · 312 opiniones»: un 5,0 de dos opiniones se lee como lo que es), en palabras y sin estrellas. Lo agotado se queda a la vista con cuándo vuelve. Y la acción rápida de la compacta **no añade un huipil sin talla**: si hay que elegir, dice «Elegir opciones» y abre la elección, así quien compra con el pulgar no descubre en el carrito que pidió la talla equivocada.

**Una sola acción principal: la tarjeta.** Con `href` es el enlace a la ficha; sin él, la tarjeta entera es el botón «ver» y emite `open` (tu aplicación abre la vista rápida). Nunca un `GBtn solid` dentro de una tarjeta: doce tarjetas no compiten con doce botones principales.

## Las tres variantes

Las tres reciben la misma `interface Props` (`GbProductCardProps`, el mismo objeto `props` de `props.js`). Lo que una variante no usa, lo ignora en silencio.

| Variante | Concepto | Compone | Ignora |
| --- | --- | --- | --- |
| `GbProductCard01` | Foto arriba: la tarjeta de escaparate, la foto domina y el nombre y el precio van debajo | `[GPriceScope as="div"]` > `GCard as="article" mediaPosition="top"` | `busy`, `labels.add`, `labels.choose`, `labels.busy`; los `facts` más allá de dos |
| `GbProductCard02` | Horizontal: foto al lado y todo el detalle a la vista, para listas y resultados | `[GPriceScope as="div"]` > `GCard as="article" orientation="auto" mediaPosition="start"` (`summary` como descripción y hasta 4 `facts`) | `busy`, `labels.add`, `labels.choose`, `labels.busy` |
| `GbProductCard03` | Compacta con acción rápida: mucho producto en poco sitio y «Añadir» sin salir de la lista | `[GPriceScope as="div"]` > `GCard as="article" density="compact" mediaPosition="top"` + una acción rápida `outline` en `actions` | `summary`, `optionsSummary` y `facts` |

**La tarjeta (común):** `eyebrow` = `product.maker`, `title` = `product.name` (un nivel por debajo de la sección en la que esté, sin abrir una propia), `subtitle` = `product.optionsSummary`, `badge` = `product.badge` (texto, nunca solo color), `facts` (hasta dos; todos hasta cuatro en 02), el `GPrice` del `PriceSpec` tal cual y la calificación en `GText`. La portada es decorativa en una tarjeta-enlace: el nombre ya lo dice.

**La acción rápida (solo 03):** si el producto tiene alguna opción obligatoria (`required`, por defecto `true`), dice `labels.choose` y emite `open`; si no, dice `labels.add` y emite `add` con la carga exacta de abajo. Con `busy`, el botón muestra `loading` con `labels.busy`. **Sin `labels.choose` y con opciones obligatorias, la acción no se pinta** (EC3): nunca se añade a ciegas.

**No disponible:** sin acción rápida, el motivo en texto en el cuerpo y el precio a la vista; con `href` la tarjeta sigue siendo enlace, para leer la ficha. `available: false` dice `labels.unavailable`; un texto dice ese motivo («Vuelve el 2 de diciembre»).

**La calificación** se formatea con `Intl.NumberFormat` del idioma: «4,8» en `es`, «4.8» en `es-MX` y `en-US`. Con `count: 0` dice `labels.noReviews`, nunca «0 de 5».

## Recetas

### Tu propia rejilla (y qué hace la última fila)

Una tarjeta suelta con `prices` lleva su propio `GPriceScope`. En una rejilla de tu aplicación, **una sola región** va alrededor de todas, y las tarjetas no llevan `prices`:

```vue
<!-- Fragmento: `productos`, `tienda`, `priceLabels` y `abrir` son de tu aplicación -->
<script setup>
import { GAdaptiveLayout } from '@grana/vue'
import { GPriceScope } from '@grana/vue/price'
import { GbProductCard01 } from '@grana/blocks/ecommerce'
</script>

<template>
  <GPriceScope currency="MXN" taxes="IVA incluido" :labels="priceLabels">
    <GAdaptiveLayout role="list">
      <div v-for="p in productos" :key="p.id" role="listitem" class="g-adapt-standard">
        <GbProductCard01 :product="p" locale="es-MX" :labels="tienda.card" @open="abrir" />
      </div>
    </GAdaptiveLayout>
  </GPriceScope>
</template>
```

`GAdaptiveLayout` reparte la última fila: la última tarjeta sola ocupa más ancho que las demás (límite EC-N1, el mismo que BK-L7 de Booking, #904). Si quieres un tope, monta la rejilla en una columna de lectura (`GContainer width="reading"`) o en una cuadrícula propia. Para un listado completo con facetas, orden y paginación usa [`GbProductGrid`](../GbProductGrid/README.md), que ya pone la región y las tarjetas.

### «Elegir opciones» abre la vista rápida

`GbProductCard03` con un producto con opciones obligatorias emite `open { event, product }`; la aplicación abre [`GbQuickView03`](../GbQuickView/README.md) con el mismo producto y le pasa `event.currentTarget` como `from`, para que al cerrar el foco vuelva a esa tarjeta.

## Uso

Los datos y textos comunes de la tienda (`tienda`, `precios`, `priceLabels`) están en [«Datos comunes de una tienda»](../../../README.md#datos-comunes-de-una-tienda).

```vue
<!-- Fragmento: `fotosHuipil`, `priceLabels` y `abrirVistaRapida` son de tu aplicación -->
<script setup>
import { GbProductCard03 } from '@grana/blocks/ecommerce'

const mxn = (amount) => ({ amount, currency: 'MXN' })

const huipil = {
  id: 'huipil-san-antonino',
  name: 'Huipil bordado de San Antonino',
  maker: 'Taller Mendoza · San Antonino Castillo Velasco',
  photos: fotosHuipil, // [{ id, src, thumb, width, height, alt }]
  price: { value: mxn(3200) },
  badge: 'Últimas 3 piezas',
  optionsSummary: '4 tallas · 2 colores',
  options: [
    { key: 'talla', label: 'Talla', values: [{ value: 'm', label: 'M' }, { value: 'g', label: 'G' }] }
  ],
  rating: { average: 4.7, count: 58 }
}

const labels = {
  add: 'Añadir al carrito',
  choose: 'Elegir opciones',
  busy: 'Añadiendo…',
  unavailable: 'No disponible',
  rating: (r) => `${r.average} de ${r.max} · ${r.countText} ${r.count === 1 ? 'opinión' : 'opiniones'}`,
  noReviews: 'Todavía sin opiniones',
  price: priceLabels,
  external: 'se abre en otra pestaña'
}
</script>

<template>
  <GbProductCard03
    :product="huipil"
    :prices="{ currency: 'MXN', taxes: 'IVA incluido' }"
    locale="es-MX"
    :labels="labels"
    @open="abrirVistaRapida"
  />
</template>
```

La aplicación carga además `@grana/vue/price` (el precio) y registra los iconos Lucide que use (`createIcons`).

## Ejemplos

### e1 · Escaparate con la foto arriba (`GbProductCard01`)

**Por qué:** cuando la foto vende y la tarjeta va en una rejilla de tres a cinco columnas. El nombre y el precio quedan debajo y la calificación dice cuántas opiniones la sostienen. No sirve para listas largas con mucho dato: ahí, la horizontal.

```vue
<!-- Fragmento: `jarro`, `labels` y `irA` son de tu aplicación -->
<GbProductCard01 :product="jarro" :labels="labels" @navigate="({ event, href }) => { event.preventDefault(); irA(href) }" />
```

### e2 · Resultados con todo el detalle (`GbProductCard02`)

**Por qué:** cuando comparar importa más que mirar: la foto va al lado y se ven el resumen y hasta cuatro datos (contenido, grado, destilación). En estrecho, la foto pasa arriba.

```vue
<!-- Fragmento: `espadin` y `labels` son de tu aplicación -->
<GbProductCard02 :product="espadin" :labels="labels" />
```

### e3 · Añadir sin salir de la lista (`GbProductCard03`)

**Por qué:** cuando hay mucho producto y quien compra sabe lo que quiere. Un jarro sin opciones dice «Añadir al carrito» y emite `add`; el huipil, con talla obligatoria, dice «Elegir opciones» y emite `open`. En los dos casos el `busy` de tu aplicación pone el botón en «Añadiendo…».

```vue
<!-- Fragmento: `jarro`, `labels`, `agregar` y `agregando` son de tu aplicación -->
<GbProductCard03 :product="jarro" :busy="agregando" :labels="labels" @add="agregar" />
```

La carga de `add` es `{ event, product, variant: null, selection: {}, options: [], quantity: 1 }`: con el producto entero, tu aplicación arma su llamada al carrito sin volver a buscar nada.

### e4 · Un producto sin ficha propia

**Por qué:** cuando el producto no tiene página (`href` ausente) y se mira en una vista rápida. La tarjeta entera es el botón y emite `open`.

```vue
<!-- Fragmento: `huipil`, `labels` y `abrirVistaRapida` son de tu aplicación -->
<GbProductCard01 :product="huipil" :labels="labels" @open="abrirVistaRapida" />
```

### e5 · Lo agotado se queda a la vista

**Por qué:** cuando el producto vuelve: `available: 'Vuelve el 2 de diciembre'` se dice en el cuerpo, la tarjeta no pide nada y el precio sigue a la vista. Quien llega por un enlace guardado sabe que existe y cuándo vuelve.

```vue
<!-- Fragmento: `plato` y `labels` son de tu aplicación -->
<GbProductCard01 :product="{ ...plato, available: 'Vuelve el 2 de diciembre' }" :labels="labels" />
```

## Props

Una sola interfaz para las tres variantes (`GbProductCardProps`). Los tipos de datos salen de `@grana/blocks/ecommerce`.

| Prop | Tipo | Descripción |
| --- | --- | --- |
| `product` | `Product` (requerida) | `id` obligatorio (EC5); sin `name` o sin `price` no se pinta (C2); `lang` va al título y a la descripción, no a la raíz (#891). |
| `prices` | `PriceRegion \| null` | Un `GPriceScope` alrededor de la tarjeta suelta; en una rejilla la pone la rejilla. Suelta, no avisa EC1. |
| `busy` | `boolean = false` | Solo 03. Añadiendo: el botón rápido con `loading` y `loadingText` = `labels.busy`. |
| `locale` | `string` | BCP 47; sin él, el `lang` del ancestro al montar. |
| `labels` | `ProductCardLabels = {}` | `add` y `choose` (03), `busy`, `unavailable`, `rating` y `noReviews` (con `rating`), `price` (a `GPriceScope` y `GPrice`) y `external`; sin valores por defecto (C5). |

## Eventos

| Evento | Carga | Cuándo |
| --- | --- | --- |
| `navigate` | `{ event, href, item: product }` (`BlockNavigate<Product>`) | La tarjeta-enlace (`product.href`) con clic primario; nunca con `external` (reemite el de `GCard`, #505, #574) |
| `open` | `{ event, product }` (`ProductOpen`) | La tarjeta-botón (sin `href`: tu aplicación abre la vista rápida) o «Elegir opciones» (03) |
| `add` | `{ event, product, variant: null, selection: {}, options: [], quantity: 1 }` (`ProductAdd`) | «Añadir» (03), con el producto disponible y sin opciones obligatorias |

## Slots

| Slot | Alcance | Qué va |
| --- | --- | --- |
| `product` | `{ product: Product }` | Escape: contenido extra al final del cuerpo de la tarjeta, después del precio |
| `media` | `{ product: Product }` | Escape: la portada propia de tu aplicación (por ejemplo una `picture`) |

## Textos (`labels`)

| Clave | Requerido |
| --- | --- |
| `add` | Sí, en 03 con un producto disponible y sin opciones obligatorias (C5) |
| `choose` | Sí, en 03 con un producto con opciones obligatorias (EC3: sin él, no hay acción) |
| `busy` | Sí, con `busy` (C5) |
| `unavailable` | Sí, con `available: false` (C5) |
| `rating`, `noReviews` | Sí, con `rating` (`noReviews` con `count: 0`) (C5) |
| `price` | Los de `GPriceScope` y `GPrice` (los avisa `GPrice`) |
| `external` | Sí, con `external` (C5) |

`ProductCardLabels` es **el mismo tipo** que llevan `GbProductGrid` (`labels.card`) y el carrito: la tarjeta se lee igual en todas partes.

## Teclado y foco

| Tecla | Efecto |
| --- | --- |
| `Tab` | Una parada en la tarjeta (enlace o botón) y, en 03, otra en la acción rápida |
| `Intro` | En la tarjeta-enlace navega; en la tarjeta-botón o en «Elegir opciones» emite `open`; en «Añadir» emite `add` |
| `Espacio` | Activa la tarjeta-botón y los botones |

## Accesibilidad

Cifras de la auditoría de coco ([`design/lab/blocks/ecommerce/auditoria.md`](../../../../../design/lab/blocks/ecommerce/auditoria.md)), tres motores, tres temas, claro y oscuro (`medido`):

a. La raíz es un `article` con el nombre del producto como título, al nivel que corresponde por anidación; ninguna variante pinta `h1` (`medido`).
b. Una sola acción principal por tarjeta y ningún `GBtn solid` (`prueba`, Vitest). En 03, «Elegir opciones» abre y no añade; «Añadir» añade (`medido`).
c. La calificación es texto llano («4,8 de 5 · 312 opiniones»), nunca un `img` ni un icono (`prueba`).
d. El precio se lee con su frase y la referencia lleva su nombre; la insignia y el ahorro tienen contraste de al menos 4,5:1 (mínimo medido 4,51:1 en oscuro con el tema por defecto, con 0,01 de margen: la auditoría lo anota como EC-N4).
e. Lo agotado se queda con su motivo en texto y sin acción rápida; nunca solo atenuado.
f. Sin desplazamiento horizontal a 1440, 390, 320 ni a 320 con el texto al 200 %; 02 con la foto al lado a 1440 y arriba a 320.

> **Peligro.** `product.id` es obligatorio (EC5): `open` y `add` lo devuelven como identidad del producto; sin él, el bloque usa el índice y tu aplicación recibirá un número que cambia si reordenas la lista. Y un producto con opciones obligatorias sin `labels.choose` no tiene acción rápida en 03: la persona ve la tarjeta y no puede elegir desde la lista.

## Personalidad

Nada se mueve: la tarjeta no anima nada propio. Lo único que se mueve es lo que compone, con su movimiento reducido (el estado `loading` de `GBtn`). La personalidad de la familia es «nada se pierde al volver» (DECISIONS #913): la elección de la ficha viaja con las mismas palabras al carrito y al pedido; en esta tarjeta se cumple con la regla «nunca a ciegas».

## Avisos de desarrollo

Prefijo `[Grana GbProductCard<NN>]`, una vez por instancia y motivo, solo en desarrollo. Los comunes (C1 a C8, K3, K4, EC1 a EC7) están en [`packages/blocks/README.md`](../../../README.md#avisos-comunes-de-ecommerce). Los de esta sección: C2 (sin `name` o sin `price`: no se pinta), C4, C5, C6 (tarjeta sin interacción), K3, K4, EC2 (`rating` inválido: no se pinta), EC3 (opciones obligatorias sin `labels.choose`), EC5 (`id` ausente). El propio:

| Código | Motivo | Qué pasa |
| --- | --- | --- |
| PC1 | Un producto sin `photos` en 01 o 02 | Se pinta sin `media`; la tarjeta no reserva un hueco vacío |

## Banco de datos de ejemplo

`product-card.bank.js` exporta `{ props, each }` con la tienda «Barro y Agave» (`bank/ecommerce.js`): `props` es el huipil (con `maker`, `badge` «Últimas 3 piezas», `optionsSummary`, `facts`, opciones obligatorias y `rating`); `each` monta una tarjeta por producto en cada variante: el mezcal tobalá (`compareAt` con `compareLabel`), el plato de barro verde (no disponible con motivo), el jarro (sin opciones: «Añadir»; sin opiniones), el espadín, el chocolate (en inglés y externo) y uno mínimo (`id`, `name` y `price`, solo en 03). `prices` es `{ currency: 'MXN', taxes: 'IVA incluido' }`. Con él ninguna variante avisa. Banco real: `packages/blocks/playground/ecommerce/product-card.html`.

## Peso

`dist/ecommerce.js` pesa **49 328 B gzip** con sus trozos compartidos (las 12 secciones y 36 variantes; `medido` con `node packages/blocks/scripts/measure-entry.mjs ecommerce`, 2026-10-26); tope de la entrada **51 200 B** (DECISIONS #932; no se vuelve a subir: con más, decide el usuario). Una variante importada sola (esbuild minificado, `vue` y `@grana/vue*` externos; `node packages/blocks/scripts/measure-partial.mjs 7168 ecommerce GbCheckout=9728 +cartTotals=2048`): `GbProductCard01` 3 750 B, `GbProductCard02` 3 755 B, `GbProductCard03` 3 753 B; tope por variante **7 168 B** (#932). `@grana/vue` y sus entradas son *peer*: las paga la aplicación.

## Alcance

- **No añade al carrito:** `add` te da el producto y tu aplicación decide qué hacer (#911: el bloque no suma, no valida existencias ni cobra).
- **Sin estrellas:** la calificación va en palabras; la forma visual con estrellas está reservada (M-L2) y, cuando llegue, irá **junto** al texto y el dato (`Rating`) no cambia.
- **Rejilla propia:** la tarjeta no se reparte sola; para un listado con facetas, orden y paginación, `GbProductGrid`.
- **Límite aceptado EC-N1 (#904):** en una rejilla con `GAdaptiveLayout`, la última tarjeta sola ocupa más ancho que las demás (ver la receta de arriba).
- **`Product.lang` (#885, #891):** si el nombre y el resumen no están en el idioma de la página, `lang` va al título y a la descripción, y los `labels` que pinta se esperan en ese mismo idioma.
- **Sin CSS ni utilidades** (#763, #807).

## Verificación

| Qué | Resultado | Nivel |
| --- | --- | --- |
| Vitest de `GbProductCard` (una sola acción principal y ningún `GBtn solid`; 03 con el huipil dice `choose` y emite `open`, con el jarro dice `add` y emite `add` con la carga exacta; sin `labels.choose` no hay acción; no disponible sin acción y con motivo; calificación con `Intl` y `count: 0` dice `noReviews`; `compareAt` sin nombre no se pinta; avisos) | `npm test -w @grana/blocks` pasa **1 463 de 1 463** en 40 archivos (todo el paquete, 2026-10-26) | `prueba` |
| Auditoría de coco: Product card 01, 02 y 03 en los tres motores, tres temas, claro y oscuro; 02 con la foto al lado a 1440 y arriba a 320; 03 «Elegir opciones» abre y no añade; lo agotado sin acción y con su motivo | Veredicto `candidate`; la familia: Chromium 3 248 de 3 275, Firefox 3 189 de 3 216 y WebKit 3 188 de 3 216, con los fallos restantes en hallazgos de otras secciones | `medido` |

**No verificado:** lector de pantalla real (el nombre de la tarjeta-botón, la calificación en palabras); `forced-colors` real y en Firefox y WebKit (solo emulado en Chromium); teléfono real y puntero grueso; fotos reales (el banco usa SVG con degradado); rendimiento con el perfilador. **Pendientes abiertos:** EC-N1 (límite aceptado); los generales, en [`PENDIENTES.md`](../../../../../PENDIENTES.md).

## Fuentes

- Contrato: [`design/contracts/blocks/product-card.md`](../../../../../design/contracts/blocks/product-card.md) y [`_comun.md`](../../../../../design/contracts/blocks/_comun.md) (§26 a §39).
- Decisiones: #909 a #915, #927, #929, #932 en `DECISIONS.md`.
- Metadatos: [`GbProductCard.meta.json`](./GbProductCard.meta.json). Pruebas: [`GbProductCard.test.js`](./GbProductCard.test.js). Auditoría: [`design/lab/blocks/ecommerce/auditoria.md`](../../../../../design/lab/blocks/ecommerce/auditoria.md).
