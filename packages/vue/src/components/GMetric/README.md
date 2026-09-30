# GMetric

Primitiva de widget: un **valor** con su etiqueta, unidad, **tendencia** y contexto. Sirve dentro de [`GWidget`](../GWidget/README.md), pero funciona en cualquier sitio.

**Etiqueta:** `<g-metric>` · **Estado:** `candidate` · **Desde:** 0.1.0

```vue
<g-metric label="Ingresos" value="$48.2k" unit="USD" trend="+12%" direction="up" trend-color="success" context="vs. mes anterior" size="lg" />
```

## Props

| Prop | Tipo | Valores | Por defecto |
| --- | --- | --- | --- |
| `label` | String | nombre del valor (**obligatorio**; avisa en desarrollo) | sin valor |
| `value` | String \| Number | **ya formateado por tu aplicación** | sin valor |
| `unit` | String | texto libre | sin valor |
| `trend` | String | **texto** de la tendencia («+12%») | sin valor |
| `direction` | String | `up` `down` `flat` | `flat` |
| `trendColor` | String | `brand` `accent` `neutral` `success` `warning` `danger` `info` | `neutral` |
| `context` | String | «vs. mes anterior» | sin valor |
| `size` | String | `sm` `md` `lg` | `md` |

## Accesibilidad

- **La tendencia nunca depende solo del color:** lleva un icono de Lucide (`arrow-up`, `arrow-down` o `minus`) y el texto. `direction` no dice si es bueno o malo: eso lo indica `trendColor` (una subida de costos puede ser `danger`).
- El valor no se anuncia como región viva; si cambia y quieres anunciarlo, hazlo desde tu aplicación.
- El color de la tendencia debe cumplir contraste de texto sobre la superficie (4.5:1); con el tema por defecto, 5.35:1.

## Fuentes

API: [`GMetric.meta.json`](./GMetric.meta.json) · Contrato: [`design/contracts/widget.md`](../../../../../design/contracts/widget.md) · Auditoría: [`design/lab/widget/auditoria.md`](../../../../../design/lab/widget/auditoria.md)
