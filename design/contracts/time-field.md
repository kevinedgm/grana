# Contrato · GTimeField

**Dueño:** lima · **Estado:** aprobado (concepto **A «La hora dicha»** por defecto y la regla de la hora ambigua sin pista: decisiones del usuario del 2026-10-06; **C «Tramo»** reservado como `mode="range"` para una segunda entrega con sus dos reglas ya decididas por el usuario; **B «Rejilla del día»** reservado como `picker` para una tercera, solo si un producto la pide; el resto deriva de HTML, WAI-ARIA APG *Spinbutton*, WCAG 2.2 y los contratos vigentes; **ninguna pregunta de producto abierta**) · **Basado en:** `design/lab/time-field/r01/` (kiwi; base funcional: 23 decisiones, hallazgos L1 a L16) y `design/lab/time-field/r02/` (kiwi; conceptos A, B y C, comparativa, L17 a L22; `verificar.mjs` 339/339 en los tres motores; commit `388f33b`) · **Decisiones:** DECISIONS.md **#400 a #414** · **Convive con:** `input.md` (la caja; tercer consumidor de los slots internos y un añadido interno nuevo, N4), `form.md` (contexto, `useFormField`, error propio ampliado §2, `GFormRow` §4, receta «Fecha y hora» §8; Fase 5), `number-field.md` (mismo patrón de `spinbutton` editable y de canónico oculto; motor distinto), `datepicker.md` (fecha + hora en una fila; reservado B), `tooltip.md` (caja visible, #395), `tokens.md` §37
**Tag:** `g-time-field` · **Categoría:** entradas · **Entrada del paquete:** `@grana/vue/time-field` (#415, enmienda #400) · **Fase 5 del sistema de formularios** (rondas propias de kiwi, #168)
**Componente complejo** (CLAUDE.md, «Modelos por rol»: compone `GInput` y lleva un motor de interpretación propio): **coco y bruno en Opus**.

Un campo para **una hora del reloj** (una cita, una toma, el inicio de un turno): se **escribe como se dice** («930», «21», «9.30p», «9 noche»), vuelve **en palabras** pegadas al número («9:30 · de la noche») y, cuando lo escrito puede ser de mañana o de noche, **ofrece la otra lectura a un toque**. El modelo es una cadena `"HH:mm"` (o `"HH:mm:ss"`) o `null`: una hora de pared, sin fecha ni zona.

---

## Principios

- **No duplica `GInput`: lo compone** (#400, como `GNumberField` #309 y `GCombobox` #330). Etiqueta, caja, prefijo/sufijo, `output`, pie, mensaje, marcas, contexto de `GForm`, `is-ready`, `is-rejected` y la caja visible del tooltip (`data-g-tooltip-box`, #395) son los de `GInput`.
- **Se escribe, no se elige.** Un solo `<input type="text" role="spinbutton">`: ni `type="time"` (cada motor lo dibuja y lo valida distinto, el formato es del sistema y `min`/`max` no cruzan la medianoche), ni tres segmentos (tres paradas, sin pegar ni escribir «930» de una vez), ni una lista de 48 horas (#400).
- **Una hora de pared, no un instante** (#401). Sin fecha, sin zona, sin horario de verano: se ordena como texto. La fecha va en su propio campo (receta, `form.md` §8) y la zona, si importa, se **dice** con el sufijo (#411).
- **Grana no valida** (#157): lo escrito fuera de `min`/`max` no se recorta y lo que cae fuera de la rejilla de `step` no se redondea; `min`, `max` y `step` gobiernan **los pasos**. El error lo pone la aplicación. La única excepción es lo que **no es una hora**: eso solo lo sabe el campo y bloquea el envío con su error propio (#409).
- **Lo que se envía es canónico, no lo visible** (`21:30`, no «9:30 p.m.» ni «٩:٣٠ م»): un `<input type="hidden">` lleva el `name`.
- **Sin textos propios** (#226): los nombres de la hora, de a. m./p. m. y de las franjas del día salen de `Intl` con `locale`; el único texto de la aplicación es `labels.invalid`.
- **Personalidad** (#407): la hora dicha. Ninguna pieza cambia el valor que lee un lector salvo para decir **más** (la franja en palabras); con movimiento reducido nada se mueve.

## Cuándo usarlo (frontera)

| Necesidad | Usar | No usar |
| --- | --- | --- |
| Una hora del reloj (cita, toma, apertura) | `GTimeField` | `GInput type="time"`; `GSelect` con 48 horas |
| Fecha **y** hora | `GDatePicker` + `GTimeField` en una `GFormRow` (dos preguntas; receta «Fecha y hora», `form.md` §8). **`GDateTimeField` reservado** (#411) | Un campo único que mezcla calendario y hora |
| Inicio y fin de un turno o cita, con duración | Hoy: dos `GTimeField` en una `GFormRow` y la duración en el `output` del fin (calculada por la aplicación). **Reservado: `mode="range"`** («Tramo», segunda entrega, #413) | Restar de cabeza; un error por «fin anterior al inicio» en un turno de noche |
| Elegir entre horas habituales sin escribir | Hoy: `GRadioGroup appearance="chip"` con las horas de la aplicación, o `GTimeField` con la ayuda «Escribe la hora». **Reservado: `picker`** («Rejilla del día», tercera entrega, solo si un producto la pide, #414) | `GSelect` con 96 opciones |
| Una duración («1 h 30 min») | `GNumberField` con `suffix` (minutos u horas) | `GTimeField` (no es una hora del reloj: no da la vuelta a medianoche) |
| Un instante con zona (teleconsulta entre países, agenda) | `GCalendar` (instantes con zona explícita, #38), o `GTimeField` + `suffix` con la zona y la conversión en la aplicación | Que el campo convierta zonas |

---

## Props

| Prop | Tipo | Valores | Default | Origen |
| --- | --- | --- | --- | --- |
| `modelValue` | String \| null | `"HH:mm"`, `"HH:mm:ss"` | `null` | compartida (`api.md`) |
| `min` | String | `"HH:mm"`, `"HH:mm:ss"` | sin valor | propia |
| `max` | String | `"HH:mm"`, `"HH:mm:ss"` | sin valor | propia |
| `step` | Number | entero ≥ 1 (minutos) | `1` | propia |
| `seconds` | Boolean | | `false` | propia |
| `locale` | String | etiqueta BCP 47 | sin valor (ver «Idioma») | compartida (`api.md`) |
| `hourCycle` | String | `h12` `h23` | sin valor (el del idioma) | propia |
| `labels` | Object | `{ invalid }` | `{}` (sin valores por defecto, #226) | propia |
| `prefix`, `suffix`, `prefixLabel`, `suffixLabel` | String | texto libre | sin valor | propia (como `GInput`, #166) |
| `name` | String | | sin valor | propia |
| `label` | String | texto libre | sin valor | propia |
| `hint` | String | texto libre | sin valor | propia |
| `error` | String | texto libre | sin valor | propia (form.md C4) |
| `warning` | String | texto libre | sin valor | propia (form.md C5) |
| `valid` | String | texto libre | sin valor | propia (form.md C5) |
| `output` | String | texto libre | sin valor | propia (form.md C14) |
| `required` | Boolean | | `false` | propia |
| `mark` | Boolean | | `undefined` | propia (form.md §2) |
| `readonly` | Boolean | | `undefined` → `false` | compartida |
| `disabled` | Boolean | | `undefined` → `false` | compartida |
| `size` | String | `xs` `sm` `md` `lg` `xl` | `md` | compartida |
| `variant` | String | `outline` `soft` | `outline` | compartida (subconjunto, como `GInput`) |
| `density` | String | `default` `comfortable` `compact` | `undefined` → contexto o `default` | compartida |
| `color` | String | `brand` `accent` `neutral` `success` `warning` `danger` `info` | sin valor (`--g-color-focus`) | compartida (como `GInput`: solo el foco) |
| `rounded` | String | `none` `xs` `sm` `md` `lg` `xl` `pill` | sin valor (`sm`) | compartida |
| `block` | Boolean | | `undefined` → `false` (dentro del layout, `true`) | compartida |
| `id` | String | | generado | propia |

**No existen** (#402): `type` (siempre `text`), `inputmode` como prop (se deriva; `$attrs` puede sobrescribirlo), `format` (lo da `Intl`), `timeZone` (#411), `loading`, `steppers` (una hora se ajusta con flechas y se escribe; −/+ de un minuto no sirven a nadie), `words` (la escritura en palabras es parte de la forma por defecto, #407). **Reservados** (no se usan para otra cosa): `mode` (`single` · `range`, #413), `picker`, `suggestions` (#414), `secondStep` (paso en segundos), `prefer` (mitad del día preferida si los datos dijeran que la regla de #408 se equivoca), `GDateTimeField` (#411).

### Reglas de props

- **`modelValue`:** `"HH:mm"` o `"HH:mm:ss"` en 24 h con cero delante y cifras latinas (00:00 a 23:59:59; el formato de HTML e ISO 8601 para una hora), o `null`. `undefined` y `''` se leen como `null` sin aviso. Cualquier otra cosa («9:30», «24:00», «21:30:00Z», un `Date`) se lee como `null` **con aviso**. Con `seconds` en `false`, un valor con segundos se muestra y se envía **sin** ellos (aviso; el campo no emite por su cuenta: la próxima edición emite `"HH:mm"`). **El componente emite siempre `"HH:mm"` (o `"HH:mm:ss"` con `seconds`) o `null`; nunca un `Date` ni un número.**
- **`min`, `max`:** mismo formato. Limitan los **pasos** (flechas, Re Pág/Av Pág) y se exponen al árbol (ver «Estructura accesible»); **no** limitan lo escrito ni lo pegado (#157). Con **`min > max`** el rango **cruza la medianoche** (22:00–06:00): no es un error y no avisa (#401). Con solo `min`, el rango va de `min` a 23:59(:59); con solo `max`, de 00:00 a `max`. Un valor que no cumple el formato se ignora con aviso.
- **`step`:** minutos entre pasos; la rejilla se cuenta **desde `min`** (o desde 00:00). No redondea lo escrito («9:07» con paso 15 se queda 9:07). Un valor que no es entero ≥ 1 lo rechaza el validador y se usa `1` (aviso). Con `seconds`, `step` sigue en minutos (#402).
- **`seconds`:** canónico, formato y `aria-value*` con segundos; se pueden escribir («93015», «9:30:15»).
- **`locale`, `hourCycle`:** ver «Idioma». `hourCycle` fuerza 12 h (`h12`) o 24 h (`h23`) con independencia del idioma (como `firstDay` en `GDatePicker`); `h11` y `h24` no se admiten (validador).
- **`labels.invalid`:** el mensaje del error propio cuando lo escrito no es una hora («Escribe una hora, por ejemplo 9:30»). Sin él, el campo bloquea igual (con un espacio como mensaje, #372) y **avisa al montar**.
- **`prefix`/`suffix` + `*Label`:** la regla de `GInput` (#166, form.md C13). El uso típico del sufijo es **decir la zona** («CDMX» + «hora del centro de México», #411). No entran en `aria-valuetext`.
- **`name`:** va al `<input type="hidden">` canónico y registra el campo en `GForm`; **el `<input>` visible no lleva `name`**. Prop, no atributo (como `GNumberField`).
- **`required`:** marca según la convención de `GForm` y **`aria-required="true"`** en el `<input>` visible; **nunca `required` nativo** (#311, #403).
- **`readonly`:** `readonly` nativo **y** `aria-readonly="true"` (Chromium no expone ninguno en un `spinbutton`, medido por kiwi); enfocable, sin pasos, sin a. m./p. m. ni lecturas, la lectura en palabras sí se ve; **se envía** (#266).
- **`disabled`:** `disabled` nativo en el `<input>`, en a. m./p. m. y en el oculto (no se envía).
- **`size`, `variant`, `density`, `color`, `rounded`, `block`, `label`, `hint`, `error`, `warning`, `valid`, `output`, `mark`, `id`:** pasan tal cual a `GInput`.
- **Atributos** (`placeholder`, `autocomplete`, `form`, `aria-*`, escuchas): al `<input>` visible, como en `GInput` (`class` y `style`, a la raíz). `autocomplete` es `off` por defecto. `form` se copia también al oculto. `inputmode` (derivado, `numeric`) va **antes** de `$attrs` (el consumidor puede pasar `inputmode="text"` para escribir palabras en un teclado virtual, #407); `type`, `role`, `dir` y los `aria-value*` van **después** y ganan.

### Idioma (`locale`, `hourCycle`)

- **Resolución:** la de `GNumberField` (#310): prop `locale` › `lang` del **ancestro más cercano** (`closest('[lang]')`, incluye `<html>`) › `navigator.language`; al montar y cuando cambia la prop; un `locale` que `Intl` rechaza avisa y sigue la cadena sin la prop. bruno puede extraer esa resolución a una utilidad común **sin cambiar** `GNumberField` (L9).
- **Ciclo:** `hourCycle` › `Intl.DateTimeFormat(locale, { hour: 'numeric' }).resolvedOptions().hourCycle` (`h11`/`h12` → 12 h; `h23`/`h24` → 24 h).
- **Formato:** `Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit'[, second: '2-digit'], hourCycle })` sobre un instante ficticio **en UTC** (solo para escribir una hora de pared; nunca la zona del dispositivo): sus cifras, su separador («21.30» en finés), su orden (la mitad del día **delante** en coreano, «오후 9:30»). Se quitan las marcas bidi (U+200E, U+200F, U+061C). El espacio antes del marcador es el de `Intl` y cambia por motor (U+202F o U+0020): el filtro y el intérprete aceptan **cualquier** espacio.
- **Franjas del día** (#407): `Intl.DateTimeFormat(locale, { dayPeriod: 'long' })` hora por hora (CLDR: «de la madrugada», «de la mañana», «del mediodía», «de la tarde», «de la noche»; `en` «in the morning»…). Se leen una vez por idioma y se guardan.
- **Dirección** (#403): el `<input>` lleva **`dir` = la dirección del idioma** (`Intl.Locale(...).getTextInfo()` o `textInfo`; sin ellos, por la subetiqueta de idioma en la lista fija `ar`, `he`, `fa`, `ur`, `ps`, `sd`, `ug`, `yi`, `dv`, `ckb`). A diferencia de `GNumberField` (`dir="ltr"` siempre, para que «-4,5» no se parta): una hora no tiene signo y «٩:٣٠ م» necesita su marcador al final lógico, que en árabe es la izquierda.
- **Límites (README):** un cambio del `lang` de un ancestro después de montar no se observa (pasar `locale` reactivo); las franjas de CLDR cambian con la versión del motor y a veces sorprenden (`en` llama «in the morning» a las 00:00; `es` no tiene «medianoche»).

### SSR

Como `GNumberField`: sin acceso a `document`, `window`, `navigator` ni `matchMedia` al importar ni al renderizar en el servidor. **Con `locale`**, servidor y primer render del cliente escriben el texto formateado; **sin `locale`**, los dos escriben el **canónico** («09:07») y al montar se reformatea. El oculto lleva el canónico desde el servidor. **La lectura en palabras, su parte de `aria-valuetext`, las dos lecturas, «ahora» y las medidas solo existen en el cliente** (tras montar): las tablas de franjas de `Intl` pueden diferir entre el ICU del servidor y el del navegador y romperían la hidratación.

---

## Estructura accesible

```html
<div class="g-input g-input--… g-time-field [g-time-field--h12] [has-choices] [is-…]">     <!-- raíz de GInput; class/style del consumidor -->
  <label class="g-input__label" id="ID-label" for="ID">Hora de la toma<span class="g-input__optional"> (opcional)</span></label>
  <div class="g-input__row">
    <div class="g-input__control" data-g-tooltip-box>                                      <!-- pulsar su área vacía o la lectura enfoca con el cursor al final -->
      <span class="g-input__prepend" aria-hidden="true">…</span>                          <!-- slot prepend -->
      <span class="g-input__prefix" …>…</span>
      <span class="g-time-field__value">                                                   <!-- celda: espejo + input -->
        <span class="g-time-field__mirror" aria-hidden="true">21:30</span>                <!-- solo da ancho -->
        <input class="g-input__field g-time-field__field" id="ID" type="text" role="spinbutton" dir="{del idioma}"
               inputmode="numeric" autocomplete="off" spellcheck="false" autocorrect="off"
               aria-valuenow="1290" aria-valuetext="21:30 de la noche" [aria-valuemin="480" aria-valuemax="1320"]
               aria-required="true" [aria-readonly="true"] aria-describedby="ID-suffix ID-hint ID-message">
      </span>
      <span class="g-time-field__reading" aria-hidden="true">                              <!-- solo en el cliente, con valor -->
        <span class="g-time-field__reading-time">9:30</span>                              <!-- solo mientras se escribe algo que aún no es su forma final -->
        <span class="g-time-field__reading-word [is-entering]">de la noche</span>
      </span>
      <input type="hidden" name="toma" value="21:30">                                      <!-- canónico; display: none -->
      <span class="g-input__suffix" aria-hidden="true">CDMX</span><span class="g-input__suffix-label" id="ID-suffix">hora del centro de México</span>
      <output class="g-input__output" …></output>                                         <!-- solo con output -->
      <!-- slot interno end de GInput: UNO de los dos, nunca ambos -->
      <span class="g-time-field__halves">                                                  <!-- solo 12 h y sin readonly -->
        <button type="button" class="g-time-field__half [is-on]" data-half="am" tabindex="-1" aria-pressed="false"
                aria-controls="ID" aria-labelledby="ID-am ID-label" [disabled]><span class="g-time-field__half-text" id="ID-am">a.m.</span></button>
        <button type="button" class="g-time-field__half is-on" data-half="pm" tabindex="-1" aria-pressed="true"
                aria-controls="ID" aria-labelledby="ID-pm ID-label" [disabled]><span class="g-time-field__half-text" id="ID-pm">p.m.</span></button>
      </span>
      <span class="g-time-field__choices [data-compact]">                                  <!-- solo 24 h, con foco y hora ambigua (#407) -->
        <button type="button" class="g-time-field__choice is-on" tabindex="-1" aria-pressed="true"
                aria-controls="ID" aria-labelledby="ID-choice-0 ID-label">
          <span id="ID-choice-0"><span class="g-time-field__choice-time">9:00</span> <span class="g-time-field__choice-word">de la mañana</span></span>
        </button>
        <button type="button" class="g-time-field__choice" tabindex="-1" aria-pressed="false"
                aria-controls="ID" aria-labelledby="ID-choice-1 ID-label">
          <span id="ID-choice-1"><span class="g-time-field__choice-time">21:00</span> <span class="g-time-field__choice-word">de la noche</span></span>
        </button>
      </span>
      <span class="g-time-field__measure" aria-hidden="true">…</span>                      <!-- solo dentro de una GFormRow que mide (#410) -->
    </div>
  </div>
  <div class="g-input__support"> ayuda · región g-input__message (siempre presente) </div>
</div>
```

- **Tres hijos en flujo** (etiqueta · caja · pie), los de `GInput`: comparte línea en una `GFormRow` sin CSS propio de colocación (medido por kiwi: Δ `top` y alto 0px junto a `GInput`, `GDatePicker` y `GSelect` a 1100/720/320px en los tres motores).
- **Orden dentro de la caja:** `prepend` · prefijo · valor · lectura · (oculto) · sufijo · `output` · a. m./p. m. **o** las dos lecturas. El oculto es `display: none`.
- **`spinbutton` editable** (#403; APG *Spinbutton*: un valor de un conjunto discreto y ordenado):
  - **`aria-valuenow`** = **minutos desde las 00:00** (segundos con `seconds`), solo con valor.
  - **`aria-valuetext`** = la hora con su franja **siempre que hay valor**: en 12 h, el formato de `Intl` con `hourCycle: 'h12'` y `dayPeriod: 'long'` («9:30 de la noche», «밤 9:30»); en 24 h, el formato del idioma, **un espacio** y la franja («21:30 de la noche»). Sin franja (antes de montar, o un idioma sin ella), solo la hora. Un lector diría «1290» sin él.
  - **Texto sin interpretar** («99:99»): sin `aria-valuenow`; `aria-valuetext` = **lo escrito**, para que el lector diga lo que hay en la caja. **Vacío:** sin ninguno de los dos.
  - **`aria-valuemin`/`aria-valuemax`** (en la misma unidad) **solo con `min` y `max` y `min ≤ max`**. Con un arco que cruza la medianoche, con uno solo de los dos o sin ninguno, **no se ponen**: ARIA no tiene rangos circulares ni abiertos que valgan para una hora. Límite conocido: Chromium expone entonces `valuemin`/`valuemax` 0 (los del rol, como en `GNumberField`); `valuetext` sigue diciendo la hora.
  - **Nunca `aria-expanded`, `aria-haspopup` ni `aria-controls` en el `spinbutton`** (ARIA no los admite en ese rol). Si algún día entra B (#414), van en su botón, y el campo solo lleva `aria-keyshortcuts`.
- **a. m./p. m. y las dos lecturas: en el árbol, fuera del Tab** (`tabindex="-1"`, nunca `aria-hidden`; VoiceOver iOS y TalkBack los necesitan sin teclado; el teclado ya tiene sus teclas). Botones de alternar (`aria-pressed`), `aria-controls` al campo, nombre = **su texto + la etiqueta** (`aria-labelledby`, patrón de #311): «p.m. Hora de la toma», «21:00 de la noche Hora de la toma». Sin etiqueta visible: con `aria-labelledby` del consumidor, `"{propio} {sus ids}"`; con `aria-label`, `aria-label="{texto} {aria-label}"`. Sin `role="group"` alrededor: los nombres ya dicen la hora.
- **La lectura en palabras es `aria-hidden`**: ya está en `aria-valuetext`; repetirla en la descripción la diría dos veces.

## Eventos

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `update:modelValue` | `String \| null` | Cada cambio del **valor** (no del texto): al escribir (si lo escrito es una hora, esa hora; si no —vacío, a medias, imposible—, `null`), al pegar, en cada paso (también al repetir), al elegir a. m./p. m. o una lectura |
| `change` | `String \| null` | El **valor confirmado** cambia: al salir del campo o con Enter (si difiere del último confirmado); **una vez por gesto** de paso (al soltar la tecla: `keyup` de ↑, ↓, Re Pág, Av Pág), nunca por cada paso repetido; **una vez por activación** de a. m./p. m. o de una lectura (como un toque de −/+ en `GNumberField`). Salir sin cambios no emite |

- **El modelo refleja siempre lo escrito** (r01 §7): un envío sin salir del campo (Enter, Safari sin foco en el botón) nunca lleva una hora distinta de la que se ve. Escribir «930» emite `"09:00"`, `null` («93» no es una hora) y `"09:30"`: es lo que hay en la caja en cada momento.
- **`change` se declara en `emits`** (lección de `emits`): la escucha `@change` recibe la hora confirmada y no llega al `<input>` nativo. El `change` nativo sigue existiendo para el contexto de `GForm` (manejadores primero) y no se reemite.
- **Último confirmado:** se fija al montar y con cada `change`; un cambio de `modelValue` desde la aplicación lo actualiza **sin** emitir.
- Los demás eventos (`focus`, `blur`, `keydown`, `input`, `paste`…) llegan nativos al `<input>` visible, **después** de los manejadores propios (`mergeProps`, lección de CLAUDE.md).

## Slots

| Slot | Propósito | Anatomía que debe conservar |
| --- | --- | --- |
| `label` | Etiqueta con contenido rico | Como `GInput` (dentro del `<label for>` con `id`) |
| `hint` | Ayuda con contenido rico | Como `GInput` (conserva `ID-hint`) |
| `error` | Error con contenido rico | Como `GInput` (dentro de la región `g-input__message`) |
| `prepend` | Icono decorativo antes del prefijo | Como `GInput` (envuelto en `aria-hidden`) |

**Sin `append` ni `action`** (como `GNumberField`): el final de la caja es de a. m./p. m. y de las dos lecturas. Si se pasan, no se pintan y se avisa. Un reloj de adorno va, si se quiere, en `prepend` con `GIcon` (ningún icono propio en v0.1, #412).

---

## Escritura e interpretación (#404)

### Filtro al teclear

Entran: cifras (las del idioma y las latinas), los separadores `:` `.` `,`, cualquier espacio y `h`/`H`, las letras de los marcadores a. m./p. m. del idioma y las latinas `a`, `p`, `m`, y las letras de las **franjas del día** del idioma (para escribir «9 noche», #407), más `'` y `’`. Lo demás no entra y el cursor se conserva. El filtro actúa en `input` (no en `beforeinput`) y **no** durante una composición (`isComposing`): se aplica en `compositionend`.

### Interpretación (motor `utils/timeInput.js`)

Al teclear se interpreta en **cada cambio**; el texto **no** se reformatea mientras se escribe (no se roba el cursor): se formatea al salir o con Enter. Lo escrito pasa primero a cifras latinas y sin marcas bidi.

| Escribe | Se entiende | Regla |
| --- | --- | --- |
| `9`, `21` | 9:00, 21:00 | 1–2 cifras = hora |
| `930`, `0930`, `2130` | 9:30, 9:30, 21:30 | 3 cifras = H MM; 4 = HH MM |
| `93015`, `093015` (con `seconds`) | 9:30:15 | 5–6 cifras = H MM SS / HH MM SS |
| `9:30`, `9.30`, `9,30`, `9h30`, `9 h` | 9:30, …, 9:00 | dos o tres grupos con cualquier separador; `h` pegada a cifras es separador (francés) |
| `9.30p`, `9 p. m.`, `9pm`, `오후 9:30`, `٩:٣٠ م` | 21:30 / 21:00 | marcador latino o del idioma (prefijo de su forma sin puntos ni espacios), antes o después; con marcador, la hora va de 1 a 12 |
| `12a`, `12 p. m.` | 0:00, 12:00 | 12 a. m. = medianoche; 12 p. m. = mediodía |
| `9 noche`, `7 de la tarde`, `3 madrugada`, `mediodía` | 21:00, 19:00, 3:00, 12:00 | **franja del idioma** (#407): una palabra de ≥ 3 letras que es prefijo de una sola franja; gana la lectura (h o h+12) que cae en la franja o, si ninguna, la más cercana a ≤ 2 h (CLDR pone las 19:00 «de la tarde», pero «7 de la noche» se dice); una franja que cubre **una sola hora** vale sin cifras («mediodía») |
| `24`, `24:00` | 0:00 | se admite como medianoche (sin marcador ni franja) |
| `2026-10-06T14:05` | 14:05 | una fecha y hora ISO (pegada o escrita): se toma su hora |
| `0`, `13`…`23` en un idioma de 12 h | 0:00, 13:00… | **nunca ambiguas**: escribir en 24 h vale en cualquier idioma |
| `9:3`, `99:99`, `25`, `9:30:15` sin `seconds` | sin interpretar | un minuto de una cifra no se adivina; fuera de 0–23/0–59; segundos sin `seconds` |

- **Una hora de 1 a 12 sin marcador ni franja** en un idioma de 12 h, y **una hora a secas de 1 a 11 sin cero delante** en uno de 24 h, son **ambiguas**: se resuelven con #408 y la otra lectura queda a un toque (#406, #407).
- **Pegar:** la misma interpretación sobre el texto pegado; si es una hora, sustituye el contenido del campo y se formatea; si no, el pegado sigue su curso por el filtro.

### Sin interpretar: se conserva, se dice y bloquea (#409)

Al salir (o con Enter) con un texto que **no** es una hora, el texto **no se borra** (se perdería lo escrito en silencio), el modelo es `null`, y el campo tiene un **error propio** (`labels.invalid`) que **se revela al salir del campo**, pone `aria-invalid` y **bloquea el envío** como cualquier error. Sale en cuanto el texto se vacía o pasa a ser una hora. Detalle en «Error propio».

### Motor (L2)

Utilidad interna **`packages/vue/src/utils/timeInput.js`** (no se exporta desde `src/index.js`; con su `timeInput.test.js`), **sin estado ni DOM** y en **segundos desde las 00:00** como unidad interna: idioma (ciclo, separador, cifras, marcadores, franjas por hora, dirección; caché por idioma y ciclo), cifras a latinas, filtro, interpretación (tabla de arriba, ambigüedad y #408), canónico ↔ segundos, formato y `aria-valuetext`, pasos con arcos (#405), punto de partida vacío, y la duración entre dos horas (la usará C, #413). `design/lab/time-field/engine.js` es la **referencia de comportamiento**, no de código. «Ahora» se le pasa como argumento (el reloj lo lee el componente, en el cliente).

---

## Teclado (#405)

| Tecla | Acción |
| --- | --- |
| ↑ / ↓ | ± `step` minutos, **encajando** en la rejilla contada desde `min` (o desde 00:00): 9:07 ↑ → 9:15 con paso 15; con `seconds`, los segundos vuelven a 0 |
| Mayús + ↑/↓, Re Pág / Av Pág | ± **1 hora**, sin encajar (el paso grande de una hora es la hora, no 10 × `step`; se pierde «extender la selección» de Mayús+↑/↓ en un campo de una línea, coste aceptado como en `GNumberField`) |
| Sin `min` ni `max` | Los pasos **dan la vuelta a medianoche** (23:45 ↑ → 0:00; 0:00 ↓ → 23:45 con paso 15): la hora es circular |
| Con límites | Se detienen en los extremos. Con un **arco que cruza medianoche** (22:00–06:00) lo recorren pasando por 0:00 y se detienen en 06:00 y en 22:00. **Fuera del arco**, ↑ entra por `min` y ↓ por `max` |
| Vacío + ↑/↓ (o Re Pág/Av Pág) | `min`; sin él, **la hora actual** del dispositivo redondeada **hacia arriba** a la rejilla de `step` (al minuto con el paso grande); si así cae fuera de un `max` sin `min`, `max`. Registrar una toma «ahora» es una tecla |
| `a` / `p` (o la primera letra del marcador del idioma), 12 h | Con la hora ya escrita entera y formateada, **cambian la mitad del día** en vez de insertarse |
| Inicio / Fin | Edición de texto (nativo), **no** `min`/`max` |
| Enter | Confirma (formatea, error propio si toca, `change` si toca) y deja seguir el envío implícito del formulario |
| Alt/Ctrl/Meta + flechas | Nativo (no se interceptan; Alt+↓ queda libre para B, #414) |
| Rueda del ratón | Nada |
| Tab | Entra y sale del campo; a. m./p. m. y las lecturas fuera del orden |

- **Paso con el foco en el campo:** el texto se reformatea y el cursor queda al final.
- **Al entrar** (foco): el texto queda como está (formateado); si venía seleccionado entero, sigue seleccionado entero.
- **Un cambio de `modelValue` desde la aplicación** que no coincide con lo escrito reescribe el texto; uno que coincide no lo toca.
- **Cuenta para `GForm`:** escribir, pegar y ↑/↓ son **escritura** (`notifyInput`: el error se revela al salir); a. m./p. m. y las lecturas son **cambio** (`notifyChange`: sube `dirty`, no revela). Los tres retiran `is-rejected`.
- **«Ahora»** se lee con `Date` **solo en el cliente** y solo en ese gesto (nunca al renderizar); es la hora del reloj del dispositivo, sin zona (#411).

## 12 h: la mitad del día (#406)

- **Botones a. m./p. m.** (`g-time-field__halves`, slot interno `end`): **siempre** que el ciclo es de 12 h y el campo no es de solo lectura, también en la forma A (son parte de la base, r02 §A). Texto de `Intl` (los marcadores del idioma, sin `labels`), del alto de la caja y de borde a borde (como −/+ de `GNumberField`), ≥ 24px (44px con puntero grueso).
- **Estado:** con valor, `aria-pressed="true"` e `is-on` en la mitad del valor. **Sin valor**, ninguno pulsado; pulsar uno fija la mitad de **la próxima hora escrita** y queda pulsado (`aria-pressed="true"`) hasta que se escribe o se vacía (el estado debe reflejar lo que hará, WCAG 4.1.2).
- **Puntero:** `pointerdown` con el botón principal **cancela la acción por defecto**: el foco se queda donde estaba y, sin foco previo, el campo **no** se enfoca (en un móvil no abre el teclado). **Sin puntero** (`click` con `detail === 0`): misma acción. Emite `change` una vez por activación si el valor cambió (#402).
- **Es la vía de 12 h en un móvil con teclado numérico**, que no tiene letras.
- **En 12 h no hay «dos lecturas» aparte**: los dos botones **son** las dos lecturas; la palabra junto al número dice cuál se tomó (#407).

---

## Personalidad: A «La hora dicha» (DECISIONS.md #407; decisión del usuario del 2026-10-06)

Prototipada y medida por kiwi (`design/lab/time-field/r02/` §A: 17/17 en los tres motores). No cambia la API ni añade controles: el campo mide lo que un `GInput`. **Con `prefers-reduced-motion: reduce` nada se mueve** (#299 (3)).

### A1 · La hora vuelve en palabras

- La celda `__value` **mide el texto** (espejo `__mirror`, `aria-hidden`, invisible, misma tipografía y `tabular-nums`; el patrón de P1 de `GNumberField`, #313) y **detrás**, a la separación de la caja (**`space × 2` = 8px en `md`**; la de cada tamaño en los demás), va la **lectura** `__reading` (`aria-hidden`): la **franja del día en palabras** de `Intl` (`__reading-word`: «de la mañana», «del mediodía», «de la noche»), sin textos de la aplicación.
- **Mientras se escribe** algo que aún no es la forma final de la hora («930»), la lectura antepone **la hora entendida** (`__reading-time`: «9:30»): se ve qué entendió el campo antes de salir. La separación entre las dos partes la pone coco con espacio (ningún carácter de puntuación como adorno).
- **Cuándo se pinta:** con valor (también en solo lectura y deshabilitado), en el cliente. **No** se pinta si la franja está vacía o si **ya aparece** en el texto formateado (idiomas cuyo formato de 12 h ya lleva la franja: «晚上9:30»).
- **No cabe:** la lectura se recorta con elipsis (es redundante con `aria-valuetext`) y **nunca** empuja la hora; con un texto largo, la celda encoge y el `<input>` se desplaza, como P1.
- **Pulsar el área vacía de la caja, la lectura, el prefijo, el sufijo o el `output`** enfoca el campo con el cursor al final, sin abrir nada (escucha en el `g-input__control` del `GInput` compuesto, puesta al montar y quitada al desmontar; a. m./p. m. y las lecturas quedan fuera).

### A2 · Se escribe como se dice

Además de cifras, separadores y marcadores, se escriben **las franjas del idioma** («9 noche», «7 de la tarde», «mediodía»; reglas en «Interpretación»). Solo en el idioma de la página: las palabras no se traducen. La ayuda (`hint`) debe decirlo (README: «Por ejemplo 9:30 o 9 de la noche»).

**`inputmode="numeric"` por defecto** (precisión de lima sobre r02, que proponía `text`): lo que más se escribe son cifras y el teclado numérico del móvil las da sin cambiar de modo; en táctil, lo que aportan las palabras (decir de mañana o de noche) ya está a un toque en las dos lecturas (24 h) y en a. m./p. m. (12 h). En un teclado físico las palabras funcionan igual. Quien quiera escribir palabras en un teclado virtual pasa `inputmode="text"` por `$attrs`. Sin medir en dispositivo real (kiwi lo dejó pendiente).

### A3 · La otra lectura, a un toque

- **24 h:** con el **foco en el campo** y una **hora a secas de 1 a 11 sin cero delante** («9», «9:30», «930»), se toma la lectura literal (#408) y al final de la caja aparecen **las dos lecturas** (`__choices`): la tomada pulsada («de la mañana») y la otra («de la noche»). Cada una lleva la hora en su nombre («21:00 de la noche Hora de la toma»). Un toque fija esa hora, el texto se formatea, las lecturas se van (ya no es ambigua) y el foco sigue en el campo. **Desaparecen al salir.** Con teclado, escribir la franja («9 noche») o el marcador («9p»).
- **12 h:** los botones a. m./p. m. son las dos lecturas (#406); no hay otro par.
- **Nunca a la vez** que a. m./p. m., **nunca en solo lectura**. Mientras están, la raíz lleva `has-choices` y la lectura en palabras no se pinta (la lectura pulsada ya la dice).
- **Si el par no cabe** en la caja (medido por el `.vue` al aparecer y al cambiar el tamaño mientras está: `scrollWidth > clientWidth + borde final + 0,5` del control, medido con el atributo quitado: los botones tapan el borde final de la caja con un margen negativo y ese borde ya cuenta como desborde; con `scrollWidth > clientWidth` a secas y un borde ≥ 1px el par se compactaría siempre), `__choices` recibe **`data-compact`** y cada botón muestra **la hora** de su lectura («9:00» · «21:00»), con la franja como texto oculto accesible; el nombre no cambia. Así el par nunca reparte la fila ni desborda (no cuenta en el mínimo, #410).
- Mismas reglas de puntero, `change` y `GForm` que a. m./p. m. (#406; cambio, no escritura).

### Movimiento

- **La palabra entra** (`__reading-word`): cuando la **franja cambia con el foco en el campo** (↑ que cruza las 12:00, «de la mañana» → «del mediodía»; o la primera hora escrita), el `.vue` crea el nodo de nuevo (otra `key`) con **`is-entering`**, y coco lo anima desde `--g-space-1 × 1` por debajo y opacidad 0 (constante de §29.6, la del mensaje de `GInput`), **`--g-duration-press`** + **`--g-ease-out`**, keyframes **`g-time-reading…`** (reacción única a un suceso, §29.4; nunca `g-reject…`). La clase solo se pone al crear el nodo, nunca se alterna en uno existente. **Nada** al montar, al cambiar el valor desde la aplicación sin foco, al escribir cifras que no cambian la franja ni al salir.
- **Las dos lecturas aparecen igual, con dos keyframes** (mismos tokens y misma duración; solo existen con foco, así que nunca al montar; al irse, se quitan sin animar): **`g-time-reading-rise`** (opacidad y subida de `--g-space-1 × 1`) para el **texto**, tanto de la palabra como de las lecturas, y **`g-time-reading-fade`** (solo opacidad) para el **par** `__choices`. No pueden ser las mismas: los botones van de borde a borde y, si el par se desplazara, el fondo pulsado y los separadores saldrían 4px de la caja durante la entrada.
- **Ningún uso nuevo de `--g-ease-spring` ni de `--g-ease-bounce`** (§29.1): es una entrada.
- **Movimiento reducido:** el texto cambia en su sitio (kiwi midió 0 animaciones).

### Qué lo hace distinto

Los campos de hora tratan a. m./p. m. como un interruptor que hay que acordarse de tocar, y el error más caro de una hora —una toma de las 9 de la noche registrada a las 9 de la mañana— nace ahí. `GTimeField` **devuelve la hora como la diría una persona** («9:30 de la noche»), pegada al número, en el idioma de la página y sin un solo texto de la aplicación; deja escribirla también así; y cuando lo escrito puede ser de mañana o de noche **lo dice y ofrece la otra lectura** en vez de elegir en silencio, también en 24 h, donde «a las 9» dicho en voz alta es igual de ambiguo. Además, de la base: se escribe como se teclea («930», «9h30», una fecha ISO pegada), la hora **da la vuelta** a la medianoche y recorre un turno de 22:00 a 6:00, lo que no se entiende **no se borra** y bloquea el envío, la mitad del día **recuerda** la última hora vista, y vacío + ↑ es **ahora**.

**Descartadas** (r02, semillas): el **reloj analógico** (dos gestos de precisión, la mitad del día aparte, otro control para teclado y lector) y la **rueda tipo iOS** (desplazar para elegir es lo que la lista ya hacía mal; un `listbox` por columna). **Reservada:** arrastrar los extremos de un tramo sobre la regla del día (C; exige un deslizador doble accesible; 2.5.7 lo cubren los campos).

---

## Error propio: lo que no es una hora (#409; `form.md` §2, `input.md` N4)

- **Qué es:** con texto en la caja que no es una hora (y no está vacío), el campo tiene un error que **solo él conoce** (no está en `errors`). `ownError()` devuelve `labels.invalid` o, sin él, **un espacio** (bloquea sin texto, #372); `''` con el texto vacío o interpretable. **Se calcula siempre** (también mientras se escribe): lo que decide si se **ve** es el revelado.
- **Cuándo se ve** (`ownReveal: 'blur'`, opción interna nueva de `useFormField`, `form.md` §2): con las **mismas reglas que un error de escritura** del campo: dentro de `GForm` con `showErrorsOn="blur"`, al **salir del campo habiendo editado** (con el aplazamiento de #326 si la salida la provoca una pulsación) y en el envío o `showErrors()`; con `showErrorsOn="submit"`, solo en el envío. **Fuera de `GForm`**, al salir del campo (o con Enter). Una vez visible, se queda mientras el texto siga sin ser una hora (aunque cambie); **sale** en cuanto el texto se vacía o se entiende, y el siguiente espera a otra salida o a otro envío (como un error corregido, #162). Así, corregir «99:99» escribiendo «9», «9:», «9:3», «9:30» no hace parpadear el mensaje.
- **Precedencia** (#372, sin cambio): prop `error` con texto › error propio › `errors[name]`.
- **Bloqueo:** dentro de `GForm`, entra en `blocking()` (registrado, no deshabilitado, activo) aunque no se haya revelado: el envío lo revela, lo marca con `is-rejected` y lleva el foco al campo (`ownTarget` = el `<input>` visible); `GErrorSummary` enlaza a él. `formnovalidate` no bloquea. **Fuera de `GForm`**, el `<input>` visible lleva **`setCustomValidity`** con el mismo texto mientras haya error propio (`''` sin él), para que un envío nativo o `checkValidity()` no salgan con una hora ilegible; dentro de `GForm` (`novalidate`) no interfiere. Coco **no** estiliza `:invalid` ni `:user-invalid` (el estado visible es `aria-invalid`/el mensaje de `GInput`).
- **Cómo llega a `GForm`:** `GTimeField` no llama a `useFormField` (lo hace su `GInput`); se lo pasa a `GInput` por el añadido interno **N4** (`input.md`): las opciones `ownError`, `ownTarget` y `ownReveal` del `useFormField` del `GInput` compuesto. Sin API pública nueva.
- **Con `name`:** como cualquier campo, sin `name` no se registra en `GForm` y su error propio no bloquea el envío de `GForm` (sí se ve y sí lleva `setCustomValidity`).

## Mínimo en una `GFormRow` (#410)

El campo **publica su mínimo intrínseco** a la fila con `setIntrinsicMin` (#271, el método de #312), **en los dos ciclos** (en 24 h suele quedar por debajo de la clase de tamaño y no cambia nada; con `seconds`, un sufijo o un `output` largo, sí):

- **Mínimo (px)** = lo que hay **antes de la celda** del valor (relleno, `prepend`, prefijo) + el ancho del **texto de referencia** + lo que hay **después** (sufijo y `output` con sus separaciones; **sin** la lectura en palabras, que se recorta, ni las dos lecturas, que se compactan) + **a. m./p. m.** en 12 h. Medido **por posiciones** en `__control`, nunca como «caja − celda» (la celda solo mide su texto; el resto es hueco libre). Redondeado hacia arriba. En 12 h, **lo de después = `tail = gap + halvesW`**: el `gap` que separa el texto de a. m./p. m. más el ancho de las dos copias, y **la copia final lleva el borde de la caja** (los botones lo tapan), así que no se suma aparte. Las copias de `__measure` cuentan **con el peso de pulsado** (`--g-text-action-weight`) en las dos mitades, para no quedarse corto nunca: sobrecuentan < 1px frente al estado real.
- **Texto de referencia** = el más ancho, medido en `__measure` (fuera de flujo, `aria-hidden`, tipografía del campo), entre las 24 horas a los :59 (y :59 s con `seconds`) formateadas en el idioma y ciclo, y el `placeholder`.
- **a. m./p. m. en `readonly`** no se pintan pero cuentan: `__measure` lleva siempre, en 12 h, una copia inerte de las dos mitades (dos `span` con `g-time-field__half`, sin interacción) para medirlas; desbloquear (#266) no reparte la fila: en solo lectura el mínimo se calcula **como si los botones estuvieran** (el relleno final y el borde de la caja se cambian por el `gap` y las copias), así que es igual al del campo editable.
- **Cuándo:** solo si la fila provee `setIntrinsicMin`. Al montar, al cargar las fuentes, cuando cambian `locale`, `hourCycle`, `seconds`, `placeholder`, `prefix`, `suffix`, `output`, `size`, `density` o `readonly`, y con un `ResizeObserver` sobre `__measure` (puntero grueso, fuente); publica solo si cambia ≥ 0,5px; retira con `0` al desmontar.
- **Mínimo efectivo** (form.md §4) = el mayor entre el de su clase, `--g-form-min` × `space` y este. El valor de referencia medido lo anota coco en su `estilo.md` (kiwi estimó ≈ 224px un campo de 12 h con a. m./p. m. y `--g-form-min: 56` en su prototipo de C).
- **Mínimos de referencia medidos** (coco, `design/lab/time-field/estilo.md`; `md`, `space` 4): 12 h `es-MX` **186px** (también en solo lectura); 24 h `es` **66px**, por debajo de cualquier clase de tamaño (no cambia nada). El efectivo lo sube la clase o `--g-form-min`.

## Fecha y hora, y zona horaria (#411)

- **Fecha + hora = dos campos en una `GFormRow`** (`GDatePicker` + `GTimeField`, receta «Fecha y hora» en `form.md` §8): dos preguntas con su etiqueta, su error y su envío (`fecha=2026-10-06`, `hora=21:30`). La aplicación los junta si necesita un valor (`fecha + 'T' + hora`: hora local sin zona, como `datetime-local`). **`GDateTimeField` reservado** (nombre y forma: una sola caja con fecha y hora; mezclaría dos patrones de teclado y dos errores, y no tiene ronda).
- **Zona horaria: el campo no hace nada con ella.** No convierte, no elige zona, no produce instantes y no conoce el horario de verano (no sabe la fecha: una hora que no existe el día del cambio la decide la aplicación con la fecha). «Ahora» es el reloj del dispositivo. Si la zona importa, la aplicación la **dice** con `suffix` + `suffixLabel` («CDMX», «hora del centro de México»), que entra en la descripción (#166). `GCalendar`, que trabaja con instantes, tiene su zona explícita (#38).

---

## Tokens consumidos (#412)

**Tokens nuevos: ninguno** (`tokens.md` §37; §17.6: ningún existente se queda corto). Lo de la caja, el prefijo/sufijo, el `output`, el pie, el mensaje, el solo lectura (§21), el foco e I1/I2 son de `GInput`. Lo propio:

| Token | Para qué |
| --- | --- |
| `--g-space-1` | Separación de la lectura (la de la caja: `space × 2` en `md`); entrada de la palabra (`× 1`, §29.6); relleno en línea de a. m./p. m. y de las lecturas |
| `--g-border-width` | Separador entre la caja y a. m./p. m. o las lecturas, y entre los dos botones; margen negativo para llegar de borde a borde |
| `--g-color-border-control` | Separador (≥ 3:1: delimita un control) |
| `--g-color-border-strong` | Separador con el campo deshabilitado |
| `--g-color-text-muted` | Lectura en palabras (texto: ≥ 4.5:1, kiwi midió ≥ 4.5:1 en Chromium); texto de a. m./p. m. y de las lecturas en reposo |
| `--g-color-text` | Texto de a. m./p. m. y de las lecturas al pasar |
| `--g-color-text-subtle` | Lectura y botones con el campo deshabilitado |
| `--g-color-neutral-soft` | Fondo al pasar y pulsar |
| `--g-color-accent-soft`, `--g-color-on-accent-soft` | **Pulsado** (`is-on`) de a. m./p. m. y de las lecturas: un solo estilo para los dos pares (kiwi pintó la base en `neutral-soft` y A en `accent-soft`; el contrato los iguala), con **`--g-text-action-weight`** además del color (WCAG 1.4.1: el estado no depende solo del color) |
| `--g-radius-{rounded}`, `--g-radius-sm` | Esquinas exteriores del último botón (las de la caja) |
| `--g-text-caption-size` … `--g-text-body-size` (con sus `line`) | Tamaño de la lectura, del espejo, de `__measure` y de los botones (el del texto escrito de cada `size`) |
| `--g-text-action-weight` | Pulsado (arriba) |
| `--g-duration-fast`, `--g-ease-standard` | Fondo y color de los botones |
| `--g-duration-press`, `--g-ease-out` | Entrada de la palabra y de las lecturas |
| `--g-focus-width` y el color de foco del campo | Anillo de seguridad **por dentro** de los botones si una tecnología de apoyo los enfoca (no reciben foco por Tab ni al pulsarlos); el anillo del campo es el de `GInput` |

**No son tokens:** `--g-space-1 × 1` de la entrada (§29.6); `1px` del cursor al final del espejo y `1ch` de su ancho mínimo (§7, como P1); `24px`/`44px` (área táctil, §7); el mínimo publicado (px medidos, #410).

## Clases y datos (contrato bruno ↔ coco)

Bruno las emite; coco las estiliza. Las de `GInput` siguen siendo de `GInput`.

| Clase / dato | Elemento | Cuándo |
| --- | --- | --- |
| `g-time-field` | Raíz (la de `GInput`) | Siempre |
| `g-time-field--h12` | Raíz | Ciclo de 12 h |
| `has-choices` | Raíz | Las dos lecturas están pintadas |
| `g-time-field__value` | `span` celda del valor | Siempre |
| `g-time-field__mirror` | `span` `aria-hidden` | Siempre |
| `g-time-field__field` | `<input>` visible (junto a `g-input__field`) | Siempre |
| `g-time-field__reading` | `span` `aria-hidden` | Con valor y franja, en el cliente, sin `has-choices` |
| `g-time-field__reading-time` | `span` dentro de `__reading` | Con foco y texto que aún no es la forma final |
| `g-time-field__reading-word` (+ `is-entering`) | `span` dentro de `__reading` | Con `__reading`; `is-entering` al crearse por un cambio de franja con foco |
| `g-time-field__halves` | `span` contenedor | 12 h y sin `readonly` |
| `g-time-field__half` (+ `is-on`, `data-half="am\|pm"`) | `button` (o `span` inerte dentro de `__measure`) | Con `__halves` |
| `g-time-field__half-text` | `span` con `id` dentro del botón | Con `__halves` |
| `g-time-field__choices` (+ `data-compact`) | `span` contenedor | 24 h, foco, hora ambigua, sin `readonly` |
| `g-time-field__choice` (+ `is-on`) | `button` | Con `__choices` |
| `g-time-field__choice-time`, `g-time-field__choice-word` | `span` dentro del botón | Con `__choices`; sin `data-compact`, `-time` es texto oculto accesible; con él, `-word` |
| `g-time-field__measure` | `span` `aria-hidden` fuera de flujo | Dentro de una `GFormRow` que provee `setIntrinsicMin` |

**Para coco:** `font-variant-numeric: tabular-nums` en el campo, el espejo, `__measure` y `__choice-time`; la celda y la lectura en línea con la separación de la caja (8px en `md`), la lectura con elipsis y `cursor: text`; a. m./p. m. y las lecturas **del alto de la caja**, de borde a borde incluido el borde (alias locales como `--_nf-border`/`--_nf-stroke` de `GNumberField` si hacen falta, con nombre propio), piso **24px** y **44px** con `pointer: coarse`, `touch-action: manipulation`, sin selección ni menú de toque largo, `cursor: pointer` (`not-allowed` deshabilitado), hover dentro de `@media (hover: hover)`; `padding-inline-end: 0` en el control con `g-time-field--h12` (sin `readonly`) o `has-choices`; `text-align: match-parent` en el campo con la corrección de `:dir(rtl)` de `GNumberField` si Chromium la necesita; `__measure` fuera de flujo con la tipografía del campo; la sacudida de I2 ya mueve `g-input__row` y con ella los botones; **`forced-colors`**: botones con `ButtonText`/`ButtonFace` y separador visible, pulsado con `Highlight`/`HighlightText` **y** el peso, con **`forced-color-adjust: none`** (sin eso Chromium pinta una placa `Canvas` detrás del texto pulsado y `HighlightText` no se ve), deshabilitado `GrayText`, lectura en `CanvasText`; **no** estilizar `:invalid`/`:user-invalid`.

## RTL e idiomas

- La caja sigue el orden de la página (valor al inicio lógico, botones al final lógico). El `<input>`, el espejo y la lectura llevan **`dir` del idioma** (#403); la lectura va después del valor en orden lógico.
- Ningún icono (nada que reflejar).
- La entrada de la palabra es vertical: no cambia con RTL.

---

## Avisos de desarrollo (`[Grana GTimeField]`, una vez por instancia)

Con el patrón `typeof process !== 'undefined' && process.env.NODE_ENV !== 'production'`.

1. Sin nombre accesible: sin `label`, slot `label`, `aria-label` ni `aria-labelledby`. (`GInput` compuesto no avisa por su cuenta, N2.)
2. Sin `labels.invalid` (al montar): «un texto que no es una hora bloqueará el envío sin mensaje».
3. `modelValue` con formato inválido: se lee como `null`.
4. `modelValue` con segundos sin `seconds`: se ignoran (se muestra y se envía sin ellos).
5. `min` o `max` con formato inválido: se ignora ese límite.
6. `step` que no es entero ≥ 1 (además del validador): se usa `1`.
7. `locale` que `Intl` rechaza: se usa el idioma del documento.
8. `type` en `$attrs` (el campo es siempre `type="text"`), o slots `append`/`action` (no se pintan).

`min > max` **no** avisa (es un arco que cruza la medianoche, #401).

## Paquete y peso (#400)

**Entrada propia `@grana/vue/time-field`** (`dist/time-field.js` y `dist/time-field.umd.js`, global UMD **`GranaTimeField`**, requiere `Vue` y `Grana`), como `GCombobox` (#337) y `GFileField` (#367). **Enmienda de #400 (#415):** kiwi estimó 3 a 4 KB gzip para el paquete principal; bruno midió **+8379 B gzip -9** (+8,47 kB con Vite), por encima del tope de 8 KB (#238, #328, #337, #380). El componente y `utils/timeInput.js` pesan ~3 KB por sí solos; el resto del incremento medido, ~270 B, es de N4 (`GInput`) y de `ownReveal` (`GForm`), que **se quedan en el principal** (sin API pública nueva).

- `@grana/vue` **no** exporta ni registra `GTimeField`. La entrada exporta `GTimeField` y, por defecto, un plugin que solo lo registra (`app.use(TimeField)`); sin gestor: no es un servicio.
- Lo compartido llega por **`__shared`** sin duplicarse: `GInput`, `useFormField` y las claves de contexto (una copia propia crearía otro `Symbol` y el campo no vería su `GForm`). `utils/timeInput.js` viaja solo en esta entrada.
- El CSS sigue en `grana.css` (`GTimeField.css` registrado en `components.css`).
- **Compuertas:** `grep -q "g-time-field__reading" packages/vue/dist/grana.css`, `! grep -q "GTimeField" packages/vue/dist/grana.js`, `test -f packages/vue/dist/time-field.js`. Siguen las de #337 y #367.

B (#414) volvería a decidirse; con esta entrada ya es la casa natural de `picker`.

---

## Resolución de hallazgos (kiwi r01 L1–L16, r02 L17–L22)

| # | Hallazgo | Resolución | Base |
| --- | --- | --- | --- |
| L1 | Nombre y contrato | **`GTimeField`**, tag `g-time-field`, este contrato; `form.md` «Fases siguientes» fila 5 pasa a «contratado». Complejo: coco y bruno en Opus | #400 |
| L2 | Motor | `utils/timeInput.js` interno, sin estado ni DOM, en segundos («Motor») | #404 |
| L3 | Props | Tabla de «Props»; **no existen** `type`, `inputmode`, `format`, `timeZone`, `loading`, `steppers`, `words`; reservados `mode`, `picker`, `suggestions`, `secondStep`, `prefer` | #402 |
| L4 | Eventos y modelo | `update:modelValue` (String \| null) y `change` propio (salida, Enter, una vez por gesto de paso, una vez por activación de un botón); formato inválido → `null` con aviso; `min > max` = arco, sin aviso | #401, #402 |
| L5 | Texto sin interpretar | Error propio de #372 con **`ownReveal: 'blur'`** (se revela como un error de escritura); `form.md` §2 ampliado sin cambiar `GFileField` (`'submit'` por defecto); `input.md` N4; fuera de `GForm`, revelado propio y `setCustomValidity` | #409 |
| L6 | ARIA | `spinbutton`, `valuenow` en minutos (segundos con `seconds`), `valuetext` con la franja, `valuemin/max` solo con `min ≤ max`; sin interpretar, `valuetext` = lo escrito; nada de `aria-expanded`/`aria-haspopup`; límites de Chromium al README | #403 |
| L7 | a. m./p. m. | `__halves`/`__half` + `is-on`, fuera del Tab, nombre propio + etiqueta, texto de `Intl`; **siempre en 12 h, también en A**; mitad pendiente pulsada sin valor | #406 |
| L8 | Mínimo en `GFormRow` | `setIntrinsicMin` medido por posiciones, en los dos ciclos, con a. m./p. m. medidos también en `readonly` | #410 |
| L9 | `locale` compartido | Misma resolución que `GNumberField`; bruno puede extraerla a una utilidad sin cambiar `GNumberField` | #404 |
| L10 | Dirección | `dir` del idioma en el campo; el porqué, anotado aquí y en «RTL e idiomas» de `number-field.md` (que no cambia de comportamiento) | #403 |
| L11 | Segundos | `step` siempre en minutos; `secondStep` reservado | #402 |
| L12 | «Ahora» | Vacío + paso = `min` o la hora del dispositivo redondeada hacia arriba (con `max` sin `min`, acotada), solo en el cliente; SSR como `GNumberField` | #405 |
| L13 | Peso | Entrada propia `@grana/vue/time-field` (medido +8379 B gzip en el principal, sobre el tope de 8 KB) | #400, #415 |
| L14 | Tokens e iconos | Ninguno nuevo; ningún icono propio (`prepend` para un adorno) | #412 |
| L15 | Receta | `form.md` §8 «Fecha y hora» con la nota de zona | #411 |
| L16 | Reservas | `GDateTimeField`, `mode="range"`, `secondStep`, `prefer`, `suggestions` | #411, #413, #414 |
| L17 | Identidad | A por defecto, C segunda entrega, B tercera solo si se pide; semillas descartadas y reservada, en DECISIONS | #407, #413, #414 |
| L18 | A | Clases `__value`/`__mirror`, `__reading`, `__choices`/`__choice` + `is-on`; franja de `Intl`; regla «franja o la más cercana a ≤ 2 h»; `valuetext` con la franja (**unida con un espacio**, no con coma: la coma no es de todos los idiomas y `Intl.ListFormat` añade «y»/«و»); keyframes `g-time-reading…`; **`inputmode="numeric"`** (no `text`) y **`data-compact`** para que el par nunca desborde | #407 |
| L19 | B | Reservado con su forma (`picker`, `suggestions`, `labels`, `clock`, `aria-keyshortcuts`, diálogo con #358) | #414 |
| L20 | C | Reservado como **`mode="range"`** (no `GTimeRange`) con su forma y las decisiones del usuario 3 y 4 | #413 |
| L21 | Movimiento | Sin tokens nuevos: `--g-duration-press` + `--g-ease-out` (A; C cuando entre); `--g-duration-slow` + `--g-ease-out` (minutos de B cuando entre); sin muelle ni rebote | #412 |
| L22 | Mínimo de C | Cada campo del tramo publica el suyo (#410); sin `--g-form-min` fijo | #413 |

## Fuera de v0.1 (reservado con nombre y forma)

### C · «Tramo»: `mode="range"` (segunda entrega; #413)

- **Forma:** un grupo (`role="group"` con su leyenda, como `GDatePicker split`) con **dos campos** de esta base (inicio y fin) en una `GFormRow` que se parte en estrecho, y debajo una **regla del día** `aria-hidden` (pista de 24 h con marcas 0 · 6 · 12 · 18 · 24 de `Intl`, el tramo en `accent`, con contraste a medir por coco (1.4.11; en claro `accent` puede no llegar a 3:1, #379); si cruza la medianoche, **dos piezas** con el borde recto en el corte).
- **API reservada:** `mode` (`single` · `range`), `modelValue` `{ start, end }` (cada uno `"HH:mm[:ss]"`; como el rango de `GDatePicker`), `labelStart`/`labelEnd` obligatorios (aviso), `durations` (minutos, botones de un toque «+15 min»…), `labels.nextDay`, `labels.durations`; envío `name-start` y `name-end` canónicos.
- **La duración** va en el `output` del fin (C14: dentro de la caja, viva, en su descripción): «8 h · +1 día», con `Intl.DurationFormat` y respaldo `NumberFormat` + `ListFormat`.
- **El fin acepta una duración** escrita con «+» («+8», «+8:30», «+90m», «+1h30»; siempre con «+»: «8h» es una hora en francés).
- **Decisión del usuario 3 (2026-10-06): un fin anterior al inicio es el día siguiente**, sin error, con **«+1 día» visible** en el `output` del fin (y por tanto en su descripción accesible) y dos piezas en la regla. Si la aplicación no lo admite, pone su error (Grana no valida).
- **Decisión del usuario 4 (2026-10-06): al mover el inicio se conserva la duración** (el fin se mueve con él; convención de las agendas); cambiar el fin cambia la duración.
- **Movimiento:** el tramo crece o encoge en la regla (`--g-duration-press` + `--g-ease-out`); con movimiento reducido, salta.
- Necesita contrato propio (sección nueva de este) antes de construirse; la ronda de kiwi ya está (`r02` §C, 14/14).

### B · «Rejilla del día»: `picker` (tercera entrega, solo si un producto la pide; #414)

- **Forma:** botón al final de la caja (cuadrado del alto de la caja, icono **`clock`**, que entraría en la lista de la librería, `icons.md` §4; `chevron-down` promete una lista) que abre un **diálogo no modal** (`popover="manual"`, APG *Date Picker Dialog* como `GDatePicker`; hoja inferior a ≤ 520px; reglas 1 y 3 de #358) con **horas habituales** de la aplicación arriba y **el día en cuatro filas de seis** (`role="grid"`, `rowheader` de la aplicación); elegir una hora despliega sus minutos según el paso.
- **API reservada:** `picker` (Boolean), `suggestions` (`[{ time, label? }]`), `labels` `open`, `dialog`, `hours`, `minutes`, `rows` (4), `suggestions`, `now`, `nowMark`, `exact`. **`aria-keyshortcuts="Alt+ArrowDown"`** en el campo; `aria-haspopup="dialog"` y `aria-expanded` **en el botón**, nunca en el `spinbutton`.
- **Peso:** irá en la entrada propia `@grana/vue/time-field` (#415); el diálogo y la rejilla se medirán antes de decidir si ensanchan esa entrada o van en otra.

### Otros nombres reservados

`secondStep` (paso en segundos), `prefer` (mitad del día preferida para #408 si los datos lo piden), `GDateTimeField` (#411). Moneda, teléfono y búsqueda de dirección siguen sin ronda (`form.md` Fase 5).

---

## Límites conocidos (para el README)

- **Chromium sin `min` ≤ `max`** expone `aria-valuemin`/`aria-valuemax` 0 (valor por defecto del rol); `aria-valuetext` dice la hora.
- **Solo lectura en Chromium:** el `spinbutton` no expone `readonly`; enfocable y sin `settable`.
- **Franjas de CLDR:** cambian por idioma y versión del motor (`en` «in the morning» a las 00:00; sin «medianoche» en `es`); las palabras solo se entienden en el idioma de la página.
- **Teclado numérico del móvil** (`inputmode="numeric"`): sin «:» en iOS («930» funciona) y sin letras (las dos lecturas y a. m./p. m. cubren la mitad del día); para escribir palabras, `inputmode="text"` por `$attrs`.
- **Idioma cambiado en caliente** (`lang` de un ancestro): no se observa; pasar `locale` reactivo.
- **SSR:** pasar `locale` para que el HTML llegue formateado; la lectura en palabras aparece al montar.
- **Zona horaria y horario de verano:** fuera del campo (#411).
- **Hueco del cursor de 1px en WebKit:** con el cursor al final, WebKit desplaza 1px la hora en algunos anchos con la fuente de serie (medido en «21:30» `md`, `lg` y `xl`, y «9:30 p.m.» `xl`). Es el **mismo límite compartido** con `GNumberField` (hallazgo 1 abierto de su auditoría, #313; `PENDIENTES.md`): la constante de `1px` de `__mirror` y `__measure` es de #313/§7 y se enmendará en los dos a la vez si se sube a 2px (el mínimo publicado subiría 1px); no se cambia aquí por separado.
- **Inicio/Fin** editan el texto; en macOS (Firefox, WebKit) no mueven el cursor por convención del sistema.

## Verificación (cómo se da por hecho)

**Criterio de hecho:** las medidas de kiwi (`design/lab/time-field/verificar.mjs`, base 62/60/61 y A 17/17 en Chromium/Firefox/WebKit) reproducidas **sobre el componente real**.

### bruno (vitest + jsdom)

- **Motor** (`timeInput.test.js`): idiomas `es`, `es-MX`, `en-US`, `fi`, `ko`, `he`, `ar-EG` (ciclo, separador, cifras, marcadores, franjas, dirección, sin marcas bidi, cualquier espacio antes del marcador); filtro (letras ajenas fuera, marcadores y franjas dentro); la tabla de «Interpretación» entera, también las filas sin interpretar; ambigüedad 12 h (#408 con hora previa, con límites, sin pista: 12 = mediodía, 1–11 mañana) y 24 h (1–11 sin cero delante; «09» no); franjas («9 noche», «7 de la tarde», «mediodía», empate o > 2 h sin interpretar); canónico ↔ segundos; `aria-valuetext` en 12 h y 24 h; pasos (rejilla desde `min`, paso grande sin encajar, vuelta sin límites, arco 22:00–06:00 recorrido por 0:00 y detenido en sus extremos, entrada por `min`/`max` desde fuera, vacío → `min`/ahora redondeado/acotado por `max`).
- **Componente:** modelo String \| null siempre (nunca `Date`); formatos de entrada inválidos → `null` con aviso; `update:modelValue` en cada cambio de valor («930»: tres emisiones) y no al reformatear; `change` una vez por gesto (flechas con autorrepetición → uno al `keyup`; salida sin cambio → ninguno; a. m./p. m. y lecturas → uno por activación; cambio desde la aplicación → ninguno); el `@change` del consumidor no llega al nativo; atributos (`type=text`, `role`, `dir` del idioma, `inputmode` derivado y sobrescribible, `aria-value*` con y sin valor, sin interpretar, con arco y con un solo límite, `aria-required` sin `required`, `aria-readonly`, **sin** `aria-expanded`/`aria-haspopup`); oculto (`name`, canónico, `''`, `disabled`, presente en `readonly`, `form` copiado) y visible sin `name`; `FormData`; registro en `GForm`; manejadores primero (prueba de orden); `notifyInput` al escribir y con flechas, `notifyChange` con los botones; a. m./p. m. (solo 12 h, ausentes en `readonly`, `tabindex=-1`, `aria-pressed`, `aria-labelledby`, `pointerdown` con `preventDefault` sin enfocar, `click` con `detail` 0, mitad pendiente pulsada); A (lectura con valor y sin ella vacío; `reading-time` solo con texto no final; sin lectura si la franja ya está en el texto; lecturas solo en 24 h con foco y ambigüedad, nunca con a. m./p. m., se van al salir y al elegir; `data-compact` cuando no caben; `is-entering` solo al cambiar la franja con foco, nunca al montar); **error propio** (al salir con «99:99» dentro de `GForm` con `blur`: visible, `aria-invalid`, texto conservado; con `submit`: solo al enviar; Enter + envío sin salir: bloquea con el foco en el campo; sale al vaciar o al entender; corregir no parpadea; precedencia; `GErrorSummary` enlaza al campo; fuera de `GForm`: visible al salir y `setCustomValidity`); SSR (`renderToString` con y sin `locale`: texto formateado / canónico, sin lectura ni acceso a `window`); avisos 1 a 8; `GInput` sin cambios fuera de N4 (sus pruebas en verde); **las pruebas de `GFileField` y del error propio (`ownError.test.js`) siguen en verde** (`ownReveal` por defecto `'submit'`).

### Playwright (Chromium, Firefox, WebKit; `design/lab/theme-playground/`)

- `tests/time-field.spec.mjs`: el `verificar.mjs` de kiwi (base y A) adaptado al componente real: árbol con `ariaSnapshot` (y CDP en Chromium), escritura en los idiomas de la tabla, filtro, pegado con el evento real (Chromium, WebKit), pasos y arco, «ahora» con el reloj fijado, 12 h con los botones sin mover el foco y ≥ 24/44px, las dos lecturas en 24 h con un toque y el foco en el campo, `data-compact` en `g-form-w-xs`, la lectura a 8px del texto en `md`, error propio al salir y al enviar, 320px LTR y RTL sin desborde, fila con `GInput`, `GDatePicker` y `GSelect` (Δ `top` y alto ≤ 1px a 1100/720/320) y el **mínimo publicado** (en 12 h la fila se parte antes de que «12:59 p.m.» y a. m./p. m. dejen de caber; desbloquear un `readonly` no reparte).
- `tests/personalidad-time-field.spec.mjs`: la palabra entra al cruzar las 12:00 con ↑ (≥ 2 posiciones intermedias), no al montar, no al escribir cifras que no cambian la franja ni al cambiar el valor desde la aplicación; las lecturas entran al aparecer; con `reduce`, 0 animaciones.
- `tests/form-distribution.spec.mjs` (#184) sigue pasando; la receta «Fecha y hora» entra en el playground de formularios.

### coco (CSS y auditoría)

Solo `var(--g-*)` y `--_*` más las constantes de §29.6/§7; lectura a la separación de la caja en los cinco tamaños; botones de borde a borde y pisos 24/44; pulsado distinguible sin color; contraste de la lectura y de los botones ≥ 4.5:1 (y separador ≥ 3:1) en claro, oscuro y un tema distinto; `forced-colors` emulado. Resultado en `design/lab/time-field/auditoria.md`, con verificación propia.

### No verificado (entorno real)

Lector de pantalla (VoiceOver, NVDA, TalkBack): un `spinbutton` cuyo `valuetext` es una hora con su franja; a. m./p. m. y las lecturas fuera del Tab; el texto sin interpretar con `aria-invalid`. Teclado virtual real (`inputmode="numeric"` en iOS y Android con «930»); IME real (coreano, japonés); pegado real en Firefox; `forced-colors` real; zoom 200 %; franjas de CLDR en Safari real.

---

## Encargos

### coco (Opus; `GTimeField.css`, banco y `estilo.md`)

1. `packages/vue/src/components/GTimeField/GTimeField.css` con las clases de «Clases y datos» sobre la caja de `GInput` (nada en `GInput.css`): celda y espejo (P1 de `GNumberField`), lectura a la separación de la caja con elipsis, a. m./p. m. y las lecturas de borde a borde con un **solo** estilo de pulsado (`accent-soft`/`on-accent-soft` + peso), `data-compact`, `__measure` fuera de flujo, `forced-colors`, `pointer: coarse`.
2. Keyframes `g-time-reading-rise` (texto: la palabra con `is-entering` y el texto de las lecturas) y `g-time-reading-fade` (el par `__choices` al insertarse, solo opacidad), `--g-duration-press` + `--g-ease-out`, desplazamiento `--g-space-1 × 1`, solo con `prefers-reduced-motion: no-preference`.
3. Banco de estilo en `design/lab/time-field/` y `estilo.md` con las medidas: separación lectura–hora por tamaño, alto y ancho de los botones, **mínimo publicado de referencia** en 12 h y 24 h (`md`, `space` 4), contrastes.
4. Auditoría del componente real con un tema distinto (paso 5): `design/lab/time-field/auditoria.md`.

### bruno (Opus; `.vue`, motor, pruebas, registro)

1. `packages/vue/src/utils/timeInput.js` + `timeInput.test.js` («Motor»).
2. **`formContext.js` y `GForm.vue`**: opción interna **`ownReveal`** (`'submit'` por defecto, `'blur'`) según `form.md` §2 ampliado: revelado por la salida del campo (con #326 y `showErrorsOn`), revelado propio sin contexto, salida al pasar a `''`. **Las pruebas de `GFileField` y `ownError.test.js` siguen en verde.**
3. **`GInput.vue`**: añadido interno **N4** (`input.md`): recibe del componente que lo compone `ownError`, `ownTarget` y `ownReveal` para su `useFormField`, sin prop, slot ni evento públicos; sin consumidor, nada cambia (instantánea de `GInput` igual).
4. `packages/vue/src/components/GTimeField/GTimeField.vue` (compone `GInput` con `field` y `end`; A completo; error propio con `setCustomValidity` fuera de `GForm`; mínimo publicado #410), `GTimeField.test.js`, `GTimeField.meta.json` (`status: "draft"` hasta la auditoría), registro del CSS en `components.css` y **entrada propia `@grana/vue/time-field`** (#415: `src/time-field.js`, `vite.time-field.config.js`, global `GranaTimeField`; `useFormField`, `GInput` y las claves de contexto por `src/shared.js`; `GTimeField` fuera de `src/index.js`), compuertas `grep -q "g-time-field__reading" packages/vue/dist/grana.css`, `! grep -q "GTimeField" packages/vue/dist/grana.js` y `test -f packages/vue/dist/time-field.js`; peso de la entrada en `GTimeField.meta.json`.
5. Playground: sección del campo de hora (12 h `es-MX`, 24 h `es`, `ar-EG`, arco 22:00–06:00, error propio, `?now=` para fijar la hora) y la receta «Fecha y hora» en el formulario; specs de Playwright de «Verificación».
