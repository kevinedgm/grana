# GPrice y GPriceScope

`GPrice` pinta **un precio que se dice como se habla y que nunca miente sobre su moneda**: lo visible es corto («$1,850 MXN / noche») y lo que oye el lector es la frase completa con el nombre de la moneda («desde 1,850 pesos mexicanos por noche»). `GPriceScope` declara la moneda de una región (una carta, un listado, un carrito) para que dentro de ella el símbolo baste. Las dos usan una misma regla, la utilidad pura **`formatPrice`**, que también puedes llamar tú para un precio en texto llano. Ninguna trae color propio (el tema lo pone), **ninguna convierte divisas ni calcula totales o impuestos** (los importes, las alternativas y el total los da tu aplicación) y ninguna trae textos (todos van en `labels`).

El campo para **capturar** un importe no es un componente nuevo: es [`GNumberField`](../GNumberField/README.md#moneda-currency) con `currency`.

**Etiquetas:** `<g-price>` y `<g-price-scope>` · **Estado:** `candidate` (ver [`design/lab/price/auditoria.md`](../../../../../design/lab/price/auditoria.md) y «Verificación») · **Desde:** 0.1.0 · **Entrada:** propia, `@grana/vue/price` (global UMD `GranaPrice`)

```js
import Price, { GPrice, GPriceScope, formatPrice, currencyDigits } from '@grana/vue/price'
```

> `@grana/vue` está en la versión `0.1.0-beta.0` y aún no se publica en npm. Por ahora se usa desde el repositorio (banco del componente real en `packages/vue/playground/price.html`). Exige Vue `^3.5.0` y un navegador actual.

## Instalación: entrada propia

`GPrice` y `GPriceScope` **no** viajan en `@grana/vue`: ni los exporta ni los registra su `install` (DECISIONS #776). Quien no los usa no los paga.

```js
import { createApp } from 'vue'
import Grana from '@grana/vue'
import Price from '@grana/vue/price'
import '@grana/vue/style.css'          // el CSS del precio ya está en esta hoja única

createApp(App).use(Grana).use(Price).mount('#app')   // registra <g-price> y <g-price-scope>
```

Sin empaquetador, carga `vue.global.js`, `dist/grana.umd.js` y `dist/price.umd.js` (global `GranaPrice`): `app.use(Grana).use(GranaPrice)`. En plantillas dentro del HTML (sin compilar), escribe las etiquetas con cierre: `<g-price ...></g-price>`.

**Peso.** Tope de la entrada: 6 KiB gzip (6 144 B). `GPrice.meta.json` anota **5 963 B** (`dist/price.js`, `gzip -9`, medido por bruno): margen de **181 B** sobre el tope. El lote que sí viaja en el paquete principal (los datos de moneda con la tabla de símbolos, `GNumberField currency` y `GDatePicker dayDescription`) creció **1 314 B** gzip (tope 1 536 B), según el `meta.json`. `dist/grana.js` no contiene `GPriceScope` ni `formatPrice`.

## Qué lo hace distinto

Formas elegidas por el usuario el 2026-10-21 (DECISIONS #768): la base más **B** y **C** por defecto, y **A** como opción.

| | Qué hace | Por qué sirve |
| --- | --- | --- |
| **Dice la moneda que es** | La lectura siempre lleva el nombre de la moneda («1,850 pesos mexicanos»); lo visible es `aria-hidden` | El lector nunca dice «dólar» por un «$» de pesos |
| **El código lo decide la ambigüedad real** | El código ISO aparece solo si el símbolo lo comparten varias monedas (tabla generada desde los datos de `Intl`, no escrita a mano) | «$1,850 MXN» es claro; «€1,850» no necesita código |
| **B · La moneda se dice una vez** | `GPriceScope` pinta una leyenda con sello («Precios en pesos mexicanos (MXN)»); dentro, el símbolo basta y solo lo extranjero conserva su código | Una carta de cuarenta platos no repite «MXN» cuarenta veces |
| **C · El antes y el ahora** (por defecto) | La referencia **no se tacha**: va encima del precio, dice qué es («Temporada alta»), una flecha la lleva al precio actual y el ahorro va en texto | Se lee igual que se ve, y obliga a nombrar con qué comparas: el «antes» inventado es un patrón oscuro |
| **A · La cuenta** (`total`) | Con el total que da tu aplicación, la tarjeta lo dice arriba y en grande; al cambiar, **solo ruedan las cifras que cambian** | Señala qué parte del total cambió al cambiar las noches |

## Cuándo usarlo

| Necesito | Uso | No uses |
| --- | --- | --- |
| Mostrar un precio, una tarifa, un importe de carrito o de plan | `GPrice` | Una cadena con `Intl.NumberFormat` o un «$» escrito a mano |
| Varios precios de la misma moneda (carta, listado, carrito) | `GPriceScope` alrededor | Repetir el código en cada precio |
| Un precio en texto llano (correo, `title`, CSV) | `formatPrice(money, opciones).text` | `GPrice` dentro de un atributo |
| Capturar un importe | [`GNumberField`](../GNumberField/README.md#moneda-currency) con `currency` | `GNumberField prefix="$"` ni un `GCurrencyField` |
| Elegir un rango de precio arrastrando | [`GSlider`](../GSlider/README.md) con `format: { style: 'currency', … }` | `GPrice` |
| Un precio por día en un calendario | Slot `day` de [`GDatePicker`](../GDatePicker/README.md#precio-y-otros-datos-del-día-daydescription-slot-day) + `dayDescription` | Solo el slot (no llega al nombre del día) |
| Una oferta o un descuento como distintivo | El ahorro de `compareAt` (texto en línea) | Un `GBadge` con «−20 %» como única señal |

## Uso

El dato es un objeto **`Money`**: `{ amount, currency, approximate? }`. `amount` va en **unidades mayores** (1850.5). Los textos van todos en `labels` o en props, sin valores por defecto. `size` elige el rol tipográfico de la cifra (`xs` día del calendario, `sm` carta, `md` tarjeta, `lg` total del carrito, `xl` plan).

```vue demo
<g-price
  :value="{ amount: 1850, currency: 'MXN' }"
  lead="desde"
  unit="/ noche"
  unit-label="por noche"
  locale="es-MX"
/>
```

Con ese ejemplo se ve «desde $1,850 MXN / noche» y el lector oye «desde 1,850 pesos mexicanos por noche». Sin `locale`, el idioma sale de la región, del `lang` del ancestro (al montar) o de `navigator.language`.

## Ejemplos

### e1 · Una carta en pesos, con un platillo en dólares (B)

**Por qué:** cuando muchos precios comparten moneda. La región dice «Precios en pesos mexicanos (MXN)» una vez; los precios en pesos llevan solo el símbolo y el que no es de la región conserva su código si su símbolo es ambiguo. No la uses para un solo precio suelto.

```vue demo
<script setup>
const labels = {
  legend: 'Precios en {name} ({code})',
  free: 'Gratis',
  onRequest: 'Precio a consultar'
}
</script>

<template>
  <g-price-scope currency="MXN" locale="es-MX" taxes="IVA incluido" :labels="labels">
    <p>Tlayuda <g-price :value="{ amount: 145, currency: 'MXN' }" size="sm" /></p>
    <p>Mezcal de la casa <g-price :value="{ amount: 90, currency: 'MXN' }" size="sm" /></p>
    <p>Menú de temporada <g-price :value="null" size="sm" /></p>
    <p>Botella importada <g-price :value="{ amount: 95, currency: 'USD' }" size="sm" /></p>
  </g-price-scope>
</template>
```

La leyenda es el primer hijo y se lee antes que los precios. `labels.legend` usa los marcadores `{name}` (el nombre de la moneda de la vista, en plural, de `Intl`) y `{code}`. `taxes` es un texto tuyo tras la leyenda.

### e2 · Una tarifa de temporada nombrada (C)

**Por qué:** cuando enseñas un precio anterior o de lista. Debes decir **qué es** la referencia (`compareLabel`); sin nombre no se pinta, para no fabricar un «antes» vacío. El ahorro lo calcula Grana restando con enteros escalados a los decimales de la moneda y solo aparece si es mayor que cero y das `labels.saving`.

```vue demo
<g-price
  :value="{ amount: 1850, currency: 'MXN' }"
  :compare-at="{ amount: 2300, currency: 'MXN' }"
  compare-label="Temporada alta"
  lead="desde"
  unit="/ noche"
  unit-label="por noche"
  locale="es-MX"
  size="lg"
  :labels="{ saving: 'Ahorras {amount}', before: 'Antes' }"
/>
```

Lectura: el precio actual primero y después «Temporada alta: 2,300 pesos mexicanos. Ahorras 450 pesos mexicanos». Con `compare-style="strike"` la referencia se tacha **después** del precio, sin ahorro y se lee con `compareLabel` (o `labels.before`).

### e3 · El total de las noches pedidas (A)

**Por qué:** cuando la persona cambia lo que pide y el total no es el producto de la tarifa (el viernes y el sábado cuestan más). **El total lo calculas tú**: Grana no multiplica. Al cambiar el importe del total, ruedan solo los tramos de cifras que cambian.

```vue demo
<script setup>
import { ref, computed } from 'vue'

const noches = ref(2)
const totales = { 1: 1850, 2: 3700, 3: 5950, 4: 7800 }
const total = computed(() => ({
  value: { amount: totales[noches.value], currency: 'MXN' },
  label: `por ${noches.value} ${noches.value === 1 ? 'noche' : 'noches'}`
}))
</script>

<template>
  <div>
    <g-price
      :value="{ amount: 1850, currency: 'MXN' }"
      :total="total"
      lead="desde"
      unit="/ noche"
      unit-label="por noche"
      locale="es-MX"
      size="lg"
      :labels="{ total: 'Total' }"
    />
    <g-btn variant="outline" @click="noches = noches === 4 ? 1 : noches + 1">Cambiar las noches</g-btn>
  </div>
</template>
```

Las cifras ruedan **por tramo contiguo de caracteres cambiados**: de «3,700» a «5,950» ruedan dos tramos (el «5» y el «95»), no una ranura por carácter. Con movimiento reducido no hay animación y el total nuevo aparece en el acto. Nada del precio anuncia el cambio: lo anuncia el control tuyo que lo provocó.

### e4 · Ver todos los precios en otra moneda (alternativas con `view`)

**Por qué:** cuando tu aplicación ofrece la misma carta en dos monedas. Das **alternativas** (`Money[]`, las convertidas con `approximate: true`) y la región elige la de `view`. La conversión es tuya; Grana no convierte. El control que cambia la vista va **fuera** de las tarjetas y es el que anuncia el cambio.

```vue demo
<script setup>
import { ref } from 'vue'

const vista = ref('MXN')
const labels = { legend: 'Precios en {name} ({code})', approx: 'aprox.' }
const precio = [
  { amount: 1850, currency: 'MXN' },
  { amount: 105, currency: 'USD', approximate: true }
]
</script>

<template>
  <div>
    <g-radio-group
      v-model="vista"
      name="vista"
      appearance="segmented"
      label="Ver precios en"
      :options="[{ value: 'MXN', label: 'Pesos' }, { value: 'USD', label: 'Dólares' }]"
    />
    <g-price-scope currency="MXN" :view="vista" locale="es-MX" :labels="labels">
      <g-price :value="precio" lead="desde" unit="/ noche" unit-label="por noche" />
    </g-price-scope>
  </div>
</template>
```

Fuera de un `GPriceScope`, un arreglo de varias alternativas avisa y se usa la primera.

## Recetas

### Precio en `GMetric` o `GSummary`

Esos componentes reciben texto, así que usa `formatPrice(...).text`:

```vue
<!-- Fragmento: `ingresos` es de tu aplicación -->
<script setup>
import { formatPrice } from '@grana/vue/price'
const texto = formatPrice(ingresos, { locale: 'es-MX' }).text   // «$48,200 MXN»
</script>

<template>
  <g-metric label="Ingresos del mes" :value="texto" />
</template>
```

**Límite conocido:** esos anfitriones leen lo que reciben, así que el lector dice «dólar» por un «$» de pesos. Hasta que admitan una lectura aparte (reservado en el contrato), usa `display: 'code'` en contextos mixtos o `GPrice` donde haya un slot.

### Moneda elegible al capturar

Dos preguntas, dos etiquetas, en la misma fila (la receta completa, con el redondeo al cambiar de moneda, está en [`GNumberField`](../GNumberField/README.md#moneda-currency)):

```vue
<!-- Fragmento: `precio` y `moneda` son de tu aplicación -->
<g-form-row>
  <g-number-field v-model="precio" class="g-form-w-sm" label="Precio" name="precio" :currency="moneda" locale="es-MX"></g-number-field>
  <g-select v-model="moneda" class="g-form-w-xs" label="Moneda" name="moneda"
            :options="[{ value: 'MXN', label: 'Peso mexicano' }, { value: 'USD', label: 'Dólar estadounidense' }]"></g-select>
</g-form-row>
```

### Importes en céntimos enteros

`amount` va en unidades mayores. Si tu API usa unidades menores (céntimos, como Stripe), divide por `10 ** decimales` antes. Los decimales de la moneda salen de `currencyDigits` (MXN 2, JPY 0, KWD 3):

```js
import { currencyDigits } from '@grana/vue/price'

const aMoney = (centimos, currency) => ({ amount: centimos / 10 ** currencyDigits(currency), currency })
// aMoney(185000, 'MXN') devuelve { amount: 1850, currency: 'MXN' }
// aMoney(2500, 'JPY')   devuelve { amount: 2500, currency: 'JPY' }
```

### SSR: `locale` en la región

Los precios son contenido indexable. **Con `locale`** (en el precio o en su región), servidor y primer render del cliente escriben el precio formateado y la frase, idénticos (sin desajuste de hidratación). **Sin `locale`**, los dos escriben la forma canónica «1850 MXN» y al montar se reformatea con el idioma resuelto. En un sitio con SSR, pon `locale` en el `GPriceScope` de cada región.

### Un precio en texto llano

`formatPrice` es pura: no toca el DOM, funciona en el servidor, en un correo o en un worker. Devuelve `{ state, currency, text, spoken, parts }`:

```js
import { formatPrice } from '@grana/vue/price'

const labels = { range: '{min} a {max}' }
const r = formatPrice({ amount: 1850, currency: 'MXN' }, { locale: 'es-MX', lead: 'desde', unit: '/ noche', unitLabel: 'por noche', labels })
r.text     // «desde $1,850 MXN / noche»
r.spoken   // «desde 1,850 pesos mexicanos por noche»
```

## Props de `GPrice`

| Prop | Tipo | Valores | Por defecto |
| --- | --- | --- | --- |
| `value` | Object \| Array \| null | `Money` o `Money[]` (alternativas, solo se eligen dentro de un `GPriceScope`); `null` = «a consultar» (`labels.onRequest`) | `null` |
| `max` | Object \| Array \| null | extremo superior de un rango, en la moneda del importe | `null` |
| `compareAt` | Object \| Array \| null | precio de referencia, en la moneda del importe | `null` |
| `compareLabel` | String | qué es la referencia; obligatoria con `trace` (avisa; respaldo `labels.before`) | sin valor |
| `compareStyle` | String | `trace` `strike` | `trace` |
| `lead` | String | texto previo («desde»); se ve y se lee | sin valor |
| `unit` | String | unidad visible («/ noche») | sin valor |
| `unitLabel` | String | unidad leída («por noche»); sin ella se lee `unit` | sin valor |
| `total` | Object \| null | `{ value: Money \| Money[], label }`: la opción A | `null` |
| `size` | String | `xs` `sm` `md` `lg` `xl` (rol tipográfico de la cifra) | `md` |
| `display` | String | `auto` `symbol` `code` `none` | `auto` |
| `cents` | String | `auto` `always` `never` (`never` solo con `size="xs"`) | `auto` |
| `locale` | String | etiqueta BCP 47 | sin valor (ver «Idioma») |
| `labels` | Object | `PriceLabels` (ver «Textos») | `{}` |

- **`display`:** `auto` pone el símbolo del idioma y, **solo si ese símbolo es de varias monedas** y la región no declara esta moneda, el código detrás; `symbol` nunca pone el código; `code` usa el código de `Intl` («MXN 1,850»); `none` solo la cifra (el día del calendario).
- **`cents`:** `auto` usa los decimales de la moneda sin «,00» en los enteros; `always` los pone siempre (columnas de carrito); `never` redondea a enteros y con otro tamaño que `xs` se usa `auto` con aviso.
- **`Money`:** `{ amount, currency, approximate? }`. `amount` finito, `currency` ISO 4217 (se normaliza a mayúsculas), `approximate` lo pones tú cuando el importe es una conversión tuya.
- **Estados:** un importe `0` se pinta como `labels.free` («Gratis»); `null`, como `labels.onRequest`; un `approximate`, con `labels.approx` delante; un negativo, con el signo tipográfico «−» (U+2212) delante del símbolo y «-» en la lectura. El rango (`max`) usa la plantilla `labels.range`, no `formatRange`.
- **No existen:** `amount` o `currency` sueltas (el dato es `Money`), `from` (es `lead`), `color`, `variant`, `as` (la raíz es siempre un `span`, contenido de frase), `notation` (reservado) ni `animate` (A rueda siempre que puede y el movimiento reducido manda).

## Eventos y slots de `GPrice`

Ninguno. `GPrice` no es un control: sin eventos, sin slots, sin rol, sin foco.

## Props de `GPriceScope`

| Prop | Tipo | Valores | Por defecto |
| --- | --- | --- | --- |
| `currency` | String | **obligatoria**; moneda de la región (ISO 4217) | — |
| `view` | String | moneda de la vista (la elige tu aplicación con su control); sin valor, `currency` | sin valor |
| `legend` | Boolean | pinta la leyenda con `labels.legend`; `false` promete que la moneda está dicha en otro sitio visible | `true` |
| `taxes` | String | texto de impuestos tuyo («IVA incluido»), tras la leyenda | sin valor |
| `locale` | String | etiqueta BCP 47; lo heredan los precios de dentro | sin valor |
| `labels` | Object | `PriceLabels` + `legend`; los demás los heredan los `GPrice` de dentro | `{}` |
| `as` | String | `div` `section` `aside` | `div` |

**Eventos:** ninguno. **Slots:** `default`, el contenido de tu aplicación con sus `GPrice`. `view` es una prop, no un `v-model`: la región no tiene control propio.

- **Los códigos se omiten dentro de la región solo si la región dice su moneda:** con `legend` y `labels.legend`, o con `legend: false`. Con `legend` y **sin** `labels.legend`, la leyenda no se pinta, los precios **conservan** su código y avisa.
- **Regiones anidadas:** manda la más cercana. Un `GPrice` con `display` distinto de `auto` ignora la omisión del código.
- La región **no cuenta ni recorre** sus precios: la moneda la declaras tú (es segura en SSR).

## Utilidades

| Función | Qué hace |
| --- | --- |
| `formatPrice(money, options?)` | Pura y sin DOM. `options` repite las props de `GPrice` (`locale`, `display`, `cents`, `lead`, `unit`, `unitLabel`, `max`, `compareAt`, `compareLabel`, `compareStyle`, `total`, `view`, `labels`) más `scopeCurrency`. Devuelve `{ state, currency, text, spoken, parts }` |
| `currencyDigits(currency, locale?)` | Los decimales de la moneda (MXN 2, JPY 0, KWD 3) |

Sin `locale`, `formatPrice` usa el de `Intl` del entorno: **no lee el DOM**. Nunca lanza: un `Money` inválido da `state: 'invalid'` y textos vacíos con aviso. Los tipos (`Money`, `PriceTotal`, `PriceLabels`, `PriceOptions`, `FormattedPrice`) están en `types/shared.d.ts`.

## Textos (`labels`)

Ninguno tiene valor por defecto (DECISIONS #226). Los de un `GPrice` se **fusionan sobre** los de su `GPriceScope`: das los textos una vez en la carta.

| Clave | Uso | Si falta |
| --- | --- | --- |
| `free` | Importe 0 («Gratis») | El cero formateado, con aviso |
| `onRequest` | `value` `null` («Precio a consultar») | Raíz vacía, con aviso |
| `before` | Nombre genérico de la referencia («Antes»), respaldo de `compareLabel` | Sin `compareLabel` tampoco: la referencia no se pinta, con aviso |
| `range` | Plantilla con `{min}` y `{max}` («{min} a {max}») | El rango no se pinta, con aviso |
| `saving` | Plantilla con `{amount}` («Ahorras {amount}») | Sin ahorro (opcional, sin aviso) |
| `approx` | Marca de aproximado («aprox.») | El importe se pinta sin marca, con aviso |
| `total` | Rótulo del total en A («Total») | Se usa solo `total.label`, con aviso |
| `legend` | Solo en `GPriceScope`: «Precios en {name} ({code})» | La leyenda no se pinta y los precios conservan su código |

## Idioma (`locale`)

- **Resolución:** primero la prop; después, el `locale` de su `GPriceScope`; después, el `lang` del ancestro más cercano (se lee **al montar**); por último, `navigator.language`. Un `locale` que `Intl` rechaza avisa y sigue la cadena sin él.
- Se muestran las **cifras del sistema del idioma** (`ar-EG`: arábigo-índicas) y el símbolo en su lado, sin marcas bidi.
- **Idioma cambiado en caliente:** un cambio del `lang` de un ancestro después de montar no se observa; pasa `locale` reactivo.

## Accesibilidad

- a. **Lo visible es `aria-hidden` y la lectura es texto oculto** (patrón de texto oculto accesible), nunca `aria-label` en un `span`. La lectura siempre lleva el nombre de la moneda. `ariaSnapshot` de la tarjeta: sin «$» ni «MXN». `medido` (`design/lab/price/auditoria-verificar.mjs`, 497/497 en Chromium, Firefox y WebKit en una ejecución al documentar).
- b. **«Gratis» y «Precio a consultar» son texto llano:** ni duplicado ni oculto. `prueba` (`GPrice.test.js`).
- c. **Ningún precio habla solo:** sin región viva propia. Cuando cambian (A, B), lo anuncia el control tuyo que lo provocó. Sin rol, sin foco, sin nombre propio.
- d. **Contraste.** Todas las partes ≥ 4,5:1 en todos los temas y motores medidos: cifra, lead, unidad, código, aprox., referencia, ahorro, rótulos del total, gratis, sello, leyenda e impuestos, y el precio del día suelto, elegido y en franja. Mínimo: **ahorro 4,51:1** (tema por defecto, oscuro). Temas: por defecto, tres del CLI y cinco generados, claro y oscuro (Chromium); por defecto, terracota y stripe en Firefox y WebKit. `medido`.
- e. **Nada depende solo del color:** el ahorro es texto, la referencia se nombra, el tachado de `strike` es forma, el sello lleva borde. `medido`.
- f. **Tamaños:** cifra y secundario ≥ 12 px en todos los `size`; cifras tabulares y de altura de mayúscula; el importe en una sola línea. `medido`.
- g. **RTL** (`ar-EG` y página `rtl`): flecha espejada, importe aislado en `ltr`, cada parte separada de su vecina (hallazgo P-A1, corregido: antes el hueco era de 0 px). `medido`.
- h. **Reflujo a 320 px** (base, A, B, C y RTL): sin desplazamiento horizontal ni importe partido. `medido`.
- i. **Colores forzados:** el ahorro, el sello y el filete llevan borde del sistema y la flecha va en `CanvasText`. `medido` solo en Chromium emulado.
- j. **Movimiento de A:** `--g-duration-press` y `--g-ease-out`, sin muelle ni rebote; Δ de ancho 0 durante la capa; con movimiento reducido, sin animación calculada y el total nuevo en el acto. `medido`.

> **Peligro.** Pasar un precio como texto suelto en vez de `Money` (o un `Money` sin moneda, o con una moneda mal formada) deja la raíz **vacía** y solo lo dice un aviso de desarrollo: la persona no ve ningún precio. Igual con `labels`: sin `labels.free`, `labels.onRequest` o `labels.range` el estado correspondiente no se pinta como esperas. Pasa siempre un `Money` válido y todos los textos del caso.

## Personalidad

- **La moneda se dice una vez (B):** la región declara su moneda con una leyenda con sello; dentro, el símbolo basta.
- **El antes y el ahora (C):** la referencia nombrada con flecha y ahorro en texto sustituye al tachado anónimo.
- **La cuenta (A):** las cifras del total ruedan por tramos contiguos de caracteres cambiados (la misma mecánica de cifras que `GNumberField`), con `--g-duration-press` y `--g-ease-out`, solo con `prefers-reduced-motion: no-preference`. Un cambio durante la capa la retira en el acto y no apila otra; un repintado con el mismo total no la retira. No rueda en el primer render, al hidratar ni al cambiar de moneda.
- Todos los precios de una pantalla que cambian a la vez comparten **un solo cuadro de medida**, para que 50 totales no sumen 50 cuadros.

## Tema

`GPrice` y `GPriceScope` solo leen `var(--g-*)` y no crean ningún token (`docs/contract/tokens.md` §54). Lo que leen:

- **Texto:** `--g-text-{caption|body-sm|body|title-sm|title|display}-*` por `size`, `--g-font-ui`, `--g-color-text` y `--g-color-text-muted` (secundario, referencia, código).
- **Ahorro:** el par `--g-color-success-soft` y `--g-color-on-success-soft`, más `--g-radius-pill`.
- **Sello y filete:** `--g-color-border-strong`, `--g-border-width`, `--g-radius-xs`.
- **Separación y movimiento:** `--g-space-1`, `--g-duration-press`, `--g-ease-out`.

El día con precio de `GDatePicker` usa la forma `g-datepicker--day-content` de ese componente. La lista exacta de cada hoja es `GPrice.css` y `GPriceScope.css`.

## Clases

`g-price`, `--size-{xs|sm|md|lg|xl}`, `--free`, `--on-request`, `--has-compare`, `--compare-{trace|strike}`, `--has-total`, `--range`, `--approx`, `--negative`; partes `__visual`, `__spoken`, `__now`, `__lead`, `__approx`, `__amount` (`--compare`, `--word`), `__minus`, `__symbol`, `__number`, `__code`, `__sep`, `__unit`, `__compare` (con `__compare-label`, `__arrow`, `__saving`), `__total` (con `__total-label`, `__total-amount`, `__total-unit`), `__roll-slot` (con `__roll-new` y `__roll-old`); `is-rolling` y `data-direction`. `g-price-scope` con `__legend`, `__seal`, `__legend-text` y `__taxes`. `data-currency` en las dos raíces.

## Avisos de desarrollo

`[Grana GPrice]`, `[Grana GPriceScope]` y `[Grana formatPrice]`, solo fuera de producción. Un `GPrice` avisa una vez por instancia y motivo.

1. `Money` inválido (sin `currency`, moneda mal formada) o `amount` no finito (se lee como `null`).
2. `max`, `compareAt` o `total` sin la moneda del importe elegido: no se pintan.
3. `cents="never"` con un tamaño distinto de `xs`: se usa `auto`.
4. `compareAt` menor o igual que el importe: sin ahorro.
5. `trace` sin `compareLabel` (respaldo `labels.before`; sin los dos no se pinta); `strike` sin `compareLabel` ni `labels.before`.
6. `max` menor que el importe: el rango se pinta tal cual.
7. Falta `labels.free`, `labels.onRequest`, `labels.range`, `labels.approx` o `labels.total` según el caso.
8. Alternativas fuera de un `GPriceScope`: se usa la primera.
9. `locale` que `Intl` rechaza.
10. `GPriceScope`: `currency` ausente o rechazada, `view` rechazada, o `legend` sin `labels.legend`.

## Alcance

- **Nunca convierte divisas ni calcula totales o impuestos:** das los importes, las alternativas (con `approximate`) y el total.
- **No es un control:** sin enfoque, sin rol ni región viva.
- **Reservado** (no existe hoy): `notation: 'compact'` («$12 mil») para el día del calendario estrecho (DECISIONS #778 y #801); `v-model:currency` con selector integrado en `GNumberField` (#777); `cartTotals`; una lectura aparte para `GMetric` y `GSummary`.
- **Límites aceptados:**
  - **Cinco cifras en el día del calendario (#801):** a 320 px la celda mide 38 px; un precio de cuatro cifras cabe y uno de cinco («12,400») desborda 10 de 10 celdas en los tres motores (hallazgo P-A3). Para importes así, no pongas precio en el día o muéstralo fuera de la celda.
  - **`en-US` con USD sale «$95 USD» (#803):** `$` es un símbolo compartido y `display="auto"` no mira la región. Para un sitio de una sola moneda, envuelve en `GPriceScope` (omite el código) o usa `display="symbol"` (medido: «$95»).
  - **Código inexistente (#802):** `Intl` acepta cualquier código bien formado de tres letras («XXZ») y Grana lo pinta con su código; no lleva la lista de monedas ISO. Validar el código es tuyo.
  - **La tabla de símbolos compartidos** refleja el CLDR de Node y de los motores medidos; un navegador con otro CLDR puede compartir un símbolo más. La tabla solo crece y una prueba la vigila.
  - **Idioma cambiado en caliente:** pasa `locale` reactivo. **SSR** sin `locale`: el HTML llega con la forma canónica y se reformatea al montar.

## Verificación

- **Pruebas** (vitest, jsdom), ejecutadas de nuevo al documentar y en verde: `GPrice.test.js` 25, `GPrice.ssr.test.js` 4 (SSR en Node con y sin `locale`), `GPriceScope.test.js` 6, `utils/currency.test.js` 30 (tabla de símbolos y avisos) y `price.test.js` 7; en total 310 con las de `GSlider`, `GNumberField` y `GDatePicker`. `prueba`.
- **Auditoría de coco con el componente real** (`dist/price.umd.js`, banco `packages/vue/playground/price.html`): `node design/lab/price/auditoria-verificar.mjs`. El informe (2026-10-22) registró 496/497 con la tarea larga de A en Chromium (hallazgo P-A4, de bruno). Al documentar se ejecutó tres veces: una dio **495/497** (dos comprobaciones de A en Firefox, «≥ 2 posiciones intermedias» y «solo ruedan los caracteres que cambian», con el equipo cargado), una se cortó al abrir el navegador y la tercera dio **497/497** en Chromium, Firefox y WebKit, con «50 totales cambiando ×3: ninguna tarea larga» en Chromium. `medido`, pero **no estable en las tres ejecuciones**: ver «Pendientes abiertos».
- **Cierre de P-A4 y P-A2:** el commit de bruno 6f9d3c6 los cierra (un lote de cuadro para todos los precios, fecha local en el banco) y pone el componente en `candidate`; el informe de coco es anterior y no se actualizó. `prueba` y la ejecución de arriba.
- **Empaquetado:** `dist/price.js`, `dist/price.umd.js` y `dist/price.d.ts` existen; peso en «Instalación».
- **Rúbrica de movimiento de A:** seis de siete dimensiones cumplen en el informe de coco; la de rendimiento figuraba como «No cumple» antes del arreglo de bruno y no se remidió en el informe.
- **No verificado (entorno real):** lector de pantalla real (cómo pronuncian VoiceOver y NVDA «1,850 pesos mexicanos», el «-» de los negativos y la frase dentro de una tarjeta enlace); `forced-colors` real y en Firefox y WebKit; zoom del navegador de 200 a 400 % (se midió el reflujo a 320 px); teléfono real; puntero grueso en el día con precio; `GPrice` dentro de `GLoadRegion`; Safari real.
- **Pendientes abiertos:** la sección 10 de [`PENDIENTES.md`](../../../../../PENDIENTES.md) sigue listando P-A4 y P-A2 como abiertos aunque bruno los cerró (a actualizar por su dueño). Dos comprobaciones de A en Firefox fallaron en una ejecución y pasaron en otra: coco debe confirmar si es carga del equipo o una condición de carrera, y si «solo ruedan los caracteres que cambian» (la regla `ranuras < caracteres`) sigue valiendo tras el contrato «por tramo» (DECISIONS #812). Reservado: `compact` (#801).

## Fuentes

API: [`GPrice.meta.json`](./GPrice.meta.json), [`GPriceScope.meta.json`](../GPriceScope/GPriceScope.meta.json) · Contrato: [`design/contracts/price.md`](../../../../../design/contracts/price.md) (DECISIONS #768 a #779 y #801 a #803), [`number-field.md`](../../../../../design/contracts/number-field.md) «Moneda», [`datepicker.md`](../../../../../design/contracts/datepicker.md) «Precio y otros datos del día» y [`slider.md`](../../../../../design/contracts/slider.md) «Moneda en la lectura» · Ronda de kiwi: `design/lab/price/r01/` · Auditoría de coco: [`design/lab/price/auditoria.md`](../../../../../design/lab/price/auditoria.md) · Pruebas: los archivos de «Verificación» · Banco: `packages/vue/playground/price.html`.
