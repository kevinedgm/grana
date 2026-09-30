# Declaración de cumplimiento · GTextarea · r01

**Estado:** aprobada. El campo y sus estados se derivan de estándares (WCAG 2.2 AA, `<textarea>` nativo) y del contrato vigente de `GInput`. El usuario decidió el alcance: **`rows` con `autosize` opcional** (`maxRows`, `resize`) y **campo completo como `GInput`**, sin prefijo, sufijo, acción ni barra inferior.
**Ruta:** R1 · **Fidelidad:** F2 · **Material:** kit neutral de grises.
**Siguiente dueño:** lima → `design/contracts/textarea.md`.

`vacío` con placeholder, con texto, con ayuda, requerido, `disabled`, `readonly`, inválido con error, `loading`, `soft`; `rows` 1, 2 y 6; `autosize` (creciendo y en el máximo con scroll); contador (bajo, al 90% y en el límite); tamaños `sm`, `md` y `lg`; contenedor de 240px con palabra larguísima.

## Decisiones de estructura

| # | Decisión | Fundamento |
| --- | --- | --- |
| 1 | El control es el `<textarea>` nativo | Foco, valor, teclado, formularios y edición ya resueltos; WCAG 4.1.2 |
| 2 | Etiqueta con `<label for>`; nunca se sustituye por `placeholder` | WCAG 3.3.2, 1.3.1 |
| 3 | Ayuda y error se enlazan con `aria-describedby`; el error va en región viva `aria-live="polite"` con marca ⚠ además del texto | WCAG 1.3.1, 3.3.1, 4.1.3, 1.4.1 |
| 4 | `rows` = altura mínima; sin `autosize`, tirador **solo vertical** (`resize: vertical`) | Un tirador horizontal rompe el diseño (WCAG 1.4.10) |
| 5 | `autosize`: la altura sigue al contenido entre `rows` y `maxRows` midiendo `scrollHeight` (verificado: 60px con 1 línea, 148px al llegar a 6 filas con 8 líneas); pasado `maxRows`, el propio `<textarea>` se desplaza con `overflow-y: auto` y **sin tirador** | El texto escrito nunca se oculta; un `<textarea>` que se desplaza es alcanzable con teclado y sin perder el foco |
| 6 | El crecimiento no se anima | Una animación de altura en cada tecla provoca saltos y molesta (WCAG 2.3.3) |
| 7 | Enter inserta un salto de línea; enviar es decisión del consumidor | Comportamiento nativo del `<textarea>` |
| 8 | Contador visual `n/máx` con `aria-hidden`; el límite lo aplica `maxlength` nativo | Mismo criterio que `GInput` |
| 9 | Región viva discreta del contador: **habla solo al cambiar de nivel** (90% y límite), no en cada tecla, y con un texto sin cifras cambiantes ("Cerca del límite: máximo N caracteres") | WCAG 4.1.3 sin spam; verificado: de 100 a 120 caracteres, un solo aviso al 90% y otro al límite. (Una primera versión decía "Quedan N": quedaba desactualizada mientras el usuario seguía escribiendo) |
| 10 | `readonly` = atributo nativo; `disabled` = atributo nativo | Semántica nativa |
| 11 | `loading` = `aria-busy` y anillo en la esquina; **no bloquea la escritura** | Mismo criterio que `GInput` (DECISIONS.md #30) |
| 12 | Con `pointer: coarse`, altura mínima ≥ 44px aunque `rows` sea 1 | WCAG 2.5.8 y `tokens.md` §7 |
| 13 | La palabra larguísima se parte dentro de la caja; la ayuda y el error también (`overflow-wrap: anywhere`, `min-width: 0` en la ayuda) | WCAG 1.4.10 (verificado a 240px: sin desborde tras corregir la ayuda) |
| 14 | Foco visible solo con `:focus-visible`, anillo pegado al borde de la caja | WCAG 2.4.7, 2.4.11 y DECISIONS.md #35 |

## Criterios revisados

| Criterio | Resultado | Cómo |
| --- | --- | --- |
| WCAG 1.3.1 Información y relaciones | Cumple | 0 campos sin etiqueta |
| WCAG 1.4.10 Reajuste | Cumple | 240px: `scrollWidth` = `clientWidth` |
| WCAG 2.1.1 Teclado | Cumple | Escribir, Enter y desplazamiento con el cursor; el campo desplazado sigue enfocado |
| WCAG 2.4.7 Foco visible | Cumple en el prototipo | Contorno de 3px; el estilo final es de coco |
| WCAG 2.5.8 Tamaño del objetivo | Cumple por diseño | `min-block-size: max(44px, …)` con `pointer: coarse` (no verificado con emulación táctil en esta ronda) |
| WCAG 3.3.2 Etiquetas o instrucciones | Cumple | Etiqueta visible y ayuda |
| WCAG 4.1.2 Nombre, función, valor | Cumple | `<textarea>` nativo |
| WCAG 4.1.3 Mensajes de estado | Cumple por diseño, sin confirmar con lector real | Regiones vivas presentes antes del cambio |
| Heurística: consistencia | Cumple | `variant` (`outline` `soft`), `size`, `density`, `disabled`, `readonly`, `loading`, `block`, `rounded` de la API compartida y anatomía de `GInput` |

## Comprobaciones ejecutadas

- Chromium, `localhost:4174`. Sin errores en consola.
- Escritura real con la herramienta: 8 líneas en un campo con `maxRows` 6 → 148px (6 filas), scroll interno, el campo conserva el foco.
- Contador: niveles bajo, 90% y límite; un solo aviso por nivel; `maxlength` = 120.
- Geometría: `rows` 1, 2 y 6 → 38, 60 y 148px; `resize` = `vertical` con filas fijas y `none` con `autosize`.
- 240px con palabra larguísima: sin desborde (tras un hallazgo en la ayuda).

## Comprobaciones NO ejecutadas

- **Lector de pantalla real** (VoiceOver, NVDA): anuncio de etiqueta, ayuda, error y los avisos del contador.
- **Emulación táctil**, **zoom al 200%** y **dispositivo táctil real**.
- `forced-colors` y `prefers-reduced-motion`: el estilo final es de coco.
- Contraste: no aplica a un wireframe; lo audita coco con el tema real.
- **Pegado de textos enormes** y rendimiento de `autosize` (medir `scrollHeight` en cada tecla) con miles de líneas.

## Hallazgos para lima

| # | Hallazgo | Severidad | Propuesta de la ronda |
| --- | --- | --- | --- |
| 1 | `variant` de la API compartida | Media | Subconjunto `outline` y `soft`, igual que `GInput` (DECISIONS.md #28) |
| 2 | Valor | Alta | Siempre `String` (`modelValue`) |
| 3 | Altura | Alta | Props `rows` (por defecto 3), `autosize` (Boolean), `maxRows` (solo con `autosize`; sin valor, sin máximo) y `resize` (`none` `vertical`; por defecto `vertical`, y `none` con `autosize`) |
| 4 | Aviso accesible del contador | Alta | Prop `counterText`: función `(nivel, máximo) => string` con `nivel` `near` o `limit`, **sin valor por defecto** (Grana es internacional); sin ella, no hay región viva (solo el contador visual). La región existe siempre y se actualiza solo al cambiar de nivel |
| 5 | Contador | Media | `counter` + `maxlength` en `$attrs`, igual que `GInput`; umbral de nivel `near` del 90% |
| 6 | `readonly`, `disabled`, `loading` | Baja | Como `GInput`: nativos y `aria-busy` sin bloquear |
| 7 | Etiqueta, ayuda, error, `required` | Baja | Props `label`, `hint`, `error`, `required` y slots equivalentes, como `GInput` |
| 8 | Medición del `autosize` | Media | La lógica es de bruno (medir `scrollHeight` y `ResizeObserver` ante cambios de ancho); coco solo fija las líneas y el relleno con tokens |
| 9 | `rounded`, `block`, `color` | Baja | Como `GInput` (`color` solo colorea el foco; `block` = ancho completo) |
| 10 | Slots | Baja | `label`, `hint`, `error`; sin `prepend`, `append` ni `action` |
