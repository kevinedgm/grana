# Declaración de cumplimiento · GSwitch · r01

**Estado:** aprobada. El interruptor y sus estados se derivan de estándares (WCAG 2.2 AA, rol `switch` de WAI-ARIA sobre `<input type="checkbox">`). El usuario decidió el alcance: **interruptor completo** (sin tarjeta ni grupo); **marca de estado dibujada en el pulgar** (✓ / −) con slots opcionales de iconos on/off; **`loading` con anillo en el pulgar, sin bloquear el cambio**.
**Ruta:** R1 · **Fidelidad:** F2 · **Material:** kit neutral de grises.
**Siguiente dueño:** lima → `design/contracts/switch.md`.

`apagado`, `encendido`, `hover`, `focus-visible`, `disabled` (apagado y encendido), `readonly` (apagado y encendido), `invalid` con error, `loading` (apagado y encendido), con ayuda; tamaños `xs` a `xl`; etiqueta al inicio; contenedor de 240px con texto largo; RTL.

## Decisiones de estructura

| # | Decisión | Fundamento |
| --- | --- | --- |
| 1 | El control es el `<input type="checkbox" role="switch">` nativo, **dibujado** con `appearance: none`; no se oculta ni se sustituye por un `div` con `role` | Teclado (Espacio), foco, formularios y estado ya resueltos; WCAG 4.1.2; el rol `switch` es válido sobre un checkbox (HTML-AAM) |
| 2 | La raíz de la fila es un `<label>` que envuelve input y texto: la fila completa activa el interruptor | WCAG 2.5.8; un riel de 24px es un objetivo pobre |
| 3 | El estado no depende solo del color ni de la posición: además, el pulgar lleva una marca dibujada (✓ encendido, − apagado) | WCAG 1.4.1 |
| 4 | El pulgar y su marca son `::before` y `::after` del propio input; el riel es el input | El input solo tiene dos pseudo-elementos: la carga reutiliza `::after` (anillo) mientras dura |
| 5 | Espacio alterna; **Enter no** (verificado con teclado real) | Comportamiento nativo del checkbox; APG: Espacio obligatorio, Enter opcional |
| 6 | Ayuda y error se enlazan con `aria-describedby`; el error va en región viva `aria-live="polite"` y con marca ⚠ además del texto | WCAG 1.3.1, 3.3.1, 4.1.3, 1.4.1 |
| 7 | `disabled` = atributo nativo. `readonly` = `aria-readonly="true"` y el cambio se cancela (verificado: sigue apagado o encendido y sigue enfocable) | Semántica nativa; ARIA admite `aria-readonly` en `switch` |
| 8 | `loading` = `aria-busy="true"` y anillo en el pulgar; **no bloquea** (verificado: el clic cambia el estado) | Decisión del usuario; un guardado asíncrono debe poder revertirse por el consumidor |
| 9 | Foco solo con `:focus-visible`, contorno separado del riel | WCAG 2.4.7 y 2.4.11 |
| 10 | Con `pointer: coarse`, la fila mide ≥ 44px (el riel sigue en 24px) | WCAG 2.5.8 y `tokens.md` §7 |
| 11 | La etiqueta salta de línea; el riel no se encoge (verificado a 240px: `scrollWidth` = `clientWidth`) | WCAG 1.4.10 |
| 12 | Etiqueta al inicio o al final con la fila invertida y propiedades lógicas; en RTL, el pulgar y el orden se espejan (verificado: riel a la derecha, pulgar encendido a la izquierda) | Requisito de internacionalización |
| 13 | Tamaños `xs` a `xl` desde `space`; la marca del pulgar escala con el pulgar (½ de su diámetro) | Escala compartida (`tokens.md` §4) |

## Criterios revisados

| Criterio | Resultado | Cómo |
| --- | --- | --- |
| WCAG 1.3.1 Información y relaciones | Cumple | 0 interruptores sin nombre; todos con `role="switch"` |
| WCAG 1.4.1 Uso del color | Cumple por diseño | Marca dibujada, posición del pulgar, contorno discontinuo en error/readonly y ⚠ |
| WCAG 1.4.10 Reajuste | Cumple | 375px y 240px sin desborde horizontal |
| WCAG 2.1.1 Teclado | Cumple | Espacio alterna; Enter no; Tab recorre en orden |
| WCAG 2.4.7 Foco visible | Cumple en el prototipo | Contorno de 3px; el estilo final es de coco |
| WCAG 2.5.8 Tamaño del objetivo | Cumple | Fila 24px; 44px con `pointer: coarse` (verificado con emulación táctil) |
| WCAG 4.1.2 Nombre, función, valor | Cumple | Input nativo con rol `switch`; `aria-readonly`, `aria-busy` |
| WCAG 4.1.3 Mensajes de estado | Cumple por diseño, sin confirmar con lector real | Región del error presente antes del cambio |
| Heurística: control y libertad | Cumple | Reversible e inmediato; `loading` no bloquea |
| Heurística: consistencia | Cumple | `size`, `density`, `color`, `disabled`, `readonly`, `loading` de la API compartida; `variant` no encaja (hallazgo 1) |

## Comprobaciones ejecutadas

- Chromium, `localhost:4174`. Sin errores en consola.
- Teclado real: Espacio alterna y Enter no; Tab enfoca con contorno de 3px.
- Clics: en el riel y en la etiqueta alternan; `readonly` cancela y sigue enfocable; `loading` no bloquea.
- Geometría: tamaños 36×20, 40×22, 44×24, 52×30 y 64×36 (marcas escaladas); fila de 44px con puntero grueso; RTL espejado.

## Comprobaciones NO ejecutadas

- **Lector de pantalla real** (VoiceOver, NVDA, TalkBack): anuncio de "interruptor, activado", ayuda, error y `aria-busy`.
- **Zoom al 200%** y **dispositivo táctil real**.
- `forced-colors` y `prefers-reduced-motion`: el estilo final es de coco.
- Contraste: no aplica a un wireframe; lo audita coco con el tema real (riel apagado 3:1; pulgar contra riel 3:1 en ambos estados; marca contra pulgar 3:1).

## Hallazgos para lima

| # | Hallazgo | Severidad | Propuesta de la ronda |
| --- | --- | --- | --- |
| 1 | `variant` (`solid soft outline ghost link`) no describe un interruptor | Alta | No hay `variant` (mismo criterio que `GCheckbox`, DECISIONS.md #36) |
| 2 | Valor | Alta | Booleano (`modelValue`). Sin `value`/arreglo ni `true-value`/`false-value` en v0.1 |
| 3 | Posición de la etiqueta | Media | Prop `labelPosition`: `end` (por defecto) o `start` |
| 4 | `readonly` no existe en el input nativo | Media | `aria-readonly="true"` y bloqueo del cambio (como `GCheckbox`) |
| 5 | Indicador de carga | Media | `loading`: `aria-busy` y anillo; no bloquea. Precisar en `api.md` (hoy dice "bloquea la acción") |
| 6 | Iconos on/off | Media | Slots `icon-on` e `icon-off` dentro del pulgar; decorativos (`aria-hidden`); sustituyen a la marca; sin ellos, marca dibujada |
| 7 | Etiqueta, ayuda y error | Baja | Props `label`, `hint`, `error` y slots equivalentes, como `GCheckbox` |
| 8 | `required` | Baja | No aplica a un interruptor de efecto inmediato: sin prop en v0.1 |
| 9 | Altura real de la fila con `pointer: coarse` | Baja | ≥ 44px reales, sin importar `density` |
| 10 | Tamaños del riel | Baja | Alto y ancho desde `space` (con `space` 4: riel 36×20, 40×22, 44×24, 52×30 y 64×36 para `xs` a `xl`); lima los fija como en `tokens.md` para la casilla |
