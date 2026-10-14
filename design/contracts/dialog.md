# Contrato · GDialog

**Dueño:** lima · **Estado:** aprobado · **Basado en:** `design/lab/dialog/r01/` (kiwi) · **Niveles anidados (r02, B + C):** contratado desde `design/lab/dialog/r02/` (kiwi; decisión del usuario B «El hilo» + C «En su sitio», #580 a #591), §«Niveles anidados»; **pendiente de coco y de bruno, los dos en Opus** (componente complejo: motor de estado de la pila, se posiciona sobre otros y compone `GForm`/`GSelect`)
**Tag:** `g-dialog` · **Categoría:** superposiciones

Diálogo modal genérico con una **carcasa** exterior y una **superficie inset** interior. Alcance decidido por el usuario (DECISIONS.md #42 a #46): todas las composiciones por props y slots de un solo componente; la superficie inset entra como **tokens y clases** reutilizables, no como componente (`GSurface` queda para más adelante); en móvil, hoja inferior por defecto.

---

## Principios

- **Es un `<dialog>` nativo modal.** El componente llama a `showModal()` y `close()`; el navegador resuelve la capa superior, el resto de la página inerte, el foco atrapado y Esc. No hay `Teleport`, ni trampa de foco propia, ni `aria-modal` manual.
- **Presenta y emite intención.** No decide cuándo se cierra por su cuenta: emite `dismiss` (cancelable) y el consumidor actualiza `modelValue`.
- **Genérico.** Nada de "confirmar", "editar" o "crear" en la API: las composiciones salen de `inset`, `role`, `size`, `fullscreen`, `mobile` y los slots.
- **Dos superficies siempre.** Con `inset` (por defecto), hasta en pantalla completa y en móvil hay carcasa e inset.

## Props

| Prop | Tipo | Valores | Default | Origen |
| --- | --- | --- | --- | --- |
| `modelValue` | Boolean | | `false` | compartida |
| `title` | String | texto libre | sin valor | propia |
| `description` | String | texto libre | sin valor | propia |
| `size` | String | `sm` `md` `lg` | `md` | compartida (subconjunto) |
| `density` | String | `default` `comfortable` `compact` | `default` | compartida |
| `inset` | Boolean | | `true` | propia |
| `fullscreen` | Boolean | | `false` | propia |
| `placement` | String | `center` `end` | `center` | propia |
| `mobile` | String | `sheet` `full-width` `fullscreen` | `sheet` | propia |
| `role` | String | `dialog` `alertdialog` | `dialog` | propia |
| `closeLabel` | String | texto libre | sin valor | propia |
| `closeOnBackdrop` | Boolean | | `true` | propia (no cierra si hay otro modal debajo, #568) |
| `loading` | Boolean | | `false` | compartida (precisada en `api.md`) |
| `id` | String | | generado | propia |
| `from` | String \| HTMLElement | `id` o elemento | sin valor | propia (#583): el disparador; recibe el foco al cerrar y es el origen de D1 |
| `steps` | Array<String> | nombres de `GDialogStep` (`v-model:steps`) | sin valor | propia (#584): historial de pasos, §«Niveles anidados» B |
| `labels` | Object | `{ back, trail }` | `{}` | compartida (sin valores por defecto; §«Niveles anidados» B) |

### Reglas de props

- **`modelValue`:** `true` abre (`showModal()`), `false` cierra (`close()`). El componente **nunca cambia el prop por su cuenta**: ante Esc, clic en el fondo o el botón de cierre emite `dismiss` y, si nadie lo impide, `update:modelValue` con `false`.
- **`title`:** nombre accesible del diálogo (`aria-labelledby`). Sin `title`, sin slot `title` ni `header` y sin `aria-label` ni `aria-labelledby` (en `$attrs`), en desarrollo se emite `console.warn`.
- **`description`:** descripción accesible (`aria-describedby`); solo se renderiza si hay texto o slot.
- **`size`:** ancho de la carcasa en escritorio, derivado de `space` (con `space` 4: 400, 560 y 760px), siempre menor que el visor menos 8 unidades de `space`. `sm` y `lg` aplican en escritorio y tableta. `size` no usa `xs`…`xl`: ese conjunto es de controles (ver `api.md`).
- **`density`:** multiplica relleno y separación de la carcasa y la inset (1×, 0.875×, 0.75×). La tipografía no cambia.
- **`inset`:** con `true`, cuerpo y pie viven en la superficie inset. Con `false`, en la carcasa (diálogo simple).
- **`fullscreen`:** ocupa todo el visor, en todos los anchos, sin esquinas redondeadas exteriores; conserva las dos superficies.
- **`placement`:** dónde se ancla la carcasa en escritorio y tableta. `center` (por defecto), centrada. **`end`: hoja lateral** pegada al borde final (derecha en LTR, izquierda en RTL), **de alto completo** del visor, con el ancho de `size` (sin esquinas exteriores del lado del borde) y una entrada deslizando desde ese borde; cuerpo desplazable y pie fijo. En móvil (≤ ~520px) **actúa `mobile`** (hoja inferior por defecto): `placement` no cambia nada. Con `fullscreen`, gana `fullscreen`. Lo usan `GWidgetGallery` y `GWidgetConfig` (DECISIONS.md #77).
- **`mobile`:** estructura con un visor de hasta ~520px de ancho: `sheet` (hoja inferior, pegada abajo, esquinas superiores redondeadas), `full-width` (ancho completo centrado con un margen pequeño) o `fullscreen`. Fuera de móvil no actúa. `fullscreen` gana sobre `mobile`.
- **`role`:** `alertdialog` para una confirmación que exige decisión. Con `alertdialog`: el clic en el fondo **no** cierra (`closeOnBackdrop` se ignora), y **no se renderiza el botón de cierre del encabezado** (las acciones del pie son la salida). Esc sigue cerrando, con `reason: 'escape'`.
- **`closeLabel`:** nombre accesible del botón de cierre. **Sin valor por defecto** (Grana es internacional). Sin él, el botón no se renderiza y, en desarrollo, se emite `console.warn` (salvo en `alertdialog`).
- **`closeOnBackdrop`:** con `true`, un clic en el fondo emite `dismiss` con `reason: 'backdrop'`. Un arrastre que empieza dentro y termina en el fondo **no** cuenta (el clic debe empezar y terminar en el fondo). **Excepción (#568):** con otro modal debajo (`topModal`), el clic en el fondo no emite `dismiss` aunque `closeOnBackdrop` sea `true`.
- **`loading`:** `aria-busy="true"` en la carcasa y clase `is-loading`. No bloquea nada: las acciones las controla el consumidor.
- **`id`:** si no se da, se genera uno estable (`useId`); de él derivan los ids de título y descripción.
- **`from`** (#583): el elemento que abrió el diálogo, como `id` o como elemento. Se resuelve **al abrir** (un `id` sin elemento cuenta como sin valor). Sin `from`, el disparador es `document.activeElement` si está fuera del diálogo y no es `body` (lo de hoy, D1). Con `from`: **el foco vuelve a él al cerrar** (en lugar del retorno nativo) si sigue conectado y es usable; si no, el retorno nativo. También es el origen de D1: con `from`, WebKit tiene `has-origin` con un clic de ratón (cierra el límite (1) de #307 para quien lo pasa; sin `from` el límite sigue).
- **`steps`** y **`labels`:** ver §«Niveles anidados» B.
- **Resto de atributos** (`class`, `style`, `data-*`, `aria-*`, escuchas): van al `<dialog>` (raíz).

## Foco

- **Al abrir** (orden explícito, DECISIONS.md #292; lo hace el componente tras montar el contenido, no el navegador): 1) el primer elemento con **`autofocus`** usable (no deshabilitado, no `inert` ni `hidden`, sin `tabindex` negativo, visible); 2) si no, el **primer control enfocable del contenido** en orden del DOM, **excluidos el botón de cierre y el cuerpo desplazable** (su `tabindex="0"` no lo hace un control); 3) si no, el **botón de cierre**; 4) si no, el propio **`<dialog>`**. Si el foco ya está dentro (lo puso el consumidor en `open`), no se mueve. Con `preventScroll: true`. En `alertdialog`, **el consumidor pone primero la acción segura o le da `autofocus`** (se documenta; sin advertencia). *Por qué no «nativo»:* el contenido se monta después de `showModal()` y el navegador deja el foco en el `<dialog>` (kiwi, `design/lab/form-section/r01/` L10, medido en los tres motores); y el orden nativo elegiría el botón de cierre, que va primero en el DOM, en lugar del primer campo de un formulario.
- **Al cerrar:** vuelve a `from` si se dio y sigue usable (#583); si no, al elemento que tenía el foco al abrir (nativo). Con pasos, el foco entre pasos sigue §«Niveles anidados» (base 3 y 7).
- **Cuerpo desplazable:** cuando su contenido no cabe, el cuerpo recibe `tabindex="0"`, `role="region"` y `aria-labelledby` del título, para que el teclado pueda desplazarlo. Cuando cabe, no es tabulable. Lo mide bruno con `ResizeObserver`.
- **Formularios:** el botón de envío del pie se asocia con `form="id-del-formulario"` (el pie está fuera del `<form>`). Si el formulario no valida, el diálogo **no** se cierra: cerrarlo es decisión del consumidor.

## Estructura accesible

```html
<dialog class="g-dialog g-dialog--size-md g-dialog--inset g-dialog--mobile-sheet" id="ID" aria-labelledby="ID-title" aria-describedby="ID-desc" aria-busy="true" role="alertdialog">
  <div class="g-dialog__header">
    <span class="g-dialog__icon" aria-hidden="true">…</span>                 <!-- solo con slot icon -->
    <div class="g-dialog__titles">
      <h2 class="g-dialog__title" id="ID-title">…</h2>
      <p class="g-dialog__description" id="ID-desc">…</p>                    <!-- solo si hay descripción -->
    </div>
    <button class="g-dialog__close" type="button" aria-label="Cerrar">…</button>
  </div>
  <div class="g-dialog__inset">                                              <!-- solo con inset -->
    <div class="g-dialog__body" tabindex="0" role="region" aria-labelledby="ID-title">…</div>
    <div class="g-dialog__footer">…</div>                                    <!-- solo si hay slot footer -->
  </div>
</dialog>
```

- Sin `inset`, `g-dialog__inset` no existe y cuerpo y pie cuelgan de la carcasa con las mismas clases.
- El **contenido se monta al abrir y se desmonta al terminar la salida** (un formulario no conserva su estado entre aperturas; durante la salida, unos 120 ms, sigue visible e inerte). La raíz `<dialog>` siempre está en el DOM.
- El encabezado usa `h2`: un diálogo abre un nivel propio. El consumidor no cambia el nivel en v0.1.
- Botones, enlaces y campos van en el cuerpo y el pie; nunca dentro de `title` ni `description`.

## Eventos

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `update:modelValue` | `Boolean` | Se cierra por una vía de usuario y nadie impidió el `dismiss` (siempre `false`) |
| `dismiss` | `{ reason, depth, preventDefault() }` | El usuario intenta cerrar **el diálogo entero**. `reason`: `escape`, `backdrop` o `close` (botón de cierre o `close()` del slot). **`depth`** (#582): pasos en el historial (1 sin pasos), para que la aplicación decida si confirma por borradores. **Cancelable:** llamar a `preventDefault()` de forma síncrona mantiene el diálogo abierto |
| `update:steps` | `Array<String>` | El historial cambia (`push`, `back`, `backTo`, Esc o «Volver» en un paso > 1, salto desde el hilo). §«Niveles anidados» B |
| `step` | `{ from, to, direction, reason, result }` | Tras un cambio de paso, ya pintado y con el foco puesto. §«Niveles anidados» B |
| `open` | | El diálogo ya se muestra |
| `closed` | | El diálogo terminó de cerrarse (salida terminada y contenido desmontado), por el motivo que sea. Si se reabre durante la salida, no se emite |

- **`preventDefault()`** es una función del payload; si el consumidor no la llama, el cierre sigue. El componente cancela siempre el `cancel` nativo de Esc y decide él, para que Esc funcione igual con y sin `preventDefault`.
- Un cierre por cambio de `modelValue` desde fuera **no** emite `dismiss`; solo `closed`.
- `update:modelValue` no se emite si el consumidor impidió el `dismiss`.

## Slots

| Slot | Propósito | Alcance | Anatomía que debe conservar |
| --- | --- | --- | --- |
| `default` | Cuerpo | `{ close, push, back, backTo, steps }` (los cuatro últimos, §«Niveles anidados» B) | Dentro de `g-dialog__body`. Con pasos, aquí van los `GDialogStep` |
| `footer` | Acciones | `{ close, push, back, backTo, steps }` | Dentro de `g-dialog__footer` (con `inset`, dentro de la inset); solo se renderiza si el slot existe |
| `title` | Título con contenido rico (sustituye a `title`) | | Dentro de `h2#ID-title`; sin interactivos |
| `description` | Descripción con contenido rico (sustituye a `description`) | | Dentro de `p#ID-desc`; sin interactivos |
| `header` | Sustituye **título y descripción** por completo | `{ titleId, descriptionId }` | El consumidor debe usar esos ids si quiere el nombre accesible; el botón de cierre se conserva |
| `icon` | Icono decorativo antes del título (normalmente un `GIcon`; **sin icono por defecto**). Es el equivalente del `lead` de `GCard` y `GFormSection`: `GDialog` **no** gana un slot `lead` (#203) | | Se envuelve con `aria-hidden="true"` (`g-dialog__icon`), fuera del `h2`: no entra en el nombre del diálogo |
| `tabs` | **Cabecera de pestañas fija** (`GTabs` con `detached`, DECISIONS.md #119; ver `tabs.md`), a sangre, entre el encabezado y el cuerpo; **no se desplaza** (solo el cuerpo lo hace) | | Dentro de `g-dialog__tabs`, fuera del cuerpo y de la inset. La carcasa define `--g-tabs-inset` con su relleno inline para alinear la primera pestaña con el título; con el slot, `role="region"` y `tabindex` pasan del cuerpo a los `tabpanel` |

`close()` (en el alcance) cierra por la vía `close`: emite `dismiss` (cancelable) y luego `update:modelValue`. Para cerrar sin `dismiss`, el consumidor cambia `modelValue`.

### Clases utilitarias (de uso del consumidor)

- **`g-dialog__section`:** sección dentro del cuerpo; se separa de la anterior con una línea fina, sin caja. Con secciones, el cuerpo pierde su relleno y cada sección lo aporta.
- **`g-dialog__well`:** superficie secundaria hundida, un nivel más. Solo para agrupar algo que lo necesite; no se anida.

## Teclado

| Tecla | Acción |
| --- | --- |
| Tab / Shift+Tab | Recorre los controles del diálogo; no sale de él (nativo) |
| Esc | Con pasos y más de uno en el historial: **baja un paso** (`step` con `reason: 'escape'`, sin `dismiss`). Si no: emite `dismiss` (`escape`) y cierra si nadie lo impide. **Esc mantenida (`event.repeat`) se ignora**: un nivel por pulsación (#565). Un descendiente que ya la trató (`defaultPrevented`: lista de `GSelect`, aviso, `GFormFold`) la consume |
| Enter / Espacio | Activa el control enfocado (nativo) |
| Flechas / Re Pág / Av Pág | Desplazan el cuerpo cuando está enfocado |

Sin manejadores de teclado propios, salvo Esc.

## Adaptación (viewport, no contenedor)

Un diálogo se ancla al visor, no a su contenedor: usa **consultas de medios** (`@media`) sobre el ancho de la ventana.

| Ancho del visor | Estructura |
| --- | --- |
| Más de ~900px | Escritorio: centrado, ancho de `size` |
| Hasta ~900px | Tableta: relleno menor y `lg` más estrecho; mismas dos superficies |
| Hasta ~520px | Móvil: según `mobile` (`sheet`, `full-width`, `fullscreen`) |

Los umbrales (~900px y ~520px) son **constantes literales** de consulta de medios (excepción documentada: DECISIONS.md #34, #39 y #42). Cuando el visor es más bajo que el diálogo, la carcasa nunca supera el visor y solo el cuerpo se desplaza.

## Tokens consumidos

Superficies (nuevos, `tokens.md` §11): `--g-surface-shell`, `--g-surface-inset`, `--g-surface-gap`, `--g-surface-radius`, `--g-surface-radius-inset`, `--g-surface-backdrop`.

Existentes: `--g-color-border`, `--g-color-text`, `--g-color-text-muted`, `--g-color-focus`, `--g-radius-sm`, `--g-space-1..8`, `--g-font-ui`, `--g-text-{caption|body-sm|body|title-sm}-{size|line}`, `--g-text-title-weight` (título), `--g-text-action-weight`, `--g-border-width`, `--g-focus-width`, `--g-focus-offset`, `--g-shadow-3`, `--g-duration-fast`, `--g-duration-press`, `--g-ease-standard`, `--g-ease-out`.

**El cierre** es un botón con el mismo lenguaje que un `GBtn` `ghost` pero sin depender de él (un componente no importa a otro): lo estiliza `GDialog.css`.

Sin tokens de componente: el ancho y el relleno se derivan de `space`.

## Clases (contrato entre bruno y coco)

Bruno las emite; coco las estiliza. Ninguno usa otras.

| Clase | Elemento | Cuándo |
| --- | --- | --- |
| `g-dialog` | Raíz (`<dialog>`) | Siempre |
| `g-dialog--size-{sm\|md\|lg}` | Raíz | Siempre |
| `g-dialog--density-{default\|comfortable\|compact}` | Raíz | Siempre |
| `g-dialog--inset` | Raíz | Con `inset` |
| `g-dialog--fullscreen` | Raíz | Con `fullscreen` |
| `g-dialog--placement-{center\|end}` | Raíz | Siempre |
| `g-dialog--mobile-{sheet\|full-width\|fullscreen}` | Raíz | Siempre |
| `g-dialog--alert` | Raíz | Con `role="alertdialog"` |
| `is-loading` | Raíz | Con `loading` |
| `g-dialog__header`, `__titles`, `__title`, `__description`, `__icon`, `__close` | Encabezado | Según props y slots |
| `g-dialog__inset` | Superficie inset | Con `inset` |
| `g-dialog__body` | Cuerpo | Siempre |
| `is-scrollable` | Cuerpo | Cuando su contenido no cabe |
| `is-scrolled` | Superficie inset (o carcasa sin inset) | Mientras queda contenido por desplazar tras el cuerpo |
| `g-dialog__footer` | Pie | Con slot `footer` |
| `g-dialog__tabs` | Cabecera de pestañas fija | Con slot `tabs` |
| `g-dialog__section`, `g-dialog__well` | Utilitarias del consumidor | Las pone el consumidor |
| `has-origin` | Raíz | Hay vector al disparador escrito (`--_origin-x/y`), §«Personalidad» D1 |
| `is-pinned` | Raíz | El borde superior está fijado (`--_pin-top`), §«Personalidad» D2 |
| `is-stacked` | Raíz | Se abrió con otro modal debajo (`topModal`): su `::backdrop` es transparente y solo el nivel de abajo conserva el fondo (#567) |
| `g-dialog--steps` | Raíz | Con `GDialogStep` dentro (modo pasos, §«Niveles anidados» B) |
| `is-forward` · `is-back` | Raíz | Mientras dura el cambio de paso, según la dirección |
| `has-sheet-hold` | Raíz | Hoja móvil durante un recorrido de pasos: `--_sheet-hold` (px) es el alto máximo alcanzado (§B «Hoja móvil») |
| `g-dialog__back` | Botón «Volver a {paso}» del encabezado | Con más de un paso y `labels.back` |
| `g-dialog__trail`, `__trail-list`, `__trail-item`, `__trail-step`, `__trail-number`, `__trail-title` | El hilo | Con más de un paso |
| `is-parent` · `is-current` | `g-dialog__trail-item` | El paso de abajo (adonde lleva Volver) · el actual |
| `g-dialog__step` | Panel de un paso (`role="group"`) | Uno por paso del historial |
| `is-current` · `is-entering` | `g-dialog__step` | El visible · el que acaba de entrar, mientras dura su entrada |
| `is-resizing` | Raíz | Mientras dura el cambio de alto entre pasos (§«Movimiento (B)», protocolo del alto): el CSS anima del alto `--_step-from-h` al `--_step-to-h` |
| `--_step-from-h`, `--_step-to-h` (px, en línea) | Raíz | Los escribe el `.vue` al medir el alto del paso de salida (h0) y el del de entrada (h1); solo mientras dura `is-resizing` |
| `g-dialog__sr` | Texto oculto accesible del hilo (el `summary` del paso, tras su título) | Con `summary` en un paso del hilo |
| `--_fold-gap` | Raíz de `GFormFold` (`form.md` §15) | Separación entre el pliegue y el campo que lo pide; lo escribe el CSS de coco. `--_d` (la profundidad del pliegue, en línea) lo escribe el `.vue` pero **no lo consume el CSS** (reservado: dato de depuración y de pruebas) |
| `data-g-landed` | La caja que recibe una llegada | Ver §«La llegada». **Regla: la llegada pinta su anillo en `::before`, así que una caja que pueda recibir una llegada no usa `::before` para otra cosa** (coco lo comprueba al estilizar `GInput`, `GTextarea`, `GSelect`, `GFileField` y las filas) |

## Personalidad (DECISIONS.md #301; lenguaje común, #299 y `tokens.md` §29)

Ronda de kiwi `design/lab/personalidad/r01/` §4 (D2 y D1, prototipadas sobre el componente real) y decisión del usuario 2 (el diálogo **sí** aparece desde el botón que lo abrió). Ninguna prop, slot ni evento nuevo.

### Alcance

Solo **`placement="center"` sin `fullscreen`** y con un visor por encima del umbral móvil (~520px). La hoja lateral (`end`), la pantalla completa y los tres modos de `mobile` conservan su entrada, su salida y su crecimiento de hoy.

**El umbral lo aplica solo el CSS** (#307): las reglas de D1 y D2 van dentro de `@media (min-width: 521px)` (coco) y **el `.vue` no lo conoce**: escribe `has-origin`, `--_origin-*`, `is-pinned` y `--_pin-top` siempre que `placement="center"` sin `fullscreen`, y por debajo de 521px las clases y variables quedan **inertes** (la entrada y el crecimiento son los de hoy). Las pruebas de bruno no deben suponer que bajo el umbral no hay clase.

### D2 · Crece hacia abajo (#281)

1. Al abrir, el diálogo se coloca **centrado como hoy** (la colocación inicial no cambia).
2. Cuando el contenido ya está montado y el foco puesto (#292), en el cuadro siguiente, `GDialog.vue` mide el **borde superior** de la carcasa sin transformaciones (`offsetTop`), lo escribe como **`--_pin-top`** (px) y añade **`is-pinned`**. **Precisión (#307):** `offsetTop` es **entero**; cuando el borde centrado cae en una fracción de píxel, al fijarse el diálogo se mueve **≤ 0,5px** en Firefox y WebKit (medido por bruno; en la medida de coco, 0px en los tres motores, sin reproducir un caso fraccionario). **Se acepta como límite conocido** (no se exige `getComputedStyle().marginTop` ni `getBoundingClientRect()` descontando transformaciones): medio píxel no se percibe, no mueve el contenido ni el disparador de forma apreciable, y medir con transformaciones en curso (`translate`/`scale` de la entrada) complica y fragiliza el `.vue`.
3. Con `is-pinned`, el CSS (coco) fija ese borde (`margin-block-start` = `--_pin-top`) y limita el alto a lo que queda del visor menos su margen inferior (derivado de `space`); desde ahí el diálogo solo **crece hacia abajo**, y cuando no cabe desplaza su cuerpo (`is-scrollable`, como hoy). **`.is-pinned` no exige `[open]`** (#307): mientras dura la salida el diálogo sigue fijo y no salta al centro mientras se funde; el `.vue` la quita **tras** la salida.
4. Al **redimensionar la ventana** (una vez por cuadro): quita `is-pinned`, deja que se recoloque centrado y vuelve a medir y fijar. Al cerrar, quita `is-pinned` y `--_pin-top` tras la salida.
5. Afecta igual a un `GFormReveal` que se abre, a errores que aparecen y a `GTextarea autosize`.

### D1 · Viene de donde lo llamaste

1. **Antes de `showModal()`** (para que el primer estilo, `@starting-style`, ya lo tenga), si `document.activeElement` es un elemento **fuera del diálogo y distinto de `body`** (el disparador: el mismo al que vuelve el foco al cerrar), `GDialog.vue` escribe el vector **completo** desde el centro del visor (`innerWidth / 2`, `innerHeight / 2`, el centro del diálogo centrado) hasta el centro de la caja del disparador, como **`--_origin-x`** y **`--_origin-y`** (px), y añade **`has-origin`**. Sin disparador (foco en `body`), no escribe nada y no pone `has-origin`. **Límite conocido (WebKit, #307):** en Safari un clic **no enfoca** el botón (`document.activeElement` queda en `body`), así que con un disparador de ratón allí no hay `has-origin` y el diálogo **solo se funde** (entra y sale como #152); con teclado sí hay origen. No se busca el disparador por otra vía (último `pointerdown`). **Desde r02, la prop `from` (#583) da el disparador explícito**: con ella, D1 parte de `from` también en WebKit con un clic; sin ella, el límite sigue.
2. Con `has-origin`, el CSS parte de **un cuarto** del vector con **tope `--g-space-1 × 8` por eje** (`clamp`), junto al fundido y la escala de hoy, y termina centrado. Fracción y tope son constantes de coreografía (#299); el `.vue` no los aplica.
3. **Al cerrar**, antes de iniciar la salida, `GDialog.vue` vuelve a medir el vector desde el centro **real** del diálogo (con D2 ya no es el del visor) hasta el elemento al que volverá el foco; si ese elemento ya no está conectado o no tiene caja, quita `has-origin` y la salida es la de hoy (#152). La salida va hacia él con la misma fracción y tope, en `--g-duration-fast`.
4. Reabrir durante la salida: se reescribe el vector como al abrir.

### Movimiento reducido

D1 no existe: solo el fundido de #152. **D2 sí rige** (fijar un borde no es movimiento).

### Tokens y constantes

Sin tokens nuevos: `--g-duration-fast`, `--g-duration-press`, `--g-ease-out`, `--g-press-scale`, `--g-space-1`. Constantes neutras (#299): fracción `0.25` y tope `× 8`. No usa `--g-ease-spring` ni `--g-ease-bounce` (#299: nunca en diálogos).

### Notas para bruno

- `--_origin-*` y `--_pin-top` son variables dinámicas en línea (excepción como `--_mark-*` de `GTabs`); se escriben solo si cambian.
- El orden de foco de #292 no cambia; D2 mide **después** de él.
- Pruebas (vitest): `has-origin` y las variables antes de `showModal()` con un disparador enfocado; sin disparador, ni clase ni variables; al cerrar con el disparador desmontado, sin `has-origin`; `is-pinned` y `--_pin-top` tras abrir; solo con `placement="center"` sin `fullscreen`.

### Verificación (criterio de hecho: la medida de kiwi)

| Qué | Medida |
| --- | --- |
| D2 | Al abrir un bloque de 240px con el diálogo abierto: hoy el botón del pie sube ~126px; con D2, **Δ 0px** en el borde superior y en el botón (**≤ 0,5px** admitidos en Firefox y WebKit si el borde centrado cae en fracción de píxel, #307); el diálogo sigue dentro del visor (cuerpo desplazable si no cabe). Tres motores |
| D1 | Primer cuadro visible desplazado con el **signo** del vector (kiwi: 12,1/0,1 y 9,6/−9,6px); **desplazamiento absoluto ≤ `space × 8`** por eje; termina centrado; al cerrar, se aleja hacia el disparador (Chromium; Firefox y WebKit cierran sin cuadros intermedios, #152); el foco vuelve al disparador en los tres. Con `reduce`: sin desplazamiento |
| Reservadas | D3 (arrastrar la hoja móvil para cerrar) y D4 (pulso al clicar el fondo de un `alertdialog`): fuera de esta tanda |

## Niveles anidados (r02 · B «El hilo» + C «En su sitio»; #580 a #591)

**Fuente:** `design/lab/dialog/r02/` (kiwi: `brief.md`, `declaracion.md` con la base §1 y los hallazgos L1 a L18, `index.html`, `flow.js`, `app.js`, `verificar.mjs` 287/287 en los tres motores). **Decisión del usuario:** B + C (#580). L1 a L4 ya son contrato (§«Correcciones de defectos medidos», #565 a #568) y no se repiten aquí. **Componente complejo** (CLAUDE.md, «Modelos por rol»: motor de estado de la pila, se posiciona sobre otros, compone `GForm` y `GSelect`): **coco y bruno en Opus**.

### Qué forma tiene cada cosa (frontera, #591)

| Lo que falta | Forma | Por qué |
| --- | --- | --- |
| **Un valor para un campo de la tarea actual** («Tris base» no está en el catálogo; la categoría que no existe; completar una fila) | **`GFormFold`** bajo el campo o la fila que lo pide (C; `form.md` §15) | Lo que se está llenando no se tapa; cero capas nuevas |
| **Otra tarea del mismo recorrido cuyo resultado vuelve abajo** (del detalle al ingreso) | **Un paso** del mismo `GDialog` (B, `GDialogStep`) | Un solo modal: un fondo, una trampa de foco, avisos y hoja sin pila; el hilo deja volver a cualquier punto |
| **Algo independiente que no devuelve valor** (confirmar descartar, un `alertdialog`) | Otro `GDialog` encima (apilado nativo, con #565 a #568) | No es un nivel del recorrido |
| Un proceso **conocido y lineal** (paso 1 de 4) | `GStepper` (`stepper.md`) | El historial de B **crece por lo que falta**; no es un progreso |
| Navegar entre páginas | `GBreadcrumbs` | El hilo son **botones de un historial** interno (`aria-current="step"`), no enlaces |

Un recorrido mezcla las dos formas: en el flujo real, Detalle → Ingreso es un paso; Partida, Producto y Categoría son pliegues anidados dentro del paso «Ingreso» (o un paso «Partida» con sus pliegues, si la partida es una tarea grande: lo decide la aplicación con esta tabla).

### Base (rige para pasos y pliegues; #581)

1. **Un nivel es una tarea con nombre y propósito.** Cada nivel tiene **título** (su nombre accesible) y **descripción** que dice adónde va su resultado («Se elegirá en Categoría del producto nuevo»). Las dos son texto de la aplicación (`title`, `description` del paso o del pliegue); Grana no compone frases. Sin título, aviso en desarrollo.
2. **Quién abre un nivel se dice:** `from` (`id` o elemento) en `GDialog` (#583), en `push(name, { from })` y en `GFormFold`. Sin `from`, `document.activeElement` fuera del nivel que se abre, si no es `body`. El `create` de `GSelect` ya devuelve el foco al selector antes de emitir (`select.md`), así que allí basta el valor por defecto; en WebKit, con un clic en un `GBtn`, hay que pasar `from` (#307).
3. **Foco al entrar:** el orden de #292 **dentro del nivel** (primer `[autofocus]` usable, primer control del contenido). **Nunca** «Volver», el cierre ni los botones del hilo (no son contenido).
4. **Bajar un nivel sin resultado:** Esc, «Volver a {nivel de abajo}» y la acción de cancelar del nivel bajan **exactamente un nivel**; Esc con `event.repeat` se ignora (#565). Foco: al `from` del nivel que se cierra; si ya no es usable, el orden de #292 en el nivel de abajo.
5. **El fondo no descarta trabajo:** el clic en el fondo solo emite `dismiss` (`backdrop`) con **un solo paso** en el historial, **ningún `GFormFold` abierto** dentro y ningún modal debajo (#568). Con más, no hace nada.
6. **Volver nunca borra** (L8). Bajar un nivel no reinicia nada. Los pasos que siguen en el historial **siguen montados** (inertes y ocultos), así que un formulario a medias se conserva aun sin modelo, **y la posición de desplazamiento del cuerpo se restaura** al volver a un paso. Un paso que **sale** del historial y un pliegue que se cierra **se desmontan**: su borrador vive en el **modelo de la aplicación** (los campos ya tienen `v-model`). Sin diálogo de «¿Descartar cambios?» al bajar (sería otro nivel). **Receta** (README): el borrador de cada nivel es un objeto del modelo que la aplicación solo reinicia al confirmar ese nivel o al cerrar el recorrido (`@closed`).
7. **Confirmar devuelve un valor al nivel de abajo.** La aplicación escribe el valor en **su** modelo (Grana presenta y emite intención, no toca datos) y baja con **`focus`** y **`announce`** (`back({ focus, announce })` en un paso, `close({ focus, announce })` en un pliegue). Entonces, en este orden:
   1. el foco va a **`focus`** (`id` o elemento: el campo que recibió el valor); si no se dio o no es usable, al `from` del nivel; si tampoco, el orden de #292;
   2. ese campo **aterriza** (`data-g-landed`, §«La llegada»);
   3. `announce` (texto de la aplicación, **sin valor por defecto**: sin él, no se anuncia nada) se escribe en el **canal cortés de página** (`announcePage`, #533), que vive en el `<dialog>` modal superior. Nunca `assertive`. WCAG 4.1.3.
8. **Confirmar con error no baja:** el `GForm` del paso o el propio `GFormFold` revelan y enfocan el primer error, como siempre.
9. **Cerrar el recorrido entero** es una acción explícita y única: el cierre (X) del diálogo, que emite `dismiss` con **`depth`** (#582).
10. **Un formulario por nivel, nunca anidado:** `GDialog` corta el contexto (#566) y `GFormFold` provee el suyo (`form.md` §15).
11. **Avisos, isla, voz y el canal de página** siguen al modal superior (`topModal.js`, sin cambios).
12. **Profundidad:** sin límite duro. Más de cinco niveles es una señal de diseño del flujo, no del componente.

### B · Pasos con historial (`GDialogStep`, #584 y #585)

**Un solo `<dialog>`** con un historial de pasos. Los pasos se **declaran** como hijos de `GDialog` (todos los posibles, en cualquier orden); el **historial** dice cuáles están abiertos y en qué orden.

```vue
<GDialog v-model="abierto" v-model:steps="pasos" :from="boton" close-label="Cerrar"
         :labels="{ back: 'Volver a {title}', trail: 'Recorrido' }" @dismiss="confirmarSiHayBorradores">
  <GDialogStep name="detalle" title="Ácido clorhídrico 37 %" description="Detalle de producto">
    <template #default="{ push }">… <GBtn @click="push('ingreso')">Registrar ingreso…</GBtn></template>
  </GDialogStep>
  <GDialogStep name="ingreso" title="Ingreso desde orden de compra" description="Entrará en Ácido clorhídrico 37 %"
               :summary="`${oc} · 3 partidas`">
    <template #default="{ back }">
      <GForm id="f-ingreso" :errors="errores" @submit="registrar(back)"> … </GForm>
    </template>
    <template #footer="{ back }">
      <GBtn variant="ghost" @click="back()">Cancelar</GBtn>
      <GBtn type="submit" form="f-ingreso">Registrar ingreso</GBtn>
    </template>
  </GDialogStep>
</GDialog>
```

#### `GDialog` en modo pasos

| Pieza | Regla |
| --- | --- |
| Modo pasos | Lo activa tener **al menos un `GDialogStep`** registrado. Clase `g-dialog--steps` |
| `steps` (`v-model:steps`) | Historial: arreglo de nombres, el último es el **actual**. **Con o sin `v-model`:** sin él, el historial es interno, empieza con el **primer `GDialogStep` declarado** y vuelve a él tras `closed`. Con él, el componente pinta la prop y emite `update:steps`; un historial vacío con el diálogo abierto se trata como `[primer paso]`. La aplicación decide qué hace con el historial tras `closed` (receta: reiniciarlo ahí). Un nombre que no es de ningún paso se ignora con aviso; un nombre **repetido** en el historial, también (aviso: el mismo paso no se abre dos veces; un paso recursivo queda reservado) |
| `push(name, { from } = {})` | Añade `name` al historial y lo hace actual. `from` como en la base 2 (por defecto, `document.activeElement` dentro del diálogo). Con el diálogo cerrado, no hace nada y avisa (abrir es `modelValue`; para abrir en un paso hondo, la aplicación pone `steps` antes de abrir) |
| `back({ result, focus, announce } = {})` | Quita el paso actual y vuelve al de abajo, con la base 7 (con `focus`/`announce`) o la base 4 (sin ellos). `result` (cualquier valor) **no lo usa Grana**: viaja en el evento `step` para pasos escritos como componentes que no conocen el modelo de abajo. **Con un solo paso**, equivale a `close()` (emite `dismiss` `close`, cancelable) |
| `backTo(name, { focus, announce } = {})` | Vuelve de un salto a un paso del historial (quita todos los de encima). Sin `focus`: al `from` del paso que estaba **justo encima** de `name` (en el flujo real, saltar al ingreso deja el foco en «Completar partida 3»); si no es usable, #292. Un solo evento `step` |
| Dónde están | En el alcance de los slots `default` y `footer` de `GDialog` y de `GDialogStep`, en **`useDialogSteps()`** (dentro del contenido de un `GDialog`; fuera, devuelve `null`) y expuestos en la instancia (`defineExpose`). `useDialogSteps()` devuelve `{ steps, current, depth, push, back, backTo }` (`steps`, `current` y `depth`, de solo lectura) |
| Evento `step` | `{ from, to, direction: 'forward' \| 'back', reason: 'push' \| 'back' \| 'escape' \| 'trail', result }` (`result` solo con `back`). Se emite tras pintar el paso nuevo y poner el foco. No es cancelable (bajar nunca borra: no hay nada que confirmar) |
| Encabezado | Muestra el `title` y la `description` del **paso actual** en el `h2` y el `p` de siempre, con ids por paso (`ID-step-{name}-title`, `-desc`); el `<dialog>` cambia su `aria-labelledby`/`aria-describedby` a los del actual. En modo pasos, las props `title`/`description` y los slots `title`/`description`/`header` de `GDialog` **no se usan** (aviso si se dan). El slot `icon` sigue, común a todos los pasos |
| «Volver» | Con más de un paso: botón **`g-dialog__back`** al inicio del encabezado, antes de los títulos, con `chevron-left` (`flip-rtl`, `GLibIcon`) y nombre **`labels.back`**: String con `{title}` o Function `(title) => String`, con el título del paso de abajo («Volver a Partida 3»). Sin `labels.back`, no se pinta y avisa (como `closeLabel`); Esc y el hilo siguen bajando |
| Cierre (X) | Sigue igual y **cierra el recorrido entero** (`dismiss` `close` con `depth`) |
| Pie | Se pinta el slot **`footer` del paso actual** en `g-dialog__footer`; sin él, no hay pie. El `footer` de `GDialog` no se usa en modo pasos (aviso) |
| Esc | Más de un paso: baja uno (`reason: 'escape'`, sin `dismiss`). Un paso: `dismiss` como hoy. Repetida, ignorada (#565) |
| Fondo | Base 5 |
| `dismiss` | `depth` = largo del historial |
| `size` | **Uno para todos los pasos** (el del `GDialog`). `size` por paso queda **reservado** (L10): con el borde superior fijo y el cambio de ancho animado, ronda propia si se pide |
| Slot `tabs` | **No se combina con pasos** en esta entrega (aviso; reservado: el hilo ocupa su sitio) |

#### `GDialogStep`

| Prop | Tipo | Default | Regla |
| --- | --- | --- | --- |
| `name` | String | **requerida** | Única entre los pasos del diálogo (aviso si se repite) |
| `title` | String | sin valor | Nombre del paso: `h2` del encabezado, nombre del panel y del hilo. Sin él, aviso |
| `description` | String | sin valor | Propósito (adónde va su resultado) |
| `summary` | String | sin valor | Lo que el paso espera o lleva, en corto («Producto: falta», «OC-2291 · 3 partidas»): se **lee** en el hilo tras el título del paso (texto oculto accesible); no se pinta. El mismo nombre y sentido que `summary` de `GFormSection` |

| Slot | Alcance | Dónde |
| --- | --- | --- |
| `default` | `{ close, push, back, backTo, steps }` | Panel del paso (`g-dialog__step`) dentro de `g-dialog__body` |
| `footer` | igual | `g-dialog__footer` cuando el paso es el actual |

- **Fuera de un `GDialog`**, no pinta nada y avisa. Sin eventos propios (el diálogo emite `step`).
- **Montaje:** un paso **solo se monta mientras está en el historial**; los que no son el actual llevan `hidden` e `inert` (base 6).
- Atributos (`class`, `data-*`) van al panel.

#### Estructura (modo pasos)

```html
<dialog class="g-dialog g-dialog--steps … is-pinned" aria-labelledby="ID-step-partida-title" aria-describedby="ID-step-partida-desc">
  <div class="g-dialog__header">
    <button class="g-dialog__back" type="button" aria-label="Volver a Ingreso desde orden de compra">…chevron-left…</button>
    <div class="g-dialog__titles">
      <h2 class="g-dialog__title" id="ID-step-partida-title">Partida 3</h2>
      <p class="g-dialog__description" id="ID-step-partida-desc">Para el ingreso de la OC-2291</p>
    </div>
    <button class="g-dialog__close" type="button" aria-label="Cerrar">…</button>
  </div>
  <nav class="g-dialog__trail" aria-label="Recorrido">                      <!-- solo con más de un paso -->
    <ol class="g-dialog__trail-list">
      <li class="g-dialog__trail-item">
        <button class="g-dialog__trail-step" type="button">
          <span class="g-dialog__trail-number" aria-hidden="true">1</span>
          <span class="g-dialog__trail-title">Ácido clorhídrico 37 %</span><span class="(texto oculto)">, Existencia 48 L</span>
        </button>
      </li>
      <li class="g-dialog__trail-item is-parent">…</li>
      <li class="g-dialog__trail-item is-current">
        <span class="g-dialog__trail-step" aria-current="step"><span class="g-dialog__trail-number" aria-hidden="true">3</span><span class="g-dialog__trail-title">Partida 3</span></span>
      </li>
    </ol>
  </nav>
  <div class="g-dialog__inset">
    <div class="g-dialog__body">
      <section class="g-dialog__step" role="group" aria-labelledby="ID-step-detalle-title" hidden inert>…</section>
      <section class="g-dialog__step" role="group" aria-labelledby="ID-step-ingreso-title" hidden inert>…</section>
      <section class="g-dialog__step is-current" role="group" aria-labelledby="ID-step-partida-title">…</section>
    </div>
    <div class="g-dialog__footer">…footer del paso actual…</div>
  </div>
</dialog>
```

- **El hilo** (#585): `nav` con nombre **`labels.trail`** (sin él, aviso y `nav` sin nombre). Un `li` por paso del historial, en su orden. Los pasos anteriores son **botones** (`type="button"`) que llevan a ese paso de un salto (`backTo`, `reason: 'trail'`): Tab y Enter/Espacio, **sin manejadores de teclado propios** (lista corta; no es foco itinerante). El actual es un `span` con **`aria-current="step"`**, no enfocable. Nombre de cada botón: título + `, ` + `summary` (si lo hay). **Visible:** los lejanos, solo su número (el título queda como texto oculto accesible); el **padre** (`is-parent`, adonde lleva Volver) enseña número y título; el actual, número y título en acento. Cómo cede el título del padre en anchos estrechos: coco (sin desborde horizontal a 375px).
- El `aria-labelledby` de un panel oculto apunta a un id que no está pintado (solo el actual tiene título en el encabezado): es correcto, porque un panel oculto no se expone. El título del actual se **sustituye** (nodo nuevo por paso) para que el cambio de nombre no se quede en un nodo reutilizado.
- `role="region"` y `tabindex` del cuerpo desplazable (§«Foco») se miden **por paso** al entrar (cambia el contenido).

#### Movimiento (B; #586; sin muelle, #299)

| Qué | Cómo |
| --- | --- |
| Ir más hondo | El paso nuevo entra **desde el final** (`translate` de `space × 6` en el eje en línea + fundido), `--g-duration-slow` + `--g-ease-out`; raíz `is-forward` mientras dura |
| Volver (uno o un salto) | El paso de destino entra **desde el inicio**; raíz `is-back`. Espejado en RTL (eje lógico). Un salto anima **una** vez, al destino |
| Alto de la carcasa | **Cambia** del alto del paso de salida al del de entrada en `--g-duration-slow` + `--g-ease-out`, **con el borde superior fijo** (D2: `is-pinned` se conserva entre pasos; medido Δ 0px del nivel 3 al 5). El mecanismo (medir antes y después y animar el alto del inset) lo acuerdan bruno y coco; el `.vue` no lleva `<style>` y, si anima con la API de animaciones, lee duración y curva del estilo calculado (como #149) |
| D1 | Solo al abrir y cerrar el diálogo, no entre pasos |
| Hoja móvil (≤ ~520px; L11, cierra la parte de la hoja de #281 durante un recorrido) | **La hoja no encoge mientras dura el recorrido:** el `.vue` guarda el alto máximo alcanzado desde que se abrió en `--_sheet-hold` (px) con `has-sheet-hold`, y el CSS lo usa como alto mínimo de la hoja (solo bajo el umbral, como D1/D2 en #307: el `.vue` lo escribe siempre en modo pasos). Su borde superior puede **subir** al ir más hondo, pero **no baja** y vuelve a subir al ir y volver. Se borra tras `closed`. Si el visor cambia de alto, se vuelve a medir |
| `prefers-reduced-motion: reduce` | Solo fundido entre pasos; sin desplazamiento ni animación del alto (el alto cambia de golpe, con el borde fijo) |

**Protocolo del alto entre pasos (#651).** (1) Antes de cambiar de paso el `.vue` mide el alto de la carcasa (h0); (2) cambia de paso y mide el nuevo (h1); (3) escribe `--_step-from-h: h0` y `--_step-to-h: h1` en la raíz y añade `is-resizing`; (4) el CSS anima el alto de h0 a h1 con la animación `g-dialog-resize` (`--g-duration-slow` + `--g-ease-out`, borde superior fijo); (5) en su `animationend` (o `animationcancel`, o el respaldo del movimiento reducido, que no anima) el `.vue` quita `is-resizing` y borra las dos variables. **`interpolate-size: allow-keywords` queda descartado** porque Firefox y WebKit no lo soportan; el protocolo con medidas en píxeles funciona en los tres motores. Si h0 = h1 no se añade `is-resizing`.

**Desviación aceptada por contraste (#651).** El paso actual del hilo (`is-current`) se pinta con el par **`--g-color-accent-soft` / `--g-color-on-accent-soft`** (relleno suave y su texto) y **no** como texto en `--g-color-accent-text`: `accent-text` sobre `surface-sunken` daba 4,22:1 en el tema por defecto, por debajo de 4,5:1. El par garantiza el contraste por contrato (`tokens.md` §7.1). Los pasos anteriores siguen en `--g-color-text-muted`/`--g-color-text` como estaban.

**Sin `--g-ease-spring` ni `--g-ease-bounce`** (#299: nunca en diálogos). **Sin tokens nuevos.** Constante de coreografía (#299): desplazamiento `space × 6`.

### C · En su sitio (`GFormFold`, #587 y #588)

Lo que falta **para un campo** se crea en un **pliegue bajo el campo** (o la fila) que lo pide, con su propio confirmar, sin capa nueva. El contrato completo es **`form.md` §15** (el pliegue es una pieza del sistema de formularios y funciona también fuera de un diálogo). Lo que `GDialog` hace por él:

- **Esc:** el pliegue la trata primero (recoge **solo** el pliegue de arriba y la cancela con `preventDefault`); el diálogo no baja de paso ni emite `dismiss` (guarda `defaultPrevented`, #565).
- **Fondo:** con un pliegue abierto dentro, el clic en el fondo no cierra (base 5). El `GDialog` lo sabe por un registro interno (los pliegues abiertos se registran en el diálogo más cercano por una clave de inyección interna, que llega a la entrada de `GFormFold` por `__shared`; no lee el DOM).
- **D2:** el pliegue que se abre hace crecer el diálogo **hacia abajo** con el borde fijo (ya rige, como `GFormReveal`).
- **Paso que sale del historial** con un pliegue abierto: el pliegue se desmonta con él (base 6).

### La llegada (`data-g-landed`; personalidad, #589)

Lenguaje común de **«un valor que vuelve»**: al bajar con resultado (base 7), el campo que lo recibe se marca un instante.

| Pieza | Regla |
| --- | --- |
| Dónde | La **caja visible** del destino: el destino mismo o su ancestro más cercano con `data-g-tooltip-box` (#395: `GInput`, `GTextarea`, `GSelect`, `GFileField` y quien componga `GInput`); sin ninguno, el propio destino (una fila, un botón) |
| Marca | Atributo **`data-g-landed`** (vacío, interno, no es API) que pone `GDialog` o `GFormFold` con la utilidad común **`utils/landing.js`** (`land(target)`). Atributo y no clase: el componente dueño de la caja repinta su `class` y la borraría |
| Fin | Lo quita al recibir `animationend`/`animationcancel` cuya animación empieza por **`g-landed`**, al llegar otra llegada al mismo elemento, o como respaldo a los **1000 ms** (constante) si el tema no la anima |
| CSS (coco) | **Una sola regla** compartida, seleccionada por `[data-g-landed]` (propuesta: en `GDialog.css`, que va en `grana.css` con todo): un anillo de `--g-focus-width` en **`--g-color-accent-text`** (forma, ≥ 3:1 garantizado, `tokens.md` §7.1) que se recoge hacia la caja en `--g-duration-slow × 3` con `--g-ease-out`; convive con el anillo de foco (`--g-color-focus`), por fuera de él. `forced-colors`: `Highlight`. Reducido: un fundido corto (`--g-duration-fast`) del mismo anillo, sin crecer ni recogerse. Sin tokens nuevos |
| Accesibilidad | Es decorativa: lo que se dice va por el foco (el campo con su valor) y por `announce` |

### Avisos de desarrollo (`[Grana GDialog]`, además de los vigentes)

1. Modo pasos con `title`, `description`, slots `title`/`description`/`header` o `footer` de `GDialog` (no se usan).
2. Un paso sin `title`; `name` repetido entre pasos; un nombre del historial que no es de ningún paso; un nombre repetido en el historial.
3. Más de un paso sin `labels.back` (no hay «Volver») o sin `labels.trail` (`nav` sin nombre).
4. `push` con el diálogo cerrado.
5. Slot `tabs` con pasos.
6. `GDialogStep` fuera de un `GDialog`.

### Paquete y peso (#590)

- **`GDialogStep`, `useDialogSteps` y el modo pasos van en el principal** (`GDialog` está en el principal y el modo pasos no se separa de su encabezado, su Esc y su pie). `utils/landing.js` también (lo usan `GDialog` y `GFormFold`). **Abre la valoración de #506/#550:** bruno **mide** el crecimiento gzip del principal (KiB, #550) con todo lo de esta sección. **Tope: +4 KiB.** Si lo supera, vuelve a lima para sacar el modo pasos a una entrada propia con un gancho mínimo en `GDialog`.
- **`GFormFold` va en entrada propia `@grana/vue/form-fold`** (global UMD `GranaFormFold`; por defecto, #550), con `useFormField`, las claves de contexto, el motor de formulario, `utils/landing.js`, `utils/collapse.js` y el canal de página por `__shared`. Lo que `GForm` gana para él (`form.md` §15, «Cambios en `GForm`») se queda en el principal y también se mide.
- Bruno registra las cifras en `CHANGELOG.md` y en el `meta.json` de cada pieza (`GDialog`: `from`, `steps`, `labels`, `update:steps`, `step`, `depth` en `dismiss`, alcance de slots, métodos expuestos; `GDialogStep`; `GFormFold`), con la entrada nueva en `exports`, `typesVersions`, `ENTRIES` de `scripts/build-types.mjs` y `src/types.test.js` (#443).

### Verificación (bruno; base: `design/lab/dialog/r02/verificar.mjs`, L18)

- **vitest:** `from` (id y elemento; retorno del foco; origen de D1 sin foco previo); `dismiss` con `depth`; modo pasos con y sin `v-model:steps`; `push`/`back`/`backTo` (historial, `update:steps`, `step` con cada `reason`, `result` que viaja); `back` con un paso = `close()`; `aria-labelledby` del `<dialog>` al paso actual; paneles no actuales `hidden` + `inert` y montados; paso que sale, desmontado; Esc en paso > 1 baja sin `dismiss`; Esc repetida ignorada; Esc consumida por un descendiente; fondo con dos pasos o un pliegue abierto, sin `dismiss`; «Volver» con `labels.back` String y Function; hilo (`aria-current="step"`, nombres con `summary`, salto con foco al `from` del paso de encima); foco por la base 3, 4 y 7; `data-g-landed` en la caja (`data-g-tooltip-box`) y retirada por `animationend` y por respaldo; `announce` en el canal de página trasladado al modal superior y nada sin `announce`; avisos 1 a 6; SSR de un `GDialog` cerrado con pasos.
- **Playwright** (tres motores, en `design/lab/theme-playground/`): el recorrido de cinco niveles de kiwi con pasos y pliegues: un solo fondo; Esc mantenida baja uno; borrador que vuelve (montado y en el modelo) y desplazamiento restaurado; resultado con foco, llegada y anuncio en el modal superior; error al confirmar sin bajar; salto desde el hilo con teclado; **borde superior Δ 0px** entre pasos (≤ 0,5px admitidos, #307); hoja a 375px que no baja al volver y sin desborde horizontal; RTL (entrada espejada, chevron espejado); reducido (sin desplazamiento ni animación del alto); `GToaster` dentro del diálogo.
- **No automatizable (entorno real):** lector de pantalla (cambio de nombre del `<dialog>` por paso, `role="group"` al recibir el foco, orden de la frase tras el foco, hilo), táctil, zoom 200 %, `forced-colors`.

## Convivencia con avisos (`GToaster`, `toast.md`; DECISIONS.md #141 y #143)

- Mientras un `<dialog>` modal está abierto, la región de avisos **se traslada dentro de él** (es lo único que no queda inerte) y vuelve al `body` al cerrarse. `GDialog` no hace nada para ello: lo resuelve `GToaster` observando el atributo `open`. El contenido del diálogo sigue siendo de `GDialog`; la raíz de la región es un hijo más del `<dialog>` que Vue no gestiona desde `GDialog`.
- **El Esc de un aviso no debe llegar al manejador de `GDialog`.** Estado actual verificado en `GDialog.vue`: el Esc se escucha con `@keydown` y `@cancel` **sobre el propio `<dialog>`, en fase de burbuja** (sin `.capture` ni escucha de documento). El aviso trata Esc en su región (descendiente del `<dialog>`) con `preventDefault()` + `stopPropagation()`: el `keydown` no sube hasta el `<dialog>` y, al estar cancelado, el navegador no genera la petición de cierre, así que **tampoco hay `cancel`** (HTML, *close requests*). **No hace falta ningún cambio en `GDialog`.**
- **Condición que debe mantenerse:** si algún día `GDialog` pasa su Esc a fase de captura o a una escucha de documento, debe ignorar el `keydown` con `event.defaultPrevented` o cuyo destino esté dentro de `.g-toaster` o de `.g-speech-host` (panel de la captura de voz, `speech.md` §11; y lo mismo cualquier componente que escuche Esc en captura). **Recomendado (bruno, no bloquea):** añadir ya la guarda `if (event.defaultPrevented) return` al principio de `onKeydown` de `GDialog.vue`, que protege también frente a otros descendientes que tratan Esc (`GMenu`, `GSelect`), y una prueba con `GDialog` real + `GToaster` en la suite de `GToaster` (Esc en el aviso no emite `dismiss`; Esc fuera sí).
- Pendiente: que `preventDefault` del `keydown` suprima el `cancel` también en Firefox y WebKit (Playwright, #108).

## Límites conocidos

- **Diálogos apilados:** un `GDialog` abierto sobre otro funciona con el navegador y, desde #565 a #568, con un solo fondo, Esc de uno en uno, fondo que no cierra con otro modal debajo y formularios independientes. Es la forma **para otra tarea independiente que no devuelve un valor** (p. ej. un `alertdialog` de confirmación); para niveles que devuelven un valor, pasos (B) o `GFormFold` (C), §«Niveles anidados». **Sin no modales.**
- **Sin arrastre de la hoja** (bottom sheet) ni gesto para cerrar.
- ~~Sin animación de salida~~: sale animado desde #152 (plan 009).
- **Lector de pantalla:** cómo se anuncian el título, la descripción y el cuerpo desplazable está por verificar con lectores reales.
- **Teclado virtual en móvil:** el visor se reduce y una hoja alta puede tapar campos; por verificar en dispositivo real.
- **Navegadores:** exige `<dialog>` con `showModal()` y `:has()` (bloqueo del scroll de la página): todos los actuales.
- **Pulso de `is-loading` (#539; segunda entrega de #540, solo coco):** el pulso infinito (`g-dialog-pulse`) choca con #299 §5 y con WCAG 2.2.2 pasados 5 s. Pasa a **finito, que termina antes de 5 s**, o a quieto; con movimiento reducido, quieto. Sin cambio de API.

## Abierto (no bloquea el paso siguiente)

- **Resuelto para `placement="center"` por #301** (§«Personalidad», D2). Para la hoja inferior móvil, **resuelto solo durante un recorrido de pasos** (#586, `has-sheet-hold`); un diálogo sin pasos cuya hoja crece sigue abierto. Texto original: **Crecer sin mover lo que ya está a la vista** (DECISIONS.md #281; kiwi `design/lab/form-reveal/r01/`, L8): centrado, un diálogo cuyo contenido crece (un `GFormReveal` que se abre, errores que aparecen, `GTextarea autosize`) crece hacia los dos lados y **mueve el disparador** (medido: 120px al abrir un bloque de 240px; en hoja de 375px, 240px; anclado arriba, 0). Se deriva del principio «sin saltos» (form r01 §11). **Ronda propia de `GDialog`** (kiwi → lima → coco/bruno): un diálogo abierto crece **hacia abajo** (borde superior fijo desde que se abre) y la hoja conserva su borde superior mientras quepa. Cambiar la colocación **inicial** (dejar de centrar) sería pregunta al usuario.

- Valores de `--g-surface-*`, profundidad y movimiento: los decide coco en `defaults.css`.
- Si `GSurface` (componente) o solo clases: se decide cuando un segundo componente (drawer, panel) reutilice el patrón.

## Correcciones de defectos medidos (r02 L1 a L4; DECISIONS.md #565 a #568)

Defectos del componente actual, independientes de la forma nueva (elegida después: §«Niveles anidados», #580). Fuente: `design/lab/dialog/r02/declaracion.md`.

1. **Frontera de formulario (#566).** `GDialog` corta los contextos de formulario con `provide(formKey, null)` (como ya hace con `TABS_NEST`). Un `GForm` dentro de un diálogo es **siempre un `<form>` propio**, independiente del de fuera: su envío no dispara el exterior y sus campos no se registran en él. Un campo suelto (`useFormField`) dentro del diálogo, sin `GForm` propio, **no** ve el `GForm` de fuera. Verificación (bruno): `GDialog` con `GForm` dentro de otro `GForm`.
2. **Esc repetida (#565).** `keydown` de Esc con `event.repeat` se ignora (el `cancel` nativo se cancela igual); un nivel de la pila por pulsación. Verificación: mantener Esc con cinco niveles cierra solo uno.
3. **Un solo fondo visible (#567).** Un `GDialog` que se abre con otro modal debajo (`topModal`) lleva `is-stacked` y su `::backdrop` es transparente; el de abajo conserva el suyo. Al cerrar el de arriba, el de abajo sigue con su fondo sin parpadeo. Sin token nuevo (coco: transparente con los tokens de superficie existentes).
4. **Clic en el fondo con otro modal debajo (#568).** No emite `dismiss` (precisa `closeOnBackdrop`): el clic en el fondo cierra solo el nivel superior cuando es el único modal; con otro debajo, el fondo del nivel superior no cierra nada (el de abajo es inerte). Esc y el botón de cierre siguen funcionando.
