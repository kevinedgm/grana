# Declaración — barra de campos (`GFieldBar`, nombre de trabajo), r01: base funcional y conceptos A, B y C

> kiwi, 2026-10-13. Prototipo: `index.html` + `bar.js` + `bar.css`, sobre los **componentes reales** de `packages/vue/dist` (`GCombobox`, `GSelect`, `GDatePicker`, `GInput`, `GBtn`, `GDialog`) y los tokens del tema por defecto. Verificación: `node design/lab/field-bar/r01/verificar.mjs` → **288/288** (96 por motor en Chromium, Firefox y WebKit). Brief: `brief.md`.

## La decisión de frontera (lo primero)

**Es un componente nuevo, no una ampliación de `GInputGroup`.** Lo que hay en el repo lo decide:

| Pieza existente | Qué es | Por qué no sirve de base |
| --- | --- | --- |
| `GInputGroup` (#177, #178, `form.md` §13) | **Un dato** en varias partes: **una** etiqueta, **un** mensaje, partes `<input>`/`<select>` nativas sin caja, solo sus tres partes como hijos (aviso 4) | Aquí hay **varios datos**, cada uno con su etiqueta visible, su mensaje y su panel anclado (`GCombobox`, `GDatePicker`). Ampliarlo rompería «una etiqueta» (#177), «`GBtn` no es parte» (#397) y la regla de hijos de §13. La relación es la inversa: **un `GInputGroup` completo puede ser un segmento** de la barra (teléfono en una barra de contacto) |
| `GFieldGroup` (#160, #179) | `fieldset` + `legend` para **una pregunta** compuesta, siempre en su propia fila; la reserva `joined` **se retiró** en #179 | Origen y Destino no son una pregunta; una `legend` en una fila compartida baja las cajas vecinas (auditoría de coco que motivó #179) |
| `GFormRow` (#171 a #176, #271, #312) | Campos **distintos** que van juntos, proporción que llena el ancho, tres pistas (etiqueta · caja · pie), mínimos publicados | **Es el pariente**: la barra es «una fila de campos con superficie compartida y una acción». Se **reutiliza su motor** (mínimos, `g-form-w-*`, `--g-form-min`, `setIntrinsicMin`, subgrid de tres pistas), no se duplica. No se vuelve prop de `GFormRow`: mezclaría superficie, acción y semántica de búsqueda en una pieza del principal |
| `GInput` slot `action` (#33) | **Un** campo + un `GBtn` acoplado | Sigue siendo la respuesta para un solo campo; la barra empieza en dos (aviso con uno) |
| `GFilterBar` (#111) | Filtros **abiertos**: el usuario agrega reglas, chips, `filters` como datos | La barra es **cerrada**: campos fijos que la aplicación conoce. Conviven (búsqueda arriba, filtros avanzados al lado) |
| `GAdaptiveLayout` (#361) | Reparto sin superficie que deja aire | Sin solape |
| `GDatePicker` `anchor` y slot `trigger` | Ya previstos «para la barra de búsqueda» (datepicker r01, punto 18) | La barra **se ofrece como ancla** al selector que contiene (dos meses con su ancho); medido |
| Paneles anclados (#358) | `GSelect`, `GCombobox`, `GDatePicker` | Siguen funcionando **sin cambios** dentro de la barra: medido con los reales (panel del combobox dentro del ancho de su segmento; selector a dos meses alineado con la barra) |

**Dónde vive:** entrada propia **`@grana/vue/field-bar`** (#550: el margen del principal está agotado; la barra no importa campos, son hijos de la aplicación, así que su peso es el suyo y el del motor de filas ya compartido por `__shared`).

## Anatomía (base)

```
[role=search | group, con nombre]                     ← raíz; NO es <form> (el envío es de GForm o del <form> de la app)
  ├─ superficie (decorativa, aria-hidden)              ← la pinta la barra, nunca un campo
  ├─ celda 1 ─ lente (aria-hidden) + CAMPO completo    ← etiqueta · caja · pie del propio campo (tres pistas)
  ├─ celda 2 ─ lente + CAMPO
  ├─ …
  └─ acción (slot)                                     ← GBtn type="submit" del formulario que contiene la barra
```

## Decisiones de la base (comunes a A, B y C)

| # | Decisión | Deriva de |
| --- | --- | --- |
| 1 | **Cada hijo es un campo completo de Grana** (`GInput` y lo que lo compone: `GCombobox`, `GNumberField`, `GTimeField`; `GSelect`; `GDatePicker`; `GInputGroup` entero) y conserva su etiqueta visible, su nombre, su teclado, su `aria-invalid`, su mensaje y su panel. La barra **no renombra** ni añade descripciones | WCAG 3.3.2, 2.5.3, 4.1.2; decisión central del usuario (primitiva que agrupa lo existente) |
| 2 | **Raíz `role="search"`** (con `search`) o **`role="group"`**, siempre **con nombre** (`label` o `aria-labelledby` del consumidor; aviso sin él). Medido: «Buscar vuelos», «Buscar en el catálogo» | ARIA 1.2 (landmark `search`); APG |
| 3 | **La raíz no es `<form>`**. El envío, el momento de los errores, el resumen y «foco al primero que falla» son de `GForm` (#157) o del `<form>` de la aplicación; la acción es un `GBtn type="submit"`. Así funciona dentro de un `GForm` sin formularios anidados | Un archivo, un dueño; #157 |
| 4 | **Orden DOM = Tab = visual** en fila, columna y frase; la acción, al final. Medido: Origen → Destino → Salida → Buscar en los tres motores | WCAG 1.3.2, 2.4.3; `form.md` «Principios» |
| 5 | **Tres pistas compartidas** (etiqueta · caja · pie) por subgrid, como `GFormRow` (#176): etiquetas y cajas alineadas a 0 px; un mensaje nunca baja la caja del vecino | #176 |
| 6 | **Error por segmento:** `aria-invalid` solo en el campo que falla; su mensaje (el del campo, en su `aria-describedby`) queda **debajo de su segmento**; el foco va al primero que falla. Medido en base, A y B | WCAG 3.3.1; #157 |
| 7 | **Reparto medido por la propia raíz** (`ResizeObserver`), sin `@container` ni `@media`: **una línea si caben los mínimos** (el de cada campo, más la acción), **si no, columna**. Sin estados intermedios 2 + 2 (una barra partida en dos líneas se lee como dos barras). Fila a 1100 px, columna a 420 y a 320 sin desbordamiento | #130, #34, #39; `form.md` «Una sola estructura» |
| 8 | **Los paneles no se tocan**: la barra no recorta (`overflow` visible) y no transforma a sus antecesores; los paneles son `popover` en la capa superior | #358 |
| 9 | **Posicionamiento fuera del componente** (ver abajo): la barra llena su contenedor; centrar, limitar, superponer, fijar o pegar es del contenedor de la aplicación, con recetas | Petición del usuario («evitar variantes combinadas»; «`fixed` no debe convertirlo en barra flotante sin considerar scroll, responsive y capas») |

### API conceptual del usuario → qué queda

| Propuesta | Qué queda | Por qué |
| --- | --- | --- |
| `variant` outlined/filled/plain | `variant` **`outline` / `soft` / `raised`** | Vocabulario de Grana (`GInput`); `raised` = superficie con sombra para apoyarse sobre otra (portada). «plain» es el concepto B entero, no una variante |
| `shape` pill/rounded/square | **`shape`** igual (`--g-radius-pill` / `-xl` / `-xs`) | Es identidad de la barra, no de los campos |
| `size` | **`size`**, propagado a los campos por el contexto | Como `density` en `GFormLayout` |
| `direction` row/column | **`layout`** `auto` (por defecto) / `row` / `column` | `auto` es la regla 7; forzar sirve para hojas y paneles laterales |
| `separators` | Lo implica la **apariencia** (`joined`: costuras; `segmented`: sin costuras, separación) | Dos props que se contradicen serían posibles |
| `gap` | Lo implica la apariencia | Ídem |
| `width`, `maxWidth`, `align` | **Receta** (contenedor de la aplicación) | La barra llena su contenedor, como toda fila (#171) |
| `position` static/relative/absolute/fixed | **Receta**; `fixed` **rechazado** como prop | Ver «Posicionamiento» |

### Posicionamiento: qué entra y qué es receta

- **Entra:** `variant="raised"` (superficie opaca con `--g-shadow-2`, para apoyarse sobre una imagen o una banda de color) y nada más.
- **Receta 1 · centrada y limitada:** contenedor con `max-inline-size` y `margin-inline: auto` (o la rejilla de la página).
- **Receta 2 · sobre una portada:** el contenedor de la portada coloca la barra (rejilla o `position` propios); la barra no sabe que flota. Prototipo: banda `brand-soft → accent-soft` con `raised`.
- **Receta 3 · pegada al desplazar:** `position: sticky` en el contenedor de la aplicación + `scroll-padding-block-start` (#515) para que el foco no quede debajo. Con C, el resumen es la forma natural de lo pegado.
- **Rechazado · fija al visor:** exigiría reservar borde con `edgeReserve.js` (orden voz → isla → avisos), resolver el teclado virtual y la superposición con `GToaster`; es un **patrón** propio si un producto lo pide, no una prop.

## Estados medidos

Reposo, puntero encima (lente `neutral-soft` y costuras abiertas), foco por teclado (anillo `--g-focus-width` en el segmento entero), segmento activo (lente elevada, barra hundida, ancho ganado), panel abierto (combobox y selector de fechas), error en dos segmentos, columna, móvil 320, RTL (inspección visual), movimiento reducido. **No prototipados:** deshabilitado y solo lectura de la barra entera (L15).

---

## A · Costura

Una sola superficie. **La etiqueta vive dentro del segmento** (arriba la etiqueta, abajo el valor) y es **la del propio campo**, no una segunda. Entre segmentos hay **costuras** (líneas cortas que no llegan a los bordes), no bordes. Al entrar en un segmento, **las costuras de sus dos lados se abren**, el segmento **se eleva como una lente** (superficie + `--g-shadow-2`) sobre la barra, que **se hunde un tono** (`surface-sunken`), y **gana ancho** para lo que se escribe (×1,7 de su proporción, con `--g-ease-spring`); los demás ceden **sin bajar de su mínimo**. El selector de fechas se ancla a la barra entera (dos meses). Dos apariencias del mismo concepto, como pidió el usuario:

- **`joined` (píldora):** contorno exterior compartido, sin divisiones salvo costuras.
- **`segmented`:** la superficie es una **bandeja** (`surface-sunken`) y cada segmento conserva su contorno (`border-control`, 3,19:1 sobre la bandeja) con su radio: identidad propia, unidad clara.

En columna, la superficie la pinta la raíz con `--g-radius-xl`, las costuras son horizontales y el mensaje queda dentro de su segmento.

### Qué lo hace distinto (A)

- **El segmento activo hace sitio a lo que se escribe.** En las barras habituales cada segmento tiene ancho fijo y el texto largo («Aeropuerto Internacional Benito Juárez») se corta mientras se edita; aquí el segmento con el foco crece (medido: 338 → 459 px) y los otros ceden lo que les sobra, con resorte, sin moverse de orden ni bajar de su mínimo. Sirve al usuario cuando más lo necesita: mientras escribe.
- **La lente:** la barra se hunde y el segmento activo sube; se sabe dónde se está sin depender solo del anillo (que sigue estando con teclado). Las costuras que se abren unen visualmente el segmento con su lente.
- **El segmento entero es objetivo:** pulsar la etiqueta o el relleno lleva al control (la etiqueta de `GDatePicker` es un `<span>`); medido.

### Gana y arriesga

- **Gana:** es la forma que el usuario describió, con identidad propia; cubre sus dos apariencias; compacta (≈ 58 px de alto) con etiqueta visible; los paneles funcionan sin tocar los campos.
- **Arriesga:** necesita un estado «unido» en el CSS de cada campo (L4); el crecimiento anima `grid-template-columns` (barato, pero se sacrifica con movimiento reducido); con 5 segmentos estrechos el crecimiento tiene poco margen.

### Medidas (A, tema por defecto, Chromium; Firefox y WebKit iguales salvo subpíxeles)

Etiqueta 12 px peso 500, **17,40:1**; marcador de posición **5,10:1**; contorno `outline` **3,45:1** sobre `surface`; caja de valor 30 px (≥ 24); anillo 2 px sólido en el segmento; costuras a 0 junto al activo; error: etiqueta `danger-text` **5,08:1** + barra interior de 3 × `border-width` (forma, no solo color); segmentada: contorno **3,19:1** sobre la bandeja (justo: L14); movimiento reducido: transición de columnas a 0 s.

---

## B · Frase

**Sin caja.** La barra **es una frase** con huecos: «Vuelo desde [Ciudad de México] a [¿a dónde?] el [¿qué día?] → Buscar»; «Muestra [Productos] que contengan [nombre, código o descripción]». Las palabras que unen son **la etiqueta visible de cada campo** (su propio `<label>`, por el slot `label`) con un **calificador oculto** que completa el nombre: «Vuelo desde (origen)», «a (destino)». El hueco es un subrayado (`border-control`, 3,45:1), con foco: subrayado grueso del color de foco y fondo `accent-soft`; con error: subrayado `danger-text`. **Se pliega como un párrafo**: no hay fila ni columna ni umbral; a 320 px cada palabra se queda con su hueco. El filtro **no necesita botón** (se aplica al cambiar; la frase de resultado lo confirma).

### Qué lo hace distinto (B)

- **Cuestiona la premisa de la caja:** la interfaz se lee como lo que la persona quiere decir; la etiqueta y el valor forman una oración, que es más fácil de revisar de un vistazo («¿busqué lo correcto?») que cuatro casillas.
- **Responsive sin reglas:** el texto ya sabe partirse en líneas; no hay umbral que calibrar ni versión móvil.
- **La frase es la aplicación:** el orden de las palabras lo pone la aplicación en cada idioma; Grana no impone orden gramatical.

### Gana y arriesga

- **Gana:** personalidad máxima; ideal para filtros y búsquedas «de una frase»; RTL y cualquier idioma sin reglas.
- **Arriesga:** solo sirve donde la tarea **se puede decir** (no para un formulario compacto de cinco datos); en lector de pantalla cada hueco se oye con su fragmento («Vuelo desde (origen), cuadro combinado») — correcto pero menos claro que «Origen»; el texto de `title-sm` ocupa más; `GCombobox` debe ceder su ficha (código + aeropuerto) a texto plano (L9); el mensaje de error abre un hueco bajo su palabra.

### Medidas (B)

Palabra (etiqueta) `text-muted` **7,46:1**; hueco 44 px de alto; palabra y hueco en la misma línea a 1100 y a 320 px; sin desbordamiento a 320; Tab en el orden de la frase; error con foco en el primero.

---

## C · Resumen que se abre

En reposo la barra **es su resumen**: una línea de datos con icono (icono de lugar «Ciudad de México», icono de flecha «¿A dónde?», icono de calendario «Fecha», y «Buscar») que cabe en cualquier sitio, también pegada arriba al desplazar. **Cada dato es un botón de divulgación** (`aria-expanded`, `aria-controls` → la edición; nombre «Destino: sin elegir», que contiene el texto visible). Al pulsar uno, la barra **se despliega en sitio con la cara A** (rejilla `0fr → auto` con `--g-ease-spring`) y **el foco va a ese campo**. Al salir de la barra (foco fuera tras un ciclo, sin paneles abiertos) **se recoge**; con **Esc** sin paneles abiertos, se recoge y **el foco vuelve al dato**. Plegada, la edición es `inert`; desplegada, el resumen es `inert`. Estrecha (< `space × 140`), el dato abre una **hoja** (`GDialog mobile="sheet"`) con la cara en columna y «Listo».

### Qué lo hace distinto (C)

- **La barra solo ocupa lo que la tarea necesita en cada momento:** leer lo buscado cuesta una línea; editar despliega todo. Es la respuesta al «Floating Search Bar» del usuario sin variante especial: la misma primitiva (A) dentro de una divulgación.
- **Ir directo al dato:** pulsar «Cancún» no abre «la búsqueda», abre **Destino** con el foco dentro; en móvil, la hoja se abre en ese campo.
- **Una sola forma para escritorio, pegada y móvil**, que se recoge sola al terminar.

### Gana y arriesga

- **Gana:** resuelve el móvil y la barra pegada (lo más difícil del brief) con una sola idea; el resumen deja la página respirar.
- **Arriesga:** un paso más para editar en escritorio; el texto de cada dato lo tiene que dar la aplicación (la barra no sabe pintar el valor de cualquier campo); en móvil, un `GCombobox` dentro de la hoja abre su propia superficie encima (diálogo sobre diálogo, L17); recoger al salir es un cambio de contexto al perder el foco (permitido por 3.2.1, que habla de recibirlo, pero hay que anunciarlo bien).

### Medidas (C)

Datos con `aria-expanded="false"` en reposo y `true` desplegada; pulsar «Destino» enfoca Destino y «Fecha» enfoca Salida; Esc recoge y devuelve el foco al dato; Tab fuera recoge; estrecho: hoja con el foco en el campo, «Listo» cierra y el foco vuelve al dato (en WebKit solo con retorno explícito: L13); sin desbordamiento a 400 px.

---

## Comparativa

| Criterio | Base | A · Costura | B · Frase | C · Resumen que se abre |
| --- | --- | --- | --- | --- |
| Las dos apariencias del usuario | Solo «fusionada» con etiqueta fuera | **Sí: `joined` y `segmented`** | No (otra premisa) | Sí, en su cara desplegada (es A) |
| Etiqueta visible dentro del segmento | No (fuera) | **Sí** | Es la palabra | Sí (desplegada); el resumen enseña valores |
| Escritorio: pasos para editar | 1 | 1 | 1 | 2 (dato → campo) |
| Móvil 320 | Columna | Columna con costuras | **Párrafo, sin umbral** | **Resumen de una línea + hoja** |
| Barra pegada / sobre portada | Pesada | Buena (`raised`) | Poco adecuada | **La mejor** (una línea) |
| Para qué casos | Todos | **Búsquedas, reservas, filtros, formularios compactos** | Búsquedas y filtros que se dicen en una frase | Búsquedas con contexto (cabecera, portada, móvil) |
| Cambio en los campos | Radios en los extremos | Estado «unido» en `GInput`, `GSelect`, `GDatePicker` (L4) | Estado «frase» + ficha de `GCombobox` como texto (L9) | El de A + textos del resumen de la app |
| Riesgo de accesibilidad | Bajo | Bajo (medido) | Medio (nombres por fragmento; lector) | Medio (divulgación + recoger al salir) |
| Personalidad | Ninguna | Alta y funcional (lente que hace sitio) | **Máxima** | Alta (la barra respira) |
| Coste | Bajo | Medio | Medio | Alto (A + divulgación + hoja) |

## Recomendación

**A · Costura como la primitiva** (`appearance="joined"` por defecto, `segmented` como apariencia), porque es la forma que el usuario describió con una identidad que sirve mientras se escribe, cubre todos los casos del brief y es la más barata de hacer accesible. **C como modo de la misma barra** (no otro componente) para cabecera pegada, portada y móvil: un `collapse`/`summary` opt-in sobre A, en una segunda entrega. **B reservada** como `appearance="phrase"` para filtros que se dicen en una frase, solo si el usuario la quiere (personalidad máxima, alcance estrecho). En estrecho, A por defecto pasa a columna (probado); C sería la alternativa con resumen + hoja.

## Qué lo hace distinto (resumen de la recomendación)

El segmento con el foco **hace sitio a lo que se escribe** (crece con resorte mientras los demás ceden sin bajar de su mínimo), **se eleva como una lente** sobre una barra que se hunde y **abre sus costuras**; el segmento entero es objetivo. Y la misma barra puede **recogerse en su resumen** (C) cuando no se está editando. Nada de esto toca la semántica de los campos: el comportamiento es de la superficie.

## Comprobaciones (`verificar.mjs`, 288/288)

Por motor (96): raíz `search` con nombre (×8 ejemplos); etiqueta visible contenida en el nombre de cada campo (×20); sin desbordamiento; fila a 1100 y columna a 420 y 320; tres pistas alineadas (0 px); Tab Origen → Destino → Salida → Buscar (base, A, B; WebKit con Opción+Tab); A: segmento activo, crecimiento > 15 %, mínimos, anillo 2 px, lente y barra hundida, costuras abiertas, panel de `GCombobox` dentro de su segmento (#358), `GDatePicker` a dos meses alineado con la barra, pulsar la etiqueta abre el control, contrastes (etiqueta, marcador, contorno, error, segmentada), caja ≥ 24 px, movimiento reducido; error por segmento (`aria-invalid` solo donde falla, mensaje en `aria-describedby`, mensaje bajo su segmento, foco al primero) en base y A; B: palabra y hueco en la misma línea a 1100 y 320, subrayado ≥ 3:1, palabra ≥ 4,5:1, hueco 44 px, error y foco, sin desbordar; C: divulgación (`aria-expanded`, `aria-controls`, `inert` en ambos lados), foco al campo pulsado, Esc, salida con Tab, hoja en estrecho con retorno del foco; sin errores de consola.

### No verificado

Lector de pantalla real (VoiceOver, NVDA) sobre el punto de referencia, la lente y la divulgación de C; `forced-colors` real (hay reglas, no se midieron); táctil real y teclado virtual; tema oscuro y un tema distinto; `size` `sm`/`lg`; deshabilitado y solo lectura; dentro de un **`GForm` real** (el prototipo usa su propio envío y foco); `GNumberField`, `GTimeField` e `GInputGroup` como segmentos; `GDatePicker split` (Salida · Regreso); contraste del contorno de `raised` sobre la portada; rendimiento del crecimiento con muchas barras.

## Hallazgos para lima

- **L1 · Nombre y entrada.** `GFieldBar` (`g-field-bar`), entrada propia `@grana/vue/field-bar` (global UMD `GranaFieldBar`) por #550; si lima lo mete al principal, abre #506. Pregunta 3 al usuario sobre el nombre.
- **L2 · Frontera en `form.md`** («Frontera con otros componentes»): fila nueva «Varios campos que se leen como una barra con una acción (buscador, filtro, reserva) → `GFieldBar`; no `GInputGroup` (un dato), no `GFieldGroup` (una pregunta), no `GInput action` (un campo)». En §13: un `GInputGroup` entero **sí** puede ser segmento.
- **L3 · Contexto, no props en los campos.** La barra vuelve a proveer el sub‑contexto de distribución (`layoutKey`, como `GFormReveal` §14.4) con `size`, `density`, `disabled`, `readonly` y dos datos **internos**: `joined` (`'segment' | 'phrase' | false`) y `anchor` (la raíz, ancla por defecto de un `GDatePicker` hijo; su `anchor` explícito gana). Los campos ponen `is-joined` (o `is-phrase`) en su raíz. Nada de esto va al `meta.json` ni al README de los campos (precedente N4/N5, #309).
- **L4 · El estado «unido» vive en el CSS de cada campo (coco), no en el de la barra.** `GInput` (y con él `GNumberField`, `GCombobox`, `GTimeField`), `GSelect` y `GDatePicker` comparten el mismo vocabulario (`--_bg`, `--_border`, `--_border-end`, `--_radius`, `--_px`, `--_focus`), **pero sus estados escriben `--_border` en la caja** (`:hover`, `:focus-visible`, `is-open`, `is-invalid`, `is-warning`, `is-valid`): desde fuera no se puede anular sin conocer sus clases (el prototipo necesitó selectores `:is(...)` sin capa). En unido: caja transparente en **todos** los estados, radio interior, sin anillo de caja (lo pinta el segmento), etiqueta dentro con el relleno del segmento y `caption` (12 px). Mismo principio que #395: cada componente marca lo suyo; la barra nunca escribe en los `--_*` de un hijo.
- **L5 · Tres pistas por subgrid y nada más en el flujo.** La barra coloca a cada campo en tres pistas como `GFormRow` (#176). Los hijos extra de los campos (`g-combobox__live` absoluto, `__popup` y listas en `popover`, `<input hidden>`) están fuera del flujo hoy; regla para campos futuros: ningún hijo extra en el flujo de la raíz.
- **L6 · Reparto con el motor de `GFormRow`.** Mínimo de cada segmento = el de `GFormRow` (`g-form-w-*`, `--g-form-min`, `setIntrinsicMin`) + el intrínseco de la acción; política «una línea o columna». Crecimiento del activo ×1,7 de su proporción (constante de diseño de coco), transición de `grid-template-columns` con `--g-duration-slow` y `--g-ease-spring`; con movimiento reducido, sin transición.
- **L7 · Semántica y textos.** `search` (Boolean) → `role="search"`, si no `role="group"`; `label` → `aria-label` (o `aria-labelledby` del consumidor); aviso sin nombre, con un solo campo («usa `GInput` con `action`»), con más de 5, con un hijo que no es campo (`GTextarea`, `GCheckbox`, `GRadioGroup`, `GSwitch`, `GFileField`, `GSlider`: reservados, su forma no cabe en un segmento) y con dos `GBtn` en `action`. Sin textos por defecto.
- **L8 · El segmento entero es objetivo.** Pulsar el relleno o una etiqueta que no es `<label for>` enfoca el control (y lo abre si es botón: `GDatePicker`); se excluyen `label`, controles y paneles para no abrir y cerrar a la vez.
- **L9 · Si se elige B:** `appearance="phrase"`; la etiqueta del campo es el fragmento visible (slot `label`) + calificador oculto (2.5.3); `GCombobox` en frase pinta el valor como texto, sin la ficha `GSummary` (hoy la ficha tapa el texto del `<input>` y no escala a `title-sm`); el hueco mide su ancho en caracteres (`chars` como `GInputGroupInput`).
- **L10 · Si se elige C:** modo de la misma barra (`collapse` o similar); datos del resumen = botones de divulgación (APG *Disclosure*) con `aria-expanded` y `aria-controls`; el texto de cada dato lo da la aplicación (la barra no sabe pintar el valor de cualquier campo): slot `summary` con `{ open(name) }` o un arreglo; plegada = `inert` en la edición; recoge al perder el foco (tras un ciclo, sin `:popover-open` ni `dialog[open]`) y con Esc solo si ningún campo lo usó; estrecho (< `space × 140`, constante) → `GDialog mobile="sheet"`.
- **L11 · Marca de error del segmento:** barra interior de 3 × `--g-border-width` en `danger-text` + etiqueta en `danger-text` (5,08:1) además del icono y prefijo del mensaje del campo (C6): forma, no solo color.
- **L12 · Tokens: ninguno nuevo.** `--g-color-{surface, surface-sunken, border, border-control, neutral-soft, focus, danger-text, accent-soft}`, `--g-shadow-2`, `--g-radius-{pill, xl, lg, xs}`, `--g-focus-width`, `--g-border-width`, `--g-duration-{fast, slow}`, `--g-ease-{standard, spring}`, `--g-space-*`, `--g-text-caption-*`. Constantes de diseño (coco): margen de la lente `space × 1`, relleno del segmento `space × 5` (píldora) / `space × 4`, crecimiento 1,7, umbral de C `space × 140`.
- **L13 · Retorno del foco tras una hoja en WebKit (para bruno, posible defecto general de `GDialog`).** En WebKit pulsar un botón no lo enfoca; al cerrar el `<dialog>` la restauración nativa lleva el foco a `<body>`. El prototipo devuelve el foco al dato de forma explícita; conviene comprobar si `GDialog` lo resuelve para cualquier disparador pulsado.
- **L14 · Contrastes justos a vigilar (coco):** segmentada 3,19:1 (`border-control` sobre `surface-sunken`); el contorno de `raised` es `--g-color-border` + sombra sobre una portada de color **no medido**; `soft` sin borde superior depende del fondo.
- **L15 · Deshabilitado y solo lectura** de la barra: por contexto a todos los campos (como `GFormLayout`); la superficie no cambia de color (lo dicen los campos); sin prototipar.
- **L16 · `GDatePicker split` (Salida · Regreso) como dos segmentos:** es el caso de vuelo de ida y vuelta; un solo campo con dos botones ocuparía dos celdas. Ronda corta propia antes del contrato o reserva explícita.
- **L17 · Diálogo sobre diálogo en C móvil:** un `GCombobox` dentro de la hoja abre su propia superficie (`GDialog`) encima; `GDatePicker` ya pide `inline` dentro de un `GDialog`. Resolver con su modo dentro de un modal (como `GDatePicker`) si C entra.

## Preguntas de elección para el usuario

1. **¿Qué forma tiene la barra por defecto?** **A · Costura** (recomendada: la lente que hace sitio a lo que se escribe; `joined` y `segmented` como dos apariencias), **B · Frase** (la barra es una oración; sin caja), o **C · Resumen que se abre** (la barra es su resumen y se despliega al tocar un dato). Se pueden combinar como en otros componentes: por ejemplo, A por defecto + C como modo para cabecera pegada y móvil + B reservada para filtros.
2. **En anchos estrechos, ¿la barra se apila en columna (A, probado) o se recoge en su resumen con hoja (C, probado)?** Si eliges A + C, ¿C entra en la primera entrega o en la segunda?
3. **Nombre:** `GFieldBar` (recomendado: varios campos que se leen como una barra; `GInputGroup` ya existe y significa un dato en varias partes). ¿Otro preferido?
