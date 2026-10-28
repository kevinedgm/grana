# GbCart · GbCart01, GbCart02 y GbCart03

Lo que vas a comprar, **línea a línea con lo que elegiste, lo que cuesta, lo que falta para pedirlo y el total que se cobrará**. Cambiar una cantidad o quitar una línea no te hace perder el sitio: quitar deja su huella en el mismo lugar, con «Deshacer» y el foco ahí. **No suma**: pinta los `Totals` que recibe, vengan de [`cartTotals`](../../../README.md#carttotals) o de tu servidor. Compone `GSection`, `GStack`, `GSplit`, `GCard`, `GNumberField`, `GBtn`, `GPrice` y `GPriceScope` (`@grana/vue/price`), `GText`, `GProgress`, `GEmpty` y `GDialog`; no trae color, CSS ni textos propios.

**Etiquetas:** `<gb-cart-01>`, `<gb-cart-02>`, `<gb-cart-03>` · **Estado:** `candidate` (ver «Verificación») · **Desde:** `0.0.0` (paquete privado, aún sin publicar) · **Entrada:** `@grana/blocks/ecommerce`

```js
import { GbCart01, GbCart02, GbCart03 } from '@grana/blocks/ecommerce'
```

> `@grana/blocks` es privado (`0.0.0`) y no se publica con la beta `0.1.0` de `@grana/vue`. Por ahora se usa desde el repositorio (banco real en `packages/blocks/playground/ecommerce/cart.html`). Exige `@grana/vue` (peer, `>=0.1.0-beta.0 <1.0.0`) y Vue `^3.5.0`. Además de `@grana/vue`, la aplicación carga la entrada que esta sección compone: `@grana/vue/price`. Reglas comunes e instalación: [`packages/blocks/README.md`](../../../README.md#ecommerce).

## Qué lo hace distinto

**El carrito dice lo que te falta, y quitar no te hace perder nada** (DECISIONS #921). Antes de pagar dice en palabras lo que no entrará («Un artículo ya no está disponible y no entra en tu pedido»), lo que aún no se sabe («El envío se calcula en el siguiente paso») y, si la tienda lo usa, cuánto falta para el envío gratis. Quitar una línea deja **su huella en el sitio** con «Deshacer» y el foco ahí mismo: un toque de más con el pulgar se arregla sin buscar el producto otra vez, y quien usa lector no queda perdido en la página. Cambiar una cantidad hace rodar solo las cifras del total que cambian, y la talla y el color que elegiste se leen igual que en la ficha.

## Las tres variantes

Las tres reciben la misma `interface Props` (`GbCartProps`, el mismo objeto `props` de `props.js`). Lo que una variante no usa, lo ignora en silencio.

| Variante | Concepto | Compone | Ignora |
| --- | --- | --- | --- |
| `GbCart01` | Lista + resumen al lado: la página del carrito | `GSection` > `GPriceScope` > `GSplit ratio="3:2" gap="lg"` > [`#start`: `GStack as="ul" gap="md"` con las líneas y la huella] + [`#end`: `GCard as="section"`, el resumen] | `open`, `from`, `labels.close`, `labels.dialog` |
| `GbCart02` | Resumen al pie: una columna, las líneas y, al final, el resumen con el total justo antes de pagar | `GSection` > `GPriceScope` > `GStack gap="lg"` > `GStack as="ul" gap="md"` con las líneas + el resumen | `open`, `from`, `labels.close`, `labels.dialog` |
| `GbCart03` | Cajón: el carrito que se abre al borde sin salir de la página; pantalla completa en el teléfono | `GDialog placement="end" size="sm" mobile="fullscreen"` (la raíz; `v-model:open`, `title`, `closeLabel` = `labels.close`, `from`) > `GPriceScope` > `GStack gap="md"` > líneas **sin foto** + resumen con solo el total | La foto de las líneas y las líneas del desglose con importe (salvo las de `amount: null`, que se dicen) |

**01 con el resumen al lado, cuando cabe** (DECISIONS #950, que cierra CR-L1): `GSplit ratio="3:2" gap="lg"` (con `collapse` por defecto, `md`) pone el resumen junto a las líneas **cuando el resumen cabe en 320 px**. Con el tema por defecto, a partir de **848 px de caja** (`320 × 5 / 2 + 48`): a 1440 son 586 · 390 y a 1024 son 536 · 358; a 768, 390, 320 y con el texto al 200 % queda **apilado**, con el resumen al final por el orden del DOM (1.3.2). Quien lo quiera siempre al pie usa 02. Con un tema de cuerpo mayor el umbral sube ([`GSplit/README.md`](../../../../vue/src/components/GSplit/README.md#cuándo-va-al-lado)). **Sin columna pegada:** el resumen no se queda fijo al desplazar (BK-L1; `sticky` de `GSplit` reservado, #951); quien lo quiera pegado lo hace con su CSS en **su** contenedor.

**Una línea** (`GCard as="li" level="flat" orientation="horizontal"`; 03 sin foto):

- **La foto** (decorativa, `product.photos[0]`), `maker`, el **nombre** del producto (enlace si hay `product.href`, que emite `navigate`) y **la elección** tal como viaja desde la ficha («Talla · M», «Color · Grana»).
- **El precio:** `GPrice` con el unitario (`labels.each` «c/u», `labels.eachLabel` «cada una») y, con `line.total`, el total de la línea con su unidad («por 2 piezas»). Las cifras del total **ruedan** cuando tu aplicación cambia `line.total` (con `prefers-reduced-motion`, no). Una `compareAt` se dice con su `compareLabel`.
- **La cantidad:** `GNumberField` (`min`, `max`, paso 1, sin decimales) con el nombre del producto («Cantidad de Rebozo de algodón») y «Quitar» (nombre accesible «Quitar Rebozo de algodón»). Con diez líneas, diez «Quitar» iguales no se distinguirían en la lista de controles (2.4.6).
- **No disponible:** la línea sigue a la vista con su motivo, **sin campo de cantidad** (solo «Quitar») y **fuera del total**. El resumen lo dice antes de la acción principal (`labels.excluded`).

**El resumen** (`GCard as="section"`, `labels.summary`): el umbral hacia el envío gratis (`goals` de `CartTotals`, el primero: una barra `GProgress` con su rol y su frase «Te faltan $310 para el envío gratis»; alcanzado, solo la frase «Ya tienes el envío gratis»), un `dl` con las líneas de `totals.lines` no incluidas, **el total como último par** y las incluidas después («Incluye IVA $397,24»), lo excluido, la garantía (`assurance`, que describe la acción principal) y las acciones (la primera `solid` a lo ancho, la segunda `outline`). **El bloque no comprueba que las líneas sumen el total**: el banco da un total que no es la suma y se pinta tal cual. Una línea con `amount: null` dice `labels.pending` («Se calcula en el siguiente paso»), nunca un cero. **Vacío:** sin líneas ni huella, `GEmpty` con la **segunda** acción («Seguir comprando»); sin resumen ni acción principal.

**El cajón (03).** El primer Esc con el foco en la cantidad lo toma `GNumberField` (devuelve el texto) y el segundo cierra el cajón (Esc escalonado). El foco vuelve al disparador (`from`) al cerrar. Las escuchas de los eventos de `GDialog` (`open`, `closed`…) que pongas sobre el bloque no se enganchan al diálogo: son tuyas.

## Recetas

### Quitar, deshacer y cambiar la cantidad

El bloque es de vista: **emite** y **tu aplicación decide**. La huella aparece solo cuando tu aplicación quita la línea de `lines` después de `remove`; si no la quita, no hay huella. `restore` te devuelve la línea y su índice para que la pongas donde estaba, con su cantidad (no es un `add`). Los totales se vuelven a pedir a `cartTotals` (o al servidor): el bloque no los recalcula.

```vue
<!-- Fragmento: `precios`, `etiquetas` y `acciones` son de tu aplicación -->
<script setup>
import { computed, ref } from 'vue'
import { GbCart01, cartTotals } from '@grana/blocks/ecommerce'

const mxn = (amount) => ({ amount, currency: 'MXN' })
const lineas = ref([
  { id: 'l1', product: { id: 'espadin', name: 'Mezcal espadín' }, quantity: 2, unitPrice: mxn(890) },
  { id: 'l2', product: { id: 'rebozo', name: 'Rebozo de algodón' }, options: [{ key: 'color', label: 'Color', value: 'Grana' }], quantity: 1, unitPrice: mxn(2400) }
])

const totales = computed(() => cartTotals(lineas.value, {
  currency: 'MXN',
  shipping: { label: 'Envío', amount: null },
  taxes: [{ label: 'Incluye IVA', rate: 0.16, included: true }],
  goals: [{ id: 'envio', label: 'el envío gratis', target: mxn(3000) }],
  labels: { subtotal: 'Subtotal', total: (n) => `por ${n} ${n === 1 ? 'pieza' : 'piezas'}` }
}))
// El total de cada línea lo da cartTotals (byLine): se copia a CartLine.total
const conTotal = computed(() => lineas.value.map((l) => ({ ...l, total: totales.value.byLine[String(l.id)] ?? l.total })))

function cambiar({ line, quantity }) {
  lineas.value = lineas.value.map((l) => (l.id === line.id ? { ...l, quantity } : l))
}
function quitar({ line }) {
  lineas.value = lineas.value.filter((l) => l.id !== line.id)
}
function devolver({ line, index }) {
  const { total, ...sinTotal } = line
  const copia = [...lineas.value]
  copia.splice(Math.min(index, copia.length), 0, sinTotal)
  lineas.value = copia
}
</script>

<template>
  <GbCart01 title="Tu carrito" :lines="conTotal" :totals="totales" :prices="precios" :actions="acciones" :labels="etiquetas"
    @change="cambiar" @remove="quitar" @restore="devolver" />
</template>
```

`change` solo llega por gesto (al soltar el escalón, al salir del campo o con Intro), nunca en cada tecla, con `event: null` (`GNumberField` entrega el valor, no un evento del DOM, #936). Cantidad 0 equivale a quitar.

### Abrir el cajón desde un botón (03)

```vue
<!-- Fragmento: `lineas`, `totales`, `precios`, `acciones` y `etiquetas` son de tu aplicación -->
<script setup>
import { ref } from 'vue'
import { GBtn } from '@grana/vue'
import { GbCart03 } from '@grana/blocks/ecommerce'

const abierto = ref(false)
const disparador = ref(null)
</script>

<template>
  <GBtn ref="disparador" @click="abierto = true">Carrito</GBtn>
  <GbCart03 v-model:open="abierto" :from="disparador?.$el" title="Tu carrito" :lines="lineas" :totals="totales"
    :prices="precios" :actions="acciones" :labels="etiquetas" />
</template>
```

## Uso

Los datos y textos comunes de la tienda (`precios`, `priceLabels`) están en [«Datos comunes de una tienda»](../../../README.md#datos-comunes-de-una-tienda).

```vue
<!-- Fragmento: `lineas`, `totales`, `precios`, `priceLabels` y `irAPagar` son de tu aplicación -->
<script setup>
import { GbCart02 } from '@grana/blocks/ecommerce'

const etiquetas = {
  quantity: (name) => `Cantidad de ${name}`, decrement: 'Quitar una', increment: 'Añadir una',
  remove: (name) => `Quitar ${name}`, removeText: 'Quitar', removed: (name) => `Quitaste ${name}`, undo: 'Deshacer',
  unavailable: 'Ya no está disponible',
  excluded: (n) => (n === 1 ? 'Un artículo ya no está disponible y no entra en tu pedido.' : `${n} artículos ya no están disponibles y no entran en tu pedido.`),
  forQuantity: (n) => `por ${n} ${n === 1 ? 'pieza' : 'piezas'}`, each: 'c/u', eachLabel: 'cada una',
  summary: 'Resumen', total: 'Total', pending: 'Se calcula en el siguiente paso',
  goal: 'Te faltan {remaining} para {label}', goalReached: (label) => `Ya tienes ${label}`,
  empty: { title: 'Tu carrito está vacío', description: 'Lo que añadas desde la tienda aparece aquí.' },
  price: priceLabels, external: 'se abre en otra pestaña'
}
const acciones = [
  { label: 'Pagar', href: '/pago' },
  { label: 'Seguir comprando', href: '/tienda' }
]
</script>

<template>
  <GbCart02 title="Tu carrito" :lines="lineas" :totals="totales" :prices="precios" :actions="acciones"
    assurance="Devoluciones gratis en 30 días." :labels="etiquetas"
    @remove="() => {}" @restore="() => {}" @navigate="({ event, href }) => { event.preventDefault(); irAPagar(href) }" />
</template>
```

## Ejemplos

### e1 · La página del carrito con el resumen al lado (`GbCart01`)

**Por qué:** cuando el carrito es una página propia y la persona compara lo que lleva con lo que cuesta. En escritorio el total está a la vista junto a las líneas; en la tablet y el teléfono el resumen pasa debajo, antes de la acción de pagar.

```vue
<!-- Fragmento: `lineas`, `totales`, `precios`, `acciones`, `etiquetas`, `quitar` y `devolver` son de tu aplicación -->
<GbCart01 title="Tu carrito" :lines="lineas" :totals="totales" :prices="precios" :actions="acciones" :labels="etiquetas" @remove="quitar" @restore="devolver" />
```

### e2 · Una sola columna con el total justo antes de pagar (`GbCart02`)

**Por qué:** cuando el carrito va en una columna estrecha o el flujo es de teléfono primero: las líneas y, al final, el resumen con el total justo encima de «Pagar».

```vue
<!-- Fragmento: los datos son de tu aplicación -->
<GbCart02 title="Tu carrito" :lines="lineas" :totals="totales" :prices="precios" :actions="acciones" :labels="etiquetas" @remove="quitar" @restore="devolver" />
```

### e3 · El carrito sin salir de la página (`GbCart03`)

**Por qué:** cuando la persona sigue comprando y quiere ver el carrito sin perder dónde estaba. El cajón se abre al borde, con solo el total (sin desglose) y pantalla completa en el teléfono; el foco vuelve al botón del carrito al cerrar.

```vue
<!-- Fragmento: ver «Abrir el cajón desde un botón» -->
<GbCart03 v-model:open="abierto" :from="disparador?.$el" title="Tu carrito" :lines="lineas" :totals="totales" :prices="precios" :actions="acciones" :labels="etiquetas" />
```

### e4 · Algo propio dentro del carrito (slots `line`, `summary` y `actions`)

**Por qué:** cuando tu tienda ofrece un extra que Grana no conoce (envolver para regalo, un campo de cupón). Los slots ponen contenido al final de una línea o del resumen; el bloque no lo lee ni lo valida.

```vue
<!-- Fragmento: `cupon` y `aplicarCupon` son de tu aplicación -->
<GbCart01 v-bind="carrito">
  <template #summary="{ totals }">
    <GInput v-model="cupon" label="Código de descuento" @change="aplicarCupon" />
  </template>
</GbCart01>
```

## Props

Una sola interfaz para las tres variantes (`GbCartProps`). Los tipos de datos salen de `@grana/blocks/ecommerce`.

| Prop | Tipo | Descripción |
| --- | --- | --- |
| `title` | `string` (requerida) | «Tu carrito»: título de la sección (01, 02) o del cajón (03). |
| `lines` | `CartLine[]` (requerida) | 0 a 50 (C7 por encima). `id` obligatorio (EC5); sin `product.name` o sin `unitPrice` se omite (C2); `quantity` fuera de `min`/`max` (CA1). Vacío y sin huella: `GEmpty` con la segunda acción. |
| `totals` | `Totals \| CartTotals` (requerida) | De tu aplicación (`cartTotals` o su servidor): el bloque pinta lo dado, no suma. Con `CartTotals`, además `goals` (el umbral) y `excluded` (lo que no entra). Sin `total.label`, CA2. |
| `prices` | `PriceRegion` (requerida) | Obligatoria (EC1): **una** región de precios alrededor de las líneas y el resumen. |
| `actions` | `Action[]` (requerida) | `[pagar, seguir comprando?]`: la primera `solid` a lo ancho, la segunda `outline`; vacío: solo la segunda, en el `GEmpty`. C8 con más de dos. |
| `assurance` | `string` | «Devoluciones gratis en 30 días»: describe la acción principal (`aria-describedby`). |
| `busy` | `(string \| number)[] = []` | `id` de las líneas que se están actualizando: su cantidad y su «Quitar» quedan `disabled`. |
| `open` | `boolean = false` | Solo `GbCart03`. `v-model:open`: el cajón abierto. |
| `from` | `CartFrom \| null` | Solo `GbCart03`. El disparador: el foco vuelve a él al cerrar (`from` de `GDialog`). |
| `locale` | `string` | BCP 47; sin él, el `lang` del ancestro al montar. |
| `labels` | `CartLabels` (requerida) | `quantity`, `decrement`, `increment`, `remove`, `removed`, `undo`, `summary`, `total` y `empty` (C5); `removeText` con `remove` función; `unavailable`, `excluded`, `forQuantity`/`each`/`eachLabel`, `pending`, `goal`/`goalReached` según el estado; `close` y `dialog` en 03; `price`; `external`. Sin valores por defecto. |

## Eventos

| Evento | Carga | Cuándo |
| --- | --- | --- |
| `change` | `{ event: null, line, quantity }` (`CartLineChange`) | La cantidad de una línea cambia **por gesto** (suelta el escalón, sale del campo o Intro), mayor que 0 |
| `remove` | `{ event, line, index }` (`CartLineEvent`; `event: null` al quitar por cantidad 0) | «Quitar» o cantidad 0. Cuando tu aplicación quita la línea de `lines`, el bloque deja la huella con el foco en «Deshacer» |
| `restore` | `{ event, line, index }` (`CartLineEvent`) | «Deshacer»: tu aplicación devuelve la línea a ese índice con su cantidad (no es un `add`) |
| `navigate` | `{ event, href, item }` | El nombre de un producto (`item` = la línea) o una acción con `href`, con clic primario; nunca con `external` |
| `activate` | `{ event, item }` | Una acción sin `href` |
| `update:open` | `boolean` | Solo `GbCart03`: abrir y cerrar el cajón |

## Slots

| Slot | Alcance | Qué va |
| --- | --- | --- |
| `line` | `{ line: CartLine }` | Escape: contenido al final del cuerpo de una línea (por ejemplo «Envolver para regalo») |
| `summary` | `{ totals: Totals \| CartTotals }` | Escape: contenido del resumen antes de las acciones (por ejemplo el campo de cupón) |
| `actions` | `{ describedby: string \| undefined }` | Escape de las acciones, con el `id` de la garantía |

## Textos (`labels`)

| Clave | Requerido |
| --- | --- |
| `quantity`, `decrement`, `increment`, `remove`, `removed`, `undo`, `summary`, `total`, `empty` | Sí (C5) |
| `removeText` | Sí, si `remove` es una función (C5: el texto visible) |
| `unavailable` | Sí, con una línea `available: false` (C5) |
| `excluded` | Sí, con `excluded` no vacío (C5) |
| `forQuantity`, `each`, `eachLabel` | Sí, con `line.total` (C5; sin ellos, el unitario solo) |
| `pending` | Sí, con una línea de `amount: null` (C5) |
| `goal`, `goalReached` | Sí, con `goals` (C5; sin ellos, sin umbral) |
| `close`, `dialog` | Sí, en 03 (C5; `dialog` avisa `GDialog`) |
| `price`, `external` | Los de `GPrice` (avisa él) / con una acción externa (C5) |

## Teclado y foco

| Tecla | Efecto |
| --- | --- |
| `Tab` | Orden del DOM: por línea, el nombre (si es enlace), la cantidad y «Quitar»; luego el resumen y sus acciones |
| `Flechas arriba/abajo`, `Intro` en la cantidad | Cambian el valor del campo; `change` llega al salir del campo o con Intro (teclado de `GNumberField`) |
| `Intro` o `Espacio` en «Quitar» | Emite `remove`; si la aplicación quita la línea, el foco pasa a «Deshacer» de su huella |
| `Esc` con el foco en la cantidad (03) | El primero devuelve el texto del campo; el segundo cierra el cajón y devuelve el foco al disparador |

La huella se va cuando **foco y puntero** salen de ella o cuando la línea vuelve; **no por tiempo** (nada se va solo mientras se lee, 2.2.1).

## Accesibilidad

Cifras de la auditoría de coco ([`design/lab/blocks/ecommerce/auditoria.md`](../../../../../design/lab/blocks/ecommerce/auditoria.md)), tres motores, tres temas, claro y oscuro (`medido`):

a. Las líneas son una lista real (`ul > li`); el nombre de cada campo de cantidad y de cada «Quitar» incluye el producto.
b. Quitar deja el foco en «Deshacer» (nunca cae en `body`); el cambio de total lo anuncia el control que lo provocó y el total está a un Tab. **Sin región viva propia.**
c. La línea no disponible sigue a la vista con su motivo, sin cantidad y fuera del total; el resumen lo dice antes de pagar.
d. El umbral del envío gratis es un `progressbar` con su frase como nombre; alcanzado, solo la frase.
e. 01 con el resumen al lado (CR-L1 cerrado por #950: 586 · 390 a 1440, 536 · 358 a 1024) y apilado a 768, 390 y 320 y con el texto al 200 %, sin desplazamiento horizontal; las líneas sin desbordar a 320 con el nombre largo de la prueba.
f. 03 a pantalla completa a 390; el foco vuelve al disparador al cerrar.
g. Movimiento: las cifras del total ruedan al cambiar `line.total` y, con `prefers-reduced-motion`, no.

> **Peligro.** Si tu aplicación escucha `remove` pero no quita la línea de `lines`, la persona pulsa «Quitar» y no pasa nada (el bloque no quita por su cuenta; la huella solo aparece cuando la línea sale de `lines`). Y si no escuchas `restore`, la huella se pinta sin «Deshacer» (aviso CA3): un toque de más no se puede arreglar. Las dos escuchas son parte del contrato del bloque.

## Avisos de desarrollo

Prefijo `[Grana GbCart<NN>]`, una vez por instancia y motivo, solo en desarrollo. Los comunes (C1 a C8, K3, K4, EC1 a EC7) están en [`packages/blocks/README.md`](../../../README.md#avisos-comunes-de-ecommerce). Los de esta sección: C2 (línea sin `product.name` o sin `unitPrice`, o `totals` sin total), C3, C5, C6, C7 (más de 50 líneas), C8, K3, K4, EC1, EC5 y los propios:

| Código | Motivo | Qué pasa |
| --- | --- | --- |
| CA1 | `quantity` fuera de `min` o `max` en una línea | Se pinta lo dado; `GNumberField` lo ajusta al gesto |
| CA2 | `totals.total` sin `label` | El total necesita su unidad («por 3 piezas») |
| CA3 | Sin escucha de `remove` o de `restore` | La huella se pinta sin «Deshacer» |

## Banco de datos de ejemplo

`cart.bank.js` exporta `{ LABELS, props, states, cart, app }`: el carrito común de Barro y Agave. Mezcal espadín × 2 (con su `total` de `byLine`), rebozo de algodón Grana × 1 (la elección Color · Grana, con la referencia de precio nombrada), el plato de barro verde que ya no queda y un artículo de nombre largo sin espacios para la prueba de 320 px; `totals` = `cartTotals(...)` con IVA incluido, envío por calcular y el umbral del envío gratis; `actions` «Pagar» y «Seguir comprando»; `assurance` y `labels` completos. `states` trae `ocupado`, `umbral`, `vacio` y `abierto`; `app(view, events, n)` hace lo que haría la aplicación (cambia la cantidad, quita y devuelve la línea y vuelve a pedir los totales). Con él ninguna variante avisa. Banco real: `packages/blocks/playground/ecommerce/cart.html` (`?estado=<clave>`).

## Peso

`dist/ecommerce.js` pesa **49 557 B gzip** con sus trozos compartidos (`medido` con `node packages/blocks/scripts/measure-entry.mjs ecommerce`, 2026-10-28, tras recomponer con `GSplit`, que va en `@grana/vue` y es externo); tope de la entrada **51 200 B** (DECISIONS #932; no se vuelve a subir: con más, decide el usuario; margen de 1 643 B). Una variante importada sola (esbuild minificado, `vue` y `@grana/vue*` externos; `node packages/blocks/scripts/measure-partial.mjs 7168 ecommerce GbCheckout=9728 +cartTotals=2048`): `GbCart01` 6 271 B, `GbCart02` 6 256 B, `GbCart03` 6 424 B; tope por variante **7 168 B** (#932). `cartTotals` sola 1 922 B de 2 048 B. `@grana/vue` y sus entradas son *peer*: las paga la aplicación.

## Alcance

- **No suma ni calcula el envío o los impuestos:** pinta los `Totals` que recibe (#911); la aritmética está en `cartTotals`, que tu aplicación llama o no.
- **No quita ni devuelve líneas por su cuenta:** emite `remove` y `restore`; tu aplicación cambia `lines` (#913, #921).
- **No guarda el carrito ni valida existencias, cupones o precios:** `available` y `excluded` los da tu aplicación.
- **No paga:** las acciones emiten `navigate` o `activate`; el pago es de tu aplicación (#922).
- **Sin muelle ni columna pegada** (BK-L1, BK-L2): en 02 el total está justo encima de «Pagar»; en 01 el resumen no se pega al desplazar.
- **Mini carrito en la cabecera:** receta con `GBadge` sobre el `GBtn` del carrito y `GbCart03`; Grana no trae un componente propio.
- **Sin CSS ni utilidades** (#763, #807).

## Verificación

| Qué | Resultado | Nivel |
| --- | --- | --- |
| Vitest de `GbCart` (`change` solo por gesto con la carga exacta; cantidad 0 → `remove`; la huella en el mismo índice con el foco en «Deshacer» y `restore` con `line` e `index`; la huella se va con foco y puntero fuera, no por tiempo; sin escucha de `restore`, sin «Deshacer»; la línea no disponible sin cantidad y fuera del total; el total es el de `totals`; un solo `GPriceScope`; `GProgress` con su rol; 01 con `GSplit`; 03 con el foco de vuelta al disparador) | **48 de 48** (`npm test -w @grana/blocks`, 2026-10-28) | `prueba` |
| Auditoría de coco: CR-L1 cerrado con `GSplit` (586 · 390 a 1440, apilado a 768, 390 y 320 y con el texto al 200 %, por la caja medida en cada tema y motor) y EC-B1 en verde | Ecommerce **11 129/11 129** en Chromium, Firefox y WebKit, tres temas, claro y oscuro, `forced-colors` y RTL (addendum del 2026-10-28). Veredicto `candidate` | `medido` |

**No verificado:** lector de pantalla real (el foco que llega a «Deshacer», el nombre de cada «Quitar», el umbral del envío gratis); `forced-colors` real y en Firefox y WebKit; teléfono real y puntero grueso; el cajón con teclado virtual; rendimiento con el perfilador (el contrato admite hasta 50 líneas). **Pendientes abiertos:** columna pegada y muelle genérico (BK-L1, BK-L2) y los generales, en [`PENDIENTES.md`](../../../../../PENDIENTES.md).

## Fuentes

- Contrato: [`design/contracts/blocks/cart.md`](../../../../../design/contracts/blocks/cart.md) y [`_comun.md`](../../../../../design/contracts/blocks/_comun.md) (§26 a §40); `GSplit` en [`design/contracts/split.md`](../../../../../design/contracts/split.md).
- Decisiones: #909 a #914, #911, #921, #932, #933, #936, #940, #946 a #951 y #955 en `DECISIONS.md`.
- Metadatos: [`GbCart.meta.json`](./GbCart.meta.json). Pruebas: [`GbCart.test.js`](./GbCart.test.js). Auditoría: [`design/lab/blocks/ecommerce/auditoria.md`](../../../../../design/lab/blocks/ecommerce/auditoria.md).
