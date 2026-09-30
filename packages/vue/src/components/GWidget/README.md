# GWidget

Carcasa reutilizable de un **widget de panel**: encabezado (icono, categoría, título, subtítulo, badge y menú de acciones), cuerpo y pie. **No conoce el significado de su contenido** (métricas, listas, gráficos…): lo pones tú con slots. **Mide su propio tamaño** y elige un **nivel de detalle** (`s`, `m`, `l`); soporta seis estados sin cambiar de tamaño. Se combina con las primitivas [`GMetric`](../GMetric/README.md), [`GProgress`](../GProgress/README.md) y [`GDataList`](../GDataList/README.md) y con la rejilla [`GWidgetGrid`](../GWidgetGrid/README.md).

**Etiqueta:** `<g-widget>` · **Estado:** `candidate` (auditoría de coco aprobada; ver [`design/lab/widget/auditoria.md`](../../../../../design/lab/widget/auditoria.md)) · **Desde:** 0.1.0

> `@grana/vue` está en la versión 0.0.0 y aún no se publica. Por ahora se usa desde el repositorio (ver el playground en `packages/vue/playground/`). Exige Vue `^3.5.0`. Usa `popover` y `inert`.

## Uso

```vue
<script setup>
import { ref } from 'vue'
const estado = ref('populated')
const labels = { actions: 'Acciones de', loading: 'Cargando', empty: 'Sin datos', error: 'No se pudo cargar', retry: 'Reintentar', stale: 'Desactualizado', staleText: 'Datos de hace 2 h', disabled: 'Deshabilitado' }
const acciones = [{ id: 'refresh', label: 'Actualizar' }, { id: 'export', label: 'Exportar' }]
</script>

<template>
  <g-widget title="Ingresos" eyebrow="Finanzas" description="Últimos 30 días" :state="estado" :labels="labels"
    :actions="acciones" updated-text="Actualizado hace 5 min" drilldown-label="Ver detalle" href="/ingresos"
    @action="({ id }) => ejecutar(id)" @retry="cargar">
    <template #icon><MiIcono name="chart" /></template>
    <template #compact><g-metric label="Ingresos" value="$48k" trend="+12%" direction="up" trend-color="success" /></template>
    <template #default><g-metric label="Ingresos" value="$48.2k" trend="+12%" direction="up" trend-color="success" context="vs. mes anterior" size="lg" /></template>
    <template #detail>
      <g-metric label="Ingresos" value="$48.2k" size="lg" />
      <g-progress :value="72" label="Meta mensual" value-text="72 %" />
      <g-data-list swatches label="Por canal" :rows="[{ label: 'Directo', value: '48%' }, { label: 'Búsqueda', value: '31%' }]" />
    </template>
  </g-widget>
</template>
```

> En plantillas dentro del HTML (sin compilar), escribe `<g-widget ...></g-widget>`: Vue no admite etiquetas de componente autocerradas.

## Niveles y forma

El widget mide su **propio ancho y alto** con un observador de tamaño (no la ventana). Los umbrales derivan de `--g-space-1`, sin literales:

| Nivel | Ancho propio | Carcasa | Contenido (por convención) |
| --- | --- | --- | --- |
| `s` | < `space × 60` (240px con `space` 4) | Icono y título; **el DOM no trae** categoría, subtítulo, badge ni pie | Una métrica y una tendencia mínima |
| `m` | ≥ `space × 60` y < `space × 110` (440px) | Categoría, título, subtítulo, badge, pie | Métrica, contexto y una visualización pequeña |
| `l` | ≥ `space × 110` | Todo | Varias métricas, visualización completa y detalle |

- **Forma:** `wide` (ancho ≥ 1.9 × alto), `tall` (alto ≥ 1.3 × ancho y ≥ `space × 80`) o `square`. Sirve para reorganizar el contenido.
- En la raíz: `data-level`, `data-shape` y las clases `g-widget--level-*` y `g-widget--shape-*`. `level="s|m|l"` fija el nivel (vistas previas, pruebas) y evita medir.
- **El cuerpo recorta** lo que no cabe (`overflow: hidden`): el contenido debe adaptarse a su nivel. **Un widget de una sola fila con categoría, subtítulo y pie puede quedarse sin espacio para el cuerpo**; dale al menos dos filas (ver la auditoría).

## Estados

| `state` | Qué hace |
| --- | --- |
| `populated` (por defecto) | Muestra el contenido del nivel |
| `loading` | Esqueleto con la estructura del nivel (slot `loading` para uno propio), `aria-busy` y un aviso oculto con `labels.loading` |
| `empty` | Slot `empty` o `labels.empty` |
| `error` | `role="alert"` con `labels.error` y un botón `labels.retry` que emite `retry` (slot `error` con `{ level, retry }`) |
| `stale` | **Conserva los datos**; badge con `labels.stale` y, desde el nivel `m`, la línea `labels.staleText` |
| `disabled` | `aria-disabled`, atenuado y el cuerpo `inert`; el menú sigue disponible |

Los estados **no cambian el tamaño** del widget. El estado es un prop: no hay `update:state`.

## Props

| Prop | Tipo | Valores | Por defecto |
| --- | --- | --- | --- |
| `title` | String | nombre accesible y texto del encabezado (**obligatorio**) | sin valor |
| `eyebrow` | String | categoría | sin valor |
| `description` | String | subtítulo | sin valor |
| `headingLevel` | Number | `2` a `6` | `3` |
| `state` | String | `populated` `loading` `empty` `error` `stale` `disabled` | `populated` |
| `level` | String | `auto` `s` `m` `l` | `auto` |
| `badge` | String \| Number | texto corto | sin valor |
| `badgeColor` | String | `brand` `accent` `neutral` `success` `warning` `danger` `info` | `neutral` |
| `actions` | Array | `[{ id, label, disabled? }]` | `[]` |
| `href` | String | URL del detalle | sin valor |
| `drilldownLabel` | String | texto del enlace de detalle | sin valor |
| `updatedText` | String | texto del pie («Actualizado hace 5 min») | sin valor |
| `density` | String | `default` `comfortable` `compact` | `default` |
| `headless` | Boolean | sin encabezado (el nombre accesible sigue saliendo de `title`) | `false` |
| `labels` | Object | ver «Textos» | `{}` |
| `id` | String | | generado |

Un valor fuera de su lista avisa en desarrollo. **`class`, `style` y `data-*` van a la raíz.** Sin `title` avisa.

## Pie y detalle

Desde el nivel `m`, el pie muestra `updatedText` y un enlace con `drilldownLabel`: con `href` es un `<a>`; sin `href`, un botón que emite `drilldown` (`{ event }`). **Solo pide el detalle**: tú abres la página, el diálogo o el panel (con `event.preventDefault()` puedes usar un router).

## Menú de acciones

El menú es [`GMenu`](../GMenu/README.md): el mismo comportamiento (patrón *menu button* de APG, teclado, posición, submenús) y los mismos elementos. **`actions` acepta todos los `items` de `GMenu`**: acciones, separadores, grupos, casillas, opciones, submenús y elementos peligrosos (`{ id, label, disabled? }` sigue siendo válido). El botón lleva el `ellipsis-vertical` de Lucide y el nombre «`labels.actions` + título».

- **`action`** se emite con `{ id }`; en una casilla u opción, con `{ id, checked }` (el valor nuevo). **El widget no guarda el estado:** actualizas `actions`.
- Elegir un elemento **cierra** el menú y devuelve el foco al botón.
- Con el slot `actions`, el menú entero es tuyo (accesibilidad incluida).

## Textos (`labels`)

Ninguno tiene valor por defecto. Los requeridos avisan una vez en desarrollo.

| Clave | Uso | Requerido |
| --- | --- | --- |
| `actions` | Nombre del botón de menú («Acciones de») | Sí, con `actions` o dentro de una rejilla |
| `loading` | Aviso oculto de carga | Sí, con `state="loading"` |
| `retry` | Botón «Reintentar» | Sí, con `state="error"` |
| `stale` | Texto del badge de desactualizado | Sí, con `state="stale"` |
| `empty`, `error`, `staleText`, `disabled` | Mensajes de cada estado | Recomendado |

## Slots

| Slot | Contenido |
| --- | --- |
| `icon` | Icono del encabezado (decorativo, `aria-hidden`) |
| `eyebrow`, `title`, `badge` | Versiones ricas de esas zonas (conserva el texto; el badge, con texto) |
| `actions` | Sustituye al botón de menú y su lista (accesibilidad tuya) |
| `compact` | Contenido del nivel `s`. Alcance `{ level, shape, state }`. Respaldo: `default` |
| `default` | Contenido del nivel `m` y respaldo de los demás |
| `detail` | Contenido del nivel `l`. Respaldo: `default` |
| `empty`, `error`, `loading` | Contenido de cada estado |
| `footer` | Sustituye a `updatedText` y al enlace (desde el nivel `m`) |

## Eventos

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `action` | `{ id }` | El usuario elige una acción del menú |
| `retry` | | Pulsa «Reintentar» (estado `error`) |
| `drilldown` | `{ event }` | Pide el detalle (sin `href`) |

Método expuesto: `focusMenu()`. También expone `level` y `shape`.

## Dentro de una rejilla

En una celda de [`GWidgetGrid`](../GWidgetGrid/README.md), el widget **añade solo** a su menú «Mover antes», «Mover después», los tamaños y «Quitar» (con `editable`), registra su título para los anuncios y recibe `is-editing` (oculta badge y enlace, donde van las asas). Sin rejilla funciona igual.

## Accesibilidad

- `<article>` con nombre por su título (`aria-labelledby`), encabezado `h2`–`h6` a tu jerarquía (`headingLevel`).
- En el nivel `s` el DOM no contiene categoría, subtítulo, badge ni pie (no basta ocultarlos).
- Los estados se dicen con **texto**, no solo con color (`labels.stale`, `labels.disabled`, el mensaje de error).
- Foco siempre visible; botón de menú de 44px con puntero táctil.

## Tema

Solo lee `var(--g-*)`: superficie, borde, radio, texto, tipografía y colores de estado. El alto de fila y la separación de una rejilla son `--g-widget-row` y `--g-widget-gap` (derivan de `space`).

## Sin verificar

Lector de pantalla real (menú y estados); Firefox y Safari (`popover`, `inert`); `forced-colors` y `prefers-reduced-motion` reales. Observaciones abiertas en la auditoría: un widget de una fila pierde el cuerpo, y `stale` añade una línea que compite por el espacio.

## Fuentes

- API: [`GWidget.meta.json`](./GWidget.meta.json) · Contrato: [`design/contracts/widget.md`](../../../../../design/contracts/widget.md) · Prototipo: [`design/lab/widget/r01/`](../../../../../design/lab/widget/r01/) · Auditoría: [`design/lab/widget/auditoria.md`](../../../../../design/lab/widget/auditoria.md)
