# GbOrderHistory · GbOrderHistory01, GbOrderHistory02 y GbOrderHistory03

Tus pedidos: **cuándo los hiciste, qué estado tienen dicho en palabras y con su fecha (nunca solo un color), cuánto costaron y dónde seguirlos**. Uno se abre en un toque; un pedido cancelado no finge avanzar: no lleva pasos, lleva su estado. Compone `GSection`, `GTable`, `GCard`, `GStack`, `GStepper` (informativo), `GBadge`, `GPrice` y `GPriceScope` (`@grana/vue/price`), `GText`, `GBtn`, `GPagination`, `GEmpty` y `GLoadRegion` (`@grana/vue/load-region`); no trae color, CSS ni textos propios.

**Etiquetas:** `<gb-order-history-01>`, `<gb-order-history-02>`, `<gb-order-history-03>` · **Estado:** `candidate` (ver «Verificación») · **Desde:** `0.0.0` (paquete privado, aún sin publicar) · **Entrada:** `@grana/blocks/ecommerce`

```js
import { GbOrderHistory01, GbOrderHistory02, GbOrderHistory03 } from '@grana/blocks/ecommerce'
```

> `@grana/blocks` es privado (`0.0.0`) y no se publica con la beta `0.1.0` de `@grana/vue`. Por ahora se usa desde el repositorio (banco real en `packages/blocks/playground/ecommerce/order-history.html`). Exige `@grana/vue` (peer, `>=0.1.0-beta.0 <1.0.0`) y Vue `^3.5.0`. Además de `@grana/vue`, la aplicación carga las entradas que esta sección compone: `@grana/vue/price` y `@grana/vue/load-region`. Reglas comunes e instalación: [`packages/blocks/README.md`](../../../README.md#ecommerce).

## Qué lo hace distinto

**El estado se dice en palabras y con su fecha, y lo siguiente está a un toque** (DECISIONS #924). «Enviado · llega el lunes 16 de noviembre», no un punto verde; el seguimiento de 02 enseña en qué paso va y cuándo pasó cada uno, en la hora de la tienda; el enlace del transportista está en la propia tarjeta. **Un pedido cancelado no finge avanzar:** sin `GStepper`, con su estado en texto. En la tabla, cada fila se abre con su puerta y lo comprado se despliega sin salir de la lista, con «Ver el pedido» al final de la ficha (#939). Lo comprado se dice con las mismas palabras que la ficha y el carrito: la elección viaja.

## Las tres variantes

Las tres reciben la misma `interface Props` (`GbOrderHistoryProps`, el mismo objeto `props` de `props.js`). Lo que una variante no usa, lo ignora en silencio.

| Variante | Concepto | Compone | Ignora |
| --- | --- | --- | --- |
| `GbOrderHistory01` | Tabla: una tabla para la cuenta en escritorio; tarjetas en estrecho (las de `GTable`) | `GSection` > `[GPriceScope]` > `GTable` (`caption` = `title`; columnas pedido, fecha, estado, piezas y total; `rowHref` o `activatable` sin lo comprado; slot `detail` con lo comprado; `rowStatus` en los cancelados) | `labels.progress`, `labels.region` |
| `GbOrderHistory02` | Tarjetas con seguimiento: cada pedido en su tarjeta con su seguimiento, para el teléfono | `GSection` > `[GPriceScope]` > `GStack gap="lg"` > `GLoadRegion` > `GStack as="ul" gap="md"` > `GCard as="li"` (insignia de estado, total, `GStepper` informativo y el transportista) + `GPagination` | `labels.detail`, `labels.table` |
| `GbOrderHistory03` | Lista: una lista compacta con referencia, fecha, estado y total en una línea por pedido | `GSection` > `[GPriceScope]` > `GStack gap="lg"` > `GLoadRegion` > `GStack as="ul" gap="sm"` > `GCard as="li" level="flat" density="compact"` + `GPagination` | `progress`, `lines`, `labels.progress`, `labels.detail` y `labels.table` |

**El estado.** `GBadge` `soft` con **el texto** de tu aplicación (`statusText`: «Enviado») y el color por estado: `pending`, `paid` y `preparing` en neutro; `shipped` en informativo; `delivered` en éxito; `cancelled` y `returned` en aviso. El color nunca es la única señal. Con `note` («Llega el lunes 16»), al lado. Un `status` fuera de la lista se pinta neutro con su `statusText` (OH1).

**El seguimiento (02).** `GStepper` **informativo** (`navigation="none"`, puntos, horizontal o vertical según el ancho) con la fecha de cada paso como texto de `Intl`, como en la confirmación de Booking: un pedido es un proceso que avanza. Los pasos y el actual los da tu aplicación (`progress`). **Cancelado o devuelto:** sin `GStepper`, el estado en texto.

**El transportista (`tracking`).** Un enlace `link` normalmente externo, con la marca y `labels.external`; nunca emite `navigate` (#574).

**Abrir un pedido.** Con `href`, es un enlace (`navigate`); sin él, un botón que emite `open`. Nombres (#939): la puerta de la tabla y el enlace de las tarjetas se nombran **con el código**; el contexto lo dan la columna y la lista con nombre. `labels.open(reference)` nombra solo «Ver el pedido» de la ficha de 01. **En 01 con `lines`** la puerta es la de divulgación del `detail` y `activatable` se ignora (#599).

## Recetas

### Un pedido en otra moneda

Un pedido en otra moneda conserva su código (regla `auto` de `GPrice`) y su `approximate`. La región `prices` se declara cuando todos son de una moneda; con más de una y sin región, el bloque avisa EC1:

```js
// Fragmento: un pedido de la tienda en dólares (aproximado) entre pedidos en pesos
const pedidoEnDolares = {
  id: 'BYA-2610-21',
  reference: { code: 'BYA-2610-21', label: 'Pedido' },
  placedAt: '2026-10-21',
  status: 'delivered',
  statusText: 'Entregado',
  total: { amount: 52, currency: 'USD', approximate: true },
  count: 1
}
```

### Recargar desde el servidor

El bloque no pide páginas: `loading`, `error` y `update:page` son de tu aplicación.

```vue
<!-- Fragmento: `pedidos`, `cargar` y `datos` son de tu aplicación -->
<script setup>
import { ref } from 'vue'
import { GbOrderHistory02 } from '@grana/blocks/ecommerce'

const page = ref(1)
</script>

<template>
  <GbOrderHistory02
    v-bind="datos"
    v-model:page="page"
    :loading="cargando"
    :error="fallo"
    @update:page="cargar"
    @retry="cargar"
  />
</template>
```

## Uso

```vue
<!-- Fragmento: `lineasPedido`, `priceLabels` e `irAlPedido` son de tu aplicación -->
<script setup>
import { GbOrderHistory01 } from '@grana/blocks/ecommerce'

const mxn = (amount) => ({ amount, currency: 'MXN' })

const historial = {
  title: 'Tus pedidos',
  orders: [
    {
      id: 'BYA-2611-07', reference: { code: 'BYA-2611-07', label: 'Pedido' }, placedAt: '2026-11-07',
      status: 'shipped', statusText: 'Enviado', total: mxn(4293), count: 4,
      href: '/cuenta/pedidos/BYA-2611-07', lines: lineasPedido, note: 'Llega el jueves 12 de noviembre'
    },
    {
      id: 'BYA-2610-03', reference: { code: 'BYA-2610-03', label: 'Pedido' }, placedAt: '2026-10-03',
      status: 'cancelled', statusText: 'Cancelado', total: mxn(480), count: 1,
      href: '/cuenta/pedidos/BYA-2610-03', note: 'Cancelado a petición tuya; el reembolso ya se hizo.'
    }
  ],
  total: 12, page: 1, pageSize: 5,
  prices: { currency: 'MXN', taxes: 'IVA incluido' },
  timeZone: 'America/Mexico_City',
  locale: 'es-MX',
  labels: {
    reference: 'Pedido', date: 'Fecha', status: 'Estado', total: 'Total',
    count: (n) => `${n} ${n === 1 ? 'pieza' : 'piezas'}`,
    open: 'Ver el pedido {reference}',
    tracking: 'Seguir el envío',
    detail: 'Pedido {title}',
    empty: { title: 'Todavía no tienes pedidos', description: 'Cuando compres algo, lo verás aquí con su estado y su seguimiento.' },
    table: { loading: 'Cargando tus pedidos…', results: '{count} pedidos', failed: 'No pudimos cargar tus pedidos', retry: 'Reintentar', range: 'Pedidos {from} a {to} de {total}' },
    pagination: { nav: 'Páginas de pedidos', previous: 'Página anterior', next: 'Página siguiente', page: 'Página {page}', range: 'Pedidos {from} a {to} de {total}', compact: 'Página {page} de {pages}' },
    price: priceLabels,
    external: 'se abre en otra pestaña'
  }
}
</script>

<template>
  <GbOrderHistory01 v-bind="historial" @navigate="({ event, href }) => { event.preventDefault(); irAlPedido(href) }" />
</template>
```

La aplicación carga además `@grana/vue/price` y `@grana/vue/load-region`, y registra los iconos Lucide que use (`createIcons`). En 02 y 03 se añaden `labels.region` (a `GLoadRegion`) y, en 02, `labels.progress` y `labels.stepper` (a `GStepper`).

## Ejemplos

### e1 · La cuenta como tabla (`GbOrderHistory01`)

**Por qué:** cuando la persona revisa muchos pedidos en escritorio y quiere compararlos por fecha, estado y total. En estrecho, la tabla se vuelve las tarjetas de `GTable`. Con `lines`, cada fila se despliega con lo comprado y «Ver el pedido» al final; sin `lines`, la puerta de la fila lleva al pedido.

```vue
<!-- Fragmento: `historial` es de tu aplicación -->
<GbOrderHistory01 v-bind="historial" />
```

### e2 · Tarjetas con seguimiento (`GbOrderHistory02`)

**Por qué:** cuando quien consulta lo hace desde el teléfono y lo que quiere saber es dónde va su pedido. Cada tarjeta enseña el estado, el total, los pasos con su fecha y el enlace del transportista.

```vue
<!-- Fragmento: `historial` es de tu aplicación (con `progress` y `tracking` en el pedido enviado) -->
<GbOrderHistory02 v-bind="historial" />
```

### e3 · Una lista compacta (`GbOrderHistory03`)

**Por qué:** cuando el historial es un resumen dentro de la cuenta (los últimos cinco pedidos). Una línea por pedido: referencia, fecha, estado y total.

```vue
<!-- Fragmento: `historial` es de tu aplicación -->
<GbOrderHistory03 v-bind="historial" />
```

### e4 · Un pedido sin página propia

**Por qué:** cuando el pedido solo se consulta en una hoja o un diálogo de tu aplicación. Sin `href`, la tarjeta o la fila es un botón y emite `open { event, order }`.

```vue
<!-- Fragmento: `historial` y `abrirPedido` son de tu aplicación -->
<GbOrderHistory02 v-bind="historial" @open="({ order }) => abrirPedido(order.id)" />
```

### e5 · Cargando, fallo y vacío

**Por qué:** cuando la lista no está lista. Con `loading` y sin pedidos, 02 y 03 muestran el molde de la tarjeta y 01 el de la tabla; con `error`, «Reintentar» (`retry`, `event: null`); sin pedidos, `labels.empty`.

```vue
<!-- Fragmento: `historial` y `cargar` son de tu aplicación -->
<GbOrderHistory02 v-bind="historial" :orders="[]" loading />
<GbOrderHistory02 v-bind="historial" :orders="[]" error="No pudimos cargar tus pedidos. Revisa tu conexión." @retry="cargar" />
<GbOrderHistory02 v-bind="historial" :orders="[]" :total="0" />
```

## Props

Una sola interfaz para las tres variantes (`GbOrderHistoryProps`). Los tipos de datos salen de `@grana/blocks/ecommerce`.

| Prop | Tipo | Descripción |
| --- | --- | --- |
| `title` | `string` (requerida) | «Tus pedidos»: título de la sección; en 01 también el `caption` de la tabla; en 02 y 03 el nombre de la región que carga. |
| `orders` | `Order[]` (requerida) | La página (0 a 50; C7 por encima). `id` obligatorio (EC5); sin `reference.code` o sin `statusText` se omite (C2); vacío: `GEmpty` con `labels.empty`. |
| `total` | `number` | Pedidos en total (paginación del servidor). |
| `page` | `number` | `v-model:page`. |
| `pageSize` | `number` | Pedidos por página; con `total`, la paginación. |
| `loading` | `boolean = false` | 01: el de `GTable`; 02 y 03: `GLoadRegion` (molde en la primera carga, lo último conocido al refrescar). |
| `error` | `boolean \| string = false` | El fallo de la última carga; con texto, ese texto. Con «Reintentar» → `retry`. |
| `prices` | `PriceRegion` | Si todos los pedidos son de una moneda; EC1 con más de un pedido y sin ella. Un pedido en otra moneda conserva su código. |
| `timeZone` | `string` | IANA de la tienda: las fechas se dicen en esa hora. |
| `locale` | `string` | BCP 47; sin él, el `lang` del ancestro al montar. |
| `labels` | `OrderHistoryLabels` (requerida) | `reference`, `date`, `status`, `total`, `count`, `open`, `empty` (C5); `tracking` con algún `tracking` (01, 02); `progress` en 02 con algún `progress`; `detail` en 01 con `lines`; `table`, `region`, `pagination`, `stepper` (02) y `price` a sus componentes; `external`. Sin valores por defecto. |

## Eventos

| Evento | Carga | Cuándo |
| --- | --- | --- |
| `open` | `{ event, order }` (`OrderOpen`) | Abrir un pedido sin `href`: la puerta de `GTable` (01 sin lo comprado), «Ver el pedido» de la ficha (01) o la tarjeta-botón (02, 03) |
| `navigate` | `{ event, href, item }` (`BlockNavigate<Order>`) | Abrir un pedido con `href`, con clic primario (#505): la puerta de `GTable` o «Ver el pedido» (01), la tarjeta (02, 03). El transportista externo no emite (#574) |
| `update:page` | `number` | Paginación (la de `GTable` en 01, `GPagination` en 02 y 03) |
| `retry` | `{ event: null }` (`BlockRetry`) | «Reintentar» de `GTable` (01) o de `GLoadRegion` y `GEmpty` (02, 03); `event: null` porque esos componentes emiten `retry` sin evento del DOM (#936) |

## Slots

| Slot | Alcance | Qué va |
| --- | --- | --- |
| `order` | `{ order: Order }` | Escape: contenido al final de cada pedido (en 01, al final de la ficha desplegada) |
| `empty` | — | Escape del vacío (sustituye al `GEmpty` con `labels.empty`) |

## Textos (`labels`)

| Clave | Requerido |
| --- | --- |
| `reference`, `date`, `status`, `total`, `count`, `open`, `empty` | Sí (C5). `open` es plantilla con `{reference}` o función `(reference) => string` |
| `tracking` | Sí, con algún `tracking` (C5) |
| `progress` | Sí, en 02 con algún `progress` (C5). Plantilla con `{reference}` o función |
| `detail` | Sí, en 01 con `lines` (C5; lo pide `GTable`) |
| `table`, `region`, `pagination`, `stepper`, `price` | Los de cada componente (avisan ellos) |
| `external` | Sí, con un `tracking` externo (C5) |

## Teclado y foco

| Tecla | Efecto |
| --- | --- |
| `Tab` | Recorre la puerta de cada pedido (fila o tarjeta), «Ver el pedido», el transportista y la paginación |
| `Intro` o `Espacio` | En la puerta de una fila con `detail`, despliega lo comprado; en un pedido con `href`, navega; en la tarjeta-botón, emite `open` |

El resto de las teclas de la tabla son las de `GTable` ([`GTable/README.md`](../../../../vue/src/components/GTable/README.md)).

## Accesibilidad

Cifras de la auditoría de coco ([`design/lab/blocks/ecommerce/auditoria.md`](../../../../../design/lab/blocks/ecommerce/auditoria.md)), tres motores, tres temas, claro y oscuro (`medido`):

a. 01 es una tabla con `caption` y su puerta por fila; 02 y 03, listas reales de tarjetas con nombre; el estado es texto en un `GBadge`, nunca solo color (1.4.1); las fechas van en `<time datetime>` (`prueba`).
b. El seguimiento de 02 es un `GStepper` con nombre que **no** es navegable (informativo); el cancelado no lo lleva (`prueba`).
c. Cargando, error con «Reintentar» y vacío con contraste de al menos 4,5:1.
d. A 320 con el texto al 200 % sin desplazamiento horizontal ni piezas fuera de su tarjeta (tras corregir EC-C3 en `GTable.css` y `GBadge.css`: la celda del estado con insignia y nota se parte en líneas; la insignia de texto encoge con su elipsis); 02 con el seguimiento sin desbordar a 320.
e. El contraste mínimo del texto de la familia es 4,51:1: la insignia «Entregado» (`GBadge` `success` suave) en oscuro con el tema por defecto, con 0,01 de margen (EC-N4).
f. Ningún `h1`; el título de la sección baja un nivel por anidación.

> **Peligro.** `statusText` es el estado que la persona **lee**; el `status` solo decide el color y si lleva pasos. Si tu aplicación envía `statusText: ''` o solo `status`, el pedido se omite (C2), no se dice con un color. Y `Order.id` es obligatorio (EC5): sin él se usa el índice y `open` o `navigate` devuelven un número que cambia con el orden.

## Personalidad

Nada se mueve: ni la tabla, ni las tarjetas, ni el seguimiento animan nada propio. Lo que se mueve es lo compuesto, con su movimiento reducido: el despliegue de la ficha de `GTable` y el molde de `GLoadRegion`. La personalidad es de contenido (#924): el estado en palabras con su fecha, y el cancelado que no finge avanzar.

## Avisos de desarrollo

Prefijo `[Grana GbOrderHistory<NN>]`, una vez por instancia y motivo, solo en desarrollo. Los comunes (C1 a C8, K3, K4, EC1 a EC7) están en [`packages/blocks/README.md`](../../../README.md#avisos-comunes-de-ecommerce). Los de esta sección: C2 (sin `reference.code` o `statusText`: se omite), C3, C5, C6 (sin puerta), C7 (más de 50), EC1, EC5. Los propios:

| Código | Motivo | Qué pasa |
| --- | --- | --- |
| OH1 | `status` fuera de la lista | Se pinta neutro con su `statusText` |
| OH2 | `progress.current` que no está en sus `steps` | Se pinta sin `GStepper` |

## Banco de datos de ejemplo

`order-history.bank.js` exporta `{ props, states }` con los cinco pedidos de Barro y Agave (`bank/ecommerce.js`): pendiente de pago, en preparación, enviado (con su seguimiento de cuatro pasos y el transportista externo), entregado (en USD aproximado y sin `href`: se abre con `open`) y cancelado; tres con `lines`; `total` 12 y `pageSize` 5; `prices` MXN y `labels` completos. `states` da `cargando`, `error` y `vacio` (`?estado=cargando|error|vacio`). Con él ninguna variante avisa. Banco real: `packages/blocks/playground/ecommerce/order-history.html`.

## Peso

`dist/ecommerce.js` pesa **49 328 B gzip** con sus trozos compartidos (`medido` con `node packages/blocks/scripts/measure-entry.mjs ecommerce`, 2026-10-26); tope de la entrada **51 200 B** (DECISIONS #932; no se vuelve a subir). Una variante importada sola (`node packages/blocks/scripts/measure-partial.mjs 7168 ecommerce GbCheckout=9728 +cartTotals=2048`): `GbOrderHistory01` 4 680 B, `GbOrderHistory02` 4 517 B, `GbOrderHistory03` 4 518 B; tope por variante **7 168 B** (#932). `@grana/vue` y sus entradas son *peer*: las paga la aplicación.

## Alcance

- **No pide pedidos ni los pagina:** `orders`, `total`, `loading` y `error` son de tu aplicación.
- **No inventa el estado:** los pasos del seguimiento y el actual los da tu aplicación (`progress`); el bloque no deduce «Enviado» de una fecha.
- **El transportista no navega por su cuenta:** el enlace externo abre en otra pestaña y no emite `navigate`.
- **Sin cancelar ni devolver:** esas acciones son de tu aplicación (`order` slot).
- **Sin CSS ni utilidades** (#763, #807).

## Verificación

| Qué | Resultado | Nivel |
| --- | --- | --- |
| Vitest de `GbOrderHistory` (el estado con su texto y su color; el cancelado sin `GStepper`; `GStepper` informativo con la fecha de cada paso; `rowHref` y `activatable` en 01 con `open` para el pedido sin `href`; con `lines`, «Ver el pedido» al final de la ficha y la puerta nombrada con el código; `retry` con `event: null`; el pedido en USD con su código; `time` con `datetime`; cargando, error y vacío; OH1, OH2, EC1 y EC5) | `npm test -w @grana/blocks` pasa **1 463 de 1 463** en 40 archivos (todo el paquete, 2026-10-26) | `prueba` |
| Auditoría de coco: 01 como tabla a 1440 y como tarjetas de `GTable` a 390; 02 con el seguimiento a 320; el caso de 320 al 200 % (EC-C3, corregido); `table-load`, `table-page-size` y `table-rows` en Chromium en verde y `design/lab/table/auditoria-rows-verificar.mjs` 499/499 | Familia: Chromium 3 248 de 3 275, Firefox 3 189 de 3 216 y WebKit 3 188 de 3 216 al auditar; 3 266 de 3 275 tras el remate de bruno (#945). Veredicto `candidate` | `medido` |

**No verificado:** lector de pantalla real (la puerta de cada fila, el estado y la ficha desplegada); `forced-colors` real y en Firefox y WebKit; teléfono real y puntero grueso; rendimiento con el perfilador. **Pendientes abiertos:** EC-N4 (contraste de la insignia «Entregado» en oscuro con 0,01 de margen); los generales, en [`PENDIENTES.md`](../../../../../PENDIENTES.md).

## Fuentes

- Contrato: [`design/contracts/blocks/order-history.md`](../../../../../design/contracts/blocks/order-history.md) y [`_comun.md`](../../../../../design/contracts/blocks/_comun.md) (§26 a §39).
- Decisiones: #909 a #914, #924, #932, #936, #939 en `DECISIONS.md`.
- Metadatos: [`GbOrderHistory.meta.json`](./GbOrderHistory.meta.json). Pruebas: [`GbOrderHistory.test.js`](./GbOrderHistory.test.js). Auditoría: [`design/lab/blocks/ecommerce/auditoria.md`](../../../../../design/lab/blocks/ecommerce/auditoria.md).
