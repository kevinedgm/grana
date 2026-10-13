# Safari en macOS (sin lector de pantalla)

Prefijo de pasos: **SF**. Lee antes el [README](./README.md) (qué es «bloquea 0.1.0», cómo registrar). Tiempo estimado: **50 min** completo; **35 min** solo los `[BLOQUEA 0.1.0]`; **25 min** solo el núcleo (los marcados `núcleo`). Se hace **antes** de encender VoiceOver (`voiceover-safari-macos.md`).

Los specs automáticos corren en el WebKit de Playwright, que **no es Safari**: no tiene su sistema de foco, su `popover`, su gestión de Tab ni sus preferencias. Aquí se prueba el Safari real, con teclado y ratón/trackpad, sin lector.

## Preparación (10 min)

1. macOS y Safari actuales; anota versiones. Sin extensiones. Sirve el playground (README § Qué preparar) y ábrelo en Safari. Modo **Claro**, Tema **Por defecto**.
2. **Teclas de función:** Ajustes del Sistema → Teclado → «Usar teclas F1, F2, etc. como teclas de función estándar» (si no, `Fn+F8`). `Opción+F8` es la `Alt+F8` de Windows.
3. **Tab por defecto:** al empezar, deja Safari **sin** el ajuste «Presionar Tab para resaltar cada elemento de una página web» (Ajustes → Avanzado). Es parte de SF-01.
4. Modo de color del sistema en claro; «Reducir movimiento», «Aumentar contraste» y «Reducir transparencia» desactivados (se prueban en SF-17).

---

## Teclado y foco

### SF-01 · Tab y Opción+Tab · todas · [no bloquea]
**Hacer:** en `#sec-btn` pulsa `Tab` repetidamente; luego `Opción+Tab`. Después activa el ajuste del paso 3 de la preparación (Avanzado → «Presionar Tab para resaltar cada elemento de una página web») y repite.

**Debe verse:** sin el ajuste, `Tab` solo salta por campos de texto; `Opción+Tab` recorre **todos** los controles (botones, casillas, enlaces); con el ajuste, `Tab` los recorre todos. Es comportamiento de Safari, **no** de Grana.

**Anota:** en qué configuración hiciste el resto de pasos. (Los guiones de las demás plataformas asumen Tab activado.)

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### SF-02 · Foco visible y orden del DOM · `#sec-btn`, `#sec-form`, `#sec-checkbox`, `#sec-radio`, `#sec-switch` · [BLOQUEA 0.1.0] · **núcleo**
**Hacer:** con el ajuste activo, recorre con `Tab` los botones, campos, casillas, interruptores, el «Formulario corto» y el «Mediano» completos (con pie fijo), y vuelve con `Mayús+Tab`.

**Debe verse:** **cada control enfocado muestra un anillo claro** (no solo al usar el teclado: aquí no se pide al ratón); el orden de Tab es el orden visual (en el pie apilado la primaria es la última); el pie fijo **no tapa** el campo enfocado; en un fusionado, el anillo rodea la **parte** con foco.

**Bloquea si:** algún control no muestra foco o el orden salta de forma incoherente.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### SF-03 · Flechas en radios, tarjetas y galería (anillo en WebKit) · `#sec-radio`, `#sec-card`, `#sec-widget` · [BLOQUEA 0.1.0] · **núcleo**
**Hacer:** en cada apariencia de `GRadioGroup` (`list`, `inline`, `segmented`, `chip`, `card`), entra con `Tab` y muévete con ← → ↑ ↓; en las `GCard` con selección tipo radio (`#sec-card`); en la galería de widgets (`GWidgetGallery`, botón «Añadir widget» de `#sec-widget`), flechas, `Inicio`, `Fin`.

**Debe verse:** **el anillo de foco se ve en cada opción al moverte con flechas** (en WebKit lo escribe el componente con `data-g-key-focus`); elegir con flechas cambia la selección; haz clic con el ratón en una opción: no debe quedar un anillo "de teclado" tras un clic.

**Bloquea si:** al moverte con flechas no se ve dónde está el foco.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### SF-04 · Un clic no enfoca el botón: el foco al volver · `#sec-dialog`, `#sec-menu`, `#sec-helper`, `#sec-tooltip` · [BLOQUEA 0.1.0] · **núcleo**
**Hacer:** abre con **clic de ratón** (no con teclado) «Con inset y pie» y ciérralo con `Esc`; abre un menú con clic y ciérralo; abre «Abrir ayuda» y ciérralo. Observa dónde queda el foco (pulsa `Tab` una vez). Repite abriendo con `Intro` desde el teclado.

**Debe verse:** en Safari un clic no enfoca el botón; el diálogo **solo se funde** (no viaja desde el disparador, es un límite documentado) y con teclado **sí viaja** hacia su origen; al cerrar, con teclado el foco **vuelve al botón** que abrió; con clic, el foco **no cae en un lugar absurdo** (el siguiente `Tab` sigue desde el disparador o desde el inicio, pero no «se pierde»).

**Bloquea si:** con teclado el foco no vuelve al disparador, o con clic el siguiente `Tab` salta a un sitio que oculta contenido o deja la página sin foco visible.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

---

## Superficies sobre otras (popover, fondo, posicionamiento)

### SF-05 · Popover y posición: GSelect, GMenu, GCombobox, GDatePicker, GHelper · `#sec-select`, `#sec-menu`, `#sec-combobox`, `#sec-datepicker`, `#sec-helper` · [BLOQUEA 0.1.0] · **núcleo**
**Hacer:** abre cada uno; observa dónde aparece (debajo del control; arriba si no cabe); desplaza la página con la rueda con el panel abierto; cierra con `Esc` y haciendo clic fuera; colócalo cerca del borde inferior de la ventana.

**Debe verse:** el panel aparece **pegado a su control**, dentro del visor, con fondo y borde; no cambia de lado mientras se desplaza; si el control sale de la vista al desplazar, **se cierra** sin mover el foco; `Esc` y clic fuera lo cierran; el fondo del popover (`::backdrop`) en la hoja móvil no deja pasar clics.

**Bloquea si:** el panel aparece en otro sitio, queda fuera del visor, no se cierra, o no se ve.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### SF-06 · GDialog: tamaño, crecer y salida · `#sec-dialog`, `#sec-form` · [BLOQUEA 0.1.0]
**Hacer:** abre «Con inset y pie» (centrado), «Con scroll», «Formulario» (con GFormReveal dentro: «Nueva cita» en `#sec-form`), y estrecha la ventana a menos de 520 px de ancho. Con el diálogo abierto, intenta desplazar la página de detrás.

**Debe verse:** el diálogo no mueve su **borde superior** al crecer (un bloque condicional empuja hacia abajo); la página de atrás **no se desplaza**; el fondo (`::backdrop`) oscurece; a ≤ 520 px entra como hoja o a ancho completo sin cortes.

**Bloquea si:** el contenido del diálogo queda cortado sin poder desplazarlo, o la página de detrás se desplaza.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### SF-07 · GTooltip: ratón, teclado y WCAG 1.4.13 · `#sec-tooltip` · [BLOQUEA 0.1.0] · **núcleo**
**Hacer:** pasa el ratón por un botón de la barra, muévelo **sobre la etiqueta**, quítalo; luego `Opción+Tab` o `Tab` entre botones; `Esc`.

**Debe verse:** con el ratón aparece tras una espera corta; al moverlo hacia la etiqueta **no desaparece** (la pestaña hace de puente); `Esc` la cierra sin mover el foco; con teclado aparece al instante y **viaja** de control en control; la etiqueta no tapa su propio control ni queda fuera del visor.

**Bloquea si:** la etiqueta desaparece al llevar el ratón hacia ella, o no se puede cerrar con `Esc`.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

---

## Campos y datos

### SF-08 · GSlider · `#sec-slider` · [BLOQUEA 0.1.0]
**Hacer:** valor único: arrastra la píldora con el ratón; haz clic en el riel; flechas, `Mayús+flecha`, `RePág`, `Inicio`, `Fin`; teclea una cifra en la píldora enfocada y `Intro`. Rango: arrastra el **tramo entero**; intenta cruzar las asas. `ar-EG (RTL)`: ← sube.

**Debe verse:** el valor sigue al puntero; las teclas dan los pasos esperados (con un 50: → ↑ ← `Mayús+→` `RePág` `AvPág` ↓ `Inicio` `Fin` dan 45 50 45 55 65 55 50 0 100 100); las asas no se cruzan; en RTL ← sube; el anillo de foco es visible.

**Bloquea si:** el teclado no mueve el valor, o el ratón no puede arrastrar.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### SF-09 · Campos con formato: GNumberField, GTimeField · `#sec-number`, `#sec-time` · [no bloquea]
**Hacer:** escribe valores (`1234,5`; `930`; `9:30 pm`), flechas, `RePág`, `a`/`p`; deja la rueda del ratón sobre el campo (no debe cambiar el valor); usa el autocompletado de Safari donde aplique.

**Debe verse:** el valor se formatea al salir; la rueda no cambia nada; el teclado numérico se ve en iPad (no en Mac); no hay saltos de caret raros.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### SF-10 · Formularios: envío, autocompletado y Enter · `#sec-form` · [BLOQUEA 0.1.0]
**Hacer:** «Formulario corto»: `Intro` en un campo de texto (envía); deja un campo obligatorio vacío y envía; rellena con el **autocompletado de Safari** (Nombre, Correo, Teléfono país + número); en «Bloque condicional» alterna el bloque y envía.

**Debe verse:** `Intro` envía por el botón por defecto; los errores aparecen y el foco va al resumen; el autocompletado rellena sin romper el formato; los campos de un bloque cerrado **no** viajan en el envío (mira el registro bajo el formulario).

**Bloquea si:** se pierde lo escrito, el envío se bloquea sin explicación, o se envían datos de un bloque cerrado.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### SF-11 · GCombobox con trackpad y teclado · `#sec-combobox`, `#sec-combobox-multiple` · [BLOQUEA 0.1.0]
**Hacer:** clic en el campo (no abre), escribe, ↓, `Intro`; clic en la flecha; clic en una opción; «Limpiar»; en multiple, `⌘Z` para deshacer; `Esc`.

**Debe verse:** enfocar no abre; abrir y cerrar rápido con la flecha no deja el campo sin anillo de foco; la opción bajo el puntero se activa; elegir con clic funciona (flecha, opción y limpiar); `⌘Z` restaura lo último quitado.

**Bloquea si:** no se puede elegir con clic o teclado, o el campo pierde el foco al elegir.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### SF-12 · GFileField: arrastre, pegar y selector · `#sec-file-field` · [no bloquea]
**Hacer:** arrastra archivos desde Finder sobre el control y sobre la página; pega (⌘V) una imagen; usa el selector del sistema; añade una imagen grande y una HEIC.

**Debe verse:** la página entera responde al arrastre (destino que admite / no admite); la ficha aparece con su progreso; el selector abre; pegar añade; enviar con pendientes se bloquea con mensaje.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

---

## Tabla, acordeón y otros

### SF-13 · GTable: foco, selección y orden con clic · `#sec-table` · [BLOQUEA 0.1.0] · **núcleo**
**Hacer:** haz clic en un encabezado ordenable (dos veces), en la casilla de una fila, en «Seleccionar todo»; lanza «Simular carga» con la casilla de la 3.ª fila enfocada con `Tab` (usa la consola: `setTimeout(() => document.querySelector('#tb-simulate').click(), 5000)`).

**Debe verse:** orden y selección responden al clic; tras el clic el foco queda en el control (o, en Safari, en la tabla), **no en `body`**; durante la carga el foco pasa a la tabla y vuelve a la misma casilla de la misma fila.

**Bloquea si:** el foco cae en `body` tras una carga o un reorden.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### SF-14 · GTag: quitar con ratón y foco por programa · `#sec-tag` · [BLOQUEA 0.1.0]
**Hacer:** «Flow con huella (A)»: con el **ratón**, quita una etiqueta, usa «Deshacer», «Quitar todas» y «Deshacer» de nuevo; observa dónde queda el foco (`Tab`).

**Debe verse:** la huella queda del mismo ancho con «Deshacer» en el sitio; nada se mueve mientras el puntero está encima; el foco por programa tras un clic no se pierde (en Safari un clic no enfoca el botón).

**Bloquea si:** tras quitar con clic no hay forma de deshacer con teclado, o el foco cae en `body`.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### SF-15 · GAccordion: buscar, enlace e impresión · `#sec-accordion` · [no bloquea]
**Hacer:** busca con `⌘F` un texto que solo esté en un elemento plegado; abre `#sec-accordion` con un `#id` de un elemento; `⌘P` y mira la vista previa de impresión.

**Debe verse:** si Safari soporta `hidden="until-found"`, `⌘F` abre el elemento que contiene el texto; si no, el texto plegado no se encuentra (**anota cuál ocurre**: es un límite documentado, no un fallo del componente); un `#id` abre su elemento; en impresión, todos los elementos salen abiertos.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### SF-16 · Captura de voz con el micrófono real · `#sec-speech` · [BLOQUEA 0.1.0] · **núcleo**
**Hacer:** abre `http://localhost:4173/playground/#sec-speech` (por `localhost`; sin `?speech=self`). «Dictar en Observaciones»: concede el permiso; habla 10 s; «Pausar», «Reanudar» (¿vuelve a pedir permiso?), «Finalizar». Repite **denegando** el permiso. Con «Conversación» y la pill, bloquea la pantalla del Mac unos segundos y vuelve.

**Debe verse:** la pill refleja cada estado («Pidiendo permiso», «Grabando», «En pausa»…); con el permiso denegado aparece **«Permiso del micrófono denegado»** con "Reintentar" y la explicación; no queda ningún estado sin salida; el texto que entra en el campo es el del guion del adaptador simulado (no se transcribe tu voz: el playground no trae motor real salvo `?speech=whisper` o `?speech=web`).

**Bloquea si:** la captura queda en un estado sin mensaje ni forma de salir, o el permiso denegado no se explica.

**Anota:** si reanudar vuelve a pedir permiso, y qué ocurre al bloquear la pantalla.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

---

## Preferencias del sistema y trackpad

### SF-17 · Reducir movimiento, contraste y transparencia · varias · [BLOQUEA 0.1.0] · **núcleo**
**Hacer:** Ajustes del Sistema → Accesibilidad → Pantalla: activa **Reducir movimiento**, recarga. Abre un diálogo, una pestaña, un acordeón, un toast, un menú, una tarjeta seleccionable, la isla. Luego desactiva y activa **Aumentar contraste** y **Reducir transparencia** y revisa `#sec-badge`, `#sec-surface`, avisos y formularios.

**Debe verse:** con reducir movimiento **solo fundidos** (sin desplazamiento, escala ni giro); nada queda a medias; con aumentar contraste, bordes y textos secundarios más marcados; con reducir transparencia, el cristal pasa a relleno opaco.

**Bloquea si:** hay una animación sin fin o un elemento que no llega a su estado final.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### SF-18 · Trackpad: desplazar y deslizar · `#sec-datepicker`, `#sec-slider`, `#sec-toaster`, `#sec-tabs` · [no bloquea]
**Hacer:** con dos dedos desplaza horizontalmente el selector de fechas (cambia de mes); desplaza la página con un dedo sobre un control deslizante; desliza un aviso del toaster; desplaza la lista de pestañas.

**Debe verse:** el desplazamiento horizontal **no dispara «Atrás» del navegador**; el gesto vertical sobre el slider desplaza la página (no se atrapa); deslizar un aviso lo cierra y el botón «Cerrar» sigue disponible.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### SF-19 · Cmd frente a Ctrl en atajos · `#sec-speech`, `#sec-combobox-multiple`, `#sec-toaster`, `#sec-status` · [no bloquea]
**Hacer:** en `GTranscript`: `⌘Z` / `⌘⇧Z`, `⌘A`, `⌘C`; en el combobox multiple: `⌘Z`; `F8` (avisos), `⇧F8` (voz), `⌥F8` (isla).

**Debe verse:** `⌘` equivale a `Ctrl` en deshacer, rehacer, copiar y seleccionar todo; `F8`, `⇧F8` y `⌥F8` funcionan (con `Fn` si hace falta) y no los intercepta macOS.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

---

Al terminar, deja Safari como estaba y registra el resultado en la plantilla.
