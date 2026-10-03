# Entrega de coco · GBtn.css

**Archivo:** `packages/vue/src/components/GBtn/GBtn.css`
**Estado:** listo para bruno (registro pendiente en `components.css`, que es de bruno).

## Verificación en Chromium (banco de pruebas con el marcado de `design/contracts/btn.md`)

| Prueba | Resultado |
| --- | --- |
| Contraste texto/fondo: 7 colores × 5 variantes, en reposo y hover (70 pares) | Todos ≥ 4.5:1. Mínimo: 4.76 (`success` soft) |
| Altura: 5 tamaños × 3 densidades | Exacta según el contrato (p. ej. md 36 / 31.5 / 27; xs con piso de 24) |
| `loading` conserva el ancho | 160.56px antes y después |
| Área táctil en el botón más pequeño (xs compacto) | 24px de alto por pseudo-elemento |
| Foco con teclado | Contorno sólido de 2px, color `focus`, separación de 2px |
| Texto largo en contenedor de 220px | Salta de línea; el alto crece (56px), no se corta |
| Cambio de tema (marca azul marino, `shape` píldora, `space` 5, fuente serif) | Todo cambia; ningún botón conserva valores del tema anterior |
| Literales | Sin colores; medidas solo `24px`, `44px` y el patrón de texto oculto |
| Errores de consola | Ninguno |

## Hallazgo corregido durante la entrega

`min-block-size` fija un mínimo, no una altura: con padding fijo, `xs` medía 26 en lugar de 24, y la densidad no reducía los tamaños pequeños. El padding vertical ahora se calcula desde la altura objetivo: `(altura − interlineado) ÷ 2 − borde`.

## Tokens que faltaban en el contrato

`--g-radius-shape`, `--g-border-width`, `--g-focus-width`, `--g-focus-offset`, `--g-duration-fast`, `--g-duration-spin`, `--g-ease-standard`, `--g-text-action-weight`. Agregados por lima a `docs/contract/tokens.md`; valores por defecto en `defaults.css`.

## Tamaño del icono · `--_icon` (#205, coco)

Alias local de `GBtn.css`, sin token ni literal nuevo. Se define como `calc(var(--_fs) * factor)` (el factor se aplica a `--_fs`, no en un `em` suelto, para que no cambie si el hueco trae otro `font-size`) y se aplica al `svg` hijo directo del hueco.

| Hueco | Tamaño | Cómo |
| --- | --- | --- |
| `prepend`, `append` | **1.15em** del texto (13,8px en `xs`, 16,1 en `sm`/`md`, 18,4 en `lg`/`xl`) | `.g-btn__prepend > svg`, `.g-btn__append > svg`; antes 1em (14px en `md`) |
| Slot por defecto con `icon` | **1.4em** del texto (16,8 en `xs`, 19,6 en `sm`/`md`, 22,4 en `lg`/`xl`) | `.g-btn--icon { --_icon }` y `.g-btn--icon .g-btn__label > svg`; sigue a `size`, **no** a `density` |
| `g-btn__loader` | `--_icon` del modo (igual que el icono al que sustituye) | Antes `--_fs`: encogía al cargar |

**Por qué 1.4em en solo icono.** La condición de #205 es caber sin tocar el borde en todos los tamaños y densidades. El peor caso es el piso de 24px (`xs` en cualquier densidad y `sm` en `compact`): interior de 22px (borde 1px). El dibujo `circle` de Lucide, el más ancho, ocupa 22/24 de su caja (trazo incluido). Con 1.5em, `sm`/`compact` dejaba 1,38px entre el trazo y el borde, ya justo; con **1.4em deja 2,0px** (`xs`: 3,3px; con el tema de borde 2px y `space` 5: ≥ 2,1px). Es 0,25em mayor que el de `prepend`/`append` y ocupa del 54 % (`md`/`default`: 19,6 de 36px) al 70 % (`sm`/`default`: 19,6 de 28) de la caja.

**El icono no añade altura.** El icono del solo icono (hasta 22,4px) es mayor que el interlineado de `sm` y `md` (20px) y haría crecer el botón (padding calculado desde la altura objetivo). `.g-btn--icon .g-btn__label` mide el interlineado (`block-size: var(--_lh)`) y el icono lo desborda por igual (centrado en flex). Alto medido igual que el del botón con texto en las 15 combinaciones: 24 a 52px, exactos.

### Mediciones (Chromium, Firefox y WebKit; tema por defecto, sin diferencias de más de 0,02px entre motores)

| size | texto | prepend/append | solo icono | altura default / comfortable / compact | holgura trazo–borde (default / compact) |
| --- | --- | --- | --- | --- | --- |
| xs | 12px | 13,8px | 16,8px | 24 / 24 / 24 (piso) | 3,3 / 3,3 |
| sm | 14px | 16,1px | 19,6px | 28 / 24,5 / 24 (piso) | 4,0 / 2,0 |
| md | 14px | 16,1px | 19,6px | 36 / 31,5 / 27 | 8,0 / 3,5 |
| lg | 16px | 18,4px | 22,4px | 44 / 38,5 / 33 | 10,7 / 5,2 |
| xl | 16px | 18,4px | 22,4px | 52 / 45,5 / 39 | 14,7 / 8,2 |

- **Loader sin salto:** tamaño igual al icono de `prepend` (13,8 a 18,4px) y al del solo icono (16,8 a 22,4px) en las 15 combinaciones; centrado (≤ 0,6px); ancho y alto del botón iguales cargando y sin cargar (0,01px).
- **Contraste:** sin cambios (el icono es `currentColor`): 35 combinaciones de color × variante, mínimo 4,76:1 (`success` soft), ≥ 4,5 en todas.
- **Área táctil:** 24px de `::after` como mínimo; con `pointer: coarse` (Chromium con `isMobile`, WebKit con `hasTouch`) 44px en las 15 combinaciones del solo icono. Firefox no emula `pointer: coarse`: no verificado ahí.
- **RTL:** solo icono centrado a 0,6px; los iconos de hueco con `g-icon--flip-rtl` espejan y miden lo mismo.
- **Tema oscuro y tema de prueba** (Georgia, borde 2px, `space-1` 5px, forma píldora): mismas relaciones; el icono sigue a `size` y la altura a `space`, así que con otra `space` el solo icono puede ocupar menos o más de la caja, siempre sin tocar el borde (holgura mínima 2,1px).
- **Clase de la aplicación (#204):** con el CSS real en capas (el banco carga `grana.css`), una clase de 48px sobre el icono de `prepend` gana al hueco en los tres motores. No se pone: el tamaño lo manda `size`.
- **Consola:** limpia en los tres motores. Sin literales ni tokens nuevos.
- **Verificación propia:** `node design/lab/btn/estilo-verificar.mjs --engines=chromium,firefox,webkit` (3350 comprobaciones), sobre `design/lab/btn/estilo-banco.html`.

### Sin verificar

- Contenido del hueco que no sea un `svg` (imagen, logotipo): lo dimensiona la aplicación.
- `link` con `icon` (sin altura mínima): no se prueba; no es un caso del contrato.
- Pantallas de baja densidad con alturas fraccionarias (`comfortable`: 24,5, 31,5, 38,5px): los bordes del icono pueden verse difusos; sigue el pendiente de `round()`.

## Personalidad (plan 015; DECISIONS.md #299 y #300; `btn.md` «Personalidad»)

Lo que hace inconfundible al botón de Grana es **cómo responde a la mano**, no un adorno: aprieta rápido y **vuelve con masa** (un rebote mínimo, pico 1,006, que se siente más que se ve), y al pasar a «esperando» la etiqueta **cede el sitio** al indicador en lugar de desaparecer en un cuadro. Las dos ideas usan solo tokens; la única constante es el multiplicador neutro `× 1` de `--g-space-1` (#299 (8)).

| Momento | Qué pasa | Tokens |
| --- | --- | --- |
| Apretar (`:active`, sin `disabled`/`is-disabled`/`is-loading`/`link`) | Escala a `--g-press-scale` | `--g-duration-fast`, `--g-ease-out` |
| Soltar (regla base) | Vuelve a 1 rebasando un poco y asienta | `--g-duration-slow`, `--g-ease-bounce` (dentro de `@supports (transition-timing-function: linear(0, 1))`; fuera, la vuelta vigente `press` + `ease-out`) |
| Entrar en `loading` | Etiqueta y huecos se funden (`opacity: 0`) y suben `--g-space-1 × 1`; el indicador llega desde `× 1` abajo con fundido | `--g-duration-fast` (`ease-standard`) en la opacidad, `--g-duration-press` (`ease-out`) en el desplazamiento |
| Salir de `loading` | A la inversa: la etiqueta baja a su sitio y el indicador se va hacia abajo con fundido | Los mismos |
| `prefers-reduced-motion: reduce` | Sin escala ni rebote; B2 solo fundido, sin desplazamiento | — |

Decisiones de implementación (coco):

- **Dos listas de `transition` completas** (colores + `transform`): la ida en `:active`, la vuelta en la regla base; ninguna pierde una propiedad al cambiar de estado (defecto del plan 004). Con `reduce`, las dos listas se quedan solo con los colores.
- **`@supports` y no «declarar antes la vigente»:** con `var()`, una curva `linear()` no soportada invalida la declaración en tiempo de cálculo y `transition` se queda en su valor inicial (el botón perdería también los fundidos de color).
- **El indicador ya no usa `display: none`:** queda siempre en el árbol de cajas (absoluto, sin ocupar sitio) con `opacity: 0`, `visibility: hidden` y el giro en pausa (`animation-play-state: paused`) fuera de carga. Así entra **y sale** con transición en los tres motores sin `transition-behavior: allow-discrete`, y **montar ya en carga no anima nada** (#299 (4)), cosa que `@starting-style` (la pista de `btn.md`) no cumpliría: animaría el indicador al montar y no podría animar la salida. Mismo comportamiento que pide el contrato; anotado para lima.
- **La etiqueta nunca usa `visibility` ni `display`** (corrección `597ab17`): `opacity: 0` y `pointer-events: none`; el nombre accesible no cambia. Los huecos (`aria-hidden`) sí pasan a `visibility: hidden`, con transición discreta: siguen visibles mientras se funden.
- `--g-ease-spring` y `--g-ease-bounce` añadidos a `defaults.css` tal cual `tokens.md` §6. Un tema sobrio quita el rebote con `--g-ease-bounce: var(--g-ease-out)`; con `--g-press-scale: 1` no hay pulsación ni rebote.

### Mediciones (GBtn real del UMD, tema por defecto; `design/lab/theme-playground/tests/personalidad-btn.spec.mjs`)

| Qué | Chromium | Firefox | WebKit |
| --- | --- | --- | --- |
| Pulsado | 0,970 | 0,970 | 0,970 |
| Ida (lista de `:active`) | 4 propiedades, `transform` 120ms | igual | igual |
| Vuelta | 240ms, `linear(…)` | igual | igual |
| Pico tras soltar (transición real pausada y recorrida cada 2ms) | 1,00597 | 1,00597 | 1,00597 |
| Último instante fuera de 1 ± 0,0005 | 168ms (< 240) | 168ms | 168ms |
| Con `reduce` | escala 1 siempre | igual | igual |
| B2: ancho al entrar en carga | 128,67 → 128,67px | 128,70 → 128,70px | 128,67 → 128,67px |
| B2: etiqueta en carga | `opacity` 0, `visibility: visible`, −4px (= `space-1`) | igual | igual |
| B2: indicador | llega desde +4px, `opacity` 0 → 1 (120ms), `translate` 160ms | igual | igual |
| B2: salida | etiqueta a 1 y 0px; indicador sale con fundido y termina `hidden` | igual | igual |
| B2: montar ya en carga | 0 transiciones; indicador centrado (< 1px) | igual | igual |
| B2 con `reduce` | solo `opacity`; ninguna transición de `translate` | igual | igual |
| B2 en tiempo real (rAF, medida de kiwi) | 5 cuadros intermedios en etiqueta e indicador | — | — |
| Nombre accesible en carga (árbol AX por CDP) | «Enviar informe» | — | — |

El conteo de cuadros en tiempo real solo se exige en Chromium: con carga en paralelo, WebKit dejaba 0–1 cuadros dentro de 120ms (mismo síntoma que el hallazgo 4 de `form-reveal`). En los tres motores B2 se mide de forma determinista: se pausan las transiciones reales y se recorre su tiempo cada 10ms (9 muestras intermedias en etiqueta e indicador). `btn-loading-name.spec.mjs` sigue en verde; `estilo-verificar.mjs` 1195/1195 en Chromium.

### Sin verificar (personalidad)

- El respaldo sin `linear()` (fuera de `@supports`): los tres motores actuales lo soportan; no hay motor en el banco que lo ejerza.
- Pantalla táctil real (la pulsación en táctil dura lo que el dedo; el rebote se ve al levantarlo) y `forced-colors` real: escrito, no emulado en este spec (la regla de `forced-colors` no toca el movimiento).

## No verificado

- Alturas fraccionarias (`comfortable`: 31.5px, 38.5px…) pueden verse con bordes difusos en pantallas de baja densidad. Pendiente evaluar `round()` de CSS.
- `forced-colors` y `prefers-reduced-motion`: reglas escritas, no emuladas en esta prueba.
- Tema oscuro: no existe aún.
