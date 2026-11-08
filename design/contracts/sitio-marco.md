# Contrato · marco del sitio de documentación (A · «El índice se escribe»)

**Dueño:** lima · **Estado:** aprobado (forma y motor) · **Basado en:** `design/lab/sitio/r01/` (kiwi, 2026-11-08: `declaracion.md`, `brief.md`, `inventario-componentes.md`, prototipo `index.html?c=A`, `verificar.mjs` 411/411) · **Elección del usuario:** concepto **A**, sin mezcla con B ni C (2026-11-08, #1034) · **Decisiones:** #1034 a #1047

El marco (shell) de `site/`: lo que rodea a cada página de documentación. Lleva a la página y al punto de la página que se busca, dice dónde se está y qué versión se lee, y deja cambiar tema e idioma sin perder el sitio. **No enseña componentes** (eso es la página, de mora-docs, `docs/documentacion/contrato.md`) y no compite con la ficha viva por el ancho: en A la columna de contenido pasa de 624 a ≈ 950 px a 1280 (medido por kiwi).

## 0. Personalidad (#1034)

1. **Los números son direcciones.** Cada componente tiene un número estable (§5) que vive dentro del asiento de `GSidebar`: lleno = estás aquí. Quien vuelve aprende que el combobox es «24» como una extensión: `/` `2` `4` Intro, sin mirar.
2. **El índice es la búsqueda.** Filtrar no saca de la página: la lista se encoge donde ya está la mirada; el texto completo aparece como un grupo más, «En el texto», al final de la misma lista.
3. **El índice de la página no ocupa una columna.** «En esta página» es un **relevo** en el zócalo pegado de `GPageHeader` que cambia con la lectura.

## 1. Motor: VitePress 1.6.4, cambiando solo el `Layout` (confirmado por el usuario el 2026-11-08, #1044)

- **Se mantiene VitePress, versión fijada exacta** (hoy `1.6.4` en `site/package.json`, sin `^`), con `extends: DefaultTheme` (`vitepress/theme-without-fonts`) para conservar sus estilos de documento (`.vp-doc`: Markdown, tablas, bloques de código con Shiki y su botón de copiar, `custom-block`), **y un `Layout.vue` propio hecho con Grana que ya no pinta `DefaultTheme.Layout`**.
- **Solo API pública de VitePress:** `Content`, `useData` (`page`, `frontmatter`, `theme`, `lang`, `localeIndex`, `isDark`), `useRoute`, `useRouter` (`go`), `onContentUpdated`, `withBase`, `inBrowser`. **Una sola excepción:** el módulo virtual **`@localSearchIndex`** para «En el texto» (§6.3), que no está documentado: versión fijada y **una prueba que falla si su forma cambia** (claves por idioma, carga perezosa que devuelve el JSON de MiniSearch, campos `id`, `title`, `titles`). Lo interno del tema por defecto (`useLangs`, `outline.js`, `getScrollOffset`) **no** se importa: se reimplementa (§4, §6).
- Se conserva sin tocar: Markdown y rutas (`srcDir: 'src'`), SSG para GitHub Pages (`base`), `generate.mjs` y su prueba, `check-live.mjs`, `check-pages.mjs`, `ignoreDeadLinks: false`, `postcssIsolateStyles` + la capa `vitepress` (#516) y los componentes del sitio (`GranaLive`, `GranaDemo`, `ThemePlayground`, `BlockBank`).
- **Reescribir el motor queda descartado** (#1044). Si algún día se cambiara, este contrato valdría igual salvo §1 y las fuentes de §6 (la composición de §2 a §5 no depende de VitePress).

## 2. Composición

```
GAppShell  :labels="{ skip }"                                  ← un solo chasis (#708): banner · nav · main · contentinfo
├─ #header  (banda de alto de contrato; nada la hace crecer, aviso 6 de app-shell)
│   ≥ 768:  [marca]* · GBadge versión · GBreadcrumbs (con puertas) · ─espacio─ · GMenu idioma · GRadioGroup tema
│   < 768:  GBtn índice (abre el drawer) · marca · ─espacio─ · GBtn filtro (focusFilter) · GMenu idioma · GMenu tema
├─ #nav     GSidebar  filter  mode="auto" mobile="drawer" :breakpoints="{ expanded: 1024, rail: 1024 }"
│            #logo   marca (enlace a la portada)              * en ≥ 1024 la marca vive aquí, no en la banda
│            #header versión (solo en el drawer, S-H4)
│            items   Empezar · 10 grupos de componentes (con `code`) · Blocks · Herramientas · Proyecto [· En el texto]
├─ #default (dentro del main del chasis)
│   GPageHeader  eyebrow · title · description · #meta (estado + importación) · #actions (GPageIndex relay · Copiar importación)
│                #trail  GBreadcrumbs (solo < 768: la miga sale de la banda)
│   GContainer   width="xl" (fichas, Blocks) | width="reading" prose (guías)
│     Content.vp-doc
│     Páginas vecinas: GSplit ratio="1:1" con dos GCard interaction="link"
└─ #footer  GbFooter (licencia y créditos)
```

- **`GPageHeader` es el primer hijo directo del `main`** (`page-header.md` §«Anatomía»), fuera de `GContainer`; el contenido, después, en su contenedor.
- **Sin rail en A:** expandida desde 1024 px de ancho del chasis, drawer por debajo, **sin riel intermedio** (aceptado por el usuario, #1046; la receta de `sidebar.md` §«Cortes de adaptación»). El botón «Abrir el índice» de la banda abre el drawer (`v-model:open`), y el drawer devuelve el foco a él al cerrarse (defecto S8 de WebKit abierto, `PENDIENTES.md` §3).
- **Portada** (`layout: home`): mismo marco, sin `GPageHeader` ni índice de la página; se compone con Blocks (`GbHero`, `GbFeatures`, `GbStats`). **404**: mismo marco, sin miga, sin foco automático en el filtro.
- **Sin `GNavBar`** (S-L6, #1041): la fila «Guía · Componentes · Blocks · Playground · Cambios» la hace el índice (grupos) en A. GitHub: enlace en `GbFooter` y en el grupo Proyecto.

## 3. El índice (`GSidebar` con filtro)

- **Grupos y orden:** `Empezar` (guías con icono: Empezar, Tematización, Utilidades, Accesibilidad, Personalidad) · los **diez grupos de componentes** con su nombre como título y cada componente con `code` (§5) · `Blocks` (cada familia es un padre y sus secciones, sus hijos: un nivel, como permite `GSidebar`) · `Herramientas` (`@grana/cli`, Playground de tema) · `Proyecto` (Cambios, Proyecto). **Una sola navegación global** también en `/blocks/`: desaparecen las dos barras de hoy (`blocksSidebar`).
- **Datos de cada item:** `id` (ruta), `label`, `href` (con `withBase`), `code` (componentes), `keywords` (slug, nombre sin la `G`, el nombre en el otro idioma), `icon` (guías: por nombre del registro del sitio).
- **Filtro:** `filter`, `v-model:query`, `filterKeyshortcuts="/ Control+K Meta+K"`, los seis `labels` del filtro (`sidebar.md` §«Filtro del índice»). **El sitio registra el atajo** en `document` (`/` fuera de un campo editable, sin modificadores; ⌘K/Ctrl+K siempre, para no romper la costumbre de hoy) y llama a `focusFilter()`.
- **Navegar:** `@navigate` → `event.preventDefault()`, `router.go(href)`, `open = false`; el `modelValue` sale de la ruta (con el evento cancelado `GSidebar` no cierra el drawer ni emite `update:modelValue`, `sidebar.md` §«Eventos»). `/ 2 4 Intro` pasa por aquí (Intro hace `click()` en el primer visible).
- **Ruta actual** = `modelValue` (`aria-current="page"`, asiento lleno con el número).

## 4. La banda

| Pieza | Componente | Regla |
| --- | --- | --- |
| Marca | enlace con el logo (`logo.svg`/`logo-dark.svg`, `alt=""` y texto «Grana») | En ≥ 1024, en el slot `logo` del sidebar; por debajo, en la banda |
| Versión | `GBadge` `variant="outline"` `color="neutral"` con `label` «Versión 0.1.0-beta.0» | Desde `package.json`. En < 768, en el slot `header` del sidebar (dentro del drawer) |
| Miga | `GBreadcrumbs` con `children` (puertas a los hermanos: grupos y componentes del grupo, con su `code` delante) | `navigate` como §3. En < 768, en `#trail` de `GPageHeader`. Depende de **S-H1** (coco + bruno: la cesión con puertas en táctil a 375) |
| Idioma | `GMenu` con elementos-enlace: `lang`, `hreflang`, `current` (#743) | **Ruta equivalente:** quitar o poner `en/` tras `base` (el generador garantiza la página gemela). Disparador: texto del idioma en ≥ 768, icono `languages` con nombre accesible en < 768. Además, `<link rel="alternate" hreflang>` en el `head` (recomendado) |
| Tema | ≥ 768: `GRadioGroup appearance="segmented" labelMode="icon"` con Sistema · Claro · Oscuro (`monitor`, `sun`, `moon`, nombres por `label`). < 768: `GMenu` con tres `radio` y disparador de icono con nombre | Tres estados (§7) |

Iconos del marco que no están en la lista de la librería (`sun`, `moon`, `monitor`, `languages`, `menu`, `file-text`…): los **registra el sitio** en `site/.vitepress/theme/icons.js` con `createIcons` (`icons.md` §5); no entran en `@grana/vue` (#1041).

## 5. Números estables (#1037)

- **Un número por componente, asignado una vez y para siempre.** El registro es un archivo de datos del sitio (propuesta: `site/scripts/numeros.json`, `{ "GCombobox": 24, … }`), con la numeración inicial = el orden del índice de hoy (01–78, la de `datos.js` de kiwi).
- **Un componente nuevo recibe el siguiente libre** (79, 80…) y se coloca **al final de su grupo**; un componente retirado **retira su número** (no se reutiliza). Por eso, con el tiempo, un grupo puede no ser correlativo: es el precio de que el número sea una dirección.
- **Se pinta con dos cifras** (`code: '01'`…`'99'`; tres desde 100). El generador **falla** si un componente con página no tiene número, si un número se repite o si cambia uno ya asignado (la prueba compara con el registro en `git`).
- El mismo número va en el antetítulo de `GPageHeader` («Componente 24 · Campos de entrada»), en la miga y en «Páginas vecinas».

## 6. Datos: de dónde sale cada cosa

### 6.1 `site/scripts/generate.mjs` (`.site-data.json` y frontmatter)

- **Índice por idioma:** los grupos de §3 con `id`, `label`, `href`, `code`, `keywords`, `icon`, `status`.
- **Frontmatter de cada ficha:** `title` (el nombre), `description` (entradilla), `component: { code, group, status, import }` (la línea de importación exacta, de `exports`), `prev`/`next` (por el orden del índice). **El `# Nombre` del README sale del cuerpo** y pasa a `title`: un segundo `h1` daría el aviso 2 de `GPageHeader` y dos `h1` por página.
- **Páginas gemelas** en `en/` (como hoy), para la ruta equivalente del idioma.

### 6.2 Secciones de la página (`GPageIndex`)

- De **`page.headers`** de `useData()` con `markdown.headers` activado en el nivel 2 (`h2`): los `id` son los del ancla de markdown-it, así que coinciden con el DOM, y están en el HTML del servidor. **bruno comprueba en 1.6.4** que `page.headers` llega con `markdown.headers`; si no, los da `generate.mjs` con el mismo `slugify` de VitePress y una prueba de que cada `id` existe en la página construida.
- Al cambiar de ruta, `GPageIndex` recibe los `items` nuevos (§«Al montar y al cambiar de ruta» de `page-index.md`); `onContentUpdated` llama a `refresh()`.

### 6.3 «En el texto» (texto completo)

- Con una consulta **no numérica de 3 o más caracteres**, el sitio carga **la primera vez** el índice local (`@localSearchIndex`, el del idioma actual; ≈ 1,6 MB, como hoy) y MiniSearch (`minisearch`, **dependencia explícita del sitio** con la versión que usa VitePress 1.6.4), y añade al final de `items` el grupo `{ label: 'En el texto', filterable: false, items: [...] }` con **como mucho 5** resultados `{ id, label: 'Página · Sección', href: withBase(...#ancla), icon: 'file-text' }` que **no** repiten un título ya visible.
- **El título de un grupo no cuenta como coincidencia** (#1046): filtrar «Formularios» no deja pasar los componentes del grupo por llevar su nombre; solo coinciden los items (y sus `keywords`). Un grupo sin items coincidentes se oculta.
- Sin consulta, o con una numérica, el grupo no está. Mientras carga, no hay grupo (aparece al final, no desplaza lo de arriba).
- El anuncio y el recuento son de `GSidebar` (`labels.filterCount`/`filterNone`); las funciones del sitio añaden lo de «En el texto» («Ningún título con «oscuro»; 3 en el texto»).

## 7. Tema: claro, oscuro, sistema

- **Una sola fuente:** la preferencia en `localStorage` con la clave de hoy (`vitepress-theme-appearance`: `auto` · `light` · `dark`), para que nadie pierda la suya.
- **Antes de pintar** (script del `head`, como hoy en `config.mjs`): resuelve `auto` con `prefers-color-scheme` y escribe **a la vez** `data-theme` (tokens de Grana) **y** la clase `dark` en `<html>` (los estilos de VitePress y el tema doble de Shiki la leen). Con `auto`, sigue los cambios del sistema en vivo.
- El control de §4 escribe la preferencia y las dos marcas; `aria-checked` del grupo de radios, sin anuncio.
- **Riesgo para bruno:** el núcleo de VitePress también gestiona `.dark` con `appearance` activo; o se usa su `isDark` para lo resuelto y el sitio solo guarda `auto`, o se pone `appearance: false` y lo hace todo el sitio. Una sola de las dos, medida (sin parpadeo al cargar en claro, oscuro y sistema, tres motores).

## 8. Teclado, foco y anuncios

| Qué | Regla |
| --- | --- |
| Primer Tab | «Saltar al contenido» (`GAppShell labels.skip`) → `main`. Límite de WebKit (S7) |
| `/`, ⌘K, Ctrl+K | `focusFilter()` (en estrecho abre el drawer primero). Fuera de un campo editable para `/` |
| En el filtro | Escribir filtra; Intro va al primero; ↓ a la lista; Esc vacía sin propagar (`sidebar.md`) |
| Orden | salto → banda → índice → `main` (`h1`, zócalo con el relevo, contenido) → pie. Nada reordenado con CSS |
| Al cambiar de ruta | El foco va al `h1` (`GPageHeader.focus()`) tras `onContentUpdated`; el título del documento lo pone VitePress. **No** en la primera carga ni en un salto a `#ancla` de la misma página. Sin región viva |
| En esta página | `GPageIndex` (`page-index.md`): elegir lleva el foco a la sección |
| Anuncios | Solo el recuento del filtro (cortés, 600 ms). Tema, idioma y sección actual, sin anuncio |

## 9. Estrecho, táctil y mínimos

- **320 px sin desplazamiento horizontal**, claro y oscuro, tres motores. La banda a 320 lleva cinco piezas de 44 px como mucho (índice, marca, filtro, idioma, tema).
- **≥ 44 px** todo lo pulsable del marco con `pointer: coarse` (lo traen los componentes; lo propio del sitio, `grana-site.css`).
- Texto del marco ≥ 12 px y contraste ≥ 4,5:1 (claro y oscuro); el número en el asiento, §59 de `tokens.md`.
- **Movimiento:** el marco no anima nada propio. Se mueve lo de los componentes, cada uno con su `prefers-reduced-motion`: asiento de `GSidebar` (#617), hundido del zócalo y muelle de `GPageHeader` (#632), relevo de `GPageIndex` (#1040). El filtro no tiene movimiento (#1040).

## 10. SSR e hidratación

- El marco se pinta en el servidor con la página actual marcada (asiento, `aria-current`, miga, relevo con su ancho) y **nada salta al hidratar** (#1033): sin `matchMedia`, `location`, `localStorage` ni medidas en el primer render; el tema llega por el script del `head`.
- **Riesgo medido antes de dar por hecho:** `GSidebar mode="auto"` decide en el cliente; el primer pintado depende de la reserva por CSS de `GAppShell` (#712, `is-ready`). Con `docs:build` + `vitepress preview`, a 1280, 900 y 375: **CLS del marco = 0** y ningún aviso de hidratación, tres motores.

## 11. Capas y estilos (#516, #806)

- `site/.vitepress/theme/layers.css`, primera hoja: **`@layer vitepress, grana.defaults, grana.components, grana.blocks, grana.utilities;`**. **Hoy le faltan `grana.blocks` y `grana.utilities`** (#806: el orden lo fija la primera hoja que lo declara): hallazgo para el dueño del sitio.
- Todo el CSS de VitePress en la capa `vitepress` (plugin `layerVitepress`), los estilos de documento aislados de los ejemplos vivos (`postcssIsolateStyles`, `.vp-raw`).
- El CSS propio del marco (`grana-site.css`) solo lee `var(--g-*)` y alias locales; sin capa (gana como el tema de una aplicación). El código del contenido sigue con la letra de VitePress (§59: `--g-font-code` reservado).
- El `Layout` no pinta nada de `VPNav`, `VPSidebar`, `VPDocAside`, `VPLocalNav`: desaparecen sus estilos de pantalla, no los de documento.

## 12. Verificación (criterio de hecho)

Sobre el sitio construido (`docs:build` + `preview`, puerto propio), en `site/tests/site.spec.mjs` ampliado, tres motores, claro y oscuro, 1280 · 900 · 375 · 320:

1. Un `banner`, un `main`, un `h1`, un `contentinfo`; toda `nav` con nombre (`Documentación`, `Ruta`, `En esta página`).
2. Sin desplazamiento horizontal; táctil ≥ 44 (estrecho); contraste del marco ≥ 4,5:1 y del número en el asiento lleno.
3. `/` `2` `4` Intro llega a `GCombobox` y el foco queda en su `h1`; «oscuro» da «Ningún título» + «En el texto» con «Tematización · Modo oscuro»; Esc vacía y vuelve el total.
4. El relevo dice la sección que cruza la línea de lectura; elegir una sección lleva el foco a ella.
5. Idioma: misma ruta en el otro idioma; `lang`/`hreflang` en los enlaces.
6. Tema: los tres estados persisten y no parpadean al cargar.
7. Hidratación: sin avisos, CLS del marco 0 (§10).
8. `generate.test.mjs`: números estables (§5), sin `h1` en el cuerpo, frontmatter completo; prueba de forma de `@localSearchIndex` (§1).

**No verificable aquí:** lector de pantalla real (recuento del filtro, `aria-current="location"` en un menú), Safari y táctil reales, `forced-colors`, texto al 200 %, RTL.

## 13. Quién construye (#1045)

Por `AGENTS.md`, `site/` es de mora-docs; **para este lote el usuario lo reparte así** (2026-11-08, #1045; excepción de lote, `AGENTS.md` no cambia):

1. **coco** (Sonnet; Opus si lo pide la medida): `GPageIndex.css`, filtro y código del asiento en `GSidebar.css`; en el sitio, `grana-site.css` y `layers.css` (las cinco capas, #806).
2. **bruno** (Opus: `GPageIndex` lleva motor de lectura y foco; el filtro toca el motor de `GSidebar`): `GPageIndex.vue` + entrada + pruebas; filtro, `code`, `focusFilter` en `GSidebar.vue`; `current: 'location'` en `GMenu.vue`; `meta.json` y tipos. **En el sitio, el `Layout` y todo lo funcional:** `site/.vitepress/theme/*.vue`, `config.mjs`, `index.js`, `icons.js`, scripts, `generate.mjs` en lo que toque a los datos del marco (índice, `code`, `keywords`, frontmatter) y las pruebas del sitio.
3. **coco**, auditoría de los dos sobre el componente real.
4. **mora-docs:** solo los textos (contenido de las páginas, etiquetas y mensajes) y la enmienda de `docs/documentacion/contrato.md` §3 (§14); no toca `.vue`, `config.mjs`, scripts ni CSS del sitio.

## 14. Enmienda del contrato de documentación (para mora-docs; `docs/documentacion/contrato.md` §3 es suyo)

- **Párrafo «Marco de la página»:** el índice lateral pasa a «`Empezar` con iconos, **los grupos de componentes con su número estable** (§5 de este contrato; `aria-current="page"` en el actual, el número en el asiento), `Blocks` por familia, `Herramientas` y `Proyecto`», con **filtro en su cabecera** (`/`); la búsqueda deja de ser un botón aparte; «estado de versión» en la banda (en estrecho, en el drawer); tema **sistema/claro/oscuro**; selector de idioma con ruta equivalente. Remite a este contrato.
- **Fila 1 (Ruta y cabecera):** la cabecera es `GPageHeader`; el antetítulo es «Componente NN · <grupo>» y el estado va en `meta` (como `GBadge`), no en el antetítulo.
- **Fila 3 (En esta página):** vive en el **zócalo de `GPageHeader`** como `GPageIndex` `relay` (derivado de los `h2` reales), no como bloque del cuerpo.
- **Fila 14 (Páginas vecinas):** según el orden del índice, con el número delante en las fichas.
- **Hallazgos de kiwi para mora-docs** (S-H2): la portada dice 64 componentes (son 78); «Props» y «Referencia de la API» duplicadas; el orden de los `h2` no sigue §3 (A no lo exige —el relevo lee los `h2` que haya—, pero el contrato sí).
