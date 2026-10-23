# GbSearch · GbSearch01, GbSearch02 y GbSearch03

La consulta de disponibilidad de una página de sitio (una estancia, una mesa o un recorrido) como **una frase, una barra o una frase que te acompaña al bajar**, con los mismos datos en las tres. El bloque no añade forma ni valida: elige la apariencia de `GBookingBar`, añade una nota de lo que pasa después y **reemite la intención tal cual**; tu aplicación decide adónde va (su motor de reservas, WhatsApp, una página de resultados). Compone `GBookingBar` (de `@grana/vue/booking`), `GStack` y `GText`; no trae color, CSS ni textos propios (el tema lo pone y los textos van en `labels`).

**Etiquetas:** `<gb-search-01>`, `<gb-search-02>`, `<gb-search-03>` · **Estado:** `candidate` (ver «Verificación») · **Desde:** `0.0.0` (paquete privado, aún sin publicar) · **Entrada:** `@grana/blocks/booking`

```js
import { GbSearch01, GbSearch02, GbSearch03 } from '@grana/blocks/booking'
```

> `@grana/blocks` es privado (`0.0.0`) y no se publica con la beta `0.1.0` de `@grana/vue`. Por ahora se usa desde el repositorio (banco real en `packages/blocks/playground/booking/search.html`). Exige `@grana/vue` (peer, `>=0.1.0-beta.0 <1.0.0`) y Vue `^3.5.0`. Además de `@grana/vue`, la aplicación carga las entradas que esta sección compone: `@grana/vue/booking`. Reglas comunes e instalación: [`packages/blocks/README.md`](../../../README.md).

## Qué lo hace distinto

**La consulta es el hilo de toda la reserva** (DECISIONS #864, #867). La búsqueda no solo emite «buscar»: entrega una `BookingQuery` con su `kind` que el resto de las secciones de Booking recibe **sin transformarla** y dice **con las mismas palabras** que el resumen de la barra (`describeQuery`, #862). «13–15 nov · 2 noches · 2 adultos · 1 niño» aparece igual en la oferta, en el resumen, en el formulario y en la confirmación: quien reserva en el teléfono reconoce lo que pidió en cada paso, y quien usa lector oye la misma frase en vez de cuatro formatos (receta «La consulta que viaja», abajo).

La nota dice **lo que pasa después** («Sin pago ahora · Te respondemos por WhatsApp») justo donde se duda, y en `GbSearch03` la consulta **acompaña** la lectura de la página sin tapar nunca lo enfocado (el muelle de `GBookingBar`, 2.4.11).

## Las tres variantes

Las tres reciben la misma `interface Props` (`GbSearchProps`, el mismo objeto `props` de `props.js`). Lo que una variante no usa, lo ignora en silencio.

| Variante | Concepto | Compone | Ignora |
| --- | --- | --- | --- |
| `GbSearch01` | La frase: la consulta se escribe como se dice y refluye como texto a cualquier ancho | `GStack gap="sm"` > `GBookingBar appearance="phrase"` + `GText size="body-sm" tone="muted"` con la nota | — |
| `GbSearch02` | La barra: cajas en una fila; si no cabe, resumen y acción con la hoja | `GStack gap="sm"` > `GBookingBar appearance="bar"` + la nota | `quickDays` (solo la frase lo usa; no se pasa) |
| `GbSearch03` | La que acompaña: la frase y, al dejarla atrás, un muelle abajo con el resumen, «Cambiar» y la acción | `GStack gap="sm"` > `GBookingBar appearance="phrase" dock` + la nota | — |

**Sin `GSection` alrededor:** `GBookingBar` ya es una región (`role="search"`) con encabezado y nombre; una sección alrededor repetiría el título. El encabezado toma su nivel del contexto (`GSection` de la página, o `h2`). **Ningún bloque de Booking pinta `h1`.**

**Todo va tal cual a `GBookingBar`** (mismos nombres que sus props): el bloque no renombra, no completa `labels.bar` y no avisa por lo que ya avisa `GBookingBar`. Solo quita el `kind` de `query` al pasarla (el modelo de la barra no lo lleva) y lo **añade** al emitir `update:query`, así lo que guarda tu aplicación es la `BookingQuery` que entienden las demás secciones.

## Recetas

### El umbral: la consulta en la portada

`GbHero03` (de `@grana/blocks/marketing`) es `GHero` en umbral y trae un slot `consult`. Ahí va `GbSearch01` (o `02`). El héroe ya decide la jerarquía de sus acciones cuando hay consulta (las dos pasan a `outline`, la consulta es la principal). Dentro del slot, `GBookingBar` toma su nivel del contexto y queda en `h2`: el único `h1` de la página es el del héroe. Por eso el umbral **no es una cuarta variante** de Search (DECISIONS #866): una variante con héroe duplicaría la apertura y obligaría a meter los datos del héroe en `GbSearchProps`.

```vue
<script setup>
import { ref } from 'vue'
import { GbHero03 } from '@grana/blocks/marketing'
import { GbSearch01 } from '@grana/blocks/booking'
import { consulta, partyRows, barLabels } from './reserva.js'

const consultaActual = ref(consulta)
const portada = {
  title: 'Casa Alcalá',
  eyebrow: 'Hotel boutique · Centro histórico de Oaxaca',
  lead: 'Doce habitaciones alrededor de un patio de cantera verde.',
  media: { src: '/fotos/patio.jpg', alt: 'Patio con arcos de cantera al atardecer', width: 1600, height: 2000 },
  actions: [{ id: 'habitaciones', label: 'Ver habitaciones', href: '#habitaciones' }],
  labels: { external: 'se abre en otra pestaña' }
}

function buscar(payload) {
  payload.preventDefault() // tu aplicación lleva la consulta a su motor
}
</script>

<template>
  <GbHero03 v-bind="portada">
    <template #consult>
      <GbSearch01
        kind="stay"
        title="Consulta disponibilidad"
        v-model:query="consultaActual"
        :party-rows="partyRows"
        :labels="{ bar: barLabels }"
        @submit="buscar"
      />
    </template>
  </GbHero03>
</template>
```

Para ver la receta montada con los bloques reales: `packages/blocks/playground/booking/umbral.html`. Hay una comprobación de bruno en el spec del banco (`blocks-booking.spec.mjs`): un solo `h1` y la consulta antes de las acciones del héroe.

### La consulta que viaja

La búsqueda emite una `BookingQuery`; tu aplicación la guarda (con `v-model:query`) y **la misma instancia** se la pasas a las demás secciones. Ninguna vuelve a formatear fechas, noches ni personas: todas llaman a `describeQuery` de `@grana/vue/booking` con las mismas `partyRows` y los mismos `labels.query`.

```vue
<!-- Fragmento: `ofertas`, `formulario` y `confirmacion` son de tu aplicación (props de cada sección) -->
<script setup>
import { ref } from 'vue'
import { GbSearch01, GbOfferList01, GbGuestForm03, GbConfirmation01 } from '@grana/blocks/booking'
import { partyRows, barLabels, queryLabels } from './reserva.js'
import { ofertas, formulario, confirmacion } from './datos.js'

const consulta = ref(null) // la BookingQuery de la búsqueda, con su kind
</script>

<template>
  <GbSearch01 kind="stay" title="Consulta disponibilidad" v-model:query="consulta" :party-rows="partyRows" :labels="{ bar: barLabels }" />

  <!-- la misma consulta, dicha con las mismas palabras -->
  <GbOfferList01 v-bind="ofertas" :query="consulta" :party-rows="partyRows" />
  <GbGuestForm03 v-bind="formulario" :query="consulta" :party-rows="partyRows" />
  <GbConfirmation01 v-bind="confirmacion" :query="consulta" :party-rows="partyRows" />
</template>
```

Cada sección necesita `partyRows` y `labels.query` para decir la consulta; si falta alguno, avisa K2 y no pinta esa línea. Las secciones que reciben la consulta son [`GbOfferList`](../GbOfferList/README.md), [`GbOfferDetail`](../GbOfferDetail/README.md), [`GbGuestForm`](../GbGuestForm/README.md), [`GbConfirmation`](../GbConfirmation/README.md), [`GbBookingSummary`](../GbBookingSummary/README.md) y [`GbAvailability`](../GbAvailability/README.md) (la 03).

> `describeQuery` dice «hoy» y «mañana» en una mesa (`kind: 'table'`), igual que el resumen de la barra (DECISIONS #884): son las mismas palabras en todas partes. Quien monta una sección con una mesa asume, como ya lo asumía la barra, que una página cacheada puede decir «mañana» un día después.

## Uso

Los datos comunes (`consulta`, `partyRows`, `barLabels`...) están en [«Datos comunes de una reserva»](../../../README.md#datos-comunes-de-una-reserva) del README del paquete.

```vue
<!-- Fragmento: `irAResultados` es de tu aplicación -->
<script setup>
import { ref } from 'vue'
import { GbSearch01 } from '@grana/blocks/booking'
import { consulta, partyRows, barLabels } from './reserva.js'

const query = ref(consulta)

function onSubmit(payload) {
  // payload: { kind, from, to, party, nights, event, preventDefault(), defaultPrevented }
  payload.preventDefault() // tu aplicación decide: su motor, WhatsApp, una página de resultados
  irAResultados(payload)
}
</script>

<template>
  <GbSearch01
    kind="stay"
    title="Consulta disponibilidad"
    v-model:query="query"
    :party-rows="partyRows"
    :min-nights="1"
    :max-nights="14"
    :disabled-nights="(iso) => iso === '2026-11-20'"
    note="Sin pago ahora · Te respondemos por WhatsApp en menos de 2 h"
    :names="{ from: 'checkin', to: 'checkout', party: 'guests' }"
    locale="es"
    :labels="{ bar: barLabels }"
    @submit="onSubmit"
  />
</template>
```

`labels.bar` son los textos de `GBookingBar` tal cual (frase, campos, vacíos, noches, salida, resumen, acción, errores y `datePicker`); están descritos en [`GBookingBar/README.md`](../../../../vue/src/components/GBookingBar/README.md). Con `action` y `method` en el bloque, la barra envía el formulario nativo a tu motor (ver «Props»).

## Ejemplos

### e1 · La consulta de un hotel como frase (`GbSearch01`)

**Por qué:** cuando la consulta es el centro de la página o va en la portada. La persona escribe la consulta como se dice, en cualquier ancho. No uses la barra si el sitio tiene poco ancho y muchas casillas.

```vue
<!-- Fragmento: `onSubmit`, `query`, `search` son de tu aplicación -->
<GbSearch01 v-bind="search" v-model:query="query" @submit="onSubmit" />
```

### e2 · La barra para una cabecera ancha (`GbSearch02`)

**Por qué:** cuando la consulta vive en una banda y el ancho alcanza para las cajas en fila; si no cabe, pasa a resumen y acción con la hoja (compacto a 390 px). Los días rápidos son de la frase, así que la barra no los pinta.

```vue
<!-- Fragmento: `onSubmit`, `query`, `search` son de tu aplicación -->
<GbSearch02 v-bind="search" v-model:query="query" @submit="onSubmit" />
```

### e3 · La consulta que acompaña una página larga (`GbSearch03`)

**Por qué:** cuando la página es larga (habitaciones, política, ubicación) y la persona debería poder cambiar fechas sin volver arriba. El muelle aparece al dejar atrás la consulta, con el resumen, «Cambiar» y la acción; no tapa lo enfocado. Pon uno solo por documento.

```vue
<!-- Fragmento: `onSubmit`, `query`, `search` son de tu aplicación -->
<GbSearch03 v-bind="search" v-model:query="query" @submit="onSubmit" />
```

### e4 · Una mesa para esta noche (`kind: 'table'`)

**Por qué:** la misma sección sirve a un restaurante: cambia el `kind`, los turnos (`times`) y la plantilla de la frase. `labels.bar.phrase` lleva los marcadores `{party}`, `{date}` y `{time}`.

```vue
<!-- Fragmento: `mesa` y `barLabelsMesa` son de tu aplicación (el segundo es `barLabels` con la frase de la mesa) -->
<GbSearch01
  kind="table"
  title="Reserva una mesa"
  v-model:query="mesa"
  :party-rows="partyRows"
  :times="[{ value: '14:00', label: '2:00 p. m.' }, { value: '20:00', label: '8:00 p. m.' }, { value: '21:30', label: '9:30 p. m.', disabled: 'Lleno' }]"
  :labels="{ bar: barLabelsMesa }"
  @submit="onSubmit"
/>
```

## Props

Una sola interfaz para las tres variantes (`GbSearchProps`). Los tipos de datos salen de `@grana/blocks/booking`.

| Prop | Tipo | Descripción |
| --- | --- | --- |
| `kind` | `BookingKind` (requerida) | stay, table o tour; tal cual a GBookingBar |
| `title` | `string` (requerida) | Título de la consulta: el encabezado y el nombre de GBookingBar (nivel por GSection o 2) |
| `partyRows` | `PartyRow[]` (requerida) | Filas de GPartyField |
| `query` | `BookingQuery \| null` | v-model:query. Su kind debe ser el de la sección (K1: si no, se pasa null). Sin query, GBookingBar guarda el estado |
| `note` | `string` | Lo que pasa después («Sin pago ahora · Te respondemos por WhatsApp»), en GText body-sm muted después del formulario |
| `min` | `string` | Primera fecha elegible (ISO). |
| `max` | `string` | Última fecha elegible (ISO). |
| `disabledDates` | `DateRule` | (iso, query) => boolean |
| `disabledNights` | `DateRule` | Solo stay: la noche que empieza iso está agotada |
| `minNights` | `number` | Solo stay (GBookingBar: 1 por defecto) |
| `maxNights` | `number` | Solo stay |
| `times` | `BookingTimes` | table: turnos o función del día |
| `tours` | `BookingTour[]` | tour: recorridos |
| `quickDays` | `number` | Días rápidos del hueco de fecha de la frase. Solo `GbSearch01`, `GbSearch03`; las demás lo ignoran. |
| `names` | `BookingNames` | Nombres de los ocultos del envío nativo |
| `pending` | `boolean = false` | La aplicación consulta (GBookingBar pending) |
| `disabled` | `boolean = false` | Deshabilita la consulta (`GBookingBar disabled`). |
| `locale` | `string` | BCP 47; tal cual a `GBookingBar`. |
| `labels` | `SearchLabels` (requerida) | bar: los labels de GBookingBar tal cual (paso directo, #761); los avisa GBookingBar (aviso 7) |

**Atributos.** `action`, `method`, `target`, `enctype`, `accept-charset` y `autocomplete` llegan al `<form>` de `GBookingBar` (el envío nativo al motor, en las tres); `class`, `style`, `id`, `aria-*` y `data-*`, a la raíz del bloque. `names` da el nombre de los campos ocultos de ese envío.

## Eventos

| Evento | Carga | Cuándo |
| --- | --- | --- |
| `submit` | `la carga de GBookingBar tal cual` (`SearchSubmit`) | Envío válido. Síncrono: preventDefault() en la escucha deja sin hacer el envío nativo (con action) |
| `update:query` | `BookingQuery` | Cada cambio de la consulta, con su kind |

`submit` es **síncrono**: `preventDefault()` en tu escucha deja sin hacer el envío nativo (el que pide `action`), igual que en `GBookingBar`. `update:query` lleva siempre el `kind`. Sin `navigate` ni `activate`: el bloque no tiene enlaces propios.

## Slots

| Slot | Alcance | Qué va |
| --- | --- | --- |
| `note` | — | Escape: contenido rico de la nota, dentro de la misma GText |

## Textos (`labels`)

| Clave | Uso | Requerido |
| --- | --- | --- |
| `bar` | `labels` de `GBookingBar`, tal cual (frase, campos, vacíos, noches, salida, resumen, acción, errores, `datePicker`...) | Sí (lo avisa `GBookingBar`, aviso 7; el bloque no completa nada) |

La nota (`note`) es un texto de dato, no de `labels`.

## Teclado y foco

El teclado es el de `GBookingBar` ([`GBookingBar/README.md`](../../../../vue/src/components/GBookingBar/README.md#teclado-y-foco)): el bloque no añade teclas ni mueve el foco. En `GbSearch03`, el muelle no tapa el elemento enfocado ni el último botón de la página (2.4.11).

## Accesibilidad

Cifras de la auditoría de coco ([`design/lab/blocks/booking/auditoria.md`](../../../../../design/lab/blocks/booking/auditoria.md)), tres motores, tres temas, claro y oscuro (`medido`):

a. La consulta es una región con encabezado y nombre (`role="search"` de `GBookingBar`); el bloque no pinta `h1` y el encabezado toma su nivel del contexto.
b. La nota va **después** del formulario, en texto (`GText body-sm muted`), con contraste ≥ 4,5:1.
c. `GbSearch03`: el muelle aparece al dejar atrás la consulta, ocupa como mucho un cuarto del alto, su resumen tiene contraste ≥ 4,5:1 y no tapa el último botón ni su foco; con movimiento reducido entra sin desplazamiento.
d. El punto final de la frase queda en la línea de su hueco a 390 y 320 px en 01 y 03 (BK-C5, corregido en `GBookingBar.css`; antes bajaba solo a una línea).
e. Sin desplazamiento horizontal a 1440, 390, 320 ni a 320 con el texto al 200 %.

> **Peligro.** El `kind` de `query` debe ser el de la sección (`kind` de la prop). Con otro, el bloque avisa K1 y pasa `null` a la barra: la persona ve la consulta vacía aunque tu aplicación guardara una. Y `submit` con envío nativo (`action`) navega solo si no llamas a `preventDefault()`: si tu escucha ya lleva la consulta a otra parte y no lo llamas, la página navega además por el envío nativo.

## Avisos de desarrollo

Prefijo `[Grana GbSearch<NN>]`, una vez por instancia y motivo, solo en desarrollo. Los comunes (C1 a C8, K1 a K5) están en [`packages/blocks/README.md`](../../../README.md#avisos-comunes-de-booking). Los propios:

| Código | Motivo | Qué pasa |
| --- | --- | --- |
| K1 | `query` con otro `kind` o forma inválida | Se pasa `null` a `GBookingBar` |
| S1 | Más de un `GbSearch03` en el documento (se cuenta `[data-gb="search-03"]` al montar) | Se pinta igual: dos muelles de consulta |

Los avisos del título, de `partyRows`, de `times`/`tours`, de la plantilla de la frase y de las claves de `labels.bar` los emite `GBookingBar` con su prefijo.

## Banco de datos de ejemplo

`search.bank.js` exporta `{ props, slots, tests }`: `kind: 'stay'`, título «Consulta disponibilidad», la consulta común de `bank/booking.js`, `partyRows` (adultos 1 a 6, niños 0 a 4 con su ayuda, habitaciones con `max` dependiente), `disabledNights` con el viernes 20 de noviembre agotado, `minNights: 1`, `maxNights: 14`, una `note`, `names`, `locale: 'es'` y `labels.bar` completos con la plantilla de la frase en español. `tests` trae dos juegos solo de Vitest (`table` con un turno lleno y `tour`). Con el banco por defecto ninguna variante avisa. El banco real está en `packages/blocks/playground/booking/search.html` (parámetros: `?tema=defecto|rustico|lujo`, `?dark=1`, `?v=01|02|03`, `?zoom=2`, `?anidado=1`, `?alto=1` para la página larga del muelle).

## Peso

`dist/booking.js` pesa **36 851 B gzip** con su trozo compartido de `common/` (las 11 secciones y 33 variantes; `medido` con `node packages/blocks/scripts/measure-entry.mjs booking`  2026-10-23); tope de la entrada **37 888 B** (DECISIONS #907; el tope inicial de 36 KiB no se vuelve a subir). Una variante importada sola (esbuild minificado  `vue` y `@grana/vue*` externos; `node packages/blocks/scripts/measure-partial.mjs 5120 booking GbGuestForm=7168`): `GbSearch01` 1 837 B  `GbSearch02` 1 841 B  `GbSearch03` 1 840 B; tope por variante **5 120 B** (#887). `@grana/vue` y sus entradas son *peer*: las paga la aplicación.

## Alcance

- **No valida ni reserva:** emite la intención (`submit`) y la consulta (`update:query`); navegar, abrir WhatsApp o pintar resultados es de tu aplicación (#780).
- **No calcula disponibilidad:** `disabledDates`, `disabledNights`, `times` y `tours` los da tu aplicación.
- **Un `GbSearch03` por documento** (aviso S1).
- **El umbral es una receta, no una variante** (#866).
- **Reservado:** el conserje de la consulta (`appearance="guided"` de `GBookingBar`) y las edades de los niños (`childAges` de `GPartyField`) no existen hoy (#865); el precio por día vive en `GbAvailability`.
- **Sin CSS ni utilidades** (#763, #807).

## Verificación

| Qué | Resultado | Nivel |
| --- | --- | --- |
| Vitest de `GbSearch` (las tres pasan a `GBookingBar` lo de su columna; `update:query` con `kind` y `modelValue` sin él; `submit` con la misma carga y `preventDefault`; la nota es una `GText` `body-sm` `muted` después del `form`; sin `GSection` alrededor; K1 y S1; `action` llega al `form`) | 39/39 (`npm test -w @grana/blocks`, 2026-10-23) | `prueba` |
| Specs de bruno del banco de Booking (`design/lab/theme-playground/tests/blocks-booking.spec.mjs`, Chromium; incluye la receta del umbral) | 271/271 junto con `text`, `price` y `booking` según coco (228 son de bruno); no se repitieron al documentar | `medido` (según la auditoría) |
| Auditoría de coco: Search 01, 02 y 03 sin defecto bloqueante; BK-C5 corregido y medido (el punto final en la línea del hueco) | Veredicto `candidate`; pasada de la familia 6000/6045 con los 45 fallos en un error del propio verificador, corregido (`--solo=shapes` 396/396) | `medido` |

**No verificado:** lector de pantalla real (la frase de la consulta, los huecos, el muelle); `forced-colors` real y en Firefox y WebKit; teléfono real y puntero grueso (la diana de 44 px de `GBtn` no se midió); rendimiento con el perfilador. **Pendientes abiertos:** ninguno de la auditoría afecta a Search; los generales de Booking, en [`PENDIENTES.md`](../../../../../PENDIENTES.md).

## Fuentes

- Contrato: [`design/contracts/blocks/search.md`](../../../../../design/contracts/blocks/search.md) y [`_comun.md`](../../../../../design/contracts/blocks/_comun.md) (§15 a §25); [`booking-bar.md`](../../../../../design/contracts/booking-bar.md) («`describeQuery`», #862).
- Decisiones: #860 a #862, #864, #866, #867, #884, #907 en `DECISIONS.md`.
- Metadatos: [`GbSearch.meta.json`](./GbSearch.meta.json). Pruebas: [`GbSearch.test.js`](./GbSearch.test.js). Auditoría: [`design/lab/blocks/booking/auditoria.md`](../../../../../design/lab/blocks/booking/auditoria.md).
