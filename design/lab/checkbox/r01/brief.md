# Brief funcional · GCheckbox · r01

**Agente:** kiwi (ejecutado por el squad siguiendo `.agents/skills/bruno/references/handoffs.md`)
**Ruta:** R1 · prototipo directo **Fidelidad:** F2 · wireframe mid-fi con kit neutral

## Enunciado

Un **desarrollador que usa Grana** necesita **ofrecer al usuario final una casilla para marcar o desmarcar una opción** (aceptar términos, elegir extras, filtrar, seleccionar filas) porque casi todo formulario y toda lista seleccionable la usa, y cada una debe llegar con etiqueta, estado, ayuda y error bien conectados para tecnologías de asistencia, sin que el desarrollador lo reconstruya.

## Pregunta de diseño

¿Qué anatomía, estados y comportamiento necesita `GCheckbox` para que marcar una opción sea claro, accesible y cómodo con teclado, lector de pantalla y pantalla táctil, **y qué estructuras propias** (más allá de la casilla clásica) resuelven mejor los patrones reales donde una casilla sola se queda corta?

## Verbo y resultado

- **Verbo principal:** marcar o desmarcar una opción.
- **Resultado verificable:** el valor (`modelValue`) refleja el estado marcado; el estado, el nombre y el error se anuncian al enfocar; la casilla completa (no solo el cuadro) es objetivo de toque.

## Anatomía de la casilla base

| Parte | Obligatoria | Nota |
| --- | --- | --- |
| Raíz | Sí | Envuelve todo; es el `<label>` clicable |
| `<input type="checkbox">` nativo | Sí | Lleva el foco, el estado y el teclado. Se dibuja sobre el propio input (sin ocultarlo) |
| Marca (✓ / −) | Sí | Visible según el estado: marcada, mixta (indeterminada) o ninguna |
| Etiqueta | Sí | Texto asociado; la fila completa activa la casilla |
| Ayuda | No | Enlazada con `aria-describedby` |
| Error | Solo con error | Región viva, igual que en `GInput` |

## Estados

`sin marcar`, `marcada`, `indeterminada`, `hover`, `focus-visible`, `disabled`, `readonly`, `invalid` (con error), `required`.

## Propuestas originales (estructura propia)

La casilla clásica no resuelve bien cuatro patrones frecuentes. Cada uno se prototipa como una **variante de estructura** de la misma casilla (misma semántica nativa `checkbox`):

| # | Propuesta | Problema que resuelve | Idea |
| --- | --- | --- | --- |
| A | **Casilla-tarjeta** (`card`) | Elegir entre opciones con detalle (plan, extra de envío, add-ons): una casilla de 20px es un objetivo pobre y no cabe descripción | Toda la tarjeta es el control: título, descripción, dato destacado (precio) y un espacio de icono; el cuadro va en la esquina. Seleccionada, la tarjeta cambia de estado |
| B | **Casilla maestra con conteo** (`GCheckboxGroup`) | "Seleccionar todo" en listas y tablas: el estado mixto y cuántas hay marcadas se pierden | Grupo con una casilla maestra cuyo estado se deriva de las hijas (todas / ninguna / mixta) y un conteo "3 de 5 seleccionadas" anunciado en una región viva |
| C | **Casilla con detalle** (`details`) | Formularios condicionales ("Necesito factura" → pedir RFC): el campo extra aparece de golpe y se separa de su casilla | Al marcar, aparece un bloque asociado justo debajo (progresive disclosure), enlazado con `aria-controls`; al desmarcar, se oculta |
| D | **Casilla-chip** (`chip`) | Filtros y etiquetas: una lista de casillas verticales ocupa mucho espacio | Casilla con forma de chip: el ✓ solo aparece al marcarla; se agrupan en fila que salta de línea |

## Riesgo por acción

Marcar es reversible. En aceptación de términos o consentimiento, la casilla **no** viene marcada por defecto: lo decide el consumidor.

## Continuidad

- **Valor:** booleano (`v-model`), o arreglo si se da `value` (como el `<input>` nativo). Lo decide lima.
- **Texto largo y 320px:** la etiqueta salta de línea; la casilla no se encoge.
- **Zoom 200%:** sin desborde horizontal.

## Alcance

| Must | Should | Could | Won't (v0.1) |
| --- | --- | --- | --- |
| Casilla base con etiqueta, estados y teclado | Ayuda y error | Marca personalizable | Interruptor (`GSwitch`, otro componente) |
| Estado indeterminado | `readonly` | | Árbol de casillas anidadas |
| Fila completa como objetivo (≥ 24px; ≥ 44px táctil) | Variante `card` | | Arrastrar para marcar varias |
| Grupo con maestra y conteo (`GCheckboxGroup`) | | | Detalle condicional en v0.1 |
| API compartida (`size`, `density`, `color`, `disabled`, `modelValue`) | Grupo con maestra y conteo | | |
| Foco visible | Variantes `card` y `chip` (aprobadas) | Detalle condicional (`details`, propuesta C) | |

## Hechos, supuestos e incógnitas

**Hechos**
- Un `<input type="checkbox">` nativo ya trae teclado (Espacio), foco, estado, formulario y accesibilidad. No se reimplementa con `div` y `role`.
- El estado **indeterminado** solo existe como propiedad del DOM (`input.indeterminate = true`), no como atributo HTML; el navegador lo expone a las tecnologías de asistencia como `mixed`.
- Al pulsar una casilla indeterminada, el navegador la pasa a **marcada** (o desmarcada, según la implementación) y `indeterminate` pasa a `false`.
- Una etiqueta `<label>` que envuelve el input hace que un clic en cualquier parte de la etiqueta active la casilla.
- Un `<input type="checkbox">` **no** admite `readonly` nativo.
- WCAG 2.5.8: objetivo ≥ 24×24px; con `pointer: coarse`, `tokens.md` §7 exige 44px.
- No se debe anidar contenido interactivo dentro de un `<label>` (una tarjeta con botones dentro rompería el control).

**Supuestos**
- El consumidor pone su propio icono en la tarjeta (Grana no trae iconos).
- La casilla maestra de un grupo solo refleja hijas del mismo grupo.

**Incógnitas (para lima)**
- ¿`variant` de la API compartida (`solid soft outline ghost link`) sirve para casillas? Propuesta: no; las cuatro estructuras necesitan un prop propio (`layout`: `default` `card` `chip`), y `details` no es una variante sino un slot.
- ¿`GCheckboxGroup` es un componente aparte o un slot del propio `GCheckbox`?
- ¿Cómo se implementa `readonly`? Propuesta: `aria-readonly="true"` y bloquear el cambio.
- ¿Valor booleano o arreglo (`value`)?
