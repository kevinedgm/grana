# Declaración — `GDialog` r02: niveles anidados · base funcional y conceptos A, B y C

**Estado:** pendiente de la elección del usuario (pregunta al final). La base funcional se deriva de estándares (WAI-ARIA APG *Dialog (Modal)*, que admite un diálogo abierto desde otro; WCAG 2.2 AA) y de contratos vigentes (#42, #141, #292, #301, #307, #533); la forma (A, B o C) es una decisión de identidad y de producto.
**Ruta:** R2 · **Fidelidad:** F3 (componentes reales de `dist/` y tokens del tema por defecto) · **Siguiente dueño:** lima, tras la elección.
**Prototipo:** `index.html` (`?c=hoy|A|B|C`, `&dir=rtl`), `flow.js` (motor del flujo, datos, borradores, anuncio), `app.js` (conceptos). Verificación: `verificar.mjs`.

---

## 0. Lo que pasa hoy (medido con el `GDialog` real)

`?c=hoy`: cinco `GDialog` anidados como lo haría una aplicación, cada uno con su `GForm`. Tres motores, mismas cifras.

| # | Hecho | Medida | Consecuencia |
| --- | --- | --- | --- |
| H1 | La pila nativa funciona | 5 `<dialog>` en `:modal`; `GToaster` dentro del quinto | `topModal.js` ya sirve; nada que inventar para avisos, isla ni voz |
| H2 | Los fondos se suman | 5 fondos visibles, opacidad compuesta **0,855** (claro; 0,99 en oscuro) | El contexto que se quería conservar desaparece en negro |
| H3 | Esc mantenida vacía la pila | Desde el nivel 5, 7 pulsaciones (6 con `repeat`) → **0 niveles abiertos** | Un gesto habitual pierde cinco niveles de trabajo |
| H4 | `GForm` anidado a través de `GDialog` | Los `GForm` de los niveles 3 a 5 se pintan como `<div>` (aviso de desarrollo «un GForm dentro de otro GForm»): el `inject` atraviesa el diálogo. El botón «Crear categoría» del nivel 5 tiene como dueño `hoy-f2` y **envía el ingreso** (submit ingreso 1, categoría 0) | Bug real hoy, con un solo nivel: basta un `GDialog` escrito dentro de un `GForm` (p. ej. el «Crear…» de un `GSelect`) |
| H5 | Retorno del foco | Nativo, al disparador; WebKit, al `<dialog>` (#307: el clic no enfoca) | Hay que pasar el disparador explícito |
| H6 | Sin contexto | Ningún nivel dice de dónde viene ni adónde va su resultado | El lector de pantalla oye «Categoría nueva, diálogo» sin saber para qué |

H2, H3 y H4 son defectos **independientes del concepto que se elija**: van a lima como hallazgos L1 a L3.

---

## 1. Base funcional (rige para A, B y C)

1. **Un nivel es una tarea con nombre y propósito.** Cada nivel tiene título (`h2` del diálogo, o `h3` en el pliegue de C) que es su **nombre accesible**, y una descripción que dice **adónde va su resultado**: «Se elegirá en Categoría del producto nuevo», «Para el ingreso de la OC-2291». La descripción es texto de la aplicación (`description`, como hoy); Grana no compone la frase. WCAG 1.3.1, 2.4.6, 3.3.2.
2. **Quién abre un nivel se dice, no se adivina.** El nivel guarda su disparador: el que pasa la aplicación (`from`) o, si no, `document.activeElement` fuera del diálogo (como D1). En WebKit un clic no enfoca el botón (#307): sin `from`, el retorno cae en el primer control del nivel de abajo. El `create` de `GSelect` ya devuelve el foco al selector antes de emitir, así que allí basta el valor por defecto.
3. **Foco al entrar:** el orden de #292 **dentro del nivel** (primer `[autofocus]`, primer control del contenido, nunca Volver ni Cerrar). Medido: «Nombre» de la categoría en los tres conceptos y motores.
4. **Bajar un nivel sin resultado:** Esc, «Volver a {nivel de abajo}» (chevron Lucide `chevron-left`, espejado en RTL, con nombre completo) y «Cancelar» bajan **exactamente un nivel**. Una pulsación de Esc con **`event.repeat` se ignora** (medido: la tecla mantenida baja uno, no cinco). Un descendiente que ya trató Esc (lista de `GSelect`, aviso, pliegue de C) lo cancela con `preventDefault` y el nivel no lo atiende (guarda ya presente en `GDialog`).
5. **El fondo no descarta trabajo:** en el nivel 1, el clic en el fondo cierra como hoy (`closeOnBackdrop`); **desde el nivel 2, no hace nada**. Medido en los tres conceptos.
6. **Volver nunca borra.** El borrador de un nivel vive hasta que se confirma o se cierra el flujo entero: si se vuelve atrás y se reabre «Crear categoría…», está lo que se escribió (medido: «Borrador» sigue). Sin diálogo de «¿Descartar cambios?» al bajar: sería un sexto nivel. El borrador vive en el **modelo de la aplicación** (los campos ya tienen `v-model`); Grana no conserva montado un nivel cerrado.
7. **Confirmar devuelve un resultado al nivel de abajo.** El nivel de arriba termina con un valor; la aplicación lo escribe en el modelo del nivel de abajo (Grana presenta y emite intención, no toca datos). Entonces:
   - el foco va al **campo que recibió el valor** (si no hay, al disparador; si tampoco, al orden de #292);
   - se anuncia **una frase** en el canal cortés único que vive en el modal superior (patrón de #533): «Categoría «Biología molecular» creada y elegida en Producto nuevo.» (texto de la aplicación). WCAG 4.1.3;
   - el campo marca la llegada (§ «Qué lo hace distinto»).
   Medido en los tres conceptos: categoría → campo Categoría; producto → campo Producto de la partida; partida → su fila del ingreso; ingreso → botón del detalle.
8. **Confirmar con error** no baja: el foco va al primer campo con error (lo que ya hace `GForm`). Medido: «Guardar partida» sin cantidad.
9. **Cerrar el flujo entero** es una acción explícita y única (la X del nivel 1 en A y C, la X del diálogo en B) que emite `dismiss` (cancelable, como hoy) con la **profundidad** para que la aplicación confirme si hay borradores.
10. **Un solo fondo**, por profundo que sea el flujo (medido: 1 visible en A, B y C).
11. **Un formulario por nivel, nunca anidado.** `GDialog` corta el contexto de `GForm` (hallazgo L1); en C, los campos del pliegue no viajan en el envío del formulario de abajo.
12. **Avisos, isla y voz** siguen al modal superior (`topModal.js`, sin cambios; medido con `GToaster`). El canal del anuncio del punto 7 también.
13. **Lo de abajo:** en A y B no es operable (inerte); en C sigue a la vista y operable, porque lo que se crea es parte de la misma tarea.
14. **Móvil (hoja, ≤ 520px):** la hoja se mantiene; cada concepto resuelve la profundidad a su modo (abajo). Sin desborde horizontal en ninguno (medido a 375px).
15. **Movimiento reducido:** solo fundidos; la marca de llegada es un fundido corto. D2 (borde fijo) sí rige: no es movimiento.
16. **Profundidad:** sin límite duro. Cinco niveles es el caso real; más allá, es una señal de diseño del flujo, no del componente.

---

## A · La baraja

Cada nivel es un `GDialog` modal **de verdad** (la pila nativa: trampa de foco por nivel, Esc al superior, `topModal` sin cambios). Lo que cambia es que **los de abajo no desaparecen**: bajan a un **lomo** de `space × 9` con su número, su título y lo que esperan («Partida 3 · Producto: falta»), escalonados `space × 10` desde arriba y reducidos un 4 % por nivel; solo el primero tiene fondo. **Pulsar un lomo** vuelve a ese nivel (con el puntero; con teclado, Volver y Esc). Al confirmar, la carta de arriba **cae hacia abajo** y la baraja sube.

En la hoja móvil, cada nivel es una hoja algo más baja (`space × 9` por nivel) y las de abajo asoman por arriba con su lomo.

### Qué lo hace distinto (A)

La profundidad se **ve** sin leer nada: cinco lomos son cinco cosas a medio hacer, cada una diciendo lo que espera. El patrón común (un modal encima de otro, o un modal que sustituye al anterior) esconde el contexto justo cuando más falta, y el oscurecido compuesto lo convierte en negro (H2). Aquí el contexto queda como **índice físico** y se puede volver a cualquier nivel de un toque.

### Gana y arriesga

- **Gana:** semántica nativa y APG sin trucos (cada nivel es un diálogo con su nombre); casi sin API nueva; cualquier `GDialog` existente participa solo.
- **Arriesga:** cinco `<dialog>` en la capa superior; la altura del visor limita la baraja: el nivel 5 dispone de `100dvh − space × 50` (700px con un visor de 900px, 400px con uno de 600px), y con zoom o teclado virtual se queda corto; los lomos son solo del puntero (el teclado sube nivel a nivel); cada nivel desmonta su contenido al cerrar (#152), así que el borrador **tiene** que vivir en el modelo de la aplicación.

### Medidas (A)

Bordes superiores 24 / 64 / 104 / 144 / 184px a 1280×900; lomos de 30 a 35px de alto (escalados); clic en el lomo del ingreso → pila de 2 y foco en «Completar partida 3»; móvil: hojas escalonadas, sin desborde; reduce: sin desplazamiento.

---

## B · El hilo

**Un solo `GDialog`** (una capa, un fondo, una trampa de foco) con un **historial de pasos**. Bajo el título, un **hilo**: los niveles lejanos y el actual son números (con su nombre entero en el árbol), el **padre** enseña su nombre porque es adonde lleva Volver, y el actual va en acento con `aria-current="step"`. Cada número es un botón que vuelve a ese nivel de un salto. Cada paso es un `role="group"` con el nombre del título; el `<dialog>` cambia su nombre al del paso.

Ir más hondo: el paso nuevo **entra desde el final** (`space × 6`, `--g-ease-out`, `--g-duration-slow`), y volver lo trae **desde el inicio** (espejado en RTL); la carcasa **cambia de alto** con el borde superior fijo (D2, medido Δ 0px del nivel 3 al 5). En la hoja móvil, **la hoja no encoge mientras dura el recorrido**: su borde superior puede subir al ir más hondo, pero no baja y vuelve a subir al ir y volver (medido).

### Qué lo hace distinto (B)

Los asistentes de los frameworks son **lineales y conocidos** (paso 1 de 4). Este es un historial **que crece por lo que falta** y que **devuelve**: cada paso sabe para qué lo abrieron, y al confirmar se recoge y el valor **aterriza** en el campo que lo pidió. El hilo es una pila visible en una línea, no una barra de progreso.

### Gana y arriesga

- **Gana:** es lo que el proyecto ya decidió y tuvo que hacer a mano; un solo modal resuelve fondos, Esc, avisos y móvil de una vez; el contenido de los pasos de abajo sigue montado (inerte), así que un formulario a medias no se pierde ni sin modelo.
- **Arriesga:** API nueva de verdad (pasos, historial, `back(result)`, `push(name, { from })`); un solo ancho para pasos muy distintos (el ingreso querría `lg`, la categoría `sm`); el cambio de nombre del `<dialog>` no se anuncia por sí solo: depende de que el foco entre en el grupo con nombre (por verificar con lectores reales).

### Medidas (B)

Hilo de cinco botones con nombre completo («2 Ingreso desde orden de compra, OC-2291 · 3 partidas»); `aria-current="step"`; un salto desde el hilo deja la pila en 2 y el foco en «Completar partida 3»; borde superior Δ 0px; hoja móvil sin bajar al volver; reduce: `xb-fade`.

---

## C · En su sitio

Cuestiona la premisa: **no todo lo que falta es un lugar nuevo**. Un nivel nuevo solo cuando **cambia la tarea** (Detalle → Ingreso: dos diálogos, con las reglas de la base). Lo demás se crea **donde se echa en falta**: «Completar» abre la partida **bajo su fila**; «Crear producto…» abre un pliegue **bajo el campo Producto**; «Crear categoría…», otro **bajo el campo Categoría** del pliegue anterior. Cada pliegue es un `role="group"` con su título (`h3`) y su propósito, un **raíl** de acento que lo une al campo que lo pidió, y su propio «Crear y elegir» / «Cancelar». Esc dentro de un pliegue recoge **solo ese pliegue** (medido). Al confirmar, el pliegue **se recoge en el campo** y el valor aparece en él. El diálogo crece hacia abajo con el borde fijo (D2, Δ 0px).

### Qué lo hace distinto (C)

Lo que se está llenando **nunca se tapa**: al crear el producto, la fila de la partida y el resto del ingreso siguen ahí, a la vista y editables. Es el gesto de `GCombobox` A («el campo se abre») llevado a la creación completa: la jerarquía se dibuja con raíles en lugar de capas, y la profundidad es **espacial** en el mismo documento, no una pila de ventanas.

### Gana y arriesga

- **Gana:** cero modales extra para lo más común (crear la opción que falta); el lector de pantalla recorre todo en orden de lectura; el móvil es natural (es scroll).
- **Arriesga:** cada pliegue anidado resta unos 30px de ancho (sangría + raíl), así que a 375px los campos del tercero quedan en unos 240px (medido en la captura); el pliegue no puede ser un `<form>` (HTML no anida), así que necesita su propia validación y quedar **fuera del envío** del formulario de abajo; mientras un pliegue está abierto, el resto del formulario sigue operable (hay que decidir qué pasa si se elige una opción existente con el pliegue abierto: se propone recogerlo conservando el borrador); no sirve cuando lo que se abre es **otra tarea** (por eso Detalle → Ingreso sigue siendo un diálogo).

### Medidas (C)

Pliegues anidados con nombre («Categoría nueva») y propósito; la fila de la partida sigue enfocable con el pliegue abierto; Esc recoge solo el pliegue de arriba y deja los dos diálogos abiertos; borde superior Δ 0px; móvil sin desborde.

---

## Comparativa

| | A · La baraja | B · El hilo | C · En su sitio |
| --- | --- | --- | --- |
| Qué es un nivel | Un diálogo | Un paso de un diálogo | Un pliegue bajo el campo (o un diálogo si cambia la tarea) |
| Contexto a la vista | Lomos con título y lo que esperan | Hilo de números; el padre con nombre | **Todo** lo de abajo, editable |
| Modales en la capa superior (5 niveles) | 5 | **1** | 2 |
| Volver a un nivel lejano | Clic en su lomo (puntero) | Botón del hilo (**teclado y puntero**) | Recoger pliegues (Esc o Cancelar) |
| Esc | Baja un nivel | Baja un nivel | Recoge el pliegue de arriba |
| Borrador al volver | En el modelo de la aplicación | Montado (inerte) **y** en el modelo | En el modelo de la aplicación |
| Móvil | Hojas escalonadas | Una hoja que no encoge | Scroll; el tercer pliegue estrecho |
| Ancho por nivel | El suyo | Uno para todos | El del diálogo, menos la sangría |
| API nueva | Mínima (detección de pila, lomo, fondo) | Pasos, historial, `back(result)` | Slot de creación en `GSelect`/`GCombobox` |
| Movimiento propio | La carta cae, la baraja sube | El paso entra de su lado; la carcasa cambia de alto | El campo se abre y se recoge |
| Coste | Bajo-medio | Medio | Medio (validación propia del pliegue) |
| Riesgo principal | Alto del visor; lomos solo con puntero | Un ancho para todo; anuncio del cambio de paso | Ancho en profundidad; frontera con el formulario de abajo |

## Recomendación de kiwi (no decidida)

**B como patrón oficial de niveles, y C como forma de la creación de una opción que falta.** La base (H2, H3, H4) se corrige en todo caso.

- **B** porque es lo que el producto real ya eligió, resuelve fondos, Esc, avisos y móvil con un solo modal, y su hilo es el único de los tres que permite **volver a un nivel lejano con teclado** en un paso.
- **C** porque el caso más frecuente de anidamiento es **«esta opción no existe»** (producto y categoría en el flujo real): crearla bajo el campo evita dos niveles y deja a la vista lo que se estaba llenando. Encaja con `GCombobox` A y con el `create` de `GSelect`.
- **A** queda como lo que una aplicación obtiene si anida `GDialog` sin más: con la base corregida (un fondo, Esc sin repetición, `GForm` cortado) ya es usable; los lomos se pueden reservar.

## Qué lo hace distinto (resumen de la recomendación)

Un diálogo que **recuerda para qué lo abriste**: cada nivel dice adónde va su resultado, el hilo deja volver a cualquier punto, **volver nunca borra**, y al terminar el valor **aterriza** en el campo que lo pidió (un anillo de acento que se recoge, con una sola frase para el lector). Y cuando lo que falta es solo una opción, **no se abre nada encima**: el campo se abre y se recoge en su sitio. Todo sin muelles (#299: nunca en diálogos), con fundidos en movimiento reducido y foco y nombre en cada nivel.

---

## Comprobaciones

`node design/lab/dialog/r02/verificar.mjs` · 2026-10-13 · puerto 4212 · pasada completa en los tres motores sobre el estado final: **286 de 287**; el único fallo fue un `page.goto` que superó 30 s en Chromium B (máquina cargada por otros agentes), y repetido solo da 32/32. Total efectivo: **287/287**.

| Motor | Hoy | A | B | C |
| --- | --- | --- | --- | --- |
| Chromium | 7/7 | 31/31 | 32/32 | 27/27 |
| Firefox | 7/7 | 31/31 | 32/32 | 27/27 |
| WebKit | 7/7 | 31/31 | 32/32 | 27/27 |

«Hoy» cuenta como pasa lo que **se espera que falle** (H2, H3, H4 son criterios de hallazgo: pasan si el defecto se reproduce).

Diferencias por motor: en WebKit el clic no enfoca el botón, así que el retorno nativo de «Hoy» va al `<dialog>` (#307); los conceptos pasan el disparador explícito (`from`) y aciertan en los tres.

**No comprobado:** lector de pantalla real (VoiceOver, NVDA, TalkBack): el anuncio del cambio de nombre del `<dialog>` en B, el `role="group"` de cada paso y pliegue al recibir el foco, la frase de resultado tras el foco en el campo (orden de lectura), los lomos de A (`aria-hidden`: solo visuales); táctil real; zoom 200 % (la baraja de A con poco alto de visor); `forced-colors` real (reglas escritas: raíl y llegada en `Highlight`); tema oscuro y otros temas; la combinación de B con el slot `tabs`; D1 (origen desde el disparador) en cada nivel de A.

---

## Hallazgos para lima

| # | Tema | Propuesta |
| --- | --- | --- |
| L1 | **`GForm` atraviesa `GDialog`** (H4, P1, independiente del concepto) | `GDialog` corta el contexto de formulario: `provide(formKey, null)` (como ya hace con `TABS_NEST`). Un `GForm` dentro de un diálogo es siempre un `<form>` propio. Prueba de bruno: `GDialog` con `GForm` dentro de un `GForm`: el interior es `<form>`, su envío no dispara el exterior. Revisar si `useFormField` de un campo suelto en el diálogo debe ver el `GForm` de fuera (se propone que no) |
| L2 | **Esc con repetición** (H3) | `GDialog` ignora `keydown` de Esc con `event.repeat` (sin `preventDefault` al ignorar no hace falta: ya se cancela el nativo). Precisar en `dialog.md` «Teclado» |
| L3 | **Un solo fondo** (H2) | Un `GDialog` que se abre con otro modal debajo (`topModal`) no pinta su `::backdrop` (o lo pinta transparente); el de abajo conserva el suyo. Clase propuesta `is-stacked` (raíz) |
| L4 | **Fondo desde el nivel 2** | Con otro modal debajo, el clic en el fondo no emite `dismiss` (base §5). Precisar `closeOnBackdrop` |
| L5 | **`dismiss` con profundidad** | Payload `{ reason, depth, preventDefault() }`; `depth` = niveles abiertos en el flujo (A: modales de la pila; B: pasos) |
| L6 | **Disparador explícito** | Opción `from` al abrir un nivel (A: prop o `open(from)`; B: `push(name, { from })`), por #307. Sin `from`, `activeElement` |
| L7 | **Anuncio del resultado** | Texto de la aplicación, sin valor por defecto (p. ej. `back(result, { announce })` en B, `done(value, { announce })` en C); canal cortés de página (#533) trasladado al modal superior. Grana no compone frases |
| L8 | **Volver nunca borra** | Regla de contrato: bajar no reinicia nada; el borrador vive en el modelo. En B, los pasos de abajo siguen montados e inertes mientras estén en el historial; uno que sale del historial se desmonta. Documentarlo como receta |
| L9 | **API según la elección** | **A:** sin props nuevas; `GDialog` detecta que hay modal debajo (`topModal`) y se pone `is-stacked`, `--_level`; el lomo lo pinta el de abajo con su `title` y una prop opcional de lo que espera (`pending`, texto). **B:** `GDialog` con hijos `GDialogStep` (`name`, `title`, `description`) y `v-model:steps` (historial, arreglo de nombres); alcance del slot y `useDialogSteps()` con `push(name, { from })`, `back(result?, { announce })`, `backTo(name)`; evento `step` `{ from, to, direction, result }`; el hilo necesita `labels.trail` (nombre del `nav`). **C:** slot `create` en `GSelect` y `GCombobox` con alcance `{ query, done(value, { announce }), cancel() }`, que se pinta bajo el campo como pliegue; el `create` actual se conserva |
| L10 | **Ancho por paso (B)** | Reservado: `size` por paso (`GDialogStep size`), con el borde superior fijo y el cambio de ancho animado; no en la primera entrega |
| L11 | **Hoja móvil que no encoge (B)** | Cierra la parte de la hoja de #281 durante un recorrido: la hoja no baja su borde superior al volver; al cerrar el flujo, vuelve a medir |
| L12 | **Pliegue de C fuera del envío** | Los controles del pliegue no pertenecen al formulario de abajo (no se nombran o se asocian a otro `form`); su validación es propia y bloquea «Crear y elegir», no el envío de abajo. Si el formulario de abajo se envía con un pliegue abierto: error «Termina o cancela {pliegue}» y foco en él |
| L13 | **Tokens y constantes** | **Ningún token nuevo.** Constantes de coreografía (#299): A, lomo `space × 9`, escalón `space × 10`, escala `0.04` por nivel, caída `space × 6`; B, entrada `space × 6`, `--g-duration-slow` + `--g-ease-out`; C, raíl `border-width × 2` en `accent`, sangría `space × 3` + `space × 4`; llegada, anillo `focus-width` en `accent` que se recoge en `duration-slow × 3`. **Sin `--g-ease-spring`** (#299: nunca en diálogos) |
| L14 | **Iconos** | Ninguno nuevo: `chevron-left` (Volver, `flip-rtl`) y `x` ya están en la lista de la librería |
| L15 | **Fronteras** | `GStepper` es un proceso conocido, no un historial; el hilo de B no es `GBreadcrumbs` (botones de historial, `aria-current="step"`); C no es `GFormReveal` (tiene su propio confirmar y no viaja en el envío) |
| L16 | **Personalidad** | Registrar en `DECISIONS.md` la forma elegida y la «llegada» (`is-landed`) como lenguaje común de «un valor que vuelve» |
| L17 | **Complejidad** | Componente complejo en cualquier opción (se posiciona sobre otros, motor de estado de la pila, compone `GForm`/`GSelect`): coco y bruno en Opus |
| L18 | **Pruebas de bruno** | Las de `verificar.mjs` como base: cinco niveles, Esc mantenida, fondo único, borrador que vuelve, resultado con foco y anuncio en el modal superior, error al confirmar, salto a un nivel lejano, RTL, reduce, móvil; y las de L1 a L4 sobre el componente actual |

## Pregunta de producto (una)

**¿Qué forma tienen los niveles anidados de `GDialog`?**

1. **B + C (recomendada):** un solo diálogo con historial de pasos y el hilo para volver; y cuando lo que falta es solo una opción, se crea bajo el campo, sin nivel nuevo.
2. **Solo B:** pasos con historial para todo, también para crear una opción.
3. **A:** diálogos apilados de verdad, con los de abajo como lomos y un solo fondo.
4. **Solo la base:** corregir H2, H3 y H4 (un fondo, Esc sin repetición, `GForm` cortado) y documentar el apilado nativo, sin forma nueva por ahora.

*En cualquier opción, L1 a L4 se corrigen ya: son defectos medidos del componente actual.*
