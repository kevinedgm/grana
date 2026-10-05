# Auditoría de coco · GCombobox (paso 5)

**Componente:** `GCombobox` (bruno, `ebcd1e8` y `c4b087d`), entrada propia `@grana/vue/combobox` (`dist/combobox.umd.js`, global `GranaCombobox`); CSS de coco `GCombobox.css` (`23e3acb`, corregido en esta auditoría). Contrato `design/contracts/combobox.md` (#329 a #338; apartado «Fichas con `GSummary`», #349 a #357). Prototipos elegidos `design/lab/combobox/r02/index.html?c=AC` y `?c=B`. Estilo `design/lab/combobox/estilo.md`.

**Método:** `node design/lab/combobox/auditoria-verificar.mjs` sobre el **playground real** (`packages/vue/playground/`, sección `#sec-combobox` y «Alta de paciente»), con `dist/` construido y el servidor simulado de `playground/combobox-data.js`, **puntero y rueda reales** (`page.mouse`, `page.mouse.wheel`) y medida por cuadro (`requestAnimationFrame`). Resultado en la pasada final: **Chromium 1125/1125**, **Firefox 480/480**, **WebKit 485/485** comprobaciones (Chromium mide más temas: 28 configuraciones de contraste frente a 8).

Temas: por defecto claro y oscuro; «Tema de prueba» del playground claro y oscuro; el de esta auditoría, **`auditoria-tema.css`** (generado con `@grana/cli` desde `auditoria-tema.json`: brand `#0F5C5C`, radius 2, **space 3**, **fontSize 15**) claro y oscuro; y los once generados de `design/lab/tema-oscuro/dark-color-presence/generated/` claro y oscuro: **28 configuraciones en Chromium**, 8 en Firefox y WebKit (defecto, prueba, auditoría y `spotify`, claro y oscuro). Contraste sobre el compuesto real (capas translúcidas incluidas).

Ejecutar (requiere `npm run build`): `GRANA_PW_PORT=4209 node design/lab/combobox/auditoria-verificar.mjs` (`--engines=`, `--only=<apartado>`, `--shots=<carpeta>`, `--verbose`). Con otra sesión reconstruyendo `dist/` a la vez, `GRANA_DIST=<copia de dist>` sirve una copia fija (en esta auditoría el playground falló una vez con `GranaTesting is not defined` por una reconstrucción simultánea).

## Resultado: sin defectos bloqueantes. Una corrección en el CSS de coco; `status: "candidate"` en `GCombobox.meta.json`

## Hallazgos

| # | Hallazgo | Severidad | Dueño | Estado |
| --- | --- | --- | --- | --- |
| 1 | **Abrir y cerrar rápido dejaba cuadros sin contorno y sin anillo.** Con la forma abierta, la caja de `GInput` perdía borde y anillo poniendo sus colores a `transparent`; pero `GInput` funde `border-color` y `outline-color` en `--g-duration-fast`: al cerrar, la forma desaparece en el acto y el borde y el anillo de la caja vuelven **fundiéndose desde transparente**. Medido con 8 clics reales en la flecha + teclas (Chromium, 86 cuadros): **1 cuadro sin contorno y 2 sin anillo con el foco puesto** (un parpadeo; WCAG 2.4.7 de forma transitoria). Corregido: el anillo de la caja se quita con `outline-style: none` (discreto, no se funde) y el borde con `border-image: linear-gradient(transparent, transparent) 1` (pinta en lugar del color, no cambia el ancho: Δ0, y tampoco se funde). Al cerrar vuelven en el acto con su color. Confirmado que **fallaba antes** (copia de `dist/` con las reglas viejas: 1 sin contorno, 2 sin anillo) y **pasa después** en los tres motores (0 y 0) | Media (foco, parpadeo) | coco | Corregido y verificado |
| 2 | **Fichas con `GSummary` pendientes.** El contrato ya manda (#356) que opción, ficha del valor y vista previa se pinten con `GSummary`, y que `GCombobox.css` retire `__description`, `__facts`, `__fact`, `__fact-label`, `__token-label`, `__token-meta`, `__preview-*` y, en las opciones, `__lead`, `__code`, `__main`, `__label`, `__mark`. `GSummary` aún no está construida (contrato de lima `dcb7123`; sin `.vue` ni CSS). Hoy rige la regla provisional de dos líneas de `estilo.md`, que **cumple** las medidas del reporte del usuario (ver «Fichas de opción»). No bloquea: es una migración que depende de otro componente | Media (contrato) | **bruno** (`GCombobox.vue`: pintar con `GSummary`, `summaryDiff` sobre las opciones pintadas) y **coco** (retirar las clases y reapuntar los estados a `g-summary__*`), cuando `GSummary` pase su flujo | Pendiente, con dependencia |
| 3 | **Márgenes justos de contraste que vienen del tema, no del componente.** Mínimos de 28 configuraciones: iniciales del avatar `md` **4,53** (categoría del tema), mensaje de error de carga **4,51** (`danger-text`), contorno de la forma **4,52** (≥ 3 exigido). Todos cumplen; el componente solo lee los tokens del rol. Si un tema generado bajara de 4,5, el aviso es del motor de tema | Informativo | `@grana/cli` (bruno), si algún día baja | Cumple |
| 4 | **Arnés de esta auditoría** (no son defectos del producto): (a) la marca `__cbFailNext` se ponía antes de escribir «lu» y la consumía la búsqueda de «l» (red rápida): ahora se pone tras la primera letra y el error de carga se mide en todos los temas; (b) el recuento de «abrir y cerrar rápido» empieza con el anillo ya en reposo (el anillo de `GInput` entra fundiéndose al recibir el foco, como en todos los campos); (c) la comprobación «la caja conserva anillo o contorno» lee `outline-style` y `border-image` (el mecanismo del hallazgo 1); (d) WebKit, como Safari sin «Acceso total por teclado», no lleva el Tab a los botones: «Limpiar» se alcanza con `Alt+Tab` | — | coco | Hecho |
| 5 | **Playground: el índice lateral marca «GSelect» con el título «GCombobox» ya a la vista** (captura a 1280, título a 245px del borde superior; con el título a 150px marca bien). Umbral del resaltado del índice, común a todas las secciones | Baja (demo) | bruno (`playground/index.html`) | Anotado |

## Lo medido (tres motores salvo donde se dice)

| Área | Resultado |
| --- | --- |
| `dist/grana.css` y `GCombobox.css` | 131 reglas `g-combobox*` en `grana.components`; sin colores literales, sin `var()` con respaldo, sin `@layer`/`@property`/`!important`; solo `--g-*` que existen en `defaults.css` y `--_*` previstos (propios con prefijo `--_cb-`); medidas literales solo `24px`, `44px`, `1px`, `0px`; colores de sistema solo dentro de `forced-colors` |
| Marcado real frente al CSS | Popup, región viva y superficie son hijos de la raíz; `--_x`, `--_top`/`--_bottom`, `--_w`, `--_max`, `--_field-h` en línea; `--_field-h` = alto de la caja (< 0,5px); ficha con avatar `xs` y oculto con `name`; filas con avatar `md` y todas sus partes; popup en la capa superior; fantasma presente |
| Contraste (mínimo de 28 configuraciones en Chromium; 8 en Firefox y WebKit) | Etiqueta, coincidencia, dato, código, fila de acción, ficha, texto libre, activa y paleta activa **15,18**; rótulo de dato, grupo, descripción, «sin resultados», dato secundario de la ficha y marca «Texto libre» **7,38**; fantasma **6,49**; ficha seleccionada 13,65 / 6,49; solo lectura 13,85 / 6,49; título de la paleta y `dt` de la vista previa 6,87; título y `dd` de la vista previa 16,06; iniciales del avatar 4,53; error de carga 4,51; borde de la activa 15,18 (≥ 3); contorno de la forma 4,52 (≥ 3) |
| A · una sola forma | Δ caja–forma < 1px (izquierda, arriba, ancho; también hacia arriba) y **costura 0,00px** (WebKit −0,02) en defecto, oscuro, prueba y auditoría claro y oscuro; anillo de la forma = `--g-focus-width` del color de foco, **sin cortes** en la columna de píxeles del campo a la lista; la caja sin anillo, sin contorno y sin sombra abierta; el punto central del campo es el `<input>`; abrir no mueve el campo ni el alto del documento |
| Fantasma | Tinta de lo tecleado frente al `<input>` Δ 0/0/0/0px (DPR 2, LTR y RTL); fantasma árabe Δ 0,00px |
| C · ficha del valor | Δ0 de alto (fila, vacío → ficha, centrado) en defecto, prueba y auditoría; el secundario se recorta desde 740px de campo (auditoría 690), la etiqueta desde 490 (auditoría 450), nunca antes que el secundario; ancho visible de la etiqueta a 240px: 114px (auditoría 116) |
| Fichas de opción a 240 / 320 / 480px (reporte del usuario) | Nombre + datos **44px** (≤ 44,5 = dos líneas) en los tres anchos, defecto y auditoría; nada desborda; identificador visible; 1 / 2 / 3 de 4 datos a la vista (auditoría 2 / 2 / 3). También en la hoja, en la fila de tres y a 200 % |
| Puntero real sobre las opciones (reporte «pivoteo») | Ida y vuelta por cinco filas, con y sin movimiento reducido: **máximo 1 superficie resaltada por cuadro**, `scrollTop` constante (la lista no se desplaza sola), la forma quieta |
| Rueda dentro del panel | `scrollTop` 0 → 360 sin retroceso; la página no se mueve |
| Desplazamiento real de la página con la forma abierta | 16–17 cuadros abiertos, **0 rotos**, 1 cambio de lado, 0 cambios de alto sin cambio de lado; se cierra al salir del visor (defecto y auditoría) |
| Abrir y cerrar rápido | Chromium 86 cuadros (59 con la forma), Firefox 101 (67), WebKit 67 (44): **0 sin contorno, 0 sin anillo** (hallazgo 1) |
| Escribir mientras llegan los resultados (red simulada real, 380 ms + antirrebote 250 ms) | 0 parpadeos de la lista a vacío, 0 del fantasma, 0 «encoge y vuelve», la forma nunca se oculta |
| «Mostrar más» | 20 → 40 filas; alto del panel 384px constante; forma quieta; las filas a la vista se desplazan 4px (hacia la primera nueva, que pasa a activa: contrato) |
| Llegada de la ficha (puntero real, fila más lejana) | Defecto: Δy 309px → parte de 210,5 (cota `space × 2 / 0.038`), **rebase 8,00px = `space × 2`**, 240ms; auditoría (space 3): parte de 157,9, rebase 6,00px; termina en 0 y retira la clase |
| Movimiento reducido | Sin despliegue (solo los estados reales del contenido), la flecha sin transición de giro, la ficha no viaja (clase retirada en el acto) |
| Área táctil y foco (nuevo en esta auditoría) | Puntero fino: filas ≥ 42px (auditoría 38), fila de acción 42 (38), «Limpiar» 24×24, flecha 24 de ancho (la caja entera abre); puntero grueso (Chromium y WebKit emulados): filas y acción **44px**, «Limpiar» **44×44**; anillo de «Limpiar» por teclado sólido de `--g-focus-width`, contraste 5,69:1 (defecto) y 7,76:1 (auditoría). Firefox no emula `pointer: coarse` |
| B · paleta a 1280 | Modal dentro del visor, foco en la búsqueda, cuerpo 384px (`space × 96`), lista : vista 1,20 (6 : 5), la superficie no se mueve al cambiar los resultados, vista previa sin desborde con sus 4 datos; reabrir durante la salida: una sola superficie, opaca, en el mismo sitio |
| Hoja móvil 375×812 y 320×640 (`field` y `palette`) | Arriba (top 0) a ancho completo, sin vista previa, filas ≥ 44px, sin desborde ni desplazamiento horizontal, cuerpo sin desplazamiento; el pie no salta al escribir «ía g» (498px; Firefox 494) |
| `forced-colors` (emulado en los tres) | Con ficha, la ficha se retira y el `<input>` pinta `FieldText`; forma `CanvasText`; anillo `Highlight`; activa `Highlight`/`HighlightText` en A y en la paleta; fantasma `GrayText`; la coincidencia conserva el subrayado |
| RTL | Forma = caja; avatar al inicio (derecha); `#cb-rtl` sin desborde; fantasma árabe alineado |
| Fila de tres (`#cb-row`, `--g-form-min: 60`) | 1280: en línea, 293px; 900 y 600: se parte, 530 y 542px; la forma mide lo que el campo; fichas sin desborde; «Alta de paciente» (`#fm-medico`) con forma y ficha dentro de la caja; dentro de `GDialog` la forma va encima del modal y el clic en una fila elige |
| Zoom 200 % aprox. (640×450 a DPR 2) | La forma dentro del visor (245–443 de 450), sin desplazamiento horizontal, fichas sin desborde |
| Consola | Sin errores en los tres motores |

## Personalidad: comparación con lo aprobado

Capturas lado a lado (Chromium) de `r02/?c=AC` y `?c=B` frente al playground real (`--shots`). **El componente real conserva el carácter de lo elegido:** el campo que se abre en una sola forma con el anillo de foco rodeando campo y lista, la primera coincidencia completada en el propio campo sobre `selection`, la activa que «se levanta» como ficha con borde de tinta, las coincidencias subrayadas, el avatar de iniciales y los datos con rótulo; la paleta con la búsqueda protagonista subrayada por el foco, la activa **invertida** y la vista previa a la derecha en proporción 6 : 5; y la ficha que llega al campo con el muelle. Diferencias asumidas (de `estilo.md`): datos en una sola fila con separador en vez de varias líneas (reporte del usuario); el título de la paleta es la cabecera de `GDialog` con su botón de cierre (en B, un rótulo sobre la búsqueda). Nada que corregir.

## No verificado

- Lector de pantalla (VoiceOver, NVDA, TalkBack): eco de escritura con la primera opción activa, fantasma junto a `aria-activedescendant`, vista previa, `aria-describedby` con la línea secundaria, recuentos.
- `forced-colors` real (solo emulado), Safari real, teclado virtual real sobre la hoja, IME real con el fantasma, zoom real del navegador (200 % aproximado con DPR, 400 % no), pegado de texto largo.
- `pointer: coarse` en Firefox (no emulable).
- La pintura con `GSummary` (hallazgo 2): se auditará cuando `GSummary` esté construida.

## Pasada de cierre

Sobre el estado final (`GCombobox.css` corregido, `dist/` reconstruido; el árbol incluía cambios sin commit de otras sesiones en `GSelect`, `GMenu`, `GDatePicker`, `GHelper`, `anchor.js` y `GAdaptiveLayout`):

- `auditoria-verificar.mjs`: Chromium **1125/1125**, Firefox **480/480**, WebKit **485/485**.
- `npx vitest run` (`packages/vue`): **2368/2368** en 76 archivos.
- `npm run build`: sin errores. `node packages/vue/scripts/check-icons.mjs`: 0 archivos con problemas.
- Compuertas de CLAUDE.md (las tres de siempre, las de cada componente sobre `grana.css` incluida `g-combobox__ghost`, ni voz ni isla ni combobox en `grana.js`, `speech.js`/`status.js`/`combobox.js` presentes, `! grep -q "g-summary__" dist/combobox.js`): todas pasan.
- Playwright (`design/lab/theme-playground`, puerto 4209): `combobox.spec.mjs`, `combobox-forma.spec.mjs` y `personalidad-combobox.spec.mjs` en Chromium, Firefox y WebKit: **99/99**.
