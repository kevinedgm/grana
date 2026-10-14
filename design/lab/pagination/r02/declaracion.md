# Declaración — selector de filas por página (`GPagination` + `GTable`), r02: base funcional y conceptos A, B y C

> kiwi, 2026-10-13. Brief: `brief.md`. Prototipo: `index.html` (`?c=base|A|B|C`, `?server=1`, `?h=1`, `?w=`), `pager.js`, `pager.css`. Verificación: `node design/lab/pagination/r02/verificar.mjs` (puerto 4213).
> Origen: hallazgo 6 (P1) de la integración real en NisaNabani. La activación de fila, `rowClass` y `summary` (hallazgo 14 y P2) van en la ronda paralela `design/lab/table/r03/`; aquí solo se exige convivir con una fila activable (punto 14).

**Estado:** base derivada de estándares (WAI-ARIA APG *Listbox/Select*, *Menu Button*, *Radio Group*, *Slider*; WCAG 2.2 AA 1.3.1, 2.4.3, 2.4.7, 2.4.11, 2.5.3, 2.5.7, 2.5.8, 3.2.2, 3.2.3, 4.1.2, 4.1.3) y de contratos vigentes (`pagination.md`, `table.md` #265 y #540). **La forma (A, B o C) es decisión del usuario**: pregunta al final.

## Anatomía (base)

```html
<nav class="g-pagination" aria-label="Paginación de lotes">
  <div class="g-pagination__meta">                                   <!-- nombre de trabajo -->
    <label class="g-pagination__size">Filas por página <select>…10 25 50 100…</select></label>
    <span class="g-pagination__range">11–20 de 240</span>           <!-- role="status" solo fuera de GTable (punto 7) -->
  </div>
  <div class="g-pagination__controls">‹ 1 2 3 … 24 ›</div>
</nav>
```

## Decisiones de la base

| # | Decisión | Por qué |
| --- | --- | --- |
| 1 | **API:** `pageSizes` (Array de enteros ≥ 1, sin repetir; se ordenan) y **`v-model:pageSize`** (`update:pageSize`) en `GPagination`; `GTable` los expone igual y los pasa a su paginación. **Sin `pageSizes` no hay selector** (todo lo de hoy sigue igual). Si `pageSize` no está en la lista, se añade en su orden y se avisa en desarrollo: el control nunca enseña un valor que no es el real | Compatibilidad; WCAG 4.1.2 (el valor expuesto es el estado real) |
| 2 | **La fila ancla es la primera fila a la vista**, no la primera de la página: la primera visible al menos a medias en la intersección de la ventana y del área desplazable (debajo de la cabecera pegajosa y encima del pie acoplado, si lo hay). **Página nueva = ⌊índice del ancla ÷ tamaño nuevo⌋ + 1.** Sin la tabla a la vista, o con `GPagination` sola, el ancla es la primera fila de la página. Nunca «volver a la 1» ni «conservar el número de página» | La persona sigue viendo lo que miraba (heurística de control y libertad; WCAG 2.4.3, el contexto no se pierde). Medido: con la fila 62 arriba y 100 por página, 100 → 10 lleva a la **página 7** (61–70), no a la 1 ni a la 10 |
| 3 | **Orden de eventos:** `update:pageSize` y después `update:page` (si cambia), **en el mismo ciclo**. Receta del README: en modo servidor, un único `watch([page, pageSize])` hace **una** petición | Una sola consulta al servidor por gesto (Vue agrupa los dos cambios en un vaciado) |
| 4 | **La fila ancla no se mueve en la pantalla** (Δ ≤ 1 px): al pintar (local) y al llegar las filas (servidor), la tabla busca la fila por `rowKey` y compensa el desplazamiento de la ventana o de `g-table__scroll`. Las filas que entran por arriba quedan fuera de la vista; las de abajo, debajo. El cuerpo lleva `overflow-anchor: none` para que el anclaje nativo de Chromium y Firefox no compense dos veces (WebKit no lo tiene: por eso lo hace la tabla) | Es lo que pide el hallazgo («conservar la primera fila visible»), en los tres motores por igual |
| 5 | **El control gana:** si sujetar la fila saca de la pantalla el control que tiene el foco (de 10 a 100 desde el pie), se trae el control a la vista (`block: 'nearest'`) y la fila cede | WCAG 2.4.7 y 2.4.11: el foco no puede quedar fuera de la vista tras una acción del propio control. Medido en la base, A y C. En B no hace falta: el pie está acoplado (concepto B) |
| 6 | **El foco se queda en el control** (no salta a la página actual, como hace hoy `go()` al cambiar de página): la persona puede seguir ajustando. En A, el menú se cierra y devuelve el foco al botón | APG (el control que cambia una vista conserva el foco); WCAG 2.4.3 |
| 7 | **Un solo anuncio** por gesto: el nuevo valor del control lo dice el propio lector (opción de `select`, radio o `aria-valuetext`), y la tabla dice **el rango**: «Filas 1–25 de 240». Dentro de `GTable`, el rango del pie **deja de ser `role="status"`** (la tabla ya anuncia; inyección como `g-table-announces-results`); `GPagination` sola lo conserva | WCAG 4.1.3 sin ruido. Hoy, con carga, un cambio de página se oye hasta tres veces (rango, «cargando», «N resultados») |
| 8 | **Modo servidor:** con `loading`, el esqueleto tiene **las filas que van a llegar** (`min(tamaño, total − (página − 1) × tamaño)`), no las que había (enmienda de #540 punto 2 **solo** tras un cambio de tamaño), y la ranura del ancla queda donde estaba la fila. Al llegar, la fila real ocupa esa ranura. Anuncios: «cargando» si el esqueleto se ve (#540 punto 5) y, al llegar, **el rango** en vez de `results` cuando la causa fue página o tamaño (`results` sigue para filtros y orden) | El alto salta **una vez, en el gesto** (causa → efecto), no al llegar los datos; medido Δ0 de la ranura y de la fila en los tres motores. El total no cambió: «240 resultados» no informa |
| 9 | **Selección:** las claves seleccionadas se conservan; «todo» sigue actuando sobre la **página visible** (con más filas, abarca más) | `table.md` (selección por página visible) |
| 10 | **Filtros:** cambiar filtros vuelve a la página 1 y **conserva el tamaño**; la cuenta de `GFilterBar` sigue siendo `total`. El selector vive **en el pie**, nunca en la barra de filtros ni en `toolbar` | WCAG 3.2.3 (un solo sitio, siempre el mismo); la barra de filtros es de filtros; en móvil la cabecera es escasa |
| 11 | **Móvil:** con `pointer: coarse`, todo control ≥ 44 px; la paginación compacta conserva el selector; en tarjetas valen las mismas reglas (el ancla mide las tarjetas); sin desplazamiento horizontal a 360 px (medido) | WCAG 2.5.8; `pagination.md` |
| 12 | **Mientras carga**, el selector sigue operable (como el resto de la barra, #265). Cambios rápidos emiten cada uno; la aplicación cancela la petición vieja (receta; el prototipo usa una ficha por carga) | Sin bloqueo sorpresa; la tabla ya pinta solo la última llegada |
| 13 | **Sin persistencia propia:** recordar el tamaño por tabla es de la aplicación (receta con su almacenamiento) | Los componentes no leen globals de la aplicación (`AGENTS.md`) |
| 14 | **Convivencia con la fila activable** (r03 en paralelo): el selector no captura Intro ni clic de filas; el ancla y la vuelta del foco por `rowKey` (#534) valen igual con contenido enfocable en la fila. **Si el foco está dentro de una fila** cuando cambia el tamaño (por ejemplo, desde un atajo de la aplicación), esa fila es el ancla, por delante de la primera a la vista | El foco es la señal más fuerte de «dónde estaba» |
| 15 | **Tamaños mayores que el total:** las opciones no se ocultan ni se deshabilitan (el pie no cambia de forma al filtrar); A dice «todas» en las que enseñan el total entero | WCAG 3.2.3; previsibilidad |

## A · El rango se abre

**Forma.** No hay «Filas por página» aparte. El rango es un botón en forma de píldora: «11–20 de 240 · 10 por página ⌄» (en compacta, «11–20 de 240 ⌄» y el tamaño solo en el nombre). Abre un menú (`GMenu`, `type: 'radio'`) titulado «Filas por página» con una opción por tamaño, y **cada opción dice dónde vas a caer**: «25 por página · 1–25», «50 por página · 1–50»; con 38 resultados, «50 por página · 1–38 · todas».

**Lo prometido se cumple:** el ancla con que se calcula la vista previa al abrir el menú es la que se usa al elegir, aunque la página se haya desplazado mientras tanto; el foco entra y sale del menú sin desplazar (`preventScroll`).

**Teclado.** Botón de menú APG: Intro, Espacio o ↓ abren y enfocan la opción marcada (↑ la última); ↑ ↓ Inicio Fin; **escribir la cifra** salta («5» → 50; «1», «0», «0» → 100); Intro o Espacio eligen y cierran; Esc cierra y vuelve al botón; Tab cierra.

### Qué lo hace distinto (A)

- **El tamaño vive en lo que cambia.** El rango es la consecuencia visible del tamaño; aquí es también su mando. No añade una parada de Tab: el rango pasa de texto a botón.
- **Vista previa de la consecuencia:** antes de elegir se ve la página de destino, calculada con la fila que se está mirando. Elegir deja de ser un salto a ciegas.

### Gana y arriesga

Gana: el pie más corto (cabe a 360 px en una línea con las flechas), cero paradas nuevas, decisión informada. Arriesga: **descubrimiento** (que un rango se abra no es convención; lo sostienen la píldora y el chevron), dos pulsaciones para cambiar, y un panel anclado más (reglas de #358 por `GMenu`).

### Medidas (A)

Nombre del botón empieza por el texto visible (WCAG 2.5.3, medido). Opciones `menuitemradio` con un único `aria-checked="true"`. Vista previa correcta en página 2 con la fila 15 arriba («25 por página 1–25»). Con 38 resultados, 50 y 100 dicen «1–38 · todas».

## B · Pie que acompaña

**Forma.** Las cifras a la vista, a un toque: «Filas por página [10|25|50|100]» como segmentos (radios nativos, la forma de `GRadioGroup segmented`). **El pie se acopla al borde inferior de la pantalla** (`position: sticky`) mientras la tabla siga por debajo, y vuelve a su sitio al llegar al final; acoplado lleva un filo y una sombra `shadow-1`. Al cambiar, la fila que mirabas **no se mueve y se tiñe** un momento con `primary-soft` («aquí estabas»), y las filas nuevas aparecen con un fundido corto.

**Teclado.** Grupo de radios APG: Tab entra en el marcado; ← → cambian y aplican (nativo).

### Qué lo hace distinto (B)

- **El control acompaña a la lista:** con 100 filas por página el mando no queda a 100 filas de distancia. Es el problema real de un inventario largo: hoy, para volver a 25, hay que bajar al final.
- **El sitio se conserva y se señala:** como el pie está siempre a mano, la fila ancla no tiene que ceder nunca ante el control (punto 5): **Δ0 también de 25 a 100**, y la marca dice dónde mirar tras el cambio (para quien ve; decorativa, el anuncio lleva el rango).

### Gana y arriesga

Gana: una pulsación, estado a la vista, el único concepto en que la fila no cede nunca. Arriesga: el pie acoplado **roba alto** (≈ 49 px medidos en escritorio; ≈ 60 px en táctil) y cubre las filas de abajo mientras se desplaza: exige la receta `scroll-padding-block-end` = alto del pie (como #515 para la cabecera) para que el foco nunca quede debajo (WCAG 2.4.11). En un teléfono apaisado, valorar no acoplar por debajo de un alto de ventana (L7). Es el más ancho: cuatro segmentos de 44 px en táctil (su propia línea a 360 px).

### Medidas (B)

`radiogroup` con nombre y 4 radios nativos; → cambia a 25; marca en la fila ancla; filas nuevas con `pgB-new` y las de antes sin ella; con 100 filas, pie acoplado con su borde inferior en el de la ventana (Δ ≤ 1 px) y `scroll-padding-block-end` puesto; al final de la tabla, desacoplado; con 100 filas el control está a la vista sin bajar al pie y 100 → 10 con la fila 62 arriba da la página 7 sin mover la fila. Movimiento reducido: la marca se queda quieta 1,3 s y se quita, sin fundidos.

## C · Tirar del borde

**Forma.** El borde inferior de la tabla es un agarre («⇕ 10 por página») con las cifras al lado. **Se tira hacia abajo para ver más filas** y hacia arriba para menos, con muescas cada `space × 12`; mientras se arrastra, una línea punteada `primary-text` con una ficha dice «50 por página · 1–50». Soltar aplica; Esc cancela. Las cifras de al lado aplican con un toque.

**Teclado.** Slider APG de cuatro valores (`aria-valuenow` = tamaño, `aria-valuetext` «25 por página»): → ↑ más, ← ↓ menos, Inicio, Fin. Las cifras son la alternativa de un solo puntero al arrastre (WCAG 2.5.7), fuera del árbol y del Tab (el slider ya las ofrece).

### Qué lo hace distinto (C)

- **El tamaño es el largo de la tabla:** el gesto dice lo que hace («quiero ver más abajo»). Ningún framework lo trata como una dimensión física.
- **La línea fantasma** anticipa dónde caes antes de soltar, como la vista previa de A.

### Gana y arriesga

Gana: la forma más propia y la que más dice de Grana. Arriesga: **gesto nuevo** que hay que descubrir; las teclas APG (↓ = menos) van **al revés que el gesto** (abajo = más); el arrastre vertical compite con el desplazamiento en táctil (solo el agarre lleva `touch-action: none`); un slider propio (no compone `GSlider`, que vive en su entrada); y la fila cede al control como en la base.

**Límite medido:** con el agarre pegado al borde inferior de la ventana (lo normal cuando se acaba de leer la tabla) **no queda recorrido para tirar hacia abajo**; habría que desplazar la página durante el arrastre o tirar primero de la página. Las cifras de al lado lo resuelven, pero entonces el gesto ya no es el protagonista.

### Medidas (C)

`slider` con nombre, valor y texto; Fin → 100, Inicio → 10; marcas `aria-hidden` y `tabindex="-1"`; tocar «25» aplica; arrastrar dos muescas enseña «100 por página…» y soltar aplica 100.

## Comparativa

| | Base | A · El rango se abre | B · Pie que acompaña | C · Tirar del borde |
| --- | --- | --- | --- | --- |
| Premisa | Un ajuste aparte | El tamaño es parte del rango | Las opciones, siempre a mano | El tamaño es el largo de la tabla |
| Rol | `select` nativo | botón + `menu` de `menuitemradio` (`GMenu`) | `radiogroup` de radios nativos | `slider` APG de 4 valores |
| Pulsaciones 10 → 50 | 2 | 2, viendo la página de destino | **1** | 1 (cifra) o arrastre |
| Paradas de Tab nuevas | 1 | **0** | 1 | 1 |
| Con 100 filas, el control | al final de la tabla | al final | **acoplado al borde de la pantalla** | al final |
| La fila que mirabas | Sujeta; cede si el control saldría | Igual que la base | **Sujeta siempre**, y señalada | Igual que la base |
| A 360 px | etiqueta + `select` | **el más corto** | 4 × 44 px en su línea | agarre + 4 cifras |
| Peso estimado (gzip, principal, #506) | ≈ 0,7 KB (selector + ancla) | ≈ 0,9 KB (+ `GMenu`, ya en el principal; quien importe solo `GPagination` lo arrastra) | ≈ 1,0 KB + CSS del acople | ≈ 1,4 KB (arrastre y slider propios) |
| Riesgo principal | Genérico | Descubrir que el rango se abre | Alto que roba el pie acoplado | Gesto nuevo; teclas APG al revés del gesto |

Los puntos 1 a 15 de la base (ancla, control que gana, anuncio único, esqueleto de lo que llega) **valen para los tres** y son la mayor parte del valor del hallazgo. **El acople del pie de B es independiente de la forma del control**: puede ir con el `select` de la base o con el rango de A.

## Qué lo hace distinto (de la ronda)

Ningún framework conserva **lo que estabas mirando** al cambiar de tamaño: vuelven a la página 1 o conservan el número de página. Aquí la página nueva la decide **la fila que tienes delante**, esa fila **no se mueve de la pantalla** (también mientras el servidor responde: su ranura del esqueleto queda en su sitio), y el alto salta una vez, en el gesto. Sobre eso, cada concepto cuestiona una parte de «Filas por página: [10 ▾]»: A, que sea un ajuste aparte (el rango es el mando y enseña la consecuencia); B, que esté lejos (el pie acompaña a la lista larga); C, que sea un número (es el largo de la tabla).

## Comprobaciones

`node design/lab/pagination/r02/verificar.mjs` · 2026-10-13 · puerto 4213 · **304 de 304 pasan** (pasada completa 283/283 + 21 de Firefox base, que en la pasada no llegó a abrir la página por tiempo de carga con la máquina ocupada y pasó 21/21 sola tras esperar a `domcontentloaded`).

| Motor | Base | A | B | C |
| --- | --- | --- | --- | --- |
| Chromium | 21/21 | 29/29 | 30/30 | 28/28 |
| Firefox | 21/21 | 29/29 | 30/30 | 28/28 |
| WebKit | 21/21 | 29/29 | 30/30 | 28/28 |

Cada concepto pasa las 21 comunes (página por ancla, Δ ≤ 1 px de la fila al cambiar, foco en el control, un solo anuncio, orden de eventos, control que gana o pie acoplado, servidor con esqueleto de lo que llega y ranura sujeta, anuncios de carga, filtros, móvil a 360 px con 44 px) más las suyas. Diferencias por motor: en WebKit el clic no enfoca un radio (como Safari), así que en B el foco se mide con el teclado y el clic aparte; el `select` nativo de WebKit ignora el alto mínimo, así que la base lo pinta con `appearance: none` y un `chevron-down` de Lucide (44 px medidos); en Firefox de Playwright un arrastre que sale de la ventana entrega coordenadas falsas, así que el arrastre de C se mide con el agarre a media pantalla.

**No comprobado:** lector de pantalla real (VoiceOver, NVDA, TalkBack): el anuncio del rango frente al del valor del control, el `menuitemradio` con texto secundario de A, el `slider` de C con `aria-valuetext`; táctil real (arrastre de C frente al desplazamiento, pie acoplado de B con la barra del navegador móvil); `?h=1` (altura limitada, compensación dentro de `g-table__scroll`): prototipado pero sin prueba automática; `forced-colors` real (reglas escritas, sin medir); zoom 200 % y 400 % (reflujo del pie acoplado de B); el anclaje nativo `overflow-anchor` frente a la compensación propia (en el prototipo el cuerpo se reescribe entero, así que el nativo no actúa; en Vue, con filas con clave, sí podría).

## Hallazgos para lima

| # | Tema | Propuesta |
| --- | --- | --- |
| L1 | API de `GPagination` | `pageSizes` (Array, opcional), `v-model:pageSize` (`update:pageSize`). `labels`: `pageSize` (nombre del control, **obligatorio** si hay `pageSizes`, aviso en desarrollo), `pageSizeOption` (`{size}`; texto de cada opción y `aria-valuetext` en C), `all` (A: «todas»). Valor fuera de la lista: se añade y avisa. Clases nuevas a nombrar (`__meta`, `__size`, y las del concepto) |
| L2 | API de `GTable` | `pageSizes` y `update:pageSize` con el mismo espejo que `page` (estado propio sin `v-model`). **La tabla es dueña del ancla** (puntos 2, 4, 5, 14): propuesta, `provide` interno de una función `anchorIndex()` que `GPagination` consulta al cambiar de tamaño (sin ella, primera fila de la página). Así no llegan dos `update:page` contradictorios |
| L3 | Eventos | Orden `update:pageSize` → `update:page` en el mismo ciclo; receta de una sola petición con `watch([page, pageSize])` (punto 3) |
| L4 | Enmienda de #540 punto 2 | Tras un cambio de tamaño, el esqueleto tiene las filas que **van** a llegar y la ranura del ancla se sujeta; tras un cambio de página o de filtro, sigue la regla de hoy (punto 8) |
| L5 | Enmienda de #265 | Al terminar una carga causada por página o tamaño, la región dice el **rango** (plantilla nueva en `labels`, p. ej. `pageRange` «Filas {from}–{to} de {total}») en vez de `results`; dentro de `GTable` el rango del pie no es `role="status"` (punto 7). Corrige de paso el anuncio doble de hoy al cambiar de página |
| L6 | Ancla y desplazamiento | Reglas de los puntos 2, 4 y 5 en `table.md`: primera fila visible a medias; compensación por `rowKey` en la ventana o en `g-table__scroll`; `overflow-anchor: none` en el cuerpo; el control con el foco gana |
| L7 | Si se elige B | Pie acoplado: `position: sticky` en el `nav` dentro de `GTable` (no en `GPagination` sola), clase `is-stuck` medida por bruno, **receta obligatoria** `scroll-padding-block-end` = alto del pie (como #515); ¿umbral de alto de ventana por debajo del cual no se acopla? (constante de diseño). Marca «aquí estabas»: `primary-soft`, `duration-slow × 4`, `ease-out`; filas nuevas con fundido `duration-slow` |
| L8 | Si se elige A | `GPagination` compone `GMenu` (`type: 'radio'` en un grupo; la vista previa por el slot `item` conservando el texto de la etiqueta, `menu.md`); el rango pasa a botón con `aria-haspopup="menu"`. Coste para quien importe `GPagination` suelta |
| L9 | Si se elige C | `slider` propio de valores discretos dentro de `GTable` (no compone `GSlider`, #509 entrada propia); muesca `space × 12`; registrar la asimetría tecla/gesto como límite conocido |
| L10 | Tokens | **Ninguno nuevo** en ningún concepto (`primary-soft`, `primary-text`, `primary`/`on-primary`, `surface-sunken`, `shadow-1`/`shadow-2`, `radius-pill`, `duration-*`, `ease-out`) |
| L11 | Peso (#506, margen agotado) | `GPagination` y `GTable` están en el principal: todo crece ahí. Estimaciones en la comparativa; bruno mide. Ninguno justifica una entrada propia |
| L12 | Personalidad | Registrar en `DECISIONS.md` la forma elegida y la regla de la ronda: **la fila que mirabas no se mueve** |
| L13 | Pruebas de bruno | Las de `verificar.mjs` como base de `tests/table-page-size.spec.mjs`: página por ancla, Δ0, control que gana, foco, anuncio único, esqueleto de lo que llega con ranura, filtros, móvil 44 px; más `?h=1` (área desplazable), que aquí no se midió |

## Pregunta de producto (una)

**¿Qué forma tiene el selector de filas por página?** (los puntos 1 a 15 van con cualquiera)

1. **A · El rango se abre:** «11–20 de 240 · 10 por página ⌄» es el mando y cada opción enseña dónde caes.
2. **B · Pie que acompaña:** cifras siempre a la vista, el pie acoplado al borde con tablas largas y la fila marcada tras el cambio.
3. **C · Tirar del borde:** se tira del borde de la tabla para ver más o menos filas, con cifras como alternativa.
4. **Mezcla:** el acople de B con el mando de A (o con el `select` de la base).
5. **Solo la base:** `select` nativo, sin forma propia.
