# Declaración — galería con visor (`GGallery`), r01

> kiwi, 2026-10-21. **Estado: en revisión** (una pregunta de producto: la forma). Prototipo: `index.html?c=base|A|B|C` (`&set=hotel|restaurante`, `&dir=rtl`, `&broken=1`, `&one=1`). Tokens **reales** del tema por defecto (`packages/vue/dist/grana.css` y `fonts.css`), marcado de `GBtn` real (clases de `grana.css`), el visor en la **zona de marca** real (`data-g-zone="brand"`, §44 de `tokens.md`); la galería y el visor son del prototipo (`gallery.js`, `gallery.css`). Iconos solo Lucide (`design/lab/lucide-icons.js`). Fotos: marcadores locales (`design/lab/marketing/r01/fotos.js`, sin recursos externos). Verificación: `node design/lab/gallery/r01/verificar.mjs` (puerto 4232), **434 de 434** en Chromium, Firefox y WebKit (§«Comprobaciones»). Auditoría previa y solapes: `brief.md`. La base deriva de HTML, WAI-ARIA APG (*Dialog (Modal)*, *Carousel* sin rotación, *Disclosure*), WCAG 2.2 AA (1.1.1, 1.3.1, 1.4.3, 1.4.10, 1.4.11, 2.1.1, 2.2.2, 2.4.3, 2.4.7, 2.4.11, 2.5.1, 2.5.7, 2.5.8, 4.1.2, 4.1.3) y los contratos vigentes de `GDialog` (#292, #301, #565 a #568) y de la zona de marca (#620 a #625).
>
> **Nombres del prototipo → propuesta:** `.gal` = `.g-gallery`, `.gv` = `.g-gallery__viewer` (o `.g-gallery-viewer` si lima lo saca a pieza propia); `gal__thumb` = `g-gallery__thumb`.

## Anatomía (base)

```
section.g-gallery  aria-labelledby=<título>          ← raíz; el título lo pone la aplicación (slot o prop) con su nivel (GSection, #720)
├─ div.__head
│  ├─ h2.__title                                     ← «Habitación Jardín» (nivel heredado de GSection o fijado)
│  └─ p.__total                                      ← «10 fotos» (labels.total, con plural)
└─ ul.__grid  role=list                              ← lista de fotos (role=list explícito: Safari quita la semántica con list-style:none)
   └─ li
      └─ a.__thumb href=<foto grande> aria-haspopup=dialog   ← sin JS: abre la foto (mejora progresiva); con JS: abre el visor
         └─ img alt=<de la aplicación> width height loading=lazy (salvo las primeras)

dialog.g-gallery__viewer (GDialog / topModal)  aria-label="<título>, galería"  data-g-zone=brand
├─ div.__bar
│  ├─ h2.__vtitle aria-hidden                        ← repetición visual del título (el nombre ya va en el diálogo)
│  ├─ p.__count aria-hidden                          ← «3 de 10» visible (lo oye la región viva)
│  ├─ button.__zoom aria-pressed                     ← «Ampliar» / «Reducir» (labels)
│  └─ button.__close                                 ← «Cerrar galería»
├─ div.__stage                                       ← la foto; gesto; doble clic amplía
│  ├─ img.__img alt=<de la aplicación>
│  └─ p.__broken                                     ← «No se pudo cargar esta foto: <alt>» (estado de error)
├─ p.__caption aria-hidden                           ← pie visible (caption de la aplicación); el alt ya lo nombra
├─ div.__nav
│  ├─ button.__prev aria-disabled                    ← «Foto anterior»
│  └─ button.__next autofocus aria-disabled          ← «Foto siguiente»; foco inicial
└─ p.__live aria-live=polite aria-atomic             ← «3 de 10. <alt>.»; «Última foto.»
```

## Decisiones de la base

**Semántica y datos**

1. **Datos de la aplicación, no del componente.** Cada foto: `src` (grande), `thumb` (opcional), `alt` (obligatorio, aviso de desarrollo si falta), `caption` (opcional, visible), `width`/`height` (obligatorios para reservar el hueco: CLS 0), `group` (opcional; lo usa A). Sin `fetch`: las URL las pide el navegador (`AGENTS.md`). **1.1.1, 1.3.1.**
2. **Miniatura = enlace a la foto grande con `aria-haspopup="dialog"`.** Sin JS o con clic modificado (Ctrl/⌘/Mayús, botón central) se comporta como enlace (abrir en otra pestaña, guardar, compartir); con clic primario o Enter abre el visor. El rol que oye el lector («enlace») es veraz: lleva a la foto. Alternativa considerada: `button` (APG puro); se pierde la mejora progresiva y el «abrir en pestaña». Queda como hallazgo G-L2 para lima. **4.1.2.**
3. **Nombre accesible = el `alt`** de la imagen dentro del enlace; el pie no se repite en el enlace (sería doble lectura). **2.4.4.**
4. **Recuento visible** («10 fotos») junto al título, con plural por `labels.total` (función o cadena con `{n}`), sin texto por defecto (#226).
5. **Carga:** las primeras miniaturas visibles sin `loading="lazy"` (las 4 primeras en el prototipo; en el componente, `eager` = número configurable), el resto diferidas; `decoding="async"`; el visor pide la grande al abrir y **precarga solo la vecina siguiente**. Mientras carga, el hueco se pinta con `--g-color-mold` (#538).

**Visor (sobre `GDialog`/`topModal`, sin reescribir el modal)**

6. **Modal real:** `<dialog>` con `showModal()` (en el componente, `GDialog` o su motor `topModal`: apilado, Esc repetida ignorada, fondo, sin desplazamiento de la página debajo). Nombre del diálogo = «<título>, galería» (`labels.viewer`). Medido: `:modal`, Tab no sale de él. **APG Dialog, 2.4.3.**
7. **Foco inicial en «Foto siguiente»** (`autofocus`, regla #292 de `GDialog`): Enter y Espacio siguen avanzando. Con **una sola foto**, sin flechas y foco en «Cerrar». **2.4.3.**
8. **Anuncio de llegada y de cada cambio** en una región `polite` atómica: «3 de 10. Lámparas de barro encendidas junto a la cama.» El contador visible y el pie llevan `aria-hidden` para no leerse dos veces. **4.1.3.**
9. **Teclado (APG + extensiones):** ←/→ anterior/siguiente (**espejo en RTL**: medido), Inicio/Fin primera/última, `+`/`-` amplía/reduce, Esc cierra; **Esc escalonado**: con la foto ampliada, la primera Esc solo reduce (medido). Con la foto ampliada, las flechas recorren la foto (desplazamiento nativo) en lugar de pasar de foto. **2.1.1.**
10. **Sin vuelta al final.** En la última, «siguiente» queda con `aria-disabled="true"` **y enfocable** (un `disabled` real perdería el foco) y la región dice «Última foto.» (`labels.last`). Volver a la primera de golpe desorienta frente al contador; Inicio lo hace a propósito. **2.4.3, 3.2.**
11. **El foco vuelve a la miniatura de la foto que se estaba viendo**, no a la que abrió el visor (abrí la 3, vi hasta la 4: vuelvo a la 4), y la miniatura se trae a la vista con `block: nearest`. Medido en los tres motores. **2.4.3, 2.4.11.**
12. **Gesto táctil y con puntero:** deslizar en horizontal pasa de foto (umbral 18 % del ancho o un gesto rápido de 40 px), la foto **sigue al dedo** mientras se arrastra; deslizar hacia abajo (22 % del alto) cierra; doble toque o doble clic amplía en el punto. **Todo gesto tiene equivalente de un solo puntero** (botones) y de teclado. `touch-action: pan-y pinch-zoom` en el escenario: el pellizco del sistema sigue funcionando. **2.5.1, 2.5.7.**
13. **Zoom opcional** (prop, por defecto activo): ×2 centrado en el punto, recorrido con desplazamiento nativo (dedo, rueda, flechas). Sin zoom continuo propio: el pellizco del navegador ya existe. **1.4.4.**
14. **Controles fuera de la foto.** Barra arriba y navegación abajo sobre el fondo del visor, nunca encima de la imagen: el contraste no depende de la foto (medido con la tinta de la zona: pie 16,48:1, contador e iconos 10,90:1 en los tres motores). **1.4.3, 1.4.11.**
15. **Fondo del visor = zona de marca** (`data-g-zone="brand"`): el grupo de color se redeclara con pares garantizados por el CLI y el foco usa `on-brand-accent`. En el tema por defecto (`brand` #1F1F1F) da el «cuarto oscuro» de un visor de fotos. Ver G-L4: en un tema con marca de color (terracota) el visor se teñiría; lima decide si el visor usa la zona o un neutro oscuro.
16. **Objetivos:** controles de 36 px (`GBtn md`) y **44 px con `pointer: coarse`** (medido en Chromium móvil); nunca < 24 px. **2.5.8.**
17. **Error de imagen:** la miniatura se marca y el visor muestra «No se pudo cargar esta foto: <alt>» en lugar de un hueco mudo (medido con `&broken=1`). **1.1.1.**
18. **Movimiento:** la foto nueva llega desde el lado del gesto (`translate` de `space × 6` + opacidad, `--g-duration-press`, `--g-ease-out`), interrumpible (cada cambio parte del estado actual); **nada al montar**; con `prefers-reduced-motion: reduce`, la foto no se desplaza ni sigue al dedo: fundido de `--g-duration-fast` (medido). **2.3.3, `tokens.md` §29.3.**
19. **Página debajo inmóvil:** con el visor abierto la página no desplaza (en el componente, lo hace `GDialog`); al cerrar vuelve a desplazar (medido).
20. **Colores forzados:** miniaturas y visor con borde real (`CanvasText`), el espacio actual de A con `Highlight` (medido en Chromium).

## Estados

| Estado | Galería | Visor |
| --- | --- | --- |
| Carga | Hueco reservado por `width`/`height` con `mold` | Hueco con `mold`; la vecina precargada |
| Lista | Miniaturas | Foto, pie, contador |
| Foco | Anillo `focus` en la miniatura (≥ 2 px, medido) | Anillo en el control; dentro de la zona, `on-brand-accent` |
| Hover (solo `hover: hover`) | Borde `border-strong` doble, sin `transform` | — |
| Primera / última | — | Anterior / siguiente `aria-disabled`, enfocables; aviso «Primera foto» / «Última foto» |
| Ampliada | — | `aria-pressed=true`, «Reducir», recorrido nativo; Esc reduce |
| Arrastrando | — | La foto sigue al dedo (sin movimiento reducido) |
| Error de imagen | Miniatura marcada | Aviso con el alt |
| Una foto | «1 foto» | Sin flechas; foco en cerrar |
| Vacía | No se pinta (aviso de desarrollo) | — |
| RTL | Orden espejado | Flechas e iconos espejados |
| Movimiento reducido | — | Fundido corto, sin desplazamiento |

## Teclado y ARIA (resumen)

| Dónde | Tecla | Acción |
| --- | --- | --- |
| Miniatura | Tab / Mayús+Tab | Recorre las fotos (una parada por foto en base y A) |
| Miniatura | Enter | Abre el visor en esa foto |
| Visor | ← / → (espejo en RTL) | Anterior / siguiente; con la foto ampliada, recorre la foto |
| Visor | Inicio / Fin | Primera / última |
| Visor | `+` / `-` | Amplía / reduce |
| Visor | Esc | Reduce si está ampliada; si no, cierra y devuelve el foco |
| Visor | Tab | Cicla por cerrar, ampliar, anterior, siguiente (y el hilo de A) sin salir |

---

## A · El recorrido por espacios

La galería **no es una colección plana: es la habitación por partes.** La aplicación da a cada foto su `group` (Habitación, Baño, Terraza, Vista, Desayuno; o, en un tour, «Salida», «Mezcalería», «Hierve el Agua»). Arriba, un índice de espacios con su recuento («Baño 2»); debajo, cada espacio con su título y una portada que manda (dos columnas; con cuatro fotos o más, dos filas). En el visor, el contador habla en el espacio («Baño · 1 de 2») y un **hilo de espacios** bajo la foto marca dónde se está y salta a otro de un toque; AvPág/RePág saltan de espacio.

- Índice: `nav aria-label="Espacios"` con **enlaces** a cada grupo (no pestañas: todo está en la página, el índice salta; medido). Nombre «Baño 2, 2 fotos» (el número visual va `aria-hidden` con su versión completa oculta).
- Cada espacio: `div role="group" aria-labelledby=<h3>` (h3 un nivel por debajo del título de la galería).
- Visor: anuncio «Baño, 1 de 2. <alt>.»; hilo `nav aria-label="Espacios"` con botones y `aria-current="true"`; si no cabe, se desplaza dentro y trae el actual a la vista.

### Qué lo hace distinto (A)

Responde a la pregunta real del huésped (**«¿cómo es el baño?»**) en un toque, sin recorrer diez fotos. El contador deja de ser «7 de 10» —un número sin sentido— y pasa a decir **dónde estoy** («Terraza · 2 de 2»). Ninguna galería de framework estructura por espacios: la estructura nace del contenido que vende el sitio (habitación, plato, etapa del tour).

### Gana y arriesga

- **Gana:** orientación (lector y vista dicen el espacio), escaneo rápido en el móvil, encaja con los tres negocios (espacios del hotel, tiempos de la carta, etapas del tour), y la página gana anclas enlazables (`#gal-g-bano` en una campaña o en WhatsApp).
- **Arriesga:** exige que la aplicación etiquete grupos (sin `group` degrada a la base, sin índice ni hilo); un espacio con una sola foto se ve como banda ancha; el hilo añade una fila al visor (a 320×256 el escenario queda en ~120 px: medido que la foto se ve y los controles caben).

## B · La tira

La galería **es ya la foto grande**, en la página, sin abrir nada: una tira horizontal de **alturas iguales que respeta la proporción de cada foto** (no recorta un retrato a cuadrado), con la siguiente asomando para invitar al gesto, el pie bajo la foto actual y, junto al título, «‹ 3 / 10 ›». Tocar una foto abre el visor a pantalla completa; **al cerrarlo, la tira está en la foto donde lo dejaste**.

- APG *Carousel* **sin rotación** (decisión del inventario: el autoavance se descarta; medido que no avanza solo): región `aria-roledescription="carrusel"` con nombre; cada foto `role="group" aria-roledescription="diapositiva" aria-label="3 de 10"`.
- **Una sola parada de Tab** en la tira (tabindex itinerante en la foto actual; medido); ←/→/Inicio/Fin la mueven y llevan el foco. Los botones ‹ › anuncian («2 de 10. <alt>.»); **el desplazamiento a mano no anuncia** (la persona lo está viendo; medido).
- Desplazamiento nativo con `scroll-snap` dentro de la tira: la página nunca desplaza en horizontal (medido a 1440, 390, 320 y 400 %).

### Qué lo hace distinto (B)

**Un estado, dos profundidades** (la idea de #646 de `GDocumentPreview`, llevada a fotos): la tira y el visor comparten la foto actual, así que ampliar y volver no te devuelve al principio. Y la tira de **alturas iguales con la proporción real** es la forma de una hoja de contactos o de una revista, no la de un carrusel de banners: la foto vertical del baño se ve vertical.

### Gana y arriesga

- **Gana:** en el teléfono es lo más directo (el pulgar ya sabe deslizar), muestra fotos grandes sin modal, ocupa una sola altura en la página.
- **Arriesga:** la palabra «carrusel» arrastra malas prácticas si alguien pide autoavance (queda prohibido por contrato, G-L5); solo se ve una foto y media a la vez, así que no da la visión de conjunto que da A; en escritorio, sin gesto, depende de los botones; tres medidas de JS (actual al desplazar, llegada, sincronía con el visor).

## C · Se abre en su sitio

Sin modal por defecto: al activar una miniatura, **la foto se abre en la propia página**, en un panel que se inserta bajo la fila de su miniatura (la página no se tapa ni se pierde el sitio), con el pie, el texto de la aplicación (para el restaurante: «Mole negro · $320» y su descripción), «3 de 6», anterior/siguiente, «Pantalla completa» (el visor de la base) y cerrar. Pensado para la carta con fotos y para catálogos de tours.

- *Disclosure* de APG: la miniatura es `button` con `aria-expanded` y `aria-controls`; el panel es `role="region"` con nombre (su título) y **recibe el foco** al abrir (si no, el orden de Tab pasaría por el resto de la fila antes de llegar al panel). ←/→ dentro del panel recorre; Esc lo cierra y devuelve el foco a la miniatura (medido).
- Al cambiar de foto el panel se recoloca tras la fila de la nueva miniatura; al cambiar el ancho, también (`ResizeObserver` del prototipo).
- Del visor a pantalla completa se vuelve al panel en la foto vista y al botón «Pantalla completa» (medido).

### Qué lo hace distinto (C)

**La foto no te saca de la página**: el comensal ve el plato grande **con su nombre y su precio al lado** y sigue en la carta, en el mismo sitio. Es la galería como parte del contenido, no como una capa encima. La pantalla completa queda como decisión de la persona, no como el único modo.

### Gana y arriesga

- **Gana:** contexto (texto y precio junto a la foto, lo que la base y B no tienen sin abrir el visor), cero modal para mirar rápido, natural en escritorio.
- **Arriesga:** el panel empuja el contenido de abajo (cambio de disposición pedido por la persona, no sorpresa; el ancla del desplazamiento lo mantiene en su sitio); en el teléfono el panel ocupa la pantalla y se parece a la base sin sus ventajas (sin gesto); recolocar el panel exige medir filas (más JS); el panel necesita un slot de contenido, que es más API.

## Comparativa

| | Base | A · El recorrido | B · La tira | C · En su sitio |
| --- | --- | --- | --- | --- |
| Forma en la página | Cuadrícula de miniaturas | Espacios con portada + índice | Fotos grandes en una tira | Cuadrícula + panel en la página |
| Para ver una foto grande | Abrir el visor | Abrir el visor | Ya está a la vista | Se abre en su sitio |
| Orientación | «3 de 10» | **«Baño · 1 de 2»** + hilo | «3 / 10» | «3 de 6» + texto |
| Mejor para | Cualquier colección | **Hotel** (espacios), **tour** (etapas) | **Móvil**, pocas fotos protagonistas | **Restaurante** (carta), catálogo |
| Datos extra de la aplicación | — | `group` | — | slot de detalle |
| Paradas de Tab en la página | Una por foto | Índice + una por foto | **Una** para toda la tira | Una por foto |
| JS propio sobre la base | — | Mínimo (agrupar, hilo) | Medio (actual al desplazar, sincronía) | Medio (recolocar el panel) |
| Riesgo principal | Genérico | Sin grupos degrada a la base | Presión por autoavance; poca visión de conjunto | Empuja contenido; en móvil aporta poco |

## Recomendación

**Base + A · El recorrido por defecto cuando las fotos traen `group`; B · La tira como `appearance="strip"`; C reservada** (propuesta `appearance="inline"`).

- **A por defecto con grupos:** es la que más sirve a quien decide una reserva y la única que mejora también el visor (contador con sentido, hilo de espacios). Sin `group`, la galería es la base: no hay que elegir nada.
- **B como apariencia:** la mejor para una portada móvil o para un tour con cinco fotos protagonistas; comparte el visor y el estado.
- **C reservada:** su valor (texto y precio junto a la foto) se consigue antes con una receta `GCard` + galería en la tarjeta de oferta (ver inventario); como galería añade API (slot de detalle) y medidas por poco más.

## Qué lo hace distinto (resumen de la recomendación y de la base)

Una galería que **se ordena por lo que se vende** (espacios de la habitación, tiempos de la carta, etapas del tour) y cuyo contador dice **dónde estás**, no qué número llevas; un visor que **devuelve el foco a la foto que estabas mirando**, **reduce antes de cerrar** con Esc, deja **la foto seguir al dedo** y **nunca pone un control encima de la foto** (contraste que no depende de la imagen); y, en la tira, **un estado compartido entre la página y la pantalla completa**: ampliar y volver no te devuelve al principio.

## Rúbrica de movimiento (`docs/documentacion/rubrica-movimiento.md`)

Componente: galería de fotos con visor modal en sitios web de hoteles, restaurantes y tours; teléfono (mayoría), escritorio y tableta; toque, ratón y teclado; uso ocasional, interacción momentánea a minutos. Evidencia = medido en `verificar.mjs`; inferencia = razonado sin medir.

| Dimensión | Estado | Evidencia / riesgo / recomendación |
| --- | --- | --- |
| **A. Propósito** | **Cumple** | La llegada desde el lado del gesto dice la dirección (siguiente/anterior); seguir al dedo da causa-efecto. Sin animación de apertura propia (la del diálogo es la de `GDialog`, #301). B y C: desplazamiento nativo del navegador |
| **B. Comodidad visual** | **Cumple** (inferencia) | `space × 6` de recorrido y 160 ms; fondo oscuro estable; sin desenfoques ni capas. No verificable en sesión prolongada |
| **C. Estabilidad** | **Cumple** | Barra y navegación quietas; solo la foto cambia. C empuja el contenido al abrir (pedido por la persona) |
| **D. Transiciones** | **Cumple** | Cada cambio parte del estado actual (clases sobre el mismo `img`); pasar varias veces seguidas no encola (medido sin errores con ráfagas de flechas) |
| **E. Control** | **Cumple** | Sin autoavance (medido en B); todo cambio lo pide la persona; deslizar hacia abajo para cerrar tiene botón equivalente |
| **F. Accesibilidad y opcionalidad** | **Cumple** | Reducido: sin desplazamiento ni seguimiento del dedo, solo fundido (medido); equivalentes de un puntero y teclado de todos los gestos (2.5.1, 2.5.7) |
| **G. Rendimiento** | **Parcial** | `translate` y `opacity` (compositor); arrastre con una propiedad en línea por evento (sin medir cuadros). Riesgo: fotos grandes reales; recomendación: `srcset`/`sizes` en el contrato y medir con fotos reales (No verificable aquí: marcadores SVG) |
| **H. Inmersión** | **N/A** | — |

---

## Frontera (resumen; detalle en `brief.md`)

- **`GDocumentPreview`**: un archivo con páginas y acciones; la galería: una colección de fotos con su texto. Una galería de PDFs es `GDocumentPreview`.
- **`GDialog`**: el visor **es** un `GDialog` (o `topModal`); la galería no reescribe el modal.
- **`GCard`**: una tarjeta con foto sigue siendo `GCard`; si debe abrir la galería, lleva un botón «Ver 10 fotos» o la galería dentro (la media de `GCard` no es un control).
- **`GTabs`**: el índice de A no son pestañas (no oculta paneles).

## Hallazgos para lima

- **G-L1 · Nombre y entrada.** `GGallery` con el visor interno (¿`GGalleryViewer` exportable para abrir el visor sin cuadrícula, p. ej. desde un botón «Ver 10 fotos» de una `GCard`?). Por peso (#506, #550: el margen del principal está agotado), **entrada propia** `@grana/vue/gallery` como `GCombobox` o `GFileField`.
- **G-L2 · Miniatura `a[href]` + `aria-haspopup="dialog"` frente a `button`.** Recomendación de kiwi: enlace (mejora progresiva, abrir en pestaña con clic modificado). Si lima prefiere `button`, se pierde eso y nada más.
- **G-L3 · Visor sobre `GDialog`:** necesita de `GDialog` (o de `topModal`) el modo **pantalla completa sin relleno ni cabecera propia**, el `cancel` interceptable para el Esc escalonado y la vuelta del foco a un elemento **distinto del disparador** (la miniatura de la foto vista). Revisar si `GDialog` lo admite hoy (`returnFocus` o equivalente) o es enmienda.
- **G-L4 · Tono del visor.** El prototipo usa la zona de marca (`data-g-zone="brand"`): pares garantizados y «cuarto oscuro» en el tema por defecto, pero en un tema de marca terracota o añil el visor se tiñe. Decidir: zona de marca, o un neutro oscuro del tema (no existe hoy un «inverso» contratado tras retirar la superficie inversa de la isla, #693 a #705).
- **G-L5 · Sin autoavance por contrato.** La tira (B) no tiene `autoplay`; si alguna vez se pidiera, exige pausa visible y parada al foco y al puntero (APG *Carousel*, 2.2.2). Propuesta: no ofrecerlo.
- **G-L6 · Textos sin valores por defecto (#226):** `total` (plural), `count` (`{index}`, `{total}`, y en A `{group}`), `prev`, `next`, `first`, `last`, `close`, `zoomIn`, `zoomOut`, `viewer`, `groups`, `broken`, y en C `fullscreen`, `closeDetail`.
- **G-L7 · Datos de foto:** `width`/`height` obligatorios (CLS), `srcset`/`sizes` opcionales para la grande y la miniatura, `alt` obligatorio con aviso, `caption` opcional, `group` opcional; `eager` (cuántas miniaturas sin diferir, por defecto las de la primera fila).
- **G-L8 · Iconos.** Usa `chevron-left`, `chevron-right`, `x`, `zoom-in`, `zoom-out`, `image`, `maximize-2`, todos en la lista de la librería; **no falta ninguno**. Las flechas se espejan en RTL (equivale a `flip-rtl`).
- **G-L9 · Movimiento:** un uso de `--g-ease-out` con `--g-duration-press` (llegada de la foto), sin curvas nuevas ni `--g-ease-spring` (no es una decisión nueva de §29.1).
- **G-L10 · Umbrales del gesto** como constantes de coreografía (#187, `tokens.md` §29.6): 18 % del ancho, 40 px en gesto rápido (< 250 ms), 22 % del alto para cerrar.

## Pregunta para el usuario

**¿Qué forma quieres para la galería?**
1. **Base + A · El recorrido por espacios por defecto (cuando las fotos traen grupo), con B · La tira como apariencia** (recomendado): ordena por habitación, baño, terraza…, el visor dice dónde estás, y la tira sirve para una portada móvil.
2. **Base + A**, sin B.
3. **Base + B · La tira por defecto**, con A como opción.
4. **Base + A + B + C · Se abre en su sitio** (añade el panel en la página, pensado para la carta del restaurante).

## Comprobaciones

`node design/lab/gallery/r01/verificar.mjs` · 2026-10-21 · puerto 4232 · Playwright de `design/lab/theme-playground/node_modules` · resultado: **434 de 434**.

| Motor | Base | Visor | A | B | C | Anchos (390, 320, 400 %) | Total |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Chromium | 8/8 | 40/40 | 12/12 | 12/12 | 11/11 | 63/63 | 146/146 |
| Firefox | 8/8 | 38/38 | 12/12 | 12/12 | 11/11 | 63/63 | 144/144 |
| WebKit | 8/8 | 38/38 | 12/12 | 12/12 | 11/11 | 63/63 | 144/144 |

(Firefox y WebKit no emulan `forced-colors`: 2 casos menos. Durante una pasada, otra sesión reconstruyó `dist/` y dio un 404 de `grana.css` en Firefox; repetida la parte, 63/63.)

Lo medido: estructura y mejora progresiva; foco visible; apertura con Enter; modal y Tab atrapado; foco inicial; anuncios de llegada, de cambio y de límite; ←/→, Inicio/Fin, AvPág/RePág (A), espejo en RTL; sin vuelta; Esc escalonado con zoom; foco devuelto a la foto vista; deslizar para pasar y para cerrar (con ratón); error de imagen; una sola foto; movimiento reducido; contraste del visor; `forced-colors` (Chromium); sin autoavance; tabindex itinerante y sincronía tira ↔ visor (B); disclosure, foco al panel, recolocación y vuelta desde la pantalla completa (C); sin desplazamiento horizontal a 1440, 390, 320 y 320×256 (400 %) en los cuatro modos; controles del visor a la vista y ≥ 44 px con `pointer: coarse` (Chromium móvil) o ≥ 24 px; consola limpia.

**No verificado:** lector de pantalla real (VoiceOver, NVDA, TalkBack: lectura de la región viva, del `aria-roledescription` y de `aria-haspopup` en un enlace); gesto táctil real en un teléfono (el arrastre se probó con ratón; el pellizco del sistema con `touch-action` no se probó); fotos reales (peso, `srcset`, decodificación, rendimiento del arrastre en un móvil modesto); mejora progresiva sin JS de verdad (comprobado que el marcado son enlaces con `href`, no se probó con JS apagado); `forced-colors` en Firefox y WebKit; zoom real del navegador (simulado con 320×256); tema oscuro y temas con marca de color (G-L4); `GDialog` real como visor (G-L3; el prototipo usa `<dialog>` nativo).

## Cumplimientos / Correcciones / Pendientes

**Cumplimientos** (auditoría visual y rúbrica): estructura con título, recuento y lista semántica; jerarquía título → recuento → espacios → fotos; delimitación por borde real, también en `forced-colors`; controles fuera de la foto con contraste medido; espaciado, radios, tipografía y duraciones solo con tokens; reutiliza `GBtn`, la zona de marca y el patrón de `GDialog` sin reconstruirlos; estados de carga, error, una foto, primera/última; foco visible y devuelto; sin desplazamiento horizontal a 320 y 400 %; RTL; movimiento reducido; sin autoavance; consola limpia.

**Correcciones** (dentro de la ronda, sobre el prototipo): la tira recalculaba «la actual» durante su propio desplazamiento suave y acababa en otra foto → se ignora el desplazamiento hasta llegar al destino; con el hilo de espacios a 320×256 el escenario quedaba en 52 px → el hilo va en una sola línea con desplazamiento propio (≈ 120 px); la portada de dos columnas creaba una pista implícita en una columna → la rejilla de A garantiza dos columnas; el título y el recuento de B se separaban → el control va al final; el panel de C pintaba bandas laterales → la foto toma su ancho natural.

**Pendientes:** la elección del usuario (una pregunta); lima: contrato (G-L1 a G-L10, en especial G-L3 sobre `GDialog` y G-L4 sobre el tono del visor); coco: CSS del componente con el mosaico de A y la tira de B; bruno: visor sobre `GDialog`/`topModal`, gesto y medidas; lo no verificado de arriba (lector, táctil y fotos reales).
