# Contrato · GBookingBar y GPartyField (consulta de reserva y campo de grupo)

**Dueño:** lima · **Estado:** contratado (DECISIONS.md #736 a #742, #744 y #745, 2026-10-21; remates #757 y #759 tras el estilo de coco; `describeQuery` exportada para los bloques de Booking, #862; enmienda de `datepicker.md` «Noches y salida» (#739); `tokens.md` §29.6 y §53; `api.md` «Paquete, entradas y tipos», «Convivencia de servicios» (`EDGE_ORDER`), «Paneles anclados», «Una activación por gesto» y «Flotantes persistentes») · **Basado en:** `design/lab/booking-bar/r01/` (kiwi, commit b32b79a: `brief.md`, `declaracion.md` con 14 decisiones de base, conceptos A/B/C, rúbrica y hallazgos B-L1 a B-L12, `index.html`, `booking.css`, `booking.js`, `verificar.mjs` 413/413 en Chromium, Firefox y WebKit) y el inventario `design/lab/marketing/r01/`
**Tags:** `g-booking-bar`, `g-party-field` · **Categoría:** marketing (consulta) y formularios (grupo) · **Paquete:** entrada propia **`@grana/vue/booking`** (#742)

**Componente complejo** (compone `GDatePicker`, `GNumberField`, `GSelect`, `GRadioGroup`, `GDialog`, `GBtn` y `GPartyField`; popovers propios; motor de estado y forma compacta medida): **coco y bruno en Opus** (regla de `CLAUDE.md`).

## Promesa

Una consulta de disponibilidad (estancia, mesa o recorrido) que **no se parte nunca**, **dice en palabras lo que vas a pedir y lo que falta**, distingue **la noche agotada del día de salida**, y **no hace la reserva**: entrega una **intención** limpia y la aplicación decide adónde va (su motor, WhatsApp, una página). Sin `fetch`.

**Forma (decisión del usuario del 2026-10-21, #736):** «Consulta: A “La frase” por defecto; la barra como apariencia; B “El muelle” opcional; C reservada.»

- **Base funcional:** `form role="search"` con nombre; campos compuestos de Grana; resumen legible; validación al enviar con foco al primero; ocultos con nombre para un envío nativo; objeto de intención en `submit`.
- **A · La frase (`appearance="phrase"`, por defecto):** la consulta se escribe como se dice: «Llego el **[lun 9 de nov]**, me quedo **[2 noches]** y somos **[2 adultos · 1 habitación]**.» Cada hueco abre su editor. Refluye como texto: no necesita forma compacta ni hoja.
- **La barra (`appearance="bar"`):** cajas en una fila; si no cabe, **resumen + acción** y los campos en una hoja.
- **B · El muelle (`dock`, opcional, combinable):** cuando la consulta queda atrás, un muelle abajo con el resumen, «Cambiar» y la acción.
- **C · El conserje: reservado** (`appearance="guided"`, «Fuera de v1»).

---

## Principios

1. **Emite intención, no reserva:** un evento `submit` con un objeto; la aplicación navega o consulta. El componente no navega salvo el envío nativo que la aplicación pide con `action`.
2. **Compone, no rehace:** fechas con `GDatePicker`, cifras con `GNumberField`, listas con `GSelect`/`GRadioGroup`, hoja con `GDialog`, grupo con `GPartyField`.
3. **No se parte** (barra): o cabe en una fila o es resumen + acción. La frase refluye como texto.
4. **El orden de la frase lo da el idioma:** la frase es una plantilla de la aplicación con marcadores.
5. **Valida al enviar**, nunca al escribir; el resumen nombra lo que falta.

## Qué lo hace distinto (#741)

Una consulta que **se escribe como se dice** y refluye como texto a cualquier ancho (A), en la que el huésped dice **cuántas noches se queda** y la salida se le devuelve en palabras («Salida el miércoles, 11 de noviembre»), que **no se parte nunca** (la barra o cabe o se vuelve un resumen que abre la hoja), que **dice lo que falta** en lugar de parecer completa, que sabe que **salir un día agotado es válido** y dormir esa noche no, cuyo contador de personas es **un campo de Grana** que sirve fuera de ella (`GPartyField`), y que, en una página larga, **te acompaña al final** (B) sin tapar nunca lo enfocado.

## Cuándo usarlo (fronteras)

| Necesito | Uso | No |
| --- | --- | --- |
| Consulta rápida de un sitio (fechas, hora, personas) | **`GBookingBar`** | Un `GForm` con cuatro campos sueltos |
| El formulario completo de reserva (datos, pago) | `GForm` (con `GPartyField` dentro) | `GBookingBar` (no es un formulario de datos) |
| Personas por tipo en cualquier formulario | **`GPartyField`** | Tres `GNumberField` sin resumen |
| La consulta en la apertura | `GHero appearance="threshold"` + slot `consult` | Una barra flotando sobre la foto |
| Precios en el calendario | Slot `day` de `GDatePicker` con `Intl.NumberFormat` de la aplicación | Un precio de Grana (ronda de moneda, #154/#745) |
| Listas largas de recorridos | `GSelect` hoy; `GCombobox` reservado | — |

## Uso

```vue
<GBookingBar
  kind="stay"
  title="Consulta disponibilidad"
  v-model="consulta"                     /* { from, to, party: { adults: 2, children: 0, rooms: 1 } } */
  :party-rows="filas"
  :disabled-nights="nocheAgotada"
  :min-nights="1"
  :names="{ from: 'checkin', to: 'checkout', party: 'guests' }"
  :labels="labels"                        /* incluye labels.phrase: 'Llego el {from}, me quedo {nights} y somos {party}.' */
  :pending="consultando"
  dock
  @submit="(q) => abrirMotor(q)"
/>

<GPartyField v-model="grupo" label="Huéspedes" name="guests" :rows="filas" :labels="{ done: 'Listo', separator: ' · ' }" />
```

---

# GBookingBar

## Anatomía

```
form.g-booking-bar.g-booking-bar--appearance-{phrase|bar}.g-booking-bar--kind-{stay|table|tour}  role="search"  aria-labelledby="{id}-title"  novalidate
├─ h{n}.g-booking-bar__title#{id}-title                ← title; nivel por GSection (sectionKey) o headingLevel
├─ input[type=hidden] × n                               ← ocultos con nombre (names), siempre
├─ (phrase) div.g-booking-bar__phrase  dir="auto"       ← un div, nunca un <p> (B-L7)
│  ├─ texto de la plantilla
│  ├─ hueco: GDatePicker (slot trigger) › button.g-booking-bar__slot   ← {from} / {date}
│  ├─ hueco: button.g-booking-bar__slot + div.g-booking-bar__slot-panel role=dialog popover=manual   ← {nights} / {time} / {tour}
│  └─ hueco: GPartyField (slot trigger) › button.g-booking-bar__slot   ← {party}
│  (phrase) p.g-booking-bar__checkout                   ← stay: «Salida el miércoles, 11 de noviembre»
│  (phrase) ul.g-booking-bar__messages                  ← errores de los huecos (uno por hueco, id propio)
├─ (bar) div.g-booking-bar__row                         ← si cabe
│  ├─ div.g-booking-bar__field × n                      ← GDatePicker range split | GDatePicker | GSelect · GPartyField
│  └─ GBtn.g-booking-bar__submit type=submit aria-describedby="{id}-digest"
├─ (bar) div.g-booking-bar__compact                     ← si no cabe
│  ├─ button.g-booking-bar__summary aria-haspopup=dialog aria-expanded   ← «Tu consulta · 13–15 nov · 2 noches · 2 adultos» + «Cambiar»
│  └─ GBtn.g-booking-bar__submit
├─ (phrase) GBtn.g-booking-bar__submit
├─ p.g-booking-bar__digest#{id}-digest                  ← resumen (visible en la barra en fila; oculto accesible en phrase y compacto)
├─ GDialog.g-booking-bar__sheet                         ← barra compacta y muelle: los mismos campos en línea (dentro del form, sin Teleport)
└─ (dock) div.g-booking-bar__dock  hidden inert         ← B: resumen + «Cambiar» + acción
```

## Props (#737)

| Prop | Tipo | Valores | Default | Origen |
| --- | --- | --- | --- | --- |
| `kind` | String | `stay` `table` `tour` | `stay` | propia |
| `modelValue` | Object \| null | la consulta (ver «Modelo») | `null` (estado interno) | compartida |
| `appearance` | String | `phrase` `bar` | `phrase` | compartida (`appearance`; `guided` reservado) |
| `dock` | Boolean | | `false` | propia (B) |
| `title` | String | texto | — (**obligatoria**; aviso 1) | propia |
| `headingLevel` | Number | `2` `3` `4` | por `GSection` (`sectionKey`) o `2` | propia |
| `partyRows` | Array | filas de `GPartyField` | — (**obligatoria**; aviso 2) | propia |
| `min`, `max` | String | ISO | sin valor | propia (`GDatePicker`) |
| `disabledDates` | Function | `(iso, query) => boolean` | sin valor | propia (`GDatePicker`, con la consulta) |
| `disabledNights` | Function | `(iso, query) => boolean` (solo `stay`) | sin valor | propia (enmienda #739) |
| `minNights` | Number | entero ≥ 1 | `1` | propia (solo `stay`) |
| `maxNights` | Number | entero ≥ `minNights` | sin valor | propia (solo `stay`) |
| `times` | Array \| Function | `[{ value: 'HH:mm', label?, disabled? }]` o `(date) => Array` | — (**obligatoria con `table`**; aviso 3) | propia |
| `tours` | Array | `[{ value, label, description?, disabled? }]` | — (**obligatoria con `tour`**; aviso 3) | propia |
| `quickDays` | Number | entero ≥ 0 | `0` | propia (días rápidos del hueco de fecha en `phrase`) |
| `names` | Object | `{ from?, to?, nights?, date?, time?, tour?, party? }` | `{}` | propia (B-L4) |
| `pending` | Boolean | | `false` | propia (la aplicación consulta) |
| `disabled` | Boolean | | `false` | compartida |
| `locale` | String | BCP 47 | `lang` del ancestro (como `GNumberField`) | compartida |
| `labels` | Object | ver «Textos» | `{}` | compartida (sin valores por defecto, #226) |
| `id` | String | | generado | propia |

### Reglas de props

- **`kind`:** fija los campos y la forma de la consulta: `stay` = llegada + salida (o noches en la frase) + grupo; `table` = fecha + turno + grupo; `tour` = recorrido + fecha + grupo.
- **`appearance="bar"`:** forma compacta medida (§«No se parte»). **`phrase`:** sin forma compacta ni hoja (refluye); con `dock`, el «Cambiar» del muelle abre la hoja igualmente.
- **`disabledDates(iso, query)`:** recibe la consulta para depender de otro dato (los días que sale un recorrido). **`disabledNights`:** la noche que empieza el día `iso` está agotada (enmienda de `GDatePicker`, #739).
- **`times`:** turnos discretos (los restaurantes trabajan por turnos y **lo lleno debe verse**, no descubrirse); `disabled` Boolean o String (motivo visible, p. ej. «lleno»; con `true`, el sufijo es `labels.full`). Con Function, se llama con la fecha elegida. **Sin `GTimeField` en v1** (#737): un turno libre escrito a mano queda reservado (`times` ausente con `table`).
- **`quickDays`:** en `phrase`, el hueco de fecha ofrece primero `n` días desde hoy (o `min`) como opciones de `GRadioGroup appearance="chip"` con su nombre de `Intl.RelativeTimeFormat` («hoy», «mañana») y de `Intl.DateTimeFormat` para los demás, más «Otro día» (`labels.otherDay`) que abre el calendario. Respeta `min`, `max` y `disabledDates`. La receta del restaurante usa 7.
- **`names`:** nombre de cada oculto (`name` = `names[clave] ?? clave`); el grupo pinta uno por fila como `{names.party ?? 'party'}[{key}]`. Los ocultos existen **siempre** (fila, compacto y frase).
- **`pending`:** la acción pasa a `GBtn loading` con `loadingText` = `labels.pending` (región viva de `GBtn`, #14). No bloquea la edición.
- **`disabled`:** todo deshabilitado (campos, huecos, acción, muelle).
- **Resto de atributos** (`action`, `method`, `target`, `class`, `data-*`): al `<form>`.

## Modelo (`v-model`, B-L4)

| `kind` | Forma | Notas |
| --- | --- | --- |
| `stay` | `{ from, to, party }` | `from`/`to` ISO sin zona o `null`; `party` el objeto de `GPartyField` (claves de `partyRows`) |
| `table` | `{ date, time, party }` | `time` = `value` del turno |
| `tour` | `{ tour, date, party }` | `tour` = `value` del recorrido |

- Sin `v-model`, el estado es interno y arranca con `null` en todo salvo `party`, que arranca con el `default` (o `min`) de cada fila.
- **Las noches no se guardan:** se derivan (`to − from`). En la frase, cambiar las noches escribe `to`.
- Un valor con forma inválida se trata como vacío y avisa una vez (aviso 4).
- **Las fechas que viajan a las ofertas** (B: «Reservar Suite Jardín · 9–11 nov») las arma la aplicación con este `v-model`.

## Envío e intención (B-L4)

1. Al enviar (acción, Intro en un campo de texto, acción del muelle o de la hoja), el componente **valida** (§«Validación»). Si falta algo, no hay `submit`: errores, foco y anuncio.
2. Válido: emite **`submit`** con `{ kind, ...consulta, nights (solo stay), event, preventDefault(), defaultPrevented }` (síncrono, en el gesto). Fechas ISO sin zona.
3. **Envío nativo** (GET al motor sin JS de la aplicación): solo si el `<form>` tiene `action` **y** la aplicación no llamó a `preventDefault()`. Sin `action`, el componente cancela siempre el envío nativo (no recarga la página).
4. La aplicación pone `pending` mientras consulta; navegar, abrir WhatsApp o pintar resultados es suyo.

## Validación (WCAG 3.3.1, 3.3.3, 4.1.3)

- **Al enviar, nunca al escribir.** Cada campo que falta o no vale recibe su mensaje con el qué hacer (`labels.errors.*`), `aria-invalid` y el foco va **al primero** (si es un grupo de radios, a su opción elegida o a la primera).
- En la barra compacta, enviar incompleto **abre la hoja** con los errores y el foco en el primero.
- Anuncio cortés por el canal de página (`announcePage`, #533; trasladado al modal): `labels.missing` (contado: `{count}` y `{list}`).
- **Sin `GErrorSummary`** (con dos o tres campos a la vista, duplicaría el mensaje junto al campo).
- **Noche agotada dentro de la estancia** (stay): error con la fecha, `labels.errors.night` con `{date}` en palabras («No quedan habitaciones la noche del viernes, 6 de noviembre»). **Salir un día agotado es válido** (esa noche no se duerme).
- Menos noches que `minNights` o más que `maxNights`: `labels.errors.nights`.
- La consulta **se aísla** de un `GForm` exterior (`provide(formKey, null)`, como `GDialog`, #566); un `GBookingBar` dentro de otro `<form>` avisa (aviso 5: formularios anidados).

## Resumen (`__digest`)

Texto legible de lo que se va a pedir, unido por `labels.separator`: `stay` «13–15 nov · 2 noches · 2 adultos · 1 habitación» (fechas con `Intl.DateTimeFormat(locale).formatRange`, noches con `labels.nights`, grupo con el resumen de `GPartyField`); `table` «Hoy · 20:30 · 2 personas»; `tour` «Monte Albán · sáb 7 nov · 2 adultos». **Con huecos, nombra lo que falta** (`labels.noDates`, `labels.noTime`, `labels.noTour`): «Sin fechas · 2 adultos · 1 habitación». Es la descripción de la acción (`aria-describedby`); visible en la barra en fila, oculto accesible en la frase (la frase ya lo dice) y en compacto (el resumen es el botón).

## A · La frase (por defecto)

- **Plantilla** `labels.phrase` (String) con marcadores por `kind`: `stay` `{from}` `{nights}` `{party}`; `table` `{party}` `{date}` `{time}`; `tour` `{tour}` `{date}` `{party}`. El texto entre marcadores se pinta tal cual; cada marcador es un hueco. **Si falta un marcador del `kind` o la plantilla no existe**, la frase no se pinta: el componente se pinta como `bar` y avisa (aviso 6). Un marcador desconocido se pinta literal y avisa.
- **Contenedor `div.g-booking-bar__phrase`, nunca `<p>`** (B-L7): dentro van los huecos de `GDatePicker` y `GPartyField`, cuyos paneles son bloques.
- **Hueco** = `button.g-booking-bar__slot` (`type="button"`, `aria-haspopup="dialog"`, `aria-expanded`, `aria-controls`): nombre = rótulo oculto (`labels.fields.*`, patrón de texto oculto) + texto visible (valor o `labels.empty.*`, «¿qué día?»), por `aria-labelledby`, así el nombre contiene lo que se ve (2.5.3). Valor con `dir="auto"`. Con error, `aria-invalid` y `aria-describedby` a su mensaje en `__messages`.
- **Vacío y lleno se distinguen por forma** (subrayado discontinuo frente a continuo; con error, continuo `danger-text`), no solo por color (1.4.1): encargo a coco. Alto táctil de 44 px con `pointer: coarse` en mitad de una línea (coco mide el interlineado).
- **Editores:**
  - `{from}` / `{date}`: `GDatePicker` en `single` con el **slot `trigger`** (el hueco es su botón). En `stay`, una llegada cuya noche está agotada no es elegible (se le pasa `disabledDates` ∪ noche agotada). Con `quickDays`, el panel propio del hueco con los días rápidos y «Otro día».
  - `{nights}`: panel propio con un `GNumberField steppers` (`min` = `minNights`, `max` = el menor de `maxNights` y las noches libres seguidas desde la llegada; `decrementLabel`/`incrementLabel` de `labels`) y, debajo, la salida en palabras (`labels.checkout` con `{date}`). Cambiar la llegada **no recorta** las noches en silencio: si ya no caben, error al enviar.
  - `{time}`: panel propio con `GRadioGroup appearance="chip"` de `times` (los llenos deshabilitados con el sufijo de texto, no solo el color).
  - `{tour}`: panel propio con `GRadioGroup appearance="list"` de `tours`.
  - `{party}`: `GPartyField` con el **slot `trigger`**.
- **Panel propio del hueco** (`div.g-booking-bar__slot-panel`, `role="dialog"`, `aria-label` = el rótulo, `popover="manual"`): las mismas reglas que el panel de `GPartyField` (§«Panel»): capa superior, colocado por el hueco con las reglas 1 a 3 de «Paneles anclados» (#358), foco al primer control al abrir, Esc cierra y devuelve el foco, Tab fuera o tocar fuera cierra sin robar el foco, tocar su fondo no cierra. Elegir una opción de radio **no cierra** (las flechas cambian la opción; cerrar es Esc, Tab o «Listo» `labels.done`).
- **`p.g-booking-bar__checkout`** (stay): «Salida el {date}», visible bajo la frase cuando hay llegada y noches.
- **Sin forma compacta ni hoja:** la frase se parte en líneas a 320 px y con zoom 400 % (medido).

## La barra (`appearance="bar"`)

- **Campos:** `stay` = `GDatePicker mode="range" split` (con `labelStart`/`labelEnd` = `labels.fields.from`/`to`, `disabledNights`, `minNights`, `maxNights`) + `GPartyField`; `table` = `GDatePicker` + `GSelect` de `times` + `GPartyField`; `tour` = `GSelect` de `tours` + `GDatePicker` + `GPartyField`. Etiqueta visible por campo; sin etiqueta de grupo apilada sobre «Llegada/Salida».
- **No se parte (B-L11):** la fila se mide (desborda su caja) y, si no cabe, pasa a **compacto**: `button.g-booking-bar__summary` («{summaryTitle} · {resumen}» + «{change}») + la acción. **Con histéresis:** guarda el ancho que la fila necesitaba para volver a ella. **Sin puntos de corte literales** (#34). **El cambio se aplica fuera de la llamada del `ResizeObserver`** (en el cuadro siguiente; en WebKit, cambiar la forma dentro produce «ResizeObserver loop»). SSR y antes de medir: la fila.
- **Hoja** (`GDialog`, dentro del `<form>`, sin Teleport; `title` = `title`, `closeLabel` = `labels.close`): los mismos campos **en línea** (`GDatePicker inline` con un mes, `GPartyField mode="inline"`): en un modal no se abre otro popover (regla de `datepicker.md`). Pie: la acción de envío (es un `type="submit"` del mismo formulario). Esc cierra y el foco vuelve al resumen (`from` de `GDialog`).

## `describeQuery`: el resumen como utilidad pública (#862; enmienda, cambia la v1)

El texto de `__digest` (§«Resumen») se **extrae** a una utilidad pura y se exporta desde **`@grana/vue/booking`**, para que los bloques de Booking (`design/contracts/blocks/_comun.md` §15 regla 3) digan la consulta **con las mismas palabras** que la barra sin rehacer el formato. `GBookingBar` la usa por dentro: el resumen, el texto del compacto y el del muelle salen de ella.

```ts
describeQuery(query: { kind: 'stay' | 'table' | 'tour', from?, to?, date?, time?, tour?, party }, options: {
  partyRows: PartyRow[]                       // las filas de GPartyField (su `unit` da las piezas del grupo)
  times?: { value: string, label?: string }[] // table: etiqueta del turno
  tours?: { value: string | number, label: string }[]   // tour: nombre del recorrido
  locale?: string                             // BCP 47; sin él, el de Intl del entorno (no lee el DOM)
  labels: { nights, separator, checkout?, noDates?, noDate?, noTime?, noTour? }   // las claves de «Textos» con el mismo significado
}): { text: string, checkout: string, nights: number | null, missing: ('dates' | 'date' | 'time' | 'tour')[] }
```

- **`text`** es exactamente lo que hoy pinta `__digest` con esos datos (misma regla: rango con `formatRange`, noches contadas, grupo con el resumen de `GPartyField`, lo que falta con `no*`, unido por `separator`). **`checkout`** es «Salida el {date}» (`stay` completo; vacío si no). **`missing`** nombra lo que falta en orden.
- **Pura:** sin DOM, sin `window`, sin estado salvo la caché de `Intl` que ya usa el componente; funciona en SSR. Nunca lanza: una consulta con forma inválida devuelve `text` con lo que falta.
- **`labels` que falten:** sin aviso propio (la utilidad es silenciosa); la pieza sin texto se omite. Los avisos siguen siendo de `GBookingBar` (aviso 7) y de los bloques (K2).
- **Peso:** dentro del tope de `@grana/vue/booking` (14 KiB, #742); es código que ya está en la entrada, extraído (`utils/bookingQuery.js`, interno; no entra en el principal). Tipos en `types/api/booking.d.ts` (función) y `PartyRow`, `BookingQueryModel` en `types/shared.d.ts` (#443: el `.d.ts` de la entrada declara la exportación nueva; `src/types.test.js` la comprueba).
- **Verificación (bruno):** para los tres `kind`, con y sin huecos, `describeQuery(...).text === ` el texto de `__digest` del componente montado con la misma consulta y los mismos `labels`; SSR en Node; sin regresión en las pruebas de `GBookingBar`.

## B · El muelle (`dock`)

- **Cuándo:** aparece cuando **la consulta entera** sale del visor por arriba (`IntersectionObserver`, sin manejador de desplazamiento) y se va al volver a verla. Oculto: `hidden` + `inert`. Aparece y se va **sin robar el foco ni anunciarse** (consecuencia del desplazamiento del usuario).
- **Contenido:** el resumen (una línea; el texto completo sigue en la descripción de la acción), «Cambiar» (`labels.change`, abre la hoja de la misma consulta; al cerrar, el foco vuelve a «Cambiar») y la acción (la misma intención). Sin rol de punto de referencia (duplicaría el de búsqueda).
- **Alto de contrato:** **`max(var(--g-space-16), 44px + var(--g-space-1) * 4)`** (64 px con `space` 4; `block-size` fijo con el borde). Cambiarlo es decisión de lima (lo suma el `scroll-padding`).
- **Bordes compartidos (B-L10):** cliente de `utils/edgeReserve.js` con **`EDGE_ORDER.bookingDock = 20`** (`api.md` «Convivencia de servicios»): publica abajo su alto mientras se ve y lee `before` (queda encima del navbar de `GAppShell`); el FAB (25) y los avisos quedan encima de él; la isla es de arriba. No se traslada a un `<dialog>`; con un modal abierto queda inerte.
- **No tapa lo enfocado (2.4.11; tercera salida de `api.md` «Flotantes persistentes»):** mientras se ve, la capa de Grana escribe en `<html>` (`:root:has(.g-booking-bar__dock.is-shown)`) `scroll-padding-block-end` = el alto de contrato (más `--g-sidebar-bar` si hay un navbar de `GSidebar`). Si la aplicación pone su propio `scroll-padding-block-end` sin capa, gana y debe sumar el alto del muelle (receta del README). Medido por kiwi con el último botón de la página.
- **Cola del documento (#757, B-C1 de coco):** el `scroll-padding` no desplaza más allá del final del documento, así que el **último** control de una página sin sitio al final quedaba bajo el muelle (medido por coco en los tres motores). Mientras el muelle se ve, la misma regla de la capa de Grana añade al final del documento una **cola** del alto que el muelle tapa: `:root::after` con `content: ""`, `display: block` y `block-size` = el alto de contrato **+ `env(safe-area-inset-bottom)`** sin navbar, o **solo el alto de contrato** con el navbar de `GSidebar` (el chasis o la aplicación ya reservan la barra y el área segura, `app-shell.md` #749). Se elige `::after` y no `padding-block-end` en `<html>` porque los reinicios habituales sin capa (`* { padding: 0 }`, el preflight de Tailwind) borrarían el relleno sin aviso; ninguno da alto a un `::after`. No mueve nada visible (la cola va detrás de todo y no cambia `scrollTop`); al ocultarse el muelle desaparece sin salto (el muelle se va porque la consulta vuelve a verse, lejos del final). No se pone con el muelle dentro de un `<dialog>` (como el `scroll-padding`). **Límites (README):** una aplicación que use su propio `:root::after`, o cuyo desplazamiento no sea el del documento (un `body` o un contenedor con `overflow: auto`), debe dejar ella el alto del muelle al final de lo que se desplaza.
- **Presupuesto del cuarto** (como #713): si el muelle más las reservas de abajo que lee pasan del 25 % del alto del visor (`innerHeight`, al montar y al redimensionar), **no aparece**. Constante `4` de §29.6.
- **Movimiento:** entra desde abajo con `translate` + opacidad, `--g-duration-slow` + `--g-ease-out`; sale con `--g-duration-press`; reducido: solo fundido (`--g-duration-fast`). **Sin `--g-ease-spring`** (el muelle de `GPageHeader` lo lleva por decisión del usuario, #635; extenderlo aquí sería un uso nuevo de §29.1).

## Teclado y ARIA

| Pieza | Teclado | ARIA |
| --- | --- | --- |
| Consulta | Tab recorre huecos o campos y la acción | `form role="search"` + `aria-labelledby`; acción `aria-describedby` → resumen |
| Hueco | Intro/Espacio abre; Esc cierra y vuelve | `aria-haspopup="dialog"`, `aria-expanded`, `aria-controls`, nombre = rótulo + valor |
| Resumen compacto / «Cambiar» | Intro abre la hoja | `aria-haspopup="dialog"`, `aria-expanded` |
| Hoja | Foco atrapado; Esc cierra; foco vuelve | `GDialog` |

**Una activación por gesto** (#661) en huecos, resumen y «Cambiar»: el doble clic o Intro mantenido no abren y cierran.

## Estados

| Estado | Qué se ve | Cómo se oye |
| --- | --- | --- |
| Vacío | Huecos con «¿qué día?», grupo con su valor por defecto | Resumen «Sin fechas · 2 adultos · 1 habitación» |
| Parcial | Lo elegido | El resumen nombra lo que falta |
| Inválido | `aria-invalid`, mensaje, foco al primero | Anuncio `labels.missing` |
| Enviando | `GBtn loading` + `labels.pending` | Región viva de `GBtn` |
| Deshabilitado | Todo `disabled` | — |
| Compacto (barra) | Resumen + acción | El resumen es el botón |
| Muelle visible | Banda abajo | Sin anuncio |

## Textos (`labels`)

Marcadores con `fill`; cifras con `Intl.NumberFormat(locale)`, fechas con `Intl.DateTimeFormat(locale)`. Contados: String con marcador o Function. Sin valores por defecto (#226): falta una clave → aviso 7 la primera vez.

| Clave | Uso |
| --- | --- |
| `phrase` | Plantilla de la frase (A) |
| `fields.{from\|to\|nights\|date\|time\|tour\|party}` | Etiquetas de campo y rótulos ocultos de los huecos |
| `empty.{from\|nights\|date\|time\|tour}` | Texto del hueco vacío («¿qué día?») |
| `nights` | «{count} noches» (contado) |
| `checkout` | «Salida el {date}» |
| `noDates`, `noDate`, `noTime`, `noTour` | Lo que falta en el resumen |
| `separator` | Unión de las piezas del resumen (Grana no añade puntuación) |
| `summaryTitle`, `change` | «Tu consulta», «Cambiar» |
| `submit`, `pending` | Acción y su `loadingText` |
| `close`, `done`, `otherDay`, `full` | Cierre de la hoja, «Listo» de los paneles, «Otro día», sufijo de un turno lleno |
| `decrement`, `increment` | Nombres de −/+ del contador de noches |
| `errors.{dates\|night\|nights\|date\|time\|tour}` | Mensajes (`night` con `{date}`) |
| `missing` | Anuncio al enviar incompleto (`{count}`, `{list}`; contado) |
| `datePicker` | **Paso directo (#761):** objeto con los `labels` de `GDatePicker` (`datepicker.md` «Textos»: `prev`, `next`, `dialog`, `today`, `rangeSingle`…), que la barra pasa tal cual a **cada** `GDatePicker` interno (frase, campos y hoja). Grana no los traduce ni los completa; el aviso 7 de `GDatePicker` (clave requerida ausente) sale con su propio prefijo. La barra no avisa por ellos |

## Avisos de desarrollo (`[Grana GBookingBar]`, una vez por instancia y motivo; guarda de #653)

1. Sin `title`.
2. Sin `partyRows`.
3. `kind="table"` sin `times`, o `kind="tour"` sin `tours`.
4. `modelValue` con forma inválida para el `kind`.
5. Dentro de otro `<form>` (formularios anidados).
6. `phrase` sin `labels.phrase` o sin un marcador obligatorio del `kind` (se pinta como `bar`); marcador desconocido.
7. Falta una clave de `labels` al necesitarla.
8. `disabledNights`, `minNights` o `maxNights` con un `kind` distinto de `stay`.
9. `appearance="guided"` (reservado; se pinta como `phrase`).

---

# GPartyField (#738)

Primitiva de formulario: **personas por tipo** (adultos, niños, habitaciones; claves de la aplicación) con un resumen en el disparador y un panel de contadores. Sirve en la consulta, en el formulario completo de reserva, en una cotización. **Compone `GNumberField steppers`** por fila: no inventa un contador.

## Anatomía

```
div.g-party-field.g-party-field--mode-{popover|inline}[.g-party-field--size-* …]
├─ span.g-party-field__label#{id}-label              ← label (o slot label)
├─ button.g-party-field__trigger#{id}  aria-haspopup=dialog aria-expanded aria-controls="{id}-panel"
│      aria-labelledby="{id}-label {id}-value"        ← popover; o el slot trigger
│  └─ span.g-party-field__value#{id}-value dir=auto  «2 adultos · 1 niño · 1 habitación»
├─ div.g-party-field__panel#{id}-panel role=dialog aria-labelledby="{id}-label" popover=manual   ← popover
│  ├─ div.g-party-field__rows > GNumberField steppers × filas (label + hint + min/max)
│  └─ GBtn.g-party-field__done                        ← labels.done
├─ (inline) div.g-party-field__rows role=group aria-labelledby="{id}-label"   ← filas a la vista, sin disparador
├─ div.g-party-field__support > ayuda + p.g-party-field__message   ← como GInput (#164, #176)
└─ input[type=hidden] name="{name}[{key}]" × filas
```

## Props

| Prop | Tipo | Valores | Default | Origen |
| --- | --- | --- | --- | --- |
| `modelValue` | Object | `{ [key]: Number }` | `{}` (se completa con `default`/`min` de cada fila) | compartida |
| `rows` | Array | ver «Filas» | — (**obligatoria**; aviso 1) | propia |
| `mode` | String | `popover` `inline` | `popover` | propia |
| `label` | String | texto | — (obligatoria salvo `aria-label`/`aria-labelledby` o slot `trigger`; aviso 2) | propia (campo) |
| `hint`, `error`, `warning`, `valid` | String | texto | sin valor | propia (campo, #164) |
| `name` | String | | sin valor | propia (campo) |
| `disabled`, `readonly` | Boolean | | `false` | compartida |
| `size`, `variant`, `density`, `rounded`, `block` | | los de `GSelect` (`variant` `outline` `soft`) | los de `GSelect` | compartida (el disparador es una caja de campo) |
| `labels` | Object | `{ done, separator }` | `{}` | compartida (sin valores por defecto) |
| `locale` | String | BCP 47 | `lang` del ancestro | compartida |
| `id` | String | | generado | propia |

### Filas

| Campo | Tipo | Regla |
| --- | --- | --- |
| `key` | String | Clave en el modelo y en el oculto (obligatoria, única) |
| `label` | String | Etiqueta del contador (obligatoria) |
| `hint` | String | Ayuda («De 0 a 12 años», «Hasta una por adulto») |
| `min` | Number | Por defecto `0` |
| `max` | Number \| Function | Número o `(value) => Number` (depende de otra fila: habitaciones ≤ adultos) |
| `default` | Number | Valor inicial (por defecto `min`) |
| `unit` | String \| Function | Pieza del resumen: String con `{count}` o `(count) => String` («2 adultos») |
| `decrementLabel`, `incrementLabel` | String | Nombres de −/+ (obligatorios: `GNumberField` no pinta los pasos sin ellos) |

## Reglas

- **Resumen** (`__value`): las piezas `unit` de las filas con valor > 0 (y siempre la primera), unidas por `labels.separator`, con `dir="auto"`. Es el texto del disparador y del slot `trigger` (`text`).
- **Reglas del grupo a la vista:** si el `max` de una fila (Function) baja por debajo de su valor (quitar un adulto con tres habitaciones), el valor **se corrige** al nuevo máximo y se emite; la ayuda de la fila dice la regla. `min` de adultos 1 lo pone la aplicación en sus filas.
- **`mode="popover"`:** disparador + panel. **`inline`:** las filas a la vista en un `role="group"` (hoja, conserje, formulario completo).
- **Slot `trigger`** (como `GDatePicker`, `{ id, expanded, controls, toggle, open, close, value, text }`): sustituye al disparador (la frase de A); con él no se pintan `label`, `hint` ni el mensaje (los pone la aplicación); la aplicación pone `aria-haspopup`, `aria-expanded`, `aria-controls` y el nombre. Raíz con slot `trigger`: `g-party-field--trigger` (coco: `display: contents`, B-L7).
- **Contexto de formulario** (`useFormField`): dentro de `GForm` hereda `density`, `readonly`, `disabled`, `block`, su error por `name` y se registra (`control` = el disparador; en `inline`, el primer contador); publica su mínimo intrínseco a `GFormRow` (`setIntrinsicMin`, #271).
- **Ocultos:** con `name`, uno por fila `{name}[{key}]` (también con `disabled`, como `GDatePicker`).
- **Solo lectura:** el disparador es enfocable y no abre (aspecto único de #165); en `inline`, los contadores en solo lectura.
- **Reservado:** `childAges` (la edad de cada niño, que piden muchos motores).

## Panel (popover)

- **Capa superior** (`popover="manual"`), colocado respecto al disparador con las reglas **1 a 3** de «Paneles anclados» (#358; la 4 no aplica: no hay lista): dentro del visor con margen de `space × 2`, arriba si abajo no cabe, nunca recortado por un contenedor. Sin hoja móvil.
- **Abrir** (clic, Intro, Espacio) lleva el foco al primer contador. **Esc** cierra y devuelve el foco al disparador. **Salir con Tab** o **tocar fuera** cierra **sin robar el foco**. Tocar el fondo del panel no lo cierra. «Listo» (`labels.done`) cierra y devuelve el foco. **El cierre por Tab no depende solo de `relatedTarget`** (en WebKit el Tab salta los botones y el foco puede irse al navegador): se comprueba dónde quedó el foco tras el evento.
- **Una activación por gesto** (#661) en el disparador.
- **Dentro de un `GDialog`** se usa `inline` (regla de `datepicker.md`: en un modal no se abre otro popover); un `popover` dentro de un `<dialog>` avisa (aviso 4).

## Avisos (`[Grana GPartyField]`)

1. Sin `rows` o fila sin `key`/`label`, o `key` repetida.
2. Sin nombre accesible.
3. Fila sin `decrementLabel`/`incrementLabel`; falta `labels.done` (popover) o `labels.separator`.
4. `mode="popover"` dentro de un `<dialog>`.
5. Valor fuera de `[min, max]` en el modelo (se muestra tal cual; la aplicación valida).

---

## Tokens consumidos (`tokens.md` §53; ninguno nuevo)

Los de los campos que componen (no los relee) y, en lo propio (lista exacta de `GBookingBar.css` y `GPartyField.css` de coco, 6945cda; completada en #759):

- **`GBookingBar`:** `--g-color-surface` (panel, muelle), `--g-color-text`, `--g-color-text-muted` (resumen, salida), `--g-color-text-subtle` (valor del hueco vacío deshabilitado, resumen deshabilitado), `--g-color-border`, `--g-color-border-strong` (borde del muelle), `--g-color-border-control` (huecos, resumen compacto), `--g-color-danger-text` (hueco con error), `--g-color-focus`, `--g-focus-width`, `--g-focus-offset`, `--g-border-width`, `--g-radius-*` (`xs` `md` `lg`), `--g-shadow-2` (paneles), `--g-shadow-3` (muelle), `--g-text-title-size`, `--g-text-title-line`, `--g-text-title-weight`, `--g-text-title-tracking` (la frase), `--g-text-title-sm-weight` (título y texto del resumen, resumen del muelle), `--g-text-body-*`, `--g-text-body-sm-*`, `--g-text-caption-*`, `--g-text-action-weight`, `--g-font-ui`, `--g-space-*`, `--g-sidebar-bar` (reserva del navbar en el `scroll-padding`), `--g-duration-fast`, `--g-duration-press`, `--g-duration-slow`, `--g-ease-out`, `--g-ease-standard` (cambios de color).
- **`GPartyField`** (es una caja de campo como `GSelect` y lee lo mismo que ella): `--g-color-surface`, `--g-color-surface-sunken` (`soft` y deshabilitado), `--g-color-text`, `--g-color-text-muted`, `--g-color-text-subtle`, `--g-color-neutral-soft` (solo lectura), `--g-color-border`, `--g-color-border-strong`, `--g-color-border-control`, `--g-color-danger-text`, `--g-color-warning-text`, `--g-color-success-text` (mensajes), `--g-color-focus`, `--g-focus-width`, `--g-border-width`, `--g-radius-*`, `--g-shadow-2` (panel), `--g-text-body-*`, `--g-text-body-sm-*`, `--g-text-caption-*`, `--g-text-action-weight`, `--g-font-ui`, `--g-space-*`, `--g-duration-fast`, `--g-duration-press`, `--g-duration-slow`, `--g-ease-out`, `--g-ease-standard`.

Sin muelle ni rebote propios.

## Clases y datos (contrato bruno ↔ coco)

| Clase / dato | Dónde | Cuándo |
| --- | --- | --- |
| `g-booking-bar`, `--appearance-{phrase\|bar}`, `--kind-{stay\|table\|tour}`, `is-compact`, `is-disabled` | Raíz | Según props y medida |
| `__title`, `__phrase`, `__slot`, `__slot-label`, `__slot-value`, `__slot-panel`, `is-empty`, `is-filled`, `is-invalid` (hueco), `__checkout`, `__messages` | A | `phrase` |
| `__row`, `__field`, `__compact`, `__summary`, `__submit`, `__digest`, `__sheet` | Barra | `bar` |
| `__summary-title` («Tu consulta», `labels.summaryTitle`), `__summary-text` (el resumen), `__summary-change` («Cambiar», `labels.change`): tres `span` dentro de `button.__summary` | Compacto | `bar` compacta (#759) |
| `__dock`, `is-shown`, `__dock-summary`, `__dock-change` | B | `dock` |
| `--_reserve` (px, reserva leída de su borde inferior con `edgeReserve`, en `div.__dock`) | B | Mientras se ve (#759; §29.5) |
| `g-party-field`, `--mode-{popover\|inline}`, `--trigger`, `--size-*`, `--variant-*`, `--density-*`, `--rounded-*`, `--block`, `is-open`, `is-invalid`, `is-warning`, `is-valid`, `is-readonly`, `is-disabled`, `is-rejected` (sacudida al rechazar, como `GSelect`) | Raíz del campo | Según props |
| `__label`, `__trigger`, `__value`, `__arrow` (`GLibIcon` `chevron-down`), `__panel`, `__rows`, `__done`, `__support`, `__hint`, `__message`, `__message-icon`, `__message-type` | Campo | Según modo (el pie como `GSelect`) |
| `--_x`, `--_y`, `--_max`, `data-side` | Paneles (hueco y grupo) | Colocación (#358; §29.5) |

**Construcción (coco, estilo.md):** el hueco es `button.__slot` con **siempre** `is-empty` o `is-filled` (uno de los dos) e `is-invalid` con error, con `span.__slot-label` (oculto) y `span.__slot-value` dentro y, opcional, un chevron `GLibIcon` hijo directo. Los campos de la barra van con `block` dentro de `div.__field` y la acción es un `GBtn` del mismo `size` que los campos. El muelle pasa de `hidden` + `inert` a `is-shown` (y al revés) **en el mismo cuadro** (el CSS anima la salida con `display` discreto). El disparador de `GPartyField` lleva un icono `users` y `__arrow`; los contadores del panel, `block`.

## Peso y paquete (#742)

- **Entrada propia `@grana/vue/booking`** (global UMD `GranaBooking`): exporta `GBookingBar`, `GPartyField`, **`describeQuery`** (#862) y un plugin que registra los dos. **Tope: 14 KiB (14 336 B) gzip.** Llegan por `__shared` (#240, sin copias): `GDatePicker`, `GNumberField`, `GSelect`, `GRadioGroup`, `GDialog`, `GBtn`, `GLibIcon`, `useFormField` y las claves de contexto (`formKey`, `sectionKey`, la interna de la fila), `utils/anchor.js`, `utils/edgeReserve.js` (**obligatorio**: un registro por documento), `utils/topModal.js`, `utils/liveRegion.js` (`announcePage`), `utils/template.js`, `utils/dates.js`, `utils/sizeObserver.js`, `utils/oneOf.js`. **No importa `GTimeField`** (entrada propia; #737). CSS en `grana.css`.
- Cuatro registros de #443; `EDGE_ORDER.bookingDock` en `utils/edgeReserve.js` (principal); compuertas (`grep -q "g-booking-bar__phrase"` y `grep -q "g-party-field__panel"` en `grana.css`; `! grep -q "GBookingBar"` y `! grep -q "GPartyField"` en `grana.js`; `test -f dist/booking.js`).

## `meta.json` y tipos (#443)

Las dos piezas con props y valores, eventos (`update:modelValue`, `submit` con su carga; `GPartyField`: `update:modelValue`, `open`, `close`), slots (`GPartyField`: `trigger`, `label`), la forma del modelo por `kind`, de `partyRows`/`rows`, `times`, `tours`, `names` y `labels` en `overrides.mjs`.

## Verificación (bruno; base: `design/lab/booking-bar/r01/verificar.mjs`)

- **vitest:** `role="search"` con nombre; plantilla de la frase (orden por idioma, marcador que falta → barra con aviso); nombres de los huecos = rótulo + valor; intención exacta en los tres `kind`; ocultos con `names`; envío nativo solo con `action` y sin `preventDefault`; validación (foco al primero, anuncio, noche agotada dentro = error con fecha, salida en día agotado = válida, `minNights`/`maxNights`); resumen que nombra lo que falta; compacto con histéresis y cambio fuera del observador; hoja con campos en línea; muelle (oculto e inerte, alto de contrato, reserva de borde con `bookingDock`, presupuesto del cuarto); `GPartyField` (resumen, corrección por `max` dependiente, ocultos, contexto de `GForm`, panel: foco, Esc, Tab fuera, toque fuera, fondo no cierra, una activación por gesto); avisos; SSR.
- **Playwright (tres motores):** sin desplazamiento horizontal a 1440, 390, 320; la frase refluye a 390 y 320; panel dentro del visor a 390; muelle con y sin movimiento reducido, foco nunca tapado (último botón de una página **sin sitio al final**, con la cola de #757; y sin cola tras ocultarse el muelle); RTL; tema oscuro; `forced-colors` (Chromium).

## Fuera de v1 (reservado con nombre)

- **C · El conserje** (`appearance="guided"`): respuestas como botones, avance del foco solo con activación explícita, anuncio de la siguiente pregunta (B-L12).
- `times` ausente con `table` (turno libre con `GTimeField`); `GCombobox` para recorridos; `childAges` en `GPartyField`.
- Precio por día o «desde» en la consulta: ronda de moneda (#154, adelantada como siguiente ronda de kiwi, #745).

## Límites conocidos (para el README)

- La frase depende de una plantilla bien escrita por idioma (los marcadores son obligatorios).
- El muelle no aparece si con la barra inferior y el navbar ocuparía más de un cuarto del visor.
- La cola del documento (#757) va en `:root::after`: una aplicación con su propio `:root::after` o que desplace un contenedor en lugar del documento deja ella el alto del muelle al final.
- Lector real (frase en modo lectura), móvil real (teclado virtual sobre la hoja), zoom real y otros idiomas en la frase: no verificados en la ronda.

## Resolución de hallazgos de kiwi (B-L1 a B-L12)

| # | Hallazgo | Resolución |
| --- | --- | --- |
| B-L1 | Componente, nombre y entrada | `GBookingBar`; `@grana/vue/booking`, tope 14 KiB; complejo (#737, #742) |
| B-L2 | `GPartyField` primitiva | Contratada aquí, en la misma entrada; `childAges` reservado (#738) |
| B-L3 | Textos y plantilla | Tabla «Textos»; la frase es plantilla de la aplicación (#737) |
| B-L4 | Intención y envío | `submit` con la carga, `pending`, `kind`, `names`, envío nativo con `action` (#737) |
| B-L5 | Noche agotada ≠ salida | **Enmienda de `datepicker.md`**: `disabledNights`, `minNights`, `maxNights`, estado «solo salida» (#739) |
| B-L6 | `GDatePicker inline disabled` con navegación activa | **Defecto de bruno**: el contrato ya dice que `disabled` la deshabilita entera (#739) |
| B-L7 | Raíz de `GDatePicker` con `trigger` en una frase | `g-datepicker--trigger` con `display: contents`; la frase es un `div`; aviso si va dentro de `<p>` (#739) |
| B-L8 | Precios | Fuera: slot `day` de la aplicación; ronda de moneda (#745) |
| B-L9 | Iconos | `calendar`, `users`, `chevron-down`, `x` ya en la lista; **ninguno nuevo** (`clock`, `ticket`, `map` no entran: ningún componente los usa) (#744) |
| B-L10 | Muelle en `edgeReserve` | `EDGE_ORDER.bookingDock = 20`, alto de contrato, `scroll-padding-block-end` en la capa de Grana, cuarto (#740) |
| B-L11 | Forma compacta | §«No se parte» (#737) |
| B-L12 | C | Reservado con sus reglas (#745) |

## Remates tras la entrega de coco (#757, #759)

| # | Hallazgo de coco | Resolución |
| --- | --- | --- |
| B-C1 | El último control de la página queda bajo el muelle | Cola del documento `:root::after` en la capa de Grana mientras se ve (#757; `api.md` «Flotantes persistentes») |
| B-C2 | `--_reserve` sin registrar | §29.5 y tabla de clases (#759) |
| B-C3 | Tokens consumidos sin listar | Listas exactas en «Tokens consumidos» y §53 (#759) |
| B-C4 | Clases del resumen compacto | `__summary-title`, `__summary-text`, `__summary-change` (#759) |

## Encargos

- **coco (Opus):** `GBookingBar.css` y `GPartyField.css` (frase y huecos con su subrayado por forma y alto táctil, paneles, barra y compacto, hoja, muelle con el alto de contrato y el `scroll-padding-block-end` en la capa de Grana, reducido, forzados, RTL, oscuro); `g-datepicker--trigger` y `g-party-field--trigger` con `display: contents` (`GDatePicker.css` es suyo); el estado «solo salida» del día en `GDatePicker.css` (#739); auditoría.
- **bruno (enmienda #862, lote 3 de Blocks, parte A):** `describeQuery` extraída a `utils/bookingQuery.js` y exportada desde `@grana/vue/booking`, con `GBookingBar` usándola; tipos, prueba de igualdad y medida (§«`describeQuery`»).
- **bruno (Opus):** `GBookingBar.vue` y `GPartyField.vue` (plantilla, huecos, validación, intención, medida compacta, muelle con `edgeReserve` y cuarto), enmienda de `GDatePicker.vue` (#739: `disabledNights`, `minNights`, `maxNights`, aviso dentro de `<p>`; **y el defecto B-L6**), `EDGE_ORDER.bookingDock`, pruebas, `meta.json` (también `GDatePicker`), entrada `@grana/vue/booking`, compuertas, playground y spec.
