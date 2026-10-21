# GGallery y GGalleryViewer · auditoría de coco (paso 5)

**Dueño:** coco · **Fecha:** 2026-10-21 · **Sobre:** el componente real (`GGallery.vue`, `GGalleryViewer.vue` y la enmienda `bare` + `from` vivo de `GDialog.vue`, bruno, 3353d75; `dist/gallery.umd.js`), banco `packages/vue/playground/gallery.html` · **Contrato:** `design/contracts/gallery.md` (#730 a #735, #742, #744, #758, #759; `dialog.md` «Visor a pantalla completa») · **Estilo:** `estilo.md`, `GGallery.css`, `g-dialog--bare` en `GDialog.css`

**Verificación propia:** `node design/lab/gallery/auditoria-verificar.mjs` (puerto 4244; común en `../hero/auditoria-comun.mjs`). **1348/1348 en Chromium, Firefox y WebKit** sobre el estado final. Además: `gallery.spec.mjs` de bruno en verde en los tres motores (WebKit con un worker), compuertas 99/99.

## Auditoría previa

Estructura (cabecera con título y recuento, índice de espacios, cuadrícula o tira; visor con barra, escenario, pie, navegación e hilo), jerarquía (la portada manda), delimitación (borde de miniatura, índice con borde de control), controles fuera de la foto, estados (actual, extremos sin vuelta, foto rota, ampliada, arrastre), consistencia (`GDialog` real, `GBtn` reales). Temas: por defecto, terracota, añil, pálida, stripe, github, spotify, caracol-púrpura y lustre, claro y oscuro, visor con zona y con `zone="none"`.

## Hallazgos

| # | Gravedad | Dueño | Hallazgo | Estado |
| --- | --- | --- | --- | --- |
| G-A1 | Baja | bruno | El zoom (#758) calcula `--_zoom-w/-h` con `clientWidth/clientHeight` del escenario, pero la foto en reposo se pinta dentro del relleno de la `img` (`space-2` / `space-4`): la ampliada mide **×2,05** de lo que se veía a 1280×800 y **×2,18** a 390×844, no ×2 exacto. Proporción conservada, recorrido sin franjas vacías. | Pendiente de bruno: en `measureZoom`, restar el relleno computado de la `img` (o medir su caja de contenido) antes de multiplicar por 2. No bloquea. |
| G-A3 | Media | bruno | **Regresión del remate d11d4f2 (G-A1).** `measureZoom` (GGalleryViewer.vue, líneas 155-169) resta el relleno computado de la `img` (`getComputedStyle(im).padding*`). Se llama dos veces: (1) síncrona en `setZoom(true)`, con la `img` aún en reposo (relleno 16×32 px): caja = ×2 de la foto pintada (1216 px de alto a 1280×800); (2) la devuelve `observeSize(stageEl, measureZoom)`, que dispara al engancharse con la clase `is-zoomed` ya puesta, donde `GGallery.css` fija `padding: 0` en la `img`: relleno leído = 0 y la caja vuelve a `2 × clientHeight` (1248 px). El `scrollTop` del centrado (l. 185-186, en `nextTick` + `nextFrame`) se calcula con el recorrido de la primera caja (592 px → 296) y el recorrido final es 624: la ampliada queda 16 px (la mitad del relleno vertical) por encima del centro, y G-A1 sigue sin cerrarse (×2,052 / ×2,179 medido al final). Pasa solo con foto que llena el escenario en un eje y recorrido vertical (fotos verticales). | Pendiente de bruno. Arreglo propuesto: leer el relleno **solo cuando no está ampliado** y guardarlo (`let pad = null`; en `measureZoom`: `if (!zoomed.value \|\| !pad) pad = {x, y}` con la lectura de la `img`; ponerlo a `null` en `setZoom(false)`), o fijarlo desde los tokens (`space-2`/`space-4`) en lugar de leerlo de una `img` que cambia de relleno al ampliar. Con ello la caja es la misma en las dos llamadas (×2 exacto), el centrado queda en `(sh - ch) / 2` y `auditoria-verificar.mjs` da 1348/1348 sin tocarlo. |
| G-A2 | Baja | coco / lima | A 320×256 (zoom 400 %) la barra, el pie, la navegación y el hilo dejan a la foto **96×64** (apaisada) y **43×64** (vertical). Usable (ampliar y desplazar funcionan, nada se solapa ni se sale), pero pequeña. | Pendiente: propuesta de forma para alto muy corto (p. ej. pie e hilo plegados bajo cierto alto) a contratar por lima; no se toca sin contrato. |
| G-A3 | Info | — | La enmienda `bare` de `GDialog` se comporta como se contrató: sin relleno en el diálogo ni en el cuerpo, a pantalla completa, sin cabecera. | Cumple. |

## Auditoría posterior

- **Galería** (espacios, plana y tira; 1280, 390, 320 y 320×256; LTR y RTL): sin desplazamiento horizontal; índice, cifra, pies y recuento ≥ 4,5:1; borde del índice ≥ 3:1 y alto ≥ 24 px; portada de cuatro fotos o más cuadrada; en la tira, el foco de la diapositiva del borde visible y sin recortar.
- **Visor, contraste** (nueve temas × claro/oscuro × zona/sin zona en Chromium; tres temas en Firefox y WebKit): fondo opaco; título, contador, pie, hilo e iconos ≥ 4,5:1 (mínimo 4,96:1); trazo del espacio actual y borde de la navegación ≥ 3:1; anillo de foco ≥ 3:1 contra el fondo del visor.
- **Visor, geometría** (1280×800, 390×844, 320×256; LTR y RTL; foto apaisada y vertical): ningún control encima de la foto pintada.
- **Zoom ×2** (vertical y apaisada, ancho y estrecho, LTR y RTL): la caja crece ×2 a ×2,2 (G-A1) y conserva la proporción; el recorrido es exactamente la foto (sin franjas vacías: la foto vertical en un visor ancho no tiene recorrido horizontal); ampliada desde el centro; la primera Esc solo reduce, la segunda cierra.
- **Llegada:** sale transparente desde `space × 6` del lado del gesto (+24 px en LTR, −24 px en RTL), llega a su sitio opaca; con reducido, sin desplazamiento y solo fundido.
- **Puntero:** controles del visor ≥ 24 px (fino) y ≥ 44 px (grueso).
- **forced-colors** (Chromium): borde real de la miniatura, visor con contorno, espacio actual en `Highlight`.
- **Sin literales:** `GGallery.css` y `GDialog.css` sin color literal ni respaldos; los `.vue` sin `<style>`.

## Rúbrica de movimiento

| Dimensión | Estado | Evidencia | Riesgo | Recomendación |
| --- | --- | --- | --- | --- |
| A · Propósito | Cumple | La llegada desde el lado del gesto dice «siguiente / anterior»; el arrastre sigue al dedo. | Bajo | — |
| B · Comodidad visual | Cumple | Desplazamiento corto (`space × 6`), `press` + `ease-out`. | Bajo | — |
| C · Estabilidad | Cumple | Barra, navegación e hilo fijos alrededor de la foto (referencia quieta); página inmóvil con el visor abierto. | Bajo | — |
| D · Transiciones | Cumple | Una ráfaga reinicia desde donde está (la clase se pone y se quita por cuadro); zoom sin transición. | Bajo | — |
| E · Control | Cumple | Esc escalonado, botones y teclado para todo lo que hace el gesto. | Bajo | — |
| F · Accesibilidad | Cumple | Reducido: sin desplazamiento ni seguimiento del dedo, fundido `fast`. | Bajo | — |
| G · Rendimiento | Parcial | Solo `translate` y `opacity`. | Bajo | Fotos reales y su decodificación sin medir. |
| H · Inmersión | Parcial | Pantalla completa justificada (mirar fotos), salida siempre visible. | Bajo | G-A2 a 320×256. |

## Cumplimientos / Correcciones / Pendientes

**Cumplimientos:** todo lo de la auditoría posterior; el visor en la zona de marca y sin ella; RTL espejado; 320×256 usable.

**Correcciones:** ninguna en CSS (no hizo falta).

**Pendientes:** G-A1 (bruno), G-A2 (decisión de forma, lima). **No verificado:** gesto táctil real y pellizco del sistema; lector de pantalla real (región viva, `aria-roledescription`); fotos reales y su rendimiento; `forced-colors` en Firefox y WebKit.

**Veredicto:** sin defectos bloqueantes. `GGallery` y `GGalleryViewer` pueden pasar a `"status": "candidate"` (cambio de bruno en los `meta.json`).
