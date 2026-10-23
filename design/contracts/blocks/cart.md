# Contrato · Cart (`GbCart01` · `02` · `03`)

**Dueño:** lima · **Estado:** contratado (DECISIONS.md #909 a #914, #911 y #921, 2026-10-23) · **Plan:** E7 (§4.2) · **Entrada:** `@grana/blocks/ecommerce` · **Común:** `_comun.md` §1 a §5 y §26 a §38 · **Compone:** `GSection`, `GStack`, `GAdaptiveLayout`, `GCard`, `GNumberField`, `GBtn`, `GPrice` + `GPriceScope` (`@grana/vue/price`), `GText` (con `dl`, #863), `GProgress`, `GEmpty`, `GDialog` (03) · **Parte de bruno:** C · **Compleja: coco y bruno en Opus** (cantidad por línea, huella con foco, totales y cajón modal)

## Promesa

Lo que vas a comprar, **línea a línea con lo que elegiste, lo que cuesta, lo que falta para pedirlo y el total que se cobrará**; cambiar una cantidad o quitar una línea no te hace perder el sitio. El bloque no suma: la aplicación da las líneas y los totales (con `cartTotals` o su servidor, §29).

## Props

```ts
interface GbCartProps {
  title: string                        // «Tu carrito»
  lines: CartLine[]                    // 0 a 50 (C7 por encima de 50)
  totals: Totals | CartTotals          // de la aplicación; con CartTotals, además `goals` y `excluded`
  prices: PriceRegion                  // obligatoria (EC1)
  actions: Action[]                    // [pagar, seguir comprando?] (§3: la primera es la principal)
  assurance?: string                   // «Devoluciones gratis en 30 días» (ligada a la principal)
  busy?: (string | number)[]           // ids de línea que se están actualizando (GNumberField disabled)
  open?: boolean                       // v-model:open (solo 03: el cajón)
  from?: string | HTMLElement | null   // 03: el disparador (GDialog `from`)
  locale?: string
  labels: {
    quantity: string | ((name: string) => string)   // nombre del campo de cantidad («Cantidad de {name}»)
    decrement: string; increment: string
    remove: string | ((name: string) => string)     // «Quitar {name}» (nombre accesible; visible «Quitar»)
    removeText?: string                // texto visible del botón («Quitar»)
    removed: string | ((name: string) => string)    // la huella: «Quitaste {name}»
    undo: string                       // «Deshacer»
    unavailable?: string               // «Ya no está disponible» (available: false)
    excluded?: string | ((count: number) => string) // «{count} artículos no entran en tu pedido»
    forQuantity?: string | ((count: number) => string)   // «por {count} piezas» (PriceTotal.label del total de la línea)
    each?: string                      // unidad visible del precio unitario («c/u»); unitLabel leído con `eachLabel`
    eachLabel?: string                 // «cada una»
    summary: string                    // título del resumen («Resumen»)
    total: string                      // «Total»
    pending?: string                   // «Se calcula en el siguiente paso» (línea con amount null)
    goal?: string | ((g: { label: string; remaining: string }) => string)   // «Te faltan {remaining} para {label}»
    goalReached?: string | ((label: string) => string)                      // «Ya tienes {label}»
    empty: { title: string; description?: string }
    close?: string                     // 03: nombre del cierre del cajón
    dialog?: GranaLabels               // 03: a GDialog
    price?: PriceLabels & { legend?: string }
    external?: string
  }
}
```

## Anatomía de una línea (común)

```
GCard as="li" level="flat" orientation="horizontal" mediaPosition="start" density="compact" (01, 02; 03 sin media)
├─ media: <img> de product.photos[0] (decorativa)
├─ eyebrow: product.maker · title: product.name (enlace con product.href → navigate; nivel de dentro)
├─ meta: options (ChosenOption → { label, value }: «Talla · M», «Color · Grana») — la elección, tal como viaja
├─ default: GPrice (A · la cuenta de price.md): value = unitPrice (unit = labels.each, unitLabel = labels.eachLabel),
│           total = { value: line.total, label: labels.forQuantity(quantity) } — solo con line.total; sin él, el unitario
│           + (no disponible) GText size="body-sm" › motivo · + line.note en GText size="body-sm" tone="muted"
└─ actions: GNumberField (label = labels.quantity(name), min, max, step 1, precision 0, steppers)  +  GBtn variant="link" «Quitar»
```

- **La cantidad cambia por gesto**: el bloque emite **`change { event, line, quantity }`** en el `change` de `GNumberField` (al soltar el escalón, al salir del campo o con Intro; no en cada tecla, `number-field.md`). Con la línea en `busy`, el campo y «Quitar» quedan `disabled`. **Cantidad 0** = quitar (huella). Las cifras del total de la línea **ruedan** cuando la aplicación cambia `line.total` (A de `GPrice`; con movimiento reducido, no).
- **Quitar deja huella** (§27 regla 3; el patrón A «Huella» de `tag.md`, aplicado a la línea): «Quitar» (o cantidad 0) emite **`remove { event, line, index }`** y, cuando la línea sale de `lines`, el bloque deja **en su sitio** un `li` con `GText size="body-sm"` `labels.removed(name)` y un `GBtn variant="link"` `labels.undo`, **con el foco en «Deshacer»** (el foco nunca cae en `body` al desaparecer el control que lo tenía). «Deshacer» emite **`restore { event, line, index }`** (la aplicación devuelve la línea a ese índice con su cantidad). La huella se va cuando **foco y puntero** salen de ella (no por tiempo: nada se va solo mientras se lee, 2.2.1), o al volver la línea. Estado de vista (§15 regla 9): si la aplicación no quita la línea, no hay huella.
- **No disponible**: la línea sigue a la vista con su motivo, sin campo de cantidad (solo «Quitar») y **fuera del total** (lo hace `cartTotals`: `excluded`). Con `excluded` no vacío, el resumen lo dice en palabras (`labels.excluded(count)`), **antes** de la acción principal.

## El resumen (común)

```
GCard as="section" (title = labels.summary, nivel de dentro) · dentro del único GPriceScope
├─ [goal] GText size="body-sm" › labels.goal / labels.goalReached + (sin alcanzar) GProgress (value = goal.value.amount, max = goal.target.amount, label = el mismo texto, showLabel false, showValue false)
├─ GText as="div" size="body-sm" › dl
│   └─ por línea de totals.lines (no incluidas): dt = label · dd = GPrice size="sm" (amount; null → labels.pending) · dd = note
│   └─ total: dt = labels.total · dd = GPrice size="lg" (totals.total.value) · dd = totals.total.label
│   └─ incluidas (included): dt = label · dd = GPrice size="sm"   ← «Incluye IVA $397.24», después del total
├─ [excluded] GText size="body-sm" › labels.excluded(count)
├─ assurance: GText size="body-sm" tone="muted" con id (aria-describedby de la principal, #838)
└─ actions: GbActions (§3: la primera solid block, la segunda outline)
```

- **El total es el último par del `dl`** (`dt` «Total», `dd` el importe): se nombra por su término y no necesita la forma «`total` sola» de `GPrice` (sigue reservada, #883). El bloque **no comprueba** que las líneas sumen el total (§27 regla 4).
- **El umbral** (`goals` de `CartTotals`, el primero): **sí es un progreso hacia una meta** (llegar al envío gratis), así que `GProgress` va con su rol (`progressbar`) y su `label` es la frase («Te faltan $310 para el envío gratis»). Alcanzado: solo la frase `goalReached`, sin barra. Nunca anima por su cuenta (lo que cambia es el dato).
- **Vacío** (`lines` vacío y sin huella): `GEmpty cause="none"` (`labels.empty`) con la **segunda** acción («Seguir comprando») en su slot `actions`; sin resumen ni acción principal.

## Variantes

| Variante | Concepto | Compone | Ignora |
| --- | --- | --- | --- |
| **01 · Lista + resumen al lado** | La página del carrito: las líneas y, a su lado en ancho (debajo en estrecho), el resumen | `GSection` › `GPriceScope` › `GAdaptiveLayout gap="lg"` › [`div class="g-adapt-wide"` › `GStack as="ul" gap="md"` › líneas] + [`div class="g-adapt-standard"` › resumen] | `open`, `from`, `labels.close`/`dialog` |
| **02 · Resumen al pie** | Una columna: las líneas y, al final, el resumen con el total justo antes de pagar | `GSection` › `GPriceScope` › `GStack gap="lg"` › `GStack as="ul" gap="md"` › líneas + resumen | `open`, `from`, `labels.close`/`dialog` |
| **03 · Cajón** | El carrito que se abre al borde sin salir de la página; pantalla completa en el teléfono | `GDialog placement="end" size="sm" mobile="fullscreen"` (raíz, `v-model` = `open`, `title` = `title`, `closeLabel` = `labels.close`, `from`) › `GPriceScope` › `GStack gap="md"` › líneas **sin media** + resumen con solo el total (sin `totals.lines` salvo las de `amount: null`, que se dicen) | `media` de las líneas, las líneas de desglose con importe |

**Sin muelle ni columna pegada** (BK-L1, BK-L2; §36): en 02 el total está justo encima de «Pagar»; la aplicación que quiera el resumen pegado en 01 lo hace con su CSS en **su** contenedor (receta de Booking summary).

## Eventos

| Evento | Carga | Cuándo |
| --- | --- | --- |
| `change` | `{ event, line, quantity }` | Cantidad por gesto (> 0) |
| `remove` | `{ event, line, index }` | «Quitar» o cantidad 0 |
| `restore` | `{ event, line, index }` | «Deshacer» de la huella |
| `navigate` | `{ event, href, item }` | El nombre de un producto (`item` = la línea) o una acción con `href` |
| `activate` | `{ event, item }` | Una acción sin `href` |
| `update:open` | `boolean` | 03: abrir y cerrar el cajón |

## Slots

`line` `{ line }` (escape: contenido al final del cuerpo de una línea, p. ej. «Envolver para regalo» de la aplicación), `summary` `{ totals }` (escape: contenido antes de las acciones, p. ej. el campo de cupón de la aplicación), `actions` `{ describedby }` (escape de §3, #838).

## Estructura accesible

`GSection` (01, 02) o `dialog` (03) con el título; las líneas son una lista real (`ul > li`, la tarjeta `as="li"`); el nombre de cada campo de cantidad y de cada «Quitar» incluye el producto («Cantidad de Rebozo de algodón», «Quitar Rebozo de algodón»): con diez líneas, diez «Quitar» iguales no se distinguen en la lista de controles (2.4.6); el resumen es una `section` con título y un `dl`; la garantía está en el `aria-describedby` de «Pagar». **Sin región viva propia**: el cambio de total lo anuncia el control que lo provocó (el `GNumberField`, por su valor) y el total está a un Tab; quitar se oye por el foco que llega a «Quitaste… Deshacer».

## Qué lo hace distinto (#921)

**El carrito dice lo que te falta, y quitar no te hace perder nada.** Antes de pagar dice en palabras lo que no entrará («Un artículo ya no está disponible y no entra en tu pedido»), lo que aún no se sabe («El envío se calcula en el siguiente paso») y, si la tienda lo usa, cuánto falta para el envío gratis. Quitar una línea deja **su huella en el sitio** con «Deshacer» y el foco ahí mismo: un toque de más con el pulgar se arregla sin buscar el producto otra vez, y quien usa lector no queda perdido en la página. Cambiar una cantidad hace rodar solo las cifras del total que cambian, y la talla y el color que elegiste se leen igual que en la ficha.

## Textos (`labels`)

| Clave | Requerido |
| --- | --- |
| `quantity`, `decrement`, `increment`, `remove`, `removed`, `undo`, `summary`, `total`, `empty` | Sí (C5) |
| `removeText` | Sí, si `remove` es una función (C5; el texto visible) |
| `unavailable` | Sí, con una línea `available: false` (C5) |
| `excluded` | Sí, con `excluded` no vacío (C5) |
| `forQuantity`, `each`, `eachLabel` | Sí, con `line.total` (C5; sin ellos, el unitario solo) |
| `pending` | Sí, con una línea de `amount: null` (C5) |
| `goal`, `goalReached` | Sí, con `goals` (C5; sin ellos, sin umbral) |
| `close`, `dialog` | Sí, en 03 (C5; `dialog` avisa `GDialog`) |
| `price`, `external` | Los de `GPrice` (avisa él) / con una acción externa (C5) |

## Avisos propios (`[Grana GbCart<NN>]`)

C3, C5, C6, C8, K3, K4, EC1, EC5. Además: **CA1** · `quantity` fuera de `min`/`max` en una línea (se pinta lo dado; `GNumberField` lo ajusta al gesto), **CA2** · `totals.total` sin `label` (el total necesita su unidad: «por 3 piezas»), **CA3** · sin escucha de `remove` o de `restore` (la huella no puede deshacer: se pinta sin «Deshacer»).

## Banco (`cart.bank.js`)

El carrito común (§33): Mezcal espadín × 2 (con `total` de `byLine`), Rebozo de algodón Grana × 1 (`options` Color · Grana; `compareAt` nombrada), Plato de barro verde × 1 no disponible; `totals` = `cartTotals(lines, { currency: 'MXN', shipping: { label: 'Envío', amount: null }, taxes: [{ label: 'IVA', rate: 0.16, included: true }], goals: [{ id: 'envio', label: 'el envío gratis', target: { amount: 3000, currency: 'MXN' } }], labels })`; `actions` «Pagar» (`href`) y «Seguir comprando» (`href`); `assurance`; `labels` completos. Estados: `busy` en una línea; carrito vacío; la huella tras quitar el mezcal.

## Verificación propia

Vitest: `change` solo por gesto (no por tecla) con la carga exacta; cantidad 0 → `remove`; tras quitar, la huella en el mismo índice con el foco en «Deshacer» y `restore` con `line` e `index`; la huella se va con foco y puntero fuera, no por tiempo; sin escucha de `restore`, sin «Deshacer» (CA3); la línea no disponible sin cantidad, con motivo y fuera del total (lo dice `excluded`); el total es el de `totals` (el banco da un total que no es la suma y se pinta tal cual); un solo `GPriceScope`; `GProgress` con su rol en el umbral; 03 con `GDialog placement="end"` y el foco de vuelta al disparador. Chromium: 01 con el resumen al lado a 1440 y debajo a 390; las líneas sin desbordar a 320 con el nombre largo de §7; el total de una línea rueda al cambiar la cantidad y con reducido no; 03 a pantalla completa a 390.
