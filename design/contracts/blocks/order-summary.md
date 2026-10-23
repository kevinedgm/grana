# Contrato · Order summary (`GbOrderSummary01` · `02` · `03`)

**Dueño:** lima · **Estado:** contratado (DECISIONS.md #909 a #914 y #923, 2026-10-23) · **Plan:** E9 (§4.2) · **Entrada:** `@grana/blocks/ecommerce` · **Común:** `_comun.md` §1 a §5 y §26 a §38 · **Compone:** `GCard`, `GSection`, `GStack`, `GAdaptiveLayout`, `GSummary`, `GMetric`, `GPrice` + `GPriceScope`, `GText` (con `dl`, #863), `GBtn` · **Parte de bruno:** C

## Promesa

Un pedido **leído como su recibo**: qué compraste con lo que elegiste, cuánto costó cada cosa y el total que se cobró, a dónde va y cómo se pagó. Sirve en la confirmación, en el correo de la aplicación (receta) y dentro de Checkout. El bloque no calcula nada.

## Props

```ts
interface GbOrderSummaryProps {
  title: string                        // «Tu pedido»
  order: OrderSummary
  prices: PriceRegion                  // obligatoria
  actions?: Action[]                   // 0 a 2 (§3): «Ver el seguimiento», «Descargar factura»
  timeZone?: string                    // de la tienda: la fecha del pedido y la entrega se dicen en esa hora
  locale?: string
  labels: {
    lines: string                      // nombre de la lista de lo comprado («Lo que compraste»)
    quantity: string | ((count: number) => string)   // «{count} piezas» / «× {count}»
    total: string                      // «Total»
    pending?: string                   // línea con amount null
    placedAt?: string | ((date: string) => string)   // «Pedido el {date}»
    delivery?: string | ((date: string) => string)   // «Llega el {date}» (shipping.date)
    reference?: string                 // rótulo del código si el dato no trae `label`
    price?: PriceLabels & { legend?: string }
    external?: string
  }
}
```

## Piezas (comunes)

- **El código** (`order.reference`): `GMetric` (`label` = `reference.label`, `value` = `reference.code`) **primero** (lo primero que pide el servicio al cliente; como Confirmation, #873; BK-L4: dicho por grupos con guion, dato de la aplicación).
- **Lo comprado** (`lines`): una lista (`GStack as="ul" gap="sm"`, `aria-label` = `labels.lines`) con un `li` por línea: `GText size="body-sm"` › nombre (`GBtn variant="link"` si hay `href`; `lang`) + las `ChosenOption` en palabras («Talla M · Grana») + la cantidad (`labels.quantity`) + `GPrice size="sm"` del `total` de la línea. La miniatura (`photo`) solo en 02, decorativa.
- **El desglose y el total** (`totals`): `GText as="div" size="body-sm"` › `dl` con las líneas de `Totals` (no incluidas), el total como **último par** (`dt` `labels.total`, `dd` `GPrice size="lg"`, `dd` `total.label`) y las incluidas después («Incluye IVA $397.24»); `amount: null` → `labels.pending`. Igual que el resumen de Cart (el mismo `common/`).
- **Envío y pago**: `shipping` en `GText as="address" size="body-sm"` (líneas de `address`) con `label`, `method`, la fecha de entrega en `<time>` (`labels.delivery`) y `note`; `payment` como `{ label, value }` en el `dl` (texto de la aplicación: «Tarjeta terminada en 4242», nunca el número, §27 regla 6).
- **Fecha del pedido**: `placedAt` en `<time>` con `labels.placedAt`, en la zona de la tienda.

## Variantes

| Variante | Concepto | Compone | Ignora |
| --- | --- | --- | --- |
| **01 · Tarjeta** | Lo esencial en una tarjeta para una columna: código, lo comprado, total y acciones | `GCard as="section"` (raíz; título al nivel de `useSectionLevel()`) › `GPriceScope` › `GStack gap="md"` › código + lo comprado + total (sin desglose) + acciones | `totals.lines` (salvo las de `amount: null`, que se dicen), `shipping.address`, `photo` |
| **02 · El recibo** | Todo, en el orden del recibo, para la página de confirmación | `GSection` › `GPriceScope` › `GStack gap="lg"` › código + fecha + lo comprado (con miniatura) + desglose y total + envío + pago + `note` + acciones | — |
| **03 · Línea** | Una línea compacta en lo alto de un paso o de una lista: código, piezas, total y una acción | `GText as="div" size="body"` (raíz, `role="group"` con `aria-label` = `title`, #894, #898) › `GAdaptiveLayout gap="md" vertical="center"` › `GSummary layout="inline"` (hijo directo, #897: `title` = `reference.code`, `facts` = la cuenta de piezas con `labels.quantity`) + `GPrice size="sm"` del total + la primera acción (`outline`) | lo comprado línea a línea, el desglose, envío, pago, la segunda acción |

**03 se parte como Booking summary 03** (#906, #908): una línea a ≥ 1024, dos a 768, bloques apilados a ≤ 390; comportamiento contratado, no defecto.

## Eventos

`navigate` y `activate` de `actions` y de los nombres de producto (`item` = la `OrderLine`) (§4).

## Slots

`line` `{ line }` (escape: contenido al final de una línea, p. ej. «Valorar este producto»), `actions` (escape de §3).

## Estructura accesible

01 `section` con título; 02 `GSection`; 03 `group` con nombre. El código es un `GMetric` (se lee con su rótulo); lo comprado es una lista; el desglose es un `dl`; la dirección es `address`; las fechas en `time`. Sin `h1`, sin región viva.

## Qué lo hace distinto (#923)

**El pedido se lee como el recibo que te llega, con las mismas palabras que elegiste.** El código va primero, en grande, porque es lo que te piden si llamas; cada línea dice la talla y el color tal como los elegiste en la ficha (la elección viaja, §27 regla 3); el total es el último renglón del desglose y lo que ya va incluido (el IVA) se dice después, sin sumarlo dos veces. La entrega se dice con su fecha en la hora de la tienda, nunca «mañana».

## Textos (`labels`)

| Clave | Requerido |
| --- | --- |
| `lines`, `quantity`, `total` | Sí (C5) |
| `pending` | Sí, con una línea de `amount: null` (C5) |
| `placedAt`, `delivery` | Sí, con `placedAt` / `shipping.date` (C5) |
| `reference` | Sí, con un `reference` sin `label` (C5) |
| `price`, `external` | Los de `GPrice` / con una acción externa |

## Avisos propios (`[Grana GbOrderSummary<NN>]`)

C5, C6, C8, K3, EC1. Además: **OS1** · `totals.total` sin `label`, **OS2** · más de 30 líneas en 01 (se pintan todas; la tarjeta es para una columna).

## Banco (`order-summary.bank.js`)

El pedido común (§33): `BYA-2611-07`, `placedAt` 2026-11-07, tres líneas (mezcal × 2, rebozo Grana × 1, jarro × 1), `totals` con subtotal, descuento OAXACA10, envío estándar e IVA incluido, `shipping` (Macedonio Alcalá 202, Centro, Oaxaca; Estándar; entrega 2026-11-12), `payment` «Tarjeta terminada en 4242», `actions` «Ver el seguimiento» y «Seguir comprando».

## Verificación propia

Vitest: el código primero; la elección de cada línea igual a la `ChosenOption` del carrito del banco (la misma frase); el total es el último par del `dl` y las incluidas van después sin sumarse; `address` y `time` con `datetime`; ningún cálculo (el banco da un total que no es la suma). Chromium: 01 en una columna de 360 px sin desbordar; 03 con las tres formas de Booking summary 03 a 1440, 768 y 390.
