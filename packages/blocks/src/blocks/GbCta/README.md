# GbCta · GbCta01, GbCta02 y GbCta03

La llamada a la acción de la página, **una sola** además del héroe: el título, una frase, una o dos acciones y lo que quita la duda antes de pulsar la principal. En una banda de marca, en una tarjeta con foto o en una línea sobria. El bloque compone `GSurface`, `GSection`, `GStack`, `GCard`, `GDivider`, `GBtn` y `GText`; no trae color, CSS ni textos propios (el tema lo pone y lo que no viene en tus datos va en `labels`).

**Etiquetas:** `<gb-cta-01>`, `<gb-cta-02>`, `<gb-cta-03>` · **Estado:** `candidate` (ver «Verificación») · **Desde:** `0.0.0` (paquete privado, aún sin publicar) · **Entrada:** `@grana/blocks/marketing`

```js
import { GbCta01, GbCta02, GbCta03 } from '@grana/blocks/marketing'
```

> `@grana/blocks` es privado (`0.0.0`) y no se publica con la beta `0.1.0` de `@grana/vue`. Por ahora se usa desde el repositorio (banco real en `packages/blocks/playground/marketing/cta.html`, una variante por carga con `?v=01|02|03`). Exige `@grana/vue` (peer, `>=0.1.0-beta.0 <1.0.0`) y Vue `^3.5.0`. Reglas comunes e instalación: [`packages/blocks/README.md`](../../../README.md).

## Qué lo hace distinto

**Dice qué pasa después, y es una sola** (DECISIONS #822). La línea `assurance` responde la pregunta que frena justo antes de pulsar (¿me cobran?, ¿quién me contesta?, ¿cuándo?) y está **ligada al botón principal** para el lector de pantalla con `aria-describedby`, no suelta en la página: quien llega a «Reservar» oye también «Sin pago ahora». Y el bloque defiende que la llamada sea una: si la página monta una segunda banda de marca, avisa.

## Las tres variantes

Las tres reciben la misma `interface Props` (`GbCtaProps`, el mismo objeto `props` de `props.js`). Lo que una forma no usa, lo ignora.

| Variante | Concepto | Compone | Usa | Ignora |
| --- | --- | --- | --- | --- |
| `GbCta01` | Banda de marca: una banda de tinta con la acción invertida | `GSurface zone="brand" level="flat" padding="lg"` (raíz) > `GSection` > `GStack orientation="horizontal" gap="sm"` con las acciones (`solid` + `outline`) + `assurance` | `title`, `description`, `actions`, `assurance` | `media` |
| `GbCta02` | Tarjeta con imagen: la acción en una tarjeta con la foto al lado | `GCard as="section" orientation="auto" mediaPosition="start"` (raíz): `media` en su hueco, título al nivel de la sección, acciones en `actions`, `assurance` en el `footer` | todas | — (sin `media`, tarjeta sin foto) |
| `GbCta03` | Línea sobria: sin superficie, un divisor y la sección con su acción al final de la fila del título | `GStack gap="md"` (raíz) > `GDivider decorative` + `GSection` (acciones en su slot `actions`) + `assurance` en el cuerpo | `title`, `description`, `actions` (`solid` + `link`), `assurance` | `media` |

- **Acciones por posición:** como mucho dos; la primera es la principal (`solid`), la segunda la secundaria (`outline` en 01 y 02, `link` en 03). A partir de la tercera se ignoran (aviso C8). El dato no dice cuál manda.
- **Banda a sangre (01):** dentro de un `GContainer`, `class="g-bleed"` va en la raíz y llega por `$attrs`. La banda es `flat`: sin borde ni radio.

## Dónde va `GText`

`GText` es la primitiva de texto suelto de `@grana/vue` ([`GText/README.md`](../../../../vue/src/components/GText/README.md)). Aquí envuelve la línea `assurance`, con el `id` en su raíz:

| Variante | Texto suelto | `GText` |
| --- | --- | --- |
| 01 (banda de marca) y 03 (línea sobria) | `assurance` | `size="body-sm" tone="muted" :id` (igual que la descripción de la sección; en la zona de marca, `muted` es el de la zona) |
| 02 (tarjeta) | `assurance` en el `footer` de la tarjeta | `size="caption" tone="muted" :id` (el rol del pie de la tarjeta) |

- **Sin `assurance`, no hay `GText`:** una `GText` vacía no se pinta, y el bloque tampoco la monta.
- **El `id` va en la raíz de la `GText`**, y el `GBtn` principal apunta a él con `aria-describedby` (solo la **primera** acción; #838).
- Con el `p` desnudo, `assurance` salía más grande que la descripción que apoya; con `GText`, no es mayor que ella en los tres temas medidos.

## Uso

```vue
<script setup>
import { GbCta01 } from '@grana/blocks/marketing'

const cta = {
  title: 'Reserva directo y te esperamos con mezcal',
  description: 'Las mismas habitaciones que en las agencias, con desayuno incluido y la copa de bienvenida.',
  actions: [
    { id: 'reservar', label: 'Reservar', href: '/reservar' },
    { id: 'whatsapp', label: 'Escríbenos por WhatsApp', href: 'https://wa.me/529510000000', external: true }
  ],
  assurance: 'Sin pago ahora · Respuesta por WhatsApp en menos de 2 h',
  labels: { actions: 'Reservar o escribir', external: 'se abre en otra pestaña' }
}

function onNavigate({ event, href, item }) {
  event.preventDefault() // item es la acción
  // router.push(href)
}
</script>

<template>
  <GbCta01 v-bind="cta" @navigate="onNavigate" />
</template>
```

El mismo `cta` sirve para `GbCta02` (que además usa `media`) y `GbCta03`.

## Ejemplos

### e1 · El cierre de la página en una banda (`GbCta01`)

**Por qué:** cuando la llamada es lo último que quieres que haga la persona. Es la banda de tinta de marca de la página: una por página. Si montas también `GbStats02`, avisa A2.

```vue
<GContainer>
  <GbCta01 v-bind="cta" class="g-bleed" />
</GContainer>
```

### e2 · Una llamada con foto (`GbCta02`)

**Por qué:** cuando una imagen vende más que el texto (la mesa servida, la habitación). Sin `media` se pinta como tarjeta sin foto; con ella pasa a dos columnas si cabe y apila en estrecho.

```vue
<GbCta02
  v-bind="cta"
  :media="{ src: '/fotos/mezcal.jpg', width: 1200, height: 900, alt: 'Copa de mezcal en la terraza' }"
/>
```

### e3 · Una llamada sin superficie (`GbCta03`)

**Por qué:** cuando la página ya lleva banda de marca en el héroe o en Stats y no quieres otra. Un divisor, el título con la acción al final de la fila y la garantía debajo. `labels.actions` es obligatorio aquí: nombra el grupo de acciones del encabezado.

```vue
<GbCta03 v-bind="cta" />
```

### e4 · Tus propios botones (slot `actions`)

**Por qué:** cuando una acción abre un diálogo o necesita algo que los datos no cubren. El slot sustituye a los botones generados y te pasa el `id` de `assurance`; tú pones `aria-describedby` en tu principal y cuidas la jerarquía.

```vue
<GbCta01 v-bind="cta">
  <template #actions="{ describedby }">
    <GBtn variant="solid" :aria-describedby="describedby" @click="abrirReserva">Reservar</GBtn>
  </template>
</GbCta01>
```

## Props

Una sola interfaz para las tres variantes (`GbCtaProps`). `Action` y `Media` salen de `@grana/blocks/marketing`.

| Prop | Tipo | Descripción |
| --- | --- | --- |
| `title` | `string` (requerida) | El título (de la sección en 01 y 03; de la tarjeta, al nivel de la sección, en 02) |
| `description` | `string` | Una frase; el slot `description` la sustituye |
| `actions` | `Action[]` (requerida) | De 1 a 2: la primera es la principal. Vacía: aviso A1 y se pinta sin acción |
| `assurance` | `string` | Lo que pasa después («Sin pago ahora · Respuesta por WhatsApp en menos de 2 h»); describe la acción principal |
| `media` | `Media` | La foto de la tarjeta; solo la usa `GbCta02` |
| `labels` | `{ actions?: string; external?: string } = {}` | `actions` nombra el grupo de acciones del encabezado (requerido en 03); `external` («se abre en otra pestaña»), requerido con una acción externa (C5) |

`Action` es `{ id?, label, href?, icon?, external? }`. `Media` es `{ src, srcset?, sizes?, width, height, alt?, decorative?, credit? }`.

## Eventos

| Evento | Carga | Cuándo |
| --- | --- | --- |
| `navigate` | `{ event, href, item }` (`BlockNavigate<Action>`) | Activación primaria de una acción con `href` no externa; `item` es la acción |
| `activate` | `{ event, item }` (`BlockActivate<Action>`) | Una acción sin `href` (por ejemplo, abrir el diálogo de reserva); `item` es la acción |

Una acción `external` no emite `navigate`; `tel:`, `mailto:` y `sms:` tampoco.

## Slots

| Slot | Alcance | Qué va |
| --- | --- | --- |
| `actions` | `{ describedby: string \| undefined }` | Escape: sustituye a los botones generados. `describedby` es el `id` del texto de `assurance`, o `undefined` sin él |
| `description` | — | Sustituye a la prop `description` |

## Textos (`labels`)

| Clave | Uso | Requerido |
| --- | --- | --- |
| `actions` | Nombre del grupo de acciones del encabezado | Sí, en 03 (sin él avisa `GSection`) |
| `external` | «se abre en otra pestaña» | Sí, con una acción `external` (C5) |

## Accesibilidad

Cifras de la auditoría de coco ([`design/lab/blocks/marketing/auditoria.md`](../../../../../design/lab/blocks/marketing/auditoria.md)) sobre las 27 variantes de Marketing, tres motores, tres temas, claro y oscuro:

a. `aria-describedby` del `GBtn` principal apunta al `id` de `assurance`, y solo en ella (`prueba`, Vitest). Con el slot `actions`, la aplicación lo repite con el `describedby` que recibe.
b. Contraste de todo el texto pintado de Marketing de 4,68:1 como mínimo, también la acción principal invertida dentro de la banda de marca de 01 (`medido`, auditoría, tres temas).
c. `assurance` con el rol del tema (`body-sm` o `caption`) y no mayor que la descripción (MK-L1 en 0; `medido`, 4327/4327).
d. Los enlaces de texto (`GBtn variant="link"`, como la acción secundaria de 03) pasan 2.5.8 por la excepción de separación (`medido`, MK-N2).
e. Una acción externa lleva su nombre en el control, «{label}, {labels.external}» (#832; `prueba`).
f. Sin desplazamiento horizontal a 1440, 390 y 320 px, ni a 320 con el texto al 200 % (`medido`, auditoría). En 01, banda `flat` sin radio ni borde lateral (#830).
g. Nada se mueve (regla 10 de `_comun.md`); el giro de carga de un `GBtn` es del botón, auditado aparte.

> **Peligro.** Con el slot `actions` sustituyes los botones generados y el vínculo de `assurance` se pierde si no pones `:aria-describedby="describedby"` en tu acción principal: la persona que usa lector de pantalla ya no oye «Sin pago ahora» al llegar al botón. Y `labels.actions` en 03 no es opcional: sin él, el grupo de acciones del encabezado queda sin nombre.

## Avisos de desarrollo

Prefijo `[Grana GbCta<NN>]`, una vez por instancia y motivo, solo en desarrollo.

| Código | Motivo | Qué pasa |
| --- | --- | --- |
| C2 | Una acción sin `label` | Esa acción se omite |
| C4 | En 02, `media` sin `width`/`height` o sin `alt` ni `decorative` | Se pinta con `alt=""` y sin reservar hueco |
| C5 | Falta `labels.external` con una acción externa | Se pinta sin ese texto |
| C6 | Un `href` con esquema `javascript:` | La acción es un `GBtn` deshabilitado, sin enlace |
| C8 | Más de dos acciones | Se pintan las dos primeras |
| A1 | `actions` vacío | Se pinta sin acción (una llamada sin acción no sirve) |
| A2 | Más de un `GbCta*` en el documento, o un `GbCta01` junto a un `GbStats02` (dos bandas de marca, al montar) | Se pintan todos |

## Banco de datos de ejemplo

`cta.bank.js` exporta `{ props, slots }`: «Reserva directo y te esperamos con mezcal», una descripción con una palabra larga sin espacios, dos acciones («Reservar» con `href` interno y «Escríbenos por WhatsApp», externa), `assurance`, una `media` de 1200 por 900 y `labels` completos. Montado solo, ninguna variante avisa; **dos `GbCta` en un mismo documento avisan A2**, por eso el playground las monta de una en una (`?v=`).

## Peso

`dist/marketing.js` pesa **17 446 B gzip** (`medido`, 2026-10-22, según `GbCta.meta.json`; tope conjunto de la entrada **18 432 B**, DECISIONS #844). Una variante importada sola (esbuild minificado, `vue` y `@grana/vue*` externos): `GbCta01` 1896 B, `GbCta02` 2119 B, `GbCta03` 1899 B; tope por variante 4096 B. `@grana/vue` es *peer*: lo paga la aplicación.

## Alcance

- **Una llamada por página** (R5): una banda de marca por página además del héroe; A2 lo vigila.
- **Sin CSS ni utilidades** (#763, #807). Las únicas clases que escribe son las pistas de `GAdaptiveLayout`; la banda a sangre es `g-bleed` en tu raíz.
- **Banda redondeada dentro de la columna:** reservada (B-L7, #830). Las bandas de los bloques son `flat`.
- **Sin `fetch`, sin estado de negocio, sin región viva propia** (#780, #792).

## Verificación

| Qué | Resultado | Nivel |
| --- | --- | --- |
| Vitest de `GbCta` (tres variantes con el mismo banco, sin avisos, `props` compartidas, `aria-describedby` solo en la principal, `assurance` como `GText` con el `size` del reparto, slot `actions` con `describedby`, 01 en zona de marca y `flat`, 02 con el título al nivel de la sección, 03 con el grupo nombrado, A2, `navigate`/`activate`, SSR) | 46/46 (`npm test -w @grana/blocks`, 2026-10-22) | `prueba` |
| Verificador propio de la familia con `GText` real, 27 variantes, tema por defecto, rústico y lujo, claro y oscuro (1 `GText` real en CTA 01 y 1 en CTA 02, 0 `p` desnudos) | 4327/4327 en Chromium, Firefox y WebKit (coco, addendum de `design/lab/blocks/marketing/auditoria.md`, tras baea37f) | `medido` |
| Veredicto de coco | CTA puede pasar a `candidate`: MK-L1 en 0; MK-C3 cerrado | auditoría |

**No verificado:** lector de pantalla real (que «Sin pago ahora» se oiga al llegar al botón por `aria-describedby`); `forced-colors` en Firefox y WebKit; teléfono real y puntero grueso.

**Pendientes abiertos:** ninguno de la auditoría afecta a CTA. B-L1 a B-L7 en `design/contracts/blocks/_comun.md` §11.

## Fuentes

- Contrato: [`design/contracts/blocks/cta.md`](../../../../../design/contracts/blocks/cta.md) y [`_comun.md`](../../../../../design/contracts/blocks/_comun.md) (§11 B-L5, reparto de `GText`).
- Decisiones: #815 a #817, #822, #830, #832, #838, #841, #844, #851 a #856 en `DECISIONS.md`.
- Metadatos: [`GbCta.meta.json`](./GbCta.meta.json). Pruebas: [`GbCta.test.js`](./GbCta.test.js). Auditoría: [`design/lab/blocks/marketing/auditoria.md`](../../../../../design/lab/blocks/marketing/auditoria.md).
