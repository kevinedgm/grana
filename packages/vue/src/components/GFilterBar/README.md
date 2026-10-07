# GFilterBar

Filtros **no fijos** al estilo Stripe: el usuario **descubre** qué puede filtrar (chips sugeridos y «Agregar filtro»), **define** una regla y un valor en un editor y **lee** el resultado como un chip («Total mayor que $3,000 ×»). Produce un **modelo de datos** (`filters`) que tú aplicas o envías a tu servidor. La usa [`GTable`](../GTable/README.md) y funciona sola.

**Etiqueta:** `<g-filter-bar>` · **Estado:** `candidate` (ver [`design/lab/table/auditoria.md`](../../../../../design/lab/table/auditoria.md)) · **Desde:** 0.1.0

## Uso

```vue
<g-filter-bar :fields="campos" v-model:filters="filtros" :count="resultados.length" :labels="textos"></g-filter-bar>
```

```js
const campos = [
  { key: 'estado', label: 'Estado', filter: { type: 'enum', options: ['activo', 'pausado', 'vencido'], suggest: true } },
  { key: 'total',  label: 'Total',  filter: { type: 'number', unit: '$', suggest: true } },
  { key: 'alta',   label: 'Alta',   filter: { type: 'date' } },
  { key: 'cliente', label: 'Cliente', filter: { type: 'text', fields: ['nombre', 'correo'] } }
]
// filtros = [{ key: 'estado', op: 'in', value: ['pausado', 'vencido'] }, { key: 'total', op: 'gt', value: 3000 }]
```

## Reglas

Cada campo declara su tipo, y el tipo decide las reglas:

| Tipo | `op` | `value` |
| --- | --- | --- |
| `text` | `contains` · `is` · `starts` | texto (en `fields`, si hay varios) |
| `number` | `gt` · `lt` · `eq` · `between` | número; `between`: `[desde, hasta]` |
| `date` | `after` · `before` · `between` · `last` | `YYYY-MM-DD`; `last`: número de días |
| `enum` | `in` | lista de opciones (≥ 1) |

**Todos los filtros se cumplen a la vez (Y); dentro de una lista, cualquiera de sus opciones (O).** Un filtro por campo. El editor no aplica sin valor (un campo numérico vacío **no** es 0) y «entre» exige desde ≤ hasta.

## Cómo se usa

- **Chip sugerido** (punteado, `suggest: true`): abre el editor de ese campo.
- **«Agregar filtro»:** menú con los campos filtrables aún no aplicados.
- **Editor:** regla + valor + Cancelar/Aplicar. **Enter aplica; Esc cancela;** el foco vuelve al chip. En escritorio es un popover junto al chip; por debajo de `space × 130` (520px), una **hoja inferior** ([`GDialog`](../GDialog/README.md)).
- **Chip aplicado:** su resumen reabre el editor; la × lo quita (el foco pasa al siguiente).
- **«Limpiar filtros»** y el **recuento** («6 resultados», anunciado).

## Props y eventos

| Prop | Tipo | Por defecto |
| --- | --- | --- |
| `fields` | Array (`{ key, label, filter }`, la misma forma que las columnas de `GTable`) | `[]` |
| `filters` (`v-model:filters`) | Array | `[]` |
| `count` | Number (resultados) | sin valor |
| `labels` | Object | `{}` |

Evento `update:filters` al aplicar, quitar o limpiar. Para aplicar los filtros fuera de `GTable`, el motor está en `src/utils/filters.js` (`applyFilters`, uso interno en v0.1).

## Textos (`labels`)

`group`, `add`, `clear`, `filterBy` (`{label}`), `edit` y `remove` (`{summary}`), `apply`, `cancel`, `required`, `range`, `rule`, `value`, `from`, `to`, `and`, `days` (`{n}`), `results` (`{count}`) y `ops` (nombre de cada regla: `contains`, `is`, `starts`, `gt`, `lt`, `eq`, `between`, `after`, `before`, `last`, `in`). Los valores se formatean con `Intl` en el idioma del documento (`<html lang>`).

## Accesibilidad

- Barra `role="group"` con nombre; el chip aplicado son **dos botones** con nombre completo («Editar filtro: …», «Quitar filtro: …»).
- Editor: diálogo no modal con nombre («Filtrar por Total»); campos con nombre; error visible y anunciado, con `aria-invalid`.
- Foco visible del tema; controles de 44px con `pointer: coarse`.
- La casilla nativa del editor usa `accent-color: --g-color-primary-text` (DECISIONS #431 y #432): sin cambio visible con el tema por defecto; **4.21:1 o más** contra la superficie (medido por coco, [`design/lab/contraste-marcado/estilo.md`](../../../../../design/lab/contraste-marcado/estilo.md), tres motores) en el tema por defecto, lustre, spotify y uno con clave `primary` propia, claro y oscuro.

## Limitaciones conocidas

Sin grupos Y/O anidados (constructor de reglas), sin filtros guardados ni en la URL, sin reglas personalizadas. Sin verificar con lector de pantalla real, Firefox y Safari.

Fuentes: [`GFilterBar.meta.json`](./GFilterBar.meta.json) · Contrato: [`design/contracts/filter-bar.md`](../../../../../design/contracts/filter-bar.md) · Prototipo: [`design/lab/table/r02/`](../../../../../design/lab/table/r02/)
