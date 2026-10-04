# Auditoría de coco · Isla de estado (paso 5)

**Componente:** `GStatusIsland` (+ `StatusList.vue`), `GStatusMark`, `GStatus` y el gestor `createStatus` (bruno, `c45e4cd`), entrada `@grana/vue/status` (`dist/status.umd.js`, global `GranaStatus`); CSS de coco `GStatusIsland.css` y `GStatusMark.css` (`b8cf4e0`, corregido en esta auditoría). Contrato `design/contracts/status.md` (#315 a #328). Prototipo aprobado `design/lab/alert/r02/index.html?c=B`.
**Método:** `node design/lab/alert/auditoria-verificar.mjs` sobre el **playground real** (sección «Isla de estado», `dist/` reconstruido), Chromium, Firefox y WebKit, puerto 4209: **2647/2647** comprobaciones y **6 pendientes del playground** (hallazgo 4, de bruno; se informan aparte y no cuentan). Ocho temas: defecto claro y oscuro, «Tema de prueba» del playground claro y oscuro, `spotify` generado (marca de color) claro y oscuro, y el de esta auditoría `auditoria-tema.css` (`@grana/cli`: brand `#6B2FA3`, radius 4, shape rounded, **space 3**, **fontSize 19**) claro y oscuro. Contraste sobre el compuesto real (capas translúcidas incluidas), con **hover y foco reales** (no leyendo alias). Banco de estilo repetido tras las correcciones: `estilo-verificar.mjs` **2535/2535**.

## Resultado: sin defectos bloqueantes del componente. Tres correcciones en el CSS de coco; `status: "candidate"` en los tres `meta.json`

## Hallazgos

| # | Hallazgo | Severidad | Dueño | Estado |
| --- | --- | --- | --- | --- |
| 1 | **La diana del resumen quedaba por debajo del mínimo.** La forma recorta (`overflow: clip`) y el área no puede salir por un `::after`, así que el CSS hacía crecer la **forma** a 24/44px; pero el `button` del resumen va dentro del borde: con `space` 3 el punto medía 24×24 y el resumen **22×22**; con `pointer: coarse` el punto medía 44×44 y el resumen **42×42**. Mi banco medía la forma, no el botón. Corregido: `--_row` y `--_dot` = `max(24px + 2 bordes, space × N)` (y `44px + 2 bordes` táctil). Medido: auditoría (space 3) punto 26×26 con resumen **24×24**; táctil (Chromium) resumen ≥ 44 en punto y compacta. Con el tema por defecto nada cambia (32 / 48) | Alta (WCAG 2.5.8) | coco | Corregido y verificado |
| 2 | **Pérdida de carácter: el título del aviso perdía la negrita del prototipo.** En B el título va en `<strong>` y la descripción apagada al 82 %; en el real la descripción va en tinta plena (contraste garantizado solo para el par texto/superficie) y el título en `action-weight` (500): título y descripción casi se igualaban. Corregido: título del aviso en `--g-text-title-sm-weight` (token existente, 600). Capturas lado a lado: la jerarquía vuelve a leerse como en B | Media (identidad) | coco; **lima** anota `--g-text-title-sm-weight` en «Tokens consumidos» de `status.md` | Corregido; tabla para lima |
| 3 | **«Ir a…» sin señal de acción.** En B es un enlace subrayado; en el real era un `GBtn` ghost sin borde sobre la isla: se leía como texto. Corregido en CSS: subrayado (grosor `border-width`, separación `focus-offset`) sin cambiar el `GBtn` ni sus props | Media (affordance, identidad) | coco | Corregido |
| 4 | **Playground: la isla replegada tapa controles de la cabecera fija.** A 1280px la compacta cubre «Automático» y «Claro» al 100 % y «Oscuro» al 26 % (el punto, «Automático» al 30 %); a 375px la compacta cubre «Índice» al 78 %. El componente cumple el contrato (límite conocido: la isla no cambia de borde; se evita con `offset`). Arreglo en el playground: `status.configure({ offset: { top } })` con el alto de `.pg-bar` (55px a 1280, 137px a 375; con `ResizeObserver`, porque la cabecera se parte). El aviso de desarrollo 13 no se ve en la UMD (sin `process` no hay avisos de desarrollo; lo cubre vitest) | Media (demo) | **bruno** (`playground/index.html`) | Pendiente; `auditoria-verificar.mjs` lo informa como PENDIENTE |
| 5 | **Vitest: 2 de 2150 fallan en `GStatusIsland.test.js`** («no abre si taparía el elemento en uso… da el toque» línea 340, y «autoOpen: false nunca abre sola (da el toque…)»). Fallan también en `c45e4cd` sin mis cambios (`git stash`) y con Node 22; **pasan si se avanza un cuadro más** (copia temporal con `frames(2)`): con el `requestAnimationFrame` falso, `is-nudge` llega un cuadro después de lo que la prueba espera. El comportamiento es correcto en navegador: el toque real (`is-nudge`, `g-status-nudge` desde 0,86 en 240ms, clase retirada) pasa en los tres motores | Alta para la pasada de cierre; no es defecto del componente | **bruno** (`GStatusIsland.test.js`) | Pendiente |
| 6 | **Morfo del radio en WebKit:** con `getComputedStyle` por cuadro, Chromium y Firefox dan 5–6 radios intermedios (estadio → `radius-xl` con el muelle); WebKit da 2 (la transición existe en `getAnimations`, pero el valor leído no se interpola en la medida). Ancho y alto sí interpolan en WebKit (sobrepaso 3,1–3,3 %). Diferencia de 24 → 16px en el borde de una forma que crece: apenas visible | Baja | coco | No verificado a ojo en Safari real |
| 7 | **Convivencia con el panel de voz por teclado o programa:** con el panel de voz abierto y la isla abierta por `open()` (o `Alt+F8`), los dos se solapan; la isla queda encima. Con puntero, abrir uno cierra el otro (medido en los tres motores). Coincide con el límite conocido de `status.md` | Informativo | — | Límite conocido, medido |
| 8 | **Disclosure «Detalle técnico» sin indicador.** Es un `GBtn` ghost con `aria-expanded`; visualmente es texto plano (B no tenía detalle). Propuesta: un `chevron-down` de la lista de la librería al final del botón (`GLibIcon`); coco lo gira 180° con `aria-expanded="true"` (`--g-duration-fast`, solo con movimiento permitido). Necesita marcado | Baja (affordance) | **bruno** (marcado), luego coco | Propuesta |

## Lo medido (tres motores salvo donde se dice)

| Área | Resultado |
| --- | --- |
| `dist/grana.css` | Declaraciones `g-status-*` sin colores literales, sin `var()` con respaldo, solo `--g-*`/`--_*`, sin `!important`, sin `brand`; medidas literales solo `24px`, `44px`, `0px`, `1px`; `CanvasText`/`Highlight` solo en `forced-colors`; toda `animation` dentro de `no-preference`; la isla va después de `GBtn.css` y `GDialog.css` |
| Marcado real vs CSS | Raíz `popover="manual"` abierta, `data-align`/`position`/`form`/`type`, sin `display` en línea, canales `status` + `alert` fuera de la `section`; `--_island-w/h` enteros; resumen con insignia (`.g-icon` hijo directo), `__sr`, «+N»; panel `__list` + `__foot > __ack`; avisos en orden de gravedad con sus clases de estado; orden insignia → contenido → acciones → descartar; nunca `__actions` vacío; botones con las props de `estilo.md` §5; marca enlace `button` y marca de texto `div > span + p`. Coincide en todo con lo que espera el CSS |
| Tamaño de la forma | = `__inner` (borderBoxSize redondeado hacia arriba) + borde: sobra 0–1px, nunca recorta |
| Contraste (mínimo en 8 temas × 3 motores) | Texto del resumen, «+N», temporizador del resumen, «Entendido», marca enlace y marca de texto **15,22**; título, descripción, enlace, temporizador, acción (texto y borde), «Ir a…», descartar y anillos del aviso **13,02** (spotify oscuro); detalle técnico 10,83; botones fantasma al pasar 9,44 («copiar» 7,46); acción y «Entendido» al pasar (se encienden) 15,22; resumen al pasar (velo) 11,84; icono sobre la insignia **4,81**; marca de texto: icono y anillo **4,52**. Foco: anillo exterior de la isla replegada y de la marca **4,61** sobre la página; anillos interiores 13,02–15,22. Hoja móvil (375 claro y oscuro, 320): todo ≥ 4,5 / 3. La isla nunca se tiñe de `brand` (spotify, auditoría) |
| Tamaños | Defecto: compacta 48, punto 32 (resumen 30), abierta 416; auditoría (space 3): compacta 36, punto 26 (resumen 24), abierta 312; «Tema de prueba» igual que el defecto. Insignia concéntrica con el extremo en compacta y punto (LTR y RTL) |
| Cambio de forma | compacta → abierta, abierta → punto, punto → compacta: intermedios en cada paso, **sobrepaso 3,1–3,7 %**, asienta en 222–245ms; curva `--g-ease-spring` (medido sobre el tamaño de caja, sin la escala del toque que coincide con punto → compacta) |
| Toque | Una condición nueva con la isla visible: `is-nudge`, `g-status-nudge` desde 0,86 en 240ms, clase retirada, sigue compacta |
| Resolver en el sitio | Guardar falla → la isla se abre sola; «Reintentar» → `aria-busy`, `aria-disabled`, insignias girando en el aviso, el resumen y la marca → éxito en el **mismo `li`**, la isla sigue abierta, la forma nunca se oculta (alto 244 → 196, mayor salto entre cuadros 13–24px) |
| Cascada | Fundido + caída por aviso con retardos 0 / 24 / 48 / 72 / 72ms (pie incluido) en 160ms |
| Movimiento reducido | Solo fundidos en curso; la forma salta a su tamaño; `is-nudge` se retira sin `animationend`; reintentando sin giro |
| Más de 6 condiciones | 9 condiciones a 900 y 600px: la lista desplaza cuando no cabe, «Entendido» visible, la isla dentro del visor, `overscroll-behavior: contain` |
| Marcas | Enlace junto a «Guardar» en `GFormActions`: texto y caja centrados (Δ ≤ 1px); marca de texto: insignia y acción centradas con la primera línea, hueco 8px; a 320px, líneas y acción alineadas con el texto (sangría francesa) |
| Móvil | 375 y 320 (y 375 oscuro): lo grave no abre nada solo; el resumen abre una hoja inferior modal real a todo el ancho; sin desplazamiento horizontal; isla dentro del margen; detalle partido |
| RTL | Insignias al inicio (derecha) y concéntricas; marca de texto espejada; `top-start` pegada a la derecha a `space × 2` |
| `forced-colors` (Chromium) | Borde `CanvasText` en isla, aviso y marca; anillos sólido / discontinuo / punteado conservados; sin cambio de tamaño; foco visible |
| Zoom 200 % / 400 % aprox. | 640×450 (DPR 2): isla abierta dentro del visor, «Entendido» visible, sin texto recortado; 320×225 (DPR 4): hoja, igual |
| Δ0 | El foco en «Guardar» no se mueve al aparecer, abrirse ni resolverse (0px por cuadro); cinco referencias de la página Δ 0 |
| Convivencia | `GToaster` top-center: el aviso empieza 14px bajo la isla replegada; con la isla abierta encima del aviso, gana la isla. Voz: la isla empieza bajo la pill flotante; con puntero, abrir la isla cierra el panel de voz y pulsar la pill repliega la isla. `GDialog`: la isla se traslada (mismo nodo), sigue en la capa superior **encima** del diálogo con su estado, y vuelve al `body` abierta |
| Consola | Sin errores ni avisos en los tres motores |

## Personalidad (D1 a D5 de kiwi, #316) y comparación con B

Capturas lado a lado (Chromium, DPR 2, claro y oscuro) del prototipo `?c=B` y del playground real en compacta, abierta, punto y marca. **El componente real conserva el carácter de lo aprobado:** la píldora oscura colgada del borde superior, una sola superficie que crece y se repliega a un punto con el muelle, la insignia redonda rellena del tipo con su anillo en la tinta, «+N» como cápsula, avisos como piezas redondeadas dentro de la isla con «Reintentar» en cápsula, y la marca cápsula del mismo lenguaje (a la vista, igual que la de B; 134 × 32px frente a 133 × 32px). Lo que se había perdido (negrita del título, «Ir a…» como enlace) está corregido (hallazgos 2 y 3). Lo que el real añade sobre B (afinados de `estilo.md` §4): insignia concéntrica, eco de «hay varias» en el punto, cuelgue desde el borde, morfo del radio, cascada.

| | Qué es | Queda | Cómo se mide (`auditoria-verificar.mjs` y `status.spec.mjs`) |
| --- | --- | --- | --- |
| **D1** | Nada se mueve, nunca | Sí | Δ 0 por cuadro del botón con foco y de cinco referencias al aparecer, abrirse y resolverse; marca en `GFormActions` sin mover «Guardar» |
| **D2** | Un sitio con memoria (punto) | Sí | «Entendido» → punto de 32px (≥ 24 su resumen, también con space 3; ≥ 44 táctil) con el nombre accesible intacto (spec); el eco de «hay varias» se ve en las capturas |
| **D3** | Se abre sola sin estorbar | Sí | El error de guardar abre la isla sin tomar el foco; si taparía el campo en uso, compacta + toque (spec); nunca en móvil |
| **D4** | Continuidad de forma | Sí | Tres cambios con intermedios y sobrepaso 3,1–3,7 %; error → reintentando → éxito en el mismo `li` sin ocultarse; WebKit sin morfo del radio medible (hallazgo 6) |
| **D5** | Ida y vuelta con el origen | Sí | Marca → isla en su aviso con el foco en su acción → «Ir a…» al origen; `Alt+F8` va y vuelve (spec, tres motores) |

**Tema oscuro (superficie inversa = isla clara).** En oscuro la isla es una píldora clara sobre la página oscura: es lo mismo que hacía B (su `brand` del tema por defecto también se aclaraba en oscuro), conserva la identidad de «objeto aparte, colgado del borde» y el contraste es el más alto de todos (15,22 el resumen, 13,03 los avisos, 4,81 el icono sobre la insignia). Visualmente pesa más que en claro con el panel abierto, pero solo dura mientras se lee; replegada es una píldora pequeña. Sin cambio.

## Pasada de cierre

- `npx vitest run` (`packages/vue`): **2148/2150**; las 2 que fallan son el hallazgo 5 (fallan igual sin esta auditoría).
- `npm run build`: correcto. Compuertas: las tres de `CLAUDE.md`, las de componentes (incluida `g-status-island__shape`), `! createSpeech`, `! createTranscript` y `! createStatus` en `grana.js`, `dist/speech.js` y `dist/status.js`: todas pasan. `check-icons.mjs`: 0 archivos con glifos.
- Playwright (puerto 4209, tres motores, 2 workers): `status.spec.mjs` + `speech.spec.mjs` + `form-blur-click.spec.mjs` **75/75**; casos de `GToaster` de `library.spec.mjs` **3/3**.
- `estilo-verificar.mjs` (banco): **2535/2535**. `auditoria-verificar.mjs`: **2647/2647** + 6 pendientes de bruno.

## No verificado

- Lector de pantalla, Safari real, táctil real (en Firefox y WebKit `pointer: coarse` no se emula), `forced-colors` real.
- Aviso de desarrollo 13 en navegador (la UMD no tiene `process`).
- El morfo del radio en WebKit a ojo (hallazgo 6).
- Zoom real del navegador (aproximado con visor reducido y DPR).
