# Auditoría de coco · captura de voz, Fase 2 (paso 5)

**Componentes:** `GTranscript` (con `TranscriptRow`, `TranscriptCells`, `TranscriptSpeakers`, `TranscriptInsert`), `createTranscript`, `useSpeechTarget` y los cambios F2 de `GSpeechHost` (panel con `GTranscript compact`, «Revisar», diálogo de respaldo `g-speech-review`) reales de bruno (52f517b..55aba85, más 3bade08 y 3306ec0 con #262 a #264), con el CSS de coco (f3ee87c; `estilo.md` «Fase 2») y `dist/` reconstruido (`npm run build`). Contrato `design/contracts/speech.md` §20 a §32 reconciliado por lima hasta #264.
**Método:** `node design/lab/speech/auditoria-f2-verificar.mjs` (Playwright de `design/lab/theme-playground`; servidor del playground en 4173 o uno propio; Vue servido desde `node_modules`). Sobre el **playground real** (`/playground/?speech=self#sec-speech`, adaptador simulado capturando por sí mismo): la **revisión en la página** junto al `GForm` real (`#sp-review`, con provisional), el **panel compacto** con provisional, el **transcript guardado sin sesión** (`#sp-saved`, también con 320 fragmentos), el **diálogo de respaldo** abierto desde «Revisar» con la revisión de la página desactivada, y una **vista de auditoría** montada en la misma página con el `GTranscript` real (`GranaSpeech.GTranscript`, el gestor del playground para textos, roles y destinos) sobre un transcript con todos los estados de fila: corregido con «Mostrar cambios», hablante cambiado, eliminado, «Usado en», «Cambió después de insertarlo» **sobre fila seleccionada**, fallido, «Sin asignar», 13 hablantes (para `cat-1` a `cat-12` y uno sin color), gestor de hablantes abierto y editor abierto. Contraste **compuesto** (color de cada parte sobre su fondo efectivo, alfa incluida). Temas: **defecto**, **spotify** (acento pálido `#A7F3C1`) y **lustre** (generados), y los tres **con categorías** de `temas-f2/` con `speakerColors` igual a sus categorías (`spotify-cat6` → 6, `default-cat12` → 12, `lustre-cat8` → 8), claro y oscuro, en Chromium; defecto, spotify y `spotify-cat6` en Firefox y WebKit. Además: foco y parada única con 320 filas, edición en la celda durante la captura, Esc en editor y menús dentro del panel y del diálogo, «Más» y apilado en el umbral, compacto, «Revisar», inserción en el `GForm` real, anuncios, regiones vivas, 320×640 (táctil en Chromium y WebKit) en LTR y RTL, RTL y `flip-rtl`, movimiento reducido y normal, `forced-colors` y `prefers-contrast: more` (Chromium), objetivos 24/44px, rendimiento de la selección masiva, consola y revisión estática de `.vue`/`.js`/`.css`.

**Resultado: 27 705 / 27 709** comprobaciones correctas en los tres motores (Chromium ≈ 13 800, Firefox y WebKit ≈ 6 960 cada uno; el número exacto varía unas pocas medidas con los fragmentos provisionales que llegan durante cada sesión), tras corregir `GTranscript.css` (hallazgos 1 y 2). Los 4 fallos que quedan son los hallazgos 3 (Firefox) y 4 (los tres motores), de bruno y no bloqueantes.

## Veredicto: aprobada. Dos defectos de CSS corregidos; dos de `.vue` pendientes de bruno, ninguno bloqueante; `status: "candidate"` en `GTranscript.meta.json`

### Contraste (mínimo de todas las piezas visibles, temas, modos y motores)

| Medida (umbral) | Mínimo | Dónde |
| --- | --- | --- |
| Texto confirmado, hablante (4.5) | 12.82 | defecto oscuro |
| **Provisional** en la página y en el panel compacto (4.5) | 7.38 | spotify claro |
| Eliminado (tachado), contador, ayuda de teclado, ayudas del editor y del gestor, rótulo de la vista previa (4.5) | 7.38 | spotify claro |
| Hora (4.5) · original (4.5) | 6.49 · 6.87 | lustre claro · spotify claro |
| Marcas («Corregido», «Usado en», «Eliminado»…) (4.5) · sus iconos (3) | 4.54 · 3.83 | defecto oscuro |
| «Cambió después de insertarlo» **sobre fila seleccionada**: texto (4.5) · icono (3) | 12.82 · 3.83 | defecto oscuro (#260: texto en `text`, icono en `warning-text`) |
| `<del>` · `<ins>` (4.5) | 4.53 · 4.51 | defecto oscuro |
| Letra de la marca (4.5) · con `cat-k` (4.5) | 15.22 · **4.51** | defecto oscuro · spotify-cat6 oscuro |
| Borde de la marca (3) · sobre fila seleccionada (3) | 3.19 · **3.01** | defecto claro · lustre claro |
| Borde de la marca `cat-k` (3) · sobre fila seleccionada (3) | 4.51 · 3.82 | lustre-cat8 oscuro · default-cat12 oscuro |
| Borde «Sin asignar» (discontinuo) (3) · borde «Provisional» (3) | 3.43 · 3.43 | spotify claro |
| **Borde de la fila seleccionada** sobre la fila · fuera (3) | 12.82 · 15.22 | defecto oscuro |
| Anillo de foco de celda sobre una fila · sobre una fila seleccionada (3) | 4.58 · 3.86 | defecto oscuro |
| Texto de botones (4.5) · borde `outline` (3) · iconos de botón (3) | 4.62 · 3.43 · 3.89 | defecto oscuro · spotify claro · defecto oscuro |
| «Revisar» del panel: texto (4.5) · icono (3) | 15.22 · 15.22 | defecto oscuro |
| Borde del editor (3) · marca de fallido (3) | 4.58 · 4.54 | defecto oscuro |
| Casilla sin marcar: borde (3) · marcada: marca sobre el relleno (3) | 3.19 · 9.45 | defecto claro · spotify claro |
| Títulos del gestor y de la inserción, vista previa, usos (4.5) | 15.22 | defecto oscuro |

Los mínimos de Firefox y WebKit (defecto, spotify y spotify-cat6) coinciden con los de Chromium. Además, en cada tema y modo: `data-cat="k"` **solo** en las marcas con `k ≤ speakerColors` (13 hablantes: con 12 categorías el 13.º va sin color; sin `speakerColors`, ninguna), y «Sin asignar» con `is-unassigned` y **sin letra**.

### Pruebas por comportamiento (Chromium, Firefox y WebKit salvo indicación)

| Prueba | Resultado |
| --- | --- |
| `<del>`/`<ins>` por forma | `<del>` solo tachado y `<ins>` solo subrayado, de ≥ 2px, cada uno con su envoltura oculta; eliminado tachado; «Mostrar cambios» con `aria-pressed="true"` |
| «Más» y apilado (`space × 160`, #258) | Con la vista a 638px (umbral 640px con `--g-space-1: 4px`): `data-narrow`, «Más», fila apilada y «Copiar» fuera de la barra; a 642px nada de eso. «Más» abierto: 4 elementos (Copiar ×2, «Mostrar cambios» como `menuitemcheckbox`, «Hablantes»); Esc vuelve a su botón |
| Una parada y foco con 320 filas | Tras 19 teclas (↑ ↓ ← → Inicio Fin RePág AvPág Ctrl+Inicio/Fin) siempre **un** `tabindex="0"`; el enfocado con `:focus-visible`, anillo sólido de 2px, **dentro del área desplazable** con el anillo incluido y sin tapar (`elementFromPoint`). Menú de acciones: Intro lo abre, Esc vuelve al botón y sigue una parada. En **Firefox**, ver hallazgo 3 |
| Edición en la celda sin pisar provisionales | En `#sp-review` durante la captura: F2 abre el editor; con 2 confirmados y ≥ 3 provisionales llegando, el `textarea` conserva el foco, el borrador y el cursor; una parada. Esc cancela sin guardar y vuelve a la celda; Intro reabre; Intro guarda y vuelve a la celda con foco visible |
| Panel compacto | `data-compact`, sin columna de selección, ayuda de teclado oculta, área desplazable ≥ su mínimo, sin desbordamiento, «Revisar» con icono. Esc en su editor y Esc en un menú de fila **no cierran el panel** (el menú vuelve a su botón) |
| «Revisar» con superficie | Cierra el panel y lleva el foco a `#sp-rv-title`, a la vista |
| Diálogo de respaldo | Modal, `g-speech-review` + `g-dialog--size-lg` + `g-dialog--mobile-fullscreen`, canales del anfitrión **dentro**, foco al título, `GTranscript` editable con destinos. Esc en el editor y Esc en un menú de fila no lo cierran; Esc en la rejilla sí: canales de vuelta al `body`, sesión viva, foco a la pill visible («Revisar» ya no existe: el panel se cerró) |
| Inserción en el `GForm` real | Vista previa con `tabindex="0"`, `role="region"` y rótulo, no viva. «Insertar en Plan» (pestaña desmontada) con el teclado: el foco **se queda** en el botón y visible, `spForm.plan` recibe el texto, cada fragmento usado lleva «Usado en Plan» y el resultado «Insertado en Plan…». «Deshacer inserción»: Plan vacío y sin marcas |
| Transcript guardado sin sesión | Una región `g-transcript__live` `role="status"` propia; contraste medido en los tres modos de tema |
| Regiones vivas | Con 320 filas: **0** `g-btn__status` (#257), **0** `role="status"`/`alert` y **0** `aria-live` en la rejilla (#262, casillas con `field: false`). Dentro de la sesión, ninguna región propia en la revisión ni en el panel (canales del anfitrión) |
| Anuncios sin texto transcrito | Un `MutationObserver` anotó todos los textos de los canales del anfitrión y de las regiones propias durante una sesión con edición, guardado, inserción y deshacer: ninguno contiene una frase del transcript (literal ni corregido); ningún texto en otra región viva de las vistas |
| 320×640 (táctil salvo Firefox), LTR y RTL | Sin desbordamiento horizontal en página, vistas, filas, inserción, hoja del panel con el compacto, diálogo y menú «Más» (dentro del visor). Filas apiladas con el texto a todo el ancho y «Más». Diálogo de respaldo a pantalla completa (320×640) y apilado. Con `pointer: coarse` todos los objetivos ≥ 44px sin pisarse (tras el hallazgo 1) |
| RTL | → lleva a la columna anterior; `flip-rtl` (`scale: -1 1`) en Deshacer, Rehacer y «Deshacer inserción» (#261, #263); marca de selección a la derecha y acciones a la izquierda |
| Movimiento | Con `prefers-reduced-motion`: chevron de «Más» sin transición. Sin preferencia: el chevron gira. En los dos: filas y casillas de la rejilla **sin fundidos**, solo el anillo de foco de la casilla (hallazgo 2) |
| `forced-colors` (Chromium, emulado) | Borde de la fila seleccionada y anillo de foco de celda en `Highlight` (2px, sólido); marca `cat-k` con borde sólido; «Sin asignar» discontinua; `del`/`ins`, fallido (discontinuo) y eliminado por forma |
| `prefers-contrast: more` (Chromium) | Hora, eliminado y ayuda de teclado a `text`; borde del área desplazable a `border-control` |
| Objetivos con ratón | Todos los `GBtn` y casillas de las vistas ≥ 24px |
| `.vue`, `.js` y `.css` | `GTranscript.vue`, `TranscriptRow.vue`, `TranscriptCells.vue`, `TranscriptSpeakers.vue`, `TranscriptInsert.vue`, `transcript.js`, `targets.js`, `labels.js`, `review.js`, los de `GSpeechHost` y `src/speech.js`: **sin `<style>`** y sin literales de color ni de medida. `GTranscript.css`: sin literales ni respaldos fuera del patrón de texto oculto |
| Consola | Sin errores ni avisos de Vue o de Grana en ninguna página |

### Rendimiento: transiciones de la rejilla (recomendación de bruno)

Medido en el playground con 320 fragmentos (`#sp-saved`), 6–8 repeticiones por medida, Chromium con `Performance.getMetrics` (`RecalcStyleDuration`) y Event Timing en los tres motores:

| Chromium, sin preferencia de movimiento | Con fundidos (antes) | Sin fundidos en la rejilla (ahora) |
| --- | --- | --- |
| Ctrl+A ida y vuelta: estilo (mediana) | **150 ms** | **33–36 ms** |
| Ctrl+A: Event Timing (mediana · máx) | 72 · 88 ms | 40–48 · 48–72 ms |
| Una casilla con Espacio: estilo · Event Timing | 10–12 · 24–32 ms | 12–13 · 24–32 ms |
| Una casilla con clic: estilo · Event Timing | 14 · 56 ms | 13–14 · 56 ms |

- **Confirmado para la selección masiva** (Ctrl+A, «Seleccionar todo», rangos): las transiciones declaradas de fila (`background-color`) y de casilla (`background-color`, `border-color`, `scale` del cuadro y `clip-path` de la marca) cuestan ~115 ms de estilo repartidos en los fotogramas de los tramos. Con movimiento reducido (que ya quitaba escala y trazo) 107 → 34 ms: el coste está en los fundidos de color, no solo en el movimiento.
- **No reproducido para una casilla sola**: 6 ms sin transición frente a 48 ms con ella (cifra de bruno) no aparece; una casilla cuesta lo mismo con y sin fundidos (≈ 12 ms de estilo). El coste es proporcional a las filas que cambian.
- **Firefox:** sin diferencia medible (Ctrl+A 32 ms en los dos casos). **WebKit:** Ctrl+A 104–112 ms en los dos; el clic de una casilla oscila entre 80 y 208 ms en ambas variantes (pintado del motor sin cabeza, no de las transiciones).
- **Aplicado en `GTranscript.css`** (sin tocar `GCheckbox.css`): dentro de `.g-transcript__grid`, la fila y la casilla cambian sin fundido; se conserva solo la apertura del anillo de foco de la casilla (`outline-color` y `outline-offset`, una casilla a la vez, sin coste medible: 36 ms frente a 35 ms), y con `prefers-reduced-motion` solo `outline-color`, como el movimiento reducido de `GCheckbox`. Fuera de la rejilla («Seleccionar todo» de la barra, «Con hablantes») `GCheckbox` no cambia.

### Suites de bruno con el CSS corregido

`npx vitest run` en `packages/vue`: 1603 / 1603. Playwright en `design/lab/theme-playground` (`GRANA_PW_PORT=4208`): 243 pruebas, 234 pasan y 9 se omiten por diseño. Compuerta de rendimiento (`speech-f2-perf.spec.mjs --workers=1`): Chromium 48 ms (1000 fragmentos: 104 ms), Firefox 32 ms (56 ms), WebKit 120 y 128 ms (576 ms) en dos pasadas; una primera pasada de WebKit con la máquina cargada dio 408 ms y no se repitió (el reloj de Event Timing salta con carga, #264).

## Hallazgos

| # | Severidad | Dueño | Hallazgo y resolución |
| --- | --- | --- | --- |
| 1 | **Mayor, corregido** | coco (`GTranscript.css`) | **La casilla de fila no llenaba su columna táctil**: con `pointer: coarse` la columna medía 44px pero la `<label>` de `GCheckbox` (la zona que se puede pulsar) medía **32 × 44** y el cuadro iba **12px a la izquierda** del centro (el `__text` vacío de la casilla, `flex: 1 1 auto`, ocupaba el resto). Con ratón, 32 × 28 con el cuadro desplazado 4px. Contra la regla de 44px táctil del proyecto. **Corregido:** la casilla ocupa toda la columna (`inline-size: 100%`), su fila centra el cuadro sin hueco y el texto vacío no crece: **44 × 44** táctil y **28 × 28** con ratón, cuadro centrado (desviación 0) en los tres motores; pulsar en el borde de la columna marca la fila |
| 2 | Rendimiento, corregido | coco (`GTranscript.css`) | Recomendación de bruno confirmada para la selección masiva (tabla de arriba): fundidos de fila y casilla quitados **dentro de la rejilla**; Ctrl+A con 320 filas pasa de 150 a 35 ms de estilo en Chromium. `GCheckbox.css` no cambia |
| 3 | **Mayor, no bloqueante** | bruno (`GTranscript.vue`) | **Firefox: el área desplazable es una parada de tabulación más.** Firefox hace enfocables con el teclado los contenedores con desbordamiento (`.g-transcript__scroll`, con `maxHeight`), así que Tab desde la barra cae primero en el contenedor y solo el segundo Tab entra en la rejilla (con 6 y con 320 filas). Chromium y WebKit no lo hacen (Chromium solo cuando el contenedor no tiene descendientes enfocables). Contradice §22.4 («no es tabulable») y §22.11 (una parada). **Arreglo propuesto:** `tabindex="-1"` en `__scroll` (editable/solo selección y solo lectura; en solo lectura la `<ol>` ya es la parada). No bloquea: la rejilla sigue siendo alcanzable y operable con el teclado |
| 4 | Menor | bruno (`GTranscript.vue`) | **Cambiar de transcript pinta «N fragmentos nuevos · Ir al final».** Al pasar `#sp-saved` de la guardada (6) a 320 fragmentos aparece «314 fragmentos nuevos · Ir al final»: el vigilante de `segments.length` compara recuentos de **dos transcripts distintos** y el reinicio de `newer` del vigilante de `tx` llega antes. §22.1 (cambiar `transcript` vacía la vista) y §22.7 («N nuevos» solo por fragmentos que llegan). En los tres motores |
| 5 | Informativo | bruno (`GTranscript.meta.json`) | En «pending» quedan dos entradas resueltas por esta auditoría: «Auditoría de coco (paso 5)» y «coco: las transiciones de GCheckbox…» (hallazgo 2). coco solo cambia `status`; bruno puede quitarlas y añadir el hallazgo 2 a «verified» en su próxima entrega |
| 6 | Informativo | lima | Márgenes estrechos (pasan): borde de la marca de letra sobre **fila seleccionada** 3.01 (lustre claro; `border-control` sobre `primary-soft`), `<ins>` 4.51 y letra `cat-k` 4.51 (spotify-cat6 oscuro). Sin cambio; si un tema futuro baja `border-control`, la marca sobre la fila seleccionada es la primera en caer |
| 7 | Informativo | lima | El **relleno de una casilla marcada** frente a la página baja a **1.55** con un `primary` pálido (lustre claro; 1.9 en spotify claro). El estado lo lleva la marca sobre el relleno (≥ 9.45), como mide la auditoría de `GCheckbox`, así que cumple WCAG 1.4.11; es de `GCheckbox` en todos sus usos, no de la F2. Que conste en `tokens.md` junto a la regla de #228 si se quiere dejar escrito |
| 8 | Informativo | coco (verificación) | **Firefox** no pinta `:focus-visible` en un foco puesto por script si la última interacción fue con el ratón (como el hallazgo 2 de la F1): la prueba llega a «Insertar en Plan» con Mayús+Tab y Tab. **WebKit** no tabula a botones (ajuste de macOS): ahí el foco se pone por script, como en `speech-f2.spec.mjs` |

## Sin ejecutar

- **Lector de pantalla real** (VoiceOver, NVDA, JAWS, TalkBack): la rejilla en modo foco y la lectura de corrido, `aria-selected` + casilla, `<del>`/`<ins>` con su envoltura, el editor dentro de la celda, el anuncio de la selección masiva y el traslado de canales al diálogo de respaldo. Riesgo principal.
- **Safari real**, **móvil real** (selección táctil con asas, teclado virtual con el editor en la hoja o el diálogo), **IME** y teclados no QWERTY; `forced-colors` real de Windows; `prefers-contrast` en Firefox y WebKit (solo Chromium los emula).
- **Zoom 200 %** sobre los componentes reales: lo cubrió el banco de estilo (640×450, `estilo-verificar-f2.mjs`); aquí solo 320×640.
- **Portapapeles real** en Firefox y WebKit (lo cubre bruno en Chromium en `speech-f2.spec.mjs`).

## Seguimiento

Hallazgos 3, 4 y 5 cerrados por bruno (commit d60d60b): `tabindex="-1"` en `.g-transcript__scroll`, vigilante reiniciado al cambiar de transcript y `meta.json` al día. Re-verificación con `node design/lab/speech/auditoria-f2-verificar.mjs` sobre `dist` reconstruido: **27 708 / 27 708** en Chromium, Firefox y WebKit. Ctrl+A con 320 filas en Chromium: estilo mediana 33 ms (máx 36), Event Timing mediana 40 ms (máx 48).
