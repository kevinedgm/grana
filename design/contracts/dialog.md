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
- **`mobile`:** estructura con un visor de hasta ~520px de ancho: `sheet` (hoja inferior, pegada abajo, esquinas superiores redondeadas), `full-width` (ancho completo centrado con un margen pequeño) o `fullscreen`. Fuera de móvil no actúa. `fullscreen` gana sobre `mobile`.
- **`role`:** `alertdialog` para una confirmación que exige decisión. Con `alertdialog`: el clic en el fondo **no** cierra (`closeOnBackdrop` se ignora), y **no se renderiza el botón de cierre del encabezado** (las acciones del pie son la salida). Esc sigue cerrando, con `reason: 'escape'`.
- **`closeLabel`:** nombre accesible del botón de cierre. **Sin valor por defecto** (Grana es internacional). Sin él, el botón no se renderiza y, en desarrollo, se emite `console.warn` (salvo en `alertdialog`).
- **`closeOnBackdrop`:** con `true`, un clic en el fondo emite `dismiss` con `reason: 'backdrop'`. Un arrastre que empieza dentro y termina en el fondo **no** cuenta (el clic debe empezar y terminar en el fondo).
- **`loading`:** `aria-busy="true"` en la carcasa y clase `is-loading`. No bloquea nada: las acciones las controla el consumidor.
- **`id`:** si no se da, se genera uno estable (`useId`); de él derivan los ids de título y descripción.
- **Resto de atributos** (`class`, `style`, `data-*`, `aria-*`, escuchas): van al `<dialog>` (raíz).

## Foco

- **Al abrir:** un elemento con `autofocus` dentro del diálogo gana; si no, el primer control enfocable (comportamiento nativo). En `alertdialog`, **el consumidor pone primero la acción segura o le da `autofocus`** (se documenta; sin advertencia).
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
- El **contenido se monta al abrir y se desmonta al cerrar** (un formulario no conserva su estado entre aperturas). La raíz `<dialog>` siempre está en el DOM.
- El encabezado usa `h2`: un diálogo abre un nivel propio. El consumidor no cambia el nivel en v0.1.
- Botones, enlaces y campos van en el cuerpo y el pie; nunca dentro de `title` ni `description`.

## Eventos

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `update:modelValue` | `Boolean` | Se cierra por una vía de usuario y nadie impidió el `dismiss` (siempre `false`) |
| `dismiss` | `{ reason, preventDefault() }` | El usuario intenta cerrar. `reason`: `escape`, `backdrop` o `close` (botón de cierre o `close()` del slot). **Cancelable:** llamar a `preventDefault()` de forma síncrona mantiene el diálogo abierto |
| `open` | | El diálogo ya se muestra |
| `closed` | | El diálogo ya se cerró (por el motivo que sea) |

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
| `icon` | Icono decorativo antes del título | | Se envuelve con `aria-hidden="true"` |

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
| `g-dialog--mobile-{sheet\|full-width\|fullscreen}` | Raíz | Siempre |
| `g-dialog--alert` | Raíz | Con `role="alertdialog"` |
| `is-loading` | Raíz | Con `loading` |
| `g-dialog__header`, `__titles`, `__title`, `__description`, `__icon`, `__close` | Encabezado | Según props y slots |
| `g-dialog__inset` | Superficie inset | Con `inset` |
| `g-dialog__body` | Cuerpo | Siempre |
| `is-scrollable` | Cuerpo | Cuando su contenido no cabe |
| `is-scrolled` | Superficie inset (o carcasa sin inset) | Mientras queda contenido por desplazar tras el cuerpo |
| `g-dialog__footer` | Pie | Con slot `footer` |
| `g-dialog__section`, `g-dialog__well` | Utilitarias del consumidor | Las pone el consumidor |

## Límites conocidos

- **Sin diálogos apilados** ni no modales en v0.1: un diálogo sobre otro funciona con el navegador (capa superior), pero no está verificado ni diseñado.
- **Sin arrastre de la hoja** (bottom sheet) ni gesto para cerrar.
- **Sin animación de salida** en v0.1: entra con una animación breve; sale de golpe.
- **Lector de pantalla:** cómo se anuncian el título, la descripción y el cuerpo desplazable está por verificar con lectores reales.
- **Teclado virtual en móvil:** el visor se reduce y una hoja alta puede tapar campos; por verificar en dispositivo real.
- **Navegadores:** exige `<dialog>` con `showModal()` y `:has()` (bloqueo del scroll de la página): todos los actuales.

## Abierto (no bloquea el paso siguiente)

- Valores de `--g-surface-*`, profundidad y movimiento: los decide coco en `defaults.css`.
- Si `GSurface` (componente) o solo clases: se decide cuando un segundo componente (drawer, panel) reutilice el patrón.
