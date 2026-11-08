# Referencia · el sitio anterior (VitePress 1.6.4 vestido con tokens de Grana)

> kiwi, 2026-11-08. Estado medido: el árbol en `887c3779^` (1d11c448), construido en un worktree temporal (`npm install`, `npm run build` de `@grana/vue` y `@grana/blocks`, `npm run docs:build`) y servido con `vitepress preview` en el puerto 4237. Medición: `node design/lab/sitio/referencia/medir.mjs` (Chromium, `deviceScaleFactor` 1) → `medidas.json` (44 vistas × 63 piezas, 18 estados, recorrido de Tab) y las capturas de esta carpeta. El worktree se quitó al terminar; para repetirlo: `git worktree add <scratch>/sitio-antes 887c3779^` y los mismos pasos.
>
> **Cómo leer los colores:** el tema de entonces no pintaba con `--g-*` directamente, sino con las variables de VitePress **redirigidas** a tokens de Grana en `site/.vitepress/theme/grana-site.css` (sin capa). La columna «token» da esa cadena (`--vp-c-brand-1` → `--g-color-accent-text`) y se comprobó contra el color resuelto en claro y oscuro (`tokens` de `medidas.json`). Donde VitePress usa un color propio que no pasa por esa hoja se dice.

## Capturas

| Vista | Archivos |
| --- | --- |
| Portada, Empezar, GCombobox, Blocks × 1280/1024/768/375/320 × claro/oscuro | `{portada,empezar,combobox,blocks}-{1280,1024,768,375,320}-{claro,oscuro}.png` (40) |
| Lectura a mitad de la ficha (marca del índice) | `combobox-{1280,375}-{claro,oscuro}-lectura.png` |
| Hover de «Blocks» | `estado-hover-1280-{claro,oscuro}.png` |
| Foco por teclado en la barra (5.º Tab) | `estado-foco-1280-{claro,oscuro}.png` |
| Menú de idioma abierto | `estado-idioma-1280-{claro,oscuro}.png` |
| Búsqueda abierta («comb») | `estado-busqueda-1280-{claro,oscuro}.png` |
| «…» a 1024 (idioma y apariencia recogidos) | `estado-mas-1024-{claro,oscuro}.png` |
| Menú móvil abierto | `estado-menu-movil-375-{claro,oscuro}.png` |
| «En esta página» desplegado en estrecho | `estado-en-esta-pagina-375-{claro,oscuro}.png` |
| Índice lateral como cajón | `estado-drawer-375-{claro,oscuro}.png` |

## 1. Puntos de corte (del visor, no de la caja)

| Visor | Barra superior | Índice izquierdo | «En esta página» | Barra local (48 px) |
| --- | --- | --- | --- | --- |
| ≥ 1280 | fija; marca, búsqueda con texto, 6 enlaces, idioma, tema | columna fija de 272 | **columna derecha** de 224 (+32 de separación) pegada | no |
| 960–1279 | fija; idioma y tema pasan a **«…»** (44 × 64) | columna fija de 272 | desplegable en la barra local | sí, pegada bajo la barra (`top` 64): solo «En esta página» |
| 768–959 | **no fija** (se va con la página); 6 enlaces, búsqueda solo icono, «…» | cajón (320, o `100% − 64` si es menor) | desplegable | sí, **pegada a 0**: «Menú» (abre el cajón) + «En esta página» |
| < 768 | no fija; marca, lupa (48 × 36) y hamburguesa (48 × 64) | cajón | desplegable | sí, pegada a 0 |

Además, ≥ 1440 VitePress ensancha la columna izquierda y centra el contenido (no medido: fuera de los cinco anchos pedidos). Sin desplazamiento horizontal en ninguna vista (`scrollWidth` = ancho) salvo **1 px de más del «…» a 1024** (982,3 + 44 = 1026,3: lo tapa la barra fija).

## 2. Barra superior (`.VPNav` / `.VPNavBar`)

| Pieza | Medida (≥ 1280 salvo nota) | Tipografía | Color · token |
| --- | --- | --- | --- |
| Barra | alto **64**; ancho del visor; `position: fixed`, `z-index` 30 (≥ 960); `relative` (< 960) | — | fondo `--vp-nav-bg-color` → `--g-color-bg`; **sin sombra** |
| Línea inferior | 1 px; con índice izquierdo empieza en x = 272 (no cruza la columna); sin índice, todo el ancho | — | `--vp-c-gutter`/`divider` → `--g-color-border` |
| Portada, arriba del todo | barra **transparente y sin línea** (`.home.top`); al desplazar, fondo `bg` y línea | — | — |
| Relleno lateral | 32 (≥ 768); 24 (< 768) | — | — |
| Marca (`.VPNavBarTitle`) | logo 24 × 24, separación 8, texto | **Instrument Serif 20/24, 400** (Google Fonts) | `--g-color-text` |
| Marca con índice izquierdo | la caja mide 272 − 32 = **208** y lleva **borde inferior 1 px** (`--g-color-border`) sobre el fondo hundido de la columna: la marca «pertenece» a la columna | | fondo de la columna `--g-color-surface-sunken` |
| Búsqueda (botón) | 174 × **36**, radio 40 (sin fondo visible), a 48 px del borde de la columna; < 768: solo lupa 48 × 36 | «Buscar» 16 / 500, `text-muted`; atajo «⌘ K» en dos `kbd` 20 × 18 (radio 3) | `--vp-c-text-2` → `--g-color-text-muted` |
| Enlaces (6) | alto **64** (toda la barra), relleno 0 12, sin separación extra; anchos: Guía 54, Componentes 117, Blocks 66, Playground 99, Cambios 82, GitHub 86 (= 504 en total) | **Instrument Sans 14 / 64 (interlineado = alto), 500** | reposo `--vp-c-text-1` → `--g-color-text` |
| Enlace actual (`activeMatch`) | igual que reposo, **solo cambia el color**; sin subrayado, fondo ni peso | 14 / 500 | `--vp-c-brand-1` → `--g-color-accent-text` |
| Hover | **el mismo color que el actual** (`accent-text`); `transition: color .25s` | | ídem |
| GitHub (externo) | icono `arrow-up-right` de 11 × 11 tras el texto; abre en otra pestaña | | icono `--vp-c-text-3` → `--g-color-text-subtle` |
| Separadores | 1 × 24 verticales antes de idioma y antes del tema, margen 8/16 | | `--g-color-border` |
| Idioma | botón 58 × 64: `languages` 16 + `chevron-down` 14 | 13,3 (botón) | `--g-color-text` |
| Tema | interruptor 40 × 24, radio 11, borde 1 px; pulgar 18 (círculo) con sol/luna; `transition: transform .25s` | | carril `--vp-input-switch-bg-color` → `--g-color-neutral-soft`; borde `--g-color-border-control`; pulgar `--g-color-bg`; sombra `--vp-shadow-1` |
| «…» (960–1279 y < 960 con enlaces) | 44 × 64, icono `ellipsis` | | `--g-color-text` |
| Hamburguesa (< 768) | 48 × 64, `menu` ↔ `x` (Lucide, `grana-site.css`) | | `--g-color-text` |

Posiciones a 1280 en la ficha (x): marca 32–240 · búsqueda 320–494 · enlaces 604–1108 · idioma 1108–1183 · tema 1208–1248. En la portada (sin índice) la búsqueda va tras la marca (x 154) y crece hasta los enlaces.

## 3. Paneles de la barra

| Panel | Medida | Estilo · token |
| --- | --- | --- |
| Idioma (se abre **al pasar el puntero** y al enfocar/pulsar) | 128 × 90, a 52 px del borde superior (solapa 12 la barra), alineado al final del botón | radio **12**, relleno 12, borde 1 px `--g-color-border`, fondo `--vp-c-bg-elv` → `--g-color-surface`, sombra `--vp-shadow-3` → `--g-shadow-2`; entrada `opacity/visibility/transform .25s`. Filas de 32: actual «Español» como **título 14/700** (no enlace), «English» enlace 14/500 |
| «…» a 1024 | 202 × 142 bajo el botón | mismo panel; contiene «Español / English» y una fila «Apariencia» con el interruptor |
| Menú móvil (`.VPNavScreen`) | ocupa el visor bajo la barra (375 × 676 a 375); `body { overflow: hidden }`; botón `aria-expanded="true"` | fondo `--g-color-bg`; enlaces en filas de **48** con 14/500 y **línea inferior** 1 px `--g-color-border`, relleno lateral 44; luego el grupo de idioma (`languages` + «Español» + chevron) y una caja «Apariencia» (radio 8, fondo `surface-sunken`) con el interruptor |
| Búsqueda (`VPLocalSearchBox`) | caja de 900 × 116 a y = 64, centrada; fondo del visor `rgba(0,0,0,.6)` | radio 6, relleno 12, fondo `--vp-local-search-bg` → `--g-color-surface-sunken`; campo con foco; pie «↑↓ para moverte · ↵ para elegir · esc para cerrar». `/`, Ctrl+K y ⌘K la abren |

## 4. Índice izquierdo (`.VPSidebar`) — se conserva de A solo el filtro y los números

| Pieza | Medida | Tipografía · token |
| --- | --- | --- |
| Columna | **272** × visor, fija desde y = 0 (la marca va encima), relleno 64 (la barra) 32 96 32 | fondo `--vp-sidebar-bg-color` → `--g-color-surface-sunken` |
| Grupo | separado por una línea superior 1 px (`--g-color-border`), relleno superior 10; plegable con `chevron-down` | título **14/24, 700**, filas de 32, `--g-color-text` |
| Enlace | filas de **32** (relleno 4 0), sin icono | **14/24, 500**, `--vp-c-text-2` → `--g-color-text-muted` |
| Enlace actual | color `accent-text`; indicador 2 × 20 a x = 15 (transparente en el nivel 1) | `--g-color-accent-text` |
| Cajón (< 960) | 320 (o `100% − 64`), `transform .5s cubic-bezier(.19,1,.22,1)`, velo `rgba(0,0,0,.6)` | |

## 5. Contenido y «En esta página»

| Pieza | Medida | Tipografía · token |
| --- | --- | --- |
| Documento | relleno 48 32 0 (≥ 960); columna de texto **624** (≥ 960 con índice); **688** a 768; 327 a 375 (relleno 24) | |
| `h1` | 32/40, 400 | **Instrument Serif**, `--g-color-text` |
| `h2` | 24/32, 400; línea superior 1 px + relleno 24 | Instrument Serif; línea `--g-color-border` |
| `h3` | 16/28, 600 | Instrument Sans |
| Párrafo | 16/28 | `--g-color-text-muted` |
| **Columna «En esta página»** (≥ 1280) | caja 256 (relleno inicial 32) con el contenido a x = 1024, **224** de ancho; contenedor `position: fixed` con relleno superior 112 (barra 64 + 48), alto del visor, **sin desplazamiento propio**: con 62 secciones (GCombobox, 2016 px) las de abajo quedan fuera del visor | |
| Línea guía | borde inicial 1 px a todo lo alto de la lista, relleno 16 | `--g-color-border` |
| Título | «En esta página» 14/32, **600** | `--g-color-text` |
| Enlace h2 | filas de **32**, 14/32, 400, una línea con elipsis | `--vp-c-text-2` → `--g-color-text-muted` |
| Enlace h3 | igual, sangrado 16 (x = 1057) | ídem |
| Enlace actual | **solo color** → `--g-color-text` (peso igual) | |
| Marcador | **2 × 18**, radio 2, sobre la línea guía (x = 1024), centrado en la fila actual; `transition: top .25s cubic-bezier(0,1,.5,1), opacity .25s` | `--vp-c-brand-1` → `--g-color-accent-text` |
| Desplegable (< 1280) | botón de texto «En esta página ›» (97 × 24, `chevron-right` que gira); panel de 343 a 375 bajo la barra local, radio 8, borde 1 px `border-strong`, sombra `--g-shadow-2`; arriba «Volver arriba», luego la lista; el botón **no** lleva `aria-expanded` | |
| Anterior / siguiente | dos tarjetas de 304 × 66 (≥ 640 en dos columnas; una sola si falta el par, alineada al final), radio 8, borde 1 px `--g-color-border`; «Anterior» 12/20 500 `text-muted`, título 14/20 500 `accent-text` | |
| Pie (`.VPFooter`) | solo sin índice izquierdo (portada); línea superior 1 px, relleno 32, mensaje centrado 14 | `--g-color-text-muted` |

## 6. Comportamiento, movimiento y teclado

- **Al desplazar:** ≥ 960 la barra se queda (fija) y no cambia; < 960 se va con la página (medido: `top` −900 tras 900 px) y solo queda la barra local pegada a 0. En la portada la barra pasa de transparente a `bg` con línea.
- **Transiciones:** color de enlaces `.25s`; fondo de la barra `.5s`; paneles `opacity/visibility/transform .25s`; interruptor `transform .25s`; cajón `.5s cubic-bezier(.19,1,.22,1)`; marcador del índice `top .25s cubic-bezier(0,1,.5,1)`. Ninguna mira `prefers-reduced-motion` salvo las globales de VitePress. En Grana: `--g-duration-fast/press/slow` (120/160/240) y `--g-ease-*`; **.25 s ≈ `slow`**, **.5 s no tiene token** (se traduce a `slow`).
- **Tab** (medido a 1280): Saltar al contenido → marca → Buscar → Guía → Componentes → Blocks → Playground → Cambios → GitHub → Cambiar idioma → interruptor de tema → título de grupo «Guía» (un `div` con `tabindex`) → enlaces del índice. Anillo `2px solid --g-color-focus`, desplazamiento 2 (de `grana-site.css`).
- **Atajos:** `/`, Ctrl+K, ⌘K abren la búsqueda (medido: `/` la abre). Esc la cierra. Sin flechas en la barra: es una lista de enlaces que se recorre con Tab.
- **Defectos del original que no se calcan** (medidos): 1) el interruptor de tema **sin nombre accesible** (solo `title`); 2) «…» con nombre **en inglés** («extra navigation») y `aria-expanded="false"` estando abierto; 3) el botón «En esta página» sin `aria-expanded`; 4) el título de grupo del índice es un `div` enfocable; 5) los iconos de VitePress sustituidos por máscaras de Lucide se pintan **recortados** (`chevron-down` como «‹», `arrow-up-right` de GitHub como un guion, el `⌘` del atajo descolocado): el calco usa el icono **entero**; 6) el actual de la barra y el del índice se distinguen **solo por color** (ver §7); 7) el idioma se abre al pasar el puntero (sin intención: se abre al cruzar la barra); 8) la columna «En esta página» sin desplazamiento propio (lo de abajo, inalcanzable sin desplazar la página).

## 7. Contraste medido (tema por defecto)

| Par | Claro | Oscuro | Nota |
| --- | --- | --- | --- |
| Enlace de la barra `text` / `bg` | 17,40:1 | 16,46:1 | |
| Enlace actual `accent-text` / `bg` | 5,69:1 | 4,95:1 | |
| **Actual frente a reposo** (`accent-text` / `text`) | **3,06:1** | **3,32:1** | 1.4.1 (técnica G183): si el color es la única señal, la diferencia debe ser ≥ 3:1 **y** debe haber otra señal al pasar el puntero o enfocar. Pasa el 3:1 por poco (margen 0,06 en claro; un tema con otro acento puede no llegar) y **falla la segunda parte**: el hover pinta exactamente igual que el actual |
| Índice: actual `text` / reposo `text-muted` | 2,33:1 | 1,77:1 | el marcador de 2 px es la otra señal: cumple por forma |
| Marcador `accent-text` / `bg` (forma) | 5,69:1 | 4,95:1 | ≥ 3:1 (1.4.11) |

Datos en `medidas.json` (`paginas`, `estados`, `teclado`, `tokens`). Cocientes calculados con la fórmula de WCAG sobre los valores resueltos de los tokens (`tokens` de `medidas.json`); `navbar/r01/verificar.mjs` los vuelve a medir en el prototipo.
