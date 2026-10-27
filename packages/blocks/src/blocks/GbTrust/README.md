# GbTrust · GbTrust01, GbTrust02 y GbTrust03

Lo que la tienda promete (envío, devoluciones, pago seguro, hecho a mano) **dicho en una frase y con su letra pequeña a un toque**: cada promesa enlaza a la política que la sostiene (el ancla de [`GbPolicies`](../GbPolicies/README.md)) o a su prueba. Sin sellos de «compra segura» dibujados ni logotipos mudos: la confianza se dice en palabras. Compone `GSection`, `GAdaptiveLayout`, `GStack`, `GCard`, `GIcon`, `GBtn` y `GText`; no trae color, CSS ni textos propios, y no necesita ninguna entrada extra de `@grana/vue`.

**Etiquetas:** `<gb-trust-01>`, `<gb-trust-02>`, `<gb-trust-03>` · **Estado:** `candidate` (ver «Verificación») · **Desde:** `0.0.0` (paquete privado, aún sin publicar) · **Entrada:** `@grana/blocks/ecommerce`

```js
import { GbTrust01, GbTrust02, GbTrust03 } from '@grana/blocks/ecommerce'
```

> `@grana/blocks` es privado (`0.0.0`) y no se publica con la beta `0.1.0` de `@grana/vue`. Por ahora se usa desde el repositorio (banco real en `packages/blocks/playground/ecommerce/trust.html`). Exige `@grana/vue` (peer, `>=0.1.0-beta.0 <1.0.0`) y Vue `^3.5.0`; esta sección no compone ninguna entrada propia de `@grana/vue`. Los iconos que no son de la lista de la librería los registra tu aplicación con `createIcons`. Reglas comunes e instalación: [`packages/blocks/README.md`](../../../README.md#ecommerce).

## Qué lo hace distinto

**Cada promesa lleva a su letra pequeña** (DECISIONS #926). «Devoluciones en 30 días» no es un eslogan: enlaza a la política que la sostiene (el mismo ancla que el consentimiento del pago), así quien duda la lee en un toque y la tienda no promete lo que no escribió. Si una promesa no tiene ni `action` ni `policy`, se pinta sin enlace y el bloque avisa (PR1) para que la enlaces.

## Las tres variantes

Las tres reciben la misma `interface Props` (`GbTrustProps`, el mismo objeto `props` de `props.js`). Lo que una variante no usa, lo ignora en silencio.

| Variante | Concepto | Compone | Ignora |
| --- | --- | --- | --- |
| `GbTrust01` | Fila: tres o cuatro promesas en una fila bajo el héroe o sobre el pie | `GSection` > `GAdaptiveLayout role="list"` > `div role="listitem" class="g-adapt-standard"` > `GCard as="div" level="flat" density="compact" titleLines="none"` (`lead` = `GIcon`, `title`, `description`, `actions` = la prueba) | — |
| `GbTrust02` | Tarjetas: cada promesa en su tarjeta, con más texto | `GSection` > `GAdaptiveLayout role="list"` > `div role="listitem" class="g-adapt-standard"` > `GCard as="div"` (con borde) con el mismo contenido | — |
| `GbTrust03` | Lista al pie: una lista compacta en el pie del carrito o del pago | `GSection` > `GStack as="ul" gap="sm"` > `li` > `GText size="body-sm"` (el `GIcon` en línea, decorativo, + el título en `strong` + la descripción) + la prueba en `GBtn variant="link"` | — |

**La promesa (común):** icono decorativo (`icon`, Lucide; sin icono, la promesa se pinta igual), título, descripción (una o dos líneas) y su prueba. **La prueba** es `action` (un `GBtn variant="link"`, con `navigate` o `activate`) o, con `policy` y sin `action`, un enlace a `#{policy}` con el texto `labels.policy`; si hay las dos, gana `action`. **En 03 la promesa no es un encabezado** (una lista al pie con cuatro `h3` ensucia la navegación por encabezados); en 01 y 02 el título de la tarjeta va un nivel por debajo de la sección.

## Recetas

### Políticas de la tienda con `GbPolicies`

La letra pequeña que sostiene cada promesa es [`GbPolicies`](../GbPolicies/README.md) de `@grana/blocks/booking`, que la tienda importa tal cual (DECISIONS #914; la sección no se reexporta en `ecommerce`). El `id` de cada política es el ancla que cita `policy`:

```vue
<!-- Fragmento: `promesas` y `politicas` son de tu aplicación; las anclas `envios`, `devoluciones` y `pagos` son las `id` de `politicas` -->
<script setup>
import { GbTrust02 } from '@grana/blocks/ecommerce'
import { GbPolicies01 } from '@grana/blocks/booking'

const politicas = {
  title: 'Envíos, devoluciones y pagos',
  items: [
    { id: 'envios', title: 'Envíos', summary: 'Sale del taller en dos días hábiles.', body: 'Enviamos por Estafeta a todo México.\n\nEl costo se calcula con tu código postal.' },
    { id: 'devoluciones', title: 'Devoluciones', summary: '30 días, con la pieza sin usar.', body: 'Escríbenos y recogemos la pieza.' },
    { id: 'pagos', title: 'Pagos', summary: 'Tus datos de pago no pasan por la tienda.', body: 'El pago lo procesa la pasarela de la tienda.' }
  ]
}
</script>

<template>
  <GbTrust02 v-bind="promesas" />
  <GbPolicies01 v-bind="politicas" />
</template>
```

Quien importa las dos secciones carga las dos entradas (`@grana/blocks/ecommerce` y `@grana/blocks/booking`). Si una tercera familia lo pide, la política se mudará a una entrada común sin cambiar su API (hallazgo EC-L5).

### Marcas de pago sin logotipos mudos

Si tu aplicación quiere mostrar las marcas de pago, cada una lleva su nombre en texto: nunca una imagen sin nombre dentro de la promesa (contrato `trust.md`, «Estructura accesible»). El slot `item` es el escape del cuerpo de la promesa: ahí puedes poner las marcas de la promesa de pago.

## Uso

```vue
<!-- Fragmento: `irA` es de tu aplicación -->
<script setup>
import { GbTrust01 } from '@grana/blocks/ecommerce'

const promesas = {
  title: 'Lo que te prometemos',
  description: 'Y dónde está escrito.',
  items: [
    { id: 'envios', icon: 'truck', title: 'Envío a todo México', description: 'Sale del taller en dos días hábiles.', policy: 'envios' },
    { id: 'devoluciones', icon: 'rotate-ccw', title: 'Devoluciones en 30 días', description: 'Sin preguntas, con la pieza sin usar.', policy: 'devoluciones' },
    { id: 'hecho-a-mano', icon: 'hand', title: 'Hecho a mano en Oaxaca', description: 'Cada pieza lleva el nombre de quien la hizo.', action: { label: 'Nuestros talleres', href: '/talleres' } },
    { id: 'pago', icon: 'lock', title: 'Pago seguro', description: 'Tus datos de pago no pasan por la tienda.', policy: 'pagos' }
  ],
  labels: { policy: (title) => `Ver la política: ${title}`, external: 'se abre en otra pestaña' }
}
</script>

<template>
  <GbTrust01 v-bind="promesas" @navigate="({ event, href }) => { event.preventDefault(); irA(href) }" />
</template>
```

`truck` y `hand` no son de la lista de la librería: tu aplicación los registra con `createIcons`. `rotate-ccw` y `lock` sí vienen con ella.

## Ejemplos

### e1 · Cuatro promesas bajo el héroe (`GbTrust01`)

**Por qué:** cuando la portada necesita dar confianza en una fila y sin tomar demasiado alto. Cada promesa es una tarjeta plana y compacta con su prueba al final. Para más de seis promesas, el bloque avisa (C7).

```vue
<!-- Fragmento: `promesas` es de tu aplicación -->
<GbTrust01 v-bind="promesas" />
```

### e2 · Promesas con más texto (`GbTrust02`)

**Por qué:** cuando cada promesa necesita dos líneas de descripción y quieres que se lean como piezas separadas, por ejemplo en la página «Sobre la tienda».

```vue
<!-- Fragmento: `promesas` es de tu aplicación -->
<GbTrust02 v-bind="promesas" />
```

### e3 · La confianza en el pie del carrito (`GbTrust03`)

**Por qué:** cuando quien está a punto de pagar necesita ver las mismas promesas en poco sitio, sin añadir encabezados a la página. Una lista compacta con el icono en línea.

```vue
<!-- Fragmento: `promesas` es de tu aplicación -->
<GbTrust03 v-bind="promesas" />
```

### e4 · Una promesa que se prueba con una página

**Por qué:** cuando la prueba no es una política sino otra página («Nuestros talleres»). `action` gana a `policy` y emite `navigate` con clic primario; sin `href` sería un botón con `activate`.

```vue
<!-- Fragmento: `router` es de tu aplicación -->
<GbTrust02 v-bind="promesas" @navigate="({ event, href }) => { event.preventDefault(); router.push(href) }" />
```

## Props

Una sola interfaz para las tres variantes (`GbTrustProps`). Los tipos de datos salen de `@grana/blocks/ecommerce`.

| Prop | Tipo | Descripción |
| --- | --- | --- |
| `title` | `string` (requerida) | El título de la sección (de la `GSection`). |
| `description` | `string` | Descripción de la `GSection`; el slot `description` la sustituye. |
| `items` | `Incentive[]` (requerida) | 1 a 6 (C7 por encima de 6); sin `title` se omite (C2). La prueba: `action` o, sin ella, `policy` (ancla `#policy`). |
| `labels` | `TrustLabels = {}` | `policy` (con alguna promesa con `policy` y sin `action`) y `external`; sin valores por defecto (C5). |

## Eventos

| Evento | Carga | Cuándo |
| --- | --- | --- |
| `navigate` | `{ event, href, item }` (`BlockNavigate<Incentive>`) | La prueba de una promesa: `action` con `href` o el ancla `#policy`, con clic primario (un ancla de la página también emite); nunca con `external` |
| `activate` | `{ event, item: incentive }` (`BlockActivate<Incentive>`) | Una `action` sin `href` |

## Slots

| Slot | Alcance | Qué va |
| --- | --- | --- |
| `item` | `{ item: Incentive }` | Escape: el cuerpo de una promesa |
| `description` | — | Sustituye a la prop `description` de la `GSection` |

## Textos (`labels`)

| Clave | Requerido |
| --- | --- |
| `policy` | Sí, con alguna promesa con `policy` y sin `action` (C5; sin él, sin enlace). Texto o función `(title) => string` |
| `external` | Sí, con una prueba externa (C5) |

## Teclado y foco

| Tecla | Efecto |
| --- | --- |
| `Tab` | Una parada por prueba (enlace o botón) |
| `Intro` | Sigue el enlace (en un ancla `#policy` emite `navigate`) o activa el botón (`activate`) |

## Accesibilidad

Cifras de la auditoría de coco ([`design/lab/blocks/ecommerce/auditoria.md`](../../../../../design/lab/blocks/ecommerce/auditoria.md)), tres motores, tres temas, claro y oscuro (`medido`):

a. La lista es real (`role="list"` con `listitem`, o `ul`); el icono es `aria-hidden` y la prueba es un enlace con su texto («Ver la política: Envío a todo México») (`prueba`, Vitest).
b. 03 no usa encabezados por promesa; en 01 y 02 el título de cada tarjeta baja un nivel por anidación.
c. Los enlaces de prueba (`GBtn variant="link"`) que se parten en dos líneas se alinean al inicio, igual que el título y la descripción (EC-C2, corregido en `GBtn.css`; `medido`).
d. Títulos sin recorte a la vista en 01 a 390 tras `titleLines="none"` y la pista (EC-B1, EC-B3): verificador de coco corrido por bruno tras su remate, 3 266 de 3 275 en la familia con los 9 fallos restantes solo de PO-L1, CR-L1 y CK-L1 (DECISIONS #945; `medido`).
e. Sin desplazamiento horizontal a 1440, 390, 320 ni a 320 con el texto al 200 %.

> **Peligro.** Una promesa sin `action` ni `policy` se pinta sin enlace (PR1): la persona lee «Devoluciones en 30 días» y no encuentra dónde está escrito. Y un `policy` cuyo `id` no existe en tu página es un ancla que no lleva a ningún sitio: el bloque no lo puede comprobar.

## Personalidad

Nada se mueve. La personalidad es de contenido: la promesa y su prueba juntas, en palabras. Con movimiento reducido no cambia nada.

## Avisos de desarrollo

Prefijo `[Grana GbTrust<NN>]`, una vez por instancia y motivo, solo en desarrollo. Los comunes (C1 a C8, EC1 a EC7) están en [`packages/blocks/README.md`](../../../README.md#avisos-comunes-de-ecommerce). El propio:

| Código | Motivo | Qué pasa |
| --- | --- | --- |
| PR1 | Una promesa sin `action` ni `policy` | Se pinta sin prueba (una vez por instancia) |

## Banco de datos de ejemplo

`trust.bank.js` exporta `{ props, appIcons }` con Barro y Agave: cuatro promesas, tres con su política (`envios`, `devoluciones`, `pagos`, el ancla de `GbPolicies`) y una con su prueba propia (los talleres, `action`); `labels.policy` como función y `external`. `appIcons` (`truck`, `hand`) son los iconos que tu aplicación registra con `createIcons`. Con él ninguna variante avisa. Banco real: `packages/blocks/playground/ecommerce/trust.html`.

## Peso

`dist/ecommerce.js` pesa **49 328 B gzip** con sus trozos compartidos (`medido` con `node packages/blocks/scripts/measure-entry.mjs ecommerce`, 2026-10-26); tope de la entrada **51 200 B** (DECISIONS #932; no se vuelve a subir). Una variante importada sola (`node packages/blocks/scripts/measure-partial.mjs 7168 ecommerce GbCheckout=9728 +cartTotals=2048`): `GbTrust01` 2 746 B, `GbTrust02` 2 711 B, `GbTrust03` 2 653 B; tope por variante **7 168 B** (#932). `@grana/vue` es *peer*: lo paga la aplicación.

## Alcance

- **Sin sellos ni logotipos mudos:** no hay insignias de «compra segura» dibujadas; las marcas de pago, si las quieres, llevan su nombre en texto.
- **No alberga las políticas:** el texto legal es [`GbPolicies`](../GbPolicies/README.md) de `@grana/blocks/booking`, que no se reexporta (una sección, una entrada; EC-L5).
- **No comprueba el ancla:** `policy` apunta a un `id` que tu página debe tener.
- **Sin CSS ni utilidades** (#763, #807).

## Verificación

| Qué | Resultado | Nivel |
| --- | --- | --- |
| Vitest de `GbTrust` (lista real; icono decorativo; la prueba de `policy` como enlace a `#{policy}` con `labels.policy`; `action` gana a `policy`; 03 sin encabezados; PR1 una vez; C5 sin `labels.policy`) | `npm test -w @grana/blocks` pasa **1 463 de 1 463** en 40 archivos (todo el paquete, 2026-10-26) | `prueba` |
| Auditoría de coco: 01, 02 y 03; enlaces al inicio (EC-C2); veredicto `candidate` tras el remate de bruno | Al auditar (0aa51df): Chromium 3 248 de 3 275, Firefox 3 189 de 3 216, WebKit 3 188 de 3 216, con EC-B3 y EC-B1 abiertos; tras el remate de bruno (b663be5), 3 266 de 3 275 en la familia y EC-B1 y EC-B3 cerrados (#945) | `medido` |

**No verificado:** lector de pantalla real (la lista de promesas y el nombre de los enlaces de política); `forced-colors` real y en Firefox y WebKit; teléfono real; rendimiento con el perfilador. **Pendientes abiertos:** EC-L5 (políticas en una entrada común); **pista de 01** (el contrato dice `g-adapt-short`; el `meta.json` y el código usan `g-adapt-standard` tras EC-B3; derivado a lima para alinear el contrato); los generales, en [`PENDIENTES.md`](../../../../../PENDIENTES.md).

## Fuentes

- Contrato: [`design/contracts/blocks/trust.md`](../../../../../design/contracts/blocks/trust.md) y [`_comun.md`](../../../../../design/contracts/blocks/_comun.md) (§26 a §39).
- Decisiones: #909 a #914, #926, #932 en `DECISIONS.md`.
- Metadatos: [`GbTrust.meta.json`](./GbTrust.meta.json). Pruebas: [`GbTrust.test.js`](./GbTrust.test.js). Auditoría: [`design/lab/blocks/ecommerce/auditoria.md`](../../../../../design/lab/blocks/ecommerce/auditoria.md).
