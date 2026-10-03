# GTable

Tabla de datos con **personalidad**: columnas compuestas (varios campos en una columna), celdas ricas, filas como superficie y densidad elegible. Incluye **filtros por columna con reglas** al estilo Stripe, orden, selección, paginación y acciones por fila. En un contenedor estrecho **se convierte en tarjetas** sin cambiar de HTML.

**Etiqueta:** `<g-table>` · **Estado:** `candidate` (auditoría de coco aprobada; ver [`design/lab/table/auditoria.md`](../../../../../design/lab/table/auditoria.md)) · **Desde:** 0.1.0

> `@grana/vue` está en la versión 0.0.0 y aún no se publica. Por ahora se usa desde el repositorio (ver el playground en `packages/vue/playground/`). Exige Vue `^3.5.0` y un navegador con la API `popover` y `<dialog>`.

## Uso

```vue
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
| `page` (`v-model:page`), `pageSize`, `total` | Number | | `1`, sin paginar, sin valor |
| `responsive` | String | `auto` `table` `cards` | `auto` |
| `appearance` | String | `lines` `surface` | `lines` |
| `density` | String | `default` `comfortable` `compact` | `default` |
| `maxHeight` | String | longitud CSS (cabecera pegajosa) | sin valor |
| `loading`, `loadingRows` | Boolean, Number | filas esqueleto; anuncia `labels.loading` y, al terminar, `labels.results` | `false`, `3` |
| `labels` | Object | textos (abajo) | `{}` |

- **Datos del servidor:** con `sortMode`/`filterMode` `external`, la tabla solo emite; tú consultas y le pasas la página de filas y `total`.
- **«Seleccionar todo»** actúa sobre la página visible. La fila seleccionada se marca con fondo; el estado lo anuncia su casilla.
- **`appearance="surface"`:** cada fila es una superficie con separación y esquinas redondeadas.
- **Resto de atributos:** `aria-label`/`aria-labelledby` van a la `<table>`; `class`, `style` y `data-*`, a la raíz.

## Textos (`labels`)

Grana no trae textos. Las 16 claves de `labels`:

| Clave | Uso |
| --- | --- |
| `selectAll`, `selectRow`, `rowActions` | Casilla «todo» y nombres de la casilla y del botón de acciones de cada fila (`selectRow` y `rowActions`: plantilla con `{title}` o función `(row) => string`) |
| `actionsHeader` | Encabezado (oculto) de la columna de acciones |
| `selectedCount` | Plantilla con `{count}` |
| `sortBy`, `ascending`, `descending` | Controles de orden en tarjetas |
| `sorted` | Anuncio del orden (`{label}`, `{direction}`) |
| `loading` | Texto que se anuncia mientras `loading` es `true` («Cargando clientes…»); sin plantilla |
| `empty`, `emptyFiltered`, `clearFilters` | Vacío real, vacío por filtros y su acción |
| `results` | Plantilla con `{count}`: recuento al filtrar y al terminar una carga |
| `filters` | Objeto con los textos de [`GFilterBar`](../GFilterBar/README.md) |
| `pagination` | Objeto con los textos de [`GPagination`](../GPagination/README.md) |

## Carga y anuncios

`aria-busy` por sí solo no se anuncia en la mayoría de lectores de pantalla, así que la tabla escribe el estado de la carga en su **región viva** (cortés, una sola, siempre presente desde el montaje y **fuera** del `<table aria-busy>`, hermana del área desplazable):

| Momento | Qué se anuncia |
| --- | --- |
| `loading` pasa a `true`, o la tabla se monta ya con `loading` | `labels.loading`, en el ciclo siguiente (nunca en el mismo render del montaje). Se conserva mientras dure la carga |
| `loading` pasa a `false` | `labels.results` con el recuento ya actualizado en `{count}` (`total` si lo das; si no, las filas tras filtrar), **también con 0**. Sin `labels.results`, la región se vacía |

- **Orden externo:** si el orden se escribe en el mismo ciclo en que empieza la carga, su anuncio (`sorted`) **no se pisa** con el de carga; el fin de la carga anuncia el recuento.
- **Filtro externo:** el recuento que se escribe tras filtrar **no se anuncia si la tabla ya está cargando** (sería el viejo); el fin de la carga anuncia el nuevo.
- **Sin `labels.loading`:** al empezar una carga la región **conserva el texto anterior** (no se vacía).
- **Con 0 filas**, el fin de la carga anuncia `results` con `{count}` en 0; el texto de vacío (`empty`, `emptyFiltered` o el slot `empty`) ya está dentro de la tabla y no se repite.
- `aria-busy` se conserva en el `<table>` y las filas esqueleto siguen `aria-hidden`: no se añade fila ni celda con texto oculto, ni otro `role="status"`.
- **Mientras carga** el orden, los filtros y la paginación siguen operables; si quieres bloquearlos, hazlo en tu aplicación.
- **Avisos de desarrollo** (una vez cada uno): `loading` en `true` sin `labels.loading`, y fin de carga sin `labels.results`. Sin esos textos la tabla funciona, pero solo con `aria-busy`.

### Ejemplo: carga desde el servidor

```vue
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

| Slot | Alcance | Para qué |
| --- | --- | --- |
| `cell-{key}` | `{ row, value, column }` | Celdas ricas: [`GBadge`](../GBadge/README.md), [`GProgress`](../GProgress/README.md), [`GMetric`](../GMetric/README.md)… |
| `leading-{key}` | `{ row }` | Avatar o icono de una compuesta (decorativo) |
| `row-actions` | `{ row }` | Acciones de la fila (por ejemplo [`GMenu`](../GMenu/README.md)) |
| `empty` | `{ filtered, clear }` | Estado vacío propio |
| `toolbar` | | Acciones extra en la barra |

## Accesibilidad

- `<table>` real con `caption`, encabezados `scope="col"` y roles explícitos; **tabla de datos, no `grid`**: Tab recorre los controles, sin flechas entre celdas.
- **Orden:** `aria-sort` en el encabezado; el foco se queda en el botón; se anuncia («Ordenado por Total, descendente»).
- **Selección:** casilla con nombre por fila; «todo» con estado mixto.
- **Estados:** `aria-busy` al cargar y anuncio de la carga y del recuento al terminar (ver [Carga y anuncios](#carga-y-anuncios)); vacío real y vacío por filtros (con «Limpiar filtros»); recuento anunciado al filtrar.
- **Contraste medido:** texto ≥ 6.2:1 y bordes de control ≥ 3.45:1 en claro, tema de prueba y oscuro. Con `pointer: coarse`, controles de 44px.

## Tema

Sin tokens propios: encabezado en `--g-color-text-muted`, separadores `--g-color-border`, hover `--g-color-surface-sunken`, selección `--g-color-primary-soft`, filas `surface` con `--g-radius-lg`; tamaños desde `--g-space-1`.

## Limitaciones conocidas

- Sin selección de todas las páginas, columnas fijas, desplazamiento horizontal, virtualización, edición en celda, ni redimensionar o reordenar columnas.
- **Sin verificar:** lector de pantalla real (sobre todo en tarjetas), Firefox y Safari, zoom al 200% y táctil real. En concreto para la carga: VoiceOver y NVDA con `aria-busy` en el `<table>` y la región viva hermana (si anuncian `labels.loading` y el recuento final, y en qué orden frente a un `sorted`).

## Fuentes

- API: [`GTable.meta.json`](./GTable.meta.json) · Contrato: [`design/contracts/table.md`](../../../../../design/contracts/table.md) · Prototipos: [`r01`](../../../../../design/lab/table/r01/), [`r02`](../../../../../design/lab/table/r02/) · Estilo: [`estilo.md`](../../../../../design/lab/table/estilo.md) · Auditoría: [`auditoria.md`](../../../../../design/lab/table/auditoria.md)
