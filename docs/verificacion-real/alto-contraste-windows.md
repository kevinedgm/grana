# Alto contraste de Windows (`forced-colors`)

Prefijo de pasos: **HC**. Lee antes el [README](./README.md) (qué es «bloquea 0.1.0», cómo registrar). Tiempo estimado: **50 min** completo con un tema oscuro y un navegador; **+10 min** por el tema claro (7 pasos «claro también») y **+15 min** por el segundo navegador; **40 min** solo los `[BLOQUEA 0.1.0]`; **30 min** solo el núcleo (los marcados `núcleo`).

Hasta ahora `forced-colors` solo se ha **emulado en Chromium**. Aquí se prueba el modo real de Windows, en Chrome (o Edge) y en **Firefox**, donde nunca se ha visto. En este modo el sistema sustituye los colores de la página por los del tema; todo lo que dependiera de un color o de una sombra puede desaparecer.

## Preparación (10 min)

1. Windows 11 (o 10). Anota versión y navegadores. Sirve el playground (README § Qué preparar) y ábrelo en **Chrome** y en **Firefox**. Modo **Claro**, Tema **Por defecto** (en alto contraste los colores del tema no importan; el modo da igual).
2. Activa un tema de contraste:
   - Windows 11: Configuración → Accesibilidad → **Temas de contraste** → elige un tema → Aplicar.
   - Windows 10: Configuración → Accesibilidad → **Contraste alto**.
   - Atajo para alternar: `Alt` izquierdo + `Mayús` izquierdo + `ImprPant`.
3. Temas a probar: uno **oscuro** (Night sky / Contraste alto negro) para todos los pasos y uno **claro** (Desert / Contraste alto blanco) para los pasos marcados «claro también».
4. **Firefox:** Ajustes → General → Idioma y apariencia → Colores → «Sustituir los colores especificados por la página» en *Solo con temas de contraste alto* (es el valor por defecto).
5. Comprueba que la barra del playground y el fondo cambiaron de color: si no, el navegador no está en `forced-colors`.
6. Recarga la página tras cambiar de tema o de navegador.

## Criterios comunes a todos los pasos

En cada componente comprueba, con ratón y con `Tab`:

1. **Foco visible**: al tabular se ve dónde está el foco, siempre.
2. **Estado distinguible sin color**: marcado / sin marcar, elegido, activo, deshabilitado, error, abierto / cerrado.
3. **Nada desaparece**: iconos, bordes, separadores, marcas, el valor de un control.
4. **Texto legible**: sin texto sobre texto, sin texto sobre un fondo que no cambió.
5. **Nada se confunde con otra cosa**: un molde de carga no se ve como datos; un deshabilitado no se ve como activo.

**Un paso `[BLOQUEA 0.1.0]` falla** si en un control `candidate` se pierde información que el usuario necesita (WCAG 1.4.1, 1.4.11, 2.4.7): no se ve el foco, no se distingue un estado, desaparece el control o su límite. Una estética pobre que **conserva** la información (un borde de más, un tono raro, falta de relleno) es nota.

---

## Controles de entrada

### HC-01 · Botones y foco · `#sec-btn` · [BLOQUEA 0.1.0] · **núcleo** · claro también
**Hacer:** recorre todas las variantes (sólido, suave, contorno, fantasma, enlace), tamaños y estados con `Tab`.

**Debe verse:** cada botón tiene **borde o texto con color de sistema** y se reconoce como botón (también el fantasma y el enlace); el deshabilitado en el color de «texto deshabilitado» (gris del tema), claramente distinto; el **anillo de foco** siempre visible; el de carga muestra su estado.

**Bloquea si:** un botón es indistinguible del fondo, o no se ve el foco en alguno.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### HC-02 · Campos de texto, error y solo lectura · `#sec-input`, `#sec-textarea` · [BLOQUEA 0.1.0] · **núcleo** · claro también
**Hacer:** recorre campos normales, con prefijo/sufijo, con error, advertencia, válido, solo lectura y deshabilitado; enfoca cada uno.

**Debe verse:** borde del campo siempre visible; foco con anillo; **error** con borde más grueso/doble, icono y prefijo de texto (no solo color); **solo lectura** con borde discontinuo frente al **deshabilitado** continuo y atenuado; los iconos de Lucide visibles.

**Bloquea si:** el borde desaparece, o error / solo lectura / deshabilitado son indistinguibles entre sí.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### HC-03 · Casilla, radios e interruptor · `#sec-checkbox`, `#sec-radio`, `#sec-switch` · [BLOQUEA 0.1.0] · **núcleo** · claro también
**Hacer:** casillas marcada / sin marcar / mixta; radios en las cinco apariencias (`list`, `inline`, `segmented`, `chip`, `card`) elegidos y no; interruptor activado / desactivado; con error, solo lectura y deshabilitado.

**Debe verse:** la **marca de lo marcado es visible** (la casilla marcada se distingue de la vacía y de la mixta); en `segmented`, `chip` y `card` **la opción elegida se distingue** (relleno de selección o borde más grueso); el interruptor muestra su estado por la posición **y** el icono del pulgar; foco visible en cada opción.

**Bloquea si:** no se distingue marcado de sin marcar, o la opción elegida de un grupo.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### HC-04 · GSelect y GCombobox · `#sec-select`, `#sec-combobox` · [BLOQUEA 0.1.0] · **núcleo**
**Hacer:** abre cada uno; recorre opciones con ↑↓; elige; observa la opción activa, la elegida (check), el texto fantasma y la coincidencia (subrayada); en la paleta, la vista previa.

**Debe verse:** la opción **activa** con colores de selección del sistema (`Highlight` / texto de selección), también sus datos; la **elegida** con su `check`; el texto fantasma en gris del sistema; la coincidencia con subrayado; el anillo del campo; filas deshabilitadas atenuadas.

**Bloquea si:** no se ve cuál es la opción activa o cuál está elegida.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### HC-05 · GSlider y GNumberField · `#sec-slider`, `#sec-number` · [BLOQUEA 0.1.0]
**Hacer:** mueve el valor único y el rango (tramo y asas); «sin elegir»; solo lectura; deshabilitado; error. En el numérico: −/+ y el campo.

**Debe verse:** riel en gris del sistema, **tramo en color de selección**, píldora con borde y su cifra legible; solo lectura con **trazo discontinuo**; deshabilitado atenuado; error con borde doble; anillo visible; −/+ visibles con separador.

**Bloquea si:** no se ve el valor o el tramo, o el foco desaparece.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### HC-06 · GTimeField, GFileField y GDatePicker · `#sec-time`, `#sec-file-field`, `#sec-datepicker` · [no bloquea]
**Hacer:** hora: botones a. m./p. m. pulsado y no; archivos: ficha en reposo, subiendo, con error y el destino de arrastre; selector de fechas: día elegido, hoy, rango, deshabilitado.

**Debe verse:** botón pulsado con colores de selección; ficha con contorno (discontinuo si hay error); progreso con frente y línea inferior visibles; destino de arrastre con borde; en el selector, la selección con borde y el rango con **borde superior e inferior**.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

---

## Formularios

### HC-07 · GForm: resumen, secciones y bloque condicional · `#sec-form` · [BLOQUEA 0.1.0] · **núcleo** · claro también
**Hacer:** envía vacío el «Formulario corto»; recorre el resumen; en «Bloque condicional» abre y cierra el bloque; en «Secciones fuera de GForm» pliega y despliega; teléfono fusionado.

**Debe verse:** el resumen de errores con borde y enlaces reconocibles (subrayados); cada campo inválido con su señal; el bloque condicional con su **barra al inicio** (borde) y la sangría; el bloque cerrado no se ve y no ocupa altura; la sección plegable con chevron visible y separador; en el teléfono fusionado, la **línea entre partes** visible y el anillo en la parte con foco, no en toda la caja.

**Bloquea si:** un error no se ve, o no se distinguen las partes de un campo fusionado.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

---

## Superficies y navegación

### HC-08 · GDialog, GMenu y GTooltip · `#sec-dialog`, `#sec-menu`, `#sec-tooltip` · [BLOQUEA 0.1.0] · **núcleo** · claro también
**Hacer:** abre «Con inset y pie» y «Confirmación»; el menú «Acciones» y recorre con ↑↓ (también un marcable y un submenú); en la barra de herramientas del tooltip recorre con `Tab`.

**Debe verse:** el diálogo con **borde** en carcasa, inset y pie, y su cruz de cierre visible; el menú con **contorno de selección** en el elemento activo y en el padre expandido (la «luz» se oculta), marcables con su marca; el tooltip con **borde de la etiqueta** y su **pestaña** (con dos lados largos visibles) pegada al control.

**Bloquea si:** un diálogo o menú se funde con el fondo sin borde, o no se ve el elemento activo del menú.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### HC-09 · GTabs, GSidebar y GBreadcrumbs · `#sec-tabs`, `#sec-sidebar`, `#sec-breadcrumbs` · [BLOQUEA 0.1.0]
**Hacer:** pestañas (todas las apariencias), activa e inactivas, deshabilitada; barra lateral con el item activo y un padre abierto; migas con la página actual y una puerta abierta.

**Debe verse:** la pestaña **activa** con la marca en color de selección (y su texto legible); el item activo de la barra con contorno o píldora de selección; la miga actual **subrayada**; la puerta abierta distinguible; barras de otros niveles atenuadas pero legibles.

**Bloquea si:** no se distingue la pestaña, el item o el nivel activo.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### HC-10 · GAccordion, GStepper y GCard · `#sec-accordion`, `#sec-stepper`, `#sec-card` · [no bloquea]
**Hacer:** acordeón (abierto, cerrado, deshabilitado, encabezado pegado), stepper (completado, actual, pendiente, error), tarjeta seleccionable.

**Debe verse:** chevron visible; separadores opacos; pasos con forma/icono además del color; tarjeta seleccionada con color de selección y su casilla; tarjeta con borde.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

---

## Tabla, carga y vacío

### HC-11 · GTable y GFilterBar · `#sec-table` · [BLOQUEA 0.1.0] · **núcleo** · claro también
**Hacer:** recorre filas, encabezado con orden, selecciona filas, hover, chips de filtro, paginación; en vista estrecha (ventana ≤ 520 px) las tarjetas.

**Debe verse:** filas separadas por un borde; la **fila o tarjeta seleccionada** con color de selección o borde más grueso; el encabezado con el estado de orden visible (flecha/icono); chips con borde; la paginación con la página actual marcada.

**Bloquea si:** no se distingue una fila seleccionada o el estado de orden.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### HC-12 · GLoadRegion, carga de tabla y GEmpty · `#sec-load-region`, `#sec-table` · [BLOQUEA 0.1.0] · **núcleo**
**Hacer:** «Cargar todo (primera carga)» y observa el molde; «Refrescar la lista» (ficha «Actualizando»); «Simular fallo» en la tabla; recorre los vacíos de «Vacíos con causa».

**Debe verse:** el **molde** de carga con barras y bordes en gris del sistema, **sin parecer datos reales** (sin tinta) y distinguible del contenido; la ficha de espera con borde y texto; la barra de fallo con borde; `GEmpty` con contorno y hueco, su icono visible.

**Bloquea si:** el molde es indistinguible de contenido real o desaparece por completo.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

---

## Avisos, estado y voz

### HC-13 · GToaster e Isla de estado · `#sec-toaster`, `#sec-status` · [BLOQUEA 0.1.0] · **núcleo** · claro también
**Hacer:** lanza avisos de cada tipo; abre la isla con varias condiciones (error, advertencia, éxito, información); recorre con `Tab`.

**Debe verse:** cada aviso con **borde** y su **icono**; las insignias de la isla conservan su **forma** (sólido, discontinuo, punteado) para distinguir el tipo sin color; el botón de resumen y «Entendido» reconocibles; foco visible.

**Bloquea si:** no se distingue un error de una información, o falta el borde.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### HC-14 · Captura de voz y GTranscript · `?speech=self#sec-speech` · [BLOQUEA 0.1.0] · **núcleo**
**Hacer:** inicia un dictado y observa la pill; abre el panel; pausa; «Perder el servicio» (estado de error); en «Transcripción guardada» recorre filas, selecciona, edita una celda y observa fragmentos corregidos / eliminados / fallidos.

**Debe verse:** la pill con **lámpara invertida**, medidor y onda visibles; el estado de problema con borde discontinuo; el panel con borde; en la transcripción, **selección y foco con color de selección**, `<del>` tachado y `<ins>` subrayado, la marca «Sin asignar» discontinua, el fragmento fallido con borde discontinuo y sus marcas con texto e icono.

**Bloquea si:** no se distingue grabando de en pausa o en error, o una fila seleccionada de una no seleccionada.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

---

## Etiquetas, insignias y pequeños elementos

### HC-15 · GTag y GTagGroup · `#sec-tag` · [BLOQUEA 0.1.0] · **núcleo**
**Hacer:** etiquetas estáticas, enlaces, de alternar (pulsada y no), quitables; la huella tras quitar; un racimo; «Ver N más».

**Debe verse:** contorno en reposo; la **pulsada** con color de selección **y** su marca `check`; la **huella** con borde discontinuo y «Deshacer» legible; el racimo con marco y lomo; foco visible.

**Bloquea si:** pulsada y no pulsada son indistinguibles, o la huella no se reconoce.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### HC-16 · GBadge, GAvatar, GProgress y GDivider · `#sec-badge`, `#sec-gavatar`, `#sec-widget`, `#sec-divider` · [no bloquea]
**Hacer:** insignias con punto de estado (círculo, cuadrado, rombo, triángulo) y sin texto; avatares (iniciales, icono, imagen); barras de progreso; separadores horizontal, vertical y con texto.

**Debe verse:** las insignias conservan su **forma**; el avatar con borde; la barra de progreso con su avance reconocible; las líneas de `GDivider` visibles.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

---

## Preferencias relacionadas (sin tema de contraste alto)

### HC-17 · `prefers-contrast: more` y `prefers-reduced-transparency` · todas · [no bloquea]
**Hacer:** con los temas de contraste **desactivados**, activa Configuración → Accesibilidad → Efectos visuales → *Efectos de transparencia* **desactivado**; recarga y revisa `#sec-badge` y `#sec-surface` (cristal). Si tu sistema lo permite, activa también una preferencia de contraste aumentado del navegador.

**Debe verse:** el cristal pasa a **relleno opaco** sin desenfoque; con contraste aumentado, bordes y textos secundarios más fuertes (avisos, formularios, transcripción).

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### HC-18 · `prefers-reduced-motion` · varias · [BLOQUEA 0.1.0]
**Hacer:** activa Configuración → Accesibilidad → Efectos visuales → *Efectos de animación* **desactivado** (Windows 11; en Windows 10, «Mostrar animaciones en Windows» desactivado); recarga. Abre «Con inset y pie» (diálogo), una pestaña de `GTabs`, una acordeón, «Éxito» del toaster, un menú, un `GCard` seleccionable y la isla.

**Debe verse:** **sin desplazamientos, escalas ni giros**; solo fundidos; nada queda a medias ni invisible; el diálogo aparece sin viajar desde el disparador; la isla no cambia de tamaño con animación.

**Bloquea si:** hay una **animación sin fin** (WCAG 2.2.2) o un elemento que no llega a su estado final visible. Un movimiento que se mantiene pero termina es nota.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

---

Al terminar, restablece el tema de Windows (`Alt` izq + `Mayús` izq + `ImprPant`) y registra el resultado, indicando **tema y navegador** en cada fila.
