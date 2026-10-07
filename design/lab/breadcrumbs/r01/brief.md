# Brief — migas de pan (`GBreadcrumbs`, nombre de trabajo), r01: base funcional y tres conceptos

> kiwi, 2026-10-07. Origen: Fase C del plan de v1, punto 13. Componente nuevo: base funcional (WAI-ARIA APG *Breadcrumb*, WCAG 2.2) **y** tres conceptos divergentes de forma y comportamiento (A/B/C) en la misma ronda, con los tokens reales del tema por defecto (regla del usuario, CLAUDE.md «Personalidad e innovación»).

## Para qué

Decir **dónde está** la página dentro de una jerarquía y dejar **subir** a cualquier nivel: Inicio · Laboratorio central · Muestras · Lotes de octubre · Lote 2026-0412 · Muestra M-0007. Lo usan administraciones, expedientes, catálogos y explorador de archivos; en escritorio (puntero, Tab), en móvil (dedo, 320px) y con lector de pantalla (un punto de referencia `navigation` más). La jerarquía la conoce la aplicación: el componente no navega, no pide datos y no conoce ningún router.

## El problema de lo que hay

- **La premisa común: textos separados por barras o por el signo «mayor que».** Cabe en escritorio y se rompe en móvil: o se parte en tres líneas, o los niveles de en medio desaparecen tras un «…» que nadie abre, o se queda solo el último (que ya es el título de la página).
- **El «…» de los frameworks** abre un `role="menu"` con los niveles: enlaces que dejan de ser enlaces (sin «abrir en pestaña nueva», sin URL al pasar), y una lista que el lector recibe incompleta.
- **El último nivel repite el título** (`h1`) y el más usado, **subir uno**, no tiene más peso que los demás.
- **Los separadores son decorativos por convención** y ocupan un sitio que podría hacer algo: moverse **de lado** (del lote 0412 al 0413) obliga hoy a subir y volver a bajar.

## Qué es esta ronda

1. **Base funcional** (forma convencional, a propósito, con neutros del tema): `nav` + `ol`, `aria-current="page"`, separadores Lucide decorativos y espejados en RTL, cesión por prioridad en anchos estrechos con recuperación por divulgación (`+N`), truncado con el nombre entero en el árbol y una pista visual, niveles sin página, móvil con 44px, enlace de la aplicación sin router propio.
2. **Tres conceptos** que cuestionan la premisa: **A · Ruta líquida** (nada se esconde: los niveles se comprimen a pastillas por prioridad y se despliegan al recibir el foco; la ruta se extiende y se recoge al navegar), **B · Escalón** (la miga es una acción, subir; la ruta completa es una escalera que se abre), **C · Puertas** (los separadores abren los hermanos del nivel siguiente).
3. **Comparativa, recomendación y una pregunta de elección.**

## Solapes revisados antes de proponer

| Componente | Qué comparte | Decisión |
| --- | --- | --- |
| `GSidebar` | Navegación con `href` + `navigate` cancelable (#70), destino actual, riel con pista del motor (#436), navbar sin pista (#437) | **Mismo contrato de enlaces** (`href` + `navigate` con el evento nativo, sin `to` ni router). Sin solape de función: la barra lateral dice **la sección**, las migas **la profundidad**. Pueden convivir en la misma página |
| `GMenu` | Lista anclada a un disparador, teclado, paneles estables (#358, #308) | **No se usa para el desbordamiento**: `GMenu` es de **acciones** (`role="menu"`, `select`), y los niveles ocultos son **enlaces** (abrir en pestaña nueva, URL en la barra de estado, clic central). Se usa el patrón APG *Disclosure Navigation* con una lista de enlaces anclada (regla de paneles de #358) |
| `GTooltip` / pista visual (#433) | Nombre entero de lo truncado, pestaña, tiempos, táctil | **Modo visual del motor** (`utils/visualTip.js`, nodo `aria-hidden`): el nombre ya está entero en el árbol; la pista solo lo enseña a quien ve. Sin `title` (#113) |
| `GSummary` | Cesión por prioridad sin `@container` ni umbrales, «+N», ceder no es ocultar (#352, #353) | **Mismo lenguaje** en A: cesión intrínseca con pesos de `flex-shrink` y mínimos, «+N» como texto; el `.vue` solo mide por lotes. B y C no ceden igual |
| `GPagination` | `nav` + lista, `aria-current="page"`, `labels.nav` obligatorio con aviso | **Mismo patrón de textos** (`labels`, sin valores por defecto) |
| `GStepper` | Una fila de pasos conectados | **Frontera:** el stepper es un **proceso** (orden temporal, estado de cada paso); las migas, una **jerarquía** (lugar). Ningún concepto dibuja círculos ni líneas de progreso, para que no se confundan |
| `GTabs` | Fila horizontal, marca que viaja | Sin solape: las pestañas cambian de panel en la misma página |
| `GHelper` | Popover anclado | Sin solape: el panel de C y la escalera de B son **navegación**, no ayuda |

## Entregables

- `index.html` (página única, `?c=base|A|B|C`, `?dir=rtl`, `?w=` ancho del marco), `crumbs.js` (motor del prototipo: datos, cesión, divulgaciones, pista visual, puertas, escalera), `crumbs.css` (base con neutros; A/B/C con los tokens reales del tema por defecto).
- `verificar.mjs` (Playwright en Chromium, Firefox y WebKit, **puerto 4215**).
- `declaracion.md`: decisiones numeradas, «Qué lo hace distinto», comparativa, recomendación, comprobaciones, hallazgos L1… para lima y la pregunta de elección.

## Ver

`python3 -m http.server 4215` desde la raíz del repo (o el servidor de `verificar.mjs`) y abrir `/design/lab/breadcrumbs/r01/index.html`. Requiere `packages/vue/dist` (`npm run build`) para los tokens y la fuente. Verificación: `node design/lab/breadcrumbs/r01/verificar.mjs`.
