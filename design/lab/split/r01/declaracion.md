# Declaración — dos columnas (`GSplit`, nombre de trabajo), r01: ronda corta

> kiwi, 2026-10-28. Prototipo: `index.html?vista=bloques&b=po|cart|checkout|availability|booking` (`&w=1440|1024|768|390|320`, `&zoom=2`) e `index.html?vista=casos`; regla propuesta en `sp.css`; «después» sobre los **bloques reales** del banco de bruno con `sp.js` (pone el `GSplit` donde iría y mueve dentro los dos envoltorios que hoy cuelgan de `GAdaptiveLayout` o `GStack`). Tokens reales del tema por defecto (`packages/vue/dist/grana.css`). Iconos solo Lucide (`design/lab/lucide-icons.js`). Verificación: `GRANA_PW_PORT=4218 node design/lab/split/r01/verificar.mjs`, **1272/1272** en Chromium, Firefox y WebKit (§«Comprobaciones»). La base deriva de CSS Flexbox, WCAG 2.2 (1.3.2, 1.4.4, 1.4.10, 2.4.3, 2.4.7, 2.4.11) y los contratos vigentes. Primitiva sin forma visible: sin conceptos A/B/C (#362). **Preguntas de producto: ninguna abierta** (punto 24).

Nombres del prototipo → propuesta: `.sp` = `.g-split`, `.sp__region--start|--end` = `.g-split__region--start|--end`, `.sp--ratio-3-2` = `ratio="3:2"`, `.sp--collapse-lg` = `collapse="lg"`, `.sp--gap-lg` = `gap="lg"`, `.sp--density-compact` = `density="compact"`, `.sp--align-stretch` = `align="stretch"`. `.sp--lab-sticky` es un experimento, **no** se propone.

## Anatomía

```
<as>.g-split [--ratio-*] [--collapse-*] [--gap-*] [--density-*] [--align-*]   ← fila flexible que se parte; sin rol, sin contención
├─ div.g-split__region.g-split__region--start   ← slot `start` (lo que se lee primero; al inicio en línea, arriba al apilar)
└─ div.g-split__region.g-split__region--end     ← slot `end`
```

## Decisiones

**Qué es**

1. **Dos regiones, ni una más.** Lado a lado con una proporción cuando caben; una debajo de otra cuando no. No reparte n hijos (eso es `GAdaptiveLayout`), no apila n bloques (eso es `GStack`), no es un formulario (`GFormLayout` + `GFormRow`, #361).
2. **Slots con nombre `start` y `end`, con un envoltorio propio por región** (no «los dos primeros hijos»). El envoltorio es de Grana: el componente pone sus reglas de flex en **sus** `div` y nunca selecciona elementos de la aplicación (#516), y un nodo hermano de `GTooltip` (#383) o un comentario de `v-if` no cuentan como región. Los nombres son lógicos, como las propiedades: `start` es lo primero en el DOM y en la lectura.
3. **Región vacía = no se pinta.** Un slot ausente o que solo deja comentarios (`v-if` falso) no crea envoltorio; la otra región ocupa todo el ancho (K6, medido). Las dos vacías: raíz vacía, sin aviso. El slot `default` con contenido: aviso de desarrollo y se pinta como `start` (no se pierde nada; una sola forma de decirlo).
4. **Raíz por `as`**: `div` por defecto y las etiquetas no interactivas de `GStack` (`section`, `article`, `aside`, `header`, `footer`, `form`…). Aviso con una etiqueta interactiva, `main`, `ul`/`ol` (dos regiones no son elementos de lista). Las regiones son `div` sin rol: la semántica la pone el contenido (el resumen ya es un `GCard`/`section` con su encabezado).

**Cuándo se apila (la regla)**

5. **El umbral lo fija el lado estrecho.** `collapse` = el ancho mínimo que se le permite a la región estrecha: `sm` · `md` · `lg` = **`space × 64 · 80 · 96`** (256 · 320 · 384 px con `space` 4). El lado ancho tiene su parte en proporción. El conjunto cabe si `estrecho × (a + b) / min(a, b) + gap ≤ caja`. Ejemplos con `gap="lg"`: `3:2` `md` → 848 px; `2:1` `md` → 1008; `1:1` `lg` → 816.
6. **…y nunca menos que el texto:** el mínimo del lado estrecho es `max(space × k, --g-text-body-size × k/4)` (k = 64 · 80 · 96 → 16 · 20 · 24 veces el cuerpo). Con el tema por defecto las dos valen lo mismo; con el **texto al 200 %** el umbral se dobla y la pareja se apila antes (medido: Cart 01 al lado a 1440 con texto 100 %, apilado con 200 %; ninguna región de texto grande queda en 320 px). Solo tokens: sin literales de unidad nuevos.
7. **Sin consultas ni JS.** `@container`/`@media` no admiten `var()` (#34, #39). La regla es una fila flexible que se parte (`flex-wrap`): cada región tiene **de base su parte mínima** (proporcional a su peso) y **crece con su peso**; como las bases ya están en proporción, el sobrante repartido la conserva **exacta** (K1, ±1,5 px en las cinco proporciones). Si las dos bases más la separación no caben, la fila se parte. Primer pintado (SSR) = definitivo; nada parpadea.
8. **Mide su caja, no el visor.** La decisión es del ancho de la raíz: el mismo carrito en un cajón de 480 px dentro de una página de 1440 se apila (K3); un `GSplit` dentro de la región de otro decide por la suya (K4). **No** lleva `container-type` (no lo necesita: la base se resuelve contra la propia fila), así que no le aplica #562 y no aporta 0 a un padre que se ajusta.
9. **Sin suelo de contenido: decide solo la caja y el texto, nunca lo que el contenido mide en ese momento** (`min-inline-size: 0` en las regiones). Se probó con el suelo (el `min-content` de cada región como mínimo): los componentes que se miden a sí mismos (`GStepper`, `GAdaptiveLayout`, el mínimo publicado de `GFormRow`, los meses de `GCalendar`) informan el `min-content` **de su disposición actual**; con suelo, Checkout 03 que pasa por 768 (apilado, el `GStepper` en fila mide 693 px) **se queda apilado a 1440** para siempre, y Availability daba un orden no monótono (al lado a 768, apilado a 1024). Sin suelo: determinista, la misma decisión al cargar que al cambiar de tamaño (secuencia 768 → 1440 → 1024 → 1440 → 320 → 1440 medida en los cuatro bloques). El contenido se adapta a su región (1.4.10); lo de Grana ya refluye.
10. **Lo que eso cuesta (límite aceptado):** un contenido **rígido** más ancho que su región (una imagen sin `max-inline-size`, un `nowrap` largo) sobresale al lado (K9: 520 px en 325 sobresalen 207). No pasa en ninguno de los cinco casos reales (0 px en todos los anchos, igual que antes). La receta: subir `collapse` o elegir otra proporción. Una palabra larga **sí** se parte: las regiones llevan `overflow-wrap: break-word` (como la columna de `GContainer`; no reduce el mínimo intrínseco).
11. **Apilada, una región nunca desborda la caja**: cada una a todo el ancho (medido a 390 y 320 en los cuatro bloques y en las dos escalas de texto, sin desplazamiento horizontal).

**Proporción, separación, alineación**

12. **`ratio`** (lista cerrada): `1:1` · `3:2` · `2:1` · `2:3` · `1:2`. Por defecto **`3:2`** (no `2:1` como proponía #933): de los cuatro bloques, dos lo piden (Cart, Checkout) y con `2:1` el resumen del carrito se apila a 1024 dentro del contenedor por defecto (caja 942 < 1008), mientras que `3:2` lo deja a 358 px. Lima decide (S-L2).
13. **Sin `auto`** (la primera a su contenido). Con `flex` la región de contenido intrínseco, al apilar, se queda a su ancho natural y no a todo el ancho (no hay forma de decir «natural al lado, completa debajo» sin `calc-size()`, solo Chromium) y reintroduce el suelo de contenido del punto 9. Ningún caso real la necesita: Availability funciona con `2:1` (el calendario de dos meses pide 650 y `2:1` le da 651 a 1440). Reservada.
14. **`gap`** con el vocabulario de `GStack` (#719): `none` · `sm` · `md` · `lg` = 0 · 12 · 24 · 48 sobre `space × 6`, **la misma en los dos ejes** (al lado y apiladas, K7). Por defecto `md` como `GStack`; los bloques piden `lg`. Entra en el umbral.
15. **`density`** compartida (`api.md`): multiplica la separación 1 · 0,875 · 0,75 (medido `compact` = 18). No toca el umbral más que por la separación.
16. **`align`**: `start` (por defecto: el resumen no se estira con la lista) · `stretch` (alturas iguales, p. ej. dos tarjetas). Se midió también `center` (K8) pero **no se propone**: ningún caso real. Solo actúa al lado.

**Lo que no hace, a propósito**

17. **Ningún orden visual distinto del DOM**: sin `order`, `reverse` ni «la segunda primero al apilar» (1.3.2, 2.4.3). Al lado, `start` va al inicio en línea (a la derecha en RTL, K5, sin código); apilado, arriba. Orden de lectura = orden de Tab = orden visual (K10 con Tab real; en los bloques, todo lo enfocable de `start` antes que lo de `end`, sin `tabindex` positivo).
18. **Sin movimiento.** Pasar de dos columnas a una no es un suceso del usuario: no se anima (la rúbrica de movimiento no aplica; no hay transición que interrumpir ni que reducir).
19. **`sticky` reservado (BK-L1 sigue abierto).** Medido en los tres motores (K11): con la región final **más alta que el visor** y pegada, al llevar el foco a su último control («Pagar») el navegador desplaza la página y el control **sigue fuera de la vista** (top 724 en un visor de 700): falla 2.4.7/2.4.11 sin aviso. Lo que sí se aprendió para la ronda que la abra: (a) solo puede pegarse `end` —apilada es la última de la caja y no tiene recorrido, así que se anula sola sin consultas; `start` pegada taparía a `end`—; (b) necesita una salida para lo que no cabe (alto máximo con desplazamiento propio y su `tabindex`, #570, o pegarse por abajo) y la suma de la cabecera (#515, `--g-app-shell-top`). Product overview 01 es el caso más claro (panel corto junto a una galería larga).
20. **Anidado**: permitido y sin reglas propias (K4); cada uno mide su caja.

**Frontera con lo que existe**

21. **Booking summary 03 no es un caso de `GSplit`.** Es una **línea** de tres piezas (resumen, total, acción) que se parte por tamaño (#906): eso es reparto en líneas y lo hace `GAdaptiveLayout`, ya `candidate`. Verificado sin desplazamiento horizontal a 1440, 768, 390 y 320. #933 lo cita entre los cinco: corregir la lista (S-L7).

| Pieza | Del `GSplit` | De la pieza |
| --- | --- | --- |
| `GAdaptiveLayout` | Dos regiones con proporción que **pueden** llevar varios controles, una sección o una tabla | Repartir n hijos en líneas por su tamaño, con pistas (#364). Un `GSplit` hijo de `GAdaptiveLayout` es un bloque completo (varios controles) |
| `GStack` | Lo de al lado | Lo de abajo. Comparten vocabulario (`gap`, `density`) |
| `GFormLayout` + `GFormRow` | Nada: un formulario no se reparte con `GSplit` | Filas de campos (#171, #361). Un `GSplit` puede llevar un formulario entero en una región (Checkout 03) |
| `GContainer` | Va dentro de la columna | El ancho y el margen de página |
| `GCardGroup` | — | Tarjetas que filtran |
| `GAppShell` / `GSidebar` | Nada | La navegación lateral de la página es del chasis, no una región de `GSplit` |

**Accesibilidad, densidad, peso**

22. **Accesibilidad**: sin roles, `aria-*` ni foco propio; nada se oculta ni se mueve; el reflujo es CSS (1.4.10 medido a 320 y con texto al 200 %, 1.4.4); el foco nunca queda tapado porque nada se superpone (sin `sticky`).
23. **Peso estimado** (en el principal, con la excepción de #550 como `GText` y las primitivas de #723: pura, sin estado, vocabulario de los bloques): `.vue` con `as`, cinco props validadas, dos envoltorios, detección de slot vacío y tres avisos con su guarda (#653) ≈ **400–550 B gzip** de `grana.js`; CSS ≈ 300–400 B en `grana.css`, fuera de la compuerta. Propuesta: **compuerta ≤ 640 B gzip**, propia (no suma a la de pila + sección, #746, ni a la de `GContainer`); si la supera, primero se recortan los avisos; si sigue, `@grana/vue/layout` (vuelve a lima).
24. **Preguntas de producto: ninguna.** El usuario ya eligió la primitiva; lo demás deriva de estándares (orden del DOM, 2.4.11) o de medidas. Lo único con sabor de producto —que en el teléfono el resumen del carrito y el pedido del pago queden **al final**, por el orden del DOM— no es de `GSplit`: Cart 02 «Resumen al pie» y Checkout 01/02 ya cubren esa forma, y reordenar visualmente lo prohíbe 1.3.2.

## Qué lo hace distinto

Las rejillas de los frameworks deciden las columnas por el **visor** (`col-md-8` / `col-md-4`): el mismo carrito metido en un cajón de 480 px de una pantalla grande sale con dos columnas aplastadas, y un lector con el texto al 200 % recibe un resumen de 300 px con tres palabras por línea. `GSplit` cambia la pregunta:

- **El umbral lo dice el lado estrecho**, en palabras del diseño: «el resumen no baja de 320» (`collapse="md"`), no «a partir de 992 px». El número de corte sale solo de la proporción, de la separación y de la densidad del tema.
- **Crece con el texto.** El mínimo del lado estrecho se mide también en cuerpos de texto: quien lee con el texto al 200 % recibe una sola columna legible sin que nadie escriba una consulta (medido en Cart, Checkout, Product overview y Availability).
- **Mide su sitio**: en un cajón, en un diálogo, anidado o junto a una barra lateral, decide por su caja.
- **Determinista**: decide solo con la caja y el texto, nunca con lo que el contenido mide en ese instante, así que no se queda atascado tras un giro de la tablet o un cambio de ventana (el defecto se midió en la alternativa y se descartó).
- **La proporción es exacta y el lado estrecho nunca baja de su mínimo**, todo en CSS, primer pintado definitivo.

Sirve al usuario final porque el panel de compra o el resumen con el total **nunca se aplastan** —la razón de EC-L7— y porque el lector con texto grande no tiene que pelear con dos columnas estrechas.

## Uso propuesto en los bloques (medido)

| Bloque | `GSplit` | 1440 (caja 1024) | 1024 (942) | 768 (707) | 390 · 320 | Texto 200 % |
| --- | --- | --- | --- | --- | --- | --- |
| Product overview 01 | `ratio="1:1" collapse="lg" gap="lg"`: galería · panel | Al lado 488 · 488 | Al lado 447 · 447 | Apilado | Apilado | Apilado |
| Cart 01 | `ratio="3:2" gap="lg"`: líneas · resumen | 586 · 390 | 536 · 358 | Apilado | Apilado | Apilado |
| Checkout 03 | `ratio="3:2" gap="lg"`: pasos y formulario · pedido | 586 · 390 | 536 · 358 | Apilado | Apilado | Apilado |
| Availability 03 | `ratio="2:1" gap="lg"`: calendario · tarjeta | 651 · 325 | Apilado | Apilado | Apilado | Apilado |
| Booking summary 03 | — (sigue con `GAdaptiveLayout`, punto 21) | | | | | |

Product overview a 768 con `collapse="md"` quedaría al lado a 329 · 329; con `lg` se apila, que es lo que se ve en las tiendas de referencia y deja el panel a todo el ancho de la tablet. Availability con `2:1` es monótono (con `1:1` y suelo de contenido daba al lado a 768 y apilado a 1024).

## Hallazgos para lima

| # | Tema | Hallazgo | Propuesta |
| --- | --- | --- | --- |
| S-L1 | Nombre | `GSplit` / `g-split` sirve. «split» ya es una prop de `GDatePicker` (#563): otro sentido, sin choque de nombres de clase | Mantener |
| S-L2 | API | `as`, `ratio` (`1:1` `3:2` `2:1` `2:3` `1:2`, defecto **`3:2`**), `collapse` (`sm` `md` `lg`, defecto `md`), `gap` (`none` `sm` `md` `lg`, defecto `md`), `density`, `align` (`start` `stretch`, defecto `start`); slots `start` y `end`. Sin `auto`, `center`, `order`, `reverse` ni `sticky` | Contrato con esto; `collapse` documentado como «mínimo del lado estrecho», no como punto de corte |
| S-L3 | Tokens | **Ningún token nuevo.** Constantes de diseño: `space × 64 · 80 · 96`, `--g-text-body-size × 16 · 20 · 24`, base de separación `space × 6` y factores de `GStack` (#717). Sin literales de unidad nuevos. `min()` de números sin unidad dentro de `calc()` (los tres motores) | Registrar en `tokens.md` como constantes, junto a §49 |
| S-L4 | Regla | Sin suelo de contenido (`min-inline-size: 0`) y `overflow-wrap: break-word` en las regiones, `box-sizing: border-box` (la base incluye cualquier relleno). Límite del punto 10 | Escribir el porqué (histéresis medida) para que no se «arregle» poniendo el suelo; receta en el README: contenido rígido → sube `collapse` |
| S-L5 | `sticky` | Reservado con la medida de K11 y las condiciones del punto 19. BK-L1 sigue abierto | Anotar en `_comun.md` §37 que `GSplit` no lo resuelve aún |
| S-L6 | Bloques | Tabla «Uso propuesto». Cierra PO-L1, CR-L1 y el «al lado» de Checkout 03; **enmienda #892/#899**: Availability 03 puede tener sus dos columnas | Encargos a bruno por bloque; Product overview, Cart y Checkout pueden salir de `draft` cuando lo midan coco y bruno |
| S-L7 | #933 | Booking summary 03 no es un caso (punto 21); Product grid 02 tampoco lo necesita (#942) | Corregir la lista de #933 |
| S-L8 | Avisos | (1) `as` interactiva, `main`, `ul`/`ol`; (2) valor fuera de lista; (3) contenido en `default`. **No** propongo un aviso que mida si una región desborda (metería medición en una pieza pura) | Tres avisos con la guarda de #653 |
| S-L9 | Peso | Punto 23: compuerta propia ≤ 640 B gzip en el principal | Lima valora frente a #506/#550 |
| S-L10 | Complejidad | Ni compone componentes ni tiene teclado, posición ni motor; su frontera con `GAdaptiveLayout` es conceptual, no de código | **No complejo**: coco y bruno en Sonnet |
| S-L11 | Otros (no de `GSplit`) | (a) A 320 con texto al 200 %, el calendario de Availability sobresale 15 px de su caja **antes y después** (mínimo de `GCalendar` 320 > 288): para coco. (b) Los componentes que se miden a sí mismos informan el `min-content` de su disposición actual (punto 9): a tener en cuenta en cualquier pieza futura que use el contenido como suelo | Anotar en `PENDIENTES.md` |

## Comprobaciones

`GRANA_PW_PORT=4218 node design/lab/split/r01/verificar.mjs` · 2026-10-28 · **1272 de 1272 pasan.**

| Motor | Casos (K1–K11) | Bloques |
| --- | --- | --- |
| Chromium | 29/29 | 395/395 |
| Firefox | 29/29 | 395/395 |
| WebKit | 29/29 | 395/395 |

**Bloques**, por bloque (4), ancho (5) y escala de texto (2): antes apilado (EC-L7 reproducido), después al lado o apilado según el umbral calculado, proporción exacta y lado estrecho ≥ `collapse` cuando va al lado, separación exacta en los dos ejes, sin desplazamiento horizontal, nada sobresale de su región más que antes, orden del DOM = lectura y Tab, consola limpia; más la secuencia de cambios de tamaño sin histéresis (6 pasos × 4) y Booking summary 03 (4 anchos). **Casos**: K1 cinco proporciones exactas; K2 umbral exacto (983 apila, 984 al lado, estrecho = 320); K3 cajón de 480; K4 anidado; K5 RTL; K6 una región; K7 separaciones 0/12/24/48/18 al lado y 48 apilado; K8 `start`/`center`/`stretch`; K9 palabra larga partida; K10 Tab real 1 → 2 → 3 al lado y apilado (en WebKit, que no enfoca botones con Tab sin la preferencia del sistema, se comprueba el orden del DOM); K11 experimento de `sticky` medido (no es criterio).

**No verificado:** lector de pantalla real (no hay nada que anunciar, pero no se escuchó); zoom real del navegador (el 200 % es el del texto, `font-size` de la raíz, y el de página se cubre con los anchos de 768 a 320); temas del CLI distintos del por defecto (el umbral depende de `space` y del cuerpo: con `space` 5 o cuerpo de 17 px cambia, la regla no); `forced-colors` (no pinta nada); un re-render de Vue dentro del laboratorio (`sp.js` mueve nodos ya montados: sirve para medir y recorrer, no para interactuar con los bloques); SSR real.

## Cumplimientos / Correcciones / Pendientes

**Cumplimientos.** Revisado lo que se solapa (`GAdaptiveLayout`, `GStack`, `GFormLayout`, `GContainer`) antes de proponer: `GSplit` hace solo lo que ninguno hace. Los cinco casos de #933 reproducidos con los bloques reales; cuatro resueltos y uno descartado con medida. Solo tokens, sin literales de tema, sin consultas ni JS, sin movimiento, sin reordenar. «Qué lo hace distinto» justificado por el usuario final. Tres motores.

**Correcciones** (sobre la propuesta de partida de #933). Defecto de `ratio` `3:2` y no `2:1` (punto 12). `collapse` definido como mínimo del lado estrecho que además sigue al texto (puntos 5 y 6). Sin suelo de contenido (punto 9, medido). Sin `container-type` ni `cqi` (no hacen falta, punto 8). Sin `center` ni `auto` (puntos 13 y 16). Booking summary 03 fuera de la lista (punto 21).

**Pendientes.** Lima: contrato desde S-L1 a S-L11. Coco: `GSplit.css` (Sonnet) y, de paso, S-L11 (a). Bruno: `GSplit.vue` con la detección de slot vacío, pruebas, `meta.json`, registro, compuerta de peso y la adopción en los cuatro bloques. `sticky` (BK-L1) queda para su propia ronda.
