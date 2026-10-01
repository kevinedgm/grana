# GPagination

Paginación de una colección: rango («11–20 de 120»), anterior/siguiente y páginas (primera, última, la actual y sus vecinas, con «…» en los saltos). Cuando no caben los botones, pasa a **«Página 2 de 12»** con anterior/siguiente. La usa [`GTable`](../GTable/README.md) y funciona sola.

**Etiqueta:** `<g-pagination>` · **Estado:** `candidate` (ver [`design/lab/table/auditoria.md`](../../../../../design/lab/table/auditoria.md)) · **Desde:** 0.1.0

```vue
<g-pagination v-model:page="pagina" :total="120" :page-size="10" :labels="{
  nav: 'Paginación de resultados', previous: 'Página anterior', next: 'Página siguiente',
  page: 'Página {page}', range: '{from}–{to} de {total}', compact: 'Página {page} de {pages}' }"></g-pagination>
```

| Prop | Tipo | Valores | Por defecto |
| --- | --- | --- | --- |
| `page` (`v-model:page`) | Number | ≥ 1 | `1` |
| `total` | Number | elementos | `0` |
| `pageSize` | Number | ≥ 1 | `10` |
| `siblings` | Number | vecinas a cada lado de la actual | `1` |
| `responsive` | String | `auto` `full` `compact` | `auto` |
| `labels` | Object | `nav`, `previous`, `next`, `page` (`{page}`), `range` (`{from}`, `{to}`, `{total}`), `compact` (`{page}`, `{pages}`) | `{}` |

Evento `update:page`. Con `auto`, mide **su contenedor** y usa la forma compacta si no caben los botones.

**Accesibilidad:** `<nav>` con nombre; la página actual con `aria-current="page"`; anterior y siguiente deshabilitados en los extremos; la elipsis no es interactiva; tras cambiar, el foco va a la página actual; 44px con `pointer: coarse`.

Fuentes: [`GPagination.meta.json`](./GPagination.meta.json) · Contrato: [`design/contracts/pagination.md`](../../../../../design/contracts/pagination.md)
