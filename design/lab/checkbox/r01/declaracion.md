# Declaración de cumplimiento · GCheckbox · r01

**Estado:** aprobada. La casilla base y sus estados se derivan de estándares (WCAG 2.2 AA, semántica nativa). El usuario decidió el alcance: entran las propuestas **A (casilla-tarjeta), B (grupo con casilla maestra y conteo) y D (casilla-chip)**; **C (detalle condicional) queda fuera de v0.1** (se compone con `v-if` y un slot). El prop de estructura se llama `layout` (DECISIONS.md #36).
**Ruta:** R1 · **Fidelidad:** F2 · **Material:** kit neutral de grises.
**Siguiente dueño:** lima → `design/contracts/checkbox.md` (tras la selección del usuario).

**Siguiente dueño:** lima → `design/contracts/checkbox.md`.

`sin marcar`, `marcada`, `indeterminada`, `hover`, `focus-visible`, `disabled` (marcada y no), `readonly`, `invalid` con error, `required`, con ayuda. Además, por variante: tarjeta (sin marcar, marcada, deshabilitada), grupo con maestra (todas, ninguna, mixta, hija deshabilitada), detalle condicional (oculto, visible), chip (sin marcar, marcado, deshabilitado), contenedor estrecho (240px) y texto largo.

## Decisiones de estructura (casilla base)

| # | Decisión | Fundamento |
| --- | --- | --- |
| 1 | El control es el `<input type="checkbox">` nativo, **dibujado** con `appearance: none`; no se oculta ni se sustituye por un `div` con `role` | Teclado (Espacio), foco, formularios y accesibilidad ya resueltos; WCAG 4.1.2 |
| 2 | La raíz es un `<label>` que envuelve input y texto: la fila completa activa la casilla | WCAG 2.5.8; un objetivo de 20px es pobre |
| 3 | La marca ✓ / − sale de `:checked` e `:indeterminate`; el estado no depende solo del color (la forma de la marca cambia) | WCAG 1.4.1 |
| 4 | El estado indeterminado es la propiedad `input.indeterminate`, no un atributo; al pulsarla pasa a marcada y la propiedad se apaga sola (verificado con Espacio) | Comportamiento nativo del navegador |
| 5 | Ayuda y error se enlazan con `aria-describedby`; el error va en región viva `aria-live="polite"` y con marca ⚠ además del texto | WCAG 1.3.1, 3.3.1, 4.1.3, 1.4.1 |
| 6 | `disabled` = atributo nativo. `readonly` = `aria-readonly="true"` y el cambio se bloquea (el input nativo no admite `readonly`) | Semántica nativa; ARIA admite `aria-readonly` en `checkbox` |
| 7 | `required` = atributo nativo + marca visual `aria-hidden` | WCAG 3.3.2 |
| 8 | Foco solo con `:focus-visible`, separado del borde | WCAG 2.4.7 y 2.4.11 |
| 9 | Con `pointer: coarse`, la fila mide ≥ 44px (el cuadro sigue en 20px) | WCAG 2.5.8 y `tokens.md` §7 |
| 10 | La etiqueta salta de línea; el cuadro no se encoge | WCAG 1.4.10 |

## Propuestas originales

| # | Propuesta | Estructura y comportamiento | Verificado |
| --- | --- | --- | --- |
| A | **Casilla-tarjeta** | Todo el `<label>` es la tarjeta: cuadro, icono decorativo (`aria-hidden`), título, descripción (enlazada con `aria-describedby`) y dato destacado. Seleccionada, cambia la forma del borde y el relleno. **Sin contenido interactivo dentro** | Un clic en la descripción alterna la casilla; borde de 1px a 2px al marcar; `aria-describedby` correcto |
| B | **Grupo con casilla maestra y conteo** | `role="group"` con nombre; la maestra se **deriva** de las hijas (todas → marcada, ninguna → sin marcar, algunas → mixta) y, al pulsarla, marca o desmarca todas las **habilitadas**; una región viva educada dice "n de m seleccionadas" | Estados 10100 → mixta y "2 de 4"; maestra marca 4 de 4; maestra desmarca todas; una hija → mixta "1 de 4"; la hija deshabilitada no se toca |
| C | **Casilla con detalle** | Al marcar, aparece un bloque justo debajo en el orden del documento, enlazado con `aria-controls`; al desmarcar, se oculta con `hidden` (sale del árbol de accesibilidad). El foco no se mueve | `hidden` ↔ visible al alternar; `aria-controls` apunta al bloque |
| D | **Casilla-chip** | Sigue siendo `checkbox`. El input cubre el chip con `opacity: 0` (no `display: none`): conserva foco y clic. Marcado, muestra ✓ y cambia de relleno | Un clic en la etiqueta alterna; fondo cambia a oscuro; opacidad 0; Espacio la alterna |

## Criterios revisados

| Criterio | Resultado | Cómo |
| --- | --- | --- |
| WCAG 1.3.1 Información y relaciones | Cumple | Todas las casillas tienen etiqueta asociada (0 sin nombre) |
| WCAG 1.4.1 Uso del color | Cumple por diseño | Forma de la marca, ✓ en chip, borde discontinuo y ⚠ en error |
| WCAG 1.4.10 Reajuste | Cumple | A 320px `scrollWidth` = 320; el texto largo salta de línea en 240px |
| WCAG 2.1.1 Teclado | Cumple | Espacio alterna; Tab recorre en orden; la indeterminada pasa a marcada con Espacio |
| WCAG 2.4.3 Orden del foco | Cumple | Orden del documento (detalle después de su casilla) |
| WCAG 2.4.7 Foco visible | Cumple en el prototipo | Contorno de 3px con separación de 2px (`:focus-visible` verdadero); el estilo final es de coco |
| WCAG 2.5.8 Tamaño del objetivo | Cumple | Fila ≥ 24px; ≥ 44px con `pointer: coarse` (verificado con emulación táctil a 320px: filas y chips de 44px) |
| WCAG 4.1.2 Nombre, función, valor | Cumple | Input nativo; `aria-readonly`; `indeterminate` como propiedad |
| WCAG 4.1.3 Mensajes de estado | Cumple por diseño, sin confirmar con lector real | Regiones vivas presentes antes del cambio (error, conteo) |
| Heurística: control y libertad | Cumple | Marcar es reversible; el consentimiento no viene marcado por defecto |
| Heurística: consistencia | Parcial | Usa `size`, `density`, `color`, `disabled` de la API compartida; `variant` no encaja (ver hallazgo 1) |

## Comprobaciones ejecutadas

- Chromium, `localhost:4174`. Consola del navegador sin errores.
- Lógica de la maestra, del detalle, de la tarjeta, del chip y del solo lectura, con clics reales sobre el DOM (ver la columna "Verificado" de las propuestas).
- Teclado real: Espacio sobre la casilla indeterminada la marca; Tab pasa a la siguiente con contorno de 3px.
- `indeterminate` es propiedad y no atributo (`hasAttribute` = falso).
- Emulación táctil (`pointer: coarse`, 320px): filas de 44px, chips de 44px, cuadro de 20px, sin desborde horizontal.

## Comprobaciones NO ejecutadas

- **Lector de pantalla real** (VoiceOver, NVDA): cómo se anuncia "mixta", el conteo del grupo y el error.
- **Zoom al 200%** y **dispositivo táctil real**.
- `forced-colors` y `prefers-reduced-motion`: el estilo final es de coco.
- Contraste: no aplica a un wireframe en grises; lo audita coco con el tema real.
- Un lector de pantalla con `aria-controls` en la casilla con detalle: su soporte varía entre lectores.
- `scripts/check_artifact.py` y referencias del protocolo de gobernanza: no existen en el entorno.

## Hallazgos para lima

| # | Hallazgo | Severidad | Propuesta de la ronda |
| --- | --- | --- | --- |
| 1 | `variant` de la API compartida (`solid soft outline ghost link`) no describe estas estructuras | Alta | Prop propia `layout`: `default` `card` `chip`. El grupo es un componente aparte. **Aprobado por el usuario** (DECISIONS.md #36); `details` queda fuera de v0.1 |
| 2 | ¿`GCheckboxGroup` es un componente aparte o un slot del propio `GCheckbox`? | Alta | Componente aparte: `v-model` de arreglo, maestra opcional (`selectAll`), conteo y `role="group"`. Propuesta de kiwi; lima la confirma en el contrato |
| 3 | Valor: ¿booleano o arreglo? | Media | Booleano por defecto; con `value`, el `v-model` es un arreglo (como el `<input>` nativo) |
| 4 | `readonly` no existe en el input nativo | Media | `aria-readonly="true"` y bloqueo del cambio; el prop `readonly` de la API compartida se acepta |
| 5 | La propiedad `indeterminate` no se puede poner por atributo | Media | Prop `indeterminate` que el componente aplica a la propiedad del DOM; el estado mixto de la maestra se deriva en el grupo |
| 6 | Textos traducibles del conteo del grupo ("n de m seleccionadas", "Ninguna seleccionada") | Media | Prop con plantilla o función, sin valor por defecto (como `loadingText` de `GBtn`) |
| 7 | Ayuda, error y etiqueta: mismo criterio que `GInput` | Baja | Props `label`, `hint`, `error` y slots equivalentes; el error solo con `error` |
| 8 | Altura real de la fila con `pointer: coarse` | Baja | ≥ 44px reales, sin importar `density` |
| 9 | Icono y dato destacado de la tarjeta | Baja | Slots `icon` y `meta` (decorativo el icono) |
| 11 | La propuesta C (detalle condicional) queda fuera de v0.1 | Baja | No se contrata; el consumidor lo compone con `v-if` y su propio bloque |
| 10 | Tokens posibles nuevos: tamaño del cuadro, grosor del borde del cuadro | Baja | Derivar del espacio (`--g-space-1` × unidades por `size`); solo pedir token si coco lo necesita |
