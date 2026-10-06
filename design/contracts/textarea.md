# Contrato · GTextarea

**Dueño:** lima · **Estado:** aprobado · **Basado en:** `design/lab/textarea/r01/` (kiwi)
**Tag:** `g-textarea` · **Categoría:** entradas

Campo de texto de varias líneas con la misma anatomía y el mismo lenguaje que `GInput`: etiqueta, ayuda, error, contador y estados. Alcance decidido por el usuario (DECISIONS.md #50 a #52): `rows` con `autosize` opcional, y campo completo como `GInput`, sin prefijo, sufijo, acción ni barra inferior.

## Principios

- **Es un `<textarea>` nativo.** Foco, valor, teclado, selección y formularios los resuelve el navegador.
- **No valida ni envía.** Emite el valor; Enter inserta un salto de línea y cualquier envío es decisión del consumidor.
- **Mismo lenguaje que `GInput`:** mismas variantes, tamaños, densidad, colores de foco, estados y textos.

## Props

| Prop | Tipo | Valores | Default | Origen |
| --- | --- | --- | --- | --- |
| `modelValue` | String | | `''` | compartida |
| `variant` | String | `outline` `soft` | `outline` | compartida (subconjunto, como `GInput`: DECISIONS.md #28) |
| `size` | String | `xs` `sm` `md` `lg` `xl` | `md` | compartida |
| `density` | String | `default` `comfortable` `compact` | `default` | compartida |
| `color` | String | `brand` `accent` `neutral` `success` `warning` `danger` `info` | sin valor: usa `--g-color-focus` | compartida (solo el foco) |
| `rounded` | String | `none` `xs` `sm` `md` `lg` `xl` `pill` | sin valor: `sm` (campo, `tokens.md` §3) | compartida |
| `block` | Boolean | | `false` | compartida |
| `disabled` | Boolean | | `false` | compartida |
| `readonly` | Boolean | | `false` | compartida |
| `loading` | Boolean | | `false` | compartida (precisada en `api.md`) |
| `rows` | Number | entero ≥ 1 | `3` | propia |
| `autosize` | Boolean | | `false` | propia |
| `maxRows` | Number | entero ≥ `rows` | sin valor (sin máximo) | propia |
| `resize` | String | `none` `vertical` | `vertical` (`none` con `autosize`) | propia |
| `label` | String | texto libre | sin valor | propia |
| `hint` | String | texto libre | sin valor | propia |
| `error` | String | texto libre | sin valor | propia |
| `required` | Boolean | | `false` | propia |
| `counter` | Boolean | | `false` | propia |
| `counterText` | Function | `(nivel, máximo) => string` | sin valor | propia |
| `id` | String | | generado | propia |

### Reglas de props

- **`modelValue`:** siempre `String`; el campo no convierte tipos.
- **`variant`, `color`, `rounded`, `block`:** exactamente como en `GInput`. `color` solo colorea el anillo de foco; el error usa siempre `danger`. Sin `rounded`, el radio es `--g-radius-sm`; `shape: "pill"` no afecta a los campos.
- **`rows`:** altura **mínima** en líneas de texto. Con `rows` 1, el campo mide lo mismo que un `GInput` del mismo `size` y `density`. Un valor menor que 1 o no entero avisa en desarrollo y se trata como 1.
- **`autosize`:** la altura sigue al contenido entre `rows` y `maxRows`. Sin `maxRows`, crece sin límite. Al llegar a `maxRows`, el propio `<textarea>` se desplaza (`overflow-y: auto`); el texto nunca se oculta y el campo sigue enfocado. **No hay tirador** y el cambio de altura **no se anima**.
- **`maxRows`:** solo tiene efecto con `autosize`. Sin `autosize`, se ignora y en desarrollo se emite `console.warn`. Debe ser ≥ `rows`.
- **`resize`:** `vertical` deja el tirador nativo en vertical; `none` lo quita. **Nunca horizontal.** Con `autosize`, siempre `none` (el prop se ignora).
- **`label`:** el campo exige nombre accesible. Sin `label`, sin slot `label` y sin `aria-label` ni `aria-labelledby` (en `$attrs`), en desarrollo se emite `console.warn`.
- **`error`:** si tiene valor (cadena no vacía), el campo está inválido: `aria-invalid="true"`, clase `is-invalid` y mensaje visible. **El campo no valida.**
- **`hint`:** texto de ayuda visible siempre que exista.
- **`required`:** atributo nativo `required` y una marca visual `aria-hidden`. El envío lo valida el formulario nativo.
- **`counter`:** con `counter` y un `maxlength` recibido en `$attrs`, muestra `n/máx`. Sin `maxlength` no se muestra y, en desarrollo, se emite `console.warn`. El límite lo aplica el `maxlength` nativo.
- **`counterText`:** función que devuelve el texto de un aviso para lectores de pantalla. Se llama **solo al cambiar de nivel**, con `nivel` `near` (se llega al 90% del máximo, redondeado hacia arriba) o `limit` (se llega al máximo) y el máximo; al volver a un nivel inferior, el aviso se vacía. **Sin valor por defecto** (Grana es internacional; mismo criterio que `countText` de `GCheckboxGroup`). Sin ella no hay aviso hablado: solo el contador visual. Ejemplo: `(nivel, max) => nivel === 'limit' ? \`Límite alcanzado: ${max} caracteres\` : \`Cerca del límite: máximo ${max} caracteres\``. Se recomienda un texto **sin cifras que cambian al teclear**, porque el aviso no se repite mientras el usuario sigue escribiendo.
- **`loading`:** indicador y `aria-busy="true"` en el `<textarea>`. **No bloquea la escritura.**
- **`disabled`:** atributo nativo. **`readonly`:** atributo nativo; enfocable, seleccionable y se envía.
- **`id`:** si no se da, se genera uno estable (`useId`); de él derivan los ids de ayuda y error.
- **Resto de atributos** (`name`, `placeholder`, `maxlength`, `minlength`, `autocomplete`, `spellcheck`, `wrap`, `aria-*`, escuchas de eventos): van al `<textarea>`, **no** a la raíz. `class` y `style` van a la raíz (`inheritAttrs: false`).

## Estructura accesible

```html
<div class="g-textarea g-textarea--variant-outline g-textarea--size-md g-textarea--density-default g-textarea--autosize g-textarea--resize-none …">
  <label class="g-textarea__label" for="ID">Comentario<span class="g-textarea__required" aria-hidden="true">*</span></label>
  <div class="g-textarea__control">
    <textarea class="g-textarea__field" id="ID" rows="3" aria-describedby="ID-hint ID-error" aria-invalid="true" aria-busy="true" required style="--_autoh: 104px"></textarea>
    <span class="g-textarea__loader" aria-hidden="true"></span>
  </div>
  <div class="g-textarea__messages">
    <span class="g-textarea__hint" id="ID-hint">Máximo tres frases.</span>
    <span class="g-textarea__counter" aria-hidden="true">0/120</span>
  </div>
  <span class="g-textarea__count-live" aria-live="polite">Cerca del límite: máximo 120 caracteres</span>
  <div class="g-textarea__error" id="ID-error" aria-live="polite">Escribe al menos 10 caracteres.</div>
</div>
```

- La etiqueta se asocia con `for`/`id`; nunca se sustituye por `placeholder`.
- `aria-describedby` lista `ID-hint` si hay ayuda e `ID-error` solo mientras hay error. El aviso del contador **no** entra en `aria-describedby`: es una región viva aparte.
- Las regiones `ID-error` y `g-textarea__count-live` (`aria-live="polite"`) **se renderizan siempre**, vacías mientras no hay nada que decir (WCAG 4.1.3). La del contador es visualmente oculta (patrón estándar de texto oculto).
- **`rows` y `autosize`:** el atributo `rows` se emite siempre. Con `autosize`, la altura la fija `--_autoh` (variable CSS dinámica, única excepción a "sin estilos en línea") calculada por bruno; sin `autosize`, la altura mínima sale de `rows` y del CSS.
- **Altura real ≥ 44px con `pointer: coarse`**, aunque `rows` sea 1, sin importar `density`.
- El anillo de foco es fino y pegado al borde de la caja (`:has(.g-textarea__field:focus-visible)`, escrito por coco), como en `GInput` (DECISIONS.md #35).
- El error se muestra con texto y una **señal no cromática** (marca ⚠ que un lector de pantalla no lee y contorno de doble trazo), como `GInput`.

## Eventos

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `update:modelValue` | `String` | El usuario cambia el valor (evento `input` nativo) |

**Nota para bruno:** los demás eventos (`focus`, `blur`, `change`, `keydown`, `input`…) **no se declaran**: como los atributos van al `<textarea>`, las escuchas del consumidor llegan al elemento nativo. El manejador propio va **primero** (`mergeProps({ onInput }, attrs)`) para que un `@input` del consumidor ya vea el modelo actualizado (mismo criterio que `GInput`). **Medición de `autosize`:** al montar, ante cada cambio de valor y ante cada cambio de ancho (`ResizeObserver`); se mide `scrollHeight` con altura `auto` y se limita a `maxRows` × interlineado + relleno. Se recalcula al cargar la fuente. Sin `ResizeObserver` (jsdom), solo por valor.

## Slots

| Slot | Propósito | Anatomía que debe conservar |
| --- | --- | --- |
| `label` | Etiqueta con contenido rico (sustituye a `label`) | Dentro del `<label for>`; nunca elementos interactivos |
| `hint` | Ayuda con contenido rico (sustituye a `hint`) | Conserva el `id` `ID-hint` |
| `error` | Mensaje de error con contenido rico | Solo se muestra si `error` tiene valor; conserva el `id` `ID-error` y la región viva |

Sin `prepend`, `append` ni `action` en v0.1.

## Teclado

| Tecla | Acción |
| --- | --- |
| Tab / Shift+Tab | Entra y sale en el orden del documento |
| Enter | Inserta un salto de línea (nativo) |
| Escritura, selección, portapapeles, flechas | Nativos del `<textarea>` |

Sin manejadores de teclado propios.

## Tokens consumidos

Los mismos que `GInput` (`design/contracts/input.md`, "Tokens consumidos"), sin el slot de acción ni el botón de contraseña, más `--g-text-{caption|body-sm|body}-line` (interlineado del texto escrito y de las filas). El **relleno vertical** se calcula para que `rows` 1 iguale la altura de `GInput` (6, 7, 9, 11 y 13 unidades de `--g-space-1` para `xs` a `xl`, `tokens.md` §4) y, con más filas, se suman los interlineados. **Tokens nuevos:** ninguno.

## Clases (contrato entre bruno y coco)

Bruno las emite; coco las estiliza. Ninguno usa otras.

| Clase | Elemento | Cuándo |
| --- | --- | --- |
| `g-textarea` | Raíz (`div`) | Siempre |
| `g-textarea--variant-{variant}` | Raíz | Siempre |
| `g-textarea--size-{size}` | Raíz | Siempre |
| `g-textarea--density-{density}` | Raíz | Siempre |
| `g-textarea--color-{color}` | Raíz | Solo si el prop tiene valor |
| `g-textarea--rounded-{rounded}` | Raíz | Solo si el prop tiene valor |
| `g-textarea--block` | Raíz | `block` |
| `g-textarea--autosize` | Raíz | `autosize` |
| `g-textarea--resize-{none\|vertical}` | Raíz | Siempre (el efectivo: `none` con `autosize`) |
| `is-capped` | Raíz | `autosize` y el contenido supera `maxRows` (el campo se desplaza) |
| `is-disabled`, `is-readonly`, `is-invalid`, `is-loading` | Raíz | Según las props |
| `g-textarea__label` | `label` | Si hay `label` o slot `label` |
| `g-textarea__required` | `span` `aria-hidden` | `required` |
| `g-textarea__control` | Caja | Siempre |
| `data-g-tooltip-box` | `g-textarea__control` | Siempre (estático; ancla de `GTooltip`, `tooltip.md` §«Caja visible», #395) |
| `g-textarea__field` | `<textarea>` | Siempre |
| `g-textarea__loader` | `span` `aria-hidden` | Solo con `loading` |
| `g-textarea__messages` | Contenedor de ayuda y contador | Si hay `hint`, slot `hint` o `counter` |
| `g-textarea__hint` | Ayuda | Si hay ayuda |
| `g-textarea__counter` | Contador visual | `counter` con `maxlength` |
| `g-textarea__count-live` | Región viva del contador (visualmente oculta) | Siempre presente |
| `g-textarea__error` | Región viva del error | Siempre presente |

## Resolución de hallazgos de r01

| # | Hallazgo | Resolución | Base |
| --- | --- | --- | --- |
| 1 | `variant` | `outline` y `soft`, como `GInput` | DECISIONS.md #28 |
| 2 | Valor | `String` | Coherencia con `GInput` |
| 3 | Altura | `rows`, `autosize`, `maxRows` y `resize` | Decisión del usuario (DECISIONS.md #50) |
| 4 | Aviso del contador | `counterText(nivel, máximo)`, sin valor por defecto, solo al cambiar de nivel | Decisión derivada de WCAG 4.1.3 sin spam (DECISIONS.md #51) |
| 5 | Umbral del nivel `near` | 90% del máximo, redondeado hacia arriba | Convención; no es un valor de tema |
| 6 | Medición de `autosize` | De bruno; se recalcula por valor, ancho y fuente | Contrato de este documento |
| 7 | Slots | Solo `label`, `hint` y `error` | Alcance decidido por el usuario |

## Límites conocidos

- **Táctil y tamaño de texto:** igual que `GInput`: el texto conserva el tamaño del tema y iOS Safari amplía la página al enfocar un campo con texto menor de 16px.
- **Textos muy largos:** `autosize` mide `scrollHeight` en cada cambio; con miles de líneas puede notarse. Sin medir en v0.1.
- **Sin barra inferior ni prefijo/sufijo/acción** en v0.1.
- **Lector de pantalla:** cómo se anuncian el aviso del contador y el error junto a `aria-describedby` está por verificar con lectores reales.

## Abierto (no bloquea el paso siguiente)

- Valores estéticos (relleno, tirador, indicador de carga): los decide coco con los tokens listados.

## Cambio por el sistema de formularios (Fase 1)

> **Revisión r02 (distribución, DECISIONS.md #171 a #184):** cambia C10; `block` se resuelve dentro de `GFormLayout`/`GFormRow`/`GFieldGroup` (C2). Pendiente de **bruno** (marcado) y **coco** (pistas). Ver `form.md` §4, §10 y «Migración desde la Fase 1».

**Origen:** `design/contracts/form.md` §10 (DECISIONS.md #153, #158, #164, #165). **Estado:** aprobado por lima; pendiente de **bruno** (`.vue`, pruebas, `meta.json`) y **coco** (CSS). Lo que aquí se dice **sustituye** a lo anterior de este contrato donde choque; fuera de `GForm` el componente se ve y se comporta como hoy salvo C4, C5, C6 y C7, que aplican siempre.

| # | Cambio | Detalle |
| --- | --- | --- |
| C1 | Lee el contexto con `useFormField()` | `density`, `readonly`, `disabled`, `block` y `error` pasan a default `undefined`; valor = prop explícita › contexto de `GForm` › default de siempre. Error por `name` desde `errors` de `GForm` (y `warnings`), con su momento (`showErrorsOn`) |
| C2 | `block` en la rejilla | Dentro de `GFormLayout`, `GFormRow` o `GFieldGroup`, `block` resuelto a `true`. |
| C3 | Marcas | Como `GInput`: «(opcional)» en `g-textarea__optional` o asterisco según `marks`; prop nueva **`mark`**; sin marca si es `readonly` o `disabled`. |
| C4 | Región de mensaje unificada | `g-textarea__error` / `ID-error` pasa a **`g-textarea__message`** / `ID-message`: un hueco para error, advertencia o válido, siempre presente; `aria-live` = `live` del contexto (`polite`, u `off` mientras se escriben mensajes revelados por un envío; fuera de `GForm`, `polite`). Dentro: `GIcon` (`g-textarea__message-icon`) + prefijo oculto `g-textarea__message-type` (`labels.error\|warning\|valid` de `GForm`; fuera, sin prefijo) + texto. `aria-describedby` incluye `ID-message` mientras haya mensaje. Vacía = **sin nodos de texto** (el CSS usa `:not(:empty)`; un comentario de Vue vale, un espacio no). El slot `error` se conserva. La región del contador (`g-textarea__count-live`) no cambia. |
| C5 | Estados `warning` y `valid` | Props nuevas **`warning`** y **`valid`** (String, sin valor). Sin `aria-invalid`; no bloquean; prioridad error › advertencia › válido. Clases `is-warning`, `is-valid` en la raíz. Borde de estilo distinto del error (no solo color) |
| C6 | Iconos | Error **`circle-alert`** (antes `triangle-alert`), advertencia `triangle-alert`, válido `circle-check` (`icons.md`) |
| C7 | Solo lectura homogéneo | Contraste completo (`--g-color-text`, sin opacidad), fondo `--g-color-neutral-soft` (#186; antes `surface-sunken`), marcador `text-muted`, borde **discontinuo** `--g-color-border-control`, cursor normal, enfocable; distinto de `disabled` sin depender del color (#165). Semántica nativa sin cambios. |
| C8 | Manejadores primero | `mergeProps(handlers, propios, attrs)` con prueba de orden. |
| C9 | Registro | Con `name` en `$attrs`, se registra (`control` = `<textarea>`). |
| C10 | **Tres hijos: etiqueta, caja, pie** (r02, #176; sustituye a las cuatro pistas) | La raíz tiene exactamente tres hijos en flujo: `g-textarea__label`, la caja (`g-textarea__control` (`__count-live` pasa dentro del pie, siempre presente)) y el pie nuevo **`g-textarea__support`**, que agrupa ayuda (y contador) y la región `g-textarea__message` (siempre presente). Dentro de una `GFormRow`, coco coloca las tres partes en las pistas compartidas (`subgrid`; etiqueta apoyada abajo y nunca recortada; `form.md` §4, C12) |

**«(opcional)»:** un espacio de texto antes del `<span>` de la marca (sin margen en CSS). Advertencia en cajas: borde discontinuo doble; error, continuo doble; válido, continuo sencillo (coco, #169).

**Clases nuevas** (contrato bruno–coco): `g-textarea__support` (r02), `g-textarea__optional`, `g-textarea__message`, `__message-icon`, `__message-type`, `is-warning`, `is-valid` (`g-textarea__error` desaparece). Sin prefijo ni sufijo (#50).

**Marca fuera de `GForm` (#170):** sin contexto, el asterisco con `required` se pinta como antes aunque el campo sea `readonly` o `disabled`; la regla «solo campos editables llevan marca» rige solo dentro de `GForm`.
