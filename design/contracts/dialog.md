# Contrato · GDialog

**Dueño:** lima · **Estado:** aprobado · **Basado en:** `design/lab/dialog/r01/` (kiwi)
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
| `closeOnBackdrop` | Boolean | | `true` | propia |
| `loading` | Boolean | | `false` | compartida (precisada en `api.md`) |
| `id` | String | | generado | propia |

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
- **`closeOnBackdrop`:** con `true`, un clic en el fondo emite `dismiss` con `reason: 'backdrop'`. Un arrastre que empieza dentro y termina en el fondo **no** cuenta (el clic debe empezar y terminar en el fondo).
- **`loading`:** `aria-busy="true"` en la carcasa y clase `is-loading`. No bloquea nada: las acciones las controla el consumidor.
- **`id`:** si no se da, se genera uno estable (`useId`); de él derivan los ids de título y descripción.
- **Resto de atributos** (`class`, `style`, `data-*`, `aria-*`, escuchas): van al `<dialog>` (raíz).

## Foco

- **Al abrir** (orden explícito, DECISIONS.md #292; lo hace el componente tras montar el contenido, no el navegador): 1) el primer elemento con **`autofocus`** usable (no deshabilitado, no `inert` ni `hidden`, sin `tabindex` negativo, visible); 2) si no, el **primer control enfocable del contenido** en orden del DOM, **excluidos el botón de cierre y el cuerpo desplazable** (su `tabindex="0"` no lo hace un control); 3) si no, el **botón de cierre**; 4) si no, el propio **`<dialog>`**. Si el foco ya está dentro (lo puso el consumidor en `open`), no se mueve. Con `preventScroll: true`. En `alertdialog`, **el consumidor pone primero la acción segura o le da `autofocus`** (se documenta; sin advertencia). *Por qué no «nativo»:* el contenido se monta después de `showModal()` y el navegador deja el foco en el `<dialog>` (kiwi, `design/lab/form-section/r01/` L10, medido en los tres motores); y el orden nativo elegiría el botón de cierre, que va primero en el DOM, en lugar del primer campo de un formulario.
- **Al cerrar:** vuelve al elemento que tenía el foco al abrir (nativo).
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
| `dismiss` | `{ reason, preventDefault() }` | El usuario intenta cerrar. `reason`: `escape`, `backdrop` o `close` (botón de cierre o `close()` del slot). **Cancelable:** llamar a `preventDefault()` de forma síncrona mantiene el diálogo abierto |
| `open` | | El diálogo ya se muestra |
| `closed` | | El diálogo terminó de cerrarse (salida terminada y contenido desmontado), por el motivo que sea. Si se reabre durante la salida, no se emite |

- **`preventDefault()`** es una función del payload; si el consumidor no la llama, el cierre sigue. El componente cancela siempre el `cancel` nativo de Esc y decide él, para que Esc funcione igual con y sin `preventDefault`.
- Un cierre por cambio de `modelValue` desde fuera **no** emite `dismiss`; solo `closed`.
- `update:modelValue` no se emite si el consumidor impidió el `dismiss`.

## Slots

| Slot | Propósito | Alcance | Anatomía que debe conservar |
| --- | --- | --- | --- |
| `default` | Cuerpo | `{ close }` | Dentro de `g-dialog__body` |
| `footer` | Acciones | `{ close }` | Dentro de `g-dialog__footer` (con `inset`, dentro de la inset); solo se renderiza si el slot existe |
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
| Esc | Emite `dismiss` (`escape`) y cierra si nadie lo impide |
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

1. **Antes de `showModal()`** (para que el primer estilo, `@starting-style`, ya lo tenga), si `document.activeElement` es un elemento **fuera del diálogo y distinto de `body`** (el disparador: el mismo al que vuelve el foco al cerrar), `GDialog.vue` escribe el vector **completo** desde el centro del visor (`innerWidth / 2`, `innerHeight / 2`, el centro del diálogo centrado) hasta el centro de la caja del disparador, como **`--_origin-x`** y **`--_origin-y`** (px), y añade **`has-origin`**. Sin disparador (foco en `body`), no escribe nada y no pone `has-origin`. **Límite conocido (WebKit, #307):** en Safari un clic **no enfoca** el botón (`document.activeElement` queda en `body`), así que con un disparador de ratón allí no hay `has-origin` y el diálogo **solo se funde** (entra y sale como #152); con teclado sí hay origen. No se busca el disparador por otra vía (último `pointerdown`, prop `trigger`): sería una API o un oyente global nuevos; si se pide paridad, es una ronda propia.
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

## Convivencia con avisos (`GToaster`, `toast.md`; DECISIONS.md #141 y #143)

- Mientras un `<dialog>` modal está abierto, la región de avisos **se traslada dentro de él** (es lo único que no queda inerte) y vuelve al `body` al cerrarse. `GDialog` no hace nada para ello: lo resuelve `GToaster` observando el atributo `open`. El contenido del diálogo sigue siendo de `GDialog`; la raíz de la región es un hijo más del `<dialog>` que Vue no gestiona desde `GDialog`.
- **El Esc de un aviso no debe llegar al manejador de `GDialog`.** Estado actual verificado en `GDialog.vue`: el Esc se escucha con `@keydown` y `@cancel` **sobre el propio `<dialog>`, en fase de burbuja** (sin `.capture` ni escucha de documento). El aviso trata Esc en su región (descendiente del `<dialog>`) con `preventDefault()` + `stopPropagation()`: el `keydown` no sube hasta el `<dialog>` y, al estar cancelado, el navegador no genera la petición de cierre, así que **tampoco hay `cancel`** (HTML, *close requests*). **No hace falta ningún cambio en `GDialog`.**
- **Condición que debe mantenerse:** si algún día `GDialog` pasa su Esc a fase de captura o a una escucha de documento, debe ignorar el `keydown` con `event.defaultPrevented` o cuyo destino esté dentro de `.g-toaster` o de `.g-speech-host` (panel de la captura de voz, `speech.md` §11; y lo mismo cualquier componente que escuche Esc en captura). **Recomendado (bruno, no bloquea):** añadir ya la guarda `if (event.defaultPrevented) return` al principio de `onKeydown` de `GDialog.vue`, que protege también frente a otros descendientes que tratan Esc (`GMenu`, `GSelect`), y una prueba con `GDialog` real + `GToaster` en la suite de `GToaster` (Esc en el aviso no emite `dismiss`; Esc fuera sí).
- Pendiente: que `preventDefault` del `keydown` suprima el `cancel` también en Firefox y WebKit (Playwright, #108).

## Límites conocidos

- **Sin diálogos apilados** ni no modales en v0.1: un diálogo sobre otro funciona con el navegador (capa superior), pero no está verificado ni diseñado.
- **Sin arrastre de la hoja** (bottom sheet) ni gesto para cerrar.
- ~~Sin animación de salida~~: sale animado desde #152 (plan 009).
- **Lector de pantalla:** cómo se anuncian el título, la descripción y el cuerpo desplazable está por verificar con lectores reales.
- **Teclado virtual en móvil:** el visor se reduce y una hoja alta puede tapar campos; por verificar en dispositivo real.
- **Navegadores:** exige `<dialog>` con `showModal()` y `:has()` (bloqueo del scroll de la página): todos los actuales.
- **Pulso de `is-loading` (#539; segunda entrega de #540, solo coco):** el pulso infinito (`g-dialog-pulse`) choca con #299 §5 y con WCAG 2.2.2 pasados 5 s. Pasa a **finito, que termina antes de 5 s**, o a quieto; con movimiento reducido, quieto. Sin cambio de API.

## Abierto (no bloquea el paso siguiente)

- **Resuelto para `placement="center"` por #301** (§«Personalidad», D2). Sigue abierto para la hoja inferior móvil. Texto original: **Crecer sin mover lo que ya está a la vista** (DECISIONS.md #281; kiwi `design/lab/form-reveal/r01/`, L8): centrado, un diálogo cuyo contenido crece (un `GFormReveal` que se abre, errores que aparecen, `GTextarea autosize`) crece hacia los dos lados y **mueve el disparador** (medido: 120px al abrir un bloque de 240px; en hoja de 375px, 240px; anclado arriba, 0). Se deriva del principio «sin saltos» (form r01 §11). **Ronda propia de `GDialog`** (kiwi → lima → coco/bruno): un diálogo abierto crece **hacia abajo** (borde superior fijo desde que se abre) y la hoja conserva su borde superior mientras quepa. Cambiar la colocación **inicial** (dejar de centrar) sería pregunta al usuario.

- Valores de `--g-surface-*`, profundidad y movimiento: los decide coco en `defaults.css`.
- Si `GSurface` (componente) o solo clases: se decide cuando un segundo componente (drawer, panel) reutilice el patrón.
