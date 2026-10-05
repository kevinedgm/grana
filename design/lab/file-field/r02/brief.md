# Brief — campo de archivos (`GFileField`, nombre de trabajo), r02: la forma

> kiwi, 2026-10-05. Continúa `../r01/` (base funcional: control real, tres vías, validación, modelo, adaptador, anuncios, envío; no se reabre). Regla «conceptos antes que caja» (CLAUDE.md, «Personalidad e innovación»).

## Por qué hay r02

Todos los frameworks dibujan lo mismo: un **rectángulo con borde discontinuo**, una nube con una flecha, «Arrastra tus archivos aquí o haz clic», y una lista debajo. r01 lo deja correcto; no lo hace de Grana. La premisa tiene tres problemas que el usuario final sí nota:

1. **Ocupa sitio para un gesto que la mayoría no usa.** En móvil no se arrastra; con teclado, tampoco. La zona mide 70 a 160px en cada campo de archivos del formulario, siempre, para el caso de escritorio.
2. **Habla del gesto, no del contenido.** «Arrastra aquí» no dice qué falta ni qué está bien; las fotos se ven igual que los PDF.
3. **Trata todos los documentos como una bolsa.** «Sube INE por ambos lados y comprobante» se escribe como ayuda y se valida a mano: el campo no sabe si falta el reverso.

Tres conceptos **divergentes**, sobre componentes reales de `dist/` (`GSummary`, `GProgress`, `GBtn`, `GIcon`, `GInput`, `GFormRow`, `GForm`, `GErrorSummary`) y con los **tokens del tema por defecto**, resolviendo los mismos casos: un archivo junto a otro campo, fotos de una lesión (varias, con vista previa, subida inmediata, una que falla) y documentos de identidad (varios documentos distintos).

| | Concepto | Idea | Qué pregunta responde |
| --- | --- | --- | --- |
| A | **Línea de adjuntos** | El campo es un campo: mide lo que un `GInput` y comparte fila. Los archivos son fichas dentro de la caja, y la ficha **es** la barra de progreso. No hay zona de soltar: al arrastrar archivos sobre la página, **cada campo que los admite enciende su destino** y los que no, lo dicen | ¿Dónde va esto? |
| B | **Mesa de luz** | Los archivos son objetos sobre una mesa: piezas con su miniatura (o su tipo, en grande). «Añadir» es **una pieza más**, donde aparecerá lo nuevo. Subir es **revelar**: el velo se retira de abajo arriba | ¿Es esta la foto correcta? |
| C | **Lo que falta** | El campo sabe qué espera: **una casilla con nombre por documento**, con su marca, su `<input>` y su error; arriba «2 de 3 · Pendiente: …». Soltar varios en el grupo **los reparte** (el nombre del archivo ayuda) | ¿Qué me falta? |

A y B compiten como forma de una lista de archivos (densa frente a visual). C decide otra cosa (la **estructura** de lo que se pide) y **se puede sumar** a cualquiera como modo.

## Semillas y qué fue de ellas

- **Zona que solo aparece al arrastrar** → A, y ampliada a la página entera: si el destino solo aparece al arrastrar, tiene que aparecer **en todos los campos a la vez** y decir cuáles admiten lo que llevas.
- **La ficha como barra de progreso** → A (relleno de la ficha) y B (velo que se retira). La barra separada se queda en la base y en C, donde la fila es ancha.
- **Pila de archivos que se abre en abanico al pasar el puntero** (descartada): bonita, pero esconde los nombres en reposo, la animación es el único modo de ver el contenido y el abanico mueve piezas bajo el puntero (riesgo vestibular y de clic equivocado).
- **Zona circular / «agujero» que absorbe el archivo** (descartada): forma por la forma; el gesto ya lo resuelve A con más área útil.
- **Checklist que asigna sola cada archivo** → C, **acotada**: el reparto solo ocurre cuando se suelta **en el grupo** (no en una casilla), se anuncia archivo por archivo y cada casilla se puede cambiar. Soltar en una casilla concreta va a esa casilla.

## Ver

`index.html?c=A` · `?c=B` · `?c=C` (añadir `&dir=rtl`). Los botones «+ …» añaden archivos de prueba; con un ratón, arrastra archivos reales desde el escritorio por la página. Verificación: `node design/lab/file-field/verificar.mjs` (`CONCEPTS=A,B,C`; `GRANA_PW_PORT=4212`; requiere `npm run build`).
