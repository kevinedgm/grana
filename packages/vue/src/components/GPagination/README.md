# GPagination

Paginación de una colección: rango («11–20 de 120»), anterior/siguiente y páginas (primera, última, la actual y sus vecinas, con «…» en los saltos). Cuando no caben los botones, pasa a **«Página 2 de 12»** con anterior/siguiente. Con `pageSizes`, añade un **selector de filas por página** (radios nativos) que conserva la fila que estabas mirando. La usa [`GTable`](../GTable/README.md) y funciona sola.

**Etiqueta:** `<g-pagination>` · **Estado:** `candidate` (ver [`design/lab/table/auditoria.md`](../../../../../design/lab/table/auditoria.md)) · **Desde:** 0.1.0

> `@grana/vue` está en la versión `0.1.0-beta.0` y aún no se publica en npm. Por ahora se usa desde el repositorio (ver el playground en `packages/vue/playground/`). Exige Vue `^3.5.0`.

## Uso

```vue
<!-- Fragmento: `pagina` es de tu aplicación -->
<g-pagination v-model:page="pagina" :total="120" :page-size="10" :labels="{
  nav: 'Paginación de resultados', previous: 'Página anterior', next: 'Página siguiente',
  page: 'Página {page}', range: '{from}–{to} de {total}', compact: 'Página {page} de {pages}' }"></g-pagination>
```

Con `auto`, mide **su contenedor** y usa la forma compacta si no caben los botones.

### Con selector de filas por página

```vue
<!-- Fragmento: `pagina` y `tamano` son de tu aplicación -->
<g-pagination
  v-model:page="pagina"
  v-model:pageSize="tamano"
  :total="450"
  :page-sizes="[10, 25, 50, 100]"
  :labels="{
    nav: 'Paginación de resultados',
    previous: 'Página anterior', next: 'Página siguiente',
    page: 'Página {page}', range: '{from}–{to} de {total}', compact: 'Página {page} de {pages}',
    pageSize: 'Filas por página'
  }">
</g-pagination>
```

Por qué: cuando el usuario cambia el número de filas, la primera fila que veía no desaparece: la nueva página la contiene. La fila «ancla» es la primera de la página actual.

## Props

| Prop | Tipo | Valores | Por defecto |
| --- | --- | --- | --- |
| `page` (`v-model:page`) | Number | ≥ 1 | `1` |
| `total` | Number | elementos | `0` |
| `pageSize` (`v-model:pageSize`) | Number | ≥ 1 | `10` |
| `pageSizes` | Array | enteros ≥ 1 | sin valor (sin selector) |
| `siblings` | Number | páginas vecinas a cada lado de la actual | `1` |
| `responsive` | String | `auto` `full` `compact` | `auto` |
| `labels` | Object | ver «Textos» | `{}` |

Un valor fuera de la lista avisa en desarrollo.

- **`pageSizes` (#593):** sin la prop, no hay selector y todo funciona como siempre (compatibilidad). La lista se ordena de menor a mayor y se depuran repetidos y valores no válidos (aviso en desarrollo). Un `pageSize` fuera de la lista se añade en su orden (el control nunca muestra un valor que no es el real) y avisa.
- **`pageSize` sin `v-model`:** la paginación guarda el tamaño elegido internamente (espejo), como `page`.

## Eventos

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `update:pageSize` | Number | El usuario elige un tamaño en el selector. **Siempre antes** que `update:page`, en el mismo ciclo |
| `update:page` | Number | El usuario cambia de página; tras `update:pageSize`, solo si la página cambia |

**Orden (#594):** `update:pageSize` se emite primero y `update:page` después, síncronos en el mismo manejador. Así la aplicación ve los dos cambios en el mismo vaciado de Vue. Receta en modo servidor:

```js
// Un único watch que pide una sola vez
watch([page, pageSize], ([p, s]) => {
  loading.value = true
  fetchPage({ page: p, pageSize: s }).then(…)
})
```

## Textos (`labels`)

Sin valores por defecto (Grana es internacional). `nav` y `pageSize` (con `pageSizes`) avisan si faltan:

| Clave | Plantilla | Requerida |
| --- | --- | --- |
| `nav` | nombre del `<nav>` | Sí |
| `previous` | botón «Página anterior» | Sí |
| `next` | botón «Página siguiente» | Sí |
| `page` | nombre de cada página: `{page}` | Sí |
| `range` | rango visible: `{from}`, `{to}`, `{total}` | Sí |
| `compact` | forma compacta: `{page}`, `{pages}` | Sí |
| `pageSize` | nombre visible del selector («Filas por página») | Sí, con `pageSizes` |

## Pie acoplado en `GTable`

Cuando `GTable` tiene `pageSizes`, le añade a su `GPagination` la clase `g-pagination--dock`: el pie queda pegado al borde inferior de la ventana mientras la tabla siga por debajo y vuelve a su sitio al llegar al final (`position: sticky`). `is-stuck` se activa mientras está acoplado.

**Fuera de `GTable`**, `GPagination` no se acopla sola: el acoplamiento lo gestiona el contexto interno de la tabla.

## Accesibilidad

- `<nav>` con nombre (`labels.nav`); `aria-current="page"` en la página actual; anterior y siguiente deshabilitados en los extremos (`aria-disabled`); la elipsis no es interactiva; tras cambiar, el foco va a la página actual; 44px con `pointer: coarse`.
- **Selector de filas por página:** `role="radiogroup"` con nombre (`labels.pageSize`); radios nativos (Tab entra y sale, ← → ↑ ↓ cambian y aplican); con `pointer: coarse`, cada cifra ≥ 44×44px.

## Tema

Solo lee tokens `--g-*`: `--g-color-text`, `--g-color-text-muted`, `--g-color-border-strong`, `--g-color-surface-sunken`, `--g-color-focus`, `--g-radius-md`, `--g-space-1..4`, `--g-text-body-sm-{size|line}`, `--g-text-action-weight`, `--g-border-width`, `--g-focus-{width|offset}`, `--g-color-surface`, `--g-color-border`, `--g-shadow-1`, `--g-duration-fast` y `--g-ease-standard`.

## Limitaciones conocidas

- **Sin verificar:** lector de pantalla real, Safari real, táctil real y zoom al 200%. Las filas por página (pie acoplado, fila ancla, 360 px con puntero grueso) están medidas en Chromium, Firefox y WebKit (`tests/table-page-size.spec.mjs`).

## Fuentes

API: [`GPagination.meta.json`](./GPagination.meta.json) · Contrato: [`design/contracts/pagination.md`](../../../../../design/contracts/pagination.md)
