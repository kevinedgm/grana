# Declaración — botón flotante con acciones (`GFab`), r01: base funcional y tres conceptos

> kiwi, 2026-10-18. Prototipo: `index.html` + `fab.js` (un solo motor de laboratorio para la base y los tres conceptos) + `fab.css` (geometría con tokens del tema por defecto de `dist/grana.css`; no es el CSS de coco) + `page.js` (datos y marcos). `frontera.html` usa `GBtn`, `GMenu` y `GDialog` **reales** de `dist/`. Iconos: solo Lucide (`design/lab/lucide-icons.js`); el FAB no pide ningún icono fuera de la lista de la librería. Verificación: `verificar.mjs`, puerto 4213, recuento en «Comprobaciones». La base deriva de HTML, APG y WCAG 2.2; **la forma (A/B/C) es la pregunta de producto** del final.

## Cuestionar la premisa (antes de la forma)

El brief pide «una acción principal y un despliegue de hasta 15». Tres respuestas honestas, medidas en el prototipo:

1. **Con una sola acción no hay menú.** Esconder la única acción detrás de un despliegue cuesta un toque más y no aporta nada: el FAB **es** esa acción (nombre, icono, `select`).
2. **Si una acción domina, no se esconde.** Un *speed dial* cobra dos toques por todo. Cuando hay una acción que se usa casi siempre («Nueva muestra»), el FAB la ejecuta con un toque y las demás van en una cola pegada (concepto C, o la opción `main` sobre A).
3. **Quince acciones no se despliegan: se priorizan y se agrupan.** Lo que cabe a mano son ~5 (columna del pulgar); el resto se agrupa por categoría en un panel. Y el radial **no escala**: con etiquetas siempre visibles (no se depende del hover), un cuarto de círculo necesita **96px de radio para 3 acciones y 346px para 6** (5 + «Más»; medido en Chromium); dentro del alcance del pulgar (≤ 200px) caben **3 + «Más»**. La cantidad nunca decide el radial (regla del brief): el arco solo existe si se pide **y** cabe.

Fuera del FAB (frontera, no se prototipa): las acciones **sobre una selección** van junto a la selección (barra de `GTable`), y las **de la página** en el encabezado o en el muelle de `GPageHeader` en estrecho (#630). El FAB es para **crear o capturar desde cualquier sitio**.

## Anatomía (base)

```
GFab  <div class="g-fab" data-position data-appearance data-state data-ack? is-tucked?>        ← sitio en el borde
├─ GBtn  <button type="button" aria-haspopup="menu" aria-expanded aria-controls="ID-menu"      ← el disparador ES un GBtn
│        aria-describedby="ID-status" id="ID-trigger">                                          (icon, rounded="pill", size="xl")
│        GIcon plus ↔ GIcon x (se cruzan) · nombre constante (`label`, por GTooltip) · insignia de acuse
├─ <span id="ID-status" class="g-fab__sr">Exportando CSV…</span>                               ← descripción del acuse
│  [C: <div role="group" aria-label=label> GBtn principal (icono + etiqueta) + GBtn cola (`labels.more`)]
<ul role="menu" id="ID-menu" popover="manual" tabindex="-1" aria-labelledby="ID-trigger">        ← justo después en el DOM
│  pila: <li role="none"><button role="menuitem" tabindex="-1|0" aria-describedby="desc why">  icono · etiqueta · ▲ si peligrosa
│        …  y, si sobran, la cola: <button role="menuitem" aria-haspopup="menu" aria-expanded aria-controls="ID-more">Más acciones (N)
│  panel: <li role="none"><div role="presentation" id="g1">Crear</div><ul role="group" aria-labelledby="g1">…</ul></li>
<ul role="menu" id="ID-more" popover="manual" tabindex="-1" aria-labelledby="ID-tail">           ← panel de la cola (submenú APG)
<div class="g-fab__scrim" popover="manual" aria-hidden="true">                                  ← solo puntero grueso; con hueco en el FAB
```

## Base funcional (común a cualquier forma)

**Qué es**

1. **`GFab` es un botón de menú flotante** (APG *Menu Button*) con el **motor de menú de `GMenu`** y lo que solo tiene algo flotante: sitio en el borde con área segura, convivencia con los otros elementos del borde, «se aparta», confirmación en el sitio, acuse en el FAB y una sola activación por gesto. Nombre propuesto `GFab` (`g-fab`), avisos `[Grana GFab]` (L1).
2. **Semántica `menu` en todas las formas** (pila, panel, arco). Razones: (a) solo contiene **comandos**; (b) `auto` cambia la forma por espacio, y cambiar de semántica (de botones a menú) con el tamaño de pantalla rompería la consistencia (3.2.4) y el modelo de teclado; (c) el motor ya existe y está verificado en `GMenu`. **Descartado:** *disclosure* con lista de botones (15 paradas de Tab, sin letra, y Esc/fuera habría que hacerlos igual). Si algún día una acción necesita controles (un campo, un selector), **no** es un FAB: es `GDialog` o `GHelper`.
3. **El disparador es un `GBtn`** `icon rounded="pill" size="xl"` (medido: **52 × 52**, `space × 13`; no hace falta un tamaño nuevo), con `GTooltip` para el nombre visible (#380; con `aria-expanded="true"` ya no se abre, #384) y el rebote al soltar de #300 gratis. **Nombre constante** (`label`, «Crear y capturar») con `aria-expanded`; la «x» es solo visual (como los conmutadores de #645). Se añade **elevación** (`--g-shadow-2`) y su sitio.

**Orden y foco**

4. **El orden nace del FAB.** El arreglo `items` es el orden de frecuencia y la primera es **la más cercana al FAB**. Cuando la pila sube (FAB abajo), el DOM va de arriba abajo, así que la más importante es **la última del DOM**, junto al botón (precedente: iOS `UIMenu` con `preferredMenuElementOrder = .priority`, que invierte el orden cuando el menú se abre por encima). Lectura, foco y flechas siguen a lo visual (↑ se aleja, ↓ se acerca; 1.3.2 y 2.4.3). En el panel, que es un texto con grupos, el orden es el escrito, de arriba abajo (L3).
5. **Foco al abrir:** en la primera por frecuencia (la más cercana; en el panel, la primera). APG: Intro, Espacio y la flecha **hacia la lista** abren en la primera; la flecha contraria abre en la más lejana. Con el gesto de B, el foco sigue al dedo.
6. **Foco al cerrar:** Esc, elegir y pulsar el FAB → al FAB; **Tab** → cierra y el foco sigue su curso desde el FAB (Mayús+Tab, hacia atrás); **clic fuera** → no se roba; **el ancla sale del visor** (contenedor desplazado) → no se devuelve (#358 regla 3); **un modal se abre** → no se toca. Esc con el foco perdido en `body` (WebKit no enfoca un botón al pulsarlo) **también cierra** (medido en WebKit).
7. **Orden de `select`: el de `GMenu` (#573)**: emitir, cerrar, foco al disparador si seguía en la lista. Medido con `GMenu` + `GDialog` reales: un diálogo abierto dentro de `select` recibe el foco y, al cerrarse, lo devuelve al disparador en los tres motores; **no hace falta otro orden**.

**Teclado (APG *Menu*, como `GMenu`)**

8. ↑ ↓ recorren (cíclico), Inicio/Fin a los extremos del DOM, **letra** salta a la siguiente que empieza por ella (500 ms), Intro/Espacio activan, Esc cierra, Tab cierra. En la cola: → (← en RTL), Intro o Espacio abren su panel con el foco en su primera; ← (→ en RTL) o Esc vuelven a la cola. En el arco (B): además → y ← (espejadas en RTL) recorren el arco en orden lineal, como las flechas de `GCardGroup`. En C, escribir **filtra** (decisión 27).
9. **Lista inerte mientras se cierra** y `tabindex="-1"` en toda lista desplazable (#570): medido, sin ello Chromium hace del panel una parada de Tab durante la salida y el foco acaba en `body`.

**Puntero, táctil y una activación por gesto**

10. **Sin hover:** todo se abre y se elige con un toque; las etiquetas son siempre visibles (no hay mini círculos solo con icono). El puntero mueve el foco (M1 de `GMenu`, #305), nunca el puntero quieto (#358 regla 4).
11. **Una activación por gesto:** el segundo clic de un doble clic (`detail > 1`) no cierra el FAB ni ejecuta una segunda acción; Intro o Espacio **mantenidos** (`repeat`) no repiten (ni la acción ni la reapertura del FAB: sin esto, mantener Intro ejecuta la acción, cierra y reabre). **Medido en `GMenu` hoy:** un doble clic en su disparador abre y vuelve a cerrar (L8).
12. **Velo táctil con hueco:** con `pointer: coarse`, bajo la lista va un velo (`--g-surface-backdrop`) que cubre la pantalla **salvo el FAB** (`clip-path` evenodd): tocar fuera **cierra sin activar lo de debajo** (medido: el enlace tocado no se sigue) y el FAB sigue siendo el cierre. Con puntero fino no hay velo y el clic fuera llega a su destino (convención de escritorio, como `GMenu`).

**Peligrosas, deshabilitadas y en curso**

13. **Peligrosa = confirmación en el sitio** (`danger` + `confirm`): al activarla, su fila se parte en dos **sin mover nada más**: «Cancelar» **bajo el puntero y con el foco** y la confirmación (`confirmLabel`, relleno `danger`) al lado, dentro de un `role="group"` cuyo nombre es la pregunta (`confirm`). Doble clic → no ejecuta (el segundo cae en «Cancelar» o se ignora). Esc, o el foco que sale del par, la deshace **sin temporizador** (2.2.1). Marca de forma `triangle-alert`, nunca solo color. **Elegido frente a:** retener para confirmar (exige tiempo y motricidad fina), diálogo de confirmación (salto de contexto para una acción de un menú) y deshacer (solo vale si la aplicación puede deshacer; queda como vía: `confirm: false` cuando la aplicación ofrece «Deshacer» en su aviso).
14. **Deshabilitada = `aria-disabled` enfocable** (como `GMenu`) y, si `disabled` es texto, **ese motivo es su descripción** y se ve (regla 1 de «Acciones con acuse», #643). Si **todas** lo están, el FAB se abre igual y enseña los motivos. **Una sola acción deshabilitada:** el FAB es esa acción con `aria-disabled` y el motivo como descripción (en el real, en el `detail` de `GTooltip`).
15. **En curso = acuse en el FAB** (regla 3 de #643 llevada a `select`): el evento trae un **ticket** (`busy`, `done`, `failed`, `cancel`). `busy(texto)`: insignia que gira (`loader-circle`) en la esquina del FAB, el texto como **descripción del FAB** y anuncio cortés; al reabrir, la acción está `aria-disabled` con ese texto (no se lanza dos veces). `done(texto)`: insignia `check` ~2 s y anuncio; `failed(texto)`: insignia `circle-alert`, el motivo queda en la acción y se puede reintentar. Sin ticket, no hay acuse (nunca un éxito no confirmado).
16. **Anuncios:** abrir y cerrar no se anuncian (`aria-expanded`); las acciones las lee el foco; el acuse y el recuento de la búsqueda de C van por el **canal cortés de página** (`announcePage`, #533); al entrar en el par de confirmación, el lector dice el nombre del grupo (la pregunta).

**Posición y convivencia**

17. **`position`** con los seis valores lógicos de `GToaster` y `GSpeechHost` (`bottom-end` por defecto) y **`anchor`**: `viewport` (fijo, por defecto) o `container` (absoluto en el antecesor posicionado: un mapa, un panel). Margen seguro `space × 4` + `env(safe-area-inset-*)`. **La lista siempre crece hacia dentro** (FAB abajo → sube): no hay cambio de lado (regla 1 de #358 trivial); si no hay sitio, se limita el alto y el panel desplaza (regla 2: `--_max` fijo al desplazar).
18. **Se aparta (WCAG 2.4.11):** si el elemento con el foco queda bajo el FAB (contenido al final de la página o del contenedor), el FAB se esconde contra su borde y deja **24px** visibles y operables; al llegarle el foco, vuelve. En táctil, **al escribir en un campo** (teclado en pantalla) también se aparta. Medido: cubre el 1,2 % del elemento con foco (criterio ≤ 5 %) y nunca su centro; nada de la página se mueve. **No se esconde al desplazar** (moverse con el scroll es un estorbo y un riesgo vestibular).
19. **Borde compartido:** `EDGE_ORDER = { speech: 10, pageHeader: 15, status: 20, fab: 25 }` (L6). El FAB **lee** lo anterior de su borde (la pill de la voz y el muelle de `GPageHeader` abajo; además la isla arriba) y **publica** su alto contraído + margen; `GToaster`, que suma todo, queda **encima** del FAB. Medido con un registro simulado (voz → muelle → FAB → avisos, sin solapes). Lo persistente no se mueve por lo transitorio; el FAB abierto no publica su alto (movería los avisos bajo el dedo).
20. **Modal:** el FAB **no se traslada** al `<dialog>` modal (la voz sí, #213, porque se dicta en los campos del modal; las acciones de página no aplican dentro). Al abrirse un modal, la lista se cierra y el FAB queda inerte bajo el fondo (medido).
21. **`GPageHeader`:** abajo, el FAB queda encima del muelle (orden 25 > 15). Receta: lo que es de la página va en el muelle; no poner la misma acción en los dos (L-receta, sin aviso).
22. **Móvil** (< `space × 130`, umbral de `GDialog`): la pila no cambia (es la columna del pulgar); el panel ocupa el ancho del visor menos los márgenes, encima del FAB; el arco no se usa (lista antes que radial). Con puntero grueso, acciones ≥ 44px. **Reflujo a 320px** sin desplazamiento horizontal (medido).

**Movimiento (lenguaje de #299)**

23. Sin muelle (`--g-ease-spring` no aplica a menús ni paneles, #299). Entradas `--g-duration-press` + `--g-ease-out`, salidas más cortas (`--g-duration-fast`), nada supera 240 ms, nada al montar. **Reducido:** solo fundidos; el FAB que se aparta aparece en su sitio.

**Estados (todos con comportamiento explícito)**

| Estado | Comportamiento |
| --- | --- |
| Contraído | `data-state="closed"`, lista oculta (fuera del árbol de accesibilidad), FAB con `aria-expanded="false"` |
| Expandiéndose | `opening` durante dos cuadros: la lista ya es operable y tiene el foco; un segundo clic (`detail > 1`) se ignora |
| Expandido | `open` |
| Contrayéndose | `closing`: la lista es **inerte**; volver a abrir durante la salida la cancela y vuelve a `open` desde donde esté (transiciones, no keyframes: nada queda a medias) |
| Sin acciones | No se pinta nada (ni botón ni panel vacío); sin aviso (los permisos pueden quitarlas todas) |
| Acciones deshabilitadas | `aria-disabled` enfocables con su motivo visible; todas deshabilitadas → el FAB abre y enseña los motivos; una sola → el FAB deshabilitado con motivo |
| Acción en ejecución | Ticket: insignia, descripción del FAB, anuncio; la acción `aria-disabled` mientras dura; `done` / `failed` |
| Contenido que excede la altura | La pila nunca desplaza (solo entra lo que cabe, ≤ 5); el panel limita su alto al espacio y desplaza; el FAB (el cierre) siempre queda fuera del panel y visible |
| Error de configuración | **Nunca lanza, nunca descarta en silencio.** Avisos de desarrollo con la guarda de #653. Sin `label` o sin `id` → no se pinta y avisa (una acción sin nombre no es operable; como `GMenu`). `id` duplicado → se pintan las dos y avisa (`select` lleva `item`). **Más de 15** → se pintan **todas** (en panel) y avisa: el límite es una guía de diseño, no un recorte. Icono fuera de la lista → sin icono y aviso. Peligrosa sin `confirm` → pregunta con su etiqueta y aviso. Arco sin icono en alguna → pila y aviso. `items` no arreglo → nada y aviso. Medido: 18 elementos con un duplicado y uno sin nombre → 17 pintados y 3 avisos |

## Fronteras

| Con | Qué es y qué no |
| --- | --- |
| **`GMenu`** | **El motor es el mismo** (roles, foco itinerante, letra, Esc/Tab/fuera, grupos, `danger`, deshabilitados enfocables, M1). Respuesta honesta: **el panel de C es un `GMenu` anclado a un botón redondo con descripciones**. Lo que `GMenu` no tiene y un FAB necesita: sitio fijo en el borde con área segura, `edgeReserve`, «se aparta», velo táctil con hueco, orden que nace del botón, pila con cola, confirmación en el sitio, acuse con ticket, `description` y `group` planos, una activación por gesto. **Propuesta:** `GFab` **no envuelve** al componente `GMenu` (su lista es una caja con geometría propia) sino que **comparte su motor**, extraído a `utils/menuNav.js` (como `utils/collapse.js` salió de `GFormSection` para `GAccordion`). Sin el FAB, «un `GMenu` con disparador redondo» se queda sin el 60 % de lo que el brief pide (posición, borde, estados) y cada aplicación lo rehace (L4) |
| **`GBtn`** | El disparador **es** un `GBtn` (`icon`, `rounded="pill"`, `size="xl"`, 52px medido); en C, dos `GBtn` unidos. Sin variante nueva de `GBtn` |
| **`GTooltip`** | Nombre visible del FAB solo con icono (`GBtn tooltip`). Las etiquetas del arco **no son tooltips** (siempre visibles al abrir, sin `role="tooltip"`), pero toman su forma: pestaña en superficie inversa (#387, #325) |
| **`GIcon` / `GLibIcon`** | Todo lo del componente sale de la lista de la librería (`plus`, `x`, `ellipsis-vertical`, `loader-circle`, `check`, `circle-alert`, `triangle-alert`): **cero iconos nuevos**. Los de las acciones son de la aplicación (`icon` por nombre, «dato → nombre», #202) |
| **`GSpeechTrigger` / `GSpeechPill`** | El FAB no aloja la voz. «Dictar nota» puede ser una acción que llama a `speech.start()`; la pill y el FAB conviven por `EDGE_ORDER` (la pill más cerca del borde) |
| **`GPageHeader`** | El muelle en estrecho lleva las acciones **de la página**; el FAB, las de crear/capturar globales. Abajo, el FAB encima del muelle |
| **`GTable`** | Las acciones sobre la selección no son un FAB |

## Los tres conceptos

Los tres comparten la base entera. Cambia la **forma** y **cómo se llega a una acción**.

### A · La pila que crece — «las frecuentes nunca se mueven»

Una sola estructura para 2 o 15. Salen del FAB **las que caben** (hasta 5) como píldoras con icono y etiqueta, alineadas al borde del FAB con los iconos en columna sobre el suyo, la más usada pegada al botón. Si sobran, la fila más lejana es **«Más acciones (N)»** (submenú APG), que abre el resto **agrupado** en un panel **encima de la pila** si quedan ≥ `space × 40`, o **cubriéndola** entera (cascada, como `GMenu`) si no. Cada píldora sale del centro del FAB y viaja a su sitio, la más cercana primero (escalonado ≤ 4 × 16 ms; total ≤ 224 ms).

- **Política `auto` (medible):** `k = min(n, 5, ⌊(H + g) / (p + g)⌋)` con `H` = espacio entre el FAB (+ `space × 3`) y el margen seguro, `p` = alto de la píldora (`space × 10`; 44px con puntero grueso) y `g` = `space × 2`. `n ≤ k` → todas en la pila; `n > k ≥ 2` → `k − 1` píldoras + cola; `k ≤ 1` → panel directo.
- **Gana:** la memoria del gesto: **cambiar de 6 a 10 o 15 acciones no mueve ni una de las cuatro primeras** (Δ 0px medido), y con 3 están donde estaban con 15. La base del brief, en cambio, cambia de forma al pasar de 5 a 6 y «Nueva muestra» salta 312px (medido). Es lo más predecible con teclado y lector (menú + submenú estándar).
- **Arriesga:** dos niveles cuando hay muchas; en un contenedor bajo (480px) el panel cubre la pila.
- **Coste:** accesibilidad baja (APG estándar); peso estimado ~4–5 KiB gzip con el motor compartido.

### B · Arco con gesto — «el experto no abre el menú»

Las acciones en un **cuarto de círculo** (semicírculo con `bottom-center`) alrededor del FAB, cada una con su **etiqueta siempre visible** en pestaña inversa por fuera. **Dos caminos:** tocar abre el arco y se toca la acción (novato, teclado, lector), o **pulsar el FAB y deslizar** hacia la acción y **soltar** (experto, *marking menu*: la dirección se aprende y se hace sin mirar). Soltar en el centro **cancela** (2.5.2); el gesto tiene alternativa de un solo toque (2.5.1, 2.5.7). **Lo destructivo nunca queda a un gesto:** va en «Más». **Alcance del pulgar:** el arco prueba con todas las que admite (≤ 6) y pasa de una en una a «Más» hasta que el radio que separa círculos y etiquetas quepa en `space × 50` (200px); si ni con dos cabe, o el visor es estrecho, **se resuelve a la pila de A** (`data-fallback="arc"`). Nunca se elige solo (regla del brief).

- **Gana:** la acción más rápida para quien repite (un gesto, sin mirar); identidad visual fuerte; las etiquetas en pestaña son de la familia de `GTooltip`.
- **Arriesga:** solo 3 + «Más» caben en el alcance del pulgar (medido); no sirve en móvil; el gesto puede dispararse sin querer (umbral de 10px como `GTooltip` y cancelación en el centro); el lector y el teclado no ganan nada (orden lineal); exige icono en todas; esquinas y RTL espejados.
- **Medido:** 3 acciones a 96px de radio; 6 piden 346px; con el tope de 200px, 3 + «Más (3)» a 156px; deslizar hacia «Tomar foto» y soltar la ejecuta una vez sin reabrir con el clic que sigue; volver al centro cancela.
- **Coste:** accesibilidad alta (gesto + teclado lineal + geometría); peso estimado +2 KiB sobre A.

### C · Acción con cola — «lo frecuente cuesta un toque»

Cuestiona la premisa: **el FAB es la acción principal** («Nueva muestra», con icono **y etiqueta**) y lleva pegada una **cola** (`ellipsis-vertical`, «Más acciones») en un `role="group"` con el nombre del lanzador. La cola abre el resto en un **panel que nace de ella** (transformación de contenedor: el recorte parte del tamaño de la cola y crece hasta la caja, `--g-duration-slow` + `--g-ease-out`), con grupos y descripción. **Búsqueda sin campo:** con el panel abierto, **escribir filtra** por etiqueta y descripción y lo escrito se ve en la cabecera del panel (««exp» · 1 acción», `aria-hidden`; el recuento se anuncia); Retroceso corrige; sin coincidencias, lo dice y no vacía la lista ni pierde el foco; Esc limpia y otra Esc cierra. La semántica sigue siendo `menu` (no hay `textbox` dentro de un menú). En móvil, el panel a todo el ancho sobre la barra.

- **Gana:** la acción dominante a un toque y con nombre visible (descubrible); con 15, dos letras llevan a cualquiera; las descripciones explican las raras.
- **Arriesga:** si no hay una acción dominante, la principal miente (la elige la aplicación); dos paradas de Tab; escribir filtra en C pero en `GMenu` salta por la primera letra (dos comportamientos de letra en la librería, L5).
- **Coste:** accesibilidad media (filtro con anuncios, elementos ocultos en un menú); peso estimado +1,5 KiB sobre A.

## Comparativa

| | Base (brief literal) | A · La pila que crece | B · Arco con gesto | C · Acción con cola |
| --- | --- | --- | --- | --- |
| Toques para la más usada | 2 | 2 | 2, o 1 gesto | **1** |
| De 5 a 6 acciones | Cambia de forma: todo se mueve | **Nada se mueve**: aparece «Más (2)» | Igual hasta caber; luego «Más» | El panel crece |
| 15 acciones | Caja con grupos | 4 a mano + panel agrupado | 3 a un gesto + panel | 1 a un toque + panel con búsqueda |
| Móvil | Lista o caja | Igual (columna del pulgar) | Se resuelve a A | Panel a todo el ancho |
| Se aprende | — | El sitio de cada frecuente | La dirección de cada acción | Dos letras |
| Riesgo | Genérico | Dos niveles con muchas | Gesto accidental; solo 3 + «Más»; no en móvil | Una principal que no lo es |
| Coste de accesibilidad | — | Bajo | Alto | Medio |
| Peso (estimado, con el motor compartido) | — | ~4–5 KiB | +2 KiB | +1,5 KiB |
| Semántica y teclado | Iguales: botón de menú, `menu`, grupos con nombre, foco itinerante, Esc, Tab, letra, una activación por gesto | | | |

## Recomendación

**A · La pila que crece por defecto** (es la política `auto` y la base que el brief pide, sin su salto de forma), con **la principal de C como opción** (`main`: el FAB ejecuta esa acción y el resto va en la cola; el panel de C, con descripción, es el mismo panel de la cola de A). **B queda reservado** con su nombre (`appearance="arc"`), prototipado y medido: su ganancia es para expertos y solo caben 3 en el alcance del pulgar. La búsqueda sin campo de C se reserva hasta decidir si `GMenu` la adopta también (L5), para no tener dos comportamientos de letra.

## Qué lo hace distinto

1. **El orden nace del botón** (base): la más usada está siempre pegada al FAB, también en el foco y en el DOM. Sirve a quien usa el pulgar (menos recorrido) y a quien usa teclado o lector (el foco cae en lo más probable). Precedente de plataforma (iOS), no de los frameworks web.
2. **Las frecuentes nunca se mueven** (A): añadir acciones a la configuración no mueve las que ya se aprendieron; la cantidad cambia la cola, no el sitio. Medido Δ 0px con 3, 6, 10 y 15.
3. **Nunca tapa lo que usas** (base): el FAB se aparta del foco y del teclado en pantalla y se queda en 24px operables; ningún framework común lo hace y es el fallo típico de un FAB (2.4.11).
4. **Lo que confirma nunca nace bajo el puntero** (base): la confirmación se abre en la misma fila, «Cancelar» bajo el dedo; un doble clic nunca borra. Sin diálogo y sin temporizador.
5. **El FAB cuenta lo que hizo** (base): acuse honesto en el propio botón («Exportando…» → «CSV exportado»), sin un aviso flotante que tape más pantalla, y la acción no se lanza dos veces.
6. **Tocar fuera no activa lo de debajo** (base, táctil): el velo con hueco evita el «cerré el menú y abrí una fila».
7. **Experto sin menú** (B): pulsar-deslizar-soltar con cancelación en el centro; **con el arco limitado al alcance del pulgar** en vez de forzarlo.
8. **Una acción dominante no se esconde** (C/`main`), y **escribir dos letras** lleva a cualquiera de 15 sin un campo de búsqueda que rompa el menú.

Nada de esto toca contraste, foco ni movimiento reducido: los estados llevan forma además de color (marca de peligro, insignias con icono, contorno discontinuo de la cola), en reducido todo se funde y el FAB que se aparta aparece en su sitio; en `forced-colors`, bordes del sistema.

## Comprobaciones (`verificar.mjs`, puerto 4213)

**553/553**: Chromium 186, Firefox 181 (sin las 5 táctiles, que Firefox no emula), WebKit 186. Por concepto y cantidad (base 3 y 6, A 6 y 15, B 3 y 6, C 6 y 15, escritorio): disparador `button` con `aria-haspopup="menu"`, `aria-controls` y `aria-expanded`; nombre accesible sin el icono; abre con la forma esperada; foco en la primera por frecuencia; `menuitem`, `li role="none"`, grupos con nombre, una sola parada; todo dentro del marco con margen ≥ 8px y **sin solapes** (acciones, etiquetas del arco y FAB); áreas ≥ 40px de alto; etiquetas ≥ 4.5:1; Inicio/Fin, ↓ cíclica, letra; Esc cierra con foco al FAB; Tab cierra y sigue; clic fuera no roba el foco. **A:** las cuatro primeras Δ ≤ 0,5px con 6, 10 y 15 (y con 3; medido 0,02px); la base salta 312px de 3 a 6; la primera es la más cercana (última del DOM) y la cola la más lejana; ↑ se aleja; cola con `aria-haspopup`, `aria-controls` y la cuenta; → abre su panel con el foco en su primera; el panel no mueve la pila y va encima o la cubre según el sitio; ← vuelve. **Peligrosa:** marca de forma; doble clic no ejecuta; par `group` con la pregunta, foco en «Cancelar» bajo el puntero y la confirmación fuera; Esc deshace; con teclado ejecuta una vez. **En curso:** insignia, descripción y anuncio; `aria-disabled` con motivo mientras dura; pulsarla no hace nada; «hecho» con anuncio; fallida con motivo y reintentable. **Una activación:** doble clic deja el FAB abierto; Intro mantenido abre una vez y ejecuta una vez sin reabrir. **B:** gesto ejecuta una vez; centro cancela; con 6, radio ≤ 200px y el resto en «Más»; peligrosa fuera del arco; → avanza; en 360px, pila. **C:** `group` con dos botones; la principal a un toque; el panel nace recortado desde la cola; «exp» filtra a una y lo dice; Retroceso; sin coincidencias no vacía; Esc limpia y otra cierra con foco en la cola; en móvil a todo el ancho. **Se aparta:** cubre ≤ 5 % y nunca el centro del elemento con foco; ≥ 24px visibles; vuelve con el foco. **Estados:** avisos de duplicado, sin `label` y > 15; 17 pintadas; panel que desplaza dentro de los márgenes; sin acciones no pinta nada; una sola deshabilitada con motivo; una sola ejecuta sin menú. **Visor:** voz → muelle → FAB → avisos sin solapes; abierto dentro del visor; un modal cierra la lista y deja el FAB inerte; 320px sin desplazamiento horizontal con pila y panel dentro. **Táctil** (Chromium y WebKit): acciones ≥ 44px y velo; tocar fuera no sigue el enlace; tocar una acción la ejecuta; al escribir, el FAB se aparta; B en móvil táctil es pila. **RTL:** FAB a la izquierda y pila alineada; arco espejado sin solapes; ← avanza. **Oscuro + reducido:** etiquetas ≥ 4.5:1, icono y FAB ≥ 3:1, etiquetas del arco ≥ 4.5:1, sin `translate`, sin recorte en C. **Frontera:** `GBtn` xl 52 × 52; `GMenu` → `GDialog` devuelve el foco al disparador (hoy y con el orden alternativo); doble clic en `GMenu` abre y cierra. Sin errores en consola.

**No verificado:** lector de pantalla real (VoiceOver, NVDA, TalkBack) sobre el orden invertido de la pila («Nueva muestra, 5 de 5» al abrir: es lo que dice iOS, pero hay que oírlo en web), el par de confirmación dentro de un `menu` y el filtro de C; `forced-colors` real; el gesto de B con un dedo real (umbral, cancelación) y con `prefers-reduced-motion` en móvil; teclado en pantalla real (el FAB se aparta con el foco en un campo, no con `visualViewport`); el registro de bordes **real** (`utils/edgeReserve.js`): el prototipo lo simula con el mismo algoritmo; el peso (estimado, sin construir).

## Hallazgos para lima

| # | Tema | Propuesta |
| --- | --- | --- |
| L1 | Nombre, entrada y peso | `GFab` (`g-fab`), avisos `[Grana GFab]`. **Entrada propia `@grana/vue/fab`** (global UMD `GranaFab`): el margen del principal está agotado (#506, #550). El motor de menú y `edgeReserve` llegan por `__shared`; el CSS en `grana.css`. Compuertas al estilo de #633 |
| L2 | Semántica | `menu` en todas las formas; disparador `GBtn icon rounded="pill" size="xl"` con nombre constante (`label`) y `GTooltip`; sin variante nueva de `GBtn` |
| L3 | Orden desde el FAB | Desviación registrada respecto de `GMenu` (que siempre empieza arriba): en la **pila**, la primera de `items` es la más cercana al FAB y el DOM se invierte cuando la pila sube; foco al abrir en ella. En el panel, orden escrito. Verificar con lector real (Fase D) |
| L4 | Motor compartido | Extraer de `GMenu` a `utils/menuNav.js` (foco itinerante, letra, Esc/Tab/fuera, M1) y usarlo en los dos. Encargo a bruno; `GMenu` no cambia de comportamiento |
| L5 | Campos nuevos de las acciones | `description` (String) y `group` (String plano: el título del grupo; orden de primera aparición), `confirm` (String \| `false`) y `confirmLabel` (String). Decidir si `GMenu` adopta `description` (mismo nombre); la búsqueda que filtra (C) solo si `GMenu` también la adopta, para no tener dos comportamientos de letra |
| L6 | Borde compartido | `EDGE_ORDER.fab = 25` (tras la isla, antes de los avisos): el FAB lee lo anterior de su borde y publica su alto **contraído**; `GToaster` sin cambios. Nada dentro de un `<dialog>` |
| L7 | Listas desplazables | Confirmar en el contrato `tabindex="-1"` en las listas del FAB (#570) y lista **inerte** durante la salida |
| L8 | **Doble clic en `GMenu`** (medido) | Hoy un doble clic en el disparador de `GMenu` abre y cierra. Regla común propuesta para disparadores de superposiciones: el segundo clic de una ráfaga (`detail > 1`) y el Intro/Espacio con `repeat` no cambian el estado. Valorar para `GMenu`, `GSelect`, `GDatePicker`, `GHelper` (bruno) |
| L9 | Acuse en `select` | El ticket de #643 (regla 3) llega a los menús: `select` con `ticket` (`busy`, `done`, `failed`, `cancel`, `waitUntil`); acuse en el FAB (insignia + descripción + `announcePage`) y la acción `aria-disabled` mientras dura |
| L10 | Peligrosa | Confirmación en el sitio (decisión 13) con `confirm`/`confirmLabel` y `labels.cancel`; `confirm: false` solo si la aplicación ofrece deshacer. Patrón nuevo: registrar en `DECISIONS.md` |
| L11 | Se aparta | Regla de 2.4.11 para elementos flotantes persistentes: si el foco (o un campo con teclado en pantalla) queda bajo el FAB, se esconde contra su borde dejando 24px operables. Valorar si la pill de la voz lo necesita |
| L12 | Velo táctil | Solo `pointer: coarse`: velo con hueco en el FAB que se traga el toque de fuera. Sin token nuevo (`--g-surface-backdrop`); la opacidad del velo la decide coco |
| L13 | Movimiento | Usos nuevos para registrar: salida desde el FAB con escalonado ≤ 4 × 16 ms (A y B; `GMenu` M2 sigue reservado), transformación de contenedor de C (`clip-path`, `slow` + `ease-out`), el FAB que se aparta (`press` + `ease-out`). Sin muelle. Constantes neutras: `16ms`, umbral de gesto 10px (el `MOVE` de `GTooltip`), `k ≤ 5`, alcance `space × 50`, sitio para el panel `space × 40`, estrecho `space × 130` |
| L14 | Tokens | **Ninguno nuevo.** `brand`/`on-brand` (FAB), `surface`, `border`, `text`, `text-muted`, `text-subtle`, `danger`/`on-danger`/`danger-text`/`danger-soft`, `success-soft`/`success-text` (insignia «hecho»), superficie inversa `text`/`surface` (#325) en las etiquetas del arco, `shadow-1`/`shadow-2`, `radius-pill`/`lg`/`md`, `surface-backdrop`, duraciones y curvas de §29 |
| L15 | API | Ver «Propuesta de API» |
| L16 | `PENDIENTES.md` | Fila `GFab`: ronda r01 hecha, pendiente de elección; B y la búsqueda de C, reservadas si el usuario sigue la recomendación |

## Propuesta de API (para lima; convenciones de `api.md`)

| Prop | Tipo | Valores | Por defecto | Nota |
| --- | --- | --- | --- | --- |
| `items` | Array | `{ id, label, icon?, description?, group?, disabled?: Boolean\|String, danger?, confirm?: String\|false, confirmLabel? }` | `[]` | Orden = frecuencia. **Sin `maxActions`**: más de 15 avisa y se pintan todas (nada se recorta en silencio). Sin `order` (el arreglo es el orden) ni manejador por acción (Vue emite `select`) |
| `modelValue` | Boolean | | `false` | `v-model` de abierto, como `GMenu` |
| `label` | String | | — | Nombre del FAB (obligatorio salvo con una sola acción, que se nombra como ella). Sustituye a `accessibleLabel` |
| `icon` | String | nombre Lucide | `plus` | Del FAB contraído; abierto se cruza con `x` |
| `main` | String \| Number | `id` de un elemento | — | Opción C: el FAB ejecuta esa acción con su etiqueta y la cola abre el resto |
| `appearance` | String | `auto` · `panel` (· `arc` reservado) | `auto` | `auto` = política de A; `panel` = siempre panel (cuando importan las descripciones). Sustituye a `mode`; no hay `vertical` forzado (nunca más de las que caben) |
| `position` | String | `bottom-end` `bottom-start` `bottom-center` `top-end` `top-start` `top-center` | `bottom-end` | Lógicos, como `GToaster`/`GSpeechHost`. La dirección se deriva (sin `direction`) |
| `anchor` | String | `viewport` · `container` | `viewport` | `container`: absoluto en el antecesor posicionado |
| `offset` | Object | `{ top?, bottom? }` | `{}` | Como `GToaster` |
| `closeOnSelect` | String | `auto` · `never` | `auto` | Como `GMenu` (`never` para varias seguidas); `event.preventDefault()` en `select` mantiene abierta esa vez |
| `labels` | Object | `{ more, moreShort?, cancel, findHint?, matches?, matchesOne?, none? }` | `{}` | **Sin textos por defecto** (#226); `more` con `{count}` |
| `id` | String | | generado | |

Sin `showLabels` (las etiquetas siempre se ven: sin hover), sin `groupByCategory` (agrupa el panel si hay `group`), sin `direction` (derivada de `position`), sin `onOpen`/`onClose` (eventos). **Eventos:** `select` `{ id, item, event, ticket }` (orden de #573), `update:modelValue`, `open`, `closed`. **Slots** v1: ninguno (el `icon` por elemento de `GMenu`, reservado). **Datos al CSS** (#299 (7)): `data-state`, `data-appearance`, `data-position`, `data-ack`, `is-tucked`, `--_reserve`, `--_x/--_y/--_w/--_max` de las listas. **Avisos de desarrollo** (guarda de #653): `items` no arreglo, sin `label`, sin `id`, `id` duplicado, más de 15, icono fuera de la lista, peligrosa sin `confirm`, `label` ausente con más de una acción, `main` que no existe, `labels.more`/`labels.cancel` ausentes cuando hacen falta.

## Pregunta de elección (una)

**¿Qué forma quieres por defecto para `GFab`?**

- **A · La pila que crece:** hasta 5 a mano junto al botón, las frecuentes nunca se mueven, el resto agrupado tras «Más acciones (N)» (recomendada).
- **B · Arco con gesto:** cuarto de círculo con etiquetas y pulsar-deslizar-soltar para expertos; solo 3 + «Más» caben en el alcance del pulgar y en móvil se convierte en A.
- **C · Acción con cola:** el FAB es la acción principal con su nombre (un toque) y la cola abre un panel con descripciones y búsqueda al escribir.

Y, si eliges A: ¿añadimos en la misma entrega **la principal de C como opción** (`main`), y dejamos **B** y **la búsqueda al escribir** reservadas?
