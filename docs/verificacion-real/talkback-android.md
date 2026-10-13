# TalkBack en Android (Chrome)

Prefijo de pasos: **TB**. Lee antes el [README](./README.md) (qué es «bloquea 0.1.0», cómo registrar). Tiempo estimado: **1 h** completo; **55 min** solo los `[BLOQUEA 0.1.0]`; **35 min** solo el núcleo (los marcados `núcleo`).

## Preparación (10 min)

1. Teléfono Android (mejor uno real de gama media, no solo el emulador) con **Google TalkBack** (en Samsung, instala/usa TalkBack de Google, no «Voice Assistant», o anótalo). Anota modelo, versión de Android, versión de TalkBack y de Chrome.
2. Sirve el playground en la red local (README § Qué preparar, punto 3) y ábrelo en **Chrome**: `http://<IP>:4173/playground/`. Añade el ancla de cada paso (`#sec-form`) o usa el botón **«Índice»** de la barra del playground.
3. **Voz con `?speech=self`**: el micrófono real no funciona por `http://<IP>`. Los pasos de voz usan `…/playground/?speech=self#sec-speech`.
4. Ajustes → Accesibilidad → TalkBack → activar. Para ver lo que dice: TalkBack → Ajustes → **Opciones de desarrollador → Mostrar texto de voz** (si lo tienes); si no, anota de memoria con la nota breve.
5. Vertical, tema **Por defecto**, modo **Claro**, tamaño de fuente del sistema por defecto. Chrome sin extensiones ni modo de lectura.
6. Teclado Bluetooth: opcional.

## Chuleta de TalkBack

Los gestos cambian con el modo de navegación (gestos / 2 botones / 3 botones); se indican los más comunes.

| Para | Gesto |
| --- | --- |
| Siguiente / anterior elemento | Deslizar a la derecha / izquierda con **un** dedo |
| Explorar bajo el dedo | Tocar y arrastrar |
| Activar | **Doble toque** |
| Cambiar los **controles de lectura** (encabezados, enlaces, controles, etc.) | Deslizar **arriba o abajo** con un dedo |
| Ajustar un control deslizante enfocado | Teclas de **volumen** (o el control de lectura «Ajustar valor») |
| Desplazar la página | Deslizar con **dos dedos** |
| Atrás (cerrar hoja o diálogo) | Gesto o botón **Atrás** del sistema |
| Pulsación larga | **Doble toque y mantener** |
| Parar la voz | Tocar con **dos dedos** |

**Cómo leer «Debe oírse»:** nombre, rol y estado son lo exigible; TalkBack usa sus propios términos («casilla de verificación», «interruptor», «ficha», «lista desplegable»). Entre comillas, el texto del playground.

---

## Formularios

### TB-01 · GForm: enviar vacío y resumen · `#sec-form` · [BLOQUEA 0.1.0] · **núcleo**
**Hacer:** en «Formulario corto» recorre los campos; activa «Enviar» sin escribir nada; recorre el resumen; doble toque en el enlace de «Correo»; escribe `ana` con el teclado.

**Debe oírse / verse:**
- Cada campo: etiqueta, «campo de texto», «obligatorio» (Extensión y Comentarios no).
- Al enviar, el foco **salta al resumen de errores** y se oye «Hay N problemas con el formulario»; un enlace por pregunta.
- El enlace lleva al campo, con su etiqueta a la vista (no tapada por el teclado); se oye su error como descripción.

**Bloquea si:** el resumen no se anuncia ni recibe el foco, un obligatorio no lo dice, o el campo enfocado queda tapado por el teclado.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### TB-02 · GInputGroup y GFormReveal · `#sec-form` · [BLOQUEA 0.1.0]
**Hacer:** «Teléfono»: recorre selector de país y número. «Bloque condicional»: elige «Sí» en «¿Requiere factura?», desliza al primer campo nuevo, escribe, cambia a «No» y a «Sí».

**Debe oírse / verse:** partes con **etiqueta + parte** («Teléfono Código de país…»); al elegir «Sí» no se anuncia nada y el siguiente elemento es el primer campo del bloque; con «No», el bloque deja de estar en el recorrido; al volver, **lo escrito se conserva**.

**Bloquea si:** una parte sin nombre, bloque abierto inalcanzable, bloque cerrado alcanzable o texto perdido.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### TB-03 · Pie fijo y teclado virtual · `#sec-form` · [BLOQUEA 0.1.0]
**Hacer:** en «Mediano…» (pie fijo «Guardar»), enfoca los campos del final con el teclado abierto.

**Debe oírse / verse:** el campo enfocado queda **visible** (ni el pie ni el teclado lo tapan); al cerrar el teclado el pie vuelve a su sitio.

**Bloquea si:** un campo enfocado queda tapado y no se puede ver lo que se escribe.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

---

## Tabla, filtros y carga

### TB-04 · GTable en móvil: tarjetas, orden y selección · `#sec-table` · [BLOQUEA 0.1.0] · **núcleo**
**Hacer:** recorre varias tarjetas (a este ancho la tabla son tarjetas); ordena por «Cliente» dos veces; marca una tarjeta y «Seleccionar todo».

**Debe oírse / verse:** casilla «Seleccionar [cliente]»; botón «Acciones de [cliente]»; cada dato **con su nombre de columna**; «Ordenado por Cliente, ascendente»; «todo» pasa por marcada / parcialmente marcada / sin marcar; «N seleccionados».

**Bloquea si:** datos sin su columna, un control sin nombre, o un estado que no se comunica.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### TB-05 · GFilterBar: hoja inferior · `#sec-table` · [BLOQUEA 0.1.0] · **núcleo**
**Hacer:** «Agregar filtro» → «Plan» → valor → «Aplicar»; sin valor; chip («Editar filtro…», «Quitar filtro…»); Atrás con la hoja abierta.

**Debe oírse / verse:** hoja con nombre («Filtrar por Plan»), foco dentro, lo de fuera inerte; el error «Indica un valor para aplicar el filtro.» se anuncia; Atrás cierra la hoja y el foco vuelve al chip.

**Bloquea si:** se puede leer lo de detrás de la hoja, o Atrás no cierra la hoja.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### TB-06 · GTable: carga y fallo · `#sec-table` · [BLOQUEA 0.1.0]
**Hacer:** «Simular carga»; «Carga lenta (6 s)»; «Simular fallo» y «Reintentar».

**Debe oírse / verse:** «Cargando clientes…», a los 5 s «Sigue cargando clientes…», al terminar «N resultados»; el fallo («No se pudieron actualizar los clientes…») y «Reintentar» operable.

**Bloquea si:** carga, fin o fallo no se anuncian.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

---

## Menús, diálogos y selectores

### TB-07 · GMenu · `#sec-menu` · [BLOQUEA 0.1.0]
**Hacer:** «Acciones» (doble toque); recorre; elige uno marcable; Atrás; en `#sec-table` abre «Acciones de [cliente]».

**Debe oírse / verse:** botón con estado; elementos con nombre; marcables con **marcado/no marcado**; lo de fuera del menú no se lee; Atrás cierra y el foco vuelve al botón.

**Bloquea si:** elementos sin nombre o estado, o el foco no vuelve.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### TB-08 · GDialog · `#sec-dialog` · [BLOQUEA 0.1.0] · **núcleo**
**Hacer:** «Con inset y pie», «Confirmación», «Pantalla completa»; recorre; cierra con «Cerrar» y con Atrás.

**Debe oírse / verse:** «[título], diálogo» + descripción; la confirmación como diálogo de alerta; el foco empieza dentro; no se alcanza lo de fuera; al cerrar el foco vuelve al botón.

**Bloquea si:** se alcanza lo de fuera, o el foco no vuelve.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### TB-09 · GSelect: hoja · `#sec-select` · [BLOQUEA 0.1.0]
**Hacer:** abre el selector; recorre opciones; elige; Atrás.

**Debe oírse / verse:** el selector dice valor y «lista desplegable»; las opciones dicen posición y cuál está elegida; elegir cierra y se oye el valor nuevo; lo de detrás de la hoja no se lee.

**Bloquea si:** la opción elegida no se oye o se lee lo de detrás.

**Nota:** riesgo documentado con `aria-activedescendant`.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### TB-10 · GCombobox · `#sec-combobox` · [BLOQUEA 0.1.0] · **núcleo**
**Hacer:** «Paciente entre miles»: doble toque; escribe `mar`; recorre resultados; elige; «Limpiar Paciente». Paleta con vista previa. Después `#sec-combobox-multiple` A: marca varias, desmarca, agrega texto libre.

**Debe oírse / verse:** cuadro combinado con estado; anuncio de resultados («N de 2 400 resultados»); opciones con nombre y posición; el teclado no tapa la lista; elegir devuelve el foco al campo; en multiple, un anuncio por gesto y opciones «seleccionada / no seleccionada».

**Bloquea si:** no se puede elegir una opción con TalkBack, o la lista queda tapada.

**Nota (no bloquea):** eco de escritura, texto fantasma, anuncio duplicado.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### TB-11 · GDatePicker: hoja móvil · `#sec-datepicker` · [BLOQUEA 0.1.0]
**Hacer:** abre; recorre días; elige uno; cambia de mes; «Listo»/cerrar; Atrás.

**Debe oírse / verse:** cada día con **fecha y estado**; título del mes anunciado; cerrar devuelve el foco; el deslizamiento horizontal cambia de mes sin romper el recorrido de TalkBack.

**Bloquea si:** días sin fecha o no se puede elegir.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

---

## Tooltip

### TB-12 · GTooltip: pulsación larga · `#sec-tooltip` · [BLOQUEA 0.1.0] · **núcleo**
**Hacer:** «Barra de herramientas y riel»: con TalkBack recorre los botones de iconos; sin TalkBack mantén pulsado un botón, suelta, y haz un toque normal.

**Debe oírse / verse:** cada botón dice su **nombre**; la pulsación larga muestra el nombre y **soltar no activa**; un toque normal activa; no aparece el menú contextual de Chrome encima.

**Bloquea si:** botón de solo icono sin nombre, o la pulsación larga activa el botón.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

---

## Captura de voz

> Usa `…/playground/?speech=self#sec-speech`.

### TB-13 · Voz: dictado, pill, hoja y modal · `#sec-speech` · [BLOQUEA 0.1.0] · **núcleo**
**Hacer:** «Dictar en Observaciones»; 10 s; «Pausar», «Reanudar», «Finalizar». Luego «Grabar conversación» (aviso a participantes), abre el panel (hoja inferior modal), Atrás; «Abrir un diálogo modal» y dicta dentro.

**Debe oírse / verse:** «Grabando. Dictado en Observaciones.»; el texto entra en el campo y no se lee; la pill dice estado y duración; «En pausa…»; «Dictado terminado. Texto añadido a Observaciones.»; la hoja es modal (lo de fuera inerte) y Atrás la cierra; dentro del modal los anuncios se oyen.

**Bloquea si:** inicio o fin no se anuncian, la hoja deja alcanzar lo de fuera, o dentro del modal no se oye nada.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### TB-14 · GTranscript en móvil · `#sec-speech` · [no bloquea]
**Hacer:** «Transcripción guardada»: recorre filas apiladas; «Acciones del fragmento…»; selecciona una fila.

**Debe oírse / verse:** cada fila con sus partes nombradas; el texto a todo el ancho; las acciones se alcanzan; la selección se anuncia.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

---

## Controles de valor

### TB-15 · GSlider · `#sec-slider` · [BLOQUEA 0.1.0] · **núcleo**
**Hacer:** valor único: enfoca; ajusta con volumen o «Ajustar valor». Rango: las dos asas. Sin TalkBack: arrastra la píldora y desliza la página en vertical empezando sobre el control.

**Debe oírse / verse:** «Volumen de los avisos, control deslizante, 40 %»; cada ajuste anuncia el valor; el rango tiene grupo y asas «inicio»/«fin»; sin TalkBack el arrastre mueve la píldora y el gesto vertical **desplaza la página**.

**Bloquea si:** no se puede ajustar con TalkBack, o el control atrapa el desplazamiento.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### TB-16 · GNumberField y GTimeField · `#sec-number`, `#sec-time` · [no bloquea]
**Hacer:** numérico: − y + (un toque suma sin enfocar el campo), escribe un valor. Hora: `930`; a. m./p. m.

**Debe oírse / verse:** «control de número» con el valor con formato del idioma; − / + con nombre; la hora se oye (la franja en palabras puede no llegar: anótalo en Chrome).

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### TB-17 · GCheckbox, GRadioGroup y GSwitch · `#sec-checkbox`, `#sec-radio`, `#sec-switch` · [BLOQUEA 0.1.0]
**Hacer:** casilla, casilla mixta, radios (todas las apariencias), interruptor.

**Debe oírse / verse:** casilla «marcada / no marcada / parcialmente marcada»; radios con grupo y posición; interruptor «activado/desactivado»; toda la fila se toca (≥ 44 px).

**Bloquea si:** falta un estado o un grupo no tiene nombre.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

---

## Etiquetas, acordeón, migas, carga

### TB-18 · GTag · `#sec-tag` · [BLOQUEA 0.1.0] · **núcleo**
**Hacer:** «Flow con huella (A)»: «Quitar [etiqueta]»; «Deshacer…»; dos seguidas; «Quitar todas»; toca fuera.

**Debe oírse / verse:** «Quitar Látex» es un botón; se anuncia «[etiqueta] quitada»; el foco queda en «Deshacer: quitar …»; alternar dice pulsado/no pulsado.

**Bloquea si:** quitar no se comunica o no se puede deshacer.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### TB-19 · GAccordion y GBreadcrumbs · `#sec-accordion`, `#sec-breadcrumbs` · [BLOQUEA 0.1.0]
**Hacer:** acordeón: abre/cierra; control de lectura «encabezados». Migas: recorre; abre una puerta; pulsación larga en un nivel recortado.

**Debe oírse / verse:** encabezado + botón «contraído/expandido»; los títulos se pueden recorrer por encabezados; migas: navegación, último nivel «página actual», puerta con estado; la pulsación larga muestra el nombre completo sin navegar.

**Bloquea si:** no se oye el estado del acordeón o no se identifica la página actual.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### TB-20 · GLoadRegion · `#sec-load-region` · [BLOQUEA 0.1.0]
**Hacer:** «Cargar todo (primera carga)»; «Refrescar la lista».

**Debe oírse / verse:** frase de espera a los ~200 ms; el molde no se lee como datos; al terminar se anuncia lo que se ve; al refrescar, lo anterior sigue legible.

**Bloquea si:** el fin de la carga no se anuncia o el molde se lee como datos.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

---

## Avisos y estado

### TB-21 · GToaster · `#sec-toaster` · [BLOQUEA 0.1.0] · **núcleo**
**Hacer:** «Éxito», «Error con acción», «Ráfaga de 6»; con TalkBack alcanza «Cerrar»; sin TalkBack, desliza un aviso en horizontal.

**Debe oírse / verse:** cada aviso se anuncia al aparecer y no roba el foco; el botón «Cerrar» existe y se activa; deslizar también cierra.

**Bloquea si:** un aviso no se anuncia o solo se puede cerrar deslizando.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### TB-22 · Isla de estado: hoja móvil · `#sec-status` · [BLOQUEA 0.1.0] · **núcleo**
**Hacer:** `?status=seed#sec-status` (0 anuncios al cargar); «Sin conexión», «Mantenimiento»; toca el resumen; recorre la hoja; Atrás.

**Debe oírse / verse:** una condición nueva se anuncia una vez; resumen como botón con estado; la hoja se anuncia y el foco queda dentro; Atrás la repliega.

**Bloquea si:** una condición grave no se anuncia o la hoja no se puede cerrar.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### TB-23 · GTabs, GHelper y GFileField · `#sec-tabs`, `#sec-helper`, `#sec-file-field` · [no bloquea]
**Hacer:** pestañas (activar, «Más pestañas»); «Abrir ayuda»; «Fotos de la lesión» (selector del sistema, ficha).

**Debe oírse / verse:** «ficha 1 de N, seleccionada»; ayuda con estado; el selector de archivos abre; la ficha y sus botones tienen nombre.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

---

Al terminar, desactiva TalkBack y registra el resultado en la plantilla.
