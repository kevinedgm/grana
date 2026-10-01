# Brief funcional · GTable y GPagination · r01

**Agente:** kiwi (ejecutado por el squad siguiendo `.agents/skills/bruno/references/handoffs.md`)
**Ruta:** R1 · prototipo directo **Fidelidad:** F2 · wireframe mid-fi con kit neutral

## Decisiones del usuario (alcance)

- **Columnas compuestas:** una columna visible puede componer varios campos de datos, p. ej. «título + subtítulo» (los campos 2 y 3 fusionados en una columna).
- **Personalidad:** celdas ricas (avatar o icono al inicio, insignias de estado, números, barras), filas como superficie (hover suave, separadores finos o filas tipo tarjeta, cabecera pegajosa) y densidad elegible.
- **Móvil:** cada fila se convierte en **tarjeta**: la columna compuesta es su encabezado y el resto de columnas son líneas «etiqueta: valor».
- **r01 incluye:** ordenar por columna, selección de filas, paginación (`GPagination`, componente aparte) y acciones por fila (`GMenu`).

## Enunciado

Un **desarrollador que usa Grana** necesita **mostrar una colección de registros** (clientes, pedidos, usuarios, tareas) para que el usuario los **recorra, compare, ordene, seleccione y actúe** sobre ellos, en escritorio como tabla y en móvil como lista de tarjetas legibles, sin escribir dos interfaces.

## Pregunta de diseño

¿Qué anatomía, modelo de columnas (campo ≠ columna visible) y comportamiento necesita `GTable` para que una sola definición de columnas produzca una tabla con personalidad en escritorio y tarjetas en móvil, conservando la semántica de tabla, el orden, la selección y las acciones?

## Verbo y resultado

- **Verbo principal:** encontrar y actuar sobre registros.
- **Resultado verificable:** un lector de pantalla oye cada celda con su encabezado, en tabla y en tarjetas; el orden se anuncia (`aria-sort`); la selección se anuncia (incluida la mezcla en «seleccionar todo»); nada desborda en horizontal a 320px.

## Anatomía

| Parte | Obligatoria | Nota |
| --- | --- | --- |
| Tabla (`<table>`) con nombre (`caption` o `aria-label`) | Sí | Semántica nativa de tabla de datos (no `grid`) |
| Barra superior | No | «Seleccionar todo» y «Ordenar por» en tarjetas; recuento de seleccionados |
| Encabezado (`<thead>`), pegajoso | Sí | Botón de orden en las columnas ordenables |
| Columna de selección | No | Casilla por fila; «todo» con estado mixto |
| Columna compuesta | No | `leading` (avatar/icono) + título + subtítulo |
| Celdas | Sí | Texto, número (alineado al final), o contenido rico por slot |
| Columna de acciones | No | Botón de menú por fila |
| Estados de la colección | Sí | Cargando, vacío |
| `GPagination` | No | Componente aparte, debajo |

## Continuidad

- **Teclado:** Tab recorre controles (orden, casillas, menús, paginación); sin navegación de celdas con flechas (no es `grid`).
- **Adaptación** por el ancho **del contenedor** (como `GStepper`), no de la ventana.
- **Zoom 200% / 320px:** sin desborde horizontal en tarjetas.
