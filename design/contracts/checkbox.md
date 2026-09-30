# Contrato · GCheckbox y GCheckboxGroup

**Dueño:** lima · **Estado:** aprobado · **Basado en:** `design/lab/checkbox/r01/` (kiwi)
**Tags:** `g-checkbox`, `g-checkbox-group` · **Categoría:** entradas

Casilla de verificación con tres estructuras (`layout`: `default`, `card`, `chip`) y un grupo con casilla maestra y conteo. Alcance decidido por el usuario (DECISIONS.md #36): entran tarjeta, grupo con maestra y chip; el detalle condicional queda fuera de v0.1.

---

# GCheckbox

## Props

| Prop | Tipo | Valores | Default | Origen |
| --- | --- | --- | --- | --- |
| `modelValue` | Boolean \| Array | | `false` | compartida |
| `value` | String \| Number | | sin valor | propia |
| `indeterminate` | Boolean | | `false` | propia |
| `layout` | String | `default` `card` `chip` | `default` | propia |
| `size` | String | `xs` `sm` `md` `lg` `xl` | `md` | compartida |
| `density` | String | `default` `comfortable` `compact` | `default` | compartida |
| `color` | String | `brand` `accent` `neutral` `success` `warning` `danger` `info` | `brand` | compartida |
| `disabled` | Boolean | | `false` | compartida |
| `readonly` | Boolean | | `false` | compartida (precisada en `api.md`) |
| `required` | Boolean | | `false` | propia |
| `label` | String | texto libre | sin valor | propia |
| `hint` | String | texto libre | sin valor | propia |
| `error` | String | texto libre | sin valor | propia |
| `id` | String | | generado | propia |

### Reglas de props

- **`modelValue` y `value`:** sin `value`, el modelo es un **booleano** (marcada = `true`). Con `value`, el modelo es un **arreglo**: la casilla está marcada si el arreglo contiene `value`, y al alternar se emite un arreglo nuevo con el valor agregado o quitado (mismo criterio que el `<input type="checkbox">` nativo con `v-model`). Dentro de un `GCheckboxGroup`, manda el modelo del grupo y `value` es obligatorio.
- **`indeterminate`:** estado mixto. El componente lo aplica a la **propiedad** `indeterminate` del `<input>` (no existe como atributo HTML), de modo que las tecnologías de asistencia lo anuncian como `mixed`. Al activar la casilla, el navegador la pasa a marcada y apaga `indeterminate`; el componente emite `update:indeterminate` con `false` y vuelve a aplicar el valor que tenga el prop. Quien no actualice el prop, ve la casilla mixta otra vez.
- **`layout`:** estructura, no estilo: `default` (cuadro y texto en fila), `card` (todo el control es una tarjeta con icono, título, descripción y dato destacado) y `chip` (chip con ✓ al marcar). La `variant` compartida (`solid soft outline ghost link`) **no** aplica a casillas (DECISIONS.md #36).
- **`color`:** color del relleno de la casilla marcada (y de la tarjeta o chip seleccionados). El error usa siempre `danger`.
- **`disabled`:** atributo nativo en el `<input>`; sin foco, sin envío.
- **`readonly`:** el `<input type="checkbox">` no admite `readonly` nativo. El componente pone `aria-readonly="true"`, cancela el cambio (`preventDefault` en el clic y en Espacio) y **no** emite `update:modelValue`. La casilla sigue enfocable.
- **`required`:** atributo nativo `required` y una marca visual `aria-hidden` junto a la etiqueta.
- **`label`:** el componente necesita un nombre accesible. Sin `label`, sin slot `label` y sin `aria-label` ni `aria-labelledby` (en `$attrs`), en desarrollo se emite `console.warn`. En producción no hay advertencia.
- **`hint`:** texto de ayuda. En `card` es la **descripción** de la tarjeta.
- **`error`:** si tiene valor (cadena no vacía), la casilla está en estado inválido: `aria-invalid="true"` en el `<input>`, clase `is-invalid` y mensaje visible. **El componente no valida.**
- **`id`:** si no se da, se genera uno estable (`useId`); de él derivan los ids de etiqueta, ayuda, dato destacado y error.
- **Resto de atributos** (`name`, `form`, `aria-*`, `data-*`, escuchas de eventos): van al `<input>`, **no** a la raíz. `class` y `style` van a la raíz (`inheritAttrs: false`).

## Estructura accesible

```html
<div class="g-checkbox g-checkbox--layout-default …">
  <label class="g-checkbox__row" for="ID">
    <input class="g-checkbox__input" type="checkbox" id="ID" aria-labelledby="ID-label ID-meta" aria-describedby="ID-hint ID-error" aria-invalid="true" aria-readonly="true" required>
    <span class="g-checkbox__icon" aria-hidden="true">…</span>            <!-- solo card, si hay slot icon -->
    <span class="g-checkbox__text">
      <span class="g-checkbox__label" id="ID-label">Acepto los términos<span class="g-checkbox__required" aria-hidden="true">*</span></span>
      <span class="g-checkbox__hint" id="ID-hint">…</span>
    </span>
    <span class="g-checkbox__meta" id="ID-meta">$99</span>                <!-- solo card, si hay slot meta -->
  </label>
  <div class="g-checkbox__error" id="ID-error" aria-live="polite">Debes aceptar…</div>
</div>
```

- El `<input>` nativo es el control: lleva el foco, el estado y el teclado. Se **dibuja** (`appearance: none`) o, en `chip`, se superpone al chip con `opacity: 0` (nunca `display: none`). Lo escribe coco.
- **Nombre accesible:** `aria-labelledby` lista `ID-label` y, si hay dato destacado, `ID-meta` (el precio forma parte del nombre). La ayuda queda **fuera** del nombre y se anuncia como descripción (`aria-describedby`).
- `aria-describedby` lista `ID-hint` si hay ayuda e `ID-error` solo mientras hay error.
- La región `ID-error` (`aria-live="polite"`) **se renderiza siempre**, fuera del `<label>`, vacía mientras no hay error (WCAG 4.1.3). El error se muestra con texto y una señal no cromática (marca), nunca solo con color (WCAG 1.4.1).
- **La fila completa** (`<label>`) es el objetivo de toque. En `card` es toda la tarjeta. **Sin contenido interactivo** (botones, enlaces, campos) dentro del `<label>`, en ninguna estructura.
- El icono de la tarjeta se envuelve con `aria-hidden="true"`; el dato destacado **no**.
- **Altura real ≥ 44px con `pointer: coarse`**, sin importar `density`: la fila es el objetivo. El cuadro se mantiene pequeño.
- El estado no depende solo del color: la marca cambia de forma (✓ / −), el chip muestra ✓, y la tarjeta cambia el grosor del borde.

## Eventos

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `update:modelValue` | `Boolean` o `Array` | El usuario alterna la casilla (no con `readonly`) |
| `update:indeterminate` | `false` | El usuario activa una casilla indeterminada |

**Nota para bruno:** los demás eventos (`focus`, `blur`, `change`, `keydown`…) **no se declaran**: como los atributos van al `<input>`, las escuchas del consumidor llegan al elemento nativo con su `Event` nativo. Solo los dos eventos anteriores van en `emits`.

## Slots

| Slot | Propósito | Anatomía que debe conservar |
| --- | --- | --- |
| `label` | Etiqueta con contenido rico (sustituye a `label`) | Dentro de `ID-label`; nunca elementos interactivos |
| `hint` | Ayuda o descripción con contenido rico (sustituye a `hint`) | Conserva el `id` `ID-hint` |
| `error` | Mensaje de error con contenido rico | Solo se muestra si `error` tiene valor; conserva el `id` `ID-error` y la región viva |
| `icon` | Icono de la tarjeta | Solo en `layout="card"`. Decorativo: el componente lo envuelve con `aria-hidden="true"` |
| `meta` | Dato destacado de la tarjeta (precio, plazo) | Solo en `layout="card"`. Forma parte del nombre accesible. Nunca elementos interactivos |

## Teclado

| Tecla | Acción |
| --- | --- |
| Tab / Shift+Tab | Entra y sale en el orden del documento |
| Espacio | Alterna la casilla (nativo). En una indeterminada, la pasa a marcada |

Enter **no** alterna una casilla (comportamiento nativo; dentro de un formulario, envía). Sin manejadores de teclado propios, salvo el bloqueo de `readonly`.

---

# GCheckboxGroup

Agrupa casillas, mantiene un modelo de arreglo, y opcionalmente muestra una **casilla maestra** derivada de las hijas y un **conteo** anunciado en una región viva.

```vue
<g-checkbox-group v-model="elegidas" label="Reservas" select-all select-all-label="Seleccionar todas" :count-text="(n, t) => `${n} de ${t} seleccionadas`">
  <g-checkbox v-for="r in reservas" :key="r.id" :value="r.id" :label="r.nombre" />
</g-checkbox-group>
```

## Props

| Prop | Tipo | Valores | Default | Origen |
| --- | --- | --- | --- | --- |
| `modelValue` | Array | | `[]` | compartida |
| `label` | String | texto libre | sin valor | propia |
| `hint` | String | texto libre | sin valor | propia |
| `error` | String | texto libre | sin valor | propia |
| `selectAll` | Boolean | | `false` | propia |
| `selectAllLabel` | String | texto libre | sin valor | propia |
| `countText` | Function | `(seleccionadas: number, total: number) => string` | sin valor | propia |
| `size` | String | `xs` `sm` `md` `lg` `xl` | `md` | compartida |
| `density` | String | `default` `comfortable` `compact` | `default` | compartida |
| `color` | String | `brand` `accent` `neutral` `success` `warning` `danger` `info` | `brand` | compartida |
| `layout` | String | `default` `card` `chip` | `default` | propia |
| `disabled` | Boolean | | `false` | compartida |
| `id` | String | | generado | propia |

### Reglas de props

- **Elemento:** `<fieldset>` con `<legend>` para `label`: es el agrupamiento nativo, con rol `group` y nombre accesible. `disabled` pone el atributo nativo del `<fieldset>`, que deshabilita a todas las hijas.
- **`label`:** el grupo necesita nombre. Sin `label`, sin slot `label` y sin `aria-label` ni `aria-labelledby`, en desarrollo se emite `console.warn`.
- **Propagación:** `size`, `density`, `color`, `layout` y `disabled` del grupo pasan a las hijas por `provide/inject`; una hija puede sobrescribirlos. Con `layout="chip"`, las hijas se disponen en fila que salta de línea; con `card`, en cuadrícula (coco decide el detalle).
- **`selectAll` y `selectAllLabel`:** con `selectAll`, se renderiza una casilla maestra arriba de la lista. **`selectAllLabel` no tiene valor por defecto** (Grana es internacional; mismo criterio que `loadingText`). Sin ella, en desarrollo se emite `console.warn` y la maestra no se muestra.
- **Estado de la maestra (derivado):** solo considera las hijas **habilitadas**. Todas marcadas → marcada; ninguna → sin marcar; algunas → **mixta** (`indeterminate`). Al activarla, marca todas las habilitadas (si estaba sin marcar o mixta) o desmarca todas (si estaba marcada). Las hijas deshabilitadas no cambian.
- **`aria-controls`:** la maestra lo lleva con los ids de las hijas habilitadas.
- **`countText`:** función que devuelve el texto del conteo (por ejemplo, "3 de 5 seleccionadas"). **Sin valor por defecto**, por internacionalización. Sin ella, no se muestra conteo. Se llama con las seleccionadas y el total de hijas **habilitadas**, también con 0.
- **Conteo accesible:** el texto vive en una región `aria-live="polite"` que **se renderiza siempre** (vacía si no hay `countText`) y se actualiza sin mover el foco.
- **`error`:** mensaje del **grupo** (por ejemplo, "Elige al menos una"). El `<fieldset>` lo referencia con `aria-describedby`; la región del error es viva y existe siempre, como en `GCheckbox`. El grupo no valida.
- **Hijas:** cada `GCheckbox` dentro del grupo **debe** tener `value` (en desarrollo, si falta, `console.warn`). Se registran en el grupo al montarse y se quitan al desmontarse; no hay lista de opciones paralela.
- **`modelValue`:** arreglo de los `value` marcados; el orden lo decide el consumidor (el componente agrega al final).

## Estructura accesible

```html
<fieldset class="g-checkbox-group …" aria-describedby="ID-hint ID-error" disabled>
  <legend class="g-checkbox-group__label">Reservas</legend>
  <div class="g-checkbox-group__head">
    <div class="g-checkbox …">…</div>                               <!-- maestra: un GCheckbox con aria-controls, solo con selectAll -->
    <span class="g-checkbox-group__count" aria-live="polite">3 de 5 seleccionadas</span>
  </div>
  <div class="g-checkbox-group__list">
    <div class="g-checkbox …">…</div>                               <!-- hijas -->
  </div>
  <div class="g-checkbox-group__hint" id="ID-hint">…</div>
  <div class="g-checkbox-group__error" id="ID-error" aria-live="polite">…</div>
</fieldset>
```

## Eventos

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `update:modelValue` | `Array` | El usuario alterna una hija o la maestra |

## Slots

| Slot | Propósito | Anatomía que debe conservar |
| --- | --- | --- |
| `default` | Las casillas hijas | Solo `GCheckbox` (con `value`) |
| `label` | Título del grupo con contenido rico (sustituye a `label`) | Dentro del `<legend>` |
| `hint` | Ayuda del grupo con contenido rico | Conserva el `id` `ID-hint` |
| `error` | Error del grupo con contenido rico | Solo con `error`; conserva `ID-error` y la región viva |

## Teclado

Igual que `GCheckbox`: Tab recorre maestra e hijas en el orden del documento; Espacio alterna. Sin flechas (no es un grupo de radio).

---

## Tokens consumidos

| Token | Para qué |
| --- | --- |
| `--g-color-surface` | Fondo del cuadro y de la tarjeta sin marcar |
| `--g-color-border-control` | Borde del cuadro (≥ 3:1) |
| `--g-color-border-strong` | Borde de la tarjeta y del chip sin marcar; estado `disabled` |
| `--g-color-{color}`, `--g-color-on-{color}` | Relleno del cuadro marcado, y su marca |
| `--g-color-{color}-soft`, `--g-color-on-{color}-soft` | Fondo de la tarjeta seleccionada |
| `--g-color-{color}-text` | Borde de la tarjeta y del chip seleccionados |
| `--g-color-surface-sunken` | Fondo de `readonly` |
| `--g-color-text`, `--g-color-text-muted`, `--g-color-text-subtle` | Etiqueta; ayuda y conteo; estado `disabled` |
| `--g-color-danger-text` | Texto, marca y borde del error; marca de obligatorio |
| `--g-color-focus` | Anillo de foco |
| `--g-radius-xs`, `--g-radius-lg`, `--g-radius-pill` | Esquinas del cuadro; de la tarjeta; del chip |
| `--g-space-1` | Unidad del cuadro, de la fila y de la separación (ver `tokens.md` §4) |
| `--g-font-ui` | Familia |
| `--g-text-caption-size`, `--g-text-caption-line` | Ayuda, error y conteo |
| `--g-text-body-sm-size`, `--g-text-body-size`, `--g-text-action-weight` | Etiqueta según `size`; título de la tarjeta y del chip |
| `--g-border-width`, `--g-focus-width`, `--g-focus-offset` | Bordes y foco |
| `--g-duration-fast`, `--g-ease-standard` | Transición de borde y relleno |

**Tokens nuevos:** ninguno. El tamaño del cuadro se **deriva** de `--g-space-1` (ver `tokens.md` §4, agregado con este contrato). Si coco necesita otro, lo pide aquí.

## Clases (contrato entre bruno y coco)

Bruno las emite; coco las estiliza. Ninguno usa otras. Los estados marcada e indeterminada se estilizan con `:checked` e `:indeterminate` del `<input>` (y `:has()` para la tarjeta y el chip), sin clases propias.

| Clase | Elemento | Cuándo |
| --- | --- | --- |
| `g-checkbox` | Raíz (`div`) | Siempre |
| `g-checkbox--layout-{layout}` | Raíz | Siempre (incluido el defecto) |
| `g-checkbox--size-{size}` | Raíz | Siempre |
| `g-checkbox--density-{density}` | Raíz | Siempre |
| `g-checkbox--color-{color}` | Raíz | Siempre (incluido `brand`) |
| `is-disabled` | Raíz | `disabled` |
| `is-readonly` | Raíz | `readonly` |
| `is-invalid` | Raíz | `error` con valor |
| `g-checkbox__row` | `label` | Siempre |
| `g-checkbox__input` | `<input>` | Siempre |
| `g-checkbox__icon` | `span` `aria-hidden` | Solo `card` con slot `icon` |
| `g-checkbox__text` | Columna de etiqueta y ayuda | Siempre |
| `g-checkbox__label` | Etiqueta | Siempre |
| `g-checkbox__required` | `span` `aria-hidden` | `required` |
| `g-checkbox__hint` | Ayuda | Si hay ayuda |
| `g-checkbox__meta` | Dato destacado | Solo `card` con slot `meta` |
| `g-checkbox__error` | Región viva | Siempre presente |
| `g-checkbox-group` | Raíz (`fieldset`) | Siempre |
| `g-checkbox-group--layout-{layout}` | Raíz | Siempre |
| `g-checkbox-group__label` | `legend` | Si hay `label` o slot `label` |
| `g-checkbox-group__head` | Contenedor de maestra y conteo | Con `selectAll` o `countText` |
| `g-checkbox-group__count` | Región viva | Con `countText` |
| `g-checkbox-group__list` | Contenedor de hijas | Siempre |
| `g-checkbox-group__hint` | Ayuda del grupo | Si hay ayuda |
| `g-checkbox-group__error` | Región viva del grupo | Siempre presente |

## Resolución de hallazgos de r01

| # | Hallazgo | Resolución | Base |
| --- | --- | --- | --- |
| 1 | `variant` no describe estas estructuras | Prop propia `layout`: `default` `card` `chip`. `variant` no aplica. Decisión del usuario (DECISIONS.md #36) | La `variant` compartida (`solid soft outline ghost link`) es de botones y campos |
| 2 | ¿Grupo aparte o slot? | `GCheckboxGroup` como componente aparte, con `<fieldset>`/`<legend>`, `provide/inject` y registro de hijas | Agrupamiento nativo; el modelo de arreglo y la maestra son del grupo |
| 3 | ¿Valor booleano o arreglo? | Booleano por defecto; con `value`, arreglo (como `v-model` del `<input>` nativo) | Comportamiento nativo conocido |
| 4 | `readonly` no existe en el input nativo | `aria-readonly="true"` y bloqueo del cambio; precisado en `api.md` | ARIA admite `aria-readonly` en `checkbox` |
| 5 | `indeterminate` solo existe como propiedad | Prop `indeterminate` aplicado a la propiedad del DOM; `update:indeterminate` al activarla; la maestra lo deriva | Semántica nativa (`mixed`) |
| 6 | Textos traducibles del conteo | `countText` (función) y `selectAllLabel`, sin valor por defecto | Grana es internacional; criterio de `loadingText` |
| 7 | Etiqueta, ayuda y error como en `GInput` | Props `label`, `hint`, `error` y slots equivalentes; el error solo con `error` | Consistencia con `GInput` |
| 8 | Altura táctil de la fila | ≥ 44px reales con `pointer: coarse`, sin importar `density` | `tokens.md` §7 |
| 9 | Icono y dato destacado de la tarjeta | Slots `icon` (decorativo) y `meta` (parte del nombre) | El precio o el plazo identifican la opción |
| 10 | Tokens nuevos | Ninguno; el tamaño del cuadro se deriva de `--g-space-1` | Todo sale de tokens vigentes |
| 11 | Detalle condicional (propuesta C) | Fuera de v0.1; el consumidor lo compone con `v-if` | Decisión del usuario (DECISIONS.md #36) |

## Límites conocidos

- **Tarjeta y lectores de pantalla:** el nombre es `título + dato destacado` y la descripción va en `aria-describedby`; el orden de anuncio varía entre lectores.
- **Maestra y muchas hijas:** `aria-controls` con decenas de ids es válido pero su soporte es irregular; no se debe depender de él.
- **Conteo:** una región viva educada puede tardar o agruparse si se alterna muy rápido; es el comportamiento esperado.

## Abierto (no bloquea el paso siguiente)

- **Lector de pantalla real:** cómo se anuncia el estado `mixed`, el conteo del grupo y el error.
- **Estados de la tarjeta y del chip sin token propio:** coco decide cómo se ven con tokens vigentes; si no alcanza, pide token.
