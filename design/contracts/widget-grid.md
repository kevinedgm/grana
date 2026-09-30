# Contrato · GWidgetGrid

**Dueño:** lima · **Estado:** aprobado · **Basado en:** `design/lab/widget/r01/` (kiwi) · **Complementa:** `design/contracts/widget.md`
**Tag:** `g-widget-grid` · **Categoría:** layout

Rejilla adaptable para dashboards: coloca widgets de distintos tamaños (columnas y filas ocupadas), **reordena y redimensiona con puntero y con teclado**, se adapta al ancho (4, 2 o 1 columnas) y guarda su disposición como **un dato**. Alcance decidido por el usuario (DECISIONS.md #75): puntero y teclado con anuncios; **la aplicación guarda el layout**. La rejilla **no crea widgets**: la aplicación pone un `GWidget` (u otro contenido) por celda.

## Principios

- **El layout es un dato:** un arreglo ordenado de `{ id, w, h }` (columnas y filas ocupadas). **La posición se deriva del orden**, sin coordenadas: eso hace posible reordenar con teclado y que los widgets se recoloquen al cambiar de columnas.
- **Nada depende del arrastre (WCAG 2.5.7):** mover y cambiar de tamaño tienen equivalentes con teclado y con el menú del widget.
- **Presenta y emite intención.** El layout es el prop; el componente **previsualiza** un movimiento (durante el arrastre o mientras se sostiene con el teclado) y **emite al confirmar**; si la aplicación no actualiza el prop, la rejilla vuelve al valor del prop.
- **El orden visual y el orden del DOM coinciden** al confirmar (WCAG 1.3.2, 2.4.3).
- **Sin textos por defecto** (Grana es internacional): todos los mensajes van en `labels`.

## Props

| Prop | Tipo | Valores | Default | Origen |
| --- | --- | --- | --- | --- |
| `modelValue` | Array | `[{ id, w, h }]` | `[]` | compartida |
| `label` | String | nombre accesible de la lista | sin valor | propia |
| `editable` | Boolean | | `false` | propia |
| `columns` | Number | 1 a 4 | sin valor (por el ancho) | propia |
| `maxColumns` | Number | 1 a 4 | `4` | propia |
| `maxRows` | Number | 1 a 6 | `4` | propia |
| `presets` | Array | `[{ id, w, h }]` | los cinco por defecto | propia |
| `labels` | Object | ver «Textos (`labels`)» | `{}` | propia |
| `density` | String | `default` `comfortable` `compact` | `default` | compartida (separación) |

### Reglas de props

- **`modelValue`:** cada entrada `{ id, w, h }` con `id` único (String o Number), `w` y `h` enteros ≥ 1. Una entrada inválida se ignora y avisa una vez; ids duplicados avisan. El **orden del arreglo es el orden de la rejilla**. Puede llevar campos extra (`title`, `data`…) que se conservan al emitir.
- **`label`:** nombre accesible de la lista (`aria-label`); **obligatorio** (aviso en desarrollo).
- **`editable`:** activa las asas de mover y de redimensionar y las acciones del menú de cada widget; sin él, la rejilla solo muestra.
- **`columns`:** fija el número de columnas (1 a 4); sin valor, se decide por el ancho (ver «Columnas»).
- **`maxColumns`, `maxRows`:** límites de lo que un widget puede ocupar (por defecto 4 columnas y 4 filas).
- **`presets`:** los tamaños predefinidos del menú; por defecto **`s` 1×1, `m` 2×1, `l` 2×2, `wide` 4×1 y `tall` 1×2**. Sus nombres salen de `labels.presets[id]`.
- **`labels`:** ver más abajo.

## Columnas y celdas

- **Por el ancho de la propia rejilla** (observador de tamaño), sin literales: **4 columnas con ≥ `--g-space-1 × 240`** (960px con `space` 4), **2 con ≥ `space × 140`** (560px) y **1 por debajo**. Con `columns`, ese valor.
- Cada widget ocupa `min(w, columnas)` columnas y `h` filas (recorte, no cambia el dato). Los widgets **conservan su orden**; el flujo es denso (rellena huecos).
- **Alto de fila:** `--g-widget-row`; **separación:** `--g-widget-gap` (tokens de estructura, `tokens.md` §14); ambos derivan de `space`.
- El contenido de una celda **debe llenarla** (`block-size: 100%`); si es un `GWidget`, su nivel sale de su propio tamaño.

## Reordenar

| Modo | Cómo |
| --- | --- |
| **Puntero** | Arrastrar el **asa de mover** sobre otro widget reordena **en vivo** (previsualización); soltar confirma y emite. Un widget arrastrándose lleva `is-dragging` |
| **Teclado (patrón de arrastre de APG)** | El asa (`<button aria-roledescription>` con `aria-pressed`) se **recoge** con Espacio o Enter (`is-grabbed`); **← ↑** mueven antes y **→ ↓** después; Espacio o Enter **sueltan** y confirman; **Esc cancela** y devuelve al lugar de origen (sin emitir). Sin recoger, las flechas no hacen nada |
| **Menú del widget (sin arrastrar)** | «Mover antes» y «Mover después» (deshabilitadas en los extremos) |

- **Anuncios** (región `role="status"` de la rejilla, `aria-live="polite"`): al recoger, mover, soltar, cancelar, redimensionar y quitar, con `labels` (ver más abajo). Cada movimiento dice la **posición** («Posición 2 de 5»).
- **Orden visual y DOM:** mientras dura un movimiento, la posición visual cambia con `order` de CSS (para no perder el foco); **al soltar, cancelar o terminar el arrastre, el DOM se reordena para coincidir** y el foco se restaura en el asa.
- **Confirmar** emite `update:modelValue` con el layout nuevo y `change` con `{ layout, reason: 'move', id }`. **Cancelar no emite.**
- El movimiento visual se anima con una transición corta de posición (coco); con `prefers-reduced-motion` no.

## Redimensionar

| Modo | Cómo |
| --- | --- |
| **Puntero** | Arrastrar el **asa de la esquina** cambia las columnas y las filas **de celda en celda** (previsualiza; espejado en RTL); al soltar, emite |
| **Teclado** | El asa de redimensionar (`<button>` con nombre «Cambiar el tamaño de X: 2 columnas por 1 fila», que se actualiza) responde a **← →** (columnas) y **↑ ↓** (filas); **cada pulsación confirma, emite y anuncia** |
| **Menú del widget** | Los tamaños predefinidos (`presets`) |

- El tamaño se limita a `[1, min(columnas, maxColumns)]` y `[1, maxRows]`. El dato **conserva la `w` pedida** (por ejemplo 4) aunque el ancho recorte a 2: al recuperar espacio vuelve a 4.
- Emite `update:modelValue` y `change` con `reason: 'resize'`.

## Quitar

- Solo desde el **menú del widget** («Quitar»), **nunca desde un asa**. Emite `remove-request` con `{ id }`; **la aplicación decide** (confirma y actualiza `modelValue`). Tras quitar, el foco pasa al **menú del siguiente widget** (o del anterior si era el último) y se anuncia con `labels.removed`.

## Integración con GWidget

`GWidgetGrid` **proporciona** un contexto (provide/inject) que un `GWidget` dentro de una celda usa **automáticamente**:

- **Acciones:** el widget añade a su menú, después de las suyas y tras un separador, «Mover antes», «Mover después», un **grupo «Tamaño» de opciones** (`type: 'radio'`, una por cada `preset`, con la **marcada la que coincide con el tamaño actual**, si alguna coincide) y un elemento **peligroso** «Quitar» (solo con `editable`); y las resuelve solo (emite lo que corresponda a la rejilla).
- **Título:** el widget **registra su título** en la rejilla para los anuncios y los nombres de las asas.
- **Modo de edición:** el widget recibe `is-editing` (oculta el badge y el enlace de detalle, donde van las asas).
- **Sin rejilla:** un `GWidget` funciona igual, sin nada de lo anterior.

## Slots

| Slot | Propósito | Alcance | Anatomía que debe conservar |
| --- | --- | --- | --- |
| `item` | **Contenido de cada celda** (normalmente un `GWidget`) | `{ id, index, count, editing }` | Debe llenar la celda; **obligatorio** |
| `empty` | Contenido cuando no hay widgets | | Sustituye a `labels.empty` |

## Eventos

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `update:modelValue` | el layout nuevo | Se confirma un movimiento (soltar) o un cambio de tamaño |
| `change` | `{ layout, reason, id }` | Igual, con el motivo (`move`, `resize`) |
| `remove-request` | `{ id }` | El usuario pide quitar un widget |

**Nota para bruno:** el modo de edición es el prop `editable` (la aplicación muestra su propio botón «Editar»). Un layout que la aplicación no actualiza tras confirmar **revierte** la previsualización.

## Textos (`labels`)

Ninguno tiene valor por defecto. Marcadores: `{title}`, `{position}`, `{count}`, `{columns}`, `{rows}`.

| Clave | Uso | Requerido |
| --- | --- | --- |
| `grabRole` | Descripción del rol del asa (`aria-roledescription`, p. ej. «elemento reordenable»); si falta, no se pone | Recomendado |
| `grab` | Nombre del asa de mover («Mover {title}. Posición {position} de {count}») | Sí |
| `resize` | Nombre del asa de redimensionar («Cambiar el tamaño de {title}: {columns} × {rows}») | Sí |
| `grabbed` | Anuncio al recoger («{title} recogido. Posición {position} de {count}. Usa las flechas…») | Recomendado |
| `moved` | Anuncio al mover («Posición {position} de {count}») | Recomendado |
| `dropped` | Anuncio al soltar («{title} soltado en la posición {position} de {count}») | Recomendado |
| `cancelled` | Anuncio al cancelar | Recomendado |
| `resized` | Anuncio al redimensionar («{title}: {columns} × {rows}») | Recomendado |
| `removed` | Anuncio al quitar («{title} quitado») | Recomendado |
| `moveBefore`, `moveAfter`, `size`, `remove` | Acciones del menú y encabezado «Tamaño» | Sí, con `editable` |
| `presets` | Objeto `{ s, m, l, wide, tall }` con los nombres de los tamaños | Sí, con `editable` |
| `empty` | Mensaje sin widgets | Recomendado |

Sin los `announce*` recomendados, la rejilla **no anuncia** ese paso (los nombres de las asas siguen diciendo la posición y el tamaño).

## Estructura accesible

```html
<div class="g-widget-grid is-editing" id="ID">
  <ul class="g-widget-grid__list" role="list" aria-label="Panel">
    <li class="g-widget-grid__item is-grabbed" data-id="revenue" style="grid-column: span 2; grid-row: span 2; order: 0">
      …slot item (un GWidget, con el menú de acciones ampliado)…
      <div class="g-widget-grid__controls">
        <button class="g-widget-grid__grab" type="button" aria-roledescription="elemento reordenable" aria-pressed="true" aria-label="Mover Ingresos. Posición 1 de 5">…</button>
      </div>
      <button class="g-widget-grid__resize" type="button" aria-label="Cambiar el tamaño de Ingresos: 2 × 2">…</button>
    </li>
  </ul>
  <div class="g-widget-grid__sr" role="status" aria-live="polite"></div>
</div>
```

- **`<li>`** con `grid-column: span N` y `grid-row: span M` (variables o estilos dinámicos justificados: excepción a «sin estilos en línea» junto con `order`).
- **Asas solo con `editable`** (y solo se ven en modo de edición); cada asa es un `<button>`; **objetivo ≥ 24px, 44px con `pointer: coarse`**; foco visible.
- **Un asa recogida** lleva `aria-pressed="true"` y su `<li>`, `is-grabbed`; el `<li>` arrastrado con el puntero, `is-dragging`.
- El nombre de las asas se **actualiza** con la posición y el tamaño actuales.

## Teclado

| Tecla | Acción |
| --- | --- |
| Tab | Recorre, por widget, su menú, su asa de mover y su asa de redimensionar (en el orden del DOM) |
| Espacio / Enter (asa de mover) | Recoge; con el widget recogido, suelta y confirma |
| ← ↑ / → ↓ (asa de mover, recogido) | Mueve antes / después |
| Esc (asa de mover, recogido) | Cancela y devuelve el widget a su lugar (sin emitir) |
| ← → / ↑ ↓ (asa de redimensionar) | Columnas − / + y filas − / + |

## Tokens consumidos

| Token | Para qué |
| --- | --- |
| `--g-widget-row`, `--g-widget-gap` | Alto de fila y separación (`tokens.md` §14) |
| `--g-space-1` | Umbrales de columnas (`space × 240`, `space × 140`) |
| `--g-color-surface`, `--g-color-surface-sunken`, `--g-color-border`, `--g-color-border-control`, `--g-color-focus` | Modo de edición (contorno discontinuo), asas y foco |
| `--g-radius-*`, `--g-border-width`, `--g-focus-width`, `--g-focus-offset` | Asas y contornos |
| `--g-duration-press`, `--g-ease-standard` | Transición de posición |

**Tokens nuevos** (`tokens.md` §14): `--g-widget-row`, `--g-widget-gap`.

## Clases (contrato entre bruno y coco)

| Clase | Elemento | Cuándo |
| --- | --- | --- |
| `g-widget-grid` (+ `--density-*`, `is-editing`) | Raíz | Siempre |
| `g-widget-grid__list` | Lista | Siempre |
| `g-widget-grid__item` (+ `is-grabbed`, `is-dragging`) | Celda `<li>` | Siempre |
| `g-widget-grid__controls`, `__grab`, `__resize` | Asas | Con `editable` |
| `g-widget-grid__sr` | Región de anuncios | Siempre |
| `g-widget-grid__empty` | Contenedor del slot `empty` | Sin widgets |

## Resolución de hallazgos de r01

| # | Hallazgo | Resolución | Base |
| --- | --- | --- | --- |
| 7 | Props | `modelValue`, `label`, `editable`, `columns`, `maxColumns`, `maxRows`, `presets`, `labels`, `density` | DECISIONS.md #75 |
| 8 | Slots y eventos | Slot `item` y `empty`; `update:modelValue`, `change` (con motivo) y `remove-request`; los anuncios los hace la rejilla | DECISIONS.md #75 |
| 9 | Orden visual y DOM | `order` mientras dura el movimiento y reordenar el DOM al confirmar | DECISIONS.md #75 |
| 10 | Tokens | `--g-widget-row` y `--g-widget-gap` | DECISIONS.md #75 |
| 11 | Persistencia | La aplicación guarda; sin `localStorage` | — |
| 12 | Modo de edición | El widget oculta el badge y el enlace de detalle con `is-editing`; las asas van en la esquina | DECISIONS.md #75 |

## Límites conocidos

- **Sin colocación libre por coordenadas** ni widgets de más de 4 columnas; **sin agregar widgets** (galería, segunda entrega) ni **configuración**.
- **El nivel y la forma** del widget en una celda salen de su tamaño real: un widget de 1×1 en 4 columnas tiene ~230px (nivel `s`); con `space` 5 los umbrales suben.
- **Arrastrar con puntero** previsualiza reordenando en vivo (los demás widgets se desplazan); en pantallas táctiles, el asa es de 44px y usa `touch-action: none`.
- **Lector de pantalla:** los anuncios de recoger, mover y redimensionar están por verificar con lectores reales; el arrastre táctil real, RTL con un idioma RTL real, Firefox y Safari, por verificar.

## Abierto (no bloquea el paso siguiente)

- Valores estéticos (contorno del modo de edición, posición y aspecto de las asas, animación de reordenamiento): los decide coco con los tokens listados.
- **Fuera de v0.1:** guardado automático, deshacer y rehacer.
