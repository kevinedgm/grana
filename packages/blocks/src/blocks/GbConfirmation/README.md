# GbConfirmation · GbConfirmation01, GbConfirmation02 y GbConfirmation03

Lo que quedó reservado (o pedido), **dicho entero en una pieza que cabe en una captura**: el código, qué, cuándo, quiénes, cuánto, qué sigue y cómo escribir. No hay nada que desplegar para leerlo. El bloque no confirma nada: tu aplicación dice si la reserva está confirmada o pendiente (`state`), da el código y el total, y el bloque lo muestra. Compone `GSection`, `GCard`, `GStack`, `GMetric`, `GSummary`, `GBadge` (vía `GCard badge`), `GStepper`, `GPrice` y `GPriceScope` (`@grana/vue/price`), `GBtn` y `GText`; no trae color, CSS ni textos propios.

**Etiquetas:** `<gb-confirmation-01>`, `<gb-confirmation-02>`, `<gb-confirmation-03>` · **Estado:** `candidate` (ver «Verificación») · **Desde:** `0.0.0` (paquete privado, aún sin publicar) · **Entrada:** `@grana/blocks/booking`

```js
import { GbConfirmation01, GbConfirmation02, GbConfirmation03 } from '@grana/blocks/booking'
```

> `@grana/blocks` es privado (`0.0.0`) y no se publica con la beta `0.1.0` de `@grana/vue`. Por ahora se usa desde el repositorio (banco real en `packages/blocks/playground/booking/confirmation.html`). Exige `@grana/vue` (peer, `>=0.1.0-beta.0 <1.0.0`) y Vue `^3.5.0`. Además de `@grana/vue`, la aplicación carga las entradas que esta sección compone: `@grana/vue/booking`, `@grana/vue/price`. Reglas comunes e instalación: [`packages/blocks/README.md`](../../../README.md).

## Qué lo hace distinto

**Cabe en una captura y se dice por teléfono** (DECISIONS #873). El viajero guarda la confirmación como imagen o la reenvía por WhatsApp: la 03 está pensada para eso (una tarjeta, sin pliegues ni pestañas, medida a 390 × 844 sin desplazar), y en las tres el **código va primero y grande**, la consulta se dice con las mismas palabras que eligió (`describeQuery`), el total es el que cobra el lugar y los canales para escribir ya están a un toque. Si la reserva aún no está confirmada, **lo dice** en texto: «pedida» no se disfraza de «confirmada» (un `state` fuera de lista se pinta como pedida, F1). Las fechas de lo que sigue van en la hora del lugar (`timeZone`), no en la del teléfono.

## Las tres variantes

Las tres reciben la misma `interface Props` (`GbConfirmationProps`, el mismo objeto `props` de `props.js`). Lo que una variante no usa, lo ignora en silencio.

| Variante | Concepto | Compone | Ignora |
| --- | --- | --- | --- |
| `GbConfirmation01` | Tarjeta: la confirmación en una tarjeta con la ficha, el total y las acciones | `GCard as="section"` (raíz; título al nivel de `useSectionLevel()`, `badge` = estado, `media` = `offer.photos[0]` si hay) > código, ficha, total, canales y acciones | `next` |
| `GbConfirmation02` | Lo que sigue: la confirmación y, debajo, los pasos siguientes como un camino que ya empezó | `GSection` > `GStack gap="lg"` > [el estado en un `GText`, la anatomía común sin la foto, las acciones] + una `GSection` anidada (`labels.next`) > `GStepper orientation="vertical" navigation="none"` con `next` | — |
| `GbConfirmation03` | Captura: todo lo necesario en una sola tarjeta compacta que cabe en una pantalla de teléfono | `GCard as="section" density="compact" level="outlined"` sin `media` > código, consulta, total y canales; acciones solo si caben dos | `next`, `offer.photos`, `totals.lines` (solo el total) |

**Anatomía de lo confirmado (común):**

- **El código:** `GMetric` (`value` = `reference.code`, `label` = `reference.label`), primero tras el título, con cifras alineadas. **El bloque no lo parte ni lo reformatea**: si quieres grupos legibles, dalo con guiones («CA-7K29Q»). `GMetric` lo lee como una sola palabra (BK-L4; la lectura letra a letra queda reservada).
- **La consulta:** `GSummary layout="stack"` con `title` = el nombre de la oferta, `subtitle` = su tipo y un dato (`labels.when`, «Cuándo y quiénes») con las palabras de `describeQuery`. Sin `offer`, la consulta es el `title`.
- **El total:** un `GPrice` con `totals.total` y, debajo, las líneas (`totals.lines`, un `dl` en `GText`) y `totals.note`. El bloque pinta el total que das; no suma las líneas.
- **Los canales:** una lista de `GBtn variant="outline"` (WhatsApp, `tel:`, `mailto:`), cada uno con su ayuda en `GText caption`. Los del sistema no emiten `navigate`; los externos llevan su marca.
- **Las acciones:** como mucho dos; la primera `solid` y la segunda `outline` (§3).
- **El estado:** la insignia con texto (`labels.states[state]`, color de éxito para confirmada y de aviso para pedida) en 01 y 03; en 02, un `GText` justo después del encabezado, porque `GSection` no tiene insignia. Con `requested`, la aplicación da el plazo en `next` («Te confirmamos antes de las 20:00»).
- **`GStepper` en 02 es informativo** (`navigation="none"`, sin `v-model`): el actual es el primer paso de `next`. Es un proceso que la persona va a completar (llegar, registrarse), a diferencia del itinerario ([`GbItinerary`](../GbItinerary/README.md)), que nunca lleva `GStepper`.

## Recetas

### La consulta que viaja

Pasa a `query` la misma `BookingQuery` de [`GbSearch`](../GbSearch/README.md#la-consulta-que-viaja), con `partyRows` y `labels.query`: la confirmación dice «13–15 nov · 2 noches · 2 adultos · 1 niño» con las mismas palabras que la persona eligió. Aquí `query` y `partyRows` son requeridas.

### Montaje en columna (BK-L13)

`GbConfirmation01` está pensada para una **columna** (de 360 a 640 px), no para toda la página. A 1440 px de ancho su foto mide de 560 a 700 px de alto y baja el código de reserva, la dirección y el total del primer pantallazo (hallazgo BK-L13, #905). Móntala dentro de una columna de tu aplicación:

```vue
<!-- Fragmento: `confirmacion`, `consulta`, `partyRows` y `compartir` son de tu aplicación -->
<GContainer width="reading">
  <GbConfirmation01 v-bind="confirmacion" :query="consulta" :party-rows="partyRows" @activate="compartir" />
</GContainer>
```

El banco la monta a 1024 px por la misma razón. `GbConfirmation03` es compacta y cabe a cualquier ancho; `GbConfirmation02` es una página.

### «Compartir» en el gesto

«Compartir» es una acción sin `href`: emite `activate` **de forma síncrona**, así que tu aplicación llama a `navigator.share` dentro del gesto y la activación del usuario sigue viva:

```js
function compartir({ item }) {
  if (item.id === 'compartir') navigator.share({ title: 'Mi reserva', text: `Código ${codigo}`, url: location.href })
}
```

<!-- Fragmento: `codigo` es de tu aplicación -->

## Uso

Los datos comunes (`consulta`, `partyRows`, `queryLabels`, `precios`, `priceLabels`) están en [«Datos comunes de una reserva»](../../../README.md#datos-comunes-de-una-reserva).

```vue
<!-- Fragmento: `fotoSuite` y `compartir` son de tu aplicación -->
<script setup>
import { GbConfirmation01 } from '@grana/blocks/booking'
import { consulta, partyRows, queryLabels, precios, priceLabels } from './reserva.js'

const confirmacion = {
  title: 'Reserva confirmada',
  state: 'confirmed',
  reference: { code: 'CA-7K29Q', label: 'Código de reserva' },
  query: consulta,
  partyRows,
  offer: { id: 'suite-jardin', name: 'Suite Jardín', kind: 'Suite', photos: [fotoSuite] },
  totals: {
    lines: [
      { label: 'Viernes 13 y sábado 14 (2 noches)', amount: { amount: 4100, currency: 'MXN' } },
      { label: 'Impuesto de hospedaje', amount: { amount: 123, currency: 'MXN' }, note: '3 %' }
    ],
    total: { value: { amount: 4223, currency: 'MXN' }, label: 'por 2 noches' },
    note: 'Pagas al llegar: no te cobramos nada ahora.'
  },
  prices: precios,
  channels: [
    { label: 'WhatsApp', href: 'https://wa.me/529515550000', external: true, icon: 'message-circle', hint: 'Respuesta en menos de 2 h' },
    { label: '951 555 0000', href: 'tel:+529515550000', icon: 'phone' }
  ],
  actions: [
    { id: 'calendario', label: 'Añadir al calendario', href: '/reservas/CA-7K29Q.ics', icon: 'calendar-plus' },
    { id: 'compartir', label: 'Compartir', icon: 'share-2' }
  ],
  timeZone: 'America/Mexico_City',
  locale: 'es',
  labels: {
    states: { confirmed: 'Confirmada', requested: 'Pendiente de confirmar' },
    query: queryLabels,
    when: 'Cuándo y quiénes',
    channels: 'Escríbenos',
    price: priceLabels,
    external: 'se abre en otra pestaña'
  }
}
</script>

<template>
  <GbConfirmation01 v-bind="confirmacion" @activate="compartir" />
</template>
```

La aplicación registra los iconos Lucide que use (`createIcons` con `message-circle`, `phone`, `mail`, `calendar-plus`, `share-2`) y carga `@grana/vue/price` y `@grana/vue/booking`.

## Ejemplos

### e1 · La confirmación como tarjeta (`GbConfirmation01`)

**Por qué:** cuando la confirmación es una pieza dentro de una columna (la página de gracias, un correo web). El código va primero y la foto de la oferta da contexto.

```vue
<!-- Fragmento: `compartir`, `confirmacion` son de tu aplicación -->
<GbConfirmation01 v-bind="confirmacion" @activate="compartir" />
```

### e2 · La confirmación y lo que sigue (`GbConfirmation02`)

**Por qué:** cuando quien reserva tiene cosas por hacer (llegar, registrarse, desayunar). Debajo de la confirmación, `next` se lee como un camino que ya empezó, con las fechas en la hora del lugar.

```vue
<!-- Fragmento: `pasos` es de tu aplicación (lista de { id, title, description, date }) -->
<GbConfirmation02 v-bind="{ ...confirmacion, next: pasos }" @activate="compartir" />
```

### e3 · La captura para WhatsApp (`GbConfirmation03`)

**Por qué:** cuando quieres que se guarde como imagen o se reenvíe. Es una tarjeta compacta sin foto ni líneas del total que cabe en 390 × 844 sin desplazar; lleva como mucho dos acciones.

```vue
<!-- Fragmento: `confirmacion` es de tu aplicación -->
<GbConfirmation03 v-bind="confirmacion" />
```

### e4 · Una solicitud que aún no está confirmada (`state: 'requested'`)

**Por qué:** cuando el lugar debe confirmar. La insignia dice «Pendiente de confirmar» y el título dice que falta la confirmación; da el plazo en `next` para que la espera tenga fecha.

```vue
<!-- Fragmento: `plazo` es de tu aplicación ([{ title: 'Te confirmamos', date: '2026-11-12T20:00:00-06:00' }]) -->
<GbConfirmation02 v-bind="{ ...confirmacion, title: 'Recibimos tu solicitud', state: 'requested', next: plazo }" />
```

## Props

Una sola interfaz para las tres variantes (`GbConfirmationProps`). Los tipos de datos salen de `@grana/blocks/booking`.

| Prop | Tipo | Descripción |
| --- | --- | --- |
| `title` | `string` (requerida) | «Reserva confirmada» o «Recibimos tu solicitud»; en 01 y 03 es el de la tarjeta, al nivel de `useSectionLevel()`. |
| `state` | `ConfirmationState` (requerida) | confirmed o requested; fuera de lista se pinta requested (F1) |
| `reference` | `Reference` (requerida) | { code, label }: el código en GMetric, primero tras el título; el bloque no lo parte (BK-L4); vacío, F2 |
| `query` | `BookingQuery` (requerida) | Dicha con describeQuery (#862) |
| `partyRows` | `PartyRow[]` (requerida) | Las filas de `GPartyField`, para decir la consulta. |
| `context` | `QueryContextExtra` | `times` y `tours` para decir una consulta `table` o `tour`. |
| `offer` | `OfferRef` | Nombre y tipo en la ficha; la primera foto en 01 |
| `totals` | `Totals` | Lo que cobra el lugar (de la aplicación); 03 solo el total (F3 con lines) |
| `prices` | `PriceRegion` | Una región de precios para el total. |
| `next` | `NextStep[]` | 0 a 6 (C7); fechas en la zona del lugar (timeZone) Solo `GbConfirmation02`; las demás lo ignoran. |
| `channels` | `Channel[]` | WhatsApp, tel:, mailto:; los del sistema no emiten navigate (#834) |
| `actions` | `Action[]` | 0 a 2 (la primera solid, la segunda outline); «Compartir» sin href emite activate síncrono (navigator.share en el gesto); 03 como mucho dos (F3) |
| `timeZone` | `string` | IANA del lugar: fechas de next en su zona |
| `locale` | `string` | BCP 47; sin él, el `lang` del ancestro al montar. |
| `labels` | `ConfirmationLabels` (requerida) | states (C5), query y when (K2, C5), next y stepper (02 con next), channels (con channels), price, external |

## Eventos

| Evento | Carga | Cuándo |
| --- | --- | --- |
| `navigate` | `{ event, href, item }` (`BlockNavigate<Action \| Channel>`) | Una acción o un canal interno con clic primario (#505); nunca con external ni con tel:/mailto:/sms: |
| `activate` | `{ event, item }` (`BlockActivate<Action>`) | Una acción sin href («Compartir»), síncrono en el gesto |

«Compartir» y cualquier acción sin `href` emiten `activate` de forma síncrona, para que tu aplicación llame a `navigator.share` en el gesto. Un canal o una acción `external` no emite `navigate`.

## Slots

| Slot | Alcance | Qué va |
| --- | --- | --- |
| `summary` | `{ query: BookingQuery; offer: OfferRef \| undefined }` | Escape: ficha propia en lugar del GSummary |
| `actions` | — | Escape de las acciones (§3) |

## Textos (`labels`)

| Clave | Requerido |
| --- | --- |
| `states` | Sí (C5): `confirmed` y `requested` |
| `query` | Sí (K2): sin ellos y sin `partyRows` no se dice la consulta |
| `when` | Sí (C5): el rótulo de la consulta en la ficha |
| `next`, `stepper` | Sí, en 02 con `next` |
| `channels` | Sí, con `channels` (nombre de la lista) |
| `price` | Los de `GPrice` (avisa `GPrice`) |
| `external` | Sí, con un enlace externo |

## Accesibilidad

Cifras de la auditoría de coco ([`design/lab/blocks/booking/auditoria.md`](../../../../../design/lab/blocks/booking/auditoria.md)), tres motores, tres temas, claro y oscuro (`medido`):

a. El código es el primer dato tras el título (`prueba`, Vitest).
b. El estado se dice en texto («Pendiente de confirmar» o «Confirmada») con contraste ≥ 4,5:1; la insignia «Confirmada» en oscuro mide 4,51:1 en el tema por defecto y el rústico (BK-N3: pasa con 0,01 de margen).
c. La consulta en la ficha tiene las mismas palabras que el resumen de `GBookingBar`; en una línea a 1440 y en una o dos a 390 (BK-C1, corregido en `GSummary.css`: antes ocupaba cuatro líneas en una pista de ~115 px).
d. `GbConfirmation03` cabe entera en 390 × 844 sin desplazar (544 px de alto) y sin desbordar a 320.
e. Los canales quedan alineados (BK-B3, cerrado).
f. Con una palabra larga en una acción o canal, el botón la parte y no desborda a 320 px (BK-C2, corregido en `GBtn.css`).
g. Nada se mueve.

> **Peligro.** El bloque **no confirma**: pinta el `state` que le das. Si pasas `state: 'confirmed'` antes de que el lugar confirme, la persona verá «Confirmada» y su código sin que sea verdad. Pasa `requested` hasta tenerla, y no dejes `state` sin definir: fuera de lista el bloque pinta `requested` (F1) a propósito, nunca una confirmación por defecto.

## Avisos de desarrollo

Prefijo `[Grana GbConfirmation<NN>]`, una vez por instancia y motivo, solo en desarrollo. Los comunes (C3 a C8, K1 a K5) están en [`packages/blocks/README.md`](../../../README.md#avisos-comunes-de-booking). Los propios:

| Código | Motivo | Qué pasa |
| --- | --- | --- |
| F1 | `state` fuera de lista | Se pinta `requested`: nunca se afirma una confirmación por defecto |
| F2 | `reference.code` vacío | Se pinta sin código |
| F3 | 03 con más de dos `actions` o con `totals.lines` | Se ignoran |

## Banco de datos de ejemplo

`confirmation.bank.js` exporta `{ appIcons, props, slots, states }`: Casa Alcalá con `state: 'confirmed'`, `reference` `{ code: 'CA-7K29Q', label: 'Código de reserva' }`, la consulta común, Suite Jardín con una foto, `totals` (dos noches, impuesto y total) con la nota «Pagas al llegar», tres pasos en `next` (llegada desde las 15:00, registro, desayuno) en `America/Mexico_City`, tres `channels` (WhatsApp externo, `tel:`, `mailto:`), dos `actions` («Añadir al calendario» con `href` a un `.ics` y «Compartir» sin `href`) y `labels` completos. `states` trae `requested` (no lo usa el banco por defecto). El banco real está en `packages/blocks/playground/booking/confirmation.html`.

## Peso

`dist/booking.js` pesa **36 851 B gzip** con su trozo compartido de `common/` (las 11 secciones y 33 variantes; `medido` con `node packages/blocks/scripts/measure-entry.mjs booking`  2026-10-23); tope de la entrada **37 888 B** (DECISIONS #907; el tope inicial de 36 KiB no se vuelve a subir). Una variante importada sola (esbuild minificado  `vue` y `@grana/vue*` externos; `node packages/blocks/scripts/measure-partial.mjs 5120 booking GbGuestForm=7168`): `GbConfirmation01` 4 746 B  `GbConfirmation02` 4 799 B  `GbConfirmation03` 4 619 B; tope por variante **5 120 B** (#887). `@grana/vue` y sus entradas son *peer*: las paga la aplicación.

## Alcance

- **No confirma ni cobra:** `state`, `reference` y `totals` los da tu aplicación (#769, #780).
- **No parte el código:** el bloque lo pinta como llega (BK-L4).
- **03 ignora** `next`, `offer.photos` y `totals.lines` (solo el total) y limita las acciones a dos (F3).
- **`GStepper` aquí es informativo**: el camino de lo que sigue, no un formulario por pasos.
- **BK-L13 (#905):** la tarjeta 01 se monta en una columna; la receta está arriba.
- **Sin CSS ni utilidades** (#763, #807).

## Verificación

| Qué | Resultado | Nivel |
| --- | --- | --- |
| Vitest de `GbConfirmation` (el código es el primer dato tras el título; `GSummary` con la consulta igual a `describeQuery`; insignia con texto por estado; F1 pinta `requested`; 02 con `GStepper` informativo; 03 sin `next`, sin foto y sin líneas del total; canales del sistema sin `navigate`; «Compartir» emite `activate` síncrono) | 39/39 (`npm test -w @grana/blocks`, 2026-10-23) | `prueba` |
| Auditoría de coco: Confirmation 01, 02 y 03; 03 entera dentro de 390 × 844; la consulta en una línea (BK-C1 corregido); canales alineados (BK-B3 cerrado) | Veredicto `candidate`; contraste mínimo 4,51:1 en la insignia «Confirmada» en oscuro (BK-N3) | `medido` |

**No verificado:** lector de pantalla real (la consulta, el código como una palabra, el estado); teléfono real y compartir con `navigator.share` (no se ejercitó); `forced-colors` real; rendimiento con el perfilador. **Pendientes abiertos:** BK-L4 (lectura del código letra a letra, reservada en `price.md`); los generales, en [`PENDIENTES.md`](../../../../../PENDIENTES.md).

## Fuentes

- Contrato: [`design/contracts/blocks/confirmation.md`](../../../../../design/contracts/blocks/confirmation.md) y [`_comun.md`](../../../../../design/contracts/blocks/_comun.md) (§15 a §25).
- Decisiones: #860 a #866, #873, #883, #905, #907 en `DECISIONS.md`.
- Metadatos: [`GbConfirmation.meta.json`](./GbConfirmation.meta.json). Pruebas: [`GbConfirmation.test.js`](./GbConfirmation.test.js). Auditoría: [`design/lab/blocks/booking/auditoria.md`](../../../../../design/lab/blocks/booking/auditoria.md).
