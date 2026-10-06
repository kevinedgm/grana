# Contrato · GInput

**Dueño:** lima · **Estado:** aprobado · **Basado en:** `design/lab/input/r01/` y `design/lab/input/r02/` (kiwi)
**Tag:** `g-input` · **Categoría:** entradas

Campo completo de una línea: etiqueta, ayuda, error, iconos, contador y (en `password`) botón para mostrar u ocultar. Alcance decidido por el usuario (DECISIONS.md #27, #28, #33 y #34). Con el slot `action`, un `GBtn` queda acoplado al final de la caja (búsqueda, suscripción, cupón).

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
  <label class="g-input__label" id="ID-label" for="ID">Correo<span class="g-input__required" aria-hidden="true">*</span></label>   <!-- id: «Cambio por GNumberField» -->
  <div class="g-input__row">
  <div class="g-input__control">
    <span class="g-input__prepend" aria-hidden="true">…</span>
    <input class="g-input__field" id="ID" aria-describedby="ID-hint ID-error" aria-invalid="true" aria-busy="true" required …>
    <span class="g-input__append" aria-hidden="true">…</span>
    <span class="g-input__loader" aria-hidden="true"></span>
    <button class="g-input__toggle" type="button" aria-controls="ID">Mostrar contraseña</button>
  </div>
  <div class="g-input__action"><button class="g-btn …" type="submit">Suscribirse</button></div>  <!-- solo con el slot action -->
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
- El botón mostrar/ocultar va **después** del `<input>` en el orden de tabulación; alterna `type` entre `password` y `text` y su **texto visible**: `hidePasswordLabel` cuando la contraseña está visible, `showPasswordLabel` cuando está oculta. El texto visible es también su nombre accesible (sin `aria-label` aparte, así el nombre coincide con lo que se ve, WCAG 2.5.3). **Sin `aria-pressed`:** un botón cuyo nombre cambia con el estado no debe llevarlo, porque el lector diría "Ocultar contraseña, pulsado" y confunde (WAI-ARIA Authoring Practices, botón de alternancia). Sin icono ni slot: Grana no trae iconos. El foco se conserva en el botón.
- Iconos de los slots `prepend` y `append`: envueltos con `aria-hidden="true"`. El contador también es `aria-hidden`.
- **Altura real ≥ 44px con `pointer: coarse`**, sin importar `density`: la caja es el objetivo táctil; no se usa pseudo-elemento porque se solaparía con el mensaje y con los campos vecinos. Fuera de `coarse`, la altura sale de la tabla de tamaños (`tokens.md` §4) con piso de 24px.
- El anillo de foco es **fino y pegado al borde** (sin hueco; del grosor de `--g-focus-width`) y rodea **el conjunto** (`:has(.g-input__field:focus-visible)`, escrito por coco): la caja sola o, con el slot `action`, caja y botón juntos. No rodea el `<input>` interior. El botón mostrar/ocultar y el botón de acción enfocado tienen su propio anillo, con el mismo trazo pegado. `--g-focus-offset` lo usa el botón mostrar/ocultar, no la caja.

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
| `action` | Botón de acción acoplado al final de la caja | **Slot con alcance.** Propiedades: `size`, `density` y `disabled` del campo. El consumidor pone **un** `GBtn` (con texto, o `icon` con `aria-label`). Ver "Botón de acción" |

## Botón de acción (slot `action`)

Decisión del usuario (DECISIONS.md #33): el botón es un `GBtn` del consumidor, no un botón propio del campo.

```vue
<g-input v-model="correo" label="Correo" type="email">
  <template #action="{ size, density, disabled }">
    <g-btn type="submit" :size="size" :density="density" :disabled="disabled">Suscribirse</g-btn>
  </template>
</g-input>
```

- **Propiedades del slot:** `size`, `density` y `disabled` del campo, para que el botón tenga la misma altura (`GBtn` y `GInput` comparten tabla de tamaños y densidad) y se deshabilite con el campo. El consumidor puede sobrescribirlas.
- **Acoplado:** el botón queda pegado a la caja con la **misma altura**. Esquinas exteriores redondeadas, interiores rectas. Lo aplica el CSS de `GInput` sobre el `GBtn` del slot (`.g-input__action > *`), **solo** en radio, foco y alineación: es la única excepción a "cada componente estiliza lo suyo" (DECISIONS.md #33).
- **Un solo botón.** Varias acciones, menús o botón a la izquierda quedan fuera de v0.1.
- **Nombre accesible:** una sola etiqueta para el conjunto, asociada al `<input>`. El botón tiene su propio nombre: su texto o, si es `icon`, su `aria-label` (ya exigido por `GBtn`).
- **Teclado:** sin manejadores propios. **Enter en el campo** envía el formulario solo si hay un `<form>` con un botón `type="submit"`; fuera de un formulario no ocurre nada y el consumidor escucha `keydown.enter` si lo necesita. Enter y Espacio activan el botón.
- **Carga de la acción:** la controla el `loading` del propio `GBtn` (`aria-busy`, `aria-disabled`, sin `disabled` nativo). El clic o el Enter llegan y `GBtn` los cancela, así que la acción no se ejecuta dos veces. El `loading` de `GInput` es otra cosa (validación del valor) y no interviene.
- **Error:** describe el **campo**, va debajo del conjunto y no lo hereda el botón.
- **Foco:** con el foco en el campo, un solo anillo rodea caja y botón (se lee como una sola pieza); con el foco en el botón, el anillo lo rodea a él. El elemento enfocado pasa por encima del vecino. En el apilado (botón debajo) el anillo rodea solo la caja. Lo escribe coco.
- **Altura táctil:** con `pointer: coarse`, caja y botón miden 44px reales.
- **Anchos estrechos:** por debajo de ~300px de ancho de `.g-input`, un botón **con texto** pasa debajo del campo, a ancho completo, separado y con todas las esquinas redondeadas. Un botón **`icon`** (`.g-btn--icon`) no se apila: es cuadrado y sigue a la derecha. Sin apilar, un campo con "Suscribirse" queda en 51px en un contenedor de 220px.
- **Umbral de apilado:** es una **excepción documentada** a la regla de literales (DECISIONS.md #34; `tokens.md` §7): una consulta de contenedor no admite `var()`. Es una constante de diseño, no un valor de tema. El contenedor de la consulta es la raíz `.g-input`.

**Reglas nuevas para bruno:** el slot `action` se renderiza solo si el consumidor lo da; dentro de `.g-input__row`, después de `.g-input__control`, en `.g-input__action`. Con el slot presente la raíz lleva `g-input--has-action`. Las propiedades del slot son `size`, `density` y `disabled` (valores actuales del campo).

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
| `is-ready` | Raíz | Tras el primer pintado (§«Personalidad», I1) |
| `is-rejected` | Raíz | La pone `GForm` en un envío o `showErrors()` con este campo bloqueando (§«Personalidad», I2) |
| `g-input__label` | `label` | Si hay `label` o slot `label` |
| `g-input__required` | `span` `aria-hidden` | `required` |
| `g-input--has-action` | Raíz | Solo con el slot `action` |
| `g-input__row` | Contenedor de caja y acción | Siempre |
| `g-input__control` | Caja | Siempre |
| `data-g-tooltip-box` | `g-input__control` | Siempre (estático; ancla de `GTooltip`: su pestaña mide la caja y no el `<input>`; `tooltip.md` §«Caja visible», #395; lo heredan `GNumberField` y `GCombobox`) |
| `g-input__action` | Envoltura del slot `action` | Solo con el slot `action` |
| `g-input__prepend` / `g-input__append` | Envoltura del slot | Si hay slot |
| `g-input__field` | `<input>` | Siempre |
| `g-input__loader` | `span` `aria-hidden` | Solo con `loading` |
| `g-input__toggle` | `button` (contiene el texto de la etiqueta) | `type="password"` con las dos etiquetas |
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

## Resolución de hallazgos (r01 y r02)

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
| 11 (coco) | Contenido del botón mostrar/ocultar | Texto visible con la propia etiqueta (`showPasswordLabel` / `hidePasswordLabel`), sin icono, sin slot y sin `aria-label` | WCAG 2.5.3 (la etiqueta en el nombre); internacionalización; Grana no trae iconos |
| 12 (coco) | Texto de 14px en táctil (zoom de iOS) | Límite conocido, sin regla por dispositivo | El tamaño de texto es del tema; `lg` y `xl` ya usan 16px por defecto |
| 13 (bruno) | `aria-pressed` en el botón mostrar/ocultar, junto al cambio de texto | Se quita: el estado lo comunica el propio texto ("Mostrar" / "Ocultar contraseña"). Decisión del usuario, a propuesta de bruno | WAI-ARIA: no combinar `aria-pressed` con un nombre que cambia |
| 14 (kiwi r02) | ¿Cómo se entrega el botón de acción? | Slot con alcance `action` (`size`, `density`, `disabled`); el consumidor pone su `GBtn`. Decisión del usuario (DECISIONS.md #33) | Reutiliza `GBtn`; API nueva no derivable de un estándar |
| 15 (kiwi r02) | ¿Quién aplana las esquinas interiores del botón? | El CSS de `GInput` sobre `.g-input__action > *`, solo radio, foco y alineación | Encaje visual sin obligar al consumidor a estilizar |
| 16 (kiwi r02) | Umbral de apilado en anchos estrechos | Constante literal de contenedor (~300px), excepción documentada. Decisión del usuario (DECISIONS.md #34) | Una consulta de contenedor no admite `var()` |
| 17 (kiwi r02) | `disabled` del campo y el botón | Se propaga por las propiedades del slot; el consumidor puede sobrescribirlo | Coherencia sin acoplar componentes |
| 18 (kiwi r02) | ¿El campo pasa a `readonly` mientras la acción está pendiente? | No lo decide el componente: lo decide el consumidor | La acción y el campo son independientes |

## Personalidad (DECISIONS.md #304; lenguaje común, #299 y `tokens.md` §29)

Ronda de kiwi `design/lab/personalidad/r01/` §7 (I1 e I2, prototipadas sobre el componente real) y decisión del usuario 3 (los campos con error **sí** se sacuden al enviar). Ninguna prop, slot ni evento nuevo.

### I1 · El mensaje sale del campo

- Cuando `g-input__message` pasa de **vacía a con texto** (error, advertencia o válido), entra con fundido y **baja `--g-space-1 × 1`** desde la caja. **Es una transición, no unas keyframes** (corregido por la medida del plan 018; #306): el **estado de partida** vive en `.g-input__message:empty` (`opacity: 0` y, sin movimiento reducido, `translate` de `−space × 1`; Vue deja un comentario, y `:empty` lo reconoce como vacía) y la `transition` de `opacity` y `translate` (`--g-duration-press`, `--g-ease-out`) existe **solo bajo `.is-ready`**. Con keyframes condicionadas a `is-ready`, un campo que monta con error las reproduciría al llegar `is-ready`; con la transición, al llegar `is-ready` no cambia ningún valor, y cambiar el texto o el tipo con la región ya llena tampoco cambia ninguno, así que **no** se repite. El hueco aparece (y se va) en un cuadro, como hoy. Las keyframes `g-reject-*` quedan para la sacudida (I2) y, en el resto de la librería, para el giro de carga.
- **Solo con `is-ready`** en la raíz (nuevo, bruno): se pone en el cuadro siguiente al montaje (`requestAnimationFrame` tras `onMounted`; en SSR, nunca en el HTML). Un error que ya viene al montar no se anima.
- La región viva no cambia (C4 de «Cambio por el sistema de formularios»); el anuncio no depende de la animación.

### I2 · Un solo aviso al enviar (clase `is-rejected`)

- **Quién la pone:** `GForm` (nunca el campo), en un envío con errores (no con un `submitter` `formnovalidate`) y en `showErrors()`, sobre **cada campo que bloquea** (los registros de la lista de errores que bloquean, `form.md` §1 «Envío» paso 3), después de abrir las secciones plegadas que los contienen (#287): vacía el conjunto de rechazados y lo llena en el cuadro siguiente, para que una sacudida anterior se reinicie (`form.md` §2 «Rechazo al enviar»). Llega al campo por `useFormField` (interno, `form.md` §2); el campo solo la pinta en su raíz.
- **Quién la quita** (lo primero que ocurra): el fin de la sacudida (`animationend` o `animationcancel` dentro de la raíz del campo cuyo `animationName` empieza por **`g-reject`**; el `animationend` del mensaje de I1 no cuenta), el siguiente `input` o `change` del campo, su desmontaje, o un envío nuevo, que la quita y la vuelve a poner en el cuadro siguiente para que la sacudida se repita.
- **Qué se ve (coco):** una vez, horizontal, decreciente, amplitudes `1 · 0.75 · 0.5 · 0.25` × `--g-space-1` (máximo 4px con `space` 4) en los instantes `16 · 36 · 56 · 76 %` de `--g-duration-slow`, keyframes de nombre **`g-reject…`**. Se mueve **`g-input__row`** (caja y acción), para que el anillo de foco vaya con ella; la etiqueta y el mensaje no se mueven.
- **Nunca** al escribir, al salir del campo, al montar ni al cambiar `errors` desde la aplicación sin `showErrors()`.
- Otros campos: la clase llega a la raíz de todo campo registrado que bloquea (un grupo, `GFieldGroup`, `GCheckboxGroup`, `GRadioGroup`, `GInputGroup`, como **una** pregunta: en la raíz del grupo). Cada campo que la adopte la añade en su CSS con la misma regla y el mismo prefijo `g-reject`. **Estado (planes 018 y #306):** todos los campos dibujan I2 con la misma coreografía (una vez, `1 · 0.75 · 0.5 · 0.25 × --g-space-1` en 16 · 36 · 56 · 76 % de `--g-duration-slow`, solo con `prefers-reduced-motion: no-preference`), cada uno con su propio keyframe de prefijo `g-reject-`. Se mueve siempre la pieza que lleva el anillo de foco; etiqueta, ayuda y mensaje se quedan quietos. `GInput` dibuja además I1; `GTextarea` y `GSelect` también (`is-ready` de bruno, `c10966e`).

| Campo | Pieza que se mueve | Keyframes |
| --- | --- | --- |
| `GInput` | `g-input__row` (caja y acción) | `g-reject-shake` |
| `GTextarea` | `__control` | `g-reject-shake-textarea` |
| `GSelect` | `__control` | `g-reject-shake-select` |
| `GCheckbox` | `__box` (la caja con su marca; no la fila con la etiqueta) | `g-reject-shake-checkbox` |
| `GSwitch` | `__control` (el riel; el pulgar conserva su `translate`) | `g-reject-shake-switch` |
| `GDatePicker` | `__field` (el botón del campo) o, con `split`, `__fields` (los dos campos juntos) | `g-reject-shake-datepicker` |
| `GCheckboxGroup` | `__list` (el conjunto de opciones como una pregunta, no cada casilla) | `g-reject-shake-checkbox-group` |
| `GRadioGroup` | `__options` (las tres apariencias) | `g-reject-shake-radio-group` |
| `GFieldGroup` | `__parts` (la fila de partes; no la leyenda) | `g-reject-shake-field-group` |
| `GInputGroup` | `__box` (la caja fusionada entera con sus divisores) | `g-reject-shake-input-group` |
| `GNumberField` | `g-input__row` de su `GInput` (la caja con −/+ dentro; compone `GInput`, #309) | `g-reject-shake` (el de `GInput`; sin regla propia) |

**Límite de `GDatePicker inline`:** el calendario en línea no tiene campo, así que **no se mueve nada**; la clase `is-rejected` llega y se retira igual (por el siguiente `input`/`change` o envío), sin sacudida. Los `animationend` de los hijos suben a la raíz y solo el de nombre `g-reject…` retira la clase, así que un `GInput` anidado en un `GFieldGroup` no la quita antes de tiempo. Medido por coco en tres motores (`design/lab/input/estilo.md`, «I2 extendido al resto de campos»).

### Movimiento reducido

I1: solo fundido, sin desplazamiento. I2: **no existe** (el error ya es borde, icono y texto); `GForm` pone y quita la clase igual (sin animación, se retira con el siguiente `input`/`change` o el siguiente envío).

### Verificación (criterio de hecho: la medida de kiwi)

| Qué | Medida |
| --- | --- |
| I1 | Cuadros intermedios (kiwi: 5); de `−space × 1` a 0; hoy, 0 intermedios; error presente al montar: 0 animaciones; con `reduce`, sin desplazamiento |
| I2 | Desplazamiento máximo ≤ `space × 1` (kiwi: 3,47px), tres cambios de sentido y vuelta a 0; escribir y salir del campo: 0 animaciones; `formnovalidate`: sin clase; `showErrors()`: sí; clase retirada al terminar y al siguiente `input`; con `reduce`, sin vaivén |
| Pruebas de bruno | `is-ready` tras el montaje y no en SSR; `is-rejected` solo en los que bloquean, no en deshabilitados ni inactivos (#276); quitada por `animationend` con nombre `g-reject…` y no por otro nombre; quitada al escribir; repuesta en un segundo envío |
| Reservadas | I3 (la etiqueta toma el color de foco), I4 (contador que avisa antes del límite), I5 (borde desde el clic): fuera de esta tanda. Sin prop para apagar I2 en v0.1 |

## Límites conocidos

- **Táctil y tamaño de texto:** con `pointer: coarse` la caja mide 44px, pero el texto conserva el tamaño del tema (`body-sm`, 14px por defecto). iOS Safari amplía la página al enfocar un campo con texto menor de 16px. No se cambia el tamaño por dispositivo: quien lo necesite sube `fontSize` del tema a 16 o más, o usa `size="lg"`/`"xl"` (`body`).

## Abierto (no bloquea el paso siguiente)

- **Lector de pantalla real:** confirmar que `aria-describedby` y la región `aria-live` juntos no duplican el anuncio del error al enfocar. Si duplican, se quita `aria-live` y el error se anuncia solo por `aria-describedby`, más un anuncio al aparecer.
- **Estado deshabilitado sin token propio:** coco decide cómo se ve con tokens vigentes (`text-subtle`, `surface-sunken`); si no alcanza, pide token.

## Cambio por el sistema de formularios (Fase 1)

> **Revisión r02 (distribución, DECISIONS.md #171 a #184):** cambia C10 y C12; `block` se resuelve dentro de `GFormLayout`/`GFormRow`/`GFieldGroup` (C2). Pendiente de **bruno** (marcado) y **coco** (pistas). Ver `form.md` §4, §10 y «Migración desde la Fase 1».

**Origen:** `design/contracts/form.md` §10 (DECISIONS.md #153, #158, #164, #165, #166). **Estado:** aprobado por lima; pendiente de **bruno** (`.vue`, pruebas, `meta.json`) y **coco** (CSS). Lo que aquí se dice **sustituye** a lo anterior de este contrato donde choque; fuera de `GForm` el componente se ve y se comporta como hoy salvo C4, C5, C6 y C7, que aplican siempre.

| # | Cambio | Detalle |
| --- | --- | --- |
| C1 | Lee el contexto con `useFormField()` | `density`, `readonly`, `disabled`, `block` y `error` pasan a default `undefined`; valor = prop explícita › contexto de `GForm` › default de siempre. Error por `name` desde `errors` de `GForm` (y `warnings`), con su momento (`showErrorsOn`) |
| C2 | `block` en la rejilla | Dentro de `GFormLayout`, `GFormRow` o `GFieldGroup`, `block` resuelto a `true` (llena su sitio); el ancho propio `min(100%, space×60)` solo aplica fuera del layout. |
| C3 | Marcas | Con `marks="optional"`, «(opcional)» (`labels.optional`) como texto visible **dentro** del `<label>` en `g-input__optional` si no es `required`, y sin asterisco; con `marks="required"`, el asterisco de hoy. Prop nueva **`mark`** (Boolean, default `undefined`; `false` la quita). Sin marca si es `readonly` o `disabled`. |
| C4 | Región de mensaje unificada | `g-input__error` / `ID-error` pasa a **`g-input__message`** / `ID-message`: un hueco para error, advertencia o válido, siempre presente; `aria-live` = `live` del contexto (`polite`, u `off` mientras se escriben mensajes revelados por un envío; fuera de `GForm`, `polite`). Dentro: `GIcon` (`g-input__message-icon`) + prefijo oculto `g-input__message-type` (`labels.error\|warning\|valid` de `GForm`; fuera, sin prefijo) + texto. `aria-describedby` incluye `ID-message` mientras haya mensaje. Vacía = **sin nodos de texto** (el CSS usa `:not(:empty)`; un comentario de Vue vale, un espacio no). El slot `error` se conserva. |
| C5 | Estados `warning` y `valid` | Props nuevas **`warning`** y **`valid`** (String, sin valor). Sin `aria-invalid`; no bloquean; prioridad error › advertencia › válido. Clases `is-warning`, `is-valid` en la raíz. Borde de estilo distinto del error (no solo color) |
| C6 | Iconos | Error **`circle-alert`** (antes `triangle-alert`), advertencia `triangle-alert`, válido `circle-check` (`icons.md`) |
| C7 | Solo lectura homogéneo | Contraste completo (`--g-color-text`, sin opacidad), fondo `--g-color-neutral-soft` (#186; antes `surface-sunken`), marcador `text-muted`, borde **discontinuo** `--g-color-border-control`, cursor normal, enfocable; distinto de `disabled` sin depender del color (#165). Semántica nativa sin cambios. |
| C8 | Manejadores primero | `mergeProps(handlers, { onInput }, attrs)`: los del contexto y el propio antes que los del consumidor (ya existe la prueba de orden; se amplía a `focusout`). |
| C9 | Registro | Con `name` en `$attrs`, se registra en `GForm` (`control` = `<input>`, `root` = raíz). |
| C10 | **Tres hijos: etiqueta, caja, pie** (r02, #176; sustituye a las cuatro pistas) | La raíz tiene exactamente tres hijos en flujo: `g-input__label`, la caja (`g-input__row`) y el pie nuevo **`g-input__support`**, que agrupa ayuda (y contador) y la región `g-input__message` (siempre presente). Dentro de una `GFormRow`, coco coloca las tres partes en las pistas compartidas (`subgrid`; etiqueta apoyada abajo y nunca recortada; `form.md` §4, C12) |
| C11 | **Prefijo y sufijo de texto** (#166) | Props nuevas **`prefix`**, **`suffix`** (String: texto visible dentro de la caja, `$`, `kg`, `%`) y **`prefixLabel`**, **`suffixLabel`** (expansión accesible, «kilogramos»). Orden: `prepend` · prefijo · `<input>` · sufijo · `append` · carga · mostrar/ocultar. Sin `*Label`, el texto visible (con `id`) entra en `aria-describedby` antes de ayuda y mensaje; con `*Label`, el visible es `aria-hidden` y un texto oculto con la expansión entra en `aria-describedby`. No interactivos; pulsar sobre ellos enfoca el `<input>`. Texto `--g-color-text-muted`, tamaño del texto escrito. `__prefix-label`/`__suffix-label` van dentro de `g-input__control`, justo después del texto visible. Los slots `prepend`/`append` siguen siendo iconos decorativos |
| C12 | **Valor calculado: `output`** (r02, #180; `form.md` C14) | Prop nueva **`output`** (String, sin valor): dato que calcula la aplicación a partir del valor (IMC desde el peso). `<output class="g-input__output" id="ID-output" for="ID" aria-live="polite">` dentro de `g-input__control`, inmediatamente tras el sufijo y antes de `append`; siempre presente, vacía sin nodos de texto; con texto entra en `aria-describedby` tras prefijo/sufijo y antes de ayuda y mensaje, y la raíz lleva `g-input--has-output`. No se envía ni es enfocable; pulsarlo enfoca el `<input>` |

**«(opcional)»:** un espacio de texto antes del `<span>` de la marca (sin margen en CSS). Advertencia en cajas: borde discontinuo doble; error, continuo doble; válido, continuo sencillo (coco, #169).

**Clases nuevas** (contrato bruno–coco): `g-input__support`, `g-input__output`, `g-input--has-output` (r02), `g-input__optional`, `g-input__message`, `__message-icon`, `__message-type`, `is-warning`, `is-valid`, `g-input--has-prefix`, `g-input--has-suffix`, `g-input__prefix`, `__suffix`, `__prefix-label`, `__suffix-label` (`g-input__error` desaparece).

**Marca fuera de `GForm` (#170):** sin contexto, el asterisco con `required` se pinta como antes aunque el campo sea `readonly` o `disabled`; la regla «solo campos editables llevan marca» rige solo dentro de `GForm`.

## Cambio por `GNumberField` (DECISIONS.md #309, #311)

**Origen:** `design/contracts/number-field.md` (kiwi `design/lab/number-field/r01/`, hallazgo L1). `GNumberField` **compone** `GInput` en lugar de duplicarlo (hereda etiqueta, caja, prefijo/sufijo, `output`, pie, mensaje, marcas, contexto de `GForm`, I1 e I2). Para eso `GInput` gana **dos añadidos internos** y un `id`. **Ninguna prop, evento ni slot público nuevo:** los slots internos no van en `GInput.meta.json` ni en el README, no tienen promesa de estabilidad (como las opciones internas de `useFormField`, #170) y solo los usan componentes de Grana. **Dueños:** bruno (`.vue`, pruebas), coco (nada en `GInput.css`: lo propio va en `GNumberField.css`).

| # | Cambio | Detalle |
| --- | --- | --- |
| N1 | **`id` en la etiqueta** | `g-input__label` lleva **`id="{id}-label"`** siempre que se pinta (visible en la estructura, no es API). Lo necesita el nombre de −/+ de `GNumberField` (`aria-labelledby` = texto propio + etiqueta, que respeta el slot `label` y «(opcional)») |
| N2 | **Slot interno `field`** (con alcance) | Si se da, **sustituye al `<input>`** de `GInput` en su sitio (entre prefijo y sufijo). Propiedades: **`bind`** = lo que `GInput` pondría en su `<input>` **salvo** `value`, `type` y su propio `onInput` (que emite una cadena): `mergeProps(ff.handlers, attrs sin class/style, { id, disabled, readonly, required, 'aria-invalid', 'aria-busy', 'aria-describedby', class: 'g-input__field' })`, con los manejadores del contexto **primero** (C8); **`setControl(el)`**: fija el control (el `ref` que usan `useFormField` para el foco del resumen y `GInput` para enfocar al pulsar prefijo, sufijo u `output`); **`notifyInput()`** (= `ff.handlers.onInput`, para escrituras sin evento nativo: flechas, pegado programático) y **`notifyChange()`** (= `ff.notifyChange`); **`readonly`** y **`disabled`** resueltos (prop › contexto › default). Con el slot, `GInput` **no** emite `update:modelValue` (el valor es del componente que compone) y **no** emite su aviso de nombre accesible (avisa el componente que compone). El que compone decide qué quita de `bind` (`GNumberField` quita `name` y `required`, y pone `aria-required`) |
| N3 | **Slot interno `end`** (con alcance: `readonly`, `disabled`) | Se pinta **al final de `g-input__control`**, después del botón mostrar/ocultar, **sin** envoltura `aria-hidden` (a diferencia de `append`, que es decorativo). Para controles reales dentro de la caja: −/+ de `GNumberField`. Sin el slot, nada cambia |

- **Registro y `name`:** sin cambio. `GInput` sigue registrando el campo en `GForm` con `name` de `$attrs`; con el slot `field`, el `name` llega en `bind` y el componente que compone lo pone donde se envía (en `GNumberField`, un `<input type="hidden">` dentro del propio slot, que es `display: none` y no ocupa hueco en la caja). No hace falta un tercer añadido.
- **Pruebas (bruno):** `GInput` sin slots internos se renderiza exactamente igual que hoy (instantánea) salvo el `id` de la etiqueta; con `field`, el `<input>` propio no aparece, `bind` trae los manejadores del contexto antes que los del consumidor, `setControl` lleva el foco del resumen al control del slot y pulsar el sufijo lo enfoca; con `end`, el contenido no queda bajo `aria-hidden`.

**Segundo consumidor de los slots internos: `GCombobox`** (`design/contracts/combobox.md`, DECISIONS.md #330). Usa `field` (su celda `g-combobox__value` con el `<input role="combobox">`, las capas de texto fantasma y de ficha y los campos ocultos; de `bind` quita `name` y `required` y pone `aria-required`) y `end` (limpiar y flecha). **No pide ningún añadido nuevo a `GInput`**: N1, N2 y N3 bastan. Su `GInput` recibe `loading` (indicador de búsqueda) y los slots públicos `label`, `hint`, `error` y `prepend`; `append` y `action` no se pasan.

**Tercer consumidor de los slots internos: `GTimeField`** (`design/contracts/time-field.md`, DECISIONS.md #400 y #409). Usa `field` (su celda `g-time-field__value` con el espejo y el `<input role="spinbutton">`, la lectura en palabras `aria-hidden` y el oculto canónico; de `bind` quita `name` y `required` y pone `aria-required`) y `end` (a. m./p. m. en 12 h o las dos lecturas en 24 h). Recibe los slots públicos `label`, `hint`, `error` y `prepend`; `append` y `action` no se pasan. **Pide un añadido interno nuevo:**

| # | Cambio | Detalle |
| --- | --- | --- |
| N4 | **Error propio del componente que compone** (#409) | `GInput` acepta del componente que lo compone las opciones internas **`ownError`**, **`ownTarget`** y **`ownReveal`** de `useFormField` (`form.md` §2 «Error propio del componente») y las pasa a **su** `useFormField`. Mecanismo interno, a elección de bruno (p. ej. una clave interna provista por el que compone e inyectada solo por `GInput`, no exportada desde `src/index.js`): **ninguna prop, slot ni evento público**, como N2 y N3. Sin consumidor, nada cambia (instantánea igual). El mensaje, `aria-invalid`, el bloqueo, el enlace del resumen y `is-rejected` salen por las vías que `GInput` ya tiene |

- **Pruebas (bruno):** `GInput` sin N4 se renderiza igual; con N4, el error propio se pinta solo revelado (por salida con `ownReveal: 'blur'`, por envío con los dos), bloquea el envío de `GForm` y el resumen enlaza a `ownTarget`.
