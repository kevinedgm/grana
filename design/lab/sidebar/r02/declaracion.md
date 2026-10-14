# Declaración · GSidebar · r02 · el item actual con identidad (H2) · cortes (H10) · hueco del icono (H11)

**Estado:** pendiente de **tres elecciones del usuario** (producto e identidad): forma del actual (A/B/C) y si el tema por defecto cambia; estrategia de cortes (10-A/B/C); hueco del icono (11-A/B/C). La base funcional (puntos 1 a 14) se deriva de WCAG 2.2 AA y de contratos vigentes y no requiere elección.
**Prototipo:** `index.html` (tokens reales: `defaults.css` desde la fuente + `theme-nisa.css` del CLI). **Verificación:** `verificar.mjs` (Playwright, Chromium, `GRANA_PW_PORT=4214`).
**Siguiente dueño:** lima (`design/contracts/sidebar.md`, `docs/contract/tokens.md` §13, `DECISIONS.md`) tras la elección.

## Base funcional (común a A, B y C)

| # | Decisión | Fundamento |
| --- | --- | --- |
| 1 | **Tres ranuras del activo**, leídas por los cuatro formatos: **relleno**, **tinta** (sobre el relleno) y **filo** (la señal gráfica: barra en A/C, aro del asiento en B, contorno de la píldora). Nombres provisionales del reporte: `--g-sidebar-active-bg`, `--g-sidebar-active-text`, `--g-sidebar-active-border`; los fija lima. Son **tokens de componente** (§17.6): ningún semántico expresa «relleno del item actual de la navegación» sin forzar `primary` en toda la interfaz | §17.6 (no basta un semántico, un estructural ni una prop: la identidad del activo es de tema, no de instancia); precedente `--g-card-selected` (#134) |
| 2 | **Valores por defecto Δ0** (si el usuario no decide otra cosa en la pregunta 1b): relleno `--g-surface-inset`, tinta `--g-color-text`, filo `--g-color-accent-text`. Medido: el tema por defecto no cambia en reposo | Las ranuras solo dan nombre a lo que ya pinta `GSidebar.css` |
| 3 | **Pares que deben cumplirse** (claro y oscuro): tinta/relleno ≥ 4.5:1 (texto, 1.4.3); **una** señal ≥ 3:1: relleno/carcasa **o** filo/relleno (A, C) o filo/carcasa (B) (1.4.11). En B la tinta solo pinta el icono: icono/asiento ≥ 3:1, y la etiqueta queda en `text` | WCAG 1.4.3, 1.4.11, 1.4.1 (el peso y `aria-current` siguen) |
| 4 | **La píldora del navbar lee las mismas ranuras** que el activo de la barra lateral (hoy usa `--g-color-{color}`): un solo «actual» en los cuatro formatos. Ver L4 para el conflicto con la prop `color` | Un solo estado de navegación (r01 #28, contrato «Principios») |
| 5 | **Hover:** nunca cambia la superficie, la tinta ni el filo del actual (lo corrige coco ahora, hallazgo 1); el hover de los demás sigue en `--g-color-border`. Con un relleno oscuro, un hover sobre el actual que lo aclarara dejaría la tinta clara sobre un fondo claro | 1.4.3; hallazgo 1 del informe |
| 6 | **Foco:** anillo `--g-color-focus` **fuera** del item, con `--g-focus-offset` de carcasa entre el anillo y el relleno: el foco no depende del contraste con el relleno (medido foco/carcasa ≥ 4.29:1 en los 4 escenarios). Sin cambio respecto a hoy | 2.4.7, 2.4.11 |
| 7 | **Barra de acento (#89, #239):** pasa a ser el **filo** (punto 1). Sobre un relleno, se mide contra el **relleno**, no contra la carcasa. Con el relleno Δ0 (1.08:1) la barra es la única señal ≥ 3:1 y debe quedarse; con un relleno ≥ 3:1 la barra es un detalle de identidad (lima en el marino) | 1.4.11; #228 «active es un relleno, no un trazo» |
| 8 | **Rama:** en expandida y drawer, el padre con un hijo actual queda con peso y `text` (hoy) — B añade el asiento **hueco** (solo filo). En **riel**, donde los hijos no se ven, el **padre representa** al actual y toma la marca completa (ficha, asiento lleno o lengüeta); `aria-current` sigue solo en el hijo, dentro del panel. Es lo que la píldora ya hace con «Más» y los padres (#68) | 1.3.1, 4.1.2; coherencia con el navbar. **Hallazgo L5:** hoy, en el riel, la rama solo cambia el color del icono (`text` frente a `text-muted`), casi invisible (leído en `GSidebar.css` l. 325, sin medir) |
| 9 | **Drawer:** el mismo contenido expandido: mismas ranuras y misma forma | r01 #16 |
| 10 | **`forced-colors`:** relleno → `Highlight`, tinta → `HighlightText` (`forced-color-adjust: none` solo en la forma), filo → oculto en A/C (el relleno ya es la señal) y `CanvasText` en el aro de B; foco `Highlight`. Comprobado por captura en Chromium con `forcedColors: 'active'` | Convención del sistema para lo seleccionado; r01 «Colores forzados» |
| 11 | **Movimiento reducido:** sin viaje, sin llenado ni recogida; solo fundidos (`--g-duration-fast`), regla de §29.3 | WCAG 2.3.3; tokens.md §29.3 |
| 12 | **La tinta del destino cambia cuando la forma ya lo cubre** (retardo = duración del viaje): nunca se ve, ni durante un cuadro, tinta de acento sobre la carcasa (lima sobre el claro del proyecto da 1.54:1) | 1.4.3 durante la transición |
| 13 | **Validación en el CLI (diagnóstico, no rechazo, como #228):** si el tema declara las ranuras, mide los pares del punto 3 en claro **y** oscuro. **Derivación propuesta del oscuro** cuando el claro usa roles (`primary` + tinta `accent`): relleno `primary-soft`, tinta `accent-text` si llega a 4.5:1 sobre él, si no `on-primary-soft` (par garantizado por §2). Medido abajo | El caso real se rompe en oscuro (1.94:1) |
| 14 | **RTL:** propiedades lógicas; la lengüeta de C toca el filo del lado final y sus esquinas cóncavas se espejan | r01 #22 |

## Conceptos de forma (elige el usuario)

### A · Ficha que viaja

| # | Decisión |
| --- | --- |
| A1 | **Una ficha por `<nav>`** (nodo `aria-hidden`), no una por item, posicionada por el `.vue` con variables (`--_t`, `--_b`), como la marca de `GTabs` |
| A2 | Al cambiar de página **viaja**: el borde de delante con `--g-duration-press`, el de atrás con `--g-duration-slow`, ambos `--g-ease-out`; se **estira** en la dirección del viaje y se recoge (medido: 45 px a mitad de un viaje de 40 px de alto, llega exacta al destino) |
| A3 | Viaje de más de un visor del `<nav>` (scroll): sin viaje, fundido. Navegación de página completa (sin SPA): aparece en su sitio |
| A4 | Riel: la misma ficha de 44 px; en la rama, sobre el padre (punto 8) |

### B · Asiento

| # | Decisión |
| --- | --- |
| B1 | **La fila no se rellena**: el relleno es el **asiento del icono** (círculo de `icono + space × 3`). Lleno = estás aquí; **hueco (solo filo) = rama** |
| B2 | Los hijos no tienen icono: el actual lleva un **nodo** en la línea de conexión, y la línea se **enciende** en el color del filo desde el asiento del padre hasta el nodo: la ruta |
| B3 | El asiento es **idéntico en expandida y riel** (no cambia de forma al contraer) y en el navbar **es él** el que crece hasta la píldora |
| B4 | La tinta propia va solo al **icono** (≥ 3:1); la etiqueta queda en `text` (16.1 a 17.0:1 medido): es el concepto más tolerante con pares de identidad difíciles |
| B5 | Movimiento: el asiento se **llena** desde el centro (`clip-path`, `--g-duration-slow`, `--g-ease-spring`, #299); el filo con fundido |
| B6 | Δ visible en el tema por defecto: desaparece la superficie de la fila |

### C · Lengüeta

| # | Decisión |
| --- | --- |
| C1 | El actual es una **lengüeta** que llega al filo del sidebar, lo **rompe** y se une al contenido con dos **esquinas cóncavas**: «esta página es este item» |
| C2 | Su relleno Δ0 es el **de la página** (`--g-color-bg`), no la `inset`: así se funde. Con un relleno de marca es un conector sólido y se pierde la fusión |
| C3 | Al navegar, la página **recoge** la lengüeta hacia su borde (`clip-path` hacia el filo final) y la **saca** en el destino (`--g-duration-press`, `--g-ease-out`) |
| C4 | Requiere un **filo compartido** con el contenido: solo `variant="fixed"`; en `floating` queda como la ficha de A sin viaje. El filo del sidebar pasa a sombra interior para que la lengüeta pueda taparlo (cambio de coco) |
| C5 | Riel: lengüeta de 44 px hasta el filo; navbar: píldora (no hay filo) |

## Qué lo hace distinto

- **El actual cuenta el viaje (A).** Los frameworks cambian el fondo de un item a otro; aquí una sola ficha **viaja** y se estira hacia el destino. Al usuario le dice de dónde viene y a dónde ha ido, útil sobre todo en una navegación larga, donde el salto de fondo se pierde.
- **Una sola marca en los cuatro formatos (B).** El asiento del icono es la misma forma en expandida, riel y navbar (donde crece hasta la píldora). Al contraer, la marca no cambia de forma; al pasar al móvil, la píldora nace del mismo asiento. Y **lleno frente a hueco** distingue «aquí» de «dentro», sin color: la rama se lee por forma (1.4.1), y la ruta encendida hasta el hijo enseña la jerarquía.
- **El item y la página son una pieza (C).** La lengüeta cuestiona que el actual sea una caja dentro del sidebar: sale de la página y la toca. Para el usuario, la relación «este enlace = lo que estoy viendo» deja de ser abstracta.
- **El rigor no se pierde.** Las tres usan las mismas ranuras, los mismos pares medidos, la misma conducta de foco, hover, movimiento reducido y `forced-colors`.

## Medidas (contraste leído de los estilos calculados, Chromium)

Carcasa = `--g-surface-shell`. «✗» = no cumple. Escenarios: tema por defecto (G) y del proyecto (P), claro (c) y oscuro (o).

| Preset | Par | G c | G o | P c | P o |
| --- | --- | --- | --- | --- | --- |
| Δ0 (hoy) | tinta/relleno | 17.40 | 15.22 | 17.42 | 15.23 |
| | relleno/carcasa | 1.08 ✗ | 1.12 ✗ | 1.08 ✗ | 1.12 ✗ |
| | filo (barra)/relleno — señal ≥ 3 | 5.69 | 4.58 | 4.64 | 10.25 |
| Relleno con su par (`primary`/`on-primary`) | tinta/relleno | 16.48 | 16.19 | 11.57 | 5.60 |
| | relleno/carcasa — señal | 15.25 | 17.00 | 10.70 | 5.88 |
| Caso real con roles (`primary` + `accent`) | tinta/relleno | **2.90 ✗** | **3.32 ✗** | 6.95 | **1.94 ✗** |
| | relleno/carcasa | 15.25 | 17.00 | 10.70 | 5.88 |
| Caso real + oscuro derivado (`primary-soft` + `accent-text`) | tinta/relleno | 2.90 ✗ | **3.86 ✗** | 6.95 | **9.31** |
| | señal ≥ 3 (filo) | 15.25 | 3.86 | 10.70 | 9.31 |

- En B la exigencia de la tinta es 3:1 (icono): el caso real en el oscuro por defecto (3.32) pasa en B y no en A/C; el claro por defecto (2.90) no pasa en ninguno.
- Foco/carcasa: 5.27, 5.12, 4.29, 11.42 (sin cambio).
- Conclusión: el par del integrador **funciona en el claro de su tema y se rompe en su oscuro**; la derivación del punto 13 lo arregla en su tema (9.31) pero no en el tema por defecto (3.86 con `accent-text` sobre `primary-soft`): por eso el respaldo a `on-primary-soft` es obligatorio.

## Hallazgo 10 · cortes de adaptación (elige el usuario)

| # | Propuesta | Cómo | Caso real (drawer < 1024, sin riel) | A favor | En contra |
| --- | --- | --- | --- | --- | --- |
| 10-A | **Prop `breakpoints`** `{ expanded, rail }` en px de ancho del **contenedor** (por defecto `space × 240` / `× 150`, como hoy) | Instancia; reglas: `rail > expanded` se recorta a `expanded` con aviso; `rail == expanded` = sin riel | `:breakpoints="{ expanded: 1024, rail: 1024 }" mobile="drawer"` (verificado: 1000 → drawer, 1100 → expandida) | Explícito; cada sidebar con el suyo (navegación secundaria distinta); sin tocar el tema | Px en la plantilla; no sigue a `space` si el integrador lo cambia |
| 10-B | **Tokens** `--g-sidebar-expanded-min` / `--g-sidebar-rail-min` (derivados de `space`), que el `.vue` lee con `getComputedStyle` al medir | Tema; §13 | Los mismos valores en el tema | Un sitio para toda la aplicación; sigue a `space` | Un token que solo lee JS (no hay precedente; los umbrales eran «no tokens», #69); se resuelven en `:root` (§10) |
| 10-C | **`contentMin`**: el sidebar **cede para proteger el contenido**: expandida si `contenedor ≥ --g-sidebar-width + contentMin`, riel si `≥ --g-sidebar-rail + contentMin` (o nunca, con `rail: false`) | Prop, cortes derivados | `:content-min="760" :rail="false" mobile="drawer"` → expandida ≥ 1024 (verificado) | Razona en lo que importa (el ancho que le queda a la página); al cambiar `--g-sidebar-width` el corte se mueve solo | Cambia el corte del riel por defecto si se quiere conservar 960 en expandida (`contentMin` = 696 → riel ≥ 760, no 600): Δ en la banda 600–759 salvo un segundo valor |

## Hallazgo 11 · hueco del icono (elige el usuario)

| # | Propuesta | Cómo | Medido (círculo de 28 px de la aplicación) |
| --- | --- | --- | --- |
| hoy | `--_ico` = `space × 5`, privado | — | Desborda en la fila y en el riel |
| 11-A | **Token `--g-sidebar-icon-size`** (estructura, §13; por defecto `space × 5`, Δ0) | El hueco y la fila crecen con él (fila = máx(alto del item, icono + `space × 3`)); techo = celda del riel (44 px) | Sin desborde; **todos** los iconos crecen a la vez |
| 11-B | **El hueco adopta su hijo** cuando no es un `svg` (un `GAvatar`, un círculo propio), como el avatar en un hueco (#295) | Sin token; la fila crece; techo 44 px; los Lucide siguen a 20 px | Sin desborde; solo crece el que lo necesita |
| 11-C | **Solo el asiento de B** | Sin token: el círculo lo pone el componente y la aplicación pasa un icono normal | Sin desborde; solo si se elige B |

## Hallazgos para lima

| # | Hallazgo | Propuesta |
| --- | --- | --- |
| L1 | Ranuras del activo | Tres tokens de componente (punto 1) en `tokens.md` §13 y `sidebar.md` «Tokens consumidos»; valores en `defaults.css` (coco), Δ0 salvo decisión 1b |
| L2 | Pares | Registrar los pares del punto 3 por concepto como regla del contrato |
| L3 | CLI | Diagnóstico informativo (no rechazo, #228) de los pares en claro y oscuro y derivación del oscuro del punto 13 con respaldo `on-primary-soft`; si el tema no declara las ranuras, nada |
| L4 | Navbar y `color` | Hoy la píldora usa `--g-color-{color}` (prop `color`, #68). Si lee las ranuras, la prop pierde su único uso visible en la píldora. Opciones: (a) la prop `color` solo afecta a contadores e indicadores y la píldora lee las ranuras; (b) la píldora lee las ranuras solo cuando `color` no se pasa. kiwi recomienda (a): un actual, un sitio |
| L5 | Rama en el riel | El padre representante toma la marca completa (punto 8); hoy apenas se ve. Encargo a coco cuando se elija el concepto |
| L6 | H10 | Según la elección; con 10-A o 10-C, nuevas props en `meta.json` (#443); `mode-change` sigue igual |
| L7 | H11 | Según la elección; con 11-A, token nuevo en §13; con 11-B, regla del hueco en `sidebar.md` y `api.md` «Iconos en los componentes» (#202) |
| L8 | Personalidad | Registrar la decisión de forma elegida en `DECISIONS.md` (regla del usuario) |
| L9 | Para coco | Con C, el filo de la raíz pasa de `border-inline-end` a sombra interior; la regla del hover (hallazgo 1) debe cubrir también `.is-rep` del riel |

## Criterios revisados

| Criterio | Resultado |
| --- | --- |
| 1.4.3 Contraste del texto | Medido en 4 escenarios × 4 presets; el caso real con roles falla en oscuro (1.94) y el punto 13 lo corrige en su tema |
| 1.4.11 Contraste no textual | Una señal ≥ 3 en todos los presets que cumplen 1.4.3 (tabla) |
| 1.4.1 Uso del color | Peso + `aria-current` + forma (ficha, asiento lleno/hueco, lengüeta) |
| 2.4.7 Foco visible | Anillo fuera; medido ≥ 4.29:1 sobre la carcasa; comprobado con Tab |
| 2.3.3 Movimiento | Viaje, llenado y recogida se quitan con movimiento reducido (simulado en el prototipo y con la consulta) |
| 4.1.2 | Sin cambios: `aria-current` solo en el destino; las formas son `aria-hidden` |

## Comprobaciones ejecutadas (`node design/lab/sidebar/r02/verificar.mjs`, 11/11)

- Cada escenario tiene `aria-current`; 36+ `<nav>` con nombre; sin errores de consola.
- A: la ficha llega exacta al destino; a mitad de viaje mide 45 px (se estira); en el riel con «Todos» actual, la ficha está sobre el padre.
- B: el asiento del actual se llena (`clip-path: circle(75%)`); nodo y ruta del hijo.
- C: la lengüeta toca el filo del sidebar.
- Foco visible con Tab.
- H10: el caso real da drawer a 1000 px y expandida a 1100 px en 10-A, 10-B y 10-C.
- H11: hoy desborda; 11-A y 11-B no.
- Capturas en `forced-colors: active` (A, B, C) y a 375 px (sin scroll horizontal).

## Comprobaciones NO ejecutadas

- Firefox y WebKit (`clip-path` animado, `:has`, gradientes radiales de las esquinas de C).
- Lector de pantalla real (las formas son `aria-hidden`; no cambia la semántica, pero no se ha oído).
- El componente real: el prototipo reproduce el marcado del contrato, no `GSidebar.vue`.
- Rendimiento del viaje de A con cientos de items y scroll real.
- La derivación del CLI del punto 13 en los 13 temas del banco: medida solo en dos temas.

## Preguntas para el usuario

1. **Hallazgo 2:** (a) ¿cómo se marca el item actual: **A · Ficha que viaja**, **B · Asiento** o **C · Lengüeta**? (b) ¿El tema por defecto se queda **silencioso (Δ0)** o pasa a un **relleno con su par** (`primary`/`on-primary`, 15:1 frente a la carcasa)?
2. **Hallazgo 10:** ¿cortes por **10-A** (prop `breakpoints` por instancia), **10-B** (tokens del tema) o **10-C** (`contentMin`: el sidebar cede para proteger el contenido)?
3. **Hallazgo 11:** ¿hueco del icono por **11-A** (token de tamaño), **11-B** (el hueco adopta a su hijo, como el avatar) u **11-C** (solo el asiento, si se elige B)?
