# Planes de animación (improve-animations)

Planes autocontenidos para que cualquier agente los ejecute sin el contexto de la auditoría. Cada plan dice su dueño del Fruti Squad (AGENTS.md: un archivo, un dueño), los archivos, el código actual citado, el cambio exacto y cómo verificarlo.

| # | Plan | Componente | Dueño | Severidad | Estado |
| --- | --- | --- | --- | --- | --- |
| 001 | [Respuesta al pulsar en GBtn](001-gbtn-press-feedback.md) | GBtn | lima + coco + bruno | MEDIUM | DONE |
| 002 | [Indicador de carga con movimiento reducido](002-gbtn-reduced-motion-spinner.md) | GBtn | coco | MEDIUM | DONE |
| 003 | [Llenado continuo del conector, segmento y barra](003-gstepper-llenado-continuo.md) | GStepper | coco | HIGH | DONE |
| 004 | [Indicador: anillo, pulsación reversible, línea y movimiento reducido](004-gstepper-transiciones-indicador.md) | GStepper | coco | MEDIUM | DONE |
| 005 | [Continuidad del indicador al cambiar de botón a texto, e `is-ready`](005-gstepper-continuidad-indicador.md) | GStepper | bruno | HIGH | DONE |
| 006 | [Entradas: lista del compacto, contenido vertical y check](006-gstepper-entradas.md) | GStepper | coco | MEDIUM | DONE |
| 007 | [Movimiento reducido: conservar los fundidos de color y quitar las escalas que saltan](007-movimiento-reducido-transversal.md) | GBtn, GInput, GTextarea, GSelect, GCheckbox, GSwitch, GCard, GDialog, GDatePicker, GCalendar, GWidgetGallery, GWidgetConfig, GTabs, GSidebar | coco | MEDIUM | DONE |
| 008 | [Selección que se funde entera y chevrón coherente](008-gcard-seleccion-fundida.md) | GCard | coco | MEDIUM | DONE |
| 009 | [Salida animada, entrada por transición y fundido con `reduce`](009-gdialog-salida-animada.md) | GDialog (+ GHelper, GFilterBar) | lima + bruno + coco | MEDIUM | TODO (requiere visto bueno) |
| 010 | [Que la salida llegue a correr y origen desde el disparador](010-gmenu-salida-y-origen.md) | GMenu | bruno + coco | MEDIUM | DONE |
| 011 | [Popovers: salida corta y fundido con movimiento reducido](011-popovers-salida-y-reduce.md) | GSelect, GDatePicker, GHelper, GFilterBar | coco | LOW | TODO |
| 012 | [No animar al montar](012-no-animar-al-montar.md) | GSidebar, GTabs, GCheckbox | bruno + coco | MEDIUM | DONE |
| 013 | [Avance con `translate` en lugar de `inline-size`](013-gprogress-avance-con-translate.md) | GProgress | coco | LOW | TODO |
| 014 | [Esqueletos de carga: un solo pulso](014-esqueletos-un-solo-pulso.md) | GCard, GWidget, GCalendar | coco | LOW | TODO |

## Auditoría de GStepper (commit 49ad85b)

Pregunta del usuario: «siento que [las animaciones] son muy bruscas y no son fluidas». Observado con Playwright en el playground (`#sec-stepper`) en Chromium, Firefox y WebKit, muestreando el estilo computado cuadro a cuadro y con `getAnimations()`.

Qué transiciona hoy: colores del indicador (`background-color`, `border-color`, `color`, 120 ms), `background-color` del conector y de la barra (120 ms) y la escala al pulsar (160 ms). Qué salta: el llenado de conectores, segmentos y barra (gradientes), el anillo del actual (`box-shadow`), número → check, el subrayado de `line`, el color de la etiqueta, todo el indicador cuando el paso cambia de botón a texto, la lista de «Ver todos los pasos», el contenido del paso en vertical y el cambio de tramo.

| # | Severidad | Categoría | Lugar | Hallazgo | Plan |
| --- | --- | --- | --- | --- | --- |
| 1 | HIGH | Estado que salta + defecto | `GStepper.css:217-235`, `:361-364`, `:401-403`, `:439-447`, `:517-520` | El llenado (gradiente) no se interpola y el conector **desaparece 1–3 cuadros** (`rgba(0,0,0,0)`) antes de fundirse; igual el segmento y la barra | 003 |
| 2 | HIGH | Interrupción | `GStepper.vue:215` | Con `navigation="back"`/`"free"`, `button` ↔ `span` hace que Vue rehaga el indicador: salta sin transición y la pulsación se corta (nodo desconectado al soltar) | 005 |
| 3 | MEDIUM | Interrupción / físico | `GStepper.css:153-156`, `:513-516`, `:296-309`, `:101-109` | El anillo aparece de golpe; `:active` sustituye la lista de transiciones y la escala vuelve en un cuadro; `line` y la etiqueta sin transición | 004 |
| 4 | MEDIUM | Accesibilidad | `GStepper.css:522-524`, `design/lab/stepper/estilo.md:31` | Con `reduce` se quitan también los fundidos de color | 004 |
| 5 | MEDIUM | Oportunidad | `GStepper.vue:247`, `:221-223`, `:183` | «Ver todos los pasos» (64 → 332 px), contenido vertical (52 px) y número → check aparecen en un cuadro | 006 |
| 6 | LOW | Layout | `GStepper.css:170-173` | El peso 600 del actual mueve los pasos siguientes 1 px al cambiar de paso (más con etiquetas largas) | sin plan |
| 7 | LOW | Layout | tramo `--current-only` | Al cambiar de paso, el texto visible salta ~90 px al paso nuevo (402 → 494 px); animarlo exige FLIP de anchos o una señal de «paso que llega» desde bruno | sin plan |

Bien como está: el cambio de tramo al redimensionar no se anima (depende del ancho, que cambia de forma continua; animarlo iría siempre por detrás). Tokens y curvas son coherentes con el resto de Grana.

## Orden recomendado (GStepper)

1. **003** (coco): quita el parpadeo y el salto del llenado. Es lo que más se nota y no depende de nada.
2. **004** (coco): reescribe el bloque de movimiento que dejó el 003 (incluye su regla del segmento) y cambia `estilo.md`.
3. **005** (bruno): independiente del CSS; puede ir en paralelo con 003/004. Añade `is-ready`, que el 006 necesita.
4. **006** (coco): **requiere 005** (sin `is-ready` todo se animaría al cargar) y se escribe sobre el bloque que dejó el 004.

Después: auditoría de coco en los tres navegadores (Chromium, Firefox, WebKit) y, si cambia algo del comportamiento descrito, mora-docs actualiza `packages/vue/src/components/GStepper/README.md`.

## Tokens

Ningún plan necesita tokens nuevos. Valores vigentes (`packages/vue/src/styles/defaults.css:151-156`): `--g-duration-fast` 120ms, `--g-duration-press` 160ms, `--g-duration-spin` 800ms, `--g-ease-standard` `cubic-bezier(0.2, 0, 0, 1)`, `--g-ease-out` `cubic-bezier(0.23, 1, 0.32, 1)`, `--g-press-scale` 0.97. Los 240 ms del llenado salen de `calc(var(--g-duration-press) * 1.5)`, la misma derivación que `GSidebar` (`--_t-slow`, DECISIONS.md #71).

Propuesta para lima (sin plan): si un tercer componente necesita esos 240 ms, promover `--_t-slow` a un token `--g-duration-slow` (valor de coco: `calc(var(--g-duration-press) * 1.5)`) en lugar de repetir la derivación.

## Pendiente de la ronda de GStepper (resuelto en la auditoría siguiente)

Los cinco puntos que aquí quedaban sin planificar (movimiento reducido que apaga colores, `GProgress` con `inline-size`, gradiente de selección de `GCard`, salida de `GDialog` y `GTabs` como referencia) se confirmaron y se planificaron en 007, 013, 008 y 009; ver la sección siguiente.

## Auditoría del resto de componentes (commit c9ecab2)

Pregunta del usuario: «corrige las animaciones de los otros componentes también». Alcance: todo `packages/vue/src/components/` salvo `GStepper` (003–006) y lo ya hecho en `GBtn` (001–002). Observado con Playwright en el playground (`http://localhost:4173/playground/`) en Chromium, Firefox y WebKit: `getAnimations()` tras cada interacción (con `no-preference` y con `reduce`), estilo calculado cuadro a cuadro, nodos que Vue elimina o crea (`MutationObserver`) y todo lo que corre en los primeros 4 s de carga (`addInitScript`). En WebKit headless el reloj no avanza solo: se leyó `getAnimations()` y se avanzó `currentTime` a mano.

Lo que está bien y no se toca: ninguna `ease-in`, ningún `transition: all`, ningún `scale(0)`, ninguna duración literal fuera de `GAvatarMotion` (permitidas, DECISIONS.md #106); todos los colores a 120 ms `--g-ease-standard` y las pulsaciones a 160 ms `--g-ease-out`; ningún `:active` sustituye la lista de transiciones (solo pasaba en `GStepper`); ningún nodo que Vue rehaga corta una transición (paginación, tabla y calendario rehacen filas y celdas, pero son cambios de datos que no se animan, y está bien). `GToast`, `GTabs` (marca y paneles), el drawer, el panel flotante y la pista de `GSidebar`, y `GWidgetGrid` (FLIP) ya hacen lo correcto. `GBadge`, `GMetric`, `GSurface`, `GIcon` y `GDataList` no tienen movimiento y no lo necesitan.

| # | Severidad | Categoría | Lugar | Hallazgo | Plan |
| --- | --- | --- | --- | --- | --- |
| 1 | MEDIUM | Accesibilidad | `GBtn.css:271-281`, `GInput.css:409-416`, `GTextarea.css:294-301`, `GSelect.css:499-507`, `GCheckbox.css:448-462`, `GSwitch.css:370-377`, `GCard.css:766-773`, `GDialog.css:345-350`, `GDatePicker.css:756-762`, `GCalendar.css:975-985`, `GWidgetGallery.css:258-261`, `GWidgetConfig.css:205-208`, `GTabs.css:383-388` | Con `reduce`, `transition: none` (o colores solo con `no-preference`) apaga también los fundidos de color: 0 animaciones al marcar, seleccionar o pulsar (medido) | 007 |
| 2 | MEDIUM | Accesibilidad | `GSwitch.css:276-278`, `GDialog.css:128`, `GWidgetGallery.css:248`, `GWidgetConfig.css:175` | Con `reduce` la escala de pulsación se sigue aplicando, sin transición: el control salta a 0.97 en un cuadro (medido en `GSwitch`) | 007 |
| 3 | LOW | Accesibilidad | `GSidebar.css:899-902` | Con `reduce`, el submenú se oculta (`visibility`) en el primer cuadro al cerrarse y su fundido no se ve | 007 |
| 4 | MEDIUM | Estado que salta | `GCard.css:629-639`, `:81-89`, `:356` | Al seleccionar, el tinte (gradiente), el anillo interior y el ✓ aparecen en un cuadro mientras el borde exterior y la casilla se funden 120 ms (medido en los 3 navegadores; mismo defecto que el conector de `GStepper`) | 008 |
| 5 | MEDIUM | Oportunidad / coherencia | `GDialog.vue:232`, `:53-71`, `GDialog.css:316-344` | El diálogo y la hoja lateral entran animados y desaparecen en un cuadro; el contenido se desmonta antes de cerrar (medido), así que no basta con CSS. El drawer de `GSidebar` (mismo `<dialog>`) sí sale animado (#71). Con `reduce`, ni fundido. **Reabre** «Sin salida animada» (`dialog/estilo.md:17`) | 009 |
| 6 | MEDIUM | Interrupción | `GMenu.vue:340-354` | El CSS de salida de `GMenu.css:205-221` nunca corre: Vue quita la lista del DOM al cerrar (medido en los tres menús del playground) | 010 |
| 7 | MEDIUM | Físico / origen | `GMenu.css:40-44` | `transform-origin` fijo arriba-inicio: con `align="end"` o abriendo hacia arriba la lista crece desde la esquina más lejana al botón (medido en el menú del widget) | 010 |
| 8 | MEDIUM | Montaje | `GSidebar.css:78-95`, `:380-385` | Al cargar, las etiquetas del sidebar expandido entran deslizándose y las insignias escalan (cada carga de página) | 012 |
| 9 | LOW | Montaje | `GTabs.css:520-533`, `GCheckbox.vue:66-74` | Al cargar, el panel visible de `GTabs` entra con fundido (sin `is-ready`) y la casilla mixta de `GCheckbox` anima su color y su trazo (`indeterminate` se pone tras la primera pintura) | 012 |
| 10 | LOW | Coherencia / accesibilidad | `GSelect.css:320-333`, `GDatePicker.css:655-668`, `GHelper.css:159-170`, `GFilterBar.css:194-197` | Salen en un cuadro (los menús y paneles del sidebar se funden) y con `reduce` no tienen ni fundido | 011 |
| 11 | LOW | Rendimiento | `GProgress.css:37-47` | El avance anima `inline-size` (layout) | 013 |
| 12 | LOW | Coherencia | `GCard.css:693-700`, `GWidget.css:248-256`, `GCalendar.css:943-948` | Cuatro pulsos de esqueleto distintos (1.4 s, 2.4 s, 3.2 s) y la palabra clave `ease-in-out` en lugar de un token | 014 |
| 13 | LOW | Coherencia | `GCard.css:209` | El chevrón de «Mostrar más» gira en 120 ms `--g-ease-standard`; en `GSelect` y `GSidebar`, 160 ms `--g-ease-out` | 008 |

Observado, sin plan (de menor impacto o con decisión documentada):

- **`GAvatarMotion`** (coreografías: decisión del usuario, #104–#106): único defecto observado, al salir de `thinking` las partes vuelven a reposo en un cuadro (medido: cuerpo ~2 px, antena ~4°, ojos ~3 px). Quitar una animación no dispara transiciones; suavizarlo exigiría que bruno «asiente» las partes con WAAPI. Es decisión de coreografía: se deja al usuario.
- **Salida de `GHelper` y del editor de `GFilterBar`**: su contenido se desmonta al cerrar (render de bruno), así que una salida solo con CSS mostraría una caja vacía. El 011 les da el fundido con `reduce`; la salida necesitaría el mismo cambio que 010 hace en `GMenu`.
- **`GSidebar`**: la pulsación usa escalas literales (`0.98` en enlaces, `0.95` en el navbar, `GSidebar.css:290-292`, `:749-751`) y 120 ms en vez de `--g-press-scale` y 160 ms, y el comentario de `:289` («suelta más lento que aprieta») no se cumple (misma transición en ambos sentidos). Es parte de la ronda de movimiento aprobada (#71); si se quiere coherencia total, que coco lo revise.
- **`GCheckbox` chip**: el ✓ del chip anima `inline-size` y `margin` (layout) para hacerse sitio; es el gesto de diseño del chip y dura 160 ms: se acepta.
- **`GTabs`**: la marca anima `inline-size`/`block-size` (documentado en `tabs/estilo.md:20`); es un elemento absoluto y no mueve a nadie: se acepta.
- **Oportunidades** (aditivas): el contenido de «Mostrar más» de `GCard` aparece de golpe (podría usar la técnica del submenú de `GSidebar`, `interpolate-size`); `GBadge` aparece y desaparece al pasar de 0 a N sin entrada (la insignia del sidebar sí tiene una; necesitaría `is-ready` para no animarse en cada lista al cargar).
- **Coherencia aceptada**: `GMenu` entra en 120 ms y los demás popovers en 160 ms (decisión de `menu/estilo.md`: un menú es más frecuente).

## Orden recomendado (resto de componentes)

1. **007** (coco): primero, porque reescribe los bloques `reduce` que tocan 008, 009 y 011. Independiente de todo lo demás y de efecto inmediato.
2. **010** (bruno → coco) y **012** (bruno → coco): independientes entre sí y de 007; pueden ir en paralelo. El 010 crea `src/utils/motion.js` si llega antes que el 009.
3. **008** (coco): después de 007.
4. **011** (coco): después de 007.
5. **009** (lima → bruno → coco): después de 007 y **solo con el visto bueno del usuario** (reabre una decisión de coco). Reutiliza `src/utils/motion.js` del 010 si ya existe.
6. **013** y **014** (coco): pulido, en cualquier momento.

Después: auditoría de coco en los tres navegadores sobre lo cambiado y, si cambia el comportamiento documentado, mora-docs actualiza los `README.md` de `GDialog`, `GMenu`, `GCard` y `GSidebar` (p. ej. el momento en que se emite `closed` en `GDialog`).

## Tokens (resto de componentes)

Ningún plan necesita tokens nuevos: todo sale de `--g-duration-fast` (120ms), `--g-duration-press` (160ms), `--g-duration-spin` (800ms), `--g-ease-standard` (`cubic-bezier(0.2, 0, 0, 1)`), `--g-ease-out` (`cubic-bezier(0.23, 1, 0.32, 1)`) y `--g-press-scale` (0.97). Sigue en pie la propuesta para lima de la ronda anterior (`--g-duration-slow` si un tercer componente necesita los 240 ms de `--_t-slow`); en esta ronda ningún plan los usa.
