# Brief — ficha de resumen (`GSummary`, nombre de trabajo), r02: la forma

> kiwi, 2026-10-04. Continúa `../r01/` (base funcional: semántica, prioridad, cesión intrínseca, lector, modos; no se reabre). Regla «conceptos antes que caja» (CLAUDE.md, «Personalidad e innovación»).

## Por qué hay r02

«Una tarjeta con campos» que se encoge es lo que hace cualquier framework. r01 la deja correcta; no la hace de Grana. Aquí se cuestiona la premisa con tres conceptos **divergentes**, sobre componentes reales de `dist/` (`GAvatar`, `GBadge`, `GSurface`, `GTable`, `GBtn`) y los **tokens del tema por defecto**, resolviendo los mismos casos: opción de combobox a 240, 360 y 520px (cuatro homónimas), valor dentro del campo (una línea, Δ0), vista previa de la paleta, tarjeta en una rejilla que se redimensiona en vivo, celda de `GTable` y móvil 320.

| | Concepto | Idea | Qué pregunta responde |
| --- | --- | --- | --- |
| A | **Prioridad líquida** | No hay tramos ni «versión compacta»: siempre un título y una corriente de datos que se bebe por el final, con el identificador anclado y el alto fijo. Antes de soltar un dato, calla los rótulos que se explican solos | ¿Qué cabe aquí, ahora, con este texto? |
| B | **Tira que se compara** | Los datos son casillas de ancho fijo sin rótulo (los rótulos encabezan la lista una vez): quedan en columna entre fichas vecinas. Entre homónimos, lo que distingue pesa y lo que comparten se apaga | ¿En qué se diferencia esta de la de al lado? |
| C | **Una forma, cuatro tamaños** | La misma ficha es píldora, fila, tarjeta y panel según su ancho, con continuidad de forma. Si un tramo calla datos, «+N» abre la cara siguiente en el sitio | ¿Qué versión de este objeto cabe aquí? |

A y C compiten en bloque (corriente continua frente a tramos); B decide otra cosa (la comparación entre vecinas) y **se puede sumar** a cualquiera como modo de las listas.

## Semillas y qué fue de ellas

- **Prioridad líquida** → A.
- **Tira de datos** → B, con dos cambios: las casillas se alinean por **ancho fijo** (sin `subgrid` ni envoltorio de grupo: funciona en opciones, celdas y tarjetas sueltas) y se añade el **contraste entre homónimos**, que es lo que la hace útil.
- **Morfología por tramos** → C.
- **Dos caras** → dentro de C, y **acotada**: solo fuera de un anfitrión interactivo. Dentro de una `option`, de un `button` o de la ficha `aria-hidden` del campo no puede haber un control; ahí la «segunda cara» ya existe y es del anfitrión (la vista previa de la paleta). Como concepto propio no aguanta: en el caso que originó la ronda (la opción) no puede actuar.
- **Ficha tipográfica** (sin rótulos visibles): **descartada como concepto**, repartida. Un valor sin rótulo solo se entiende si se explica solo («22 años», «Dra. Ruiz»); «03/02/2026» no. A calla solo los rótulos marcados como evidentes; B los quita todos pero pone la fila de rótulos una vez. Quitarlos siempre deja fechas y cifras ambiguas (WCAG 3.3.2 en espíritu: el rótulo es la instrucción).

## Ver

`index.html?c=A` · `?c=B` · `?c=C` (añadir `&dir=rtl`, `&w=240`). Arrastra «Ancho del contenedor» (160 a 720px) y, en el caso 4, «Ancho de la rejilla» o la esquina del marco. Verificación: `node design/lab/summary/r02/verificar.mjs` (`GRANA_PW_PORT=4211`; requiere `npm run build`).
