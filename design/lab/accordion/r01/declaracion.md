# Declaración — acordeón / sección plegable (`GAccordion` + `GAccordionItem`, nombres de trabajo), r01

> kiwi, 2026-10-07. Base funcional (puntos 1 a 16) y tres conceptos de forma (A, B, C). Deriva de WAI-ARIA APG (*Accordion* y *Disclosure*), HTML (`hidden="until-found"`, `beforematch`), WCAG 2.2 AA y los contratos vigentes (`form.md` §3 y §14, `tokens.md` §6 y §29, `icons.md`). Prototipo: `index.html`; verificación: `verificar.mjs` (puerto 4214).

## Anatomía

```
div.x-acc[.x-acc--{concepto}][.is-exclusive][.is-sticky]          ← grupo (sin rol: APG no pone rol al conjunto)
  div.x-acc__item#ID[.is-open][.is-animating][.is-instant][.is-ready][.is-disabled]   ← el id es el ancla (#ID)
    span.x-acc__rail (B: eje, nudo y tramo; aria-hidden)
    hN.x-acc__heading                                               ← headingLevel (3 por defecto)
      button#ID-btn[type=button][aria-expanded][aria-controls=ID-content][aria-disabled?][aria-describedby=ID-peek?]
        span.x-acc__num (C, aria-hidden) · span.x-acc__icon (Lucide, aria-hidden) · span.x-acc__title[dir=auto] · span.x-acc__meta (texto corto, no interactivo)
    div.x-acc__actions (slot: acciones del grupo, FUERA del botón)
    p.x-acc__peek#ID-peek[dir=auto] (A: avance; misma celda que el panel)
    div.x-acc__panel[inert mientras se cierra]                      ← rejilla 0fr → 1fr (el motor de GFormSection/GFormReveal)
      div.x-acc__content#ID-content[role=region?][aria-labelledby=ID-btn?][hidden="until-found" plegado y asentado]
        div.x-acc__body (slot; montado siempre salvo lazy)
```

## Decisiones

### Semántica y estructura

1. **Botón con `aria-expanded` dentro de un encabezado, no `<details>`.** `hN > button[type=button][aria-expanded][aria-controls]` (APG *Accordion*), el mismo marcado que `GFormSection collapsible` (#285). Un elemento suelto (sin grupo) es la misma pieza: APG *Disclosure* con encabezado, sin flechas.
2. **Por qué no `<details>/<summary>`**, medido en r01 en los tres motores: lo que `<details>` daba gratis ya lo da `hidden="until-found"` (búsqueda y anclas, punto 6) y la exclusividad la hace el grupo en una línea. Lo que cuesta: (a) el encabezado tiene que ir **dentro** de `<summary>` (`summary > h3`, al revés que APG); Chromium expone `DisclosureTriangle` con el `heading` dentro, pero los hijos de un botón son presentacionales para varios lectores y la navegación por encabezados, que es como se recorre una lista de preguntas, queda a merced del lector (sin verificar en lector real); (b) cerrar **no se anima** fuera de Chromium (`interpolate-size` solo existe allí; `::details-content` sí en los tres); (c) no hay «deshabilitado» nativo; (d) el estado lo cambia el navegador con `toggle` asíncrono, y el modelo controlado tiene que corregirlo después; (e) `name` agrupa por documento, no por instancia. Se descarta como base (igual que en `form-section/r01`).
3. **El contenido es `role="region"` con `aria-labelledby` → botón, con la regla de APG**: no cuando **más de seis** paneles pueden estar abiertos a la vez (proliferación de regiones). El grupo lo decide solo: `region` si es exclusivo o tiene ≤ 6 elementos. El rol va en el **contenido** (`__content`), no en el panel animado: plegado y asentado, el contenido está oculto y no queda una región vacía en el árbol.
4. **Nivel de encabezado configurable**: `headingLevel` en el grupo (3 por defecto, como `GCard`, `GWidget` y `GFormSection`) y en el elemento (gana el del elemento). Siempre hay encabezado: un acordeón sin encabezados no se puede recorrer con H.
5. **Nada interactivo dentro del botón.** `meta` es texto corto dentro del botón (forma parte del nombre: «Historial de pagos, Disponible tras tu primera cita»); las acciones del grupo («Restablecer») van en `__actions`, **fuera** del encabezado, en la misma fila.

### Plegado, búsqueda, anclas

6. **Plegado = `hidden="until-found"` cuando está asentado.** Medido en Chromium, Firefox y WebKit de Playwright: `'onbeforematch' in document.body`, alto 0, `content-visibility: hidden`, Tab no entra; navegar a un `#id` de **dentro** y a `#:~:text=` lo **revela el navegador** (dispara `beforematch`) y el elemento se abre al momento (`is-instant`, sin animar), igual que Ctrl+F. `window.find()` encuentra pero no revela (no representa a Ctrl+F; no se usa para medir).
7. **Sin `visibility: hidden` en el panel** (difiere de `GFormSection`): con un antepasado `visibility: hidden`, `#:~:text=` **no encuentra** el texto aunque el contenido sea `until-found` (medido en Chromium: fallaba hasta quitarlo). Durante el cierre manda `inert` en el panel (no se enfoca lo que se va); al asentar, `inert` sale y entra `hidden="until-found"`. Al abrir, `hidden` sale en el mismo parche que `is-open`.
8. **`#ID` del elemento** (al cargar y en `hashchange`): lo abre sin animar y lo trae a la vista arriba; **no mueve el foco** (la navegación a fragmento ya fija el punto de partida de Tab). El componente **lee** el fragmento, nunca lo escribe: si la aplicación quiere el estado en la URL, lo hace con `v-model`.
9. **Abrir antes de enfocar**: el contenido escucha `OPEN_REQUEST` (`g-open-request`, #287), abre en el mismo parche y cancela; quien pidió espera un parche y enfoca. Así un `GForm`, un `GErrorSummary` o la aplicación pueden llevar a un control de dentro sin saber que hay un acordeón.
10. **Contenido montado siempre** (búsqueda, anclas, impresión, estado de lo que hay dentro), como `GFormReveal`. **`lazy`** opcional para contenido caro (mapa, iframe, gráfica): se monta al abrir por primera vez y **no se desmonta** al cerrar (medido: 1 montaje tras abrir-cerrar-abrir). Límite documentado: lo `lazy` sin abrir no se encuentra, no se imprime y un ancla de dentro no existe.
11. **Impresión: todo abierto**, sin iconos, avances, eje ni acciones; encabezados `break-after: avoid`. Chromium y WebKit **no imprimen** un `[hidden=until-found]` (Firefox sí): el CSS de impresión fuerza `content-visibility: visible` y la rejilla a `1fr` (medido: 0 contenidos con alto 0 en `print`). No se tocan el estado ni `v-model`.

### Comportamiento

12. **Varios abiertos por defecto; `exclusive` para uno a la vez.** Deriva de la heurística de control del usuario: cerrar lo que el usuario abrió le impide comparar dos respuestas. En `exclusive` se puede cerrar el abierto (todo cerrado es válido; sin `aria-disabled` en el abierto, que parecería un control roto).
13. **`v-model` del grupo = arreglo de `value`** en los dos modos (en `exclusive`, de longitud 0 o 1), en **orden del documento**, no de apertura (el modelo no depende de la historia). El elemento suelto: `v-model:open` (Boolean), controlado y no controlado, como `GFormSection`. `value` por defecto = `id`.
14. **Teclado**: Tab y Mayús+Tab pasan por **todos** los encabezados (no es *roving*: APG). **Flechas** (APG, opcionales; activas por defecto en un grupo, se apagan con `arrows: false`): ↓/↑ al encabezado siguiente/anterior **sin vuelta** al otro extremo, Inicio/Fin a los extremos; solo con el foco en un encabezado del grupo, nunca dentro de un panel. Intro y Espacio: el botón. Abrir no mueve el foco; plegar por programa con el foco dentro lo devuelve al botón **antes** de ocultar (nunca a `body`).
15. **Deshabilitado**: `aria-disabled="true"` (sigue enfocable y las flechas lo alcanzan: se puede leer el `meta` que explica por qué), no abre, título en `text-subtle`.
16. **Δ0: el encabezado que tocas no se mueve.** En `exclusive`, al abrir uno se cierra el de encima y el que tocaste **subía 336 px** bajo el puntero (medido en los tres motores). Ni `overflow-anchor` del navegador lo evita (336 px también con él en Chromium y Firefox; WebKit no lo tiene). El grupo mide el borde superior del encabezado tocado antes del cambio y, en cada cuadro del movimiento, desplaza la página lo que se haya movido: **≤ 1 px** medido por cuadro (0,5 px Chromium y Firefox, 0,9 px WebKit). El grupo lleva `overflow-anchor: none` para que el navegador no compense dos veces. Límite: si no hay página debajo para conservar el desplazamiento, el navegador lo recorta (como `form.md` §14 «cerrar al final de la página»).
17. **Movimiento**: altura con la rejilla `0fr → 1fr` en `--g-duration-slow` y `--g-ease-out` (#278, #280), sin medir alturas; `is-ready` tras el primer pintado (no se anima lo que ya viene abierto); `is-instant` para abrir por búsqueda, ancla u `OPEN_REQUEST`. **Movimiento reducido** (patrón único, #299): sin altura ni giro, solo fundido del contenido (medido: sin `grid-template-rows` en la transición, asienta plegado igual).
18. **RTL**: propiedades lógicas; el chevron `chevron-right` se espeja y gira a −90° abierto (como `GFormSection`, #71); títulos, avances y metadatos con `dir="auto"`. Las flechas ↑/↓ no cambian.
19. **Mínimos**: encabezado ≥ 44 px de alto en todos los punteros (es la diana principal de la pieza), texto ≥ 12 px, contraste del título y del dato ≥ 4,5:1 e icono ≥ 3:1 (medidos: 17,4:1, 7,46:1 y 7,46:1 con el tema por defecto), foco visible con `--g-focus-width` hacia dentro (no lo recorta un contenedor). A 320 px, sin desplazamiento horizontal en los cuatro casos.

### Frontera con `GFormSection` (no duplicar)

20. **Qué comparten**: el **motor de plegado** (rejilla `0fr → 1fr`, `is-ready`/`is-animating`/`is-instant`, `transitionend` con respaldo, foco al botón antes de ocultar, `OPEN_REQUEST`), el **marcado del disparador** (`hN > button`, chevron Lucide al inicio con giro y espejo) y los tokens de movimiento. Propuesta: sacarlo a un interno compartido (`utils/collapse.js` o un `useCollapse`), que también puede usar `GFormReveal` para su altura (L3).
21. **Qué no comparten**: `GFormSection` es una **sección de un formulario**: cuenta errores y los pinta en su resumen (#286), tiene `addable` con confirmación, `headerPlacement`, `divider`, el registro en `GForm` y vive dentro de `GForm`/`GFormLayout`. El acordeón es **contenido**: grupo con exclusividad, flechas, `v-model` de abiertos, anclas, búsqueda e impresión; no se registra en `GForm` ni sabe de errores.
22. **Regla de uso**: plegar **preguntas de un formulario** → `GFormSection mode="collapsible"`; plegar **contenido** (preguntas frecuentes, detalles, ajustes que se aplican al momento) → acordeón. Un acordeón **dentro** de un `GForm` funciona (punto 9 abre lo que haga falta), pero si su contenido registra campos el componente **avisa en desarrollo** («para plegar campos, usa `GFormSection mode="collapsible"`»): esos campos no contarían en el resumen de errores por sección.
23. **Lo que el acordeón devuelve a `GFormSection`**: la búsqueda en la página dentro de secciones plegadas (pendiente L11, #291) queda **medida** aquí: funciona con `hidden="until-found"` asentado **si el panel deja de usar `visibility: hidden`** (punto 7). Si lima reabre #291 con este motivo, se resuelve con el motor compartido.

## Conceptos de forma (con los tokens reales del tema por defecto)

Los tres comparten los puntos 1 a 19. Cambian la **forma** y un comportamiento propio.

### A · Avance — un encabezado cerrado no es mudo

Debajo de la pregunta, **la primera línea de la respuesta** (preguntas frecuentes) o **el estado del grupo** (ajustes: «Correo y push · resumen semanal»), en una línea con puntos suspensivos, `text-muted`. Al abrir, esa línea **no se mueve** (Δ ≤ 1 px medido en los tres motores): el contenido nace en la misma celda, la primera línea ya está entera en 30–49 ms, el avance se funde encima (mismo texto en el mismo sitio, solo se van los puntos suspensivos) y el resto se desenrolla debajo; el color pasa de `text-muted` a `text`. Pregunta en `title-sm`, separador de 1 px, chevron al final (el ojo empieza por la pregunta). El avance se enlaza al botón con `aria-describedby` **solo cerrado** (como el resumen de `GFormSection`). En ajustes, el avance lo escribe la aplicación y sigue al estado (medido: cambia al tocar el interruptor de dentro).

*Para quién*: el que recorre buscando «la suya» lee la respuesta sin abrir en la mitad de los casos; en ajustes, ve cómo lo tiene sin abrir nada.

### B · Hilo — un eje en vez de cajas

Sin separadores ni cajas: un **eje vertical** (pista CSS de `border-strong`) une las preguntas como capítulos; cada una cuelga de su **nudo** (contorno de control de 24 px con `plus` de Lucide; abierto, relleno con `brand` y `minus`). Al abrir, el **tramo de tinta** (`brand`) baja por lo que vas a leer y **llega con `--g-ease-spring`** (rebasa 3,8 % y asienta: el «rebote sutil» aprobado en #299). Mientras lees una respuesta larga, **su encabezado se queda arriba** (`position: sticky` dentro de su elemento) y **cerrarlo desde ahí te deja donde estabas**: sin animar, el encabezado no se mueve (Δ ≤ 1 px) y lo siguiente aparece debajo. En `forced-colors`, eje en `CanvasText` y tramo y nudo en `Highlight` (medido en Chromium).

*Para quién*: paneles de detalles largos (preparación de un estudio, condiciones): se sabe en todo momento en qué sección se está y cerrar no obliga a volver a subir.

### C · Índice — las preguntas en columnas; la abierta se vuelve lectura

Muchas preguntas cortas en **columnas** (rejilla `auto-fill`, mínimo `space-16 × 4`), numeradas en cifras tabulares (`01 … 08`, `aria-hidden`), como el índice de un libro: se recorren de un vistazo sin desplazarse. La abierta **ocupa todo el ancho** sobre `surface-sunken` con radio `lg` y la pregunta crece a `title-sm`; las demás **se apartan con el muelle** (FLIP con `--g-ease-spring`) y la pregunta tocada **no cambia de altura** en la pantalla (Δy ≤ 1 px por cuadro), solo se desliza en horizontal a su nueva columna. **Orden visual = orden del documento** (sin `grid-auto-flow: dense`, que pondría el panel debajo de su vecina y rompería 1.3.2 y 2.4.3). A 375 px es una columna.

*Para quién*: centros de ayuda con 10–30 preguntas cortas en escritorio: la lista entera cabe en la pantalla.

### Comparativa

| | A · Avance | B · Hilo | C · Índice |
| --- | --- | --- | --- |
| Premisa que cuestiona | «Cerrado = mudo» | «Cada pregunta es una caja» | «Una lista vertical» |
| Mejor en | Preguntas frecuentes, **ajustes** (estado sin abrir), detalles cortos | Detalles **largos**, guías por capítulos | Muchas preguntas **cortas** en escritorio |
| Peor en | Respuestas que empiezan con algo que no resume (una tabla, una imagen) | Listas de 20 preguntas de una línea (el eje se vuelve decoración) | Respuestas largas; móvil (es una lista) |
| Movimiento propio | La línea que no se mueve | El tramo que llega con el muelle; el encabezado que se queda | Las vecinas que se apartan con el muelle |
| Densidad (8 preguntas, 1100 px) | La más alta: dos líneas por pregunta | Media | La más baja: 3 filas |
| API extra | `peek` (prop y slot) | `sticky` (y el eje) | `layout="index"` (el grupo numera) |
| Coste | Bajo (CSS y una celda compartida) | Medio (eje, nudo, pegado, cierre instantáneo) | Alto (FLIP, compensación horizontal y vertical) |
| Riesgo | Avance duplicado para el lector en modo exploración (igual que `GFormSection`) | `sticky` bajo una cabecera fija de la aplicación necesita su alto (L8) | La pregunta tocada salta de columna (se compensa la altura, no la columna) |

**Recomendación de kiwi:** **A como forma por defecto** (cubre los tres usos y resuelve el problema más común: abrir para saber qué hay), con **el encabezado pegado y el cierre que te deja donde estabas de B como opción** (`sticky`) para detalles largos. C queda **reservado** como `layout="index"` si un centro de ayuda real lo pide: es el más vistoso y el más caro, y su ventaja solo existe en escritorio.

## Qué lo hace distinto

1. **El encabezado que tocas no se mueve** (punto 16): en «uno a la vez» y al cerrar desde abajo, el resto se acomoda alrededor del dedo; ni los frameworks ni el anclaje del navegador lo hacen (336 px medidos). Sirve a quien toca en móvil: el segundo toque cae donde miraba.
2. **Lo plegado se encuentra, se enlaza y se imprime** (puntos 6, 8 y 11): Ctrl+F, un `#id` de dentro, un `#:~:text=` de un buscador y la impresión llegan al contenido plegado en los tres motores. Sirve a quien llega de fuera o necesita la respuesta en papel.
3. **(A) La línea que no se mueve**: la respuesta empieza a leerse cerrada y sigue en el mismo sitio al abrir; en ajustes, el estado se ve sin abrir.
4. **(B) El tramo que llega y el encabezado que acompaña**: la tinta baja por lo que vas a leer con el muelle de Grana y el título te sigue mientras lees.
5. **(C) El índice que se abre en su sitio**: las vecinas se apartan con el muelle y la pregunta no cambia de altura.

Nada de esto toca la accesibilidad: el marcado es el de APG en los tres, el movimiento cae a fundido con `prefers-reduced-motion` y el orden del documento manda.

## Comprobaciones

`node design/lab/accordion/r01/verificar.mjs`: **184/184 en Chromium, Firefox y WebKit** (2026-10-07, con el `dist` actual). Cubre: estructura APG (encabezado, botón, `aria-expanded`/`aria-controls`, `region` y su regla de seis, icono decorativo), abrir/cerrar con `inert` solo durante el cierre y `until-found` al asentar, `v-model` en orden del documento, flechas sin vuelta, Tab que salta lo plegado, deshabilitado enfocable que no abre, `lazy` con un solo montaje, `OPEN_REQUEST` con foco al campo, foco al botón al plegar por programa, elemento suelto, `exclusive`, Δ0 por cuadro (con, sin compensación y con `overflow-anchor`), impresión, ≥ 44 px, ≥ 12 px, contraste, foco visible, `#id` al cargar y en `hashchange`, `#id` de dentro, `#:~:text=`, movimiento reducido, RTL; A: avance de una línea con `describedby`, continuidad Δ ≤ 1 px, primera línea entera antes de la mitad del fundido, avance que sigue al estado, acciones fuera del botón; B: contorno del nudo ≥ 3:1 (3,45:1 con `border-control`), tramo que llega a escala 1, icono sobre la marca ≥ 3:1 (16,48:1), encabezado pegado, cierre desde arriba sin moverse; `forced-colors` (Chromium); C: columnas a 1100 px, abierta a todo el ancho, Δy ≤ 1 px, orden visual = documento, una columna a 375 px; 320 px sin desplazamiento horizontal en base, A, B, C y la comparativa; sin errores en consola.

**No verificado** (entorno real, PENDIENTES §7): lector de pantalla (VoiceOver, NVDA) sobre `region` y su regla, el avance por `describedby` en modo exploración y la navegación por encabezados; Ctrl+F real (se midió con `#:~:text=` y `#id`, que siguen el mismo algoritmo de revelado); impresión real en papel (se midió con `emulateMedia('print')`); táctil real (B pegado con la barra del navegador móvil); `forced-colors` en Firefox y WebKit; texto al 200 %.

## Hallazgos para lima

| # | Hallazgo | Propuesta |
| --- | --- | --- |
| L1 | Nombres y reparto | `GAccordion` (grupo) + `GAccordionItem` (elemento; suelto = sección plegable). Sin `GDisclosure` aparte: es el mismo elemento sin grupo |
| L2 | API del grupo | `v-model` (Array de `value`), `exclusive` (Boolean, `false`), `headingLevel` (Number, 3), `arrows` (Boolean, `true`); según el concepto: `sticky` (B), `layout` (`list`·`index`, C). Eventos: `update:modelValue`. Sin `labels` (no hay textos propios) |
| L3 | API del elemento | `value` (por defecto `id`), `title` + slot `title`, `meta` + slot `meta` (texto, sin interactivos), slot `actions` (fuera del botón), `disabled`, `lazy`, `headingLevel`, `id`, `v-model:open` (suelto; dentro de un grupo, aviso y se ignora); A: `peek` + slot `peek` |
| L4 | Motor de plegado compartido | Sacar a un interno (`utils/collapse.js`) lo común con `GFormSection collapsible` y `GFormReveal` (punto 20). Es decisión de lima y trabajo de bruno; no bloquea si se prefiere duplicar en la primera entrega |
| L5 | `hidden="until-found"` y `visibility` | El acordeón **no** usa `visibility: hidden` en el panel (punto 7). Si `GFormSection` adopta la búsqueda (L11 de `form-section/r01`, #291), tiene que cambiar lo mismo: motivo nuevo medido para reabrir #291 |
| L6 | Regla de `region` | Automática: con `exclusive` o ≤ 6 elementos (APG). Sin prop para forzarla, salvo que lima vea un caso |
| L7 | Δ0 | Comportamiento del grupo, no opcional: medir el encabezado tocado y compensar por cuadro durante el movimiento (`--g-duration-slow` + respaldo); `overflow-anchor: none` en el grupo; el contenedor desplazable es la página o el antepasado desplazable más cercano (bruno). Cerrar con el principio del elemento fuera de la vista es instantáneo |
| L8 | `sticky` (B) bajo una cabecera fija | Hace falta el alto de la cabecera de la aplicación: propiedad `--g-accordion-sticky-top` que pone la aplicación (como `offset.top` de la isla y el toaster) o una prop `stickyOffset`. Recomendado: la propiedad CSS, sin valor por defecto en el tema (0 en el alias local `--_sticky-top`) |
| L9 | Tokens | **Ninguno nuevo** en A y C. Consumidos: `--g-color-border`, `-border-strong`, `-border-control`, `-text`, `-text-muted`, `-text-subtle`, `-brand`, `-on-brand`, `-surface-sunken`, `-bg`, `-focus`, `--g-space-*`, `--g-radius-lg`/`-xs`/`-pill`, `--g-text-body*`, `--g-text-title-sm*`, `--g-font-title`, `--g-duration-slow`/`-fast`, `--g-ease-out`/`-spring`, `--g-focus-width`, `--g-border-width`. El tramo de B en `brand` (identidad) y no en `accent`: lima confirma |
| L10 | Iconos | `chevron-right` (A, base, C) y `plus`/`minus` (B) ya están en la lista de la librería; nada nuevo en `icons.md` |
| L11 | Dentro de `GForm` | Aviso de desarrollo si un `GAccordionItem` contiene campos registrados (punto 22); el `OPEN_REQUEST` se escucha igual |
| L12 | Avance automático (A) | No se propone `peek="auto"` (leer el primer párrafo del slot rompe el SSR y es frágil); la aplicación pasa el texto. Receta en el README: el mismo texto que el primer párrafo da la continuidad |
| L13 | Impresión | Regla de `@media print` en el CSS de coco (punto 11); sin API |
| L14 | Personalidad | Registrar en `DECISIONS.md` el concepto elegido (L1 a L3 cambian según la elección) y el Δ0 como rasgo de la pieza |

## Preguntas de producto (abiertas)

1. **¿Qué forma tiene el acordeón de Grana?** A «Avance» (recomendada) · B «Hilo» · C «Índice» · A con el encabezado pegado de B como opción.
2. **¿El encabezado de una sección abierta se queda pegado arriba mientras se lee?** Solo cuando la aplicación lo pide con una prop (recomendado: necesita el alto de la cabecera de la aplicación) · siempre · nunca.
