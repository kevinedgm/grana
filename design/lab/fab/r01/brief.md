# Brief — botón flotante con acciones (`GFab`, nombre propuesto), r01: base funcional y tres conceptos

> kiwi, 2026-10-17. Origen: brief de diseño del usuario «Expandable FAB multi-action» (pegado en el encargo; resumen fiel en este archivo). Es **material de partida, no un contrato**: Grana decide la estructura con sus reglas y CLAUDE.md pide cuestionar la premisa de la forma.

## Lo que pide el brief (resumen)

Un botón flotante (FAB) que concentra una acción principal y despliega **hasta 15** acciones secundarias. Contraído: un círculo con icono en una esquina del visor o de un contenedor. Expandido: las acciones con icono y etiqueta; se cierra con el propio botón, al elegir (configurable), con Escape o al pulsar fuera. Cuatro estrategias: **vertical** (1–5), **radial/semicircular** (2–6 con espacio; nunca para 15), **panel** anclado con categorías, descripción opcional y altura limitada (7–15) y **auto**. Cada acción: id único, etiqueta, icono, manejador, habilitada, categoría, descripción, peligrosa, orden; las frecuentes primero; las destructivas protegidas. Sin depender del hover; teclado, lector, `prefers-reduced-motion`, foco controlado, sin activaciones duplicadas. Márgenes seguros, reposicionar si no cabe, no tapar controles críticos; en móvil, lista o panel antes que radial. Estados: contraído, expandiéndose, expandido, contrayéndose, sin acciones, deshabilitadas, en ejecución, contenido que excede la altura, error de configuración. Validar ids duplicados y el límite; **nunca descartar en silencio**. Regla fundamental: **la cantidad no decide por sí sola la forma radial**.

## El problema de lo que hay

- **En los frameworks:** el *speed dial* de Material 2 y MUI: mini círculos solo con icono y la etiqueta en un `title` o al pasar el ratón (en táctil no hay etiqueta), todo cuesta **dos toques** aunque una acción se use el 80 % de las veces, el icono «+» se convierte en otra acción al abrir (el doble toque la ejecuta), y la lista tapa lo que hay debajo sin decir nada. Material 3 lo sustituyó por un «FAB menu» vertical de hasta 6; con 15 no hay respuesta.
- **En Grana:** `GMenu` ya es el motor de un menú de comandos completo (APG *Menu Button*: foco itinerante, letra, Esc, Tab, fuera, grupos, `danger`, deshabilitados enfocables, iconos Lucide, las cuatro reglas de paneles anclados #358, M1 y M4). Le falta todo lo que es **flotante**: posición en el borde del visor con área segura, convivencia con `GToaster`, `GStatusIsland`, `GSpeechHost` y el muelle de `GPageHeader` (`edgeReserve`), qué hacer bajo un modal, no tapar el foco (WCAG 2.4.11), la descripción por acción, la confirmación de lo peligroso y el acuse de una acción en curso.

## Qué es esta ronda

1. **Base funcional** común a cualquier forma (semántica de botón de menú, foco, teclado, táctil, doble activación, peligro, en curso, anuncios, movimiento reducido, posición y convivencia de bordes), con su propia demostración (la forma literal del brief: lista ≤ 5 y caja con más).
2. **Fronteras** con `GMenu`, `GBtn`, `GTooltip`, `GIcon`/`GLibIcon`, `GSpeechTrigger`/`GSpeechPill`, `GPageHeader` y `GTable` (acciones de selección), y cuánto aporta un componente propio frente a «un `GMenu` con otro disparador».
3. **Tres conceptos divergentes** con los tokens reales del tema por defecto (`dist/grana.css`), con 1, 3, 6, 10 y 15 acciones, en escritorio y móvil, claro y oscuro, RTL: **A · La pila que crece**, **B · Arco con gesto** y **C · Acción con cola**. Comparativa y una pregunta de elección.

Deriva de HTML, WAI-ARIA APG (*Menu Button*, *Menu*), WCAG 2.2 (1.3.1, 1.3.2, 1.4.3, 1.4.11, 1.4.10, 2.1.1, 2.4.3, 2.4.7, 2.4.11, 2.5.1, 2.5.2, 2.5.7, 2.5.8, 4.1.2, 4.1.3) y los contratos vigentes (`menu.md`, `btn.md`, `tooltip.md`, `status.md`, `toast.md`, `speech.md`, `page-header.md`, `api.md` «Paneles anclados» #358, «Acciones con acuse» #643, «Avisos de desarrollo» #653, `tokens.md` §29).

## Solapes revisados antes de proponer

| Componente | Qué comparte | Decisión |
| --- | --- | --- |
| `GMenu` | Todo el motor de menú: roles, foco itinerante, letra, Esc/Tab/fuera, grupos, `danger`, `disabled` enfocable, iconos, reglas #358 | **No se duplica.** El motor se extrae a una utilidad interna compartida (como `utils/collapse.js` salió de `GFormSection` para `GAccordion`); `GFab` aporta lo flotante. Ver `declaracion.md` §Fronteras |
| `GBtn` | El círculo con icono, `icon`, `rounded="pill"`, `tooltip`, rebote al soltar (#300) | El disparador **es un `GBtn`** (icono, píldora); `GFab` solo le añade tamaño de FAB, elevación y su sitio |
| `GTooltip` | El nombre visible de un disparador solo con icono | Se usa tal cual (`GBtn tooltip`); `aria-expanded="true"` ya no lo abre (#384). Las etiquetas del arco **no** son tooltips (siempre visibles al abrir) pero toman su forma (pestaña en superficie inversa, #387) |
| `GIcon` / `GLibIcon` | Iconos | Solo Lucide (#85 a #87): `x` al abrir, `loader-circle`, `check`, `circle-alert`, `triangle-alert`, `ellipsis-vertical`; nada dibujado con CSS |
| `GSpeechTrigger`, `GSpeechPill` | Algo flotante en un borde | La voz no se monta en el FAB; «Dictar» puede ser una acción que llama a `speech.start()` (aplicación). Convivencia por `EDGE_ORDER` |
| `GPageHeader` (muelle en estrecho) | Acciones de página en la zona del pulgar | Las acciones **de la página** van en el muelle; el FAB es para crear o capturar desde cualquier sitio. No los dos en la misma esquina (aviso, L-hallazgo) |
| `GTable` acciones de selección | Acciones sobre lo elegido | No es un FAB: van junto a la selección. Frontera documentada |
| `GToaster`, `GStatusIsland`, `GSpeechHost` | El borde del visor | `edgeReserve` con orden nuevo `fab` (propuesta L6) |

## Entregables

- `index.html` + `fab.js` + `fab.css`: galería (base, A, B, C) en marcos de escritorio (720×480) y móvil (360×600) con 1, 3, 6, 10 y 15 acciones; marco de error de configuración; modo `?solo=A&n=10` con el FAB fijo al visor, bordes compartidos simulados (`&dock=1`, `&speech=1`, `&toast=1`) y un modal real.
- `frontera.html`: los componentes **reales** de `dist/` (`GBtn`, `GMenu`, `GDialog`) para medir el disparador y el orden «elegir → abrir un diálogo → volver».
- `serve.mjs` + `verificar.mjs`: verificación en Chromium, Firefox y WebKit, **puerto 4213** (`GRANA_PW_PORT`).
- `declaracion.md`: decisiones numeradas, fronteras, conceptos, comparativa, «Qué lo hace distinto», propuesta de API, hallazgos L1… para lima y la pregunta de elección.

## Ver

`index.html` (`?dir=rtl`, `?theme=dark`, `?solo=A|B|C|base&n=1|3|6|10|15&pos=bottom-end|bottom-start|bottom-center|top-end&dock=1&speech=1&toast=1`). Verificación: `node design/lab/fab/r01/verificar.mjs` (`ENGINES=chromium`, `VERBOSE=1`; requiere `npm run build` por `dist/`).
