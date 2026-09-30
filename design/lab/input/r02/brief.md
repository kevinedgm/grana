# Brief funcional · GInput con botón de acción · r02

**Agente:** kiwi (ejecutado por el squad siguiendo `.agents/skills/bruno/references/handoffs.md`)
**Ruta:** R1 · prototipo directo **Fidelidad:** F2 · wireframe mid-fi con kit neutral
**Extiende:** `design/lab/input/r01/` (campo completo aprobado) y `design/lab/btn/r01/` (botón aprobado)

## Enunciado

Un **desarrollador que usa Grana** necesita **ofrecer al usuario final un campo de texto con un botón pegado que ejecute una acción sobre lo escrito** (buscar, suscribirse, aplicar un cupón, invitar por correo) porque es un patrón muy frecuente donde valor y acción forman una sola unidad, y no debe reconstruirlo componiendo a mano un campo y un botón con alturas, bordes y foco que no encajan.

## Pregunta de diseño

¿Cómo se acopla un botón a `GInput` para que se lea como una sola unidad, con la misma altura, sin perder el nombre accesible de cada parte ni el foco visible, y comportándose bien con Enter, con carga y en anchos estrechos?

## Verbo y resultado

- **Verbo principal:** escribir un valor y ejecutar una acción sobre él.
- **Resultado verificable:** activar el botón (con puntero, Enter o Espacio) o pulsar Enter en el campo dentro de un formulario ejecuta la acción **una sola vez**, con el valor actual del campo; con el botón en `loading` no se ejecuta de nuevo.

## Anatomía

| Parte | Obligatoria | Nota |
| --- | --- | --- |
| Etiqueta | Sí | Una sola etiqueta para el conjunto, asociada al `<input>` |
| Caja del campo | Sí | Igual que en r01 (icono inicial, `<input>`, zona final) |
| Acción | Sí (en esta variante) | Un `GBtn` real del consumidor, pegado al final de la caja |
| Ayuda y error | No | Debajo del conjunto, igual que en r01; el error describe el **campo**, no la acción |
| Contador | No | Igual que en r01 |

## Decisiones de estructura propuestas (kiwi)

| # | Decisión |
| --- | --- |
| 1 | **Acoplado:** el botón queda pegado a la caja, con la **misma altura**, esquinas exteriores redondeadas y esquinas interiores rectas. Se lee como un solo control. |
| 2 | El botón es un `GBtn` del consumidor (no un botón propio): conserva sus variantes, `loading` y accesibilidad. El campo solo le reserva el sitio. |
| 3 | La altura coincide porque `GBtn` y `GInput` usan la misma tabla de tamaños y densidad. El campo entrega `size`, `density` y `disabled` al botón para que no puedan diferir. |
| 4 | El botón se activa con Enter y Espacio (nativo). Con **Enter en el campo**, el navegador solo envía el formulario si hay un `<form>` con un botón `type="submit"`; fuera de un formulario no ocurre nada, y el consumidor decide qué hacer. Sin manejadores de teclado propios. |
| 5 | El foco del campo rodea la caja; el foco del botón lo rodea a él. Nunca se solapan: el elemento enfocado pasa por encima del vecino. |
| 6 | **Anchos estrechos:** por debajo de ~300px de ancho del contenedor, un botón **con texto** pasa debajo del campo, a ancho completo y separado (esquinas completas). Sin apilar, el campo quedaba en 51px con "Suscribirse" en un contenedor de 220px: inutilizable. El botón **solo icono** no se apila: es cuadrado y cabe. La variante separada permanente queda fuera de v0.1; quien la necesite compone un botón aparte. |
| 7 | Si el botón es solo icono (buscar), lleva nombre accesible (`aria-label`, ya obligatorio en `GBtn icon`). |

## Alcance

| Must | Should | Could | Won't (v0.1) |
| --- | --- | --- | --- |
| Botón acoplado, misma altura | Botón solo icono | Botón a la izquierda (prefijo) | Variante separada permanente |
| Nombre accesible del campo y del botón | `loading` de la acción | | Apilado permanente del botón |
| Enter en formulario | Estados `disabled` y error | | Varias acciones |
| Foco visible en ambos | Apilado del botón con texto en anchos estrechos | | Acción con menú desplegable |
| Área táctil ≥ 44px con `pointer: coarse` | | | |

## Hechos, supuestos e incógnitas

**Hechos**
- Un `<button>` dentro de un `<form>` es `type="submit"` por defecto; `GBtn` usa `type="button"` salvo indicación. Para que Enter en el campo envíe el formulario, la acción debe ser `type="submit"`.
- El envío implícito de un formulario **hace clic** en el botón de envío por defecto; con `GBtn` en `loading` (`aria-disabled`, no `disabled` nativo) el clic llega, y `GBtn` lo cancela: el formulario no se envía dos veces.
- WCAG 2.5.8 admite objetivos de 24×24px; con `pointer: coarse` el contrato de tokens exige 44px.
- `GBtn` con `icon` exige `aria-label` (contrato de `GBtn`).

**Supuestos**
- La acción es un solo botón. Varias acciones se resuelven fuera del campo.
- El consumidor decide si el campo se vuelve `readonly` mientras la acción está pendiente.

**Incógnitas (para lima)**
- ¿Cómo se entrega el botón? Propuesta: **slot con alcance `action`** en `GInput`, con `size`, `density` y `disabled` como propiedades del slot. Alternativa: un componente aparte (`GInputGroup`). Es una decisión de API nueva: la debe aprobar el usuario.
- ¿Quién aplana las esquinas interiores del botón? Propuesta: el CSS de `GInput` actúa sobre el botón del slot.
- ¿`disabled` del campo se propaga al botón? Propuesta: sí, vía las propiedades del slot; el consumidor puede sobrescribirlo.
