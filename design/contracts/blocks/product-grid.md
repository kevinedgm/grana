# Contrato · Product grid (`GbProductGrid01` · `02` · `03`)

**Dueño:** lima · **Estado:** contratado (DECISIONS.md #909 a #914 y #916, 2026-10-23; #932, #933, #935, #936) · **Remates #932 a #941 (2026-10-26):** sigue en `draft` hasta la decisión del usuario sobre las dos columnas (EC-L7, #933) (02) · **Plan:** E2 (§4.2) · **Entrada:** `@grana/blocks/ecommerce` · **Común:** `_comun.md` §1 a §5 y §26 a §38 · **Compone:** `GSection`, `GAdaptiveLayout`, `GStack`, `GTagGroup` + `GTag` de alternar (`@grana/vue/tag`), `GAccordion`, `GSelect`, `GLoadRegion` (`@grana/vue/load-region`), `GEmpty`, `GPagination`, `GPriceScope` (`@grana/vue/price`) y la tarjeta de Product card (E1) · **Parte de bruno:** B · **Compleja: coco y bruno en Opus** (facetas, orden, carga, vacío por filtros y paginación a la vez)

## Promesa

El escaparate de una categoría o de una búsqueda: **los productos de la página, cuántos hay, cómo afinarlos y qué quitar si no queda ninguno**. El bloque no filtra ni ordena: dice lo que la aplicación le da y emite lo que la persona pide.

## Props

```ts
interface GbProductGridProps {
  title: string
  description?: string
  products: Product[]                  // la página actual (0 a 48; C7 por encima de 48)
  total?: number                       // resultados con los filtros (la cuenta y GPagination)
  page?: number                        // v-model:page (1 por defecto)
  pageSize?: number                    // fijo de la aplicación (sin selector, como #796); con total, hay paginación
  facets?: Facet[]                     // filtros de la vista
  filters?: Record<string, (string | number)[]>   // v-model:filters (clave de faceta → valores elegidos)
  sorts?: { value: string; label: string }[]
  sort?: string | null                 // v-model:sort
  loading?: boolean                    // la aplicación está trayendo la página (GLoadRegion)
  error?: boolean | string             // la última carga falló
  sample?: Product[]                   // molde de la primera carga (GLoadRegion `sample`)
  prices: PriceRegion                  // obligatoria (EC1)
  busy?: (string | number)[]           // ids que se están añadiendo (acción rápida de la tarjeta compacta)
  locale?: string
  labels: {
    count: string | ((count: number) => string)   // «{count} productos»
    facetOption?: string | ((label: string, count: number) => string)   // «{label} · {count}»: la etiqueta de una opción con cuenta (#935)
    facets?: string                    // nombre del grupo de facetas («Filtrar»)
    clear?: string                     // «Quitar filtros»
    sort?: string                      // rótulo de GSelect («Ordenar por»)
    empty: { title: string; description?: string }            // sin productos y sin filtros
    emptyFiltered?: { title: string; description?: string }   // sin productos por los filtros
    card: ProductCardLabels            // los de la tarjeta (product-card.md), tal cual
    region?: GranaLabels               // a GLoadRegion (loading, loaded, slow, failed, retry)
    emptyLabels?: GranaLabels          // a GEmpty (relax, clear…)
    tags?: GranaLabels                 // a GTagGroup
    pagination?: GranaLabels           // a GPagination
  }
}
type Facet = {
  key: string
  label: string                        // «Material»
  options: { value: string | number; label: string; count?: number }[]   // count: cuántos quedarían eligiéndolo (lo da la aplicación)
}
```

## Piezas (comunes)

- **La cabecera de la rejilla**, debajo del título de la sección: la cuenta (`labels.count` con `total` o, sin él, `products.length`, con `Intl`) en `GText size="body-sm" tone="muted"` y, con `sorts`, un `GSelect` (`label` = `labels.sort`, `options` = `sorts`, `v-model` → `update:sort`).
- **Facetas** (§36: **no `GFilterBar`**): por faceta, `GTag` de **alternar** (`pressed` = el valor está en `filters[key]`, `update:pressed` → `update:filters` con un **objeto nuevo**). La etiqueta lleva su cuenta con **`labels.facetOption`** (plantilla con `{label}` y `{count}` o función; la cuenta con `Intl`; «Barro negro · 12» en `es`; el bloque no escribe el separador, #935); una opción con `count: 0` **no elegida** sigue a la vista y `disabled` (lo no disponible se dice, §27 regla 1). Con algún filtro, un `GBtn variant="link"` `labels.clear` → `update:filters({})`. Los filtros actúan en el acto (no se envían): la aplicación vuelve a pedir la página y pone `loading`.
- **Resultados**: `GLoadRegion` (`loading`, `error`, `items` = `products`, `sample`, `keyBy: 'id'`, `refresh="keep"`, `label` = `title`, `labels` = `labels.region`; `retry` → reemite `retry`) dentro de **un** `GPriceScope` con `prices`. Anuncia el fin de la carga con `labels.region.loaded` («24 productos», `{count}`), por el canal de página: es el anuncio del recuento al filtrar, ordenar o paginar (sin región viva propia, #792; sin carga no hay anuncio, EC-L3).
- **Cada producto**: la tarjeta de Product card (E1), **con la misma anatomía** (`common/`; la rejilla no reimplementa la tarjeta) y `labels.card`. Eventos de la tarjeta reemitidos (`navigate`, `open`, `add`).
- **Vacío** (`products` vacío y sin `loading`): `GEmpty` dentro del slot de la región. Sin filtros: `cause="none"`, `labels.empty`. Con filtros: `cause="filtered"`, `labels.emptyFiltered`, `filters` = los elegidos como `{ key: 'faceta:valor', label, count }` (el `count` de la opción: cuántos volverían quitándolo) y `total`; `relax` → quita ese valor (`update:filters`), `clear` → `update:filters({})`. La salida B de `GEmpty` («Quitar «Barro negro» · 12») dice **qué quitar** para volver a ver productos.
- **Paginación**: con `total` y `pageSize`, `GPagination` (`page`, `total`, `pageSize`, `labels` = `labels.pagination`, `update:page` → reemite). Sin selector de tamaño (#796). Al cambiar de página el bloque no desplaza ni mueve el foco: el anuncio de la carga dice lo nuevo y el foco sigue en la paginación.

## Variantes

| Variante | Concepto | Compone | Ignora |
| --- | --- | --- | --- |
| **01 · Rejilla** | Las facetas en una fila de etiquetas sobre la rejilla de tarjetas con foto | `GSection` › `GStack gap="md"` › cabecera + `GTagGroup layout="facets"` (racimo por faceta con su nombre, `tag.md` B «Racimo») + resultados: `GAdaptiveLayout role="list"` › `div role="listitem" class="g-adapt-standard"` › tarjeta E1 **01** + paginación | — |
| **02 · Con filtros al lado** | Las facetas en una columna plegable al inicio y la rejilla al lado; en el teléfono, las facetas plegadas arriba | `GSection` › `GAdaptiveLayout gap="lg"` › [`div class="g-adapt-short"` › `GAccordion` (`exclusive` false, nivel de dentro): un `GAccordionItem` por faceta, `title` = `facet.label`, `meta` = la cuenta de elegidos, `peek` = los valores elegidos en palabras; dentro, `GTagGroup` (flow) con sus `GTag`] + [`div class="g-adapt-wide"` › cabecera + resultados con tarjeta E1 **03** (compacta, con acción rápida) + paginación] | — |
| **03 · Renglones** | Un producto por renglón con la foto al lado y todo su detalle | `GSection` › `GStack gap="md"` › cabecera + `GTagGroup layout="facets"` + resultados: `GStack as="ul" gap="md"` › `li` › tarjeta E1 **02** + paginación | — |

**02 en ancho (#933):** el `div` de las facetas lleva un `GAccordion` (varios controles) y `GAdaptiveLayout` lo pone en línea propia: **hoy las facetas van encima de la rejilla también en ancho**. El «al lado» espera la decisión del usuario sobre EC-L7 (recomendación `GSplit`).

**02 en el teléfono:** la columna de facetas va primero en el DOM (se lee y se usa antes que la rejilla, 1.3.2) y está **plegada** (cada faceta, un encabezado de una línea con lo elegido en `peek`): la rejilla queda a uno o dos pantallazos, no a cinco.

## Eventos

| Evento | Carga | Cuándo |
| --- | --- | --- |
| `update:filters` | `Record<string, (string\|number)[]>` (nuevo) | Alternar una faceta, quitar uno o todos |
| `update:sort` | `string` | Cambiar el orden |
| `update:page` | `number` | Cambiar de página |
| `add`, `open`, `navigate` | los de la tarjeta (`product-card.md`) | Reemitidos |
| `retry` | `{ event: null }` | «Reintentar» de `GLoadRegion` (no entrega evento, #936) |

## Slots

`product` `{ product }` (el escape de la tarjeta), `empty` `{ filtered }` (escape: el vacío propio de la aplicación dentro de la región), `description`.

## Estructura accesible

`GSection` con título; la cuenta es texto; las facetas son botones de alternar (`aria-pressed`, `GTag`) agrupados con el nombre de la faceta (`GTagGroup facets` o el encabezado del `GAccordionItem`) y el grupo exterior con `labels.facets`; la región de resultados tiene nombre (`label` = `title`) y `aria-busy` mientras carga (`GLoadRegion`); lista real; la paginación es un `nav` de `GPagination`. Sin `h1`.

## Qué lo hace distinto (#916)

**Los filtros dicen cuánto queda antes de tocarlos, y el vacío dice qué quitar.** Cada faceta trae su cuenta («Barro negro · 12»), así quien compra con datos móviles no pide una página para descubrir que está vacía; si aun así se queda sin productos, el vacío ofrece **quitar justo el filtro que devuelve más** («Quitar «Talla EG» · vuelven 9»), no un «sin resultados» de callejón. Al filtrar, la página no salta: la rejilla se queda en su sitio con lo último que llegó mientras carga (`GLoadRegion` «lo último conocido») y el recuento se anuncia al terminar. En el teléfono, las facetas de 02 se pliegan en una línea cada una con lo elegido a la vista.

## Textos (`labels`)

| Clave | Requerido |
| --- | --- |
| `count`, `empty`, `card` | Sí (C5) |
| `emptyFiltered` | Sí, con `facets` (C5) |
| `facets`, `clear` | Sí, con `facets` (C5) |
| `facetOption` | Sí, con alguna opción con `count` (C5; sin ella, la etiqueta va sola) |
| `sort` | Sí, con `sorts` (C5) |
| `region`, `emptyLabels`, `tags`, `pagination` | Los de cada componente (avisan ellos) |

## Avisos propios (`[Grana GbProductGrid<NN>]`)

C3, C5, C7, EC1, EC5. Además: **PG1** · un valor de `filters` que no está en `facets` (se ignora), **PG2** · `sort` que no está en `sorts` (`GSelect` sin selección), **PG3** · `total` menor que `products.length` (se usa `products.length`), **PG4** · `labels.facetOption` sin `{label}` (se pinta la etiqueta sola, #935).

## Banco (`product-grid.bank.js`)

Barro y Agave, categoría «Textiles»: doce productos del banco común y variaciones (con y sin `href`, con opciones, uno no disponible, uno con referencia nombrada), `total` 32, `pageSize` 12, `page` 1, facetas «Material» (algodón 18, lana 9, seda 5), «Tinte» (grana cochinilla 12, añil 10, natural 10) y «Talla» (CH, M, G, EG con `count: 0`), un filtro elegido, `sorts` (Lo más nuevo, Precio de menor a mayor, Precio de mayor a menor), `prices` MXN, `labels` completos. Estados de prueba: `loading` (primera carga con `sample` y refresco), `error`, vacío sin filtros y vacío por filtros.

## Verificación propia

Vitest: las facetas emiten un objeto nuevo y no mutan `filters`; la opción con `count: 0` no elegida está `disabled` y a la vista; `clear` vacía; el vacío por filtros ofrece la salida de `GEmpty` y `relax` quita ese valor; un solo `GPriceScope`; la tarjeta es la de E1 (mismo DOM que `GbProductCard0N` con el mismo producto); `update:page` sin mover el foco; ningún producto se filtra ni ordena en el bloque (el banco pasa productos «desordenados» y salen en su orden). Chromium: 01 a 1440 con tarjetas a la misma altura (#847) y una columna a 320; 02 con las facetas plegadas arriba a 390 (la columna al lado a 1440 **no se verifica** hasta #933); la etiqueta de la faceta sale de `labels.facetOption` (con los `labels` en inglés, el orden de la plantilla); el refresco con `refresh="keep"` no mueve la rejilla (Δ0 del primer producto).
