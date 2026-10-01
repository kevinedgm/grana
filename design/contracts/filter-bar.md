# Contrato · GFilterBar

**Dueño:** lima · **Estado:** aprobado · **Basado en:** `design/lab/table/r02/` (kiwi)
**Tag:** `g-filter-bar` · **Categoría:** entrada de datos

Barra de filtros **no fijos** al estilo Stripe: chips sugeridos, «Agregar filtro», un editor de **regla + valor** por campo y chips aplicados con su resumen. Produce un **modelo de datos** (`filters`). La integra `GTable` y funciona sola. Los filtros se combinan con **Y**; dentro de una lista, **O** (decisión del usuario, DECISIONS.md #109).

## Props

| Prop | Tipo | Valores | Default | Origen |
| --- | --- | --- | --- | --- |
| `fields` | Array | `{ key, label, filter }` (la misma forma que las columnas de `GTable`) | `[]` (función) | propia |
| `filters` | Array | `{ key, op, value }` | `[]` (función) | propia (`v-model:filters`) |
| `count` | Number | resultados | sin valor | propia |
| `labels` | Object | ver abajo | `{}` (función) | propia |

### `filter` de un campo

| Campo | Tipo | Nota |
| --- | --- | --- |
| `type` | String | `text` `number` `date` `enum` |
| `options` | Array | `enum`: valores (o `{ value, label }`) |
| `unit` | String | `number`: `$`, `%`… para el resumen (formato con `Intl`) |
| `fields` | Array | `text`: campos donde buscar (compuestas) |
| `suggest` | Boolean | Aparece como chip sugerido mientras no esté aplicado |

### Reglas por tipo (lista cerrada)

| Tipo | `op` | `value` |
| --- | --- | --- |
| `text` | `contains` `is` `starts` | texto |
| `number` | `gt` `lt` `eq` `between` | número; `between`: `[desde, hasta]` |
| `date` | `after` `before` `between` `last` | `YYYY-MM-DD`; `between`: `[desde, hasta]`; `last`: días (número) |
| `enum` | `in` | lista de valores (≥ 1) |

- **Un filtro por campo** (aplicar sobre uno existente lo sustituye).
- **Validación del editor:** no se aplica sin valor (un campo numérico vacío no es 0); `between` exige desde ≤ hasta; mensaje visible y anunciado.

## Comportamiento

- **Chip sugerido** (`suggest`, no aplicado) → abre el editor de ese campo.
- **«Agregar filtro»** → `GMenu` con los campos filtrables no aplicados → editor.
- **Editor:** diálogo no modal (nombre «{filterBy}»), regla (`select`, si hay más de una), valor según tipo, Cancelar y Aplicar. **Enter aplica; Esc cancela;** el foco vuelve al chip (o a «Agregar filtro»). Se posiciona con `utils/anchor.js` y, por debajo de `space × 130`, se abre como **hoja** (`GDialog`), con el mismo criterio que `GHelper` (DECISIONS.md #103).
- **Chip aplicado:** dos botones: el resumen («Total mayor que $3,000») reabre el editor; la × quita el filtro y el foco pasa al chip siguiente (o a «Agregar filtro»).
- **«Limpiar filtros»:** solo con filtros; el foco va a «Agregar filtro».
- **Recuento** (`count`) visible y anunciado (región viva cortés) tras cada cambio.

## Textos (`labels`, sin valores por defecto)

`group` (nombre del grupo), `add`, `clear`, `rule`, `value`, `from` y `to` (nombres de los campos del editor), `range` (validación de «entre»), `filterBy` (plantilla `{label}`), `edit` y `remove` (plantilla `{summary}`), `apply`, `cancel`, `required` (validación), `and` (unión en resúmenes de «entre»), `days` (plantilla `{n}`), `results` (plantilla `{count}`), y `ops` (objeto con el nombre de cada `op`: `contains`, `is`, `starts`, `gt`, `lt`, `eq`, `between`, `after`, `before`, `last`, `in`). Sin textos, `console.warn` en desarrollo.

## Estructura

```html
<div class="g-filter-bar" role="group" aria-label="Filtros de clientes">
  <span class="g-filter-bar__chip">
    <button class="g-filter-bar__edit" type="button" aria-haspopup="dialog" aria-label="Editar filtro: Total mayor que $3,000"><b>Total</b> mayor que $3,000</button>
    <button class="g-filter-bar__remove" type="button" aria-label="Quitar filtro: Total mayor que $3,000">…x…</button>
  </span>
  <button class="g-filter-bar__suggest" type="button" aria-haspopup="dialog">…plus… Estado</button>
  <g-menu …>«Agregar filtro»</g-menu>
  <button class="g-filter-bar__clear" type="button">Limpiar filtros</button>
  <span class="g-filter-bar__count">6 resultados</span>
  <div class="g-filter-bar__editor" role="dialog" aria-labelledby="ID-title" popover="manual">…</div>
</div>
```

## Eventos

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `update:filters` | filtros | Aplicar, quitar o limpiar |

## Tokens

`--g-color-surface`, `--g-color-text`, `--g-color-text-muted`, `--g-color-border`, `--g-color-border-strong`, `--g-color-border-control`, `--g-color-focus`, `--g-radius-pill`, `--g-radius-lg`, `--g-shadow-2`, `--g-space-1`, `--g-text-body-sm-{size|line}`, `--g-text-action-weight`, `--g-border-width`, `--g-focus-{width|offset}`. Iconos `plus` y `x`. Sin tokens nuevos. El editor usa el lenguaje de `GSurface level="floating"`.

## Clases

`g-filter-bar`, `__chip`, `__edit`, `__remove`, `__suggest`, `__add`, `__clear`, `__count`, `__editor`, `__editor-title`, `__rule`, `__value`, `__range`, `__input`, `__error`, `__actions`, `__sheet` y `__sr` (texto oculto propio, para que la barra funcione sin `GTable`).

**Añadido al construir (bruno):** los textos `rule`, `value`, `from`, `to` y `range` (los campos del editor necesitan nombre accesible, WCAG 4.1.2) y las clases `__range`, `__input`, `__sheet` y `__sr`.

## Límites conocidos

Sin grupos Y/O anidados (constructor de reglas: ronda posterior), sin filtros guardados ni en la URL, sin operadores personalizados.
