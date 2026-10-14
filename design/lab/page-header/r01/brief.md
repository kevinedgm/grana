# Brief — encabezado de página (`GPageHeader`, nombre de trabajo), r01: base funcional y tres conceptos

> kiwi, 2026-10-13. Origen: integración real de Grana en NisaNabani (página de Notion «Hallazgos de integración real», **hallazgo 9, P2**; tema `brand #24366B` navy, `accent #C1D324` lima). Componente nuevo: base funcional (HTML, WAI-ARIA APG, WCAG 2.2) **y** tres conceptos divergentes de forma y comportamiento (A/B/C), sobre todo de la **franja condensada al desplazar**, con los tokens reales del tema por defecto y, como segundo tema, el de NisaNabani derivado con `@grana/cli` (`nsa.config.json` → `nsa-tokens.css`).

## Para qué

Abrir una página de la aplicación: **dónde estoy** (ruta), **qué es** (el `h1`, una descripción, su estado), **qué puedo hacer** (acciones), **cómo va** (métricas) y **qué secciones tiene** (pestañas). Y, al desplazarse por una página larga (expediente, muestra, lote), no perder el nombre de la página ni las acciones. Lo usan administraciones y sistemas de laboratorio, en escritorio con barra lateral, en tableta y en teléfono, con teclado y con lector de pantalla.

## El problema de lo que hay

- **`GCard` no sirve** (hallazgo 9): resume una entidad, su `headingLevel` va de 2 a 6, no tiene `h1`, su título es el enlace estirado de la tarjeta y su superficie es la de un elemento entre otros. **`GSurface`** es solo superficie. NisaNabani construyó `nsa-encabezado` con el método de Grana (ruta con separadores decorativos, `h1`, descripción, acciones `GBtn`, contenido con métricas y una franja condensada fija con ruta + título + acciones). Su contrato y su auditoría (`grana-ui/src/design/contracts/encabezado.md` del proyecto NisaNabani) **no están en este disco**: la ronda sigue sin ellos.
- **La premisa común de «la cabecera que encoge»**: al desplazar, el título se achica, la descripción se pliega y la cabecera cambia de alto. Eso mueve la página bajo el dedo (el ancla del desplazamiento salta), o bien se pinta una **segunda cabecera fija con copias** del título y de las acciones: dos botones «Validar» en el árbol, dos paradas de Tab, el estado de uno (cargando, menú abierto) que el otro no tiene.
- **La franja fija se cuenta mal**: tapa el destino de un `#id` o el control enfocado (WCAG 2.4.11), se monta sobre la barra lateral (`position: fixed` mide la ventana, no la columna), choca con la isla de estado y los avisos de arriba, y a 200–400 % de zoom se come la pantalla.

## Qué es esta ronda

1. **Base funcional** (forma convencional a propósito, con neutros): raíz `header` dentro de `main` (no `banner`), `h1` único, orden de lectura ruta → título → acciones → contenido → pestañas, acciones en un grupo con nombre, estrecho por el ancho del propio encabezado, táctil 44 px, RTL, zona de marca (supuesto).
2. **Tres conceptos para la franja**, cada uno con una premisa distinta: **A · Relevo** (la franja existe, pero no es una copia: el título sube a ella con el desplazamiento y **las mismas acciones se mudan**), **B · Zócalo** (no hay franja: **el encabezado entero se hunde** bajo el borde hasta su última fila, que ya tenía pestañas y acciones), **C · Muelle** (arriba no queda nada: las acciones **bajan a la zona del pulgar**).
3. **Comparativa, recomendación (B con el muelle de C en estrecho) y una pregunta de elección.**

## Solapes revisados antes de proponer

| Componente | Qué comparte | Decisión |
| --- | --- | --- |
| `GCard` | Eyebrow, título, descripción, `meta`, acciones, `labels` sin valores; `headingLevel` | **Frontera:** `GCard` resume **una entidad entre otras** (h2–h6, enlace estirado, superficie elevada); `GPageHeader` **abre la página** (h1, sin acción estirada, sin elevación). Mismo vocabulario de regiones (`eyebrow`, `title`, `description`, `meta`, `actions`) para no inventar sinónimos; ningún código común |
| `GSurface` | Superficie y tono | **No compone `GSurface`** (un encabezado no es un nivel de profundidad). La **zona de marca** la decide `design/lab/surface/r02/` (en curso): aquí, un supuesto (tokens redefinidos en la raíz) y la dependencia marcada |
| `GBreadcrumbs` | La ruta | **Se compone por slot** (`trail`) con el `GBreadcrumbs` real; el encabezado no repinta la ruta. A necesita el padre para «Subir»: registro por `provide/inject` (L4) |
| `GBtn`, `GMenu` | Acciones y «Más acciones» | **Slot** de la aplicación; el encabezado solo las agrupa, las muda (A, C) y dice si es estrecho. Una sola principal sólida (`tokens.md` §2) |
| `GMetric`, `GSummary`, `GBadge`, `GTag` | Contenido y estado | **Slots** (`default` y `meta`); el prototipo usa `GMetric` real por clases |
| `GTabs` + `GTabPanel` (#118) | Pestañas bajo el encabezado | **Slot `tabs`** en la última fila (el zócalo); los paneles van en el cuerpo de la página con `GTabPanel` (`detached`), que es justo el caso de cabecera y paneles en ramas distintas |
| `GAccordion` `sticky` (#484, #515) | Cabecera fija de la aplicación y `scroll-padding` | **Misma receta:** la cabecera fija es de la aplicación; el encabezado lee su alto de una entrada pública (`--g-page-header-top`, como `--g-accordion-sticky-top`) y la receta de `scroll-padding` suma la franja |
| `GStatusIsland`, `GToaster`, voz (`edgeReserve`, #322) | Bordes de la ventana | **Un cliente más de `edgeReserve`**: la franja (A, B) reserva el borde de arriba y el muelle (C) el de abajo, para que la isla y los avisos se apilen sin taparse (L9) |
| `GSidebar` | Estructura de la aplicación | Sin solape: la barra lateral es de la aplicación; el encabezado va en `main` y **nunca** se monta sobre ella (A mide la caja del encabezado) |
| `GEmpty` / `GLoadRegion` | Carga | Reservado: un encabezado en carga es un molde de `GLoadRegion` (no se prototipa) |

## Entregables

- `index.html` (`?c=base|A|B|C`, `&final=C` con `c=B` = la recomendación, `&zone=brand`, `&theme=nsa`, `&tabs=0`, `&dir=rtl`), `ph.js` (motor del prototipo), `ph.css` (base con neutros; A/B/C con los tokens reales del tema por defecto, `dist/grana.css`), `nsa-tokens.css` (tema de NisaNabani generado por `@grana/cli` desde `nsa.config.json`; solo laboratorio).
- `verificar.mjs` (Playwright en Chromium, Firefox y WebKit, **puerto 4215**).
- `declaracion.md`: decisiones numeradas, «Qué lo hace distinto», comparativa, recomendación, comprobaciones, hallazgos L… para lima, dependencia de la zona de marca y la pregunta de elección.

## Ver

`python3 -m http.server 4215` desde la raíz del repo (o el servidor de `verificar.mjs`) y abrir `/design/lab/page-header/r01/index.html`. Requiere `packages/vue/dist` (`npm run build`) para los tokens y la fuente. Verificación: `node design/lab/page-header/r01/verificar.mjs`.
