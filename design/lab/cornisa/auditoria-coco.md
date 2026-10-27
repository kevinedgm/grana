# Auditoría de coco · Cornisa (paso 5: estética y movimiento)

**Objeto:** `packages/cornisa/` tal como entró en `c39a025` (rama `claude/project-thread-2ck6nd`, PR #17): `src/cornisa.css`, `src/dom/renderer.js`, `src/core/drop.js`, ejemplos `examples/index.html` y `examples/cdn/04-casos-de-uso.html`. Reglas aplicadas: `docs/documentacion/auditoria-visual.md` y `docs/documentacion/rubrica-movimiento.md` (entera: Cornisa tiene movimiento y cambio de forma).
**Método:** `node design/lab/cornisa/auditoria-coco-verificar.mjs` (desde la raíz). Sirve `packages/cornisa` en el puerto 4512, Chromium 1243 de `/opt/pw-browsers/chromium`, lee el estado real por fotograma (`requestAnimationFrame`: `d` y `getBBox()` del `path`, cajas de la fila y del título, opacidad, `transform`), compone los colores reales capa a capa en un lienzo (página → gota → fondo del botón → tinta) para el contraste y usa las métricas de CDP para el coste. Resultado: **39 comprobaciones cumplen, 6 no cumplen y 25 son informativas**. Lo de los píxeles del foco se comprobó aparte (capturas con y sin anillo; script temporal en el scratchpad, no se versiona). Para `04-casos-de-uso.html` se usó `dist/` reconstruido con `node scripts/build.mjs` (no `npm run build`, que regenera los ejemplos versionados de `examples/cdn/`; `dist/` está en `.gitignore`); las peticiones al CDN se cortan y el ejemplo pasa a la copia local, como en su diseño.
**No verificado:** Firefox y WebKit (no instalados), Safari y dispositivos reales, pantallas de 120 Hz, coste de pintura (área repintada), lector de pantalla (fuera del alcance de coco).

## Resumen

1. Cornisa es estéticamente sólida en lo que mide un paquete neutro: el texto nunca se deforma ni se pinta fuera de la gota en ningún fotograma (0 fugas al nacer, recoger y retirarse), el contraste del texto es máximo (18,88:1), todas las dianas tienen 44 px, 320 px y el texto al 200 % caben sin desplazamiento horizontal, y el movimiento reducido, los colores forzados y RTL funcionan.
2. Hay **un defecto bloqueante de accesibilidad**: el foco con teclado de la acción primaria del expandido **no se ve** (0 píxeles cambian entre foco y sin foco: anillo blanco dentro de un botón blanco). La acción rápida del compacto tiene el mismo problema atenuado (anillo a 1:1 con su relleno; solo se nota porque la píldora crece 2 px). Además, sobre una página oscura la gota **no se delimita** (1,02:1 con su fondo neutro, 1,05:1 con los tokens de Grana en oscuro): no tiene ni borde ni sombra.
3. Frente a Grana, el CSS no cumple ninguna de las reglas de la librería (6 literales de color, 3 duraciones, 14 medidas en px, un respaldo, `z-index` literal, sin capas, iconos propios) y su movimiento dura **el doble que la isla de estado** (asienta en 817 ms al nacer frente a 222–245 ms); todo `--cornisa-*` tiene un equivalente `--g-*` y, con él, la gota se ve bien en claro (10,53:1) y necesita un filo en oscuro, como el que ya tiene `GStatusIsland`.

## Medidas (Chromium)

| Área | Medida | Umbral | Estado |
| --- | --- | --- | --- |
| Título, icono, «+N», cuerpo (neutro, gota `#111`) | **18,88:1** | 4,5 | Cumple |
| Chevron y meta (`--cornisa-muted`, blanco al 78 %) | 11,52:1 | 3 (no texto) / 4,5 | Cumple |
| Acción rápida: texto sobre su relleno | 18,88:1; al pasar 11,52:1 | 4,5 | Cumple |
| Conmutador al pasar: título sobre el velo | 12,82:1; el velo contra la gota **1,47:1** | — (indicador de hover) | Informativo |
| Bordes del expandido: acciones / «Cerrar» | 18,88:1 / **2,45:1** | 3 (controles, regla de Grana) | «Cerrar» no llega |
| Gota contra la página clara `#f5f5f5` | 17,32:1 | delimitación | Cumple |
| Gota contra página oscura `#141414` | **1,02:1** | delimitación (la isla de Grana: 16,48 en prototipo) | No cumple |
| Tema de ejemplo de `04` (`#1f3a5f`) | título 11,48, chevron 7,94, rápida 11,48 | 4,5 / 3 | Cumple |
| Con tokens de Grana, claro (`defaults.css`, correspondencia de §Brecha) | título 10,53, chevron 7,17, gota/página 10,53 | 4,5 / 3 | Cumple |
| Con tokens de Grana, oscuro (`[data-theme=dark]`) | título 15,71, chevron 9,87, rápida 6,36; **gota/página 1,05** | 4,5 / 3 / delimitación | Texto cumple; delimitación no |
| Foco: conmutador y «+N» | anillo 3 px blanco contra la gota 18,88:1; captura cambia | visible, 3:1 | Cumple |
| Foco: acción rápida (compacto) | anillo contra su relleno **1:1**; 569 de 4848 px cambian (la píldora «crece» 2 px) | visible, 3:1 | No cumple |
| Foco: acción primaria (expandido) | anillo contra su relleno **1:1**; **0 de 4944 px cambian** | visible (WCAG 2.4.7) | **No cumple** |
| Foco: «Ver detalles», «Cerrar» | 18,88:1 | 3 | Cumple |
| Dianas compacto (1440) | conmutador 220×44, rápida 93×44 (píldora visible 36), «+N» 44×44 | 24 / 44 táctil | Cumple |
| Dianas expandido | «Reintentar» 100×44, «Ver detalles» 110×44, «Cerrar» 73×44 | 24 / 44 | Cumple |
| Letra mínima | «+N» 12 px; meta 13 px; título y cuerpo 14 px | 12 px | Cumple (al mínimo) |
| Nacimiento | gota 341×54; sobrepaso alto 4,9 % (57 → 54 px), ancho 1,4 %; texto visible a los **418 ms**; asienta en **817 ms** | isla de Grana 222–245 ms, sobrepaso 3,1–3,7 % | Ver C5 |
| Expandir / recoger / retirar | asienta 533 ms (sobrepaso 1 %) / 649 ms / 575 ms | — | Ver C5 |
| Texto fuera de la silueta | 0 fotogramas (nacer, recoger, retirar) | 0 | Cumple |
| Deformación del texto | 14 px constante; `transform` de `.cornisa-ui` solo traslación; alto del título 21 px constante | sin escala | Cumple |
| Interrupción (mostrar → retirar a 120 ms → mostrar a 90 ms) | mayor salto entre fotogramas 15,2 px; termina con contenido | continuo | Cumple |
| 320×640 táctil, título largo | compacto: contenido 12…308, título con elipsis en **97 px** (la rápida ocupa 111); expandido: 5 líneas, botones dentro de la gota; sin scroll horizontal | — | Cumple (C8) |
| 320×640, texto al 200 % | expandido 404 px de alto, dentro del visor, sin scroll horizontal | 1.4.4 / 1.4.10 | Cumple |
| `prefers-reduced-motion` | una sola altura por estado (54 / 142), fundido de 160 ms al entrar y salir, barra indeterminada quieta al 50 % | sin forma intermedia | Cumple |
| `forced-colors` | gota `Canvas` con trazo `CanvasText` 2 px; rápida `ButtonText`/`ButtonFace`; foco visible | — | Cumple |
| RTL | icono a la derecha del título, chevron y rápida a la izquierda, «Cerrar» al final lógico | espejado | Cumple |
| `pointer: coarse` | sin reglas propias; dianas ya de 44 | — | Cumple sin regla |
| Coste (nacer + expandir, 92 fotogramas) | 75 layouts (5,1 ms), 91 recálculos de estilo (11,8 ms); intervalo p95 17 ms, máx. 18,5 ms | 60 fps | Cumple en escritorio |
| Coste (21 actualizaciones de progreso) | 109 layouts (16,5 ms): ≈ 5 por actualización (clon de medida) | — | Menor (C7) |
| Capa SVG | 1440×900 (toda la ventana) para una gota de ≈ 341×54 | — | No verificable el área repintada (C7) |
| Consola | 0 errores | 0 | Cumple |

## Hallazgos

Cada hallazgo separa **hecho** (medido o leído en el código), **inferencia** y **propuesta**. Dueños según el reparto de Grana aunque Cornisa hoy es un paquete independiente: CSS → coco, `renderer.js`/`drop.js` → bruno, estructura → kiwi, contrato y tokens → lima.

### C1 · El foco de las acciones con relleno no se ve — **bloqueante**
- **Hecho:** `.cornisa-ui :focus { outline: 3px solid var(--cornisa-focus); outline-offset: -5px }` y `--cornisa-focus` = `--cornisa-fg` (blanco). La acción primaria del expandido (`.cornisa-action--primary`) tiene fondo y borde `--cornisa-fg`: el anillo queda **dentro de un relleno del mismo color**. Captura con y sin anillo: **0 píxeles distintos**. La acción rápida (`.cornisa-quick`) tiene un borde transparente de 4 px: el anillo cae medio sobre ese borde y medio sobre el relleno; contraste anillo/relleno 1:1 y la única señal es que la píldora blanca «crece» 2 px (569 px cambian).
- **Inferencia:** con teclado, quien llega a «Reintentar» no sabe dónde está el foco (WCAG 2.4.7). Es el botón más importante del expandido.
- **Propuesta (CSS):** en los botones con relleno de tinta, el anillo en la **tinta inversa** (`--cornisa-bg`) por dentro del relleno, p. ej. `outline-color: var(--cornisa-bg); outline-offset: calc(<ancho> * -2)` en `.cornisa-action--primary:focus-visible` y `.cornisa-quick:focus-visible` (en la rápida, desplazado más allá de su borde transparente de 4 px), o un anillo doble (exterior `fg`, separación `bg`). Con tokens de Grana: el mismo criterio que la isla (anillo en `--_on-ink` sobre las acciones de tinta). Volver a medir con capturas: debe cambiar la imagen y el anillo llegar a 3:1 con lo que lo rodea.

### C2 · Sin delimitación sobre fondos oscuros — **importante**
- **Hecho:** la gota es un `path` con solo `fill`; sin trazo ni sombra fuera de `forced-colors`. Cornisa no reacciona a `prefers-color-scheme`. Sobre `#141414` (la página oscura de Grana) mide **1,02:1**; con la correspondencia a tokens de Grana en oscuro (cristal `--g-glass-tint` al 72 %) **1,05:1**.
- **Inferencia:** en una aplicación oscura la gota se lee como texto flotando sin pieza (la regla de `auditoria-visual.md`: «nada flota sin relación visual»); el borde superior pegado al visor se confunde con una cabecera oscura. Es el riesgo (3) que la rúbrica ya anotó para la isla.
- **Propuesta (CSS):** un filo en el `path` (`stroke` dentro de la silueta, o un segundo `path` desplazado) solo en oscuro, con el material de la isla: hilo `color-mix(in oklab, --g-color-border-control, --g-color-text 30%)` y, si hace falta, el anillo de la página (`--g-color-bg`). En Cornisa independiente: un token `--cornisa-edge` (transparente por defecto, definido en oscuro). El trazo de SVG no deforma el texto ni cambia el alto medido si va por dentro.

### C3 · El CSS no sigue las reglas de Grana — **importante para integrarlo; no es defecto del paquete independiente**
- **Hecho (lectura del CSS):** 6 literales de color (`#111111`, `#ffffff`, `rgba(255,255,255,.78/.28/.14)`); duraciones `120ms`, `160ms`, `1.2s` (más `160` en el `animate()` de `renderer.js` y los muelles de `drop.js`); 14 medidas en px fuera de `24/44` (`400 4 22 8 16 20 11 12 10 2 14 3 -5 -100000`); respaldo `env(safe-area-inset-top, 0px)`; `--cornisa-z: 2147483000`; sin `@layer` (Grana exige las cuatro capas en la primera línea); iconos SVG propios (no Lucide); radio de la gota `24` repetido como respaldo en JS (`|| 24`, `|| 400`).
- **Inferencia:** como está, no podría registrarse en `grana.css` ni pasar las compuertas; un tema de Grana no la cambia (salvo que la aplicación escriba la correspondencia a mano, como se hizo aquí para medir).
- **Propuesta:** la tabla de §Brecha. La decisión de si se integra, y con qué nombre, es del usuario (el README dice que esta incorporación no decide cuál manda).

### C4 · El tipo (`intent`) solo se distingue por la forma del glifo — **importante para Grana; menor como paquete neutro**
- **Hecho:** `renderer.js` pone `data-intent` en `.cornisa-ui`, pero el CSS no tiene ninguna regla para él: éxito, aviso, error y neutro comparten color; cambia solo el icono de 20 px. `priority: 'high'` tampoco tiene señal visual.
- **Inferencia:** no depende del color (bien para 1.4.1), pero un error persistente y un «Sincronizado» pesan igual a la vista. La isla de Grana resuelve lo mismo con una insignia rellena del color del tipo (≥ 4,51:1 su glifo) y el orden por gravedad.
- **Propuesta:** con tokens, un disco tras el icono en `--g-color-{info|success|warning|danger}` (como la insignia de la isla) manteniendo el glifo distinto por tipo. En Cornisa neutra, tokens opcionales `--cornisa-intent-*` vacíos por defecto.

### C5 · El movimiento es lento y retrasa la lectura — **importante**
- **Hecho:** muelles fijos en `drop.js` (`hBirth` 0,46 s/0,28 de rebote, `wBirth` 0,50/0,22, `hExpand` 0,42/0,18…). Medido: el texto aparece a los **418 ms** de empezar a nacer (sale con 120 ms de fundido) y la forma asienta a los **817 ms**; expandir 533 ms, recoger 649 ms, retirar 575 ms. Un rebote de 3 px (57 → 54) y una curvatura inferior (`sag`) de hasta 14 px por velocidad. La isla de Grana: 222–245 ms, sobrepaso 3,1–3,7 %, `--g-duration-slow` 240 ms.
- **Inferencia:** en avisos breves y frecuentes (el caso «Cambios guardados»), casi medio segundo sin texto se percibe lento (rúbrica A: «breve, preciso») y no hay forma de ajustarlo desde el tema. El carácter de «gota» (filete cóncavo contra el borde, caída con un rebote) sí es personalidad propia y sirve: dice de dónde viene la superficie.
- **Propuesta:** (bruno + kiwi) acortar la respuesta de nacimiento hacia ≈ 0,30 s manteniendo un rebote único, y dejar que la fila entre en cuanto la silueta la contiene (hoy ya lo comprueba `rowFits`; el retraso viene del muelle). Exponer una escala de tiempo leída de CSS (p. ej. `--cornisa-motion-scale`, o en Grana derivada de `--g-duration-slow` / `--g-duration-press`) para que el tema la ajuste. Los valores del muelle quedan como constantes de componente documentadas, como en la isla.

### C6 · Bordes y hover por debajo de 3:1 — **menor**
- **Hecho:** borde de «Cerrar» (`--cornisa-track`, blanco al 28 %) 2,45:1 contra la gota; velo de hover (`--cornisa-hover`, 14 %) 1,47:1 contra la gota.
- **Inferencia:** el texto identifica el control (no falla 1.4.11), pero la regla de Grana para controles es 3:1 y «Cerrar» queda como el único botón con contorno apagado junto a acciones de contorno pleno: se lee como deshabilitado.
- **Propuesta:** contorno de «Cerrar» a `--cornisa-muted` (≈ 11:1) o sin contorno y como botón de texto; hover con un velo ≥ 20 % o subrayado. Con tokens: `--_veil` de la isla (12 %) tiene el mismo límite; aceptable solo si el hover no es la única señal.

### C7 · Coste por fotograma y por actualización — **menor**
- **Hecho:** la capa `svg.cornisa-shape` mide toda la ventana (1440×900) y su `d` cambia en cada fotograma; además se escribe `ui.style.width` y atributos en cada `draw()` (75 layouts en 92 fotogramas, 5,1 ms en total; p95 17 ms). Cada `update()` del progreso clona y mide la UI (≈ 5 layouts por actualización; 21 actualizaciones = 16,5 ms).
- **Inferencia:** barato en escritorio; en móvil de gama baja el repintado de una capa del tamaño del visor y el clon por actualización podrían notarse. **No verificable** aquí (sin perfil de pintura ni dispositivo).
- **Propuesta (bruno):** dimensionar el `svg` a la caja de la gota (o `contain: strict` en un contenedor del tamaño de la gota), no tocar `ui.style.width` si no cambia, y en `update()` de solo progreso no recalcular dimensiones (el alto no cambia).

### C8 · A 320 px la acción rápida se come el título — **menor**
- **Hecho:** a 320 px, con un título largo, la rápida «Ver cambios» ocupa 111 px y el título visible queda en **97 px** con elipsis («Sincronizac…»).
- **Inferencia:** el compacto deja de decir qué pasó; hay que expandir para leerlo.
- **Propuesta (kiwi):** por debajo de un ancho, la rápida pasa al expandido (como ya ocurre en `data-expanded`) o el título gana prioridad (`flex-shrink` de la rápida a 1 con su propio mínimo de 44 px).

### C9 · Iconos propios — **menor** (regla de Grana)
- **Hecho:** `ICON_PATHS` dibuja a mano `neutral`, `success`, `warning`, `error` y `chevron`. La lista de la librería ya tiene `info`, `circle-check`, `triangle-alert`, `circle-alert` y `chevron-down` (los mismos que usa `STATUS_ICONS` de la isla; el error de Cornisa es una cruz en círculo, el de la isla `circle-alert`).
- **Propuesta:** al integrarse, `GLibIcon` con esos nombres (DECISIONS #85 a #87).

### Cumplimientos observados (sin hallazgo)
Hover solo dentro de `@media (hover: hover)`; `:active` presente; `:focus-visible` con respaldo `:focus`; propiedades lógicas (`margin-inline-*`) y RTL correcto; `prefers-reduced-motion` sin formas intermedias y con el indeterminado quieto (el cambio de preferencia en caliente detiene el muelle, leído en `renderer.js`); `forced-colors` con silueta trazada y foco `Highlight`; el texto es HTML fuera del SVG y nunca se escala; contenido limitado al visor con desplazamiento interno (`overscroll-behavior: contain`).

## Rúbrica de movimiento

| Dimensión | Estado | Evidencia | Riesgo | Recomendación |
| --- | --- | --- | --- | --- |
| **A · Propósito y utilidad** | Parcial | Hecho: el nacimiento desde el borde dice de dónde viene la superficie y que es la misma pieza al expandirse (continuidad); el texto no espera a nada que no sea la forma. Pero aparece a 418 ms y asienta a 817 ms en un aviso breve; el rebote y la `sag` son de carácter, no de información | Medio | Acortar el nacimiento (C5); mantener un solo rebote |
| **B · Comodidad visual y profundidad** | Parcial | Hecho: sin profundidad simulada (sin sombra ni desenfoque), texto plano 14 px a 18,88:1, sin brillo cambiante. En oscuro la pieza no se separa del fondo (1,02:1, C2) | Medio | Filo en oscuro (C2) |
| **C · Comodidad de movimiento y estabilidad** | Cumple | Hecho: el movimiento ocupa ≈ 341×54 px arriba al centro, sin rotaciones, sin oscilación sostenida (un rebote de 3 px que se amortigua); la página no se mueve (la gota es fija y `pointer-events: none` fuera del contenido). El indeterminado (1,2 s en bucle) es una barra de 4 px y se detiene con `reduce` | Bajo | — |
| **D · Transiciones y continuidad** | Cumple | Hecho: muelles interrumpibles (mostrar → retirar → mostrar a mitad: mayor salto 15,2 px entre fotogramas, termina con contenido); cambio de contenido sin retirarse (`swap`, 120 ms de recogida); el texto nunca sale de la silueta (0 fugas). Inferencia (código): `dt` limitado a 50 ms con subpasos de 1/240 s, independiente de la frecuencia de pantalla; **No verificable** en 120 Hz | Bajo | Medir en 120 Hz y en Safari |
| **E · Control y expectativas** | Parcial | Hecho: no roba el foco; Esc recoge; pulsar fuera recoge; «Cerrar» siempre en el expandido; pausa con foco, puntero y pestaña oculta. Pero el foco de la acción primaria es invisible (C1): con teclado no se sabe qué se va a activar | Alto | C1 |
| **F · Accesibilidad y opcionalidad** | Parcial | Hecho: movimiento reducido real (sin formas intermedias, solo fundido 160 ms); el tipo no depende del color; dianas 44 px; colores forzados. Falla el foco visible de las acciones con relleno (C1). Anuncios por región viva: fuera del alcance de coco, **No verificable** aquí | Alto | C1; lector de pantalla en entorno real |
| **G · Rendimiento** | Parcial | Hecho: p95 17 ms en escritorio, 5,1 ms de layout en una animación completa. Capa SVG del tamaño del visor repintada por fotograma y clon de medida por actualización (C7). Área de pintura y móvil: **No verificable** | Bajo | C7 |
| **H · Inmersión y contenido espacial** | N/A | Superficie 2D de interfaz | — | — |

**Riesgos principales (por gravedad):** (1) foco invisible en la acción primaria y casi invisible en la rápida (C1); (2) sin delimitación en oscuro (C2); (3) movimiento lento para avisos breves y sin control desde el tema (C5); (4) el tipo de aviso no pesa distinto (C4); (5) coste de la capa a pantalla completa en móvil, sin medir (C7).
**Prioridades:** C1 primero (es un fallo de WCAG 2.4.7 y se arregla solo con CSS); después C2 (CSS + token) y C5 (muelles), que son las dos condiciones para que Cornisa se pueda ver junto a la isla en un tema de Grana.
**Limitaciones:** solo Chromium; sin Safari/iOS (donde el muelle y `popover` pueden diferir), sin 120 Hz, sin perfil de pintura, sin lector de pantalla.

## Brecha con Grana

### Correspondencia de tokens

Medida con `packages/vue/src/styles/defaults.css` cargado en el ejemplo y esta correspondencia (inyectada solo en la prueba; no cambia Cornisa):

| `--cornisa-*` (valor) | Equivalente `--g-*` propuesto | Nota |
| --- | --- | --- |
| `--cornisa-bg` (`#111111`) | `light-dark(color-mix(in srgb, var(--g-color-text) 84%, transparent), color-mix(in srgb, var(--g-glass-tint) calc(var(--g-glass-opacity) * 100%), transparent))` | El material de la isla (`tokens.md` §12.1, #694): el mismo objeto oscuro en los dos esquemas. Con `--g-glass-filter` en el contenedor del SVG (el `path` no admite `backdrop-filter`: habría que recortar un `div` con `clip-path: path()`; a valorar) |
| `--cornisa-fg` (`#ffffff`) | `light-dark(var(--g-color-surface), var(--g-color-text))` | = `--_ink` de la isla |
| `--cornisa-muted` (blanco 78 %) | `color-mix(in oklab, <fg> 78%, transparent)` | Constante de componente; medido 7,17 (claro) y 9,87 (oscuro) |
| `--cornisa-track` (blanco 28 %) | `color-mix(in oklab, <fg> 28%, transparent)` o `--g-color-border-strong` invertido | Ver C6 |
| `--cornisa-hover` (blanco 14 %) | `--_veil` de la isla (`<fg>` 12 %) | |
| `--cornisa-focus` (`#fff`) | `<fg>` sobre la gota; `<bg>`/`--_on-ink` dentro de las acciones de tinta | C1 |
| (falta) filo | `light-dark(transparent, color-mix(in oklab, var(--g-color-border-control), var(--g-color-text) 30%))` | = `--_rim` de la isla; C2 |
| `--cornisa-max-width` (`400px`) | `calc(var(--g-space-1) * 104)` (416 px) | = ancho máximo de la isla |
| `--cornisa-radius-expanded` (`24px`) | `calc(var(--g-space-1) * 6)` o `--g-radius-xl` | 24 = `space × 6`; con `radius: 0` del tema, decidir si la gota sigue redonda (es su forma, no decoración) |
| `--cornisa-z` (`2147483000`) | ninguno | Grana usa la capa superior (`popover`) y `EDGE_ORDER`; sin respaldo de `z-index` |
| `--cornisa-safe-top` (`env(…, 0px)`) | `env(safe-area-inset-top)` sin respaldo, como la isla | |
| `--cornisa-font` (`inherit`) | `--g-font-ui` + `--g-text-body-sm-*` (14/20) | meta y «+N»: `--g-text-caption-*` (12/16) |
| `120ms` / `160ms` / `1.2s` | `--g-duration-fast` / `--g-duration-press` / `--g-duration-spin` (800 ms) | Fundidos con `--g-ease-out` |
| Muelles de `drop.js` | constantes de componente; escala desde `--g-duration-slow` | C5; `--g-ease-spring` es una curva CSS (`linear()`), no aplica a un muelle en JS |
| `4/8/12/16/20px`, radio `22px`, `3px`, `-5px` | `--g-space-1/2/3/4/5`, `--g-radius-pill`, `--g-focus-width`, `calc(var(--g-focus-width) * -1)` | `10/11/14px` no están en la escala: derivar de `space` |

### Cómo se vería con un tema de Grana (medido)
- **Claro:** gota grafito al 84 % sobre `#FFFFFF`; título 10,53:1, chevron 7,17:1, gota contra la página 10,53:1. Correcto, con el mismo peso que la isla L1.
- **Oscuro:** cristal `#1C1C1C` al 72 % sobre `#141414`; título 15,71:1, chevron 9,87:1, texto de la rápida 6,36:1, pero **gota contra la página 1,05:1** (C2). Sin el filo de la isla no se puede usar en oscuro.
- En los dos esquemas el foco de la rápida sigue a 1:1 (C1): el defecto no es de valores, es de dónde se dibuja el anillo.

### Comparación estética con `GStatusIsland`
| | Cornisa | `GStatusIsland` (rediseño #693 a #705) |
| --- | --- | --- |
| Forma | Gota **pegada al borde** (`y = 0`, filete cóncavo de 12 px que la funde con el visor), silueta SVG que se curva con la velocidad | Cápsula **separada** del borde `space × 2`, caja CSS de radio = media fila |
| Material | Relleno opaco `#111`, sin filo, sin sombra, igual en claro y oscuro | Grafito esmerilado (claro) / cristal con filo (oscuro), `light-dark()` |
| Movimiento | Muelles en JS, 418 ms hasta el texto, 817 ms hasta asentar, sobrepaso 4,9 % | Muelle CSS (`--g-ease-spring`) solo al crecer, 222–245 ms, sobrepaso 3,1–3,7 % |
| Tipo | Solo el glifo; sin color | Insignia rellena del color del tipo, relevo por gravedad |
| Cola | «+N» que pasa a la siguiente | «+N» en el titular, lista, anillo de tiempo, eco en la marca |
| Texto en movimiento | Nunca se escala; entra cuando cabe | Relevo de una línea en la celda |

**Inferencia:** la gota pegada al borde es la diferencia de identidad más fuerte de Cornisa y no la tiene ningún componente de Grana; la isla gana en material, tipo y tiempo. Las dos ocupan el mismo borde: si conviven, Cornisa necesita entrar en `EDGE_ORDER`/`edgeReserve` (hoy publica su propia `--cornisa-reserved`) o una tapará a la otra. **Recomendación:** que el usuario decida si Cornisa se integra (y entonces kiwi decide si la gota pasa a ser una forma de la isla o un componente aparte) antes de invertir en la correspondencia de tokens.

## Cumplimientos / Correcciones / Pendientes

**Cumplimientos:** contraste de texto 18,88:1 (neutro) y ≥ 10,53:1 con tokens de Grana; dianas de 44 px en todos los botones; texto que nunca se deforma ni se sale de la gota (0 fotogramas); transiciones interrumpibles; 320 px y texto al 200 % sin desplazamiento horizontal; movimiento reducido sin formas intermedias; colores forzados; RTL; hover solo con puntero fino; consola limpia.

**Correcciones:** ninguna aplicada (encargo de solo auditar; no se tocó `packages/cornisa` ni `defaults.css`). Propuestas: C1 (bloqueante, CSS), C2 y C5 (importantes), C3 y C4 (importantes para integrar), C6 a C9 (menores).

**Pendientes:**
- Decisión del usuario: ¿Cornisa se integra en Grana (tokens, capas, Lucide, `EDGE_ORDER`) o sigue como paquete independiente? De eso depende si C3, C4 y C9 son defectos o solo brecha.
- C1 antes de cualquier publicación, aun como paquete independiente.
- No verificado: Firefox, WebKit/Safari e iOS reales, 120 Hz, coste de pintura en móvil, lector de pantalla, zona de marca de Grana (`data-g-zone="brand"`) y temas del CLI distintos del por defecto (solo se midió `defaults.css` claro y oscuro y el tema de ejemplo de `04`).
- La auditoría de lima (`auditoria-lima.md`) cubre contrato y API; los hallazgos C3 y C5 tocan su terreno (tokens y constantes de componente).
