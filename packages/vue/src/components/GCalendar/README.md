# GCalendar

Calendario y planificador genérico de uno o varios recursos, con cuatro vistas: **Día**, **Semana**, **Mes** y **Timeline**. Representa y manipula tiempo; no conoce tu dominio (citas, turnos, salas, reservas). **Emite solicitudes, no muta**: tú decides si aceptas cada cambio.

**Etiqueta:** `<g-calendar>` · **Estado:** `candidate` (auditoría de coco aprobada; ver [`design/lab/calendar/auditoria.md`](../../../../../design/lab/calendar/auditoria.md)) · **Desde:** 0.1.0

> `@grana/vue` está en la versión 0.0.0 y aún no se publica. Por ahora se usa desde el repositorio (ver el playground en `packages/vue/playground/`). Exige Vue `^3.5.0`.

## Uso

```js
import { createApp } from 'vue'
import Grana from '@grana/vue'
import '@grana/vue/style.css'

createApp(App).use(Grana).mount('#app')
```

```vue
<g-calendar
  v-model:view="vista"
  v-model:date="fecha"
  :events="eventos"
  :resources="recursos"
  :availability="disponibilidad"
  :blocks="bloqueos"
  timezone="America/Mexico_City"
  locale="es-MX"
  :labels="textos"
  label="Agenda"
  editable
  @create-request="crear"
  @event-move-request="mover"
  @event-resize-request="redimensionar"
  @range-change="cargar"
/>
```

`timezone` es obligatorio y **`labels` no tiene valores por defecto** (Grana es internacional): tú pones los textos. Sin ellos, en desarrollo se emite `console.warn` con el nombre de la clave que falta. Sin `timezone` se usa `UTC` y también hay advertencia.

Los atributos `class`, `style` y `data-*` van a la raíz.

> **En plantillas dentro del HTML** (sin compilar), escribe `<g-calendar ...></g-calendar>`: Vue no admite etiquetas de componente autocerradas.

## Modelo de datos

Las fechas pueden ser `Date` o texto ISO 8601. Un texto **con desfase** (`…-06:00`, `…Z`) es un instante exacto; uno **sin desfase** (`2026-09-29T09:00`) es hora local **en la zona del calendario**.

- **Recurso:** `{ id, title, subtitle?, avatar?, metadata? }`. Sin `resources`, hay un recurso implícito (agenda individual).
- **Evento:** `{ id, resourceId | resourceIds, title, start, end, allDay?, status?, type?, color?, editable?, draggable?, resizable?, metadata? }`.
  - Sin `end` (o `null`): **evento abierto**; se dibuja hasta la hora actual (mínimo 30 minutos), con marca de activo, y no se redimensiona.
  - `resourceIds`: el mismo evento aparece en cada recurso.
  - `status`: libre; `tentative` tiene estilo propio. `color`: uno de los colores semánticos.
- **Disponibilidad:** `{ resourceId, dayOfWeek?, date?, available?, startTime, endTime, pauses?, slotDuration? }`. Una regla con `date` sustituye a las de `dayOfWeek` ese día. Un recurso sin reglas no tiene restricciones.
- **Bloqueo:** `{ id, resourceId, start, end, allDay?, reason? }`. Los recurrentes llegan como ocurrencias concretas: el componente no calcula recurrencia.

Disponibilidad, bloqueos y eventos son **capas separadas**: la disponibilidad se sombrea, el bloqueo se dibuja y se anuncia con su motivo, y el evento va encima.

## Props

| Prop | Tipo | Valores | Por defecto |
| --- | --- | --- | --- |
| `events` | Array | | `[]` |
| `resources` | Array | | recurso implícito |
| `availability` | Array | | `[]` |
| `blocks` | Array | | `[]` |
| `view` (`v-model:view`) | String | `day` `week` `month` `timeline` | `week` |
| `date` (`v-model:date`) | Date \| String | | hoy |
| `selectedEventId` (`v-model:selectedEventId`) | String \| Number | | sin valor |
| `timezone` | String | zona IANA | `UTC` (con aviso) |
| `locale` | String | | del navegador |
| `weekStartsOn` | Number | 0 a 6 | `1` |
| `hour12` | Boolean | | `false` |
| `startHour` / `endHour` | Number | | `7` / `22` |
| `gridInterval` | Number | minutos | `30` |
| `snapInterval` | Number | minutos | `5` |
| `density` | String | `compact` `comfortable` `spacious` | `comfortable` |
| `editable` / `draggable` / `resizable` | Boolean | | `false` / heredan de `editable` |
| `readonly` | Boolean | | `false` |
| `disabled` | Boolean | | `false` |
| `loading` | Boolean | | `false` |
| `error` | String | | sin valor |
| `showNowIndicator` | Boolean | | `true` |
| `now` | Date \| String | | reloj |
| `refreshInterval` | Number | ms | `60000` |
| `monthMaxVisibleEvents` | Number | | `3` |
| `detectConflicts` | Boolean | | `true` |
| `labels` | Object | ver "Textos" | `{}` |
| `label` | String | | sin valor |
| `id` | String | | generado |

Un valor fuera de la lista muestra una advertencia en desarrollo.

- **Vistas y recursos.** *Día:* una columna por recurso hasta 5; con más, un aviso pide usar Timeline. *Semana:* un recurso; con varios, la barra ofrece elegir cuál. *Mes:* mezcla los recursos y cada evento lleva la inicial del suyo. *Timeline:* todos los recursos sobre el mismo eje.
- **`gridInterval`, `snapInterval` y la disponibilidad son independientes.** La rejilla es solo una guía: **no** limita la posición de los eventos, que se dibujan en su minuto real. `snapInterval` es el paso de arrastrar, redimensionar, crear y teclado.
- **`startHour`/`endHour`:** un evento fuera del rango no se dibuja en el eje; se cuenta en un aviso.
- **`readonly`:** no se crea, mueve ni redimensiona, pero los eventos siguen siendo enfocables y activables. **`disabled`:** ninguna interacción, ni siquiera la navegación (`aria-disabled="true"`).
- **`loading`:** conserva barra y rejilla y muestra un esqueleto (`aria-busy="true"`); nunca reemplaza la pantalla.
- **`error`:** con texto, muestra un aviso `role="alert"` con botón de reintento y emite `retry`. La estructura se conserva.
- **Vacío:** sin eventos en el rango, muestra `labels.noEvents` sin ocultar la rejilla, la disponibilidad ni los bloqueos.
- **`density`:** cambia la altura de una hora (11, 15 o 20 unidades de `--g-space-1`), los rellenos y cuánta información muestra el evento. No cambia el tamaño del texto.
- **`label`:** el componente necesita un nombre accesible. Sin `label`, `labels.calendar`, `aria-label` ni `aria-labelledby`, en desarrollo hay `console.warn`.

## Eventos: solicitudes, no mutaciones

El componente **nunca modifica `events`**. Emite una solicitud; si la aceptas, actualizas tu modelo y el calendario se redibuja. Las fechas de los payloads son `Date`; `event` es siempre tu mismo objeto, no una copia.

| Evento | Payload |
| --- | --- |
| `update:view`, `update:date`, `update:selectedEventId` | Nuevo valor (`update:date` es la medianoche del día, en la zona del calendario) |
| `range-change` | `{ start, end, view, timezone }`. `end` es exclusivo; también al montar |
| `create-request` | `{ resourceId, start, end?, timezone, source }` (`source`: `pointer` o `keyboard`) |
| `event-move-request` | `{ event, resourceId, previousStart, previousEnd, newStart, newEnd, newResourceId, conflicts }` |
| `event-resize-request` | `{ event, resourceId, previousEnd, newEnd, conflicts }` |
| `event-click`, `event-double-click` | `{ event, resourceId }` |
| `conflict` | `{ type, event, conflicts }` (además de la solicitud) |
| `block-conflict` | `{ block, impactedEvents }`: un bloqueo recibido cubre eventos existentes; no se toca nada |
| `resource-click` | `{ resourceId }` |
| `date-click` | `{ date }` (Mes) |
| `time-click` | `{ resourceId, start }` |
| `more-events-click` | `{ date, hidden }` |
| `retry` | sin datos |

```js
function mover({ event, newStart, newEnd, newResourceId, conflicts }) {
  if (conflicts.some((c) => c.type === 'blockedTime')) return // rechazar
  Object.assign(event, { start: newStart, end: newEnd, resourceId: newResourceId })
}
```

**La solicitud siempre se emite**, con o sin conflictos; el componente no cancela por su cuenta, salvo `invalidDuration` (fin no posterior al inicio, o menos de un minuto), que se emite pero no se dibuja como válido.

## Conflictos

Con `detectConflicts`, el componente **informa** y nunca resuelve. Cada elemento de `conflicts` es `{ type, conflictingEvents? }` con `type`: `overlap`, `blockedTime`, `outsideAvailability`, `invalidDuration` o `resourceConflict`. Mientras se arrastra, el fantasma cambia de estilo si hay conflicto, y un evento con conflicto lleva `is-conflict` y un borde más grueso (no depende solo del color).

## Slots

| Slot | Alcance | Contenido |
| --- | --- | --- |
| `resource` | `{ resource }` | Cabecera de un recurso |
| `event` | `{ event, resource, segment }` | Sustituye todo el contenido del evento. Sin interactivos |
| `event-content` | `{ event, resource, segment }` | Contenido interior del evento. Sin interactivos |
| `day-header` | `{ date }` | Encabezado de un día |
| `month-day` | `{ date, events }` | Contenido adicional de una celda del Mes |
| `all-day-event` | `{ event }` | Evento de día completo |
| `detail` | `{ event, resource, close }` | Detalle del evento seleccionado |
| `toolbar-end` | | Contenido extra al final de la barra |
| `empty` | | Estado vacío (sustituye a `labels.noEvents`) |

`segment` es `{ start, end, continuesBefore, continuesAfter, open }`: el tramo del evento que cae en el día (o fila) mostrado. El evento es un `<button>`: no pongas botones ni enlaces dentro de `event` ni `event-content`.

## Textos (`labels`)

Sin valores por defecto. Las claves con datos son funciones.

| Clave | Tipo |
| --- | --- |
| `calendar`, `previous`, `next`, `today`, `views`, `day`, `week`, `month`, `timeline`, `resources`, `allDay`, `tooManyResources`, `now`, `noEvents`, `loading`, `retry`, `close` | Texto |
| `moreEvents` | `(n) => texto` |
| `outOfRange` | `(n, desde, hasta) => texto` |
| `monthDay` | `(fecha, n) => texto` |
| `unavailable` | `(inicio, fin, motivo) => texto` |
| `eventName` | `(evento, recurso, inicio, fin, estado) => texto` |
| `openEnded` | `(inicio) => texto` |
| `createEvent` | `(recurso, fecha, hora) => texto` |
| `resourceStatus` | `{ busyUntil(h), available, availableNext(h), blocked, activeEvent }` |
| `conflict` | `{ overlap, blockedTime, outsideAvailability, invalidDuration, resourceConflict }` |
| `rangeTitle` | `(vista, inicio, fin) => texto`; si falta, el título se formatea con `locale` |

## Interacción y teclado

- **Crear:** clic o toque en un hueco emite `create-request` con `start` ajustado a `snapInterval`; un arrastre añade `end`. Sin arrastre, `end` sale de `slotDuration` de la disponibilidad, si existe.
- **Mover:** arrastrar el evento. En Día y Semana puede cambiar de día y de recurso; en Timeline, de recurso. `Esc` cancela sin emitir.
- **Redimensionar:** arrastrar el tirador, visible con hover, selección o foco.
- **Seleccionar:** clic, toque o `Enter`; muestra el tirador y abre el slot `detail` si existe.

| Tecla | Acción |
| --- | --- |
| Tab / Shift+Tab | Día, Semana y Timeline tienen **un solo punto de tabulación** (tabulación itinerante). Mes y la agenda móvil usan el orden natural |
| ↑ / ↓ (en Timeline: ← / →) | Evento anterior o siguiente de la misma lista |
| → / ← (en Timeline: ↓ / ↑) | Primer evento de la lista vecina (día o recurso) |
| Inicio / Fin | Primer o último evento de la vista |
| Enter / Espacio | Seleccionar y abrir el detalle |
| Esc | Cierra el detalle y devuelve el foco; cancela un arrastre |
| Alt + flecha | **Mover** un `snapInterval` (`event-move-request`) |
| Shift + flecha | **Cambiar la duración** un `snapInterval` (`event-resize-request`) |
| Enter en "Crear evento…" | `create-request` con `source: keyboard` |

Alt/Shift+flecha y el botón "Crear evento…" (visualmente oculto, uno por columna o fila) son la alternativa al arrastre que exige WCAG 2.5.7.

## Adaptación por ancho

Se decide por el **ancho de la propia raíz**, no por el de la ventana (`g-calendar--mode-{desktop|tablet|phone}`).

| Ancho de la raíz | Estructura |
| --- | --- |
| Más de ~700px | Escritorio: vistas completas |
| Hasta ~700px | Tableta: el panel de recursos pasa a uno plegable |
| Hasta ~520px | Teléfono: Día con varios recursos y Timeline pasan a una **lista de recursos con estado** ("Ocupado hasta…", "Disponible", "Bloqueado"); Semana es una tira de siete días más la agenda del día; Mes es una cuadrícula con puntos y una hoja inferior con los eventos del día |

Los umbrales son constantes literales de contenedor (DECISIONS.md #34 y #39): una consulta de contenedor no admite `var()`.

## Accesibilidad

- **Estructura:** región con nombre; una lista cronológica unificada de eventos y bloqueos es la exposición principal para lectores de pantalla. Las regiones vivas (`aria-live`) existen siempre.
- **Nombres:** cada evento, día del Mes, bloqueo y botón de creación se nombra con tus `labels`. Hoy lleva `aria-current="date"`.
- **El estado no depende solo del color:** el conflicto engrosa el borde, el bloqueo y la indisponibilidad usan trama, el evento abierto lleva marca de activo, y la línea de ahora lleva una marca en su encabezado.
- **Área táctil:** los controles miden 24px como mínimo y 44px con `pointer: coarse`; el evento nunca es menor que `max(24px, --g-space-1 × 6)` (44px en táctil) aunque su posición sea la real.
- **Foco:** anillo de `--g-focus-width` en todo control y evento, siempre visible.
- **Contraste:** con el tema por defecto y con el de prueba de la auditoría, todo texto llega a 4.5:1 o más.
- **Contorno de lo pulsado** (DECISIONS #431 y #432): la vista pulsada de la barra y el día pulsado de la tira conservan el relleno `primary` con `on-primary` y su **borde** pasa a `--g-color-primary-text`; «hoy» (cabecera y vista Mes) lleva un trazo interior de `--g-border-width` en `--g-color-primary-text`, nunca un anillo exterior (ese lugar es del foco). Sin cambio visible con el tema por defecto (solo cambia el suavizado del filo de las formas redondas). Mínimo medido contra la superficie: **4.21:1** (medido por coco, [`design/lab/contraste-marcado/estilo.md`](../../../../../design/lab/contraste-marcado/estilo.md), tres motores) en el tema por defecto, lustre, spotify y uno con clave `primary` propia, claro y oscuro.
- **Movimiento reducido** y **colores forzados** tienen su bloque de CSS.

## Tema

El componente solo lee tokens `--g-*`. Agrega tres tokens propios, con valor por defecto en `defaults.css`:

```css
:root {
  --g-calendar-grid-color: #d9b871;        /* líneas de la cuadrícula */
  --g-calendar-unavailable-color: #c9a25a; /* trama de indisponibilidad y bloqueo */
  --g-calendar-now-color: #b00020;         /* línea y marca de ahora (≥ 3:1 sobre la superficie) */
}
```

Además consume: `--g-color-surface`, `--g-color-surface-sunken`, `--g-color-bg`, `--g-color-border`, `--g-color-border-strong`, `--g-color-border-control`, `--g-color-{color}` (y `-soft`, `-text`), `--g-color-on-{color}` (y `-soft`), `--g-color-text`, `--g-color-text-muted`, `--g-color-text-subtle`, `--g-color-danger`, `--g-color-danger-text`, `--g-color-focus`, `--g-radius-*`, `--g-space-1..6`, `--g-font-ui`, `--g-text-{caption|body-sm|body|title-sm}-{size|line}`, `--g-text-action-weight`, `--g-border-width`, `--g-focus-width`, `--g-focus-offset`, `--g-duration-fast`, `--g-duration-spin`, `--g-ease-standard`, `--g-shadow-2`, `--g-shadow-3`. La altura de una hora sale de `--g-space-1`: cambiar el espacio base escala todo el calendario, y las posiciones siguen siendo exactas (con espacio 5, 09:37 cae a 196,25px del inicio de las 07:00).

## Clases

Las emite el componente y las estiliza `GCalendar.css`. Raíz: `g-calendar`, `g-calendar--view-*`, `g-calendar--density-*`, `g-calendar--mode-*`, `is-readonly`, `is-disabled`, `is-loading`, `is-error`. Elementos principales: `g-calendar__toolbar`, `__grid`, `__col`, `__head`, `__allday`, `__availability`, `__events`, `__event` (con `--sm`, `--open`, `is-selected`, `is-conflict`), `__handle`, `__block`, `__now`, `__ghost`, `__create`, `__timeline`, `__month`, `__day`, `__more`, `__resources`, `__agenda`, `__strip`, `__sheet`, `__detail`, `__skeleton`, `__live`. La tabla completa está en el contrato.

## Limitaciones conocidas

- **Sin recurrencia, sin virtualización, sin mes agregado, sin Agenda ni Año** en v0.1. Con miles de eventos o más de cien recursos el rendimiento no se ha medido.
- **Horario de verano:** el motor mide minutos transcurridos desde el inicio del día y dibuja una jornada de 23 o 25 horas con su duración real. Solo está probado con el motor, no con el componente montado.
- **Carriles estrechos:** los eventos de pocos minutos ocupan un alto mínimo de 24px (44px en táctil); en horas muy densas los carriles pueden volverse estrechos (en la auditoría, 30 a 38px de ancho con siete traslapes).
- **Arrastre entre recursos en Timeline** sin verificar de extremo a extremo.
- No hay tema oscuro todavía.
- **Sin verificar:** un lector de pantalla real (lista cronológica, conteos, solicitudes, conflictos), un dispositivo táctil real (arrastre, tirador, hoja inferior), las preferencias reales de `prefers-reduced-motion` y `forced-colors` (los bloques se comprobaron aplicados sin condición), Firefox y Safari.

## Fuentes

- API: [`GCalendar.meta.json`](./GCalendar.meta.json) · Contrato: [`design/contracts/calendar.md`](../../../../../design/contracts/calendar.md) · Prototipo: [`design/lab/calendar/r01/`](../../../../../design/lab/calendar/r01/) · Auditoría: [`design/lab/calendar/auditoria.md`](../../../../../design/lab/calendar/auditoria.md)
