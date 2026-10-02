# Prueba de migración · «Información de la muestra» (Bootstrap → Grana)

Original: `original-bootstrap.html` (modal `modal-lg`, laboratorio de análisis de bebidas). Migrado: `index.html` (abre con `?open=1`; `?theme=dark|light`). Solo componentes públicos de Grana; sin cambios en la librería. Verificado con Playwright (chromium) a 1280 y 390 px, claro y oscuro: consola limpia, Esc cierra, cada fila termina en el mismo borde (0 px) y las cajas de cada fila comparten `top` (±1 px: el disparador del selector de fecha es un botón y queda 1 px más abajo que un input), 0 campos editables y 0 deshabilitados (solo lectura, texto seleccionable), sin desborde de página ni del cuerpo.

## Correspondencias

| Bootstrap | Grana |
| --- | --- |
| `.modal.fade` + `.modal-dialog.modal-lg` + `.modal-content` | `GDialog size="lg"` (`<dialog>` nativo, Esc, foco atrapado, fondo inerte) |
| `.modal-header` + `h3.modal-title` + `.btn-close` | `title`, `description`, `close-label` |
| `data-bs-backdrop="static"` | `:close-on-backdrop="false"` (no usado: ver fricción 9) |
| `.modal-footer` con Cancelar / Guardar | slot `#footer`: `GBtn variant="outline"` y `GBtn` primario `disabled` a la derecha |
| Píldora `bg-light rounded-pill` con «ESTADO: INGRESADA» | Fila de resumen: etiqueta «Estado» + `GBadge color="success"` «Ingresada» |
| `btn-warning` «BLOQUEADO» con `bx-lock-alt` (era el control de bloqueo) | `GSwitch` «Permitir edición» + texto de estado con icono `lock`: ver «Patrón: formulario con bloqueo de edición» |
| `<form>` con `input[disabled]` ×25 | `GForm :readonly="!editando"` (no `disabled`: los valores se leen, se enfocan y se copian) |
| `.row` / `.col-sm-N` / `.mb-2` | `GFormGrid` + `g-form-row` (partes iguales, subgrid): cada fila llena el ancho |
| `label.form-label` + `input.form-control` | `GInput label=…` |
| `select.form-select` | `GSelect :options` con valores reales (el original traía `[object Object]`) |
| `input type=date` | `GDatePicker` (readonly) |
| `textarea.form-control` | `GTextarea resize="none"` |
| `input-group` / «(°C)» en la etiqueta | `GInput suffix="°C" suffix-label` |
| `span.badge` de agave | `GBadge color="neutral"` en una lista |
| `.card` + `table.table-bordered.table-striped.table-sm` | `GFormSection title="Ensayos"` + `GTable density="compact"` con `format` es-MX |
| `hr` entre bloques | Secciones `GFormSection` (título, separación y nivel de encabezado propios) |

## Qué mejoró

- **Estructura:** 25 campos planos → 6 secciones con sentido (Cliente y producto; Lote y muestreo; Recepción y entrega; Contenedor; Observaciones; Ensayos), con encabezados reales (h3) y un `<form>` con nombre.
- **Etiquetas** sin dos puntos, en mayúscula inicial («Observaciones del cliente (etiqueta)»), sin unidades repetidas («Temperatura» + sufijo °C).
- **Estado** como resumen (etiqueta + insignia) y no como píldora gigante; el bloqueo es un botón pequeño al lado.
- **Valor + unidad en la misma fila** (volumen del lote, de muestra, capacidad), y ninguna fila con huecos ni etiquetas de distinta altura: todas son `g-form-row` de dos partes iguales o campos a ancho completo.
- **Solo lectura de verdad:** campos con aspecto de consulta, enfocables, seleccionables, anunciados como de solo lectura; no «deshabilitados», que los quita del Tab y de la lectura.
- **Importes** formateados en es-MX (`$1,469.00`, `$1,042.99`); «Membresía Platino 29 %» con espacio fino y capitalización correcta.
- **Opciones reales:** `value` válido en todas (el original enviaba `[object Object]`); se recortaron las listas de ejemplo a opciones representativas.
- **Responsivo y temas** sin código propio: a 390 px el diálogo es una hoja inferior y la tabla pasa a tarjetas; oscuro y claro funcionan.
- Sin jQuery UI (`ui-autocomplete-input`), sin `style="display:block"` ni `data-bs-*`.

## Fricciones (lo que Grana no expresó bien o hubo que forzar)

Cada una con quién la resolvería.

1. **Valor + unidad sin campo fusionado.** Se compusieron como dos campos en una `g-form-row` («Volumen del lote» | «Unidad»), medio ancho cada uno: la unidad ocupa 50 % para una palabra como «L». Lo correcto es un solo campo con la caja unida (número + selector de unidad) y una etiqueta. Lo resuelve **formularios r02: GInputGroup (campos fusionados)** y las clases de ancho por contenido (`xs`/`sm`) que llenan la fila. Con `g-form-part-xs|sm` la unidad sería angosta pero deja un hueco a la derecha: no se usó porque rompe «las filas llenan el ancho».
2. **Distribución sin pesos.** Con las clases actuales solo hay filas de partes iguales o ancho completo. «Temperatura | Almacenamiento» (5/7 en el original) o «Tipo | Material | Capacidad | Unidad» en una fila no se pueden expresar sin huecos (`g-form-w-*` suma 12 solo en el tramo ancho; en el medio no). Resuelve **r02: filas explícitas con pesos xs/sm/md/lg y mínimos**. Hoy hay más filas de las necesarias (14 en vez de ~9).
3. **Chips de agave / entrada de etiquetas.** No existe un campo de etiquetas (`textarea` + chips + autocompletar en el original). Se hizo con `GBadge` en una lista y una etiqueta propia (CSS de la página, `.mg-chips-label`) que imita las de los campos. En una consulta basta; para editar hace falta **un componente nuevo (GTagInput / GCombobox múltiple)**, aún sin ronda de kiwi.
4. **Autocompletar** (empresa, muestreador): Grana no tiene `GAutocomplete`; `GSelect` elige entre opciones cargadas pero no busca en servidor. Aquí son `GInput` de texto. Pendiente de **ronda de kiwi para GCombobox/GAutocomplete**.
5. **Estado como encabezado.** No hay componente de «resumen de estado» (clave + insignia + acción); la fila `.mg-status` es CSS de la página. Candidato a **GPageHeader / GDescription** o a un slot de estado en `GDialog` (hoy solo `description` y `icon`).
6. **Tabla compacta de una fila.** `GTable density="compact"` funciona en escritorio, pero a 390 px la tarjeta de una sola fila muestra el «#» suelto como encabezado de tarjeta (la primera columna es la `primary`) y repite etiqueta/valor a lo largo: para una lista de 1–5 ensayos pesa más que una tabla que se desplace. Para el caso «tabla de detalle dentro de un formulario» faltan: marcar `primary` en «Ensayo» (se podría con `primary: true`, no lo probé en todas las combinaciones), o `responsive="table"` con desplazamiento interno. **Ronda de GTable sobre uso embebido** (coco/bruno).
7. **Textarea readonly con asa de redimensionado.** Se resolvió con `resize="none"`, pero el aspecto «de consulta» (borde punteado en todos los campos) lo da `readonly`: un diseño de **modo vista** más cercano a texto plano (sin caja) sería mejor para 25 valores; hoy el diálogo parece un formulario bloqueado. Resuelve la decisión de **modo vista de formularios** (form.md §2; DECISIONS de `readonly`).
8. **Densidad.** Con 25 campos el diálogo mide ~1500 px de alto y el cuerpo se desplaza (el pie fijo ayuda). `density="compact"` en `GForm`/`GDialog` ahorra poco: haría falta una variante **«dl» de lectura** (etiqueta/valor en dos columnas) en `GDataList`, que sí existe pero no se usó por no ser un formulario; es una decisión de producto (¿consulta como lista de datos o como formulario?).
9. **Estático / diálogo que no se cierra.** El original usaba `data-bs-backdrop="static"` (no cierra al clic fuera). En Grana es `:close-on-backdrop="false"`; no se usó porque no hay edición y el cierre por clic en el fondo es inocuo en consulta, pero en edición con cambios sin guardar hay que combinarlo con `@dismiss` (documentado en el README del diálogo; sin fricción real).
10. **Cancelar / Guardar en una vista de consulta.** Se mantuvo la pareja del original (Guardar deshabilitado), como pidió el encargo; Grana no lo cuestiona. Un diálogo de consulta debería tener un solo botón «Cerrar» (el botón ya existe como X): decisión de producto del equipo del laboratorio, no de la librería.
11. **Iconos.** `lock` está en la lista de Lucide de la librería, pero **no hay una forma pública de usarlo**: `GIcon` es interno y el `lucide-icons.js` del playground es un archivo del playground. La página lo carga de ahí (`packages/vue/playground/lucide-icons.js`) y define su propio `<lucide-icon>`. Falta un **paquete/entrada de iconos para la aplicación** (`@grana/vue/icons` o un comando del CLI que genere un subconjunto): **ronda de iconos (bruno)**.
12. **Selector de fecha: 1 px.** El disparador de `GDatePicker` queda 1 px más abajo que el `<input>` de la misma fila (585 vs 584). Está dentro de la tolerancia, pero delata dos alturas distintas entre campos: **coco, auditoría de alineación**.
13. **Plantillas en HTML sin compilar.** Hubo que escribir `<g-btn …></g-btn>` y no autocerradas (limitación de Vue ya documentada); la página lleva sus textos (`labels` de `GForm`, de `GDatePicker`) a mano porque Grana no trae textos: lo esperable, pero verboso para una vista de solo lectura que ni siquiera usa el calendario. Un **`GDatePicker` en readonly sin `labels`** (no necesita los textos del calendario) lo evitaría: **bruno**.

## Patrón: formulario con bloqueo de edición

**Aclaración del usuario:** el modal **no es una consulta de solo lectura**. Es un formulario de captura que, una vez capturado, queda **bloqueado** para evitar errores de edición. Quien solo quiere leer lo consulta así; para editar se activa un interruptor que desbloquea el formulario. Así nadie pulsa Guardar por accidente y hace un update (el botón «BLOQUEADO» del original era ese control). Las menciones previas de esta nota a «solo lectura / consulta» describen el estado por defecto, no la naturaleza del formulario.

**Cómo se compuso (API pública actual, sin tocar la librería):**

- `GSwitch` «Permitir edición» en la fila de estado, **fuera** de `GForm` (dentro heredaría `readonly` y no podría desbloquear). Apagado = bloqueado. El estado no depende del color: texto «Formulario bloqueado» con icono `lock` / «Edición permitida» sin icono (`lock-open` no está en `icons.json`; solo existe `lock`).
- `GForm :readonly="!editando" v-model:dirty="sucio"`. Los campos usan `v-model` sobre un objeto reactivo y la página guarda una copia de la última versión guardada.
- Pie del `GDialog`: bloqueado → «Cerrar» + «Guardar» deshabilitado; editable → «Cancelar» + «Guardar» habilitado solo si `sucio`. Cancelar descarta (restaura la copia, `resetState()` del formulario) y vuelve a bloquear; Guardar (simulado) actualiza la copia, bloquea y avisa con `GToaster`.
- Cambios sin guardar: apagar el interruptor, Esc, X o Cerrar piden confirmación en un segundo `GDialog role="alertdialog"` («Seguir editando» / «Descartar cambios»); el cierre del primero se frena con `@dismiss` + `preventDefault()` (cualquier `reason`). El interruptor no cambia de estado hasta confirmar (el `modelValue` es de la página).
- Región `role="status"` dentro del diálogo (lo de fuera es inerte) anuncia «Edición permitida», «Formulario bloqueado», «Cambios guardados…», «Cambios descartados…». El diálogo se reabre siempre bloqueado.
- Verificado con Playwright (chromium, 1280 y 390, claro y oscuro): bloqueado por defecto (readonly, Guardar deshabilitado); el interruptor con Espacio desbloquea; sin cambios Guardar sigue deshabilitado y al editar se habilita; Cancelar revierte y bloquea; Guardar bloquea, conserva el valor y muestra el aviso; apagar, Esc y X con cambios piden confirmación; filas alineadas (±1 px) en ambos modos; consola limpia.

**Fricción:** el sistema de formularios **no ofrece este patrón** ni lo documenta; todo lo anterior es composición de la página (estado, copia, confirmación, anuncio). Es un caso muy común en aplicaciones de captura (expedientes, órdenes, fichas). Además:

1. Faltan `lock-open` (icono) y una forma pública de usar iconos (ver 11).
2. `GForm` no expone «revertir a los valores guardados»: `resetState()` limpia el estado de errores y `dirty`, pero los valores son de la aplicación y hay que restaurarlos a mano.
3. **`GToaster` colocado después de un `GDialog` hermano rompe el parche de Vue** (`insertBefore` al cerrar el diálogo: la región se traslada al `<dialog>` modal y al desmontarse el diálogo el ancla ya no existe). Con `<g-toaster>` como primer hijo funciona. Conviene que la región sea robusta a su posición (bruno) o que el README lo advierta.
4. El interruptor debe quedar fuera del `GForm` para no heredar `readonly`: no es obvio y no está documentado.

**Propuesta para la Fase 4 de formularios (a decidir por lima):** una **receta documentada** o una prop de `GForm` tipo `locked` (con `v-model:locked`) que (a) ponga los campos en solo lectura, (b) ofrezca el interruptor «Permitir edición» como parte del encabezado/pie del formulario (slot `lock` o `GFormLock`), (c) exponga `dirty` y un `revert()` a los valores guardados, (d) pida confirmación (`confirmDiscard`) al volver a bloquear con cambios y anuncie el cambio de modo por su región viva. Decidir también si el bloqueo tiene permiso por rol (quién puede ver el interruptor) y si Cancelar con cambios debe confirmar (aquí no confirma: es una acción explícita de descartar).
