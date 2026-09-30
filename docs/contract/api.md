# API compartida de props

**Dueño:** lima. Todos los componentes `g-*` que rendericen un control usan estos nombres y valores. Se incluyen solo las props que apliquen; nunca se renombran ni se inventan sinónimos.

| Prop | Tipo | Valores | Default | Nota |
| --- | --- | --- | --- | --- |
| `color` | String | `brand` `accent` `neutral` `success` `warning` `danger` `info` | según componente (`GBtn`: `brand`) | Semántico, nunca hex. Lee `--g-color-<valor>` y sus derivados. En `GDatePicker` es el color de la selección (círculo y franja), no del foco. En `GSidebar`, el relleno de la píldora activa del navbar y de los indicadores (el activo del sidebar es neutro) |
| `variant` | String | `solid` `soft` `outline` `ghost` `link` | según componente | `solid` usa base + `on`; `soft` usa `soft` + `on-soft`; `outline`, `ghost` y `link` usan `text`. Un componente puede aceptar un subconjunto (`GInput`, `GTextarea` y `GSelect`: `outline` y `soft`; `GBadge`: `solid`, `soft`, `outline` y `glass`, con `glass` fuera de la lista compartida: es el cristal, `tokens.md` §12; `GDatePicker`: `outline` y `soft`, solo el campo; `GSidebar`: `fixed` y `floating`, fuera de la lista compartida: es la forma de la superficie; `GWidget`, `GWidgetGrid`, `GWidgetGallery`, `GWidgetConfig`, `GMenu`, `GStepper` y las primitivas no tienen `variant`; `GSurface` usa `level`) y rechaza el resto con su validador |
| `size` | String | `xs` `sm` `md` `lg` `xl` | `md` | Altura desde `space` (ver contrato de tokens §4). `GBadge` acepta solo `sm` `md` `lg` (una insignia no es un control). `GDialog` acepta solo `sm` `md` `lg` y los usa para el **ancho** de la carcasa (400, 560 y 760px con `space` 4) |
| `density` | String | `default` `comfortable` `compact` | `default` | Multiplica altura, padding y gap (en `GWidget` y `GWidgetGrid`, relleno y separación; en `GWidgetGallery` y `GWidgetConfig`, como `GDialog`): 1×, 0.875×, 0.75×, con piso de 24px. No cambia la tipografía. `GDialog` la aplica al relleno y la separación de carcasa e inset. `GCalendar` usa `compact` `comfortable` `spacious` (altura de una hora de 11, 15 o 20 unidades de `space`), porque no multiplica un control |
| `rounded` | String | `none` `xs` `sm` `md` `lg` `xl` `pill` | según rol y `shape` del tema | La instancia gana sobre el tema |
| `block` | Boolean | | `false` | Ancho completo |
| `disabled` | Boolean | | `false` | `disabled` nativo, o `aria-disabled` si debe seguir enfocable |
| `readonly` | Boolean | | `false` | Solo controles de entrada (`GDatePicker`: el campo es enfocable y no abre; en `inline`, navegable sin elegir; `GInput`, `GTextarea`: atributo nativo; `GSelect`: `aria-readonly`, enfocable y no abre). En `GCheckbox` y `GSwitch` (el `<input type="checkbox">` no admite `readonly` nativo): `aria-readonly="true"` y el cambio se bloquea; la casilla sigue enfocable |
| `loading` | Boolean | | `false` | Bloquea la acción, `aria-busy="true"`, no cambia el tamaño. En **controles de entrada** (`GInput`, `GTextarea`, `GSelect`, `GSwitch`) solo muestra el indicador y `aria-busy`: no bloquea la escritura ni el cambio (un guardado asíncrono se revierte desde el consumidor). En `GDialog`: `aria-busy="true"` en la carcasa y `is-loading`; no bloquea nada. En `GCalendar`: conserva la estructura y muestra esqueleto de filas, nunca reemplaza la pantalla |
| `modelValue` | según componente | | | Con `update:modelValue`. En `GSidebar`: el `id` del destino actual. En `GWidgetGallery` y `GWidgetConfig`: Boolean, hoja abierta (como `GDialog`). En `GMenu`: Boolean, menú abierto. En `GDatePicker`: ISO `YYYY-MM-DD` (`single`) o `{ start, end }` (`range`); solo se emiten valores completos |

## Reglas

- Cada prop enumerada declara `validator` con su lista.
- Defaults de objeto o array como función.
- Clases de estado: `g-<tag>--color-*`, `--variant-*`, `--size-*`, `--density-*`, `--rounded-*`, `--block`, `is-disabled`, `is-loading`.
- Sin estilos en línea, salvo variables CSS dinámicas justificadas.

## Patrón (JS)

```js
const oneOf = (list) => (v) => list.includes(v)

export const sharedProps = {
  color: { type: String, default: 'brand', validator: oneOf(['brand', 'accent', 'neutral', 'success', 'warning', 'danger', 'info']) },
  variant: { type: String, default: 'solid', validator: oneOf(['solid', 'soft', 'outline', 'ghost', 'link']) },
  size: { type: String, default: 'md', validator: oneOf(['xs', 'sm', 'md', 'lg', 'xl']) },
  density: { type: String, default: 'default', validator: oneOf(['default', 'comfortable', 'compact']) },
  rounded: { type: String, default: undefined, validator: oneOf(['none', 'xs', 'sm', 'md', 'lg', 'xl', 'pill']) },
  block: Boolean,
  disabled: Boolean,
  loading: Boolean,
}
```

## Patrón (CSS, lo escribe coco)

La variante solo reasigna a qué token apunta el componente; el esqueleto tiene una sola regla por propiedad.

```css
.g-btn {
  background: var(--_btn-bg);
  color: var(--_btn-fg);
  border-radius: var(--_btn-radius);
}
.g-btn--color-brand.g-btn--variant-solid {
  --_btn-bg: var(--g-color-brand);
  --_btn-fg: var(--g-color-on-brand);
}
```

Las variables `--_*` son alias locales del componente, no tokens del tema: no se documentan en el contrato global. El prefijo `--g-` queda reservado para tokens del contrato, incluidos los tokens de componente como `--g-btn-radius` cuando lima los apruebe.
