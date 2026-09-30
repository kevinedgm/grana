# GDataList

Primitiva de widget: una **lista compacta de pares etiqueta–valor**. Con `swatches` sirve de **leyenda** de un gráfico. Sirve dentro de [`GWidget`](../GWidget/README.md), pero funciona en cualquier sitio.

**Etiqueta:** `<g-data-list>` · **Estado:** `candidate` · **Desde:** 0.1.0

```vue
<g-data-list swatches label="Por canal" :rows="[
  { label: 'Directo', value: '48%' },
  { label: 'Búsqueda', value: '31%' },
  { label: 'Referidos', value: '21%' }
]" />
```

## Props

| Prop | Tipo | Valores | Por defecto |
| --- | --- | --- | --- |
| `rows` | Array | `[{ label, value, swatch? }]` (una fila sin `label` se ignora y avisa) | `[]` |
| `label` | String | nombre accesible de la lista | sin valor |
| `swatches` | Boolean | muestra las muestras de la leyenda | `false` |

## Muestras

Con `swatches`, cada muestra es un **par tono + forma** de una secuencia fija de cuatro (círculo, cuadrado, rombo, triángulo, como las figuras de `GBadge`), para no depender solo del color. Por defecto se asignan en orden cíclico (0 a 3); una fila puede fijar `swatch` (0 a 3) para coincidir con su serie en tu gráfico. Son decorativas (`aria-hidden`).

## Accesibilidad

`<ul>` con `<li>`; las filas largas se recortan con elipsis y el texto completo sigue en el DOM.

## Fuentes

API: [`GDataList.meta.json`](./GDataList.meta.json) · Contrato: [`design/contracts/widget.md`](../../../../../design/contracts/widget.md) · Auditoría: [`design/lab/widget/auditoria.md`](../../../../../design/lab/widget/auditoria.md)
