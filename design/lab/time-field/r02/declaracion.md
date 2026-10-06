# Declaración — campo de hora (`GTimeField`, nombre de trabajo), r02: tres conceptos de forma

> kiwi, 2026-10-06. Prototipo: `index.html?c=A|B|C` sobre la base de r01 (`../engine.js`, `../field.js` = `XTimeField` sobre el `GInput` real) y `concepts.js`, con componentes reales de `dist/` (`GInput`, `GDatePicker`, `GFormRow`, `GForm`, `GBtn`) y los **tokens del tema por defecto** (`concepts.css`, solo `var(--g-*)`). La base (spinbutton de texto, escritura libre, pasos con medianoche, modelo `HH:mm`, envío canónico, a. m./p. m.) es **común a los tres y no se repite**. Verificación: `../verificar.mjs`, cifras en «Comprobaciones».

---

## A · La hora dicha

**Estructura.** El campo de r01, sin selector. La hora **mide su texto** (espejo invisible en la misma celda, como P1 de `GNumberField`, #313) y detrás, a la separación de la caja (**8px** en `md`, medido en los tres motores), va la **lectura**: la franja del día en palabras de `Intl` (`dayPeriod: 'long'`, CLDR; sin `labels`): «9:30 · de la mañana», «12:00 · del mediodía», «21:30 · de la noche». Mientras se escribe algo que aún no es la forma final, la lectura antepone la hora entendida («930» → «9:30 · de la mañana»). La lectura es `aria-hidden`: el lector la oye en el valor (`aria-valuetext` = «21:30, de la noche»; en 12 h, «9:30 de la noche», el formato de `Intl` con la franja larga).

**Comportamiento.**
- **Se escribe como se dice.** Además de lo de r01, entran las palabras de las franjas del idioma: «9 noche» → 21:00, «7 de la tarde» → 19:00, «3 madrugada» → 3:00, «mediodía» → 12:00. Gana la lectura (h u h+12) que cae en la franja o, si ninguna cae, la más cercana a ≤ 2 h (CLDR pone las 19:00 «de la tarde», pero «7 de la noche» se dice). `inputmode="text"` (hacen falta letras).
- **La otra lectura, a un toque.** Una hora a secas de 1 a 11 (o de 1 a 12 en 12 h) muestra al final de la caja **las dos lecturas** («de la mañana» | «de la noche»), con la elegida marcada (`aria-pressed`). En 24 h se elige la literal (9 → 9:00) **pero se ofrece la otra**, porque en voz alta «a las 9» es de mañana o de noche; en 12 h, la regla 12 de r01. Botones fuera del Tab y en el árbol, con la hora en el nombre («21:00 de la noche»), que no mueven el foco; desaparecen al salir. Con teclado: escribir «noche» o «p».
- Sin selector, sin diálogo: la base entera (pasos, medianoche, envío) sigue igual.

**Movimiento.** Cuando la franja cambia mientras se edita (↑ que cruza las 12:00: «de la mañana» → «del mediodía»), la lectura **entra desde abajo** (`--g-space-1`, `--g-duration-press`, `--g-ease-out`): se nota el cambio de mitad del día justo cuando ocurre. Las dos lecturas aparecen igual. Nada al montar ni al salir. Movimiento reducido: el texto cambia en su sitio (medido: 0 animaciones).

### Qué lo hace distinto (A)

Los campos de hora tratan a. m./p. m. como un interruptor que hay que acordarse de tocar, y el error más caro de una hora (una toma a las 9 de la noche registrada a las 9 de la mañana) nace ahí. A **devuelve la hora como la diría una persona**, «9:30 de la noche», pegada al número y en el idioma de la página sin un solo texto de la aplicación; deja escribirla también así; y cuando lo escrito puede ser de mañana o de noche **lo dice y ofrece la otra lectura** en vez de elegir en silencio. No añade un control: el campo sigue siendo un campo, del alto de un `GInput`.

### Gana y arriesga

- **Gana:** el más rápido (sin abrir nada); el único que ataca el error de mañana/noche en su origen, también en 24 h; cero textos nuevos para la aplicación (todo sale de `Intl`); mismo alto y misma fila que `GInput` (Δ 0 junto a `GDatePicker`); coste bajo.
- **Arriesga:** **descubribilidad** de escribir palabras (la ayuda debe decirlo); las franjas de CLDR varían por idioma y a veces sorprenden (en `en` las 0:00 son «in the morning», en `ar` «في المساء»; no hay «medianoche» en `es`); las palabras solo se entienden en el idioma de la página; con prisa en táctil, sigue haciendo falta el teclado (no hay «elegir»).

### Medidas (A)

| Medida | Resultado |
| --- | --- |
| Escritura en palabras | «9 noche» 21:00 · «7 de la tarde» 19:00 · «mediodía» 12:00 · «3 madrugada» 3:00 · «930» 9:30 (tres motores) |
| Dos lecturas | «9» → 09:00 marcada y 21:00 ofrecida; un toque → 21:00 con el foco en el campo; fuera del Tab; nombre con la hora |
| Lectura pegada | 8px del texto (la separación de la caja), `aria-hidden`; `aria-valuetext` «21:30, de la noche» |
| Movimiento | Animación al cruzar a «del mediodía» con ↑; 0 con `reduce` |
| Fila con `GInput` y `GDatePicker` | Δ `top` y alto ≤ 1px |
| Contraste | Lectura (`text-muted`) ≥ 4.5:1 (Chromium) |

**Coste:** bajo (el espejo de `GNumberField` y una tabla de franjas de `Intl`).

---

## B · Rejilla del día

**Estructura.** El campo de r01 más un **botón al final de la caja** (cuadrado del alto de la caja, `chevron-down` en el prototipo, **`clock`** propuesto, L19) que abre un **diálogo no modal** (`role="dialog"`, `popover="manual"`, patrón *Date Picker Dialog* de APG, como `GDatePicker`; hoja inferior a ≤ 520px). Dentro:
1. **Habituales** (`suggestions` de la aplicación, `{ time, label? }`: «8:00 Desayuno», «14:00 Comida», «22:00 Antes de dormir»; «Ahora» si la aplicación da `labels.now`): botones de un toque.
2. **El día**: `role="grid"` de **cuatro filas de seis horas** (0–5, 6–11, 12–17, 18–23), cada fila con su `rowheader` (textos de la aplicación, `labels.rows`: Madrugada · Mañana · Tarde · Noche); cada hora es un botón con la hora del idioma y nombre completo («8:00, de la mañana», + «ahora» en la hora actual, marcada también con un punto).
3. **Los minutos** de la hora elegida, que **se despliegan** debajo según el paso (0 · 15 · 30 · 45 con `step` 15; de 5 en 5 con pasos menores y una nota «para un minuto exacto, escríbelo»).

**Comportamiento.** Alt+↓ desde el campo (o el botón, fuera del Tab, `aria-haspopup="dialog"`, `aria-expanded`) abre con el foco en la hora actual del valor, en `min` o en la de ahora. **Una sola parada de Tab** por rejilla; flechas en 2D (espejadas en RTL), Inicio/Fin de fila; Intro despliega los minutos y lleva el foco a ellos; Intro elige, cierra y **devuelve el foco al campo**; Esc en los minutos vuelve a las horas; Esc en las horas cierra. Las horas sin ningún minuto dentro de `min`/`max` (también en un arco de medianoche) van **tachadas** con `aria-disabled` y siguen en el recorrido de flechas (como los días de `GDatePicker`). Abrir no mueve el campo (Δ 0, la capa va en la capa superior). Sigue las reglas de los paneles anclados (#358): lado al abrir, cierre sin devolver el foco si el ancla sale de la vista.

**Movimiento.** El diálogo entra con `--g-duration-press` y `--g-ease-out` (opacidad y `--g-space-1`); los minutos **se despliegan** (`grid-template-rows` 0fr → 1fr, `--g-duration-slow`, `--g-ease-out`). Movimiento reducido: aparecen en su sitio.

### Qué lo hace distinto (B)

Frente a la lista de 48 o 96 horas: **dos toques para cualquier hora** (hora, minuto) sin desplazarse; las horas que esta aplicación usa de verdad **un toque** arriba; y **el día como un lugar**: las 9 de la mañana y las 9 de la noche están en filas distintas con su franja escrita, así que confundirlas exige un error de fila, no de un interruptor. Los límites se **ven** en todo el día (lo tachado), también cuando cruzan la medianoche.

### Gana y arriesga

- **Gana:** el mejor en táctil y para quien no sabe la hora exacta y elige entre las disponibles; habituales de la aplicación; límites visibles; la rejilla da a lectores una estructura conocida (grid de APG) con nombres completos.
- **Arriesga:** **un diálogo más** (foco, capa, hoja móvil, reglas de #358) y el mayor coste; 384 × 318px de superficie a 1000px; dos patrones (escribir y elegir) en un solo campo; una rejilla de 24 + minutos para alguien que solo quería escribir «930»; textos nuevos de la aplicación (`labels.open`, `dialog`, `hours`, `minutes`, `rows`, `suggestions`, `now`, `nowMark`, `exact`); con paso de 1 minuto, los minutos van de 5 en 5 y el exacto se escribe.

### Medidas (B)

| Medida | Resultado |
| --- | --- |
| Apertura | Alt+↓ y el botón; `role="dialog"` con nombre; foco en la primera hora válida; campo Δ 0 |
| Rejilla | 24 horas, una sola parada de Tab; → y ↓ (8 → 9 → 15); con 8:00–18:00, 0–7 y 19–23 `aria-disabled` |
| Dos toques | Intro en 9 → minutos `[0, 15, 30, 45]`; Intro en :15 → 09:15, cierra, foco al campo |
| Esc | Cierra y devuelve el foco |
| Habituales | «13:30» un toque y cierra; «19:00» (fuera de horario) `aria-disabled` y sin efecto |
| Arco 22:00–6:00 | Válidas 0–6 y 22–23 |
| Objetivos | ≥ 24px (horas 45 × 40px); ≥ 44px de alto con puntero grueso (Chromium, WebKit) |
| Móvil 375px | Hoja inferior a todo el ancho, sin desbordamiento |
| Contraste | Mínimo ≥ 4.5:1 (Chromium); hora tachada 5,10:1 |

**Coste:** alto (diálogo anclado, rejilla APG, hoja móvil, colocación).

---

## C · Tramo

**Estructura.** Un grupo (`role="group"` con su leyenda, como `GDatePicker split`) con **dos campos de r01** (inicio y fin, en una `GFormRow` que se parte en estrecho) y, debajo, una **regla del día** (`aria-hidden`): una pista de 24 h con marcas en 0 · 6 · 12 · 18 · 24 (horas de `Intl`) y el tramo pintado en `accent`; si cruza la medianoche, **dos piezas** con el borde recto en el corte. La **duración** va en el `output` del fin (C14: dentro de la caja, `aria-live`, en su descripción): «8 h · +1 día» (duración de `Intl.DurationFormat`; «+1 día» es texto de la aplicación, `labels.nextDay`). Opcional: **duraciones de un toque** (`durations`, en minutos: «+15 min», «+30 min», «+1 h», `GBtn` reales).

**Comportamiento.**
- **El fin acepta una duración**: «+8», «+8:30», «+90m», «+1h30» → inicio + duración (siempre con «+»: «8h» es una hora en francés).
- **Mover el inicio conserva la duración** (la cita de 30 min sigue durando 30 min): convención de las agendas. Cambiar el fin cambia la duración.
- **Un fin anterior al inicio es el día siguiente**, sin error: «+1 día» en el `output` y dos piezas en la regla. Si la aplicación no lo admite, pone su error (Grana no valida).
- Modelo `{ start, end }` (como el rango de `GDatePicker`); envío `name-start` y `name-end` canónicos.

**Movimiento.** El tramo **crece o se encoge** en la regla al cambiar (`inset-inline-start` e `inline-size`, `--g-duration-press`, `--g-ease-out`). Movimiento reducido: salta.

### Qué lo hace distinto (C)

Los frameworks dan dos campos de hora sueltos y dejan la resta a la cabeza de quien llena el turno. C trata el tramo como **una cosa con duración**: se ve cuánto dura y si acaba mañana, se escribe el fin **como se piensa** («+8») y al mover la entrada la salida la acompaña. La medianoche deja de ser un error («el fin es anterior al inicio») y pasa a ser un dato visible.

### Gana y arriesga

- **Gana:** el único que resuelve turnos y citas con duración; medianoche explícita; la duración se oye con el fin; reutiliza dos campos base sin un control nuevo de teclado.
- **Arriesga:** es **otro componente** (o un `mode`), con modelo de objeto; la regla ocupa una línea más; en 12 h cada campo necesita ~224px (mínimo publicado, L8 de r01) y el tramo se apila en estrecho; «conservar la duración» sorprende a quien quería alargar el turno moviendo la entrada (se arregla cambiando el fin después).

### Medidas (C)

| Medida | Resultado |
| --- | --- |
| Grupo | `role="group"` + `aria-labelledby` de la leyenda |
| 22:00–6:00 | «8 h · +1 día»; el `output` describe el fin; dos piezas en la regla |
| «+8:30» en el fin | 06:30 |
| Inicio 22:00 → 21:00 | Fin 05:30 (duración conservada); «8 h 30 min» |
| Fin 23:00 | Sin «+1 día», una pieza |
| «+1 h» | Fin 10:00 desde 9:00 |
| Envío | `turno-start="21:00"`, `turno-end="23:00"` |
| 12 h `es-MX` | Fin «7:00 a.m.», «12 h · +1 día» |
| RTL | La regla empieza a la derecha |
| 320px | Sin desbordamiento (los campos se apilan) |

**Coste:** medio (composición de dos campos, regla, duración).

---

## Comparativa

| | Base (r01) | A · La hora dicha | B · Rejilla del día | C · Tramo |
| --- | --- | --- | --- | --- |
| Pregunta que contesta | — | ¿Es la hora que quise decir? | ¿Qué hora, sin escribir? | ¿Cuánto dura y cuándo acaba? |
| Gestos para «21:30» | Escribir «2130» | Escribir «2130» o «9:30 noche» | Abrir · 21 · :30 (3 toques) o escribir | — (dos campos) |
| Mañana / noche | Regla + a. m./p. m. | **En palabras, y la otra lectura a un toque** | **Filas distintas** | Lo de su campo |
| Horas habituales | — | — | **Un toque** | Duraciones de un toque |
| Duración y medianoche | Pasos que cruzan | — | Límites visibles | **«8 h · +1 día», regla** |
| Alto | El de `GInput` | El de `GInput` | El de `GInput` + diálogo 384 × 318 | Dos campos + regla |
| Textos de la aplicación | `invalid` | `invalid` | + 9 claves | + `nextDay`, `durations` |
| Movimiento propio | — | La franja que entra al cambiar | Minutos que se despliegan | Tramo que crece |
| Coste | — | Bajo | Alto | Medio |
| Riesgo principal | Genérico | Descubrir las palabras | Peso y dos patrones | Otro componente |

## Recomendación

**A como forma por defecto de `GTimeField`, C como modo `range` en una segunda entrega y B como opción (`picker`) en una tercera, solo si un producto la pide.**

- **A** porque la hora casi siempre **se sabe** y lo más rápido es escribirla; su personalidad está en lo que de verdad falla (mañana o noche) y no añade controles, capas ni textos. Mide lo que un `GInput`.
- **C** porque turnos, guardias y citas son la mitad de los usos del dominio y la duración y la medianoche son su problema real; es un **modo** que compone dos campos A (`mode="range"`, modelo `{ start, end }`, como `GDatePicker`).
- **B** porque es el mejor en táctil y con horas habituales, pero es el más caro y el más genérico en forma (un diálogo con una rejilla); como opción `picker` con `suggestions`, sobre A.

## Qué lo hace distinto (resumen de la recomendación)

Un campo de hora **que entiende la hora como se dice y la devuelve en palabras**: «9 noche» se escribe y «9:30 de la noche» se lee, en el idioma de la página y sin textos de la aplicación; cuando lo escrito puede ser de mañana o de noche, lo dice; da la vuelta a la medianoche; y cuando la hora es la mitad de un tramo, dice **cuánto dura y si acaba mañana**.

## Comprobaciones

`node design/lab/time-field/verificar.mjs` · 2026-10-06 · Chromium, Firefox, WebKit · **339 de 339 comprobaciones pasan** (base y conceptos), más **1 no verificable aquí** (pegar en Firefox: el evento sintético llega sin datos).

| Motor | Base | A | B | C |
| --- | --- | --- | --- | --- |
| Chromium | 62/62 | 17/17 | 22/22 | 14/14 |
| Firefox | 60/60 | 17/17 | 20/20 | 14/14 |
| WebKit | 61/61 | 17/17 | 21/21 | 14/14 |

Las diferencias por motor: CDP y contraste solo en Chromium; pegado sintético no en Firefox; puntero grueso solo donde Playwright lo emula (Chromium con `isMobile`, WebKit con `hasTouch`).

**No comprobado:** lector de pantalla real (A: la lectura en `aria-valuetext` y las dos lecturas fuera del Tab; B: la rejilla con `rowheader`, el diálogo no modal y la vuelta del foco; C: el `output` vivo «+1 día» al escribir el fin); teclado virtual real (A usa `inputmode="text"`: comprobar que escribir «930» no es más lento que con el numérico); táctil real (B: hoja, toques de 44px; C: botones de duración); IME; `forced-colors` (reglas escritas, sin medir); tema oscuro y un tema distinto al por defecto; franjas de CLDR en más idiomas y en Safari real (las de `Intl` cambian con la versión del motor); zoom 200 %.

## Hallazgos para lima

(Siguen a los L1 a L16 de `../r01/declaracion.md`.)

| # | Tema | Propuesta |
| --- | --- | --- |
| L17 | Identidad en `DECISIONS.md` | Registrar la elección del usuario, las semillas descartadas (reloj analógico, rueda tipo iOS) y la reservada (arrastrar los extremos del tramo) |
| L18 | A | Clases `g-time-field__value` (celda con espejo `__mirror`, como `GNumberField` P1), `__reading` (`aria-hidden`), `__choices`/`__choice` (+ `is-on`); con `words` (o siempre, según la elección) `inputmode="text"`; la franja de `Intl` `dayPeriod: 'long'`; regla de palabras «franja o la más cercana a ≤ 2 h»; `aria-valuetext` con la franja; animación con keyframes `g-time-reading…` (reacción a un suceso, #299 (5)), sin `reduce` |
| L19 | B | `picker` (Boolean), `suggestions` (`[{ time, label? }]`), `labels` `open`, `dialog`, `hours`, `minutes`, `rows` (Array de 4), `suggestions`, `now`, `nowMark`, `exact`; diálogo con `popover="manual"`, reglas 1 y 3 de #358 y hoja ≤ 520px como `GDatePicker`; icono **`clock`** en el botón (entra en la lista de la librería, `icons.md` §4; `chevron-down` promete una lista); `aria-keyshortcuts="Alt+ArrowDown"` en el campo (el `spinbutton` no admite `aria-expanded` ni `aria-haspopup`: van en el botón). Peso: probablemente entrada propia (L13) |
| L20 | C | `mode="range"` (o `GTimeRange`, decidir), `modelValue` `{ start, end }`, `labelStart`/`labelEnd` obligatorios, `durations` (minutos), `labels.nextDay`, `labels.durations`; `output` del fin con la duración (`Intl.DurationFormat` con respaldo `NumberFormat` + `ListFormat`); «+duración» en el fin; conservar la duración al mover el inicio; envío `name-start`/`name-end` |
| L21 | Movimiento | Sin tokens nuevos: `--g-duration-press` + `--g-ease-out` (lectura de A, diálogo de B, tramo de C), `--g-duration-slow` + `--g-ease-out` (minutos de B). Ningún uso nuevo de `--g-ease-spring`/`--g-ease-bounce` |
| L22 | Mínimo de C | Cada campo del tramo en 12 h publica su mínimo (L8); el prototipo lo emula con `--g-form-min: 56` (12 h) y `40` (24 h) |

## Preguntas de producto (cuatro)

1. **¿Qué forma es la identidad del campo de hora?** A · La hora dicha, B · Rejilla del día, C · Tramo, o una mezcla. **Recomendación: A por defecto; C como `mode="range"` en una segunda entrega; B como opción `picker` en una tercera, solo si un producto la pide.**
2. **Una hora a secas que puede ser de mañana o de noche, sin ninguna pista** («9» sin marcador, sin hora anterior y sin límites que decidan): (a) se toma la lectura literal o de la mañana (12 = mediodía) **y se ofrece la otra a un toque** (A); (b) se aplica una heurística de horario de oficina (1–6 → tarde, 7–11 → mañana); (c) no se acepta hasta elegir. **Recomendación: (a).** No adivina con una regla de oficina que falla en tomas nocturnas y turnos, y no frena a quien ya sabe lo que escribió. Vale para 12 h y, en A, también para 24 h.
3. **Un tramo cuyo fin es anterior al inicio** (22:00 → 6:00): (a) es el día siguiente, sin error, con «+1 día» a la vista y en el valor accesible; (b) es un error salvo que la aplicación lo permita con una prop (`overnight`). **Recomendación: (a).** Turnos y guardias lo necesitan; donde no tenga sentido, «+1 día» deja el error a la vista y la aplicación pone su mensaje (Grana no valida).
4. **Al mover el inicio de un tramo ya completo:** (a) se conserva la duración (el fin se mueve con él); (b) se conserva el fin (cambia la duración). **Recomendación: (a)**, la convención de las agendas: una cita de 30 min sigue durando 30 min al cambiarla de hora; alargarla es cambiar el fin.
