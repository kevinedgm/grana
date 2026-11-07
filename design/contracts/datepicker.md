# Contrato · GDatePicker

**Dueño:** lima · **Estado:** aprobado · **Basado en:** `design/lab/datepicker/r01/` (kiwi) · **Enmienda r02** (`design/lab/datepicker/r02/`, e626f047; DECISIONS.md #1020 a #1029, 2026-11-07): un mes por defecto, salto a mes y año (A · Zoom de escala), compacto con `density` y la franja que sigue; ver §«Un mes por defecto y salto a mes y año (r02)», que **manda** donde choque con lo anterior
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
| `months` | String \| Number | `auto` `1` `2` | **`1`** (antes `auto`; #1021) | propia |
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
| `density` | String | `default` `comfortable` `compact` | sin valor: la región (`density.md`, #975) | compartida (el campo **y la superficie**, también con `inline`; #1022) |
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
- **`inline`:** solo la superficie (sin campo, sin popover, sin `open`); ignora las props de campo (`label`, `hint`, `error`, `placeholder`, `required`, `name`, `split`, `size`, `rounded`, `block`, `variant`) y avisa (`density` **ya no** está en la lista: aprieta la superficie, #1022) en desarrollo una vez si se pasan. **Dentro de un `GDialog` se usa `inline`**: nunca se abre un popover ni otro Dialog.
- **`open`:** controla el popover con `update:open`; sin `inline`. Abrir y cerrar por el usuario emite `update:open`, `open` y `close`.
- **`min`, `max`, `disabledDates`:** un día fuera de `[min, max]` o para el que `disabledDates(iso)` devuelve `true` es **no disponible** (Disabled): no elegible, con `aria-disabled="true"`, y sigue en el orden de las flechas (no se salta). Un rango puede **contener** días no disponibles en medio; el componente no lo impide (la aplicación decide con `change`).
- **`months`:** sin valor es **`1`** (#1021); `auto` decide por la **medida real** (ver "Uno o dos meses"); `1` o `2` lo fijan.
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
| `chooseMonth`, `chooseYear` | Sufijo del nombre de los botones del título: «noviembre, elegir mes», «2026, elegir año» (r02, #1025) | **Sí** |
| `prevYear`, `nextYear` | Nombre de las flechas en la vista de meses (año anterior / siguiente) | **Sí** |
| `prevYears`, `nextYears` | Nombre de las flechas en la vista de años (doce años antes / después) | **Sí** |
| `viewMonths`, `viewYears` | Nombre de la rejilla de meses («Meses de {year}») y de años («Años de {from} a {to}») y anuncio al cambiar de año o de página dentro de la vista | No (recomendados) |
| `typeYear` | Pista visible de la vista de años («Escribe un año») | No |
| `current`, `hasValue` | Sufijos del nombre de un mes o un año: «…, actual», «…, contiene lo elegido» | No (recomendados) |

- **Marcadores:** `{date}`, `{start}`, `{end}` se sustituyen por la fecha completa («miércoles, 28 de octubre de 2026»); `{days}` por el número de días **inclusivos** del rango. Los textos son cadenas (serializables), no funciones.
- Sin `announce*`, el componente **no anuncia** pasos (los nombres de los días y el resumen siguen ahí).

## Uno o dos meses

- **Sin `months`, un mes** (#1021). Lo que sigue vale solo con `months="auto"`, que hay que escribir.
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
| Esc | Cierra el popover y devuelve el foco al campo; descarta un inicio pendiente. **En la vista de meses o de años, antes sube un nivel** (r02, §«Teclado de las vistas») |

Teclado de los botones del título y de las rejillas de meses y años: §«Un mes por defecto y salto a mes y año (r02)», «Teclado de las vistas».

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
| Clases de la r02 (vistas, título, rejillas de meses y años, franja que sigue) | | §«Un mes por defecto y salto a mes y año (r02)», «Clases nuevas» |

## Movimiento (`tokens.md` §29.9, #1002)

**Panel anclado** en escritorio y **hoja móvil** por debajo de 520 px, sin cambios sobre lo que hay. El fundido de salida solo existe donde hay `overlay` (D2 · A); con `inline` no hay panel.

**Recorrer los días** es una rejilla: una marca por elemento y **salida instantánea** (`api.md` «Una sola luz», regla 9). Hoy la celda que sale se funde en `fast` y puede haber dos encendidas. **Coco:** la transición de `background-color` deja la regla base de `.g-datepicker__day` y pasa a los estados que **llegan** (hover y elegido): al entrar funde `--g-duration-fast`, al salir se apaga en el acto. Se verifica barriendo la rejilla: como máximo un día con fondo de hover por cuadro. **Lo mismo en las rejillas de meses y años** (r02).

**Cambiar de nivel** (días · meses · años) es un momento de control nuevo de la tabla, `cambiarNivel` (#1023): §«Un mes por defecto y salto a mes y año (r02)», «Movimiento del cambio de nivel».

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

- **Sin escritura manual** de fechas (en la vista de años sí se escribe el año, r02), sin selección múltiple (varias fechas sueltas), sin hora. ~~Sin vista de años ni de meses~~: la r02 las añade (#1020); la frase se retira de este límite **cuando bruno lo construya** y la verifique (L7).
- **Meses y años no ven `disabledDates`** (r02): un mes con todos sus días deshabilitados por la función sigue siendo elegible en la vista de meses (solo `min` y `max` deshabilitan meses y años).
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

## Un mes por defecto y salto a mes y año (r02; DECISIONS.md #1020 a #1029, 2026-11-07)

**Origen:** pedido del usuario («La versión que sale es de 2 calendarios, de 2 meses. Tenemos que tener un date picker de 1 mes, y además una versión más compacta, no tan grande, con poder seleccionar un año diferente o un mes diferente») y ronda r02 de kiwi (`design/lab/datepicker/r02/`, e626f047; `verificar.mjs` 384/384 en tres motores sobre el prototipo, no sobre el componente). **Decisiones del usuario (2026-11-07):** (1) concepto **A · Zoom de escala**, con las cifras del año dentro de la rejilla de años y la «franja que sigue» en rango; sobre el movimiento: «cuidado con las animaciones y transiciones, deben ser sutiles y suaves, no bruscas»; (2) **`months` vale `1` por defecto** en `single` y en `range`; (3) **lo compacto se activa con `density="compact"`**: la superficie sigue `density`, sin prop nueva; (4) **el salto a mes y año va en todos los tamaños**. Lo que no deriva de estas cuatro respuestas deriva de APG (*date picker dialog*, *grid*), WCAG 2.2 AA y contratos vigentes (#358, #792, #975, #977, #1002, #1019).

**Estado:** contratado; pendiente de **coco** (CSS) y **bruno** (`.vue`, pruebas, `meta.json`, `GBookingBar`); después auditoría de coco y README de mora-docs. B y C de la ronda quedan **reservados** (#1020).

### 1. Un mes por defecto (#1021)

- `months` sin valor = **`1`**, en `single` y en `range`. `auto` (la medida de §«Uno o dos meses») y `2` siguen y hay que escribirlos.
- **Consumidores internos** (bruno; Δ 0 donde la forma de dos meses se eligió a propósito):

| Consumidor | Hoy | Desde r02 |
| --- | --- | --- |
| `GBookingBar`: hueco de la frase (`GBookingBar.vue` ~495), campos `split` de estancia (~583) y campo de fecha (~590) | `auto` por defecto | **`months="auto"` explícito** (enmienda en `booking-bar.md`, #1021): la reserva sigue viendo dos meses donde caben |
| `GBookingBar`, hoja (`inline`, ~618 y ~619) | `:months="1"` | Sin cambio |
| `GbAvailability01` (`AvailabilityCalendar.js`) | `months: 'auto'` | Sin cambio |
| Campos de fecha de `@grana/blocks` (`common/fields.js`, `GbGuestForm/GuestForm.js`: Guest form y Checkout) | `auto` por defecto | **Pasan a un mes a propósito** (fecha de un formulario: es el caso del pedido); sin cambio de código. Si alguna prueba o banco contaba dos meses, se actualiza |
| Playground (`#sec-datepicker`) y bancos | Varios | bruno revisa: donde una sección enseñe dos meses a propósito, `months="auto"` |

- **`CHANGELOG.md`** (lo escribe bruno en «Sin publicar › Cambiado», texto de contrato): «**`GDatePicker`: un mes por defecto (#1021).** `months` pasa de `auto` a `1` en `single` y en `range`: el selector ya no abre dos meses en escritorio salvo que se pida. Para recuperar lo de antes, `months="auto"` (dos meses si caben) o `months="2"`. `GBookingBar` fija `months="auto"` y no cambia. Además: salto a mes y año desde el título en todos los tamaños (#1020) y superficie compacta con `density="compact"` (#1022).»

### 2. Vistas: días, meses y años (A · Zoom de escala; #1020, #1024)

La superficie tiene una **vista** interna: `days` (la de siempre), `months` o `years`. **No es prop ni evento** (reservado: `view`/`update:view` si un caso lo pide). Al montar y **cada vez que se abre** el popover, la vista es `days`.

**El escenario.** La caja que ocupan las rejillas de días (encabezado de columnas + 6 filas) es **`g-datepicker__stage`**. Las rejillas de meses y de años la **ocupan entera** (3 columnas × 4 filas que se estiran a su ancho y su alto): **el panel no cambia de tamaño al cambiar de vista (Δ 0, #358)** y no se recalcula su posición. Con dos meses (`auto` o `2`), la vista de meses o de años ocupa **la caja de los dos meses** con **una sola cabecera**; al elegir un mes, vuelve a la columna desde cuyo título se abrió (abierto desde el segundo, el elegido queda segundo).

**Cabecera por vista** (mismo alto en las tres; las flechas conservan su hueco):

| Vista | Inicio | Título (`h3.g-datepicker__title`) | Fin |
| --- | --- | --- | --- |
| `days` | Mes anterior (`labels.prev`) | **Dos botones**: `g-datepicker__title-part--month` («noviembre» + `chevron-down`) y `g-datepicker__title-part--year` («2026» + `chevron-down`) | Mes siguiente (`labels.next`) |
| `months` | Año anterior (`labels.prevYear`) | Un botón: el año (`--year`), que abre los años | Año siguiente (`labels.nextYear`) |
| `years` | Doce años antes (`labels.prevYears`) | Texto, sin botón: el tramo con `Intl.DateTimeFormat(locale, { year: 'numeric' }).formatRange` («2022–2033») | Doce años después (`labels.nextYears`) |

- **Nombre de los botones del título:** texto visible + «, » + `labels.chooseMonth` / `labels.chooseYear` («noviembre, elegir mes»): contiene el texto visible (WCAG 2.5.3). Sin `aria-expanded` ni `aria-haspopup`: no abren un panel, cambian la vista en su sitio y llevan el foco dentro.
- **El `h3` deja de ser región viva** (una región viva con botones dentro lee mal y repetiría «elegir mes»). El cambio de mes se anuncia en un nodo oculto nuevo, **`g-datepicker__title-live`** (`g-datepicker__sr`, `aria-live="polite"`, dentro de la cabecera), con «noviembre 2026» (`Intl`, `month: 'long', year: 'numeric'`). La rejilla de días pasa a nombrarse con `aria-labelledby` a ese nodo (antes, al `h3`). Sustituye a lo que dice §«Estructura accesible» sobre el título vivo; el espacio entre mes y año (r01) se conserva.
- **Celdas de meses y de años:** `<td role="gridcell">` con un `<button type="button" class="g-datepicker__pick">` dentro (como los días). Texto visible: mes corto de `Intl` (`month: 'short'`) o el año (`year: 'numeric'`). Nombre (`aria-label`): mes y año largos de `Intl` («noviembre de 2026») o el año, más sufijos en este orden: `labels.current`; `labels.selected` o `labels.hasValue`; `labels.unavailable`. Solo un `tabindex="0"` por rejilla (§«Teclado de las vistas»).
- **Rejillas:** `<table class="g-datepicker__grid g-datepicker__grid--months|--years" role="grid">` sin `thead`, nombradas con `aria-label` = `labels.viewMonths` (`{year}`) o `labels.viewYears` (`{from}`, `{to}`) rellenado; sin esas claves, el año o el tramo solos. La de años lleva `aria-describedby` a su pista (§4).
- **Página de años:** 12 años; al abrir la vista, la página empieza en **año mostrado − 4** (el año queda en la segunda fila, centro), como en el prototipo. Las flechas y RePág/AvPág la mueven de 12 en 12.

**Marcas** (mismo lenguaje que los días; ninguna solo por color, WCAG 1.4.1):

| Clase (en `__pick`) | Cuándo | Forma | `aria-selected` de la celda |
| --- | --- | --- | --- |
| `is-current` | El mes o el año de hoy | Aro (como «hoy») | — |
| `is-selected` | `single`: el mes (del año a la vista) o el año que contiene el valor | Relleno `{color}` con trazo `{color}-text` (§«Contraste del día elegido») | `true` |
| `is-in-value` | `range`: los meses o años que tocan el rango, **incluido el inicio pendiente** | Punto (`GLibIcon` `circle` relleno o forma de coco; nunca un carácter, #85) | `false` |
| `is-disabled` | Mes o año **entero** fuera de `[min, max]` (§3) | Tachado, como el día | — |

**Elegir no cambia el valor:** las vistas solo navegan. Elegir un año baja a sus meses (foco en el mismo mes); elegir un mes baja a sus días: ese mes queda a la vista y el foco va al **mismo número de día** que tenía la parada de Tab, recortado al último del mes (31 → 28). Al volver a `days` con otro primer mes visible se emite **`navigate`** (mismo payload `{ month }`); recorrer meses o años sin bajar no emite.

**Botón del título → vista:** el foco va dentro de la rejilla nueva, a la celda del mes o del año mostrado (también con puntero: el foco se mueve porque cambia lo que hay en la caja; WCAG 2.4.3).

**Hoja móvil:** el deslizamiento horizontal hace en cada vista lo mismo que sus flechas (mes, año, página de 12).

**`readonly` / `disabled`:** con `readonly` (en `inline`) se navega por las tres vistas; con `disabled`, los botones del título y las flechas de todas las vistas llevan `disabled` (con el defecto B-L6 resuelto).

### 3. `min` y `max` en meses y años (#1026)

- Un **mes** es no disponible si su último día es anterior a `min` o su primer día posterior a `max`; un **año**, igual con el 31 de diciembre y el 1 de enero. **`disabledDates` y `disabledNights` no cuentan** (serían hasta 366 llamadas por año para pintar 12 celdas; límite documentado).
- No disponibles: `is-disabled`, `aria-disabled="true"`, sufijo `labels.unavailable`, **reciben foco** (no se saltan) y **no se eligen** (Intro, Espacio y clic no hacen nada).
- **Bordes:** no se pasa a un año (vista de meses) ni a una página (vista de años) **entera** fuera de `[min, max]`: la flecha correspondiente lleva `aria-disabled="true"` (conserva el foco si lo tenía; no `disabled`) y no hace nada; las flechas del teclado se paran en la última celda alcanzable. Sin `min`/`max`, los años van de 1 a 9999 (ISO).

### 4. Teclado de las vistas (#1024)

**Un tabstop por rejilla** (APG *grid*). En `days`, el orden de Tab es el del documento: flecha, mes, año, flecha, rejilla, pie.

| Tecla | Meses | Años |
| --- | --- | --- |
| ← / → | Mes anterior / siguiente; **cruza de año** (la vista pasa al año vecino). Invierten en RTL | Año ± 1; al salir de la página, la página ± 12 |
| ↑ / ↓ | ± 3 meses (cruza de año) | ± 3 años |
| Inicio / Fin | Primero / último de la fila | Primero / último de la fila |
| Ctrl + Inicio / Fin | Enero / diciembre | Primero / último de la página |
| Re Pág / Av Pág | Año anterior / siguiente (mismo mes) | Página anterior / siguiente (± 12) |
| Intro / Espacio | Baja a los días de ese mes | Baja a los meses de ese año |
| Cifras (0–9 y cualquier `\p{Nd}`) | — | Escriben el año (§5) |
| Retroceso | — | Borra la última cifra escrita |
| Esc | Sube: vuelve a la vista anterior **sin elegir**, foco en el botón del título que abrió el nivel | Primero vacía las cifras escritas; si no hay, sube como en meses |

- **Esc sube un nivel antes de cerrar** (APG: cierra lo de arriba primero): años → vista de la que se vino → … → `days` → (popover u hoja) cerrar. La pila es la de los gestos: desde `days` con el botón del año, Esc vuelve a `days`. **Cuando el componente consume Esc** (cifras, vista distinta de `days`, o cierre de su popover) hace `preventDefault()` y `stopPropagation()`: un `inline` dentro de un `GDialog` no cierra el diálogo al subir de nivel.
- **Volver con Esc no navega:** el mes visible en `days` es el de antes de abrir la vista, aunque se hayan recorrido otros años.
- Tab desde la rejilla sale al siguiente control; sin trampa de foco (el popover sigue cerrándose al salir el foco, §«Cierre y foco»).

### 5. Escribir el año (#1024)

- Solo con el foco en la rejilla de años. Cada cifra (`\p{Nd}`, convertida a su valor) se añade a un búfer de **hasta 4 cifras**; con **4**, el foco salta a ese año (la página se recoloca con el año − 4 al principio), **recortado** a `[min, max]` y a 1–9999. El nombre de la celda enfocada dice dónde se llegó; no hay anuncio aparte.
- **Constante de JS `YEAR_TYPE_MS = 1500`** (no es token, §29.6 como `HOVER_MS`): sin cifra nueva en ese tiempo, el búfer se vacía sin moverse.
- **A la vista:** bajo la rejilla, dentro del escenario (sin alto propio: no cambia el panel), `g-datepicker__years-hint` con `labels.typeYear` (si existe) y `g-datepicker__typed` (`aria-hidden="true"`) con **cuatro** `g-datepicker__typed-digit`: las escritas llevan la cifra y las vacías van vacías y las dibuja coco (sin caracteres de relleno como «·»). La rejilla de años apunta a la pista con `aria-describedby`. Sin `typeYear`, la pista no se pinta y escribir sigue funcionando.
- Fuera de la vista de años, una cifra no hace nada nuevo (C «empezar a escribir desde los días» queda reservada, #1020).

### 6. Anuncios (#1024; sin región viva nueva, #792)

| Momento | Quién lo dice |
| --- | --- |
| Cambia el mes en `days` | `g-datepicker__title-live` (polite) |
| Se entra en meses o años | **El foco**: nombre de la rejilla + nombre de la celda. Sin anuncio en la región `status` (no se dice dos veces) |
| Cambia el año dentro de meses o la página dentro de años (flechas de cabecera, RePág/AvPág, flechas que cruzan) | La región `status` existente (`g-datepicker__sr`) con `labels.viewMonths` / `labels.viewYears`; sin esas claves, nada (el nombre de la celda enfocada sigue diciendo el año) |

### 7. La franja que sigue (#1027)

- Si el rango (o la vista previa de un rango pendiente) **continúa fuera de lo que se ve**, su extremo en el borde visible **no se redondea**: la celda lleva **`is-open-end`** (en la última celda pintada) o **`is-open-start`** (en la primera) **en lugar de** `is-cap-end` / `is-cap-start`, y coco la abre hasta el borde y la desvanece (con forma: sin extremo redondo; WCAG 1.4.1). Los extremos que caen en un salto de semana dentro de lo visible siguen como hoy.
- **Borde visible:** en un mes, la primera y la última celda **pintadas** de la rejilla (incluidas las de fuera del mes, que en un mes se ven y son elegibles); en dos meses, el primer día del primer mes y el último del segundo (el corte entre los dos meses sigue redondeado, como hoy). Kiwi la proponía solo con un mes; se extiende a los extremos de dos meses porque el motivo es el mismo.
- No cambia nombres ni `aria-selected`: los días dentro siguen diciendo «dentro del rango» y el resumen dice las dos fechas.
- `forced-colors`: conserva borde superior e inferior, como la franja; el desvanecido puede perderse (el extremo sin redondear sigue).

### 8. Densidad: la superficie compacta (#1022)

- **`density` aprieta también la superficie** (la prop es la región del componente, #975; el popover en su sitio sigue la región de su disparador, #977): con la prop, con una región de la aplicación o con `<html data-g-density>`. **También con `inline`**. Sin prop nueva. Consecuencia aceptada: en una región `compact`, el calendario también se compacta.
- **Mecanismo:** la superficie mide con el alias de densidad de la raíz (`--_density`). Cuando se construya `density.md` (hoy ninguna hoja lee `var(--g-density)` y `defaults.css` no lo declara), ese alias pasa a `var(--g-density)`; mientras tanto lo dan las clases `g-datepicker--density-*` de la raíz, y el panel, que va dentro de la raíz, lo hereda. El contrato es el mismo en los dos casos.

| Medida | Fórmula (`d` = densidad: 1 · 0,875 · 0,75) | Tema por defecto (`space` 4), `compact` |
| --- | --- | --- |
| Celda (día, mes, año) | `max(24px, space × 10 × d)` (redondeo a 0,5 px de #682 a criterio de coco); **44px con `pointer: coarse`** | 30 px |
| Flechas y botones del título (alto) | `max(24px, space × 8 × d)`; 44px táctil | 24 px |
| Relleno de la superficie | `space × 5 · 6 · 4` (arriba · lados · abajo) `× d` | 15 · 18 · 12 px |
| Separación bajo la cabecera | `space × 2 × d` | 6 px |
| Separación entre dos meses | `space × 10 × d` | 30 px |
| Chips y acciones del pie (alto) | `max(24px, space × 8 × d)`; 44px táctil | 24 px |
| Título | Baja **un escalón** en `compact`: `body` → `body-sm` (#966, piso 12 px) | `body-sm` |
| Días, meses y años | `body-sm` en todas (≥ 12 px) | `body-sm` |
| Encabezado de columnas | `caption` (12 px, ya en el piso) | `caption` |

- `comfortable` usa las mismas fórmulas con 0,875. Ancho de un mes compacto ≈ 7 × 30 + 2 × 18 = 246 px frente a ≈ 328 px en `default` (kiwi midió 236 px con relleno `space × 3`; con la fórmula común son 10 px más, a cambio de no tener un número propio).
- El umbral de `months="auto"` usa la **celda medida**: en compacto caben dos meses antes.
- **Puntero grueso:** la celda es de 44 px siempre (D3 de `density.md`); las regiones ceden a 1 (P2, #978) y la prop explícita no.
- **Hoja a 320 px (hallazgo de kiwi):** hoy el relleno lateral de la superficie en la hoja es `space × 4` y 7 × 44 + 2 × 16 = 340 > 320. **Regla:** en la hoja (≤ 520 px) el relleno lateral de la superficie es **`min(space × 4, (ancho de la hoja − 7 × 44px − bordes) / 2)`**, que las funciones matemáticas recortan a 0 si fuera negativo; con 320 px quedan ≈ 6 px por lado y nada desborda. Literal permitido: `44px`. coco lo escribe (con `100%` del bloque contenedor o la unidad que mida bien en los tres motores) y lo mide a 320 y 375 px con puntero grueso emulado.

### 9. Movimiento del cambio de nivel (#1023; `tokens.md` §29.9, `motion.json` `moments.cambiarNivel`)

**Palabras del usuario:** «cuidado con las animaciones y transiciones, deben ser sutiles y suaves, no bruscas». **La escala de kiwi se reduce:** el prototipo iba de `scale(0.25)` a 1 al bajar y de `scale(2.4)` a 1 al subir (un 75 % y un 140 % del tamaño: brusco y lejos de «sutil»); el contrato la deja en **≈ 3 %**.

| | Regla |
| --- | --- |
| **Bajar** (año → meses, mes → días: acercarse) | La vista nueva entra con **fundido** de 0 a 1 y **escala de `--g-press-scale` a 1** (0,97 con el tema por defecto), con origen en la **celda elegida** |
| **Subir** (días → meses o años, meses → años: alejarse) | Fundido de 0 a 1 y escala de **`calc(2 - var(--g-press-scale))` a 1** (1,03), con origen en la **celda de la que se viene** en la rejilla nueva (el mes o el año mostrado) |
| **Duración y curva** | **`--g-duration-press` + `--g-ease-out`** (la de entrada de la tabla). **Sin rebote:** ni `--g-ease-spring` ni `--g-ease-bounce`; sin retardos ni escalonado de celdas |
| **Salida** | **Instantánea:** la vista anterior se retira en el acto. Nunca hay dos vistas a la vez (ni fundido cruzado ni dos rejillas con foco) |
| **Tamaño** | **Δ 0:** el escenario y el panel no cambian de tamaño ni de sitio. Sin recorte: el 3 % de más al subir (≈ 4 px por lado en una rejilla de 280 px) cabe en el relleno de la superficie también en compacto (12 px), así que no hace falta `overflow` y los anillos de foco de las celdas del borde no se cortan |
| **Interrumpible** | Un cambio de vista durante otro retira la vista en curso y la nueva **empieza desde su estado inicial**; el foco y el teclado nunca esperan a la animación (no se bloquea nada «mientras dura») |
| **Qué no se anima** | Cambiar de mes en `days` (flechas, RePág), de año en meses o de página en años: **sin movimiento**, como hoy. La franja que sigue es estática. Abrir el popover con la vista `days` no lleva zoom (solo la entrada de panel anclado) |
| **Reducido** | **Solo fundido `--g-duration-fast` + `linear`, sin escala** (patrón único, `tokens.md` §29.3, #1019) |

**Cómo (bruno + coco):** la vista nueva es un elemento nuevo (`:key` por vista), así que su animación CSS empieza al montarse y una interrupción la reinicia sola; sin WAAPI ni temporizadores. La raíz de la vista, **`g-datepicker__view`**, lleva `data-zoom="in"` (bajar) u `data-zoom="out"` (subir) **solo** cuando nace de un cambio de nivel (no al abrir ni al montar), y el origen en **`--_zoom-x` / `--_zoom-y` escritos en ese mismo elemento** (regla de #964), en **porcentaje calculado por índice** de la celda en la rejilla de 3 × 4 (`(col + 0,5) / 3`, `(fila + 0,5) / 4`) o, al bajar a los días, por la posición de la celda del mes en la rejilla que se va (mismo escenario, mismas proporciones): **sin leer cajas** (lección de bd888df). Las `@keyframes` (`g-datepicker-zoom-in`, `g-datepicker-zoom-out`) son de coco; solo `transform` y `opacity`.

**Rúbrica de movimiento** (`docs/documentacion/rubrica-movimiento.md`; al contratar, sin componente que medir):

| Dimensión | Estado | Evidencia | Riesgo | Recomendación |
| --- | --- | --- | --- | --- |
| A · Propósito | Cumple (por contrato) | El origen en la celda dice de dónde vienes y a dónde bajas en la jerarquía día · mes · año; no es decorativo. Saltar es poco frecuente (no se repite en cada pulsación) | Bajo | coco mide que el origen cae en la celda correcta en LTR y RTL |
| B · Comodidad visual | Cumple (por contrato) | Escala ≈ 3 %, sin desenfoque ni sombra que cambie; brillo constante | Bajo | — |
| C · Estabilidad | Cumple (por contrato) | Δ 0 del panel; la cabecera, el pie y el campo quedan quietos (referencia estacionaria); nada pasa del relleno | Bajo | Verificar Δ 0 de la caja del panel y de la cabecera durante el zoom |
| D · Transiciones | Cumple (por contrato) | 160 ms, interrumpible por un elemento nuevo, sin estado temporal que limpiar | Bajo | Prueba de interrupción: dos cambios en < 160 ms terminan en la vista correcta con el foco en su celda |
| E · Control | Cumple | Solo cambia de nivel quien pulsa; Esc sube sin elegir | Bajo | — |
| F · Accesibilidad | Cumple (por contrato) | El nivel lo dicen el foco, el nombre de la rejilla y el título; reducido = fundido | Bajo | Verificar `prefers-reduced-motion` en tres motores |
| G · Rendimiento | Cumple (por contrato) | Solo `transform` y `opacity` sobre 12 o 42 celdas; sin lecturas de caja | Bajo | Prueba con props en línea: ninguna medida por render del padre |
| H · Inmersión | N/A | — | — | — |

**Resumen:** el zoom de kiwi se conserva como idea (bajar acerca, subir aleja, con origen en la pieza) pero con la amplitud de la pulsación de `GBtn` y del diálogo, la duración de entrada de la tabla y sin rebote. **Límite:** sin lector de pantalla ni dispositivo real, «sutil» se valida con la auditoría de coco a ojo y por medida.

### 10. Clases nuevas (contrato bruno ↔ coco)

| Clase | Elemento | Cuándo |
| --- | --- | --- |
| `g-datepicker__stage` | Caja de las rejillas (días, meses o años) | Siempre |
| `g-datepicker__view`, `g-datepicker__view--days\|--months\|--years`, `data-zoom="in\|out"`, `--_zoom-x`, `--_zoom-y` | Raíz de la vista dentro del escenario | Siempre; `data-zoom` y el origen solo al nacer de un cambio de nivel |
| `g-datepicker__title-part`, `__title-part--month`, `__title-part--year` | Botones del título | `days` (los dos) y `months` (el año) |
| `g-datepicker__title-live` | Nodo oculto vivo con «mes año» que nombra la rejilla de días | Con la vista `days` |
| `g-datepicker__nav--year`, `__nav--years` | Flechas de la cabecera en meses (± 1 año) y en años (± 12) | Según la vista; sin una clase de estado nueva: `aria-disabled` en el borde |
| `g-datepicker__grid--months`, `__grid--years` | Rejillas de meses y de años (además de `g-datepicker__grid`) | Según la vista |
| `g-datepicker__pick` + `is-current`, `is-selected`, `is-in-value`, `is-disabled` | Botón de mes o de año | Según estado |
| `g-datepicker__years-hint`, `__typed`, `__typed-digit` | Pista de la vista de años y búfer de cifras (`aria-hidden`) | Vista de años |
| `is-open-start`, `is-open-end` | Celda `td` de día (franja) | §7; en lugar de `is-cap-*` en el borde visible |
| `g-datepicker--density-{d}` | Raíz | Ya existía; desde r02 también aprieta la superficie |

### 11. Eventos, slots y tokens

- **Eventos:** ninguno nuevo. `navigate` también al bajar a `days` con otro primer mes (§2).
- **Slots:** ninguno nuevo. El slot `day` no aplica a meses ni años; la lectura del día (#952) solo mide en `days`.
- **Tokens nuevos: ninguno.** Consume además `--g-press-scale` (escala del zoom), `--g-duration-press`, `--g-duration-fast`, `--g-ease-out` y los mismos colores de los días para las marcas de meses y años. El desvanecido de la franja usa la franja (`{color}-soft`) hacia transparente: transparencia, no color de tema (coco decide si con degradado o con máscara).

### 12. Avisos de desarrollo (guarda canónica de #653, en el sitio de cada texto)

- **`labels` incompleto:** al aviso de claves requeridas que falten (una vez por instancia) se añaden **`chooseMonth`, `chooseYear`, `prevYear`, `nextYear`, `prevYears`, `nextYears`**: el salto existe en todos los tamaños, así que se piden siempre (con o sin `inline`). Un solo aviso con todas las que falten.
- Ninguno más: `months` con un valor fuera de `auto`/`1`/`2` sigue con su aviso de siempre (si lo tiene), y `density` en `inline` **deja de avisar**.
- **Consumidores internos que deben ganar las claves:** los textos de `GDatePicker` de `@grana/blocks` (`bank/booking.js` `datePicker`, y los `L.datePicker` de `common/fields.js` y `GbGuestForm`), el playground y los bancos; `GBookingBar` las pasa tal cual (`labels.datePicker`, #761), sin cambio de contrato.

### 13. `meta.json` (bruno; contrato de tipos, #443)

- `months`: `"default": 1` (Number; antes `"auto"`), `values` sin cambio (`"auto"`, `1`, `2`), nota «#1021: un mes por defecto; `auto` mide y pone dos si caben».
- `density`: nota nueva «El campo y la superficie, también con `inline` (#1022); sin valor: la región (density.md §1)». Tipo y valores sin cambio.
- `labels`: la descripción lista las claves nuevas (`chooseMonth`, `chooseYear`, `prevYear`, `nextYear`, `prevYears`, `nextYears` requeridas; `viewMonths` `{year}`, `viewYears` `{from}` `{to}`, `typeYear`, `current`, `hasValue`). Si el `.d.ts` de `labels` enumera claves, añadirlas (opcionales en el tipo; el aviso es de desarrollo).
- `events`: `navigate` con la nota «también al bajar desde la vista de meses».
- `contract`: sin cambio; añadir `"prototype"`: `design/lab/datepicker/r02/` a lo que haya (o lista). `status` vuelve a **`draft`** mientras se construye la r02 y a `candidate` tras la auditoría de coco.

### 14. Peso (#1028)

Ampliación de un componente que ya está en el principal (no es un componente nuevo: no abre #506 ni #550 y no puede salir a una entrada), con **lote propio** medido por bruno con `gzip -9`, copia aislada, antes y después, anotado en `CHANGELOG.md`:

- **`dist/grana.js` ≤ +2048 B (2 KiB)** gzip: dos rejillas, su teclado, el búfer del año, los marcadores, las clases de la franja y los avisos.
- **`dist/grana.css` ≤ +1024 B (1 KiB)** gzip: vistas, partes del título, marcas, franja que sigue, densidad de la superficie, regla de la hoja a 320 y las dos `@keyframes`.
- Se registra también lo que pesa importar **solo** `GDatePicker`.
- Con más, **vuelve a lima y decide el usuario**; el tope no se sube (regla de #963 y #964). No cuenta en los lotes de #1009, #1017 o #1019.

### 15. Verificación

- **vitest (bruno):** `months` sin valor pinta un mes en `single` y en `range` a cualquier ancho; `auto` sigue midiendo; las tres vistas y sus cabeceras; nombres de botones y celdas con sufijos en orden; `aria-selected` solo en `is-selected`; marcas en `single` y `range` (con inicio pendiente); `min`/`max` en meses y años (foco sí, elegir no, bordes con `aria-disabled`); teclado de las dos rejillas (cruces de año y de página, Ctrl+Inicio/Fin, RePág/AvPág, RTL); cifras (4 → salto recortado, Retroceso, `YEAR_TYPE_MS` con temporizadores falsos, Esc vacía primero); pila de Esc y `stopPropagation`; `navigate` al bajar y no al recorrer; foco al bajar en el mismo día recortado; `is-open-start`/`is-open-end` en uno y dos meses (y no en el corte entre meses); `data-zoom` solo al cambiar de nivel y origen por índice; aviso de las seis claves; `density` en `inline` sin aviso.
- **Playwright (bruno, tres motores):** Δ 0 de la caja del panel y de la cabecera al cambiar de vista y durante el zoom; la animación dura `press` con `ease-out` y escala entre 0,97 y 1,03 (con el tema por defecto), y con reducido solo fundido `fast` `linear`; interrupción (dos cambios seguidos) termina en la vista correcta con el foco; una marca de hover por cuadro también en meses y años; compacto: celda 30 px con puntero fino, 44 px con grueso, texto ≥ 12 px, objetivos ≥ 24 px; **hoja a 320 px con puntero grueso sin desborde** (7 × 44 caben) y a 375 px; un `inline` dentro de `GDialog`: Esc en meses sube y no cierra el diálogo; `GBookingBar` sigue con dos meses donde caben; consola limpia; prueba de rendimiento con props en línea (ninguna medida por render del padre).
- **Auditoría de coco** con un tema distinto del por defecto (otra `space`, otro `--g-press-scale`), tres motores, claro y oscuro, RTL, `forced-colors`, rúbrica de movimiento sobre el componente real.
- **No verificable aquí:** lector de pantalla real (título con dos botones, nodo vivo, rejillas de meses y años), táctil real, teléfono real.

### 16. Resolución de los hallazgos de kiwi (L1 a L9)

| # | Resolución |
| --- | --- |
| L1 | `months` = `1` por defecto (#1021); `months="auto"` explícito en los tres `GDatePicker` con campo de `GBookingBar` (`booking-bar.md`); `CHANGELOG` (§1) |
| L2 | Vistas, cabeceras, clases y `navigate` (§2, §10, §11; #1020, #1024) |
| L3 | `density` aprieta la superficie con las fórmulas de §8; hoja a 320 px resuelta con el relleno acotado (#1022) |
| L4 | Claves de A (§«Textos», §12; #1025); las de B (`laneYear`, `laneMonth`) y C (`goTo`, `goHint`) **no** se contratan (reservados) |
| L5 | `is-open-start`/`is-open-end`, extendidas a los extremos de dos meses (§7; #1027) |
| L6 | §3 (#1026); sin regla de B |
| L7 | La frase se retira de «Límites conocidos» cuando esté construido (anotado allí) |
| L8 | Fila nueva `cambiarNivel` en la tabla y en `motion.json`, con la escala reducida (§9; #1023) |
| L9 | Lote propio ≤ +2 KiB JS y ≤ +1 KiB CSS (§14; #1028); sin intérprete de C |

### 17. Encargos

- **coco (Sonnet; Opus si lo pide el criterio del zoom):** `GDatePicker.css`: escenario y vistas; cabecera por vista con alto constante; botones del título (`chevron-down` de Lucide, foco, hover con la regla de la tabla, 24/44 px); rejillas de meses y años de 3 × 4 que llenan el escenario; marcas `is-current`/`is-selected`/`is-in-value`/`is-disabled` con los pares de los días (`{color}-text` en el trazo, §7.1) y contraste medido (texto 4,5:1, marcas 3:1); pista y búfer de cifras (huecos vacíos dibujados, sin caracteres); `is-open-start`/`is-open-end` (desvanecido, RTL, `forced-colors`); densidad de la superficie con las fórmulas de §8 (y el título un escalón abajo en `compact`); regla de la hoja a 320 px; `@keyframes g-datepicker-zoom-in`/`-out` con `--_zoom-x/-y`, `--g-press-scale` y su inverso, `press` + `ease-out`, reducido `fast` + `linear` sin escala; una marca de hover por cuadro en meses y años. Mide el peso CSS con bruno.
- **bruno (Opus: motor de vistas, teclado y pruebas):** `GDatePicker.vue` (vista interna y su pila, cabeceras, rejillas, teclado de §4, cifras de §5 con `YEAR_TYPE_MS`, anuncios de §6, nodo `__title-live` y `aria-labelledby` de la rejilla, `min`/`max` de §3, franja que sigue de §7, `data-zoom` y origen por índice, Esc con `stopPropagation`, `navigate`, `months` = 1, `density` en `inline` sin aviso, aviso de las seis claves); `GDatePicker.meta.json` (§13); `GBookingBar.vue` (`months="auto"` en los tres `GDatePicker` con campo); textos de `@grana/blocks` y playground (§12); `motion.json` lo lee `check-motion.mjs` sin regla nueva (la fila es de comportamiento) y `tests/movimiento.spec.mjs` gana `cambiarNivel`; pruebas de §15; `CHANGELOG.md` (§1 y peso de §14).
- **Después:** auditoría de coco (`design/lab/datepicker/auditoria-r02.md`) y README de mora-docs.
