# Tabla única de movimiento · auditoría posterior (coco)

**Estado auditado:** `bd413f09` (CSS `f749d655`, `.vue`, compuerta y spec de bruno) más la corrección de `GToast.css` de esta auditoría, con un `dist/` propio en un `git worktree` aislado (Node 22), sin `GBtn` a medias ni reconstrucciones a mitad de pasada.
**Contrato:** `design/contracts/motion.json`, `tokens.md` §29.9 y §29.10, `api.md` «Una sola luz», #1002 a #1009. #1008 está cerrada: el anillo conserva el fundido.
**Fuera de esta auditoría:** el recorrido y la luz de `GCombobox` (#1017, #1018), que llegaron después de `bd413f09` (`5d29b1a7`, `85083171`). **`GCombobox` queda pendiente de auditar:** lo que sigue describe la versión anterior.

**Resultado:** sin defecto bloqueante en lo auditado. Queda **una decisión abierta para lima y el usuario** (H1: la salida cumple la tabla y aun así se ve brusca) y un hallazgo para quien remata `GCombobox` (H2).

## 1. Pasada de cierre

| Qué | Chromium | Firefox | WebKit |
| --- | --- | --- | --- |
| 14 grupos de specs (918 pruebas, 306 por motor), `--workers=2`, 1,2 h con la máquina cargada | 3 fallos | 0 fallos | 7 fallos |
| Los 10 fallos, repetidos solos con `--workers=1` | 1 sigue, y falla además `personalidad-menu-links:168`, que había pasado | · | 2 siguen, y falla además `personalidad-menu-links:108`, que había pasado |
| `node design/lab/movimiento/auditoria-verificar.mjs` (nuevo) | **196/196** | **114/114** | **114/114** |

Total de la pasada: **870 pasan, 38 omitidas, 10 fallan**. Las omisiones no se desglosan por motor; las de `movimiento.spec.mjs` son por diseño (#1005 solo en Chromium, rendimiento solo con un worker).

`movimiento.spec.mjs`: **sin fallos en los tres motores**, ya sin `test.fail`. Specs: `movimiento`, `personalidad-menu*`, `panel-estable`, `combobox*`, `personalidad-combobox*`, `personalidad-table-glide`, `personalidad-sidebar-glide`, `table-rows`, `datepicker-lectura`, `library`, `limitaciones`, `campo-tactil`, `card-group`, `status`.

| Otras comprobaciones | Resultado |
| --- | --- |
| `node packages/vue/scripts/check-motion.mjs` | 82 hojas, 83 componentes, 7 reglas, **0 fallos** |
| `node design/lab/select/estilo-luz-verificar.mjs` | **62/62** en los tres motores |
| Rendimiento, Chromium, `--workers=1` (`movimiento`, `glide-perf`, `combobox-multiple-perf`) | **10/10** |
| `tooltip.spec.mjs` (por el dato de `medir`, abajo), Chromium | **30/30** |
| `npx vitest run` en `packages/vue` | **4274/4274**, 157 archivos |
| `bash .github/scripts/gates.sh` | **159/159** |
| Peso, `gzip -9` | `grana.css` **104 492 → 104 492 B (Δ0)**; `grana.js` 225 014 y `combobox.js` 21 936, sin cambios. Margen de #1009: 45 B intactos |

### Los 10 fallos

| Prueba | Motor | Solo, `--workers=1` | En `f34b4475` (antes del lote) | Conclusión |
| --- | --- | --- | --- | --- |
| `personalidad-menu-links:108` (Ctrl+clic) | Chromium, WebKit | Falla | **Falla igual** | Anterior al lote. La región viva dice «3 muestras. Lote cargado. Panel actualizado.» en vez de «Ajustes abierta en otra pestaña» |
| `personalidad-menu-links:168` (Ctrl+C) | WebKit | Falla | **Falla igual** | Anterior al lote |
| `table-rows:141` (Meta+clic) | WebKit | Falla | **Falla igual** | Anterior al lote |
| `combobox-forma:166`, `combobox:89/140/207`, `personalidad-combobox-multiple:49`, `personalidad-table-glide:32` | Chromium o WebKit | **Pasan** | No hizo falta | Carga de la máquina |

`personalidad-menu-links:168` en Chromium es inestable, no regresión: pasó en la pasada, falló una vez solo, y con `--repeat-each=6` dio 6/6 en `bd413f09` y 0/6 en `f34b4475`. Depende de lo que haya en la región viva del playground. Los 4 fallos de `blocks-ecommerce` no entran en esta selección.

### `medir.mjs` frente al `medir.json` inicial (ms; D desplaza, E escala)

| Pieza | Antes (Cr / Fx / Wk) | Ahora (Cr / Fx / Wk) | Tabla |
| --- | --- | --- | --- |
| `GSelect` abrir | 157 D / 158 D / 258 D | 169 D / 163 D / 162 D | `press`, D |
| `GSelect` cerrar | 116 / 0 / 0 | 118 / 0 / 0 | `fast`; D2 · A |
| `GMenu` abrir | 113 E / 114 E / 125 E | 164 D / 170 D / 160 D | **Pierde la escala**, entra en `press` |
| `GMenu` cerrar | 100 / 117 / 125 | 100 / 112 / 117 | `fast` |
| `GHelper` abrir | 116 / 113 / 124, sin D | 166 D / 159 D / 173 D | **Gana desplazamiento y `press`** |
| `GHelper` cerrar | 0 / 0 / 0 | 117 / 0 / 0 | **Gana salida** en Chromium |
| `GDatePicker` abrir / cerrar | 167 / 111 (Cr) | 163 / 113 (Cr) | Sin cambio |
| `GCombobox` cerrar | 0 / 0 / 0 | 115 / 0 / 0 | **Gana salida** en Chromium |
| `GCombobox` abrir, reducido | 0 / 0 / 0 | 133 / 133 / 132 | **Gana fundido**, como pedía §2 de la tabla |
| Recorrer `GSelect`: anillo con puntero | Sí / Sí / Sí | **No / No / No** | Corregido |
| Recorrer `GMenu` | 150 ms, 11 estados | 150 ms, 11 estados | Sin cambio |

Tres filas de `medir` no son medida del lote: `GMenu` cerrar da 112 y 117 ms en Firefox y WebKit, pero son **2 cambios, no un fundido** (desaparece en el acto y otra propiedad cambia al acabar; la spec lo confirma instantáneo, como antes); `GTooltip` cerrar pasa de 117 a 265 ms en Chromium, pero da **265 también en `f34b4475`** y nadie ha tocado `GTooltip` (`tooltip.spec` 30/30); y `GDialog` da 0 porque el selector del banco no lo encuentra (el diálogo lo mide la spec). Resultados completos: `medir-cierre.json` y `medir-reducido-cierre.json`.

## 2. Lo que quedó sin comprobar en el CSS

`auditoria-verificar.mjs`, sobre los componentes reales (`auditoria-resultados.json`).

**Luz de `GSelect`, tres motores salvo donde se dice:**

| Comprobación | Resultado |
| --- | --- |
| Marca visible | Luz sobre la activa, Δ ≤ 1 px, también en capturas claro y oscuro |
| Sin dos a la vez | Barrido de ida y vuelta por 7 filas, 87 a 94 cuadros: 0 fondos por fila, 0 contornos, 1 activa, la luz nunca baja de opacidad 1 |
| Anillo solo tras teclado | Clic: no. Intro: sí. Reabrir con clic después de teclado: no. Flecha tras clic: sí. Escritura rápida: sí |
| Reducido | La luz salta con ≤ 2 estados, sin cuadros intermedios |
| `forced-colors` | Sin capa, contorno sin teclado. Emulado en los tres motores, no en un Windows real |
| Lista larga | Rueda con puntero quieto: se desplaza, la activa no cambia (#358), la luz va con su opción; al mover el puntero, pasa a lo que hay debajo |
| Grupos y «Agregar nuevo» | Coincide en los dos; capa detrás (`z-index: -1`) y primer hijo |
| `options` o ventana que cambian con la lista abierta | Se recoloca, Δ 0 px |
| Hoja móvil | Abre, filas ≥ 44 px, sin contorno, con luz. Tap real en Chromium y WebKit; **en Firefox, clic** (sin `isMobile`). Arrastre táctil real solo en Chromium (CDP): 231 px de desplazamiento y la activa no se mueve |

**Contraste, 12 temas (el de `generated/` más el por defecto), claro y oscuro, Chromium, 24 casos:**

| Par | Mínimo | Máximo | Exige |
| --- | --- | --- | --- |
| Texto sobre la luz | 16,08 | 17,09 | 4,5 |
| Título de grupo que la luz cruza | 6,87 | 9,62 | 4,5 |
| Deshabilitada sobre la luz | 4,70 | 6,96 | Informativo |
| Contorno de foco sobre la luz | 4,19 | 14,71 | 3 |
| **Luz frente a la lista** | **1,08** | **1,12** | Sin mínimo: ver abajo |

La luz es casi invisible como forma (1,08:1), y hasta este lote la activa llevaba además el contorno. Es el token de hover de `GMenu`, `GTable` y `GSidebar`, y quien la mueve con el puntero tiene su cursor; con teclado aparece el contorno (≥ 4,19:1) y la elegida conserva ✓ y peso. **No es defecto**, pero sí un límite: la marca para el puntero es deliberadamente tenue.

**Salida con contenido conservado (Chromium):** `GHelper`, `GFilterBar` y `GCombobox` siguen llenos, sin saltar de lado, mientras se funden (spec #1005, y panel de 30 filas en la auditoría). En los tres motores, al acabar quedan ocultos, vacíos y sin `inert` colgado.

**Reabrir a mitad de salida, a 1 y 3 cuadros, seis paneles, tres motores:** siempre acaba abierto, opaco, no inerte y con su contenido. En Chromium la opacidad da la vuelta desde donde iba, sin saltos (`GSelect`: 1 → 0,475 → 0,185 → 0,413 → 0,699…). En Firefox y WebKit parte de 0, porque la salida fue instantánea.

**Junta campo-panel de `GCombobox`, panel lleno (30 filas), arriba y abajo, tres motores:** mismo borde y mismo ancho (Δ 0), costura 1 px. Al fundirse, la forma no se mueve y el campo recupera su contorno en el acto.

**Entrada desde el lado del disparador:** `GSelect`, `GMenu`, `GHelper`, `GDatePicker` y `GFilterBar`, arriba y abajo, LTR y RTL, tres motores: lado correcto, desplazamiento ≤ `space × 1`.

**`GDatePicker`:** hover por los días, con y sin reducido, tres motores: como mucho 1 día marcado.
**`GTable`:** detalle en `slow` + `ease-out`, chevron y contenido en `fast`, sin muelle; reducido sin transición de altura, tres motores.
**`GFilterBar`:** entrada, salida y lado, tres motores.

## 3. Hallazgos de bruno

**`GToast.css`: corregido.** La entrada reducida iba en `press`; ahora `fast`, como pide la fila. No hacía falta decisión de lima: `motion.json` es claro y el aviso con reducido no se desplaza, así que no hay nada que acompasar. Quitado el `test.fail` de `movimiento.spec.mjs` en este mismo commit. La prueba pasa en los tres motores.

**`GCombobox`, la fila activa funde sin marca al cerrar.** Medido en `bd413f09`: la marca se va en un cuadro con opacidad 1 y el siguiente ya va por 0,47. **Se nota poco, pero el punto queda superado por #1017:** quien lo audite debe repetirlo con la luz nueva, que en `GSelect` sí se queda durante la salida.

**Peso:** Δ0 en `grana.css`.

## 4. «El cierre se ve muy brusco» (usuario)

`salida-suavidad.mjs`, Chromium, mediana de 7, opacidad cuadro a cuadro a 60 Hz, curvas alternativas inyectadas solo en la medida.

| Curva | `GSelect`: ½ / 90 % / fin (ms) | `GCombobox`: ½ / 90 % / fin (ms) | Cuadros visibles | Secuencia de `GSelect` |
| --- | --- | --- | --- | --- |
| **`fast` + `ease-out` (tabla)** | **13 / 47 / 113** | **21 / 54 / 120** | **4** | 1 · 0,48 · 0,18 · 0,07 · 0,02 |
| `fast` + `standard` | 30 / 62 / 113 | 36 / 70 / 120 | 5 | 1 · 0,69 · 0,35 · 0,18 · 0,09 · 0,04 |
| `fast` + `linear` | 66 / 116 / 132 | 72 / 121 / 140 | 7 | 1 · 0,86 · 0,72 · 0,58 · 0,45 · 0,31 · 0,17 · 0,03 |
| `press` + `linear` | 80 / 147 / 164 | 88 / 154 / 173 | 9 | 1 · 0,90 · 0,79 · 0,69 · 0,58 · 0,48… |

**El usuario tiene razón, y la medida lo explica.** El contenido se conserva y la duración es la de la tabla, pero `--g-ease-out` carga casi todo el cambio al principio: la mitad se va en el primer cuadro y el 90 % en unos 47 ms. Es una curva pensada para que algo **llegue** con decisión; aplicada a un fundido de salida, los 120 ms nominales se ven como unos 50. Y en Firefox y WebKit la salida es instantánea (D2 · A), así que ahí es brusca por decisión aceptada.

Es una percepción deducida de la opacidad, no una valoración con ojos humanos. No sé en qué navegador lo vio el usuario.

## 5. Hallazgos por dueño

| # | Dueño | Hallazgo | Bloquea |
| --- | --- | --- | --- |
| H1 | **lima y usuario** | La salida de panel anclado (`fast` + `ease-out`) se ve en ≈ 50 ms. Cumple la tabla: cambiarla es decisión. Recomendación: **`fast` + `linear`** (90 % en 116 ms, sin alargar el cierre y ya es la curva con reducido). `fast` + `standard` es el paso corto. Afecta también a hoja, diálogo y aviso, que comparten la fila. Coste: una palabra por hoja, medir contra los 45 B de margen | No, pero es la queja del usuario |
| H2 | quien remata `GCombobox` | El anillo de la forma se quita en el primer cuadro de la salida mientras el panel aún se ve, y aparece el del campo a la vez: un salto dentro del fundido, sumado a H1. Idea: mantener el anillo mientras `.g-combobox__popup[inert]` y `:focus-visible`. **No tocado**, por encargo; repetir sobre #1017 | No |
| H3 | bruno | 4 fallos anteriores al lote: `personalidad-menu-links:108` (Chromium, WebKit), `:168` (WebKit), `table-rows:141` (WebKit). `:168` además es inestable en Chromium. No se corrigen aquí | No (ajenos) |
| H4 | bruno | `medir.mjs` no encuentra `GDialog` (`.g-dialog`) y da 0 | No |

## 6. Rúbrica de movimiento

Pieza: la tabla aplicada a paneles, listas, plegados y avisos. Web, ratón, teclado y toque, uso muy frecuente, interacción breve.

| Dimensión | Estado | Evidencia | Riesgo | Recomendación |
| --- | --- | --- | --- | --- |
| A · Propósito y utilidad | Cumple | La luz da continuidad entre filas; el lado de entrada dice de dónde viene el panel; 160 ms, sin muelle ni rebote en lo frecuente | Bajo | Mantener |
| B · Comodidad visual y profundidad | Parcial | Texto ≥ 16:1 sobre la luz; ningún doble marcado; la luz es tenue (1,08:1). La salida apenas deja adaptarse (H1) | Bajo | Resolver H1 |
| C · Comodidad y estabilidad | Cumple | Desplazamiento ≤ 4 px, sin escala en paneles; nada oscila; ningún panel salta de lado al fundirse | Bajo | Mantener |
| D · Transiciones y continuidad | Parcial | Reabrir en mitad da la vuelta sin salto y nunca bloquea; `inert` no queda colgado; temporizador cancelado al abrir. Pero el fundido se ve en ≈ 50 ms y en Firefox y WebKit no hay continuidad de salida (D2 · A, aceptado) | Medio | H1; H2 tras #1017 |
| E · Control y expectativas | Cumple | Cerrar no se retrasa; el puntero no mueve el foco en `GSelect`; arrastrar la hoja no cambia la activa | Bajo | Mantener |
| F · Accesibilidad y opcionalidad | Parcial | Reducido sin viaje ni desplazamiento, medido; `forced-colors` con contorno; anillo ≥ 4,19:1; ✓ y peso además del color. **No verificable:** lector de pantalla y `forced-colors` real | Bajo | Probar en entorno real |
| G · Rendimiento | Cumple en Chromium | 10/10 con un worker, 0 tareas largas con 100 opciones. **No verificable** en Firefox y WebKit (`longtask` solo existe en Chromium) y en móvil real | Bajo | Medir en móvil real |
| H · Inmersión | N/A | Sin contenido espacial | · | · |

**Resumen ejecutivo:** la tabla está aplicada y se mide igual en los tres motores: tiempos, lados, reducido y una sola marca cumplen. El lote corrige lo que prometía (anillo con puntero, `GMenu`, salidas de `GHelper` y `GCombobox`). Lo que falla no es la ejecución, sino una celda de la tabla: `ease-out` en una salida.

**Riesgos, por severidad:** (1) salida que se percibe brusca (H1); (2) salto del anillo en `GCombobox` (H2); (3) `GCombobox` sin auditar tras #1017; (4) luz tenue para quien solo usa puntero; (5) lector de pantalla sin probar.

**Prioridades:** primero H1, porque es lo que vio el usuario y son una palabra por hoja; después la auditoría de `GCombobox` con H2.

**Limitaciones:** la percepción se deduce de la opacidad a 60 Hz; `forced-colors` emulado; sin lector de pantalla, Safari real ni dispositivo táctil real; arrastre táctil solo en Chromium; Firefox sin tap en la hoja; temas solo en Chromium; los specs son los afectados, no la suite entera; `auditoria-verificar.mjs` mide `GCombobox` en `bd413f09` y sus casos de fila activa pueden necesitar ajuste tras #1017.

## 7. Auditoría visual

- **Jerarquía y delimitación:** lista, hoja y forma del combobox con contorno ≥ 3:1 sin cambios; capturas claro, oscuro y hoja sin nada que flote.
- **Estados:** hover, foco, activa, elegida y deshabilitada revisados en `GSelect`; carga y vacío sin cambio en este lote.
- **Consistencia:** solo tokens; `check-motion` 0 fallos.
