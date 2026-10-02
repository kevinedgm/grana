# Declaración de cumplimiento · Captura de voz · r02 · Fase 2 (revisión y destino)

**Estado:** en revisión. **Fuente de verdad:** `../r01/brief.md` (del usuario) y el contrato F1 `design/contracts/speech.md` (§1.4 forma del transcript, §18 lo reservado). Esta ronda solo añade; no reabre ninguna decisión de la F1 (#207 a #240).
**Ruta:** R2 (sistema: un modelo de datos y varias vistas) · **Fidelidad:** F2 · **Material:** kit gris neutro, iconos solo Lucide (`design/lab/lucide-icons.js` + importados de `lucide-static`: `text-cursor-input`, `undo-2`, `redo-2`, `trash`, `user-plus`, `merge`, `split`, `git-compare`).
**Siguiente dueño:** lima → contrato F2 (ampliar `speech.md` o abrir `transcript.md`), filas de `icons.md` §4, textos `labels.transcript.*`.
**Prototipo:** `index.html` (modelo `createTranscript`, `GTranscript`, registro de destinos y una sesión simulada que emite `partial` / `final` / `speakers.relabel` como el adaptador simulado; la pill y la captura real son las de la F1 y aquí solo se imitan). **Verificación:** `node design/lab/speech/r02/verificar.mjs` (servidor propio en 4252; 123 comprobaciones, §17).
**Convención:** «propuesta kiwi» = recomendación que se asume si el usuario no dice lo contrario. Colores, radios y medidas del prototipo son de wireframe. Los nombres los fija lima.

---

## 1. Qué es la Fase 2 y qué no duplica

1. **Tres piezas, un modelo.** (a) **El transcript es un modelo de datos con operaciones** (`createTranscript(data)`; `speech.state.transcript` es una instancia): capas, historial, composición, usos. (b) **`GTranscript`** es la **vista** pública que lo muestra y edita. (c) **Los destinos** son un registro de la aplicación (campos de su formulario) al que `GTranscript` inserta. Varias vistas del mismo transcript (panel, revisión en la página, diálogo) **comparten el modelo**: una corrección en una aparece en las otras (verificado).
2. **Solapamientos revisados:**

   | Existente | Relación |
   | --- | --- |
   | `GTable` (selección con casilla, `v-model:selected`, filas → tarjetas por ancho propio) | **No** se reutiliza: es una tabla de datos (`role="table"`, sin edición en celda; #109 a #111 y `table.md`: «sin edición en celda, sin virtualización»). `GTranscript` necesita edición en la celda y una parada de tabulación: patrón **rejilla** de APG. **Sí** copia sus convenciones: `v-model:selected` con claves, casilla por fila, «Seleccionar todo» con estado mixto, fila seleccionada con el mismo tono (`primary-soft`), apilado por **ancho del contenedor** |
   | `GMenu` | Los dos menús por fila (acciones y hablante) y los de la barra (copiar, asignar) **son `GMenu`** (menú APG con `menuitem` / `menuitemradio`) |
   | `GSelect`, `GCheckbox`, `GBtn`, `GIcon`, `GTextarea` | Rol por hablante y campo de destino (`GSelect`), casillas (`GCheckbox`), todos los botones (`GBtn`), editor del fragmento (`textarea` con la piel de `GTextarea`; ver hallazgo L9) |
   | `GDialog` | Forma del **diálogo de revisión de respaldo** del anfitrión (§12.3) |
   | `GDataList` | No: es lectura clave/valor |
   | Panel F1 (`g-speech-transcript`, lista de solo lectura) | En **conversación** se sustituye por `GTranscript compact`; en **dictado** no cambia (§13) |

## 2. Capas y modelo de datos

1. **La forma de la F1 no cambia** (§1.4): `segments[]` = `{ id, t0, t1, literal, engineSpeaker, corrected, speaker, removed, failed }`. La F2 **llena** los campos reservados y **añade** campos a `speakers[]` y `derived[]` (aditivo, hallazgo L2).

   | Capa | Campos | Quién escribe | Regla |
   | --- | --- | --- | --- |
   | **Literal** | `literal`, `engineSpeaker`, `t0`, `t1` | Solo el motor (`final`; `speakers.relabel` en `engineSpeaker`) | Inmutable para el usuario. Un `final` repetido se ignora (F1). **Verificado**: tras editar, eliminar, reasignar, unir y deshacer, el literal sigue igual |
   | **Corregido** | `corrected` (`null` = igual al literal), `speaker` (`null` = el del motor), `removed` (borrado lógico) | El usuario, solo con las operaciones del modelo | Guardar un texto **igual al literal** deja `corrected = null`; guardar **vacío** no borra el texto: equivale a **eliminar** (`removed = true`, `corrected` intacto) y lo anuncia |
   | **Derivado** | `derived[]` | Grana (usos `kind: 'insert'`) y la aplicación (sus `kind`) | Solo datos (#211). Nunca reescribe las otras capas |

2. **Hablantes** `speakers[]` = `{ id, role, mergedInto, origin }`: `role` (id de la lista de la app o `null`), `mergedInto` (id al que se unió o `null`), `origin` (`'engine'` · `'user'`). El hablante **efectivo** de un fragmento es `resolve(speaker ?? engineSpeaker)`, siguiendo `mergedInto`. La **letra** sale de la posición en `speakers[]` (estable: unir o separar no reletra a nadie).
3. **Uso (inserción) en `derived[]`**: `{ id, kind: 'insert', createdBy: 'user', at, target: { id, label }, position: 'end' | 'cursor' | 'selection', sourceSegmentIds, text, sources: { [segmentId]: textoEnEseMomento } }`. `sources` permite marcar «Cambió después de insertarlo» si luego se corrige el fragmento (el campo **no** se actualiza solo: el texto del campo ya es del usuario).
4. **`toJSON()`** devuelve literal, corregido, hablantes con rol y unión, y `derived`; **sin** `partial` (F1) y **sin historial** (§3.4). Verificado: `onComplete` recibe correcciones, roles y usos.
5. **Diferencias visibles:** no se guardan: se **calculan** (diferencia por palabras, LCS) al mostrar «Ver original» o «Mostrar cambios». El texto principal de la fila es siempre el **corregido**; el original y las diferencias van en un bloque aparte debajo (`<del>`/`<ins>` con prefijo oculto «(eliminado: …)» / «(añadido: …)», porque los lectores no anuncian `del`/`ins` de forma fiable). Así la selección de texto de la fila mapea 1:1 sobre el corregido (§7.3).
6. **«Volver al original»** por fragmento: `corrected = null` y `speaker = null` (texto y hablante); no toca `removed` (para eso está «Restaurar»). Es una operación del historial: se deshace (verificado).

## 3. Historial de la revisión (deshacer / rehacer)

1. **Vive en el modelo**, no en la vista: las vistas del mismo transcript comparten historial (deshacer en el panel deshace lo hecho en la página). Pila de 200 entradas (propuesta kiwi; lima decide si es constante).
2. **Qué entra:** `edit`, `revert`, `remove`, `restore`, `assignSpeaker` (incluido «nuevo hablante»), `addSpeaker`, `setRole`, `mergeSpeakers`, `unmerge`. Cada entrada guarda **instantáneas** de los campos del usuario de los fragmentos tocados (`corrected`, `speaker`, `removed`) y, si toca hablantes, de `speakers[]`. Deshacer restaura solo eso: **un fragmento o un hablante que llegó del motor después no se pierde** (los hablantes creados por la operación se quitan; los demás se conservan).
3. **Qué no entra:** eventos del motor (`final`, `partial`, `relabel`), selección, mostrar cambios, inserciones en destinos (tienen su propio deshacer, §11.6: son otro documento, el formulario; mezclar las dos pilas haría que Ctrl+Z en la transcripción cambiara un campo que no se ve).
4. **No se guarda en `toJSON()`:** al reabrir un transcript guardado, el historial empieza vacío (las versiones intermedias de una corrección pueden ser sensibles y no aportan: literal y corregido bastan).
5. **Teclas:** Ctrl/Cmd+Z deshace, Ctrl/Cmd+Mayús+Z y Ctrl+Y rehacen, **solo con el foco en la rejilla y fuera del editor** (dentro del `textarea` manda el deshacer nativo del texto). Botones «Deshacer» / «Rehacer» en la barra con `aria-keyshortcuts` y descripción oculta de la acción («Deshacer: corrección de las 00:03»); con la pila vacía, `aria-disabled` (siguen enfocables).
6. **Foco y anuncio:** deshacer desde la rejilla lleva el foco a la primera fila afectada (misma columna); desde la barra, el foco se queda en el botón y la fila se desplaza a la vista. Anuncio cortés «Deshecho: {acción}.» / «Rehecho: {acción}.» (verificado).
7. **WCAG 3.3.4 / 3.3.6:** ninguna operación de la revisión es irreversible (eliminar es lógico; todo se deshace) → **sin confirmaciones** para eliminar o reasignar.

## 4. Provisionales y confirmados mientras se edita

1. **El provisional es una fila aparte** (la última), con la clave del `id` del fragmento: no se puede editar, seleccionar ni cambiar de hablante; marca visible «Provisional» y prefijo oculto «Texto provisional:». Cuando llega su `final` (mismo `id`), **la misma fila** pasa a confirmada en su sitio (si tenía el foco, lo conserva).
2. **El editor nunca se repinta:** cada celda tiene una firma y solo se reescribe si cambia; con el editor abierto, la celda de texto de ese fragmento queda congelada aunque cambien su hablante (relabel), sus marcas o el resto de la lista. Insertar filas nuevas no mueve la fila editada en el DOM (no pierde el foco). **Verificado**: con el editor abierto llegan ≥ 2 confirmados y ≥ 3 versiones del provisional; el foco, el borrador y el cursor (posición 8/8) siguen iguales; al guardar, `literal` intacto y `corrected` aparte.
3. **Seguir el final:** la lista se desplaza sola al final **solo** si ya estaba al final y el foco no está en otra fila ni hay editor o menú abiertos (2.4.11: nunca se desplaza el elemento enfocado fuera de la vista). Si no, aparece «N fragmentos nuevos · Ir al final» (botón, **no** región viva; lleva el foco a la última fila).
4. **Diarización revisada por el motor** (`speakers` `{ relabel: { idDelMotor: idDelMotor } }`): cambia `engineSpeaker` de los fragmentos afectados (capa literal) y el hablante del provisional; **no** toca `speaker` del usuario ni el historial. Una reasignación del usuario que tras el relabel coincide con el motor deja de marcarse como cambio (se calcula al mostrar). Verificado con el editor abierto en otro fragmento: borrador y foco intactos.
5. **Fragmento fallido** (F1): fila con icono y «No se pudo transcribir este fragmento (mm:ss–mm:ss).», sin casilla ni acciones de edición; «Reintentar fragmento» sigue siendo de la F1 (panel).

## 5. `GTranscript`: estructura

1. **Patrón: rejilla de datos de APG** (`role="grid"`), **una fila por fragmento**, **una sola parada de tabulación** (foco itinerante). Motivo: es la colección de APG pensada para elementos con **selección múltiple y edición en la celda** con teclado completo; una lista con botones por fila daría ~2 paradas por fragmento (600 con 300 fragmentos) y un `listbox` no admite controles dentro de las opciones. Riesgo aceptado: en lectores, la rejilla activa el modo foco; leer de corrido sigue siendo posible con el modo exploración (pendiente de prueba real, §18).
2. **Columnas** (encabezados `columnheader` ocultos visualmente: «Selección», «Hora», «Hablante», «Texto», «Acciones»):

   | Columna | Rol | Contenido | Cuándo |
   | --- | --- | --- | --- |
   | Selección | `gridcell` | `GCheckbox` «Seleccionar fragmento de las mm:ss» | `selectable` |
   | Hora | **`rowheader`** | `<time>` mm:ss (relativa al inicio del audio capturado) | siempre |
   | Hablante | `gridcell` | `GBtn` con letra (marca de forma, `aria-hidden`) + etiqueta + oculto «, cambiar hablante» → `GMenu` | conversación y (`expectedSpeakers ≠ 1` o el motor distingue más de uno o hay reasignaciones) |
   | Texto | `gridcell` (enfocable) | Corregido + marcas + (original y cambios) / editor | siempre |
   | Acciones | `gridcell` | `GBtn icon` `ellipsis-vertical` «Acciones del fragmento de las mm:ss» → `GMenu` | siempre en confirmados |

3. **Estado de la fila** (`data-state`): `partial` · `plain` · `corrected` · `removed` · `failed`; `aria-selected` en las seleccionables (además de la casilla; ver §18). **Marcas visibles con icono y texto** (no solo color ni solo estilo, 1.4.1), en la celda de texto **después** del texto: «Corregido» (`pencil`), «Hablante cambiado (motor: Hablante B)» (`users`), «Eliminado» (`trash`; además texto tachado), «Usado en Motivo, Plan» (`text-cursor-input`), «Cambió después de insertarlo» (`triangle-alert`), «Provisional».
4. **Eliminado se queda en su sitio** (tachado + marca), no se oculta: es reversible y el contexto se conserva. Se excluye de copiar, insertar y del recuento.
5. **Barra** (`role="group"`, «Acciones de la transcripción»; `GBtn` `ghost`): «Seleccionar todo» (casilla con estado mixto) · contador visible «3 seleccionados» (no vivo) · «Asignar hablante» (menú) · «Eliminar selección» / «Restaurar selección» · «Deshacer» · «Rehacer» · «Copiar» (menú: texto / con hablantes y horas) · «Mostrar cambios» (`aria-pressed`) · «Hablantes» (disclosure con `aria-expanded`, §10.5). Una línea de ayuda de teclado visible bajo la lista, enlazada con `aria-describedby` a la rejilla.
6. **Modos:** `editable` + `selectable` (por defecto) · **solo selección** (`editable: false`: copiar e insertar, sin edición ni cambio de hablante) · **solo lectura** (los dos `false`): **lista simple** `<ol>` desplazable con `tabindex="0"`, como el panel F1. **Compacto** (`compact`, lo usa el anfitrión): sin columna de selección, sin inserción, sin gestor de hablantes ni ayuda de teclado; conserva editar, eliminar, cambiar hablante, deshacer y copiar.
7. **Contenedor de desplazamiento propio** con alto máximo (coco), para que barra e inserción sigan a la vista; la rejilla es su único hijo enfocable.
8. **Vacío:** «Todavía no hay texto transcrito.» en lugar de la rejilla.

## 6. Edición

1. **Modo edición en la celda** (APG «data grid», edición de celdas): Intro o F2 en la celda de texto (o doble clic) abren un `textarea` con el texto **corregido**, el cursor al final, el **original del motor** debajo (`aria-describedby`) y la ayuda «Intro guarda · Esc cancela · el original del motor no cambia»; botones «Guardar» / «Cancelar». No se edita en línea siempre (cada fila un campo): rompería la navegación por la rejilla y multiplicaría las paradas.
2. **Intro guarda** (los fragmentos son un párrafo; no hay saltos de línea en un fragmento: el espacio se normaliza) y el foco vuelve a la celda. **Esc cancela** sin guardar, con `stopPropagation` (no cierra el panel ni un diálogo; verificado en el diálogo de respaldo).
3. **Salir del editor guarda** (foco a otro elemento de la página, p. ej. «Insertar»): convención de las rejillas editables y evita borradores huérfanos; es reversible con deshacer. **No** guarda si la ventana pierde el foco (cambiar de aplicación).
4. No se edita un fragmento **eliminado** (primero «Restaurar»), **provisional** ni **fallido**.
5. Guardado → anuncio «Fragmento de las mm:ss corregido. El original se conserva.»; vacío → «Texto vacío: el fragmento de las mm:ss queda eliminado. Puedes restaurarlo.»; sin cambios → nada.

## 7. Selección y copia

1. **Selección de fragmentos** (`v-model:selected`, claves): casilla por fila (puntero y táctil, sin arrastre: 2.5.7), **Mayús+clic** en la casilla = rango desde la última marcada; teclado: **Mayús+Espacio** (o Espacio fuera de la casilla) alterna la fila, **Mayús+↑/↓** amplía, **Ctrl+A** todo / nada. «Seleccionar todo» y el contador en la barra. Seleccionables: confirmados (también eliminados, para «Restaurar selección»); no el provisional ni los fallidos.
2. **Acciones sobre la fila enfocada o la selección:** si la fila enfocada está seleccionada y hay más de una, Supr y el menú de hablante actúan sobre **toda la selección**; si no, sobre la fila.
3. **Selección de texto** (dentro de uno o varios fragmentos, con el ratón o la selección nativa del sistema): Grana la **mapea a fragmentos y desplazamientos** sobre el texto corregido (`{ id, start, end, text }[]`). Una **selección nueva** pasa a ser la fuente de «Insertar» («Texto seleccionado «…»»); la elección manual de fuente se respeta mientras la selección no cambie.
4. **Copiar** (`navigator.clipboard`, contexto seguro): barra «Copiar» → «Copiar texto» (el corregido de la selección o de todo; turnos de hablante separados por salto de línea) o «Copiar con hablantes y horas» (`[mm:ss] Rol: texto` por turno); menú de fila «Copiar fragmento»; **Ctrl+C** en la rejilla sin texto seleccionado copia las filas seleccionadas (o la enfocada). **Copia nativa** de un texto seleccionado: Grana intercepta `copy` y escribe **texto limpio** (sin horas, marcas ni prefijos ocultos; verificado). Fallo del portapapeles → anuncio «No se pudo copiar al portapapeles.». Opción `copy: false` para aplicaciones que no quieran portapapeles (privacidad).
5. **Composición** (`compose(source, { withSpeakers, withTimes, multiline })`): usa el **corregido**, excluye eliminados y fallidos, agrupa fragmentos seguidos del mismo hablante en un turno; prefijo = rol si es único entre los hablantes, si no la etiqueta completa («Familiar (C)»); un **trozo de texto** se inserta tal cual (es una cita: sin prefijos ni horas).

## 8. Teclado (rejilla)

| Tecla | Acción |
| --- | --- |
| Tab / Mayús+Tab | Entra y sale de la rejilla (una parada); dentro del editor, recorre `textarea` → Guardar → Cancelar |
| ↑ ↓ | Fila anterior / siguiente, misma columna |
| ← → | Columna anterior / siguiente |
| Inicio / Fin | Primera / última columna de la fila |
| Ctrl+Inicio / Ctrl+Fin | Primera / última fila |
| RePág / AvPág | 10 filas |
| Intro / F2 | En texto u hora: editar. En hablante o acciones: abre su menú (nativo del botón). En la casilla: nada (Espacio la marca) |
| Espacio | En la casilla: marca. En otra celda: alterna la selección de la fila |
| Mayús+Espacio · Mayús+↑/↓ | Alterna · amplía la selección |
| Ctrl/Cmd+A | Selecciona todo; otra vez, nada |
| Supr / Retroceso | Elimina (o restaura si ya estaba eliminada) la fila o la selección |
| Ctrl/Cmd+Z · Ctrl/Cmd+Mayús+Z · Ctrl+Y | Deshacer · rehacer (fuera del editor) |
| Ctrl/Cmd+C | Sin texto seleccionado: copia la selección o la fila |
| En el editor: Intro · Esc | Guardar · cancelar |
| En un menú: ↑ ↓ Inicio Fin · Intro/Espacio · Esc · Tab | `GMenu` (APG): mover · elegir · cerrar y volver al botón (sin cerrar panel ni diálogo) · cerrar |

Sin atajos de una sola tecla fuera de la rejilla (2.1.4: dentro de la rejilla solo actúan con ella enfocada). IME: con `isComposing` no se trata ninguna tecla. **Verificado**: navegación, Inicio/Fin, Ctrl+Inicio/Fin, un solo `tabindex="0"` en todo momento, Supr/Ctrl+Z/Ctrl+Mayús+Z, Esc en editor y menú.

## 9. Lector de pantalla y anuncios

1. **Nombres:** rejilla con `aria-labelledby` al título que pone la app y `aria-describedby` a la ayuda de teclado; `aria-multiselectable` con selección; cabecera de fila = hora (el lector la dice al cambiar de columna); botones con nombre que incluye la hora del fragmento; editor `role="group"` «Editar fragmento de las mm:ss» con `textarea` nombrado y descrito por el original.
2. **Canal:** dentro de una sesión, `GTranscript` **usa los canales del anfitrión** (F1 #219: un solo par por gestor; se trasladan al modal); **sin anfitrión** (transcript guardado) trae **una** región `role="status"` propia, presente desde el montaje. Verificado: 2 canales del anfitrión + 1 del GTranscript suelto, ninguno más.
3. **Qué se anuncia (cortés, uno por acción, gana el último si se encadenan):**

   | Se anuncia | Ejemplo |
   | --- | --- |
   | Resultado de una acción que no mueve el foco al cambio o no se ve en el punto de foco | corregido, eliminado/restaurado (con número si son varios), vuelta al original, hablante asignado, rol, unir/separar, añadido, deshacer/rehacer con la acción, selección masiva (Ctrl+A, rango: «N fragmentos seleccionados»), copiado (o fallo), insertado en {campo} (con «puedes deshacerlo»), inserción deshecha o no deshacible, mostrar/ocultar cambios |
   | **Nunca** | provisionales, confirmados nuevos, relabel del motor, «N fragmentos nuevos», mover el foco, marcar una casilla (el lector ya lee el estado) |

   Verificado: con la sesión capturando y sin acciones, **0 anuncios** en 2,5 s; ningún anuncio contiene texto transcrito; tres Supr seguidos dejan **un** anuncio (el último).
4. **Foco (2.4.3, 3.2.2):** nada lo mueve por sí solo (ni confirmados nuevos, ni relabel, ni inserciones); tras guardar o cancelar vuelve a la celda de texto; tras eliminar se queda en la fila; al cerrar un menú vuelve a su botón; «Ir al final» lleva a la última fila.

## 10. Hablantes y roles

1. **Participantes previstos** (`expectedSpeakers` 1 · 2 · varios, F1) es una **pista** al motor y decide si se muestra la columna de hablante desde el principio. Con 1 y sin que el motor distinga más, no hay columna (verificado).
2. **Etiquetas neutras** por orden de aparición: «Hablante A/B/C» (`labels.speaker` con `{letter}`). Los `id` del motor son opacos (`spk_0`…); la UI **nunca** los muestra. Sin nombres propios: el brief pide no asumir identidad; los roles los pone quien revisa.
3. **Roles:** lista de la aplicación (`roles: [{ id, label }]`, opción del gestor o prop; **sin valores por defecto**), asignados **por hablante** en el gestor de hablantes (`GSelect` «Rol: Hablante A»). Con rol, la etiqueta es «Profesional (A)» (`labels.speakerRole` con `{role}` y `{letter}`): la letra se conserva para distinguir dos hablantes con el mismo rol. El rol vive en `speakers[].role` (dato). Verificado en las dos vistas a la vez.
4. **Reasignar un fragmento:** menú del hablante (`menuitemradio` con el actual marcado; «Nuevo hablante»; «Volver al del motor (…)» si se cambió). Cambia `speaker`, **nunca** `engineSpeaker`; marca «Hablante cambiado (motor: Hablante B)». Con selección: «Asignar hablante» en la barra o el menú de la celda sobre la selección.
5. **Gestor de hablantes** (disclosure «Hablantes»): por hablante, letra, etiqueta, número de fragmentos, rol, **«Unir con» + «Unir»** (`merge`) y, en los unidos, «Unido a … · Separar» (`split`); «Añadir hablante» (`user-plus`).
   - **Unir** (el motor partió a una persona en dos): `mergedInto`; sus fragmentos pasan a mostrarse con el destino; **no** cambia `engineSpeaker`; las reasignaciones del usuario hacia el unido se redirigen; deshacer lo revierte (verificado).
   - **Separar** a una persona que el motor juntó con otra **no** es automático (no hay información para hacerlo): se seleccionan sus fragmentos y se asignan a un hablante nuevo (verificado en el motor sin diarización).
6. **Sin depender del color (1.4.1):** cada hablante se distingue por **texto** (etiqueta) y por una **marca de forma** con su letra (`aria-hidden`; el texto ya la dice). Un color por hablante es solo complemento y solo si el tema define categorías (`--g-color-cat-k`; por defecto `categories: 0`, hallazgo T3).
7. **Motor sin diarización** (`capabilities.diarization: false`): aviso visible en la vista («El motor no distingue hablantes. Marca fragmentos y usa «Asignar hablante»…»), todos «Sin asignar» (marca de borde discontinuo), asignación por fragmento o por selección a hablantes creados por el usuario (`origin: 'user'`). Sin la marca «Hablante cambiado» cuando el motor no dio ninguno. Verificado, con deshacer que quita también el hablante creado.

## 11. Destinos

1. **Registro ligado al modelo, no al DOM.** Un destino es `{ id, label, get(), set(value), field?, multiline? }`: `get`/`set` leen y escriben **el estado del formulario** de la app (el mismo que usa `v-model`), así que funciona con el campo **desmontado** (otra pestaña o paso; verificado con «Plan»). `field` (id del control, opcional) solo sirve para recordar su cursor y su selección. `multiline: false` para campos de una línea (los saltos pasan a espacios; verificado). **Cambio sobre lo reservado en la F1** (`insert(text) → { undo() }`): con `get`/`set` Grana resuelve posición, separadores, deshacer seguro y marca de uso igual para todas las apps; `insert` queda como **vía de escape** opcional para destinos que no son texto plano (editores enriquecidos), con la misma firma de deshacer (hallazgo L5).
2. **Cómo se registran:** `speech.targets.register(target)` → función para darlo de baja; composable `useSpeechTarget(target)` que lo registra mientras viva **el componente que tiene el modelo** (la página del formulario, no el campo: si lo registrara el campo, desaparecería al cambiar de pestaña). `GTranscript` suelto acepta `targets` como prop (sin gestor).
3. **Qué se inserta** (radio «Qué»): «Todo (N)» · «Fragmentos marcados (N)» · «Texto seleccionado «…»». Por defecto la fuente más específica disponible (una selección nueva la activa). Además, en el menú de cada fila, «Insertar en {campo}» (ese fragmento, al final).
4. **Dónde** (radio «Dónde»): «Al final» (por defecto: predecible) · «En la posición del cursor» · «Sustituir la selección del campo «…»». Las dos últimas solo si Grana conoce el cursor o la selección del campo **y el valor no cambió desde entonces** (se recuerdan al teclear, seleccionar o salir del campo); si no, deshabilitadas con «(sin posición conocida)». Separadores: al final, salto de línea (o espacio en una línea) si lo anterior no acaba en blanco; en el cursor, un espacio a cada lado si hace falta. Verificado: «Cefalea. » + texto + « Dolor.».
5. **«Con hablantes»** (casilla, activa por defecto en conversación: sin prefijo, las palabras de dos personas se mezclan y se pierde quién dijo qué). **Vista previa** del texto exacto antes de insertar (3.3.4: comprobar antes de enviar). Botón con el destino en el nombre: «Insertar en Plan».
6. **Deshacer la inserción:** cada inserción guarda el valor anterior y el posterior; **solo la última de cada campo** se puede deshacer y **solo si el campo no cambió después** (como el deshacer del dictado F1, #222). Aparece junto al resultado («Insertado en Plan: 4 fragmentos. · Deshacer inserción») y en «Usos de esta transcripción». Si el campo cambió: no toca nada y anuncia «No se puede deshacer: Plan cambió después de la inserción.» (verificado). Deshacer quita el uso de `derived` y la marca de los fragmentos (verificado).
7. **Marca de uso por fragmento:** «Usado en Motivo, Plan» en cada fragmento usado (también con texto parcial); «Cambió después de insertarlo» si se corrige luego. Nada se propaga solo al campo.
8. **Foco:** se queda en «Insertar» (no se roba al campo, 3.2.2); el campo montado se actualiza por su `v-model`.

## 12. Dónde vive

1. **Durante la grabación, en el panel del anfitrión** (conversación): `GTranscript compact` sustituye a la lista de solo lectura de la F1 (§6.5 del contrato). Se puede corregir, eliminar, cambiar de hablante y deshacer mientras se graba. Acción nueva en el panel: «Revisar» (captura y pausa: secundaria; `completed`: **principal**, «Revisar transcripción»).
2. **Revisión en la página de la app (recomendada):** la app coloca `<GTranscript :transcript="speech.state.transcript">` junto a su formulario (solo ella conoce su maquetación: un panel superpuesto taparía campos, 2.4.11). Un `GTranscript` montado y ligado al transcript de la sesión se **registra como superficie de revisión** en el gestor: «Revisar» lleva el foco a su título (`tabindex="-1"`) y lo desplaza a la vista (verificado).
3. **Respaldo del anfitrión:** si no hay superficie registrada, «Revisar» abre un **diálogo modal** del anfitrión (forma de `GDialog`, pantalla completa bajo `space × 130`) con el mismo `GTranscript` y los mismos destinos (se insertan por el modelo aunque el formulario quede inerte detrás). Los canales vivos se trasladan a él (F1 #213, verificado); foco al título al abrir y de vuelta a «Revisar» al cerrar; Esc en el editor o en un menú no lo cierra (verificado).
4. **Sin sesión:** `createTranscript(json)` carga lo que guardó la app (correcciones, roles, usos) y `GTranscript` funciona igual (editable, solo selección o solo lectura), con su propia región de estado (verificado). El historial empieza vacío.
5. **Sesiones de horas a pantalla completa en móvil** siguen siendo F3; el diálogo de respaldo ya es pantalla completa en móvil.

## 13. Integración

1. **Dictado: sin cambios** (F1 #222): inserción en vivo al cursor y «Deshacer dictado». En el panel, el dictado conserva la lista de solo lectura (corregir se hace en el propio campo).
2. **Conversación: gana la revisión** (§12) y el cierre: `close()` entrega `toJSON()` con las tres capas (verificado). **Descartar** tras haber insertado: los textos insertados **se quedan** en los campos (ya son del usuario); la confirmación lo dice (`labels.actions.discardAskUsed` con `{count}`, hallazgo L6).
3. **Formularios (`GForm`, `GFormSection`, `GInput`, `GTextarea`, `useFormField`):** **sin API nueva en los campos**. La inserción escribe en el modelo; el campo se actualiza por `v-model`; la validación de la app reacciona al valor como a cualquier otro cambio programático (no se marca como «tocado»: no se revelan errores por insertar). El destino se registra con el mismo nombre de campo que usa la app (`id` del destino = `name` de `useFormField` recomendado, para que la app relacione errores y usos). `GErrorSummary` no cambia.
4. **`GTranscript` dentro de un `GForm`** no es un campo (no se registra en `useFormField`): no lleva `name` ni valor de formulario.

## 14. Rendimiento

1. **Decisión: sin virtualizar en la F2.** Una lista virtual rompería lo que la revisión necesita: buscar con Ctrl+F, seleccionar texto de varios fragmentos con el ratón, copia nativa, lectura completa con el lector y anclas estables para el foco itinerante. Con cientos de fragmentos el coste es aceptable si **solo se repinta lo que cambia**: filas con clave, **celdas con firma**, provisional en su fila, menús creados al abrirse, barra e inserción que solo rehacen su estructura si cambia algo que no sea texto (así un `select` abierto no se cierra al llegar fragmentos).
2. **Medido** (Chromium, `verificar.mjs`, teclas a ritmo de repetición, 40 ms): **320 fragmentos** (≈ 30-40 min de conversación): ~5 800 nodos; construcción ~40 ms; hasta el pintado 160–300 ms; **cada tecla < 40 ms hasta el pintado** (peor: Ctrl+A, que repinta 320 filas); Event Timing: máximo 32–48 ms. **1000 fragmentos** (informativo): pintado 320–460 ms, ~18 000 nodos, peor tecla ~70–80 ms (Ctrl+A). Todo por debajo de los 200 ms de INP «bueno».
3. **Umbral para la F3:** por encima de ~2 000 fragmentos (sesiones de horas) hará falta virtualizar, con `aria-rowcount`/`aria-rowindex`, y aceptar sus pérdidas (búsqueda, selección de texto). **`content-visibility: auto` por fila se probó y se descarta en la F2:** gana ~50 ms en el primer pintado pero deja filas **en blanco un fotograma** al saltar con el desplazamiento.
4. **Durante la captura:** un provisional repinta **una** fila; un confirmado inserta **una** fila y actualiza contadores.

## 15. Móvil (320 px)

Las filas se apilan por el **ancho de `GTranscript`** (consulta de contenedor; nunca el visor, como #69/#130): arriba casilla · hora · hablante · acciones; debajo el texto a todo el ancho (verificado: ~270 px de texto). La etiqueta del hablante se parte en vez de recortarse. Objetivos ≥ 24 px (≥ 44 px con puntero grueso). El menú se recoloca dentro del visor; la barra se parte en varias líneas (hallazgo C3: desbordamiento a «Más»); la inserción se apila. El diálogo de respaldo ocupa la pantalla. **Verificado** sin desbordamiento horizontal (página, cada `GTranscript`, menú, inserción, diálogo).

## 16. Qué reutiliza y qué no

| Reutiliza | Para |
| --- | --- |
| Modelo y forma del transcript de la F1 (§1.4) | Capas; F2 solo llena y añade |
| `GMenu` | Acciones por fila, hablante, copiar, asignar |
| `GBtn`, `GIcon`, `GCheckbox`, `GSelect`, piel de `GTextarea` | Botones, iconos, selección, rol y destino, editor |
| `GDialog` (forma) y traslado de canales de la F1 | Revisión de respaldo |
| Canales del anfitrión (F1 #219) | Anuncios dentro de la sesión |
| Convenciones de `GTable` | `v-model:selected`, «Seleccionar todo» mixto, tono de fila seleccionada, apilado por contenedor |
| Deshacer del dictado (F1 #222) | Regla «válido mientras el campo no cambie» de las inserciones |

| No usa | Razón |
| --- | --- |
| `GTable` | Tabla de datos sin edición en celda; la transcripción necesita rejilla APG |
| `contenteditable` (editor de documento tipo procesador) | Mezclaría capas (el literal no se puede proteger), accesibilidad desigual, imposible mapear provisionales y fragmentos con fiabilidad |
| Arrastrar fragmentos a los campos | Sin alternativa sencilla equivale a 2.5.7; el registro de destinos ya resuelve el caso con un clic |
| `GToaster` para «Insertado · Deshacer» | El resultado se muestra en la propia barra de inserción (persistente, al lado del botón); un aviso efímero con acción violaría el tiempo suficiente (2.2.1) para el deshacer |

## 17. Comprobaciones ejecutadas

`node design/lab/speech/r02/verificar.mjs`: Playwright (Chromium de `design/lab/theme-playground/node_modules`), servidor propio en 4252; **123 comprobaciones, todas correctas en seis ejecuciones seguidas**; consola sin errores ni avisos. Incluye:

- **Regiones vivas:** 2 canales del anfitrión + 1 del GTranscript sin anfitrión; nada más.
- **Edición sin pisar parciales:** editor abierto mientras llegan ≥ 2 confirmados y ≥ 3 provisionales; foco, borrador y cursor intactos; literal intacto y corregido aparte; la otra vista lo refleja; un `tabindex="0"`.
- **Anuncios sin spam:** uno por corrección, ninguno con texto transcrito, 0 en 2,5 s de captura sin acciones, acciones encadenadas → un anuncio (el último), deshacer/rehacer anunciados con la acción.
- **Teclado:** flechas, Inicio/Fin, Ctrl+Inicio/Fin, foco itinerante; Supr / Ctrl+Z / Ctrl+Mayús+Z; menú con foco en el primer elemento y vuelta al botón.
- **Capas:** ver original con `<ins>`/`<del>` y prefijo oculto; volver al original y deshacerlo; reasignar sin tocar `engineSpeaker`; roles en dos vistas; unir y deshacer; relabel con el editor abierto; Esc cancela sin guardar.
- **Selección y copia:** Mayús+Espacio, Mayús+↓, `aria-selected`, contador, Ctrl+A ida y vuelta, Mayús+clic en rango; copiar texto y con hablantes y horas (portapapeles real); copia nativa limpia.
- **Destinos:** inserción en Plan **desmontado** con hablantes por el modelo; `v-model` al montar; marcas de uso; `derived`; deshacer; deshacer bloqueado tras editar el campo (y anunciado); texto seleccionado en el cursor con separadores; campo de una línea.
- **Revisión:** finalizar sin provisional; anuncio de fin; «Revisar» con revisión en la página (foco al título) y sin ella (diálogo, foco, canales trasladados y devueltos, Esc en editor y menú no cierra, Esc en la rejilla cierra, foco de vuelta); `onComplete` con las tres capas.
- **Sin diarización:** aviso, «Sin asignar», asignación de la selección a un hablante nuevo y deshacer; fragmento fallido sin acciones; un participante sin columna de hablante.
- **Guardado sin sesión:** edición, región propia, usos y reasignaciones guardados; modos solo selección y solo lectura.
- **Largo:** 320 fragmentos medidos (§14.2); 1000 informativo.
- **320×640 con táctil:** sin desbordamiento, fila apilada, objetivos ≥ 24 px, menú, inserción y diálogo dentro del visor.
- `packages/vue/scripts/check-icons.mjs`: 0 infracciones.

## 18. Qué NO verifiqué

- **Lector de pantalla real** (NVDA, JAWS, VoiceOver, TalkBack): la rejilla en modo foco y la lectura de corrido en modo exploración, la doble información `aria-selected` + casilla (posible redundancia «seleccionado, casilla marcada»), los `<del>`/`<ins>` con prefijo, el editor dentro de la celda, el anuncio de «N fragmentos seleccionados». **Riesgo principal**, como en la F1.
- **Firefox y WebKit/Safari:** consultas de contenedor en la fila, `selectionchange` y el mapeo de la selección, `ClipboardEvent` y `navigator.clipboard` (permisos distintos), Esc dentro de `<dialog>` con `preventDefault` en el editor.
- **Móvil real:** selección de texto táctil (asas del sistema) para «Texto seleccionado», teclado virtual con el editor abierto en la hoja, pulsación larga.
- **Teclados no QWERTY e IME** con los atajos (Ctrl+Z con distribución AZERTY, `isComposing`).
- Rendimiento en equipos lentos y con el lector activo; sesiones de más de 1000 fragmentos.
- `forced-colors`, zoom 200 %, RTL (la columna de acciones y el borde de selección usan propiedades lógicas en el prototipo, sin probar).
- Validación de formularios reales (`GForm`) reaccionando a una inserción (el prototipo usa un formulario imitado).

## 19. Hallazgos para lima (API y tokens, sin valores)

| # | Hallazgo | Severidad | Propuesta |
| --- | --- | --- | --- |
| L1 | Entrega F2 | Alta | Exportar de `@grana/vue/speech`: `GTranscript`, `createTranscript(data?)`, `useSpeechTarget(target)`; el gestor gana `speech.targets` (`register`, `list`) y la opción `roles`. ¿`GTranscript` en `@grana/vue/speech` o en `@grana/vue`? Recomendación: en `speech` (depende del modelo y del registro; quien no usa voz no lo paga, #238) |
| L2 | Forma del transcript (aditiva) | Alta | `speakers[]` + `role`, `mergedInto`, `origin`; `derived[]` con `kind: 'insert'` reservado por Grana (`at`, `target {id,label}`, `position`, `sources`); `segments[]` sin cambios. `toJSON()` sin historial |
| L3 | Operaciones del modelo | Alta | Lectura: `segment(id)`, `textOf(seg)`, `speakerOf(seg)`, `resolve(id)`, `letter(id)`, `usesOf(id)`, `compose(source, { withSpeakers, withTimes, multiline })`, `canUndo`, `canRedo`. Usuario (con historial): `edit(id, text)`, `revert(id)`, `remove(ids)`, `restore(ids)`, `assignSpeaker(ids, speakerId \| 'new')`, `addSpeaker()`, `setRole(speakerId, roleId \| null)`, `mergeSpeakers(from, into)`, `unmerge(id)`, `undo()`, `redo()`; la app añade sus derivados con `addDerived(entry)` (sin historial). Eventos del motor: internos del gestor. Devuelven si hubo cambio. `source` = `{ kind: 'all' } \| { kind: 'segments', ids } \| { kind: 'text', parts }` |
| L4 | Props y eventos de `GTranscript` | Alta | Props: `transcript` (obligatoria), `editable` (`true`), `selectable` (`true`), `selected` (`v-model:selected`), `targets` (por defecto `speech.targets` si hay gestor), `roles` (por defecto la opción del gestor), `diarization` (por defecto la capacidad del adaptador de la sesión; `true` suelto), `compact` (`false`), `copy` (`true`), `labels`. Nombre por `aria-labelledby` o `label`. Eventos: `update:selected`, `edit` (`{ id, kind }`), `insert` (entrada de `derived`), `undo-insert`, `copy` (`{ count }`, sin texto). Métodos por `ref`: `focus()`, `undo()`, `redo()`. Sin slots en v0.1 |
| L5 | Destinos (cambia lo reservado en §18) | Alta | `{ id, label, get(), set(value), field?, multiline? }` en lugar de `insert(text) → { undo() }`; `insert(text, { position }) → { undo() → Boolean }` opcional como vía de escape para destinos que no son texto plano. Posiciones `end` · `cursor` · `selection`; deshacer solo la última inserción de cada campo y solo si no cambió |
| L6 | Anfitrión | Media | Panel en conversación: `GTranscript compact` en `__transcript`; acción «Revisar» (`labels.actions.review` en captura/pausa, `labels.actions.reviewCompleted` principal en `completed`); superficie de revisión registrada por un `GTranscript` ligado a `state.transcript` (interno); si no hay, **diálogo de respaldo** del anfitrión (modal, forma de `GDialog`, pantalla completa bajo `space × 130`, canales trasladados); `discardAsk` con usos → `labels.actions.discardAskUsed` (`{count}`) |
| L7 | Adaptador: evento `speakers` | Media | Semántica: `{ relabel: Record<idDelMotor, idDelMotor> }` cambia `engineSpeaker` (capa literal) y el hablante del provisional; no toca `speaker` del usuario ni el historial; ids nuevos se añaden a `speakers[]` (`origin: 'engine'`) |
| L8 | Textos (sin valores por defecto) | Media | `transcript.*`: `cols.{sel,time,spk,text,act}`, `speakerRole` (`{role}`, `{letter}`), `newSpeaker`, `engineSpeaker`, `flags.{corrected,speaker,removed,used,stale,partial,failed}`, `orig`, `diff`, `origSpeaker`, `delPrefix`, `insPrefix`, `editLabel`, `editGroup`, `editHint`, `save`, `cancel`, `pick`, `actions`, `changeSpeaker`, `menu.*`, `bar.*` (con `count` plural), `copyText`, `copyFull`, `kbd`, `noDiarization`, `empty`, `newer` (plural), `speakers.*` (gestor), `insert.*`, `announce.*` (los de §9.3). Las del prototipo sirven de redacción de ejemplo |
| L9 | Editor en la celda | Media | Es un `textarea` nativo con la piel de `GTextarea` (no un `GTextarea` completo, que trae etiqueta, mensaje y su propio contexto de formulario): ¿clase compartida `g-textarea__control` o alias de coco? Lima decide |
| L10 | Avisos de desarrollo | Baja | `GTranscript` sin `transcript`; destino sin `get`/`set` ni `insert`; dos destinos con el mismo `id`; `roles` con `id` repetidos; `assignSpeaker` a un hablante inexistente; `mergeSpeakers` en ciclo. Nunca con texto transcrito |
| L11 | Constantes de comportamiento | Baja | Pila de historial (200), margen «al final» para seguir (32 px), paso de RePág (10 filas), espera de `selectionchange` (80 ms). Como `SPEECH_TIMING`, no tema |
| T1 | Tokens: ninguno nuevo | Media | Fila seleccionada: el tono de `GTable` (`--g-color-primary-soft`) + borde de inicio en `text` (forma, no solo color); foco: `--g-color-focus`; provisional: el de la F1 (`text-muted`, cursiva, ≥ 4.5:1); eliminado: `text-muted` + tachado; `<ins>`/`<del>`: subrayado/tachado (el color, si coco lo usa, `success-text`/`danger-text`, nunca solo); marcas: `caption` `muted` con icono; separadores y ritmo derivados de `space` |
| T2 | Contraste | Alta (coco) | Texto tachado y provisional ≥ 4.5:1; marca de letra del hablante ≥ 3:1 (borde) y su borde discontinuo «Sin asignar»; borde de fila seleccionada 3:1; `forced-colors` (fila seleccionada con `Highlight`) |
| T3 | Color por hablante | Baja (coco) | Opcional, de `--g-color-cat-k` solo si el tema define `categories ≥` número de hablantes; si no, sin color (la letra y el texto bastan). Nunca la única señal |
| I1 | Iconos | Media | Entran en `icons.md` §4 (los usa `GTranscript`): los cinco reservados F2 `text-cursor-input`, `undo-2`, `trash`, `pencil`, `copy` **y además** `redo-2`, `user-plus`, `merge`, `split`, `git-compare`, `users` (nombres canónicos comprobados en `lucide-static` 1.49.0: el prototipo los importa por su marca `lucide-<nombre>`). Ya en la librería: `ellipsis-vertical`, `arrow-down`, `info`, `check`, `x`, `triangle-alert`, `rotate-ccw`, `circle-check`. El icono de «Revisar» del panel (`list` en el prototipo, no está en la lista) lo decide lima con coco |
| C3 | Barra en estrecho (coco/lima) | Baja | Bajo ~`space × 120` la barra ocupa 5-6 líneas: proponer que las secundarias (copiar, mostrar cambios, hablantes) pasen a un `GMenu` «Más» |

## 20. Preguntas de producto realmente abiertas

1. **¿Hace falta una marca de «revisado»?** El brief dice que la conversación «se revisa antes de distribuirse», pero no dice si alguien debe **confirmarlo** (p. ej. una casilla «He revisado la transcripción» que la app pueda exigir antes de insertar o cerrar, y que quede en los datos con fecha). En entornos clínicos o legales puede ser un requisito. **Recomendación:** no en v0.1 (Grana no certifica revisiones, como no certifica el consentimiento, #207); si la app lo necesita, lo guarda en su propio `derived` (`kind` propio). Si el usuario lo quiere en Grana: opción `requireReview` que habilita insertar y cerrar solo tras marcarla.

Sin pregunta (propuestas kiwi derivadas de estándar o del brief, pendientes de visto bueno): rejilla APG con una parada; modo edición en la celda (Intro/F2, Esc, salir guarda); vacío = eliminar; eliminados visibles en su sitio; historial en el modelo, compartido entre vistas y fuera de `toJSON()`; Ctrl+Z solo en la rejilla; inserciones con deshacer propio separado; destinos por `get`/`set` registrados donde vive el modelo; «Al final» por defecto; «Con hablantes» activo por defecto en conversación; texto seleccionado sin prefijos; revisión recomendada en la página con diálogo de respaldo; sin virtualizar en la F2; sin nombres propios para hablantes (solo roles de la app); color por hablante solo como complemento.
