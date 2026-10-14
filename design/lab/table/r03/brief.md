# Brief — `GTable` r03: activación de fila, estado de fila y resumen del servidor

**Dueño:** kiwi · **Fecha:** 2026-10-13 · **Origen:** integración real (Notion «Hallazgos de integración real», **hallazgo 14, P2**; proyecto NisaNabani: tablas de inventario de lotes con paginación del servidor).
**Ruta:** R1 (mejora de un componente `candidate`) · **Fidelidad:** F2 con los **tokens reales del tema por defecto** (`packages/vue/dist/grana.css`) y el DOM y las clases reales de `GTable` (`g-table__*`), para juzgar identidad y no una caja gris.

## Para qué

En el inventario de NisaNabani la persona que gestiona el laboratorio recorre lotes (reactivos, consumibles), localiza los caducados o por caducar y abre su ficha para actuar (desechar, mover, pedir). Hoy:

1. **El detalle se abre con doble clic en la fila.** No llega por teclado (WCAG 2.1.1), no se descubre (no hay nada que diga que la fila hace algo), no se anuncia (el lector no oye un control) y en táctil un doble toque es zoom.
2. **El estado de la fila («lote caducado») va en una clase libre** que la aplicación pinta con su color: el estado depende solo del color (WCAG 1.4.1), el lector no lo oye y la clase se sale del contrato de tokens (un tema oscuro o de alto contraste no la conoce).
3. **El modo servidor** entrega `total`, pero la aplicación también tiene **métricas sobre toda la búsqueda** (cuántos caducados hay en las 47 filas, no solo en la página de 8) que quiere enseñar en `GMetric` o usar como filtros rápidos. No está documentado cómo.

## Qué es esta ronda

- **Base funcional** (lo que no se discute, derivado de estándares): una **puerta** real por fila (`<a href>` o `<button>`) en el título de la columna principal; Intro, clic central y «abrir en pestaña» nativos; nada de `tabindex` en `<tr>` ni `role="grid"`; estado de fila **semántico** con texto, forma y tono del tema.
- **Tres conceptos divergentes** de cómo se activa una fila y cómo se marca su estado, que cuestionan la premisa «la fila entera es un botón que se pulsa dos veces»:
  - **A · La puerta:** la fila no se pulsa; la **celda principal entera** es la puerta y el resto de la fila queda libre para leer y copiar. Estado en el **lomo** de la fila más una etiqueta junto al nombre.
  - **B · Despliegue:** activar no lleva a otra página: la ficha **se despliega debajo de la fila**, en su sitio, sin perder la página del servidor. Estado sellado **en la celda que lo causa** (la caducidad), no en la fila entera.
  - **C · Lente:** activar **apunta** una fila (`current`) y la ficha vive en un **inspector** junto a la tabla, con «Anterior / Siguiente» que cruza páginas del servidor. Estado con **recuento de la página** y saltos «Ir al siguiente caducado».
- **Receta del `summary` del servidor** (las tres comparten): métricas sobre toda la búsqueda que alimentan filtros rápidos.
- Comparativa y **una pregunta de elección** para el usuario.

## Solapes revisados antes de proponer

| Pieza existente | Qué aporta | Qué se reutiliza |
| --- | --- | --- |
| `GCard` `interaction` (`link`/`button`), `navigate`, `activate`, `current` (#133) | Una acción principal **real** dentro del título que cubre la tarjeta; `current` con borde + `chevron-right`; casilla explícita que no activa la principal | La puerta en el título, `navigate`/`activate` con los mismos nombres y la regla de #505; `is-current` con `chevron-right` en C |
| `GCard` `status` + `statusText` (#133) | Aviso de contenido con icono + texto + marca de borde de **forma distinta por valor** (sólido/discontinuo), `info`/`success`/`warning`/`error` → `danger` | Los mismos cuatro valores y la regla de forma por valor; **sin** `role="status"` en una fila (no es un mensaje) |
| `api.md` «Enlaces y `navigate`» (#505, #523) | Solo clic primario sin modificadores emite; clic central y Ctrl/⌘ los resuelve el navegador | La puerta-enlace la cumple tal cual |
| `GAccordion` + `utils/collapse.js` (#515) | Plegado sin mover el encabezado, `hidden="until-found"` | El despliegue de B |
| `GTranscript` (#244) | Rejilla de APG (`role="grid"`) con una sola parada | **No** se reutiliza: aquí las celdas son lectura, no edición; la tabla sigue siendo tabla de datos (r01 #2) |
| `GBadge` (texto + icono, tonos del tema) | Etiqueta que no depende del color | La etiqueta de estado |
| `GMetric`, `GFilterBar` (`count`, `suggest`) | Cifras y filtros | La receta del `summary` |
| `GPagination` + selector de filas por página (ronda paralela `design/lab/pagination/r02/`) | Pie de la tabla | **No se toca.** C cruza páginas emitiendo `update:page`; el selector vive en el pie y no compite con nada de esta ronda |
| Carga de `GTable` (#265, #540, #559) | Fases, foco por `rowKey`, región viva | Se respeta: abrir/desplegar/apuntar se recuerdan por `rowKey` y sobreviven a una recarga |

## Entregables

- `index.html` + `rows.css` + `rows.js`: prototipo con `?c=base|A|B|C`, ancho de tarjetas (`?w=360`), RTL y tema oscuro; registro de eventos emitidos.
- `verificar.mjs`: comprobaciones con Playwright (Chromium, Firefox, WebKit), puerto `GRANA_PW_PORT` (4217 por defecto).
- `declaracion.md`: base, conceptos, «Qué lo hace distinto», comparativa, hallazgos para lima y la pregunta.

## Ver

```bash
python3 -m http.server 4173   # desde la raíz del repo, con packages/vue/dist construido
# http://localhost:4173/design/lab/table/r03/?c=A
GRANA_PW_PORT=4217 node design/lab/table/r03/verificar.mjs
```
