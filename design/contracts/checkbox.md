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
| `field` | Boolean | | `true` | propia (#262) |
| `id` | String | | generado | propia |

### Reglas de props

- **`modelValue` y `value`:** sin `value`, el modelo es un **booleano** (marcada = `true`). Con `value`, el modelo es un **arreglo**: la casilla está marcada si el arreglo contiene `value`, y al alternar se emite un arreglo nuevo con el valor agregado o quitado (mismo criterio que el `<input type="checkbox">` nativo con `v-model`). Dentro de un `GCheckboxGroup`, manda el modelo del grupo y `value` es obligatorio.
- **`indeterminate`:** estado mixto. El componente lo aplica a la **propiedad** `indeterminate` del `<input>` (no existe como atributo HTML), de modo que las tecnologías de asistencia lo anuncian como `mixed`. Al activar la casilla, el navegador la pasa a marcada y apaga `indeterminate`; el componente emite `update:indeterminate` con `false` y vuelve a aplicar el valor que tenga el prop. Quien no actualice el prop, ve la casilla mixta otra vez.
- **`layout`:** estructura, no estilo: `default` (cuadro y texto en fila), `card` (todo el control es una tarjeta con icono, título, descripción y dato destacado) y `chip` (chip con ✓ al marcar). La `variant` compartida (`solid soft outline ghost link`) **no** aplica a casillas (DECISIONS.md #36).
- **`color`:** color del relleno de la casilla marcada (y de la tarjeta o chip seleccionados). El error usa siempre `danger`.
- **`disabled`:** atributo nativo en el `<input>`; sin foco, sin envío.
- **`readonly`:** el `<input type="checkbox">` no admite `readonly` nativo. El componente pone `aria-readonly="true"`, cancela el cambio (`preventDefault` en el clic y en Espacio) y **no** emite `update:modelValue`. La casilla sigue enfocable.
- **`required`:** **`aria-required="true"`** en el `<input>` (nunca el atributo nativo `required`, #270) y una marca visual `aria-hidden` junto a la etiqueta. Con `field: false` se ignora (#262). Límite: un `<form>` nativo sin `GForm` no bloquea el envío por una casilla obligatoria sin marcar; la aplicación valida y pasa `error` (como `GSelect`).
- **`label`:** el componente necesita un nombre accesible. Sin `label`, sin slot `label` y sin `aria-label` ni `aria-labelledby` (en `$attrs`), en desarrollo se emite `console.warn`. En producción no hay advertencia.
- **`hint`:** texto de ayuda. En `card` es la **descripción** de la tarjeta.
- **`error`:** si tiene valor (cadena no vacía), la casilla está en estado inválido: `aria-invalid="true"` en el `<input>`, clase `is-invalid` y mensaje visible. **El componente no valida.**
- **`field`** (#262): con `true` (por defecto) la casilla es un **campo de formulario**: región de mensaje siempre presente (C4) y contexto de `GForm` (C1, C3, C9). Con **`false`** es un **control suelto dentro de otro componente** (selección de filas de una colección, opciones de una vista): **sin región `g-checkbox__message`** (ni `aria-live`), **sin leer el contexto de `GForm`** (no se registra ni hereda `density`, `readonly`, `disabled`, errores ni marcas) y sin marca de `required`. `error`, `warning`, `valid`, `required` y `mark` se **ignoran con aviso** en desarrollo. Todo lo demás igual (`label` o `aria-label`, `size`, `indeterminate`, `disabled`, `readonly` propios, `v-model`, manejadores primero, C8). Lo usan los componentes que repiten una casilla por elemento (`GTranscript`, `speech.md` §22.5): con 320 filas, 320 regiones vivas vacías son el mismo problema que #257 resolvió en `GBtn`.
- **`id`:** si no se da, se genera uno estable (`useId`); de él derivan los ids de etiqueta, ayuda, dato destacado y error.
- **Resto de atributos** (`name`, `form`, `aria-*`, `data-*`, escuchas de eventos): van al `<input>`, **no** a la raíz. `class` y `style` van a la raíz (`inheritAttrs: false`).

## Estructura accesible

```html
<div class="g-checkbox g-checkbox--layout-default …">
  <label class="g-checkbox__row" for="ID">
    <input class="g-checkbox__input" type="checkbox" id="ID" aria-labelledby="ID-label ID-meta" aria-describedby="ID-hint ID-error" aria-invalid="true" aria-readonly="true" aria-required="true">
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
| `--g-color-{color}`, `--g-color-on-{color}` | Relleno del cuadro marcado e indeterminado y del chip marcado, y su marca y texto |
| `--g-color-{color}-soft`, `--g-color-on-{color}-soft` | Fondo de la tarjeta seleccionada |
| `--g-color-{color}-text` | **Contorno** del cuadro marcado e indeterminado y del chip marcado (`tokens.md` §7.1, #431); borde de la tarjeta seleccionada |
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

## Cambio por el sistema de formularios (Fase 1)

> **Revisión r02 (distribución, DECISIONS.md #171 a #184):** cambia C10 (no aplica); `block` se resuelve dentro de `GFormLayout`/`GFormRow`/`GFieldGroup` (C2). Pendiente de **bruno** (marcado) y **coco** (pistas). Ver `form.md` §4, §10 y «Migración desde la Fase 1».

**Origen:** `design/contracts/form.md` §10 (DECISIONS.md #153, #158, #164, #165). **Estado:** aprobado por lima; pendiente de **bruno** (`.vue`, pruebas, `meta.json`) y **coco** (CSS). Lo que aquí se dice **sustituye** a lo anterior de este contrato donde choque; fuera de `GForm` el componente se ve y se comporta como hoy salvo C4, C5, C6 y C7, que aplican siempre.

| # | Cambio | Detalle |
| --- | --- | --- |
| C1 | Lee el contexto con `useFormField()` | En `GCheckbox`: `density`, `readonly`, `disabled` y `error`. En `GCheckboxGroup`: `density`, `disabled`, `error` y `readonly` (si el grupo lo tiene) pasan a default `undefined`; valor = prop explícita › contexto de `GForm` › default de siempre. Error por `name` desde `errors` de `GForm` (y `warnings`), con su momento (`showErrorsOn`) |
| C2 | `block` en la rejilla | **`GCheckbox` no tiene `block`** (la fila ya ocupa su ancho; no se añade la prop, #170) |
| C3 | Marcas | **`GCheckbox` suelto:** nunca «(opcional)» (sin marcar ya es una respuesta); asterisco con `required` en la convención `required`. **`GCheckboxGroup`:** marca en el `<legend>` según su `required` y la convención. Las casillas de un grupo no llevan marca. Prop nueva **`mark`** en ambos. |
| C4 | Región de mensaje unificada | `g-checkbox__error` / `ID-error` pasa a **`g-checkbox__message`** / `ID-message`: un hueco para error, advertencia o válido, siempre presente **salvo con `field: false`** (#262); `aria-live` = `live` del contexto (`polite`, u `off` mientras se escriben mensajes revelados por un envío; fuera de `GForm`, `polite`). Dentro: `GIcon` (`g-checkbox__message-icon`) + prefijo oculto `g-checkbox__message-type` (`labels.error\|warning\|valid` de `GForm`; fuera, sin prefijo) + texto. `aria-describedby` incluye `ID-message` mientras haya mensaje. Vacía = **sin nodos de texto** (el CSS usa `:not(:empty)`; un comentario de Vue vale, un espacio no). Aplica a `g-checkbox__error` y `g-checkbox-group__error` (→ `__message`). La región del conteo no cambia. |
| C5 | Estados `warning` y `valid` | Props nuevas **`warning`** y **`valid`** (String, sin valor). Sin `aria-invalid`; no bloquean; prioridad error › advertencia › válido. Clases `is-warning`, `is-valid` en la raíz. Borde de estilo distinto del error (no solo color) |
| C6 | Iconos | Error **`circle-alert`** (antes `triangle-alert`), advertencia `triangle-alert`, válido `circle-check` (`icons.md`) |
| C7 | Solo lectura homogéneo | Contraste completo (`--g-color-text`, sin opacidad), fondo `--g-color-surface-sunken`, borde **discontinuo** `--g-color-border-control`, cursor normal, enfocable; distinto de `disabled` sin depender del color (#165). `aria-readonly` y bloqueo del cambio sin cambios. |
| C8 | Manejadores primero | `mergeProps(handlers, propios, attrs)` con la prueba de orden existente ampliada. |
| C9 | Registro | `GCheckbox` suelto con `name` se registra (control de elección: revela al cambiar). **`GCheckboxGroup` gana la prop `name`** (String): clave del grupo en `errors` y `name` por defecto de sus casillas (la que trae el suyo lo conserva); el grupo se registra (`control` = primera casilla habilitada) y sus casillas **no** se registran sueltas. |
| C10 | Pistas compartidas (r02, #176) | **No aplica**: casillas e interruptores sueltos van en su propia fila (hijos directos de `GFormLayout`), sin pistas compartidas; su estructura no cambia. Dentro de una `GFormRow` con más hijos, aviso de desarrollo (`form.md` §4) |

**Advertencia (#169):** en la casilla, borde **discontinuo de un solo trazo** (no doble, como en las cajas de texto: el cuadro es pequeño).

**`GCheckboxGroup` gana `required`** (Boolean, #170): marca en la `<legend>` según la convención de `GForm` (fuera de `GForm`, asterisco como en los campos); el `fieldset` lleva `is-disabled`, `is-invalid`, `is-warning` e `is-valid`.

**Clases nuevas** (contrato bruno–coco): `g-checkbox-group__required` (asterisco del `<legend>` con `marks="required"`), `g-checkbox__message`, `g-checkbox-group__message`, `__message-icon`, `__message-type`, `g-checkbox-group__optional`, `is-warning`, `is-valid` (los `__error` desaparecen).

**Marca fuera de `GForm` (#170):** sin contexto, el asterisco con `required` se pinta como antes aunque el campo sea `readonly` o `disabled`; la regla «solo campos editables llevan marca» rige solo dentro de `GForm`.

## Cambio por `GRadioGroup`: `aria-required` en vez de `required` nativo (#270)

**Origen:** hallazgo L5 de kiwi (`design/lab/radio-group/r01/declaracion.md` §1.5): en Chromium, una casilla (y un radio) con `required` nativo y sin marcar se expone como **`invalid=true` desde el primer momento**, aunque el `<form>` tenga `novalidate`; el lector diría «no válido» antes de que la persona haga nada, contra «castigar tarde» (#157). **Estado:** aprobado por lima; pendiente de **bruno** en esta ronda (`GCheckbox.vue`, `GCheckbox.test.js`, `GCheckbox.meta.json`). Sin cambio de CSS (coco no estiliza `[required]`).

| Antes | Ahora |
| --- | --- |
| `required` → atributo nativo `required` en el `<input>` | `required` → **`aria-required="true"`** en el `<input>`; **nunca** `required` nativo |

- La marca (`g-checkbox__required` o «(opcional)» según la convención) **no cambia**; la regla de §2 de `form.md` tampoco.
- `aria-invalid` sigue llegando **solo** con el error visible (prop `error` o el momento de `GForm`).
- Con `field: false` no hay ni `aria-required` ni marca (#262).
- **Pruebas que cambian:** «disabled y required usan atributos nativos» pasa a comprobar `aria-required="true"` y la **ausencia** de `required`; la instantánea con `required: true` cambia `required=""` por `aria-required="true"`.
- **`GCheckboxGroup`** no cambia: su raíz es un `fieldset` (rol `group`, que no admite `aria-required`); la marca va en la `<legend>`.
- **No se extiende** a `GInput`, `GTextarea` ni al `<select>` de `GInputGroupSelect` sin medirlo: kiwi solo midió radio y casilla. Pendiente (no bloquea): medir en Chromium si un texto o un `<select>` con `required` y vacío se expone como inválido antes de interactuar; si es así, la misma regla les aplica con otra decisión.

## Contraste de lo marcado (`tokens.md` §7.1; DECISIONS.md #431 y #432)

**Origen:** medida de coco en `design/lab/combobox/estilo.md` (0a83801): el cuadro marcado (relleno y borde `primary` sobre `surface`) da **1,77:1** en lustre claro y **1,92:1** en spotify claro cuando `primary` = `brand`; WCAG 1.4.11 pide 3:1 para identificar el control y su estado. La marca `on-primary` sí se lee (~10:1). **Estado:** aprobado por lima; pendiente de **coco** (CSS y medida). Sin cambio de `.vue`, de API ni de tokens.

| Estado | Antes | Ahora |
| --- | --- | --- |
| Cuadro marcado (`:checked`) | relleno y borde `{color}` | relleno `{color}`, **borde `{color}-text`** |
| Cuadro indeterminado (`:indeterminate`) | relleno y borde `{color}` | relleno `{color}`, **borde `{color}-text`** |
| Chip marcado (`layout="chip"`) | relleno y borde `{color}` | relleno `{color}`, **borde `{color}-text`** (ya lo decía la tabla de tokens; el CSS se había quedado en `{color}`) |
| Tarjeta seleccionada | borde y trazo interior `{color}-text` | **sin cambio** (ya cumple) |

Marca, hover (`{color}-strong` como relleno), foco, `readonly`, `disabled` y `forced-colors` no cambian. En el tema por defecto, con `color="brand"` y `"accent"`, `-text` = base: **Δ0 visible**; con una familia semántica aparece el filo más oscuro (el arreglo).

### Encargo a coco (todos los componentes de §7.1; una sola entrega)

1. **Cambiar** (solo el color del contorno o un trazo interior; nada de geometría):
   - `GCheckbox.css`: `.g-checkbox__input:checked` y `:indeterminate` → `border-color: var(--_text)`; `.g-checkbox--layout-chip .g-checkbox__row:has(.g-checkbox__input:checked)` → `border-color: var(--_text)`.
   - `GSwitch.css`: `.g-switch__input:checked` → `border-color` del riel en `-text` de su familia; **añadir `--_text`** (`--g-color-{familia}-text`) al bloque base y a las siete `.g-switch--color-*`, como en `GCheckbox`. El `color: var(--_c)` del propio `:checked` y las marcas sobre el pulgar (`__mark--on`, `__mark--busy`, `__icon--on`: `{color}` sobre `on-{color}`, par garantizado) no cambian.
   - `GMenu.css`: `[aria-checked="true"] > .g-menu__mark` → `border-color: var(--g-color-primary-text)` (casilla y opción).
   - `GTable.css`: `.g-table__select input[type="checkbox"]` → `accent-color: var(--g-color-primary-text)`; `.g-table--mode-cards .g-table__row.is-selected` → `border-color: var(--g-color-primary-text)`.
   - `GFilterBar.css`: `.g-filter-bar__value input[type="checkbox"]` → `accent-color: var(--g-color-primary-text)`.
   - `GCalendar.css`: `.g-calendar__toolbar button[aria-pressed="true"]` → `border-color: var(--g-color-primary-text)`; `.g-calendar__strip > button[aria-pressed="true"]` (sin borde) → trazo interior `primary-text`, **sin** tocar su anillo de foco (`outline`); hoy (`.g-calendar__head…is-today .g-calendar__head-title`, `.g-calendar__month td.is-today .g-calendar__day`) → trazo interior `primary-text`.
   - `GDatePicker.css`: `.g-datepicker__day.is-selected` → trazo interior `-text` de su familia (añadir `--_text` a `--_color`/`--_on` y a las `.g-datepicker--color-*`); el aro y el punto de hoy, si se pintan con `--_color` como trazo o forma sobre `surface`, a `--_text`.
   - `GStepper.css`: `.g-stepper__step.is-complete .g-stepper__indicator` y `.is-current .g-stepper__indicator` → `border-color: var(--_text)` (`--_text` ya existe).
   - `GWidgetGallery.css`: `.g-widget-gallery__cat > input:checked + span` → `border-color: var(--g-color-primary-text)`.
   - `GCombobox.css`: `.g-combobox__option[aria-selected="true"] > .g-combobox__box` → `border-color: var(--g-color-primary-text)` (era `text`, #429/#430; ahora una sola regla, #432); se conserva `surface` en la activa invertida de la paleta; actualizar el comentario.
   - `GRadioGroup.css`: **nada** (ya cumple); solo se mide.
2. **Repasar con `grep`** (`var(--_c)`, `var(--_color)`, `var(--_base)`, `var(--_fill)`, `var(--g-color-primary)`, `var(--g-color-accent)` y las demás familias en `background`/`border-color`/`accent-color`) por si queda algún estado relleno que esta lista no recoge; lo que encuentre lo anota en su `estilo.md` y, si no está claro si es estado de un control, lo devuelve a lima. **Exentos** (§7.1): `GBtn`, `GBadge`, `GCard`, `GAvatarMotion`, contadores de `GSidebar`, botones `--primary` de `GWidgetGallery`, `GWidgetConfig` y `GDatePicker`, la píldora del navbar de `GSidebar` (confirmar midiendo que la etiqueta visible y el ancho la distinguen).
3. **Medir** el contorno contra la superficie adyacente (≥ 3:1; `surface`, `bg`, `surface-sunken` y, donde ocurra, `{color}-soft`: casilla en la fila seleccionada de `GTable`, día elegido dentro de la franja de `GDatePicker`) en **el tema por defecto, lustre, spotify y un tema con clave `primary` propia** (#107), **claro y oscuro**, con `color="brand"` y al menos `warning` (el peor semántico) en `GCheckbox`, `GSwitch` y `GRadioGroup`. Comprobar además **Δ0 visible en el tema por defecto** con `brand` y `accent` (mismo color calculado del borde antes y después). Script propio en `design/lab/contraste-marcado/` (nuevo, de coco) y resultados en su `estilo.md`.
4. **Fuera de esta entrega, medir y anotar** (no cambiar): la franja de rango de `GDatePicker` (`{color}-soft` contra `surface`), el avance de `GProgress` contra su pista y el conector de `GStepper`. Si alguno no llega a 3:1, a lima.

**bruno:** sin código. Si alguna prueba de instantánea fija el color del borde, se actualiza; ninguna prueba nueva obligatoria (el contraste lo mide coco en navegador). **mora-docs:** en los README afectados, una línea en «Accesibilidad» cuando coco haya medido.
