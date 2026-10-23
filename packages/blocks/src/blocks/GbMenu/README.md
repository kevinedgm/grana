# GbMenu · GbMenu01, GbMenu02 y GbMenu03

La carta de un restaurante **en HTML, no en PDF**: por tiempos, cada plato con lo que lleva, su precio en la moneda dicha una vez y sus avisos (alérgenos, picante, vegetariano) **en palabras**. Lo agotado hoy se ve como agotado. Va como carta corrida, por pestañas o con una tarjeta con foto por plato. La carta no tiene intención (pedir es de tu aplicación), así que no emite eventos. Compone `GSection`, `GPriceScope` y `GPrice` (`@grana/vue/price`), `GText` (con `dl`), `GTabs`, `GAdaptiveLayout`, `GCard`, `GStack` y `GTag` (`@grana/vue/tag`); no trae color, CSS ni textos propios.

**Etiquetas:** `<gb-menu-01>`, `<gb-menu-02>`, `<gb-menu-03>` · **Estado:** `candidate` (ver «Verificación») · **Desde:** `0.0.0` (paquete privado, aún sin publicar) · **Entrada:** `@grana/blocks/booking`

```js
import { GbMenu01, GbMenu02, GbMenu03 } from '@grana/blocks/booking'
```

> `@grana/blocks` es privado (`0.0.0`) y no se publica con la beta `0.1.0` de `@grana/vue`. Por ahora se usa desde el repositorio (banco real en `packages/blocks/playground/booking/menu.html`). Exige `@grana/vue` (peer, `>=0.1.0-beta.0 <1.0.0`) y Vue `^3.5.0`. Además de `@grana/vue`, la aplicación carga las entradas que esta sección compone: `@grana/vue/price`, `@grana/vue/tag`. Reglas comunes e instalación: [`packages/blocks/README.md`](../../../README.md).

## Qué lo hace distinto

**La moneda se dice una vez y lo que lleva cada plato, en palabras** (DECISIONS #875). La leyenda de `GPriceScope` dice «Precios en pesos mexicanos (MXN) · IVA incluido» una sola vez y cada precio queda en «$185» (el lector sigue oyendo «185 pesos mexicanos»). Los avisos de cada plato son texto («Contiene nuez»), nunca un icono solo ni un color; el nombre del plato conserva su idioma (`lang`) para que el lector lo pronuncie bien en una carta en inglés; y lo agotado hoy **se queda** con su aviso, en lugar de desaparecer y hacer dudar al comensal. Es una carta de verdad en la página: se busca con el navegador, se amplía y se lee sin descargar un PDF.

## Las tres variantes

Las tres reciben la misma `interface Props` (`GbMenuProps`, el mismo objeto `props` de `props.js`). Lo que una variante no usa, lo ignora en silencio.

| Variante | Concepto | Compone | Ignora |
| --- | --- | --- | --- |
| `GbMenu01` | Carta: todos los tiempos en la página, uno debajo de otro | `GSection` > `GPriceScope` > `GStack gap="lg"` > una `GSection` anidada por tiempo (`id`, `title` = `name`, `description`; el horario con `labels.hours`) > el `dl` de platos (`GText size="body"`) | `media` |
| `GbMenu02` | Por tiempos: una pestaña por tiempo («Desayuno, Comida, Cena»), la carta de uno a la vista | `GSection` > `GPriceScope` > `GTabs` (`label` = `labels.tabs`, una pestaña por tiempo con su `id`, el contenido en el slot `panel-{id}`) > descripción, horario y el `dl` de platos | `media` |
| `GbMenu03` | Platos con foto: cada plato en una tarjeta con su foto | `GSection` > `GPriceScope` > `GStack gap="lg"` > una `GSection` anidada por tiempo > `GAdaptiveLayout role="list"` > `div role="listitem" class="g-adapt-standard"` > `GCard as="div"` (`title` = `name`, `description`, `media` = la foto, cuerpo con `GPrice` y los `GTag`) | — (un plato sin `media` se pinta sin foto) |

**Un plato (01 y 02):** un `dl` dentro de una `GText` (el término y la definición son el plato y lo que lleva), con **este orden, como se lee una carta impresa: nombre, precio, descripción, avisos**.

- `dt`: el nombre (con su `lang` si no es el idioma de la página), con peso de término.
- `dd`: el `GPrice size="sm"` del `PriceSpec`; normalmente solo `value`, con `unit` («por pieza») o `lead` («desde»). `value: null` dice «a consultar» (`labels.price.onRequest`).
- `dd`: la descripción.
- `dd`: los avisos (`tags`), una lista de `GTag size="sm"` **estáticas** (sin `href`, sin `pressed`) y **neutras**: un aviso de alérgeno no se distingue por color. Se nombra con `labels.tags` («Contiene»).
- `dd`: `labels.unavailable` o el motivo, si el plato no está disponible.

El precio queda debajo del nombre y no al final del renglón (BK-L3): sin CSS no hay renglón con el precio al borde. **`id` de un tiempo** = ancla estable (`#comida`): en 01 y 03 lleva a su sección; en 02 abre su pestaña (la pestaña del `hash` se activa al montar).

## Uso

```vue
<script setup>
import { GbMenu01 } from '@grana/blocks/booking'

const mxn = (amount) => ({ amount, currency: 'MXN' })

const carta = {
  title: 'La carta',
  description: 'Cocina oaxaqueña de temporada; el maíz es criollo y se nixtamaliza en casa.',
  prices: { currency: 'MXN', taxes: 'IVA incluido' },
  locale: 'es',
  sections: [
    {
      id: 'desayuno',
      name: 'Desayuno',
      hours: 'de 8:00 a 12:00',
      items: [
        { id: 'chocolate', name: 'Chocolate de agua con pan de yema', description: 'Molido en metate.', price: { value: mxn(95) } },
        { id: 'enfrijoladas', name: 'Enfrijoladas', description: 'Con cecina, quesillo y cebolla morada.', price: { value: mxn(165) }, tags: ['Contiene lácteos', 'Picante', 'Sin gluten'] }
      ]
    },
    {
      id: 'comida',
      name: 'Comida',
      items: [
        { id: 'mole', name: 'Mole negro', description: 'Con pollo de rancho y arroz blanco.', price: { value: mxn(245) }, tags: ['Contiene nuez'] },
        { id: 'tlayuda', name: 'Tlayuda', price: { value: mxn(210) }, available: 'Agotado hoy' },
        { id: 'nicuatole', name: 'Nicuatole', lang: 'zap', price: { value: mxn(70) } },
        { id: 'pesca', name: 'Pesca del día', price: { value: null } }
      ]
    }
  ],
  labels: {
    tabs: 'Tiempos de la carta',
    tags: 'Contiene',
    unavailable: 'Agotado hoy',
    hours: 'Se sirve',
    price: { legend: 'Precios en {name} ({code})', onRequest: 'Precio del día', approx: 'aprox.', total: 'Total', free: 'Gratis', before: 'Antes', range: '{min} a {max}' }
  }
}
</script>

<template>
  <GbMenu01 v-bind="carta" />
</template>
```

La aplicación carga además `@grana/vue/price` y `@grana/vue/tag`. `prices` es obligatoria: una carta dice su moneda.

## Ejemplos

### e1 · La carta entera en la página (`GbMenu01`)

**Por qué:** cuando la carta es corta (hasta unos veinte platos) y se lee de corrido, o cuando quieres que el navegador la encuentre con una búsqueda. Cada tiempo tiene su ancla.

```vue
<!-- Fragmento: `carta` es de tu aplicación -->
<GbMenu01 v-bind="carta" />
```

### e2 · Un tiempo a la vez (`GbMenu02`)

**Por qué:** cuando la carta es larga y la gente busca un solo tiempo. Las pestañas cambian sin mover la fila; `/carta#cena` abre «Cena» al montar.

```vue
<!-- Fragmento: `carta` es de tu aplicación -->
<GbMenu02 v-bind="carta" />
```

### e3 · Platos con foto (`GbMenu03`)

**Por qué:** cuando la foto vende el plato (una carta de degustación, postres). Cada tarjeta lleva el nombre, la descripción, el precio y los avisos; un plato sin foto se pinta sin ella.

```vue
<!-- Fragmento: `carta` es de tu aplicación -->
<GbMenu03 v-bind="carta" />
```

### e4 · Una carta en inglés con platos que no se traducen

**Por qué:** cuando el nombre de un plato conserva su idioma (el «Mole negro» en una carta en inglés, un plato en zapoteco). `lang` marca el nombre para que el lector lo pronuncie bien.

```vue
<!-- Fragmento: `cartaEnIngles` es de tu aplicación (la carta con sus textos y `labels` en inglés y `lang: 'es'` en los platos que lo piden) -->
<GbMenu01 v-bind="{ ...cartaEnIngles, locale: 'en' }" />
```

## Props

Una sola interfaz para las tres variantes (`GbMenuProps`). Los tipos de datos salen de `@grana/blocks/booking`.

| Prop | Tipo | Descripción |
| --- | --- | --- |
| `title` | `string` (requerida) | Título de la carta (`GSection`). |
| `description` | `string` | Descripción de la sección. |
| `sections` | `MenuSection[]` (requerida) | 1 a 12 tiempos (C7); un tiempo con 1 a 40 platos (C7). `id` = ancla estable (#comida); en 02 abre su pestaña |
| `prices` | `PriceRegion` (requerida) | Una carta dice su moneda (#772): una GPriceScope con su leyenda; sin ella, K3 |
| `locale` | `string` | BCP 47; sin él, el `lang` del ancestro al montar. |
| `labels` | `MenuLabels` (requerida) | tabs (02), tags (con algún tags), unavailable (available: false), hours (con algún hours), price (legend, onRequest); sin valores por defecto (C5) |

## Eventos

**Ninguno.** La carta no tiene intención: pedir es de tu aplicación.

## Slots

| Slot | Alcance | Qué va |
| --- | --- | --- |
| `item` | `{ item: MenuItem; section: MenuSection }` | Escape: el cuerpo de un plato (lo que va tras el nombre) |

## Textos (`labels`)

| Clave | Requerido |
| --- | --- |
| `tabs` | Sí, en 02 (C5): nombre del `tablist` |
| `tags` | Sí, con algún `tags` (C5): nombre de la lista de avisos |
| `unavailable` | Sí, con `available: false` (C5) |
| `hours` | Sí, con algún `hours` (C5) |
| `price` | `legend` (lo avisa `GPriceScope`) y `onRequest` con un `null` (lo avisa `GPrice`) |

## Teclado y foco

| Tecla | Efecto |
| --- | --- |
| Flechas izquierda y derecha en las pestañas de 02 | Cambian de pestaña (el teclado de `GTabs`) |
| `Tab` | Entra en la pestaña activa y sale al panel; la carta no tiene más controles |

El bloque no añade teclas.

## Accesibilidad

Cifras de la auditoría de coco ([`design/lab/blocks/booking/auditoria.md`](../../../../../design/lab/blocks/booking/auditoria.md)), tres motores, tres temas, claro y oscuro (`medido`):

a. El plato es un `dl` real con `dt` y `dd` en el orden contratado dentro de una `GText`, con el `dd` sin la sangría del navegador (#863, corregido en `GText.css`); la leyenda de moneda se dice una sola vez (un `GPriceScope` por carta) y ningún precio queda fuera de `GPrice` (`prueba`, Vitest).
b. «Agotado hoy» tiene contraste ≥ 4,5:1 y el plato sigue en el DOM (1.4.1).
c. Los avisos son texto en `GTag` estáticas y neutras, sin `href` ni `pressed`.
d. El filete de la leyenda de moneda no queda suelto al principio de una línea (BK-C4, corregido en `GPriceScope.css`).
e. 02: el cambio de pestaña dura 240 ms y la fila no se mueve; con movimiento reducido no hay desplazamiento.
f. Sin desplazamiento horizontal a 1440, 390, 320 ni a 320 con el texto al 200 % (un nombre largo sin espacios no desborda en 01 y 03).

> **Peligro.** `prices` es obligatoria: sin ella la carta se pinta sin región y **cada precio lleva su código de moneda** (aviso K3), lo que ensucia la carta y repite «MXN» en cada plato. Y un precio en otra moneda que `prices.currency` se pinta con su código (aviso M1): casi siempre es un error de datos, no una carta de dos monedas.

## Avisos de desarrollo

Prefijo `[Grana GbMenu<NN>]`, una vez por instancia y motivo, solo en desarrollo. Los comunes (C1 a C4, C7, K3) están en [`packages/blocks/README.md`](../../../README.md#avisos-comunes-de-booking). Los propios:

| Código | Motivo | Qué pasa |
| --- | --- | --- |
| M1 | Un `MenuItem.price` en otra moneda que `prices.currency` | Se pinta con su código |
| M2 | `section.id` repetido o ausente en 02 | La pestaña usa el índice |

## Banco de datos de ejemplo

`menu.bank.js` exporta `{ props, slots }`: el restaurante de la casa con tres tiempos (Desayuno con `hours`, Comida con `description`, Cena) y nueve platos: uno con `lang: 'zap'`, uno con tres avisos, uno `available: 'Agotado hoy'`, uno con precio `null`, uno «por pieza», tres con foto, uno mínimo y una palabra sin espacios para la prueba de 320 px; `prices` `{ currency: 'MXN', taxes: 'IVA incluido' }` y `labels` completos. Banco real: `packages/blocks/playground/booking/menu.html`.

## Peso

`dist/booking.js` pesa **36 851 B gzip** con su trozo compartido de `common/` (las 11 secciones y 33 variantes; `medido` con `node packages/blocks/scripts/measure-entry.mjs booking`  2026-10-23); tope de la entrada **37 888 B** (DECISIONS #907; el tope inicial de 36 KiB no se vuelve a subir). Una variante importada sola (esbuild minificado  `vue` y `@grana/vue*` externos; `node packages/blocks/scripts/measure-partial.mjs 5120 booking GbGuestForm=7168`): `GbMenu01` 2 657 B  `GbMenu02` 2 845 B  `GbMenu03` 2 777 B; tope por variante **5 120 B** (#887). `@grana/vue` y sus entradas son *peer*: las paga la aplicación.

## Alcance

- **No pide ni cobra:** la carta es lectura; pedir es de tu aplicación (#780).
- **Una moneda por carta:** una carta con dos monedas sin alternativas suele ser un error de datos (M1).
- **El precio va debajo del nombre (BK-L3):** sin CSS no hay renglón con el precio al borde derecho. **Reservado:** una forma de renglón en `GText` para `dl` (el último `dd` al final de la línea) o un `GSummary` con lectura aparte del precio.
- **Los avisos son neutros:** `GTag` sin color de categoría; no se distinguen por color.
- **02 usa los slots `panel-{id}` de `GTabs`**, no `GTabPanel` (#890).
- **Sin CSS ni utilidades** (#763, #807).

## Verificación

| Qué | Resultado | Nivel |
| --- | --- | --- |
| Vitest de `GbMenu` (un `GPriceScope` por carta y ningún precio fuera de `GPrice`; `dl` real con `dt` y `dd` en el orden del contrato; `lang` en el nombre; `GTag` sin `href` ni `pressed`; lo agotado en el DOM con su texto; 02 con una pestaña por tiempo y la del `hash` activa al montar) | 42/42 (`npm test -w @grana/blocks`, 2026-10-23) | `prueba` |
| Auditoría de coco: Menu 01, 02 y 03; BK-C4 corregido; cambio de pestaña en 240 ms con la fila quieta | Veredicto `candidate`, sin hallazgos propios abiertos | `medido` |

**No verificado:** lector de pantalla real (el `dl`, el nombre de la lista de avisos, el `lang` del plato); `forced-colors` real; rendimiento con el perfilador (la auditoría sugiere medirlo si Menu crece mucho; el contrato admite hasta 12 tiempos y 40 platos por tiempo). **Pendientes abiertos:** BK-L3 (reservado); los generales, en [`PENDIENTES.md`](../../../../../PENDIENTES.md).

## Fuentes

- Contrato: [`design/contracts/blocks/menu.md`](../../../../../design/contracts/blocks/menu.md) y [`_comun.md`](../../../../../design/contracts/blocks/_comun.md) (§15 a §25); [`text.md`](../../../../../design/contracts/text.md) (regla 8 bis, `dl`).
- Decisiones: #860 a #866, #863, #875, #890, #907 en `DECISIONS.md`.
- Metadatos: [`GbMenu.meta.json`](./GbMenu.meta.json). Pruebas: [`GbMenu.test.js`](./GbMenu.test.js). Auditoría: [`design/lab/blocks/booking/auditoria.md`](../../../../../design/lab/blocks/booking/auditoria.md).
