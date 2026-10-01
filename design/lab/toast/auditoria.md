# Auditoría de coco · GToast (paso 5)

**Componente:** `packages/vue/src/components/GToast/` (`toaster.js` y `GToaster.vue` de bruno, commit 9080a20; `GToast.css`; contrato `design/contracts/toast.md` reconciliado por lima en 9d0fcd2, decisión #149), el real con `dist/` reconstruido (`npm run build`) y Vue global.
**Método:** Playwright sobre el **playground real** (`/playground/`, sección «Avisos (GToaster)», gestor `window.toaster` con los `labels` de la demo): seis avisos a la vez (neutral con «Deshacer», info con descripción, success repetido (contador 2), warning con descripción, error con descripción y «Reintentar», loading) con `limit: 10` y `autoClose: false`; después `limit: 3` para la cola («3 más en espera»). Contraste **calculado sobre el compuesto real**: color de cada parte convertido a sRGB por `canvas` y compuesto con su alfa sobre el fondo efectivo (aviso, ficha de cola, página). Temas: **defecto** (claro y oscuro), **Spotify** (marca pálida `#1ED760`, radios grandes; claro y oscuro), **lustre** y **GitHub** (claro y oscuro; generados en `design/lab/tema-oscuro/dark-color-presence/generated/`) y el **tema de prueba** del playground (granate + añil, radios propios). Además: puntero fino y `pointer: coarse` (`hasTouch`), las 6 posiciones en LTR y RTL, `offset`, 320×640 con `viewport-fit=cover` y `safe-area` emulada (CDP `Emulation.setSafeAreaInsetsOverride`, abajo 34px), `GDialog` modal real, `data-flipped`, `prefers-reduced-motion`, `forced-colors` y `prefers-contrast: more` emulados, y salida sin salto muestreada fotograma a fotograma. **Chromium, Firefox y WebKit** (todo salvo `forced-colors`/`prefers-contrast` y `safe-area`, solo Chromium).

## Resultado: aprobado sin defectos de CSS. Sin defectos bloqueantes en `.vue`; `status: "candidate"`

### Contraste (mínimo por fila; igual en los tres motores)

| Medida (umbral) | Defecto claro | Defecto oscuro | Spotify claro / oscuro | Lustre claro / oscuro | GitHub claro / oscuro | Prueba |
| --- | --- | --- | --- | --- | --- | --- |
| Título (4.5) | 17.40 | 15.22 | 17.41 / 15.31 | 17.38 / 15.23 | 17.40 / 15.22 | 17.44 |
| Descripción (4.5) | 7.46 | 8.59 | 7.38 / 8.62 | 7.41 / 8.61 | 7.46 / 8.59 | 7.47 |
| Icono info · success · warning · error (3) | 5.69 · 5.35 · 5.73 · 5.49 | 4.58 · 4.61 · 4.54 · 4.52 | ídem / ídem | ídem / 4.58 · 4.60 · 4.54 · 4.52 | ídem / ídem | 5.69 · 5.35 · 5.73 · 5.49 |
| Icono `loading` (3) | 7.46 | 8.59 | 7.38 / 8.62 | 7.41 / 8.61 | 7.46 / 8.59 | 7.47 |
| Marca de borde error / warning, sobre el aviso (3) | 5.49 / 5.73 | 4.52 / 4.54 | ídem / ídem | ídem / ídem | ídem / ídem | 5.49 / 5.73 |
| Marca sobre la página (3) | 5.49 / 5.73 | 4.89 / 4.91 | ídem / ídem | ídem / 4.88 / 4.91 | ídem / ídem | 5.49 / 5.73 |
| Acción: texto (4.5) / borde (3) | 17.40 / 3.45 | 15.22 / 4.32 | 17.41 / 3.43 · 15.31 / 4.35 | 17.38 / 3.44 · 15.23 / 4.33 | 17.40 / 3.45 · 15.22 / 4.32 | 17.44 / 5.35 |
| Cerrar: icono (3) | 7.46 | 8.59 | 7.38 / 8.62 | 7.41 / 8.61 | 7.46 / 8.59 | 7.47 |
| Contador (`GBadge` soft neutral, 4.5) | 6.54 | 4.56 | 4.64 / 4.58 | 4.65 / 4.59 | 6.54 / 4.56 | 4.68 |
| Texto de cola en su ficha (4.5) | 7.46 | 8.59 | 7.38 / 8.62 | 7.41 / 8.61 | 7.46 / 8.59 | — |
| Anillo de foco / aviso (3) | 5.69 | 4.58 | 4.61 / 13.18 | 6.50 / 4.64 | 5.19 / 4.57 | — |
| Borde de la superficie / página | 1.19 | 1.46 | 1.17 / 1.43 | 1.17 / 1.44 | 1.19 / 1.46 | 1.17 |

La marca y los iconos leen `-text` de la familia semántica, que los temas generados no cambian: por eso coinciden entre temas; la marca pálida de Spotify no toca el aviso (acción y cierre en `text`/`border-control`, no en `primary`). El **borde de la superficie** (1.17 a 1.46) es el de `GSurface floating`: decorativo; en claro el aviso es del mismo tono que la página (1.00) y lo delimitan la sombra `--g-shadow-2` y ese borde, como cualquier `floating` (WCAG 1.4.11 no exige el contorno de un contenedor). Con `prefers-contrast: more` el borde pasa a `border-control` (3.45). El contador queda por encima de 4.5 en todos (mínimo 4.56, defecto oscuro).

### Pruebas por comportamiento

| Prueba | Resultado |
| --- | --- |
| Región antes del primer aviso | Raíz `popover` abierta (`:popover-open`), 2 canales vacíos (`status` y `alert`), `section` `hidden`. Con avisos: `region "Notificaciones (F8)"`, `aria-keyshortcuts="F8"`; árbol de accesibilidad: `status` «Correcto: Bien.» y `alert` «Error: Falló. Pulsa F8 para Reintentar.» |
| Foco | F8 lleva a la acción del más reciente (o a su cierre si no tiene), con `:focus-visible` y anillo `solid 2px --g-color-focus`, `outline-offset` 2px, visible en la capa superior y dentro del modal; F8 de nuevo devuelve el foco (Chromium, Firefox, WebKit) |
| Tamaños (puntero fino) | Cerrar 28×28 (área `::after` de `GBtn` ≥ 24px), acción 28 de alto, separación acción–cierre 4px; aviso de una línea **46px** de alto (28 + 2 × 8 de relleno + 2 × 1 de borde); ancho 360 |
| Táctil (`pointer: coarse`) | Áreas **44×44** en cerrar y 44 de alto en la acción; separación 8px (las áreas no se pisan) |
| 6 posiciones | A 16px de cada borde; `center` centrado (460/460 a 1280); `offset.bottom: 56` → 72px; `offset.top: '3rem'` → 64px. Igual en los tres motores |
| RTL | `start`/`end` se invierten (`bottom-start` a la derecha) y la marca pasa al borde derecho (`border-inline-start`) |
| Móvil 320×640 | `data-mobile`, siempre abajo, pila de 8 a 312, 1 visible (`mobileLimit`) y «2 más en espera» dentro del visor; la acción baja bajo la descripción y el cierre se queda arriba al final; sin desbordamiento del aviso. Con `safe-area` inferior de 34px: base a **34px** (`max(8, 34)`); con `offset.bottom: 56`, a 90px. Sin `safe-area` (Firefox, WebKit): 8 y 64px |
| Dentro de modal | Con `GDialog` abierto la raíz está dentro del `<dialog>` `:modal`, abierta y pulsable (el punto del aviso es el aviso); F8 entra; Esc cierra el aviso y el diálogo **sigue abierto** con el foco dentro; Esc otra vez cierra el diálogo y la región vuelve a `body` abierta. Igual en los tres motores |
| No tapar el foco | Un campo fijo bajo la pila al recibir el foco: `data-flipped`, `data-edge="top"` |
| Salida sin salto | Abajo y arriba, cerrando el primero, el del medio y el último: el que sale **no se mueve** (0px en 40 fotogramas), los demás parten de su sitio (0px el primer fotograma) y se recolocan con transición (paso máximo 21 a 32px por fotograma en 76px), y el nodo se retira. Igual en los tres motores |
| Entrada | Desde 16px hacia el borde + fundido, `--g-duration-press` (160ms) |
| Movimiento reducido | `transition-property: opacity` solamente, `translate` 0 durante toda la entrada (solo fundido), `loader-circle` con `animation-name: none` (sin giro). Sin preferencia: `g-toast-spin` |
| Colores forzados (emulados) | Borde del aviso `CanvasText`, marca de error sólida 4px y de warning **discontinua** 4px en `CanvasText`, iconos (también `loading`), acción, cierre y ficha de cola en `CanvasText`; el tipo se reconoce sin color por la forma del icono y de la marca (captura). Foco visible (2px) |
| `prefers-contrast: more` | Borde del aviso, de la acción y de la cola a `border-control`; descripción y texto de cola a `text` |
| `g-btn__status` / `g-btn__loader` | Cada `GBtn` del aviso trae su `role="status"` vacío (uno por botón: 3 con un aviso con acción y otro sin ella) y su `loader` con `display: none`. Coincido con lima (#149): una región vacía que nunca cambia no habla y `GBtn` necesita la suya antes de cargar (#14); **no hay cambio para bruno ni en `GBtn`**. Queda para lector real si añaden ruido al recorrer |
| Consola | Sin errores ni avisos en Chromium y Firefox; en WebKit, solo con el playground entero a 320px, `ResizeObserver loop completed…` (ver hallazgo 3) |
| `.vue` y CSS | `GToaster.vue` sin `<style>`, sin colores ni medidas: solo escribe en línea las variables dinámicas del contrato (`--_toaster-offset-*`, `--_toast-swipe`, `--_toast-y`) con los valores medidos. `GToast.css` solo `var(--g-*)`/`--_*`, sin respaldos; literales: el texto oculto accesible y los `0px` neutros de las variables dinámicas (ver hallazgo 4) |

## Hallazgos

| # | Severidad | Dueño | Hallazgo y resolución |
| --- | --- | --- | --- |
| 1 | Menor | **lima** → bruno | **Al bajar el límite (paso a móvil o `configure`) se quedan visibles los más antiguos** y los recientes vuelven al principio de la cola (`toaster.js`, `demote`: «se quedan los más antiguos»). El contrato dice lo contrario: «los visibles sobrantes (los más antiguos) vuelven al principio de la cola». Medido: con N, I, S, W, E, L visibles y `limit: 3` quedan N, I, S y la cola W, E, L; **el `error` recién mostrado queda en cola y detrás de W** (no se adelanta al volver a la cola). No es de CSS ni bloquea (el error ya se anunció y se reanuncia al volver), pero al girar un móvil puede esconder el aviso más importante. Lima decide cuál es la regla (y si un `error` que vuelve a la cola conserva su prioridad); bruno alinea código o prueba |
| 2 | Informativo, corregido | coco (`estilo.md`) | `estilo.md` decía que un aviso de una línea mide 44px; mide **46px** (fila de 28 + relleno 2 × 8 + borde 2 × 1 de `GSurface`). Corregido el texto; sin cambio de CSS |
| 3 | Informativo | bruno | En **WebKit** y solo con el **playground completo a 320px** aparece `pageerror: ResizeObserver loop completed with undelivered notifications` (el mismo del hallazgo 5 de `GCard`). `GToaster` no usa `ResizeObserver` y la prueba de avisos solos no lo da: no es atribuible a `GToast`. A 320px el playground desborda por su propia fila de campos (`div.row` hasta 1034px), no por la región (8 a 312) |
| 4 | Informativo | lima | `GToast.css` declara `--_toaster-offset-*: 0px` y `--_toast-swipe: 0px` como valor neutro de las variables dinámicas (una `var()` sin respaldo y sin valor invalidaría `calc()`/`translate`). Es un cero, no una medida de tema; si se quiere explícito en las reglas («únicas medidas literales…»), añadir «y el `0px` neutro de una variable dinámica» |
| 5 | Informativo | lima | Con una marca de radio grande (Spotify, `radius` de `floating` 20px) la marca de inicio de 4px sigue la curva de las esquinas (forma de paréntesis). Es el mismo lenguaje que el `status` de `GCard` y se lee igual en sólida y discontinua; no se cambia |

## Sin ejecutar

- **Lector de pantalla real** (VoiceOver, NVDA, JAWS, TalkBack): vaciar y reescribir el canal, interrupción del `alert`, traslado al modal sin repetir ni perder anuncios, los `role="status"` vacíos de `GBtn` al recorrer.
- **Deslizar con dedo real** (inercia, gesto «atrás» del sistema en los bordes); solo revisados `touch-action: pan-y` y `translate` por CSS (el umbral lo prueba bruno).
- **`safe-area` real** en un dispositivo con muesca, y en Firefox/WebKit (solo emulada en Chromium).
- **Teclado virtual**, **varios modales apilados**, un **`GMenu` abierto sobre un aviso**, **zoom al 200 %** real (cubierto de forma aproximada por la prueba a 320px).
- **`forced-colors` real de Windows** y `prefers-contrast: more` con un tema de alto contraste real (solo emulados).
- **Rendimiento del `MutationObserver`** en una aplicación grande.

## Seguimiento

- **Hallazgo 1, cerrado** (bruno, decisión #150): `demote` deja visibles los `error` y después los más recientes; los sobrantes vuelven al principio de la cola con los `error` delante. Prueba nueva en `toaster.test.js` (orden de la cola comprobado por promoción). 1172 pruebas, build y compuertas bien.
