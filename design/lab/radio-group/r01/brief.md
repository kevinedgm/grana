# Brief — GRadioGroup (r01)

> Brief de kiwi a partir del encargo (2026-10-02), verificado contra el repo. Fase 2 del sistema de formularios (`design/contracts/form.md`, «Fases siguientes»).

## Qué es

Una **pregunta con una sola respuesta** dentro de un formulario: Sí/No, sexo, modalidad de consulta, tipo de sangre, frecuencia. Radios nativos (`<input type="radio">`) con un `name` común; cinco apariencias (`list`, `inline`, `segmented`, `chips`, `cards`) que cambian la forma, no la semántica.

## Lo que ya está decidido y no se reabre

| Fuente | Qué fija |
| --- | --- |
| `form.md` «Fases siguientes», Fase 2 | `GRadioGroup`/`GRadio`, `appearance` `list` `inline` `segmented` `chips` `cards`; `fieldset`/`legend`; radios nativos; relación con `GCard selectType="radio"` (#124) |
| `form.md` §3 | `fieldset`/`legend` se reserva para **preguntas**: radios sí |
| `form.md` §4 «Pistas y alineación» | Hijos admitidos en una `GFormRow` con más de un hijo: estructura de **tres hijos** (etiqueta · caja · pie) con `useFormField`; en la Fase 2, `GRadioGroup appearance="segmented"` |
| `form.md` L7, #181 | **Segmentado:** raíz `role="radiogroup"` + `aria-labelledby` hacia una etiqueta visible (no `fieldset`/`legend`) y tres hijos, para compartir línea; las demás apariencias, `fieldset` y fila propia |
| #124, #133 | `GCardGroup` diferido; tarjetas de selección = `GCard selectType="radio"` con `name` común dentro de un `role="radiogroup"` **del consumidor**; modelo = valor elegido |
| #157, C1 a C12, #262, #266 | Contexto de `GForm` con `useFormField`; errores «tarde»; región de mensaje única y siempre presente; marcas; solo lectura enfocable, legible y dentro de `FormData`, nunca `disabled` |
| #112 | `GTabs appearance="segmented"` (pista + segmento elevado) es **navegación**; el segmentado de radios es una **respuesta** y no debe confundirse ni en aspecto ni en semántica |
| `icons.md`, #85 a #87 | Iconos solo Lucide |

## Precedentes directos

- `packages/vue/src/components/GCheckboxGroup/` y `GCheckbox`: `fieldset`/`legend`, `useFormField`, mensaje con icono, marcas, prop `field`, `layout` `default` `card` `chip`, `readonly` con `aria-readonly` y bloqueo del cambio.
- `GSelect`: `options` `{ value, label, … }`, `aria-required` en el control.
- `design/lab/form/r02/index.html`: el motor de fila (`GFormRow`) y un primer segmentado de wireframe (con `text-overflow: ellipsis`, que esta ronda **retira**: las etiquetas no se recortan, #176).

## Lo que decide esta ronda (estructura)

Anatomía por apariencia y qué comparten; qué raíz usa cada una; etiqueta, ayuda, mensaje y marca; encaje en `GFormRow`; teclado nativo; foco visible; sin selección; `disabled` por opción y del grupo; `readonly` (los radios nativos no lo tienen); `required` y error (dónde va `aria-invalid`); descripción e icono por opción; solo icono; ajuste en estrecho; estados; `forced-colors`; movimiento.

## Lo que NO es esta ronda

- No es `GNumberField` (otra pieza de la Fase 2) ni las partes nuevas de `GInputGroup`.
- No es `GCardGroup` (#124 sigue diferido) ni cambia `GCard`.
- No migra los radios crudos de `GWidgetGallery` (filtro de categorías, fuera de un formulario).
- No escribe contrato, CSS ni `.vue`.
