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
  <label class="g-input__label" for="ID">Correo<span class="g-input__required" aria-hidden="true">*</span></label>
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
| `g-input__label` | `label` | Si hay `label` o slot `label` |
| `g-input__required` | `span` `aria-hidden` | `required` |
| `g-input--has-action` | Raíz | Solo con el slot `action` |
| `g-input__row` | Contenedor de caja y acción | Siempre |
| `g-input__control` | Caja | Siempre |
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

## Límites conocidos

- **Táctil y tamaño de texto:** con `pointer: coarse` la caja mide 44px, pero el texto conserva el tamaño del tema (`body-sm`, 14px por defecto). iOS Safari amplía la página al enfocar un campo con texto menor de 16px. No se cambia el tamaño por dispositivo: quien lo necesite sube `fontSize` del tema a 16 o más, o usa `size="lg"`/`"xl"` (`body`).

## Abierto (no bloquea el paso siguiente)

- **Lector de pantalla real:** confirmar que `aria-describedby` y la región `aria-live` juntos no duplican el anuncio del error al enfocar. Si duplican, se quita `aria-live` y el error se anuncia solo por `aria-describedby`, más un anuncio al aparecer.
- **Estado deshabilitado sin token propio:** coco decide cómo se ve con tokens vigentes (`text-subtle`, `surface-sunken`); si no alcanza, pide token.

## Cambio por el sistema de formularios (Fase 1)

**Origen:** `design/contracts/form.md` §10 (DECISIONS.md #153, #158, #164, #165, #166). **Estado:** aprobado por lima; pendiente de **bruno** (`.vue`, pruebas, `meta.json`) y **coco** (CSS). Lo que aquí se dice **sustituye** a lo anterior de este contrato donde choque; fuera de `GForm` el componente se ve y se comporta como hoy salvo C4, C5, C6 y C7, que aplican siempre.

| # | Cambio | Detalle |
| --- | --- | --- |
| C1 | Lee el contexto con `useFormField()` | `density`, `readonly`, `disabled`, `block` y `error` pasan a default `undefined`; valor = prop explícita › contexto de `GForm` › default de siempre. Error por `name` desde `errors` de `GForm` (y `warnings`), con su momento (`showErrorsOn`) |
| C2 | `block` en la rejilla | Dentro de `GFormGrid` o `GFieldGroup`, `block` resuelto a `true` (llena su celda); el ancho propio `min(100%, space×60)` solo aplica fuera de la rejilla. |
| C3 | Marcas | Con `marks="optional"`, «(opcional)» (`labels.optional`) como texto visible **dentro** del `<label>` en `g-input__optional` si no es `required`, y sin asterisco; con `marks="required"`, el asterisco de hoy. Prop nueva **`mark`** (Boolean, default `undefined`; `false` la quita). Sin marca si es `readonly` o `disabled`. |
| C4 | Región de mensaje unificada | `g-input__error` / `ID-error` pasa a **`g-input__message`** / `ID-message`: un hueco para error, advertencia o válido, siempre presente; `aria-live` = `live` del contexto (`polite`, u `off` mientras se escriben mensajes revelados por un envío; fuera de `GForm`, `polite`). Dentro: `GIcon` (`g-input__message-icon`) + prefijo oculto `g-input__message-type` (`labels.error\|warning\|valid` de `GForm`; fuera, sin prefijo) + texto. `aria-describedby` incluye `ID-message` mientras haya mensaje. Vacía = **sin nodos de texto** (el CSS usa `:not(:empty)`; un comentario de Vue vale, un espacio no). El slot `error` se conserva. |
| C5 | Estados `warning` y `valid` | Props nuevas **`warning`** y **`valid`** (String, sin valor). Sin `aria-invalid`; no bloquean; prioridad error › advertencia › válido. Clases `is-warning`, `is-valid` en la raíz. Borde de estilo distinto del error (no solo color) |
| C6 | Iconos | Error **`circle-alert`** (antes `triangle-alert`), advertencia `triangle-alert`, válido `circle-check` (`icons.md`) |
| C7 | Solo lectura homogéneo | Contraste completo (`--g-color-text`, sin opacidad), fondo `--g-color-surface-sunken`, borde **discontinuo** `--g-color-border-control`, cursor normal, enfocable; distinto de `disabled` sin depender del color (#165). Semántica nativa sin cambios. |
| C8 | Manejadores primero | `mergeProps(handlers, { onInput }, attrs)`: los del contexto y el propio antes que los del consumidor (ya existe la prueba de orden; se amplía a `focusout`). |
| C9 | Registro | Con `name` en `$attrs`, se registra en `GForm` (`control` = `<input>`, `root` = raíz). |
| C10 | Pistas para *subgrid* | Etiqueta, caja, ayuda y mensaje como hijos directos de la raíz; dentro de `.g-form-row`, coco los coloca en cuatro pistas con nombre (`form.md` §4) |
| C11 | **Prefijo y sufijo de texto** (#166) | Props nuevas **`prefix`**, **`suffix`** (String: texto visible dentro de la caja, `$`, `kg`, `%`) y **`prefixLabel`**, **`suffixLabel`** (expansión accesible, «kilogramos»). Orden: `prepend` · prefijo · `<input>` · sufijo · `append` · carga · mostrar/ocultar. Sin `*Label`, el texto visible (con `id`) entra en `aria-describedby` antes de ayuda y mensaje; con `*Label`, el visible es `aria-hidden` y un texto oculto con la expansión entra en `aria-describedby`. No interactivos; pulsar sobre ellos enfoca el `<input>`. Texto `--g-color-text-muted`, tamaño del texto escrito. `__prefix-label`/`__suffix-label` van dentro de `g-input__control`, justo después del texto visible. Los slots `prepend`/`append` siguen siendo iconos decorativos |

**«(opcional)»:** un espacio de texto antes del `<span>` de la marca (sin margen en CSS). Advertencia en cajas: borde discontinuo doble; error, continuo doble; válido, continuo sencillo (coco, #169).

**Clases nuevas** (contrato bruno–coco): `g-input__optional`, `g-input__message`, `__message-icon`, `__message-type`, `is-warning`, `is-valid`, `g-input--has-prefix`, `g-input--has-suffix`, `g-input__prefix`, `__suffix`, `__prefix-label`, `__suffix-label` (`g-input__error` desaparece).

**Marca fuera de `GForm` (#170):** sin contexto, el asterisco con `required` se pinta como antes aunque el campo sea `readonly` o `disabled`; la regla «solo campos editables llevan marca» rige solo dentro de `GForm`.
