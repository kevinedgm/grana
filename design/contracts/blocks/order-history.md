# Contrato · Order history (`GbOrderHistory01` · `02` · `03`)

**Dueño:** lima · **Estado:** contratado (DECISIONS.md #909 a #914 y #924, 2026-10-23) · **Plan:** E10 (§4.2) · **Entrada:** `@grana/blocks/ecommerce` · **Común:** `_comun.md` §1 a §5 y §26 a §38 · **Compone:** `GSection`, `GTable` (`rowHref`, `activatable`, `detail`, `rowStatus`), `GCard`, `GStack`, `GAdaptiveLayout`, `GStepper` (informativo), `GBadge`, `GPrice` + `GPriceScope`, `GText`, `GBtn`, `GPagination`, `GEmpty`, `GLoadRegion` (`@grana/vue/load-region`) · **Parte de bruno:** C

## Promesa

Tus pedidos: **cuándo los hiciste, qué estado tienen dicho en palabras y con su fecha, cuánto costaron y dónde seguirlos**; uno se abre en un toque.

## Props

```ts
interface GbOrderHistoryProps {
  title: string                        // «Tus pedidos»
  orders: Order[]                      // la página (0 a 50)
  total?: number; page?: number; pageSize?: number   // v-model:page
  loading?: boolean; error?: boolean | string
  prices?: PriceRegion                 // si todos los pedidos son de una moneda (EC1 si hay más de uno y falta)
  timeZone?: string
  locale?: string
  labels: {
    reference: string                  // columna y rótulo («Pedido»)
    date: string                       // «Fecha»
    status: string                     // «Estado»
    total: string                      // «Total»
    count: string | ((count: number) => string)   // «{count} piezas»
    open: string | ((reference: string) => string) // nombre de la puerta («Ver el pedido {reference}»)
    tracking?: string                  // «Seguir el envío» (con tracking)
    progress?: string | ((reference: string) => string)   // nombre del GStepper («Seguimiento del pedido {reference}»)
    detail?: string                    // a GTable labels.detail (01, con lines)
    empty: { title: string; description?: string }
    table?: GranaLabels                // a GTable (results, loading, failed, retry, range…)
    region?: GranaLabels               // a GLoadRegion (02, 03)
    pagination?: GranaLabels
    price?: PriceLabels & { legend?: string }
    external?: string
  }
}
```

## Piezas (comunes)

- **El estado** (`status`, `statusText`): `GBadge` (`variant="soft"`, `size="sm"`) con **el texto** de la aplicación (`statusText`: «Enviado») y el color por estado (`pending`/`paid`/`preparing` → `neutral`; `shipped` → `info`; `delivered` → `success`; `cancelled`/`returned` → `warning`): **el color nunca es la única señal** (1.4.1), el texto lo dice. Con `note` («Llega el lunes 16»), al lado en `GText size="body-sm"`.
- **El seguimiento** (`progress`, 02): `GStepper` **informativo** (`navigation="none"`, `orientation="horizontal"`, `responsive="auto"`, `indicator="dot"`, `modelValue` = `progress.current`, `label` = `labels.progress(reference.code)`; cada paso con su fecha en `description` como texto de `Intl`), como Confirmation 02 (#873): un pedido es un proceso que avanza. **Cancelado o devuelto**: sin `GStepper` (no avanza), el estado en texto.
- **El transportista** (`tracking`, `NavLink` normalmente externo): `GBtn variant="link"` `labels.tracking` con marca externa y `labels.external` (§3; sin `navigate`, #574).
- **Abrir un pedido**: con `href`, enlace (`navigate`); sin él, botón que emite **`open { event, order }`**.
- **Fechas** en `<time datetime>` con `Intl` en la zona de la tienda; importes con `GPrice` (`total` del pedido) dentro de un `GPriceScope` si hay `prices`; un pedido en otra moneda conserva su código (regla `auto`) y `approximate` si lo trae.

## Variantes

| Variante | Concepto | Compone | Ignora |
| --- | --- | --- | --- |
| **01 · Tabla** | Una tabla para la cuenta en escritorio; tarjetas en estrecho (las de `GTable`) | `GSection` › `GPriceScope` › `GTable` (`columns`: referencia (principal, `title`), fecha (`format` con `Intl`), estado (slot `cell-status` con `GBadge`), piezas, total (`align="end"`, slot con `GPrice`); `rows` = `orders`, `rowKey: 'id'`; **`rowHref`** = `order.href`, **`activatable`** si alguno no tiene `href` (→ `open`); slot **`detail`** con lo comprado (`lines`) si los pedidos lo traen; **`rowStatus`** para `cancelled`/`returned` (`{ status: 'warning', text: statusText }`); `loading`, `error`, `page`/`pageSize`/`total` → paginación de `GTable`; `labels` = `labels.table` con `labels.pagination` y `detail`) | `labels.progress`, `labels.region` |
| **02 · Tarjetas con seguimiento** | Cada pedido en su tarjeta con su seguimiento, para el teléfono | `GSection` › `GPriceScope` › `GLoadRegion` (`labels.region`) › `GStack as="ul" gap="md"` › `GCard as="li"` (`interaction` link o button; `title` = `reference.code`, `subtitle` = la fecha, `badge` = `statusText` con `badgeColor` por estado, `meta` = las piezas) con el total en `GPrice` (el `meta` de `GCard` es solo texto), el `GStepper` y el transportista en el cuerpo + `GPagination` | `labels.detail`, `labels.table` |
| **03 · Lista** | Una lista compacta: referencia, fecha, estado y total en una línea por pedido | `GSection` › `GPriceScope` › `GLoadRegion` › `GStack as="ul" gap="sm"` › `GCard as="li" level="flat" density="compact"` (título, fecha, estado, total) + `GPagination` | `progress`, `lines`, `labels.progress`/`detail`/`table` |

## Eventos

| Evento | Carga | Cuándo |
| --- | --- | --- |
| `open` | `{ event, order }` | Abrir un pedido sin `href` |
| `navigate` | `{ event, href, item: order }` | Abrir un pedido con `href` (01: la puerta de `GTable`; 02, 03: la tarjeta) |
| `update:page` | `number` | Paginación |
| `retry` | `{ event }` | «Reintentar» de `GTable` (01) o `GLoadRegion` (02, 03) |

## Slots

`order` `{ order }` (escape: contenido al final de cada pedido; en 01, al final del `detail`), `empty` (escape del vacío).

## Estructura accesible

`GSection` con título; 01 es una tabla con `caption` (`title`) y su puerta por fila (`rowHref`/`activatable`, #598) nombrada `labels.open(reference)`; 02 y 03, listas reales de tarjetas con nombre; el estado es texto en un `GBadge`; el seguimiento de 02 es un `GStepper` con nombre que **no** es navegable (informativo); las fechas en `time`. Sin `h1`.

## Qué lo hace distinto (#924)

**El estado se dice en palabras y con su fecha, y lo siguiente está a un toque.** «Enviado · llega el lunes 16 de noviembre», no un punto verde; el seguimiento de 02 enseña en qué paso va y cuándo pasó cada uno, en la hora de la tienda; el enlace del transportista está en la propia tarjeta. Un pedido cancelado no finge avanzar: no lleva pasos, lleva su estado. En la tabla, cada fila se abre con su puerta y lo comprado se despliega sin salir de la lista.

## Textos (`labels`)

| Clave | Requerido |
| --- | --- |
| `reference`, `date`, `status`, `total`, `count`, `open`, `empty` | Sí (C5) |
| `tracking` | Sí, con algún `tracking` (C5) |
| `progress` | Sí, en 02 con algún `progress` (C5) |
| `detail` | Sí, en 01 con `lines` (C5; lo pide `GTable`) |
| `table`, `region`, `pagination`, `price` | Los de cada componente (avisan ellos) |
| `external` | Sí, con `tracking` externo (C5) |

## Avisos propios (`[Grana GbOrderHistory<NN>]`)

C3, C5, C6, EC1, EC5. Además: **OH1** · `status` fuera de la lista (se pinta `neutral` con su `statusText`), **OH2** · `progress.current` que no está en sus `steps` (sin `GStepper`).

## Banco (`order-history.bank.js`)

Cinco pedidos de Barro y Agave: pendiente de pago, en preparación, enviado (con `progress` de cuatro pasos y `tracking` externo), entregado, cancelado; uno en USD con `approximate`; tres con `lines`, uno sin `href`; `total` 12, `pageSize` 5; `prices` MXN; `labels` completos. Estados: `loading`, `error`, vacío.

## Verificación propia

Vitest: el estado con su texto y su color de la tabla de arriba; cancelado sin `GStepper`; `GStepper` con `navigation="none"`; `rowHref` y `activatable` en 01 con `open` para el pedido sin `href`; el `detail` con lo comprado; el pedido en USD con su código; `time` con `datetime` en la zona de la tienda. Chromium: 01 como tabla a 1440 y como tarjetas de `GTable` a 390; 02 con el seguimiento sin desbordar a 320.
