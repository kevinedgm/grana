# Contrato · GStepper

**Dueño:** lima · **Estado:** aprobado · **Basado en:** `design/lab/stepper/r01/` (kiwi)
**Tag:** `g-stepper` · **Categoría:** navegación y progreso

Indicador de avance para procesos de **pasos discretos y conocidos** (formularios de varios pasos, onboarding, checkout, asistentes, flujos de aprobación). Un solo componente con dos ejes visuales (`orientation` × `indicator`) sobre **una sola lógica de pasos**. El progreso **continuo** (porcentaje, indeterminado) es **otro componente** (decisión del usuario, opción B; DECISIONS.md #97) y queda fuera de este contrato.

---

## Principios

- **Lógica → estado → variante.** El estado de cada paso se calcula igual sin importar la variante; `orientation` e `indicator` solo cambian cómo se dibuja.
- **Representa reglas, no las decide.** Qué paso es el actual, cuáles están bloqueados y si se puede navegar lo recibe por props. El componente emite intención (`select`) y el consumidor actualiza `modelValue`.
- **El estado nunca es solo color.** Cada estado tiene forma, icono, peso o texto propios (WCAG 1.4.1). Lo verifica coco con el tema real.
- **Sin textos propios.** Grana es internacional: los textos accesibles los aporta el consumidor (`labels`), como `closeLabel` en `GDialog`.
- **No es un `tablist`.** No cambia paneles por sí mismo: es una lista de pasos, con botones solo cuando es navegable.

## Props

| Prop | Tipo | Valores | Default | Origen |
| --- | --- | --- | --- | --- |
| `steps` | Array | `{ id?, label, description?, status?, optional?, disabled? }` | `[]` (función) | propia |
| `modelValue` | String \| Number | `id` del paso actual | primer paso | compartida |
| `orientation` | String | `horizontal` `vertical` | `horizontal` | propia |
| `indicator` | String | `number` `dot` `icon` `segment` `line` | `number` | propia |
| `navigation` | String | `none` `back` `free` | `none` | propia |
| `responsive` | String | `auto` `never` `compact` | `auto` | propia |
| `color` | String | `brand` `accent` `neutral` `success` `warning` `danger` `info` | `brand` | compartida |
| `size` | String | `sm` `md` `lg` | `md` | compartida (subconjunto) |
| `density` | String | `default` `comfortable` `compact` | `default` | compartida |
| `disabled` | Boolean | | `false` | compartida |
| `expandAll` | Boolean | | `false` | propia |
| `labels` | Object | ver abajo | `{}` (función) | propia |

### Forma de cada paso (`steps[]`)

| Campo | Tipo | Valores | Nota |
| --- | --- | --- | --- |
| `id` | String \| Number | único | Si falta, el `id` es el **índice** (0, 1, 2…) |
| `label` | String | texto libre | Obligatorio; nombre accesible del paso |
| `description` | String | texto libre | Opcional; segunda línea |
| `status` | String | `error` `warning` | Marca del consumidor que se **combina** con el estado derivado |
| `optional` | Boolean | | Paso opcional (texto de `labels.optional` junto a la etiqueta) |
| `disabled` | Boolean | | Paso bloqueado: nunca es botón, aunque `navigation` lo permitiría |

### Reglas de props

- **Estado derivado.** Con `i` el índice del paso y `c` el del actual: `i < c` → `complete`; `i = c` → `current`; `i > c` → `pending`. `status`, `optional` y `disabled` se suman a eso (un paso `complete` puede tener `warning`; uno `pending`, ser `optional` o `disabled`). Un `status` `error` o `warning` gana sobre el aspecto de `complete`.
- **`modelValue`:** `id` del paso actual. Si no coincide con ningún paso, **ninguno** es el actual (todos `pending`) y, en desarrollo, se emite `console.warn`. Sin `v-model`, el componente es **solo informativo** de lo que reciba; nunca cambia el prop por su cuenta.
- **`orientation`:** `horizontal` para procesos cortos o medianos; `vertical` para formularios largos, paneles, diálogos y cuando cada paso lleva descripción o contenido.
- **`indicator`:** `number` (círculo con número; `check` al completar), `dot` (nodo pequeño, sin número), `icon` (el icono de cada paso lo pone la aplicación en el slot `icon`; sin él, el número), `segment` (cada paso es un tramo de una barra única con la etiqueta debajo) y `line` (mínimo: solo etiqueta y subrayado). Ningún indicador es lo único que nombra al paso.
- **`navigation`:** `none` (informativo: ningún paso es control), `back` (los pasos anteriores al actual son botones) o `free` (cualquiera, salvo el actual y los `disabled`). **Avanzar solo en secuencia** lo impone el consumidor mediante `modelValue`; el componente no valida pasos. El paso actual **nunca** es botón.
- **`responsive`:** `auto` (el componente elige según el ancho **de su contenedor**, ver Adaptación), `never` (siempre completo, sin pasar a compacto) o `compact` (siempre compacto). En `vertical`, `auto` no pasa a compacto.
- **`color`:** color de los indicadores hechos y actual y del conector hecho. `brand` lee `--g-color-primary*` (DECISIONS.md #95), como `GProgress`. **Error y advertencia** usan siempre `danger` y `warning`, sea cual sea `color`.
- **`size`:** `sm`, `md` y `lg` escalan indicador, tipografía y espacio (no usa `xs`…`xl`: ese conjunto es de controles con altura).
- **`density`:** multiplica la separación entre pasos y el relleno vertical (1×, 0.875×, 0.75×). No cambia la tipografía ni el indicador.
- **`disabled`:** ningún paso es botón (equivale a `navigation="none"`) y se añade `is-disabled`; no marca ningún paso como bloqueado.
- **`expandAll`:** en `vertical`, muestra el contenido (slot `content`) de **todos** los pasos; por defecto solo el del actual.
- **`labels`:** textos accesibles. **Sin valores por defecto.**

### `labels`

| Clave | Uso | Si falta |
| --- | --- | --- |
| `complete`, `current`, `pending`, `error`, `warning`, `disabled`, `optional` | Texto de estado, oculto, que sigue a la etiqueta de cada paso (puede haber dos: «completado, con advertencia») | Ese estado no se anuncia; en desarrollo, `console.warn` una sola vez |
| `progress` | Plantilla del resumen compacto, con `{current}` y `{total}` (p. ej. «Paso {current} de {total}») | Se muestra `{current}/{total}` con los números solos |
| `showAll`, `hideAll` | Nombre del botón que despliega u oculta la lista completa en el compacto | El botón **no** se renderiza y, en desarrollo, `console.warn` |

El **nombre del `<nav>`** no va en `labels`: se pasa como `aria-label` o `aria-labelledby` (`$attrs`). Sin ninguno, en desarrollo se emite `console.warn` (como el título de `GDialog`).

## Estructura accesible

```html
<nav class="g-stepper g-stepper--horizontal g-stepper--indicator-number …" aria-label="Registro">
  <div class="g-stepper__compact">                                   <!-- solo cuando es compacto -->
    <div class="g-stepper__summary">
      <span class="g-stepper__summary-name">Cuenta</span>
      <span class="g-stepper__summary-count">Paso 2 de 5</span>
    </div>
    <div class="g-stepper__bar" aria-hidden="true">…</div>
    <button class="g-stepper__toggle" type="button" aria-expanded="false" aria-controls="ID-list">Ver todos los pasos</button>
    <ol class="g-stepper__list" id="ID-list">…</ol>                  <!-- solo abierto: lista vertical -->
  </div>
  <ol class="g-stepper__list">                                        <!-- siempre; en compacto, oculta por el CSS (sirve para medir; #151) -->
    <li class="g-stepper__step is-complete">
      <button class="g-stepper__hit" type="button">                   <!-- span si no es navegable -->
        <span class="g-stepper__indicator" aria-hidden="true">…</span>
        <span class="g-stepper__text">
          <span class="g-stepper__label">Plan</span>
          <span class="g-stepper__optional">(opcional)</span>         <!-- solo con optional y labels.optional -->
          <span class="g-stepper__description">Elige tu plan</span>
          <span class="g-stepper__status">, completado</span>         <!-- oculto visualmente -->
        </span>
      </button>
      <span class="g-stepper__connector" aria-hidden="true"></span>
      <div class="g-stepper__content">…</div>                         <!-- solo vertical, slot content -->
    </li>
    <li class="g-stepper__step is-current"> <span class="g-stepper__hit" aria-current="step">…</span> … </li>
  </ol>
</nav>
```

- Contenedor `<nav>` con una lista `<ol>`: el total de pasos lo anuncia la lista; el actual lleva `aria-current="step"`.
- El indicador es **decorativo** (`aria-hidden`); el nombre accesible sale de la etiqueta y el texto de estado.
- Un paso no navegable es un `<span>`, no un `<button>` inactivo.
- En compacto, la barra es decorativa (el texto «Paso N de M» ya lo dice). La lista completa, al desplegarse, es **vertical**. La lista de la raíz sigue en el DOM con `display: none` (fuera del árbol de accesibilidad y del orden de Tab).
- En «solo el actual» (`g-stepper--current-only`), el texto de los demás pasos queda oculto **visualmente** con el patrón de texto oculto: cada botón conserva su nombre accesible.
- **Resto de atributos** (`class`, `style`, `data-*`, `aria-*`, escuchas): van al `<nav>` (raíz).

## Eventos

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `update:modelValue` | `id` del paso elegido | El usuario activa un paso navegable y nadie impidió `select` |
| `select` | `{ id, index, preventDefault() }` | El usuario activa un paso navegable. **Cancelable:** llamar a `preventDefault()` de forma síncrona evita `update:modelValue` |

- Un cambio de `modelValue` desde fuera **no** emite `select`.
- Tras activar un paso, si el consumidor actualiza `modelValue`, **el foco pasa al paso actual nuevo** (WCAG 2.4.3; el botón pulsado deja de serlo al volverse el actual). Si el consumidor lo impide, el foco se queda donde estaba.

## Slots

| Slot | Propósito | Alcance | Anatomía que debe conservar |
| --- | --- | --- | --- |
| `content` | Contenido asociado a un paso (solo `vertical`) | `{ step, index, state }` | Dentro de `g-stepper__content`; se renderiza solo para el actual (todos con `expandAll`) |
| `icon` | Icono del paso con `indicator="icon"` (Lucide, lo pone la aplicación; decorativo, `aria-hidden`) | `{ step, index, state }` | Dentro de `g-stepper__indicator`; sin él, el número |
| `label` | Etiqueta con contenido rico | `{ step, index, state }` | Dentro de `g-stepper__label`; sin interactivos |
| `description` | Descripción con contenido rico | `{ step, index, state }` | Dentro de `g-stepper__description`; sin interactivos |

`state` es `complete`, `current` o `pending`. Un slot no cambia el nombre accesible si el consumidor no mantiene `label`.

## Teclado

| Tecla | Acción |
| --- | --- |
| Tab / Shift+Tab | Recorre **solo** los pasos navegables y, en compacto, el botón de desplegar |
| Enter / Espacio | Activa el paso enfocado o el botón de desplegar (nativo) |

Sin manejadores de teclado propios. **Sin flechas:** no es un `tablist`.

## Adaptación (contenedor, no ventana)

El stepper se adapta al ancho **de su contenedor**, para que un diálogo o un panel estrecho funcione aunque la ventana sea ancha. Lo mide bruno con `ResizeObserver` y **emite clases**. Los umbrales **son los anchos naturales de la lista**, medidos en el propio DOM (dependen del texto, la fuente, `size`, `density` e `indicator`), no literales de CSS ni múltiplos fijos de `space` (DECISIONS.md #151, que sustituye a #98; sin consultas de contenedor ni excepción nueva en `tokens.md` §7).

| Tramo (horizontal, `responsive="auto"`) | Cuándo | Estructura |
| --- | --- | --- |
| Completo | Cabe la lista con títulos y descripciones a su ancho natural (con el conector mínimo) | Etiquetas y descripciones enteras; el sobrante alarga los conectores |
| `g-stepper--condensed` | Cabe sin descripciones | Etiquetas enteras, sin descripciones |
| `g-stepper--current-only` | Cabe con texto solo en el paso actual | Indicador y conector en todos; etiqueta solo del actual (las demás, ocultas visualmente) |
| `g-stepper--is-compact` | Ni eso cabe | «Paso N de M» + nombre actual + barra segmentada + botón para ver todos |

- **Medición:** bruno quita las clases de tramo, añade `g-stepper--measure` (sola, con `--condensed` y con `--current-only`) y lee el ancho de la lista en una pasada síncrona; deja la raíz como estaba. Se repite al cambiar el ancho, el contenido o las props (cada render), al cargar fuentes y en cada aviso del `ResizeObserver` (que aplica el cambio en el cuadro siguiente para no provocar el aviso de bucle). `--measure` es interna: el consumidor no la usa.
- **Invariantes** en `auto` (medidas en Chromium, Firefox y WebKit, `design/lab/stepper/auditoria-adaptacion.md`): el título del paso actual no se recorta; nunca hay una descripción visible junto a un título recortado; el conector visible mide al menos `space × 6`; nada sale del contenedor.
- `segment` y `line` reparten el ancho por igual (se miden a columnas iguales); en `--current-only` el actual toma su ancho natural.
- Con muchos pasos el mismo cálculo lleva a compacto: es la estrategia de *overflow* de r01; no hay scroll horizontal.
- `responsive="never"`: siempre completo; si no cabe, cada línea cede con elipsis (la descripción nunca más ancha que su título) y los demás pasos ceden antes que el actual.
- Sin medición (SSR, `ResizeObserver` ausente) se renderiza **completo**.
- Con `pointer: coarse`, los pasos navegables y el botón de desplegar miden ≥ 44px (mínimo de `tokens.md` §7, sin importar `density`).

## Tokens consumidos

Sin tokens nuevos: el tamaño del indicador, el grosor del conector y la separación derivan de `space` y `--g-border-width`.

Existentes: `--g-color-primary[-strong|-soft|-text]`, `--g-color-on-primary[-soft]` (vía `color="brand"`) y las familias `--g-color-{accent|neutral|success|warning|danger|info}[-soft|-text]` con sus `on`, `--g-color-text`, `--g-color-text-muted`, `--g-color-text-subtle`, `--g-color-border`, `--g-color-border-control`, `--g-color-focus`, `--g-radius-pill`, `--g-radius-xs`, `--g-space-1..8`, `--g-font-ui`, `--g-text-{caption|body-sm|body}-{size|line|weight}`, `--g-text-action-weight`, `--g-border-width`, `--g-focus-width`, `--g-focus-offset`, `--g-duration-fast`, `--g-ease-standard`.

Derivaciones propuestas para coco (no son tokens): indicador = `space × 6` en `md` (24px), `space × 5` en `sm`, `space × 8` en `lg`; nodo de `dot` = `space × 3`; conector = `--g-border-width × 2`; tramo de `segment` = `space × 1.5`.

## Clases (contrato entre bruno y coco)

| Clase | Elemento | Cuándo |
| --- | --- | --- |
| `g-stepper` | Raíz (`<nav>`) | Siempre |
| `g-stepper--{horizontal\|vertical}` | Raíz | Siempre |
| `g-stepper--indicator-{number\|dot\|icon\|segment\|line}` | Raíz | Siempre |
| `g-stepper--color-*`, `--size-*`, `--density-*` | Raíz | Siempre |
| `g-stepper--navigable` | Raíz | Con `navigation` ≠ `none` y sin `disabled` |
| `g-stepper--condensed` | Raíz | Medido: sin descripciones |
| `g-stepper--current-only` | Raíz | Medido: solo el paso actual con texto visible |
| `g-stepper--measure` | Raíz | Interna: solo durante la lectura síncrona del ancho natural; nunca se pinta |
| `g-stepper--is-compact` | Raíz | Medido o por `responsive="compact"`: muestra el resumen compacto |
| `is-disabled` | Raíz | Con `disabled` |
| `g-stepper__compact`, `__summary`, `__summary-name`, `__summary-count`, `__bar`, `__bar-seg`, `__toggle` | Resumen compacto | Solo compacto |
| `g-stepper__list` | `<ol>` | Siempre (en compacto, la de la raíz oculta y otra dentro del resumen al desplegar) |
| `g-stepper__step` | `<li>` | Por paso |
| `is-complete`, `is-current`, `is-pending` | `<li>` | Estado derivado (uno de los tres) |
| `is-error`, `is-warning`, `is-disabled`, `is-optional` | `<li>` | Marcas del paso |
| `g-stepper__hit` | Botón o `<span>` | Por paso |
| `g-stepper__indicator`, `__text`, `__label`, `__optional`, `__description`, `__status`, `__connector`, `__content` | Partes del paso | Según variante. El indicador siempre está en el DOM (el CSS decide qué muestra) |
| `is-done`, `is-toward`, `is-pending` | `__connector` y `__bar-seg` | Conector o tramo **hecho**, **saliente del actual** (a medias, entre el actual y el siguiente) o pendiente. Solo uno por elemento |

## Resolución de hallazgos

| # | Hallazgo | Resolución | Base |
| --- | --- | --- | --- |
| 1 | Entrega de los pasos | `steps` (arreglo) más slots `content`, `label` y `description`; `modelValue` es el `id` del actual, y si faltan `id`, el índice | Patrón de datos de los componentes de Grana; el `id` sobrevive a reordenar |
| 2 | Eje visual | `orientation` × `indicator`; sin `variant` de botón | `api.md`: `variant` no describe un stepper (como `GDialog`) |
| 3 | Modo de interacción | `navigation`: `none` `back` `free` más `disabled` por paso y global; el componente no valida secuencia | Requisito del usuario: no decidir reglas de negocio |
| 4 | Evento de navegación | `update:modelValue` y `select` cancelable `{ id, index, preventDefault() }` | Mismo patrón que `dismiss` de `GDialog` |
| 5 | Textos accesibles | `labels` sin valores por defecto; `aria-label` del `<nav>` por `$attrs`; avisos en desarrollo | Grana internacional; decisión de producto confirmada por el usuario |
| 6 | Adaptación | `responsive` `auto` \| `never` \| `compact`; cuatro tramos (completo, sin descripciones, solo el actual, compacto) con umbrales = anchos naturales medidos por bruno; sin literales nuevos (#151, sustituye a #98) | DECISIONS.md #34 y #39 evitados: no hay consultas con valores fijos; cubre el *overflow* de muchos pasos y depende del texto real |
| 7 | Tokens | Ninguno nuevo; derivaciones propuestas a coco | `tokens.md` §17.6: no se crea un token cuando basta uno existente |
| 8 | Iconos | El icono de cada paso lo pone la aplicación con el slot `icon` (solo con `indicator="icon"`); los de estado son fijos (`check`, `circle-alert`, `triangle-alert`, `lock`) y los dibuja `GIcon`, añadidos a `icons.md` §4 | `icons.md` §5: Grana no trae colección de iconos de la aplicación (DECISIONS.md #85 a #87) |
| 9 | Progreso continuo | Fuera de este contrato: componente aparte (DECISIONS.md #97). Su nombre **no puede ser `GProgress`**; queda abierto | Decisión del usuario; `GProgress` ya existe |
| 10 | Contenido por paso | Slot `content` con alcance, por paso; solo el actual salvo `expandAll` | Brief: vertical con contexto adicional |

## Límites conocidos

- **Sin scroll horizontal** ni «condensar pasos completados» en v0.1; el *overflow* se resuelve con el compacto.
- **Sin iconos personalizados por estado**: los cuatro de estado son fijos (los del paso, con `indicator="icon"`, sí los pone la aplicación).
- **Sin animación de progreso** entre pasos más allá del cambio de estado que fije coco.
- **Lector de pantalla y RTL:** sin verificar con lectores reales ni en escritura de derecha a izquierda.
- El compacto **no** es un `progressbar` (no hay valor continuo): comunica con texto.

## Abierto (no bloquea el paso siguiente)

- Valores visuales, transición y contraste de cada estado: los decide coco (`GStepper.css`).
- Nombre y contrato del progreso continuo: siguiente ronda de kiwi y lima.

## Contraste del indicador (`tokens.md` §7.1; DECISIONS.md #431 y #432)

El indicador **completado** (relleno `--_base` = `{color}`, icono `on-{color}`) y el **actual** (anillo sobre `surface`) llevan el **borde en `{color}-text`** (`--_text`, que ya existe) en lugar de `{color}`. Sin cambio en el tema por defecto. **Hecho** por coco en 27a89a0 (≥ 4,21:1 en `number` y `dot`).

### Formas de familia del paso (`tokens.md` §7.1, «Formas de familia sin par»; DECISIONS.md #440)

**Origen:** medida de coco (`design/lab/contraste-marcado/estilo.md`): pintadas con `--_base` como forma, el anillo exterior del actual en `dot`, la raya de `line` y el tramo de `segment` dan **1,04 a 1,64:1**, y el conector hecho 1,12:1 (`brand`, tema por defecto oscuro, contra `border-strong`).

**No son necesarias para entender el estado** (WCAG 1.4.11 no les exige 3:1): el estado se lee por otra vía en todas las variantes. El paso actual lleva la etiqueta en **peso de título** (siempre visible, también en «solo el actual»), `aria-current="step"` y el texto de estado; los completados son, por la regla del estado derivado, **los anteriores al actual**, y los pendientes, los posteriores. Error y advertencia tienen icono, trama o subrayado propios. En `number` e `icon` el indicador, además, lleva su contorno `-text`.

**Aun así pasan a `--_text`** (la regla de las formas sin par, #439): no llevan nada `on-` encima, en el tema por defecto `-text` = base (**Δ0**) y en una marca pálida dejan de desaparecer contra la superficie (`-text` ≥ 4,21:1 contra `surface`, `bg` y `surface-sunken`). Lo que se pinta con `--_text`:

| Parte | Selector (`GStepper.css`) | Antes | Ahora |
| --- | --- | --- | --- |
| Conector hecho y saliente | `.g-stepper__connector` (degradado) | `--_base` hasta `--_stepper-fill` | `--_text` hasta `--_stepper-fill`; lo pendiente sigue en `border-strong` |
| Punto de `dot` completado y actual | `…indicator-dot… .is-complete .g-stepper__indicator`, `… .is-current …` | fondo `--_base` (borde ya `--_text`) | fondo `--_text`: un punto lleno contra uno hueco, también en una marca pálida |
| Anillo exterior del actual en `dot` | `box-shadow` del actual | `--_base` | `--_text` (el anillo interior de separación sigue en `surface`) |
| Raya de `line` | `border-block-end-color` de `.is-complete` y `.is-current` | `--_base` | `--_text` (el grosor doble del actual no cambia) |
| Tramo de `segment` | degradado del indicador | `--_base` hasta `--_stepper-fill` | `--_text` hasta `--_stepper-fill`; lo pendiente sigue en `border-control` |
| Barra del compacto | `.g-stepper__bar-seg` | `--_base` | `--_text` (es decorativa: el texto «Paso N de M» lo dice) |
| Indicador completado de `number` e `icon` | `.is-complete .g-stepper__indicator` | relleno `--_base` | **sin cambio**: lleva el icono `on-{color}` encima (relleno con par) |

**Límite conocido (se documenta, no se arregla):** dentro del tramo de `segment`, lo hecho (`-text`) contra lo pendiente (`border-control`) **no llega a 3:1** en varios temas, también en el de por defecto (calculado por lima: 1,65:1 `accent` claro, 1,06:1 `accent` oscuro; 1,32 a 1,89:1 en lustre y spotify claros). Ambos colores son de «forma» (≥ 3:1 contra la superficie) y por eso se parecen entre sí. Subir el contraste exigiría aclarar la pista pendiente, un cambio visible en el tema por defecto, para algo que ya se lee por la etiqueta del actual y el orden. Mismo caso para el conector hecho contra el pendiente.

**Encargo a coco** (con el de `widget.md` §«Contraste del avance»; una sola entrega, Sonnet):

1. `GStepper.css`: cambiar `--_base` por `--_text` en las seis filas de la tabla (ocho declaraciones) (conector; punto completado y actual de `dot`; anillo exterior de `dot`; raya completada y actual de `line`; tramo de `segment`; `__bar-seg`). **No** tocar el relleno del indicador completado de `number`/`icon` ni `forced-colors`. Actualizar los comentarios.
2. **Volver a medir el conector en el tema por defecto oscuro.** El 1,12:1 de `estilo.md` coincide con `brand` #F2F2F2 contra `brand-strong` #FFFFFF; `border-strong` (`rgb(255 255 255 / 0.20)`) compuesto sobre `surface` #1C1C1C da ≈ #494949 y unos 8:1 contra #F2F2F2. Comprobar si se compuso la transparencia y corregir la cifra en `estilo.md`.
3. **Medir** (informativo, no compuerta): cada forma de la tabla contra `surface` en el tema por defecto, lustre, spotify y `primary` propia, claro y oscuro, con `brand`, `accent` y `warning`; lo hecho contra lo pendiente en el conector y el tramo. **Δ0 píxel a píxel** en el tema por defecto con `brand` y `accent`, en las cinco variantes, horizontal, vertical y compacto. Resultado en `design/lab/contraste-marcado/estilo.md`.

**bruno:** sin código. **mora-docs:** en el README de `GStepper`, «Accesibilidad»: el estado se lee por la etiqueta del actual, el orden y el texto de estado; las formas usan `{color}-text`; el límite del tramo.
