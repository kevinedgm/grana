# GGallery y GGalleryViewer · estilo (coco)

**Dueño:** coco · **Contrato:** `design/contracts/gallery.md` (#730 a #735, #742, #744; `dialog.md` «Visor a pantalla completa», #732; `tokens.md` §29.6, §52) · **Estructura:** `design/lab/gallery/r01/` (kiwi)
**Entrega:** `packages/vue/src/components/GGallery/GGallery.css` (galería y visor), `g-dialog--bare` en `GDialog/GDialog.css`, banco `estilo-banco.html`, verificación `estilo-verificar.mjs`.

## Qué le da personalidad

- **La portada manda.** En un espacio de cuatro fotos o más, la primera es de 2 × 2 (cuadrada: su lado son dos columnas y el hueco, exactamente dos filas); con menos, 2:1; un espacio de una sola foto es una banda ancha 16:9 (≤ 50svh). Nunca más de cuatro columnas en un espacio, así la portada siempre tiene a su lado las demás.
- **El índice habla de sitios:** enlaces con forma de chip y la cifra en voz baja y tabular («Baño 2»), para que los recuentos se lean de un vistazo.
- **La tira respeta la foto:** alturas iguales y la proporción de `width`/`height` de cada una (la vertical del baño se ve vertical; recorte solo si pasa del 88 % de la tira); la siguiente asoma; la actual dice su pie en tinta plena.
- **El visor es un cuarto oscuro** (la zona de marca con el tema por defecto) sin un control encima de la foto: barra arriba, navegación y el hilo de espacios abajo. La foto **llega desde el lado del gesto** (`space × 6`, espejado en RTL, `press` + `ease-out`), **sigue al dedo** sin transición y, ampliada, es ×2 exacto (la caja crece al 200 % y la foto sigue contenida) con el desplazamiento nativo.

## Medidas

| Pieza | Valor |
| --- | --- |
| Cuadrícula | `auto-fill, minmax(min(100%, space × 36), 1fr)`, hueco `space-2`, miniatura radio `md`, molde `--g-color-mold` mientras carga |
| Espacios | `minmax(max(min(50% − space-1, space × 40), 25% − ¾ hueco), 1fr)`, `dense`; entre espacios `space-8` |
| Miniatura | borde en `::after` (no ocupa sitio), hover doble `border-strong` sin `transform`; rota: hueco hundido + icono `image` |
| Tira | alto `min(space × 112, 62svh)`, diapositiva ≤ `88cqi`, `scroll-snap` en línea; relleno del anillo (`focus-offset + focus-width`) para que el foco de la del borde no se recorte |
| Visor | `GDialog fullscreen bare` + zona en la raíz; fondo `--g-color-bg` (la marca en la zona); controles `max(24px, space × 9)` y 44 px con puntero grueso; hilo de una línea con el actual en trazo `border-control` + peso |

## Verificación (`GRANA_PW_PORT=4241 node design/lab/gallery/estilo-verificar.mjs`)

Resultado sobre el estado final: ver el informe de entrega. Cubre: estático (también `GDialog.css`: `bare` sin relleno); A, base y B a 1440, 390, 320 y 320×256 en LTR y RTL (sin desplazamiento horizontal, bordes de miniatura, portada 2 × 2, banda ≤ 50svh, índice ≥ 24 px con texto y cifra ≥ 4,5:1 y borde ≥ 3:1, tira con alturas iguales y la proporción real, la siguiente asoma, anillo de la del borde sin recortar, pies ≥ 4,5:1); el visor en el tema por defecto, terracota, añil, pálida, stripe, github, spotify y caracol-púrpura, claro y oscuro, con zona y con `none` (fondo opaco, el de la marca con zona; título, contador, pie, hilo e iconos ≥ 4,5:1, trazo del actual ≥ 3:1); geometría a 1280×800, 390×844 y 320×256 en LTR y RTL (ningún control encima de la foto, llena el visor, página inmóvil), llegada `space × 6` espejada desde transparente con `press`, arrastre sin transición, ×2 con desplazamiento nativo; foto rota; reducido (sin desplazamiento, fundido `fast`); 44 px con puntero grueso; forced-colors (Chromium); consola limpia.

## Encargos

**bruno (`GGallery.vue`, `GGalleryViewer.vue`, enmienda `bare` en `GDialog.vue`):**
1. El visor es el `<dialog>` de `GDialog` con `g-dialog--fullscreen g-dialog--bare g-gallery-viewer` y `data-g-zone` en la raíz; su contenido va directo en `.g-dialog__body` (que con `bare` es una columna flexible: barra, escenario, pie, navegación, hilo, región viva, en ese orden).
2. Llegada: poner `is-arriving` + `data-direction="next|prev"` en el `img.g-gallery-viewer__img` **en el mismo cuadro** que cambia la foto y quitar `is-arriving` en el cuadro siguiente (el CSS da el punto de partida sin transición y la vuelta con `press`). Arrastre: `is-dragging` en el escenario y `--_drag-x`/`--_drag-y` en px (en el escenario o en la foto); al soltar sin pasar, poner 0 y quitar `is-dragging` (vuelve con transición).
3. Foto rota en el visor: pintar `p.g-gallery-viewer__broken` dentro del escenario (el CSS oculta la foto cuando existe).
4. La cifra del índice como `span[aria-hidden="true"]` dentro de `a.g-gallery__index-link`; el icono `image` (GLibIcon) dentro de la miniatura rota.
5. `--_zoom-x/-y` no los lee el CSS: el punto del zoom se lleva con `scrollLeft/scrollTop` del escenario tras ampliar.
6. Controles del visor: `GBtn` `ghost` (barra) y `outline` (navegación), `icon`; los extremos con `aria-disabled="true"` (el CSS los apaga a `text-subtle`).

**lima:**
- **G-C1 · §52 consumidos:** añadir `--g-color-text-subtle` (botones en un extremo, «sin vuelta») y `--g-ease-standard` (cambios de color).
- **G-C2 · §29.6:** registrar el alto de la tira `min(space × 112, 62svh)`, el tope de la diapositiva `88cqi`, el máximo de cuatro columnas por espacio y la banda de una foto 16:9 ≤ `50svh`.
- **G-C3 · zoom con huecos:** el ×2 de una foto que no llena el escenario (vertical en un visor ancho) deja franjas vacías recorribles; sin la proporción en el CSS no se puede evitar. Si se quiere, bruno puede escribir `--_zoom-w`/`--_zoom-h` (px del tamaño contenido ×2) y el CSS los usaría en lugar del 200 % (dato nuevo de §29.5).

## No verificado

Gesto táctil real, pellizco del sistema, lector real (región viva, `aria-roledescription`), fotos reales y su rendimiento, `forced-colors` en Firefox y WebKit, el Esc escalonado sobre el `GDialog` real (el banco usa un `<dialog>` con el marcado de `GDialog`).
