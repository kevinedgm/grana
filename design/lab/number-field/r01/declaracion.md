# Declaración — GNumberField (r01)

> kiwi · 2026-10-03 · prototipo `index.html` (componentes reales de `dist/` + `XNumberField`), verificación `verificar.mjs` (**233/233**: Chromium 83, Firefox 73, WebKit 77). Fase 2 del sistema de formularios, **sin moneda** (#154). Brief: `brief.md`.

## 0. Solapes revisados antes de proponer

| Componente | Qué comparte | Decisión |
| --- | --- | --- |
| `GInput` | Caja, etiqueta, pie, prefijo/sufijo (#166), `output` (C12), `is-ready`/`is-rejected` (#304), colocación en `GFormRow` (C10) | **No se duplica:** `GNumberField` es la anatomía de `GInput` más un motor numérico y −/+ (punto 1; vía de implementación en hallazgo L1) |
| `GInputGroup` (§13) | Unidad elegible, receta de signos vitales | La unidad elegible sigue siendo **dos preguntas** (número + `GSelect` «Unidad») o `GInputGroup` con su parte de texto; **«`GNumberField` como parte» se reserva** (punto 10) |
| `GSelect` / `GInputGroupSelect` | `<input type="hidden">` con el valor real cuando lo visible no lo es | Mismo mecanismo para el valor canónico (punto 6) |
| `GDatePicker` | Teclado propio sobre un campo de texto, `inputmode` | Mismo criterio: la edición de texto manda sobre los atajos (punto 3, Inicio/Fin) |
| Deslizador (sin ronda) | Valor numérico con límites | Fuera: un `slider` es otro patrón APG; aquí se **escribe** el número |

## 1. Decisiones estructurales

1. **Campo de texto con rol `spinbutton`.** `<input type="text" role="spinbutton" inputmode="decimal|numeric" dir="ltr">` con `aria-valuenow`, `aria-valuemin`, `aria-valuemax` y **siempre** `aria-valuetext`. Nunca `type="number"` (decidido en form r01). Medido en Chromium: el nodo es `spinbutton` **editable (`plaintext`)**, con valor, límites y descripción; la alternativa sin rol (medida en la página, `#m-plain`) es un `textbox` sin valor numérico ni límites, y los lectores pierden «incrementador» y el ajuste con flechas. APG *Spinbutton*.
2. **`aria-valuetext` siempre que hay valor**, con el número en el formato del idioma («72,5»). Dos motivos medidos: (a) `aria-valuenow` es un número sin idioma (un lector puede leerlo con el punto inglés, «72 punto 5», en una página en español); (b) **Chromium recorta `aria-valuenow` al rango**: con 150 escrito y `max` 120 expone 120, mientras `aria-valuetext` conserva «150». Sin `valuetext`, el lector diría un valor que no está en la caja. La unidad **no** entra en `valuetext`: ya está en la descripción (#166) y saldría dos veces.
3. **Modelo `Number` o `null`, nunca cadena** (medido: todos los modelos de la página). Vacío, «-», «,» o «-,» son `null`. **Grana no valida (#157):** lo escrito fuera de rango **no se recorta** (150 queda 150); el error lo calcula la aplicación desde el `Number` y `GForm` decide cuándo se ve (medido en el caso 8). Recortar en silencio cambiaría el dato sin avisar (GOV.UK: no cambiar lo que la persona escribió).
4. **Lo que sí se limita son los pasos** (flechas, −/+): nunca rebasan `min`/`max`, y desde fuera de rango entran al límite (↓ desde 150 → 120). APG: los incrementos respetan el rango.
5. **`precision` redondea el modelo en el acto y el texto al salir.** Mientras se escribe «36,55» el texto se respeta y el modelo ya es 36,6; al salir (o con Enter) el texto pasa a «36,6». Así un envío sin `blur` (Safari no enfoca el botón al pulsarlo; Enter) nunca lleva más decimales de los pedidos.
6. **Lo enviado es canónico, no lo visible.** El `<input>` visible **no lleva `name`**; un `<input type="hidden" name>` lleva el valor con punto decimal y sin miles (`72.5`, `12345`, `''` si es `null`), `disabled` con el campo (no se envía) y presente en solo lectura (sí se envía, #266). Medido: `FormData` = `peso="72.5"`, `poblacion="12345"` mientras la caja dice «72,5» y «12.345». Precedente: `GSelect`.
7. **Formato con `Intl` al salir, crudo al entrar.** Al salir: `Intl.NumberFormat(locale)` con la regla de miles del idioma (`useGrouping` por defecto: en `es`, «1234,50» y «12.345»). Al entrar: el mismo número sin miles («1234567»), con el separador decimal y las cifras del idioma, y la selección completa si venía seleccionado.
8. **`locale`:** el de la prop o, sin ella, el `lang` del ancestro más cercano (la página, o un bloque `lang="ar-EG"`). Cifras del sistema del idioma (arábigo-índicas en `ar-EG`) al mostrar; al escribir se aceptan las del idioma **y** las latinas (medido: «-7» → «-٧٫٠»; «٣٫٥» → 3.5).
9. **−/+ opcionales, dentro de la caja, al final**, cuadrados de la altura de la caja y de borde a borde (punto 5 de §5).
10. **`GNumberField` como parte de `GInputGroup`: se reserva** (punto 10).
11. **Solo una apariencia de −/+ en v0.1** (al final). «Partido» (− al principio, + al final) se descarta: separa el prefijo del valor, deja dos objetivos lejanos y en RTL invierte su sentido.

## 2. Anatomía (tres hijos, como `GInput`; C10)

```html
<div class="g-input g-number-field … [has-steppers] [is-…]">            <!-- raíz: tres hijos en flujo -->
  <label class="…__label" for="ID">Peso<span class="…__optional"> (opcional)</span></label>
  <div class="…__row">
    <div class="…__control">                                                <!-- la caja; pulsar su área vacía enfoca con el cursor al final -->
      <span class="…__prefix" aria-hidden="true">×</span><span class="…__prefix-label" id="ID-prefix">multiplicado por</span>
      <span class="…__value">                                               <!-- celda del valor: input + espejo + capa de rodillo -->
        <span class="…__mirror" aria-hidden="true">72,5</span>             <!-- solo da ancho (P1) -->
        <input class="…__field" id="ID" type="text" dir="ltr" role="spinbutton" inputmode="decimal"
               aria-valuenow="72.5" aria-valuetext="72,5" aria-valuemin="0" aria-valuemax="400"
               aria-required="true" aria-describedby="ID-suffix ID-hint ID-message" autocomplete="off" spellcheck="false">
        <span class="…__roll" aria-hidden="true" dir="ltr">…</span>        <!-- solo durante un paso (P2) -->
      </span>
      <span class="…__suffix" aria-hidden="true">kg</span><span class="…__suffix-label" id="ID-suffix">kilogramos</span>
      <span class="…__steppers">                                            <!-- solo con steppers y sin readonly -->
        <button type="button" class="…__step …__step--decrement" tabindex="-1" aria-label="Restar Peso" aria-controls="ID">[minus]</button>
        <button type="button" class="…__step …__step--increment" tabindex="-1" aria-label="Sumar Peso" aria-controls="ID">[plus]</button>
      </span>
    </div>
    <input type="hidden" name="peso" value="72.5">                          <!-- valor canónico (punto 6) -->
  </div>
  <div class="…__support"> ayuda · región de mensaje (siempre presente) </div>
</div>
```

Orden dentro de la caja: `prepend` · prefijo · valor · sufijo · `output` (si entra, C12) · −/+. Medido en la página con las clases reales de `GInput`: las cajas de una `GFormRow` comparten `top` y altura (punto 8).

## 3. Teclado (medido en los tres motores)

| Tecla | Acción | Nota |
| --- | --- | --- |
| ↑ / ↓ | ± `step`, encajando en la rejilla de `step` desde `min` (72,53 ↑ → 72,6) | Sin error de coma flotante (72,5 + 3 × 0,1 = 72,8) |
| Shift + ↑ / ↓ | ± 10 × `step` | Se pierde «extender la selección hasta el borde» de Shift+↑/↓ en un campo de una línea: coste aceptado, el campo es de un número corto |
| Re Pág / Av Pág | ± 10 × `step` | APG («paso mayor») |
| Inicio / Fin | **Edición de texto** (cursor al principio/final), **no** `min`/`max` | APG los marca opcionales; aquí el valor se escribe y corregir la primera cifra es más frecuente que saltar al límite. En macOS (Firefox, WebKit) no mueven el cursor por convención del sistema; no cambian el valor en ningún motor |
| Vacío + ↑/↓/−/+ | Pone el punto de partida: 0, o el límite más cercano si 0 queda fuera (temperatura 30–45 → 30) | No suma un paso a «nada» |
| En el límite + ↑/↓ | No cambia; P3 (tope) | |
| Enter | Confirma (redondea y formatea) y deja que el formulario envíe | Nativo |
| Escritura | Solo cifras (del idioma y latinas), **un** separador decimal y «-» al principio | Lo demás no entra (medido: «a», «e», «,» en un entero) |
| Separador | Se acepta «,», «.», «٫» o el del idioma, y **se convierte al del idioma al teclearlo** («36.5» se ve «36,5» en el acto) | El teclado decimal del móvil sigue la región del sistema, no el idioma de la página |
| «-» | Solo si `min` falta o es < 0; solo al principio | |
| Pegar | Regla del idioma con heurística: dos tipos de separador → el último es el decimal («1,234.5» → 1234,5); uno repetido → miles; uno solo seguido de exactamente 3 cifras y que es el de miles del idioma → miles («12.345» en `es` → 12345); si no, decimal. Lo que no es número se ignora | Medido en Chromium y WebKit con el evento real; en Firefox el evento sintético llega sin datos y se midió la regla |
| Rueda del ratón | **Nada** | El motivo de no usar `type=number` |
| Tab | Entra y sale del campo; **−/+ fuera del orden** (`tabindex="-1"`) | Medido: de «Descuento» a «Cantidad» sin pasar por sus botones. El teclado ya tiene ↑/↓ |

**Límite conocido (no medido en dispositivo):** `inputmode="decimal|numeric"` en iOS no tiene tecla «-». Para negativos frecuentes (refrigerador −30…10), se recomiendan −/+ (bajar de 0 pasa a negativos). Se documenta; no se cambia a `inputmode="text"`.

## 4. Modelo y texto

1. `update:modelValue` en cada cambio del número (no del texto): «1» → «1,» no emite (sigue 1).
2. Texto parcial «1,» se respeta mientras se escribe; el modelo es 1. Un cambio del modelo desde fuera **que no coincide** con el texto lo reescribe; uno que coincide no lo toca (no se pierde la coma a medio escribir).
3. Al salir: texto = `Intl` del modelo (o vacío). «-» o «,» solos se vacían.
4. `precision` sin valor: decimales libres (`inputmode="decimal"`); `precision` 0: entero (`inputmode="numeric"`, el separador no entra).
5. Lo pegado se inserta como texto crudo del número ya redondeado.

## 5. −/+ (`steppers`)

1. **Opcionales** (prop booleana) y **solo con sus dos textos** (`decrementLabel`, `incrementLabel`, sin valor por defecto: Grana es internacional; mismo criterio que `showPasswordLabel`). Sin ellos, no se pintan y se avisa en desarrollo.
2. **En el árbol, fuera del Tab:** `button type="button" tabindex="-1"` con nombre = texto + etiqueta del campo («Restar Cantidad», medido) y `aria-controls`. **No** `aria-hidden`: un lector táctil (VoiceOver iOS, TalkBack) los necesita para ajustar sin teclado; la activación sin puntero (`click` con `detail` 0) suma un paso (medido). En Grana el nombre debería componerse con `aria-labelledby` (texto propio + `ID-label`) para respetar el slot `label` (hallazgo L4).
3. **No roban el foco** (`preventDefault` en `pointerdown`): con el foco en el campo, sigue ahí; **sin foco previo, el campo no se enfoca** (medido con ratón y con toque): en un móvil, sumar una unidad no abre el teclado.
4. **Repetición al mantener:** un paso al pulsar, otro a los 400 ms y luego cada 60 ms; se detiene al soltar, al cancelar el puntero, al perder la ventana el foco o al llegar al límite (medido: 1 s → 10 a 12 pasos). Constantes neutras, no tema (como `HOVER_MS`, #187/#308).
5. **Tamaño:** cuadrados de la altura de la caja (`--_h` de `GInput`), de borde a borde incluido el borde (márgenes negativos del grosor del borde), con piso de 24 px y, con puntero grueso, 44 px. Medido: xs 24×24, sm 28, md 36, lg 44, xl 52, xs `compact` 24; con puntero grueso 44×44 (Chromium y WebKit). `touch-action: manipulation` para que dos toques rápidos no amplíen la página.
6. **Deshabilitados en los límites** (− en `min`, + en `max`; con 150 > 120, + deshabilitado y − habilitado) y con el campo `disabled`. **En solo lectura no existen** (la caja de solo lectura es «modo vista», C7; con el bloqueo con interruptor, #266, aparecen al desbloquear sin cambiar la altura).
7. Un paso con −/+ cuenta como **cambio** (`notifyChange`: sube `dirty`, no revela el error: «castigar tarde»); un paso con ↑/↓ cuenta como **escritura** (el error se revela al salir, como al teclear).

## 6. Árbol accesible (Chromium, CDP; los tres motores por `ariaSnapshot`)

| Caso | Medido |
| --- | --- |
| «Peso» con 72,5 | `spinbutton` «Peso (opcional)», `editable: plaintext`, `valuenow` 72.5, `valuetext` «72,5», `valuemin` 0, `valuemax` 400, descripción «kilogramos Con un decimal.» |
| Vacío | `spinbutton` sin valor |
| Fuera de rango (150, `max` 120) | `valuenow` **120** (recorte de Chromium), `valuetext` «150», `invalid` por el error de la aplicación |
| Sin `min`/`max` | Chromium expone `valuemin` 0 y `valuemax` 0 (su valor por defecto del rol). No hay forma ARIA de evitarlo; con `valuetext` el lector dice el valor correcto. Límite para el README |
| Solo lectura | `spinbutton` enfocable **sin `settable`**; Chromium **no** expone `readonly` ni con el atributo nativo ni con `aria-readonly` (los dos puestos en el prototipo). Lo que el lector dice en entorno real queda sin verificar |
| `required` nativo vs `aria-required` (#270) | En Chromium, un `spinbutton` de texto vacío con `required` nativo **no** sale inválido (a diferencia de la casilla de #269): `invalid=false`, `required=true` con los dos. Se propone **`aria-required`** igualmente: el `<input>` visible no es el que se envía (punto 6) y la restricción nativa no tendría sentido |
| −/+ | `button` «Restar Cantidad» / «Sumar Cantidad», `[disabled]` en el límite, `controls` → el campo |

## 7. Estados (todos en la página, §4)

Vacío · con valor · foco (anillo de `GInput` en la fila) · en el mínimo · en el máximo · fuera de rango (error de la aplicación) · advertencia · solo lectura (sin −/+, ↑ no cambia, enfocable) · deshabilitado (campo y −/+ deshabilitados) · con prefijo (×) · con sufijo y su expansión · negativo · `is-rejected` (I2 real, medido en el envío) · `is-ready` (I1 real) · rodando (P2) · tope (P3).

## 8. En una `GFormRow`, tamaños y 320 px

- Con las clases de `GInput` la raíz toma las tres pistas por *subgrid* sin CSS propio: con `GInput`, `GSelect` y dos campos numéricos (una etiqueta partida en dos líneas, otro con ayuda) las cajas comparten `top` (Δ 0,00 px) y altura (36 px) a 1100, 720 y 320 px, en los tres motores.
- `size`, `variant`, `density` y `rounded` como `GInput` (misma tabla de alturas); −/+ siguen la altura (punto 5.5).
- 320 px: ningún campo sale de su marco ni desborda su caja; sin desplazamiento horizontal. Con un número largo y P1, el valor se recorta (desplaza) **antes** que la unidad: «personas» sigue dentro de la caja.
- −/+ ocupan 2 × altura de caja (72 px en `md`): en una fila, un campo con −/+ necesita un mínimo mayor (`--g-form-min` ≈ 30, estimado, hallazgo L8).

## 9. RTL e idiomas

- La caja sigue el orden RTL (valor a la derecha, −/+ a la izquierda: medido), pero el `<input>` lleva **`dir="ltr"`**: sin él, el «-» de «-4,5» se dibuja al final por el algoritmo bidi. El texto se alinea con `text-align: match-parent` (a la derecha en RTL, sin P1).
- Se quitan las marcas bidi de `Intl` del texto del campo (`he` antepone U+200E al «-»; `ar-EG`, U+061C): con `dir="ltr"` sobran y estorban al mover el cursor. Medido: `he` «72.5», `ar-EG` «-٤٫٥».
- Los iconos `minus`/`plus` no se reflejan (no son direccionales).

## 10. `GNumberField` como parte de `GInputGroup`: se reserva

No entra en esta ronda. Motivo: `GInputGroup` acepta hoy cuatro piezas y avisa con cualquier otra (aviso 4); una parte numérica necesita el motor (teclado, formato, valor canónico) **sin** −/+ (una caja fusionada con botones dentro de una parte rompe «un anillo por parte») y su propio contrato de partes. Estructura que se deja fijada para cuando entre: `GInputGroupNumber` = `<input type="text" role="spinbutton">` de parte, con el mismo motor, `aria-labelledby` de parte (§13), hidden con el `name` de la parte, sin −/+, sin P1 (la parte ya mide su contenido con `chars`). Para que no haya rediseño, **el motor numérico debe ser una utilidad compartida** (hallazgo L2). Mientras tanto, la unidad elegible es la receta del caso 3 (número + `GSelect` «Unidad» en la misma fila: dos preguntas, dos etiquetas) o el `GInputGroup` actual con `inputmode`.

## 11. Qué lo hace distinto

Tres propuestas, prototipadas y medidas; las tres sin movimiento con `prefers-reduced-motion: reduce` (medido) y sin tocar el árbol accesible.

**P1 · La unidad va pegada al número.** El ancho del `<input>` sigue al texto (espejo invisible en la misma celda de rejilla) y el sufijo va justo detrás: «72,5 kg» se lee como en papel. Por qué sirve: `GFormRow` hace que cada caja llene su sitio (#171), así que un peso ocupa 200–400 px y, como en `GInput` hoy, «kg» queda al otro extremo de la caja (medido: 389 px del valor) y la vista tiene que saltar para saber en qué unidad escribe. GOV.UK resuelve lo mismo con cajas del ancho del dato; P1 lo consigue sin renunciar a la fila llena. Medido: la distancia valor–sufijo es la misma (8 px, el `gap` de la caja) con 1, 3 o 6 caracteres; pulsar el área vacía de la caja enfoca el campo con el cursor al final; con un número que no cabe, el valor se desplaza y la unidad sigue visible. Solo para `GNumberField` (para `GInput` sería otra decisión).

**P2 · Las cifras ruedan.** Al dar un paso (−/+ o ↑/↓), **solo las cifras que cambian** se deslizan en vertical, hacia arriba al sumar y hacia abajo al restar, como un contador (19 → 20: dos cifras; 20 → 21: una). Por qué sirve: confirma de un vistazo el **sentido** y el **orden de magnitud** del cambio (una decena que pasa, no solo un número distinto), justo en el gesto en que la persona no mira el teclado sino el valor. Es una capa `aria-hidden` sobre el texto: el `<input>` y el árbol tienen el valor nuevo **desde el primer cuadro** (medido). `--g-duration-press` (160 ms) y `--g-ease-out`; ninguna curva nueva (#299). **Al repetir** (botón mantenido o tecla con autorrepetición) no rueda: el valor va al instante, para que la animación nunca se quede atrás del dato (medido: 0 capas al mantener 1 s). Tampoco al escribir, ni si el texto no cabe en la caja. Medido: ≥ 2 posiciones intermedias en los tres motores (8 en Chromium), termina y retira la capa. Nota de medida: `translate` no se aplica a cajas en línea (`display: inline`); las cifras deben ser `inline-block` (la primera versión «animaba» sin moverse y el verificador lo detectó).

**P3 · El tope.** Con el valor en el límite, ↑ (o ↓) hace que el número suba (o baje) medio `--g-space-1` y vuelva, una vez. Por qué sirve: con −/+ el botón deshabilitado ya dice «no hay más»; con el teclado, la pulsación no producía ninguna respuesta y no se sabe si se oyó. Medido: desplazamiento máximo 1,65 px (Chromium) / 1,93 px (WebKit) ≤ `space × 0,5`, vuelve a 0, el valor no cambia; fuera del límite no aparece.

**Reservada · P4, arrastrar para ajustar** (sobre el prefijo o el sufijo, como en las herramientas de diseño). No se prototipa: choca con la selección de texto con el ratón y con el desplazamiento táctil, y su alternativa sin arrastre (2.5.7) ya son −/+ y flechas. Queda anotada para un producto que la pida.

**Descartada · el sufijo que se funde al vaciar:** con P1 el sufijo ya acompaña al hueco del número; ocultarlo vacío quita la pista de unidad justo antes de escribir.

## 12. Hallazgos para lima

| # | Hallazgo | Propuesta |
| --- | --- | --- |
| L1 | **Cómo no duplicar `GInput`** | Recomendado: `GNumberField` **compone `GInput`** (motor numérico + −/+), con dos añadidos **internos** de `GInput`: (a) un hueco no `aria-hidden` al final de la caja para −/+ (el slot `append` es `aria-hidden`); (b) poder registrar el `name` en `GForm` sin ponerlo en el `<input>` visible (punto 6). Así hereda I1, I2, C1–C12 y lo que venga. Alternativa: componente propio con raíz `g-input g-number-field` (como el prototipo), que acopla el CSS de dos componentes |
| L2 | Motor numérico compartido | Una utilidad interna (`numberInput.js` o similar: `loc`, parseo al teclear y al pegar, `format`, rejilla de `step`) para la futura parte de `GInputGroup` (punto 10) |
| L3 | **Props** | `modelValue` (Number, `null`), `min`, `max`, `step` (Number, `1`; > 0), `precision` (Number entero ≥ 0, sin valor = libre), `locale` (String, sin valor = `lang` del ancestro), `grouping` (Boolean, `true` = regla del idioma), `prefix`/`suffix`/`prefixLabel`/`suffixLabel` (#166), `steppers` (Boolean), `decrementLabel`/`incrementLabel` (String, sin valor), y las de campo de `GInput`: `label`, `hint`, `error`, `warning`, `valid`, `required`, `mark`, `readonly`, `disabled`, `size`, `variant`, `density`, `color`, `rounded`, `block`, `id`; `output` si L1 va por composición. **Sin `unit`** (la unidad fija es `suffix`; la elegible, la receta). **Sin `inputmode`** como prop (se deriva de `precision`; `$attrs` puede sobrescribirlo). Sin `type` |
| L4 | Nombre de −/+ | `aria-labelledby` = texto propio oculto + `ID-label` (respeta el slot `label`), no `aria-label` compuesto como en el prototipo |
| L5 | **Eventos** | `update:modelValue` (Number \| `null`). Considerar **`change`** (Number \| `null`) al confirmar: salida con cambio, Enter y cada paso (los pasos no disparan el `change` nativo del `<input>`); si se declara, el `change` nativo deja de llegar por `$attrs` (lección de `emits`) |
| L6 | Slots | `label`, `hint`, `error` (como `GInput`); `prepend` (icono decorativo). **Sin `action`** (choca con −/+ al final de la caja) |
| L7 | **Clases** (bruno ↔ coco) | Raíz `g-number-field` (+ las de `GInput` si L1 va por composición), `--has-steppers`, `__value`, `__mirror`, `__roll`, `__roll-slot`, `__roll-new`, `__roll-old`, `is-rolling` (en `__value`), `__steppers`, `__step`, `__step--decrement`, `__step--increment`. P3 por WAAPI o por una clase de una vez (`is-bumping-up`/`-down`), a elección de bruno/coco |
| L8 | Tokens | **Ninguno nuevo.** −/+ con `--_h` y los mínimos 24/44; separador de −/+ con `--g-border-width` y un color de borde de control; P2 `--g-duration-press` + `--g-ease-out`; P3 `--g-space-1 × 0,5` con la misma duración. Valor de referencia de `--g-form-min` para un campo con −/+ en una fila: ≈ 30 (estimado: 72 px de −/+ más un número de 4–5 cifras; no medido) |
| L9 | Constantes neutras | Repetición 400 ms / 60 ms (como `HOVER_MS`, #187/#308) |
| L10 | `required` | `aria-required`, no el atributo nativo (medida §6: en Chromium el nativo no marca inválido un campo de texto vacío; dato también para el pendiente de extender #270 a `GInput`, `PENDIENTES.md` §2) |
| L11 | Avisos de desarrollo | Sin nombre accesible; `steppers` sin sus dos textos; `min > max`; `step ≤ 0`; `precision` menor que los decimales de `step` (p. ej. `step` 0,25 con `precision` 1); `modelValue` que no es Number ni `null` (una cadena) |
| L12 | Receta de signos vitales (`form.md` §8) | Cuando exista `GNumberField`, Frecuencia, Saturación, Peso y Estatura deberían usarlo en vez de `GInput inputmode` |
| L13 | Personalidad | Si el usuario adopta P1–P3, registrar la decisión (regla del usuario) |
| L14 | Límites para el README | iOS sin «-» en el teclado numérico; `valuemin`/`valuemax` 0 sin límites en Chromium; `readonly` no expuesto en el `spinbutton` de Chromium; Inicio/Fin no saltan a los límites |

## 13. Para otros dueños

- **coco:** la página usa grises de wireframe para −/+ (separador, fondo al pasar y al pulsar) y 1 px de cursor en el espejo: son suyos. `font-variant-numeric: tabular-nums` en el campo, el espejo y la capa de rodillo (el ancho de P1 y la alineación de P2 lo necesitan). `touch-action: manipulation` en −/+. P2/P3 solo con `prefers-reduced-motion: no-preference`; en `forced-colors`, −/+ con borde del sistema (no medido).
- **bruno:** el motor del prototipo (`window.__engine`) es referencia de comportamiento, no de implementación; `beforeinput` no es cancelable durante la composición (IME), por eso el prototipo filtra en `input` y restaura el cursor. Repetición: escuchar `pointerup`/`pointercancel` en `window` y `blur` de la ventana.
- **mora-docs:** los límites de L14.

## 14. Comprobaciones ejecutadas (`verificar.mjs`, 233/233)

`node design/lab/number-field/r01/verificar.mjs` (sirve la raíz del repo en `GRANA_PW_PORT`, por defecto 4209). Chromium 83, Firefox 73, WebKit 77; consola limpia en los tres.

| Bloque | Qué |
| --- | --- |
| Carga y modelo | Formato `es` al cargar («72,5», «12.345», «1234,50»); todos los modelos Number o `null` |
| Árbol | `ariaSnapshot` (3 motores): `spinbutton` con nombre y valor, vacío sin valor, −/+ con nombre y `[disabled]`; atributos (`type=text`, `role`, `inputmode`, `dir`); descripción con la unidad antes de la ayuda. CDP (Chromium): editable, `valuenow`/`valuetext`/límites, recorte de `valuenow` fuera de rango, #270, alternativa `textbox`, solo lectura |
| Teclado | ↑/↓, Shift, Re Pág/Av Pág, Inicio/Fin, filtro de caracteres, fuera de rango sin recorte, entrada al límite, separador convertido, `precision`, texto parcial, segundo separador, vacío → `null`, punto de partida, sin «-», flotantes, rejilla, miles al salir y crudo al entrar, pegar (evento real en Chromium/WebKit; regla en Firefox), `FormData` canónico, Enter confirma |
| −/+ | Sin mover el foco; sin enfocar desde fuera; límites; repetición y parada; activación sin puntero; fuera del Tab; tamaños 24…52 y 44 con puntero grueso (Chromium, WebKit); toque sin enfocar |
| Estados | Solo lectura, deshabilitado, fuera de rango, negativos |
| P1, P2, P3 | Distancias, capa y cuadros, repetición sin rodar, movimiento reducido, tope ≤ 2 px |
| Fila | Δ `top` y altura de cajas a 1100/720/320 |
| RTL | `ar-EG` y `he`: texto, `dir`, posición de −/+, cifras del idioma y latinas |
| Envío | `invalid`, `aria-invalid`, `is-rejected` real en los dos, error de rango de la aplicación, `submit` con valores canónicos |
| 320 | Sin desborde ni desplazamiento horizontal; unidad visible con número largo |

## 15. Qué NO verifiqué

- Lector de pantalla real (VoiceOver, NVDA, TalkBack): cómo se anuncian `spinbutton` editable, `valuetext`, el recorte de `valuenow`, solo lectura sin `readonly` en Chromium, y −/+ fuera del Tab. Ajuste por gestos de VoiceOver iOS sobre el `spinbutton`.
- Móvil y teclados virtuales reales: qué separador ofrece `inputmode="decimal"` por región, la falta de «-» en iOS, que tocar −/+ no abre el teclado en un dispositivo, doble toque sin zoom.
- IME (composición) real; pegado real en Firefox (el sintético llega vacío).
- `forced-colors`, zoom 200/400 %, tipografías distintas de la del tema por defecto para el ancho de P1 y el `--g-form-min` de L8.
- `dirty` de `GForm` tras un paso con −/+ (se llama a `notifyChange`, no se midió el estado).
- Idiomas con agrupación india (`en-IN`: «12,34,567») y `de-CH` (apóstrofo) más allá de la regla de pegado.

## 16. Preguntas de producto realmente abiertas

1. **Personalidad (identidad, decide el usuario):** ¿se adoptan P1 (unidad pegada al número), P2 (cifras que ruedan) y P3 (tope)? Las tres están medidas y no cambian la API. P1 es la que más se nota y la más fácil de defender; P2 y P3 son microinteracciones.

Lo demás deriva de APG *Spinbutton*, WCAG (1.3.1, 2.5.7, 2.5.8, 3.3.1, 4.1.2), GOV.UK y los contratos vigentes (#157, #166, #266, #270, #299, #304).
