# Entrega de coco · Sistema de formularios, revisión r02 (distribución por filas y campos fusionados)

**Base:** `r02/` (kiwi, prototipo aprobado por el usuario, #171), `design/contracts/form.md` reescrito (§4, §12, §13, C12–C14, migración), DECISIONS #171–#184, `tokens.md` §21.
**Archivos nuevos:** `GFormLayout/GFormLayout.css`, `GFormRow/GFormRow.css`, `GInputGroup/GInputGroup.css`.
**Cambiados:** `GInput.css`, `GTextarea.css`, `GSelect.css`, `GDatePicker.css` (tres pistas, `__support`, `output`, solo lectura L8), `GFieldGroup.css` (partes = `GFormRow` compuesta), `GCheckbox.css` y `GSwitch.css` (sin reglas de fila: van en su propia fila), `GFormActions.css` (apilado más bajo), `GBtn.css` (área táctil en RTL), `styles/defaults.css` (sin `--g-form-max-*`), `GFormGrid.css` (retirado; puente temporal, ver «Para bruno»).
**Banco:** `estilo-banco.html` (mismos formularios que el prototipo r02; `?w=`, `?state=1`, `?long=1`, `?density=`, `?dark=1`, `?rtl=1`, `?theme=`, `?test=1`). El script emula el reparto de `GFormRow` (form.md §4, normativo) escribiendo `--_form-row-*` y `data-lines`/`data-line`. **Verificación:** `node design/lab/form/estilo-verificar.mjs`.

## Carácter
- **Sin huecos, un solo borde.** `GFormLayout` es una pila con el aire de una fila (`--g-form-gap`); cada hijo llena el ancho. `GFormRow` reparte cada línea entera por pesos; las separaciones son pistas propias (sin `gap` de rejilla).
- **Cajas en una línea.** Tres pistas por línea (etiqueta · caja · pie) tomadas por *subgrid*; etiqueta apoyada abajo (`align-self: end`), partida y nunca recortada. Entre líneas, la misma separación que entre filas.
- **Dos en uno.** `GInputGroup`: una caja, partes sin borde propio, línea fina (`border-strong`, decorativa; `border-control` con `prefers-contrast: more`) solo entre dos partes que son controles; los textos («/», «mmHg», «años») separan solos.

## Decisiones
1. **`GFormRow`.** `@property --g-form-min` (`<number>`, sin herencia, 0) y `@property --_form-row-gap` (`<length>`, sin herencia) = `--g-form-column-gap` × densidad; `--_form-row-line-gap` = `--g-form-gap` × densidad. Valores neutros «una por línea»: `--_form-row-columns: minmax(0, 1fr)`, `--_form-row-rows: none` en la raíz; `--_form-row-column: 1 / -1`, `--_form-row-line: auto / span 3` **declarados en cada hijo** (no en la fila: una fila anidada no hereda la colocación de un antepasado). Sin `data-lines` (SSR, antes de medir), margen de línea entre hijos. Registro verificado también dentro de `@layer` en `dist` (tres motores: `16px`, `--g-form-min` no baja a las partes).
2. **Tres pistas en los campos (C12).** `.g-form-row > .g-<campo>`: `display: grid; grid-template-rows: subgrid; inline-size: auto` (la fila manda en el ancho); etiqueta fila 1 abajo, caja fila 2 (`__row`, `__control`, `__field`/`__fields`, `__box`), `__support` fila 3. El `<input hidden>`, la lista de `GSelect` y el panel de `GDatePicker` (popovers) no generan celda. `GInput` deja de ser contenedor de consultas dentro de la fila (la contención impide el subgrid).
3. **`__support`** sin margen propio: dentro siguen `__messages`/`__hint` y `__message:not(:empty)` con su `space-1`; vacío no ocupa.
4. **`output` (C14).** Al final de la caja, texto pleno, cifras tabulares, separado del valor por una línea fina (`border-strong`) y `gap`; vacío sin línea ni hueco (margen negativo del `gap`), sin `display: none` (la región viva existe siempre).
5. **`GInputGroup`.** Mismas alturas, densidad, variantes y estados que `GInput`. Selector nativo con `appearance: none` y `chevron-down` (muted) absoluto; parte `chars` = `--_input-group-chars × 1ch` + relleno (mínimo el objetivo). **Anillo por parte** hacia dentro (`outline-offset` = −grosor del foco, `z-index: 1`); la caja no se ilumina. **Parte inválida:** subrayado `danger-text` (borde + foco de grosor) bajo su valor, separado del borde doble de la caja; en `forced-colors`, `CanvasText`. Advertencia: discontinuo doble (las partes de los extremos se meten el grosor extra). Solo lectura: relleno L8, caja y líneas discontinuas, sin flecha. Objetivo de cada parte control ≥ 24px (44 con puntero grueso).
6. **L8: solo lectura en oscuro → `--g-color-neutral-soft`** (rol existente; sin token nuevo) en `GInput`, `GTextarea`, `GSelect`, `GDatePicker` y `GInputGroup`. En claro un paso por debajo de la superficie (#F0F0F0); en oscuro un paso **por encima** (#242424 sobre #1C1C1C), así que ya no es un pozo. Marcador de posición en solo lectura → `text-muted` (el `subtle` quedaba a 4.45:1 sobre el relleno). Casilla e interruptor conservan `surface-sunken` (su relleno es el propio control de 20px, no una caja).
7. **Pie apilado** (< `space × 104`): la primaria (`solid`) sube a su línea a ancho completo (`order: -1`); las demás comparten la línea de debajo si caben (`flex: 1 1 auto`) y si no, una por línea a ancho completo. 177 → **133px** a 320 con tres botones y estado (32 % de 420); 2.4.11 y 44px intactos. Tab: las demás en orden del DOM y la primaria al final (misma excepción acotada de #155).
8. **`GBtn` en RTL:** el área táctil `::after` usaba `inset-inline-start: 50%` con `translate` físico: en RTL quedaba un ancho entero a la izquierda y desbordaba el contenedor (27–200px de desborde de página en el banco). Ahora `left: 50%` (centrar es simétrico).
9. **`GFieldGroup`:** las partes son la `GFormRow` compuesta; `.g-field-group > .g-field-group__parts` pone `--_form-row-gap` y `--_form-row-line-gap` a la mitad (#169). Retirados `g-form-part-*` y el flex de la Fase 1.

## Verificación (`estilo-verificar.mjs`, Playwright 1.63)
| Motor | Resultado | Qué |
| --- | --- | --- |
| Chromium | **604/604** | §12 completa: contenedor a 1280/960/720/480/360/320 y ventana a esos anchos con contenedor libre × cuatro estados (limpio; ayuda + error + advertencia + válido; etiquetas largas; ambos), en LTR y RTL; densidades `comfortable` y `compact`; `pointer: coarse` compacto; «Tema de prueba» (space 5, borde 2px); Spotify oscuro; líneas esperadas; pie fijo; contraste; táctil; `forced-colors`; `prefers-contrast` |
| Firefox | **122/122** | §12 (LTR y RTL), líneas esperadas, pie fijo 1280/320 |
| WebKit | **122/122** | ídem |

En cada caso: cada hijo de cada `GFormLayout` y cada línea de cada `GFormRow` (incluida la de `GFieldGroup`) termina en el borde (±1px); cajas de una línea con el mismo `top` (±1px); sin solapes, sin caja más ancha que su celda, sin desborde de marco ni de página (también a 320); orden visual = DOM; etiquetas sin recorte ni elipsis; consola limpia. Líneas: signos vitales 1/1/2/3 a 1280/960/720/360; a 360 Calle sola y Ext. · Int. juntos. Prueba negativa: quitando el *subgrid* la comprobación de cajas falla (9 líneas desalineadas).

**Contraste** (Chromium; defecto · Spotify, marca pálida · lustre; claro / oscuro; fondo compuesto real):
| Medida | Mínimo |
| --- | --- |
| Etiqueta · `output` · valores de solo lectura (GInput, GSelect, fecha, `output` de fecha, GTextarea, GInputGroup, selector como texto) | 13.87 |
| «(opcional)», ayuda, sufijo, «mmHg», `chevron-down` | 7.38 |
| Solo lectura: sufijo, marcador, «mmHg» sobre el relleno | 6.49 |
| Mensajes y bordes de error / advertencia / válido; marca de la parte inválida; borde de `GInputGroup` | 4.52 / 4.54 / 4.60 · 4.52 |
| Anillo de foco por parte | 4.58 |
| Borde de caja en reposo · solo lectura por fuera | 3.43 |
| Borde discontinuo de solo lectura sobre su relleno | **3.02** (justo; `neutral-soft` es más oscuro que `sunken`) |
| L8 (luminancia relleno / superficie, oscuro) | 0.0176 / 0.0116 (más claro: no es un pozo) |

**Táctil** (compacto, 360, `pointer: coarse`): input, selector, fecha y caja del fusionado 44px; partes ≥ 48px de ancho; botones 44. **forced-colors:** anillo en la parte (no en la caja), solo lectura y advertencia discontinuos, subrayado de la parte inválida visible, línea entre partes. **prefers-contrast: more:** línea entre partes = borde de control. Build y compuertas OK; `npx vitest run` 39 archivos, 1262 pruebas OK (`levels.test.js` incluido: `--g-form-min` solo aparece en `@property`, no hizo falta excepción).

## Para bruno
1. **Registrar** `GFormLayout.css`, `GFormRow.css` y `GInputGroup.css` en `components.css` después de los campos; luego **borrar `GFormGrid.css`** y su `@import` (hoy es un puente que importa las tres para que `dist` las lleve). Compuerta sugerida: `grep -q "g-input-group__part" dist/grana.css`.
2. **CLI:** `packages/cli/test/derive.test.js` falla hasta ejecutar `scripts/sync-defaults.mjs` (retirados `--g-form-max-xs/sm`). Quitar también esos tokens de `GFormGrid.meta.json`/`GFieldGroup.meta.json`.
3. **Marcado que espera el CSS:** raíz con tres hijos en flujo; `__support` siempre presente con `__messages`/`__hint` y `__message` dentro (en `GTextarea`, también `__count-live`); `<output class="g-input__output">` tras el sufijo y `g-datepicker__output` tras `__value` dentro del botón; `__part`, `__part--input|select|text|chars`, `is-invalid` en la parte; `--_input-group-chars` (número entero) en línea en la parte con `chars`; `GInputGroupText` con `label` = parte `aria-hidden` seguida de su `__text-label` hermano.
4. **`GFormRow`:** leer `--_form-row-gap` y `--g-form-min` del estilo calculado (números en px/sin unidad en los tres motores); filas como `auto auto auto var(--_form-row-line-gap) …` y `--_form-row-line: n / span 3` (n = línea × 4 + 1). La función del banco (`plan`) es un port del prototipo con el criterio de §4 (menos líneas → más holgada → más hijos arriba).
5. El pie apilado identifica la primaria por `g-btn--variant-solid` (ya hay aviso si hay más de una).
6. Pulsar un `GInputGroupText` enfoca la parte vecina; pulsar `output`, prefijo o sufijo enfoca el `<input>` (cursor de texto en CSS).

## Para lima
1. **Pie apilado (#155):** las secundarias ya no van cada una a ancho completo: comparten línea bajo la primaria si caben (133px en vez de 177 a 320). Si se quiere conservar «todas a ancho completo», es una línea de CSS; anotar en form.md §6.
2. **L8 resuelto sin token:** solo lectura = `--g-color-neutral-soft` (no `surface-sunken`); actualizar §9, C7 y #165. Su borde discontinuo queda a 3.02–3.05:1 sobre el relleno en claro: si `neutral-soft` de un tema baja más, fallaría 1.4.11; conviene que el CLI valide `border-control` ≥ 3:1 también sobre `neutral-soft`.
3. `1ch` en `GInputGroup` (conversión de `--_input-group-chars` a longitud) y `left: 50%` en `GBtn` son literales de unidad, no de tema; anotarlos si la regla de literales lo pide.
4. `GDatePicker` en modo `split` dentro de una fila: sus etiquetas Inicio/Fin están dentro de la pista de la caja y bajarían su caja respecto de los vecinos; recomendar que vaya en su propia fila.

## No verificado
Componentes reales (no existen `GFormLayout`/`GFormRow`/`GInputGroup`.vue: todo sobre el marcado del contrato), lector de pantalla, zoom 200/400 %, `forced-colors` real de Windows, autocompletado real del navegador sobre el selector nativo, menú nativo del `<select>` en oscuro.

---

# Historial · Fase 1 (superada en parte por r02)

# Entrega de coco · Sistema de formularios, Fase 1 (CSS y tokens `--g-form-*`)

**Archivos nuevos:** `GForm/GForm.css`, `GFormSection/GFormSection.css`, `GFormGrid/GFormGrid.css` (rejilla + clases `g-form-w-*`, `g-form-break`, `g-form-row`), `GFieldGroup/GFieldGroup.css`, `GFormActions/GFormActions.css`, `GErrorSummary/GErrorSummary.css` (en `packages/vue/src/components/`).
**Cambiados:** `GInput.css`, `GTextarea.css`, `GSelect.css`, `GCheckbox.css`, `GCheckboxGroup.css`, `GSwitch.css`, `GDatePicker.css` (C3, C4, C5, C6, C7, C10/C12, C13) y `styles/defaults.css` (cinco tokens).
**Contratos:** `design/contracts/form.md` (§1–§12), secciones «Cambio por el sistema de formularios» de input, textarea, select, checkbox, switch y datepicker; `tokens.md` §21; DECISIONS #153–#168.
**Banco:** `design/lab/form/estilo-banco.html` (marcado exacto del contrato; 13 bloques; `?dark=1`, `?rtl=1`, `?theme=<generado>`, `?test=1`, `?css=1` apaga el respaldo JS del pie). El script hace lo que hará bruno: tramo 12/6/1 por `ResizeObserver` (space × 176 / × 104), apilado del pie, `--g-form-actions-size` + `g-form--sticky-actions`, foco al resumen, respaldo `focusin` del pie y diálogos.

## Carácter
- **Sin cajas.** El formulario no dibuja nada; una sección es aire (`--g-form-section-gap`, 40px ≈ 2× la fila) + título (`body` con peso y tracking de `title-sm`, como el título de `GCard`) + descripción muted. Ningún divisor salvo la línea del pie fijo.
- **Ancho por contenido.** `g-form-w-*` reparte 12/6/1; en una columna lo compacto conserva su máximo (120 / 192px con space 4).
- **Proximidad.** Las partes de un `GFieldGroup` van a la mitad de la separación de la rejilla y su etiqueta baja un paso (peso normal, muted) bajo el `<legend>`: «Teléfono → País · Número · Extensión».
- **El resumen es la única caja**, porque interrumpe: borde fino de error con marca gruesa al inicio (misma forma que el estado de error de `GCard`/`GToast`), sin relleno de color.

## Tokens (defaults.css, no son de color: no se repiten en el oscuro)
| Token | Valor | Nota |
| --- | --- | --- |
| `--g-form-gap` | `space × 5` (20px) | × densidad: 20 / 17.5 / 15 |
| `--g-form-column-gap` | `space-4` (16px) | × densidad |
| `--g-form-section-gap` | `space × 10` (40px) | × densidad; 2× la fila |
| `--g-form-max-xs` | `space × 30` (120px) | «36.5», «100 %», núm. interior |
| `--g-form-max-sm` | `space × 48` (192px) | fecha, CP, RFC, prefijo |
Valores de kiwi (r01 §2.4) confirmados en el banco.

## Decisiones
1. **Mensajes (C4/C5/C6).** Un hueco `__message` (caption, peso de acción); error `danger-text`, advertencia `warning-text`, válido `success-text` con peso normal (premiar sin gritar). Icono inline (`circle-alert` · `triangle-alert` · `circle-check`) y `__message-type` con el patrón de texto oculto. Margen solo con `:not(:empty)`.
2. **Borde de estado, no solo color.** Error: continuo doble (como hoy). **Advertencia: discontinuo doble** (precedente `GToast`/`GCard`), con el relleno descontado del grosor extra para que el texto no se mueva. Válido: continuo sencillo `success-text` (lo separan del error el grosor, el icono y el prefijo). En casilla e interruptor la advertencia es discontinua de un trazo (un discontinuo doble en 20px se lee como puntos). El hover no pisa estos bordes.
3. **Solo lectura (C7).** Los seis: fondo `surface-sunken`, borde **discontinuo** `border-control` (con `soft`, la línea inferior), texto `--g-color-text`; valor seleccionable en `GSelect`/`GDatePicker`. Casilla e interruptor marcados ya **no** se rellenan en `text-muted`: hundidos y discontinuos con la marca/pulgar en `--g-color-text` (antes casi igual que deshabilitado). Tarjeta y chip igual. Deshabilitado no cambia.
4. **«(opcional)».** `__optional` muted, peso normal y **sin margen**: el espacio lo pone el texto, porque el nombre accesible necesita un espacio («Segundo apellido (opcional)»).
5. **Subgrid en `g-form-row`.** `GFormGrid.css` define en la fila cuatro pistas con nombre (`[label-start] … [message-end]`) y coloca cada hijo en las cuatro; el CSS de cada campo hace su raíz `grid` + `subgrid` y pone sus partes por nombre (`grid-row: label|box|hint|message`), con la etiqueta apoyada abajo. Casilla e interruptor usan solo `box` y `message`. **`GInput` deja de ser contenedor de consultas dentro de la fila** (`container-type: normal`): la contención de maquetación impide ser subgrid; el apilado del botón `action` por consulta no aplica ahí.
6. **Fila unida sin salto de línea.** Con subgrid, un hijo en una segunda línea perdería las pistas con nombre: la fila siempre es una (máx. 3 hijos, contrato). `g-form-part-xs|sm` dentro de la fila fija su columna con `:has(:nth-child(n))` (`--_c1..3`).
7. **Rejilla.** `--_form-cols` y `--_form-span` (nombres propios para no chocar con `--_cols`/`--_span` de `GWidgetGrid`/`GCalendar`); sin tramo medido, una columna; `stack` fuerza una. Ninguna regla toca `.g-input` ni otros campos.
8. **Partes de `GFieldGroup`.** Base de una parte compacta `min(máximo, 60 % | 40 %)` y mínimo de la que crece `min(--g-form-max-xs, 35 %)`: así País | Número comparten fila a 320px (254px de contenido) y la extensión pasa debajo; en un diálogo de 504px el número tiene sitio (la extensión baja). Las proporciones son relaciones, no medidas de tema.
9. **Pie.** `inline-size: 100%` (dentro del pie flexible de `GDialog` medía su contenido y se apilaba siempre). Fijo: `z-index: 2`, fondo `--g-color-surface`, línea `--g-color-border` (con `prefers-contrast: more`, `border-control`), y dentro de `GForm` medio aire de sección encima (la línea basta). Estado muted; vacío no deja hueco al apilar.
10. **Foco bajo el pie (2.4.11).** `GForm.css`: `.g-form--sticky-actions :is(input…):not(.g-form-actions--sticky *) { scroll-margin-block-end: calc(--g-form-actions-size + space-4) }`.
11. **`g-form__required-hint`.** La frase «Los campos con * …» se acerca al primer bloque (margen negativo = fila − sección).
12. **Resumen.** Enlaces subrayados en `danger-text`, objetivo ≥ 24px; anillo con `:focus` (no `:focus-visible`), porque recibe el foco por script tras un clic; `scroll-margin` para verse entero.
13. **Transición `__error`.** Los seis campos estilan `__message` **y** el nombre antiguo `__error`/`__error-icon` en el mismo selector, para no cambiar el aspecto mientras bruno renombra. Coco lo retira en la auditoría.

## Verificación (Playwright: Chromium, Firefox, WebKit)
Temas: defecto claro/oscuro, **Spotify** (marca pálida) claro/oscuro, **lustre** claro/oscuro y «Tema de prueba» (Georgia, borde 2px, space 5). Contraste resuelto sobre el fondo real compuesto (canvas), 31 medidas por tema.
| Medida | Defecto claro / oscuro | Mínimo en todos |
| --- | --- | --- |
| «(opcional)», ayuda, descripción, etiqueta de parte, estado del pie | 7.46 / 9.29 | 7.38 |
| Mensaje error / advertencia / válido | 5.49 / 5.73 / 5.35 · 4.89 / 4.91 / 4.98 | 4.89 |
| Enlace del resumen | 5.49 / 4.52 | 4.52 |
| Solo lectura: texto / valor de select y fecha / marca de casilla | 16.1 / 17 | 16.1 |
| Solo lectura: borde sobre `sunken` / sobre fondo | 3.19 / 3.45 · 4.82 / 4.66 | 3.19 |
| Bordes de error / advertencia / válido | 5.49 / 5.73 / 5.35 | 4.66 |
| Prefijo/sufijo (muted sobre la caja; en solo lectura sobre `sunken`) | 7.46 (6.9) | 6.87 |
- **Tramos:** 926px → wide 12, 566 → medium 6, 326 → narrow 1, 666 → medium; diálogo md (504) medium; drawer (506, `stack`) narrow. A 320px todos narrow.
- **Compactos en una columna:** `xs` 120px, `sm` 192px en las tres densidades. Densidad: caja 36 / 32 / 27, fila 20 / 17.5 / 15px; táctil (`pointer: coarse`) 44px en `compact`.
- **Subgrid:** cajas a la misma altura en las 5 filas unidas (etiqueta de dos líneas, ayuda ausente, mensaje en uno solo, tres hijos), en los tres motores, a 1280 y 320.
- **Pie fijo:** Tab por 10 + 30 controles a 1280 y 320. Con el respaldo JS: 0 tapados en los tres motores (margen mínimo 16px). **Solo CSS** (`?css=1`): Chromium 0 tapados salvo el `<textarea>` final (lleva a la vista el cursor, no la caja); Firefox 0 a 1280 y 2–3 a 320; **WebKit no aplica `scroll-margin` al enfocar** (4–17 tapados). El respaldo de bruno es necesario.
- **320px:** sin desborde de página ni de cajas en los tres motores. País | Número en una fila; extensión debajo.
- **Playground antes/después** (dist, Chromium, tema por defecto): `GInput`, `GTextarea`, `GSelect` idénticos píxel a píxel; `GCheckbox`, `GSwitch`, `GDatePicker` solo cambian en su ejemplo de solo lectura (C7, pedido por el contrato).
- RTL (pie primaria a la izquierda, partes espejadas), `forced-colors` (discontinuos visibles; error doble, advertencia discontinua; solo lectura de casilla e interruptor con `Canvas/CanvasText`), oscuro y movimiento reducido (sin animaciones nuevas) revisados. Consola limpia en los tres motores.
- `npx vitest run`: 38 archivos, 1190 pruebas OK (incluido `levels.test.js`). `npm run build` y las tres compuertas OK.

## Hallazgos para bruno
1. **Registro:** añadir a `components.css` `GForm.css`, `GFormSection.css`, `GFormGrid.css`, `GFieldGroup.css`, `GFormActions.css`, `GErrorSummary.css` (después de los campos: `GFormGrid.css` define las pistas que leen los campos; el orden no cambia la cascada, pero así queda legible) + compuerta, p. ej. `grep -q "g-form-grid--wide" dist/grana.css`. Hoy `dist/grana.css` no trae ninguna.
2. **Región de mensaje vacía sin nodos de texto** (el CSS usa `:not(:empty)`; un comentario de Vue vale, un espacio no). Cuando renombres `__error` → `__message`, avisa: coco quita los alias.
3. **«(opcional)» con un espacio de texto delante** del `<span class="g-*__optional">` (como en el contrato), sin margen en CSS.
4. **`__prefix-label`/`__suffix-label`:** el banco los pone dentro de `g-input__control`, justo después del visible (`aria-hidden`); cualquier sitio vale (texto oculto absoluto).
5. **Pie fijo:** el respaldo JS en `focusin` es imprescindible (WebKit; `<textarea>` en Chromium). Escribe `--g-form-actions-size` y las clases **fuera** de la devolución del `ResizeObserver` (rAF) o solo si cambian: en WebKit da «ResizeObserver loop completed».
6. `data-stacked` y `g-form-actions--stacked`: el CSS acepta cualquiera de los dos. Dentro del pie de `GDialog` el pie mide el ancho de la fila del pie (ya ocupa el 100%).
7. `GFormGrid` con `stack`: emite también `g-form-grid--narrow` (el CSS fuerza una columna con cualquiera de los dos).
8. `GFieldGroup` deshabilitado: el CSS acepta `is-disabled` o `:disabled` del `fieldset`; las partes necesitan su `is-disabled` (por contexto) para su aspecto.
9. `GInput` dentro de `g-form-row` no es contenedor de consultas: un `action` en un campo de fila no se apila.

## Hallazgos para lima
1. **Separación de las partes de `GFieldGroup`:** el contrato dice `--g-form-gap` «entre partes»; el CSS usa la **mitad** de `--g-form-gap`/`--g-form-column-gap` (proximidad: una pregunta). Si se quiere exacta, una línea.
2. **Clases no listadas que el CSS lee:** `g-checkbox-group__required` (asterisco en el `<legend>` con `marks="required"`), `is-disabled` en `GFieldGroup` (además de `:disabled`), `g-form-section--optional` (listada, sin estilo propio: la insignia basta).
3. **Pie fijo apilado a 320px:** tres botones a ancho completo ocupan 177px (42 % de un contenedor de 420). Funciona sin tapar el foco, pero en drawers bajos puede pesar; valorar en la auditoría (p. ej. terciaria en línea).
4. **`g-form-row`** no salta de línea (subgrid): con tres hijos en 320px cada uno mide ~80px. El aviso de más de 3 hijos está bien; quizá documentar «hasta 2 en móvil».
5. Advertencia de casilla e interruptor: discontinuo de un trazo (no doble). Documentar si se quiere en los contratos de campo.

## No verificado
Lector de pantalla (prefijo oculto, «(opcional)», unidad), `forced-colors` real de Windows (emulado en Chromium), zoom 200 %, teclado virtual, el componente real (los `.vue` no existen aún: todo sobre el marcado del contrato), autosize de `GTextarea` con advertencia (el borde doble resta 2px del alto medido).

## Nota de bruno para coco (entrega de los `.vue`)
- **Renombre hecho:** los seis campos (`GInput`, `GTextarea`, `GSelect`, `GCheckbox`/`GCheckboxGroup`, `GSwitch`, `GDatePicker`) ya pintan solo `g-*__message` / `g-*__message-icon` / `g-*__message-type` (`id` `ID-message`). **El alias `__error`/`__error-icon` del CSS ya puede quitarse** (decisión 13 de arriba).
- La región `__message` vacía solo contiene el comentario de Vue (`<!--v-if-->`), sin nodos de texto; «(opcional)» lleva un espacio de texto delante; `__prefix-label`/`__suffix-label` van dentro de `__control` justo tras el texto visible.
- `GFormGrid` con `stack` emite `g-form-grid--narrow` + `g-form-grid--stack`; `GFormActions` emite `data-stacked` y `g-form-actions--stacked`; `GFieldGroup` deshabilitado lleva `is-disabled` + `disabled` y sus partes `is-disabled` por contexto.
- `GCheckboxGroup` gana además `is-disabled`, `is-invalid`, `is-warning`, `is-valid` en el `fieldset` (C5).
