# Contrato · GTable

**Dueño:** lima · **Estado:** aprobado · **Basado en:** `design/lab/table/r01/` y `r02/` (kiwi)
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
| `pageSize` | Number | ≥ 1 | sin valor (sin paginar) | propia |
| `total` | Number | ≥ 0 | sin valor | propia |
| `responsive` | String | `auto` `table` `cards` | `auto` | propia |
| `appearance` | String | `lines` `surface` | `lines` | propia |
| `density` | String | `default` `comfortable` `compact` | `default` | compartida |
| `maxHeight` | String | longitud CSS | sin valor | propia |
| `loading` | Boolean | | `false` | compartida |
| `loadingRows` | Number | ≥ 1 | `3` | propia |
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
| `filters` | Objeto con los textos de `GFilterBar` |
| `pagination` | Objeto con los textos de `GPagination` |

Sin un texto, su control conserva un nombre mínimo derivado (p. ej. el `label` de la columna) cuando existe; si no, `console.warn` en desarrollo.

## Carga y anuncios (#265)

La tabla tiene **una** región viva: `<p class="g-table__sr" aria-live="polite">`, **hermana** del área desplazable y **fuera** del `<table aria-busy>` (dentro de un elemento ocupado, algunos lectores retienen los cambios hasta que deja de estarlo). **Existe desde el montaje** y siempre (#14). El texto de carga va **ahí**, no en una celda: las filas esqueleto siguen `aria-hidden` y no se añade fila ni celda con texto oculto (una fila falsa contaría como fila de datos al navegar la tabla). No se añade `role="status"` ni otra región.

| Momento | Texto de la región | Nota |
| --- | --- | --- |
| `loading` pasa a `true` (o la tabla se monta con `loading`) | `labels.loading` | Se escribe en el **ciclo siguiente** (`nextTick`), nunca en el mismo render del montaje (#14, como `loadingText` de `GBtn`). **Permanece** mientras dure la carga: quien recorre la página con el cursor virtual lo encuentra tras la tabla |
| `loading` pasa a `false` | `labels.results` con `{count}` = el recuento **ya actualizado** (`total` si se da; si no, las filas tras filtrar) | En el ciclo siguiente, para leer `rows`/`total` nuevos. **Con 0 filas se anuncia igual** (`{count: 0}`), como al filtrar: el texto de `empty`/`emptyFiltered` (o el slot `empty`) ya está **dentro** de la tabla y no se repite por la región. Sin `labels.results`, la región se **vacía** |
| Orden escrito en el mismo ciclo en que empieza la carga (`sortMode: 'external'`) | Se conserva `sorted`; **`loading` no lo pisa** | La acción del usuario es lo que espera oír; el fin de la carga anuncia el recuento |
| Anuncio de `results` tras filtrar (se escribe en `nextTick`) con la tabla ya en `loading` (`filterMode: 'external'`) | **No se escribe**: queda `labels.loading` | El recuento sería el viejo; el fin de la carga anuncia el nuevo |

- `aria-busy` se conserva en el `<table>` (es estado, no anuncio). La clase `is-loading` no cambia.
- **Mientras carga**, la casilla «todo», el orden, los filtros y la paginación **siguen operables** (como `GSelect`: `loading` no bloquea); si la aplicación quiere bloquearlos, lo hace ella.
- **Avisos de desarrollo** (una vez cada uno, `[Grana] <GTable>`): `loading` en `true` sin `labels.loading`; `loading` vuelve a `false` sin `labels.results`. Sin ellos la tabla funciona (solo con `aria-busy`, que la mayoría de lectores no anuncia).
- **Precedentes que sigue:** `GCard` (`labels.loading` en su región desde el montaje, `labels.loaded` opcional al terminar) y `GWidget` (`labels.loading`). La tabla **no** añade `loaded`: su fin natural de carga es el recuento, y `results` ya existe. `GBtn` (`loadingText`) es prop porque el botón no tiene `labels`.

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
| `update:page` | número | Cambia de página (o vuelve a 1 al filtrar) |

## Slots

| Slot | Alcance | Propósito |
| --- | --- | --- |
| `cell-{key}` | `{ row, value, column }` | Celda rica (`GBadge`, `GProgress`, `GMetric`…). En compuesta, sustituye a título y subtítulo |
| `leading-{key}` | `{ row }` | Inicio de una compuesta (avatar, icono); decorativo. Para una persona o entidad, **`GAvatar size="md"`** sin `label` (= `space × 8`, misma altura de fila). **Con un hijo directo `.g-avatar`, `g-table__leading` pierde su relleno, su radio y su `overflow: hidden`** (un `square` se ve cuadrado; una sola forma; #295, `avatar.md`) |
| `row-actions` | `{ row }` | Acciones de la fila (p. ej. `GMenu` con el `aria-label` de `labels.rowActions`) |
| `empty` | `{ filtered, clear }` | Estado vacío propio |
| `toolbar` | | Acciones extra en la barra (p. ej. exportar) |

## Teclado

| Tecla | Acción |
| --- | --- |
| Tab / Shift+Tab | Recorre filtros, «todo», botones de orden, casillas, acciones y paginación |
| Enter / Espacio | Activa el control enfocado (nativo) |

El foco **permanece** en el control tras ordenar, seleccionar o paginar (la tabla se vuelve a dibujar sin perderlo).

## Tokens consumidos

Existentes: `--g-color-surface`, `--g-color-surface-sunken`, `--g-color-text`, `--g-color-text-muted`, `--g-color-border`, `--g-color-border-strong`, `--g-color-focus`, `--g-color-primary-soft`, `--g-surface-*` (filas `surface`), `--g-radius-{sm|md|lg|pill}`, `--g-shadow-1`, `--g-space-1`, `--g-font-ui`, `--g-text-{caption|body-sm|body}-{size|line|weight}`, `--g-text-title-weight`, `--g-border-width`, `--g-focus-{width|offset}`, `--g-duration-fast`, `--g-ease-standard`. **Sin tokens nuevos.**

## Clases (contrato entre bruno y coco)

| Clase | Elemento | Cuándo |
| --- | --- | --- |
| `g-table` | Raíz | Siempre |
| `g-table--mode-{table\|cards}` | Raíz | Medido o por `responsive` |
| `g-table--appearance-{lines\|surface}`, `--density-*` | Raíz | Siempre |
| `is-loading` | Raíz | Con `loading` |
| `g-table__bar`, `__scroll`, `__table`, `__caption`, `__sr` | Partes | Siempre |
| `g-table__select`, `g-table__actions` | `th`/`td` | Con `selectable` / slot `row-actions` |
| `g-table__sort`, `__sort-icon` | Botón de orden | Columnas `sortable` |
| `g-table__row`, `is-selected` | `tr` | Por fila |
| `g-table__cell`, `--composite`, `--primary`, `--end` | `td` | Por celda |
| `g-table__label`, `__composite`, `__leading`, `__text`, `__title`, `__subtitle` | Contenido | Según columna |
| `g-table__skeleton`, `g-table__empty` | Estados | Cargando / vacío |

Variable en línea: `--_max-height`.

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

## Límites conocidos

- **Sin estado de error** (#327; kiwi `design/lab/alert/` r01 L6 y r02 L8). El fallo de carga es de la **isla de estado** (`status.md`): una condición `error` con «Reintentar» y, en el hueco de las filas, una `GStatusMark` con `for` dentro del slot `empty`. **Límite:** al pasar `loading` a `false` tras un fallo, la región viva anuncia `labels.results` con 0 junto al error de la isla. **Reservado para su ronda** (no existe hoy; no usar estos nombres para otra cosa): prop **`error`** (Boolean) que sustituye el vacío por el slot **`error`** (con `empty` como respaldo) y **suprime** el anuncio de resultados de esa carga.
- Sin selección de **todas** las páginas, sin columnas fijas ni desplazamiento horizontal, sin virtualización (cientos de filas), sin edición en celda, sin redimensionar ni reordenar columnas.
- Lector de pantalla real en tarjetas: por verificar (VoiceOver con `display: grid` en filas).

## Contraste de la selección (`tokens.md` §7.1; DECISIONS.md #431 y #432)

- **Casilla de fila y de «todo»** (nativa, `accent-color`): `accent-color: var(--g-color-primary-text)` (antes `primary`), porque una casilla nativa no admite un contorno fiable. Sin cambio en el tema por defecto.
- **Tarjeta seleccionada** (`mode="cards"`, `is-selected`): fondo `--g-color-primary-soft` (sin cambio) y **borde `--g-color-primary-text`** (antes `primary`).
- coco mide también la casilla sobre la fila seleccionada (`primary-soft`). Pendiente de **coco** (encargo único en `checkbox.md` §«Contraste de lo marcado»).
