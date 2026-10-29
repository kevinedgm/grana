# Campo táctil · auditoría de coco (pieza 1 de configuración global)

**Autor:** coco · **Fecha:** 2026-10-29 · **Contrato:** DECISIONS.md #970 a #972, `docs/contract/api.md` «Texto editable con puntero grueso: 16px», `tokens.md` §7 y las notas «Texto con puntero grueso» de `design/contracts/{input,textarea,select,datepicker,combobox,number-field,time-field,form,booking-bar,filter-bar,table,calendar,widget-gallery,speech}.md`. **Contexto:** `design/lab/config-global/inventario.md` §3.2.
**Banco:** `banco.html` (componentes reales del `dist/` UMD; el CSS se sirve aparte en `/__grana.css`). **Verificación:** `node design/lab/campo-tactil/verificar.mjs --before=<grana.css de HEAD> --after=<grana.css con la pieza>`, puerto 4209, **2007/2007 en Chromium**. **Solo Chromium:** es el único motor instalado en `/opt/pw-browsers`; WebKit (el que de verdad amplía, iOS) y Firefox no se midieron aquí.
La rúbrica de movimiento no aplica: la pieza no anima nada ni cambia de forma.

## 1. Auditoría previa (`docs/documentacion/auditoria-visual.md`)

| Punto | Estado antes de tocar | Qué implica |
| --- | --- | --- |
| Estructura y jerarquía | Etiqueta `body-sm` 14 con peso de acción; valor `body-sm` 14 en `md`; ayuda y mensaje `caption` 12 | Con el valor a 16, la etiqueta queda por debajo del valor en tamaño: la jerarquía la siguen dando el peso (acción frente a normal) y la posición. Aceptado por #971 («subir también etiqueta y mensajes» rechazado) |
| Controles | En táctil la caja ya mide `max(44px, …)` (§7) en todos los de una línea; el texto no cambiaba | 16 con interlineado 20 cabe en 44 sin tocar la altura |
| Consistencia con tokens | Ninguna hoja tenía un alias de rol: las clases de `size` escribían `--_fs`/`--_lh` directamente | Hace falta el alias base (`--_fs-role`/`--_lh-role`) para que la consulta derive `--_fs` sin leerse a sí misma |
| Lo que copia el texto | Fantasma de `GCombobox`, espejo y medidor de `GNumberField`/`GTimeField`, cifras que ruedan: todos leen `--_fs`/`--_lh` heredados de `GInput` | Si sube `--_fs` en la raíz de `GInput`, suben solos; hay que medir que sigan alineados |
| Lo que no debe subir | Las opciones de `GSelect` leen `--_fs` de la raíz (la lista vive dentro) | Se fijan al rol en la lista |
| Controles sueltos | `GTable` cards, `GCalendar`, `GFilterBar` heredan la letra (`font: inherit`); `GWidgetGallery` y `GTranscript` la fijan a `body-sm` | Regla por selector, con el rol que tienen hoy; `GFilterBar` en hoja hereda `body` de `GDialog` |
| Estados (carga, vacío, error) | El indicador de carga mide `--_fs` | Sube con la línea del valor (#971) |
| Reutilización | Nada que crear: ni token, ni clase, ni prop | Solo CSS |

## 2. Lo hecho

Patrón de #970 en las hojas con escala propia (`GInput`, `GTextarea`, `GSelect`, `GDatePicker`, `GInputGroup`, `GPartyField`): la raíz declara `--_fs-role`/`--_lh-role` (las clases de `size` escriben solo esos) y `--_fs: var(--_fs-role)`, `--_lh: var(--_lh-role)`; dentro de `@media (pointer: coarse)`, `--_fs: max(16px, var(--_fs-role))` y `--_lh: max(var(--_lh-role), var(--g-text-body-sm-line))`. Todo lo que ya leía `--_fs` sigue solo (marcador, prefijo y sufijo, `output`, carga, flecha y limpiar de `GSelect`; `GNumberField`, `GTimeField` y `GCombobox` por el `GInput` que componen). `GSelect __list` vuelve a `--_fs: var(--_fs-role)` para que opciones, marca e icono de «Agregar nuevo…» se queden en el rol.

Sin alias (el control tiene un rol fijo o heredado): `GTranscript __field`, `GFilterBar __rule` y `__value input` (popover `body-sm`, hoja `body`), `GTable __bar-cards select`, `GCalendar __resource-select select`, `GWidgetGallery __search input` y `__row select`: `font-size: max(16px, var(--g-text-…-size))` en la consulta.

**Desviación (necesaria para el criterio 4):** el `<select>` de orden de `GTable` cards no tiene alto propio y Chromium lo mide por las métricas de la fuente, no por el interlineado: con 16 crecía de 30 a 32px. Se fija en la consulta `block-size: calc(var(--g-text-body-sm-line) + var(--g-space-1) * 2 + var(--g-border-width) * 2)` (el alto de antes, con tokens).

Literales: `16px` aparece 12 veces, todas en `font-size` o `--_fs`, como piso de `max()` y dentro de `@media (pointer: coarse)` (C8 propio y `src/styles/touchFieldSize.test.js` de bruno). Las cabeceras de las hojas lo declaran; los comentarios escriben «16 px» para no confundir un grep.

## 3. Medidas (Chromium 153, `hasTouch` + `isMobile`; precondición `matchMedia('(pointer: coarse)')` = true, y false en escritorio)

| Criterio (#972) | Resultado |
| --- | --- |
| 1 · ≥ 16 en táctil | Los 9 componentes de la matriz × 5 `size` × `default`/`compact` y los 7 sueltos: `xs` 12→16, `sm`/`md` 14→16, `lg`/`xl` 16→16; cada uno igual a `max(16, rol)`; interlineado `max(rol, 20)` (`xs` 16→20, el resto sin cambio). `GFilterBar`: popover 14→16, hoja 16 (rol `body`) |
| 2 · escritorio Δ0 | Todo lo medido (tamaño, interlineado, altos, anchos de icono) idéntico al `grana.css` de HEAD, también `GFilterBar` en popover y en hoja |
| 3 · tema de `fontSize` 18 y 20 | Siempre `max(16, rol)`. **Hallazgo para lima:** con `fontSize` 18 el CLI da `body-sm` = **15,75px**, así que `md` en táctil es 16 (el piso), no el rol; el criterio 3 de #972 supone `body-sm` > 16. Manda el rol en `lg`/`xl` (18) y, con `fontSize` 20, también en `md` (17,5). `xs` (13,5 y 15) sube a 16 en los dos |
| 4 · alto táctil Δ0 | Δ0 en todas las cajas de una línea (y `multiple`, `readonly` de `GInputGroup`, sueltos, editor de `GFilterBar`). Única excepción, la aceptada: `GTextarea xs` con `rows` 3, 54→62px (+4 por fila extra respecto de una; con una o dos filas, Δ0) |
| 5 · acompañantes | Marcador, prefijo, sufijo, `output`, valor de `GSelect`/`GDatePicker`/`GPartyField`, unidad, espejo y −/+ de `GNumberField`, hora dicha, a. m./p. m. y espejo de `GTimeField`, ficha y frase de `GCombobox`, parte de texto, `<select>` y `<input readonly>` de `GInputGroup`: igual al control. Iconos (carga, flecha) siguen al texto. Etiqueta, ayuda, mensaje, contador, opciones y lista de `GSelect`, panel de `GCombobox`, etiqueta de tamaño de `GWidgetGallery` y título del editor de `GFilterBar`: sin cambio |
| 6 · alineación | Fantasma de `GCombobox` y espejos de `GNumberField`/`GTimeField` frente al final real del texto (clon con la tipografía calculada del `<input>`): Δ máx. **0,00px** en 30 medidas |
| 7 · 320px | Táctil y escritorio, `default` y `compact`, filas de dos campos y cada campo suelto (10 grupos): sin desplazamiento horizontal, ninguna caja desborda, la hora dicha todo o nada (cada pieza entera en la primera línea o fuera; la palabra nunca por debajo de 2 × su tamaño) |
| 8 · grep | 12 declaraciones con `16px`, todas válidas |

**Peso:** `dist/grana.css` medido con `vite build --outDir` fuera de `dist/` (no se tocó `dist/`): **+445 B gzip** (104 830 → 105 275; +448 con `gzip -9`), dentro del tope de 512 B. JS sin cambios (solo CSS).

Captura de comprobación (320px, táctil, `default`): la fila conserva la jerarquía (etiqueta de 14 con peso de acción sobre un valor de 16), el «p.m.» y la hora dicha caben y las cajas siguen en 44px.

## 4. Auditoría posterior

| Punto | Estado | Evidencia |
| --- | --- | --- |
| Jerarquía | Cumple | Etiqueta en su rol y peso; valor 16; ayuda y mensaje en `caption` (C5) |
| Estados de interacción | Cumple | Foco, error, advertencia, solo lectura y deshabilitado no leen el tamaño; el relleno de `GTextarea` descuenta el interlineado nuevo |
| Carga, vacío y error | Cumple | El indicador de carga sube con la línea; el mensaje de error se queda (C5) |
| Alineación | Cumple | Fantasma y espejos Δ0 (C6) |
| Espaciado | Cumple | Altos Δ0 (C4) salvo la excepción aceptada; rellenos sin cambio |
| Contraste | Cumple, sin cambio | No se toca ningún color; un texto mayor no baja el contraste |
| Consistencia | Cumple | Un solo patrón de alias en las seis hojas con escala; los sueltos con su rol de hoy |
| Accesibilidad fuera del tema | Cumple | 44px intacto; texto ≥ 12; foco intacto; `forced-colors` y RTL no leen el tamaño (no medidos aparte en esta pieza) |

## Cumplimientos / Correcciones / Pendientes

**Cumplimientos:** criterios 1, 2, 4, 5, 6, 7 y 8 de #972 medidos en Chromium (2007/2007); peso +445 B gzip ≤ 512; verificadores de literales que leen hojas tocadas (`empty-skeleton/estilo-verificar.mjs`, `table/auditoria-rows-verificar.mjs`, `speech/auditoria-f2-verificar.mjs`) admiten `16px` solo como piso de `max()` en `font-size`/`--_fs` dentro de `@media (pointer: coarse)`; `npx vitest run` 4197/4197.

**Correcciones durante la pieza:** el alto del `<select>` de orden de `GTable` cards (30→32px) se fijó al de antes con tokens.

**Pendientes:**
- **lima:** criterio 3 de #972: con `fontSize` 18 `body-sm` es 15,75px y `md` en táctil queda en 16 (el piso). La regla está bien; el ejemplo del criterio no.
- **Fuera de esta pieza (anotado, no corregido):** los `<select>` de orden de `GTable` cards miden 30px de alto también en táctil, por debajo de 44px (§7). Era así antes y #972 pide Δ0.
- **bruno / mora-docs:** los mínimos publicados a `GFormRow` en táctil crecen con el texto. Las cifras de referencia de `number-field.md`/`estilo.md` («Cantidad» 128px con puntero grueso) y de `time-field/estilo.md` en táctil cambian. No las medí: `GFormRow` no deja el mínimo en el DOM.
- **No verificable aquí:** WebKit y Firefox (no instalados); la ampliación real en iPhone con Safari; el cambio de puntero en caliente.
- **No medido:** la alineación del fantasma y de los espejos en RTL. Leen el mismo alias que el texto, pero aquí solo se midió LTR.
- `GTranscript` se midió con un fixture que lleva su clase real: abrir el editor exige la entrada de voz. `GFilterBar`, `GTable`, `GCalendar` y `GWidgetGallery` son reales.
