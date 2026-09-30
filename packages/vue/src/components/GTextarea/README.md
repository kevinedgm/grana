# GTextarea

Campo de texto de varias líneas, completo: etiqueta, ayuda, mensaje de error, contador con aviso hablado discreto y estados. Usa el `<textarea>` nativo y comparte el lenguaje de [`GInput`](../GInput/README.md): mismas variantes, tamaños, densidad, colores de foco y estados. Con `autosize`, la altura sigue al contenido.

**Etiqueta:** `<g-textarea>` · **Estado:** `candidate` (auditoría de coco aprobada; ver [`design/lab/textarea/auditoria.md`](../../../../../design/lab/textarea/auditoria.md)) · **Desde:** 0.1.0

> `@grana/vue` está en la versión 0.0.0 y aún no se publica. Por ahora se usa desde el repositorio (ver el playground en `packages/vue/playground/`). Exige Vue `^3.5.0` (usa `useId`).

## Uso

```js
import { createApp } from 'vue'
import Grana from '@grana/vue'
import '@grana/vue/style.css'

createApp(App).use(Grana).mount('#app')
```

```vue
<g-textarea v-model="comentario" label="Comentario" hint="Cuéntanos qué pasó." placeholder="Escribe aquí…"
            :error="errorComentario" @blur="validar" />
```

Los atributos nativos (`name`, `placeholder`, `maxlength`, `minlength`, `autocomplete`, `spellcheck`, `wrap`, `aria-*`, escuchas como `@blur`) van al `<textarea>`; solo `class` y `style` van a la raíz. Una escucha `@input` ya ve el `v-model` actualizado, igual que con un `<textarea v-model>` nativo.

> **En plantillas dentro del HTML** (sin compilar), Vue no admite etiquetas de componente autocerradas: escribe `<g-textarea ...></g-textarea>`.

## Props

| Prop | Tipo | Valores | Por defecto |
| --- | --- | --- | --- |
| `modelValue` (`v-model`) | String | | `''` |
| `variant` | String | `outline` `soft` | `outline` |
| `size` | String | `xs` `sm` `md` `lg` `xl` | `md` |
| `density` | String | `default` `comfortable` `compact` | `default` |
| `color` | String | `brand` `accent` `neutral` `success` `warning` `danger` `info` | sin valor (usa `--g-color-focus`) |
| `rounded` | String | `none` `xs` `sm` `md` `lg` `xl` `pill` | sin valor (`sm`) |
| `block` | Boolean | | `false` |
| `disabled` | Boolean | | `false` |
| `readonly` | Boolean | | `false` |
| `loading` | Boolean | | `false` |
| `rows` | Number | entero ≥ 1 | `3` |
| `autosize` | Boolean | | `false` |
| `maxRows` | Number | entero ≥ `rows` | sin valor (sin máximo) |
| `resize` | String | `none` `vertical` | `vertical` (`none` con `autosize`) |
| `label` | String | | sin valor |
| `hint` | String | | sin valor |
| `error` | String | | sin valor |
| `required` | Boolean | | `false` |
| `counter` | Boolean | | `false` |
| `counterText` | Function | `(nivel, máximo) => string` | sin valor |
| `id` | String | | generado |

Un valor fuera de la lista muestra una advertencia en desarrollo. `variant` solo admite `outline` y `soft`: `solid`, `ghost` y `link` no aplican a un campo.

- **`modelValue`:** siempre `String`.
- **`color`:** solo colorea el anillo de foco y el borde mientras el campo tiene el foco. El error usa siempre `danger`.
- **`rounded`:** sin valor, el radio es `--g-radius-sm`. En una caja de varias líneas, `pill` se limita a `--g-radius-lg` (una píldora completa recortaría el texto y el tirador).
- **`rows`:** altura **mínima** en líneas de texto. Con `rows` 1, el campo mide lo mismo que un `GInput` del mismo `size` y `density`. Un valor menor que 1 o no entero avisa en desarrollo y se usa 1.
- **`label`:** el campo necesita un nombre accesible. Sin `label`, sin slot `label` y sin `aria-label` ni `aria-labelledby`, en desarrollo se emite `console.warn`. La etiqueta nunca se sustituye por `placeholder`.
- **`error`:** con texto, el campo queda inválido (`aria-invalid="true"`) y se muestra el mensaje. **El componente no valida:** tú decides cuándo hay error.
- **`required`:** atributo nativo `required` y una marca visual `aria-hidden`. El envío lo valida el formulario nativo.
- **`loading`:** `aria-busy="true"` y un anillo en la esquina de la caja. **No bloquea la escritura.**
- **`disabled`** y **`readonly`:** atributos nativos. Un campo de solo lectura es enfocable, seleccionable y se envía.

## Altura: filas, `autosize` y tirador

- **Sin `autosize`:** la altura es fija (`rows`) y el usuario puede redimensionarla en **vertical** con el tirador nativo (`resize="vertical"`, por defecto). `resize="none"` lo quita. Nunca hay tirador horizontal.
- **Con `autosize`:** la altura sigue al contenido entre `rows` y `maxRows`. Sin `maxRows`, crece sin límite. Al llegar a `maxRows`, el propio `<textarea>` se desplaza (la raíz lleva `is-capped`); el texto nunca se oculta y el campo conserva el foco. No hay tirador y el cambio de altura **no se anima** (evita saltos al escribir).
- **`maxRows`** solo tiene efecto con `autosize`; sin él, o si es menor que `rows`, avisa en desarrollo.
- La altura se recalcula al escribir y ante cualquier cambio de tamaño (ancho, relleno o interlineado por el tema, carga de la fuente), y llega por la variable CSS dinámica `--_autoh`.

```vue
<g-textarea v-model="nota" autosize :rows="2" :max-rows="6" label="Nota" />
```

## Contador y aviso hablado

```vue
<g-textarea v-model="texto" counter maxlength="120" label="Descripción"
            :counter-text="(nivel, max) => nivel === 'limit' ? `Límite alcanzado: ${max} caracteres` : `Cerca del límite: máximo ${max} caracteres`" />
```

- **`counter`** con un `maxlength` en los atributos muestra `n/máx`. Sin `maxlength` no se muestra y, en desarrollo, hay `console.warn`. El límite lo aplica el `maxlength` nativo.
- **El contador visual es `aria-hidden`.** Para lectores de pantalla, `counterText` devuelve el texto de un aviso en una región `aria-live="polite"`.
- **`counterText` se llama solo al cambiar de nivel:** `near` al llegar al 90% del máximo (redondeado hacia arriba) y `limit` al llegar al máximo; al volver a un nivel inferior, el aviso se vacía. No se llama en cada tecla ni al montar. **Sin valor por defecto** (Grana es internacional); sin él no hay aviso hablado, solo el contador visual.
- **Usa un texto sin cifras que cambian al teclear:** el aviso no se repite mientras el usuario sigue escribiendo, así que "Quedan 12 caracteres" quedaría desactualizado.

## Eventos

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `update:modelValue` | `String` | El usuario cambia el valor (evento `input` nativo) |

Los demás eventos (`focus`, `blur`, `change`, `keydown`, `input`…) no se declaran: tus escuchas reciben el evento nativo del `<textarea>`.

## Slots

| Slot | Contenido |
| --- | --- |
| `label` | Etiqueta con contenido rico (sustituye a `label`) |
| `hint` | Ayuda con contenido rico (sustituye a `hint`) |
| `error` | Mensaje de error con contenido rico; solo se muestra si `error` tiene valor |

Sin prefijo, sufijo ni acción en v0.1. No pongas botones, enlaces ni campos dentro de la etiqueta, la ayuda ni el error.

## Accesibilidad

- **Control nativo:** un `<textarea>`; foco, valor, selección, portapapeles y formularios los resuelve el navegador. **Enter inserta un salto de línea**; enviar es decisión tuya.
- **Nombre:** la etiqueta se asocia con `for`/`id`.
- **Ayuda y error:** se enlazan con `aria-describedby` (se suman a uno tuyo si lo pasas). La región del error existe siempre (vacía si no hay error) y es `aria-live="polite"`. El aviso del contador es otra región viva aparte, también siempre presente, que **no** entra en `aria-describedby`.
- **El error no depende solo del color:** contorno de doble trazo y un icono `triangle-alert` de Lucide que los lectores no leen.
- **Foco:** anillo fino y pegado al borde de la caja, del grosor de `--g-focus-width`, con transición de color.
- **Área táctil:** con `pointer: coarse`, la caja mide al menos 44px reales aunque `rows` sea 1.
- **Contraste:** con el tema por defecto, el borde llega a 3.45:1 y el texto, a 4.5:1 o más; con el tema de prueba de la auditoría, 4.86:1 y 4.5:1 o más.
- **Texto largo:** la etiqueta, la ayuda, el error y el valor saltan de línea, incluso una palabra larguísima sin espacios.

## Tema

El componente solo lee tokens `--g-*`. Los campos **no** usan `brand` para su relleno: `brand` solo se nota si lo eliges como `color` del foco. Ejemplo:

```css
:root {
  --g-color-border-control: #5b6b8c; /* borde de la caja en reposo (≥ 3:1) */
  --g-color-surface: #fffbf2;        /* fondo (outline) */
  --g-color-surface-sunken: #f1ddb6; /* fondo (soft), solo lectura y deshabilitado */
  --g-radius-sm: 8px;                /* esquinas por defecto */
}
```

Tokens que consume: los mismos que `GInput` (ver [su README](../GInput/README.md#tema)), sin los del botón de acción ni de contraseña, más el interlineado del texto (`--g-text-{caption|body-sm|body}-line`). La altura de una fila sale de `--g-space-1` (6, 7, 9, 11 y 13 unidades para `xs` a `xl`, igual que `GInput`) y el relleno vertical se calcula desde ella; cada fila extra suma un interlineado.

## Clases

Las emite el componente y las estiliza `GTextarea.css`: `g-textarea`, `g-textarea--variant-*`, `g-textarea--size-*`, `g-textarea--density-*`, `g-textarea--color-*` y `--rounded-*` (solo si el prop tiene valor), `g-textarea--block`, `g-textarea--autosize`, `g-textarea--resize-*`, `is-capped`, `is-disabled`, `is-readonly`, `is-invalid`, `is-loading`, y los elementos `g-textarea__label`, `__required`, `__control`, `__field`, `__loader`, `__messages`, `__hint`, `__counter`, `__count-live` y `__error`.

## Limitaciones conocidas

- **Táctil y tamaño de texto:** con `pointer: coarse` la caja mide 44px, pero el texto conserva el tamaño del tema (14px por defecto); iOS Safari amplía la página al enfocar un campo con texto menor de 16px. `lg` y `xl` ya usan 16px.
- **Textos muy largos:** `autosize` mide en cada cambio; con miles de líneas puede notarse. Sin medir en v0.1.
- **Sin barra inferior, prefijo, sufijo ni acción**, y sin texto enriquecido.
- **Estilos globales sin capa ganan:** una regla global tuya sobre `label` o `p` (sin capa) gana al CSS de Grana (capa `grana.components`); acótala con un selector más específico.
- No hay tema oscuro todavía.
- **Sin verificar:** un lector de pantalla real (etiqueta, ayuda, error y el aviso del contador), las preferencias reales de `prefers-reduced-motion` y `forced-colors` (las reglas están escritas y se comprobaron aplicadas sin condición), Firefox y Safari (tirador y `:has()`), y un dispositivo táctil real.

## Fuentes

- API: [`GTextarea.meta.json`](./GTextarea.meta.json) · Contrato: [`design/contracts/textarea.md`](../../../../../design/contracts/textarea.md) · Prototipo: [`design/lab/textarea/r01/`](../../../../../design/lab/textarea/r01/) · Auditoría: [`design/lab/textarea/auditoria.md`](../../../../../design/lab/textarea/auditoria.md)
