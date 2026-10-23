# Contrato · Booking summary (`GbBookingSummary01` · `02` · `03`)

**Dueño:** lima · **Estado:** contratado (DECISIONS.md #860 a #866 y #871, 2026-10-22) · **Plan:** B5 (§4.3) · **Entrada:** `@grana/blocks/booking` · **Común:** `_comun.md` §1 a §5 y §14 a §25 · **Compone:** `GCard`, `GSection`, `GStack`, `GSummary`, `GPrice` + `GPriceScope`, `GText` (con `dl`, #863), `GBtn`, `describeQuery` · **Parte de bruno:** C

## Promesa

Lo que vas a pedir, **dicho con tus palabras y con el total que cobra el lugar**, y qué pasa si cambias de idea, junto a la acción que sigue. El bloque no calcula nada: la aplicación da las líneas y el total.

## Props

```ts
interface GbBookingSummaryProps {
  title: string                          // «Tu reserva»
  query: BookingQuery
  partyRows: PartyRow[]
  context?: Omit<QueryContext, 'partyRows'>
  offer?: Pick<Offer, 'id' | 'name' | 'kind' | 'photos' | 'price'>
  totals?: Totals                        // líneas y total, de la aplicación
  prices?: PriceRegion
  assurance?: string                     // lo que pasa si cambias de idea («Cancelación gratis hasta el 11 de noviembre»)
  actions?: Action[]                     // 0 a 2 (§3): «Continuar», «Cambiar fechas»
  locale?: string
  labels: {
    when: string                         // rótulo de la consulta («Fechas y personas»)
    lines?: string                       // nombre del desglose («Desglose») — 02
    query: QueryLabels
    price?: PriceLabels & { legend?: string }
    external?: string
  }
}
```

## Piezas (comunes)

- **Lo pedido:** `GSummary` (`title` = `offer.name`, `subtitle` = `offer.kind`, `facts` = `[{ label: labels.when, value: describeQuery(query, …).text, priority: 1 }]`); sin `offer`, la consulta sola como `title`.
- **El total:** `GPrice` con `offer.price` como tarifa y **`total` = `totals.total`** (A · La cuenta de `price.md`: el total arriba y la tarifa como contexto; las cifras que cambian ruedan con la regla de `GPrice`). Sin `totals`, la tarifa sola. Dentro de un `GPriceScope` con `prices`.
- **El desglose** (`totals.lines`): `GText as="div" size="body-sm"` › `dl` › `div` por línea (`dt` = `label`, `dd` = `GPrice size="sm"` del `amount`, `dd` = `note` si hay) (tipografía de `dl` por #863). La suma la hizo la aplicación; el bloque **no comprueba** que las líneas sumen el total.
- **La garantía:** `assurance` en `GText size="body-sm" tone="muted"` con `id`, ligada por `aria-describedby` a la **acción principal** (patrón de CTA, #838, con `GbActions`): quien usa lector oye «Continuar, Cancelación gratis hasta el 11 de noviembre» antes de pulsar.

## Variantes

| Variante | Concepto | Compone | Ignora |
| --- | --- | --- | --- |
| **01 · Tarjeta** | Lo pedido, el total, la garantía y la acción en una tarjeta para la columna de al lado | `GCard as="section"` (raíz; título al nivel de `useSectionLevel()`, `media` = `offer.photos[0]` si hay) › `GSummary` + `GPrice` + garantía + `actions` | `totals.lines` |
| **02 · El recibo** | El desglose completo, línea a línea, para revisar antes de confirmar | `GSection` (título) › `GStack gap="md"` › `GSummary` + desglose (`dl`, nombre `labels.lines`) + `GPrice` del total + `totals.note` + garantía + acciones | `offer.photos` |
| **03 · Línea** | Una sola línea compacta para lo alto de un paso del flujo | `GStack orientation="horizontal" gap="md" vertical="center"` (raíz: **`div role="group"` con `aria-label` = `title`**, #894) › `GSummary layout="inline"` (toma el sobrante) + `GPrice size="sm"` (solo el total, sin la tarifa) + la primera acción (`outline`) | `totals.lines`, `totals.note`, `offer.photos`, la segunda acción |

**Columna pegada y muelle** (plan §4.3: «tarjeta lateral pegada», «muelle al pie»): sin CSS no hay forma de pegar el bloque ni un muelle propio (BK-L1, BK-L2, `_comun.md` §23). La aplicación pega su columna con su CSS (receta del README: `position: sticky` en **su** contenedor, con `top` = `--g-app-shell-top` si hay chasis); el bloque no lo necesita para funcionar.

## Eventos

`navigate` y `activate` (§4) de las acciones (`item` = la `Action`). Sin `select` ni `book`: el resumen no elige nada nuevo.

## Slots

`summary` `{ query, offer }` (escape), `actions` `{ describedby }` (escape de §3, con el `id` de la garantía, #838).

## Qué lo hace distinto (#871)

**Lo que pides, con tus palabras, el total del lugar y la vuelta atrás dicha antes de pulsar.** La consulta aparece con la misma frase que el viajero eligió en la búsqueda; el total es el que cobra el lugar (Grana no multiplica tarifas: el fin de semana cuesta distinto) y, si cambia, solo ruedan las cifras que cambian; y la condición de cancelación va **pegada a la acción** por su descripción, que es justo donde se duda. En 03, todo eso cabe en una línea arriba del paso siguiente para no perder de vista qué se está pagando.

## Textos (`labels`)

| Clave | Requerido |
| --- | --- |
| `when`, `query` | Sí (C5, K2) |
| `lines` | Sí, en 02 con `totals.lines` (C5) |
| `price` | Los de `GPrice` (avisa `GPrice`; `labels.total` de la cuenta) |
| `external` | Sí, con una acción externa |

## Avisos propios (`[Grana GbBookingSummary<NN>]`)

C5, C6, C8, K1 a K3. Además: **R1** · `totals.total` sin `label` (la cuenta necesita su unidad: «por 2 noches»; lo avisa también `GPrice`), **R2** · más de 8 líneas en `totals.lines` (C7 de esta sección).

## Banco (`booking-summary.bank.js`)

La consulta común; Suite Jardín con foto y `price` («desde» $1,850 / noche); `totals` con tres líneas (dos noches con tarifas distintas, impuesto) y `total` $4,290 «por 2 noches», `note` «Pagas al llegar»; `prices` MXN; `assurance`; `actions` «Continuar» (`href`) y «Cambiar fechas» (`href`); `labels` completos.

## Verificación propia

Vitest: la línea de la consulta igual a `describeQuery`; `GPrice` con `total` = `totals.total` (la cuenta) y sin aritmética en el bloque (el banco tiene líneas cuya suma **no** es el total y el bloque pinta el total dado); la garantía en `aria-describedby` de la principal; 02 con un `dl` real y sus `dd` sin sangría (clase `g-text` alrededor); 03 en una sola fila con una sola acción. Chromium: 03 se parte en líneas a 320 sin desbordar; 01 en una columna de 360 px sin desbordar; el cambio de `totals` hace rodar la cifra (regla de `GPrice`) y con reducido no.

## Enmiendas del remate de Booking C (#894)

- **03 sin encabezado:** un `div role="group"` con `aria-label` = `title` (como Guest form 03, #882); no es una región, para no sumar un hito de navegación a una línea.
- **BS-L1:** el `GSummary` en línea ocupa toda la fila de la `GStack` horizontal y el total y la acción pasaban a una segunda línea en escritorio. Contrato: en la raíz de 03, lo pedido toma **solo el sobrante** (`flex: 1 1 auto; min-inline-size: 0`) y el total y la acción conservan su ancho; la fila se parte en líneas solo cuando el ancho no alcanza. Es de CSS: **coco** lo corrige en la auditoría y bruno añade la clase si falta.
