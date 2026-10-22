# Contrato · Itinerary (`GbItinerary01` · `02` · `03`)

**Dueño:** lima · **Estado:** contratado (DECISIONS.md #860 a #866 y #874, 2026-10-22) · **Plan:** B8 (§4.3) · **Entrada:** `@grana/blocks/booking` · **Común:** `_comun.md` §1 a §5 y §14 a §25 · **Compone:** `GSection`, `GStack`, `GCard`, `GAccordion` + `GAccordionItem`, `GTable`, `GText`, `GBadge` (vía `GCard badge`) · **Parte de bruno:** B

## Promesa

Un recorrido por horas, **en orden, con la hora del lugar** y, el día del recorrido, **dónde va el grupo ahora**. Es un programa que se lee, no un proceso que se completa: **nunca `GStepper`** (plan §4.3).

## Props

```ts
interface GbItineraryProps {
  title: string
  description?: string
  days: ItineraryDay[]                   // 1 a 14 (C7); un día con 1 a 30 paradas
  timeZone?: string                      // IANA del lugar («America/Mexico_City»): la hora de `Stop.time` y del «ahora»
  locale?: string
  labels?: {
    now?: string                         // «Ahora»
    next?: string                        // «Siguiente»
    time?: string; stop?: string; place?: string   // cabeceras de columna (03)
    external?: string
  }
}
```

- **`Stop.time`/`end`** son `HH:mm` **del lugar** (dato de la aplicación); el bloque los pinta en `<time datetime="HH:mm">` con el texto de `Intl.DateTimeFormat(locale, { hour, minute, timeZone })` aplicado a esa hora en el día del recorrido (12 h o 24 h según el idioma). Sin `date`, se pinta la hora tal cual en el formato del idioma, sin «ahora».
- **`ItineraryDay.date`** (ISO) da el día; su texto en palabras («sábado, 14 de noviembre») va como `meta`/antetítulo en `<time>`.

## «Ahora» por la hora del lugar (todas las variantes)

1. **Cuándo:** solo si algún día tiene `date` igual a **hoy en `timeZone`** (sin `timeZone`, la del navegador, aviso I1). Se calcula **en `onMounted`** y al volver la página a primer plano (`visibilitychange` a `visible`); **nunca con un temporizador** mientras se lee (2.2.2: nada cambia solo en paralelo al contenido) y **nunca en el servidor** (SSR sin marca: la hora del servidor no es la del lugar ni la del viajero).
2. **Qué marca:** la parada cuyo intervalo `[time, end ?? siguiente time)` contiene la hora local del lugar es **«ahora»**; la siguiente, **«siguiente»**. Antes de la primera: solo «siguiente» en la primera. Después de la última: nada.
3. **Cómo:** el elemento de la parada lleva **`aria-current="time"`** (ARIA: el elemento que representa la hora actual) y una insignia con texto (`labels.now` / `labels.next`; `GCard badge` en 01 y 02, una celda de texto en 03), nunca solo color. **No se anuncia** (sin región viva: lo que cambia es consecuencia de abrir la página).
4. **No mueve nada:** no desplaza la página hasta la parada ni abre su día (02): la persona decide. El cambio de marca no cambia el alto de nada (la insignia existe en el diseño de la tarjeta; coco lo mide).

## Variantes

| Variante | Concepto | Compone | Ignora |
| --- | --- | --- | --- |
| **01 · Lista con hora** | Las paradas en orden, cada una con su hora delante | `GSection` › por día (si hay más de uno, `GSection` anidada con `label`; con uno, directo) › `GStack as="ol" gap="sm"` › `GCard as="li" level="flat" orientation="auto" mediaPosition="start"` (slot `eyebrow` = `<time>` de la parada (y `end`), `title`, `description`, `media`, `badge` del «ahora») + `GText` con `place` | — |
| **02 · Por días** | Un día por elemento de un acordeón: el nombre del día y su primera parada asoman | `GSection` › `GAccordion` (`headingLevel` un nivel por debajo; `arrows`) › `GAccordionItem` por día (`id` = `day.id`, `title` = `label`, `meta` = la fecha en palabras, `peek` = `summary` o «{hora} · {primera parada}») › el `ol` de 01 | — |
| **03 · Tabla** | Una tabla por día: hora, parada y lugar | `GSection` › por día una `GTable` (`caption` = `label` + fecha, `columns` hora/parada/lugar con `labels.time`/`stop`/`place`, `rows` = paradas, `responsive="auto"`) | `media`, `Stop.description` (la tabla es la vista breve; el detalle está en 01 y 02) |

**El día de hoy en 02:** el elemento del día con «ahora» **no se abre solo** (regla 4); su `meta` lleva además `labels.now` en texto para que se encuentre al recorrer los encabezados.

## Eventos

**Ninguno.** El itinerario no tiene intención que atender (los textos de las paradas son texto plano, sin enlaces).

## Slots

`stop` `{ stop, day, now, next }` (escape: cuerpo de la parada en 01 y 02).

## Qué lo hace distinto (#874)

**Dice «ahora» con la hora del lugar.** El día del recorrido, el viajero que abre la página en Monte Albán ve —y su lector oye como «hora actual»— **qué parada toca y cuál sigue**, calculado con la zona del lugar aunque su teléfono siga en la hora de Toronto. No hay temporizador que cambie la página mientras se lee ni un salto automático a la parada: se calcula al abrir y al volver a la página. Y no es un `GStepper`: un programa no se «completa», así que no hay pasos tachados ni «paso 3 de 8».

## Textos (`labels`)

| Clave | Requerido |
| --- | --- |
| `now`, `next` | Sí, con algún `date` (C5 al necesitarlo: sin ellos, solo `aria-current`) |
| `time`, `stop`, `place` | Sí, en 03 (C5) |
| `external` | — |

## Avisos propios (`[Grana GbItinerary<NN>]`)

C1 a C4, C7. Además: **I1** · un `date` sin `timeZone` (se usa la zona del navegador), **I2** · `time` que no es `HH:mm` (se pinta el texto tal cual, sin «ahora» para esa parada), **I3** · paradas fuera de orden por `time` dentro de un día (se pintan en el orden del arreglo).

## Banco (`itinerary.bank.js`)

Tour Monte Albán (`America/Mexico_City`): dos días con `date`; el primero con seis paradas (07:45 punto de encuentro, 08:30 llegada, … 13:00 comida con `end`), una con foto y `place`, una con un nombre largo sin espacios; `labels` completos. Vitest fija la hora con un reloj simulado en cuatro momentos (antes, durante, entre paradas, después) y en otra zona del navegador (`America/Toronto`).

## Verificación propia

Vitest: `ol` real (01, panel de 02) y una `GTable` por día (03); horas en `time datetime`; con el reloj simulado, `aria-current="time"` e insignias en la parada correcta **según `timeZone`**, también con el navegador en otra zona; sin marca en SSR ni sin `date`; ningún temporizador (`setInterval`/`setTimeout` periódico) tras montar; `visibilitychange` recalcula; 02 no abre el día de hoy. Chromium: 01 con la foto al lado en ancho y arriba a 320; 03 pasa a tarjetas en estrecho (`GTable responsive`); orden de encabezados sin saltos.
