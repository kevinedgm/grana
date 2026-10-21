# Declaración: moneda y precio (propuestas `GPrice` + `formatPrice` + `GPriceScope`, y `GNumberField currency`), r01

> kiwi, 2026-10-21. **Estado: en revisión.** Lo que deriva de WCAG, APG y los contratos vigentes se aprueba solo. La forma del precio de lectura es decisión del usuario (pregunta al final). Prototipo: `index.html?c=base|A|B|C` (`&lang=en-US`, `&theme=dark`, `&dir=rtl`, `&w=<px>`). Código del banco: `price.js` y `price.css`, solo tokens. Verificación: `node design/lab/price/r01/verificar.mjs`, puerto 4234; **312/312** en Chromium, Firefox y WebKit.

## Anatomía (base)

1. **Tres piezas y una frontera.**
   - `formatPrice(money, opciones)` es una utilidad pura y exportada que devuelve `{ text, spoken, parts }`. Es **la regla**, y la usan `GPrice`, el slot `day` de `GDatePicker`, `GSlider`, los correos, el SSR y la aplicación.
   - `GPrice` es el componente de lectura: la estructura visible y la frase accesible.
   - `GPriceScope` es la región que declara su moneda (concepto B).
   - **La entrada no es un componente nuevo:** es `GNumberField` con `currency` (punto 14).
2. **Árbol de `GPrice`:**
   ```html
   <span class="g-price g-price--md" data-currency="MXN">
     <span class="g-price__visual" aria-hidden="true">
       <span class="g-price__lead">desde</span>
       <span class="g-price__amount" dir="ltr"><span class="g-price__symbol">$</span><span class="g-price__number">1,850</span><span class="g-price__code"> MXN</span></span>
       <span class="g-price__unit">/ noche</span>
       <s class="g-price__compare">…$2,300…</s>
     </span>
     <span class="g-price__spoken">desde 1,850 pesos mexicanos por noche. Antes: 2,300 pesos mexicanos</span>  <!-- patrón de texto oculto -->
   </span>
   ```
   No usa `aria-label`, porque un `span` genérico no admite nombre (ARIA 1.2). Usa el patrón de texto oculto, permitido por las reglas de Grana. Medido con `ariaSnapshot` en los tres motores: el árbol solo contiene la frase, sin «$» ni «MXN».
3. **Sin duplicado cuando no hace falta.** «Gratis» y «Precio a consultar» son texto llano que se lee tal cual: ni `aria-hidden` ni texto oculto (medido).
4. **Modelo compartido:** `Money = { amount: number, currency: string, approximate?: boolean }`.
   - `amount` va en **unidades mayores** (1850.5), igual que el modelo de `GNumberField`.
   - `currency` es un código ISO 4217.
   - `approximate` lo pone la aplicación cuando el importe es una conversión suya.
   - Grana nunca convierte divisas.

## Decisiones de la base

5. **La lectura siempre lleva el nombre de la moneda.** Sale de `Intl.NumberFormat(locale, { style: 'currency', currencyDisplay: 'name', trailingZeroDisplay: 'stripIfInteger' })`, por ejemplo «1,850 pesos mexicanos». El lector nunca dice «dólar» por un «$» de pesos. Sin «,00» en los enteros.
6. **Lo visible es corto, y el código aparece solo cuando hace falta (`display="auto"`).**
   - Se muestra el símbolo del idioma. Se añade el código ISO **solo si ese símbolo es de varias monedas**.
   - Medido: en `es-MX`, MXN se ve «$1,850 MXN»; en `en-US`, MXN se ve «MX$1,850» (ya es inequívoco, sin código); USD en `es-MX` se ve «USD 95» (Intl ya lo dice); EUR en `de-DE` se ve «1.850 €».
   - Los símbolos compartidos **salen de los datos de `Intl`** y no de una lista escrita a mano: `$ ¥ kr £ ₩ Rs` en Chromium, más `Bs` en Firefox y WebKit.
   - Calcularlos al vuelo cuesta entre 5 y 30 ms según el motor, y la tabla varía con la versión de CLDR del navegador. Por eso se propone generarla en el build (P-L4).
   - Otros valores de `display`: `symbol`, `code` y `none`. `none` es para el día del calendario, donde la leyenda ya dice la moneda.
7. **Decimales de la moneda, no «dos».** Salen de `resolvedOptions().maximumFractionDigits`: MXN 2, JPY 0 y KWD 3, medidos.
   - `cents="auto"` (por defecto) no pinta «,00» en los enteros.
   - `cents="always"` es para el carrito y el checkout: una columna de importes debe tener los mismos decimales.
   - `cents="never"` redondea a enteros y solo se permite en `xs` (calendario).
8. **Partes con su texto.**
   - `lead` es el texto previo («desde»).
   - `unit` + `unitLabel` siguen la regla de `prefix`/`prefixLabel` de #166: «/ noche» se ve y «por noche» se lee.
   - `max` (Money de la misma moneda) da un rango: «$900 a $1,400 MXN» se lee «900 a 1,400 pesos mexicanos».
   - **No se usa `formatRange` para la lectura.** Devuelve «900-1,400 pesos mexicanos», y el guion se lee «menos». La plantilla es `labels.range` de la aplicación.
9. **Referencia (`compareAt`) en la base:** `<s>` visible y, en la lectura, «Antes: 2,300 pesos mexicanos». La etiqueta es `compareLabel` o `labels.before`. El precio actual se lee **primero**.
10. **Negativos (descuentos):** el signo va delante del símbolo con el menos tipográfico U+2212: «−$200.00 MXN». En la lectura queda el «-» de `Intl`, que los lectores dicen «menos».
11. **Cifras tabulares** (`font-variant-numeric: tabular-nums lining-nums`) en todos los tamaños. En la carta, los precios quedan alineados al final de la fila (medido: un solo borde derecho para los cinco).
12. **Tamaños** (`size`), cada uno sobre un estilo de texto del tema. Lo secundario (lead, unidad, código, referencia) va un escalón abajo y nunca por debajo de 12 px (medido):
   - `xs`: `caption`, para el día del calendario.
   - `sm`: `body-sm`, para la carta y las líneas del carrito.
   - `md`: `title-sm`, para la tarjeta.
   - `lg`: `title`, para el total del carrito.
   - `xl`: `display`, para el plan de precios.
13. **Ningún precio habla solo.** No hay región viva por precio: en una lista serían veinte anuncios. Cuando cambian (A y B), lo anuncia **el control que provocó el cambio** («Noches», «Ver precios en»), que ya es un control con estado. Medido: la página no emite nada.

## Campo de moneda: extensión de `GNumberField` (no componente nuevo)

14. **`GNumberField` con `currency` (String ISO 4217, reactiva).** El prototipo monta el **`GNumberField` real** y solo le pasa props derivadas, sin motor nuevo:
   - `precision` = los decimales de la moneda;
   - `prefix` o `suffix` según el lado del símbolo en `formatToParts` del idioma («$» delante en `es-MX`, «€» detrás en `de-DE`);
   - `*Label` = el nombre de la moneda en plural («pesos mexicanos»);
   - el código detrás del símbolo si este es ambiguo («$ MXN»).

   Medido en los tres motores:
   - `inputmode` es `decimal` con MXN y `numeric` con JPY;
   - mientras se escribe no hay miles ni símbolo («2500.5»);
   - al salir queda «2,500.50», con «1.850,50» en `de-DE`;
   - el canónico oculto es `2500.5`;
   - la descripción lleva «pesos mexicanos»;
   - el símbolo va pegado a la cifra por la P1 de `GNumberField`.
15. **Se formatea al salir, no mientras se escribe.** Es la regla de `GNumberField`: formatear al teclear mueve el cursor y rompe el eco del lector. El encargo dejaba abierto «mientras se escribe o al salir»; se elige **al salir** por coherencia y por 3.3.x.
16. **Modelo:** `v-model` sigue siendo `Number | null` y la moneda es una prop. Así no cambia el tipo del modelo de `GNumberField` y la mayoría de los formularios tienen una moneda fija. La aplicación compone `{ amount, currency }` si la necesita.
   - **Moneda elegible:** receta de dos preguntas en una `GFormRow` (`GSelect` «Moneda» + `GNumberField currency`), como la unidad elegible (#314). El prototipo la monta tal cual.
   - Si un producto pide más, `v-model:currency` con selector integrado queda **reservado**, junto a `GInputGroupNumber` (#314).
17. **Envío nativo:** el canónico del importe lleva `name`. La moneda va en su propio campo (el `GSelect` con `name`) o, si es fija, en un oculto de la aplicación. No se propone un segundo oculto automático porque su nombre sería una convención inventada.
18. **`min`/`max`:** los de `GNumberField`, sin cambios. Grana no valida (#157).

## Estados

| Estado | Precio de lectura | Campo |
| --- | --- | --- |
| Normal | Visible corto + frase | `GNumberField` |
| Sin valor | «Precio a consultar» (app) | Vacío, sin `aria-valuenow` |
| Cero | «Gratis» (app); con referencia, «Gratis» + referencia | 0 formateado |
| Aproximado | «aprox.» delante, en lo visible y en la lectura | — |
| Negativo | «−$200.00 MXN» | Lo de `GNumberField` con `min` |
| Error, deshabilitado, solo lectura | No aplican (no es control) | Los de `GNumberField` |
| Carga | La plantilla de `GLoadRegion` (molde): la cifra es texto | — |

## Teclado y ARIA

19. `GPrice` y `GPriceScope` **no son enfocables** ni tienen rol. La leyenda de B es un `<p>` y su sello es `aria-hidden`, porque la leyenda ya lo dice en texto.
20. Dentro de una `GCard interaction="link"`, el precio entra en la descripción de la tarjeta por su texto. No hay interactivos dentro del precio. Por eso B pone el selector de moneda **fuera** de las tarjetas, en la región.
21. El campo usa el teclado de `GNumberField` (APG *Spinbutton*). `steppers` está apagado por defecto en precios, aunque se permite.

## A · La cuenta

La tarjeta dice **lo que te va a costar lo que pediste**. Con `total: { value: Money, label }` (lo da la aplicación), el total va arriba en grande («Total $3,700 MXN por 2 noches») y la tarifa queda como contexto («desde $1,850 MXN / noche»). La lectura empieza por el total.

### Qué lo hace distinto (A)
- La persona ve el coste real de su estancia sin multiplicar. El usuario final es el viajero que compara: es el problema que llevó a las plataformas a mostrar «precio total», y en México PROFECO exige precios totales.
- **El total no se calcula en Grana:** el viernes y el sábado cuestan más. Medido: con 3 noches el total es 5,950 y no 3 × 1,850.
- Al cambiar las noches, **solo ruedan las cifras que cambian** (P2 de `GNumberField` reutilizada; medido: de 3,700 a 5,950 ruedan menos posiciones de las que tiene el total). Con movimiento reducido no se crea la capa (medido). La capa se retira al terminar.

### Gana y arriesga
Gana claridad, que es lo que más pesa en la decisión de reservar. Arriesga que necesita un total por oferta y por consulta: es un dato de la aplicación, que lo tiene en el flujo de reserva (B3 y B5) pero no en un listado sin fechas. Sin `total`, A es la base.

## B · La moneda se dice una vez

`GPriceScope currency="MXN"` declara la moneda de una región (la carta, el listado, el carrito) con una **leyenda con sello**: «MXN · Precios en pesos mexicanos (MXN) · IVA incluido». Dentro, el símbolo basta («$185») y **solo lo extranjero conserva su código** («USD 190.00» en un carrito MXN). Si la aplicación da alternativas (`value: Money[]`), el control «Ver precios en» de la región cambia **todos** sus precios a la vez. Lo convertido se ve y se lee «aprox.».

### Qué lo hace distinto (B)
- La carta de un restaurante deja de repetir «MXN» en cada plato. Es menos ruido para leer y para el lector de pantalla, que sigue oyendo «pesos mexicanos» en cada precio.
- La mezcla de monedas nunca queda ambigua: la región sabe cuál es la suya y marca lo demás.
- La moneda se elige **una vez por región** y no se recarga la página. Grana no convierte: elige entre importes que la aplicación ya calculó.

### Gana y arriesga
Gana una página limpia y correcta con monedas mezcladas, y un selector de moneda gratis cuando la aplicación tiene los importes. Arriesga una pieza más (`GPriceScope`, provide/inject) y que un precio fuera de toda región vuelva a la regla de la base.

## C · El antes y el ahora

La referencia **no se tacha**. Va encima del precio, dice **qué es** (`compareLabel`: «Temporada alta») y una flecha (`arrow-right` de Lucide, invertida en RTL) la lleva al precio actual. El ahorro va en texto: «Ahorras $450», calculado con enteros escalados a los decimales de la moneda, sin error de coma flotante. Se lee igual que se ve: «desde 1,850 pesos mexicanos por noche. Temporada alta: 2,300 pesos mexicanos. Ahorras 450 pesos mexicanos».

### Qué lo hace distinto (C)
- El tachado es el único elemento de un precio que el lector no anuncia y que suele fallar en contraste. C lo sustituye por una frase que todo el mundo lee igual. Medido: ≥ 4.5:1 en claro y oscuro, en la referencia, el ahorro y la cifra.
- **Una referencia honesta:** obliga a nombrar con qué se compara. Propuesta: aviso de desarrollo si falta `compareLabel` (P-L5). Así se evita el «antes» inventado, que es un patrón oscuro de precio.

### Gana y arriesga
Gana accesibilidad y honestidad en las ofertas. Arriesga ocupar una línea más en la tarjeta y que algún comercio quiera el tachado clásico por costumbre (la base lo conserva).

## Comparativa

| | Base | A · La cuenta | B · La moneda una vez | C · El antes y el ahora |
| --- | --- | --- | --- | --- |
| Problema que resuelve | Lectura y ambigüedad del «$» | Coste real de lo pedido | Monedas mezcladas; ruido de «MXN» | Tachado inaudible y sin contraste |
| Necesita de la app | `Money` | + `total` por consulta | + moneda de la región; alternativas opcionales | + `compareLabel` |
| Pieza nueva | `GPrice`, `formatPrice` | prop `total` | `GPriceScope` | ninguna (forma de `compareAt`) |
| Movimiento | No | Cifras que ruedan (P2) | No | No |
| Riesgo | Ninguno nuevo | Dato que no siempre existe | Una pieza más | Una línea más en la tarjeta |
| Bloques que la usan | Todos | B2 a B5, E7 a E9 | M6, B9, E2, E7, Header | E1, E11, B2 |

## Recomendación

**Base + B + C por defecto, con A como opción (`total`).** Las tres no compiten: atacan problemas distintos. B y C corrigen fallos de accesibilidad y de claridad que hoy tiene cualquier página de precios, así que deben ser la conducta normal (C sustituye al tachado y la base lo conserva solo con `compareStyle="strike"`, si el usuario lo quiere). A depende de un dato que la aplicación solo tiene dentro del flujo de reserva, así que se activa cuando llega ese dato.

## Qué lo hace distinto (resumen)

**Un precio que se dice como se habla y que nunca miente sobre su moneda.**
- El código ISO aparece solo cuando el símbolo es ambiguo, y lo decide la ambigüedad real de los datos de `Intl`, no una lista.
- La región dice la moneda una vez y marca lo extranjero.
- La referencia se nombra en lugar de tacharse.
- El total de lo que pediste rueda al cambiar las noches.
- El campo de moneda no es un componente más: es el `GNumberField` que ya existe, con su símbolo pegado a la cifra.

## Rúbrica de movimiento (`docs/documentacion/rubrica-movimiento.md`, solo A)

| Dimensión | Estado | Evidencia | Riesgo | Recomendación |
| --- | --- | --- | --- | --- |
| Propósito | Cumple | Señala qué parte del total cambió | Bajo | — |
| Comodidad visual | Cumple | Solo las posiciones que cambian, `--g-duration-press` | Bajo | — |
| Estabilidad | Cumple | El texto nuevo está desde el primer cuadro; la capa no cambia el ancho (cifras tabulares) | Bajo | — |
| Interrumpible | Cumple | Un cambio nuevo sustituye la capa | Bajo | Usar la regla de retirada de P2 (`animationend` o retirada inmediata sin animación calculada) |
| Control | Cumple | Solo ocurre por gesto de la persona («Noches») | — | — |
| Accesibilidad | Cumple | Con movimiento reducido no se crea la capa (medido); la capa es `aria-hidden` | — | — |
| Rendimiento | No verificable | No se midió con 50 tarjetas | Medio | Que bruno mida una lista larga |

## Hallazgos para lima

- **P-L1 · `formatPrice` exportada** desde `@grana/vue`: `formatPrice(money, { locale, display, cents, unit, unitLabel, lead, compareAt, compareLabel, max, labels }) → { text, spoken, parts }`. Es la regla compartida de M-L1. Funciona en SSR sin `document`. Con `locale` ausente, igual que `GNumberField`: `lang` del ancestro (en el componente) o `navigator.language`.
- **P-L2 · `GPrice`** con las props de los puntos 6 a 12, `labels` sin valores por defecto (#226: `free`, `onRequest`, `before`, `range`, `saving`, `approx`, `total`) y avisos de desarrollo: moneda que `Intl` rechaza; `max` o `compareAt` en otra moneda; `cents="never"` fuera de `xs`; `compareAt` menor o igual que `value`.
- **P-L3 · `GPriceScope`** (B): `currency`, `view` (alternativa elegida, `v-model:view` opcional), `legend` y `taxes`. Provide/inject: un precio dentro con la misma moneda no lleva código. Que sea SSR-seguro: la moneda la declara la aplicación y no se cuentan los precios hijos.
- **P-L4 · Tabla de símbolos compartidos generada en el build** (script de bruno desde `Intl.supportedValuesOf('currency')` + `narrowSymbol`), vigilada por una prueba. Calcularla en el navegador cuesta entre 5 y 30 ms y varía con CLDR (`Bs` aparece en Firefox y WebKit y no en Chromium).
- **P-L5 · Referencia honesta (C):** `compareLabel` recomendado, con aviso si falta, y `compareStyle` `trace` (C, por defecto si se adopta) o `strike` (base).
- **P-L6 · El día de `GDatePicker` pierde el precio.** El slot `day` no entra en el nombre accesible: medido en los tres motores, el nombre es «miércoles, 21 de octubre de 2026, hoy» y no lleva «1,850». Propuesta: `dayDescription(iso) → String` (la aplicación usa `formatPrice(...).spoken`), añadida al `aria-label` tras los sufijos de estado. Otro problema visual: el círculo del día (y el anillo de «hoy») no tiene sitio para una segunda línea, y a 320 px las cifras de días vecinos se tocan. Para coco: una forma del día con precio (más alta, o cifras compactas con `notation: 'compact'` por debajo de un ancho).
- **P-L7 · `GNumberField currency`:** `precision` derivada (la explícita gana), símbolo y lado desde `formatToParts`, `*Label` con el nombre en plural, código si es ambiguo, `inputmode` derivado. Dos defectos medidos:
  - **Cambiar la moneda no redondea el modelo.** Con 2500.5 MXN y cambio a JPY, el texto dice «2,501» pero el modelo sigue en 2500.5 (los tres motores). Lo que se ve y lo que se envía no coinciden. Propuesta: al cambiar `precision` (o `currency`), redondear el modelo y emitir, como ya hace al escribir.
  - **El pegado con símbolo se rechaza:** «$1,850.00 MXN» deja el campo vacío. Propuesta: con `currency`, `parsePasted` quita símbolo, código y nombre de la moneda antes de sus cuatro reglas.
- **P-L8 · `GSlider format` con moneda:** que su `aria-valuetext` use la lectura de `formatPrice` (nombre de la moneda) y no el símbolo.
- **P-L9 · Paquete:** `formatPrice` y `GPrice` son pequeños pero los usarán casi todos los bloques. Hay que valorarlo con #506: principal con compuerta (≤ 1,5 KiB) o entrada `@grana/vue/price`. `GPriceScope` va con `GPrice`.
- **P-L10 · Tokens:** ninguno nuevo. El sello de B usa `border-strong` y el ahorro de C usa `success-soft`/`on-success-soft`.
- **P-L11 · Tipos compartidos** para `blocks/types.ts`: `Money` (punto 4), `PriceTotal = { value: Money | Money[], label: string }`, y `value: Money | Money[] | null` en `GPrice`.

## Hallazgos para otros roles

- **bruno:** en Firefox (Playwright), Tab desde el último campo enfocable no saca el foco de la página. El banco usa `blur()` en ese caso. Es un detalle de la prueba, no del componente.
- **mora-docs:** recetas «Precio en `GMetric`/`GSummary` con `formatPrice`», «Moneda elegible en una `GFormRow`» y «Precios en minor units (céntimos enteros, Stripe) → `amount / 10 ** digits`».

## Pregunta para el usuario

**¿Qué forma lleva el precio de Grana?**
1. **(Recomendada) Base + B + C por defecto, con A como opción:** la moneda se dice una vez por región, la referencia se nombra en vez de tacharse (el tachado queda como `compareStyle="strike"`) y el total de lo pedido aparece cuando la aplicación lo da.
2. Base + B, con el tachado clásico como referencia por defecto y C como opción.
3. Solo la base (`GPrice` + `formatPrice`); A, B y C reservados.

Pregunta de alcance, que no bloquea: ¿el campo de moneda va como `GNumberField currency` (recomendado) o como un `GCurrencyField` aparte?

## Comprobaciones

`verificar.mjs`, **312/312** (104 por motor, en Chromium, Firefox y WebKit) sobre el `dist/` actual. Cubre:
- **Base:** lectura de 9 casos y del caso árabe; `aria-hidden`; `ariaSnapshot`; tabla de ambigüedad; carta alineada; contraste ≥ 4.5:1 de todas las partes; texto ≥ 12 px.
- **Calendario:** el precio cabe en la celda y no cambia su tamaño; el nombre del día no lleva el precio (P-L6).
- **A:** total de la aplicación, cifras que ruedan, movimiento reducido, retirada de la capa, sin región viva.
- **B:** leyenda, sin código dentro, lo extranjero con código, cambio de vista en bloque, «aprox.», contraste del sello.
- **C, en claro y oscuro:** sin `<s>`, ahorro, lectura, orden y contraste.
- **Campo:** `inputmode`, descripción, escritura, formato al salir, canónico, modelo, JPY, `de-DE`, P1.
- **Reflujo** a 320 px en los cuatro conceptos, y la página en inglés.

**No verificado:**
- lector de pantalla real (VoiceOver, NVDA): cómo pronuncia «1,850 pesos mexicanos» y el «-» de los negativos;
- teléfono real;
- zoom del navegador al 200–400 % (se probó el reflujo a 320 px, no el zoom);
- `forced-colors` real (solo hay regla CSS);
- rendimiento con listas largas;
- temas del CLI distintos del de por defecto;
- RTL de página completa (solo el caso `ar-EG` en línea).

## Cumplimientos / Correcciones / Pendientes

**Cumplimientos:**
- Se revisaron los solapes (`GNumberField`, `GSlider`, `GMetric`, `GSummary`, `GDatePicker`, `GCard`) y no se duplica nada: la entrada es una extensión de `GNumberField` y el precio de lectura es una pieza nueva pequeña con una utilidad compartida.
- Base y A/B/C con los tokens reales y los componentes reales de `dist/`; auditoría previa en `brief.md`; rúbrica de movimiento para A; iconos solo de Lucide (`arrow-right`).

**Correcciones:**
- Frente al encargo, el campo **no formatea mientras se escribe** (punto 15) y la moneda no va en el modelo (punto 16).
- En el propio banco: el reparto de la rejilla desbordaba a 320 px (`min-inline-size: 0`) y el orden del DOM de C no coincidía con el visual. Las dos cosas están corregidas y medidas.

**Pendientes:**
- La elección del usuario.
- lima: P-L1 a P-L11.
- coco: forma del día con precio (P-L6).
- bruno: los dos defectos de P-L7 y la tabla de P-L4.
- Lo no verificado de arriba.
