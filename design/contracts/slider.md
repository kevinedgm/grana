# Contrato · GSlider

**Dueño:** lima · **Estado:** aprobado (forma **B «El valor es el asa»** por defecto, para valor único y rango: **decisión del usuario del 2026-10-07**; **C «Escalones con datos»** reservada para una segunda entrega y **A «La cinta»** reservada, con sus nombres; el resto deriva de HTML, WAI-ARIA APG *Slider* y *Multi-Thumb Slider*, WCAG 2.2 y los contratos vigentes; **ninguna pregunta de producto abierta**) · **Basado en:** `design/lab/slider/r01/` (kiwi; `brief.md`, `declaracion.md` con 31 decisiones de base, los conceptos A, B y C y los hallazgos L1 a L17; `engine.js` como referencia de comportamiento del motor; `slider.js` con `XSlider`; `verificar.mjs` 228/228 en los tres motores, puerto 4212; commit `301702c`) · **Decisiones:** DECISIONS.md **#445 a #457** (integradas el 2026-10-07; cambios en archivos compartidos aplicados, rastro en `design/contracts/slider.pendientes.md`; tokens en `tokens.md` §38) y **#507 a #509** (remate tras la auditoría de coco, `design/lab/slider/auditoria.md`, 2026-10-08: solo lectura, piso de texto, tokens medidos, reglas de bruno y fórmula del mínimo; **`status: "candidate"`**) · **Convive con:** `form.md` (contexto, `useFormField`, `GFormRow` §4, `GErrorSummary` §7), `number-field.md` (frontera y receta conjunta; mismas reglas de idioma, `change` por gesto y canónico oculto), `radio-group.md` (frontera; foco visible por teclado), `api.md` §«Foco visible en controles que WebKit no marca» (#441, ampliado por #450) y §«Paquete, entradas y tipos» (#442 a #444), `tokens.md` §7.1 (#431, #439) y §29, `icons.md`
**Tag:** `g-slider` · **Categoría:** entradas · **Entrada del paquete:** `@grana/vue/slider` (#455) · **Fase C del plan de v1**
**Componente complejo** (CLAUDE.md, «Modelos por rol»: teclado compuesto de dos asas, motor propio y gestos de puntero propios): **coco y bruno en Opus**.

Un control para **un valor acotado donde manda la posición relativa** (el volumen de los avisos, la intensidad del dolor de 0 a 10, una edad, una dosis aproximada) o **un rango** de dos extremos (el precio mínimo y máximo de un filtro). El asa **es** el valor: una píldora con la cifra dentro, siempre a la vista. El modelo es un `Number` (o `null`, «sin elegir») o, con `range`, un arreglo `[inicio, fin]`; nunca una cadena.

---

## Principios

- **Nativo por dentro, forma propia por fuera** (#446). Cada asa es un `<input type="range" step="any">` nativo, invisible y del tamaño del interior de la píldora: da el rol, el foco y el ajuste de los lectores de pantalla móviles sin simular teclas. La forma la dibuja el componente y el teclado lo resuelve el componente (igual en los tres motores, también en RTL).
- **El valor es el asa** (#452, decisión del usuario): la cifra vive dentro de lo que se arrastra; no hay globo que aparece al arrastrar ni valor que buscar en otro sitio.
- **Grana no valida ni redondea** (#157): un valor de la aplicación fuera de la rejilla o de los límites se conserva; el componente solo decide dónde lo dibuja y adónde va el primer paso.
- **Lo que se envía es canónico** (como `GNumberField`, #311): `<input type="hidden">` por asa con `String(número)`; el nativo no lleva `name`.
- **Sin textos propios** (#226): los nombres de las asas de un rango y el texto de «sin elegir» los da la aplicación en `labels`.
- **Tocar no es desplazar** (base, punto 16): en un móvil solo un toque o un arrastre horizontal cambia el valor; el gesto vertical desplaza la página.

## Cuándo usarlo (frontera)

| Necesidad | Usar | No usar |
| --- | --- | --- |
| Un valor **acotado** donde importa la posición (volumen, intensidad, edad aproximada) | `GSlider` | `GNumberField` (obliga a escribir) |
| Un **rango** de dos extremos (precio mínimo y máximo) | `GSlider range` | Dos `GSlider`; dos `GNumberField` sin relación |
| Una cifra **exacta**, sin límites o con muchos dígitos (peso al gramo, dosis prescrita) | `GNumberField` | `GSlider` |
| Proporción **y** cifra exacta a la vez | `GSlider` + `GNumberField` con el **mismo `v-model`** en una `GFormRow` (receta; medido por kiwi Δ 0) | Un deslizador con un campo propio dentro |
| Hasta ~7 opciones con **nombre propio** (Bajo · Medio · Alto) | `GRadioGroup` (`segmented`, `card`) | `GSlider` con marcas nombradas como sustituto |
| Mostrar una magnitud de **solo lectura** | `GProgress`, `GMetric` | `GSlider readonly` (es un valor editable en otro estado, #266) |
| Rango numérico del editor de un filtro (`between`) | Hoy, el editor de `GFilterBar`; **reservado** adoptar `GSlider range` en su ronda (#457) | — |

---

## Props

| Prop | Tipo | Valores | Default | Origen |
| --- | --- | --- | --- | --- |
| `modelValue` | Number \| null \| [Number, Number] | número finito o `null`; con `range`, dos números finitos | `null` | compartida (`api.md`) |
| `range` | Boolean | | `false` | propia |
| `min` | Number | finito | `0` | propia |
| `max` | Number | finito, > `min` | `100` | propia |
| `step` | Number | > 0 | `1` | propia |
| `bigStep` | Number | múltiplo positivo de `step` | sin valor (una décima del recorrido en pasos enteros, al menos un paso) | propia |
| `minGap` | Number | ≥ 0 | `0` | propia (solo con `range`) |
| `marks` | Boolean \| Array | `true`, o arreglo de `Number` \| `{ value: Number, label?: String }` | `false` | propia |
| `snap` | String | `step` `marks` | `step` | propia |
| `locale` | String | etiqueta BCP 47 | sin valor (ver «Idioma») | compartida (como `GNumberField`, #310) |
| `format` | Object | opciones de `Intl.NumberFormat` | sin valor | propia |
| `valueText` | Function | `(value: number) => string` | sin valor | propia |
| `labels` | Object | `{ start?: String, end?: String, empty?: String }` | sin valores (#226) | propia |
| `name` | String | | sin valor | propia |
| `label` | String | texto libre | sin valor | propia |
| `hint` | String | texto libre | sin valor | propia |
| `error` | String | texto libre | sin valor | propia (form.md C4) |
| `warning` | String | texto libre | sin valor | propia (form.md C5) |
| `valid` | String | texto libre | sin valor | propia (form.md C5) |
| `required` | Boolean | | `false` | propia |
| `mark` | Boolean | | `undefined` | propia (form.md §2) |
| `readonly` | Boolean | | `undefined` → contexto o `false` | compartida |
| `disabled` | Boolean | | `undefined` → contexto o `false` | compartida |
| `density` | String | `default` `comfortable` `compact` | `undefined` → contexto o `default` | compartida |
| `color` | String | `brand` `accent` `neutral` `success` `warning` `danger` `info` | `brand` | compartida (familia de la píldora y del tramo) |
| `id` | String | | generado | propia |

**No existen** (#447): `tooltip`, `showValue`, `thumbLabel` (el valor siempre se ve, dentro del asa), `inverted`, `vertical`, `ticks` (son `marks`), `precision` (los decimales salen de `step`; la presentación, de `format`/`valueText`), `size` y `block` (ver «Reglas»), `inputmode`, `type`. **Reservados con nombre** (#457; no se usan para otra cosa y, si se pasan, avisan): `appearance` (`'steps'` para C, `'tape'` para A), `distribution` y `countText` (C), `pxPerStep` (A), `orientation` (`'vertical'`), `clearable` (volver a «sin elegir»), `size`.

### Reglas de props

- **`modelValue` sin `range`:** `Number` finito o `null` («sin elegir», ver abajo). `undefined` se lee como `null` sin aviso (un `ref()` sin valor inicial). `NaN`, `±Infinity` o un arreglo se leen como `null` con aviso. **Nunca se emite una cadena.**
- **`modelValue` con `range`:** `[inicio, fin]`, dos números finitos. `null`/`undefined` se **dibujan** como `[primer punto, último punto]` (el recorrido entero: «sin restricción») **sin aviso y sin emitir**; un valor mal formado (longitud ≠ 2, no finito, un número suelto) se dibuja igual **con aviso**; un arreglo desordenado (`[2400, 800]`) se dibuja ordenado **con aviso**. El modelo no se toca hasta el primer gesto, que emite ya ordenado. Cada emisión es un **arreglo nuevo** (nunca se muta el de la aplicación). **Un rango no tiene «sin elegir».**
- **`range`** es explícita (como `multiple` en `GCombobox`, #417), no se deduce del tipo del modelo.
- **Fuera de la rejilla** (#157): un valor de la aplicación que no cae en la rejilla se **conserva** y se dibuja en su sitio; el primer paso cae en el punto de la rejilla siguiente **en esa dirección** (`move` del motor). **Fuera de `[min, max]`:** se dibuja en el extremo, el modelo no se toca (el oculto envía el valor real) y se avisa; el primer paso hacia dentro entra al límite. **Una flecha (o Re Pág/Av Pág) hacia fuera sobre un valor que ya está fuera no lo mueve y da el tope** (#508): el valor sigue siendo el de la aplicación y la pulsación se lee como «no hay más en esa dirección»; **Inicio/Fin sí lo llevan al límite** (son «ve al extremo», no «un paso»). `aria-valuetext` dice el valor real (el nativo, que acota su `value`, no).
- **`min`, `max`:** `min ≥ max` avisa y deja el control **sin recorrido**: la píldora en el inicio, ni teclado ni puntero cambian el valor (el modelo no se toca). Un `max` fuera de la rejilla **no se alcanza**: el último punto es el mayor ≤ `max` (como el nativo).
- **`step`:** la rejilla cuenta desde `min` (fijo; nunca desde el límite dinámico de un asa: la rejilla no se mueve, #446). Aritmética sin error de coma flotante (se fija a los decimales de `step` y `min`). Un `step` ≤ 0 o no finito lo rechaza el validador, avisa y se usa `1`.
- **`bigStep`:** Mayús+flecha, Re Pág y Av Pág. Sin valor: una décima del recorrido redondeada a pasos enteros, al menos un paso. Un valor que no es múltiplo positivo de `step` avisa y se usa la regla sin valor. Con `snap="marks"`, el paso grande son **dos marcas**.
- **`minGap`:** distancia mínima entre las dos asas de un rango (`0`: pueden coincidir). Negativo, o mayor que el recorrido, avisa y se usa `0`. Sin `range` se ignora.
- **`marks`:** `true` dibuja una raya por punto de la rejilla si son ≤ 25, si no una por paso grande. Un arreglo dibuja rayas en esos valores y **nombra** las que traen `label`; un número suelto es `{ value }`. Valores fuera de `[min, max]` se ignoran con aviso; valores repetidos avisan (se usa el primero). Los nombres van **bajo el riel**, `aria-hidden`, **alineados con el centro de la píldora** en ese valor (el recorrido se recoge media píldora a cada lado), los extremos ajustados al borde para no salirse; **se pueden pulsar** (dan su valor exacto, aunque no esté en la rejilla: es un valor que la aplicación nombró). Cuando el valor cae en una marca con nombre, el nombre entra en `aria-valuetext` («5, Moderado») salvo con `valueText`.
- **`snap`:** `'marks'` hace de las marcas la rejilla (10 · 25 · 50 · 100 resultados por página): flechas de marca en marca, puntero a la marca más cercana. Sin `marks` en arreglo, avisa y se usa `'step'`.
- **`format`:** se pasa tal cual a `Intl.NumberFormat(locale, format)` (moneda, unidad, decimales mínimos y máximos). Un objeto que `Intl` rechaza avisa y se usa `{}`. **Porcentaje:** `{ style: 'unit', unit: 'percent' }` (el modelo 40 se lee «40 %»); `style: 'percent'` multiplica por 100 (espera fracciones) y, con `max > 1`, avisa (L15).
- **`valueText(value)`:** sustituye **a la vez** el texto de la píldora y `aria-valuetext` (lo que se ve es lo que se oye; p. ej. «3 h 20 min» para minutos). El nombre de la marca ya no se añade (la aplicación decide). Si no devuelve una cadena no vacía, avisa y se usa el texto por defecto.
- **`labels.start` y `labels.end`:** con `range`, el nombre de cada asa se compone con la etiqueta («Precio mínimo», «Precio máximo»). **Sin ellos las dos asas se llamarían igual:** aviso. **`labels.empty`:** el texto de «sin elegir» (a la vista y en `aria-valuetext`); con un valor único `null` y sin él, aviso.
- **`name`:** va a los ocultos y registra el campo en `GForm` (clave de `errors`). Prop (como `GNumberField` y `GSelect`, form.md C10), no atributo; **el nativo no lleva `name`**.
- **`required`:** marca según la convención de `GForm` y nada más: **sin `aria-required`** (no está admitido en el rol `slider`) y **nunca `required` nativo**. Solo tiene sentido con «sin elegir»: lo que la falta bloquea es un `errors[name]` de la aplicación.
- **`readonly`:** `aria-readonly="true"` en cada nativo; enfocable; ni teclado, ni puntero, ni el ajuste del lector cambian el valor; **se envía** (#266, C7). **Se ve como el solo lectura de `GInput`** (#507): píldora con relleno `neutral-soft`, texto `text` y contorno `border-control` en **trazo discontinuo** (≥ 3:1; en `forced-colors` el trazo discontinuo sigue, así que se distingue sin color); sin sombra.
- **`disabled`:** `disabled` en cada nativo (fuera del Tab) y en los ocultos (no se envía).
- **`density`:** el alto del área es el de la **caja de `GInput` `md` con la misma densidad** (así el riel se centra con sus vecinos de fila); con `pointer: coarse`, 44px. **Área y píldora crecen con su texto** (#507): las dos son el mayor entre su medida de `space` por densidad y **una línea de `body-sm` más los dos bordes** (`--_text-box`), como la caja de `GInput`; con `space` pequeño o el texto al 200 % (WCAG 1.4.4) el riel sigue centrado con sus vecinos y el texto cabe en la píldora. Sin `size` en v0.1: un deslizador no tiene texto escrito que escalar y su alto debe coincidir con el de un campo `md`; `size` queda reservado.
- **`color`:** familia de la píldora (`{color}` / `on-{color}`, contorno `{color}-text`) y del tramo (`{color}-text`). Por defecto **`brand`**, como los demás controles de elección (`GCheckbox`, `GSwitch`, `GRadioGroup`, `GDatePicker`, `GStepper`): convención de `api.md`, no decisión estética nueva (el prototipo de kiwi pintó `accent`; `color="accent"` lo reproduce).
- **Sin `block`:** la raíz ocupa el ancho de su contenedor; en una fila se dimensiona con `g-form-w-*` como cualquier campo (receta: `g-form-w-lg`).
- **Atributos** (`inheritAttrs: false`): `class` y `style` a la raíz; `aria-label`/`aria-labelledby` dan el nombre (ver «Estructura»); `aria-describedby` se añade a la descripción de cada nativo; `autofocus` al primer nativo; `form` a cada oculto; el resto (`data-*`, escuchas) a la raíz. Los nombres reservados, si llegan por `$attrs`, avisan y no se aplican.

### Idioma (`locale`)

Exactamente la regla de `GNumberField` (#310): la prop › el `lang` del **ancestro más cercano** (`closest('[lang]')`) › `navigator.language`, leído **al montar** y cuando cambia la prop; un `locale` que `Intl` rechaza avisa y sigue la cadena sin la prop. Se muestran las **cifras del sistema del idioma**; se quitan las marcas bidi de `Intl` (U+200E, U+200F, U+061C) del texto de la píldora y de `aria-valuetext`. Al **teclear la cifra** (B) se aceptan las cifras latinas y las del idioma (arábigo-índicas, persas, devanagari). Límite: un cambio de `lang` de un ancestro tras montar no se observa (pasar `locale` reactivo).

### SSR

Importar y renderizar en el servidor no toca `document`, `window`, `navigator`, `matchMedia` ni `ResizeObserver`. **Con `locale`**, servidor y primer render del cliente escriben el texto formateado (idéntico). **Sin `locale`**, los dos escriben el **canónico** (`String(valor)`) en la píldora, en `aria-valuetext` y en los textos de referencia, y al montar se reformatea con el idioma resuelto. Las posiciones salen de **fracciones** (`--_at`, `--_from`, `--_to`; ver «Clases y datos»), así que el HTML del servidor ya coloca las píldoras; el ancho medido de la píldora (`--_pill-w`) llega al montar, sin transición (nada se anima al montar, #299 (4)). Los ocultos llevan el canónico desde el servidor. README: «en SSR pasa `locale`».

---

## Estructura accesible

Valor único:

```html
<div class="g-slider g-slider--color-brand g-slider--density-default [is-empty] [is-readonly] [is-disabled] [is-invalid|is-warning|is-valid] [is-dragging] [is-jumping]"
     [data-bump="up|down"] style="--_pill-w: 52px">                       <!-- class/style del consumidor a la raíz -->
  <div class="g-slider__head">
    <label class="g-slider__label" id="ID-label" for="ID">Volumen de los avisos<span class="g-slider__optional"> (opcional)</span></label>
    <span class="g-slider__value" aria-hidden="true"><bdi>Sin elegir</bdi></span>   <!-- SOLO con is-empty -->
  </div>
  <div class="g-slider__row">
    <div class="g-slider__area">                                         <!-- touch-action: pan-y; escuchas de puntero -->
      <span class="g-slider__track"></span>
      <span class="g-slider__fill" style="--_from: 0; --_to: 0.4"></span>     <!-- sin is-empty -->
      <span class="g-slider__thumb" data-thumb="0" style="--_at: 0.4" [class="is-typing"]>
        <span class="g-slider__pill" aria-hidden="true">                  <!-- celda única: texto visible + referencias apiladas -->
          <span class="g-slider__pill-text" dir="auto">40 %</span>
          <span class="g-slider__pill-ref"><span>0 %</span><span>100 %</span><span>50 %</span></span>
        </span>
        <input class="g-slider__native" type="range" step="any" id="ID" min="0" max="100" value="40"
               aria-valuetext="40 %" aria-describedby="ID-hint ID-message"
               [aria-invalid="true"] [aria-readonly="true"] [disabled]>   <!-- SIN name; opacity 0; tamaño del interior de la píldora -->
      </span>
    </div>
    <div class="g-slider__marks" aria-hidden="true">                      <!-- solo con marks -->
      <span class="g-slider__mark has-label" data-value="0" style="--_at: 0"><span class="g-slider__mark-label">Silencio</span></span>
      …
    </div>
    <input type="hidden" name="volumen" value="40" [disabled] [form]>
  </div>
  <div class="g-slider__support">
    <p class="g-slider__hint" id="ID-hint">…</p>
    <div class="g-slider__message" id="ID-message" aria-live="polite">  <!-- siempre presente -->
      [GLibIcon circle-alert | triangle-alert | circle-check] <span class="g-slider__sr">Error:</span> Texto
    </div>
  </div>
</div>
```

Rango (lo que cambia):

```html
<div class="g-slider g-slider--range … [is-merged]" style="--_pill-w: 64px; [--_mid: 0.5]">
  <div class="g-slider__head"><span class="g-slider__label" id="ID-label">Precio</span></div>   <!-- span, no label -->
  <div class="g-slider__row" role="group" aria-labelledby="ID-label">
    <div class="g-slider__area">
      <span class="g-slider__track"></span>
      <span class="g-slider__fill" style="--_from: 0.16; --_to: 0.48"></span>
      <span class="g-slider__thumb" data-thumb="0" style="--_at: 0.16">
        <span class="g-slider__pill" aria-hidden="true">…$800…</span>
        <input class="g-slider__native" type="range" step="any" id="ID" min="0" max="2400"
               aria-labelledby="ID-label ID-n0" aria-valuetext="$800" aria-describedby="…">
        <span class="g-slider__thumb-name" id="ID-n0" hidden>mínimo</span>
      </span>
      <span class="g-slider__thumb" data-thumb="1" style="--_at: 0.48">
        <span class="g-slider__pill" aria-hidden="true">…$2,400…</span>
        <input class="g-slider__native" type="range" step="any" id="ID-end" min="800" max="5000"
               aria-labelledby="ID-label ID-n1" aria-valuetext="$2,400" aria-describedby="…">
        <span class="g-slider__thumb-name" id="ID-n1" hidden>máximo</span>
      </span>
    </div>
    <input type="hidden" name="precio" value="800"><input type="hidden" name="precio" value="2400">
  </div>
  …
</div>
```

- **Tres hijos en flujo** (cabecera · fila · pie), como `GInput` (C10/C12): en una `GFormRow`, tres pistas por subgrid; el centro del riel coincide con el centro de la caja de sus vecinos (medido por kiwi Δ ≤ 1px a 1100 y 720px).
- **Nativo por asa** (#446): `type="range"`, **`step="any"`** (la rejilla es del componente), `min`/`max` = **los límites de esa asa** (en un rango, el inicio llega hasta `fin − minGap` y el fin baja hasta `inicio + minGap`: así `aria-valuemin`/`aria-valuemax` dicen lo que APG pide), `value` = el valor dibujado (con «sin elegir», el punto medio). `opacity: 0`, `pointer-events: none`, del tamaño del **interior de la píldora** (no 1px: el foco de VoiceOver y la exploración táctil dibujan el asa). **Sin `name`.**
- **`aria-valuetext` siempre**: el formato del idioma y, en una marca con nombre, «5, Moderado»; con `valueText`, lo suyo; sin elegir, `labels.empty`.
- **Nombre:** valor único, `<label for="ID">`; rango, `role="group"` con `aria-labelledby="ID-label"` y cada asa con `aria-labelledby="ID-label ID-n0|1"` (los textos ocultos llevan `labels.start`/`labels.end`; referenciar un nodo `hidden` es válido). Sin etiqueta visible: con `aria-labelledby` del consumidor, el grupo (o el nativo único) lo lleva tal cual y cada asa `"{sus ids} ID-n0|1"`; con `aria-label`, el grupo lo lleva y cada asa `aria-label="{aria-label} {labels.start|end}"`. Pulsar la etiqueta de un rango enfoca el inicio (lo que `<label for>` hace con el valor único).
- **Descripción:** `aria-describedby` = `ID-hint` · los del consumidor · `ID-message`, en cada nativo. `aria-invalid="true"` en cada nativo con error. **Sin `aria-required`.**
- **La píldora es `aria-hidden`**: el nativo ya anuncia el valor. **Sin región viva** para el valor (no se repite en cada paso).
- **Ocultos:** uno por asa con el canónico (`String(número)`; `""` sin elegir), en orden inicio, fin con **el mismo `name`** (`FormData.getAll('precio')` → `['800', '2400']`; L8); `disabled` con el campo; presentes en `readonly`; `form` copiado. Medido por kiwi: `volumen="40" precio="800" precio="2400"`, sin el deshabilitado.
- **Mensaje:** región `g-slider__message` siempre presente con `aria-live` de `GForm`; icono `GLibIcon` por tipo (`circle-alert` error, `triangle-alert` advertencia, `circle-check` válido; `icons.md`) y prefijo oculto de `GForm` (`labels.error`…), como `GInput`.

### «Sin elegir» (valor único `null`)

Para **escalas y encuestas**: una píldora en el 5 por defecto ancla la respuesta y se envía sin que nadie la haya elegido (base, punto 9).

- **Sin píldora ni tramo**; el riel en **trazos** `border-control`, que **pasan a `danger-text` con error** (#507: sin píldora, es la única señal del error en el propio control además del mensaje; ≥ 4,5:1, medido); `labels.empty` a la vista en la cabecera (`g-slider__value`, `aria-hidden`, solo en este estado) y en `aria-valuetext`.
- El nativo **cubre todo el riel** (el lector lo encuentra y el toque llega a él).
- **El primer toque o clic** pone el valor en ese punto (aparece en su sitio, sin deslizarse). **Teclado desde vacío:** una tecla que sube (↑, → en LTR, ← en RTL, Re Pág) da el **primer punto**; una que baja da el **último**; Inicio y Fin, los extremos (como el arco de `GTimeField`).
- Enviar sin elegir con un `errors[name]` de la aplicación: bloquea, el resumen enlaza al asa, ↑ da el mínimo y el error se va (medido por kiwi).
- Volver a «sin elegir» desde la interfaz **no existe** en v0.1 (`clearable` reservado, #457); la aplicación puede poner `null`.

## Eventos

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `update:modelValue` | `Number \| null`, o `[Number, Number]` con `range` | **Cada cambio** del valor: cada paso de teclado (también al repetir), cada movimiento de puntero que cambia de punto, cada confirmación de la cifra tecleada, cada ajuste del lector |
| `change` | El mismo tipo | **Una vez por gesto** que cambió el valor (#448): al soltar la tecla (`keyup`), al soltar el puntero (`pointerup`, `pointercancel`, `lostpointercapture`), al confirmar la cifra tecleada, por cada ajuste del lector (`input` del nativo), y al perder el foco con un gesto abierto. Nunca por cada paso repetido. Sin cambio, ninguno |

- **`change` se declara en `emits`** (lección de `emits`): la escucha `@change` del consumidor recibe el valor y no llega a ningún nativo.
- **Los eventos `input` y `change` del nativo** (solo los produce el ajuste de un lector; el teclado se anula con `preventDefault` y el puntero no toca el nativo) **se consumen** y no burbujean: serían incoherentes (unos gestos los dan y otros no). Límite para el README: un `<form @change>` de la aplicación no ve el deslizador; usar `@change` del componente o el `dirty` de `GForm`.
- Un cambio de `modelValue` desde la aplicación **no** emite nada.
- **Medido por kiwi:** nueve pulsaciones con cambio = nueve `change`; un arrastre de seis pasos = uno.

## Slots

| Slot | Propósito | Anatomía que debe conservar |
| --- | --- | --- |
| `label` | Etiqueta con contenido rico | Dentro del `<label for>` (o del `span` con `id` en un rango), sin interactivos |
| `hint` | Ayuda con contenido rico | Conserva `ID-hint` |
| `error` | Error con contenido rico | Dentro de la región `g-slider__message` |

**Sin slot de la píldora ni de las marcas:** el texto de la píldora es un dato (`format`, `valueText`) y su ancho se mide de textos de referencia; un contenido arbitrario rompería el ancho fijo. Sin `prepend`/`append`.

---

## Integración con `GForm`

- **`useFormField`** con `name`, `id`, `error`, `warning`, `valid`, `required`, `mark`, `readonly`, `disabled`, `density`, **`trigger: 'change'`** (es un control de elección: el error se revela al cambiar, como `GSelect` y `GRadioGroup`, `form.md` §1 «Momento de los errores»), `control` = **el primer nativo** y `root` = la raíz.
- **Un gesto que cambia el valor es un cambio** (#448): `notifyChange()` **al acabar el gesto** (el mismo momento que `change`), nunca `notifyInput` (no hay escritura que «castigar tarde»). Retira `is-rejected` (I2) del campo. `focusout` de la raíz → `handlers.onFocusout`.
- **`GErrorSummary`** enlaza a `#ID` (el primer nativo, también en un rango); `revealAndFocus` desplaza la raíz y enfoca el asa; con la regla de #450 el anillo aparece (Intro en el enlace es una tecla).
- **`GFormRow`:** admitido como hijo de una fila con más de un hijo (tres hijos, como `GInput`); publica su **mínimo intrínseco** (#453, abajo).
- **`GFormReveal` / `GFormSection` plegada:** sin regla propia (`inert` y `fieldset disabled` deshabilitan nativos y ocultos).
- **`GDialog`:** el primer nativo recibe `[autofocus]` del consumidor; el orden de foco inicial es el de #292.

## Teclado (#449; APG *Slider* y *Multi-Thumb Slider*)

| Tecla | Acción |
| --- | --- |
| → / ↑ | + `step` (con `snap="marks"`, la marca siguiente) |
| ← / ↓ | − `step` |
| ← / → en RTL | **Siguen la dirección visual**: ← sube, → baja; ↑/↓ no cambian. Resuelve la discrepancia del nativo (→ baja en Chromium y Firefox y sube en WebKit, medido) |
| Mayús + flecha, Re Pág / Av Pág | ± `bigStep` (con marcas, dos marcas) |
| Inicio / Fin | Los **límites del asa** (en un rango, el inicio llega hasta `fin − minGap`) |
| En un límite | Nada cambia; **tope** si la pulsación no es autorrepetición (#452) |
| Valor **fuera** de `[min, max]` (de la aplicación) | Flecha, Re Pág o Av Pág **hacia fuera**: el valor no cambia y da el **tope** (si no es autorrepetición); **hacia dentro**: entra al límite. **Inicio/Fin**: llevan al límite del asa (#508) |
| Cifras, separador, «-» (B) | **Teclear la cifra** (abajo) |
| Tab / Mayús+Tab | Una parada por asa, en orden inicio → fin sea cual sea su posición |
| Rueda | Nada (desplaza la página) |
| Alt/Ctrl/Meta + tecla | No se interceptan |

**Medido por kiwi en los tres motores:** → ↑ ← Mayús+→ Re Pág Av Pág ↓ Inicio Fin → = 45 50 45 55 65 55 50 0 100 100.

### Teclear la cifra (B)

Con el foco en una píldora y sin `readonly`:

- Una **cifra** (latina o del idioma) empieza o sigue una cifra tecleada; un **separador** («.», «,» o el del idioma) entra una vez y solo si `step` o `min` tienen decimales; **«-»** solo como primer carácter y solo con `min < 0`; Retroceso borra el último. No se aceptan más caracteres que los del límite más largo formateado sin miles (más los decimales de `step`).
- Mientras se teclea, la píldora **se vuelve campo** (`is-typing` en la píldora: superficie, texto y un cursor fijo) y muestra lo tecleado; `aria-valuetext` **no cambia** hasta confirmar.
- **Confirma:** Intro, una pausa de **`TYPE_MS` = 900ms** (constante neutra de JS), cualquier otra tecla (que luego actúa: una flecha confirma y da su paso) o perder el foco. **Esc** anula sin cambiar. Al confirmar, el número va al **punto de la rejilla más cercano dentro de los límites del asa**; si lo tecleado queda fuera, va al límite con el **tope**. Una confirmación es un gesto: un `change` si cambió.
- Con Alt, Ctrl o Meta no se intercepta nada; durante una composición (`isComposing`) tampoco.
- Es un **extra de precisión** que no se descubre solo: no es la vía accesible (con lector, el teclado de la tabla). Límite para el README.

## Puntero y táctil (#449)

- **Constante `TAP` = 10px** (neutra de JS): por debajo, un toque; por encima, un gesto.
- **Ratón y lápiz sobre el riel:** el asa **más cercana** al punto va ahí (se desliza, `is-jumping`, con `--g-duration-press` + `--g-ease-out`; desde «sin elegir» aparece en su sitio) y el arrastre sigue. **Sobre una píldora:** el arrastre empieza en el acto (sin salto). **Sobre el nombre de una marca:** su valor exacto.
- **Táctil sobre la píldora:** el arrastre empieza en el acto. **Táctil sobre el riel:** el valor salta **solo con un toque** (movimiento ≤ `TAP`); un gesto vertical **desplaza la página** (`touch-action: pan-y`; el componente abandona el gesto); uno horizontal > `TAP` empieza a arrastrar el asa más cercana. Medido por kiwi: un gesto vertical sobre el riel no cambia el 40; un toque lo lleva al 20.
- **Asas juntas** (mismo valor, rango): un puntero que las agarra mueve **la que pide la dirección del primer movimiento** (> 2px; hacia arriba, el fin; hacia abajo, el inicio). Fuera del empate, la más cercana; con distancias iguales y valores distintos, la del lado pulsado. **Una pulsación sobre el riel** (clic o toque, sin movimiento) **con las dos asas juntas mueve la del lado pulsado** (#508): si el punto pulsado queda por encima del valor del par, el fin; por debajo, el inicio (por **valor**, así que en RTL el inicio queda a la derecha del par sin regla aparte). Es un gesto de un toque, sin esperar a que el puntero se mueva.
- **El tramo se arrastra entero** (B, rango sin fundir): sobre el tramo entre las dos píldoras, el gesto **queda en suspenso** hasta `TAP` (con cualquier puntero): si se suelta antes, es un **toque** y el asa más cercana va a ese punto (alternativa de un solo puntero sin arrastre, **WCAG 2.5.7**: así se puede estrechar un rango sin arrastrar); si se mueve en horizontal más de `TAP`, **mueven las dos asas conservando la anchura** (medido por kiwi: 1600 antes y después), acotado al recorrido; en táctil, un gesto vertical desplaza la página. **Corrige el prototipo** (allí el tramo arrastraba en el acto y el toque no hacía nada).
- **Foco:** al pulsar, el foco va al asa que se mueve, con `preventScroll`; `mousedown` se anula en el área (el foco no salta al cuerpo) **sin** anular `pointerdown`. Captura del puntero en el área. `is-dragging` en la raíz mientras dura un gesto de puntero que mueve.
- **Áreas:** píldora `max(24px, space × 7 × densidad, texto)` de alto (**por densidad**, #507: sin ello, en `compact` la píldora sería más alta que el área; «texto» = una línea de `body-sm` + los bordes); área de toque ≥ **44 × 24** (≥ 44 × 44 con `pointer: coarse`); tramo agarrable con zona de ≥ 24px de alto (44px gruesa); alto del área = caja de `GInput` `md` con su densidad y su texto (44px gruesa).
- **Solo lectura:** pulsar enfoca el asa y no cambia nada. **Deshabilitado:** nada.
- **WCAG 2.5.7:** todo lo que se arrastra tiene un gesto de un toque (riel, marca, tramo) y teclado.

---

## Personalidad: B «El valor es el asa» (DECISIONS.md #452; decisión del usuario del 2026-10-07)

Lo que el usuario vio y eligió en `design/lab/slider/r01/index.html?v=B`, con su mecánica fijada. Nada de esto toca el árbol accesible; **con `prefers-reduced-motion: reduce` nada se desplaza** (#299 (3)): la píldora aparece en su sitio, sin tope, y la fusión cambia de forma sin transición. **Ninguna curva nueva ni uso nuevo de `--g-ease-spring`/`--g-ease-bounce`** (#299 (1)).

### B1 · La cifra vive en el asa

- La píldora lleva el **texto del valor** (`format` o `valueText`) en `--g-text-body-sm-*` con `--g-text-action-weight` y **`tabular-nums`**, `dir="auto"`/`unicode-bidi: plaintext` («24 a», no «a 24», en RTL).
- **Ancho fijo:** el de su **texto más ancho de referencia**: el primer punto, el último, el punto medio de la rejilla, `−|último|` si `min < 0` y cada marca del arreglo, con `format` o `valueText`, **más el texto actual** (por si `valueText` da uno más largo). Se consigue apilando esos textos invisibles en la misma celda de la píldora (`g-slider__pill-ref`, `visibility: hidden`), sin JS para el ancho; las dos píldoras de un rango se igualan a la más ancha con `--_pill-w` (medido por el `.vue`). Medido por kiwi: igual a 0 %, 40 % y 100 %; no baila.
- **El recorrido se recoge media píldora a cada lado:** el centro de la píldora va de `pill-w/2` a `ancho − pill-w/2`; nunca se sale del riel. Las marcas se alinean con ese mismo centro.

### B2 · Las píldoras se funden en vez de montarse (rango)

- Cuando los centros quedan a menos de un ancho de píldora, la raíz recibe **`is-merged`** y las dos se colocan **juntas** en una cápsula «18 a | 24 a» centrada en el punto medio de sus centros (`--_mid`, acotado para que la cápsula no se salga): esquinas interiores a 0 y una raya `on-{color}` entre las dos mitades. **Cada mitad sigue siendo su asa** (foco, nombre, teclado, arrastre). Vuelven a ser dos al separarse. Medido por kiwi: sin solape (Δ ≤ 1px entre bordes).
- El cambio de esquinas va con `--g-duration-press` + `--g-ease-out` (forma, no desplazamiento).

### B3 · El tramo se arrastra entero

Ver «Puntero y táctil»: «el mismo margen de precio, un poco más caro» es un gesto, no dos. Con el toque como alternativa de 2.5.7.

### B4 · Se teclea la cifra

Ver «Teclear la cifra»: «3 5» e Intro lleva al 35 sin un segundo control.

### B5 · El tope

- Una pulsación **no repetida** que no cambia el valor por estar en el límite (flecha, Re Pág/Av Pág, Inicio/Fin ya en él, o una flecha hacia fuera sobre un valor ya fuera de `[min, max]`, #508), o una cifra tecleada fuera de los límites, hace que **el asa enfocada** (píldora y anillo juntos, #507) se desplace **`--g-space-1 × 0.5`** en esa dirección (inline, siguiendo la dirección de la página) y vuelva, una vez. El valor no cambia.
- **Mecánica** (como P3 de `GNumberField`, #313): la raíz recibe **`data-bump="up|down"`**; coco anima el **asa** del nativo enfocado (no la píldora sola: el anillo debe acompañarla) con keyframes **`g-slider-bump…`** (`--g-duration-press`, `--g-ease-out`, solo con `no-preference`); bruno quita el dato en `animationend`/`animationcancel` cuyo nombre empieza por `g-slider-bump`, **o en el acto** si en el cuadro siguiente la píldora no tiene animación calculada (movimiento reducido o sin CSS). Una pulsación nueva lo quita y lo vuelve a poner en el cuadro siguiente. En `readonly` no hay tope.

### B6 · El salto se desliza

Un clic o toque en el riel (o en una marca) desliza la píldora y el tramo hasta el punto con `--g-duration-press` + `--g-ease-out` (`is-jumping`, que el `.vue` quita en `transitionend` o al empezar a arrastrar). Arrastrar, teclear y el teclado **no** se deslizan (el valor va con el dedo o la tecla). Desde «sin elegir» la píldora aparece en su sitio.

### B7 · Lo que se agarra se levanta (#507; coco, medido en la auditoría)

Mientras dura el arrastre (`is-dragging`), la píldora enfocada pasa a `{color}-strong` **y a `--g-shadow-2`** (la sombra de un elemento elevado), con un fundido de `--g-duration-fast` + `--g-ease-standard`. Es **color y sombra, no desplazamiento**: con `prefers-reduced-motion: reduce` sigue igual (#299 (3)). Sin sombra en `readonly`, deshabilitado ni tecleando.

### Qué lo hace distinto (regla del usuario)

- **El valor es el asa:** la cifra está donde se mira y donde se toca, del ancho de su texto más largo; ni globo, ni valor bajo el dedo.
- **Las asas se funden en vez de montarse**, y la dirección del gesto decide cuál se mueve cuando coinciden: se acabó adivinar qué asa se agarró.
- **El tramo se mueve entero**, sin perder el toque que estrecha el rango.
- **Se teclea la cifra**: precisión sin un segundo campo.
- **Tocar no es desplazar**: en el móvil, el gesto vertical desplaza la página.
- **«Sin elegir» de verdad**: una escala de dolor no empieza en 5.
- **Nativo por dentro**: el ajuste de los lectores móviles funciona sin simular teclas y el teclado es igual en los tres motores.

### Fuera (reservado, #457)

- **C · «Escalones con datos»** → `appearance="steps"` con `distribution` (conteos por tramo) y `countText(n, total)` (la consecuencia, «281 de 480 productos», a la vista y en `aria-valuetext`); `profile="rise"` para una escala sin datos. **Segunda entrega**, con contrato propio antes de construirse.
- **A · «La cinta»** → `appearance="tape"` con `pxPerStep` y ajuste fino; solo valor único. Solo si un producto la pide.
- Con `appearance`, el valor por defecto será `'pill'` (B); hoy la prop no existe.

---

## Foco visible (#450, amplía #441)

- **El anillo no puede venir de `:focus-visible`:** medido por kiwi en **los tres motores**, el nativo enfocado por el componente tras un clic **sí** casa con `:focus-visible`, así que el anillo saldría al hacer clic.
- **Regla de modalidad** (`utils/keyFocus.js`, #450): el `.vue` escribe **`data-g-key-focus`** en el nativo (1) en su `focus` si la **última entrada fue una tecla** que no es modificador (Tab, flechas, **también Intro** en el enlace de `GErrorSummary`), y (2) en su `keydown` con cualquier tecla que no es modificador (tras un clic, la primera flecha pinta el anillo); lo quita en `blur` y con cualquier `pointerdown`.
- **CSS (coco):** el anillo se dibuja **solo** con la marca, en la **píldora**: `.g-slider__thumb:has(> .g-slider__native:where([data-g-key-focus]):focus)` (sin `:focus-visible`), `outline: var(--g-focus-width) solid var(--g-color-focus)`, `outline-offset: var(--g-focus-offset)`. En `forced-colors`, `Highlight`.
- Medido por kiwi: sin anillo tras el clic; con anillo al pulsar →, al llegar con Tab (Opción+Tab en WebKit) y con Intro en el resumen.

## Safari y Tab (#451)

WebKit (como Safari sin «Pulsar Tab para resaltar cada elemento») **salta el range con Tab**, igual que casillas, radios y botones; Opción+Tab llega. **No se fuerza `tabindex="0"`**: Grana sigue la preferencia del sistema como en `GCheckbox`, `GRadioGroup` y `GBtn`. README: «en Safari, Opción+Tab, o activa la preferencia».

## RTL e idiomas

- El riel sigue la dirección de la página: el mínimo en el **inicio lógico** (a la derecha en RTL; medido por kiwi el 40 % a 40 % desde la derecha); posiciones con propiedades lógicas; las marcas y los extremos, igual.
- ← / → siguen la dirección visual (tabla de teclado); el tope se desplaza hacia el lado visual de la dirección.
- La píldora, los nombres de marcas y las referencias con `unicode-bidi: plaintext`; el «sin elegir» en `<bdi>`.
- Sin iconos direccionales.
- 320px sin desbordamiento en LTR y RTL (medido por kiwi, también B en RTL).

## Mínimo en una `GFormRow` (#453)

El deslizador **publica su mínimo intrínseco** a la fila con `setIntrinsicMin(raíz, px)` (#271) cuando el sub‑contexto lo provee:

- **Mínimo (px)** = el mayor entre **`space × 40`**, **la píldora** (`3 × --_pill-w` con valor único; `4 × --_pill-w` con `range`: dos píldoras separadas y recorrido para moverlas) y **las marcas con nombre** (fórmula por pares de nombres vecinos, abajo). Redondeado hacia arriba.
- **Marcas con nombre: por pares vecinos, no por suma** (#509; corrige la fórmula original de #453, hallazgo 3 de la auditoría). Sumar los anchos supone nombres seguidos, pero cada nombre va **centrado en el centro de su píldora** (`x(f) = pill-w/2 + f · (ancho − pill-w)`) y solo los de los extremos van **pegados al borde** cuando no caben centrados; el hueco entre un extremo ancho y el del medio es menor que el que da la suma (medido: 2,8px con el tema por defecto en lugar de 8; −0,1px con el de la auditoría y −2,1px con el texto al 200 %, es decir, se tocan o se solapan). Para cada par de nombres contiguos por valor *(i, j)*, con fracciones `fᵢ < fⱼ` (`f = (valor − min) / (max − min)`), el ancho del área debe cumplir
  `ancho ≥ pill-w + (derᵢ − izqⱼ + gap) / (fⱼ − fᵢ)`, con `gap = space × 2`,
  donde `izq` y `der` son los **bordes del nombre medidos desde su punto de anclaje** (el centro de la píldora en ese valor), con signo: `izq` negativo hacia el inicio, `der` positivo hacia el final. Centrado: `izq = −w/2`, `der = +w/2`. **Primer nombre** (`f = 0`) si `w > pill-w`: pegado al inicio, `izq = −pill-w/2`, `der = w − pill-w/2` (si `w ≤ pill-w` cabe centrado). **Último nombre** (`f = 1`) si `w > pill-w`: pegado al final, `der = +pill-w/2`, `izq = −(w − pill-w/2)`. Los intermedios, centrados. El mínimo de las marcas es el **mayor** de los pares. Caso habitual (0, ½, 1) con extremos pegados: `medio + 2 × max(primero, último) + 2 × gap` (323,8px en lugar de 303,8px con el texto al 200 % en la referencia de coco). Una marca sin nombre no cuenta; dos marcas con nombre en el mismo valor se tratan como una (se usa la primera, como en «Reglas de props»).
  Si un intermedio queda a menos de la mitad de su ancho del borde, el CSS lo ajusta a él y su `izq`/`der` dependen del ancho: bruno lo resuelve **por posiciones** (como el campo de hora, #410), tomando el menor ancho que cumple todos los pares (la separación crece con el ancho, así que vale avanzar o bisecar) en lugar de despejar la fórmula.
- **Cuándo:** al montar, al cargar las fuentes, cuando cambian `min`, `max`, `step`, `marks`, `format`, `valueText`, `locale`, `range` o `density`, y con un `ResizeObserver` sobre una píldora y las marcas; publica solo si cambia ≥ 0,5px y retira con `0` al desmontar.
- **Mínimo efectivo** (form.md §4) = el mayor entre el de su clase `g-form-w-*`, `--g-form-min` × `space` y este. Receta: **`g-form-w-lg`**. Valor de referencia (no normativo; coco lo mide en `estilo.md` y mora-docs lo lleva al README): «Sin dolor · Moderado · El peor» ≈ 144px por las marcas (kiwi, base).
- **Fuera de una fila:** nada; la raíz ocupa el ancho de su contenedor (a la aplicación le toca no dejarla por debajo de su mínimo; límite para el README, con los nombres de marcas pocos y cortos).
- **Límite del contenedor** (auditoría, hallazgo 3): con el texto al 200 % en una fila de 320px el contenedor no llega al mínimo (−10,9px con el tema por defecto; −32,8px con el de la auditoría): ningún componente puede crecer más que su contenedor, como el 12 h de `GTimeField`. Los nombres son `aria-hidden` (el de la marca va en `aria-valuetext`), por eso no bloquea la lectura; README: pocos nombres y cortos, y `g-form-w-lg`.

---

## Tokens consumidos (#454)

**Tokens nuevos: ninguno** (`tokens.md` §17.6: ningún existente se queda corto; registro en `tokens.md` §38). Lo de la etiqueta, la ayuda, el mensaje y sus iconos es lo de `GInput`.

| Token | Para qué |
| --- | --- |
| `--g-color-{color}` / `--g-color-on-{color}` | **Píldora:** relleno y texto (par ≥ 4.5:1 garantizado por el motor) |
| `--g-color-{color}-text` | **Contorno de la píldora** (§7.1: control con relleno de familia, ≥ 3:1 contra la superficie) y **tramo** (forma de familia sin par, #439: entero en `-text`; **grosor × 1,5 el del riel**, abajo) |
| `--g-color-{color}-strong` | Píldora al pasar (`@media (hover: hover)`) y mientras se arrastra; el contorno sigue en `-text` (#438) |
| `--g-color-on-{color}` | Raya entre las dos mitades de la cápsula fundida (B2) |
| `--g-color-border-control` | **Riel** (≥ 3:1: delimita el control), sus trazos en «sin elegir» y, en `readonly`, el **contorno discontinuo** de la píldora y la raya de la cápsula (#507; antes `border-strong`, ≈ 1,5:1) |
| `--g-color-border-strong` | Rayas de las marcas; tramo deshabilitado |
| `--g-color-border` | Riel y contorno de la píldora deshabilitados |
| `--g-color-surface` / `--g-color-text` | Píldora **tecleando** (`is-typing`: se vuelve campo; contorno `{color}-text`) |
| `--g-color-neutral-soft` / `--g-color-text` | Píldora en **`readonly`** (#507): relleno y texto, como el solo lectura de `GInput` |
| `--g-color-surface-sunken` / `--g-color-text-subtle` | Píldora deshabilitada; etiqueta y nombres deshabilitados |
| `--g-color-text-muted` | Nombres de las marcas, «sin elegir», tramo en `readonly` |
| `--g-color-danger-text` | Contorno de la píldora con error (además del mensaje con icono) y **trazos del riel de «sin elegir» con error** (#507) |
| `--g-shadow-1` | Sombra de la píldora en reposo (sin ella en `readonly`, deshabilitado y tecleando) |
| `--g-shadow-2` | Píldora **mientras se arrastra** (B7, #507): color y sombra, sin desplazamiento; sigue con movimiento reducido |
| `--g-radius-pill` | Píldora, riel y tramo |
| `--g-space-1` | Alto del área (`× 9`, la caja `md` de `GInput` con su densidad y su piso de texto), alto de la píldora (`× 7` por densidad, con el mismo piso; #507), relleno en línea de la píldora (`× 3`), grosor del riel (`× 1`) y del **tramo (`× 1,5`, #507: `{color}-text` y `border-control` quedan entre sí a 1,04–1,9:1, así que el grosor los separa sin depender del color, WCAG 1.4.1)**, rayas de marca (`× 1.5`), separación de los nombres (`× 2`), tope (`× 0.5`, §29.6), mínimo en fila (`× 40`, `× 2`) |
| `--g-border-width` | Contorno de la píldora, raya de la cápsula, rayas de marca, cursor de la píldora tecleando (`× 2`) |
| `--g-text-body-sm-*`, `--g-text-action-weight` | Texto de la píldora y de la etiqueta (la de `GInput`); `--g-text-body-sm-line` + `2 × --g-border-width` es el **piso de texto** de área y píldora (`--_text-box`, #507) |
| `--g-text-caption-*` | Nombres de las marcas, ayuda y mensaje |
| `--g-focus-width`, `--g-color-focus`, `--g-focus-offset` | Anillo en la píldora (solo con `data-g-key-focus`) |
| `--g-duration-press`, `--g-ease-out` | Salto (B6), esquinas de la fusión (B2), tope (B5) |
| `--g-duration-fast`, `--g-ease-standard` | Color, fondo y sombra de la píldora (hover, arrastre, tecleando) |

**Contraste de lo marcado** (§7.1, «Componente nuevo»): la píldora es un **relleno de familia con par** que identifica el control y su valor → contorno `{color}-text`; el tramo es la **forma sin par** que dice el valor → entero `{color}-text` (≥ 3:1 contra `surface`, `bg` y `surface-sunken`); el riel `border-control` ≥ 3:1. coco mide en el tema por defecto, lustre, spotify y un tema con clave `primary` propia (#107), claro y oscuro. En el tema por defecto, Δ0 frente al prototipo salvo la familia (`brand` en vez de `accent`).

**No son tokens** (§7, §29.6): `TAP` 10px, `TYPE_MS` 900ms y el umbral de 2px del empate (constantes de JS, como `HOVER_MS`, #187); `0.5` del tope (§29.6); `24px`/`44px` (área táctil, §7); `--_pill-w` y el mínimo publicado (px medidos por el `.vue`); las fracciones `--_at`, `--_from`, `--_to`, `--_mid` (datos del `.vue` al CSS, §29.5).

## Clases y datos (contrato bruno ↔ coco)

| Clase / dato | Elemento | Cuándo |
| --- | --- | --- |
| `g-slider` | Raíz | Siempre |
| `g-slider--color-{color}` | Raíz | Siempre (`brand` por defecto) |
| `g-slider--range` | Raíz | Con `range` |
| `is-empty` | Raíz | Valor único `null` |
| `g-slider--density-{default\|comfortable\|compact}` | Raíz | Siempre (densidad resuelta con el contexto; alto del área y de la píldora, #507) |
| `is-readonly`, `is-disabled`, `is-invalid`, `is-warning`, `is-valid` | Raíz | Estado resuelto con el contexto (`is-warning` e `is-valid` con `warning`/`valid`, como `GInput`) |
| `is-rejected` | Raíz | I2 de `GForm` (sacudida `g-reject…` de `GInput`, #304; la mueve coco sobre `g-slider__row`) |
| `is-ready` | Raíz | Tras montar (las transiciones solo bajo él, #299 (4)) |
| `is-dragging` | Raíz | Gesto de puntero que mueve un asa o el tramo |
| `is-jumping` | Raíz | Salto deslizado (B6) |
| `is-merged` + `--_mid` (fracción) | Raíz | Rango con las píldoras fundidas (B2) |
| `data-bump="up\|down"` | Raíz | Tope (B5) |
| `--_pill-w` (px) | Raíz | Ancho común de las píldoras, medido; `0px` hasta medir |
| `g-slider__head`, `__label`, `__optional`, `__required` | Cabecera | Siempre (marca según `GForm`) |
| `g-slider__value` | `span` `aria-hidden` en la cabecera | Solo con `is-empty` |
| `g-slider__row` | Fila (`role="group"` con `range`) | Siempre |
| `g-slider__area` | Área de puntero | Siempre |
| `g-slider__track` | Riel | Siempre |
| `g-slider__fill` + `--_from`/`--_to` | Tramo | Sin `is-empty` |
| `g-slider__thumb` + `data-thumb="0\|1"` + `--_at` | Asa | Una por valor (con `is-empty`, cubre el riel) |
| `is-typing` | `__thumb` | Teclear la cifra (B4) |
| `g-slider__pill`, `__pill-text`, `__pill-ref` | Dentro del asa, `aria-hidden` | Sin `is-empty` |
| `g-slider__native` | `<input type="range">` | Uno por asa |
| `data-g-key-focus` | `__native` | Interno, #450 (no es API) |
| `g-slider__thumb-name` | `span` `hidden` | Con `range` |
| `g-slider__marks`, `__mark` (+ `has-label`, `data-value`, `--_at`), `__mark-label` | Bajo el riel, `aria-hidden` | Con `marks` |
| `g-slider__support`, `__hint`, `__message`, `__sr` | Pie | Siempre (`__hint` con ayuda) |
| `g-slider__message-icon` | Icono `GLibIcon` del mensaje | Con `error`, `warning` o `valid` (#507) |

**Para coco:** la raíz en flujo de tres hijos y, dentro de `.g-form-row > .g-slider`, subgrid de tres pistas como `GInput` (cabecera `align-self: end`, fila `start`, pie); el área de alto `--_h` de la caja `md` de `GInput` con su densidad (44px con `pointer: coarse`), `touch-action: pan-y`, sin selección ni menú de toque largo, `cursor: pointer` (`grab` en la píldora, `grabbing` con `is-dragging`, `default` en `readonly`, `not-allowed` deshabilitado); el centro de la píldora en `calc(var(--_pill-w) / 2 + var(--_at) * (100% - var(--_pill-w)))` y el tramo de centro a centro; con `is-merged`, la cápsula en `clamp(var(--_pill-w), calc(var(--_pill-w) / 2 + var(--_mid) * (100% - var(--_pill-w))), 100% - var(--_pill-w))` (la mitad 0 termina ahí, la 1 empieza ahí); la píldora con su celda única (texto visible + referencias apiladas, `min-inline-size: var(--_pill-w)`), el nativo `position: absolute; inset: 0; opacity: 0; pointer-events: none; appearance: none`; con `is-empty` el asa cubre el riel y el riel va en trazos; las marcas alineadas al centro de la píldora con los extremos ajustados al borde; transiciones de posición **solo** con `is-jumping` (nunca al arrastrar) y bajo `is-ready`; keyframes `g-slider-bump…`; `prefers-reduced-motion: reduce` sin desplazamiento ni transición de esquinas (colores con `--g-duration-fast`); **`forced-colors`**: riel `GrayText`, tramo `Highlight`, píldora `ButtonFace`/`ButtonText` con borde `ButtonText` y `forced-color-adjust: none`, tecleando `Field`/`FieldText`, anillo `Highlight`, deshabilitado `GrayText`; **todo selector que toque hijos ignora `.g-tooltip`** con `:not(:where(.g-tooltip))` (#383) si los selecciona por posición.

---

## Avisos de desarrollo (`[Grana GSlider]`, una vez por instancia)

Con el patrón `typeof process !== 'undefined' && process.env.NODE_ENV !== 'production'`.

1. Sin nombre accesible: sin `label`, slot `label`, `aria-label` ni `aria-labelledby`.
2. `range` sin `labels.start` o sin `labels.end`: las dos asas se llamarían igual.
3. Valor único `null` (al montar o al pasar a `null`) sin `labels.empty`.
4. `modelValue` no válido: `NaN`/`±Infinity` o arreglo sin `range` (se lee `null`); con `range`, mal formado o desordenado (se dibuja el recorrido entero u ordenado).
5. `modelValue` fuera de `[min, max]`: se dibuja en el extremo; el modelo no se toca.
6. `min ≥ max`: el control queda sin recorrido.
7. `step` ≤ 0 o no finito (además del validador): se usa `1`.
8. `bigStep` que no es múltiplo positivo de `step`: se usa la décima del recorrido.
9. `minGap` negativo o mayor que el recorrido: se usa `0`.
10. `marks` con valores fuera de `[min, max]` (se ignoran) o repetidos; `snap="marks"` sin arreglo de marcas (se usa `step`).
11. `locale` o `format` que `Intl` rechaza.
12. `format.style === 'percent'` con `max > 1`: «el modelo 40 se leería 4000 %; usa `{ style: 'unit', unit: 'percent' }`».
13. `valueText` que no devuelve una cadena no vacía.
14. Nombres reservados en `$attrs` (`appearance`, `distribution`, `countText`, `pxPerStep`, `orientation`, `clearable`, `size`): no se aplican.

## Paquete y peso (#455)

**Entrada propia `@grana/vue/slider`** (`dist/slider.js` y `dist/slider.umd.js`, global UMD **`GranaSlider`**, requiere `Vue` y `Grana`), decidida **antes de construir** (precedente #337, para que bruno no se detenga a mitad como con #317 → #328):

- **Estimación:** el motor (`utils/slider.js`, ~140 líneas en el prototipo) más el componente con teclado, teclear la cifra, puntero con tres modos, fusión, medida y `GForm` superan con holgura los ~3 KB de `GTimeField` sin su caja; `GTimeField` midió +8,4 KB gzip y `GNumberField`, que comparte la mitad de las reglas, es del mismo orden. Con C en camino (columnas, reparto, consecuencia), el tope de 8 KB del principal (#238, #328, #337, #380, #415) no se respeta en ninguna de las dos entregas. Criterio de siempre: **quien no lo usa no lo paga**. bruno mide y anota el peso gzip en `GSlider.meta.json`; **el resultado no cambia la decisión**.
- `@grana/vue` **no** exporta ni registra `GSlider`. La entrada exporta `GSlider` y, por defecto, un plugin que solo lo registra (`app.use(Slider)`).
- Lo compartido llega por **`__shared`** sin duplicarse: `useFormField` y las claves de contexto (una copia propia crearía otro `Symbol` y el campo no vería su `GForm`/`GFormRow`), `GLibIcon`, `utils/keyFocus.js` (escucha única de documento, con recuento). `utils/slider.js` viaja **solo** en esta entrada (#456).
- El CSS sigue en `grana.css` (`GSlider.css` registrado en `components.css`).
- **Paquete y tipos** (#442, #443): la entrada se declara en `exports` (`./slider` con `types`/`import`/`default`), `typesVersions`, `ENTRIES` de `scripts/build-types.mjs` y `src/types.test.js`; `GSlider.meta.json` con **todas** las props de la tabla (tipos, valores, defaults), `update:modelValue` y `change` con su payload (`number | null | [number, number]`) y los tres slots. Lo que el JSON no expresa (la unión del modelo según `range`, la firma de `valueText`, la forma de `marks` y de `labels`) va en `types/overrides.mjs` (`GSlider.modelValue`, `GSlider.valueText`, `GSlider.marks`, `GSlider.labels`). Componente con `defineComponent`/`<script setup>` sin efectos en el nivel superior del módulo (#444).
- **Compuertas nuevas:** `grep -q "g-slider__pill" packages/vue/dist/grana.css`, `! grep -q "GSlider" packages/vue/dist/grana.js`, `test -f packages/vue/dist/slider.js`.

## Motor (#456)

Utilidad interna **`packages/vue/src/utils/slider.js`** (no se exporta; con `slider.test.js`), sin estado, sin DOM, sin Vue: `places`/`fix` (decimales sin error de coma flotante), `markGrid`, `top`, `bottom`, `snap`, `bigStep`, `move`, `limits`, `keyAction` (con RTL), `format` (con caché de `Intl.NumberFormat` y sin marcas bidi), `valueText`, `frac`, `pick` (empate → `null`), `latin` (cifras del idioma), y lo que añada B: `parseTyped` (texto tecleado → número), `refValues` (valores de referencia del ancho de la píldora), `merged` (¿se funden?) y `windowMove` (tramo que conserva la anchura). **`design/lab/slider/r01/engine.js` es la referencia de comportamiento** (sus resultados son los casos de prueba). Viaja solo en `@grana/vue/slider`; si `GFilterBar` (`between`) o `GTimeField` C lo adoptan, pasa a `__shared` en esa ronda.

---

## Resolución de hallazgos (kiwi r01, L1–L17)

| # | Hallazgo | Resolución | Base |
| --- | --- | --- | --- |
| L1 | Nombre y contrato | `GSlider`, `design/contracts/slider.md`, prefijo `g-slider`; complejo: coco y bruno en Opus | #445 |
| L2 | Motor | `utils/slider.js` interno con su prueba; `engine.js` como referencia | #456 |
| L3 | Props | Tabla de «Props»: las de kiwi, más `warning`, `valid` y `density` (paridad con los campos de `GForm`); `color` por defecto `brand`; sin `appearance` en v0.1 (reservada) | #447 |
| L4 | Eventos | `update:modelValue` en cada cambio; `change` propio, una vez por gesto | #448 |
| L5 | Semántica | «Estructura accesible»: nativo `step="any"` por asa, invisible y del tamaño del interior de la píldora, sin `name`, con los límites del asa; `aria-valuetext` siempre; `group` en el rango | #446 |
| L6 | Anillo de foco | Regla de **modalidad** en `utils/keyFocus.js` para el anillo de **todos** los usuarios de `data-g-key-focus` (también los radios de #441); el motor del tooltip sigue con la de #396; el CSS del deslizador solo con la marca | #450 |
| L7 | Safari y Tab | Seguir la preferencia del sistema (sin `tabindex="0"`); README | #451 |
| L8 | Envío del rango | Dos ocultos con el mismo `name`, orden inicio, fin | #446 |
| L9 | Mínimo en `GFormRow` | Publicado con `setIntrinsicMin`: `space × 40`, píldoras (`3×`/`4×`) y marcas; receta `g-form-w-lg` | #453 |
| L10 | Tokens | Ninguno nuevo; tabla de «Tokens consumidos»; §7.1 y #439 aplicados | #454 |
| L11 | Movimiento | Salto, esquinas de la fusión y tope con `--g-duration-press` + `--g-ease-out`; keyframes `g-slider-bump…`; sin muelle ni rebote; movimiento reducido sin desplazamientos | #452, #454 |
| L12 | Constantes de JS | `TAP` 10px, `TYPE_MS` 900ms, umbral de empate 2px: neutras; `FINE_AT`/`FINE` quedan con A (reservada) | #454 |
| L13 | Paquete | Entrada propia `@grana/vue/slider`, decidida antes de construir | #455 |
| L14 | Valores de la aplicación | «Reglas de props» (fuera de rejilla, fuera de límites, rango nulo o mal formado) y avisos 3 a 5 | #447 |
| L15 | Porcentaje | `{ style: 'unit', unit: 'percent' }` documentado y aviso 12 | #447 |
| L16 | Iconos | Solo los del mensaje por `GLibIcon` (`circle-alert`, `triangle-alert`, `circle-check`); ninguno en el control | #454 |
| L17 | Reservas | `appearance` (`steps`, `tape`), `distribution`, `countText`, `pxPerStep`, `orientation`, `clearable`, `size`; editor `between` de `GFilterBar`; arrastre de extremos en `GTimeField` C | #457 |
| — | B sin «sin elegir» visible (prototipo: en B el texto vacío no se veía en ningún sitio) | `labels.empty` en la cabecera (`g-slider__value`) solo con `is-empty` | #447 |
| — | Tramo que no se podía tocar (prototipo: el toque en el tramo no hacía nada; 2.5.7) | Gesto en suspenso hasta `TAP`: toque = asa más cercana; arrastre = tramo entero | #449 |

### Auditoría de coco (paso 5, `design/lab/slider/auditoria.md`, 2026-10-08)

| # | Hallazgo | Resolución | Base |
| --- | --- | --- | --- |
| H1 | Solo lectura: contorno de la píldora con `border-strong` ≈ 1,5:1 | `border-control` discontinuo sobre `neutral-soft`, como `GInput` (corregido en `GSlider.css`; contorno ≥ 3,18:1, texto ≥ 13,83:1 en 28 configuraciones) | #507 |
| H2 | Área y píldora no crecían con su texto (píldora de 26px en un asa de 24; con el texto al 200 %, 42 en 28) | `--_text-box` como suelo de `--_h` y `--_ph`; sin cambio con el tema por defecto | #507 |
| H3 | Mínimo publicado con nombres de marcas desiguales (hueco de 2,8px, 0 o negativo) | Fórmula por pares vecinos en «Mínimo en una `GFormRow`»; bruno la aplica en `publishMin` (`PENDIENTES.md`) | #509 |
| H4 | Contrato desfasado respecto al CSS: tramo × 1,5, `--g-shadow-2`, píldora por densidad, tope en el asa, trazos `danger-text`, `g-slider--density-*`, `is-warning`, `is-valid`, `g-slider__message-icon` | Reflejados en «Tokens consumidos», B5, B7, «Sin elegir» y «Clases y datos» | #507 |
| H5 | Dos reglas del `.vue` medidas y conformes (valor fuera de límites, asas juntas) | «Reglas de props», «Teclado» y «Puntero y táctil» | #508 |
| H6 | Con movimiento reducido `GForm` pone `is-rejected` sin animación y la clase queda (igual que `GInput`) | Sin efecto visible; sin cambio de contrato | — |

## Límites conocidos (para el README)

- **Safari y Tab:** el range se salta con Tab sin la preferencia del sistema; Opción+Tab llega (#451).
- **Teclear la cifra** no se anuncia mientras se escribe (el valor cambia al confirmar) y no se descubre solo; con lector, el teclado de la tabla.
- **`aria-readonly`** en un range puede no exponerse en Chromium (como en `spinbutton`, #311); lo que dice un lector real, sin verificar.
- **Valor fuera de `[min, max]`:** el nativo acota su `value` (y `aria-valuenow`); `aria-valuetext` dice el valor real.
- **Nombres de marcas:** pocos y cortos; fuera de una fila nadie impide que se junten en un contenedor estrecho.
- **`<form @change>`** de la aplicación no ve el deslizador (eventos del nativo consumidos); usar `@change` del componente.
- **SSR:** pasar `locale` para que el HTML llegue formateado.
- **Idioma cambiado en caliente** (`lang` de un ancestro): no se observa; pasar `locale` reactivo.
- **Sin vertical** (`orientation` reservado) y **sin volver a «sin elegir»** desde la interfaz (`clearable` reservado).

---

## Verificación (cómo se da por hecho)

**Criterio de hecho:** las medidas de kiwi (`design/lab/slider/r01/verificar.mjs`, partes **base** y **B**, 42 + 16 por motor) reproducidas **sobre el componente real**, más lo que este contrato añade (toque en el tramo, `labels.empty` en B, regla de modalidad, mínimo publicado, tipos).

### bruno (vitest + jsdom)

- **Motor** (`slider.test.js`): los casos de `engine.js` (rejilla desde `min` sin error de coma flotante, `max` fuera de la rejilla, `snap="marks"`, `move` desde fuera de la rejilla y fuera de límites, `bigStep` por defecto y con marcas, `limits` con `minGap`, `keyAction` con RTL, `format` con `es-MX`/`ar-EG` sin marcas bidi, `valueText` con marca, `pick` y empate, `latin`), y `parseTyped`, `refValues`, `merged`, `windowMove`.
- **Componente:** modelo `Number`/`null`/arreglo nuevo (nunca cadena, nunca el mismo arreglo); rango nulo, mal formado y desordenado (dibujo, sin emitir, avisos); `change` una vez por gesto (teclas con autorrepetición → uno al `keyup`; puntero → uno; cifra tecleada → uno; ajuste del lector → uno; sin cambio → ninguno; cambio desde la aplicación → ninguno); el `@change` del consumidor no llega al nativo y el `input`/`change` del nativo no burbujean; atributos de cada nativo (`type`, `step="any"`, límites del asa, `value`, `aria-valuetext`, `aria-labelledby` del rango, `aria-describedby`, `aria-invalid`, `aria-readonly`, `disabled`, **sin `name` ni `aria-required`**); ocultos (orden, mismo `name`, canónico, `""` sin elegir, `disabled`, presentes en `readonly`, `form`) y `FormData` de un `<form>`; `GForm`: registro por `name`, `trigger: 'change'`, `notifyChange` al acabar el gesto, `errors[name]` pinta el mensaje, el resumen enlaza al primer nativo, `is-rejected` retirado por un gesto; «sin elegir» (`is-empty`, `labels.empty` en la cabecera, primera tecla); teclear la cifra (Intro, pausa con temporizadores falsos, Esc, Retroceso, fuera de límites con tope, cifras del idioma, «-» solo con `min < 0`, modificadores e `isComposing` no interceptados); tope (`data-bump` solo sin autorrepetición, retirada por `animationend` `g-slider-bump…` y en el acto sin animación calculada); `data-g-key-focus` con la regla de modalidad (Tab, Intro y foco por programa tras una tecla marcan; `pointerdown` desmarca; una tecla con el foco dentro marca); SSR (`renderToString` con y sin `locale`, sin acceso a `window`); avisos 1 a 14; `GSlider.meta.json` y `types.test.js` (uso correcto compila; `modelValue` cadena y `valueText` que no devuelve cadena fallan).
- **`keyFocus.js`:** la regla de modalidad nueva **sin regresión** del motor del tooltip (#396: Tab + Intro que abre un diálogo sigue sin abrir la pista) ni de los radios (sus pruebas siguen verdes).

### Playwright (Chromium, Firefox, WebKit; `design/lab/theme-playground/`; puerto propio, p. ej. 4208 bruno, 4209 coco)

- `tests/slider.spec.mjs`: el `verificar.mjs` de kiwi (base + B) adaptado al componente real: árbol (rol, nombres «Precio mínimo»/«máximo», `valuetext`, límites dinámicos), secuencia de diez teclas, RTL (← sube, posición), rango que se detiene, empate en las dos direcciones, `snap="marks"`, clic en el riel, arrastre, clic en una marca, ajuste del lector (+1 paso), `readonly`, `disabled` fuera del Tab, «sin elegir» con resumen y envío bloqueado, `FormData`, fila con `GInput` y `GNumberField` a 1100/720px (Δ ≤ 1px) y 320px sin desborde, **mínimo publicado** (la fila se parte antes de que las marcas o las píldoras no quepan), táctil en Chromium y WebKit (área ≥ 44, `pan-y`, vertical no cambia, toque salta; **toque en el tramo mueve el asa más cercana**), anillo (no tras clic; sí con →, con Tab —Opción+Tab en WebKit— y con Intro en el resumen), consola limpia.
- `tests/personalidad-slider.spec.mjs`: B1 (ancho igual a 0 %, 40 % y 100 %; dentro del riel; texto = `valuetext`), B2 (fusión sin solape, Δ ≤ 1px; separación), B3 (tramo que conserva la anchura; en suspenso hasta 10px), B4 (Intro, pausa, Esc, fuera de límites), B5 (≤ `space × 0.5`, vuelve, valor igual; nada en `readonly`), B6 (desliza solo en el salto); con `reduce`, ni salto deslizado ni tope ni transición de esquinas, y no quedan datos puestos.
- `tests/key-focus.spec.mjs` ampliado: el deslizador (las cuatro situaciones del anillo) y **un radio de `GRadioGroup` enfocado con Intro desde el enlace de `GErrorSummary` en WebKit** (con #450, con anillo).
- Prueba obligatoria de distribución (`tests/form-distribution.spec.mjs`, #184) en verde; si el playground de formularios añade un deslizador, en su fila con `g-form-w-lg`.

### coco (CSS y auditoría)

Solo `var(--g-*)` y `--_*` más las constantes de §7/§29.6; contraste de la píldora (texto ≥ 4.5:1, contorno ≥ 3:1), tramo y riel ≥ 3:1 en los cuatro temas de §7.1, claro y oscuro, y con `color` semántico; `forced-colors` emulado; zoom 200 %. Banco y `estilo.md` en `design/lab/slider/` (alto del área, píldora por densidad y con puntero grueso, mínimo de referencia). Auditoría con un tema distinto en `design/lab/slider/auditoria.md` y verificación propia `node design/lab/slider/auditoria-verificar.mjs` en los tres motores.

### No verificado (entorno real)

Lector de pantalla (VoiceOver macOS e iOS «ajustable», NVDA, TalkBack: el nativo invisible, `aria-valuetext`, los nombres del rango, `aria-readonly`); táctil real (`pan-y` con desplazamiento real, píldora y tramo con el dedo); IME al teclear la cifra; idiomas con cifras propias tecleando; `forced-colors` real; zoom 400 %.

---

## Encargos

### coco (Opus; `GSlider.css`, banco y `estilo.md`)

1. `packages/vue/src/components/GSlider/GSlider.css` con las clases de «Clases y datos»: tres hijos y subgrid en `GFormRow`, área y riel, píldora con celda única y referencias apiladas, posiciones con las fracciones y `--_pill-w`, fusión (`is-merged`, `--_mid`, esquinas interiores, raya `on-{color}`), tramo agarrable con zona ≥ 24px (44 gruesa), «sin elegir» (asa sobre el riel, trazos, `g-slider__value`), `is-typing`, estados, anillo **solo** con `[data-g-key-focus]`, `g-slider--color-*`, `forced-colors`, `pointer: coarse`.
2. Keyframes `g-slider-bump…` y las transiciones de B2 y B6 según «Personalidad», solo con `no-preference` y bajo `is-ready`.
3. Banco en `design/lab/slider/` y `estilo.md` con medidas (alto por densidad, píldora, contraste en los cuatro temas, mínimo de referencia).
4. Auditoría del componente real con un tema distinto (paso 5): `design/lab/slider/auditoria.md`.

### bruno (Opus; `.vue`, motor, pruebas, registro)

1. `packages/vue/src/utils/slider.js` + `slider.test.js` («Motor»).
2. **`utils/keyFocus.js`**: la regla de modalidad de #450 (señal nueva, sin tocar `nav.at` del tooltip) y los radios de #441 pasan a ella; pruebas de no regresión.
3. `packages/vue/src/components/GSlider/GSlider.vue`, `GSlider.test.js`, `GSlider.meta.json` (`status: "draft"` hasta la auditoría, con el peso de la entrada), registro del CSS en `components.css`, **entrada propia `@grana/vue/slider`** (#455: `src/slider.js`, su configuración de Vite, global `GranaSlider`, lo compartido por `src/shared.js`; `exports`, `typesVersions`, `ENTRIES`, `types.test.js`, `types/overrides.mjs`) y las tres compuertas.
4. Playground: sección `#sec-slider` (valor único con marcas nombradas y «sin elegir», rango de precio con `es-MX`, `ar-EG` en RTL, la receta con `GNumberField` en una fila, `readonly`, `disabled`, error y resumen) y las specs de «Verificación».
