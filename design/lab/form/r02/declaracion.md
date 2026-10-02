# Declaración · Sistema de formularios · r02 · distribución

**Estado:** en revisión del usuario. **Fuente de verdad:** `brief.md` de esta ronda (rechazo de la Fase 1). `r01/brief.md` sigue vigente salvo donde `r02/brief.md` lo contradice.
**Ruta:** R2 (rediseño del modelo de composición) · **Fidelidad:** F2 · **Material:** kit gris neutro, iconos solo Lucide.
**Entregables:** `index.html` (prototipo; selector de ancho del contenedor Libre/1280/960/720/480/360/320, estados «Limpio» / «Ayuda y mensajes», «Etiquetas largas»), `comparacion.html` (antes/después con `capturas/`), `verificar.mjs` (Playwright, Chromium), esta declaración.
**Siguiente dueño:** lima (revisar `form.md` §4, §5, §8, §9 y C12), luego coco (CSS de la fila y de `GInputGroup`) y bruno.
**Convención:** igual que r01. Grises, grosores y radios del prototipo son de wireframe; los valores de ritmo (6 / 20 / 16 / 40px) son proporciones estructurales que coco confirma o ajusta.

## 1. Diagnóstico (playground real, Chromium, tema por defecto)

Medido con Playwright en `#sec-form` a 1280, 960, 720, 480 y 360px (capturas completas en `design/lab/playground-shots/form-r02/`, ignorado; las de la comparación, en `capturas/`). «Hueco» = distancia del final de la fila al borde derecho de la rejilla.

1. **Bordes dentados por diseño.** La Fase 1 dice «una fila puede quedar con huecos» (`form.md` §4) y la rejilla de 12/6/1 los produce en casi todas las filas. A 1280 (rejilla de 910px): Nombre | Apellido termina a **309px** del borde; Fecha | Edad | Sexo, **309px**; Signos vitales, **232px**; RFC | Razón social, **77px**; Colonia | CP | Ciudad, **76px**; Estado | País, **303px**; Teléfono, **303px**. Cada fila acaba en un sitio distinto.
2. **Huérfanos a media fila en 6 columnas** (960, 720 y 480, porque la rejilla mide su contenedor y el playground tiene índice lateral): «Segundo apellido» solo con **339px** de hueco (tres `md` en 6 columnas = 2 + 1); «Copago» y «RFC» solos con **452px**; «Núm. exterior | interior» (una `g-form-row md`) y «Ciudad» solos con **330px**.
3. **Los máximos de lo compacto en una columna** (`--g-form-max-xs` 120px, `--g-form-max-sm` 192px) dejan a 360 una escalera: Temperatura, Peso, Saturación a 120px (**182px** de hueco cada una), Fecha, Sexo, Copago, RFC, CP a 192px (**110px**), y Nombre, Correo, Calle a todo el ancho.
4. **Cajas desalineadas por leyendas y etiquetas de parte.** Correo | Teléfono a 1280: la caja de Correo en `top` 104 y las del teléfono en **132** (+28px: el `<legend>` «Teléfono» más las etiquetas País · Número · Extensión). La rejilla general alinea arriba y no tiene *subgrid* (decisión de la Fase 1), así que cualquier etiqueta más alta baja su caja.
5. **Etiquetas que se parten.** Calle | Núm. exterior | Núm. interior a 1280: «Núm. interior (opcional)» ocupa dos líneas; dentro de su `g-form-row` las cajas se alinean entre sí, pero **20px** por debajo de la de Calle (la fila unida no comparte pistas con la rejilla). A 480, «Saturación (opcional)» se parte y baja su caja 20px respecto de Temperatura y Peso.
6. **El «fondo negro» de Edad.** Es un campo de solo lectura **vacío** (sin fecha no hay edad) con sufijo «años». El solo lectura de la Fase 1 rellena con `--g-color-surface-sunken`; en oscuro eso es `rgb(16,16,16)` sobre una superficie más clara, y las demás cajas son transparentes: se ve un pozo negro con «años» dentro (`capturas/antes-edad-oscuro.jpg`). En claro es un gris discontinuo vacío. El problema de fondo es **estructural**: un dato calculado no es un campo y no debe ocupar una caja propia en una fila de captura.
7. **Sin flujo.** Filas con dos, tres o cuatro campos que terminan en sitios distintos y se recolocan distinto en cada tramo (12 → 6 → 1) rompen la línea de lectura: el ojo no tiene un borde derecho ni una línea de cajas que seguir. Las secciones sí funcionan (aire + título), pero lo de dentro no tiene ritmo.
8. **Causa raíz.** La Fase 1 confía la jerarquía de anchos a **anchos absolutos** (columnas de 12, máximos fijos) y deja que la fila «se llene como caiga». El usuario pide lo contrario: la fila **se declara** y **se llena siempre**; la jerarquía se expresa como **proporción dentro de la fila**.

## 2. Modelo de distribución propuesto

1. **Dos niveles, ambos explícitos.** `GFormLayout` (pila vertical de filas, sustituye a `GFormGrid`) y `GFormRow` (campos que van juntos). El consumidor decide **qué va junto** poniéndolo en la misma fila; nada se empaqueta solo (como `FormLayout.Group` de Shopify Polaris).
2. **Un campo fuera de una fila es una fila de uno: ocupa el ancho entero.** Justificación: el usuario rechaza los huecos; un borde derecho único es la línea que guía la lectura (Stripe, Polaris, Atlassian); el ancho del formulario lo decide su contenedor (página, dialog, drawer), no cada campo. Un campo compacto suelto «se estira»: la guía de uso dice que lo compacto se **agrupa** con lo que le acompaña (Temperatura con los demás signos, CP con Colonia y Ciudad). No hay modo «con hueco».
3. **Tamaño = peso + mínimo.** Cada campo lleva un tamaño `xs | sm | md | lg` (por defecto `md`):

   | Tamaño | Peso en la fila | Mínimo útil | Típico |
   | --- | --- | --- | --- |
   | `xs` | 2 | `space × 20` (80px) | edad, %, núm. interior, extensión, frecuencia |
   | `sm` | 3 | `space × 32` (128px) | fecha, CP, RFC, temperatura con unidad |
   | `md` | 4 | `space × 40` (160px) | nombre, apellido, correo, ciudad, teléfono |
   | `lg` | 8 | `space × 60` (240px) | calle, razón social |

   Los pesos son los anchos de columna de la Fase 1 (de 12): **la jerarquía se conserva como proporción**. Calle | Ext. | Int. = 8 : 2 : 2; RFC | Razón social = 3 : 8; Correo | Teléfono | Ext. = 4 : 4 : 2. Un campo puede declarar un **mínimo propio** mayor (un fusionado de teléfono necesita sitio para el selector y el número: 200px; el segmentado de tres opciones, 232px). Los mínimos son constantes derivadas de `space` (como #130), no tokens.
4. **La fila siempre llena su ancho.** Cada línea de una fila reparte **todo** su ancho por pesos (menos las separaciones). Todas las filas y líneas terminan en el mismo borde derecho, a cualquier ancho.
5. **Adaptación por el ancho propio de la fila** (nunca el visor, como #69/#73/#130): si en una sola línea algún campo recibiría menos que su mínimo, la fila se **parte en líneas contiguas en orden del DOM**, eligiendo (a) el **menor número de líneas** posible y (b) entre esas, la **más holgada** (la que maximiza el menor cociente ancho/mínimo, que evita líneas con un campo apretado cuando hay alternativa). Cada línea vuelve a llenar el ancho. Sin `order`, sin `dense`: DOM = lectura = Tab = visual.
6. **Dos campos pequeños siguen juntos en móvil cuando caben sus mínimos.** No hay una regla aparte: a 360 (328px de contenido) Teléfono + Extensión, Núm. ext. + Núm. int., Uso del CFDI + CP, Presión + Frecuencia y Saturación + Peso + Estatura comparten línea; Nombre | Apellido (160 + 160 + 16 = 336 > 328) se apilan. A 375 (iPhone) Nombre | Apellido aún cabe en pareja (163px cada uno); se acepta: la regla es de contenido, no de dispositivo.
7. **`keep`** (opcional en `GFormRow`): la fila nunca se parte (partes de un `GFieldGroup`, Día · Mes · Año). Si no cabe, sus mínimos ceden antes que la fila (sin desborde a 320, verificado).
8. **Resultado verificado** (ver §9): signos vitales en **1** línea a 1280 y 960, **2** a 720 (Temperatura · Presión / FC · Sat. · Peso · Estatura) y **3** a 360 (Temperatura / Presión · FC / Sat. · Peso · Estatura); dirección: Calle sola y Ext. | Int. juntos a 360; ningún hueco en ninguna fila a ningún ancho.
9. **Antes de medir (SSR, sin JS):** una línea por campo (lo que ya hacía la Fase 1 en `narrow`); nunca desborda.

## 3. Alineación

1. **Pistas compartidas por línea:** cada línea de una fila define tres pistas, **etiqueta · caja · pie** (pie = ayuda + mensaje), y cada campo hijo las toma por *subgrid*. La etiqueta se apoya **abajo** de su pista: una etiqueta corta queda pegada a su caja aunque la vecina ocupe dos líneas. Todas las cajas de una línea comparten `top` con etiquetas largas, ayudas y mensajes (verificado, tolerancia 1px, en todos los anchos y estados).
2. **Pie en una sola pista, no dos.** Probé ayuda y mensaje en pistas separadas (como `g-form-row` de la Fase 1): el error de un campo quedaba despegado de su caja por la altura de la **ayuda del vecino**. Con un contenedor de pie (`__support`) por campo, ayuda y mensaje siguen pegados a su caja; la línea siguiente empieza tras el pie más alto y todas sus cajas vuelven a compartir línea. Cambia C12: la raíz de cada campo tiene **tres** hijos directos (etiqueta, caja, pie), no cuatro.
3. **Etiquetas: nunca recortadas.** Se parten si hace falta (WCAG 1.4.4/1.4.10; recortar escondería «(opcional)»); la pista absorbe la diferencia. Guía de contenido: etiquetas cortas en filas compartidas; la explicación va en la ayuda.
4. **Grupos con nombre que comparten fila no usan `<fieldset>`**: un `<legend>` no participa en la rejilla. El segmentado (Sexo) es `role="radiogroup"` + `aria-labelledby` hacia una etiqueta visible en la pista de etiqueta (patrón APG *Radio Group*), con radios nativos (flechas verificadas). `fieldset/legend` sigue para grupos que van en **su propia fila** (casillas de Avisos, `GFieldGroup`).
5. **Casillas e interruptores sueltos** van en su propia fila (no tienen caja que alinear); dentro de una fila ocuparían solo la pista de caja.
6. **Valor calculado (Edad):** no es una caja. Es un `<output for="fecha">` dentro de la caja de la fecha, a la derecha, como una unidad («12/05/1990 · 36 años»), enlazado por `aria-describedby` del campo de fecha y con `aria-live="polite"`. Desaparece el pozo negro y la fila Fecha | Sexo queda en dos campos. Si una app necesita mostrar un dato calculado aparte, es texto (`GDataList`/modo vista), no un campo de solo lectura vacío.

## 4. Campos fusionados (`GInputGroup`, nombre provisional; lima decide)

1. **Qué es:** una caja visual, **una** etiqueta visible, varias **partes** con foco propio. Precedentes: Polaris `TextField connectedLeft/Right`, Stripe (prefijo de país en el teléfono), Atlassian/Chakra `InputGroup`.
2. **Casos prototipados:** teléfono (país seleccionable + número), valor + unidad seleccionable (Temperatura 36.5 · °C/°F), moneda + importe (Copago MXN · 0.00 — solo estructura; la moneda con formato sigue en la ronda propia, #154), código + número (Folio: Serie · número), rango (Rango de edad 18 a 65 años; Presión arterial 120 / 80 mmHg). Estados: error en una parte, solo lectura, deshabilitado.
3. **Estructura:** raíz `role="group"` con `aria-labelledby` → etiqueta visible; `<label for>` apunta a la **parte principal** (el número, el valor, el importe; en rangos, la primera). Partes: `input` o `select` sin borde propio, separadas por una línea; separadores de texto («/», «a») y sufijos («mmHg», «años») `aria-hidden`, con su expansión accesible en la descripción («milímetros de mercurio»).
4. **Nombre accesible por parte** = etiqueta visible + nombre de la parte (texto oculto): «Teléfono» (principal), «Teléfono Código de país», «Temperatura Unidad», «Copago Moneda», «Folio de factura Serie», «Rango de edad desde / hasta», «Presión arterial (opcional) sistólica / diastólica». Incluir la etiqueta visible cumple 2.5.3 (*Label in Name*); el grupo da el contexto al entrar. Verificado con `getByRole(…, { name, exact })`.
5. **Foco:** un anillo **por parte**, dentro de la caja (la caja no se ilumina entera); Tab recorre las partes en orden; el selector conserva su teclado nativo.
6. **Mensajes:** un solo pie para el campo (ayuda + mensaje); todas las partes lo llevan en `aria-describedby`; solo la parte que falla lleva `aria-invalid` y una marca visual propia (barra inferior en el wireframe); el texto del mensaje dice qué parte corregir («Elige el código de país»). El resumen de errores enlaza a la parte inválida (como `GFieldGroup` hoy).
7. **Autocompletado:** `tel-country-code` en el selector, `tel-national` en el número, `tel-extension` en la extensión (campo aparte, en la misma fila: el número y su extensión son datos distintos y la extensión es opcional). Requiere que el selector sea un `<select>` nativo o que `GSelect` exponga uno (hoy es un `combobox` con `<input hidden>` y no participa del autocompletado, `form.md` §8): hallazgo L4.
8. **Anchos internos:** el selector mide su contenido; la parte principal crece; una parte corta (Serie) tiene ancho por caracteres. El mínimo del campo fusionado = el de su tamaño o la suma de sus partes, lo mayor.
9. **`GFieldGroup` se queda solo para preguntas compuestas con etiqueta por parte** (Contacto de emergencia: Nombre · Parentesco · Teléfono; fecha en tres partes, GOV.UK). Regla: **va siempre en su propia fila** (nunca junto a campos independientes), así su `<legend>` no puede bajar las cajas de nadie; dentro, sus partes usan el mismo motor de fila y comparten pistas (verificado). La receta de teléfono deja de usar `GFieldGroup`.

## 5. Flujo y ritmo

1. **Orden de lectura** = DOM = Tab = visual, verificado en el formulario mediano completo (29 paradas; el segmentado es una sola parada, flechas dentro).
2. **Ritmo vertical** (proporciones): etiqueta → caja 6; caja → pie 4; entre filas 20 (`--g-form-gap`); entre secciones 40 (`--g-form-section-gap`, 2× fila); cabecera de sección → primera fila 16. Las separaciones entre líneas de una fila partida son las mismas que entre filas: una fila partida se lee igual que dos filas.
3. **Secciones sin caja ni divisor**: título (16, seminegrita) + descripción opcional + insignia «Opcional»; la jerarquía la da el aire. Orden del mediano: Información básica → Contacto → Signos vitales → Datos fiscales (opcional) → Preferencias → acciones.
4. **Acciones al final**, alineadas al mismo borde derecho que las filas, estado a la izquierda («Cambios sin guardar»); primaria al final (#155). En contenedores estrechos (< `space × 105`) se apilan a ancho completo en el mismo orden del DOM.
5. **Cabecera de sección al lado** (`headerPlacement="auto"`, r01 §3.4) queda **fuera** de esta ronda: el formulario de captura se lee mejor de arriba abajo; para formularios de configuración se retoma en la Fase 3.

## 6. Adaptación (resumen por ancho del contenedor, formulario mediano)

| Contenedor | Nombres | Fecha · Sexo | Correo · Teléfono · Ext. | Signos vitales | Fiscales |
| --- | --- | --- | --- | --- | --- |
| 1280 / 960 | 1 línea (3) | 1 línea | 1 línea | 1 línea (6) | RFC · Razón / Régimen · CFDI · CP |
| 720 | 1 línea (3) | 1 línea | 1 línea | 2 líneas (Temperatura · Presión / FC · Sat. · Peso · Estatura) | igual |
| 480 | Nombre / Apellidos (1 + 2) | 1 línea | Correo / Tel. · Ext. | 2 líneas (como 720) | RFC / Razón; Régimen / CFDI · CP |
| 360 | 1 + 1 + 1 | Fecha / Sexo | Correo / Tel. · Ext. | 3 líneas (Temp. / Presión · FC / Sat. · Peso · Estatura) | RFC / Razón; Régimen / CFDI · CP |
| 320 | 1 + 1 + 1 | Fecha / Sexo | Correo / Tel. / Ext. | como 360 | todo apilado |

Cada línea llena el ancho en todos los casos (verificado). El reparto exacto depende de los mínimos de §2.3; si coco cambia `space`, todo escala con él.

## 7. API pública: qué se conserva, qué cambia, migración

La librería está en `draft`; se propone cambiar sin capa de compatibilidad, con avisos de desarrollo que digan qué usar.

| Hoy (Fase 1) | Propuesta r02 | Migración |
| --- | --- | --- |
| `GFormGrid` (12/6/1 columnas, `stack`, provee `block`) | **`GFormLayout`**: pila de filas; conserva `stack` (drawer: cada fila en una línea por campo), `density` y el contexto `block`; ya no tiene columnas | Renombrar; los hijos que tenían `g-form-w-*` y compartían fila se envuelven en `GFormRow` |
| clase `g-form-row` (fila unida, 1–3 hijos, *subgrid*, no salta) | **`GFormRow`** (componente: mide su ancho, calcula líneas, aplica pistas). Prop `keep` | La clase desaparece; `<div class="g-form-row">` → `<GFormRow>`; sin límite de 3 hijos (aviso a partir de 6) |
| `g-form-w-{xs\|sm\|md\|lg\|full}` = columnas de 12 | **Mismo nombre, nuevo significado**: tamaño = peso + mínimo **dentro de una `GFormRow`**; fuera de una fila no hace nada (el campo ocupa el ancho). `full` desaparece (es el comportamiento de un campo suelto). Un mínimo propio vía `--g-form-min` o prop `minWidth` (lima) | Mantener las clases; quitar `g-form-w-full` |
| `g-form-break` | **Se elimina**: una fila nueva es una `GFormRow` nueva | Partir el contenido en filas |
| `g-form-part-xs\|sm` (partes de `GFieldGroup`) | Se eliminan: las partes usan `g-form-w-*` como cualquier hijo de fila | Renombrar |
| `--g-form-max-xs`, `--g-form-max-sm` (tokens) | **Se retiran**: ya no hay máximos | Quitar de `defaults.css`, `tokens.md` §21, `defaults.js` del CLI |
| `--g-form-gap`, `--g-form-column-gap`, `--g-form-section-gap` | Se conservan (fila / columna / sección) | — |
| `GFieldGroup` | Se conserva para preguntas compuestas con etiqueta por parte; **siempre en su propia fila**; partes dentro de un motor de fila (`keep` opcional) | Recetas de teléfono pasan a `GInputGroup` |
| Receta de teléfono con `GFieldGroup` | **`GInputGroup`** (fusionado) + Extensión como campo aparte en la misma fila | Reescribir la receta |
| Edad como `GInput readonly suffix="años"` | Valor calculado como `<output>` en la caja del campo del que depende (o texto fuera del formulario) | Cambiar el ejemplo del playground |
| Campos: hijos directos etiqueta · caja · ayuda · mensaje (C12) | Etiqueta · caja · **pie** (`__support` con ayuda y mensaje) | bruno cambia el marcado de los seis campos; coco, sus reglas de pista |

## 8. Hallazgos para lima

| # | Hallazgo | Sev. | Propuesta |
| --- | --- | --- | --- |
| L1 | **Contrato de `GFormLayout` y `GFormRow`** | Alta | `GFormRow`: `keep` (Boolean), slot por defecto; mide su ancho (`ResizeObserver`), calcula líneas (§2.5) y coloca a los hijos (columnas = bordes de todas las líneas; filas = 3 pistas por línea + separación). Expone `data-lines`. Aviso con más de 6 hijos o con `order`. Sustituye a `g-form-row` y `g-form-break` |
| L2 | **Pesos y mínimos** | Alta | Tabla de §2.3 como constantes derivadas de `space` (sin token). Mínimo propio por campo (prop o propiedad CSS pública de solo lectura de entrada, a decidir). Retirar `--g-form-max-xs/sm` (#167) |
| L3 | **Pistas: tres, no cuatro** (C12) | Alta | Raíz de cada campo con etiqueta, caja y pie (`g-<tag>__support` con ayuda y mensaje); la región `__message` sigue dentro, siempre presente |
| L4 | **`GInputGroup`** (nombre a decidir) | Alta | Raíz `role="group"` + `aria-labelledby`; `label` (visible, `for` → parte principal), `hint`, `error`/`warning`/`valid`, `name` (clave en `errors`), `required`, `readonly`, `disabled`, `density`, tamaño. Partes como hijos (`GInputGroupPart`, o `GInput`/`GSelect` en modo «parte» por contexto) con `partLabel` (nombre oculto), `principal`. Separador y sufijo de texto con expansión accesible. Requiere un selector compatible con autocompletado (`<select>` nativo o `GSelect` con `<select>` oculto sincronizado) para `tel-country-code` |
| L5 | **`GFieldGroup` en su propia fila** | Media | Regla de contrato y aviso en desarrollo si es hijo de una `GFormRow` con más campos; partes en una `GFormRow` interna |
| L6 | **Valor calculado** | Media | Documentar el patrón `<output>` dentro de la caja (como sufijo dinámico de `GInput`, ¿prop `output` o slot `suffix` con `<output>`?) y desaconsejar `readonly` vacío para datos derivados |
| L7 | **Segmentado en fila** | Media (Fase 2) | `GRadioGroup appearance="segmented"` con raíz `role="radiogroup"` + `aria-labelledby` (no `fieldset`) para que su etiqueta entre en la pista; las demás apariencias pueden seguir con `fieldset` porque van en su propia fila |
| L8 | **Solo lectura en oscuro** (para coco) | Media | `surface-sunken` en oscuro es más oscuro que la superficie y, con las demás cajas transparentes, se lee como un hueco negro. Con Edad fuera, el caso sigue existiendo en el modo vista; coco revisa el relleno de solo lectura en oscuro |
| L9 | **Acciones en el mismo borde** | Baja | `GFormActions` termina en el borde derecho del layout (ya lo hace); el apilado se mide con su propio ancho |
| L10 | **Drawer** | Baja | `GFormLayout stack`: toda fila se comporta como líneas de un campo (r01 §7.3: una columna fija) |

## 9. Comprobaciones ejecutadas

`node design/lab/form/r02/verificar.mjs` (Chromium, Playwright de `theme-playground`): **57/57**.

- **Bordes y alineación:** contenedor a 1280, 960, 720, 480, 360 y 320 × cuatro estados (limpio; ayuda + error + advertencia + válido; etiquetas largas; ambas) en los cinco formularios: cada hijo del layout y cada línea de cada fila termina en el borde derecho (±1px); todas las cajas de cada línea comparten `top` (±1px); sin solapes; orden visual = DOM en cada línea.
- **Líneas esperadas:** signos vitales 1 / 2 / 3 líneas a 1280 / 720 / 360.
- **Ventana** 320, 360, 480, 720, 960, 1280 con contenedor libre: sin desborde de página ni de marcos; mismas comprobaciones de borde y alineación.
- **Teclado:** Tab en el mediano = orden del DOM (con una parada por radiogroup); flecha derecha mueve la selección del segmentado.
- **Nombres accesibles por parte** en los fusionados (§4.4), grupo «Teléfono», radiogroup «Sexo», `autocomplete` del teléfono; anillo de foco en la parte y no en la caja; error en una parte → `aria-invalid` solo en esa parte y mensaje del grupo en su `aria-describedby`.
- **Edad:** escribir 12/05/1990 → «36 años» en el `<output>`, enlazado desde la fecha.
- Consola limpia.

## 10. Qué NO verifiqué

- **Firefox y WebKit** (subgrid con filas calculadas, `:has()` en el anillo por parte, `<output>` dentro de la caja).
- **Lector de pantalla real**: lectura del grupo + nombre de parte (¿«Teléfono, grupo; Teléfono Código de país»: verbosidad aceptable?), `<output>` con `polite` al escribir la fecha, radiogroup sin `fieldset`.
- **Componentes reales**: el motor de fila está en JS del prototipo; el selector es `<select>` nativo; `GSelect` no se probó como parte.
- **Autocompletado real** del navegador sobre país + número.
- Densidades `comfortable`/`compact` y `pointer: coarse` (las cajas crecen en alto; el modelo no depende del alto, pero no se midió).
- Zoom 200/400 % y `forced-colors` del anillo por parte.
- Rendimiento con muchas filas (un `ResizeObserver` por fila).
- A 360 el marcador de posición del teléfono se recorta («951 123 456…») con el selector «MX +52»: aceptable (es un ejemplo, no un valor), pero un selector que muestre solo «+52» ganaría sitio; lo decide el contrato de `GInputGroup`.

## 11. Preguntas de producto realmente abiertas

Ninguna bloqueante. Todo lo anterior deriva del brief del usuario («sin huecos», «qué va junto», «dos en uno», «cajas en la misma línea») o de un estándar (APG, WCAG, GOV.UK, Polaris/Stripe). Lo único que conviene confirmar al ver el prototipo:

1. **Un campo compacto suelto se estira a todo el ancho** (§2.2). Es la consecuencia directa de «sin huecos»; la alternativa (dejar que conserve su ancho) reintroduce el borde dentado. Propuesta: estirarlo y guiar al consumidor a agruparlo. ¿De acuerdo?
