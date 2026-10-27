# GbProductGrid · GbProductGrid01, GbProductGrid02 y GbProductGrid03

El escaparate de una categoría o de una búsqueda: **los productos de la página, cuántos hay, cómo afinarlos y qué quitar si no queda ninguno**. Cada faceta dice cuánto queda antes de tocarla y el vacío ofrece quitar justo el filtro que devuelve más. **El bloque no filtra ni ordena**: dice lo que tu aplicación le da y emite lo que la persona pide (`update:filters`, `update:sort`, `update:page`); tu aplicación vuelve a pedir la página y pone `loading`. Compone `GSection`, `GStack`, `GAdaptiveLayout`, `GTagGroup` y `GTag` (`@grana/vue/tag`), `GAccordion`, `GSelect`, `GLoadRegion` (`@grana/vue/load-region`), `GEmpty`, `GPagination`, `GPriceScope` (`@grana/vue/price`) y la tarjeta de [`GbProductCard`](../GbProductCard/README.md); no trae color, CSS ni textos propios.

**Etiquetas:** `<gb-product-grid-01>`, `<gb-product-grid-02>`, `<gb-product-grid-03>` · **Estado:** `candidate` (ver «Verificación») · **Desde:** `0.0.0` (paquete privado, aún sin publicar) · **Entrada:** `@grana/blocks/ecommerce`

```js
import { GbProductGrid01, GbProductGrid02, GbProductGrid03 } from '@grana/blocks/ecommerce'
```

> `@grana/blocks` es privado (`0.0.0`) y no se publica con la beta `0.1.0` de `@grana/vue`. Por ahora se usa desde el repositorio (banco real en `packages/blocks/playground/ecommerce/product-grid.html`). Exige `@grana/vue` (peer, `>=0.1.0-beta.0 <1.0.0`) y Vue `^3.5.0`. Además de `@grana/vue`, la aplicación carga las entradas que esta sección compone: `@grana/vue/price`, `@grana/vue/tag` y `@grana/vue/load-region`. Reglas comunes e instalación: [`packages/blocks/README.md`](../../../README.md#ecommerce).

## Qué lo hace distinto

**Los filtros dicen cuánto queda antes de tocarlos, y el vacío dice qué quitar** (DECISIONS #916). Cada faceta trae su cuenta («Barro negro · 12»): quien compra con datos móviles no pide una página para descubrir que está vacía. Si aun así se queda sin productos, el vacío ofrece **quitar justo el filtro que devuelve más** («Quitar «Talla EG» · vuelven 9»), no un «sin resultados» de callejón. Al filtrar, la página no salta: la rejilla se queda en su sitio con lo último que llegó mientras carga (`GLoadRegion` «lo último conocido») y el recuento se anuncia al terminar. En el teléfono, las facetas de 02 se pliegan en una línea cada una, con lo elegido a la vista.

## Las tres variantes

Las tres reciben la misma `interface Props` (`GbProductGridProps`, el mismo objeto `props` de `props.js`). Lo que una variante no usa, lo ignora en silencio.

| Variante | Concepto | Compone | Ignora |
| --- | --- | --- | --- |
| `GbProductGrid01` | Rejilla: las facetas en una fila de etiquetas sobre la rejilla de tarjetas con foto | `GSection` > `GStack gap="md"` > cabecera + `GTagGroup layout="facets"` + `GPriceScope` > `GLoadRegion` > `GAdaptiveLayout role="list"` > `div role="listitem" class="g-adapt-standard"` > la tarjeta de `GbProductCard01` + `GPagination` | — |
| `GbProductGrid02` | Con filtros al lado: las facetas en una columna plegable al inicio y la rejilla al lado; en el teléfono, las facetas plegadas arriba | `GSection` > `GAdaptiveLayout gap="lg"` > [`div class="g-adapt-short" role="group"` > `GAccordion`, un `GAccordionItem` por faceta con su `GTagGroup`] + [`div class="g-adapt-wide"` > cabecera + resultados con la tarjeta de `GbProductCard03` + `GPagination`] | — |
| `GbProductGrid03` | Renglones: un producto por renglón con la foto al lado y todo su detalle | `GSection` > `GStack gap="md"` > cabecera + `GTagGroup layout="facets"` + `GPriceScope` > `GLoadRegion` > `GStack as="ul" gap="md"` > `li` > la tarjeta de `GbProductCard02` + `GPagination` | — |

**La cabecera de la rejilla:** la cuenta (`labels.count` con `total` o, sin él, `products.length`, con `Intl`) y, con `sorts`, un `GSelect` de orden. **Las facetas** son `GTag` de alternar (`aria-pressed`), no un `GFilterBar`: quien compra elige valores, y un filtro de la vista que actúa en el acto es una etiqueta que alterna. La etiqueta de cada opción lleva su cuenta con `labels.facetOption`; una opción con `count: 0` que no está elegida sigue a la vista y deshabilitada (lo no disponible se dice). **Los resultados** van dentro de **una** `GPriceScope` con `prices` y de un `GLoadRegion` con `refresh="keep"`.

**02 en ancho (#942):** las facetas quedan **al lado** de la rejilla a 1440 (coco lo midió; no depende de `GSplit`); en estrecho van encima, plegadas. La columna de facetas va primero en el DOM, así se lee y se usa antes que la rejilla (1.3.2).

**El vacío:** sin productos y sin carga, `GEmpty` dentro de la región. Sin filtros dice `labels.empty`. Con filtros dice `labels.emptyFiltered` y ofrece quitar uno (`relax` → `update:filters` sin ese valor) o todos (`clear`), con cuántos productos volverían.

## Recetas

### Filtrar en tu aplicación

El bloque emite el filtro elegido como un **objeto nuevo** (no muta `filters`); tu aplicación lo guarda, pide la página y pone `loading`:

```vue
<!-- Fragmento: `pedirPagina` y `datos` son de tu aplicación -->
<script setup>
import { ref } from 'vue'
import { GbProductGrid01 } from '@grana/blocks/ecommerce'

const filters = ref({})
const sort = ref('nuevo')
const page = ref(1)
const loading = ref(false)

async function recargar() {
  loading.value = true
  try { datos.value = await pedirPagina({ filters: filters.value, sort: sort.value, page: page.value }) }
  finally { loading.value = false }
}
</script>

<template>
  <GbProductGrid01
    v-bind="datos"
    v-model:filters="filters"
    v-model:sort="sort"
    v-model:page="page"
    :loading="loading"
    @update:filters="recargar"
    @update:sort="recargar"
    @update:page="recargar"
    @retry="recargar"
  />
</template>
```

Al terminar la carga, `GLoadRegion` anuncia el recuento con `labels.region.loaded` («24 productos») por el canal de página: es el anuncio de que los resultados cambiaron al filtrar, ordenar o paginar. Si filtras en el cliente **sin** `loading`, nadie anuncia el recuento (el bloque no tiene región viva propia, #792; hallazgo EC-L3).

### La primera carga con molde

`sample` es una lista de productos de muestra: la primera carga pinta una rejilla con la forma de la tarjeta real, sin tinta, y la sustituye cuando llegan los datos. En refrescos, la rejilla se queda con lo último que llegó:

```vue
<!-- Fragmento: `muestra` y `etiquetas` son de tu aplicación -->
<GbProductGrid01 title="Textiles" :products="[]" :sample="muestra" loading :prices="{ currency: 'MXN' }" :labels="etiquetas" />
```

## Uso

Los datos y textos comunes de la tienda (`tienda`, `precios`, `priceLabels`, `cardLabels`) están en [«Datos comunes de una tienda»](../../../README.md#datos-comunes-de-una-tienda).

```vue
<!-- Fragmento: `productos`, `cardLabels`, `priceLabels` e `irA` son de tu aplicación -->
<script setup>
import { ref } from 'vue'
import { GbProductGrid01 } from '@grana/blocks/ecommerce'

const filtros = ref({ tinte: ['grana'] })
const pagina = ref(1)

const grid = {
  title: 'Textiles',
  description: 'Tejidos en telar y bordados a mano en los Valles Centrales.',
  products: productos, // la página actual, en el orden de tu aplicación
  total: 32,
  pageSize: 12,
  facets: [
    { key: 'tinte', label: 'Tinte', options: [
      { value: 'grana', label: 'Grana cochinilla', count: 12 },
      { value: 'anil', label: 'Añil', count: 10 }
    ] },
    { key: 'talla', label: 'Talla', options: [
      { value: 'm', label: 'M', count: 8 },
      { value: 'eg', label: 'EG', count: 0 } // sin existencias: a la vista y deshabilitada
    ] }
  ],
  sorts: [{ value: 'nuevo', label: 'Lo más nuevo' }, { value: 'precio-asc', label: 'Precio de menor a mayor' }],
  sort: 'nuevo',
  prices: { currency: 'MXN', taxes: 'IVA incluido' },
  locale: 'es-MX',
  labels: {
    count: (n) => `${n} ${n === 1 ? 'producto' : 'productos'}`,
    facets: 'Filtrar',
    clear: 'Quitar filtros',
    facetOption: '{label} · {count}',
    sort: 'Ordenar por',
    empty: { title: 'Todavía no hay textiles', description: 'Vuelve pronto: el taller está tejiendo.' },
    emptyFiltered: { title: 'Ningún textil con esos filtros', description: 'Quita uno para ver más.' },
    card: cardLabels, // los de GbProductCard, tal cual
    region: { loading: 'Cargando textiles', slow: 'Sigue cargando…', loaded: ({ count }) => `${count} productos`, refreshing: 'Actualizando', failed: 'No se pudo actualizar. Lo que ves es lo último que llegó.', retry: 'Reintentar' },
    emptyLabels: { relax: 'Quitar «{label}»', returns: (n) => `vuelven ${n}`, clear: 'Quitar todos', before: 'Antes había {total}; con {filters}, ninguno.' },
    pagination: { nav: 'Páginas de textiles', previous: 'Página anterior', next: 'Página siguiente', page: 'Página {page}', range: '{from} a {to} de {total}', compact: 'Página {page} de {pages}' }
  }
}
</script>

<template>
  <GbProductGrid01
    v-bind="grid"
    v-model:filters="filtros"
    v-model:page="pagina"
    @navigate="({ event, href }) => { event.preventDefault(); irA(href) }"
  />
</template>
```

La aplicación carga además `@grana/vue/price`, `@grana/vue/tag` y `@grana/vue/load-region`, y registra los iconos Lucide que use (`createIcons`).

## Ejemplos

### e1 · Una rejilla con las facetas arriba (`GbProductGrid01`)

**Por qué:** cuando la categoría tiene dos o tres facetas y las fotos mandan. Las etiquetas de cada faceta se agrupan en un racimo con su nombre y las tarjetas miden lo mismo en cada fila. No sirve para facetas con muchos valores: ahí, la columna plegable.

```vue
<!-- Fragmento: `grid`, `filtros` y `pagina` son de tu aplicación -->
<GbProductGrid01 v-bind="grid" v-model:filters="filtros" v-model:page="pagina" />
```

### e2 · Facetas en una columna al lado (`GbProductGrid02`)

**Por qué:** cuando hay más de tres facetas o muchos valores. A 1440 las facetas van a la izquierda y la rejilla al lado, con la tarjeta compacta y su acción rápida; en el teléfono, las facetas quedan plegadas arriba y cada una dice en una línea lo elegido.

```vue
<!-- Fragmento: `grid`, `agregando`, `agregar` y `abrirVistaRapida` son de tu aplicación -->
<GbProductGrid02 v-bind="grid" :busy="agregando" @add="agregar" @open="abrirVistaRapida" />
```

### e3 · Renglones con todo el detalle (`GbProductGrid03`)

**Por qué:** cuando comparar importa más que mirar: cada producto con su foto al lado, su resumen y hasta cuatro datos.

```vue
<!-- Fragmento: `grid` es de tu aplicación -->
<GbProductGrid03 v-bind="grid" />
```

### e4 · Se quedó sin productos: qué quitar

**Por qué:** cuando los filtros dejan la lista vacía. En lugar de «sin resultados», el vacío ofrece quitar el filtro que devuelve más productos y, si hay varios, también quitarlos todos. `update:filters` llega con el objeto sin ese valor.

```vue
<!-- Fragmento: `grid` y `filtros` son de tu aplicación -->
<GbProductGrid01 v-bind="grid" :products="[]" :total="0" v-model:filters="filtros" />
```

### e5 · La carga que falla

**Por qué:** cuando la página no llega. Con `error`, la región conserva lo último que se vio y muestra «Reintentar»; el botón emite `retry` con `event: null` (el componente compuesto no entrega un evento del DOM).

```vue
<!-- Fragmento: `grid`, `fallo` y `recargar` son de tu aplicación -->
<GbProductGrid01 v-bind="grid" :error="fallo" @retry="recargar" />
```

## Props

Una sola interfaz para las tres variantes (`GbProductGridProps`). Los tipos de datos salen de `@grana/blocks/ecommerce`.

| Prop | Tipo | Descripción |
| --- | --- | --- |
| `title` | `string` (requerida) | El título de la sección (de la `GSection`). |
| `description` | `string` | Descripción de la `GSection`; el slot `description` la sustituye. |
| `products` | `Product[]` (requerida) | La página actual (0 a 48; C7 por encima), en el orden de tu aplicación: el bloque no ordena. |
| `total` | `number` | Resultados con los filtros: la cuenta y `GPagination` (PG3 si es menor que la página). |
| `page` | `number = 1` | `v-model:page`. |
| `pageSize` | `number` | Fijo de la aplicación (sin selector, #796); con `total`, hay paginación. |
| `facets` | `Facet[]` | Filtros de la vista: `GTag` de alternar con la cuenta de cada valor; una opción con `count: 0` no elegida queda a la vista y deshabilitada. |
| `filters` | `Record<string, (string \| number)[]>` | `v-model:filters` (clave de faceta → valores); cada cambio emite un objeto nuevo. Un valor que no está en `facets` se ignora (PG1). |
| `sorts` | `SortOption[]` | Las opciones de orden `{ value, label }`. |
| `sort` | `string \| null` | `v-model:sort` (PG2 si no está en `sorts`). |
| `loading` | `boolean = false` | Tu aplicación trae la página (`GLoadRegion`: molde de `sample` la primera vez, lo último conocido después). |
| `error` | `boolean \| string = false` | La última carga falló (barra de fallo con «Reintentar» sobre lo conocido). |
| `sample` | `Product[]` | Molde de la primera carga. |
| `prices` | `PriceRegion` (requerida) | Obligatoria (EC1): **una** `GPriceScope` alrededor de los resultados. |
| `busy` | `(string \| number)[]` | Ids que se están añadiendo (acción rápida de la tarjeta compacta, 02). |
| `locale` | `string` | BCP 47; sin él, el `lang` del ancestro al montar. |
| `labels` | `ProductGridLabels` (requerida) | `count`, `empty` y `card` obligatorios; `facets`, `clear` y `emptyFiltered` con `facets`; `facetOption` con alguna opción con `count`; `sort` con `sorts`; `region`, `emptyLabels`, `tags` y `pagination` a su componente, tal cual. |

## Eventos

| Evento | Carga | Cuándo |
| --- | --- | --- |
| `update:filters` | `Record<string, (string \| number)[]>` (objeto nuevo) | Alternar una faceta, quitar uno (salida del vacío) o todos |
| `update:sort` | `string` | Cambiar el orden |
| `update:page` | `number` | Cambiar de página (sin mover el foco) |
| `add` | `{ event, product, variant: null, selection: {}, options: [], quantity: 1 }` (`ProductAdd`) | La acción rápida «Añadir» de la tarjeta compacta (02), reemitida |
| `open` | `{ event, product }` (`ProductOpen`) | La tarjeta-botón (sin `href`) o «Elegir opciones», reemitida |
| `navigate` | `{ event, href, item }` (`BlockNavigate<Product>`) | La tarjeta-enlace, reemitida |
| `retry` | `{ event: null }` (`BlockRetry`) | «Reintentar» de `GLoadRegion` (`event: null`: el componente no entrega evento del DOM, #936) |

## Slots

| Slot | Alcance | Qué va |
| --- | --- | --- |
| `product` | `{ product: Product }` | Escape de la tarjeta: contenido al final de su cuerpo |
| `empty` | `{ filtered: boolean }` | Escape: el vacío propio de tu aplicación dentro de la región |
| `description` | — | Sustituye a la prop `description` de la `GSection` |

## Textos (`labels`)

| Clave | Requerido |
| --- | --- |
| `count`, `empty`, `card` | Sí (C5) |
| `emptyFiltered` | Sí, con `facets` (C5) |
| `facets`, `clear` | Sí, con `facets` (C5) |
| `facetOption` | Sí, con alguna opción con `count` (C5; sin ella, la etiqueta va sola). Plantilla con `{label}` y `{count}` o función `(label, count) => string`; sin `{label}`, PG4 y la etiqueta sola |
| `sort` | Sí, con `sorts` (C5) |
| `region`, `emptyLabels`, `tags`, `pagination` | Los de cada componente (avisan ellos) |

## Teclado y foco

| Tecla | Efecto |
| --- | --- |
| `Tab` | Recorre, en orden, las facetas, el orden, cada tarjeta y la paginación |
| `Espacio` o `Intro` | En una faceta, la alterna (`aria-pressed`); en «Quitar…» o «Reintentar», lo ejecuta |
| Las demás | Las del `GSelect` del orden, del `GAccordion` de 02 y de `GPagination`, tal como en esos componentes |

Al cambiar de página el bloque no desplaza ni mueve el foco: el anuncio de la carga dice lo nuevo y el foco sigue en la paginación.

## Accesibilidad

Cifras de la auditoría de coco ([`design/lab/blocks/ecommerce/auditoria.md`](../../../../../design/lab/blocks/ecommerce/auditoria.md)), tres motores, tres temas, claro y oscuro (`medido`):

a. Las facetas son botones de alternar con `aria-pressed`, agrupados con el nombre de la faceta; el grupo exterior lleva `labels.facets`. La región de resultados tiene nombre y `aria-busy` mientras carga (`GLoadRegion`).
b. Carga con molde y `aria-busy`; el fallo con «Reintentar» emite `retry`; el vacío y el vacío por filtros muestran «Quitar «…»» con contraste de al menos 4,5:1.
c. Nada se mueve: el refresco no mueve la rejilla (el primer producto no cambia de sitio; `prueba`, spec de bruno).
d. La lista es real; la paginación, un `nav`; ningún `h1`.
e. 02 deja las facetas al lado a 1440 y plegadas arriba a 390; sin desplazamiento horizontal a 1440, 390, 320 ni a 320 con el texto al 200 %.

> **Peligro.** `prices` es obligatoria: sin ella, cada precio de la rejilla dice su código de moneda (EC1) y la persona lee «$890 MXN» doce veces. Y el bloque **no filtra ni ordena**: si tu aplicación escucha `update:filters` pero no vuelve a pedir la página, las etiquetas cambian y los productos se quedan igual. El `update:filters` llega como un objeto nuevo; si lo mutas en lugar de reemplazarlo, `filters` no cambia en el siguiente render.

## Personalidad

Nada se mueve por su cuenta: la rejilla no anima nada propio. Lo que se mueve es lo que compone, con su movimiento reducido: el plegado de las facetas de 02 (`GAccordion`) y el molde de `GLoadRegion`. La personalidad es del vacío y de las cuentas (#916): cada faceta dice cuánto queda y el vacío dice qué quitar.

## Avisos de desarrollo

Prefijo `[Grana GbProductGrid<NN>]`, una vez por instancia y motivo, solo en desarrollo. Los comunes (C1 a C8, K3, K4, EC1 a EC7) están en [`packages/blocks/README.md`](../../../README.md#avisos-comunes-de-ecommerce). Los de esta sección: C2 y C4 a C6 (los de la tarjeta), C3, C5, C7 (más de 48), EC1, EC2, EC3, EC5. Los propios:

| Código | Motivo | Qué pasa |
| --- | --- | --- |
| PG1 | Un valor de `filters` que no está en `facets` | Se ignora |
| PG2 | `sort` que no está en `sorts` | `GSelect` sin selección |
| PG3 | `total` menor que `products.length` | Se usa `products.length` |
| PG4 | `labels.facetOption` sin `{label}` | Se pinta la etiqueta sola (#935) |

## Banco de datos de ejemplo

`product-grid.bank.js` exporta `{ props, slots, states }` con Barro y Agave, categoría «Textiles»: doce productos de la tienda común y variaciones (con y sin `href`, con opciones obligatorias, uno no disponible con su motivo, uno con la referencia de precio nombrada, uno en inglés externo y el mínimo con la palabra larga de la prueba de 320 px), `total` 32, `pageSize` 12, `page` 1, facetas Material, Tinte y Talla (EG con `count: 0`), un filtro elegido (Tinte: Grana cochinilla), tres órdenes, región MXN y `labels` completos. `states` da los estados del playground (`?estado=carga|refresco|error|vacio|filtrado`). Con él ninguna variante avisa. Banco real: `packages/blocks/playground/ecommerce/product-grid.html`.

## Peso

`dist/ecommerce.js` pesa **49 328 B gzip** con sus trozos compartidos (`medido` con `node packages/blocks/scripts/measure-entry.mjs ecommerce`, 2026-10-26); tope de la entrada **51 200 B** (DECISIONS #932; no se vuelve a subir). Una variante importada sola (`node packages/blocks/scripts/measure-partial.mjs 7168 ecommerce GbCheckout=9728 +cartTotals=2048`): `GbProductGrid01` 6 471 B, `GbProductGrid02` 6 671 B, `GbProductGrid03` 6 472 B (la mayor de las candidatas); tope por variante **7 168 B** (#932). `@grana/vue` y sus entradas son *peer*: las paga la aplicación.

## Alcance

- **No filtra, no ordena, no pagina:** la aplicación lo hace y vuelve a dar `products`, `total` y las cuentas de las facetas (#916).
- **Sin selector de filas por página** (#796): `pageSize` es fijo.
- **No usa `GFilterBar`:** es un editor de reglas sobre columnas; las facetas de una tienda son etiquetas de alternar (DECISIONS #914).
- **El recuento al filtrar sin carga no se anuncia** (hallazgo EC-L3 de `_comun.md` §37): sin `loading`, el recuento visible cambia pero nadie lo anuncia; se resolverá con `announce` (reservado).
- **Límite EC-N1 (#904):** en 01, la última tarjeta sola de la fila ocupa más ancho que las demás; en 02, el `GSelect` de orden ocupa el ancho de su columna.
- **Sin CSS ni utilidades** (#763, #807).

## Verificación

| Qué | Resultado | Nivel |
| --- | --- | --- |
| Vitest de `GbProductGrid` (las facetas emiten un objeto nuevo y no mutan `filters`; la opción con `count: 0` no elegida deshabilitada y a la vista; `clear` vacía; el vacío por filtros ofrece la salida de `GEmpty` y `relax` quita ese valor; un solo `GPriceScope`; la tarjeta es la de `GbProductCard`; `update:page` sin mover el foco; ningún producto se filtra ni ordena; `facetOption`, PG1 a PG4) | `npm test -w @grana/blocks` pasa **1 463 de 1 463** en 40 archivos (todo el paquete, 2026-10-26) | `prueba` |
| Auditoría de coco: 01, 02 y 03; carga con molde, error con reintento, vacío y vacío por filtros; 02 con las facetas al lado a 1440 (#942) | Familia: Chromium 3 248 de 3 275, Firefox 3 189 de 3 216 y WebKit 3 188 de 3 216 al auditar; 3 266 de 3 275 tras el remate de bruno (#945, con los 9 fallos restantes solo de PO-L1, CR-L1 y CK-L1) | `medido` |
| Rendimiento con una rejilla de 48 productos con el perfilador | No se midió | `sin verificar` |

**No verificado:** lector de pantalla real (el anuncio del recuento, el estado de las etiquetas de alternar); `forced-colors` real; teléfono real y puntero grueso; rendimiento con 48 productos. **Pendientes abiertos:** EC-L3 de `_comun.md` §37 (recuento sin carga); EC-N1 (límite aceptado); los generales, en [`PENDIENTES.md`](../../../../../PENDIENTES.md).

## Fuentes

- Contrato: [`design/contracts/blocks/product-grid.md`](../../../../../design/contracts/blocks/product-grid.md) y [`_comun.md`](../../../../../design/contracts/blocks/_comun.md) (§26 a §39).
- Decisiones: #909 a #916, #932, #933, #935, #936, #942 en `DECISIONS.md`.
- Metadatos: [`GbProductGrid.meta.json`](./GbProductGrid.meta.json). Pruebas: [`GbProductGrid.test.js`](./GbProductGrid.test.js). Auditoría: [`design/lab/blocks/ecommerce/auditoria.md`](../../../../../design/lab/blocks/ecommerce/auditoria.md).
