# Declaración · Personalidad · r01 (transversal)

> kiwi, 2026-10-03. Prototipo: `index.html` (componentes reales de `dist/` + capa `@layer grana.personalidad`). Verificación: `node design/lab/personalidad/r01/verificar.mjs` → **Chromium 114/114, Firefox 109/109, WebKit 109/109** (`ENGINES=chromium,firefox,webkit`; Firefox y WebKit no tienen las cinco comprobaciones que usan CDP o táctil). Brief: `brief.md`.

**Criterio de la ronda.** Una idea entra si sirve al usuario en al menos una de estas cosas: **estado** (entender qué pasó), **continuidad espacial** (de dónde viene, adónde va), **respuesta** (el sistema me oyó), **jerarquía** (qué importa) o **deleite breve** (≤ 240ms, una vez). Y si cumple las reglas: solo `transform`, `opacity`, colores o pintura en la animación; tokens; movimiento reducido con el patrón de §2.3; nada al montar; lo frecuente se anima menos (un menú se abre cien veces al día: su movimiento es corto o no es).

## 0. Solapes revisados antes de proponer

| Existe | Relación con esta ronda |
| --- | --- |
| Planes 001–014 (todos `DONE`) | Base sobre la que se propone: pulsación de `GBtn`, salida de `GDialog` y `GMenu`, origen del menú desde el disparador, movimiento reducido transversal, no animar al montar. Nada se repite |
| Marca única de `GTabs` (`g-tabs__mark`, transiciones de `translate` y ancho) | T1 la reutiliza: cambia **cómo** viaja, no añade elementos |
| `GWidgetGrid` (FLIP), `GFormReveal` (`grid-template-rows`), submenú de `GSidebar` (#71) | Técnicas ya aprobadas que C3 reutiliza; no se inventa otra |
| Deslizar para cerrar de `GToast` (#145) | Precedente de gesto (umbral, solo táctil, botón cerrar siempre) para D3 |
| #298 (`GAvatar`) | Precedente de decisión de personalidad y de constantes de coreografía neutras |
| `GHelper`, `GSelect`, `GDatePicker` (popovers) | Comparten el lenguaje de §2 pero quedan fuera de esta ronda |

## 1. Resumen de la recomendación (primera tanda)

| Componente | Primera tanda | Coste | Prototipo ((P) en las tablas) |
| --- | --- | --- | --- |
| `GBtn` | **B1** rebote al soltar · **B2** la etiqueta cede el sitio | Solo CSS + 1 token de curva | Sí, los dos |
| `GDialog` | **D2** crece hacia abajo (#281) · **D1** viene de donde lo llamaste (pregunta 2) | Estructura pequeña (bruno) + CSS | Sí, los dos |
| `GTabs` | **T1** la marca se estira · **T2** el contenido llega de su lado | Un atributo de dirección (bruno) + CSS + 1 token | Sí, los dos |
| `GCard` | **C2** la selección nace de la casilla · **C1** la luz sigue al puntero | C2 solo CSS; C1 un escucha de puntero (bruno) | C1 |
| `GInput` | **I1** el mensaje sale del campo · **I2** un solo aviso al enviar (pregunta 3) | I1 CSS + `is-ready`; I2 señal de `GForm` (bruno) | Sí, los dos |
| `GMenu` | **M1** una sola luz que viaja · **M4** submenú con intención | Estructura (bruno) + CSS | M1 (y M2, que no entra) |

## 2. Transversal: el lenguaje de movimiento de Grana

### 2.1 Curvas (tokens nuevos; valores de coco, nombres para lima)

| Token | Valor propuesto | Uso | Por qué |
| --- | --- | --- | --- |
| `--g-ease-spring` | `linear(0, 0.081, 0.258, 0.46, 0.644, 0.793, 0.901, 0.972, 1.013, 1.033, 1.038, 1.036, 1.029, 1.021, 1.014, 1.008, 1.004, 1.001, 1, 0.999, 1)` | **Desplazamientos** que «llegan»: el borde de atrás de la marca de pestañas, piezas que se asientan | Muelle amortiguado (ζ ≈ 0,72): rebasa **3,8 %** y asienta antes del **70 %** del tiempo. Da masa sin parecer de juguete |
| `--g-ease-bounce` | `linear(0, 0.124, 0.401, 0.708, 0.963, 1.127, 1.199, 1.197, 1.151, 1.088, 1.029, 0.987, 0.964, 0.958, 0.964, 0.976, 0.989, 0.999, 1.006, 1.008, 1.008, 1.006, 1)` | **Solo escalas pequeñas**: soltar una pulsación, un icono que aparece | ζ ≈ 0,45: rebasa **20 %**, pero de un cambio del 3 % (`--g-press-scale`): **1,006** medido. Nunca en desplazamientos (en 200px serían 40px) |

Ambas se generaron de la solución analítica del muelle (21 y 23 muestras) y se usan con `--g-duration-slow`: **el máximo de 240ms (#71) no cambia** y no hace falta ningún token de duración nuevo. `linear()` tiene soporte en los tres motores actuales; en uno sin soporte, la declaración entera de `transition` se descarta y queda la del componente (coco: declarar primero la vigente).

Inspiración: los muelles de Apple (SwiftUI `.spring`, «bounce» bajo) y el «expressive motion» de Material 3; no se copian valores.

### 2.2 Duraciones por jerarquía (sin tokens nuevos)

| Nivel | Token | Qué |
| --- | --- | --- |
| Color y fundidos | `--g-duration-fast` (120ms) | Hover, selección, opacidad de piezas pequeñas, salidas |
| Respuesta | `--g-duration-press` (160ms) | Pulsar, entrar un popover, borde de delante de la marca |
| Bloques y asentamiento | `--g-duration-slow` (240ms) | Paneles, alturas, muelles, el vaivén de error |
| Escalonado | `--g-duration-fast / 8` (15ms, constante de coreografía) | Cascadas, con tope en el sexto elemento (≤ 75ms extra) |

Reglas: la salida es más corta que la entrada (#152); lo frecuente usa el nivel más bajo posible; nada supera 240ms.

### 2.3 Movimiento reducido compartido (amplía el plan 007)

| Con `prefers-reduced-motion: reduce` | Se queda | Se va |
| --- | --- | --- |
| Colores, bordes, opacidad | Sí (fundido `fast`, `linear`) | — |
| Desplazamiento, escala, rebote, vaivén, cascada | — | Sí: el estado final aparece en su sitio |
| Información que daba el movimiento (dirección, origen) | No es esencial: el texto, el foco y la marca ya la dan | — |
| Halo que sigue al puntero | — | Sí (se mueve con el usuario, pero es movimiento continuo) |

Además: **nada al montar** (`is-ready`, plan 012); efectos de puntero solo con `@media (hover: hover)`; sin `pointer: coarse` no hay halos.

### 2.4 Contrato bruno ↔ coco que se repite

Varias ideas necesitan que el `.vue` escriba **un dato** y el CSS haga el resto (patrón de `--_mark-*` en `GTabs`): `data-direction` (`forward`/`back`, orden lógico), un vector `--_origin-x/y` en px, la posición `--_pointer-x/y`, la caja del elemento activo `--_active-y/h`. Para lima: nombrarlos en la sección «Clases (contrato entre bruno y coco)» de cada contrato.

## 3. `GBtn`

| # | Idea | Qué aporta al usuario | Inspiración | Coste | Riesgo | Medida | Prioridad |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **B1** (P) | **Rebote al soltar**: aprieta en `fast` con `ease-out` y suelta en `slow` con `--g-ease-bounce` (ida y vuelta con listas completas, sin el defecto del plan 004) | Respuesta táctil: el clic «se siente» aunque la acción tarde; la vuelta con masa distingue el botón de Grana de un cambio de color | Haptics visuales de iOS; Emil Kowalski (pulsar rápido, soltar más lento) | Solo CSS + `--g-ease-bounce` | Ninguno de accesibilidad (con `reduce` no hay escala, como hoy). Rendimiento: `transform` | Pulsado 0,970; tras soltar, pico **1,0060**, asentado en 1 a los **131ms**; hoy, máx 1,0000; con `reduce`, escala 1 siempre (3 motores) | **Alta** |
| **B2** (P) | **La etiqueta cede el sitio**: al entrar en `loading` la etiqueta se desvanece y sube `space × 1`; el indicador entra desde abajo; al salir, a la inversa. Con `opacity`, no `visibility` | Continuidad: el mismo botón pasa a «esperando» sin parpadeo; **y corrige un defecto**: hoy el nombre accesible en carga queda **vacío** (ver §11) | Botones de envío de Linear y Vercel | Solo CSS | Con `reduce`, solo fundido. Ancho intacto | 5 cuadros intermedios en etiqueta e indicador; ancho 128,67 → 128,67; etiqueta a −4px; nombre AX en carga: hoy «», propuesta «Enviar informe» (Chromium) | **Alta** |
| B3 | Relleno que nace del punto de pulsación (`clip-path` circular desde las coordenadas del puntero, en `::before`; desde el centro con teclado) | Localiza la respuesta en botones grandes y táctiles | Material (ondas), pero un solo relleno, no ondas | Estructura (coordenadas, bruno) + CSS | Muy visto: resta identidad en vez de sumarla. Pintura en cada pulsación | Radio intermedio; origen = puntero ±1px | Baja |
| B4 | Confirmación breve tras la carga: el botón muestra `check` (Lucide) ~1s y vuelve | Cierra el ciclo de una acción asíncrona sin un aviso aparte | Botones «Copiado» | Contrato + prop nueva (lima), región viva ya existente | Texto de la confirmación lo pone la aplicación; no debe robar el foco | Anuncio por `role="status"`; Δ ancho 0 | Media (ronda propia) |

## 4. `GDialog`

| # | Idea | Qué aporta | Inspiración | Coste | Riesgo | Medida | Prioridad |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **D1** (P) | **Viene de donde lo llamaste**: parte desplazado un cuarto del vector centro → disparador (tope `space × 8`) y, al cerrar, sale hacia él. Solo `placement="center"`; hoja lateral y móvil conservan su borde | Continuidad espacial y **anticipa la vuelta del foco** (WCAG 2.4.3: el foco regresa al disparador y el movimiento lo señala). En una tabla con «Editar» por fila, se ve qué fila lo abrió | macOS (hojas que salen de su ventana), Emil Kowalski (origen desde el disparador; él exceptúa los modales, de ahí el tope) | Estructura pequeña (bruno escribe el vector al abrir) + CSS | Si el disparador desaparece al cerrar, se sale hacia el centro (vector 0). Con `reduce`, solo fundido | Primer cuadro visible desplazado con el signo del vector (12,1/0,1 y 9,6/−9,6 px); tope ≤ 32px; termina centrado (cx 640,0); al cerrar, Δx 19–30px hacia el disparador (Chromium; Firefox y WebKit cierran al instante, #152); foco de vuelta en los tres | **Alta** si el usuario la quiere (pregunta 2) |
| **D2** (P) | **Crece hacia abajo** (#281): al abrir se fija el borde superior medido centrado; desde ahí solo crece hacia abajo y, al no caber, desplaza su cuerpo | Lo que estás mirando no se mueve cuando aparece un error o un bloque | Principio «sin saltos» de form r01 §11 (ya aprobado) | Estructura (bruno fija el borde al abrir) + CSS | Ninguno nuevo; la colocación inicial sigue centrada (no requiere preguntar, #281) | Bloque de 240px: hoy el botón sube **126px**; propuesta **Δ 0,00px** en borde y botón; cabe en el visor | **Alta** |
| D3 | Hoja móvil que se arrastra hacia abajo para cerrar (umbral un tercio de la altura o velocidad, como #145) | Gesto esperado en móvil; cerrar con el pulgar | Apple HIG (hojas) | Estructura (bruno, gestos) + CSS | WCAG 2.5.7: el botón cerrar sigue siendo la alternativa de un puntero; no en `alertdialog` | Umbral, vuelta con `--g-ease-spring` si no llega | Media |
| D4 | «Aquí hay que decidir»: con `closeOnBackdrop=false` o `alertdialog`, un clic en el fondo da un pulso de escala (1 → 1,01 → 1, `--g-ease-bounce`) en vez de no hacer nada | Respuesta a un clic que hoy parece ignorado | macOS (alertas modales) | CSS + una clase de bruno | Con `reduce`, sin pulso (el diálogo sigue ahí) | Pico ≤ 1,012; ninguna salida | Media |

## 5. `GTabs`

| # | Idea | Qué aporta | Inspiración | Coste | Riesgo | Medida | Prioridad |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **T1** (P) | **La marca se estira**: dos bordes con su propio tiempo (propiedades registradas `<length>`). El borde que avanza llega primero (`press`, `ease-out`); el de atrás lo alcanza con `--g-ease-spring` (`slow`) | La dirección del cambio se lee de un vistazo y el ojo sigue a la marca en saltos largos | Material 3 Expressive, indicadores de iOS | `data-direction` (bruno) + CSS + `--g-ease-spring` | Anima ancho, **como hoy** (aceptado, `tabs/estilo.md`): LayoutCount 16 frente a 11 en 380ms (Chromium); para coco: en `underline` puede ir con `scale` | Exceso de ancho en el trayecto **95px** (adelante) y **95,6px** (atrás); borde de delante a 186ms, de atrás a 269ms; termina exacto bajo la pestaña; con `reduce`, salta | **Alta** |
| **T2** (P) | **El contenido llega de su lado**: el panel entra `space × 4` desde el lado hacia el que viajó la marca (espejado en RTL), en vez de subir | Modelo espacial coherente: las pestañas son una fila y su contenido también | Material «shared axis X» | Mismo `data-direction` + CSS | Desborde horizontal: `overflow-x: clip` con margen del foco en `__panels` (en un motor sin `overflow-clip-margin`, el anillo de un hijo pegado al borde se recorta durante 240ms) | x = +16 adelante, −16 atrás, −16 en RTL adelante; 375px sin desborde; con `reduce`, solo fundido | **Alta** |
| T3 | Luz de hover compartida: un único fondo de hover que viaja entre pestañas (como M1) | Barras densas: se ve el objetivo sin estela | Vercel | Estructura + CSS | Dos resaltados (hover y marca) pueden confundirse en `pill` | Una sola capa; Δ0 con la marca | Baja |
| T4 | Contador que rueda: el número cambia desplazando sus cifras | Darse cuenta de que algo cambió sin un aviso | Linear, Apple | Estructura (cifras por separado) + CSS | El lector debe oír el número entero (`countLabel` ya lo da) | Una sola transición por cambio | Baja (transversal con `GBadge` e I4) |

## 6. `GCard`

| # | Idea | Qué aporta | Inspiración | Coste | Riesgo | Medida | Prioridad |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **C1** (P) | **La luz sigue al puntero**: sobre el velo uniforme de hover (que sigue siendo la señal), un halo del mismo `--g-card-hover` concentrado donde está el puntero (`radial-gradient` en `::before`, color registrado para fundirse). La tarjeta no se mueve | Distingue al tacto visual una tarjeta interactiva de una estática y la vuelve «viva» sin moverla; identidad reconocible | Tarjetas de Vercel y Linear | Escucha `pointermove` + rAF (bruno) + CSS | Solo `hover: hover` y sin `reduce`. Pintura, no layout. Con el `--g-card-hover` por defecto (3 % de negro) el halo es muy sutil: coco decide la concentración (`color-mix` del mismo token, sin token nuevo) | Halo en x = 40px del puntero; caja Δ0 y `transform: none` (#127); velo uniforme conservado; táctil y `reduce`: sin halo | **Media-alta** |
| **C2** | **La selección nace de la casilla**: el tinte de seleccionada se expande en círculo desde la casilla (`radial-gradient` con radio registrado) y se recoge hacia ella al desmarcar | Causa y efecto: lo que marcaste y lo que cambió quedan unidos; en una rejilla se ve qué tarjeta acabas de elegir | Selección de fotos de iOS | Solo CSS (sobre la propiedad registrada del plan 008) | Con `reduce`, fundido como hoy. Pintura | Radio intermedio; origen en la casilla ±2px; anillo y ✓ siguen fundiéndose (plan 008) | **Alta** |
| C3 | «Mostrar más» que se despliega con `grid-template-rows` (técnica de `GFormReveal`, #275) en vez de aparecer de golpe (oportunidad anotada en `plans/README.md`) | Continuidad: el texto nuevo crece desde donde estaba | Propio (coherencia con `GFormReveal`) | CSS (+ `inert` si hace falta, bruno) | Altura = layout, una vez por clic, como `GFormReveal` | Altura intermedia; el botón no salta | Media |
| C4 | La media «respira» en hover (`scale` 1,03 de la imagen dentro de su recorte) | Deleite breve | Tiendas y portadas | Solo CSS | Roza #127 (la tarjeta no se mueve, su imagen sí): se descarta salvo que el usuario la pida | — | Baja (descartada) |
| — | Inclinación 3D con el puntero | — | — | — | **Descartada**: contradice #127 y es un riesgo vestibular | — | — |

## 7. `GInput`

| # | Idea | Qué aporta | Inspiración | Coste | Riesgo | Medida | Prioridad |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **I1** (P) | **El mensaje sale del campo**: error, advertencia o válido entran con fundido y bajan `space × 1` desde la caja (animación al pasar de `:empty` a con texto; cambiar el texto no la repite) | El ojo va del campo a su mensaje; el error no «aparece» lejos | Propio | CSS + guardia `is-ready` (bruno) para no animar un error que ya viene al montar | Con `reduce`, solo fundido. El hueco aparece en un cuadro (como hoy) | 5 cuadros intermedios; −4px → 0; hoy, 0 intermedios; con `reduce`, sin desplazamiento | **Alta** |
| **I2** (P) | **Un solo aviso al enviar**: los campos que siguen inválidos tras un envío hacen un vaivén corto y decreciente (amplitud ≤ `space × 1`, `slow`). Nunca al escribir, al salir del campo ni al montar. Se mueve la fila para que el anillo de foco vaya con ella | Señala **cuáles** fallaron, también los que quedan fuera del foco; es el «no» de un formulario | macOS (contraseña incorrecta) | `GForm` (bruno) pone la clase solo en el envío + CSS | Con `reduce` no existe (el error ya es borde + icono + texto). Puede leerse como reproche: pregunta 3 | Máx **3,47px**, 3 cambios de sentido, vuelve a 0; escribir y salir: 0 animaciones; hoy y `reduce`: sin vaivén | **Alta-media** (pregunta 3) |
| I3 | La etiqueta acompaña al foco (toma el color de foco mientras el campo está activo) | En formularios largos se lee qué pregunta estás contestando | Material | Solo CSS | `--g-color-focus` solo garantiza 3:1; la etiqueta es texto (4,5:1): usar `--_focus` solo si es un `*-text` | Contraste ≥ 4,5:1 medido en claro y oscuro | Media |
| I4 | Contador que avisa antes del límite: a partir del 90 % toma `--g-color-warning-text` y la cifra rueda | Anticipa el corte en lugar de descubrirlo | Contadores de redes sociales | Atributo de umbral (bruno) + CSS | El contador es `aria-hidden`: el aviso para lectores lo da `maxlength` o un mensaje | Umbral exacto; cambio solo de color | Media |
| I5 | Borde que se dibuja desde donde hiciste clic | Deleite | Material 2 | Estructura + CSS | El anillo de foco debe ser instantáneo (WCAG 2.4.7): solo sería un trazo secundario | — | Baja |

## 8. `GMenu`

| # | Idea | Qué aporta | Inspiración | Coste | Riesgo | Medida | Prioridad |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **M1** (P) | **Una sola luz que viaja**: un único resaltado por lista (`::before` bajo el contenido) se desplaza al elemento activo, en vez de que cada elemento funda su fondo | **Corrige una estela medida**: al barrer, hoy hay **2 elementos con fondo a la vez**; además une hover y foco en una sola señal | Vercel, macOS | Estructura (bruno escribe la caja del activo; recomendado: el hover mueve el foco, como Radix, para que haya un solo elemento activo) + CSS | El anillo de foco de cada elemento no cambia. Con `reduce`, el resaltado salta | Propuesta: 0 elementos con fondo propio, 7 cuadros entre elementos, termina exacto (114/114); con teclado sigue al foco (42/42) | **Alta** |
| M2 (P) | Cascada corta al abrir (15ms por elemento, tope en el sexto, desde el lado del disparador) | Deleite breve; orienta la lectura de arriba abajo | Raycast | Solo CSS | Un menú es frecuente: aunque mida bien (1.º por delante del 5.º en 0,86 de opacidad; todos a 1 a los 320ms) **no entra** en la primera tanda | Ver columna anterior | Baja |
| M3 | Parpadeo de confirmación al elegir: el resaltado parpadea una vez antes de cerrar (`select` se emite al instante) | Confirma qué elegiste en clics rápidos | macOS | Estructura (cierre diferido `fast`) + CSS | Retrasa el cierre 120ms en una acción frecuente | Emisión inmediata; cierre a `fast` | Baja |
| **M4** | **Submenú con intención**: al moverse en diagonal hacia un submenú abierto, no se cambia de elemento (triángulo de seguridad) en lugar del temporizador fijo de 180ms | Los submenús dejan de cerrarse «solos» al cruzar otro elemento | Amazon (menús de categorías), macOS | Estructura (bruno) | Ninguno de accesibilidad (el teclado no cambia) | Trayecto diagonal sin cambio de `path`; trayecto recto, cambio a los 180ms como hoy | **Alta** |

## 9. Qué lo hace distinto

Lo que un framework genérico hace con un fundido de color, Grana lo hace con **causa y efecto**: cada movimiento sale de donde el usuario actuó y va adonde le importa.

1. **Una curva propia con masa**: `--g-ease-spring` y `--g-ease-bounce`, muelles acotados (3,8 % y 1,006 de escala) dentro de los 240ms de siempre. Es la firma: los botones sueltan con rebote, la marca de pestañas llega con inercia; nada rebota en superficies grandes.
2. **Continuidad espacial de extremo a extremo**: el diálogo viene del botón que lo abrió y vuelve a él (adonde regresa el foco); el panel de pestañas llega del lado al que viajó la marca; la selección de una tarjeta nace de su casilla; el mensaje de error baja desde su campo.
3. **Una sola luz**: la marca de pestañas, el resaltado del menú y el halo de la tarjeta son **una** superficie que viaja, nunca varias que se encienden y apagan. Corrige además la estela medida en `GMenu`.
4. **Un «no» corporal**: el formulario sacude una vez solo lo que impide enviar, y nada más.
5. **Movimiento reducido de primera**: cada idea tiene su versión `reduce` medida, no un `transition: none`.

## 10. Comprobaciones

### Hechas (`verificar.mjs`)

| Motor | Resultado | Qué cubre |
| --- | --- | --- |
| Chromium | **114/114** | Todo lo de las tablas, con y sin `reduce`; nombre accesible por CDP; `LayoutCount` de T1; táctil (375px, `hover: none`) para C1 y desborde de T2; RTL de T2; consola limpia |
| Firefox | **109/109** | Lo mismo salvo CDP y táctil. La salida de D1 no tiene cuadros intermedios (cierra al instante sin `overlay`/`display` discretos, #152) |
| WebKit | **109/109** | Igual que Firefox. Los diálogos se abren con teclado (con clic, WebKit no enfoca el botón y la vuelta del foco no se puede comprobar) |

### No hechas

- Lector de pantalla real sobre B2 (el árbol AX se midió en Chromium; VoiceOver y NVDA no) y sobre M1 si el hover pasa a mover el foco.
- Rendimiento en dispositivo modesto (C1 repinta en cada `pointermove`; T1 hace layout de la marca por cuadro, como hoy).
- T1 en orientación vertical y en `pill`/`segmented`/`contained` (solo `underline` medido; `pill` se ve en el banco).
- C1 en tema oscuro y con temas de `--g-card-hover` más fuerte; C2, C3, D3, D4, I3, I4, M3 y M4 no están prototipadas.
- `forced-colors`, Safari real y táctil real.

## 11. Hallazgos

### Para lima (decisiones y tokens)

1. **Registrar la personalidad por componente** como #298, una decisión por componente con lo que entre en la primera tanda (B1, B2, D1 si el usuario la acepta, D2, T1, T2, C1, C2, I1, I2 si la acepta, M1, M4), con la frase «solo con `prefers-reduced-motion: no-preference`; con `reduce`, patrón §2.3».
2. **Dos tokens nuevos de curva**: `--g-ease-spring` (desplazamientos) y `--g-ease-bounce` (solo escalas ≤ `--g-press-scale`), en `tokens.md` §6 junto a `--g-ease-standard`/`--g-ease-out`; valores de coco (propuesta en §2.1). **Ningún token de duración nuevo.** Validación del CLI: `linear()` debe aceptarse como `<easing-function>`.
3. **Constantes de coreografía neutras** (como #187/#298, sin tematizar): fracción `0.25` y tope `space × 8` de D1; `fast / 8` y tope en el sexto de M2; amplitudes `1 · 0.75 · 0.5 · 0.25 × space-1` de I2; `space × 4` de T2.
4. **Contrato bruno ↔ coco** (§2.4): `data-direction` en `GTabs`; `--_origin-x/y` y el borde fijado (#281) en `GDialog`; `--_pointer-x/y` en `GCard`; `--_active-y/h` en `GMenu`; clase de envío rechazado en los campos (la pone `GForm`, no el campo).
5. **Movimiento reducido** (§2.3): fijarlo como regla transversal en `tokens.md` §6 (hoy vive en el plan 007).
6. **Lo que se reabre, con motivo**: el panel de `GTabs` deja de entrar desde abajo (`tabs/estilo.md`, decisión de coco, no de `DECISIONS.md`); el fondo de hover/foco de `GMenu` pasa a una capa única (`menu/estilo.md`). #127 y #152 **no** se reabren.

### Para otros dueños (fuera de la personalidad)

7. **Defecto de accesibilidad en `GBtn` (coco + bruno):** en `loading`, `GBtn.css` pone `visibility: hidden` en `g-btn__label`; un nodo oculto así **sale del cálculo del nombre accesible** y el botón queda **sin nombre** (medido en Chromium, árbol AX: «» frente a «Enviar informe»). `btn.md` dice «El nombre accesible del botón no cambia». B2 lo corrige de paso (`opacity: 0`), pero el arreglo no debería esperar a la ronda: coco cambia la regla y bruno añade una prueba de nombre en carga. Revisar si `GTabs` (`loading` por pestaña) u otros ocultan su etiqueta igual.
8. **`GMenu` y el `id` del disparador (mora-docs/bruno):** si la aplicación pone su propio `id` al `GBtn` del slot `trigger` después de `v-bind="attrs"`, el menú no se abre y no avisa (lo busca por el id que genera). Documentarlo en el README o avisar en desarrollo.

## 12. Preguntas de producto (identidad; solo el usuario)

1. **¿El rebote es parte de la identidad de Grana?** (`--g-ease-bounce` al soltar botones y `--g-ease-spring` en la marca de pestañas.) Alternativa: todo con `--g-ease-out`, sin rebasar. **Recomendación: sí**, acotado como en §2.1: solo escalas pequeñas y la marca; nunca diálogos, menús ni paneles.
2. **¿El diálogo nace del botón que lo abre (D1)?** La guía habitual es que un modal entre siempre desde el centro; Grana lo haría salir del disparador con un tope de 32px y volver a él al cerrar. **Recomendación: sí**, solo en `placement="center"` y con el tope; si no, la primera tanda de `GDialog` queda en D2 + D4.
3. **¿El formulario «sacude» los campos con error al enviar (I2)?** Da carácter y señala qué falló, pero en productos serios puede leerse como reproche. **Recomendación: sí, por defecto**, una vez, solo al enviar, ≤ 4px y nunca con movimiento reducido; sin prop para apagarlo en v0.1 (si un producto lo pide, una opción de `GForm` en una ronda posterior).
