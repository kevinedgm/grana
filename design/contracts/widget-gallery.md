# Contrato · GWidgetGallery

**Dueño:** lima · **Estado:** aprobado · **Basado en:** `design/lab/widget/r02/` (kiwi) · **Complementa:** `design/contracts/widget.md`, `design/contracts/widget-grid.md`, `design/contracts/dialog.md`
**Tag:** `g-widget-gallery` · **Categoría:** superposiciones

Galería para **añadir widgets a un panel**: una hoja lateral modal con búsqueda, categorías, contador de resultados y una tarjeta por widget disponible (vista previa, tamaño inicial y botón Añadir). Alcance decidido por el usuario (DECISIONS.md #76): hoja lateral, vista previa con datos simulados, búsqueda y categorías, tamaños disponibles y marca de los ya añadidos. **La galería no crea widgets ni guarda el layout**: emite `add` y la aplicación actualiza el layout de `GWidgetGrid`.

## Principios

- **Se construye sobre `GDialog`** (`placement="end"`, `design/contracts/dialog.md`): hereda el `<dialog>` modal, el foco, Esc, la hoja inferior en móvil y las dos superficies. No trae su propio diálogo.
- **Presenta y emite intención.** No añade nada por su cuenta: emite `add` con `{ id, size }`. El estado de «ya añadido» es el prop `added`.
- **Genérica:** el catálogo es un dato (`items`); el contenido de la vista previa lo pinta la aplicación por slot.
- **Sin textos ni iconos por defecto** (Grana es internacional): todos los mensajes van en `labels`.
- **La vista previa es decorativa** y el componente la hace inerte; el nombre y la descripción de la tarjeta dicen lo mismo en texto.

## Props

| Prop | Tipo | Valores | Default | Origen |
| --- | --- | --- | --- | --- |
| `modelValue` | Boolean | abierta | `false` | compartida |
| `items` | Array | `[{ id, title, category?, description?, sizes?, unique? }]` | `[]` | propia |
| `added` | Object | `{ [id]: número de copias en el panel }` | `{}` | propia |
| `sizes` | Array | `[{ id, label }]` (catálogo de tamaños, con sus nombres) | sin valor | propia |
| `categories` | Array | `[{ id, label }]`; sin valor, se derivan de `items[].category` | derivadas | propia |
| `title` | String | título de la hoja | sin valor | propia |
| `description` | String | descripción de la hoja | sin valor | propia |
| `size` | String | `sm` `md` `lg` (ancho de la hoja) | `sm` | compartida (subconjunto) |
| `density` | String | `default` `comfortable` `compact` | `default` | compartida |
| `labels` | Object | ver «Textos (`labels`)» | `{}` | propia |
| `id` | String | | generado | propia |

### Reglas de props

- **`modelValue`:** abre y cierra la hoja (vía `GDialog`). El componente no cambia el prop por su cuenta: ante Esc, «Cerrar» o la ✕ emite `update:modelValue` con `false`.
- **`items`:** cada entrada con **`id` único y `title`** (si no, se ignora y avisa una vez). `category` agrupa para el filtro; `description` es el texto de la tarjeta; `sizes` son los **ids de tamaño** permitidos para ese widget (el primero es el tamaño inicial); `unique: true` impide añadirlo más de una vez. Puede llevar campos extra que llegan al slot.
- **`sizes`:** el catálogo de tamaños con su nombre visible (`[{ id: 'm', label: 'Mediano (2×1)' }]`): el nombre lo pone la aplicación. Con un solo tamaño permitido, el selector **no se renderiza** (queda ese tamaño). Los ids son **los de la aplicación** (normalmente los `presets` de `GWidgetGrid`).
- **`added`:** cuántas copias de cada widget hay en el panel; con un valor > 0, la tarjeta muestra la marca de texto (`labels.added` o `labels.addedCount`). Un `unique` con valor > 0 deja su botón en `aria-disabled="true"`.
- **`categories`:** el filtro por categoría (radios con forma de píldora). Sin categorías (ninguna en `items`), el filtro **no se renderiza**. «Todas» (`labels.all`) siempre es la primera opción.
- **`title`:** nombre accesible de la hoja. **Obligatorio** (aviso en desarrollo).
- **`size`:** ancho de la hoja; ver `GDialog`. Defecto `sm` (400px con `space` 4).
- **Resto de atributos:** `class`, `style` y `data-*` van al `<dialog>`.

## Comportamiento

1. **Al abrir**, el foco va al **campo de búsqueda** (no al botón de cierre). Al cerrar, nativo de `GDialog`: vuelve al elemento que abrió la galería.
2. **Búsqueda:** `<input type="search">` con etiqueta visible (`labels.search`); filtra **en vivo**, sin distinguir mayúsculas ni acentos, por título, descripción y categoría. Se combina con la categoría (Y).
3. **Contador:** región `role="status"` dentro de la hoja con `labels.results` (marcador `{count}`); con 0 resultados, además se muestra `labels.empty`.
4. **Tarjeta:** `<article>` con nombre (título) y descripción (`aria-describedby` del botón), categoría, marca de añadido, vista previa, selector de tamaño y botón.
5. **Vista previa:** slot `preview` con `{ item, size }`; se envuelve en un contenedor `aria-hidden="true"` e `inert`. Sin el slot, la tarjeta no tiene vista previa.
6. **Añadir:** emite `add` con `{ id, size }`. **El foco se queda en el botón** (se pueden añadir varios) y el componente anuncia `labels.addedToPanel` (marcador `{title}`) en su región de estado. La aplicación puede anunciar un texto más rico (por ejemplo, la posición) con el método `announce(texto)`.
7. **Ya añadido y único:** el botón es `aria-disabled="true"` (sigue enfocable, sin emitir) con el texto `labels.addedShort`; al pulsarlo anuncia `labels.alreadyAdded` (`{title}`).
8. **La región de anuncios vive dentro de la hoja** (fuera de un diálogo modal el resto de la página es inerte).

## Eventos

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `update:modelValue` | Boolean | El usuario cierra la hoja (siempre `false`) |
| `add` | `{ id, size }` | El usuario pulsa Añadir (no se emite para un único ya añadido) |
| `search` | `{ query, category, count }` | Cambia el filtro (con un retardo mínimo de la entrada; sirve para telemetría o para cargar más) |
| `open`, `closed` | | Como en `GDialog` |

Método expuesto: `announce(texto)`.

## Slots

| Slot | Propósito | Alcance | Anatomía que debe conservar |
| --- | --- | --- | --- |
| `preview` | Vista previa de la tarjeta (un widget con datos simulados) | `{ item, size }` | Dentro de `g-widget-gallery__preview` (`aria-hidden`, `inert` los pone el componente) |
| `card` | Sustituye el contenido de la tarjeta (nombre, descripción y vista previa) | `{ item, added, size }` | El botón Añadir y el selector de tamaño los conserva el componente |
| `empty` | Contenido del estado vacío | `{ query }` | Sustituye a `labels.empty` |
| `footer` | Pie de la hoja | `{ close }` | El botón «Cerrar» del componente se conserva si hay `labels.close` |

## Textos (`labels`)

Ninguno tiene valor por defecto. Marcadores: `{title}`, `{count}`.

| Clave | Uso | Requerido |
| --- | --- | --- |
| `search` | Etiqueta del campo de búsqueda | Sí |
| `all` | Nombre de la categoría «Todas» | Sí, con categorías |
| `categories` | Leyenda (oculta) del grupo de categorías | Sí, con categorías |
| `add` | Texto del botón Añadir (el nombre accesible añade el título) | Sí |
| `size` | Etiqueta del selector de tamaño inicial | Sí, con más de un tamaño |
| `results` | Contador («{count} widgets») | Sí |
| `empty` | Mensaje de sin resultados | Sí |
| `added` | Marca de un único ya añadido («Ya añadido») | Sí, con `unique` |
| `addedCount` | Marca de un repetible («En el panel: {count}») | Sí, con repetibles |
| `addedShort` | Texto del botón de un único ya añadido («Añadido») | Sí, con `unique` |
| `addedToPanel` | Anuncio tras añadir («{title} añadido») | Recomendado |
| `alreadyAdded` | Anuncio al pulsar un único ya añadido («{title} ya está en el panel») | Recomendado |
| `close` | Botón «Cerrar» del pie (y nombre de la ✕ de `GDialog`) | Sí |
| `list` | Nombre accesible de la lista de tarjetas | Recomendado |

## Estructura accesible

```html
<dialog class="g-dialog g-dialog--placement-end g-widget-gallery" …>   <!-- de GDialog -->
  <div class="g-dialog__header">… <h2>Añadir widget</h2> …</div>
  <div class="g-dialog__body">
    <div class="g-widget-gallery__search"><label for="ID-q">Buscar widgets</label><input id="ID-q" type="search" aria-controls="ID-list"></div>
    <fieldset class="g-widget-gallery__cats"><legend class="g-widget-gallery__sr">Categoría</legend>
      <label class="g-widget-gallery__cat"><input type="radio" name="ID-cat" checked><span>Todas</span></label> …</fieldset>
    <p class="g-widget-gallery__status" role="status">6 widgets</p>
    <ul class="g-widget-gallery__list" id="ID-list" aria-label="Widgets disponibles">
      <li><article class="g-widget-gallery__card" aria-labelledby="ID-c1-t" aria-describedby="ID-c1-d">
        <span class="g-widget-gallery__category">Finanzas</span> <span class="g-widget-gallery__tag">Ya añadido</span>
        <h3 id="ID-c1-t">Ingresos</h3><p id="ID-c1-d">…</p>
        <div class="g-widget-gallery__preview" aria-hidden="true" inert>…slot preview…</div>
        <div class="g-widget-gallery__row"><label for="ID-c1-s">Tamaño inicial</label><select id="ID-c1-s">…</select>
          <button type="button" aria-describedby="ID-c1-d" aria-disabled="true">Añadido<span class="g-widget-gallery__sr"> Ingresos</span></button></div>
      </article></li>
    </ul>
    <p class="g-widget-gallery__empty">Ningún widget coincide con la búsqueda.</p>
    <div class="g-widget-gallery__sr" role="status" aria-live="polite"></div>   <!-- anuncios -->
  </div>
  <div class="g-dialog__footer"><button type="button">Cerrar</button></div>
</dialog>
```

- **Categorías:** radios nativos dentro de un `fieldset`; la selección se marca con **relleno y una marca ✓** (no solo color).
- **Campos nativos con etiqueta visible** (búsqueda, tamaño). **Botones y controles ≥ 24px, 44px con `pointer: coarse`.**
- **Tarjeta en lista:** nombre de la lista con `labels.list`.
- **Anuncios:** región `role="status"` propia dentro de la hoja; la del contador es otra (no se mezclan).

## Teclado

| Tecla | Acción |
| --- | --- |
| Tab / Shift+Tab | Búsqueda, categorías (un solo tope; ← → ↑ ↓ dentro del grupo), y en cada tarjeta el tamaño y Añadir; no sale de la hoja |
| ← → ↑ ↓ (categorías) | Cambian la categoría (nativo de los radios) |
| Enter / Espacio (Añadir) | Emite `add` |
| Esc | Cierra (vía `GDialog`) |

## Tokens consumidos

Los de `GDialog` y los de los controles: `--g-color-surface`, `--g-color-surface-sunken`, `--g-color-border`, `--g-color-border-control`, `--g-color-text*`, `--g-color-focus`, `--g-color-brand`, `--g-color-on-brand`, `--g-radius-*`, `--g-space-*`, `--g-text-*`, `--g-border-width`, `--g-focus-*`. **Sin tokens nuevos**: el ancho de la hoja sale de `size` de `GDialog`.

## Clases (contrato entre bruno y coco)

| Clase | Elemento | Cuándo |
| --- | --- | --- |
| `g-widget-gallery` (+ `--density-*`) | Raíz (`<dialog>`, junto a `g-dialog`) | Siempre |
| `g-widget-gallery__search`, `__cats`, `__cat`, `__status`, `__list`, `__empty`, `__sr` | Búsqueda, categorías, contador, lista, estado vacío y texto oculto | Según el estado |
| `g-widget-gallery__card`, `__category`, `__tag`, `__preview`, `__row` | Tarjeta y sus partes | Por widget |
| `g-widget-gallery__btn` (+ `--primary`) | Botones propios (Añadir, Cerrar) | Siempre |
| `is-added` | Tarjeta | Con `added[id] > 0` |

## Resolución de hallazgos de r02

| # | Hallazgo | Resolución | Base |
| --- | --- | --- | --- |
| 1 | Nombres y alcance | `GWidgetGallery` (este contrato), `GWidgetConfig` y la convención de acción `configure` de `GWidget` | DECISIONS.md #76 |
| 2 | Hoja lateral | `GDialog` gana `placement="end"`; la galería y el panel lo reutilizan | DECISIONS.md #77 |
| 3 | API de la galería | `items`, `added`, `sizes`, `categories`, `labels`, slot `preview`, evento `add`; los anuncios por `labels` y `announce()` | DECISIONS.md #76 |
| 6 | Vista previa | Slot; el componente pone `aria-hidden` e `inert` | DECISIONS.md #76 |
| 7 | Anuncios | Por `labels` con marcadores; sin valores por defecto | — |
| 8 | Dónde se anuncia | Región dentro de la hoja | DECISIONS.md #76 |
| 9 | Posición de «añadir» | Al final: lo decide la aplicación (el componente solo emite `add`) | — |
| 10 | Tokens | Ninguno nuevo | — |

## Límites conocidos

- **Sin arrastrar desde la galería a una posición:** se añade al final (la aplicación) y después se reordena con `GWidgetGrid`.
- **Sin paginación ni virtualización:** pensada para un catálogo de decenas de widgets.
- **Sin búsqueda en servidor:** el filtro es local; `search` permite a la aplicación reaccionar.
- **Lector de pantalla:** el anuncio de los resultados y de añadir está por verificar con lectores reales; Firefox y Safari (`<dialog>`, `inert`), por verificar.

## Abierto (no bloquea el paso siguiente)

- Valores estéticos (tarjeta, categorías, marca de añadido, vista previa): los decide coco.
