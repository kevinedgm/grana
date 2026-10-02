# Auditoría de coco · Sistema de formularios, revisión r02 (paso 5)

**Componentes:** `GForm`, `GFormSection`, `GFormLayout`, `GFormRow` (`formRowPlan.js`, `rowEngine.js`), `GFieldGroup`, `GFormActions`, `GErrorSummary`, `GInputGroup` (+ `GInputGroupInput`, `GInputGroupSelect`, `GInputGroupText`) y los campos con `__support` / `output` (`GInput`, `GTextarea`, `GSelect`, `GDatePicker`), los **reales** (`dist/` reconstruido; bruno 955feaf…1c9f460, fusión e8bba45). Contrato `design/contracts/form.md` r02 (#171–#188); prototipo kiwi `r02/`; CSS de coco 371196a.
**Método:** el playground real (`packages/vue/playground/`, `#sec-form`: corto, mediano con secciones, signos vitales, resumen y pie fijo, dirección, fusionados, preguntas compuestas, modo vista, `marks="required"`, pie fijo en contenedor, `GDialog`) con su banco (contenedor a 1280/960/720/480/360/320, «Ayuda y mensajes», «Etiquetas largas», densidad). Verificación propia: `node design/lab/form/auditoria-verificar.mjs` (Playwright 1.63; `--shots` guarda capturas). Contraste **calculado** sobre el fondo compuesto real (colores computados resueltos por canvas, alfa compuesto sobre los ancestros). Temas: **defecto**, **Spotify** (marca pálida, `radius-md` 20px, generado por el CLI), **«Tema de prueba» del playground** (radios grandes, `shape` píldora, marca azul noche + violeta; claro y oscuro) y **space 5** (Georgia, borde 2px, `space-1` 5px, radios pequeños; el tema de prueba del banco de coco). Además la prueba obligatoria de bruno (`form-distribution.spec.mjs`) y toda la suite de `design/lab/theme-playground`.

## Resultado: **aprobado**. Un defecto de CSS corregido aquí (hallazgo 2); ninguno bloqueante en `.vue`. `status: "candidate"` en los ocho `meta.json`

La queja que tumbó la Fase 1 (huecos a la derecha, cajas desalineadas, etiquetas que empujan) **ya no ocurre** en ningún tema, modo, densidad, dirección ni motor medidos: cada línea de cada fila termina en el mismo borde (±1px), las cajas de una línea comparten `top` (±1px) con etiquetas de una y dos líneas, ayudas de tres líneas y mensajes, y las filas se parten en líneas enteras (sin hueco) cuando no caben. Revisado también **a ojo** en capturas a 1280/720/360, claro y oscuro, con y sin mensajes: un solo borde derecho, la etiqueta apoyada abajo (las de dos líneas crecen hacia arriba, no empujan la caja), mismo aire entre filas que entre líneas de una fila partida y entre secciones el doble; los fusionados se leen como un campo.

### Prueba obligatoria §12 (form.md, #184)

| Prueba | Chromium | Firefox | WebKit |
| --- | --- | --- | --- |
| `form-distribution.spec.mjs` de bruno (LTR, defecto; contenedor y ventana × 6 anchos × 4 estados; líneas esperadas; densidades y `pointer: coarse`; Tab y nombres por parte; sonda de `ResizeObserver`) | 12/12 | 9/9 | 9/9 (6 omitidas por diseño: densidades solo en Chromium) |
| **RTL** (nuevo): contenedor × 6 anchos × 4 estados + ventana 360/320 × 4 | 34/34 | 34/34 | 34/34 |
| Spotify oscuro · «Tema de prueba» claro y oscuro · space 5 en LTR y RTL (mismo barrido) | 170/170 | — | — |
| `design/lab/theme-playground` completa (`GRANA_PW_PORT=4196`) | | 188 pasadas, 7 omitidas | |

Total de `auditoria-verificar.mjs`: **587/587** (Chromium 495, Firefox 46, WebKit 46).

### Contraste (mínimo de cada medida; defecto · Spotify · prueba, claro / oscuro; space 5 claro)

| Medida | Defecto | Spotify | Prueba | Space 5 | Mín. |
| --- | --- | --- | --- | --- | --- |
| Etiqueta · valor del selector de una parte | 17.40 / 15.22 | 17.41 / 15.31 | 17.44 / 15.23 | 15.73 | 15.22 |
| «(opcional)», ayuda, descripción de sección, estado del pie, sufijo, «/», «mmHg», «años», `chevron-down` | 7.46 / 8.59 | 7.38 / 8.62 | 7.47 / 8.60 | 6.99 | 6.99 |
| Asterisco · mensaje y borde de error · marca de la parte inválida · enlace y borde del resumen | 5.49 / 4.52 | 5.49 / 4.52 | 5.49 / 4.53 | 5.29 | 4.52 |
| Mensaje y borde de advertencia (discontinuo doble) | 5.73 / 4.54 | ídem | 5.73 / 4.55 | 5.51 | 4.54 |
| Mensaje y borde de válido | 5.35 / 4.61 | ídem | ídem | 5.15 | 4.61 |
| Insignia «Opcional» de sección | 6.54 / 4.56 | 4.64 / 4.58 | 4.68 / 4.56 | 5.72 | 4.56 |
| Borde de caja en reposo (3:1) | 3.45 / 4.32 | 3.43 / 4.35 | 5.35 / 4.32 | 4.62 | 3.43 |
| Anillo de foco **por parte** (3:1) | 5.69 / 4.58 | 4.61 / 13.18 | 7.10 / 4.65 | 5.77 | 4.58 |
| Título del resumen | 17.40 / 15.22 | 17.41 / 15.31 | 17.44 / 15.23 | 15.73 | 15.22 |
| **Solo lectura** (relleno `neutral-soft`): valor de GInput, GSelect, fecha, `output` de fecha, GTextarea, GInputGroup y selector como texto | 15.27 / 13.87 | 15.30 / 13.91 | 15.28 / 13.88 | 12.53 | 12.53 |
| Solo lectura: sufijo | 6.54 / 7.83 | 6.49 / 7.83 | 6.55 / 7.83 | 5.57 | 5.57 |
| Solo lectura: borde por fuera | 3.45 / 4.32 | 3.43 / 4.35 | 5.35 / 4.32 | 4.62 | 3.43 |
| Solo lectura: borde y línea entre partes (discontinuos) sobre su relleno | 3.03 / 3.93 | 3.02 / 3.95 | 4.69 / 3.93 | 3.68 | **3.02** |
| Línea entre partes en reposo (`border-strong`, **decorativa**) | 1.45 / 1.90 | 1.40 / 1.84 | 1.40 / 1.82 | 1.45 | — |

- **L8 (no es un pozo):** luminancia del relleno de solo lectura / superficie: claro 0.871 / 1.000 (un paso por debajo), oscuro 0.0176 / 0.0116 (un paso **por encima**) en los tres temas. El «fondo negro de Edad» de la Fase 1 no se reproduce; además Edad ya es `output` dentro de la caja de la fecha.
- La línea entre partes es decorativa a propósito (estilo.md r02, «Dos en uno»): la caja ya identifica el campo y las partes se distinguen por su nombre y su anillo de foco. Con `prefers-contrast: more` pasa a `border-control` (medido: igual al borde de control).
- 3.02:1 del borde de solo lectura sobre `neutral-soft` es justo; el CLI ya lo valida (#186, bruno 955feaf).

### Comportamiento

| Prueba | Resultado |
| --- | --- |
| RTL (tres motores) | País a la derecha del número, `chevron-down` al final (izquierda) de su parte, línea entre partes a la derecha de la parte, Nombre a la derecha de Apellido, sufijo a la izquierda, icono del mensaje al inicio (derecha), primaria del pie a la izquierda; el pie apilado igual que en LTR. Captura a 720 revisada |
| Pie fijo (2.4.11) | Tab por el formulario mediano a 1280 y 320, LTR y RTL: **0 controles tapados** (30 paradas; 19 en WebKit, que solo tabula campos de texto). Fijo 61px; **apilado a 320: 149px** (primaria sola arriba a ancho completo; a 320 «Restablecer» y «Guardar borrador» no caben juntas y van una por línea; a 360 comparten línea, 105px). Antes 177px |
| Táctil (`pointer: coarse`, compacto, contenedor 360) | GInput, GSelect, GDatePicker, caja de GInputGroup, filas de casilla e interruptor y botones del pie: **44px**; parte más estrecha de un fusionado: 49.95px de ancho |
| Densidades | Caja de GInput = GInputGroup = GSelect: 36 / 31.5 / 27px; separación entre filas 20 / 17.5 / 15px (default / comfortable / compact) |
| Selector de solo lectura de `GInputGroup` (`size` de bruno) | Sin flecha, mismo alto que la caja (34px, borde 1px), mide su texto («MX +52» 78px frente a 100px del selector editable): ya no desborda a 320. Con una serif o `space` 5 se recortaba (hallazgo 2, corregido) |
| `forced-colors` (emulado) | Anillo en la parte enfocada (sólido) y no en la caja; solo lectura de caja y de GInputGroup discontinuos; advertencia discontinua; error de GInputGroup a borde de 2px (el navegador quita la sombra); subrayado de la parte inválida visible (`CanvasText`); línea entre partes sólida |
| `prefers-contrast: more` | Línea entre partes = borde de control; línea del pie fijo = borde de control |
| Resumen de errores | Al enviar el mediano el foco va al resumen en los cuatro temas; título ≥ 15.22, enlaces y borde ≥ 4.52 |
| Consola | Limpia en los tres motores en todas las pasadas (incluido RTL y temas). El filtro solo ignora «ResizeObserver loop»; la sonda de bruno no culpa a ninguna observación del formulario |
| `.vue` y CSS | Ningún `.vue` del sistema (ni ningún `.vue` de la librería) lleva `<style>`; sin colores ni medidas de tema en `.vue`/`.js` (solo números de decisión en comentarios); CSS sin valores de respaldo `var(--g-*, …)` |
| Transición `__error` | Ya retirada: ningún CSS de campo estila `__error`/`__error-icon` (el único `__error` es el propio de `GFilterBar`, ajeno al sistema). Lo que queda son menciones en los README de campos (mora-docs) y en contratos de campo (lima) |
| `design/lab/migraciones/analisis/` (migrada a la API r02) | Consola limpia y sin desborde a 1280 y 360, claro y oscuro, bloqueado y editando; filas al mismo borde; valor + unidad fusionado con su línea discontinua en solo lectura; `migracion-analisis.spec.mjs` 12/12 dentro de la suite. Ver hallazgo 5 |

## Hallazgos

| # | Severidad | Dueño | Hallazgo y resolución |
| --- | --- | --- | --- |
| 1 | — | — | **Composición:** lo que rechazó el usuario en la Fase 1 (hallazgos 1 y 2 de abajo) no se reproduce en 587 casos medidos ni en la revisión a ojo. Cerrado |
| 2 | Mayor, **corregido** | coco (`GInputGroup.css`) | **El selector de solo lectura de GInputGroup recortaba su texto** con una fuente más ancha que la media («MX +52» 75/73px con Georgia y `space` 5, en las 64 pasadas de ese tema): `size` cuenta caracteres del ancho medio. Ahora la parte de elección en solo lectura lleva `field-sizing: content` (Chromium, Firefox y WebKit lo admiten; sin soporte queda `size`). Medido después: sin recorte en los cuatro temas; con la fuente por defecto el ancho no cambia (78px) |
| 3 | Informativo | lima | **Pie apilado (#185):** el contrato da 133px a 320 con tres botones; el componente real en una **ventana** de 320 mide 149px porque las dos secundarias no caben en una línea y bajan una por línea (la rama prevista de #185). Funciona (0 tapados, 44px táctil); solo actualizar la cifra o indicar «133–149px» |
| 4 | Informativo | lima | `GFieldGroup`: la ayuda del grupo va **después de las partes** (form.md §5) con el mismo `space-1` que la ayuda de un campo; en una sola columna («Contacto de emergencia» a 360, la última parte es Teléfono) puede leerse como ayuda de la última parte. Es correcto según el contrato y la relación programática es la del `fieldset`; si se quiere evitar la ambigüedad visual, valorar ayuda bajo la `legend` |
| 5 | Menor | bruno | `design/lab/migraciones/analisis/`: al permitir la edición **todas** las etiquetas muestran «(opcional)» (ningún campo es obligatorio en la página), lo que hace ruido; usar `marks="required"` en ese `GForm` o marcar como `required` lo que lo sea. Además, la propuesta de bloqueo (notas.md, Fase 4) sigue sin decidir (lima) |
| 6 | Informativo | bruno | La prueba obligatoria del playground no cubre RTL ni otros temas: lo cubre `auditoria-verificar.mjs` (este paso). Si se quiere en la suite, portar el barrido RTL a `form-distribution.spec.mjs` |
| 7 | Menor | bruno | `GFormActions.meta.json` conserva en `pending` «Auditoría: peso del pie apilado de 177px a 320px (#169)», ya resuelto por #185 y medido aquí (105–149px): quitarlo. `GForm.meta.json` y `GFormSection.meta.json` apuntan a `prototype: design/lab/form/r01/`; la distribución vigente es la de `r02/` |

## Sin ejecutar

- **Lector de pantalla real** (VoiceOver, NVDA, TalkBack): nombres por parte, `output` con `aria-live`, silencio de la región viva al enviar, doble lectura del resumen (alerta + foco).
- **Teclado virtual** (que el pie fijo no quede bajo el teclado de iOS/Android), zoom al 200/400 %, `forced-colors` real de Windows (solo emulado), menú nativo del `<select>` en oscuro y autocompletado real del navegador sobre el selector de país.

---

# Antecedente · Auditoría de la Fase 1 (interrumpida)

**Componentes:** `GForm`, `GFormSection`, `GFormGrid`, `GFieldGroup`, `GFormActions`, `GErrorSummary` y los seis campos (`GInput`, `GTextarea`, `GSelect`, `GCheckbox`/`GCheckboxGroup`, `GSwitch`, `GDatePicker`), reales (commits b4db77c…4a778c7 de bruno; contrato con #169 y #170 de lima). Temas: defecto, Spotify y lustre, claro y oscuro. Chromium, Firefox y WebKit.

**Resultado: no aprobado.** El usuario rechazó la distribución visual; la auditoría se detuvo y el sistema se rediseñó en la r02.

| # | Severidad | Dueño | Hallazgo y resolución |
| --- | --- | --- | --- |
| 1 | **Bloqueante** (usuario) | kiwi → lima → coco | Filas con huecos y borde derecho dentado (anchos por contenido `g-form-w-*` y máximos `--g-form-max-xs/-sm`). **Resuelto en r02** (filas que siempre llenan el ancho, #171–#175) |
| 2 | **Bloqueante** (usuario) | kiwi → lima → coco | Campos desalineados: la `<legend>` de `GFieldGroup`/`GCheckboxGroup` y las etiquetas de parte empujaban sus cajas. **Resuelto en r02** (preguntas compuestas en su propia fila, tres pistas por línea, #176, #179) |
| 3 | **Bloqueante** (usuario) | coco | Fondo negro en «Edad» (solo lectura con sufijo en oscuro). **Resuelto en r02** (Edad como `output`, #180; solo lectura con `neutral-soft`, #186) |
| 4 | Mayor, corregido | coco | Enlaces del resumen a 24px con puntero grueso → 44px |
| 5 | Menor, corregido | coco | Retirado el alias de transición `__error`/`__error-icon` de los seis campos (capturas idénticas antes/después) |
| 6 | Informativo | lima | Pie fijo apilado de 177px a 320 → #185 (hoy 105–149px) |
| 7 | Informativo | — | Casilla marcada con marca pálida: relleno a 1.77–1.92:1 (estado de `GCheckbox`, previo al sistema; como el hallazgo 7 de `GCard`) |

Medidas de la Fase 1 que siguen valiendo (no dependían de la distribución): contraste de etiquetas, ayudas y mensajes (mismos valores que arriba), anillo de foco ≥ 4.01, 44px táctil en campos y resumen, RTL del pie y del resumen, diálogo y drawer con envío desde el pie (`form="id"`) y foco al resumen.
