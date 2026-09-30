# Brief funcional · GSwitch · r01

**Agente:** kiwi (ejecutado por el squad siguiendo `.agents/skills/bruno/references/handoffs.md`)
**Ruta:** R1 · prototipo directo **Fidelidad:** F2 · wireframe mid-fi con kit neutral

## Enunciado

Un **desarrollador que usa Grana** necesita **ofrecer al usuario final un interruptor para activar o desactivar una opción con efecto inmediato** (notificaciones, modo de una función, visibilidad) porque casi toda pantalla de configuración lo usa, y cada interruptor debe llegar con etiqueta, estado, ayuda y error bien conectados para tecnologías de asistencia, sin que el desarrollador lo reconstruya.

## Pregunta de diseño

¿Qué anatomía, estados y comportamiento necesita `GSwitch` para que activar o desactivar sea claro (el estado se lee sin depender del color ni de adivinar la posición), accesible y cómodo con teclado, lector de pantalla y pantalla táctil, y qué hace cuando el cambio tarda (guardado asíncrono)?

## Verbo y resultado

- **Verbo principal:** activar o desactivar una opción.
- **Resultado verificable:** el valor (`modelValue`) refleja el estado; el rol `switch`, el estado y el nombre se anuncian al enfocar; la fila completa (no solo el riel) es objetivo de toque.

## Diferencia con la casilla

| | Interruptor | Casilla (`GCheckbox`) |
| --- | --- | --- |
| Efecto | Inmediato | Al enviar |
| Semántica | `<input type="checkbox" role="switch">` | `<input type="checkbox">` |
| Estado mixto | No | Sí |
| Valor | Booleano | Booleano o arreglo |

## Anatomía

| Parte | Obligatoria | Nota |
| --- | --- | --- |
| Raíz | Sí | Envuelve la fila y el error |
| `<input type="checkbox" role="switch">` nativo | Sí | Lleva el foco, el estado y el teclado. Se dibuja como riel sobre el propio input (sin ocultarlo) |
| Riel (track) | Sí | Contorno de 3:1 en apagado; relleno de color en encendido |
| Pulgar (thumb) | Sí | Se desplaza al otro extremo. Lleva una marca dibujada (✓ encendido, − apagado) para que el estado no dependa solo del color ni de la posición |
| Slots de iconos on/off | No | Sustituyen la marca dentro del pulgar |
| Etiqueta | Sí | Al final (por defecto) o al inicio de la fila |
| Ayuda | No | Enlazada con `aria-describedby` |
| Error | Solo con error | Región viva, igual que `GInput` y `GCheckbox` |
| Indicador de carga | Solo con `loading` | Anillo giratorio dentro del pulgar; `aria-busy` |

## Estados

`apagado`, `encendido`, `hover`, `focus-visible`, `disabled` (apagado y encendido), `readonly` (apagado y encendido), `invalid` (con error), `loading` (apagado y encendido), con ayuda.

## Comportamiento

- **Espacio** alterna (nativo); **Enter no** (nativo del checkbox).
- **Clic** en el riel o en el texto alterna: la fila completa es el `<label>`.
- **`loading`:** muestra el anillo, pone `aria-busy` y **no bloquea**: el cambio se emite igual (guardado asíncrono) y el consumidor decide si lo revierte.
- **`readonly`:** el input nativo no admite `readonly`: `aria-readonly` y se cancela el cambio; sigue enfocable.
- **Etiqueta al inicio o al final (`labelPosition`):** en RTL se espeja con propiedades lógicas, y el pulgar también.

## Riesgo por acción

Reversible e inmediata. Una opción con consecuencias (borrar datos, exponer información) no debe ser un interruptor sino una confirmación: lo decide el consumidor. El interruptor **no** pregunta.

## Continuidad

- **Valor:** booleano (`v-model`).
- **Texto largo y 240px:** la etiqueta salta de línea; el riel no se encoge.
- **Zoom 200%:** sin desborde horizontal.
- **Movimiento:** el pulgar se desliza; sin animación con movimiento reducido.

## Alcance

| Must | Should | Could | Won't (v0.1) |
| --- | --- | --- | --- |
| Riel y pulgar con marca, etiqueta, estados y teclado | Ayuda y error, `readonly` | Slots de iconos on/off | Variante tarjeta (fila de configuración) |
| Etiqueta al inicio o al final | `loading` sin bloqueo | | Grupo de interruptores |
| Tamaños, densidad, color | | | Valores no booleanos (`true-value` / `false-value`) |
