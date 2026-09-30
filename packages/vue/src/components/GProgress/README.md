# GProgress

Primitiva de widget: una **barra de progreso** con nombre, valor y texto propios. Sirve dentro de [`GWidget`](../GWidget/README.md), pero funciona en cualquier sitio.

**Etiqueta:** `<g-progress>` · **Estado:** `candidate` · **Desde:** 0.1.0

```vue
<g-progress :value="72" label="Meta mensual" value-text="72 %" color="success" />
```

## Props

| Prop | Tipo | Valores | Por defecto |
| --- | --- | --- | --- |
| `value` | Number | de `0` a `max` (se recorta) | `0` |
| `max` | Number | mayor que 0 | `100` |
| `label` | String | nombre accesible (**obligatorio**; avisa en desarrollo) | sin valor |
| `valueText` | String | texto del valor («72 %»); si falta, el porcentaje | el porcentaje |
| `color` | String | `brand` `accent` `neutral` `success` `warning` `danger` `info` | `brand` |
| `size` | String | `sm` `md` | `md` |
| `showValue` | Boolean | muestra el valor junto a la etiqueta | `true` |

## Accesibilidad

- `role="progressbar"` con `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `aria-valuetext` y `aria-label`.
- **El valor va en texto**, no solo en la barra: la pista vacía es decoración (1.08:1 con el tema por defecto) y el relleno tiene 15:1.
- `valueText` lo compones tú (idioma y formato).

## Fuentes

API: [`GProgress.meta.json`](./GProgress.meta.json) · Contrato: [`design/contracts/widget.md`](../../../../../design/contracts/widget.md) · Auditoría: [`design/lab/widget/auditoria.md`](../../../../../design/lab/widget/auditoria.md)
