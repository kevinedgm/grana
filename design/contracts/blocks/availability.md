# Contrato · Availability (`GbAvailability01` · `02` · `03`)

**Dueño:** lima · **Estado:** contratado (DECISIONS.md #860 a #866 y #870, 2026-10-22) · **Plan:** B4 (§4.3) · **Entrada:** `@grana/blocks/booking` · **Común:** `_comun.md` §1 a §5 y §14 a §25 · **Compone:** `GSection`, `GDatePicker` (`inline`, slot `day`, `dayDescription`; `design/contracts/datepicker.md`), `GPrice` + `GPriceScope` + `formatPrice` (`@grana/vue/price`), `GStack`, `GCard`, `GAdaptiveLayout`, `GSummary`, `GText`, `GBtn`, `describeQuery` · **Parte de bruno:** C · **bruno y coco en Opus** (calendario con precio por día y lectura)

## Promesa

Qué días hay sitio y cuánto cuestan, **dicho en el día** (visible y oído), y lo lleno **dicho como lleno**, no adivinado por un gris. El viajero elige una fecha (o una estancia) y el bloque emite la intención; la disponibilidad y los precios los da la aplicación.

## Props

```ts
interface GbAvailabilityProps {
  title: string
  description?: string
  kind: BookingKind                      // stay: rango (llegada–salida); table y tour: un día
  days: AvailabilityDay[]                // los días que la aplicación conoce (≤ 120; C7); un día ausente = sin dato
  value?: string | { start: string | null; end: string | null } | null   // v-model:value (ISO; rango en stay)
  min?: string; max?: string
  minNights?: number; maxNights?: number // stay
  upcoming?: number                      // 02: cuántas fechas abiertas enseñar (por defecto 8; 1 a 30)
  total?: PriceTotal                     // 03: el total de la selección, de la aplicación
  query?: BookingQuery | null            // para decir la selección y emitirla (con su party)
  partyRows?: PartyRow[]
  prices?: PriceRegion
  locale?: string
  labels: {
    status: { few: string; full: string; closed: string }   // «Quedan pocas», «Lleno», «Cerrado»
    select?: string                      // «Elegir estas fechas» (03) / «Elegir» (02)
    upcoming?: string                    // nombre de la lista (02) («Próximas fechas»)
    query?: QueryLabels
    datePicker?: GranaLabels             // a GDatePicker, tal cual
    price?: PriceLabels & { legend?: string }
  }
}
```

## Del dato al calendario (común a 01 y 03)

| `AvailabilityDay.status` | `kind` `stay` | `table`/`tour` | Texto oído (`dayDescription`) |
| --- | --- | --- | --- |
| `open` | elegible | elegible | el precio (`formatPrice(price).spoken`) y `note` |
| `few` | elegible | elegible | `labels.status.few`, el precio y `note` |
| `full` | **noche agotada** (`disabledNights`: se puede salir ese día, no dormir; #739) | no elegible (`disabledDates`) | `labels.status.full` |
| `closed` | no elegible (`disabledDates`) | no elegible | `labels.status.closed` |
| (sin dato) | elegible según `min`/`max` | elegible | nada |

- **El slot `day`** de `GDatePicker` pinta, bajo el número, `GPrice size="xs" display="none" cents="never"` del `price` del día (la forma «día con contenido» de coco, `datepicker.md`) y, en `few`/`full`/`closed`, nada más en la celda (el estado lo da la forma de `GDatePicker` y el texto oído; el precio de un día lleno no se pinta). **Límite #801:** cinco cifras no caben a 320 px: con precios de cinco cifras, la aplicación no da `price` por día (se pinta sin precio) o usa 02.
- **`dayDescription(iso)`** devuelve el texto de la tabla, unido por «, »: «viernes, 13 de noviembre de 2026, quedan pocas, 1,850 pesos mexicanos». El bloque no repite lo que `GDatePicker` ya dice (hoy, seleccionado, no disponible).
- La región: con `prices`, el calendario va dentro de un `GPriceScope` (la leyenda dice la moneda; las celdas, solo cifras).

## Variantes

| Variante | Concepto | Compone | Ignora |
| --- | --- | --- | --- |
| **01 · Calendario con precio** | El mes con el precio en cada día | `GSection` › `GPriceScope` › `GDatePicker inline` (`mode` = `range` en `stay` y `single` en el resto, `months="auto"`, `min`/`max`, `disabledDates`/`disabledNights` derivados, `minNights`/`maxNights`, `dayDescription`, slot `day`, `labels` = `labels.datePicker`, `v-model` = `value`) | `upcoming`, `total` |
| **02 · Próximas fechas** | Las próximas fechas abiertas en una lista, cada una con su día en palabras, su estado y su precio | `GSection` › `GPriceScope` › `GStack as="ul" gap="sm" [aria-label=labels.upcoming]` › `GCard as="li" level="flat" orientation="horizontal" interaction="button"` por cada uno de los `upcoming` primeros días `open`/`few` desde hoy o `min` (`title` = `<time>` con la fecha en palabras, `badge` = `labels.status.few` si toca, cuerpo `GPrice size="sm"` y `note`; activar → `select`) | `total`, `minNights`/`maxNights` (en `stay` elige **la llegada**) |
| **03 · Calendario + resumen** | El calendario y, **debajo** (dos columnas reservadas, AV-L1 / #892), lo elegido con su total y la acción | `GSection` › `GStack gap="lg"` › [`GPriceScope` › el `GDatePicker` de 01] + [`GCard level="outlined"`: el `title` es la selección dicha con `describeQuery` (sin `GSummary`, #892), `GPrice` con `total`, `GBtn solid` `labels.select` → `select`] | `upcoming` |

## Eventos

| Evento | Carga | Cuándo |
| --- | --- | --- |
| `update:value` | ISO o `{ start, end }` | Cada elección en el calendario (01, 03) |
| `select` | `{ event, kind, value, day, query }` | **01:** al completar la elección (un día; o el rango completo en `stay`). **02:** al activar una fecha (`value` = ISO; en `stay`, `{ start: iso, end: null }`). **03:** el botón `labels.select`, con la elección completa. `day` = el `AvailabilityDay` del día elegido (o de la llegada); `query` = la consulta recibida con las fechas elegidas puestas |

## Slots

`day` `{ date, day: AvailabilityDay | null, … }` (escape del contenido de la celda; mismas reglas que el slot `day` de `GDatePicker`), `summary` (escape del resumen de 03), `empty` (02 sin fechas abiertas: lo que pinta la aplicación, p. ej. `GEmpty`).

## Qué lo hace distinto (#870)

**Lo lleno se dice, no se adivina, y el precio del día se oye.** Cada día lleva su estado en palabras («quedan pocas», «lleno») y su precio **en el nombre del día** que oye el lector, no solo en una cifra pintada que `GDatePicker` no lee (#778). En una estancia, el día lleno sigue siendo **elegible como salida** (la noche agotada no es el día agotado, #739): el viajero no se queda sin la fecha de vuelta por una regla mal dibujada. En 02, las fechas libres están en una lista que se lee de un vistazo en el teléfono, con el día de la semana en palabras.

## Textos (`labels`)

| Clave | Requerido |
| --- | --- |
| `status` | Sí (C5, la primera vez que un día lo necesita) |
| `select` | Sí, en 02 y 03 (C5) |
| `upcoming` | Sí, en 02 (C5) |
| `query` | Sí, en 03 con `query` (K2) |
| `datePicker` | Los de `GDatePicker` (avisa él) |
| `price` | Los de `GPrice`/`GPriceScope` |

## Avisos propios (`[Grana GbAvailability<NN>]`)

C3 (fecha repetida en `days`), C7, K1 a K3. Además: **V1** · un día con `status` fuera de lista (cuenta como sin dato), **V2** · `minNights`/`maxNights` con `kind` distinto de `stay`, **V3** · un precio de día con cinco cifras o más en 01 o 03 (#801: se pinta y puede desbordar a 320; una vez), **V4** · 02 sin ninguna fecha abierta en lo que conoce (no se pinta la lista; la aplicación decide el mensaje, p. ej. con `GEmpty` en el slot `empty`).

## Banco (`availability.bank.js`)

Casa Alcalá, noviembre de 2026: 30 días con precios de cuatro cifras (fin de semana más caro), tres `few`, el viernes 20 `full` (noche agotada), dos `closed`, uno sin dato; `kind: 'stay'`, `minNights: 1`, `value` = el rango de la consulta común, `total` para ese rango, `upcoming: 6`, `prices` MXN, la consulta común; `labels` completos. Vitest también con `kind: 'table'`.

## Verificación propia

Vitest: derivación de la tabla (`full` en `stay` es `disabledNights` y en `table` es `disabledDates`); `dayDescription` con estado y precio leído; slot `day` con `GPrice xs display none cents never` y sin precio en un día lleno; 02 con los `upcoming` primeros días abiertos en orden y `time datetime`; las tres cargas de `select`; 03 con la selección igual a `describeQuery` y el `total` dado. Chromium: el nombre accesible del día incluye estado y precio (`ariaSnapshot`); el día lleno se puede elegir como salida y no como llegada en `stay`; 01 a 320 sin desbordar con cuatro cifras; 03 en dos columnas a 1440 y una a 390.

## Enmiendas del remate de Booking C (#892, #893)

- **AV-L1 · 03 en una columna (cerrado, #892 y #899):** no hay contrato de dos columnas ni la verificación debe pedirlas; el único criterio de 03 es el calendario, **debajo** la tarjeta con la selección, el total y la acción, en una columna a cualquier ancho. No bloquea `candidate`. Detalle: `GAdaptiveLayout` ignora la pista cuando el hijo es una `<table>` (el calendario lo es) y el resumen queda debajo. Aceptado; dos columnas queda **reservado** hasta que la pista funcione con ese hijo o se decida otra forma de envolverlo. Se reabre solo con esa medida.
- **03 sin `GSummary`:** el `title` de la tarjeta es la frase de `describeQuery`; un `GSummary layout="stack"` partía el valor en una columna de ~130 px (#896).
- **02 · nombre y descripción:** `labels.select` solo se usa en 03. La tarjeta-botón se nombra por **la fecha** (con el estado si es «pocas plazas»); **el precio y la nota son su descripción** (`aria-describedby`), porque el cuerpo de un botón no se oye al enfocar. Bruno lo construye así.
- **V4:** con el slot `empty` presente no se avisa (la aplicación ya decidió el mensaje).
