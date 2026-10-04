# Contrato · GNumberField

**Dueño:** lima · **Estado:** aprobado (las tres piezas de personalidad las adoptó el usuario el 2026-10-03; el resto deriva de APG *Spinbutton*, WCAG 2.2 y los contratos vigentes; ninguna pregunta de producto abierta) · **Basado en:** `design/lab/number-field/r01/` (kiwi; `brief.md`, `declaracion.md` con los hallazgos L1 a L14 y «Qué lo hace distinto», `index.html` con `XNumberField` sobre las clases reales de `GInput`, `verificar.mjs` 233/233 en los tres motores; commit `d258dac`) · **Decisiones:** DECISIONS.md **#309 a #314** · **Convive con:** `input.md` (la caja; dos añadidos internos, «Cambio por `GNumberField`»), `form.md` (contexto, `useFormField`, `GFormRow`, receta de signos vitales, `GInputGroup`; Fase 2), `icons.md` (`minus`, `plus`), `tokens.md` §29 y §30
**Tag:** `g-number-field` · **Categoría:** entradas · **Fase 2 del sistema de formularios, sin moneda** (#154, #168)
**Componente complejo** (CLAUDE.md, «Modelos por rol»: compone `GInput`, lleva un motor numérico propio y personalidad con cifras): **coco y bruno en Opus**.

Un campo para **un número que la persona escribe** (edad, peso, temperatura, porcentaje, cantidad): texto con forma de número que se escribe libre, se lee en el formato del idioma y, si se pide, se ajusta con −/+ o con las flechas. El modelo es un `Number` o `null`, nunca una cadena.

---

## Principios

- **No duplica `GInput`: lo compone** (#309). Etiqueta, caja, prefijo/sufijo, `output`, pie, mensaje, marcas, contexto de `GForm`, `is-ready` (I1) e `is-rejected` (I2) son los de `GInput`; `GNumberField` añade el motor numérico, el valor canónico y −/+.
- **Se escribe, no se elige.** `<input type="text" role="spinbutton">`, nunca `type="number"` (rueda, flechas y validación nativa confusas; GOV.UK; form r01 §12).
- **Grana no valida** (#157): lo escrito fuera de rango **no se recorta**; `min` y `max` limitan los **pasos** y se exponen al árbol, y el error lo pone la aplicación.
- **Lo que se envía es canónico, no lo visible** (`72.5`, no «72,5»): un `<input type="hidden">` lleva el `name` (precedente: `GSelect`).
- **Sin textos propios** (Grana es internacional, #226): los nombres de −/+ los da la aplicación.
- **Personalidad** (#313): la unidad va pegada al número (P1), las cifras ruedan al dar un paso (P2) y el número topa en el límite (P3). Ninguna toca el árbol accesible; con movimiento reducido ninguna se mueve.

## Cuándo usarlo (frontera)

| Necesidad | Usar | No usar |
| --- | --- | --- |
| Un número que se escribe (cantidad, medida, edad) | `GNumberField` | `GInput inputmode="decimal"` (sin formato, sin `Number`, sin flechas) |
| Unidad **fija** («kg», «lpm», «%») | `GNumberField suffix` | Unidad en la etiqueta o en el slot `prepend` (decorativo) |
| Unidad **elegible** (°C/°F) | Hoy: `GNumberField` + `GSelect` «Unidad» en la misma `GFormRow` (dos preguntas) o `GInputGroup` con `GInputGroupInput inputmode` (receta, `form.md` §8). **`GInputGroupNumber` reservado** (#314) | Una prop `unit` |
| Un identificador hecho de cifras (CP, folio, teléfono, tarjeta) | `GInput inputmode="numeric"` | `GNumberField` (no es una cantidad: ni formato, ni pasos, ni `Number`) |
| Dinero | Ronda propia de moneda (Fase 4/5, #154) | `GNumberField prefix="$"` como sustituto del formato de moneda |
| Elegir un valor de un rango continuo arrastrando | Deslizador (sin ronda) | `GNumberField` |

---

## Props

| Prop | Tipo | Valores | Default | Origen |
| --- | --- | --- | --- | --- |
| `modelValue` | Number \| null | número finito | `null` | compartida (`api.md`) |
| `min` | Number | | sin valor | propia |
| `max` | Number | | sin valor | propia |
| `step` | Number | > 0 | `1` | propia |
| `precision` | Number | entero ≥ 0 | sin valor (decimales libres) | propia |
| `locale` | String | etiqueta BCP 47 | sin valor (ver «Idioma») | compartida (`api.md`, fila nueva) |
| `grouping` | Boolean | | `true` | propia |
| `prefix` | String | texto libre | sin valor | propia (como `GInput`, #166) |
| `suffix` | String | texto libre | sin valor | propia (como `GInput`, #166) |
| `prefixLabel` | String | texto libre | sin valor | propia (como `GInput`, #166) |
| `suffixLabel` | String | texto libre | sin valor | propia (como `GInput`, #166) |
| `steppers` | Boolean | | `false` | propia |
| `decrementLabel` | String | texto libre | sin valor | propia |
| `incrementLabel` | String | texto libre | sin valor | propia |
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

**No existen** (#310): `unit` (la fija es `suffix`; la elegible, la receta), `inputmode` como prop (se deriva; `$attrs` puede sobrescribirlo), `type`, `loading`, `counter`, `field` (nombre reservado con el significado de #262 para un control suelto dentro de otro componente, p. ej. la cantidad por fila de una tabla; exige antes `field` en `GInput`), `controls` (el nombre es `steppers`: «controls» choca con `aria-controls` y con `controls` de `<video>`).

### Reglas de props

- **`modelValue`:** `Number` finito o `null`; `undefined` se lee como `null` sin aviso (un `ref()` sin valor inicial). `NaN` e `±Infinity` se leen como `null` con aviso. Una **cadena** la rechaza la comprobación de tipos de Vue en desarrollo; si es un número canónico («72.5») se muestra como ese número, y si no, como vacío. **El componente nunca emite cadenas.**
- **`min`, `max`:** limitan los pasos (flechas, −/+, Re Pág/Av Pág), deshabilitan − en `min` y + en `max`, y se exponen como `aria-valuemin`/`aria-valuemax`. **No** limitan lo escrito ni lo pegado (#157). `min` también decide si se acepta «-» (solo sin `min` o con `min` < 0). Con `min > max`, aviso y **se ignoran los dos** (sin límites en pasos ni en el árbol).
- **`step`:** tamaño del paso. Los pasos encajan en la rejilla de `step` **contada desde `min`** (o desde 0 sin `min`): ↑ desde 72,53 con `step` 0,1 → 72,6. Aritmética sin error de coma flotante (72,5 + 3 × 0,1 = 72,8 exacto; se calcula con enteros escalados a los decimales de `step`, `min`, `precision` y el valor). Un `step` ≤ 0 o no finito lo rechaza el validador y se usa `1`.
- **`precision`:** número de decimales. **Redondea el modelo en el acto** (con «36,55» escrito y `precision` 1, el modelo ya es 36,6) y el **texto al salir o con Enter** («36,6»); al salir se muestran siempre `precision` decimales (37 → «37,0»). `0` = entero: el separador decimal no entra e `inputmode="numeric"`. Sin valor: decimales libres e `inputmode="decimal"`. Si `step` (o `min`) tiene más decimales que `precision`, aviso: el resultado de un paso se redondea a `precision` y puede salir de la rejilla.
- **`grouping`:** separador de miles al salir, con la regla del idioma (`Intl.NumberFormat` `useGrouping`; en `es`, «1234,5» y «12.345»). `false` para cifras que no se agrupan nunca (un año en `en-US` sería «2,026»). Mientras se escribe, nunca hay miles.
- **`prefix`/`suffix` + `*Label`:** exactamente la regla de `GInput` (#166, form.md C13): texto visible dentro de la caja, en `aria-describedby` antes de ayuda y mensaje (con `*Label`, el visible es `aria-hidden` y la expansión oculta entra en la descripción); no interactivos; pulsarlos enfoca el campo. La unidad **no** entra en `aria-valuetext` (saldría dos veces).
- **`steppers`:** pinta −/+ **solo con `decrementLabel` y `incrementLabel`** (sin valor por defecto, #226; mismo criterio que `showPasswordLabel`); sin ellos no se pintan y se avisa. Ausentes en solo lectura.
- **`name`:** va al `<input type="hidden">` del valor canónico y registra el campo en `GForm` (clave de `errors`); **el `<input>` visible no lleva `name`**. Prop (como `GSelect` y `GDatePicker`, form.md C10), no atributo.
- **`required`:** marca según la convención de `GForm` y **`aria-required="true"`** en el `<input>` visible; **nunca `required` nativo** (#311).
- **`readonly`:** `readonly` nativo **y** `aria-readonly="true"` (Chromium no expone ninguno de los dos en un `spinbutton`, medido; se ponen para el resto de motores y lectores); enfocable, seleccionable, sin pasos, sin −/+, y **se envía** (#266, C7).
- **`disabled`:** `disabled` nativo en el `<input>`, en −/+ y en el oculto (no se envía).
- **`size`, `variant`, `density`, `color`, `rounded`, `block`, `label`, `hint`, `error`, `warning`, `valid`, `output`, `mark`, `id`:** pasan tal cual a `GInput` (misma tabla de alturas y mismas reglas).
- **Atributos** (`placeholder`, `autocomplete`, `form`, `aria-*`, escuchas): al `<input>` visible, como en `GInput` (`class` y `style`, a la raíz). `autocomplete` es `off` por defecto (un número de cantidad no se autocompleta; la aplicación puede pasar uno). `form` se copia también al oculto. `inputmode` derivado va **antes** de `$attrs` (el consumidor puede sobrescribirlo, p. ej. `inputmode="text"` para negativos frecuentes en iOS); `type`, `role`, `dir` y los `aria-value*` van **después** y ganan.

### Idioma (`locale`)

- **Resolución:** la prop `locale` › el `lang` del **ancestro más cercano** (`closest('[lang]')`, que incluye `<html>`; un bloque `lang="ar-EG"` manda dentro de una página `es`) › `navigator.language`. Se lee **al montar** y cuando cambia la prop. Un `locale` que `Intl` rechaza (`RangeError`) avisa y sigue la cadena sin la prop.
- **Separador decimal, miles y cifras** salen de `Intl.NumberFormat(locale)` (`formatToParts`). Se muestran las **cifras del sistema del idioma** (arábigo-índicas en `ar-EG`); al escribir se aceptan las del idioma **y** las latinas.
- **Marcas bidi** de `Intl` (U+200E, U+200F, U+061C) se quitan del texto del campo y de `aria-valuetext` (`he` antepone U+200E al «-»): con `dir="ltr"` sobran y estorban al mover el cursor.
- **Límite (README):** un cambio del `lang` de un ancestro **después** de montar no se observa; una aplicación que cambia de idioma en caliente pasa `locale` reactivo (o vuelve a montar).

### SSR

Importar el componente y renderizarlo en el servidor no toca `document`, `window`, `navigator` ni `matchMedia`. **Con `locale`**, el servidor y el primer render del cliente escriben ya el texto formateado (idéntico: sin desajuste de hidratación). **Sin `locale`**, el servidor y el primer render del cliente escriben el **texto canónico** («72.5»), igual en los dos, y al montar se reformatea con el idioma resuelto (README: «en SSR pasa `locale` para que el HTML llegue formateado»). El oculto lleva el canónico desde el servidor. `is-ready` nunca está en el HTML del servidor (lo pone `GInput`). Temporizadores de repetición, medidas y animaciones, solo en el cliente.

---

## Estructura accesible

```html
<div class="g-input g-input--… g-number-field g-number-field--has-steppers [is-…]">        <!-- raíz de GInput; class/style del consumidor -->
  <label class="g-input__label" id="ID-label" for="ID">Peso<span class="g-input__optional"> (opcional)</span></label>
  <div class="g-input__row">
    <div class="g-input__control">                                                        <!-- pulsar su área vacía enfoca con el cursor al final -->
      <span class="g-input__prepend" aria-hidden="true">…</span>                          <!-- slot prepend (icono) -->
      <span class="g-input__prefix" aria-hidden="true">×</span><span class="g-input__prefix-label" id="ID-prefix">multiplicado por</span>
      <span class="g-number-field__value [is-rolling] [is-bumping]" [data-bump="up|down"]>  <!-- celda: espejo + input + capa -->
        <span class="g-number-field__mirror" aria-hidden="true">72,5</span>               <!-- solo da ancho (P1) -->
        <input class="g-input__field g-number-field__field" id="ID" type="text" role="spinbutton" dir="ltr"
               inputmode="decimal" autocomplete="off" spellcheck="false" autocorrect="off"
               aria-valuenow="72.5" aria-valuetext="72,5" aria-valuemin="0" aria-valuemax="400"
               aria-required="true" aria-describedby="ID-suffix ID-hint ID-message">
        <span class="g-number-field__roll" aria-hidden="true" dir="ltr" data-direction="up">…</span>  <!-- solo durante un paso (P2) -->
        <span class="g-number-field__measure" aria-hidden="true">400,0</span>             <!-- solo con −/+ dentro de una GFormRow (#312) -->
      </span>
      <input type="hidden" name="peso" value="72.5">                                       <!-- valor canónico; display: none, no ocupa -->
      <span class="g-input__suffix" aria-hidden="true">kg</span><span class="g-input__suffix-label" id="ID-suffix">kilogramos</span>
      <output class="g-input__output" id="ID-output" for="ID" aria-live="polite"></output> <!-- solo con output -->
      <span class="g-number-field__steppers">                                              <!-- slot interno end de GInput; solo con steppers y sin readonly -->
        <button type="button" class="g-number-field__step g-number-field__step--decrement" tabindex="-1"
                aria-controls="ID" aria-labelledby="ID-decrement ID-label" [disabled]>
          <span class="g-number-field__step-label" id="ID-decrement">Restar</span>[GIcon minus]
        </button>
        <button type="button" class="g-number-field__step g-number-field__step--increment" tabindex="-1"
                aria-controls="ID" aria-labelledby="ID-increment ID-label" [disabled]>
          <span class="g-number-field__step-label" id="ID-increment">Sumar</span>[GIcon plus]
        </button>
      </span>
    </div>
  </div>
  <div class="g-input__support"> ayuda · región g-input__message (siempre presente) </div>
</div>
```

- **Tres hijos en flujo** (etiqueta · caja · pie): los de `GInput` (C10/C12). Comparte línea en una `GFormRow` sin CSS propio de colocación (medido por kiwi: Δ `top` 0,00px y misma altura con `GInput` y `GSelect` a 1100/720/320px en los tres motores).
- **Orden dentro de la caja:** `prepend` · prefijo · valor · (oculto) · sufijo · `output` · −/+. El oculto es `display: none` y no genera hueco en la caja.
- **`spinbutton` editable:** `aria-valuenow` = el modelo (con valor), `aria-valuetext` = el modelo en el formato del idioma **siempre que hay valor** («72,5», con miles y `precision`; sin unidad), `aria-valuemin`/`aria-valuemax` solo con `min`/`max`. Vacío: sin `aria-valuenow` ni `aria-valuetext`. Por qué `valuetext` siempre (medido): `valuenow` no tiene idioma (un lector puede decir «72 punto 5») y **Chromium recorta `valuenow` al rango** (150 con `max` 120 expone 120), mientras `valuetext` conserva «150».
- **Nombre de −/+** (L4): `aria-labelledby` = su texto oculto (`ID-decrement`/`ID-increment`, patrón de texto oculto accesible dentro del botón) + **`ID-label`** (la etiqueta de `GInput`, que gana `id`, «Cambio por `GNumberField`» de `input.md`): «Restar Peso (opcional)»; respeta el slot `label`. Sin etiqueta visible (campo nombrado por `aria-label`/`aria-labelledby` del consumidor): con `aria-labelledby`, `"ID-decrement {sus ids}"`; con `aria-label`, `aria-label="{decrementLabel} {aria-label}"`. El icono es decorativo (`GLibIcon`, `aria-hidden`).
- **−/+ en el árbol, fuera del Tab:** `tabindex="-1"`, **no** `aria-hidden` (VoiceOver iOS y TalkBack los necesitan para ajustar sin teclado). El teclado ya tiene ↑/↓.

## Eventos

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `update:modelValue` | `Number \| null` | Cada cambio del **número** (no del texto): al escribir («1» → «1,» no emite: sigue 1), al pegar, en cada paso (también al repetir) y al redondear por `precision` |
| `change` | `Number \| null` | El **valor confirmado** cambia: al salir del campo o con Enter (si el modelo difiere del último confirmado), y **una vez por gesto** de paso: al soltar −/+ (`pointerup`, `pointercancel`, pérdida de foco de la ventana, o la activación sin puntero), al soltar la tecla de paso (`keyup` de ↑, ↓, Re Pág, Av Pág), nunca por cada paso repetido |

- **`change` se declara en `emits`** (#310): la escucha `@change` del consumidor recibe el `Number` confirmado y **no** llega al `<input>` nativo (lección de `emits`). El `change` nativo del `<input>` sigue existiendo para el contexto de `GForm` (manejadores primero), pero no se reemite: no se dispara con los pasos y sí con el reformateo de salida, así que no sirve como «valor confirmado».
- **Último confirmado:** se fija al montar y con cada `change`; un cambio de `modelValue` desde la aplicación lo actualiza **sin** emitir.
- Los demás eventos (`focus`, `blur`, `keydown`, `input`, `paste`…) no se declaran: llegan nativos al `<input>` visible, **después** de los manejadores propios.

## Slots

| Slot | Propósito | Anatomía que debe conservar |
| --- | --- | --- |
| `label` | Etiqueta con contenido rico | Como `GInput`: dentro del `<label for>` (que ahora lleva `id`), sin interactivos |
| `hint` | Ayuda con contenido rico | Como `GInput`: conserva `ID-hint` |
| `error` | Error con contenido rico | Como `GInput`: dentro de la región `g-input__message` |
| `prepend` | Icono decorativo antes del prefijo | Como `GInput`: envuelto en `aria-hidden` |

**Sin `append` ni `action`** (L6): el final de la caja es de −/+ y, con P1, un icono al final separaría el sufijo de lo que sigue sin aportar nada; un botón acoplado chocaría con −/+. Si se pasan, no se pintan y se avisa.

## Teclado

| Tecla | Acción |
| --- | --- |
| ↑ / ↓ | ± `step`, encajando en la rejilla desde `min`; nunca rebasa `min`/`max`; desde fuera de rango entra al límite (↓ desde 150 con `max` 120 → 120) |
| Shift + ↑ / ↓ | ± 10 × `step` (se pierde «extender la selección» de Shift+↑/↓ en un campo de una línea: coste aceptado) |
| Re Pág / Av Pág | ± 10 × `step` (APG, paso mayor) |
| Inicio / Fin | **Edición de texto** (nativo), **no** `min`/`max` |
| Vacío + ↑/↓ (o −/+) | Pone el punto de partida: `0`, o el límite más cercano si 0 queda fuera (30–45 → 30); no suma un paso a «nada» |
| En el límite + ↑/↓ | No cambia; P3 (tope) si no es autorrepetición |
| Alt/Ctrl/Meta + flechas | Nativo (no se interceptan) |
| Enter | Confirma (redondea, formatea, `change` si toca) y deja seguir el envío implícito del formulario |
| Escritura | Solo cifras (del idioma y latinas), **un** separador decimal (si `precision` ≠ 0) y «-» solo al principio y solo si se aceptan negativos; lo demás no entra y el cursor se conserva |
| Separador | «,», «.», «٫» o el del idioma se aceptan y **se convierten al del idioma al teclearlo** («36.5» se ve «36,5» en el acto) |
| Pegar | Se interpreta con la regla de kiwi: dos tipos de separador → el último es el decimal («1,234.5» → 1234,5); uno repetido → miles; uno solo seguido de exactamente tres cifras y que es el de miles del idioma → miles («12.345» en `es` → 12345); si no, decimal. Lo que no es número no entra. Se inserta el texto crudo del número ya redondeado |
| Rueda del ratón | **Nada** |
| Tab | Entra y sale del campo; −/+ fuera del orden |

- **Composición (IME):** el filtro actúa en `input` (no en `beforeinput`, que no es cancelable durante la composición) y no actúa mientras `isComposing`; se aplica en `compositionend`.
- **Al entrar** (foco): texto crudo del modelo (sin miles, con el separador y las cifras del idioma); si el texto venía seleccionado entero, sigue seleccionado entero. **Al salir:** el formato de `Intl`; «-», «,» o «-,» solos se vacían (modelo `null`).
- **Texto parcial:** «1,» se respeta mientras se escribe (modelo 1). Un cambio de `modelValue` desde la aplicación **que no coincide** con el texto lo reescribe; uno que coincide no lo toca (no se pierde la coma a medio escribir).
- **Paso con el foco en el campo:** el cursor queda al final del texto.

## −/+ (`steppers`)

- **Puntero:** `pointerdown` con el botón principal da un paso y **cancela la acción por defecto** (el foco se queda donde estaba; **sin foco previo, el campo no se enfoca**: en un móvil sumar no abre el teclado). **Repetición al mantener:** otro paso a los **400ms** y luego cada **60ms** (constantes neutras de JS, #313, `tokens.md` §29.6); se detiene en `pointerup`/`pointercancel` (escuchados en `window`), al perder la ventana el foco, al llegar al límite, al deshabilitarse y al desmontar.
- **Sin puntero:** un `click` con `detail === 0` (lector de pantalla, activación por teclado de la tecnología de apoyo) da **un** paso.
- **Deshabilitados:** − con el modelo ≤ `min`, + con el modelo ≥ `max` (con 150 > 120: + deshabilitado, − habilitado), y los dos con el campo `disabled`. Con el modelo `null`, los dos habilitados.
- **Solo lectura:** no se pintan (modo vista, C7). Con el bloqueo con interruptor (#266) aparecen al desbloquear **sin cambiar la altura** (son del alto de la caja) y **sin repartir la fila de nuevo** (el mínimo publicado los incluye siempre, #312).
- **Cuenta para `GForm`:** un paso con −/+ es un **cambio** (`notifyChange()`: sube `dirty`, no revela el error, «castigar tarde»); un paso con ↑/↓ o Re Pág/Av Pág es **escritura** (`notifyInput`: el error se revela al salir, como al teclear); pegar, también escritura. Los tres retiran `is-rejected` (I2).

## Personalidad (DECISIONS.md #313; decisión del usuario del 2026-10-03)

Las tres están prototipadas y medidas por kiwi (r01 §11), no cambian la API ni el árbol accesible, y **con `prefers-reduced-motion: reduce` ninguna se mueve** (#299 (3)). Duración `--g-duration-press`, curva `--g-ease-out`; **ninguna curva nueva** (#299 (1)).

### P1 · La unidad va pegada al número

- La celda `__value` **mide el texto**: el espejo (`__mirror`, `aria-hidden`, invisible, misma tipografía y `tabular-nums` que el campo) y el `<input>` comparten la celda; el `<input>` toma el ancho del espejo. El sufijo (y el `output`) van **justo detrás**, a la separación de la caja: en `md` con densidad por defecto, **`space × 2` = 8px** del valor (la medida del usuario); en los demás tamaños, la separación de la caja de ese tamaño (la misma que prefijo–valor), para no romper la proporción en `xs`/`xl`. El hueco libre queda **después** (antes de −/+).
- **Espejo:** el texto del campo o, vacío, el `placeholder` (`$attrs`); con ninguno, ancho mínimo de `1ch`. Al final, el hueco del cursor (constante neutra `1px`, `tokens.md` §7, #313).
- **Número que no cabe:** la celda encoge (`min-inline-size: 0`) y el `<input>` se desplaza; **la unidad sigue visible** (medido a 320px con «personas»).
- **Pulsar el área vacía de la caja** (o prefijo, sufijo, `output`) enfoca el campo con el **cursor al final**, sin abrir nada; −/+ quedan fuera de esta regla. Lo implementa `GNumberField` sobre el `g-input__control` de su `GInput` (escucha de `pointerdown` puesta al montar y quitada al desmontar); no cambia `GInput`.
- Siempre activa (con o sin sufijo). Solo `GNumberField`: para `GInput` sería otra decisión.

### P2 · Las cifras ruedan

- Al dar un paso **deliberado** (−/+ o ↑/↓/Re Pág/Av Pág), **solo las cifras que cambian** se deslizan en vertical: **hacia arriba al sumar, hacia abajo al restar** (19 → 20: dos cifras; 20 → 21: una). Comparación **alineada a la derecha** del texto viejo y el nuevo, incluidos separadores; una posición que antes no existía entra sin cifra vieja (99 → 100).
- **Mecánica:** el `<input>` recibe el valor nuevo **desde el primer cuadro** (y el árbol, `aria-valuenow`/`aria-valuetext`); encima, una capa **`__roll`** (`aria-hidden`, `dir="ltr"`, `data-direction="up|down"`) repite el texto nuevo; cada carácter que cambió va en un **`__roll-slot`** (`inline-block`, con recorte) con **`__roll-new`** y, si había, **`__roll-old`**; los que no cambian, como texto. Mientras existe la capa, `__value` lleva **`is-rolling`** (coco oculta el texto del `<input>`, no el cursor). Las cifras deben ser `inline-block`: `translate` no se aplica a cajas en línea (hallazgo de medida de kiwi).
- **Animación de coco:** keyframes con nombre **`g-number-roll…`** (nunca `g-reject…`: `GForm` filtra por ese prefijo), finitas, una vez, el 100 % de la altura de la celda de la cifra (geometría, no constante), `--g-duration-press` y `--g-ease-out`, **solo con `prefers-reduced-motion: no-preference`**.
- **Retirada (bruno):** la capa se quita cuando terminan todas sus animaciones (`animationend`/`animationcancel` cuyo nombre empieza por `g-number-roll`), **o en el acto** si, en el cuadro siguiente a crearla, ningún `__roll-slot` tiene animación calculada (`animation-name: none` o duración 0: movimiento reducido o sin CSS). Así el JS no tiene duraciones propias.
- **No rueda:** al **repetir** (botón mantenido tras el primer paso, tecla con `event.repeat`): el valor va al instante, para que la animación nunca se quede atrás del dato (medido: 0 capas al mantener 1s); si ya hay una capa (pasos rápidos: la anterior se retira y el nuevo paso no rueda); al escribir o pegar; si el texto no cabe en la celda (`scrollWidth > clientWidth`); con el campo sin cambio de valor. Cualquier cambio del texto, el foco o la salida retiran la capa en el acto.

### P3 · El tope

- Con el modelo en el límite (o más allá), una pulsación de ↑ (o ↓) que **no** es autorrepetición hace que el número **suba (o baje) `--g-space-1 × 0.5`** (≤ 2px con `space` 4; constante neutra, #313) y **vuelva**, una vez. El valor no cambia. Con −/+ no hace falta (el botón ya está deshabilitado).
- **Mecánica:** `__value` recibe **`is-bumping`** y **`data-bump="up|down"`**; coco anima con keyframes **`g-number-bump…`** (`--g-duration-press`, `--g-ease-out`, solo con `no-preference`). Bruno quita la clase en `animationend`/`animationcancel` de nombre `g-number-bump…`, o en el acto si no hay animación calculada (como P2). Una pulsación nueva la quita y la vuelve a poner en el cuadro siguiente.
- Medido por kiwi: desplazamiento máximo 1,65px (Chromium) / 1,93px (WebKit), vuelve a 0, el valor no cambia; fuera del límite no aparece.

### Fuera

- **Reservada · P4, arrastrar para ajustar** (sobre el prefijo o el sufijo): choca con la selección de texto con el ratón y con el desplazamiento táctil, y su alternativa sin arrastre (2.5.7) ya son −/+ y flechas. Para un producto que la pida.
- **Descartada · el sufijo que se funde al vaciar:** con P1 el sufijo ya acompaña al hueco del número; ocultarlo quita la pista de unidad justo antes de escribir.

---

## Tokens consumidos

**Tokens nuevos: ninguno** (#313; `tokens.md` §30). Además de los de `GInput` (caja, texto, prefijo/sufijo, foco, mensajes, solo lectura, `is-rejected`), el CSS de coco para lo propio:

| Token | Para qué |
| --- | --- |
| `--g-space-1` | Lado de −/+ (el alto de caja `--_h` de `GInput`, derivado de `space`); P3 (`× 0.5`); separación de P1 (la de la caja) |
| `--g-border-width` | Separador entre la caja y −/+ y entre − y +; margen negativo para que −/+ lleguen de borde a borde |
| `--g-color-border-control` | Separador de −/+ (≥ 3:1: delimita un control) |
| `--g-color-text-muted` | Icono de −/+ en reposo (≥ 3:1, componente de interfaz) |
| `--g-color-text` | Icono de −/+ al pasar y pulsar |
| `--g-color-text-subtle` | Icono de −/+ deshabilitado |
| `--g-color-neutral-soft` | Fondo de −/+ al pasar y pulsar (solo lectura no tiene −/+: no hay choque con el relleno de C7) |
| `--g-radius-{rounded}`, `--g-radius-sm` | Esquinas exteriores del último botón (las de la caja) |
| `--g-text-caption-size` … `--g-text-body-size` | Tamaño del icono (`1em` del texto escrito de cada `size`), del espejo y de la capa de P2 |
| `--g-duration-fast`, `--g-ease-standard` | Fondo y color de −/+ |
| `--g-duration-press`, `--g-ease-out` | P2 y P3 |
| `--g-focus-*` | Sin anillo propio en −/+ (no reciben foco); el del campo es el de `GInput` |

**No son tokens** (`tokens.md` §29.6, §7, §30): repetición **400ms / 60ms** (constantes de JS, como `HOVER_MS`); **`0.5`** de P3; **`1px`** del cursor al final del espejo; **`1ch`** de ancho mínimo del espejo (unidad, #187); el **100 %** de P2 (geometría); `24px`/`44px` (área táctil, §7).

## Clases y datos (contrato bruno ↔ coco)

Bruno las emite; coco las estiliza. Las de `GInput` (raíz, caja, prefijo/sufijo, `output`, pie, estados `is-*`, `is-ready`, `is-rejected`) siguen siendo de `GInput`.

| Clase / dato | Elemento | Cuándo |
| --- | --- | --- |
| `g-number-field` | Raíz (la de `GInput`) | Siempre |
| `g-number-field--has-steppers` | Raíz | −/+ pintados (con `steppers`, los dos textos y sin `readonly`) |
| `g-number-field__value` | `span` celda del valor | Siempre |
| `is-rolling` | `__value` | Mientras existe la capa de P2 |
| `is-bumping` + `data-bump="up\|down"` | `__value` | Durante P3 |
| `g-number-field__mirror` | `span` `aria-hidden` | Siempre (P1) |
| `g-number-field__field` | `<input>` visible (junto a `g-input__field`) | Siempre |
| `g-number-field__roll` + `data-direction="up\|down"` | `span` `aria-hidden` `dir="ltr"` | Solo durante un paso que rueda |
| `g-number-field__roll-slot`, `__roll-new`, `__roll-old` | `span` por carácter que cambia | Dentro de `__roll` |
| `g-number-field__measure` | `span` `aria-hidden` fuera de flujo | Solo con −/+ (aunque estén ausentes por `readonly`) dentro de una `GFormRow` (#312) |
| `g-number-field__steppers` | `span` contenedor de −/+ | −/+ pintados |
| `g-number-field__step`, `--decrement`, `--increment` | `button` | −/+ pintados |
| `g-number-field__step-label` | `span` texto oculto dentro del botón | −/+ pintados |

**Para coco** (además de lo dicho en «Personalidad»): `font-variant-numeric: tabular-nums` en el campo, el espejo, el medidor y la capa (el ancho de P1 y la alineación de P2 lo necesitan); −/+ **cuadrados del alto de la caja** (`--_h` de `GInput`), de borde a borde incluido el borde, piso de **24px** y **44px** con `pointer: coarse` (medido por kiwi: xs 24, sm 28, md 36, lg 44, xl 52; xs `compact` 24; con puntero grueso 44×44); `touch-action: manipulation`, sin selección ni menú de toque largo (`user-select: none`, `-webkit-touch-callout: none`); hover dentro de `@media (hover: hover)`; `forced-colors`: −/+ con borde y color del sistema (`ButtonText`/`GrayText`), separador visible; el texto del campo alineado con `text-align: match-parent` (a la derecha en RTL cuando desborda); la sacudida de I2 ya mueve `g-input__row` y con ella −/+ (sin regla nueva); el `__measure` fuera de flujo (no cambia la caja) con la tipografía del campo; cursor de texto en el área vacía de la caja y normal sobre −/+.

## RTL e idiomas

- La caja sigue el orden RTL (valor a la derecha, −/+ a la izquierda, medido) y el `<input>` lleva **`dir="ltr"`** siempre (sin él, el «-» de «-4,5» se dibuja al final por el algoritmo bidi). La capa de P2 también `dir="ltr"`.
- Los iconos `minus`/`plus` no se reflejan (no son direccionales).
- P2 «arriba»/«abajo» es vertical: no cambia con RTL.

## Mínimo en una `GFormRow` con −/+ (#312)

Un campo con −/+ necesita más sitio que su clase de tamaño (−/+ ocupan 2 × alto de caja: 72px en `md`, 88px con puntero grueso). En vez de una cifra fija de `--g-form-min` (kiwi estimó ≈ 30 sin medir), el campo **publica su mínimo intrínseco** a la fila (#271, `setIntrinsicMin`, como el segmentado de `GRadioGroup`):

- **Mínimo (px)** = ancho de la caja − ancho de la celda `__value` (padding, prefijo, sufijo, `output`, separaciones, −/+ y bordes, todo medido) + ancho del **texto de referencia** medido en `__measure`, redondeado hacia arriba.
- **Texto de referencia** = el más ancho, medido, entre `min` y `max` formateados (con `grouping` y `precision`) y el `placeholder`; sin `min` ni `max`, **cuatro cifras** del sistema del idioma sin miles («8888»).
- **Cuándo:** solo con `steppers` y sus dos textos, **también en `readonly`** (se mide como si estuvieran: desbloquear no reparte la fila, #266) y solo si el sub‑contexto de la fila provee `setIntrinsicMin`; sin −/+ el campo se comporta como `GInput` (clase de tamaño y `--g-form-min`). Se vuelve a medir al montar, al cargar las fuentes, cuando cambian `min`, `max`, `precision`, `grouping`, `locale`, `placeholder`, `prefix`, `suffix`, `output`, `size`, `density` o `steppers`, y con un `ResizeObserver` sobre `__measure` y `__steppers` (cambian con el puntero grueso y la fuente); publica solo si cambia ≥ 0,5px y retira con `0` al desmontar o al dejar de tener −/+.
- **Mínimo efectivo** (form.md §4) = el mayor entre el de su clase, `--g-form-min` × `space` y este. El consumidor puede seguir subiéndolo con `--g-form-min`.
- **Valor de referencia para la receta** (no normativo): coco lo mide en `md` con `space` 4 para «Cantidad» 1–99 con −/+ y lo anota en su `estilo.md`; mora-docs lo lleva al README.

---

## Avisos de desarrollo (`[Grana GNumberField]`, una vez por instancia)

Con el patrón `typeof process !== 'undefined' && process.env.NODE_ENV !== 'production'`.

1. Sin nombre accesible: sin `label`, slot `label`, `aria-label` ni `aria-labelledby`. (`GInput` no avisa por su cuenta cuando lo compone `GNumberField`: «Cambio por `GNumberField`» de `input.md`.)
2. `steppers` sin `decrementLabel` o sin `incrementLabel`: −/+ no se pintan.
3. `min > max`: se ignoran los dos límites.
4. `step` ≤ 0 o no finito (además del validador): se usa `1`.
5. `precision` menor que los decimales de `step` o de `min` (p. ej. `step` 0,25 con `precision` 1): los pasos se redondean y salen de la rejilla.
6. `modelValue` `NaN` o `±Infinity`: se lee como `null`. (Una cadena ya la señala la comprobación de tipos de Vue.)
7. `locale` que `Intl` rechaza: se usa el idioma del documento.
8. `type` en `$attrs` (no aplica: el campo es siempre `type="text"`), o slots `append`/`action` (no se pintan).

## Resolución de hallazgos (kiwi r01, §12)

| # | Hallazgo | Resolución | Base |
| --- | --- | --- | --- |
| L1 | Cómo no duplicar `GInput` | **Compone `GInput`.** `GInput` gana dos añadidos **internos** (slot interno `field` en lugar de su `<input>`, con `bind`, `setControl`, `notifyInput`, `notifyChange`, `readonly` y `disabled`; slot interno `end` al final de la caja, **sin** `aria-hidden`) y un cambio de estructura visible (`id="ID-label"` en su `<label>`). El `name` queda registrado en `GForm` por `GInput` y `GNumberField` lo quita del `<input>` visible y lo pone en el oculto, así que **no hace falta un tercer añadido**. Sin API pública nueva en `GInput` | #309; `input.md` «Cambio por `GNumberField`» |
| L2 | Motor numérico compartido | Utilidad interna **`packages/vue/src/utils/numberInput.js`** (no se exporta desde `src/index.js`; con su `numberInput.test.js`): idioma (`decimal`, `group`, cifras, menos, sin marcas bidi), texto tecleado a ASCII, validez del texto parcial, número parcial, pegado, formato de salida y crudo, redondeo a `precision`, paso en la rejilla con límites y punto de partida. Sin estado ni DOM: la reutiliza `GInputGroupNumber` cuando entre (#314) | #309 |
| L3 | Props | Tabla de «Props»: los nombres de kiwi, **`grouping`** incluido, `name` como prop, `steppers` (no `controls`), `decrementLabel`/`incrementLabel` sin valor; **sin** `unit`, `inputmode`, `type`, `loading`, `counter` ni `field` (reservado) | #310 |
| L4 | Nombre de −/+ | `aria-labelledby` = texto oculto propio + `ID-label` (respeta el slot `label`); variantes sin etiqueta visible en «Estructura accesible» | #311; WCAG 2.5.3, 4.1.2 |
| L5 | Eventos | `update:modelValue` y **`change` propio** declarado (valor confirmado, una vez por gesto de paso); el nativo no se reemite | #310; lección de `emits` |
| L6 | Slots | `label`, `hint`, `error`, `prepend`; **sin** `append` ni `action` (aviso si se pasan) | #310 |
| L7 | Clases | Tabla de «Clases y datos»; P3 como clase de una vez **`is-bumping` + `data-bump`** (no WAAPI: las duraciones y curvas son de coco, en CSS); P2 con `data-direction` en `__roll` | #313; reglas de literales |
| L8 | Tokens y `--g-form-min` | **Ningún token nuevo.** El mínimo de un campo con −/+ se **publica medido** (`setIntrinsicMin`, #271) con la regla de «Mínimo en una `GFormRow`»; `--g-form-min` sigue disponible para subirlo | #312, #313 |
| L9 | Constantes neutras | 400ms / 60ms de repetición, `0.5` de P3 y `1px` del cursor: no son tema (`tokens.md` §29.6 y §7) | #313; #187 |
| L10 | `required` | `aria-required`, nunca `required` nativo (medido por kiwi: en Chromium el nativo no marca inválido un `spinbutton` vacío, pero el `<input>` visible no es el que se envía y la restricción nativa no tendría sentido). **Extiende #270 solo a `GNumberField`**; el pendiente de `GInput`, `GTextarea` y `GInputGroupSelect` sigue abierto (el dato de kiwi le sirve, `PENDIENTES.md` §2) | #311; #269, #270 |
| L11 | Avisos | Lista de «Avisos de desarrollo» (los seis de kiwi más `locale` inválido y `type`/slots que no aplican) | #310 |
| L12 | Receta de signos vitales | Frecuencia, Saturación, Peso y Estatura pasan a `GNumberField` (`form.md` §8); Temperatura sigue en `GInputGroup` (unidad elegible) hasta `GInputGroupNumber` | #314 |
| L13 | Personalidad | Adoptadas P1, P2 y P3 por el usuario; registrada en DECISIONS (#313) con P4 reservada y el fundido del sufijo descartado | #313; regla «Personalidad e innovación» |
| L14 | Límites para el README | «Límites conocidos» abajo | — |

## Límites conocidos (para el README)

- **iOS:** `inputmode="decimal|numeric"` no tiene tecla «-». Para negativos frecuentes, −/+ (bajar de 0 pasa a negativos) o `inputmode="text"` por `$attrs`. No medido en dispositivo.
- **Chromium sin `min`/`max`** expone `aria-valuemin` 0 y `aria-valuemax` 0 (valor por defecto del rol); no hay forma ARIA de evitarlo. Con `aria-valuetext` el lector dice el valor correcto.
- **Chromium recorta `aria-valuenow` al rango** (150 con `max` 120 → 120); `aria-valuetext` conserva «150».
- **Solo lectura en Chromium:** el `spinbutton` no expone `readonly` (ni nativo ni `aria-readonly`); es enfocable y sin `settable`. Lo que dice un lector real, sin verificar.
- **Inicio/Fin** editan el texto (no saltan a `min`/`max`); en macOS (Firefox, WebKit) no mueven el cursor por convención del sistema.
- **El teclado decimal del móvil** sigue la región del sistema, no el idioma de la página (por eso se aceptan «,», «.» y «٫»).
- **Teclear «.» en `es`** lo convierte en «,» (decimal): «1.234» tecleado es 1,234; los miles se escriben sin separador y al salir los pone `Intl` con la regla del idioma («12345» → «12.345»; en `es`, «1234» queda «1234»). Pegar sí distingue miles.
- **Idioma cambiado en caliente** en un ancestro: no se observa (pasar `locale` reactivo).
- **Agrupación india** (`en-IN`, «12,34,567») y `de-CH` (apóstrofo): el formato de salida es el de `Intl`; la regla de pegado no se midió con ellos.

## Verificación (cómo se da por hecho)

**Criterio de hecho:** las medidas de kiwi (`design/lab/number-field/r01/verificar.mjs`, 233/233) reproducidas **sobre el componente real**.

### bruno (vitest + jsdom)

- Motor (`numberInput.test.js`): idioma `es`, `en`, `he`, `ar-EG` (separador, cifras, sin marcas bidi); filtro de escritura (letras, «e», segundo separador, «-» sin negativos y fuera del principio, separador con `precision` 0); conversión del separador; parcial («1,» → 1; «-», «,», «-,» → `null`); pegado (las cuatro reglas); rejilla desde `min` sin error de coma flotante; punto de partida; entrada al límite desde fuera; `precision` (modelo al momento, texto al salir).
- Componente: modelo `Number`/`null` siempre (nunca cadena); `update:modelValue` no emite en «1» → «1,»; `change` una vez por gesto (mantener −/+ 1s → un `change`; flechas con autorrepetición → un `change` al `keyup`; salida sin cambio → ninguno; cambio desde la aplicación → ninguno); el `@change` del consumidor no llega al nativo; atributos (`type=text`, `role`, `dir`, `inputmode` derivado y sobrescribible, `aria-value*` con y sin valor y límites, `aria-required` sin `required`, `aria-readonly`); oculto (`name`, canónico `72.5`/`12345`/`''`, `disabled` con el campo, presente en `readonly`, `form` copiado) y **visible sin `name`**; `FormData` de un `<form>`; registro en `GForm` por `name`; `errors[name]` pinta el mensaje; manejadores primero (prueba de orden, como `GInput`); `notifyChange` con −/+ y `notifyInput` con flechas (sube `dirty`; con flechas el error se revela al salir, con −/+ no); `is-rejected` retirado por un paso; −/+: ausentes sin textos (aviso), en `readonly`, deshabilitados en los límites y con `disabled`, `tabindex=-1`, `aria-labelledby`, `pointerdown` con `preventDefault`, sin enfocar el campo, repetición 400/60 con temporizadores falsos y parada en `pointerup`/`pointercancel`/`blur`/límite, `click` con `detail` 0; P2 (capa solo en pasos deliberados, con cifras cambiadas correctas y `data-direction`; sin capa al repetir, al escribir y con texto desbordado; retirada por `animationend` `g-number-roll…` y en el acto sin animación calculada), P3 (`is-bumping` + `data-bump` solo con tecla no repetida en el límite; retirada); SSR (`renderToString` con y sin `locale`: texto formateado / canónico, sin acceso a `window`); avisos 1 a 8; `GInput` sin cambios visibles fuera del slot interno (sus pruebas siguen verdes; `id` en la etiqueta).

### Playwright (Chromium, Firefox, WebKit; `design/lab/theme-playground/`)

- `tests/number-field.spec.mjs`: el `verificar.mjs` de kiwi adaptado al componente real (árbol con `ariaSnapshot` y CDP en Chromium, teclado, pegado con el evento real en Chromium/WebKit, −/+ sin foco y con toque, tamaños 24…52 y 44 con puntero grueso, RTL `ar-EG`/`he`, 320px sin desborde con la unidad visible, envío con `is-rejected`, fila con `GInput` y `GSelect`: Δ `top` ≤ 1px y misma altura a 1100/720/320) y el **mínimo publicado**: un campo con −/+ en una fila se parte de línea antes de que el valor de referencia deje de caber (y no reparte al desbloquear un `readonly`).
- `tests/personalidad-number-field.spec.mjs`: P1 (distancia valor–sufijo = separación de la caja con 1, 3 y 6 caracteres; 8px en `md`), P2 (≥ 2 posiciones intermedias, termina y retira la capa; 0 capas al mantener 1s; el `<input>` y el árbol tienen el valor nuevo en el primer cuadro), P3 (≤ `space × 0.5`, vuelve a 0, valor igual; nada fuera del límite); con `reduce`, ninguna se mueve y no quedan capas ni clases.
- Prueba obligatoria de distribución (`tests/form-distribution.spec.mjs`, #184): el playground de formularios usa `GNumberField` en signos vitales y sigue pasando (1 línea a 1280/960, 2 a 720, 3 a 360).

### coco (CSS y auditoría)

Solo `var(--g-*)` y `--_*` más las constantes de §29.6/§7; P1/P2/P3 medidos en los tres motores; auditoría con un tema distinto (−/+, separador, hover, deshabilitado, foco y P1 sin valores del tema anterior; `forced-colors` emulado). Resultado en `design/lab/number-field/auditoria.md`.

### No verificado (entorno real)

Lector de pantalla (VoiceOver, NVDA, TalkBack: `spinbutton` editable, `valuetext`, el recorte de `valuenow`, solo lectura, −/+ fuera del Tab, ajuste por gestos en iOS); móvil y teclados virtuales reales (separador por región, «-» en iOS, −/+ sin abrir el teclado, doble toque sin zoom); IME real; pegado real en Firefox; `forced-colors` real; zoom 200/400 %.
