# GCheckbox

Casilla de verificación. Usa el `<input type="checkbox">` nativo, con estado mixto, ayuda, error y tres estructuras: la casilla clásica, una **tarjeta** y un **chip**. Para agrupar casillas, con casilla maestra y conteo, ver [`GCheckboxGroup`](../GCheckboxGroup/README.md).

**Etiqueta:** `<g-checkbox>` · **Estado:** `candidate` (auditoría de coco aprobada; ver [`design/lab/checkbox/auditoria.md`](../../../../../design/lab/checkbox/auditoria.md)) · **Desde:** 0.1.0

> `@grana/vue` está en la versión 0.0.0 y aún no se publica. Por ahora se usa desde el repositorio (ver el playground en `packages/vue/playground/`). Exige Vue `^3.5.0` (usa `useId`).

## Uso

```js
import { createApp } from 'vue'
import Grana from '@grana/vue'
import '@grana/vue/style.css'

createApp(App).use(Grana).mount('#app')
```

```vue
<g-checkbox v-model="acepto" label="Acepto los términos" required :error="errorTerminos" />
```

Los atributos nativos (`name`, `form`, `aria-*`, `data-*`, escuchas como `@change`) van al `<input>`; solo `class` y `style` van a la raíz. Una escucha `@change` ya ve el `v-model` actualizado, igual que con un `<input v-model>` nativo.

> **En plantillas dentro del HTML** (sin compilar), Vue no admite etiquetas de componente autocerradas: escribe `<g-checkbox ...></g-checkbox>`.

## Props

| Prop | Tipo | Valores | Por defecto |
| --- | --- | --- | --- |
| `modelValue` (`v-model`) | Boolean \| Array | | `false` |
| `value` | String \| Number | | sin valor |
| `indeterminate` | Boolean | | `false` |
| `layout` | String | `default` `card` `chip` | `default` |
| `size` | String | `xs` `sm` `md` `lg` `xl` | `md` |
| `density` | String | `default` `comfortable` `compact` | `default` |
| `color` | String | `brand` `accent` `neutral` `success` `warning` `danger` `info` | `brand` |
| `disabled` | Boolean | | `false` |
| `readonly` | Boolean | | `false` |
| `required` | Boolean | | `false` |
| `label` | String | | sin valor |
| `hint` | String | | sin valor |
| `error` | String | | sin valor |
| `id` | String | | generado |

Un valor fuera de la lista muestra una advertencia en desarrollo. No hay prop `variant`: la estructura se elige con `layout`.

- **`v-model` y `value`:** sin `value`, el modelo es un booleano. Con `value`, es un **arreglo**: la casilla está marcada si lo contiene, y al alternar se emite un arreglo nuevo con el valor agregado o quitado (como el `v-model` de un `<input type="checkbox">` nativo).
- **`indeterminate`:** estado mixto. El componente lo aplica a la **propiedad** del DOM (no existe como atributo HTML), y los lectores de pantalla lo anuncian como "mixta". Al activar una casilla mixta pasa a marcada y se emite `update:indeterminate` con `false`; si no actualizas el prop, la casilla vuelve a verse mixta.
- **`color`:** color del relleno de lo marcado (y de la tarjeta o el chip seleccionados). El error usa siempre `danger`.
- **`readonly`:** el input nativo no admite `readonly`. El componente pone `aria-readonly="true"`, cancela el cambio (con ratón y con Espacio) y no emite nada; la casilla sigue enfocable.
- **`required`:** atributo nativo `required` y una marca visual junto a la etiqueta. El envío lo valida el formulario nativo.
- **`label`:** el componente necesita un nombre accesible. Sin `label`, sin slot `label` y sin `aria-label` ni `aria-labelledby`, en desarrollo se emite `console.warn`.
- **`error`:** con texto, la casilla queda inválida (`aria-invalid="true"`) y se muestra el mensaje. **El componente no valida:** tú decides cuándo hay error.
- **`hint`:** texto de ayuda. En `card` es la descripción de la tarjeta.

```vue
<!-- estado mixto controlado -->
<g-checkbox v-model="todas" :indeterminate="algunas" label="Todas las opciones" @update:indeterminate="algunas = $event" />

<!-- arreglo de valores -->
<g-checkbox v-model="extras" value="envio" label="Envío express" />
<g-checkbox v-model="extras" value="garantia" label="Garantía extendida" />
```

## Estructuras (`layout`)

- **`default`:** cuadro y texto en fila. La **fila completa** es el objetivo de toque (24px como mínimo; 44px con puntero grueso).
- **`card`:** toda la tarjeta es el control, con el cuadro, un icono decorativo, el título, la descripción (`hint`) y un dato destacado. Seleccionada, el borde se engrosa, el fondo se suaviza y el icono se rellena con el color.
- **`chip`:** un chip con forma de píldora. Marcado, muestra un icono `check` de Lucide que se desliza desde la izquierda y se rellena. Sigue siendo una casilla: Espacio la alterna.

```vue
<g-checkbox v-model="extras" value="express" layout="card" label="Envío express" hint="Llega en 24 horas.">
  <template #icon><svg …/></template>
  <template #meta>$99</template>
</g-checkbox>

<g-checkbox v-model="filtros" value="wifi" layout="chip" label="Wifi" />
```

No pongas botones, enlaces ni campos dentro de una casilla (`label`, `hint`, `meta`): un contenido interactivo dentro de un `<label>` rompe el control.

## Eventos

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `update:modelValue` | `Boolean` o `Array` | El usuario alterna la casilla (no con `readonly`) |
| `update:indeterminate` | `false` | El usuario activa una casilla indeterminada |

Los demás eventos (`focus`, `blur`, `change`, `keydown`…) no se declaran: tus escuchas reciben el evento nativo del `<input>`.

## Slots

| Slot | Contenido |
| --- | --- |
| `label` | Etiqueta con contenido rico (sustituye a `label`) |
| `hint` | Ayuda o descripción con contenido rico (sustituye a `hint`) |
| `error` | Mensaje de error con contenido rico; solo se muestra si `error` tiene valor |
| `icon` | Icono de la tarjeta. Solo con `layout="card"`. Decorativo: el componente lo marca con `aria-hidden="true"` |
| `meta` | Dato destacado de la tarjeta (precio, plazo). Solo con `layout="card"`. Forma parte del nombre accesible |

Grana no trae iconos: usa el SVG o el componente de icono que prefieras; el playground usa SVG de [Lucide](https://lucide.dev).

## Accesibilidad

- **Control nativo:** un `<input type="checkbox">`, dibujado con `appearance: none`. Teclado (Espacio), foco, formularios y estado los resuelve el navegador. Enter **no** alterna una casilla (comportamiento nativo).
- **Nombre:** la etiqueta se asocia con `for`/`id` y `aria-labelledby`. En la tarjeta, el nombre es **título + dato destacado**; la descripción va aparte, como descripción (`aria-describedby`).
- **Ayuda y error:** se enlazan con `aria-describedby`. La región del error existe siempre (vacía si no hay error), está fuera del `<label>` y es `aria-live="polite"`.
- **El estado no depende solo del color:** la marca cambia de forma (los iconos `check` o `minus` de Lucide), el chip muestra `check`, la tarjeta cambia el grosor del borde y el error lleva un icono `triangle-alert` que los lectores no leen.
- **Foco:** anillo de `--g-focus-width` alrededor del cuadro (en tarjeta y chip, alrededor de toda la pieza), con transición de apertura.
- **Área táctil:** con `pointer: coarse`, la fila mide al menos 44px reales y el texto también activa la casilla. El cuadro sigue pequeño y centrado.
- **Contraste:** con el tema por defecto y con el de prueba de la auditoría, texto, ayuda y error llegan a 4.5:1 o más; el borde del cuadro y el contorno del chip, a 3:1 o más (3.45:1 con el tema por defecto); la marca sobre el relleno, a 5:1 o más.

## Movimiento

- **La marca se revela:** el icono `check` de Lucide se revela de izquierda a derecha y la raya mixta se abre desde el centro (`--g-duration-press`, `--g-ease-out`).
- **Pulsar:** el cuadro se hunde un poco (`--g-press-scale`), igual que el botón.
- **Foco:** el anillo se abre desde el borde hasta su separación.
- **Cambio de color:** en `--g-duration-fast`.
- Con `prefers-reduced-motion: reduce` se quitan todas las transiciones y la marca aparece de golpe.

## Tema

El componente solo lee tokens `--g-*`. A diferencia de los campos, **`brand` sí cambia las casillas** (es el relleno de lo marcado por defecto). Ejemplo:

```css
:root {
  --g-color-primary: #0b1f4d;          /* relleno de lo marcado */
  --g-color-primary-strong: #1e3464;   /* al pasar el ratón */
  --g-color-border-control: #5b6b8c; /* borde del cuadro y del chip sin marcar */
  --g-radius-xs: 2px;                /* esquinas del cuadro */
}
```

Tokens que consume: `--g-color-surface`, `--g-color-surface-sunken`, `--g-color-border-control`, `--g-color-border-strong`, `--g-color-{color}` (y `-strong`, `-soft`, `-text`), `--g-color-on-{color}` (y `-soft`), `--g-color-text`, `--g-color-text-muted`, `--g-color-text-subtle`, `--g-color-danger-text`, `--g-color-focus`, `--g-radius-xs`, `--g-radius-md`, `--g-radius-lg`, `--g-radius-pill`, `--g-space-1..6`, `--g-font-ui`, `--g-text-{caption|body-sm|body}-{size|line}`, `--g-text-action-weight`, `--g-border-width`, `--g-focus-width`, `--g-focus-offset`, `--g-duration-fast`, `--g-duration-press`, `--g-ease-standard`, `--g-ease-out`, `--g-press-scale`. La definición de cada uno está en `docs/contract/tokens.md`. El cuadro mide `--g-space-1` × 4, 4, 5, 6 y 7 según el tamaño (con espacio 4: 16, 16, 20, 24 y 28px).

## Clases

Las emite el componente y las estiliza `GCheckbox.css`: `g-checkbox`, `g-checkbox--layout-*`, `g-checkbox--size-*`, `g-checkbox--density-*`, `g-checkbox--color-*`, `is-disabled`, `is-readonly`, `is-invalid`, y los elementos `g-checkbox__row`, `g-checkbox__input`, `g-checkbox__icon`, `g-checkbox__text`, `g-checkbox__label`, `g-checkbox__required`, `g-checkbox__hint`, `g-checkbox__meta` y `g-checkbox__error`. Marcada y mixta se estilizan con `:checked` e `:indeterminate`, sin clases propias.

## Limitaciones conocidas

- **Marca dibujada solo verificada en Chromium.** Se dibuja en el `::after` del `<input>` con `appearance: none`, un patrón común; conviene revisarlo en Firefox y Safari.
- **Sin detalle condicional** (una casilla que revela un bloque al marcarla): se compone con `v-if` y tu propio bloque. Ver DECISIONS.md #36.
- **Sin interruptor** (`GSwitch`) ni árbol de casillas anidadas.
- **Tarjeta:** el nombre es título + dato destacado y la descripción es aparte; el orden en que la anuncia cada lector varía.
- No hay tema oscuro todavía.
- **Sin verificar:** un lector de pantalla real (estado mixto, conteo del grupo, error, nombre de la tarjeta), las preferencias reales de `prefers-reduced-motion` y `forced-colors` (las reglas están escritas y se comprobaron aplicadas sin condición), el zoom al 200% y un dispositivo táctil real.

## Fuentes

- API: [`GCheckbox.meta.json`](./GCheckbox.meta.json) · Contrato: [`design/contracts/checkbox.md`](../../../../../design/contracts/checkbox.md) · Prototipo: [`design/lab/checkbox/r01/`](../../../../../design/lab/checkbox/r01/) · Auditoría: [`design/lab/checkbox/auditoria.md`](../../../../../design/lab/checkbox/auditoria.md)
