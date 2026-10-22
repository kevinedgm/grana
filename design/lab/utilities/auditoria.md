# Auditoría · Clases utilitarias (paso 5, coco)

**Alcance:** `packages/vue/src/styles/utilities.css` (coco, 5c10f15) sobre el `dist/` real: `dist/grana.css` con la capa `grana.utilities` integrada y `dist/utilities.css` suelto (bruno, 58be30c), con el contrato de lima (35b5613; #804 a #811; `design/contracts/utilities.md` y `utilities.json`). **Fecha:** 2026-10-22 · **Resultado:** ningún defecto bloqueante ni de `utilities.css`; **tres desajustes del banco y del verificador corregidos** (U-A1 a U-A3) → el lote puede pasar a **`candidate`** (el estado lo escribe lima en `utilities.md`; no hay `meta.json`).

## Verificación propia (tres motores, `dist/` real tras `npm run build`)

| Script (desde la raíz) | Qué mide | Chromium | Firefox | WebKit | Total |
| --- | --- | --- | --- | --- | --- |
| `GRANA_PW_PORT=4209 node design/lab/utilities/verificar.mjs` | Banco `estilo-banco.html` con solo hojas de `dist/`: escala del tema, ejes lógicos y RTL, orden dentro de la familia, utilidad contra componente y contra la aplicación, `display` + `hidden`, flex y rejilla, texto, `g-truncate`, radios, `g-sr-only` frente a `g-hidden`, `GStack divided`, las 229 clases (regla en la hoja y estilo computado idéntico al del JSON), 6 configuraciones de página + hoja suelta + `forced-colors` | 589/589 | 589/589 | 589/589 | **1767/1767** |
| `GRANA_PW_PORT=4210 node design/lab/utilities/auditoria-playground.mjs` | Playground real `#sec-utilities` (claro y oscuro): los cuatro ejemplos de bruno, el efecto en el `GBtn` real y la comparación de todo el playground con y sin la capa | 42/42 | 42/42 | 42/42 | **126/126** |
| `GRANA_PW_PORT=4211 node design/lab/utilities/contraste-temas.mjs` | `g-text-muted` y `g-text-subtle` sobre `bg`, `surface` y `surface-sunken`, claro y oscuro, tema por defecto + 11 temas de Dark Color Presence derivados ahora por `@grana/cli` | 168/168 | (color, no depende del motor) | (ídem) | **168/168** |

Además, `npx vitest run src/styles/utilities.test.js` en `packages/vue`: **13/13** (nivel: prueba).

**Temas y configuraciones del banco:** por defecto claro y oscuro; «Tema de prueba» (`space` 5, títulos serif, borde 2 px); un tema del CLI con `space` 5 y `fontSize` 14; RTL; `dist/utilities.css` **antes** que `dist/grana.css`; **solo** `dist/utilities.css`; `forced-colors: active`.

## Auditoría previa (`docs/documentacion/auditoria-visual.md`, §1)

Las utilidades no tienen forma, estados ni movimiento propios (#804): se audita que sean **fieles al tema** (cada clase es un token), que **ganen donde deben y pierdan donde deben** (capas), que **respeten `hidden`** y que **no alteren nada** de lo que ya existía. Riesgos anotados antes de medir: (1) el banco enmascaraba la regla 3 del contrato; (2) el parche temporal de `GStack.css`; (3) la capa nueva podía mover componentes ya medidos.

## Hallazgos

| N.º | Observación → consecuencia → cambio → re-verificación | Estado | Nivel |
| --- | --- | --- | --- |
| **U-A1** | **Observación:** el banco declaraba él mismo `@layer grana.defaults, grana.components, grana.blocks, grana.utilities;` y cargaba `utilities.css` desde `src/` con `layer(grana.utilities)`. **Consecuencia:** la regla 3 del contrato (cada hoja declara el orden completo, así da igual cuál cargue primero) no se podía comprobar: el banco ponía el orden por ella, y la configuración «utilities antes que grana.css» pasaba aunque la hoja no lo declarase. **Cambio:** el banco carga solo `dist/` (`<link>`), sin declaración propia; las líneas «TEMPORAL» salen. **Re-verificación:** con `?utilfirst=1` (utilities.css antes que grana.css, sin ayuda del banco) las 589 comprobaciones por motor pasan, incluida «la utilidad gana a una regla de `grana.components` de especificidad 1,3,0» y «`g-mt-4` gana a `.g-stack > *`» (#806). | Corregido (banco) | medido |
| **U-A2** | **Observación:** el banco parchaba en memoria `dist/grana.css` con el cambio de `GStack.css` (`divided` cuenta `g-hidden` y `g-sr-only` como `[hidden]`). **Consecuencia:** ocultaba si el `dist/` lo traía de verdad. **Cambio:** parche fuera. **Re-verificación:** `dist/grana.css` trae el selector (1 coincidencia) y las tres comprobaciones de `GStack divided` con `g-hidden` en medio, `g-hidden` primero y `g-sr-only` primero pasan en los tres motores. | Corregido (banco) | medido |
| **U-A3** | **Observación:** no había configuración que cargara **solo** `dist/utilities.css`. **Consecuencia:** la hoja suelta (`@grana/vue/utilities.css`, #810) no estaba medida. **Cambio:** configuración `?only=1` y función `solo()` en `verificar.mjs`. **Re-verificación:** la hoja empieza (tras el comentario) por el orden de capas completo; el navegador lo lee como `CSSLayerStatementRule` con los cuatro nombres; no hay `!important`, `@import` ni reglas fuera de `grana.utilities`; no hay `grana.css` cargado; con los valores por defecto de los tokens como estilo en línea, las 229 clases tienen regla y dan el mismo estilo computado que el JSON; la utilidad gana a una regla más específica de `grana.components` y pierde ante una regla de la aplicación sin capa. | Corregido (herramienta) | medido |
| **U-A4** | **Observación:** la comparación «con y sin la capa» sobre el playground fallaba en 3 `svg` (indicadores animados) porque su caja cambia con el cuadro en que se mide. **Consecuencia:** falso positivo, no defecto del producto. **Cambio:** el comparador salta los elementos con animación en curso y toma tres pasadas del real entre sí como ruido. **Re-verificación:** varias pasadas seguidas dan 0 diferencias reales. | Herramienta (sin defecto) | medido |
| **U-A5** | **Observación:** `g-text-subtle` sobre `surface-sunken` en claro es el par más justo: **4,72:1** (defecto), 4,71:1 (tema del CLI `space` 5) y **4,70:1** (mínimo de los 12 temas: `lustre`, claro). **Consecuencia:** cumple el 4,5:1 de la regla 7 con 0,2 de margen; si el motor bajara `text-subtle` ese margen se acaba sin que una utilidad cambie. **Cambio:** ninguno (cumple). **Re-verificación:** 168/168 comprobaciones ≥ 4,5:1 sobre los 12 temas en claro y oscuro. | Cumple (margen estrecho, informativo) | medido |
| **U-A6** | **Observación:** una utilidad de **interior** sobre la raíz de un componente gana y lo cambia: `g-p-8` sobre un `GBtn` lo pasa de 87,3×36 a 119,3×86 px en los tres motores. **Consecuencia:** es exactamente lo que dice la tabla «exterior sí, interior no» del contrato (fuera de contrato, no se abren defectos); no es un defecto. Las de **exterior** funcionan sobre el `GBtn` real: `g-ms-auto` lo aparta del inicio de la fila (misma distancia en LTR y RTL), `g-w-full` lo ensancha y `g-hidden` lo deja en `display: none`. **Cambio:** ninguno. | Cumple (límite documentado) | medido |

## Auditoría posterior (`auditoria-visual.md`, §3; solo lo que aplica a utilidades)

| Aspecto | Estado | Evidencia |
| --- | --- | --- |
| Consistencia con tokens | Cumple | Cada clase lee `var(--g-*)` sin respaldo (prueba de bruno 13/13 y 229/229 con estilo computado igual al del JSON); con `space` 5 `g-p-4` mide 20 px y `g-text-*` sigue el rol (tema del CLI con `fontSize` 14: `caption` 12,25 px ≥ 12); sin `!important` (0 coincidencias en `dist/utilities.css`) |
| Escala y ejes lógicos | Cumple | `g-ms-4`/`g-me-4`/`g-ps-6`/`g-text-start`/`g-text-end` se invierten con `dir="rtl"`; orden dentro de la familia (`g-p-4 g-pt-0`, `g-mx-auto g-ms-0`, `g-m-0 g-mb-3 g-mb-5`) lo decide la hoja, no el orden de las clases |
| Capas y especificidad | Cumple | Gana a `grana.components` (1,3,0) y a `.g-stack > *`; pierde ante una regla de la aplicación sin capa; el orden lo fija cada hoja (suelta, antes o después de `grana.css`) |
| Estado `hidden` | Cumple | Las seis de `display` con `hidden` y con `hidden="until-found"` siguen ocultas; `g-hidden` gana a `g-flex` sin importar el orden de las clases |
| Esquema oscuro y zona de marca | Cumple | `g-text-muted` cambia con `data-theme="dark"`; dentro de `zone="brand"` lee el de la zona y mide ≥ 4,5:1; muted 6,90–9,59:1 y subtle 4,70–6,93:1 sobre las tres superficies |
| Alineación y reparto | Cumple | `start`/`end`/`between`/`around`/`evenly`/`self-*` en flex y en rejilla, **WebKit incluido**, LTR y RTL |
| `forced-colors` (solo `g-sr-only`, `g-hidden`, `g-truncate`) | Cumple | Con `forced-colors: active` emulado en los tres motores: `g-sr-only` sigue en 1×1, absoluta y con el nombre accesible; `g-hidden` en `display: none`; `g-truncate` recorta con elipsis |
| `g-sr-only` frente a `g-hidden` | Cumple | El botón con `g-sr-only` conserva el nombre «Guardar cambios» (y «Eliminar el expediente 4821» en el playground), el hueco no ocupa sitio y la caja vecina no se mueve; con `g-hidden` el nombre sale del árbol |
| Jerarquía, espaciado y contraste en el playground | Cumple | Los cuatro ejemplos de bruno en claro y oscuro: fila = flex centrada con hueco de `--g-space-3` (12 px) medido entre el botón y el texto; `g-mt-6` = 24 px y distancia real 24 px al bloque anterior; `g-text-caption g-text-muted` = 12 px / rol `caption` / `--g-color-text-muted`, **7,46:1 en claro y 8,59:1 en oscuro**; capturas `auditoria-playground-claro.png` y `-oscuro.png` |
| Nada más cambió de medida | Cumple | En cada motor y esquema, la caja, el `display`, el margen superior, el relleno superior, el tamaño de letra y el `gap` de **todos los elementos del playground** (≈ 16 800, salvo la demo de utilidades y sus antepasados) son idénticos con y sin el bloque `@layer grana.utilities`. Referencias: `GBtn` 36 px, relleno de `GCard` 16 px y `gap` de `GStack divided` 24 px, iguales con y sin capa y iguales a las del contrato (nivel: medido; **no** se comparó con un `dist/` histórico, solo con el mismo `dist/` sin la capa, que aísla justo el efecto de la capa nueva) |
| Colisión de nombres (regla 12) | Cumple | Sobre `dist/grana.css` fuera de la capa: ninguna clase de componente coincide con una de las 229 ni con sus prefijos; solo `g-hidden`/`g-sr-only` aparecen, y en el selector de `GStack.css` que las trata como `[hidden]` (a propósito) |
| Estados de carga, vacío, error | N/A | No interactivas |
| Consola | Cumple | Sin errores de página ni de consola en los tres motores |

**Rúbrica de movimiento (`rubrica-movimiento.md`): No aplica.** Ninguna utilidad anima, transiciona ni cambia de forma; no hay propósito de movimiento, estabilidad ni control que evaluar.

**Peso (contrato, #810; tope ≤ 3 KiB gzip -9):** `dist/utilities.css` suelto 9 953 B → **1 878 B gzip**; crecimiento de `dist/grana.css` **+1 544 B gzip -9** (bruno registra +1 561 B con su método), 50 % del tope (nivel: medido).

## Para lima

1. **Estado:** sin defecto bloqueante; pasar el lote a `candidate` en la cabecera de `utilities.md`.
2. `utilities.md` «Límites conocidos» 3 y `stack.md` «Reglas de los hijos» 4: `GStack divided` **ya** trata `g-hidden` y `g-sr-only` como ocultos (`GStack.css`, 5c10f15; medido en los tres motores); quitar el «(pendiente de coco)».
3. U-A5 (margen de 0,2 en `text-subtle` sobre `surface-sunken`): informativo; si el motor de tema cambia esa derivación, volver a correr `contraste-temas.mjs`.

## Para bruno

1. Nada bloqueante. Si añade un tercer punto de entrada de CSS, `verificar.mjs` tiene el patrón de la hoja suelta (`?only=1`).
2. Sigue pendiente que la CI ejecute las compuertas de `dist` ya añadidas; esta auditoría no las repite (las cubre la prueba 13/13 y los scripts de arriba).

## Para mora-docs (`README-utilities.md` y página del sitio)

- La tabla «exterior sí / interior no» con la evidencia de U-A6 (`g-p-8` sobre la raíz de un `GBtn` cambia su caja; `g-ms-auto`, `g-w-full` y `g-hidden` son seguras) y `g-w-full` frente a la prop `block`.
- El texto de apoyo `g-text-caption` mide 12 px: es el mínimo y no se combina con un tamaño propio menor (regla 8).
- `g-sr-only` nunca en un elemento enfocable ni en un antepasado de uno (regla 9); `g-truncate` necesita `g-min-w-0` en una fila flex (regla 10).

## Cumplimientos / Correcciones / Pendientes

**Cumplimientos.** Escala del tema (con `space` 5 y `fontSize` 14), ejes lógicos y RTL, orden dentro de la familia, capas (gana a los componentes, pierde ante la aplicación, orden fijado por cada hoja), `hidden` manda, flex y rejilla en WebKit, texto ≥ 12 px y contraste ≥ 4,5:1 en 12 temas claro y oscuro y en zona de marca, `g-sr-only`/`g-hidden`/`g-truncate` en `forced-colors`, `GStack divided` con `g-hidden`/`g-sr-only`, 229/229 clases, sin `!important`, sin colisión de nombres, ningún componente del playground cambia de medida, peso 1 878 B / +1 544 B gzip.

**Correcciones.** U-A1 y U-A2: el banco carga solo `dist/` y ya no declara el orden de capas ni parcha `GStack.css` (`estilo-banco.html`). U-A3: configuración y comprobaciones de la hoja suelta. U-A4: el comparador del playground descarta elementos animados. `utilities.css` no cambió (no hizo falta). `estilo.md` actualizado (ya no pide quitar líneas «TEMPORAL»).

**Pendientes.**
- **Sin verificar en navegador real:** Safari, táctil y `forced-colors` de Windows reales (se emuló `forced-colors: active` en Chromium, Firefox y WebKit de Playwright); lector de pantalla sobre `g-sr-only` (se midió el nombre accesible por rol, no la lectura de VoiceOver/NVDA).
- **Sin verificar:** un `grana.css` anterior a la capa como referencia histórica (la comparación fue con el mismo `dist/` sin el bloque de utilidades); `dist/` generado por `npm run build` limpio en esta auditoría (se usó el que dejó bruno, confirmado con las compuertas del propio dist: orden de capas, 229 reglas, sin `!important`).
- **Límite documentado, no defecto:** utilidades de interior sobre la raíz de un componente (U-A6); un tema a mano que solo cambie `--g-space-1` (contrato «Límites conocidos»; no se midió: es consecuencia de #804).
- **Para otros roles:** lima (1 y 2 arriba), mora-docs (README de utilidades y página del sitio), agente principal (`AGENTS.md`, `README.md` raíz y `CLAUDE.md` según el contrato).
