# Brief — campo de hora (`GTimeField`, nombre de trabajo), r01: base funcional

> kiwi, 2026-10-06. Origen: `PENDIENTES.md` §3 («hora: sin ronda; candidato a próximo»), `form.md` «Fases siguientes» (fila 5, «siguen sin ronda: `GTimeField`») y DECISIONS #168 (Fase 5, rondas propias).

## Para qué

Citas («¿a qué hora?»), horarios de atención, tomas de medicamento («8:00, 14:00 y 22:00»), turnos que cruzan la medianoche (22:00 → 6:00), la hora exacta de un evento clínico con segundos. Lo usan personas en escritorio (escriben rápido: «930», «21»), en móvil (teclado numérico, sin flechas) y con teclado y lector de pantalla. Convive con `GDatePicker`: muchas veces la hora va con una fecha.

## El problema de lo que hay

- `<input type="time">` nativo: segmentos que cada navegador dibuja distinto (Chrome con un reloj desplegable, Safari de escritorio sin selector, Firefox con segmentos sin flechas visibles), lectores que leen «hora, 9, minutos, 30, AM» en tres paradas, el formato lo decide el sistema y no la página, `min`/`max` no admiten un rango que cruce la medianoche y la validación nativa avisa en el idioma del navegador.
- Los frameworks: una **lista desplegable de 48 o 96 horas** (hay que desplazarse para llegar a las 21:30) o un **reloj analógico** (dos gestos de precisión en un círculo, nadie lee la hora así en un formulario). r02 cuestiona las dos premisas.

## Qué es esta ronda

La **base funcional**: semántica y anuncio, teclado, escritura libre y su interpretación, validación, modelo y envío, idioma (12/24 h, cifras, separador, dirección), límites que cruzan la medianoche, estados, encaje en `GForm` y `GFormRow` junto a `GInput` y `GDatePicker`, y qué **no** hace con las zonas horarias. Deriva de HTML, WAI-ARIA APG (*Spinbutton*), WCAG 2.2 y los contratos vigentes (`form.md`, `number-field.md`, `datepicker.md`, `api.md`). La forma es la convencional **a propósito**: la identidad se decide en `../r02/` (tres conceptos).

## Solapes revisados antes de proponer

| Componente | Qué comparte | Decisión |
| --- | --- | --- |
| `GInput` | Caja, etiqueta, pie, mensaje, prefijo/sufijo (#166), `output` (C14), `is-ready`/`is-rejected`, `GFormRow`, `data-g-tooltip-box` (#395) | **Se compone** con sus slots internos `field` y `end`, como `GNumberField` (#309). Nada se duplica |
| `GNumberField` | `spinbutton` editable, `aria-valuetext`, oculto canónico, `change` por gesto, resolución de `locale`, `aria-required` (#311) | **Mismo patrón**, motor distinto (`utils/timeInput.js`, L2). Una hora no es un número: se escribe con separador, da la vuelta a medianoche y tiene mitad del día |
| `GDatePicker` | Popover anclado (#358), hoja móvil, nombres con `Intl`, «una fecha, no un instante» | **Convive**: receta fecha + hora en una `GFormRow` (punto 18); B de r02 reutiliza su patrón de diálogo no modal |
| `GCalendar` | Horas en su rejilla, zona horaria explícita (#38) | Sin solape: `GCalendar` trabaja con **instantes** y zona; el campo de hora, con **hora de pared** (punto 19) |
| `GSelect` / `GCombobox` | Lista desplegable | Es la premisa que r02 rechaza (48 opciones). Un campo de hora **se escribe**; no es un `combobox` |
| `GRadioGroup segmented` | Elegir a. m. / p. m. | No: añadiría una parada de Tab y un segundo control que no es el valor (punto 13) |
| `GFieldGroup` / `GInputGroup` | Horas en partes (hora · minuto) | No: el patrón de segmentos es justo lo que se evita (punto 1) |

## Entregables

- `../engine.js` (motor: idioma, interpretación, formato, pasos con arcos, duración; propuesta de `utils/timeInput.js`), `../field.js` (`XTimeField` sobre el `GInput` real, compartido con r02), `field.css` (kit con neutros del tema), `index.html` (seis casos).
- `../verificar.mjs` (la base y los conceptos, tres motores, puerto 4212).
- `declaracion.md`: decisiones numeradas, «Qué lo hace distinto», comprobaciones y hallazgos L1… para lima.

## Ver

`index.html` (`?dir=rtl`, `?now=10:40` fija la hora actual). Verificación: `node design/lab/time-field/verificar.mjs` (`PARTS=base`; requiere `npm run build`).
