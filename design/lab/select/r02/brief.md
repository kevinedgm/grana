# Brief funcional · GSelect · r02 (prefijo, iconos y «Agregar nuevo…»)

**Agente:** kiwi (ejecutado por el squad siguiendo `.agents/skills/bruno/references/handoffs.md`)
**Ruta:** R1 · prototipo directo **Fidelidad:** F2 · wireframe mid-fi con kit neutral
**Extiende:** `design/lab/select/r01/` (selector aprobado y auditado)

## Enunciado

Un **desarrollador que usa Grana** necesita, en un selector cuyo catálogo es cerrado pero **incompleto** (clientes, categorías, etiquetas), **(1)** reforzar el reconocimiento visual con **iconos** (un prefijo en el selector y un icono en cada opción) y **(2)** ofrecer al usuario **agregar una opción que no está en el catálogo**, sin salir del campo, porque hoy el usuario que no encuentra su opción se queda sin salida.

Decisiones del usuario (mensaje durante la auditoría de r01): faltan **prefijo e iconos** y **agregar nuevo si no está en el catálogo**. Alcance elegido: **fila «Agregar nuevo…» al final de la lista** (sin búsqueda ni escritura en el selector) y **prefijo en el selector + icono en cada opción** (sin sufijo).

## Pregunta de diseño

¿Cómo se agrega una fila de acción a una lista de solo selección sin romper el patrón *select-only combobox* (foco fijo, `aria-activedescendant`, Esc, Tab), sin confundirla con una opción elegible ni con una elección, y cómo se muestran iconos decorativos en el selector y en la lista sin alterar el nombre accesible ni el ancho mínimo táctil?

## Verbo y resultado

- **Verbos:** reconocer una opción por su icono; pedir una opción nueva.
- **Resultado verificable:** activar la fila «Agregar nuevo…» (ratón, Enter o Espacio) **cierra la lista, no cambia el valor y emite `create`**; el foco vuelve al selector; el valor solo cambia cuando la aplicación agrega la opción y actualiza `modelValue`. Los iconos son decorativos: el nombre accesible sigue siendo etiqueta + texto del valor.

## Anatomía nueva

| Parte | Obligatoria | Nota |
| --- | --- | --- |
| Prefijo (`g-select__prepend`) | No | Icono decorativo dentro del botón, antes del valor; `aria-hidden`. Como `prepend` de `GInput` |
| Icono de opción (`g-select__icon`) | No | Icono decorativo antes del texto de cada opción, y también junto al valor mostrado; `aria-hidden` |
| Fila «Agregar nuevo…» (`g-select__create`) | No (con `createLabel`) | Al final de la lista, fuera de los grupos, separada por una línea fina; lleva un «+» dibujado y el texto de la aplicación |

Los iconos los pone la aplicación (Grana no trae iconos): un slot `prepend` y un slot `icon` con la opción como alcance.

## Comportamiento de la fila «Agregar nuevo…»

- Es la **última fila navegable**: ↓ llega a ella desde la última opción; Fin va a ella; Re Pág la alcanza. Se resalta como cualquier opción activa.
- **Enter o Espacio** (con la fila activa) y **clic**: cierra la lista, **no cambia el valor**, devuelve el foco al selector y emite `create`.
- **Tab** con la fila activa: cierra **sin crear** (una acción no se dispara por pasar de largo) y sigue el orden.
- **Esc** cierra sin hacer nada.
- **No participa en la escritura rápida** (*typeahead*): buscar por letras no la selecciona.
- Con lista vacía sigue visible (mensaje vacío y fila debajo). Con `readonly` o `disabled` no hay lista, luego no hay fila.
- **Rol:** `role="option"` (hijo directo del `listbox`) con `aria-selected="false"`, para que el APG y los lectores la traten como una fila más de la lista; la diferencia es visual (línea superior, «+», peso) y de comportamiento (no se elige).
- **Móvil:** la misma fila en la hoja inferior, de 44px.

## Estados nuevos

`con prefijo`, `con iconos en las opciones`, `valor con icono`, `fila crear` en reposo, `activa` y en hoja inferior; `lista vacía + crear`.

## Riesgo por acción

Agregar no altera el valor ni los datos: solo emite intención. Si la aplicación cancela su diálogo, no pasa nada (el valor sigue igual). Un lector de pantalla anuncia la fila como una opción más («Agregar nuevo…, opción 7 de 7»): el texto de `createLabel` debe ser explícito («Agregar nuevo país…»).

## Continuidad

- **Objetivos táctiles:** la fila y las opciones con icono mantienen 44px con `pointer: coarse`.
- **Nombre accesible del selector:** sigue siendo etiqueta + texto del valor; los iconos no se anuncian.
- **320px y texto largo:** el icono no se encoge; el texto salta o se recorta con elipsis como antes.

## Alcance

| Must | Should | Could | Won't (r02) |
| --- | --- | --- | --- |
| Fila «Agregar nuevo…» con `create` | Prefijo del selector | | Escribir para buscar o crear (combobox editable) |
| Icono en cada opción y en el valor | | | Sufijo antes de la flecha |
| | | | Campo de texto propio para el nombre nuevo (lo resuelve la aplicación) |
