# Contrato · Billing (`GbBilling01` · `02` · `03`)

**Dueño:** lima · **Estado:** contratado (DECISIONS.md #983 a #987 y #993, 2026-10-29) · **Plan:** S6 (§4.5) · **Entrada:** `@grana/blocks/saas` · **Común:** `_comun.md` §1 a §5 y §41 a §54 (sobre todo §44 regla 2: sin datos de tarjeta) · **Compone:** `GSection`, `GPriceScope` + `GPrice`, `GSplit` (01), `GCard`, `GSummary`, `GTable`, `GBadge`, `GBtn`, `GText` y la confirmación común (§43.2) · **Fase:** 4c·3 · **Compleja: coco y bruno en Opus** (tabla con puerta, diálogo de cancelación, estado de cobro)

## Promesa

La facturación de la cuenta: **qué se paga, cuándo es el próximo cobro y a qué tarjeta**, las facturas y lo que falla (un cobro rechazado, una tarjeta que vence) **a la vista donde se arregla**. Cancelar dice antes qué se pierde y desde cuándo. Ningún dato de tarjeta pasa por el bloque: el método es un texto de la aplicación y cambiarlo es de su pasarela.

## Props

```ts
interface GbBillingProps {
  title: string                          // «Facturación»
  subscription: Subscription             // §45
  method?: MaskedCard | null             // null: sin método («Agrega un método de pago»)
  invoices: Invoice[]                    // las de la página (el servidor pagina)
  prices: PriceRegion                    // obligatoria (EC1)
  page?: number                          // v-model:page
  pageSize?: number
  total?: number                         // facturas en total (paginación del servidor)
  loading?: boolean                      // la tabla de facturas
  error?: boolean                        // la tabla falló (con `retry`)
  actions?: Action[]                     // «Cambiar de plan» (a Plans) …; como mucho dos (§3)
  locale?: string
  labels: {
    plan: string                         // título de la tarjeta del plan («Tu plan»)
    next: string | ((date: string) => string)   // «Próximo cobro: {date}»
    seats?: string | ((used: number, total: number | null) => string)   // «4 de 10 asientos»
    ends?: string | ((date: string) => string)  // «Se cancela el {date}» / «La prueba acaba el {date}»
    method: string                       // título de la tarjeta del método («Método de pago»)
    noMethod?: string                    // «Sin método de pago»
    changeMethod: string                 // «Cambiar método»
    addMethod?: string                   // «Agregar método»
    cancel?: string                      // «Cancelar suscripción»
    resume?: string                      // «Reanudar suscripción»
    invoices: string                     // título y caption de la tabla («Facturas»)
    columns: { date: string; reference: string; amount: string; status: string; period?: string }
    download?: string | ((reference: string) => string)   // «Descargar {reference}»
    confirm: { cancel: ConfirmLabels }   // §43.2
    keep: string                         // «Mantener la suscripción»
    consequence?: ConsequenceLabels
    price?: PriceLabels & { legend?: string }
    table?: GranaLabels; pagination?: GranaLabels
    external?: string
  }
}
```

## Anatomía (común)

- **Una `GPriceScope`** con `prices` envuelve el bloque. Importes con `GPrice` (`subscription.price`, `next.amount`, `Invoice.amount`); **nada se suma**: el próximo cobro lo da la aplicación (§42 regla 6).
- **Lo que falla, primero** (§43.3): con `subscription.attention` o `method.attention`, una `GCard status` (`warning`/`error`, `statusText` = `text`) **al principio del bloque** con la acción que lo arregla (`labels.changeMethod` → `change-method`). No se repite abajo: la tarjeta del método conserva su estado en texto.
- **El plan:** `GSummary layout="row"` (`title` = `subscription.plan`, `subtitle` = `statusText`, `facts` = precio por periodo como texto de `formatPrice`, próximo cobro con su fecha en `<time>`, asientos, fin de prueba o de cancelación) + `actions` (§3) + «Cancelar suscripción» (`GBtn variant="link"`), que abre la **confirmación** de §43.2 con `subscription.consequences.cancel` («Desde el 30 de noviembre volverás al plan Semilla; los 6 miembros sin asiento pasan a solo lectura»). Con `status: 'canceling'`, en su lugar «Reanudar suscripción» (`resume`, sin confirmación: no destruye) y `labels.ends(endsAt)`.
- **El método:** `GSummary layout="row"` (`title` = `method.label`, `subtitle` = `method.detail`) + `GBtn` `labels.changeMethod` (o `labels.addMethod` sin método) → `change-method`. **Nunca** un número, un `input` de tarjeta ni `autocomplete` `cc-*` (§44 regla 2; compuerta).
- **Las facturas:** `GTable` (`caption` = `labels.invoices`; `rowKey="id"`; columnas fecha —`<time>` en `cell-date`—, referencia (principal, la **puerta**: `rowHref` = `invoice.href`; sin `href`, `activatable` → `open`), periodo, importe (`cell-amount` con `GPrice size="sm"`, `align="end"`), estado (`rowStatus` para `failed` con `statusText`; el resto, `GBadge` de texto en `cell-status`); `row-actions` con `GBtn variant="link"` «Descargar F-0042» (`download`, `navigate`) ; `page`/`pageSize`/`total` en modo servidor; `loading`, `error` y `retry` de la tabla).

## Variantes

| Variante | Concepto | Compone | Ignora |
| --- | --- | --- | --- |
| **01 · Resumen completo** | El plan y el método lado a lado y, debajo, las facturas | `GSection` › `GPriceScope` › `GStack gap="lg"` › atención + `GSplit ratio="1:1" gap="lg"` › [`#start` › `GCard` del plan] + [`#end` › `GCard` del método] + `GTable` de facturas | — |
| **02 · Facturas** | La tabla de facturas con una línea de lo que se paga | `GSection` › `GPriceScope` › `GStack gap="md"` › atención + `GText size="body-sm"` (plan, precio y próximo cobro en una frase con `<time>` y `GPrice size="sm"` en línea) + `GTable` | la tarjeta del método (su atención sí se pinta arriba), `actions` |
| **03 · Próximo cobro** | Una tarjeta compacta: cuánto, cuándo y a qué tarjeta | `GCard` (título = `labels.next(date)`, nivel `min(level, 6)`, #927) › `GPrice size="lg"` del próximo cobro + `GText` con `method.label` + acciones (`changeMethod`, `actions[0]`); la atención como `status` de la propia tarjeta | `invoices`, `page`, `total`, `loading`, `error`, cancelar |

## Eventos

| Evento | Carga | Cuándo |
| --- | --- | --- |
| `change-method` | `{ event }` | Cambiar o agregar el método (la pasarela es de la aplicación) |
| `cancel` | `{ event, subscription }` | Tras confirmar (§43.2) |
| `resume` | `{ event, subscription }` | Reanudar una suscripción `canceling` |
| `open` | `{ event, invoice }` | Puerta de una factura sin `href` (`event` de `GTable` `activate`) |
| `navigate` | `{ event, href, item }` | Puerta con `href`, «Descargar» o una `Action` con `href` |
| `activate` | §4 | Una `Action` sin `href` |
| `update:page` | `number` | Paginación |
| `retry` | `{ event: null }` | «Reintentar» de la tabla |

## Slots

`method` `{ method }` (escape: la tarjeta del método, p. ej. el componente de la pasarela que la aplicación ya tiene), `cell-{key}` (pasa a `GTable`), `description`.

## Estructura accesible

`GSection` con título (sin `h1`); la atención en texto al principio (sin región viva: está a la vista al llegar); el plan y el método con su encabezado; la tabla con `caption`, puerta por fila (#598) y el estado en texto (`rowStatus` para lo que pide atención, #600); importes con la frase de `GPrice`; «Descargar F-0042» con la referencia en el nombre; la cancelación es `alertdialog` con el foco en «Mantener».

## Qué lo hace distinto (#993)

**Lo que falla está arriba y se arregla ahí.** Un cobro rechazado o una tarjeta que vence no se esconden en un correo ni en una fila roja: abren el bloque con su frase («El cobro del 1 de noviembre falló: actualiza tu método de pago») y el botón que lo arregla al lado. El próximo cobro se dice **con importe, fecha y tarjeta** en una línea, y cancelar dice antes, junto al botón que confirma, desde cuándo y qué se pierde. Nunca un número de tarjeta: la tarjeta es «Visa terminada en 4242», texto de la aplicación.

## Textos (`labels`)

| Clave | Requerido |
| --- | --- |
| `plan`, `next`, `method`, `changeMethod`, `invoices`, `columns.*` | Sí (C5) |
| `seats` | Sí, con `subscription.seats` (C5) |
| `ends` | Sí, con `endsAt` (C5) |
| `noMethod`, `addMethod` | Sí, con `method: null` (C5) |
| `cancel`, `confirm.cancel`, `keep` | Sí para ofrecer cancelar (SA9: sin ellos no se ofrece) |
| `resume` | Sí, con `status: 'canceling'` (C5) |
| `download` | Sí, con alguna `download` (C5) |
| `consequence` | Sí, con `consequences.cancel` (C5) |
| `price`, `table`, `pagination` | Los de cada componente |
| `external` | Sí, con un enlace externo (C5) |

## Avisos propios (`[Grana GbBilling<NN>]`)

C2, C5, C6, EC1, K3, SA1 (cancelar sin `consequences.cancel`), SA5, SA7 (sin escucha de `change-method`), SA8, SA9. Además: **BI1** · `status` fuera de la lista (se dice `statusText` igual), **BI2** · `method` con un campo que parece un número de tarjeta (más de 8 cifras seguidas en `label` o `detail`: **no se pinta** el texto y avisa; la aplicación debe enmascarar), **BI3** · `next` en el pasado al montar (se pinta igual: la aplicación decide).

## Banco (`billing.bank.js`)

La suscripción anual de Taller ($2,490 al año, próximo cobro el 1 de diciembre, 4 de 10 asientos, `consequences.cancel`), otro estado `canceling` con `endsAt`, otro `past-due` con `attention` `error`; `MaskedCard` «Visa terminada en 4242 · Vence 12/2027» y otra con `attention` «Vence este mes»; seis facturas (pagadas, una `failed` con `rowStatus`, una `refunded`, una en USD aproximada) con `href` y `download`; `total` 14; `actions` «Cambiar de plan»; `labels` completos.

## Verificación propia

Vitest: una `GPriceScope`; ningún importe calculado (el banco da un próximo cobro que no es el precio); la atención arriba con su acción; cancelar abre el `alertdialog` con la consecuencia y solo emite al confirmar; `canceling` ofrece `resume` sin confirmación; ningún `input` ni `cc-*`; BI2 con un número de 16 cifras (no se pinta); la tabla con puerta (`navigate` con `href`, `open` sin él), `rowStatus` en la fallida y «Descargar» con la referencia; `update:page`, `retry` con `event: null`; 03 sin tabla. Chromium: 01 al lado a 1440 y apilado a 390; la tabla en tarjetas en estrecho; 320 px sin desbordar; el foco vuelve al disparador al cerrar la confirmación.
