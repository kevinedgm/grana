# GbOrderSummary · GbOrderSummary01, GbOrderSummary02 y GbOrderSummary03

Un pedido **leído como su recibo**: el código primero (lo que te piden si llamas), lo que compraste con la talla y el color tal como los elegiste, el desglose con el total como último renglón y lo incluido (el IVA) dicho después sin sumarlo otra vez, a dónde va con su fecha de entrega en la hora de la tienda y cómo se pagó. **No calcula nada**: pinta los `Totals` que recibe, vengan de [`cartTotals`](../../../README.md#carttotals) o de tu servidor. Compone `GCard`, `GSection`, `GStack`, `GAdaptiveLayout`, `GSummary`, `GMetric`, `GAvatar`, `GPrice` y `GPriceScope` (`@grana/vue/price`), `GText` y `GBtn`; no trae color, CSS ni textos propios.

**Etiquetas:** `<gb-order-summary-01>`, `<gb-order-summary-02>`, `<gb-order-summary-03>` · **Estado:** `candidate` (ver «Verificación») · **Desde:** `0.0.0` (paquete privado, aún sin publicar) · **Entrada:** `@grana/blocks/ecommerce`

```js
import { GbOrderSummary01, GbOrderSummary02, GbOrderSummary03 } from '@grana/blocks/ecommerce'
```

> `@grana/blocks` es privado (`0.0.0`) y no se publica con la beta `0.1.0` de `@grana/vue`. Por ahora se usa desde el repositorio (banco real en `packages/blocks/playground/ecommerce/order-summary.html`). Exige `@grana/vue` (peer, `>=0.1.0-beta.0 <1.0.0`) y Vue `^3.5.0`. Además de `@grana/vue`, la aplicación carga la entrada que esta sección compone: `@grana/vue/price`. Reglas comunes e instalación: [`packages/blocks/README.md`](../../../README.md#ecommerce).

## Qué lo hace distinto

**El pedido se lee como el recibo que te llega, con las mismas palabras que elegiste** (DECISIONS #923). El código va primero porque es lo que te piden si llamas; cada línea dice la talla y el color tal como los elegiste en la ficha (**la elección viaja**: son las mismas `ChosenOption` de `add`, del carrito y del historial); el total es el último renglón del desglose y lo que ya va incluido (el IVA) se dice después, sin sumarlo dos veces. La entrega se dice con su fecha en la hora de la tienda, nunca «mañana». Lo que el servicio no sabe todavía (un envío por calcular) se dice con `labels.pending`, no con un cero.

## Las tres variantes

Las tres reciben la misma `interface Props` (`GbOrderSummaryProps`, el mismo objeto `props` de `props.js`). Lo que una variante no usa, lo ignora en silencio.

| Variante | Concepto | Compone | Ignora |
| --- | --- | --- | --- |
| `GbOrderSummary01` | Tarjeta: lo esencial en una tarjeta para una columna: código, lo comprado, total y acciones | `GCard as="section"` > `GPriceScope` > `GStack gap="md"` (código, lo comprado, el total sin desglose) + acciones | El desglose (salvo las líneas con `amount: null`, que se dicen), `shipping.address`, la miniatura |
| `GbOrderSummary02` | El recibo: todo, en el orden del recibo, para la página de confirmación | `GSection` > `GPriceScope` > `GStack gap="lg"` (código, fecha, lo comprado con miniatura, desglose y total, pago, envío, nota) + acciones | — |
| `GbOrderSummary03` | Línea: una línea compacta en lo alto de un paso o de una lista | `GText as="div" size="body" role="group"` (`aria-label` = `title`) > `GPriceScope` (sin leyenda) > `GStack` > `GAdaptiveLayout gap="md" vertical="center"` > `GSummary layout="inline"` (código y piezas) + `GPrice size="sm"` del total + la primera acción `outline`, y debajo la leyenda de la moneda en su propio renglón | Lo comprado línea a línea, el desglose, el envío, el pago y la segunda acción |

**03 se parte según el ancho** (comportamiento contratado, no defecto): una línea a 1024 o más, dos a 768 y bloques apilados a 390 o menos. **La leyenda de la moneda de 03** va en su propio renglón **bajo** la línea, dentro del mismo grupo, y no entre las piezas: la línea queda en una fila y el total no baja de la acción (EC-L1, DECISIONS #943).

**Las piezas (comunes).** **El código** (`order.reference`): un `GMetric` con su rótulo (`reference.label` o `labels.reference`), primero. **Lo comprado:** una lista con nombre `labels.lines` y un renglón por línea: el nombre (enlace si hay `href`), la elección en palabras («Talla M · Grana»), la cantidad (`labels.quantity`) y el importe de la línea con `GPrice`; la miniatura solo en 02, decorativa. **El desglose y el total:** un `dl` con las líneas de `Totals` no incluidas, el total como **último par** y las incluidas después («Incluye IVA $578.48»); una línea con `amount: null` dice `labels.pending`. **Envío y pago:** `shipping` en `address` con el método, la fecha de entrega en `<time>` (`labels.delivery`) y la nota; `payment` es un texto tuyo («Tarjeta terminada en 4242», nunca el número). **La fecha del pedido** (`placedAt`) en `<time>` y en la zona de la tienda.

## Recetas

### La elección que viaja

La talla y el color que se eligieron en la ficha son las mismas `{ key, label, value }` del principio al final: `add` las entrega ya dichas (`options`), la línea del carrito las conserva (`CartLine.options`) y el pedido las lleva en cada `OrderLine.options`. Ninguna sección las vuelve a redactar:

```js
// Fragmento: `agregar`, `pedido` y `pedirAlServidor` son de tu aplicación
function agregar({ product, variant, quantity, options }) {
  // options: [{ key: 'talla', label: 'Talla', value: 'M' }, { key: 'color', label: 'Color', value: 'Grana' }]
  carrito.push({ id: crypto.randomUUID(), product, variant: variant?.id, options, quantity, unitPrice: precioDe(variant ?? product) })
}

// El pedido que confirma el servidor devuelve las mismas options en cada línea
const lineas = pedido.lines.map((l) => ({ id: l.id, name: l.name, options: l.options, quantity: l.quantity, total: l.total }))
```

`GbOrderSummary` dice «Talla M · Color Grana» con las mismas palabras que la ficha, el carrito y el historial.

### `cartTotals` o el servidor

El bloque pinta los mismos `Totals` venga de donde venga. Si tu servidor ya calcula el total con su regla fiscal, pasa su `Totals`; si no, llama a [`cartTotals`](../../../README.md#carttotals) y pasa su resultado (que es un `Totals` con más campos):

```js
import { cartTotals } from '@grana/blocks/ecommerce'

const totals = cartTotals(lineas, {
  currency: 'MXN',
  discounts: [{ label: 'Descuento OAXACA10', percent: 10 }],
  shipping: { label: 'Envío estándar', amount: { amount: 99, currency: 'MXN' } },
  taxes: [{ label: 'Incluye IVA', rate: 0.16, included: true }],
  labels: { subtotal: 'Subtotal', total: (n) => `por ${n} ${n === 1 ? 'pieza' : 'piezas'}` }
})
// `order.totals` = totals
```

## Uso

Los datos y textos comunes de la tienda (`precios`, `priceLabels`) están en [«Datos comunes de una tienda»](../../../README.md#datos-comunes-de-una-tienda).

```vue
<!-- Fragmento: `fotoEspadin`, `priceLabels` e `irAlSeguimiento` son de tu aplicación -->
<script setup>
import { GbOrderSummary02 } from '@grana/blocks/ecommerce'

const mxn = (amount) => ({ amount, currency: 'MXN' })

const pedido = {
  title: 'Tu pedido',
  order: {
    reference: { code: 'BYA-2611-07', label: 'Número de pedido' },
    placedAt: '2026-11-07T10:42:00-06:00',
    lines: [
      { id: 'o1', name: 'Mezcal espadín «Tierra de Sola» 750 ml', photo: fotoEspadin, quantity: 2, unitPrice: mxn(890), total: mxn(1780) },
      { id: 'o2', name: 'Rebozo de algodón teñido con grana cochinilla', options: [{ key: 'color', label: 'Color', value: 'Grana' }], quantity: 1, total: mxn(2400) }
    ],
    totals: {
      lines: [
        { label: 'Subtotal', amount: mxn(4180), kind: 'subtotal' },
        { label: 'Envío estándar', amount: mxn(99), kind: 'shipping' },
        { label: 'Incluye IVA', amount: mxn(576.55), kind: 'tax', included: true }
      ],
      total: { value: mxn(4279), label: 'por 3 piezas' }
    },
    shipping: { label: 'Envío a domicilio', method: 'Estándar, de 3 a 5 días', address: ['Ana Ruiz', 'Macedonio Alcalá 202, Centro', '68000 Oaxaca de Juárez, Oax.'], date: '2026-11-12' },
    payment: { label: 'Pago', value: 'Tarjeta terminada en 4242' }
  },
  prices: { currency: 'MXN', taxes: 'IVA incluido' },
  actions: [{ label: 'Ver el seguimiento', href: '/cuenta/pedidos/BYA-2611-07' }],
  timeZone: 'America/Mexico_City',
  locale: 'es-MX',
  labels: {
    lines: 'Lo que compraste',
    quantity: (n) => `${n} ${n === 1 ? 'pieza' : 'piezas'}`,
    total: 'Total',
    pending: 'Se calcula en el siguiente paso',
    placedAt: 'Pedido el {date}',
    delivery: 'Llega el {date}',
    reference: 'Número de pedido',
    price: priceLabels,
    external: 'se abre en otra pestaña'
  }
}
</script>

<template>
  <GbOrderSummary02 v-bind="pedido" @navigate="({ event, href }) => { event.preventDefault(); irAlSeguimiento(href) }" />
</template>
```

La aplicación carga además `@grana/vue/price` y registra los iconos Lucide que use (`createIcons`). El total que pintas es el que **das**: el bloque no lo recalcula, así que `totals.total` no tiene que ser la suma de las líneas.

## Ejemplos

### e1 · La confirmación en una columna (`GbOrderSummary01`)

**Por qué:** cuando el resumen va en una columna de 360 a 640 px, al lado de otra cosa (el pago, el estado). Lo esencial en una tarjeta: el código, lo comprado, el total y las acciones. Sin desglose: si lo necesitas, 02.

```vue
<!-- Fragmento: `pedido` es de tu aplicación -->
<GbOrderSummary01 v-bind="pedido" />
```

### e2 · El recibo completo (`GbOrderSummary02`)

**Por qué:** cuando es la página de confirmación y la persona querrá guardar o imprimir todo: código, fecha, lo comprado con su miniatura, el desglose, el envío y el pago, en el orden del recibo.

```vue
<!-- Fragmento: `pedido` es de tu aplicación -->
<GbOrderSummary02 v-bind="pedido" />
```

### e3 · Una línea en lo alto de un paso (`GbOrderSummary03`)

**Por qué:** cuando el pedido es contexto y no protagonista: arriba de la página de seguimiento o de un paso del pago. El código, las piezas, el total y una acción en una línea.

```vue
<!-- Fragmento: `pedido` es de tu aplicación -->
<GbOrderSummary03 v-bind="pedido" />
```

### e4 · Un envío por calcular

**Por qué:** cuando todavía no sabes el costo del envío. Una línea de `Totals` con `amount: null` se dice con `labels.pending` («Se calcula en el siguiente paso») en lugar de un cero que parecería un envío gratis.

```vue
<!-- Fragmento: `pedido` es de tu aplicación -->
<GbOrderSummary02 v-bind="{ ...pedido, order: { ...pedido.order, totals: { ...pedido.order.totals, lines: [{ label: 'Envío', amount: null, kind: 'shipping' }] } } }" />
```

## Props

Una sola interfaz para las tres variantes (`GbOrderSummaryProps`). Los tipos de datos salen de `@grana/blocks/ecommerce`.

| Prop | Tipo | Descripción |
| --- | --- | --- |
| `title` | `string` (requerida) | «Tu pedido»: título de la sección (01, 02) o nombre del grupo (03). |
| `order` | `OrderSummary` (requerida) | Sin `totals.total` no se pinta (C2); el total sin `label` avisa OS1; más de 30 líneas en 01, OS2. |
| `prices` | `PriceRegion` (requerida) | Obligatoria (EC1): una `GPriceScope` alrededor del pedido; sin ella, cada `GPrice` con su código. |
| `actions` | `Action[] = []` | 0 a 2 (§3): la primera `solid`, la segunda `outline`; 03 pinta solo la primera (`outline`). C8 con más de dos. |
| `timeZone` | `string` | Solo 02. IANA de la tienda: la fecha del pedido y la entrega se dicen en esa hora. |
| `locale` | `string` | BCP 47; sin él, el `lang` del ancestro al montar. |
| `labels` | `OrderSummaryLabels` (requerida) | `lines`, `quantity`, `total` (C5); `pending` con una línea de `amount: null`; `placedAt` y `delivery` con su fecha; `reference` con un código sin `label`; `price` a `GPriceScope` y `GPrice`; `external`. Sin valores por defecto. |

## Eventos

| Evento | Carga | Cuándo |
| --- | --- | --- |
| `navigate` | `{ event, href, item }` (`BlockNavigate<Action \| OrderLine>`) | Una acción con `href` o el nombre de un producto (`item` = la `OrderLine`), con clic primario (#505); nunca con `external` (#574) |
| `activate` | `{ event, item }` (`BlockActivate<Action>`) | Una acción sin `href` |

## Slots

| Slot | Alcance | Qué va |
| --- | --- | --- |
| `line` | `{ line: OrderLine }` | Escape: contenido al final de una línea (por ejemplo «Valorar este producto») |
| `actions` | — | Escape de las acciones (§3) |

## Textos (`labels`)

| Clave | Requerido |
| --- | --- |
| `lines`, `quantity`, `total` | Sí (C5) |
| `pending` | Sí, con una línea de `amount: null` (C5) |
| `placedAt`, `delivery` | Sí, con `placedAt` / `shipping.date` (C5). Plantilla con `{date}` o función `(date) => string` |
| `reference` | Sí, con un `reference` sin `label` (C5) |
| `price`, `external` | Los de `GPrice` / con una acción externa |

## Teclado y foco

| Tecla | Efecto |
| --- | --- |
| `Tab` | Recorre los nombres de producto con enlace y las acciones |
| `Intro` | Sigue el enlace (`navigate`) o activa el botón (`activate`) |

## Accesibilidad

Cifras de la auditoría de coco ([`design/lab/blocks/ecommerce/auditoria.md`](../../../../../design/lab/blocks/ecommerce/auditoria.md)), tres motores, tres temas, claro y oscuro (`medido`):

a. El código va primero, en un `GMetric` con su rótulo; el total, antes de lo incluido; la dirección es un `address` y todas las fechas van en `<time datetime>` (`prueba`, Vitest).
b. Lo comprado es una lista con nombre; el desglose es un `dl` dentro de `GText`; ningún `p`, `dl` ni `address` fuera de un componente que lo tipografía.
c. La elección de cada línea dice las mismas palabras que el carrito del banco, «Color · Grana» (`prueba`; `medido` en los tres motores).
d. 01 cabe en una columna de 360 px sin desbordar; 03 se parte como contrata el diseño (una, dos o bloques apilados) sin desbordar a 320 ni a 320 con el texto al 200 %.
e. La leyenda de 03 va en su propio renglón bajo la línea y dentro del grupo (`prueba`, EC-L1, #943).
f. Ningún `h1`.

> **Peligro.** El bloque pinta el total que **das**: no suma las líneas ni revisa que cuadren. Un `totals.total` que no coincide con las líneas se muestra tal cual, y la persona lee un recibo que no suma. Pasa los `Totals` de `cartTotals` o de tu servidor, no un total escrito a mano. Y `payment.value` es texto tuyo («Tarjeta terminada en 4242»): nunca el número de la tarjeta.

## Personalidad

Nada se mueve: el recibo no anima nada. La personalidad es la de la familia (#913): la elección viaja con las mismas palabras de la ficha al pedido, y el total se lee como un recibo, con lo incluido dicho después y sin sumarlo dos veces.

## Avisos de desarrollo

Prefijo `[Grana GbOrderSummary<NN>]`, una vez por instancia y motivo, solo en desarrollo. Los comunes (C1 a C8, K3, K4, EC1 a EC7) están en [`packages/blocks/README.md`](../../../README.md#avisos-comunes-de-ecommerce). Los de esta sección: C2 (`order` sin `totals.total`: no se pinta), C5, C6, C8, K3, EC1. Los propios:

| Código | Motivo | Qué pasa |
| --- | --- | --- |
| OS1 | `order.totals.total` sin `label` | Avisa: el total necesita su unidad («por 4 piezas») |
| OS2 | Más de 30 líneas en 01 | Se pintan todas; la tarjeta es para una columna |

## Banco de datos de ejemplo

`order-summary.bank.js` exporta `{ props }` con el pedido común de Barro y Agave (`bank/ecommerce.js`): `BYA-2611-07`, `placedAt` 2026-11-07, tres líneas (mezcal × 2, rebozo Grana × 1 con la misma elección que el carrito, jarro × 1), desglose con subtotal, descuento OAXACA10, envío estándar e IVA incluido, `shipping` (Macedonio Alcalá 202, Centro, Oaxaca; entrega 2026-11-12), `payment` «Tarjeta terminada en 4242», `actions` «Ver el seguimiento» y «Seguir comprando»; `timeZone` de Oaxaca. El total del banco **no es la suma de sus partes** a propósito, para probar que el bloque no calcula. Con él ninguna variante avisa. Banco real: `packages/blocks/playground/ecommerce/order-summary.html`.

## Peso

`dist/ecommerce.js` pesa **49 557 B gzip** con sus trozos compartidos (`medido` con `node packages/blocks/scripts/measure-entry.mjs ecommerce`, 2026-10-28); tope de la entrada **51 200 B** (DECISIONS #932; no se vuelve a subir). Una variante importada sola (`node packages/blocks/scripts/measure-partial.mjs 7168 ecommerce GbCheckout=9728 +cartTotals=2048`): `GbOrderSummary01` 4 717 B, `GbOrderSummary02` 4 685 B, `GbOrderSummary03` 3 170 B; tope por variante **7 168 B** (#932). `@grana/vue` y sus entradas son *peer*: las paga la aplicación.

## Alcance

- **No calcula:** ni suma líneas, ni aplica impuestos, ni convierte monedas (#911). Los `Totals` llegan hechos.
- **Pago como texto:** el bloque no pide ni valida datos de tarjeta; `payment` es lo que tu aplicación ya resumió (§27 regla 6).
- **EC-L2 de la auditoría (reservado):** el desglose se lee en columna, cada importe bajo su término («Subtotal» / «$4,680»), sin el renglón término-importe de un recibo. Es legible y con contraste; un renglón sería una forma de `GText dl` (`data-g-receipt`), a decidir sin cambiar Menu ni Offer detail de Booking.
- **EC-L3 de la auditoría (reservado):** el rótulo visible de la cantidad en el carrito repite el producto; no afecta a este resumen, que dice la cantidad con `labels.quantity`.
- **Sin factura ni descarga:** «Descargar factura» es una acción de tu aplicación (`actions`).
- **Sin CSS ni utilidades** (#763, #807).

## Verificación

| Qué | Resultado | Nivel |
| --- | --- | --- |
| Vitest de `GbOrderSummary` (el código primero; la elección igual a la del carrito del banco; el total es el último par y las incluidas van después sin sumarse; 01 sin desglose y 02 con `address` y `time`; un solo `GPriceScope`; 03 con código, piezas, total y acción `outline`; la leyenda de 03 en su propio renglón bajo la línea; `navigate` con la `OrderLine`; OS1, OS2 y EC1) | `npm test -w @grana/blocks` pasa **1 463 de 1 463** en 40 archivos (todo el paquete, 2026-10-26) | `prueba` |
| Auditoría de coco: 01 en 360 px, 02 completa y 03 en una línea (la leyenda bajo la línea se corrigió en el remate, EC-L1/#943); contraste mínimo 4,51:1 | Familia: Chromium 3 248 de 3 275, Firefox 3 189 de 3 216 y WebKit 3 188 de 3 216 al auditar; 3 266 de 3 275 tras el remate de bruno (#945). Veredicto `candidate` | `medido` |

**No verificado:** lector de pantalla real (el recibo como `dl`, el total antes de lo incluido, el `address`); `forced-colors` real y en Firefox y WebKit; teléfono real; rendimiento con el perfilador; el pedido real de tu servidor (el banco usa un total que no es la suma). **Pendientes abiertos:** EC-L2 y EC-L3 de la auditoría (reservados); los generales, en [`PENDIENTES.md`](../../../../../PENDIENTES.md).

## Fuentes

- Contrato: [`design/contracts/blocks/order-summary.md`](../../../../../design/contracts/blocks/order-summary.md) y [`_comun.md`](../../../../../design/contracts/blocks/_comun.md) (§26 a §39).
- Decisiones: #909 a #914, #923, #927, #932, #943 en `DECISIONS.md`.
- Metadatos: [`GbOrderSummary.meta.json`](./GbOrderSummary.meta.json). Pruebas: [`GbOrderSummary.test.js`](./GbOrderSummary.test.js). Auditoría: [`design/lab/blocks/ecommerce/auditoria.md`](../../../../../design/lab/blocks/ecommerce/auditoria.md).
