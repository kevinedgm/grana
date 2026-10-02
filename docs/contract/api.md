# API compartida de props

**Dueño:** lima. Todos los componentes `g-*` que rendericen un control usan estos nombres y valores. Se incluyen solo las props que apliquen; nunca se renombran ni se inventan sinónimos.

| Prop | Tipo | Valores | Default | Nota |
| --- | --- | --- | --- | --- |
| `color` | String | `brand` `accent` `neutral` `success` `warning` `danger` `info` | según componente (`GBtn`: `brand`) | Semántico, nunca hex. Lee `--g-color-<valor>` y sus derivados. Los avisos (`GToast`) no tienen `color`: su `type` (`neutral` `info` `success` `warning` `error` `loading`) elige el semántico y `error` lee `danger` (como `status` de `GCard`). En `GDatePicker` es el color de la selección (círculo y franja), no del foco. En `GSidebar`, el relleno de la píldora activa del navbar y de los indicadores (el activo del sidebar es neutro) |
| `variant` | String | `solid` `soft` `outline` `ghost` `link` | según componente | `solid` usa base + `on`; `soft` usa `soft` + `on-soft`; `outline`, `ghost` y `link` usan `text`. Un componente puede aceptar un subconjunto (`GInput`, `GTextarea` y `GSelect`: `outline` y `soft`; `GBadge`: `solid`, `soft`, `outline` y `glass`, con `glass` fuera de la lista compartida: es el cristal, `tokens.md` §12; `GDatePicker`: `outline` y `soft`, solo el campo; `GSidebar`: `fixed` y `floating`, fuera de la lista compartida: es la forma de la superficie; `GWidget`, `GWidgetGrid`, `GWidgetGallery`, `GWidgetConfig`, `GMenu`, `GStepper`, `GPagination`, `GFilterBar`, `GTabs`, `GCard`, `GToaster` y las primitivas no tienen `variant`; `GSurface` y `GCard` usan `level` (`GCard`: `flat` `outlined` `raised` `inset`) y `GTable` y `GTabs`, `appearance`) y rechaza el resto con su validador |
| `size` | String | `xs` `sm` `md` `lg` `xl` | `md` | Altura desde `space` (ver contrato de tokens §4). `GBadge` acepta solo `sm` `md` `lg` (una insignia no es un control). `GDialog` acepta solo `sm` `md` `lg` y los usa para el **ancho** de la carcasa (400, 560 y 760px con `space` 4). En los campos es siempre la **altura**: el ancho de un campo dentro de una `GFormRow` se da con las clases `g-form-w-{xs\|sm\|md\|lg}` (peso + mínimo, `form.md` §4, #174), nunca con `size` |
| `density` | String | `default` `comfortable` `compact` | `default` | Multiplica altura, padding y gap (en `GWidget` y `GWidgetGrid`, relleno y separación; en `GWidgetGallery` y `GWidgetConfig`, como `GDialog`): 1×, 0.875×, 0.75×, con piso de 24px. No cambia la tipografía. `GDialog` la aplica al relleno y la separación de carcasa e inset. `GCard` la aplica al relleno (vía `GSurface`), la separación y el tamaño de la media lateral. `GCalendar` usa `compact` `comfortable` `spacious` (altura de una hora de 11, 15 o 20 unidades de `space`), porque no multiplica un control. `GForm` la **comparte** con los campos, `GFormLayout`, `GFormRow`, `GInputGroup`, secciones y pie que no traen la suya (`form.md`) y la aplica a `--g-form-gap`, `--g-form-column-gap` y `--g-form-section-gap` |
| `rounded` | String | `none` `xs` `sm` `md` `lg` `xl` `pill` | según rol y `shape` del tema | La instancia gana sobre el tema |
| `block` | Boolean | | `false` | Ancho completo. Dentro de `GFormLayout`, `GFormRow` o `GFieldGroup`, los campos son `block` por defecto (llenan su sitio; `form.md` §4); la prop explícita gana |
| `disabled` | Boolean | | `false` | `disabled` nativo, o `aria-disabled` si debe seguir enfocable |
| `readonly` | Boolean | | `false` | Solo controles de entrada (`GDatePicker`: el campo es enfocable y no abre; en `inline`, navegable sin elegir; `GInput`, `GTextarea`: atributo nativo; `GSelect`: `aria-readonly`, enfocable y no abre). En `GCheckbox` y `GSwitch` (el `<input type="checkbox">` no admite `readonly` nativo): `aria-readonly="true"` y el cambio se bloquea; la casilla sigue enfocable. **Aspecto único en todos los campos** (DECISIONS.md #165): contraste completo, fondo `neutral-soft` (#186), borde discontinuo, enfocable y seleccionable; nunca atenuado como `disabled`. `GForm readonly` lo aplica a todo el formulario. En `GInputGroup`, la parte de elección (`<select>` nativo, que no admite `readonly`) se pinta como texto de solo lectura con un campo oculto con el valor (#178) |
| `loading` | Boolean | | `false` | Bloquea la acción, `aria-busy="true"`, no cambia el tamaño. En **controles de entrada** (`GInput`, `GTextarea`, `GSelect`, `GSwitch`) solo muestra el indicador y `aria-busy`: no bloquea la escritura ni el cambio (un guardado asíncrono se revierte desde el consumidor). En `GDialog`: `aria-busy="true"` en la carcasa y `is-loading`; no bloquea nada. En `GCalendar`: conserva la estructura y muestra esqueleto de filas, nunca reemplaza la pantalla. En `GCard`: `aria-busy`, esqueleto con las regiones declaradas (prop `skeleton` o slot `loading`), sin controles enfocables |
| `modelValue` | según componente | | | Con `update:modelValue`. En `GSidebar`: el `id` del destino actual. En `GWidgetGallery` y `GWidgetConfig`: Boolean, hoja abierta (como `GDialog`). En `GMenu`: Boolean, menú abierto. En `GCard`: selección como el `<input>` nativo (Boolean, Array con `value`, o el valor elegido del grupo en `radio`). En `GDatePicker`: ISO `YYYY-MM-DD` (`single`) o `{ start, end }` (`range`); solo se emiten valores completos |

## Reglas

- **Contexto de formulario** (DECISIONS.md #158, `design/contracts/form.md` §2): dentro de `GForm`, los campos (`GInput`, `GTextarea`, `GSelect`, `GCheckbox`, `GCheckboxGroup`, `GSwitch`, `GDatePicker` y los propios con `useFormField()`) heredan `density`, `readonly`, `disabled`, `block` (en la rejilla) y su error por `name`. **La prop explícita siempre gana**; por eso esas props tienen default `undefined` en los campos y se resuelven a los defaults de esta tabla fuera de `GForm`.
- **Mensajes de campo** (#164): `error`, `warning` y `valid` (String) comparten una región viva `g-<tag>__message`, dentro del pie `g-<tag>__support` (r02, #176); solo `error` pone `aria-invalid`.
- **Estructura de campo en filas** (r02, #176): los campos que comparten línea en una `GFormRow` tienen tres hijos en flujo (etiqueta, caja, `__support`). **Valor calculado** (#180): prop `output` (String) en `GInput` y `GDatePicker`.

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

## Servicios imperativos (gestor + región)

Para lo que nace de un **evento** y no de un estado de la vista (primer caso: avisos, `design/contracts/toast.md`, DECISIONS.md #140), Grana no ofrece un componente declarativo ni una instancia global:

- `create<Servicio>(options)` crea **el gestor de la aplicación** (objeto con métodos y estado reactivo de solo lectura) y es **plugin de Vue** (`app.use(gestor)` lo provee con una `InjectionKey` exportada).
- `use<Servicio>()` lo inyecta; sin gestor provisto, aviso en desarrollo y `undefined`.
- Un componente `G<Servicio>` pinta **una** región del gestor (prop opcional con el gestor; por defecto, el inyectado).
- Las opciones usan los nombres compartidos cuando existen (`labels` sin valores por defecto, `position` lógica con `start`/`end`); los callbacks van en las opciones (`onDismiss`, `action.onClick`), no como eventos de la región.
- Importar el paquete y crear el gestor no toca `document` ni `window` (SSR).
