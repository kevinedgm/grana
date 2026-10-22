# Contrato · Search (`GbSearch01` · `02` · `03`)

**Dueño:** lima · **Estado:** contratado (DECISIONS.md #860 a #867, 2026-10-22) · **Plan:** B1 (§4.3) · **Entrada:** `@grana/blocks/booking` · **Común:** `_comun.md` §1 a §5 y §14 a §25 · **Compone:** `GBookingBar` (`@grana/vue/booking`, `design/contracts/booking-bar.md`), `GStack`, `GText` · **Parte de bruno:** A

## Promesa

La consulta de disponibilidad de una página de sitio (estancia, mesa o recorrido) como **una frase, una barra o una frase que te acompaña al bajar**, con los mismos datos en las tres. El bloque no añade forma ni valida: elige la apariencia de `GBookingBar`, añade una nota de lo que pasa después y **reemite la intención tal cual**.

## Props

```ts
interface GbSearchProps {
  kind: BookingKind                      // 'stay' | 'table' | 'tour'
  title: string                          // el título de la consulta (GBookingBar title: es su encabezado y su nombre)
  partyRows: PartyRow[]
  query?: BookingQuery | null            // v-model:query; su `kind` debe ser el de la sección (K1)
  note?: string                          // lo que pasa después («Sin pago ahora · Te respondemos por WhatsApp»)
  min?: string; max?: string             // ISO
  disabledDates?: (iso: string, query: BookingQuery) => boolean
  disabledNights?: (iso: string, query: BookingQuery) => boolean   // solo stay
  minNights?: number; maxNights?: number // solo stay
  times?: { value: string; label?: string; disabled?: boolean | string }[] | ((date: string) => { value: string; label?: string; disabled?: boolean | string }[])   // table
  tours?: { value: string | number; label: string; description?: string; disabled?: boolean | string }[]   // tour
  quickDays?: number
  names?: { from?: string; to?: string; nights?: string; date?: string; time?: string; tour?: string; party?: string }
  pending?: boolean                      // la aplicación consulta
  disabled?: boolean
  locale?: string
  labels: { bar: GBookingBarLabels }     // paso directo, tal cual, a `labels` de GBookingBar (#761)
}
```

- **Todo va tal cual** a `GBookingBar` (mismos nombres que sus props): el bloque no renombra, no completa `labels.bar` y no avisa por lo que avisa `GBookingBar` (título, `partyRows`, `times`/`tours`, plantilla de la frase, claves). Solo añade `note` y la apariencia.
- **`query` ↔ `modelValue`:** el bloque quita `kind` al pasarla a `GBookingBar` (su modelo no lo lleva, `booking-bar.md` «Modelo») y lo **añade** al emitir `update:query`, así la consulta que guarda la aplicación es la `BookingQuery` de §16 que entienden las demás secciones. Sin `query`, `GBookingBar` guarda el estado.
- **Atributos** (`action`, `method`, `target` para el envío nativo al motor): llegan al `<form>` de `GBookingBar` por `$attrs` en las tres; `class`, `style`, `data-*` a la raíz del bloque.

## Anatomía (común)

```
GStack gap="sm" [data-gb="search-NN"]          ← raíz
├─ GBookingBar  (form role="search", h{n} con title; nivel por GSection o 2)
└─ GText size="body-sm" tone="muted" · note    ← después del formulario; sin note, no se pinta
```

Sin `GSection`: `GBookingBar` ya es una región con encabezado y nombre (`role="search"` + `aria-labelledby`); una sección alrededor repetiría el título. La nota va **después** del formulario (dentro del orden de lectura tras la acción) y **no** se liga a la acción: la descripción de la acción de `GBookingBar` es su resumen (`booking-bar.md`), y el bloque no toca su DOM.

## Variantes

| Variante | Concepto | Pasa a `GBookingBar` | Ignora |
| --- | --- | --- | --- |
| **01 · La frase** | La consulta se escribe como se dice y refluye como texto a cualquier ancho | `appearance="phrase"` y todo lo de «Props» | — |
| **02 · La barra** | Cajas en una fila; si no cabe, resumen + acción con la hoja | `appearance="bar"` y lo mismo | `quickDays` (solo la frase lo usa; no se pasa) |
| **03 · La que acompaña** | La frase, y cuando queda atrás un muelle abajo con el resumen, «Cambiar» y la acción | `appearance="phrase"` + **`dock`** | — |

**El umbral es una receta, no una variante** (#866, `_comun.md` §23): `<GbHero03>` con `<template #consult><GbSearch01 …/></template>` (o `02`). El héroe ya decide la jerarquía de sus acciones con consulta (#818). Dentro del slot, `GBookingBar` toma su nivel del contexto (sin `GSection`, `h2`).

## Eventos

| Evento | Carga | Cuándo |
| --- | --- | --- |
| `submit` | **La de `GBookingBar` tal cual** (`{ kind, …consulta, nights?, event, preventDefault(), defaultPrevented }`) | Envío válido. Síncrono: `preventDefault()` en la escucha deja el envío nativo (con `action`) sin hacer, como en `GBookingBar` |
| `update:query` | `BookingQuery` (con `kind`) | Cada cambio de la consulta |

Sin `navigate` ni `activate` (no hay enlaces propios).

## Slots

Ninguno propio salvo `note` (escape: contenido rico de la nota, dentro de la misma `GText`).

## Qué lo hace distinto (#867)

**La consulta es el hilo de toda la reserva.** La búsqueda no solo emite «buscar»: entrega un objeto `BookingQuery` con su `kind` que **el resto de secciones de Booking recibe sin transformarlo** y dice **con las mismas palabras** que el resumen de la consulta (`describeQuery`, #862): «13–15 nov · 2 noches · 2 adultos · 1 niño» aparece igual en la oferta, en el resumen, en el formulario y en la confirmación. El viajero en el teléfono reconoce lo que pidió en cada paso, y quien usa lector oye la misma frase en lugar de cuatro formatos. La nota dice **lo que pasa después** («Sin pago ahora») justo donde se duda, y en 03 la consulta **acompaña** la lectura de la página sin tapar nunca lo enfocado (muelle de `GBookingBar`, 2.4.11).

## Textos (`labels`)

| Clave | Uso | Requerido |
| --- | --- | --- |
| `bar` | `labels` de `GBookingBar`, tal cual (frase, campos, vacíos, noches, salida, resumen, acción, errores, `datePicker`…) | Sí (lo avisa `GBookingBar`, aviso 7) |

## Avisos propios (`[Grana GbSearch<NN>]`)

K1 (`query` con otro `kind` o forma inválida: se pasa `null`). Además: **S1** · 03 cuando ya hay otro `GbSearch03` montado en el documento (dos muelles de consulta; se pinta igual; en `onMounted`, contando `[data-gb="search-03"]`).

## Banco (`search.bank.js`)

`kind: 'stay'`, `title` «Consulta disponibilidad», la consulta común de `bank/booking.js`, `partyRows` (adultos 1–6, niños 0–4 con su ayuda, habitaciones con `max` dependiente), `disabledNights` con el viernes 20 de noviembre agotado, `minNights: 1`, `note`, `names` `{ from: 'checkin', to: 'checkout', party: 'guests' }`, `labels.bar` completos (con la plantilla de la frase en español); más dos juegos de prueba **solo en Vitest** con `kind: 'table'` (`times` con un turno lleno) y `kind: 'tour'` (`tours`).

## Verificación propia

Vitest: las tres pasan a `GBookingBar` lo de su columna (02 sin `quickDays`; 03 con `dock`); `update:query` lleva `kind` y `modelValue` no; `submit` es el objeto de `GBookingBar` (misma referencia de carga, con `preventDefault`); la nota es una `GText` `body-sm` `muted` después del `form`; sin `GSection` alrededor; K1 con `kind` distinto; S1 con dos 03; `action` llega al `form`. Chromium: 01 y 03 refluyen a 320 sin desbordar; 02 pasa a compacto a 390; en 03 el muelle aparece al dejar atrás la consulta y el último botón de la página no queda tapado (cola de #757); la receta del umbral (`GbHero03` + `GbSearch01`) con un solo `h1` y la consulta antes de las acciones del héroe.
