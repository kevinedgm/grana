# Contrato · Confirmation (`GbConfirmation01` · `02` · `03`)

**Dueño:** lima · **Estado:** contratado (DECISIONS.md #860 a #866 y #873, 2026-10-22) · **Plan:** B7 (§4.3) · **Entrada:** `@grana/blocks/booking` · **Común:** `_comun.md` §1 a §5 y §14 a §25 · **Compone:** `GSection`, `GCard`, `GStack`, `GMetric`, `GSummary`, `GBadge` (vía `GCard badge`), `GStepper`, `GPrice` + `GPriceScope`, `GBtn`, `GText`, `describeQuery` · **Parte de bruno:** A

## Promesa

Lo que quedó reservado (o pedido), **dicho entero en una pieza que cabe en una captura**: el código, qué, cuándo, quiénes, cuánto, qué sigue y cómo escribir. No hay nada que desplegar para leerlo.

## Props

```ts
interface GbConfirmationProps {
  title: string                          // «Reserva confirmada» / «Recibimos tu solicitud»
  state: 'confirmed' | 'requested'       // confirmada por el lugar, o pedida y a la espera de confirmación
  reference: Reference                   // { code, label }
  query: BookingQuery
  partyRows: PartyRow[]
  context?: Omit<QueryContext, 'partyRows'>
  offer?: Pick<Offer, 'id' | 'name' | 'kind' | 'photos'>
  totals?: Totals                        // lo que cobra el lugar (de la aplicación)
  prices?: PriceRegion
  next?: NextStep[]                      // 0 a 6 (C7)
  channels?: Channel[]                   // escribir ya: WhatsApp, teléfono, correo
  actions?: Action[]                     // 0 a 2: «Añadir al calendario» (href .ics de la app), «Cómo llegar», «Compartir» (sin href → activate)
  timeZone?: string                      // IANA del lugar; fechas de `next` en su zona
  locale?: string
  labels: {
    states: { confirmed: string; requested: string }   // texto de la insignia («Confirmada», «Pendiente de confirmar»)
    query: QueryLabels
    when?: string                        // rótulo de la consulta en la ficha («Cuándo y quiénes»)
    next?: string                        // título de «lo que sigue» (02) y nombre de su lista
    channels?: string                    // «Escríbenos»
    stepper?: GranaLabels
    price?: PriceLabels & { legend?: string }
    external?: string
  }
}
```

## Anatomía de lo confirmado (común)

**Sin oferta (#883):** la consulta es el `title` del `GSummary` (no hay nombre que anteponerle).

```
├─ GMetric · value = reference.code, label = reference.label       ← el código, grande, primero tras el título
├─ GSummary layout="stack" · title = offer.name, subtitle = offer.kind,
│           facts = [{ label: labels.when, value: describeQuery(query).text, priority: 1 }]   ← la consulta con las mismas palabras
├─ GPrice (#883: `value` = totals.total, `unit` = totals.total.label, `lead` = labels.price.total; sin precio por noche; líneas en GText as="div" › dl, #863)   ← con totals
├─ GText size="body-sm" › totals.note
├─ canales: GStack as="ul" orientation="horizontal" gap="sm" [aria-label=labels.channels] › li › GBtn variant="outline" (icono, label; hint en GText caption muted)
└─ acciones (§3: la primera solid, la segunda outline)
```

- **Estado** (`state`): insignia con texto (`labels.states[state]`, `GCard badge`, `badgeColor` `success` confirmada / `warning` pedida), nunca solo color. Con `requested`, el título y la insignia dicen que **falta la confirmación del lugar**; la aplicación da el plazo en `next` («Te confirmamos antes de las 20:00»).
- **El código** (`GMetric`): la cifra como texto, con `lining-nums` de `GMetric`; el bloque **no** lo parte ni lo reformatea (la aplicación lo da con guiones si quiere grupos legibles, BK-L4).
- **Canales:** `tel:`, `mailto:`, `https://wa.me/…`; los del sistema no emiten `navigate` (#834); los externos llevan su marca (§3).

## Variantes

| Variante | Concepto | Compone | Ignora |
| --- | --- | --- | --- |
| **01 · Tarjeta** | La confirmación en una tarjeta con la ficha, el total y las acciones | `GCard as="section"` (raíz; título al nivel de `useSectionLevel()`, `badge` = estado; `media` = `offer.photos[0]` si hay) › anatomía común | `next` |
| **02 · Lo que sigue** | La confirmación y debajo los pasos siguientes, como un camino que ya empezó | `GSection` (título; el estado en `GText` bajo el título, ver «Estado en 02») › `GStack gap="lg"` › [anatomía común sin la foto] + `GSection` anidada (`labels.next`) › `GStepper orientation="vertical" navigation="none"` con `next` (el primero es el actual; los `date` en `<time>` de la descripción) | — |
| **03 · Captura** | Todo lo necesario en una sola tarjeta compacta que cabe en una pantalla de teléfono y se comparte por WhatsApp | `GCard as="section" density="compact" level="outlined"` sin `media` › código, consulta, total y canales; acciones solo si caben dos | `next`, `offer.photos`, `totals.lines` (solo el total) |

**Estado en 02:** `GSection` no tiene insignia; el estado va en una `GText size="body-sm"` inmediatamente después del encabezado (primer hijo del cuerpo) con el texto de `labels.states[state]` (texto, no color). **`GStepper` aquí es informativo** (`navigation="none"`, sin `v-model`: el actual es el primer paso de `next`): es un **proceso que la persona va a completar** (llegar, registrarse, pagar el resto), a diferencia del itinerario (#874).

## Eventos

`navigate` y `activate` (§4): acciones y canales. **`activate` de «Compartir»**: la aplicación llama a `navigator.share` en el gesto (la activación del usuario sigue viva: el evento es síncrono, `api.md` «Acciones con acuse», regla 2).

## Slots

`summary` `{ query, offer }` (escape: ficha propia en lugar del `GSummary`), `actions` (escape de §3).

## Qué lo hace distinto (#873)

**Cabe en una captura y se dice por teléfono.** El viajero guarda la confirmación como imagen o la reenvía por WhatsApp: 03 está pensada para eso (una tarjeta, sin pliegues ni pestañas, medida a 390 × 844 sin desplazar), y en las tres el **código va primero y grande**, la consulta se dice con las mismas palabras que eligió (`describeQuery`), el total es el que cobra el lugar y los canales para escribir ya están a un toque. Si la reserva aún no está confirmada, **lo dice** en texto: «pedida» no se disfraza de «confirmada». Las fechas de lo que sigue van en la hora del lugar, no en la del teléfono.

## Textos (`labels`)

| Clave | Requerido |
| --- | --- |
| `states` | Sí (C5) |
| `query`, `when` | Sí (K2; `when` C5) |
| `next`, `stepper` | Sí, en 02 con `next` |
| `channels` | Sí, con `channels` |
| `price` | Los de `GPrice` (avisa `GPrice`) |
| `external` | Sí, con un enlace externo |

## Avisos propios (`[Grana GbConfirmation<NN>]`)

C3 a C8, K1 a K3. Además: **F1** · `state` fuera de lista (se pinta `requested`: nunca se afirma una confirmación por defecto), **F2** · `reference.code` vacío (se pinta sin código), **F3** · 03 con más de dos `actions` o `totals.lines` (se ignoran).

## Banco (`confirmation.bank.js`)

Casa Alcalá: `state: 'confirmed'`, `reference` `{ code: 'CA-7K29Q', label: 'Código de reserva' }`, la consulta común, Suite Jardín, `totals` (dos noches, impuesto, total) con `note` «Pagas al llegar», tres `next` (llegada desde las 15:00 con `date`, registro, desayuno) en `America/Mexico_City`, `channels` (WhatsApp externo, `tel:+529515550000`, `mailto:`), `actions` («Añadir al calendario» con `href` a un `.ics`, «Compartir» sin `href`), `labels` completos; en Vitest además `state: 'requested'`.

## Verificación propia

Vitest: el código es el primer dato tras el título; `GSummary` con la consulta igual a `describeQuery`; insignia con texto por estado; F1 pinta `requested`; 02 con `GStepper` informativo (sin botones de paso); 03 sin `next`, sin foto, sin líneas del total; canales del sistema sin `navigate`; «Compartir» emite `activate` síncrono. Chromium: **03 entera dentro de 390 × 844 sin desplazar** con el banco (la medida de la promesa) y sin desbordar a 320; contraste de la insignia en claro y oscuro.
