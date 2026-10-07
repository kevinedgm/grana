# Contrato · GWidget y primitivas de contenido (GMetric, GProgress, GDataList)

**Dueño:** lima · **Estado:** aprobado · **Basado en:** `design/lab/widget/r01/` (kiwi)
**Tags:** `g-widget`, `g-metric`, `g-progress`, `g-data-list` · **Categoría:** presentación de datos

**`GWidget`** es una **carcasa reutilizable**: una unidad visual independiente con encabezado, contenido, pie y acciones, que muestra información de un vistazo. **No conoce el significado de su contenido** (métricas, listas, gráficos, tablas…): lo pone la aplicación. **Mide su propio tamaño** y elige un **nivel de detalle** (divulgación progresiva): menos espacio, menos detalle. Soporta los estados *cargando*, *con datos*, *vacío*, *error*, *desactualizado* y *deshabilitado* **sin cambiar su estructura**. Las **primitivas** (`GMetric`, `GProgress`, `GDataList`) son piezas para componer el contenido. La rejilla del dashboard es `GWidgetGrid` (`design/contracts/widget-grid.md`). Alcance decidido por el usuario (DECISIONS.md #72 a #75): carcasa con estados, primitivas y rejilla; **galería y panel de configuración quedan para una segunda entrega**.

> **Frontera con `GCard` (DECISIONS.md #125, decisión del usuario):** `GWidget` y `GCard` son **independientes** en v0.1. `GWidget` es la carcasa de dashboard (niveles `s`/`m`/`l`, estados propios, rejilla, galería); `GCard` (`card.md`) es la primitiva general que se reorganiza. `GWidgetGallery` no ofrece tarjetas como widgets sin pasar por la carcasa. Se revisará una convergencia cuando `GCard` esté verificada.

## Principios

- **La carcasa no interpreta su contenido.** Nada de «métrica», «gráfico» o «lista» en su API: el contenido va en slots por nivel.
- **El tamaño lo manda el propio widget**, no la ventana: el mismo widget en una rejilla, un panel lateral, un diálogo o una página elige su nivel por el espacio que realmente tiene. **No existe una prop `size`.**
- **Los estados no cambian el espacio:** cargando (esqueleto), vacío y error ocupan el área del contenido; desactualizado conserva los datos.
- **Interacción limitada:** acciones simples y un enlace de detalle; el detalle se abre **fuera** (`drilldown`). Un widget no es una aplicación dentro de otra.
- **Presenta y emite intención.** El estado y los datos son props/slots; las acciones se emiten.
- **Sin textos por defecto** (Grana es internacional): todo texto va en props, slots y `labels`.
- **Sin gráficos propios.** Un gráfico va en un slot y debe llevar `role="img"` con nombre (o ser accesible por sí mismo).

## GWidget · Props

| Prop | Tipo | Valores | Default | Origen |
| --- | --- | --- | --- | --- |
| `title` | String | texto libre | sin valor | propia (nombre accesible) |
| `eyebrow` | String | categoría, texto libre | sin valor | propia |
| `description` | String | subtítulo, texto libre | sin valor | propia |
| `headingLevel` | Number | 2 a 6 | `3` | propia |
| `state` | String | `populated` `loading` `empty` `error` `stale` `disabled` | `populated` | propia |
| `level` | String | `auto` `s` `m` `l` | `auto` | propia (fija el nivel; `auto` lo mide) |
| `badge` | String \| Number | texto corto | sin valor | propia |
| `badgeColor` | String | `brand` `accent` `neutral` `success` `warning` `danger` `info` | `neutral` | compartida |
| `actions` | Array | `items` de `GMenu` (`[{ id, label, disabled?, icon?, shortcut?, danger?, type?, checked?, items? }]`) | `[]` | propia |
| `href` | String | URL del detalle | sin valor | propia |
| `drilldownLabel` | String | texto libre | sin valor | propia |
| `updatedText` | String | texto libre («Actualizado hace 5 min») | sin valor | propia |
| `density` | String | `default` `comfortable` `compact` | `default` | compartida |
| `headless` | Boolean | | `false` | propia (sin encabezado; el contenido lo pone todo) |
| `labels` | Object | ver «Textos (`labels`)» | `{}` | propia |
| `id` | String | | generado | propia |

### Reglas de props

- **`title`:** nombre accesible del widget (`aria-labelledby` de la `<article>`) y texto del encabezado. Sin `title` (ni slot `title`, ni `aria-label`/`aria-labelledby` en `$attrs`) avisa en desarrollo.
- **`headingLevel`:** nivel del elemento de encabezado del título (`h2` a `h6`); la aplicación lo ajusta a su jerarquía de página.
- **`state`:**
  - **`loading`:** esqueleto con la estructura del **nivel actual** (mismas zonas que con datos), `aria-busy="true"` y un aviso oculto `role="status"` con `labels.loading`. El encabezado se conserva; las acciones del menú siguen disponibles.
  - **`empty`:** el área de contenido muestra el slot `empty` (o un mensaje con `labels.empty`).
  - **`error`:** el área de contenido muestra el slot `error` (o `labels.error` y un botón con `labels.retry` que emite `retry`); `role="alert"`.
  - **`stale`:** conserva los datos y añade una **marca** (texto `labels.stale` en el badge, con forma) y, desde el nivel medio, `labels.staleText` **en el pie, en lugar de `updatedText`** (no añade alto al cuerpo); no oculta el contenido. El slot `footer` recibe `state` para decidir.
  - **`disabled`:** `aria-disabled="true"`, atenuado, y el cuerpo pasa a `inert` (sin foco ni interacción); el menú de acciones sigue disponible.
- **`level`:** con `auto` el widget lo mide (ver «Niveles»); `s`, `m` o `l` lo fijan (vistas previas, pruebas o contenedores de tamaño conocido).
- **`badge`:** texto o número corto, **con forma y texto** (no solo color); en el nivel `s` no se muestra. El estado del widget puede sustituirlo (`stale`, `disabled`, `error`).
- **`actions`:** los elementos del **menú de acciones** del encabezado: el mismo arreglo que los `items` de [`GMenu`](menu.md) (acciones, separadores, grupos, casillas, opciones, submenús y peligrosos); `{ id, label, disabled? }` sigue siendo válido. Sin valor por defecto (sin acciones no hay botón de menú). Cada elemento que se activa emite `action` con `{ id }` (y `checked` si es una casilla u opción).
- **`href`, `drilldownLabel`:** el pie muestra un enlace de detalle (desde el nivel medio) con `drilldownLabel`; con `href` es un `<a>`; sin `href`, un botón que emite `drilldown`. Solo pide el detalle: **la aplicación abre la página, el diálogo o el panel**.
- **`updatedText`:** texto de pie («Actualizado hace 5 min»); la aplicación lo compone.
- **`headless`:** sin encabezado (título, icono, badge, menú); el nombre accesible sigue saliendo de `title`/`aria-label`.
- **`density`:** multiplica el relleno y la separación (1×, 0.875×, 0.75×) con piso de 24px; no cambia la tipografía.
- **Atributos:** `class`, `style` y `data-*` van a la raíz; los `aria-*` también (salvo `aria-label`, que puede sustituir a `title`).

## Niveles y forma (el widget mide su propio tamaño)

Se miden el **ancho y el alto propios** con un observador de tamaño (sobre la raíz del widget), **sin literales**: los umbrales derivan de `--g-space-1`.

| Nivel | Ancho propio | Qué se muestra de la carcasa | Contenido (por convención) |
| --- | --- | --- | --- |
| `s` | < `--g-space-1 × 60` (240px con `space` 4) | Icono y título; **sin** categoría, subtítulo, badge ni pie | Una métrica, un icono y una tendencia mínima |
| `m` | ≥ `space × 60` y < `space × 110` (440px) | Categoría, título, subtítulo, badge, pie | Métrica, contexto y una visualización pequeña |
| `l` | ≥ `space × 110` | Todo | Varias métricas, visualización completa, acciones y detalle |

- **El alto también limita el nivel (DECISIONS #90):** con alto propio < `space × 36` (144px) el nivel es `s`; < `space × 64` (256px), como mucho `m`; el nivel final es el menor entre el del ancho y el del alto. Así un widget de una fila nunca pierde su cuerpo. Con `level` fijo no se aplica.
- **Forma:** `wide` si el ancho ≥ 1.9 × el alto; `tall` si el alto ≥ 1.3 × el ancho y el alto ≥ `space × 80` (320px); si no, `square`. Sirve para reorganizar columnas y filas **dentro** del contenido.
- El widget expone `data-level` y `data-shape` en la raíz, las clases `g-widget--level-*` y `--shape-*`, y el alcance `{ level, shape, state }` en sus slots.
- Los niveles **no dependen del tipo de puntero ni de la ventana**: el mismo widget cambia de nivel cuando cambia de sitio o de tamaño.
- El cuerpo **recorta** (`overflow: hidden`) lo que no cabe: el contenido debe adaptarse a su nivel.

## GWidget · Slots

| Slot | Propósito | Alcance | Anatomía que debe conservar |
| --- | --- | --- | --- |
| `icon` | Icono del encabezado (decorativo) | `{ level }` | Dentro de `g-widget__icon` (`aria-hidden`) |
| `eyebrow` | Categoría con contenido rico | | Dentro de `g-widget__eyebrow` |
| `title` | Título con contenido rico (sustituye a `title`) | | Dentro del encabezado; conserva el texto para el nombre accesible |
| `badge` | Sustituye al badge | `{ state }` | Con texto (no solo color) |
| `actions` | Sustituye al botón de menú y su lista | | La aplicación es responsable de su accesibilidad |
| `compact` | Contenido del nivel `s` | `{ level, shape, state }` | Respaldo: `default` |
| `default` | Contenido del nivel `m` (y respaldo de los demás) | `{ level, shape, state }` | Sin interactivos que no sean acciones simples |
| `detail` | Contenido del nivel `l` | `{ level, shape, state }` | Respaldo: `default` |
| `empty` | Contenido del estado vacío | `{ level }` | Sustituye a `labels.empty` |
| `error` | Contenido del estado de error | `{ level, retry }` | Sustituye al mensaje; `retry` emite `retry` |
| `loading` | Esqueleto propio | `{ level, shape }` | **Debe conservar el tamaño** de los datos; con `aria-hidden` en lo decorativo |
| `footer` | Contenido del pie (sustituye a `updatedText` y al enlace) | `{ level }` | Desde el nivel `m` |

**Cadena de contenido:** nivel `s` → `compact` ?? `default`; `m` → `default`; `l` → `detail` ?? `default`. Con un solo `default`, la aplicación decide por `level` (alcance del slot).

## GWidget · Eventos

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `action` | `{ id }` | El usuario elige una acción del menú |
| `retry` | | El usuario pulsa «Reintentar» (estado `error`) |
| `drilldown` | `{ event }` | El usuario pide el detalle (sin `href`, o con `href` y con `event.preventDefault()`, para un router) |

**Nota para bruno:** el estado es un prop (no hay `update:state`); los demás eventos (`click`, `keydown`…) no se declaran. Dentro de una rejilla (`GWidgetGrid`), el widget **añade al menú las acciones de la rejilla** (mover antes, mover después, tamaños y quitar) y las resuelve por sí solo; el resto sigue emitiendo `action`.

## Menú de acciones (`GMenu`)

`GWidget` **usa [`GMenu`](menu.md)** (DECISIONS.md #82 a #84): el comportamiento (patrón *Menu Button* de APG, teclado, posición, submenús, casillas y opciones) es el de ese contrato.

- **Disparador:** el botón del encabezado (`g-widget__menu`, tres puntos dibujados con CSS) es el slot `trigger` de `GMenu`; su nombre es `labels.actions` + el título («Acciones de Ingresos»).
- **Lista:** la de `GMenu` (`g-menu__list` y `g-menu__item`); **ya no existen** `g-widget__actions` ni `g-widget__action`. La lista se nombra por el botón.
- **`action`** se emite con `{ id }` al activar un elemento; en una casilla u opción, con `{ id, checked }`. **El widget no guarda el estado:** la aplicación actualiza `actions`.
- **Cierre:** como en `GMenu` (`closeOnSelect="auto"`): las acciones cierran y devuelven el foco al botón, salvo que muevan el widget (por ejemplo «Quitar»).
- Dentro de una rejilla, el widget **añade** las acciones de la rejilla (ver `widget-grid.md`).

## Textos (`labels`)

Ninguno tiene valor por defecto. Los requeridos avisan una vez en desarrollo.

| Clave | Uso | Requerido |
| --- | --- | --- |
| `actions` | Nombre del botón de menú («Acciones de») | Sí, con `actions` o dentro de una rejilla |
| `loading` | Aviso oculto de carga | Sí, con `state="loading"` |
| `empty` | Mensaje del estado vacío | Recomendado |
| `error` | Mensaje del estado de error | Recomendado |
| `retry` | Texto del botón «Reintentar» | Sí, con `state="error"` |
| `stale` | Texto del badge de estado desactualizado | Sí, con `state="stale"` |
| `staleText` | Línea de datos desactualizados | Recomendado |
| `disabled` | Texto del badge de estado deshabilitado | Recomendado |

## Estructura accesible

```html
<article class="g-widget g-widget--level-m g-widget--shape-square g-widget--state-populated g-widget--density-default" id="ID"
         data-level="m" data-shape="square" aria-labelledby="ID-title" aria-busy="true" aria-disabled="true">
  <header class="g-widget__head">
    <span class="g-widget__icon" aria-hidden="true">…</span>
    <div class="g-widget__titles">
      <span class="g-widget__eyebrow">Finanzas</span>
      <h3 class="g-widget__title" id="ID-title">Ingresos</h3>
      <p class="g-widget__sub">Últimos 30 días</p>
    </div>
    <span class="g-widget__badge">Mensual</span>
    <button class="g-widget__menu" type="button" aria-haspopup="menu" aria-expanded="false" aria-controls="ID-menu" aria-label="Acciones de Ingresos">…</button>
    <ul class="g-menu__list" id="ID-menu" role="menu" popover="manual" aria-labelledby="ID-trigger">…</ul>   <!-- GMenu, ver menu.md -->
  </header>
  <div class="g-widget__body"> … slot por nivel, esqueleto, vacío, error … </div>
  <footer class="g-widget__foot"><span>Actualizado hace 5 min</span><a class="g-widget__link" href="/ingresos">Ver detalle</a></footer>
</article>
```

- **Estados en el cuerpo:** `<span class="g-widget__sr" role="status">` (carga), `<div class="g-widget__skeleton" aria-hidden="true">` con `g-widget__line` (varios anchos), `g-widget__block`; `<div class="g-widget__state">` (vacío y error, este con `role="alert"`); `<p class="g-widget__stale">`.
- **`aria-busy`** solo en `loading`; **`aria-disabled`** solo en `disabled` (el cuerpo lleva `inert`).
- **Nivel `s`:** el DOM **no** renderiza categoría, subtítulo, badge ni pie (no basta ocultarlos: una versión de un solo icono no debe leerlos).

## Primitivas

### GMetric

| Prop | Tipo | Valores | Default |
| --- | --- | --- | --- |
| `label` | String | texto libre | sin valor |
| `value` | String \| Number | ya formateado por la aplicación | sin valor |
| `unit` | String | texto libre | sin valor |
| `trend` | String | **texto** de la tendencia («+12%») | sin valor |
| `direction` | String | `up` `down` `flat` | `flat` |
| `trendColor` | String | los siete colores | `neutral` |
| `context` | String | texto libre («vs. mes anterior») | sin valor |
| `size` | String | `sm` `md` `lg` | `md` |

`<div class="g-metric">` con `g-metric__label`, `g-metric__value` (y `g-metric__unit`) y, con `trend`, `<span class="g-metric__trend" data-direction>` con **un símbolo dibujado (▲ ▼ ■) y el texto**; la tendencia **nunca depende solo del color**; `context` en `<small>`. El valor no se anuncia como región viva. Sin `label`, avisa (nombre accesible del valor).

### GProgress

| Prop | Tipo | Valores | Default |
| --- | --- | --- | --- |
| `value` | Number | 0 a `max` | `0` |
| `max` | Number | > 0 | `100` |
| `label` | String | nombre accesible (**obligatorio**) | sin valor |
| `valueText` | String | texto del valor («72%»), de la aplicación | sin valor |
| `color` | String | los siete colores | `brand` |
| `size` | String | `sm` `md` | `md` |
| `showValue` | Boolean | | `true` |
| `showLabel` | Boolean | | `true` |

**Atributos** (DECISIONS.md #375, `GFileField`): `class`, `style` y el resto de atributos de la etiqueta van a la **raíz** `g-progress` (antes se descartaban); el nombre accesible de la barra sigue siendo `label`, no `aria-label` de `$attrs`. Es un cambio aditivo: nada de lo anterior los pasaba.

**`showLabel`** (DECISIONS.md #375, para la ficha de `GFileField`, `file-field.md`): con `false` la etiqueta no se pinta pero **sigue siendo el nombre accesible** (`aria-label`, sigue obligatoria); con `showLabel` y `showValue` a `false` no hay `g-progress__row` (barra sola).

`<div class="g-progress">` con la fila de texto (etiqueta y `valueText`) y `<div class="g-progress__bar" role="progressbar" aria-valuenow aria-valuemin="0" aria-valuemax aria-valuetext aria-label>`. El valor se recorta a `[0, max]`; sin `label`, avisa.

#### Contraste del avance (`tokens.md` §7.1, «Formas de familia sin par»; DECISIONS.md #439)

**Origen:** medida de coco (`design/lab/contraste-marcado/estilo.md`, 27a89a0): el relleno `{color}` contra la pista `surface-sunken` da **1,20:1** (`accent`, spotify claro) y **1,64:1** (`brand`, lustre claro). El avance **es** el valor que transmite el componente; con `showValue: false` es lo único visible (WCAG 1.4.11, objeto gráfico necesario para entender).

**Decisión:** el relleno `g-progress__fill` se pinta **entero en `--g-color-{color}-text`** (`primary-text` con `color="brand"`). No lleva nada encima (ningún `on-{color}`), así que es una forma, no un relleno con par: ni contorno aparte ni pista distinta. En el tema por defecto `-text` = base: **Δ0**. Contra la pista y contra la superficie, ≥ 4,21:1 (la cifra de `-text` en los cuatro temas medidos). Un avance pequeño (2 %) se sigue viendo entero, cosa que un filo de un trazo sobre un relleno pálido no garantiza.

**La pista no cambia** (`surface-sunken` con su contorno `border`): con el avance a ≥ 3:1 se lee dónde termina; el final de la pista lo da el ancho del componente y, por defecto, el valor en texto (`showValue`). **Límite conocido:** con `showValue: false` el 100 % se intuye por el ancho; quien oculte el valor debe darlo visible en otra parte. La ficha de `GFileField` **no cambia**: su `GProgress` es una capa con relleno `accent-soft` y borde de avance `on-accent-soft` (#379), un relleno con par.

**Encargo a coco** (con el de `stepper.md`; una sola entrega, Sonnet):

1. `GProgress.css`: `.g-progress__fill` → `background: var(--_text)`; **añadir `--_text`** (`--g-color-{familia}-text`; `brand` → `--g-color-primary-text`) al bloque base y a las siete `.g-progress--color-*`. Si `--_color` queda sin uso, quitarlo. `forced-colors`, transición y `translate` no cambian.
2. **Corregir el comentario** de `.g-progress__bar`: dice que el carril llega a 3:1 con «contorno de borde de control», pero lee `--g-color-border` (`rgb(0 0 0 / 0.08)` en el claro). El comentario debe decir lo que hace; el valor no se toca.
3. Comprobar que `.g-file-field__progress .g-progress__fill` sigue ganando (su relleno propio no debe pasar a `-text`).
4. **Medir** (en `design/lab/contraste-marcado/verificar.mjs` o uno hermano): avance contra la pista y contra `surface` ≥ 3:1 en el tema por defecto, lustre, spotify y `primary` propia (#107), claro y oscuro, con `brand`, `accent` y `warning`; **Δ0 píxel a píxel** en el tema por defecto con `brand` y `accent`; la ficha de `GFileField` sin cambio. Resultado en `design/lab/contraste-marcado/estilo.md`.

**bruno:** sin código. **mora-docs:** una línea en «Accesibilidad» del README de `GProgress` (si lo hay; si no, del de `GWidget`) cuando coco haya medido.

### GDataList

| Prop | Tipo | Valores | Default |
| --- | --- | --- | --- |
| `rows` | Array | `[{ label, value, swatch? }]` | `[]` |
| `label` | String | nombre accesible de la lista | sin valor |
| `swatches` | Boolean | muestra las muestras (leyenda) | `false` |

`<ul class="g-data-list">` de `<li>` con `g-data-list__swatch` (opcional), `g-data-list__label` y `g-data-list__value`. **Sirve de leyenda:** con `swatches`, cada muestra es un **par tono + forma** de una secuencia fija de cuatro (círculo, cuadrado, rombo, triángulo, como las figuras de `GBadge`), para no depender solo del color; una fila puede fijar `swatch` (0 a 3). Las filas largas se recortan con elipsis; el texto completo sigue en el DOM.

## Tokens consumidos

| Token | Para qué |
| --- | --- |
| `--g-color-surface`, `--g-color-surface-sunken`, `--g-color-border`, `--g-color-border-strong`, `--g-color-focus` | Superficie suave del widget, esqueleto y foco |
| `--g-color-text`, `--g-color-text-muted`, `--g-color-text-subtle` | Título, categoría, subtítulo, pie |
| `--g-color-{color}`, `--g-color-on-{color}`, `--g-color-{color}-soft`, `--g-color-{color}-text` | Badge, tendencia y progreso |
| `--g-surface-*`, `--g-shadow-1` | Lenguaje de superficies (sin sombras fuertes) |
| `--g-radius-*` | Radio del widget, del icono y de las barras |
| `--g-space-1..8` | Relleno, separaciones y umbrales de nivel (`space × 60`, `space × 110`, `space × 80`) |
| `--g-font-ui`, `--g-text-{caption|body-sm|body|title-sm|title}-{size|line|weight}`, `--g-text-action-weight` | Texto y valores (el valor de una métrica usa una escala de título) |
| `--g-border-width`, `--g-focus-width`, `--g-focus-offset` | Bordes y foco |
| `--g-duration-fast`, `--g-duration-press`, `--g-ease-out` | Fundidos y pulso del esqueleto |

**Tokens nuevos:** ninguno para `GWidget` y las primitivas (los tokens de rejilla están en `widget-grid.md` y `tokens.md` §14).

## Clases (contrato entre bruno y coco)

Bruno las emite; coco las estiliza. Ninguno usa otras.

| Clase | Elemento | Cuándo |
| --- | --- | --- |
| `g-widget` | Raíz (`article`) | Siempre |
| `g-widget--level-{s\|m\|l}`, `--shape-{square\|wide\|tall}`, `--state-{…}`, `--density-*`, `--headless`, `is-editing` | Raíz | Siempre (`is-editing` dentro de una rejilla en edición) |
| `g-widget__head`, `__icon`, `__titles`, `__eyebrow`, `__title`, `__sub`, `__badge` (+ `--color-{color}`) | Encabezado | Según nivel y props (el color del badge sale de `badgeColor`) |
| `g-widget__menu` | Botón del menú de acciones (el resto de clases del menú son de `g-menu__*`) | Con acciones |
| `g-widget__body`, `__state`, `__stale`, `__skeleton`, `__line`, `__block`, `__sr` | Cuerpo y estados | Según estado |
| `g-widget__foot`, `__link` | Pie | Desde el nivel `m` |
| `g-metric` (+ `__label`, `__value`, `__unit`, `__trend`, `--size-*`, `--trend-{color}`) | Métrica | Siempre (`--trend-*` sale de `trendColor`) |
| `g-progress` (+ `__row`, `__bar`, `__fill`, `--color-*`, `--size-*`) | Progreso | Siempre; bruno da el avance al relleno con la variable dinámica `--_value` (porcentaje) |
| `g-data-list` (+ `__swatch` con `data-swatch="0"` a `"3"`, `__label`, `__value`) | Lista de datos | Siempre |

## Resolución de hallazgos de r01

| # | Hallazgo | Resolución | Base |
| --- | --- | --- | --- |
| 1 | Alcance | Este contrato (`GWidget` y primitivas) y `widget-grid.md`; galería y configuración, fuera | DECISIONS.md #72 |
| 2 | Props de `GWidget` | Ver «Props»; **sin `size`**; `level` solo para fijarlo | DECISIONS.md #73 |
| 3 | Niveles | Umbrales derivados de `space` medidos sobre el propio widget | DECISIONS.md #73 |
| 4 | Slots | `icon`, `eyebrow`, `title`, `badge`, `actions`, `compact`/`default`/`detail`, `empty`, `error`, `loading`, `footer` | — |
| 5 | Eventos | `action`, `retry`, `drilldown` | — |
| 6 | Primitivas | `GMetric`, `GProgress`, `GDataList` (leyenda con tono y forma) | DECISIONS.md #74 |
| 7–9 | Rejilla | `widget-grid.md` | DECISIONS.md #75 |
| 10 | Tokens | `--g-widget-row` y `--g-widget-gap` en `tokens.md` §14 | DECISIONS.md #75 |
| 11 | Persistencia | Un dato; la aplicación guarda | — |
| 12 | Modo de edición | Con `is-editing` el widget oculta el badge y el enlace de detalle (las asas ocupan su sitio) | DECISIONS.md #75 |
| 13 | Segunda entrega | **Sin cambios en `GWidget`:** un widget configurable incluye `{ id: 'configure', label }` en `actions` y la aplicación abre `GWidgetConfig` al recibir `action` con ese `id` (convención, no API). La galería es `GWidgetGallery` (`widget-gallery.md`) y el panel, `GWidgetConfig` (`widget-config.md`) | DECISIONS.md #76 |

## Límites conocidos

- **Sin galería ni panel de configuración** (segunda entrega); **sin gráficos** (slot); sin widgets de negocio hechos.
- **El contenido debe adaptarse a su nivel:** el cuerpo recorta lo que no cabe.
- **Una métrica en el nivel `s` sin etiqueta visible** (el nivel `s` no muestra categoría ni subtítulo): la métrica trae su propia etiqueta.
- **El menú del widget** es propio (no un `GMenu` general): el patrón se reutilizará cuando exista.
- **Lector de pantalla:** cómo se anuncian el estado de carga, el error y las tendencias está por verificar; Firefox, Safari y táctil real, por verificar.

## Abierto (no bloquea el paso siguiente)

- Valores estéticos (proporciones, escala del valor de la métrica, esqueleto, superficie): los decide coco con los tokens listados.
- Variantes de énfasis del widget (`soft`, `outline`): **fuera de v0.1**.
