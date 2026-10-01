# Entrega de coco · GToast.css (región `g-toaster` y aviso `g-toast`)

**Archivos:** `packages/vue/src/components/GToast/GToast.css`. **Sin tokens nuevos** y sin cambios en `defaults.css` (`tokens.md` §20, #146).
**Contratos:** `design/contracts/toast.md`, `dialog.md` («Convivencia con avisos»), DECISIONS #138 a #147.
**Banco:** `design/lab/toast/estilo-banco.html` (marcado exacto del contrato; galería estática de tipos, acción, contador, textos largos, cola y alineaciones, fondos, móvil 320; región viva real en la capa superior con las 6 posiciones, `offset`, `data-flipped`, cola, promesa, repetidos, ráfaga, modal, Esc y deslizar). Parámetros `?dark=1`, `?rtl=1`, `?theme=<generado>`, `?pos=`, `?demo=1`, `?offset=`. El script hace lo mínimo de bruno (sin temporizadores).

## Carácter
Silencioso: superficie `floating` blanca (o `surface` del tema), sin fondos de color. El tipo se lee por la **forma del icono Lucide** en su color `-text`; **error** y **aviso** suman una **marca de borde de inicio** de forma distinta (sólida / discontinua, el lenguaje de estado de `GCard`), porque son los que piden atención y `circle-alert` e `info` solo se distinguen por la orientación del signo. `neutral` no lleva icono ni marca; `loading` lleva `loader-circle` en `text-muted`. En escala de grises y con colores forzados el tipo se sigue leyendo (icono + forma de la marca).

## Valores fijados (constantes derivadas de `space`, no tokens)
| Qué | Valor | Con `space` 4 |
| --- | --- | --- |
| Ancho del aviso | `min(space × 90, 100% − 2 × margen)` | 360px |
| Separación entre avisos | `space × 2` | 8px |
| Margen al borde | `space × 4`; `space × 2` con `data-mobile` | 16 / 8px |
| Márgenes reales | `max(margen, env(safe-area-inset-*))` + `--_toaster-offset-*` (inicio/fin de `safe-area` se intercambian con `:dir(rtl)`) | |
| Altura de fila | `space × 7` (= `GBtn` sm): título centrado con acción y cierre; un aviso de una línea mide 46px (44 + el borde de `GSurface`; auditoría, hallazgo 2) | 28px |
| Relleno | bloque `space-2`; inicio `space-3`, fin `space-2` (el cierre es fantasma) | |
| Icono / icono de cerrar | `space × 5` / `space × 4` | 20 / 16px |
| Marca de inicio | `space-1` (resta del relleno: el icono no se mueve) | 4px |
| Entrada | `space × 4` desde el borde (`data-edge`) + fundido | |

## Acción, cierre, contador y cola
- **Acción:** `GBtn size="sm" variant="outline" color="neutral"`; GToast.css reasigna el texto a `--g-color-text` y el borde a `--g-color-border-control` (≥ 3:1). Sobria e independiente de la marca (una marca pálida no la rompe, hallazgo 2 de `GCard`).
- **Cerrar:** `GBtn icon size="sm" variant="ghost" color="neutral"`, icono `text-muted` → `text` en hover. 28px visibles; área 24px con ratón y 44px con `pointer: coarse` (la de `GBtn`); con táctil la separación acción–cierre sube a `space-2`.
- **Contador:** el `GBadge` del contrato sin cambios (`margin-inline-start: space-1`, alineado a la línea).
- **Cola:** ficha propia (fondo `surface`, borde, `radius-pill`, `shadow-1`, `caption`, `text-muted`), alineada como la pila. Va fuera de los avisos, sobre una página de color desconocido: así su contraste no depende del fondo.

## Movimiento
- `data-state`: `entering` (opacidad 0, `translate` de entrada) → `visible` → `leaving` (opacidad 0). Entrada y recolocación `--g-duration-press` + `--g-ease-out`; salida `--g-duration-fast` + `--g-ease-standard`. Nada se repite salvo el giro de `loader-circle` (`--g-duration-spin`).
- **Recolocación (FLIP):** `transition` sobre `transform`, que es la propiedad que escribe `TransitionGroup` (la entrada y el arrastre usan `translate`, otra propiedad: no se pisan).
- **Salida sin salto:** el aviso `leaving` sale del flujo (`position: absolute`) fijado con `--_toast-y` (lo escribe bruno) y deja de recibir el puntero; el resto se recoloca con FLIP. Verificado: el que sale no se mueve (abajo y arriba, primero y último).
- **Deslizar:** `translate: var(--_toast-swipe) 0`; `is-swiping` quita la transición; al soltar sin superar el umbral vuelve con transición; al cerrarse, bruno deja `--_toast-swipe` en ± el ancho y sale deslizando y fundiéndose. `touch-action: pan-y`.
- **`prefers-reduced-motion: reduce`:** solo `opacity`; sin desplazamiento de entrada ni giro (el arrastre sigue al dedo: no es animación).

## Decisiones y desviaciones
1. **`pointer-events`:** la raíz no captura; la **lista** sí (no solo cada `g-toast`, como decía el contrato), para que cruzar los 8px entre avisos no reanude los temporizadores (era la intención del prototipo de kiwi). La lista mide exactamente la pila. La cola no captura.
2. **Variables dinámicas declaradas con su valor neutro** en el CSS (`--_toaster-offset-*: 0px`, `--_toast-swipe: 0px`, `--_toast-y: auto`): sin ellas una `var()` sin respaldo invalidaría la declaración. Las de línea de bruno ganan.
3. **Nueva variable dinámica `--_toast-y`** (no está en el contrato): ver «Movimiento». Para lima y bruno.
4. **Marca solo en error y aviso**, no en info/éxito (silencio; el icono basta y no hay ambigüedad entre `info` y `circle-check`).
5. Móvil: con `has-action`, `g-toast__actions` pasa a `display: contents` y la acción baja a una segunda fila bajo el texto; el cierre se queda arriba.
6. `data-mobile` solo cambia ancho, margen y la fila de la acción; el borde y la alineación los da `data-edge`/`data-align` (efectivos, como fija el contrato).
7. Sin `@starting-style`: el traslado al `<dialog>` vuelve a insertar los nodos y relanzaría la entrada.

## Verificación (Chromium, Playwright; animaciones terminadas o movimiento reducido al medir; contraste medido con los colores calculados sobre la superficie compuesta)
Temas: defecto claro/oscuro, `spotify` y `lustre` (marca pálida y radios grandes) claro/oscuro y los otros 8 generados × claro/oscuro.
| Medida | Defecto claro / oscuro | Mínimo en los 22 |
| --- | --- | --- |
| Título / descripción | 17.4 / 7.46 · 15.2 / 8.59 | 15.2 / 7.44 |
| Icono info · success · warning · error | 5.69 · 5.35 · 5.73 · 5.49 / 4.58 · 4.61 · 4.54 · 4.52 | 4.51 |
| Marca de error / aviso | 5.49 / 5.73 · 4.52 / 4.54 | 4.51 |
| Icono `loading` / cerrar | 7.46 · 8.59 | 7.44 |
| Acción: texto / borde | 17.4 / 3.45 · 15.2 / 4.32 | 15.2 / 3.43 |
| Contador (`GBadge`) | 6.54 · 4.56 | 4.56 |
| Texto de cola (en su ficha) | 7.46 · 8.59 | 7.44 |
| Borde de la superficie | 1.19 · 1.46 (el de `floating`: decorativo, la sombra y el fondo delimitan; 3:1 con `prefers-contrast: more` → `border-control`) | |
- **Tamaños:** cerrar 28×28, acción 28 de alto; `pointer: coarse` → áreas 44×44 (cerrar) y 44 de alto (acción).
- **Posiciones:** las 6 a 16px del visor; RTL invierte inicio/fin (`bottom-start` a la derecha); `offset` 56 sube la pila 56px; `data-flipped` probado a mano.
- **320×640:** `data-mobile`, raíz de 8 a 312, sin desbordamiento de página ni de aviso; la acción baja bajo el texto.
- **Modal:** la raíz dentro del `<dialog>`, `:popover-open`, por encima del fondo y pulsable; Esc en un aviso lo cierra y el diálogo sigue abierto; al cerrar el modal vuelve a `body` abierta.
- **Foco:** Tab desde el último campo llega al cierre con anillo `focus` de 2px visible en la capa superior.
- **forced-colors:** borde `CanvasText`, iconos `CanvasText`, marcas conservan forma (sólida / discontinua 4px). **prefers-contrast: more:** borde `border-control`, descripción y cola en `text`.
- Consola limpia en todos los casos. `vitest` 1085/1085 (incluye `levels.test.js` con `GToast.css`), `npm run build` y las tres compuertas OK.

## Para bruno
1. Registrar `GToast/GToast.css` en `components.css` **después** de `GSurface.css` (reasigna su relleno y su borde de inicio) y añadir la compuerta `grep -q "g-toast--type-error" packages/vue/dist/grana.css`. Hoy `dist` no trae el CSS de avisos.
2. Acción: `GBtn size="sm" variant="outline" color="neutral"`; cerrar: `GBtn icon size="sm" variant="ghost" color="neutral"` con `GIcon x`. Contador como dice el contrato.
3. Lista con `TransitionGroup` (FLIP sobre `transform`; `move-class` cualquiera, p. ej. `is-moving`: la transición de `transform` ya está en `.g-toast`). Al pasar a `leaving`, escribir en línea `--_toast-y` = con `data-edge="top"` su `offsetTop`; con `bottom`, `lista.clientHeight − offsetTop − offsetHeight`. Retirar el nodo al acabar la transición o tras `--g-duration-press` (no esperar `transitionend`, que con movimiento reducido o sin cambio no llega).
4. `entering` → `visible` dos fotogramas después de insertar. Al soltar un deslizamiento que cierra, poner `--_toast-swipe` a ± el ancho y quitar `is-swiping` antes de `leaving`; si no cierra, `--_toast-swipe: 0px` y quitar `is-swiping`.
5. Marcado que el CSS espera y el contrato no lista: `--_toast-y`; `.g-toast__icon > .g-icon` hijo directo (para el giro de `loading`); las clases de `GSurface` completas en el `li` (`--level-floating`, `--padding-sm`); `data-edge`/`data-align` siempre presentes; `g-toaster__queued` sin `hidden` cuando se muestra.

## Para lima
1. Añadir `--_toast-y` a «Clases» y a `tokens.md` §20 (variable dinámica en línea, como `--_toast-swipe`).
2. Desviación 1 (`pointer-events` en la lista, no solo en los avisos).
3. Fijados: ancho `space × 90`, separación `× 2`, margen `× 4` (`× 2` móvil), entrada `× 4`; marca solo en error (sólida) y aviso (discontinua).

## No ejecutado
Firefox/WebKit (`popover` dentro de `<dialog>`, `:dir()`, `env(safe-area-*)` real), dispositivo con muesca, táctil con dedo (inercia, gesto «atrás»), `forced-colors` real de Windows, lector de pantalla, zoom 200 % (por ancho: 640px de visor equivale a 320 a 200 %, cubierto por la prueba de 320 de forma aproximada), temporizadores (son del gestor).
