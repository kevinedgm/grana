# Auditoría · densidad global y por región (pieza 2, paso 5, coco)

**Pieza:** `--g-density` y `data-g-density` (`density.md`, lima 08ffaa8; #974 a #982) · **CSS:** coco 7f789d2 (fase 1: token, atributo, P2, alias de raíz, marca de `GTabs` interpolada) y e33b57e (fase 2: sin reglas de clase de multiplicador; marca de `GTabs` sin transición del eje cruzado) · **Emisión:** bruno f401a9b (atributo + clase solo con prop, `utils/density.js`) · **Fecha:** 2026-10-29 · **Resultado:** un defecto propio corregido (la marca de `GTabs` animaba el cambio de densidad), sin defecto bloqueante de coco.

**Verificación propia:** `node design/lab/density/auditoria-verificar.mjs` sobre `design/lab/density/banco.html` (componentes **reales** de `dist/`: `grana`, `slider`, `combobox`, `time-field`, `form-fold`, `status`) y el playground. Con `BASE=<dist de 08ffaa8>` añade el Δ0 del playground entero; con `DIST=<dist>` sirve otro `dist/`. Ejecutada sobre un `dist/` construido aparte (worktree de f401a9b + el CSS de e33b57e), Vue desde `node_modules` (unpkg bloqueado), servidor en el puerto 4209.

| Motor | Comprobaciones |
| --- | --- |
| Chromium | **142/142** |
| Firefox | No verificado (no instalado en este entorno) |
| WebKit | No verificado (no instalado en este entorno) |

Además, sobre el mismo `dist/`: `personalidad-tabs.spec.mjs` y `tabs-pista.spec.mjs` 21/21 en Chromium (tras quitar la transición del eje cruzado de la marca; el playground servido con Vue local). `tests/density.spec.mjs` de bruno (en curso, sin commit): 15 pasan y 2 fallan por la prueba, no por el CSS (ver «Pendientes»).

## Auditoría previa (`density.md` §15)

Pieza de mecanismo, sin forma nueva: la densidad aprieta, no reordena; no toca color, estados ni texto (el texto es la pieza 3). Riesgos que se miden: que algo se anime al cambiar la densidad, que una región no llegue a la capa superior o al diálogo, que los avisos cambien de tamaño, la rejilla de 0,5 px y los mínimos 24/44/16.

## Criterios de `density.md` §10 (los que miden CSS y forma)

| # | Estado | Evidencia (Chromium) |
| --- | --- | --- |
| 1 Δ0 por defecto | Cumple | Playground entero frente al `dist/` de 08ffaa8: alto, ancho, rellenos, separaciones y letra iguales en unas 10 800 cajas, con puntero fino y con grueso, salvo el **cambio esperado de §3.5**: el `GSplit density="compact"` del playground (`#spl-b`) aprieta ahora sus `GSurface` (−8 px). En el banco, ninguna raíz sin prop lleva `--density-*` ni `data-g-density`; fuera de las regiones solo `GToaster` y `GStatusIsland` llevan `data-g-density="default"` sin clase |
| 2 Región | Cumple | Región compact: `GBtn` 27, cajas de `GInput`, `GSelect`, `GDatePicker`, `GTextarea rows=1` 27; comfortable 31,5. El juego completo (23 componentes, ~437 cajas: también casilla, interruptor, radios en lista y segmentados, deslizador, pestañas, pasos, tabla, sidebar, pila, superficie, tarjeta y formulario) es **idéntico** al mismo juego con la prop del mismo paso. Un valor fuera de contrato (`tiny`) no hace nada |
| 3 Anidación | Cumple | compact dentro de comfortable = compact; default dentro de compact = página; tres niveles alternos = el más cercano |
| 4 La prop gana | Cumple | `density="default"` en compact → 36; `density="compact"` en comfortable → 27; con `data-g-density="comfortable"` de la aplicación en la misma instancia gana la prop (atributo y clase `compact`); toda raíz con clase `--density-X` lleva `data-g-density="X"` |
| 5 B | Cumple | `GTable compact`: botón de su toolbar 27 y el item del menú que abre 27; `GCard compact`: su acción 27; `GDialog compact`: su `GInput` 27; `GStack compact`: `GBtn` hijo 27 y separación × 0,75 |
| 6 Capa superior | Cumple | `GMenu` abierto (`:popover-open`) desde compact: item = disparador = 27 y la lista entera = la de la prop compact; opciones de `GSelect`, campo y panel de `GCombobox` iguales a la prop |
| 7 Diálogo heredado | Cumple | `GDialog` sin prop escrito en compact, abierto como modal: carcasa y contenido iguales al de prop compact, `GInput` 27; con `density="default"` 36 e igual al de la página |
| 8 Superficies de página | Cumple | Aviso con acción e isla con descripción: botones y cajas de `GToaster` iguales con `<html>` compact, comfortable, la clave del CLI compact y con un `GDialog density="compact"` abierto |
| 9 Formularios (forma) | Cumple | `GForm` sin prop en compact: campos y `GFormActions` 27; `GForm compact`: 27; región default entre ellos → 36; `GForm` en región compact **idéntico** a `GForm compact` con `GFormSection`, `GFormReveal` y `GFormFold` dentro; sus separaciones siguen a la región. (`useFormField().density` es prueba unitaria de bruno) |
| 10 Cambio en marcha | Cumple (tras corregir) | `<html>` default → compact → comfortable y una región: altos en el siguiente cuadro; el juego medido por JS (marca de `GTabs`, deslizador, filas) igual a la región estática en ≤ 2 cuadros; foco en el mismo campo; **ningún** `CSSTransition` ni `transitionrun` de geometría (antes de la corrección: 4, la marca de `GTabs`); igual con `prefers-reduced-motion`; un solo `MutationObserver` de densidad con 9 juegos y ninguno tras desmontar. Tareas largas: ver nota |
| 11 CLI frente a `<html>` | Cumple | Con la forma de §6 (y la salida real del CLI de bruno, que la emite igual): página 27; `<html comfortable>` 31,5; `<html default>` 36; una región comfortable dentro sigue mandando; un segundo tema `comfortable` cargado después gana; sin clave, nada en `tokens.css` |
| 12 Táctil (P2) | Cumple | `hasTouch` + `isMobile`, `pointer: coarse`: región compact, `<html compact>` y CLI compact → `--g-density` 1 y `GBtn` visible 36; los juegos de región igual a la página; `GBtn density="compact"` → 0,75, caja 27, área ≥ 44; `GInput density="compact"` → caja 44 y texto 16; dentro de la raíz con prop 0,75; una región de la aplicación dentro de ella, 1 |
| 13 Sin JS | Cumple | `@vue/server-renderer` sobre `dist/grana.js`: con JS apagado región 27, prop 27, página 36; la raíz con prop ya trae clase y atributo; al hidratar, sin avisos |
| 14 Marca de `GTabs` | Cumple | Grosor = `--g-tabs-mark-{paso}` (Δ ≤ 0,01 px) por región y por prop, con el tema por defecto y con los tres tokens cambiados (5 · 3,5 · 1,25 px); también con `border-width` 1 · 1,5 · 2 px (medido en la fase 1) |
| 15 Meta de `GCard` | Cumple | `low` oculta en región compact tras montar y con prop compact; visible en default y comfortable; vuelve al cambiar la región en marcha; en táctil visible en región compact (P2) y oculta con prop compact |
| 16 Rejilla y mínimos | Cumple | Con `--g-space-1` 4,375 y 3,75 px, alto × 2 entero en botones, cajas de campo y pestañas de los cinco juegos; ningún `GBtn` < 24, ningún texto < 12; en táctil, texto editable ≥ 16 en todos los juegos; en oscuro, región = prop |
| 17 Grep | Cumple | Ninguna hoja declara `--g-density`; ninguna lee `.g-form--density-*` desde un descendiente; no queda regla `--density-*` de solo multiplicador (salvo `GCalendar`); 34 alias de raíz con `var(--g-density)`; `16px`, `24px`, `44px` con los mismos usos que en 08ffaa8 |
| 18 Blocks | Cumple con una regresión táctil | Ver «Auditoría visual de los blocks» abajo (`auditoria-blocks.mjs`, antes/después sobre el `dist/` de 08ffaa8): sin regresión en escritorio; en teléfono, `GbConfirmation03` y `GbProductCard03` pierden altura visible de botón por la prop explícita (P2 no cede) |

**Nota 10.13 (tareas largas, 500 filas):** segunda medida con el `dist/` final de bruno (load 1,13, un worker): cambio de densidad 72 ms, control con un token puro 80 ms (3 pasadas: 72/71/81 y 72/80/80). El cambio de `<html>` cuesta lo mismo que el control (mismo reflujo sin atributo ni observador), así que es el coste de estilo y maquetación de 500 filas en Chromium headless, no del mecanismo. **Los 79 ms de la primera medida se reproducen en orden de magnitud (72 a 80 ms) pero con la misma cifra en el control; bruno no los reprodujo con su spec (0 tareas > 50 ms con 500 filas, un worker): son metodologías distintas (su spec cuenta las tareas largas; la mía, el tiempo del cambio hasta el cuadro) y no se contradicen en lo que atribuyen.** Punto cerrado como «no atribuible a la densidad»; el umbral absoluto de 50 ms sigue **sin verificar** sin vecinos (#965).

## Rúbrica de movimiento (`rubrica-movimiento.md`)

| Dimensión | Estado | Evidencia, riesgo y recomendación |
| --- | --- | --- |
| Propósito | No aplica | El cambio de densidad no se anima (density.md §9) |
| Comodidad visual | Cumple (corregido) | **Antes:** la marca de `GTabs` transicionaba su eje cruzado (`block-size` en horizontal, `inline-size` en vertical) 160 ms: al cambiar la densidad el grosor del subrayado o el alto de la píldora se deslizaba mientras todo lo demás saltaba (medido: 2,02 px a mitad de 3 → 2). **Ahora:** solo los bordes `--_tabs-s/-e` (estiramiento T1). En una fila las pestañas comparten alto, así que cambiar de pestaña no cambiaba ese tamaño: no se pierde nada (21/21 de las specs de personalidad de pestañas) |
| Estabilidad | Cumple | El contenido se reordena en el mismo cuadro; el foco no se pierde |
| Interrumpible / control | No aplica | Sin animación |
| Accesibilidad | Cumple | `prefers-reduced-motion` da el mismo resultado; 44/16 px intactos; P2 en táctil |
| Rendimiento | Cumple con límite | Un observador; el coste medido es el del reflujo (nota 10.13) |

## Auditoría posterior (`auditoria-visual.md`)

Jerarquía y alineación: en compact y comfortable los juegos conservan su estructura; etiquetas, campos y acciones siguen alineados (captura del banco). Espaciado: separaciones × 0,875 · × 0,75 coherentes entre campos, formulario, pila y tabla, sin huecos compactos entre dianas de 44 en táctil (P2). Contraste: sin cambio (no se toca color; en oscuro, región = prop). Estados, carga, vacío y error: sin cambio. Consistencia: un solo token; el patrón de la zona de marca. Consola limpia en el banco.

## Peso (`density.md` §11, gzip -9, `dist/` de 08ffaa8 frente a ec848d9)

| Salida | Antes | Después | Δ | Tope |
| --- | --- | --- | --- | --- |
| `grana.css` | 103 785 | 103 046 | **−739** | ≤ +256 (bajó, lo esperado; re-medido) |
| `grana.js` (bruno, final ec848d9) | 223 285 | 223 871 | **+586** | ≤ +768: **dentro** (antes de la reducción de bruno medí +1 233) |
| `time-field.js` · `slider.js` · `file-field.js` | | | +95 · +134 · +80 | ≤ +256 |
| `speech.js` · `status.js` · `form-fold.js` | | | +19 · +15 · +14 | ≤ +256 |
| resto de entradas, `utilities.css` | | | 0 | |

## Auditoría visual de los blocks (criterio 18; `node design/lab/density/auditoria-blocks.mjs`, antes/después del banco `packages/blocks/playground`)

Misma página y mismos datos con el `dist/` de 08ffaa8 y con el actual (el `dist/` de blocks no cambió). Escritorio 1280 con puntero fino; teléfono 390 con puntero grueso (`isMobile`, `hasTouch`). Letra mínima 12 o más en todos, antes y después; sin errores de consola.

| Block (variante) | Escritorio | Teléfono | Veredicto |
| --- | --- | --- | --- |
| `GbProductCard03` | alto 473,1 → 473,1; control mínimo 40 → 40 (el block fija el tamaño) | alto 461,3 → 457,3; «Elegir opciones» 28 → 24 visibles (área 44 por `::after`) | Coherente en escritorio. **Regresión leve en teléfono** (28 → 24 por la prop explícita). Corregido (b9f1b95): región `data-g-density="compact"` en lugar de la prop; en teléfono vuelve a 36/28 px, escritorio sin cambio |
| `GbConfirmation03` | alto 436,4 → 411,4; botones de contacto 36 → 27, `sm` 28 → 24 | alto 544,4 → 507,4; contacto 36 → 27, «Añadir al calendario» y «Compartir» 28 → 24 | Escritorio coherente (el block quería ser compacto). **Regresión en teléfono**: son las acciones principales (WhatsApp, llamar, correo) y bajan un 25 % de caja visible; cumplen 24 pero no cedieron al dedo. Corregido (b9f1b95): región `data-g-density="compact"` en lugar de la prop; en teléfono vuelve a 36/28 px, escritorio sin cambio |
| `GbCart` 01 y 02 (líneas `GCard compact`) | alto 877 → 873 y 1321 → 1317 | 1768 → 1768 | Coherente: −4 px de reflujo. «Quitar» (`link` `sm`) mide **22 antes y después**; su `::after` da 24 en escritorio y 44 en teléfono (medido), así que el objetivo cumple; la caja visible de 22 es previa y ajena a la pieza |
| `GbCart` 03 (cajón) | no medible: cerrado hasta el disparador | idem | **No verificado** |
| `GbProductGrid02` | Región `data-g-density="compact"` (b9f1b95): sin cambio | Región `data-g-density="compact"` (b9f1b95): vuelve a 36/28 px | Sin cifras antes/después en esta tabla; el cambio es de región, no de prop |
| `GbOfferList03` | 530 → 530; «Ver N fotos» 22 → 22 | 1056 → 1052; 42 → 42 | Coherente (el `GBtn` ya era compacto por su tamaño) |
| `GbOrderHistory03` | 980 → 980; 24 → 24 | 1064 → 1064; 24 → 24 | Coherente, sin cambio |
| `GbTrust01` | 280 → 280; enlace 22 → 22 | 664 → 664 | Coherente, sin cambio (enlace de 22 previo; su `::after` no medido) |
| `GbCategoryPreviews02` y `03` | 296 → 296 y 623 → 623; 36 → 36 | 786 → 786 y 703 → 703 | Coherente, sin cambio |

**Regresiones y corrección (cerrada en b9f1b95).** Las dos son del mismo mecanismo (L6, ya aceptado como límite): la prop `density` de `GCard` es una región que **no cede al dedo**. Aplicada la corrección propuesta: `GbConfirmation03`, `GbProductCard03` y `GbProductGrid02` pasan `data-g-density="compact"` a la raíz del `GCard` en lugar de `density="compact"`. En teléfono vuelven a 36/28 px; en escritorio no cambia. `GbProductGrid02` se corrige por la forma compartida `ProductCard.js`. Lo medido antes de la corrección (con la clase de la prop quitada y `data-g-density="compact"` como región): `GbConfirmation03` en teléfono 36/28, alto 558 frente a 544 antes; escritorio 27/24, 411.

## Correcciones de esta auditoría

1. `GTabs.css`: la marca deja de transicionar `block-size`/`inline-size` (e33b57e).

## Cumplimientos / Correcciones / Pendientes

**Cumplimientos:** criterios 1 a 18 en lo que mide CSS y forma, 142/142 en Chromium; Δ0 por defecto salvo el cambio esperado de §3.5; `grana.css` −739 B.

**Correcciones:** la marca de `GTabs` animaba el cambio de densidad (corregido).

**Pendientes:**
- **Cerrado (bruno, medición directa en Chromium):** la marca de `GTabs` ya no desliza sus bordes 160 ms al cambiar la densidad. Resuelto en b9f1b95 / ec848d9: la época sube en una microtarea; en la microtarea del cambio la marca ya coincide con la pestaña en x y ancho, se mantiene en los cuadros 1 a 5 y a los 700 ms; `document.getAnimations()` sobre la marca da `[]`. Control: cambiar de pestaña sí crea transiciones.
- **Cerrado:** `grana.js` +586 B gzip tras el cierre de bruno, dentro del tope de +768; los 79 ms de 10.13 no son atribuibles a la densidad (véase la nota).
- **bruno:** `tests/density.spec.mjs` (sin commit): el criterio 6 mide el item del menú durante la entrada con escala (26,49/25,92; medido quieto da 27 = 27); el 13 importa `@vue/server-renderer/index.mjs`, que no existe (usar `import { renderToString } from '@vue/server-renderer'`). El CLI emite la regla de densidad antes del bloque de color y no «después del `:root` de tokens que no son de color» (§6): da igual para la cascada, pero no es el orden del contrato.
- **Cerrado (bruno, blocks, b9f1b95):** `GbConfirmation03`, `GbProductCard03` y `GbProductGrid02` usan `data-g-density="compact"` en la raíz del `GCard` en lugar de `density="compact"`. En teléfono vuelven a 36/28 px; en escritorio sin cambio. `GbProductGrid02` se corrige también por `ProductCard.js`.
- **Fuera de la pieza:** «Quitar» de las líneas de `GbCart` mide 22 px de alto antes y después (no es de esta pieza; para el dueño del block).
- **No verificado:** Firefox y WebKit (solo hay Chromium), tareas largas sin vecinos, SSR de una aplicación real, tableta que cambia de puntero en caliente, lector de pantalla, `GResourceList` (sin `.vue`).
