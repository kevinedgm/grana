# Contrato · Moneda y precio (`formatPrice`, `GPrice`, `GPriceScope`; el campo es `GNumberField currency`)

**Dueño:** lima · **Estado:** contratado (DECISIONS.md **#768 a #779**, 2026-10-21; enmiendas en `number-field.md` «Moneda (`currency`)», `datepicker.md` «Precio y otros datos del día», `slider.md` «Moneda en la lectura»; `api.md` «Paquete, entradas y tipos» y «Dinero y precio»; `tokens.md` §54; `icons.md` v0.14) · **Basado en:** `design/lab/price/r01/` (kiwi, commit a7412d0: `brief.md`, `declaracion.md` con 21 decisiones de base, conceptos A/B/C, rúbrica de movimiento de A y hallazgos P-L1 a P-L11, `index.html`, `price.css`, `price.js`, `verificar.mjs` 312/312 en Chromium, Firefox y WebKit) · **Ronda:** #154 adelantada (#745 punto 1), lote 1 de Grana Blocks (#767)
**Tags:** `g-price`, `g-price-scope` · **Categoría:** presentación de datos · **Paquete:** entrada propia **`@grana/vue/price`** (#776)

**Componente complejo** (CLAUDE.md, «Modelos por rol»: lleva un motor propio de formato y lectura, compone con `GNumberField`, `GDatePicker`, `GSlider` y `GCard`, y A reutiliza la P2 de `GNumberField`): **coco y bruno en Opus**.

## Promesa

**Un precio que se dice como se habla y que nunca miente sobre su moneda.** Lo visible es corto («$1,850 MXN / noche»); lo que oye el lector es la frase completa («desde 1,850 pesos mexicanos por noche»). El código ISO aparece solo cuando el símbolo es ambiguo, la región dice su moneda una vez, la referencia se nombra en vez de tacharse y el total de lo pedido aparece cuando la aplicación lo da.

**Forma (decisión del usuario del 2026-10-21, #768):** «Opción 1: base + B (la moneda se dice una vez) + C (el antes y el ahora) por defecto, A (la cuenta) como opción `total`. El campo como `GNumberField currency`.»

## Principios

1. **Una sola regla, tres piezas** (#769). `formatPrice` es la regla (utilidad pura y exportada); `GPrice` la pinta; `GPriceScope` declara la moneda de una región. El campo de captura **no** es un componente nuevo: es `GNumberField` con `currency` (`number-field.md` «Moneda»).
2. **Grana nunca convierte divisas, nunca calcula totales ni impuestos.** La aplicación da los importes (`Money`), las alternativas en otras monedas, marcadas `approximate`, y el total de lo pedido. Grana elige entre lo que recibe, lo formatea y lo lee.
3. **Lo visible es `aria-hidden` y la lectura es texto oculto** (patrón de texto oculto accesible), nunca `aria-label` en un `span` (ARIA 1.2 no le da nombre). «Gratis» y «Precio a consultar» son texto llano: ni duplicado ni oculto.
4. **La lectura siempre lleva el nombre de la moneda** («1,850 pesos mexicanos»): el lector nunca dice «dólar» por un «$» de pesos.
5. **Ningún precio habla solo** (#770): sin región viva propia. Cuando los precios cambian (A, B), lo anuncia el control de la aplicación que provocó el cambio.
6. **Sin textos propios** (#226): todos los textos («Gratis», «Antes», «{min} a {max}», «Ahorras {amount}», «aprox.», «Total», la leyenda) los da la aplicación en `labels`.
7. **Sin conversiones de coma flotante visibles:** restas y redondeos con enteros escalados a los decimales de la moneda.

## Qué lo hace distinto (#768; regla «Personalidad e innovación»)

- **El código ISO lo decide la ambigüedad real**, no una lista escrita a mano: una tabla de símbolos que comparten varias monedas, generada desde los datos de `Intl` (#770).
- **B · La moneda se dice una vez:** la región declara su moneda con una leyenda con sello; dentro, el símbolo basta y solo lo extranjero conserva su código. Si la aplicación da alternativas, la región cambia todos sus precios a la vez, marcados «aprox.».
- **C · El antes y el ahora:** la referencia **no se tacha**. Va encima del precio, dice qué es («Temporada alta»), una flecha la lleva al precio actual y el ahorro va en texto. Se lee igual que se ve. Obliga a nombrar con qué se compara: el «antes» inventado es un patrón oscuro.
- **A · La cuenta (opción):** con el total que da la aplicación, la tarjeta dice lo que cuesta lo pedido y, al cambiar, **solo ruedan las cifras que cambian** (la P2 de `GNumberField`).
- **El campo de moneda no es un componente más:** es el `GNumberField` que ya existe, con el símbolo pegado a la cifra (P1).

## Cuándo usarlo (fronteras)

| Necesidad | Usar | No usar |
| --- | --- | --- |
| Mostrar un precio, una tarifa, un importe de carrito o de plan | `GPrice` | Una cadena con `Intl.NumberFormat` o «$» escrito a mano |
| Un precio en texto llano (correo, `title`, un `GSummary`, un `GMetric`, un CSV) | `formatPrice(money, opciones).text` (y `.spoken` si el anfitrión admite una lectura aparte) | `GPrice` dentro de un atributo |
| Varios precios de la misma moneda (carta, listado, carrito) | `GPriceScope` alrededor | Repetir el código en cada precio |
| Capturar un importe | `GNumberField currency` (`number-field.md` «Moneda») | `GNumberField prefix="$"` (sigue prohibido) ni un componente `GCurrencyField` |
| Moneda elegible al capturar | Receta: `GSelect` «Moneda» + `GNumberField currency` en una `GFormRow` | Una prop `unit` o `v-model:currency` (reservado, #777) |
| Elegir un rango de precio arrastrando | `GSlider` con `format: { style: 'currency', currency }` (lectura con el nombre de la moneda, `slider.md` «Moneda en la lectura») | `GPrice` |
| Una cifra destacada de un tablero (ingresos del mes) | `GMetric` con `value: formatPrice(...).text` (receta; límite: el lector lee el símbolo, ver «Límites») | `GPrice size="xl"` dentro de un `GMetric` |
| Un dato de una ficha | `GSummary` con el texto de `formatPrice` | `GPrice` en `facts` (son textos) |
| Una oferta, un descuento como distintivo | El ahorro de C es texto en línea de `GPrice` | `GBadge` con «−20 %» como única señal |
| Una tarjeta de oferta | `GCard` con `GPrice` en el slot por defecto (precio dentro de la descripción de la tarjeta enlace) | `meta` de `GCard` (son pares `label`/`value` de texto) |
| Precio por día de un calendario | Slot `day` de `GDatePicker` + `dayDescription` con `formatPrice(...).spoken` (`datepicker.md`) | Solo el slot (no llega al nombre del día) |

---

## Modelo: `Money` (#769)

```ts
type Money = {
  amount: number        // unidades mayores (1850.5), como el modelo de GNumberField; finito
  currency: string      // código ISO 4217 («MXN»); se normaliza a mayúsculas
  approximate?: boolean // lo pone la aplicación cuando el importe es una conversión suya
}
type PriceTotal = { value: Money | Money[], label: string }   // A · La cuenta
```

- `amount` en **unidades mayores**. Una aplicación con unidades menores (céntimos enteros, como Stripe) divide por `10 ** decimales` antes (receta del README; los decimales salen de `currencyDigits`, abajo).
- `Money[]` son **alternativas** del mismo importe en varias monedas (la aplicación las calcula; las convertidas llevan `approximate`). Solo dentro de un `GPriceScope` se elige entre ellas (B).
- Tipos en `packages/vue/types/shared.d.ts` (`Money`, `PriceTotal`, `PriceLabels`, `PriceOptions`, `FormattedPrice`), reutilizados por los tipos de bloques (`blocks/types.ts`, #763).

## `formatPrice` (la regla; #769, #770, #774, #775)

```ts
formatPrice(money: Money | Money[] | null, options?: PriceOptions): FormattedPrice
currencyDigits(currency: string, locale?: string): number    // decimales de la moneda (MXN 2, JPY 0, KWD 3)
```

Exportadas desde **`@grana/vue/price`** (#776). **Pura:** sin DOM, sin `window`, sin estado salvo una caché de `Intl.NumberFormat` por idioma y opciones (como `utils/slider.js`); funciona en SSR, en un correo y en un worker.

### Opciones (`PriceOptions`)

| Opción | Tipo | Valores | Default | Qué hace |
| --- | --- | --- | --- | --- |
| `locale` | String | BCP 47 | el de `Intl` del entorno (`Intl.NumberFormat().resolvedOptions().locale`) | Idioma del formato y de la lectura. **No lee el DOM**: el `lang` del ancestro lo resuelve `GPrice`, no la utilidad |
| `display` | String | `auto` `symbol` `code` `none` | `auto` | `auto`: símbolo del idioma y, **solo si ese símbolo es de varias monedas** y la región no declara esta moneda, el código detrás («$1,850 MXN»). `symbol`: nunca el código. `code`: el código de `Intl` («MXN 1,850»). `none`: solo la cifra (el día del calendario, donde una leyenda ya dice la moneda) |
| `cents` | String | `auto` `always` `never` | `auto` | `auto`: decimales de la moneda, sin «,00» en los enteros. `always`: siempre los decimales de la moneda (columnas de carrito y checkout). `never`: redondea a enteros (solo en piezas diminutas; en `GPrice`, solo `size="xs"`) |
| `lead` | String | texto de la app | sin valor | Texto previo («desde»); se ve y se lee |
| `unit` | String | texto de la app | sin valor | Unidad visible («/ noche») |
| `unitLabel` | String | texto de la app | `unit` | Unidad leída («por noche»); regla de `prefix`/`prefixLabel` (#166) |
| `max` | Money \| Money[] | misma moneda | sin valor | Extremo superior de un **rango** («$900 a $1,400 MXN») |
| `compareAt` | Money \| Money[] | misma moneda | sin valor | Precio de **referencia** |
| `compareLabel` | String | texto de la app | sin valor | **Qué es** la referencia («Temporada alta», «Precio de lista»). Ver «Referencia» |
| `compareStyle` | String | `trace` `strike` | `trace` | `trace` (C): sin tachar, nombrada, con flecha y ahorro. `strike` (base): `<s>` clásico |
| `total` | PriceTotal | | sin valor | **A · La cuenta**: el total de lo pedido (de la aplicación) y su unidad («por 2 noches») |
| `scopeCurrency` | String | ISO 4217 | sin valor | Moneda declarada por la región (la pone `GPriceScope`); un importe de esa moneda no lleva código |
| `view` | String | ISO 4217 | sin valor | Moneda de la vista (B): elige entre las alternativas de `money`, `max`, `compareAt` y `total` |
| `labels` | PriceLabels | ver «Textos» | `{}` | Textos de la aplicación |

### Resultado (`FormattedPrice`)

```ts
type AmountParts = { minus: string, symbolBefore: string, number: string, symbolAfter: string, code: string, currency: string }
type FormattedPrice = {
  state: 'amount' | 'free' | 'onRequest' | 'invalid'
  currency: string | null       // la moneda elegida (tras `view`)
  text: string                  // lo visible del precio actual: lead, aprox., importe o rango, unidad (sin referencia ni total)
  spoken: string                // la frase completa: total → precio actual → referencia → ahorro
  parts: {
    lead: string, approx: string, unit: string,
    amount: AmountParts | null,                         // null en free / onRequest / invalid
    range: { before: string, between: string, after: string, max: AmountParts } | null,  // literales de labels.range
    compare: { label: string, style: 'trace' | 'strike', amount: AmountParts, text: string } | null,
    saving: { text: string, amount: Money } | null,     // solo trace, con ahorro > 0 y labels.saving
    total: { label: string, unit: string, amount: AmountParts, text: string } | null
  }
}
```

### Reglas

1. **Lectura** (`spoken`): `Intl.NumberFormat(locale, { style: 'currency', currencyDisplay: 'name' })` sin decimales en los enteros (con `trailingZeroDisplay: 'stripIfInteger'` o fijando los decimales mínimos a 0; con `cents="never"`, sin decimales nunca): «1,850 pesos mexicanos», «1,850.50 pesos mexicanos». Orden de la frase: `{labels.total} {total.label}: {total}.` → `{lead} {approx} {importe o rango} {unitLabel}` → `. {compareLabel}: {referencia}` → `. {saving}`. Cada pieza ausente desaparece con su puntuación.
2. **Visible** (`text` y `parts`): `formatToParts` con `currencyDisplay: 'symbol'` (o `code`), decimales según `cents`. Las **marcas bidi** de `Intl` (U+200E, U+200F, U+061C) se quitan. El **menos va delante del símbolo** y es el tipográfico **U+2212** («−$200.00 MXN»); en la lectura queda el «-» de `Intl` (los lectores dicen «menos»).
3. **Decimales de la moneda**, no «dos»: `resolvedOptions().maximumFractionDigits` (MXN 2, JPY 0, KWD 3, medidos). `currencyDigits` los expone.
4. **Ambigüedad** (`display="auto"`; regla literal, sin mirar la región, #803): el código se añade si el símbolo que da `Intl` **en ese idioma** está en la **tabla de símbolos compartidos** y la moneda no es `scopeCurrency`. Medido: `es-MX` + MXN → «$1,850 MXN»; `en-US` + MXN → «MX$1,850» (sin código); `es-MX` + USD → «USD 95» (lo dice `Intl`); `de-DE` + EUR → «1.850 €». La tabla está en «Tabla de símbolos compartidos».
5. **Rango** (`max`): visible y lectura con la plantilla **`labels.range`** («{min} a {max}»), **nunca** `formatRange` (su guion se lee «menos»). Visible: el mínimo con su símbolo y sin código, el máximo con símbolo y código si toca («$900 a $1,400 MXN»). Lectura: el mínimo como número y el máximo con el nombre («900 a 1,400 pesos mexicanos»). Sin `labels.range`, el rango no se pinta (solo `money`) y avisa.
6. **Cero** → `state: 'free'` con `labels.free` («Gratis»); sin `labels.free`, el cero formateado («$0») y aviso. Con referencia, «Gratis» + referencia.
7. **`null`** → `state: 'onRequest'` con `labels.onRequest` («Precio a consultar»); sin él, texto vacío y aviso.
8. **Aproximado** (`approximate`): `labels.approx` delante del importe, en lo visible y en la lectura («aprox. USD 105.00»). Sin `labels.approx`, aviso (un importe convertido sin marca engaña; la aplicación debe darla).
9. **Alternativas** (`Money[]`): se elige la de moneda `view`; si no hay, la de `scopeCurrency`; si no, la primera. `max`, `compareAt` y `total` se eligen **en la moneda del importe elegido**; si no la tienen, no se pintan y avisa. Fuera de una región (sin `view` ni `scopeCurrency`) un arreglo de más de un elemento avisa: las alternativas solo se eligen dentro de `GPriceScope`.
10. **Inválido** (moneda que `Intl` rechaza por **mal formada**: no son tres letras ASCII; un código bien formado pero inexistente como «XXZ» lo acepta `Intl` y Grana lo pinta con su código, #802; objeto sin `currency`): `state: 'invalid'`, textos vacíos y aviso. `amount` no finito (`NaN`, `±Infinity`) se lee como `null` con aviso. **Nunca lanza.**
11. **Ahorro** (solo `trace`): `compareAt − importe`, con enteros escalados a los decimales de la moneda (2300 − 1850 = 450 exacto). Solo si es > 0 y hay `labels.saving` («Ahorras {amount}»); el importe del ahorro va **sin código** (la moneda ya está dicha). Con `compareAt ≤ importe`, aviso y sin ahorro (la referencia se pinta).
12. **Caché:** los `Intl.NumberFormat` se crean una vez por idioma y opciones (un calendario llama 42 veces por mes).

### Tabla de símbolos compartidos (P-L4; #770)

- **Generada, no escrita a mano:** un script de bruno (`scripts/currency-symbols.mjs`) recorre `Intl.supportedValuesOf('currency')` con `currencyDisplay: 'narrowSymbol'` en `en`, descarta los símbolos que son el propio código (tres letras mayúsculas) y guarda los que comparten **dos o más monedas**. Corre en `npm run build` **antes** de Vite y escribe un módulo de datos (`src/utils/currencySymbols.js`, versionado).
- **Solo crece:** el script escribe la **unión** de lo que ya estaba y lo que da el `Intl` de Node; un símbolo que un CLDR posterior deje de compartir **sigue** en la tabla hasta que lima lo retire (enseñar el código de más es inocuo; de menos, no). Hoy: `$ ¥ kr £ ₩ Rs` (Chromium) más **`Bs`** (Firefox y WebKit).
- **Vigilada:** una prueba de Vitest falla si el `Intl` de Node da un símbolo compartido que no está en la tabla (el script no se ejecutó); un spec de Playwright comprueba que el conjunto calculado en **cada motor** está contenido en la tabla.
- **Por qué no al vuelo:** calcularla en el navegador cuesta entre 5 y 30 ms según el motor (medido por kiwi) y varía con el CLDR del navegador.
- Vive en `utils/currency.js` (interno, **en el paquete principal**, porque la usa `GNumberField currency`; llega a `@grana/vue/price` por `__shared`, #776).

---

## `GPrice`

### Props

| Prop | Tipo | Valores | Default | Origen |
| --- | --- | --- | --- | --- |
| `value` | Object \| Array \| null | `Money`, `Money[]` | `null` («a consultar») | propia |
| `max` | Object \| Array \| null | `Money`, `Money[]` | `null` | propia (rango) |
| `compareAt` | Object \| Array \| null | `Money`, `Money[]` | `null` | propia (referencia) |
| `compareLabel` | String | texto de la app | sin valor | propia (C: **obligatoria** con `trace`, aviso si falta) |
| `compareStyle` | String | `trace` `strike` | `trace` | propia |
| `lead` | String | texto de la app | sin valor | propia |
| `unit` | String | texto de la app | sin valor | propia |
| `unitLabel` | String | texto de la app | sin valor (`unit`) | propia (#166) |
| `total` | Object \| null | `PriceTotal` | `null` | propia (A) |
| `size` | String | `xs` `sm` `md` `lg` `xl` | `md` | compartida (aquí, **rol tipográfico**, no altura: ver «Tamaños») |
| `display` | String | `auto` `symbol` `code` `none` | `auto` | propia |
| `cents` | String | `auto` `always` `never` | `auto` | propia (`never` solo con `xs`) |
| `locale` | String | BCP 47 | sin valor (ver «Idioma») | compartida (`api.md`) |
| `labels` | Object | `PriceLabels` | `{}` (función) | propia |

**No existen** (#769): `amount`/`currency` sueltas (el dato es `Money`), `from` (es `lead`, texto de la app), `free`/`onRequest` como props (son estados de `value`), `color`, `variant`, `rounded`, `density`, `as` (la raíz es siempre `span`: contenido de frase, cabe en `<p>`, `<dd>`, `<td>` y en el `<button>` de un día), `notation` (`compact` reservado, #778), `animate` (A rueda siempre que puede; el movimiento reducido manda). Sin slots ni eventos.

### Textos (`labels`, #774)

Ninguno tiene valor por defecto. Los de un `GPrice` se **fusionan sobre** los de su `GPriceScope` (la carta da los textos una vez). Marcadores entre llaves; son cadenas, no funciones.

| Clave | Uso | Si falta |
| --- | --- | --- |
| `free` | Importe 0 («Gratis») | El cero formateado y aviso |
| `onRequest` | `value` `null` («Precio a consultar») | Raíz vacía y aviso |
| `before` | Nombre genérico de la referencia («Antes»), respaldo de `compareLabel` | Sin `compareLabel` tampoco: la referencia **no se pinta** y aviso |
| `range` | Plantilla del rango con `{min}` y `{max}` («{min} a {max}») | El rango no se pinta y aviso |
| `saving` | Plantilla del ahorro con `{amount}` («Ahorras {amount}») | Sin ahorro (opcional, sin aviso) |
| `approx` | Marca de aproximado («aprox.») | Aviso (el importe se pinta sin marca) |
| `total` | Rótulo del total en A («Total») | `total.label` solo y aviso |

### Anatomía y estructura accesible

```html
<!-- Precio con importe -->
<span class="g-price g-price--size-md g-price--has-compare g-price--compare-trace" data-currency="MXN">
  <span class="g-price__visual" aria-hidden="true">
    <span class="g-price__total">…</span>                                  <!-- solo A; ver «A · La cuenta» -->
    <span class="g-price__compare">                                        <!-- C (trace): encima del precio actual -->
      <span class="g-price__compare-label">Temporada alta</span>
      <span class="g-price__amount g-price__amount--compare" dir="ltr">…$2,300…</span>
      [GLibIcon arrow-right, flip-rtl, class g-price__arrow]
      <span class="g-price__saving">Ahorras $450</span>
    </span>
    <span class="g-price__now">
      <span class="g-price__lead">desde</span>
      <span class="g-price__approx">aprox.</span>                         <!-- solo approximate -->
      <span class="g-price__amount" dir="ltr"><span class="g-price__minus">−</span><span class="g-price__symbol">$</span><span class="g-price__number">1,850</span><span class="g-price__symbol">…</span><span class="g-price__code">MXN</span></span>
      <span class="g-price__sep">a</span><span class="g-price__amount" dir="ltr">…</span>   <!-- solo rango -->
      <span class="g-price__unit">/ noche</span>
    </span>
    <s class="g-price__compare">…</s>                                      <!-- strike: después del precio actual -->
  </span>
  <span class="g-price__spoken">desde 1,850 pesos mexicanos por noche. Temporada alta: 2,300 pesos mexicanos. Ahorras 450 pesos mexicanos</span>
</span>

<!-- Estados de texto llano (se leen tal cual) -->
<span class="g-price g-price--size-sm g-price--free">Gratis</span>
<span class="g-price g-price--size-sm g-price--on-request">Precio a consultar</span>
```

- **`__visual` `aria-hidden="true"`** con todo lo visible; **`__spoken`** con la frase, en el **patrón de texto oculto accesible** (coco). Medido por kiwi con `ariaSnapshot` en los tres motores: el árbol solo contiene la frase, sin «$» ni «MXN».
- Los espacios entre partes los pone el **CSS** (separación `space`), no caracteres; el `.vue` no escribe espacios de relleno entre `__lead`, `__amount` y `__unit`. El código va dentro de `__amount`, separado por el CSS.
- **`__amount` lleva `dir="ltr"`** (signo, símbolo y cifras no se reordenan); el resto sigue la dirección del idioma.
- `__minus` solo con importe negativo; `__symbol` antes o después de `__number` según el idioma; `__code` solo si toca (regla 4).
- **No enfocable, sin rol, sin interactivos.** Dentro de una `GCard interaction="link"` el precio entra en la descripción de la tarjeta por su texto (la frase), por eso el selector de vista de B va **fuera** de las tarjetas.
- La frase oculta **no lleva** región viva: un cambio de `value` o de `total` cambia el texto en silencio (principio 5).

### Tamaños (#770)

`size` elige el **rol tipográfico** de la cifra (`tokens.md` §5) y un rol inferior para lo secundario (lead, aprox., unidad, código, referencia, ahorro, rótulos del total), **nunca por debajo de `caption` (12px, §7)**.

| `size` | Uso | Cifra | Secundario (propuesta; coco la fija y la mide en `estilo.md`) |
| --- | --- | --- | --- |
| `xs` | Día del calendario | `caption` | `caption` |
| `sm` | Carta, líneas del carrito | `body-sm` | `caption` |
| `md` | Tarjeta de oferta | `title-sm` | `body-sm` |
| `lg` | Total del carrito | `title` | `body` |
| `xl` | Plan de precios | `display` | `body` |

- **Cifras tabulares y de altura de mayúscula** (`font-variant-numeric: tabular-nums lining-nums`) en todos los tamaños: las columnas de importes quedan alineadas (medido por kiwi: la carta con un solo borde derecho).
- **El importe no se parte** (sin salto dentro de `__amount`); lead, unidad y referencia pueden pasar a la línea siguiente a 320px sin desbordar.
- Peso de la cifra: el del rol de título (`--g-text-title-sm-weight` en `md`; coco decide el resto con tokens de §5).

### Idioma (`locale`, #775)

- **Resolución:** la prop › el `locale` de su **`GPriceScope`** › el `lang` del **ancestro más cercano** (`closest('[lang]')`, leído al montar, como `GNumberField`, #310) › `navigator.language`. Un `locale` que `Intl` rechaza avisa y sigue la cadena sin él.
- Se muestran las **cifras del sistema del idioma** (`ar-EG`: arábigo-índicas) y su símbolo en su lado; sin marcas bidi.
- **Límite:** un cambio del `lang` de un ancestro después de montar no se observa; la aplicación pasa `locale` reactivo (o en la región).

### SSR (#775)

Importar y renderizar en el servidor no toca `document`, `window`, `navigator`, `matchMedia` ni `ResizeObserver`. **Con `locale` (en el precio o en su región)**, servidor y primer render del cliente escriben el precio formateado y la frase (idénticos; sin desajuste de hidratación). **Sin `locale`**, los dos escriben la **forma canónica** «1850 MXN» (`amount` en ASCII, espacio y código; la frase igual) y al montar se reformatea con el idioma resuelto. README: «en un sitio con SSR, pon `locale` en el `GPriceScope` de cada región» (los precios son contenido indexable). `formatPrice` en el servidor usa el `locale` que se le pase.

### Referencia (`compareAt`): C por defecto, tachado como opción (#771)

- **`trace` (por defecto, C):** sin `<s>`. La referencia va **encima** del precio actual (`__compare` antes de `__now` en lo visible), con su nombre (`compareLabel`), el importe sin código, una flecha `arrow-right` (`GLibIcon`, decorativa, **`flip-rtl`**) hacia el precio actual y el ahorro en texto (`__saving`). Lectura: el precio actual **primero** y después «Temporada alta: 2,300 pesos mexicanos. Ahorras 450 pesos mexicanos».
- **`compareLabel` es obligatoria con `trace`**: sin ella, aviso («nombra con qué comparas: temporada, precio de lista…») y se usa `labels.before` como respaldo; **sin ninguno de los dos, la referencia no se pinta** (una referencia sin nombre no se enseña).
- **`strike` (base):** `<s class="g-price__compare">` **después** del precio actual, sin ahorro; la lectura la nombra con `compareLabel ?? labels.before` («Antes: 2,300 pesos mexicanos»); sin ninguno, no se pinta y avisa. Sin aviso por `compareLabel` en `strike` (es el clásico; el contraste del tachado es el de `text-muted`, ≥ 4.5:1).
- **Gratis con referencia:** «Gratis» como importe (`__amount--word`), la referencia y, en `trace`, el ahorro.
- `compareAt ≤ value`: aviso; la referencia se pinta, sin ahorro.

### B · La moneda se dice una vez → ver `GPriceScope`

### A · La cuenta (`total`, opción; #773)

- **`total = { value: Money | Money[], label }`** lo da la aplicación (el viernes y el sábado cuestan más: medido por kiwi, 3 noches = 5,950 y no 3 × 1,850). Grana **no** multiplica.
- **Visible:** arriba y en grande el total (`__total`: `__total-label` con `labels.total`, `__total-amount` con el importe y `__total-unit` con `total.label`); debajo el precio actual como contexto (`__now`) y la referencia si hay. Con `total`, la raíz lleva `g-price--has-total` y coco da a `__total` el rol de la cifra y a `__now` el secundario.
- **Lectura:** empieza por el total: «Total por 2 noches: 3,700 pesos mexicanos. desde 1,850 pesos mexicanos por noche…».
- **Cifras que ruedan** (la P2 de `GNumberField`, `number-field.md` §P2, con estos cambios): cuando el **importe** del total cambia (misma moneda, después de montar), `__total-amount` recibe **`is-rolling`** y `data-direction="up|down"` (sube o baja el importe) y su contenido pasa a ser la capa: cada **tramo contiguo** de caracteres que cambiaron (comparación **alineada a la derecha** del texto viejo y el nuevo, incluidos separadores) en un **`g-price__roll-slot`** con **`__roll-new`** y, si había, **`__roll-old`** ("3,700" a "5,950" da `[5|3]` y `[95|70]`; los caracteres nuevos sin valor anterior, cuando el total crece, van en ranura propia sin `__roll-old`; todos ruedan con la misma animación); los que no cambian, como texto. La frase oculta tiene el total nuevo desde el primer cuadro.
  - **Keyframes de coco `g-price-roll…`** (nunca `g-reject…`), `--g-duration-press` + `--g-ease-out`, solo con `prefers-reduced-motion: no-preference`.
  - **Retirada (bruno):** en `animationend`/`animationcancel` de nombre `g-price-roll…` cuando terminan todas, **o en el acto** si en el cuadro siguiente ningún `__roll-slot` tiene animación calculada (movimiento reducido o sin CSS). El JS no lleva duraciones ni consulta `matchMedia`.
  - **Un lote por cuadro (bruno):** las comparaciones y lecturas de todos los `GPrice` se hacen en un solo `requestAnimationFrame` compartido, solo lecturas dentro; así 50 precios que cambian a la vez no suman un cuadro cada uno.
  - **Reserva, no aplicada (#857 matizada por #859; regla común de `api.md` «Movimiento repetido por instancia»).** P-A4 está cerrado y medido en verde con el lote por cuadro de arriba (bruno 6f9d3c6; coco 497/497, sin tareas largas con 50 totales, addendum de 2026-10-22 en `design/lab/price/auditoria.md`): **`GPrice` no lleva visor ni tope de capas** y el CSS y el `.vue` actuales no los tienen. Se **activa solo si una medida real vuelve a superar los 50 ms** (el umbral y la prueba de «Verificación» son lo que se mediría). Lo contratado para ese caso, sin aplicar:
    1. **Visor (reserva).** Un total rueda solo si su `__total-amount` **corta el visor** en el momento del cambio (un `IntersectionObserver` **compartido** por todos los `GPrice` con `total`, umbral 0, sin margen; creado en el primer montaje que lo necesita, nunca en el nivel superior del módulo, #444; se deja de observar al desmontar). Mientras el observador no haya dicho nada de un total, cuenta como **no visible**. **Sin `IntersectionObserver`** (jsdom, entornos antiguos) todo total cuenta como visible (el tope sigue valiendo).
    2. **Tope (reserva): como mucho `48` capas animadas en curso a la vez en la página** (una capa = un `__roll-new` o un `__roll-old`; constante interna `ROLL_CAP` del `.vue`, no es token ni prop). Un total **reserva** sus capas (ranuras con vieja = 2, sin vieja = 1) al crear su capa y las **devuelve** al retirarla (fin de animación, retirada en el acto, cambio nuevo, desmontaje). Si sus capas no caben en lo que queda, **no rueda entero**: nunca rueda una parte de un total. El reparto es por orden de llegada (entre los que cambian en el mismo tic, el orden en que Vue los actualiza); la prueba no depende de cuáles, solo del recuento y de que cada total sea entero.
    3. **Lo que no rueda (fuera del visor o sobre el tope, solo si la reserva se activa) cambia sin capa y sin parpadeo:** la decisión se toma **antes** de pintar ninguna ranura, así que ese total no llega a tener `is-rolling` ni `__roll-slot` en ningún cuadro; su texto nuevo y la frase oculta están en el mismo primer cuadro, igual que con movimiento reducido. Un total que entra en el visor mientras otros ruedan no recupera la animación perdida.
    4. **Mínimos que no cambian:** la frase oculta (`__spoken`) tiene el total nuevo desde el primer cuadro en **todos** los precios, rueden o no; con `prefers-reduced-motion: reduce` ninguna capa tiene animación calculada y se retira en el acto, y su reserva se devuelve en ese mismo lote (el tope nunca deja totales sin actualizar). El tope no cambia la regla de interrupción (un cambio durante la capa la retira y el nuevo va sin capa).
  - **No rueda:** en el primer render y en la hidratación; si cambia la moneda del total; si el texto nuevo es igual (un repintado del padre con el mismo total **no retira** la capa en curso); si ya hay una capa (la anterior se retira en el acto y el cambio nuevo va sin capa, como P2: nada se apila); si el total desborda su caja; (con la reserva de #857 activada, también si su caja no corta el visor o si sus capas no caben en el tope de 48).
- La diferencia de cifras (comparación alineada) se extrae a una utilidad interna compartida con `GNumberField` **sin cambiar su comportamiento** (sus pruebas de P2 siguen verdes); si no compensa, se duplica; lo decide bruno con el peso (#776).
- **Sin `labels.total`**, el total se lee y se ve solo con `total.label` y avisa.

### Rúbrica de movimiento (A; `docs/documentacion/rubrica-movimiento.md`; base: kiwi r01)

| Dimensión | Estado | Evidencia | Riesgo | Recomendación |
| --- | --- | --- | --- | --- |
| Propósito | Cumple | Señala qué parte del total cambió con las noches | Bajo | — |
| Comodidad visual | Cumple | Solo las posiciones que cambian; `--g-duration-press` | Bajo | — |
| Estabilidad | Cumple | Cifras tabulares: la capa no cambia el ancho; el texto nuevo está desde el primer cuadro | Bajo | coco mide Δ ancho 0 durante la capa |
| Interrumpible | Cumple | Un cambio durante la capa la retira y no apila otra (regla de P2) | Bajo | — |
| Control | Cumple | Solo cambia cuando la aplicación cambia el total, tras un gesto de la persona | — | — |
| Accesibilidad | Cumple | Capa dentro de `__visual` (`aria-hidden`); reducido: sin animación calculada y la capa se retira en el acto | — | — |
| Rendimiento | Cumple, medido (6f9d3c6) | 50 totales cambiando a la vez en Chromium: ninguna tarea larga (antes 51 a 83 ms), 497/497 en los tres motores; el lote por cuadro de un solo `requestAnimationFrame` y los tramos contiguos en una ranura bastan. Addendum de coco del 2026-10-22 en `design/lab/price/auditoria.md` | Bajo | Reserva de #857 (visor y tope de 48 capas), que se activa solo si una medida real vuelve a superar los 50 ms |

---

## `GPriceScope` (B; #772)

Una **región que declara su moneda**. Dentro, un precio de esa moneda **no lleva código** (el símbolo basta); un precio extranjero sigue la regla `auto` (con su código si su símbolo es ambiguo: «USD 190.00» en un carrito MXN). Si la aplicación da alternativas, `view` elige la moneda de todos los precios de la región a la vez.

### Props

| Prop | Tipo | Valores | Default | Origen |
| --- | --- | --- | --- | --- |
| `currency` | String | ISO 4217 | **obligatoria** | propia |
| `view` | String | ISO 4217 | sin valor (= `currency`) | propia (la moneda que se ve; la elige la aplicación con su control) |
| `legend` | Boolean | | `true` | propia |
| `taxes` | String | texto de la app («IVA incluido») | sin valor | propia |
| `locale` | String | BCP 47 | sin valor | compartida (lo heredan los precios de dentro; útil en SSR) |
| `labels` | Object | `PriceLabels` + `legend` | `{}` (función) | propia |
| `as` | String | `div` `section` `aside` | `div` | propia |

- **`labels.legend`**: plantilla con `{name}` (nombre de la moneda de la vista en plural, de `Intl`: «pesos mexicanos») y `{code}` («Precios en {name} ({code})»). Los demás `labels` (`free`, `onRequest`, `before`, `range`, `saving`, `approx`, `total`) **se heredan** por los `GPrice` de dentro.
- **`view`** es una prop, no un `v-model`: la región no tiene control propio. El control («Ver precios en», p. ej. `GRadioGroup appearance="segmented"`) es de la aplicación y va **fuera de las tarjetas** (principio 5: él anuncia el cambio, porque es un control con estado). Lo que se ve en otra moneda lleva «aprox.» si la aplicación marcó `approximate`.
- **Los códigos se omiten** dentro de la región **solo si la región dice su moneda**: con `legend` y `labels.legend`, o con `legend: false` (la aplicación promete que la moneda está dicha en otro sitio visible; README). Con `legend` y **sin** `labels.legend`, la leyenda no se pinta, los precios **conservan** su código y avisa.
- **Regiones anidadas:** manda la más cercana. Un `GPrice` con `display` distinto de `auto` ignora la omisión del código.
- **SSR-seguro:** la moneda la declara la aplicación; la región **no cuenta ni recorre** sus precios (provide/inject).

### Anatomía

```html
<div class="g-price-scope" data-currency="MXN">
  <p class="g-price-scope__legend">
    <span class="g-price-scope__seal" aria-hidden="true">MXN</span>
    <span class="g-price-scope__legend-text">Precios en pesos mexicanos (MXN)</span>
    <span class="g-price-scope__taxes">IVA incluido</span>
  </p>
  … contenido de la aplicación (carta, lista, carrito) …
</div>
```

- La leyenda es **el primer hijo** (se lee antes que los precios). El **sello** es `aria-hidden` (la leyenda ya lo dice en texto); su texto visible cumple ≥ 4.5:1 igualmente. `data-currency` lleva la moneda de la vista.
- Entre el texto de la leyenda y `taxes` no se escribe ningún carácter: la separación visual la pone coco con un filete (`--g-border-width` en `--g-color-border-strong`, el patrón de separadores de `GSummary`), no un «·».
- Sin rol, sin nombre, sin región viva, sin enfocables propios.

---

## Teclado y foco

`GPrice` y `GPriceScope` no son enfocables ni tienen rol. El teclado del campo es el de `GNumberField` (APG *Spinbutton*); con `currency`, `steppers` sigue apagado por defecto y se permite.

## Estados

| Estado | `GPrice` | Campo (`GNumberField currency`) |
| --- | --- | --- |
| Normal | Visible corto + frase | `GNumberField` |
| Sin valor | `labels.onRequest` | Vacío, sin `aria-valuenow` |
| Cero | `labels.free` (con referencia: «Gratis» + referencia) | 0 formateado |
| Aproximado | `labels.approx` delante, visible y leído | — |
| Negativo | «−$200.00 MXN» (U+2212 visible, «-» leído) | Lo de `GNumberField` con `min` |
| Rango | «$900 a $1,400 MXN» | — |
| Referencia | C (`trace`) o tachado (`strike`) | — |
| Total (A) | Total arriba, tarifa como contexto, cifras que ruedan | — |
| Inválido | Raíz vacía + aviso | Sin moneda + aviso |
| Error, deshabilitado, solo lectura | No aplican (no es control) | Los de `GNumberField` |
| Carga | La plantilla de `GLoadRegion` (molde): la cifra es texto | — |

## Avisos de desarrollo (`[Grana GPrice]`, `[Grana GPriceScope]`, `[Grana formatPrice]`; #774)

Con la **guarda canónica de #653** (`try { if (process.env.NODE_ENV !== 'production' …) … } catch {}` en el sitio de cada texto; `api.md` «Avisos de desarrollo»). Un `GPrice` avisa **una vez por instancia y motivo**; `formatPrice` llamada por la aplicación, una vez por motivo y moneda en el módulo; un mismo motivo no sale dos veces por pasar de `GPrice` a `formatPrice` (bruno lo resuelve con una opción interna, no pública).

1. `Money` inválido: sin `currency`, moneda **mal formada** que `Intl` rechaza (un código bien formado pero inexistente, como «XXZ», pasa sin aviso: es responsabilidad de la aplicación, #802), o `amount` no finito (se lee como `null`).
2. `max`, `compareAt` o `total` sin la moneda del importe elegido: no se pintan.
3. `cents="never"` con un tamaño distinto de `xs`: se usa `auto`.
4. `compareAt ≤ value`: sin ahorro.
5. `compareStyle="trace"` con `compareAt` y sin `compareLabel`: se usa `labels.before`; sin los dos, la referencia no se pinta. En `strike`, sin `compareLabel` ni `labels.before`: no se pinta.
6. `max < value`: el rango se pinta tal cual (Grana no valida).
7. Falta el texto que el caso necesita: `labels.free` (cero), `labels.onRequest` (`null`), `labels.range` (rango), `labels.approx` (aproximado), `labels.total` (A).
8. `value` (o `max`, `compareAt`, `total.value`) con varias alternativas fuera de un `GPriceScope`: se usa la primera.
9. `locale` que `Intl` rechaza (en `GPrice`, `GPriceScope` o `formatPrice`).
10. `GPriceScope`: `currency` ausente o rechazada; `view` que `Intl` rechaza; `legend` sin `labels.legend` (los precios conservan su código).

---

## Tokens consumidos (`tokens.md` §54; P-L10)

**Ningún token nuevo** (#776). Lista provisional (coco entrega la exacta al terminar `GPrice.css`, como en #759):

| Token | Para qué |
| --- | --- |
| `--g-text-{caption\|body-sm\|body\|title-sm\|title\|display}-{size\|line\|weight\|tracking}` | Cifra y secundario por tamaño |
| `--g-font-ui`, `--g-font-display` (solo `xl` si coco lo elige) | Familia |
| `--g-color-text` | Cifra, lead, unidad, sello |
| `--g-color-text-muted` | Secundario, referencia (`trace` y `strike`), código (≥ 4.5:1 medido por kiwi en claro y oscuro) |
| `--g-color-success-soft`, `--g-color-on-success-soft` | Ahorro de C (par garantizado; el ahorro es texto, no solo color) |
| `--g-color-border-strong` | Sello de B (decorativo) y filete leyenda–impuestos |
| `--g-border-width`, `--g-radius-xs`, `--g-radius-pill` | Sello y ahorro |
| `--g-space-1` | Separación entre partes (`space × 2` en `md`, la de cada tamaño) |
| `--g-duration-press`, `--g-ease-out` | Cifras que ruedan (A) |

**No son tokens:** el 100 % de la altura del `__roll-slot` (geometría, como P2); `tabular-nums lining-nums` (valor de propiedad). `forced-colors`: el ahorro y el sello con borde del sistema (`CanvasText`), la flecha en `CanvasText`; sin depender del color.

## Clases y datos (contrato bruno ↔ coco)

| Clase / dato | Elemento | Cuándo |
| --- | --- | --- |
| `g-price`, `g-price--size-{xs…xl}`, `data-currency` | Raíz `span` | Siempre (sin `data-currency` en `invalid`) |
| `g-price--free`, `g-price--on-request` | Raíz | Estados de texto llano (cero sin referencia; `null`) |
| `g-price--has-compare`, `g-price--compare-{trace\|strike}` | Raíz | Con referencia pintada |
| `g-price--has-total` | Raíz | A con total pintado |
| `g-price--range`, `g-price--approx`, `g-price--negative` | Raíz | Rango pintado; importe aproximado; importe negativo |
| `g-price__visual` (`aria-hidden`), `g-price__spoken` | `span` | Con importe |
| `g-price__now` | `span` | Línea del precio actual |
| `g-price__lead`, `__approx`, `__unit`, `__sep` | `span` | Si hay |
| `g-price__amount` (`dir="ltr"`), `--compare`, `--word` | `span` | Importe; el de la referencia; «Gratis» con referencia |
| `g-price__minus`, `__symbol`, `__number`, `__code` | `span` dentro de `__amount` | Si hay |
| `g-price__compare` | `span` (`trace`) o `s` (`strike`) | Referencia |
| `g-price__compare-label`, `__arrow`, `__saving` | dentro de `__compare` (`trace`) | Nombre, flecha, ahorro |
| `g-price__total`, `__total-label`, `__total-amount`, `__total-unit` | `span` | A |
| `is-rolling` + `data-direction="up\|down"` | `__total-amount` | Durante la capa |
| `g-price__roll-slot`, `__roll-new`, `__roll-old` | `span` por tramo contiguo de caracteres que cambian | Dentro de `__total-amount` durante la capa |
| `g-price-scope`, `data-currency` | Raíz de la región | Siempre |
| `g-price-scope__legend`, `__seal`, `__legend-text`, `__taxes` | `p` y `span` | Leyenda pintada; `__taxes` con `taxes` |

**Para coco:** `__amount` y `__roll-slot` `inline-block` donde haga falta (`translate` no se aplica a cajas en línea); `__compare` en `trace` en su propia línea encima de `__now`; el precio dentro del `<button>` de un día (`xs`) sin cambiar la celda salvo la forma de «día con precio» (`datepicker.md`); la raíz `inline-flex`/`inline-grid` para que C y A apilen sin dejar de ser contenido de frase.

## Paquete y peso (#776)

- **Entrada propia `@grana/vue/price`** (`dist/price.js`, `dist/price.umd.js`, global UMD **`GranaPrice`**, requiere `Vue` y `Grana`): exporta `GPrice`, `GPriceScope`, `formatPrice`, `currencyDigits` y, por defecto, un plugin que registra los dos componentes. `@grana/vue` **no** los exporta ni los registra. **Tope: 6 KiB (6144 B) gzip** en su entrada; si lo supera, vuelve a lima. El visor y el tope de #857 son reserva y no se aplican: no hay excepción de peso.
- **En el principal** (lote de enmiendas de moneda, presupuesto **≤ 1,5 KiB (1536 B) gzip** de crecimiento de `grana.js` sobre la base vigente; si lo supera, vuelve a lima): `utils/currency.js` (decimales, símbolo y su lado, nombre, ambigüedad y la tabla), `GNumberField currency` con sus dos defectos (`number-field.md`), `GDatePicker dayDescription` y su clase (`datepicker.md`). `utils/currency.js` y `GLibIcon` llegan a la entrada por `__shared` (#240), sin copia.
- `GSlider` (lectura con el nombre de la moneda) cuenta en su propia entrada (`slider.md`, #455).
- **Paquete y tipos (#443):** `./price` en `exports` (`types`/`import`/`default`), `typesVersions`, `ENTRIES` de `scripts/build-types.mjs` y `src/types.test.js`. `GPrice.meta.json` y `GPriceScope.meta.json` con todas las props, valores y defaults (sin eventos ni slots); `Money`, `PriceTotal`, `PriceLabels`, `PriceOptions`, `FormattedPrice` en `types/shared.d.ts`; `formatPrice` y `currencyDigits` en `types/api/price.d.ts`; las uniones `Money | Money[] | null` en `types/overrides.mjs` (`GPrice.value`, `.max`, `.compareAt`, `.total`, `.labels`; `GPriceScope.labels`).
- **Compuertas** (`gates.sh`): `grep -q "g-price__spoken"` y `grep -q "g-price-scope__legend"` en `grana.css`; `! grep -q "GPriceScope" packages/vue/dist/grana.js`; `! grep -q "formatPrice" packages/vue/dist/grana.js`; `test -f packages/vue/dist/price.js`; `! grep -q "supportedValuesOf" packages/vue/dist/grana.js packages/vue/dist/price.js` (la tabla no se calcula en el navegador).
- Sin efectos en el nivel superior de los módulos (#444); la tabla de símbolos es un literal de datos.

## Verificación (cómo se da por hecho)

**Criterio de hecho:** las medidas de kiwi (`design/lab/price/r01/verificar.mjs`, 312/312) reproducidas sobre los componentes reales.

### bruno (vitest + jsdom)

- `formatPrice`: los nueve casos de kiwi y el árabe (`ar-EG` + EGP); `es-MX`/`en-US`/`de-DE`; MXN, USD, EUR, JPY (0 decimales), KWD (3), negativo con U+2212 visible y «-» leído; `cents` (los tres); `display` (los cuatro) y la regla de ambigüedad con y sin `scopeCurrency`; rango con plantilla (sin `formatRange`); cero, `null`, aproximado; alternativas con `view`; referencia `trace`/`strike` y ahorro sin error de coma flotante (2300 − 1850.1 = 449.9); `total`; inválido sin lanzar; caché (un `Intl.NumberFormat` por clave); avisos 1 a 9 una vez; sin marcas bidi; **SSR** en Node sin DOM.
- Tabla de símbolos: ⊇ lo que da el `Intl` de Node (falla si no se ejecutó el script); el script solo añade.
- `GPrice`: árbol (`__visual` `aria-hidden`, `__spoken` con la frase; estados de texto llano sin duplicado); orden visual de C y A; herencia de `labels` y `locale` desde la región; `display` y omisión del código en la región (con leyenda, con `legend: false`, sin `labels.legend`); P2 de A (capa solo en cambios del importe tras montar, slots correctos, `data-direction`, retirada por `animationend` `g-price-roll…` y en el acto sin animación; sin capa al hidratar, al cambiar de moneda y con una capa presente); **tope de #857 (solo si la reserva se activa)** con un `IntersectionObserver` simulado (fuera del visor: sin `is-rolling` ni `__roll-slot` y con el texto nuevo; sin observador, cuenta como visible; sobre el tope: el total que no cabe no tiene ninguna ranura; la reserva se devuelve al retirar, al cambiar otra vez y al desmontar: tras diez rondas un cambio nuevo sigue rodando; el observador se crea en el primer montaje con `total`, no al importar, y deja de observar al desmontar); `renderToString` con y sin `locale` (forma canónica idéntica en servidor y cliente); avisos.
- `GPriceScope`: leyenda primera, sello `aria-hidden`, plantilla, `taxes`, `view` en bloque, anidadas.

### Playwright (Chromium, Firefox y WebKit; `design/lab/theme-playground/`, puerto propio)

- `tests/price.spec.mjs`: el `verificar.mjs` de kiwi adaptado: `ariaSnapshot` (solo la frase), carta alineada (un borde derecho), contraste ≥ 4.5:1 de todas las partes en claro y oscuro (C: referencia, ahorro, cifra; B: sello), texto ≥ 12px en `xs`, reflujo a 320px en base, A, B y C sin desplazamiento horizontal, la página en inglés, RTL con `ar-EG`; **conjunto de símbolos compartidos de cada motor ⊆ tabla**.
- `tests/personalidad-price.spec.mjs` (A): ≥ 2 posiciones intermedias, menos posiciones que dígitos del total, termina y retira la capa; con `reduce`, ninguna capa; Δ ancho 0 durante la capa; **rendimiento (P-A4, medida de bruno y de coco; es también la prueba de la reserva de #857): 50 `GPrice` con `total`, todos en el visor (la página `many=50` los compone para que quepan; si no, el spec agranda el visor), seis cambios de noches cada 400 ms: ninguna tarea larga > 50 ms en Chromium con `--workers=1`, estable con `--repeat-each=3` (0 de 3 fallos), ; solo si la reserva se activa, además en cada cuadro `document.getAnimations()` con nombre `g-price-roll…` ≤ 48 y > 0 en algún cuadro (el tope se ejerce)**; **visor (solo con la reserva):** con la lista desplazada, los totales fuera del visor no tienen `__roll-slot` en ningún cuadro muestreado y su `__number` y su `__spoken` dicen el total nuevo en el primer cuadro tras el cambio; los del visor ruedan; **entero o nada (solo con la reserva):** ningún `__total-amount` muestreado tiene una parte de sus ranuras; **reducido:** 0 animaciones y los 50 totales nuevos en el primer cuadro.
- Calendario: `dayDescription` en el nombre del día (`datepicker.md`); campo: `number-field.md` «Moneda».

### coco (CSS y auditoría)

Solo `var(--g-*)` y `--_*`; tamaños medidos (≥ 12px), contraste en los temas del CLI y en el oscuro, `forced-colors` emulado, la forma del día con precio en `GDatePicker` y la rúbrica de movimiento de A completa. Resultado en `design/lab/price/auditoria.md`.

### No verificado (entorno real)

Lector de pantalla real (cómo pronuncian VoiceOver y NVDA «1,850 pesos mexicanos», el «-» de los negativos y la frase dentro de una tarjeta enlace); teléfono real; zoom 200–400 % (se midió el reflujo a 320px); `forced-colors` real; temas del CLI distintos del de por defecto (coco); RTL de página completa.

## Límites conocidos (para el README)

- **`GMetric` y `GSummary` leen el símbolo:** con `formatPrice(...).text` el lector dice «dólar» por «$». Hasta que esos anfitriones admitan una lectura aparte (pendiente, `PENDIENTES.md`), usar `display="code"` en contextos mixtos o `GPrice` donde haya slot.
- La tabla de símbolos refleja el CLDR de Node y de los motores medidos; un navegador con otro CLDR puede compartir un símbolo más (el spec de los tres motores lo vigila; la tabla solo crece).
- **SSR:** sin `locale`, el HTML llega con la forma canónica y se reformatea al montar.
- **Idioma cambiado en caliente:** pasar `locale` reactivo.
- `trailingZeroDisplay` no existe en motores antiguos: bruno usa decimales mínimos 0 en los enteros.

- **Cinco cifras en el día del calendario (#801):** a 320 px la celda del día de `GDatePicker` mide 38 px; un precio de cuatro cifras cabe y uno de cinco («12,400») desborda en los tres motores (P-A3). Para precios así, la aplicación no pone precio en el día (`dayDescription` y el precio por día son opcionales) o muestra el importe fuera de la celda.
- **`en-US` + USD sale «$95 USD» (#803):** `$` es un símbolo compartido y `display="auto"` no mira la región. Para un sitio de una sola moneda, la receta es `GPriceScope` (omite el código); sin región, `display="symbol"`.
- **Muchos totales a la vez (#857, reserva):** hoy todos los totales cambiados ruedan, agrupados en un cuadro, y la medida con 50 está en verde. Si una medida real vuelve a superar los 50 ms, se activará la reserva (solo ruedan los totales visibles y, como mucho, 48 capas a la vez; los demás cambian en su sitio sin animación) y este límite se reescribirá.
- **Código inexistente (#802):** `Intl` acepta cualquier código de tres letras («XXZ»); Grana no lleva la lista de monedas ISO. Validar el código es de la aplicación.

## Fuera de v1 (reservado con nombre)

- **`notation: 'compact'`** («$12 mil») para el día del calendario estrecho (P-L6, #778, #801): coco midió que cinco cifras no caben a 320 px (P-A3). Se activa **solo** cuando la aplicación lo pida en un lote posterior o un usuario real tope con ello; la regla prevista sería compacto con cinco cifras o más en el día, sin prop pública en v1. No se contrata ahora para no abrir una prop, un `Intl` por idioma y pruebas de lectura («12 mil», `es`) con el lote 1 por cerrar.
- **`v-model:currency`** en `GNumberField` con selector integrado, junto a `GInputGroupNumber` (#314, #777).
- **`cartTotals`** (utilidad sin estado de líneas, descuentos e impuestos): lote de Ecommerce (#767).
- Lectura aparte para `GMetric` (`valueLabel`) y `GSummary` (dato con lectura): ronda de cada anfitrión.

## Resolución de hallazgos de kiwi (P-L1 a P-L11)

| # | Hallazgo | Resolución |
| --- | --- | --- |
| P-L1 | `formatPrice` exportada | Sí, en `@grana/vue/price` (no en el principal), pura, `{ text, spoken, parts }` con `state` y `currency`; sin `locale`, el de `Intl` del entorno (no lee el DOM; el ancestro lo resuelve `GPrice`) (#769, #775, #776) |
| P-L2 | `GPrice`, `labels`, avisos | Props de este contrato; `labels` sin valores por defecto y heredables de la región; avisos 1 a 9 (#770, #774) |
| P-L3 | `GPriceScope` | `currency`, `view` (prop, sin `v-model`: la región no tiene control), `legend`, `taxes`, `locale`, `labels`, `as`; omisión del código solo si la región dice su moneda (#772) |
| P-L4 | Tabla en el build | Script de bruno antes de Vite, módulo versionado, **solo crece**, vigilada en Vitest y en los tres motores (#770) |
| P-L5 | Referencia honesta | `compareStyle` `trace` (por defecto) / `strike`; `compareLabel` obligatoria con `trace` con aviso; sin nombre no se pinta (#771) |
| P-L6 | El día pierde el precio | `dayDescription(iso)` en `GDatePicker` y clase `g-datepicker--day-content` para la forma de coco; `compact` reservado (#778) |
| P-L7 | `GNumberField currency` y dos defectos | `number-field.md` «Moneda»: derivaciones, redondeo al cambiar la precisión efectiva, pegado con símbolo, código y nombre (#777) |
| P-L8 | `GSlider` con moneda | `aria-valuetext` con el nombre de la moneda cuando `format.style === 'currency'` y no hay `valueText` (#779) |
| P-L9 | Paquete | Entrada propia `@grana/vue/price` (tope 6 KiB) + lote del principal ≤ 1,5 KiB (#776) |
| P-L10 | Tokens | Ninguno nuevo; `tokens.md` §54 (#776) |
| P-L11 | Tipos compartidos | `Money`, `PriceTotal`, `PriceLabels`, `PriceOptions`, `FormattedPrice` en `types/shared.d.ts` (#776) |

## Encargos

- **coco (Opus):** `GPrice.css` (tamaños con su tabla de roles medida, partes, C con flecha y ahorro, `strike`, A con la capa `g-price-roll…`, estados, RTL, `forced-colors`) y `GPriceScope.css` (leyenda, sello, filete); la **forma del día con precio** en `GDatePicker.css` (`g-datepicker--day-content`, `datepicker.md`); lista exacta de tokens para `tokens.md` §54; auditoría final con un tema del CLI.
- **bruno (Opus):** `utils/currency.js` + `scripts/currency-symbols.mjs` + tabla y sus pruebas; `formatPrice`/`currencyDigits`; `GPrice.vue` y `GPriceScope.vue` con `meta.json`; entrada `@grana/vue/price` (cuatro registros de #443, compuertas, peso); `GNumberField currency` con los dos defectos de P-L7; `GDatePicker dayDescription`; `GSlider` lectura con moneda; pruebas, specs (`price`, `personalidad-price`, rendimiento de 50), playground `#sec-price` con carta, tarjetas, carrito, calendario y el campo.
- **mora-docs:** README de `GPrice` (principal de la entrada) con las recetas «Precio en `GMetric`/`GSummary` con `formatPrice`», «Moneda elegible en una `GFormRow`», «Unidades menores (céntimos) → `amount / 10 ** currencyDigits(currency)`», «SSR: `locale` en la región», y las enmiendas de `GNumberField`, `GDatePicker` y `GSlider`.
