# API compartida de props

**Dueño:** lima. Todos los componentes `g-*` que rendericen un control usan estos nombres y valores. Se incluyen solo las props que apliquen; nunca se renombran ni se inventan sinónimos.

| Prop | Tipo | Valores | Default | Nota |
| --- | --- | --- | --- | --- |
| `color` | String | `brand` `accent` `neutral` `success` `warning` `danger` `info` | según componente (`GBtn`: `brand`) | Semántico, nunca hex. Lee `--g-color-<valor>` y sus derivados |
| `variant` | String | `solid` `soft` `outline` `ghost` `link` | según componente | `solid` usa base + `on`; `soft` usa `soft` + `on-soft`; `outline`, `ghost` y `link` usan `text`. Un componente puede aceptar un subconjunto (`GInput`: `outline` y `soft`) y rechaza el resto con su validador |
| `size` | String | `xs` `sm` `md` `lg` `xl` | `md` | Altura desde `space` (ver contrato de tokens §4) |
| `density` | String | `default` `comfortable` `compact` | `default` | Multiplica altura, padding y gap: 1×, 0.875×, 0.75×, con piso de 24px. No cambia la tipografía |
| `rounded` | String | `none` `xs` `sm` `md` `lg` `xl` `pill` | según rol y `shape` del tema | La instancia gana sobre el tema |
| `block` | Boolean | | `false` | Ancho completo |
| `disabled` | Boolean | | `false` | `disabled` nativo, o `aria-disabled` si debe seguir enfocable |
| `readonly` | Boolean | | `false` | Solo controles de entrada |
| `loading` | Boolean | | `false` | Bloquea la acción, `aria-busy="true"`, no cambia el tamaño. En **controles de entrada** (`GInput`) solo muestra el indicador y `aria-busy`: no bloquea la escritura |
| `modelValue` | según componente | | | Con `update:modelValue` |

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
