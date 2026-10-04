# Brief — `GCombobox`, r02: la forma

> kiwi, 2026-10-04. Continúa `../r01/` (base funcional: semántica, teclado, estados, anuncios; no se reabre). Regla «conceptos antes que caja» (CLAUDE.md, «Personalidad e innovación»).

## Por qué hay r02

Un campo con una lista debajo es lo que hace cualquier framework. r01 lo deja correcto; no lo hace de Grana. Aquí se cuestiona la premisa de la forma con tres conceptos **divergentes**, sobre los componentes reales de `dist/` (`GInput`, `GAvatar`, `GDialog`, `GFormRow`) y los **tokens del tema por defecto**, resolviendo los mismos casos: paciente entre miles con resultados del servidor, diagnóstico con código y descripción, medicamento con texto libre, cliente con «Agregar», formulario, diálogo y móvil.

| | Concepto | Idea | Momento en que actúa |
| --- | --- | --- | --- |
| A | **El campo se abre** | No hay panel flotante: la caja del campo crece y la lista es su interior (un contorno, un anillo, una sombra). La primera coincidencia se completa en el propio campo | Al escribir |
| B | **Paleta con vista previa** | El campo se eleva a una superficie con su propio campo, los resultados y la ficha de la opción activa: se elige viendo a quién se elige | Al escribir |
| C | **El valor es un objeto** | Elegido, el campo no enseña texto plano sino a quién o qué: avatar, nombre, expediente y edad; código y descripción; marca de texto libre. Los resultados son fichas y la elegida viaja al campo | En reposo y al elegir |

A y B compiten (las dos deciden cómo se abre). C decide otro momento y **se puede sumar** a cualquiera: `?c=AC` enseña la mezcla que se recomienda.

## Semillas descartadas

- **Fichas navegables en rejilla (2D).** Un `listbox` con flechas en dos ejes no es un patrón que el lector anuncie; habría que pasar a `grid` (APG *combobox with grid popup*), y ↑ ↓ dejarían de significar «siguiente resultado». Las fichas se quedan (C), en una columna.
- **Texto fantasma como concepto propio.** Solo, es un adorno de la caja convencional. Vive dentro de A, donde tiene sentido: el campo es la superficie y se completa a sí mismo.
- **Tab acepta siempre.** Con homónimos elegiría al paciente equivocado. Queda acotado: solo cuando la etiqueta completada es única entre los resultados a la vista.

## Ver

`index.html?c=A` · `?c=B` · `?c=C` · `?c=AC` (añadir `&dir=rtl`). Verificación: `node design/lab/combobox/r02/verificar.mjs` (`GRANA_PW_PORT=4209`; requiere `npm run build`).
