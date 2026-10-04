# Declaración — ficha de resumen (`GSummary`, nombre de trabajo), r02: tres conceptos de forma

> kiwi, 2026-10-04. Prototipo: `index.html?c=A|B|C` sobre el motor de `../r01/summary.js`, componentes reales de `dist/` (`GAvatar`, `GBadge`, `GSurface`, `GTable`, `GBtn`) y tokens del tema por defecto (`concepts.css`). Verificación: `verificar.mjs` (la batería de r01 más lo propio de cada concepto) en Chromium, Firefox y WebKit; cifras en «Comprobaciones». La base funcional (r01) es común a los tres y no se repite.

## Los mismos casos en los tres

Opción de combobox (cuatro homónimas «María García López» y un vecino), valor dentro del campo (persona y diagnóstico con código), vista previa de la paleta, tarjeta al ancho del control y rejilla redimensionable de cinco tarjetas, celda de `GTable` real, móvil 320, RTL, movimiento reducido. Un control mueve el ancho del contenedor de 160 a 720px en vivo; la rejilla tiene su propio control y un marco que se arrastra.

---

## A · Prioridad líquida

**Estructura.** No hay tramos, ni rejilla de pares, ni «versión compacta». En cualquier contexto la ficha es lo mismo: identidad, título y **una corriente de datos** en orden de prioridad, con el identificador anclado al inicio y en negrita. El anfitrión solo dice cuántas líneas hay (`lines`): 1 en el campo, 2 en la opción y la celda, 4 en la tarjeta, sin límite en la vista previa. El alto de cada contexto es fijo.

**Comportamiento.** Al estrechar, la corriente se bebe por el final, dato a dato. Antes de soltar un dato, **calla los rótulos que se explican solos** («22 años», «Dra. Ruiz»; la aplicación los marca; «Última visita 03/02/2026» conserva el suyo); el lector los sigue recibiendo. «+N» dice cuántos no se ven.

**Movimiento.** Al ensanchar, cada dato que vuelve a caber **entra** desde el inicio de su sitio (opacidad y `translate`, `--g-duration-slow`, `--g-ease-out`), uno a uno. No hay salto de layout: el sitio ya era suyo. Salir no se anima (un dato que se va no debe retener la mirada).

### Qué lo hace distinto (A)

Las fichas adaptables saltan entre dos o tres maquetas. Esta **no tiene maquetas**: tiene una frase que se acorta y se alarga, y la decisión se toma con el texto real, no con un umbral. Quien redimensiona una rejilla ve los datos llegar de uno en uno en lugar de ver la tarjeta «romperse» en otra. Y sirve igual en los cinco anfitriones, así que quien conoce la opción conoce la celda y la tarjeta.

### Gana y arriesga

- **Gana:** más datos visibles por píxel en fila (a 520px, 4 de 4; la base, 3; B, 2); alto constante por contexto (las rejillas no bailan); un solo modelo; cero umbrales; el coste más bajo.
- **Arriesga:** con espacio de sobra (vista previa, tarjeta ancha) la corriente es **menos escaneable** que una rejilla de pares: los valores no quedan en columna. Callar rótulos exige que la aplicación marque cuáles se explican solos (si marca mal, queda un valor huérfano). Los datos de fichas vecinas no se alinean (cada corriente tiene su ritmo).

### Medidas (A)

| Medida | Resultado |
| --- | --- |
| Sin desborde, 160 a 720px (paso 20), seis casos, LTR y RTL | Pasa |
| Identificador entero en todos los anchos | Pasa |
| Alto por contexto | Opción y celda: ficha de 44px en los 29 anchos. Campo: Δ0. Tarjeta (4 líneas): 126px de 160 a 320px, 102px de 400 a 560px, 78px de 640 a 720px (anchos informados cada 80px; se acorta al caber todo en menos líneas, nunca crece) |
| Datos visibles en la opción | 240px: 1 de 4 · 360px: 2 de 4 · 520px: 4 de 4 |
| Lector | Todos los datos y rótulos en el árbol, también los rótulos callados |
| Movimiento | Al ensanchar de 190 a 520px hay animaciones de entrada en curso; con movimiento reducido, ninguna |
| Contraste | Mínimo 4.72:1 (rótulo en `text-subtle` sobre la opción activa) |

**Coste:** bajo. Es la base más una clase de estado (`data-terse`), un atributo de entrada (`data-enter`) y una marca por dato (`plain`). **Riesgos:** el contraste del rótulo queda cerca del mínimo (4.72:1; con otro tema hay que medirlo); vista previa menos legible que una rejilla.

---

## B · Tira que se compara

**Estructura.** Los datos son **casillas de ancho fijo** (`space × 22`; el identificador, `space × 24`) y **sin rótulo visible**: una fila de rótulos encabeza la lista una sola vez (decorativa; cada ficha conserva sus rótulos para el lector). Como todas las casillas miden lo mismo y el título ocupa una fracción fija, **los datos quedan en columna entre fichas vecinas** sin `subgrid` ni envoltorio: funciona en opciones, celdas y tarjetas sueltas. En bloque (tarjeta, vista previa), los pares van en dos columnas, rótulo | valor, una línea por dato, así que las filas coinciden entre tarjetas vecinas.

**Comportamiento.** Entre fichas con el **mismo título** (homónimos), cada dato se compara: el valor **único** en el grupo **pesa** (600) y el **compartido** se apaga (`text-subtle`). Las fichas sin homónimos no llevan marcas. No es solo color: cambia el peso (WCAG 1.4.1). Al estrechar, las columnas caen de una en una **para todas las fichas a la vez** (misma medida, misma decisión). Por debajo de `space × 100` de ancho propio, la tira pasa a dos líneas (título / identificador y casillas).

**Movimiento.** Ninguno propio: la alineación es el gesto.

### Qué lo hace distinto (B)

Ninguna ficha de las librerías sabe que tiene vecinas. Esta sí: su trabajo no es describir a una persona, sino **decir en qué se diferencia de la de al lado**, que es exactamente el problema de cuatro «María García López». El ojo baja por la columna del expediente y de la edad, y lo repetido se quita de en medio. Convierte una lista de resultados en una comparación sin abrir nada.

### Gana y arriesga

- **Gana:** elección entre homónimos de un vistazo, en la propia lista (sin paleta ni vista previa); funciona también entre tarjetas de una rejilla y entre filas de una tabla; tarjetas de alto idéntico (229px en cualquier ancho).
- **Arriesga:** **menos datos por píxel** (casillas fijas: a 520px, 2 de 4; A, 4): la alineación se paga en ancho. Un valor más largo que su casilla se corta con elipsis («Dr. Ortega» cabe; «Laboratorios Farmacéuticos…» no). Sin rótulos, la fila de cabecera es imprescindible, y en el campo (una ficha sola) no la hay: «22 años  03/02/2026» depende de que los valores se expliquen. La comparación exige que las vecinas tengan los mismos datos en el mismo orden. Quien calcula «único/compartido» es el anfitrión de la lista (ve a todas), no la ficha.

### Medidas (B)

| Medida | Resultado |
| --- | --- |
| Sin desborde, 160 a 720px, seis casos, LTR y RTL | Pasa |
| Identificador entero en todos los anchos | Pasa |
| Columnas alineadas | A 600px, el borde de inicio de «Expediente» y de «Edad» coincide en las cinco fichas y en la cabecera (Δ ≤ 0.1px) |
| Lo que distingue pesa | Peso del valor único mayor que el del compartido (600 frente a 400); la ficha sin homónimos, sin marcas |
| Alto por contexto | Opción: dos líneas (ficha 44px) bajo `space × 100`; una línea encima. La lista cambia de alto **una vez** al cruzar ese ancho (334 → 274px con cabecera). Campo: Δ0. Tarjeta: 229px en los ocho anchos informados (160 a 720px) |
| Datos visibles en la opción | 240px: 1 de 4 · 360px: 2 de 4 (dos líneas) · 520px: 2 de 4 (una línea) · 720px: 3 de 4 |
| Lector | Todos los rótulos (ocultos a la vista) y valores en el árbol |
| Contraste | Mínimo 4.72:1 (valor compartido en `text-subtle` sobre la opción activa) |

**Coste:** medio. El CSS es simple (anchos fijos); el coste está en la API (quién compara: un contenedor de lista o una prop `diff` que calcula el anfitrión), en la fila de cabecera dentro de un `listbox` (`role="presentation"`, decorativa) y en fijar el ancho de casilla (¿token, prop, constante?). **Riesgos:** valores largos; listas heterogéneas; el salto de una a dos líneas mueve la lista una vez.

---

## C · Una forma, cuatro tamaños

**Estructura.** La ficha es **un objeto con cuatro cuerpos** según su ancho propio: **píldora** (< `space × 50`: una línea, radio de píldora), **fila** (< `space × 80`: dos líneas), **tarjeta** (< `space × 130`: cabecera y rejilla de pares) y **panel** (≥: identidad grande, título de sección, pares). En bloque lleva **su propia superficie** (borde, radio, sombra), que cambia con el tramo: no necesita una `GCard` alrededor. Dentro de un anfitrión de alto fijo (opción, celda, campo) el tramo lo fija el anfitrión y C se comporta como la base (en el campo, como píldora).

**Comportamiento.** En píldora y fila, «+N» es un **botón** (`aria-expanded`, `aria-controls`) que abre **la cara siguiente** (la tarjeta completa) en una capa anclada (`popover="auto"`): sin navegar, sin perder el sitio; Esc y pulsar fuera la cierran y el foco no se mueve del botón. Solo existe **fuera** de un anfitrión interactivo.

**Movimiento.** Al cambiar de tramo, identidad y título **viajan** de su sitio anterior al nuevo (FLIP con `--g-duration-slow` y `--g-ease-spring`; el avatar cambia de tamaño escalando) y la superficie cambia de radio y relleno (`--g-ease-out`). La segunda cara entra con `--g-ease-spring`.

### Qué lo hace distinto (C)

Es el lenguaje de la Isla de estado y de las píldoras de Grana llevado a los datos: **el mismo objeto cambia de cuerpo**, y se ve que es el mismo porque su cara (avatar y nombre) no se teletransporta, viaja. En una rejilla que se redimensiona, cada tarjeta se pliega en fila y en píldora sin que nadie pierda de vista quién es quién. Y lo que una píldora calla está a un toque, en el sitio.

### Gana y arriesga

- **Gana:** la mejor lectura cuando hay espacio (rejilla de pares, panel); la única que resuelve bien el caso «tarjeta de 160px» (píldora de 34px) y el de 720px (panel) con la misma pieza; segunda cara sin navegar; identidad visual más reconocible.
- **Arriesga:** **el alto cambia con el ancho** (34 → 66 → 208 → 170px): una rejilla de fichas C mueve el contenido de debajo al redimensionar (D1 de la Isla dice «nada se mueve»; aquí se mueve). Son **cuatro umbrales** en píxeles que no saben del texto (dentro de cada tramo sigue haciendo falta la cesión de la base). Los tramos solo miran el ancho: en un hueco estrecho y alto (vista previa de 200px) elegiría píldora; el anfitrión tiene que fijar el tramo. La superficie propia **se solapa con `GSurface` y `GCard`** (habría que componer `GSurface`, como hace `GCard`). En el caso que originó la ronda (la opción del combobox) **no aporta nada sobre la base**: no puede llevar botón ni cambiar de tramo.

### Medidas (C)

| Medida | Resultado |
| --- | --- |
| Sin desborde, 160 a 720px, seis casos, LTR y RTL | Pasa |
| Identificador entero en todos los anchos | Pasa (en la píldora apretada cede el avatar, decorativo, antes que el identificador) |
| Tramos | 170px píldora · 260px fila · 400px tarjeta · 640px panel (medido) |
| Alto por contexto | Opción y celda: 44px en los 29 anchos. Campo: Δ0 (la píldora cabe en el alto del campo). Tarjeta: 34px (píldora), 66px (fila), 208px (tarjeta), 170px (panel) |
| Datos visibles en la opción | 240px: 1 de 4 · 360px: 2 de 4 · 520px: 3 de 4 (igual que la base) |
| Segunda cara | Intro en «+N»: capa abierta, `aria-expanded="true"`, contiene los cuatro datos, dentro del visor, foco en el botón; Esc: cerrada, `aria-expanded="false"`, foco en el botón. Botón ≥ 24 × 24px (44px con `pointer: coarse`, por zona ampliada) |
| Movimiento | Al pasar de 190 a 400px hay animaciones en curso en la tarjeta; con movimiento reducido, ninguna |
| Lector | Todos los datos en el árbol en los cuatro tramos; el botón se llama «Ver N datos más de {título}» (texto de la aplicación) |
| Contraste | Mínimo 6.9:1 |

**Coste:** alto. Medición de tramo, FLIP, capa anclada con foco y cierre, superficie compuesta, y la interacción con `GCard`. **Riesgos:** salto de layout; umbrales; solape con `GCard`; `linear()` en `Element.animate` (los tres motores lo aceptaron aquí; versiones antiguas, no); posición de la capa en el borde del visor (prototipo: se recoloca en horizontal, no hacia arriba).

---

## Comparativa

| | A · Prioridad líquida | B · Tira que se compara | C · Una forma, cuatro tamaños |
| --- | --- | --- | --- |
| Pregunta que contesta | Qué cabe aquí, con este texto | En qué se diferencia de la vecina | Qué cuerpo cabe aquí |
| Opción a 240 / 360 / 520px (datos visibles de 4) | 1 / 2 / **4** | 1 / 2 / 2 | 1 / 2 / 3 |
| Homónimos | Se lee cada fila | **Se ve la diferencia** | Se lee cada fila |
| Valor en el campo | Línea que cede | Valores sin rótulo | Píldora |
| Vista previa | Corriente (menos escaneable) | Dos columnas alineadas | **Rejilla de pares** |
| Tarjeta en rejilla que cambia de ancho | Alto casi fijo (78–126px), datos que entran | **Alto fijo** (229px), filas que coinciden | Alto variable (34–208px), cuerpo que cambia |
| Celda de tabla | Sí | Sí, columnas dentro de la columna | Como la base |
| Umbrales en píxeles | **0** | 1 | 4 |
| Movimiento propio | Entrada de datos | Ninguno | Viaje entre tramos, segunda cara |
| Resuelve el caso de origen (opción estrecha) | **Sí** | Sí | Como la base |
| Coste | **Bajo** | Medio | Alto |
| Riesgo principal | Vista previa poco escaneable | Menos datos por píxel; valores largos | Salto de layout; solape con `GCard` |

## Recomendación

**A como identidad de la ficha, con la comparación de B como modo de las listas, y de C solo los tramos de bloque sin su superficie.**

- **A** decide cómo ceden los datos en todos los modos de línea (`inline`, `row`): resuelve de raíz el reporte del usuario, es la más barata y no tiene umbrales.
- **De B, el contraste entre homónimos** (lo único pesa, lo compartido se apaga) se suma a A en las listas (opción de `GCombobox`, filas): no necesita las casillas fijas para funcionar. Las **casillas alineadas** quedan como modo opcional (`align`) para listas homogéneas, en una segunda entrega.
- **De C**, los modos `stack` y `panel` ya están en la base para cuando hay alto libre (vista previa, tarjeta ancha): cubren el punto débil de A. La **superficie propia, la píldora con forma y el viaje entre tramos no se recomiendan** ahora: el salto de layout y el solape con `GCard` pesan más que lo que aportan. La **segunda cara** («+N» que abre la ficha completa) se reserva para una ronda propia: es valiosa en tarjetas y celdas, pero es otro componente en términos de foco y capa.

## Qué lo hace distinto (resumen de la recomendación)

Una ficha que **no tiene versión compacta**: tiene prioridad. Cede dato a dato con el texto real, dice cuánto calla, deja al identificador ganar al nombre cuando hay homónimos, y entre vecinas con el mismo nombre **enseña la diferencia** en lugar de repetir lo igual.

## Comprobaciones

`node design/lab/summary/r02/verificar.mjs` · 2026-10-04 · Chromium, Firefox, WebKit · **14 112 comprobaciones** (A, B y C; la base, aparte, en r01: 4 694). Pasada completa en los tres motores: 14 111 pasan y 1 falla (WebKit, C, «tramos»: el script esperaba 120ms tras cambiar el ancho y el cambio de tramo va aplazado un cuadro; con 350ms de espera, WebKit C solo: 1 570 de 1 570). La pasada completa no se repitió tras ese ajuste del script.

Por concepto y motor: la batería de r01 (sin desborde, nada cortado a medias, identificador entero, título visible, lector, «+N», alto por contexto, Δ0 del campo, rejilla, móvil 320, RTL, movimiento reducido, consola) más lo propio (A y C: animación en curso al ensanchar; C: tramos, segunda cara con teclado y tamaño del botón; B: alineación de columnas, peso de lo único, ficha sin homónimos; contraste en Chromium).

**No comprobado:** lector de pantalla real (en especial: datos recortados por `overflow`, rótulos ocultos de B, botón «+N» y capa de C); `forced-colors` (reglas escritas en C, sin medir; B depende del peso, que sí se conserva); tema oscuro y un tema distinto al por defecto (el 4.72:1 de A y B es del tema claro por defecto); táctil real (zona de 44px del botón de C, sin medir); zoom de texto al 200 %; texto árabe o hebreo real (RTL medido con texto latino); la ficha dentro de `GCombobox`, `GMenu` y `GSelect` reales; fluidez del movimiento de A y C (se comprobó que existe, no cuadros por segundo); rendimiento con cientos de fichas; la capa de C cerca del borde inferior del visor.

## Hallazgos para lima

| # | Tema | Propuesta |
| --- | --- | --- |
| L13 | A · rótulo evidente | `facts[].plain` (Boolean; nombre a decidir: `selfLabel`, `bare`): el rótulo puede callarse a la vista antes de soltar el dato. Estado `data-terse` |
| L14 | A · entrada | `data-enter` en el dato que vuelve a caber (bruno lo pone y lo quita en `animationend`); coco anima con `--g-duration-slow` y `--g-ease-out`; con movimiento reducido, nada |
| L15 | A · líneas por anfitrión | `lines`: 1 (`inline`), 2 (opción, celda), 3–4 (tarjeta), 0 (vista previa). Con A, `row` + `lines` cubre también la tarjeta |
| L16 | B · comparación | Dos formas: **(a)** prop `diff` por ficha (`{ [label]: 'same' \| 'diff' }`), calculada por el anfitrión de la lista (`GCombobox` la calcula para sus opciones a la vista); **(b)** utilidad exportada `summaryDiff(list)`. Clases `is-same` / `is-diff`. Regla: valor único entre las fichas del mismo título = `diff`; compartido con alguna = `same`; sin homónimos, sin marca. Solo entre opciones **a la vista** |
| L17 | B · casillas (segunda entrega) | `align` (Boolean) + ancho de casilla (constante `space × 22`, ¿token?) + fila de cabecera (`heading`, decorativa; en `listbox`, `role="presentation"`) |
| L18 | C · reservas | `expandable` + `labels.more` («Ver {n} datos más de {title}») y `surface`: reservar nombres, sin implementar |
| L19 | Identidad en `DECISIONS.md` | Registrar la elección del usuario (A, A+B, …) y las semillas descartadas (ficha tipográfica; dos caras como concepto) |
| L20 | `GCombobox` | Con A + contraste: la opción por defecto pasa a `row` `lines=2`; `__token` a `inline`; la vista previa a `stack`. El contraste entre homónimos lo calcula `GCombobox` sobre las opciones pintadas (no sobre el total del servidor) |

## Preguntas de producto (tres)

1. **¿Qué concepto es la identidad de la ficha?** A · Prioridad líquida, B · Tira que se compara, C · Una forma, cuatro tamaños, o una mezcla. **Recomendación: A, con el contraste entre homónimos de B en las listas** (casillas alineadas y segunda cara de C, reservadas).
2. **¿Cómo se llama?** `GSummary` (tu palabra, sin «Card»; convive con `GErrorSummary` y con la prop `summary` de `GFormSection`) o `GEntity` (sin choques, más abstracto). **Recomendación: `GSummary`.**
3. **¿`GCombobox` la adopta ya por dentro?** Opción, valor del campo y vista previa pasarían a pintarse con la ficha (mismos datos de #335, más `priority` opcional), en lugar de esperar a que la ficha esté cerrada y dejar entretanto el arreglo mínimo de coco. **Recomendación: sí, como primer consumidor y en el mismo lote**, para que el reporte que originó la ronda quede resuelto con la pieza y no con un parche.
