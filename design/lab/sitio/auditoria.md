# Auditoría de coco · sitio calcado con Grana (#1052 a #1072)

Paso 5 del flujo sobre el **sitio construido real** (`npm run build` + `cd site && npm run docs:build` + `vitepress preview`, puerto 4246), no sobre un banco. Componentes auditados en su uso real: `GNavBar` (`@grana/vue/nav-bar`), `GSidebar appearance="index"` con grupos plegables y filtro (`sidebar-index`, `sidebar-filter`), `GPageIndex appearance="list"` y `fold` (`page-index-list`), `GCombobox appearance="command"` y el chasis `GAppShell header="pinned-wide"` con barra local y `cover`. Reglas: `docs/documentacion/auditoria-visual.md` (antes y después) y `docs/documentacion/rubrica-movimiento.md`.

**Temas:** el por defecto y **`caracol-purpura`** (generado por `@grana/cli`, `design/lab/tema-oscuro/dark-color-presence/generated/caracol-purpura.css`: radios 9–35 px, acento púrpura), inyectado sin capa después de la hoja del sitio, como lo haría una aplicación; los dos en claro y en oscuro.

**Verificación propia:** `GRANA_SITE_PORT=4246 node design/lab/sitio/auditoria-verificar.mjs` (reescrita para el calco; la del concepto A medía piezas que ya no existen). Resultado sobre el estado final: **472/472** (estático 16/16, Chromium 166/166, Firefox 129/129 —sin táctil ni `forced-colors`, que Firefox no emula—, WebKit 161/161 —sin `forced-colors`—). En WebKit el foco por teclado se mide con Opción+Tab (Tab de Safari no recorre enlaces). La medida «sin JS» del paso 7 corta los módulos `.js` en vez de desactivar JavaScript: Firefox no evalúa nada con `javaScriptEnabled: false` y la versión anterior se quedaba colgada ahí.

## Auditoría previa (estructura antes de medir)

| Aspecto | Estado | Evidencia |
| --- | --- | --- |
| Estructura | Cumple | Banda de 64 (`GAppShell` + `GNavBar`), índice a la izquierda (272), barra local (Menú + «En esta página» plegada) bajo 1280, contenido, columna «En esta página» a la derecha ≥ 1280; búsqueda como superficie hermana del chasis |
| Jerarquía | Cumple | Marca y enlaces de sección en la banda; títulos de grupo 700 sobre items 500 `text-muted`; la actual en `accent-text` en barra, índice y columna |
| Delimitación | Cumple | La banda y la columna izquierda con su línea `border`; la búsqueda con velo y superficie; el cajón con velo |
| Controles | Cumple | Filtro del índice en la banda del índice con `/`; búsqueda con ⌘K/Ctrl+K; idioma y tema en la banda; «…» y pantalla de menú en estrecho |
| Listas | Cumple | Filas de 32, sin divisores (calco), marca y marcador para la actual, luz que se desliza bajo el puntero |
| Estados | Cumple | Hover (luz), foco, actual, plegado/abierto, filtrando con recuento, vacío del filtro, búsqueda cargando (índice de ≈ 3 MB) y sin resultados |
| Consistencia | Cumple | Todo con componentes de Grana y `var(--g-*)`; el tema del sitio (`grana-site.css` «Tema del sitio») solo fija valores de tokens; sin `.VP*` |

## Mediciones (después de implementar)

Cifras mínimas medidas en Chromium (`--verbose`); Firefox y WebKit pasan los mismos umbrales (no se tabulan sus cifras):

| Pieza | Defecto claro | Defecto oscuro | caracol claro | caracol oscuro | Mínimo |
| --- | --- | --- | --- | --- | --- |
| `GNavBar` enlaces (el menor es la actual) | 5,69 | 4,95 | 4,94 | 4,98 | 4,5 |
| `GNavBar` enlace bajo la luz P1 | ≥ 4,5 | ≥ 4,5 | ≥ 4,5 | ≥ 4,5 | 4,5 |
| Índice: items, actual y código | 5,27 · 4,72 (código) | 5,12 | **4,56** | 5,14 | 4,5 |
| Índice: título de grupo | 16,10 | 17,00 | 16,13 | 17,00 | 4,5 |
| Índice: marca del actual (forma) | 5,27 | 5,12 | 4,56 | 5,14 | 3 |
| «En esta página»: enlaces | 7,46 | 9,29 | 7,49 | 9,30 | 4,5 |
| «En esta página»: marcador (forma) | 5,69 | 4,95 | 4,94 | 4,98 | 3 |
| Búsqueda: opción · activa · pistas | 16,10 · 6,90 · 6,90 | 17,00 · 9,59 · 9,59 | 16,13 · 6,91 · 6,91 | 17,00 · 9,60 · 9,60 | 4,5 |
| Foco: barra, título de grupo, filtro, columna, campo de búsqueda | ≥ 3 en todos | ≥ 3 | ≥ 3 | ≥ 3 | 3 |

- **Tamaños:** enlaces de la barra 64 de alto (la banda), filas del índice y títulos de grupo 32; en táctil (375 y 390, Chromium y WebKit, los dos temas) la hamburguesa y la búsqueda de la banda reciben el toque a ±21 px (44), y «Menú», el plegado de «En esta página», los enlaces de la pantalla de menú y los items y grupos del cajón a ±12 px (24).
- **Foco:** Esc en la búsqueda devuelve el foco a «Buscar»; el anillo del campo de búsqueda es el borde `--_focus` más el anillo por dentro de `__search`.
- **RTL** (`dir="rtl"` emulado; el sitio no tiene idioma RTL): sin desplazamiento horizontal; la marca del índice y el marcador de «En esta página» pasan a la derecha (lado inicial); la luz P1 queda bajo el enlace (Δ ≤ 1 px).
- **Movimiento reducido:** la luz, la marca, el marcador, el plegado del grupo y su chevron no declaran desplazamiento, giro ni cambio de tamaño; la búsqueda abre sin animación de transformación.
- **forced-colors** (Chromium): la actual de la barra con subrayado del sistema, la marca y el marcador con `Highlight` (`forced-color-adjust: none`), la banda con borde y la opción activa de la búsqueda con señal propia.
- **SSR = hidratado** a 1280 y 375: banda, lista de la barra, marca, búsqueda, índice, barra local, h1 y columna en el mismo sitio (Δ ≤ 1 px), sin desplazamiento horizontal.
- **Consola** limpia en todas las vistas medidas.

## Rúbrica de movimiento

| Pieza | A Propósito | B Comodidad | C Estabilidad | D Interrumpible | E Control | F Accesibilidad | G Rendimiento | H Inmersión |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Luz P1 de `GNavBar` | Cumple: dice dónde está el puntero y deja el color a la actual | Cumple: una capa de 32, sin rebote | Cumple: capa absoluta, la barra no cambia de medida | Cumple: transición `press` 160 ms, parte de donde está | Cumple: solo el puntero | Cumple: reducido = fundido; sin capa en `forced-colors` | Cumple: `nav-bar.spec` sin tareas largas (Chromium) | N/A |
| Marca del índice (`is-far`) | Cumple: lleva la vista a la página elegida | Cumple: muelle solo en viajes ≤ 1,5 filas (rebasa ≈ 1,2 px); con distancia `ease-out` sin rebasar | Cumple: se mueve dentro de la columna | Cumple: transición | Cumple | Cumple: reducido = salto con fundido; `Highlight` | Cumple | N/A |
| Plegado de grupos | Cumple: el grupo crece desde su título | Cumple: `slow` + `ease-out`, sin rebote | Parcial: lo de debajo se desplaza (propio del plegado, provocado por el usuario) | Cumple | Cumple: botón con `aria-expanded` | Cumple: reducido = al instante | Cumple | N/A |
| Columna que se sigue sola (PI-P1) | Cumple: mantiene a la vista la sección leída | Cumple: `scrollBy` suave dentro de la columna | Cumple: nada mueve la página | Cumple: un desplazamiento nuevo parte de donde está; salto grande instantáneo | Parcial: no se desactiva aparte (sí con movimiento reducido) | Cumple: reducido = instantáneo | Cumple: `page-index` 200 secciones, tareas < 50 ms (prueba sola, #965) | N/A |
| Pantalla de menú | Cumple | Cumple: entrada común de #1002 | Cumple: cubre bajo la banda, la banda no se mueve | Cumple | Cumple: la hamburguesa (pasa a `x`) la cierra; Esc | Cumple | Cumple | N/A |
| Cajón | Cumple | Cumple: velo 0,6 del calco | Cumple | Cumple | Cumple: Esc, velo y cerrar | Cumple | Cumple | N/A |
| Búsqueda modal | Cumple | Cumple: sin escala; velo | Cumple: la página queda inerte, no se desplaza | Cumple | Cumple: Esc y velo cierran, el foco vuelve a «Buscar» | Cumple | Parcial: la primera búsqueda carga un índice de ≈ 3 MB (≈ 6 s en Chromium) con estado «cargando» | N/A |

**Resumen:** el movimiento es de comportamiento y nunca mueve la página; todo es interrumpible y tiene rama reducida y de colores forzados. **Riesgos:** (1) la carga del índice de búsqueda (Medio, G; del sitio); (2) PI-P1 sin interruptor propio (Bajo, E); (3) el plegado desplaza lo de debajo (Bajo, C; inherente). **Límites:** trackpad inercial, lector de pantalla real, Safari y táctil reales: **No verificable** aquí.

## Pasada completa del cierre (estado final, 2026-11-09)

| Verificación | Resultado |
| --- | --- |
| `npx vitest run` · `@grana/vue` | 4520/4523 en la pasada con carga; los 3 que fallaron por tiempo (`GAdaptiveLayout` avisos 9,7 s, `GCombobox` `Intl` 7,8 s, `GTabs` is-ready) pasan solos: 291/291 en sus tres archivos. La primera pasada del lote dio 4523/4523 |
| `npx vitest run` · `@grana/cli` | 188/188 (187/188 antes de H1) |
| `npm run build` · compuertas | build sin error; `gates.sh` 186/186; las tres de `CLAUDE.md` pasan |
| `check-icons` · `check-readme-props` · `check-readme-fragments` · `check-motion` | pasan (1039 props; 84 hojas, 0 fallos de movimiento) |
| `design/lab/avisos-dev/verificar.mjs` | 13/13 |
| `site` `docs:build` (con `generate`) | sin error |
| `node --test site/scripts/generate.test.mjs` | **28/29** tras promover (H6); 29/29 antes |
| `check-pages.mjs` | 112/112 páginas |
| `check-live.mjs` | 75/75 fichas en Chromium, Firefox y WebKit (`GAppShell` declara «vista previa no disponible» a propósito: un chasis por documento) |
| `site/tests/site.spec.mjs` | 104 pasan, 1 omitida por diseño (Firefox sin `isMobile`) |
| `site/tests/paridad.mjs` | 2010/2010 (670 por motor) |
| Specs del lote (`nav-bar`, `page-index`, `page-index-list`, `sidebar-index`, `sidebar-filter`, `combobox-command`, `app-shell-wide`, `--workers=1`) | 199 pasan, 11 omitidas por diseño (longtask y `forced-colors` solo en Chromium, `isMobile` en Firefox), 0 fallos |
| Rendimiento solo y sin vecinos (#965) | `page-index` 200 secciones < 50 ms en los tres motores y `sidebar-filter` 500 destinos < 16 ms por tecla en Chromium: 4/4 (2 omitidas por diseño) |
| `design/lab/sitio/auditoria-verificar.mjs` | 472/472 |

## Hallazgos

- **H1 (bruno, corregido por coco por trivial y bloqueante):** `packages/cli/src/defaults.js` no llevaba `--g-sidebar-group-title-weight` (lo añadí a `defaults.css` en 3e6dd6fe, #1064) y `test/derive.test.js` de `@grana/cli` fallaba (187/188). Regenerado con su propio `node packages/cli/scripts/sync-defaults.mjs` (+1 línea); 188/188. Lo vigila el propio test: al tocar `defaults.css`, ejecutar `sync-defaults`.
- **H6 (mora-docs, bloquea la compuerta del sitio):** al pasar `GNavBar` y `GPageIndex` a `candidate`, `site/scripts/generate.test.mjs` exige su ficha interactiva y falla 28/29: «candidate sin ficha interactiva: GNavBar, GPageIndex». Faltan `site/live/GNavBar.js` y `site/live/GPageIndex.js` (y que la página las monte); hasta entonces `check-live` no recorre estos dos componentes.
- **H2 (mora-docs):** los README de `GNavBar` y `GPageIndex` dicen `draft` y «falta la auditoría de coco»; pasan a `candidate` en este cierre.
- **H3 (bruno):** los `pending` de `GNavBar.meta.json` y `GPageIndex.meta.json` siguen nombrando la auditoría de coco como pendiente; solo cambié `status` (delegado). En `GPageIndex` queda además la nota «el marcador sí se pinta en `fold` no tiene sitio en la anatomía» (lima/bruno).
- **H4 (motor de tema, `PENDIENTES.md` §5):** con `caracol-purpura` en claro el item actual del índice da **4,56:1** (margen 0,06) sobre `surface-sunken`; es el caso de #1072 (`accent-text` garantizado solo contra `surface`). Pasa, pero sin colchón.
- **H5 (entorno):** el shell de esta sesión usa Node 20.20 aunque `.nvmrc` pide 22; todo pasó con 20.

## Estados promovidos

`GNavBar` y `GPageIndex`: `draft` → **`candidate`** (solo la línea `status` del `meta.json`, delegada en este lote). `GSidebar`, `GCombobox` y `GAppShell` ya eran `candidate` y siguen así: sus partes nuevas (`index`, filtro, `command`, `pinned-wide`) pasan esta auditoría.

## Cumplimientos / Correcciones / Pendientes

- **Cumplimientos:** contraste, foco, tamaños, RTL, movimiento reducido, `forced-colors` e hidratación de las cuatro piezas en dos temas × claro/oscuro y tres motores; rúbrica de movimiento sin «No cumple».
- **Correcciones:** H1 (sincronía de `defaults.js`); verificador del sitio reescrito para el calco.
- **Pendientes:** H6 y H2 (mora-docs), H3 (bruno/lima), H4 (motor de tema); entorno real (lector de pantalla, trackpad inercial, Safari y táctil reales, `forced-colors` real).
