# GbAvailability · GbAvailability01, GbAvailability02 y GbAvailability03

Qué días hay sitio y cuánto cuestan, **dicho en el día** (visible y oído), y lo lleno **dicho como lleno**, no adivinado por un gris. La persona elige una fecha o una estancia y el bloque emite la intención; la disponibilidad y los precios los da tu aplicación. Va como calendario con precio, como lista de próximas fechas o como calendario con un resumen al lado o debajo. Compone `GSection`, `GDatePicker` (`inline`, con el precio del día), `GPrice` y `GPriceScope` (`@grana/vue/price`), `GStack`, `GSplit`, `GCard`, `GText`, `GBtn` y `describeQuery` (`@grana/vue/booking`); no trae color, CSS ni textos propios.

**Etiquetas:** `<gb-availability-01>`, `<gb-availability-02>`, `<gb-availability-03>` · **Estado:** `candidate` (ver «Verificación») · **Desde:** `0.0.0` (paquete privado, aún sin publicar) · **Entrada:** `@grana/blocks/booking`

```js
import { GbAvailability01, GbAvailability02, GbAvailability03 } from '@grana/blocks/booking'
```

> `@grana/blocks` es privado (`0.0.0`) y no se publica con la beta `0.1.0` de `@grana/vue`. Por ahora se usa desde el repositorio (banco real en `packages/blocks/playground/booking/availability.html`). Exige `@grana/vue` (peer, `>=0.1.0-beta.0 <1.0.0`) y Vue `^3.5.0`. Además de `@grana/vue`, la aplicación carga las entradas que esta sección compone: `@grana/vue/booking`, `@grana/vue/price`. Reglas comunes e instalación: [`packages/blocks/README.md`](../../../README.md).

## Qué lo hace distinto

**Lo lleno se dice, no se adivina, y el precio del día se oye** (DECISIONS #870). Cada día lleva su estado en palabras («quedan pocas», «lleno») y su precio **en el nombre del día** que oye el lector, no solo en una cifra pintada que `GDatePicker` no lee (#778). En una estancia, el día lleno sigue siendo **elegible como salida**: la noche agotada no es el día agotado (#739), así que el viajero no se queda sin la fecha de vuelta por una regla mal dibujada. En 02, las fechas libres están en una lista que se lee de un vistazo en el teléfono, con el día de la semana en palabras.

## Las tres variantes

Las tres reciben la misma `interface Props` (`GbAvailabilityProps`, el mismo objeto `props` de `props.js`). Lo que una variante no usa, lo ignora en silencio.

| Variante | Concepto | Compone | Ignora |
| --- | --- | --- | --- |
| `GbAvailability01` | Calendario con precio: el mes con el precio en cada día | `GSection` > `GPriceScope` > `GDatePicker inline` (`mode` = `range` en `stay` y `single` en el resto, `months="auto"`, `min`/`max`, los días derivados, `dayDescription`, el slot `day`) | `upcoming`, `total` |
| `GbAvailability02` | Próximas fechas: las próximas fechas abiertas en una lista, con su día en palabras, su estado y su precio | `GSection` > `GPriceScope` > `GStack as="ul"` (nombre `labels.upcoming`) > `GCard as="li" level="flat" interaction="button"` por cada una de las primeras `upcoming` fechas `open` o `few` desde hoy o `min` | `total`, `minNights` y `maxNights` (en `stay` elige **la llegada**) |
| `GbAvailability03` | Calendario + resumen: el calendario y, **al lado** si cabe (debajo si no), lo elegido con su total y la acción | `GSection` > `GPriceScope` > `GSplit ratio="2:1" gap="lg"` > [`#start`: el `GDatePicker` de 01] + [`#end`: `GCard level="outlined"`: el `title` es la selección dicha con `describeQuery`, el `GPrice` con `total` y un `GBtn solid` `labels.select`] | `upcoming` |

**Del dato al calendario (01 y 03):**

| `AvailabilityDay.status` | `stay` | `table` y `tour` | Texto oído (`dayDescription`) |
| --- | --- | --- | --- |
| `open` | elegible | elegible | el precio y la `note` |
| `few` | elegible | elegible | `labels.status.few`, el precio y la `note` |
| `full` | **noche agotada**: se puede salir ese día, no dormir (#739) | no elegible | `labels.status.full` |
| `closed` | no elegible | no elegible | `labels.status.closed` |
| (sin dato) | elegible según `min` y `max` | elegible | nada |

- **El slot `day`** de `GDatePicker` pinta, bajo el número, el `GPrice` del precio del día y, en `few`, `full` o `closed`, nada más en la celda: el estado lo da la forma de `GDatePicker` y el texto oído. El precio de un día lleno no se pinta.
- **`dayDescription`** devuelve el texto unido por «, »: «viernes, 13 de noviembre de 2026, quedan pocas, 1,850 pesos mexicanos». El bloque no repite lo que `GDatePicker` ya dice (hoy, seleccionado, no disponible).
- **Con `prices`**, el calendario va dentro de un `GPriceScope`: la leyenda dice la moneda y las celdas llevan solo cifras.
- **Cuando el precio no cabe en la celda (AV-C1, #952 y #956):** con el texto al 200 % o con cifras largas (cinco cifras a 320 px), `GDatePicker` **saca el precio de todas las celdas** y lo enseña bajo el calendario, el del día activo (puntero o teclado); el precio sigue en el nombre accesible del día y las celdas no cambian de medida. No lo configuras tú: lo decide el calendario por lo que mide ([`GDatePicker/README.md`](../../../../vue/src/components/GDatePicker/README.md#cuando-el-dato-no-cabe-en-la-celda-la-lectura-del-día-av-c1)). En táctil, el día activo es el elegido (límite aceptado). El aviso V3 sigue avisando de las cinco cifras.

**02, nombre y descripción de la fecha:** la tarjeta-botón se nombra por **la fecha** (con el estado si es «pocas plazas»); el precio y la nota son su descripción (`aria-describedby`), porque el cuerpo de un botón no se oye al enfocar. `labels.select` solo lo usa 03.

**03 vuelve a dos columnas con `GSplit`** (DECISIONS #950, que enmienda #892 y #899): `GSplit ratio="2:1" gap="lg"` pone el calendario (`start`) y la tarjeta de la selección (`end`) **lado a lado cuando la caja alcanza el umbral y una debajo de la otra cuando no**. Con el tema por defecto y `collapse="md"` el umbral es **1008 px de caja** (`320 × 3 + 48`): a 1440 va al lado (calendario 651 px, tarjeta 325 px) y a 1024, 768, 390, 320 y con el texto al 200 % queda apilado, calendario arriba y tarjeta debajo (el orden del DOM). El umbral lo fija el lado estrecho, así que **la tarjeta nunca baja de 320 px**. `GSplit` no depende de la pista de `GAdaptiveLayout`, por eso el calendario (una tabla) ya no es un problema. **Con otro tema, el umbral cambia** (el mínimo del lado estrecho crece con el cuerpo de texto): con el tema rústico (cuerpo de 17 px) pide 1068 px y a 1440 se apila; es comportamiento contratado (SP-N1, #953), ver [`GSplit/README.md`](../../../../vue/src/components/GSplit/README.md#cuándo-va-al-lado).

## Recetas

### La consulta que viaja

Con `query` (la `BookingQuery` de [`GbSearch`](../GbSearch/README.md#la-consulta-que-viaja)), `partyRows` y `labels.query`, la 03 dice la selección con las mismas palabras que la búsqueda y `select` te devuelve **la consulta con las fechas elegidas puestas** (con su `party`). Sin `query`, el evento lleva `query: null`.

### Una mesa en lugar de una estancia

Con `kind: 'table'` o `'tour'`, el calendario elige **un día** y `full` deja de ser elegible. El banco real lo muestra con `?estado=mesa`.

```vue
<!-- Fragmento: `disponibilidad` y `elegir` son de tu aplicación -->
<GbAvailability01 v-bind="{ ...disponibilidad, kind: 'table', value: '2026-11-13', minNights: undefined }" @select="elegir" />
```

## Uso

Los datos comunes (`consulta`, `partyRows`, `queryLabels`, `precios`, `priceLabels`) están en [«Datos comunes de una reserva»](../../../README.md#datos-comunes-de-una-reserva).

```vue
<!-- Fragmento: `irAReservar` es de tu aplicación -->
<script setup>
import { ref } from 'vue'
import { GbAvailability01 } from '@grana/blocks/booking'
import { precios, priceLabels } from './reserva.js'

const mxn = (amount) => ({ amount, currency: 'MXN' })
const dia = (n) => `2026-11-${String(n).padStart(2, '0')}`

const seleccion = ref({ start: '2026-11-13', end: '2026-11-15' })

const disponibilidad = {
  title: 'Disponibilidad',
  description: 'Precio por noche de la Suite Jardín, con impuestos incluidos.',
  kind: 'stay',
  days: [
    { date: dia(12), status: 'few', price: { value: mxn(1850) }, note: 'Quedan 2' },
    { date: dia(13), status: 'open', price: { value: mxn(2100) } },
    { date: dia(14), status: 'open', price: { value: mxn(2100) } },
    { date: dia(20), status: 'full' }, // la noche está agotada; el día sirve de salida
    { date: dia(2), status: 'closed' }
  ],
  min: '2026-11-01',
  max: '2026-11-30',
  minNights: 1,
  prices: precios,
  locale: 'es',
  labels: {
    status: { few: 'quedan pocas', full: 'lleno', closed: 'cerrado' },
    datePicker: { prev: 'Mes anterior', next: 'Mes siguiente', dialog: 'Elegir fechas', close: 'Cerrar', today: 'hoy', selected: 'elegida', unavailable: 'no disponible', checkoutOnly: 'solo salida', rangeStart: 'llegada', rangeEnd: 'salida', rangeSingle: 'llegada y salida', inRange: 'dentro de la estancia', done: 'Listo' },
    price: priceLabels
  }
}

function elegir({ value, day, query }) {
  // value: { start, end }; day: el AvailabilityDay de la llegada; query: la consulta con las fechas puestas
  irAReservar(value, query)
}
</script>

<template>
  <GbAvailability01 v-bind="disponibilidad" v-model:value="seleccion" @select="elegir" />
</template>
```

Sin la escucha de `select`, la elección queda en el calendario y tu aplicación no se entera (salvo por `v-model:value`). La aplicación carga además `@grana/vue/price` y `@grana/vue/booking`. Los textos de `labels.datePicker` van tal cual a `GDatePicker` ([`GDatePicker/README.md`](../../../../vue/src/components/GDatePicker/README.md)).

## Ejemplos

### e1 · Un calendario con el precio de cada noche (`GbAvailability01`)

**Por qué:** cuando el precio cambia con el día (fin de semana, temporada) y la persona elige entre fechas. El día lleno se lee como lleno y sirve de salida; nada se esconde por un gris.

```vue
<!-- Fragmento: `disponibilidad`, `elegir`, `seleccion` son de tu aplicación -->
<GbAvailability01 v-bind="disponibilidad" v-model:value="seleccion" @select="elegir" />
```

### e2 · Las próximas fechas libres en una lista (`GbAvailability02`)

**Por qué:** cuando la persona pregunta «¿cuándo hay sitio?» y no sabe qué fecha. Una lista corta se lee mejor en el teléfono que un calendario; en `stay` elige **la llegada**. Pasa el slot `empty` para decir qué hacer si no hay fechas.

```vue
<!-- Fragmento: `disponibilidad`, `elegir` son de tu aplicación -->
<GbAvailability02 v-bind="disponibilidad" :upcoming="6" @select="elegir">
  <template #empty>
    <GText>Sin fechas abiertas por ahora. Escríbenos y buscamos una opción.</GText>
  </template>
</GbAvailability02>
```

### e3 · El calendario con su resumen y su acción (`GbAvailability03`)

**Por qué:** cuando elegir fechas es el último paso antes de reservar. Junto al calendario (debajo cuando no cabe al lado), una tarjeta dice la selección con las palabras de la consulta, el total que da tu aplicación y la acción.

```vue
<!-- Fragmento: `totalSeleccion`, `consulta` y `partyRows` son de tu aplicación -->
<GbAvailability03 v-bind="{ ...disponibilidad, total: totalSeleccion, query: consulta, partyRows }" v-model:value="seleccion" @select="elegir" />
```

### e4 · Una celda con más información (slot `day`)

**Por qué:** cuando la celda necesita algo que el precio y la nota no cubren. El slot recibe `{ date, day, selected, disabled, outside }`; no debe llevar controles ni cambia el nombre del día que oye el lector.

```vue
<!-- Fragmento: `disponibilidad`, `elegir` son de tu aplicación -->
<GbAvailability01 v-bind="disponibilidad" @select="elegir">
  <template #day="{ day }">
    <small v-if="day?.status === 'few'">¡Últimas!</small>
  </template>
</GbAvailability01>
```

## Props

Una sola interfaz para las tres variantes (`GbAvailabilityProps`). Los tipos de datos salen de `@grana/blocks/booking`.

| Prop | Tipo | Descripción |
| --- | --- | --- |
| `title` | `string` (requerida) | Título de la sección (`GSection`). |
| `description` | `string` | Descripción; el slot `description` la sustituye. |
| `kind` | `BookingKind` (requerida) | stay: rango (llegada–salida); table y tour: un día |
| `days` | `AvailabilityDay[]` (requerida) | Los días que la aplicación conoce (≤ 120, C7); un día ausente = sin dato |
| `value` | `AvailabilityValue` | v-model:value (ISO; { start, end } en stay) |
| `min` | `string` | Primera fecha elegible (ISO). |
| `max` | `string` | Última fecha elegible (ISO). |
| `minNights` | `number` | Solo stay (V2) |
| `maxNights` | `number` | Solo stay (V2) |
| `upcoming` | `number = 8` | Cuántas fechas abiertas enseñar (1 a 30) Solo `GbAvailability02`; las demás lo ignoran. |
| `total` | `PriceTotal` | El total de la selección, de la aplicación. Solo `GbAvailability03`; las demás lo ignoran. |
| `query` | `BookingQuery \| null` | Para decir la selección (03) y emitirla con las fechas puestas |
| `partyRows` | `PartyRow[]` | Las filas de `GPartyField`, para decir la consulta (03). |
| `context` | `QueryContextExtra` | `times` y `tours` para decir una consulta `table` o `tour`. |
| `prices` | `PriceRegion` | Una región de precios para el calendario o la lista. |
| `locale` | `string` | BCP 47; sin él, el `lang` del ancestro al montar. |
| `labels` | `AvailabilityLabels` (requerida) | `status` (C5), `select` (02, 03), `upcoming` (02), `query` (03 con `query`, K2), `datePicker` (tal cual a `GDatePicker`) y `price`; sin valores por defecto. |

## Eventos

| Evento | Carga | Cuándo |
| --- | --- | --- |
| `update:value` | `ISO \| { start, end }` (`AvailabilityValue`) | Cada elección completa en el calendario (01, 03) |
| `select` | `{ event, kind, value, day, query }` (`AvailabilitySelect`) | 01: al completar la elección; 02: al activar una fecha (en stay, { start, end: null }); 03: el botón labels.select con la elección completa |

`select` lleva `day` = el `AvailabilityDay` del día elegido (o de la llegada) y `query` = la consulta recibida con las fechas elegidas puestas. En 01 se emite al completar la elección (un día, o el rango completo en `stay`).

## Slots

| Slot | Alcance | Qué va |
| --- | --- | --- |
| `day` | `AvailabilityDaySlot` | Escape del contenido de la celda (sin interactivos; no cambia el nombre del día) Solo `GbAvailability01`, `GbAvailability03`. |
| `summary` | `{ value: AvailabilityValue; query: BookingQuery \| null }` | Escape del resumen de 03. Solo `GbAvailability03`. |
| `empty` | — | 02 sin fechas abiertas: lo que pinta la aplicación (p. ej. GEmpty) Solo `GbAvailability02`. |
| `description` | — | Sustituye a la prop description de la GSection |

## Textos (`labels`)

| Clave | Requerido |
| --- | --- |
| `status` | Sí (C5, la primera vez que un día lo necesita): `few`, `full`, `closed` |
| `select` | Sí, en 02 y 03 (C5) |
| `upcoming` | Sí, en 02 (C5): nombre de la lista |
| `query` | Sí, en 03 con `query` (K2) |
| `datePicker` | Los de `GDatePicker` (avisa él) |
| `price` | Los de `GPrice` y `GPriceScope` |

## Teclado y foco

| Tecla | Efecto |
| --- | --- |
| Flechas izquierda y derecha, arriba y abajo | Día anterior o siguiente, y la misma fecha en la semana anterior o siguiente (01 y 03; el teclado de `GDatePicker`, invertido en RTL) |
| `Inicio` / `Fin`, `RePág` / `AvPág` | Primer o último día de la semana; mes anterior o siguiente |
| `Intro` o `Espacio` en un día | Elige el día; en `stay`, la primera elección es la llegada y la segunda la salida |
| `Tab` en 02 | Recorre las fechas de la lista |

El bloque no añade teclas; el teclado completo del calendario está en su README.

## Accesibilidad

Cifras de la auditoría de coco ([`design/lab/blocks/booking/auditoria.md`](../../../../../design/lab/blocks/booking/auditoria.md)), tres motores, tres temas, claro y oscuro (`medido`):

a. El nombre del día incluye su estado y su precio, y el día lleno se puede elegir como salida y no como llegada en `stay` (`prueba`, Vitest; `ariaSnapshot` en el spec de bruno).
b. 02 sin lista cuando no hay fechas abiertas (V4): la aplicación pone su mensaje en el slot `empty`.
c. Un día lleno dice «lleno» sin desbordar; 01 con precios de cuatro cifras no desborda a 320.
c'. Con el texto al 200 % el precio de cada día no se solapa con el de sus vecinos: sale de las celdas y se lee bajo el calendario (AV-C1, `medido`, 6516/6516 en Booking y 654/654 en `lectura-verificar.mjs` de `GDatePicker`).

d. El filete de la leyenda de moneda no queda suelto al principio de una línea a 390 (BK-C4, corregido en `GPriceScope.css`).
e. La selección de 03 es exactamente `describeQuery(...)`; la tarjeta de 03 va al lado del calendario a 1440 (651 · 325) y debajo cuando no cabe, en el orden del DOM (calendario y luego tarjeta, también para Tab), sin solapes ni desbordes (AV-L1, cerrado por #950; `medido`, addendum de la auditoría de Booking, 6516/6516 en los tres motores).
f. El precio dentro de la descripción de la tarjeta-botón de 02 (1440) no solapa y queda bajo el nombre del día.
g. Nada se mueve.

> **Peligro.** Si `kind` no es `stay`, `minNights` y `maxNights` no hacen nada (aviso V2): no los pases. Y con precios de cinco cifras o más en 01 o 03, la celda puede desbordar a 320 px (aviso V3, #801): quita `price` de los días o usa la 02. Un día que no pones en `days` cuenta como **sin dato** y es elegible: si quieres que un día no se pueda elegir, dalo como `closed` o `full`.

## Avisos de desarrollo

Prefijo `[Grana GbAvailability<NN>]`, una vez por instancia y motivo, solo en desarrollo. Los comunes (C2, C3, C5, C7, K1 a K3) están en [`packages/blocks/README.md`](../../../README.md#avisos-comunes-de-booking). Los propios:

| Código | Motivo | Qué pasa |
| --- | --- | --- |
| V1 | Un día con `status` fuera de la lista | Cuenta como sin dato |
| V2 | `minNights` o `maxNights` con un `kind` distinto de `stay` | No hacen nada |
| V3 | Un precio de día de cinco cifras o más en 01 o 03 (#801) | Se pinta y puede desbordar a 320 px |
| V4 | 02 sin ninguna fecha abierta y sin el slot `empty` | No se pinta la lista; con el slot, no avisa |

C3 es una fecha repetida en `days` y C7, más de 120 días.

## Banco de datos de ejemplo

`availability.bank.js` exporta `{ DAYS, props, slots, states }`: Casa Alcalá, noviembre de 2026, con 30 días menos uno sin dato (el 25) y precios de cuatro cifras (viernes y sábado más caros), tres días con pocas habitaciones, el viernes 20 lleno (noche agotada, sirve de salida) y dos cerrados; `kind: 'stay'`, `minNights: 1`, `value` = el rango de la consulta común (13 a 15), `total` 4 290 «por 2 noches», `upcoming: 6`, `prices` MXN, la consulta común y `labels` completos. `states.mesa` lo cambia a una mesa de un solo día. Banco real: `packages/blocks/playground/booking/availability.html`.

## Peso

`dist/booking.js` pesa **37 140 B gzip** con su trozo compartido de `common/` (las 11 secciones y 33 variantes; `medido` con `node packages/blocks/scripts/measure-entry.mjs booking`, 2026-10-28, tras recomponer 03 con `GSplit`, que va en `@grana/vue` y es externo); tope de la entrada **37 888 B** (DECISIONS #907; no se vuelve a subir). Una variante importada sola (esbuild minificado  `vue` y `@grana/vue*` externos; `node packages/blocks/scripts/measure-partial.mjs 5120 booking GbGuestForm=7168`): `GbAvailability01` 3 962 B  `GbAvailability02` 3 999 B  `GbAvailability03` 4 628 B; tope por variante **5 120 B** (#887). `@grana/vue` y sus entradas son *peer*: las paga la aplicación.

## Alcance

- **No calcula disponibilidad ni precios:** `days` y `total` los da tu aplicación (#769, #780).
- **No reserva:** `select` entrega la elección; el siguiente paso es tuyo.
- **Usa `GDatePicker` en línea, no `GCalendar`:** `GCalendar` es una agenda de recursos y eventos; el mes con precio por día es `GDatePicker` (#778, #866).
- **03 en dos columnas con `GSplit` cuando caben** (#950); apilada en estrecho, con el texto ampliado y con temas de cuerpo mayor (SP-N1). Columna pegada (BK-L1) reservada.
- **BK-N2:** 01 y 03 enseñan diciembre entero inactivo cuando `months="auto"` y `max` es el 30 de noviembre; conforme al contrato.
- **Sin CSS ni utilidades** (#763, #807).

## Verificación

| Qué | Resultado | Nivel |
| --- | --- | --- |
| Vitest de `GbAvailability` (derivación de la tabla: `full` en `stay` es noche agotada y en `table` día no elegible; `dayDescription` con estado y precio leído; slot `day` con el precio y sin precio en un día lleno; 02 con las primeras `upcoming` fechas abiertas en orden y `time datetime`; las tres cargas de `select`; 03 con la selección igual a `describeQuery`) | 46/46 (`npm test -w @grana/blocks`, 2026-10-23) | `prueba` |
| Auditoría de coco: Availability 01, 02 y 03; AV-L1 cerrado (#950: 03 con `GSplit`, 651 · 325 a 1440 y apilada en estrecho, sin solapes ni desbordes); 02 vacía y llena | Veredicto `candidate` (addendum del 2026-10-23; recomposición con `GSplit` del 2026-10-28) | `medido` |
| Verificador de Booking sobre las tres variantes, con las dos columnas de 03 (`design/lab/blocks/split-comun.mjs`) y la lectura del día (AV-C1) | **6516/6516** en Chromium, Firefox y WebKit, tres temas, claro y oscuro (addendum del 2026-10-28) | `medido` |

**No verificado:** lector de pantalla real (el nombre de cada día con estado y precio, la fecha de la tarjeta de 02, la lectura del día de `GDatePicker`); `forced-colors` real; teléfono real y puntero grueso; rendimiento con el perfilador (el contrato admite hasta 120 días). **Pendientes abiertos:** la columna pegada de 03 (BK-L1, reservada); los generales, en [`PENDIENTES.md`](../../../../../PENDIENTES.md).

## Fuentes

- Contrato: [`design/contracts/blocks/availability.md`](../../../../../design/contracts/blocks/availability.md) y [`_comun.md`](../../../../../design/contracts/blocks/_comun.md) (§15 a §25); [`datepicker.md`](../../../../../design/contracts/datepicker.md) («Noches y salida», #739).
- Decisiones: #739, #778, #860 a #866, #870, #892, #893, #899, #907, #946 a #956 (`GSplit` y la lectura del día) en `DECISIONS.md`.
- Metadatos: [`GbAvailability.meta.json`](./GbAvailability.meta.json). Pruebas: [`GbAvailability.test.js`](./GbAvailability.test.js). Auditoría: [`design/lab/blocks/booking/auditoria.md`](../../../../../design/lab/blocks/booking/auditoria.md).
