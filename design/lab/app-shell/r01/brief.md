# Brief — chasis de aplicación (`GAppShell`), pila (`GStack`) y sección (`GSection`), r01

> kiwi, 2026-10-21. Encargo del usuario del 2026-10-21 (un solo encargo para las tres primitivas). Reutiliza la ronda del contenedor (`design/lab/container/r01/`, sin decisión del usuario todavía: se asume **B · Sangrado alineado** como hipótesis de trabajo, sin reabrir su elección).

## Problema

Montar una página con Grana obliga a escribir a mano el **chasis**: la caja que reparte el visor entre cabecera, barra lateral, región principal y bordes. Hoy todo eso es de la aplicación:

- `GSidebar` «no empuja el contenido»: la aplicación reserva su sitio en cuatro formatos escuchando `mode-change` (`sidebar.md` «Espacio en el diseño»).
- La cabecera fija es de la aplicación y se cuenta una vez (`api.md` «Cabecera fija de la aplicación: una variable»): la aplicación escribe la receta `--app-header` → `--g-page-header-top`, `--g-accordion-sticky-top`, `scroll-padding-block-start`, y pasa el mismo alto como `offset.top` a `GStatusIsland` y `GToaster`.
- Nadie pone el `main` único, el enlace de salto, el desplazamiento sin scroll horizontal ni la reserva del navbar inferior frente a los avisos.

## Quién lo usa

- **Quien integra** (desarrollador de la aplicación): quiere escribir `<GAppShell>` con su cabecera, su `GSidebar` y su página, y que `GPageHeader`, `GAccordion sticky`, la isla y los avisos «sepan» dónde está la cabecera sin receta.
- **Quien usa la aplicación** (personal administrativo en escritorio y portátil, a veces en teléfono): necesita que la navegación no le mueva lo que lee, que lo pegado no le coma la pantalla con zoom o en un teléfono apaisado, llegar al contenido sin recorrer la navegación con Tab y que el foco nunca quede bajo una barra.
- **Teclado, lector de pantalla, baja visión (zoom 200–400 %), movimiento reducido, `forced-colors`, RTL.**

## Alcance

1. **`GAppShell`**: regiones con *landmarks* (cabecera de aplicación opcional por slot, `nav` = `GSidebar` por slot, `main` único, pie opcional), reserva del sidebar en sus cuatro formatos (y `overlay`, `floating`), cabecera fija publicada una sola vez, región principal que desplaza, convivencia con `edgeReserve` (voz → zócalo → FAB → isla → avisos), zona de marca en cabecera o sidebar, RTL, 400 %, `forced-colors`, movimiento reducido. Base + conceptos A/B/C con los tokens reales del tema por defecto.
2. **`GStack`**: apila hijos en un eje con la escala de separación de Grana (`gap` `none` `sm` `md` `lg` por factor, como #360) y `density`; sin superficie. Sin forma visible: no aplica «conceptos antes que caja» (#362), sí «Qué lo hace distinto».
3. **`GSection`**: región de página con encabezado (`h2`…`h4`), descripción y acciones. Decidir si es componente o receta. Ídem #362.

**Fuera:** `GGrid` con puntos de corte (contradice #339 a #365), `GSplit` (lo absorbe el chasis), `GContainer` (su ronda ya existe; aquí solo su relación con el chasis).

## Auditoría previa (`docs/documentacion/auditoria-visual.md` §1 y §3) sobre el chasis actual del playground

Inspeccionado `packages/vue/playground/index.html` (barra `pg-bar`, índice `pg-nav`, `pg-main`, demo de `GSidebar` en la línea ~1590 y del acordeón pegado en la ~2080).

| Aspecto | Observado | Valoración |
| --- | --- | --- |
| Estructura | `header.pg-bar` pegado + `nav.pg-nav` + `main.pg-main` en una rejilla `264px 1fr`; regiones bien elegidas | Cumple la idea; **todo a mano** y con literales |
| Cabecera fija | Alto `61px` escrito en **tres sitios** (`.pg-nav` `inset-block-start`, `max-block-size: calc(100vh - 61px)`, `var(--pg-bar-h, 61px)`), más un JS que mide `--pg-bar-h`; `html { scroll-padding-top: 76px }` es **otro literal** que no suma el zócalo de `GPageHeader` | No cumple «una variable» (#515/#629): cuatro fuentes de la misma cifra que se desfasan al cambiar `space` o al partir la barra en dos líneas |
| Visor | `100vh` (en móvil incluye la barra del navegador: el índice queda cortado); punto de corte `@media (max-width: 899px)` literal | No sigue a `space` ni al ancho real; contradice la adaptación por contenedor de `GSidebar` (#69) |
| Sidebar real | La demo pone en el `<main>` estilos en línea calculados desde `mode-change`: `paddingBlockEnd` con `--g-sidebar-bar` y `paddingInlineStart` con `--g-sidebar-rail` para `overlay` | Correcto pero **cada aplicación lo reescribe**; el `overlay` depende de un padre de alto fijo (`block-size: 520px`): en una página que desplaza, la expansión superpuesta mide el documento entero (ver hallazgo S2 de la declaración) |
| Cabecera de la aplicación de la demo del acordeón | `div` pegado de `48px` y `--g-accordion-sticky-top: 48px` a mano | Mismo problema de la receta |
| Salto de bloques (2.4.1) | **No hay enlace de salto**: para llegar al contenido hay que pasar por la barra y el índice entero con Tab | No cumple |
| Movimiento | `html { scroll-behavior: smooth }` **sin** guarda de `prefers-reduced-motion` | No cumple la rúbrica (F, opcionalidad) |
| Desplazamiento horizontal | `.pg-panel { overflow-x: auto }` por panel; la página no desborda | Cumple |
| Contraste y delimitación | Barra sobre `surface` con borde `border-strong`; índice con borde `border` | Cumple |
| Consistencia | El índice no es `GSidebar` (lista propia con estilos propios) | Pendiente aceptable (el playground es un banco, no una aplicación); lo anoto, no lo toco |

**Conclusión:** el chasis existe en cada aplicación, con las mismas cifras repetidas. Lo que se puede reutilizar: `GSidebar` (formatos y tokens de estructura), `GPageHeader` (zócalo de alto de contrato y propiedad de entrada `--g-page-header-top`), `GAccordion sticky`, el registro de bordes `edgeReserve`, la zona de marca y el contenedor de la ronda anterior. **No se reconstruye nada de eso**: el chasis los coloca y les pasa la única cifra que les falta.

## Solapes revisados (no duplicar)

| Pieza | Qué ya hace | Qué hará el chasis |
| --- | --- | --- |
| `GSidebar` | Formatos, adaptación por ancho de su **padre** (`parentElement`), `mode-change`, tokens `--g-sidebar-width/-rail/-bar`, drawer `<dialog>` | Reservar su sitio **por CSS** leyendo su clase de formato (`:has()`), ser su padre (la caja que mide) y pegarlo al visor |
| `GPageHeader` | Zócalo pegado de alto de contrato; lee `--g-page-header-top`; regla del cuarto | Darle `--g-page-header-top` y el `scroll-padding` |
| `GAccordion sticky` | Lee `--g-accordion-sticky-top` | Dárselo |
| `GStatusIsland`, `GToaster`, `GFab`, `GSpeechHost` | Leen el registro de bordes y `offset` | Publicar la cabecera y el navbar en el registro |
| `GContainer` (ronda r01) | La **columna** (ancho, margen, sangrado) | Nada: va dentro de la región principal |
| `GAdaptiveLayout`, `GFormLayout`, `GCardGroup`, `GSurface`, `GFormSection`, `GCard` | Reparto automático, formularios, grupo de tarjetas, superficie, sección de formulario, objeto con superficie | `GStack` y `GSection` no los sustituyen (frontera en la declaración) |

## Entregables

`index.html` (prototipo con `GSidebar`, `GPageHeader`, `GBtn` y `GIcon` **reales** de `dist/`, Vue global; chasis, pila y sección del prototipo en `shell.js`/`shell.css` con tokens reales), `declaracion.md` (puntos numerados, conceptos A/B/C, comparativa, recomendación, «Qué lo hace distinto», rúbrica de movimiento, hallazgos para lima, una pregunta, cumplimientos/correcciones/pendientes) y `verificar.mjs` (Playwright, puerto 4211).
