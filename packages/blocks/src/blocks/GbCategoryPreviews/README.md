# GbCategoryPreviews · GbCategoryPreviews01, GbCategoryPreviews02 y GbCategoryPreviews03

Las puertas de la tienda: **cada categoría con una foto de lo que hay dentro y cuánto hay**, para entrar a lo que se busca en un toque. La cuenta va con el nombre y se lee en el enlace; una categoría vacía no engaña: se queda a la vista con «Vuelve pronto» y no es enlace. Compone `GSection`, `GAdaptiveLayout`, `GStack`, `GCard`, `GBtn` y `GIcon`; no trae color, CSS ni textos propios, y no necesita ninguna entrada extra de `@grana/vue`.

**Etiquetas:** `<gb-category-previews-01>`, `<gb-category-previews-02>`, `<gb-category-previews-03>` · **Estado:** `candidate` (ver «Verificación») · **Desde:** `0.0.0` (paquete privado, aún sin publicar) · **Entrada:** `@grana/blocks/ecommerce`

```js
import { GbCategoryPreviews01, GbCategoryPreviews02, GbCategoryPreviews03 } from '@grana/blocks/ecommerce'
```

> `@grana/blocks` es privado (`0.0.0`) y no se publica con la beta `0.1.0` de `@grana/vue`. Por ahora se usa desde el repositorio (banco real en `packages/blocks/playground/ecommerce/category-previews.html`). Exige `@grana/vue` (peer, `>=0.1.0-beta.0 <1.0.0`) y Vue `^3.5.0`; esta sección no compone ninguna entrada propia de `@grana/vue` (`/price`, `/gallery`…). Reglas comunes e instalación: [`packages/blocks/README.md`](../../../README.md#ecommerce).

## Qué lo hace distinto

**Cada puerta dice cuánto hay detrás y ninguna lleva a una sala vacía** (DECISIONS #917). La cuenta va con el nombre (la plantilla de `labels` compone el título entero: «{name} · {count} piezas» da «Barro negro · 24 piezas»), se lee en el nombre del enlace y se formatea en el idioma de la página. Una categoría sin existencias se queda a la vista con «Vuelve pronto» en lugar de un enlace a «0 resultados», que en el teléfono cuesta un viaje y una vuelta atrás. Sin `count` no se sabe cuántas hay y la tarjeta es enlace. La tira enseña muchas categorías sin un carrusel que se mueva solo.

## Las tres variantes

Las tres reciben la misma `interface Props` (`GbCategoryPreviewsProps`, el mismo objeto `props` de `props.js`). Lo que una variante no usa, lo ignora en silencio.

| Variante | Concepto | Compone | Ignora |
| --- | --- | --- | --- |
| `GbCategoryPreviews01` | Puertas con foto: tarjetas iguales, foto arriba y el nombre debajo | `GSection` > `GAdaptiveLayout role="list"` > `div role="listitem" class="g-adapt-standard"` > `GCard as="div" mediaPosition="top"` | — |
| `GbCategoryPreviews02` | Tira: tarjetas más bajas con el nombre sobre la foto, muchas en poco alto | `GSection` > `GAdaptiveLayout role="list"` > `div role="listitem" class="g-adapt-standard"` > `GCard as="div" mediaPosition="background" density="compact" titleLines="none"` (velo de `GCard`) | `description` |
| `GbCategoryPreviews03` | Lista con cuenta: una lista de nombres con su cuenta, sin foto, para un menú de la tienda | `GSection` > `GStack as="ul" gap="sm"` > `GCard as="li" level="flat" density="compact"` con la cuenta en el título | `media` |

**La tira no es un carrusel:** «tira» es la forma de la tarjeta, no un desplazamiento. Las tarjetas se reparten en filas con `GAdaptiveLayout`; nada se desplaza de lado ni avanza solo.

**`titleLines="none"` (EC-B1):** en 02 el título lleva el dato (la cuenta, el motivo de la vacía, la marca de externo), así que no se recorta a dos líneas: lo que importa no se pierde a la vista.

**La categoría (común):** `GCard` con `title` = `category.name`, el nombre con `lang` si lo trae, y el título entero (nombre y cuenta) lo compone tu aplicación en `labels.count` y `labels.empty` con `{name}` (el bloque no escribe separadores; sin `{name}` se pinta el nombre solo y avisa CP2), porque `GCard` nombra su enlace solo con el título. La foto (`media`) es decorativa. **Vacía** (`count: 0`): la tarjeta queda sin interacción y dice `labels.empty` en el lugar de la cuenta. **Externa** (`external`): enlace que abre en otra pestaña, con la marca y `labels.external` dentro del título (nunca emite `navigate`). **La acción de la sección** (`action`, por ejemplo «Ver toda la tienda») es un `GBtn outline` al final del cuerpo, después de las puertas.

## Recetas

### La vacía no abre nada

```vue
<!-- Fragmento: `fotoBarroVerde` es de tu aplicación -->
<GbCategoryPreviews01
  title="Recorre la tienda"
  :categories="[{ name: 'Barro verde', href: '/tienda/barro-verde', media: fotoBarroVerde, count: 0 }]"
  :labels="{ count: '{name} · {count} piezas', empty: '{name} · Vuelve pronto', external: 'se abre en otra pestaña' }"
/>
```

Con `count: 0` la tarjeta no es un enlace, aunque lleve `href`: la persona ve «Barro verde · Vuelve pronto» y no pierde un viaje con datos móviles.

### Una cuenta en el idioma de tu tienda

`labels.count` es una plantilla con `{name}` y `{count}` (la cuenta sale con `Intl` y agrupación del idioma) o una función `(name, count) => string` para el plural; `labels.empty` es una plantilla con `{name}` o una función `(name) => string`:

```js
const labels = {
  count: (name, n) => `${name} · ${n} ${n === 1 ? 'pieza' : 'piezas'}`,
  empty: '{name} · Vuelve pronto',
  external: 'se abre en otra pestaña'
}
```

## Uso

```vue
<!-- Fragmento: `fotos` y `irA` son de tu aplicación -->
<script setup>
import { GbCategoryPreviews01 } from '@grana/blocks/ecommerce'

const categorias = [
  { id: 'mezcal', name: 'Mezcal', href: '/tienda/mezcal', media: fotos.mezcal, count: 18 },
  { id: 'textiles', name: 'Textiles', href: '/tienda/textiles', media: fotos.textiles, count: 32,
    description: 'Rebozos, huipiles y tapetes teñidos con grana cochinilla y añil.' },
  { id: 'barro-verde', name: 'Barro verde', href: '/tienda/barro-verde', media: fotos.plato, count: 0 },
  { id: 'mercado', name: 'Mercado de la cooperativa', href: 'https://cooperativa-tlacolula.example/',
    external: true, media: fotos.mercado }
]

const labels = { count: '{name} · {count} piezas', empty: '{name} · Vuelve pronto', external: 'se abre en otra pestaña' }
</script>

<template>
  <GbCategoryPreviews01
    title="Recorre la tienda"
    description="Lo que hacen los talleres y palenques de los Valles Centrales."
    :categories="categorias"
    :action="{ label: 'Ver toda la tienda', href: '/tienda' }"
    locale="es-MX"
    :labels="labels"
    @navigate="({ event, href }) => { event.preventDefault(); irA(href) }"
  />
</template>
```

`media` es un objeto `{ src, alt, width, height }`; si falta, la categoría se pinta sin foto y avisa CP1.

## Ejemplos

### e1 · Las puertas de la portada (`GbCategoryPreviews01`)

**Por qué:** cuando la portada de la tienda tiene de cuatro a ocho categorías con foto. Las tarjetas miden lo mismo en cada fila y la cuenta ayuda a elegir. Con más de doce, el bloque avisa (C7) y pinta todas.

```vue
<!-- Fragmento: `categorias` y `labels` son de tu aplicación -->
<GbCategoryPreviews01 title="Recorre la tienda" :categories="categorias" :labels="labels" />
```

### e2 · Una tira de muchas categorías (`GbCategoryPreviews02`)

**Por qué:** cuando hay muchas categorías en poco alto y el nombre sobre la foto basta. El texto se mide sobre píxeles reales (peor caso 12,48:1) y no se recorta.

```vue
<!-- Fragmento: `categorias` y `labels` son de tu aplicación -->
<GbCategoryPreviews02 title="Categorías" :categories="categorias" :labels="labels" />
```

### e3 · Un menú de la tienda con su cuenta (`GbCategoryPreviews03`)

**Por qué:** cuando la lista es navegación y no escaparate (un pie de página, una columna de filtros). Sin foto, cada renglón es el nombre y su cuenta.

```vue
<!-- Fragmento: `categorias` y `labels` son de tu aplicación -->
<GbCategoryPreviews03 title="Categorías" :categories="categorias" :labels="labels" />
```

### e4 · Salir de la tienda sin que parezca la misma

**Por qué:** cuando una categoría vive en otro sitio (la cooperativa). `external: true` abre otra pestaña, la marca va dentro del título con `labels.external` y la aplicación no recibe `navigate` (decide el navegador, #574).

```vue
<!-- Fragmento: `fotoMercado` y `labels` son de tu aplicación -->
<GbCategoryPreviews01
  title="Más lugares"
  :categories="[{ name: 'Mercado de la cooperativa', href: 'https://cooperativa-tlacolula.example/', external: true, media: fotoMercado }]"
  :labels="labels"
/>
```

## Props

Una sola interfaz para las tres variantes (`GbCategoryPreviewsProps`). Los tipos de datos salen de `@grana/blocks/ecommerce`.

| Prop | Tipo | Descripción |
| --- | --- | --- |
| `title` | `string` (requerida) | El título de la sección (de la `GSection`). |
| `description` | `string` | Descripción de la `GSection`; el slot `description` la sustituye. 02 la ignora en las tarjetas. |
| `categories` | `Category[]` (requerida) | 1 a 12 (C7 por encima de 12); sin `name` o sin `href` se omite (C2); `count: 0` = vacía (sin enlace, `labels.empty`). |
| `action` | `Action` | «Ver toda la tienda»: la única acción de la sección, secundaria (`outline`), al final del cuerpo. |
| `locale` | `string` | Formato de la cuenta; sin él, el `lang` del ancestro al montar. |
| `labels` | `CategoryPreviewsLabels = {}` | `count` (con alguna `count` mayor que 0; plantilla con `{name}` y `{count}` o función `(name, count)`), `empty` (con alguna `count: 0`; plantilla con `{name}` o función `(name)`) y `external`; sin valores por defecto (C5); sin `{name}` se pinta el nombre solo (CP2). |

## Eventos

| Evento | Carga | Cuándo |
| --- | --- | --- |
| `navigate` | `{ event, href, item }` (`BlockNavigate<Category \| Action>`) | La tarjeta-enlace de una categoría o el enlace de `action`, con clic primario; nunca con `external` (reemite el de `GCard`, #505, #574) |
| `activate` | `{ event, item: action }` (`BlockActivate<Action>`) | `action` sin `href` |

## Slots

| Slot | Alcance | Qué va |
| --- | --- | --- |
| `category` | `{ category: Category }` | Escape: contenido extra al final del cuerpo de la tarjeta |
| `description` | — | Sustituye a la prop `description` de la `GSection` |

## Textos (`labels`)

| Clave | Requerido |
| --- | --- |
| `count` | Sí, con alguna categoría con `count` mayor que 0 (C5; sin él, sin cuenta). Plantilla con `{name}` y `{count}` (con `Intl` y agrupación) o función `(name, count) => string`. Sin `{name}` se pinta el nombre solo (CP2) |
| `empty` | Sí, con alguna `count: 0` (C5). Plantilla con `{name}` (p. ej. «{name} · Vuelve pronto») o función `(name) => string`; sin `{name}` se pinta el nombre solo (CP2) |
| `external` | Sí, con una categoría o `action` externa (C5) |

## Teclado y foco

| Tecla | Efecto |
| --- | --- |
| `Tab` | Una parada por categoría con enlace (las vacías no tienen) y una en `action` |
| `Intro` | Navega por el enlace; en `action` sin `href`, emite `activate` |

## Accesibilidad

Cifras de la auditoría de coco ([`design/lab/blocks/ecommerce/auditoria.md`](../../../../../design/lab/blocks/ecommerce/auditoria.md)), tres motores, tres temas, claro y oscuro (`medido`):

a. La lista es real (`role="list"` con `listitem`, o `ul`); cada tarjeta-enlace se nombra con el nombre y la cuenta («Barro negro · 24 piezas») y la vacía no es enlace (`prueba`, Vitest; `medido`).
b. La foto es decorativa. El texto de 02 sobre la foto, medido **por píxeles**: peor 12,48:1 con el velo de `GCard` (mínimo exigido 4,5:1).
c. Sin recorte del título a la vista en 02 ni en 01 a 390, tras fijar `titleLines="none"` y la pista (EC-B1, EC-B3): verificador de coco corrido por bruno tras su remate, 3 266 de 3 275 en la familia con los 9 fallos restantes solo de PO-L1, CR-L1 y CK-L1 (DECISIONS #945; `medido`).
d. Sin desplazamiento horizontal a 1440, 390, 320 ni a 320 con el texto al 200 %; nada fuera de su tarjeta.
e. Ningún `h1`; el título de cada tarjeta baja un nivel por anidación.

> **Peligro.** Una categoría con `count: 0` **no es un enlace**, aunque lleve `href`. Si tu aplicación no sabe el número, no lo pongas en `0`: omite `count` (la tarjeta será enlace sin cuenta). Y sin `labels.count` con categorías con `count`, la cuenta no se pinta (C5): la persona no sabe cuánto hay detrás.

## Personalidad

Nada se mueve: ni la tira ni las tarjetas animan nada propio, y no hay carrusel. La personalidad es la de la puerta honesta (#917): la cuenta en el nombre del enlace y la sala vacía que se dice sin abrirla. Con movimiento reducido no cambia nada.

## Avisos de desarrollo

Prefijo `[Grana GbCategoryPreviews<NN>]`, una vez por instancia y motivo, solo en desarrollo. Los comunes (C1 a C8, EC1 a EC7) están en [`packages/blocks/README.md`](../../../README.md#avisos-comunes-de-ecommerce). El propio:

| Código | Motivo | Qué pasa |
| --- | --- | --- |
| CP1 | Una categoría sin `media` en 01 o 02 | Se pinta sin foto; la tarjeta no reserva un hueco vacío |
| CP2 | `labels.count` o `labels.empty` sin `{name}` | Se pinta el nombre solo, sin la cuenta ni «Vuelve pronto» |

## Banco de datos de ejemplo

`category-previews.bank.js` exporta `{ props }` con Barro y Agave: Mezcal (`count` 18), Textiles (32, con `description`), Barro negro (24), Barro verde (`count: 0`, la vacía), Cocina oaxaqueña (con `description` y sin `count`), una en inglés con `lang="en"` («Gifts», 1 240 y con la palabra larga sin espacios de la prueba de 320 px) y una externa (el mercado de la cooperativa); `action` «Ver toda la tienda»; `labels` `{ count: '{name} · {count} piezas', empty: '{name} · Vuelve pronto', external }`. Con él ninguna variante avisa. Banco real: `packages/blocks/playground/ecommerce/category-previews.html`.

## Peso

`dist/ecommerce.js` pesa **49 557 B gzip** con sus trozos compartidos (`medido` con `node packages/blocks/scripts/measure-entry.mjs ecommerce`, 2026-10-28); tope de la entrada **51 200 B** (DECISIONS #932; no se vuelve a subir). Una variante importada sola (`node packages/blocks/scripts/measure-partial.mjs 7168 ecommerce GbCheckout=9728 +cartTotals=2048`): `GbCategoryPreviews01` 3 481 B, `GbCategoryPreviews02` 3 509 B, `GbCategoryPreviews03` 3 466 B; tope por variante **7 168 B** (#932). `@grana/vue` es *peer*: lo paga la aplicación.

## Alcance

- **No filtra ni cuenta:** `count` lo da tu aplicación; el bloque no suma ni consulta existencias (#911).
- **Sin carrusel ni avance solo:** la «tira» reparte filas; si quieres desplazamiento horizontal, es de tu aplicación.
- **Límite aceptado EC-N1 (#904):** en 01, la última tarjeta sola de la fila ocupa más ancho que las demás (reparto de `GAdaptiveLayout`, como BK-L7 de Booking). Para un tope, monta el bloque en una columna de lectura (`GContainer width="reading"`).
- **Límite de la cuenta:** el título entero (nombre y cuenta) lo compone tu aplicación con `labels` (`{name}` y `{count}`, #928). El bloque no escribe separadores: si la plantilla omite `{name}`, se pinta el nombre solo (aviso CP2). Ver «Verificación».
- **`Category.lang` (#885, #891):** si el nombre no está en el idioma de la página, `lang` va a su `span` y los `labels` que pinta se esperan en ese idioma.
- **Sin CSS ni utilidades** (#763, #807).

## Verificación

| Qué | Resultado | Nivel |
| --- | --- | --- |
| Vitest de `GbCategoryPreviews` (lista real con un `listitem` por categoría; cuenta con `Intl` en el título; `count: 0` sin enlace y con `labels.empty`; 02 con `mediaPosition="background"`; 03 sin `media`; avisos CP1, CP2, C5, C7 y C1) | `npm test -w @grana/blocks` pasa **1 463 de 1 463** en 40 archivos (todo el paquete, 2026-10-26) | `prueba` |
| Auditoría de coco: 01, 02 y 03; texto de 02 sobre foto por píxeles (12,48:1); títulos sin recorte a la vista tras EC-B1 y EC-B3; veredicto `candidate` tras el remate de bruno | Al auditar (0aa51df): Chromium 3 248 de 3 275, Firefox 3 189 de 3 216, WebKit 3 188 de 3 216, con EC-B1 y EC-B3 abiertos; tras el remate de bruno (b663be5), 3 266 de 3 275 en la familia y EC-B1 y EC-B3 cerrados (#945) | `medido` |

**No verificado:** lector de pantalla real (el nombre «Barro negro · 24 piezas» del enlace); `forced-colors` real; teléfono real; fotos reales (el banco usa SVG con degradado y una foto clara real se medirá con la aplicación).

**Pendientes abiertos:** (1) **pista de 02** (el contrato dice `g-adapt-short`; el `meta.json` y el código usan `g-adapt-standard` tras EC-B3; derivado a lima para alinear el contrato); (2) EC-N1; los generales, en [`PENDIENTES.md`](../../../../../PENDIENTES.md).

## Fuentes

- Contrato: [`design/contracts/blocks/category-previews.md`](../../../../../design/contracts/blocks/category-previews.md) y [`_comun.md`](../../../../../design/contracts/blocks/_comun.md) (§26 a §39).
- Decisiones: #909 a #914, #917, #928, #932 en `DECISIONS.md`.
- Metadatos: [`GbCategoryPreviews.meta.json`](./GbCategoryPreviews.meta.json). Pruebas: [`GbCategoryPreviews.test.js`](./GbCategoryPreviews.test.js). Auditoría: [`design/lab/blocks/ecommerce/auditoria.md`](../../../../../design/lab/blocks/ecommerce/auditoria.md).
