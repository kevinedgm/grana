# Contrato · GTable

**Dueño:** lima · **Estado:** aprobado; carga, vacío y error con el motor común contratados por #540 (2026-10-08, pendiente de bruno y coco); filas por página, la fila ancla, la puerta de fila, el despliegue y el estado de fila contratados el 2026-10-13 (#592 a #602, pendiente de coco y bruno); `focusRow`/`focus` y el recuento a cero, enmiendas para `GResourceList` del 2026-10-20 (#789, #791, pendiente de coco y bruno) · **Basado en:** `design/lab/table/r01/`, `r02/` y `r03/`, y `design/lab/pagination/r02/` (kiwi)
**Tag:** `g-table` · **Categoría:** presentación de datos

Tabla de datos con **personalidad** (celdas ricas, filas como superficie, densidad), **columnas compuestas** (varios campos en una columna), orden, selección, filtros por columna con reglas, paginación y acciones por fila, que en contenedores estrechos **se convierte en tarjetas** sin cambiar de DOM. Alcance decidido por el usuario (DECISIONS.md #109 a #111).

---

## Principios

- **Campos ≠ columnas.** Los `rows` traen campos; las `columns` deciden qué se ve. Una columna puede componer varios campos (`leading` + `title` + `subtitle`).
- **Una definición, dos presentaciones.** El mismo `<table>` con roles explícitos se dibuja como tabla o como tarjetas, según el ancho de su contenedor.
- **Tabla de datos, no `grid`.** Tab recorre los controles; sin navegación de celdas con flechas.
- **Presenta y emite intención.** Ordena, filtra y pagina **localmente por defecto**; con `sortMode`/`filterMode` `external` solo emite y el consumidor consulta su servidor.
- **Sin textos propios** (`labels`) y **sin catálogo de celdas**: las celdas ricas son slots con los componentes de Grana.

## Props

| Prop | Tipo | Valores | Default | Origen |
| --- | --- | --- | --- | --- |
| `columns` | Array | ver «Columnas» | `[]` (función) | propia |
| `rows` | Array | objetos con campos | `[]` (función) | propia |
| `rowKey` | String | nombre de campo | `id` | propia |
| `caption` | String | texto libre | sin valor | propia |
| `sort` | Object \| null | `{ key, direction: 'ascending' \| 'descending' }` | `null` | propia (`v-model:sort`) |
| `sortMode` | String | `local` `external` | `local` | propia |
| `selectable` | Boolean | | `false` | propia |
| `selected` | Array | claves (`rowKey`) | `[]` (función) | propia (`v-model:selected`) |
| `filters` | Array | `{ key, op, value }` | `[]` (función) | propia (`v-model:filters`) |
| `filterMode` | String | `local` `external` | `local` | propia |
| `page` | Number | ≥ 1 | `1` | propia (`v-model:page`) |
| `pageSize` | Number | ≥ 1 | sin valor (sin paginar; con `pageSizes`, el primero de la lista) | propia (`v-model:pageSize`, #593; sin `v-model`, estado propio como `page`) |
| `pageSizes` | Array | enteros ≥ 1 | sin valor (sin selector) | propia (#593; la pasa a su `GPagination`) |
| `total` | Number | ≥ 0 | sin valor | propia |
| `responsive` | String | `auto` `table` `cards` | `auto` | propia |
| `appearance` | String | `lines` `surface` | `lines` | propia |
| `density` | String | `default` `comfortable` `compact` | `default` | compartida |
| `maxHeight` | String | longitud CSS | sin valor | propia |
| `loading` | Boolean | | `false` | compartida |
| `loadingRows` | Number | ≥ 1 | `3` | propia (en la primera carga; al refrescar, las filas que había a la vista, #540) |
| `error` | Boolean | | `false` | propia (reservada por #327, contratada por #540) |
| `announceError` | Boolean | | `true` | propia (#540; como `GLoadRegion`): con `false`, el fallo no se anuncia (lo anuncia la isla) |
| `rowHref` | Function | `(row) => string \| null` | sin valor | propia (#598): puerta `<a href>` en la columna principal |
| `activatable` | Boolean | | `false` | propia (#598): puerta `<button>` en las filas sin `href` |
| `lastOpened` | String \| Number \| null | clave (`rowKey`) | `null` | propia (`v-model:lastOpened`, #598; sin `v-model`, estado propio): la última fila abierta |
| `expanded` | Array | claves (`rowKey`) | `[]` (función) | propia (`v-model:expanded`, #599; solo con el slot `detail`) |
| `rowStatus` | Function | `(row) => { status, text, key? } \| null` | sin valor | propia (#600); **sin `rowClass`** |
| `showSelectedCount` | Boolean | | `true` | propia (#800): con `false`, el recuento de selección sigue montado con `role="status"` y su texto, pero **oculto a la vista** (patrón de texto oculto); para quien pinta su propio recuento visible en el `toolbar` |
| `labels` | Object | ver «Textos» | `{}` (función) | propia |

### Columnas

| Campo | Tipo | Nota |
| --- | --- | --- |
| `key` | String | Único; identifica la columna (orden, filtros, slots `cell-{key}`). Si no es compuesta, también es el **campo** que se muestra |
| `label` | String | Encabezado y etiqueta en tarjetas |
| `title`, `subtitle`, `leading` | String | **Columna compuesta**: nombres de campo para el título, el subtítulo y el inicio (texto corto, p. ej. iniciales; para avatar o icono, slot `leading-{key}`) |
| `primary` | Boolean | Encabeza la tarjeta. Por defecto, la primera compuesta; sin compuesta, la primera columna |
| `align` | String | `start` (defecto) \| `end` (números: cifras tabulares) |
| `format` | Function | `(value, row) => string` para la celda simple |
| `sortable` | Boolean | Botón de orden en el encabezado |
| `sortBy` | String | Campo por el que ordena (defecto: `key`; en compuesta, `title`) |
| `min` | Number | Ancho mínimo en unidades de `space` (defecto 24; compuesta 40). Suma para el umbral de tarjetas |
| `filter` | Object | Ver `filter-bar.md`: `{ type, options?, unit?, fields?, suggest? }`. En compuesta, `fields` por defecto = `[title, subtitle]` |

### Reglas de props

- **Orden local:** compara el campo de `sortBy` (números como números, texto con `Intl.Collator` del idioma del documento). Un clic en el encabezado ordena ascendente; otro, descendente; en otra columna, vuelve a ascendente. Con `external`, solo emite `update:sort`.
- **Filtros locales:** Y entre filtros; O dentro de un `enum`. Con `external`, solo emite `update:filters`. Cambiar filtros vuelve a la página 1 (`update:page`).
- **Paginación:** con `pageSize`, la tabla corta localmente y muestra `GPagination` debajo. Con `total` (y datos ya paginados por el servidor), solo muestra la paginación y emite `update:page`.
- **Selección:** casilla por fila y «todo» en el encabezado (o en la barra, en tarjetas), que actúa sobre **la página visible**, con estado mixto. La fila seleccionada lleva la clase `is-selected`; **no** `aria-selected` (no permitido en filas de tabla).
- **`caption`:** nombre accesible de la tabla (visible). Sin `caption` ni `aria-label`/`aria-labelledby`, en desarrollo `console.warn`.
- **`responsive`:** `auto` mide el contenedor (`ResizeObserver`) y pasa a tarjetas cuando su ancho es menor que **(suma de `min` + 10 de selección + 10 de acciones) × `--g-space-1`**. Sin medición (SSR), tabla.
- **`appearance`:** `lines` (separadores finos) o `surface` (cada fila es una superficie con separación y radio, el lenguaje de `GSurface`). No se llama `variant`.
- **`maxHeight`:** limita el alto del área desplazable; la cabecera queda pegajosa. Variable en línea (`--_max-height`).
- **`loading`:** `aria-busy="true"` y `loadingRows` filas esqueleto (`aria-hidden`) con la estructura de las columnas. **Anuncio de carga (#265):** ver «Carga y anuncios».
- **Resto de atributos:** van a la raíz.

## Textos (`labels`, sin valores por defecto)

| Clave | Uso |
| --- | --- |
| `selectAll` | Casilla «todo» |
| `selectRow` | Función `(row) => string` o plantilla con `{title}`: nombre de la casilla de cada fila |
| `rowActions` | Ídem: nombre del botón de acciones de cada fila |
| `actionsHeader` | Encabezado (oculto) de la columna de acciones |
| `selectedCount` | Plantilla con `{count}` |
| `sortBy`, `ascending`, `descending` | Controles de orden en tarjetas |
| `sorted` | Anuncio, plantilla con `{label}` y `{direction}` |
| `loading` | Texto de la región viva mientras `loading` es `true` («Cargando clientes…»). Sin plantilla (#265) |
| `empty`, `emptyFiltered`, `clearFilters` | Vacío real, vacío por filtros y su acción |
| `results` | Plantilla con `{count}` (anuncio y recuento). También anuncia el **fin de la carga** (#265) |
| `slow` | Texto visible y anuncio, una vez, a los 5 s de carga («Sigue cargando clientes…»). Opcional (#540) |
| `failed` | Texto del fallo (visible y anunciado en lugar de `results`) y título del `GEmpty cause="error"` por defecto (#540) |
| `retry` | Botón «Reintentar» del fallo (#540) |
| `range` | Anuncio del rango tras un cambio de página o de tamaño, plantilla con `{from}`, `{to}`, `{total}` («Filas {from}–{to} de {total}»). Sin ella, todo como antes (#596) |
| `detail` | Nombre del grupo de la ficha desplegada, plantilla con `{title}` («Lote {title}»), #599 |
| `filters` | Objeto con los textos de `GFilterBar` |
| `pagination` | Objeto con los textos de `GPagination` (con `pageSizes`, también `pageSize`, #593) |

Sin un texto, su control conserva un nombre mínimo derivado (p. ej. el `label` de la columna) cuando existe; si no, `console.warn` en desarrollo.

## Carga y anuncios (#265)

La tabla tiene **una** región viva: `<p class="g-table__sr" aria-live="polite">`, **hermana** del área desplazable y **fuera** del `<table aria-busy>` (dentro de un elemento ocupado, algunos lectores retienen los cambios hasta que deja de estarlo). **Existe desde el montaje** y siempre (#14). El texto de carga va **ahí**, no en una celda: las filas esqueleto siguen `aria-hidden` y no se añade fila ni celda con texto oculto (una fila falsa contaría como fila de datos al navegar la tabla). No se añade `role="status"` ni otra región.

| Momento | Texto de la región | Nota |
| --- | --- | --- |
| `loading` pasa a `true` (o la tabla se monta con `loading`) | `labels.loading` | Se escribe en el **ciclo siguiente** (`nextTick`), nunca en el mismo render del montaje (#14, como `loadingText` de `GBtn`). **Permanece** mientras dure la carga: quien recorre la página con el cursor virtual lo encuentra tras la tabla |
| `loading` pasa a `false` | `labels.results` con `{count}` = el recuento **ya actualizado** (o el rango, si la carga la causó un cambio de página o de tamaño y hay `labels.range`, #596) (`total` si se da; si no, las filas tras filtrar) | En el ciclo siguiente, para leer `rows`/`total` nuevos. **Con 0 filas se anuncia igual** (`{count: 0}`), como al filtrar: el texto de `empty`/`emptyFiltered` (o el slot `empty`) ya está **dentro** de la tabla y no se repite por la región. Sin `labels.results`, la región se **vacía** |
| Empieza la carga (`loading` pasa a `true`) | La región se **vacía** antes de escribir `labels.loading` (#559) | Así el anuncio de fin se oye aunque el recuento no cambie; **excepción:** si el anuncio del orden se escribió en ese mismo ciclo, no se vacía (siguiente fila) |
| Orden escrito en el mismo ciclo en que empieza la carga (`sortMode: 'external'`) | Se conserva `sorted`; **`loading` no lo pisa** | La acción del usuario es lo que espera oír; el fin de la carga anuncia el recuento |
| Anuncio de `results` tras filtrar (se escribe en `nextTick`) con la tabla ya en `loading` (`filterMode: 'external'`) | **No se escribe**: queda `labels.loading` | El recuento sería el viejo; el fin de la carga anuncia el nuevo |

- **Cambio de `filters` desde fuera (enmienda de #265, #569).** La tabla anuncia `labels.results` cuando cambian los filtros efectivos **por cualquier vía**: su barra o la prop `filters` (tarjetas, búsqueda propia, URL). **Sin duplicar** (un cambio, un anuncio, aunque la barra y la prop coincidan) y **sin anunciar en la carga inicial** (el montaje con `filters` ya puestos no escribe nada). Con `filterMode: 'external'`, al llegar los datos (regla de carga de arriba y #540), con el recuento ya actualizado. Sin `labels.results`, nada cambia.
- `aria-busy` se conserva en el `<table>` (es estado, no anuncio). La clase `is-loading` no cambia.
- **Mientras carga**, la casilla «todo», el orden, los filtros y la paginación **siguen operables** (como `GSelect`: `loading` no bloquea); si la aplicación quiere bloquearlos, lo hace ella.
- **Avisos de desarrollo** (una vez cada uno, `[Grana] <GTable>`): `loading` en `true` sin `labels.loading`; `loading` vuelve a `false` sin `labels.results`. Sin ellos la tabla funciona (solo con `aria-busy`, que la mayoría de lectores no anuncia).
- **Precedentes que sigue:** `GCard` (`labels.loading` en su región desde el montaje, `labels.loaded` opcional al terminar) y `GWidget` (`labels.loading`). La tabla **no** añade `loaded`: su fin natural de carga es el recuento, y `results` ya existe. `GBtn` (`loadingText`) es prop porque el botón no tiene `labels`.

## Carga, vacío y error con el motor común (#540)

Adopción del motor de `design/contracts/load-region.md` (#531 a #539). **Primera entrega** (con `GLoadRegion` y `GEmpty`). El dibujo de la tabla (filas esqueleto con celdas) y su región viva (#265) **se quedan**.

1. **Retraso de 200 ms.** Con `loading` en `true`: si había filas a la vista, **siguen**, con el `<tbody>` **inerte**, hasta los 200 ms; si no había (primera carga), las filas esqueleto se pintan **invisibles** (`is-pending`, `visibility: hidden`: reservan el sitio; nunca el texto de vacío). Una carga que acaba antes no enseña esqueleto.
2. **Filas esqueleto:** a los 200 ms sustituyen a las filas; **tantas como había a la vista** (tope `pageSize` si lo hay), o `loadingRows` en la primera carga: el alto no salta al refrescar. **Enmienda (#596):** tras un **cambio de tamaño**, las filas que **van a llegar**, con la ranura del ancla sujeta (ver «Filas por página y la fila ancla», «Modo servidor»). Cada barra vive **en la caja de línea** de su celda (`1lh − space × 2`, la receta de `GSummary`, #352): una fila esqueleto mide lo que una fila de una línea. Siguen `aria-hidden`.
3. **Mínimo de 400 ms** a la vista; las filas nuevas esperan al mínimo (la tabla pinta su copia hasta el final de la fase).
4. **A los 5 s:** con `labels.slow`, una línea visible `g-table__slow` superpuesta al pie del área desplazable (sin mover nada; ≥ 4,5:1) y un anuncio en la región, una vez (`is-slow`).
5. **Anuncios (enmienda de #265):** `labels.loading` se escribe en la región **cuando el esqueleto se ve** (200 ms), no en el ciclo siguiente a `loading: true`; una carga que no se ve solo anuncia su fin. El fin sigue siendo `labels.results` con `{count}`, salvo con `error` (punto 7) y salvo una carga causada por página o tamaño con `labels.range`, que termina con **el rango** (#596, «Anuncio del rango»). Las demás filas de la tabla de «Carga y anuncios» no cambian.
6. **Sin pulso** (`g-table-pulse` fuera, #539): el esqueleto es quieto; tono **`--g-color-mold`** (#538) en lugar de `--g-color-surface-sunken`; en `forced-colors`, `forced-color-adjust: none` y `GrayText`.
7. **`error` (Boolean; enmienda de #327):** se aplica al terminar la carga.
   - **Con filas a la vista** (las de antes): **se quedan** y vuelven a ser usables; encima del área desplazable, en flujo, la barra **`g-table__failed`** (`circle-alert` decorativo, `labels.failed`, `GBtn size="sm" variant="soft" color="neutral"` `labels.retry` → `retry`; `is-failed`; partes `g-table__failed-icon` —el `span aria-hidden` del icono— y `g-table__failed-text`, #546, #548). La región anuncia `labels.failed` **en lugar de** `labels.results`.
   - **Sin filas:** la fila de estado pinta el slot **`error`** (`{ retry }`) o, sin él, **`GEmpty cause="error"`** con `title` = `labels.failed` y un `GBtn` `labels.retry` en `actions` (`size="sm" variant="soft" color="neutral"`, #548); la región anuncia `labels.failed`.
   - Mientras corre la carga siguiente, la barra no se pinta. Con la isla de estado anunciando el mismo fallo, la aplicación pone **`announceError: false`**: la barra o el vacío de error se pintan igual, pero la región **no anuncia nada** al terminar (ni `results` ni `failed`); sin filas, el slot `error` puede llevar una `GStatusMark` (#327, #541).
8. **Vacío por defecto con `GEmpty`:** sin slot `empty`, la fila de vacío pinta `GEmpty cause="none"` con `title` = `labels.empty`, o `cause="filtered"` con `title` = `labels.emptyFiltered` y un `GBtn` `labels.clearFilters` en `actions` (`size="sm" variant="outline" color="brand"` explícito: es la única acción del vacío y por tanto la principal, #555; sustituye al botón `g-filter-bar__clear` de hoy; mismo `clear`). Con el slot, manda el slot (`{ filtered, clear }`; un `GEmpty` con `filters` y cuentas es receta del README).
9. **Foco (#534):** el `<table>` lleva `tabindex="-1"` (con su nombre de `caption` o `aria-label`). Al empezar, si el foco está en el `<tbody>`, pasa al `<table>`; al llegar, vuelve a la fila con el mismo `rowKey` y al enfocable del mismo índice dentro de ella; si no existe, se queda en el `<table>`; nunca en `body`. La vuelta tras «Limpiar filtros» de hoy se conserva.
10. `aria-busy` se queda en el `<table>`; `is-loading` sigue a la prop; mientras carga, la barra (orden, filtros, paginación) **sigue operable** (como hoy).
11. **Avisos nuevos** (`[Grana] <GTable>`, una vez): `error` sin `labels.failed` ni slot `error`; `error` sin `labels.retry` ni slot `error`.

**`meta.json`** (bruno, #443): props `error` y `announceError`, evento `retry`, slot `error` con `{ retry }`, claves `slow`, `failed` y `retry` en `labels`. **Verificación:** `GTable.test.js` (fases con temporizadores falsos, filas del esqueleto, error con y sin filas, `GEmpty` por defecto, foco por `rowKey`, anuncios) y `tests/table-load.spec.mjs` en los tres motores (tiempos reales, Δ0 al refrescar, 0 animaciones a 5,2 s, `forced-colors` en Chromium). **Reservado** (#543): B completo (`refresh` `keep`/`replace`: filas que siguen a la vista tras el retraso, filo y marcas de lo nuevo), molde desde una muestra de filas y salida con cuentas por filtro calculada por la tabla en `filterMode: 'local'`.

## Estructura accesible

```html
<div class="g-table g-table--mode-table g-table--appearance-lines g-table--density-default">
  <div class="g-filter-bar">…</div>                          <!-- si alguna columna declara filter -->
  <div class="g-table__bar">…seleccionar todo · ordenar por (solo tarjetas) · recuento…</div>
  <div class="g-table__scroll">
    <table class="g-table__table" role="table" aria-busy="false">
      <caption class="g-table__caption">Clientes</caption>
      <thead role="rowgroup"><tr role="row">
        <th role="columnheader" scope="col" class="g-table__select">…casilla todo…</th>
        <th role="columnheader" scope="col" aria-sort="ascending"><button class="g-table__sort" type="button">Cliente …</button></th>
        <th role="columnheader" scope="col" class="g-table__actions"><span class="g-table__sr">Acciones</span></th>
      </tr></thead>
      <tbody role="rowgroup">
        <tr role="row" class="g-table__row is-selected">
          <td role="cell" class="g-table__select"><input type="checkbox" aria-label="Seleccionar Ana Torres"></td>
          <td role="cell" class="g-table__cell g-table__cell--composite g-table__cell--primary">
            <span class="g-table__label" aria-hidden="true">Cliente</span>
            <span class="g-table__composite"><span class="g-table__leading" aria-hidden="true">AT</span>
              <span class="g-table__text"><span class="g-table__title">Ana Torres</span><span class="g-table__subtitle">ana@correo.com</span></span></span>
          </td>
          <td role="cell" class="g-table__actions">…slot row-actions…</td>
        </tr>
      </tbody>
    </table>
  </div>
  <nav class="g-pagination">…</nav>
  <p class="g-table__sr" aria-live="polite">…</p>          <!-- única región viva; fuera del <table aria-busy> (#265) -->
</div>
```

- En tarjetas, `<thead>` queda **oculto a la vista y presente** para los lectores; la etiqueta visible de cada celda es `aria-hidden`.
- El `leading` de texto es `aria-hidden` (las iniciales repiten el título). **Se queda** como está (#295, kiwi `avatar/r01` L6): para imagen, color o iniciales derivadas, `leading-{key}` con `GAvatar`. Una columna **solo con avatar** (`cell-{key}`) usa `GAvatar size="sm"` **con `label`** (es la única identificación de la fila, WCAG 1.1.1).

## Eventos

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `update:sort` | `{ key, direction }` | El usuario ordena (encabezado o controles de tarjetas) |
| `update:selected` | claves | Cambia la selección |
| `update:filters` | filtros | Cambia un filtro (aplicar, quitar, limpiar) |
| `update:page` | número | Cambia de página (o vuelve a 1 al filtrar). Tras `update:pageSize`, en el mismo ciclo (#594) |
| `update:pageSize` | número | Elige un tamaño en el pie (#593); **antes** que `update:page` |
| `retry` | — | Pulsa «Reintentar» del fallo (barra o vacío de error por defecto; #540) |
| `navigate` | `{ row, key, href, event }` | Activa una puerta `<a href>` (`rowHref`) con clic primario sin modificadores o Intro (#505); cancelable con `event.preventDefault()` (#598) |
| `activate` | `{ row, key, event }` | Activa una puerta `<button>` (`activatable`), #598 |
| `update:lastOpened` | clave | Tras emitir `navigate` o `activate`: esa fila pasa a ser el rastro (#598) |
| `update:expanded` | claves | Se despliega o pliega una ficha, o se depuran claves que ya no están a la vista (#599) |

## Slots

| Slot | Alcance | Propósito |
| --- | --- | --- |
| `cell-{key}` | `{ row, value, column }` | Celda rica (`GBadge`, `GProgress`, `GMetric`…). En compuesta, sustituye a título y subtítulo |
| `leading-{key}` | `{ row }` | Inicio de una compuesta (avatar, icono); decorativo. Para una persona o entidad, **`GAvatar size="md"`** sin `label` (= `space × 8`, misma altura de fila). **Con un hijo directo `.g-avatar`, `g-table__leading` pierde su relleno, su radio y su `overflow: hidden`** (un `square` se ve cuadrado; una sola forma; #295, `avatar.md`) |
| `row-actions` | `{ row }` | Acciones de la fila (p. ej. `GMenu` con el `aria-label` de `labels.rowActions`) |
| `empty` | `{ filtered, clear }` | Estado vacío propio; recomendado `GEmpty` (`empty.md`), que también es el **por defecto** (#540) |
| `error` | `{ retry }` | Fallo sin filas que enseñar (#540; enmienda de #327: sin él, `GEmpty cause="error"` con `labels.failed` y «Reintentar», **no** el slot `empty`) |
| `toolbar` | | Acciones extra en la barra (p. ej. exportar) |
| `detail` | `{ row, key, href, close }` | Ficha desplegada debajo de la fila (B, #599). Su presencia activa el despliegue. `href` = `rowHref(row)` (para el enlace «Abrir ficha completa», que pone la aplicación); `close()` pliega y devuelve el foco a la puerta |

## Teclado

| Tecla | Acción |
| --- | --- |
| Tab / Shift+Tab | Recorre filtros, «todo», botones de orden, casillas, acciones y paginación |
| Enter / Espacio | Activa el control enfocado (nativo); en la puerta, `navigate`/`activate` o despliega (B) |
| Esc (dentro de una ficha desplegada) | Pliega la ficha y devuelve el foco a su puerta (#599) |
| ← → ↑ ↓ (en el selector de filas por página) | Cambian el tamaño y aplican (grupo de radios nativo, #593) |

El foco **permanece** en el control tras ordenar, seleccionar o paginar (la tabla se vuelve a dibujar sin perderlo).

## Tokens consumidos

Existentes: `--g-color-surface`, `--g-color-surface-sunken`, `--g-color-text`, `--g-color-text-muted`, `--g-color-border`, `--g-color-border-strong`, `--g-color-focus`, `--g-color-primary-soft`, `--g-surface-*` (filas `surface`), `--g-radius-{sm|md|lg|pill}`, `--g-shadow-1`, `--g-space-1`, `--g-font-ui`, `--g-text-{caption|body-sm|body}-{size|line|weight}`, `--g-text-title-weight`, `--g-border-width`, `--g-focus-{width|offset}`, `--g-duration-fast`, `--g-ease-standard`. **Sin tokens nuevos.**

**Desde #594, #595 y #597 a #600** (sin tokens nuevos): `--g-color-accent-soft` (marca «aquí estabas» y rastro), `--g-color-{danger|warning|info|success}-text` (lomo y filo del sello), `--g-color-{danger|warning|info|success}-soft`/`on-*-soft` por `GBadge`, `--g-duration-slow`, `--g-ease-out`, `--g-ease-spring` (despliegue, por `utils/collapse.js`), `--g-shadow-1` y `--g-color-border` (pie acoplado, por `GPagination`). Iconos: `arrow-right` (**nuevo en la lista de la librería**, `icons.md` v0.10, #602), `chevron-right` (ya en la lista), `circle-alert`, `triangle-alert`, `info`, `circle-check` (ya en la lista, por `GBadge`).

**Desde #957** (la luz, sin tokens nuevos): `--g-color-surface-sunken`, `--g-duration-press`, `--g-duration-fast`, `--g-ease-out`, `--g-ease-standard`.

**Desde #540:** `--g-color-mold` (tono del esqueleto, en lugar de `--g-color-surface-sunken`; `tokens.md` §42), `--g-color-danger-soft` / `--g-color-on-danger-soft` (barra de fallo) y los de `GEmpty` y `GBtn` por composición. Sin tokens nuevos de componente. La barra de fallo usa además `--g-font-ui`, `--g-radius-md` y `--g-text-body-sm-*` (#547).

## Clases (contrato entre bruno y coco)

| Clase | Elemento | Cuándo |
| --- | --- | --- |
| `g-table` | Raíz | Siempre |
| `g-table--mode-{table\|cards}` | Raíz | Medido o por `responsive` |
| `g-table--appearance-{lines\|surface}`, `--density-*` | Raíz | Siempre |
| `is-loading` | Raíz | Con `loading` |
| `is-pending`, `is-slow`, `is-failed` | Raíz | Dentro del retraso (filas esqueleto invisibles) · desde 5 s · barra de fallo a la vista (#540, #546) |
| `g-table__bar`, `__scroll`, `__table`, `__caption`, `__sr` | Partes | Siempre |
| `g-table__select`, `g-table__actions` | `th`/`td` | Con `selectable` / slot `row-actions` |
| `g-table__sort`, `__sort-icon` | Botón de orden | Columnas `sortable` |
| `g-table__row`, `is-selected` | `tr` | Por fila |
| `g-table__cell`, `--composite`, `--primary`, `--end` | `td` | Por celda; `--end` también en las **celdas esqueleto** de una columna `align: 'end'` (#546) |
| `g-table__label`, `__composite`, `__leading`, `__text`, `__title`, `__subtitle` | Contenido | Según columna |
| `g-table__skeleton`, `g-table__empty` | Estados | Cargando / vacío |
| `g-table__slow`, `g-table__failed` | Espera larga (`p`, **último hijo de `__scroll`**, después del `<table>`, superpuesta al pie) · barra de fallo (`div`, en flujo, antes de `__scroll`) | #540, #546 |
| `g-table__failed-icon`, `g-table__failed-text` | Dentro de la barra de fallo: `span[aria-hidden]` del icono · `p` del texto | #546 |
| `has-door`, `has-detail`, `has-row-status` | Raíz | Hay puertas (`rowHref`/`activatable`, A) · hay slot `detail` (B) · hay `rowStatus` (el lomo reserva su ancho en todas las filas) |
| `g-table__door` | `<a>` o `<button>` dentro de `g-table__title` | La puerta de la fila (#598, #599) |
| `g-table__door-arrow` | `span[aria-hidden]` con `arrow-right` (`flip-rtl`), tras el texto de la compuesta | A: asoma con `hover`/foco y queda en la fila del rastro |
| `g-table__door-chevron` | `span[aria-hidden]` con `chevron-right` (`flip-rtl`) | B: gira con `aria-expanded="true"` |
| `is-last-opened` | `tr` | La fila del rastro (`lastOpened`) |
| `is-here` | `tr` | Pasajera: «aquí estabas» (fila ancla tras un cambio de tamaño, #594; rastro al volver, #598) |
| `is-new` | `tr` | Pasajera: fila que entra tras un cambio de tamaño (fundido, #594) |
| `is-expanded` | `tr` | Fila con su ficha desplegada (B) |
| `g-table__detail`, `g-table__detail-cell`, `g-table__detail-body`, `g-table__detail-content` | `tr` de la ficha · su `td colspan` · el `div role="group"` · el `div` interno del plegado 0fr → 1fr (#650) | B (#599) |
| `data-status="{info\|success\|warning\|error}"` | `tr` (y la celda de la causa) | Con `rowStatus` (#600) |
| `g-table__status` | Envoltorio de la `GBadge` del estado | Junto al título o en la celda de la causa |
| **`g-table__highlight`** | `div[aria-hidden]`, **primer hijo de `g-table__scroll`**, antes del `<table>` | Siempre en `mode="table"` con `appearance="lines"`; no en `surface` ni en `cards` (#960, #961, #962) |
| **`has-highlight`**, **`is-highlight-instant`** | `g-table__scroll` | Hay destino bajo el puntero · primera colocación o recolocación sin gesto (dos cuadros) (#962) |
| `g-table__cell--cause` | `td` de la columna `key` del estado | Con `rowStatus` y `key` (sello en la causa) |

Atributo: `tabindex="-1"` en el `<table>` (foco por programa, #534; el anillo se dibuja por dentro).

Variables en línea: `--_highlight-x`, `--_highlight-y`, `--_highlight-w`, `--_highlight-h` (px físicos, en la capa `g-table__highlight`, las escribe `utils/glide.js`; #962 enmendado); `--_max-height`; `--_dock-size` (alto medido del pie acoplado, en la raíz, solo con `g-pagination--dock`; #595).

## Filas por página y la fila ancla (#592 a #596)

Forma elegida por el usuario: **B · «Pie que acompaña»** (`design/lab/pagination/r02/`; selector y pie en `pagination.md` «Filas por página»). **Regla de personalidad: la fila que mirabas no se mueve** (#592). Hallazgo 6 (P1) de la integración real en NisaNabani.

### API

- `pageSizes` y `v-model:pageSize` con el mismo espejo que `page`: sin `v-model`, la tabla guarda su tamaño y pagina en local; con `total` (servidor), la aplicación lo enlaza. Con `pageSizes` y sin `pageSize`, el primero de la lista (el menor).
- La tabla **reemite** los eventos de su `GPagination` en el mismo orden y ciclo: `update:pageSize` → `update:page` (#594). Un cambio de tamaño hace **una** petición con la receta `watch([page, pageSize])`.
- Filtros: cambiarlos vuelve a la página 1 y **conserva** el tamaño; la cuenta de `GFilterBar` sigue siendo `total`. El selector vive **en el pie**, nunca en la barra de filtros ni en `toolbar` (WCAG 3.2.3).
- Selección: las claves seleccionadas se conservan; «todo» sigue actuando sobre la página visible.

### La fila ancla: la tabla es su dueña (#594)

La tabla da a su `GPagination` un **contexto interno** (`provide` con un `Symbol` de `utils/`, sin API pública; nombre de bruno) con tres miembros: **`anchor()`** → `{ index }` (índice desde 0 sobre toda la colección) o `null`; **`dock`** (Boolean: acoplar el pie, #595); **`announcesRange`** (Boolean: la tabla anuncia el rango, #596). `GPagination` llama a `anchor()` **una vez**, al elegir el tamaño, y calcula la página con él: así no hay dos `update:page` contradictorios. El contexto **sustituye** a la inyección suelta `g-table-announces-results` solo para la paginación (la de `GFilterBar` no cambia).

**Qué fila es el ancla**, por orden:

1. **Con el foco dentro de una fila** (la puerta, una casilla, una acción o su ficha desplegada), **esa fila** (#594, coordinación con #598): el foco es la señal más fuerte de «dónde estaba».
2. Si no, **la primera fila a la vista**: la primera visible **al menos a medias** en la intersección de la ventana y del área desplazable (`g-table__scroll` con `maxHeight`), **por debajo** de la cabecera pegajosa y **por encima** del pie acoplado. Una ficha desplegada (B) cuenta con su fila: si lo primero a la vista es una ficha, el ancla es su fila.
3. **Sin la tabla a la vista**, la primera fila de la página (sin sujetar nada).

Filas esqueleto, la fila de vacío y las fichas no son ancla. En tarjetas, las mismas reglas con las tarjetas.

### La fila ancla no se mueve (#594)

- **Δ ≤ 1px:** al pintar las filas nuevas (local) y al llegar las del servidor, la tabla busca la fila por **`rowKey`** y compensa el desplazamiento de la ventana o de `g-table__scroll` (el que contenga la tabla) **antes de pintar** (mismo cuadro). Las filas que entran por arriba quedan fuera de la vista; las de abajo, debajo.
- El `<tbody>` lleva **`overflow-anchor: none`** (coco): el anclaje nativo de Chromium y Firefox no compensa dos veces; WebKit no lo tiene, por eso lo hace la tabla.
- **Con el pie acoplado la fila no cede nunca** (decisión del usuario): el control está siempre a la vista, así que no hace falta que gane. **Red de seguridad** (solo si el pie no está acoplado: p. ej. `GPagination` fuera de la raíz o con la raíz más corta que la vista): si sujetar la fila sacara de la vista el control que tiene el foco, el control se trae a la vista (`block: 'nearest'`) y la fila cede (WCAG 2.4.7, 2.4.11).
- **«Aquí estabas»** (personalidad de B): tras el cambio, la fila ancla lleva `is-here` (se tiñe de `--g-color-accent-soft` y se apaga en `--g-duration-slow × 4` con `--g-ease-out`), y las filas que entran llevan `is-new` (fundido `--g-duration-slow`). Con movimiento reducido: la marca se queda quieta y se quita, sin fundidos. Bruno quita `is-here` en `animationend` o, sin animación, tras la constante de diseño `HERE_MS = 1300` (no es token ni prop, como #532). Decorativo: el anuncio lleva el rango (#596). En `forced-colors`, contorno `Highlight`.

### Pie acoplado (#595)

- Con `pageSizes`, la tabla pide a su `GPagination` el acople (`g-pagination--dock`, `pagination.md`). Sin `pageSizes`, el pie no se acopla (sin cambio para las tablas de hoy).
- **El componente suma solo lo suyo** (la regla de #515, ahora común en `api.md` «Piezas pegadas»): la tabla mide el alto del pie (`ResizeObserver`) y lo publica como **`--_dock-size`** en su raíz; lo enfocable de dentro de la tabla (`g-table__scroll`) lleva **`scroll-margin-block-end: var(--_dock-size)`** (coco), así que Tab, el foco por programa (#534) y `scrollIntoView` nunca dejan un control debajo del pie (WCAG 2.4.11).
- **Receta `scroll-padding-block-end` (README):** la aplicación pone en **su** contenedor de desplazamiento (o en `:root`) `scroll-padding-block-end` con el alto de **su propia** barra fija inferior, si la tiene, **una sola vez**, y **no** suma el pie de la tabla (los navegadores suman `scroll-margin` del elemento y `scroll-padding` del contenedor: contarlo dos veces deja un hueco del alto del pie, lo medido en #515). Sin barra fija propia, no hace falta nada. Con una cabecera fija, la receta de #515 (`scroll-padding-block-start`) sigue igual.
- **Límite aceptado:** con `maxHeight`, el `scroll-margin` también actúa dentro del área desplazable, donde el pie no tapa nada: al tabular hasta la última fila queda un hueco del alto del pie. Se mide en la auditoría; si molesta, se acota a `:not(.g-table--max-height)` sin cambio de API.
- **Sin umbral de alto de ventana** (teléfono apaisado): el pie se acopla siempre que la tabla siga por debajo. Si en entorno real roba demasiado (≈ 60px medidos en táctil), se valora con una medida (#595, pendiente).

### Modo servidor (enmienda de #540, punto 2)

- **Tras un cambio de tamaño**, el esqueleto tiene **las filas que van a llegar**: `min(pageSize, total − (page − 1) × pageSize)` (sin `total`, `pageSize`), no las que había; y la **ranura del ancla** (la fila esqueleto de su posición en la página nueva) se sujeta donde estaba la fila. Al llegar, la fila real ocupa esa ranura (Δ0). El alto salta **una vez, en el gesto** (causa → efecto), no al llegar los datos.
- Tras un cambio de página, de filtro o de orden, la regla de #540 punto 2 **no cambia** (las filas que había a la vista).
- El foco sigue #534: si estaba en una fila, pasa al `<table>` y vuelve por `rowKey` e índice; si estaba en el radio, **no se toca**.

## Anuncio del rango (#596; enmienda de #265, encaja con #569)

Un cambio de página o de tamaño se oye **una vez**, con el **rango**: «Filas 11–20 de 240». Hoy se oía hasta tres veces (el rango del pie con `role="status"`, «cargando» y «240 resultados», que no informa: el total no cambió).

- **Con `labels.range`**, la tabla anuncia el rango en su región (`g-table__sr`) y su `GPagination` pinta `g-pagination__range` **sin `role="status"`** (por el contexto, `announcesRange`). **Sin `labels.range`, todo como antes** (el rango del pie conserva `role="status"`, la carga termina con `results`) y, con `pageSizes`, aviso en desarrollo.
- **Cuándo:** al cambiar la página o el tamaño efectivos **por cualquier vía** (su pie o las props, como #569), en el **ciclo siguiente** (`nextTick`). Si en ese momento `loading` es `true` (receta: la aplicación lo pone en el mismo `watch`), el anuncio **espera al final de la carga** y sale **en lugar de** `labels.results`. Si `loading` no está en `true` en ese ciclo, el rango se anuncia ya (su texto no depende de las filas: `{total}` es `total` o el recuento local), y una carga que empiece después es una carga sin causa: termina con `results` como siempre (#265).
- **Plantilla:** `{from}` = `(page − 1) × pageSize + 1`, `{to}` = `min(page × pageSize, total)`, `{total}` = `total` si se da; si no, las filas tras filtrar. Con 0 filas no hay rango: se anuncia `results` con `{count: 0}` (#265).
- **Prioridad en un mismo ciclo:** filtros (`results`, #569; filtrar vuelve a la página 1 y esa vuelta **no** anuncia rango) > orden (`sorted`, #265) > página o tamaño (`range`). Un ciclo, un anuncio.
- **Sin anuncio en la carga inicial** ni al montar con `page` o `pageSize` ya puestos (#569).
- **Con `error`** al terminar la carga, `labels.failed` (o nada con `announceError: false`), nunca el rango (#540 punto 7).
- La carga sigue #540 punto 5: `labels.loading` si el esqueleto se ve (200 ms). Como mucho: «Cargando…» y el rango. El nuevo valor del tamaño lo dice el lector al marcar el radio; la tabla no lo repite.

## Activación de fila: la puerta (#597, #598)

Forma elegida por el usuario: **A · «La puerta» por defecto** (`design/lab/table/r03/`), **B · «Despliegue» como opción** (slot `detail`, ver abajo) y **C · «Lente» reservada** (#601). Hallazgo 14 (P2) de NisaNabani: el doble clic en la fila no llegaba por teclado, no se descubría ni se anunciaba. **Regla de personalidad: la puerta, no la fila** (#597).

### Base (A y B)

1. **Sigue siendo tabla de datos** (r01 #2): sin `role="grid"`, sin `tabindex` en `<tr>`, sin flechas entre filas.
2. **Una puerta por fila**, elemento nativo **dentro de `g-table__title`** de la columna principal (`primary`): con `rowHref(row)` (cadena no vacía), **`<a class="g-table__door" href>`**; si no, con `activatable`, **`<button type="button" class="g-table__door">`**; sin ninguno, el título es texto (como hoy). Las dos props pueden convivir: las filas con `href` llevan enlace y las demás botón. Su nombre accesible es **el título** («L-2041»); el subtítulo queda fuera. En una columna principal **simple** (no compuesta), la puerta envuelve el valor de la celda.
3. **Enlace** (#505 con su enmienda #574, `api.md` «Enlaces y `navigate`»; `rowHref` no da `target`, así que la puerta navega en el mismo contexto): `navigate` `{ row, key, href, event }` solo con clic primario sin modificadores y sin `defaultPrevented`, o Intro; `event.preventDefault()` (síncrono) permite un router o un detalle propio. Ctrl/⌘/Mayús/Alt y botón central: no se emite y el navegador abre la pestaña. Sin prop `to` (#70). **Botón:** `activate` `{ row, key, event }` (nombre de `GCard`, #133). Bruno prueba la guarda (clic primario emite; Ctrl, ⌘, Mayús, Alt y botón central no).
4. **Una sola puerta**: las demás acciones van en `row-actions`. La casilla y los controles de la fila **nunca** activan; activar **nunca** selecciona; ninguna usa `aria-selected` (r01 #10, WCAG 3.2.2).
5. **El estado describe la puerta**: con `rowStatus`, la puerta lleva `aria-describedby` al texto del estado (#600).
6. **Tarjetas:** la puerta es el título del encabezado de la tarjeta (mismo DOM).
7. **Carga (#534, #540):** la puerta conserva su sitio por `rowKey`; tras una recarga el foco vuelve a la puerta de la misma fila (índice dentro de la fila).

### A · La puerta (por defecto)

- **La celda principal entera es la puerta:** la puerta cubre su celda con un pseudo-elemento (`::after` con `inset: 0`; la celda es el contenedor posicionado; coco). Clic central, «copiar dirección» y arrastrar a otra pestaña funcionan en **toda la celda**.
- **Sin clic de fila delegado:** el resto de la fila es texto para leer, seleccionar y copiar (doble clic en otra celda selecciona una palabra). La fila no promete lo que no hace: **la luz es la celda principal** y la casilla no tiene fondo de hover (§«Una sola luz», #960, enmienda de «solo de la celda principal (y de la casilla)»).
- **Se delata** al pasar o con el foco dentro de la fila: subrayado del título y la flecha `g-table__door-arrow` (`arrow-right`, `flip-rtl`, decorativa) que asoma desde dentro (`--g-duration-fast`, `--g-ease-out`; sin desplazamiento con movimiento reducido). El **anillo de foco rodea la celda** (el área real de la puerta), no solo el texto.
- **El rastro** (`lastOpened`, `v-model:lastOpened`): al emitir `navigate` o `activate`, la tabla guarda la clave como rastro y emite `update:lastOpened` (también si la aplicación cancela la navegación). La fila del rastro lleva **`is-last-opened`** (su flecha queda a la vista: «la última que abriste»). **Se ilumina y se asienta** (`is-here`, la misma marca que «aquí estabas» de #594) cuando **vuelve**: al montar la tabla con `lastOpened` y esa fila a la vista (vuelta de una ruta: la aplicación guarda la clave con `v-model:lastOpened` en su estado o historial) o cuando el foco vuelve a su puerta desde fuera de la tabla (cierre de un diálogo de detalle). Sin `v-model`, el rastro vive mientras la tabla esté montada. La tabla **no desplaza** hasta el rastro (la posición de la página es de la aplicación). Una clave que no está en las filas no marca nada, sin aviso.

### Despliegue (B, opción, #599)

Con el slot **`detail`**, activar una fila **no saca de la lista**: su ficha se despliega debajo, en su sitio, sin perder la página del servidor ni el desplazamiento. Varias fichas pueden estar abiertas a la vez.

- **La puerta es un botón de divulgación** (APG *Disclosure*): `<button class="g-table__door" aria-expanded>` con `g-table__door-chevron` (`chevron-right`, `flip-rtl`, gira); `aria-controls` → id de la ficha **solo mientras está desplegada**. Con el slot, `activatable` se ignora (aviso) y `rowHref` solo alimenta `href` del alcance del slot (el enlace «Abrir ficha completa», con clic central y pestaña nueva, lo pinta la aplicación en la ficha).
- **La ficha:** `<tr class="g-table__detail">` justo después de su fila, con una celda `g-table__detail-cell` (`colspan` = todas las columnas) y dentro **`<div class="g-table__detail-body" role="group" aria-label="{labels.detail}">`**; el encabezado visible, si lo hay, es de la aplicación (no se impone un nivel). Dentro de `g-table__detail-body` va **`div.g-table__detail-content`**, estructura interna que hace posible el plegado `grid-template-rows` 0fr → 1fr (el motor de `utils/collapse.js`); sin API, sin slot ni tokens propios, y la aplicación no lo estiliza (#650). Se **monta al desplegar** y se desmonta al terminar de plegar (DOM pequeño con cientos de filas). Sin `hidden="until-found"` (no cabe en un `<tr>`): Ctrl+F no encuentra lo plegado (límite conocido).
- **`v-model:expanded`** (claves). Se depura: al cambiar las filas (página, tamaño, filtros, carga), las claves que ya no están se quitan y se emite **un** `update:expanded`. La fila desplegada lleva `is-expanded`.
- **Teclado:** Intro y Espacio en la puerta despliegan y pliegan (nativo); **Esc dentro de la ficha** la pliega y devuelve el foco a la puerta, con `preventDefault` + `stopPropagation` (como el editor de `GTranscript`), **salvo** si ya lo atendió un componente de dentro (`defaultPrevented`). Orden de Tab: puerta → acciones de la fila → ficha → fila siguiente (orden del DOM).
- **Movimiento:** el motor de plegado común (`utils/collapse.js`, el de `GAccordion` y `GFormSection`) con `--g-ease-spring`; con movimiento reducido, sin transición.
- **La ficha no cuenta** para «todo», el recuento, `loadingRows`, las filas del esqueleto ni el ancla (cuenta con su fila). Para #534 cuenta como parte de su fila (misma clave; el índice sigue tras los enfocables de la fila). Durante la carga, las fichas desaparecen con sus filas y vuelven al llegar si su clave sigue.
- **Clic de fila reenviado** (solo en B; A no lo tiene, #599): un clic en la fila que **no** cae en un control se reenvía a la puerta, que **recibe el foco antes** (`preventScroll`), para que el foco vuelva a ella al plegar. **No se reenvía:**
  1. con un botón distinto del primario o con Ctrl, ⌘, Mayús o Alt;
  2. si el destino está dentro de un control: `a[href]`, `button`, `input`, `select`, `textarea`, `label`, `summary`, `[contenteditable]`, un `[tabindex]` distinto de `-1` o un elemento con rol interactivo (`button`, `link`, `checkbox`, `menuitem`…);
  3. en las celdas de selección (`g-table__select`) y de acciones (`g-table__actions`), aunque el clic caiga en su relleno;
  4. con texto seleccionado dentro de la fila (selección no vacía);
  5. si el puntero se movió **más de 5px** entre `pointerdown` y `click` (arrastre para copiar; constante de diseño `DRAG_PX = 5`);
  6. en el **segundo clic** de un doble clic (`event.detail > 1`): quien venga del doble clic ve la ficha abierta, no un parpadeo (la puerta de B lo ignora; confirmado en #650);
  7. dentro de la propia ficha, o con `event.defaultPrevented`.
  Es **solo para el puntero**: teclado y lectores usan la puerta. Un único manejador en el `<tbody>`, sin coste por fila. Las filas de B llevan cursor de puntero (coco).

### Reservado: C · Lente (#601)

Nombres que no se usan para otra cosa: **`v-model:current`** (clave de la fila apuntada; `aria-current="true"` en su puerta, `is-current`), **`labels.current`** (`{title}`, anuncio en la región de #265), el **inspector** (de la aplicación: `GCard`, `GSidebar`, una hoja) con «Anterior» y «Siguiente» que cruzan páginas, y el **recuento de avisos de la página con saltos**. También **`rowClick`** (`none`/`door`: el clic de fila reenviado de B en una tabla sin despliegue) y **`rowAttrs`** (`(row) => { 'data-*': … }`, solo atributos `data-*`). A `PENDIENTES.md`.

## Una sola luz (DECISIONS.md #957 a #963; ronda `design/lab/hover-glide/r01/`)

Decisión del usuario del 2026-10-29: el resaltado de hover **se desliza de fila en fila** como en `GMenu` (M1, #305). Reglas comunes, utilidad y rúbrica de movimiento en `api.md` «Una sola luz». Aquí, lo propio de `GTable`. **Ninguna prop, slot, evento ni token del tema nuevo: `GTable.meta.json` no cambia.**

### Personalidad (#957, #960)

- **La luz sigue al puntero y el puntero no mueve el foco** (la tabla vive en la secuencia de Tab; WCAG 3.2.1 y 2.4.3). El foco tiene su anillo y, en A, su `:focus-within` (subrayado y flecha, #597), que no cambian. **El teclado no enciende la luz.** Solo `pointerType` `mouse` o `pen`.
- **La luz dice la verdad:** cubre exactamente lo que abre un clic. En A, **solo la celda de la puerta**; en B, la fila (que reenvía el clic); en las celdas que no hacen nada, nada.

### Dónde vive la capa

- **`div.g-table__highlight[aria-hidden="true"]`, primer hijo de `div.g-table__scroll`, antes del `<table>`** (un `div` no cabe en `tbody` ni en `tr`). La pone bruno en el vnode. `g-table__scroll` es el **anfitrión** (lleva los datos y el único manejador) y pasa a `position: relative`; el `<table>` pasa a `position: relative` **sin** `z-index` para pintar encima por orden del árbol. Las celdas siguen transparentes.
- **Datos** (bruno, `utils/glide.js`, #962): en `g-table__scroll` (el anfitrión), `has-highlight` e `is-highlight-instant` (primera colocación y recolocación sin gesto; dos cuadros); **en la capa `g-table__highlight`**, `--_highlight-x`, `--_highlight-y`, `--_highlight-w`, `--_highlight-h` (px **físicos** respecto de la caja de relleno del contenedor desplazable, más su scroll; también en RTL). Las medidas van en la capa y no en el anfitrión por rendimiento (enmienda de #962, `api.md`): en el anfitrión se heredan y recalculaban el estilo de las 500 filas. Coco pinta en `GTable.css` y las lee solo en la regla de la capa.
- **Sobrevive sin código extra:** se desplaza con las filas en los dos ejes (en una fila entera x = 0 y w = ancho de la fila, que puede superar el visor); el `th` pegado (fondo `surface`, `z-index: 1`) la **tapa** al pasar una fila por debajo; la seleccionada pinta `primary-soft` en su `td` **encima** de la capa (#564 intacta: la luz pasa por debajo); `is-here`, `is-new`, el lomo de `rowStatus` y la espera larga (`g-table__slow`) se pintan encima y no se tocan.

### Qué se registra (destino de clic)

| Forma | Destino que lleva la luz | No se registra |
| --- | --- | --- |
| Llana (sin `has-door` ni `has-detail`) | la **fila** `tr.g-table__row` entera: excepción razonada de «solo destinos de clic», hace de **regla de lectura** (como el hover de hoy); **sin** cursor de mano | filas esqueleto, fila de vacío o error, cabecera, pie |
| **A · La puerta** (`has-door` sin `has-detail`) | **solo** `td.g-table__cell--primary` de una fila **con** puerta (`.g-table__door`): el área real de la puerta (`::after` con `inset: 0`) | el resto de la fila; las filas sin puerta; la casilla |
| **B · Despliegue** (`has-detail`) | la **fila** entera (reenvía el clic a la puerta, #599) | la ficha `tr.g-table__detail` (contenido, no destino: el puntero encima **apaga**), filas esqueleto |

### A · La puerta (enmienda de «el hover es solo de la celda principal (y de la casilla)»)

- **La luz es la puerta:** con el puntero en otra celda de la fila, **nada** se ilumina (la fila no promete lo que no hace, #597). El subrayado del título y la flecha `g-table__door-arrow`, que se delatan con `:hover` y `:focus-within` **de la fila**, **no cambian**.
- **La casilla deja de tener fondo de hover** (hoy lo comparte con la celda principal): serían dos luces en una fila. La casilla nativa conserva su propio hover y su anillo.

### Estados

| Estado | Llana | A · puerta | B · despliegue |
| --- | --- | --- | --- |
| Puntero sobre una fila | luz en la fila | luz **solo** en la celda principal si la fila tiene puerta | luz en la fila |
| Puntero en otra celda, casilla o acciones | luz en la fila | **ninguna** (la flecha asoma, como hoy) | luz en la fila |
| Seleccionada | la luz pasa por debajo; manda `primary-soft` | igual | igual |
| Rastro (`is-last-opened`) / `is-here` / `is-new` | se pintan encima | flecha visible; «aquí estabas» encima | igual |
| `rowStatus` | lomo y etiqueta intactos | igual | igual |
| Ficha desplegada | — | — | **apagada** sobre la ficha |
| Desplegar o plegar (`--g-ease-spring`, `utils/collapse.js`) | — | — | se recoloca **sin viajar** (cambio de tamaño); la fila bajo el puntero sigue siendo la misma |
| Cabecera pegada | apagada; tapa la luz | igual | igual |
| Cargando (`is-loading`, `is-pending`, `aria-busy`) / esqueleto | **apagada, nada se registra**; al llegar los datos nada se enciende hasta mover el puntero | igual | igual |
| Cambio de filas sin gesto (página, tamaño, orden, filtros, carga) | se apaga; vuelve con el siguiente movimiento (sin destello junto al «aquí estabas» de #594 y #598) | igual | igual |
| Foco en otra fila | luz en la del puntero; anillo en la del foco | anillo en la celda de la puerta | igual |
| Pulsado | se queda en lo pulsado hasta soltar (arrastrar para copiar no la arrastra; B tolera 5px, #599) | igual | igual |
| Scroll con el puntero quieto | salta **al instante** a la fila bajo el puntero | igual | igual |
| Zona de marca | `--g-color-surface-sunken` de la zona | igual | igual |
| `forced-colors` | capa oculta (como hoy, sin fondo de hover) | igual | igual |
| Toque | nada | nada | nada |

### Sin luz: `appearance="surface"` y `mode="cards"` (#961)

Cada fila es su propia superficie separada por un **hueco real** (`border-spacing: 0 space-2`, `margin-block-end: space-2`): la luz se apagaría en cada cruce y equivaldría al hover por fila. **Se queda el hover por fila** (el de hoy) con **fundido de entrada y salida instantánea** (coco), para que **nunca haya dos a la vez**. Nada se registra en esas formas (`off`), también si la tabla pasa a `cards` por `responsive` con el puntero dentro.

### Token y movimiento

- **Luz: `--g-color-surface-sunken`**, el mismo que el hover de hoy y que la luz de `GMenu` (la tabla vive sobre `surface`). La zona de marca lo redeclara (#620). Sin token nuevo. Los contrastes no cambian respecto del hover de hoy; coco lo confirma en oscuro y en la zona.
- El de M1: `translate` y `block-size` con `--g-duration-press` + `--g-ease-out` (en la tabla la anchura no cambia: fila entera o la misma columna; si coco transiciona también `inline-size`, es inocuo), `opacity` con `--g-duration-fast`; con `is-highlight-instant`, solo opacidad; **sin muelle**. `reduce`: solo fundido. Coco quita la transición de `background-color` de los `td` (hoy `GTable.css`) en `lines`.

### Verificación (criterio de hecho)

`tests/personalidad-table-glide.spec.mjs` (bruno, tres motores), trasladado de `design/lab/hover-glide/r01/verificar.mjs`: barrido a 1px en llana, A (columna principal) y B: **0** filas con fondo propio, **≤ 1** luz, **0** muestras sin luz dentro de los destinos; viaje con ≥ 3 cuadros intermedios y final exacto (±1px); entrar desde fuera aparece en su sitio; A en otra celda: ninguna luz; cabecera: ninguna; seleccionada conserva su fondo; la ficha de B apaga; carga apaga; **el puntero no mueve el foco**; pulsado se queda; scroll con el puntero quieto sigue a la fila de debajo; `reduce` solo opacidad; `forced-colors` oculta; toque nada; RTL; `surface` y `cards`: como mucho una fila con fondo en cada instante del barrido; consola limpia. Más la compuerta de rendimiento de #963 (500 filas).

## Estado de fila: `rowStatus` (#600)

**Sin `rowClass`.** Una clase libre no lleva texto (incumple WCAG 1.4.1 por diseño) y su color queda fuera del tema (oscuro y alto contraste no la conocen). En su lugar:

- **`rowStatus(row)`** → `{ status, text, key? }` o `null`. `status`: `info` `success` `warning` `error` (valores y colores de `GCard`, #133: `error` lee `danger`). **Sin `neutral`:** una fila sin estado ya es neutra, y «archivado» o «borrador» son datos de la fila (una columna con `GBadge`), no algo que pide atención. Un valor fuera de la lista se ignora con aviso.
- **`text` obligatorio** (aviso en desarrollo si falta, como `statusText` de `GCard`); sin él se pintan tono y forma, sin etiqueta.
- **Pinta:** `data-status` en el `<tr>`; una **etiqueta** (`g-table__status` con `GBadge variant="soft" size="sm"` del color del estado, icono decorativo `circle-alert` / `triangle-alert` / `info` / `circle-check` + `text`), **junto al título** de la compuesta; y el **lomo**: el borde de inicio de la fila (en tarjetas, de la tarjeta) con el tono `{color}-text` y **una forma distinta por valor** (propuesta: `error` sólido, `warning` discontinuo, `info` punteado, `success` doble; las formas finales las mide coco). Con `rowStatus`, **todas** las filas reservan el ancho del lomo (`has-row-status`): las columnas no se mueven.
- **Sello en la causa** (de B, en cualquier tabla): con `key` = la `key` de una columna visible, la etiqueta va **en esa celda**, junto a su valor (`g-table__cell--cause`, `data-status`, filo inferior en el tono del estado) en lugar de junto al título; responde a «¿por qué?». El lomo se queda. Con una `key` que no es columna visible, cae junto al título.
- La puerta lleva `aria-describedby` al texto de la etiqueta (ids únicos).
- **No es un mensaje:** sin `role="status"` ni `role="alert"` en filas (una tabla con 40 lotes caducados no habla sola). Un estado que cambia en vivo lo anuncia la aplicación (isla o aviso), no la tabla (WCAG 4.1.3; `api.md` «Convivencia de servicios»).
- **Canales separados:** estado = lomo y etiqueta; selección = fondo; rastro y «aquí estabas» = fondo pasajero `accent-soft` + flecha; **nunca** se tiñe la fila entera por estado (chocaría con la selección y el `hover`).
- `forced-colors`: el lomo es un borde (conserva su estilo); las filas sin estado lo pintan `Canvas`.

## Receta del `summary` (modo servidor; para el README, #601)

No es API de `GTable`: la tabla no sabe qué significan las métricas. El servidor devuelve, además de la página y `total`, cuentas **sobre toda la búsqueda** (p. ej. `{ error: 3, warning: 5, info: 2 }`). La aplicación las pinta **encima** de la tabla:

- **Solo lectura:** `GMetric` por cifra.
- **Filtros rápidos:** botones con `aria-pressed` (o `GTag` alternable, `@grana/vue/tag`) que cambian `v-model:filters` con `filterMode="external"`; vuelven a la página 1 y conservan el tamaño. El recuento lo anuncia la tabla al llegar los datos (#569); el botón no anuncia nada propio.
- **Cada cuenta se calcula sin su propio filtro** (como las facetas): con «Caducados» aplicado, «Por caducar» sigue diciendo cuántos hay en la búsqueda.
- El `summary` **no se anuncia** por sí mismo. Las cuentas dentro de las opciones de `GFilterBar` son la salida con cuentas reservada en #543.

## Avisos de desarrollo nuevos (`[Grana] <GTable>`, una vez cada uno)

`pageSizes` sin `labels.pagination.pageSize`; `pageSizes` sin `labels.range` (el anuncio vuelve a lo de antes); `rowHref` o `activatable` con un slot `cell-{key}` en la columna principal (no hay título donde poner la puerta: no se pinta); una puerta con título vacío; `activatable` con el slot `detail` (se ignora); el slot `detail` sin `labels.detail`; `rowStatus` sin `text` o con un `status` fuera de la lista.

## Notas para coco (CSS)

- **A:** con `has-door`, **ninguna celda pinta fondo de hover**: lo pinta la capa `g-table__highlight` sobre la celda principal de una fila con puerta (§«Una sola luz», #960); la casilla pierde su fondo de hover; la seleccionada conserva el suyo encima de la capa (#564). La celda principal es el contenedor posicionado y la puerta la cubre con `::after`; el anillo de foco de la puerta se dibuja **en la celda** (`td:has(> * .g-table__door:focus-visible)` o equivalente) y no en el texto. Subrayado del título y `g-table__door-arrow` con `hover`/foco y en `is-last-opened`; la flecha se espeja en RTL por `flip-rtl` (no con `scale`). La puerta **conserva el color del título** (no `--g-color-link`): lo que la delata es el subrayado, la flecha y el área.
- **El recorte del foco de `g-table__title`** (`overflow: hidden` con elipsis) ya lo está corrigiendo coco (`overflow: clip` + `overflow-clip-margin`); con A el anillo va en la celda, pero B y el botón lo siguen necesitando en el título.
- **Lomo:** borde de inicio del primer `<td>` reservado (transparente) en todas las filas con `has-row-status`, también en el `<th>` de la cabecera; en tarjetas, en el borde de la tarjeta; ancho derivado de `space` (kiwi: `space × 1`; con `double` hace falta ≥ 3px visibles); forma por valor medida en claro, oscuro y `forced-colors`. **Sello en la causa:** filo inferior `{color}-text` en la celda, sin teñir la fila.
- **B:** `g-table__door-chevron` gira 90° con `aria-expanded="true"` (−90° en RTL); la fila con `is-expanded` pierde su separador inferior; la ficha va pegada a su fila (también en tarjetas: la ficha forma parte visual de su tarjeta).
- **Pie acoplado** (`g-pagination--dock`, `is-stuck`): `position: sticky; inset-block-end: 0`, fondo `surface`, filo superior transparente que pasa a `--g-color-border` con `--g-shadow-1` acoplado; `scroll-margin-block-end: var(--_dock-size)` en lo enfocable de `g-table__scroll`; `overflow-anchor: none` en el `<tbody>`.
- **«Aquí estabas»** (`is-here`) y **filas nuevas** (`is-new`): ver #594; con movimiento reducido, `is-here` quieto y sin fundido.
- **Selector** (`g-pagination__size*`): la forma de `GRadioGroup segmented` sin componerlo (pista `surface-sunken`, cifra marcada con `surface`, borde `border-control`, `shadow-1`; cifras tabulares; ≥ 44 × 44px con `pointer: coarse`; foco con `:is(:focus-visible, :where([data-g-key-focus]):focus)`; contraste de lo marcado §7.1).

## Peso (#506, #550; #602)

Todo esto amplía **componentes que ya están en el principal** (`GTable`, `GPagination`); no entra ningún componente nuevo ni ninguna dependencia nueva (`utils/collapse.js` y `GBadge` ya están en el principal). No se abre una entrada propia: sacar `GTable` o `GPagination` del principal rompería las importaciones de hoy. **Presupuesto del lote: +5,75 KiB (5 888 B) gzip** sobre el `grana.js` actual (#650, que enmienda los +3 KiB de #602 tras la medida de bruno: +5 507 B el lote completo, +752 B solo `GPagination`; el despliegue B pesa ≈ 1,3 KiB y sin él tampoco cabían 3 KiB) (selector, ancla, acople, anuncio del rango, puerta, rastro, despliegue y estado, juntos); bruno mide `grana.js` gzip antes y después y lo que pesa importar **solo** `GTable` y **solo** `GPagination` (componentes puros, #444), y lo registra en `CHANGELOG.md`. Si supera el tope nuevo, **no se sube otra vez**: vuelve a lima y la salida es una decisión de producto del usuario (B como complemento registrado), no un tope mayor. La importación diferida de B está descartada (no ahorra en el UMD).

**La luz (#963)** es un lote aparte, compartido con `GSidebar`: `utils/glide.js` + la capa y su sesión en `GTable.vue` y `GSidebar.vue`, **≤ +1 280 B gzip de `dist/grana.js`** y **≤ +512 B gzip de `dist/grana.css`**; no cuenta en el tope de #650. **Medido (bruno, `gzip -9`):** `grana.js` +1 432 B (exceso de 152 B: `glide.js` ≈ 910 B, `GTable` ≈ 340 B, `GSidebar` ≈ 182 B) y `grana.css` +401 B (dentro). **El usuario acepta el exceso (2026-10-29, #964)** como cargo único fuera de #506; nueva base de `grana.js`: 223 284 B gzip. La regla de #963 sigue: con más, decide el usuario. **Rendimiento (#965):** el criterio de #963 (0 tareas largas, p95) se exige en un entorno sin vecinos (integración continua de GitHub o máquina del usuario); en una VM compartida con `steal`, una tarea larga aislada en mitad del barrido, con p95 bajo y sin trabajo nuestro atribuible en el trace, se registra como ruido conocido, sin reintentos ni cambio de umbral.

## Pruebas (bruno)

- `GTable.test.js` y `GPagination.test.js`: API y eventos de arriba; orden `update:pageSize` → `update:page` en el mismo manejador; ancla por foco y por primera fila a la vista (con `getBoundingClientRect` simulado); anuncio del rango (local, servidor con `loading` en el mismo ciclo, sin `labels.range`, prioridad filtros > orden > rango, sin anuncio al montar, `error`); esqueleto con las filas que van a llegar; puerta `<a>`/`<button>` en la columna principal, guarda de #505, `update:lastOpened`; `is-last-opened` e `is-here` al montar con `lastOpened`; B: `aria-expanded`/`aria-controls`, Esc, depuración de `expanded`, cada excepción del clic reenviado (una prueba por excepción); `rowStatus`: `data-status`, etiqueta, `aria-describedby`, `has-row-status`, sello con `key`, sin `role` en filas; avisos.
- **`tests/table-page-size.spec.mjs`** (tres motores), sobre la base de `design/lab/pagination/r02/verificar.mjs`: página por ancla (100 → 10 con la fila 62 arriba da la página 7), Δ ≤ 1px de la fila al cambiar (local y servidor, ranura del esqueleto), foco en el radio, un solo anuncio, pie acoplado con su borde en el de la ventana y desacoplado al final, `scroll-margin` (Tab hasta una fila bajo el pie la deja a la vista), filtros, 360px con 44px, y **`maxHeight`** (compensación dentro de `g-table__scroll`, no medida por kiwi).
- **`tests/table-rows.spec.mjs`** (tres motores), sobre `design/lab/table/r03/verificar.mjs`: A y B completos (prueba de impacto en el borde de la celda, doble clic en otra celda selecciona texto, Ctrl/⌘+clic no emite, rastro y foco al volver de un diálogo, despliegue y foco, Esc, orden de Tab salvo WebKit), estado y 360px.

## Resolución de hallazgos (r01 y r02)

| # | Hallazgo | Resolución | Base |
| --- | --- | --- | --- |
| r01-1 | Modelo de columnas | «Columnas» arriba; `rows` + `rowKey` | Decisión del usuario (campo ≠ columna) |
| r01-2 | Celdas ricas | Slots `cell-{key}` y `leading-{key}`; sin catálogo interno | Reutilización (`GBadge`, `GProgress`, `GMetric`); DECISIONS.md #110 |
| r01-3 | Orden | `v-model:sort`, local por defecto, `sortMode` | APG |
| r01-4 | Selección | `selectable` + `v-model:selected`; página visible; sin `aria-selected` | ARIA 1.2 |
| r01-5 | Acciones | Slot `row-actions` | Flexibilidad |
| r01-6 | Columna principal | `primary` o primera compuesta | Tarjetas |
| r01-7 | Textos | `labels` sin valores por defecto | Regla de Grana |
| r01-8 | Adaptación | `responsive` + suma de `min` × `space` | DECISIONS.md #98 (mismo criterio que `GStepper`) |
| r01-9 | Apariencia | `appearance` `lines`/`surface`; `density`; `maxHeight` | `api.md` (`variant` no describe una tabla) |
| r01-10 | Estados | `loading` + `loadingRows`; slot `empty` | WCAG 4.1.3 |
| r01-11 | Paginación | `GPagination` (`pagination.md`); `pageSize` local o `total` externo | Componente aparte |
| r01-12 | Anuncios | Región viva cortés propia | WCAG 4.1.3 |
| r01-13 | Tokens | Ninguno nuevo; filas `surface` con `--g-surface-*` | `tokens.md` §17.6 |
| r02-1…8 | Filtros | Ver `filter-bar.md`; `GTable` integra `GFilterBar` con sus `columns` | DECISIONS.md #111 |
| L-1 | Texto de «cargando» (pendiente tras la construcción) | `labels.loading` en la región viva existente; fin de carga con `results`; ver «Carga y anuncios» | WCAG 4.1.3; DECISIONS.md #265 |
| pag-r02 L1–L3 | API del selector, la tabla dueña del ancla, orden de eventos | `pageSizes` + `v-model:pageSize`; contexto interno con `anchor()`; `update:pageSize` → `update:page` | #593, #594 |
| pag-r02 L4–L5 | Enmiendas de #540 y #265 | Esqueleto con las filas que van a llegar tras un cambio de tamaño; anuncio del rango con `labels.range`; sin `role="status"` en el rango dentro de la tabla | #596 |
| pag-r02 L6–L7 | Ancla y pie acoplado (B) | «La fila ancla»; `g-pagination--dock`, `is-stuck`, `--_dock-size` con `scroll-margin-block-end`; receta `scroll-padding-block-end` solo para la barra propia de la aplicación | #594, #595 |
| pag-r02 L8–L9 | A y C | No se adoptan | #592 |
| pag-r02 L10–L13 | Tokens, peso, personalidad, pruebas | Sin tokens nuevos; presupuesto del lote (+5,75 KiB, #650); «la fila que mirabas no se mueve»; `tests/table-page-size.spec.mjs` | #592, #602, #650 |
| r03 L1–L2 | Puerta y clic delegado | `rowHref` / `activatable`, `navigate` / `activate`; clic reenviado solo en B con sus siete excepciones | #598, #599 |
| r03 L3–L4 | Estado de fila; `rowClass` | `rowStatus` sin `neutral`; sin `rowClass`; `rowAttrs` reservado | #600, #601 |
| r03 L5 | B | Slot `detail`, `v-model:expanded`, Esc, `utils/collapse.js` | #599 |
| r03 L6–L8 | C, rastro y textos | `lastOpened` para el rastro de A; `current` y `labels.current` reservados; `labels.detail` | #598, #601 |
| r03 L7 | `summary` | Receta del README | #601 |
| r03 L9 | Personalidad | «La puerta, no la fila» | #597 |

## Enmiendas para `GResourceList` (#789, #791; cambian la v1)

Las pide el primer block de `@grana/blocks` (`design/contracts/resource-list.md`, L3, L4 y L7 de `design/lab/resource-list/r01/declaracion.md` §13). `@grana/blocks` es otro paquete y **solo puede usar API pública** (`api.md` «Grana Blocks»): hasta ahora el prototipo marcaba cada `<tr>` y buscaba `.g-table__door` por el DOM, y sondeaba la fase de carga. Peso: dentro del lote de #793 (`resource-list.md` «Enmiendas»: ≤ +1,5 KiB gzip de `grana.js` junto con la de `GMenu`).

### Métodos (#791; L3 y L4)

| Método | Firma | Qué hace |
| --- | --- | --- |
| `focusRow` | `focusRow(key, { part = 'door' } = {}): Promise<boolean>` | Enfoca una parte de la fila con esa clave (`rowKey`). **Espera** a que termine la fase de carga en curso (#540: retraso, mínimo y llegada de las filas pintadas; si no hay carga, al siguiente cuadro). Busca la fila **entre las pintadas** (tabla o tarjetas, mismo DOM). `part`: `door` → la puerta (`g-table__door`) si la hay, si no el primer enfocable de la fila; `actions` → el primer enfocable de la celda de acciones, si no la puerta o el primero; `select` → la casilla. Encontrada: `focus()` nativo (el `scroll-margin` del pie acoplado, #595, la deja a la vista) y resuelve `true`. **No encontrada** (no está en la página, o la tabla se desmonta): **no mueve el foco** y resuelve `false`; quien llama decide |
| `focus` | `focus(options?: FocusOptions): void` | Enfoca el `<table>` (ya tiene `tabindex="-1"` y su nombre, #534). Es el destino seguro cuando la fila ya no existe |

- Expuestos con `defineExpose`; constan en `GTable.meta.json` (`methods`) y en los tipos (#443).
- Una llamada nueva a `focusRow` **sustituye** a la que aún esperaba (la anterior resuelve `false`): el último gesto manda.
- Con el foco en el `<tbody>` al empezar una carga, #534 sigue igual (vuelve por `rowKey` e índice); `focusRow` no lo cambia: es la vía para quien tiene el foco **fuera** de la tabla (un diálogo que se cierra, una fila que se fue).
- **No sustituye** `rowAttrs` (sigue reservado, #601) ni añade marca visual: la marca «nueva / recién editada» (L2, `reveal(key)`) queda reservada.

### Recuento de selección a cero (#789; L7)

Con `selectable` y `labels.selectedCount`, el recuento `g-table__count` (`role="status"`) **sigue montado siempre** (una región viva tiene que existir antes de cambiar), pero **con 0 seleccionadas su texto queda vacío** y la parte lleva `is-empty`: coco la oculta con el patrón de texto oculto accesible (nunca `display: none`, que la sacaría del árbol). Con ≥ 1, el texto de hoy. Así no se pinta «0 seleccionadas» en reposo (hallazgo de kiwi) y la barra no gana ni pierde nada que el lector necesite. **Sin cambio de orden** de la barra (`toolbar` sigue antes del recuento) ni de API. Si la barra se queda sin nada visible (sin `toolbar`, sin controles de tarjetas y con 0), lleva `is-quiet` y coco la deja sin alto (sin `gap` ni relleno); la región sigue dentro. Prueba: `GTable.test.js` (texto vacío con 0, el mismo nodo antes y después, `is-empty`, `is-quiet`).

**`showSelectedCount` (#800; H1 de la auditoría de estilo de `GResourceList`).** Con `false`, `g-table__count` lleva además `is-sr` (coco: patrón de texto oculto accesible, nunca `display: none`) con cualquier recuento: sigue siendo la región que anuncia «N seleccionadas», pero no ocupa sitio en la barra. Lo usa quien pinta su propio recuento visible en el `toolbar` (el grupo de masivas de `GResourceList`), para que la barra no cambie de líneas al seleccionar en tarjetas (Δ0). Sin `labels.selectedCount` no hay recuento, como hoy. Peso dentro del lote de #793 (≈ 30 B). Prueba: `GTable.test.js` (`is-sr` con `false`, mismo nodo y texto, sin cambio con `true`).

## Límites conocidos

- **Fuera de la pieza 1 (#973):** los `<select>` de orden de `GTable` en `mode="cards"` miden 30 px de alto también en táctil, por debajo de los 44 px de `tokens.md` §7 (defecto previo hallado por coco; no se tocó porque #972 exige Δ0 de altura). Seguimiento en `PENDIENTES.md` §6.
- ~~**Sin estado de error** (#327)~~: **contratado por #540** («Carga, vacío y error con el motor común»). Mientras bruno no lo implemente, sigue el límite de #327: el fallo es de la isla y la región anuncia «0 resultados» junto a su error.
- **Esqueleto frente a fila compuesta (#543, #558):** con celdas compuestas con avatar, el esqueleto mide **44 px frente a 60 de la fila** (medido en la auditoría, tema de `space 3` y letra 18): la tabla encoge durante la carga y vuelve a crecer; en la tabla simple, 44 = 44 (Δ0). Lo cierra el molde de `GTable` desde una muestra de filas, reservado; mientras, va al README.
- **Columnas fijas (si llegan):** una celda pegada con fondo opaco taparía la luz; regla reservada en #961 (la celda pinta la luz ella misma con `data-highlight` en el `tr` encendido).
- Sin selección de **todas** las páginas, sin columnas fijas ni desplazamiento horizontal, sin virtualización (cientos de filas), sin edición en celda, sin redimensionar ni reordenar columnas.
- Lector de pantalla real en tarjetas: por verificar (VoiceOver con `display: grid` en filas).
- **Ficha desplegada (B):** es una fila más para el lector («fila 3 de 11» con una sola celda); por verificar en VoiceOver y NVDA. Ctrl+F no encuentra lo plegado (un `<tr>` no admite `hidden="until-found"`).
- **Pie acoplado:** sin umbral de alto de ventana; en un teléfono apaisado roba ≈ 60px. Con `maxHeight`, hueco del alto del pie al tabular hasta la última fila del área desplazable (#595).
- **Anuncio del rango frente al valor del radio** y la puerta con `aria-describedby` en modo exploración: por verificar con lector real.

## Contraste de la selección (`tokens.md` §7.1; DECISIONS.md #431 y #432)

- **Casilla de fila y de «todo»** (nativa, `accent-color`): `accent-color: var(--g-color-primary-text)` (antes `primary`), porque una casilla nativa no admite un contorno fiable. Sin cambio en el tema por defecto.
- **Tarjeta seleccionada** (`mode="cards"`, `is-selected`): fondo `--g-color-primary-soft` (sin cambio) y **borde `--g-color-primary-text`** (antes `primary`).
- coco mide también la casilla sobre la fila seleccionada (`primary-soft`). Pendiente de **coco** (encargo único en `checkbox.md` §«Contraste de lo marcado»).

## Texto con puntero grueso (DECISIONS.md #970 a #972)

Regla común en `docs/contract/api.md` «Texto editable con puntero grueso» y mínimo en `tokens.md` §7: con `@media (pointer: coarse)`, `font-size: max(16px, <rol>)`; interlineado del rol con piso `--g-text-body-sm-line`; altura sin cambio; en escritorio, sin cambio. Aquí: solo los dos `<select>` nativos de orden de la barra en `mode="cards"` (`g-table__bar-cards`), que iOS amplía; celdas, encabezados y controles de fila no cambian.
