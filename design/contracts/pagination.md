# Contrato · GPagination

**Dueño:** lima · **Estado:** aprobado; filas por página contratadas el 2026-10-13 (DECISIONS.md #592 a #596, pendiente de coco y bruno) · **Basado en:** `design/lab/table/r01/` y `design/lab/pagination/r02/` (kiwi)
**Tag:** `g-pagination` · **Categoría:** navegación

Paginación de una colección. La usa `GTable` y funciona sola (listas, tarjetas, resultados).

## Props

| Prop | Tipo | Valores | Default | Origen |
| --- | --- | --- | --- | --- |
| `page` | Number | ≥ 1 | `1` | propia (`v-model:page`) |
| `total` | Number | ≥ 0 (elementos) | `0` | propia |
| `pageSize` | Number | ≥ 1 | `10` | propia (`v-model:pageSize`, #593) |
| `pageSizes` | Array | enteros ≥ 1 | sin valor (sin selector) | propia (#593) |
| `siblings` | Number | ≥ 0 | `1` | propia |
| `responsive` | String | `auto` `full` `compact` | `auto` | propia |
| `labels` | Object | ver abajo | `{}` (función) | propia |

- **Páginas visibles:** primera, última, la actual y `siblings` a cada lado; los saltos se marcan con una elipsis **no interactiva** (`aria-hidden`).
- **`responsive`:** `auto` mide el contenedor y usa la forma **compacta** («Página 2 de 10» + anterior/siguiente) cuando no caben los botones: ancho < (botones visibles + 4) × `space × 9`.
- **Anterior/siguiente:** `disabled` nativo en los extremos.
- **Tras cambiar de página**, el foco va a la página actual (o al control pulsado si sigue existiendo).

## Textos (`labels`, sin valores por defecto)

`nav` (nombre del `<nav>`), `previous`, `next`, `page` (plantilla `{page}`), `range` (plantilla `{from}`, `{to}`, `{total}`), `compact` (plantilla `{page}`, `{pages}`), **`pageSize`** (nombre visible del selector de filas por página, «Filas por página»; #593). Sin `nav`, `console.warn` en desarrollo; con `pageSizes` y sin `pageSize`, también.

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

Con `pageSizes` (#593, #595), el rango y el selector van juntos en `__meta`, antes de los controles:

```html
<nav class="g-pagination [g-pagination--dock] [is-stuck]" aria-label="Paginación de lotes">
  <div class="g-pagination__meta">
    <div class="g-pagination__size" role="radiogroup" aria-labelledby="g-12-size">
      <span class="g-pagination__size-label" id="g-12-size">Filas por página</span>
      <span class="g-pagination__sizes">
        <label class="g-pagination__size-option"><input class="g-pagination__size-input" type="radio" name="g-12-size" value="10" checked><span class="g-pagination__size-text">10</span></label>
        <label class="g-pagination__size-option"><input class="g-pagination__size-input" type="radio" name="g-12-size" value="25"><span class="g-pagination__size-text">25</span></label>
        …
      </span>
    </div>
    <span class="g-pagination__range" role="status">1–10 de 240</span>   <!-- sin role dentro de GTable con labels.range (#596) -->
  </div>
  <div class="g-pagination__controls">…</div>
</nav>
```

## Eventos

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `update:pageSize` | número | El usuario elige un tamaño en el selector (#593). **Siempre antes** que `update:page` |
| `update:page` | número | El usuario cambia de página; tras `update:pageSize`, **en el mismo ciclo** y solo si la página cambia (#594) |

## Teclado

Tab recorre los botones; Enter/Espacio activan (nativo). Con `pointer: coarse`, botones ≥ 44px.

Selector de filas por página: **grupo de radios nativo** (APG *Radio Group*): Tab entra en el marcado y sale del grupo; ← → ↑ ↓ cambian **y aplican** (nativo, cada flecha es un cambio). Foco visible con flechas en WebKit con `data-g-key-focus` (#441, #450). Con `pointer: coarse`, cada cifra ≥ 44 × 44px.

## Tokens

`--g-color-text`, `--g-color-text-muted`, `--g-color-border-strong`, `--g-color-focus`, `--g-radius-md`, `--g-space-1`, `--g-text-body-sm-{size|line}`, `--g-text-action-weight`, `--g-border-width`, `--g-focus-{width|offset}`. Iconos `chevron-left` y `chevron-right` (`GIcon`). Sin tokens nuevos.

**Desde #593 y #595** (selector y pie acoplado; sin tokens nuevos): `--g-color-surface`, `--g-color-surface-sunken` (pista de las cifras), `--g-color-border` (filo del pie acoplado), `--g-shadow-1` (cifra marcada y pie acoplado), `--g-duration-fast`, `--g-ease-standard`.

## Clases

`g-pagination`, `g-pagination--compact` (medido o por prop), `__range`, `__controls`, `__step`, `__pages`, `__page`, `__ellipsis`, `__compact`.

**Desde #593 y #595:** `__meta` (rango + selector), `__size` (`role="radiogroup"`), `__size-label`, `__sizes` (pista), `__size-option` (`label`), `__size-input` (radio nativo), `__size-text` (la cifra visible). `g-pagination--dock` (lo pone `GTable` con `pageSizes`: pie acoplado) e `is-stuck` (medido: acoplado ahora mismo al borde inferior). Variable en línea: ninguna en el `nav` (el alto del pie lo publica `GTable` como `--_dock-size` en su raíz, ver `table.md`).

## Filas por página (#592 a #596)

**Forma elegida por el usuario (2026-10-13): B · «Pie que acompaña»** de `design/lab/pagination/r02/` (las cifras a la vista, a un toque; en `GTable` el pie se acopla al borde inferior de la pantalla con tablas largas; la fila que mirabas no se mueve y se señala). A («el rango se abre») y C («tirar del borde») **no se adoptan** y sus nombres (`labels.pageSizeOption`, `labels.all`, el agarre) **no** se reservan.

### Reglas de props

- **Sin `pageSizes` no hay selector**: todo lo de antes sigue igual (compatibilidad).
- **`pageSizes`**: enteros ≥ 1; la lista se **ordena** de menor a mayor y se **depuran** repetidos y valores no válidos (aviso en desarrollo, una vez). Una lista vacía tras depurar equivale a no darla.
- **`pageSize` fuera de la lista**: se **añade** en su orden (el control nunca enseña un valor que no es el real, WCAG 4.1.2) y avisa en desarrollo, una vez.
- **Tamaños mayores que el total**: las cifras **no** se ocultan ni se deshabilitan (el pie no cambia de forma al filtrar; WCAG 3.2.3).
- **Mientras carga** (dentro de `GTable`), el selector **sigue operable**; cada cambio emite (la aplicación cancela la petición vieja; receta del README).
- **Sin persistencia propia**: recordar el tamaño por tabla es de la aplicación (receta con su almacenamiento).

### El cambio de tamaño

1. **Página nueva = ⌊índice del ancla ÷ tamaño nuevo⌋ + 1**, con el índice del ancla contado desde 0 sobre toda la colección. **Nunca** «volver a la 1» ni «conservar el número de página». **Fuera de `GTable`** (o sin tabla), el ancla es la **primera fila de la página** (índice `(page − 1) × pageSize`). **Dentro de `GTable`**, el ancla la decide la tabla (`table.md` «La fila ancla»).
2. **Orden de eventos (#594):** `update:pageSize` y después `update:page` (solo si la página cambia), **síncronos y en el mismo manejador**, de modo que la aplicación ve los dos cambios en el mismo vaciado de Vue. **Receta del README (modo servidor):** un único `watch([page, pageSize], …)` que pide **una** vez y pone `loading` en el mismo `watch`.
3. **El foco se queda en el radio** marcado (no salta a la página actual, como sí hace un cambio de página): la persona puede seguir ajustando. Los radios **no se vuelven a crear** al cambiar de tamaño (mismo nodo; si se recrean, se pierde el foco).
4. **Un solo anuncio** por gesto: el nuevo valor lo dice el propio lector (radio marcado); **el rango** lo dice `g-pagination__range` (`role="status"`) cuando la paginación va sola, o la región de la tabla dentro de `GTable` (#596).
5. **Móvil:** la forma compacta **conserva** el selector; el `__meta` y los controles se parten en líneas si no caben (sin desplazamiento horizontal a 360px, medido por kiwi). El umbral de la compacta no cambia (mide los controles).

### Pie acoplado (solo dentro de `GTable`, #595)

`GPagination` **sola no se acopla**. Dentro de `GTable` con `pageSizes`, la tabla le pone `g-pagination--dock` (por el contexto interno, ver `table.md`): `position: sticky` al borde inferior (`inset-block-end: 0`) dentro de la raíz de la tabla, así que **acompaña mientras la tabla siga por debajo** y vuelve a su sitio al llegar al final. `is-stuck` lo mide bruno **sin escuchar `scroll` en cada cuadro** (p. ej. `IntersectionObserver` sobre un centinela al final de la raíz); acoplado lleva el filo superior `--g-color-border` y `--g-shadow-1`. Sin umbral de alto de ventana en esta entrega (#595).

### Avisos de desarrollo (`[Grana] <GPagination>`, una vez cada uno)

`pageSizes` sin `labels.pageSize`; `pageSizes` con valores repetidos o no válidos (depurados); `pageSize` fuera de `pageSizes` (añadido).

### Peso (#506, #550; #602, #650)

`GPagination` ya está en el principal y el selector, el ancla, el acople y el anuncio no abren entrada propia. Pesa **+752 B gzip** sola; el lote completo con `GTable` tiene el presupuesto de **+5,75 KiB** de `table.md` «Peso» (#650). **`name` de los radios:** sale de `useId`, único por instancia y por aplicación; dos aplicaciones de Vue en la misma página lo repiten salvo que cada una fije `app.config.idPrefix` (Vue 3.5). No hay prop propia para ello (#650).

### Pruebas (bruno)

`GPagination.test.js`: sin `pageSizes` no hay selector; orden y depuración de la lista; `pageSize` fuera de la lista se añade y avisa; `radiogroup` con nombre y un radio nativo por cifra con `name` único por instancia; `update:pageSize` antes de `update:page` en el mismo manejador; página por ancla (primera de la página, sola); el foco se queda en el radio; el rango conserva `role="status"` sola. En navegador, con `GTable`: `tests/table-page-size.spec.mjs` (ver `table.md`).
