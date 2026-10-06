# Declaración — campo de hora (`GTimeField`, nombre de trabajo), r01: base funcional

> kiwi, 2026-10-06. Prototipo: `index.html` (motor `../engine.js`, campo `../field.js` = `XTimeField` sobre el **`GInput` real** de `dist/` con sus slots internos `field` y `end`; kit `field.css` con neutros del tema). Verificación: `../verificar.mjs`, **339/339** entre base y conceptos en Chromium, Firefox y WebKit (base: 62 + 60 + 61; cifras en «Comprobaciones»). La forma se decide en `../r02/`; aquí todo deriva de HTML, APG *Spinbutton*, WCAG 2.2 y los contratos vigentes, y **no hay preguntas de producto**.

## Anatomía

```
raíz = la de GInput (g-input g-time-field [g-time-field--h12]) — tres hijos: etiqueta · caja · pie
├─ <label id="ID-label" for="ID">Hora de la cita (+ marca de GForm)</label>
├─ g-input__row > g-input__control (data-g-tooltip-box)
│  ├─ [prepend] · [prefijo]
│  ├─ <input id="ID" type="text" role="spinbutton" dir="{del idioma}" inputmode="numeric" autocomplete="off" spellcheck="false"
│  │         aria-valuenow="547" aria-valuetext="9:07" [aria-valuemin="480" aria-valuemax="1080"]
│  │         aria-required="true" [aria-readonly="true"] aria-describedby="ID-suffix ID-hint ID-message">   ← SIN name
│  ├─ <input type="hidden" name="cita" value="09:07">                                                       ← canónico
│  ├─ [sufijo: «CDMX» + «hora del centro de México»] · [output]
│  └─ solo 12 h y sin readonly: <span g-time-field__halves>
│        <button type="button" tabindex="-1" aria-pressed="false" aria-controls="ID" aria-labelledby="ID-am ID-label"><span id="ID-am">a.m.</span></button>
│        <button type="button" tabindex="-1" aria-pressed="true"  aria-controls="ID" aria-labelledby="ID-pm ID-label"><span id="ID-pm">p.m.</span></button>
└─ g-input__support: ayuda · región de mensaje (siempre presente)
```

## Decisiones

**Semántica**

1. **Un solo campo de texto, no segmentos.** `<input type="text" role="spinbutton">`. Ni `type="time"` (inconsistente entre motores, formato del sistema y no de la página, `min`/`max` sin medianoche), ni tres `spinbutton` (hora · minuto · a. m./p. m.: tres paradas que el lector lee por separado, no se puede escribir «930» ni pegar «09:30» de una vez, segmentos de 20px en móvil y un orden que cambia con el idioma), ni `combobox` (una hora se **escribe**; la lista de 48 es lo que r02 cuestiona). APG *Spinbutton*: un valor de un conjunto discreto y ordenado, que es lo que es una hora con paso.
2. **Valor accesible.** `aria-valuenow` = **minutos desde las 00:00** (segundos con `seconds`), `aria-valuetext` = la hora en el formato del idioma **siempre que hay valor** («9:07», «9:30 p.m.», «٩:٣٠ م»): un lector diría «547» sin él. `aria-valuemin`/`aria-valuemax` solo si `min ≤ max`; con un arco que cruza la medianoche (22:00–6:00) **no se ponen** (ARIA no tiene rangos circulares). Medido en Chromium: sin ellos expone `valuemin 0`/`valuemax 0` (por defecto del rol, mismo límite que `GNumberField`); el `valuetext` sigue diciendo la hora. Vacío: sin `valuenow` ni `valuetext`. Texto sin interpretar: `aria-valuetext` = lo escrito («99:99»), para que el lector diga lo que hay en la caja.
3. **Compone `GInput`** con los slots internos `field` (el `<input>` y el oculto) y `end` (a. m./p. m.), igual que `GNumberField` (#309): caja, etiqueta con `id`, pie, mensaje, `output`, prefijo/sufijo, contexto de `GForm`, `is-ready`, `is-rejected`, colocación en `GFormRow` y la caja visible `data-g-tooltip-box` (#395) vienen de `GInput`. Prototipo: `XTimeField` usa ese mecanismo sobre el `GInput` real y todo lo anterior funciona sin código propio.

**Modelo y envío**

4. **Modelo = cadena `"HH:mm"` (o `"HH:mm:ss"` con `seconds`) o `null`.** 24 h, con cero delante, cifras latinas: el formato de HTML y de ISO 8601 para una hora. **Nunca un `Date`**: es una **hora de pared** (lo que marca el reloj de la pared), sin fecha ni zona; se ordena como texto. Un valor de entrada que no cumple el formato se lee como `null` (aviso de desarrollo).
5. **Grana no valida (#157).** Fuera de `min`/`max` **no se recorta** (la aplicación pone el error; caso «Hora de la cita» con 19:00); fuera de la rejilla de `step` **no se redondea** («9:07» con paso 15 se queda 9:07: puede ser la hora real de una toma). `min`/`max`/`step` limitan y encajan **los pasos** (punto 12).
6. **Envío canónico.** El `<input>` visible **no lleva `name`**; un `<input type="hidden" name>` lleva `"09:07"` (o `""`). `disabled` con el campo; presente en solo lectura (#266). Medido: `FormData` = `toma="08:05"`, `evento="14:05:30"` mientras la caja dice «8:05» y «14:05:30».
7. **El modelo refleja siempre lo escrito.** Al teclear se interpreta en cada cambio: si es una hora, el modelo la toma; si no (vacío, a medias, imposible), el modelo es `null`. Así un envío sin salir del campo (Enter, Safari sin foco en el botón) nunca lleva una hora distinta de la que se ve. El texto **no** se reformatea mientras se escribe (no se roba el cursor); se formatea al salir o con Enter.

**Escritura libre (medida en los tres motores; tabla viva en el caso 1 de la página)**

8. **Filtro al teclear.** Entran cifras (las del idioma y las latinas), separadores `:` `.` `,` espacio y `h`, y las **letras de los marcadores** del idioma (`a`, `p`, `m` y las de «a. m.»/«p. m.», «午前», «오전», «ص»…). Lo demás no entra y el cursor se conserva (medido: «xyz!» → vacío). Durante una composición (IME) no se filtra; se filtra al terminar.
9. **Cómo se interpreta** (regla de kiwi, para `utils/timeInput.js`):

   | Escribe | Se entiende | Regla |
   | --- | --- | --- |
   | `9`, `21` | 9:00, 21:00 | 1–2 cifras = hora |
   | `930`, `0930`, `2130` | 9:30, 9:30, 21:30 | 3 cifras = H MM; 4 = HH MM |
   | `9:30`, `9.30`, `9,30`, `9h30`, `9 h` | 9:30, 9:30, 9:30, 9:30, 9:00 | separador del idioma u otro común; `h` pegada a cifras es separador (francés) |
   | `9.30p`, `9 p. m.`, `9pm`, `오후 9:30`, `٩:٣٠ م` | 21:30… | marcador latino o del idioma, antes o después |
   | `12a`, `12 p. m.` | 0:00, 12:00 | 12 a. m. = medianoche; 12 p. m. = mediodía |
   | `24`, `24:00` | 0:00 | se admite como medianoche |
   | `2026-10-06T14:05` | 14:05 | una fecha y hora ISO pegada: se toma la hora |
   | `93015` (con `seconds`) | 9:30:15 | 5–6 cifras = H MM SS |
   | `9:3`, `99:99`, `25` | sin interpretar | un minuto de una cifra no se adivina; fuera de 0–23/0–59 |

10. **Escribir en 24 h vale en un idioma de 12 h** («2130» → 9:30 p.m.; «0» y 13–23 nunca son ambiguas). En un idioma de 24 h vale escribir con marcador («9pm» → 21:00). Nadie tiene que saber en qué ciclo está la página.
11. **Sin interpretar = se conserva y se dice.** Al salir con un texto que no es una hora, el texto **no se borra** (se perdería lo escrito en silencio), el modelo es `null`, `aria-invalid` y el mensaje de la aplicación (`labels.invalid`: «Escribe una hora, por ejemplo 9:30») aparecen **al salir** y el envío se bloquea como cualquier error (hallazgo L5). Sin esto, «99:99» se enviaría como un campo vacío.

**12 h: la mitad del día**

12. **Ambigüedad.** Una hora de 1 a 12 **sin marcador** en un idioma de 12 h se resuelve así: (a) la mitad de la **última hora que se vio entera** en el campo (editar 9:30 p. m. y escribir «10» da 10:00 p. m.); (b) si no hay, la única de las dos lecturas que cae en `min`/`max`; (c) si no, **12 = mediodía** y 1–11 = **la mañana** (sin heurística de horario de oficina; confirmar con la pregunta 2 de `../r02/declaracion.md`). La lectura queda visible al salir («9:00 a.m.») y se cambia de un toque o con una tecla (punto 13). r02 A hace explícita la otra lectura.
13. **a. m./p. m.** Dos botones al final de la caja, del alto de la caja y de borde a borde (como −/+ de `GNumberField`), con el texto de `Intl` (sin `labels`): `aria-pressed`, `aria-controls`, nombre «p.m. Hora de la toma» (`aria-labelledby` = su texto + la etiqueta). **Fuera del Tab** (`tabindex="-1"`): con teclado se escribe `a`/`p` (con la hora ya escrita entera, la tecla **cambia** la mitad en vez de insertarse); en el árbol para lectores y táctil. `pointerdown` con `preventDefault`: pulsarlos **no mueve el foco** ni abre el teclado del móvil (medido: el foco no va al campo). Es la vía de 12 h en un móvil con teclado numérico, que no tiene letras. ≥ 24px (44px con puntero grueso). Sin valor, pulsar uno fija la mitad de la próxima hora escrita. Ausentes en solo lectura.

**Teclado**

14. | Tecla | Acción |
    | --- | --- |
    | ↑ / ↓ | ± `step` minutos, encajando en la rejilla contada desde `min` (o desde 0:00): 9:07 ↑ → 9:15 con paso 15 |
    | Mayús+↑/↓, Re Pág/Av Pág | ± 1 hora (el paso grande de una hora es la hora, no 10 × `step`) |
    | Pasos sin límites | **Dan la vuelta a medianoche** (23:45 ↑ → 0:00): la hora es circular |
    | Pasos con `min`/`max` | Se detienen en los extremos; con un **arco que cruza medianoche** (22:00–6:00) lo recorren pasando por 0:00 y se detienen en 6:00 y 22:00; fuera del arco, ↑ entra por `min` y ↓ por `max` |
    | Vacío + ↑/↓ | `min` o, sin él, **la hora actual** redondeada hacia arriba a la rejilla (registrar una toma «ahora» es un gesto) |
    | `a` / `p` (12 h, con la hora escrita entera) | Cambian la mitad del día |
    | Inicio / Fin | Edición de texto (nativo), no `min`/`max` |
    | Enter | Confirma (formatea, `change` si toca) y deja seguir el envío implícito |
    | Pegar | Misma interpretación; una fecha y hora ISO da su hora |
    | Rueda | Nada |
    | Alt/Ctrl/Meta + flechas | Nativo (r02 B usa Alt+↓) |

15. **`change`** (declarado en `emits`, como `GNumberField`): el valor confirmado cambia al salir o con Enter, y **una vez por gesto** de paso (al soltar la tecla), nunca por cada paso repetido; salir sin cambios no emite (medido). `update:modelValue` en cada cambio del valor.

**Idioma, dirección y segundos**

16. **`locale`** como `GNumberField` (#310): prop › `lang` del ancestro más cercano (un bloque `lang="es-MX"` manda) › `navigator.language`. **Ciclo** de `Intl.DateTimeFormat().resolvedOptions().hourCycle` (h11/h12 → 12 h; h23/h24 → 24 h), con prop **`hourCycle`** (`'h12'` | `'h23'`) para forzarlo (como `firstDay` en `GDatePicker`). Formato `hour: 'numeric', minute: '2-digit'` de `Intl` con sus cifras, separador («21.30» en finés) y orden (la mitad del día **delante** en coreano: «오후 9:30»). Marcas bidi fuera; el espacio antes del marcador es el de `Intl` y cambia por motor (U+202F en unos, U+0020 en otros): el filtro y el intérprete aceptan cualquier espacio.
17. **`dir` = la dirección del idioma**, no `ltr` fijo (a diferencia de `GNumberField`): «٩:٣٠ م» lleva su marcador al final lógico, que en árabe es la izquierda; con `dir="ltr"` se leería al revés. Hebreo (24 h, solo cifras) no cambia. Medido: `ar-EG` y `he` con `dir="rtl"`; la caja sigue el orden de la página.
18. **`seconds`**: canónico `"HH:mm:ss"`, formato con segundos; `step` sigue en minutos (los segundos se escriben). Un paso en segundos queda reservado (`secondStep`, L11).

**Formulario y estados**

19. **`GForm`**: lo hace `GInput` (`name` como prop, registro, `errors[name]`, marca, `readonly`/`disabled` heredados). Escribir y ↑/↓ son **escritura** (`notifyInput`: el error se revela al salir); a. m./p. m. es **cambio** (`notifyChange`). Obligatorio = `aria-required`, nunca `required` nativo (#311). Medido: enviar con «Hora de la toma» vacía lleva el foco al campo y el resumen enlaza a él.
20. **Solo lectura**: `readonly` nativo **y** `aria-readonly` (Chromium no expone ninguno en un `spinbutton`, medido como en `GNumberField`), enfocable, sin pasos, sin a. m./p. m., y se envía. **Deshabilitado**: `disabled` en el campo y en el oculto.
21. **En `GFormRow`**: tres hijos de `GInput`; Δ `top` y alto **0px** junto a `GInput`, `GDatePicker` y `GSelect` reales a 1100, 720 y 320px en los tres motores. **En 12 h** los botones a. m./p. m. ocupan ~88px: con `g-form-w-xs`/`sm` la hora puede quedarse sin sitio; hace falta publicar un mínimo medido (L8, como #312).

**Fecha y hora, y zona horaria**

22. **Fecha + hora = dos campos en una `GFormRow`** (`GDatePicker` `g-form-w-sm` + campo de hora `g-form-w-xs`/`sm`), dos preguntas con su etiqueta, su error y su envío (`fecha=2026-10-06`, `hora=21:30`). La aplicación los junta si necesita un valor (`"2026-10-06T21:30"`, hora local sin zona, como `datetime-local`). **Sin `GDateTimeField` en v1** (nombre reservado): un campo único mezclaría dos patrones de teclado y dos errores en una caja.
23. **Zona horaria: el campo no hace nada con ella.** No convierte, no elige zona, no produce instantes, no conoce el horario de verano (no sabe la fecha: una hora que no existe un día de cambio la decide la aplicación con la fecha). «Ahora» (punto 14) es el reloj del dispositivo. Si la zona importa (teleconsulta entre países), la aplicación la **dice** con `suffix` + `suffixLabel` («CDMX», «hora del centro de México»), que entra en la descripción (#166). `GCalendar`, que sí trabaja con instantes, tiene su zona explícita (#38).

## Estados medidos

Vacío · foco · escribiendo (parcial) · interpretado · sin interpretar (se conserva, error al salir) · fuera de rango (error de la aplicación) · fuera de rejilla (se conserva) · 12 h con mitad elegida · 24 h · segundos · con sufijo de zona · solo lectura · deshabilitado · error de la aplicación y resumen · envío · en una fila con fecha · 320px LTR y RTL · `ar-EG`, `he`, `fi`, `ko`, `en-US`, `es-MX`.

## Qué lo hace distinto

La forma se decide en r02, pero la base ya se aparta del campo de hora genérico en cinco reglas pensadas para quien registra una toma o un turno con prisa:

- **Se escribe como se teclea, no como lo pide el control**: «930», «9.30p», «21», «9h30» o una fecha ISO pegada dan la misma hora, y en un idioma de 12 h también vale escribir en 24 h. Ningún segmento que rellenar en orden.
- **La hora da la vuelta**: ↑ desde 23:45 llega a 0:00 y un turno de 22:00 a 6:00 se recorre por la medianoche. Los campos de los frameworks topan en 23:59 o no admiten el rango.
- **Lo que no se entiende no se borra**: se queda en la caja, se dice al salir y bloquea el envío, en vez de convertirse en un campo vacío en silencio.
- **La mitad del día recuerda**: editar «9:30 p. m.» y escribir «10» da 10:00 p. m., no 10:00 a. m.; y a. m./p. m. se cambian con una tecla o un toque que no abre el teclado.
- **Vacío + ↑ = ahora**: registrar una toma «ahora» es una tecla, no escribir la hora mirando el reloj.

## Comprobaciones

`node design/lab/time-field/verificar.mjs` (`PARTS=base`) · 2026-10-06 · Chromium 62/62, Firefox 60/60, WebKit 61/61 (Firefox sin las dos de CDP y la del pegado con evento sintético, que llega sin datos; WebKit sin las de CDP).

Por motor: formato por idioma (`es` 24 h, bloque `es-MX`, `ar-EG` con cifras y `dir="rtl"`, `he`, `fi` «21.30», `ko` con la mitad delante); todos los modelos `HH:mm[:ss]` o `null`; `type=text`, `role=spinbutton`, `inputmode=numeric`; `aria-valuenow` 547, `aria-valuetext` «9:07», `aria-valuemin`/`max` 480/1080, sin ellos en el arco de medianoche; visible sin `name` y oculto canónico; `aria-required` sin `required`; árbol con nombre; a. m./p. m. con nombre y estado; siete escrituras («930», «2130», «9h30», «9.30», «21», «0005», «24») con su formato al salir; filtro; «99:99» conservado con error propio, `aria-invalid`, `aria-valuetext` = lo escrito; «9:3» sin adivinar; pegar ISO (Chromium, WebKit); ↑/↓/Mayús/Av Pág en la rejilla desde `min`; tope en `max`; arco de medianoche (23:30 → 0:00, 5:30 → 6:00 y se queda, fuera del arco entra por 22:00); vuelta sin límites; vacío ↑ = ahora; `change` una vez por gesto y ninguno al salir sin cambios; 12 h (`9`, `9.30p`, `2130`, tecla `a`, mitad recordada, botón p.m. sin mover el foco, `tabindex=-1`, `aria-pressed`, ≥ 24px); cifras arábigo-índicas, coreano y finés al escribir; fila con `GInput`, `GDatePicker` y `GSelect` a 1100/720/320 (Δ 0); solo lectura y deshabilitado; envío con error y foco; `FormData` canónico; 320px LTR y RTL sin desbordamiento; consola limpia. En Chromium, el árbol por CDP (en «Notas» de la salida).

**No comprobado:** lector de pantalla real (VoiceOver, NVDA, TalkBack): cómo se lee un `spinbutton` cuyo `valuetext` es una hora, el cambio de a. m./p. m. con los botones fuera del Tab, el texto sin interpretar con `aria-invalid`; teclado virtual real (si `inputmode="numeric"` en iOS deja escribir «930» cómodo y sin «:»); IME real (coreano, japonés); el pegado real en Firefox; `forced-colors` real (reglas escritas en `field.css`, sin medir); zoom 200 %; Safari real con Tab (en WebKit de Playwright el campo de texto sí recibe Tab).

## Hallazgos para lima

| # | Tema | Propuesta |
| --- | --- | --- |
| L1 | Nombre y contrato | `GTimeField`, contrato propio `design/contracts/time-field.md`; en `form.md` «Fases siguientes», fila 5, pasa a «contratado». Prefijo `g-time-field`. Componente complejo (compone `GInput`, motor propio, y según r02 un diálogo anclado): coco y bruno en Opus |
| L2 | Motor | Utilidad interna `utils/timeInput.js` (no se exporta; con su `timeInput.test.js`), sin estado ni DOM: idioma (ciclo, marcadores, separador, cifras, dirección, franjas), filtro, interpretación (tabla del punto 9 y regla del 12), formato, canónico, pasos con arcos, duración. `../engine.js` es la referencia de comportamiento, no de código |
| L3 | Props | `modelValue` (String \| null), `min`, `max` (String `HH:mm[:ss]`), `step` (Number, minutos, entero ≥ 1, `1`), `seconds` (Boolean), `locale`, `hourCycle` (`h12` \| `h23`, sin valor = del idioma), `labels` (`{ invalid }`, sin valores por defecto, #226), y las de `GInput`/`GNumberField`: `name`, `label`, `hint`, `error`, `warning`, `valid`, `output`, `required`, `mark`, `readonly`, `disabled`, `size`, `variant` (`outline` `soft`), `density`, `color`, `rounded`, `block`, `prefix`, `suffix`, `prefixLabel`, `suffixLabel`, `id`. **No existen**: `type`, `inputmode` (derivado; `$attrs` lo sobrescribe), `format` (lo da `Intl`), `timeZone` (punto 23), `loading` |
| L4 | Eventos y modelo | `update:modelValue` (String \| null, nunca `Date`), `change` propio (punto 15). Valor de entrada inválido → `null` con aviso. `min > max` **no** es un error: es un arco que cruza medianoche (documentar; sin aviso) |
| L5 | Texto sin interpretar | Usar el **error propio** de #372 (`ownError`/`ownTarget`) con una variante: se revela **al salir** del campo (`blur`), no solo al enviar, porque el texto está a la vista y la persona acaba de escribirlo; texto `labels.invalid` (sin él, error con un espacio: bloquea sin texto, como #372). Sale en cuanto el texto se vacía o se entiende. Afecta a `form.md` §2 («Error propio del componente»): ampliar la regla de visibilidad con `ownReveal: 'blur' \| 'submit'` |
| L6 | ARIA | `spinbutton` con `valuenow` en minutos (segundos con `seconds`), `valuetext` siempre con valor, `valuemin`/`valuemax` solo con `min ≤ max`; sin interpretar, `valuetext` = lo escrito. Límites conocidos para el README: Chromium expone 0/0 sin límites; en Chromium el nombre por CDP sale «Hora de la cita(opcional)» sin espacio (el `ariaSnapshot` sí lo pone; no es de este campo, medir con lector real) |
| L7 | a. m./p. m. | Clases `g-time-field__halves`, `g-time-field__half` (+ `is-on`); geometría y tokens de −/+ de `GNumberField` (`--_h`, borde, `neutral-soft`, `text-muted`, piso 24/44px, `forced-colors`); `aria-labelledby` = su texto + `ID-label` (como #311); sin `labels`: el texto es el de `Intl` |
| L8 | Mínimo en `GFormRow` | En 12 h el campo publica su mínimo medido con `setIntrinsicMin` (#271, #312): relleno + texto de referencia («12:59 p.m.» o el más ancho de las 24 horas en el idioma, con `seconds` si toca) + a. m./p. m. En 24 h, la clase de tamaño basta (`g-form-w-xs` con «23:59» mide < 80px) |
| L9 | `locale` compartido | La resolución (prop › ancestro `lang` › navegador, al montar) es la de `GNumberField`: extraerla a una utilidad común si bruno lo ve útil (sin cambiar `GNumberField`) |
| L10 | Dirección | `dir` del idioma en el `<input>` (punto 17), distinto de `GNumberField` (`ltr` fijo): documentar el porqué en los dos contratos |
| L11 | Segundos | `step` siempre en minutos; `secondStep` reservado. Con `seconds`, ↑/↓ siguen dando minutos |
| L12 | «Ahora» | Vacío + ↑/↓ usa el reloj del dispositivo (`Date`), solo en el cliente y nunca al renderizar (SSR igual que `GNumberField`: sin `locale`, el servidor escribe el canónico «09:07» y el cliente lo formatea al montar) |
| L13 | Peso | Motor + campo estimados en 3 a 4 KB gzip: cabe en el paquete principal (tope de 8 KB de #238/#337). Volver a decidir si entra el diálogo de r02 B |
| L14 | Tokens e iconos | Ninguno nuevo en la base; ningún icono propio (un reloj de adorno sería ruido; quien lo quiera, slot `prepend` con `GIcon`) |
| L15 | Receta | `form.md` §8: «Fecha y hora» (`GDatePicker` + `GTimeField` en una `GFormRow`, la aplicación junta `fecha + 'T' + hora`) y la nota de zona horaria del punto 23 |
| L16 | Reservas | `GDateTimeField` (punto 22), `GTimeRange` / `mode="range"` (r02 C), `secondStep`, `prefer` (mitad del día preferida, si los datos dicen que la regla del 12 c) equivoca), `suggestions` (r02 B) |
