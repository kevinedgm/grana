# GTimeField

Campo para **una hora del reloj**: la de una cita, una toma de medicamento, el inicio de un turno. Se **escribe como se dice** («930», «9h30», «9.30p», «9 noche»), la hora **vuelve en palabras** pegada al número («9:30 · de la noche») y, cuando lo escrito puede ser de mañana o de noche, **ofrece la otra lectura a un toque**. El valor es una cadena `"HH:mm"` (o `"HH:mm:ss"`) o `null`: una hora de pared, sin fecha ni zona. Etiqueta, caja, prefijo y sufijo, pie, mensajes, marcas y contexto de [`GForm`](../GForm/README.md) son los de [`GInput`](../GInput/README.md), que compone; la caja mide lo mismo que la de un `GInput` y comparte fila con él en una [`GFormRow`](../GFormRow/README.md).

**Etiqueta:** `<g-time-field>` · **Estado:** `candidate` (auditoría de coco aprobada, sin defectos bloqueantes; ver [`design/lab/time-field/auditoria.md`](../../../../../design/lab/time-field/auditoria.md)) · **Desde:** 0.1.0 · **Entrada:** propia, `@grana/vue/time-field` (global UMD `GranaTimeField`)

> `@grana/vue` está en la versión 0.0.0 y aún no se publica. Por ahora se usa desde el repositorio (ver el playground en `packages/vue/playground/`, sección `GTimeField`, `#sec-time`). Exige Vue `^3.5.0` (usa `useId`) y un navegador actual con `Intl.DateTimeFormat` y su opción `dayPeriod` (las franjas del día en palabras salen de ahí; con un idioma sin franja, el campo muestra solo la hora).

## Instalación: entrada propia

`GTimeField` **no** viaja en `@grana/vue`: ni lo exporta ni lo registra su `install`. Va en su propia entrada y quien no lo usa no lo paga.

```js
import { createApp } from 'vue'
import Grana from '@grana/vue'
import TimeField, { GTimeField } from '@grana/vue/time-field'
import '@grana/vue/style.css'          // el CSS del campo ya está en esta hoja única

createApp(App).use(Grana).use(TimeField).mount('#app')   // registra <g-time-field>
// o, sin plugin: components: { GTimeField }
```

Sin empaquetador, carga en orden `vue.global.js`, `dist/grana.umd.js` (global `Grana`) y `dist/time-field.umd.js` (global `GranaTimeField`): `app.use(Grana).use(GranaTimeField)`. En plantillas dentro del HTML (sin compilar), Vue no admite etiquetas de componente autocerradas: escribe `<g-time-field ...></g-time-field>`.

La entrada exporta `GTimeField` y, por defecto, un plugin (`install`) que solo lo registra. No hay gestor ni servicio.

**Por qué va aparte (DECISIONS #415, enmienda de #400).** Kiwi estimó de 3 a 4 KB gzip para el paquete principal; bruno midió **+8379 B gzip** (con `gzip -9`) al meterlo en el principal, por encima del tope de 8 KB que fijan #238, #328 y #337. Con entrada propia, el principal solo crece **+279 B gzip** por dos añadidos internos que se quedan en él (el soporte de error propio de `GInput` y el revelado por salida de `GForm`, sin API pública nueva). Peso anotado por bruno el 2026-10-06 en `GTimeField.meta.json`: `dist/time-field.js` **10 279 bytes gzip** y `dist/time-field.umd.js` **9280**. **Remedido al documentar** sobre el `dist/` del árbol de trabajo, con `gzip -9`: 10 494 y 9494 bytes (el `dist/` es del 2026-10-06 a las 08:14 y el árbol de trabajo tenía cambios de bruno sin confirmar; la cifra de la meta es la de la construcción). Vue y `@grana/vue` van como externos; `GInput`, `useFormField` con las claves de contexto (una copia propia crearía otro `Symbol` y el campo no vería su `GForm`), `oneOf` y el observador de tamaño llegan por `__shared` **sin copia**. El motor (`utils/timeInput.js`, interno y no exportado) viaja solo en esta entrada. Comprobado al documentar: `dist/grana.js` no contiene `GTimeField` y `dist/grana.css` contiene `g-time-field__reading`. El CSS va en `grana.css`.

## Qué lo hace distinto

Concepto **A «La hora dicha»**, elegido por el usuario el 2026-10-06 mirando los prototipos de kiwi (`design/lab/time-field/r02/`, DECISIONS #407). Los otros dos conceptos de la ronda quedan reservados (ver «Reservado»).

Los campos de hora tratan a. m./p. m. como un interruptor que hay que acordarse de tocar, y el error más caro de una hora (una toma de las 9 de la noche registrada a las 9 de la mañana) nace ahí. `GTimeField` hace tres cosas que no hace el campo habitual:

| | Qué hace | Por qué sirve |
| --- | --- | --- |
| **Se escribe como se dice** | Además de cifras («930», «2130», «9:30», «9h30»), entiende la mitad del día y las **franjas del idioma**: «9.30p», «9 noche», «7 de la tarde», «mediodía». También una fecha ISO pegada («2026-10-06T14:05») | Cada quien teclea la hora a su manera y el campo la entiende; nadie busca un `:` que el teclado numérico del móvil no tiene |
| **La hora vuelve en palabras** | Pegada al número, en el idioma de la página y sin un solo texto de la aplicación, la franja del día aparece detrás de la hora («9:30 · de la noche»). Mientras se escribe algo que aún no es su forma final («930»), se ve también la **hora entendida** («9:30») antes de salir | Se ve qué entendió el campo justo donde se mira. Los textos salen de `Intl`: el único texto de tu aplicación es `labels.invalid` |
| **Las dos lecturas ante la ambigüedad** | Cuando lo escrito puede ser de mañana o de noche («9», «9:30», «930»), el campo **no elige en silencio**: toma una lectura y ofrece la otra a un toque, con la hora en su nombre («21:00 de la noche»). En 12 h los botones a. m./p. m. son esas dos lecturas | El error de las 9 de la noche contra las 9 de la mañana se ve y se corrige con un toque; con teclado, escribir la franja o el marcador («9 noche», «9p») |

Además, de la base: la hora **da la vuelta** a la medianoche y recorre un turno de 22:00 a 6:00; lo que no se entiende **no se borra** y bloquea el envío; la mitad del día **recuerda** la última hora vista; y vacío + ↑ es **ahora**.

**Descartadas** en la ronda: el reloj analógico (dos gestos de precisión y la mitad del día aparte) y la rueda tipo iOS (un `listbox` por columna). **Reservada:** arrastrar los extremos de un tramo sobre la regla del día (ver «Reservado»).

## Uso

### Una hora suelta

```vue
<script setup>
import { ref } from 'vue'
const toma = ref('21:30')       // "HH:mm" o null
</script>

<template>
  <g-time-field v-model="toma" name="toma" label="Hora de la toma"
                hint="Por ejemplo 9:30 o 9 de la noche"
                :labels="{ invalid: 'Escribe una hora, por ejemplo 9:30' }"></g-time-field>
</template>
```

Con `locale="es-MX"` (o `lang="es-MX"` en el documento) el campo es de 12 h y muestra «9:30 p.m.» con su lectura «de la noche»; con `es` es de 24 h («21:30»). Fuerza el ciclo con `hourCycle="h12"` o `"h23"`.

### Dentro de un formulario

```vue
<g-form aria-label="Cita" @submit="enviar">
  <g-form-layout>
    <g-form-row>
      <g-date-picker v-model="cita.fecha" name="fecha" label="Fecha de la cita" required></g-date-picker>
      <g-time-field v-model="cita.hora" name="hora" label="Hora" required
                    :step="15" min="08:00" max="18:00"
                    hint="Por ejemplo 9:30 o 4 de la tarde"
                    suffix="CDMX" suffix-label="hora del centro de México"
                    :labels="{ invalid: 'Escribe una hora, por ejemplo 9:30' }"></g-time-field>
    </g-form-row>
  </g-form-layout>
  <g-btn type="submit">Agendar</g-btn>
</g-form>
```

`GForm` emite `submit` con un `FormData` que lleva `fecha=2026-10-06` y `hora=09:30` (canónico, no lo visible). Esta es la receta «Fecha y hora» de [`form.md` §8](../../../../../design/contracts/form.md): **dos campos, dos preguntas**, cada uno con su etiqueta, su error y su envío. Si tu aplicación necesita un solo valor, lo junta ella: `` cita.fecha && cita.hora ? `${cita.fecha}T${cita.hora}` : null `` (hora local sin zona, como `datetime-local`). **`GDateTimeField` está reservado** y no tiene ronda. Ver «Fecha, hora y zona».

### Un turno de noche

```vue
<g-time-field v-model="llegada" label="Llegada" min="22:00" max="06:00" :step="30"></g-time-field>
```

Con **`min` mayor que `max`** el rango **cruza la medianoche** (22:00 a 06:00): no es un error y no avisa. Las flechas lo recorren pasando por 00:00 y se detienen en 06:00 y en 22:00.

### Con segundos

```vue
<g-time-field v-model="marca" seconds label="Marca de tiempo"></g-time-field>   <!-- "HH:mm:ss"; se escribe «93015» o «9:30:15» -->
```

## Modelo y envío

- **`v-model`:** `"HH:mm"` o `"HH:mm:ss"` en 24 h, con cero delante y cifras latinas (`00:00` a `23:59:59`), o `null`. `undefined` y `''` se leen como `null` sin aviso. Cualquier otra cosa («9:30», «24:00», «21:30:00Z», un `Date`) se lee como `null` **con aviso**. Con `seconds` en `false`, un valor con segundos se muestra y se envía **sin** ellos (con aviso): el campo no emite por su cuenta, la próxima edición emite `"HH:mm"`.
- **El componente emite siempre `"HH:mm"` (o `"HH:mm:ss"` con `seconds`) o `null`:** nunca un `Date` ni un número.
- **El modelo refleja siempre lo escrito.** Un envío sin salir del campo (Intro, o Safari sin foco en el botón) nunca lleva una hora distinta de la que se ve. Escribir «930» emite `"09:00"`, `null` («93» no es una hora) y `"09:30"`: es lo que hay en la caja en cada momento.
- **Una hora de pared, no un instante** (#401). Sin fecha, sin zona, sin horario de verano: se ordena como texto.
- **Envío:** un `<input type="hidden">` con el `name` lleva el canónico (`21:30`, no «9:30 p.m.» ni «٩:٣٠ م»). **El `<input>` visible no lleva `name`.** Con `readonly` **se envía**; con `disabled`, no. `form` (por atributo) se copia al oculto. `name` es **prop**, no atributo.
- **Grana no valida** (DECISIONS #157): lo escrito fuera de `min` y `max` no se recorta y lo que cae fuera de la rejilla de `step` no se redondea («9:07» con paso 15 se queda 9:07); `min`, `max` y `step` gobiernan **los pasos**. La excepción es lo que **no es una hora**: eso solo lo sabe el campo (ver «Error propio»).

## Escribir como se dice

Al teclear se interpreta en **cada cambio**, pero el texto **no se reformatea mientras se escribe** (no se roba el cursor): se formatea al salir o con Intro. Entran cifras (las del idioma y las latinas), `:` `.` `,`, cualquier espacio, `h`, las letras de a. m./p. m. y de las franjas del idioma, y `'`; lo demás no entra y el cursor se conserva. Durante una composición (IME) el filtro espera a `compositionend`.

| Escribes | Se entiende | Regla |
| --- | --- | --- |
| `9`, `21` | 9:00, 21:00 | 1 o 2 cifras = hora |
| `930`, `0930`, `2130` | 9:30, 9:30, 21:30 | 3 cifras = H MM; 4 = HH MM |
| `93015`, `093015` (con `seconds`) | 9:30:15 | 5 o 6 cifras = H MM SS |
| `9:30`, `9.30`, `9,30`, `9h30`, `9 h` | 9:30, 9:30, 9:30, 9:30, 9:00 | dos o tres grupos con cualquier separador; una `h` pegada a cifras es separador |
| `9.30p`, `9 p. m.`, `9pm`, `오후 9:30`, `٩:٣٠ م` | 21:30 / 21:00 | marcador latino o del idioma, antes o después; con marcador la hora va de 1 a 12 |
| `12a`, `12 p. m.` | 0:00, 12:00 | 12 a. m. es medianoche; 12 p. m., mediodía |
| `9 noche`, `7 de la tarde`, `3 madrugada`, `mediodía` | 21:00, 19:00, 3:00, 12:00 | **franja del idioma**: una palabra de 3 letras o más que es prefijo de una sola franja; gana la lectura (h o h + 12) que cae en la franja o, si ninguna, la más cercana a 2 h o menos («7 de la noche» se dice aunque CLDR ponga las 19:00 «de la tarde»); una franja que cubre una sola hora vale sin cifras («mediodía») |
| `24`, `24:00` | 0:00 | se admite como medianoche (sin marcador ni franja) |
| `2026-10-06T14:05`, `2026-10-06 14:05:30` | 14:05 | una fecha y hora ISO (pegada o escrita): se toma su hora. **Los segundos solo con `seconds`**: sin él se descartan sin error ni aviso (es una marca de tiempo de otra fuente, no una hora escrita) |
| `0`, `13` a `23` en un idioma de 12 h | 0:00, 13:00… | escribir en 24 h vale en cualquier idioma |
| `9:3`, `99:99`, `25`, `9:30:15` sin `seconds` | sin interpretar | un minuto de una cifra no se adivina; fuera de 0 a 23 o de 0 a 59; segundos sin `seconds` |

- **Ambigua:** una hora de 1 a 12 sin marcador ni franja en un idioma de 12 h, y una hora a secas de 1 a 11 sin cero delante en uno de 24 h («9», «9:30», «930»; «09» no lo es). Se resuelve así (DECISIONS #408, decisión del usuario): primero las pistas (la mitad de la última hora vista entera; en 12 h, la única lectura que cae dentro de `min` y `max`); **sin pista, se toma una lectura**: la **literal** en 24 h y, en 12 h, **12 es mediodía y de 1 a 11 es de la mañana**, y **se ofrece la otra a un toque** (ver «12 h, 24 h y la mitad del día»). Sin heurística de oficina y sin obligar a elegir.
- **Las palabras solo se entienden en el idioma de la página:** no se traducen. Di en la ayuda que se puede escribir así («Por ejemplo 9:30 o 9 de la noche»).
- **Pegar:** la misma interpretación sobre el texto pegado; si es una hora, sustituye el contenido del campo y se formatea; si no, el pegado sigue su curso por el filtro.
- **`inputmode="numeric"` por defecto:** lo que más se escribe son cifras y el teclado numérico del móvil las da sin cambiar de modo. Quien quiera escribir palabras en un teclado virtual pasa `inputmode="text"` como atributo. Sin medir en dispositivo real (ver «No verificado»).

## 12 h, 24 h y la mitad del día

El ciclo sale de `hourCycle` y, sin él, del idioma. En **12 h**:

- Al final de la caja van **a. m. y p. m.** (los marcadores de `Intl` del idioma), del alto de la caja y de borde a borde, de 24 px o más (44 px con puntero grueso). Con valor, el de la mitad del valor queda pulsado (`aria-pressed="true"`, y además con más peso: el estado no depende solo del color). **Sin valor**, ninguno está pulsado; pulsar uno fija la mitad de **la próxima hora escrita** y queda pulsado hasta que se escribe o se vacía.
- **Tocar** a. m. o p. m. cambia la mitad **sin quitar el foco de donde estaba**; sin foco previo, el campo **no** se enfoca (en un móvil no se abre el teclado). La acción ocurre **en cuanto baja el puntero** (botón principal), no al soltar: en WebKit con táctil cancelar el `pointerdown` cancela también el `click`, y un toque no haría nada. Una activación sin puntero (tecnología de apoyo, Intro sobre el botón) actúa en el `click`, que llega con `detail` 0. Cada activación emite `change` una vez si el valor cambió.
- Con el teclado, `a` o `p` (o la primera letra del marcador del idioma), con la hora ya escrita entera y formateada, **cambian la mitad del día** en vez de insertarse.
- No aparecen en `readonly` (la lectura en palabras sí se ve) ni se pueden activar en `disabled`. Es la vía de 12 h en un móvil con teclado numérico, que no tiene letras.

En **24 h**, con el **foco en el campo** y una hora ambigua escrita, el campo toma la lectura literal y al final de la caja aparecen **las dos lecturas**: la tomada, pulsada («9:00 de la mañana»), y la otra («21:00 de la noche»). Un toque fija esa hora, el texto se formatea, las lecturas se van (ya no es ambigua) y el foco sigue en el campo. **Desaparecen al salir.** Funcionan igual que a. m./p. m.: actúan al bajar el puntero, no mueven el foco y emiten un `change` por activación.

- **Nunca a la vez** que a. m./p. m. y **nunca en solo lectura**. Mientras están, la raíz lleva `has-choices` y la lectura en palabras no se pinta (la lectura pulsada ya la dice).
- **Si el par no cabe** en la caja, cada botón muestra **la hora** de su lectura («9:00» · «21:00») y la franja queda como texto oculto accesible (`data-compact`); el nombre accesible no cambia. Así el par nunca reparte la fila ni desborda.
- Tanto a. m./p. m. como las lecturas están **en el árbol de accesibilidad y fuera del Tab** (`tabindex="-1"`, nunca `aria-hidden`): VoiceOver en iOS y TalkBack los necesitan sin teclado y el teclado ya tiene sus teclas.

## Teclado

| Tecla | Acción |
| --- | --- |
| ↑ / ↓ | ± `step` minutos, **encajando** en la rejilla contada desde `min` (o desde 00:00): 9:07 ↑ da 9:15 con paso 15. Con `seconds`, los segundos vuelven a 0 |
| Mayús + ↑/↓, Re Pág / Av Pág | ± **1 hora**, sin encajar. Se pierde «extender la selección» de Mayús+↑/↓ en un campo de una línea (coste aceptado, como en `GNumberField`) |
| Sin `min` ni `max` | Los pasos **dan la vuelta a medianoche** (23:45 ↑ da 0:00; 0:00 ↓ da 23:45 con paso 15) |
| Con límites | Se detienen en los extremos. Con un **arco que cruza la medianoche** lo recorren pasando por 0:00 y se detienen en sus dos extremos. **Fuera del arco**, ↑ entra por `min` y ↓ por `max` |
| Vacío + ↑/↓ (o Re Pág / Av Pág) | `min`; sin él, **la hora actual** del dispositivo redondeada **hacia arriba** a la rejilla de `step` (al minuto con el paso grande); si así cae fuera de un `max` sin `min`, `max`. Registrar una toma «ahora» es una tecla |
| `a` / `p` (12 h) | Cambian la mitad del día de una hora ya escrita |
| Intro | Confirma (formatea, error propio si toca, `change` si toca) y deja seguir el envío implícito del formulario |
| Inicio / Fin | Edición de texto (nativo): **no** van a `min` ni a `max` |
| Alt, Ctrl o Meta + flechas | Nativo (no se interceptan) |
| Rueda del ratón | Nada |
| Tab | Entra y sale del campo; a. m./p. m. y las lecturas quedan fuera del orden |

- **Con un paso desde el teclado** el texto se reformatea y el cursor queda al final. **Al entrar** (foco) el texto queda como está; si venía seleccionado entero, sigue seleccionado entero.
- **«Ahora»** se lee con `Date` **solo en el cliente** y solo en ese gesto (nunca al renderizar). Es la hora del reloj del dispositivo, sin zona. En el playground, `?now=HH:mm` en la URL fija ese reloj (sustituye `Date` en esa página, solo con ese parámetro).
- **Un cambio de `modelValue` desde la aplicación** que no coincide con lo escrito reescribe el texto; uno que coincide no lo toca.

## `min`, `max` y `step`

- **`min`, `max`:** `"HH:mm"` o `"HH:mm:ss"`. Limitan los **pasos** (flechas, Re Pág / Av Pág) y se exponen al árbol de accesibilidad solo con `min ≤ max` (ver «Accesibilidad»); **no** limitan lo escrito ni lo pegado. Con solo `min` el rango va de `min` a 23:59(:59); con solo `max`, de 00:00 a `max`. Un formato inválido se ignora con aviso.
- **`step`:** minutos entre pasos (entero ≥ 1; otro valor se sustituye por `1` con aviso). La rejilla se cuenta **desde `min`** (o desde 00:00). Con `seconds`, `step` sigue en minutos.
- **`min > max`:** arco que cruza la medianoche (22:00 a 06:00), sin aviso.

## Error propio: lo que no es una hora

Con texto en la caja que **no es una hora** («99:99», «9:3», «25»), el texto **no se borra** (se perdería lo escrito en silencio), el modelo es `null` y el campo tiene un error que solo él conoce (no está en `errors`):

- **Cuándo se ve:** con las mismas reglas que un error de escritura. Dentro de `GForm` con `showErrorsOn="blur"`, **al salir del campo habiendo editado** (con el aplazamiento de DECISIONS #326 si la salida la provoca una pulsación) y en el envío o `showErrors()`; con `showErrorsOn="submit"`, solo en el envío. **Fuera de `GForm`**, al salir del campo o con Intro. Mientras se escribe no se pinta. Una vez visible, se queda mientras el texto siga sin ser una hora y **sale** en cuanto se vacía o se entiende; así, corregir «99:99» escribiendo «9», «9:», «9:3», «9:30» no hace parpadear el mensaje.
- **Qué dice:** `labels.invalid` (el texto es de tu aplicación: «Escribe una hora, por ejemplo 9:30»). Sin él, el campo **bloquea igual**, con un espacio como mensaje, y avisa al montar.
- **Bloqueo:** dentro de `GForm`, el error propio **bloquea el envío** aunque no se haya revelado: el envío lo revela, lo marca con `is-rejected` y lleva el foco al campo; [`GErrorSummary`](../GErrorSummary/README.md) enlaza a él. `formnovalidate` no bloquea.
- **Fuera de `GForm`**, el `<input>` visible lleva **`setCustomValidity`** con el mismo texto mientras haya error propio, de modo que un envío nativo o `checkValidity()` tampoco salen con una hora ilegible.
- **Precedencia:** la prop `error` con texto, después el error propio y por último `errors[name]`.
- **Necesita `name`** para bloquear el envío de `GForm`: sin `name` el campo no se registra; el error propio se ve y lleva `setCustomValidity`, pero no bloquea el envío de `GForm`.
- **`GTimeField` no llama a `useFormField` por sí mismo:** lo hace su `GInput`, al que le pasa `ownError`, `ownTarget` y `ownReveal: 'blur'` (añadido interno, sin API pública). Ver [`form.md` §2](../../../../../design/contracts/form.md), «Error propio del componente» y `ownReveal`.
- **Cuenta para `GForm`:** escribir, pegar y ↑/↓ son **escritura** (suben `dirty`, el error se revela al salir); a. m./p. m. y las lecturas son **cambio** (suben `dirty`, no revelan). Los tres retiran `is-rejected`.

Una hora fuera de tu horario (antes de `min`, después de `max`) **no** es un error del campo: la marca tu aplicación con `error` o `errors`.

## En una fila de formulario

El campo comparte línea con `GInput`, `GDatePicker` y `GSelect` en una [`GFormRow`](../GFormRow/README.md) sin CSS propio de colocación (medido en la auditoría: mismo `top` y alto, ±1 px, en marcos de 1100, 720 y 320 px y ventanas de 1280 a 320).

**Mínimo publicado (DECISIONS #410).** El campo publica a la fila su **mínimo medido** con `setIntrinsicMin`, en los **dos ciclos**, y la fila se parte antes de que la hora no quepa. No hace falta `--g-form-min`. El mínimo se mide **por posiciones** en la caja: lo que hay antes de la celda del valor, el ancho de la hora más ancha del idioma y ciclo (las 24 horas a los :59, con segundos si toca, o el `placeholder`), lo que hay después (sufijo, `output`) y, en 12 h, a. m./p. m. **Cuentan en el mínimo** aunque el campo sea `readonly` (así bloquear y desbloquear el campo, patrón «lock-edit» #266, no reparte la fila). **No cuentan** la lectura en palabras (se recorta) ni las dos lecturas (se compactan). Medido en la auditoría con la fuente servida (`dist/fonts.css`, Instrument Sans), `md`, `space` 4, idéntico en los tres motores:

| Campo | Mínimo publicado |
| --- | --- |
| 12 h `es-MX` (también en solo lectura) | **180 px** |
| 24 h `es` | **65 px** (por debajo de cualquier clase de tamaño: no cambia nada) |

Con otro tema y otra fuente cambia (la auditoría midió 180 y 62 px con `space` 3 y Georgia, y 197 y 73 px con `space` 5 y borde de 2 px): el valor se **mide en vivo**; las cifras son orientativas. El mínimo efectivo de la fila es el mayor entre el de la clase de tamaño, `--g-form-min` y este. Las referencias 186 y 66 px de `estilo.md` se midieron sin la fuente servida.

**Fuera de una fila (DECISIONS #416).** Sin fila y sin `block`, la caja de `GInput` mide `min(100%, space × 60)` (240 px) y no crece con el texto. Con el texto al 200 % (zoom de solo texto), un campo de 12 h no cabía en esos 240 px y recortaba la hora a «8:0…». Ahora el campo usa **su mínimo medido** como suelo del ancho de su raíz, acotado al 100 % del contenedor: **con el texto normal no cambia nada** (la raíz sigue en 240 px, igual que un `GInput` vecino) y solo crece cuando el texto lo exige. Con `block` o dentro de una fila no interviene. Mecanismo interno: la raíz lleva el atributo `data-fit` y la variable en línea `--_min-inline` mientras haga falta; **no son API** y no hay que escribirlas. Medido en la auditoría: a texto normal 240 px exactos; al 200 % de texto, 12 h **302 px** (mínimo por posiciones calculado aparte: 302) con la hora entera. Un `inline-size` tuyo menor que el mínimo pierde frente al mínimo, salvo que el contenedor sea más estrecho (manda el 100 %).

## Fecha, hora y zona

- **Fecha y hora = dos campos** (`GDatePicker` + `GTimeField`, ver «Dentro de un formulario»). **Inicio y fin de un turno:** hoy, dos `GTimeField` en una `GFormRow` y la duración en el `output` del fin, calculada por tu aplicación; reservado `mode="range"` (ver «Reservado»).
- **Una duración** («1 h 30 min») **no** es una hora del reloj: usa [`GNumberField`](../GNumberField/README.md) con `suffix`.
- **Zona horaria: el campo no hace nada con ella.** No convierte, no elige zona, no produce instantes y no conoce el horario de verano (no sabe la fecha: una hora que no existe el día del cambio la decide tu aplicación con la fecha). «Ahora» es el reloj del dispositivo. Si la zona importa, **dila** con `suffix` + `suffixLabel` («CDMX», «hora del centro de México»); el segundo entra en la descripción accesible. Para instantes con zona explícita, `GCalendar`.

## Props

| Prop | Tipo | Valores | Por defecto |
| --- | --- | --- | --- |
| `modelValue` | String \| null | `"HH:mm"`, `"HH:mm:ss"` | `null` |
| `min` | String | `"HH:mm"`, `"HH:mm:ss"` | sin valor |
| `max` | String | `"HH:mm"`, `"HH:mm:ss"`; con `min > max`, arco que cruza la medianoche | sin valor |
| `step` | Number | entero ≥ 1 (minutos) | `1` |
| `seconds` | Boolean | canónico, formato y `aria-value*` con segundos | `false` |
| `locale` | String | etiqueta BCP 47 | ver «Idioma» |
| `hourCycle` | String | `h12` `h23` (`h11` y `h24` no se admiten) | el del idioma |
| `labels` | Object | `{ invalid }`: el mensaje del error propio | `{}` |
| `prefix`, `suffix`, `prefixLabel`, `suffixLabel` | String | como `GInput`; el uso típico del sufijo es decir la zona. No entran en `aria-valuetext` | sin valor |
| `name` | String | va al `<input type="hidden">` canónico y registra el campo en `GForm` | sin valor |
| `label` | String | | sin valor |
| `hint` | String | | sin valor |
| `error` | String | | sin valor |
| `warning` | String | | sin valor |
| `valid` | String | | sin valor |
| `output` | String | valor calculado dentro de la caja (como `GInput`) | sin valor |
| `required` | Boolean | `aria-required` y marca; **nunca `required` nativo** | `false` |
| `mark` | Boolean | | sin valor |
| `readonly` | Boolean | `readonly` nativo y `aria-readonly`; enfocable, sin pasos, sin a. m./p. m. ni lecturas; la lectura en palabras sí se ve; **se envía** | sin valor, equivale a `false` (contexto de `GForm`) |
| `disabled` | Boolean | `disabled` en el campo, los botones y el oculto (no se envía) | sin valor, equivale a `false` (contexto de `GForm`) |
| `size` | String | `xs` `sm` `md` `lg` `xl` | `md` |
| `variant` | String | `outline` `soft` | `outline` |
| `density` | String | `default` `comfortable` `compact` | contexto de `GForm` o `default` |
| `color` | String | `brand` `accent` `neutral` `success` `warning` `danger` `info`; solo el color del foco, como `GInput` | sin valor (`--g-color-focus`) |
| `rounded` | String | `none` `xs` `sm` `md` `lg` `xl` `pill` | sin valor (`sm`) |
| `block` | Boolean | | sin valor, equivale a `false` (dentro del layout de formulario, `true`) |
| `id` | String | | generado |

**No existen** (DECISIONS #402): `type` (siempre `text`), `inputmode` como prop (se deriva; el atributo sobrescribe), `format` (lo da `Intl`), `timeZone`, `loading`, `steppers` (una hora se ajusta con flechas y se escribe; −/+ de un minuto no sirven a nadie) y `words` (la escritura en palabras es parte de la forma por defecto). **Reservadas** (no se usan para otra cosa): `mode`, `picker`, `suggestions`, `secondStep`, `prefer`.

**Atributos:** `class` y `style` van a la raíz; el resto (`placeholder`, `autocomplete`, `form`, `aria-*`, escuchas) al `<input>` visible, con los manejadores propios primero. `autocomplete` es `off` por defecto; `inputmode` es `numeric` por defecto y **va antes** de tus atributos (puedes pasar `inputmode="text"`); `type`, `role`, `dir` y los `aria-value*` los fija el campo y ganan. `form` se copia también al oculto.

## Eventos

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `update:modelValue` | `String \| null` | Cada cambio del **valor** (no del texto): al escribir (si lo escrito es una hora, esa hora; si no, `null`), al pegar, en cada paso (también al repetir), al elegir a. m./p. m. o una lectura |
| `change` | `String \| null` | El **valor confirmado** cambia: al salir del campo o con Intro (si difiere del último confirmado); **una vez por gesto** de paso (al soltar la tecla, `keyup` de ↑, ↓, Re Pág o Av Pág), nunca por cada paso repetido; **una vez por activación** de a. m./p. m. o de una lectura. Salir sin cambios no emite |

- **«Último confirmado»:** se fija al montar y con cada `change`; un cambio de `modelValue` desde la aplicación lo actualiza **sin** emitir.
- **`change` está declarado en `emits`:** tu `@change` recibe la hora confirmada y no llega al `<input>` nativo. El `change` nativo sigue existiendo para el contexto de `GForm` y no se reemite.
- Los demás eventos (`focus`, `blur`, `keydown`, `input`, `paste`…) llegan nativos al `<input>` visible, **después** de los manejadores propios.

**Métodos expuestos:** ninguno.

## Slots

| Slot | Propósito | Notas |
| --- | --- | --- |
| `label` | Etiqueta con contenido rico | Como `GInput`: dentro del `<label>` |
| `hint` | Ayuda con contenido rico | Conserva el `id` de la ayuda |
| `error` | Error con contenido rico | Dentro de la región del mensaje |
| `prepend` | Icono decorativo antes del prefijo | Envuelto en `aria-hidden`. Un reloj de adorno va aquí con [`GIcon`](../GIcon/README.md); el campo no trae ningún icono propio |

**Sin `append` ni `action`:** el final de la caja es de a. m./p. m. y de las dos lecturas. Si se pasan, no se pintan y se avisa.

## Idioma

- **Resolución del idioma:** prop `locale`, después el `lang` del **ancestro más cercano** (incluye `<html>`) y por último `navigator.language`; al montar y cuando cambia la prop. Un `locale` que `Intl` rechaza avisa y sigue la cadena sin la prop.
- **Ciclo:** `hourCycle` o, sin él, el que resuelve `Intl` para el idioma (`h11` y `h12` son 12 h; `h23` y `h24` son 24 h).
- **Formato:** el de `Intl.DateTimeFormat` para el idioma: sus cifras, su separador («21.30» en finés) y su orden (la mitad del día **delante** en coreano, «오후 9:30»). Se quitan las marcas bidi. El espacio antes del marcador es el de `Intl` y cambia por motor (U+202F o U+0020): el filtro y el intérprete aceptan cualquier espacio.
- **Franjas del día** (DECISIONS #407): las de `Intl` (`dayPeriod: 'long'`, datos de CLDR): «de la madrugada», «de la mañana», «del mediodía», «de la tarde», «de la noche»; en inglés, «in the morning»…
- **Dirección:** el `<input>` lleva `dir` según el idioma (RTL en árabe, hebreo, persa y otros). A diferencia de `GNumberField` (`dir="ltr"` siempre, por el signo), una hora no tiene signo y «٩:٣٠ م» necesita su marcador al final lógico.
- **Idioma cambiado en caliente:** un cambio del `lang` de un ancestro **después de montar** no se observa; pasa `locale` reactivo.
- **Sin textos propios** (DECISIONS #226): los nombres de la hora, de a. m./p. m. y de las franjas salen de `Intl`. El único texto de tu aplicación es `labels.invalid`.

## Accesibilidad

```html
<div class="g-input g-input--… g-time-field g-time-field--h12">
  <label class="g-input__label" id="ID-label" for="ID">Hora de la toma</label>
  <div class="g-input__row">
    <div class="g-input__control" data-g-tooltip-box>
      <span class="g-time-field__value">
        <span class="g-time-field__mirror" aria-hidden="true">21:30</span>
        <input class="g-input__field g-time-field__field" id="ID" type="text" role="spinbutton" dir="ltr"
               inputmode="numeric" autocomplete="off"
               aria-valuenow="1290" aria-valuetext="21:30 de la noche" aria-required="true"
               aria-describedby="ID-hint ID-message">
      </span>
      <span class="g-time-field__reading" aria-hidden="true"><span class="g-time-field__reading-word">de la noche</span></span>
      <input type="hidden" name="toma" value="21:30">
      <span class="g-time-field__halves">
        <button type="button" class="g-time-field__half" data-half="am" tabindex="-1" aria-pressed="false"
                aria-controls="ID" aria-labelledby="ID-am ID-label">…</button>
        <button type="button" class="g-time-field__half is-on" data-half="pm" tabindex="-1" aria-pressed="true"
                aria-controls="ID" aria-labelledby="ID-pm ID-label">…</button>
      </span>
    </div>
  </div>
  <div class="g-input__support">…<div class="g-input__message" id="ID-message"></div></div>
</div>
```

- **Un solo `<input type="text" role="spinbutton">`** (patrón *Spinbutton* de WAI-ARIA APG, un valor de un conjunto discreto y ordenado). No es `type="time"`: cada motor lo dibuja y lo valida distinto, el formato es del sistema y `min`/`max` no cruzan la medianoche.
- **`aria-valuenow`** = minutos desde las 00:00 (segundos con `seconds`), solo con valor.
- **`aria-valuetext`** = la hora **con su franja** siempre que hay valor. En 12 h, el formato de `Intl` con la franja («9:30 de la noche»); en 24 h, el formato del idioma, un espacio y la franja («21:30 de la noche»). Sin franja (antes de montar, o un idioma que no la tiene), solo la hora.
- **Texto sin interpretar** («99:99»): sin `aria-valuenow`; `aria-valuetext` es **lo escrito**, para que el lector diga lo que hay en la caja. **Vacío:** sin ninguno de los dos.
- **`aria-valuemin` y `aria-valuemax`** (en la misma unidad) **solo con `min` y `max` y `min ≤ max`**. Con un arco que cruza la medianoche, con uno solo de los dos o sin ninguno, **no se ponen**: ARIA no tiene rangos circulares ni abiertos que valgan para una hora.
- **Nunca `aria-expanded`, `aria-haspopup` ni `aria-controls` en el `spinbutton`** (ARIA no los admite en ese rol).
- **`readonly`:** `readonly` nativo **y** `aria-readonly="true"` (Chromium no expone el nativo en un `spinbutton`). **`required`:** `aria-required="true"`, nunca `required` nativo.
- **a. m./p. m. y las lecturas** son botones de alternar (`aria-pressed`) con `aria-controls` al campo y nombre = **su texto + la etiqueta** («p.m. Hora de la toma», «21:00 de la noche Hora de la toma»; patrón de `aria-labelledby` de `GNumberField`). Sin etiqueta visible, con tu `aria-labelledby` o `aria-label` el nombre se compone con ellos. No llevan `role="group"`: los nombres ya dicen la hora.
- **La lectura en palabras es `aria-hidden`:** ya está en `aria-valuetext`; repetirla en la descripción la diría dos veces.
- **Descripción:** `aria-describedby` = sufijo accesible, ayuda y mensaje (los de `GInput`).
- **Área táctil:** a. m./p. m. y las lecturas de **24 px o más** y, con puntero grueso, **44 × 44 px** (52 en `xl`), medido en la auditoría con táctil emulado.
- **Movimiento reducido:** con `prefers-reduced-motion: reduce` nada se mueve (medido: 0 animaciones).

### Límite de Chromium: la franja en palabras no llega al lector

**En un `spinbutton` editable, Chromium expone como `valuetext` el texto del campo («9:30 p.m.»), no `aria-valuetext` («9:30 de la noche»).** Medido con el protocolo de depuración (CDP) sobre el componente real: «12 h en reposo» con `aria-valuetext` «9:30 de la mañana» da en el árbol de Chromium «9:30 a.m.» y `value` 570; «24 h» con «12:15 del mediodía» da «12:15». **La hora llega y se dice bien en los dos ciclos** («9:30 p.m.», «21:30»); **lo que se pierde en Chromium es solo la franja** («de la noche», «del mediodía»). Sin `min`/`max`, Chromium expone además `valuemin` y `valuemax` 0 (los del rol); `valuetext` sigue diciendo la hora. Y el `spinbutton` en `readonly` no expone `readonly` (enfocable y sin `settable`).

**No se compensa:** repetir la franja en `aria-describedby` la diría dos veces en los motores que sí leen `aria-valuetext`, y la lectura en palabras sigue `aria-hidden`. Lo que sí queda a la vista, en 12 h, es a. m./p. m. como botones con nombre, y en 24 h la hora no ambigua dice por sí sola la mitad del día. Firefox y WebKit no se midieron con lector. **A comprobar con lector de pantalla real** antes de afirmar nada más (ver «No verificado»).

## Personalidad

Con tokens y sin constantes de tema nuevas (DECISIONS #412). **Con `prefers-reduced-motion: reduce` nada se mueve.** Nada se anima al montar. **Sin usos nuevos de `--g-ease-spring` ni `--g-ease-bounce`:** es una entrada, y las entradas no llevan muelle.

| Pieza | Qué | Duración y curva |
| --- | --- | --- |
| **La hora mide su texto** | La celda del valor mide el texto (un espejo invisible con la misma tipografía y cifras tabulares) y detrás, a la separación de la caja (8 px en `md`), va la lectura en palabras; el sufijo y el `output` quedan pegados a ellas | — |
| **La palabra se recorta, nunca empuja la hora** | La lectura es **todo o nada**: se ve entera o no se ve; recortada con elipsis solo hasta su mínimo legible, y por debajo desaparece con su separación. Nunca asoma medio glifo ni una hora a medias («9:3» por «9:30») | — |
| **La palabra entra** | Cuando la **franja cambia con el foco en el campo** (↑ que cruza las 12:00, «de la mañana» a «del mediodía»; o la primera hora escrita), la palabra sube 4 px desde abajo y aparece. **Nada** al montar, al escribir cifras que no cambian la franja, al salir ni cuando la aplicación cambia el valor sin foco | `--g-duration-press`, `--g-ease-out`. Medido: 10 cuadros con 4 posiciones intermedias, de 4 px a 0, en los tres motores |
| **Las dos lecturas aparecen** | El par aparece con un fundido y su texto sube igual que la palabra (son dos animaciones distintas a propósito: los botones van de borde a borde y, si el par se desplazara, su fondo asomaría fuera de la caja). Solo existen con foco; al irse, se quitan sin animar | Las mismas |
| **a. m./p. m. y las lecturas son parte de la caja** | Del alto de la caja, de borde a borde, separados por líneas de borde de control; un solo estilo de pulsado para los dos pares (`accent-soft` y `on-accent-soft`, más el peso de acción) | `--g-duration-fast`, `--g-ease-standard` (color y fondo) |
| Rechazo al enviar | `is-rejected`: la sacudida de `GInput` mueve la fila con los botones dentro (medido: una sola animación y a. m./p. m. se mueven con la fila); con `reduce`, ni sacudida ni desplazamiento | La de `GInput` |

Pulsar el **área vacía de la caja, la lectura, el prefijo, el sufijo o el `output`** enfoca el campo con el cursor al final, sin abrir nada (a. m./p. m. y las lecturas quedan fuera).

## Tema

El componente solo lee tokens `--g-*` y alias locales (`--_*`). **No define tokens nuevos** (DECISIONS #412), no usa valores de respaldo y no lleva colores literales: según la auditoría, en `GTimeField.css` solo hay literales de `24px`, `44px`, el `1px` de hueco del cursor del espejo y el patrón de texto oculto; los colores de sistema aparecen solo dentro de `forced-colors`. Sin muelle ni rebote. Lo de la caja, el prefijo y el sufijo, el `output`, el pie, el solo lectura, el foco y la sacudida de rechazo son de `GInput`.

| Token | Para qué |
| --- | --- |
| `--g-space-1` | Separación de la lectura (la de la caja: `space × 2` en `md`); entrada de la palabra (`× 1`); relleno en línea de a. m./p. m. y de las lecturas |
| `--g-border-width`, `--g-color-border-control` | Separador entre la caja y a. m./p. m. o las lecturas y entre los dos botones (≥ 3:1: delimita un control); margen negativo para llegar de borde a borde |
| `--g-color-border-strong` | Separador con el campo deshabilitado |
| `--g-color-text-muted` | Lectura en palabras y texto de a. m./p. m. y de las lecturas en reposo |
| `--g-color-text` | Texto de a. m./p. m. y de las lecturas al pasar |
| `--g-color-text-subtle` | Lectura y botones con el campo deshabilitado |
| `--g-color-neutral-soft` | Fondo al pasar y pulsar |
| `--g-color-accent-soft`, `--g-color-on-accent-soft` | **Pulsado** de a. m./p. m. y de las lecturas |
| `--g-text-action-weight` | Peso del pulsado (el estado no depende solo del color) |
| `--g-radius-{rounded}`, `--g-radius-sm` | Esquina exterior del último botón (la de la caja) |
| `--g-text-caption-size` a `--g-text-body-size` (con sus `line`) | Tamaño de la lectura, del espejo y de los botones (el del texto escrito de cada `size`) |
| `--g-duration-fast`, `--g-ease-standard` | Fondo y color de los botones |
| `--g-duration-press`, `--g-ease-out` | Entrada de la palabra y de las lecturas |
| `--g-focus-width` y el color de foco del campo | Anillo de seguridad **por dentro** de los botones si una tecnología de apoyo los enfoca; el anillo del campo es el de `GInput` |

**Medidas del componente** (de tokens; constantes de diseño, no tokens): alto de a. m./p. m. y de las lecturas = el alto de la caja (24 · 28 · 36 · 44 · 52 px de `xs` a `xl` con `space` 4), piso de 24 px y de 44 px con `pointer: coarse`; lectura a la hora = el `gap` de la caja (4 · 4 · 8 · 8 · 12 px), en la misma línea base (Δ ≤ 0,5 px).

**Contraste medido** (auditoría, 28 configuraciones por motor: tema por defecto, el de la auditoría, el propio del estilo y los once de Dark Color Presence, claro y oscuro; colores compuestos sobre el fondo real):

| Medida | Mínimo en las 28 |
| --- | --- |
| Palabra y hora entendida (se exigen 4,5:1) | **6,49:1** |
| Botón en reposo (4,5:1) | **6,87:1** |
| **Pulsado**, `on-accent-soft` sobre `accent-soft` (4,5:1) | **4,51:1** |
| Al pasar, `text` sobre `neutral-soft` (4,5:1) | **13,85:1** |
| Separador (3:1) | **3,00:1** |
| Anillo de foco contra la superficie (3:1) | **4,52:1** |

El pulsado pasa **sin margen** en el tema propio claro (4,51) y en el oscuro por defecto (4,52): vive del par `on-accent-soft` / `accent-soft`, que el CLI garantiza al menos 4,5:1. No depende solo del color: lleva el peso de acción. Un tema que bajara ese par de 4,5:1 afecta al pulsado y lo mide el motor de tema, no el campo.

**`forced-colors`** (emulado en Chromium): botones `ButtonText` con separador visible; pulsado `Highlight` / `HighlightText` con `forced-color-adjust: none` y el peso; deshabilitado `GrayText`; lectura `CanvasText`.

**Tematizar el mínimo:** el del campo se mide solo; para una fila más ancha, `--g-form-min` de `GForm` sigue valiendo.

## SSR

Como `GNumberField`: sin acceso a `document`, `window`, `navigator` ni `matchMedia` al importar ni al renderizar en el servidor. **Con `locale`**, servidor y primer render del cliente escriben el texto formateado; **sin `locale`**, los dos escriben el **canónico** («09:07») y al montar se reformatea. El oculto lleva el canónico desde el servidor. **La lectura en palabras, su parte de `aria-valuetext`, las dos lecturas, «ahora» y las medidas solo existen en el cliente** (tras montar): las tablas de franjas de `Intl` pueden diferir entre el ICU del servidor y el del navegador y romperían la hidratación. **Pasa `locale` en SSR** para que el HTML llegue formateado. Cubierto por `GTimeField.ssr.test.js` (4 pruebas).

## Avisos de desarrollo

Prefijo `[Grana GTimeField]`; una vez por instancia; solo fuera de producción.

| # | Causa | Qué hace el componente |
| --- | --- | --- |
| 1 | Sin nombre accesible (sin `label`, slot `label`, `aria-label` ni `aria-labelledby`) | Avisa |
| 2 | Sin `labels.invalid` (al montar) | Un texto que no es una hora bloqueará el envío sin mensaje (con un espacio) |
| 3 | `modelValue` con formato inválido | Se lee como `null` |
| 4 | `modelValue` con segundos sin `seconds` | Se ignoran: se muestra y se envía sin ellos |
| 5 | `min` o `max` con formato inválido | Se ignora ese límite |
| 6 | `step` que no es entero ≥ 1 | Se usa `1` |
| 7 | `locale` que `Intl` rechaza | Se usa el idioma del documento |
| 8 | `type` en los atributos, o slots `append` o `action` | Se ignoran: el campo es siempre `type="text"` y esos slots no se pintan |

`min > max` **no** avisa: es un arco que cruza la medianoche.

## Clases

- **Raíz:** las de `GInput` más `g-time-field`, `g-time-field--h12` (ciclo de 12 h) y `has-choices` (las dos lecturas están pintadas).
- **Valor:** `g-time-field__value` (celda), `__mirror` (espejo, `aria-hidden`), `__field` (el `<input>` visible, junto a `g-input__field`).
- **Lectura:** `g-time-field__reading` (`aria-hidden`), `__reading-time` y `__reading-word` (con `is-entering` al crearse por un cambio de franja con foco).
- **12 h:** `__halves` y `__half` (con `is-on` y `data-half="am|pm"`), `__half-text`.
- **Lecturas de 24 h:** `__choices` (con `data-compact`), `__choice` (con `is-on`), `__choice-time` y `__choice-word`.
- **Medidor:** `__measure` (`aria-hidden`, fuera de flujo), solo dentro de una `GFormRow` que mide o fuera de ella sin `block`.
- **Interno:** `data-fit` y `--_min-inline` en la raíz (ver «En una fila de formulario»); no son API.

## Limitaciones conocidas

- **Chromium y la franja en palabras:** ver «Accesibilidad». La hora llega; la franja, no.
- **Hueco del cursor de 1 px en WebKit:** con el cursor al final, WebKit desplaza 1 px la hora en algunos anchos con la fuente de serie (medido en «21:30» `md`, `lg` y `xl`, y «9:30 p.m.» `xl`). Es el **mismo límite compartido con `GNumberField`** (hallazgo 1 abierto de su auditoría, DECISIONS #313): la constante de 1 px del espejo y del medidor se enmendará en los dos a la vez; el mínimo publicado subiría 1 px. En Chromium y Firefox no se desplaza.
- **Texto al 200 % en un visor de 320 px:** el mínimo del 12 h (302 px) supera el contenedor (254 px). La raíz se acota al 100 % y **no desborda** (0 px), y la hora cede 46 px del campo; se sigue leyendo en el botón pulsado y en `aria-valuetext`. Es la acotación al 100 % que pidió DECISIONS #416, preferible a un desborde horizontal de la página.
- **Franjas de CLDR:** cambian por idioma y por versión del motor y a veces sorprenden (`en` llama «in the morning» a las 00:00; `es` no tiene «medianoche»). Las palabras solo se entienden en el idioma de la página. En idiomas cuyo formato de 12 h ya lleva la franja («晚上9:30») no se pinta la lectura (sería repetirla).
- **Teclado numérico del móvil** (`inputmode="numeric"`): sin «:» en iOS («930» funciona) y sin letras; las dos lecturas y a. m./p. m. cubren la mitad del día. Para escribir palabras, `inputmode="text"`.
- **Idioma cambiado en caliente** (`lang` de un ancestro): no se observa; pasa `locale` reactivo.
- **Inicio y Fin** editan el texto; en macOS (Firefox, WebKit) no mueven el cursor por convención del sistema.
- **Zona horaria y horario de verano:** fuera del campo.
- **Sin `name`** no se registra en `GForm` y su error propio no bloquea el envío de `GForm`.
- **Un `GDatePicker` vacío** mide 37 px junto a los 42 px de `GInput` y `GTimeField` con el texto al 200 % (hallazgo 3 de la auditoría, de `GDatePicker`, abierto y fuera de este componente).
- **Navegadores:** el campo usa `Intl.DateTimeFormat` con `dayPeriod`, `:has()` (en el CSS del par de lecturas) y `ResizeObserver`. No se midió ningún navegador anterior a los tres motores de Playwright (Chromium, Firefox, WebKit).

## Reservado (fuera de v0.1)

Nombres y formas apartados para entregas siguientes; **hoy no existen**.

- **C «Tramo»: `mode="range"`** (segunda entrega, DECISIONS #413). Un grupo con dos campos de esta base (inicio y fin) y una regla del día debajo, con `modelValue` `{ start, end }` y envío `name-start` y `name-end`. **Dos reglas decididas por el usuario el 2026-10-06:** un **fin anterior al inicio es el día siguiente**, sin error y con «+1 día» visible en el `output` del fin (y por tanto en su descripción accesible); y **al mover el inicio se conserva la duración** (el fin se mueve con él; cambiar el fin cambia la duración). El fin aceptaría una duración escrita con «+» («+8», «+1h30»). Necesita contrato propio antes de construirse; hoy, dos `GTimeField` en una `GFormRow` y la duración calculada por tu aplicación en el `output`.
- **B «Rejilla del día»: `picker`** (tercera entrega, solo si un producto la pide, DECISIONS #414): un botón al final de la caja que abre un diálogo no modal con horas habituales y el día en cuatro filas de seis. Entraría en la misma entrada propia (#415).
- **También reservados:** `GDateTimeField` (una sola caja con fecha y hora; no tiene ronda), `suggestions`, `secondStep` (paso en segundos) y `prefer` (mitad del día preferida, si los datos dijeran que la regla de la hora ambigua se equivoca). Moneda, teléfono y búsqueda de dirección siguen sin ronda.

## Verificación

- **Pruebas** (vitest con jsdom y, para el servidor, entorno node), **110 de 110 en verde al documentar** (ejecutadas de nuevo sobre el árbol de trabajo, que tenía cambios de bruno sin confirmar en `GTimeField.vue` y `GTimeField.test.js`): `GTimeField.test.js` (64), `GTimeField.ssr.test.js` (4), `utils/timeInput.test.js` (33, el motor) y `src/time-field.test.js` (9, la entrada).
- **Navegador** (Playwright en Chromium, Firefox y WebKit): los specs de bruno `time-field.spec.mjs` y `personalidad-time-field.spec.mjs`, más `form-distribution.spec.mjs` (DECISIONS #184). Según la auditoría de coco, **104 pasan y 7 se omiten por diseño** (entre ellas, el pegado en Firefox: un evento sintético no lleva el texto). Los specs de la primera pasada **no se repitieron tras el remate de #416** ni al documentar. Cobertura: árbol con `ariaSnapshot` y CDP en Chromium, escritura en los idiomas de la tabla, filtro, pasos y arco, «ahora» con el reloj fijado, a. m./p. m. sin mover el foco, las dos lecturas con un toque, `data-compact`, error propio al salir y al enviar, 320 px LTR y RTL, filas con `GInput`, `GDatePicker` y `GSelect`, mínimo publicado, entrada de la palabra y movimiento reducido.
- **Auditoría de coco** con el componente real publicado (`dist/time-field.umd.js` + `dist/grana.umd.js` + `dist/grana.css` + `dist/fonts.css`) y un tema distinto al por defecto (generado con `@grana/cli`: `space` 3, texto de 18 px, Georgia): `node design/lab/time-field/auditoria-verificar.mjs`. **16 891 de 16 891** comprobaciones tras los arreglos de los hallazgos 2 y 4 (estático 19/19, Chromium 5645/5645, Firefox 5601/5601 y WebKit 5626/5626; la primera pasada, antes de ellos, dio 16 244 de 16 246 con el hallazgo 4 abierto). **No se repitió al documentar.** Resultado: sin defecto bloqueante, `candidate`. Hallazgos: 1 (la lectura asomaba a medias, corregido), 2 (texto al 200 % fuera de fila, cerrado por #416), 3 (de `GDatePicker`, abierto), 4 (en WebKit con táctil el toque en a. m./p. m. y en las lecturas no hacía nada porque cancelar el `pointerdown` cancelaba el `click`; cerrado: la acción ocurre en `pointerdown`, con `click` solo para `detail` 0) y 7 (límite de Chromium, registrado). Los toques se midieron con `tap()` en WebKit de escritorio con táctil emulado.
- **Empaquetado** (al documentar): `dist/time-field.js` y `dist/time-field.umd.js` existen; `dist/grana.js` no contiene `GTimeField`; `dist/grana.css` contiene `g-time-field__reading`.
- **Iconos:** el campo no trae ninguno propio; `node packages/vue/scripts/check-icons.mjs` en verde (comprobado al documentar).

## No verificado

- **Lector de pantalla real** (VoiceOver, NVDA, JAWS, TalkBack): un `spinbutton` cuyo valor es una hora con su franja (y, en Chromium, cuál se dice de verdad); a. m./p. m. y las lecturas fuera del Tab; el texto sin interpretar con `aria-invalid`. Solo se comprobó el árbol de accesibilidad (`ariaSnapshot` y CDP).
- **Móvil real:** teclado numérico (`inputmode="numeric"` en iOS y Android con «930»), toque real en a. m./p. m. y en las lecturas sin abrir el teclado (el arreglo del toque se midió en WebKit de escritorio con táctil emulado), área táctil en dispositivo.
- **IME real** (coreano, japonés) y **pegado real en Firefox** (el spec lo omite).
- **`forced-colors` real** (Windows): emulado solo en Chromium; en Firefox y WebKit ni siquiera emulado. Puntero grueso en Firefox no emulado por Playwright.
- **Zoom de solo texto real** de Firefox y Safari (aproximado con `html` al 200 %) y zoom de página real (aproximado con un visor de 640 px y DPR 2).
- **Franjas de CLDR en Safari real** y los idiomas cuya franja ya va dentro del texto (el caso «晚上9:30», sin lectura, se midió con un formato de `Intl`, no con Safari).
- **Cifras de este README tomadas de otros informes** (pesos de bruno, auditoría y estilo de coco) y no remedidas al documentar, salvo las marcadas como «Remedido» o «ejecutadas de nuevo».

## Fuentes

- API: [`GTimeField.meta.json`](./GTimeField.meta.json) · Contrato: [`design/contracts/time-field.md`](../../../../../design/contracts/time-field.md) (DECISIONS #400 a #416) · Formularios: [`design/contracts/form.md`](../../../../../design/contracts/form.md) (§2 error propio y `ownReveal`, §4 mínimo en `GFormRow`, §8 «Fecha y hora») · Rondas de kiwi: [`design/lab/time-field/r01/`](../../../../../design/lab/time-field/r01/) y [`r02/`](../../../../../design/lab/time-field/r02/) · Estilo: [`design/lab/time-field/estilo.md`](../../../../../design/lab/time-field/estilo.md) · Auditoría: [`design/lab/time-field/auditoria.md`](../../../../../design/lab/time-field/auditoria.md) · Caja: [`GInput`](../GInput/README.md) · Fila: [`GFormRow`](../GFormRow/README.md) · Fecha: [`GDatePicker`](../GDatePicker/README.md) · Hermano: [`GNumberField`](../GNumberField/README.md)
