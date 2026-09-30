# Brief funcional · GTextarea · r01

**Agente:** kiwi (ejecutado por el squad siguiendo `.agents/skills/bruno/references/handoffs.md`)
**Ruta:** R1 · prototipo directo **Fidelidad:** F2 · wireframe mid-fi con kit neutral

## Enunciado

Un **desarrollador que usa Grana** necesita **ofrecer al usuario final un campo para escribir texto de varias líneas** (comentario, descripción, notas, mensaje) porque casi todo formulario lo usa, y cada campo debe llegar con etiqueta, ayuda, error, contador y estados bien conectados para tecnologías de asistencia, con el mismo lenguaje que `GInput`, sin que el desarrollador lo reconstruya.

## Pregunta de diseño

¿Qué anatomía, estados y comportamiento necesita `GTextarea` para que escribir texto largo sea claro, accesible y cómodo con teclado, lector de pantalla y pantalla táctil, **cómo crece o se desplaza** cuando el texto no cabe, y cómo se comunica un límite de caracteres sin depender de la vista?

## Verbo y resultado

- **Verbo principal:** escribir texto de varias líneas.
- **Resultado verificable:** el valor (`modelValue`) refleja el texto; el nombre, la ayuda y el error se anuncian al enfocar; la altura sigue al contenido (con `autosize`) o el campo se desplaza sin perder el foco; el límite se anuncia sin spamear.

## Diferencia con `GInput`

| | `GTextarea` | `GInput` |
| --- | --- | --- |
| Elemento | `<textarea>` | `<input>` |
| Líneas | Varias (`rows`) | Una |
| Altura | Fija (con tirador) o `autosize` | Fija |
| Enter | Inserta un salto de línea | Envía el formulario |
| Prefijo, sufijo, acción, `type` | No | Sí |

## Anatomía

| Parte | Obligatoria | Nota |
| --- | --- | --- |
| Raíz | Sí | Envuelve etiqueta, caja, mensajes y error |
| Etiqueta | Sí | `<label for>`; nunca se sustituye por `placeholder` |
| Caja (control) | Sí | Contorno y fondo; rodea al `<textarea>` |
| `<textarea>` nativo | Sí | Lleva el foco, el valor y el teclado |
| Tirador de tamaño | No | Nativo (`resize`); solo vertical |
| Indicador de carga | Solo con `loading` | Anillo en la esquina de la caja; `aria-busy` |
| Ayuda | No | Enlazada con `aria-describedby` |
| Contador | No | `n/máx` visible y `aria-hidden` + región viva discreta |
| Error | Solo con error | Región viva, igual que `GInput` |

## Estados

`vacío`, `con texto`, `hover`, `focus-visible`, `disabled`, `readonly`, `invalid` (con error), `loading`, `con contador` (bajo, cerca del límite, en el límite), `autosize` (creciendo, en el máximo con scroll), `rows` fijo con tirador.

## Comportamiento

- **Altura:** `rows` da la altura mínima. Sin `autosize`, la altura es fija y el usuario puede redimensionarla en vertical (tirador). Con `autosize`, la altura sigue al contenido entre `rows` y `maxRows`; pasado `maxRows`, el propio `<textarea>` se desplaza (sigue siendo alcanzable con teclado y sin perder el foco), y no hay tirador.
- **Enter** inserta un salto de línea (nativo); enviar es decisión del consumidor.
- **Contador:** `n/máx` visible para la vista (`aria-hidden`). Para lectores de pantalla, una región `aria-live="polite"` **solo** se actualiza al llegar al 90% del límite y en el límite, no en cada tecla. El límite lo aplica `maxlength` (nativo).
- **`readonly`:** nativo; enfocable, seleccionable y se envía. **`disabled`:** nativo.
- **`loading`:** `aria-busy` y anillo; **no bloquea la escritura** (mismo criterio que `GInput`).
- **Pegado y texto largo:** una palabra sin espacios se parte dentro de la caja (no desborda).

## Riesgo por acción

Escribir es reversible. Pérdida de texto largo (al cerrar sin guardar) es riesgo del consumidor, no del campo. El campo **no** valida: el consumidor decide cuándo hay `error`.

## Continuidad

- **Valor:** siempre `String`.
- **320px y zoom 200%:** sin desborde horizontal; la caja usa el ancho del contenedor.
- **Táctil:** altura ≥ 44px reales aun con `rows` muy bajo.
- **Movimiento:** el crecimiento por `autosize` no se anima (evita saltos al escribir).

## Alcance

| Must | Should | Could | Won't (v0.1) |
| --- | --- | --- | --- |
| Caja, etiqueta, estados, teclado, `rows` | Ayuda y error, `required`, contador con aviso discreto | `resize` configurable | Prefijo, sufijo y acción |
| `autosize` con `maxRows` | `readonly`, `loading` | | Barra inferior (`footer`) dentro de la caja |
| Variantes `outline` y `soft`, tamaños, densidad | | | Texto enriquecido, menciones, Markdown |
