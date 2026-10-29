# Contrato · GDatePicker

**Dueño:** lima · **Estado:** aprobado · **Basado en:** `design/lab/datepicker/r01/` (kiwi)
**Tag:** `g-datepicker` (Vue lo resuelve como `GDatepicker`: el registro incluye ese alias además de `GDatePicker`) · **Categoría:** entradas

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
| `disabledNights` | Function | `(iso: string) => boolean` (la noche que empieza `iso`) | sin valor | propia (solo `range`; #739, §«Noches y salida») |
| `minNights` | Number | entero ≥ 1 | sin valor | propia (solo `range`; #739) |
| `maxNights` | Number | entero ≥ `minNights` | sin valor | propia (solo `range`; #739) |
| `dayDescription` | Function | `(iso: string) => string` | sin valor | propia (§«Precio y otros datos del día», #778) |
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
| `density` | String | `default` `comfortable` `compact` | sin valor: la región (`density.md`, #975) | compartida (solo el campo) |
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
- **`inline`:** solo la superficie (sin campo, sin popover, sin `open`); ignora las props de campo (`label`, `hint`, `error`, `placeholder`, `required`, `name`, `split`, `size`, `density`, `rounded`, `block`, `variant`) y avisa en desarrollo una vez si se pasan. **La prop `density` se ignora, pero la superficie sigue la región por CSS** (`var(--g-density)` heredado: `data-g-density` de un ancestro, `GForm` con `density` incluido, `<html>` o el tema; #983): sin campo no hay mensaje ni etiqueta que una región deba proteger, y el `inline` no lee el contexto de `GForm` solo para la lógica (C1), no para la medida. **Dentro de un `GDialog` se usa `inline`**: nunca se abre un popover ni otro Dialog.
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
- **Resto de atributos** (`aria-*`, `data-*`, escuchas): van al **botón del campo** (o al primero con `split`); en `inline`, a la raíz de la superficie (el contrato no cambia, #895: que hoy las escuchas no lleguen es un defecto de `GDatePicker.vue`, de bruno, en `PENDIENTES.md`). `class` y `style` van a la raíz (`inheritAttrs: false`).

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

- Con `months="auto"`: **dos** meses si el ancho disponible los deja con celdas cómodas, **uno** si no. El umbral **no es un número literal**: es `2 × (7 × celda + relleno) + separación + relleno de la superficie`, con la **celda medida** (`--g-space-1 × 10`, y `44px` con `pointer: coarse`). Con `space` 4 son ≈ 648px (≈ 704px táctil). El ancho disponible es el del contenedor (en línea); en el popover, **el del visor menos el margen**, o el del ancla **solo si se da `anchor`** (una barra de búsqueda); en la hoja móvil, el del visor menos el margen.
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
- Posición: debajo del ancla, o **encima** si no cabe debajo y hay más sitio arriba (clase `is-up`); bruno la entrega con variables CSS dinámicas (`--_x`, `--_top`, `--_bottom`, `--_max`; excepción a «sin estilos en línea»). Se recalcula al abrir y al redimensionar; **al desplazarse cualquier ancestro solo sigue al ancla** (no en la hoja móvil). Reglas comunes de los paneles anclados (lado con histéresis, `--_max` fijo, cierre sin devolver el foco si el ancla sale de la vista): `docs/contract/api.md` «Paneles anclados» (#358).
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
| `day` | Contenido de un día (por ejemplo, un precio bajo el número) | `{ date, day, selected, inRange, disabled, outside }` | Dentro del `<button>` del día, **después del número**; **no** cambia el nombre accesible (lo que deba oírse va en `dayDescription`, #778); con el slot, la raíz lleva `g-datepicker--day-content` y **todas** las celdas toman la forma de «día con contenido» de coco (ninguna salta de tamaño por tener o no contenido); sin interactivos |
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
| `--g-color-{color}-text` | **Trazo interior del círculo elegido** y, si se pintan con el color como forma, aro y punto de hoy (`tokens.md` §7.1, #431) |
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


**Ancho por defecto (#563):** `contain-intrinsic-inline-size: --g-space-1 × 60` (240 px), `× 100` (400 px) con `split`; `contain: none` en `--inline` y en `GFormRow` (`api.md` «Contención en línea y ancho intrínseco»).

## Clases (contrato entre bruno y coco)

Bruno las emite; coco las estiliza. Ninguno usa otras.

| Clase | Elemento | Cuándo |
| --- | --- | --- |
| `g-datepicker` | Raíz | Siempre |
| `g-datepicker--mode-{single\|range}`, `--variant-{v}`, `--size-{s}`, `--density-{d}`, `--color-{c}`, `--rounded-{r}`, `--block`, `--inline`, `--split` | Raíz | Según props |
| `is-open`, `is-disabled`, `is-readonly`, `is-invalid` | Raíz | Estados |
| `g-datepicker__label`, `__required`, `__hint`, `__error` | Etiqueta, marca, ayuda, error | Con campo |
| `g-datepicker__field`, `__icon`, `__value`, `__value--placeholder` | Botón(es) del campo | Con campo |
| `g-datepicker__fields`, `g-datepicker__item` | Grupo de dos campos y cada uno (etiqueta + botón) | Solo con `split` (`__fields` lleva `role="group"`; cada `__item` una `g-datepicker__label` propia con `labelStart` o `labelEnd`) |
| `g-datepicker__pop`, `is-up` | Popover | Con campo |
| `g-datepicker__sheet-head`, `__sheet-close` | Cabecera y cierre de la hoja | Con campo (visible ≤ ~520px) |
| `g-datepicker__surface` | Superficie | Siempre |
| `g-datepicker__months`, `__month`, `__head`, `__title`, `__nav`, `__nav--prev`, `__nav--next` | Meses y encabezado | Siempre |
| `g-datepicker__grid` | Cuadrícula | Siempre |
| `g-datepicker__day` + `is-today`, `is-selected`, `is-disabled`, `is-inactive`, `is-outside` | Botón de día | Según estado |
| `is-in-range`, `is-range-start`, `is-range-end`, `is-preview`, `is-cap-start`, `is-cap-end` | Celda `td` (franja) | Según estado; `is-cap-*` = extremo redondeado de la franja (borde de semana o de mes) |
| `g-datepicker__foot`, `__chips`, `__chip`, `__bar`, `__summary`, `__actions`, `__action`, `__action--primary` | Pie | Con `proximity`, `summary` o acciones |
| `g-datepicker__sr` | Texto oculto y región `status` | Siempre |
| `g-datepicker--day-content` | Raíz | Con el slot `day` (#778) |
| `is-day-content-hidden` | Raíz | Con el slot `day`, cuando su contenido no cabe en alguna celda (#952) |
| `g-datepicker__day-readout` | Lectura del día bajo la cuadrícula (`aria-hidden`) | Con el slot `day`; visible solo con `is-day-content-hidden` (#952) |

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

## Cambio por el sistema de formularios (Fase 1)

> **Revisión r02 (distribución, DECISIONS.md #171 a #184):** cambia C10 y C11; `block` se resuelve dentro de `GFormLayout`/`GFormRow`/`GFieldGroup` (C2). Pendiente de **bruno** (marcado) y **coco** (pistas). Ver `form.md` §4, §10 y «Migración desde la Fase 1».

**Origen:** `design/contracts/form.md` §10 (DECISIONS.md #153, #158, #164, #165). **Estado:** aprobado por lima; pendiente de **bruno** (`.vue`, pruebas, `meta.json`) y **coco** (CSS). Lo que aquí se dice **sustituye** a lo anterior de este contrato donde choque; fuera de `GForm` el componente se ve y se comporta como hoy salvo C4, C5, C6 y C7, que aplican siempre.

| # | Cambio | Detalle |
| --- | --- | --- |
| C1 | Lee el contexto con `useFormField()` | `density`, `readonly`, `disabled`, `block` y `error` (solo el campo; `inline` no lee el contexto salvo `readonly`/`disabled`) pasan a default `undefined`; valor = prop explícita › contexto de `GForm` › default de siempre. Error por `name` desde `errors` de `GForm` (y `warnings`), con su momento (`showErrorsOn`) |
| C2 | `block` en la rejilla | Dentro de `GFormLayout`, `GFormRow` o `GFieldGroup`, `block` resuelto a `true`. En una `GFormRow`, `g-form-w-sm` (peso 3, mínimo `space × 32`); con `output` (edad), mínimo propio `--g-form-min: 44`. |
| C3 | Marcas | Como `GInput`: «(opcional)» en `g-datepicker__optional` o asterisco según `marks`; prop nueva **`mark`**. |
| C4 | Región de mensaje unificada | `g-datepicker__error` / `ID-error` pasa a **`g-datepicker__message`** / `ID-message`: un hueco para error, advertencia o válido, siempre presente; `aria-live` = `live` del contexto (`polite`, u `off` mientras se escriben mensajes revelados por un envío; fuera de `GForm`, `polite`). Dentro: `GIcon` (`g-datepicker__message-icon`) + prefijo oculto `g-datepicker__message-type` (`labels.error\|warning\|valid` de `GForm`; fuera, sin prefijo) + texto. `aria-describedby` incluye `ID-message` mientras haya mensaje. Vacía = **sin nodos de texto** (el CSS usa `:not(:empty)`; un comentario de Vue vale, un espacio no). |
| C5 | Estados `warning` y `valid` | Props nuevas **`warning`** y **`valid`** (String, sin valor). Sin `aria-invalid`; no bloquean; prioridad error › advertencia › válido. Clases `is-warning`, `is-valid` en la raíz. Borde de estilo distinto del error (no solo color) |
| C6 | Iconos | Error **`circle-alert`** (antes `triangle-alert`), advertencia `triangle-alert`, válido `circle-check` (`icons.md`) |
| C7 | Solo lectura homogéneo | Contraste completo (`--g-color-text`, sin opacidad), fondo `--g-color-neutral-soft` (#186; antes `surface-sunken`), marcador `text-muted`, borde **discontinuo** `--g-color-border-control`, cursor normal, enfocable; distinto de `disabled` sin depender del color (#165). El texto del valor, seleccionable donde el navegador lo permita; enfocable y no abre (sin cambios). |
| C8 | Manejadores primero | `mergeProps(handlers, propios, attrs)` sobre el botón del campo, con prueba de orden. |
| C9 | Registro | Con `name`, se registra (`control` = botón del campo, o el primero con `split`); al elegir un valor completo llama a `notifyChange()` (revela al cambiar y marca `dirty`). |
| C10 | **Tres hijos: etiqueta, caja, pie** (r02, #176; sustituye a las cuatro pistas) | La raíz tiene exactamente tres hijos en flujo: `g-datepicker__label`, la caja (el contenedor del campo; el panel queda fuera de flujo y `inline` y `split` van en su propia fila, #188) y el pie nuevo **`g-datepicker__support`**, que agrupa ayuda (y contador) y la región `g-datepicker__message` (siempre presente). Dentro de una `GFormRow`, coco coloca las tres partes en las pistas compartidas (`subgrid`; etiqueta apoyada abajo y nunca recortada; `form.md` §4, C12) |
| C11 | **Valor calculado: `output`** (r02, #180; `form.md` C14) | Prop nueva **`output`** (String, sin valor): dato que calcula la aplicación a partir de la fecha (la edad). Se pinta como `<output class="g-datepicker__output" id="ID-output" for="ID" aria-live="polite">` dentro de la caja, tras `__value` dentro del botón del campo (#188); siempre presente, vacía sin nodos de texto; con texto entra en `aria-describedby` antes de ayuda y mensaje y la raíz lleva `g-datepicker--has-output`. No se envía ni es enfocable |

**«(opcional)»:** un espacio de texto antes del `<span>` de la marca (sin margen en CSS). Advertencia en cajas: borde discontinuo doble; error, continuo doble; válido, continuo sencillo (coco, #169).

**Clases nuevas** (contrato bruno–coco): `g-datepicker__support`, `g-datepicker__output`, `g-datepicker--has-output` (r02), `g-datepicker__optional`, `g-datepicker__message`, `__message-icon`, `__message-type`, `is-warning`, `is-valid` (`g-datepicker__error` desaparece).

**Marca fuera de `GForm` (#170):** sin contexto, el asterisco con `required` se pinta como antes aunque el campo sea `readonly` o `disabled`; la regla «solo campos editables llevan marca» rige solo dentro de `GForm`.

## Noches y salida (enmienda para hoteles; DECISIONS.md #739)

**Origen:** B-L5, B-L6 y B-L7 de `design/lab/booking-bar/r01/` (`GBookingBar`, `booking-bar.md`). Hoy un día no disponible se deshabilita entero y no se puede elegir como **salida**, y un rango puede contener días no disponibles: la aplicación valida a mano y no puede ofrecer la salida en un día agotado. En hotelería lo agotado es **la noche**, no el día.

**`disabledNights(iso)`** (solo `range`; en `single` se ignora y avisa): `true` = la noche que **empieza** el día `iso` (de `iso` a `iso + 1`) no está disponible. Un rango `{ start, end }` duerme las noches `start … end − 1`. Reglas, mientras se elige y al recibir un valor:

1. **Inicio:** un día cuya noche está agotada **no puede ser inicio**.
2. **Fin:** con un inicio pendiente `S`, un día `E > S` puede ser fin si **ninguna** noche de `S` a `E − 1` está agotada y `E − S` está dentro de `[minNights, maxNights]` (cada límite, si se da). **Salir un día cuya noche está agotada es válido** (esa noche no se duerme).
3. Un día **después** de `S` que no puede ser fin pero sí inicio se comporta como **Inactive** (`is-inactive`: elegible, reinicia el inicio al tocarlo), igual que los anteriores a `S`. Uno que no puede ser ni fin ni inicio es **Disabled** (`is-disabled`, `aria-disabled`, en el orden de las flechas).
4. **Solo salida:** sin inicio pendiente, un día cuya noche está agotada pero cuya noche anterior no lo está lleva **`is-checkout-only`** y el sufijo `labels.checkoutOnly` («…, solo salida»); tocarlo sin inicio pendiente **no hace nada** (no puede ser inicio). coco le da una forma distinta del tachado (no solo color).
5. **Con `disabledNights`, el rango ya no puede contener noches agotadas** (a diferencia de `disabledDates`, que sigue sin impedirlo: compatible). Un `modelValue` recibido que las contiene se muestra tal cual y avisa una vez (aviso nuevo).
6. `minNights`/`maxNights` sin `disabledNights` valen solos (regla 2 con solo los límites). `disabledDates` sigue mandando sobre los dos (un día no disponible no es ni inicio ni fin).
7. `proximity` respeta las reglas: ampliar no mete noches agotadas (recorta antes de la primera).

**Textos nuevos:** `labels.checkoutOnly` (sufijo del nombre del día; recomendado, sin valor por defecto). **Clase nueva:** `is-checkout-only` (botón del día).

**Raíz con el slot `trigger` (B-L7).** Con el slot `trigger` la raíz lleva **`g-datepicker--trigger`** y coco la deja sin caja (`display: contents`): el botón de la aplicación queda en la línea de su texto (la frase de `GBookingBar`) y el panel sigue en la capa superior. La raíz sigue siendo un `div`, así que **no va dentro de un `<p>`** (el analizador de HTML cerraría el párrafo en SSR): aviso nuevo si al montar la raíz tiene un `<p>` ancestro. La frase de `GBookingBar` es un `div` por esto.

**Defecto (B-L6, para bruno):** con `inline` y `disabled`, «Mes anterior» y «Mes siguiente» siguen activos (medido por kiwi en Chromium). El contrato ya dice que `disabled` en `inline` **la deshabilita entera** (§«Reglas de props», `readonly`/`disabled`): no es aclaración, es un defecto; los dos botones llevan `disabled`.

**Avisos nuevos** (`[Grana GDatePicker]`): `disabledNights`, `minNights` o `maxNights` en `single`; `maxNights < minNights`; `modelValue` con una noche agotada dentro; raíz dentro de un `<p>`.

**Peso:** cuenta en el lote de enmiendas de marketing del principal (#742).

## Precio y otros datos del día (enmienda de la ronda de moneda y precio; DECISIONS.md #778)

**Origen:** P-L6 de `design/lab/price/r01/` (kiwi): el contenido del slot `day` no entra en el nombre accesible (medido en los tres motores: «miércoles, 21 de octubre de 2026, hoy», sin «1,850»), y el círculo del día no tiene sitio para una segunda línea (a 320px las cifras de días vecinos se tocan). Consumidor: el bloque Availability (B4) y la consulta de reserva.

- **`dayDescription(iso) → String`** (Function, sin valor). Lo que devuelve se **añade al `aria-label` del día después de los sufijos de estado**, separado por «, »: «miércoles, 21 de octubre de 2026, hoy, 1,850 pesos mexicanos». Para un precio, la aplicación devuelve `formatPrice(money, { locale }).spoken` (`price.md`). Una cadena vacía, `null` o algo que no es cadena no añade nada (sin aviso: un día sin dato es normal). Se llama para cada día pintado del mes (también los no disponibles y, si se pintan, los de fuera del mes); la aplicación decide qué devuelve en cada caso. Sin guardas de aviso dentro del recorrido de días (#653, coste por celda).
- **Por qué en el nombre** y no en `aria-describedby`: la regla de este componente es que «el estado va en el nombre» (§«Estructura accesible»), y una descripción por celda multiplicaría los nodos ocultos por 42; el precio del día es parte de lo que la persona compara al moverse con las flechas.
- **Forma del día con contenido (coco):** con el slot `day` presente, la raíz lleva **`g-datepicker--day-content`** y coco da a **todas** las celdas una forma que cabe el número y una segunda línea (más alta, sin que el círculo ni el anillo de «hoy» la corten) y la mide a 320px con `GPrice size="xs" display="none" cents="never"`. Sin el slot, nada cambia. El área táctil y los mínimos de §7 no bajan. Si no cabe a 320px, vuelve a lima (reservado `notation: 'compact'` en `formatPrice`, `price.md`).
- **La leyenda de la moneda** («Precio por noche en pesos mexicanos») la pone la aplicación fuera del calendario (o un `GPriceScope` alrededor): con `display="none"` el día solo lleva la cifra.
- **Peso:** en el lote de enmiendas de moneda del principal (`price.md` «Paquete y peso»).
- **Verificación (bruno):** vitest (el texto entra en el `aria-label` tras los sufijos, cadena vacía y no cadena no añaden nada; la clase solo con el slot) y Playwright (nombre del día con el precio en los tres motores; la celda no cambia de tamaño entre días con y sin precio; sin solapes a 320px).

### Cuando el dato no cabe en la celda: lectura del día (AV-C1; DECISIONS.md #952, 2026-10-28)

**Origen:** AV-C1 de coco (`design/lab/split/auditoria.md`, `design/lab/blocks/booking/auditoria.md`): con el texto al 200 % el precio de cuatro cifras mide ~58 px (caption a 24 px) en una columna de 32 a 46 px y se solapa con los vecinos (18 pares de 26 días, a 320 y a 1440, tres motores y tres temas); al 100 %, ninguno (29 px en 32). Lo mismo pasa a 320 con el texto al 100 % y cinco cifras (#801).

**Regla:** el dato del día **sale de la celda, nunca de la información**. Si el contenido del slot `day` no cabe en **alguna** celda de los meses pintados, no se pinta en **ninguna** (todo o nada: un mes con precios en unos días y en otros no se leería como «sin precio») y aparece una **lectura del día** visible bajo la cuadrícula con el dato del día activo. Tres sitios lo conservan: el nombre del día (`dayDescription`, ya contratado), la lectura visible y lo que la aplicación pinte fuera (la tarjeta de Availability 03 lleva el total, no el precio por día).

1. **Medir (bruno, `GDatePicker.vue`):** con el slot `day` presente (con `inline` o sin él), al cambiar de tamaño (el `ResizeObserver` de la raíz que ya existe para `months="auto"`, extendido a este caso; sin observador nuevo), al cambiar de mes y tras un render que cambie el contenido de los días, en **un solo cuadro** agrupado (`requestAnimationFrame`, como `GCalendar`, #169): para cada hijo del día que no es `__today-dot`, `scrollWidth > clientWidth + 0,5` → no cabe. **Solo lecturas**; se escribe la clase solo si cambia. Ningún render del padre con props en línea mide más de una vez por cuadro (lección de bd888df).
2. **Determinista, sin histéresis:** al ocultar, el contenido pasa a **`visibility: hidden`** (sigue ocupando su sitio y se puede medir), así que la decisión es la misma tras cualquier secuencia de tamaños y escalas de texto (100 → 200 → 100 %, 320 → 1440 → 320). La celda no cambia de medida entre los dos estados (Δ 0).
3. **Clase:** la raíz lleva **`is-day-content-hidden`** mientras no cabe. coco: el contenido del día con `visibility: hidden` y la lectura visible; sin la clase, la lectura con `display: none`.
4. **Lectura del día** (`g-datepicker__day-readout`): un nodo bajo la cuadrícula (uno solo con dos meses, bajo los dos), **`aria-hidden="true"`** (el nombre del día ya lo dice; nada se anuncia dos veces) y siempre en el DOM con el slot `day`. Contiene la **fecha corta** del día activo con el `locale` del componente (`Intl.DateTimeFormat`, `weekday: 'short', day: 'numeric'`; sin `labels` nuevos) y el **mismo slot `day`** renderizado para ese día con el mismo alcance (`{ date, day, selected, inRange, disabled, outside }`). **Día activo:** el día bajo el puntero mientras lo hay; si no, el día con la parada de Tab (`tabbable`: el enfocado, el elegido o hoy). Al moverse con las flechas o con el puntero, la lectura cambia; nada más se mueve. Separación entre fecha y dato con espacio (coco, `gap`), sin caracteres decorativos (#85).
5. **Forma (coco, `GDatePicker.css`):** una línea con el cuerpo `body-sm` (≥ 12 px, contraste de texto ≥ 4,5:1), alto constante (la lectura no cambia de alto entre días), alineada al inicio de la cuadrícula, dentro de la caja a 320 con el texto al 200 % (S-L11 (a) sigue cerrado). Sin movimiento: el cambio de texto no se anima (rúbrica de movimiento: no aplica). `forced-colors`: texto del sistema.
6. **Táctil:** sin puntero que pase por encima, el día activo es el elegido: tocar un día lo elige (reversible) y la lectura enseña su dato. Límite aceptado y documentado en el README.
7. **Sin prop ni aviso nuevos.** La aplicación no elige el modo; `notation: 'compact'` sigue reservado (#801).

**Descartado:** (a) columna que crece con el texto (7 × ~60 px no cabe a 320 y deshace S-L11 (a)); (b) solo ocultar en la celda (quien ve con el texto al 200 % se quedaría sin ningún precio por día visible: el nombre accesible solo llega a quien usa lector, 1.4.4); (c) `compact` con texto ampliado (en español «1,9 mil» es **más** largo que «1,850» y redondea el precio); (d) el precio en dos líneas (partir una cifra se lee mal y tres cifras a 24 px siguen sin caber en 32).

**Enmienda de cierre (DECISIONS.md #956, construido y auditado):** (a) la pista de `.g-datepicker__day` queda acotada con `grid-template-columns: minmax(0, 1fr)` (coco): sin ella la pista implícita crecía con el contenido y `scrollWidth > clientWidth + 0,5` nunca se cumplía; con ella la regla del punto 1 vale tal cual (la medida de bruno con `min(clientWidth, ancho del día)` es equivalente e inofensiva). (b) Los hijos de 1 px o menos (texto oculto para lectores) no se miden. (c) Día activo de la lectura: el del puntero o, si no hay, el `tabbable`; en táctil, el elegido (límite aceptado). (d) Peso medido: +482 B gzip de 512 B. **No verificado:** lector de pantalla real y teléfono real.

**Peso:** corrección de accesibilidad de un componente existente, compuerta propia **≤ 512 B gzip** (`gzip -9`) de crecimiento de `dist/grana.js` sobre la medida anterior, fuera de #506; si la supera, vuelve a lima.

**Verificación:** vitest (bruno: la lectura solo con el slot `day`, `aria-hidden`, con la fecha corta y el contenido del día activo; día activo = puntero, si no `tabbable`; la clase según la medida simulada; una sola medida por cuadro con un padre que re-renderiza). Playwright (bruno, tres motores; `#sec-datepicker` con precios y Availability 01 y 03): texto al 200 % a 320 y a 1440 → clase puesta, **0 solapes** (ningún contenido visible fuera de su celda), lectura visible con el precio del día activo que cambia con ← → y con el puntero; texto al 100 % a 320 con cuatro cifras → sin clase, precios en la celda, lectura oculta; cinco cifras a 320 al 100 % → clase (cierra el límite #801); secuencias de tamaño y de escala sin histéresis; Δ 0 de la celda entre estados; nombre del día con el precio en los dos estados (`ariaSnapshot`); consola limpia; prueba de rendimiento con props en línea. coco lo audita con un tema distinto (cuerpo 17 px) en los tres motores.

## Contraste del día elegido (`tokens.md` §7.1; DECISIONS.md #431 y #432)

El día elegido (fecha única, inicio y fin; `is-selected`) conserva el círculo `{color}` con texto `on-{color}` y gana un **trazo interior `{color}-text`** (`box-shadow: inset`, el patrón del segmento de `GRadioGroup`; no un anillo exterior: es del foco). coco añade `--_text` a `--_color`/`--_on` y a las `.g-datepicker--color-*`. El aro y el punto de hoy, si usan `--_color` como forma sobre `surface`, pasan a `--_text`. **La franja de rango** (`{color}-soft`) no entra en esta regla: coco la mide y, si no llega a 3:1, vuelve a lima. Sin cambio en el tema por defecto. Pendiente de **coco** (encargo único en `checkbox.md` §«Contraste de lo marcado»).

## Texto con puntero grueso (DECISIONS.md #970 a #972)

Regla común en `docs/contract/api.md` «Texto editable con puntero grueso» y mínimo en `tokens.md` §7: con `@media (pointer: coarse)`, `font-size: max(16px, <rol>)`; interlineado del rol con piso `--g-text-body-sm-line`; altura sin cambio; en escritorio, sin cambio. Aquí (grupo B, coherencia de fila: los campos son botones y no amplían): el texto de `__field` y `output` suben; el calendario del panel se queda en su rol.
