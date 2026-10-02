# Brief r02 — Distribución de formularios: rechazo de la Fase 1 y dirección nueva

> Comentario del usuario tras ver la Fase 1 en el playground (1 oct 2026), recogido con sus palabras y ordenado. Complementa el brief de r01, que sigue vigente salvo donde este lo contradice.

## Qué detesta (y aparece en la Fase 1)

- **Huecos enormes**: filas que terminan a mitad del ancho; bordes derechos dentados («Nombre | Apellido» acaba a la mitad, «Fecha | Edad | Sexo», «Signos vitales» y «RFC | Razón social» terminan cada uno en un sitio distinto).
- **Falta de alineación vertical y horizontal**: las cajas de una misma fila no están a la misma altura.
- **Etiquetas que empujan campos hacia abajo** y distorsionan el diseño (p. ej. Teléfono con leyenda de grupo y además etiquetas por parte —País, Número, Extensión— baja sus cajas respecto a Correo).
- **Sin flujo lógico**: no se lee como un recorrido ordenado.

## Qué pide

- **Un sistema de layout adaptativo**, tipo flex o similar, capaz de adaptarse al espacio y al tamaño disponibles.
- **Poder definir qué campos van juntos** (agrupar por filas o bloques de forma explícita).
- **Fusionar campos**: un componente que haga «dos en uno». Ejemplo: código de país + número de teléfono como **un solo campo** visual (el prefijo dentro de la misma caja).
- Que se vea alineado, con ritmo, ordenado; nada de la distribución actual.

## Notas para kiwi

- El principio de r01 «la longitud visual anticipa la del contenido» no puede producir filas dentadas ni huecos: la jerarquía de anchos debe resolverse **dentro de filas que llenan el ancho** (o con un criterio igual de ordenado), no con anchos máximos que dejan aire a la derecha.
- La etiqueta de una fila no debe cambiar la posición vertical de las cajas: todas las cajas de una fila comparten línea.
