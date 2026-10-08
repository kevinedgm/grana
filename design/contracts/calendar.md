# Contrato · GCalendar

**Dueño:** lima · **Estado:** aprobado · **Basado en:** `design/lab/calendar/r01/` (kiwi) y la especificación "Calendar / Scheduler multirrecurso" entregada por el usuario
**Tag:** `g-calendar` · **Categoría:** planificación

Calendario y planificador genérico, para un recurso o varios. **No conoce el dominio**: solo `resource`, `event`, `availability` y `block`. Representa y manipula tiempo; la aplicación decide las reglas de negocio. Alcance decidido por el usuario (DECISIONS.md #38): vistas **Día, Semana, Mes y Timeline**, núcleo completo de interacción **sin virtualización**.

## Principios (de la especificación)

1. **Independiente del dominio.** Sin "médico", "sala" ni "paciente".
2. **El tiempo real no depende de la cuadrícula.** `gridInterval` (guía visual), `snapInterval` (interacción) y el intervalo de disponibilidad son cosas distintas. Un evento a las 12:43 se dibuja a las 12:43.
3. **Disponibilidad ≠ evento ≠ bloqueo.** Tres capas independientes.
4. **El componente detecta; la aplicación decide.** Conflictos, traslapes, indisponibilidad: se informan, no se resuelven.
5. **Solicita, no muta.** Crear, mover y redimensionar emiten solicitudes con valores previo y nuevo. El modelo es de la aplicación.
6. **Zona horaria explícita.** Nunca se asume que la del servidor sea la del usuario.

---

## Tipos de datos

Las fechas pueden darse como `Date` o como texto ISO 8601. Un texto **con desfase** (`…-06:00`, `…Z`) es un instante exacto; un texto **sin desfase** (`2026-09-29T09:00`) se interpreta como hora local **en la zona horaria del calendario**. Todo se normaliza a instantes.

### `CalendarResource`

| Campo | Tipo | Nota |
| --- | --- | --- |
| `id` | String | Obligatorio y único |
| `title` | String | Obligatorio |
| `subtitle` | String | Opcional |
| `avatar` | String | Opcional (URL); decorativo |
| `metadata` | Objeto | Opaco para el calendario |

### `CalendarEvent`

| Campo | Tipo | Nota |
| --- | --- | --- |
| `id` | String | Obligatorio y único |
| `resourceId` | String | Recurso del evento (uno) |
| `resourceIds` | String[] | Varios recursos: el evento aparece en cada uno con el mismo `id`. Con `resourceId` y `resourceIds` a la vez, se unen |
| `title` | String | Obligatorio |
| `start` | Date \| String | Obligatorio |
| `end` | Date \| String \| `null` | Sin `end` (o `null`): **evento abierto** |
| `allDay` | Boolean | Evento de día completo (fuera del eje horario) |
| `status` | String | Libre. Se reservan `active` (lo pone el componente en eventos abiertos) y `tentative` |
| `type` | String | Libre |
| `color` | String | Uno de los colores semánticos (`brand` `accent` `neutral` `success` `warning` `danger` `info`) |
| `editable`, `draggable`, `resizable` | Boolean | Sobrescriben la prop global para ese evento |
| `metadata` | Objeto | Opaco para el calendario |

### `AvailabilityRule`

| Campo | Tipo | Nota |
| --- | --- | --- |
| `resourceId` | String | Obligatorio |
| `dayOfWeek` | Number | 0 (domingo) a 6 (sábado). Sin valor: todos los días |
| `date` | String | `AAAA-MM-DD`. Una regla con `date` **sustituye** a las de `dayOfWeek` ese día |
| `available` | Boolean | `false` con `date`: ese día no hay disponibilidad (excepción). Por defecto `true` |
| `startTime`, `endTime` | String | `HH:mm`, en la zona horaria del calendario |
| `pauses` | `{ startTime, endTime }[]` | Pausas dentro de la jornada |
| `slotDuration` | Number | Minutos. Duración propuesta al crear con un clic (`create-request.end`) |

Un recurso **sin reglas** se considera sin restricciones (no se sombrea nada y no se propone duración).

### `CalendarBlock`

| Campo | Tipo | Nota |
| --- | --- | --- |
| `id` | String | Obligatorio |
| `resourceId` | String | Obligatorio |
| `start`, `end` | Date \| String | Obligatorios |
| `allDay` | Boolean | Bloqueo de día completo o de varios días |
| `reason` | String | Motivo; se muestra y se anuncia |

Los bloqueos recurrentes llegan como **ocurrencias concretas** (el componente no calcula recurrencia).

---

## Props

| Prop | Tipo | Valores | Default | Origen |
| --- | --- | --- | --- | --- |
| `events` | `CalendarEvent[]` | | `[]` | propia |
| `resources` | `CalendarResource[]` | | sin valor | propia |
| `availability` | `AvailabilityRule[]` | | `[]` | propia |
| `blocks` | `CalendarBlock[]` | | `[]` | propia |
| `view` (`v-model`) | String | `day` `week` `month` `timeline` | `week` | propia |
| `date` (`v-model`) | Date \| String | | hoy en la zona horaria | propia |
| `selectedEventId` (`v-model`) | String \| `null` | | `null` | propia |
| `timezone` | String | zona IANA | sin valor | propia |
| `locale` | String | BCP 47 | sin valor | propia |
| `weekStartsOn` | Number | 0 a 6 | `1` | propia |
| `hour12` | Boolean | | `false` | propia |
| `startHour` | Number | 0 a 23 | `7` | propia |
| `endHour` | Number | 1 a 24 | `22` | propia |
| `gridInterval` | Number | minutos | `30` | propia |
| `snapInterval` | Number | minutos | `5` | propia |
| `density` | String | `compact` `comfortable` `spacious` | `comfortable` | propia (precisada en `api.md`) |
| `editable` | Boolean | | `false` | propia |
| `draggable` | Boolean | | valor de `editable` | propia |
| `resizable` | Boolean | | valor de `editable` | propia |
| `readonly` | Boolean | | `false` | compartida |
| `disabled` | Boolean | | `false` | compartida |
| `loading` | Boolean | | `false` | compartida (precisada en `api.md`) |
| `error` | String | texto libre | sin valor | propia |
| `showNowIndicator` | Boolean | | `true` | propia |
| `now` | Date \| String | | reloj del sistema | propia |
| `refreshInterval` | Number | milisegundos | `60000` | propia |
| `monthMaxVisibleEvents` | Number | | `3` | propia |
| `detectConflicts` | Boolean | | `true` | propia |
| `labels` | Objeto | ver "Textos" | sin valor | propia |
| `label` | String | texto libre | sin valor | propia |
| `id` | String | | generado | propia |

### Reglas de props

- **`timezone`:** obligatorio. Sin valor, en desarrollo se emite `console.warn` y se usa `UTC` (explícito, no la zona del navegador). Todo (posiciones, encabezados, `range-change`, cambios de día) se calcula en esa zona con `Intl.DateTimeFormat`, sin bibliotecas.
- **`date` y `view`:** el calendario los mantiene en sincronía con `v-model`. `update:date` emite un `Date` en el instante **00:00 del día elegido, en la zona del calendario**.
- **`resources`:** los pasa la aplicación **ya filtrados** (filtros y búsqueda son externos). Sin `resources`, hay **un recurso implícito** y los eventos sin `resourceId` le pertenecen (agenda individual).
- **Reglas por vista y número de recursos:**
  - **Día:** columnas por recurso hasta **5**; con más, un aviso pide usar Timeline (y en teléfono, la lista de recursos).
  - **Semana:** un recurso; con varios, la barra ofrece elegir cuál (es estado interno de la barra y se anuncia al cambiar).
  - **Mes:** los eventos de todos los recursos se mezclan y cada uno lleva la inicial de su recurso (el mes agregado con métricas queda para v0.2).
  - **Timeline:** todos los recursos, sobre el mismo eje. Sin virtualización en v0.1.
- **`hour12`:** las horas se muestran en 24 horas (`HH:mm`); con `hour12`, en 12 horas según la `locale`. Los nombres de días y meses siempre siguen la `locale`.
- **`startHour`/`endHour`:** rango visible de las vistas con eje horario. Un evento fuera del rango no se dibuja en el eje; se cuenta en un aviso "N eventos fuera del rango visible".
- **`gridInterval`:** guía visual de la cuadrícula. **No** limita la posición de los eventos.
- **`snapInterval`:** paso de las interacciones (arrastrar, redimensionar, crear, teclado). Distinto de `gridInterval` y del intervalo de disponibilidad.
- **`editable`, `draggable`, `resizable`:** sin `editable`, el calendario solo consulta y emite clics. Un evento puede sobrescribir cada uno. Los eventos abiertos (sin `end`) **no se redimensionan**.
- **`readonly`:** ni crear, ni mover, ni redimensionar; los eventos siguen siendo enfocables y activables. **`disabled`:** ninguna interacción, incluida la navegación; la raíz lleva `aria-disabled="true"`.
- **`loading`:** conserva la estructura (barra y rejilla) y muestra esqueleto de filas; `aria-busy="true"`. **Nunca** reemplaza la pantalla por un indicador.
- **`error`:** con texto, muestra un aviso `role="alert"` con un botón de reintento (etiqueta `labels.retry`) y emite `retry`. La estructura se conserva.
- **Vacío:** si no hay eventos en el rango visible y no se está cargando, se muestra `labels.noEvents` **sin ocultar** la rejilla, la disponibilidad ni los bloqueos.
- **`now`:** fija la hora actual (pruebas, demostraciones). Sin valor, se usa el reloj y se actualiza cada `refreshInterval` (no cada segundo, porque no se muestran segundos).
- **`monthMaxVisibleEvents`:** eventos visibles por día en Mes; el resto va en `+N`.
- **`detectConflicts`:** con `true`, el componente detecta y **informa** conflictos en las solicitudes y en el fantasma. Nunca los resuelve.
- **`label`:** nombre de la región. Sin `label`, sin `aria-label` ni `aria-labelledby`, en desarrollo se emite `console.warn`.
- **`density`:** `compact`, `comfortable` o `spacious`. Afecta a la altura de una hora (11, 15 o 20 unidades de `--g-space-1`), a las filas, a los rellenos y a cuánta información muestra el evento. No cambia el tamaño del texto.
- **Resto de atributos:** `class`, `style` y `data-*` van a la raíz.

---

## Modelo de eventos que emite (solicitudes, no mutaciones)

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `update:view` | `String` | Cambia la vista |
| `update:date` | `Date` | Navega (anterior, hoy, siguiente, fecha directa) |
| `update:selectedEventId` | `String \| null` | Se selecciona o se deja de seleccionar un evento |
| `range-change` | `{ start, end, view, timezone }` | Cambia el rango visible; `end` es exclusivo. También al montar |
| `create-request` | `{ resourceId, start, end?, timezone, source }` | Clic o arrastre en un hueco, o el botón de teclado. `end` viene de un arrastre o de `slotDuration`; `source`: `pointer` o `keyboard` |
| `event-move-request` | `{ event, resourceId, previousStart, previousEnd, newStart, newEnd, newResourceId, conflicts }` | Se suelta un evento arrastrado o se pulsa `Alt`+flecha |
| `event-resize-request` | `{ event, resourceId, previousEnd, newEnd, conflicts }` | Se suelta el tirador o se pulsa `Shift`+flecha |
| `event-click` | `{ event, resourceId }` | Clic, toque o `Enter` sobre un evento |
| `event-double-click` | `{ event, resourceId }` | Doble clic |
| `conflict` | `{ type, event, conflicts }` | Una solicitud tiene conflictos (se emite **además** de la solicitud) |
| `block-conflict` | `{ block, impactedEvents }` | Un bloqueo recién recibido cubre eventos existentes. Nada se elimina ni se modifica |
| `resource-click` | `{ resourceId }` | Clic sobre un recurso (cabecera o lista móvil) |
| `date-click` | `{ date }` | Clic sobre un día del Mes |
| `time-click` | `{ resourceId, start }` | Clic sobre una hora vacía (equivale a `create-request` sin editar) |
| `more-events-click` | `{ date, hidden }` | Clic en `+N` |
| `retry` | *(sin datos)* | Botón de reintento del estado de error |

- **`event`** es siempre el objeto del consumidor (el mismo que recibió), nunca una copia interna.
- **`conflicts`** es un arreglo (vacío si no hay) de `{ type, conflictingEvents? }` con `type`: `overlap`, `blockedTime`, `outsideAvailability`, `invalidDuration` o `resourceConflict`. Las fechas de los payloads son `Date`.
- **La solicitud siempre se emite**, con o sin conflictos; el componente **no** cancela por su cuenta, salvo `invalidDuration` (fin no posterior al inicio, o menos de un minuto), que se emite pero no se dibuja como válido. La aplicación decide.
- El componente **no muta `events`**. Si la aplicación acepta el cambio, actualiza el modelo y el calendario se redibuja.
- Un evento en varios recursos: el movimiento de una instancia informa `resourceId` (la instancia movida) y `newResourceId`.

## Detección de conflictos

| Tipo | Condición |
| --- | --- |
| `overlap` | `nuevo.inicio < otro.fin && nuevo.fin > otro.inicio` con otro evento **con fin** del mismo recurso |
| `blockedTime` | El nuevo periodo cruza un bloqueo del recurso |
| `outsideAvailability` | El nuevo periodo cae fuera de la disponibilidad, o en un día sin ella |
| `invalidDuration` | Menos de un minuto o fin no posterior al inicio |
| `resourceConflict` | Un evento con varios recursos entra en conflicto en alguno de ellos |

---

## Slots

| Slot | Propósito | Anatomía que debe conservar |
| --- | --- | --- |
| `resource` | Cabecera de un recurso | Alcance: `{ resource }`. Sin controles que anulen `resource-click` |
| `event` | Sustituye **todo** el contenido del evento | Alcance: `{ event, resource, segment }`. **Sin controles interactivos** dentro del botón del evento |
| `event-content` | Contenido interior (título, hora) sin cambiar el contenedor | Alcance: `{ event, resource, segment }`. Sin controles interactivos |
| `day-header` | Encabezado de un día | Alcance: `{ date }` |
| `month-day` | Contenido adicional de una celda del Mes | Alcance: `{ date, events }` |
| `all-day-event` | Evento de día completo | Alcance: `{ event }` |
| `detail` | Detalle del evento seleccionado (popover o diálogo) | Alcance: `{ event, resource, close }`. Se muestra cuando `selectedEventId` tiene valor; `Esc` lo cierra y devuelve el foco |
| `toolbar-end` | Contenido extra al final de la barra | Sin romper el orden de tabulación |
| `empty` | Estado vacío | Sustituye a `labels.noEvents` |

`segment` es `{ start, end, continuesBefore, continuesAfter, open }`: el tramo del evento que cae en el día (o fila) mostrado, con sus fechas recortadas.

---

## Textos (`labels`)

**Sin valores por defecto** (Grana es internacional; mismo criterio que `loadingText`). En desarrollo, si falta alguna clave que se necesite, se emite `console.warn` con su nombre. Las claves con datos son funciones.

| Clave | Tipo | Se usa en |
| --- | --- | --- |
| `calendar` | Texto | Nombre de la región (si no hay `label`) |
| `previous`, `next`, `today` | Texto | Botones de navegación |
| `day`, `week`, `month`, `timeline` | Texto | Selector de vista |
| `views` | Texto | Nombre del grupo del selector de vista |
| `resources` | Texto | Panel o lista de recursos; encabezado de Timeline |
| `allDay` | Texto | Región de día completo |
| `tooManyResources` | Texto | Aviso cuando la vista Día recibe más de 5 recursos |
| `now` | Texto | Indicador de hora actual |
| `moreEvents` | `(n) => texto` | `+N` de la vista Mes |
| `outOfRange` | `(n, desde, hasta) => texto` | Aviso de eventos fuera del rango visible |
| `noEvents` | Texto | Estado vacío |
| `loading` | Texto | Nombre accesible del esqueleto |
| `retry` | Texto | Botón de reintento |
| `close` | Texto | Cerrar la hoja del día (teléfono) |
| `monthDay` | `(fecha, n) => texto` | Nombre accesible de cada día del Mes ("martes 29 de septiembre, 3 eventos") |
| `unavailable` | `(inicio, fin, motivo) => texto` | Bloqueo, para lectores de pantalla |
| `eventName` | `(evento, recurso, inicio, fin, estado) => texto` | Nombre accesible de cada evento |
| `openEnded` | `(inicio) => texto` | Evento sin hora final |
| `createEvent` | `(recurso, fecha, hora) => texto` | Botón de creación por teclado (visualmente oculto) |
| `resourceStatus` | `{ busyUntil(h), available, availableNext(h), blocked, activeEvent }` | Lista de recursos en teléfono |
| `conflict` | `{ overlap, blockedTime, outsideAvailability, invalidDuration, resourceConflict }` | Anuncios de conflicto |
| `rangeTitle` | `(vista, inicio, fin) => texto` | Título de la barra y anuncio al navegar (si falta, se formatea con `locale`) |

---

## Estructura accesible

```html
<div class="g-calendar g-calendar--view-week g-calendar--density-comfortable …" role="region" aria-label="…" aria-busy="true">
  <div class="g-calendar__toolbar" role="toolbar">
    <button class="g-calendar__prev" aria-label="Anterior">…</button>
    <button class="g-calendar__today">Hoy</button>
    <button class="g-calendar__next" aria-label="Siguiente">…</button>
    <h2 class="g-calendar__title">lunes, 29 de septiembre de 2026</h2>
    <div class="g-calendar__views" role="group" aria-label="Vista">
      <button aria-pressed="true">Día</button> … <button aria-pressed="false">Timeline</button>
    </div>
  </div>
  <div class="g-calendar__status" role="status">…</div>          <!-- aviso de estado: vacío, límite de recursos, solo lectura -->
  <div class="g-calendar__viewport">
    <!-- Día / Semana -->
    <div class="g-calendar__grid">
      <div class="g-calendar__axis" aria-hidden="true">…</div>
      <div class="g-calendar__col" data-date="2026-09-29" data-resource="a">
        <div class="g-calendar__availability" aria-hidden="true">…</div>
        <ul class="g-calendar__events" aria-label="lun 29, Recurso A">
          <li class="g-calendar__block"><span class="g-calendar__sr">No disponible, 14:00 a 15:00, Descanso</span></li>
          <li><button class="g-calendar__event" aria-label="Cita, 12:43 a 13:12, Recurso A" data-type="…" data-status="…">…</button><span class="g-calendar__handle" aria-hidden="true"></span></li>
        </ul>
        <div class="g-calendar__now" aria-hidden="true"></div>
        <button class="g-calendar__sr g-calendar__create">Crear evento en Recurso A, lun 29, a las 09:00</button>
      </div>
    </div>
  </div>
  <div class="g-calendar__live" aria-live="polite"></div>
</div>
```

- **Región con nombre** y **barra de herramientas** con botones que tienen nombre. Los botones de vista llevan `aria-pressed` (los booleanos ARIA se emiten como `"true"`/`"false"`).
- **Los eventos van en una lista `<ul>` en orden cronológico**; el orden del DOM es el temporal, no el visual (la posición es absoluta). Los bloqueos son elementos de la misma lista, con texto para lectores.
- **Nombre del evento:** botón con `aria-label` compuesto (título, horario, recurso, estado) con `labels.eventName`. El color nunca es el único indicador.
- **El tirador** (`g-calendar__handle`) **no** está dentro del botón del evento y es decorativo; la redimensión por teclado usa `Shift`+flecha.
- **El eje, la disponibilidad, la línea de ahora y el fantasma** son decorativos (`aria-hidden`).
- **Una sola línea de ahora por ventana** (en Timeline cruza todas las filas).
- **Mes:** `<table>` con encabezados de columna; cada celda tiene un botón de fecha con nombre (`día, N eventos`) y una lista de eventos con `+N`.
- **Timeline:** lista de recursos; cada fila tiene su cabecera y su lista de eventos.
- **Región viva educada** (`aria-live="polite"`), siempre presente: anuncia la navegación y los conflictos.
- **Estados:** `loading` con `aria-busy` y esqueleto con nombre; `error` con `role="alert"`; vacío con `role="status"`.

## Adaptación por dispositivo (estructura, no tamaño)

Se decide por el **ancho de la propia raíz** (consulta de contenedor), no por el de la ventana.

| Ancho de la raíz | Estructura |
| --- | --- |
| Más de ~700px | Escritorio: vistas completas; varios recursos en columnas o filas |
| Hasta ~700px | Tableta: el panel de recursos de la aplicación pasa a un panel plegable (`aria-expanded`, `aria-controls`); Día y Timeline mantienen su estructura |
| Hasta ~520px | Teléfono: **Día** con varios recursos y **Timeline** pasan a una **lista de recursos con estado** ("Ocupado hasta 10:30", "Disponible · próximo evento 10:30", "Bloqueado"); tocar un recurso abre su Día. **Semana** es una tira de siete días (con puntos de eventos) más la agenda del día seleccionado. **Mes** es una cuadrícula compacta con puntos; tocar un día abre una hoja inferior con sus eventos |

Los umbrales (~700px y ~520px) son **constantes literales de contenedor** (excepción documentada, DECISIONS.md #34, ampliada en #39): una consulta de contenedor no admite `var()`.

## Interacciones

- **Crear:** un clic o un toque en un hueco emite `create-request` (con `start` ajustado a `snapInterval`); un arrastre sobre el hueco emite también `end`. Cada columna (o fila) tiene además un botón visualmente oculto "Crear evento…" para el teclado.
- **Mover:** arrastrar un evento (o `Alt`+flecha, un paso de `snapInterval`). Mientras se arrastra, se ve un fantasma en la posición propuesta, que cambia de estilo si hay conflicto. En columnas (Día, Semana) puede cambiar de día y de recurso; en Timeline, de recurso.
- **Redimensionar:** arrastrar el tirador (o `Shift`+flecha). El tirador es visible con hover, **selección** o foco (la selección lo hace alcanzable en táctil).
- **Cancelar:** `Esc` durante un arrastre lo cancela sin emitir nada.
- **Selección:** un clic, un toque o `Enter` sobre un evento lo selecciona (`update:selectedEventId`) y muestra el tirador; el slot `detail` se abre si existe.
- **Alto mínimo del evento:** el evento nunca es menor que **`max(24px, --g-space-1 × 6)`** (y **44px** con `pointer: coarse`, `tokens.md` §7); su **posición** sigue siendo la real, y el alto mínimo cuenta para calcular los carriles.
- **Eventos abiertos:** se dibujan de su inicio a la hora actual (mínimo 30 minutos), con marca de "activo", y no se redimensionan.

## Teclado

| Tecla | Acción |
| --- | --- |
| Tab / Shift+Tab | **Día, Semana y Timeline** tienen **un solo punto de tabulación** (tabulación itinerante, con los eventos de día completo incluidos); **Mes y la agenda móvil** usan el orden natural del documento; la barra y las cabeceras tienen los suyos |
| ↑ / ↓ (en Timeline: ← / →) | Evento anterior o siguiente de la misma lista |
| → / ← (en Timeline: ↓ / ↑) | Primer evento de la lista vecina (día o recurso) |
| Inicio / Fin | Primer o último evento de la vista |
| Enter / Espacio | Seleccionar y abrir el detalle |
| Esc | Cierra el detalle y devuelve el foco al evento; cancela un arrastre |
| Alt + flecha en el eje temporal | **Mover** el evento un `snapInterval` (emite `event-move-request`) |
| Shift + flecha en el eje temporal | **Cambiar la duración** un `snapInterval` (emite `event-resize-request`) |
| Enter en "Crear evento…" | Emite `create-request` (`source: keyboard`) |

Es la alternativa al arrastre que exige WCAG 2.5.7. Un evento abierto no admite `Shift`+flecha.

---

## Tokens consumidos

| Token | Para qué |
| --- | --- |
| `--g-color-surface`, `--g-color-surface-sunken`, `--g-color-bg` | Fondo de la ventana, de la barra y de las cabeceras |
| `--g-color-border`, `--g-color-border-strong`, `--g-color-border-control` | Líneas de la rejilla, de las columnas y de los controles |
| `--g-color-{color}`, `--g-color-{color}-soft`, `--g-color-on-{color}`, `--g-color-{color}-text` | Color de un evento por su `color` (borde, relleno suave, texto) |
| `--g-color-text`, `--g-color-text-muted`, `--g-color-text-subtle` | Texto principal, secundario (hora, subtítulo) y de estados |
| `--g-color-danger-text`, `--g-color-focus` | Conflicto y error; anillo de foco |
| `--g-radius-sm`, `--g-radius-md`, `--g-radius-pill` | Eventos, popover y hoja, controles |
| `--g-space-1` | Unidad de la altura de hora, del alto de fila, del ancho del eje y de los rellenos (ver `tokens.md` §4) |
| `--g-font-ui` | Familia |
| `--g-text-caption-*`, `--g-text-body-sm-*`, `--g-text-body-*`, `--g-text-title-sm-*`, `--g-text-action-weight` | Horas, eventos, encabezados y título |
| `--g-border-width`, `--g-focus-width`, `--g-focus-offset` | Bordes y foco |
| `--g-duration-fast`, `--g-duration-press`, `--g-ease-standard`, `--g-ease-out` | Transiciones y vista previa del arrastre |

**Tokens nuevos** (agregados a `docs/contract/tokens.md` con este contrato):

| Token | Defecto | Para qué |
| --- | --- | --- |
| `--g-calendar-grid-color` | `var(--g-color-border)` | Líneas de la cuadrícula |
| `--g-calendar-unavailable-color` | `var(--g-color-border-strong)` | Color del patrón de indisponibilidad y de bloqueo (junto con un patrón que no depende solo del color) |
| `--g-calendar-now-color` | `var(--g-color-danger)` | Línea y marca de la hora actual (≥ 3:1 contra la superficie) |

**Medidas derivadas, no tokens:** altura de una hora = `--g-space-1` × 11, 15 o 20 (`compact`, `comfortable`, `spacious`; con `space` 4: 44, 60 y 80px); ancho del eje = `--g-space-1` × 14; ancho mínimo de columna de recurso = `--g-space-1` × 33; ancho de la cabecera de recurso en Timeline = `--g-space-1` × 38; alto mínimo de evento (arriba); ancho de una hora en Timeline = `--g-space-1` × 20, 28 o 38.

## Clases (contrato entre bruno y coco)

Bruno las emite; coco las estiliza. Ninguno usa otras.

| Clase | Elemento | Cuándo |
| --- | --- | --- |
| `g-calendar` | Raíz | Siempre |
| `g-calendar--view-{view}` | Raíz | Siempre |
| `g-calendar--density-{density}` | Raíz | Siempre |
| `g-calendar--mode-{desktop\|tablet\|phone}` | Raíz | Según el ancho de la raíz |
| `is-readonly`, `is-disabled`, `is-loading`, `is-error` | Raíz | Según las props |
| `g-calendar__toolbar`, `__prev`, `__today`, `__next`, `__title`, `__views` | Barra | Siempre |
| `g-calendar__retry`, `__sheet-close` | Botón de reintento; botón de cerrar la hoja | Con `error`; con la hoja abierta |
| `g-calendar__resource-select` | Selector de recurso de la Semana | Vista `week` con varios recursos |
| `g-calendar__status` | Aviso de estado | Siempre presente (vacío si no hay aviso) |
| `g-calendar__viewport` | Ventana | Siempre |
| `g-calendar__grid`, `__axis`, `__col`, `__head`, `__allday` | Vistas Día y Semana | Según la vista |
| `g-calendar__availability` | Capa de disponibilidad | Si hay reglas |
| `g-calendar__events` | Lista de eventos y bloqueos | Siempre |
| `g-calendar__allday-events` | Lista de eventos de día completo de una columna | Si hay eventos de día completo |
| `g-calendar__event` | Botón del evento | Siempre |
| `g-calendar__event--sm` | Botón del evento | Alto menor que el necesario para la hora |
| `g-calendar__event--open` | Botón del evento | Evento abierto |
| `is-selected` | Botón del evento y su elemento de lista | Evento seleccionado |
| `is-conflict` | Botón del evento y fantasma | Conflicto |
| `g-calendar__handle` | Tirador de redimensión | Si el evento se puede redimensionar |
| `g-calendar__block` | Bloqueo | Siempre que haya bloqueo |
| `g-calendar__now` | Línea de ahora | Si `showNowIndicator` y la hora está visible |
| `g-calendar__ghost` | Vista previa de arrastre | Solo durante una interacción |
| `g-calendar__create` | Botón de creación por teclado | Si se puede crear |
| `g-calendar__timeline`, `__row`, `__label`, `__track` | Timeline | Vista `timeline` |
| `g-calendar__month`, `__day`, `__more`, `__dots` | Mes | Vista `month` |
| `g-calendar__resources`, `__resource`, `__agenda`, `__strip`, `__sheet` | Teléfono | Modo `phone` |
| `g-calendar__detail` | Detalle del evento | Con el slot `detail` |
| `g-calendar__event-title`, `__event-time` | Título y hora dentro del botón del evento | Siempre |
| `g-calendar__head-title`, `__label-title`, `__label-sub`, `__rows` | Interior de cabeceras, etiquetas de recurso y lista de filas de Timeline | Según la vista |
| `is-today`, `is-outside` | Cabecera, columna y celda de Mes | Hoy, o fuera del mes mostrado (con `aria-current="date"` en hoy) |
| `g-calendar__skeleton` | Esqueleto | `loading` |
| `g-calendar__sr` | Texto solo para lectores de pantalla | Bloqueos y botones de creación |
| `g-calendar__live` | Región viva | Siempre |

---

## Carga y vacío con el motor común (#540; segunda entrega)

Adopción de `design/contracts/load-region.md`, contratada el 2026-10-08 y **pendiente** (bruno y coco). Sin cambio de API salvo `labels.slow` (opcional).

- **Motor** dentro de `loading` (#532): retraso de 200 ms, mínimo de 400 ms, espera larga a los 5 s con `labels.slow`.
- **Esqueleto `aria-hidden`** y **sin `aria-label`**: hoy `g-calendar__skeleton` es un `div` genérico con `aria-label` (nombre prohibido en `generic`; hallazgo del inventario de kiwi) y repite `aria-busy`. `labels.loading` pasa a escribirse en una **región cortés presente desde el montaje**, fuera del elemento con `aria-busy` (patrón de #265), cuando el esqueleto se ve.
- **El error deja de ser `role="alert"`:** anuncio cortés en esa región (#533, #541).
- **Sin pulso** (`g-calendar-pulse` fuera, #539); **tono `--g-color-mold`** (#538) en lugar de `--g-color-surface-sunken`; `forced-colors` con `GrayText`.
- Slot `empty`: **`GEmpty`** como receta.

## Resolución de hallazgos de r01

| # | Hallazgo | Resolución | Base |
| --- | --- | --- | --- |
| 1 | Estructura de componentes | Un `GCalendar` con las vistas como piezas internas; las 20 piezas de la especificación son la arquitectura interna (bruno decide la partición), no API pública. Las vistas exportables quedan para v0.2 | Superficie pública mínima; la especificación lista una sola API `Calendar` |
| 2 | Tipos de datos y zona horaria | `Date` o ISO 8601; texto sin desfase = hora local del calendario; `timezone` obligatoria (aviso en desarrollo y `UTC` explícita si falta) | Especificación §26 |
| 3 | Textos traducibles | Mapa `labels` sin valores por defecto, con funciones para los textos con datos | Grana es internacional (criterio de `loadingText`) |
| 4 | Eventos emitidos | La lista de la especificación, con los `payload` del prototipo y `conflicts[]` | Especificación §30 |
| 5 | Umbrales por ancho | Constantes literales de contenedor (~700px y ~520px), ampliando la excepción #34 | Una consulta de contenedor no admite `var()` |
| 6 | Tokens nuevos | Solo tres (`--g-calendar-grid-color`, `--g-calendar-unavailable-color`, `--g-calendar-now-color`); las medidas se derivan de `--g-space-1` | Todo lo demás sale de tokens vigentes |
| 7 | Slots | La lista de la especificación más `detail`, `toolbar-end` y `empty`; sin interactivos dentro del botón del evento | Especificación §31 |
| 8 | `density` | Prop propio con `compact`/`comfortable`/`spacious` (precisado en `api.md`) | Especificación §43 |
| 9 | Reglas de conflicto | El componente solo emite; tipos de la especificación (+ `resourceConflict`) | Especificación §33 |
| 10 | Alternativa por teclado al arrastre | `Alt`+flecha mueve, `Shift`+flecha cambia la duración, un `snapInterval` por paso | WCAG 2.5.7 |
| 11 | Filtros y búsqueda | Externos: el componente recibe `resources` ya filtrados | Especificación §35, §36 |
| 12 | Semana multirrecurso y mes agregado | Fuera de v0.1; Semana admite un recurso y Mes mezcla eventos | Decisión del usuario (DECISIONS.md #38) |
| 13 | Virtualización | Fuera de v0.1; la API por rango no la impide | Decisión del usuario (DECISIONS.md #38) |
| 14 (lima) | Alto mínimo del evento de la especificación (20px) | **24px** como mínimo y **44px** con `pointer: coarse` | WCAG 2.5.8 y `tokens.md` §7: la especificación proponía 20px |
| 15 (lima) | Selección de un evento y detalle | `selectedEventId` (`v-model`) y slot `detail`; `Esc` cierra y devuelve el foco | Especificación §27 (popover), WCAG 2.4.3 |
| 16 (lima) | Cancelar un arrastre | `Esc` durante un arrastre lo cancela sin emitir | Cancelación del puntero (WCAG 2.5.2) |

## Límites conocidos

- **Horario de verano:** el motor mide minutos transcurridos desde el inicio del día; una jornada de 23 o 25 horas se dibuja con esa duración real, y la etiqueta de hora sale de la zona. Es un caso a verificar antes de estabilizar.
- **Lectores de pantalla:** la lista cronológica es la exposición más fiable, pero cómo se anuncian los conteos, las solicitudes y los conflictos está por verificar con lectores reales.
- **Tabla de tamaños:** los eventos de pocos minutos ocupan un alto mínimo de 24px (44px en táctil); en horas muy densas, los carriles pueden volverse estrechos.
- **Sin recurrencia, sin virtualización, sin mes agregado ni Agenda ni Año** en v0.1.

## Abierto (no bloquea el paso siguiente)

- **Lector de pantalla real:** anuncios de navegación, conflicto y estados.
- **Táctil real:** arrastre, tirador y hoja inferior con dedos.
- **Cambio de horario de verano** en la fecha visible.
- **Patrones de disponibilidad y bloqueo:** coco decide cómo se ven con los tokens nuevos y comprueba su contraste (el texto sobre el patrón ≥ 4.5:1).

## Contraste de lo pulsado y de hoy (`tokens.md` §7.1; DECISIONS.md #431 y #432)

- **Botones de vista con `aria-pressed="true"`** (barra y tira): relleno `--g-color-primary` y texto `--g-color-on-primary` sin cambio; **contorno `--g-color-primary-text`** (borde en la barra; trazo interior en la tira, que no tiene borde; el anillo de foco no cambia).
- **Hoy** (cabecera y celda de Mes, rellenos `primary`): trazo interior `--g-color-primary-text`. Hoy también lleva `aria-current="date"`.
- Sin cambio en el tema por defecto. Pendiente de **coco** (encargo único en `checkbox.md` §«Contraste de lo marcado»).
