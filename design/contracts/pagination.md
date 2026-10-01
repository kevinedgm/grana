# Contrato · GPagination

**Dueño:** lima · **Estado:** aprobado · **Basado en:** `design/lab/table/r01/` (kiwi)
**Tag:** `g-pagination` · **Categoría:** navegación

Paginación de una colección. La usa `GTable` y funciona sola (listas, tarjetas, resultados).

## Props

| Prop | Tipo | Valores | Default | Origen |
| --- | --- | --- | --- | --- |
| `page` | Number | ≥ 1 | `1` | propia (`v-model:page`) |
| `total` | Number | ≥ 0 (elementos) | `0` | propia |
| `pageSize` | Number | ≥ 1 | `10` | propia |
| `siblings` | Number | ≥ 0 | `1` | propia |
| `responsive` | String | `auto` `full` `compact` | `auto` | propia |
| `labels` | Object | ver abajo | `{}` (función) | propia |

- **Páginas visibles:** primera, última, la actual y `siblings` a cada lado; los saltos se marcan con una elipsis **no interactiva** (`aria-hidden`).
- **`responsive`:** `auto` mide el contenedor y usa la forma **compacta** («Página 2 de 10» + anterior/siguiente) cuando no caben los botones: ancho < (botones visibles + 4) × `space × 9`.
- **Anterior/siguiente:** `disabled` nativo en los extremos.
- **Tras cambiar de página**, el foco va a la página actual (o al control pulsado si sigue existiendo).

## Textos (`labels`, sin valores por defecto)

`nav` (nombre del `<nav>`), `previous`, `next`, `page` (plantilla `{page}`), `range` (plantilla `{from}`, `{to}`, `{total}`), `compact` (plantilla `{page}`, `{pages}`). Sin `nav`, `console.warn` en desarrollo.

## Estructura

```html
<nav class="g-pagination" aria-label="Paginación de clientes">
  <span class="g-pagination__range">6–10 de 12</span>
  <div class="g-pagination__controls">
    <button class="g-pagination__step" type="button" aria-label="Página anterior">…chevron-left…</button>
    <ol class="g-pagination__pages"><li><button class="g-pagination__page" type="button" aria-current="page" aria-label="Página 2">2</button></li>…</ol>
    <span class="g-pagination__compact">Página 2 de 3</span>                 <!-- solo compacta -->
    <button class="g-pagination__step" type="button" aria-label="Página siguiente">…chevron-right…</button>
  </div>
</nav>
```

## Eventos

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `update:page` | número | El usuario cambia de página |

## Teclado

Tab recorre los botones; Enter/Espacio activan (nativo). Con `pointer: coarse`, botones ≥ 44px.

## Tokens

`--g-color-text`, `--g-color-text-muted`, `--g-color-border-strong`, `--g-color-focus`, `--g-radius-md`, `--g-space-1`, `--g-text-body-sm-{size|line}`, `--g-text-action-weight`, `--g-border-width`, `--g-focus-{width|offset}`. Iconos `chevron-left` y `chevron-right` (`GIcon`). Sin tokens nuevos.

## Clases

`g-pagination`, `g-pagination--compact` (medido o por prop), `__range`, `__controls`, `__step`, `__pages`, `__page`, `__ellipsis`, `__compact`.
