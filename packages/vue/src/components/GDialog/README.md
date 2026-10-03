# GDialog

Diálogo modal genérico con una **carcasa** exterior y una **superficie inset** interior: el contenido queda alojado dentro de la carcasa, a poca distancia de su borde y con radio concéntrico, como una sola pieza ensamblada. Sirve de base para formularios, confirmaciones, detalles, configuraciones y vistas previas; no conoce ningún caso concreto.

**Etiqueta:** `<g-dialog>` · **Estado:** `candidate` (auditoría de coco aprobada; ver [`design/lab/dialog/auditoria.md`](../../../../../design/lab/dialog/auditoria.md)) · **Desde:** 0.1.0

> `@grana/vue` está en la versión 0.0.0 y aún no se publica. Por ahora se usa desde el repositorio (ver el playground en `packages/vue/playground/`). Exige Vue `^3.5.0` y un navegador con `<dialog>` (`showModal()`), `::backdrop` que herede variables y `:has()`: los actuales.

## Uso

```js
import { createApp } from 'vue'
import Grana from '@grana/vue'
import '@grana/vue/style.css'

createApp(App).use(Grana).mount('#app')
```

```vue
<g-dialog v-model="abierto" title="Guardar cambios" description="Se aplicarán a todo el equipo." close-label="Cerrar">
  <p>Contenido del diálogo.</p>
  <template #footer="{ close }">
    <g-btn variant="outline" @click="close">Cancelar</g-btn>
    <g-btn @click="guardar">Guardar</g-btn>
  </template>
</g-dialog>
```

El diálogo se abre y se cierra con `v-model`. **`closeLabel` no tiene valor por defecto** (Grana es internacional): sin él, el botón de cierre no se renderiza y en desarrollo se emite `console.warn`.

> **En plantillas dentro del HTML** (sin compilar), escribe `<g-dialog ...></g-dialog>`: Vue no admite etiquetas de componente autocerradas.

## Estructura

**Carcasa → encabezado → superficie inset → cuerpo / secciones / pie.**

- **Carcasa:** un `<dialog>` nativo abierto con `showModal()`. El navegador resuelve la capa superior, el resto de la página inerte, el foco atrapado y Esc; no hay `Teleport` ni trampa de foco propia.
- **Encabezado:** título (`h2`), descripción opcional, icono opcional y acción de cierre.
- **Inset (`inset`, por defecto):** segunda superficie a poca distancia de la carcasa, con radio concéntrico. Aloja el cuerpo y el pie. Con `:inset="false"`, el contenido vive en la carcasa (diálogo simple).
- **Pie:** siempre fijo; solo el cuerpo se desplaza.

La profundidad viene de diferencias mínimas de fondo, bordes finos y sombras suaves, sin desenfoque de fondo.

## Props

| Prop | Tipo | Valores | Por defecto |
| --- | --- | --- | --- |
| `modelValue` (`v-model`) | Boolean | | `false` |
| `title` | String | | sin valor |
| `description` | String | | sin valor |
| `size` | String | `sm` `md` `lg` | `md` |
| `density` | String | `default` `comfortable` `compact` | `default` |
| `inset` | Boolean | | `true` |
| `fullscreen` | Boolean | | `false` |
| `placement` | String | `center` `end` | `center` |
| `mobile` | String | `sheet` `full-width` `fullscreen` | `sheet` |
| `role` | String | `dialog` `alertdialog` | `dialog` |
| `closeLabel` | String | | sin valor |
| `closeOnBackdrop` | Boolean | | `true` |
| `loading` | Boolean | | `false` |
| `id` | String | | generado |

Un valor fuera de la lista muestra una advertencia en desarrollo. No hay `variant`: las composiciones salen de las props y los slots.

- **`modelValue`:** `true` abre, `false` cierra. El componente **nunca cambia el prop por su cuenta**: ante Esc, clic en el fondo o el botón de cierre emite `dismiss` y, si nadie lo impide, `update:modelValue` con `false`.
- **`title`:** nombre accesible del diálogo. Sin `title`, sin slot `title` ni `header` y sin `aria-label` ni `aria-labelledby`, en desarrollo hay `console.warn`.
- **`size`:** ancho de la carcasa en escritorio, derivado de `space` (con `space` 4: 400, 560 y 760px), siempre menor que el visor menos 8 unidades de `space`. No usa `xs`…`xl`, que son de controles.
- **`density`:** multiplica relleno y separación de la carcasa y la inset (1×, 0.875×, 0.75×). La tipografía no cambia, y el radio de la inset sigue siendo concéntrico.
- **`fullscreen`:** ocupa todo el visor en todos los anchos y conserva las dos superficies.
- **`placement`:** dónde se ancla en escritorio y tableta. `center` (por defecto), centrado. **`end`: hoja lateral** pegada al borde final (derecha en LTR, izquierda en RTL), de alto completo y con el ancho de `size` (400px con `space` 4 y `size="sm"`); entra deslizando desde el borde. Con un visor de hasta ~520px actúa `mobile` (hoja inferior por defecto) y `placement` no cambia nada; `fullscreen` gana sobre `placement`. Lo usan [`GWidgetGallery`](../GWidgetGallery/README.md) y [`GWidgetConfig`](../GWidgetConfig/README.md).
- **`mobile`:** estructura con un visor de hasta ~520px: `sheet` (hoja inferior pegada abajo, con esquinas superiores redondeadas y `safe-area-inset-bottom`), `full-width` (ancho completo con un margen pequeño) o `fullscreen`. `fullscreen` gana sobre `mobile`.
- **`role`:** `alertdialog` para una confirmación que exige decisión. Ver "Confirmaciones".
- **`closeOnBackdrop`:** un clic en el fondo emite `dismiss` con `reason: 'backdrop'`. Debe empezar y terminar en el fondo: un arrastre que empieza dentro no cuenta, y un clic en el relleno de la carcasa tampoco.
- **`loading`:** `aria-busy="true"` en la carcasa y una barra fina de acento sobre la inset. **No bloquea nada:** las acciones las controlas tú.
- **Resto de atributos** (`class`, `style`, `data-*`, `aria-*`, escuchas): van al `<dialog>`.

## Eventos

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `update:modelValue` | `false` | El usuario intenta cerrar y nadie lo impidió; también ante un cierre nativo con el prop en `true` (por ejemplo un `<form method="dialog">`) |
| `dismiss` | `{ reason, preventDefault() }` | El usuario intenta cerrar. `reason`: `escape`, `backdrop` o `close` (botón de cierre o `close()` del slot). **Cancelable** |
| `open` | | El diálogo ya se muestra |
| `closed` | | El diálogo ya se cerró, por el motivo que sea |

**`dismiss` es cancelable:** llama a `preventDefault()` de forma síncrona para mantenerlo abierto (por ejemplo, con cambios sin guardar). Esc funciona igual con y sin `preventDefault`, también en la segunda pulsación seguida.

```vue
<g-dialog v-model="abierto" title="Editar" close-label="Cerrar" @dismiss="(e) => { if (sinGuardar && e.reason !== 'close') e.preventDefault() }">
  …
</g-dialog>
```

Un cierre por cambio de `modelValue` desde fuera **no** emite `dismiss`; solo `closed`.

## Slots

| Slot | Alcance | Contenido |
| --- | --- | --- |
| `default` | `{ close }` | Cuerpo |
| `footer` | `{ close }` | Acciones. Solo se renderiza si el slot existe |
| `title` | | Título con contenido rico (sustituye a `title`) |
| `description` | | Descripción con contenido rico (sustituye a `description`) |
| `header` | `{ titleId, descriptionId }` | Sustituye título y descripción por completo. Usa esos ids si quieres el nombre accesible; el botón de cierre se conserva |
| `icon` | | Icono decorativo antes del título. Grana no trae iconos; el playground usa SVG de [Lucide](https://lucide.dev) |

`close()` cierra por la vía `close`: emite `dismiss` (cancelable) y luego `update:modelValue`. Para cerrar sin `dismiss`, cambia `modelValue`. El **contenido se monta al abrir y se desmonta al cerrar**: un formulario no conserva su estado entre aperturas. No pongas botones ni enlaces dentro de `title` ni `description`.

## Composiciones

- **Simple:** `:inset="false"`. El contenido vive en la carcasa.
- **Con pie:** slot `footer` dentro de la inset.
- **Con secciones:** elementos con la clase `g-dialog__section` dentro del cuerpo. Se separan con una línea fina, sin cajas, y el cuerpo pierde su relleno.
- **Superficie secundaria:** `g-dialog__well` agrupa algo que lo necesite (un nivel, no se anida).
- **Con scroll:** si el contenido no cabe, solo el cuerpo se desplaza; el encabezado y el pie quedan fijos. Mientras queda contenido por desplazar, el pie se funde con la carcasa.
- **Formulario:** el pie está fuera del `<form>`; asocia el botón con `form="id"`. Si el formulario no valida, el diálogo **no se cierra**: cerrarlo es decisión tuya.
- **Hoja lateral:** `placement="end"` (con `size="sm"` para una hoja de 400px): paneles de filtros, configuración o galerías que dejan el contenido a la vista.
- **Pantalla completa:** `fullscreen`.
- **Adaptativo:** escritorio centrado, tableta (≤ ~900px) con relleno menor y móvil (≤ ~520px) según `mobile`.

```vue
<g-dialog v-model="abierto" title="Preferencias" close-label="Cerrar" size="lg">
  <section class="g-dialog__section">General…</section>
  <section class="g-dialog__section"><div class="g-dialog__well">Avisos…</div></section>
  <template #footer="{ close }"><g-btn variant="outline" @click="close">Cancelar</g-btn><g-btn type="submit" form="prefs">Aplicar</g-btn></template>
</g-dialog>
```

## Confirmaciones (`role="alertdialog"`)

```vue
<g-dialog v-model="abierto" role="alertdialog" size="sm" title="¿Eliminar el proyecto?" description="Esta acción no se puede deshacer.">
  <template #footer="{ close }">
    <g-btn variant="outline" autofocus @click="close">Cancelar</g-btn>
    <g-btn color="danger" @click="eliminar">Eliminar</g-btn>
  </template>
</g-dialog>
```

Con `alertdialog`: el clic en el fondo **no** cierra (`closeOnBackdrop` se ignora), no se muestra el botón de cierre (las acciones del pie son la salida) y Esc sigue cerrando con `reason: 'escape'`. **El foco inicial sigue el orden de arriba** (DECISIONS #292), y lo que decides tú es la acción segura: pon `autofocus` en ella (o colócala primera, porque sin `autofocus` va al primer control del contenido) para que sea la que reciba el foco.

## Teclado y foco

| Tecla | Acción |
| --- | --- |
| Tab / Shift+Tab | Recorre los controles del diálogo; no sale de él (nativo) |
| Esc | Emite `dismiss` (`escape`) y cierra si nadie lo impide |
| Enter / Espacio | Activa el control enfocado (nativo) |
| Flechas / Re Pág / Av Pág | Desplazan el cuerpo cuando está enfocado |

- **Al abrir**, tras montar el contenido, el foco va al primer elemento con `autofocus` y, si no hay, al primer control del contenido en orden del DOM **sin contar el botón de cierre ni el cuerpo desplazable**; si no hay ninguno, al botón de cierre y, por último, al propio `<dialog>`. Si el foco ya está dentro, no se mueve (DECISIONS #292). **Al cerrar**, vuelve al elemento que lo tenía (nativo).
- **La página no se desplaza** con un diálogo abierto (`html:has(.g-dialog[open])`).

## Accesibilidad

- **Nombre y descripción:** `aria-labelledby` (título) y `aria-describedby` (descripción, si la hay; se suma al tuyo). Un `aria-label` o `aria-labelledby` tuyo sustituye al título como nombre. El rol nativo de `<dialog>` no se repite; solo se anuncia `alertdialog`.
- **Cuerpo desplazable:** solo cuando su contenido no cabe recibe `tabindex="0"`, `role="region"` y el nombre del título, para que el teclado pueda desplazarlo. Cuando cabe, no es tabulable.
- **Cierre:** botón con nombre (`closeLabel`); la cruz es el icono `x` de Lucide (decorativo, toma `currentColor`), así que se ve también con colores forzados. Con `pointer: coarse` mide 44×44px.
- **Contraste:** con el tema por defecto y con el de prueba de la auditoría, todo texto llega a 4.5:1 o más; el borde del icono de alerta, a 3:1 o más.
- **Movimiento:** la entrada es breve (`--g-duration-press`, `--g-ease-out`) y solo existe con `prefers-reduced-motion: no-preference`. No hay animación de salida.
- **Colores forzados:** carcasa, inset, pie y secciones usan `CanvasText`; el cierre, `ButtonText`.

## Tema

El componente solo lee tokens `--g-*`. La superficie inset forma parte de un sistema reutilizable de **superficies anidadas** (`--g-surface-*`, ver `docs/contract/tokens.md` §11):

```css
:root {
  --g-surface-shell: #f1ddb6;   /* fondo de la carcasa */
  --g-surface-inset: #fffbf2;   /* fondo de la inset */
  --g-surface-gap: 8px;         /* separación entre carcasa e inset */
  --g-surface-radius: 28px;     /* radio de la carcasa; el de la inset se deriva */
  --g-surface-backdrop: rgb(59 42 26 / 0.45); /* tinte del fondo */
}
```

`--g-surface-radius-inset` (radio de la carcasa menos la separación y el borde) mantiene la inset concéntrica; el componente lo corrige además por la densidad. Consume también `--g-color-border`, `--g-color-border-control`, `--g-color-text`, `--g-color-text-muted`, `--g-color-focus`, `--g-color-accent`, `--g-radius-md`, `--g-radius-pill`, `--g-space-1..12`, `--g-font-ui`, `--g-text-{body|body-sm}-{size|line}`, `--g-text-title-sm-{size|line|tracking|weight}`, `--g-border-width`, `--g-focus-width`, `--g-focus-offset`, `--g-shadow-1`, `--g-shadow-3`, `--g-duration-{fast|press|spin}`, `--g-ease-{standard|out}` y `--g-press-scale`. El ancho y el relleno se derivan de `--g-space-1`: cambiar el espacio base escala todo.

## Clases

Las emite el componente y las estiliza `GDialog.css`: `g-dialog`, `g-dialog--size-*`, `g-dialog--density-*`, `g-dialog--placement-*`, `g-dialog--mobile-*`, `g-dialog--inset`, `g-dialog--fullscreen`, `g-dialog--alert`, `is-loading`, y los elementos `g-dialog__header`, `__titles`, `__title`, `__description`, `__icon`, `__close`, `__inset`, `__body` (con `is-scrollable`), `__footer` e `is-scrolled` (en la inset, o en la raíz sin inset). Las utilitarias `g-dialog__section` y `g-dialog__well` las pones tú.

## Limitaciones conocidas

- **Estilos globales sin capa ganan.** El CSS de Grana va en la capa `grana.components`; una regla global tuya sobre `h2` o `p` (por ejemplo `h2 { margin-top: 2rem }`) desplaza el título o la descripción. Es el comportamiento buscado del sistema de capas: acota tus reglas globales con `:not(.g-dialog__title)` o un selector más específico.
- **Sin diálogos apilados ni no modales**, sin arrastre de la hoja ni gesto para cerrarla, y sin animación de salida en v0.1.
- **`::backdrop` con variables:** hereda `--g-surface-backdrop` de la raíz `<dialog>` en navegadores de 2024 en adelante; en uno anterior, el fondo quedaría transparente.
- **Heading fijo:** el título es un `h2`; el nivel no se cambia en v0.1.
- No hay tema oscuro todavía.
- **Sin verificar:** un lector de pantalla real (nombre, descripción, `alertdialog` y cuerpo desplazable), el teclado virtual en móvil (el visor se reduce y una hoja alta puede tapar campos), un dispositivo táctil real, las preferencias reales de `prefers-reduced-motion` y `forced-colors` (los bloques se comprobaron aplicados sin condición), Firefox y Safari, y `dvh` en Safari móvil.

## Fuentes

- API: [`GDialog.meta.json`](./GDialog.meta.json) · Contrato: [`design/contracts/dialog.md`](../../../../../design/contracts/dialog.md) · Prototipo: [`design/lab/dialog/r01/`](../../../../../design/lab/dialog/r01/) · Auditoría: [`design/lab/dialog/auditoria.md`](../../../../../design/lab/dialog/auditoria.md)
