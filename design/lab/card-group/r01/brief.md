# Brief — grupo de tarjetas que filtran (`GCardGroup`, nombre reservado por #124), r01: base funcional y tres conceptos

> kiwi, 2026-10-13. Origen: integración real de Grana en NisaNabani (página «Hallazgos de integración real», **hallazgo 19, P3**): «tarjetas de métricas que filtran; al pulsar una, la tabla se filtra por ella. Son de selección única con `interaction="toggle"` y hoy la exclusividad se coordina a mano». Reserva previa: #124 («`GCardGroup` diferido»), `card.md` «Fuera de v0.1», `PENDIENTES.md` (fila `GCardGroup`), README de `GCard` «Limitaciones conocidas».

## Para qué

Una fila de tarjetas de métrica encima de una tabla: «Pendientes 8 · Vencidas 4 · Pagadas 10 · En disputa 2». Cada tarjeta dice **cuántas hay** y, al pulsarla, **la tabla enseña solo esas**. Volver a pulsarla quita el filtro. Lo usa quien revisa una bandeja (facturas, muestras, pedidos, casos) con ratón, con el dedo en un móvil, con teclado y con lector de pantalla, a menudo junto a la barra de filtros de la propia tabla.

## El problema de lo que hay

- **En la aplicación:** cada `GCard interaction="toggle"` guarda su propio booleano; la aplicación apaga las demás a mano, traduce la elegida a un filtro de la tabla y, si la persona quita el filtro desde la barra (`GFilterBar`), tiene que volver a apagar la tarjeta. Cada tarjeta es una parada de Tab más antes de llegar a la tabla, y el valor de la métrica no forma parte de lo que oye el lector («Vencidas, botón de alternar» sin el «4»).
- **En los frameworks:** «tarjetas que se iluminan»: un borde de color en la elegida y nada que diga **qué** filtran ni **dónde** está el resultado. Se confunden con pestañas (que siempre tienen una elegida) o con radios (que no se pueden soltar).
- **En Grana**, tres piezas se parecen y ninguna sirve: `GCard selectType="radio"` (un valor de formulario: no se suelta, las flechas eligen), `GRadioGroup appearance="card"` (opción de formulario, sin contenido propio) y `GTagGroup` con etiquetas de alternar (independientes, sin exclusividad, una parada por etiqueta).

## Qué es esta ronda

1. **Base funcional** con las tarjetas reales (`GCard` + `GMetric` de `dist/`) y una tabla real (`GTable` con su `GFilterBar`): semántica (barra de herramientas de botones de alternar), selección única que se suelta y selección múltiple, una parada de Tab con flechas, valor de la métrica en la descripción accesible, sincronía de ida y vuelta con los filtros de la tabla, anuncio (lo hace la tabla), rejilla y móvil. La forma es la de `GCard` seleccionada hoy, **a propósito**.
2. **Tres conceptos divergentes** con los tokens reales del tema por defecto, que cuestionan la premisa de «tarjetas que se iluminan»: **A · Lengüeta** (la elegida se une a la tabla que filtra), **B · El todo y sus partes** (las tarjetas son las partes de un total y lo que se apaga es lo que queda fuera), **C · La frase** (no hay tarjetas: hay una frase con cifras que se pulsan). Comparativa y una pregunta de elección.

Deriva de HTML, WAI-ARIA APG (*Toolbar*, *Button* con `aria-pressed`), WCAG 2.2 (1.3.1, 1.4.1, 1.4.3, 1.4.11, 2.1.1, 2.4.3, 2.4.7, 2.5.8, 4.1.2, 4.1.3) y los contratos vigentes (`card.md`, `tag.md` #465, `radio-group.md`, `filter-bar.md`, `table.md` #265, `api.md` #441/#450, `tokens.md` §7.1 y §29).

## Solapes revisados antes de proponer

| Componente | Qué comparte | Decisión |
| --- | --- | --- |
| `GCard interaction="toggle"` | El botón de alternar en el título, la marca estática, el estado `is-selected`, la personalidad C2 (el tinte nace de la marca) | **Se reutiliza tal cual.** `GCardGroup` no dibuja tarjetas: coordina las `GCard` hijas (estado, parada única, descripción) |
| `GCard selectType="radio"` + `role="radiogroup"` del consumidor | Exclusividad | **Frontera:** valor **de formulario** (se envía, siempre uno, las flechas eligen) = radio. Estado **de la vista** que se puede soltar = `GCardGroup`. El modo radio se queda como está (#124); la casilla maestra y mínimo/máximo de las tarjetas de formulario siguen reservados |
| `GRadioGroup appearance="card"` | Tarjeta como opción | Opción de formulario sin contenido propio (#273). Sin cambio |
| `GTagGroup` (alternar) | Conjunto de botones `aria-pressed` | Etiquetas **independientes** y una parada por etiqueta (#465). `GCardGroup` añade exclusividad y una sola parada; una etiqueta que filtra sigue siendo `GTag` |
| `GTabs appearance="segmented"` | Fila con una elegida | Pestañas: siempre hay una y cambian **el panel**, no lo filtran. Las tarjetas no son pestañas (la lengüeta de A lo vigila) |
| `GFilterBar` / `GTable` | El filtro resultante (`{ key, op: 'in', value }`) y el recuento anunciado | **Una sola verdad:** la tarjeta escribe en los `filters` de la tabla y lee de ellos; el chip aplicado de la barra y la tarjeta pulsada son dos vistas del mismo filtro. El anuncio lo hace la tabla (#265), el grupo no repite |
| `GMetric` | El valor | Se reutiliza dentro de cada tarjeta; su texto pasa a ser la descripción del botón |
| `GSummary`, `GWidget` | Ficha, panel con métrica | No filtran. Sin cambio |

## Entregables

- `index.html`: base (única y múltiple) + A + B + C + comparativa, todos sobre los mismos datos y una `GTable` real cada uno. `cardgroup.js` (prototipo del grupo con Vue global y `grana.umd.js`), `cardgroup.css` (geometría de los conceptos con tokens; no es el CSS de coco).
- `serve.mjs` + `verificar.mjs`: base y conceptos en Chromium, Firefox y WebKit, **solo puerto 4218**.
- `declaracion.md`: decisiones numeradas, conceptos, comparativa, recomendación, «Qué lo hace distinto», comprobaciones, hallazgos L1… para lima y la pregunta de producto.

## Ver

`index.html` (`?dir=rtl`, `?theme=dark`). Verificación: `node design/lab/card-group/r01/verificar.mjs` (`ENGINES=chromium`, `VERBOSE=1`; requiere `npm run build` por `dist/`).
