# Contrato · GInput

**Dueño:** lima · **Estado:** aprobado · **Basado en:** `design/lab/input/r01/` (kiwi)
**Tag:** `g-input` · **Categoría:** entradas

Campo completo de una línea: etiqueta, ayuda, error, iconos, contador y (en `password`) botón para mostrar u ocultar. Alcance decidido por el usuario (DECISIONS.md #27 y #28).

## Props

| Prop | Tipo | Valores | Default | Origen |
| --- | --- | --- | --- | --- |
| `modelValue` | String | | `''` | compartida |
| `variant` | String | `outline` `soft` | `outline` | compartida (subconjunto: DECISIONS.md #28) |
| `size` | String | `xs` `sm` `md` `lg` `xl` | `md` | compartida |
| `density` | String | `default` `comfortable` `compact` | `default` | compartida |
| `color` | String | `brand` `accent` `neutral` `success` `warning` `danger` `info` | sin valor: usa `--g-color-focus` | compartida (ver "Reglas") |
| `rounded` | String | `none` `xs` `sm` `md` `lg` `xl` `pill` | sin valor: `sm` (campo, `tokens.md` §3) | compartida |
| `block` | Boolean | | `false` | compartida |
| `disabled` | Boolean | | `false` | compartida |
| `readonly` | Boolean | | `false` | compartida |
| `loading` | Boolean | | `false` | compartida (precisada en `api.md`) |
| `type` | String | `text` `email` `password` `search` `tel` `url` | `text` | propia |
| `label` | String | texto libre | sin valor | propia |
| `hint` | String | texto libre | sin valor | propia |
| `error` | String | texto libre | sin valor | propia |
| `required` | Boolean | | `false` | propia |
| `counter` | Boolean | | `false` | propia |
| `showPasswordLabel` | String | texto libre | sin valor | propia |
| `hidePasswordLabel` | String | texto libre | sin valor | propia |
| `id` | String | | generado | propia |

### Reglas de props

- **`modelValue`:** siempre `String`; el campo no convierte tipos.
- **`variant`:** `outline` (caja con borde) y `soft` (caja rellena con `surface-sunken`). Cualquier otro valor lo rechaza el validador.
- **`color`:** solo colorea el anillo de foco y el borde mientras el campo tiene el foco. Sin valor, el foco usa `--g-color-focus`. **No** colorea el estado de error: el error usa siempre `danger`.
- **`rounded`:** sin valor, el radio es `--g-radius-sm` (paso por rol de `tokens.md` §3). `shape: "pill"` **no** afecta a los campos; solo la instancia con `rounded="pill"`.
- **`label`:** el campo exige nombre accesible. Sin `label`, sin slot `label` y sin `aria-label` ni `aria-labelledby` (en `$attrs`), en desarrollo se emite `console.warn`. En producción no hay advertencia.
- **`error`:** si tiene valor (cadena no vacía) el campo está en estado inválido: `aria-invalid="true"` en el `<input>`, clase `is-invalid`, mensaje visible. Vacío o sin valor: válido. **El campo no valida**: el consumidor decide cuándo hay error.
- **`hint`:** texto de ayuda visible siempre que exista.
- **`required`:** pone el atributo nativo `required` en el `<input>` y una marca visual `aria-hidden` junto a la etiqueta. El campo no bloquea el envío; lo hace el formulario nativo.
- **`counter`:** con `counter` y un `maxlength` recibido en `$attrs`, muestra `n/máx`. Sin `maxlength` no se muestra y, en desarrollo, se emite `console.warn`.
- **`type="password"`:** el botón mostrar/ocultar solo se renderiza si se dan **`showPasswordLabel` y `hidePasswordLabel`**. Sin valor por defecto, porque Grana es internacional (mismo criterio que `loadingText` de `GBtn`). Si faltan, en desarrollo se emite `console.warn` y el campo funciona sin botón.
- **`id`:** si no se da, el componente genera uno estable; de él derivan los ids de ayuda y error.
- **`loading`:** muestra el indicador y pone `aria-busy="true"` en el `<input>`. **No bloquea la escritura.**
- **`disabled`:** atributo nativo `disabled` en el `<input>`; sin foco, sin envío.
- **`readonly`:** atributo nativo `readonly`; enfocable, seleccionable y se envía.
- **Resto de atributos** (`name`, `placeholder`, `maxlength`, `autocomplete`, `inputmode`, `pattern`, `minlength`, `aria-*`, escuchas de eventos): van al `<input>`, **no** a la raíz. `class` y `style` van a la raíz. Por eso el componente usa `inheritAttrs: false`.

## Estructura accesible

```html
<div class="g-input …">
  <label class="g-input__label" for="ID">Correo<span class="g-input__required" aria-hidden="true">*</span></label>
  <div class="g-input__control">
    <span class="g-input__prepend" aria-hidden="true">…</span>
    <input class="g-input__field" id="ID" aria-describedby="ID-hint ID-error" aria-invalid="true" aria-busy="true" required …>
    <span class="g-input__append" aria-hidden="true">…</span>
    <span class="g-input__loader" aria-hidden="true"></span>
    <button class="g-input__toggle" type="button" aria-pressed="false" aria-controls="ID" aria-label="Mostrar contraseña">…</button>
  </div>
  <div class="g-input__messages">
    <span class="g-input__hint" id="ID-hint">Te enviaremos el comprobante.</span>
    <span class="g-input__counter" aria-hidden="true">0/40</span>
  </div>
  <div class="g-input__error" id="ID-error" aria-live="polite">Falta el dominio del correo.</div>
</div>
```

- La etiqueta se asocia con `for`/`id`; nunca se sustituye por `placeholder`.
- `aria-describedby` lista `ID-hint` si hay ayuda e `ID-error` solo mientras hay error.
- La región `ID-error` (`aria-live="polite"`) **se renderiza siempre**, vacía mientras no hay error, para que el anuncio sea fiable (WCAG 4.1.3). El error se muestra con texto y una **señal no cromática** (marca y estilo de borde distinto); nunca solo con color (WCAG 1.4.1).
- El botón mostrar/ocultar va **después** del `<input>` en el orden de tabulación; alterna `type` entre `password` y `text`, `aria-pressed` y su nombre (`hidePasswordLabel` cuando la contraseña está visible, `showPasswordLabel` cuando está oculta). El foco se conserva en el botón.
- Iconos de los slots `prepend` y `append`: envueltos con `aria-hidden="true"`. El contador también es `aria-hidden`.
- **Altura real ≥ 44px con `pointer: coarse`**, sin importar `density`: la caja es el objetivo táctil; no se usa pseudo-elemento porque se solaparía con el mensaje y con los campos vecinos. Fuera de `coarse`, la altura sale de la tabla de tamaños (`tokens.md` §4) con piso de 24px.
- El anillo de foco rodea la **caja completa** (`:has(.g-input__field:focus-visible)`, escrito por coco), no el `<input>` interior. El botón mostrar/ocultar tiene su propio anillo.

## Eventos

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `update:modelValue` | `String` | El usuario cambia el valor (evento `input` nativo) |

**Nota para bruno:** los demás eventos (`focus`, `blur`, `change`, `keydown`, `input`…) **no se declaran**: como los atributos van al `<input>` (`inheritAttrs: false`), las escuchas del consumidor llegan directamente al elemento nativo con su `Event` nativo. Solo `update:modelValue` va en `emits`.

## Slots

| Slot | Propósito | Anatomía que debe conservar |
| --- | --- | --- |
| `label` | Etiqueta con contenido rico (sustituye a `label`) | Dentro del `<label for>`; nunca elementos interactivos |
| `prepend` | Icono antes del texto | Decorativo: el componente lo envuelve con `aria-hidden="true"` |
| `append` | Icono después del texto | Igual que `prepend`; va antes del indicador de carga y del botón mostrar/ocultar |
| `hint` | Ayuda con contenido rico (sustituye a `hint`) | Conserva el `id` `ID-hint` |
| `error` | Mensaje de error con contenido rico | Solo se muestra si `error` tiene valor; conserva el `id` `ID-error` y la región viva |

## Tokens consumidos

| Token | Para qué |
| --- | --- |
| `--g-color-surface` | Fondo de la caja (`outline`) |
| `--g-color-surface-sunken` | Fondo de la caja (`soft`) |
| `--g-color-border-control` | Borde de la caja en reposo (≥ 3:1) |
| `--g-color-text` | Texto escrito y etiqueta |
| `--g-color-text-muted` | Texto de ayuda y contador |
| `--g-color-text-subtle` | `placeholder`, iconos y estado `disabled` |
| `--g-color-danger-text` | Texto, marca y borde del error |
| `--g-color-focus` | Anillo de foco sin `color` |
| `--g-color-{color}-text` | Anillo y borde en foco con `color` |
| `--g-radius-{rounded}`, `--g-radius-sm` | Esquinas |
| `--g-space-1` | Unidad para altura (6, 7, 9, 11 y 13 unidades), padding y separación |
| `--g-font-ui` | Familia |
| `--g-text-caption-size` (`xs`), `--g-text-body-sm-size` (`sm`, `md`), `--g-text-body-size` (`lg`, `xl`) | Tamaño del texto escrito |
| `--g-text-caption-size`, `--g-text-caption-line` | Ayuda, error y contador |
| `--g-text-body-sm-size`, `--g-text-action-weight` | Etiqueta |
| `--g-border-width`, `--g-focus-width`, `--g-focus-offset` | Borde y foco |
| `--g-duration-fast`, `--g-ease-standard`, `--g-duration-spin` | Transición de borde y fondo; giro del indicador de carga |

**Tokens nuevos:** ninguno. Todo sale del contrato vigente. Si coco necesita uno al escribir el CSS (por ejemplo, para el estado deshabilitado), lo pide aquí y lo agrego a `docs/contract/tokens.md` antes de usarlo.

## Clases (contrato entre bruno y coco)

Bruno las emite; coco las estiliza. Ninguno usa otras.

| Clase | Elemento | Cuándo |
| --- | --- | --- |
| `g-input` | Raíz (`div`) | Siempre |
| `g-input--variant-{variant}` | Raíz | Siempre (incluido el defecto) |
| `g-input--size-{size}` | Raíz | Siempre |
| `g-input--density-{density}` | Raíz | Siempre |
| `g-input--color-{color}` | Raíz | Solo si el prop tiene valor |
| `g-input--rounded-{rounded}` | Raíz | Solo si el prop tiene valor |
| `g-input--block` | Raíz | `block` |
| `is-disabled` | Raíz | `disabled` |
| `is-readonly` | Raíz | `readonly` |
| `is-invalid` | Raíz | `error` con valor |
| `is-loading` | Raíz | `loading` |
| `g-input__label` | `label` | Si hay `label` o slot `label` |
| `g-input__required` | `span` `aria-hidden` | `required` |
| `g-input__control` | Caja | Siempre |
| `g-input__prepend` / `g-input__append` | Envoltura del slot | Si hay slot |
| `g-input__field` | `<input>` | Siempre |
| `g-input__loader` | `span` `aria-hidden` | Solo con `loading` |
| `g-input__toggle` | `button` | `type="password"` con las dos etiquetas |
| `g-input__messages` | Contenedor de ayuda y contador | Si hay `hint`, slot `hint` o `counter` |
| `g-input__hint` | Ayuda | Si hay ayuda |
| `g-input__counter` | Contador | `counter` con `maxlength` |
| `g-input__error` | Región viva | Siempre presente |

## Teclado

| Tecla | Acción |
| --- | --- |
| Tab / Shift+Tab | Entra y sale en el orden del documento: `<input>` → botón mostrar/ocultar |
| Escritura, selección, portapapeles | Nativos del `<input>` |
| Enter / Espacio | En el botón mostrar/ocultar: alterna la visibilidad |

Sin manejadores de teclado propios.

## Resolución de hallazgos de r01

| # | Hallazgo | Resolución | Base |
| --- | --- | --- | --- |
| 1 | Textos traducibles del botón de contraseña | Props `showPasswordLabel` y `hidePasswordLabel`, sin valor por defecto; sin ellas no se renderiza el botón y se avisa en desarrollo. Los nombres siguen la convención de `loadingText` (camelCase con sufijo del rol); si el usuario prefiere otros, se renombran aquí y en el componente | Convención vigente; internacionalización |
| 2 | `loading` en un campo | Solo indicador y `aria-busy`; no bloquea la escritura. Precisado en `docs/contract/api.md` | Control y libertad del usuario |
| 3 | Cómo se entrega el error | Props `label`, `hint`, `error` y slots equivalentes. `error` con valor implica invalidez | WCAG 3.3.1; API simple para el caso común |
| 4 | `color` en un campo | Solo anillo de foco y borde en foco; el error usa siempre `danger` | El significado del error no debe cambiar con el tema |
| 5 | `variant` | `outline` y `soft`, decisión del usuario (DECISIONS.md #28) | Decisión del usuario |
| 6 | Atributos nativos fuera de la API compartida | `required` y `type` son props propias; el resto pasa al `<input>` por `$attrs` | El `<input>` nativo ya define su propia API |
| 7 | Contador | Prop `counter`; usa el `maxlength` recibido; sin `maxlength` no se muestra | Sin límite no hay contador que mostrar |
| 8 | `id` para enlazar etiqueta, ayuda y error | Generado y estable; se puede pasar `id` | WCAG 1.3.1 |
| 9 | Altura real con `pointer: coarse` | ≥ 44px reales, sin importar `density` | `tokens.md` §7; un pseudo-elemento se solaparía |
| 10 | Tokens nuevos | Ninguno | Todo sale de tokens vigentes |

## Abierto (no bloquea el paso siguiente)

- **Lector de pantalla real:** confirmar que `aria-describedby` y la región `aria-live` juntos no duplican el anuncio del error al enfocar. Si duplican, se quita `aria-live` y el error se anuncia solo por `aria-describedby`, más un anuncio al aparecer.
- **Estado deshabilitado sin token propio:** coco decide cómo se ve con tokens vigentes (`text-subtle`, `surface-sunken`); si no alcanza, pide token.
