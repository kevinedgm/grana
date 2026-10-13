# VoiceOver en iOS / iPadOS (Safari)

Prefijo de pasos: **VI**. Lee antes el [README](./README.md) (qué es «bloquea 0.1.0», cómo registrar). Tiempo estimado: **1 h 30 min** completo; **1 h 10 min** solo los `[BLOQUEA 0.1.0]`; **45 min** solo el núcleo (los marcados `núcleo`).

## Preparación (10 min)

1. iPhone (mejor uno real de tamaño estándar) con iOS actual; si hay iPad, repite VI-06 y VI-31 allí. Anota modelo y versión.
2. Sirve el playground en la red local (README § Qué preparar, punto 3) y ábrelo en **Safari**: `http://<IP>:4173/playground/`. Cada paso dice el ancla; escríbela al final de la dirección (`#sec-form`) o usa el botón **«Índice»** de la barra del playground.
3. **Voz con `?speech=self`**: el micrófono real no funciona por `http://<IP>`. Los pasos de voz usan `…/playground/?speech=self#sec-speech`.
4. Ajustes → Accesibilidad → VoiceOver → **actívalo**. Atajo: Ajustes → Accesibilidad → Atajo de accesibilidad → VoiceOver, para triple clic del botón lateral. Para registrar lo que dice: VoiceOver → **Visor de subtítulos** (actívalo) y copia lo que aparece.
5. Orientación vertical, tema **Por defecto**, modo **Claro**, tamaño de texto del sistema por defecto. Silencia notificaciones.
6. Teclado Bluetooth: opcional, solo para los pasos que lo piden.

## Chuleta de VoiceOver táctil

| Para | Gesto |
| --- | --- |
| Siguiente / anterior elemento | Deslizar a la derecha / izquierda con **un** dedo |
| Leer lo que está bajo el dedo | Tocar una vez |
| Activar | **Doble toque** |
| Ajustar un valor (control «ajustable») | Deslizar **arriba / abajo** con un dedo |
| Rotor | Girar **dos dedos** como una rueda; después deslizar arriba/abajo para usar la opción |
| Desplazar la página | Deslizar con **tres dedos** |
| Salir de un diálogo o cerrar una hoja (Escape) | Dibujar una **Z** con dos dedos |
| Leer desde aquí / desde el principio | Dos dedos hacia abajo / hacia arriba |
| Tocar y mantener (pulsación larga) | Doble toque y mantener |
| Parar la voz | Un toque con dos dedos |

**Cómo leer «Debe oírse»:** nombre, rol y estado son lo exigible; el texto exacto varía. Entre comillas, el playground (en español).

---

## Formularios

### VI-01 · GForm: enviar vacío · `#sec-form` · [BLOQUEA 0.1.0] · **núcleo**
**Hacer:** en «Formulario corto», desliza por los campos; en «Enviar», doble toque sin escribir nada.

**Debe oírse / verse:**
- Cada campo: etiqueta, «campo de texto», «obligatorio» (Extensión y Comentarios no).
- Al enviar, VoiceOver **salta al resumen de errores** y lee «Hay N problemas con el formulario» y los enlaces.
- Desliza por el resumen: **un enlace por pregunta**.

**Bloquea si:** el resumen no se anuncia ni recibe el foco, los enlaces no tienen nombre, o un obligatorio no dice que lo es.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### VI-02 · GForm: del resumen al campo, con teclado virtual · `#sec-form` · [BLOQUEA 0.1.0]
**Hacer:** doble toque en el enlace de «Correo»; escribe `ana` con el teclado de pantalla.

**Debe oírse / verse:** el foco pasa al campo (con su etiqueta a la vista, no tapada por el teclado); VoiceOver dice nombre, «obligatorio», error como descripción; al teclear se oyen las letras (según tu configuración de eco).

**Bloquea si:** el campo enfocado queda tapado por el teclado o no dice su error.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### VI-03 · GInputGroup: teléfono fusionado · `#sec-form` · [BLOQUEA 0.1.0]
**Hacer:** desliza por «Teléfono»: selector de país y número.

**Debe oírse / verse:** conjunto «Teléfono»; partes con **etiqueta + parte** («Teléfono Código de país», selector; el número, campo de texto). El selector de país abre el selector del sistema o su lista y se puede cambiar.

**Bloquea si:** una parte sin nombre o dos partes iguales.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### VI-04 · GFormReveal · `#sec-form` · [BLOQUEA 0.1.0] · **núcleo**
**Hacer:** «Bloque condicional»: elige «Sí» en «¿Requiere factura?»; desliza hacia adelante; escribe en el primer campo nuevo; cambia a «No» y a «Sí».

**Debe oírse / verse:** al elegir «Sí» no se anuncia nada; el **siguiente elemento** es el primer campo del bloque; con «No», el bloque desaparece del recorrido; al volver, **lo escrito se conserva**.

**Bloquea si:** el bloque abierto no se alcanza, el cerrado sigue alcanzable, o se pierde lo escrito.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### VI-05 · Pie fijo y teclado virtual · `#sec-form` · [BLOQUEA 0.1.0]
**Hacer:** en «Mediano: secciones…» (pie fijo «Guardar»), enfoca los campos de abajo y comprueba que el pie no queda detrás del teclado ni tapa el campo enfocado. Cierra el teclado.

**Debe oírse / verse:** el campo enfocado queda **visible** (no tapado por el pie ni por el teclado); el pie vuelve a su sitio al cerrar el teclado; el estado del pie («Cambios sin guardar») se lee.

**Bloquea si:** el campo enfocado queda inaccesible tras el pie o el teclado.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

---

## Tabla en tarjetas, filtros y carga

### VI-06 · GTable en móvil: tarjetas · `#sec-table` · [BLOQUEA 0.1.0] · **núcleo**
**Hacer:** en `#sec-table` (a este ancho la tabla se dibuja en **tarjetas**), desliza por varias tarjetas: casilla, título, datos, acciones.

**Debe oírse / verse:** cada tarjeta se recorre de forma ordenada; la casilla se llama «Seleccionar [cliente]»; el botón de acciones, «Acciones de [cliente]»; cada dato se lee **con su nombre de columna** (no valores sueltos sin contexto); los controles de orden («Ordenar por», ascendente/descendente) existen y se activan.

**Bloquea si:** los datos de una tarjeta se leen sin su nombre de columna, o un control no tiene nombre.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### VI-07 · GTable: orden y selección · `#sec-table` · [BLOQUEA 0.1.0]
**Hacer:** cambia el orden por «Cliente» (dos veces); marca una tarjeta y «Seleccionar todo».

**Debe oírse / verse:** «Ordenado por Cliente, ascendente»; el estado de «todo» pasa por marcada / mixta / sin marcar y se oye; «N seleccionados».

**Bloquea si:** el orden o el estado mixto no se comunican.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### VI-08 · GFilterBar: hoja inferior · `#sec-table` · [BLOQUEA 0.1.0] · **núcleo**
**Hacer:** «Agregar filtro» → «Plan» → valor → «Aplicar»; también sin valor; recorre el chip («Editar filtro: …», «Quitar filtro: …»); cierra la hoja con el gesto de Escape (Z).

**Debe oírse / verse:** el editor es una **hoja inferior** con nombre («Filtrar por Plan»); el foco entra en ella y lo de fuera queda inerte (no se lee); «Indica un valor para aplicar el filtro.» se anuncia; el gesto Z cierra y el foco vuelve al chip.

**Bloquea si:** se pueden leer elementos de detrás de la hoja, o el foco no vuelve.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### VI-09 · GTable: carga y fallo · `#sec-table` · [BLOQUEA 0.1.0] · **núcleo**
**Hacer:** «Simular carga», espera; «Carga lenta (6 s)»; «Simular fallo» y «Reintentar».

**Debe oírse / verse:** «Cargando clientes…» (~200 ms), «Sigue cargando clientes…» a los 5 s, «N resultados» al terminar; el fallo se anuncia («No se pudieron actualizar los clientes…»); «Reintentar» se activa con doble toque.

**Bloquea si:** carga, fin o fallo no se anuncian.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

---

## Menús, diálogos y selectores

### VI-10 · GMenu · `#sec-menu` · [BLOQUEA 0.1.0]
**Hacer:** doble toque en «Acciones»; desliza por los elementos; activa uno marcable; reabre y cierra con el gesto Z; en `#sec-table` abre «Acciones de [cliente]».

**Debe oírse / verse:** botón con estado; los elementos se leen «elemento de menú» (marcables con **marcado/no marcado**); lo de fuera del menú no se lee; Z cierra y el foco vuelve al botón.

**Bloquea si:** los elementos no tienen nombre o estado, o el foco no vuelve.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### VI-11 · GDialog · `#sec-dialog` · [BLOQUEA 0.1.0] · **núcleo**
**Hacer:** abre «Con inset y pie», «Confirmación» y «Pantalla completa». En cada uno: desliza por todo, cierra con «Cerrar», con Z y (en «Confirmación») con el botón cancelar.

**Debe oírse / verse:** «[título], diálogo» + descripción; la confirmación como **diálogo de alerta**; el foco empieza dentro; **no se puede llegar a lo de fuera** deslizando; al cerrar el foco vuelve al botón que lo abrió.

**Bloquea si:** se alcanza lo de fuera o no vuelve el foco.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### VI-12 · GSelect: hoja móvil · `#sec-select` · [BLOQUEA 0.1.0] · **núcleo**
**Hacer:** doble toque en el selector; desliza por las opciones; elige una; reabre y cierra con Z.

**Debe oírse / verse:** el selector dice su valor y que abre una lista; la hoja se anuncia; las opciones dicen su posición («3 de 8») y cuál está elegida; elegir cierra y **se oye el valor nuevo**; fuera de la hoja no se lee nada.

**Bloquea si:** la opción elegida no se oye o se pueden leer elementos de detrás de la hoja.

**Nota:** el riesgo documentado es `aria-activedescendant` en la hoja; si VoiceOver no sigue la opción activa, anótalo.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### VI-13 · GCombobox: buscar y elegir en la hoja · `#sec-combobox` · [BLOQUEA 0.1.0] · **núcleo**
**Hacer:** en «Paciente entre miles», doble toque en el campo; escribe `mar` con el teclado; desliza por los resultados; elige uno; prueba «Limpiar Paciente». Prueba también la paleta con vista previa.

**Debe oírse / verse:** el campo se anuncia como cuadro combinado; al abrirse la superficie se anuncia («Paciente, diálogo»); un anuncio de resultados («N de 2 400 resultados»); las opciones se leen con nombre y posición; el teclado no tapa la lista; elegir cierra y devuelve el foco al campo con el valor.

**Bloquea si:** no se puede elegir una opción con VoiceOver, o la lista queda tapada por el teclado.

**Nota (no bloquea):** eco de escritura y texto fantasma.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### VI-14 · GCombobox multiple · `#sec-combobox-multiple` · [no bloquea]
**Hacer:** en A (alergias) marca varias opciones, desmarca una, agrega texto libre; en B y C.

**Debe oírse / verse:** cada gesto da un anuncio («agregado», «quitado»); las opciones dicen seleccionada / no seleccionada; las elegidas se pueden conocer desde el campo.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### VI-15 · GDatePicker: hoja móvil · `#sec-datepicker` · [BLOQUEA 0.1.0]
**Hacer:** abre el selector; desliza por los días; elige uno; cambia de mes; «Listo»/cerrar.

**Debe oírse / verse:** hoja con nombre; cada día se oye con **fecha y estado** (seleccionado, hoy, deshabilitado); el título del mes se anuncia al cambiar; cerrar devuelve el foco al campo; el deslizamiento horizontal cambia de mes **sin** romper el recorrido de VoiceOver.

**Bloquea si:** los días se leen sin fecha o no se puede elegir con VoiceOver.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

---

## Tooltip y táctil

### VI-16 · GTooltip: pulsación larga · `#sec-tooltip` · [BLOQUEA 0.1.0] · **núcleo**
**Hacer:** en «Barra de herramientas y riel»: con VoiceOver desliza por los botones de iconos; **sin VoiceOver** (apágalo: triple clic del botón lateral) mantén el dedo sobre un botón; suelta; luego un toque normal.

**Debe oírse / verse:** con VoiceOver, cada botón dice su **nombre**; la pulsación larga muestra el nombre del control y **soltar no lo activa**; un toque normal sí activa; **no** aparecen la lupa ni el menú contextual del sistema encima.

**Bloquea si:** un botón de solo icono suena sin nombre, o la pulsación larga activa el botón por error.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### VI-17 · GHelper · `#sec-helper` · [no bloquea]
**Hacer:** «Abrir ayuda» (doble toque); desliza al contenido; Z.

**Debe oírse / verse:** botón con estado expandido/contraído; contenido «Ayuda»; Z cierra y el foco vuelve.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

---

## Captura de voz

> Usa `…/playground/?speech=self#sec-speech`.

### VI-18 · Voz: dictado y pill · `#sec-speech` · [BLOQUEA 0.1.0] · **núcleo**
**Hacer:** «Dictar en Observaciones» (doble toque); espera 10 s; localiza la pill (parte superior) y su duración; «Pausar», «Reanudar», «Finalizar».

**Debe oírse / verse:** «Grabando. Dictado en Observaciones.»; el texto entra en el campo sin leerse; la pill se identifica con estado y duración; «En pausa…»; «Dictado terminado. Texto añadido a Observaciones.».

**Bloquea si:** inicio o fin no se anuncian, o los botones de la pill no se alcanzan.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### VI-19 · Voz: hoja del panel y modal · `#sec-speech` · [BLOQUEA 0.1.0] · **núcleo**
**Hacer:** «Grabar conversación» (marca el aviso a participantes); abre el panel desde la pill (en móvil es una **hoja inferior modal**); desliza por ella; Z; después «Abrir un diálogo modal», dicta dentro.

**Debe oírse / verse:** la hoja se anuncia, el foco entra en su título, **lo de fuera queda inerte**; Z cierra y devuelve el foco; dentro del diálogo modal los anuncios se siguen oyendo.

**Bloquea si:** se puede salir de la hoja deslizando, o dentro del modal no se oye ningún anuncio.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### VI-20 · GTranscript en móvil · `#sec-speech` · [no bloquea]
**Hacer:** en «Transcripción guardada» recorre filas (apiladas a este ancho): casilla, hora, hablante, texto; abre «Acciones del fragmento…».

**Debe oírse / verse:** cada fila se recorre con sus partes con nombre; el texto ocupa todo el ancho; las acciones se alcanzan.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

---

## Controles de valor

### VI-21 · GSlider: «ajustable» y táctil · `#sec-slider` · [BLOQUEA 0.1.0] · **núcleo**
**Hacer:** valor único: desliza hasta el control; **arriba/abajo con un dedo** para ajustar; con rotor en «Valor/ajustar» si hace falta. Rango: ambas asas. Sin VoiceOver: arrastra la píldora; desliza la página en vertical empezando sobre el control.

**Debe oírse / verse:** «Volumen de los avisos, ajustable, 40 %»; cada deslizamiento anuncia el valor nuevo; el rango tiene grupo y asas «inicio»/«fin»; sin VoiceOver el arrastre mueve la píldora y **un gesto vertical desplaza la página** (no atrapa).

**Bloquea si:** VoiceOver no puede ajustar el valor, o el control atrapa el desplazamiento vertical.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### VI-22 · GSlider: tramo, cifra y objetivos · `#sec-slider` · [no bloquea]
**Hacer:** sin VoiceOver, arrastra el tramo entero del rango; toca la píldora y teclea una cifra; comprueba que los objetivos se tocan con facilidad.

**Debe oírse / verse:** el tramo se mueve entero; la cifra se teclea sin que el teclado oculte el control; objetivos de ~44 px.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### VI-23 · GNumberField, GTimeField · `#sec-number`, `#sec-time` · [BLOQUEA 0.1.0]
**Hacer:** numérico: ajustable con deslizar arriba/abajo; − y + (un toque suma sin enfocar el campo); escribe un valor. Hora: escribe `930`; a. m./p. m.

**Debe oírse / verse:** «ajustable» con el valor con formato del idioma; − / + con nombre; la hora se oye (la franja en palabras puede no llegar: anótalo).

**Bloquea si:** el valor no se oye o no se puede ajustar.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### VI-24 · GCheckbox, GRadioGroup y GSwitch · `#sec-checkbox`, `#sec-radio`, `#sec-switch` · [BLOQUEA 0.1.0]
**Hacer:** casilla, casilla mixta, radios (todas las apariencias), interruptor.

**Debe oírse / verse:** casilla «marcada/no marcada/mixta»; radios con grupo y «N de M»; interruptor «activado/desactivado»; área tocable de ≥ 44 px (toda la fila).

**Bloquea si:** falta un estado o un grupo no tiene nombre.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

---

## Etiquetas, acordeón, migas, carga

### VI-25 · GTag · `#sec-tag` · [BLOQUEA 0.1.0] · **núcleo**
**Hacer:** «Flow con huella (A)»: «Quitar [etiqueta]» (doble toque); «Deshacer…»; dos seguidas; «Quitar todas»; toca fuera para recogerla.

**Debe oírse / verse:** «Quitar Látex» es un botón; se anuncia «[etiqueta] quitada»; el foco de VoiceOver queda en «Deshacer: quitar …»; alternar dice pulsado/no pulsado; objetivos de 44 px.

**Bloquea si:** quitar no se comunica o no se puede deshacer.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### VI-26 · GAccordion · `#sec-accordion` · [BLOQUEA 0.1.0]
**Hacer:** «Preguntas frecuentes» abre y cierra; rotor → encabezados; «Encabezado pegado» y desplázate con la barra de Safari apareciendo y desapareciendo.

**Debe oírse / verse:** encabezado + botón «contraído/expandido»; el avance como descripción; el rotor de **encabezados** lista los títulos; abrir no mueve el foco; el encabezado pegado no tapa el contenido enfocado.

**Bloquea si:** no se oye el estado o los encabezados faltan en el rotor.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### VI-27 · GBreadcrumbs · `#sec-breadcrumbs` · [no bloquea]
**Hacer:** recorre las migas; abre una puerta; pulsación larga en un nivel recortado.

**Debe oírse / verse:** navegación con lista; último nivel «página actual»; la puerta con estado; la pulsación larga muestra el nombre completo sin navegar.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### VI-28 · GLoadRegion · `#sec-load-region` · [BLOQUEA 0.1.0]
**Hacer:** «Cargar todo (primera carga)»; desliza mientras carga; «Refrescar la lista».

**Debe oírse / verse:** frase de espera a los ~200 ms; el molde no se lee como datos; al terminar se anuncia lo que se ve; al refrescar, lo anterior sigue legible.

**Bloquea si:** el fin de la carga no se anuncia o el molde se lee como datos.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

---

## Avisos, estado y navegación

### VI-29 · GToaster · `#sec-toaster` · [BLOQUEA 0.1.0] · **núcleo**
**Hacer:** «Éxito», «Error con acción», «Ráfaga de 6»; sin VoiceOver, desliza un aviso en horizontal para cerrarlo; con VoiceOver alcanza «Cerrar».

**Debe oírse / verse:** cada aviso se anuncia al aparecer; no roba el foco; deslizar lo cierra, y el botón «Cerrar» existe y se activa con doble toque.

**Bloquea si:** un aviso no se anuncia o solo se puede cerrar deslizando.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### VI-30 · Isla de estado: hoja móvil · `#sec-status` · [BLOQUEA 0.1.0] · **núcleo**
**Hacer:** `?status=seed#sec-status` (0 anuncios al cargar); «Sin conexión», «Mantenimiento»; toca el resumen; recorre la hoja; Z.

**Debe oírse / verse:** una condición nueva se anuncia una vez; el resumen es un botón con estado («Estado: 3 avisos…»); la **hoja móvil** se anuncia, el foco va a su aviso o cierre y no sale del modal; Z repliega.

**Bloquea si:** una condición grave no se anuncia o la hoja no se puede cerrar con VoiceOver.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### VI-31 · GTabs y GSidebar (drawer) · `#sec-tabs`, `#sec-sidebar` · [no bloquea]
**Hacer:** pestañas: desliza, activa; «Más pestañas». Barra lateral: abre el drawer en móvil y cierra con Z.

**Debe oírse / verse:** «Pestaña 1 de N, seleccionada»; el panel con su nombre; el drawer es modal (lo de fuera inerte) y devuelve el foco al cerrar.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### VI-32 · GFileField · `#sec-file-field` · [no bloquea]
**Hacer:** «Fotos de la lesión»: doble toque en el control (selector de iOS: fototeca, archivos, cámara); elige una foto (incluida una HEIC si tienes); botones de la ficha.

**Debe oírse / verse:** el selector del sistema abre; la ficha aparece con nombre; avisos de subida; los botones Quitar/Reintentar tienen nombre.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

---

Al terminar: apaga VoiceOver y registra el resultado en la plantilla.
