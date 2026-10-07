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
- **El avance en `{color}-text`** (DECISIONS #439): el relleno es el valor y, con `showValue` en `false`, lo único visible; como no lleva nada `on-{color}` encima, se pinta entero con `--g-color-{color}-text` (el componente gana la variable interna `--_text`). La pista no cambia. Sin cambio visible con el tema por defecto, claro y oscuro (0 píxeles distintos, tres motores). Contra la pista y la superficie, el avance llega a **4.21:1 o más** (medido por coco, [`design/lab/contraste-marcado/estilo.md`](../../../../../design/lab/contraste-marcado/estilo.md), tres motores) en el tema por defecto, lustre, spotify y uno con clave `primary` propia, claro y oscuro (4.21:1 con `brand` y 4.29:1 con `accent` en spotify claro; 4.53:1 con `warning` en primary oscuro), también con un 2 % de avance y sin valor; antes eran 1.20:1 y 1.64:1.
- `valueText` lo compones tú (idioma y formato).

## Fuentes

API: [`GProgress.meta.json`](./GProgress.meta.json) · Contrato: [`design/contracts/widget.md`](../../../../../design/contracts/widget.md) · Auditoría: [`design/lab/widget/auditoria.md`](../../../../../design/lab/widget/auditoria.md)
