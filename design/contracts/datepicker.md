# Contrato · GDatePicker

**Dueño:** lima · **Estado:** aprobado · **Basado en:** `design/lab/datepicker/r01/` (kiwi)
**Tag:** `g-datepicker` · **Categoría:** entradas

Selector de **una fecha o de un rango de fechas** (patrón *date picker dialog* de WAI-ARIA APG). Un solo componente con dos formas: **con campo(s)** (un botón que abre la superficie en un popover, o en una hoja inferior en móvil) y **`inline`** (solo la superficie, para un Dialog o una página). Muestra uno o dos meses según el ancho disponible. Alcance decidido por el usuario (DECISIONS.md #63): un componente con campo + popover + superficie en línea, valor como cadena ISO `YYYY-MM-DD` y hoja inferior con un mes en móvil. **Distinto de `GCalendar`** (planificador de eventos).

## Principios

- **El valor es una fecha, no un instante.** Cadena ISO `YYYY-MM-DD`, sin hora ni zona: no hay desfase de un día por zona horaria y se ordena como texto. El rango es `{ start, end }`.
- **El rango es una superficie continua.** Una franja detrás de botones circulares; el inicio y el fin se distinguen por **forma y por nombre accesible**, no solo por color (WCAG 1.4.1).
- **Un solo tabstop y un nombre completo por día** (patrón APG): «miércoles, 28 de octubre de 2026, inicio del rango».
- **Presenta y emite intención.** El valor es el prop; si el consumidor no lo actualiza, la superficie sigue mostrando el prop.
- **Solo emite valores completos.** Elegir el inicio de un rango **no** emite `update:modelValue`: el valor pendiente vive dentro hasta completarse (una reserva a medias no debe llegar al formulario). El evento `start` avisa del inicio.
- **Sin textos por defecto** (Grana es internacional): **todo texto que no sea una fecha** lo pone la aplicación con `labels` y `proximity`. Los nombres de mes y de día, el orden y el formato de las fechas los da `Intl` con `locale`.
- **Un solo sistema adaptable:** uno o dos meses por **medida real**, popover u hoja según el visor; sin componentes por dispositivo.

## Props

| Prop | Tipo | Valores | Default | Origen |
| --- | --- | --- | --- | --- |
| `modelValue` | String \| Object \| null | `single`: ISO; `range`: `{ start, end }` (ISO cada uno) | `null` | compartida |
| `mode` | String | `single` `range` | `single` | propia |
| `inline` | Boolean | | `false` | propia |
| `open` | Boolean | | `false` | propia (con `update:open`; solo sin `inline`) |
| `min` | String | ISO | sin valor | propia |
| `max` | String | ISO | sin valor | propia |
| `disabledDates` | Function | `(iso: string) => boolean` | sin valor | propia |
| `months` | String \| Number | `auto` `1` `2` | `auto` | propia |
| `locale` | String | etiqueta BCP 47 | la de `<html lang>` (o `navigator.language`) | propia |
| `firstDay` | Number | 0 (domingo) a 6 | el del `locale` (`Intl.Locale`), si no, 1 | propia |
| `labels` | Object | ver "Textos (`labels`)" | `{}` | propia |
| `proximity` | Array | `[{ days, label, ariaLabel? }]` | `[]` | propia (solo `range`) |
| `summary` | Boolean | | `true` | propia |
| `closeOnSelect` | Boolean | | sin valor (regla en "Cierre") | propia |
| `anchor` | String \| Element | selector CSS o elemento | el campo | propia |
| `color` | String | `brand` `accent` `neutral` `success` `warning` `danger` `info` | `brand` | compartida (color de la selección) |
| `variant` | String | `outline` `soft` | `outline` | compartida (subconjunto, como `GInput`; solo el campo) |
| `size` | String | `xs` `sm` `md` `lg` `xl` | `md` | compartida (solo el campo) |
| `density` | String | `default` `comfortable` `compact` | `default` | compartida (solo el campo) |
| `rounded` | String | `none` `xs` `sm` `md` `lg` `xl` `pill` | sin valor: `sm` | compartida (solo el campo) |
| `block` | Boolean | | `false` | compartida (solo el campo) |
| `disabled` | Boolean | | `false` | compartida |
| `readonly` | Boolean | | `false` | compartida |
| `label` | String | texto libre | sin valor | propia (campo) |
| `hint` | String | texto libre | sin valor | propia (campo) |
| `error` | String | texto libre | sin valor | propia (campo) |
| `placeholder` | String | texto libre | sin valor | propia (campo) |
| `required` | Boolean | | `false` | propia (campo) |
| `name` | String | | sin valor | propia (campo) |
| `id` | String | | generado | propia (campo) |
| `split` | Boolean | | `false` | propia (`range` con campo: Desde / Hasta) |
| `labelStart`, `labelEnd` | String | texto libre | sin valor | propia (con `split`) |
| `placeholderStart`, `placeholderEnd` | String | texto libre | sin valor | propia (con `split`) |

`loading` **no aplica** (un selector de fechas no espera datos suyos; la aplicación bloquea con `disabled`).

### Reglas de props

- **`modelValue`:** en `single`, `String` ISO o `null`. En `range`, `{ start, end }` con ambos ISO, o `null`. Un valor con formato inválido (o con `end` anterior a `start`, o un objeto en `single`) se trata como `null` y avisa **una vez** en desarrollo. El componente **no recorta** un valor fuera de `min`/`max`: lo muestra tal cual (la aplicación valida).
- **`mode`:** cambiar `mode` con un valor del otro tipo lo trata como inválido (`null`).
- **`inline`:** solo la superficie (sin campo, sin popover, sin `open`); ignora las props de campo (`label`, `hint`, `error`, `placeholder`, `required`, `name`, `split`, `size`, `density`, `rounded`, `block`, `variant`) y avisa en desarrollo una vez si se pasan. **Dentro de un `GDialog` se usa `inline`**: nunca se abre un popover ni otro Dialog.
- **`open`:** controla el popover con `update:open`; sin `inline`. Abrir y cerrar por el usuario emite `update:open`, `open` y `close`.
- **`min`, `max`, `disabledDates`:** un día fuera de `[min, max]` o para el que `disabledDates(iso)` devuelve `true` es **no disponible** (Disabled): no elegible, con `aria-disabled="true"`, y sigue en el orden de las flechas (no se salta). Un rango puede **contener** días no disponibles en medio; el componente no lo impide (la aplicación decide con `change`).
- **`months`:** `auto` decide por la **medida real** (ver "Uno o dos meses"); `1` o `2` lo fijan.
- **`locale`, `firstDay`:** los meses, los días, el orden y el formato salen de `Intl.DateTimeFormat(locale)`. `firstDay` sin valor sigue al idioma.
- **`proximity`:** cada entrada `{ days, label, ariaLabel? }`: `days` entero ≥ 1 (cuántos días se agregan **a cada lado**), `label` el texto visible del chip («± 3 días»: la aplicación decide el texto), `ariaLabel` el nombre accesible (sin él, el nombre es `label`; si se da, **debe contener** el texto visible, WCAG 2.5.3). Vacío por defecto = sin chips. Con `mode="single"` se ignora. Los chips están **deshabilitados** sin rango completo. Ampliar respeta `min` y `max` (recorta al límite).
- **`summary`:** muestra bajo la superficie las fechas elegidas **formateadas por `Intl`** («28 oct – 3 nov 2026»), sin palabras. Para agregar texto («7 días», «elige la fecha final»), la aplicación usa el slot `summary`.
- **`closeOnSelect`:** sin valor, la regla es: `single` cierra al elegir; `range` cierra al completarse **salvo que haya `proximity`** (entonces se cierra con «Listo»). `true` o `false` lo fuerzan. Solo sin `inline`.
- **`anchor`:** selector o elemento al que se ancla el popover (por ejemplo, la barra de búsqueda completa); sin él, se ancla al campo (o al botón del slot `trigger`). El ancho disponible para decidir los meses es el del ancla.
- **`color`:** tiñe la selección (círculo de inicio, fin y fecha única con `--g-color-{color}` y `--g-color-on-{color}`, y la franja con `--g-color-{color}-soft`). **No** afecta al anillo de foco (`--g-color-focus`).
- **Campo (`label`, `hint`, `error`, `required`, `placeholder`, `name`, `id`, `variant`, `size`, `density`, `rounded`, `block`):** exactamente como `GSelect` y `GInput`: `label` obligatorio como nombre accesible (sin `label`, sin slot `label` y sin `aria-label`/`aria-labelledby` en `$attrs`: `console.warn`), `error` deja el campo inválido (`aria-invalid`, mensaje visible con región viva siempre renderizada), **el componente no valida**, `required` da `aria-required` y una marca `aria-hidden`.
- **`split`:** en `range` con campo, en lugar de un campo muestra **dos botones** (Desde y Hasta) que abren **la misma superficie**; `labelStart` y `labelEnd` son sus nombres accesibles (obligatorios: aviso en desarrollo si faltan) y `label` (opcional) titula el grupo (`role="group"`). Sin `split` en `range`, un solo campo muestra «28 oct – 3 nov 2026» (con `placeholder` si está vacío). El botón activo lleva `aria-expanded="true"`.
- **`name`:** con `name`, el componente renderiza `<input type="hidden">`: en `single`, `name` con el ISO (o `''`); en `range`, **dos**: `name-start` y `name-end`. Con `disabled`, ocultos también. **Límite:** un campo oculto no participa en la validación nativa (como `GSelect`).
- **`readonly`:** el campo es enfocable pero no abre; el valor se envía. **`disabled`:** atributo nativo, sin foco ni envío. En `inline`, `readonly` deja la superficie navegable pero sin elegir, y `disabled` la deshabilita entera.
- **`id`:** si no se da, se genera uno estable (`useId`); de él derivan los ids de la etiqueta, el campo, el popover, los meses, la ayuda y el error.
- **Resto de atributos** (`aria-*`, `data-*`, escuchas): van al **botón del campo** (o al primero con `split`); en `inline`, a la raíz de la superficie. `class` y `style` van a la raíz (`inheritAttrs: false`).

## Textos (`labels`)

`labels` es un objeto de textos de la aplicación; ninguno tiene valor por defecto. Los marcados **requerido** avisan en desarrollo (una vez por instancia) si faltan; los demás degradan sin fallar (por ejemplo, un día sin `labels.today` se nombra solo con su fecha).

| Clave | Uso | Requerido |
| --- | --- | --- |
| `prev`, `next` | Nombre de los botones de mes anterior y siguiente | Sí |
| `dialog` | Nombre accesible del popover (`role="dialog"`) | Sí, sin `inline` |
| `close` | Nombre del botón de cierre de la hoja móvil | Sí, sin `inline` |
| `today`, `selected`, `rangeStart`, `rangeEnd`, `rangeSingle`, `inRange`, `unavailable` | Sufijo del nombre de un día: «…, hoy», «…, seleccionada», «…, inicio del rango», «…, fin del rango», «…, inicio y fin del rango», «…, dentro del rango», «…, no disponible» | No (recomendados) |
| `clear`, `done` | Textos de «Limpiar» y «Listo». **Cada acción solo se renderiza si tiene texto** (como `clearLabel` en `GSelect`); `Listo` se necesita en la hoja móvil y con `proximity` | No |
| `proximityGroup` | Nombre del grupo de chips | No (recomendado con `proximity`) |
| `announceStart`, `announceEnd`, `announceDate`, `announceWiden`, `announceClear` | Mensajes de la región viva con marcadores `{date}`, `{start}`, `{end}`, `{days}` | No |

- **Marcadores:** `{date}`, `{start}`, `{end}` se sustituyen por la fecha completa («miércoles, 28 de octubre de 2026»); `{days}` por el número de días **inclusivos** del rango. Los textos son cadenas (serializables), no funciones.
- Sin `announce*`, el componente **no anuncia** pasos (los nombres de los días y el resumen siguen ahí).

## Uno o dos meses

- Con `months="auto"`: **dos** meses si el ancho disponible los deja con celdas cómodas, **uno** si no. El umbral **no es un número literal**: es `2 × (7 × celda + relleno) + separación + relleno de la superficie`, con la **celda medida** (`--g-space-1 × 10`, y `44px` con `pointer: coarse`). Con `space` 4 son ≈ 648px (≈ 704px táctil). El ancho disponible es el del contenedor (en línea), el del ancla (popover) o el del visor menos el margen (hoja).
- Se recalcula al redimensionar (observador de tamaño); **cambiar el número de meses no pierde el foco ni la selección**.
- Es preferible **un mes bien resuelto** a dos comprimidos: la celda **nunca** baja de `24px` (mínimo del contrato) y con puntero táctil de `44px`.
- **En dos meses**, los días de un mes vecino se dejan **en blanco** (no repiten fechas visibles del otro mes); **en un mes**, se muestran atenuados y elegibles (Outside Month).
- Navegación: en dos meses, «anterior» solo en el primer mes y «siguiente» solo en el último (el otro botón conserva su hueco, oculto y fuera del orden de foco).

## Estados de día

| Estado | Clase | Significado | No depende solo del color |
| --- | --- | --- | --- |
| Default | `g-datepicker__day` | Disponible del mes | — |
| Inactive | `is-inactive` | Elegible, **antes del inicio** mientras se elige el final; **reinicia el inicio** al tocarlo | Cursiva |
| Today | `is-today` | Hoy | Aro y punto (forma) |
| Hovered | `:hover` | Puntero encima | Fondo |
| Focused | `:focus-visible` | Foco de teclado | Contorno de `--g-focus-width` |
| Selected | `is-selected` | Fecha única, inicio o fin | Círculo relleno (forma) |
| In Range | `is-in-range` (celda) | Dentro del rango | Franja continua |
| Range Start | `is-range-start` (celda) | Primer día | Círculo + franja que sale hacia el fin |
| Range End | `is-range-end` (celda) | Último día | Círculo + franja que llega desde el inicio |
| Disabled | `is-disabled` | No disponible (`min`, `max`, `disabledDates`) | Tachado |
| Outside Month | `is-outside` | Día del mes vecino (solo en un mes) | Atenuado |
| Vista previa | `is-preview` (celda) | Franja provisional mientras se elige el final | Franja más suave |

- **Inicio = fin** (rango de un día): círculo relleno sin franja; nombre «…, inicio y fin del rango» (`labels.rangeSingle`).
- **Hoy y seleccionado a la vez:** círculo relleno con aro interior.
- **Ningún estado cambia el tamaño de la celda**: el círculo mide lo mismo que el botón (`--g-space-1 × 10`, `44px` táctil) y la franja va detrás con su propio alto.
- **Franja continua:** salta de fila con extremos redondeados y, en dos meses, termina redondeada en el último día del primer mes y arranca redondeada en el primero del segundo. Con `forced-colors`, la franja conserva borde superior e inferior.

## Estructura accesible

```html
<div class="g-datepicker g-datepicker--mode-range g-datepicker--variant-outline g-datepicker--size-md g-datepicker--color-brand is-open …">
  <span class="g-datepicker__label" id="ID-label">Fechas<span class="g-datepicker__required" aria-hidden="true">*</span></span>
  <!-- un campo (sin split) -->
  <button class="g-datepicker__field" id="ID" type="button" aria-haspopup="dialog" aria-expanded="true" aria-controls="ID-pop"
          aria-labelledby="ID-label ID-value" aria-describedby="ID-hint ID-error" aria-invalid="true" aria-required="true" aria-readonly="true">
    <span class="g-datepicker__icon" aria-hidden="true">…</span>
    <span class="g-datepicker__value" id="ID-value">28 oct – 3 nov 2026</span>      <!-- con placeholder: además g-datepicker__value--placeholder -->
  </button>
  <!-- con split: dos botones g-datepicker__field (Desde, Hasta) en un role="group", cada uno con su etiqueta -->
  <input type="hidden" name="fechas-start" value="2026-10-28"><input type="hidden" name="fechas-end" value="2026-11-03">
  <div class="g-datepicker__hint" id="ID-hint">…</div>
  <div class="g-datepicker__error" id="ID-error" aria-live="polite">…</div>

  <div class="g-datepicker__pop" id="ID-pop" role="dialog" aria-label="Elegir fechas" popover="manual">
    <div class="g-datepicker__sheet-head">                                           <!-- solo visible en la hoja móvil -->
      <button class="g-datepicker__sheet-close" type="button" aria-label="Cerrar">…</button>
    </div>
    <div class="g-datepicker__surface"> … (la superficie; con inline es la raíz) … </div>
  </div>
</div>
```

**Superficie (con o sin popover):**

```html
<div class="g-datepicker__surface">
  <div class="g-datepicker__months">
    <section class="g-datepicker__month" aria-labelledby="ID-m0">
      <div class="g-datepicker__head">
        <button class="g-datepicker__nav g-datepicker__nav--prev" type="button" aria-label="Mes anterior"><i aria-hidden="true"></i></button>
        <h3 class="g-datepicker__title" id="ID-m0" aria-live="polite"><span>octubre</span> <span>2026</span></h3>
        <button class="g-datepicker__nav g-datepicker__nav--next" type="button" hidden aria-hidden="true" tabindex="-1">…</button>  <!-- en el primero de dos meses -->
      </div>
      <table class="g-datepicker__grid" role="grid" aria-labelledby="ID-m0">
        <thead><tr><th scope="col"><span aria-hidden="true">L</span><span class="g-datepicker__sr">lunes</span></th> …</tr></thead>
        <tbody><tr>
          <td role="gridcell" class="is-range-start …" aria-selected="true">
            <button class="g-datepicker__day is-selected is-today" type="button" tabindex="0" aria-label="miércoles, 28 de octubre de 2026, hoy, inicio del rango">28</button>
          </td> …
        </tr> …6 filas… </tbody>
      </table>
    </section>
  </div>
  <div class="g-datepicker__foot">
    <div class="g-datepicker__chips" role="group" aria-label="Ampliar el rango">
      <button class="g-datepicker__chip" type="button" data-days="3" disabled>± 3 días</button> …
    </div>
    <div class="g-datepicker__bar">
      <div class="g-datepicker__summary">28 oct – 3 nov 2026</div>
      <div class="g-datepicker__actions"><button class="g-datepicker__action" type="button">Limpiar</button><button class="g-datepicker__action g-datepicker__action--primary" type="button">Listo</button></div>
    </div>
  </div>
  <div class="g-datepicker__sr" role="status" aria-live="polite"></div>     <!-- anuncios (announce*) -->
</div>
```

- **Cuadrícula:** siempre **6 filas** (altura estable al navegar); en dos meses las celdas de otro mes van vacías y `aria-hidden`. **Un solo `tabindex="0"`** en toda la superficie (el día con foco; si no está visible, el primer día del mes); los demás días, `-1`.
- **Nombre del día:** `aria-label` = fecha completa (`Intl`) + sufijos de `labels` (orden: hoy, seleccionada o rango, no disponible). **El estado va en el nombre**, no solo en `aria-selected` (que sí se pone en la celda: `true` en fecha única, inicio, fin y días dentro del rango completo).
- **Encabezado de columna:** letra visible (`aria-hidden`) y nombre completo oculto (`g-datepicker__sr`).
- **Título del mes:** `h3` ligado a la cuadrícula por `aria-labelledby`, con `aria-live="polite"` para anunciar el cambio de mes. **Lleva un espacio entre mes y año** (corregido en r01: el nombre se leía «septiembre2026»).
- **Popover:** `role="dialog"` **no modal** (`popover="manual"`), con `aria-label` de `labels.dialog`; `aria-controls` del campo apunta a él.
- **Chips:** botones reales agrupados; deshabilitados con `disabled` nativo sin rango completo.
- **Objetivos:** día `--g-space-1 × 10` (40px con `space` 4) y `44px` con `pointer: coarse`; chips y acciones 32px y `44px` táctil; botón de cierre y de mes 44px en la hoja.

## Selección

- **`single`:** elegir un día lo fija y emite. **`range`:** primer toque = inicio (pendiente, con vista previa al mover el puntero o el foco); segundo toque = fin, y solo entonces emite; un tercer toque abre un rango nuevo. **Tocar un día anterior al inicio pendiente cambia el inicio** (no invierte el rango).
- **Pendiente:** el inicio pendiente vive dentro de la superficie; **cerrar el popover o pulsar Esc con un inicio pendiente lo descarta** (el valor no cambia).
- **Proximidad:** amplía ambos extremos `days` días y emite el rango nuevo (`update:modelValue` y `change`).
- **Limpiar:** emite `null` (`update:modelValue` y `change`) y deja la superficie sin selección.
- **Seleccionar un día de otro mes** (en un mes) lo elige y muestra ese mes.

## Cierre y foco (sin `inline`)

- Abrir: el foco va al **día elegido** (o al inicio del rango, o a hoy). Cerrar (Esc, «Listo», elegir con `closeOnSelect`): el foco **vuelve al campo** que abrió (con `split`, al botón que lo abrió).
- Cierra también con **clic fuera** y cuando **el foco sale** de la superficie (Tab): en ese caso **no** devuelve el foco (sigue el orden natural).
- Posición: debajo del ancla, o **encima** si no cabe debajo y hay más sitio arriba (clase `is-up`); bruno la entrega con variables CSS dinámicas (`--_x`, `--_top`, `--_bottom`, `--_max`; excepción a «sin estilos en línea»). Se recalcula al redimensionar y al desplazarse cualquier ancestro.
- **Móvil (≤ ~520px del visor):** el popover es una **hoja inferior** pegada abajo, de ancho completo, con `::backdrop`, asa, cabecera con cierre y **un mes** con botones y **deslizamiento horizontal** (umbral 48px y más horizontal que vertical). El CSS ignora las variables de posición. Umbral de consulta de medios **literal** (excepción: DECISIONS.md #42, #56 y #65).
- **En `inline`** no hay popover, foco de apertura ni cierre.

## Teclado

| Tecla | Acción |
| --- | --- |
| Tab / Shift+Tab | Campo → (abierto) día con foco → botones de mes, chips y acciones, en el orden del documento; con la superficie abierta, sale y **cierra** |
| Enter / Espacio / ↓ / Alt+↓ | En el campo: abre (foco al día elegido o a hoy) |
| ← / → | Día anterior / siguiente (invierten en RTL) |
| ↑ / ↓ | Misma fecha en la semana anterior / siguiente |
| Inicio / Fin | Primer / último día de la semana (según `firstDay`) |
| Re Pág / Av Pág | Mes anterior / siguiente (mismo día, o el último si no existe) |
| Mayús + Re Pág / Av Pág | Año anterior / siguiente |
| Enter / Espacio | Elige el día con foco |
| Esc | Cierra el popover y devuelve el foco al campo; descarta un inicio pendiente |

Si la fecha con foco sale de los meses visibles, **se desplazan los meses** para mostrarla, sin perder el foco. Los días no disponibles **reciben foco** (no se saltan) pero no se eligen.

## Slots

| Slot | Propósito | Alcance | Anatomía que debe conservar |
| --- | --- | --- | --- |
| `label` | Etiqueta con contenido rico (sustituye a `label`) | | Nunca interactivos |
| `hint` | Ayuda con contenido rico | | Conserva `ID-hint` |
| `error` | Mensaje de error con contenido rico | | Solo con `error`; conserva el `id` y la región viva |
| `trigger` | **Sustituye al campo** por el botón de la aplicación (por ejemplo, un segmento de una barra de búsqueda) | `{ id, expanded, controls, toggle, open, close, value, text }` | La aplicación pone `aria-haspopup="dialog"`, `:aria-expanded="expanded"` y `:aria-controls="controls"` en su botón y llama a `toggle`; `text` es el valor formateado; con este slot no se renderizan `label`, `hint`, `error`, `name` ni `split` (los pone la aplicación) |
| `summary` | Sustituye al resumen | `{ start, end, pending, days }` | Dentro de `g-datepicker__summary`; nunca interactivos |
| `day` | Contenido de un día (por ejemplo, un precio bajo el número) | `{ date, day, selected, inRange, disabled, outside }` | Dentro del `<button>` del día, **después del número**; **no** cambia el nombre accesible ni el tamaño de la celda; sin interactivos |
| `icon` | Icono del campo (sustituye al de calendario) | | Decorativo; envuelto en `g-datepicker__icon` (`aria-hidden`) |

Con el slot `trigger`, la aplicación es responsable del **nombre accesible y del foco visible** de su botón.

## Eventos

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `update:modelValue` | ISO, `{ start, end }` o `null` | El valor completo cambia: elegir en `single`; completar un rango; ampliar con proximidad; limpiar (`null`) |
| `change` | igual | Igual que `update:modelValue` (para escuchar sin `v-model`) |
| `start` | `{ date }` | Solo `range`: se elige el **inicio** (pendiente). Sirve para consultar disponibilidad o precios |
| `navigate` | `{ month }` (`YYYY-MM` del primer mes visible) | Cambia el mes visible (botones, teclado, deslizamiento) |
| `update:open` | Boolean | El popover se abre o se cierra |
| `open`, `close` | | El popover se abre / se cierra, por el motivo que sea |

**Nota para bruno:** los demás eventos (`focus`, `blur`, `keydown`…) **no se declaran**: como los atributos van al botón del campo, llegan al elemento nativo. Los mensajes de la región viva y el foco se gestionan **antes** de emitir. Exponer `open()`, `close()` y `focus()` con `defineExpose`.

## Tokens consumidos

| Token | Para qué |
| --- | --- |
| `--g-color-{color}`, `--g-color-on-{color}`, `--g-color-{color}-soft` | Círculo de selección, su texto y la franja |
| `--g-color-text`, `--g-color-text-muted`, `--g-color-text-subtle` | Días, encabezados de columna, atenuados (Outside Month, Inactive, Disabled) |
| `--g-color-surface`, `--g-color-surface-sunken`, `--g-color-border`, `--g-color-border-control`, `--g-color-focus` | Superficie, campo y foco |
| `--g-surface-inset`, `--g-surface-radius-inset`, `--g-surface-backdrop` | Superficie de la hoja móvil y `::backdrop` (sistema §11, como `GSelect` y `GDialog`) |
| `--g-shadow-2` | Sombra suave del popover |
| `--g-radius-*`, `--g-surface-radius` | Radio del campo (`rounded`) y de la superficie |
| `--g-space-1..12` | Celda (`× 10`), separación entre meses, relleno, altura del campo |
| `--g-font-ui`, `--g-text-body-sm-*`, `--g-text-caption-*`, `--g-text-action-weight` | Texto |
| `--g-border-width`, `--g-focus-width`, `--g-focus-offset` | Bordes y foco |
| `--g-glass-*` | **No** se usan (un selector de fechas no es de cristal en v0.1) |

**Tokens nuevos: ninguno.** Todo sale del contrato vigente (DECISIONS.md #63): la celda y el umbral de meses derivan de `--g-space-1`; el resto reutiliza colores, superficies y sombras.

## Clases (contrato entre bruno y coco)

Bruno las emite; coco las estiliza. Ninguno usa otras.

| Clase | Elemento | Cuándo |
| --- | --- | --- |
| `g-datepicker` | Raíz | Siempre |
| `g-datepicker--mode-{single\|range}`, `--variant-{v}`, `--size-{s}`, `--density-{d}`, `--color-{c}`, `--rounded-{r}`, `--block`, `--inline`, `--split` | Raíz | Según props |
| `is-open`, `is-disabled`, `is-readonly`, `is-invalid` | Raíz | Estados |
| `g-datepicker__label`, `__required`, `__hint`, `__error` | Etiqueta, marca, ayuda, error | Con campo |
| `g-datepicker__field`, `__icon`, `__value`, `__value--placeholder` | Botón(es) del campo | Con campo |
| `g-datepicker__pop`, `is-up` | Popover | Con campo |
| `g-datepicker__sheet-head`, `__sheet-close` | Cabecera y cierre de la hoja | Con campo (visible ≤ ~520px) |
| `g-datepicker__surface` | Superficie | Siempre |
| `g-datepicker__months`, `__month`, `__head`, `__title`, `__nav`, `__nav--prev`, `__nav--next` | Meses y encabezado | Siempre |
| `g-datepicker__grid` | Cuadrícula | Siempre |
| `g-datepicker__day` + `is-today`, `is-selected`, `is-disabled`, `is-inactive`, `is-outside` | Botón de día | Según estado |
| `is-in-range`, `is-range-start`, `is-range-end`, `is-preview`, `is-cap-start`, `is-cap-end` | Celda `td` (franja) | Según estado; `is-cap-*` = extremo redondeado de la franja (borde de semana o de mes) |
| `g-datepicker__foot`, `__chips`, `__chip`, `__bar`, `__summary`, `__actions`, `__action`, `__action--primary` | Pie | Con `proximity`, `summary` o acciones |
| `g-datepicker__sr` | Texto oculto y región `status` | Siempre |

## Resolución de hallazgos de r01

| # | Hallazgo | Resolución | Base |
| --- | --- | --- | --- |
| 1 | Nombre y forma | `GDatePicker`; `inline`, `mode`, `v-model`: ISO en `single`, `{ start, end }` en `range` | DECISIONS.md #63 |
| 2 | Límites | `min`, `max`, `disabledDates(iso)` | Reservas y filtros |
| 3 | Meses | `months`: `auto`/`1`/`2`; umbral **derivado de la celda medida**, sin literal | Contrato de tokens §4 (todo desde `space`); DECISIONS.md #65 |
| 4 | Semana e idioma | `locale`, `firstDay`; **todos los textos** por `labels` y `proximity`, **sin valores por defecto** | Grana es internacional (como `clearLabel`, `emptyText`); DECISIONS.md #64 |
| 5 | Proximidad | `proximity: [{ days, label, ariaLabel? }]`, vacío por defecto; solo `range` | El texto («± 3 días») es del idioma de la aplicación |
| 6 | Campo | Anatomía de `GSelect`/`GInput`; `split` con `labelStart`/`labelEnd`; **sin `loading`** | Coherencia; DECISIONS.md #63 |
| 7 | Anclaje | `anchor` y **slot `trigger`** (la barra de búsqueda pone su propio botón) | Barra de búsqueda de r01; DECISIONS.md #63 |
| 8 | Eventos | `update:modelValue`, `change`, `start`, `navigate`, `update:open`, `open`, `close`; **solo valores completos** | DECISIONS.md #64 |
| 9 | Cierre | `closeOnSelect` con regla por defecto (fecha única cierra; rango cierra al completarse sin `proximity`) | r01, decisión 15 |
| 10 | Estados de día | Sin tokens nuevos: `color` da la selección; superficies §11 | Reutilización |
| 11 | Inactive | **Confirmada** la definición de r01: elegible, antes del inicio pendiente, reinicia el inicio | DECISIONS.md #66 |
| 12 | Superficie | Popover con `--g-color-surface` y `--g-shadow-2`; hoja móvil con `--g-surface-*`; en Dialog, `inline` sobre superficie hundida de la aplicación | Reutiliza §11 (DECISIONS.md #43) |
| 13 | Escribir a mano | **Fuera de v0.1** (formato por idioma); el campo es un botón | Ver "Abierto" |
| 14 | `GBtn` en chips y acciones | Elementos propios (`g-datepicker__chip`, `__action`), no `GBtn`: el componente no depende de otro | Autonomía de los componentes |

## Límites conocidos

- **Sin escritura manual** de fechas, sin selección múltiple (varias fechas sueltas), sin hora, sin vista de años ni de meses.
- **Sin textos por defecto:** una aplicación que no pasa `labels` obtiene botones sin nombre (`prev`, `next`) y avisos en desarrollo, y días sin sufijos.
- **`Intl.Locale.weekInfo`** no está en todos los navegadores: sin él, `firstDay` es 1 (lunes) salvo que se dé.
- **Popover cierra al salir el foco:** no atrapa el foco (un diálogo modal sí lo haría); en la hoja móvil el fondo lo tapa y el clic fuera cierra.
- **Un rango puede contener días no disponibles** (no se impide).
- **Lector de pantalla:** el anuncio de la cuadrícula, del rango y del título vivo por verificar con lectores reales; RTL, Firefox, Safari y táctil real por verificar.

## Abierto (no bloquea el paso siguiente)

- **Escribir la fecha a mano:** decisión de producto pendiente con el usuario (cada idioma tiene su formato).
- Valores estéticos (proporciones del círculo y la franja, sombra, separación entre meses): los decide coco con los tokens listados.
