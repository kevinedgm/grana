# Contrato · marco del sitio de documentación (calco del sitio anterior, hecho con Grana)

**Dueño:** lima · **Estado:** aprobado (composición, datos y paridad; el índice izquierdo contratado como `GSidebar appearance="index"`, §4, #1060 a #1065 y #1068) · **Basado en:** la referencia medida del sitio anterior `design/lab/sitio/referencia/` (kiwi, 16272793: `medidas.md`, `medidas.json` con 44 vistas × 63 piezas, 18 estados y el recorrido de Tab, y sus capturas), `design/lab/navbar/r01/` (`GNavBar`, prototipo del marco calcado con componentes reales, `paridad.json`, 772/772) y `design/lab/page-index/r01/` (`GPageIndex list`, 198/198) y `design/lab/sidebar/r03/` (`GSidebar appearance="index"`, 743/743, 637d9a15) · **Decisiones:** **#1052** (cambio de dirección: el diseño anterior, idéntico, hecho con Grana; sustituye en lo que toque a #1034 y #1043) y #1053 a #1068; siguen vigentes #1035 a #1037, #1044, #1045, #1050

El marco (shell) de `site/`: lo que rodea a cada página de documentación. **Se ve exactamente como el sitio anterior** (VitePress 1.6.4 vestido con tokens de Grana, el árbol de `887c3779^` = 1d11c448) y **cada pieza es un componente real de Grana**. No enseña componentes (eso es la página, de mora-docs, `docs/documentacion/contrato.md`).

## 0. Qué cambió y qué se conserva (#1052)

Decisión del usuario del 2026-11-08, tras ver el concepto A construido (887c3779): «exactamente el mismo diseño que tenía antes, y que Grana lo logre».

| Del concepto A (#1034, #1043) | Ahora |
| --- | --- |
| **Filtro del índice** en la cabecera de `GSidebar` (`/`) | **Se conserva** (#1035, #1050) |
| **Números estables 01–79** en el asiento del índice | **Se conservan** (#1036, #1037), solo en el índice (§5) |
| Banda con versión, miga con puertas, idioma y tema de tres estados | Sale. La banda es **`GNavBar`** (§3) |
| «En esta página» como relevo en el zócalo de `GPageHeader` | Sale del sitio. Vuelve **la columna** (`GPageIndex list`) y el desplegable de la barra local (`fold`) |
| `GPageHeader` con antetítulo y meta | Sale del sitio: el encabezado de la ficha vuelve al cuerpo (§6.1) |
| «En el texto» como grupo del filtro | Sale: el texto completo vuelve a la **búsqueda modal** (§6.3) |
| Sin `GNavBar` (S-L6) | Enmendado: `GNavBar` es componente real (#1053) |

**`GPageIndex relay`, `GBreadcrumbs` con puertas y `GPageHeader` siguen siendo componentes de la librería**; solo dejan de ir en el sitio.

**Personalidad del marco:** el aspecto es el del original; lo propio de Grana es de **comportamiento** y no se ve en reposo: los números como direcciones y el filtro (de A), **la luz que se desliza en la barra** (P1 de `GNavBar`, #1053) y **la columna que se sigue sola** (PI-P1 de `GPageIndex list`, #1054). Más los defectos del original que **no se calcan** (`referencia/medidas.md` §6: interruptor sin nombre, «…» en inglés y con `aria-expanded` falso, botón «En esta página» sin `aria-expanded`, título de grupo enfocable, iconos recortados, idioma que se abre al pasar, columna sin desplazamiento propio).

## 1. Motor: VitePress 1.6.4, cambiando solo el `Layout` (#1044, sin cambios)

- **VitePress fijado exacto** (`1.6.4` en `site/package.json`, sin `^`), `extends: DefaultTheme` (`vitepress/theme-without-fonts`) para los estilos de documento (`.vp-doc`: Markdown, tablas, bloques de código con Shiki y su botón de copiar, `custom-block`), **y un `Layout.vue` propio hecho con Grana que no pinta `DefaultTheme.Layout`** (ni `VPNav`, `VPSidebar`, `VPDocAside`, `VPLocalNav`, `VPLocalSearchBox`).
- **Solo API pública de VitePress:** `Content`, `useData` (`page`, `frontmatter`, `theme`, `lang`, `localeIndex`, `isDark`), `useRoute`, `useRouter` (`go`), `onContentUpdated`, `withBase`, `inBrowser`. **Una excepción vigilada:** el módulo virtual **`@localSearchIndex`** para la búsqueda modal (§6.3), con versión fijada y **una prueba que falla si su forma cambia** (claves por idioma, carga perezosa que devuelve el JSON de MiniSearch, campos `id`, `title`, `titles`, `text`). Lo interno del tema por defecto no se importa: se reimplementa.
- Se conserva sin tocar: Markdown y rutas (`srcDir: 'src'`), SSG para GitHub Pages (`base`), `generate.mjs` y su prueba, `check-live.mjs`, `check-pages.mjs`, `ignoreDeadLinks: false`, `postcssIsolateStyles` + la capa `vitepress` (#516) y los componentes del sitio (`GranaLive`, `GranaDemo`, `ThemePlayground`, `BlockBank`).

## 2. Composición

```
Layout.vue
├─ GAppShell  header="pinned-wide"  :labels="{ skip }"            ← banner · nav · main · contentinfo (#708; #1055)
│  ├─ #header  GNavBar  :items  :current="route.path"  label="Secciones"  :labels="{ more, menu, newTab }"
│  │            #brand   marca (enlace a la portada: logo 24 + «Grana» en Instrument Serif)
│  │            #search  botón «Buscar ⌘K» (receta de nav-bar.md) → search.open()
│  │            #actions { place }
│  │               bar:          GMenu idioma (languages + chevron-down; elementos-enlace) · GSwitch tema (sol/luna, aria-label)
│  │               more/screen:  lista de idiomas (enlaces con lang/hreflang, actual en negrita) · fila «Apariencia» con GSwitch
│  ├─ #nav     GSidebar  appearance="index"  filter  filterKeyshortcuts="/"  mode="auto"  :breakpoints="{ expanded: 960 }"   (no en la portada)
│  │            :labels  { …filtro (filterPlaceholder corto: «Filtrar»), close, drawer, groupCurrent }
│  │            #logo  la misma marca (en la banda de la columna; no en el cajón)
│  │            #search-icon  la lupa
│  │            items   los grupos del índice: Guía sin plegar; los de componentes `collapsible` con `id` y `collapsed: false`; `code` en los componentes (§4)
│  ├─ #default (dentro del main del chasis)
│  │   barra local  (< 80rem; pegada en --g-app-shell-top; 48 px)  «Menú» (abre el drawer, solo < 960) · GPageIndex appearance="list" fold
│  │   documento    rejilla: contenido (Content.vp-doc, columna de 624)  |  ≥ 80rem: columna «En esta página» = GPageIndex appearance="list" (sticky)
│  │                Anterior / siguiente: dos GCard interaction="link" (§3.6)
│  └─ #footer  pie (solo en la portada)
└─ GCombobox appearance="command"  ref="search"  label="Buscar en la documentación"  filter=false  (hermano del chasis; §6.3)
```

- **Portada** (`layout: home`): mismo marco **sin** `#nav`, sin barra local ni índice de la página, con pie; la banda **transparente y sin línea mientras la página está arriba del todo** (§3.5). **404:** el marco de una página sin `GPageIndex`.
- **Plugins del tema** (`enhanceApp`): `@grana/vue/app-shell`, `@grana/vue/nav-bar`, `@grana/vue/page-index`, `@grana/vue/page-index-list` (sin él, `list` cae a `relay` con aviso 7), `@grana/vue/sidebar-filter` (sin él, el índice sin filtro, F5), `@grana/vue/sidebar-index` (sin él, el índice cae a `default` sin plegar, A5; #1069) y `@grana/vue/combobox`.

## 3. La barra superior (`GNavBar`, `nav-bar.md`)

### 3.1 Enlaces y actual

Los seis del original, en este orden: **Guía** (`/getting-started`), **Componentes** (`/components/…`), **Blocks** (`/blocks/`), **Playground** (`/theme-playground`), **Cambios** (`/changelog`) y **GitHub** (`external`). `activeMatch` de cada uno = el del `config.mjs` de 1d11c448 (bruno los copia de allí, `git show 1d11c448:site/.vitepress/config.mjs`); los `href` con `withBase`; `current` = la ruta de VitePress con `base`. En inglés, las mismas rutas bajo `en/` con los textos del idioma. `@navigate` → `event.preventDefault()` y `router.go(href)`.

### 3.2 Búsqueda

El disparador de la receta de `nav-bar.md` (lupa + «Buscar» + `kbd`; solo lupa con nombre accesible por debajo de `60rem`, como el original) llama a `open()` del `GCombobox appearance="command"` (§6.3).

### 3.3 Idioma (ruta equivalente; de A, sin cambios en la regla)

- `GMenu` con elementos-enlace (`lang`, `hreflang`, `current`, #743) en `bar`; en `more` y `screen`, una lista de dos enlaces con el actual como texto en negrita y `aria-current="page"` (calco). **Ruta equivalente:** quitar o poner `en/` tras `base` (el generador garantiza la página gemela). `<link rel="alternate" hreflang>` en el `head` (recomendado).
- Abre **al pulsar**, no al pasar (corrige el defecto 7).

### 3.4 Tema (dos estados, como el original)

- **`GSwitch`** con `icon-on`/`icon-off` (`moon`/`sun`, registrados por el sitio) y **`aria-label`** («Cambiar a tema oscuro»/«claro», o un nombre fijo con `aria-checked`) en `bar`; con etiqueta visible «Apariencia» en `more` y `screen`. Corrige el defecto 1 (sin nombre accesible).
- **Una sola fuente:** la preferencia en `localStorage` con la clave de siempre (`vitepress-theme-appearance`: `auto` · `light` · `dark`). **`auto` hasta el primer cambio** (sigue al sistema, como VitePress); el interruptor muestra el tema **resuelto** y al pulsarlo escribe `dark` o `light`. El tercer estado explícito de A («Sistema») sale con el calco.
- **Antes de pintar** (script del `head`): resuelve `auto` con `prefers-color-scheme` y escribe **a la vez** `data-theme` (tokens de Grana) y la clase `dark` en `<html>` (estilos de VitePress y tema doble de Shiki). **Riesgo para bruno (de A, sigue):** el núcleo de VitePress gestiona `.dark` con `appearance` activo; una sola de las dos vías, medida sin parpadeo en claro, oscuro y sistema, tres motores.

### 3.5 La banda

- **Alto 64:** el tema del sitio declara en `:root` `--g-app-shell-header: calc(var(--g-space-1) * 16)` (#713).
- **`header="pinned-wide"`** (#1055): pegada con el visor ≥ `60rem`; por debajo se va con la página y solo queda la barra local pegada a 0 (calco).
- **Línea inferior** de la banda: la de `GAppShell` (`--g-color-border`); con la columna izquierda no la cruza (la banda está en el marco, no sobre la pista).
- **Portada arriba del todo (N-L9):** la banda **transparente y sin línea** mientras `scrollY === 0`; al desplazar, fondo `--g-color-bg` y línea. **Receta del sitio**, no del chasis: el `Layout` pone `data-top` en `<html>` en la portada (el servidor lo pinta como «arriba», que es lo que ve quien carga; un manejador pasivo de `scroll` lo quita y lo pone al cambiar) y `grana-site.css` lo pinta (sin capa).

### 3.6 Anterior / siguiente

Dos `GCard interaction="link"` en dos columnas (≥ 640 px de la columna; una sola, alineada al final, si falta el par), con «Anterior»/«Siguiente» en `--g-text-caption-*` `text-muted` y el título en `accent-text` (calco 304 × 66, radio 8, borde 1 px). Sin número (§5). Si `GCard` no llega a la medida con sus props, **receta del sitio** en `grana-site.css` sobre las clases públicas de `GCard`, medida por coco; no se enmienda `GCard` por el sitio.

## 4. El índice izquierdo (`GSidebar appearance="index"`; #1060 a #1065, #1068)

**Decidido:** `GSidebar` con **`appearance="index"`** (extensión `@grana/vue/sidebar-index`, #1069; `sidebar.md` §«Apariencia `index`», ronda `design/lab/sidebar/r03/` de kiwi, 743/743 en tres motores; cierra el hueco de esta sección y N-L10), `filter` (extensión `@grana/vue/sidebar-filter`, #1050) y `code` en los items de componentes (#1036); `filterKeyshortcuts="/"` (⌘K va a la búsqueda); ancho 272 (`--g-sidebar-width` en el tema del sitio); **expandida desde 960 px, drawer por debajo, sin riel** (en `index` no hay riel: basta `:breakpoints="{ expanded: 960 }"`); el drawer lo abre el botón «Menú» de la barra local; navegar con `@navigate` → `preventDefault`, `router.go(href)`, `open = false` (de A, §3 antiguo); `modelValue` de la ruta.

**Aspecto:** el del original, pieza a pieza (columna `surface-sunken` sin borde; cabecera = la banda de 64 con su línea; títulos 14/24 en 700 con la ranura `--g-sidebar-group-title-weight` que el tema del sitio sube a 700, §11; separadores; enlaces sin icono en filas de 32; el actual en `accent-text`), con lo que decidió el usuario el 2026-11-08 (**SB-Q1 → F1 + C1**, #1063): el **filtro en la banda**, junto a la marca, que crece al pulsar `/` (la lista no se mueve), y los **números al final de la fila**, como en el índice de un libro. **La marca del actual** (2 × 20 en `accent-text`) se pinta siempre (WCAG 1.4.1; desviación 6 de §12) y viaja al cambiar de página (I2).

**Grupos y orden: los del original** (los de `site/.vitepress/config.mjs` de 1d11c448: Guía, los grupos de componentes y, en `/blocks/`, su barra propia `blocksSidebar`, como en el original), con los números en los componentes. «Guía» no se pliega; **los grupos de componentes son `collapsible` con `id` estable y `collapsed: false`** (el original); el plegado dura la visita (estado de la instancia; el sitio no usa `closedGroups`). Bruno los copia de allí. `labels.groupCurrent` («contiene la página actual» y su traducción) obligatorio en el sitio.

**`/blocks/` (SB-L12):** la misma apariencia con su barra propia (`blocksSidebar`): grupos por familia `collapsible` con `id` y `collapsed: false`, **sin números**. Mismo modelo; **no prototipado** (kiwi): bruno lo construye con el mismo `Layout` y coco lo mide en la auditoría de paridad.

**Atajo:** el sitio registra en `document` `/` (fuera de un campo editable, sin modificadores) → `focusFilter()` (en `< 960`, abre el drawer primero); **en la portada (sin índice), `/` abre la búsqueda modal**.

## 5. Números estables (#1037, sin cambios en la regla)

- Un número por componente, asignado una vez y para siempre, en `site/scripts/numeros.json` (01–79 hoy); uno nuevo toma el siguiente libre y va al final de su grupo; uno retirado retira su número. Dos cifras (`code: '01'`…); el generador falla si falta, se repite o cambia.
- **Se pinta solo en el índice** (asiento de `GSidebar`, nombre accesible «24 GCombobox», #1036). El antetítulo, la miga y las páginas vecinas de A no existen en el calco (decisión derivada de #1052: el original no tenía números).

## 6. Datos: de dónde sale cada cosa

### 6.1 `site/scripts/generate.mjs`

- **Índice por idioma** (los grupos de §4) con `id`, `label`, `href`, `code`, `keywords` (para el filtro), sin `icon` (el original no los tenía; en `index` se ignora, aviso A2); los grupos de componentes y de `/blocks/` con `id` estable, `collapsible: true` y `collapsed: false` (#1068).
- **El cuerpo de la ficha vuelve al de 1d11c448:** el `# Nombre` y el bloque de datos (etiqueta, estado, entrada, desde, línea de importación) en el Markdown, como antes; el frontmatter conserva `title`, `description` y `prev`/`next`. Así hay **un solo `h1`**, el del cuerpo. Bruno compara con `git show 1d11c448:site/…` y deja la prueba de `generate` en verde con la forma restaurada (sin `h1` duplicado).
- **Páginas gemelas** en `en/` (como hoy), para la ruta equivalente del idioma.

### 6.2 Secciones de la página (`GPageIndex list`)

- De **`page.headers`** de `useData()` con `markdown.headers` en los niveles **2 y 3** (el calco sangra los `h3`): `{ id: slug, label: title, level }`. bruno comprueba en 1.6.4 que llegan; si no, los da `generate.mjs` con el `slugify` de VitePress y una prueba de que cada `id` existe en la página construida.
- **Dos instancias** con el mismo `v-model` (columna ≥ `80rem`, plegada en la barra local por debajo): PI-L5 evita que se disputen la actual (`page-index.md` §«Dos instancias»). Al cambiar de ruta reciben los `items` nuevos; `onContentUpdated` llama a `refresh()` de las dos.
- Textos: `label` «En esta página» (calco), `labels.top` «Volver arriba»; `align="start"` en la plegada con la columna izquierda a la vista (≥ 960) y `end` por debajo (calco: el botón al inicio de la barra local en un caso y al final en el otro; lo mide coco).

### 6.3 Búsqueda modal de texto completo (`GCombobox appearance="command"`, #1056)

- **Abrir:** el botón «Buscar» y **⌘K / Ctrl+K** (registrado por el sitio en `document`, también dentro de un campo editable) llaman a `open()`. `/` va al filtro (§4), salvo en la portada.
- **Índice:** con la primera búsqueda (o al abrir por primera vez), el sitio carga **`@localSearchIndex`** del idioma actual (≈ 1,6 MB, como hoy) y **MiniSearch** (`minisearch`, dependencia explícita del sitio con la versión de VitePress 1.6.4), con las opciones de búsqueda de VitePress (prefijo y difusa). Mientras carga, `loading`.
- **Opciones:** `filter: false` (la aplicación busca) + `@search` con `loading` en el mismo manejador (regla de «Datos» de `combobox.md`); **como mucho 20** resultados por búsqueda (`limit`), cada uno `{ value: id, label: <título de la sección>, description: '<Página> › <secciones> · <fragmento>' }`, donde el fragmento es el trozo del texto alrededor de la primera coincidencia (≤ 1 línea, recortado por el sitio). La marca `<mark>` de `GCombobox` resalta la coincidencia (#356).
- **Elegir (`@select`):** `router.go(withBase(href#ancla))`; en el destino, el foco al `h1` o a la sección (§8). Con Ctrl/⌘ en `event`, `window.open` en otra pestaña (decisión del sitio).
- **Pie** (slot `hints`): «↑↓ para moverte · ↵ para elegir · esc para cerrar» con `kbd` (calco; textos por idioma). Los botones del original de vista detallada y de vaciar **no** se calcan (no son marco: decisión derivada; el fragmento va siempre).
- Textos de la superficie (`labels` de `combobox.md`): `close`, `loading`, `noResults`, `minChars`, `results`, `partial`, `more`, `retry`, por idioma.

## 7. Barra local (< `80rem`)

- **Del sitio** (no es componente): una franja de 48 px `position: sticky; inset-block-start: var(--g-app-shell-top)` al principio del `main`, con **«Menú»** (`GBtn variant="ghost"` con `align-left` del sitio y `aria-haspopup="dialog"`; solo con el drawer, < 960) y el **`GPageIndex list fold`**. Fondo `--g-color-bg` y línea inferior `--g-color-border` (calco, lo mide coco).
- **El sitio declara en `:root`** `--g-app-shell-local-bar: calc(var(--g-space-1) * 12)` por debajo de `80rem` y `0px` por encima (#1055): el chasis la suma al `scroll-padding` y al registro de bordes (destinos de ancla y foco bajo la barra; PI-L6).
- Sus enfocables, si caen en la banda del `scroll-padding`, aplican S1 (`api.md` «Piezas pegadas», regla 1) en `grana-site.css`.

## 8. Teclado, foco y anuncios

| Qué | Regla |
| --- | --- |
| Primer Tab | «Saltar al contenido» (`GAppShell labels.skip`) → `main`. Límite de WebKit (S7) |
| Orden | salto → marca (sin columna) → Buscar → enlaces → idioma → tema (o «…» / hamburguesa) → índice (filtro y enlaces) → barra local → contenido → columna «En esta página» → pie. Nada reordenado con CSS. El título de grupo del índice **no** es enfocable salvo que sea un botón de plegar: los de componentes lo son, «Guía» no (corrige el defecto 4; #1061) |
| `/` | `focusFilter()` (en `< 960`, abre el drawer primero; en la portada, la búsqueda). Fuera de un campo editable |
| ⌘K / Ctrl+K | `search.open()` (también desde un campo) |
| Al cambiar de ruta | El foco al `h1` del contenido (`tabindex="-1"` puesto por el `Layout` si falta, `preventScroll`) tras `onContentUpdated`; **no** en la primera carga ni en un salto a `#ancla` de la misma página. El título del documento lo pone VitePress. Sin región viva |
| En esta página | `GPageIndex` (`page-index.md`): elegir lleva el foco a la sección; «Volver arriba», al `h1` |
| Anuncios | Solo el recuento del filtro (cortés, 600 ms) y los recuentos de la búsqueda (región de la superficie). Tema, idioma y sección actual, sin anuncio |

## 9. Cortes del sitio (del visor, calco de `referencia/medidas.md` §1)

| Visor | `GNavBar` | Banda | `GSidebar` | Barra local | «En esta página» |
| --- | --- | --- | --- | --- | --- |
| ≥ 1280 (`80rem`) | todo en la barra | pegada | expandida 272 | no | columna derecha 224 (+32), pegada bajo la banda |
| 960–1279 | enlaces + «…» | pegada | expandida 272 | sí, pegada bajo la banda: plegada | plegada (`align="start"`) |
| 768–959 (`48rem`–`60rem`) | enlaces + «…», búsqueda solo lupa | **se va con la página** | drawer | sí, pegada a 0: «Menú» + plegada | plegada |
| < 768 | marca, lupa, hamburguesa | se va con la página | drawer | sí, pegada a 0 | plegada (`align="end"`) |

- **320 px sin desplazamiento horizontal**, claro y oscuro, tres motores (el original desbordaba 1 px con «…» a 1024: no se calca).
- **≥ 44 px** todo lo pulsable con `pointer: coarse` (lo traen los componentes; lo propio del sitio, `grana-site.css`). Texto ≥ 12 px; contraste ≥ 4,5:1 en claro y oscuro (actual de la barra frente al reposo: límite aceptado de `nav-bar.md`).
- **Movimiento:** el marco no anima nada propio; se mueve lo de los componentes con su `prefers-reduced-motion` (luz de `GNavBar`, marcador y PI-P1 de `GPageIndex`, drawer y asiento de `GSidebar`, superficie de `GCombobox`). El fondo de la banda en la portada cambia al instante.

## 10. SSR e hidratación

- El marco se pinta en el servidor con la sección actual de la barra (`current`), el asiento del índice, la sección de `modelValue` y la portada «arriba»; **nada salta al hidratar** (#1033): sin `matchMedia`, `location`, `localStorage` ni medidas en el primer render; el tema llega por el script del `head`; los cortes son CSS.
- **Medido antes de dar por hecho:** con `docs:build` + `vitepress preview`, a 1280, 1024, 900, 375 y 320: **CLS del marco = 0** y ningún aviso de hidratación, tres motores (el riesgo de `GSidebar mode="auto"` sigue cubierto por la reserva por CSS de #712).

## 11. Capas y estilos (#516, #806)

- `site/.vitepress/theme/layers.css`, primera hoja: `@layer vitepress, grana.defaults, grana.components, grana.blocks, grana.utilities;` (a86aefc2).
- Todo el CSS de VitePress en la capa `vitepress`; los estilos de documento aislados de los ejemplos vivos (`postcssIsolateStyles`, `.vp-raw`).
- El CSS propio del marco (`grana-site.css`, de coco) solo lee `var(--g-*)` y alias locales, sin capa: la marca y los `h1`/`h2` en **Instrument Serif** (fuente del sitio, no token: solo la documentación la usa), la barra local, la rejilla del documento (624 + columna derecha), la portada «arriba», las recetas de §3.6 y §7, S1 de la barra local. **Tema del sitio** (en `:root` de `grana-site.css`, sin capa, gana a los valores por defecto): `--g-app-shell-header` (64), `--g-sidebar-width` (272), **`--g-sidebar-group-title-weight: 700`** (#1064) y **`--g-surface-backdrop: rgb(0 0 0 / 0.6)`** también en claro (el velo del original para el cajón y la búsqueda, `rgba(0,0,0,.6)`; H7 y SB-C4, #1066; afecta solo al sitio). El código del contenido sigue con la letra de VitePress (`--g-font-code` reservado, §59).

## 12. Paridad visual con la referencia (criterio de hecho)

**Referencia congelada:** `design/lab/sitio/referencia/medidas.json` y sus capturas (de kiwi; **nadie las regenera** salvo kiwi; `medir.mjs` escribe en su carpeta y lee las clases de VitePress, así que no se usa contra el sitio nuevo).

**Cómo se mide:** bruno escribe `site/tests/paridad.mjs` (Playwright, Chromium, `deviceScaleFactor` 1, puerto propio) que, sobre el sitio construido (`docs:build` + `preview`), recorre **las mismas vistas** (portada, Empezar, GCombobox, Blocks × 1280/1024/768/375/320 × claro/oscuro), **los mismos estados** (hover de «Blocks», foco al 5.º Tab, idioma, búsqueda con «comb», «…» a 1024, menú móvil a 375, «En esta página» desplegado a 375, drawer a 375, lectura a mitad de la ficha) y **las mismas piezas** de `medidas.json`, con un mapa de selectores de Grana (base: el de `design/lab/navbar/r01/verificar.mjs`), y escribe `site/tests/paridad-resultados.json` con `ref`, `grana` y `delta` por pieza. Coco lo lee en su auditoría.

**Tolerancias (compuerta):**

| Qué | Tolerancia |
| --- | --- |
| Estructura: banda (alto 64), línea inferior, columna izquierda (272), columna de texto (624 / 688 / 327), columna «En esta página» (x 1024, 224), barra local (48), `h1` | **\|Δ\| ≤ 1 px** en x, y, ancho y alto |
| Piezas de texto e iconos: marca, botón de búsqueda, cada enlace de la barra, idioma, interruptor, «…», hamburguesa, título y enlaces de «En esta página», tarjetas anterior/siguiente, paneles abiertos (idioma, «…», búsqueda, menú móvil, desplegado) | **\|Δ\| ≤ 2 px** en x, y, ancho y alto |
| Tipografía de cada pieza | `font-family`, `font-size`, `font-weight` y `line-height` **iguales** |
| Color de cada pieza (texto, fondo, borde) | **El mismo color resuelto** que en `medidas.json` `tokens` (claro y oscuro) |
| Desplazamiento horizontal | **Ninguno** en ninguna vista (`scrollWidth` = ancho) |
| Tab | El orden de §8 = el de `medidas.json` `teclado`, salvo las correcciones listadas abajo |

**Desviaciones aceptadas** (no cuentan contra la compuerta; cada una con su cota):

1. **Defectos que no se calcan** (`referencia/medidas.md` §6): nombres accesibles, `aria-expanded`, título de grupo no enfocable, idioma al pulsar, iconos enteros (Lucide sin recortar: el ancho del icono puede diferir **≤ 4 px**), columna con desplazamiento propio.
2. **«…» a 1024 dentro del visor** (el original se salía 2 px): las piezas a su izquierda pueden correrse **≤ 4 px**.
3. **Botón de búsqueda a 1024:** ancho **≤** el del original (el original desbordaba su hueco).
4. **Hover de la barra:** luz en vez de color `accent` (P1, #1053); **la actual** sí se calca (color).
5. **«En esta página» a la vista** (PI-P1): la columna puede estar desplazada por dentro respecto de la captura de lectura.
6. **Índice izquierdo** (dentro de la compuerta desde #1068, contra `design/lab/sidebar/r03/paridad.json` y `referencia/medidas.json`): (a) **la marca del actual pintada** en `accent-text` (5,27:1 claro, 5,12:1 oscuro), donde el original dejaba su indicador **transparente** (`rgba(0,0,0,0)`) y el actual se distinguía solo por color a 1,31:1 / 1,88:1: **desviación aceptada por WCAG 1.4.1** (SB-K1, #1062). La fila «Índice» de `referencia/medidas.md` §7 («actual `text`»; «el marcador de 2 px es la otra señal») **es errónea**: lo medido es actual en `accent-text` e indicador transparente; la referencia está congelada y no se toca (§12, arriba), la corrección vive aquí; (b) **hover** en `text` con la luz en vez del color del actual (I1; corrige el defecto 6); (c) **los números** al final de las filas y **el filtro** en el hueco de la banda (no existían; C1 y F1, decisión del usuario): la lista y las etiquetas, Δ 0; (d) **cajón:** la lista baja **+32** (la fila del filtro y del cierre) y sin la marca; ancho y velo, los del original; (e) **grupos plegables** con `<button>` real y flecha entera de Lucide (defectos 4 y 5).
7. **Fuente de la marca y de los títulos:** si Instrument Serif llega de otro origen, el ancho del texto **≤ 2 px**.
8. **Idioma actual en «…», en la pantalla de menú y en el panel de idioma: peso 600 en vez de 700** (H4 de coco, #1064): la escala no tiene un peso de 700 y no se crea un rol global para una pieza; el actual sigue distinguido por peso frente a 400/500 y por `aria-current`. La compuerta de tipografía no exige el peso en esas piezas.
9. **La portada se aparta del calco a propósito** (decisión del usuario, 2026-11-09, #1073): la compuerta de paridad **no mide la portada** en estas piezas, que se validan contra el manual de marca: (a) `VPHero` sustituido por `BrandHero` (W2 dentro del `h1`, lema aparte, entradilla del manual y frase sobre el nombre); (b) botones de VitePress como `GBtn` `lg` (44 px); (c) los dos párrafos de presentación del README en la cabecera, no en el cuerpo; (d) ventajas y cuerpo más abajo; (e) tarjetas Anterior/Siguiente **de todo el sitio** con los huecos `#eyebrow`/`#title` de `GCard` y enlace real (la medida de §3.6 se conserva, el cambio es de contenido); (f) paleta de marca (carmín `#a3123a`/`#d74b63`, nopal `#2f6a3d`/`#4e895a`, cera `#f7f2ea`/`#151012`, tinta `#1d1517`/`#efe7dd`) **solo en la portada**. Siguen bajo compuerta en la portada: la banda, la columna izquierda, ausencia de desplazamiento horizontal, orden del Tab, contraste, táctil ≥ 44, CLS 0 y hidratación sin avisos. **«La impresión»**: una vez al cargar la portada, nunca al navegar (SPA), sin reproducirse con `prefers-reduced-motion: reduce`; evaluada con la rúbrica de movimiento en #1073.

**Informativo (no compuerta):** diferencia de píxeles por captura con `pixelmatch` (umbral 0,1), excluido el contenido vivo de las fichas; se informa el porcentaje por vista en `paridad-resultados.json`.

**Además** (de A, siguen): un `banner`, un `main`, un `h1`; toda `nav` con nombre («Secciones», «Documentación», «En esta página»); `contentinfo` en la portada; táctil ≥ 44; contraste; hidratación sin avisos y CLS 0 (§10); `generate.test.mjs` (números estables, un solo `h1`, frontmatter); prueba de forma de `@localSearchIndex`; ⌘K abre la búsqueda y «comb» da resultados con `<mark>`; `/` enfoca el filtro; idioma con ruta equivalente y `lang`/`hreflang`; tema que persiste y no parpadea. En `site/tests/site.spec.mjs`, tres motores, claro y oscuro.

**No verificable aquí:** lector de pantalla real (dos `nav`, `aria-current="location"` en una lista larga, la búsqueda), Safari y táctil reales, `forced-colors`, texto al 200 %, RTL.

## 13. Quién construye (excepción de lote #1045, ampliada a este lote por #1052)

1. **coco** (Opus en `GNavBar`; Sonnet en el resto): `GNavBar.css`; `GPageIndex.css` (forma `list` y `fold`); `GCombobox.css` (`--command`, `__hints`); `GAppShell.css` (`pinned-wide`, barra local, `is-covered`); en el sitio, `grana-site.css` (marca y títulos en serif, barra local, rejilla, portada «arriba», recetas, interruptor de 40 × 24 si hace falta, N-H3). Después, la auditoría de cada componente sobre el real y la de paridad (§12).
2. **bruno** (Opus en `GNavBar` y `GPageIndex list`; Sonnet en el resto): los `.vue`, entradas, `meta.json`, tipos, compuertas y pruebas de cada componente; en el sitio, el `Layout` y todo lo funcional (`site/.vitepress/theme/*.vue`, `config.mjs`, `index.js`, `icons.js`, `generate.mjs` en lo que toque al marco, `site/tests/`, `paridad.mjs`).
3. **mora-docs:** textos (etiquetas, mensajes, pie de la búsqueda por idioma), README de `GNavBar` y de lo nuevo de `GPageIndex`, `GAppShell` y `GCombobox` tras sus auditorías, y la enmienda de `docs/documentacion/contrato.md` §3 (§14).
4. **kiwi:** la ronda corta de `GSidebar` para el índice calcado (§4): **hecha** (`design/lab/sidebar/r03/`, 637d9a15). Lo que sigue: coco `GSidebar.css` (apariencia `index`, grupos plegables, marca) y en `grana-site.css` las dos entradas del tema de §11; bruno `GSidebar.vue` y los datos del índice (§6.1); después, la auditoría de coco y la paridad con el índice dentro (§12, desviación 6).

## 14. Enmienda del contrato de documentación (para mora-docs; `docs/documentacion/contrato.md` §3 es suyo)

- **Párrafo «Marco de la página»:** barra superior `GNavBar` (Guía · Componentes · Blocks · Playground · Cambios · GitHub, búsqueda «Buscar ⌘K» modal de texto completo, idioma con ruta equivalente, tema claro/oscuro); índice lateral con **filtro** (`/`) y **números estables** en los componentes; «En esta página» como **columna a la derecha** en ancho y desplegable en la barra local en estrecho. Remite a este contrato.
- **Fila 1 (Ruta y cabecera):** el `h1` y el bloque de datos vuelven al cuerpo (como antes de 887c3779); sin `GPageHeader` ni antetítulo numerado.
- **Fila 3 (En esta página):** `GPageIndex appearance="list"` derivado de los `h2` y `h3` reales, no como bloque del cuerpo.
- **Fila 14 (Páginas vecinas):** anterior/siguiente por el orden del índice, **sin número**.
- Hallazgos que siguen abiertos (S-H2, N-H5): la portada dice «64 componentes» (son 79); «Props» y «Referencia de la API» duplicadas (con la columna completa se nota más, PI-H3).
