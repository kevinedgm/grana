# GTable

Tabla de datos con **personalidad**: columnas compuestas (varios campos en una columna), celdas ricas, filas como superficie y densidad elegible. Incluye **filtros por columna con reglas** al estilo Stripe, orden, selección, paginación y acciones por fila. En un contenedor estrecho **se convierte en tarjetas** sin cambiar de HTML.

**Etiqueta:** `<g-table>` · **Estado:** `candidate` (auditoría de coco aprobada; ver [`design/lab/table/auditoria.md`](../../../../../design/lab/table/auditoria.md)) · **Desde:** 0.1.0

> `@grana/vue` está en la versión `0.1.0-beta.0` y aún no se publica en npm. Por ahora se usa desde el repositorio (ver el playground en `packages/vue/playground/`). Exige Vue `^3.5.0` y un navegador con la API `popover` y `<dialog>`.

## Uso

```vue
<!-- Fragmento: `clientes`, `textos`, `colorDe`, `acciones` y `actuar` son de tu aplicación -->
<script setup>
import { ref } from 'vue'
const columns = [
  { key: 'cliente', label: 'Cliente', leading: 'iniciales', title: 'nombre', subtitle: 'correo', sortable: true, filter: { type: 'text' } },
  { key: 'plan',    label: 'Plan',    sortable: true, filter: { type: 'enum', options: ['Básico', 'Pro', 'Equipo'] } },
  { key: 'estado',  label: 'Estado',  filter: { type: 'enum', options: ['activo', 'pausado', 'vencido'], suggest: true } },
  { key: 'total',   label: 'Total',   align: 'end', sortable: true, format: (v) => `$${v.toLocaleString()}`, filter: { type: 'number', unit: '$', suggest: true } }
]
const orden = ref(null), elegidos = ref([]), filtros = ref([]), pagina = ref(1)
</script>

<template>
  <g-table :columns="columns" :rows="clientes" caption="Clientes" selectable :page-size="10" :labels="textos"
           v-model:sort="orden" v-model:selected="elegidos" v-model:filters="filtros" v-model:page="pagina">
    <template #cell-estado="{ value }"><g-badge variant="soft" :color="colorDe(value)" size="sm">{{ value }}</g-badge></template>
    <template #row-actions="{ row }">
      <g-menu :items="acciones" @select="(e) => actuar(e.id, row)">
        <template #trigger="{ attrs }"><g-btn v-bind="attrs" variant="ghost" size="sm" :aria-label="`Acciones de ${row.nombre}`">…</g-btn></template>
      </g-menu>
    </template>
  </g-table>
</template>
```

Los `v-model` son opcionales: sin ellos, la tabla gestiona su propio orden, selección, filtros y página.

## Campos ≠ columnas

Tus `rows` traen **campos** (`nombre`, `correo`, `plan`…); las `columns` deciden **qué se ve**. Una **columna compuesta** reúne varios campos en una celda:

```js
{ key: 'cliente', label: 'Cliente', leading: 'iniciales', title: 'nombre', subtitle: 'correo' }
```

```
 AT   Ana Torres          ← título (campo «nombre»)
      ana@correo.com      ← subtítulo (campo «correo»)
```

Va bajo **un solo encabezado** («Cliente»): el lector de pantalla oye «Cliente, Ana Torres, ana@correo.com». Ordena por `sortBy` (por defecto, el título) y un filtro de texto busca en título y subtítulo. Para un avatar o un icono en lugar de las iniciales, usa el slot `leading-{key}`.

### Campos de una columna

| Campo | Para qué |
| --- | --- |
| `key`, `label` | Identificador (orden, filtros, slots) y encabezado. En una columna simple, `key` es también el campo que se muestra |
| `title`, `subtitle`, `leading` | Columna compuesta (nombres de campo) |
| `primary` | Encabeza la tarjeta en móvil (por defecto, la primera compuesta) |
| `align: 'end'` | Números: alineados al final con cifras tabulares |
| `format(value, row)` | Texto de la celda |
| `sortable`, `sortBy` | Botón de orden y campo por el que ordena |
| `min` | Ancho mínimo en unidades de `space` (24 por defecto, 40 en compuesta): decide cuándo pasar a tarjetas |
| `filter` | Cómo se filtra (ver [`GFilterBar`](../GFilterBar/README.md)) |

## Filtros

Si alguna columna declara `filter`, la tabla muestra una [`GFilterBar`](../GFilterBar/README.md) encima: chips sugeridos (`suggest: true`), «Agregar filtro» y chips aplicados con su resumen («Total mayor que $3,000 ×»). **Todos los filtros se cumplen a la vez (Y); dentro de una lista, cualquiera de sus opciones (O).** Cambiar los filtros vuelve a la página 1.

## Tabla y tarjetas

La tabla mide **su contenedor**, no la ventana. Si es más estrecho que la suma de los mínimos de las columnas (más la selección y las acciones) × `space`, cada fila se dibuja como **tarjeta**: la columna principal encabeza la tarjeta (casilla a la izquierda, acciones a la derecha) y el resto son líneas «etiqueta: valor». «Seleccionar todo» y «Ordenar por» pasan a una barra superior. Es el **mismo `<table>`**, con roles explícitos: el lector de pantalla oye una tabla en los dos modos. Fuerza un modo con `responsive="table"` o `"cards"`.

## Puerta de la fila

Con `rowHref` o `activatable`, la columna principal lleva una **puerta**: un elemento que abre la fila o navega a su detalle.

### `rowHref` · puerta-enlace

`rowHref` es una función `(row) => href`. La puerta es un `<a>` con ese `href`; el evento `navigate` se emite en el clic primario (sin modificadores, sin `defaultPrevented`). Para navegar con el router, llama a `event.preventDefault()` y usa `href` del payload:

```vue
<!-- Fragmento: `filas`, `columns` y `router` son de tu aplicación -->
<g-table :columns="columns" :rows="filas" caption="Pedidos"
         :row-href="(row) => `/pedidos/${row.id}`"
         @navigate="({ href, event }) => { event.preventDefault(); router.push(href) }" />
```

El rastro (`v-model:lastOpened`): al pulsar, la tabla marca la fila con `is-last-opened` y la ilumina (`is-here`) cuando el foco vuelve a su puerta desde fuera (al volver desde el detalle). Úsalo para que el usuario sepa dónde estaba.

### `activatable` · puerta-botón

Sin `href`, pon `activatable`. La puerta es un `<button>` que emite `activate`. No se combina con el slot `detail` (la tabla avisa en desarrollo).

```vue
<!-- Fragmento: `columns`, `filas` y `abrirDetalle` son de tu aplicación -->
<g-table :columns="columns" :rows="filas" caption="Alertas" activatable
         @activate="({ row }) => abrirDetalle(row)" />
```

### Rastro (`lastOpened`)

Ambos modos emiten `update:lastOpened` con la clave de la fila abierta, también si la aplicación cancela la navegación en `navigate`. Vincula con `v-model:last-opened` para que la marca permanezca entre cargas:

```vue
<!-- Fragmento: `columns`, `filas`, `ultimaAbierta` y `navegar` son de tu aplicación -->
<g-table :columns="columns" :rows="filas" :row-href="(r) => `/p/${r.id}`"
         v-model:last-opened="ultimaAbierta" @navigate="navegar" />
```

## Despliegue

Con el slot `detail`, cada fila puede abrir una **ficha** desplegada debajo sin dejar la tabla. La puerta es el chevron en la columna principal; `rowHref` solo alimenta el `href` del alcance (no genera navegación).

```vue
<!-- Fragmento: `filas`, `columns` y `detalle` son de tu aplicación -->
<g-table :columns="columns" :rows="filas" caption="Pedidos"
         v-model:expanded="desplegadas">
  <template #detail="{ row, close }">
    <div>
      <p>{{ detalle(row) }}</p>
      <g-btn size="sm" @click="close()">Cerrar</g-btn>
    </div>
  </template>
</g-table>
```

El alcance del slot `detail` es `{ row, key, href, close }`:

| Campo | Para qué |
| --- | --- |
| `row` | La fila |
| `key` | La clave de la fila |
| `href` | `rowHref(row)` si se pasó, o `null` |
| `close()` | Pliega la ficha y devuelve el foco a la puerta |

`v-model:expanded` es el arreglo de claves desplegadas; se sincroniza automáticamente al cambiar las filas.

**Teclado:** la puerta es un `<button>` con `aria-expanded`; Esc desde dentro pliega y devuelve el foco.

## Estado de fila

`rowStatus` es una función `(row) => { status, text, key? } | null`. La fila lleva `data-status` y muestra un lomo de color en su borde inicial; en la columna `key` (o junto al título si se omite), un [`GBadge`](../GBadge/README.md) `soft sm` con `text`. Describe la puerta si la hay.

```js
const estadoDe = (row) => {
  if (row.vencido) return { status: 'error',   text: 'Vencido',  key: 'estado' }
  if (row.alerta)  return { status: 'warning',  text: 'Alerta',   key: 'estado' }
  return null
}
```

```vue
<!-- Fragmento: `columns`, `filas` y `estadoDe` (el de arriba) son de tu aplicación -->
<g-table :columns="columns" :rows="filas" caption="Pedidos" :row-status="estadoDe" />
```

Valores de `status`: `info` · `success` · `warning` · `error`.

## Filas por página

Con `pageSizes` (arreglo de enteros, p. ej. `[10, 25, 50]`), el pie de la paginación muestra un selector «Filas por página». La tabla necesita `labels.pagination.pageSize` y `labels.range`. Al cambiar, se emite `update:pageSize` antes de `update:page` (ambos en el mismo manejador):

```vue
<!-- Fragmento: `columns` y `filas` son de tu aplicación -->
<script setup>
import { ref } from 'vue'

const pagina = ref(1), tamano = ref(25)
const alCambiarTamano = (n) => { tamano.value = n; pagina.value = 1 }
</script>

<template>
  <g-table :columns="columns" :rows="filas" caption="Pedidos"
           :page-sizes="[10, 25, 50]" :page-size="tamano"
           v-model:page="pagina"
           @update:page-size="alCambiarTamano"
           :labels="{ pagination: { pageSize: 'Filas por página', range: '{from}–{to} de {total}' } }" />
</template>
```

El pie se acopla al borde inferior del contenedor visible cuando el pie de paginación queda pegajoso (`is-stuck`); con `v-model:page-size` el anclaje sujeta la fila que era primera a la vista.

## Props

| Prop | Tipo | Valores | Por defecto |
| --- | --- | --- | --- |
| `columns`, `rows` | Array | | `[]` |
| `rowKey` | String | campo único de cada fila | `id` |
| `caption` | String | nombre visible de la tabla | sin valor |
| `sort` (`v-model:sort`) | Object | `{ key, direction }` | `null` |
| `sortMode` | String | `local` `external` | `local` |
| `selectable` | Boolean | | `false` |
| `selected` (`v-model:selected`) | Array | claves | `[]` |
| `filters` (`v-model:filters`) | Array | `{ key, op, value }` | `[]` |
| `filterMode` | String | `local` `external` | `local` |
| `page` (`v-model:page`), `pageSize`, `pageSizes`, `total` | Number, Number, Array, Number | `pageSizes`: arreglo de enteros (ver «Filas por página»); sin `pageSize`, el menor de la lista | `1`, sin paginar, `[]`, sin valor |
| `rowHref` | Function | `(row) => href`: puerta-enlace en la columna principal (ver «Puerta de la fila») | `null` |
| `activatable` | Boolean | puerta-botón (ver «Puerta de la fila»); se ignora con el slot `detail` | `false` |
| `lastOpened` (`v-model:lastOpened`) | String, Number | clave de la última fila abierta (rastro) | `null` |
| `expanded` (`v-model:expanded`) | Array | claves de las fichas desplegadas con el slot `detail` | `[]` |
| `rowStatus` | Function | `(row) => { status, text, key? } \| null`: estado de la fila (ver «Estado de fila») | `null` |
| `responsive` | String | `auto` `table` `cards` | `auto` |
| `appearance` | String | `lines` `surface` | `lines` |
| `density` | String | `default` `comfortable` `compact` | `default` |
| `maxHeight` | String | longitud CSS (cabecera pegajosa) | sin valor |
| `loading`, `loadingRows` | Boolean, Number | carga con el motor común (ver «Carga, error y vacío»); `loadingRows`: filas esqueleto de la **primera** carga | `false`, `3` |
| `error` | Boolean | el resultado de la última carga fue un fallo; se aplica **al terminar** la carga | `false` |
| `announceError` | Boolean | `false`: el fallo lo anuncia otro (la isla de estado) y la región no anuncia nada al terminar | `true` |
| `labels` | Object | textos (abajo) | `{}` |

- **Datos del servidor:** con `sortMode`/`filterMode` `external`, la tabla solo emite; tú consultas y le pasas la página de filas y `total`.
- **«Seleccionar todo»** actúa sobre la página visible. La fila seleccionada se marca con fondo; el estado lo anuncia su casilla.
- **`appearance="surface"`:** cada fila es una superficie con separación y esquinas redondeadas.
- **Resto de atributos:** `aria-label`/`aria-labelledby` van a la `<table>`; `class`, `style` y `data-*`, a la raíz.

## Textos (`labels`)

Grana no trae textos. Las 19 claves de `labels`:

| Clave | Uso |
| --- | --- |
| `selectAll`, `selectRow`, `rowActions` | Casilla «todo» y nombres de la casilla y del botón de acciones de cada fila (`selectRow` y `rowActions`: plantilla con `{title}` o función `(row) => string`) |
| `actionsHeader` | Encabezado (oculto) de la columna de acciones |
| `selectedCount` | Plantilla con `{count}` |
| `sortBy`, `ascending`, `descending` | Controles de orden en tarjetas |
| `sorted` | Anuncio del orden (`{label}`, `{direction}`) |
| `loading` | Texto que se anuncia cuando la carga **se ve** (a los 200 ms: «Cargando clientes…»); sin plantilla |
| `slow` | Texto visible y anuncio, una vez, a los 5 s de carga («Sigue cargando clientes…»). Opcional |
| `failed` | Texto del fallo (visible y anunciado en lugar de `results`) y título del `GEmpty` de error por defecto |
| `retry` | Botón «Reintentar» del fallo (barra y vacío de error por defecto) |
| `empty`, `emptyFiltered`, `clearFilters` | Título del vacío real, título del vacío por filtros y el texto de su botón (los usa el `GEmpty` por defecto) |
| `results` | Plantilla con `{count}`: recuento al filtrar y al terminar una carga |
| `filters` | Objeto con los textos de [`GFilterBar`](../GFilterBar/README.md) |
| `pagination` | Objeto con los textos de [`GPagination`](../GPagination/README.md) |

## Carga, error y vacío

La tabla adopta el **motor de carga común** de Grana (el mismo de [`GLoadRegion`](../GLoadRegion/README.md), DECISIONS #540): su dibujo (las filas esqueleto con celdas) y su región viva se quedan, pero los tiempos, el tono, la quietud, el vacío y el foco son los comunes. El vacío y el fallo los dibuja [`GEmpty`](../GEmpty/README.md).

### Cambios de comportamiento (si ya usabas `GTable`)

| Antes | Ahora |
| --- | --- |
| Con `loading: true` las filas se sustituían en el acto por filas esqueleto | **Retraso de 200 ms:** si había filas, **siguen a la vista** (con el `<tbody>` **inerte**) hasta los 200 ms; en la primera carga el esqueleto se pinta **invisible** (reserva el sitio). Una carga que acaba antes de 200 ms no enseña esqueleto ni anuncia el inicio |
| El esqueleto desaparecía en cuanto llegaban las filas | **Mínimo de 400 ms** a la vista, si llegó a verse. Las filas nuevas esperan al final de la fase |
| El esqueleto latía con un pulso sin fin | **Quieto** (sin pulso) y con el tono `--g-color-mold`; en `forced-colors`, `GrayText` |
| `labels.loading` se escribía en el ciclo siguiente a `loading: true` | Se escribe **cuando el esqueleto se ve** (a los 200 ms): una carga que no se ve solo anuncia su fin |
| Sin aviso de espera larga | **A los 5 s**, con `labels.slow`: una línea visible al pie del área desplazable y un anuncio, una vez |
| Sin estado de error: el fallo era de la isla y la región anunciaba «0 resultados» junto a su error | **`error`**: ver abajo |
| **El slot `empty` valía también de respaldo del error** | **Ya no:** el fallo sin filas pinta el slot `error` o su `GEmpty cause="error"`; el slot `empty` es solo para el vacío |
| Vacío por defecto: un texto (y el botón de limpiar filtros de la barra de filtros, `g-filter-bar__clear`) | Vacío por defecto con **`GEmpty`**; el botón de limpiar filtros es ahora un **`GBtn`** (`outline`, `brand`) **dentro del `GEmpty`**. Mismo evento `clear`; cambian el marcado y la clase, así que si tu CSS o tus pruebas apuntaban a `g-filter-bar__clear` en el vacío, ya no existe ahí |
| Al empezar una carga la región viva **conservaba el texto anterior** | Se **vacía** al empezar (salvo que el anuncio del orden se haya escrito en ese mismo ciclo): una recarga que no se ve y acaba con el mismo recuento se vuelve a oír |
| Sin gestión del foco durante la carga | **Por `rowKey`** (ver abajo); el `<table>` lleva `tabindex="-1"`. Solo se conservaba la vuelta tras «Limpiar filtros» |

### Fases

1. **Retraso 200 ms, mínimo 400 ms, espera larga 5 s** (constantes de diseño del motor, no props).
2. **Filas esqueleto:** **tantas como había a la vista** al empezar (con tope `pageSize`) o `loadingRows` en la primera carga: el alto no salta al refrescar. Cada barra vive en la caja de línea de su celda, de modo que una fila esqueleto mide lo que una fila de una línea. Siguen `aria-hidden`.
3. **Espera larga:** con `labels.slow`, `g-table__slow` se superpone al pie del área desplazable sin mover nada, y se anuncia una vez.
4. **La tabla pinta su copia de las filas**: las nuevas no se ven hasta el final de la fase.

### `error`, `announceError`, slot `error` y `retry`

`error` (Boolean) es el resultado de la **última carga**; se aplica **al terminar**.

- **Con filas a la vista** (las de antes): **se quedan** y vuelven a ser usables; encima del área desplazable, en flujo, la **barra de fallo** (`g-table__failed`: icono `circle-alert`, `labels.failed` y «Reintentar» —`GBtn` `sm`, `soft`, `neutral`— con `labels.retry`). La región anuncia `labels.failed` **en lugar de** `labels.results`. Mientras corre la siguiente carga, la barra no se pinta.
- **Sin filas:** la fila de estado pinta el slot **`error`** (`{ retry }`) o, sin él, un **`GEmpty cause="error"`** con `title` = `labels.failed` y «Reintentar» (`labels.retry`). La región anuncia `labels.failed`.
- **`retry`** se emite al pulsar «Reintentar» (de la barra o del vacío de error por defecto) o al llamar a `retry()` del slot. Tú pones `error` a `false` y cargas otra vez.
- **`announceError: false`:** si la isla de estado ya anuncia el fallo, la barra o el vacío de error se pintan igual pero la región **no anuncia nada** al terminar (ni `results` ni `failed`). Sin filas, el slot `error` puede llevar una marca de la isla.
- **Avisos de desarrollo** (una vez cada uno): `error` sin `labels.failed` ni slot `error`; `error` sin `labels.retry` ni slot `error`.

```vue
<!-- Fragmento: `columns`, `filas`, `cargando`, `fallo`, `textos` y `cargar` son de tu aplicación -->
<g-table :columns="columns" :rows="filas" caption="Clientes" :loading="cargando" :error="fallo" :labels="textos" @retry="cargar" />
<!-- textos: loading, slow, failed, retry, results, empty, emptyFiltered, clearFilters… -->
```

### Vacío por defecto con `GEmpty`

Sin slot `empty`, la fila de vacío pinta [`GEmpty`](../GEmpty/README.md): `cause="none"` con `labels.empty` como título, o `cause="filtered"` con `labels.emptyFiltered` y un botón `labels.clearFilters` (`outline`, `brand`) que emite el mismo `clear`. Con el slot `empty` (`{ filtered, clear }`), manda el slot; para una salida con cuentas por filtro, pon tu propio `GEmpty` con `filters` ahí (ver el README de `GEmpty`). La salida con cuentas calculada por la tabla en `filterMode: 'local'` está reservada.

### Foco por `rowKey`

El `<table>` lleva `tabindex="-1"` (con el nombre de su `caption` o `aria-label`). Al empezar una carga, si el foco está en el `<tbody>`, pasa al `<table>`; al llegar, vuelve **a la fila con el mismo `rowKey` y al control del mismo índice dentro de ella**; si esa fila ya no existe, se queda en el `<table>`. Nunca en `body`. Medido: la casilla de la tercera fila, la tabla durante la carga y la misma casilla tras reordenar las filas. La vuelta tras «Limpiar filtros» se conserva.

### Anuncios

La tabla tiene **una** región viva (`<p class="g-table__sr" aria-live="polite">`), **hermana** del área desplazable y **fuera** del `<table aria-busy>` (dentro de un elemento ocupado, algunos lectores retienen los cambios hasta que deja de estarlo). Existe desde el montaje y siempre. El texto va ahí: las filas esqueleto siguen `aria-hidden` y no se añade fila ni celda con texto oculto.

| Momento | Texto de la región |
| --- | --- |
| Empieza la carga | Se **vacía** (para que el anuncio del fin se oiga aunque el recuento no cambie); no si el anuncio del orden se escribió en ese ciclo |
| El esqueleto **se ve** (200 ms) | `labels.loading` (permanece mientras dure la carga). Una carga que no se ve no lo escribe |
| A los 5 s | `labels.slow`, una vez |
| `loading` pasa a `false`, sin error | `labels.results` con `{count}` = el recuento **ya actualizado** (`total` si se da; si no, las filas tras filtrar), **también con 0**. Sin `labels.results`, la región se vacía |
| `loading` pasa a `false`, con `error` | `labels.failed` en lugar de `results` (nada con `announceError: false`) |

- **Orden externo:** si el orden se escribe en el mismo ciclo en que empieza la carga, su anuncio (`sorted`) **no se pisa**; el fin de la carga anuncia el recuento.
- **Filtro externo:** el recuento que se escribe tras filtrar **no se anuncia si la tabla ya está cargando** (sería el viejo); el fin de la carga anuncia el nuevo.
- **Con 0 filas**, el fin de la carga anuncia `results` con `{count}` en 0; el texto de vacío ya está dentro de la tabla y no se repite.
- `aria-busy` se conserva en el `<table>` y `is-loading` sigue a la prop.
- **Mientras carga** el orden, los filtros y la paginación siguen operables; si quieres bloquearlos, hazlo en tu aplicación.
- **Avisos de desarrollo:** `loading` en `true` sin `labels.loading`, y fin de carga sin `labels.results`. Sin esos textos la tabla funciona, pero solo con `aria-busy`.

### Ejemplo: carga desde el servidor

```vue
<!-- Fragmento: `columns` es de tu aplicación -->
<script setup>
import { ref } from 'vue'
const orden = ref(null), filtros = ref([]), pagina = ref(1)
const filas = ref([]), total = ref(0), cargando = ref(false)
const textos = { loading: 'Cargando clientes…', results: '{count} clientes', sorted: 'Ordenado por {label}, {direction}', /* …el resto de claves */ }

async function cargar() {
  cargando.value = true                               // síncrono: así el recuento viejo no se anuncia
  const r = await api.clientes({ orden: orden.value, filtros: filtros.value, pagina: pagina.value })
  filas.value = r.filas
  total.value = r.total
  cargando.value = false                              // anuncia «{total} clientes», también con 0
}
// Pon `loading` en el MISMO manejador de cada update:*, antes de cualquier await
const alOrdenar = (v) => { orden.value = v; cargar() }
const alFiltrar = (v) => { filtros.value = v; pagina.value = 1; cargar() }
const alPaginar = (v) => { pagina.value = v; cargar() }
</script>

<template>
  <g-table :columns="columns" :rows="filas" :total="total" caption="Clientes" :page-size="10"
           sort-mode="external" filter-mode="external" :loading="cargando" :labels="textos"
           :sort="orden" :filters="filtros" :page="pagina"
           @update:sort="alOrdenar" @update:filters="alFiltrar" @update:page="alPaginar" />
</template>
```

Pon `loading` en `true` **de forma síncrona** en el manejador de `update:sort`, `update:filters` y `update:page`, antes de cualquier `await`: así la tabla ya está cargando cuando se decide qué anunciar y no se oye el recuento anterior (con `filterMode: 'external'`). El [playground](../../../playground/) tiene un botón «Simular carga» (`#tb-simulate`) como referencia.

## Eventos y slots

| Evento | Payload |
| --- | --- |
| `update:sort` | `{ key, direction }` |
| `update:selected` | claves |
| `update:filters` | filtros |
| `update:page` | número |
| `update:pageSize` | número (se emite antes que `update:page` en el mismo manejador) |
| `navigate` | `{ row, key, href, event }` — clic primario sin modificadores en la puerta-enlace; llama a `event.preventDefault()` para navegar con el router |
| `activate` | `{ row, key, event }` — activa la puerta-botón (`activatable`) |
| `update:lastOpened` | clave — tras `navigate` o `activate`, también si la aplicación cancela la navegación |
| `update:expanded` | arreglo de claves |
| `retry` | — (pulsa «Reintentar» del fallo, barra o vacío de error por defecto) |

| Slot | Alcance | Para qué |
| --- | --- | --- |
| `cell-{key}` | `{ row, value, column }` | Celdas ricas: [`GBadge`](../GBadge/README.md), [`GProgress`](../GProgress/README.md), [`GMetric`](../GMetric/README.md)… |
| `leading-{key}` | `{ row }` | Avatar o icono de una compuesta (decorativo) |
| `row-actions` | `{ row }` | Acciones de la fila (por ejemplo [`GMenu`](../GMenu/README.md)) |
| `detail` | `{ row, key, href, close }` | Ficha desplegada debajo de la fila (ver «Despliegue»); su presencia activa el modo despliegue |
| `empty` | `{ filtered, clear }` | Estado vacío propio; sin él, `GEmpty` por defecto. **Ya no sirve de respaldo del error** |
| `error` | `{ retry }` | Fallo sin filas que enseñar; sin él, `GEmpty cause="error"` con `labels.failed` y «Reintentar» |
| `toolbar` | | Acciones extra en la barra |

## Accesibilidad

- `<table>` real con `caption`, encabezados `scope="col"` y roles explícitos; **tabla de datos, no `grid`**: Tab recorre los controles, sin flechas entre celdas.
- **Orden:** `aria-sort` en el encabezado; el foco se queda en el botón; se anuncia («Ordenado por Total, descendente»).
- **Selección:** casilla con nombre por fila; «todo» con estado mixto.
- **Estados:** `aria-busy` al cargar y anuncio de la carga y del recuento al terminar (ver [Carga, error y vacío](#carga-error-y-vacío)); vacío real y vacío por filtros (con «Limpiar filtros») con `GEmpty`; fallo con barra o vacío de error; recuento anunciado al filtrar. El `<table>` lleva `tabindex="-1"` para recoger el foco durante una carga.
- **Contraste medido:** texto ≥ 6.2:1 y bordes de control ≥ 3.45:1 en claro, tema de prueba y oscuro. Con `pointer: coarse`, controles de 44px. Puerta, despliegue y estado de fila medidos en 22 configuraciones (Chromium) y 4 (Firefox y WebKit): anillo de foco ≥ 4.52:1, lomo ≥ 4.88:1, etiqueta de estado ≥ 4.52:1 (ver [`auditoria-rows.md`](../../../../../design/lab/table/auditoria-rows.md), 717/717).
- **Selección** (DECISIONS #431 y #432): la casilla nativa de fila y la de «todo» usan `accent-color: --g-color-primary-text`, y la tarjeta seleccionada pinta su borde en `--g-color-primary-text`. Sin cambio visible con el tema por defecto. Medido contra la superficie (medido por coco, [`design/lab/contraste-marcado/estilo.md`](../../../../../design/lab/contraste-marcado/estilo.md), tres motores) en el tema por defecto, lustre, spotify y uno con clave `primary` propia, claro y oscuro: casilla **4.07:1 o más** (también sobre la fila `primary-soft`) y borde de tarjeta **4.21:1 o más**.

## Tema

Sin tokens propios: encabezado en `--g-color-text-muted`, separadores `--g-color-border`, hover `--g-color-surface-sunken`, selección `--g-color-primary-soft`, filas `surface` con `--g-radius-lg`; tamaños desde `--g-space-1`. El esqueleto de carga usa `--g-color-mold` (el tono único del marcador de carga, DECISIONS #538; medido ≥ 1,46:1 frente a la superficie en 28 configuraciones) y `GrayText` en `forced-colors`; la barra de fallo y la espera larga reutilizan los tokens de [`GLoadRegion`](../GLoadRegion/README.md).

## Alcance

- **Esqueleto frente a fila compuesta:** con celdas compuestas con avatar, el esqueleto mide **44 px frente a 60 de la fila** (tema de la auditoría, `space` 3 y letra de 18 px): la tabla encoge durante la carga y vuelve a crecer; en la tabla simple, 44 = 44. Lo cerraría un molde de `GTable` desde una muestra de filas, reservado (DECISIONS #543 y #558).

- **Reservado:** B completo en la tabla (`refresh` `keep`/`replace`: filas que siguen a la vista tras el retraso, filo y marcas de lo nuevo) y la salida con cuentas por filtro calculada por la tabla en `filterMode: 'local'`; `activatable` en tarjetas (banco `?c=act` pendiente, H2 de la auditoría de filas).

- Sin selección de todas las páginas, columnas fijas, desplazamiento horizontal, virtualización, edición en celda, ni redimensionar o reordenar columnas.

## Verificación

- **Sin verificar:** lector de pantalla real (sobre todo en tarjetas), Safari real, zoom al 200% y táctil real. En concreto para la carga: VoiceOver y NVDA con `aria-busy` en el `<table>` y la región viva hermana (si anuncian `labels.loading`, `labels.slow`, el recuento final o el fallo, y en qué orden frente a un `sorted`), y el foco que vuelve por `rowKey`. La auditoría de la carga (coco, `design/lab/empty-skeleton/auditoria.md`) midió la tabla en los tres motores con el componente real; los specs `table-load.spec.mjs` y `table-page-size.spec.mjs` pasan en Chromium, Firefox y WebKit (ejecutados el 2026-10-18; ver `design/lab/limitaciones/revision.md`); `GTable.test.js` 112 de 112 en jsdom.

- **Pendientes abiertos** ([`PENDIENTES.md`](../../../../../PENDIENTES.md) §6): en WebKit, al volver de la puerta con el ratón no aparece «aquí estabas» (el clic de ratón no enfoca el enlace y el foco queda en la tabla; hallazgo 1 de `design/lab/table/auditoria-rows.md`; bruno).

## Fuentes

- API: [`GTable.meta.json`](./GTable.meta.json) · Contrato: [`design/contracts/table.md`](../../../../../design/contracts/table.md) · Prototipos: [`r01`](../../../../../design/lab/table/r01/), [`r02`](../../../../../design/lab/table/r02/) · Estilo: [`estilo.md`](../../../../../design/lab/table/estilo.md) · Auditoría (tabla base): [`auditoria.md`](../../../../../design/lab/table/auditoria.md) · Auditoría (filas por página, puerta, despliegue y estado de fila, #592–#602): [`auditoria-rows.md`](../../../../../design/lab/table/auditoria-rows.md) · Carga, vacío y error (DECISIONS #540, #548, #555 y #558; contrato `table.md` «Carga, vacío y error con el motor común»): [`GEmpty`](../GEmpty/README.md), [`GLoadRegion`](../GLoadRegion/README.md), [`auditoria de la carga`](../../../../../design/lab/empty-skeleton/auditoria.md)
