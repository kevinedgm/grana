# Declaración — campo de archivos (`GFileField`, nombre de trabajo), r02: tres conceptos de forma

> kiwi, 2026-10-05. Prototipo: `index.html?c=A|B|C` sobre el motor común (`../engine.js`), la fila de `../parts.js` y `concepts.js`, con componentes reales de `dist/` (`GSummary`, `GProgress`, `GBtn`, `GIcon`, `GInput`, `GFormRow`, `GForm`, `GErrorSummary`) y los **tokens del tema por defecto** (`concepts.css`). La base funcional (r01: control real, tres vías, validación, modelo, adaptador, anuncios, envío, foco) es **común a los tres y no se repite**; cada concepto pasa la misma batería que la base. Cifras en «Comprobaciones».

## Los mismos casos en los tres

1. **Receta escaneada** junto al campo «Folio de receta» (`GInput` real): un archivo, PDF o imagen, 5 MB.
2. **Fotos de la lesión**: varias (máximo 5, 8 MB, imágenes), vista previa, subida inmediata con el adaptador simulado, una que falla al primer intento, una lenta, sin conexión, solo lectura y deshabilitado, envío bloqueado con subidas pendientes.
3. **Documentos de identidad**: INE por los dos lados y comprobante de domicilio: **tres documentos distintos**, que es el caso que una «bolsa de archivos» resuelve peor.

---

## A · Línea de adjuntos

**Estructura.** El campo tiene la anatomía y la **medida de un `GInput`**: etiqueta · caja · pie, caja de `space × 9` (36px con el tema por defecto). Dentro de la caja, los archivos son **fichas** (`GSummary` `inline` `xs`: miniatura o icono y nombre; el tamaño va al lector) con su «Quitar» (y «Reintentar» en error), y la última pieza es **«Adjuntar archivo»**, que es el `<input type="file">` (pista atenuada al lado mientras está vacío: «PDF o imagen · hasta 5 MB»). Con archivos, la caja crece **hacia abajo** por líneas, como un campo de etiquetas; nada de encima se mueve. Comparte fila en una `GFormRow` (tres pistas por `subgrid`, como `GInput`).

**Comportamiento.** **No hay zona de soltar.** Cuando la persona arrastra archivos **sobre la página** (una escucha común en `document`), **todos los campos de archivos se despiertan a la vez**: los que admiten lo que lleva encienden un **destino** (capa encima de la caja, `space × 2` más grande por cada lado, acento: «Soltar aquí · PDF o imagen»); los que no lo admiten lo dicen en gris discontinuo («No admite estos archivos»). Al pasar por uno, el destino se llena («Soltar en Receta escaneada»). Al soltar o salir de la ventana, todo se apaga. Soltar fuera de un destino **no abre el archivo** (r01, 13).

**Movimiento.** El destino aparece con `--g-ease-spring` (opacidad y escala 0,97 → 1). La ficha nueva **aterriza** (escala 0,86 → 1, `--g-duration-slow`, `--g-ease-spring`). Mientras sube, **la ficha es la barra**: su fondo se llena con `accent-soft` hacia el final de la lectura (`transform: scaleX`, sin layout; espejo en RTL); al terminar, un filo `success` en su borde inferior. Con movimiento reducido: sin aterrizaje, sin escala del destino y el relleno salta sin transición.

### Qué lo hace distinto (A)

Todos los frameworks reservan un rectángulo permanente para un gesto que en móvil y con teclado no existe. A **no reserva nada**: un campo de archivos ocupa lo que un campo de texto, así que un formulario con tres adjuntos sigue teniendo el ritmo de un formulario, y la receta se pone **en la misma línea** que su folio. El destino aparece **cuando hace falta y donde hace falta**, en todos los campos a la vez y diciendo cuáles admiten lo que llevas: la persona no tiene que adivinar en qué zona discontinua cabe su PDF. Y la ficha que sube **es** su barra: el progreso está en el objeto, no en otra línea.

### Gana y arriesga

- **Gana:** el menor alto (64px el campo vacío con etiqueta y pie, frente a 126px de la base); comparte fila (caja alineada con `GInput` al píxel en los tres motores); el destino es **más grande** que la caja (358 × 50 sobre 344 × 36); el arrastre se entiende en toda la página; se lee como el resto de los campos de Grana.
- **Arriesga:** **descubribilidad del arrastre**: en reposo nada dice «puedes soltar aquí» (la pista y «Adjuntar» sí dicen qué y cuánto). Las fichas recortan nombres largos (el nombre completo está en el `title` y en el lector, y la ficha recortada no es la única fuente, #352). La miniatura es pequeña (20px): para fotos, comprobar «es la correcta» cuesta. Una escucha en `document` (la de r01, 13, más el estado común de arrastre).

### Medidas (A)

| Medida | Resultado |
| --- | --- |
| En `GFormRow` con `GInput` | Misma línea; parte superior y alto de la caja iguales (36px; Δ 0px en Chromium, Firefox y WebKit) |
| Arrastre de un PDF sobre la página | Se encienden «Receta escaneada» y «Documentos de identidad»; «Fotos de la lesión» (solo imágenes) dice que no; Δ0 de las tres cajas |
| Destino | 358 × 50px sobre una caja de 344 × 36px |
| Soltar fuera de un campo | `preventDefault` (no navega) y los destinos se apagan |
| La ficha es la barra | Con 5 % subido, `scaleX(0,05)` del relleno |
| Alto | Vacío 64px (etiqueta, caja y pie); con tres fotos, dos líneas de fichas |
| Contraste | Mínimo 5.69:1 («Adjuntar», `accent-text` sobre la superficie) |

**Coste:** medio. El estado de arrastre de página es un módulo compartido (una escucha para todos los campos); la capa de destino es CSS y un atributo. **Riesgos:** descubribilidad; nombres recortados; `GBtn` `xs` de icono se encoge a 21,5px dentro de una ficha flexible (arreglado en el prototipo con `flex: none`; hallazgo L23).

---

## B · Mesa de luz

**Estructura.** Una **mesa** (superficie hundida, `radius-lg`) con una rejilla de **piezas** (`minmax(space × 30, 1fr)`): cada archivo es una pieza con su **miniatura 4:3** (o, si no es imagen, su tipo en grande: «PDF» con el icono), y debajo su `GSummary` `row` `xs` (nombre, tamaño, estado). «Quitar» (y «Reintentar») en la esquina, sobre la imagen, ≥ 24px. **«Añadir» es la última pieza de la mesa** (y es el `<input type="file">`), con «3 / 5»: está donde aparecerá lo nuevo. Vacía, la mesa es solo esa pieza.

**Comportamiento.** La **mesa entera** recibe el arrastre; al entrar, la pieza «Añadir» se vuelve sólida y dice **cuántos** vas a soltar («Soltar 2») o por qué no («No se admite», «Mesa llena»). Una pieza en error se queda **en gris** con el borde de peligro, el mensaje bajo el nombre y «Reintentar» en la esquina.

**Movimiento.** **Subir es revelar:** un velo de la superficie (78 % de opacidad, en escala de grises) cubre la parte aún no subida y **se retira de abajo arriba** (`scaleY`, `--g-ease-out`) mientras un rótulo en el centro dice «45 %». La pieza nueva aterriza (`--g-ease-spring`); el «+» de «Añadir» crece al recibir (`--g-ease-spring`). Movimiento reducido: sin aterrizaje ni crecimiento; el velo salta.

### Qué lo hace distinto (B)

Para fotos de evidencia, el nombre del archivo no identifica nada («IMG_4471.jpg»): lo que hay que comprobar es **si es la foto correcta**. B pone la imagen en el centro y el nombre debajo. «Añadir» no es una zona aparte: es **un hueco más de la mesa**, así que causa y efecto quedan juntos (lo que sueltas aparece donde soltaste). Y la subida **revela** la foto: se ve qué se está enviando mientras se envía.

### Gana y arriesga

- **Gana:** la mejor verificación visual (miniatura grande); el destino es el propio contenido; «Soltar 2» antes de soltar (Chromium, Firefox y WebKit con `DataTransfer` construido); piezas de alto fijo entre estados (Δ0 medido).
- **Arriesga:** **el más alto** (192px vacío; para un solo PDF es desproporcionado). Los documentos sin miniatura son todos iguales («PDF», «PDF», «PDF») y en la caja de identidad no se distingue el frente del reverso más que por el nombre recortado. No comparte fila. Las URL de objeto de imágenes grandes cuestan memoria (se revocan al quitar). No resuelve «qué falta».

### Medidas (B)

| Medida | Resultado |
| --- | --- |
| Δ0 de la pieza entre subiendo y subida | Pasa (tres motores) |
| Velo | Con 8 % subido, `scaleY(0,92)` |
| «Añadir» | Última pieza de la mesa; 126 × 151px con tres fotos a 1000px |
| Arrastre | «Soltar 2» con dos imágenes; «Mesa llena» si no caben |
| Quitar | ≥ 24 × 24px en la esquina |
| Alto | Vacío 192px; con tres fotos 223px (una fila) |
| Contraste | Mínimo 5.69:1 |

**Coste:** medio. Rejilla, velo (CSS con `--_p`), miniaturas. **Riesgos:** alto; documentos indistinguibles; memoria con muchas fotos grandes; reordenar piezas (pedido natural en una mesa) queda fuera.

---

## C · Lo que falta

**Estructura.** El campo es un **`<fieldset>`** con `<legend>` y **una casilla con nombre por documento esperado** (`slots`: `INE · frente`, `INE · reverso`, `Comprobante de domicilio`, cada una con su `accept`, su pista y si es opcional; una casilla puede admitir varios, p. ej. «Otras fotos»). Cada casilla tiene su **marca** (vacía, falta, subiendo, lista, error: `circle`, `circle-alert`, `loader-circle`, `circle-check`), su **propio `<input type="file">`** con su etiqueta y su `name` (`docs[ine-frente]`), y, llena, su ficha (`GSummary` `row`) con «Quitar» y «Cambiar». Arriba, el **recuento**: «2 de 3», una barra de segmentos (uno por casilla obligatoria) y «Pendiente: Comprobante de domicilio»; completo, «Completo».

**Comportamiento.** Cada casilla es un campo para `GForm`: **su error, su marca y su enlace en el resumen** («Falta: INE · reverso» lleva a ese control). Soltar en una casilla la llena (o la cambia). **Soltar varios en el grupo los reparte** entre las casillas libres que los admiten; si el nombre del archivo comparte palabras con el de una casilla («INE reverso.png» → «INE · reverso»), esa gana; se anuncia el reparto («INE frente.png → INE · frente. INE reverso.png → INE · reverso.») y la casilla elegida se ilumina un instante. Lo que no tiene casilla libre se dice y no entra.

**Movimiento.** La marca de una casilla que se completa **salta** a `circle-check` con `--g-ease-bounce` (escala 0,4 → 1); el segmento del recuento se llena con `--g-ease-out`; la ficha aterriza. Movimiento reducido: sin salto, sin giro del `loader-circle`, sin transiciones.

### Qué lo hace distinto (C)

Los frameworks tratan los adjuntos como una **bolsa**: «sube tu INE por ambos lados y tu comprobante» se escribe en una ayuda, y la persona descubre al enviar (o días después, cuando la rechazan) que subió dos veces el frente. C convierte la instrucción en **estructura**: el formulario dice qué falta, con nombre, antes de enviar, y el error y el resumen señalan **la casilla exacta**. Soltar todo de golpe sigue funcionando: el campo reparte, y lo dice.

### Gana y arriesga

- **Gana:** el único que resuelve «documentos distintos» (caso 3) sin texto de ayuda; error y resumen por casilla (enlace medido al `<input>` de la casilla); envío con claves con significado (`docs[ine-frente]`) en vez de un arreglo anónimo; el recuento es la mejor señal de avance de todo el formulario.
- **Arriesga:** **el más alto** (376px el caso de identidad vacío; 473px las fotos con cuatro casillas) y el de **mayor coste**: N controles, un modelo por objeto, el reparto y el recuento. Exige que la aplicación **sepa** qué pide (si no lo sabe, es A o B). El reparto por nombre puede equivocarse (por eso solo ocurre al soltar en el grupo, se anuncia y se cambia con un gesto). Para «varias fotos de lo que sea» es excesivo: allí es una casilla `multiple` dentro de C o, mejor, A o B.

### Medidas (C)

| Medida | Resultado |
| --- | --- |
| Estructura | `fieldset` con `legend`; tres `<input type="file">`, cada uno con la etiqueta de su casilla |
| Reparto | «INE reverso.png» e «INE frente.png» (en ese orden) van a su casilla por nombre; anunciado |
| Recuento | «2 de 3» y «Pendiente: Comprobante de domicilio»; «3 de 3» y tres casillas listas al completar |
| Envío | Un oculto por casilla con su clave (`docs[ine-frente]`, `docs[ine-reverso]`) |
| Resumen | El enlace del error apunta al `<input>` de la casilla que falta (`#id`) |
| Rechazo | En la casilla, con su aviso |
| Foco | Quitar en una casilla de un archivo → su control |
| Δ0 | El cuerpo de la casilla no cambia de alto entre subiendo y subida |
| Contraste | Mínimo 5.69:1 |

**Coste:** alto. **Riesgos:** alto; complejidad de API (`slots`, modelo por clave); el reparto; que una aplicación lo use para listas que no lo son.

---

## Comparativa

| | Base (r01) | A · Línea de adjuntos | B · Mesa de luz | C · Lo que falta |
| --- | --- | --- | --- | --- |
| Pregunta que contesta | — | ¿Dónde va esto? | ¿Es la foto correcta? | ¿Qué me falta? |
| Alto vacío (fotos, con etiqueta y pie) | 126px | **64px** | 192px | 473px (4 casillas) |
| Comparte fila con otros campos | No | **Sí** (alineado al píxel) | No | No |
| Destino de arrastre | Zona fija | **Toda la página**; cada campo dice si admite | La mesa entera; cuenta lo que llega | El grupo reparte; cada casilla recibe |
| Vista previa | 32px | 20px | **4:3 grande** | 32px |
| Progreso | Carril bajo la ficha | **La ficha se llena** | **El velo se retira** | Carril + marca |
| Documentos distintos (caso 3) | Ayuda en texto | Ayuda en texto | Ayuda en texto | **Una casilla por documento, error y enlace por casilla** |
| Movimiento propio | Ninguno | Destinos que despiertan, ficha que se llena, aterrizaje | Revelado, aterrizaje, «+» que crece | Marca que salta, recuento, aterrizaje |
| Coste | — | Medio | Medio | Alto |
| Riesgo principal | Genérico | Descubrir el arrastre | Alto y documentos iguales | Alto, API y reparto |

## Recomendación

**A como forma por defecto, C como modo para documentos distintos y B como apariencia para galerías de imágenes, en ese orden de entrega.**

- **A** es la forma de `GFileField`: resuelve el problema de raíz (el rectángulo permanente), encaja en `GFormRow` como cualquier campo y lleva la personalidad en el comportamiento (destinos en toda la página, la ficha que es su barra). Es el caso más común: «adjunta la receta», «adjunta el estudio».
- **C** entra como **modo** (`slots`), no como componente aparte: comparte motor, adaptador, validación y anuncios; cambia la estructura y el modelo. Es la que más vale en el dominio de Grana (expedientes, trámites) y la que más cuesta: puede ir en una segunda entrega con su propio contrato de modelo.
- **B** como **apariencia** (`appearance="gallery"`) para cuando el contenido son fotos y verificar la imagen es la tarea; en una tercera entrega. Su revelado de la subida se puede llevar a las miniaturas de A y C sin la mesa.

## Qué lo hace distinto (resumen de la recomendación)

Un campo de archivos **que no ocupa sitio para el gesto**: mide lo que un campo, despierta cuando llevas archivos sobre la página y te dice dónde caben; la ficha que sube es su propia barra; nada salta; soltar mal no destruye nada; y cuando el formulario pide documentos concretos, **dice cuáles faltan** en lugar de esconderlo en una ayuda.

## Comprobaciones

`node design/lab/file-field/verificar.mjs` · 2026-10-05 · Chromium, Firefox, WebKit · **558 de 558 comprobaciones pasan**, más **4 no verificables aquí** (pegar en Firefox: el motor no admite archivos en un `ClipboardEvent` construido; el pegado real no se pudo probar).

| Motor | Base | A | B | C |
| --- | --- | --- | --- | --- |
| Chromium | 49/49 | 59/59 | 56/56 | 26/26 |
| Firefox | 47/47 | 57/57 | 54/54 | 24/24 |
| WebKit | 48/48 | 58/58 | 55/55 | 25/25 |

Por concepto y motor: la batería de r01 (ver `../r01/declaracion.md`) más lo propio (A: fila con `GInput`, arrastre de página con admite / no admite, Δ0 de todas las cajas, destino mayor que la caja, soltar fuera, ficha-barra; B: velo, Δ0 de la pieza, «Añadir» última y ≥ 44px, «Soltar 2», «Quitar» ≥ 24px; C: `fieldset`, un control por casilla con su etiqueta, reparto por nombre y anunciado, recuento, ocultos con clave, resumen que enlaza a la casilla, rechazo en la casilla, Tab y Espacio en una casilla, foco tras quitar, Δ0, reparto de fotos, solo lectura, pegar), con 320px LTR y RTL y 1024px RTL (sin desbordamiento, objetivos ≥ 24px), movimiento con y sin `reduce` (animación de aterrizaje presente / ausente), contraste en Chromium y consola limpia.

**WebKit y Tab:** con los ajustes por defecto de Safari, Tab solo recorre campos de texto; el `<input type="file">` (como cualquier botón, también `GBtn`) se alcanza con **Opción+Tab**. La batería usa Opción+Tab en WebKit. No es propio de este campo.

**No comprobado:** lector de pantalla real (en especial: el `<input type="file">` oculto y su descripción; las fichas de A, cuyo tamaño solo va al lector; el reparto de C y el `fieldset` con varios controles de archivo; el `aria-hidden` del destino de A); **arrastre real** del sistema (eventos construidos con `DataTransfer`; Safari real puede no dar los tipos durante el arrastre: entonces A y B dan el destino por bueno y deciden al soltar); **pegar real**; `forced-colors` (reglas escritas, sin medir); tema oscuro y un tema distinto al por defecto (contrastes del tema claro); táctil real y móvil real (hoja del sistema, cámara); zoom de texto al 200 %; cientos de archivos; memoria de las URL de objeto con fotos de 20 MB; el `color-mix` del destino de A con otro tema.

## Hallazgos para lima

(Siguen a los L1 a L16 de `../r01/declaracion.md`.)

| # | Tema | Propuesta |
| --- | --- | --- |
| L17 | Identidad en `DECISIONS.md` | Registrar la elección del usuario (A, A+C, …), las semillas descartadas (abanico al pasar el puntero, zona circular) y que C reparte solo al soltar en el grupo |
| L18 | A · anatomía | Tres hijos (etiqueta · caja · pie); en `GFormRow`, `subgrid` como `GInput`; alto de caja = el de `GInput` del mismo `size`/`density` (comparte sus alias). Valorar `--g-form-min` para que la fila se parta antes de que «Adjuntar» quede sin sitio |
| L19 | A · destinos de página | Estado de arrastre **compartido** por todos los campos (una escucha en `document`): `is-awake` + `is-awake-ok`/`is-awake-no` en la raíz; capa `__portal` (`aria-hidden`) `space × 2` mayor que la caja, que solo recibe el puntero mientras se arrastra. Regla de tipos durante el arrastre: `dragAccepts` (con extensiones en `accept`, se da por bueno) |
| L20 | A · ficha-barra | Ficha = `GSummary` `inline` `xs`; el progreso lo escribe bruno en `--_p` (como `--_value` de `GProgress`) y coco lo pinta; la semántica la da un `GProgress` sin fila visible (L13) |
| L21 | B · `appearance="gallery"` | Pieza 4:3, mínimo `space × 30`; velo con `--_p`; «Añadir» como última pieza; en documentos, el tipo en grande. Reservar el nombre |
| L22 | C · `slots` | `slots: [{ key, label, accept?, maxSize?, multiple?, max?, optional?, hint? }]`; modelo **objeto por clave** `{ [key]: Entry[] }`; `name` de cada control `${name}[${key}]` (y de los ocultos); cada casilla se registra en `GForm` con ese nombre (error, marca, enlace del resumen); `fieldset` + `legend`; recuento con `labels.progress` (`{done}`, `{total}`) y `labels.pending` (`{list}`); reparto al soltar en el grupo (primera casilla libre que admite, con preferencia por coincidencia de palabras con la etiqueta) con `labels.assigned` (`{name}`, `{slot}`) y `labels.unassigned` |
| L23 | `GBtn` | Un `GBtn` `size="xs"` `icon` dentro de un contenedor flexible se encoge a 21,5px (bajo el mínimo de 24px). Para coco: `flex-shrink: 0` o `min-inline-size` en `.g-btn--icon` |
| L24 | Movimiento | Sin tokens nuevos: `--g-ease-spring` (aterrizaje, destino), `--g-ease-bounce` (marca de C), `--g-ease-out` (velo, recuento), `--g-duration-slow`; todo apagado con `prefers-reduced-motion: reduce` (patrón único de #299 a #305) |
| L25 | Superficies | El destino de A usa `color-mix` de `accent-soft` (88 %) para dejar ver la caja debajo; coco decide si basta `accent-soft` sólido (más simple) y lo mide en oscuro |

## Preguntas de producto (cuatro)

1. **¿Qué concepto es la identidad del campo de archivos?** A · Línea de adjuntos, B · Mesa de luz, C · Lo que falta, o una mezcla. **Recomendación: A por defecto, C como modo `slots` (segunda entrega) y B como apariencia `gallery` (tercera).**
2. **¿Cuándo empieza la subida?** (a) sola al añadir, con el adaptador de la aplicación, o (b) al enviar el formulario. **Recomendación: (a).** El error aparece cuando la persona aún tiene el archivo a mano, y el envío no espera minutos. Sin adaptador, el archivo viaja con el envío nativo (eso ya es «al enviar», sin estados de subida). Un tercer modo «sube al enviar con progreso» queda fuera de la v1.
3. **¿Qué pasa al enviar con archivos a medio subir o fallidos?** (a) se bloquea como un error del campo, con enlace en el resumen, o (b) se permite enviar sin ellos tras confirmar. **Recomendación: (a).** Nadie debe guardar un expediente creyendo que lleva la radiografía que no subió; y enviar solo al terminar sería un cambio de contexto inesperado (3.2.2).
4. **¿La página entera responde al arrastre?** Mientras haya un campo de archivos: (a) todos los campos despiertan sus destinos al arrastrar sobre la página y soltar fuera de ellos no abre el archivo, o (b) solo responde la zona del campo y el navegador hace lo de siempre fuera. **Recomendación: (a)** (es el núcleo de A; la protección al soltar fuera vale para cualquier concepto).
