# Declaración de cumplimiento · GInput · r01

**Estado:** aprobada. Las decisiones de estructura se derivan de estándares (WCAG 2.2 AA, heurísticas); el alcance (campo completo; tipos `text email password search tel url`) y las variantes (`outline` y `soft`, hallazgo 5) las decidió el usuario. Queda sin ejecutar la comprobación con lector de pantalla real y hay hallazgos de API para lima.
**Ruta:** R1 · **Fidelidad:** F2 · **Material:** kit neutral de grises.
**Siguiente dueño:** lima → `design/contracts/input.md`.

## Estados cubiertos

`default`, `hover`, `focus-visible`, `filled`, `disabled`, `readonly`, `invalid`, `loading`. En combinación con: ayuda, contador, obligatorio, iconos inicial y final, botón mostrar/ocultar contraseña, contenedor estrecho (340px) y texto largo.

## Decisiones de estructura

| # | Decisión | Fundamento |
| --- | --- | --- |
| 1 | Etiqueta siempre visible sobre el control, con `<label for>`; nunca solo `placeholder`, sin etiqueta flotante | WCAG 3.3.2 (etiquetas o instrucciones), 1.3.1; el placeholder desaparece al escribir |
| 2 | El control es un `<input>` nativo; no se reimplementa teclado, selección ni portapapeles | Comportamiento nativo probado; WCAG 2.1.1 |
| 3 | Ayuda y error se enlazan con `aria-describedby` (ids separados por espacio) | WCAG 1.3.1, 3.3.1; se anuncian al enfocar el campo |
| 4 | Error: texto + marca (⚠) + borde distinto, nunca solo color; `aria-invalid="true"` solo con error | WCAG 1.4.1 (uso del color), 3.3.1 (identificación del error) |
| 5 | La región del error existe siempre en el DOM (vacía) con `aria-live="polite"`; recibe el texto al haber error | WCAG 4.1.3; una región viva se anuncia de forma confiable solo si ya existe |
| 6 | Foco: el anillo va en la **caja completa** (`:has(input:focus-visible)`), no en el `<input>` interior | WCAG 2.4.7 y 2.4.11; el usuario ve el campo entero enfocado |
| 7 | `disabled` = atributo nativo (no enfocable). `readonly` = enfocable, seleccionable y enviable | Semántica nativa; la API compartida define ambos |
| 8 | Obligatorio: atributo `required` + marca visual `aria-hidden` | WCAG 3.3.2; el anuncio lo da `required`, la marca es solo visual |
| 9 | Mostrar/ocultar contraseña: botón `type="button"` **después** del input, con `aria-controls` y nombre accesible que cambia ("Mostrar" / "Ocultar contraseña"); el foco se conserva. *(La ronda propuso también `aria-pressed`; se quitó en el contrato, ver `input.md` hallazgo 13.)* | WCAG 4.1.2, 2.4.3 |
| 10 | El botón mostrar/ocultar sale del orden natural: input → botón | WCAG 2.4.3 |
| 11 | `loading` = indicador + `aria-busy`; **no** bloquea la escritura | Una validación asíncrona no debe impedir corregir el valor (control del usuario) |
| 12 | Iconos inicial y final siempre `aria-hidden` | El nombre accesible viene de la etiqueta |
| 13 | Contador `n/máx` visible, `aria-hidden`; el límite lo impone `maxlength` nativo | Sin anuncios de contador en cada pulsación (ruido para lector de pantalla) |
| 14 | Con `pointer: coarse`, la caja mide ≥ 44px de alto (altura real, no pseudo-elemento) | WCAG 2.5.8 y contrato de tokens §7; un pseudo-elemento se solaparía con el mensaje y los campos vecinos |
| 15 | Etiqueta, ayuda y error saltan de línea; el valor se desplaza dentro del campo | WCAG 1.4.10 (reajuste) |
| 16 | `autocomplete` y `type` pasan al `<input>` sin cambios | WCAG 1.3.5 (identificar el propósito del campo) |
| 17 | Los mensajes de ayuda y error no reservan espacio: el contenido de abajo se desplaza al aparecer un error | Simplicidad; el desplazamiento ocurre tras una acción del usuario (salir del campo) |

## Criterios revisados

| Criterio | Resultado | Cómo |
| --- | --- | --- |
| WCAG 1.3.1 Información y relaciones | Cumple | Ningún `<input>` (salvo la casilla del área táctil) queda sin etiqueta asociada (`labels.length`); ayuda y error en `aria-describedby` |
| WCAG 1.4.1 Uso del color | Cumple por diseño | Error con texto, marca y borde discontinuo |
| WCAG 1.4.10 Reajuste | Cumple | A 320px: `scrollWidth` = 320, ningún campo sale del ancho |
| WCAG 2.1.1 Teclado | Cumple | Tab: correo → contraseña → botón mostrar; Enter/Espacio en el botón (nativo) |
| WCAG 2.4.3 Orden del foco | Cumple | El foco se conserva en el botón tras mostrar/ocultar |
| WCAG 2.4.7 Foco visible | Cumple en el prototipo | Anillo sólido de 3px en la caja y en el botón; el estilo final es de coco |
| WCAG 2.5.8 Tamaño del objetivo | Cumple | Botón mostrar/ocultar de 24px mínimo; con `pointer: coarse`, caja de 44px (verificado con emulación táctil a 320px) |
| WCAG 3.3.1 Identificación del error | Cumple | El error aparece al salir del campo, en texto, con `aria-invalid` |
| WCAG 3.3.2 Etiquetas o instrucciones | Cumple | Etiqueta visible; ayuda enlazada; obligatorio marcado |
| WCAG 4.1.2 Nombre, función, valor | Cumple | Botón con `aria-label` y `aria-pressed`; `disabled` nativo |
| WCAG 4.1.3 Mensajes de estado | Cumple por diseño, sin confirmar con lector real | Región viva presente antes del cambio |
| Heurística: prevención de errores | Cumple | `maxlength`, `type` con teclado adecuado, `autocomplete` |
| Heurística: control y libertad | Cumple | `loading` no bloquea la escritura; el valor no se borra ni se reformatea |
| Heurística: consistencia | Cumple | Usa la API compartida; `variant` limitado a `outline` y `soft` por decisión del usuario |

## Comprobaciones ejecutadas

- Chromium, `localhost:4174`. Consola del navegador sin errores.
- Teclado con eventos reales: clic en el campo, escribir, Tab → aparece el error, `aria-invalid="true"`, el foco pasa a la contraseña; Tab → foco en el botón mostrar/ocultar con contorno de 3px (`:focus-visible` verdadero).
- Botón mostrar/ocultar: alterna `type` entre `password` y `text`, `aria-pressed` y el nombre accesible; el foco se conserva.
- `aria-describedby` = `email-h email-e`; región `aria-live="polite"` presente y vacía antes del error.
- Campo deshabilitado: no recibe el foco.
- Ancho de 320px con emulación táctil: sin desborde horizontal; alto mínimo de caja 44px.

## Comprobaciones NO ejecutadas

- **Lector de pantalla real** (VoiceOver, NVDA): no se sabe si la región viva y `aria-describedby` juntos duplican el anuncio del error al enfocar. Pendiente.
- Zoom al 200% del navegador (se probó por ancho de ventana).
- Dispositivo táctil real; se usó la emulación de `pointer: coarse`.
- Autocompletar y gestores de contraseñas reales.
- `forced-colors` y `prefers-reduced-motion`: definidos, no probados; el estilo final es de coco.
- Contraste: no aplica a un wireframe en grises; lo audita coco con el tema real. En particular, el color del `placeholder` y del borde de la caja (≥ 3:1).
- `scripts/check_artifact.py` y referencias del protocolo de gobernanza de interfaz: no existen en el entorno.

## Hallazgos para lima

| # | Hallazgo | Severidad | Propuesta de la ronda |
| --- | --- | --- | --- |
| 1 | Los nombres "Mostrar contraseña" y "Ocultar contraseña" deben poder traducirse (mismo criterio que `loadingText` de `GBtn`) | Alta | Props propias sin valor por defecto: `showPasswordLabel` y `hidePasswordLabel`; sin ellas, el botón no se muestra (o se emite advertencia en desarrollo) |
| 2 | La API compartida define `loading` como "bloquea la acción"; en un campo no debe bloquear la escritura | Media | Precisar en `docs/contract/api.md`: en controles de entrada, `loading` solo muestra el indicador y `aria-busy` |
| 3 | Falta decidir cómo se entrega el error | Media | Props propias `label`, `hint`, `error` (texto). `error` con valor implica `aria-invalid` y el estilo de error. Slots `label`, `hint`, `error` para contenido rico |
| 4 | `color` en un campo: ¿qué colorea? | Media | Solo el anillo de foco y el borde al enfocar; el error usa siempre `danger` |
| 5 | `variant` de la API compartida (`solid soft outline ghost link`) no encaja con un campo | Media | Aceptar solo `outline` (por defecto) y `soft` (caja rellena); el resto se rechaza con el validador. **Aprobado por el usuario** (DECISIONS.md #28) |
| 6 | `required`, `type`, `name`, `placeholder`, `maxlength`, `autocomplete`, `inputmode` no están en la API compartida | Media | `required` y `type` como props propias; los demás pasan por `$attrs` al `<input>` (no a la raíz) |
| 7 | Contador: ¿prop o automático con `maxlength`? | Baja | Prop propia `counter` (Boolean); usa `maxlength` recibido |
| 8 | `id` para enlazar etiqueta, ayuda y error | Baja | Generado por el componente (`useId` de Vue 3.5 o contador propio); se puede pasar `id` |
| 9 | Alto real de la caja con `pointer: coarse` es 44px sin importar `density` | Baja | Incorporar al contrato: mínimo real, no pseudo-elemento |
| 10 | Tokens posibles nuevos: borde de control, color de error, altura de campo | Baja | Reutilizar `--g-color-border-control`, `--g-color-danger-text`, `--g-space-1` × unidades de tamaño; solo agregar tokens si coco los necesita |
