# Declaración · «Una sola luz» en `GSidebar` y `GTable` (kiwi r01, 2026-10-29)

Forma elegida por el usuario (2026-10-29): la de la skill Fluid Functionalism, **un único resaltado por lista que se desliza a la fila bajo el puntero**. Esta declaración fija la estructura y las reglas. Todo lo que sigue sale de esa elección, de M1 (#305, #308), de la regla 3 de la ronda de personalidad y de los contratos vigentes de `GSidebar` y `GTable`. Lo puede aprobar lima sin preguntar al usuario (AGENTS.md, «Aprobación autónoma»), salvo lo que §13 deja abierto.

## 1. Regla común: la luz sigue al puntero, no al foco

1. **En `GSidebar` y `GTable` el puntero NO mueve el foco.** Esto es distinto de `GMenu`, donde sí lo mueve (#305). El motivo: un menú es un compuesto que ya tiene el foco dentro mientras está abierto, y mover el foco solo cambia de elemento. El sidebar y la tabla viven en la secuencia de Tab de la página. Si el puntero moviera el foco, pasar el ratón por la navegación **le quitaría el foco al campo en el que el usuario escribe** (en móvil se cierra el teclado; en escritorio se dispara un `blur` con validación, #326), el lector de pantalla anunciaría filas que nadie eligió y, en el riel, se abrirían pistas «por foco» (#436). Eso choca con WCAG 3.2.1 y 2.4.3.
2. **Dos canales separados:** la **luz** dice dónde está el puntero (y qué recibe un clic). El **anillo** dice dónde está el teclado. Si están en filas distintas, se ven los dos, cada uno en su fila, y ninguno arrastra al otro. Así se comportan las listas nativas del sistema (Finder, el Explorador de Windows) y los árboles de navegación con Tab normal.
3. **El teclado no enciende la luz.** El foco ya tiene su anillo, y en `GTable` A la puerta además se delata con `:focus-within` (subrayado y flecha, #597), que no cambia. Una luz que siguiera al foco en una lista con Tab normal sería una segunda señal sobre el mismo elemento, y una tercera si el puntero está en otra fila.
4. **Solo ratón y lápiz** (`pointerType` `mouse` o `pen`). Con el toque no pasa nada, ni siquiera en dispositivos híbridos: la regla es por tipo de puntero, no por `@media (hover)`.
5. **Lo iluminado es lo que recibe el clic.** Por eso se registran solo destinos de clic (§3) y por eso las filas se tocan (§2.2): no hay píxel encendido que no responda al clic.

## 2. Qué es una lista

1. **Una lista = un anfitrión con una capa**: el elemento que lleva la luz, los datos (§4) y el único manejador del puntero.
2. **Dentro de una lista las filas se tocan.** El espacio que hoy separa filas (`gap`, el margen del submenú abierto) pasa a formar parte de las filas, como área de clic. Cuando hace falta aire visual, la luz se dibuja **recortada** por dentro de la fila (coco), y lo que se pulsa sigue siendo contiguo.
3. **Un hueco real apaga la luz:** el título de grupo, el margen entre grupos, el relleno de la lista, la cabecera de la tabla o el espacio fuera de las filas. **No se usa «la más cercana»** (`nearest` de la skill) en ningún componente: en el sidebar los huecos que quedan separan grupos de destinos distintos, y en la tabla fuera de las filas solo están la cabecera y el pie, que no son filas. Dejar una fila encendida ahí prometería un clic que no llega a ninguna parte.
4. Al volver a una lista desde fuera (o desde un hueco), la luz **aparece donde aterriza**, sin viajar (`is-highlight-instant`). Aquí, a diferencia de #308, **cada entrada del puntero es una primera colocación**: la luz no sigue al foco, así que no hay un «estaba aquí» desde el que viajar.

| Componente | Lista (anfitrión) | Filas que forman parte | Lo que la separa de otra lista |
| --- | --- | --- | --- |
| `GSidebar` expandida y drawer | **cada** `ul.g-sidebar__list` (un grupo, o el de los items sin grupo) | sus `.g-sidebar__link` **y los de su `g-sidebar__sub` abierto** (los hijos son de la lista del padre) | título y margen del grupo |
| `GSidebar` riel | igual (mismo DOM, #138) | celdas de 44px | igual |
| `GSidebar` panel flotante del riel | su `ul` (otra superficie, otra lista) | sus hijos | es un popover aparte |
| `GSidebar` navbar | **reservado** (§10) | — | — |
| `GTable` `mode="table"`, `appearance="lines"` | `div.g-table__scroll` (el contenedor desplazable) | filas del `tbody` registradas (§3) | cabecera, pie, barra |
| `GTable` `appearance="surface"` y `mode="cards"` | **sin luz** (§6.6) | — | cada fila es su propia superficie con hueco real |

## 3. Qué se registra (destinos de clic)

| Componente / forma | Destino que lleva la luz | No se registra |
| --- | --- | --- |
| `GSidebar` | `.g-sidebar__link` habilitado: enlace, botón de acción, padre (expandido o no), **hijo**, **también el actual y su representante** (§5.3) | `aria-disabled="true"`, todo lo que está dentro de `[inert]` (submenú cerrado), búsqueda, contraer, pie (son controles sueltos, no alternativas de una lista: conservan su hover) |
| `GTable` llana (sin puertas ni `detail`) | la **fila** `tr.g-table__row` entera | filas esqueleto, fila de vacío/error, cabecera |
| `GTable` A · La puerta (`has-door` sin `has-detail`) | **solo la celda principal** `td.g-table__cell--primary` de una fila **con puerta** (`.g-table__door`) | el resto de la fila; las filas sin puerta (`rowHref` nulo y sin `activatable`); la casilla (pierde su fondo de hover: la luz es una sola por fila, §6.3) |
| `GTable` B · Despliegue (`has-detail`) | la **fila** entera (el clic de fila se reenvía a la puerta, #599) | la ficha `tr.g-table__detail` (es contenido, no destino), filas esqueleto |

- **La tabla llana es la excepción razonada a «solo destinos de clic».** Su fila no es un destino, pero la luz hace de **regla de lectura**: ayuda a seguir una fila larga con la vista. Así es el `Table` de la propia skill («Row hover is the shared fluid-hover highlight… body rows opt in»), y así es el hover de Grana hoy, así que quitarlo sería una regresión. Para no prometer un clic, la fila llana **no** lleva cursor de mano (como hoy).
- **Deshabilitado:** el puntero encima **apaga** la luz, como un hueco. No la deja en la fila anterior, porque prometería que un clic ahí abre la otra fila.

## 4. Mecanismo compartido y datos (bruno escribe, coco pinta)

1. **Utilidad nueva `utils/glide.js`** (bruno), hermana de `createHighlight` de `utils/menuNav.js`, que **no cambia** (`GMenu` sigue al foco, #305). Se compone de dos piezas:
   - `placeHighlight(host, el, { instant })`: la geometría. Es la de `createHighlight` (posición de la caja de `el` respecto de la caja de relleno del anfitrión, más su scroll, y escritura solo si el valor cambia), ampliada a **x/y/w/h**. Si bruno quiere que `createHighlight` delegue en ella, puede hacerlo solo si **`GMenu.test.js` y `tests/personalidad-menu*.spec.mjs` siguen en verde sin tocarlos**. Si no, conviven.
   - `createPointerGlide(host, { target, accept, box, off })`: la sesión del puntero. Lleva **un** `pointermove` delegado en el anfitrión (con rAF, sin manejadores por fila), `pointerleave` que apaga, `pointerdown`/`pointerup` que congelan la luz mientras hay un botón pulsado (§4.4), `scroll` (captura, pasivo) que vuelve a mirar qué hay bajo el puntero y un `ResizeObserver` del anfitrión que recoloca sin viajar. El destino se busca con `elementFromPoint(x, y).closest(target)` en el último punto conocido.
2. **Datos en el anfitrión** (contrato bruno ↔ coco; nombres propuestos para lima):

| Dato | Quién lo escribe | Qué es |
| --- | --- | --- |
| `--_highlight-x`, `--_highlight-y` | bruno | px, **físicos** (izquierda y arriba de la caja de relleno del anfitrión, más su scroll). En RTL la capa se ancla con `left`/`top` físicos (medido: con `inset-inline-start` la luz caía 296px fuera en RTL) |
| `--_highlight-w`, `--_highlight-h` | bruno | px, caja del destino (el **enlace**, no su `<li>`, porque un submenú abierto le daría al padre la altura de sus hijos; en A, la **celda**) |
| `has-highlight` | bruno | hay destino bajo el puntero |
| `is-highlight-instant` | bruno | primera colocación de cada entrada del puntero, y toda recolocación sin gesto (scroll, cambio de tamaño, cambio de filas); se quita a los dos cuadros, como en M1 |
| `g-sidebar__highlight` (`li[role=none][aria-hidden]`, primer hijo de cada `g-sidebar__list`) · `g-table__highlight` (`div[aria-hidden]`, primer hijo de `g-table__scroll`, antes del `<table>`) | bruno (en el vnode, como `g-menu__highlight`) | la capa |
| posición, color, radio, recorte, transición | coco | `GSidebar.css`, `GTable.css` |

   Los nombres son `--_highlight-*` y no `--_active-*` (los de M1) porque en `GSidebar` «activo» ya significa «actual» (`is-active`, `aria-current`).
3. **Qué no hace:** no escucha `focusin`, no toca `tabindex`, no pone `aria-*` y no emite eventos. Es **solo presentación**: sin API pública, sin props, sin slots y sin tokens nuevos.
4. **Pulsado:** desde `pointerdown` hasta `pointerup` la luz **se queda en lo que se pulsó**. Arrastrar para seleccionar texto en la tabla (B ya tolera 5px, #599) no la arrastra, y al soltar va a la fila bajo el puntero.
5. **Scroll con el puntero quieto:** la luz pasa **al instante** a la fila que queda bajo el puntero. Si se quedara atrás, lo iluminado dejaría de ser lo que recibe el clic (§1.5). No contradice #358 regla 4, que impide que un puntero quieto **cambie el activo de teclado** de una lista desplegable; aquí no hay activo de teclado.
6. **Cambio de filas** (página, orden, filtros, carga, desplegar en B): sin gesto, nada se enciende solo. La luz se apaga si su fila desaparece y **vuelve con el siguiente movimiento del puntero**. Así no hay un destello a la vez que el «aquí estabas» de #594 y #598.

## 5. `GSidebar`

1. **Anatomía:** una capa `g-sidebar__highlight` por `g-sidebar__list` (la lista pasa a `position: relative`). Los `.g-sidebar__item` ya son `position: relative`, así que pintan encima.
2. **Las filas se tocan:** `gap` 0 en `.g-sidebar__list` y `.g-sidebar__sub`, y el submenú abierto **sin** margen de bloque entre el padre y su primer hijo. El área de clic de cada enlace crece la mitad del hueco anterior por cada lado. La luz se recorta otro tanto por dentro, así que **se ve como el hover de hoy**. Coco decide cómo recuperar el aire del submenú sin hueco (p. ej. relleno de las filas de los extremos) y mide `compact` con el piso de 24px.
3. **Actual y representante: la luz pasa por ellos.** Hoy el hover excluye al actual (#564, ampliada en #616) porque su fondo de 0,3,0 le quitaba la marca. La luz es una capa aparte, bajo el contenido, y **el asiento no cambia** (medido). Excluirlos dejaría un **apagón** a mitad de la lista, que es justo el defecto medido. **Enmienda para lima:** la exclusión de #564/#616 queda solo para el fondo por enlace, que desaparece.
4. **Estados**

| Estado | Luz | Asiento / marca | Foco | Notas |
| --- | --- | --- | --- | --- |
| Reposo | apagada | — | — | — |
| Puntero sobre enlace | encendida en su caja | sin cambio | sin cambio | la etiqueta sigue tomando `text` con `:hover` (solo color) |
| Actual (`aria-current`, `is-active`) | **sí** | asiento lleno, intacto | — | §5.3 |
| Representante del riel (`is-rep`) | sí | asiento lleno | — | |
| Rama (`is-branch`) | sí | asiento hueco | — | |
| Padre con submenú abierto | sí; sus hijos, en la misma luz | — | — | la luz baja del padre a los hijos sin apagarse |
| Hijo (`g-sidebar__sub`) | sí, con la caja del hijo (sangría incluida: cambia x y w) | nodo y ruta, intactos | — | |
| Submenú abriéndose o cerrándose (240ms) | se recoloca **sin viajar** si cambia la caja del destino (`ResizeObserver`) | — | — | lo que se mueve es la lista, no la luz |
| Deshabilitado | **apagada** | — | no enfocable (contrato) | §3 |
| Título de grupo, margen, cabecera, pie | apagada | — | — | otra lista o nada |
| Foco de teclado en otra fila | luz en la fila del puntero, anillo en la del foco | — | anillo de siempre | §1.2 |
| Expandir y contraer (ancho, 240ms) | se recoloca sin viajar | — | — | el puntero suele estar en el botón de contraer, fuera de la lista |
| Riel | igual, en celdas de 44px | asiento | — | la pista (`visualTip`) viaja aparte: son dos canales (nombre y destino) |
| Panel flotante | su propia luz | nodo del hijo actual | — | la del riel se apaga al salir de su lista |
| Drawer | igual que expandida | — | — | con ratón (ventana estrecha); con el toque, nada |
| Zona de marca (`data-g-zone="brand"`, #620) | el mismo token que el hover de hoy (`--g-color-border` en la propuesta del banco), que la zona redeclara | — | — | sin token nuevo; coco mide el par en la zona |
| `forced-colors` | capa oculta | la de siempre | `Highlight` | como hoy: sin fondo de hover |
| Navbar | **reservado** | píldora | — | §10 |

## 6. `GTable`

1. **Dónde vive la capa:** dentro de `div.g-table__scroll`, como **primer hijo, antes del `<table>`**. Un `div` no puede ir en `tbody` ni en `tr`. `g-table__scroll` pasa a `position: relative` (y es el bloque contenedor de la capa) y el `<table>` a `position: relative` **sin** `z-index`, para pintar encima por orden del árbol. Las celdas siguen transparentes.
2. **Así sobrevive a todo sin código extra:**
   - **Scroll vertical y horizontal:** la capa está en el contenido del contenedor desplazable, así que se desplaza con las filas. En una fila entera, x es 0 y w el ancho de la fila (que puede superar el visor).
   - **Cabecera pegada:** el `th` sticky tiene fondo `surface` y `z-index: 1`, así que **tapa** la luz cuando una fila pasa por debajo. El `th` no se registra.
   - **Seleccionada:** su `td` pinta `primary-soft` encima de la capa, así que la luz **pasa por debajo** y la selección se mantiene (#564 intacta, medido). La luz no viaja «por encima» de una selección.
   - **«Aquí estabas» y fila nueva** (`is-here`, `is-new`): animaciones del `td`, encima de la capa; no se tocan.
   - **Lomo de `rowStatus`:** es un borde de la celda, encima; no se toca.
   - **Columnas fijas:** **no existen hoy** en `GTable`. Si llegan, una celda pegada con fondo opaco taparía la luz; queda la regla en §10.
3. **A · La puerta: la luz es la puerta.** Cubre solo la celda principal (el área real de la puerta, su `::after` con `inset: 0`). Con el puntero en otra celda de la fila, **nada** se ilumina: la fila no promete lo que no hace (#597). El subrayado y la flecha, que se delatan con `:hover` y `:focus-within` de la fila, **no cambian**. La casilla deja de tener fondo de hover (hoy lo comparte con la celda principal), porque serían dos luces en una fila. La casilla nativa conserva su propio hover y su anillo.
4. **B · Despliegue:** la luz cubre la fila entera, que es la que reenvía el clic. **La ficha desplegada no se registra:** el puntero sobre ella la apaga (su `detail-body` ya tiene superficie propia). Al desplegar, las filas de abajo se mueven con `--g-ease-spring`. El `ResizeObserver` recoloca sin viajar y la fila bajo el puntero sigue siendo la misma.
5. **Carga:** con `is-loading` o `is-pending` (y `aria-busy`) la luz se apaga y nada se registra. Las filas esqueleto nunca son destino. Al llegar los datos, nada se enciende hasta que el puntero se mueve (§4.6).
6. **`appearance="surface"` y `mode="cards"`: sin luz.** Cada fila es una superficie separada por un hueco real (`border-spacing: 0 space-2`, `margin-block-end: space-2`). Por la regla 1, la luz se apagaría en cada cruce, así que equivaldría al hover por fila. **Se queda el hover por fila, sin transición de salida** (coco): entra con fundido y se va al instante, para que **nunca haya dos a la vez**. Es la corrección mínima de la estela que no necesita una capa.
7. **Estados**

| Estado | Llana | A · puerta | B · despliegue |
| --- | --- | --- | --- |
| Puntero sobre una fila | luz en la fila | luz **solo** en la celda principal si la fila tiene puerta | luz en la fila |
| Puntero en otra celda | luz en la fila | **ninguna** (la flecha asoma, como hoy) | luz en la fila |
| Casilla / acciones | luz en la fila | ninguna | luz en la fila (son sus controles) |
| Seleccionada | la luz pasa por debajo; manda `primary-soft` | igual | igual |
| Rastro (`is-last-opened`) / `is-here` | — | flecha visible; el «aquí estabas» se pinta encima | igual |
| `rowStatus` | lomo y etiqueta intactos | igual | igual |
| Ficha desplegada | — | — | apagada sobre la ficha |
| Cabecera pegada | apagada; tapa la luz | igual | igual |
| Cargando / esqueleto | apagada | igual | igual |
| Foco en otra fila | luz en la del puntero; anillo en la del foco | anillo en la celda de la puerta | igual |
| Pulsado | se queda en lo pulsado hasta soltar | igual | igual |
| Scroll con puntero quieto | salta a la fila bajo el puntero | igual | igual |
| Zona de marca | `--g-color-surface-sunken` de la zona | igual | igual |
| `forced-colors` | capa oculta (como hoy, sin fondo de hover) | igual | igual |
| Táctil | nada | nada | nada |

## 7. Movimiento (rúbrica `docs/documentacion/rubrica-movimiento.md`)

- **El de M1, sin cambios:** posición y tamaño con `--g-duration-press` + `--g-ease-out`; aparición con fundido `--g-duration-fast`. **Sin muelle** (#299 no lo aprueba en listas de comandos, y una luz que se pasa de la fila diría que el destino es otro). Una sola sensación de luz en toda Grana: menú, navegación y tabla.
- **Propiedades:** `translate` y `opacity`, más `block-size` (ya en M1) e `inline-size` en el sidebar (el hijo sangrado es más estrecho que el padre). Anima una hoja posicionada en absoluto que no empuja a nadie: no hay reflujo de las filas. En la tabla la anchura no cambia (fila entera o la misma columna), así que solo hay `translate` y `block-size`.
- **Propósito:** continuidad entre filas que se tocan. **Estabilidad:** nada se mueve salvo la capa. **Interrumpible:** es una transición, y retomarla a mitad de camino parte de donde va. **Control:** aparece y se va con el puntero. **`reduce`:** solo fundido, sin viaje (patrón único #299 (3)). **Rendimiento:** un manejador y un rAF por anfitrión; con cientos de filas, el coste es una búsqueda con `elementFromPoint` por cuadro, sin ninguna medida por fila. No verificado en un dispositivo modesto.

## 8. Accesibilidad

| Criterio | Cómo se cumple |
| --- | --- |
| 1.4.1 Uso del color | La luz no informa de ningún estado: actual, selección y estado tienen su forma y su texto, que no cambian |
| 1.4.11 Contraste no textual | La luz es un indicador de hover, que no está obligado (no es foco ni estado). El anillo de foco no cambia |
| 1.4.13 / 2.5 Puntero | Nada aparece que tape contenido; no hay nada que solo funcione con hover; el toque no hace nada nuevo |
| 2.4.3 / 3.2.1 Foco | El puntero **no** mueve el foco (§1.1) |
| 2.4.7 / 2.4.11 Foco visible | El anillo se pinta encima de la capa y no cambia |
| 2.3.3 Animación por interacción | `reduce`: sin desplazamiento |
| `forced-colors` | La capa se oculta y manda el sistema |
| Lector de pantalla | La capa es `aria-hidden` (y en el sidebar `role="none"` dentro del `ul`, como `g-menu__highlight`); la cuenta de elementos de la lista no cambia |

## 9. Qué lo hace distinto

1. **La luz dice la verdad.** En una tabla con puerta, los frameworks iluminan la fila entera aunque solo abra un enlace de dentro. En Grana la luz cubre **exactamente** lo que abre un clic (la celda de la puerta en A, la fila en B y nada en las celdas que no hacen nada). Así se aprende qué se puede pulsar sin probar. En el sidebar pasa lo mismo: sin huecos encendidos ni deshabilitados que parecen pulsables.
2. **Dos manos, dos señales.** Puntero y teclado tienen cada uno su marca (luz y anillo), y ninguna roba a la otra. Pasar el ratón por la navegación nunca te saca del campo que estás escribiendo. Es lo contrario de la receta habitual «hover = foco», que en una navegación de página es un riesgo.
3. **Una sola física en toda la librería.** Menú, navegación y tabla usan la misma luz, con la misma curva y el mismo tiempo, y por eso la aplicación entera se siente de un solo material. No es un efecto suelto de cada componente.
4. **«Dónde estás» y «adónde irías» conviven.** La luz pasa por detrás del asiento del item actual sin apagarlo ni desplazarlo: el asiento lleno es tu sitio y la luz es tu intención. Excluir el actual, como hoy, dejaba un apagón en mitad del recorrido.
5. **La luz no se queda atrás.** Al desplazarse con la rueda y el puntero quieto, la luz pasa al instante a la fila que queda debajo. En la mayoría de las implementaciones el hover se queda en la fila vieja hasta mover el ratón, así que lo iluminado y lo que recibe el clic dejan de coincidir. Y al pulsar, la luz se queda en lo pulsado mientras arrastras.

## 10. Reservado (no entra; nombres y reglas guardados)

- **Navbar de `GSidebar`:** se queda con el hover por celda, **sin salida con fundido** (nunca dos a la vez). Motivos: es el formato táctil, sus celdas cambian de ancho durante 240ms con la píldora (`flex-grow`) y nunca convive con la expandida. Si se adopta, irá en el eje x con la misma utilidad.
- **Columnas fijas de `GTable`** (si llegan): una celda pegada en línea pinta la luz ella misma mientras su fila esté encendida. El dato sería `data-highlight` en el `tr` encendido, escrito por la misma sesión del puntero. No se escribe hoy.
- **`GTabs` T3** (luz de hover entre pestañas) y **`GWidgetGallery`/rejillas** (`axis: xy`): la utilidad sirve, pero cada uno es una decisión propia.
- **Cambiar la luz de `GMenu`** para que siga también al puntero: no hace falta (ya mueve el foco). No se toca.

## 11. Verificación

**Hecha** (`verificar.mjs` sobre el prototipo con los componentes reales de `dist/` y el tema por defecto): **Chromium 39/39**.

| Medida | Hoy (`?glide=0`) | Propuesta |
| --- | --- | --- |
| Barrido a 1px, tabla llana | **2** filas con fondo a la vez | **0** con fondo propio; **≤ 1** luz; **0** muestras sin luz dentro de las filas (162) |
| Barrido, A · puerta (columna principal) | — | 0 / ≤ 1 / 0 (162) |
| Barrido, B · despliegue | — | 0 / ≤ 1 / 0 (162) |
| Barrido, sidebar (grupo 1; grupo 2 con submenú abierto y el actual) | **2** enlaces con fondo a la vez | 0 / ≤ 1 / 0 (55 y 65) |
| Viaje entre filas | — | cuadros intermedios ≥ 3 y termina exacto (±1px) en tabla, A y sidebar |
| Reglas | — | entrar desde fuera aparece en su sitio; A, otra celda: ninguna luz; cabecera: ninguna; seleccionada conserva su fondo; deshabilitado no se posa; actual: se ilumina y el asiento no cambia; título de grupo: ninguna; el puntero no mueve el foco (sidebar y tabla); pulsado: se queda y al soltar va; scroll con el puntero quieto: sigue a la fila de debajo; `reduce`: solo opacidad; `forced-colors`: oculta; táctil: ninguna; RTL: cae sobre su celda y su fila; consola limpia |

**No hecha:**
- **Firefox y WebKit:** sus navegadores no están instalados en este entorno (`/opt/pw-browsers` solo tiene Chromium). El script los admite (`node … firefox|webkit|all`).
- Riel, panel flotante y drawer de `GSidebar` en el prototipo (solo expandida). `appearance="surface"` y `mode="cards"` (§6.6, sin luz por diseño). Zona de marca y oscuro solo a la vista (`?dark=1`), sin medir el contraste de la luz.
- Rendimiento con cientos de filas y en un dispositivo modesto. Lector de pantalla real. `forced-colors` real (solo emulado).
- Que el espacio absorbido no cambie la altura total del sidebar más de lo previsto (crece la mitad de un hueco por lista): lo mide coco.

## 12. Hallazgos

### Para lima (contrato)
1. **Registrar la decisión** (una para los dos componentes, como #305): «una sola luz» en `GSidebar` y `GTable` según §1 a §6, que sigue al **puntero** y no mueve el foco (diferencia razonada con #305). Añadir a `sidebar.md` y `table.md` una sección «Personalidad», con las clases y los datos de §4.2 en «Clases».
2. **Enmiendas:** `sidebar.md` «Movimiento» («el hover de un item es solo color, sin movimiento» pasa a la luz) y «Estados», fila Hover (#564/#616: la luz pasa por el actual y el representante, §5.3). `table.md` «A · La puerta» («el hover es solo de la celda principal (y de la casilla)» pasa a «la luz es la celda principal; la casilla sin fondo de hover», §6.3).
3. **Utilidad `utils/glide.js`** y su relación con `createHighlight` (§4.1). Va en el principal, y **#506 tiene el margen agotado**: hace falta un tope de peso para el lote (estimación de kiwi: < 1 KiB gzip; lo mide bruno).
4. **Sin tokens nuevos:** la luz lee el mismo token que el hover de hoy en cada componente.

### Para coco (CSS)
5. El banco usa `--g-color-border` (sidebar) y `--g-color-surface-sunken` (tabla), que son los de hoy. Coco decide si la luz del sidebar sigue en `border` (más fuerte que la de `GMenu`, que usa `surface-sunken`) o se iguala. Hay que medir en la zona de marca y en oscuro.
6. El recorte por dentro (§5.2), el aire del submenú sin hueco, `compact` y el radio (`--_radius` en el sidebar, 0 en `lines`).
7. Quitar la transición de `background-color` de `td` (`GTable.css:121`) y la del enlace del sidebar (`GSidebar.css:288`), y en `surface`/`cards`/navbar dejar solo la entrada con fundido (§6.6, §10).

### Para bruno
8. La capa va en el vnode (no insertada en el DOM, como hace el banco), con `aria-hidden`; en el sidebar como `li[role=none]`. Los anfitriones son: cada `g-sidebar__list`, el `ul` del panel flotante y `g-table__scroll`.
9. Pruebas: trasladar `verificar.mjs` a `tests/personalidad-sidebar-glide.spec.mjs` y `tests/personalidad-table-glide.spec.mjs` en los tres motores, más una prueba de que **`GMenu` no cambia**.

### Para mora-docs
10. Explicar en los README que la luz es del puntero y el anillo del teclado, y que en A se ilumina solo la puerta.

## 13. Preguntas al usuario

**Ninguna de producto abierta.** La forma ya está elegida y las decisiones de §1 a §6 salen de ella, de la skill y de contratos vigentes. Hay dos decisiones que el usuario puede querer saber, aunque no lo exigen:
- La luz **sí** pasa por el item actual del sidebar (§5.3).
- La tabla llana **conserva** la luz como regla de lectura aunque su fila no sea un destino (§3).

## Cumplimientos / Correcciones / Pendientes

- **Cumplimientos:** auditoría previa de `auditoria-visual.md` (nada flota: la luz es la caja de su fila; tokens existentes; los estados de carga, vacío y error se respetan); rúbrica de movimiento (§7); iconos solo Lucide en el banco; solo `var(--g-*)` en `hg.css`.
- **Correcciones (en la propuesta):** la estela de dos filas en `GTable` y en `GSidebar`, y el apagón en los huecos del sidebar.
- **Pendientes:** Firefox y WebKit; riel, panel y drawer; contraste de la luz en oscuro y en la zona de marca; peso; lector de pantalla real.
