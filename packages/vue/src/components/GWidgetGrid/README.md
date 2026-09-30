# GWidgetGrid

Rejilla adaptable para dashboards: coloca [`GWidget`](../GWidget/README.md) (u otro contenido) de distintos tamaños, **reordena y redimensiona con puntero y con teclado**, se adapta al ancho (4, 2 o 1 columnas) y guarda su disposición como **un dato**. **No crea widgets**: tú pones uno por celda con el slot `item`. La aplicación guarda el layout.

**Etiqueta:** `<g-widget-grid>` · **Estado:** `candidate` (auditoría de coco aprobada; ver [`design/lab/widget/auditoria.md`](../../../../../design/lab/widget/auditoria.md)) · **Desde:** 0.1.0

> `@grana/vue` está en la versión 0.0.0 y aún no se publica. Por ahora se usa desde el repositorio (ver el playground en `packages/vue/playground/`). Exige Vue `^3.5.0`.

## Uso

```vue
<script setup>
import { ref } from 'vue'
const layout = ref([
  { id: 'ingresos', w: 2, h: 3 },
  { id: 'meta', w: 1, h: 2 },
  { id: 'servicios', w: 1, h: 2 }
])
const editando = ref(false)
const titulos = { ingresos: 'Ingresos', meta: 'Meta', servicios: 'Servicios' }
const quitar = (id) => { layout.value = layout.value.filter((e) => e.id !== id) }

// Todo texto lo pones tú (Grana no trae textos). Marcadores: {title} {position} {count} {columns} {rows}
const labels = {
  grab: 'Mover {title}. Posición {position} de {count}', grabRole: 'elemento reordenable',
  resize: 'Cambiar el tamaño de {title}: {columns} × {rows}',
  grabbed: '{title} recogido. Posición {position} de {count}. Usa las flechas y Espacio para soltar.',
  moved: 'Posición {position} de {count}', dropped: '{title} soltado en la posición {position} de {count}',
  cancelled: 'Movimiento cancelado. {title} vuelve a la posición {position}',
  resized: '{title}: {columns} × {rows}', removed: '{title} quitado',
  moveBefore: 'Mover antes', moveAfter: 'Mover después', size: 'Tamaño', remove: 'Quitar',
  presets: { s: 'Pequeño', m: 'Mediano', l: 'Grande', wide: 'Ancho', tall: 'Alto' },
  empty: 'Sin widgets'
}
</script>

<template>
  <g-btn @click="editando = !editando">Editar</g-btn>
  <g-widget-grid v-model="layout" label="Panel" :editable="editando" :labels="labels" @remove-request="quitar($event.id)">
    <template #item="{ id }">
      <g-widget :title="titulos[id]" :labels="widgetLabels"> … </g-widget>
    </template>
  </g-widget-grid>
</template>
```

> En plantillas dentro del HTML (sin compilar), escribe `<g-widget-grid ...></g-widget-grid>`: Vue no admite etiquetas de componente autocerradas.

## El layout es un dato

Un arreglo ordenado de `{ id, w, h }` (columnas y filas ocupadas). **La posición se deriva del orden**, sin coordenadas. Puede llevar campos extra (`title`, `data`…) que se conservan al emitir. Una entrada inválida se ignora y avisa; los ids duplicados también avisan.

**Presenta y emite intención:** el layout es el prop. Un movimiento se **previsualiza** (mientras arrastras o sostienes con el teclado) y se **emite al confirmar**; si no actualizas `modelValue`, la rejilla **vuelve al valor del prop**.

## Columnas

Se deciden por el **ancho de la propia rejilla**, sin literales: **4 columnas con ≥ `--g-space-1 × 240`** (960px con `space` 4), **2 con ≥ `space × 140`** (560px) y **1 por debajo**. `columns` fija el número. Cada widget ocupa `min(w, columnas)` columnas y `h` filas (recorte visual: el dato no cambia, y vuelve a su ancho al recuperar espacio). El flujo es denso.

Alto de fila y separación: `--g-widget-row` y `--g-widget-gap` (derivan de `space`). El nivel de cada `GWidget` sale de su propio tamaño: con 4 columnas un 1×1 mide ~230px (nivel `s`).

> **Dale suficiente alto a cada widget.** Un widget de una fila con categoría, subtítulo y pie se queda sin espacio para el cuerpo; dos filas para los niveles `m` y `l`, y tres si llevan varias piezas (ver la auditoría).

## Props

| Prop | Tipo | Valores | Por defecto |
| --- | --- | --- | --- |
| `modelValue` | Array | `[{ id, w, h }]` | `[]` |
| `label` | String | nombre accesible de la lista (**obligatorio**) | sin valor |
| `editable` | Boolean | activa asas y acciones del menú; sin él, solo muestra | `false` |
| `columns` | Number | `1` a `4` | por el ancho |
| `maxColumns` | Number | `1` a `4` | `4` |
| `maxRows` | Number | `1` a `6` | `4` |
| `presets` | Array | `[{ id, w, h }]` | `s` 1×1, `m` 2×1, `l` 2×2, `wide` 4×1, `tall` 1×2 |
| `labels` | Object | ver «Textos» | `{}` |
| `density` | String | `default` `comfortable` `compact` | `default` |

Un valor fuera de su lista avisa en desarrollo. **`class`, `style` y `data-*` van a la raíz.**

## Reordenar

| Modo | Cómo |
| --- | --- |
| **Puntero** | Arrastra el **asa de mover** sobre otro widget: se reordena en vivo; al soltar, emite |
| **Teclado** | Espacio o Enter en el asa **recoge** (`aria-pressed`); ← ↑ mueven antes, → ↓ después; Espacio o Enter **sueltan y confirman**; **Esc cancela** sin emitir. Sin recoger, las flechas no hacen nada |
| **Menú del widget** | «Mover antes» y «Mover después» (deshabilitadas en los extremos): no exige arrastrar (WCAG 2.5.7) |

Los anuncios van en una región `role="status"` (recoger, mover, soltar, cancelar, redimensionar, quitar), siempre con la **posición**. Mientras dura el movimiento, la posición visual cambia con `order` de CSS (así no se pierde el foco); **al soltar el DOM se reordena para coincidir** con el orden visual, y el foco vuelve al asa.

## Redimensionar

| Modo | Cómo |
| --- | --- |
| **Puntero** | Arrastra el asa de la esquina, de celda en celda (espejado en RTL); al soltar, emite |
| **Teclado** | En el asa de redimensionar: ← → columnas, ↑ ↓ filas. **Cada pulsación confirma, emite y anuncia** |
| **Menú del widget** | Los tamaños de `presets` |

El tamaño se limita a `[1, min(columnas, maxColumns)]` y `[1, maxRows]`.

## Quitar

Solo desde el menú del widget («Quitar»), nunca desde un asa. Emite `remove-request` con `{ id }`; **tú decides** (confirmas y actualizas `modelValue`). Tras quitar, el foco pasa al menú del siguiente widget (o del anterior si era el último) y se anuncia con `labels.removed`.

## Integración con GWidget

La rejilla provee un contexto que un `GWidget` de una celda usa solo: añade a su menú «Mover antes», «Mover después», «Tamaño» con los `presets` y «Quitar» (con `editable`); registra su título para los anuncios y los nombres de las asas; y recibe `is-editing` (oculta badge y enlace, donde van las asas). Sin rejilla, un `GWidget` funciona igual.

## Eventos

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `update:modelValue` | el layout nuevo | Se confirma un movimiento o un cambio de tamaño |
| `change` | `{ layout, reason, id }` | Igual, con el motivo (`move` o `resize`) |
| `remove-request` | `{ id }` | El usuario pide quitar un widget |

## Slots

| Slot | Contenido |
| --- | --- |
| `item` | **Obligatorio.** Contenido de cada celda (normalmente un `GWidget`); debe llenarla. Alcance `{ id, index, count, editing }` |
| `empty` | Contenido sin widgets (sustituye a `labels.empty`) |

## Textos (`labels`)

Ninguno tiene valor por defecto. Marcadores: `{title}`, `{position}`, `{count}`, `{columns}`, `{rows}`.

| Clave | Uso | Requerido |
| --- | --- | --- |
| `grab`, `resize` | Nombre de las asas de mover y de redimensionar | Sí, con `editable` |
| `moveBefore`, `moveAfter`, `size`, `remove`, `presets` | Acciones del menú, encabezado «Tamaño» y nombres de los tamaños (`{ s, m, l, wide, tall }`) | Sí, con `editable` |
| `grabRole` | `aria-roledescription` del asa («elemento reordenable») | Recomendado |
| `grabbed`, `moved`, `dropped`, `cancelled`, `resized`, `removed` | Anuncios; sin uno, ese paso no se anuncia | Recomendado |
| `empty` | Mensaje sin widgets | Recomendado |

## Teclado

| Tecla | Acción |
| --- | --- |
| Tab | Por widget: su menú, su asa de mover y su asa de redimensionar |
| Espacio / Enter (asa de mover) | Recoge; recogido, suelta y confirma |
| ← ↑ / → ↓ (recogido) | Mueve antes / después |
| Esc (recogido) | Cancela |
| ← → / ↑ ↓ (asa de redimensionar) | Columnas − / + y filas − / + |

## Accesibilidad

- Lista `<ul aria-label>`; las asas son `<button>` con nombre que se **actualiza** con la posición y el tamaño.
- **Nada depende del arrastre** (WCAG 2.5.7) y el orden visual y el del DOM coinciden al confirmar (1.3.2, 2.4.3).
- Asas de 28px como mínimo (44px con puntero táctil), foco visible.

## Límites conocidos

- Sin colocación libre por coordenadas, sin widgets de más de 4 columnas, sin galería para añadir widgets ni panel de configuración (segunda entrega), sin deshacer.
- **Reordenar no se anima** (con `order` de CSS no hay transición); pendiente decidir entre FLIP o aceptarlo.
- Sin verificar: lectores de pantalla reales, arrastre táctil real, Firefox y Safari, RTL con un idioma RTL real.

## Fuentes

- API: [`GWidgetGrid.meta.json`](./GWidgetGrid.meta.json) · Contrato: [`design/contracts/widget-grid.md`](../../../../../design/contracts/widget-grid.md) · Prototipo: [`design/lab/widget/r01/`](../../../../../design/lab/widget/r01/) · Auditoría: [`design/lab/widget/auditoria.md`](../../../../../design/lab/widget/auditoria.md)
