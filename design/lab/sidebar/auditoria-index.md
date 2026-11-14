# Auditoría posterior de coco · `GSidebar` `appearance="index"` y grupos plegables (paso 5)

**Alcance:** DECISIONS #1060 a #1065, con las enmiendas #1069 (extensión `@grana/vue/sidebar-index`), #1070 y #1071 (`is-far`). Contrato: `design/contracts/sidebar.md` §«Apariencia `index`» (líneas 722 a 904). Cierra el `pending` de `GSidebar.meta.json`: «appearance index y grupos plegables (#1060 a #1065): auditoría de coco sobre el componente real y paridad con design/lab/sidebar/r03/paridad.json».

**Componente auditado:** el **real**, `packages/vue/dist/` tal como está (`grana.css` + `grana.umd.js` + `sidebar-index.umd.js` + `sidebar-filter.umd.js` + `app-shell.umd.js`), sin reconstruir: la verificación estática comprueba que los 72 selectores de `index` y del plegado de `GSidebar.css` están en `dist/grana.css` (construido al día con el fuente). Banco: `design/lab/sidebar/r03-estilo/index.html` (el marco calcado del sitio con el `GSidebar` real; el tema del sitio solo pone `--g-sidebar-group-title-weight: 700` y el velo de #1066). Nuevo en el banco: `&ext=0` lo monta sin la extensión.

**Verificación propia:** `node design/lab/sidebar/auditoria-index-verificar.mjs` (puerto 4211) → **275/275** (12 estáticas + 263 en Chromium). Resultados y medidas en `auditoria-index-resultados.json`. Además, la spec de bruno `tests/sidebar-index.spec.mjs` en Chromium con `--workers=1` (puerto 4211): **9/9**, incluida «500 destinos: cambiar el actual y plegar sin tareas largas (< 50 ms)».

**Motor:** solo **Chromium 153** (Firefox y WebKit no están instalados en este entorno: no se verificaron aquí; la ronda de estilo r03-estilo los midió el 2026-11-09 sobre la piel, 1130/1130, antes de #1071).

## Veredicto

**Sin defecto bloqueante** contra un mínimo que no se rompe (contraste, área táctil, foco visible, tokens, movimiento reducido). Dos hallazgos no bloqueantes (H1, H2) y los límites de verificación de abajo. Desde coco, la apariencia `index` y los grupos plegables cumplen el criterio de `stable` de `api.md` en lo que toca a la auditoría; el `pending` del `meta.json` lo retira bruno (dueño del archivo).

## 1. Paridad con `r03/paridad.json` (prototipo de kiwi), valor a valor

Se mide el componente real en las mismas ocho vistas del prototipo (claro y oscuro × 1280, 1024, 768, 375; en 768 y 375, el cajón abierto con la región en `scrollTop = 0`) y se compara con el campo `proto` de cada pieza. Tolerancia 0,5 px.

| Vista | columna | grupo | título | enlace | actual | marca | Δ máx. |
| --- | --- | --- | --- | --- | --- | --- | --- |
| claro/1280 | 0,0,272,800 | 32,64,208,354 | 32,74,208,32 | 32,106,208,32 | 32,1331,208,32 | 15,1337,2,20 | **0** |
| claro/1024 | 0,0,272,800 | 32,64,208,354 | 32,74,208,32 | 32,106,208,32 | 32,1331,208,32 | 15,1337,2,20 | **0** |
| claro/768 (cajón) | 0,0,320,800 | 32,64,256,344 | 32,64,256,32 | 32,96,256,32 | 32,1321,256,32 | 15,1327,2,20 | **0** |
| claro/375 (cajón) | 0,0,311,740 | 32,64,247,344 | 32,64,247,32 | 32,96,247,32 | 32,1321,247,32 | 15,1327,2,20 | **0** |
| oscuro/1280, 1024, 768, 375 | iguales a claro | | | | | | **0** |

**48 de 48 piezas con Δ 0** (el prototipo tenía 12 de 14 con Δ 0 frente al original; las dos restantes son la fila del filtro del cajón, +32, desviación aceptada en `sitio-marco.md` §12, y el componente la reproduce igual que el prototipo).

Color (las 8 vistas): título `rgb(26,26,26)` / `rgb(242,242,242)`, enlace `rgb(85,85,85)` / `rgb(184,184,184)`, actual y marca `rgb(11,99,206)` / `rgb(51,131,240)`, fondo `rgb(246,246,246)` / `rgb(16,16,16)`: **iguales al prototipo**. **Velo:** el componente con el tema del sitio da `rgba(0,0,0,0.6)` en claro y oscuro = el original; el prototipo pintó en claro el velo por defecto de Grana (0,32), así que en claro se compara con la referencia (anotado en el script). Sin el tema del sitio, el velo es el de Grana (0,32 claro, 0,6 oscuro): Grana no cambia su valor (SB-L9). Consola limpia en las 8 vistas.

## 2. Contrato frente a componente real

| Regla | Medido |
| --- | --- |
| Raíz y raíz interna del cajón con `g-sidebar--appearance-index` (SB-B1) | Sí (1280 y 375, claro y oscuro) |
| `g-sidebar__nav` con `tabindex="-1"` (#570, SB-B6) | Sí |
| Sin borde de columna, sin iconos (A2), fila 32 | `0px`, 0 iconos, 32 |
| Título 14/24 en `text` con la ranura de #1064 | 700 con el tema del sitio; **600** (`title-sm`) con el tema por defecto |
| Enlace 14/24/500 en `text-muted`; actual en `accent-text` con el mismo peso y su número en `accent-text` | Sí |
| Número (C1): 12 px, cifras tabulares, `text-subtle`, `aria-hidden`, al final | Sí |
| Nombre del actual: etiqueta y después el número (#1063) | «GCombobox , 24» (orden correcto; espacio de más, **H1**) |
| *Disclosure*: 9 botones con `aria-expanded` y `aria-controls` a `g-sidebar__group-body`; la lista con `aria-labelledby` al botón y nunca `hidden` (SB-B4) | Sí |
| Plegado asentado: `hidden="until-found"` en el cuerpo, alto 0, relleno inferior 10, `is-closed` | Sí |
| Separador de 1 px en `border`; fondo `surface-sunken` | Sí |
| Banda de 64 con la línea a 63, sin botón de contraer (SB-B2); filtro 120 × 32 en la banda (F1) | Sí |
| Recuento oculto a la vista con el campo vacío, con texto y en `aria-describedby`; visible con consulta, 12 px, ≥ 4,5:1 | Sí |
| Marca `aria-hidden`, última hija del `<nav>`, 2 × 20 a x = 15 | Sí |
| Marca hueca en el botón del grupo plegado del actual (contorno 1 px `accent-text`), `has-current` y el texto de `labels.groupCurrent` | Sí; al desplegar vuelve llena a la fila (±1) |
| La ruta abre el grupo y la marca llega (la cubre también la spec de bruno) | Sí |
| Regla 5 del filtro: con consulta, el grupo plegado se pinta abierto **sin transición**, botón `aria-disabled` que no pliega; Esc lo devuelve plegado | Sí (`transition-duration: 0s`) |
| Teclado: Tab salta los enlaces plegados; Intro despliega y Espacio pliega; ↓ ↑ Inicio Fin incluyen los botones; → no mueve | Sí (último enlace de «Estructura de página» → ↓ botón plegado → ↓ botón siguiente; Inicio «Empezar», Fin «GTranscript») |
| `beforematch` | Sintético: abre. **Fragmento de texto** `#:~:text=GHelperScope` (búsqueda real del motor) con el grupo plegado: **abre** (`aria-expanded="true"`). `window.find` encuentra el texto pero no dispara `beforematch` (no equivale a Ctrl+F) |
| Sin la extensión (#1069) | Raíz `g-sidebar--appearance-default`, sin marca; los 10 grupos con título `span`, sin botón ni cuerpo, 87 enlaces visibles (`collapsed` ignorado); **A5 una vez** y nombra `app.use(SidebarIndex)` (oído definiendo `process.env.NODE_ENV` en el banco: en UMD sin empaquetador los avisos se absorben, #653) |
| Con la extensión, sin avisos `[Grana GSidebar]` (A1 a A5 no aplican en el sitio) | Sí |
| Grupos plegables en `default` (regla 9) | Botón con el aspecto del título (caption, `text-subtle` ≥ 4,5:1), ≥ 24, flecha ≥ 3:1; pliega a 0 |
| Peso: `dist/sidebar-index.js` ≤ 3 840 B gzip | 3 821 B (zlib por defecto; la medida de compuerta es de bruno) |

## 3. Tokens y CSS (`GSidebar.css`)

Estático, todo el archivo: primera línea con las cuatro capas en orden; **solo `var(--g-*)` y `var(--_*)`**, ninguno con valor de respaldo; del chasis solo `--g-app-shell-header` (lectura permitida, #1070); ningún color literal (solo `transparent` y las palabras de `forced-colors`). Bloque de plegado e `index`: literales en px solo `24px`, `44px` y `1px` (patrón de texto oculto); ninguna duración literal (solo `0s` del fundido inmediato). Las compuertas de #1065 (`g-sidebar--appearance-index`, `g-sidebar__mark`, `g-sidebar__group-body`) están en `dist/grana.css`.

## 4. Contraste (≥ 4,5:1 texto, ≥ 3:1 formas)

Tema por defecto sobre `surface-sunken`:

| | Claro | Oscuro |
| --- | --- | --- |
| Enlace (`text-muted`) | 6,90 | 9,59 |
| Título (`text`) | 16,10 | 17,00 |
| Actual (`accent-text`) | 5,27 | 5,12 |
| Número (`text-subtle`) | 4,72 | 6,93 |
| Hover: `text` sobre la luz | 13,43 | 13,17 |
| Marca llena y hueca (forma) | 5,27 | 5,12 |
| Flecha (forma) | 6,90 | 9,59 |
| Anillo de foco | 5,27 | 5,12 |

El actual frente a su vecino da 1,31 / 1,88: por eso la marca es obligatoria (SB-K1, 1.4.1); está pintada en las 8 vistas.

**Temas distintos del por defecto:** los 11 de Dark Color Presence, **regenerados con el CLI vigente** por el propio script (la carpeta `generated/` del repositorio es anterior a #1074 y daba 4,19 a 4,32:1 en el actual; ver Pendientes), claro y oscuro, 22 casos, con el grupo del actual plegado para medir la marca hueca. Mínimos: enlace 6,87 (lustre claro), número **4,70** (lustre claro, margen 0,2), título 16,08, actual **4,55** (medium claro), marca hueca 4,55, flecha 6,87, hover sobre la luz 13,17, foco 4,55. **Todo cumple.**

## 5. Área táctil, texto y foco

- `pointer: coarse` (375, emulado): filas, botones de grupo, cerrar y campo **≥ 44**; texto editable **16 px**. Puntero fino: todo ≥ 24 (filas 32).
- Texto: el menor es el número y el recuento, **12 px**.
- Foco: botón de grupo con anillo `solid` ≥ 2 px en `--g-color-focus`, por fuera (`:focus-visible`), 5,27:1; enlace igual y **entero dentro de la región** (no se recorta en el relleno de 32). En `forced-colors` el anillo sobrevive.
- Cajón: el actual a la vista y centrado al abrir (I5, ≤ media fila); Esc cierra y devuelve el foco al disparador.

## 6. RTL, `forced-colors` y movimiento reducido

- **RTL** (1280): marca a 15 del borde derecho; número a la izquierda y etiqueta al inicio; flecha abierta abajo (−90°) y al final.
- **`forced-colors`** (Chromium emulado): marca en `Highlight`, opaca; línea de la banda y separadores sólidos; anillo de foco presente.
- **Reducido:** la marca solo se funde (sin `translate`) y salta a su destino en dos cuadros; el plegado es inmediato (alto 0 en dos cuadros, sin transición en rejilla, flecha ni relleno); el filtro crece sin transición.

## 7. Rúbrica de movimiento (`rubrica-movimiento.md`) · plegado y marca

| Dimensión | Estado | Evidencia | Riesgo | Recomendación |
| --- | --- | --- | --- | --- |
| A · Propósito | Cumple | El plegado enseña qué se va; la marca, dónde estás y a dónde fuiste; nada al montar (`is-ready`) | — | — |
| B · Comodidad | Cumple | Muelle solo en el viaje corto: 32 px → rebase **1,2 px**; salto de 902 px con `is-far` + `ease-out` → **0 px** (#1071). Plegado 240 ms `ease-out` | — | — |
| C · Estabilidad | Cumple con observación | Solo el plegado empuja (lo pedido); la marca vuelve a su fila sin viajar al plegar un grupo de arriba (Δ 0 al asentar) | **H2:** un cuadro con la marca a 0,69 de opacidad 105 px lejos de su fila | Ver H2 |
| D · Interrumpible | Cumple | Abrir y plegar al 6.º cuadro: 0→101→184→246→287→313 → **213**→133→79…→0; parte del alto actual, baja sin rebote, no llega al lleno (352) | — | — |
| E · Control | Cumple | Todo lo provoca el usuario o la ruta; con consulta el botón queda `aria-disabled` | — | — |
| F · Accesibilidad | Cumple | Reducido sin viaje ni transición de altura; `forced-colors`; foco visible | — | — |
| G · Rendimiento | Cumple (Chromium) | Spec de bruno con 500 destinos, `--workers=1`: sin tareas largas (< 50 ms) | Firefox y WebKit sin medir aquí | Pasada de tres motores al cerrar |
| H · Coherencia | Cumple | Plegado = pieza `plegado` de `motion.json` (`slow` + `ease-out`, contenido `fast`); muelle del actual de #617/#635 | — | — |

**No verificable:** comodidad con trackpad inercial, lector de pantalla real, Safari real.

## Hallazgos

- **H1 (bruno y coco, no bloqueante; para el lector real):** el nombre accesible del actual en `index` es **«GCombobox , 24»** (Chromium, `ariaSnapshot`), con un espacio antes de la coma; el contrato pide «GCombobox, 24». No hay espacio en el DOM (label · code `aria-hidden` · sr «, 24»): lo inserta el cálculo de nombre de Chromium en el límite de la caja del `g-sidebar__sr` (posición absoluta del patrón de texto oculto; poner la etiqueta en `inline` no lo cambia). El orden es el correcto y el habla no cambia en la práctica; se confirma o se descarta con VoiceOver/NVDA. Si molesta, la salida es de bruno (llevar el número del texto oculto a `aria-label`/`aria-describedby` cambiaría el contrato: lima) o del patrón de texto oculto, que no se toca por un componente.
- **H2 (lima y bruno, no bloqueante; rúbrica C):** al plegar o desplegar un grupo **por encima** del actual, la marca pierde su clase y se funde con `--g-duration-fast`, pero la rejilla del grupo recorre ≈ 105 px en el primer cuadro: durante **un cuadro** (≈ 11 ms) la marca se ve con opacidad **0,69 a 105 px** de su fila (0,35 a 192 px en el siguiente) y luego desaparece; al asentar vuelve a su fila sin viajar (Δ 0). Es un parpadeo de un cuadro, no una parada sobre la fila vecina como el de #1071. Salida sin bytes de CSS ni contrato nuevo: que bruno ponga **`is-instant`** en la marca al empezar ese plegado (el ocultado sería inmediato; `.g-sidebar__mark.is-instant { transition: none }` ya existe). Como el contrato dice «se funde `fast` al empezar», lo decide lima. coco no lo corrige en CSS: cambiaría el movimiento contratado.

## Correcciones

- Ninguna en `GSidebar.css` (no hizo falta): **`dist/` no se reconstruyó**.
- Banco `design/lab/sidebar/r03-estilo/app.js` (coco): `&ext=0` monta el banco sin `@grana/vue/sidebar-index` para medir la degradación de #1069.

## Cumplimientos / Correcciones / Pendientes

**Cumplimientos:** paridad con `r03/paridad.json` **48/48 piezas con Δ 0** y color igual en las 8 vistas; contrato de #1060 a #1065, #1069 y #1071 sobre el componente real; tokens sin respaldo ni literales de tema; contraste ≥ 4,5:1 (texto) y ≥ 3:1 (formas) en el tema por defecto claro y oscuro y en 11 temas más (22 casos); ≥ 44 con `pointer: coarse` y ≥ 24 con puntero fino; texto ≥ 12 px; foco visible y sin recorte; RTL, `forced-colors` y reducido; rúbrica de movimiento A a H sin incumplimientos; 275/275 propias + 9/9 de la spec de bruno (Chromium).

**Correcciones:** ninguna en CSS; el banco gana `&ext=0`.

**Pendientes:**
- **bruno:** retirar del `pending` de `GSidebar.meta.json` la línea de la auditoría de coco y la paridad (dueño del archivo); H1 y H2 (H2 con decisión de lima).
- **lima:** H2 (redacción de «se funde `fast` al empezar» si se adopta `is-instant`).
- **Dueño de `design/lab/tema-oscuro/dark-color-presence/`:** `generated/` está desfasado del CLI (anterior a #1074; con él, el actual da 4,19 a 4,32:1 en 8 temas). Regenerar con `node packages/cli/scripts/dark-color-presence.mjs design/lab/tema-oscuro/dark-color-presence`. Este script ya regenera en una carpeta temporal y no depende de ello.
- **Sin verificar aquí:** Firefox y WebKit (no instalados; pasada de tres motores al cerrar el lote, con `ENGINES=chromium,firefox,webkit`); Ctrl+F real (se probó el fragmento de texto, que usa la misma búsqueda del motor); lector de pantalla real (anuncio del botón, `groupCurrent`, H1); táctil, `forced-colors` y Safari reales; padres con `children` en `index` (no prototipados ni en el banco); la barra de `/blocks/` (SB-L12); la marca con 500 entradas solo en rendimiento, no visualmente.
