# Auditoría de coco · Movimiento y apariencia de la isla de estado

**Motivo:** reporte del usuario del 2026-10-18: aparece «muy abrupta, muy tosca»; no se sabe cuándo se cierra («se queda»); un error siempre se queda y, aunque se cierre, queda «nada más el icono ahí flotando» sin que se entienda qué significa.
**Componente:** `GStatusIsland` real (playground, sección «Isla de estado», `dist/` del 2026-10-18 21:22, HEAD `7d4698f`). CSS `GStatusIsland.css` (coco), `.vue` (bruno), contrato `design/contracts/status.md` §«Movimiento (#324)», DECISIONS #299, #316, #319 y #324. **Solo lectura y medición**: no se ha tocado CSS, `.vue` ni contrato. kiwi audita el comportamiento en paralelo; aquí solo cuentan el movimiento y la apariencia.
**Método:** `node design/lab/alert/auditoria-movimiento-verificar.mjs` (puerto `GRANA_PW_PORT`, 4214). Graba cada paso del ciclo de vida **cuadro a cuadro** con `requestAnimationFrame`, `getComputedStyle`, `getAnimations()` y los sucesos `transitionrun`, `transitioncancel` y `animationstart`. Lo corre en Chromium 153, Firefox 155 y WebKit 26.6, con cuatro temas: el de defecto y el de `@grana/cli` de la auditoría (`auditoria-tema.css`: brand `#6B2FA3`, radius 4, space 3, fontSize 19), cada uno en claro y en oscuro, y con `prefers-reduced-motion` en `no-preference` y en `reduce`. Separa tres clases: **contrato** (si falla es un defecto y el script sale con código 1), **mejora** (se informa) y **dato**. Con `--film` saca cuatro tiras de cuadros reales (CDP screencast, Chromium): `movimiento-*.png`.
**Resultado:** **567/666 comprobaciones del contrato se cumplen**. Los 99 fallos se reducen a **tres defectos** (numerados F para no confundirlos con D1 a D5, la personalidad de kiwi) (F1: 42, F2: 47, F3: 9) más un caso suelto de WebKit (vaciarse terminó a los 307 ms con la máquina cargada). De las 132 comprobaciones de mejora se cumplen 20. En WebKit sin pantalla los cuadros llegan cada 40 a 100 ms, así que ahí las transiciones se confirman por sus sucesos y no por la opacidad de cada cuadro.

## Resumen

| # | Hallazgo | Clase | Dueño |
| --- | --- | --- | --- |
| F1 | **Error al pulsar «Guardar»: la isla aparece abierta de golpe**, sin fundido ni escala; la transición del nacer empieza y se cancela en el mismo cuadro | **Defecto** (incumple #324 «Nacer») | bruno |
| F2 | **La primera vez nace como una barra de todo el ancho** (1264 px) y salta a píldora; las veces siguientes nace con el tamaño de la anterior y se encoge mientras aparece | **Defecto** (incumple «Nacer» y «nada se anima al montar») | bruno (+ coco, + lima si hace falta un atributo) |
| F3 | **Vaciarse no tiene fundido en Firefox** (no admite la transición de `display`) | **Defecto** de motor (degrada) | coco lo documenta; arreglo con I4 |
| M1 | El muelle **encoge por debajo del destino** al replegar: el punto llega a 18 × 26 px (óvalo, la insignia de 24 px recortada); la compacta, a 42 de 48 px | **Mejora** | coco |
| M2 | Al replegar a punto, **la insignia cruza la isla** 192 px desde la esquina de una caja vacía | **Mejora** | coco |
| M3 | Al replegar, **el panel desaparece en el primer cuadro** y una caja oscura vacía se encoge | **Mejora** (el contrato pide fundido del contenido) | coco |
| I1 | Nacer en `--g-duration-press` + `--g-ease-out`: **el 86 % del cambio ocurre en unos 50 ms** | **Intención** (#324) | decisión: lima / usuario |
| I2 | El error nuevo **nace ya abierto** (un panel de 416 × 194 a 256 px), no crece desde la píldora | **Intención** (orden no fijado; #299 «nada supera 240 ms») | decisión: lima / usuario |
| I3 | **El punto no dice qué es**: sin pista al pasar ni al enfocar; el velo solo se ve en un anillo de 3 px | **Intención** (D2 de kiwi, #316); choca con la regla de solo icono (#433 a #436) | decisión: lima / usuario |
| I4 | Al vaciarse, **se funde una caja vacía** (hasta 416 × 256 px durante 9 cuadros): el contenido sale en el acto | **Intención** («una condición que se retira sale en el acto») | lima + bruno |
| I5 | «Se queda» y «no sé cuándo se cierra» | **Intención** (D2 de kiwi, #319: sin cierre por tiempo) | kiwi (comportamiento) |

M1, M2 y M3 son coco, dentro del contrato y sin decisión nueva. F1 y F2 son la causa principal de «abrupta, tosca». I1 e I2 explican por qué se seguiría sintiendo brusca una vez corregidos F1 y F2.

## Cifras clave (tema por defecto claro; los demás temas, igual salvo tamaños)

| Paso | Chromium | Firefox | WebKit |
| --- | --- | --- | --- |
| Tokens | `fast` 120 · `press` 160 · `slow` 240 ms | igual | igual |
| **Nacer** sin elemento en uso: opacidad por cuadro | 0 · 0 · 0,41 · 0,70 · 0,86 · 0,93 → ≥ 0,99 a los **99 a 139 ms** del primer cuadro | 0 · 0,41 · 0,69 · 0,85 → ≥ 0,99 a los 99 a 115 ms | `transitionrun` de opacidad y escala; el primer cuadro llega a los 93 ms con 0,99 |
| **Nacer con «Guardar» como elemento en uso** (apertura automática) | **opacidad 1 y escala 1 desde el primer cuadro** (`transitioncancel`) | igual | igual |
| Nacer la 1.ª vez: ancho de caja visible | **1264 px** con 0,41 y 0,70 de opacidad, después **323 px** | 1264 px con 0,41 y 0,69, después 323 px | 1264 px con opacidad plena, después 323 px |
| Nacer con tamaño previo | 297 → 149 px con el muelle; el borde se desplaza 62 px | 299 → 149 px, 62 px | 323 → 149 px, 81 px |
| **Abrir** compacta → abierta (277 × 48 → 416 × 200) | asienta (± 1 px) en **215 a 265 ms**, sobrepaso 3,9 % | 231 a 233 ms, 3,9 % | 259 a 330 ms, 2,0 a 3,1 % (cuadros espaciados) |
| Contenido al abrir | aviso: fundido + caída de 4 px en 160 ms; pie con retardo de 72 ms | igual | igual |
| **Replegar** abierta → compacta (Esc, pulsar fuera) | **191 a 203 ms**; mínimo **42 px** frente a 48 | 269 a 280 ms; 42 px | 249 a 266 ms; 42 a 44 px |
| **Replegar** abierta → punto («Entendido») | **295 a 410 ms** hasta ± 1 px; mínimo **18 × 26 px** frente a 32 × 32 | 365 a 382 ms; 15 a 18 × 21 a 26 px | 373 a 623 ms; 15 a 28 × 21 a 30 px |
| Toque | escala 0,86 → pico 1,005 → 1; la clase se retira a los 287 a 313 ms | desde 0,86 (fotograma clave; primer cuadro medido 0,88); 296 a 311 ms | fotograma clave 0,86; 307 a 431 ms |
| Vaciarse | fundido de 120 ms (9 cuadros, sin contenido) | **sin fundido** (desaparece en el acto) | fundido de 120 ms (1 o 2 cuadros medidos) |
| «Nada se mueve» (D1 de kiwi) | borde superior y centro de la isla Δ 0 en todos los cuadros | igual | igual |
| Movimiento reducido | sin cambio de tamaño, sin escala, sin toque; solo fundidos de 120 ms | igual | igual |
| `GToast` al entrar (comparación) | opacidad 0 · 0 · 0,41 · 0,70 · 0,86 y caída de 16 → 0 px | igual | igual |

El tiempo cuenta desde el suceso (`set`, `open`, la tecla o el clic). «Asienta» es el primer instante desde el que la caja queda a ± 1 px de su destino, incluido el cuadro que tarda el `ResizeObserver` en escribir `--_island-w/h`.

## Hallazgos

### F1 · Con «Guardar» en uso, el error aparece abierto de golpe (defecto, bruno)

- **Observación.** Cuando hay un elemento en uso, `GStatusIsland.vue` mide en `openRect()` el rectángulo de la isla abierta antes de pintarla (#319, regla 4). Para hacerlo pone `transition: none` en línea sobre `__shape` y fuerza el estilo **en el mismo cuadro en que la forma deja de estar `hidden`**. Ese elemento en uso es `document.activeElement`, o el último `pointerdown` en WebKit. La transición de opacidad y escala que arranca `@starting-style` se cancela (`transitioncancel`): el primer cuadro visible ya tiene opacidad 1 y escala 1, en los tres motores, los cuatro temas y también con `reduce`, que pierde su único fundido. Pasa con el foco en «Guardar» y con el clic real en «Guardar» (tira `movimiento-error-con-guardar.png`: un panel oscuro de 416 × 194 px que aparece de un cuadro al siguiente y después se estira).
- **Consecuencia.** Es el caso del reporte: se pulsa «Guardar» y un panel oscuro grande aparece de golpe arriba. Aunque el CSS del nacer existe, nunca se ve justo en el caso más frecuente.
- **Cambio propuesto (bruno).** En `openRect()`, si la forma estaba oculta antes de este suceso, no tocar `transition` ni las variables de `__shape`. El rectángulo abierto sale del ancho y alto de `__inner` con el panel visible (`__inner` no depende del tamaño animado de la forma: lee `100cqi` de la raíz) y de la posición de la raíz según `data-align`. Otra opción: medir en el cuadro siguiente al nacer.
- **Re-verificación.** Las comprobaciones del script «error con elemento en uso: nace con fundido / con la escala» y «clic real en «Guardar»…» (24 + 12 + 6 hoy en rojo) deben pasar en los tres motores.

### F2 · Nace con un tamaño que no es el suyo (defecto, bruno; coco y lima según la solución)

- **Observación.** La forma mide `calc(var(--_island-w) + 2 bordes)`. **La primera vez** que aparece una condición, `--_island-w/h` aún no existen: la isla montó vacía y el `ResizeObserver` no da tamaño de un nodo `display: none`. La declaración queda inválida, la forma toma `auto`, que es todo el ancho del visor (1264 px), y se ve así durante 2 o 3 cuadros, con 41 % y 70 % de opacidad en Chromium y Firefox y con opacidad plena en WebKit. Después **salta** a 323 px: el paso de `auto` a px no se interpola y cambia de golpe a mitad del muelle. Tira `movimiento-nacer-primera.png`. **Las veces siguientes**, `--_island-w/h` conservan el tamaño de la última condición: la isla nace con ese tamaño y se encoge o crece con el muelle mientras se funde (297 → 149 px; el borde se desplaza 58 a 81 px). Con un error que se abre solo y sin elemento en uso, pasa lo mismo con el alto: 256 → 194 px.
- **Consecuencia.** La isla aparece como una barra negra de todo el ancho que se convierte en píldora, o como una píldora de otro tamaño que se ajusta. El contrato pide solo fundido y escala desde 0,86, y que la primera escritura del tamaño vaya sin transición. El ojo lee las dos cosas como torpeza.
- **Cambio propuesto.** Que el primer cuadro visible tenga ya su tamaño y que el tamaño no transicione al nacer. Hay dos vías, ninguna de coco solo:
  1. **bruno** borra `--_island-w/h` al vaciarse la isla. **coco** da a la forma, mientras no tenga tamaño medido, `inline-size: fit-content; block-size: fit-content` (el tamaño natural de `__inner` más el borde: el mismo que escribirá bruno). Cuando llegan las variables con el mismo valor, el cambio no se ve. Para seleccionar «sin medida» hace falta un dato del `.vue`; un `data-*` nuevo en `__shape` lo registra **lima** en «Clases y datos». La alternativa sin contrato, `:not([style*="--_island-w"])`, es frágil.
  2. **bruno** escribe el tamaño medido de `__inner` de forma síncrona al pasar de 0 a 1 o más condiciones y pone, durante ese cuadro, una clase de nacer con la que coco quita el tamaño de la transición (también la registra lima).
  Coco prefiere la 1: no añade estados de tiempo y además arregla el nacer con apertura automática.
- **Re-verificación.** Las comprobaciones «nacer (1.ª vez)…», «nacer (con tamaño previo)…» y «error sin elemento en uso: nace ya con su tamaño» deben pasar. La tira `nacer-primera` debe mostrar una píldora que se funde y crece desde 0,86 sin barra.

### F3 · Vaciarse no tiene fundido en Firefox (defecto de motor, coco)

- **Observación.** El fundido de salida se apoya en `transition-behavior: allow-discrete` sobre `display`. Firefox 155 no lo admite: la forma pasa a `display: none` en el acto. Probado aparte con un elemento mínimo: Chromium y WebKit retienen `display`; Firefox no. `estilo.md` §8 decía que los tres motores lo admitían, y para `display` no es así.
- **Consecuencia.** En Firefox la isla desaparece de golpe al quitarse la última condición. Degrada sin romper nada.
- **Cambio propuesto.** coco corrige `estilo.md` §8 (pendiente: este encargo era solo de medición). El arreglo de verdad es el mismo que el de I4: un estado de salida que mantiene la forma visible durante `--g-duration-fast`.
- **Re-verificación.** «vaciarse: fundido de duration-fast» en Firefox (8 en rojo hoy).

### M1 · El muelle encoge el punto y la compacta por debajo de su tamaño (mejora, coco)

- **Observación.** `--g-ease-spring` rebasa el 3,8 % del cambio (#299), también al encoger. Al replegar de abierta (416 × 200) a punto (32 × 32), los 384 px de ancho rebasan unos 15 px: la forma baja a **18 × 26 px**, un óvalo más estrecho que la insignia de 24 px, que queda recortada por `overflow: clip`. Al replegar a compacta, el alto baja a **42 px** frente a 48 y el resumen (46 px) se recorta 6 px. Con el tema de `@grana/cli`: 15 × 21 frente a 26, y 31 frente a 36. Se ve en `movimiento-entendido-punto.png`.
- **Consecuencia.** Al cerrar, el punto «se pellizca» y se deforma justo antes de quedarse. Al crecer, el rebote se lee como vida (D4 de kiwi); al encoger por debajo del contenido, se lee como un fallo.
- **Cambio propuesto (coco, sin decisión).** Suelos en `__shape`: `min-inline-size` y `min-block-size` a `var(--_dot)` siempre, y `min-block-size: var(--_row)` fuera de `data-form="dot"`. El muelle conserva su rebote al crecer y al encoger asienta sin pasar por debajo de su forma. No es un token nuevo ni cambia la curva: son las constantes que ya existen.
- **Re-verificación.** «replegar a compacta / a punto: el muelle no pasa por debajo…» en los tres motores.

### M2 · La insignia cruza la isla al replegar a punto (mejora, coco)

- **Observación.** `__inner` va pegado al inicio de `__shape`, y la forma crece y encoge desde el centro (`margin-inline: auto`). Al pasar a punto, `__inner` mide ya 30 px en el primer cuadro mientras la forma aún mide 416. La insignia arranca en la esquina superior izquierda de una caja oscura vacía y **viaja 192 px** hasta el centro. Al abrir, el texto del resumen se desliza 72 px, de forma continua y menos visible.
- **Consecuencia.** El único contenido que queda, el icono, atraviesa la isla. Refuerza la sensación de «icono flotando».
- **Cambio propuesto (coco).** En `data-form="dot"`, alinear `__inner` como la forma: `margin-inline: auto` en `center`; en `start` y `end` ya coincide. La insignia se queda en el centro mientras la caja se cierra a su alrededor. No hace falta tocar abrir.
- **Re-verificación.** «replegar a punto: la insignia no cruza la isla» (viaje ≤ 2 px).

### M3 · Al replegar, el panel desaparece en el acto (mejora, coco)

- **Observación.** El panel queda `hidden` (`display: none`) en el primer cuadro de cualquier repliegue (Esc, pulsar fuera, «Entendido», «Ir a…»). Lo que se ve encogerse con el muelle es una caja oscura vacía con la fila del resumen o solo la insignia: tres cuadros en la tira `entendido-punto`. El contrato pide fundido para el contenido del panel y hoy solo existe a la entrada.
- **Consecuencia.** Abrir es suave (cascada) y cerrar es brusco: la asimetría se nota más que cualquiera de los dos movimientos.
- **Cambio propuesto (coco).** El panel replegado sale del flujo (`position: absolute` bajo el resumen, con el ancho de la abierta, `__inner` con `position: relative`), de modo que `__inner` mide ya la replegada y la forma empieza a encoger en el mismo cuadro. El panel se funde en `--g-duration-fast` con `display` discreto mientras la forma lo recorta. En Firefox degrada al corte de hoy. Con `reduce`, solo el fundido.
- **Re-verificación.** «replegar: el contenido del panel se funde al salir» y la tira `entendido-punto` (el texto debe verse irse, no una caja vacía).

### I1 · El nacer se consume en unos 50 ms (intención: #324; decisión de lima o del usuario)

- **Observación.** #324 fija el nacer en `--g-duration-press` (160 ms) con `--g-ease-out` (`cubic-bezier(0.23, 1, 0.32, 1)`), una curva muy cargada al principio: 0,41 → 0,70 → 0,86 de opacidad en los tres primeros cuadros. Es exactamente la entrada de `GToast`, pero el aviso es pequeño y además cae 16 px desde el borde, lo que da dirección y origen. La isla nace con la escala desde 0,86 colgada del borde y, si es un error, como un panel de 416 × ~200 px.
- **Consecuencia.** Una superficie oscura grande que llega sin que la pidas y se completa en ~50 ms se lee como un golpe, aun con F1 y F2 corregidos.
- **Propuesta (decisión).** Nacer en `--g-duration-slow` (240 ms, el techo de #71) con la misma `--g-ease-out`, o añadir al 0,86 una caída corta desde el borde (`--g-space-1 × 2`) como `GToast`. Los dos casos son una enmienda de #324: lima, y el usuario si lo considera identidad.

### I2 · El error nace ya abierto (intención; decisión)

- **Observación.** Con la apertura automática, `flushEvents` abre en el mismo ciclo en que nace la isla: la primera forma que se ve es la abierta. La continuidad que da personalidad a la isla (D4 de kiwi: la píldora que crece) no aparece justo en el suceso más importante.
- **Propuesta (decisión).** Nacer compacta (fundido + 0,86) y abrir con el muelle al terminar el nacer: 160 + 240 ms. Hay que confirmar con lima que una secuencia de dos movimientos no rompe «nada supera 240 ms» (#299). Encaja con la personalidad aprobada (D4 de kiwi) y responde a «la forma en que se abre».

### I3 · El punto no dice qué es (intención: D2 de kiwi; decisión)

- **Observación.** El punto mide 32 × 32 px (26 con el tema de `@grana/cli`), con una insignia de 24 px. Contraste: isla/página 16,46 a 17,44, icono/relleno 4,83 a 5,73, anillo/isla 15,22 a 17,44. Lleva cursor de mano, nombre accesible intacto y anillo de foco exterior. Al pasar, el velo (`surface 12 %`) solo asoma en el anillo de 3 px que la insignia deja libre. No tiene pista visual al pasar ni al enfocar: medido en los tres motores, ningún `title` ni ningún tooltip visible tras 700 ms. Grana pone una pista de solo icono en todo control de solo icono (#433 a #436: `GTabs`, `GRadioGroup`, riel de `GSidebar`, con `utils/visualTip.js`); el punto es un control de solo icono sin ella.
- **Consecuencia.** «Queda nada más el icono flotando y no sé qué significa»: sin texto, sin pista y sin una reacción visible al pasar, el punto no se distingue de un icono decorativo.
- **Propuesta (decisión; dos opciones, compatibles).** (a) La **pista del modo visual del motor del tooltip** (#433, `aria-hidden`) con el título de la primera condición, al pasar y al enfocar el punto, como en el resto de controles de solo icono. Es consistente con la regla, y lima la registra. (b) **Asomo**: al pasar o enfocar, el punto se abre a compacta con el muelle mientras dure el gesto, sin cambiar el reconocimiento, y vuelve a punto al salir. Da personalidad y reutiliza la forma (D4 de kiwi); es decisión del usuario. En los dos casos, el velo al pasar debería verse en toda la forma, no solo en el anillo (coco, mejora menor).

### I4 · Al vaciarse se funde una caja vacía (intención: «sale en el acto»; lima y bruno)

- **Observación.** Al retirarse la última condición, `v-if="first"` desmonta el resumen y la lista se vacía en el mismo parche. El fundido de `[hidden]` funde la caja oscura **sin contenido**, a su tamaño anterior: 323 × 48 desde compacta y 416 × 256 px desde abierta, 9 cuadros en Chromium (tira `movimiento-vaciarse-abierta.png`).
- **Consecuencia.** Lo último que se ve es una mancha oscura que se desvanece: queda «a medias».
- **Propuesta.** lima matiza «una condición que se retira sale en el acto»: salvo la última, que se va con la isla. bruno conserva una copia de la última condición mientras dura la salida (`--g-duration-fast`), o un estado de salida antes de `hidden`; coco la funde con su contenido. Con el estado de salida, F3 (Firefox) queda arreglado de paso.
- **Re-verificación.** «vaciarse: la píldora se funde con su contenido» y «vaciarse desde abierta: no queda una caja vacía».

### I5 · «Se queda» y «no sé cuándo se cierra» (intención: D2 de kiwi, #319; kiwi)

Es el diseño aprobado: una condición `persistent` (todo lo que no es `success`) dura hasta que la aplicación la resuelve, y reconocerla la deja en punto. No hay cierre por tiempo (WCAG 2.2.1). En la apariencia no hay nada roto, pero no hay nada que diga «esto sigue pendiente hasta que se arregle». Queda para kiwi, que audita el comportamiento en paralelo, y para el texto del playground y del README. Las propuestas I2 e I3 ayudan a que se entienda.

## Lo que cumple

- **Cambio de forma** (#324): ancho, alto y radio con `--g-ease-spring` en `--g-duration-slow`, sobrepaso 3,9 % al crecer (Chromium y Firefox; 2,0 a 3,1 % medido en WebKit por cuadros espaciados), dentro de `@supports (linear())`.
- **Toque**: `is-nudge` y `g-status-nudge` desde 0,86 con el muelle en 240 ms; pico 1,005; la clase se retira en `animationend` (287 a 313 ms tras el suceso). Con `reduce` no hay animación y la clase no se queda.
- **Contenido al abrir**: cascada de fundido + caída de 4 px en `--g-duration-press`, pie con retardo de 72 ms.
- **«Nada se mueve» (D1 de kiwi)**: el borde superior y el centro de la isla no se mueven en ningún cuadro de abrir, replegar ni nacer (Δ 0).
- **Movimiento reducido**: sin transición de tamaño, sin escala, sin toque; fundidos de `--g-duration-fast` (salvo el que cancela F1).
- **Contraste del punto** ≥ 3 en los cuatro temas; diana ≥ 24 px; cursor y nombre accesible.

## Tiras de cuadros (Chromium, tema por defecto claro, 1280 × 900)

- `movimiento-nacer-primera.png`: la barra de todo el ancho (+76 a +106 ms) que salta a píldora (F2).
- `movimiento-error-con-guardar.png`: clic real en «Guardar»; la isla aparece opaca y crece sin fundido (F1, I2). El tiempo cuenta desde antes del clic de Playwright.
- `movimiento-entendido-punto.png`: el panel se va en el acto, la insignia cruza desde la esquina y el punto se pellizca (M3, M2, M1).
- `movimiento-vaciarse-abierta.png`: una caja vacía de 416 × 256 px que se funde (I4).

## Pendientes por dueño

- **bruno:** F1 (`openRect` sin cortar el nacer) y F2 (tamaño correcto en el primer cuadro; borrar `--_island-w/h` al vaciarse). Después, el estado de salida de I4 si lima lo acepta.
- **lima:** el dato de «sin medida» de F2 si se elige la vía 1; las decisiones de I1, I2, I3 e I4 (enmiendas de #324 y de «Movimiento» o «Las tres formas»).
- **coco (siguiente ronda, con permiso para tocar CSS):** M1, M2 y M3; la parte CSS de F2 y de I4; corregir `estilo.md` §3 y §8 (Firefox sin transición de `display`; «Medido» del cambio de forma: sin el suelo, el muelle recorta).
- **kiwi:** I5 y el escalonado de I2 desde el comportamiento.
- **Usuario:** I1 (duración o caída del nacer), I2 (nacer compacta y abrir después) e I3 (pista o asomo del punto).

## No verificado

- Safari, Firefox y Chrome reales a 60 y 120 Hz. WebKit sin pantalla da cuadros cada 40 a 100 ms, así que sus cifras por cuadro son orientativas; las transiciones se confirman por sus sucesos.
- Móvil (hoja inferior): el nacer y el toque son los mismos, pero no se midió aquí la hoja de `GDialog`.
- La percepción con lector de pantalla (el movimiento no afecta a los anuncios; lo audita kiwi).
- Ninguna corrección aplicada: este encargo era solo de lectura y medición.
