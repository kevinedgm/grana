# Brief funcional · GSelect · r01

**Agente:** kiwi (ejecutado por el squad siguiendo `.agents/skills/bruno/references/handoffs.md`)
**Ruta:** R1 · prototipo directo **Fidelidad:** F2 · wireframe mid-fi con kit neutral

## Enunciado

Un **desarrollador que usa Grana** necesita **ofrecer al usuario final una lista cerrada de opciones de la que elegir una** (país, estado, categoría, prioridad) porque casi todo formulario la usa, y cada selector debe llegar con etiqueta, ayuda, error, teclado completo y una lista que se vea igual en todos los sistemas, sin que el desarrollador reconstruya el patrón de accesibilidad.

## Pregunta de diseño

¿Qué anatomía, estados y comportamiento necesita `GSelect` (lista propia, selección única) para que elegir sea claro y accesible con teclado, lector de pantalla y pantalla táctil, con el mismo lenguaje que `GInput`, y **qué hace la lista** cuando no cabe debajo, cuando hay grupos u opciones deshabilitadas, o cuando el visor es de móvil?

## Verbo y resultado

- **Verbo principal:** elegir una opción de una lista.
- **Resultado verificable:** el valor (`modelValue`) refleja la opción elegida; el nombre, el valor mostrado, el estado abierto y la opción activa se anuncian; la lista se cierra al elegir y el foco queda en el selector.

## Patrón

**Combobox de solo selección** (WAI-ARIA APG, *select-only combobox*): un botón con `role="combobox"`, `aria-haspopup="listbox"`, `aria-expanded` y `aria-controls`, y una lista `role="listbox"` con opciones `role="option"`. El **foco no sale del selector**: la opción activa se indica con `aria-activedescendant`.

## Anatomía

| Parte | Obligatoria | Nota |
| --- | --- | --- |
| Raíz | Sí | Envuelve etiqueta, caja, mensajes y error |
| Etiqueta | Sí | `<label>` asociada al selector (`for` y `aria-labelledby`); nunca se sustituye por el texto del valor |
| Selector (caja) | Sí | `<button role="combobox">` con el valor mostrado o el `placeholder` y una flecha decorativa |
| Botón de limpiar | No | Solo con `clearable` y valor; botón aparte con nombre |
| Indicador de carga | Solo con `loading` | Anillo; `aria-busy`; no bloquea |
| Lista | Al abrir | `role="listbox"` en la capa superior (`popover`), anclada al selector |
| Opción | Sí | `role="option"`, `aria-selected`; marca ✓ en la elegida; activa resaltada; `aria-disabled` en las no elegibles |
| Grupo | No | `role="group"` con nombre (`aria-labelledby` del encabezado) |
| Ayuda | No | Enlazada con `aria-describedby` |
| Error | Solo con error | Región viva, igual que `GInput` |
| Entrada nativa para formularios | Sí | `<input type="hidden">` con `name` y el valor, para que se envíe en un `<form>` |

## Estados

`cerrado`, `abierto`, `hover`, `focus-visible`, `disabled`, `readonly` (enfocable, no abre), `invalid` (con error), `loading`, `con valor`, `con placeholder`. De la opción: `normal`, `activa`, `elegida`, `deshabilitada`. De la lista: `hacia abajo`, `hacia arriba` (no cabe abajo), `con scroll`, `vacía`, `hoja inferior` (móvil).

## Comportamiento

- **Abrir:** clic, Enter, Espacio, ↓, ↑ o Alt+↓. Al abrir, la opción activa es la elegida (o la primera habilitada).
- **Con la lista abierta:** ↓ ↑ mueven la activa (saltan opciones deshabilitadas); Inicio y Fin van a la primera y la última; Re Pág y Av Pág saltan 10; Enter elige y cierra; **Esc cierra sin cambiar** y el foco sigue en el selector; Tab elige la activa, cierra y sigue el orden del documento.
- **Escribir (typeahead):** un carácter imprimible abre la lista (si estaba cerrada) y mueve la activa a la siguiente opción cuyo texto empieza así; varias letras seguidas (menos de ~500ms) forman el prefijo.
- **Clic fuera** cierra sin cambiar. **Clic o toque en una opción** la elige y cierra; una opción deshabilitada no se elige y no cierra.
- **Posición:** debajo del selector con su mismo ancho mínimo; si no cabe debajo y hay más sitio arriba, se abre hacia arriba. Alto máximo con scroll interno (unas 8 opciones); la opción activa siempre se ve.
- **Móvil (≤ ~520px):** la lista es una **hoja inferior** con fondo, con la misma lista y el mismo teclado; opciones de 44px.
- **`readonly`:** `aria-readonly`; enfocable; no abre. **`disabled`:** nativo del botón.
- **`loading`:** `aria-busy` y anillo; no bloquea.
- **Sin coincidencias / sin opciones:** la lista muestra un mensaje vacío (texto del consumidor).

## Riesgo por acción

Elegir es reversible. No hay valor por defecto en consentimiento o decisiones críticas: sin `modelValue`, se muestra el `placeholder`.

## Continuidad

- **Valor:** el `value` de la opción elegida (String o Number); `null` o sin coincidencia muestra el `placeholder`.
- **320px y zoom 200%:** sin desborde; el valor mostrado se recorta con elipsis; la lista usa el ancho del visor en móvil.
- **Objetivos táctiles:** selector y opciones ≥ 44px con `pointer: coarse`.
- **Movimiento:** la lista aparece sin animar o con un fundido breve; sin movimiento con `prefers-reduced-motion`.

## Alcance

| Must | Should | Could | Won't (v0.1) |
| --- | --- | --- | --- |
| Selector, lista, teclado completo, typeahead, estados | Grupos, opciones deshabilitadas, `clearable`, hoja inferior en móvil | Slot para renderizar opciones | Selección múltiple |
| Etiqueta, ayuda, error, `required`, `placeholder` | `readonly`, `loading` | | Búsqueda y filtrado (combobox editable) |
| Variantes `outline` y `soft`, tamaños, densidad | Lista hacia arriba | | Opciones creadas por el usuario, carga perezosa, virtualización |
