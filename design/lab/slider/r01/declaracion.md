# Declaración — deslizador (`GSlider`, nombre de trabajo), r01: base funcional y conceptos A, B y C

> kiwi, 2026-10-07. Prototipo: `index.html` (`?v=base|A|B|C|compare`, `&dir=rtl`); motor `engine.js`; componente `slider.js` (`XSlider`, un núcleo y cuatro formas, con el **`useFormField` real** de `@grana/vue` y `GForm`, `GFormRow`, `GInput`, `GNumberField` y `GErrorSummary` reales de `dist/`); `slider.css` (base con neutros; A, B y C con los tokens del tema por defecto). Verificación: `verificar.mjs`, **228/228** en Chromium, Firefox y WebKit (cifras en «Comprobaciones»). La base deriva de HTML, WAI-ARIA APG (*Slider*, *Multi-Thumb Slider*), WCAG 2.2 y los contratos vigentes; la forma es la **pregunta de producto** del final.

## Anatomía (base)

```
raíz x-sl [is-range] [is-empty] [is-readonly] [is-disabled] [is-invalid] — tres hijos: cabecera · fila · pie
├─ x-sl__head
│  ├─ <label for="ID">Intensidad del dolor (+ marca de GForm)</label>          (rango: <span id="ID-label">)
│  └─ <span x-sl__value aria-hidden="true"><bdi>7</bdi> · Moderado</span>      ← valor siempre a la vista, sin región viva
├─ x-sl__row  [rango: role="group" aria-labelledby="ID-label"]
│  ├─ x-sl__area (touch-action: pan-y; alto = caja de GInput: space × 9, 44px con puntero grueso)
│  │  ├─ x-sl__track · x-sl__fill
│  │  └─ x-sl__thumb (una por valor; área ≥ 24px, 44px gruesa)
│  │     └─ <input type="range" step="any" id="ID" min="{límite del asa}" max="{límite del asa}" value
│  │               aria-valuetext="5, Moderado" [aria-labelledby="ID-label ID-n0"] aria-describedby="ID-hint ID-message"
│  │               [aria-invalid] [aria-readonly] [disabled]>   ← nativo, opacity 0, del tamaño del interior del asa, SIN name
│  │        [rango: <span id="ID-n0" hidden>mínimo</span>]
│  ├─ x-sl__marks aria-hidden="true" (rayas y nombres; se pueden pulsar)
│  └─ <input type="hidden" name="dolor" value="7">  (uno por asa; "" sin elegir; disabled con el campo)
└─ x-sl__support: ayuda · región de mensaje (siempre presente, icono Lucide circle-alert)
```

## Decisiones de la base

**Semántica: nativo por dentro, forma propia por fuera**

1. **Cada asa es un `<input type="range" step="any">` nativo, invisible (`opacity: 0`, `pointer-events: none`) y del tamaño del interior del asa**; la forma visible la dibuja el componente y el teclado lo resuelve el componente (`preventDefault` en las teclas del punto 11). Se descarta:
   - **el nativo a secas**, medido en los tres motores (caso 3): `readonly` no existe en un range (→ pasa de 50 a 51), su rejilla cuenta desde `min` (con `min` 23 y paso 5, el 50 se vuelve 48: un `min` dinámico para que las asas no se crucen mueve la rejilla), en RTL la → **baja** en Chromium y Firefox y **sube** en WebKit, el asa no admite texto ni otra forma (B y C imposibles) y un rango exige dos nativos superpuestos que se pelean por el puntero. Re Pág da +10 % en los tres (no es un motivo);
   - **un `div role="slider"`**: pierde lo que el nativo da sin código, el ajuste de los lectores móviles (VoiceOver «ajustable» al deslizar arriba/abajo, TalkBack), que en un `div` depende de que el navegador simule teclas. Con el nativo, ese ajuste llega como un evento `input` y se traduce a **un paso** en esa dirección con la rejilla del componente (medido: el nativo movido +0,4 → el modelo pasa de 50 a 55);
   - **el nativo en 1px** (patrón de texto oculto): el foco de VoiceOver y la exploración táctil dibujarían un punto en vez del asa (medido: el nativo ocupa el interior del asa).
2. **`step="any"`** en el nativo: la rejilla es la del componente (cuenta desde `min` fijo, o las marcas), y el nativo puede llevar como `min`/`max` **los límites del asa** sin mover la rejilla. Así `aria-valuemin`/`aria-valuemax` dicen lo que APG pide en un rango (el inicio llega hasta el fin; medido: `max` del inicio 2300 y `min` del fin 900 con `minGap` 100).
3. **`aria-valuetext` siempre**: el número con `Intl.NumberFormat` del idioma y las opciones de la aplicación (`format`: moneda, unidad; el porcentaje es `{ style: 'unit', unit: 'percent' }`, así el modelo 40 se lee «40 %»); si el valor cae en una marca con nombre, se añade («5, Moderado»); sin elegir, `labels.empty` («Sin elegir»); `valueText(v)` de la aplicación lo sustituye (p. ej. «3 h 20 min»).
4. **Nombre**: valor único, `<label for>`; rango, `role="group"` con la etiqueta y cada asa con `aria-labelledby` = etiqueta + `labels.start`/`labels.end` (medido: «Precio mínimo», «Precio máximo» en los tres motores). Ayuda y mensaje por `aria-describedby`; `aria-invalid` en cada asa con error.
5. **Sin `aria-required`** (no está admitido en `slider`): la obligación se ve en la marca de `GForm` y, si falta, en el error. Solo tiene sentido con «sin elegir» (punto 9).
6. **El valor está siempre a la vista** junto a la etiqueta, `aria-hidden` (el asa ya lo anuncia) y sin región viva (no se repite en cada paso). En RTL cada cifra va en `<bdi>` («24 a», no «a 24»). Sin globo que aparece al arrastrar: el valor no se busca ni lo tapa el dedo.

**Modelo, «sin elegir» y envío**

7. **Modelo**: valor único `Number | null`; rango `[inicio, fin]` (dos números ordenados; otro valor → `[min, max]` con aviso). Prop `range` explícita (como `multiple` en `GCombobox`), no deducida del tipo.
8. **Grana no valida ni redondea (#157)**: un valor de la aplicación fuera de la rejilla se queda; el primer paso cae en el punto siguiente de la rejilla en esa dirección (`engine.js` `move`). Fuera de `min`/`max` se dibuja en el extremo sin tocar el modelo (aviso de desarrollo). Un `max` fuera de la rejilla no se alcanza: el último punto es el mayor ≤ `max` (como el nativo).
9. **«Sin elegir»** (`modelValue: null`): sin asa ni relleno, el riel en trazos y `labels.empty` junto a la etiqueta. Es para **escalas y encuestas**: un asa en el 5 por defecto ancla la respuesta y se envía sin que nadie la haya elegido. El nativo cubre todo el riel (el lector lo encuentra); el primer toque o clic pone el valor ahí; ↑/→ desde vacío da `min` y ↓/← da `max` (como el arco de `GTimeField`), Inicio/Fin los extremos. Medido: enviar sin elegir bloquea, el resumen enlaza al asa, ↑ da 0 y el error se va.
10. **Envío**: el nativo **no lleva `name`**; un `<input type="hidden">` por asa lleva el canónico (`String(número)`, `""` sin elegir); en un rango, **dos entradas con el mismo nombre** en orden inicio, fin (como un oculto por valor en `GCombobox multiple`). `disabled` con el campo; presente en solo lectura (#266). Medido: `volumen="40" dolor="1" precio="800" precio="2400" edad="30" edad="45"`, sin `brillo` (deshabilitado).

**Teclado (APG)**

11. | Tecla | Acción |
    | --- | --- |
    | → / ↑ | + `step` (con `snap="marks"`, la marca siguiente) |
    | ← / ↓ | − `step` |
    | ← / → en RTL | **Siguen la dirección visual**: ← sube, → baja (medido); ↑/↓ no cambian. Resuelve la discrepancia del nativo entre motores |
    | Mayús+flecha, Re Pág / Av Pág | ± paso grande: `bigStep` o una décima del recorrido en pasos enteros (al menos un paso; con marcas, dos marcas) |
    | Inicio / Fin | Los límites **del asa** (en un rango, el inicio llega hasta el fin − `minGap`) |
    | En un límite | Nada cambia (A y B: el tope, punto 39) |
    | Tab | Una parada por asa, en orden inicio → fin, sea cual sea su posición |
    | Rueda | Nada (desplaza la página) |

    Medido en los tres motores: → ↑ ← Mayús+→ Re Pág Av Pág ↓ Inicio Fin → = 45 50 45 55 65 55 50 0 100 100.
12. **Eventos**: `update:modelValue` en cada cambio; **`change` una vez por gesto** (al soltar la tecla o el puntero, o por cada ajuste del lector), como `GNumberField` (#310). Medido: nueve pulsaciones con cambio = nueve `change`; un arrastre de seis pasos = uno.
13. **Anillo de foco por modalidad, no por `:focus-visible`** (amplía #441): medido en **los tres motores**, el range enfocado por el componente tras un clic **sí** casa con `:focus-visible`, así que el anillo saldría al hacer clic. Se pinta con `data-g-key-focus`: al recibir el foco si la última entrada fue una tecla (Tab, o Intro en el enlace del resumen de errores) y al pulsar una tecla de navegación con el foco dentro; se quita con cualquier `pointerdown`. Medido: sin anillo tras el clic, con anillo al pulsar →, al llegar con Tab y con Intro en el resumen.
14. **Safari y Tab**: WebKit, como Safari sin «Tab resalta cada elemento», **salta el range con Tab** (medido), igual que casillas, radios y botones; Opción+Tab llega. `tabindex="0"` lo forzaría (medido), pero rompería la coherencia con `GCheckbox`, `GRadioGroup` y `GBtn`, que siguen la preferencia del sistema: no se fuerza (L7).

**Puntero y táctil**

15. **Ratón y lápiz**: pulsar en el riel lleva el asa más cercana a ese punto (se desliza con `--g-duration-press` y `--g-ease-out`; desde «sin elegir» aparece en su sitio) y el arrastre sigue; pulsar el nombre de una marca da su valor exacto. El foco va al asa sin desplazar (`preventScroll`); `mousedown` se anula para que el foco no salte al cuerpo, **sin** anular `pointerdown` (el navegador debe saber que fue puntero).
16. **Táctil**: sobre el asa, el arrastre empieza en el acto; **sobre el riel, el valor salta solo con un toque** (movimiento ≤ 10px); un gesto vertical **desplaza la página** (`touch-action: pan-y`) y uno horizontal empieza a arrastrar. Medido: un gesto vertical sobre el riel no cambia el 40; un toque lo lleva al 20. Es el fallo que más se repite en móvil: cambiar un valor sin querer al desplazar un formulario.
17. **Áreas**: asa visual de `space × 5` (20px), área ≥ 24 × 24 (≥ 44 × 44 con puntero grueso, medido en Chromium y WebKit con toque); alto del área = la caja de `GInput` (`space × 9`, 44px gruesa), así el riel se centra con sus vecinos de fila.
18. **WCAG 2.5.7** (arrastres): todo lo que se arrastra tiene un gesto de un solo toque (riel, marca, columna, número de la cinta) y teclado.

**Rango de dos asas**

19. **No se cruzan; se detienen** (APG): el inicio llega hasta el fin − `minGap` y el fin baja hasta el inicio + `minGap` (`minGap` 0 por defecto: pueden coincidir). Sin empujar a la otra asa (sorprende y cambia un valor que no se tocó).
20. **Asas juntas**: un puntero que las agarra a la vez mueve **la que pide la dirección del gesto** (hacia arriba, el fin; hacia abajo, el inicio). Medido en los tres motores. Fuera del empate, la más cercana al punto pulsado.

**Marcas y rejilla**

21. `marks: true` dibuja una raya por paso (≤ 25 pasos) o por paso grande; `marks: [{ value, label }]` además nombra; los nombres son `aria-hidden` y entran en `aria-valuetext` cuando el valor cae en ellos; se pueden pulsar. Los extremos se alinean al borde para no salirse.
22. **`snap: 'marks'`**: la rejilla son las marcas (10 · 25 · 50 · 100 resultados por página); las flechas van de marca en marca (medido 25 → 50 → 100 y se queda).

**Idioma y dirección**

23. **`locale`** como `GNumberField` (#310): prop › `lang` del ancestro más cercano › navegador, al montar (SSR: canónico hasta montar). Medido con `es-MX`: «72.4 kg», «$800 – $2,400», «30 a».
24. **El riel sigue la dirección de la página**: el mínimo en el inicio lógico (a la derecha en RTL, medido: el 40 % a 40 % desde la derecha); posiciones con propiedades lógicas; 320px sin desbordamiento en LTR y RTL.

**Formulario y estados**

25. **`GForm`**: `useFormField` (nombre, `errors[name]`, marca, `readonly`/`disabled` heredados, `focusout`); un cambio de valor es **cambio** (`notifyChange` al acabar el gesto), no escritura. Con error: `aria-invalid`, mensaje con icono Lucide `circle-alert` y prefijo oculto, enlace del resumen al **primer asa**; el foco del envío va al resumen y su enlace lleva al asa (medido).
26. **`GFormRow`**: tres hijos por subgrid (cabecera · fila · pie), como `GInput`. Medido a 1100 y 720px: centro del riel = centro de la caja de `GNumberField` y de `GInput` (Δ ≤ 1px), bordes inferiores de las etiquetas alineados. A 320px la fila se parte sin desbordar. Mínimo en la fila: L9.
27. **Solo lectura**: enfocable, `aria-readonly`, ni teclado ni puntero cambian el valor, se envía; relleno y asa en `text-muted`. **Deshabilitado**: `disabled` en el nativo (fuera del Tab) y en el oculto (no se envía).
28. **Estados medidos**: sin elegir · con valor · foco por teclado · arrastrando · saltando · rango · asas juntas · marcas con nombre · rejilla de marcas · solo lectura · deshabilitado · error y resumen · envío · en una fila · RTL · 320px · puntero grueso · movimiento reducido.

**Fronteras**

29. **`GNumberField`**: la cifra exacta, sin límites o con muchos dígitos (peso al gramo, una dosis prescrita) se **escribe** en `GNumberField`; el deslizador es para un valor acotado donde manda la posición. Juntos, con el mismo `v-model` en una `GFormRow` (caso 2, medido Δ 0): el deslizador da la proporción y el campo la cifra. `number-field.md` ya remite aquí.
30. **`GRadioGroup`**: hasta ~7 opciones con nombre propio (Bajo · Medio · Alto) son una elección: radios. El deslizador, para magnitudes con muchos pasos o donde la distancia importa.
31. **`GProgress`/`GMetric`**: magnitudes de solo lectura, no controles. **Vertical**: reservado (`orientation`), sin caso en formularios.

## Los tres conceptos

Los tres comparten la base entera (nativo por asa, teclado, «sin elegir», envío, `GForm`, RTL); cambian la **forma** y el **gesto**. Con los tokens del tema por defecto (`accent` #0B63CE, Instrument Sans).

### A · La cinta

**Lo que se ve**: el valor grande y quieto («72.4 kg», `title-lg`) sobre una **aguja** fija en el centro; debajo, una **regla que se arrastra** como una cinta métrica (rayas por paso, números en los pasos grandes, bordes que se funden); una barrita de situación en todo el recorrido. Arrastrar a la izquierda sube.

- **Cada paso mide lo mismo en cualquier ancho** (`pxPerStep`, 10–12px): con el dedo se llega a cada valor de 30 a 200 kg con décimas (1701 valores) en 320px, que en un riel serían 5 por píxel.
- **Ajuste fino**: alejar el puntero más de 48px de la cinta mientras se arrastra mueve a ¼ (aparece «Ajuste fino»). Medido: 50px = 5 pasos; lejos, 40px = 1 paso.
- **Tocar un número** de la regla lo lleva a la aguja (se desliza con `--g-duration-slow`). Teclado de la base. **Tope** al llegar al límite.
- **Solo valor único**: con `range` cae a la base.

**Gana**: precisión con el dedo sin depender del ancho; el valor nunca bajo el dedo. **Arriesga**: arrastrar «al revés» sorprende con ratón; no muestra todo el recorrido de un vistazo (la barrita lo suple a medias); sin rango; más alto (lectura + cinta 56px).

### B · El valor es el asa

**Lo que se ve**: el asa es una **píldora con la cifra** («$800») en `accent` con texto `on-accent` y filo `accent-text` (§7.1), sobre una raya `accent-text` (#439). Su ancho es el del texto más largo posible (medido: igual a 0 %, 40 % y 100 %), así no baila; el recorrido se recoge media píldora a cada lado para que nunca se salga.

- **Las dos píldoras se funden** cuando se alcanzan: en vez de montarse, se juntan en una cápsula «18 a | 24 a» con una raya entre las dos mitades; cada mitad sigue siendo su asa (foco, nombre, teclado). Medido: sin solape (Δ ≤ 1px entre bordes) y vuelven a ser dos al separarse.
- **El tramo se arrastra entero**: agarrar la raya entre las dos píldoras mueve las dos y conserva la anchura (medido: 1600 antes y después). Es el gesto de «el mismo margen de precio, un poco más caro».
- **Teclear la cifra**: con el foco en una píldora, «3 5» y una pausa (900 ms) o Intro lleva al 35; mientras, la píldora se vuelve campo (superficie y cursor); Esc anula; una cifra fuera de los límites va al límite con el tope. Precisión de teclado sin un segundo control.
- Área de la píldora ≥ 44 de ancho y ≥ 24 de alto (44 gruesa); el alto del área es el de `GInput`.

**Gana**: el valor está donde se mira y donde se toca; resuelve el empate y el solape de las asas; sirve para valor único y rango en cualquier escala; mide lo que una caja de `GInput`. **Arriesga**: con formatos largos la píldora come recorrido (72px para «$5,000» en 288px); teclear la cifra no se descubre solo (es un extra; con lector, el teclado de la base); un movimiento nuevo (el radio al fundirse).

### C · Escalones con datos

**Lo que se ve**: el riel desaparece; en su lugar, **una columna por valor** (≤ 40 pasos) o, con `distribution`, **una por tramo de los datos** (cuántos productos hay a cada precio). Las columnas elegidas se pintan en `accent-text` y las demás en `border-control` (≥ 3:1 las dos, medido); una raya vertical con su asa abajo marca el valor. Para una escala sin datos, `profile="rise"`: once columnas que crecen de 0 a 10.

- **Dice la consecuencia**: bajo las columnas, «281 de 480 productos»; el mismo texto va en `aria-valuetext` («$5,000; 337 de 480 productos»): quien usa lector oye lo que su elección deja dentro al moverla.
- **Tocar una columna** elige su valor (medido: la columna 7 da 7 y pinta ocho). Teclado de la base; las marcas con nombre debajo.

**Gana**: el control enseña la escala y los datos antes de tocar; menos intentos a ciegas en un filtro; una escala clínica se lee de un vistazo. **Arriesga**: su mejor versión necesita datos de la aplicación (sin ellos es una barra segmentada); un valor continuo fino solo con teclado (las columnas son tramos); más alto (72px) y con 24px por columna como suelo (once columnas a 320px = 24,4px).

## Comparativa

| | Base | A · La cinta | B · El valor es el asa | C · Escalones con datos |
| --- | --- | --- | --- | --- |
| Qué se mueve | El asa | La escala; el valor queda fijo | El asa, que es el valor | La frontera de lo pintado |
| Valor a la vista | Junto a la etiqueta | Grande, sobre la aguja | Dentro del asa | Junto a la etiqueta + consecuencia |
| Rango | Sí | No | Sí, con fusión y tramo arrastrable | Sí, bloque de columnas |
| Precisión con el dedo | Ancho / pasos | Paso fijo + ajuste fino | Ancho / pasos + teclear la cifra | Una columna por paso |
| Alto del área | 36px (44 gruesa) | 56px + lectura | 36px (44 gruesa) | 72px |
| Datos de la aplicación | — | — | — | `distribution` y su texto |
| Mejor para | — | Un valor con muchos pasos | Cualquier escala, valor o rango | Escalas cortas y filtros con datos |
| Movimiento propio | Salto | Cinta que se desliza, tope | Fusión, tope, píldora que se vuelve campo | Columnas que se pintan |
| Coste | — | Medio | Medio | Medio (y los datos) |
| Riesgo principal | Genérico | Arrastre al revés; sin rango | Ancho de la píldora con textos largos | Sin datos es solo una barra |

## Recomendación

**B como forma por defecto de `GSlider` (valor único y rango); C como apariencia (`appearance="steps"` con `distribution`) en una segunda entrega; A reservada (`appearance="tape"`) para un valor con muchos pasos si un producto la pide.**

- **B** porque ataca los tres fallos reales del riel (el valor escondido, las asas que se montan, la precisión) sin cambiar el tamaño ni el gesto que la gente ya conoce: mide lo que una caja de `GInput` y entra en cualquier `GFormRow`.
- **C** porque en filtros y escalas clínicas decir la consecuencia y enseñar la escala ahorra intentos; pero necesita datos de la aplicación y es más alto, así que es una apariencia, no el defecto.
- **A** porque es la mejor con el dedo para un valor fino (peso, temperatura, dosis aproximada), pero sin rango y con un gesto que sorprende con ratón.

## Qué lo hace distinto

El deslizador genérico es una bolita sobre una raya que tapa el valor, se monta en los rangos y cambia sin querer al desplazar en el móvil. El de Grana:

- **El valor es el asa** (B): la cifra vive dentro de lo que se arrastra, del ancho de su texto más largo, y nunca hay que buscarla en un globo ni queda bajo el dedo.
- **Las asas se funden en vez de montarse** (B), y la dirección del gesto decide cuál se mueve cuando coinciden (base): se acabó adivinar qué asa agarraste.
- **El tramo se mueve entero** (B): «el mismo margen de precio, un poco más caro» es un gesto, no dos.
- **Se teclea la cifra** (B): «35» lleva al 35 sin un segundo campo.
- **Tocar no es desplazar** (base): en el móvil, solo un toque o un arrastre horizontal cambia el valor; el gesto vertical desplaza la página.
- **«Sin elegir» de verdad** (base): una escala de dolor no empieza en 5; se ve vacía, se dice «Sin elegir» y no se envía como si alguien la hubiera elegido.
- **Dice lo que deja dentro** (C): «281 de 480 productos» a la vista y en lo que oye el lector.
- **Nativo por dentro** (base): el ajuste de los lectores móviles funciona sin simular teclas, y el teclado es igual en los tres motores (que con el nativo a secas no lo es en RTL).

Ninguna sacrifica accesibilidad: cada gesto nuevo tiene su alternativa de un toque y de teclado, contraste medido y nada se mueve con `prefers-reduced-motion`.

## Comprobaciones

`node design/lab/slider/r01/verificar.mjs` · 2026-10-07 · **228/228**.

| Motor | Base | A | B | C |
| --- | --- | --- | --- | --- |
| Chromium | 42/42 | 10/10 | 16/16 | 9/9 |
| Firefox | 39/39 | 10/10 | 16/16 | 9/9 |
| WebKit | 42/42 | 10/10 | 16/16 | 9/9 |

Firefox sin las tres táctiles (Playwright no emula toque allí). En WebKit, Tab salta el range (punto 14): la comprobación del anillo usa Opción+Tab.

Por motor: nativo `type=range step=any` sin `name` y del tamaño del interior del asa; `aria-valuetext` con idioma y marca; rol y nombres (`slider` «Volumen de los avisos», `group` «Precio», «Precio mínimo»/«máximo»); límites dinámicos 2300/900; ocultos canónicos; secuencia de diez teclas; `change` por pulsación y uno por arrastre; rango que se detiene (Fin, Inicio, flechas); `snap="marks"`; clic en el riel (75), arrastre (45), clic en «Moderado» (5); anillo: no tras clic, sí con →, con Tab (Opción+Tab en WebKit) y con Intro en el resumen; ajuste del lector (+1 paso); solo lectura; deshabilitado fuera del foco; sin elegir (valuetext, sin relleno, envío bloqueado, resumen, ↑ = 0, el error se va); `FormData`; fila a 1100 y 720px (Δ ≤ 1px) y 320px sin desbordar; RTL (posición, ← sube, 320px); táctil (área ≥ 44, `pan-y`, vertical no cambia, toque salta; Chromium y WebKit); movimiento reducido sin deslizamiento; consola limpia. A: lectura = valuetext, aguja centrada, arrastre, ajuste fino, toque en un número, teclado, tope, contraste (aguja ≥ 3:1, lectura ≥ 4,5:1), 320px. B: fusión sin solape, texto = valuetext, separación, ancho fijo, dentro del riel, tramo que conserva la anchura, teclear (Intro, pausa, Esc, fuera de límites), empate en las dos direcciones, contraste (texto ≥ 4,5:1, filo y raya ≥ 3:1), área ≥ 44 × 24, RTL a 320px. C: once columnas crecientes, sin elegir, toque en columna, teclado y marca, consecuencia en pantalla y en valuetext, reparto de los datos, contraste de columnas ≥ 3:1, RTL a 320px.

**Notas del nativo a secas** (salida de `verificar.mjs`): en los tres motores Re Pág = +100 en 0–1000 y → = +1; `readonly` + → = 51; paso 5 con `min` 23 convierte 50 en 48; RTL + → = 49 en Chromium y Firefox, **51 en WebKit**.

**No comprobado:** lector de pantalla real (VoiceOver macOS e iOS, NVDA, TalkBack): el ajuste «ajustable» sobre el nativo invisible, la lectura de `aria-valuetext` con la consecuencia de C, los nombres del rango, `aria-readonly` en un range (Chromium podría no exponerlo, como en `spinbutton`); táctil real (el `pan-y` con un desplazamiento real, la pulsación sobre la píldora, el arrastre del tramo); `forced-colors` (reglas escritas en `slider.css`, sin medir); zoom 200 %; tema oscuro y un tema distinto al por defecto; IME al teclear la cifra en B; idiomas con cifras propias en B (el motor acepta arábigo-índicas, sin caso).

## Hallazgos para lima

| # | Tema | Propuesta |
| --- | --- | --- |
| L1 | Nombre y contrato | `GSlider`, contrato `design/contracts/slider.md`, prefijo `g-slider`. Componente complejo (teclado compuesto de dos asas, motor propio): coco y bruno en Opus |
| L2 | Motor | Utilidad interna `utils/slider.js` (no exportada, con su prueba), sin estado ni DOM: rejilla, `snap`, `move`, `limits`, `bigStep`, `keyAction` (RTL), `format`, `valueText`, `pick` (empate), cifras del idioma. `engine.js` es la referencia de comportamiento |
| L3 | Props | `modelValue` (`Number \| null`, o `[Number, Number]` con `range`), `range`, `min` (0), `max` (100), `step` (1, > 0), `bigStep`, `minGap` (0), `marks` (`Boolean \| Array<{ value, label? } \| Number>`), `snap` (`'step' \| 'marks'`), `locale`, `format` (opciones de `Intl.NumberFormat`), `valueText` (Function), `labels` (`{ start, end, empty }`, sin valores por defecto, #226), `name`, `label`, `hint`, `error`, `required`, `mark`, `readonly`, `disabled`, `id`, `color` (familia del relleno), y `appearance` si se adopta C/A. **No existen**: `tooltip`/`showValue` (el valor siempre se ve), `inverted`, `vertical` (reservado `orientation`) |
| L4 | Eventos | `update:modelValue` en cada cambio; `change` propio y declarado, una vez por gesto (punto 12) |
| L5 | Semántica | Puntos 1 a 6 y 10: nativo `step="any"` por asa, invisible y del tamaño del interior del asa, sin `name`; `min`/`max` = límites del asa; `aria-valuetext` siempre; `group` en el rango; ocultos canónicos con el mismo nombre por asa |
| L6 | Anillo de foco | Ampliar #441 / `utils/keyFocus.js`: para este control el anillo **no** puede venir de `:focus-visible` (los tres motores lo marcan tras el foco por script de un clic); regla por **modalidad** (cualquier tecla que no es modificador marca; `pointerdown` desmarca), distinta de la de #396 (solo teclas de navegación): con la de #396, Intro en el enlace del resumen dejaría el asa sin anillo. Decidir si la regla vale para `keyFocus.js` o se queda en el deslizador |
| L7 | Safari y Tab | Seguir la preferencia del sistema como `GCheckbox`, `GRadioGroup` y `GBtn` (sin `tabindex="0"`); documentarlo en el README |
| L8 | Envío del rango | Dos entradas con el mismo `name` en orden inicio, fin (alternativa: `name` + sufijos; peor para `FormData.getAll`) |
| L9 | Mínimo en `GFormRow` | Publicar con `setIntrinsicMin` (#271) el mayor entre `space × 40` y: la suma de los nombres de marcas + `space × 2` entre cada uno (base: 144px para «Sin dolor · Moderado · El peor»); en B, dos píldoras + `space × 4` (rango) o tres píldoras (valor único); en C, 24px por columna. Recomendación de receta: `g-form-w-lg` |
| L10 | Tokens | Ninguno nuevo. Riel `border-control`; relleno `{color}-text` (forma sin par, #439); base: asa `surface` con filo `text` (`{color}-text` con `color`); B: píldora `{color}` + texto `on-{color}` + filo `{color}-text` (§7.1); C: columnas `{color}-text` / `border-control`; aguja de A `{color}-text`. Contrastes medidos en el tema por defecto |
| L11 | Movimiento | Salto: `--g-duration-press` + `--g-ease-out` (sin muelle: #299 (1) exige decisión para un uso nuevo); A: cinta con `--g-duration-slow`; tope con keyframes `g-slider-bump…` (amplía #299 (5), como P3 de #313, `space × 0.5`); B: radio de la fusión con `--g-duration-press`. Con movimiento reducido no se desplaza nada (#299 (3)) |
| L12 | Constantes de JS | `TAP` 10px (toque frente a gesto), `FINE_AT` 48px y `FINE` ¼ (A), `TYPE_MS` 900 (B): neutras, como `HOVER_MS` (#187) |
| L13 | Paquete | Estimar el peso de base + B; con el tope de 8 KB de #328, decidir paquete principal o entrada propia |
| L14 | Valores de la aplicación | Fuera de la rejilla: se conserva (#157), el paso cae en la rejilla; fuera de límites: se dibuja en el extremo, modelo intacto, aviso; rango desordenado o mal formado: aviso. Sin elegir sin `labels.empty`: aviso |
| L15 | Porcentaje | Documentar `format: { style: 'unit', unit: 'percent' }` (el modelo 40 es «40 %»); `style: 'percent'` de `Intl` espera fracciones |
| L16 | Iconos | Solo el `circle-alert` del mensaje (`GLibIcon`, como `GInput`); ninguno en el control |
| L17 | Reservas | `orientation="vertical"`; `clearable` (volver a «sin elegir»); `appearance="tape"` (A) y `appearance="steps"` + `distribution` + `countText` (C) según la elección; editor `between` de `GFilterBar`; arrastre de extremos en `GTimeField` C |

## Pregunta de producto

Una sola: **la forma por defecto** (las demás decisiones derivan de APG, WCAG y los contratos).

> ¿Qué forma tiene el deslizador por defecto?
> - **B · El valor es el asa** (recomendada): la cifra dentro del asa, las asas se funden, el tramo se arrastra, se teclea la cifra.
> - **B + C**: B por defecto y C (escalones con datos y consecuencia) como apariencia para escalas cortas y filtros.
> - **C · Escalones con datos**: columnas por valor o por reparto, con «281 de 480 productos».
> - **A · La cinta**: la escala se mueve bajo una aguja fija; solo valor único.
