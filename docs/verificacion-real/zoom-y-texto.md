# Zoom y texto agrandado

Prefijo de pasos: **ZM**. Lee antes el [README](./README.md) (qué es «bloquea 0.1.0», cómo registrar). Tiempo estimado: **45 min** completo; **30 min** solo los `[BLOQUEA 0.1.0]`; **25 min** solo el núcleo (los marcados `núcleo`).

Hasta ahora el zoom se **aproximó** con un visor reducido y una densidad de píxeles mayor (200 %) o de 320 px (400 %), y el texto agrandado con el tamaño de letra de la raíz. Aquí se prueba el zoom real del navegador y las preferencias de texto del sistema. Criterios de WCAG: 1.4.4 (cambiar el tamaño del texto hasta 200 %), 1.4.10 (reflujo a 320 px CSS sin desplazamiento horizontal ni pérdida), 1.4.12 (espaciado de texto) y 2.4.11 (el foco no queda tapado).

## Preparación (10 min)

1. Navegador de escritorio (Chrome, Firefox y Safari; al menos dos) con la ventana a **1280 px de ancho CSS** (maximiza en un monitor de 1280 o más y comprueba en la consola con `innerWidth`).
2. Zoom de página: `Ctrl`/`⌘` + `+`. **200 %** y **400 %**. Al 400 % la consola debe dar `innerWidth` = **320**. Si no, ajusta el tamaño de la ventana hasta que lo dé. `Ctrl`/`⌘` + `0` restablece.
3. Sirve el playground (README § Qué preparar). Modo **Claro**, Tema **Por defecto**.
4. **El propio playground es un banco** y tiene demos de ancho fijo. Para distinguir un desborde del banco de un desborde del componente, pega en la consola:

   ```js
   [...document.querySelectorAll('.pg-panel *')].filter(e => e.getBoundingClientRect().right > innerWidth + 1).slice(0, 12).map(e => (e.className.baseVal ?? e.className) || e.tagName)
   ```

   Si el elemento que sobresale es un contenedor del banco (`.fm-frame`, `.pg-panel`, una demo con `max-width` fijo), es una nota del **banco**, no del componente. Si es una clase `g-…`, es del componente.
5. Para los pasos de **móvil** (ZM-15 a ZM-17) hace falta un teléfono (ver `voiceover-ios.md` o `talkback-android.md`, preparación, para servir en la red local).

## Criterios comunes a todos los pasos de zoom

En **cada** zoom (200 % y 400 %) y con ratón y `Tab`:

1. **Sin desplazamiento horizontal** de la página ni de los componentes (la tabla pasa a tarjetas; nada obliga a desplazar a los lados).
2. **Nada se corta ni se solapa**: texto, iconos, botones, etiquetas, mensajes.
3. **Todo sigue operable** con teclado y ratón.
4. **El foco no queda tapado** por una barra fija, un pie fijo ni un popover.
5. **Nada se pierde**: la información y las funciones del 100 % siguen disponibles.

Un paso `[BLOQUEA 0.1.0]` falla si se pierde información o función (1.4.4, 1.4.10, 2.4.11). Un recorte menor que **no** esconde información (una pista que se corta, una sombra) es nota.

---

## Zoom de página (200 % y 400 %)

### ZM-01 · Formularios: distribución y etiquetas · `#sec-form` · [BLOQUEA 0.1.0] · **núcleo**
**Hacer:** a 200 % y a 400 %, recorre «Formulario corto», «Mediano», «Receta: dirección», «Campos fusionados» y «Preguntas compuestas».

**Debe verse:** las filas **se parten en líneas por su ancho propio** y cada línea termina en el mismo borde; las etiquetas se leen enteras (no recortadas); el teléfono fusionado conserva sus partes y se opera; el «(opcional)» y las ayudas no se cortan; sin desplazamiento horizontal.

**Bloquea si:** una etiqueta, un campo o un mensaje queda cortado o inalcanzable.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### ZM-02 · Formularios: resumen de errores y pie fijo · `#sec-form` · [BLOQUEA 0.1.0] · **núcleo**
**Hacer:** a 400 %, envía vacío el «Formulario corto»; usa los enlaces del resumen; en «Mediano» con el pie fijo recorre todos los campos con `Tab`.

**Debe verse:** el resumen legible y sus enlaces operables; el enlace lleva al campo con la **etiqueta a la vista**; el pie fijo **no tapa** el campo enfocado (se apila y la primaria queda última); los botones del pie caben.

**Bloquea si:** el campo enfocado queda tapado por el pie, o un botón del pie queda fuera de alcance.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### ZM-03 · GTable: tarjetas, filtros y paginación · `#sec-table` · [BLOQUEA 0.1.0] · **núcleo**
**Hacer:** a 200 % y a 400 %: la tabla pasa a tarjetas; ordena, selecciona, abre el menú de acciones; crea un filtro (la hoja inferior), paginación; «Simular carga» y «Simular fallo».

**Debe verse:** en tarjetas no se pierde ningún dato ni control; el editor del filtro es una hoja operable; la barra de fallo y el esqueleto caben; la paginación se compacta («Página N de M»); sin desplazamiento horizontal.

**Bloquea si:** se pierde un dato o un control, o hay que desplazar a los lados.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### ZM-04 · GDialog y confirmaciones · `#sec-dialog` · [BLOQUEA 0.1.0] · **núcleo**
**Hacer:** a 200 % y 400 % abre «Con inset y pie», «Con scroll», «Confirmación», «Formulario» y «Pantalla completa».

**Debe verse:** el diálogo cabe en el visor; si el contenido no cabe, **el cuerpo se desplaza** y el título y el pie siguen alcanzables; los botones del pie no se cortan; el botón de cierre se ve y se opera.

**Bloquea si:** una acción del pie o el cierre queda fuera del visor sin poder alcanzarla.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### ZM-05 · Paneles anclados: GSelect, GMenu, GCombobox, GDatePicker, GHelper · `#sec-select`, `#sec-menu`, `#sec-combobox`, `#sec-datepicker`, `#sec-helper` · [BLOQUEA 0.1.0] · **núcleo**
**Hacer:** a 400 % abre cada panel; recorre las opciones; en el selector de fechas comprueba meses y botones; el combobox con la paleta.

**Debe verse:** el panel cabe en el visor (a 400 % pasa a hoja inferior o a ancho completo); las filas no se cortan; el selector de fechas muestra **un mes** con celdas cómodas; el panel se cierra con `Esc` y devuelve el foco.

**Bloquea si:** una opción o botón del panel queda fuera del visor sin poder alcanzarla.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### ZM-06 · GTooltip · `#sec-tooltip` · [BLOQUEA 0.1.0]
**Hacer:** a 400 % recorre con `Tab` la barra de herramientas y los controles sueltos («Guardar los cambios del expediente», «Continuar»).

**Debe verse:** la etiqueta cabe con sus dos márgenes dentro del visor; no se corta; el texto largo parte en líneas; no tapa el control enfocado.

**Bloquea si:** la etiqueta se sale del visor y no se puede leer.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### ZM-07 · GTabs, GBreadcrumbs, GSidebar · `#sec-tabs`, `#sec-breadcrumbs`, `#sec-sidebar` · [BLOQUEA 0.1.0]
**Hacer:** a 200 % y 400 %: pestañas (desbordamiento «Más pestañas»), migas (cambia de etapa: líquida, escalera, solo icono), barra lateral (riel, drawer, navbar).

**Debe verse:** el desbordamiento de pestañas es operable (botones de borde y «Más»); las migas **no pierden niveles** (la ruta entera sigue a un toque); la barra lateral pasa a drawer y se opera; sin desplazamiento horizontal de la página.

**Bloquea si:** se pierde un nivel de la ruta, una pestaña o un item de navegación sin forma de alcanzarlo.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### ZM-08 · GAccordion con encabezado pegado · `#sec-accordion` · [BLOQUEA 0.1.0] · **núcleo**
**Hacer:** a 200 % y 400 %, en «Encabezado pegado (sticky)» recorre con `Tab` el contenido de un elemento abierto largo; abre «Diálogo con un acordeón pegado».

**Debe verse:** el encabezado pegado **no tapa** el control enfocado (2.4.11); el título largo se parte sin cortar; el `meta` no parte palabras; las acciones ocupan como mucho un tercio de la fila.

**Bloquea si:** el foco queda tapado por el encabezado pegado.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### ZM-09 · Captura de voz y GTranscript · `?speech=self#sec-speech` · [BLOQUEA 0.1.0] · **núcleo**
**Hacer:** a 200 % y 400 % inicia un dictado y una conversación; abre el panel; recorre la transcripción (vista estrecha: filas apiladas) y su menú «Más».

**Debe verse:** la pill y el panel **dentro del visor** (el panel se desplaza en su alto); en la transcripción, «Copiar», «Mostrar cambios» y «Hablantes» pasan al menú «Más»; sin desplazamiento horizontal; todos los botones alcanzables.

**Bloquea si:** la pill o un botón del panel queda fuera del visor o tapado.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### ZM-10 · GToaster e Isla de estado · `#sec-toaster`, `#sec-status` · [BLOQUEA 0.1.0] · **núcleo**
**Hacer:** a 400 % lanza varios avisos y la isla con condiciones largas y un detalle técnico; ábrela y repliégala; a la vez la pill de voz.

**Debe verse:** los avisos dentro del margen y legibles; la isla abierta **dentro del visor** y «Entendido» visible; el detalle técnico se parte; la convivencia voz → isla → avisos no se solapa.

**Bloquea si:** un aviso o la isla se corta y deja el mensaje ilegible, o tapa un control sin poder cerrarse.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### ZM-11 · GSlider, GTag, GStepper, GLoadRegion, GEmpty · `#sec-slider`, `#sec-tag`, `#sec-stepper`, `#sec-load-region` · [no bloquea]
**Hacer:** a 200 % y 400 %: la píldora de los sliders (cifras largas), el rango, etiquetas largas y racimos, stepper, cargas y vacíos.

**Debe verse:** la cifra de la píldora no se corta; las etiquetas largas se parten o se recortan **con el nombre entero accesible**; el stepper se opera; los vacíos y moldes caben.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

---

## Solo texto y espaciado

### ZM-12 · Zoom solo de texto al 200 % · `#sec-form`, `#sec-table`, `#sec-dialog` · [BLOQUEA 0.1.0]
**Hacer:** **Firefox:** `Alt` → Ver → Zoom → *Aplicar zoom solo al texto*; llega a 200 %. **Safari:** Visualización → *Zoom solo de texto* (si tu versión lo ofrece). Repasa «Formulario corto», la tabla y el diálogo «Con inset y pie».

**Debe verse:** los textos crecen sin que se corten botones, etiquetas ni mensajes; los controles crecen con su texto (la altura sale del texto); nada se solapa; sigue operable.

**Bloquea si:** un texto se corta o se solapa y se pierde información.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### ZM-13 · Tamaño de letra del navegador · varias · [no bloquea]
**Hacer:** Chrome → Ajustes → Apariencia → *Tamaño de fuente*: «Muy grande» (equivale a un 150 % de la raíz); recarga y revisa formularios, tabla, menú y tooltip. Firefox: Ajustes → General → Fuentes → tamaño 24.

**Debe verse:** la raíz cambia y los componentes escalan con ella (usan `rem`); sin recortes; botones e inputs con su texto dentro.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### ZM-14 · Espaciado de texto (WCAG 1.4.12) · `#sec-form`, `#sec-table`, `#sec-tabs`, `#sec-accordion` · [BLOQUEA 0.1.0] · **núcleo**
**Hacer:** pega en la consola:

```js
const s = document.createElement('style')
s.textContent = '* { line-height: 1.5 !important; letter-spacing: .12em !important; word-spacing: .16em !important } p, li { margin-bottom: 2em !important }'
document.head.append(s)
```

Revisa formularios, tabla, pestañas, acordeón, botones y menús. Recarga para quitarlo.

**Debe verse:** no se pierde contenido ni función: los textos no se cortan ni se solapan; los botones y campos crecen con su texto; las pestañas siguen operables.

**Bloquea si:** un texto queda cortado o oculto, o un control deja de ser operable.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

---

## Texto agrandado del sistema y móvil

### ZM-15 · iPhone: tamaño de texto y zoom de página · `#sec-form`, `#sec-table`, `#sec-dialog` · [no bloquea]
**Hacer:** Ajustes → Accesibilidad → Pantalla y tamaño del texto → *Texto más grande* (al máximo, con tamaños de accesibilidad); en Safari, menú **aA** → tamaño del texto al 200 % o más; y el zoom de página. Revisa formulario, tabla (tarjetas) y un diálogo.

**Debe verse:** el texto que sigue al sistema crece (las páginas web solo siguen el ajuste de Safari **aA**); sin recortes; controles tocables (≥ 44 px) y operables.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### ZM-16 · Android: tamaño de fuente y de pantalla · `#sec-form`, `#sec-table`, `#sec-dialog` · [no bloquea]
**Hacer:** Ajustes → Pantalla → *Tamaño de fuente* (máximo) y *Tamaño de pantalla* (máximo); en Chrome, Ajustes → Accesibilidad → *Escala del texto* al máximo. Recarga y revisa formulario, tabla y diálogo.

**Debe verse:** el texto crece; sin recortes; el teclado virtual no tapa el campo enfocado; los controles siguen siendo tocables.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### ZM-17 · Orientación y 320 px en móvil · varias · [no bloquea]
**Hacer:** en un teléfono, gira a horizontal y vuelve a vertical (con el bloqueo de rotación desactivado); revisa un formulario, la tabla, el diálogo y la hoja de voz.

**Debe verse:** el contenido funciona en **ambas** orientaciones (1.3.4); sin cortes; las hojas inferiores caben y se desplazan.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

### ZM-18 · RTL a 400 % · `#sec-form`, `#sec-slider`, `#sec-combobox`, `#sec-time`, `#sec-number` · [no bloquea]
**Hacer:** a 400 % revisa las demos RTL (`ar-EG`, `he`): formulario, slider, combobox, hora, número, tag.

**Debe verse:** todo se espeja; las flechas ←/→ del slider siguen la dirección visual; el texto árabe/hebreo mezclado con números no se corta; sin desplazamiento horizontal.

**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:

---

Al terminar, restablece el zoom (`Ctrl`/`⌘` + `0`) y registra el resultado en la plantilla, indicando **navegador y nivel de zoom**.
