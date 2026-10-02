# Contrato · GSelect

**Dueño:** lima · **Estado:** aprobado · **Basado en:** `design/lab/select/r01/` y `design/lab/select/r02/` (kiwi)
**Tag:** `g-select` · **Categoría:** entradas

Selector de una opción con lista propia (patrón *select-only combobox* de WAI-ARIA APG), con el mismo lenguaje que `GInput`: etiqueta, ayuda, error y estados. Alcance decidido por el usuario (DECISIONS.md #53 a #56): lista propia, selección única con campo completo (sin selección múltiple ni búsqueda) y hoja inferior en móvil.

## Principios

- **Un `<button role="combobox">` y una lista `role="listbox"`.** El **foco no sale del selector**: la opción activa se indica con `aria-activedescendant`.
- **La lista vive en la capa superior** (`popover="manual"`): no la recorta ningún `overflow` ni queda bajo un `<dialog>`.
- **Presenta y emite intención.** El valor es el prop; el componente emite y, si el consumidor no lo actualiza, el selector sigue mostrando el prop.
- **Sin textos por defecto** (Grana es internacional): `placeholder`, `clearLabel` y `emptyText` los pone la aplicación.

## Props

| Prop | Tipo | Valores | Default | Origen |
| --- | --- | --- | --- | --- |
| `modelValue` | String \| Number \| null | | `null` | compartida |
| `options` | Array | ver "Opciones" | `[]` | propia |
| `variant` | String | `outline` `soft` | `outline` | compartida (subconjunto, como `GInput`: DECISIONS.md #28) |
| `size` | String | `xs` `sm` `md` `lg` `xl` | `md` | compartida |
| `density` | String | `default` `comfortable` `compact` | `default` | compartida |
| `color` | String | `brand` `accent` `neutral` `success` `warning` `danger` `info` | sin valor: usa `--g-color-focus` | compartida (solo el foco) |
| `rounded` | String | `none` `xs` `sm` `md` `lg` `xl` `pill` | sin valor: `sm` | compartida |
| `block` | Boolean | | `false` | compartida |
| `disabled` | Boolean | | `false` | compartida |
| `readonly` | Boolean | | `false` | compartida |
| `loading` | Boolean | | `false` | compartida (precisada en `api.md`) |
| `placeholder` | String | texto libre | sin valor | propia |
| `clearable` | Boolean | | `false` | propia |
| `clearLabel` | String | texto libre | sin valor | propia |
| `emptyText` | String | texto libre | sin valor | propia |
| `createLabel` | String | texto libre | sin valor | propia |
| `label` | String | texto libre | sin valor | propia |
| `hint` | String | texto libre | sin valor | propia |
| `error` | String | texto libre | sin valor | propia |
| `required` | Boolean | | `false` | propia |
| `name` | String | | sin valor | propia |
| `id` | String | | generado | propia |

### Opciones

`options` es un arreglo de **opciones** y de **grupos**, mezclables:

```js
[
  { value: 'mx', label: 'México' },
  { value: 'de', label: 'Alemania', disabled: true },
  { label: 'Europa', options: [{ value: 'es', label: 'España' }, { value: 'fr', label: 'Francia' }] }
]
```

- **Opción:** `{ value, label, disabled? }`. `value` es String o Number y **único** en toda la lista (duplicados avisan en desarrollo). `label` es String obligatorio: es el texto que se muestra, se anuncia y se busca al escribir. `disabled` la hace no elegible (sigue visible).
- **Grupo:** `{ label, options }`. Un grupo no se anida. `label` es su nombre accesible.
- Una opción sin `value` o sin `label` se ignora y avisa en desarrollo.

### Reglas de props

- **`modelValue`:** el `value` de la opción elegida, comparado con `===`. `null`, `undefined` o un valor sin opción correspondiente muestra el `placeholder`. **Sin `multiple`.**
- **`variant`, `color`, `rounded`, `block`:** exactamente como `GInput`. `color` solo colorea el anillo de foco; el error usa siempre `danger`.
- **`placeholder`:** texto del selector sin valor. Sin él, el selector sin valor queda vacío (la etiqueta lo nombra igualmente).
- **`clearable`:** con valor, muestra un botón aparte para borrar (`null`). **Solo se renderiza si se da `clearLabel`** (su nombre accesible; sin valor por defecto) y, en desarrollo, `clearable` sin `clearLabel` emite `console.warn`. Con `readonly` o `disabled`, no se muestra activo.
- **`emptyText`:** mensaje de la lista sin opciones. Sin él, una lista vacía no muestra nada.
- **`createLabel`:** con texto, la lista termina con una **fila de acción** «Agregar nuevo…» (ver "Fila de agregar"). **Sin valor por defecto** (Grana es internacional); sin él no hay fila. Se recomienda un texto explícito («Agregar nuevo país…»): un lector de pantalla la anuncia como una opción más. Con `readonly` o `disabled` no hay lista, luego no hay fila.
- **`label`:** el selector exige nombre accesible. Sin `label`, sin slot `label` y sin `aria-label` ni `aria-labelledby` (en `$attrs`), en desarrollo se emite `console.warn`.
- **`error`:** con valor, el selector está inválido (`aria-invalid="true"`, clase `is-invalid`, mensaje visible). **El componente no valida.**
- **`required`:** `aria-required="true"` y una marca visual `aria-hidden`. **Límite:** el `<input type="hidden">` no participa en la validación nativa de un `<form>` (los navegadores no validan campos ocultos); quien necesite bloquear el envío lo valida y usa `error`.
- **`name`:** con `name`, el componente renderiza un `<input type="hidden" name>` con el valor (`String(value)`, o `''` sin valor), para formularios nativos. Con `disabled`, el campo oculto también.
- **`readonly`:** `aria-readonly="true"`; el selector es enfocable pero **no abre** (ni con clic ni con teclado). El valor se envía.
- **`disabled`:** atributo nativo del botón; sin foco, sin envío.
- **`loading`:** `aria-busy="true"` y un anillo. **No bloquea** la apertura ni la elección.
- **`id`:** si no se da, se genera uno estable (`useId`); de él derivan los ids de etiqueta, selector, lista, opciones, ayuda y error.
- **Resto de atributos** (`aria-*`, `data-*`, escuchas de eventos): van al **botón** (`role="combobox"`). `class` y `style` van a la raíz (`inheritAttrs: false`).

## Estructura accesible

```html
<div class="g-select g-select--variant-outline g-select--size-md g-select--density-default is-open …">
  <label class="g-select__label" id="ID-label" for="ID">País<span class="g-select__required" aria-hidden="true">*</span></label>
  <div class="g-select__control">
    <button class="g-select__button" id="ID" type="button" role="combobox"
            aria-haspopup="listbox" aria-expanded="true" aria-controls="ID-list" aria-activedescendant="ID-opt-3"
            aria-labelledby="ID-label ID" aria-describedby="ID-hint ID-error"
            aria-invalid="true" aria-required="true" aria-readonly="true" aria-busy="true">
      <span class="g-select__prepend" aria-hidden="true">…</span>    <!-- solo con el slot prepend -->
      <span class="g-select__value">                                   <!-- con placeholder: además g-select__value--placeholder -->
        <span class="g-select__icon" aria-hidden="true">…</span>       <!-- solo con el slot icon y contenido para la opción -->
        México
      </span>
      <span class="g-select__arrow" aria-hidden="true"></span>
    </button>
    <button class="g-select__clear" type="button" aria-label="Limpiar País">…</button>   <!-- clearable + clearLabel + valor -->
    <span class="g-select__loader" aria-hidden="true"></span>                                <!-- loading -->
  </div>
  <input type="hidden" name="pais" value="mx">                                              <!-- solo con name -->
  <ul class="g-select__list" id="ID-list" role="listbox" popover="manual" aria-labelledby="ID-label">
    <li class="g-select__option" id="ID-opt-0" role="option" aria-selected="true" aria-disabled="true"><span class="g-select__icon" aria-hidden="true">…</span>México</li>
    <li role="presentation"><ul class="g-select__group" role="group" aria-labelledby="ID-grp-0">
      <li class="g-select__group-label" id="ID-grp-0" role="presentation">Europa</li>
      <li class="g-select__option" id="ID-opt-1" role="option" aria-selected="false">España</li>
    </ul></li>
    <li class="g-select__empty" role="presentation">No hay opciones.</li>                 <!-- sin opciones y con emptyText -->
    <li class="g-select__option g-select__create" id="ID-opt-create" role="option" aria-selected="false">Agregar nuevo país…</li>   <!-- solo con createLabel; siempre la última -->
  </ul>
  <div class="g-select__hint" id="ID-hint">…</div>
  <div class="g-select__error" id="ID-error" aria-live="polite">…</div>
</div>
```

- **Nombre accesible del selector:** `aria-labelledby` lista el id de la etiqueta y **el propio botón**, de modo que se anuncia "País, México" (etiqueta y valor mostrado; WCAG 2.5.3).
- **Etiqueta:** `for` apunta al botón, de modo que un clic en ella lo enfoca.
- **Lista:** `popover="manual"`, siempre en el DOM (oculta cuando está cerrada). Cada opción lleva `aria-selected` (`true` solo en la elegida) y, si no es elegible, `aria-disabled="true"`. La opción activa lleva la clase `is-active` (además de ser el `aria-activedescendant` del botón).
- **`aria-describedby`** lista `ID-hint` si hay ayuda e `ID-error` solo mientras hay error.
- La región `ID-error` (`aria-live="polite"`) **se renderiza siempre**, vacía mientras no hay error (WCAG 4.1.3), con señal no cromática (marca ⚠ que un lector no lee), como `GInput`.
- **Altura real ≥ 44px con `pointer: coarse`** en el selector y en las opciones, sin importar `density`.
- **El estado no depende solo del color:** la elegida lleva ✓ y más peso, la activa un contorno, la deshabilitada opacidad y tachado.

## Fila de agregar (`createLabel`)

Para catálogos cerrados pero incompletos: la lista termina con una fila de acción que **pide** una opción nueva; el selector **no** crea nada por sí mismo (ni tiene búsqueda ni escritura).

- **Es un `role="option"`**, hijo directo del `listbox` y **fuera de los grupos**, con `aria-selected="false"`, `id` `ID-opt-create`, las clases `g-select__option` y `g-select__create`, y **siempre la última fila**. El listbox solo admite `option` y `group`: un botón dentro rompería el patrón y la navegación por `aria-activedescendant`. No es una opción de `options`: no tiene `value`, no entra en `modelValue` ni en la escritura rápida.
- **Navegación:** es la última fila **navegable**: ↓ llega a ella desde la última opción habilitada, Fin va a ella y Av Pág la cuenta como una opción más. Se resalta con `is-active`.
- **Activarla** (Enter, Espacio o clic): cierra la lista, **no cambia el valor**, devuelve el foco al botón del selector y **emite `create`** (en ese orden: el foco vuelve **antes** de emitir, así una `GDialog` que la aplicación abra desde `create` restaura el foco al selector al cerrarse). La aplicación agrega la opción a `options` y, si quiere, actualiza `modelValue`.
- **Tab** con la fila activa cierra **sin crear** (una acción no se dispara por pasar de largo); **Esc** cierra sin hacer nada.
- **Con la lista vacía**, la fila sigue visible: se muestra `emptyText` (si hay) y **debajo** la fila, activa por defecto. Con `readonly` o `disabled` no hay lista, luego no hay fila.
- **Visual (lo decide coco):** línea superior de separación, un «+» dibujado con bordes y peso de acción; en la hoja inferior, 44px.

## Posición y capa superior

- La lista se muestra con `showPopover()` (y se oculta con `hidePopover()`), anclada al selector con su **ancho mínimo** (el ancho de la caja) y **debajo**; si no cabe debajo y hay más sitio arriba, se abre **hacia arriba** (clase `is-up` en la lista). Con scroll interno, la opción activa siempre se ve.
- Bruno calcula la posición y la entrega con **variables CSS dinámicas** sobre la lista (`--_x`, `--_top`, `--_bottom`, `--_min` y `--_max`; única excepción a "sin estilos en línea"), y las recalcula al redimensionar la ventana y al desplazarse cualquier ancestro.
- **Móvil (≤ ~520px de ancho del visor):** la lista es una **hoja inferior** pegada abajo y de ancho completo, con fondo (`::backdrop`); el CSS ignora las variables de posición. Umbral literal de consulta de medios (excepción documentada: DECISIONS.md #42; ver #56).
- **Cierre por clic fuera:** un `pointerdown` fuera del selector y de la lista cierra; en la hoja, el fondo cuenta como fuera.

## Eventos

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `update:modelValue` | `String \| Number \| null` | El usuario elige una opción distinta, o borra con `clearable` (`null`) |
| `open` | | La lista se abre |
| `close` | | La lista se cierra, por el motivo que sea |
| `create` | | El usuario activa la fila «Agregar nuevo…» (`createLabel`). No cambia el valor; el foco ya volvió al selector |

**Nota para bruno:** los demás eventos (`focus`, `blur`, `keydown`…) **no se declaran**: como los atributos van al botón, las escuchas del consumidor llegan al elemento nativo. Elegir la opción ya elegida cierra sin emitir. Con `readonly` no se emite nada.

## Teclado

| Tecla | Acción |
| --- | --- |
| Tab / Shift+Tab | Entra y sale en el orden del documento: botón → botón de limpiar. Con la lista abierta, **elige la opción activa**, cierra y sigue el orden (sobre la fila «Agregar nuevo…», cierra **sin crear**) |
| Enter / Espacio / ↓ / ↑ / Alt+↓ | Con la lista cerrada: abre, con la elegida (o la primera habilitada) activa |
| ↓ / ↑ | Con la lista abierta: siguiente o anterior opción **habilitada** (no cicla; saltan encabezados y deshabilitadas). La fila «Agregar nuevo…» cuenta como la última |
| Inicio / Fin | Primera o última fila habilitada (con `createLabel`, Fin va a la fila «Agregar nuevo…») |
| Re Pág / Av Pág | Diez opciones habilitadas hacia atrás o adelante |
| Enter | Con la lista abierta: elige la activa, cierra y devuelve el foco al selector. Sobre la fila «Agregar nuevo…»: cierra, devuelve el foco y emite `create` (sin cambiar el valor) |
| Espacio | Con la lista abierta: elige, salvo que se esté escribiendo un prefijo (entonces es un carácter más) |
| Esc | Cierra **sin cambiar**; el foco sigue en el selector |
| Carácter imprimible | Abre la lista si estaba cerrada y activa la siguiente opción cuyo texto empieza así; varios seguidos (< ~500ms) forman el prefijo; sin coincidencia, no cambia. **No considera la fila «Agregar nuevo…»** |
| Enter / Espacio en el botón de limpiar | Borra el valor y devuelve el foco al selector |

El foco **nunca** sale del selector mientras la lista está abierta. Sin manejadores de teclado propios en las opciones.

## Slots

| Slot | Propósito | Alcance | Anatomía que debe conservar |
| --- | --- | --- | --- |
| `label` | Etiqueta con contenido rico (sustituye a `label`) | | Dentro del `<label>`; nunca interactivos |
| `hint` | Ayuda con contenido rico | | Conserva el `id` `ID-hint` |
| `error` | Mensaje de error con contenido rico | | Solo con `error`; conserva el `id` y la región viva |
| `option` | Contenido de una opción | `{ option, selected, active }` | Dentro del `<li role="option">`; nunca interactivos; el texto sigue siendo `option.label` para el typeahead |
| `value` | Contenido del valor mostrado | `{ option }` | Solo con una opción elegida; dentro de `g-select__value`; sin interactivos |
| `empty` | Contenido de la lista vacía | | Sustituye a `emptyText` |
| `prepend` | Icono antes del valor | | Decorativo: el componente lo envuelve en `g-select__prepend` (`aria-hidden`), **dentro del botón**, antes del valor. Con una opción elegida que tenga icono, este último **sustituye al prefijo** (una sola posición inicial) |
| `icon` | Icono de una opción | `{ option }` | Decorativo: se envuelve en `g-select__icon` (`aria-hidden`) y se usa **antes del texto de cada opción** y **junto al valor mostrado**. El `span` solo se renderiza si el slot devuelve contenido para esa opción (una opción sin icono no reserva espacio). Si se usa el slot `option` (o `value`), este reemplaza el contenido completo y el `icon` no se usa en esa zona |

Los iconos de `prepend`, `icon`, `option` y `value` son decorativos. Los de `prepend` e `icon` los envuelve el componente con `aria-hidden`; los que el consumidor ponga dentro de `option` y `value` los marca él. **Los iconos no forman parte del nombre accesible:** el selector sigue anunciándose como etiqueta + texto del valor.

## Tokens consumidos

Los mismos que `GInput` (`design/contracts/input.md`, "Tokens consumidos"), sin los del botón de acción ni contraseña, más los de la lista:

| Token | Para qué |
| --- | --- |
| `--g-color-surface` | Fondo de la lista flotante |
| `--g-color-border-control`, `--g-color-border-strong` | Borde de la lista |
| `--g-shadow-2` | Sombra de la lista flotante |
| `--g-radius-md` | Esquinas de la lista y de la opción activa |
| `--g-color-surface-sunken` | Opción activa |
| `--g-color-text`, `--g-color-text-muted`, `--g-color-text-subtle` | Opción; encabezado de grupo; opción deshabilitada |
| `--g-surface-shell`, `--g-surface-inset`, `--g-surface-gap`, `--g-surface-radius`, `--g-surface-radius-inset`, `--g-surface-backdrop` | Hoja inferior en móvil (mismo sistema de superficies que `GDialog`, `tokens.md` §11) |
| `--g-duration-fast`, `--g-ease-standard`, `--g-ease-out`, `--g-duration-press` | Cambios de estado; aparición de la lista |

**Tokens nuevos:** ninguno. La **altura de la opción** sale de la caja del mismo `size` y `density` (`tokens.md` §4) con piso de 24px y 44px con `pointer: coarse`; el **alto máximo** de la lista es de unas 8 opciones (derivado de esa altura) o el 60% del visor.

## Clases (contrato entre bruno y coco)

Bruno las emite; coco las estiliza. Ninguno usa otras.

| Clase | Elemento | Cuándo |
| --- | --- | --- |
| `g-select` | Raíz (`div`) | Siempre |
| `g-select--variant-{variant}` | Raíz | Siempre |
| `g-select--size-{size}` | Raíz | Siempre |
| `g-select--density-{density}` | Raíz | Siempre |
| `g-select--color-{color}` | Raíz | Solo si el prop tiene valor |
| `g-select--rounded-{rounded}` | Raíz | Solo si el prop tiene valor |
| `g-select--block` | Raíz | `block` |
| `is-open` | Raíz | Lista abierta |
| `is-disabled`, `is-readonly`, `is-invalid`, `is-loading` | Raíz | Según las props |
| `g-select__label`, `g-select__required` | Etiqueta; marca | Si hay `label`; `required` |
| `g-select__control` | Caja | Siempre |
| `g-select__button` | Botón `combobox` | Siempre |
| `g-select__value` | Valor mostrado | Siempre |
| `g-select__value--placeholder` | Valor mostrado | Sin opción elegida |
| `g-select__prepend` | Prefijo decorativo (`aria-hidden`) | Con el slot `prepend` |
| `g-select__icon` | Icono decorativo (`aria-hidden`) de una opción y del valor mostrado | Con el slot `icon` y contenido para esa opción |
| `g-select__arrow` | Flecha decorativa | Siempre |
| `g-select__clear` | Botón de limpiar | `clearable` con `clearLabel` y valor |
| `g-select__loader` | Anillo | `loading` |
| `g-select__list` | Lista (`ul`, `popover`) | Siempre |
| `is-up` | Lista | Se abre hacia arriba |
| `g-select__option` | Opción (`li`) | Por cada opción |
| `is-active` | Opción | Opción activa |
| `g-select__group`, `g-select__group-label` | Grupo y su encabezado | Por cada grupo |
| `g-select__empty` | Mensaje de lista vacía | Sin opciones y con `emptyText` o slot `empty` |
| `g-select__create` | La fila «Agregar nuevo…» (además de `g-select__option`; también lleva `is-active` cuando está activa) | Con `createLabel` |
| `g-select__hint`, `g-select__error` | Ayuda; región viva del error | Si hay ayuda; siempre |

El estado elegida y deshabilitada de una opción se estiliza con `aria-selected` y `aria-disabled`, sin clases propias.

## Resolución de hallazgos de r01

| # | Hallazgo | Resolución | Base |
| --- | --- | --- | --- |
| 1 | `variant` | `outline` y `soft` | DECISIONS.md #28 |
| 2 | Opciones | Prop `options` con opciones y grupos | Decisión del usuario (DECISIONS.md #53, #54) |
| 3 | Valor | `value` de la opción; `null` = sin valor; sin `multiple` | Alcance decidido por el usuario |
| 4 | Textos | `placeholder`, `clearLabel`, `emptyText`; sin valor por defecto | Internacionalización (mismo criterio que `loadingText`) |
| 5 | `name` | `<input type="hidden">` con el valor; el resto de atributos, al botón | Un botón no envía valor |
| 6 | Eventos | `update:modelValue`, `open`, `close` | Sin `change` propio |
| 7 | Slots | `option`, `value`, `empty`, `label`, `hint`, `error` | Contenido rico sin interactivos |
| 8 | `loading`, `readonly`, `disabled` | Como `GInput` | Coherencia |
| 9 | Umbral móvil | Consulta de medios literal (~520px) | DECISIONS.md #42 |
| 10 | Superficie de la lista | Lista flotante con `--g-color-surface` y `--g-shadow-2`; hoja móvil con `--g-surface-*` | Reutiliza el sistema de superficies (DECISIONS.md #43) |
| 11 | Lector táctil en móvil | Por verificar en la auditoría; alternativa: foco real en la lista | Riesgo conocido de `aria-activedescendant` |

## Resolución de hallazgos de r02

| # | Hallazgo | Resolución | Base |
| --- | --- | --- | --- |
| 1 | Cómo se pide la fila | Prop `createLabel` (sin valor por defecto) y evento `create` sin datos | Decisión del usuario (DECISIONS.md #57) |
| 2 | La fila en el modelo | `role="option"` con `aria-selected="false"`, sin `value`, fuera de los grupos y siempre última; no entra en `options`, en `modelValue` ni en el typeahead | Patrón APG: el listbox solo admite `option` y `group` |
| 3 | Prefijo | Slot `prepend` dentro del botón | Decisión del usuario (DECISIONS.md #58); como `GInput` |
| 4 | Icono de opción | Slot `icon` con `{ option }`, para la lista y el valor; el de la opción elegida sustituye al prefijo | Decisión del usuario (DECISIONS.md #58) |
| 5 | Relación con `option`/`value` | Si se usan, reemplazan el contenido completo; `icon` no se usa en esa zona | Evitar dos iconos |
| 6 | Teclado | ↓ y Fin alcanzan la fila; Enter, Espacio y clic la activan; Tab y Esc no crean; el typeahead la ignora | Una acción no se dispara por pasar de largo |
| 7 | Foco tras `create` | Vuelve al botón antes de emitir | WCAG 2.4.3; un diálogo de la aplicación restaura el foco al selector |
| 8 | Sin lista con `readonly` o `disabled` | Sin fila | Coherencia |

## Límites conocidos

- **Sin selección múltiple ni búsqueda** en v0.1 (otro patrón ARIA: combobox editable / listbox múltiple). Tampoco se crea una opción escribiendo: solo se **pide** con «Agregar nuevo…».
- **La fila «Agregar nuevo…» se anuncia como una opción más** («…, opción 7 de 7»); el texto de `createLabel` debe ser explícito. Por verificar con lectores reales.
- **Sin sufijo** antes de la flecha en v0.1.
- **Sin validación nativa de `required`** (el campo oculto no se valida).
- **Sin virtualización:** listas de miles de opciones pueden ser lentas.
- **Lectores de pantalla táctiles en móvil:** `aria-activedescendant` puede no exponer las opciones de la hoja inferior (por verificar).
- **Teclado virtual y hoja inferior:** por verificar en dispositivo real.
- **Navegadores:** exige `popover`, `::backdrop` de popover y `:popover-open` (los actuales).

## Abierto (no bloquea el paso siguiente)

- Valores estéticos (lista, sombra, opción activa, hoja móvil, flecha): los decide coco con los tokens listados.

## Cambio por el sistema de formularios (Fase 1)

> **Revisión r02 (distribución, DECISIONS.md #171 a #184):** cambia C10; `block` se resuelve dentro de `GFormLayout`/`GFormRow`/`GFieldGroup` (C2). Pendiente de **bruno** (marcado) y **coco** (pistas). Ver `form.md` §4, §10 y «Migración desde la Fase 1».

**Origen:** `design/contracts/form.md` §10 (DECISIONS.md #153, #158, #164, #165). **Estado:** aprobado por lima; pendiente de **bruno** (`.vue`, pruebas, `meta.json`) y **coco** (CSS). Lo que aquí se dice **sustituye** a lo anterior de este contrato donde choque; fuera de `GForm` el componente se ve y se comporta como hoy salvo C4, C5, C6 y C7, que aplican siempre.

| # | Cambio | Detalle |
| --- | --- | --- |
| C1 | Lee el contexto con `useFormField()` | `density`, `readonly`, `disabled`, `block` y `error` pasan a default `undefined`; valor = prop explícita › contexto de `GForm` › default de siempre. Error por `name` desde `errors` de `GForm` (y `warnings`), con su momento (`showErrorsOn`) |
| C2 | `block` en la rejilla | Dentro de `GFormLayout`, `GFormRow` o `GFieldGroup`, `block` resuelto a `true`. |
| C3 | Marcas | Como `GInput`: «(opcional)» en `g-select__optional` (dentro de la etiqueta, que nombra el `combobox`) o asterisco según `marks`; prop nueva **`mark`**. |
| C4 | Región de mensaje unificada | `g-select__error` / `ID-error` pasa a **`g-select__message`** / `ID-message`: un hueco para error, advertencia o válido, siempre presente; `aria-live` = `live` del contexto (`polite`, u `off` mientras se escriben mensajes revelados por un envío; fuera de `GForm`, `polite`). Dentro: `GIcon` (`g-select__message-icon`) + prefijo oculto `g-select__message-type` (`labels.error\|warning\|valid` de `GForm`; fuera, sin prefijo) + texto. `aria-describedby` incluye `ID-message` mientras haya mensaje. Vacía = **sin nodos de texto** (el CSS usa `:not(:empty)`; un comentario de Vue vale, un espacio no). El slot `error`, si existe, se conserva. |
| C5 | Estados `warning` y `valid` | Props nuevas **`warning`** y **`valid`** (String, sin valor). Sin `aria-invalid`; no bloquean; prioridad error › advertencia › válido. Clases `is-warning`, `is-valid` en la raíz. Borde de estilo distinto del error (no solo color) |
| C6 | Iconos | Error **`circle-alert`** (antes `triangle-alert`), advertencia `triangle-alert`, válido `circle-check` (`icons.md`) |
| C7 | Solo lectura homogéneo | Contraste completo (`--g-color-text`, sin opacidad), fondo `--g-color-surface-sunken`, borde **discontinuo** `--g-color-border-control`, cursor normal, enfocable; distinto de `disabled` sin depender del color (#165). El texto del valor, seleccionable (`user-select: text`) donde el navegador lo permita dentro del botón; `aria-readonly` sin cambios. |
| C8 | Manejadores primero | `mergeProps(handlers, propios, attrs)` sobre el botón `combobox`, con prueba de orden. |
| C9 | Registro | Con `name`, se registra (`control` = botón `combobox`); al elegir llama a `notifyChange()` (no hay `input` nativo que burbujee): marca `dirty` y, como control de elección, revela su error al cambiar. **Límite:** sin autocompletado del navegador (#54). |
| C10 | **Tres hijos: etiqueta, caja, pie** (r02, #176; sustituye a las cuatro pistas) | La raíz tiene exactamente tres hijos en flujo: `g-select__label`, la caja (`g-select__control` (el `<input type="hidden">` y la lista emergente quedan fuera de flujo)) y el pie nuevo **`g-select__support`**, que agrupa ayuda (y contador) y la región `g-select__message` (siempre presente). Dentro de una `GFormRow`, coco coloca las tres partes en las pistas compartidas (`subgrid`; etiqueta apoyada abajo y nunca recortada; `form.md` §4, C12) |

**«(opcional)»:** un espacio de texto antes del `<span>` de la marca (sin margen en CSS). Advertencia en cajas: borde discontinuo doble; error, continuo doble; válido, continuo sencillo (coco, #169).

**Clases nuevas** (contrato bruno–coco): `g-select__support` (r02), `g-select__optional`, `g-select__message`, `__message-icon`, `__message-type`, `is-warning`, `is-valid` (`g-select__error` desaparece).

**Marca fuera de `GForm` (#170):** sin contexto, el asterisco con `required` se pinta como antes aunque el campo sea `readonly` o `disabled`; la regla «solo campos editables llevan marca» rige solo dentro de `GForm`.
