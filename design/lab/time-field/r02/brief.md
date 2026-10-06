# Brief — campo de hora (`GTimeField`, nombre de trabajo), r02: la forma

> kiwi, 2026-10-06. Continúa `../r01/` (base funcional: un `spinbutton` de texto sobre `GInput`, escritura libre, pasos que cruzan medianoche, modelo `HH:mm`, envío canónico; no se reabre). Regla «conceptos antes que caja» (CLAUDE.md, «Personalidad e innovación»).

## Por qué hay r02

Los frameworks dan dos formas a la hora y las dos fallan a quien la usa:

1. **La lista desplegable de 48 o 96 horas.** Para llegar a las 21:30 hay que desplazarse por 43 opciones; las 9:00 a. m. y las 9:00 p. m. son dos filas casi iguales a 24 posiciones de distancia; la lista no sabe qué horas usa esta aplicación (las de las tomas, las de la agenda) y no dice nada de cuánto dura un turno.
2. **El reloj analógico.** Dos gestos de precisión en un círculo, la mitad del día en un interruptor aparte, y nadie lee una hora así en un formulario. Con teclado y lector es otro control entero.
3. **Una hora suelta.** Muchas horas son la mitad de algo (inicio y fin de un turno, de una cita) y lo que importa es **lo que dura** y si **termina al día siguiente**; los frameworks lo dejan a dos campos sueltos y a la cuenta de cabeza.

Tres conceptos **divergentes**, sobre la base de r01 (el `GInput` real con `XTimeField`) y componentes reales de `dist/` (`GInput`, `GDatePicker`, `GFormRow`, `GForm`, `GBtn`), con los **tokens del tema por defecto**:

| | Concepto | Idea | Qué pregunta responde |
| --- | --- | --- | --- |
| A | **La hora dicha** | Sin selector: se escribe como se dice («930», «9 noche», «mediodía», «7 de la tarde») y la hora vuelve **en palabras**, pegada al número («9:30 · de la noche»). Una hora a secas que puede ser de mañana o de noche ofrece **las dos lecturas** para elegir de un toque | ¿Es la hora que quise decir? |
| B | **Rejilla del día** | Un diálogo con las **horas habituales** de la aplicación arriba y **el día en cuatro filas de seis** (madrugada, mañana, tarde, noche); elegir una hora **despliega sus minutos** según el paso. Dos toques para cualquier hora | ¿Qué hora, sin escribir? |
| C | **Tramo** | Inicio y fin juntos, con **lo que dura** entre los dos («8 h · +1 día») y una **regla del día** que lo pinta; el fin admite una duración («+8:30») y mover el inicio **conserva la duración** | ¿Cuánto dura y cuándo acaba? |

A y B compiten como forma del campo suelto (escribir frente a elegir). C decide otra cosa (un **tramo**) y se apoya en cualquiera de los dos.

## Semillas y qué fue de ellas

- **Lectura en palabras** (`Intl` `dayPeriod: 'long'`, CLDR: «de la madrugada», «del mediodía», «de la noche») → A; además, **escribir** esas palabras.
- **La mitad del día como lugar, no como interruptor** → B (filas por franja: mañana y noche nunca están juntas).
- **Horas habituales que pone la aplicación** → B (`suggestions`), con «Ahora» si la aplicación da el texto.
- **Duración escrita en el fin** («+8») y **conservar la duración al mover el inicio** (convención de las agendas) → C.
- **Reloj analógico** (descartada): precisión de gesto, mitad del día aparte, otro control para el teclado; la rejilla de B da lo mismo en dos toques y con un patrón APG conocido.
- **Rueda tipo iOS** (descartada): desplazar para elegir es justo lo que la lista ya hacía mal; con teclado y lector es un `listbox` por columna.
- **Arrastrar los extremos del tramo sobre la regla** (reservada): sería bonito, pero exige un deslizador doble accesible (2.5.7 lo cubren los campos); la regla de C es solo lectura.

## Ver

`index.html?c=A` · `?c=B` · `?c=C` (añadir `&dir=rtl`; `&now=10:40` fija la hora actual). Verificación: `node design/lab/time-field/verificar.mjs` (`PARTS=A,B,C`; puerto 4212; requiere `npm run build`).
