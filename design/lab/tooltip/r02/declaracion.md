# Declaración — tooltip (`GTooltip`, nombre de trabajo), r02: tres conceptos

> kiwi, 2026-10-05. Prototipo: `index.html?c=0|A|B|C` sobre el motor de la base (`../engine.js`, sin cambios de comportamiento) y `concepts.js`, con `GBtn` y `GIcon` reales de `dist/` y los **tokens del tema por defecto** (`concepts.css`). La base (r01) es común a los cuatro y no se repite; cada concepto pasa la misma batería que la referencia. Cifras en «Medidas» y en la comparativa (Chromium, Firefox y WebKit dan lo mismo salvo donde se dice).

**Medida de barrido** (la misma en los cuatro): el puntero recorre los ocho iconos de la barra, 120 ms en cada uno tras abrir el primero. Se cuentan las **apariciones** (superficies que se abren), los **cambios de sitio del texto** y la **distancia del ojo** (del centro del último control al inicio de su texto).

---

## Referencia · globo convencional (`?c=0`)

Superficie inversa (`--g-color-text` de fondo, `--g-color-surface` de texto), `--g-radius-md`, `--g-shadow-2`, encima del control, sin flecha. Barrido: **8 apariciones, 6 cambios de sitio, ojo a 143px** (el globo de «Eliminar», con su descripción, se centra sobre el icono y su texto empieza lejos). Es el patrón de todos los frameworks; no se propone.

---

## A · Pestaña que viaja

**Estructura.** El tooltip es una **etiqueta** (superficie inversa, `--g-radius-md`, sombra `--g-shadow-2`) unida al control por una **pestaña** que mide **exactamente lo que mide el control** (ancho en una barra, alto en un riel) y llena el hueco hasta su borde. Nombre en peso de acción, atajo en tecla, descripción debajo. Lado por defecto: **abajo** en una barra horizontal (la etiqueta cuelga), **al final de línea** en un riel (en RTL, a la izquierda). La pestaña es además el **puente** del puntero (1.4.13).

**Comportamiento.** En un grupo hay **una sola etiqueta** (superficie compartida `aria-hidden`; el nombre de cada control sigue en su nodo `role="tooltip"`). Al pasar de un control al siguiente la etiqueta **no se apaga**: viaja (posición, ancho y pestaña juntos) y el texto cambia en el acto. Un control suelto lleva la misma forma en su propio nodo.

**Movimiento.** Aparecer: fundido `--g-duration-fast`. Viajar: `translate` + `inline-size` + la pestaña, `--g-duration-press` + `--g-ease-out` (propiedades privadas registradas `--_ax`/`--_aw` para que la pestaña viaje con la etiqueta). **Con movimiento reducido no viaja: salta** (medido: la transición queda en opacidad).

### Qué lo hace distinto (A)

La flecha centrada de un globo señala un **punto**; en una barra de iconos de 28px separados por 4px, ese punto cae entre dos controles con facilidad. La pestaña de A **mide lo que mide el control**: no hay duda de a cuál nombra, y la etiqueta se lee como **parte del control** (el nombre que le faltaba), no como una nota pegada encima. Y al recorrer una barra, en lugar de ocho globos que se encienden y apagan en ocho sitios, hay **una etiqueta que acompaña al puntero**: la vista sigue un objeto en vez de reencontrarlo cada vez. Sirve al usuario que escanea una barra que no conoce (el caso por el que existe el tooltip).

### Gana y arriesga

- **Gana:** sin ambigüedad de destino (pestaña con Δ 0px de ancho y Δ < 0,01px de borde respecto al control, tres motores); **1 aparición** en el barrido en vez de 8; **ojo a 49px** (la etiqueta empieza junto al control); sirve igual en barra, riel, fila y control suelto; colgar **debajo** deja libre lo de encima de la barra (en una cabecera fija, abajo es donde hay sitio).
- **Arriesga:** el texto **se mueve** con la etiqueta (6 cambios de sitio, como el globo, pero acompañados); la pestaña ancha sobre un control grande (`GBtn` con texto de 120px) pesa más que una flecha; tapa lo que hay **debajo** de la barra (la primera línea del contenido) mientras está abierta; una superficie compartida por grupo implica que el grupo exista (sin grupo, cada control lleva la suya, como la base).

### Medidas (A)

| Medida | Resultado |
| --- | --- |
| Pestaña frente al control | Toca su borde (Δ ≤ 0,004px) y mide su ancho (Δ 0px); en RTL (riel) Δ ≤ 1px del borde izquierdo |
| Barrido | 1 aparición, 6 cambios de sitio (acompañados), ojo 49px |
| Viaje | Sin cerrarse (0 aperturas) y la pestaña llega al nuevo control (Δ 0px) |
| Movimiento reducido | Sin `translate` ni `inline-size` en la transición |
| Contraste | 17,40:1 (nombre, descripción y atajo); atajo 12px |
| Esc, hoverable, grupo | Pasa (la superficie compartida se cierra con Esc y retiene el puntero) |

**Coste:** medio. Un visual compartido por grupo (posición, ancho medido y animado, pestaña) y la forma suelta; la semántica es la de la base. **Riesgo técnico:** los grupos deben declararse (ver pregunta 1 y L22).

---

## B · La barra habla

**Estructura.** El grupo (`role="toolbar"`) tiene **una leyenda** pegada a su borde (debajo en una barra; al final de línea en un riel), **del mismo ancho que la barra** (del alto del riel), en superficie normal con borde `--g-color-border-strong` y sombra: se lee como una extensión de la barra, no como un globo. Dentro: nombre (peso de acción) + atajo + descripción en `--g-color-text-muted`. Una **marca de acento** (`--g-color-accent`, dos bordes de alto) en el borde de la leyenda queda **justo bajo el control** activo.

**Comportamiento.** El texto **siempre está en el mismo sitio**: al pasar de un control a otro solo cambian las palabras y la marca se desliza. La leyenda **no tapa nunca la barra** y se mantiene mientras el puntero esté en la barra o en la leyenda (incluido el relleno entre botones). **Variante reservada** (`?c=B&reserved=1`): la leyenda es una línea **en el flujo** bajo la barra, siempre presente («Pasa por un botón o recórrelo con Tab» en reposo, `aria-hidden`), sin capa: **no tapa nada** y cumple 1.4.13 por construcción (no hay contenido que aparezca encima de otro).

**Movimiento.** La leyenda aparece con fundido; la marca se desliza (`--g-duration-press`, `--g-ease-out`); el texto cambia sin animación (leer no espera). Movimiento reducido: la marca salta.

### Qué lo hace distinto (B)

Es la idea de las barras de estado de los editores de escritorio, puesta junto a la barra: **la vista aprende dónde leer**. Al recorrer una barra con el puntero, el texto no persigue al puntero ni salta de sitio (**0 cambios de sitio**, medido): quien repasa una barra que usa a diario mira siempre al mismo lugar, y la descripción y el atajo tienen sitio para caber sin un globo enorme. La barra nunca queda tapada por su propio tooltip, y con la variante reservada no queda tapado **nada**: el único tooltip que no esconde la nota que se está escribiendo.

### Gana y arriesga

- **Gana:** **0 cambios de sitio** y **1 aparición** en el barrido; nunca tapa la barra (medido); la variante reservada no mueve nada (Δ 0px del contenido de debajo) ni crea capa; lugar natural para descripción y atajo.
- **Arriesga:** el **ojo viaja**: 234px desde el último icono hasta el inicio del texto (frente a 49 de A y 143 del globo); en un **riel** la leyenda es una columna del alto del riel con el texto arriba, lejos del control de abajo (es su peor caso); **no sirve suelto** (sin grupo cae en una leyenda propia bajo el control, que es un globo cuadrado); en las **filas de una tabla** la leyenda de una fila tapa las de debajo; la variante reservada **cuesta alto fijo** en la página; exige un **componente de grupo** nuevo con su API.

### Medidas (B)

| Medida | Resultado |
| --- | --- |
| Barrido | 1 aparición, **0 cambios de sitio**, ojo 234px |
| Leyenda frente a la barra | No se solapan; mismo ancho (Δ ≤ 1px) |
| Marca | Bajo el control activo (Δ 0px de inicio y de ancho) |
| Reservada | En el flujo, sin `popover`, Δ 0px del contenido al pasar |
| Contraste | Mínimo 7,46:1 (descripción en `text-muted`); atajo 12px |
| Esc, hoverable | Pasa (el relleno de la barra cuenta como «dentro») |

**Coste:** medio-alto. Un componente de grupo (`GTooltipGroup` o una prop de la barra) con su leyenda, su marca y su variante; dos comportamientos distintos según haya grupo o no. **Riesgo de producto:** dos formas de tooltip en la misma librería.

---

## C · Pista en dos tiempos

**Estructura.** Globo inverso, pero con **dos partes**: el **nombre** (peso de acción) y, debajo, una segunda parte con la **descripción** y el **atajo**, plegada al principio. Prop nueva **`detail`** (descripción aparte del nombre): un tooltip puede **nombrar y describir a la vez** (`aria-labelledby` → nombre, `aria-describedby` → detalle), ambos en el DOM desde el montaje.

**Comportamiento.** Aparece **solo el nombre**. Si el puntero se queda **quieto 700 ms** (o el foco se mantiene ese tiempo), la segunda parte **crece hacia fuera del control** (arriba si está encima: el borde cercano al control no se mueve) con la descripción y el atajo. Mover el puntero sin parar no lo hace crecer (medido). En **táctil**, la pulsación larga lo muestra **entero** y lo deja visible **el tiempo que pide su texto**: `máx(1,5 s, 1 s + 50 ms por carácter)`, hasta 6 s (medido: 3,8 s para «Marcar para revisión · Avisa al responsable del expediente»).

**Movimiento.** El nombre entra con fundido; la segunda parte crece en alto (`grid-template-rows`, `--g-duration-press`, `--g-ease-out`) y su ancho se aplica en el acto (una sola recolocación horizontal). Movimiento reducido: aparece sin crecer.

### Qué lo hace distinto (C)

Los tooltips tratan igual al que **escanea** («¿qué es este icono?», le basta una palabra) y al que **duda** («¿qué pasará si lo pulso?»). C le da a cada uno lo suyo **sin que ninguno lo pida**: el escaneo lee una palabra corta (globos pequeños que tapan poco al recorrer la barra) y quien se detiene recibe la explicación y el atajo, que es justo cuando aprender el atajo tiene sentido. El tiempo en táctil sale de la **velocidad de lectura**, no de una constante: un nombre corto se va pronto y una explicación se queda lo que tarda en leerse.

### Gana y arriesga

- **Gana:** globos **pequeños** al recorrer (solo el nombre); **ojo a 46px** (el más cercano); la descripción y el atajo aparecen cuando hay intención; nombre y descripción en un solo tooltip (`detail`); sirve igual en barra, riel, fila y suelto; el borde junto al control **no se mueve** al crecer (Δ 0px medido).
- **Arriesga:** al recorrer, sigue siendo **8 apariciones en 6 sitios** (como el globo: no resuelve el parpadeo); el crecimiento a los 700 ms puede sorprender (algo cambia sin que hagas nada); con teclado, la descripción tarda 700 ms más (el lector de pantalla la oye al instante, pero quien ve espera); `detail` es una prop más que documentar.

### Medidas (C)

| Medida | Resultado |
| --- | --- |
| Primera etapa | Solo el nombre (segunda parte con 0px de alto) |
| Tras 700 ms quieto | Crece (24px con una línea de descripción), `data-dwell` |
| Borde junto al control | Δ 0px (crece hacia fuera) |
| Puntero en movimiento | No crece |
| Táctil | Todo de una vez; visible 3,8 s para 60 caracteres |
| Barrido | 8 apariciones, 6 cambios de sitio, ojo 46px |
| Contraste | 17,40:1; atajo 12px |

**Coste:** bajo-medio. Sin superficie compartida ni componente de grupo; un temporizador de reposo en el motor y la prop `detail`.

---

## Comparativa

| | Referencia (globo) | **A · Pestaña que viaja** | **B · La barra habla** | **C · Dos tiempos** |
| --- | --- | --- | --- | --- |
| Apariciones al recorrer 8 iconos | 8 | **1** | **1** | 8 |
| Cambios de sitio del texto | 6 | 6 (acompañados) | **0** | 6 |
| Distancia del ojo al texto | 143px | 49px | 234px | **46px** |
| A qué control nombra | Flecha (punto) | **Pestaña del ancho del control** | Marca bajo el control | Cercanía |
| Tapa la barra | Encima de la barra | Debajo de la barra | **Nunca**; reservada: **nada** | Encima de la barra |
| Riel / filas / suelto | Sí / sí / sí | Sí / sí / sí | **Débil** / tapa filas / **no** | Sí / sí / sí |
| Descripción y atajo | Todo de golpe | Todo de golpe | Con sitio de sobra | **Cuando te detienes** |
| Táctil | 1,5 s | 1,5 s | 1,5 s | **Según su texto** |
| API nueva | — | Grupo implícito (ver L22) | **Componente de grupo** | Prop `detail` |
| Movimiento | Fundido | Viaje (`press` + `ease-out`) | Marca que se desliza | Crecimiento en alto |
| Coste | — | Medio | Medio-alto | Bajo-medio |

**Lectura de kiwi.** A y C **no compiten**: A resuelve la forma y el parpadeo (una etiqueta que viaja, inequívoca), C resuelve cuánto texto y cuándo (nombre primero, detalle al detenerse, táctil según lectura). **Recomendación: A como forma por defecto, con la segunda etapa de C para `detail`.** B es la mejor respuesta para una barra de editor densa que se usa a diario, pero falla en riel, en filas y suelta, y añade un segundo componente: si se quiere, como **opción de un grupo** (`legend`), no como la forma del tooltip.

## Hallazgos para lima (continúan los de r01)

| # | Decisión o hallazgo | Base |
| --- | --- | --- |
| **L22** | **Grupo.** A (y B) necesitan saber qué controles forman un grupo para compartir superficie. Opciones: (a) el grupo es el ancestro `role="toolbar"`/`tablist`/`radiogroup`/`nav` más cercano, sin componente nuevo (A no lo necesita para funcionar: sin grupo cada control lleva su etiqueta); (b) un `GTooltipGroup` explícito. Recomendación de kiwi: **(a)** para A; B exigiría (b) | Medido en el prototipo |
| **L23** | **`detail`** (C): segunda línea del tooltip, siempre `aria-describedby` → `ID-detail`; el texto principal sigue la regla `kind`. Sin `detail`, C no tiene segunda etapa | Si se elige C |
| **L24** | **Superficie inversa** (A, C): `--g-color-text` de fondo y `--g-color-surface` de texto, como la isla de estado (#325) y la pista de `GSidebar`; atajo con borde `currentColor`. **Sin tokens nuevos** | `tokens.md` §31 |
| **L25** | **Movimiento de A**: viaje con `--g-duration-press` + `--g-ease-out` (sin uso nuevo de curvas). Si el usuario lo pide, el viaje sería el **quinto uso de `--g-ease-spring`** («desplazamientos que llegan»): decisión nueva (pregunta 2) | `tokens.md` §29.1 |
| **L26** | **Propiedades privadas registradas** `--_ax`, `--_aw`, `--_ay`, `--_ah` (A) para que la pestaña viaje; precedente §29.7 de `tokens.md` | §29.7 |
| **L27** | **Tiempo en táctil por lectura** (C): `máx(LINGER, 1000 + 50 × caracteres)`, tope 6000 ms; constantes de JS | Si se elige C |
| **L28** | Las superficies compartidas son **visuales** (`aria-hidden`) y la semántica sigue en el nodo de cada control: lo verificado en r01 no cambia con A ni B | Medido: misma batería en los cuatro |

## Comprobaciones (`verificar.mjs`)

Por motor: base 42, referencia 7, A 11, B 11, C 11 (82). **246/246 en Chromium, Firefox y WebKit.** Lo común a los cuatro conceptos: nombres = texto sin atajo, descripción en el DOM desde el montaje, barrido (uno solo visible y llega al último), Esc cierra también la superficie compartida, el puntero cruza a la superficie en línea recta y sigue abierta, contraste ≥ 4.5:1 y texto ≥ 12px en nombre, descripción y atajo, sin errores en consola.

**No verificado:** lector de pantalla real con las superficies compartidas (deberían ser invisibles para él: son `aria-hidden`); táctil real; lectura con usuarios (las «distancias del ojo» son geometría, no seguimiento ocular); `forced-colors` real (la pestaña de A es un fondo: en `forced-colors` desaparece y queda el borde transparente de la etiqueta, a revisar por coco); zoom al 400 %.

## Preguntas para el usuario

1. **Forma y comportamiento por defecto:** ¿**A** (pestaña que viaja), **B** (la barra habla), **C** (dos tiempos) o la recomendación de kiwi, **A + la segunda etapa de C**? Si B te convence para editores, ¿como opción de un grupo (`legend`) además del elegido?
2. **Movimiento del viaje (si A):** ¿`--g-ease-out` sobrio (lo prototipado) o el muelle sutil de Grana, `--g-ease-spring`, como quinto uso aprobado?
3. **Táctil:** ¿la pulsación larga muestra el nombre **y se traga el clic** (r01, como los botones de solo icono de Android), o muestra el nombre **y también actúa** al soltar?
4. **Sintaxis:** además de `<GTooltip text="…"><GBtn icon>…</GBtn></GTooltip>`, ¿quieres el atajo `<GBtn icon tooltip="Duplicar">` para el caso más común, o solo el envoltorio?
