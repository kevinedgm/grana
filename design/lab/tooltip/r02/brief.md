# Brief — tooltip (`GTooltip`, nombre de trabajo), r02: tres conceptos de forma y comportamiento

> kiwi, 2026-10-05. Sigue a `../r01/` (base funcional). Regla del usuario (CLAUDE.md «Personalidad e innovación», «conceptos antes que caja»): en un componente con forma visible no basta con la caja convencional; se entregan conceptos divergentes con los tokens reales del tema por defecto, una comparativa y una pregunta de elección.

## La premisa que se cuestiona

«Un globo oscuro con flecha que aparece encima del control tras 500 ms» lleva cuatro supuestos que nadie revisa:

1. **El tooltip es un objeto aparte** que flota cerca del control (y una flecha centrada dice a cuál apunta, a veces mal en una barra densa).
2. **Cada control tiene el suyo**, que se enciende y se apaga: recorrer una barra de ocho iconos son ocho globos que aparecen y desaparecen en ocho sitios.
3. **El texto aparece donde está el control**, así que la vista salta con él.
4. **Todo el texto llega de golpe**: el nombre y la explicación larga cuestan lo mismo de leer, se necesite o no la explicación.

Cada concepto rompe uno o dos:

| Concepto | Rompe | Idea |
| --- | --- | --- |
| **A · Pestaña que viaja** | 1 y 2 | El nombre cuelga del control por una pestaña que mide lo que mide el control; en un grupo hay una sola etiqueta que **viaja** |
| **B · La barra habla** | 2 y 3 | El grupo tiene **una leyenda fija** pegada a su borde; el texto nunca cambia de sitio y una marca señala el control |
| **C · Pista en dos tiempos** | 4 | Primero solo el nombre; si te detienes, **crece** con la descripción y el atajo; en táctil, visible el tiempo que pide su texto |

Más una **referencia** (`?c=0`): el globo convencional con los mismos tokens, solo para comparar.

## Lo común (no se repite por concepto)

Toda la base de r01: nodo `role="tooltip"` persistente por control con las referencias al texto, `kind` automático, `aria-keyshortcuts`, retrasos 350/100/600 ms, uno solo abierto, Esc por capas, puente del puntero, foco por navegación, pulsación larga, `anchor.js`, reglas 1 y 3 de #358. Las superficies compartidas de A y B son **visuales** (`aria-hidden`): la semántica sigue en el nodo de cada control.

## Casos (los mismos en los cuatro)

1. **Barra de edición** de una nota clínica: ocho iconos, cuatro con atajo y cuatro con descripción.
2. **Riel vertical** de secciones (cinco iconos).
3. **Acciones por fila** de una tabla (tres por fila, `xs`).
4. **Controles sueltos** con descripción: «Publicar» y un candado («Bloqueado» · «Lo está editando Luis Mena»).

## Ver

`node design/lab/tooltip/serve.mjs --keep` y abrir `http://127.0.0.1:4212/design/lab/tooltip/r02/?c=A` (`?c=0`, `?c=B`, `?c=B&reserved=1`, `?c=C`; `&dir=rtl`). Verificación: `node design/lab/tooltip/verificar.mjs` (la misma batería en los cuatro, más lo propio de cada uno; tres motores).
