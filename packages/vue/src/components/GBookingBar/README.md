# GBookingBar y GPartyField

`GBookingBar` es la **consulta de disponibilidad** de un sitio (una estancia, una mesa o un recorrido): reúne fechas, turno o recorrido y personas, **valida al enviar, dice en palabras lo que falta** y entrega una **intención**. **No hace la reserva:** emite un evento `submit` con un objeto limpio y tu aplicación decide adónde va (su motor, WhatsApp, una página). `GPartyField` es la pieza de **personas por tipo** (adultos, niños, habitaciones) que la consulta usa por dentro y que también sirve suelta en cualquier formulario. Ninguna trae color propio (el tema lo pone) y ninguna hace `fetch`.

**Etiquetas:** `<g-booking-bar>` y `<g-party-field>` · **Estado:** `candidate` (ver [`design/lab/booking-bar/auditoria.md`](../../../../../design/lab/booking-bar/auditoria.md) y «Verificación») · **Desde:** 0.1.0 · **Entrada:** propia, `@grana/vue/booking` (global UMD `GranaBooking`)

```js
import Booking, { GBookingBar, GPartyField, describeQuery } from '@grana/vue/booking'
```

> `@grana/vue` está en la versión `0.1.0-beta.0` y aún no se publica en npm. Por ahora se usa desde el repositorio (banco del componente real en `packages/vue/playground/booking.html`). Exige Vue `^3.5.0` y un navegador actual.

## Instalación: entrada propia

Ni `GBookingBar`, ni `GPartyField`, ni `describeQuery` viajan en `@grana/vue` (DECISIONS #742, #862).

```js
import { createApp } from 'vue'
import Grana from '@grana/vue'
import Booking from '@grana/vue/booking'
import '@grana/vue/style.css'          // el CSS de la consulta ya está en esta hoja única

createApp(App).use(Grana).use(Booking).mount('#app')   // registra <g-booking-bar> y <g-party-field>
```

Sin empaquetador, carga `vue.global.js`, `dist/grana.umd.js` y `dist/booking.umd.js` (global `GranaBooking`): `app.use(Grana).use(GranaBooking)`. En plantillas dentro del HTML (sin compilar), escribe las etiquetas con cierre: `<g-booking-bar ...></g-booking-bar>`.

**Peso.** Tope de la entrada: **15 KiB gzip (15 360 B)** (DECISIONS #878: los 14 KiB de #742 más el cargo único de `describeQuery`, extraída del componente; no vuelve a subir sin decisión del usuario). Medido al documentar sobre el `dist/` del árbol (2026-10-23): **14 776 B** con `gzip -9` y 14 847 B con `gzip -c` (nivel por defecto), 513 B de margen sobre el tope; `GBookingBar.meta.json` anota 14 697 B (`gzip -9`) y todavía cita el tope anterior de 14 336 B (conflicto señalado a bruno). `GDatePicker`, `GNumberField`, `GSelect`, `GRadioGroup`, `GDialog`, `GBtn` y `useFormField` llegan del principal por `__shared`, sin copia. **No importa `GTimeField`** (es otra entrada). `dist/grana.js` no contiene `GBookingBar`.

## Qué lo hace distinto

Formas elegidas por el usuario el 2026-10-21 (DECISIONS #736 y #741): **A «La frase»** por defecto, la **barra** como apariencia y **B «El muelle»** opcional; C reservada.

| | Qué hace | Por qué sirve |
| --- | --- | --- |
| **La frase (A)** | La consulta se escribe como se dice: «Llego el **[lun 9 de nov]**, me quedo **[2 noches]** y somos **[2 adultos · 1 habitación]**». Cada hueco abre su editor y la frase refluye como texto a cualquier ancho | El orden de la frase lo da tu idioma (es una plantilla tuya con marcadores) y no necesita forma compacta |
| **Noche agotada ≠ día de salida** | Dormir una noche agotada es un error con la fecha; **salir** un día agotado es válido | En hotelería lo que se agota es la noche |
| **Dice lo que falta** | El resumen nombra los huecos («Sin fechas · 2 adultos · 1 habitación») y enviar incompleto anuncia qué falta y lleva el foco al primero | No parece completa si no lo está |
| **La barra no se parte** | O cabe en una fila o pasa a un **resumen + acción** que abre una hoja con los campos | Sin cajas apiladas a medias |
| **El muelle (B)** | Con `dock`, cuando la consulta sale del visor por arriba aparece una banda abajo con el resumen, «Cambiar» y la acción; nunca tapa lo enfocado | La consulta te acompaña en una página larga |

## Cuándo usarlo

| Necesito | Uso | No uses |
| --- | --- | --- |
| Consulta rápida de un sitio (fechas, hora, personas) | **`GBookingBar`** | Un [`GForm`](../GForm/README.md) con cuatro campos sueltos |
| El formulario completo de reserva (datos, pago) | `GForm` (con `GPartyField` dentro) | `GBookingBar` (no es un formulario de datos) |
| Personas por tipo en cualquier formulario | **`GPartyField`** | Tres `GNumberField` sin resumen |
| La consulta en la apertura de la página | [`GHero`](../GHero/README.md) `appearance="threshold"` con la barra en `consult` | Una barra flotando sobre la foto |
| Precios en el calendario | El slot `day` de `GDatePicker` con tu `Intl.NumberFormat` | Un precio de Grana (no existe) |

## Uso

La consulta se une a tu aplicación con `v-model` y `submit`. Todos los textos van en `labels` y en `partyRows`: no hay valores por defecto.

```vue
<!-- Fragmento: `consulta`, `filas`, `labels` y `abrirMotor` son de tu aplicación -->
<template>
  <g-booking-bar
    kind="stay"
    title="Consulta disponibilidad"
    v-model="consulta"
    :party-rows="filas"
    :labels="labels"
    @submit="(q) => abrirMotor(q)"
  />
</template>
```

La forma de `consulta` depende del `kind`: `stay` `{ from, to, party }`, `table` `{ date, time, party }`, `tour` `{ tour, date, party }`. Fechas ISO sin zona. **Las noches no se guardan**: se derivan (`to − from`). Un valor con forma inválida se trata como vacío y avisa una vez.

## Ejemplos

### e1 · La estancia como una frase (A)

**Por qué:** es la forma por defecto y la que mejor se lee en un hotel, porque el huésped dice cuántas noches se queda y la salida se le devuelve en palabras («Salida el miércoles, 11 de noviembre»). Usa la barra (e3) si prefieres campos con etiqueta visible.

```vue
<!-- Fragmento: `abrirMotor` es de tu aplicación -->
<script setup>
import { ref } from 'vue'
const consulta = ref(null)
const filas = [
  { key: 'adults', label: 'Adultos', min: 1, default: 2, unit: (n) => `${n} ${n === 1 ? 'adulto' : 'adultos'}`, decrementLabel: 'Quitar un adulto', incrementLabel: 'Añadir un adulto' },
  { key: 'rooms', label: 'Habitaciones', min: 1, default: 1, unit: (n) => `${n} ${n === 1 ? 'habitación' : 'habitaciones'}`, decrementLabel: 'Quitar una habitación', incrementLabel: 'Añadir una habitación' }
]
const nocheAgotada = (iso) => ['2026-11-06', '2026-11-07'].includes(iso)
const labels = {
  phrase: 'Llego el {from}, me quedo {nights} y somos {party}.',
  fields: { from: 'Llegada', to: 'Salida', nights: 'Noches', party: 'Huéspedes' },
  empty: { from: '¿qué día?', nights: '¿cuántas noches?' },
  nights: (n) => `${n} ${n === 1 ? 'noche' : 'noches'}`,
  checkout: 'Salida el {date}',
  noDates: 'Sin fechas', separator: ' · ',
  submit: 'Ver disponibilidad', pending: 'Consultando…', done: 'Listo',
  decrement: 'Quitar una noche', increment: 'Añadir una noche',
  errors: { dates: 'Elige las fechas.', night: 'No quedan habitaciones la noche del {date}.', nights: 'Elige un número de noches válido.' },
  missing: 'Falta {list}.',
  datePicker: { prev: 'Mes anterior', next: 'Mes siguiente', dialog: 'Elige un día', close: 'Cerrar', checkoutOnly: ', solo salida' }
}
</script>

<template>
  <g-booking-bar
    kind="stay" title="Consulta disponibilidad" v-model="consulta"
    :party-rows="filas" :disabled-nights="nocheAgotada" :min-nights="1"
    :names="{ from: 'checkin', to: 'checkout', party: 'guests' }"
    :labels="labels" @submit="(q) => abrirMotor(q)"
  />
</template>
```

Los textos de `labels` que se muestran aquí no son exhaustivos: la tabla «Textos» lista todas las claves. Si falta una al necesitarla, avisa una vez. `labels.datePicker` se pasa tal cual a **cada** `GDatePicker` interno (frase, campos y hoja); consulta [`GDatePicker`](../GDatePicker/README.md) para sus claves.

### e2 · Una mesa para esta noche (table)

**Por qué:** los restaurantes trabajan por turnos y **lo lleno debe verse**, no descubrirse: los turnos llenos se deshabilitan con un sufijo de texto, no solo con color. `quickDays` ofrece los próximos días como opciones rápidas y «Otro día».

```vue
<!-- Fragmento: `consulta`, `filas`, `labels` y `reservarMesa` son de tu aplicación -->
<script setup>
const turnos = [
  { value: '19:30', label: '19:30' },
  { value: '20:30', label: '20:30', disabled: true },
  { value: '21:30', label: '21:30' }
]
</script>

<template>
  <g-booking-bar
    kind="table" title="Reserva una mesa" v-model="consulta"
    :party-rows="filas" :times="turnos" :quick-days="7"
    :labels="{ ...labels, phrase: 'Mesa para {party} el {date} a las {time}.', otherDay: 'Otro día', full: 'lleno' }"
    @submit="(q) => reservarMesa(q)"
  />
</template>
```

`times` también admite una función `(fecha) => Array` (los turnos de ese día). Sin `times` con `kind="table"` avisa (un turno libre escrito a mano está reservado).

### e3 · La barra, para una cabecera ancha

**Por qué:** cuando prefieres campos con etiqueta visible en una fila. Si la fila no cabe en su caja, **no se parte**: pasa a un resumen («Tu consulta · 13–15 nov · 2 noches · 2 adultos») + la acción, y los campos se abren en una hoja. Vuelve a la fila al ensanchar (con histéresis). Si falta `labels.phrase` o un marcador de la frase, la consulta también se pinta como barra y avisa.

```vue
<!-- Fragmento: `consulta`, `filas`, `labels` y `abrirMotor` son de tu aplicación -->
<template>
  <g-booking-bar appearance="bar" kind="stay" title="Consulta disponibilidad" v-model="consulta"
                 :party-rows="filas" :labels="labels" @submit="(q) => abrirMotor(q)" />
</template>
```

### e4 · El muelle en una página larga

**Por qué:** cuando la consulta queda atrás al leer las habitaciones y el visitante debe poder pedir sin volver arriba. Aparece solo cuando la consulta entera sale del visor por arriba, **sin robar el foco ni anunciarse**. No aparece si, sumado a las reservas de abajo (por ejemplo, el navbar de `GSidebar`), ocuparía más de un cuarto del visor.

```vue
<!-- Fragmento: `consulta`, `filas`, `labels` y `abrirMotor` son de tu aplicación -->
<template>
  <g-booking-bar dock kind="stay" title="Consulta disponibilidad" v-model="consulta"
                 :party-rows="filas" :labels="labels" @submit="(q) => abrirMotor(q)" />
</template>
```

Mientras el muelle se ve, Grana escribe en `<html>` un `scroll-padding-block-end` del alto del muelle y una **cola** al final del documento (`:root::after`), para que ni un enlace enfocado ni el último control de la página queden debajo. Ver los dos límites en «Alcance».

### e5 · Personas en un formulario de reserva (`GPartyField`)

**Por qué:** una cotización o la reserva completa también necesitan «cuántos somos», con un resumen legible en vez de tres contadores sueltos. Dentro de un modal usa `mode="inline"` (en un diálogo no se abre otro popover).

```vue
<!-- Fragmento: `grupo` y `filas` son de tu aplicación -->
<template>
  <g-party-field v-model="grupo" label="Huéspedes" name="guests" :rows="filas"
                 :labels="{ done: 'Listo', separator: ' · ' }" />
</template>
```

Con `name="guests"` el formulario recibe un campo oculto por fila (`guests[adults]`, `guests[rooms]`, …), incluso con el campo deshabilitado.

## `describeQuery`: la consulta en palabras

`describeQuery` es la utilidad que escribe el resumen de `GBookingBar` («13–15 nov · 2 noches · 2 adultos · 1 niño»), exportada para que **otras piezas digan la consulta con las mismas palabras** sin rehacer el formato. La usan las secciones de [`@grana/blocks/booking`](../../../../blocks/README.md#la-consulta-es-el-hilo) (oferta, resumen, formulario, confirmación); la barra la usa por dentro para su resumen, el compacto y el muelle. Entrada y salida:

```js
import { describeQuery } from '@grana/vue/booking'

const { text, checkout, nights, missing } = describeQuery(
  { kind: 'stay', from: '2026-11-13', to: '2026-11-15', party: { adults: 2, children: 1, rooms: 1 } },
  {
    partyRows: filas, // las filas de GPartyField: su `unit` da las piezas del grupo
    locale: 'es',     // sin él, el de Intl del entorno (no lee el DOM)
    labels: { nights: (n) => `${n} ${n === 1 ? 'noche' : 'noches'}`, separator: ' · ', checkout: 'Salida el {date}', noDates: 'Sin fechas' }
  }
)
// text: '13–15 nov · 2 noches · 2 adultos · 1 niño · 1 habitación'
// checkout: 'Salida el domingo, 15 de noviembre'  nights: 2  missing: []
```

<!-- Fragmento: `filas` es de tu aplicación (las `partyRows` de la barra) -->

| Opción | Tipo | Qué hace |
| --- | --- | --- |
| `partyRows` | `PartyRow[]` | Las filas de `GPartyField`; dan las piezas del grupo («2 adultos») |
| `times` | `{ value, label? }[]` | `table`: la etiqueta del turno |
| `tours` | `{ value, label }[]` | `tour`: el nombre del recorrido |
| `locale` | `string` | BCP 47; sin él, el de `Intl` del entorno |
| `labels` | `{ nights, separator, checkout?, noDates?, noDate?, noTime?, noTour? }` | Las mismas claves de «Textos» con el mismo significado |

- **`text`** es exactamente lo que pinta el resumen de la barra con esos datos; **`checkout`** es «Salida el {date}» (solo en `stay` completo; vacío si no); **`nights`** es el número de noches o `null`; **`missing`** nombra lo que falta en orden (`dates`, `date`, `time`, `tour`).
- **Pura:** sin DOM, sin `window` y sin estado salvo la caché de `Intl`; funciona en el servidor. **Nunca lanza:** una consulta con forma inválida devuelve el `text` con lo que falta. Una clave de `labels` que falta omite su pieza, sin aviso (los avisos siguen siendo de `GBookingBar`, aviso 7).
- **Lo relativo se hereda:** con `kind: 'table'` el texto dice «hoy» y «mañana» como el resumen de la barra (`Intl.RelativeTimeFormat`); no hay opción para apagarlo (DECISIONS #884). Una página cacheada puede decir «mañana» un día después.
- **Evidencia:** `bookingQuery.test.js` comprueba, para los tres `kind`, con y sin huecos, que `describeQuery(...).text` es igual al resumen de `GBookingBar` montado con la misma consulta (y en inglés), más el resultado, los `labels` que faltan y que nunca lanza; `bookingQuery.ssr.test.js` lo ejecuta sin `window` ni `document`; 18 de 18 en verde (`prueba`, 2026-10-23).

## Props de `GBookingBar`

| Prop | Tipo | Valores | Por defecto |
| --- | --- | --- | --- |
| `kind` | String | `stay` `table` `tour` | `stay` |
| `modelValue` (`v-model`) | Object \| null | la consulta (ver arriba) | `null` (estado interno) |
| `appearance` | String | `phrase` `bar` | `phrase` |
| `dock` | Boolean | el muelle | `false` |
| `title` | String | **obligatoria**; nombre del `search` | — |
| `headingLevel` | Number | `2` `3` `4` | el de `GSection` o `2` |
| `partyRows` | Array | **obligatoria**; filas de `GPartyField` | — |
| `min`, `max` | String | fecha ISO | sin valor |
| `disabledDates` | Function | `(iso, consulta) => boolean`: día no disponible | sin valor |
| `disabledNights` | Function | solo `stay`: `(iso, consulta) => boolean`, la noche que empieza `iso` está agotada | sin valor |
| `minNights` | Number | solo `stay`: noches mínimas | `1` |
| `maxNights` | Number | solo `stay`: noches máximas | sin valor |
| `times` | Array \| Function | `table`: `[{ value: 'HH:mm', label?, disabled? }]` o `(fecha) => Array` | sin valor |
| `tours` | Array | `tour`: `[{ value, label, description?, disabled? }]` | sin valor |
| `quickDays` | Number | en la frase, días rápidos desde hoy (o `min`) | `0` |
| `names` | Object | `{ from?, to?, nights?, date?, time?, tour?, party? }` | `{}` |
| `pending` | Boolean | la aplicación está consultando | `false` |
| `disabled` | Boolean | todo deshabilitado | `false` |
| `locale` | String | BCP 47 | el `lang` del ancestro |
| `labels` | Object | ver «Textos» | `{}` |
| `id` | String | base de los `id` | generado |

- **`kind`:** fija los campos: `stay` = llegada + salida (o noches en la frase) + grupo; `table` = fecha + turno + grupo; `tour` = recorrido + fecha + grupo.
- **`appearance`:** `phrase` o `bar`. Sin `labels.phrase`, o sin un marcador obligatorio del `kind`, se pinta `bar` y avisa; un marcador desconocido se pinta literal y avisa. `guided` está **reservado** (avisa y se pinta como `phrase`).
- **Marcadores de la frase:** `stay` `{from}` `{nights}` `{party}`; `table` `{party}` `{date}` `{time}`; `tour` `{tour}` `{date}` `{party}`.
- **`disabledNights`:** un día cuya noche está agotada no es llegada; una estancia que contiene una noche agotada es un error con la fecha; **salir** un día agotado es válido. Con `disabledDates` solo, no se impide que el rango contenga días agotados.
- **`minNights` y `maxNights`:** cambiar la llegada **no recorta** las noches en silencio: si ya no caben, es un error al enviar. Fuera de `stay` avisan.
- **`names`:** nombre de cada campo oculto (`name = names[clave] ?? clave`); el grupo pinta uno por fila como `{names.party ?? 'party'}[{key}]`. Los ocultos existen **siempre**.
- **`pending`:** la acción pasa a `GBtn loading` con `labels.pending` y su región viva. No bloquea la edición.
- **Resto de atributos** (`action`, `method`, `target`, `class`, `data-*`): van al `<form>`.

## Props de `GPartyField`

| Prop | Tipo | Valores | Por defecto |
| --- | --- | --- | --- |
| `modelValue` (`v-model`) | Object | `{ [key]: Number }`, completado con `default`/`min` de cada fila | `{}` |
| `rows` | Array | **obligatoria**; ver «Filas» | — |
| `mode` | String | `popover` `inline` | `popover` |
| `label` | String | obligatoria salvo `aria-label`/`aria-labelledby` o el slot `trigger` | sin valor |
| `hint`, `error`, `warning`, `valid` | String | mensajes como `GInput` | sin valor |
| `name` | String | ocultos `{name}[{key}]` y registro en `GForm` | sin valor |
| `disabled`, `readonly` | Boolean | | sin valor |
| `size` | String | `xs` `sm` `md` `lg` `xl` | `md` |
| `variant` | String | `outline` `soft` | `outline` |
| `density` | String | `default` `comfortable` `compact` | el del formulario |
| `rounded` | String | `none` `xs` `sm` `md` `lg` `xl` `pill` | el del formulario |
| `block` | Boolean | ancho completo | sin valor |
| `labels` | Object | `{ done, separator }` | `{}` |
| `locale` | String | BCP 47 | el `lang` del ancestro |
| `id` | String | | generado |

### Filas (`rows`)

| Campo | Tipo | Regla |
| --- | --- | --- |
| `key` | String | Clave en el modelo y en el oculto (obligatoria, única) |
| `label` | String | Etiqueta del contador (obligatoria) |
| `hint` | String | Ayuda («De 0 a 12 años») |
| `min` | Number | Por defecto `0` |
| `max` | Number \| Function | Número o `(valor) => Number` (depende de otra fila: habitaciones ≤ adultos) |
| `default` | Number | Valor inicial (por defecto `min`) |
| `unit` | String \| Function | Pieza del resumen: String con `{count}` o `(n) => String` |
| `decrementLabel`, `incrementLabel` | String | Nombres de − y + (obligatorios: sin ellos no se pintan los pasos) |

- **Resumen:** las piezas `unit` de las filas con valor mayor que 0 (y siempre la primera), unidas por `labels.separator`, con `dir="auto"`. Es el texto del disparador.
- **Reglas del grupo:** si el `max` de una fila baja por debajo de su valor (quitar un adulto con tres habitaciones), el valor **se corrige** y se emite. El `min` de adultos lo fijas tú en tus filas.
- **`mode="popover"`:** disparador + panel. **`inline`:** las filas a la vista en un `role="group"`.
- **Dentro de un `GForm`** hereda `density`, `readonly`, `disabled`, `block` y su error por `name`, y se registra.
- **Solo lectura:** el disparador es enfocable y no abre; en `inline`, los contadores son de solo lectura.

## Eventos

| Evento | Componente | Payload | Cuándo |
| --- | --- | --- | --- |
| `update:modelValue` | ambos | la consulta / `{ [key]: Number }` | Cambia la consulta o un contador (o se corrige un valor por un `max` dependiente) |
| `submit` | `GBookingBar` | `{ kind, from?, to?, nights?, date?, time?, tour?, party, event, preventDefault(), defaultPrevented }` | Envío **válido** (acción, Intro, muelle u hoja), síncrono en el gesto |
| `open` | `GPartyField` | — | El panel se abre |
| `close` | `GPartyField` | — | El panel se cierra (Esc, Tab fuera, tocar fuera, «Listo») |

**Envío nativo:** solo si el `<form>` tiene `action` **y** no llamas a `preventDefault()` en `submit`. Sin `action`, el componente cancela siempre el envío nativo (no recarga la página).

## Slots y métodos

`GBookingBar` no declara slots. `GPartyField`:

| Slot | Contenido |
| --- | --- |
| `trigger` | Sustituye al disparador (es la forma en que la frase de `GBookingBar` lo usa). Alcance: `{ id, expanded, controls, toggle, open, close, value, text }`. Con él no se pintan `label`, `hint` ni el mensaje, y tú pones `aria-haspopup`, `aria-expanded`, `aria-controls` y el nombre |
| `label` | Etiqueta del campo |

Métodos de `GPartyField`: `open()`, `close()` y `focus()`.

## Textos (`labels` de `GBookingBar`)

Marcadores con `{…}`; cifras con `Intl.NumberFormat(locale)` y fechas con `Intl.DateTimeFormat(locale)`. Los **contados** (`nights`, `missing`) admiten un String o una función. Falta una clave: avisa una vez.

| Clave | Uso |
| --- | --- |
| `phrase` | Plantilla de la frase (A) |
| `fields.{from\|to\|nights\|date\|time\|tour\|party}` | Etiquetas de campo y rótulos ocultos de los huecos |
| `empty.{from\|nights\|date\|time\|tour}` | Texto del hueco vacío («¿qué día?») |
| `nights` | «{count} noches» (contado) |
| `checkout` | «Salida el {date}» |
| `noDates`, `noDate`, `noTime`, `noTour` | Lo que falta, en el resumen |
| `separator` | Unión de las piezas del resumen (Grana no añade puntuación) |
| `summaryTitle`, `change` | «Tu consulta», «Cambiar» |
| `submit`, `pending` | Acción y su `loadingText` |
| `close`, `done`, `otherDay`, `full` | Cierre de la hoja, «Listo», «Otro día», sufijo de un turno lleno |
| `decrement`, `increment` | Nombres de − y + del contador de noches |
| `errors.{dates\|night\|nights\|date\|time\|tour}` | Mensajes (`night` con `{date}`) |
| `missing` | Anuncio al enviar incompleto (`{count}`, `{list}`; contado) |
| `datePicker` | Objeto con los `labels` de `GDatePicker`, que se pasa tal cual a cada `GDatePicker` interno. Grana no los traduce ni los completa |

## Teclado y foco

| Pieza | Teclado |
| --- | --- |
| Hueco de la frase | Intro o Espacio abre su editor; Esc cierra y devuelve el foco; Tab fuera cierra sin robar el foco; tocar el fondo del panel no lo cierra |
| Panel de un hueco | El foco va al primer control; elegir una opción de radio **no cierra** (las flechas cambian la opción; cierras con Esc, Tab o «Listo») |
| Resumen compacto y «Cambiar» | Intro abre la hoja; Esc la cierra y el foco vuelve al resumen (o a «Cambiar») |
| `GPartyField` | Intro, Espacio o clic abren el panel con el foco en el primer contador; Esc cierra y devuelve el foco al disparador |
| Enviar incompleto | El foco va **al primer campo que falta**; en la barra compacta se abre la hoja con los errores |

Una activación por gesto: el doble clic o Intro mantenido no abren y cierran.

## Accesibilidad

- a. **`form role="search"`** con nombre (`title`) y la acción descrita por el resumen (`aria-describedby`). `prueba`: `GBookingBar.test.js` 29 de 29 y `GPartyField.test.js` 14 de 14, en verde al documentar.
- b. **Cada hueco de la frase** es un `button` con `aria-haspopup="dialog"` y `aria-expanded`; su nombre es el rótulo oculto más el texto visible (el nombre contiene lo que se ve, 2.5.3). `prueba`.
- c. **Contraste de la frase.** Frase, título y mensaje ≥ 4,5:1; valor del hueco ≥ 4,5:1 (mínimo 7,44:1); subrayado ≥ 3:1 (mínimo 3,44:1); error y lleno, tinta continua ≥ 3:1; ocho temas, claro y oscuro, en Chromium (tres en Firefox y WebKit). `medido`.
- d. **Vacío, lleno y error se distinguen por forma, no solo por color:** subrayado discontinuo frente a continuo, y con error más grueso (también en colores forzados). `medido`.
- e. **Diana.** ≥ 24 px con puntero fino y 44 px con grueso, siempre ≤ el interlineado. `GPartyField` suelto: alto ≥ 36 px (fino) y ≥ 44 px (grueso), con foco ≥ 3:1. `medido`.
- f. **Valida al enviar, nunca al escribir.** Enviar incompleto anuncia `labels.missing` por el canal de página y deja `aria-invalid` y un mensaje con el qué hacer en cada campo.
- g. **Reflujo y RTL.** Sin desplazamiento horizontal a 1100, 390, 320 y 320×256; la frase refluye como texto; los paneles de noches, huéspedes y calendario se abren dentro del visor. La frase lleva `dir="auto"`: sigue al idioma del texto, no al de la página. `medido`.
- h. **Muelle.** Oculto es `display: none` e inerte; visible, con el alto de contrato, de borde a borde y abajo; **el último control nunca queda por debajo**; con movimiento reducido solo funde. `medido`.
- i. **Colores forzados.** En Chromium: subrayado `CanvasText`, error en `Highlight` y más grueso. `medido` solo en Chromium.

> **Peligro.** Una plantilla `labels.phrase` sin los marcadores obligatorios del `kind` (por ejemplo, sin `{party}`) hace que la frase **no se pinte**: la consulta cae a la barra y solo lo dice un aviso de desarrollo. Escribe la plantilla de cada idioma con todos sus marcadores. Igual con `partyRows`: una fila sin `decrementLabel` e `incrementLabel` no pinta sus pasos − y +.

## Personalidad

Tres movimientos, todos con tokens y sin muelle ni rebote propios:

- **La tinta que se asienta (A):** el hueco vacío lleva un subrayado discontinuo sin tinta; al llenarse, el trazo se dibuja continuo en `--g-duration-slow` desde el inicio de la línea (izquierda en LTR, derecha en RTL) y al vaciarse se recoge en `--g-duration-fast`. Con movimiento reducido aparece sin transición. Nada de la frase se desplaza al llenarse.
- **El muelle (B):** entra desde abajo con `translate` y opacidad (`--g-duration-slow`, `--g-ease-out`), sale con `--g-duration-press`. Con movimiento reducido, solo funde.
- **Los paneles** salen de su hueco.

## Tema

`GBookingBar` y `GPartyField` solo leen `var(--g-*)`. Componen campos que ya leen los suyos (no los releen); lo propio es (listas exactas de los CSS, DECISIONS #759):

- **`GBookingBar`:** `--g-color-surface` (panel y muelle), `--g-color-text`, `--g-color-text-muted`, `--g-color-text-subtle`, `--g-color-border`, `--g-color-border-strong`, `--g-color-border-control` (huecos y resumen compacto), `--g-color-danger-text`, `--g-color-focus`, `--g-focus-width`, `--g-focus-offset`, `--g-border-width`, `--g-radius-*`, `--g-shadow-2` (paneles), `--g-shadow-3` (muelle), `--g-text-title-*` y `--g-text-title-sm-weight` (la frase y el resumen), `--g-text-body-*`, `--g-text-body-sm-*`, `--g-text-caption-*`, `--g-text-action-weight`, `--g-font-ui`, `--g-space-*`, `--g-sidebar-bar` (reserva del navbar en el muelle), `--g-duration-fast`, `--g-duration-press`, `--g-duration-slow`, `--g-ease-out`, `--g-ease-standard`.
- **`GPartyField`** (es una caja de campo como `GSelect` y lee lo mismo): `--g-color-surface`, `--g-color-surface-sunken`, `--g-color-text`, `--g-color-text-muted`, `--g-color-text-subtle`, `--g-color-neutral-soft`, `--g-color-border`, `--g-color-border-strong`, `--g-color-border-control`, `--g-color-danger-text`, `--g-color-warning-text`, `--g-color-success-text`, `--g-color-focus`, `--g-focus-width`, `--g-border-width`, `--g-radius-*`, `--g-shadow-2`, `--g-text-body-*`, `--g-text-body-sm-*`, `--g-text-caption-*`, `--g-text-action-weight`, `--g-font-ui`, `--g-space-*`, `--g-duration-*` y `--g-ease-out`, `--g-ease-standard`.

**Alto del muelle (contrato):** `max(--g-space-16, 44px + --g-space-1 × 4)` (64 px con `space` 4). Se registra en el reparto de bordes con orden `bookingDock` (20): queda por encima del navbar de `GSidebar`, y el FAB y los avisos, encima de él.

## Clases

`g-booking-bar`, `--appearance-{phrase|bar}`, `--kind-{stay|table|tour}`, `is-compact`, `is-disabled`; frase: `__title`, `__phrase`, `__slot` (con `is-empty` o `is-filled`, e `is-invalid`), `__slot-label`, `__slot-value`, `__slot-panel`, `__checkout`, `__messages`; barra: `__row`, `__field`, `__compact`, `__summary` (con `__summary-title`, `__summary-text`, `__summary-change`), `__submit`, `__digest`, `__sheet`; muelle: `__dock` (con `is-shown`), `__dock-summary`, `__dock-change`. `GPartyField`: `g-party-field`, `--mode-{popover|inline}`, `--trigger`, `--size-*`, `--variant-*`, `--density-*`, `--rounded-*`, `--block`, `is-open`, `is-invalid`, `is-warning`, `is-valid`, `is-readonly`, `is-disabled`, `is-rejected`, `__label`, `__trigger`, `__value`, `__arrow`, `__panel`, `__rows`, `__done`, `__support`, `__hint`, `__message`.

## Avisos de desarrollo

`[Grana GBookingBar]`, una vez por instancia y motivo, solo fuera de producción:

1. Sin `title`.
2. Sin `partyRows`.
3. `kind="table"` sin `times`, o `kind="tour"` sin `tours`.
4. `modelValue` con forma inválida para el `kind`.
5. Dentro de otro `<form>`.
6. `phrase` sin `labels.phrase` o sin un marcador del `kind`; marcador desconocido.
7. Falta una clave de `labels`.
8. `disabledNights`, `minNights` o `maxNights` con un `kind` distinto de `stay`.
9. `appearance="guided"` (reservada).

`[Grana GPartyField]`: sin `rows`, o fila sin `key`/`label`, o `key` repetida; sin nombre accesible; fila sin `decrementLabel`/`incrementLabel`, o falta `labels.done` (popover) o `labels.separator`; `mode="popover"` dentro de un `<dialog>`; valor fuera de `[min, max]` (se muestra tal cual).

## Alcance

- **Emite una intención, no hace la reserva:** navegar, abrir WhatsApp o pintar resultados es tuyo. El componente no navega salvo el envío nativo que pides con `action`.
- **Compone, no rehace:** fechas con `GDatePicker`, cifras con `GNumberField`, listas con `GSelect`/`GRadioGroup`, hoja con `GDialog`.
- **La consulta se aísla de un `GForm` exterior**; dentro de otro `<form>` avisa (formularios anidados).
- **Reservado** (no existe hoy): **C · El conserje** (`appearance="guided"`); un turno libre con `GTimeField` (`times` ausente con `table`); `GCombobox` para recorridos largos; `childAges` en `GPartyField` (la edad de cada niño); el **precio por día** o «desde» (ronda de moneda, DECISIONS #745).
- **Límites aceptados:**
  - La frase **depende de una plantilla bien escrita** por idioma: los marcadores son obligatorios.
  - **El muelle no aparece** si, con la barra inferior y el navbar, ocuparía más de un cuarto del visor.
  - **La cola del muelle** (DECISIONS #757) es un `:root::after` que Grana pone en la capa de la librería. Dos casos en los que **tú** debes dejar el alto del muelle al final de lo que se desplaza: (1) tu aplicación usa su propio `:root::after`; (2) tu desplazamiento **no** es el del documento (un `body` o un contenedor con `overflow: auto`). El `scroll-padding-block-end` que Grana escribe en `<html>` pierde ante uno tuyo sin capa: si pones el tuyo, suma el alto del muelle.
  - **A 320 px** el valor de un hueco largo («2 adultos · 1 habitación») puede partirse en dos líneas dentro de su botón y dejar el punto final de la plantilla solo en la línea siguiente. Es legible, sin desplazamiento y con la diana intacta (hallazgo B-A3, de estética, abierto).
  - **Banco de pruebas** (`packages/vue/playground/booking.html`): `?tail=0` no cambia nada y `GPartyField` suelto (`?party=1`) queda pegado a la acción de la barra. Es del banco, no del componente (hallazgo B-A2).

## Verificación

- **Pruebas** (vitest, jsdom): `GBookingBar.test.js` **29 de 29**, `GPartyField.test.js` **15 de 15** y `GDatePicker.test.js` **102 de 102** (por las enmiendas que usa la barra), en verde, ejecutadas de nuevo al documentar. `prueba`.
- **Auditoría de coco** con el componente real (`dist/booking.umd.js`, banco `packages/vue/playground/booking.html`) y temas distintos al por defecto (terracota, añil, pálida, stripe, amazon, linear y notion): `node design/lab/booking-bar/auditoria-verificar.mjs`. El informe (2026-10-21) registra **760 de 760** en Chromium, Firefox y WebKit y que **se repitió al documentar** sobre el árbol actual: **760 de 760** (`medido`, 2026-10-21, tres motores).
- **Banco de estilo** (`estilo-verificar.mjs`): 214 de 214 en Chromium, según el informe. **Specs de bruno** (`tests/booking.spec.mjs`): en verde en los tres motores, según el informe. No se corrieron al documentar.
- **Empaquetado** (al documentar): `dist/grana.js` no contiene `GBookingBar`; `dist/booking.js`, `dist/booking.umd.js` y `dist/booking.d.ts` existen.
- **Hallazgo corregido en la auditoría:** en el calendario, el día «solo salida» que además era el fin elegido se pintaba con `text-muted` sobre el relleno de la selección y casi no se veía (B-A1); corregido por coco en `GDatePicker.css` y medido ≥ 4,5:1.
- **Rúbrica de movimiento:** las ocho dimensiones **cumplen** o no aplican (inmersión: N/A).
- **Pendientes abiertos:** B-A2 (banco, de bruno) y B-A3 (estética, de coco) arriba; los generales, en [`PENDIENTES.md`](../../../../../PENDIENTES.md).

## No verificado

- **Lector de pantalla real** con la frase en modo lectura (VoiceOver, NVDA, JAWS, TalkBack).
- **Móvil real** con el teclado virtual sobre la hoja.
- **Zoom real del navegador** (se emuló con 320×256).
- **Otros idiomas en la frase:** el RTL se midió solo con la plantilla en español y una frase forzada a `rtl`.
- **`forced-colors` en Firefox y WebKit:** Playwright solo lo emula en Chromium.
- **El contraste del botón «Cambiar» del muelle:** es el `GBtn` `outline` `neutral` ya auditado; no se midió aquí.
- **Safari real.**

## Fuentes

API: [`GBookingBar.meta.json`](./GBookingBar.meta.json), [`GPartyField.meta.json`](../GPartyField/GPartyField.meta.json) · Contrato: [`design/contracts/booking-bar.md`](../../../../../design/contracts/booking-bar.md) (DECISIONS #736 a #742, #744, #745, #757, #759 y #761) y [`design/contracts/datepicker.md`](../../../../../design/contracts/datepicker.md) «Noches y salida» (#739) · Ronda de kiwi: [`design/lab/booking-bar/r01/`](../../../../../design/lab/booking-bar/r01/) · Estilo: [`design/lab/booking-bar/estilo.md`](../../../../../design/lab/booking-bar/estilo.md) · Auditoría: [`design/lab/booking-bar/auditoria.md`](../../../../../design/lab/booking-bar/auditoria.md) · Pruebas: `GBookingBar.test.js`, `GPartyField.test.js`, `design/lab/theme-playground/tests/booking.spec.mjs`
