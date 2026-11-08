# Declaración · marco del sitio de documentación, r01

> kiwi, 2026-11-08. Prototipo: `index.html?c=A|B|C&p=comp|home|guide` (`&theme=dark`, `&lang=en`, `&q=24` filtro de A, `&mesa=0` mesa vacía de C). Componentes **reales** de `packages/vue/dist/` con Vue global: `GAppShell`, `GSidebar`, `GPageHeader`, `GBreadcrumbs` (con puertas), `GCombobox appearance="palette"`, `GMenu`, `GBtn`, `GBadge`, `GIcon`, `GContainer`; **tokens reales del tema por defecto** (`grana.css` + `fonts.css`), claro y oscuro. Lo que no existe como componente (filtro del índice, estaciones, mesa) es del prototipo (`sitio.css`, solo `--g-*`; literal permitido: la pila monoespaciada del código, ver S-L7). Iconos solo Lucide (`design/lab/lucide-icons.js`). Datos: instantánea del índice real (`datos.js`, desde `site/src/.site-data.json` y los `meta.json`). Verificación: `node design/lab/sitio/r01/verificar.mjs` (puerto 4231) **411 de 411** en Chromium, Firefox y WebKit (§«Comprobaciones»). Brief y auditoría previa del marco actual: `brief.md`. Inventario de piezas sin componente: `inventario-componentes.md`. **Preguntas de producto: una (la forma del marco).**

---

## Parte 1 · Base funcional común (no depende de la forma)

### Regiones

1. **Un solo chasis: `GAppShell`.** Banda `header` (landmark `banner`), `nav` del índice global (cuando lo hay), **un** `main` y `footer` (`contentinfo`) fuera de `main`. Medido en los tres motores: 1 `banner`, 1 `main`, 1 `h1`, toda `nav` visible con nombre (`Documentación`, `Ruta`, `En esta página`). Contrato §3 «un solo marco» cumplido por construcción.
2. **La banda lleva:** marca (enlace a la portada), **estado de versión** (`GBadge` con `label` «Versión 0.1.0-beta.0»), miga (`GBreadcrumbs`), búsqueda, idioma (`GMenu` de enlaces con `lang`/`hreflang`/`current`, #743) y tema (`GBtn aria-pressed`). Alto de contrato del chasis (56 px); nada de lo de dentro la hace crecer.
3. **El encabezado de la página es `GPageHeader`** (primer hijo de `main`): antetítulo `Componente NN · grupo`, `h1`, entradilla, `meta` (estado `candidate` + línea de importación exacta). Es el destino del salto y del foco al navegar (`focus()`), y su zócalo/muelle aloja lo que debe quedar a mano al leer.
4. **Contenido en `GContainer`** (`width="full"`, `gutter="none"` en el prototipo para alinear `GPageHeader` y secciones; en el sitio real, `reading` + `prose` para guías y `xl` para fichas).
5. **Pie:** `GbFooter` en el slot `footer` (inventario #9); «páginas vecinas» como dos enlaces-tarjeta al final del contenido (inventario #8).

### Teclado, foco, anuncios

6. **Primer Tab = «Saltar al contenido»** (`GAppShell labels.skip`): medido en Chromium y Firefox; WebKit no tabula enlaces por defecto (S7 de app-shell, límite conocido, la prueba lo exime).
7. **`/` abre la búsqueda** fuera de un campo editable (`aria-keyshortcuts="/"`); en A enfoca el filtro del índice (en estrecho abre antes el drawer), en B y C enfoca el campo de la paleta y **la primera tecla abre la paleta sin perderse** (comportamiento de `GCombobox`, medido: «comb» → 3 resultados con vista previa y foco dentro). Se conserva ⌘K/Ctrl+K (hoy lo enseña VitePress) para no romper la costumbre.
8. **Esc:** en la paleta cierra y devuelve el foco al campo (medido 3/3); en el filtro de A lo vacía sin propagar (medido 3/3); en el drawer lo cierra (de `GSidebar`).
9. **Al cambiar de ruta** el foco va al `h1` (`GPageHeader.focus()`), con el título del documento actualizado: sin región viva propia. Recuentos de filtro y búsqueda: cortés, 600 ms (regla de `GCombobox`).
10. **La sección actual sigue a la lectura**: la que cruza la línea de lectura (un tercio del visor), con `aria-current="location"`. Medido: al llevar «Teclado y foco» a la vista, una sola estación actual y es §8 (3/3).
11. **Idioma con ruta equivalente:** el generador crea toda página en los dos idiomas (con «Translation pending»), así que cambiar es quitar o poner `/en/`; `GMenu` marca el actual con `current` y cada enlace lleva `lang` y `hreflang`.
12. **Tema:** `data-theme` antes de pintar (script del `<head>`, como hoy en `config.mjs`), botón `aria-pressed`. Tres estados (sistema/claro/oscuro) con `GRadioGroup appearance="segmented"` si el usuario lo quiere; el prototipo usa dos.

### Estrecho y táctil

13. **Sin desplazamiento horizontal a 375 y 320** en los tres conceptos, claro y oscuro, tres motores (medido).
14. **Táctil ≥ 44 px** en todo lo pulsable del marco con `pointer: coarse` (medido con el área de toque de `GBtn::after` y la caja del control de `GCombobox`, 44 px). Texto del marco ≥ 12 px.
15. **Contraste del texto del marco ≥ 4,5:1** claro y oscuro (medido sobre las clases del marco y las del sidebar); el número dentro del asiento lleno: `on-current` sobre `current` (P1 de `sidebar.md`, ≥ 4,5:1 medido).
16. **Movimiento:** el marco no anima nada propio; lo que se mueve es de los componentes (asiento de `GSidebar` con `--g-ease-spring`, hundido del zócalo de `GPageHeader`, superficie de `GDialog`), cada uno con su `prefers-reduced-motion`. Las estaciones de B solo funden color con `--g-duration-fast` y nada con movimiento reducido.

### Qué pieza de Grana cubre cada parte, y qué falta (para lima)

| Parte del marco | Pieza | Estado |
| --- | --- | --- |
| Chasis, salto, banda pegada, `scroll-padding` | `GAppShell` | **Cubre** |
| Índice global numerado con «estás aquí» | `GSidebar` + slot `icon` con el número | **Cubre** (el número es el contenido del asiento; sin API nueva). Falta **filtro en el slot `search`** o grupos plegables (S-L3) |
| Drawer en estrecho | `GSidebar mode="drawer"` + botón en la banda | **Cubre** (S8 de WebKit abierto) |
| Miga con hermanos | `GBreadcrumbs` con `children` (puertas) | **Cubre**; hallazgo S-H1 en estrecho táctil |
| Encabezado, título compacto, muelle | `GPageHeader` | **Cubre** |
| Búsqueda | `GCombobox appearance="palette"` | **Casi**: modo comando, `open()`, disparador compacto, fragmento (S-L1) |
| Idioma | `GMenu` con elementos-enlace | **Cubre** |
| Tema | `GBtn aria-pressed` / `GRadioGroup segmented` | **Cubre** |
| Versión | `GBadge` | **Cubre** |
| Índice de la página con sección actual | — | **Falta** (`GPageIndex`, S-L2; inventario #2) |
| Navegación de secciones del sitio arriba (Guía · Componentes · Blocks…) | — | **Falta** (`GNavBar`, inventario #1) si el usuario la quiere; ninguno de los tres conceptos la necesita |
| Bloque de código con copiar | — | **Falta** (`GCode`, inventario #4), es contenido, no marco |
| Región final pegada (mesa de C) | `GSplit` | **`sticky` reservado** con condiciones (S-L5 de split) |

---

## Parte 2 · Tres conceptos

Los tres parten de una pregunta: **¿qué es lo primero que busca quien abre una ficha de componente?** El patrón de los frameworks responde «todo a la vez» (barra superior + barra lateral + índice derecho) y deja a la ficha viva, que es el producto, 624 px de 1280. Cada concepto quita una de las tres columnas por una razón distinta.

### A · El índice se escribe

**Premisa cuestionada:** «la búsqueda es una ventana aparte del índice». Aquí **el índice es la búsqueda**: un campo en la cabecera del `GSidebar` filtra la lista en su sitio mientras escribes, y **cada componente tiene un número estable** (01–78, el orden del índice) que vive **dentro del asiento** del item (#612): lleno = estás aquí. El índice derecho desaparece: «En esta página» pasa al **zócalo de `GPageHeader`** como un relevo («En esta página · API ⌄», un `GMenu` de enlaces) que cambia con la lectura y se queda pegado.

**Estructura:** `GAppShell` › banda (versión, miga, idioma, tema) · `GSidebar expanded` (marca, filtro, grupos: Empezar con iconos, los diez grupos de componentes numerados, Blocks, Herramientas, Proyecto) · `main` › `GPageHeader` (zócalo con el relevo y «Copiar importación») › secciones. Estrecho: drawer con el filtro; el relevo baja al muelle de `GPageHeader`.

**Comportamiento medido (3/3 motores):** `/` enfoca el filtro; «24» deja solo `GCombobox`; «oscuro» no coincide con ningún título y aparece el grupo «En el texto» con la sección «Tematización · Modo oscuro», con el recuento anunciado; Esc vacía y vuelve a 90 entradas; el relevo dice «API» al leer la API. La columna de contenido pasa de 624 a ~950 px a 1280.

#### Qué lo hace distinto (A)

- **Los números son direcciones.** Quien vuelve a consultar aprende que el combobox es «24» como aprende una extensión de teléfono: `/` `2` `4` Intro, sin mirar. Y el evaluador ve de un vistazo que hay 78 piezas y en qué orden se piensan (estructura → acciones → campos → formularios → datos…).
- **Filtrar no saca de la página:** la lista se encoge donde ya estaba la mirada; la paleta modal solo aparece para el texto completo.
- **El índice de la página no ocupa una columna:** cabe en el zócalo que ya está pegado; la ficha viva gana un 50 % de ancho.

### B · Coordenadas fijas

**Premisa cuestionada:** «la navegación global es un mueble fijo en cada página». En una ficha, lo que más se navega es **la propia ficha**; B quita la barra lateral global y convierte **el índice de la página en la navegación principal**: un riel de **estaciones con el número de contrato §3** (§4 Prueba en vivo, §6 Ejemplos, **§7 API**, §8 Teclado y foco, §9 Accesibilidad, §10 Personalidad, §11 Tema, §12 Alcance, §13 Verificación), el mismo número en cada componente, con el actual relleno como el asiento. Lo global se alcanza por la **miga con puertas** (`GBreadcrumbs` C: «Componentes ⌄ / Campos de entrada ⌄ / GCombobox», cada puerta abre los hermanos) y por la **paleta siempre presente** en la banda (`GCombobox palette` con vista previa: número, estado y grupo antes de ir; las secciones de otras fichas también son resultados, «GSelect · §8 Teclado y foco»). **La portada es el catálogo**: los 78 numerados, por grupo, como contenido.

**Estructura:** `GAppShell` sin `nav` › banda (marca, versión, miga con puertas, paleta, idioma, tema) · `main` › [estaciones pegadas | `GPageHeader` + secciones con «§N» delante del `h2`]. Estrecho: miga en el `trail` de `GPageHeader` (etapa «↑ Campos de entrada / GCombobox ⌄» a 320, medido), estaciones como relevo en el muelle.

**Comportamiento medido (3/3):** una sola estación actual (§8 al leer el teclado); estaciones pegadas bajo la banda (top 88 px); `/` + «comb» abre la paleta con la tecla conservada, foco dentro y vista previa; Esc vuelve al campo; portada con los 78.

#### Qué lo hace distinto (B)

- **El mismo dato está siempre en el mismo sitio.** «§7 es la API» en las 78 fichas: el ojo y el dedo aprenden la posición, como las secciones de una norma. Es el contrato de documentación (§3) hecho visible; hoy existe en el papel y nadie lo ve.
- **Moverse entre hermanos es una puerta, no una lista de 90:** de `GCombobox` a `GSelect` sin salir de la miga.
- **El marco cambia con la página:** la portada es catálogo (para quien evalúa), la guía es lectura con sus estaciones locales, la ficha es referencia. Ninguna paga el mueble de las otras.

### C · Mesa de consulta

**Premisa cuestionada:** «la documentación se lee de página en página». Quien integra Grana compone varias piezas a la vez (un `GForm` con un `GCombobox` dentro) y hoy salta de ficha en ficha perdiendo lo que miraba. C deja **fijar** cualquier sección (props, teclado, un token) en una **mesa** a la derecha que **acompaña al navegar** (sesión del navegador): lees la guía de formularios con la API del combobox al lado. El índice global se vuelve un **riel numerado** (`GSidebar rail` + `overlay`: los números en los asientos, la pista con el nombre) y «En esta página» una **línea de enlaces** bajo el encabezado.

**Estructura:** `GAppShell` › banda (miga, paleta, «Mesa 2», idioma, tema) · `GSidebar rail overlay` · `main` › [página | mesa pegada con desplazamiento propio]. Estrecho: la mesa es una **lengüeta en la zona del pulgar** («Mesa · 2») que la abre como hoja.

**Comportamiento medido (3/3):** fijar añade a la mesa y el botón queda `aria-pressed="true"` con nombre «Quitar «API» de la mesa»; al ir a la guía la mesa sigue con lo fijado.

#### Qué lo hace distinto (C)

- **La referencia viaja contigo.** Es la memoria de trabajo de quien integra: nada de pestañas del navegador ni de volver atrás.
- **El sitio deja de ser un libro y se vuelve una mesa de trabajo**, que es como se usa una librería de componentes al construir.

---

## Parte 3 · Comparativa

| | A · El índice se escribe | B · Coordenadas fijas | C · Mesa de consulta |
| --- | --- | --- | --- |
| Columnas a 1280 | índice global + página (≈ 950 px) | estaciones (208) + página (≈ 900 px) | riel (64) + página + mesa (336) |
| Sirve mejor a | quien vuelve a consultar (número, filtro) | quien vuelve **y** quien evalúa (portada catálogo) | quien integra varias piezas |
| Búsqueda | filtro en el índice + «En el texto» | paleta en la banda, con vista previa | paleta en la banda |
| Índice de la página | relevo en el zócalo (`GMenu`) | estaciones §N (riel propio) | línea bajo el encabezado |
| Global | `GSidebar` expandido | miga con puertas + paleta | riel numerado `GSidebar` |
| Cambia entre portada / guía / ficha | poco (mismo marco) | **mucho** (catálogo / lectura / referencia) | poco |
| Componentes nuevos que exige | `GPageIndex` (forma compacta) | `GPageIndex` (forma riel) | `GPageIndex` (forma línea) |
| Enmiendas que exige | `GSidebar` filtro en `search` | `GCombobox` modo comando + `open()`; `GBreadcrumbs` S-H1 | `GCombobox` como B; `GSplit sticky` (S-L5 de split) |
| Dependencia del contenido | ninguna | **las secciones deben seguir el orden §3** (hoy no, H2) | extractos fijables por sección |
| Riesgo de accesibilidad | bajo (filtro con recuento cortés, Esc) | medio: lector de pantalla y estación «§10» (leer «párrafo 10»: `aria-label` sin «§» o texto oculto «sección 10») | medio: región pegada con foco tapado si no cabe (K11 de split); hoja en estrecho |
| Riesgo de rendimiento | 90 items del sidebar se rehacen al teclear (medir; hoy imperceptible) | índice de búsqueda ≈ 1,6 MB al primer uso (igual que hoy) | `sessionStorage`; mesa con extractos clonados del DOM (no reconstruir la ficha viva) |
| Coste | bajo | medio | alto |

---

## Parte 4 · Hallazgos (para sus dueños)

- **S-L1 (lima, `GCombobox`):** modo comando (elegir navega y no deja valor; hoy el prototipo vacía el modelo en el siguiente ciclo), método `open()` para atajos globales, disparador compacto de solo icono, fragmento coincidente. Inventario #3.
- **S-L2 (lima + kiwi):** `GPageIndex`, índice de página con sección actual, tres formas (compacta en `GMenu`, riel, línea) y condiciones de pegado de `GSplit` S-L5. Inventario #2.
- **S-L3 (lima, `GSidebar`):** el slot `search` admite hoy un campo (el prototipo lo hace), pero el contrato lo describe como botón; contratar «filtro del índice» (anatomía, Esc, recuento, la aplicación filtra `items`) solo si se elige A.
- **S-L4 (lima):** `aria-current="location"` para la sección actual de un índice de página (no `page`): registrarlo en `api.md` junto a «Paneles anclados» o donde viva la regla de `aria-current`.
- **S-L5 (lima, `GSplit`):** C depende de `sticky` (reservado, BK-L1); cumplir sus cuatro condiciones.
- **S-L6 (lima):** sin `GNavBar` (inventario #1), la banda del sitio no tiene la fila «Guía · Componentes · Blocks · Playground · Cambios»; en A y C la hace el índice, en B la miga + la portada. Si el usuario la quiere, es ronda propia.
- **S-L7 (lima, tokens):** no hay token de fuente de código (`--g-font-mono` o similar); el sitio usa la de VitePress y el prototipo una pila literal. Necesario para `GCode`.
- **S-H1 (coco + bruno, `GBreadcrumbs`):** a 375 con `pointer: coarse` y tres niveles con dos puertas, la ruta se queda en «Componentes › Ca… › GCombob…» con las puertas en círculos de 44 px en vez de ceder a la etapa «Subir · página» (que sí aparece a 320). Medir los umbrales de cesión con puertas en táctil (captura `A-375-oscuro.png`).
- **S-H2 (mora-docs):** H1 portada «64 componentes» (son 78); H2 «Props» y «Referencia de la API» duplicadas; orden de secciones distinto del contrato §3 (bloquea B).
- **S-H3 (bruno):** `design/lab/lucide-icons.js` sin `sun`, `moon`, `monitor`, `languages`, `pin` (el prototipo dibuja el tema con un disco y fija con `paperclip`).
- **S-H4 (kiwi, siguiente ronda):** la versión desaparece de la banda en estrecho (no cabe); llevarla al drawer o al pie.

## Motor: mantener VitePress (confirmado, con evidencia)

**Recomendación: mantener VitePress 1.6.4 y sustituir solo el `Layout` del tema** (`extends: DefaultTheme` → un `Layout.vue` propio hecho con Grana, sin `DefaultTheme.Layout`).

- **Lo que se conserva sin tocar:** Markdown y rutas (`srcDir: 'src'`, `cleanUrls`), SSG para GitHub Pages (`base: '/grana/'`), `generate.mjs` (páginas, `sidebar`/`blocksSidebar`, aviso «Translation pending»), `generate.test.mjs`, `check-live.mjs`, `ignoreDeadLinks: false`, el aislamiento de estilos (`postcssIsolateStyles` + capa `vitepress`, #516) y los componentes del sitio (`GranaLive`, `GranaDemo`, `ThemePlayground`, `BlockBank`), que ya son Grana.
- **API pública que necesita el `Layout` propio** (exportada por `vitepress`, `dist/client/index.d.ts`): `Content`, `useData` (`page`, `frontmatter`, `theme`, `lang`, `isDark`, `localeIndex`), `useRoute`, `useRouter` (para `navigate` de `GSidebar`/`GBreadcrumbs`/`GMenu`: `preventDefault` + `router.go`, regla #505), `onContentUpdated` (rehacer el índice de la página tras cada ruta), `withBase`, `inBrowser`.
- **Riesgo 1 · búsqueda:** el índice local llega por el módulo virtual **`@localSearchIndex`** (lo importa `VPLocalSearchBox.vue`; no está documentado como API). Un tema propio puede importarlo igual con `search.provider: 'local'`, cargar MiniSearch al primer uso y responder a `search` de `GCombobox` con `filter: false` (#332: la carga es de la aplicación). Mitigación: fijar la versión menor de VitePress y una prueba que falle si el módulo cambia de forma.
- **Riesgo 2 · SSR e hidratación:** `GCombobox` tiene pruebas SSR e hidratación (`GCombobox.ssr.test.js`, `.hydration.test.js`) y la revisión #1033 dejó solo `GEmpty` con desajuste (ya corregido). `GSidebar mode="auto"` mide su padre en el cliente: en SSR el primer pintado depende de la reserva por CSS de `GAppShell` (#712, `is-ready`); medir con `docs:build` + `vitepress preview` que nada salte al hidratar. Fijar `mode` según la forma elegida reduce el riesgo.
- **Riesgo 3 · ruta equivalente de idioma:** `useLangs({ correspondingLink })` es interno del tema por defecto (`theme-default/composables/langs.js`); se reimplementa (quitar/poner `/en/`), trivial porque el generador garantiza la página gemela.
- **Riesgo 4 · índice de la página:** `outline.js` (`getHeaders` por DOM) es interno; el `Layout` propio lee los `h2`/`h3` con `onContentUpdated` (o los da `generate.mjs` como dato, mejor para SSR: el índice sale en el HTML estático).
- **Riesgo 5 · desplazamiento a anclas:** VitePress usa `getScrollOffset` para la banda; con `GAppShell` el desplazamiento lo resuelve `scroll-padding-block-start` (#713). Quitar `scrollOffset` del config para no contarlo dos veces.
- **Reescribir** (Vite + Vue Router + prerender propio) no aporta nada que el marco necesite y obliga a rehacer Markdown, búsqueda, SSG y comprobación de enlaces. No se recomienda.

## Comprobaciones (verificar.mjs)

Por concepto × tema (claro, oscuro) × ancho (1280, 375, 320) × motor: consola limpia; 1 banner, 1 main, 1 h1; `nav` con nombre; sin desplazamiento horizontal; primer Tab al salto (WebKit eximido, S7); táctil ≥ 44 (estrecho); contraste ≥ 4,5:1 del marco y del número en el asiento lleno. Más los comportamientos de A, B y C descritos arriba. **411/411** (Chromium, Firefox, WebKit), 2026-11-08. Capturas: `{A,B,C}-{1280,375,320}-{claro,oscuro}.png` + `A-1280-claro-filtro.png`, `A-1280-claro-lectura.png`, `B-1280-claro-lectura.png`, `B-1280-claro-paleta.png`, `B-1280-claro-portada.png`, `C-1280-claro-guia.png` (Chromium).

**No verificado:** lector de pantalla real (estaciones «§N», filtro con recuento, mesa), Safari real y táctil real, `forced-colors`, rendimiento del filtro con el sitio real, SSR del marco (el prototipo es cliente puro), texto al 200 %, RTL.

---

## Pregunta para el usuario

**¿Qué forma quieres para el marco del sitio: A · El índice se escribe (índice numerado que se filtra, «En esta página» en el zócalo), B · Coordenadas fijas (sin barra global, estaciones §N iguales en cada ficha, miga con puertas, portada catálogo) o C · Mesa de consulta (riel numerado y una mesa que conserva lo fijado al navegar)? Se pueden mezclar piezas (p. ej. B con los números de A en la paleta y la portada).**
