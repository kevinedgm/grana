# GbItinerary · GbItinerary01, GbItinerary02 y GbItinerary03

Un recorrido por horas, **en orden, con la hora del lugar** y, el día del recorrido, **dónde va el grupo ahora**. Es un programa que se lee, no un proceso que se completa: por eso **no lleva `GStepper`**. Va como lista con hora, por días plegables o como tabla. Compone `GSection`, `GStack`, `GCard`, `GAccordion` y `GAccordionItem`, `GTable`, `GBadge` (vía `GCard badge`) y `GText`; no trae color, CSS ni textos propios.

**Etiquetas:** `<gb-itinerary-01>`, `<gb-itinerary-02>`, `<gb-itinerary-03>` · **Estado:** `candidate` (ver «Verificación») · **Desde:** `0.0.0` (paquete privado, aún sin publicar) · **Entrada:** `@grana/blocks/booking`

```js
import { GbItinerary01, GbItinerary02, GbItinerary03 } from '@grana/blocks/booking'
```

> `@grana/blocks` es privado (`0.0.0`) y no se publica con la beta `0.1.0` de `@grana/vue`. Por ahora se usa desde el repositorio (banco real en `packages/blocks/playground/booking/itinerary.html`). Exige `@grana/vue` (peer, `>=0.1.0-beta.0 <1.0.0`) y Vue `^3.5.0`. Esta sección solo necesita `@grana/vue`. Reglas comunes e instalación: [`packages/blocks/README.md`](../../../README.md).

## Qué lo hace distinto

**Dice «ahora» con la hora del lugar** (DECISIONS #874). El día del recorrido, el viajero que abre la página en Monte Albán ve —y su lector oye como «hora actual»— **qué parada toca y cuál sigue**, calculado con la zona del lugar (`timeZone`) aunque su teléfono siga en la hora de Toronto. No hay temporizador que cambie la página mientras se lee ni un salto automático a la parada: se calcula al abrir y al volver a la página (`visibilitychange`). Y no es un `GStepper`: un programa no se «completa», así que no hay pasos tachados ni «paso 3 de 8».

## Las tres variantes

Las tres reciben la misma `interface Props` (`GbItineraryProps`, el mismo objeto `props` de `props.js`). Lo que una variante no usa, lo ignora en silencio.

| Variante | Concepto | Compone | Ignora |
| --- | --- | --- | --- |
| `GbItinerary01` | Lista con hora: las paradas en orden, cada una con su hora delante | `GSection` > por día (si hay más de uno, una `GSection` anidada con `label`; con uno, directo) > `GStack as="ol" gap="sm"` > `GCard as="li" level="flat" orientation="auto" mediaPosition="start"` (la hora en el `eyebrow`, `title`, `description`, `media`, `badge` del «ahora») y `GText` con el `place` | — |
| `GbItinerary02` | Por días: un día por elemento de un acordeón; el nombre del día y su primera parada asoman | `GSection` > `GAccordion` > un `GAccordionItem` por día (`title` = `label`, `meta` = la fecha en palabras, `peek` = `summary` o «{hora} · {primera parada}») > el `ol` de 01 | — |
| `GbItinerary03` | Tabla: una tabla por día con hora, parada y lugar | `GSection` > por día una `GTable` (`caption` = `label` + fecha en texto plano, `responsive="auto"`) | `media` y `Stop.description` (la tabla es la vista breve) |

**Las horas:** `Stop.time` y `end` son `HH:mm` **del lugar** (dato de tu aplicación). El bloque las pinta en `<time datetime="HH:mm">` con el texto de `Intl.DateTimeFormat(locale, { hour, minute, timeZone })` (12 o 24 horas según el idioma). La fecha de un día (`ItineraryDay.date`, ISO) va en `<time>` con su texto en palabras («sábado, 14 de noviembre»). El `caption` de la tabla de 03 es la excepción: texto plano, porque `GTable` no admite marcado ahí (#890); las horas de las celdas sí van en `time`.

**«Ahora» (las tres):**

1. **Cuándo:** solo si algún día tiene `date` igual a **hoy en `timeZone`** (sin `timeZone`, la del navegador y aviso I1). Se calcula en `onMounted` y al volver la página a primer plano; **nunca con un temporizador** (2.2.2) y **nunca en el servidor** (SSR sin marca: la hora del servidor no es la del lugar ni la del viajero).
2. **Qué marca:** la parada cuyo intervalo `[time, end ?? siguiente time)` contiene la hora local del lugar es «ahora»; la siguiente, «siguiente». Antes de la primera, solo «siguiente» en la primera. Después de la última, nada. Una última parada sin `end` nunca es «ahora» (#890).
3. **Cómo:** la parada lleva `aria-current="time"` y una insignia con texto (`labels.now`, `labels.next`), nunca solo color. En 03, `aria-current` va en el nombre de la parada y la celda lleva el texto. **No se anuncia** (sin región viva).
4. **No mueve nada:** no desplaza la página a la parada ni abre su día en 02; el elemento del día de hoy lleva además `labels.now` en su `meta` para encontrarlo al recorrer los encabezados. Las insignias «Ahora» y «Siguiente» son neutras: el significado va en el texto, un color de éxito o de aviso diría algo que no es (BK-N1).

## Uso

```vue
<script setup>
import { GbItinerary01 } from '@grana/blocks/booking'

const programa = {
  title: 'Programa del recorrido',
  description: 'Monte Albán y Arrazola en dos días; todas las horas son de Oaxaca.',
  timeZone: 'America/Mexico_City',
  locale: 'es',
  days: [
    {
      id: 'dia-1',
      label: 'Día 1 · Monte Albán',
      date: '2026-11-14',
      summary: 'Zona arqueológica por la mañana y comida en Arrazola',
      stops: [
        { id: 'encuentro', time: '07:45', title: 'Punto de encuentro', description: 'Frente a la puerta de Casa Alcalá', place: 'Macedonio Alcalá 307' },
        { id: 'llegada', time: '08:30', title: 'Llegada a Monte Albán', place: 'Acceso principal', media: { src: '/fotos/acceso.jpg', alt: 'Acceso principal de Monte Albán', width: 1200, height: 800 } },
        { id: 'plaza', time: '09:00', end: '10:30', title: 'Gran Plaza', description: 'Recorrido guiado por los edificios principales' },
        { id: 'comida', time: '13:00', end: '14:30', title: 'Comida', description: 'Mole negro en casa de la familia Morales', place: 'Arrazola' }
      ]
    },
    {
      id: 'dia-2',
      label: 'Día 2 · Mercado',
      date: '2026-11-15',
      stops: [{ id: 'mercado', time: '09:00', end: '11:00', title: 'Mercado 20 de Noviembre', place: 'Centro histórico' }]
    }
  ],
  labels: { now: 'Ahora', next: 'Siguiente', time: 'Hora', stop: 'Parada', place: 'Lugar' }
}
</script>

<template>
  <GbItinerary01 v-bind="programa" />
</template>
```

Esta sección solo carga `@grana/vue`. `labels.time`, `stop` y `place` solo los usa la 03.

## Ejemplos

### e1 · El programa como lista con hora (`GbItinerary01`)

**Por qué:** cuando el programa es corto y se lee de arriba abajo. Cada parada lleva su hora delante, su foto (si tiene) al lado y el «ahora» en una insignia con texto.

```vue
<!-- Fragmento: `programa` es de tu aplicación -->
<GbItinerary01 v-bind="programa" />
```

### e2 · Un programa de varios días (`GbItinerary02`)

**Por qué:** cuando hay más de dos días y el viajero busca uno solo. El acordeón enseña el nombre del día, su fecha y su primera parada sin abrirlo; el día de hoy no se abre solo, pero lleva «Ahora» en su descripción.

```vue
<!-- Fragmento: `programa` es de tu aplicación -->
<GbItinerary02 v-bind="programa" />
```

### e3 · La vista breve en tabla (`GbItinerary03`)

**Por qué:** cuando importa comparar horas y lugares de un vistazo; las descripciones y las fotos quedan fuera. En estrecho la tabla pasa a tarjetas.

```vue
<!-- Fragmento: `programa` es de tu aplicación -->
<GbItinerary03 v-bind="programa" />
```

### e4 · Un cuerpo propio para la parada (slot `stop`)

**Por qué:** cuando una parada necesita algo que `description` y `place` no cubren (un aviso, un enlace al punto exacto). El slot sustituye al `place` en 01 y 02 y recibe `{ stop, day, now, next }`.

```vue
<!-- Fragmento: `programa` es de tu aplicación -->
<GbItinerary01 v-bind="programa">
  <template #stop="{ stop, now }">
    <span>{{ stop.place }}</span>
    <strong v-if="now">Estamos aquí</strong>
  </template>
</GbItinerary01>
```

## Props

Una sola interfaz para las tres variantes (`GbItineraryProps`). Los tipos de datos salen de `@grana/blocks/booking`.

| Prop | Tipo | Descripción |
| --- | --- | --- |
| `title` | `string` (requerida) | Título de la sección (`GSection`). |
| `description` | `string` | Descripción; la `GSection` la pinta. |
| `days` | `ItineraryDay[]` (requerida) | 1 a 14 días (C7); un día con 1 a 30 paradas (C7). Stop.time/end en HH:mm del lugar (I2 si no); date ISO da el día y el «ahora» |
| `timeZone` | `string` | IANA del lugar («America/Mexico_City»): el «ahora» se calcula en esa zona aunque el teléfono esté en otra; sin ella, la del navegador (I1) |
| `locale` | `string` | Idioma de las horas (12 h o 24 h) y las fechas; sin él, el lang del ancestro al montar |
| `labels` | `ItineraryLabels = {}` | now y next (con algún date, al marcar: C5; sin ellos, solo aria-current), time, stop y place (cabeceras de 03, C5), external; sin valores por defecto |

## Eventos

**Ninguno.** El itinerario no tiene intención que atender: los textos de las paradas son texto plano, sin enlaces.

## Slots

| Slot | Alcance | Qué va |
| --- | --- | --- |
| `stop` | `{ stop: Stop; day: ItineraryDay; now: boolean; next: boolean }` | Escape: cuerpo de la parada (en lugar del place) en 01 y 02. Solo `GbItinerary01`, `GbItinerary02`. |

## Textos (`labels`)

| Clave | Requerido |
| --- | --- |
| `now`, `next` | Sí, con algún `date` (C5 al marcar; sin ellos, solo `aria-current`) |
| `time`, `stop`, `place` | Sí, en 03 (C5): cabeceras de columna |
| `external` | — |

## Teclado y foco

| Tecla | Efecto |
| --- | --- |
| `Tab` | En 02 recorre los encabezados de los días; en 01 y 03 no hay controles |
| `Intro` o `Espacio` en un encabezado de 02 | Abre o cierra el día (el encabezado no se mueve al abrir) |

Es el teclado de `GAccordion`; el bloque no añade teclas.

## Accesibilidad

Cifras de la auditoría de coco ([`design/lab/blocks/booking/auditoria.md`](../../../../../design/lab/blocks/booking/auditoria.md)), tres motores, tres temas, claro y oscuro (`medido`):

a. `ol` real (01 y el panel de 02) y una tabla por día (03); las horas en `<time datetime>` (`prueba`, Vitest).
b. «Ahora» y «Siguiente» con `aria-current="time"` y texto en la parada correcta según `timeZone`, también con el navegador en otra zona; sin marca en SSR ni sin `date`; ningún temporizador tras montar (`prueba`, con un reloj simulado en cuatro momentos).
c. Las insignias neutras tienen contraste ≥ 4,5:1 en los tres temas, claro y oscuro (BK-N1).
d. 03 dice la hora de fin en la celda de hora (BK-B4, cerrado: antes «9:00–10:30» salía como «9:00»).
e. 02: plegado de 240 ms, encabezado quieto (Δ 0 px), interrumpible (abrir y cerrar en el mismo cuadro termina cerrado); con movimiento reducido no hay desplazamiento; el día de hoy no se abre solo.
f. Sin desplazamiento horizontal a 1440, 390, 320 ni a 320 con el texto al 200 %; 03 pasa a tarjetas en estrecho.

> **Peligro.** Un `date` sin `timeZone` calcula el «ahora» en la zona del navegador (aviso I1): quien abre la página desde otra zona verá marcada la parada que no toca. Da siempre `timeZone` con las fechas del recorrido. Y escribe `time` como `HH:mm` (I2): con otro formato la parada se pinta tal cual y no puede ser «ahora».

## Avisos de desarrollo

Prefijo `[Grana GbItinerary<NN>]`, una vez por instancia y motivo, solo en desarrollo. Los comunes (C1 a C4, C7) están en [`packages/blocks/README.md`](../../../README.md#avisos-comunes-de-booking). Los propios:

| Código | Motivo | Qué pasa |
| --- | --- | --- |
| I1 | Un `date` sin `timeZone` | Se usa la zona del navegador |
| I2 | `time` o `end` que no es `HH:mm` | Se pinta tal cual, sin «ahora» para esa parada |
| I3 | Paradas fuera de orden por `time` dentro de un día | Se pintan en el orden del arreglo |

C5 avisa de `now`/`next` al marcar y de `time`/`stop`/`place` en 03.

## Banco de datos de ejemplo

`itinerary.bank.js` exporta `{ props, slots }`: el tour Monte Albán en `America/Mexico_City` con dos días con `date`; el primero con seis paradas (07:45 punto de encuentro, 08:30 llegada, 09:00 a 10:30 Gran Plaza... 13:00 a 14:30 comida), una con foto y `place`, otra con un nombre largo sin espacios; `labels` completos. Con `?hoy=1` el banco real (`packages/blocks/playground/booking/itinerary.html`) pone la hora de modo que el «ahora» se vea. Con el banco por defecto ninguna variante avisa.

## Peso

`dist/booking.js` pesa **36 851 B gzip** con su trozo compartido de `common/` (las 11 secciones y 33 variantes; `medido` con `node packages/blocks/scripts/measure-entry.mjs booking`  2026-10-23); tope de la entrada **37 888 B** (DECISIONS #907; el tope inicial de 36 KiB no se vuelve a subir). Una variante importada sola (esbuild minificado  `vue` y `@grana/vue*` externos; `node packages/blocks/scripts/measure-partial.mjs 5120 booking GbGuestForm=7168`): `GbItinerary01` 3 579 B  `GbItinerary02` 3 620 B  `GbItinerary03` 3 144 B; tope por variante **5 120 B** (#887). `@grana/vue` y sus entradas son *peer*: las paga la aplicación.

## Alcance

- **Nunca `GStepper`:** el programa se lee, no se completa.
- **El «ahora» no se anuncia ni mueve nada:** sin región viva, sin temporizador, sin salto a la parada.
- **Sin eventos ni enlaces:** el texto de las paradas es plano.
- **Límite aceptado BK-L11 (#905):** las paradas de 01 entran el relleno de `GCard level="flat"` respecto al título del día (16 px) sin una caja visible que lo explique; la parada con foto empieza en el borde. Es la regla de las tarjetas planas en lista (como B-L6).
- **03:** `GTable` no admite atributos por fila, por eso `aria-current` va en el nombre de la parada; en estrecho usa mínimos de columna de 16/40/32 para pasar a tarjetas a 320 px (#890).
- **Sin CSS ni utilidades** (#763, #807).

## Verificación

| Qué | Resultado | Nivel |
| --- | --- | --- |
| Vitest de `GbItinerary` (`ol` real y una `GTable` por día; horas en `time datetime`; «ahora» y «siguiente» por `timeZone` con un reloj simulado, también con el navegador en otra zona; sin marca en SSR ni sin `date`; ningún temporizador; `visibilitychange` recalcula; 02 no abre el día de hoy) | 50/50 (`npm test -w @grana/blocks`, 2026-10-23) | `prueba` |
| Auditoría de coco: Itinerary 01, 02 y 03 con `?hoy=1`; BK-B4 (03 con la hora de fin) cerrado; rúbrica de movimiento del plegado de 02 | Veredicto `candidate` tras el remate de bruno (en verde en los tres motores, addendum del 2026-10-23) | `medido` |

**No verificado:** lector de pantalla real (el «ahora» como hora actual, la tabla con `aria-current` en el nombre); `forced-colors` real; teléfono real; rendimiento con el perfilador (Itinerary con 14 días y 30 paradas por día no se midió). **Pendientes abiertos:** BK-L11 (límite aceptado); los generales, en [`PENDIENTES.md`](../../../../../PENDIENTES.md).

## Fuentes

- Contrato: [`design/contracts/blocks/itinerary.md`](../../../../../design/contracts/blocks/itinerary.md) y [`_comun.md`](../../../../../design/contracts/blocks/_comun.md) (§15 a §25).
- Decisiones: #860 a #866, #874, #890, #905, #907 en `DECISIONS.md`.
- Metadatos: [`GbItinerary.meta.json`](./GbItinerary.meta.json). Pruebas: [`GbItinerary.test.js`](./GbItinerary.test.js). Auditoría: [`design/lab/blocks/booking/auditoria.md`](../../../../../design/lab/blocks/booking/auditoria.md).
