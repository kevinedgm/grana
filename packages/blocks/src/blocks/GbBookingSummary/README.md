# GbBookingSummary · GbBookingSummary01, GbBookingSummary02 y GbBookingSummary03

Lo que vas a pedir, **dicho con tus palabras y con el total que cobra el lugar**, y qué pasa si cambias de idea, junto a la acción que sigue. El bloque no calcula nada: tu aplicación da las líneas y el total, y emite `navigate` o `activate` según la acción. Va como tarjeta, como recibo con el desglose completo o como una sola línea para lo alto de un paso. Compone `GCard`, `GSection`, `GStack`, `GAdaptiveLayout`, `GSummary`, `GPrice` y `GPriceScope` (`@grana/vue/price`), `GText` (con `dl`), `GBtn` y `describeQuery` (`@grana/vue/booking`); no trae color, CSS ni textos propios.

**Etiquetas:** `<gb-booking-summary-01>`, `<gb-booking-summary-02>`, `<gb-booking-summary-03>` · **Estado:** `candidate` (ver «Verificación») · **Desde:** `0.0.0` (paquete privado, aún sin publicar) · **Entrada:** `@grana/blocks/booking`

```js
import { GbBookingSummary01, GbBookingSummary02, GbBookingSummary03 } from '@grana/blocks/booking'
```

> `@grana/blocks` es privado (`0.0.0`) y no se publica con la beta `0.1.0` de `@grana/vue`. Por ahora se usa desde el repositorio (banco real en `packages/blocks/playground/booking/booking-summary.html`). Exige `@grana/vue` (peer, `>=0.1.0-beta.0 <1.0.0`) y Vue `^3.5.0`. Además de `@grana/vue`, la aplicación carga las entradas que esta sección compone: `@grana/vue/booking`, `@grana/vue/price`. Reglas comunes e instalación: [`packages/blocks/README.md`](../../../README.md).

## Qué lo hace distinto

**Lo que pides, con tus palabras, el total del lugar y la vuelta atrás dicha antes de pulsar** (DECISIONS #871). La consulta aparece con la misma frase que el viajero eligió en la búsqueda; el total es el que cobra el lugar (Grana no multiplica tarifas: el fin de semana cuesta distinto) y, si cambia, solo ruedan las cifras que cambian; y la condición de cancelación va **pegada a la acción** por su descripción (`aria-describedby`), que es justo donde se duda: quien usa lector oye «Continuar, Cancelación gratis hasta el 11 de noviembre» antes de pulsar. En la 03, todo eso cabe en una línea arriba del paso siguiente, para no perder de vista qué se está pagando.

## Las tres variantes

Las tres reciben la misma `interface Props` (`GbBookingSummaryProps`, el mismo objeto `props` de `props.js`). Lo que una variante no usa, lo ignora en silencio.

| Variante | Concepto | Compone | Ignora |
| --- | --- | --- | --- |
| `GbBookingSummary01` | Tarjeta: lo pedido, el total, la garantía y la acción en una tarjeta para la columna de al lado | `GCard as="section"` (raíz; título al nivel de `useSectionLevel()`, `media` = `offer.photos[0]` si hay) > `GSummary` + `GPrice` + garantía + acciones | `totals.lines` |
| `GbBookingSummary02` | El recibo: el desglose completo, línea a línea, para revisar antes de confirmar | `GSection` (título) > `GStack gap="md"` > `GSummary` + el desglose (un `dl` en `GText`, nombre `labels.lines`) + `GPrice` del total + `totals.note` + garantía + acciones | `offer.photos` |
| `GbBookingSummary03` | Línea: una sola línea compacta para lo alto de un paso del flujo | `GText as="div" size="body" role="group"` (con `aria-label` = `title`) > `GAdaptiveLayout gap="md" vertical="center"` > `GSummary layout="inline"` + `GPrice size="sm"` (solo el total) + la primera acción (`outline`); debajo, la garantía | `totals.lines`, `totals.note`, `offer.photos` y la segunda acción |

**Las piezas (comunes):**

- **Lo pedido:** `GSummary` con `title` = `offer.name`, `subtitle` = `offer.kind` y un dato (`labels.when`, «Fechas y personas») con las palabras de `describeQuery`; sin `offer`, la consulta sola es el `title`.
- **El total:** un `GPrice` con `offer.price` como tarifa y **`total` = `totals.total`** (la cuenta de `price.md`: el total arriba y la tarifa como contexto). Sin `totals`, la tarifa sola. Todo dentro de un `GPriceScope` si hay `prices`. El bloque **no suma** y **no comprueba** que las líneas sumen el total: el banco tiene líneas que no suman a propósito y el bloque pinta el total dado.
- **El desglose** (`totals.lines`, solo 02): un `dl` en `GText` con `dt` = `label`, un `GPrice size="sm"` del `amount` y la `note` de la línea.
- **La garantía:** `assurance` en `GText size="body-sm" tone="muted"` con un `id`, ligada por `aria-describedby` a la **acción principal**. El slot `actions` recibe ese `id` como `describedby`.

**La 03 se parte según el ancho (#906):** a 1440 y 1024 px el resumen, el total y la acción están en una sola línea; a 768 se parte en dos (el resumen, y el total con la acción debajo); a 390 y 320 px, en tres bloques apilados (el resumen, el total con su leyenda de moneda y la acción), siempre sin desbordar ni solapar y con la garantía debajo. Es comportamiento contratado, no un defecto: la línea se parte cuando no cabe. El resumen en línea cede por prioridad (a 768 el identificador de la oferta puede acortarse y a 390 un dato largo se corta con puntos suspensivos; todo lo cedido sigue en el resto del bloque); si quieres que sobreviva el identificador, usa 01 o 02.

## Recetas

### La consulta que viaja

Pasa a `query` la misma `BookingQuery` de [`GbSearch`](../GbSearch/README.md#la-consulta-que-viaja), con `partyRows` y `labels.query` (requeridos aquí). El resumen dice la consulta con las mismas palabras que la búsqueda y la oferta.

### Columna pegada con CSS de tu aplicación

Un resumen de reserva suele quedarse a la vista mientras se lee la página, en escritorio. **El bloque no puede pegarse**: no hay primitiva de columna pegada (BK-L1) ni un muelle propio (BK-L2), y el bloque no lleva CSS. Es tu aplicación la que pega **su** columna, con su CSS, y el bloque funciona igual sin ello:

```vue
<!-- Fragmento: `resumen` y `continuar` son de tu aplicación -->
<template>
  <div class="reserva">
    <main><!-- la oferta, las políticas... --></main>
    <aside class="reserva__lateral">
      <GbBookingSummary01 v-bind="resumen" @navigate="continuar" />
    </aside>
  </div>
</template>

<style>
.reserva { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 24rem); gap: var(--g-space-8); align-items: start; }
.reserva__lateral { position: sticky; inset-block-start: calc(var(--g-app-shell-top, 0px) + var(--g-space-4)); }
</style>
```

- **El borde superior:** con `GAppShell`, `--g-app-shell-top` es el alto de su banda; sin chasis, déjalo en `0px` más el aire que quieras.
- **`align-items: start`** es lo que permite que la columna pegada se mueva dentro de su fila.
- **Si la columna es más alta que la ventana**, no la pegues: se recortaría. Pégala solo en pantallas con el alto suficiente (por ejemplo, con una `@media (min-height: ...)` de tu aplicación).
- **2.4.11:** una columna pegada no debe tapar el elemento enfocado; revísalo con tu cabecera y tu `scroll-padding`.

Un muelle al pie para el total (como el de `GBookingBar`) sería un componente nuevo con su `EDGE_ORDER`; no existe (BK-L2). Mientras, `GbSearch03` cubre el caso de la consulta del hotel.

### Montaje en columna (BK-L13)

`GbBookingSummary01` está pensada para una **columna** (de 360 a 640 px), no para toda la página. A 1440 px de ancho su foto mide de 560 a 700 px de alto y baja el total y la acción del primer pantallazo (BK-L13, #905). La receta de arriba la monta en su columna de 24 rem; si no tienes lateral, usa `GContainer width="reading"`. El banco la monta a 1024 px por la misma razón.

## Uso

Los datos comunes (`consulta`, `partyRows`, `queryLabels`, `precios`, `priceLabels`) están en [«Datos comunes de una reserva»](../../../README.md#datos-comunes-de-una-reserva).

```vue
<!-- Fragmento: `fotoSuite` y `router` son de tu aplicación -->
<script setup>
import { GbBookingSummary01 } from '@grana/blocks/booking'
import { consulta, partyRows, queryLabels, precios, priceLabels } from './reserva.js'

const mxn = (amount) => ({ amount, currency: 'MXN' })

const resumen = {
  title: 'Tu reserva',
  query: consulta,
  partyRows,
  offer: { id: 'suite-jardin', name: 'Suite Jardín', kind: 'Suite', photos: [fotoSuite], price: { value: mxn(1850), lead: 'desde', unit: '/ noche', unitLabel: 'por noche' } },
  totals: {
    lines: [
      { label: 'Viernes 13 de noviembre', amount: mxn(1850) },
      { label: 'Sábado 14 de noviembre', amount: mxn(2100), note: 'Tarifa de fin de semana' },
      { label: 'Impuesto de hospedaje', amount: mxn(123), note: '3 %' }
    ],
    total: { value: mxn(4290), label: 'por 2 noches' }, // lo calcula tu aplicación; el bloque no suma
    note: 'Pagas al llegar: no te cobramos nada ahora.'
  },
  prices: precios,
  assurance: 'Cancelación gratis hasta el 11 de noviembre.',
  actions: [
    { id: 'continuar', label: 'Continuar', href: '/reservar/datos' },
    { id: 'fechas', label: 'Cambiar fechas', href: '/reservar' }
  ],
  locale: 'es',
  labels: { when: 'Fechas y personas', lines: 'Desglose', query: queryLabels, price: priceLabels, external: 'se abre en otra pestaña' }
}

function continuar({ event, href }) {
  event.preventDefault() // tu router navega
  router.push(href)
}
</script>

<template>
  <GbBookingSummary01 v-bind="resumen" @navigate="continuar" />
</template>
```

La aplicación carga además `@grana/vue/price` y `@grana/vue/booking`.

## Ejemplos

### e1 · El resumen en la columna de al lado (`GbBookingSummary01`)

**Por qué:** cuando la persona lee la oferta o rellena el formulario y quiere ver siempre qué está pidiendo y cuánto cuesta. Va en una columna, con la receta de «Columna pegada» si la quieres a la vista.

```vue
<!-- Fragmento: `continuar`, `resumen` son de tu aplicación -->
<GbBookingSummary01 v-bind="resumen" @navigate="continuar" />
```

### e2 · El recibo para revisar antes de confirmar (`GbBookingSummary02`)

**Por qué:** cuando el último paso es revisar el cobro. El desglose muestra cada línea con su nota, el total que cobra el lugar y la garantía pegada a «Continuar».

```vue
<!-- Fragmento: `continuar`, `resumen` son de tu aplicación -->
<GbBookingSummary02 v-bind="resumen" @navigate="continuar" />
```

### e3 · Una línea arriba de un paso del flujo (`GbBookingSummary03`)

**Por qué:** cuando el formulario ocupa la pantalla y solo necesitas recordar qué se paga. Lleva una sola acción (`outline`) y se parte en líneas cuando no cabe.

```vue
<!-- Fragmento: `continuar`, `resumen` son de tu aplicación -->
<GbBookingSummary03 v-bind="resumen" @navigate="continuar" />
```

### e4 · Una acción que no navega (`activate`)

**Por qué:** cuando «Continuar» abre un diálogo o llama a tu código en lugar de ir a una página. Una acción sin `href` emite `activate`.

```vue
<!-- Fragmento: `abrirPago` es de tu aplicación -->
<GbBookingSummary01 v-bind="{ ...resumen, actions: [{ id: 'continuar', label: 'Continuar' }] }" @activate="({ item }) => abrirPago(item.id)" />
```

## Props

Una sola interfaz para las tres variantes (`GbBookingSummaryProps`). Los tipos de datos salen de `@grana/blocks/booking`.

| Prop | Tipo | Descripción |
| --- | --- | --- |
| `title` | `string` (requerida) | «Tu reserva»; en 03 nombra la línea (`aria-label`). |
| `query` | `BookingQuery` (requerida) | Dicha con describeQuery (#862) |
| `partyRows` | `PartyRow[]` (requerida) | Las filas de `GPartyField`, para decir la consulta. |
| `context` | `QueryContextExtra` |  |
| `offer` | `OfferRef` | Nombre y tipo en el GSummary; la tarifa (price) como contexto del total; la primera foto en 01 |
| `totals` | `Totals` | Lo que cobra el lugar (de la aplicación); el bloque no suma ni comprueba las líneas. 02 pinta el desglose y la nota |
| `prices` | `PriceRegion` | Una GPriceScope (la moneda se dice una vez); con precios y sin ella, K3 |
| `assurance` | `string` | Lo que pasa si cambias de idea; describe la acción principal (aria-describedby, #838) |
| `actions` | `Action[]` | 0 a 2 (§3): la primera solid, la segunda outline; 03 pinta solo la primera (outline) |
| `locale` | `string` | BCP 47; sin él, el `lang` del ancestro al montar. |
| `labels` | `BookingSummaryLabels` (requerida) | when y query (C5, K2), lines (02 con totals.lines), price, external; sin valores por defecto |

## Eventos

| Evento | Carga | Cuándo |
| --- | --- | --- |
| `navigate` | `{ event, href, item }` (`BlockNavigate<Action>`) | Una acción con href y clic primario (#505); nunca con external (#574) |
| `activate` | `{ event, item }` (`BlockActivate<Action>`) | Una acción sin href |

No hay `select` ni `book`: el resumen no elige nada nuevo. Una acción `external` no emite `navigate`.

## Slots

| Slot | Alcance | Qué va |
| --- | --- | --- |
| `summary` | `{ query: BookingQuery; offer: OfferRef \| undefined }` | Escape: lo pedido propio en lugar del GSummary |
| `actions` | `{ describedby: string \| undefined }` | Escape de las acciones (§3), con el id de la garantía (#838) |

## Textos (`labels`)

| Clave | Requerido |
| --- | --- |
| `when`, `query` | Sí (C5, K2) |
| `lines` | Sí, en 02 con `totals.lines` (C5) |
| `price` | Los de `GPrice` (avisa `GPrice`; `labels.total` de la cuenta) |
| `external` | Sí, con una acción externa |

## Accesibilidad

Cifras de la auditoría de coco ([`design/lab/blocks/booking/auditoria.md`](../../../../../design/lab/blocks/booking/auditoria.md)), tres motores, tres temas, claro y oscuro (`medido`):

a. La consulta tiene las mismas palabras que el resumen de `GBookingBar`; en una línea a 1440 y en una o dos a 390 (BK-C1, corregido en `GSummary.css`).
b. La garantía va en el `aria-describedby` de la acción principal (`prueba`, spec de bruno).
c. El desglose de 02 es un `dl` real con su ritmo y sin la sangría del navegador (BK-C3 y #863, corregidos en `GText.css`); la viñeta de las listas es la misma en todas las variantes.
d. 03: una raíz `role="group"` con nombre (no una región, para no sumar un hito de navegación); la garantía queda siempre bajo la línea, alineada al inicio y con contraste ≥ 4,5:1.
e. 03 medida a 1440, 1024, 768, 390 y 320 px: una línea a 1440 y 1024, dos limpias a 768, tres bloques apilados limpios a 390 y 320; sin desbordar ni solapar en ninguna.
f. El total rueda solo en las cifras que cambian, sin mover el precio; con movimiento reducido no rueda.
g. Sin desplazamiento horizontal a 1440, 390, 320 ni a 320 con el texto al 200 %; el botón con una palabra larga parte la etiqueta sin desbordar (BK-C2).

> **Peligro.** El bloque **pinta el total que le das, sin sumar**: si tus líneas no suman el total, la persona verá un recibo que no cuadra y el bloque no avisará. Calcula el total en tu aplicación (o en tu servidor) con la misma fuente que cobra, y revisa que `totals.total.label` diga su unidad («por 2 noches»): sin ella, la cuenta no tiene con qué compararse (R1).

## Avisos de desarrollo

Prefijo `[Grana GbBookingSummary<NN>]`, una vez por instancia y motivo, solo en desarrollo. Los comunes (C5, C6, C8, K1 a K3) están en [`packages/blocks/README.md`](../../../README.md#avisos-comunes-de-booking). Los propios:

| Código | Motivo | Qué pasa |
| --- | --- | --- |
| R1 | `totals.total` sin `label` | La cuenta necesita su unidad («por 2 noches»); lo avisa también `GPrice` |
| R2 | Más de 8 líneas en `totals.lines` (02) | Se pintan todas |

## Banco de datos de ejemplo

`booking-summary.bank.js` exporta `{ props, slots, states }`: la consulta común; Suite Jardín con foto y `price` («desde» 1 850 por noche); `totals` con tres líneas cuya suma **no** es el total (1 850 + 2 100 + 123 es distinto de 4 290; el bloque pinta el total dado), `total` 4 290 «por 2 noches» y `note` «Pagas al llegar»; `prices` MXN; `assurance`; dos `actions` («Continuar» y «Cambiar fechas», con `href`) y `labels` completos. `states.tres` cambia el total a tres noches, para ver rodar las cifras. Banco real: `packages/blocks/playground/booking/booking-summary.html`.

## Peso

`dist/booking.js` pesa **36 851 B gzip** con su trozo compartido de `common/` (las 11 secciones y 33 variantes; `medido` con `node packages/blocks/scripts/measure-entry.mjs booking`  2026-10-23); tope de la entrada **37 888 B** (DECISIONS #907; el tope inicial de 36 KiB no se vuelve a subir). Una variante importada sola (esbuild minificado  `vue` y `@grana/vue*` externos; `node packages/blocks/scripts/measure-partial.mjs 5120 booking GbGuestForm=7168`): `GbBookingSummary01` 4 082 B  `GbBookingSummary02` 3 894 B  `GbBookingSummary03` 3 949 B; tope por variante **5 120 B** (#887). `@grana/vue` y sus entradas son *peer*: las paga la aplicación.

## Alcance

- **No suma ni comprueba:** el total y las líneas son de tu aplicación (#769).
- **No se pega solo (BK-L1) ni tiene muelle (BK-L2):** la columna pegada es CSS de tu aplicación (receta arriba).
- **03 conserva la leyenda de moneda** de `GPriceScope` (BK-L14, #903): es lo que permite omitir los códigos del total. Si tu aplicación ya dice la moneda en otro sitio visible, pasa `prices.legend: false`; el bloque no lo decide por ti. La leyenda alarga la segunda línea de 03 a 108–128 px de alto, el costo aceptado (#906).
- **BK-L10 (cerrado):** la raíz de 03 es una `GText size="body"`, así que el resumen en línea hereda la tipografía del tema y no la del `body` de la página.
- **BK-L13:** la tarjeta 01 se monta en una columna (receta arriba).
- **Sin CSS ni utilidades** (#763, #807).

## Verificación

| Qué | Resultado | Nivel |
| --- | --- | --- |
| Vitest de `GbBookingSummary` (la consulta igual a `describeQuery`; `GPrice` con `total` = `totals.total` y sin aritmética en el bloque, con un banco cuyas líneas no suman el total; la garantía en `aria-describedby` de la principal; 02 con un `dl` real; 03 en una fila de `GAdaptiveLayout` con `GSummary` de hijo directo y una sola acción) | 39/39 (`npm test -w @grana/blocks`, 2026-10-23) | `prueba` |
| Auditoría de coco: Booking summary 01, 02 y 03; 03 medida a 1440, 1024, 768, 390 y 320 en los tres motores y tres temas (BS-L1 cerrado, #906) | `--solo=shapes` 396/396 en los tres motores tras corregir el verificador; veredicto `candidate` | `medido` |

**No verificado:** lector de pantalla real (la garantía junto a la acción, el total que rueda); `forced-colors` real; teléfono real; rendimiento con el perfilador; la receta de columna pegada (es CSS de la aplicación, no se montó ni se midió). **Pendientes abiertos:** lima confirma si acepta los tres bloques apilados de 03 a 390 px y valora el identificador cedido a 768 (addendum de coco); BK-L1 y BK-L2; los generales, en [`PENDIENTES.md`](../../../../../PENDIENTES.md).

## Fuentes

- Contrato: [`design/contracts/blocks/booking-summary.md`](../../../../../design/contracts/blocks/booking-summary.md) y [`_comun.md`](../../../../../design/contracts/blocks/_comun.md) (§15 a §25); [`price.md`](../../../../../design/contracts/price.md) (la cuenta).
- Decisiones: #860 a #866, #871, #894, #897, #898, #903, #905 a #907 en `DECISIONS.md`.
- Metadatos: [`GbBookingSummary.meta.json`](./GbBookingSummary.meta.json). Pruebas: [`GbBookingSummary.test.js`](./GbBookingSummary.test.js). Auditoría: [`design/lab/blocks/booking/auditoria.md`](../../../../../design/lab/blocks/booking/auditoria.md).
