# Brief — deslizador (`GSlider`, nombre de trabajo), r01: base funcional y conceptos A, B y C

> kiwi, 2026-10-07. Origen: plan de v1, Fase C, punto 10; `PENDIENTES.md` §3 («deslizador: sin ronda; candidato a próximo»); `number-field.md` (tabla de frontera: «elegir un valor de un rango continuo arrastrando → deslizador»).

## Para qué

Elegir un valor **acotado** donde importa la **posición relativa** más que la cifra exacta: el volumen de los avisos, la intensidad del dolor en una escala de 0 a 10, el precio mínimo y máximo de un filtro, la edad de un grupo, una dosis aproximada que luego se afina. Lo usan personas en escritorio con ratón, en móvil con el dedo mientras desplazan un formulario largo, con teclado y con lector de pantalla (también el de un móvil, que no tiene flechas).

## El problema de lo que hay

- **El riel con bolita de los frameworks** tapa el valor con el dedo (se muestra en un globo solo mientras se arrastra), reparte todo el recorrido en el ancho que haya (en 300 px, 1700 valores caben a 5 por píxel), deja montarse las dos asas de un rango sin saber cuál se va a mover, y salta de valor cuando el dedo solo quería desplazar la página.
- **El `<input type="range">` nativo a secas** (medido en los tres motores en el caso 3 de la página): ignora `readonly` (→ cambia el valor), su rejilla cuenta desde `min` (un `min` dinámico para que las asas no se crucen mueve la rejilla: 50 pasa a 48), en RTL la flecha → baja en Chromium y Firefox y **sube** en WebKit, no admite texto ni otra forma dentro del asa, y un rango exige dos nativos superpuestos que se pelean por el puntero.
- **Un `div role="slider"`** lo resuelve todo menos lo que el nativo da gratis: el ajuste de los lectores de pantalla móviles (deslizar arriba/abajo en VoiceOver, las teclas de volumen en TalkBack), que en un `div` depende de que el navegador simule teclas.

## Qué es esta ronda

1. La **base funcional** común a cualquier forma: semántica (APG *Slider* y *Multi-Thumb Slider*), teclado, puntero y táctil, rango que no se cruza, rejilla y marcas, «sin elegir», idioma y RTL, envío, `GForm` y `GFormRow`, frontera con `GNumberField` y `GRadioGroup`. Prototipo con el kit neutro del tema.
2. **Tres conceptos divergentes** que cuestionan la premisa del riel con bolita, con los tokens reales del tema por defecto: **A · La cinta** (se mueve la escala, el valor se queda), **B · El valor es el asa** (la píldora con la cifra; las asas se funden y el tramo se arrastra), **C · Escalones con datos** (el riel son los valores o el reparto de los datos, y se dice la consecuencia). Comparativa y una pregunta de elección.

## Solapes revisados antes de proponer

| Componente | Qué comparte | Decisión |
| --- | --- | --- |
| `GNumberField` | Valor numérico, `locale` (#310), `change` por gesto, envío canónico oculto (#311), tope P3 (#313) | **Frontera**: la cifra exacta, sin límites o con muchos dígitos, se escribe en `GNumberField`; el deslizador es para un valor acotado donde manda la posición. Receta: los dos con el mismo `v-model` en una `GFormRow` (caso 2). Se reutilizan sus reglas (idioma, `change`, canónico), no su caja |
| `GRadioGroup` (`segmented`, `card`) | Elegir en una escala ordenada | **Frontera**: hasta ~7 opciones con nombre propio (Bajo · Medio · Alto) son una elección, no una magnitud: `GRadioGroup`. El deslizador, para magnitudes con muchos pasos o donde la distancia importa |
| `GProgress`, `GMetric` | Una barra con un valor | Solo lectura de una magnitud: no son controles. Un deslizador `readonly` es un valor editable en otro estado (#266) |
| `GFilterBar` (operador `between`) | Rango numérico de un filtro | **Reservado**: su editor podría adoptar el rango de dos asas en una ronda propia |
| `GTimeField` C (tramo) | Arrastrar extremos de un tramo | **Reservado** en `time-field.md` («exige un deslizador doble accesible»): el motor de esta ronda es el que lo haría posible |
| `GTooltip` | Mostrar el valor encima del asa | **No**: el valor está siempre a la vista; un globo que solo aparece al arrastrar es justo lo que se evita |

## Entregables

- `engine.js` (motor: rejilla, pasos, límites de cada asa, teclas, formato, lectura; propuesta de `utils/slider.js`), `slider.js` (`XSlider`: núcleo común y las cuatro formas, con el `useFormField` real de `@grana/vue`), `slider.css` (base con neutros; A, B y C con los tokens del tema por defecto), `lab.css`, `index.html` (`?v=base|A|B|C|compare`, `&dir=rtl`).
- `serve.mjs` y `verificar.mjs` (base y conceptos, tres motores, **puerto 4212**).
- `declaracion.md`: decisiones numeradas, conceptos, comparativa, «Qué lo hace distinto», comprobaciones, hallazgos L1… para lima y la pregunta de producto.

## Ver

`index.html?v=base` (y `&dir=rtl`), `?v=A`, `?v=B`, `?v=C`, `?v=compare`. Verificación: `node design/lab/slider/r01/verificar.mjs` (requiere `npm run build`; `ENGINES=…`, `PARTS=base,A,B,C`, `VERBOSE=1`).
