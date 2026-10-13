# NVDA en Windows (Firefox y Chrome)

Prefijo de pasos: **NV**. Lee antes el [README](./README.md) (qué es «bloquea 0.1.0», cómo registrar). Tiempo estimado: **2 h 30 min** en Firefox, completo; **2 h** solo los `[BLOQUEA 0.1.0]`; **1 h** solo el núcleo (los marcados `núcleo`). En Chrome, **+40 min** haciendo solo los 11 pasos marcados «también en Chrome».

## Preparación (15 min)

1. Windows con NVDA actual (anota versiones de Windows, NVDA, Firefox y Chrome). Sirve el playground (README § Qué preparar). Si el servidor está en otro equipo, `http://<IP>:4173/playground/`. Modo **Claro**, Tema **Por defecto**.
2. **Visor de voz** de NVDA: menú de NVDA (`NVDA+N`) → Herramientas → Visor de voz. Déjalo abierto: lo que dice NVDA queda escrito y se copia a la plantilla.
3. Configuración de NVDA por defecto (en especial: «Cambiar automáticamente al modo foco cuando cambia el foco» **activado** y «Cambiar al modo foco al mover el cursor del sistema» activado). Anótalo si lo cambiaste.
4. Chrome: abre `chrome://accessibility` y comprueba que la accesibilidad nativa está activa; desactiva extensiones.
5. **Tecla NVDA** = `Insertar` (o `Bloq Mayús` si lo configuraste). En este guion, `NVDA+x` es esa tecla más `x`.
6. Los pasos se hacen **primero en Firefox**. Los marcados «también en Chrome» se repiten después en Chrome.

## Chuleta de NVDA

| Para | Teclas |
| --- | --- |
| Alternar modo exploración / modo foco | `NVDA+Espacio` (NVDA suena distinto al cambiar) |
| Leer línea actual / todo | `NVDA+↑` / `NVDA+↓` |
| Siguiente / anterior elemento en exploración | `↓` / `↑` |
| Saltar por tipo (exploración) | `H` encabezado, `F` campo de formulario, `B` botón, `K` enlace, `T` tabla, `D` punto de referencia, `L` lista, `E` campo de edición, `X` casilla, `R` radio, `M` marca, `Mayús+letra` hacia atrás |
| Lista de elementos | `NVDA+F7` |
| Celdas de una tabla | `Ctrl+Alt+flechas` |
| Silenciar la voz | `Ctrl` |
| Foco del teclado actual | `NVDA+Tab` |

**Modo exploración** (cursor virtual): las flechas leen la página y las letras saltan. **Modo foco**: las teclas van al control (NVDA entra solo al tabular a un campo o al abrir un menú). Los pasos dicen cuándo comprobarlo.

**Cómo leer «Debe oírse»:** nombre, rol y estado son lo exigible; el orden y las palabras exactas varían entre lectores. Entre comillas, el texto del playground.

---

## Formularios

### NV-01 · GForm: enviar vacío · `#sec-form` · [BLOQUEA 0.1.0] · **núcleo** · también en Chrome
**Hacer:** en «Formulario corto», recorre con `F` (o `Tab`) los campos; llega a «Enviar» y actívalo con `Intro` sin escribir nada.

**Debe oírse / verse:**
- Cada campo: **etiqueta, «campo de edición», «obligatorio»** (Extensión y Comentarios no); la ayuda de Correo se oye como descripción.
- Al enviar: el foco **salta al resumen de errores** y NVDA lee la alerta con «Hay N problemas con el formulario» (N = Nombre, Apellido, Correo y Teléfono, confirma en pantalla) y la lista de enlaces.
- Los mensajes en línea **no se repiten** solos tras el envío.

**Bloquea si:** el foco no llega al resumen, el resumen no se oye de ningún modo, los enlaces no tienen nombre, o un obligatorio no dice que lo es.

**Nota (no bloquea):** título oído dos veces (alerta + foco).

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### NV-02 · GForm: del resumen al campo · `#sec-form` · [BLOQUEA 0.1.0]
**Hacer:** en el resumen, `Intro` sobre el enlace de «Correo».

**Debe oírse / verse:** el foco pasa al campo (NVDA cambia a modo foco), con su **etiqueta a la vista**, y se oye nombre, «obligatorio», «entrada no válida» (o equivalente) y el error como descripción.

**Bloquea si:** el foco se queda en el enlace o en `body`, o el campo no dice su error.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### NV-03 · GForm: corregir y salir · `#sec-form` · [no bloquea]
**Hacer:** en Correo escribe `ana`, `Tab`; vuelve y completa `@correo.mx`.

**Debe oírse / verse:** el elemento sale del resumen **en silencio**; con valor aún inválido, el mensaje en línea se anuncia de forma cortés al salir.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### NV-04 · GInputGroup: teléfono fusionado · `#sec-form` · [BLOQUEA 0.1.0]
**Hacer:** recorre el conjunto «Teléfono» con `Tab`: selector de país y número.

**Debe oírse / verse:** «Teléfono, grupo»; cada parte dice **etiqueta + parte** («Teléfono Código de país», «Teléfono …», campo de edición, obligatorio); las partes se distinguen.

**Bloquea si:** una parte no tiene nombre o dos partes suenan idénticas.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### NV-05 · GFormReveal: campos condicionales · `#sec-form` · [BLOQUEA 0.1.0] · **núcleo**
**Hacer:** en «Bloque condicional», en «¿Requiere factura?» cambia con las flechas a «Sí» y pulsa `Tab`; escribe algo en el primer campo; vuelve a «No» y a «Sí».

**Debe oírse / verse:** al elegir «Sí» **nada se anuncia** del bloque; `Tab` entra en el **primer campo nuevo**; con «No», los campos del bloque no se enfocan ni aparecen en `NVDA+F7`; al volver a «Sí», **lo escrito sigue**.

**Bloquea si:** el bloque abierto no se alcanza; el cerrado sigue enfocable o legible; o se pierde lo escrito.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### NV-06 · GFormSection plegable y agregable · `#sec-form` · [BLOQUEA 0.1.0]
**Hacer:** en «Secciones fuera de GForm», con `H` localiza «Notas de la consulta»; actívalo dos veces; luego la sección agregable y quitar lo agregado.

**Debe oírse / verse:** el título es **encabezado y botón** («botón, contraído/expandido»); el foco se queda en el botón; al quitar una sección con datos, un **diálogo de alerta** pide confirmar y el foco no cae en `body`.

**Bloquea si:** no se oye el estado, o el foco se pierde.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

---

## Tabla, filtros y carga

### NV-07 · GTable: estructura · `#sec-table` · [BLOQUEA 0.1.0] · **núcleo** · también en Chrome
**Hacer:** con `T` salta a la tabla «Clientes»; recorre celdas con `Ctrl+Alt+flechas`; luego `Tab` por los controles.

**Debe oírse / verse:** «tabla con N columnas y M filas, Clientes»; al cambiar de celda NVDA lee el **encabezado de columna**; `Tab` recorre solo los controles (es tabla de datos, no rejilla).

**Bloquea si:** no se reconoce como tabla o las celdas no dicen su columna.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### NV-08 · GTable: orden · `#sec-table` · [BLOQUEA 0.1.0]
**Hacer:** `Tab` hasta el encabezado «Cliente» y `Intro`; otra vez.

**Debe oírse / verse:** estado de orden en el encabezado («ordenado ascendente/descendente») y el anuncio «Ordenado por Cliente, ascendente»; el foco se queda.

**Bloquea si:** el orden cambia sin estado ni anuncio.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### NV-09 · GTable: selección · `#sec-table` · [BLOQUEA 0.1.0]
**Hacer:** marca una fila, «Seleccionar todo», desmarca una fila (`Espacio` en modo foco o `Intro` en exploración).

**Debe oírse / verse:** cada casilla con nombre («Seleccionar [cliente]»); «todo» pasa por marcada / **parcialmente marcada** / sin marcar; se anuncia «N seleccionados».

**Bloquea si:** una casilla sin nombre o estado mixto mudo.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### NV-10 · GFilterBar · `#sec-table` · [BLOQUEA 0.1.0]
**Hacer:** «Agregar filtro» → «Plan» → «Pro» → «Aplicar». Prueba aplicar sin valor. Recorre el chip («Editar filtro: …», «Quitar filtro: …») y quítalo.

**Debe oírse / verse:** grupo «Filtros de clientes»; el editor como diálogo con nombre («Filtrar por Plan») y el foco dentro; error «Indica un valor para aplicar el filtro.» **anunciado**; recuento «N resultados» tras filtrar.

**Bloquea si:** el editor no se anuncia, un botón no tiene nombre, o el resultado de aplicar/quitar no se comunica.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### NV-11 · GTable: carga · `#sec-table` · [BLOQUEA 0.1.0] · **núcleo** · también en Chrome
**Hacer:**
1. **Anuncio:** «Simular carga» y espera; luego «Carga lenta (6 s)».
2. **Foco:** abre la consola (`F12`), pega `setTimeout(() => document.querySelector('#tb-simulate').click(), 5000)`, `Intro`, y en 5 s lleva el foco a la casilla de la 3.ª fila. Si no puedes, anota «paso 2 no probado».

**Debe oírse / verse:** a ~200 ms «Cargando clientes…»; a los 5 s (carga lenta) «Sigue cargando clientes…» una vez; al terminar «N resultados». Paso 2: el foco pasa a la tabla durante la carga y vuelve **a la misma casilla de la misma fila**; nunca queda en `body`.

**Bloquea si:** la carga o su fin no se anuncian de ningún modo, o el foco cae en `body`.

**Nota:** si NVDA calla mientras la tabla está ocupada (`aria-busy`), anótalo.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### NV-12 · GTable: fallo y reintentar · `#sec-table` · [BLOQUEA 0.1.0]
**Hacer:** «Simular fallo»; espera; «Reintentar».

**Debe oírse / verse:** «No se pudieron actualizar los clientes. Lo que ves es lo último que llegó.»; «Reintentar» es un botón alcanzable con teclado; la nueva carga se anuncia.

**Bloquea si:** el fallo no se anuncia o «Reintentar» no es operable.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

---

## Menús y diálogos

### NV-13 · GMenu en la fila · `#sec-table` · [BLOQUEA 0.1.0] · **núcleo** · también en Chrome
**Hacer:** `Tab` hasta «Acciones de [cliente]»; ábrelo con `Intro`/`Espacio`/`↓`; ↑↓; elige «Ver»; reabre y `Esc`.

**Debe oírse / verse:** botón «Acciones de [cliente], menú»; al abrir, NVDA entra en modo foco y dice «menú» y «Ver, elemento de menú»; `Esc` cierra y **el foco vuelve al botón**; al elegir se actualiza «Última acción».

**Bloquea si:** no se oye como menú, elementos sin nombre, o el foco se pierde al cerrar.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### NV-14 · GMenu: teclado y submenús · `#sec-menu` · [BLOQUEA 0.1.0]
**Hacer:** «Acciones»: abre con `Espacio`, con `↓` y con `↑`; `Inicio`, `Fin`, una letra (typeahead), `→` para submenú, `←`, `Tab`; elementos marcables y deshabilitado.

**Debe oírse / verse:** `↓` abre en el primero y `↑` en el último; los marcables dicen **marcado/no marcado**; el submenú dice «tiene submenú» y su estado; `Esc` en el submenú cierra solo ese nivel.

**Bloquea si:** un estado marcado no se oye o falta una forma de abrir/cerrar con teclado.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### NV-15 · GDialog simple · `#sec-dialog` · [BLOQUEA 0.1.0] · **núcleo** · también en Chrome
**Hacer:** abre «Con inset y pie»; recorre con `Tab`; `Esc`; repite con «Guardar» y con el botón de cierre.

**Debe oírse / verse:** «Guardar cambios, diálogo» con su descripción; foco en el primer control del contenido (no en el botón de cierre); `Tab` **no sale** del diálogo; el cierre se llama «Cerrar»; al cerrar el foco **vuelve al botón** que lo abrió; el fondo no se puede leer ni recorrer mientras está abierto.

**Bloquea si:** no es diálogo con nombre, se sale con `Tab`/flechas, o el foco no vuelve.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### NV-16 · GDialog confirmación, scroll y cambios sin guardar · `#sec-dialog` · [BLOQUEA 0.1.0]
**Hacer:** «Confirmación»; luego «Con scroll» (flechas con el foco en el cuerpo); «Con cambios sin guardar» + `Esc`.

**Debe oírse / verse:** «¿Eliminar el proyecto?», **diálogo de alerta**, y se oye su descripción al abrir; el cuerpo desplazable se identifica como región con el nombre del título y se puede desplazar con teclado; con cambios sin guardar `Esc` no cierra, el botón «Cerrar» sí.

**Bloquea si:** la descripción de la confirmación no se oye al abrir, o el cuerpo largo no se puede desplazar con teclado.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

---

## Búsqueda y selección

### NV-17 · GCombobox: buscar y elegir · `#sec-combobox` · [BLOQUEA 0.1.0] · **núcleo** · también en Chrome
**Hacer:** en «Paciente entre miles», enfoca «Paciente» (NVDA pasa a modo foco), escribe `mar`, espera 1 s; ↓ tres veces, ↑, `Intro`; vuelve a escribir y `Esc`; `Tab` a «Limpiar Paciente».

**Debe oírse / verse:**
- «Paciente, cuadro combinado, obligatorio, contraído/expandido»; **un** anuncio de resultados a los ~600 ms («N de 2 400 resultados» o parecido).
- ↓/↑ anuncian cada opción («…, 3 de 20») con **el foco en el campo**.
- `Intro` elige y cierra; `Esc` cierra y conserva el texto; **enfocar no abre**.
- «Limpiar Paciente» es un botón.

**Bloquea si:** las opciones no se anuncian al navegar, no dice que es un cuadro combinado con estado, o no se puede elegir con teclado.

**Nota (no bloquea):** el eco de escritura y el texto fantasma, si suenan raros.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### NV-18 · GCombobox: homónimas, paleta, error y «Mostrar más» · `#sec-combobox` · [no bloquea]
**Hacer:** busca `maria garcia`; elige una; prueba la paleta; «Fallar la próxima búsqueda» → escribe → «Reintentar»; en la lista de 500 «Mostrar más».

**Debe oírse / verse:** la línea secundaria (expediente, edad) se oye como descripción; las filas de acción se oyen como opciones con número; el fallo se anuncia.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### NV-19 · GCombobox en un GDialog · `#sec-combobox` · [BLOQUEA 0.1.0] · **núcleo**
**Hacer:** «Abrir diálogo» de esa sección; busca; `Esc` dos veces.

**Debe oírse / verse:** los resultados **se anuncian dentro del modal**; el primer `Esc` cierra la lista, el segundo el diálogo.

**Bloquea si:** dentro del modal no se anuncia nada al buscar.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### NV-20 · GCombobox multiple · `#sec-combobox-multiple` · [BLOQUEA 0.1.0] · **núcleo**
**Hacer:** en «A · La frase»: abre con ↓, marca 3 con `Intro` (la lista sigue abierta), desmarca una, agrega texto libre, `Esc`, `Retroceso` ×2, `Ctrl+Z`. Después B (3 diagnósticos, tope, «Quitar», «Deshacer») y C (paleta, dos «Ana López Ruiz»).

**Debe oírse / verse:** cada gesto da **un anuncio** («[elemento] agregado, N elegidas», «quitado», «restaurado»); las opciones dicen **seleccionada/no seleccionada**; la descripción del campo lista todas las elegidas; en B los renglones son una lista numerada y el tope se anuncia.

**Bloquea si:** marcar/desmarcar no se comunica, o las elegidas no se pueden conocer.

**Nota (no bloquea):** anuncio duplicado con `aria-selected`.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### NV-21 · GSelect · `#sec-select` · [BLOQUEA 0.1.0]
**Hacer:** `Tab` al selector; `Espacio`/`↓` abre; ↑↓; `Intro` elige; `Tab` también elige; `Esc` cierra sin cambiar; prueba «Agregar nuevo…» si hay.

**Debe oírse / verse:** nombre, valor, «cuadro combinado / lista desplegable», expandido; cada opción con posición; el foco no sale del selector.

**Bloquea si:** el valor no se oye o no se opera con teclado.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

---

## Tooltip y ayudas

### NV-22 · GTooltip · `#sec-tooltip` · [BLOQUEA 0.1.0] · **núcleo** · también en Chrome
**Hacer:** «Barra de herramientas y riel»: `Tab` y flechas por los botones; `Esc`. Prueba «Publicar», «Archivar», «Borrar» (nativo deshabilitado) y «Abrir diálogo con barra».

**Debe oírse / verse:** cada botón de solo icono dice su **nombre**, y su descripción y atajo si los hay; el tooltip **nunca recibe foco** ni añade paradas; `Esc` lo cierra sin mover el foco; dentro del diálogo se oyen igual.

**Bloquea si:** un botón de solo icono suena sin nombre, o el tooltip roba el foco.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### NV-23 · GHelper · `#sec-helper` · [no bloquea]
**Hacer:** «Abrir ayuda» → `Intro`; `Tab`; `Esc`.

**Debe oírse / verse:** botón con estado expandido/contraído; contenido como diálogo no modal «Ayuda»; `Esc` devuelve el foco.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

---

## Captura de voz y transcripción

> Abre `…/playground/?speech=self#sec-speech`: el adaptador simula el micrófono (repetible y válido también por IP). Con micrófono real solo por `localhost`.

### NV-24 · Voz: dictado y pill · `#sec-speech` · [BLOQUEA 0.1.0] · **núcleo**
**Hacer:** «Dictar en Observaciones»; observa unos 10 s; `Mayús+F8` (foco a la pill); «Pausar»; «Reanudar»; `Mayús+F8`; «Finalizar».

**Debe oírse / verse:** «Grabando. Dictado en Observaciones.»; el texto transcrito entra en el campo y **NVDA no lo lee** (por diseño); la pill se identifica (estado y duración como `timer`); «En pausa. El micrófono no está capturando.»; «Pausar» pasa a «Reanudar» sin perder el foco; al final «Dictado terminado. Texto añadido a Observaciones.».

**Bloquea si:** inicio, pausa o fin no se anuncian, o el foco cae en `body`.

**Nota (no bloquea):** cómo se lee el `timer`.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### NV-25 · Voz: dentro de un modal · `#sec-speech` · [BLOQUEA 0.1.0] · **núcleo**
**Hacer:** «Abrir un diálogo modal»; dicta en «Nota de derivación»; cierra el diálogo con la grabación en curso.

**Debe oírse / verse:** los anuncios **se siguen oyendo dentro del modal**; la pill aparece dentro del diálogo; al cerrar, la sesión continúa.

**Bloquea si:** dentro del modal no se oye nada.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### NV-26 · Voz: conversación, panel y errores · `#sec-speech` · [no bloquea]
**Hacer:** «Grabar conversación» (casilla de aviso), cambia de pestaña, abre el panel, «Perder el servicio», «Restablecer», «Fallar el siguiente fragmento».

**Debe oírse / verse:** al abrir el panel el foco va a su título; se anuncian «Se perdió el servicio… La grabación continúa.», «Servicio de transcripción restablecido.» y el fragmento fallido.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### NV-27 · GTranscript: rejilla · `#sec-speech` · [BLOQUEA 0.1.0] · **núcleo**
**Hacer:** en «Transcripción guardada, sin sesión» entra con `Tab`; recorre celdas con ←↑↓→, `Inicio`/`Fin`, `RePág`. Comprueba qué modo usa NVDA (exploración vs foco) y repite con `NVDA+Espacio`.

**Debe oírse / verse:** tabla/rejilla con columnas Selección, Hora, Hablante, Texto, Acciones; cada celda dice su columna; **una sola parada de `Tab`**; las flechas actúan en la rejilla en modo foco (si NVDA las intercepta en modo exploración, anótalo).

**Bloquea si:** no se puede recorrer con teclado o no se sabe en qué celda se está.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### NV-28 · GTranscript: editar, seleccionar y deshacer · `#sec-speech` · [BLOQUEA 0.1.0]
**Hacer:** en una celda de Texto `Intro`, cambia una palabra, `Intro`; otra vez y `Esc`; `Espacio`/`Mayús+↓` para seleccionar; `Supr`; `Ctrl+Z`.

**Debe oírse / verse:** editor como grupo con nombre («Editar fragmento de las …»), con Guardar/Cancelar; anuncios «Fragmento de las … corregido. El original se conserva.», «N fragmentos seleccionados», «… eliminado. Puedes restaurarlo.», «Deshecho: …».

**Bloquea si:** editar no es posible con teclado o una eliminación no se comunica.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

---

## Controles de valor

### NV-29 · GSlider · `#sec-slider` · [BLOQUEA 0.1.0] · **núcleo** · también en Chrome
**Hacer:** valor único: `Tab` al volumen; → ← ↑ ↓, `Mayús+→`, `RePág`, `Inicio`, `Fin`; marcas con nombre; «sin elegir». Rango de precio: las dos asas; intenta cruzarlas; teclea una cifra en la píldora.

**Debe oírse / verse:** «Volumen de los avisos, control deslizante, 40 %»; cada paso anuncia el valor; marca con nombre «5, Moderado»; el rango es un **grupo** con asas «inicio»/«fin» que no se cruzan; «sin elegir» con su texto.

**Bloquea si:** no se oye el valor, no es operable con teclado, o las asas del rango no se distinguen.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### NV-30 · GNumberField · `#sec-number` · [BLOQUEA 0.1.0]
**Hacer:** campo numérico: ↑↓, `RePág`, escribe un decimal, `Tab`; − / + con el ratón.

**Debe oírse / verse:** «control de número / spinbutton» con valor con formato del idioma; cada ↑↓ anuncia el valor; los límites no se rebasan.

**Bloquea si:** el valor no se oye o no se ajusta con teclado.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### NV-31 · GTimeField: Firefox frente a Chrome · `#sec-time` · [no bloquea] · también en Chrome
**Hacer:** «Casos (24 h)» y «12 h»: escribe `930`, `9:30 pm`; ↑↓; `a`/`p`; botones a. m./p. m.

**Debe oírse / verse:** **límite documentado:** Chromium expone el texto del campo como valor y la franja en palabras («de la noche») puede no llegar; anota qué dice NVDA en Firefox y en Chrome. Los botones a. m./p. m. tienen nombre.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### NV-32 · GCheckbox, GRadioGroup y GSwitch · `#sec-checkbox`, `#sec-radio`, `#sec-switch` · [BLOQUEA 0.1.0]
**Hacer:** casilla, casilla mixta (grupo con maestra), grupo de radios con flechas (apariencias `inline`, `card`, solo icono), interruptor (`Espacio`).

**Debe oírse / verse:** casilla «marcada/no marcada/parcialmente marcada»; radios: «grupo de botones de radio, [etiqueta]», cada opción «N de M», las flechas mueven y eligen; interruptor «activado/desactivado»; ayuda y error como descripción.

**Bloquea si:** falta un estado o un grupo de radios no tiene nombre.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

---

## Etiquetas, acordeón, migas, carga

### NV-33 · GTag y GTagGroup · `#sec-tag` · [BLOQUEA 0.1.0] · **núcleo**
**Hacer:** «Flow con huella (A)»: recorre la lista; «Quitar [etiqueta]»; mira el foco; «Deshacer: quitar [etiqueta]»; quita dos seguidas; «Quitar todas»; «Agregar alergia». Después «Alternar» con `Espacio` y un grupo que dejes vacío.

**Debe oírse / verse:** «lista, N elementos»; quitar se anuncia («[etiqueta] quitada»); **el foco queda en «Deshacer: quitar …»**, en el mismo sitio; con dos gestos seguidos se anuncia el último; alternar dice **pulsado/no pulsado**; con el grupo vacío el foco no cae en `body`.

**Bloquea si:** quitar no se comunica ni se puede deshacer con teclado, o el foco cae en `body`.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### NV-34 · GAccordion · `#sec-accordion` · [BLOQUEA 0.1.0] · también en Chrome
**Hacer:** «Preguntas frecuentes»: `H`, `Tab`, `↓`/`↑` entre encabezados (modo foco), `Inicio`/`Fin`, `Intro`; uno deshabilitado.

**Debe oírse / verse:** encabezado + botón «contraído/expandido»; cerrado, el avance se oye como descripción; abierto: con 6 o menos elementos o `exclusive`, región con el nombre del título; con 7 o más, sin región; abrir no mueve el foco; el deshabilitado dice «no disponible» y se alcanza.

**Bloquea si:** no se oye el estado o los encabezados no aparecen en `NVDA+F7`.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### NV-35 · GBreadcrumbs · `#sec-breadcrumbs` · [BLOQUEA 0.1.0]
**Hacer:** `D` hasta la navegación de migas; recorre; abre una «puerta»; `Esc`.

**Debe oírse / verse:** «navegación Ruta de navegación», **lista con N elementos** (si no dice «lista», anótalo: sin bloquear solo por esto); último nivel «página actual»; la puerta expandida/contraída; el hijo de la ruta marcado; `Esc` devuelve el foco.

**Bloquea si:** no se identifica la página actual o la puerta no es operable.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### NV-36 · GLoadRegion · `#sec-load-region` · [BLOQUEA 0.1.0] · **núcleo** · también en Chrome
**Hacer:**
1. «Cargar todo (primera carga)»; observa con las flechas mientras carga.
2. Consola (`F12`): `setTimeout(() => document.querySelector('#lr-go-refresh').click(), 5000)`; en esos 5 s lleva el foco a un enlace de «Muestras» y espera.

**Debe oírse / verse:** paso 1: la frase de espera (fusionada en una si varias regiones) a los ~200 ms; el **molde no se lee** como datos; al terminar se anuncia lo que se ve (recuento o título del vacío); como mucho tres anuncios por carga. Paso 2: lo de antes sigue legible; el foco pasa a la raíz de la región y vuelve **al mismo enlace**; nunca a `body`.

**Bloquea si:** el fin de la carga no se anuncia, el molde se lee como datos, o el foco cae en `body`.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

---

## Avisos, estado y navegación

### NV-37 · GToaster · `#sec-toaster` · [BLOQUEA 0.1.0] · **núcleo**
**Hacer:** «Éxito», «Error con acción», «Ráfaga de 6», «Promesa que falla»; con un aviso `F8`; `Tab`; `Esc`.

**Debe oírse / verse:** cada aviso **se anuncia al aparecer** («Error: Falló. Pulsa F8 para Reintentar.»), el error por el canal enérgico; el foco no se mueve solo; `F8` lleva a la acción y `F8` de nuevo lo devuelve; `Esc` cierra.

**Bloquea si:** un aviso no se anuncia o roba el foco.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### NV-38 · Isla de estado · `#sec-status` · [BLOQUEA 0.1.0] · **núcleo**
**Hacer:** abre `?status=seed#sec-status` (**0 anuncios al cargar**). «Sin conexión», «Mantenimiento (descartable)», `Alt+F8`, `Intro`, `Esc`, `Alt+F8`; «Sesión por caducar (0:33)».

**Debe oírse / verse:** una condición nueva se anuncia una vez (error enérgico, el resto cortés); el resumen es un botón con el estado («Estado: 3 avisos. Error: título, y 2 más»); `Alt+F8` abre y lleva el foco, y otra vez lo devuelve; el temporizador anuncia por umbrales (5 min, 1 min, 30 s).

**Bloquea si:** una condición grave no se anuncia, o abrir/cerrar pierde el foco.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### NV-39 · GTabs · `#sec-tabs` · [BLOQUEA 0.1.0]
**Hacer:** `Tab` a la lista; ← → `Inicio` `Fin`; `Tab` al panel; «Más pestañas» si aparece.

**Debe oírse / verse:** «lista de pestañas», «Pestaña 1 de N, seleccionada»; solo la activa está en `Tab`; el panel se anuncia con su nombre; carga y fin se anuncian («[pestaña]: cargando/listo»).

**Bloquea si:** no se oye cuál está seleccionada, o no se llega al panel.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

---

## Resto de campos

### NV-40 · GDatePicker · `#sec-datepicker` · [BLOQUEA 0.1.0]
**Hacer:** abre con `Intro`; flechas, `RePág`/`AvPág`, `Mayús+RePág`, `Inicio`/`Fin`, `Intro`, `Esc`; un rango si lo ofrece.

**Debe oírse / verse:** cada día con **fecha completa y estado** (seleccionado, hoy, deshabilitado); el título del mes se anuncia al cambiar; `Esc` devuelve el foco al campo.

**Bloquea si:** no se oye qué día tiene el foco o no se puede elegir con teclado.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### NV-41 · GFileField · `#sec-file-field` · [no bloquea]
**Hacer:** «Fotos de la lesión»: `Espacio` (diálogo del sistema), «Añadir tres fotos de prueba», «Añadir una que falla», botones de las fichas, envío con pendientes.

**Debe oírse / verse:** nombre compuesto; lista de archivos con nombre; botones Quitar/Reintentar/Cancelar con nombre; avisos por lote («Subiendo 3.», «[nombre] subido.»); fallo con su motivo; enviar con pendientes o fallidos se bloquea con mensaje.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### NV-42 · GSidebar, GAvatar, GStepper y GProgress · `#sec-sidebar`, `#sec-gavatar`, `#sec-stepper`, `#sec-widget` · [no bloquea]
**Hacer:** `D` a la navegación lateral y recorre; avatares decorativos y con nombre; stepper; barras de progreso.

**Debe oírse / verse:** navegación con nombre y destino real como «página actual»; padres expandido/contraído; avatar decorativo mudo y con nombre «imagen, [nombre]»; stepper con total de pasos, paso actual y estado de cada uno; progreso con valor.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

---

Al terminar, repite en **Chrome** los pasos marcados «también en Chrome» y registra los resultados con la columna «navegador».
